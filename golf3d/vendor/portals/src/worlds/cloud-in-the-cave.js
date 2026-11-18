// CLOUD IN THE CAVE: the largest cave passage on Earth at the hour its sunbeam falls. THE FLIGHT IS CUT IN THREE ACTS.
// ACT 1, THE LIT CAVE (to the mouth, 452 m flown): in low over a dark lamp-streaked river past a camp's two lit tents and
// a tiered tower in the camp lamp's gold, then up a giant's staircase of rimstone pools that carries the floor all the
// way to the mouth, the line 9 to 16 m over it. Each stretch has its own subject: over the first terraces THE ROOF
// COMES DOWN (a 90 to 190), a hanging field of stalactites and draped curtains lit gold from the pool a caver's lamp
// is turned into and turquoise from the pools; then the two great tiered towers and the passage between them; then
// the level turquoise lake with A FALL that comes white out of the right wall into it, a broad bell of flowstone, a
// leaning stalagmite with a broken top and a cluster of candles standing in and beside it; then a wall of draperies
// on the left over the river's foaming cascade, and the last steep stairs past a column joined to the roof and an
// organ of pipes to the mouth, the day lying on the roof ahead and a bright bank of cloud in the mouth. The cave's
// air is clear, its roof and far walls a deep blue (no corner black); what is lit is lit by lamps (gold) and by
// pools that glow from within (turquoise and jade); every caver stands in the warm pool of his own lamp.
// ACT 2, THE REVEAL AND THE DOME: the mouth is a dark frame; beyond it the fallen dome, a pillar of separate sunbeams
// under the roof's opening, white cloud in banks and streamers low over a jungle and pouring slowly over the threshold,
// and on the far honey wall a broad white fall, whole from the rounded rock it springs from to its pool.
// ACT 3, THE POOLS UP THE BANK AND THE RING: down through the sunbeams' foot to the turquoise pool at the fall's foot
// (the line crosses it 8 m over the water, the fall to the left, white birds low over it), and from the pool's far
// shore straight up a staircase of travertine pools in the day, white water over their lips, ferns, boulders and
// flowering bushes on their rims, trees in coral and pink flower and a great buttressed tree beside them, 7.4 to
// 10.5 m under the line all the way, to the top pool under the wall's hanging garden, where a second, slender fall
// comes down beside the ring; the ring stands between two strangler figs on its shelf just beyond.
//
// PLACE. Heights are metres above the river at the start. Everything is laid out in "axis coordinates": a = metres along the
// passage axis (straight for 330 m heading -Z, then an arc 25 degrees to the right over 140 m, then straight on), l = metres
// to the right of it. The flown line keeps to the axis in the straight passage, so there a is also the metres flown (s).
// The dome is an oval room on the axis from a 470 to a 770; the skylight is over a 590, l 45; the mound's top is under it;
// the fall comes down the left wall at a 570 and the ring stands on a shelf against the same wall at a 706.
// LIGHT. No scene light reaches the rock: one family of shaders works the light out by place: (a) the dome's daylight, which
// falls off fast up the passage (the mouth is a dark frame) and rims what faces it, with a wet sheen; (b) the shaft: a
// slanted prism under the skylight in world coordinates, soft-edged and broken into beams, and the warm light its foot
// gives back to the dome; (c) the lamps as uniforms (two tents, twelve or thirteen lit head lamps that stand steady, and the
// ring's own glow), each a pool with a falloff cut at its reach and a wide warm wash about it; the pools that glow from
// within; a cool deep-blue light that every wet face of the passage gives every other; (d) the air: a thin haze by
// distance toward the glow of the place. There is no layer of mist in the cave. In the dome's hollow, behind the
// threshold, a thin ground mist lies between the trunks (SEA in the code: air that every shader thickens a little
// between its foot and its top); the cloud that is seen is soft sprites in banks. The kit's plants take the same shaft,
// shade and air through a patch on the kit's own material (the scene's two lights exist for them alone: one sun, one sky).
// MOTION is on the world's clock everywhere (river, spilling terraces, rings on the pools, the tents' glow, the cloud's
// banks, the pillar's drifting air, the threads from the skylight's rim, the fall, birds, butterflies, the forest's
// wind and gusts, light flecks); nothing happens at a place: every thing is there from the first moment to the last.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2, RAD = Math.PI / 180;
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const sat = (x) => clamp(x, 0, 1);

// ---------------------------------------------------------------- the plan (pure functions of place)
const RB = 320.9, TH1 = 25 * RAD;                                   // the bend: 25 degrees to the right over 140 m
const BEND_END = { x: RB * (1 - Math.cos(TH1)), z: -330 - RB * Math.sin(TH1) };
function axisAt(a) {
  if (a <= 330) return { x: 0, z: -a, hx: 0, hz: -1 };
  if (a <= 470) { const t = (a - 330) / RB; return { x: RB * (1 - Math.cos(t)), z: -330 - RB * Math.sin(t), hx: Math.sin(t), hz: -Math.cos(t) }; }
  const hx = Math.sin(TH1), hz = -Math.cos(TH1); return { x: BEND_END.x + hx * (a - 470), z: BEND_END.z + hz * (a - 470), hx, hz };
}
// axis coordinates -> world x, z
function W2(a, l, out = [0, 0]) { const f = axisAt(a); out[0] = f.x - f.hz * l; out[1] = f.z + f.hx * l; return out; }
// world x, z -> axis coordinates
function toAxis(x, z, out = { a: 0, l: 0 }) {
  if (-z <= 330) { out.a = -z; out.l = x; return out; }
  const t = Math.atan2(-(z + 330), RB - x);
  if (t <= TH1 && t >= 0) { out.a = 330 + t * RB; out.l = RB - Math.hypot(x - RB, z + 330); return out; }
  const hx = Math.sin(TH1), hz = -Math.cos(TH1), dx = x - BEND_END.x, dz = z - BEND_END.z;
  out.a = 470 + dx * hx + dz * hz; out.l = dx * -hz + dz * hx; return out;
}

const DOME = { a: 620, l: 25, A: 150, B: 115 };                      // the oval room: centre and half axes (along, across)
const SKY = { a: 590, l: 45, r: 65, y: 170 };                        // the skylight: centre, mean radius, rim height
const MOUND = { a: 615, l: 60, A: 120, B: 100, h: 90 };              // the hill of fallen blocks
const SPUR = { a: 718, l: -55, h: 70, slope: 0.3 };                  // the bank against the north-west wall
const SHELF_Y = 62, RING = { a: 706, l: -50, y: SHELF_Y + 7.6 };     // the ring's centre (the line comes to it heading some 19 degrees left of the axis)
const ALCOVE = { a: 729, l: -58, r: 15, y1: 100, depth: 26 };        // the side alcove in the wall behind the ring: its mouth's middle on the wall, half width, top, depth
const FALL_A = 570;                                                  // the fall: on the dome's left wall, this far along the axis
const CFALL = { a: 300, drop: 38, y: 0 };                            // the cave's fall: on the right wall's buttress beside the lake, this far along the axis; its drop (m); y: the lake's level there (set below)
const HANG = { a0: 82, a1: 112, a2: 176, a3: 204 };                  // the roof that comes down over the first staircase: where it sinks, where it is whole, where it lifts again
const SUN_AZ = 72 * RAD, SUN_EL = 58 * RAD;                           // one sun, one hour: a February morning about eleven
// THE MIST (SEA in the code): a thin layer of wet air that lies in the hollow of the dome behind the threshold, between the
// trunks, and nowhere in the cave: its near end is at the mouth (-z 432 to 462, the threshold's far slope), it thins from
// a 540 and is gone by a 588, and its top stands at 22 m: under the threshold's top (39 m) and under the line everywhere
// (the line is lowest over the pool, at 23 m), 5 to 8 m over the hollow's ground. The cloud that is seen is not this
// layer but the banks that ride over the forest's roof (the wisps, below).
const SEA = { a0: 432, a1: 462, a2: 540, a3: 588, top: 22, drop: 3, max: 25 };
// THE TOWERS: eight great stalagmites (axis place of the foot, side of the axis, height, foot radius, lean; ly: the
// height at which its flank stands `gap` metres from the axis; form: what it is). The first two stand either side of the
// line at a 222 and a 236 (the passage between two towers); three stand in and beside the lake (a 288, 314, 322); one
// stands at the edge of the camp's bar with its foot in the river; two stand by the last staircase before the mouth.
// NO TWO ALIKE BUT THE THREE TIERED CONES (the two great ones and the camp's): the lake's three are a leaning stalagmite
// with a broken top (left, a 314), a broad bell of flowstone with a dripping skirt (left, a 288) and a cluster of slender
// candles (right, a 322); by the last staircase stand a column joined from the floor to the roof, with a waist (a 410),
// and a fluted organ of pipes (a 434).
const TOWERS = [
  { a: 222, side: -1, gap: 14, h: 62, r: 8, lean: 0, ly: 28.5, form: 'tiers' },
  { a: 236, side: 1, gap: 13, h: 78, r: 10, lean: 0, ly: 29.5, form: 'tiers' },
  { a: 314, side: -1, gap: 21, h: 46, r: 6.5, lean: 11 * RAD, ly: 31.8, form: 'broken' },
  { a: 288, side: -1, gap: 17, h: 33, r: 5, lean: 0, ly: 31.2, form: 'bell' },
  { a: 322, side: 1, gap: 12, h: 44, r: 6, lean: 0, ly: 32, form: 'candles' },
  { a: 64, side: -1, gap: 22, h: 25, r: 5.5, lean: 0, ly: 9, form: 'tiers' },
  { a: 410, side: 1, gap: 0.5, h: 60, r: 4.5, lean: 0, ly: 48, form: 'column' },
  { a: 434, side: 1, gap: 2, h: 34, r: 4, lean: 0, ly: 53, form: 'organ' },
];
const COL_TOP = 100, COLXZ = W2(TOWERS[6].a, TOWERS[6].gap + 5.2);  // where the roof comes down to the column: the height of the join, and the place

// half widths of the passage either side of the axis, the roof, and the dome's oval laid over them
function wallsAt(a) {
  const k0 = smoothstep(100, 150, a);                                // the right wall stands some 40 m off at the start (its foot in the river: plain wet stone in broad forms, in the camp lamp's soft wash), then further back for the terraces
  let right = lerp(37, 72, k0) - 8 * smoothstep(240, 330, a) + 6 * Math.sin(a * 0.021 + 1.0);
  // THE BEND'S INNER CORNER: at a 385 the right wall comes in as one great buttress to 10 m right of the axis, so that from the
  // straight passage the dome's light is seen only as a glow round the corner; past it the dome opens whole
  right -= 55 * Math.exp(-Math.pow((a - 385) / 27, 2));
  // THE FALL'S BUTTRESS: at a 300 the right wall stands 30 m into the passage, to the lake's own shore; the cave's fall
  // comes out of an opening in its face
  right -= 30 * Math.exp(-Math.pow((a - CFALL.a) / 15, 2));
  let left = -(lerp(104, 72, smoothstep(40, 135, a)) + 5 * Math.sin(a * 0.017 + 4.0));
  let roof = 168 + 14 * Math.sin(a * 0.011 + 0.6) + 8 * Math.sin(a * 0.027 + 2.0);
  const t = (a - DOME.a) / DOME.A;
  if (Math.abs(t) < 1) {
    const ch = DOME.B * Math.sqrt(1 - t * t), kd = smoothstep(470, 500, a);
    right = Math.max(right, DOME.l + ch); left = Math.min(left, DOME.l - ch);
    roof = lerp(roof, 186, kd);
  }
  if (a > DOME.a) {                                                  // past the middle of the room there is no passage: the oval alone
    const ch = Math.abs(t) < 1 ? DOME.B * Math.sqrt(1 - t * t) : 0;
    right = DOME.l + ch; left = DOME.l - ch;
  }
  return { left, right, roof };
}

// the flown line in axis coordinates (a, l, height): the river, the staircase, the mouth, the pool, the bank and the ring.
// THE CUT, in three acts. ACT 1 (to the mouth, a 452): low over the river (9 m) to a 60, then up the giant's staircase of
// rimstone pools, 9 to 16 m over it all the way: under the roof that comes down (a 90 to 190), between the two towers
// at a 222 and 236, over the level lake with its fall, its bell, its broken stump and its candles (a 250 to 330), up
// the steep stairs past the draperies on the left wall (a 349 to 392), the column and the organ (a 410, 434) to the
// mouth. ACT 2: over the threshold into the dome, the pillar of sun ahead and the fall on the left wall. ACT 3: down
// through the pillar's foot to the turquoise pool at the fall's foot (a 566, 8 m over it, the fall to the left), then
// nearly straight up the bank's staircase of pools (the line climbs from 23 m to 70 m over 155 m, 7.4 to 10.5 m over
// the water) to the ring on its shelf at a 706, which it meets heading some 19 degrees left of the axis.
const LINE = [
  [0, 0, 9], [30, 0, 9], [60, 0, 9], [100, 0, 13], [145, 0, 18.5], [190, 0, 25.5], [228, 0, 29.5], [262, 1, 30.5], [296, -3, 31.5],
  [328, -6.5, 32], [362, -10, 35.5], [394, -16, 44], [424, -20, 51.5], [452, -24, 55], [490, -29, 50], [528, -34, 38],
  [566, -48, 23.2], [596, -42, 30.5], [624, -37.5, 42.5], [652, -36.5, 55.5], [679, -41, 66.8], [RING.a, RING.l, RING.y],
];

// THE STAIRCASE'S CLIMB along the passage, in terraces: nine between a 110 and a 250, none over the lake (a 250 to 330),
// twenty-four up the steep stairs from a 330 to the threshold's top at a 448
const RAMP = [110, 250, 330, 448];
const ramp = (a) => 9 * smoothstep(RAMP[0], RAMP[1], a) + 24 * smoothstep(RAMP[2], RAMP[3], a);
// the rimstone terraces (gours) from a 80 to the threshold: a staircase of pools that comes down from the right wall to the
// line at the start and then fills the passage from the river's bank to the right wall, climbing with it
const GOUR = { n: 60, rise: [] };
{ let y = 0; for (let k = 0; k <= GOUR.n; k++) { GOUR.rise.push(y); y += 0.25 + 1.4 * Math.abs(Math.sin(k * 2.39 + 0.7)) * (0.35 + 0.65 * Math.abs(Math.sin(k * 0.9 + 2.0))); } }
const gourFoot = (a) => lerp(14, -5, smoothstep(70, 104, a)) - 21 * smoothstep(110, 215, a);       // the terraces' lowest edge: metres right of the axis
const LAKE = { a0: RAMP[1], a1: RAMP[2], l: 9, half: 31, f: 0 };    // the level lake: from a 250 to a 330, its middle 9 m right of the axis, 31 m to either shore; f: its terrace number
const lakeK = (a, l) => smoothstep(LAKE.a0 - 8, LAKE.a0 + 8, a) * (1 - smoothstep(LAKE.a1 - 8, LAKE.a1 + 6, a)) * (1 - smoothstep(LAKE.half - 7, LAKE.half + 5, Math.abs(l - LAKE.l)));
// the terrace coordinate: whole numbers are the dams' crests (the floor's shader carries the same field: gourF). The dams stand
// 4 m apart for the first 14 m from the terraces' foot and 10 m apart toward the wall; along the passage they stand 5 to
// 14 m apart by the climb. Inside the lake the coordinate is one number: one level pool
function gourNat(a, l) {
  const x = l - gourFoot(a), u = clamp((x - 14) / 28, 0, 1);
  return 0.6 + 0.10 * x + 0.16 * (Math.min(x, 14) + 28 * (u - u * u * u + 0.5 * u * u * u * u)) + ramp(a)
    + 0.8 * Math.sin(a * 0.105 + l * 0.06) + 0.35 * Math.sin(l * 0.21 - a * 0.045 + 1.7) + 0.1 * Math.sin(a * 0.38 + 2.0 * Math.sin(l * 0.3))
    + 0.17 * Math.sin(a * 0.27 - l * 0.19 + 2.1 * Math.sin(l * 0.13 + a * 0.07)) + 0.07 * Math.sin(a * 0.71 + l * 0.93);   // (no two dams run parallel for long: each wanders, pinches and bellies)
}
LAKE.f = Math.floor(gourNat(290, LAKE.l)) + 0.5;
function gourField(a, l) {
  const x = l - gourFoot(a), zone = smoothstep(74, 92, a) * (1 - smoothstep(452, 468, a)) * smoothstep(0, 6, x);
  const f = lerp(gourNat(a, l), LAKE.f, lakeK(a, l));
  return { f: clamp(f, 0, GOUR.n - 0.01), zone };
}
// the ground of the terraces is their mean slope; the dams and the level pools are drawn on it by the floor's shader
function gourHeight(f) { const k = Math.floor(f); return GOUR.rise[k] + (GOUR.rise[k + 1] - GOUR.rise[k]) * (f - k); }
CFALL.y = 1.2 + 0.011 * CFALL.a + gourHeight(LAKE.f);
// the river: the middle of its bed, its half width and its level. At the start the river is the whole floor: still black
// water from the camp's bar on the left to the foot of the right wall, under the line. From a 62 it draws away to the left
// (the terraces come down to the line from the right) and runs along the left wall's foot beside the staircase all the
// way to the threshold, where it comes out from under the fallen rock at a 446. It climbs with the staircase in level
// reaches some 40 m long, each a little under the terraces' foot, with a short white cascade between two reaches
const openK = (a) => 1 - smoothstep(62, 96, a);
const riverL = (a) => 9 * openK(a) - 20 * smoothstep(62, 100, a) - 26 * smoothstep(104, 160, a) + 3.5 * Math.sin(a * 0.019 + 0.4) * smoothstep(60, 140, a);
const riverHalf = (a) => (12 + 2 * Math.sin(a * 0.033)) * (1 - 0.6 * smoothstep(418, 446, a)) + 22 * openK(a);
const riverY = (a) => {
  const r = Math.max(ramp(a) - 0.9, 0) / 3.4, k = Math.floor(r);
  // (beside the steep stairs, from a 335 on, the river is a cascade: it comes down each step over two thirds of the
  // reach, a long rounded chute, with a short level pool between two chutes)
  return 0.011 * clamp(a, -100, 460) + gourHeight(clamp(3.4 * (k + smoothstep(lerp(0.82, 0.3, smoothstep(328, 348, a)), 1, r - k)), 0, GOUR.n - 1));
};
// how thick the forest stands at a place (0..1): the mound whole, the bank and the dome's floor thinly
function forestK(a, l) {
  if (a < 455) return 0;
  const rho = Math.hypot((a - MOUND.a) / MOUND.A, (l - MOUND.l) / MOUND.B);
  const rs = Math.hypot(a - SPUR.a, l - SPUR.l);
  return smoothstep(455, 500, a) * Math.max(1 - smoothstep(0.86, 1.06, rho), 0.7 * (1 - smoothstep(70, 125, rs)), 0.12);
}
const SHOULDER_Y = 76;                                              // the underside of the roof's low shoulder on the left (a 200 to 300)
// THE POOLS LIT FROM WITHIN up the staircase (axis place, radius): the lake whole, and three groups of pools on the steep
// stairs above it; two more lie among the first terraces (their places are the lamps' own, below)
const GLOWPOOLS = [{ a: 290, l: LAKE.l, r: 50 }, { a: 352, l: 10, r: 13 }, { a: 388, l: -2, r: 12 }, { a: 424, l: -6, r: 12 }];
const PEARL = { a: 98, l: 11, r: 4.2 };                            // the dried pool of cave pearls, among the first terraces
const CAMP = { a0: 20, a1: 84, l0: -30, l1: -62, y: 2.6 };          // the camp's sand terrace on the left bank

// natural ground before the flown line's corridor is cut into it. nz: a seeded noise (n2, fbm2)
function groundNatural(x, z, nz, ax = toAxis(x, z)) {
  const a = ax.a, l = ax.l, wl = wallsAt(a);
  const n1 = nz.fbm2(x * 0.021, z * 0.021, 3), n2 = nz.n2(x * 0.09 + 7.1, z * 0.09 - 3.3), n3 = nz.n2(x * 0.31, z * 0.31);
  const rl = riverL(a), rh = riverHalf(a), ry = riverY(a), dR = Math.abs(l - rl) - rh;      // metres outside the river's edge
  // the passage floor: the bed, gravel bars, then rubble rising to the foot of the walls
  const toWall = Math.min(l - wl.left, wl.right - l);
  let g = ry + (dR < 0 ? -1.6 * smoothstep(0, -6, dR) - 0.5 : 2.6 * smoothstep(0, 9, dR) - 0.5) + 1.4 * n1 * smoothstep(2, 20, dR) + 0.35 * n2 * smoothstep(0, 8, dR);
  g += 13 * Math.pow(1 - smoothstep(0, 34, toWall), 1.7) * (1 - openK(a) * smoothstep(rl - 30, rl - 10, l));   // (at the start the water lies to the right wall's own foot)
  // the camp bar: a level sand terrace 3 m over the river
  const camp = smoothstep(CAMP.a0 - 12, CAMP.a0 + 6, a) * (1 - smoothstep(CAMP.a1 - 4, CAMP.a1 + 14, a)) * smoothstep(CAMP.l0 + 7, CAMP.l0 - 3, l) * (1 - smoothstep(CAMP.l1 + 6, CAMP.l1 - 10, l));
  g = lerp(g, ry + CAMP.y + 0.12 * n2, camp);
  // the terraces
  const G = gourField(a, l);
  if (G.zone > 0) g = lerp(g, 1.2 + 0.011 * a + gourHeight(G.f), G.zone);
  const dp = Math.hypot(a - PEARL.a, l - PEARL.l);
  if (dp < PEARL.r + 2) g = lerp(g, 1.2 + 0.011 * a + gourHeight(gourField(PEARL.a, PEARL.l).f) + 0.1, 1 - smoothstep(PEARL.r - 0.6, PEARL.r + 1.6, dp));
  if (a > 440) {
    // the dome's floor: the mound under the skylight and the bank against the north-west wall, capped by the shelf. THE
    // THRESHOLD: the staircase tops out at a 452 (some 43 m), and beyond it the fallen rock goes down into the hollow at
    // the mound's foot (15 to 22 m), where the forest stands and the fall's pool lies
    const rho = Math.hypot((a - MOUND.a) / MOUND.A, (l - MOUND.l) / MOUND.B);
    const mound = rho < 1 ? MOUND.h * (1 - Math.pow(rho, 2.2)) * (1 + 0.1 * n1) + 4 * n2 * smoothstep(0, 0.4, rho) : 0;
    const rs = Math.hypot(a - SPUR.a, l - SPUR.l);
    const spur = Math.min(SPUR.h - SPUR.slope * rs + 2.5 * n1 * smoothstep(26, 60, rs) + 1.6 * n2 * smoothstep(28, 50, rs), SHELF_Y + 0.25 * n2);
    const dome = Math.max(mound, spur, 15 + 27 * (1 - smoothstep(456, 522, a)) + 5 * n1 + 2 * n2 + 0.8 * n3 * (1 - smoothstep(456, 522, a)));
    g = lerp(g, dome, smoothstep(450, 482, a));
  }
  return g;
}

// ---------------------------------------------------------------- shared GLSL: the light by place
const NL = 16;                                                       // lamps: two tents, up to thirteen head lamps that light the rock, and last the ring's own glow
const NPG = 6;                                                       // the pools that glow from within (two on the first staircase, the lake, three on the steep stairs)
const GL_NOISE = /* glsl */`
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=h31(i), b=h31(i+vec3(1,0,0)), c=h31(i+vec3(0,1,0)), d=h31(i+vec3(1,1,0));
  float e=h31(i+vec3(0,0,1)), g=h31(i+vec3(1,0,1)), h=h31(i+vec3(0,1,1)), k=h31(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z); }
`;
const GL_CAVE = /* glsl */`
#define NL ${NL}
#define NPG ${NPG}
uniform float uTime;
uniform vec3 uSunDir;            // toward the sun
uniform vec4 uSkyC;              // the skylight: x, rim height, z, mean radius
uniform vec4 uDomeM;             // the dome's middle: x, z, and the radius inside which the daylight is whole; w: falloff length
uniform vec3 uDayCol, uSunCol, uAirCol, uAirDome, uBounce, uSeaCol;
uniform vec3 uDayDome;           // the day under the roof opening itself: green-gold, the sky's light off a sunlit jungle
uniform vec3 uCool;              // the cool blue light every wet face of the passage gives every other: no rock is black
uniform vec2 uLampW[NL];         // each lamp's wash: its strength, and how far it reaches (m); a wide, soft, warm light all round the lamp
uniform vec4 uPoolG[NPG];        // the pools that glow from within: x, z, radius (m), the water's height
uniform vec4 uAirK;              // air density in the passage, in the dome, gain of the glow, spare
uniform vec4 uSea;               // the mist's layer: its top (m), how far the top sinks toward its near end (m), the density of a bank (to a metre), how soft the banks' edges are (1: the usual)
uniform vec4 uSeaA;              // its ends. Near (the passage runs along -z there): -z where the first veils lie, and where the layer is whole. Far: metres along the dome's axis where it thins, and where it is gone
uniform vec4 uSeaB;              // the dome's axis: its point at a 470 (x, z) and its heading (x, z)
uniform vec2 uDrift;             // the way the cave's air moves: toward the dome
uniform vec4 uWash[4];           // the lit flanks of the tallest tower and of the lake's three islands, for still water to mirror: x, z, and the heights each is lit between
uniform vec3 uWashC[4];
uniform vec4 uGlowP;             // where the pillar of sun stands on the forest (the middle of its lit pool), and how much of its light the lit leaves and the lit air give back
uniform vec4 uLampP[NL];         // place, reach
uniform vec4 uLampD[NL];         // direction, cosine of the half cone (-2: all round)
uniform vec3 uLampC[NL];
uniform vec4 uUp;                // the lamp-lit pool among the first terraces (x, y, z) and how far its light reaches up to the hanging roof over it
uniform vec4 uCFall;             // the cave's fall: its foot on the lake (x, the water's height, z), w 1
${GL_NOISE}
float upPassage(vec3 p){ return max(length(p.xz-uDomeM.xy)-uDomeM.z,0.0); }
// (the day: whole in the dome, falling off fast up the passage: the mouth is a dark frame; far up it a fifth is left, a blue glow)
float dayAt(vec3 p){ float d=upPassage(p)/uDomeM.w; return 0.24+0.76/(1.0+d*d); }
// the shaft of sun: the slanted round pillar under the skylight, soft at its edge
// (a place seen down the sun's own direction from the skylight: q is its offset from the hole's middle, the result the hole's radius that way)
float shaftRim(vec3 p, out vec2 q, out float t){
  t=(uSkyC.y-p.y)/uSunDir.y;
  q=p.xz+uSunDir.xz*t-uSkyC.xz;
  vec2 d=q/max(length(q),1e-3);                                      // (the rim's three and seven lobes, written out in the direction's own cosine and sine)
  float c=d.x, s=d.y, c2=c*c, s2=s*s;
  float c3=c*(4.0*c2-3.0), s3=s*(3.0-4.0*s2), c4=1.0-8.0*c2*s2, s4=4.0*s*c*(c2-s2);
  float c7=c3*c4-s3*s4, s7=s3*c4+c3*s4;
  return uSkyC.w*(1.0+0.07*(s3*0.5403+c3*0.8415)+0.05*(s7*-0.6536+c7*-0.7568));
}
// THE BEAMS. The rim's trees and lianas break the sun: inside the pillar the light comes down in several broad beams of
// unequal width and strength, soft at their edges, with darker air between them. A beam is the same all the way down the
// sun's own direction (q is the place seen down that direction), and sways a little as the trees do
float beamAtF(vec2 q, float f){                                       // (f: how fine the bundle is; 1 for the great pillar)
  q=q*f+vec2(31.0,17.0)*(f-1.0);
  vec2 sw=vec2(sin(uTime*0.11+q.y*0.03),cos(uTime*0.09+q.x*0.025))*1.6;
  float a=vn2((q+sw)*0.043+vec2(3.1,7.7)), b=vn2((q+sw*1.4)*0.097+11.0);
  float broad=smoothstep(0.36,0.60,a), fine=smoothstep(0.38,0.70,b);
  return 0.07+0.93*broad*(0.4+0.6*fine)+0.22*fine*(1.0-broad);
}
float beamAt(vec2 q){ return beamAtF(q,1.0); }
// how far inside the pillar's round a place is (1 inside, soft at the edge), whatever the beams there
float shaftIn(vec3 p){
  if(p.y>uSkyC.y+30.0) return 0.0;
  vec2 q; float t; float R=shaftRim(p,q,t), r=length(q);
  float soft=4.0+0.06*max(t,0.0);
  return 1.0-smoothstep(R-soft*1.6,R+soft*0.4,r);
}
// the sun at a place: the pillar's round times the beam that passes through it
float shaftAt(vec3 p){
  if(p.y>uSkyC.y+30.0) return 0.0;
  vec2 q; float t; float R=shaftRim(p,q,t), r=length(q);
  float soft=4.0+0.06*max(t,0.0);
  float m=1.0-smoothstep(R-soft*1.6,R+soft*0.4,r);
  if(m<=0.0) return 0.0;
  return m*beamAt(q);
}
// the wet air about the pillar: whole inside, fading over some tens of metres outside
float shaftNear(vec3 p){ vec2 q; float t; float R=shaftRim(p,q,t); return exp(-max(length(q)-R,0.0)/26.0)*step(p.y,uSkyC.y); }
// under the forest's crowns the sun comes down in flecks that wander as the leaves move
float gSunK=1.0, gMirror=0.0, gAmb=0.0, gRim=0.09, gSheen=1.0;
float fleckAt(vec3 p){
  vec2 q=p.xz*0.3+vec2(sin(uTime*0.37+p.z*0.21),cos(uTime*0.31+p.x*0.19))*0.22;
  return smoothstep(0.52,0.7,vn2(q)*0.6+vn2(q*2.7+5.0)*0.4);
}
vec3 airGlow(vec3 p){ return uAirCol*((0.12+0.88*dayAt(p))*(0.5+0.5*smoothstep(-10.0,130.0,p.y))); }   // (the far end of the passage is a dim blue haze, never black)
// the sun given back by the pillar's foot: the burning crowns and the lit air there are a warm lamp to the whole dome, strongest
// on what faces them and falling off with distance
vec3 pillarGlow(vec3 p, vec3 N){
  vec3 d=uGlowP.xyz-p; float r=max(length(d),1e-3);
  return uSunCol*(uGlowP.w*(0.3+0.7*max(dot(N,d/r),0.0))/(1.0+r*r/14400.0));
}
// the lamps: each a pool of light where it is turned (cut at its reach) and, all round it, a wide soft warm wash that
// falls off gently and is gone at its own reach (uLampW: stone 60 m and more from a lamp still takes its gold; a face
// turned from the lamp takes a third of it, as from the lit rock about it); spec: their glint on wet rock
#define WASH_COL vec3(1.0,0.66,0.33)
vec3 lampsAt(vec3 p, vec3 N, vec3 V, float wet, out vec3 spec){
  vec3 dif=vec3(0.0); spec=vec3(0.0);
  // (damp air drifts through every beam: the lamp stands steady, its pool of light on the rock shifts slowly by a fifth)
  float drift=0.78+0.44*vn3(vec3((p.xz-uDrift*(uTime*1.75))*0.05,p.y*0.05+uTime*0.1));
  for(int i=0;i<NL;i++){
    vec3 d=uLampP[i].xyz-p; float r2=dot(d,d), reach=uLampP[i].w, wr=uLampW[i].y;
    if(r2<max(reach*reach,wr*wr)){
      float r=sqrt(r2); vec3 L=d/max(r,1e-3);
      float nl=dot(N,L);
      dif+=WASH_COL*(uLampW[i].x*(1.0-smoothstep(wr*0.5,wr,r))/(1.0+r2/(wr*wr*0.04))*(0.3+0.7*max(nl,0.0)));
      // (and every head lamp stands in a small warm pool of its own light: the ground about the caver's feet and the caver, within some 4 m)
      if(i>1&&i<NL-1) dif+=WASH_COL*(1.7*exp(-r2/7.0));
      if(r2<reach*reach){
        float cone=uLampD[i].w<-1.5?1.0:smoothstep(uLampD[i].w-0.22,uLampD[i].w+0.12,dot(-L,uLampD[i].xyz));
        float fall=(1.0-smoothstep(reach*0.5,reach,r))*cone/(1.0+r2*0.06)*drift;
        dif+=uLampC[i]*(fall*(max(nl,0.0)*0.85+0.15*max(nl*0.5+0.5,0.0)));
        vec3 H=L+V; H=H/max(length(H),1e-3); float s=max(dot(N,H),0.0); s*=s; s*=s; s*=s; s*=s;
        spec+=uLampC[i]*(fall*s*wet*0.5*gSheen*smoothstep(-0.03,0.14,nl));   // (a broad soft glint: no bright dashes along the beds)
      }
    }
  }
  // (the pool a lamp is turned into gives its gold up to the roof that hangs over the first staircase: only what stands
  // well over it takes this light)
  { vec3 d=uUp.xyz-p; float r2=dot(d,d); if(d.y<-7.0&&r2<uUp.w*uUp.w){ float r=sqrt(r2);
      dif+=WASH_COL*(1.9*(1.0-smoothstep(uUp.w*0.55,uUp.w,r))/(1.0+r2/1500.0)*(0.35+0.65*max(dot(N,d/r),0.0))); } }
  return dif;
}
// THE POOLS THAT GLOW FROM WITHIN give their turquoise up to what stands over and about them: the nearest walls, the
// draperies, the towers' feet
vec3 poolsAt(vec3 p, vec3 N){
  vec3 g=vec3(0.0);
  for(int i=0;i<NPG;i++){
    vec3 d=vec3(uPoolG[i].x,uPoolG[i].w,uPoolG[i].y)-p; float r2=dot(d,d), R=min(uPoolG[i].z,24.0)*3.0+12.0;
    if(r2<R*R*9.0&&d.y<2.0){ float r=sqrt(r2); g+=vec3(0.07,0.62,0.52)*((1.0-smoothstep(R*1.5,R*3.0,r))/(1.0+r2/(R*R*0.25))*(0.3+0.7*max(dot(N,d/max(r,1e-3)),0.0))); }
  }
  return g;
}
// the ring's own glow on a leaf (the last lamp of the list, all round)
vec3 ringLight(vec3 p, vec3 N){
  vec3 d=uLampP[NL-1].xyz-p; float r2=dot(d,d), reach=uLampP[NL-1].w;
  if(r2>=reach*reach) return vec3(0.0);
  float r=sqrt(r2);
  return uLampC[NL-1]*((1.0-smoothstep(reach*0.5,reach,r))/(1.0+r2*0.06)*(0.35+0.65*max(dot(N,d/max(r,1e-3)),0.0)));
}
// THE GROUND MIST of the dome's hollow: a thin layer of wet air that lies between two heights under the flown line (its
// top is level: uSea.x, a little lower toward its two ends; its foot 13 m under that) from the threshold's far slope to
// the mound's foot, in banks with gaps between them; there is none in the cave. It is air and nothing else: every shader of the world works out how
// much of it lies between the eye and a place, so that whatever stands in it or under it fades into it by its own depth
// and is seen through its gaps; nothing is drawn for it, and nothing under it is unmade.
// mistEdge: how much of the layer there is at a place in plan (its two ends are torn and creep with the cave's wind)
float mistEdge(vec2 xz){
  vec2 q=xz-uDrift*(uTime*2.0);
  float n=vn2(q*0.045);
  float aD=470.0+dot(xz-uSeaB.xy,uSeaB.zw);
  return smoothstep(uSeaA.x,uSeaA.y,-xz.y-26.0*n)*(1.0-smoothstep(uSeaA.z,uSeaA.w,aD+22.0*(n-0.5)));
}
// the layer's top at a place
float mistTop(vec2 xz){
  float aD=470.0+dot(xz-uSeaB.xy,uSeaB.zw);
  return uSea.x-uSea.y*(1.0-smoothstep(uSeaA.x,uSeaA.y+15.0,-xz.y))-5.0*smoothstep(uSeaA.z-25.0,uSeaA.w,aD);
}
// the banks: 1 in a bank, 0 in a gap. They travel toward the dome and turn over on the world's clock (a large size, and a
// smaller one that runs ahead of it)
float mistBank(vec2 xz){
  vec2 q=xz-uDrift*(uTime*2.5), r=vec2(q.x*0.8+q.y*0.6,-q.x*0.6+q.y*0.8)-uDrift*(uTime*1.3);
  float b=vn2(q*0.019+vec2(uTime*0.013,0.0))*0.6+vn2(r*0.052+vec2(4.0,uTime*0.035))*0.4;
  return smoothstep(0.5-0.17*uSea.w,0.5+0.17*uSea.w,b);
}
#define MIST_DEEP 13.0
// its density at a place (to a metre of the eye's ray): a bank stands to the layer's top and is thick; in a gap the mist
// lies some metres lower and is thin; top and foot are soft
float mistDen(vec3 p){
  float k=mistEdge(p.xz);
  if(k<=0.0) return 0.0;
  float top=mistTop(p.xz), b=mistBank(p.xz);
  float up=smoothstep(0.0,3.0+3.0*b,top-5.5*(1.0-b)-p.y), lo=smoothstep(top-MIST_DEEP-4.0,top-MIST_DEEP+3.0,p.y);
  return uSea.z*k*k*(0.09+0.91*b*b)*up*lo;
}
// its light at a place of it, to an eye that looks along V. The mist is LIT air: a pale blue-white where only the cave's
// own cool light finds it, white-gold where the dome's day stands behind it (from the bend on it is a bright bank: what
// stands before it stands dark against it), warm inside the sun's pillar; high in the layer it takes the light, deep in
// it it lies in its own shade
vec3 mistLight(vec3 p, vec3 V){
  float day=dayAt(p), hk=clamp((p.y-(mistTop(p.xz)-MIST_DEEP))/MIST_DEEP,0.0,1.0);
  vec3 Ld=vec3(uSkyC.x,uSkyC.y-30.0,uSkyC.z)-p; Ld=Ld/max(length(Ld),1e-3);
  float fw=max(dot(V,Ld),0.0); fw*=fw; fw*=fw;
  vec3 c=uSeaCol*((0.09+0.55*day)*(0.30+0.45*hk)*(1.0+1.2*fw));
  c+=vec3(1.0,0.90,0.68)*(smoothstep(0.52,0.98,day)*(0.11+0.31*hk)*(1.0+1.6*fw));
  c+=vec3(1.0,0.87,0.62)*(shaftAt(p)*(0.3+0.8*hk));
  return c;
}
// and what the lamps and the glowing pools give it: the lamps' gold in the mist about them, the pools' turquoise in the
// mist that lies over them
vec3 mistGlow(vec3 q){
  vec3 g=vec3(0.0);
  for(int i=2;i<NL-1;i++){ vec3 d=uLampP[i].xyz-q; float wr=uLampW[i].y, r2=dot(d,d); if(r2<wr*wr) g+=WASH_COL*(uLampW[i].x*0.3*(1.0-smoothstep(wr*0.5,wr,sqrt(r2)))/(1.0+r2/(wr*wr*0.03))); }
  for(int i=0;i<NPG;i++){ vec3 d=vec3(uPoolG[i].x,uPoolG[i].w,uPoolG[i].y)-q; float r2=dot(d,d), R=uPoolG[i].z*2.0+8.0; if(r2<R*R*9.0) g+=vec3(0.04,0.62,0.54)*(1.2*(1.0-smoothstep(R*1.5,R*3.0,sqrt(r2)))/(1.0+r2/(R*R*0.3))); }
  return g;
}
// THE MIST BETWEEN THE EYE AND A PLACE: rgb the light it gives the eye on the way, a how much of the place it takes.
// The eye's ray is cut to the layer's two heights and walked in five steps, close together where it enters the layer.
// The air about the eye is clear: within some 35 m of it the mist is a fifth as thick and it comes to its whole
// thickness 95 m off, so what stands near is sharp and the mist lies low and far
#define MIST_STEPS 5
vec4 mistBetween(vec3 p){
  vec3 o=cameraPosition, v=p-o;
  if(max(-o.z,-p.z)<uSeaA.x-30.0) return vec4(0.0);                  // (both ends short of the layer's near end)
  float yT=uSea.x, yB=uSea.x-uSea.y-MIST_DEEP-4.0, t0=0.0, t1=1.0;
  if(abs(v.y)<1e-4){ if(o.y>yT||o.y<yB) return vec4(0.0); }
  else { float ta=(yT-o.y)/v.y, tb=(yB-o.y)/v.y; t0=max(0.0,min(ta,tb)); t1=min(1.0,max(ta,tb)); if(t1<=t0) return vec4(0.0); }
  float len=max(length(v),1e-3), L=(t1-t0)*len, T=1.0;
  vec3 acc=vec3(0.0), V=v/len, glow=mistGlow(o+v*(t0+(t1-t0)*0.3));
  // (the cloud's top is not flat: it rolls in billows some 12 m across, lit on their crowns and grey in their folds)
  vec2 bq=(o.xz+v.xz*t0)-uDrift*(uTime*2.5);
  float bil=0.44+1.08*vn2(bq*0.085);
  // (the glowing pools burn through the mist that lies on them: what stands within a pool's round is seen through an
  // eighth of it)
  for(int i=2;i<NPG;i++){ vec2 d=p.xz-uPoolG[i].xy; float R=uPoolG[i].z; L*=0.12+0.88*smoothstep(R*R*0.75,R*R*1.5,dot(d,d)); }
  for(int i=0;i<MIST_STEPS;i++){
    float f0=float(i)/float(MIST_STEPS), f1=float(i+1)/float(MIST_STEPS), s0=f0*f0, s1=f1*f1, tq=t0+(t1-t0)*0.5*(s0+s1);
    vec3 q=o+v*tq;
    float d=mistDen(q)*(s1-s0)*L*mix(0.2,1.0,smoothstep(35.0,95.0,tq*len));
    if(d>0.0){ float a=1.0-exp(-d); acc+=(mistLight(q,V)*bil+glow)*(T*a); T*=1.0-a; }
  }
  return vec4(acc,1.0-T);
}
// the world's air: the ground mist's layer first (it lies in the dome's hollow only), then a haze by distance toward the
// glow of the place: more of it up the dark passage (the far towers pale and blue), less in the dome. No banks of mist in the cave.
vec3 airApply(vec3 col, vec3 p){
  { vec4 mk=mistBetween(p); col=col*(1.0-mk.a)+mk.rgb; }
  vec3 dv=p-cameraPosition; float dist=length(dv);
  float kp=smoothstep(130.0,330.0,upPassage(p)), kc=smoothstep(130.0,330.0,upPassage(cameraPosition));
  float f=1.0-exp(-mix(uAirK.y,uAirK.x,0.5*(kp+kc))*dist);
  vec3 fc=mix(airGlow(p),airGlow(cameraPosition),0.3)*uAirK.z;
  fc=mix(fc,uAirDome,(1.0-kp)*0.65);
  return mix(col,fc,clamp(f,0.0,1.0));
}
// the forest's own breath: the air between the crowns is damp, so what stands far off in the forest is paler and bluer than
// what stands near (and a little warm about the pillar's foot)
vec3 forestAir(vec3 col, vec3 p){
  float d=length(p-cameraPosition);
  vec3 hz=uDayCol*(dayAt(p)*0.11)+uSunCol*(shaftNear(p)*0.01);
  return airApply(mix(col,hz,1.0-exp(-d*0.0032)),p);
}
// rock, sand, moss: everything solid is lit here. ao: occlusion baked at the vertex
vec3 caveLight(vec3 p, vec3 N, vec3 alb, float wet, float ao){
  vec3 V=cameraPosition-p; V=V/max(length(V),1e-3);
  ao=0.26+0.74*ao;                                                   // (the deepest hollow still takes a quarter of the light about it: no bay is bare dark)
  float day=dayAt(p), inDome=1.0-smoothstep(0.0,150.0,upPassage(p));
  vec3 Ld=vec3(uSkyC.x,uSkyC.y-30.0,uSkyC.z)-p; Ld=Ld/max(length(Ld),1e-3);
  float ndl=dot(N,Ld), hl=ndl*0.5+0.5, wrap=max(ndl*0.72+0.28,0.0); wrap=wrap*wrap+0.1+gAmb;
  wrap=mix(wrap,0.11+0.62*hl*hl+0.42*max(N.y,0.0)+gAmb,inDome);                      // under the roof opening the light comes from a wide hole: tops are bright, no face is left black
  vec3 dc=mix(uDayCol,uDayDome,day*day);                                              // far up the passage the day is a blue glow; from the bend on it is the green-gold day of the opening itself
  vec3 col=alb*dc*(day*wrap*ao);
  // the lit air on every side gives a little to the faces turned from the dome, so that no tower is a flat black shape
  col+=alb*airGlow(p)*(uAirK.z*ao*(0.46+0.22*N.y)*(1.0-inDome));
  // THE COOL BOUNCE: every wet face of the passage gives a little cool blue light to every other, most to what looks up
  // and to what looks toward the day, least into the hollows (ao): the darkest wall is a deep blue-grey whose forms read
  col+=alb*uCool*(ao*(0.5+0.16*N.y+0.5*hl*hl)*(1.0-0.5*inDome));
  col+=alb*poolsAt(p,N)*ao;
  // and every edge of the rock that is turned toward the dome carries a thin cold rim of its day, wet or dry
  { float nv0=1.0-max(dot(N,V),0.0); col+=dc*(day*ao*nv0*nv0*nv0*max(ndl+0.3,0.0)*0.09*(1.0-inDome)); }
  // the ground mist's pale glow from below, on what stands over it in the dome's hollow
  if(p.y>uSea.x-1.0){ float sk=mistEdge(p.xz)*smoothstep(-1.0,8.0,p.y-uSea.x);
    if(sk>0.0){ vec3 sp=vec3(p.x,uSea.x,p.z);
      col+=alb*uSeaCol*(dayAt(sp)*1.5*sk*ao*(0.62-0.38*N.y)*(0.3+0.7/(1.0+(p.y-uSea.x)*0.03))); } }
  vec3 H=Ld+V; H=H/max(length(H),1e-3);
  float nh=max(dot(N,H),0.0); float s=nh*nh; s*=s; s*=s; s*=s; s*=s;
  float nv=1.0-max(dot(N,V),0.0); float fr=nv*nv; fr*=fr;
  col+=dc*(day*ao*wet*(s*0.2+fr*max(ndl+0.25,0.0)*gRim)*(1.0-0.65*day*day));
  float sh=shaftAt(p)*ao*gSunK, ns=max(dot(N,uSunDir),0.0);
  col+=alb*uSunCol*(sh*ns);
  vec3 Hs=uSunDir+V; Hs=Hs/max(length(Hs),1e-3); float ss=max(dot(N,Hs),0.0); ss*=ss; ss*=ss; ss*=ss; ss*=ss; ss*=ss;
  col+=uSunCol*(sh*wet*ss*0.6);
  col+=alb*uBounce*(inDome*ao*(0.72-0.28*N.y));                                      // the lit forest and cloud top give their light back inside the dome, most to what looks down on them: the roof's underside is a dim green-gold, never black
  col+=alb*pillarGlow(p,N)*ao;
  vec3 ls; vec3 ld=lampsAt(p,N,V,wet,ls); col+=alb*ld; col+=ls;
  // WET SHEEN AND GLINTS, from the eye's direction: a wet face of the passage seen at a low angle carries a sheen of the
  // light that lies on it, and the beads of water on it (some 40 cm apart) flash and go out as the eye moves past
  { float up=upPassage(p), bead=smoothstep(0.78,0.9,vn3(p*2.6+V*2.1))*(1.0-smoothstep(16.0,70.0,length(cameraPosition-p)));
    col+=(ld*0.5+uCool*0.55)*(min(wet,1.2)*ao*(0.12*fr+0.8*bead)*gSheen*(1.0-gMirror)*smoothstep(0.0,40.0,up));
    // (from the lake on, the day of the mouth lies on the roof: what hangs high over the last stairs and looks down
    // takes a pale green-gold, strongest toward the mouth)
    col+=alb*uDayDome*(ao*smoothstep(55.0,115.0,p.y)*max(0.3-0.7*N.y,0.0)*smoothstep(0.0,30.0,up)*(1.0-smoothstep(40.0,200.0,up))*0.36);
    // (and no corner of the passage is black: the deepest of it holds a little of the cave's own blue)
    col+=vec3(0.004,0.011,0.010)*(gSheen*smoothstep(0.0,60.0,up)); }
  vec3 R=reflect(-V,N); col+=airGlow(p+R*140.0)*(uAirK.z*wet*ao*fr*0.12*(1.0-0.7*gMirror));   // the glowing air mirrored in what is wet
  if(gMirror>0.0){
    col+=uDayCol*(dayAt(p+R*220.0)*gMirror*(0.03+0.97*fr)*0.07);                    // still water: a mirror of the far daylight (dark teal, never a pale sheet)
    for(int i=0;i<4;i++){                                                             // and of the lit towers that stand in or over it
      vec2 dxz=uWash[i].xy-p.xz; float tt=dot(dxz,R.xz)/max(dot(R.xz,R.xz),1e-4);
      if(tt>0.0){ vec3 q=p+R*tt; vec2 o2=q.xz-uWash[i].xy;
        col+=uWashC[i]*(gMirror*exp(-dot(o2,o2)/(0.012*tt*tt+16.0))*smoothstep(uWash[i].z-6.0,uWash[i].z+4.0,q.y)*(1.0-smoothstep(uWash[i].w-12.0,uWash[i].w+6.0,q.y))*(0.3+0.7*fr)); } }
  }
  return col;
}
`;

// ---- rock: banded limestone with scallops, stains and a wet sheen; FLOOR adds the rimstone pools and their spilling sheets
const ROCK_VERT = /* glsl */`
attribute vec4 aA; attribute vec3 aC;
varying vec3 vP, vN, vC; varying vec4 vA;
void main(){
  vec4 wp=vec4(position,1.0); vec3 n=normal;
  #ifdef USE_INSTANCING
  wp=instanceMatrix*wp; n=mat3(instanceMatrix)*n;
  #endif
  wp=modelMatrix*wp; vP=wp.xyz; vN=mat3(modelMatrix)*n; vC=aC; vA=aA;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const ROCK_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec4 vA;     // vA: occlusion, green cover, wetness, kind (walls: flowstone 0..1; FLOOR: how much of a rimstone terrace the place is, or -1 less the forest's cover)
uniform vec3 uTone;                           // band contrast, relief, calcite (0 limestone .. 1 pale flowstone)
uniform float uRain, uShade;
uniform vec4 uPearl;                          // the dried pool of pearls: x, z, radius
${GL_CAVE}
#ifdef FLOOR
// the rimstone terraces: whole numbers of this are the dams' crests (the passage runs along -z there, and x is metres to the
// right of the line). The dams stand 4 m apart beside the line and 10 m apart toward the wall. g: dams to a metre across
float gourF(vec2 xz, out float g){
  float a=-xz.y, l=xz.x;                                             // (axis coordinates: the passage is straight to a 330, then bends to the right)
  if(a>330.0){ float t=atan(-(xz.y+330.0),${RB.toFixed(1)}-xz.x);
    if(t<=${TH1.toFixed(5)}){ a=330.0+t*${RB.toFixed(1)}; l=${RB.toFixed(1)}-length(vec2(xz.x-${RB.toFixed(1)},xz.y+330.0)); }
    else { vec2 d=xz-uSeaB.xy; a=470.0+dot(d,uSeaB.zw); l=d.x*-uSeaB.w+d.y*uSeaB.z; } }
  float x=l-mix(14.0,-5.0,smoothstep(70.0,104.0,a))+21.0*smoothstep(110.0,215.0,a), u=clamp((x-14.0)/28.0,0.0,1.0);
  float lk=smoothstep(${(LAKE.a0 - 8).toFixed(1)},${(LAKE.a0 + 8).toFixed(1)},a)*(1.0-smoothstep(${(LAKE.a1 - 8).toFixed(1)},${(LAKE.a1 + 6).toFixed(1)},a))*(1.0-smoothstep(${(LAKE.half - 7).toFixed(1)},${(LAKE.half + 5).toFixed(1)},abs(l-${LAKE.l.toFixed(1)})));
  g=mix(0.10+0.16*(1.0-u*u*(3.0-2.0*u))+0.11*smoothstep(110.0,215.0,a),0.12,lk);
  float f=0.6+0.10*x+0.16*(min(x,14.0)+28.0*(u-u*u*u+0.5*u*u*u*u))+9.0*smoothstep(${RAMP[0].toFixed(1)},${RAMP[1].toFixed(1)},a)+24.0*smoothstep(${RAMP[2].toFixed(1)},${RAMP[3].toFixed(1)},a)
    +0.8*sin(a*0.105+l*0.06)+0.35*sin(l*0.21-a*0.045+1.7)+0.1*sin(a*0.38+2.0*sin(l*0.3))
    +0.17*sin(a*0.27-l*0.19+2.1*sin(l*0.13+a*0.07))+0.07*sin(a*0.71+l*0.93);
  return mix(f,${LAKE.f.toFixed(2)},lk);
}
// the rings where drips land on a pool: the water is dealt into cells, and a cell's ring has its own size (a tenth to a
// quarter of the cell), its own place in the cell (so that the whole ring lies inside it) and its own beat; half the
// cells have none. The result is the tilt it gives the water's normal
vec2 dripRings(vec2 xz, float cell, float seed, float rain){
  vec2 pc=floor(xz/cell), pf=xz/cell-pc; float hh=h21(pc+seed), sz=cell*mix(0.1,0.27,h21(pc+seed+31.0)), m=1.6*sz/cell;
  vec2 dq=pf-vec2(m+(1.0-2.0*m)*h21(pc+seed+7.0),m+(1.0-2.0*m)*h21(pc+seed+19.0)); float rr=length(dq)*cell/sz;
  float ph=fract(uTime*(0.13+0.3*hh*hh)*(1.0+rain)/sqrt(sz)+hh*9.0);
  float ring=sin((rr-ph*2.4)*9.0)*exp(-rr*1.4)*(1.0-ph)*smoothstep(0.0,0.15,ph)*step(hh,0.5+0.4*rain);
  return dq*(ring*1.6*cell/(3.2*sz));
}
#endif
void main(){
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  float dC=length(cameraPosition-vP), lod=1.0-smoothstep(50.0,240.0,dC), lod2=1.0-smoothstep(14.0,70.0,dC);
  float foot=length(fwidth(vP));                                     // metres of rock from one drawn sample to the next
  float w1=vn3(vP*0.013), w2=vn3(vP*0.05+5.0);
  float m1=vn3(vP*0.17+3.0), m2=vn3(vP*0.7+11.0), m3=mix(0.5,vn3(vP*3.1+5.0),lod2);
  float steep=1.0-abs(N.y), far=1.0-smoothstep(260.0,620.0,dC);
  // THE ROCK'S GRAIN lies in the rock itself, on all three of its axes: a face that turns keeps its beds, and no joint is
  // drawn as a line. The beds are of very unequal thickness, dip a little all one way and ride the rock's own slow swells
  // (of some 75 and 20 m), with dark partings between them; the face itself swells and hollows by tens of metres
  float cOut=w2;
  float domeK=1.0-smoothstep(0.0,110.0,upPassage(vP));               // (1 in the dome and its mouth, 0 up the passage)
  float yb=vP.y+0.055*vP.x-0.035*vP.z+9.0*w1+3.0*w2;
  float yq=yb*0.13+2.6*vn2(vec2(yb*0.05,4.5));
  float fwY=fwidth(vP.y+0.055*vP.x-0.035*vP.z), bedK=1.0-smoothstep(0.1,0.4,fwY*0.13);   // (a parting is drawn only where it is wider than a sample)
  float bi=floor(yq), bf=yq-bi;
  float bh=h21(vec2(bi,3.0)), bt=h21(vec2(bi,11.0)), bhUp=h21(vec2(bi+1.0,3.0));   // each bed: how far it stands out of the face, and its own tone
  float ew=max(0.1,fwY*0.4);                                         // (a bed's worn edge is never drawn narrower than a sample)
  float edge=smoothstep(0.0,ew,bf)*(1.0-smoothstep(1.0-ew*1.6,1.0,bf));   // 0 in the parting between two beds: each bed is a slab with worn edges
  // here and there a piece has fallen out of a bed and left a niche, dark under its own roof; and under every bed that stands
  // out lies the shadow of its ledge
  float niche=smoothstep(0.68,0.76,vn2(vP.xz*0.11+bi*3.7))*smoothstep(0.02,0.2,bf)*(1.0-smoothstep(0.8,0.98,bf));
  float ledge=max(bhUp-bh,0.0)*smoothstep(0.45,0.97,bf)*bedK;
  vec3 lime=mix(vec3(0.075,0.08,0.085),vec3(0.30,0.29,0.26),clamp(0.5+(bt-0.5)*1.25*uTone.x*mix(0.3,1.0,steep)*mix(0.6,1.0,lod)+0.2*(m1-0.5)+0.3*(cOut-0.5)*uTone.x,0.0,1.0));
  lime*=mix(vec3(1.0),vec3(1.75,1.45,1.02),domeK);                   // (under the open roof the same stone has weathered to honey)
  lime*=1.0-0.4*(1.0-edge)*uTone.x*steep*far*bedK;
  lime*=(1.0-0.5*niche*uTone.x*steep*(0.5+0.5*bf))*(1.0-0.55*ledge*uTone.x*steep);
  // close to (under 25 m), each thick bed is itself a pile of thin ones with sharp partings
  float lodF=(1.0-smoothstep(12.0,26.0,dC))*smoothstep(0.3,0.75,steep)*uTone.x;   // (on faces that stand up, never on sand or scree)
  float yf=yb*1.15+0.9*vn2(vec2(yb*0.31,9.0))+0.5*m1, bf2=fract(yf), bh2=h21(vec2(floor(yf),5.0));
  float fwB=fwY*1.15; lodF*=1.0-smoothstep(0.12,0.4,fwB);              // (no bed is drawn thinner than a sample)
  float edge2=smoothstep(0.0,0.1+fwB*1.5,bf2)*(1.0-smoothstep(0.84-fwB*1.5,1.0,bf2));
  lime*=(1.0-0.34*(1.0-edge2)*lodF)*(1.0+(bh2-0.5)*0.36*lodF);
  float drip=vn3(vec3(vP.x*0.5,vP.y*0.09,vP.z*0.5)+w1*2.0);                               // flowstone lies in long lobes that run down the face
  // CALCITE IS LAID DOWN IN BANDS: honey and amber gold with cream between, a band some 4 m thick and a slow one of 13 m,
  // riding the stone's own swell and sagging where the lobes run down; far off they close to their mean
  float cbY=vP.y*1.6+5.0*w2+2.6*m1+2.4*drip, cbK=1.0-smoothstep(0.6,2.2,fwidth(cbY));
  float cb=mix(0.5,0.5+0.5*sin(cbY+1.3*sin(cbY*0.53)),cbK)*0.55+(0.5+0.5*sin(cbY*0.29+12.0*w1))*0.45;
  vec3 calc=mix(vec3(0.45,0.28,0.105),vec3(0.59,0.49,0.32),smoothstep(0.2,0.8,cb))*(0.74+0.2*m1+0.16*m2+0.28*drip);
  float calcK=uTone.z;
#ifndef FLOOR
  // flowstone laid over a wall: where the wall carries it, and here and there in pale drapes that run down from a ledge
  float drape=smoothstep(0.7,0.84,vn3(vec3(vP.x*0.045,vP.y*0.011,vP.z*0.045)+w1*1.5))*steep*step(0.95,uTone.x);
  calcK=max(calcK,max(clamp(vA.w,0.0,1.0),drape*0.8));
#endif
  vec3 alb=mix(lime,calc,calcK)*vC*(0.88+0.24*m3);
  // drip stains at two sizes: dark where water runs down the face from a ledge (tongues some 2 m wide and 14 m long, and
  // fine ones a hand wide and 4 m long: each has a head and an end), rust in a few seams
  float run=vn3(vec3(vP.x*0.45,vP.y*0.07,vP.z*0.45)+w1*2.0), runF=vn3(vec3(vP.x*1.5,vP.y*0.24,vP.z*1.5)+3.0);
  float black=smoothstep(0.56,0.72,run*0.62+runF*0.38)*steep;
  float rust=smoothstep(0.66,0.86,vn3(vec3(vP.x*0.3+9.0,vP.y*0.06,vP.z*0.3))*0.75+m1*0.25)*steep;
  alb=mix(alb,vec3(0.27,0.14,0.07),rust*0.4*(1.0-uTone.z*0.5));
  alb*=1.0-0.4*black*(1.0-0.5*calcK);
  // the relief, as a height in metres: blocks and beds standing out as ledges, niches, dished scallops with sharp crests
  // between them, pitting, flutes; none of it finer than the step from one drawn sample to the next
  float sc=vn3(vP*0.16+w1*3.0)*0.6+vn3(vP*0.47+7.0)*0.4, dish=smoothstep(0.3,0.7,sc);
  float fa=(vP.x+vP.z)*1.7+3.0*vn2(vP.xz*0.25)+vP.y*0.08;
  float kf1=1.0-smoothstep(0.7,2.4,foot), kf2=1.0-smoothstep(0.25,0.9,foot), kf3=1.0-smoothstep(0.06,0.22,foot), root=0.0, stn=0.0;
  alb*=0.9+0.2*dish;                                                 // (a scallop's dish is a little paler than its crest's shadow)
  float hgt=((0.15+0.85*bh)*edge*1.1*bedK+(cOut-0.5)*1.6-1.1*niche)*uTone.x*steep*far*(1.0-calcK)
    -0.17*dish*lod*(1.0-0.6*calcK)*kf1
    +0.05*(m3-0.5)*lod2*kf3+0.16*(m2-0.5)*lod*(1.0-steep)*kf2
    +(0.9*(drip-0.5)*kf1+0.1*cos(fa)*lod*kf2)*calcK*steep;
#ifdef FLOOR
  // the terraces: each dam a low wall of buff stone with a rounded crest, the pool behind it level
  // (THE BANK'S STAIRCASE is built: its sheet carries its own terrace coordinate, 2 and more, in place of the floor's
  // kind, and its dams and pools stand in the sheet itself; toward its two sides, where the sheet carries moss, the
  // water gives way to the rim's stone. stair: 1 on that sheet)
  float stair=step(1.5,vA.w);
  float gG; float tF=gourF(vP.xz,gG), zone=clamp(vA.w,0.0,1.0);
  float pan=1.0-smoothstep(uPearl.z-0.6,uPearl.z+0.3,length(vP.xz-uPearl.xy));
  if(stair>0.5){ gG=0.09; tF=vA.w-2.0; pan=0.0; }
  float fwT=fwidth(tF);
  float tFr=fract(tF), tK=floor(tF), tE=0.5*gG, tE2=tE+0.45*gG;
  float see=zone*(1.0-pan)*(1.0-smoothstep(mix(0.07,0.25,stair),mix(0.26,0.7,stair),fwT));   // far off the dams close up: their contrast falls away before two of them could meet in one sample
  float seeB=mix(see,1.0,stair);                                     // (a built dam and a built pool are there at any distance)
  float riser=(1.0-smoothstep(0.0,tE,tFr))*seeB, rim=smoothstep(tE*0.35,tE*0.9,tFr)*(1.0-smoothstep(tE2*0.9,tE2*1.3,tFr))*see;
  float pool=mix(0.7,smoothstep(tE2*0.9,tE2*1.35,tFr),seeB)*zone*(1.0-pan);
  { float shore=stair*smoothstep(0.2,0.7,vA.y); pool*=1.0-shore; rim=max(rim,shore*(1.0-riser)); }
  float tRise=0.25+1.4*abs(sin(tK*2.39+0.7))*(0.35+0.65*abs(sin(tK*0.9+2.0)));
  hgt+=tRise*(smoothstep(0.0,tE,tFr)-tFr)*see*(1.0-stair);
  // roots run winding over the forest's floor (seen close)
  root=(1.0-smoothstep(0.0,0.12,abs(vn2(vP.xz*0.42+7.0)-0.5)))*clamp(-1.0-vA.w,0.0,1.0)*(1.0-smoothstep(22.0,70.0,dC))*smoothstep(3.0,9.0,dC);
  // and pale stones lie in it, a hand to a metre across, half sunk
  stn=smoothstep(0.63,0.70,vn2(vP.xz*0.85+13.0)*0.75+m2*0.25)*clamp(-1.0-vA.w,0.0,1.0)*(1.0-smoothstep(50.0,130.0,dC));
  hgt+=0.2*root+0.3*stn;
#endif
  vec3 sx=dFdx(vP), sy=dFdy(vP), r1=cross(sy,N), r2=cross(N,sx);
  float det=dot(sx,r1);
  vec3 Nb=abs(det)*N-sign(det)*(dFdx(hgt)*r1+dFdy(hgt)*r2)*uTone.y;
  float nbl=length(Nb); Nb=nbl>1e-9?Nb/nbl:N;
  { vec3 gy=vec3(0.055,1.0,-0.035), tg=gy-N*dot(gy,N); float c=2.0*bf2-1.0;          // each thin bed is a small rounded roll (its slope known, not measured)
    Nb+=tg*(c*c*c*(0.25+0.75*bh2)*0.9*lodF*(1.0-calcK)*uTone.y); Nb=Nb/max(length(Nb),1e-4); }
  float wet=clamp(vA.z*(0.35+0.5*black+0.25*m2)*(1.0+0.6*uRain),0.0,2.0);
  float ao=vA.x, cover=0.0;
  gRim=0.09+0.3*uTone.z;                                                               // the towers and the draperies are rimmed with the dome's cold light
  // what stands in the mist is wet, and a little darker for it
  if(vP.y<uSea.x+7.0&&-vP.z>uSeaA.x-30.0){ float sk=mistEdge(vP.xz); if(sk>0.0){ float rimK=sk*(1.0-smoothstep(0.0,7.0,vP.y-mistTop(vP.xz))); wet+=1.2*rimK; alb*=1.0-0.25*rimK; } }
#ifdef FLOOR
  {
    alb=mix(alb,vec3(0.34,0.30,0.235)*(0.75+0.5*m2),clamp(rim*0.9+riser*0.6,0.0,1.0));
    alb=mix(alb,vec3(0.33,0.30,0.24)*(0.8+0.4*m2),pan*zone);                                                      // the dried pool: a pale pan of calcite
    float sp=vn3(vec3(vP.x*1.3,vP.y*2.4+uTime*2.6,vP.z*1.3))*smoothstep(0.25,0.6,vn2(vec2(tK*7.3+vP.x*0.23,vP.z*0.23)))*(1.0+uRain);
    wet=mix(wet,0.7+1.3*smoothstep(0.2,0.55,sp),riser); gAmb=0.2*max(riser,rim);                                  // thin sheets spilling from pool to pool
    alb=mix(alb,vec3(0.42,0.40,0.33),riser*0.35*smoothstep(0.3,0.62,sp));                                         // (cream where the sheet breaks on the dam's face)
    if(stair>0.5){
      // the built dams in the day: a face of honey and cream travertine in upright flutes, dark under its lip and mossed
      // where it is dry; where the water goes over (here broad, there not at all) the lip is glassy turquoise and
      // white threads run down the face
      float ax=dot(vP.xz,vec2(0.8,0.6)), over=smoothstep(0.38,0.6,vn2(vec2(ax*0.17+tK*3.1,tK*7.7)));
      float flute=0.5+0.5*cos(ax*4.4+2.5*vn2(vec2(ax*0.8,tK*3.0)));
      vec3 trav=mix(vec3(0.30,0.20,0.085),vec3(0.42,0.36,0.25),vn2(vec2(ax*0.33+tK*1.7,vP.y*0.9)))*(0.6+0.4*flute);
      trav=mix(trav,vec3(0.06,0.17,0.04),(1.0-over)*smoothstep(0.42,0.66,vn2(vec2(ax*0.55+tK*5.0,vP.y*0.8)))*0.85);
      alb=mix(alb,trav,riser);
      float strand=vn2(vec2(ax*1.9,vP.y*0.5+uTime*2.4))*0.6+vn2(vec2(ax*4.7+7.0,vP.y*1.3+uTime*3.9))*0.4;
      float wtr=smoothstep(0.40,0.64,strand)*riser*over;
      alb=mix(alb,vec3(0.10,0.46,0.44),over*max(rim,riser*smoothstep(tE*0.5,tE,tFr))*0.85);
      alb=mix(alb,vec3(0.86,0.93,0.95),wtr*0.9); wet=mix(wet,0.4,wtr);
      ao*=mix(1.0,0.5+0.5*smoothstep(0.0,tE*0.6,tFr),riser);
    }
    // the pools: still dark water; rings spread where drips land, each of its own size, at its own place and beat
    vec2 dqr=(dripRings(vP.xz,3.7,tK,uRain)+dripRings(vec2(vP.x*0.8+vP.z*0.6,vP.z*0.8-vP.x*0.6)+17.0,6.1,tK+5.0,uRain))*see;
    // (where the cave's fall lands on the lake the water is white, and rings run out from its foot over the lake, dying as they go)
    float rrF=length(vP.xz-uCFall.xz), boilF=0.0;
    if(rrF<70.0&&abs(vP.y-uCFall.y)<3.0){ float rgF=sin(rrF*1.4-uTime*2.6)*exp(-rrF*0.045);
      dqr+=(vP.xz-uCFall.xz)/max(rrF,0.5)*(rgF*0.16*(1.0-smoothstep(45.0,70.0,rrF)));
      boilF=exp(-rrF*rrF/22.0)*(0.55+0.45*vn2(vP.xz*1.3-uTime*1.9)); }
    vec3 Np=vec3(dqr.x,1.0,dqr.y); Np=Np/max(length(Np),1e-3);
    float deep=smoothstep(tE2,tE2+0.4,tFr);                                               // clear water: the pale bottom shows at the rim, teal further in
    Nb=mix(Nb,Np,pool); alb=mix(alb,mix(vec3(0.17,0.17,0.13),vec3(0.022,0.075,0.08),mix(0.8,deep,see)),pool); wet=mix(wet,1.5,pool); gMirror=pool*(1.0-boilF);
    alb=mix(alb,vec3(0.62,0.68,0.68),pool*boilF);
  }
  cover=clamp(-1.0-vA.w,0.0,1.0)*smoothstep(0.5,0.8,abs(vN.y)/max(length(vN),1e-4));        // the forest's floor: leaf litter in light and shade, flecks of sun (a steep bank is bare bedded rock)
  gSunK=mix(1.0,0.1+0.9*fleckAt(vP),cover*0.92); gAmb=max(gAmb,0.14*cover);
  // (the day comes down between the crowns in patches some metres across: clear light here, clear shade there)
  { float dap=smoothstep(0.38,0.6,vn2(vP.xz*0.085+vec2(17.0,5.0))*0.7+w2*0.3); ao*=mix(1.0,0.11+0.7*dap,cover); }
#endif
  float gk=vA.y*smoothstep(0.25,0.7,m1*0.55+m2*0.45+vA.y*0.45+0.3*(bh-0.5)*edge*steep);   // (moss and ferns lie thickest on the ledges)
  gk*=mix(0.16,1.0,smoothstep(0.2,0.62,N.y))*(1.0-0.55*cover);                            // (moss lies on what looks up: a standing face keeps its stone, with a little green in its seams; under the trees the ground is leaf litter more than moss)
  vec3 moss=mix(vec3(0.03,0.085,0.025),vec3(0.15,0.27,0.055),m2*0.7+0.3*m3)*(0.7+0.6*m1);
  alb=mix(alb,moss,gk*(0.6+0.4*smoothstep(0.3,0.6,w2*0.5+m1*0.5))); wet*=1.0-0.75*gk;     // (and here and there the stone shows through it)
  alb=mix(alb,vec3(0.15,0.09,0.045)*(0.6+0.8*m2),cover*0.7*smoothstep(0.3,0.6,m1*0.6+m3*0.4+0.15));   // (litter: russet and brown)
  // (the low green of the forest's floor: seedlings, creepers and moss in patches between the litter)
  alb=mix(alb,mix(vec3(0.04,0.10,0.025),vec3(0.11,0.23,0.05),m2*0.6+m3*0.4),cover*0.7*smoothstep(0.42,0.66,vn2(vP.xz*0.11+3.0)*0.55+m1*0.45));
#ifdef FLOOR
  // (and small flowers in it, in drifts metres across, each drift of one colour, yellow or coral: every flower a dot)
  { float fp=smoothstep(0.69,0.79,vn2(vP.xz*0.075+vec2(31.0,9.0)))*cover;
    if(fp>0.0){ vec3 fc=w1<0.5?vec3(0.60,0.42,0.05):vec3(0.60,0.17,0.10);
      alb=mix(alb,fc,fp*mix(0.14,smoothstep(0.6,0.7,vn2(vP.xz*4.6+9.0)),(1.0-smoothstep(10.0,70.0,dC)))); } }
#endif
  alb*=mix(1.0,uShade,domeK*(1.0-cover)*(1.0-gk));                                      // the walls under the open sky read a little darker beside lit leaves
  { float m4=mix(0.5,vn2(vP.xz*6.5+1.0),(1.0-smoothstep(8.0,45.0,dC))*cover);            // fallen leaves and sprouts, seen close
    alb=mix(alb,vec3(0.30,0.19,0.07),0.55*smoothstep(0.62,0.8,m4)); alb*=0.72+0.56*m4; }
  alb=mix(alb,vec3(0.16,0.11,0.07),root*0.85);
  alb=mix(alb,vec3(0.25,0.24,0.21)*(0.8+0.4*m3),stn*0.85);
#ifdef FLOOR
  // the forest's floor seen close (under 24 m): pale pebbles, single fallen leaves, bright cushions of moss, each sharp
  { float nearK=(1.0-smoothstep(9.0,24.0,dC))*cover;
    if(nearK>0.0){ float pb=vn2(vP.xz*8.0+2.0), pb2=vn2(vP.xz*19.0+7.0), mc=vn2(vP.xz*3.7+11.0);
      alb=mix(alb,vec3(0.085,0.21,0.05)*(0.7+0.6*pb2),nearK*smoothstep(0.6,0.68,mc)*0.75);
      alb=mix(alb,vec3(0.21,0.20,0.17),nearK*smoothstep(0.69,0.75,pb)*0.8);
      alb=mix(alb,vec3(0.23,0.14,0.05),nearK*smoothstep(0.72,0.78,pb2)*0.75);
      alb*=1.0+nearK*(pb2-0.5)*0.4; } }
#endif
  vec3 col=caveLight(vP,Nb,alb,wet,ao);
#ifdef FLOOR
  // THE POOLS LIT FROM WITHIN (uPoolG: x, z, radius, the water's height). Where a lamp rests in the water the pools about
  // it glow turquoise and jade from their own depth, palest in the shallows, and shiver; their rims take the light as
  // cream. And every pool of the staircase, lamp or none, holds a little of that light: the water is clear over pale stone
  float shv=0.88+0.12*sin(uTime*2.1+vP.x*1.9+vP.z*1.3+4.0*vn2(vP.xz*0.7+uTime*0.25));
  float kAll=0.14*zone*(1.0-0.5*smoothstep(325.0,350.0,-vP.z));     // (less of it up the steep stairs, where the lamps and the day do the work)
  for(int i=0;i<NPG;i++){
    float R=uPoolG[i].z, dq=length(vP.xz-uPoolG[i].xy);
    kAll=max(kAll,(1.0-smoothstep(R*0.3,R*1.1,dq))*zone*(R>30.0?0.36:i>2?0.75:1.0));   // (the lake is deep: it glows a third as much as a small pool, and mirrors what stands in it; the pools of the steep stairs three quarters)
  }
  // (under the open roof the same clear water over pale stone is lit by the day: bright where the day comes down
  // between the crowns, deep where a crown shades it, and brightest where the pillar of sun finds it)
  if(stair>0.5) kAll=max(kAll,dayAt(vP)*(0.2+0.95*smoothstep(0.36,0.62,vn2(vP.xz*0.085+vec2(17.0,5.0))*0.7+w2*0.3))*0.9+0.8*shaftAt(vP));
  if(kAll>0.0){
    col+=mix(vec3(0.34,0.70,0.44),vec3(0.03,0.52,0.47),smoothstep(tE2,tE2+0.5,tFr))*(kAll*pool*shv*0.68);
    col+=vec3(0.36,0.33,0.25)*(kAll*clamp(rim+riser*0.6,0.0,1.0)*mix(0.4,0.08,stair));
  }
#endif
  gl_FragColor=vec4(airApply(col,vP),1.0);}`;

// ---- the sky seen through the skylight: pale blue late morning with thin bright cloud drifting
const SKY_VERT = /* glsl */`varying vec3 vP; void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const SKY_FRAG = /* glsl */`
varying vec3 vP; uniform float uTime; uniform vec3 uSunDir;
${GL_NOISE}
void main(){
  vec3 V=vP-cameraPosition; V=V/max(length(V),1e-3);
  vec2 q=vP.xz*0.012+vec2(uTime*0.004,uTime*0.0025);
  float c=vn2(q)*0.5+vn2(q*2.3+5.0)*0.3+vn2(q*5.1+9.0)*0.2;
  float cl=smoothstep(0.42,0.78,c);
  float sunward=max(dot(V,uSunDir),0.0);
  vec3 blue=mix(vec3(0.20,0.42,0.80),vec3(0.42,0.62,0.86),sunward*sunward);
  vec3 col=mix(blue,vec3(0.9,0.92,0.92),cl*0.5)*0.56;                 // (held back, so that at the world's exposure the opening is a blue sky with white cloud in it and no white hole)
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- small helpers
// a grid of nu x nv vertices placed by fn(i, j, out) -> out.p (x,y,z), out.a (4), out.c (3); normals from the faces
function gridFill(G, fn, j0, j1) {
  const { nu, pos, aA, aC, o } = G;
  for (let j = j0; j < j1; j++) for (let i = 0; i < nu; i++) {
    const k = j * nu + i; o.a[0] = 1; o.a[1] = 0; o.a[2] = 1; o.a[3] = -1; o.c[0] = o.c[1] = o.c[2] = 1;
    fn(i, j, o);
    pos[k * 3] = o.p[0]; pos[k * 3 + 1] = o.p[1]; pos[k * 3 + 2] = o.p[2];
    aA[k * 4] = o.a[0]; aA[k * 4 + 1] = o.a[1]; aA[k * 4 + 2] = o.a[2]; aA[k * 4 + 3] = o.a[3];
    aC[k * 3] = o.c[0]; aC[k * 3 + 1] = o.c[1]; aC[k * 3 + 2] = o.c[2];
  }
}
const gridStart = (nu, nv) => ({ nu, nv, pos: new Float32Array(nu * nv * 3), aA: new Float32Array(nu * nv * 4), aC: new Float32Array(nu * nv * 3), o: { p: [0, 0, 0], a: [1, 0, 1, -1], c: [1, 1, 1] } });
function gridEnd(G, keep) {
  const { nu, nv, pos, aA, aC } = G, n = nu * nv, idx = [];
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
    const a = j * nu + i, b = a + 1, c = a + nu, d = c + 1;
    if (keep && !keep(pos, a, b, c, d, aA)) continue;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aA', new THREE.BufferAttribute(aA, 4));
  g.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
function gridGeometry(nu, nv, fn, keep) { const G = gridStart(nu, nv); gridFill(G, fn, 0, nv); return gridEnd(G, keep); }
// the same grid, filled a few rows at a time with the page handed back in between (so that no step of the build is long)
async function gridGeometrySteps(nu, nv, fn, keep, rows, handBack) {
  const G = gridStart(nu, nv);
  for (let j = 0; j < nv; j += rows) { gridFill(G, fn, j, Math.min(nv, j + rows)); await handBack(); }
  const g = gridEnd(G, keep); await handBack();
  return g;
}
// merge geometries that carry position, normal, aA, aC (indexed)
function mergeGeo(list) {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), aA = new Float32Array(nv * 4), aC = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let v0 = 0, i0 = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, v0 * 3); nor.set(g.attributes.normal.array, v0 * 3); aA.set(g.attributes.aA.array, v0 * 4); aC.set(g.attributes.aC.array, v0 * 3);
    const gi = g.index.array; for (let k = 0; k < gi.length; k++) idx[i0 + k] = gi[k] + v0;
    v0 += c; i0 += gi.length; g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); m.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  m.setIndex(new THREE.BufferAttribute(idx, 1)); m.computeBoundingSphere();
  return m;
}
// move every vertex of a geometry (and turn its normals) by a matrix
function placed(g, m4) { g.applyMatrix4(m4); return g; }

// ---- the river: clear green-black water running toward the start, glints of the far light and of the tents, foam at its steps, white churned water down its cascade
const RIVER_VERT = /* glsl */`
attribute vec3 aR;                 // a (metres up the passage), across (-1..1), how steeply it climbs there (0 a level reach .. 1 a cascade)
varying vec3 vP; varying vec3 vR;
void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; vR=aR; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const RIVER_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vR;
uniform float uMilk;
${GL_CAVE}
float rip(vec2 p, float t, vec3 k){                                  // k: how much of each finer size of ripple can be told apart at this distance
  vec2 q=vec2(p.x*0.8+p.y*0.6,-p.x*0.6+p.y*0.8), s=vec2(p.x*0.55-p.y*0.835,p.x*0.835+p.y*0.55);     // (each size of ripple lies its own way)
  return vn2(vec2(p.x*0.9,p.y*0.45+t*1.9))*0.42+vn2(vec2(q.x*2.3+3.0,q.y*1.1+t*2.5))*(0.3*k.x)+vn2(vec2(s.x*4.6+7.0,s.y*2.4-t*3.3))*(0.18*k.y)+vn2(vec2(q.y*9.5,q.x*6.0+t*5.0))*(0.1*k.z);
}
void main(){
  vec2 p=vec2(vP.x,vR.x);                                            // across (metres), along
  float t=uTime;
  float fast=1.0+1.6*vR.z;
  float still=1.0-smoothstep(62.0,100.0,vR.x);                       // at the start the river is wide and slow: a black mirror
  float foot=length(fwidth(p));                                      // metres of water from one drawn sample to the next
  vec3 k=vec3(1.0-smoothstep(0.25,0.9,foot),1.0-smoothstep(0.12,0.45,foot),1.0-smoothstep(0.06,0.22,foot));
  float h0=rip(p,t,k), hx=rip(p+vec2(0.16,0.0),t,k), hy=rip(p+vec2(0.0,0.16),t,k);
  float sl=2.6*fast*mix(1.0,0.32,still);
  vec3 N=vec3(-(hx-h0)*sl,1.0,(hy-h0)*sl); N=N/max(length(N),1e-3);
  vec3 V=cameraPosition-vP; float dist=max(length(V),1e-3); V/=dist;
  float edge=1.0-abs(vR.y);
  vec3 deep=mix(vec3(0.004,0.016,0.012),vec3(0.02,0.045,0.035),uMilk);   // (after rain it carries a little silt)
  gSheen=0.0;                                                        // (water has no broad sheen under a lamp: it mirrors it, below)
  vec3 col=caveLight(vP,N,deep,2.4,1.0);
  // the far light on every ripple: the glowing air up the passage mirrored at a grazing angle
  vec3 R=reflect(-V,N); R.y=abs(R.y);
  float fr=1.0-max(dot(N,V),0.0); fr=0.03+0.97*fr*fr*fr*fr*fr;
  col+=airGlow(vP+R*220.0+vec3(0.0,40.0,0.0))*(uAirK.z*fr*mix(2.6,0.9,still));
  col+=uCool*(0.15+1.6*fr);                                      // (and the cave's own cool light off the wet roof: the troughs are a deep blue, never black)
  // every lamp and both lit tents: each a long streak of light on the water toward the eye, that shivers on the ripples
  for(int i=0;i<NL;i++){
    vec3 d=uLampP[i].xyz-vP; float rh=max(length(d.xz),1e-3), Rh=max(length(R.xz),1e-3);
    vec2 Lh=d.xz/rh;
    float saz=(R.x*Lh.y-R.z*Lh.x)/Rh, caz=dot(R.xz,Lh)/Rh, del=R.y/Rh-d.y/rh;      // (the mirrored ray against the way to the lamp: to the side, and up and down)
    float waz=i<2?0.05:0.015, m=max(max(uLampC[i].r,uLampC[i].g),max(uLampC[i].b,1e-3));
    float g=exp(-saz*saz/(waz*waz)-del*del/0.045)*step(0.0,caz)*step(-400.0,uLampP[i].y)*(1.0-smoothstep(120.0,220.0,rh));
    col+=uLampC[i]/m*(g*(i<2?0.8:1.4)*(0.3+0.7*fr));
  }
  float gl=smoothstep(0.62,0.9,vn2(vec2(p.x*3.1,p.y*1.4+t*5.5))*0.6+h0*0.4)*k.y;
  col+=airGlow(vP+vec3(0.0,60.0,-200.0))*(uAirK.z*gl*fr*mix(2.5,0.9,still));
  // (and straight below the eye, where the water is black: every ripple steep enough carries a glint of the lit air far up the passage)
  float gl2=smoothstep(0.6,0.85,vn2(vec2(p.x*2.1+4.0,p.y*0.9+t*4.2))*0.55+hy*0.45)*k.x;
  col+=airGlow(vP+vec3(0.0,60.0,-420.0))*(uAirK.z*gl2*mix(0.3,0.12,still));
  // foam: lines drawn out along the current, thick at the steps and thin along the banks
  float fl=vn2(vec2(p.x*1.6,p.y*0.16+t*0.75))*0.6+vn2(vec2(p.x*4.0,p.y*0.5+t*1.6))*0.4;
  float foam=smoothstep(0.62,0.82,fl)*(0.12+0.5*(fast-1.0))+(1.0-smoothstep(0.4,0.75,edge*4.0))*smoothstep(0.45,0.7,fl)*0.25;
  foam+=(fast-1.0)*smoothstep(0.35,0.7,vn2(vec2(p.x*2.2,p.y*1.3+t*3.6)))*0.35;
  // THE CASCADE: where the river comes down a chute it is broken water: it churns white over one rounded step of
  // rock after another (some 4 m apart, each bowed and of its own breadth), and runs green and smooth into the next
  float casc=smoothstep(0.1,0.4,vR.z);
  if(casc>0.0){
    float churn=vn2(vec2(p.x*1.1,p.y*0.7+t*3.2))*0.55+vn2(vec2(p.x*2.9+3.0,p.y*1.8+t*5.5))*0.45;
    float led=0.5+0.5*sin(p.y*1.6+3.2*vn2(vec2(p.x*0.3,p.y*0.11))+0.5*sin(p.x*0.7));
    foam=mix(foam,clamp(smoothstep(0.22,0.66,churn)*(0.3+0.7*led)+0.3*led*led,0.0,1.0),casc);
  }
  foam*=1.0-still;
  vec3 foamCol=vec3(0.55,0.6,0.58);
  vec3 ls; vec3 ld=lampsAt(vP,vec3(0.0,1.0,0.0),V,0.0,ls);
  float day=dayAt(vP);
  col+=foamCol*clamp(foam,0.0,1.0)*(uDayCol*day*0.9+ld+shaftAt(vP)*uSunCol*0.5+uCool*(0.4+0.5*casc));
  col+=ld*(fr*0.02);
  float a=smoothstep(0.0,0.1,edge);
  gl_FragColor=vec4(airApply(col,vP),a);
}`;

// ---- a tent lit from inside: plain fabric, seams and two crossed poles, brighter near the lamp on its floor
const TENT_VERT = /* glsl */`varying vec3 vP; varying vec2 vUv; void main(){ vUv=uv; vP=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const TENT_FRAG = /* glsl */`
varying vec3 vP; varying vec2 vUv; uniform vec3 uCol; uniform float uGlow;
${GL_CAVE}
void main(){
  float pole=1.0-smoothstep(0.0,0.035,abs(fract(vUv.x*2.0+0.25)-0.5)*2.0-0.93+0.0*vUv.y);
  float seam=1.0-smoothstep(0.0,0.02,abs(fract(vUv.x*4.0)-0.5));
  float lum=uGlow*(0.45+0.55*(1.0-vUv.y)*(1.0-vUv.y))*(1.0-0.45*pole)*(1.0-0.25*seam)*(0.9+0.2*vn2(vUv*vec2(60.0,24.0)));
  gl_FragColor=vec4(airApply(uCol*lum,vP),1.0);
}`;

// ---- the threads of drops from the skylight's rim (none falls in the cave): each drop is a short streak, bright only where there is light to catch
const DRIP_VERT = /* glsl */`
attribute vec4 iP;                 // x, the height it falls from, z, the height of the fall
attribute vec4 iQ;                 // period (s), phase, width (m), brightness
varying float vB; varying vec2 vUv; varying vec3 vL;
${GL_CAVE}
void main(){
  float tau=fract(uTime/iQ.x+iQ.y);
  float fall=iP.w*tau*tau, len=0.25+2.2*tau;
  vec3 c=vec3(iP.x,iP.y-fall,iP.z);
  vec3 toC=cameraPosition-c; float dist=max(length(toC),1e-3);
  vec3 rt=cross(vec3(0.0,1.0,0.0),toC); rt=rt/max(length(rt),1e-3);
  float w=max(iQ.z,dist*0.002);
  vec3 p=c+rt*(position.x*w)+vec3(0.0,position.y*len,0.0);
  vec3 ls; vec3 ld=lampsAt(c,toC/dist,toC/dist,0.0,ls);
  float inSea=mistBetween(c).a;                                      // (a drop is lost to sight where it falls into the mist)
  vL=(airGlow(c)*uAirK.z*1.4+uDayCol*dayAt(c)*0.9+ld*0.6+uSunCol*shaftAt(c)*0.5)*iQ.w*min(1.0,iQ.z/w*1.5+0.25)*(1.0-inSea);
  vB=smoothstep(0.0,0.04,tau)*(1.0-smoothstep(0.96,1.0,tau));
  vUv=position.xy;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}`;
const DRIP_FRAG = /* glsl */`
varying float vB; varying vec2 vUv; varying vec3 vL;
void main(){
  float a=max(1.0-abs(vUv.x)*2.0,0.0)*smoothstep(0.0,0.25,vUv.y)*(1.0-smoothstep(0.55,1.0,vUv.y));
  gl_FragColor=vec4(vL*(a*vB),1.0);
}`;

// ---- THE PILLAR OF SUN: light and no body. The lit air of the round pillar under the skylight, drawn as a stack of soft
// additive slices that all contain the sun's direction and turn about the pillar's own axis to face the eye, as a sprite
// does; each stands for its own slab of air and carries the beams that pass through it (beamAt: several broad beams with
// darker air between them), so the bundle reads as beams from every side and the wall and the trees behind are seen through it.
const SHAFT_VERT = /* glsl */`
attribute vec2 aS;                 // across the slice (-1..1), the slice's place in its stack (-1..1)
uniform float uLen, uHalf;
varying vec3 vP; varying vec3 vNs; varying float vIn;
${GL_CAVE}
void main(){
  vIn=shaftIn(cameraPosition);     // (how far inside the pillar's round the eye itself stands)
  vec3 top=vec3(uSkyC.x,uSkyC.y,uSkyC.z)+uSunDir*18.0;
  vec3 e=cameraPosition-(top-uSunDir*(0.5*uLen)); e-=uSunDir*dot(e,uSunDir);
  float el=length(e); vec3 n=el>1e-3?e/el:normalize(vec3(uSunDir.y,-uSunDir.x,0.0));
  vec3 across=cross(uSunDir,n);
  vec3 p=top-uSunDir*(position.y*uLen)+across*(aS.x*uHalf)+n*(aS.y*uHalf);
  vP=p; vNs=n;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}`;
const SHAFT_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vNs; varying float vIn;
uniform vec3 uShaftCol; uniform float uGap;
${GL_CAVE}
void main(){
  vec3 V=vP-cameraPosition; float dist=max(length(V),1e-3); V/=dist;
  vec2 q; float t; float R=shaftRim(vP,q,t), r=length(q);
  float soft=7.0+0.06*max(t,0.0);
  float m=1.0-smoothstep(R-soft*1.4,R+soft*0.5,r);
  if(m<=0.0) discard;
  m*=beamAt(q);                                                      // the beams: the same down the pillar's whole length
  m*=0.7+0.9*exp(-max(t,0.0)/75.0);                                  // brightest where they come in at the skylight
  // the wet air itself is not even, and drifts
  m*=0.66+0.68*vn3(vec3((vP.xz-uDrift*(uTime*5.0))*0.024,vP.y*0.024-uTime*0.08));
  m*=1.0-smoothstep(uSkyC.y-6.0,uSkyC.y+12.0,vP.y);
  float w=1.0/max(abs(dot(V,vNs)),0.3);                              // (the length of the eye's ray inside this slice's slab of air)
  w*=smoothstep(0.5,mix(14.0,46.0,vIn),abs(dot(vP-cameraPosition,vNs)));   // (no slice is seen passing through the eye: soft, as a particle is; and the air about an eye that stands in the pillar is clear to it)
  // (under the ground mist's top, in the hollow, the pillar is the mist's own white gold, not lit air)
  if(vP.y<uSea.x+3.0) w*=mix(1.0,smoothstep(-5.0,3.0,vP.y-mistTop(vP.xz)),mistEdge(vP.xz));
  // wet air throws the sun's light mostly onward: the beams are brightest to an eye that looks up them toward the sun, and
  // thin to one that looks across them or down them (1 where the passage looks at them)
  float cs=dot(V,uSunDir); w*=min(0.98/pow(1.49-1.4*cs,1.5),mix(2.5,1.1,vIn));
  // from inside the pillar the eye is used to its light: the lit air between it and the forest takes less of what it sees
  w*=1.0-0.6*vIn;
  gl_FragColor=vec4(uShaftCol*(m*w*uGap),1.0);
}`;

// ---- wisps and veils: soft sprites that turn to face the eye, drifting toward the dome (a few pour the other way, down
// between the threshold's blocks: their speed is negative); lit by the place they are in
const PUFF_VERT = /* glsl */`
attribute vec4 iP;                 // place, size
attribute vec4 iQ;                 // drift speed (m/s), span of its lap (m), phase, opacity
attribute vec2 iR;                 // how far it lifts over its lap (m), its height for its width
varying vec2 vUv; varying vec3 vL; varying float vA; varying float vSeed;
${GL_CAVE}
void main(){
  float lap=fract(uTime*iQ.x/max(iQ.y,1.0)+iQ.z);
  vec3 c=iP.xyz+vec3(uDrift.x,0.0,uDrift.y)*((lap-0.5)*iQ.y);
  c.y+=sin(uTime*0.11+iQ.z*40.0)*0.8+iR.x*lap;
  vec3 toC=cameraPosition-c; float dist=max(length(toC),1e-3);
  vec3 rt=cross(vec3(0.0,1.0,0.0),toC); rt=rt/max(length(rt),1e-3); vec3 up=cross(toC/dist,rt);
  vec3 p=c+(rt*position.x+up*position.y*iR.y)*iP.w;
  float day=dayAt(c), sh=shaftAt(c);
  vec3 ls; vec3 nn=toC/dist;
  vL=uSeaCol*(day*(0.8+0.08*iR.x))+vec3(0.86,0.92,0.97)*(smoothstep(0.62,0.97,day)*0.62)+uSunCol*(sh*0.22)+lampsAt(c,nn,nn,0.0,ls)*0.3;   // (white in the dome's day, gold where a sunbeam finds it)
  vA=iQ.w*sin(lap*3.1416)*smoothstep(iP.w*0.25,iP.w*1.1,dist);
  vUv=position.xy; vSeed=iQ.z*31.0;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}`;
const PUFF_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vL; varying float vA; varying float vSeed;
uniform float uTime;
${GL_NOISE}
void main(){
  float r=length(vUv)*2.0;
  float n=vn2(vUv*3.1+vSeed+vec2(uTime*0.24,0.0))*0.6+vn2(vUv*7.3+vSeed*1.7+vec2(uTime*0.45,-uTime*0.1))*0.4;   // (the wisp churns as it drifts)
  float a=1.0-smoothstep(0.0,1.0,r+0.55*(n-0.5)); a*=a*vA;            // (soft to its edge: a wisp has no outline)
  gl_FragColor=vec4(vL*(0.6+0.8*n)*a,a);
}`;

// ---- lianas and hanging roots: cords that hang from an anchor and swing like pendulums on the world's clock; a ribbon turned to
// the eye, with a least width that grows with its distance
const LIANA_VERT = /* glsl */`
attribute vec4 aL;                 // the anchor (x, y, z) and the cord's length
attribute vec4 aM;                 // place along it (0 at the anchor .. 1 at the tip), side (-1 / 1), phase, width (m)
varying vec3 vP; varying vec2 vUv; varying float vPh;
uniform float uTime;
void main(){
  float t=aM.x, ph=aM.z*6.2831;
  float swing=t*t*aL.w*0.035;
  vec3 c=aL.xyz+vec3(sin(uTime*0.7+ph)*swing+sin(uTime*1.9+ph*3.0)*swing*0.25, -aL.w*t+swing*0.1*cos(uTime*0.7+ph), cos(uTime*0.55+ph*1.7)*swing);
  c.x+=sin(t*9.0+ph)*0.12*aL.w*0.05; c.z+=cos(t*7.0+ph*2.0)*0.12*aL.w*0.05;
  vec3 toC=cameraPosition-c; float dist=max(length(toC),1e-3);
  vec3 rt=cross(vec3(0.0,1.0,0.0),toC); rt=rt/max(length(rt),1e-3);
  float w=max(aM.w*(1.0-0.5*t),dist*0.0022);
  vec3 p=c+rt*(aM.y*w*0.5);
  vP=p; vUv=vec2(aM.y,t*aL.w); vPh=aM.z;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}`;
const LIANA_FRAG = /* glsl */`
varying vec3 vP; varying vec2 vUv; varying float vPh;
${GL_CAVE}
void main(){
  float round=sqrt(max(1.0-vUv.x*vUv.x,0.0));
  float leaf=smoothstep(0.55,0.8,vn2(vec2(vUv.y*0.45,vPh*40.0)));
  vec3 alb=mix(vec3(0.10,0.075,0.05),vec3(0.06,0.17,0.045),leaf)*(0.6+0.5*vn2(vec2(vUv.y*3.0,vPh*17.0)));
  float day=dayAt(vP), sh=shaftAt(vP);
  vec3 col=alb*(uDayCol*(day*(0.35+0.65*round))+uSunCol*(sh*(0.25+0.6*round))+pillarGlow(vP,normalize(cameraPosition-vP))*1.5);
  gl_FragColor=vec4(forestAir(col,vP),1.0);
}`;

// ---- THE FOREST'S ROOF: each crown is a lumpy cap of leaves in its own green, lit on the side that faces the skylight and
// dark under its rim and between its boughs; where the pillar of sun stands on it the leaves burn yellow-green; some stand
// in flower. Gusts run over the roof as a ripple of light, and every crown stirs.
const CROWN_VERT = /* glsl */`
attribute float aH;                // height in the crown's own form: -1 at its underside .. 1 at its top
varying vec3 vP, vN, vO, vT; varying float vH;
uniform float uTime;
void main(){
  vec4 wp=instanceMatrix*vec4(position,1.0); vec3 o=instanceMatrix[3].xyz;
  vec3 n=normalize(mat3(instanceMatrix)*normal);
  float ph=o.x*0.37+o.z*0.53;
  wp.xyz+=vec3(sin(uTime*0.7+ph)+0.4*sin(uTime*1.9+ph*2.0+wp.y*0.3),0.0,cos(uTime*0.6+ph*1.3))*(0.14*(1.2+aH));
  wp.xyz+=n*(0.14*sin(uTime*1.3+dot(wp.xyz,vec3(0.9,0.7,1.1))));
  vP=wp.xyz; vN=n; vO=o; vH=aH;
  vT=vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vT=instanceColor;
  #endif
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const CROWN_FRAG = /* glsl */`
varying vec3 vP, vN, vO, vT; varying float vH;
uniform vec3 uLeafA, uLeafB; uniform float uUnder;
uniform vec4 uBloom;               // the colour of the flowers, and how much of the crown stands in flower
${GL_CAVE}
void main(){
  vec3 N=vN/max(length(vN),1e-4);
  vec3 V=cameraPosition-vP; float dist=max(length(V),1e-3); V/=dist;
  float lod=1.0-smoothstep(40.0,160.0,dist), lod2=1.0-smoothstep(14.0,60.0,dist);
  vec3 q=vP+vec3(sin(uTime*0.5+vO.x),0.0,cos(uTime*0.43+vO.z))*0.14;
  float c1=vn3(q*0.42+vO*0.1), c2=vn3(q*1.3+7.0), c3=mix(0.5,vn3(q*3.9+3.0),lod), c4=mix(0.5,vn3(q*10.5+1.0),lod2);
  vec3 g=vec3(vn3(q*0.42+vO*0.1+vec3(0.7,0.0,0.0))-c1, vn3(q*0.42+vO*0.1+vec3(0.0,0.7,0.0))-c1, vn3(q*0.42+vO*0.1+vec3(0.0,0.0,0.7))-c1);
  vec3 g2=vec3(vn3(q*1.3+7.0+vec3(0.5,0.0,0.0))-c2, vn3(q*1.3+7.0+vec3(0.0,0.5,0.0))-c2, vn3(q*1.3+7.0+vec3(0.0,0.0,0.5))-c2);
  vec3 Nb=N-g*1.8-g2*(1.4*lod); Nb=Nb/max(length(Nb),1e-3);
  float clump=c1*0.3+c2*0.35+c3*0.35;
  float hole=smoothstep(0.3,0.52,clump);                              // between the boughs it is dark
  // close to, the mass is leaves: sprays a hand across, light ones and dark ones, and black between them
  float lf=mix(0.5,vn3(q*24.0+5.0),1.0-smoothstep(10.0,42.0,dist)), spray=smoothstep(0.25,0.7,c4*0.55+lf*0.45);
  vec3 alb=mix(uLeafA,uLeafB,smoothstep(0.3,0.8,c2*0.4+c3*0.3+lf*0.3)*0.8)*vT*(0.62+0.38*hole)*mix(1.0,0.55+0.75*spray,lod2);
  float fl=uBloom.w*smoothstep(0.5,0.6,vn3(q*2.3+vO*0.3)*0.55+c4*0.45)*smoothstep(-0.3,0.4,vH);
  alb=mix(alb,uBloom.rgb,fl);
  float ao=(0.12+0.88*smoothstep(-0.7,0.75,vH))*(0.42+0.58*hole);    // (deep green shade under and inside a crown, the day on its top)
  float day=dayAt(vP), sh=shaftAt(vP)*mix(1.0,fleckAt(vP),uUnder);
  float gust=0.76+0.52*smoothstep(0.22,0.78,vn2((vP.xz-uDrift*(uTime*7.0))*0.05));   // a gust turns the leaves' pale sides up as it passes
  // the day comes down through the skylight: the side of a crown that faces it is lit, the other lies in its own shade
  vec3 Ld=vec3(uSkyC.x,uSkyC.y-30.0,uSkyC.z)-vP; Ld=Ld/max(length(Ld),1e-3);
  float nd=dot(Nb,Ld)*0.5+0.5;
  vec3 col=alb*(uDayCol*0.2+uDayDome*(0.95*nd*nd))*(day*ao*gust*(1.0-0.35*uUnder));   // (tops in the opening's green-gold day, undersides in cool green shade)
  float nl=dot(Nb,uSunDir), wrap=max(nl*0.6+0.4,0.0);
  float thru=max(-nl,0.0)*max(dot(V,-uSunDir),0.0);
  vec3 burn=mix(alb,vec3(0.30,0.44,0.05)*(0.6+0.8*hole),0.5*(1.0-fl));  // (in the sun the leaves are yellow-green and burn)
  col+=burn*uSunCol*(sh*ao*gust*(wrap*wrap*0.5+thru*0.35));
  col+=alb*(pillarGlow(vP,Nb)*(2.2*ao)+ringLight(vP,Nb));
  col+=alb*uBounce*((1.0-smoothstep(0.0,120.0,upPassage(vP)))*1.2);
  gl_FragColor=vec4(forestAir(col,vP),1.0);
}`;

// ---- trunks: the pale boles of the forest's trees and the two figs' roots and boughs. Bark in long plates, blotched with
// lichen, moss up the foot; lit as the rock is, in the crowns' shade
const TRUNK_VERT = /* glsl */`
attribute vec4 aA;                 // round the bole (0..1), up it (0 at the foot .. 1)
varying vec3 vP, vN, vT; varying vec2 vUv;
uniform float uTime;
void main(){
  vec4 wp=vec4(position,1.0); vec3 n=normal, o=vec3(0.0); float sw=0.0;
  #ifdef USE_INSTANCING
  wp=instanceMatrix*wp; n=mat3(instanceMatrix)*n; o=instanceMatrix[3].xyz; sw=aA.y*aA.y;
  #endif
  float ph=o.x*0.37+o.z*0.53;
  wp.xyz+=vec3(sin(uTime*0.7+ph),0.0,cos(uTime*0.6+ph*1.3))*(0.14*sw);
  vP=wp.xyz; vN=n; vUv=aA.xy;
  vT=vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vT=instanceColor;
  #endif
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const TRUNK_FRAG = /* glsl */`
varying vec3 vP, vN, vT; varying vec2 vUv;       // vUv: round the bole (0..1), up it (0 at the foot .. 1)
uniform float uUnder;
${GL_CAVE}
void main(){
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  float dist=length(cameraPosition-vP), lod=1.0-smoothstep(30.0,140.0,dist);
  float fis=vn2(vec2(vUv.x*26.0,vP.y*0.5)), pl=vn2(vec2(vUv.x*7.0+3.0,vP.y*0.17));
  vec3 alb=vT*mix(vec3(0.15,0.135,0.11),vec3(0.36,0.335,0.28),0.3+0.7*pl)*(1.0-0.5*lod*(1.0-smoothstep(0.25,0.45,fis)));
  alb=mix(alb,vec3(0.40,0.42,0.34),0.55*smoothstep(0.6,0.7,vn3(vP*0.8+4.0)));                // lichen
  float mossK=smoothstep(0.4,0.75,vn3(vP*0.45+9.0)*0.55+(1.0-smoothstep(0.0,0.3,vUv.y))*0.6);
  alb=mix(alb,vec3(0.06,0.14,0.04),mossK*0.8);
  float ao=(0.4+0.6*smoothstep(0.0,0.12,vUv.y))*(1.0-0.45*uUnder);
  gSunK=mix(1.0,fleckAt(vP),uUnder);
  vec3 col=caveLight(vP,N,alb,0.1,ao)+alb*pillarGlow(vP,N)*ao;
  gl_FragColor=vec4(forestAir(col,vP),1.0);
}`;

// ---- wild banana and its kin: great paddle leaves on a short stem. Each blade is a bent strip with a pale midrib, cut to a
// leaf's outline and torn along its veins; it glows through where the light is behind it
const PADDLE_VERT = /* glsl */`
attribute vec3 aB;                 // across the blade (-1..1), along it (0 at the stem .. 1 at the tip), the blade's own number
varying vec3 vP, vN, vT, vB;
uniform float uTime;
void main(){
  vec4 wp=instanceMatrix*vec4(position,1.0); vec3 o=instanceMatrix[3].xyz;
  float ph=o.x*0.61+o.z*0.47+aB.z*6.0, k=aB.y*aB.y*length(instanceMatrix[1].xyz);
  wp.xyz+=vec3(sin(uTime*0.9+ph),0.4*sin(uTime*1.7+ph*1.3),cos(uTime*0.75+ph*1.6))*(0.06*k);
  vP=wp.xyz; vN=mat3(instanceMatrix)*normal; vB=aB;
  vT=vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vT=instanceColor;
  #endif
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const PADDLE_FRAG = /* glsl */`
varying vec3 vP, vN, vT, vB;
uniform float uUnder;
${GL_CAVE}
void main(){
  float u=vB.x, v=vB.y, au=abs(u);
  float w=pow(clamp((v-0.14)/0.2,0.0,1.0),0.6)*(1.0-pow(clamp((v-0.5)/0.5,0.0,1.0),2.4));     // the blade's outline (below 0.14 it is the stalk)
  float vv=v*22.0+vB.z*9.0;
  if(v>0.14){
    if(au>max(w,0.07)) discard;
    if(h21(vec2(floor(vv+0.5),vB.z*31.0))>0.76&&abs(fract(vv)-0.5)>0.43&&au>w*0.28) discard;   // slits torn along the veins
  } else if(au>0.07) discard;
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  vec3 V=cameraPosition-vP; float dist=max(length(V),1e-3); V/=dist;
  float rib=1.0-smoothstep(0.035,0.1,au), vein=0.5+0.5*cos(vv*6.2831);
  vec3 alb=mix(vec3(0.04,0.17,0.03),vec3(0.13,0.34,0.055),0.3+0.3*vein+0.4*vn2(vec2(v*5.0+vB.z*7.0,u*2.0)))*vT;
  alb=mix(alb,vec3(0.30,0.40,0.14),rib*0.8);
  float day=dayAt(vP), sh=shaftAt(vP)*mix(1.0,fleckAt(vP),uUnder);
  vec3 Ld=vec3(uSkyC.x,uSkyC.y-30.0,uSkyC.z)-vP; Ld=Ld/max(length(Ld),1e-3);
  float nd=dot(N,Ld);
  vec3 col=alb*uDayCol*(day*(0.14+0.8*max(nd,0.0)+0.55*max(-nd,0.0)));
  float nl=dot(N,uSunDir);
  col+=mix(alb,vec3(0.30,0.46,0.05),0.4)*uSunCol*(sh*(max(nl,0.0)*0.8+max(-nl,0.0)*0.7));
  vec3 H=Ld+V; H=H/max(length(H),1e-3); float s=max(dot(N,H),0.0); s*=s; s*=s; s*=s; s*=s;
  col+=uDayCol*(day*s*0.22);                                          // the day's sheen on the waxy blade
  col+=alb*(pillarGlow(vP,N)*2.2+ringLight(vP,N));
  gl_FragColor=vec4(forestAir(col,vP),1.0);
}`;

// ---- the fall's water: white strands where it falls down the wall, dark and glinting where it lies in its pool
const RUN_VERT = /* glsl */`
attribute vec3 aW;                 // across (-1..1 the water, to -2 and 2 its banks), metres from its head, how it goes there (-0.4 lying in the pool, 1.5 falling down the wall)
varying vec3 vP, vW;
void main(){ vP=position; vW=aW; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0); }`;
const RUN_FRAG = /* glsl */`
varying vec3 vP, vW;
uniform vec2 uFallP;               // the fall's foot (x, z)
uniform vec3 uPoolC;               // the pool's middle (x, z) and its radius
${GL_CAVE}
void main(){
  float pool=clamp(-vW.z*2.5,0.0,1.0);
  float e=abs(vW.x), ragged=mix(0.86,0.7,pool)+mix(0.14,0.24,pool)*vn2(vec2(vW.y*0.55,sign(vW.x)*3.0)+vP.xz*0.9*pool);
  if(e>ragged){                                                       // the water's own banks: wet stones with moss on them (a pool's margin is broad and mossy)
    if(vW.z>1.2) discard;                                             // (falling water has no banks: beside it is air)
    float m=vn2(vP.xz*1.3), st=vn2(vP.xz*4.0+3.0);
    vec3 alb=mix(vec3(0.05,0.052,0.042),vec3(0.065,0.15,0.045),smoothstep(0.2,0.6,m*0.6+st*0.4+(e-1.0)*0.6));
    alb=mix(alb,vec3(0.36,0.33,0.25)*(0.8+0.4*st),pool);                // (the pool's margin is pale rimstone)
    vec3 Nn=vec3((st-0.5)*0.9,1.0,(m-0.5)*0.9); Nn=Nn/length(Nn);
    gRim=0.0;
    gl_FragColor=vec4(forestAir(caveLight(vP,Nn,alb,0.12,0.6),vP),1.0);
    return;
  }
  float sp=1.2+2.5*min(vW.z,1.0), tall=step(1.2,vW.z), ys=vW.y*mix(1.0,0.3,tall);   // (down the wall the water is drawn out into long strands)
  float flow=vn2(vec2(vW.x*2.5,ys*1.3-uTime*sp))*0.6+vn2(vec2(vW.x*6.0+4.0,ys*3.1-uTime*sp*1.7))*0.4;
  float white=smoothstep(0.34,0.68,flow*(0.42+mix(0.82,0.9,tall)*min(vW.z,1.25)));   // (a fall is strands of white with the dark water between them)
  // (a fall is no strip: it is whole in its middle and breaks toward its two edges into strands and threads with air between them)
  { float thr=vn2(vec2(vW.x*13.0+2.0,ys*0.45-uTime*sp*0.8)), er=e/ragged;
    if(vW.z>0.6&&mix(flow,thr,0.45*tall)<mix(0.36,0.10,tall)+mix(0.3,0.62,tall)*er*er) discard; }
  float deep=smoothstep(0.0,0.55,ragged-e);                           // (0 at the water's edge, 1 out in it)
  vec3 V=cameraPosition-vP; V=V/max(length(V),1e-3);
  vec3 N=vec3((flow-0.5)*0.7,1.0,(vn2(vec2(vW.y*2.0+uTime*sp*0.5,vW.x*3.0))-0.5)*0.7); N=N/length(N);
  float day=dayAt(vP);
  vec3 Ld=vec3(uSkyC.x,uSkyC.y-30.0,uSkyC.z)-vP; Ld=Ld/max(length(Ld),1e-3);
  vec3 H=Ld+V; H=H/max(length(H),1e-3); float s=max(dot(N,H),0.0); s*=s; s*=s; s*=s; s*=s; s*=s; s*=s;
  float nv=1.0-max(dot(N,V),0.0), fr=0.04+0.96*nv*nv*nv;
  vec3 col=vec3(0.02,0.04,0.028)*day;                                 // clear water over dark stones
  vec3 Rf=reflect(-V,N);                                              // what it mirrors: the skylight's day where the mirrored ray finds the opening, else the dome's green shade
  // (a pool mirrors the forest's roof: leaves, and the day in the gaps between them)
  float lf=vn2(Rf.xz*5.0+vP.xz*0.35)*0.6+vn2(Rf.xz*13.0+7.0)*0.4;
  vec3 roofC=mix(vec3(0.035,0.09,0.03),mix(vec3(0.10,0.24,0.07),uDayCol*1.3,smoothstep(0.62,0.8,lf)),smoothstep(0.3,0.6,lf));
  col+=mix(mix(vec3(0.05,0.1,0.05),roofC,pool),uDayCol,smoothstep(0.8,0.97,dot(Rf,Ld)))*(day*fr*(0.2+1.3*pool));
  // (and is clear over pale stone, as the cave's pools are: jade at its edge, turquoise further out, and brighter where the sun finds it)
  { float mid=1.0-smoothstep(0.2,0.95,length(vP.xz-uPoolC.xy)/uPoolC.z);        // (and deep in its middle: a darker blue)
    col+=mix(mix(vec3(0.34,0.66,0.44),vec3(0.03,0.50,0.50),deep),vec3(0.01,0.15,0.34),0.85*mid)*(pool*(1.0-fr)*(0.75+0.5*vn2(vP.xz*0.9+vec2(uTime*0.2,0.0)))*(0.42*day+0.5*shaftAt(vP))); }
  { float rr=length(vP.xz-uFallP.xy), rg=sin(rr*1.7-uTime*3.0)*exp(-rr*0.09);       // (rings run out from the fall's foot, and the water is white where it lands)
    col+=uDayCol*(day*pool*(0.10*max(rg,0.0)+0.9*exp(-rr*rr/40.0)*(0.6+0.4*vn2(vP.xz*1.4-uTime*2.0)))); }
  // (white water in the opening's day; the great fall is strands of white with blue-grey shadow between them, never a blank sheet)
  { float strand=smoothstep(0.3,0.72,flow*0.75+0.25*vn2(vec2(vW.x*11.0,ys*0.8-uTime*sp*1.3)));
    // (in the cave the falling water is lit by the lamp that is turned on it and by the lake's glow under it)
    vec3 lsF; vec3 lampF=lampsAt(vP,V,V,0.0,lsF)*0.5+poolsAt(vP,vec3(0.0,-1.0,0.0))*0.9+uCool*0.5;
    vec3 wc=mix(vec3(0.6,0.8,0.85)*(day*0.6)+uSunCol*(shaftAt(vP)*0.3)+pillarGlow(vP,vec3(0.0,1.0,0.0))*0.6,
      mix(vec3(0.27,0.40,0.48),vec3(0.95,0.98,1.0),strand)*(vec3(0.36*day+0.1*shaftAt(vP))+lampF*(1.0-smoothstep(0.0,60.0,150.0-upPassage(vP)))),tall);
    col=mix(col,wc,white*mix(0.75,0.97,tall)); }
  col+=vec3(0.9,0.96,1.0)*(day*s*1.8);                                // glints
  // fallen petals ride the water: coral, white and yellow specks that go down with it and turn slowly in the pools
  { vec2 pc=vec2(vW.x*2.6,vW.y*2.2-uTime*sp*0.45), ci=floor(pc), cf=fract(pc)-0.5; float hp=h21(ci+7.0);
    if(hp>0.9&&tall<0.5){ vec2 o2=(vec2(h21(ci+3.0),h21(ci+11.0))-0.5)*0.5; float pt=1.0-smoothstep(0.07,0.14,length(cf-o2));
      vec3 pcol=hp>0.966?vec3(1.0,0.82,0.2):hp>0.933?vec3(1.0,0.95,0.86):vec3(1.0,0.42,0.3);
      col=mix(col,pcol*(uDayCol*day*1.5+uSunCol*(shaftAt(vP)*0.4)+vec3(0.03)),pt*(1.0-0.8*white)); } }
  gl_FragColor=vec4(forestAir(col,vP),1.0);
}`;

// ---- motes (or seed fluff) adrift in the lit air: specks that only show where the sun or the daylight finds them
const MOTE_VERT = /* glsl */`
attribute vec4 iP;                 // place, size (m)
attribute vec4 iQ;                 // fall speed (m/s, negative rises), span of its lap (m), phase, brightness
uniform float uFluff;
varying vec2 vUv; varying vec3 vL;
${GL_CAVE}
void main(){
  float lap=fract(uTime*iQ.x/max(iQ.y,1.0)+iQ.z), ph=iQ.z*6.2831;
  vec3 c=iP.xyz+vec3(sin(uTime*0.31+ph)*0.9+sin(uTime*0.83+ph*2.0)*0.3, (0.5-lap)*iQ.y, cos(uTime*0.27+ph*1.3)*0.9);
  vec3 toC=cameraPosition-c; float dist=max(length(toC),1e-3);
  vec3 rt=cross(vec3(0.0,1.0,0.0),toC); rt=rt/max(length(rt),1e-3); vec3 up=cross(toC/dist,rt);
  float w=max(iP.w,dist*0.0021);
  vec3 p=c+(rt*position.x+up*position.y)*w;
  float ck=mistBetween(c).a;
  float tw=0.6+0.4*sin(uTime*(1.5+2.0*iQ.z)+ph*5.0);
  vL=(uSunCol*(shaftAt(c)*0.34)+uDayCol*(dayAt(c)*0.05*uFluff))*(iQ.w*tw*sin(lap*3.1416)*min(1.0,iP.w/w*1.4+0.15)*(1.0-ck)*smoothstep(1.2,4.0,dist));
  vUv=position.xy;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}`;
const MOTE_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vL;
void main(){ float r=length(vUv)*2.0; float a=1.0-smoothstep(0.2,1.0,r); gl_FragColor=vec4(vL*a,1.0); }`;

export default {
  id: 'cloud-in-the-cave',
  name: 'Cloud in the Cave',
  category: 'wilderness',
  weirdness: 0.2,
  media: ['air'],
  async build(ctx) {
    const { rng, renderer } = ctx;
    const vary = ctx.vary || {}, det = ctx.quality?.detail ?? 1;
    const nz = ctx.core.makeNoise('cloud-in-the-cave:rock');           // the cave itself is the same on every visit: a known place
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020405');
    scene.fog = new THREE.FogExp2(new THREE.Color('#1c3136'), 0.0011);   // for the kit's creatures only (they live in the dome)

    // ---------------- what the seed deals (a fork for each kind of thing)
    const lookR = rng.fork('look');
    const cloudKind = lookR.pick(['sea', 'sea', 'veil', 'rags']);
    const afterRain = lookR.chance(0.33);
    const campUp = lookR.chance(0.5), tentBlue = lookR.chance(0.4), lampDeal = lookR.int(7, 9), lampCount = lampDeal === 7 ? 14 : 15;   // (fourteen head lamps; on some visits a fourth at the camp, or a third on the mound)
    const forestKind = lookR.pick(['green', 'green', 'red', 'flower']);
    const fluff = lookR.chance(0.4);
    const shower = !!vary.rare;
    scene.name = `cave ${cloudKind} ${afterRain ? 'rain' : 'clear'} ${campUp ? 'up' : 'down'} ${tentBlue ? 'blue' : 'orange'} ${lampCount} ${forestKind} ${fluff ? 'fluff' : 'motes'}${shower ? ' shower' : ''}`;

    // ---------------- the sun and the shared uniforms
    const sunH = [Math.sin(SUN_AZ), -Math.cos(SUN_AZ)];
    const sunDir = new V3(Math.cos(SUN_EL) * sunH[0], Math.sin(SUN_EL), Math.cos(SUN_EL) * sunH[1]).normalize();
    const skyXZ = W2(SKY.a, SKY.l), domeXZ = W2(DOME.a, DOME.l);
    const lampP = [], lampD = [], lampC = [], lampW = [], poolG = [];
    for (let i = 0; i < NL; i++) { lampP.push(new THREE.Vector4(0, -500, 0, 0)); lampD.push(new THREE.Vector4(0, -1, 0, -2)); lampC.push(new THREE.Color(0, 0, 0)); lampW.push(new THREE.Vector2(0, 1)); }
    for (let i = 0; i < NPG; i++) poolG.push(new THREE.Vector4(0, 0, 1, -900));
    // THE LIGHT'S FIGURES. The world is shown at an exposure of 2.0; the sun stands at 2.2. In the cave the general light
    // is deep blue and low: the day up the passage (uDayCol) is a blue glow that falls to a quarter by the lake, the air's
    // own glow (uAirCol) and the wet rock's cool bounce (uCool) are blue; what is lit keeps its light: the lamps' pools
    // and wide warm wash (uLampW) and the pools that glow from within (uPoolG). Under the opening the day is green-gold
    // (uDayDome) and it is held low, so that shade is shade and the sun's patch is sun.
    const CU = {
      uTime: { value: 0 }, uSunDir: { value: sunDir }, uSkyC: { value: new THREE.Vector4(skyXZ[0], SKY.y, skyXZ[1], SKY.r) },
      uDomeM: { value: new THREE.Vector4(domeXZ[0], domeXZ[1], 125, 45) },
      uDayCol: { value: new THREE.Color(0.22, 0.40, 0.58) }, uSunCol: { value: new THREE.Color(1.0, 0.90, 0.66).multiplyScalar(2.2) },
      uDayDome: { value: new THREE.Color(0.8, 0.82, 0.58) }, uCool: { value: new THREE.Color(0.088, 0.16, 0.34) },
      uLampW: { value: lampW }, uPoolG: { value: poolG },
      uAirCol: { value: new THREE.Color(0.13, 0.26, 0.47) }, uAirDome: { value: new THREE.Color(0.050, 0.085, 0.095) }, uBounce: { value: new THREE.Color(0.11, 0.15, 0.065) },
      uAirK: { value: new THREE.Vector4(0.0027, 0.0008, 1.0, 0) },
      // the ground mist of the dome's hollow by the seed: thin banks, thinner and lower ones, or torn ones (sharper, wider gaps)
      uSea: { value: new THREE.Vector4({ sea: SEA.top, veil: SEA.top - 2, rags: SEA.top - 0.4 }[cloudKind], SEA.drop, { sea: 0.035, veil: 0.022, rags: 0.04 }[cloudKind], { sea: 1.0, veil: 1.2, rags: 0.62 }[cloudKind]) },
      uSeaA: { value: new THREE.Vector4(SEA.a0, SEA.a1, SEA.a2, SEA.a3) },
      uSeaB: { value: new THREE.Vector4(BEND_END.x, BEND_END.z, Math.sin(TH1), -Math.cos(TH1)) },
      uSeaCol: { value: new THREE.Color(0.40, 0.55, 0.66) },
      uDrift: { value: new THREE.Vector2(0.218, -0.976) },
      uWash: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uWashC: { value: [0, 1, 2, 3].map(() => new THREE.Color(0, 0, 0)) },
      // (the pillar's lit pool: where its axis comes down to 46 m, the height of the forest's roof at the mound's foot)
      uGlowP: { value: new THREE.Vector4(skyXZ[0] - sunDir.x * (SKY.y - 46) / sunDir.y, 46, skyXZ[1] - sunDir.z * (SKY.y - 46) / sunDir.y, 0.12) },
      uLampP: { value: lampP }, uLampD: { value: lampD }, uLampC: { value: lampC }, uRain: { value: afterRain || shower ? 1 : 0 },
      uUp: { value: new THREE.Vector4(0, -900, 0, 0) }, uCFall: { value: new THREE.Vector4(0, -900, 0, 0) },
    };
    const caveU = (extra = {}) => Object.assign({ uTime: CU.uTime, uSunDir: CU.uSunDir, uSkyC: CU.uSkyC, uDomeM: CU.uDomeM, uDayCol: CU.uDayCol, uSunCol: CU.uSunCol, uAirCol: CU.uAirCol,
      uDayDome: CU.uDayDome, uCool: CU.uCool, uLampW: CU.uLampW, uPoolG: CU.uPoolG,
      uAirDome: CU.uAirDome, uBounce: CU.uBounce, uAirK: CU.uAirK, uSea: CU.uSea, uSeaA: CU.uSeaA, uSeaB: CU.uSeaB, uSeaCol: CU.uSeaCol, uDrift: CU.uDrift, uWash: CU.uWash, uWashC: CU.uWashC, uGlowP: CU.uGlowP,
      uLampP: CU.uLampP, uLampD: CU.uLampD, uLampC: CU.uLampC, uUp: CU.uUp, uCFall: CU.uCFall }, extra);
    const pearlXZ = W2(PEARL.a, PEARL.l);
    const rockMat = (tone, floor, shade = 1) => new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, side: THREE.DoubleSide, defines: floor ? { FLOOR: 1 } : {},
      uniforms: caveU({ uTone: { value: new V3(tone[0], tone[1], tone[2]) }, uRain: CU.uRain, uShade: { value: shade }, uPearl: { value: new THREE.Vector4(pearlXZ[0], pearlXZ[1], PEARL.r, 0) } }) });
    const matWall = rockMat([1.0, 1.0, 0.0], false, 0.72), matFloor = rockMat([0.6, 0.8, 0.0], true), matCalc = rockMat([0.3, 0.7, 1.0]), matBlock = rockMat([0.9, 1.0, 0.0]);
    // (the stalactites and the small stalagmites: old grey dripstone, half as pale as the towers' wet flowstone, so that under
    // the dark roof they are no brighter than the roof except where a lamp or the day finds them)
    const matHang = rockMat([0.5, 0.9, 0.42], false, 0.62);

    // ---------------- the flown line
    const path = makePath(LINE.map((q) => { const w = W2(q[0], q[1]); return [w[0], q[2], w[1]]; }));
    const Lp = path.length, NS = Math.ceil(Lp), lx = new Float32Array(NS + 1), ly = new Float32Array(NS + 1), lz = new Float32Array(NS + 1);
    { const p = new V3(); for (let i = 0; i <= NS; i++) { path.posAtDist(Math.min(i, Lp), p); lx[i] = p.x; ly[i] = p.y; lz[i] = p.z; } }
    // nearest place of the flown line to a point: { d: metres in space, dh: metres in plan, s: metres flown there, y: the line's height there }
    const nearOut = { d: 0, dh: 0, s: 0, y: 0 };
    // (the line is searched every 32 m, then every 4 m about the nearest of those places, then metre by metre about the
    // nearest of these: it bends gently and never comes near itself)
    function nearLine(x, y, z, out = nearOut) {
      let best = Infinity, bi = 0;
      for (let i = 0; i <= NS; i += 32) { const dx = lx[i] - x, dy = ly[i] - y, dz = lz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 32), i1 = Math.min(NS, bi + 32); i <= i1; i += 4) { const dx = lx[i] - x, dy = ly[i] - y, dz = lz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 4), i1 = Math.min(NS, bi + 4); i <= i1; i++) { const dx = lx[i] - x, dy = ly[i] - y, dz = lz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      out.d = Math.sqrt(best); out.dh = Math.hypot(lx[bi] - x, lz[bi] - z); out.s = bi; out.y = ly[bi]; return out;
    }
    // nearest place of the line in plan (for the ground under it)
    function nearLineXZ(x, z, out = nearOut) {
      let best = Infinity, bi = 0;
      for (let i = 0; i <= NS; i += 32) { const dx = lx[i] - x, dz = lz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 32), i1 = Math.min(NS, bi + 32); i <= i1; i += 4) { const dx = lx[i] - x, dz = lz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 4), i1 = Math.min(NS, bi + 4); i <= i1; i++) { const dx = lx[i] - x, dz = lz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      out.dh = Math.sqrt(best); out.d = out.dh; out.s = bi; out.y = ly[bi]; return out;
    }
    // a place given by metres flown (s) and metres to the right of the line there
    const pS = new V3(), tS = new V3();
    function atS(s, lateral, out = [0, 0, 0]) {
      path.posAtDist(s, pS); path.tangentAtDist(s, tS); const h = Math.hypot(tS.x, tS.z) || 1;
      out[0] = pS.x - tS.z / h * lateral; out[1] = pS.y; out[2] = pS.z + tS.x / h * lateral; return out;
    }
    // THE GROUND: the natural ground with the line's corridor cut into it (never nearer than 6.4 m under the line, rising
    // gently to either side), the basin of the fall's pool with its lip, and the bed and banks of the bank's staircase.
    let JPOOL = null, STAIR = null;                                     // the pool: its middle, radius and level, and the fall's foot; the bank's staircase (below)
    const axT = { a: 0, l: 0 };
    // the pool's shore is no circle: its radius swells and draws in round the pool by a seventh
    const poolR = (x, z) => JPOOL.r * (1 + 0.09 * Math.sin(3 * Math.atan2(z - JPOOL.z, x - JPOOL.x) + 0.8) + 0.05 * Math.sin(7 * Math.atan2(z - JPOOL.z, x - JPOOL.x) + 2.1));
    // THE BANK'S STAIRCASE in the line's own coordinates: s metres flown at the nearest place of the line, w metres to the
    // right of it. Its middle wanders about the line (stairC), its half width swells and narrows (stairW), every dam
    // bows downhill in its middle and wanders (stairBow: how far uphill of its middle a dam stands at a place across it).
    // se: metres along the staircase with the bow taken out: the dams stand at STAIR.dams (se), the pools' levels are
    // STAIR.lev. SP: a place seen from the staircase (se; dE: metres outside its edge, negative inside).
    const stairC = (s) => 3.2 * Math.sin(s * 0.045 + 0.5) * smoothstep(STAIR.dams[0], STAIR.dams[0] + 25, s) * (1 - smoothstep(STAIR.sTop - 30, STAIR.sTop - 5, s));
    const stairW = (s, side) => { const w = 11 + 2.6 * Math.sin(s * 0.062 + 0.8) + 1.4 * Math.sin(s * 0.17 + 2.0); return side < 0 ? lerp(w, STAIR.left, smoothstep(STAIR.sTop - 3, STAIR.sTop + 5, s)) : w; };
    const stairBow = (s, wl, W) => 3.2 * (wl / W) * (wl / W) * Math.min(1, W / 14) + 1.1 * Math.sin(wl * 0.5 + s * 0.13) + 0.6 * Math.sin(wl * 1.3 - s * 0.31) + 1.5 * Math.abs(Math.sin(wl * 0.42 + s * 0.11));   // (and is scalloped: lobes some 7 m broad that swell downhill)
    const stairK = (se) => {                                            // the terrace number at se, and how far up that terrace (its fraction)
      const d = STAIR.dams, N = STAIR.N;
      if (se <= d[0]) return (se - d[0]) / 5;
      if (se >= d[N]) return N + Math.min(0.999, (se - d[N]) / STAIR.topLen);
      let k = 0; while (k < N - 1 && se >= d[k + 1]) k++;
      return k + (se - d[k]) / (d[k + 1] - d[k]);
    };
    const stairLev = (se) => { const F = stairK(se); return F < 0 ? JPOOL.y : STAIR.lev[Math.min(STAIR.N, Math.floor(F))]; };
    const SP = { se: 0, dE: 0, wl: 0, W: 1, on: false };
    function stairPlace(x, z, q) {                                      // q: the line's nearest place in plan (nearLineXZ)
      SP.on = false;
      if (q.dh > 64 || q.s < STAIR.dams[0] - 14) return SP;
      const i = clamp(q.s, 1, NS - 1), tx = lx[i + 1] - lx[i - 1], tz = lz[i + 1] - lz[i - 1], h = Math.hypot(tx, tz) || 1, dx = x - lx[i], dz = z - lz[i];
      const s = i + (dx * tx + dz * tz) / h, wl = (dz * tx - dx * tz) / h - stairC(s), W = stairW(s, wl);
      SP.wl = wl; SP.W = W; SP.dE = Math.abs(wl) - W; SP.se = s - stairBow(s, clamp(wl, -W, W), W);
      SP.on = SP.se > STAIR.dams[0] - 1.5 && SP.se < STAIR.sEnd;
      return SP;
    }
    function groundAt(x, z) {
      toAxis(x, z, axT);
      let g = groundNatural(x, z, nz, axT);
      const q = nearLineXZ(x, z), qy = q.y, qdh = q.dh;
      // (up the bank the corridor is 9 m deep under the line, so that the ground is seen from above and not along itself; 6.4 m at the shelf)
      if (qdh < 34) g = Math.min(g, qy - 6.4 - 2.6 * smoothstep(480, 560, q.s) * (1 - smoothstep(Lp - 90, Lp - 40, q.s)) + 0.5 * Math.max(0, qdh - 5));
      if (STAIR) {
        stairPlace(x, z, q);
        if (SP.on && SP.dE < 22) {
          if (SP.dE < -0.4) {
            // (under the staircase the ground lies a metre under the pool that is one dam further down; at the top pool's
            // far shore it comes up through the water to the shelf)
            g = lerp(stairLev(SP.se - 6.5) - 1.0, Math.max(g, STAIR.lev[STAIR.N] + 0.5), smoothstep(STAIR.sEnd - 6, STAIR.sEnd, SP.se));
          } else {
            // (beside it the bank comes down to the pool's own rim: a hand over the water at its edge, a metre over it 3 m out)
            // (and goes over into the natural ground within 9.5 m, or within up to 21 m where that stands high over the pool)
            const bank = stairLev(SP.se) + 0.1 + 0.9 * smoothstep(0, 3, SP.dE);
            g = Math.min(lerp(bank, g, smoothstep(0.5, 9.5 + 0.95 * clamp(g - bank, 0, 12), SP.dE)), qy - 6.4 + 0.6 * Math.max(0, qdh - 4));
          }
        }
      }
      if (JPOOL) {
        const d = Math.hypot(x - JPOOL.x, z - JPOOL.z), R = poolR(x, z);
        if (d < R + 7) {
          // (round the water a lip of rimstone stands half a metre and more over it: a dam where the ground is lower, a
          // cut bank where it is higher; the pool is 2.6 m deep in its middle)
          const rim = JPOOL.y + 0.55 + 0.5 * nz.n2(x * 0.3, z * 0.3), out = g < rim ? lerp(rim, g, smoothstep(R + 2.5, R + 7, d)) : lerp(rim, g, smoothstep(R + 0.5, R + 6, d));
          g = lerp(out, JPOOL.y - 2.6, 1 - smoothstep(R - 5, R + 0.3, d));
        }
      }
      return g;
    }
    const inPool = (x, z, pad) => {                                     // (nothing grows in the pool or in the staircase's water)
      if (JPOOL === null) return false;
      if (Math.hypot(x - JPOOL.x, z - JPOOL.z) < JPOOL.r * 1.14 + pad) return true;
      if (STAIR && (x - STAIR.cx) * (x - STAIR.cx) + (z - STAIR.cz) * (z - STAIR.cz) < STAIR.rad * STAIR.rad) { stairPlace(x, z, nearLineXZ(x, z)); if (SP.on && SP.dE < pad - 0.2) return true; }
      return false;
    };
    await ctx.yield();

    // ---------------- THE SHELL: the passage's walls and roof and the dome, one sweep of arches along the axis
    const SEG = 84, ringsA = [];
    for (let a = -110; a < 470; a += 4.5) ringsA.push(a);
    for (let i = 0; i <= 74; i++) ringsA.push(470 + 300 * Math.sin(i / 74 * Math.PI * 0.5));   // (closer together toward the dome's far wall)
    const ringsN = ringsA.length;
    const shoulderK = (a) => smoothstep(186, 214, a) * (1 - smoothstep(288, 316, a));
    const archE = (a) => lerp(0.8, 0.3, smoothstep(455, 520, a));         // the passage is an arch; the fallen dome has sheer walls and a flat roof
    const archPh = (i) => { const t = i / SEG; return Math.PI * (t - 0.3 * Math.sin(TAU * t) / TAU); };   // the arch's angle at each vertex: closer together down the walls than across the roof
    const alcXZ = W2(ALCOVE.a, ALCOVE.l);
    // a point of the shell: a metres along the axis, ph the angle round the arch (0 at the right wall's foot, pi at the left's)
    function shellPoint(a, ph, o) {
      const wl = wallsAt(a), c = (wl.left + wl.right) * 0.5, w = Math.max((wl.right - wl.left) * 0.5, 0.01);
      const cs = Math.cos(ph), sn = Math.max(Math.sin(ph), 0);
      let l = c + w * Math.sign(cs) * Math.pow(Math.abs(cs), 0.55), y = -5 + (wl.roof + 5) * Math.pow(sn, archE(a));
      const f = axisAt(a);
      // the low shoulder of the roof on the left between a 200 and a 300 (the curtains hang from it)
      const sh = shoulderK(a) * smoothstep(0.5 * Math.PI, 0.6 * Math.PI, ph);
      let x = f.x - f.hz * l, z = f.z + f.hx * l;
      if (sh > 0) y = lerp(y, Math.min(y, SHOULDER_Y + 4 * nz.n2(x * 0.05, z * 0.05) + 26 * (1 - shoulderK(a))), sh);
      // THE ROOF COMES DOWN over the first staircase (a 112 to a 176, sinking from a 82 and lifting again to a 204): from
      // wall to wall a low ceiling some 32 m over the line, climbing with it (the hanging field grows out of it)
      const hk = smoothstep(HANG.a0, HANG.a1, a) * (1 - smoothstep(HANG.a2, HANG.a3, a));
      if (hk > 0) { const hy = 47 + 0.14 * (a - 100) + 5 * nz.n2(x * 0.045 + 3, z * 0.045); if (y > hy) y = lerp(y, hy, hk); }
      // (and over the column of the last staircase the roof comes down as a great boss to meet it, 100 m up)
      { const cd = Math.hypot(x - COLXZ[0], z - COLXZ[1]); if (cd < 30) y = Math.min(y, COL_TOP + 2.2 * Math.pow(cd, 1.25)); }
      // the wall's own form, pushed along the arch's normal (outward is away from the middle of the arch): great swells, beds
      // standing out as ledges, upright buttresses and bays every 30 to 60 m, alcoves under overhangs, and smaller lumps
      const nl = Math.sign(cs) * Math.pow(Math.abs(cs), 0.7), ny = sn;
      const big = nz.fbm2(x * 0.012 + y * 0.004, z * 0.012 - y * 0.006, 3), bed = 0.5 + 0.5 * Math.sin((y + 9 * big) * 0.21);
      const med = nz.n3(x * 0.03, y * 0.04, z * 0.03), fin = nz.n3(x * 0.09, y * 0.11, z * 0.09);
      const rib = Math.tanh(2.6 * nz.n2(x * 0.034 + 40, z * 0.034 - 17)), alc = smoothstep(0.2, 0.62, nz.n3(x * 0.021 + 9, y * 0.028, z * 0.021 - 4));
      let d = 7 * big + 3.2 * smoothstep(0.2, 0.8, bed) + 3.4 * med + 0.9 * fin + 6.5 * rib * (1 - 0.6 * sh) + 11 * alc * (1 - sh);
      d *= 0.35 + 0.65 * smoothstep(0, 22, y);                          // quieter at the foot of the walls
      d *= smoothstep(2, 40, w);                                        // (and where the two walls close at the dome's far end, so that they never cross)
      // (a low apron of flowstone lies where the terraces meet the right wall, a 92 to a 146: o.a[3] below)
      const casc = 0;                                                  // (no flowstone face here: the wall is bare rock, set back into an alcove; see wallsAt)
      // THE GREAT FLOWSTONE FALL down the bend's left wall (a 348 to a 396, from 105 m down to the river): pale wet stone in
      // long lobes that stand 3 to 5 m out of the wall, wider toward its foot
      const fall = cs < 0 ? smoothstep(0.12, 0.5, -cs) * (1 - smoothstep(16 + 0.09 * (110 - y), 23 + 0.09 * (110 - y), Math.abs(a - 372) - 3 * Math.sin(y * 0.21))) * (1 - smoothstep(92, 110, y + 8 * nz.n2(a * 0.09, 5.5))) : 0;
      d -= fall * (3 + 2 * nz.n2(a * 0.2, y * 0.045 + 3) + 1.2 * Math.sin(y * 0.55 + 2 * nz.n2(a * 0.3, 1.5)));
      // the side alcove behind the ring: a black mouth in the dome's north-west wall, from the shelf up to 30 m over it
      const ak = Math.exp(-((x - alcXZ[0]) ** 2 + (z - alcXZ[1]) ** 2) / (ALCOVE.r * ALCOVE.r)) * (1 - smoothstep(ALCOVE.y1 - 14, ALCOVE.y1, y));
      d += ALCOVE.depth * smoothstep(0.12, 0.6, ak);
      // the opening the cave's fall comes out of: a dark mouth some 12 m across in the buttress's face, over the fall's lip
      const ck = cs > 0 ? Math.exp(-(Math.pow(a - CFALL.a, 2) + Math.pow(y - (CFALL.y + CFALL.drop + 3), 2)) / 55) : 0;
      d += 9 * smoothstep(0.15, 0.6, ck);
      l += nl * d; y += ny * d * 0.6;
      x = f.x - f.hz * l; z = f.z + f.hx * l;
      const q = nearLine(x, y, z);
      if (q.d < 15) { const k = (15 - q.d) * 1.4; l += nl * k; y += ny * k; x = f.x - f.hz * l; z = f.z + f.hx * l; }     // the walls keep 15 m from the line by rule
      o.p[0] = x; o.p[1] = y; o.p[2] = z;
      o.a[0] = (0.5 + 0.5 * smoothstep(-0.4, 0.5, med + 0.5 * (bed - 0.5))) * (1 - 0.3 * alc) * (0.82 + 0.18 * rib) * (1 - 0.95 * smoothstep(0.3, 0.7, ak));   // (dark in the alcoves and the bays, black in the mouth behind the ring)
      const inDome = smoothstep(450, 520, a);
      o.a[1] = clamp(0.5 * smoothstep(404, 470, a) * (1 - smoothstep(40, 110, y)) + inDome * (0.45 + 0.4 * smoothstep(150, 60, y)) * smoothstep(-0.2, 0.5, med), 0, 1) * (1 - smoothstep(0.1, 0.4, ak)) * (1 - 0.85 * fall);
      o.a[2] = 0.75 + 0.25 * smoothstep(0.5, -0.3, fin);
      o.a[3] = Math.max(casc, fall, 0.8 * smoothstep(0.1, 0.5, cs) * smoothstep(92, 104, a) * (1 - smoothstep(128, 146, a)) * (1 - smoothstep(14, 30, y)) * smoothstep(-0.3, 0.4, med));
      // (about the fall the wall is wet dark rock, bare of moss: 16 m to either side of it, to 14 m over its lip)
      const wetF = cs < 0 ? Math.exp(-Math.pow((a - FALL_A) / 15, 2)) * (1 - smoothstep(64, 82, y)) : 0;
      o.a[1] *= 1 - 0.9 * wetF; o.a[2] += 0.6 * wetF;
      // THE HANGING GARDEN: the wall behind and beside the ring (some 45 m either way along it, to 125 m up) is green on
      // every ledge and streaked dark where water seeps down it
      const gard = cs < 0 ? Math.exp(-Math.pow((a - RING.a - 6) / 44, 2)) * (1 - smoothstep(105, 135, y)) : 0;
      o.a[1] = Math.max(o.a[1], gard * (0.55 + 0.45 * smoothstep(-0.3, 0.3, med)) * (1 - smoothstep(0.1, 0.4, ak)));
      const seep = gard * smoothstep(0.52, 0.72, nz.n2(a * 0.42 + 3, y * 0.012 + 7));
      o.a[2] += 0.5 * seep;
      // (the cave's fall: its opening is dark, and the buttress under it is wet dark rock, 9 m to either side)
      const wetC = cs > 0 ? Math.exp(-Math.pow((a - CFALL.a) / 9, 2)) * (1 - smoothstep(CFALL.y + CFALL.drop + 2, CFALL.y + CFALL.drop + 12, y)) : 0;
      o.a[0] *= 1 - 0.9 * smoothstep(0.2, 0.6, ck); o.a[2] += 0.6 * wetC;
      const tn = (0.86 + 0.28 * nz.n2(a * 0.01, y * 0.02)) * (1 - 0.5 * wetF) * (1 - 0.45 * seep) * (1 - 0.35 * wetC);
      o.c[0] = tn; o.c[1] = tn; o.c[2] = tn * 1.02;
    }
    {
      const sx = W2(SKY.a, SKY.l);
      const holeR = (x, z) => { const ang = Math.atan2(z - sx[1], x - sx[0]); return SKY.r * (1 + 0.07 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 4)); };
      // (one sheet, filled four rings at a time so that no step is long)
      const g = await gridGeometrySteps(SEG + 1, ringsN, (i, j, o) => shellPoint(ringsA[j], archPh(i), o), (pos, a, b, c, d) => {
        const cx = (pos[a * 3] + pos[b * 3] + pos[c * 3] + pos[d * 3]) * 0.25, cy = (pos[a * 3 + 1] + pos[d * 3 + 1]) * 0.5, cz = (pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2] + pos[d * 3 + 2]) * 0.25;
        return !(cy > 140 && Math.hypot(cx - sx[0], cz - sx[1]) < holeR(cx, cz) + 1.5);       // the roof opening (the one opening of the roof)
      }, 4, ctx.yield);
      { const m = new THREE.Mesh(g, matWall); m.name = 'shell'; scene.add(m); }
      // the skylight's collar: the thickness of the mountain round the hole, a funnel that opens upward
      const collar = gridGeometry(97, 9, (i, j, o) => {                 // (the first two rows are a skirt that flares out under the roof, so that no gap shows round the hole)
        const ang = TAU * i / 96, t = Math.max(0, j - 2) / 6, r0 = SKY.r * (1 + 0.07 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 4));
        const y = 160 + 46 * t + (j === 0 ? 34 : j === 1 ? 13 : 0), r = r0 + 3.5 - 6 * Math.sin(Math.min(t * 2.2, 1) * Math.PI) * 0.6 + 16 * t * t + 2.5 * nz.n2(Math.cos(ang) * 3 + 9, Math.sin(ang) * 3 + t * 2) + (j === 0 ? 22 : j === 1 ? 8 : 0);
        o.p[0] = sx[0] + Math.cos(ang) * r; o.p[1] = y; o.p[2] = sx[1] + Math.sin(ang) * r;
        o.a[0] = 0.9; o.a[1] = 0.55 + 0.4 * t; o.a[2] = 0.8;
      });
      const cm = new THREE.Mesh(collar, matWall); cm.name = 'collar'; scene.add(cm);
      const sky = new THREE.Mesh(new THREE.CircleGeometry(270, 24).rotateX(Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: { uTime: CU.uTime, uSunDir: CU.uSunDir }, side: THREE.DoubleSide }));
      sky.position.set(sx[0], 232, sx[1]); sky.name = 'sky'; scene.add(sky);
    }
    await ctx.yield();
    // THE FALL AND ITS POOL. A broad fall springs from the rounded rock of the dome's left wall at a 570, 44 m over its
    // pool, and drops clear of the rock (6 m in front of the wall's foremost place) into a pool 38 m across, of uneven
    // shore, that lies in the hollow at the wall's foot; the line crosses the pool. Here: the fall's places down its
    // drop (every 1.5 m of height), the pool's place and level (the lowest ground on its round, so that it is dug into
    // the slope and held by a lip of rimstone), and the bank's staircase of pools that goes on up from its far shore.
    const FALL = { a: FALL_A, rows: [], height: 44 };
    {
      const o = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] }, wl = wallsAt(FALL.a), f = axisAt(FALL.a), inx = -f.hz, inz = f.hx;      // (in: away from the wall)
      const wallAt = (y) => shellPoint(FALL.a, Math.PI - Math.asin(Math.min(1, Math.pow((y + 5) / (wl.roof + 5), 1 / archE(FALL.a)))), o);
      wallAt(30); const bx = o.p[0], bz = o.p[2]; let fore = -1e9;
      for (let y = 12; y <= 70; y += 2) { wallAt(y); fore = Math.max(fore, (o.p[0] - bx) * inx + (o.p[2] - bz) * inz); }
      const fx = bx + inx * (fore + 6), fz = bz + inz * (fore + 6), px = fx + inx * 13.5, pz = fz + inz * 13.5, PR = 19;
      let py = 1e9; for (let i = 0; i < 16; i++) py = Math.min(py, groundAt(px + Math.cos(i * TAU / 16) * PR, pz + Math.sin(i * TAU / 16) * PR));
      py += 0.6;
      for (let y = py + FALL.height; y > py - 0.6; y -= 1.5) FALL.rows.push([fx - inx * 0.03 * (y - py), y, fz - inz * 0.03 * (y - py)]);
      FALL.in = [inx, inz]; FALL.wall = [bx + inx * fore, bz + inz * fore];
      // (the falling sheet is turned 28 degrees from the wall's own facing toward the mouth: who comes in sees it broad)
      FALL.face = [inx * Math.cos(28 * RAD) - f.hx * Math.sin(28 * RAD), inz * Math.cos(28 * RAD) - f.hz * Math.sin(28 * RAD)];
      JPOOL = { x: px, z: pz, r: PR, y: py, fx, fz };
      await ctx.yield();
      // THE BANK'S STAIRCASE: from the pool's far shore the gully under the line is a staircase of rimstone pools up to
      // the ring's shelf. The first dam stands in the pool's own shore (where the line leaves the pool); the dams follow
      // 4.2 to 6.8 m apart; the last, 25 m short of the ring, holds the top pool, which lies 16 m long before the ring
      // and reaches left to the wall, where the slender fall comes down into it. BY RULE every pool's level is the
      // line's height over its dam less 7.4 m: the line, which only climbs, flies 7.4 to 10.5 m over the water all the way.
      const yLine = (s) => { const i = clamp(Math.floor(s), 0, NS - 1); return ly[i] + (ly[i + 1] - ly[i]) * clamp(s - i, 0, 1); };
      let sx = 0; for (let i = 0; i <= NS; i++) if (Math.hypot(lx[i] - px, lz[i] - pz) < PR) sx = i;      // (the last metre of the line over the pool)
      const sTop = Lp - 25, dams = [sx - 2.5], lev = [];
      for (let k = 0; dams[k] + 9 < sTop; k++) dams.push(dams[k] + 4.2 + 2.6 * Math.abs(Math.sin(k * 1.9 + 0.6)));
      dams.push(sTop);
      for (let k = 0; k < dams.length; k++) lev.push(Math.max(yLine(dams[k]) - 7.4, (k ? lev[k - 1] : py) + 0.5));
      STAIR = { dams, lev, N: dams.length - 1, sTop, topLen: 16, sEnd: sTop + 16, left: 11, fall: null };
      // THE SLENDER FALL comes down the wall on the left of the ring into the top pool's far left end: 31 m, 3 to 5 m
      // broad, standing 2.2 m out from the wall's foremost place, turned 40 degrees toward who comes up the staircase
      {
        const q = atS(sTop + 6, -22), ax2 = toAxis(q[0], q[2], { a: 0, l: 0 }), a2 = ax2.a, wl2 = wallsAt(a2), f2 = axisAt(a2), ix = -f2.hz, iz = f2.hx;
        const wall2 = (y) => shellPoint(a2, Math.PI - Math.asin(Math.min(1, Math.pow((y + 5) / (wl2.roof + 5), 1 / archE(a2)))), o);
        const yF = lev[lev.length - 1];
        wall2(yF + 8); const bx2 = o.p[0], bz2 = o.p[2]; let fore2 = -1e9;
        for (let y = yF - 2; y <= yF + 34; y += 2) { wall2(y); fore2 = Math.max(fore2, (o.p[0] - bx2) * ix + (o.p[2] - bz2) * iz); }
        const fx2 = bx2 + ix * (fore2 + 2.2), fz2 = bz2 + iz * (fore2 + 2.2), rows = [];
        for (let y = yF + 31; y > yF - 0.6; y -= 1.5) rows.push([fx2 - ix * 0.02 * (y - yF), y, fz2 - iz * 0.02 * (y - yF)]);
        STAIR.fall = { x: fx2, z: fz2, y: yF, top: yF + 31, rows, in: [ix, iz], face: [ix * Math.cos(40 * RAD) - f2.hx * Math.sin(40 * RAD), iz * Math.cos(40 * RAD) - f2.hz * Math.sin(40 * RAD)] };
        // (the top pool's left shore lies 4 m beyond the fall's foot)
        const qn = nearLineXZ(fx2, fz2); STAIR.left = Math.max(12, qn.dh + 4);
        // (a round that holds the whole staircase and its banks: a place outside it is not looked at further)
        const mid = atS((dams[0] + STAIR.sEnd) * 0.5, 0); STAIR.cx = mid[0]; STAIR.cz = mid[2]; STAIR.rad = (STAIR.sEnd - dams[0]) * 0.5 + STAIR.left + 26;
      }
    }
    // THE FALL IN THE CAVE: out of the dark opening in the buttress's face at a 300, 38 m over the lake, a slender white
    // fall comes down into the lake's right shore, clear of the rock (2.5 m in front of the wall's foremost place under
    // the opening). Here: its places down its drop, and its foot.
    const CF = { rows: [], x: 0, z: 0, y: 0, in: [0, 0], face: [0, 0], d: 0 };
    {
      const o = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] }, wl = wallsAt(CFALL.a), f = axisAt(CFALL.a), inx = f.hz, inz = -f.hx;      // (in: away from the right wall)
      const wallAt = (y) => shellPoint(CFALL.a, Math.asin(Math.min(1, Math.pow((y + 5) / (wl.roof + 5), 1 / archE(CFALL.a)))), o);
      wallAt(CFALL.y + 10); const bx = o.p[0], bz = o.p[2]; let fore = -1e9;
      for (let y = CFALL.y - 2; y <= CFALL.y + CFALL.drop - 4; y += 2) { wallAt(y); fore = Math.max(fore, (o.p[0] - bx) * inx + (o.p[2] - bz) * inz); }
      const fx = bx + inx * (fore + 2.5), fz = bz + inz * (fore + 2.5), yF = groundAt(fx, fz) + 0.05, top = CFALL.y + CFALL.drop;
      for (const [back, up] of [[7, 0.7], [4.5, 0.6], [2.2, 0.35]]) CF.rows.push([fx - inx * (0.035 * (top - yF) + back), top + up, fz - inz * (0.035 * (top - yF) + back)]);   // (the spout: the water comes out of the opening)
      for (let y = top; y > yF - 0.8; y -= 1.5) CF.rows.push([fx - inx * 0.035 * (y - yF), y, fz - inz * 0.035 * (y - yF)]);
      CF.x = fx; CF.z = fz; CF.y = yF; CF.in = [inx, inz];
      // (the falling sheet is turned 35 degrees from the wall's own facing toward who comes up the passage)
      CF.face = [inx * Math.cos(35 * RAD) - f.hx * Math.sin(35 * RAD), inz * Math.cos(35 * RAD) - f.hz * Math.sin(35 * RAD)];
      CF.d = 1e9; for (const q of CF.rows) CF.d = Math.min(CF.d, nearLine(q[0], q[1], q[2]).d);
      CU.uCFall.value.set(fx, yF, fz, 1);
      scene.userData.caveFall = { drop: +(top - yF).toFixed(1), least: +CF.d.toFixed(1) };
    }

    // ---------------- THE FLOOR: river bed, bars, the staircase, the threshold, the hollow, the mound, the bank and the shelf: one sheet in axis coordinates
    const lineLat = new Float32Array(900);                              // the line's own l at each metre of a (the sheet is finest under it)
    { const t = { a: 0, l: 0 }; let last = 0; for (let i = 0; i <= NS; i++) { toAxis(lx[i], lz[i], t); const k = clamp(Math.round(t.a + 110), 0, 899); lineLat[k] = t.l; last = k; } for (let k = 0; k < 110; k++) lineLat[k] = 0; for (let k = last; k < 900; k++) lineLat[k] = lineLat[last]; }
    // (rows 3 m apart in the passage (6 m behind the entry, where nobody looks) and 3.1 m apart in the dome. The
    // terraces' dams and pools are drawn on this sheet by its shader.)
    const rowsA = []; for (let a = -110; a < -20; a += 6) rowsA.push(a); for (let a = -20; a < 452; a += 3) rowsA.push(a); for (let a = 452; a <= 773; a += 3.1) rowsA.push(a);
    const NC = 58, wtmp = [0, 0];
    {
      const g = await gridGeometrySteps(NC, rowsA.length, (i, j, o) => {
        const a = rowsA[j], wl = wallsAt(a), lc = lineLat[clamp(Math.round(a + 110), 0, 899)], t = (i / (NC - 1)) * 2 - 1;
        const span = t < 0 ? lc - (wl.left - 12) : (wl.right + 12) - lc, l = lc + Math.sign(t) * Math.pow(Math.abs(t), 1.7) * Math.max(span, 1);
        W2(a, l, wtmp);
        const G = gourField(a, l);
        o.p[0] = wtmp[0]; o.p[1] = groundAt(wtmp[0], wtmp[1]); o.p[2] = wtmp[1];
        const dR = Math.abs(l - riverL(a)) - riverHalf(a), n2 = nz.n2(wtmp[0] * 0.07, wtmp[1] * 0.07), dome = smoothstep(450, 482, a);
        const sand = (1 - smoothstep(4, 16, dR)) * (1 - smoothstep(426, 450, a)) * smoothstep(-0.6, 0.2, n2 + 0.4);
        const camp = smoothstep(CAMP.a0 - 12, CAMP.a0 + 6, a) * (1 - smoothstep(CAMP.a1 - 4, CAMP.a1 + 14, a)) * smoothstep(CAMP.l0 + 7, CAMP.l0 - 3, l) * (1 - smoothstep(CAMP.l1 + 6, CAMP.l1 - 10, l));
        const sd = Math.max(sand, camp);
        o.c[0] = lerp(0.95, 1.5, sd); o.c[1] = lerp(0.95, 1.36, sd); o.c[2] = lerp(0.95, 1.08, sd);
        o.a[0] = dR < 0 ? 0.6 : 1;
        o.a[1] = clamp(0.3 * smoothstep(410, 452, a) * smoothstep(-0.3, 0.4, n2) + dome * (0.72 + 0.28 * n2), 0, 1);
        o.a[2] = lerp(0.85, 0.35, sd);
        o.a[3] = G.zone > 0.002 ? G.zone : -1 - forestK(a, l);
      }, null, 5, ctx.yield);
      const m = new THREE.Mesh(g, matFloor); m.name = 'floor'; scene.add(m);
    }
    // ---------------- THE BANK'S STAIRCASE, built: one sheet whose rows follow the dams. Each terrace is six rows: the
    // foot of its dam in the pool below, the dam's bulging face, its crest a hand over the water, the crest's inner edge,
    // and two rows of level water; the top pool has more. Across it are 27 places: the two outermost are a skirt that
    // goes down into the bank, the next a rim of mossed stone a foot over the water. The sheet's shader is the cave
    // terraces' own, told that here the dams are built (STAIR).
    {
      const N = STAIR.N, FR = [0, 0.02, 0.045, 0.085, 0.3, 0.65], FRT = [0, 0.02, 0.045, 0.085, 0.25, 0.5, 0.75, 0.999], rows = [];
      for (let k = 0; k <= N; k++) for (const f of (k === N ? FRT : FR)) rows.push([k, f]);
      const WN = [-1.13, -1, -0.95, -0.88, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.95, 1, 1.13];
      const g = await gridGeometrySteps(WN.length, rows.length, (i, j, o) => {
        const k = rows[j][0], fr = rows[j][1], wn = WN[i], sg = wn < 0 ? -1 : 1, edge = Math.abs(wn) >= 1, skirt = Math.abs(wn) > 1;
        // (the dam's foot stands 0.15 m, its bulge 0.45 m downhill of its crest)
        const se = STAIR.dams[k] + (fr === 0 ? -0.15 : fr < 0.03 ? -0.45 : fr * (k === N ? STAIR.topLen : STAIR.dams[k + 1] - STAIR.dams[k]));
        let s = se, wl = 0, W = 1;
        for (let it = 0; it < 6; it++) { W = stairW(s, sg); wl = Math.min(Math.abs(wn), 1) * sg * W; s = se + stairBow(s, wl, W); }
        const q = atS(clamp(s, 0, Lp - 0.01), stairC(s) + wl + (skirt ? sg * 1.5 : 0));
        const yk = STAIR.lev[k], below = k ? STAIR.lev[k - 1] : JPOOL.y - 0.3;
        let y = fr === 0 ? below - 0.25 : fr < 0.03 ? below + 0.66 * (yk - below) : fr < 0.05 ? yk + 0.14 : fr < 0.09 ? yk + 0.02 : yk;
        if (edge && fr > 0.03) y = Math.max(y, yk + 0.3);
        if (skirt) y = (fr < 0.03 ? below : yk) - 4.5;
        o.p[0] = q[0]; o.p[1] = y; o.p[2] = q[2];
        o.a[0] = fr === 0 ? 0.7 : 1; o.a[1] = edge ? 1 : Math.abs(wn) > 0.9 ? 0.45 : 0; o.a[2] = 1.2; o.a[3] = 2 + k + fr;
      }, null, 10, ctx.yield);
      const m = new THREE.Mesh(g, matFloor); m.name = 'bank-stairs'; scene.add(m);
    }
    await ctx.yield();

    // ---------------- THE RIVER: a ribbon on the bed from behind the entry to where it comes out from under the blocks
    const riverRise = afterRain ? 0.5 : 0;
    {
      const NR = 187, NX = 9, pos = new Float32Array(NR * NX * 3), aR = new Float32Array(NR * NX * 3), idx = [];
      for (let j = 0; j < NR; j++) {
        const a = -112 + j * 3, hw = riverHalf(a) + 3.5 + 2 * riverRise + 12 * openK(a);    // (at the start it runs in under the foot of the right wall)
        const steep = clamp((riverY(a + 1.5) - riverY(a - 1.5)) * 0.7, 0, 1);
        for (let i = 0; i < NX; i++) {
          const t = i / (NX - 1) * 2 - 1, k = j * NX + i; W2(a, riverL(a) + t * hw, wtmp);
          pos[k * 3] = wtmp[0]; pos[k * 3 + 1] = riverY(a) + riverRise - 0.25 * smoothstep(436, 446, a); pos[k * 3 + 2] = wtmp[1];
          aR[k * 3] = a; aR[k * 3 + 1] = t; aR[k * 3 + 2] = steep;
        }
      }
      for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 3)); g.setIndex(idx); g.computeBoundingSphere();
      const river = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RIVER_VERT, fragmentShader: RIVER_FRAG, uniforms: caveU({ uMilk: { value: afterRain ? 1 : 0 } }), side: THREE.DoubleSide, transparent: true }));    // (water is a body: it hides what is behind it, and thins only at its shore)
      river.name = 'river'; river.renderOrder = 1; scene.add(river);
    }
    await ctx.yield();

    // ---------------- THE TOWERS: eight great stalagmites. Three are tiered cones built of stacked plates (the two great
    // ones and the camp's): each plate is a cap of flowstone whose lip stands out over the plate below with a fringe of
    // flutes hanging under it, and whose back slopes in to the foot of the next; the plates lean and differ; the rows
    // of the mesh follow them. The other five are each of its own form (below): a leaning stump with a broken top, a
    // bell, a cluster of candles, a column joined to the roof, an organ of pipes.
    const towerR = (T, t) => T.r * (1 + 0.4 * Math.exp(-t * 8)) * lerp(1, 0.4, Math.pow(t, 1.25)) * (t > 0.9 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.9) / 0.1, 2))) * 0.85 + 0.15 * (1 - (t - 0.9) / 0.1) : 1);
    // (the other forms' radius at a height, as a part of the whole height: what the gap from the line is kept from)
    const formR = (T, t) => T.form === 'tiers' ? towerR(T, t)
      : T.form === 'broken' ? T.r * (0.55 + 0.5 * (1 - t) + 0.5 * Math.exp(-t * 7))
      : T.form === 'bell' ? T.r * 1.8
      : T.form === 'candles' ? T.r * 1.05
      : T.form === 'column' ? T.r * (0.6 + 1.15 * Math.pow(Math.abs(t - 0.42) / 0.58, 1.6) + 0.45 * Math.exp(-t * 9))
      : T.r * 1.75;
    // a lathe of flowstone about an upright through (cx, cz): nu places round, nr rows; fn(angle, row, q) gives each
    // place its radius q.r, its height over the foot q.y, a shift aside (q.dx, q.dz), its shade q.ao and its tone
    const latheGeo = (cx, cz, gy, nu, nr, fn, moss = 0) => {
      const q = { r: 0, y: 0, dx: 0, dz: 0, ao: 1, tone: 1 };
      const g = gridGeometry(nu + 1, nr, (i, j, o) => {
        const ang = TAU * i / nu; q.dx = 0; q.dz = 0; q.ao = 1; q.tone = 0.95; fn(ang, j, q);
        o.p[0] = cx + Math.cos(ang) * q.r + q.dx; o.p[1] = gy + q.y; o.p[2] = cz + Math.sin(ang) * q.r + q.dz;
        o.a[0] = clamp(q.ao, 0.18, 1); o.a[1] = moss; o.a[2] = 1.3; o.a[3] = 0; o.c[0] = q.tone; o.c[1] = q.tone * 0.98; o.c[2] = q.tone * 0.94;
      });
      const n = g.attributes.normal;                                   // (the sheet closes on itself: its two edges share one normal)
      for (let j = 0; j < nr; j++) { const a = j * (nu + 1), b = a + nu, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); }
      return g;
    };
    const towers = [];
    for (let k = 0; k < TOWERS.length; k++) {
      const T = TOWERS[k], lineY = T.ly;
      // the foot stands so that the flank is the design's gap from the passage's axis at the height the line passes it
      // (a fixed place of the cave: the line swings past the second and the third, 8 m and more from their flanks)
      let off = T.gap + T.r * 0.75, base = [0, 0, 0];
      const towerAt = (o) => { W2(T.a, T.side * o, wtmp); base[0] = wtmp[0]; base[2] = wtmp[1]; };
      for (let it = 0; it < 4; it++) { towerAt(off); const gy = groundAt(base[0], base[2]) - 1.5, t = clamp((lineY - gy) / T.h, 0, 1); off = T.gap + formR(T, t) * (T.form === 'tiers' ? 1.3 : 1.08) + Math.abs(Math.tan(T.lean)) * Math.max(0, lineY - gy); }
      if (T.form === 'column') off = T.gap + 5.2;                       // (the column stands where the roof comes down to it: COLXZ)
      towerAt(off);
      const gy = groundAt(base[0], base[2]) - 1.5, flutes = 11 + (k % 4) * 3, plates = Math.round(T.h / (k === 1 ? 5.2 : T.r < 5.2 ? 3.4 : 4.4));
      const leanX = Math.tan(T.lean) * 0.8, leanZ = -Math.tan(T.lean) * 0.6;
      if (T.form !== 'tiers') {
        const parts = [], bx = base[0], bz = base[2], rib = (ang, t, n) => 1 + 0.07 * Math.cos(ang * n + 2.5 * Math.sin(t * 5 + k)) + 0.06 * nz.n3(Math.cos(ang) * 2 + k * 7, t * 7, Math.sin(ang) * 2);
        if (T.form === 'broken') {
          // THE LEANING ONE WITH A BROKEN TOP: a smooth fluted stalagmite that leans 11 degrees toward the lake; its head
          // has fallen: it ends in a slanted break, pale and sharp-edged
          const NR = 22;
          parts.push(latheGeo(bx, bz, gy, 30, NR, (ang, j, q) => {
            const t = Math.min(1, j / (NR - 3)), top = j >= NR - 3, cut = 1 - 0.13 * (0.5 + 0.5 * Math.cos(ang - 0.8)) - 0.03 * Math.cos(ang * 5);
            q.y = T.h * Math.min(t, 1) * (top ? cut : Math.min(1, t) < 0.999 ? 1 : cut); if (j === NR - 1) q.y = T.h * 0.9;
            q.r = formR(T, t) * rib(ang, t, 9) * (j === NR - 2 ? 0.55 : j === NR - 1 ? 0.02 : 1);
            q.dx = leanX * q.y; q.dz = leanZ * q.y; q.ao = top ? 1 : 0.55 + 0.45 * Math.cos(ang * 9 + 2.5 * Math.sin(t * 5 + k)) * 0.5 + 0.2; q.tone = top ? 1.25 : 0.92 + 0.14 * nz.n2(ang * 1.3 + 9, t * 6);
          }));
        } else if (T.form === 'bell') {
          // THE BELL: a broad mushroom of flowstone: a stem, and over it a cap 17 m across whose rim hangs down in a
          // dripping skirt of unequal points
          const prof = [[0, 1.5, 0], [0.04, 0.95, 0], [0.2, 0.62, 0], [0.4, 0.56, 0], [0.52, 0.7, 0], [0.57, 1.15, 0], [0.55, 1.6, 1], [0.6, 1.8, 0], [0.7, 1.74, 0], [0.8, 1.52, 0], [0.89, 1.15, 0], [0.96, 0.66, 0], [1, 0.02, 0]];
          parts.push(latheGeo(bx, bz, gy, 40, prof.length, (ang, j, q) => {
            const P = prof[j], teeth = Math.pow(0.5 + 0.5 * Math.cos(ang * 13 + 1.4 * Math.sin(ang * 3)), 2) * (0.5 + 0.5 * Math.sin(ang * 2 + 1));
            q.y = T.h * P[0] - (P[2] ? 1.2 + 4.2 * teeth : 0) + (j > 6 ? 0.7 * Math.sin(ang * 2 + 0.6) : 0);
            q.r = T.r * P[1] * (1 + (j > 0 && j < 5 ? 0.08 * Math.cos(ang * 7) : 0.04 * Math.cos(ang * 13)) + 0.05 * nz.n3(Math.cos(ang) * 2, P[0] * 6, Math.sin(ang) * 2));
            q.ao = j === 5 || j === 4 ? 0.3 : j === 6 ? 0.7 : 1; q.tone = 0.92 + 0.14 * nz.n2(ang * 1.5, P[0] * 5);
          }));
        } else if (T.form === 'column') {
          // THE COLUMN: a stalagmite and the stalactite over it grown into one, joined from the floor to the roof (which
          // comes down to it as a great boss): broad at its foot, a waist two fifths of the way up, flaring into the rock
          const NR = 26;
          parts.push(latheGeo(bx, bz, gy, 30, NR, (ang, j, q) => {
            const t = j / (NR - 1);
            q.y = t * (COL_TOP + 16 - gy); q.r = formR(T, t) * rib(ang, t, 7) * (1 + 0.1 * Math.sin(t * 31 + 1.7 * Math.sin(ang * 2)));
            q.ao = 0.75 + 0.25 * Math.cos(ang * 7 + 2.5 * Math.sin(t * 5 + k)); q.tone = 0.74 + 0.14 * nz.n2(ang * 1.3 + 4, t * 9);   // (old, darker flowstone than the lake's)
          }, 0.25));
        } else {
          // THE CANDLES and THE ORGAN: stalagmites grown side by side on one mound of flowstone. The candles are seven
          // slender spires of very unequal height that stand apart, each with a rounded tip; the organ is eleven thick
          // pipes in two close rows whose blunt heads step up to the middle and down again
          const organ = T.form === 'organ', n = organ ? 11 : 7, NR = 9;
          parts.push(latheGeo(bx, bz, gy, 22, 5, (ang, j, q) => { const t = j / 4; q.y = 4.5 * t * (1 + 0.2 * Math.sin(ang * 2)); q.r = T.r * (organ ? 1.3 : 1.15) * (1 - 0.55 * t * t) * (1 + 0.1 * Math.cos(ang * 5 + k)) * (j === 4 ? 0.02 : 1); q.ao = 0.9; }, organ ? 0.3 : 0));
          for (let p = 0; p < n; p++) {
            let px, pz, ph, pr;
            if (organ) { const row = p < 7 ? 0 : 1, u = row ? (p - 7 + 0.5) / 4 : p / 6, arc = (u - 0.5) * 1.9 + 0.9; px = Math.cos(arc) * T.r * (row ? 0.35 : 0.95) - T.r * 0.5 * Math.cos(0.9); pz = Math.sin(arc) * T.r * (row ? 0.35 : 0.95) - T.r * 0.5 * Math.sin(0.9); ph = T.h * (0.45 + 0.55 * Math.sin(Math.PI * (0.12 + 0.76 * u))) * (row ? 0.6 : 1) * (0.92 + 0.16 * Math.abs(Math.sin(p * 2.7))); pr = T.r * (0.3 + 0.07 * Math.sin(p * 1.9)); }
            else { const ang0 = p * 2.4 + 0.5 * Math.sin(p * 1.3), d = p === 0 ? 0 : T.r * (0.42 + 0.3 * Math.abs(Math.sin(p * 1.7))); px = Math.cos(ang0) * d; pz = Math.sin(ang0) * d; ph = T.h * (p === 0 ? 1 : 0.3 + 0.55 * Math.abs(Math.sin(p * 2.9 + 1))); pr = T.r * (p === 0 ? 0.3 : 0.15 + 0.07 * Math.abs(Math.sin(p * 4.1))); }
            const sway = organ ? 0 : 0.03 * Math.sin(p * 3.3);
            parts.push(latheGeo(bx + px, bz + pz, gy + 1.2, organ ? 9 : 8, NR, (ang, j, q) => {
              const t = j / (NR - 1), head = organ ? Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.9) / 0.1, 2))) : Math.pow(Math.max(0, 1 - t), 0.55) * 0.8 + 0.2 * Math.sqrt(Math.max(0, 1 - t * t));
              q.y = ph * (organ ? Math.min(1, t / 0.9) * 0.97 + 0.03 * t : t); q.r = pr * (j === NR - 1 ? 0.02 : head * (1 + 0.13 * Math.sin(t * (organ ? 9 : 17) + p * 2) + (organ ? 0.07 * Math.cos(ang * 4) : 0)) + 0.5 * Math.exp(-t * 9));
              q.dx = sway * q.y; q.dz = -sway * 0.6 * q.y; q.ao = 0.7 + 0.3 * t; q.tone = 0.9 + 0.16 * Math.abs(Math.sin(p * 5.3));
            }, organ ? 0.3 * 0.6 : 0));
          }
        }
        const m = new THREE.Mesh(parts.length > 1 ? mergeGeo(parts) : parts[0], matCalc); m.name = 'tower'; scene.add(m);
        towers.push({ x: bx, y: gy, z: bz, T, off, leanX, leanZ });
        await ctx.yield();
        continue;
      }
      const NU = 36, rows = [];
      for (let p = 0; p < plates + 2; p++) for (const f of [0, 0.14, 0.34, 0.56, 0.76, 0.86, 0.94]) rows.push(p + f);
      const g = await gridGeometrySteps(NU + 1, rows.length, (i, j, o) => {
        const ang = TAU * i / NU, tau = rows[j], pi = Math.floor(tau + 1e-6), fr = tau - pi;      // fr: 0 at a plate's lip, rising over its back to the underside of the next
        const wOf = (p) => (0.1 + 0.16 * Math.abs(Math.sin(p * 3.7 + k))) * Math.sin(ang + p * 2.3) + 0.07 * Math.sin(ang * 3 + p * 1.1);
        const w = lerp(wOf(pi), wOf(pi + 1), smoothstep(0.5, 1, fr));  // (no plate is level, and each leans its own way)
        const t = Math.pow(clamp((tau - w - 0.9) / plates, 0, 1), 1 / 0.9), y = t * T.h;
        const back = Math.pow(1 - fr, 1.4), under = smoothstep(0.74, 1, fr), out = lerp(back, 1, under);
        const size = lerp(0.7 + 0.6 * Math.abs(Math.sin(pi * 2.9 + k)), 0.7 + 0.6 * Math.abs(Math.sin((pi + 1) * 2.9 + k)), under);   // (some plates stand out further than others)
        const teeth = 0.5 + 0.5 * Math.cos(ang * flutes + (pi + 1) * 2.4 + 1.2 * Math.sin((pi + 1) * 1.7));                      // the fringe that hangs under the lip above
        const r = towerR(T, t) * (0.82 + 0.2 * out * size + 0.07 * under * teeth + 0.025 * Math.cos(ang * flutes + pi * 2.4) * back + 0.05 * nz.n3(Math.cos(ang) * 2.2 + k * 9, t * 6, Math.sin(ang) * 2.2));
        o.p[0] = base[0] + Math.cos(ang) * r + leanX * y; o.p[1] = gy + y; o.p[2] = base[2] + Math.sin(ang) * r + leanZ * y;
        o.a[0] = clamp((0.5 + 0.5 * back) * (1 - 0.7 * under * (1 - 0.45 * teeth)), 0.18, 1); o.a[1] = 0; o.a[2] = 1.3;
        const tn = 0.9 + 0.16 * nz.n2(ang * 1.3 + k * 5, t * 5);
        o.c[0] = tn; o.c[1] = tn * 0.98; o.c[2] = tn * 0.94;
      }, null, 12, ctx.yield);
      { const n = g.attributes.normal, nu = NU + 1;                     // (the sheet closes on itself: its two edges share one normal)
        for (let j = 0; j < rows.length; j++) { const a = j * nu, b = a + NU, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
      const m = new THREE.Mesh(g, matCalc); m.name = 'tower'; scene.add(m);
      towers.push({ x: base[0], y: gy, z: base[2], T, off, leanX, leanZ });
      await ctx.yield();
    }

    // ---------------- small formations: stalagmites about the towers' feet, stalactites and curtains under the roof's left shoulder
    const R = {};                                                       // a fork for each kind of thing dealt by the seed
    for (const n of ['spires', 'tites', 'lamps', 'drips', 'blocks', 'karst', 'trees', 'under', 'ferns', 'lianas', 'rim', 'motes', 'threads', 'swifts', 'flies', 'cloud', 'shower', 'pearls', 'wallferns', 'spare1', 'spare2', 'islands', 'roof', 'bloom', 'water', 'party']) R[n] = rng.fork(n);
    // a little lathe: a cone with a rounded, lumpy flank; down = true hangs it from its origin
    // (one that hangs is broad at its root, where it grows out of the roof)
    // (form 1: a club, thick to its rounded head, in rolls; form 2: a boss, a low round dome of flowstone)
    const spireGeo = (seed, down, form = 0) => gridGeometry(8, 5, (i, j, o) => {
      const ang = TAU * i / 7, t = Math.pow(j / 4, down ? 1.5 : 1);
      const prof = form === 1 ? 0.36 * Math.sqrt(Math.max(0, 1 - t * t * t)) * (1 + 0.3 * Math.cos(t * 12.6)) : form === 2 ? 0.85 * Math.sqrt(Math.max(0, 1 - t * t)) : 0.5 * Math.pow(1 - t, 0.75 + 0.3 * seed) + (down ? 0.32 * Math.exp(-t * 6) : 0);
      const r = prof * (1 + 0.16 * Math.cos(ang * 5 + seed * 3) + 0.2 * Math.sin(t * 9 + seed * 5)) + (t < 0.999 ? 0.02 : 0);
      o.p[0] = Math.cos(ang) * r; o.p[1] = down ? -t : t; o.p[2] = Math.sin(ang) * r;
      o.a[0] = 0.75 + 0.25 * Math.cos(ang * 5 + seed * 3); o.a[2] = 1.1; o.c[0] = 0.95; o.c[1] = 0.93; o.c[2] = 0.88;
    });
    // the roof over a place (axis coordinates), found on the shell itself: the arch is searched for the point that stands over
    // the place. shO.p is that point of the rock
    const shO = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] };
    function roofAt(a, l) {
      let lo = 0.03 * Math.PI, hi = 0.97 * Math.PI;                   // (the arch runs from the right wall's foot over to the left's)
      for (let it = 0; it < 13; it++) { const mid = (lo + hi) * 0.5; shellPoint(a, mid, shO); toAxis(shO.p[0], shO.p[2], axT); if (axT.l > l) lo = mid; else hi = mid; }
      shellPoint(a, (lo + hi) * 0.5, shO);
      return shO.p[1];
    }
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S3 = new V3(), P3 = new V3(), E3 = new THREE.Euler();
    const instanced = (geo, mat, list, name) => {                       // list: [x, y, z, sx, sy, sz, yaw, tiltX, tiltZ]
      const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
      for (let i = 0; i < list.length; i++) { const q = list[i]; E3.set(q[7] || 0, q[6] || 0, q[8] || 0, 'YXZ'); Q4.setFromEuler(E3); M4.compose(P3.set(q[0], q[1], q[2]), Q4, S3.set(q[3], q[4], q[5])); m.setMatrixAt(i, M4); }
      m.count = list.length; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.name = name; scene.add(m); return m;
    };
    {
      const r = R.spires, lists = [[], [], []];
      for (let k = 0; k < 2; k++) {                                     // (about the feet of the two towers the line passes between)
        const tw = towers[k];
        for (let i = 0; i < 11; i++) {                                  // (of three kinds: cones, clubs with rounded heads, low round bosses)
          const ang = r() * TAU, d = tw.T.r * r.range(1.15, 2.6), v = r.int(0, 2), h = r.range(2, 8) * (1 - 0.5 * smoothstep(1.5, 2.6, d / tw.T.r)) * (v === 2 ? 0.4 : 1), w = h * (v === 2 ? r.range(1.3, 2.2) : r.range(0.2, 0.36));
          const x = tw.x + Math.cos(ang) * d, z = tw.z + Math.sin(ang) * d, gy = groundAt(x, z) - 0.4;
          if (nearLine(x, gy + h, z).d < 12.5 || nearLine(x, gy, z).d < 12.5) continue;   // by rule: nothing of it within 12 m of the line
          lists[v].push([x, gy, z, w, h, w, r() * TAU, r.range(-0.05, 0.05), r.range(-0.05, 0.05)]);
        }
      }
      for (let i = 0; i < 28; i++) {                                    // and a scatter on the rubble of the passage floor
        const a = r.range(-60, 250), wl = wallsAt(a), l = r.range(wl.left + 6, wl.right - 6), v = r.int(0, 2), h = r.range(1.5, 7) * (v === 2 ? 0.4 : 1), w = h * (v === 2 ? r.range(1.3, 2.2) : r.range(0.3, 0.5));
        W2(a, l, wtmp); const dR = Math.abs(l - riverL(a)) - riverHalf(a), G = gourField(a, l);
        const gy = groundAt(wtmp[0], wtmp[1]) - 0.4;
        if (dR < 7 || G.zone > 0.05 || (a > CAMP.a0 - 16 && a < CAMP.a1 + 16 && l < CAMP.l0 + 10) || nearLine(wtmp[0], gy + h, wtmp[1]).d < 12.5) continue;
        lists[v].push([wtmp[0], gy, wtmp[1], w, h, w, r() * TAU, r.range(-0.04, 0.04), r.range(-0.04, 0.04)]);
      }
      for (let v = 0; v < 3; v++) instanced(spireGeo(0.3 + v * 0.9, false, v), matHang, lists[v], 'stalagmites');
      await ctx.yield();
      // stalactites under the roof's low shoulder. Each grows out of the roof itself: its root stands a metre and a half
      // inside the rock over it. Their tips are never nearer than 12.5 m to the line
      const rt = R.tites, tl = [[], []];
      for (let i = 0; i < 170; i++) {
        const a = rt.range(196, 336), l = rt.range(-66, -11), len = (4 + 22 * Math.pow(rt(), 1.8)) * (0.5 + 0.5 * smoothstep(-64, -20, l)), v = rt.int(0, 1), wk = rt.range(0.11, 0.2), yaw = rt() * TAU;      // (slender: a stalactite is five to nine times as long as it is thick)
        // (where the shoulder's roof is steep, right of 42 m left of the axis, the root stands as high as the roof 3 m to
        // either side of it: no root shows under the rock)
        const top = (l > -42 ? Math.max(roofAt(a, l - 3), roofAt(a, l + 3), roofAt(a, l)) : roofAt(a, l)) + 1.5, x = shO.p[0], z = shO.p[2]; let tip = top - len;
        for (let it = 0; it < 30 && nearLine(x, tip, z).d < 12.5; it++) tip += 1;
        if (i % 24 === 23) await ctx.yield();
        if (top - tip < 4) continue;
        tl[v].push([x, top, z, (top - tip) * wk, top - tip, (top - tip) * wk, yaw, 0, 0]);
      }
      // THE HANGING FIELD over the first staircase (a 96 to a 194, from 34 m left of the axis to 52 m right of it): some
      // two hundred and fifty stalactites in clumps under the roof that comes down there, 4 to 19 m long, the longest over the
      // terraces to the right, and along the two lips of that roof (a 104 and a 186) a fringe of short ones. BY RULE
      // no tip is nearer than 13 m to the line in space: one that would be is shortened, a metre at a time (and the
      // least height of a tip over the line is kept in the scene's data)
      let tipLeast = 1e9;
      for (let i = 0; i < 370; i++) {
        const fringe = i >= 290, a = fringe ? (i % 2 ? 104 : 186) + rt.range(-3, 3) : rt.range(96, 194), l = rt.range(-34, 52), v = rt.int(0, 1), wk = rt.range(0.1, 0.18), yaw = rt() * TAU, u = rt();
        W2(a, l, wtmp);
        if (!fringe && nz.n2(wtmp[0] * 0.06 + 11, wtmp[1] * 0.06) < -0.22) continue;                 // (in clumps, with bare roof between them)
        const len = fringe ? 2.5 + 4 * u : (4 + 15 * Math.pow(u, 1.7)) * (0.6 + 0.4 * smoothstep(-30, 20, l));
        const top = roofAt(a, l) + 1.5, x = shO.p[0], z = shO.p[2]; let tip = top - len, q = nearLine(x, tip, z);
        for (let it = 0; it < 30 && q.d < 13; it++) { tip += 1; q = nearLine(x, tip, z); }
        if (i % 30 === 29) await ctx.yield();
        if (top - tip < 2.5 || top > 90) continue;                       // (only under the low roof itself)
        if (q.dh < 30) tipLeast = Math.min(tipLeast, tip - ly[q.s]);
        tl[v].push([x, top, z, (top - tip) * wk + 0.25, top - tip, (top - tip) * wk + 0.25, yaw, 0, 0]);
      }
      scene.userData.hang = { tipOverLine: +tipLeast.toFixed(1) };
      for (let v = 0; v < 2; v++) instanced(spireGeo(0.2 + v * 1.1, true), matHang, tl[v], 'stalactites');
      await ctx.yield();
      // curtains: wavy sheets of flowstone that hang from the roof, each from a line on the rock itself (its upper edge stands
      // in the rock). fnc(u) -> [x, y of the rock, z, how far it hangs]; kept out of the line's clear air by the same rule
      const curtain = (n, fnc, clear = 9.5) => {
        const cols = []; for (let i = 0; i < n; i++) cols.push(fnc(i / (n - 1)));
        return gridGeometry(n, 6, (i, j, o) => {
          const u = i / (n - 1), q = cols[i], t = j / 5;
          let y = q[1] + 1.2 - (q[3] + 1.2) * t;
          for (let it = 0; it < 30 && nearLine(q[0], y, q[2]).d < clear; it++) y += 1;
          o.p[0] = q[0]; o.p[1] = Math.min(y, q[1] + 1.2); o.p[2] = q[2]; o.a[0] = 0.7 + 0.3 * Math.sin(u * 60); o.a[2] = 1.3; o.a[3] = 1; o.c[0] = 1; o.c[1] = 0.95; o.c[2] = 0.85;
        });
      };
      const cgs = [];
      for (let c = 0; c < 4; c++) {
        const a0 = 204 + c * 25, ph = c * 1.7;
        cgs.push(curtain(64, (u) => {
          const y = roofAt(a0 + 21 * u + 1.0 * Math.sin(u * 23 + ph), -14 - 6 * c % 9 - 3.2 * Math.sin(u * 5.1 + ph) - 1.3 * Math.sin(u * 27 + ph));
          return [shO.p[0], y, shO.p[2], 20 - 4 * (0.5 - 0.5 * Math.cos(u * 11 + ph)) - 2.5 * (0.5 - 0.5 * Math.cos(u * 25 + ph * 2)) - 13 * Math.pow(Math.abs(u - 0.5) * 2, 3)];
        }));
        await ctx.yield();
      }
      // (and three draped curtains in the hanging field: each hangs across the passage from the low roof in folds, 7 to
      // 15 m deep, its lower edge in points; no place of one is nearer than 13 m to the line)
      for (let c = 0; c < 3; c++) {
        const a0 = 122 + c * 27, ph = c * 2.3 + 0.7, l0 = c === 1 ? -30 : -8, l1 = c === 1 ? 24 : 50;
        cgs.push(curtain(64, (u) => {
          const y = roofAt(a0 + 5 * Math.sin(u * 4.4 + ph) + 1.2 * Math.sin(u * 23 + ph), lerp(l0, l1, u) + 1.1 * Math.sin(u * 29 + ph));
          return [shO.p[0], y, shO.p[2], 14 - 4 * (0.5 - 0.5 * Math.cos(u * 12 + ph)) - 2.5 * (0.5 - 0.5 * Math.cos(u * 27 + ph * 2)) - 6 * Math.pow(Math.abs(u - 0.5) * 2, 3)];
        }, 13));
        await ctx.yield();
      }
      const cm = new THREE.Mesh(mergeGeo(cgs), matHang); cm.name = 'curtains'; scene.add(cm);
    }
    await ctx.yield();

    // ---------------- THE CURTAIN WALL (a 340 to a 392, the left wall): the great flowstone fall down the wall is the shell's
    // own; over it hang
    {
      // THE DRAPERIES: curtains of flowstone that hang in folds down the left wall above the flowstone fall (a 350 to
      // a 392, from 60 m down to 26 m), each a sheet folded like cloth, standing 2 to 4 m out of the wall, its lower
      // edge in points; they stand on the wall itself (the wall keeps 15 m from the line by rule, and they are 45 m off)
      const o = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] }, parts = [];
      for (let c = 0; c < 5; c++) {
        const a0 = 349 + c * 8.6, NU = 30, hang = 22 + 9 * Math.abs(Math.sin(c * 2.3 + 1)), yTop = 58 + 5 * Math.sin(c * 1.7), cols = [];
        for (let i = 0; i <= NU; i++) {
          const a = a0 + 9.4 * i / NU, wl = wallsAt(a);
          shellPoint(a, Math.PI - Math.asin(Math.min(1, Math.pow((yTop + 5) / (wl.roof + 5), 1 / archE(a)))), o);
          const f = axisAt(a); cols.push([o.p[0], o.p[1], o.p[2], -f.hz, f.hx]);       // (a place on the left wall, and the way out of the wall)
        }
        await ctx.yield();
        parts.push(gridGeometry(NU + 1, 7, (i, j, q) => {
          const u = i / NU, t = j / 6, cc = cols[i], fold = Math.sin(u * 31 + c * 2), out = 1.2 + (1.4 + 1.6 * t) * (0.5 + 0.5 * fold) + 0.8 * t;
          const len = hang * (0.72 + 0.28 * Math.abs(Math.sin(u * 13 + c))) * (1 - 0.5 * Math.pow(Math.abs(u - 0.5) * 2, 3));
          q.p[0] = cc[0] + cc[3] * out * Math.min(1, t * 3); q.p[1] = cc[1] + 1.5 - (len + 1.5) * t; q.p[2] = cc[2] + cc[4] * out * Math.min(1, t * 3);
          q.a[0] = 0.5 + 0.5 * (0.5 + 0.5 * fold); q.a[2] = 1.3; q.a[3] = 1; q.c[0] = 1; q.c[1] = 0.96; q.c[2] = 0.88;
        }));
      }
      const dm = new THREE.Mesh(mergeGeo(parts), matCalc); dm.name = 'draperies'; scene.add(dm);
    }
    await ctx.yield();

    // ---------------- THE CAMP AND THE LAMPS: two tents lit from inside on the bar, and fourteen or fifteen head lamps (twelve or
    // thirteen lit ones in the cave, two or three unlit in the dome's daylight), each on the helmet of a plain standing
    // figure (sparks for size). THE LAMPS ARE STEADY: each rests on the place it was turned to; and each lit lamp
    // lays a small warm pool of light about its own caver's feet (the lamps' shader), so that the figure reads.
    const fxTime = CU.uTime, lampList = [];                            // lampList: { slot, x, y, z, col, power, tent }
    const tentU = [], domeFigs = [];                                   // domeFigs: where the figures on the mound stand (no tree stands on them)
    {
      const r = R.lamps, sCamp = campUp ? 72 : 50;
      const tentCols = tentBlue ? ['#4aa3ff', '#FFD9A0'] : ['#FF9A3D', '#FFD9A0'];
      // (a tent: a low dome 4.4 m long, 3 m wide and 1.5 m high, drawn in at its two ends)
      const tentGeo = () => { const g = new THREE.SphereGeometry(1, 16, 7, 0, TAU, 0, Math.PI * 0.5); g.scale(2.2, 1.5, 1.5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 2.2; p.setZ(i, p.getZ(i) * (1 - 0.35 * x * x)); p.setY(i, p.getY(i) * (1 - 0.25 * x * x)); } g.computeVertexNormals(); return g; };
      for (let k = 0; k < 2; k++) {
        const q = atS(sCamp + (k ? -7 : 5), k ? -44 : -38), gy = groundAt(q[0], q[2]);
        const U = caveU({ uCol: { value: lin(tentCols[k]) }, uGlow: { value: 1.5 } });
        const m = new THREE.Mesh(tentGeo(), new THREE.ShaderMaterial({ vertexShader: TENT_VERT, fragmentShader: TENT_FRAG, uniforms: U, side: THREE.DoubleSide }));
        m.position.set(q[0], gy - 0.03, q[2]); m.rotation.y = 0.5 + k * 1.1; m.name = 'tent'; scene.add(m);
        tentU.push(U);
        const col = lin(tentCols[k]).lerp(lin('#FFB060'), tentBlue && k === 0 ? 0.15 : 0.5);
        lampP[k].set(q[0], gy + 0.7, q[2], 34); lampC[k].copy(col).multiplyScalar(9); lampW[k].set(0.5, 50);
        lampList.push({ slot: k, x: q[0], y: gy + 0.7, z: q[2], phase: k * 2.3, col, power: 9, tent: true });
      }
      // a head lamp and its figure: where it stands, and the place its lamp rests on. BY RULE nobody stands nearer than 20 m to
      // the line in space: a place nearer than that is moved straight away from the line, a metre at a time, and if forty
      // moves do not clear it the figure is not there at all
      const figs = [], sparks = [], lampCols = ['#FFE9CC', '#FFF3E0', '#FFE2B8'];
      // (cone, reach, power: the lamp's own beam where it is turned; wash, washR: the wide warm light all round it and how
      // far that goes; lit false: a figure and its spark in broad daylight, whose lamp lights nothing that could be seen)
      const addLamp = (x, z, tx, ty, tz, cone, reach, power, wash = 0, washR = 1, lit = true) => {
        const col = lin(r.pick(lampCols));
        let q = nearLine(x, groundAt(x, z) + 0.9, z);
        for (let it = 0; it < 40 && q.d < 21; it++) { const dx = x - lx[q.s], dz = z - lz[q.s], h = Math.hypot(dx, dz) || 1; x += dx / h; z += dz / h; q = nearLine(x, groundAt(x, z) + 0.9, z); }
        const slot = lampList.length;
        if (q.d < 21 || (lit && slot >= NL - 1)) return null;
        const gy = groundAt(x, z), yaw = Math.atan2(tz - z, tx - x), hx = x + Math.cos(yaw) * 0.16, hy = gy + 1.63, hz = z + Math.sin(yaw) * 0.16;
        const dx = tx - hx, dy = ty - hy, dz = tz - hz, dl = Math.hypot(dx, dy, dz) || 1;
        figs.push([x, gy - 0.05, z, 1, 1, 1, -yaw - Math.PI / 2, 0, 0]);
        if (!lit) { sparks.push([hx, hy, hz]); return [x, gy, z]; }
        lampP[slot].set(hx, hy, hz, reach); lampD[slot].set(dx / dl, dy / dl, dz / dl, cone); lampC[slot].copy(col).multiplyScalar(power); lampW[slot].set(wash, washR);
        lampList.push({ slot, x: hx, y: hy, z: hz, col, power });
        return [x, gy, z];
      };
      // the camp's own, at the water's edge on the bar: the first stands short of the camp's tower and its lamp rests on it (the
      // first great lit thing of the cave, gold from its foot to its head); the second looks across the river at the far
      // wall: a broad soft wash on plain wet stone; the third at the water at its feet (and on some visits a fourth looks
      // back down the river)
      const shore = (a) => {                                            // (the bar's dry edge: the first place, going left from the water, that stands a hand over it)
        let l = -22; for (let it = 0; it < 50; it++, l -= 0.5) { W2(a, l, wtmp); if (groundAt(wtmp[0], wtmp[1]) > riverY(a) + riverRise + 0.3) break; }
        return l - 0.4;
      };
      { const s = r.range(41, 46), q = atS(s, shore(s) - 1), t = towers[5]; addLamp(q[0], q[2], t.x, t.y + 13, t.z, 0.74, 64, 6.5, 0.8, 80); }
      { const s = r.range(80, 86), q = atS(s, shore(s)), t = atS(66 + r.range(-3, 3), 39, [0, 0, 0]); addLamp(q[0], q[2], t[0], 11, t[2], 0.86, 130, 60, 0.8, 80); }
      { const s = r.range(26, 33), q = atS(s, shore(s)), t = atS(s + 3, -18.5, [0, 0, 0]); addLamp(q[0], q[2], t[0], 0.2, t[2], 0.72, 16, 4, 0.7, 70); }
      if (lampDeal === 8) { const s = r.range(8, 16), q = atS(s, shore(s)), t = atS(s - 14, -17, [0, 0, 0]); addLamp(q[0], q[2], t[0], 0.2, t[2], 0.74, 22, 6, 0.5, 44); }
      // one stands by the dried pool of pearls and looks down into it
      { W2(PEARL.a + 1.5, PEARL.l + 6.5, wtmp); const x = wtmp[0], z = wtmp[1]; W2(PEARL.a, PEARL.l, wtmp); addLamp(x, z, wtmp[0], groundAt(wtmp[0], wtmp[1]), wtmp[1], 0.78, 18, 5, 0.6, 46); }
      // one higher on the terraces, looking into a pool at its feet
      // (the pool it looks into is lit from within: a second lamp rests in its water, 24 m from the line; and a third rests at
      // the water's edge among the lowest terraces, 21 m right of the line at 110 m flown: its turquoise is seen across the
      // river from the first metre. Both are fixed)
      const poolLamps = [];
      { const s = r.range(160, 176), q = atS(s, r.range(30, 40)), t = atS(s - 3, 24, [0, 0, 0]); addLamp(q[0], q[2], t[0], groundAt(t[0], t[2]), t[2], 0.74, 17, 4.5, 0.6, 50);
        poolG[1].set(t[0], t[2], 12, groundAt(t[0], t[2])); poolLamps.push([t[0], groundAt(t[0], t[2]) + 0.2, t[2]]);
        CU.uUp.value.set(t[0], groundAt(t[0], t[2]), t[2], 115); }     // (the pool this lamp is turned into lights the hanging field over it from below: gold)
      { const t = atS(110, 21, [0, 0, 0]); poolG[0].set(t[0], t[2], 18, groundAt(t[0], t[2])); poolLamps.push([t[0], groundAt(t[0], t[2]) + 0.2, t[2]]); }
      // (the lake and the three groups up the steep stairs: each glows from a lamp that rests in its water)
      for (let i = 0; i < GLOWPOOLS.length; i++) { const P = GLOWPOOLS[i]; W2(P.a, P.l, wtmp); const y = groundAt(wtmp[0], wtmp[1]); poolG[2 + i].set(wtmp[0], wtmp[1], P.r, y); poolLamps.push([wtmp[0], y + 0.2, wtmp[1]]); }
      // one at the foot of the first tower, on the side the line comes from: its lamp washes the tower from its foot
      { const t1 = towers[0], q = atS(t1.T.a - 15, -(t1.off + 9)); addLamp(q[0], q[2], t1.x, t1.y + 22, t1.z, 0.72, 50, 16, 1.2, 80); }
      // one on the terraces to the right, short of the second tower: its strong lamp rests on that tower's flank
      { const t2 = towers[1], q = atS(t2.T.a - 26, t2.off + 19); addLamp(q[0], q[2], t2.x, t2.y + 30, t2.z, 0.8, 66, 40, 1.3, 90);
        CU.uWash.value[0].set(t2.x, t2.z, t2.y + 14, t2.y + 50); CU.uWashC.value[0].setRGB(1.0, 0.72, 0.38).multiplyScalar(0.4); }
      // AND UP THE STAIRCASE EACH GREAT THING HAS ITS LAMP: a caver stands on the lake's left shore between the bell and
      // the broken stump, his lamp on the stump; one at its right, his lamp on the candles; one on the terraces by the
      // right shore, his lamp on the cave's fall; one on the river's bank below the curtain wall, his lamp on the
      // draperies; one on the last staircase, his lamp on the column that joins the roof.
      // [where the caver stands (axis place), what the lamp rests on, reach, power, wash, the wash's reach]
      { const t3 = towers[2], t5 = towers[4], t7 = towers[6], dr = W2(370, -66, [0, 0]);
        // (and the lake mirrors its three islands' lit flanks)
        [towers[2], towers[3], towers[4]].forEach((t, i) => { CU.uWash.value[1 + i].set(t.x + t.leanX * 14, t.z + t.leanZ * 14, t.y + 3, t.y + 0.8 * t.T.h); CU.uWashC.value[1 + i].setRGB(1.0, 0.74, 0.42).multiplyScalar(i === 1 ? 0.3 : 0.55); });
        for (const [a, l, tx, ty, tz, reach, power, wash, washR] of [
          [301, -30, t3.x + t3.leanX * 18, t3.y + 22, t3.z + t3.leanZ * 18, 50, 20, 1.3, 85],
          [318, 44, t5.x, t5.y + 24, t5.z, 56, 30, 1.2, 80],
          [284, 48, CF.x, CF.y + 16, CF.z, 54, 36, 1.0, 70],            // (one on the terraces by the lake's right shore: his lamp rests on the cave's fall)
          [352, -31, dr[0], 44, dr[1], 80, 22, 0.7, 95],
          [392, 6, t7.x, t7.y + 22, t7.z, 60, 10, 0.5, 80]]) { W2(a, l, wtmp); addLamp(wtmp[0], wtmp[1], tx, ty, tz, 0.76, reach, power, wash, washR); } }
      // two or three on the mound in the dome, far from the line and in broad daylight (sparks for size: their lamps light
      // nothing that could be seen there): one on its top in the sun, one on the slope toward the passage, and on some
      // visits one on the slope over the bank
      for (const pl of [[612, 58], [548, 32], [660, 20]].slice(0, lampDeal === 9 ? 3 : 2)) {
        W2(pl[0], pl[1], wtmp); const x = wtmp[0], z = wtmp[1]; W2(pl[0] - 8, pl[1] - 8, wtmp);
        const at = addLamp(x, z, wtmp[0], groundAt(wtmp[0], wtmp[1]), wtmp[1], 0.74, 12, 8, 0, 1, false); if (at) domeFigs.push(at);
      }
      // THE RING'S OWN GLOW: the ring is a lamp too, and its light lies warm on the figs' roots, the shelf and the leaves about
      // it (the last lamp of the list: all round, 36 m; it has no figure and no spark of its own)
      { const w = W2(RING.a, RING.l); lampP[NL - 1].set(w[0], RING.y, w[1], 36); lampD[NL - 1].set(0, -1, 0, -2); lampC[NL - 1].copy(lin('#ffd9a0')).multiplyScalar(5); }
      // the figures: plain, standing, a helmet and no face
      const fig = gridGeometry(9, 13, (i, j, o) => {
        const ang = TAU * i / 8, t = j / 12, y = t * 1.74;
        const rr = y < 0.9 ? 0.15 + 0.03 * Math.sin(ang * 2) : y < 1.42 ? lerp(0.17, 0.22, (y - 0.9) / 0.52) : y < 1.5 ? lerp(0.22, 0.075, (y - 1.42) / 0.08) : y < 1.62 ? lerp(0.075, 0.135, smoothstep(1.5, 1.6, y)) : 0.135 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 1.62) / 0.12, 2)));
        o.p[0] = Math.cos(ang) * rr * (y < 1.45 ? 1.25 : 1); o.p[1] = y; o.p[2] = Math.sin(ang) * rr * (y < 1.45 ? 0.8 : 1);
        const dk = y > 1.52 ? 0.5 : 0.22; o.c[0] = dk; o.c[1] = dk; o.c[2] = dk; o.a[2] = 0.2;
      });
      instanced(fig, matBlock, figs, 'figures');
      const glowPos = lampList.filter((l) => !l.tent).map((l) => [l.x, l.y, l.z]).concat(sparks, poolLamps);
      const glows = fx.makeGlows({ rng: R.lamps, positions: glowPos, color: '#FFE9CC', size: 0.9, intensity: 2.0, halo: 0.8, core: 1.3, minAngle: 0.0045, fogAmount: 0.25, time: fxTime });
      glows.object.name = 'lamps'; scene.add(glows.object);
    }
    // the cave pearls in their dried pool: some four hundred, the size of a fist
    {
      const r = R.pearls, list = [];
      for (let i = 0; i < 260; i++) {
        const ang = r() * TAU, d = Math.sqrt(r()) * (PEARL.r - 0.7), s = r.range(0.045, 0.07);
        W2(PEARL.a + Math.cos(ang) * d, PEARL.l + Math.sin(ang) * d, wtmp);
        list.push([wtmp[0], groundAt(wtmp[0], wtmp[1]) + s * 0.8, wtmp[1], s, s, s, 0, 0, 0]);
      }
      const og = new THREE.OctahedronGeometry(1, 0), n = og.attributes.position.count, aA = new Float32Array(n * 4), aC = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { aA.set([1, 0, 2.0, 1], i * 4); aC.set([1.5, 1.45, 1.3], i * 3); }
      og.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); og.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
      og.setAttribute('normal', og.attributes.position.clone());
      instanced(og, matCalc, list, 'pearls');
    }
    await ctx.yield();
    // (no drop falls through the cave's air: the drips show as rings on the pools, in the floor's own shader)

    // ---------------- THE CLOUD: banks and streamers of white cloud that ride low over the forest's roof in the dome and pour
    // slowly over the threshold into the mouth (soft sprites, lit by the place they are in)
    const PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    const driftDir = CU.uDrift.value;
    {
      // By rule the whole of each head, all along its lap, keeps 8 m from the line in space: under it and beside it.
      const r = R.cloud, list = [];
      const puff = (a, l, y, size, speed, span, op, rise = 0, asp = 0.5) => {
        W2(a, l, wtmp);
        const reach = 0.5 * size * Math.hypot(1, asp) + 1, ph = r();
        for (let t = -0.5; t <= 0.501; t += 0.125) if (nearLine(wtmp[0] + driftDir.x * span * t, y + rise * (t + 0.5), wtmp[1] + driftDir.y * span * t).d < 8 + reach) return;
        list.push([wtmp[0], y, wtmp[1], size, speed, span, ph, op, rise, asp]);
      };
      const opK = cloudKind === 'veil' ? 0.7 : 1;
      // THE BANKS: nine (twelve on a torn visit) long low banks of cloud over the forest between a 470 and a 640, each a row
      // of ten soft heads 26 to 44 m across that lies across the cave's wind, its middle 24 to 32 m over the ground
      // there (over the crowns), drifting 30 to 60 m and back into being; clear air between one bank and the next
      const nBank = cloudKind === 'rags' ? 12 : 9;
      for (let b = 0; b < nBank; b++) {
        const a0 = 470 + 170 * (b + r.range(0.1, 0.9)) / nBank, wl = wallsAt(a0), l0 = r.range(wl.left + 40, wl.right - 40), lie = r.range(-0.5, 0.5), up = r.range(24, 32), sp = r.range(0.9, 1.7), span = r.range(30, 60);
        for (let i = 0; i < 10; i++) {
          const t = (i - 4.5) * 9 + r.range(-3, 3), a = a0 + t * Math.sin(lie) + r.range(-5, 5), l = l0 + t * Math.cos(lie), size = r.range(26, 44) * (1 - 0.35 * Math.abs(i - 4.5) / 4.5);
          W2(a, l, wtmp); puff(a, l, Math.max(groundAt(wtmp[0], wtmp[1]) + up, 44) + r.range(-2, 2), size, sp, span, 0.72 * opK * r.range(0.7, 1), 0, r.range(0.34, 0.46));
        }
        await ctx.yield();
      }
      for (let i = 0; i < 40; i++) {                                     // streamers that lift off the banks: thin plumes that rise 4 to 9 m as they go and are gone
        const span = r.range(30, 60), a = r.range(476, 620), wl = wallsAt(a), l = r.range(wl.left + 30, wl.right - 30), size = r.range(8, 15);
        W2(a, l, wtmp); puff(a, l, Math.max(groundAt(wtmp[0], wtmp[1]) + 28, 46) + r.range(0, 5), size, r.range(1.6, 2.8), span, 0.3 * opK * r.range(0.6, 1), r.range(4, 9), r.range(0.7, 1.2));
      }
      await ctx.yield();
      // THE CLOUD IN THE MOUTH: cloud pours slowly over the threshold into the cave: heads that go the other way (against
      // the cave's wind near the floor), sinking as they go, from a 478 back to a 420, low on the threshold's rock and
      // on the last pools; the day stands behind them
      for (let i = 0; i < 70; i++) {
        const a = r.range(424, 486), wl = wallsAt(a), l = r.range(wl.left + 14, wl.right - 12), size = r.range(12, 24);
        W2(a, l, wtmp); puff(a, l, groundAt(wtmp[0], wtmp[1]) + r.range(3, 7) + 0.3 * size * 0.45, size, -r.range(0.7, 1.4), r.range(24, 40), 0.42 * opK * r.range(0.6, 1), r.range(2, 5), 0.45);
        if (i % 35 === 34) await ctx.yield();
      }
      // (low wisps that lie on the lake and on the river's level reaches: none over 3 m, none within reach of the line)
      for (let i = 0; i < 40; i++) {
        const a = r.range(120, 400), onLake = a > LAKE.a0 && a < LAKE.a1, l = onLake ? LAKE.l + r.range(-LAKE.half, LAKE.half) : riverL(a) + r.range(-8, 8), size = r.range(8, 14);
        W2(a, l, wtmp); puff(a, l, (onLake ? groundAt(wtmp[0], wtmp[1]) : riverY(a)) + 1.2, size, r.range(0.5, 1.1), r.range(20, 40), 0.14 * r.range(0.5, 1), 0, 0.2);
      }
      // (the cave's fall: mist at its foot on the lake, and thin veils that sink down its face)
      { toAxis(CF.x, CF.z, axT); const fa = axT.a, fl = axT.l;
        for (let i = 0; i < 12; i++) puff(fa + r.range(-5, 5), fl + r.range(-9, 1), CF.y + r.range(0.8, 4), r.range(6, 11), r.range(0.5, 1.0), r.range(5, 9), 0.5 * r.range(0.6, 1), r.range(3, 8), 0.8);
        for (let i = 0; i < 7; i++) puff(fa + r.range(-2, 2), fl + r.range(-2, -0.3), CF.y + r.range(6, 34), r.range(4.5, 7.5), r.range(0.4, 0.8), r.range(2, 4), 0.3 * r.range(0.6, 1), -r.range(4, 8), 1.9); }
      // (the river's cascade beside the steep stairs: spray lifts off each chute)
      for (let i = 0; i < 30; i++) {
        const a = r.range(338, 444), l = riverL(a) + r.range(-0.6, 0.6) * riverHalf(a);
        if (riverY(a + 1.5) - riverY(a - 1.5) < 0.5) continue;
        puff(a, l, riverY(a) + r.range(0.8, 2.2), r.range(4.5, 8), r.range(0.5, 1.0), r.range(4, 8), 0.3 * r.range(0.6, 1), r.range(1.5, 4), 0.7);
      }
      // (and THE BANK OF CLOUD IN THE MOUTH: sixteen broad heads that stand in the mouth itself, low on the threshold's
      // far slope with the dome's day on them: from the lake on they are the bright thing at the passage's end)
      for (let i = 0; i < 16; i++) {
        const a = r.range(456, 492), wl = wallsAt(a), l = r.range(wl.left + 20, Math.min(wl.right - 16, 40)), size = r.range(22, 34);
        W2(a, l, wtmp); puff(a, l, groundAt(wtmp[0], wtmp[1]) + r.range(7, 13), size, -r.range(0.5, 1.0), r.range(16, 28), 0.46 * opK * r.range(0.7, 1), r.range(1, 3), 0.5);
      }
      // (and the fall's own spray: white heads that lift off the water at its foot and rise 6 to 14 m as they go)
      { toAxis(JPOOL.fx, JPOOL.fz, axT); const fa = axT.a, fl = axT.l; for (let i = 0; i < 22; i++) puff(fa + r.range(-6, 6), fl + r.range(-2, 7), JPOOL.y + r.range(1, 6), r.range(7, 13), r.range(0.8, 1.6), r.range(7, 13), 0.5 * r.range(0.6, 1), r.range(6, 14), 0.9);
        // (veils of fine spray that sink down the fall's face beside the falling water: twelve tall soft heads)
        for (let i = 0; i < 12; i++) { const q = FALL.rows[Math.floor(r.range(0.15, 0.95) * FALL.rows.length)]; toAxis(q[0], q[2], axT); puff(axT.a + r.range(-8, 8), axT.l + r.range(0.5, 3), q[1], r.range(8, 13), r.range(0.4, 0.8), r.range(3, 6), 0.26 * r.range(0.6, 1), -r.range(5, 10), 1.7); }
        // (and the slender fall's own: spray at its foot, veils down its face)
        const F2 = STAIR.fall; toAxis(F2.x, F2.z, axT); const fa2 = axT.a, fl2 = axT.l;
        for (let i = 0; i < 9; i++) puff(fa2 + r.range(-2.5, 2.5), fl2 + r.range(-1, 3), F2.y + r.range(0.5, 3), r.range(4, 7), r.range(0.6, 1.2), r.range(4, 8), 0.45 * r.range(0.6, 1), r.range(3, 8), 0.9);
        for (let i = 0; i < 6; i++) puff(fa2 + r.range(-2, 2), fl2 + r.range(0.3, 1.5), F2.y + r.range(6, 28), r.range(4, 6.5), r.range(0.4, 0.8), r.range(2, 4), 0.24 * r.range(0.6, 1), -r.range(4, 8), 1.8); }
      const n = list.length, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4), iR = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { iP.set(list[i].slice(0, 4), i * 4); iQ.set(list[i].slice(4, 8), i * 4); iR.set(list[i].slice(8, 10), i * 2); }
      const pg = new THREE.InstancedBufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3)); pg.setIndex([0, 1, 2, 2, 1, 3]);
      pg.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); pg.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); pg.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 2)); pg.instanceCount = n;
      const pm = new THREE.Mesh(pg, new THREE.ShaderMaterial({ vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, ...PREMULT, uniforms: caveU() }));
      pm.frustumCulled = false; pm.name = 'wisps'; pm.renderOrder = 4; scene.add(pm);
    }
    await ctx.yield();
    // ---------------- THE PILLAR OF SUN: the lit air of the prism under the skylight (one stack of slices, one draw)
    {
      const NSL = 30, half = SKY.r + 14, pos = new Float32Array(NSL * 4 * 3), aS = new Float32Array(NSL * 4 * 2), idx = [];
      for (let k = 0; k < NSL; k++) {
        const off = lerp(-1, 1, k / (NSL - 1));
        for (let c = 0; c < 4; c++) { const v = k * 4 + c; pos[v * 3 + 1] = c >> 1; aS[v * 2] = (c & 1) * 2 - 1; aS[v * 2 + 1] = off; }
        idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 2)); g.setIndex(idx);
      const shaft = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: caveU({ uLen: { value: 236 }, uHalf: { value: half }, uShaftCol: { value: new THREE.Color(1.0, 0.93, 0.74) }, uGap: { value: (2 * half / (NSL - 1)) * 0.0013 } }) }));
      shaft.frustumCulled = false; shaft.name = 'shaft'; shaft.renderOrder = 5; scene.add(shaft);
    }
    await ctx.yield();

    // THE SIGHTS THE DOME KEEPS OPEN. By rule of place nothing of the forest and no fallen block stands in the air between
    // the line and (1) THE FALL AND ITS POOL, from 470 to 590 m flown: a cone from each place of the line (every 12 m) to
    // the fall's middle, widening to 9 m, and (to 556 m) one to the pool's middle, widening to 14 m; (2) the ring's
    // whole disc, from 596 m flown to the end: a cone from each place of the line (every 10 m) to the ring, widening to
    // 8.5 m at the ring; (3) THE BACK WALL ABOVE THE RING: a cone from each of the same places to the wall 34 m over the
    // ring, widening to 26 m there: the dome's wall from the alcove's brow up to the roof's edge (the great tree and
    // the blocks may stand in these last). offSight: metres from a place to the nearest edge of those cones.
    const ringXZ = W2(RING.a, RING.l), sights = [], fallAt = FALL.rows[Math.floor(FALL.rows.length * 0.5)];   // sights: [the eye's place x, y, z, the way to the far end x, y, z, 1 / its length squared, the cone's radius at the far end, 1 for a sight to the wall]
    const addSight = (s, tx, ty, tz, rad, wall) => { path.posAtDist(s, pS); const dx = tx - pS.x, dy = ty - pS.y, dz = tz - pS.z; sights.push([pS.x, pS.y, pS.z, dx, dy, dz, 1 / (dx * dx + dy * dy + dz * dz), rad, wall,
      Math.min(pS.x, tx), Math.min(pS.y, ty), Math.min(pS.z, tz), Math.max(pS.x, tx), Math.max(pS.y, ty), Math.max(pS.z, tz)]); };   // (and the box its axis lies in)
    for (let s = 470; s < 590; s += 12) { addSight(s, fallAt[0], fallAt[1], fallAt[2], 9, 0); if (s < 556) addSight(s, JPOOL.x, JPOOL.y, JPOOL.z, 14, 0); }
    for (let s = 596; s < Lp - 10; s += 10) { addSight(s, ringXZ[0], RING.y, ringXZ[1], 8.5, 0); addSight(s, ringXZ[0], RING.y + 34, ringXZ[1], 26, 1); }
    // (4) THE SLENDER FALL beside the ring, from 620 m flown to 30 m short of the end: two cones from each place of the line
    // (every 12 m) to a quarter and to three quarters of its drop, each widening to 8 m there
    { const F2 = STAIR.fall; for (let s = 620; s < Lp - 30; s += 12) { addSight(s, F2.x, F2.y + 8, F2.z, 8, 0); addSight(s, F2.x, F2.y + 23, F2.z, 8, 0); } }
    // (all the cones lie within one ball: a place 60 m and more outside it is 60 m and more from every cone)
    const sightC = [0, 0, 0];
    for (const p of sights) { sightC[0] += (p[0] + 0.5 * p[3]) / sights.length; sightC[1] += (p[1] + 0.5 * p[4]) / sights.length; sightC[2] += (p[2] + 0.5 * p[5]) / sights.length; }
    let sightR = 0;
    for (const p of sights) sightR = Math.max(sightR, Math.hypot(p[0] - sightC[0], p[1] - sightC[1], p[2] - sightC[2]), Math.hypot(p[0] + p[3] - sightC[0], p[1] + p[4] - sightC[1], p[2] + p[5] - sightC[2]) + p[7]);
    const offSight = (x, y, z, noWall = false) => {
      const cx = x - sightC[0], cy = y - sightC[1], cz = z - sightC[2], lim = sightR + 60;
      if (cx * cx + cy * cy + cz * cz > lim * lim) return 60;
      // (30 m and more is far: no rule asks for more; a cone whose axis' box lies further off than the nearest found so far is not looked at)
      let best = 30;
      for (const p of sights) {
        if (noWall && p[8]) continue;
        const bx = x < p[9] ? p[9] - x : x > p[12] ? x - p[12] : 0, by = y < p[10] ? p[10] - y : y > p[13] ? y - p[13] : 0, bz = z < p[11] ? p[11] - z : z > p[14] ? z - p[14] : 0, far = best + p[7];
        if (bx * bx + by * by + bz * bz >= far * far) continue;
        const ax = x - p[0], ay = y - p[1], az = z - p[2], t = clamp((ax * p[3] + ay * p[4] + az * p[5]) * p[6], 0, 1);
        const ex = ax - p[3] * t, ey = ay - p[4] * t, ez = az - p[5] * t, d = Math.sqrt(ex * ex + ey * ey + ez * ez) - p[7] * t;
        if (d < best) best = d;
      }
      return best;
    };

    // ---------------- THE DOME'S ROCK: fallen blocks of bedded stone (house-sized at the mound's foot, smaller up the bank) and the
    // phytokarst: knife-edged spikes round the mound's foot on the passage side that all lean toward the light
    // true-triangle rule for things beside the line: every sampled vertex of the placed geometry keeps `keep` metres from the line
    const vtx = new V3(), blockTops = [];                              // blockTops: the top of each fallen block of the dome [x, y, z, width] (ferns and orchids grow there)
    function clearOfLine(geo, mat4, keep, stride = 3) {
      const p = geo.attributes.position, n = p.count;
      for (let i = 0; i < n; i += stride) { vtx.fromBufferAttribute(p, i).applyMatrix4(mat4); if (nearLine(vtx.x, vtx.y, vtx.z).d < keep) return false; }
      return true;
    }
    const compose = (q) => { E3.set(q[7] || 0, q[6] || 0, q[8] || 0, 'YXZ'); Q4.setFromEuler(E3); return M4.compose(P3.set(q[0], q[1], q[2]), Q4, S3.set(q[3], q[4], q[5])); };
    {
      // a fallen block: bedded limestone, a pile of two to four slabs one on the other, each a box with sharp arrises, set
      // in a little from the one below on its own sides so that ledges show; the beds dip all one way. Every face is a
      // flat facet. Its underside is left out (it lies in the ground); moss on the tops only. beds: how many slabs
      const blockGeo = (seed, beds) => {
        const P = [], Nn = [], A = [], idx = [], fig = (k) => 0.5 + 0.5 * Math.sin(seed * 12.9898 + k * 78.233);      // (a fixed figure for each side of each bed)
        const dipX = 0.16 * Math.sin(seed * 2.7), dipZ = 0.12 * Math.cos(seed * 1.9), nt = Math.hypot(dipX, 1, dipZ);
        const quad = (pts, nx, ny, nzz, moss) => {
          const v0 = P.length / 3;
          for (const p of pts) { P.push(p[0], p[1], p[2]); Nn.push(nx, ny, nzz); A.push(0.55 + 0.45 * smoothstep(0, 0.7, p[1]), moss, 0.75, -1); }
          const ux = pts[1][0] - pts[0][0], uy = pts[1][1] - pts[0][1], uz = pts[1][2] - pts[0][2], wx = pts[3][0] - pts[0][0], wy = pts[3][1] - pts[0][1], wz = pts[3][2] - pts[0][2];
          const out = (uy * wz - uz * wy) * nx + (uz * wx - ux * wz) * ny + (ux * wy - uy * wx) * nzz;
          if (out > 0) idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); else idx.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2);       // (wound so that every face looks outward)
        };
        let y0 = 0;
        for (let b = 0; b < beds; b++) {
          const y1 = b === beds - 1 ? 1 : y0 + (1 - y0) * (0.34 + 0.3 * fig(b * 7 + 1)), k = b ? 0.26 : 0.08;
          const x0 = -0.5 + k * fig(b * 7 + 2), x1 = 0.5 - k * fig(b * 7 + 3), z0 = -0.5 + k * fig(b * 7 + 4), z1 = 0.5 - k * fig(b * 7 + 5);
          const c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], yt = (q, y) => y + (y > 0 ? dipX * q[0] + dipZ * q[1] : 0);
          for (let s = 0; s < 4; s++) {
            const p = c[s], q = c[(s + 1) % 4], dx = q[0] - p[0], dz = q[1] - p[1], dl = Math.hypot(dx, dz) || 1;
            quad([[p[0], yt(p, y0), p[1]], [q[0], yt(q, y0), q[1]], [q[0], yt(q, y1), q[1]], [p[0], yt(p, y1), p[1]]], dz / dl, 0, -dx / dl, 0.03);
          }
          quad([[c[0][0], yt(c[0], y1), c[0][1]], [c[1][0], yt(c[1], y1), c[1][1]], [c[2][0], yt(c[2], y1), c[2][1]], [c[3][0], yt(c[3], y1), c[3][1]]], -dipX / nt, 1 / nt, -dipZ / nt, 0.9);
          y0 = y1;
        }
        const g = new THREE.BufferGeometry(), n = P.length / 3;
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
        g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(A), 4)); g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
        g.setIndex(idx); g.computeBoundingSphere();
        return g;
      };
      // three kinds: stones (two beds), blocks (three), and the blocks beside the line (four)
      const geos = [blockGeo(0.3, 2), blockGeo(1.7, 2), blockGeo(3.1, 3), blockGeo(4.4, 3), blockGeo(5.3, 4), blockGeo(6.9, 4)], lists = geos.map(() => []), r = R.blocks;
      // a boulder: a rounded, lumpy stone, flatter below than above, mossed on what looks up (two small forms and a finer great one)
      const boulderGeo = (seed, detail) => {
        const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, n = p.count, nr = new Float32Array(n * 3), aA = new Float32Array(n * 4), aC = new Float32Array(n * 3).fill(1);
        for (let i = 0; i < n; i++) {
          vtx.fromBufferAttribute(p, i).normalize();
          const d = 1 + 0.3 * nz.n3(vtx.x * 1.3 + seed * 7, vtx.y * 1.3, vtx.z * 1.3 - seed * 3) + 0.12 * nz.n3(vtx.x * 3.1 - seed, vtx.y * 3.1 + seed * 5, vtx.z * 3.1);
          p.setXYZ(i, vtx.x * d, (vtx.y > 0 ? 0.8 : 0.5) * vtx.y * d, vtx.z * d);
          const ny = vtx.y * 1.3, nl = Math.hypot(vtx.x, ny, vtx.z) || 1; nr.set([vtx.x / nl, ny / nl, vtx.z / nl], i * 3);
          aA.set([0.55 + 0.45 * smoothstep(-0.4, 0.5, vtx.y), 0.9 * smoothstep(-0.2, 0.5, vtx.y), 0.9, -1], i * 4);
        }
        g.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
        g.deleteAttribute('uv'); g.computeBoundingSphere();
        return g;
      };
      const bGeos = [boulderGeo(0.7, 1), boulderGeo(2.3, 1), boulderGeo(4.1, 2), boulderGeo(5.5, 0)], bLists = [[], [], [], []];
      // (a boulder at a place, half sunk: by rule 5.4 m and more of clear air on its true corners, or it is not there;
      // one under a stride across is the plainest form)
      const tryBoulder = (x, z, size, keep, sunk, top = true, base = null) => {
        const bv = size < 1.15 ? 3 : r.int(0, 1), sx = size * r.range(0.8, 1.25), sy = size * r.range(0.6, 0.95), sz = size * r.range(0.8, 1.25);
        const q = [x, (base === null ? groundAt(x, z) : base) - sy * sunk, z, sx, sy, sz, r() * TAU, r.range(-0.15, 0.15), r.range(-0.15, 0.15)];
        if (offSight(x, q[1] + sy, z, true) < 0.9 * Math.max(sx, sz)) return false;
        if (nearLine(x, q[1] + 0.3 * sy, z).d < keep + 1.5 * Math.max(sx, sy, sz) && !clearOfLine(bGeos[bv], compose(q), keep, 1)) return false;
        bLists[bv].push(q);
        if (top && size > 0.9) blockTops.push([x, q[1] + sy * 0.72, z, Math.min(sx, sz)]);
        return true;
      };
      const tryBlock = (a, l, size, sink, kind, keep = 6.5) => {
        W2(a, l, wtmp);
        // (from the fall's pool on no bedded block lies within 60 m of the line: there rock shows only as rounded, mossed boulders half sunk in the ferns)
        // (and over the threshold, from 425 m flown to the pool, none within 36 m of it: there too the fallen rock near the
        // line is rounded boulders, the small ones under the line sunk to a third and more)
        { const qb = nearLineXZ(wtmp[0], wtmp[1]), byMouth = qb.s >= 425 && qb.s < 548 && qb.dh < 36;
          if ((qb.s >= 548 && qb.dh < 60) || byMouth) { if ((kind || byMouth) && !inPool(wtmp[0], wtmp[1], 0.6 * size)) tryBoulder(wtmp[0], wtmp[1], size * (kind ? 0.48 : 0.9), keep, kind ? r.range(0.05, 0.3) : r.range(0.3, 0.5)); return; } }
        const v = kind * 2 + r.int(0, 1), flat = kind === 0 ? 0.42 : 1, sx = size * r.range(0.8, 1.5) / flat, sy = size * r.range(0.55, 1.0) * flat, sz = size * r.range(0.8, 1.4) / flat;   // (the stones under the line are flat slabs: outcrops of the beds)
        const q = [wtmp[0], groundAt(wtmp[0], wtmp[1]) - sy * sink, wtmp[1], sx, sy, sz, r() * TAU, r.range(-0.12, 0.12), r.range(-0.12, 0.12)];
        if (inPool(q[0], q[2], 0.8 * Math.max(sx, sz))) return;          // (none in the pool or in the staircase's water)
        if (offSight(q[0], q[1] + sy, q[2], true) < 0.75 * Math.max(sx, sz)) return;   // (and none in the sights to the fall, the pool or the ring)
        // by rule on the true corners: 6.5 m of clear air (5.4 m for the stones straight under the line). (A block whose
        // whole ball is further off than that needs no corner looked at)
        if (nearLine(q[0], q[1] + 0.5 * sy, q[2]).d < keep + 1.35 * Math.max(sx, sy, sz) && !clearOfLine(geos[v], compose(q), keep, 1)) return;
        lists[v].push(q);
        if (size > 1.2) blockTops.push([q[0], q[1] + sy * 0.97, q[2], Math.min(sx, sz)]);
      };
      // the fall's lip: four great rounded masses of wet stone that stand out of the wall under the water's head (the water
      // falls just clear of their bellies); and one under the slender fall's head
      { const top = FALL.rows[0], yaw = Math.atan2(FALL.face[0], FALL.face[1]), ax = -FALL.face[1], az = FALL.face[0];
        for (const [off, back, down, sx, sy, sz] of [[0, 9.2, 4.3, 13, 5.2, 8.5], [-11, 7.8, 5.2, 8, 4.6, 7], [10, 8.4, 5.6, 9, 5, 7.5], [3, 14, 1.5, 12, 6, 7]])
          bLists[2].push([top[0] - FALL.face[0] * back + ax * off, top[1] - down, top[2] - FALL.face[1] * back + az * off, sx, sy, sz, yaw, 0, 0]);
        const F2 = STAIR.fall; bLists[2].push([F2.rows[0][0] - F2.in[0] * 3.4, F2.top - 2.3, F2.rows[0][2] - F2.in[1] * 3.4, 4.2, 3, 3.2, Math.atan2(F2.in[0], F2.in[1]), 0, 0]); }
      // boulders round the pool's shore (thirty tried, by rule 5.4 m and more from the line), and small islands of mossed
      // stone in the staircase's pools (forty tried, each standing in the water of its own pool)
      for (let i = 0; i < 30; i++) {
        const ang = TAU * (i + r.range(-0.3, 0.3)) / 30, R = poolR(JPOOL.x + Math.cos(ang), JPOOL.z + Math.sin(ang)) * r.range(0.99, 1.1);
        tryBoulder(JPOOL.x + Math.cos(ang) * R, JPOOL.z + Math.sin(ang) * R, r.range(0.8, 2.3), 5.4, r.range(0.15, 0.4), false);
      }
      await ctx.yield();
      for (let i = 0; i < 40; i++) {
        const s = r.range(STAIR.dams[0] + 4, STAIR.sTop + 10), wn = r.range(-0.85, 0.85), size = r.range(0.9, 2.0), q = atS(Math.min(s, Lp - 0.5), stairC(s) + wn * stairW(s, wn));
        stairPlace(q[0], q[2], nearLineXZ(q[0], q[2]));
        if (SP.on && SP.dE < -1) tryBoulder(q[0], q[2], size, 5.4, 0.2, true, stairLev(SP.se) + 0.1);
        if (i % 20 === 19) await ctx.yield();
      }
      // the dome's fallen rock: on the threshold's far slope and over the whole floor
      for (let i = 0; i < 60; i++) { const a = r.range(456, 520), wl = wallsAt(a), size = r.range(3, 9); tryBlock(a, r.range(wl.left + 3, wl.right - 3), size, r.range(0.2, 0.45), 1, 9); if (i % 30 === 29) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < 205; i++) { const a = r.range(470, 770), wl = wallsAt(a), size = r.range(2.5, 9); tryBlock(a, r.range(wl.left + 3, wl.right - 3), size, r.range(0.2, 0.45), 1); if (i % 60 === 59) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < 300; i++) {                                   // from the threshold to the ring: blocks close on both sides of the line
        const s = r.range(478, Lp), lat = r.sign() * r.range(6.5, 26), q = atS(s, lat); toAxis(q[0], q[2], axT); tryBlock(axT.a, axT.l, r.range(1.4, 5.5), r.range(0.2, 0.45), Math.abs(lat) < 15 ? 2 : 1);
        if (i % 50 === 49) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < 240; i++) {                                   // and under the line: flat mossy slabs, one to five strides across, sunk to their upper bed
        const s = r.range(478, Lp - 11), lat = r.range(-9, 9), q = atS(s, lat); toAxis(q[0], q[2], axT); tryBlock(axT.a, axT.l, r.range(0.5, 1.5), r.range(0.45, 0.62), 0, 5.4);
        if (i % 50 === 49) await ctx.yield();
      }
      for (let v = 0; v < geos.length; v++) instanced(geos[v], matBlock, lists[v], v < 2 ? 'stones' : 'blocks');
      for (let v = 0; v < bGeos.length; v++) instanced(bGeos[v], matBlock, bLists[v], 'boulders');
      await ctx.yield();
      // phytokarst: on the threshold's far slope and up the mound's foot on the passage side
      const kg = gridGeometry(5, 4, (i, j, o) => {
        const ang = TAU * i / 4, t = j / 3, w = (1 - t) * (1 - 0.3 * t);
        o.p[0] = Math.cos(ang) * 0.34 * w + 0.12 * Math.sin(t * 5); o.p[1] = t; o.p[2] = Math.sin(ang) * 0.09 * w;
        o.a[0] = 0.6 + 0.4 * t; o.a[1] = 0.55; o.a[2] = 0.9; o.c[0] = 0.55; o.c[1] = 0.58; o.c[2] = 0.6;
      });
      const rk = R.karst, kl = [], sk = W2(SKY.a, SKY.l);
      for (let i = 0; i < 1200 && kl.length < 120; i++) {
        const a = rk.range(458, 590), wl = wallsAt(a), l = rk.range(wl.left + 5, Math.min(wl.right - 5, 90)), hk = rk(), hr = rk(), w1 = rk(), w2 = rk(), yr = rk(), tl = rk(); W2(a, l, wtmp);
        if (i % 300 === 299) await ctx.yield();
        const h = lerp(1.2, 4.5, hk) * (0.7 + 0.6 * hr), gy = groundAt(wtmp[0], wtmp[1]) - 0.2;
        if (gy > 52 || inPool(wtmp[0], wtmp[1], 2)) continue;           // (on the low ground, not up the mound; none in the water)
        const yaw = -Math.atan2(sk[1] - wtmp[1], sk[0] - wtmp[0]) + Math.PI / 2 + (yr - 0.5) * 0.5;
        if (nearLine(wtmp[0], gy + h, wtmp[1]).d < 8) continue;
        kl.push([wtmp[0], gy, wtmp[1], h * lerp(0.8, 1.6, w1), h, h * lerp(0.8, 1.4, w2), yaw, lerp(0.3, 0.62, tl), 0]);   // every one leans toward the skylight
      }
      instanced(kg, matBlock, kl, 'phytokarst');
    }
    await ctx.yield();

    // ---------------- THE FOREST. The kit's plants and wind, lit by this cave's light: the sun only inside the shaft (in flecks under
    // the crowns), the open shade by the daylight of the place, and the cave's own air instead of the scene's fog
    const sunLight = new THREE.DirectionalLight(new THREE.Color().setRGB(1.0, 0.90, 0.66), 3.6);
    sunLight.position.copy(sunDir).multiplyScalar(200); scene.add(sunLight);
    const hemi = new THREE.HemisphereLight(new THREE.Color().setRGB(0.62, 0.78, 0.62), new THREE.Color().setRGB(0.16, 0.24, 0.10), 3.6);
    scene.add(hemi);
    const wind = flora.makeWind({ direction: [driftDir.x, driftDir.y], strength: 0.9, speed: 1.0, gustiness: 0.7 });
    const leafOpts = { wind, backlight: 1.0, backlightTint: '#d8ff7a', ambient: 1.5, leafAmbient: 1.5, sheen: 0.55, detail: 0.3 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMaterial = (under, map) => {
      const m = flora.windMaterial(map ? { ...leafOpts, map } : leafOpts), kit = m.onBeforeCompile, U = caveU({ uUnder: { value: under } });
      m.onBeforeCompile = (shader) => {
        kit(shader);
        Object.assign(shader.uniforms, U);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uUnder;\n' + GL_CAVE)
          .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;', /* glsl */`
            float cvS = shaftAt(vFloraWorld) * mix(1.0, fleckAt(vFloraWorld), uUnder), cvD = dayAt(vFloraWorld);
            // (the day comes from the skylight: what faces it is lit, what is turned from it lies in cool shade; and the pillar's
            // foot gives its warm light back from its own side)
            vec3 cvL = vec3(uSkyC.x, uSkyC.y - 30.0, uSkyC.z) - vFloraWorld; cvL = normalize((viewMatrix * vec4(cvL, 0.0)).xyz);
            float cvW = 0.5 + 0.5 * dot(normalize(normal), cvL);
            cvD *= 0.8 + 0.44 * smoothstep(0.22, 0.78, vn2((vFloraWorld.xz - uDrift * (uTime * 7.0)) * 0.05));     // (the gust that runs over the roof, on these leaves too)
            vec3 cvG = uGlowP.xyz - vFloraWorld; float cvR = max(length(cvG), 1e-3);
            float cvGn = 0.3 + 0.7 * max(dot(normalize(normal), normalize((viewMatrix * vec4(cvG, 0.0)).xyz)), 0.0);
            vec3 cvQ = uLampP[NL - 1].xyz - vFloraWorld; float cvQ2 = dot(cvQ, cvQ), cvQr = uLampP[NL - 1].w, cvQf = 0.0;      // (and the ring's own glow)
            if (cvQ2 < cvQr * cvQr) cvQf = (1.0 - smoothstep(cvQr * 0.5, cvQr, sqrt(cvQ2))) / (1.0 + cvQ2 * 0.06) * (0.35 + 0.65 * max(dot(normalize(normal), normalize((viewMatrix * vec4(cvQ, 0.0)).xyz)), 0.0));
            vec3 outgoingLight = reflectedLight.directDiffuse * cvS + reflectedLight.indirectDiffuse * (cvD * (0.3 + 1.25 * cvW * cvW) * (1.0 - 0.2 * uUnder))
              + diffuseColor.rgb * (uSunCol * (uGlowP.w * 2.2 * cvGn / (1.0 + cvR * cvR / 14400.0)) + uLampC[NL - 1] * cvQf)
              + diffuseColor.rgb * uBounce * (1.0 - smoothstep(0.0, 120.0, upPassage(vFloraWorld))) + totalEmissiveRadiance;`)
          .replace('#include <fog_fragment>', 'gl_FragColor.rgb = forestAir(gl_FragColor.rgb, vFloraWorld);');
      };
      m.customProgramCacheKey = () => 'cloud-in-the-cave-leaf';
      return m;
    };
    const matCrown = leafMaterial(0, null), matUnder = leafMaterial(0.9, matCrown.map);
    const tint = new THREE.Color();
    const plants = (geo, mat, list, name) => {                          // as instanced(), with each plant's own tint in q[9..11]
      const m = instanced(geo, mat, list, name);
      for (let i = 0; i < list.length; i++) { const q = list[i]; m.setColorAt(i, tint.setRGB(q[9] ?? 1, q[10] ?? 1, q[11] ?? 1)); }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      return m;
    };
    await ctx.yield();
    let greatAt = null;                                                 // the great tree's foot and height, once it stands
    // the forest's own forms. A crown: a lumpy cap of leaves, flat or round, its rim sagging a little (cut finer for those
    // that stand near the line). A bole: a tapering column, 1 high and 1 across at the foot, flaring into three buttresses.
    // A root or a bough: a round sweep through points [x, y, z, radius]
    const crownGeo = (seed, flat, sag, detail) => {
      const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, n = p.count, nr = new Float32Array(n * 3), aH = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        vtx.fromBufferAttribute(p, i).normalize();
        const d = 1 + 0.27 * nz.n3(vtx.x * 1.7 + seed * 5, vtx.y * 1.7, vtx.z * 1.7 - seed * 3) + 0.11 * nz.n3(vtx.x * 3.9 - seed, vtx.y * 3.9 + seed * 7, vtx.z * 3.9);
        const rr = vtx.x * vtx.x + vtx.z * vtx.z, up = vtx.y > 0 ? vtx.y : vtx.y * 0.45;       // (the underside is shallow)
        p.setXYZ(i, vtx.x * d, up * d * flat - sag * rr, vtx.z * d);
        const ny = (vtx.y > 0 ? vtx.y : vtx.y * 2.2) / flat, nl = Math.hypot(vtx.x, ny, vtx.z) || 1;
        nr.set([vtx.x / nl, ny / nl, vtx.z / nl], i * 3); aH[i] = vtx.y;
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 1)); g.deleteAttribute('uv'); g.computeBoundingSphere();
      return g;
    };
    const boleGeo = (butt, sides) => gridGeometry(sides + 1, 5, (i, j, o) => {
      const ang = TAU * i / sides, t = [0, 0.045, 0.14, 0.5, 1][j];
      const r = (1 - 0.42 * t) * (1 + butt * Math.exp(-t * 20) * (0.5 + 0.5 * Math.cos(ang * 3 + 0.8))) * (1 + 0.06 * Math.sin(ang * 2 + t * 9));
      o.p[0] = Math.cos(ang) * r; o.p[1] = t; o.p[2] = Math.sin(ang) * r; o.a[0] = i / sides; o.a[1] = t;
    });
    const tubeGeo = (pts, sides, v0, v1) => gridGeometry(sides + 1, pts.length, (i, j, o) => {
      const p = pts[j], a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let ux = ty * 0.92 - tz * 0.11, uy = tz * 0.37 - tx * 0.92, uz = tx * 0.11 - ty * 0.37; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;   // (across the sweep: from a direction no root runs along)
      const wx = ty * uz - tz * uy, wy = tz * ux - tx * uz, wz = tx * uy - ty * ux, ang = TAU * i / sides, c = Math.cos(ang) * p[3], s = Math.sin(ang) * p[3];
      o.p[0] = p[0] + ux * c + wx * s; o.p[1] = p[1] + uy * c + wy * s; o.p[2] = p[2] + uz * c + wz * s;
      o.a[0] = i / sides; o.a[1] = lerp(v0, v1, j / (pts.length - 1));
    });
    const bloomHex = R.bloom.chance(0.5) ? '#ff86b4' : '#ff7350', bloomCol = lin(bloomHex);   // what flowers in this forest's roof and bushes flowers pink, or coral
    const crownMat = (under, a, b, bloom) => new THREE.ShaderMaterial({ vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG,
      uniforms: caveU({ uUnder: { value: under }, uLeafA: { value: new THREE.Color(a) }, uLeafB: { value: new THREE.Color(b) }, uBloom: { value: new THREE.Vector4(bloomCol.r, bloomCol.g, bloomCol.b, bloom) } }) });
    const trunkMat = (under) => new THREE.ShaderMaterial({ vertexShader: TRUNK_VERT, fragmentShader: TRUNK_FRAG, side: THREE.DoubleSide, uniforms: caveU({ uUnder: { value: under } }) });
    const matBole = trunkMat(0.8), matFigWood = trunkMat(0.35);
    const PAL = { leaf: '#3a7a2c', leafLight: '#9ccb4a', leafDark: '#1c4a22', bark: '#4b4839', barkDark: '#2a2822' };
    const PAL2 = { leaf: '#4c8a30', leafLight: '#b0d65a', leafDark: '#255226', bark: '#5c5747', barkDark: '#34312a' };
    const crownAt = [];                                                 // every crown that stands: [x, top, z, radius, height over the ground] (the lianas hang from them)
    const figAt = [];                                                   // the two figs: [x, ground, z, crown radius, height]
    path.tangentAtDist(Lp - 0.5, tS); const endH = Math.hypot(tS.x, tS.z) || 1, endX = tS.x / endH, endZ = tS.z / endH;   // the line's last heading, in plan
    await ctx.yield();

    // THE TWO FIGS that stand either side of the ring on the shelf: stranglers, each a hollow cage of roots that rise winding
    // from buttress feet to a fork, with boughs above and roots let down from them. They differ: the left one is the greater,
    // broad at the foot, and sends one long bough arching over behind the ring; the right one is slighter, leans to the ring,
    // and stands in a curtain of its own hanging roots that have reached the ground and thickened into props. Their leaves
    // are the kit's (in red leaf on some visits). By rule each stands where every vertex of its wood and every second vertex of its leaves keeps 6.5 m from the line.
    {
      const red = forestKind === 'red', fR = R.spare1;
      const figPal = red ? { leaf: '#b8401c', leafLight: '#ff9a3d', leafDark: '#5e1c10', bark: '#c4bca6', barkDark: '#746c5c' } : { ...PAL, bark: '#c4bca6', barkDark: '#746c5c' };
      // local frame: +X runs from the fig toward the ring's own axis (toward the other fig), +Z back along the line's last heading
      const figGeo = (r, o) => {
        const parts = [], lx0 = o.lean * o.h;
        parts.push(tubeGeo([[0, -1.5, 0, o.R * 0.62], [lx0 * 0.5, o.h * 0.5, 0, o.R * 0.52], [lx0, o.h + 0.5, 0, o.R * 0.5]], 7, 0, 0.5));      // the dark heart of the cage
        for (let k = 0; k < o.roots; k++) {
          const a0 = TAU * (k + r.range(-0.25, 0.25)) / o.roots, tw = r.range(-0.9, 0.9), foot = r.range(2.0, 3.8) * o.R / 1.6, w0 = r.range(0.3, 0.5) * o.R / 1.6, pts = [];
          for (let j = 0; j <= 9; j++) {
            const t = j / 9, y = -1.6 + 2.0 * smoothstep(0, 0.14, t) + (o.h - 0.4) * Math.pow(t, 1.4), ang = a0 + tw * t + 0.35 * Math.sin(t * 7 + k), rad = o.R * (1 - 0.42 * t) + foot * Math.pow(1 - t, 4);
            pts.push([Math.cos(ang) * rad + o.lean * Math.max(y, 0), y, Math.sin(ang) * rad, w0 * (1 + 1.0 * Math.pow(1 - t, 3)) * (0.82 + 0.18 * Math.sin(t * 11 + k * 2))]);
          }
          parts.push(tubeGeo(pts, 6, 0, 0.5));
        }
        const boughs = [];                                               // each bough: the place of its middle line at t (0 at the fork .. 1 at its tip)
        for (let k = 0; k < o.boughs; k++) {                             // the boughs: out and up from the fork
          const a0 = o.fan[0] + (o.fan[1] - o.fan[0]) * (k + r.range(0.2, 0.8)) / o.boughs, len = r.range(6.5, 10) * o.reach, rise = r.range(5, 8.5) * o.reach, pts = [];
          const at = (t) => [lx0 + Math.cos(a0) * len * t + 0.5 * Math.sin(t * 5 + k), o.h - 0.8 + rise * (1 - (1 - t) * (1 - t)), Math.sin(a0) * len * t + 0.5 * Math.cos(t * 4 + k)];
          for (let j = 0; j <= 6; j++) { const t = j / 6, p = at(t); p.push(lerp(0.6, 0.15, t) * o.R / 1.6); pts.push(p); }
          parts.push(tubeGeo(pts, 6, 0.5, 1)); boughs.push(at);
        }
        if (o.arch > 0) {                                                // the long bough that arches over behind the ring, its highest place over the ring's own axis
          const L = o.arch * 1.74, A = o.archTop - o.h, pts = [];
          const at = (t) => { const q = 2 * t / 1.15 - 1; return [lx0 + L * t, o.h + A * (1 - q * q) - 0.6 * (1 - t), 0.6 * Math.sin(t * 6)]; };
          for (let j = 0; j <= 10; j++) { const t = j / 10, p = at(t); p.push(lerp(0.62, 0.17, Math.pow(t, 0.8))); pts.push(p); }
          parts.push(tubeGeo(pts, 6, 0.5, 1)); boughs.push(at);
        }
        for (let k = 0; k < o.props; k++) {                              // props: roots let down from the boughs that stand in the ground
          const p0 = boughs[k % o.boughs](r.range(0.35, 0.92)), w = r.range(0.13, 0.28), pts = [];
          for (let j = 0; j <= 5; j++) { const t = j / 5; pts.push([p0[0] + 0.25 * Math.sin(t * 5 + k * 1.3) * Math.min(1, t * 4), lerp(p0[1], -2.5, t), p0[2] + 0.25 * Math.cos(t * 4 + k) * Math.min(1, t * 4) - 0.25 * Math.min(1, t * 4), w * (1 + 0.8 * t * t * t)]); }
          parts.push(tubeGeo(pts, 5, 0.3, 0.6));
        }
        return mergeGeo(parts);
      };
      const specs = [
        { side: -1, h: 11.5, R: 3.0, roots: 8, boughs: 4, fan: [1.2, 5.1], reach: 1.0, lean: 0, arch: 1, archTop: 22.5, props: 4, leafH: 23, leafUp: 4.5, full: 1.35 },
        { side: 1, h: 9.5, R: 2.1, roots: 6, boughs: 3, fan: [1.7, 4.6], reach: 0.8, lean: 0.14, arch: 0, archTop: 0, props: 9, leafH: 19, leafUp: 3.5, full: 1.1 },
      ];
      for (const sp of specs) {
        const leaves = flora.oakGeometry({ rng: fR.fork('fig' + sp.side), height: sp.leafH, detail: 2, flex: 0.35, fullness: sp.full, ...figPal });
        let done = false;
        for (let lat = 12, n = 0; lat < 22 && n < 6 && !done; lat += 1.5, n++) {      // (a place is tried 1.5 m further out, six times at most, until all of it is clear)
          const wood = figGeo(fR.fork('wood' + sp.side + n), { ...sp, arch: sp.arch * lat });
          const q = atS(Lp - 0.5, sp.side * lat), x = q[0] + endX * 2.5, z = q[2] + endZ * 2.5, gy = groundAt(x, z) - 0.3;
          // (turned so that the fig's +X looks at the ring's axis: a turn about Y by th carries +X to (cos th, 0, -sin th))
          const dx = endZ * sp.side, dz = -endX * sp.side, yaw = Math.atan2(-dz, dx);
          M4.makeRotationY(yaw).setPosition(x, gy, z);
          const mw = M4.clone(), ml = compose([x, gy + sp.leafUp, z, 1, 1, 1, yaw + 1.3, 0, 0]).clone();
          await ctx.yield();
          if (clearOfLine(wood, mw, 6.5, 1) && clearOfLine(leaves, ml, 6.5, 2)) {
            wood.applyMatrix4(mw);
            const m = new THREE.Mesh(wood, matFigWood); m.name = 'fig'; scene.add(m);
            plants(leaves, matCrown, [[x, gy + sp.leafUp, z, 1, 1, 1, yaw + 1.3, 0, 0, 1, 1, 1]], 'fig-leaves');
            figAt.push([x, gy, z, leaves.userData.radius, sp.leafUp + sp.leafH]); crownAt.push([x, gy + sp.leafUp + sp.leafH, z, leaves.userData.radius, sp.leafUp + sp.leafH]);
            done = true;
          } else wood.dispose();                                         // (a form that found no place is given back)
        }
        if (!done) leaves.dispose();
        await ctx.yield();
      }
    }
    await ctx.yield();
    // THE TREES BESIDE THE LINE: where the line comes down into the forest, rounds the pool and climbs the bank (from 505 m
    // flown, 11 to 46 m to either side) the trees are the kit's, leaf by leaf: broad crowns on pale boles, and every
    // third or so in flower, coral or pink. By rule the whole tree stands 7.5 m and more from the line and out of the
    // open sights (the fall and its pool, the ring, the wall over it), or it is a smaller tree.
    {
      const r = R.trees, gR = r.fork('forms'), forms = [], lists = [[], [], [], []];
      forms.push(flora.oakGeometry({ rng: gR.fork('a0'), height: 24, detail: 1, flex: 0.5, fullness: 1.15, ...PAL }));
      forms.push(flora.oakGeometry({ rng: gR.fork('a1'), height: 24, detail: 1, flex: 0.5, fullness: 1.3, ...PAL2 }));
      forms.push(flora.cherryGeometry({ rng: gR.fork('fl'), height: 15, detail: 1, flex: 0.5, leaf: '#ff6f52', bark: '#b9b29e' }));
      forms.push(flora.cherryGeometry({ rng: gR.fork('fp'), height: 15, detail: 1, flex: 0.5, leaf: '#ff86b4', bark: '#b9b29e' }));
      await ctx.yield();
      // THE GREAT TREE, beside the bank's staircase of pools: the kit's broad tree grown to 46 m (or 52, or 40),
      // its trunk 2 m and more through, in a sleeve of bark, standing on seven plank buttresses; the line passes under
      // its boughs. RULE OF PLACE: the first that finds a place of a fixed list of builds (46, 52, 40 m of natural
      // build; the same drawn up on the trunk by 1.2, then 1.4; if none of those stands, a second and then a third
      // tree of other boughs the same nine ways; last of all the first tree drawn up by 1.7 or 2.1), each tried at
      // the same places in a fixed order (3.2, 4.6, 2.2 m back from the pools' own edge and never nearer than 14 m to
      // the line; the right of the line, then the left; 626, 668, 654, 612, 640, 682 m flown), where every
      // vertex of its wood and leaves is 6.2 m and more from the line, none of it that stands within 5 m of the line
      // in plan is less than 12 m above it, and every third is out of the sights to the fall, the pool and the ring.
      {
        const sightClear = (geo, m4, stride) => {                         // every looked-at vertex of a placed form is out of those sights
          const p = geo.attributes.position;
          for (let i = 0; i < p.count; i += stride) { vtx.fromBufferAttribute(p, i).applyMatrix4(m4); if (offSight(vtx.x, vtx.y, vtx.z, true) < 0.5) return false; }
          return true;
        };
        const heroClear = (geo, m4, keep, stride) => {                    // clear of the line, and over it only 12 m and more above it
          const p = geo.attributes.position;
          for (let i = 0; i < p.count; i += stride) { vtx.fromBufferAttribute(p, i).applyMatrix4(m4); const q = nearLine(vtx.x, vtx.y, vtx.z); if (q.d < keep || (q.dh < 5 && vtx.y - q.y < 12)) return false; }
          return true;
        };
        let done = false, tried = 0;
        const NAT = [[1, 46], [1, 52], [1, 40], [1.2, 46], [1.2, 52], [1.2, 40], [1.4, 46], [1.4, 52], [1.4, 40]];
        for (const [form, BUILDS] of [['hero', NAT], ['hero2', NAT], ['hero3', NAT], ['hero', [[1.7, 46], [1.7, 52], [2.1, 46], [2.1, 52]]]]) {
        if (done) break;
        const hero = flora.oakGeometry({ rng: gR.fork(form), height: 40, detail: 2, flex: 0.4, fullness: 1.15, ...PAL });
        await ctx.yield();
        for (const [st, H0] of BUILDS) for (const off of [3.2, 4.6, 2.2]) for (const side of [1, -1]) for (const s of [626, 668, 654, 612, 640, 682]) {
          if (done) continue;
          // (its trunk stands `off` metres back from the staircase's own rim there, and never nearer the line than 14 m: its buttresses come down to the pool's edge)
          const lat = Math.max(14, stairW(s, side) + side * stairC(s) + off);
          const q = atS(s, side * lat), x = q[0], z = q[2], gy = groundAt(x, z) - 0.6, k = H0 / 40, H = H0 * st;      // (st: a tree drawn up taller on its trunk, tried only where none of natural build finds a place)
          path.posAtDist(s, pS); const yaw = Math.atan2(pS.x - x, pS.z - z);
          const row = [x, gy, z, k, k * st, k, yaw, 0, 0, 0.9, 0.95, 0.85], m4 = compose(row).clone();
          // (a quick and stricter look at every twenty-third vertex first, then at every seventh: most places that fail, fail at once)
          if (!heroClear(hero, m4, 7.4, 23) || !sightClear(hero, m4, 23) || !heroClear(hero, m4, 6.6, 7)) continue;
          if (tried++ % 2 === 0) await ctx.yield();
          if (!sightClear(hero, m4, 3) || !heroClear(hero, m4, 6.2, 1)) continue;
          done = true;
          plants(hero, matCrown, [row], 'great-tree');
          // (its sleeve of bark from the ground to 17 m up, and its plank buttresses: thin fins of wood from 6 to 10 m up
          // the trunk out to the ground 5 to 8.5 m from it; one that would come within 6.2 m of the line is not grown)
          const fins = [tubeGeo([[0, -2.5, 0, 1.75 * k], [0, 1.5, 0, 1.5 * k], [0, 6, 0, 1.36 * k], [0, 11, 0, 1.24 * k], [0, 17 * k, 0, 1.1 * k]], 14, 0, 0.5)];
          fins[0].applyMatrix4(M4.makeRotationY(yaw).setPosition(x, gy, z));
          for (let f = 0; f < 7; f++) {
            const ang = -Math.PI / 2 + TAU * (f + 0.35 * Math.sin(f * 2.7 + 1)) / 7, out = 5 + 3.5 * Math.abs(Math.sin(f * 1.9 + 0.4)), top = 6 + 4 * Math.abs(Math.sin(f * 3.1 + 2)), pts = [];
            for (let j = 0; j <= 6; j++) { const t = j / 6, rad = 0.12 + 0.5 * out * Math.pow(1 - t, 1.7); pts.push([1.25 * k + rad, lerp(-2.2, top, t), 0, rad]); }
            const g = tubeGeo(pts, 6, 0, 0.5); g.scale(1, 1, 0.13); g.rotateY(ang); g.applyMatrix4(M4.makeRotationY(yaw).setPosition(x, gy, z));
            if (clearOfLine(g, M4.identity(), 6.2, 1)) fins.push(g); else g.dispose();
          }
          { const m = new THREE.Mesh(mergeGeo(fins), matFigWood); m.name = 'great-tree-buttresses'; scene.add(m); }      // (pale bark in the open day beside the water: the trunk is lit)
          crownAt.push([x, gy + H, z, hero.userData.radius * k, H]);
          scene.userData.greatTree = { s, lat: side * lat, H, form }; greatAt = [x, gy, z, H];
        }
        if (!done) hero.dispose();
        }
      }
      await ctx.yield();
      const maxFlower = forestKind === 'flower' ? 26 : 22;                // (beside the staircase, from 585 m flown, three trees in four stand in flower)
      for (let i = 0, n = 0; i < 1000 && n < 37; i++) {
        const s = r.range(505, Lp + 24), side = r.sign(), lat = r.range(11, 46), hRoll = r(), yaw = r() * TAU, tr = r(), tg = r(), tw = r();
        const q = atS(Math.min(s, Lp - 0.5), side * lat), x = q[0] + (s > Lp ? endX * (s - Lp) : 0), z = q[2] + (s > Lp ? endZ * (s - Lp) : 0), gy = groundAt(x, z) - 0.5;
        if (i % 12 === 11) await ctx.yield();
        toAxis(x, z, axT); if (Math.hypot(axT.a - RING.a, axT.l - RING.l) < 22 || forestK(axT.a, axT.l) < 0.3 || nearLineXZ(x, z).dh < 10) continue;     // the shelf is kept for the ring and its two figs (and where the line curves, a place dealt beside one stretch of it may lie on another)
        let free = true;
        for (const c of crownAt) if (Math.hypot(c[0] - x, c[2] - z) < 7 + 0.3 * c[3]) free = false;
        if (!free || inPool(x, z, 3)) continue;
        const nF = lists[2].length + lists[3].length, v = tw > (s > 585 ? 0.25 : 0.58) && nF < maxFlower ? 2 + nF % 2 : tw < 0.3 ? 0 : 1, geo = forms[v];
        let h = (v > 1 ? lerp(11, 16, hRoll) : lerp(19, 29, hRoll)), placed = null;
        for (let t = 0; t < 3 && !placed; t++, h *= 0.66) {
          const sc = h / geo.userData.height, row = [x, gy, z, sc, sc, sc, yaw, 0, 0, 0.82 + 0.3 * tr, 0.86 + 0.26 * tg, 0.8 + 0.25 * tr], rad = geo.userData.radius * sc;
          if (offSight(x, gy + 0.68 * h, z) < rad + 0.5 || offSight(x, gy + 0.3 * h, z) < 1.5 || offSight(x, gy + 0.1 * h, z) < 1.5) continue;
          // (a tree whose whole ball is further off than that needs no leaf looked at)
          if (nearLine(x, gy + 0.55 * h, z).d > 7.5 + Math.max(rad, 0.55 * h) * 1.25 || (clearOfLine(geo, compose(row), 7.5, 16) && clearOfLine(geo, compose(row), 7.5, 2))) placed = row;      // (every sixteenth leaf first: a tree that fails, fails at once)
        }
        if (!placed) continue;
        lists[v].push(placed); n++; crownAt.push([x, gy + placed[3] * geo.userData.height, z, geo.userData.radius * placed[3], placed[3] * geo.userData.height]);
      }
      plants(forms[0], matCrown, lists[0], 'trees'); plants(forms[1], matCrown, lists[1], 'trees'); plants(forms[2], matCrown, lists[2], 'trees-in-flower'); plants(forms[3], matCrown, lists[3], 'trees-in-flower');
    }
    await ctx.yield();
    // THE FOREST'S ROOF, of this world's own crowns. Seen from above the jungle is closed: crown against crown in four greens
    // and three forms (broad umbrellas, rounder heads, and the flat crowns of the emergents, which stand 10 m and more above
    // the roof on tall pale boles), a crown in flower here and there, dark between them and no ground to be seen.
    // By rule of place a crown stands only where the whole of it (a ball 1.4 times its radius) keeps 26 m from the line (40 m
    // from 560 m flown on, where the line comes down among the trees and the near trees are the kit's) and is
    // out of the sight to the ring; where no other crown of its storey has its middle nearer than 0.56 of the two radii (0.8
    // from a tree of the kit's); not on a figure's clearing, the ring's shelf or a fig; and where its bole keeps 7 m from the
    // line and is out of the sight too.
    {
      const r = R.roof, GREENS = [[1, 1, 1], [0.7, 0.88, 0.8], [1.28, 1.14, 0.68], [0.86, 1.12, 0.98]], FLAT = [0.7, 0.95, 0.45];
      const cNear = [[], [], []], cFar = [[], [], []], cBloomNear = [], cBloomFar = [], cLow = [], boles = [], bolesTall = [];
      // storey: 0 the thickets under the roof, 1 the roof, 2 the emergents (a crown keeps its distance from those of its own storey)
      const addCrown = (x, z, gy, rad, H, form, tintK, jit, bloom, storey) => {
        // (BY THE THRESHOLD every crown is a round head: a crown whose nearest metre of the line is short of 505 m takes
        // the round form whatever was dealt, and one that stands higher than the line there keeps 46 m from it, so that
        // none hangs low over the line at the threshold)
        const q0 = nearLine(x, gy + H, z), byMouth = q0.s < 505, form0 = form; if (byMouth && storey > 0) form = 1;
        const top = gy + H, cy = top - FLAT[form] * rad * 1.15, qn = nearLine(x, cy, z), dLine = qn.d, least = qn.s > 560 ? 40 : byMouth && qn.s > 425 && top > qn.y + 3 ? 46 : 26;   // (40 m where the line comes down among the trees: there the near trees are the kit's)
        if (dLine < Math.max(least, 1.4 * rad + 7) || offSight(x, cy, z) < 1.4 * rad + 0.5) return false;
        for (const c of crownAt) { if ((c[5] ?? 1) !== storey) continue; const dx = c[0] - x, dz = c[2] - z, lim = (c[5] === undefined ? 0.8 : 0.56) * (c[3] + rad); if (dx * dx + dz * dz < lim * lim) return false; }
        for (const f of domeFigs) if (Math.hypot(f[0] - x, f[2] - z) < rad + 3.5) return false;
        for (const f of figAt) if (Math.hypot(f[0] - x, f[2] - z) < rad + f[3]) return false;
        const g = GREENS[Math.floor(tintK * 4) % 4], k = (0.88 + 0.24 * jit) * (storey ? 1 : 0.8), near = dLine < 68 + 1.4 * rad;
        const row = [x, cy, z, rad, rad * (0.9 + 0.3 * jit), rad, jit * TAU, 0, 0, g[0] * k, g[1] * k, g[2] * k];
        if (storey === 0) { cLow.push(row); crownAt.push([x, top, z, rad, H, 0]); return true; }
        const br = (form0 === 2 ? 0.7 : 0.3) * (0.8 + 0.4 * jit) * Math.sqrt(H / 20);
        for (let t = 0.1; t < 0.95; t += 0.2) if (nearLine(x, gy + H * t, z).d < 7 + br * 2 || offSight(x, gy + H * t, z) < br * 2 + 0.5) return false;
        (bloom ? (near ? cBloomNear : cBloomFar) : (near ? cNear : cFar)[form]).push(row);
        if (dLine < 130) (form === 2 ? bolesTall : boles).push([x, gy - 1, z, br, cy - gy + 1 + 0.15 * rad, br, jit * 9, 0.07 * (tintK - 0.5), 0.07 * (jit - 0.5), 0.62 + 0.3 * jit, 0.62 + 0.3 * jit, 0.6 + 0.3 * jit]);
        crownAt.push([x, top, z, rad, H, storey]);
        return true;
      };
      // the emergents first: some two dozen, no two nearer than 24 m
      const emer = [];
      for (let i = 0; i < 700 && emer.length < 26; i++) {
        const a = r.range(470, 768), wl = wallsAt(a), l = r.range(wl.left + 12, wl.right - 12), k = forestK(a, l), pick = r(), rr = r(), hh = r(), tk = r(), jit = r();
        if (i % 100 === 99) await ctx.yield();
        if (pick > k || Math.hypot(a - RING.a, l - RING.l) < 26) continue;
        W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1];
        let far = !inPool(x, z, 10); for (const e of emer) if (Math.hypot(e[0] - x, e[1] - z) < 24) far = false;
        if (far && addCrown(x, z, groundAt(x, z), lerp(7.5, 11, rr), lerp(30, 38, hh), 2, tk, jit, false, 2)) emer.push([x, z]);
      }
      await ctx.yield();
      // the roof: tried seven thousand times, until five hundred and seventy stand (their middles as near as 0.56 of the two radii:
      // every crown lies half in its neighbours); over the last 190 m of the line the open sights keep it back, and the
      // cave's wall and roof stand over the forest there
      const bloomShare = forestKind === 'flower' ? 0.24 : 0.15;
      for (let i = 0, n = 0; i < 7000 && n < 570; i++) {
        const a = r.range(458, 772), wl = wallsAt(a), l = r.range(wl.left + 6, wl.right - 6), k = forestK(a, l), pick = r(), rr = r(), hh = r(), tk = r(), jit = r(), fm = r(), bl = r();
        if (i % 110 === 109) await ctx.yield();
        if (pick > k * 1.15 || Math.hypot(a - RING.a, l - RING.l) < 24) continue;
        W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1], gy = groundAt(x, z);
        if (inPool(x, z, 9)) continue;                                    // (the pool and the staircase's water lie open to the sky)
        const rad = lerp(5, 10.5, rr * rr), H = 14.5 + 4.5 * nz.n2(x * 0.035, z * 0.035) + 4 * hh + 0.6 * rad;
        if (addCrown(x, z, gy, rad, H, fm < 0.62 ? 0 : 1, tk, jit, bl < bloomShare, 1)) n++;
      }
      await ctx.yield();
      // the thickets under the roof: low round masses of leaves that stand on the ground between the boles, so that no ground
      // shows through a gap in the roof
      for (let i = 0, n = 0; i < 4000 && n < 105; i++) {
        const a = r.range(458, 772), wl = wallsAt(a), l = r.range(wl.left + 5, wl.right - 5), k = forestK(a, l), pick = r(), rr = r(), hh = r(), tk = r(), jit = r();
        if (i % 130 === 129) await ctx.yield();
        if (pick > k || Math.hypot(a - RING.a, l - RING.l) < 22) continue;
        W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1], gy = groundAt(x, z);
        if (!inPool(x, z, 8) && addCrown(x, z, gy, lerp(3.4, 6, rr), lerp(6, 10.5, hh), 1, tk, jit, false, 0)) n++;
      }
      await ctx.yield();
      // the skylight's fringe: small crowns on the funnel's slope round the hole, dark against the sky
      {
        const rr = R.rim, skx = W2(SKY.a, SKY.l);
        for (let i = 0; i < 22; i++) {
          const ang = rr() * TAU, d = rr.range(3.5, 13), r0 = SKY.r * (1 + 0.07 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 4)), rad = rr.range(3.5, 6.5), tk = rr(), jit = rr();
          let t = 0.3; while (t < 1 && 3.5 - 3.6 * Math.sin(Math.min(t * 2.2, 1) * Math.PI) + 16 * t * t < d) t += 0.02;
          const g = GREENS[Math.floor(tk * 4) % 4];
          cFar[i % 2].push([skx[0] + Math.cos(ang) * (r0 + d), 159.5 + 46 * t + rad * 0.5, skx[1] + Math.sin(ang) * (r0 + d), rad, rad * 1.1, rad, jit * TAU, 0, 0, g[0], g[1], g[2]]);
        }
      }
      const SEEDS = [0.4, 1.9, 3.3], SAG = [0.03, 0, 0.1], mat = crownMat(0, '#235c26', '#5c9a36', 0), matB = crownMat(0, '#2a6428', '#5c9a36', 0.8);
      if (cLow.length) plants(crownGeo(7.7, 0.95, 0, 1), crownMat(0.85, '#1f5424', '#4c8a30', 0), cLow, 'thickets');
      for (let f = 0; f < 3; f++) {
        if (cNear[f].length) plants(crownGeo(SEEDS[f], FLAT[f], SAG[f], 2), mat, cNear[f], f === 2 ? 'emergents' : 'canopy');
        if (cFar[f].length) plants(crownGeo(SEEDS[f], FLAT[f], SAG[f], 1), mat, cFar[f], f === 2 ? 'emergents' : 'canopy');
        await ctx.yield();
      }
      if (cBloomNear.length) plants(crownGeo(5.1, 0.7, 0.03, 2), matB, cBloomNear, 'canopy-in-flower');
      if (cBloomFar.length) plants(crownGeo(5.1, 0.7, 0.03, 1), matB, cBloomFar, 'canopy-in-flower');
      if (boles.length) plants(boleGeo(0.5, 7), matBole, boles, 'boles');
      if (bolesTall.length) plants(boleGeo(1.5, 9), matBole, bolesTall, 'boles');    }
    await ctx.yield();
    // THE UNDERSTORY, thickest beside the line: fan palms and feather palms (some of them tall, standing up through the roof),
    // tree ferns on dark stems, wild banana with its great paddle leaves, bushes in flower, ferns. By rule each one's top
    // stands 6 m and its own width from the line, and all of it out of the sight to the ring.
    const bigFern = flora.fernGeometry({ rng: R.under.fork('forms').fork('b1'), size: 1, fronds: 6, detail: 1, leaf: '#3f9a34', leafLight: '#b4dc5c', leafDark: '#1e5a26' });
    const smallFern = flora.fernGeometry({ rng: R.under.fork('forms').fork('f1'), size: 1, fronds: 9, detail: 0, leaf: '#3c8a3a', leafLight: '#9ccb4a', leafDark: '#1c4a22' });
    {
      const uR = R.under.fork('kinds'), r = R.under;
      const kinds = [
        { geo: flora.palmGeometry({ rng: uR.fork('p1'), height: 6, detail: 0, fronds: 9, curve: 0.5, coconuts: false, leaf: '#4f8a2c', leafLight: '#a4cf52', bark: '#8f8468' }), h: [3, 8.5], n: 36, tall: true, name: 'palms' },
        { geo: flora.palmGeometry({ rng: uR.fork('p2'), height: 5.5, detail: 0, fronds: 12, curve: 0.15, coconuts: false, leaf: '#2f7a34', leafLight: '#7fc04a', bark: '#4a3c2c' }), h: [4, 7.5], n: 28, tall: true, name: 'palms' },
        { geo: flora.palmGeometry({ rng: uR.fork('p3'), height: 15, detail: 0, fronds: 12, curve: 0.3, coconuts: false, leaf: '#3f8a30', leafLight: '#9ccf52', bark: '#9a917a' }), h: [15, 23], n: 22, tall: true, far: true, name: 'palms' },
        { geo: bigFern, h: [2.4, 4.2], n: 90, name: 'ferns' },
        { geo: smallFern, h: [0.8, 1.7], n: 170, name: 'ferns' },
        { geo: flora.bushGeometry({ rng: uR.fork('s1'), size: 1.6, detail: 0, flowers: 0.75, flowerColor: bloomHex, leaf: '#2f6b2e', leafLight: '#86b844', leafDark: '#183c1e' }), h: [1.4, 3.0], n: 34, name: 'bushes-in-flower' },
      ];
      await ctx.yield();
      for (const K of kinds) {
        const list = [], gh = K.geo.userData.height || 1, gr = K.geo.userData.radius || 1;
        for (let i = 0; i < K.n * 12 && list.length < K.n; i++) {
          const a = r.range(456, 774), wl = wallsAt(a), l = r.range(wl.left + 3, wl.right - 3), k = forestK(a, l), pick = r(), hRoll = r(), yaw = r() * TAU, tr = r(), tl = r();
          W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1], q = nearLineXZ(x, z), close = K.far ? 1 - 0.6 * smoothstep(60, 160, q.dh) : 1 - 0.93 * smoothstep(26, 80, q.dh);
          if (i % 300 === 299) await ctx.yield();
          if (pick > (0.25 + 0.75 * k) * close) continue;
          const h = lerp(K.h[0], K.h[1], hRoll), s = h / gh, gy = groundAt(x, z) - 0.15;
          if (nearLine(x, gy + h, z).d < 6 + gr * s || nearLine(x, gy + 0.4 * h, z).d < 6 + 0.5 * gr * s || offSight(x, gy + h, z) < gr * s + 0.5 || offSight(x, gy + 0.4 * h, z) < 1) continue;
          let free = true; for (const f of figAt) if (Math.hypot(f[0] - x, f[2] - z) < 4) free = false;
          if (!free || inPool(x, z, 1.5)) continue;
          list.push([x, gy, z, s, s, s, yaw, K.tall ? 0.1 * (tl - 0.5) : 0.3 * (tl - 0.5), 0, 0.8 + 0.3 * tr, 0.85 + 0.25 * tr, 0.8 + 0.2 * tl]);
        }
        plants(K.geo, K.tall ? matCrown : matUnder, list, K.name);
        await ctx.yield();
      }
      // wild banana: five great blades on a short stem (this world's own form)
      const paddleGeo = (rp) => {
        const P = [], Nn = [], B = [], idx = [], NA = 5;
        for (let k = 0; k < 5; k++) {
          const yaw = k * 2.4 + rp.range(-0.3, 0.3), el0 = lerp(1.25, 0.5, k / 4) + rp.range(-0.1, 0.1), len = rp.range(0.75, 1.0), droop = rp.range(0.9, 1.5), hw = 0.17 * len, v0 = P.length / 3;
          let px = 0, py = 0.16, pz = 0;
          for (let j = 0; j <= NA; j++) {
            const v = j / NA, el = el0 - droop * v * v, cy = Math.cos(yaw), sy = Math.sin(yaw), ce = Math.cos(el), se = Math.sin(el);
            if (j > 0) { px += cy * ce * len / NA; py += se * len / NA; pz += sy * ce * len / NA; }
            for (let c = -1; c <= 1; c++) {                              // (the blade is folded a little along its midrib)
              const fold = Math.abs(c) * 0.22 * hw;
              P.push(px - sy * c * hw - cy * se * fold, py + ce * fold, pz + cy * c * hw - sy * se * fold);
              const nx = -cy * se + sy * c * 0.22, ny = ce, nzz = -sy * se - cy * c * 0.22, nl = Math.hypot(nx, ny, nzz) || 1;
              Nn.push(nx / nl, ny / nl, nzz / nl); B.push(c, v, k + 0.37);
            }
          }
          for (let j = 0; j < NA; j++) for (let c = 0; c < 2; c++) { const a = v0 + j * 3 + c, b = a + 1, d = a + 3, e = d + 1; idx.push(a, d, b, b, d, e); }
        }
        const s0 = P.length / 3;                                         // the stem: a short stalk of sheathed leaf bases
        for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) { const ang = TAU * i / 5, rr = j ? 0.03 : 0.05; P.push(Math.cos(ang) * rr, j * 0.2, Math.sin(ang) * rr); Nn.push(Math.cos(ang), 0, Math.sin(ang)); B.push(0, 0.05, 0); }
        for (let i = 0; i < 5; i++) { const a = s0 + i, b = s0 + (i + 1) % 5; idx.push(a, a + 5, b, b, a + 5, b + 5); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
        g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 3)); g.setIndex(idx); g.computeBoundingSphere();
        return g;
      };
      const matPaddle = new THREE.ShaderMaterial({ vertexShader: PADDLE_VERT, fragmentShader: PADDLE_FRAG, side: THREE.DoubleSide, uniforms: caveU({ uUnder: { value: 0.85 } }) });
      const bananas = [[], []], bR = R.under.fork('banana');
      for (let i = 0; i < 1600 && bananas[0].length + bananas[1].length < 84; i++) {
        const a = bR.range(470, 772), wl = wallsAt(a), l = bR.range(wl.left + 3, wl.right - 3), k = forestK(a, l), pick = bR(), hRoll = bR(), yaw = bR() * TAU, tr = bR(), v = bR.int(0, 1);
        W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1], q = nearLineXZ(x, z), close = 1 - 0.95 * smoothstep(22, 60, q.dh);
        if (i % 300 === 299) await ctx.yield();
        if (pick > (0.25 + 0.75 * k) * close) continue;
        const h = lerp(3.2, 6, hRoll), gy = groundAt(x, z) - 0.1;
        if (nearLine(x, gy + 0.55 * h, z).d < 6 + 0.75 * h || offSight(x, gy + 0.55 * h, z) < 0.75 * h + 0.5) continue;
        let free = !inPool(x, z, 2);
        for (const f of figAt) if (Math.hypot(f[0] - x, f[2] - z) < 4.5) free = false;
        if (free) bananas[v].push([x, gy, z, h, h, h, yaw, 0.12 * (tr - 0.5), 0, 0.85 + 0.3 * tr, 0.9 + 0.2 * tr, 0.85]);
      }
      for (let v = 0; v < 2; v++) plants(paddleGeo(bR.fork('form' + v)), matPaddle, bananas[v], 'wild-banana');
      await ctx.yield();
      // tree ferns: a crown of great fronds on a dark stem, 3 to 7 m up
      const stems = [], crowns = [], tR = R.under.fork('treeferns'), fgh = bigFern.userData.height || 1, fgr = bigFern.userData.radius || 1;
      for (let i = 0; i < 900 && stems.length < 40; i++) {
        const a = tR.range(470, 772), wl = wallsAt(a), l = tR.range(wl.left + 3, wl.right - 3), k = forestK(a, l), pick = tR(), hRoll = tR(), yaw = tR() * TAU, tr = tR();
        W2(a, l, wtmp); const x = wtmp[0], z = wtmp[1], q = nearLineXZ(x, z), close = 1 - 0.95 * smoothstep(24, 70, q.dh);
        if (i % 300 === 299) await ctx.yield();
        if (pick > (0.25 + 0.75 * k) * close) continue;
        const h = lerp(3, 7, hRoll), gy = groundAt(x, z) - 0.3, sc = lerp(2.6, 3.6, tr) / fgh, reach = fgr * sc;
        if (nearLine(x, gy + h + 1, z).d < 6 + reach || nearLine(x, gy + 0.5 * h, z).d < 6.5 || offSight(x, gy + h + 1, z) < reach + 0.5 || offSight(x, gy + 0.5 * h, z) < 1) continue;
        if (inPool(x, z, 1.5)) continue;
        stems.push([x, gy, z, 0.2, h + 0.3, 0.2, yaw, 0.06 * (tr - 0.5), 0, 0.42, 0.34, 0.27]); crowns.push([x, gy + h, z, sc, sc, sc, yaw, 0, 0, 0.8 + 0.3 * tr, 0.9 + 0.2 * tr, 0.8]);
      }
      plants(boleGeo(0.15, 6), matBole, stems, 'tree-fern-stems'); plants(bigFern, matUnder, crowns, 'tree-ferns');
      await ctx.yield();
      // the line's own garden: great ferns and small, thick on both sides of the line from where it comes down into the
      // forest all the way up to the shelf. By rule of place: between 7.5 and 24 m to the side of the line, and the top
      // of each one 6 m and its own width from it.
      const gr2 = R.under.fork('gully'), big = [], small = [];
      for (let i = 0; i < 2400 && big.length + small.length < 195; i++) {
        const s = gr2.range(500, Lp + 6), side = gr2.sign(), lat = 7.5 + 16.5 * Math.pow(gr2(), 1.6), isBig = gr2() < 0.42, hRoll = gr2(), yaw = gr2() * TAU, tr = gr2(), tl = gr2();
        const q = atS(Math.min(s, Lp - 0.5), side * lat), x = q[0] + (s > Lp ? endX * (s - Lp) : 0), z = q[2] + (s > Lp ? endZ * (s - Lp) : 0);
        const geo = isBig ? bigFern : smallFern, h = isBig ? lerp(2.6, 5.2, hRoll) : lerp(1.0, 2.2, hRoll), gh = geo.userData.height || 1, grr = geo.userData.radius || 1, sc = h / gh, gy = groundAt(x, z) - 0.15;
        if (i % 300 === 299) await ctx.yield();
        if (s > Lp - 10 && lat < 12) continue;                           // (nothing grows across the ring's own rim)
        if (nearLine(x, gy + h, z).d < 6 + grr * sc || nearLine(x, gy, z).d < 6 + grr * sc || offSight(x, gy + 0.5 * h, z) < grr * sc + 0.3) continue;
        if (inPool(x, z, 1.2)) continue;
        (isBig ? big : small).push([x, gy, z, sc, sc, sc, yaw, 0.3 * (tl - 0.5), 0, 0.8 + 0.3 * tr, 0.88 + 0.22 * tr, 0.8 + 0.2 * tl]);
      }
      // and low ferns on the ground under the line itself: none taller than 1.1 m, and its top 5.6 m and more under the line
      for (let i = 0, n = 0; i < 900 && n < 100; i++) {
        const s = gr2.range(500, Lp - 12), lat = gr2.range(-7.5, 7.5), hRoll = gr2(), yaw = gr2() * TAU, tr = gr2(), tl = gr2();
        const q = atS(s, lat), x = q[0], z = q[2], h = lerp(0.6, 1.1, hRoll), sc = h / (smallFern.userData.height || 1), gy = groundAt(x, z) - 0.1;
        if (i % 100 === 99) await ctx.yield();
        if (inPool(x, z, 1.2) || nearLine(x, gy + h, z).d < 5.6 + 0.5 * (smallFern.userData.radius || 1) * sc || offSight(x, gy + 0.5 * h, z) < 0.8) continue;
        const row =[x, gy, z, sc, sc, sc, yaw, 0.3 * (tl - 0.5), 0, 0.8 + 0.3 * tr, 0.88 + 0.22 * tr, 0.8 + 0.2 * tl];
        // (every frond of it, not its middle alone; a fern whose whole ball is further off than that needs no frond looked at)
        if (nearLine(x, gy, z).d < 5.6 + Math.hypot((smallFern.userData.radius || 1) * sc, h) + 0.2 && !clearOfLine(smallFern, compose(row), 5.6, 1)) continue;
        small.push(row); n++;
      }
      await ctx.yield();
      // on the staircase's own rims and banks, half a metre to 14 m back from the water on either side (thickest at the
      // water): bushes in flower (up to 30) and ferns great and small (up to 190), so that no bare ground shows beside
      // the pools; by the same rule of 6 m and their own width from the line and out of the open sights
      {
        const bush = kinds[5].geo, rimB = [];
        for (let i = 0, nf = 0; i < 1100 && nf < 190; i++) {
          const s = gr2.range(STAIR.dams[0] - 16, STAIR.sEnd), side = gr2.sign(), off = 0.5 + 14 * Math.pow(gr2(), 1.5), kind = gr2(), isBush = kind < 0.14, isBig = kind < 0.45, hRoll = gr2(), yaw = gr2() * TAU, tr = gr2();
          const q = atS(Math.min(s, Lp - 0.5), stairC(s) + side * (stairW(s, side) + off)), x = q[0], z = q[2], geo = isBush ? bush : isBig ? bigFern : smallFern, h = isBush ? lerp(1.5, 3.0, hRoll) : isBig ? lerp(2.2, 4.4, hRoll) : lerp(1.0, 2.2, hRoll);
          if (i % 100 === 99) await ctx.yield();
          if (isBush && rimB.length >= 30 || Math.hypot(x - JPOOL.x, z - JPOOL.z) < JPOOL.r * 1.14 + 0.5) continue;
          const sc = h / (geo.userData.height || 1), rad = (geo.userData.radius || 1) * sc, gy = groundAt(x, z) - 0.15;
          if (nearLine(x, gy + h, z).d < 6 + rad || nearLine(x, gy, z).d < 6 + rad || offSight(x, gy + 0.5 * h, z) < rad + 0.3) continue;
          (isBush ? rimB : isBig ? big : small).push([x, gy, z, sc, sc, sc, yaw, 0.2 * (tr - 0.5), 0, 0.85 + 0.25 * tr, 0.9 + 0.15 * tr, 0.85]); if (!isBush) nf++;
        }
        plants(bush, matUnder, rimB, 'bushes-in-flower');
      }
      await ctx.yield();
      // ferns in the joints and on the tops of the fallen blocks beside the line, and pale orchids on some of them
      const oR = R.under.fork('orchids'), orchid = [flora.flowerGeometry({ rng: oR.fork('w'), color: '#fbf3ff', cards: 3, width: 1, height: 1 }), flora.flowerGeometry({ rng: oR.fork('p'), color: '#ffc9e4', cards: 3, width: 1, height: 1 })], orchids = [[], []];
      for (let i = 0; i < blockTops.length; i++) {
        const b = blockTops[i], roll = oR(), ang = oR() * TAU, d = oR() * 0.25 * b[3], hRoll = oR(), tr = oR(), x = b[0] + Math.cos(ang) * d, z = b[2] + Math.sin(ang) * d;
        if (i % 200 === 199) await ctx.yield();
        const dl = nearLine(x, b[1] + 1.2, z).d;
        if (dl > 60 || dl < 6.6 || offSight(x, b[1] + 0.6, z) < 1.2) continue;
        if (roll < 0.5 && small.length < 330) { const h = lerp(0.7, 1.5, hRoll), sc = h / (smallFern.userData.height || 1); if (dl > 6 + (smallFern.userData.radius || 1) * sc) small.push([x, b[1] - 0.15, z, sc, sc, sc, ang, 0.3 * (tr - 0.5), 0, 0.8 + 0.3 * tr, 0.9 + 0.2 * tr, 0.8]); }
        else if (roll > 0.72 && dl < 40 && orchids[0].length + orchids[1].length < 110) { const sc = lerp(0.5, 0.95, hRoll); orchids[tr < 0.6 ? 0 : 1].push([x, b[1] - 0.05, z, sc, sc, sc, ang, 0.25 * (tr - 0.5), 0, 1, 1, 1]); }
      }
      plants(bigFern, matUnder, big, 'ferns'); plants(smallFern, matUnder, small, 'ferns');
      for (let v = 0; v < 2; v++) plants(orchid[v], matUnder, orchids[v], 'orchids');
      await ctx.yield();
      // DRIFTS OF BLOSSOM on the ground beside the line, all the way from the forest's edge to the ring: white and yellow
      // for the most part, a red or a coral one among them, each drift of one colour and a patch of it metres across:
      // fourteen to thirty flowers within 2.4 to 4.8 m. By rule of place a drift's middle lies 8 to 22 m to the side
      // of the line, and each flower's top 5.9 m and more from it and out of the open sights.
      const fR = R.under.fork('drifts'), fgeo = ['#e8262a', '#ff7350', '#fff6e6', '#ffd23a'].map((c, i) => flora.flowerGeometry({ rng: fR.fork('f' + i), color: c, cards: 2, width: 1, height: 1 })), drifts = [[], [], [], []];
      for (let i = 0, nd = 0; i < 600 && nd < 56; i++) {
        const s = fR.range(486, Lp + 5), side = fR.sign(), lat = fR.range(8, 22), v = [2, 3, 2, 3, 2, 3, 1, 0][Math.min(7, Math.floor(fR() * 8))], n = 14 + Math.floor(fR() * 17), rad = fR.range(2.4, 4.8);
        const q = atS(Math.min(s, Lp - 0.5), side * lat), cx = q[0] + (s > Lp ? endX * (s - Lp) : 0), cz = q[2] + (s > Lp ? endZ * (s - Lp) : 0);
        if (i % 40 === 39) await ctx.yield();
        if (s > Lp - 10 && lat < 12) continue;                           // (nothing grows across the ring's own rim)
        let placed = 0;
        for (let k = 0; k < n; k++) {
          const ang = fR() * TAU, d = Math.sqrt(fR()) * rad, sc = fR.range(0.5, 0.95), x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d, gy = groundAt(x, z) - 0.05;
          if (nearLine(x, gy + sc, z).d < 5.9 || offSight(x, gy + 0.5 * sc, z) < 0.6) continue;
          if (inPool(x, z, 1.2)) continue;
          drifts[v].push([x, gy, z, sc, sc, sc, ang, 0.2 * (fR() - 0.5), 0, 1, 1, 1]); placed++;
        }
        if (placed) nd++;
      }
      for (let v = 0; v < 4; v++) plants(fgeo[v], matUnder, drifts[v], 'flowers');
      await ctx.yield();
    }
    // THE WATER: the fall, its pool, the slender fall and the cave's fall, one mesh of four sheets. Each sheet is rows of five places across
    // (bank, water's edge, middle, water's edge, bank); the banks go down into the ground.
    {
      const P3s = [], W3 = [], idx = [];
      let along = 0, rows = 0, first = 0;
      const sheetEnd = () => { for (let j = first; j < rows - 1; j++) for (let e = 0; e < 4; e++) { const a = j * 5 + e, b = a + 1, c = a + 5, d = c + 1; idx.push(a, b, c, b, d, c); } first = rows; };
      // (1) THE FALL: a ribbon of white water 11 m wide at its lip and some 15 m at its foot, falling clear of the rock
      {
        const ax = -FALL.face[1], az = FALL.face[0], nR = FALL.rows.length;
        for (let j = 0; j < nR; j++) {
          const q = FALL.rows[j], half = lerp(7, 10, Math.pow(j / (nR - 1), 0.7)) * (0.94 + 0.06 * Math.sin(j * 1.7));
          if (j) along += Math.hypot(q[0] - FALL.rows[j - 1][0], q[1] - FALL.rows[j - 1][1], q[2] - FALL.rows[j - 1][2]);
          for (let e = -2; e <= 2; e++) { const off = Math.sign(e) * (half + (Math.abs(e) === 2 ? 0.5 : 0)), back = Math.abs(e) === 2 ? 1.2 : 0; P3s.push(q[0] + ax * off - FALL.in[0] * back, q[1], q[2] + az * off - FALL.in[1] * back); W3.push(e, along, 1.5); }
          rows++;
        }
        sheetEnd();
      }
      await ctx.yield();
      // (2) THE POOL at its foot: a round of level water in the ground, from the wall out past the line
      {
        // (the sheet is a round a sixth wider than the pool: the shore is where the ground's own uneven lip comes up through it)
        const RP = JPOOL.r * 1.16 + 0.6, A = [JPOOL.fx - FALL.in[0] * 2.5, JPOOL.fz - FALL.in[1] * 2.5], B = [JPOOL.x + FALL.in[0] * RP, JPOOL.z + FALL.in[1] * RP];
        const len = Math.hypot(B[0] - A[0], B[1] - A[1]), m = Math.max(2, Math.round(len)), ux = (B[0] - A[0]) / len, uz = (B[1] - A[1]) / len;
        for (let j = 0; j <= m; j++) {
          const t = j / m, cx = lerp(A[0], B[0], t), cz = lerp(A[1], B[1], t), dc = Math.hypot(cx - JPOOL.x, cz - JPOOL.z) / RP, half = RP * Math.sqrt(Math.max(0.03, 1 - dc * dc));
          along += len / m;
          for (let e = -2; e <= 2; e++) {
            const off = Math.sign(e) * (half + (Math.abs(e) === 2 ? 0.5 : 0)), x = cx - uz * off, z = cz + ux * off;
            P3s.push(x, Math.abs(e) === 2 ? JPOOL.y - 0.6 : JPOOL.y, z); W3.push(e, along, -0.4);
          }
          rows++;
        }
        sheetEnd();
      }
      await ctx.yield();
      // (3) THE SLENDER FALL beside the ring: a ribbon 3 m wide at its lip and 5 m at its foot, into the top pool
      {
        const F2 = STAIR.fall, ax = -F2.face[1], az = F2.face[0], nR = F2.rows.length;
        for (let j = 0; j < nR; j++) {
          const q = F2.rows[j], half = lerp(1.5, 2.6, Math.pow(j / (nR - 1), 0.7)) * (0.92 + 0.08 * Math.sin(j * 1.3));
          along += 1.5;
          for (let e = -2; e <= 2; e++) { const off = Math.sign(e) * (half + (Math.abs(e) === 2 ? 0.3 : 0)), back = Math.abs(e) === 2 ? 0.6 : 0; P3s.push(q[0] + ax * off - F2.in[0] * back, q[1], q[2] + az * off - F2.in[1] * back); W3.push(e, along, 1.5); }
          rows++;
        }
        sheetEnd();
      }
      // (4) THE FALL IN THE CAVE: a ribbon 3.4 m wide where it comes out of its opening and 7 m at its foot on the lake
      {
        const ax = -CF.face[1], az = CF.face[0], nR = CF.rows.length;
        for (let j = 0; j < nR; j++) {
          const q = CF.rows[j], half = lerp(1.7, 3.5, Math.pow(j / (nR - 1), 0.8)) * (0.9 + 0.1 * Math.sin(j * 1.9));
          along += 1.5;
          for (let e = -2; e <= 2; e++) { const off = Math.sign(e) * (half + (Math.abs(e) === 2 ? 0.3 : 0)), back = Math.abs(e) === 2 ? 0.6 : 0; P3s.push(q[0] + ax * off - CF.in[0] * back, q[1], q[2] + az * off - CF.in[1] * back); W3.push(e, along, 1.5); }
          rows++;
        }
        sheetEnd();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P3s), 3)); g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W3), 3)); g.setIndex(idx); g.computeBoundingSphere();
      const run = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RUN_VERT, fragmentShader: RUN_FRAG, side: THREE.DoubleSide, uniforms: caveU({ uFallP: { value: new THREE.Vector2(JPOOL.fx, JPOOL.fz) }, uPoolC: { value: new V3(JPOOL.x, JPOOL.z, JPOOL.r) } }) }));
      run.name = 'fall'; scene.add(run);
    }
    await ctx.yield();
    // LIANAS from the crowns, the long ones from the skylight's rim (20 to 40 m), and the figs' hanging roots: one mesh of cords
    {
      const r = R.lianas, cords = [], skx = W2(SKY.a, SKY.l);            // [x, y, z, length, width, phase]
      // by rule: every point of a cord, with the reach of its swing, keeps 7.5 m from the line
      // and is out of the sight to the ring
      const cordOK = (x, y, z, len) => { for (let t = 0; t <= 1.001; t += 0.125) if (nearLine(x, y - len * t, z).d < 7.5 + len * 0.05 || offSight(x, y - len * t, z) < 0.6 + len * 0.05) return false; return true; };
      for (let ci = 0; ci < crownAt.length; ci++) {
        const c = crownAt[ci], roll = r(), a1 = r(), a2 = r(), a3 = r(), a4 = r();
        if (ci % 60 === 59) await ctx.yield();
        if (c[5] === 0 || nearLineXZ(c[0], c[2]).dh > 80 || roll < 0.3) continue;      // (not from the thickets, nor far from the line)
        for (let k = 0; k < (roll > 0.7 ? 2 : 1); k++) {
          const ang = (a1 + k * 0.37) * TAU, rr = c[3] * lerp(0.2, 0.7, k ? a3 : a2), x = c[0] + Math.cos(ang) * rr, z = c[2] + Math.sin(ang) * rr;
          const y0 = c[1] - 0.3 * c[4], len = Math.min(lerp(7, 20, k ? a2 : a4), y0 - groundAt(x, z) - 1.5);
          if (len > 4 && cordOK(x, y0, z, len)) cords.push([x, y0, z, len, 0.17, a3 + k * 0.5]);
        }
      }
      for (let i = 0; i < 84; i++) {
        const ang = r() * TAU, r0 = SKY.r * (1 + 0.07 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 4)) - r.range(0.3, 3.5);
        const cx = skx[0] + Math.cos(ang) * r0, cz = skx[1] + Math.sin(ang) * r0, cy = 170 + r.range(-2, 3), len = r.range(20, 40) * (0.6 + 0.4 * r()), ph = r();
        // (where the roof comes down to the wall the rim is in the rock: a cord hangs only where the air is open 9 m further out too)
        let roofY = 1e9;
        for (const out of [0, 9]) {
          toAxis(cx + Math.cos(ang) * out, cz + Math.sin(ang) * out, axT); const wl = wallsAt(axT.a), wc = (wl.left + wl.right) * 0.5, ww = (wl.right - wl.left) * 0.5;
          const cs = Math.pow(Math.min(1, Math.abs(axT.l - wc) / ww), 1 / 0.55); roofY = Math.min(roofY, -5 + (wl.roof + 5) * Math.pow(Math.sqrt(Math.max(0, 1 - cs * cs)), archE(axT.a)));
        }
        if (roofY < 172) continue;
        cords.push([cx, cy, cz, len, 0.4, ph]);
      }
      // and down the dome's walls from their upper ledges: long cords that hang close against the rock
      {
        const o = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] };
        for (let i = 0; i < 130; i++) {
          const a = r.range(486, 768), left = r() < 0.5, yT = r.range(95, 160), len = r.range(22, 55), ph = r(), w = r.range(0.3, 0.5);
          const wl = wallsAt(a), asn = Math.asin(Math.min(1, Math.pow((yT + 5) / (wl.roof + 5), 1 / archE(a))));
          shellPoint(a, left ? Math.PI - asn : asn, o); W2(a, (wl.left + wl.right) * 0.5, wtmp);
          const dx = wtmp[0] - o.p[0], dz = wtmp[1] - o.p[2], h = Math.hypot(dx, dz) || 1, x = o.p[0] + dx / h * 1.2, z = o.p[2] + dz / h * 1.2;
          if (cordOK(x, o.p[1], z, len)) cords.push([x, o.p[1], z, len, w, ph]);
          if (i % 40 === 39) await ctx.yield();
        }
        // (the hanging garden's curtains of vines: eighty cords close against the wall behind and beside the ring, by
        // the same rule of 7.5 m from the line, and out of the sights to the ring's disc and to the slender fall)
        for (let i = 0; i < 80; i++) {
          const a = RING.a + r.range(-45, 40), yT = r.range(84, 150), len = r.range(14, 42), ph = r(), w = r.range(0.3, 0.55);
          const wl = wallsAt(a), asn = Math.asin(Math.min(1, Math.pow((yT + 5) / (wl.roof + 5), 1 / archE(a))));
          shellPoint(a, Math.PI - asn, o); W2(a, (wl.left + wl.right) * 0.5, wtmp);
          const dx = wtmp[0] - o.p[0], dz = wtmp[1] - o.p[2], h = Math.hypot(dx, dz) || 1, x = o.p[0] + dx / h * 1.2, z = o.p[2] + dz / h * 1.2;
          let ok = true; for (let t = 0; t <= 1.001; t += 0.125) if (nearLine(x, o.p[1] - len * t, z).d < 7.5 + len * 0.05 || offSight(x, o.p[1] - len * t, z, true) < 0.6 + len * 0.05) ok = false;
          if (ok) cords.push([x, o.p[1], z, len, w, ph]);
          if (i % 40 === 39) await ctx.yield();
        }
      }
      for (const f of figAt) for (let k = 0; k < 9; k++) {
        const ang = r() * TAU, rr = f[3] * r.range(0.25, 0.7), x = f[0] + Math.cos(ang) * rr, z = f[2] + Math.sin(ang) * rr, y0 = f[1] + f[4] * 0.55;
        const len = Math.min(r.range(5, 11), y0 - groundAt(x, z) - 0.3), ph = r();
        if (len > 3 && cordOK(x, y0, z, len)) cords.push([x, y0, z, len, 0.24, ph]);
      }
      const NSG = 8, nc = cords.length, nv = nc * (NSG + 1) * 2, aL = new Float32Array(nv * 4), aM = new Float32Array(nv * 4), pos = new Float32Array(nv * 3), idx = [];
      for (let c = 0; c < nc; c++) {
        const q = cords[c];
        for (let j = 0; j <= NSG; j++) for (let s = 0; s < 2; s++) {
          const v = (c * (NSG + 1) + j) * 2 + s;
          aL.set([q[0], q[1], q[2], q[3]], v * 4); aM.set([j / NSG, s * 2 - 1, q[5], q[4]], v * 4); pos.set([q[0], q[1] - q[3] * j / NSG, q[2]], v * 3);
        }
        for (let j = 0; j < NSG; j++) { const a = (c * (NSG + 1) + j) * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.BufferAttribute(aL, 4)); g.setAttribute('aM', new THREE.BufferAttribute(aM, 4)); g.setIndex(idx);
      const lm = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: LIANA_VERT, fragmentShader: LIANA_FRAG, side: THREE.DoubleSide, uniforms: caveU() }));
      lm.frustumCulled = false; lm.name = 'lianas'; scene.add(lm);
    }
    await ctx.yield();
    // ferns on the walls of the bend and the dome, growing out toward the light (the walls keep 15 m from the line by rule; no
    // plant here is over 4 m)
    {
      const rw = R.wallferns, wf = flora.fernGeometry({ rng: rw.fork('form'), size: 1, fronds: 6, detail: 0, leaf: '#3c8a3a', leafLight: '#9ccb4a', leafDark: '#1c4a22' }), wlist = [], o = { p: [0, 0, 0], a: [0, 0, 0, 0], c: [0, 0, 0] };
      for (let i = 0; i < 230; i++) {
        const a = rw.range(345, 770), leftSide = a < 470 || rw() < 0.5, yT = rw.range(20, 105), size = rw.range(1.6, 3.8), yaw0 = rw(), tr = rw();
        const wl = wallsAt(a), asn = Math.asin(Math.min(1, Math.pow((yT + 5) / (wl.roof + 5), 1 / archE(a)))), fi = (leftSide ? Math.PI - asn : asn) / Math.PI;   // the place on the arch that stands at that height
        shellPoint(a, fi * Math.PI, o); W2(a, (wl.left + wl.right) * 0.5, wtmp);
        const dx = wtmp[0] - o.p[0], dz = wtmp[1] - o.p[2];
        if (nearLine(o.p[0], o.p[1], o.p[2]).d < 9 + size) continue;
        wlist.push([o.p[0], o.p[1] - 0.2, o.p[2], size, size, size, Math.atan2(dx, dz) + (yaw0 - 0.5) * 0.6, 0.9, 0, 0.8 + 0.3 * tr, 0.9 + 0.2 * tr, 0.8]);
      }
      await ctx.yield();
      // (the hanging garden behind and beside the ring: a hundred and twenty more tried, great ones, on the left wall from 45 m
      // short of the ring to 40 m past it, from the shelf up to 125 m; none in the alcove's mouth)
      for (let i = 0; i < 120; i++) {
        const a = RING.a + rw.range(-45, 40), yT = rw.range(60, 125), size = rw.range(2.4, 5.2), yaw0 = rw(), tr = rw();
        const wl = wallsAt(a), asn = Math.asin(Math.min(1, Math.pow((yT + 5) / (wl.roof + 5), 1 / archE(a))));
        shellPoint(a, Math.PI - asn, o); W2(a, (wl.left + wl.right) * 0.5, wtmp);
        const dx = wtmp[0] - o.p[0], dz = wtmp[1] - o.p[2];
        if (i % 40 === 39) await ctx.yield();
        if (Math.hypot(o.p[0] - alcXZ[0], o.p[2] - alcXZ[1]) < ALCOVE.r + 9 && yT < ALCOVE.y1 || nearLine(o.p[0], o.p[1], o.p[2]).d < 9 + size) continue;
        wlist.push([o.p[0], o.p[1] - 0.2, o.p[2], size, size, size, Math.atan2(dx, dz) + (yaw0 - 0.5) * 0.6, 0.9, 0, 0.8 + 0.3 * tr, 0.9 + 0.2 * tr, 0.8]);
      }
      plants(wf, matCrown, wlist, 'wall-ferns');
    }
    await ctx.yield();

    // ---------------- LIFE. Swifts wheel in the pillar of sun where the eye looks; a party escorts the visitor over the river;
    // a party skims the lake beside the line and another flies up the steep stairs; one party of large white birds flies
    // low over the fall's pool and up past the fall; a party of swifts hawks up and down the bank and another wheels over
    // the ring. Butterflies in three colours fly in the shade of the bank, in the sun at the pillar's foot, over the left
    // bank below the shelf, and about the ring. Every call is a build step of its own, every reach is laid out by place,
    // and every answer of the kit's is read: a party the kit could not clear does not fly.
    const sunLit = { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: new THREE.Color().setRGB(1.0, 0.90, 0.66), sunIntensity: 3.0, sky: new THREE.Color().setRGB(0.40, 0.62, 0.64), skyIntensity: 1.0, ground: new THREE.Color().setRGB(0.10, 0.16, 0.07), groundIntensity: 1.0 };
    const inShade = { ...sunLit, sunIntensity: 0.5, skyIntensity: 1.5 };  // (out of the pillar the sun is only what the pillar's foot gives back)
    const fauna = F.makeFauna(scene, { light: sunLit });
    const life = [];                                                    // what every call handed the kit and what the kit handed back
    scene.userData.life = life;
    const named = (f, name) => { f.object.name = name; f.object.traverse((m) => { m.name = name; }); return f; };
    const dropFlock = (f) => { if (f.object) f.object.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); if (f.geometry) f.geometry.dispose(); if (f.material) f.material.dispose(); };   // (a flock that may not fly is given back)
    const leastOf = (pts) => { let d = 1e9; for (const p of pts) d = Math.min(d, nearLine(p[0], p[1], p[2]).d); return Math.round(d * 100) / 100; };   // (metres from the line to the nearest knot of a course, or anchor)
    {
      // THE SWIFTS OF THE PILLAR wheel about the pillar's own axis where it passes 96 m: a ring 14 m in radius that tilts 4 m.
      // With the scatter held to three sigma (10.8 m each way in plan, 15.3 m at the box's corner; 6.8 m up and down), the
      // wander written out (a box of 3, 1.5 and 2 m) and a body of 1.8 m, no swift flies further than 35 m from the wheel's
      // middle in plan, nor under 81 m or over 111 m. The wheel's nearest knot is 68 m from the line: the birds are high in
      // the pillar, far over the line; the kit is told to keep 14 m clear and its answer is read.
      const t96 = (SKY.y - 96) / sunDir.y, cx = skyXZ[0] - sunDir.x * t96, cz = skyXZ[1] - sunDir.z * t96, route = [];
      for (let i = 0; i < 12; i++) { const a = TAU * i / 12; route.push([cx + Math.cos(a) * 14, 96 + 4 * Math.sin(a * 2), cz + Math.sin(a) * 14]); }
      await ctx.yield();
      const opts = { species: 'swifts', count: 38, size: 3.2, form: 'loose', speed: 16, spread: [8, 5, 20], wander: [2, 1.5, 2, 0.7], maxSigma: 3 };
      const swifts = await F.makeFlockAsync({ rng: R.swifts, ...opts, route, closed: true, keepClear: { path, dist: 14, from: 430 / Lp, to: 640 / Lp, step: 2 }, light: sunLit }, ctx.yield);
      life.push({ name: 'swifts of the pillar', ...opts, kept: swifts.kept, reach: swifts.reach, least: leastOf(route) });
      if (swifts.kept && swifts.kept.short > 0) dropFlock(swifts); else fauna.add(named(swifts, 'swifts'));
      await ctx.yield();
    }
    {
      // THE PARTY UP THE STAIRCASE: fourteen swifts on a long narrow loop on the LEFT of the line from 342 to 447 m flown,
      // over the river's cascades: out along the lane 13 m from the line, back along the lane 19 m from it, 1.5 to 2.5 m
      // over the line's own height. With the scatter held to three sigma (2.2 m each way across, 1 m up and down), the
      // wander written out (a box of 1.2, 0.7 and 1.5 m) and a body of 1.7 m, no bird comes nearer the line than 7 m by
      // that corner; the kit is told to keep 7 m clear and its answer is read. The draperies hang 30 m further left.
      const route = [];
      for (let s = 349; s <= 440.5; s += 18.2) { const q = atS(s, -13); route.push([q[0], q[1] + 1.5, q[2]]); }
      { const q = atS(447, -16); route.push([q[0], q[1] + 2, q[2]]); }
      for (let s = 440; s >= 348.5; s -= 18.2) { const q = atS(s, -19); route.push([q[0], q[1] + 2.5, q[2]]); }
      { const q = atS(342, -16); route.push([q[0], q[1] + 2, q[2]]); }
      await ctx.yield();
      const opts = { species: 'swifts', count: 14, size: 3.0, form: 'loose', speed: 15, spread: [2.2, 1.0, 14], wander: [1.2, 0.7, 1.5, 0.8], maxSigma: 3 };
      const party = await F.makeFlockAsync({ rng: R.party, ...opts, route, closed: true, keepClear: { path, dist: 7, from: 326 / Lp, to: 462 / Lp, step: 2 }, light: sunLit }, ctx.yield);
      life.push({ name: 'swifts up the staircase', ...opts, kept: party.kept, reach: party.reach, least: leastOf(route) });
      if (party.kept && party.kept.short > 0) dropFlock(party); else fauna.add(named(party, 'swifts-up-the-staircase'));
      await ctx.yield();
    }
    {
      // THE PARTY OVER THE LAKE: eight swifts on a narrow loop to the RIGHT of the line from 255 to 308 m flown: out along
      // the lane 9.5 m from the line, back along the lane 13.5 m from it, 2.4 to 3.2 m under the line's own height (some
      // 7 m over the water). The tallest tower stands behind the loop's near end, the right-hand islands beyond the far
      // lane. With the scatter held to three sigma and the wander written out no bird comes nearer the line than 6.5 m
      // in plan; the kit is told to keep 6.5 m clear and its answer is read.
      const route = [];
      for (let s = 259; s <= 304.5; s += 15) { const q = atS(s, 9.5); route.push([q[0], q[1] - 3.2, q[2]]); }
      { const q = atS(308, 11.5); route.push([q[0], q[1] - 2.8, q[2]]); }
      for (let s = 304; s >= 258.5; s -= 15) { const q = atS(s, 13.5); route.push([q[0], q[1] - 2.4, q[2]]); }
      { const q = atS(255, 11.5); route.push([q[0], q[1] - 2.8, q[2]]); }
      await ctx.yield();
      const opts = { species: 'swifts', count: 8, size: 3.0, form: 'loose', speed: 14, spread: [1.2, 0.8, 8], wander: [0.9, 0.6, 1.2, 0.8], maxSigma: 3 };
      const g = await F.makeFlockAsync({ rng: R.spare2.fork('passage'), ...opts, route, closed: true, keepClear: { path, dist: 6.5, from: 240 / Lp, to: 324 / Lp, step: 2 }, light: sunLit }, ctx.yield);
      life.push({ name: 'swifts over the lake', ...opts, kept: g.kept, reach: g.reach, least: leastOf(route) });
      if (g.kept && g.kept.short > 0) dropFlock(g); else fauna.add(named(g, 'swifts-over-the-lake'));
      await ctx.yield();
    }
    {
      // THE ESCORT: nine swifts fly with the visitor low over the river and the first terraces, 20 m ahead, 8.5 m to the
      // LEFT of the line and 1.5 m under its height, from 20 to 176 m flown (so the birds themselves are seen from 40 to
      // 196 m: they leave before the two towers, the nearer of which stands at 222 m). The left is the river's side. A
      // small spread and the wander written out; the kit clears each bird by itself (each: true) so that none comes
      // within 6 m of the line, and its answer is read.
      await ctx.yield();
      const opts = { species: 'swifts', count: 9, size: 3.0, spread: [1.0, 0.6, 6], wander: [0.9, 0.5, 1.2, 0.8], maxSigma: 3 };
      const along = { path, side: -8.5, up: -1.5, lead: 20, from: 20 / Lp, to: 176 / Lp };
      const g = await F.makeFlockAsync({ rng: R.spare2.fork('escort'), ...opts, along, keepClear: { path, dist: 6, from: 0, to: 216 / Lp, each: true, step: 2 }, light: inShade }, ctx.yield);
      life.push({ name: 'swifts escorting, the river', ...opts, along: { side: along.side, up: along.up, lead: along.lead, from: 20, to: 176 }, kept: g.kept, reach: g.reach, least: 8.5 });
      if (g.kept && g.kept.short > 0) dropFlock(g); else fauna.add(named(g, 'swifts-escorting'));
      await ctx.yield();
    }
    {
      // THE SWIFTS OF THE BANK hawk low up and down the bank, a narrow loop on the side of the line the great tree does not
      // stand on: up the lane 11.5 m from the line and 1.5 m over its height over the last 116 to 32 m of the line, back
      // down the lane 15.5 m from it and 6.5 m over its height. By rule a knot of the course that would lie within 4.5 m
      // in plan of a tree's stem is moved 2.5 m further from the line (twice at most). With the scatter held to three
      // sigma, the wander written out (a box of 1.0, 0.6 and 1.2 m) and a body of 1.7 m, no bird comes nearer the line
      // than 6.7 m by that corner; the kit is told to keep 6.5 m clear and its answer is read.
      const sideB = scene.userData.greatTree && scene.userData.greatTree.lat > 0 ? -1 : 1;
      const route = [], laneKnot = (s, lat0, up) => {
        let lat = lat0 * sideB, q = atS(s, lat);
        for (let k = 0; k < 2; k++) { let hit = false; for (const c of crownAt) if (Math.hypot(c[0] - q[0], c[2] - q[2]) < 4.5) hit = true; if (!hit) break; lat += 2.5 * sideB; q = atS(s, lat); }
        route.push([q[0], q[1] + up, q[2]]);
      };
      const s0 = Lp - 116, s1 = Lp - 32;
      for (let s = s0; s <= s1 + 0.5; s += 14) laneKnot(s, 11.5, 1.5);
      laneKnot(s1 + 7, 13.5, 4);
      for (let s = s1; s >= s0 - 0.5; s -= 14) laneKnot(s, 15.5, 6.5);
      laneKnot(s0 - 7, 13.5, 4);
      await ctx.yield();
      const opts = { species: 'swifts', count: 12, size: 3.0, form: 'loose', speed: 13, spread: [1.5, 0.8, 9], wander: [1.0, 0.6, 1.2, 0.8], maxSigma: 3 };
      const g = await F.makeFlockAsync({ rng: R.spare2.fork('gully'), ...opts, route, closed: true, keepClear: { path, dist: 6.5, from: (s0 - 28) / Lp, to: 1, step: 2 }, light: inShade }, ctx.yield);
      life.push({ name: 'swifts of the bank', ...opts, kept: g.kept, reach: g.reach, least: leastOf(route) });
      // (the kit says what it could not clear: a party that is short anywhere does not fly at all)
      if (g.kept && g.kept.short > 0) dropFlock(g); else fauna.add(named(g, 'swifts-of-the-bank'));
      await ctx.yield();
    }
    {
      // THE EGRETS: one party of eleven large white birds (the kit's long-necked, long-legged flyer in an egret's white,
      // yellow bill and dark legs) on a closed course on the fall's side of the line: low over the pool, 4 m above the
      // water and 12 m in from the fall's foot, then up past the fall to 30 m, 6 m in front of the falling water, and
      // down again: a tilted round 44 m long along the wall. The course's nearest knot is 11 m and more from the line
      // (the line crosses the pool 25 m and more from the fall); with the scatter held to three sigma and the wander
      // written out no bird comes within 6 m of the line; the kit is told to keep 6 m clear and its answer is read.
      const route = [], ax = -FALL.in[1], az = FALL.in[0];
      for (let i = 0; i < 12; i++) {
        const t = TAU * i / 12, c = Math.cos(t), sn = Math.sin(t), dep = 9 + 3 * sn;
        route.push([JPOOL.fx + FALL.in[0] * dep + ax * 22 * c, JPOOL.y + 4 + 13 * (1 - sn), JPOOL.fz + FALL.in[1] * dep + az * 22 * c]);
      }
      await ctx.yield();
      const opts = { species: 'flamingos', count: 11, size: 3.4, form: 'loose', speed: 9, spread: [2.4, 1.2, 16], wander: [0.8, 0.5, 1.0, 0.45], maxSigma: 3 };
      const palette = { body: '#f6f4ec', belly: '#ffffff', wingC: '#f0eee6', trail: '#e4e2da', tip: '#d6d4ca', beak: '#e8b020', head: '#f8f6f0', neckC: '#f8f6f0', legC: '#2a2622' };
      const g = await F.makeFlockAsync({ rng: R.spare2.fork('egrets'), ...opts, palette, route, closed: true, keepClear: { path, dist: 6, from: 470 / Lp, to: 660 / Lp, step: 2 }, light: sunLit }, ctx.yield);
      life.push({ name: 'egrets of the pool', ...opts, kept: g.kept, reach: g.reach, least: leastOf(route) });
      if (g.kept && g.kept.short > 0) dropFlock(g); else fauna.add(named(g, 'egrets'));
      await ctx.yield();
    }
    {
      // THE SWIFTS ABOUT THE RING wheel over the two figs, in the mouth of the alcove: a ring 11 m in radius about the place
      // 27 m over the ring's middle (96.6 m), tilting a metre and a half. The figs' leaves end 7 m under it; the line ends
      // 27 m under its middle. The kit is told to keep 12 m clear of the line's last 80 m and its answer is read.
      const route = [];
      for (let i = 0; i < 10; i++) { const a = TAU * i / 10; route.push([ringXZ[0] + Math.cos(a) * 11, RING.y + 27 + 1.5 * Math.sin(a * 2), ringXZ[1] + Math.sin(a) * 11]); }
      await ctx.yield();
      const opts = { species: 'swifts', count: 9, size: 3.0, form: 'loose', speed: 12, spread: [2.2, 1.0, 8], wander: [1.2, 0.7, 1.5, 0.8], maxSigma: 3 };
      const g = await F.makeFlockAsync({ rng: R.spare2.fork('ring'), ...opts, route, closed: true, keepClear: { path, dist: 12, from: (Lp - 80) / Lp, to: 1, step: 2 }, light: sunLit }, ctx.yield);
      life.push({ name: 'swifts about the ring', ...opts, kept: g.kept, reach: g.reach, least: leastOf(route) });
      if (g.kept && g.kept.short > 0) dropFlock(g); else fauna.add(named(g, 'swifts-about-the-ring'));
      await ctx.yield();
    }
    {
      // BUTTERFLIES, in three colours (a blue, an orange and a yellow). Each anchor is dealt by rule 8.6 m and more from the
      // line: 5 m of clear air, the 2.5 m of its roam and its body; and a metre and a half over the ground. Four companies:
      // in the shade of the bank, in the sun at the pillar's foot, over the left bank below the shelf (10 to 30 m
      // left of the line), and about the ring.
      const WINGS = [['#2a8cff', '#c8ecff'], ['#ff8a14', '#fff2d8'], ['#ffd91a', '#fff6c0']], roam = [1.8, 0.8, 0.55, 0.03];
      const inShaft = (x, y, z) => { const t = (SKY.y - y) / sunDir.y; return Math.hypot(x + sunDir.x * t - skyXZ[0], z + sunDir.z * t - skyXZ[1]) < SKY.r - 6; };
      const companies = [
        { name: 'butterflies of the bank', n: 58, s: [Lp - 160, Lp - 12], lat: [8.6, 21], y: [-5, 5], light: inShade, where: () => true },
        { name: 'butterflies in the sun', n: 36, s: [470, 610], lat: [8.6, 32], y: [-18, 2], light: sunLit, where: inShaft },
        { name: 'butterflies of the left bank', n: 26, s: [Lp - 60, Lp - 8], lat: [10, 30], side: -1, y: [-4, 10], light: inShade, where: () => true },
        { name: 'butterflies of the ring', n: 22, s: [Lp - 9, Lp + 5], lat: [8.8, 15], y: [-6, 8], light: inShade, where: () => true },
      ];
      for (const C of companies) {
        const r = R.flies.fork(C.name), anchors = [];
        for (let i = 0; i < 1200 && anchors.length < C.n; i++) {
          const s = r.range(C.s[0], C.s[1]), lat = (C.side || r.sign()) * r.range(C.lat[0], C.lat[1]), up = r.range(C.y[0], C.y[1]);
          const q = atS(Math.min(s, Lp - 0.5), lat), x = q[0] + (s > Lp ? endX * (s - Lp) : 0), z = q[2] + (s > Lp ? endZ * (s - Lp) : 0), y = q[1] + up;
          if (i % 150 === 149) await ctx.yield();
          if (y < groundAt(x, z) + 1.6 || nearLine(x, y, z).d < 8.6 || !C.where(x, y, z)) continue;
          anchors.push([x, y, z]);
        }
        await ctx.yield();
        if (!anchors.length) continue;
        const opts = { count: anchors.length, jitter: 0, size: 3.6, roam, varieties: WINGS };
        const b = F.makeButterflies({ rng: r.fork('kit'), positions: anchors, ...opts, keepClear: { path, dist: 5, from: (C.s[0] - 40) / Lp, to: 1, up: true, step: 1 }, light: C.light });
        life.push({ name: C.name, ...opts, kept: b.kept, reach: b.reach, least: leastOf(anchors) });
        // (the kit says what it could not clear: a company that is short anywhere does not fly at all)
        if (b.kept && b.kept.short > 0) { b.geometry.dispose(); b.material.dispose(); } else fauna.add(named(b, C.name.replace(/ /g, '-')), { light: false });
        await ctx.yield();
      }
    }
    await ctx.yield();
    // motes in the lit air (seed fluff on some visits): they show where the shaft finds them. By rule none is dealt within 4 m of
    // the line (they drift a metre at most)
    {
      const r = R.motes, n = fluff ? 520 : 900, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
      let k = 0;
      for (let i = 0; i < n * 6 && k < n; i++) {
        const near = r() < 0.6, y = r.range(18, 150), sh = (SKY.y - y) / Math.tan(SUN_EL), ang = r() * TAU, rr = Math.sqrt(r()) * (SKY.r + 6), size = fluff ? r.range(0.07, 0.14) : r.range(0.02, 0.045), sp = fluff ? r.range(0.25, 0.6) : r.range(-0.12, 0.2), phase = r(), br = r.range(0.5, 1.3);
        let x = skyXZ[0] - sunH[0] * sh + Math.cos(ang) * rr, z = skyXZ[1] - sunH[1] * sh + Math.sin(ang) * rr, yy = y;
        if (near) { const q = atS(lerp(515, 650, phase), (ang / TAU * 2 - 1) * 34); x = q[0]; z = q[2]; yy = q[1] + (rr / (SKY.r + 6) * 2 - 1) * 16; }
        if (i % 400 === 399) await ctx.yield();
        if (nearLine(x, yy, z).d < 4 || yy < groundAt(x, z) + 1) continue;
        iP.set([x, yy, z, size], k * 4); iQ.set([sp, 26, phase, br], k * 4); k++;
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = k;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, uniforms: caveU({ uFluff: { value: fluff ? 1 : 0 } }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.frustumCulled = false; m.name = 'motes'; m.renderOrder = 7; scene.add(m);
    }
    await ctx.yield();
    // threads of drops from the skylight's rim (three times as many after rain), a thin thread that falls beside the ring from
    // the dome's roof, and on a rare visit a sun shower: rain falling through the skylight, silver where the shaft lights it.
    // By rule no drop falls within 4 m of the line in plan (the ring's thread: 10 m and more from it in space).
    {
      const r = R.threads, rs = R.shower, rw = R.water, nT = Math.round((afterRain || shower ? 660 : 220) * det), nS = shower ? Math.round(1500 * det) : 0, nR = 150, n = nT + nS + nR;
      const iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
      let k = 0;
      for (let i = 0; i < nT; i++) {
        const ang = Math.floor(r() * 70) / 70 * TAU + r.range(-0.012, 0.012), r0 = SKY.r * (1 + 0.07 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7 + 4)) - r.range(0.5, 2.5), per = r.range(1.0, 1.5), ph = r(), br = r.range(0.7, 1.5);
        const x = skyXZ[0] + Math.cos(ang) * r0, z = skyXZ[1] + Math.sin(ang) * r0;
        if (i % 220 === 219) await ctx.yield();
        if (nearLineXZ(x, z).dh < 4) continue;
        const gy = groundAt(x, z), H = 168 - gy;
        iP.set([x, 168, z, H], k * 4); iQ.set([Math.sqrt(2 * H / 9.8) * per, ph, 0.05, br], k * 4); k++;
      }
      await ctx.yield();
      for (let i = 0; i < nS; i++) {
        const ang = rs() * TAU, rr = Math.sqrt(rs()) * (SKY.r - 4), per = rs.range(1.0, 1.3), ph = rs(), br = rs.range(0.5, 1.1);
        const x = skyXZ[0] + Math.cos(ang) * rr, z = skyXZ[1] + Math.sin(ang) * rr;
        if (i % 250 === 249) await ctx.yield();
        if (nearLineXZ(x, z).dh < 4) continue;
        const gy = groundAt(x, z), H = 172 - gy;
        iP.set([x, 172, z, H], k * 4); iQ.set([Math.sqrt(2 * H / 9.8) * per, ph, 0.04, br], k * 4); k++;
      }
      await ctx.yield();
      { const q = atS(Lp - 0.5, 12.5), bx = q[0] + endX * 5, bz = q[2] + endZ * 5;       // the ring's thread: three strands half a metre apart, on its right
        for (let i = 0; i < nR; i++) {
          const x = bx + (i % 3 - 1) * 0.5 * -endZ + rw.range(-0.08, 0.08), z = bz + (i % 3 - 1) * 0.5 * endX + rw.range(-0.08, 0.08), per = rw.range(1.0, 1.25), ph = rw(), br = rw.range(1.0, 1.8);
          toAxis(x, z, axT); const gy = groundAt(x, z), top = roofAt(axT.a, axT.l) - 1, H = top - gy;      // (it falls from the dome's roof)
          if (i % 30 === 29) await ctx.yield();
          if (nearLine(x, gy + 8, z).d < 10) continue;
          iP.set([x, top, z, H], k * 4); iQ.set([Math.sqrt(2 * H / 9.8) * per, ph, 0.06, br], k * 4); k++;
        } }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]), 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = k;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: DRIP_VERT, fragmentShader: DRIP_FRAG, uniforms: caveU(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.frustumCulled = false; m.name = 'rim-threads'; m.renderOrder = 6; scene.add(m);
    }
    await ctx.yield();

    // ---------------- per frame: only uniform values change
    function update(dt, time, camera, u) {
      CU.uTime.value = time;
      wind.update(time);
      fauna.update(dt, time, camera, u);
      // the tents' light breathes a very little (the head lamps are steady: only the damp air that drifts through their beams moves)
      for (let k = 0; k < 2; k++) {
        const l = lampList[k], b = 1 + 0.04 * Math.sin(time * 1.3 + l.phase) + 0.02 * Math.sin(time * 3.1 + l.phase * 2);
        lampC[k].copy(l.col).multiplyScalar(l.power * b); tentU[k].uGlow.value = 1.5 * b;
      }
    }
    // (where the fall and its pool stand, kept in the scene's data: the pool's middle and level, the fall's foot and
    // head, each with its distance from the line and the metres flown where the line is nearest)
    { const top = FALL.rows[0], places = scene.userData.places = {};
      let q = nearLineXZ(JPOOL.x, JPOOL.z); places.pool = { x: JPOOL.x, y: JPOOL.y, z: JPOOL.z, r: JPOOL.r, lineOver: q.y - JPOOL.y, lineAside: q.dh, s: q.s };
      q = nearLineXZ(JPOOL.fx, JPOOL.fz); places.fall = { footX: JPOOL.fx, footZ: JPOOL.fz, headY: top[1], height: FALL.height, lineAside: q.dh, s: q.s }; }
    // the pace by metres flown: 16 m/s along the river, 18.5 up the staircase, 14.5 through the mouth and the reveal, 15.5
    // down to the pool, 14 past the fall, 14.5 up the bank, easing to 12 at the ring: the cave is about half the flight's
    // time, the reveal and the dome about a fifth, the forest and the ring about a third
    const speedAt = (s) => 16 + 2.5 * smoothstep(100, 140, s) - 4 * smoothstep(400, 440, s) + 1 * smoothstep(490, 520, s) - 1.5 * smoothstep(555, 580, s) + 0.5 * smoothstep(610, 640, s) - 2.5 * smoothstep(Lp - 100, Lp, s);
    // THE GAZE, by metres flown over the whole length of the line (each with its reason)
    const pois = [
      // (150 to 226 m: up the terraces the eye rests on the tallest tower's lamp-washed flank until the two towers are abeam)
      { at: new V3(towers[1].x, towers[1].y + 40, towers[1].z), from: 150 / Lp, to: 226 / Lp, weight: 0.3 },
      // (244 to 296 m: over the lake the eye goes to the leaning stump with the broken top, past the bell)
      { at: new V3(towers[2].x + towers[2].leanX * 20, towers[2].y + 20, towers[2].z + towers[2].leanZ * 20), from: 244 / Lp, to: 296 / Lp, weight: 0.3 },
      // (396 to 474 m: up the last stairs and through the mouth the eye is on the pillar of sun where it stands on the
      // forest, its middle at 72 m)
      { at: new V3(skyXZ[0] - sunDir.x * (SKY.y - 72) / sunDir.y, 72, skyXZ[1] - sunDir.z * (SKY.y - 72) / sunDir.y), from: 396 / Lp, to: 474 / Lp, weight: 0.4 },
      // (462 to 566 m: coming down into the dome the eye goes to the fall, a place 20 m up its drop, so that the white
      // water is seen whole from its head to its pool; it lets go as the line reaches the pool)
      { at: new V3(FALL.rows[0][0], JPOOL.y + 20, FALL.rows[0][2]), from: 462 / Lp, to: 566 / Lp, weight: 0.55 },
      // (598 m to 30 m short of the end: up the staircase the eye is lifted to a place 8 m over the ring, so that the ring,
      // the hanging garden over it and the slender fall beside it are seen together)
      { at: new V3(ringXZ[0], RING.y + 8, ringXZ[1]), from: 598 / Lp, to: (Lp - 30) / Lp, weight: 0.4 },
    ];
    return {
      scene, path, duration: 45.5, pace: (u) => speedAt(clamp(u, 0, 1) * Lp) / 16.6,
      camera: { fov: 62, near: 0.3, far: 2400, lookAhead: 22, sway: 0.5, bank: 0.5 },
      portal: { shape: 'circle', radius: 7, color: '#ffd9a0', glow: 0.55, tilt: true, revealDistance: 1600, veil: '#123036' },
      post: { exposure: 2.0, bloom: { strength: 0.4, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.14, contrast: 1.12, tint: '#ffffff', shadowTint: '#020506', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      pois,
      update,
      // (everything this world made hangs in its scene, where the engine finds and frees it; what was made and found no place
      // was given back at once, in build; the kit's creatures hold their own and are freed here)
      dispose() {
        for (const it of fauna.items) { const f = it.f; if (f.geometry) f.geometry.dispose(); if (f.material) f.material.dispose(); }
        if (matCrown.map) matCrown.map.dispose();                         // (the leaves' one atlas, shared by every plant of the kit's)
      },
    };
  },
};
