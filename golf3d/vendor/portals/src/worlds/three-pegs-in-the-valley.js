// Three Pegs in the Valley: a red canyon desert at low sun, in flat earth inks and one cool shadow ink under a banded sky.
//
// Three rock needles stand in a row and five graded millstone rings of banded sandstone lift off, cross the sky and settle from
// needle to needle by the true moves of the puzzle; up the valley three giants whose dance has come apart and stopped. At the
// way in stands the quarry they came from: one wheel 150 m across, sawn free of its bench all round, in the open bay of a
// mesa quarried away behind it in terraces, and one ring more only begun on the bay's left side.
// VERSION 3 ADDS: the quarry ring as a wheel of the world's own make in a round socket, the bench stepped down to the
// sand beside the line, a ring begun (QUARRY, BAY); and the way out raised into the open air beyond the gate, where it
// shows through the gate's hole on the way to the gate (the last three legs, EYE). Every place is typed below in metres
// of the plan.
// The puzzle runs on the world's clock alone; shadows fall by the one fixed sun direction; built on our older engine and kit as
// they are (kit: none; makePath and makeNoise from src/kit/core.js).
//
// HOW THE STYLE IS HELD
//   Everything is made from one makeStyle instance (src/parts/three-pegs-in-the-valley.js): one unlit ink rule, an ink or its
//   shaded tone, told by the face's normal against the one fixed sun direction (16.5 degrees up, the same in every edition) or
//   by an analytic cast toward it. Rock is level strata built as geometry; no texture, gradient, outline, fog or full-screen
//   pass. No line is drawn inside a face, so no footprint filter is used anywhere in this file.
//   Mesas, hoodoos, the pile of blocks, the fallen ring, the gate, the quarry (its ring, its bench, the bay's floor and
//   terraces) and the two great cut drums before the first needle cast in the shader
//   like the needles and the rings, so their shadows fall on floor, rock, boulders and scrub alike. Boulders, cut stones, the
//   forms of the floor, scrub standing and rolling, the boat rock, the far mesas, the far towers with their rings and the
//   vultures throw floor polygons projected by the same sun direction. They are drawn after the floor layers and before the
//   bodies, in two steps that darken a point once however many polygons cover it (the style kit says how), by the same share
//   as a cast does. The floor's own strips of shade (a dune's lee, the shade under a wash's bank) are drawn after the second
//   step in their shaded ink, so a built shadow over one darkens it no further.
//   On a mesa's top the shadows of its tiers and boulders are polygons cut off inside the rim.
//   The sky is built and stands in the world: a dome of eight level flat bands about a constant place, the sun's flat disc and
//   two flat rings round it in the sun's own direction, and banks of slab clouds standing in three tiers.
//   Far bodies stand in three paler, bluer inks fixed at build by place: mesas 320 m and more from the route's track, then the
//   two rings of the skyline; the eleven far ruined towers stand in those last two.
// THE CLOCK
//   update() takes the time alone: it passes it to the hero (ring poses, casts, dust) and to one shared uTime, by which ripple
//   marks, wind ribbons, cloud slabs, scrub standing and rolling and vultures move in their vertex shaders;
//   it turns and nods the gate and sets its cast. It never reads u
//   and never reads the camera.
// CLEARANCE
//   Every body is placed at build; nothing is moved, hidden or faded on the camera's account; what moves, moves by the clock.
//   The build measures against the flown line (sampled every 2 m): each body's own shape; the whole lane of every near ring
//   (the upright columns over the three needles and the level run between them, which hold at every value of the clock); and
//   every tall ring, one that stirs in every pose 0.125 s apart through the whole period of its own motion; and the stone of the
//   fallen ring; and the gate's three courses in every pose 0.125 s apart through one whole nod; and the quarry's ring, its
//   bench with its steps, and the floor and terraces of its bay; and the drum cut from the quarry ring's hole. The result is returned as
//   clearance { least, what, rings, ringWhat, fallen, gate, quarry (the ring), bench, bay, core }. A free thing that would stand inside its margin is not placed.
// THE FLIGHT
//   The line comes in 34 m up over the sand before the quarry, sinking to 25 m, the gaze drawn up to its ring over the whole
//   first straight, and passes the bench's steps on its left; climbs to 52 m in a right turn toward the first
//   needle, comes down to 28 m past three cut drums, and goes round the needle's outer side, 80 m from it at the nearest
//   and far under the height of its lane, the gaze drawn up to it; runs down the far side of the row 29 to 38 m up as far
//   as the third needle, closing on the row, with the gaze drawn to the second needle as it passes; climbs into a great
//   right turn in the open round the fallen ring, the gaze drawn to the ring and then, from 74 m up, east over its rim;
//   and flies toward the sun past the giants, through the hole of the gate (GATE) 61 m up with the gaze drawn to the sun,
//   and on up to the way out, which stands 80 m up in the open air 145 m beyond the gate, about 111 m west of the tallest
//   giant.
//   WHAT A CHANGED LINE CHANGES IN THE SCATTER. Ripple marks, boulders, standing scrub, rolling lanes and dune lees are kept
//   or dropped by a candidate's distance from the line and by the line's height there. For ripple marks and boulders that
//   test also decides whether some draws are taken, so a line that runs elsewhere changes a part of their deal further on
//   as well; scrub, lanes and lees take every draw first and are then kept or dropped. The test reads no seed by its number
//   (a candidate's own draws stand in it), so a changed line works the same way on every seed; how much of each kind changes
//   depends on the line and on the seed, and a small change of the line can leave a seed's lees or lanes as they were.
import * as THREE from 'three';
import { makePath, makeNoise } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/three-pegs-in-the-valley.js';

// ---------------------------------------------------------------- editions (chosen once at build; no place, pose or sun direction changes)
// palette: sky cream, sand, ochre, red, oxblood, maroon, the shadow ink. far: the pale ink far bodies go toward.
// bands: the sky's level bands from the skyline up. disc: the sun, then the two flat rings round it (inner, outer).
// cloud: a slab cloud's body, its underside on the sun's side, its underside elsewhere. moon: the rare second disc and its ring.
const EDITIONS = {
  red: { palette: ['#F4E6CF', '#E6C48E', '#D9963F', '#C25A34', '#8E3529', '#5A2530', '#262C9A'], far: '#B4A6CC', wet: false,
    bands: ['#F7DDA0', '#F4C98A', '#EFB184', '#E39A8C', '#CF8A9B', '#B07FA6', '#8F78A8', '#7470A2'], disc: ['#FFF4C8', '#FBE5AC', '#F6D69C'],
    cloud: ['#9A78A6', '#F3C27C', '#DC98A2'], moon: ['#F3EAF4', '#D9C2DC'] },
  rose: { palette: ['#F3DDD8', '#E9CDB8', '#D6965F', '#C8685C', '#964252', '#643050', '#3A3C9E'], far: '#C2B4D8', wet: false,
    bands: ['#F9E3D0', '#F6CFC4', '#EEB6BE', '#DC9FBC', '#C08FBE', '#A183BC', '#847BB4', '#6C76AC'], disc: ['#FFF7E8', '#FBE9DC', '#F5D6D0'],
    cloud: ['#9C84B8', '#F7CFB8', '#E3A6C0'], moon: ['#F6F0FA', '#DCCDE6'] },
  wet: { palette: ['#CDBBA6', '#B98F66', '#A66018', '#9A4A30', '#723028', '#4A222C', '#1C2478'], far: '#8C86A8', wet: true,
    bands: ['#E8C9A0', '#DDAE8C', '#C99383', '#AE7F86', '#8E7088', '#72648A', '#5A5A86', '#474F7C'], disc: ['#F8E6BC', '#EDD2A2', '#DDBA94'],
    cloud: ['#6C5C80', '#E0AE82', '#B48890'], moon: ['#DCD6E2', '#B4A8C0'] },
};
// the band edges, in degrees above the level of the sky's centre: band i lies between BAND_EDGES[i] and BAND_EDGES[i + 1]
const BAND_EDGES = [0, 4, 9, 15, 22, 30, 40, 54, 90];
// the sky stands about this constant place (x, d), 30 km in radius; the sun's disc is 3.2 degrees in radius as seen from there
const SKY_AT = [200, 600], SKY_R = 30000, DISC = [3.2, 5.2, 7.4];

// ---------------------------------------------------------------- the plan of the valley: places are (x, d), d metres down-course (z = -d)
// mesas: centre x, centre d, across, along, height. Mesa i carries the box casts 3 i, 3 i + 1 and 3 i + 2, except the first.
// The first is the quarry's mesa: it is built from BAY below, not from these figures (only its sieve is used: a circle
// (x, d, radius) that the scatter's first sieve keeps clear for it); its floor carries box 0 and its terraces carry boxes
// 30 to 35 (boxes 1 and 2 stay unused).
const MESAS = [
  { x: -150, d: 149, w: 50, l: 50, h: 112, bay: true, sieve: [-135, 60, 118] },
  { x: 177, d: 10, w: 130, l: 110, h: 30 },
  { x: 772, d: 916, w: 150, l: 113, h: 100 },
  { x: -600, d: 640, w: 180, l: 200, h: 60 },
  { x: 345, d: 235, w: 120, l: 100, h: 24 },
  { x: 350, d: 1260, w: 300, l: 220, h: 99 },
  { x: 30, d: 1030, w: 190, l: 150, h: 84 },
  { x: -370, d: 250, w: 150, l: 170, h: 90 },
];
// THE QUARRY'S MESA, quarried down into an open bay. Its frame: the origin (x, d) on the sand, s along the plan bearing
// face - 90, q toward the plan bearing `face` (toward the country the line comes in over), in metres. floor: the rock that is
// left at the bench's level behind the bench and between and behind the two sides, [s0, s1, q0, q1] and its height. left and
// right: the two sides of the bay, each a stack of terraces, bottom up, as [the height of its top, s0, s1, q0, q1]; a terrace
// stands on the one before it, the first of the left side on the sand and the first of the right side on the floor. Between
// the two sides nothing stands over the floor but the ring. The same on every seed.
const BAY = { x: -92, d: 44, face: 155, floor: [-132, 108, -140, -70], floorTop: 47.4,
  left: [[84, -188, -126, -120, -24], [128, -188, -146, -114, -30], [172, -188, -167, -106, -38]],
  right: [[72, 62, 104, -140, -74], [96, 77, 104, -134, -82], [118, 91, 104, -128, -90]] };
// THE QUARRY RING, standing in the bay: one colossal wheel of the world's own make, sawn free of the rock all round but
// at its back below the bench's top. (x, d): the middle of the ring's front face on the plan; face: the plan bearing that
// face looks toward (the bay's own). The ring is R in radius with a hole of r, its centre y metres up, `thick` thick, of
// one ink with the bed named `seam` bared in its seams and in the `furrows` furrows that dress its front face round the
// hole; that face stands `proud` metres before the bench's front. The
// bench is `bench` metres tall, runs from benchFrom to benchTo along the ring's face (metres from the ring's middle) and
// `benchDeep` metres back from its own front, into the rock of the bay. kerf: the width of the cut that frees the ring, a
// round socket in the bench about the ring's own centre, open to the front and to the bench's top and as deep as the ring's
// back. steps: the lower terraces by which the bench comes down to the sand on the side the line passes, each as [its
// height, the s at which it ends]. begun: one ring more, only begun, on the cut front of the bay's left side: a face from
// `from` to `to` along s and `top` metres tall in the plane q, with two round grooves about (s, y): the stone's outline, R in
// radius, `wide` wide and `deep` deep, and its hole, r in radius, `holeWide` wide and `holeDeep` deep (the face carries the
// id of the bay's sides, on whose rock it stands). The drum cut from the
// ring's hole is the first of STONES. The same on every seed.
const QUARRY = { x: -136.7, d: 45.2, face: 155, R: 75, r: 25, y: 75, thick: 30, proud: 8, ink: 'red', seam: 'oxblood', furrows: 4, kerf: 9, bench: 48, benchFrom: -88, benchTo: 84, benchDeep: 44,
  steps: [[36, 94], [24, 104], [12, 114]],
  begun: { s: -117, y: 44, q: -1, from: -146, to: -89, top: 82, R: 23, wide: 4, deep: 3, r: 7, holeWide: 3, holeDeep: 2 } };
// Pieces of cut stone on the sand, at the quarry's foot, behind the way in, about the place the way out stands over, south of the gate's shadow and (the last four) off the
// bench's steps and beside the line before the first needle, two of those 28 and 40 m across, lying low and part sunk: drums and half drums
// whose round faces carry the strata as straight stripes.
// x, d, y of the middle of the face that shows; radius; thickness; the plan bearing toward which that face leans and its
// tilt from level (degrees); the turn of the stripes about the face's own axis (degrees); the strata height (m) at which its
// stripes begin; half (1: only the half over its own middle line stands, broken along a bed; 2: that half stood on its broken edge);
// and, for a great piece only, which of the style's two piece casts it carries (1 or 2) in place of a floor polygon.
const STONES = [
  [-128, -10, 8, 22, 15, 165, 26, 20, 50, 0],
  [-60, -40, 3, 7, 5, 120, 14, 70, 21, 0],
  [-78, -22, 5, 11, 8, 160, 32, 100, 60, 1],
  [-150, -30, 2.5, 6, 4, 200, 10, 130, 9, 0],
  [-28, 52, 3.5, 8, 6, 100, 18, 40, 30, 0],
  [-45, 38, 3, 6.5, 5, 140, 22, 110, 15, 0],
  [-44, -196, 4, 10, 7, 140, 20, 15, 12, 0],
  [12, -232, 3, 7, 5, 170, 12, 80, 40, 1],
  [279, 686, 3, 8, 5, 100, 12, 60, 33, 0],
  [-110, 760, 4, 10, 6, 250, 14, 40, 20, 0],
  [-86, 734, 5, 13, 7, 240, 12, 100, 44, 0],
  [-36, 727, 3.5, 9, 6, 260, 10, 150, 9, 1],
  [298, 700, 4, 11, 6, 120, 10, 120, 9, 0],
  [214, 722, 2.5, 6, 4, 108, 14, 30, 20, 0],
  [318, 716, 3, 7, 5, 108, 8, 10, 62, 0],
  [236, 806, 3.5, 9, 6, 108, 12, 80, 44, 0],
  [-22, 72, 3, 8, 5, 150, 12, 60, 21, 0],
  [22, 208, 3, 8, 5, 150, 12, 70, 45, 0],
  [56, 216, 6.5, 14, 9, 165, 10, 25, 30, 0, 1],
  [34, 234, 4.5, 20, 8, 170, 9, 40, 12, 1, 2],
];
// the far skyline in two rings about FAR_CENTRE: eighteen mesas about 1150 m out and fourteen about 2300 m out. A mesa whose
// bearing is within 45 degrees of the sun's is kept low, so that its shadow ends far short of the valley and it stands under the sun's disc.
const FAR_CENTRE = [180, 550];
const farRing = (n, D0, dD, w0, h0, k) => Array.from({ length: n }, (_, i) => {
  const bearing = (i + 0.5 + 0.28 * Math.sin(i * 2.7 + 0.4 + k)) * Math.PI * 2 / n, D = D0 + dD * Math.sin(i * 1.9 + 1 + k);
  const sunward = Math.cos(bearing - 108 * Math.PI / 180) > 0.7;
  return { x: FAR_CENTRE[0] + Math.sin(bearing) * D, d: FAR_CENTRE[1] + Math.cos(bearing) * D, w: w0 * (1 + 0.27 * Math.sin(i * 3.3 + 2 + k)), l: w0 * (0.82 + 0.17 * Math.sin(i * 5.1 + k)),
    h: sunward ? h0 * 0.48 : h0 * (1 + 0.29 * Math.sin(i * 4.1 + 0.7 + k)) };
});
const FAR_MESAS = [farRing(18, 1150, 190, 400, 190, 0), farRing(14, 2300, 260, 760, 260, 3.1)];
// hoodoos: x, d, height. Two knots of three stout leaning rocks, each of its own shape: one outside the great turn to its west,
// one north of the last leg's start. Hoodoo i carries the cone casts 12 + 2 i (lower half) and 13 + 2 i (upper half).
const HOODOOS = [[-300, 690, 46], [-316, 708, 30], [-284, 714, 37], [-10, 905, 42], [8, 929, 28], [-26, 935, 35]];
// the pile of five squared blocks, 9 m each way, beside the wash that crosses the near row: three in a line on the sand and two
// on them, each over the joint between two (half of its base on each). BLOCKS: place along the line (m), y0, y1, own turn (rad).
// BLOCKS_AT: x, d and the line's turn (rad). Block i carries the box cast 24 + i.
const BLOCKS_AT = [-215, 352, 0.5];
const BLOCKS = [[-9.2, 0, 9, 0.03], [0, 0, 9, -0.04], [9.2, 0, 9, 0.02], [-4.6, 9, 18, 0.05], [4.6, 9, 18, -0.03]];
// THE FALLEN RING inside the great turn: one ring of the giants' strata, 55 m in radius and 15 m thick with a hole of 24 m, its
// centre 12 m over the sand. Its axis leans 32 degrees toward the plan bearing 130, so the rim on that side is under the sand
// (the stone comes out of the sand about 29 m south-east of its centre) and the rim opposite stands 48 m out of it. arc: the share of
// the circle that stands (the rest is broken out); gapAt: the plan bearing, from its centre, of the middle of the piece broken
// out. It carries ring cast 14. The same on every seed.
const FALLEN = { x: -156, d: 637, y: 12, R: 55, r: 24, h: 15, lean: 130, tilt: 32, arc: 0.93, gapAt: 25, key: 58.3 };
// sand drifted against it where it comes out of the sand: heaps at x, d, with half length, half width and height (m)
const DRIFTS = [[-153, 595.5, 13, 7, 4.5], [-134, 618.5, 10, 6, 3.5], [-114.5, 641.5, 13, 7, 5]];
// THE GATE: one colossal ring of the giants' strata that hangs upright in the open air across the last straight, and the flown
// line passes through its hole. Its centre stands over the straight's line at (x, d), y metres up; its face is square to the
// sun's bearing and its axis leans `lean` degrees from level, the top of the ring toward the side the line comes from, so that
// the low wall of its hole rises toward the sun. R and r are its outer radius and the radius of its hole. It is three courses
// about the one hole, each built as every ring is: an outer course (R down to outr, outH thick), a sunk band behind
// (bandH thick, its rim and hole hidden inside the other two) and a hub round the hole (out to hubR, hubH thick). It turns
// about its own axis once in `turn` seconds and nods `nod` degrees either way about its level diameter every `nodEvery`
// seconds, by the clock alone. It carries the style's second world ring cast: the whole annulus R to r, h thick. Nothing
// stands under it or joins it to the ground. notches: bites through its outer course and the band behind it, each as [the
// angle round the ring (rad), its width (rad), its depth (m)]; they turn with the ring, and the cast is the whole annulus
// without them. The same on every seed.
const GATE = { x: 134, d: 780, y: 92, R: 82, r: 52, h: 20, lean: 8, turn: 137, nod: 2.5, nodEvery: 13.7,
  outr: 68, outH: 20, bandR: 79.5, bandr: 53.5, bandH: 13, hubR: 66, hubH: 24, key: 71.3,
  notches: [[0.7, 0.2, 8], [2.6, 0.15, 6.5], [4.2, 0.22, 8.5], [5.5, 0.13, 6]] };
// THE FAR RUINED TOWERS, south-west, west and north-west of the row: eleven tall needles in the two pale far inks, each with rings where
// they stopped. x, d, height, far layer (1 or 2), weathering key, then its rings: [kind, radius, a, b, c]; a ring's radius is
// given for a needle 235 m tall and grows with the needle. The strata table reaches 435 m, so every needle here (420 m at
// most) is built to its full height; its rings are sized and placed, and its floor shadow is thrown, by the same height.
//   'foot': level on the needle's foot, or on the ring under it.   'foot2': the same, 7 degrees askew.
//   'caught': askew on the shaft, a = height (share of the needle), b = tilt, c = lean bearing.
//   'hang': in the air beside it, a = height (share), b = tilt, c = bearing of its place and lean, 1.9 radii off.
//   'fallen': part buried at the foot, a = bearing of its place (1.5 radii off and a little more), b = tilt, c = lean bearing.
//   'edge': on edge against the foot, a = bearing of its place, tilt 76, leaning back on the needle.
// Every figure is a constant; their outlines come from a noise of the constant FAR_SEED. Nothing there moves.
const FAR_SEED = 5179;
const FAR_TOWERS = [
  [-441, 105, 280, 1, 3.1, [['foot', 34], ['caught', 30, 0.55, 27, 200], ['fallen', 26, 60, 20, 240]]],
  [-549, 120, 330, 1, 8.7, [['caught', 38, 0.38, 33, 80], ['hang', 30, 0.7, 50, 310], ['edge', 28, 150]]],
  [-468, -2, 250, 1, 14.2, [['foot', 36], ['foot2', 28], ['fallen', 30, 300, 24, 120]]],
  [-760, 757, 340, 1, 19.9, [['caught', 36, 0.62, 30, 140], ['fallen', 32, 100, 22, 280], ['foot', 40]]],
  [-653, 797, 290, 1, 24.4, [['foot', 38], ['caught', 28, 0.45, 38, 20], ['edge', 30, 200]]],
  [-720, 860, 250, 1, 31.6, [['hang', 30, 0.75, 55, 60], ['fallen', 34, 170, 18, 20]]],
  [-735, 540, 320, 1, 37.3, [['foot', 40], ['caught', 32, 0.5, 26, 320], ['fallen', 28, 40, 25, 200]]],
  [-1261, 764, 400, 2, 42.8, [['caught', 48, 0.5, 30, 100], ['foot', 52]]],
  [-1297, 1028, 360, 2, 47.5, [['caught', 44, 0.66, 36, 250], ['fallen', 46, 120, 20, 300]]],
  [-700, 1662, 420, 2, 53.1, [['foot', 54], ['caught', 46, 0.42, 32, 160], ['hang', 40, 0.72, 52, 110]]],
  [-618, 1839, 380, 2, 58.6, [['caught', 44, 0.58, 28, 300], ['edge', 42, 140]]],
];
// great boulders in four groups of three: north-east of the far side of the row, north of the great turn, south of the last leg's start, south of the last straight: x, d, height, radius
const GREAT = [[70, 470, 30, 18], [48, 486, 20, 13], [84, 494, 14, 10], [-200, 880, 30, 18], [-226, 892, 20, 13], [-190, 905, 14, 10],
  [-10, 772, 16, 10], [6, 760, 11, 7.5], [-2, 748, 5, 4], [199, 703, 10, 6.5], [215, 695, 6, 4.5], [189, 691, 4, 3.2]];
const BOAT = { x: -42, d: 563, len: 56, wide: 16, h: 17, turn: 2.5 };
// washes: centre lines (x, d) of ribbons 24 m wide: down the entry between the first two mesas; across the near row; along the far
// side of the near row under the boat rock and past the south side of the fallen ring; along the north side of the last leg
const WASHES = [
  [[-30, -90], [-6, -20], [-16, 60], [8, 130], [-10, 200], [16, 262], [60, 300]],
  [[-300, 330], [-200, 300], [-120, 318], [-40, 290], [30, 300], [90, 330], [160, 322], [250, 350], [330, 340]],
  [[190, 345], [127, 384], [63, 442], [5, 490], [-25, 545], [-60, 578], [-130, 572], [-205, 575], [-275, 625], [-340, 670]],
  [[-40, 900], [0, 862], [50, 838], [110, 822], [175, 800], [240, 782], [300, 772], [360, 780], [430, 770], [520, 790]],
];
const WASH_WIDE = 24;

// ---------------------------------------------------------------- the route (the same on every seed)
// A turtle on the plan: heading in degrees from the course toward +x. Straights are cut into steps of about 38 m and arcs into
// steps of about 26 m. Eye heights, speeds, the spans of the gaze and the stretches of the floor's forms are all keyed by the
// plan metre of the legs (1762.5 m in all). The built line is longer by its climbs: the build reads off it the share of its
// length at which each of the route's points lies, and takes every place between two points straight (shareAt, metreAt).
const EYE = [[0, 34], [120, 25], [262, 51.721], [342, 28], [360, 30.702], [404, 26], [588, 34], [700, 38], [900, 30], [972, 30], [1084, 74], [1242, 40], [1371, 32], [1480, 38], [1546, 52], [1616, 62], [1762, 80], [1830, 80]];
const SPEED = [[0, 26], [150, 25], [435, 24], [580.35, 27], [892.1, 30], [1045, 27], [1220, 31], [1349, 33], [1502, 29], [1641, 25], [1830, 21]];
const SPEED_MEAN = 29;
const EYES_TO = Math.max(...EYE.map((e) => e[1])) + 7;   // 87 m: 7 m over the line's highest eye (the highest key of EYE, at the way out): no eye of the line rides as high
const sstep = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
function keyed(table, s) {
  for (let i = 1; i < table.length; i++) if (s <= table[i][0]) { const a = table[i - 1], b = table[i]; return a[1] + (b[1] - a[1]) * sstep((s - a[0]) / (b[0] - a[0])); }
  return table[table.length - 1][1];
}
// The legs: 150 m straight in over the sand toward the quarry, 34 to 25 m up; a right turn past the quarry's steps, climbing, and down toward the first needle; a left turn of radius 102 m
// round its outer side; 379 m down the far side of the row, closing on the row's line by 5.4 degrees (about 99 m from it at the
// first needle, 87 m at the second, 70 m at the third); the great right turn in the open in two arcs, 53.5 degrees of radius
// 110 m and 101 degrees of radius 130 m with 24.5 m of straight between them, round the fallen ring; then toward the sun past
// the giants (108.6 m straight, then 12 degrees to the right on a radius of 500 m); 50 m straight on the sun's own bearing, through the gate's hole 32 m into
// that straight; then 11 degrees to the right on a radius of 220 m and 86 m straight, climbing, to the way out at the line's end: (265.0, 716.3) on the plan, 80 m up.
function routePoints() {
  const pts = [], at = [], RAD = Math.PI / 180;
  let x = -15, d = -172, h = 0, s = 0;
  const put = () => { pts.push([x, keyed(EYE, s), -d]); at.push(s); };
  const go = (len) => { const n = Math.max(1, Math.round(len / 38)); for (let i = 0; i < n; i++) { x += Math.sin(h * RAD) * len / n; d += Math.cos(h * RAD) * len / n; s += len / n; put(); } };
  const arc = (r, deg, right) => {
    const n = Math.max(2, Math.round(r * deg * RAD / 26));
    for (let i = 0; i < n; i++) {
      const h1 = h + (right ? 1 : -1) * deg / n, c0 = Math.cos(h * RAD), s0 = Math.sin(h * RAD), c1 = Math.cos(h1 * RAD), s1 = Math.sin(h1 * RAD);
      if (right) { x += r * (c0 - c1); d += r * (s1 - s0); } else { x += r * (c1 - c0); d += r * (s0 - s1); }
      h = h1; s += r * deg * RAD / n; put();
    }
  };
  put();
  go(150); arc(220, 50, true); go(100); arc(102, 108.5, false); go(379.39); arc(110, 53.5, true); go(24.51); arc(130, 101, true); go(108.6); arc(500, 12, true); go(50); arc(220, 11, true); go(86);
  return { pts, at };                              // the points of the line and the plan metre of each
}

// fixed points that draw the gaze: x, y, d, then the span of the route (from and to, in plan metres), the weight and, where
// given, the share of the span over which the pull eases in and out (0.3 where not given)
const POIS = [
  [-137, 80, 45, 0, 150, 0.9],                  // up to the quarry ring from the way in, over the whole first straight (it ends at plan metre 150)
  [72, 55, 290, 150, 379, 0.85],                // then out over the plain, up to the first needle and its lane
  [92, 68, 276, 326, 540, 0.85],                // the first needle's middle, from under it
  [-52, 50, 384, 549.18, 845.31, 0.8],          // the second needle
  [FALLEN.x, 22, FALLEN.d, 809.44, 1060.98, 0.8],   // the fallen ring
  [361, 165, 647, 1005, 1166, 0.85],            // east over the fallen ring's rim, toward the gate and the giants
  [275, 90, 848, 1131, 1325, 0.8],              // the first giant and the gate together
  [2870, 944, -108, 1272, 1696, 0.85, 0.25],    // far off in the sun's own direction from the gate's centre: the sun through the hole
];

// distance from a point to a ring (a slab annulus of outer radius R, hole r, thickness h about a unit axis)
function ringDistance(px, py, pz, q) {
  const ox = px - q.x, oy = py - q.y, oz = pz - q.z, a = ox * q.ax[0] + oy * q.ax[1] + oz * q.ax[2];
  const rad = Math.sqrt(Math.max(0, ox * ox + oy * oy + oz * oz - a * a));
  return Math.hypot(Math.max(0, rad - q.R, q.r - rad), Math.max(0, Math.abs(a) - q.h / 2));
}

export default {
  id: 'three-pegs-in-the-valley',
  name: 'Three Pegs in the Valley',
  category: 'bizarre',
  weirdness: 0.55,
  media: ['air', 'open'],

  async build(ctx) {
    const vary = ctx.vary || {}, quality = ctx.quality || {};
    const detail = Math.min(1, Math.max(0.6, quality.detail ?? 1)), density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const rng = ctx.rng, noise = ctx.noise;

    // ---- the edition: the hour, the cloud count, the scrub and the vultures, drawn once; the rare sky by ctx.vary.rare
    const hourDraw = rng(), cloudDraw = rng(), scrubDraw = rng(), vultureDraw = rng();
    const hour = vary.hour === 'dawn' ? 'rose' : vary.hour === 'night' ? 'wet' : (vary.hour === 'day' || vary.hour === 'golden') ? 'red'
      : hourDraw < 1 / 3 ? 'red' : hourDraw < 2 / 3 ? 'wet' : 'rose';
    const edition = EDITIONS[hour], rare = !!vary.rare;
    const cloudsPerTier = cloudDraw < 0.34 ? 6 : cloudDraw < 0.67 ? 7 : 8;
    const scrubThick = scrubDraw < 0.5;
    const vultures = vultureDraw < 0.7 ? 9 : 0;

    const style = makeStyle(ctx, { palette: edition.palette, far: edition.far });
    const pal = style.palette, SUN = style.sun, UP = [0, 1, 0];
    const ink = (hex) => new THREE.Color(hex);
    const scene = new THREE.Scene();
    scene.background = ink(edition.bands[0]);
    const world = new THREE.Group();
    scene.add(world);

    // ---- the sky: level flat bands on a dome 30 km in radius about a constant place of the world, the sun's disc and its two
    // flat rings standing on it in the sun's own direction, and under the level of the centre one band of the sand's ink. One
    // mesh, drawn first, its triangles in painter's order; it neither tests nor writes depth, and its vertices are set on the
    // far plane so that the camera's far distance never cuts it. It is placed by the world, not by the camera.
    {
      const SKY_VS = /* glsl */`
        attribute vec3 aInk;
        varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.);
          vW = w.xyz; vN = vec3(0., 1., 0.); vInk = aInk; vId = vec2(-1., 0.);
          vec4 p = projectionMatrix * viewMatrix * w;
          if (abs(p.w) < 1e-4) p.w = 1e-4;
          gl_Position = p.xyww;
        }`;
      const kb = style.builder(), RAD = Math.PI / 180, N = 72, C = [SKY_AT[0], 0, -SKY_AT[1]];
      const at = (az, el) => [C[0] + SKY_R * Math.cos(el) * Math.sin(az), C[1] + SKY_R * Math.sin(el), C[2] - SKY_R * Math.cos(el) * Math.cos(az)];
      const band = (e0, e1, tone) => { for (let k = 0; k < N; k++) { const a0 = k / N * Math.PI * 2, a1 = (k + 1) / N * Math.PI * 2; kb.quad(at(a0, e0), at(a1, e0), at(a1, e1), at(a0, e1), tone); } };
      band(-16 * RAD, 0, pal.sand);
      for (let i = 0; i < edition.bands.length; i++) band(BAND_EDGES[i] * RAD, BAND_EDGES[i + 1] * RAD, ink(edition.bands[i]));
      await ctx.yield();
      // a flat disc of the given radius (degrees) in the direction given, as a fan of 48
      const disc = (dir, deg, tone) => {
        const u = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), v = new THREE.Vector3().crossVectors(u, dir).normalize(), r = SKY_R * Math.tan(deg * RAD);
        const c = [C[0] + dir.x * SKY_R, C[1] + dir.y * SKY_R, C[2] + dir.z * SKY_R], p = (k) => { const a = k / 48 * Math.PI * 2; return [c[0] + (u.x * Math.cos(a) + v.x * Math.sin(a)) * r, c[1] + (u.y * Math.cos(a) + v.y * Math.sin(a)) * r, c[2] + (u.z * Math.cos(a) + v.z * Math.sin(a)) * r]; };
        for (let k = 0; k < 48; k++) kb.tri(c, p(k), p(k + 1), tone);
      };
      disc(SUN, DISC[2], ink(edition.disc[2])); disc(SUN, DISC[1], ink(edition.disc[1])); disc(SUN, DISC[0], ink(edition.disc[0]));
      // the rare sky: a second, paler disc with one ring, low on the side of the sky away from the sun
      if (rare) {
        const mb = style.sunBearing + Math.PI, me = 12 * RAD, moon = new THREE.Vector3(Math.cos(me) * Math.sin(mb), Math.sin(me), -Math.cos(me) * Math.cos(mb));
        disc(moon, 3.9, ink(edition.moon[1])); disc(moon, 2.5, ink(edition.moon[0]));
      }
      const sky = new THREE.Mesh(kb.geometry(), style.inkWith(SKY_VS, { plain: true, extra: { depthTest: false, depthWrite: false } }));
      sky.matrixAutoUpdate = false; sky.frustumCulled = false; sky.renderOrder = -12;
      world.add(sky);
      await ctx.yield();
    }

    // ---- the route and its samples every 2 m (the flown line all clearances are measured against)
    const route = routePoints(), path = makePath(route.pts), PLAN = route.at[route.at.length - 1];
    // plan metre and share of the built line: each of the route's points has its plan metre and, read off the built curve, its
    // share of the line's length; between two points both run straight
    const shares = (() => {
      const lens = path.curve.getLengths(), n = route.at.length - 1, div = lens.length - 1;
      return route.at.map((_, i) => { const f = i / n * div, k = Math.min(div - 1, Math.floor(f)); return (lens[k] + (lens[k + 1] - lens[k]) * (f - k)) / lens[div]; });
    })();
    const between = (xs, ys, x) => { for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * Math.max(0, x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[ys.length - 1]; };
    const shareAt = (metre) => between(route.at, shares, metre), metreAt = (share) => between(shares, route.at, share);
    const NS = Math.ceil(path.length / 2), sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1);
    { const v = new THREE.Vector3(); for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; } }
    // least distance from the flown line to an upright cylinder (centre x, z, radius r, from y0 to top)
    const lineToBody = (x, z, r, top, y0 = 0) => {
      let best = Infinity;
      for (let i = 0; i <= NS; i++) {
        const dx = sx[i] - x, dz = sz[i] - z, h = Math.sqrt(dx * dx + dz * dz) - r;
        if (h > best) continue;
        const d = Math.hypot(Math.max(0, h), Math.max(0, sy[i] - top, y0 - sy[i]));
        if (d < best) best = d;
      }
      return best;
    };
    const clearance = { least: Infinity, what: '', rings: Infinity, ringWhat: '' };
    const note = (d, what) => { if (d < clearance.least) { clearance.least = d; clearance.what = what; } };
    const noteRing = (d, what) => { if (d < clearance.rings) { clearance.rings = d; clearance.ringWhat = what; } };
    // the level track of the route, for scatter: distance in plan and the eye height there
    const track = (x, z) => { let b = Infinity, bi = 0; for (let i = 0; i <= NS; i += 2) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return { dist: Math.sqrt(b), y: sy[bi] }; };
    await ctx.yield();

    // ---- the hero: both puzzles, their needles, rings and dust; the world lays the floor
    const hero = await buildHero(ctx, { style, floor: false });
    hero.object.position.copy(hero.anchors.place);
    hero.object.updateMatrixWorld(true);
    world.add(hero.object);
    await ctx.yield();
    const keepOut = hero.anchors.keepOut.map((k) => ({ x: k.x + hero.anchors.place.x, z: k.z + hero.anchors.place.z, r: k.r }));

    // ---- built shadows of the bodies that carry no cast: the convex hull of points thrown by the sun to the floor (into sb), or
    // to a level given, the top of a mesa (into tsb, with the self id of that mesa). clip(x, z) -> [x, z] pulls a point of such a
    // hull back inside the top it lies on, so that no shadow hangs past a rim.
    const sb = style.builder(), tsb = style.builder();
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);   // twice the signed area of o, a, b: under nought, b lies on the side of the walk from o to a that is the right hand where the second coordinate is drawn growing upward
    // WHERE THE OUTLINE'S ROUTINE COMES FROM, said plainly. In the version of this world that stood on the site before, the outline of a
    // thrown shadow was found by another routine, the method of two chains. That routine stood in the published order of a
    // widely copied listing of that method. Nobody here read that listing or its terms, and no claim is made about either. For
    // that reason the routine below was written anew from the idea (of the points outside a line the furthest is a corner; the
    // same is asked again on either side of it) and from no listing. KNOWN TO BREAK, as the old routine did: where all the
    // thrown points lie within about 1e-13 m of one line, rounding can put one point outside that line on the way out and
    // again on the way back, and it then stands twice in the outline.
    // The corners of an outline that stand outside the line from corner a to corner b (where cross(a, b, point) is under nought),
    // added to `out` in the walk's order. `pts` come in the walk's order (west to east on the way out, east to west on the way
    // back). Of the points outside the line the one furthest out is a corner (of several equally far, the first on the walk);
    // the same is then asked of the line from a to it, with the points that come BEFORE it on the walk, and of the line from it
    // to b, with those that come AFTER it. No corner is lost by that: a point outside the line from a to the new corner and no
    // further out than it comes before it on the walk, and likewise after it for the line on to b. So the corners keep the
    // walk's order whatever the rounding does to points all but in one line, within one walk no point is handed on twice, and
    // every call has fewer points than the one before.
    const cornersBeyond = (a, b, pts, out) => {
      const beyond = [];
      let at = -1, far = 0;
      for (const q of pts) {
        const s = cross(a, b, q);
        if (!(s < 0)) continue;
        if (at < 0 || s < far) { at = beyond.length; far = s; }
        beyond.push(q);
      }
      if (at < 0) return;
      const c = beyond[at], before = [], after = [];
      for (let i = 0; i < at; i++) if (cross(a, c, beyond[i]) < 0) before.push(beyond[i]);
      for (let i = at + 1; i < beyond.length; i++) if (cross(c, b, beyond[i]) < 0) after.push(beyond[i]);
      cornersBeyond(a, c, before, out); out.push(c); cornersBeyond(c, b, after, out);
    };
    const castHull = (pts3, level = 0, clip = null, id = -1) => {
      if (pts3.length < 3) return;                               // under three points no patch is thrown (and an empty list has no first point)
      // the thrown points from west to east (of two with one x, the one with the lesser second coordinate first)
      const p = pts3.map((q) => [q[0] - SUN.x * (q[1] - level) / SUN.y, q[2] - SUN.z * (q[1] - level) / SUN.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      // the outline, corners only, in one sense round from the westmost point: it and the eastmost point are corners; then come
      // the corners outside the line from the first to the second, and after the second those outside the line back.
      const west = p[0], east = p[p.length - 1], hull = [west];
      cornersBeyond(west, east, p, hull);
      if (east[0] !== west[0] || east[1] !== west[1]) hull.push(east);
      cornersBeyond(east, west, p.slice().reverse(), hull);
      if (hull.length < 3) return;
      if (!clip) { for (let i = 1; i + 1 < hull.length; i++) sb.tri([hull[0][0], 0, hull[0][1]], [hull[i + 1][0], 0, hull[i + 1][1]], [hull[i][0], 0, hull[i][1]], pal.dusk, -1, 0, UP); return; }
      // on a top: the outline is cut into steps of 4 m or less, every point is pulled inside the top, and the fan is drawn from the pulled middle.
      // The pull may fold the outline back on itself, and a fold would lay the shadow's share twice: a pulled point is kept only
      // where its bearing about the middle goes on past the last kept point's (by less than half a turn, and no further than one
      // whole turn in all), so the fan is star-shaped about the middle and no two of its triangles overlap.
      const y = level + 0.12, mid = clip(hull.reduce((s, q) => s + q[0], 0) / hull.length, hull.reduce((s, q) => s + q[1], 0) / hull.length);
      const fine = [];
      let swept = 0;
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i], b = hull[(i + 1) % hull.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
        for (let k = 0; k < n; k++) {
          const q = clip(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n), last = fine[fine.length - 1];
          if (!last) { if (Math.hypot(q[0] - mid[0], q[1] - mid[1]) > 1e-6) fine.push(q); continue; }
          const turn = Math.atan2(cross(mid, last, q), (last[0] - mid[0]) * (q[0] - mid[0]) + (last[1] - mid[1]) * (q[1] - mid[1]));
          if (turn > 1e-9 && swept + turn < Math.PI * 2) { fine.push(q); swept += turn; }
        }
      }
      // the last triangle closes the fan only where the first point's bearing goes on past the last one's in the same way
      for (let i = 0; i < fine.length; i++) { const a = fine[i], b = fine[(i + 1) % fine.length]; if (cross(mid, a, b) > 0) tsb.tri([mid[0], y, mid[1]], [b[0], y, b[1]], [a[0], y, a[1]], pal.dusk, id, 0, UP); }
    };
    // a round level outline of n points
    const circle = (x, y, z, r, n = 10) => { const o = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; o.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]); } return o; };
    // far bodies take a paler, bluer ink by place: layer 0 for a body 320 m or more from the route's track, 1 and 2 for the two rings of the skyline
    const farTint = (k) => (c) => style.farOf(c, k);

    // ---- mesas: level strata as stacked prisms on a rounded plan, scree at the foot, a cap that juts
    const mesaRadius = (m, key) => (y, ang) => {
      const c = Math.abs(Math.cos(ang)) / (m.w / 2), s = Math.abs(Math.sin(ang)) / (m.l / 2);
      const base = 1 / Math.sqrt(Math.sqrt(c * c * c * c + s * s * s * s));
      const lobes = 1 + 0.07 * noise.n2(Math.cos(ang) * 1.6 + key, Math.sin(ang) * 1.6 + key * 0.37) + 0.03 * noise.n2(Math.cos(ang) * 4.1 + key, Math.sin(ang) * 4.1);
      return base * lobes * (1 - 0.05 * y / m.h) + Math.max(0, 10.5 - y) * 1.25;
    };
    const outlineOf = (m, key) => mesaRadius(m, key);
    // pulls (x, z) to within the outline rad(y, ang) about (cx, cz), less a margin
    const within = (cx, cz, rad, y, margin) => (x, z) => {
      const r = Math.hypot(x - cx, z - cz), lim = Math.max(0.5, rad(y, Math.atan2(-(z - cz), x - cx)) - margin);
      return r <= lim ? [x, z] : [cx + (x - cx) * lim / r, cz + (z - cz) * lim / r];
    };
    const sdx = -SUN.x / SUN.y, sdz = -SUN.z / SUN.y, sl = Math.hypot(sdx, sdz), sux = sdx / sl, suz = sdz / sl;   // a shadow's reach per metre of height, and its unit direction on the plan
    const mbs = [style.builder(), style.builder()];                    // two meshes, so that neither is long in the making
    for (let i = 0; i < MESAS.length; i++) {
      const m = MESAS[i], key = 3.7 + i * 5.3, id = style.boxId + 3 * i, mb = mbs[i & 1];
      if (m.bay) {
        // the quarry's mesa (BAY): the floor of the bay and its two sides in terraces, each a body of level strata on a plan of
        // four straight sides with a slow wander, with scree at a foot on the sand. The floor carries box cast 0 and its id;
        // the six terraces carry casts 30..35 (the left side's three, then the right side's three) and one id, that of box 30.
        // The wander of every plan and the weathering of every bed come from one constant noise, so the bay is the same on every seed.
        const B = BAY, a = B.face * Math.PI / 180, nx = Math.sin(a), nd = Math.cos(a), tx = -nd, td = nx, turn = Math.atan2(td, tx), bayNoise = makeNoise(FAR_SEED + 3);
        const rect = (hs, hq, k, foot) => (y, ang) => {
          const cs = Math.abs(Math.cos(ang) * tx + Math.sin(ang) * td), cq = Math.abs(Math.cos(ang) * nx + Math.sin(ang) * nd);
          return Math.min(hs / Math.max(cs, 1e-3), hq / Math.max(cq, 1e-3)) * (1 + 0.015 * bayNoise.n2(Math.cos(ang) * 2.2 + k, Math.sin(ang) * 2.2 + k * 0.37)) + (foot ? Math.max(0, 10.5 - y) * 1.25 : 0);
        };
        let clear = Infinity;
        const body = (slot, bid, y0, y1, s0, s1, q0, q1, k, foot) => {
          const cs = (s0 + s1) / 2, cq = (q0 + q1) / 2, x = B.x + cs * tx + cq * nx, z = -(B.d + cs * td + cq * nd), hs = (s1 - s0) / 2, hq = (q1 - q0) / 2;
          style.strata(mb, { x, z, y0, y1, sides: Math.max(24, 4 * Math.round((hs + hq) / 7)), key: k, inset: 2.2, shift: 0.6, cap: 1.2, talus: foot ? 10.5 : 0, id: bid, screeId: -1, noise: bayNoise, radius: rect(hs, hq, k, foot) });
          style.setBox(slot, x, y1 / 2, z, hs - 2, y1 / 2, hq - 2, turn);
          // clear air: from the flown line to this body's own block, 4 m wider all round than its plan, and to the scree at a foot (17 m out, 10.5 m tall)
          for (let j = 0; j <= NS; j++) {
            const px = sx[j] - x, pz = -sz[j] + z, ls = Math.abs(px * tx + pz * td) - hs, lq = Math.abs(px * nx + pz * nd) - hq;
            clear = Math.min(clear, Math.hypot(Math.max(0, ls - 4), Math.max(0, lq - 4), Math.max(0, sy[j] - y1 - 2, y0 - sy[j])));
            if (foot) clear = Math.min(clear, Math.hypot(Math.max(0, ls - 17), Math.max(0, lq - 17), Math.max(0, sy[j] - 10.5)));
          }
        };
        body(0, id, 0, B.floorTop, ...B.floor, key, true);
        await ctx.yield();
        for (const [side, base, slots, bid] of [[B.left, 0, [30, 31, 32], style.boxId + 30], [B.right, B.floorTop, [33, 34, 35], style.boxId + 30]]) {
          let y0 = base;
          for (let j = 0; j < side.length; j++) { const [top, s0, s1, q0, q1] = side[j]; body(slots[j], bid, y0, top, s0, s1, q0, q1, key + slots[j] * 1.3, y0 === 0); y0 = top; await ctx.yield(); }
        }
        clearance.bay = clear; note(clear, 'the bay of the quarry');
        rng.fork('top' + i);
        keepOut.push({ x: m.sieve[0], z: -m.sieve[1], r: m.sieve[2] });
        continue;
      }
      const tint = track(m.x, -m.d).dist - Math.hypot(m.w, m.l) / 2 > 320 ? farTint(0) : null;
      style.strata(mb, { x: m.x, z: -m.d, y0: 0, y1: m.h, sides: 56, key, inset: 2.6, shift: 0.8, cap: 1.6, talus: 10.5, id, screeId: -1, tint, radius: outlineOf(m, key) });
      // the cast is three upright boxes inside the rounded plan (a wide one, a square one, a long one), so the shadow's corners
      // step round as the rock's do
      [[0.9, 0.58], [0.77, 0.77], [0.58, 0.9]].forEach(([fa, fb], k) => style.setBox(3 * i + k, m.x, m.h / 2, -m.d, m.w / 2 * fa, m.h / 2, m.l / 2 * fb));
      await ctx.yield();
      // The top is country too: a smaller tier of the same strata stands on it toward the sun, and on a mesa over 50 m a second
      // on the first, each throwing a built shadow on the level under it, cut off inside that level's rim; drifts of sand lie
      // downwind across the top and a few boulders stand on it with their shadows.
      const hA = Math.min(9, m.h * 0.3), hB = m.h > 50 ? 12 : 0, tx = m.x + m.w * 0.07, tz = -m.d + m.l * 0.07, ux = tx + m.w * 0.05, uz = tz + m.l * 0.05;
      const tierA = mesaRadius({ w: m.w * 0.6, l: m.l * 0.6, h: 400 }, key + 1.9), tierB = mesaRadius({ w: m.w * 0.29, l: m.l * 0.29, h: 400 }, key + 4.3);
      const body = outlineOf(m, key), onBody = within(m.x, -m.d, body, m.h, 7), onTier = within(tx, tz, tierA, m.h + hA, 5);
      const rimOf = (cx, cz, rad, y0, y1) => { const o = []; for (const y of [y0, y1]) for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = rad(y, a) + 0.8; o.push([cx + Math.cos(a) * r, y, cz - Math.sin(a) * r]); } return o; };
      style.strata(mb, { x: tx, z: tz, y0: m.h, y1: m.h + hA, sides: 28, key: key + 1.9, inset: 1.8, shift: 0.8, cap: 1.2, id, tint, radius: tierA });
      castHull(rimOf(tx, tz, tierA, m.h, m.h + hA), m.h, onBody, id);
      if (hB > 0) {
        style.strata(mb, { x: ux, z: uz, y0: m.h + hA, y1: m.h + hA + hB, sides: 20, key: key + 4.3, inset: 1.5, shift: 0.8, cap: 1, id, tint, radius: tierB });
        castHull(rimOf(ux, uz, tierB, m.h + hA, m.h + hA + hB), m.h + hA, onTier, id);
      }
      await ctx.yield();
      const trng = rng.fork('top' + i), tierReach = Math.max(m.w, m.l) * 0.3 + 6;
      // open: inside the rim by `edge` m or more, outside the lower tier by 3 m or more, and not down-sun of the tier within its width (where its shadow lies)
      const open = (x, z, edge) => {
        const a = Math.atan2(-(z + m.d), x - m.x), ta = Math.atan2(-(z - tz), x - tx), ox = x - tx, oz = z - tz;
        if (body(m.h, a) - Math.hypot(x - m.x, z + m.d) < edge || Math.hypot(ox, oz) < tierA(m.h + 1, ta) + 3) return false;
        return !(ox * sux + oz * suz > -tierReach * 0.4 && Math.abs(ox * suz - oz * sux) < tierReach + 4);
      };
      const onTop = () => { for (let k = 0; k < 20; k++) { const a = trng.range(0, Math.PI * 2), r = body(m.h, a) * Math.sqrt(trng.range(0.2, 0.86)), x = m.x + Math.cos(a) * r, z = -m.d - Math.sin(a) * r; if (open(x, z, 7)) return [x, z]; } return null; };
      const y = m.h + 0.15, lit = tint ? tint(pal.ripple) : pal.ripple;
      for (let k = Math.round(m.w * m.l / 900); k > 0; k--) {
        const at = onTop(), len = trng.range(6, 15), wide = trng.range(0.9, 1.7), a = 0.28 + trng.range(-0.2, 0.2), cx = Math.cos(a), cz = Math.sin(a);
        // a drift lies wholly on the top: both of its tips are tried against the rim
        if (!at || !open(at[0] + cx * len, at[1] + cz * len, 7) || !open(at[0] - cx * len, at[1] - cz * len, 7)) continue;
        const P = (u, v) => [at[0] + cx * u * len - cz * v * wide, y, at[1] + cz * u * len + cx * v * wide];
        mb.quad(P(-1, 0), P(-0.4, -1), P(0.4, -1), P(1, 0), lit, id, 0, UP); mb.quad(P(1, 0), P(0.4, 1), P(-0.4, 1), P(-1, 0), lit, id, 0, UP);
      }
      const stood = [];
      for (let k = Math.round(m.w * m.l / 2600); k > 0; k--) {
        const at = onTop(), r = trng.range(1.6, 3.4), top = m.h + r * trng.range(0.8, 1.3), bk = trng.range(1, 60);
        // a boulder's shadow is 3.4 times its height long: it stands 24 m or more from every other, so no two shadows meet
        if (!at || stood.some((q) => Math.hypot(q[0] - at[0], q[1] - at[1]) < 24)) continue;
        stood.push(at);
        style.strata(mb, { x: at[0], z: at[1], y0: m.h, y1: top, sides: 7, key: bk, inset: 0.3, shift: 0.3, id, tint, radius: (yy, ang) => r * (1.1 - 0.4 * (yy - m.h) / (top - m.h)) * (1 + 0.3 * Math.cos(ang * 2 + bk)) });
        castHull([...circle(at[0], m.h, at[1], r * 1.1, 6), ...circle(at[0], top, at[1], r * 0.85, 6)], m.h, onBody, id);
      }
      note(lineToBody(m.x, -m.d, Math.hypot(m.w, m.l) / 2 + 16, m.h), 'a mesa');
      note(lineToBody(tx, tz, Math.hypot(m.w, m.l) * 0.3 + 6, m.h + hA + hB), 'the tiers on a mesa');
      keepOut.push({ x: m.x, z: -m.d, r: Math.hypot(m.w, m.l) / 2 + 18 });
      await ctx.yield();
    }
    for (const b of mbs) { world.add(b.mesh(style.rock)); await ctx.yield(); }
    // ---- cut stone: a face that carries the strata as geometry. It lies in the plane q of a frame (s across, y up the strata,
    // q out of the face) and is built in level strips: a strip ends at every bed of the strata table and at every 5 degrees
    // of the circles named (or another step where one is given), so a round edge is a polygon of 72. Each bed stands out of or back from the plane by its own
    // relief, with the level ledge between two beds built too.
    const QB = style.bands, bandAt = (y) => { for (let i = 0; i < QB.length; i++) if (y < QB[i][1]) return i; return QB.length - 1; };
    const relief = (bi) => (QB[bi][1] - QB[bi][0] < 2 ? -1 : 0.3) + 0.6 * Math.sin(bi * 2.4 + 0.7);
    const chord = (yc, rad, y) => Math.sqrt(Math.max(0, rad * rad - (y - yc) * (y - yc)));
    const levels = (yA, yB, off, circles, fine = 18) => {
      const ys = [yA, yB];
      for (const bd of QB) { const y = bd[1] - off; if (y > yA && y < yB) ys.push(y); }
      for (const [yc, rad] of circles) for (let k = -fine; k <= fine; k++) { const y = yc + rad * Math.sin(k * Math.PI / (2 * fine)); if (y > yA && y < yB) ys.push(y); }
      ys.sort((p, q) => p - q);
      return ys.filter((y, i) => i === 0 || y - ys[i - 1] > 0.05);
    };
    // o: { q, yA, yB, off (the strata height of y = 0), circles [[yc, radius]], spans(y) -> [[s0, s1], ..] (as many at every y),
    //      id, shade (1: marked shaded), flat (no relief), rel (a share of the relief), fine (strips end at every 90 / fine degrees of the circles; 18 where not given),
    //      walls [{ yc, rad, depth, out (1: a rim that looks away from its centre, -1: the wall of a hole), shade, deep (each bed in the next deeper ink) }] }
    const DEEP = { ochre: 'red', red: 'oxblood', oxblood: 'maroon', maroon: 'maroon' };
    const face = (b, o) => {
      const off = o.off || 0, ys = levels(o.yA, o.yB, off, o.circles || [], o.fine), id = o.id ?? -1, sh = o.shade || 0;
      let below = null, belowInk = null;
      for (let i = 0; i + 1 < ys.length; i++) {
        const y0 = ys[i], y1 = ys[i + 1], bi = bandAt((y0 + y1) / 2 + off), tone = pal[QB[bi][2]], q = o.q + (o.flat ? 0 : relief(bi) * (o.rel ?? 1));
        const s0 = o.spans(y0), s1 = o.spans(y1);
        for (let k = 0; k < s0.length; k++) {
          const [a0, b0] = s0[k], [a1, b1] = s1[k];
          if (b0 - a0 < 0.02 && b1 - a1 < 0.02) continue;
          b.quad([a0, y0, q], [b0, y0, q], [b1, y1, q], [a1, y1, q], tone, id, sh, [0, 0, 1]);
          if (below !== null && Math.abs(below - q) > 0.02 && b0 - a0 > 0.02) {
            if (below > q) b.quad([a0, y0, below], [b0, y0, below], [b0, y0, q], [a0, y0, q], belowInk, id, sh, [0, 1, 0]);
            else b.quad([a0, y0, q], [b0, y0, q], [b0, y0, below], [a0, y0, below], tone, id, sh, [0, -1, 0]);
          }
        }
        for (const w of o.walls || []) {
          const h0 = chord(w.yc, w.rad, y0), h1 = chord(w.yc, w.rad, y1);
          if (h0 < 0.02 && h1 < 0.02) continue;
          const ym = (y0 + y1) / 2, hm = chord(w.yc, w.rad, ym), ny = (ym - w.yc) / w.rad * w.out;
          for (const sd of [-1, 1]) b.quad([sd * h0, y0, q], [sd * h1, y1, q], [sd * h1, y1, o.q - w.depth], [sd * h0, y0, o.q - w.depth], w.deep ? pal[DEEP[QB[bi][2]]] : tone, id, w.shade ?? sh, [sd * hm / w.rad * w.out, ny, 0]);
        }
        below = q; belowInk = tone;
      }
    };
    // the end of a cut body: one upright face per bed at s, from q0 out to the bed's own relief before q1, looking along dir
    const endFace = (b, s, q0, q1, yA, yB, dir, id) => {
      for (let bi = 0; bi < QB.length && QB[bi][0] < yB; bi++) {
        const y0 = Math.max(yA, QB[bi][0]), y1 = Math.min(yB, QB[bi][1]);
        if (y1 - y0 > 0.05) b.quad([s, y0, q0], [s, y0, q1 + relief(bi)], [s, y1, q1 + relief(bi)], [s, y1, q0], pal[QB[bi][2]], id, 0, [dir, 0, 0]);
      }
    };
    const ringSpans = (yc, a, b) => (y) => { const wo = chord(yc, b, y), wi = Math.min(wo, chord(yc, a, y)); return [[-wo, -wi], [wi, wo]]; };
    const outside = (yc, rad, sA, sB) => (y) => { const w = chord(yc, rad, y); return [[sA, -w], [w, sB]]; };
    // the second sieve of the scatter: circles (x, z, r) about the quarry's mesa, its bodies and the cut stones
    const keep2 = [];
    for (const k of hero.anchors.keepLater) keep2.push({ x: k.x + hero.anchors.place.x, z: k.z + hero.anchors.place.z, r: k.r });
    const free2 = (x, z, pad) => { for (const k of keep2) { const dx = x - k.x, dz = z - k.z, r = k.r + pad; if (dx * dx + dz * dz < r * r) return false; } return true; };

    // ---- the quarry ring and its bench (QUARRY). Their frame: s along the ring's face, y up, q out of the face toward the
    // open country, the origin on the sand under the middle of the ring's front face.
    const QR = QUARRY, quarry = { frame: new THREE.Matrix4(), toWorld: null, toLocal: null };
    {
      const a = QR.face * Math.PI / 180, nx = Math.sin(a), nd = Math.cos(a), tx = -nd, td = nx;   // the face's outward normal and its run, as (x, d)
      quarry.frame.makeBasis(new THREE.Vector3(tx, 0, -td), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, 0, -nd)).setPosition(QR.x, 0, -QR.d);
      quarry.toWorld = (s, y, q) => [QR.x + s * tx + q * nx, y, -(QR.d + s * td + q * nd)];
      quarry.toLocal = (x, y, z) => [(x - QR.x) * tx + (-z - QR.d) * td, y, (x - QR.x) * nx + (-z - QR.d) * nd];
      const qb = style.builder(), benchId = style.boxId + 29, ringId = style.quarryRing, sideId = style.boxId + 30;
      const yc = QR.y, bq = -QR.proud, backq = bq - QR.benchDeep, Rk = QR.R + QR.kerf, tone = (y) => pal[QB[bandAt(y)][2]];
      const sun = [SUN.x * tx - SUN.z * td, SUN.y, SUN.x * nx - SUN.z * nd];   // toward the sun in this frame: along s, up, out of the face
      // the level floor of a round cut in a cut face: between the radii r0 and r1 about (0, yc), in the plane q, `deep` under
      // the face it is cut into, in n steps of the turn between two angles (each a function of the radius, so that an end may
      // lie along a level line). Each step is in the ink of the bed at its own middle height (deepInk: the next deeper ink).
      // Where the sun stands beyond the outer wall, the part of the floor that wall keeps the sun from is marked shaded: as
      // far in as the wall's depth throws it, and no farther than a ray may run before it clears the rock's top at `lid`
      // (where one is given). Where the sun stands beyond the inner wall the same is done from that wall if `inner` is set
      // (it is not set where the inner wall is a body with a cast of its own).
      const cutFloor = (o) => {
        const wide = o.r1 - o.r0, rm = (o.r0 + o.r1) / 2;
        const yc0 = o.yc, P = (rad, f) => { const g = o.from(rad) + (o.to(rad) - o.from(rad)) * f; return [rad * Math.cos(g), yc0 + rad * Math.sin(g), o.q]; };
        for (let k = 0; k < o.n; k++) {
          const f0 = k / o.n, f1 = (k + 1) / o.n, am = o.from(rm) + (o.to(rm) - o.from(rm)) * (f0 + f1) / 2, ym = yc0 + rm * Math.sin(am);
          const out = Math.cos(am) * sun[0] + Math.sin(am) * sun[1];           // how fast a ray toward the sun leaves the centre here
          const bed = QB[bandAt(ym)][2], ink = pal[o.deepInk ? DEEP[bed] : bed];
          let reach = 0;
          if (out > 0) reach = Math.min(wide, o.deep * out / sun[2], o.lid === undefined ? wide : Math.max(0, o.lid - ym) * out / sun[1]);
          else if (o.inner) reach = Math.min(wide, o.deep * -out / sun[2]);
          const edge = out > 0 ? o.r1 - reach : o.r0 + reach;
          for (const [ra, rb, sh] of [[o.r0, edge, out > 0 ? 0 : 1], [edge, o.r1, out > 0 ? 1 : 0]]) {
            if (rb - ra > 0.02) qb.quad(P(ra, f0), P(rb, f0), P(rb, f1), P(ra, f1), ink, o.id, sh, [0, 0, 1]);
          }
        }
      };
      qb.xf = quarry.frame;
      // the bench: its cut front less the round of the socket, with the socket's wall from the front back to the ring's
      // back; its top either side of the socket and behind the ring; its back and ends
      face(qb, { q: bq, yA: 0, yB: QR.bench, circles: [[yc, Rk]], spans: outside(yc, Rk, QR.benchFrom, QR.benchTo), id: benchId,
        walls: [{ yc, rad: Rk, depth: QR.thick - QR.proud, out: -1 }] });
      {
        const w = chord(yc, Rk, QR.bench), y = QR.bench, ink = tone(y - 0.1);
        for (const [s0, s1, q0] of [[QR.benchFrom, -w, bq + 1], [w, QR.benchTo, bq + 1], [-w, w, -QR.thick]]) qb.quad([s0, y, q0], [s1, y, q0], [s1, y, backq], [s0, y, backq], ink, benchId, 0, [0, 1, 0]);
        qb.quad([QR.benchTo, 0, backq], [QR.benchFrom, 0, backq], [QR.benchFrom, y, backq], [QR.benchTo, y, backq], ink, benchId, 0, [0, 0, -1]);
      }
      endFace(qb, QR.benchFrom, backq, bq, 0, QR.bench, -1, benchId); endFace(qb, QR.benchTo, backq, bq, 0, QR.bench, 1, benchId);
      // the socket's back, in the plane of the ring's back: on either side of the ring from the sand up to the bench's top
      {
        const up = (rad) => Math.asin((QR.bench - yc) / rad), down = (rad) => -Math.asin(Math.min(1, yc / rad));
        const back = { q: -QR.thick, yc, r0: QR.R, r1: Rk, deep: QR.thick - QR.proud, lid: QR.bench, n: 14, id: benchId };
        cutFloor({ ...back, from: down, to: up });
        cutFloor({ ...back, from: (rad) => Math.PI - up(rad), to: (rad) => Math.PI - down(rad) });
      }
      // the steps at its end, each with its cut front, its top and its end. They carry no cast: the sun stands before and
      // beside them, and what lies down-sun of them is the bench and the bay's floor, which stand higher
      {
        let from = QR.benchTo;
        for (const [h, to] of QR.steps) {
          const s0 = from;
          face(qb, { q: bq, yA: 0, yB: h, spans: () => [[s0, to]], id: benchId });
          qb.quad([s0, h, bq + 1], [to, h, bq + 1], [to, h, backq], [s0, h, backq], tone(h - 0.1), benchId, 0, [0, 1, 0]);
          endFace(qb, to, backq, bq, 0, h, 1, benchId);
          from = to;
        }
      }
      await ctx.yield();
      // the ring begun on the bay's left side: a dressed face without relief, the two grooves cut into it with their walls
      // and their floors
      {
        const G = QR.begun, Ro = G.R + G.wide, ro = G.r + G.holeWide, c = (rad, y) => chord(G.y, rad, y), turn = { from: () => 0, to: () => Math.PI * 2 };
        qb.xf = quarry.frame.clone().multiply(new THREE.Matrix4().makeTranslation(G.s, 0, 0));
        face(qb, { q: G.q, yA: 0, yB: G.top, circles: [[G.y, Ro], [G.y, G.R], [G.y, ro], [G.y, G.r]], id: sideId, flat: true, fine: 12,
          spans: (y) => [[G.from - G.s, -c(Ro, y)], [-c(G.R, y), -c(ro, y)], [-c(G.r, y), c(G.r, y)], [c(ro, y), c(G.R, y)], [c(Ro, y), G.to - G.s]],
          walls: [{ yc: G.y, rad: Ro, depth: G.deep, out: -1 }, { yc: G.y, rad: G.R, depth: G.deep, out: 1 }, { yc: G.y, rad: ro, depth: G.holeDeep, out: -1 }, { yc: G.y, rad: G.r, depth: G.holeDeep, out: 1 }] });
        cutFloor({ q: G.q - G.deep, yc: G.y, r0: G.R, r1: Ro, deep: G.deep, inner: true, deepInk: true, n: 64, id: sideId, ...turn });
        cutFloor({ q: G.q - G.holeDeep, yc: G.y, r0: G.r, r1: ro, deep: G.holeDeep, inner: true, deepInk: true, n: 32, id: sideId, ...turn });
      }
      await ctx.yield();
      // the ring: a millstone as the style cuts every ring of this world, sawn true, built in its own frame (its axis out of
      // the face, its furrowed face in front), the back half of its slabs and then the front half
      const mid = quarry.toWorld(0, yc, -QR.thick / 2);
      qb.xf = new THREE.Matrix4().makeBasis(new THREE.Vector3(tx, 0, -td), new THREE.Vector3(nx, 0, -nd), new THREE.Vector3(0, -1, 0)).setPosition(mid[0], mid[1], mid[2]);
      const wheel = { R: QR.R, r: QR.r, h: QR.thick, ink: pal[QR.ink], seam: pal[QR.seam], id: ringId, key: 3.1, cut: true, sun: [sun[0], sun[2], -sun[1]], noise: makeNoise(FAR_SEED + 4),
        furrows: QR.furrows, furrowWide: 2.2, furrowDeep: 1.2 };
      style.ring(qb, { ...wheel, slabs: [0, 5] });
      await ctx.yield();
      style.ring(qb, { ...wheel, slabs: [5, 99] });
      qb.xf = null;
      await ctx.yield();
      quarry.builder = qb;
      // their casts: the ring's own (the whole annulus, `thick` thick) and one box for the bench, a little inside it
      const turn = Math.atan2(td, tx), bc = quarry.toWorld((QR.benchFrom + QR.benchTo) / 2, (QR.bench - 0.5) / 2, (bq + backq) / 2);
      style.setRing(ringId, new THREE.Vector3(mid[0], mid[1], mid[2]), new THREE.Vector3(nx, 0, -nd), QR.R, QR.r, QR.thick / 2, null);
      style.setBox(29, bc[0], bc[1], bc[2], (QR.benchTo - QR.benchFrom) / 2 - 1.5, (QR.bench - 0.5) / 2, QR.benchDeep / 2 - 1.5, turn);
      // clear air: from the flown line to the ring (taken 2 m thicker on either face) and to the bench and each of its steps (2 m before their fronts)
      const rq = { x: mid[0], y: mid[1], z: mid[2], ax: [nx, 0, -nd], R: QR.R, r: QR.r, h: QR.thick + 4 };
      let ringClear = Infinity, benchClear = Infinity;
      for (let i = 0; i <= NS; i++) {
        const p = quarry.toLocal(sx[i], sy[i], sz[i]);
        ringClear = Math.min(ringClear, ringDistance(sx[i], sy[i], sz[i], rq));
        for (const [h, to] of [[QR.bench, QR.benchTo], ...QR.steps]) benchClear = Math.min(benchClear, Math.hypot(Math.max(0, QR.benchFrom - p[0], p[0] - to), Math.max(0, p[1] - h), Math.max(0, backq - p[2], p[2] - bq - 2)));
      }
      clearance.quarry = ringClear; clearance.bench = benchClear; note(ringClear, 'the quarry ring'); note(benchClear, 'the bench of the quarry');
      // the scatter's second sieve keeps the mesa clear: two rows of circles 68 m in radius along it, in the bay's frame
      const ba = BAY.face * Math.PI / 180, bnx = Math.sin(ba), bnd = Math.cos(ba);
      for (let s = -133; s <= 122; s += 30) for (const q of [-110, -50]) keep2.push({ x: BAY.x - s * bnd + q * bnx, z: -(BAY.d + s * bnx + q * bnd), r: 68 });
    }
    await ctx.yield();

    // ---- cut stones on the sand: drums of the same beds whose round faces carry the strata as straight stripes, each thrown
    // down with its face tipped and part buried, each with its floor shadow. stone(b, x, y, z, rad, thick, lean, tilt, spin,
    // bed, half, fine): (x, y, z) the middle of the face that shows; lean and tilt as in STONES; half 1: only the half over its
    // own middle line; half 2: that half stood on its broken edge (the spin is then found, not given); fine: the strips'
    // ends round the edge, in steps of 90 / fine degrees. It returns the height of its highest point.
    const stoneTools = { ZED: new THREE.Vector3(0, 0, 1), about: new THREE.Matrix4().makeRotationY(Math.PI), m4: new THREE.Matrix4(), one: new THREE.Vector3(1, 1, 1), yv: new THREE.Vector3(), up: new THREE.Vector3() };
    const stone = (b, x, y, z, rad, thick, lean, tilt, spin, bed, half, fine = 18, cast = -1) => {
      const RAD = Math.PI / 180, { ZED, m4, one, yv, up } = stoneTools;
      const axis = new THREE.Vector3(Math.sin(lean * RAD) * Math.sin(tilt * RAD), Math.cos(tilt * RAD), -Math.cos(lean * RAD) * Math.sin(tilt * RAD));
      const quat = new THREE.Quaternion().setFromUnitVectors(ZED, axis);
      let turn = spin * RAD;
      if (half === 2) {
        // the turn that brings the face's own y to the steepest way up the face
        yv.set(0, 1, 0).applyQuaternion(quat); up.set(0, 1, 0).addScaledVector(axis, -axis.y).normalize();
        turn = Math.atan2(axis.dot(new THREE.Vector3().crossVectors(yv, up)), yv.dot(up));
      }
      quat.multiply(new THREE.Quaternion().setFromAxisAngle(ZED, turn));
      b.xf = m4.compose(new THREE.Vector3(x, y, z), quat, one);
      face(b, { q: 0, yA: half ? 0 : -rad, yB: rad, off: bed + rad, rel: Math.min(1, rad / 30), fine, id: cast, circles: [[0, rad]], spans: (yy) => { const w = chord(0, rad, yy); return [[-w, 0], [0, w]]; }, walls: [{ yc: 0, rad, depth: thick, out: 1 }] });
      if (half) b.quad([-rad, 0, 0], [rad, 0, 0], [rad, 0, -thick], [-rad, 0, -thick], pal[QB[bandAt(bed + rad)][2]], cast, 0, [0, -1, 0]);
      if (rad >= 15) {
        // a great piece has its other face too, flat, in the same beds
        b.xf = m4.clone().multiply(stoneTools.about);
        face(b, { q: thick, yA: half ? 0 : -rad, yB: rad, off: bed + rad, flat: true, fine, id: cast, circles: [[0, rad]], spans: (yy) => { const w = chord(0, rad, yy); return [[-w, 0], [0, w]]; } });
      }
      b.xf = null;
      const e = m4.elements, rim = [];
      let top = 0;
      for (let k = 0; k < 12; k++) for (const q of [0, -thick]) {
        const a = k / 12 * Math.PI * (half ? 1 : 2), lx = Math.cos(a) * rad, ly = Math.sin(a) * rad, py = Math.max(0, e[1] * lx + e[5] * ly + e[9] * q + e[13]);
        rim.push([e[0] * lx + e[4] * ly + e[8] * q + e[12], py, e[2] * lx + e[6] * ly + e[10] * q + e[14]]);
        top = Math.max(top, py);
      }
      // its shadow: a floor polygon, or (a great piece) one of the style's ring casts, a disc or half a disc as thick as the piece
      if (cast < 0) castHull(rim);
      else style.setRing(cast, new THREE.Vector3(x, y, z).addScaledVector(axis, -thick / 2), axis, rad, 0, thick / 2, half ? new THREE.Vector3(e[4], e[5], e[6]) : null);
      return top;
    };
    // the quarry's own stones (STONES); the first is the core cut from the ring's hole
    for (let i = 0; i < STONES.length; i++) {
      const [x, d, y, rad, thick, lean, tilt, spin, bed, half, piece] = STONES[i];
      const top = stone(quarry.builder, x, y, -d, rad, thick, lean, tilt, spin, bed, half, 18, piece ? style.pieceRing + piece - 1 : -1), clear = lineToBody(x, -d, rad + 1, top + 1);
      if (i === 0) clearance.core = clear;
      note(clear, 'a cut stone');
      keep2.push({ x, z: -d, r: rad + 5 });
      await ctx.yield();
    }
    world.add(quarry.builder.mesh(style.rock));
    await ctx.yield();

    // the far skyline: two rings, each in its own paler, bluer ink, each mesa with its floor shadow. The level top of a bed that
    // lies higher than any eye of the flight (EYES_TO) is left out: only an eye above it could see it.
    for (let ringI = 0; ringI < FAR_MESAS.length; ringI++) {
      const fb = style.builder();
      for (let i = 0; i < FAR_MESAS[ringI].length; i++) {
        const m = FAR_MESAS[ringI][i], key = 11.9 + i * 4.1 + ringI * 50;
        style.strata(fb, { x: m.x, z: -m.d, y0: 0, y1: m.h, sides: ringI ? 12 : 20, key, inset: 6 + 5 * ringI, shift: 2, cap: 3, talus: 10.5, tint: farTint(1 + ringI), coarse: true, eyes: EYES_TO, radius: mesaRadius(m, key) });
        castHull([...circle(m.x, 0, -m.d, Math.min(m.w, m.l) * 0.5, 8), ...circle(m.x, m.h, -m.d, Math.min(m.w, m.l) * 0.42, 8)]);
        await ctx.yield();
      }
      world.add(fb.mesh(style.rock));
      await ctx.yield();
    }
    // ---- the far ruined towers: more puzzles that stopped, standing south-west, west and north-west of the row before and between the far
    // mesas, in the two pale far inks. Each is a needle on a foot with its rings where the plan says: level on the foot, caught
    // askew on the shaft, hanging beside it, fallen at its foot or standing on edge against it. Coarse: a shaft of six sides, a
    // ring of two slabs of sixteen sides. Each needle and ring throws a built floor shadow. Nothing there moves.
    {
      const fn = makeNoise(FAR_SEED), ftb = style.builder(), RAD = Math.PI / 180, AYE = new THREE.Vector3(0, 1, 0);
      const m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), qt = new THREE.Quaternion(), qa = new THREE.Vector3(), pv = new THREE.Vector3();
      const RING_INKS = [['red', 'oxblood'], ['ochre', 'red'], ['oxblood', 'maroon'], ['straw', 'ochre'], ['maroon', 'oxblood']];
      const P = (rad, ang, y) => [Math.cos(ang) * rad, y, -Math.sin(ang) * rad];
      // a coarse millstone about (x, y, z), its axis leaning `tilt` degrees toward the plan bearing `lean`: the upper slab in the
      // ring's ink, the lower standing back in the ink of the bed under it
      const coarseRing = (R, r, h, x, y, z, lean, tilt, inkA, inkB) => {
        qa.set(Math.sin(lean * RAD) * Math.sin(tilt * RAD), Math.cos(tilt * RAD), -Math.cos(lean * RAD) * Math.sin(tilt * RAD));
        ftb.xf = m4.compose(pv.set(x, y, z), qt.setFromUnitVectors(AYE, qa), one);
        for (let sl = 0; sl < 2; sl++) {
          const y0 = -h / 2 + sl * h / 2, y1 = y0 + h / 2, Ro = sl ? R : R * 0.93, tone = sl ? inkA : inkB;
          for (let k = 0; k < 16; k++) {
            const a = k / 16 * Math.PI * 2, b = (k + 1) / 16 * Math.PI * 2;
            ftb.quad(P(Ro, a, y0), P(Ro, b, y0), P(Ro, b, y1), P(Ro, a, y1), tone);
            ftb.quad(P(r, b, y0), P(r, a, y0), P(r, a, y1), P(r, b, y1), tone);
            ftb.quad(P(r, a, y1), P(Ro, a, y1), P(Ro, b, y1), P(r, b, y1), tone, -1, 0, [0, 1, 0]);
            ftb.quad(P(Ro, a, y0), P(r, a, y0), P(r, b, y0), P(Ro, b, y0), tone, -1, 0, [0, -1, 0]);
          }
        }
        // its floor shadow: the hull of eight points of each rim, as far as they stand over the sand
        const e = m4.elements, rim = [];
        for (let k = 0; k < 8; k++) for (const yy of [-h / 2, h / 2]) {
          const a = k / 8 * Math.PI * 2, lx = Math.cos(a) * R, lz = -Math.sin(a) * R;
          rim.push([e[0] * lx + e[4] * yy + e[8] * lz + e[12], Math.max(0, e[1] * lx + e[5] * yy + e[9] * lz + e[13]), e[2] * lx + e[6] * yy + e[10] * lz + e[14]]);
        }
        ftb.xf = null;
        castHull(rim);
      };
      for (let ti = 0; ti < FAR_TOWERS.length; ti++) {
        const [x, d, H, layer, key, rings] = FAR_TOWERS[ti], z = -d, tint = farTint(layer), big = H / 200;
        const footY = 16 * big, footR = 26 * big, r0 = 11 * big, r1 = 6 * big, hole = r0 * 1.5;
        style.strata(ftb, { x, z, y0: 0, y1: footY, sides: 9, key, inset: 2 * big, shift: 0.8, tint, coarse: true, noise: fn,
          radius: (y, ang) => footR * (0.95 - 0.5 * y / footY) * (1 + 0.2 * fn.n2(Math.cos(ang) * 1.3 + key, Math.sin(ang) * 1.3)) });
        style.strata(ftb, { x, z, y0: footY, y1: H, sides: 6, key: key + 3, inset: 1.6 * big, shift: 1.2, tint, coarse: true, eyes: EYES_TO, noise: fn,
          drift: (y) => { const f = (y - footY) / (H - footY), w = 3.5 * big * Math.sin(f * Math.PI * 1.5) * f; return [Math.cos(key) * w, Math.sin(key) * w]; },
          radius: (y) => { const f = (y - footY) / (H - footY); return (r0 + (r1 - r0) * f) * (1 - 0.4 * Math.max(0, (f - 0.95) / 0.05)); } });
        castHull([...circle(x, 0, z, footR * 0.8, 6), ...circle(x, H, z, r1, 4)]);
        let stack = footY;
        for (let ri = 0; ri < rings.length; ri++) {
          const [kind, R0, a = 0, b = 0, c = 0] = rings[ri], R = R0 * H / 235, h = R * 0.3, inks = RING_INKS[(ti + ri * 2) % RING_INKS.length], inkA = tint(pal[inks[0]]), inkB = tint(pal[inks[1]]);
          const off = (bearing, dist) => [x + Math.sin(bearing * RAD) * dist, z - Math.cos(bearing * RAD) * dist];
          if (kind === 'foot') { coarseRing(R, hole, h, x, stack + h / 2, z, 0, 0, inkA, inkB); stack += h; }
          else if (kind === 'foot2') { coarseRing(R, hole, h, x, stack + h / 2 + 1.5, z, key * 40, 7, inkA, inkB); stack += h; }
          else if (kind === 'caught') coarseRing(R, hole, h, x, footY + a * (H - footY), z, c, b, inkA, inkB);
          else if (kind === 'hang') { const at = off(c, R * 1.9); coarseRing(R, hole, h, at[0], footY + a * (H - footY), at[1], c, b, inkA, inkB); }
          else if (kind === 'fallen') { const at = off(a, R * 1.5 + footR * 0.3); coarseRing(R, hole, h, at[0], 2 * big, at[1], c, b, inkA, inkB); }
          else { const at = off(a, footR * 0.55 + h); coarseRing(R, hole, h, at[0], R * 0.93, at[1], a, 76, inkA, inkB); }
        }
        await ctx.yield();
      }
      world.add(ftb.mesh(style.rock));
      await ctx.yield();
    }

    // ---- hoodoos: stout leaning rocks of the same strata, lumpy, flattened, each with two swellings at its own heights and a
    // top that narrows off centre; no neck and no cap. Lower and upper half each carry an upright cone cast a little inside the rock.
    const hb = style.builder();
    for (let i = 0; i < HOODOOS.length; i++) {
      const [x, d, h] = HOODOOS[i], z = -d, key = 2.3 + i * 3.9, n01 = (a, b) => noise.n2(key * a, b) * 0.5 + 0.5;
      const lean = h * (0.16 + 0.12 * n01(1, 4.4)), leanA = key * 1.7, r0 = 6.6 + 1.8 * n01(1.3, 8.1), rt = 2.6 + 1.3 * n01(2.1, 3.3);
      const f1 = 0.24 + 0.16 * n01(0.7, 5.2), f2 = 0.66 + 0.14 * n01(1.9, 6.7), flat = 0.14 + 0.2 * n01(2.7, 1.1), flatA = key * 0.9;
      const prof = (f) => (r0 + (rt - r0) * f) * (1 + 0.26 * Math.exp(-(((f - f1) / 0.12) ** 2)) + 0.38 * Math.exp(-(((f - f2) / 0.1) ** 2))) * (1 - 0.5 * Math.min(1, Math.max(0, (f - 0.88) / 0.12)));
      const drift = (y) => { const f = y / h; return [Math.cos(leanA) * lean * f * f + 1.1 * Math.sin(f * 5 + key), Math.sin(leanA) * lean * f * f + 1.1 * Math.cos(f * 4 + key)]; };
      const radius = (y, ang) => prof(y / h) * (1 - flat * Math.abs(Math.sin(ang - flatA))) + Math.max(0, 4 - y) * 1.1;
      const split = 0.52 * h, slot = 12 + 2 * i, up = drift(0.76 * h);
      style.strata(hb, { x, z, y0: 0, y1: split, sides: 7 + (i % 3), key, inset: 1.2, shift: 0.8, drift, radius, id: style.coneId + slot });
      style.strata(hb, { x, z, y0: split, y1: h, sides: 7 + (i % 3), key, inset: 1.2, shift: 0.8, drift, radius, id: style.coneId + slot + 1 });
      style.setCyl(slot, x, z, 0, split, r0 * 0.8, prof(0.52) * 0.7);
      style.setCyl(slot + 1, x + up[0], z + up[1], split, h, prof(0.7) * 0.72, 1.2);
      note(lineToBody(x, z, r0 + 7 + lean, h), 'a hoodoo');
      keepOut.push({ x, z, r: 20 });
      await ctx.yield();
    }

    // ---- kin, as plain rock: a pile of five squared blocks, each with a box cast, and one boat-shaped rock across a wash
    for (let i = 0; i < BLOCKS.length; i++) {
      const [along, y0, y1, turn] = BLOCKS[i], x = BLOCKS_AT[0] + Math.cos(BLOCKS_AT[2]) * along, z = -(BLOCKS_AT[1] + Math.sin(BLOCKS_AT[2]) * along);
      const key = BLOCKS_AT[2] + Math.PI / 4 + turn, R = 4.5 * Math.SQRT2;   // a square's corners stand at the angle key and every quarter turn from it
      style.strata(hb, { x, z, y0, y1, sides: 4, key, inset: 0.25, shift: 0, radius: () => R, id: style.boxId + 24 + i });
      style.setBox(24 + i, x, (y0 + y1) / 2, z, 4.3, (y1 - y0) / 2, 4.3, key + Math.PI / 4);
      note(lineToBody(x, z, R + 0.6, y1), 'the pile of blocks');
    }
    keepOut.push({ x: BLOCKS_AT[0], z: -BLOCKS_AT[1], r: 26 });
    await ctx.yield();
    // ---- the fallen ring inside the great turn: one millstone of the giants' strata, tipped and part buried, a piece broken out
    // of its rim. It lies by the constants of FALLEN and is weathered by the constant noise; it carries the world's ring cast, so
    // its shadow falls on floor and rock like any ring's, less the wedge of the piece broken out.
    {
      const q = FALLEN, RAD = Math.PI / 180, span = Math.PI * 2 * q.arc, AYE = new THREE.Vector3(0, 1, 0);
      const axis = new THREE.Vector3(Math.sin(q.lean * RAD) * Math.sin(q.tilt * RAD), Math.cos(q.tilt * RAD), -Math.cos(q.lean * RAD) * Math.sin(q.tilt * RAD));
      // the turn about its own axis that brings the middle of the broken piece to the plan bearing gapAt
      const spin = (90 - q.gapAt) * RAD - (span + Math.PI * 2) / 2;
      const quat = new THREE.Quaternion().setFromUnitVectors(AYE, axis).multiply(new THREE.Quaternion().setFromAxisAngle(AYE, spin));
      const pos = new THREE.Vector3(q.x, q.y, -q.d), rb = style.builder(), fallNoise = makeNoise(FAR_SEED);
      // Two millstones of half the thickness back to back, the lower one turned over, so that both of its great faces carry
      // furrows: the one toward the sky and the one that overhangs the sand. The turned one is spun by the arc's span so that
      // the broken ends of the two meet.
      const base = new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
      const over = new THREE.Matrix4().makeRotationY(span).multiply(new THREE.Matrix4().makeRotationX(Math.PI));
      const own = SUN.clone().applyQuaternion(quat.clone().invert());       // toward the sun as the ring's own frame sees it
      const ownOver = own.clone().applyMatrix4(over.clone().invert());
      rb.xf = base.clone().multiply(new THREE.Matrix4().makeTranslation(0, q.h / 4, 0));
      style.ring(rb, { R: q.R, r: q.r, h: q.h / 2, ink: pal.red, seam: pal.oxblood, id: style.freeRing, key: q.key, arc: q.arc, sun: [own.x, own.y, own.z], noise: fallNoise });
      await ctx.yield();
      rb.xf = base.clone().multiply(new THREE.Matrix4().makeTranslation(0, -q.h / 4, 0)).multiply(over);
      style.ring(rb, { R: q.R, r: q.r, h: q.h / 2, ink: pal.red, seam: pal.oxblood, id: style.freeRing, key: q.key + 9.4, arc: q.arc, sun: [ownOver.x, ownOver.y, ownOver.z], noise: fallNoise });
      rb.xf = null;
      await ctx.yield();
      world.add(rb.mesh(style.rock));
      style.setRing(style.freeRing, pos, axis, q.R, q.r, q.h / 2, null);
      style.setGap(new THREE.Vector3(0, 0, -1).applyQuaternion(quat), new THREE.Vector3(Math.sin(span), 0, Math.cos(span)).applyQuaternion(quat));
      // clear air: the least distance from the flown line to the ring's stone
      const rq = { x: pos.x, y: pos.y, z: pos.z, ax: [axis.x, axis.y, axis.z], R: q.R, r: q.r, h: q.h };
      let best = Infinity;
      for (let i = 0; i <= NS; i++) { const dd = ringDistance(sx[i], sy[i], sz[i], rq); if (dd < best) best = dd; }
      clearance.fallen = best; note(best, 'the fallen ring');
      keepOut.push({ x: q.x, z: -q.d, r: q.R + 14 });
      // sand drifted against it: low heaps of two or three sloped tiers in the ripple tone, long down the wind, their outlines by
      // the same constant noise; each throws its built shadow on the floor like the floor's other heaps
      for (const [x, d, hl, hw, h] of DRIFTS) {
        const key = x * 0.37 + d * 0.11;
        const rad = (y, ang) => { const c = Math.abs(Math.cos(ang + 0.28)) / hl, sn = Math.abs(Math.sin(ang + 0.28)) / hw; return (1 - 0.72 * y / h) / Math.sqrt(c * c + sn * sn) + 0.4; };
        style.strata(hb, { x, z: -d, y0: 0, y1: h, sides: 9, key, inset: 0.6, shift: 0, talus: 10.5, noise: fallNoise, radius: rad });
        const rim = [];
        for (const y of [0, h]) for (let n = 0; n < 9; n++) { const a = n / 9 * Math.PI * 2, r = rad(y, a); rim.push([x + Math.cos(a) * r, y, -d - Math.sin(a) * r]); }
        castHull(rim);
        note(lineToBody(x, -d, hl + 1.5, h), 'a drift of sand');
        keepOut.push({ x, z: -d, r: hl + 3 });
      }
    }
    await ctx.yield();
    // ---- the gate (GATE): three courses about one hole, built level in the ring's own frame with the furrowed face up; the pose
    // turns that face away from the sun's bearing, toward the side the line comes from. gate.pose(time) sets its turn and
    // its axis from the time alone; update() gives them to the mesh and to its cast.
    const gate = { mesh: null, pos: new THREE.Vector3(GATE.x, GATE.y, -GATE.d), quat: new THREE.Quaternion(), axis: new THREE.Vector3(), pose: null };
    {
      const q = GATE, RAD = Math.PI / 180, AYE = new THREE.Vector3(0, 1, 0), gb = style.builder(), gateNoise = makeNoise(FAR_SEED + 1);
      const toSun = new THREE.Vector3(Math.sin(style.sunBearing), 0, -Math.cos(style.sunBearing));   // level, toward the sun's bearing
      const level = new THREE.Vector3().crossVectors(AYE, toSun).normalize();                         // the ring's level diameter
      // the furrowed face looks away from the sun's bearing and `lean` degrees under level
      const face = toSun.clone().multiplyScalar(-Math.cos(q.lean * RAD)).addScaledVector(AYE, -Math.sin(q.lean * RAD));
      const base = new THREE.Quaternion().setFromUnitVectors(AYE, face), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
      gate.pose = (time) => {
        qa.setFromAxisAngle(level, q.nod * RAD * Math.sin(time * Math.PI * 2 / q.nodEvery));
        qb.setFromAxisAngle(AYE, time * Math.PI * 2 / q.turn);
        gate.quat.copy(qa).multiply(base).multiply(qb);
        gate.axis.copy(AYE).applyQuaternion(gate.quat);
      };
      const own = SUN.clone().applyQuaternion(base.clone().invert()), sunOwn = [own.x, own.y, own.z];   // toward the sun as the ring's own frame sees it, unturned
      style.ring(gb, { R: q.R, r: q.outr, h: q.outH, ink: pal.red, seam: pal.maroon, id: style.gateRing, key: q.key, sun: sunOwn, noise: gateNoise, furrows: 3, furrowWide: 1.8, furrowDeep: 1, notches: q.notches });
      await ctx.yield();
      style.ring(gb, { R: q.bandR, r: q.bandr, h: q.bandH, ink: pal.oxblood, seam: pal.maroon, id: style.gateRing, key: q.key + 5.2, sun: sunOwn, noise: gateNoise, notches: q.notches });
      await ctx.yield();
      style.ring(gb, { R: q.hubR, r: q.r, h: q.hubH, ink: pal.ochre, seam: pal.oxblood, id: style.gateRing, key: q.key + 11.6, sun: sunOwn, noise: gateNoise, furrows: 3, furrowWide: 1.8, furrowDeep: 1 });
      await ctx.yield();
      gate.mesh = gb.mesh(style.rock);
      gate.mesh.matrixAutoUpdate = true;
      gate.mesh.position.copy(gate.pos);
      world.add(gate.mesh);
      // clear air: the least distance from the flown line to the three courses, in every pose 0.125 s apart through one whole
      // nod (the turn about its own axis moves no part of a course's round body; bites only take stone away)
      const courses = [[q.R, q.outr, q.outH], [q.bandR, q.bandr, q.bandH], [q.hubR, q.r, q.hubH]], near = [];
      for (let i = 0; i <= NS; i++) if (Math.hypot(sx[i] - gate.pos.x, sy[i] - gate.pos.y, sz[i] - gate.pos.z) < q.R + 80) near.push(i);
      let best = Infinity;
      for (let k = 0, steps = Math.ceil(q.nodEvery / 0.125); k <= steps; k++) {
        gate.pose(k * 0.125);
        const rq = { x: gate.pos.x, y: gate.pos.y, z: gate.pos.z, ax: [gate.axis.x, gate.axis.y, gate.axis.z], R: 0, r: 0, h: 0 };
        for (const [R, r, h] of courses) { rq.R = R; rq.r = r; rq.h = h; for (const i of near) { const dd = ringDistance(sx[i], sy[i], sz[i], rq); if (dd < best) best = dd; } }
        if (k % 20 === 19) await ctx.yield();
      }
      clearance.gate = best;
      gate.pose(0);
      gate.mesh.quaternion.copy(gate.quat);
      style.setRing(style.gateRing, gate.pos, gate.axis, q.R, q.r, q.h / 2, null);
    }
    await ctx.yield();
    {
      const q = BOAT, x = q.x, z = -q.d;
      const lens = (ang, y) => {
        const a = ang - q.turn, c = Math.abs(Math.cos(a)) / (q.len / 2), s = Math.abs(Math.sin(a)) / (q.wide / 2);
        return Math.pow(Math.pow(c, 1.35) + Math.pow(s, 1.35), -1 / 1.35) * (0.7 + 0.3 * y / q.h);
      };
      style.strata(hb, { x, z, y0: 0, y1: q.h, sides: 22, key: 0, inset: 0.5, shift: 0.3, cap: 0.6, radius: (y, ang) => lens(ang, y) });
      const rim = [];
      for (const y of [0, q.h]) for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = lens(a, y) + 0.6; rim.push([x + Math.cos(a) * r, y, z - Math.sin(a) * r]); }
      castHull(rim);
      note(lineToBody(x, z, q.len / 2 + 1.2, q.h), 'the boat rock');
      keepOut.push({ x, z, r: q.len / 2 + 10 });
    }
    await ctx.yield();
    // the great boulders, of the same strata, each with its floor shadow; placed lists the great boulders (x, z, 1.4 times the radius: the lump's widest reach); the scattered ones join them in the cells below
    const placed = [];
    for (let i = 0; i < GREAT.length; i++) {
      const [x, d, h, r] = GREAT[i], z = -d, key = 31.7 + i * 6.1;
      const rad = (y, ang) => r * (1.08 - 0.5 * y / h) * (1 + 0.22 * Math.cos(ang * 2 + key) + 0.1 * Math.cos(ang * 3 + key * 2));   // a lump: broad below, drawn in to about half its width at the top
      style.strata(hb, { x, z, y0: 0, y1: h, sides: 11, key, inset: 0.9, shift: 0.5, radius: rad });
      const rim = [];
      for (const y of [0, h]) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + key, q = rad(y, a); rim.push([x + Math.cos(a) * q, y, z - Math.sin(a) * q]); }
      castHull(rim);
      note(lineToBody(x, z, r * 1.4 + 1, h), 'a great boulder');
      keepOut.push({ x, z, r: r + 8 });
      placed.push([x, z, r * 1.4]);
    }
    world.add(hb.mesh(style.rock));
    await ctx.yield();

    // ---- the sky's own rock: banks of cloud as flat-bottomed stacks of level slabs standing round the valley in three tiers,
    // 700 m and more from the middle of the valley. They are sky: a flat body ink and one underside ink (gold where the bank
    // stands on the sun's half of the plan, rose elsewhere), no shading and no shadow. No bank stands within 50 degrees of the
    // sun's bearing as taken from a fixed point on the last leg, so the disc is not covered there. Each slab slides to and fro along its bank
    // by the clock, every slab with its own reach and its own period.
    const CLOUD_VS = /* glsl */`
      attribute vec3 aInk; attribute vec4 aSlide;
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        vec3 p = position;
        p.xz += aSlide.xy * sin(uTime * aSlide.w + aSlide.z);
        vec4 w = modelMatrix * vec4(p, 1.);
        vW = w.xyz; vN = normal; vInk = aInk; vId = vec2(-1., 0.);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const cloudMat = style.inkWith(CLOUD_VS, { plain: true });
    const cb = style.builder(), cloudBody = ink(edition.cloud[0]), underSun = ink(edition.cloud[1]), underFar = ink(edition.cloud[2]);
    const crng = rng.fork('clouds'), DOWN = [0, -1, 0], slide = [], PERIODS = [37, 53, 61, 71, 83, 97];
    const TIERS = [[190, 250], [330, 400], [480, 560]];                 // the undersides of the three tiers, in metres
    let banks = 0;
    for (let tier = 0; tier < 3; tier++) for (let i = 0; i < cloudsPerTier; i++) {
      const bearing = (i + tier / 3 + crng.range(0.1, 0.4)) / cloudsPerTier * Math.PI * 2, cb2 = Math.cos(bearing) * Math.cos(bearing), D = 900 + 450 * cb2 + crng.range(0, 150);
      const cx = 180 + Math.sin(bearing) * D, cz = -550 - Math.cos(bearing) * D, tx = Math.cos(bearing), tz = Math.sin(bearing);   // t: along the bank, level, across the bearing
      const len = crng.range(430, 820), thick = crng.range(62, 108), under = crng.range(TIERS[tier][0], TIERS[tier][1]), slabs = crng.int(3, 5), depth = crng.range(110, 170);
      const seen = Math.atan2(cx - 60, -cz - 800) - style.sunBearing, off = Math.abs(Math.atan2(Math.sin(seen), Math.cos(seen)));
      const sunSide = (cx - 180) * SUN.x + (cz + 550) * SUN.z > 0, belly = sunSide ? underSun : underFar, shown = off > 50 * Math.PI / 180;
      if (shown) banks++;
      let y = under, along = 0;
      for (let sl2 = 0; sl2 < slabs; sl2++) {
        const hs = thick / slabs * (sl2 === 0 ? 1.25 : 0.94), a = len / 2 * (1 - 0.17 * sl2 - crng.range(0, 0.08)), bd = depth / 2 * (1 - 0.15 * sl2);
        along += sl2 ? crng.range(-0.2, 0.2) * len * 0.5 : 0;
        const amp = sl2 === 0 ? crng.range(5, 10) : crng.range(16, 34), ph = crng.range(0, 6.28), rate = Math.PI * 2 / crng.pick(PERIODS);
        const n = 14, ring = [], before = cb.tris;
        for (let k = 0; k < n; k++) {
          const ang = k / n * Math.PI * 2, c = Math.cos(ang), sn = Math.sin(ang), wob = 1 + 0.12 * noise.n2(tier * 7.7 + i * 3.1 + c * 1.3, sl2 * 2.7 + sn * 1.3);
          const e = Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(sn), 2.6), -1 / 2.6) * wob;
          const u = along + c * e * a, w = sn * e * bd;
          ring.push([cx + tx * u - tz * w, cz + tz * u + tx * w]);
        }
        const mx = cx + tx * along, mz = cz + tz * along;
        if (shown) for (let k = 0; k < n; k++) {
          const p = ring[k], q = ring[(k + 1) % n];
          cb.quad([p[0], y, p[1]], [q[0], y, q[1]], [q[0], y + hs, q[1]], [p[0], y + hs, p[1]], cloudBody);
          cb.tri([mx, y + hs, mz], [p[0], y + hs, p[1]], [q[0], y + hs, q[1]], cloudBody, -1, 0, UP);
          cb.tri([mx, y, mz], [q[0], y, q[1]], [p[0], y, p[1]], belly, -1, 0, DOWN);
        }
        for (let k = (cb.tris - before) * 3; k > 0; k--) slide.push(tx * amp, tz * amp, ph, rate);
        y += hs;
      }
    }
    const cloudGeo = cb.geometry();
    cloudGeo.setAttribute('aSlide', new THREE.Float32BufferAttribute(slide, 4));
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.matrixAutoUpdate = false; clouds.frustumCulled = false;
    world.add(clouds);
    await ctx.yield();

    // ---- washes: smoothed centre lines, kept for the scatter and the wind ribbons
    const washes = WASHES.map((w) => {
      const curve = new THREE.CatmullRomCurve3(w.map((p) => new THREE.Vector3(p[0], 0, -p[1])), false, 'centripetal');
      const n = Math.max(8, Math.round(curve.getLength() / 8));
      return curve.getSpacedPoints(n).map((p) => [p.x, p.z]);
    });
    const washDist = (x, z) => {
      let best = Infinity;
      for (const w of washes) for (let i = 0; i + 1 < w.length; i += 2) {
        const a = w[i], b = w[Math.min(i + 2, w.length - 1)], ex = b[0] - a[0], ez = b[1] - a[1];
        const t = Math.min(1, Math.max(0, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez || 1)));
        const d = Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t);
        if (d < best) best = d;
      }
      return best;
    };
    const free = (x, z, pad) => { for (const k of keepOut) { const dx = x - k.x, dz = z - k.z, r = k.r + pad; if (dx * dx + dz * dz < r * r) return false; } return true; };
    // ---- the floor along the line: cut stones, cairns and heaps of sand beside the flown line, by a rule of the plan alone (no
    // seed enters it): a place every 16 m of the plan's line, by turns on its left and on its right, each off the line by 1.9 times the
    // eye's height there and 6 to 36 m more (so that from the line it leaves a level view by its side and not under its foot), and larger the
    // further off it lies; in turn a drum lying tipped, a half drum stood on its broken edge with its face toward the sun, a
    // cairn of three slabs, a heap of sand in sloped tiers. A place is passed over where it lies in a keep-out, on a wash, nearer to another leg of the line than to its own,
    // on a stretch of SKIP, on the inner side of the great turn and of the leg after it (INNER), within 240 m of the fallen ring's
    // middle or in the patch of sun that the gate's hole lays on the sand.
    {
      const fb = style.builder(), fnz = makeNoise(FAR_SEED + 2);
      const hash = (k, j) => { const v = Math.sin(k * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
      const SKIP = [[383, 532], [1358, 1626]], INNER = [872, 1358];      // plan metres
      let made = 0;
      for (let k = 0; 24 + 16 * k < PLAN - 20; k++) {
        const s = 24 + 16 * k, i = Math.min(NS - 1, Math.max(1, Math.round(shareAt(s) * NS)));
        if (SKIP.some(([a, b]) => s > a && s < b)) continue;
        const tx = sx[i + 1] - sx[i - 1], tz = sz[i + 1] - sz[i - 1], tl = Math.hypot(tx, tz) || 1;
        const side = k % 2 ? 1 : -1;                                     // -1: the left of the line
        if (side > 0 && s > INNER[0] && s < INNER[1]) continue;
        const lat = 1.9 * sy[i] + 6 + 30 * hash(k, 1), big = Math.min(2.4, Math.max(1, lat / 60));
        const x = sx[i] - side * tz / tl * lat, z = sz[i] + side * tx / tl * lat;
        if (!free(x, z, 10) || !free2(x, z, 10) || washDist(x, z) < 15 || track(x, z).dist < lat - 4 || Math.hypot(x - FALLEN.x, z + FALLEN.d) < 240) continue;
        const gx = x - GATE.x, gy = -GATE.y, gz = z + GATE.d, along = gx * SUN.x + gy * SUN.y + gz * SUN.z;
        if (along < 0 && Math.sqrt(Math.max(0, gx * gx + gy * gy + gz * gz - along * along)) < GATE.r + 14) continue;
        const kind = (k >> 1) % 4, bed = 80 * hash(k, 6);
        let reach = 0, top = 0;
        if (kind === 0) { const rad = (5 + 7 * hash(k, 2)) * big; reach = rad; top = stone(fb, x, 0.25 * rad, z, rad, rad * 0.55, 360 * hash(k, 3), 12 + 22 * hash(k, 4), 180 * hash(k, 5), bed, 0, 6); }
        else if (kind === 1) { const rad = (6 + 6 * hash(k, 2)) * big; reach = rad; top = stone(fb, x, 0.2, z, rad, rad * 0.4, style.sunBearing * 180 / Math.PI + 40 * (hash(k, 3) - 0.5), 62 + 14 * hash(k, 4), 0, bed, 2, 6); }
        else if (kind === 2) {
          let y = 0, rad = (4.5 + 2.5 * hash(k, 2)) * big; reach = rad + 1;
          for (let n = 0; n < 3; n++) { const th = (1.6 + 1.2 * hash(k, 7 + n)) * big; y += th; top = stone(fb, x + (hash(k, 10 + n) - 0.5) * 1.6, y, z + (hash(k, 13 + n) - 0.5) * 1.6, rad, th, 360 * hash(k, 16 + n), 2 + 5 * hash(k, 19 + n), 180 * hash(k, 22 + n), bed + n * 7, 0, 4); rad *= 0.78; }
        } else {
          const hl = (9 + 8 * hash(k, 2)) * big, hw = hl * 0.5, h = Math.min(10, (2.2 + 2.6 * hash(k, 3)) * big); reach = hl; top = h;
          const rad = (y, ang) => { const c = Math.abs(Math.cos(ang + 0.28)) / hl, sn = Math.abs(Math.sin(ang + 0.28)) / hw; return (1 - 0.72 * y / h) / Math.sqrt(c * c + sn * sn) + 0.4; };
          style.strata(fb, { x, z, y0: 0, y1: h, sides: 9, key: k * 3.7 + 1.3, inset: 0.6, shift: 0, talus: 10.5, noise: fnz, radius: rad });
          const rim = [];
          for (const y of [0, h]) for (let n = 0; n < 9; n++) { const a = n / 9 * Math.PI * 2, r = rad(y, a); rim.push([x + Math.cos(a) * r, y, z - Math.sin(a) * r]); }
          castHull(rim);
        }
        note(lineToBody(x, z, reach + 1.5, top + 1), 'a form of the floor');
        keep2.push({ x, z, r: reach + 4 });
        if (++made % 3 === 0) await ctx.yield();
      }
      const forms = fb.mesh(style.rock); forms.name = 'forms of the floor'; world.add(forms);
    }
    await ctx.yield();
    // the boulders that stand on the floor, by 16 m squares, so that a rolling thing can be kept off them
    const CELL = 16, cells = new Map();
    const stand = (x, z, r) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); if (!cells.has(k)) cells.set(k, []); cells.get(k).push([x, z, r]); };
    const offBoulders = (x, z, pad) => {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = cells.get((cx + i) + ',' + (cz + j)); if (c) for (const q of c) if (Math.hypot(x - q[0], z - q[1]) < q[2] + pad) return false; }
      return true;
    };
    for (const q of placed) stand(q[0], q[1], q[2]);

    // ---- boulders: low stacks of the same strata, each with its floor shadow; none within 12 m of the route's track; where the
    // eye rides under 24 m none within 16 m, and none over 1.8 m across within 45 m
    const bb = style.builder(), brng = rng.fork('boulders');
    const boulderCount = Math.round(900 * detail);
    for (let i = 0; i < boulderCount; i++) {
      if (i % 30 === 29) await ctx.yield();
      const x = brng.range(-420, 700), z = -brng.range(-150, 1150), size = brng.range(2, 6), key = brng.range(1, 60);
      const tr = track(x, z);
      if (tr.dist > 330 || tr.dist < 12 || !free(x, z, 0)) continue;
      const low = tr.y < 24 && tr.dist < 45;
      if (low && tr.dist < 16) { brng.range(0.4, 0.7); continue; }
      const s = low ? Math.min(size, 1.8) : tr.dist < 30 ? Math.min(size, 3) : size, top = s * brng.range(0.4, 0.7), r = s / 2;
      if (!free2(x, z, r)) continue;
      style.strata(bb, { x, z, y0: 0, y1: top, sides: 7, key, inset: 0.3, shift: 0.3, radius: (y, ang) => r * (1.1 - 0.4 * y / top) * (1 + 0.3 * Math.cos(ang * 2 + key)) });
      castHull([...circle(x, 0, z, r * 1.1, 6), ...circle(x, top, z, r * 0.85, 6)]);
      note(lineToBody(x, z, r * 1.2 + 0.5, top), 'a boulder');
      stand(x, z, r * 1.2);
    }
    world.add(bb.mesh(style.rock));
    await ctx.yield();

    // ---- scrub: clumps of flat crossed blades of oxblood and maroon, 2 to 4.5 m across, that lean in the wind by the clock.
    // Every blade is two faces back to back; every clump throws its shadow 3.4 times its height long.
    const SCRUB_VS = /* glsl */`
      attribute vec3 aInk; attribute vec2 aId; attribute vec2 aSway;
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        vec3 p = position;
        float s = sin(uTime * 1.9 + aSway.y) + 0.5 * sin(uTime * 3.1 + aSway.y * 1.7);
        p.x += aSway.x * 0.42 * s; p.z += aSway.x * 0.16 * s;
        vec4 w = modelMatrix * vec4(p, 1.);
        vW = w.xyz; vN = mat3(modelMatrix) * normal; vInk = aInk; vId = aId;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const scrubMat = style.inkWith(SCRUB_VS, { two: true });
    const gb = style.builder(), sway = [], srng = rng.fork('scrub');
    const scrubCount = Math.round(3600 * detail * density * (scrubThick ? 1.25 : 0.6));
    const spx = -suz, spz = sux;                                          // across a shadow, on the plan
    for (let i = 0; i < scrubCount; i++) {
      if (i % 200 === 199) await ctx.yield();
      const x = srng.range(-420, 680), z = -srng.range(-120, 1150), wide = srng.range(2, 4.5), tall = wide * srng.range(0.5, 0.75);
      const turn = srng.range(0, Math.PI), ph = srng.range(0, 6.28), keep = srng(), tone = srng.chance(0.5) ? pal.oxblood : pal.maroon;
      const tr = track(x, z);
      if (tr.dist > 310 || tr.dist < 9 + wide || !free(x, z, -6) || !free2(x, z, 1)) continue;
      const lush = washDist(x, z) < 34 || !free(x, z, 14) || (tr.y < 60 && tr.dist < 120);   // thicker along the washes, round feet and fallen rings, and beside the legs of the route that fly under 60 m
      if (!lush && keep > 0.45) continue;
      for (let b = 0; b < 3; b++) {
        const a = turn + b * 1.05, cx = Math.cos(a), cz = Math.sin(a);
        for (let k = -1; k <= 1; k++) {
          const tip = k * wide * 0.5, th = tall * (k === 0 ? 1 : 0.72), base = k * wide * 0.12;
          gb.flat([x + cx * (base - 0.3), 0, z + cz * (base - 0.3)], [x + cx * (base + 0.3), 0, z + cz * (base + 0.3)], [x + cx * tip, th, z + cz * tip], tone);
          sway.push(0, ph, 0, ph, th / 2.5, ph, 0, ph, th / 2.5, ph, 0, ph);
        }
      }
      const e = tall * sl, hw = wide * 0.42;
      sb.quad([x - spx * hw, 0, z - spz * hw], [x + spx * hw, 0, z + spz * hw], [x + sux * e + spx * hw * 0.5, 0, z + suz * e + spz * hw * 0.5], [x + sux * e - spx * hw * 0.5, 0, z + suz * e - spz * hw * 0.5], pal.dusk, -1, 0, UP);
      note(Math.hypot(Math.max(0, tr.dist - wide * 0.5 - 0.5), Math.max(0, tr.y - tall - 0.5)), 'scrub');
    }
    const scrubGeo = gb.geometry();
    scrubGeo.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 2));
    const scrub = new THREE.Mesh(scrubGeo, scrubMat); scrub.matrixAutoUpdate = false; scrub.frustumCulled = false;
    world.add(scrub);
    await ctx.yield();

    // ---- scrub torn loose: balls of the same flat blades that roll downwind along their own lanes by the clock, hopping a
    // little, each with its long shadow on the floor under the sun. A lane lies clear of every body, standing boulders included,
    // and 30 m or more from the route's track, 60 m or more where the eye flies under 24 m.
    const TUMBLE_GLSL = /* glsl */`
      attribute vec4 aLane; attribute vec4 aRun;
      uniform float uTime;
      vec3 rollAt(out float k, out float hop, out float ang) {
        float len = max(aRun.x, 20.), d = mod(aRun.y + uTime * aRun.w, len);
        k = smoothstep(0., 7., d) * (1. - smoothstep(len - 7., len, d));
        hop = aRun.z * (0.5 + 0.45 * abs(sin(d * 0.21 + aRun.y)));
        ang = d / max(aRun.z * 0.5, 0.2);
        return vec3(aLane.x + aLane.z * d, hop, aLane.y + aLane.w * d);
      }`;
    const TUMBLE_VS = /* glsl */`
      attribute vec3 aInk; attribute vec2 aId;
      ${TUMBLE_GLSL}
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        float k, hop, ang; vec3 c = rollAt(k, hop, ang);
        float cs = cos(ang), sn = sin(ang);
        vec3 f = vec3(aLane.z, 0., aLane.w), s = vec3(-aLane.w, 0., aLane.z);
        vec3 p = position * aRun.z * 0.5 * k, n = normal;
        vec3 q = f * (p.x * cs + p.y * sn) + vec3(0., 1., 0.) * (p.y * cs - p.x * sn) + s * p.z;
        vec3 m = f * (n.x * cs + n.y * sn) + vec3(0., 1., 0.) * (n.y * cs - n.x * sn) + s * n.z;
        vec4 w = modelMatrix * vec4(c + q, 1.);
        vW = w.xyz; vN = m; vInk = aInk; vId = aId;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    // the ball's shadow: a long oval on the floor, its near end under the ball's foot as the sun throws it
    const TUMBLE_SHADOW_VS = /* glsl */`
      attribute vec3 aInk; attribute vec2 aId;
      ${TUMBLE_GLSL}
      uniform vec3 uSun;
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        float k, hop, ang; vec3 c = rollAt(k, hop, ang);
        vec2 at = c.xz - uSun.xz * ((hop - aRun.z * 0.5) / max(uSun.y, 0.05)) + position.xz * aRun.z * 0.5 * k;
        vec4 w = modelMatrix * vec4(at.x, 0., at.y, 1.);
        vW = w.xyz; vN = vec3(0., 1., 0.); vInk = aInk; vId = aId;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    {
      const tb = style.builder(), tsb2 = style.builder(), trng = rng.fork('tumble'), lanes = [], runs = [];
      // one ball: three crossed flat stars of six spikes each, every spike two faces back to back
      for (let pl = 0; pl < 3; pl++) for (let k = 0; k < 6; k++) {
        const a0 = k / 6 * Math.PI * 2 + pl, a1 = a0 + 0.42, a2 = a0 + 0.21, tone = (k + pl) % 2 ? pal.oxblood : pal.maroon;
        const at = (a, r) => pl === 0 ? [Math.cos(a) * r, Math.sin(a) * r, 0] : pl === 1 ? [0, Math.cos(a) * r, Math.sin(a) * r] : [Math.cos(a) * r, 0.25 * Math.sin(a * 3) * r, Math.sin(a) * r];
        tb.flat(at(a0, 0.12), at(a1, 0.12), at(a2, 1), tone);
      }
      // its shadow: an oval 0.8 of a ball wide and 3.4 balls long down-sun of the foot (a ball is two units tall)
      const along = 1 / Math.tan(style.sunUp);
      for (let k = 0; k < 10; k++) {
        const a0 = k / 10 * Math.PI * 2, a1 = (k + 1) / 10 * Math.PI * 2, P = (a) => [sux * (1 + Math.cos(a)) * along + spx * Math.sin(a) * 0.8, 0, suz * (1 + Math.cos(a)) * along + spz * Math.sin(a) * 0.8];
        tsb2.tri([sux * along, 0, suz * along], P(a1), P(a0), pal.dusk, -1, 0, UP);
      }
      const want = Math.round(520 * detail * Math.sqrt(density));
      for (let i = 0; i < want * 4 && runs.length < want * 4; i++) {
        const x = trng.range(-380, 620), z = -trng.range(-100, 1100), a = 0.28 + trng.range(-0.16, 0.16), len = trng.range(70, 150), size = trng.range(1.8, 3.4), ph = trng.range(0, len), speed = trng.range(5, 8);
        const dx = Math.cos(a), dz = Math.sin(a);
        let ok = true;
        if (i % 40 === 39) await ctx.yield();
        const n = Math.ceil(len / 5);                                    // the lane is tried every 5 m or less of its length
        for (let k = 0; k <= n && ok; k++) { const px = x + dx * len * k / n, pz = z + dz * len * k / n, tr = track(px, pz); ok = tr.dist > (tr.y < 24 ? 60 : 30) && tr.dist < 300 && free(px, pz, 4) && free2(px, pz, 4) && offBoulders(px, pz, 2.2); }
        if (!ok) continue;
        lanes.push(x, z, dx, dz); runs.push(len, ph, size, speed);
      }
      const make = (b, mat, order) => {
        const g0 = b.geometry(), g = new THREE.InstancedBufferGeometry();
        for (const n of ['position', 'normal', 'aInk', 'aId']) g.setAttribute(n, g0.getAttribute(n));
        g.setAttribute('aLane', new THREE.InstancedBufferAttribute(new Float32Array(lanes), 4));
        g.setAttribute('aRun', new THREE.InstancedBufferAttribute(new Float32Array(runs), 4));
        g.instanceCount = runs.length / 4;
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.matrixAutoUpdate = false; if (order !== undefined) m.renderOrder = order;
        return m;
      };
      world.add(make(tb, style.inkWith(TUMBLE_VS, { two: true })));
      world.add(make(tsb2, style.veilWith(TUMBLE_SHADOW_VS), -3));
      if (runs.length) note(30 - 3.4 - 0.3, 'a ball of scrub rolling');
    }
    await ctx.yield();

    // ---- the floor, drawn in a fixed order: sand, wash ribbons, cracks, ripple marks, wind ribbons, the dust of a landing, the built
    // shadows (their polygons, then the one sheet), then the floor's own strips of shade (dune lees, the shade under the banks),
    // and after all of these the bodies
    const S = 5200, FX = 200, FZ = -550;
    const flb = style.builder();
    flb.quad([FX - S, 0, FZ + S], [FX + S, 0, FZ + S], [FX + S, 0, FZ - S], [FX - S, 0, FZ - S], pal.sand, -1, 0, UP);
    const floor = flb.mesh(style.layer(0)); floor.renderOrder = -6; floor.frustumCulled = false; world.add(floor);

    // a wash: a pale bed between two banks 1.7 m wide in ochre. The bank on the sun's side is a low cut: it keeps the sun from a
    // strip of the bed beside it, up to 2.4 m wide where the bank faces the sun square on (marked shaded). Cracks 0.7 m wide in the
    // bank's ink cut the bed into plates: one wandering down its middle, one across it every 16 m or so.
    const wb = style.builder(), wsb = style.builder(), bed = edition.wet ? pal.sky : style.paleOf(pal.sand), EDGE = 1.7;
    for (let wi = 0; wi < washes.length; wi++) {
      const w = washes[wi]; let prev = null;
      for (let i = 0; i < w.length; i++) {
        const a = w[Math.max(0, i - 1)], b = w[Math.min(w.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
        const end = Math.min(1, Math.min(i, w.length - 1 - i) / 5);                 // the ribbon tapers out at both ends
        const hwL = (WASH_WIDE / 2 + 3 * noise.n2(i * 0.21 + wi * 9.1, 1.3)) * end, hwR = (WASH_WIDE / 2 + 3 * noise.n2(i * 0.21 + wi * 9.1, 7.9)) * end;
        const face = -(nx * sux + nz * suz), shL = Math.min(Math.max(0, hwL - EDGE), 2.4 * Math.max(0, face)), shR = Math.min(Math.max(0, hwR - EDGE), 2.4 * Math.max(0, -face));
        const at = (t) => [w[i][0] + nx * t, 0, w[i][1] + nz * t], mid = 2.6 * noise.n2(i * 0.33 + wi * 4.7, 3.1) * end;
        const cur = { L: at(hwL), iL: at(Math.max(0, hwL - EDGE)), sL: at(Math.max(0, hwL - EDGE) - shL), m0: at(mid + 0.35 * end), m1: at(mid - 0.35 * end), sR: at(-Math.max(0, hwR - EDGE) + shR), iR: at(-Math.max(0, hwR - EDGE)), R: at(-hwR) };
        if (prev) {
          wb.quad(prev.L, cur.L, cur.iL, prev.iL, pal.ochre, -1, 0, UP); wb.quad(prev.iL, cur.iL, cur.sL, prev.sL, bed, -1, 0, UP); wsb.quad(prev.iL, cur.iL, cur.sL, prev.sL, bed, -1, 1, UP);
          wb.quad(prev.sL, cur.sL, cur.m0, prev.m0, bed, -1, 0, UP); wb.quad(prev.m0, cur.m0, cur.m1, prev.m1, pal.ochre, -1, 0, UP); wb.quad(prev.m1, cur.m1, cur.sR, prev.sR, bed, -1, 0, UP);
          wb.quad(prev.sR, cur.sR, cur.iR, prev.iR, bed, -1, 0, UP); wsb.quad(prev.sR, cur.sR, cur.iR, prev.iR, bed, -1, 1, UP); wb.quad(prev.iR, cur.iR, cur.R, prev.R, pal.ochre, -1, 0, UP);
        }
        prev = cur;
      }
    }
    const washMesh = wb.mesh(style.layer(1)); washMesh.renderOrder = -5; washMesh.frustumCulled = false; world.add(washMesh);
    // the strips of shade under the banks: drawn after the shadows' sheet, so a built shadow over one darkens it no further
    const washShade = wsb.mesh(style.layer(1.6)); washShade.renderOrder = -2.4; washShade.frustumCulled = false; world.add(washShade);
    // the cross cracks, one layer over the beds
    const kb2 = style.builder();
    for (let wi = 0; wi < washes.length; wi++) {
      const w = washes[wi];
      for (let i = 6; i + 6 < w.length; i += 2) {
        const a = w[i - 1], b = w[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, nx = -tz, nz = tx;
        const lean = 3 * noise.n2(i * 1.3 + wi * 2.9, 5.5), mid = 2.6 * noise.n2(i * 0.33 + wi * 4.7, 3.1), side = noise.n2(i * 0.9 + wi, 8.8) > 0 ? 1 : -1, reach = WASH_WIDE / 2 - EDGE - 3.2;
        const P = (t, s2) => [w[i][0] + nx * t + tx * (s2 + lean * (t - mid) / reach), 0, w[i][1] + nz * t + tz * (s2 + lean * (t - mid) / reach)];
        kb2.quad(P(mid, -0.35), P(mid, 0.35), P(mid + side * reach, 0.35), P(mid + side * reach, -0.35), pal.ochre, -1, 0, UP);
      }
    }
    const crackMesh = kb2.mesh(style.layer(1.5)); crackMesh.renderOrder = -4.8; crackMesh.frustumCulled = false; world.add(crackMesh);
    await ctx.yield();

    // ---- dune crests: low ridges of sand lying across the sun's bearing, each drawn by the shadow in its lee: a crescent strip of
    // the sand's ink marked shaded, 18 to 60 m long and up to 2.6 m wide (a crest 0.8 m high throws 2.7 m), thinning to a point
    // at both ends. None on a wash or within 4 m of a standing body's keep-out; thicker beside the route's low legs.
    {
      const db = style.builder(), drng = rng.fork('dunes'), duneCount = Math.round(1700 * detail);
      for (let i = 0; i < duneCount; i++) {
        if (i % 250 === 249) await ctx.yield();
        const x = drng.range(-520, 760), z = -drng.range(-220, 1250), len = drng.range(18, 60), r = drng.range(40, 110), wide = drng.range(1.3, 2.6), turn = drng.range(-0.45, 0.45), keep = drng();
        const tr = track(x, z);
        if (washDist(x, z) < 18 || !free(x, z, 4) || !free2(x, z, 2) || (tr.dist > 160 && keep > 0.5) || (tr.y > 60 && tr.dist < 200 && keep > 0.7)) continue;
        // the crest: an arc of radius r about a centre down-sun of it, its middle at (x, z), its chord across the sun's bearing (turned a little)
        const c0 = Math.cos(turn), s0 = Math.sin(turn), nx = sux * c0 - suz * s0, nz = suz * c0 + sux * s0, tx = -nz, tz = nx, span = len / r, N = 6;
        const at = (k) => { const a = (k / N - 0.5) * span, w = wide * (1 - (2 * k / N - 1) ** 2), px = x + nx * r * (1 - Math.cos(a)) + tx * r * Math.sin(a), pz = z + nz * r * (1 - Math.cos(a)) + tz * r * Math.sin(a); return [[px, 0, pz], [px + sux * w, 0, pz + suz * w]]; };
        for (let k = 0; k < N; k++) { const p = at(k), q = at(k + 1); db.quad(p[0], q[0], q[1], p[1], pal.sand, -1, 1, UP); }
      }
      const duneMesh = db.mesh(style.layer(1.2)); duneMesh.renderOrder = -2.35;     // after the shadows' sheet (a built shadow over a lee darkens it no further) and after the washes' shade strips
      duneMesh.matrixAutoUpdate = false; duneMesh.frustumCulled = false; world.add(duneMesh);
    }
    await ctx.yield();

    // ---- wind-sand ribbons: flat lenses up to 2.5 m wide and 20 to 60 m long that run along every wash at 9 m/s by the clock, in the
    // ripple tone. They lie on the floor under the same casts as everything else.
    const STREAK_VS = /* glsl */`
      attribute vec4 aLane; attribute vec4 aRun; attribute vec3 aTone; attribute float aGo;
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        float len = max(aRun.x, 10.), fade = min(18., len * 0.22);
        float d = mod(aRun.y + uTime * aGo, len);
        float k = smoothstep(0., fade, d) * (1. - smoothstep(len - fade, len, d));
        vec2 c = aLane.xy + aLane.zw * d + aLane.zw * position.x * aRun.z + vec2(-aLane.w, aLane.z) * position.z * aRun.w * k;
        vec4 w = modelMatrix * vec4(c.x, 0., c.y, 1.);
        vW = w.xyz; vN = vec3(0., 1., 0.); vInk = aTone; vId = vec2(-1., 0.);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const streakMat = style.inkWith(STREAK_VS, { extra: { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 } });
    // a set of lenses on lanes: plan is the lens outline as [along the lane, across it] in units of the two half sizes
    const laneSet = (plan) => {
      const lanes = [], runs = [], tones = [], go = [];
      return {
        add(x, z, dx, dz, len, phase, half, wide, tone, speed) { lanes.push(x, z, dx, dz); runs.push(len, phase, half, wide); tones.push(tone.r, tone.g, tone.b); go.push(speed); },
        mesh(order) {
          const g = new THREE.InstancedBufferGeometry(), v = [];
          for (const [i0, i1, i2] of [[0, 1, 5], [1, 2, 5], [2, 4, 5], [2, 3, 4]]) v.push(plan[i0][0], 0, plan[i0][1], plan[i1][0], 0, plan[i1][1], plan[i2][0], 0, plan[i2][1]);
          g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
          g.setAttribute('aLane', new THREE.InstancedBufferAttribute(new Float32Array(lanes), 4));
          g.setAttribute('aRun', new THREE.InstancedBufferAttribute(new Float32Array(runs), 4));
          g.setAttribute('aTone', new THREE.InstancedBufferAttribute(new Float32Array(tones), 3));
          g.setAttribute('aGo', new THREE.InstancedBufferAttribute(new Float32Array(go), 1));
          g.instanceCount = go.length;
          const m = new THREE.Mesh(g, streakMat); m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = order;
          return m;
        },
      };
    };
    const LENS = [[-1, 0], [-0.45, 1], [0.45, 1], [1, 0], [0.45, -1], [-0.45, -1]];
    const wrng = rng.fork('wind'), streakSet = laneSet(LENS);
    // a ribbon whose lane's middle lies within 90 m of the route where the route is under 60 m up is made smaller in both
    // sizes: multiplied by the route's height there divided by 60 m, and by no less than 0.35 (by place: the route is a constant of the plan)
    const slight = (x, z) => { const tr = track(x, z); return tr.dist < 90 ? Math.min(1, Math.max(0.35, tr.y / 60)) : 1; };
    for (const w of washes) for (let i = 0; i + 9 < w.length; i += 3) {
      const a = w[i], b = w[i + 9], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l, off = wrng.range(-6, 6);
      const sm = slight(a[0] + dx * l / 2, a[1] + dz * l / 2);
      streakSet.add(a[0] - dz * off, a[1] + dx * off, dx, dz, l, wrng.range(0, l), wrng.range(10, 17) * sm, 1.25 * sm, pal.ripple, 9);
      for (let k = 0; k < 4; k++) streakSet.add(a[0] - dz * wrng.range(-9, 9), a[1] + dx * wrng.range(-9, 9), dx, dz, l, wrng.range(0, l), wrng.range(12, 30) * sm, 1.25 * sm, pal.ripple, 9);
    }

    // blown sand over the open floor: thin ribbons up to 2.6 m wide and 64 m long that run downwind at 9 to 13 m/s by the
    // clock, each on its own lane of 80 to 170 m, growing from a point and thinning to a point
    const WIND = [Math.cos(0.28), Math.sin(0.28)], gustCount = Math.round(420 * detail);
    for (let i = 0; i < gustCount; i++) {
      const x = wrng.range(-480, 720), z = -wrng.range(-200, 1200), len = wrng.range(80, 170), a = wrng.range(-0.08, 0.08);
      const dx = WIND[0] * Math.cos(a) - WIND[1] * Math.sin(a), dz = WIND[1] * Math.cos(a) + WIND[0] * Math.sin(a);
      const sm = slight(x + dx * len / 2, z + dz * len / 2);
      streakSet.add(x, z, dx, dz, len, wrng.range(0, len), wrng.range(14, 32) * sm, wrng.range(0.8, 1.3) * sm, pal.ripple, wrng.range(9, 13));
    }

    // ---- ripple marks: flat lenses 6 to 14 m long lying across the wind, one in about every 8 m of sand near the route and
    // fewer far from it. The sand creeps: every mark crosses its own lane downwind at 3 to 4.5 m/s by the clock, thinning to
    // nothing at the lane's two ends. They lie on the wash beds as on the open sand.
    const rippleSet = laneSet(LENS.map((q) => [q[1], q[0]])), rrng = rng.fork('ripples'), rippleCount = Math.round(30000 * detail);
    for (let i = 0; i < rippleCount; i++) {
      if (i % 250 === 249) await ctx.yield();
      const x = rrng.range(-520, 800), z = -rrng.range(-260, 1340), len = rrng.range(6, 14) / 2, w = rrng.range(0.9, 2.1) / 2, a = 0.28 + rrng.range(-0.3, 0.3), keep = rrng();
      const lane = rrng.range(34, 62), ph = rrng.range(0, lane), speed = rrng.range(3, 4.5);
      const tr = track(x, z), far = tr.dist > 320, small = tr.dist < 90 ? Math.min(1, Math.max(0.4, tr.y / 40)) : 1;   // smaller marks beside the route where the eye is under 40 m
      if ((far && keep > 0.4) || !free(x, z, -9) || !free2(x, z, -4)) continue;
      rippleSet.add(x, z, Math.cos(a), Math.sin(a), lane, ph, w * small, len * small, pal.ripple, speed);
      // the smaller the marks the more of them: up to three more within 9 m of each
      for (let k = Math.round((1 - small) * 5); k > 0; k--) rippleSet.add(x + rrng.range(-9, 9), z + rrng.range(-9, 9), Math.cos(a), Math.sin(a), lane, rrng.range(0, lane), w * small, len * small, pal.ripple, speed);
    }
    world.add(rippleSet.mesh(-4.5));
    world.add(streakSet.mesh(-4));
    await ctx.yield();


    // the built shadows: every polygon first (renderOrder -3, with the rolling scrub's and the birds'), then the one sheet over the floor
    const shadowMesh = sb.mesh(style.veil); shadowMesh.renderOrder = -3; shadowMesh.frustumCulled = false; world.add(shadowMesh);
    const sheet = style.builder();
    sheet.quad([FX - S, 0, FZ + S], [FX + S, 0, FZ + S], [FX + S, 0, FZ - S], [FX - S, 0, FZ - S], pal.dusk, -1, 0, UP);
    const sheetMesh = sheet.mesh(style.lay); sheetMesh.renderOrder = -2.5; sheetMesh.frustumCulled = false; world.add(sheetMesh);
    // the shadows on the mesa tops, drawn after the mesas
    const topShadows = tsb.mesh(style.veilOver); topShadows.renderOrder = 2; topShadows.frustumCulled = false; world.add(topShadows);
    await ctx.yield();

    // ---- the wheel of vultures round the tallest giant: flat shapes 24 m in span, each two faces back to back, one lap in 43 s
    // by the clock, 100 m and more over the floor; the sun throws each bird's shadow on the sand, where it wheels as the bird does
    const HUB = hero.anchors.tallPegs[1].clone().add(hero.anchors.place);
    const VULT_VS = /* glsl */`
      attribute vec3 aInk; attribute vec2 aId; attribute float aWing; attribute vec4 aBird;
      uniform float uTime; uniform vec3 uHub;
      varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
      void main() {
        float ang = aBird.x + uTime * 0.146122;
        vec3 o = vec3(cos(ang), 0., -sin(ang)), f = vec3(-sin(ang), 0., -cos(ang));
        vec3 c = uHub + o * aBird.z + vec3(0., aBird.y + 5. * sin(uTime * 0.23 + aBird.w), 0.);
        float lift = aWing * (1.0 + 0.55 * sin(uTime * 0.9 + aBird.w)) + position.x * 0.14;
        vec4 w = modelMatrix * vec4(c + o * position.x + f * position.z + vec3(0., lift, 0.), 1.);
        vW = w.xyz; vN = -normal; vInk = aInk; vId = aId;        // o, up, f is a mirrored frame: the face that shows is the stored one turned over
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const hubU = { uHub: { value: new THREE.Vector3(HUB.x, 0, HUB.z) } };
    const vultMat = style.inkWith(VULT_VS, { two: true, uniforms: hubU });
    const VULT_SHADOW_VS = VULT_VS.replace('uniform float uTime; uniform vec3 uHub;', 'uniform float uTime; uniform vec3 uHub; uniform vec3 uSun;')
      .replace('vec4 w = modelMatrix * vec4(c + o * position.x + f * position.z + vec3(0., lift, 0.), 1.);',
        'vec3 q = c + o * position.x + f * position.z + vec3(0., lift, 0.);\n        vec4 w = modelMatrix * vec4(q.x - uSun.x * q.y / max(uSun.y, 0.05), 0., q.z - uSun.z * q.y / max(uSun.y, 0.05), 1.);');
    const vb = style.builder(), wing = [], BIRD = 1.6;
    const vtri = (a, b, c) => { vb.flat([a[0] * BIRD, 0, a[1] * BIRD], [b[0] * BIRD, 0, b[1] * BIRD], [c[0] * BIRD, 0, c[1] * BIRD], pal.maroon); wing.push(a[2] * BIRD, b[2] * BIRD, c[2] * BIRD, a[2] * BIRD, c[2] * BIRD, b[2] * BIRD); };
    vtri([0, 2.8, 0], [-0.9, -1.4, 0], [0.9, -1.4, 0]); vtri([-0.9, -1.4, 0], [0, -3.8, 0], [0.9, -1.4, 0]);
    for (const sd of [-1, 1]) {
      vtri([sd * 0.6, 1.5, 0], [sd * 4.2, 2.3, 0.45], [sd * 0.6, -1.3, 0]); vtri([sd * 4.2, 2.3, 0.45], [sd * 4.2, -0.9, 0.45], [sd * 0.6, -1.3, 0]);
      vtri([sd * 4.2, 2.3, 0.45], [sd * 7.5, 1.3, 1], [sd * 4.2, 0.9, 0.45]); vtri([sd * 4.2, 1.0, 0.45], [sd * 7.3, 0.1, 1], [sd * 4.2, -0.1, 0.45]);
      vtri([sd * 4.2, 0.0, 0.45], [sd * 6.9, -1.2, 1], [sd * 4.2, -0.9, 0.45]);
    }
    const vg0 = vb.geometry(), vultGeo = new THREE.InstancedBufferGeometry();
    for (const n of ['position', 'normal', 'aInk', 'aId']) vultGeo.setAttribute(n, vg0.getAttribute(n));
    vultGeo.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
    const birds = [];
    for (let i = 0; i < 9; i++) birds.push(i / 9 * Math.PI * 2 + 0.3 * noise.n2(i * 2.3, 0.7), 122 + 12 * noise.n2(i * 1.9, 5.5), 90 + 9 * noise.n2(i * 3.7, 2.2), i * 2.4);
    vultGeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(birds), 4));
    vultGeo.instanceCount = 9;
    const vultMesh = new THREE.Mesh(vultGeo, vultMat); vultMesh.frustumCulled = false; vultMesh.matrixAutoUpdate = false; vultMesh.visible = vultures > 0;
    world.add(vultMesh);
    const vultShadowMat = style.veilWith(VULT_SHADOW_VS); vultShadowMat.uniforms.uHub = hubU.uHub;
    const vultShadow = new THREE.Mesh(vultGeo, vultShadowMat); vultShadow.frustumCulled = false; vultShadow.matrixAutoUpdate = false; vultShadow.renderOrder = -3; vultShadow.visible = vultures > 0;
    world.add(vultShadow);
    // a bird flies 69 m or more from the giant's middle line and 100 m or more up
    if (vultures > 0) note(lineToBody(HUB.x, HUB.z, 112, 150, 100), 'a vulture');
    await ctx.yield();

    // ---- clearance of the hero by place: the needles, the whole lane of every near ring, and every tall ring through every
    // pose of its own period.
    {
      const place = hero.anchors.place, nd = hero.anchors.needle, lane = hero.anchors.lane;
      const pegs = hero.anchors.pegs.map((p) => [p.x + place.x, p.z + place.z]);
      pegs.forEach((p) => { note(lineToBody(p[0], p[1], nd.footR0 + 1, nd.footY), "a needle's foot"); note(lineToBody(p[0], p[1], nd.r0 * 1.05 + 2.5, nd.top), 'a needle'); });
      hero.anchors.tallPegs.forEach((p, i) => { const g = hero.anchors.giants[i]; note(lineToBody(p.x + place.x, p.z + place.z, g.footR0 + 1.5, g.footY), "a giant's foot"); note(lineToBody(p.x + place.x, p.z + place.z, g.r0 * 1.05 + 4.5, g.top), 'a giant'); });
      await ctx.yield();
      // A near ring rises and sinks upright over a needle and crosses level between needles: its whole lane is three upright
      // columns of its own radius from the lowest seat to the lane's top, and a level run of that radius along the row at the
      // lane's height. The least distance from the flown line to that lane holds at every value of the clock, in the air or at rest.
      for (let i = 0; i < lane.rings.length; i++) {
        const q = lane.rings[i]; let best = Infinity;
        for (const p of pegs) best = Math.min(best, lineToBody(p[0], p[1], q.R, lane.underside + q.h, lane.seatY));
        const a = pegs[0], b = pegs[2], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
        for (let k = 0; k <= n; k++) best = Math.min(best, lineToBody(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, q.R, lane.underside + q.h, lane.underside));
        noteRing(best, 'near ring ' + i + ' on its lane');
        await ctx.yield();
      }
      // the tall rings: one that stirs is measured every 0.125 s through the whole period of its own motion, the others once
      const first = hero.ringsAt(0), STEP = 0.125;
      let poses = 0;
      for (let j = lane.rings.length; j < first.length; j++) {
        const steps = first[j].stirs ? Math.ceil(first[j].stirs / STEP) : 0;
        let best = Infinity, flying = false;
        // the line's samples in order of their level distance from the ring's first place, so that a pose asks only those within its reach
        const c0x = first[j].x + place.x, c0z = first[j].z + place.z, d0 = new Float32Array(NS + 1);
        for (let i = 0; i <= NS; i++) d0[i] = Math.hypot(sx[i] - c0x, sz[i] - c0z);
        const order = Array.from(d0.keys()).sort((a, b) => d0[a] - d0[b]);
        for (let k = 0; k <= steps; k++) {
          if (++poses % 40 === 0) await ctx.yield();
          const q = hero.ringsAt(k * STEP, j)[j];
          q.x += place.x; q.y += place.y; q.z += place.z; flying = flying || q.flying;
          const reach = q.R + Math.min(best, 400), lim = reach + Math.hypot(q.x - c0x, q.z - c0z);
          for (let n = 0; n <= NS; n++) {
            const i = order[n];
            if (d0[i] > lim) break;
            const dx = sx[i] - q.x, dz = sz[i] - q.z;
            if (dx * dx + dz * dz > reach * reach) continue;
            const d = ringDistance(sx[i], sy[i], sz[i], q); if (d < best) best = d;
          }
        }
        if (flying) noteRing(best, 'a tall ring in the air'); else note(best, 'a tall ring at rest');
      }
      if (clearance.rings < clearance.least) note(clearance.rings, clearance.ringWhat);
    }

    // ---- the flight: speeds by route metre, fixed points for the gaze
    const pois = POIS.map(([x, y, d, from, to, weight, fade = 0.3]) => ({ at: new THREE.Vector3(x, y, -d), from: shareAt(from), to: shareAt(to), weight, fade }));

    return {
      scene,
      path,
      duration: 60,
      pace: (u) => keyed(SPEED, metreAt(u)) / SPEED_MEAN,
      camera: { fov: 62, near: 0.5, far: 6000, lookAhead: 30, sway: 0.35, bank: 0.4 },
      pois,
      // the way out's disc: 16 m in radius, so that from the first metre of the last straight (plan metre 1371) to the pass its whole
      // rim stands inside the gate's hole with 2.3 m of room or more to the hole's wall (as built, of 72 flat sides), in every pose of the gate's nod
      portal: { shape: 'circle', radius: 16, color: '#FFE7A0', glow: 1.7, blendDistance: 25 },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none',
      companion: 'none',
      style: 'none',
      clearance,
      puzzle: { lawful: hero.lawful, period: hero.period, moves: hero.moves.length },
      edition: { hour, clouds: banks, scrub: scrubThick ? 'thick' : 'thin', vultures, rare },
      // The clock alone: the hero sets ring poses, casts and dust and the shared uTime by which everything else moves in its
      // vertex shader; the gate's turn, nod and cast are set from the same time. The camera and the progress value are not read.
      update(dt, time) {
        hero.update(dt, time);
        gate.pose(time);
        gate.mesh.quaternion.copy(gate.quat);
        style.setRing(style.gateRing, gate.pos, gate.axis, GATE.R, GATE.r, GATE.h / 2, null);
      },
      dispose() {
        hero.dispose();
        style.blade.dispose(); style.plain.dispose();
      },
    };
  },
};
