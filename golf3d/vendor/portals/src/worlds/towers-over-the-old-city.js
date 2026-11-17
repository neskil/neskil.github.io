// Towers Over the Old City: a bird's flight at a midwinter sunrise through an empty old river city. Up the misty
// northern arm of the river to a bridge laden with houses, low over snow roofs along a crooked lane to a small
// square, up the shaded west front of a great church of dark old stone (the hero, src/parts/towers-over-the-old-city.js),
// between its two towers past the swinging bells, along the lead roof past the open bell steeple and the buttress
// heads, once round over the river's fork and the southern bank, and straight in at the south door, where the
// portal stands. No person and no figure anywhere; nothing lettered.
// THE RING IN THE SOUTH DOOR: this world sets neither portal.drawWithin nor portal.drawIn; the ring is drawn at
// every metre; its inside opens by revealDistance (420 m), which this world sets. What the world shows of its light
// is three things. None of them reads the metres flown or still to fly. (1) and (3) lie by place; (2) is a mirror's
// highlight, and where it is seen goes with the eye.
// (1) ITS WARM LIGHT ON THE STONE AND THE SNOW about the door, BY PLACE ALONE: a lamp of its colour at its seat (the
// jambs, the way before the door, the court's snow near it; the surface's own law in the part).
// (2) A BROKEN HIGHLIGHT of its colour on the open water of the southern arm before the court: A MIRROR'S HIGHLIGHT
// OF THAT LAMP, BY THE MIRROR'S LAW OF DIRECTION ALONE (nothing asks what stands between the water and the lamp). It
// lies where the sight line, mirrored in the rippled water, points at the lamp (whole where it points straight at
// it, half at 7 degrees off, a tenth at 13): so it travels with the eye across the water and along it, as the sun's
// road does. In form it is one smooth highlight broken by the ripples, as the sun's glint is; it has no glint cells
// of its own. From the line's places over the southern bank (S, T, U) an eye sees it; from the door's axis (V and
// after) next to none of it. It is fainter the farther the water lies from the lamp; its one gate by place is a line
// across the river (nothing north of z 60, whole from z 90: so none on the northern arm); the ripples that break it
// run by the clock.
// (3) A GOLD IN THE WATER BEFORE THE WATER STEPS, BY PLACE: across the water under the door's axis (x 78: whole to
// 4.5 m either side, none at 11 m); along it ONE REACH measured from z 97 (about where the ice at the steps' foot
// ends: no piece of it reaches past z 97.9; the lowest step ends at z 90.4), its bounds the same from every metre:
// none at z 97, rising to whole at 6 m beyond it, whole to 8 m, fading to nothing at 26 m (its end ragged by 4.5 m
// at the most). Of the eye it has the mirror's own share (the fresnel term as all this water has it, but never under
// a fifth) and no more. Streaks of a typed gold (.86, .63, .31), paler than the ring's colour and not read from it,
// which move with the ripples by the clock; nothing of what stands inside the ring.
//
// AXES: +x east, +z south, y up, metres. y 0 is the pavement of the island; the river is y -5; both banks y 1.
// The church's west front is the plane x 0, its nave lies on z 0, the apse's round ends at x 128.
//
// THE WORLD'S ONE ROUND: the edge of the sunlight, a level line that comes down through the whole world and is taken
// off it again as cloud bars drift before the low sun, by the WORLD'S CLOCK ALONE: period 126 s, phase 0 at clock 0
// (above the steeple's tip 0 s, the towers' crowns 6 s, the high roof's ridge 20 s, the house ridges 35 s, the lanes'
// floors and the water 60 s, lit 6 s, then off upward by the same curve mirrored). NOTHING ANSWERS IT.
// It is one function (edgeAt in the part); it reads no metres flown, no seed, no lens, no place of the eye; shaders
// read it as light and tint only. Nothing begins, wakes, lights, goes out or flies up because the edge reaches it.
// The bars that cause it are seen: buildBars draws them from the same function and phase. They are bodies of the
// sky, like the dome's sun and moon: drawn about the eye's ground place at one far radius, at their true heights.
// (That the bars' curtain is centred on the eye is the dome's own law and no more: the kit's dome, sun and moon
// go with the eye in the same way. Nothing of the WORLD is taken from the eye by it: no thing's place, no light
// on any stone, no clock. The bars only show, at 2600 m, the edge that edgeAt(clock) has already drawn.)
// THE SUN stands (5 degrees up in the east-south-east). Every other mover is a habit on the world's clock (bells,
// smoke, birds on fixed rounds, wheels, a crane's load, a ferry on its rope, boats at their moorings, weathercocks,
// windmills, the river with its floes, its glitter and its mist): none goes with the visitor, none answers the visitor.
//
// THE DRAWS THIS WORLD'S THINGS ARE DEALT BY ARE HELD: every stream that deals a thing of the town, the river, the
// smoke or the birds is asked as often and in the same order as before; whatever is newer is dealt by a stream of
// its own ('rafts', 'roofs', 'lamps', 'gatelamps', 'trails', 'shards'), each of one law alone, all of its draws
// taken before anything is tried.
// THE TOWN'S SMOKE IS SOFT AND THIN, and the motion gate's warning of little movement is taken with it:
// nothing is made stronger to hold that meter.
//
// WHAT IS PLACED WITH THE WAY IN MIND, each a typed place or a rule of place that holds for its whole stretch, at
// every clock and on every seed (counted from the line on seeds 1 to 100, never from a picture; but for the held
// ice's open water, which is counted as its item says):
//  - the crooked lane under the line from the mill bridge's island end to the square's corner; no chimney nearer
//    than 6 m under the line; every roof, tree and standing thing 2 m and more from the line as a whole;
//  - THE THREE QUARTERS, taken before any house is laid (layLanes), the houses laid round them: the great house on
//    the island about (-96, -27), between the island's second and third long streets, 33 m south of the line in
//    plan; the market on the southern bank about (177, 212), its hall 8 m beside the line's ground track and 22 m
//    under it; the tanners' row on the southern strand from x 98 to 142;
//  - THE THREE LANDMARKS OF THE SOUTHERN BANK (design: three old foundations of the town's own stone, slate and
//    lead; typed, the same on every seed; see COLLEGE, FRIARY, GATE): the college east of the market's square,
//    its bell tower at (250, 282), 294 m south-east of the church's walls, 53 m over its ground; the friary of
//    three gables east of the street that runs south from the stone bridge on x 12, its needle at (56, 304),
//    273 m south of the church's walls, 58 m over its ground; the gate at the southern bank's end of that
//    bridge, its passage at (12, 153), 129 m from the church's walls, its two towers 36 m over their ground.
//    None is as tall as the church's towers. Each stands outside the line's round: their stone 97, 81 and 47 m
//    and more from the whole line; nothing of the gate reaches over the bridge's roadway (its northernmost stone
//    0.85 m south of the roadway's end). The houses are drawn and tried as without them, and a house whose
//    ground meets a landmark's plot is not built (77 a seed); no plume stands within 30 m of the college's
//    tower, the friary's needle or the gate's towers; no ring of birds turns about one of them, and every ring
//    keeps its 3 m over their roofs;
//  - THE TWIN BELFRY, a small church typed at (-112, -48), 26 m south of the line in plan, and the small church
//    with the spire typed at (176, 236), 30 m south of it; every small church the seed draws stands 45 m and more
//    from the track;
//  - THE TYPED BARGES: four at anchor in the northern arm (x -282 to -198, z -149), their middles 17.5 m and
//    more north of the entry's line in plan and 35 m and more from its first point; three at the fork, at
//    (258, 105) under the crane's load, (287, 100) beside it and (226, -3) by the island's point, each 40 m and
//    more from the line; they are set first, and every barge the seed draws keeps 18 m from every barge set
//    before it (hull never nearer hull than 3 m; no hull as a whole nearer the line than 10.5 m);
//  - THE GREAT HOUSE BY THE ENTRY, typed on the island's north shore about (-304, -85), its three towers' feet in
//    the water on z -96.6, its tips at the town's own height (GREAT_TIP): its stone (house, towers, quay with its
//    buttresses) and its pennons 24.5 m and more from the line, the ice at its quay's foot 23.8 m and more, on the
//    right hand of the first 60 m;
//  - the fork's mill, crane and ferry 35 m and more from the line;
//  - no part of a smoke plume within 22 m of the line: its whole body as it is drawn, trail and all, gusting and
//    wavering at its widest (see plumeBody and buildSmoke); none within 30 m of a landmark's tower or needle, none
//    within 90 m of the church's walls, no pot on the stone bridge on x 60, and NONE BEFORE THE CHURCH from any
//    place of the line from A to G or from S to the door (see makeSmokeLaw); a plume whose trail would break one
//    of these keeps its rise and loses its trail (14 to 37 a seed, 24 in the mean), one that would break it even
//    so is not drawn (1 to 14 a seed, 7 in the mean), and no other chimney smokes for it; and where three trails
//    or more would lie side by side within 15 m across the wind the longest is kept short (48 to 136 a seed);
//  - the river's mist under a ceiling 6 m below the line (see buildWater);
//  - THE HELD ICE: rafts of thick floes, each held by a typed thing that stands in the water (the great house's
//    quay by the entry, the row of barges at anchor off it, the court's wall to either side of the water steps and
//    the strand over against it, the bridges' piers), never in a mill's race, with dark open water over four to
//    six tenths of the slow water at each wall (see heldRafts and heldAt; THIS ONE IS NOT COUNTED FROM THE LINE
//    NOR ON EVERY SEED: it is counted on a plan of the water drawn straight down by the water's own shader, on
//    seeds 1 to 12 and on the ten other hoar-frost mornings among seeds 1 to 100); its tops 0.5 m and less over
//    the water, so 6.7 m and more under the line wherever it passes over them (the line's lowest place is 7.24 m
//    over the water);
//  - WHAT STANDS ON THE SOUTHERN BANK'S ROOFS (dormers, stair turrets, cross gables, second stacks: buildRoofs):
//    each inside its own house's hull, on the plan and under the top of that house's own stack, so that no
//    clearance of the line, no bird's height and no plume's pot moves by it; none on a house whose hull comes
//    within 7 m of the line (ROOF_CLEAR); no house of the town is moved, added or taken;
//  - THE BIRDS: every round a ring typed by place, its height taken from what stands under it after the town is
//    laid (3 m and more over every roof, chimney, spire and tree in its band, 6 m and more from every wall and
//    crown of the great church, 8 m and more from the line: see roundHeight); a ring that cannot keep all three
//    is not flown;
//  - THE FLOCKS ALONG THE HIGH WAY: every 15 m of route from C to V is a station that lays to either hand of the
//    track one round of grey and slate pigeons, one of rooks and one of gulls (the gulls only over the river, 90 m
//    and more from the church's walls), each ring as a whole 12 m and more from every place of the line and
//    passing within 22 m of it, beside it or under it and never over it, 3 m and more over every roof under it,
//    clear of the great church's stone and 40 m on the plan from its towers and its steeple (see flockHeight); a
//    ring that cannot keep all of it is not flown;
//  - the sun's disc clear of the steeple's open stage from A to G (see SUN_RADIUS);
//  - the court's ranges and four trees clear of the door's axis; the trodden ways to the doors.
// MEDIA: the river's mist only. It is thinned by nothing that belongs to the eye (not its distance, not its
// height): it lies where the place lets it, and a level sheet of it counts thicker along a slanting sight line, as
// any level layer does. All else is a body.
// EVERY CASTER IS AN InstancedMesh, the single ones of ONE instance (church shells, small churches, court, quarters):
// so the shadow map needs one depth program only, compiled before the flight and never in it. No other reason.
// EVERY SHORE IS A STRAND of shingle. A built wall with courses (a quay: QUAYS) stands ONLY on the two stretches
// where the island's edge stands upright: under the great house by the entry, and under the court's wall on both
// sides of the water steps. Nothing else is walled.
// WHAT READS THE PICTURE'S GRAIN OR THE EYE in this file's shaders (the part's own are named at the part's head).
// Each is a law of drawing only: no thing's place, form, clock or number is taken from it.
// A FILTER BY A PIXEL'S FOOTPRINT (fwidth; this file has no dFdx and no dFdy):
//  - the water's swells and ripples (f1, f2, by fwidth of the ground's x): each of the two sizes fades out before
//    it would be finer than the grain, and with them the eddies at piers, the broken edge of the banks' mirrored
//    band, the streaks and bars of the church's mirrored front before the water steps (drawn at their mean
//    there), the rim ice's plates, their tones and the ice's cracks;
//  - the water's glints (own, by fwidth of each size's cells): a size of glints whose cells are finer than the grain
//    hands its light up to the next greater size's glints (the broader, then the brighter), and so on through
//    stretches of water each twice the last: no light of the sun's road is left out by the grain and none is
//    poured into an even band; which size carries the light is all that is read;
//  - the floes' far law (pg, by fwidth of the ground's x and z; the drifting plates' and the held floes' alike):
//    a plate, its rim, its skirt, its image on the water and a bit of brash are drawn by how much of the grain
//    each fills along the stream and across it, the drifts and ridges on a plate's top and the relief, the thrown
//    shade and the swept places of a held floe's give way to their mean tone, and where plates cannot be told the
//    water shows their share of white;
//  - the smoke's plume (hb, by fwidth across its strip): drawn a grain broad at the least and so much the fainter
//    (one grain at the most: a filter that keeps the plume's light; no law of it counts grains).
// A SHADING BY THE DIRECTION FROM A THING TO THE EYE (cameraPosition less the thing's place, in a fragment):
//  - the water (V, dist): what it mirrors and how much (the sky's blue, the warm tone and the sun's road toward
//    the sun, the sun's glint, the door's light as a highlight broken by the ripples, the fresnel share; of the
//    church's mirrored front before the water steps and the gold in it the fresnel share alone, never under a
//    fifth), the banks' dark band deeper where
//    the eye is low, the fog by distance, the low haze by distance and warmer toward the sun;
//  - the floes' thickness (V, as lift: the sight line's way over the water for a metre of height; the drifting
//    plates' and the held floes' alike): a plate's snow top, its upright rim and the rim's image on the water are
//    drawn on the water's own sheet where the line from the eye meets them (the top over the water by the ice's
//    own measure, FLOE_RISE); the plate's place, form, size and height are not taken from the eye;
//  - the mist (V, dist): a level sheet counts thicker along a slanting sight line, warmer toward the sun, the fog
//    by distance;
//  - the smoke (V, dist): a lit plume brighter against the light; the fog by distance and the low haze by distance
//    and height, warmer toward the sun, by the surfaces' own laws to the number;
//  - the birds (dist): the fog by distance.
// TURNED OR CENTRED BY THE EYE'S PLACE, as a drawing's law only:
//  - the smoke's strip is turned to face the eye about the plume's own bent way (vertex: cameraPosition; the way,
//    its bend down the wind, its gusts and its waver are the place's and the clock's, the same from every side);
//  - the cloud bars' curtain is centred on the eye's ground place at one far radius (vertex: cameraPosition.x and
//    .z), and how near the sun's place in the sky a point of it stands is taken from the eye's height (fragment:
//    cameraPosition.y): bodies of the sky, drawn about the eye as the kit's dome, sun and moon are.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero, makeShared, makeSurface, makeGB, wallFrame, archWall, archFill, bar, arcBars, moulding, tracery, edgeAt, EDGE_PERIOD, EDGE_LOW, CHURCH } from '../parts/towers-over-the-old-city.js';

const DURATION = 50;
const WATER_Y = -5, BANK_Y = 1;
const SUN = [0.920, 0.087, 0.382];
const TAN_SUN = 0.0875;
// THE SUN'S DISC is half a degree across (the kit reads a radius in degrees). Its law by place: seen from the line
// between the entry and the square's corner (A to G) the disc's rim never touches the outline of the steeple's
// open stage (counted every metre: the disc's middle passes it by a third of a degree at the nearest).
const SUN_RADIUS = 0.25;

// ---------------------------------------------------------------- the place: island, arms, banks (typed measures)
const ease = (t) => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
// the island lies like a ship aground, bow down the stream at x -664, its eastern point at (236, 20)
const islandN = (x) => {
  if (x < -330) return 30 - 130 * Math.pow(clamp((x + 664) / 334, 0, 1), 0.55);
  if (x < -40) return -100;
  if (x < 100) return -100 + 30 * ease((x + 40) / 140);
  return -70 + 90 * Math.pow(clamp((x - 100) / 136, 0, 1), 1.8);
};
const islandS = (x) => {
  if (x < -330) return 30 + 150 * Math.pow(clamp((x + 664) / 334, 0, 1), 0.55);
  if (x < -230) return 180;
  if (x < -60) return 180 - 95 * ease((x + 230) / 170);
  if (x < 110) return 85;
  return 85 - 65 * Math.pow(clamp((x - 110) / 126, 0, 1), 1.6);
};
const ISLE_X0 = -664, ISLE_X1 = 236;
// the northern bank's shore (the broad arm is 105 m) and the southern bank's (the narrow arm 60 m); east of the
// island's point the river is one stream, west of the bow the arms close again
const bankN = (x) => {
  if (x < -664) return -205 + 60 * ease((-664 - x) / 400);
  if (x < -40) return -205;
  if (x < 100) return -205 + 30 * ease((x + 40) / 140);
  return -175 + 75 * ease((x - 100) / 320);
};
const bankS = (x) => {
  if (x < -664) return 240 - 60 * ease((-664 - x) / 400);
  if (x < -330) return 240;
  if (x < 110) return islandS(x) + 60;
  return 145 - 60 * ease((x - 110) / 310);
};
const onIsland = (x, z, m = 0) => x > ISLE_X0 + m && x < ISLE_X1 - m && z > islandN(x) + m && z < islandS(x) - m;
// Every shore is a strand: the ground goes down to the water over STRAND metres of shingle outside the typed shore
// line. Only under the court's wall, where the water steps go down, and under the great house by the entry, whose
// three towers stand with their feet in the water, the island's edge stands upright; there, and nowhere else, it
// is a built wall with courses (QUAYS).
const STRAND = 8;
// THE QUAY WALLS (typed, see quay() in buildFar2): [from x, to x, the island's edge z, the side the water lies on],
// each on a stretch where the island's edge stands upright; QUAY_OUT: how far their buttresses stand into the water.
const QUAYS = [[-330, -268, -100, -1], [56, 62, 85, 1], [94, 104, 85, 1]], QUAY_OUT = 2.1;
const quayName = (q) => 'quay:' + q[0] + ':' + q[2];
const strandS = (x) => STRAND * (1 - smoothstep(34, 48, x) * (1 - smoothstep(108, 122, x)));
const strandN = (x) => STRAND * (1 - smoothstep(-356, -344, x) * (1 - smoothstep(-264, -252, x)));
// the schools' hill on the southern bank: from z 300 it rises to y 45 about (120, 620)
const hillY = (x, z) => { const d = Math.hypot((x - 120) / 420, (z - 620) / 330); return 44 * ease(1 - d); };
const groundY = (x, z) => (onIsland(x, z) ? 0 : z > 0 ? BANK_Y + hillY(x, z) : BANK_Y);

// ---------------------------------------------------------------- the route: typed places of the world, in order
// Each is a place with a reason a person standing there could give (the progress file lists the rules R1 to R11).
const ROUTE = [
  [-320, 3, -135],     // A  the entry: 8 m over the northern arm, 35 m off the island's shore, 170 m west of the mill bridge
  [-261, 3, -125],     // B  60 m on, level: under the bridge houses' eaves, over the mist
  [-205, 13, -116],    // C  lifting toward the bridge's ridge
  [-150, 28, -106],    // D  over the mill bridge's house row near its island end, 8 m over the ridge
  [-115, 27, -82],     // E  over the crooked lane
  [-82, 27, -58],      // F  the lane, the small church's turret 26 m to the right
  [-56, 26, -37],      // G  over the roofs at the square's north-west corner
  [-36, 31, -19],      // H  over the square, 36 m off the west front
  [-20, 43, -7],       // I  climbing the front, level with the arcade
  [-8, 53, -1],        // J  over the arcade's platform
  [4, 57, 0],          // K  in the gap, 6.5 m from each tower's inner face, 10 m over the parapet
  [20, 57, 0.5],       // L  out of the gap over the nave's ridge
  [45, 57, 7],         // M  along the roof's south side
  [78, 58, 16],        // N  abeam the steeple, 13.5 m from its open stage
  [105, 50, 21],       // O  sinking over the choir's buttress heads, crossing them at right angles
  [135, 44, 24],       // P  out over the apse
  [202, 41, 52],       // Q  the half-round about (135, 119), radius 95: the garden's point
  [230, 37, 119],      // R  the river's fork
  [202, 33, 186],      // S  the southern bank's roofs
  [135, 29, 214],      // T  heading west over the bank
  [95, 27, 197],       // U  the quarter round about (135, 157), radius 57
  [78, 26, 157],       // V  on the door's axis, heading north
  [78, 14.6, 122],     // W  over the southern arm
  [78, 8.2, 102],      // W2 coming level over the water before the steps
  [78, 6.6, 90],       // X  at the water steps
  [78, 6.5, 70],       // X2 over the court, level
  [78, 6.5, 28.5],     // Y  the portal between the south door's jambs, 2.5 m inside the front's face
];

const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// ---------------------------------------------------------------- ground: the island's pavement, both banks, the hill
const COBBLE = [0.2, 0.19, 0.185], EARTH = [0.17, 0.15, 0.13], FIELD = [0.55, 0.57, 0.62], FOOTING = [0.2, 0.185, 0.17];
async function buildGround(W) {
  const g = makeGB(), WL = WATER_Y - 0.25;
  // how much snow lies: the square, the court and the garden more than the trodden lanes
  const snowAt = (x, z) => (x > 130 ? 0.85 : x > 48 && x < 108 && z > 31 ? 0.6 : x > -40 && x < 0 && Math.abs(z) < 30 ? 0.5 : 0.3);
  for (let x = ISLE_X0; x < ISLE_X1; x += 12) {
    const x1 = Math.min(x + 12, ISLE_X1), n = 7;
    for (let i = 0; i < n; i++) {
      const za = lerp(islandN(x), islandS(x), i / n), zb = lerp(islandN(x), islandS(x), (i + 1) / n), zc = lerp(islandN(x1), islandS(x1), i / n), zd = lerp(islandN(x1), islandS(x1), (i + 1) / n);
      g.col(x > 130 ? EARTH : COBBLE).mat(4, snowAt((x + x1) / 2, (za + zb) / 2));
      g.quad([x, 0, zb], [x1, 0, zd], [x1, 0, zc], [x, 0, za]);
    }
    // the island's strands: shingle from the pavement's edge down under the water, the snow thinning toward it
    const n0 = islandN(x), n1 = islandN(x1), s0 = islandS(x), s1 = islandS(x1), t0 = Math.max(strandS(x), 0.8), t1 = Math.max(strandS(x1), 0.8);
    const m0 = Math.max(strandN(x), 0.8), m1 = Math.max(strandN(x1), 0.8);
    if (m0 + m1 < 2) g.col(FOOTING).mat(0, 0.3).quad([x, 0, n0], [x1, 0, n1], [x1, -7, n1 - m1], [x, -7, n0 - m0], 4);
    else {
      g.col(EARTH, 1.15).mat(4, 0);
      g.weights(1, 1, 0.12, 0.12).quad([x, 0, n0], [x1, 0, n1], [x1, WL, n1 - m1], [x, WL, n0 - m0]);
      g.quad([x, WL, n0 - m0], [x1, WL, n1 - m1], [x1, -7.5, n1 - m1 - 4], [x, -7.5, n0 - m0 - 4]);
    }
    if (t0 + t1 < 2) g.col(FOOTING).mat(0, 0.3).quad([x1, 0, s1], [x, 0, s0], [x, -7, s0 + t0], [x1, -7, s1 + t1], 4);
    else {
      g.col(EARTH, 1.15).mat(4, 0);
      g.weights(1, 1, 0.12, 0.12).quad([x1, 0, s1], [x, 0, s0], [x, WL, s0 + t0], [x1, WL, s1 + t1]);
      g.quad([x1, WL, s1 + t1], [x, WL, s0 + t0], [x, -7.5, s0 + t0 + 4], [x1, -7.5, s1 + t1 + 4]);
    }
  }
  await W.ctx.yield();
  // the strand round the island's bow and round its eastern point
  g.col(EARTH, 1.15).mat(4, 0.3);
  for (const [tx, tz, dir] of [[ISLE_X1, islandN(ISLE_X1), 1], [ISLE_X0, islandN(ISLE_X0), -1]]) {
    const arc = []; for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + Math.PI * i / 6; arc.push([tx + dir * Math.cos(a) * STRAND, WL, tz + dir * Math.sin(a) * STRAND]); }
    for (let i = 0; i < 6; i++) g.tri([tx, 0, tz], arc[i + 1], arc[i]);
  }
  // the trodden way from the water steps up the court to the south door, and the ways across the square to the west
  // doors. A WAY HAS NO KERB: it is where the snow is trodden thin. From the snow that lies beside it (the place's
  // own depth) the cover thins over 3 m and more to the trodden middle, the margin's breadth by the stream 'way',
  // so that its edge is the snow's own ragged edge and never a ruled line
  const RW = W.RNG.way;
  const way = (ax, az, bx, bz, ha, hb, lying, n, mid = 0.05) => {
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, rows = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, h = lerp(ha, hb, t), cx = ax + (bx - ax) * t, cz = az + (bz - az) * t;
      rows.push([-h - 2.2 - RW.range(0, 1.6), -h + 0.9 + RW.range(-0.7, 0.5), h - 0.9 + RW.range(-0.5, 0.7), h + 2.2 + RW.range(0, 1.6)].map((o) => [cx + nx * o, 0.03, cz + nz * o]));
    }
    g.col(COBBLE, 1.1).mat(4, mid);
    for (let i = 0; i < n; i++) {
      const a = rows[i], b = rows[i + 1];
      g.weights(lying, mid, mid, lying).quad(a[0], a[1], b[1], b[0]);
      g.quad(a[1], a[2], b[2], b[1]);
      g.weights(mid, lying, lying, mid).quad(a[2], a[3], b[3], b[2]);
    }
  };
  // (the court's way is trodden snow with the cobbles showing through in patches, not bare stone: its middle keeps
  // about half the cover of a lane)
  way(78, 85, 78, 32, 3.5, 4.5, 0.6, 16, 0.32);
  for (const z of [-13.5, 0, 13.5]) way(-1, z, -40, z * 0.5, 2.2, 2.2, 0.5, 10);
  // the water steps of the court, 32 m broad about x 78
  g.col([0.27, 0.26, 0.25]).mat(0, 0);
  for (let i = 0; i < 6; i++) g.box(62, -1 - i, 85 + i * 0.9, 94, -i * 0.95, 85 + (i + 1) * 0.9 + 0.01, 0, 8 | 32 | 1 | 2);
  // both banks: fine near the river, coarse to the horizon; white fields beyond the town's wall
  const xs = []; for (let x = -3200; x < 3200; x += Math.abs(x) < 700 ? 25 : Math.abs(x) < 1500 ? 80 : 340) xs.push(x); xs.push(3200);
  const offs = [0, 25, 70, 150, 300, 520, 800, 1250, 1900, 3200];
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i], xb = xs[i + 1];
    if (i % 20 === 19) await W.ctx.yield();
    for (const side of [-1, 1]) {
      const sh = side < 0 ? bankN : bankS, y = (x, z) => groundY(x, z);
      for (let k = 0; k < offs.length - 1; k++) {
        const za0 = sh(xa) + side * offs[k], za1 = sh(xa) + side * offs[k + 1], zb0 = sh(xb) + side * offs[k], zb1 = sh(xb) + side * offs[k + 1];
        const far = Math.hypot((xa + xb) / 2 + 100, (za0 + za1) / 2) > 1330;
        g.col(far ? FIELD : COBBLE).mat(4, far ? 1 : 0.32);
        if (side > 0) g.quad([xa, y(xa, za1), za1], [xb, y(xb, zb1), zb1], [xb, y(xb, zb0), zb0], [xa, y(xa, za0), za0]);
        else g.quad([xa, y(xa, za0), za0], [xb, y(xb, zb0), zb0], [xb, y(xb, zb1), zb1], [xa, y(xa, za1), za1]);
      }
      // the bank's strand
      g.col(EARTH, 1.15).mat(4, 0);
      const e = -side * STRAND, e2 = -side * (STRAND + 4);
      if (side > 0) {
        g.weights(1, 1, 0.12, 0.12).quad([xa, BANK_Y, sh(xa)], [xb, BANK_Y, sh(xb)], [xb, WL, sh(xb) + e], [xa, WL, sh(xa) + e]);
        g.quad([xa, WL, sh(xa) + e], [xb, WL, sh(xb) + e], [xb, -7.5, sh(xb) + e2], [xa, -7.5, sh(xa) + e2]);
      } else {
        g.weights(1, 1, 0.12, 0.12).quad([xb, BANK_Y, sh(xb)], [xa, BANK_Y, sh(xa)], [xa, WL, sh(xa) + e], [xb, WL, sh(xb) + e]);
        g.quad([xb, WL, sh(xb) + e], [xa, WL, sh(xa) + e], [xa, -7.5, sh(xa) + e2], [xb, -7.5, sh(xb) + e2]);
      }
    }
  }
  // THE BRIDGE GATE'S OWN GROUND: about its two towers' feet the snow lies deep as in a yard, so that no street's
  // trodden cobbles run under them; over the plot's last 3 m it thins to the bank's own. (The roadway's ramp through
  // the passage is the bridge's worn paving and lies over it.)
  {
    const G = GATE, xa = G.x - G.off - G.r - 4, za = bankS(G.x) + 0.3, nx = 14, nz = 6, dx = (2 * (G.off + G.r + 4)) / nx, dz = (G.z + G.r + 4.4 - za) / nz;
    const lie = (i, j) => 0.32 + 0.68 * smoothstep(0, 1, Math.min(i, nx - i, j, nz - j));
    g.col(COBBLE).mat(4, 1);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x0 = xa + i * dx, x1 = x0 + dx, z0 = za + j * dz, z1 = z0 + dz;
      g.weights(lie(i, j + 1), lie(i + 1, j + 1), lie(i + 1, j), lie(i, j)).quad([x0, groundY(x0, z1) + 0.03, z1], [x1, groundY(x1, z1) + 0.03, z1], [x1, groundY(x1, z0) + 0.03, z0], [x0, groundY(x0, z0) + 0.03, z0]);
    }
  }
  await W.ctx.yield();
  W.groundMat = makeSurface(W.shared, { shadeQ: true });
  const geo = g.build(), mesh = new THREE.Mesh(geo, W.groundMat);
  mesh.receiveShadow = true; mesh.frustumCulled = false; W.scene.add(mesh);
  // the standing shade of the town on its own ground is written into aQ.w once the houses stand (W.shadeAt)
  W.groundGeo = geo;
  const q = geo.attributes.aQ; for (let i = 0; i < q.count; i++) q.setW(i, -1000);
}

// ---------------------------------------------------------------- the river: dark water that mirrors the sky and the banks, ice at its rims
const NOISE_GLSL = /* glsl */`
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
const SHORE_RECT = [-760, -235, 1280, 500];
const MIST_CLEAR = 6, MIST_LANE = 10;
// FLOE_RISE: THE ICE'S OWN MEASURE OF A PLATE'S HEIGHT. A plate's snow top stands over the water by so many
// hundredths of the middle breadth of its kind (a great plate's kind is 5.1 m across in the middle, a small one's
// 2.4 m): the broader ice is the thicker, so a great plate's top stands 0.77 m over the water and a small one's
// 0.35 m. FLOE_SHIFT: the moving water (its ripples, its glints and all that drifts on it) is shifted along the
// stream by ONE draw of the seed, up to so many metres, and across it by FLOE_SLANT of that: the floes of one seed
// are not those of another. Of what is of the shore (the rim's ice, the mirrored banks, the wheels' foam, the
// eddies at piers) their places stay the world's.
const FLOE_RISE = 0.15, FLOE_SHIFT = 4000, FLOE_SLANT = 0.11;
// THE HELD ICE (a law of the river's place): BROAD RAFTS OF THICK FLOES, EACH HELD BY A THING THAT STANDS IN THE
// WATER, with lanes and reaches of dark open water between and beside them. THE SLOW WATER (the same on every seed)
// lies under the island's two upright built walls (QUAYS: the great house's wall by the entry; the court's wall
// on both sides of the water steps), 50 m out from them: there the river's drifting ice goes on down the stream as
// on the whole river, and the held ice lies only in its rafts. A RAFT'S HOLDER IS TYPED (heldRafts; the same on
// every seed, so that there is held ice on every seed): (1) the great house's quay, a raft along it from past its
// upstream end to down the stream of its lee end; (2) the row of the four barges at anchor off the entry (the
// stream runs toward -x and a barge lies bow up the stream), a raft along the row from below the first one's
// stern to past the last one's bow; (3) the court's wall and the island's shore to either side of the water steps,
// a raft up the stream of the steps and one down the stream of them (the steps' own water between them stays
// open), and a narrow one on the southern bank's strand over against them; (4) the upstream nose of every bridge
// pier that stands in no mill's race, and the lee of one pier in three. A raft's length along the stream and its
// breadth are its own, by the stream 'rafts' (a stream of this law alone: three draws a raft at a wall, at the
// barges and at the strand, five a pier, drawn for every holder in the typed order whether its raft is built or
// not). heldField writes the rafts as one number of the place: 1/2 at a raft's bound, more inside it and less
// outside by one in 2 * HELD_SOFT metres, so that it is 0 from HELD_SOFT metres outside the bound on. (The water's
// shader asks for held ice only where the number is over 0: a held floe's whole outline, and every place on the
// water's sheet where a sight line can meet its top or its image, lies nearer its raft than HELD_SOFT.) The bound
// is ragged (heldRag: 4 m over some 12 m and 1.5 m over some 4 m, by the place and the seed's one draw of the
// moving water). A site has its floe by its own draw: none whose middle lies less than half its radius inside the
// bound, HELD_SHARE of a size's sites HELD_RIM metres further in (the four sizes', greatest first). NO FLOE IS HELD
// IN A MILL'S RACE: none whose site lies within HELD_RACE metres of the water that runs to a wheel (from
// HELD_RACE_UP metres above it) and from it (to HELD_RACE_DOWN metres below it), and no pier's raft is laid whose
// ground would reach within 6 m of one; nor within HELD_STEPS[4] metres of the ice that lies frozen to the foot of
// the water steps (HELD_STEPS: its ground, x from and to, z from and to; see the court), which has its own
// plates. THE DRIFTING ICE melts away as it comes to a raft (from HELD_MELT[0] to HELD_MELT[1] metres outside its
// bound: the water about a raft and the lane between two rafts lie open and dark; a single plate or one of a
// string, which is of no drifting raft, from HELD_LONE[0] to HELD_LONE[1] metres: NO PIECE LIES ALONE in the
// open water about the held rafts, see plateAt), but for a mill's race, through which it drifts on whatever lies
// beside it (HELD_RACE_IN: whole from 7 m inside the race's bound on, none nearer the bound than 4 m).
// HOW MUCH OF THE SLOW WATER LIES OPEN (the law the rafts' measures are set by): between four and six tenths of
// the water within 50 m of each of the two walls, counted on a plan of the water drawn straight down by the
// water's own shader, at two clocks, on seeds 1 to 12 and on the ten other hoar-frost mornings among seeds 1 to
// 100, on which the rim's ice is broadest (0.43 to 0.56 at the great house's quay, 0.45 to 0.58 at the court's):
// not from the line and not on every seed. The rest is ice, in rafts, never spread evenly.
// WHICH floes lie in a raft is the seed's: the sites go by the moving water's one draw (FLOE_SHIFT), and the
// rafts' sizes by the stream 'rafts'; the holders are the world's.
// A HELD FLOE IS A SLAB OF THICK ICE OF FOUR SIZES (HELD_SIZES: the breadth of a size's squares, the least radius
// in them, and the turn and the bend of that size's own ground, see heldAt; 1.9 to 13.5 m across in all: no
// sheet of held ice is broader than 14 m), its top HELD_RISE metres over the water (0.5, 0.42, 0.33 and 0.24 m:
// the line's lowest place is 7.24 m over the water, so the tops lie 6.7 m and more under it), its broken edge
// an upright wall of dark blue-green ice of that height. See heldAt for a floe's form and heldRelief for its top.
// AT THE COURT, AT THE STRAND AND AT THE PIERS THE FLOES LIE HEAPED, a greater one on the smaller ones about it
// (but for the lee rafts of two piers, named next).
// AT THE ARRIVAL (HELD_APART: the northern arm from x -405 to x -160, which lies above the bridge on x -470 and
// below the mill bridge, its upper bound under the mill bridge itself. It holds the great house's raft, the
// barges' and, where the seed lays them, the lee rafts of the mill bridge's two northern piers, which are
// therefore floes apart and not heaped) THE HELD ICE IS ONE SHEET BROKEN INTO SEPARATE
// FLOES: all of the sheet's one thickness at the place (HELD_SHEET), none on another, every floe parted from
// every greater one beside it by A LEAD OF DARK WATER (HELD_LEAD metres broad by the place; see the sum in the
// water's main), the floes a little fuller in their squares (HELD_FULL: the least radius there) and no slab of
// brash in the leads.
// IT IS HELD, NOT FROZEN FAST: each floe sways on the water by the world's clock, HELD_SWAY metres to either side
// along the stream and across it on two slow periods of its own (6 to 11 s), as a whole and without turning. The
// brash in and about a raft sways likewise, each bit by its own draw (0.1 m a cake, 0.06 m a crumb, 0.04 m a slab).
const HELD_RACE = 10, HELD_RACE_UP = 40, HELD_RACE_DOWN = 30, HELD_RACE_IN = [4, 7];
const HELD_SOFT = 35, HELD_MELT = [12, 10], HELD_LONE = [24, 22], HELD_RIM = 2, HELD_SHARE = [0.9, 0.97, 0.97, 0.95], HELD_SWAY = 0.2, HELD_STEPS = [59.6, 96, 85, 98, 5];
const HELD_SIZES = [[19, 0.2, 0.3, 1.6], [11.5, 0.22, -0.47, 2.6], [6.6, 0.24, 0.92, 3], [3.9, 0.24, -1.1, 2.6]], HELD_RISE = [0.5, 0.42, 0.33, 0.24], HELD_ROUND = 0.355;
// (THE ARRIVAL'S BROKEN SHEET: its water's bounds on x, north of z 0; the sheet's thickness by the place; the
// breadth of a lead by the place; a floe's least radius in its square there)
const HELD_APART = [-405, -160], HELD_SHEET = [0.3, 0.5], HELD_LEAD = [0.35, 1], HELD_FULL = 0.28;
// (the white a raft shows where its floes cannot be told one from another, by the floes' far law: about seven
// tenths of a heaped raft's ground lies under a top or under brash, and two thirds of the broken sheet's at the
// arrival, counted straight down on the quay's raft and the barges', 2 m inside their bounds)
const HELD_COVER = 0.7, HELD_COVER_SHEET = 0.67;
// THE RAFTS, each [x, z of its middle, half its length along the stream, half its breadth]: a ground with round
// ends (anchored: the four barges at anchor off the entry, as buildBoats set them)
const raceOf = (W, x, z) => { let d = 1e3; for (const w of W.wheels) d = Math.min(d, Math.hypot(Math.max(w.x - HELD_RACE_DOWN - x, x - w.x - HELD_RACE_UP, 0), z - w.y) - HELD_RACE); return d; };
function heldRafts(W, anchored) {
  // (off: a raft at a wall lies outside the rim's ice there, which is broader on a hoar-frost morning)
  const R = W.RNG.rafts, rafts = [], off = (W.V.hoar ? 7 : 3.2) + 1.5;
  // (1) along the great house's quay, past its upstream end and trailing down the stream from its lee end
  { const [x0, x1, zw, dir] = QUAYS[0], b = R.range(12.5, 14), xa = x0 - R.range(34, 42), xb = x1 + R.range(28, 36); rafts.push([(xa + xb) / 2, zw + dir * (b + off), (xb - xa) / 2, b]); }
  // (2) along the row of the four barges at anchor, from below the first one's stern to past the last one's bow
  { const xa = anchored[0][0] - BARGE_HALF - R.range(44, 54), xb = anchored[3][0] + BARGE_HALF + R.range(5, 11), b = R.range(14.5, 16); rafts.push([(xa + xb) / 2, (anchored[0][1] + anchored[3][1]) / 2 - 2.5, (xb - xa) / 2, b]); }
  // (3) under the court's wall and the island's shore to either side of the water steps: up the stream of the
  // steps toward the ferry's rope, down the stream of them to the stone bridge's piers; and (3b) on the southern
  // bank's strand between that bridge and the door's axis
  { const [, x1, zw, dir] = QUAYS[2], b = R.range(15, 17), xa = 78 + R.range(9, 12), xb = x1 + R.range(40, 46); rafts.push([(xa + xb) / 2, zw + dir * (b + off), (xb - xa) / 2, b]); }
  { const [x0, , zw, dir] = QUAYS[1], b = R.range(15, 17), xb = 78 - R.range(9, 12), xa = x0 - R.range(42, 48); rafts.push([(xa + xb) / 2, zw + dir * (b + off), (xb - xa) / 2, b]); }
  { const xa = R.range(28, 34), xb = R.range(58, 64), b = R.range(5.5, 7), xm = (xa + xb) / 2; rafts.push([xm, bankS(xm) - STRAND - off - b, (xb - xa) / 2, b]); }
  // (4) the piers
  for (const p of W.piers) {
    const a = R.range(6, 10), b = R.range(4, 6.5), lee = R() < 0.35, la = R.range(5, 8), lb = R.range(3.5, 5);
    const up = [p[0] + p[2] + a * 0.55, p[1], a, b], dn = [p[0] - p[2] - la * 0.6, p[1], la, lb];
    for (const r of lee ? [up, dn] : [up]) if (Math.min(raceOf(W, r[0] - r[2], r[1]), raceOf(W, r[0], r[1]), raceOf(W, r[0] + r[2], r[1])) > r[3] + 6) rafts.push(r);
  }
  return rafts;
}
function heldField(W, TW, TH, x0, z0, sw, sh, rafts) {
  const F = new Float32Array(TW * TH), px = sw / TW, pz = sh / TH, m = HELD_SOFT;
  for (const [cx, cz, a, b] of rafts) {
    const i0 = Math.max(0, Math.floor((cx - a - m - x0) / px)), i1 = Math.min(TW - 1, Math.ceil((cx + a + m - x0) / px)), j0 = Math.max(0, Math.floor((cz - b - m - z0) / pz)), j1 = Math.min(TH - 1, Math.ceil((cz + b + m - z0) / pz));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      // (metres inside the raft's bound at a place, negative outside it)
      const inside = b - Math.hypot(Math.max(Math.abs(x0 + (i + 0.5) * px - cx) - (a - b), 0), z0 + (j + 0.5) * pz - cz);
      const v = clamp(0.5 + inside / (2 * HELD_SOFT), 0, 1), k = j * TW + i;
      if (v > F[k]) F[k] = v;
    }
  }
  return F;
}
async function buildWater(W, anchored) {
  const drift = W.RNG.drift.range(0, FLOE_SHIFT);
  // metres to the nearest waterline (the strand's foot) or pier, baked small: red 0..1 is 0..40 m
  const TW = 512, TH = 192, data = new Uint8Array(TW * TH * 4), D = new Float32Array(TW * TH), [x0, z0, sw, sh] = SHORE_RECT;
  // the shores first, column by column (they run mostly along x), then every pier stamped into its own neighbourhood
  for (let i = 0; i < TW; i++) {
    if (i % 64 === 0) await W.ctx.yield();
    const x = x0 + (i + 0.5) / TW * sw, bn = bankN(x), bs = bankS(x), isl = x > ISLE_X0 && x < ISLE_X1, n = isl ? islandN(x) : 0, s = isl ? islandS(x) : 0;
    const tip = !isl && x > ISLE_X0 - 40 && x < ISLE_X1 + 40, tx = x < ISLE_X0 ? ISLE_X0 - x : x - ISLE_X1, tz = x < ISLE_X0 ? 30 : 20, st = strandS(x), sn = strandN(x);
    for (let j = 0; j < TH; j++) {
      const z = z0 + (j + 0.5) / TH * sh; let d = Math.min(z - bn, bs - z) - STRAND;
      if (isl) d = Math.min(d, Math.max(n - z - sn, z - s - st)); else if (tip) d = Math.min(d, Math.hypot(tx, z - tz) - STRAND);
      D[j * TW + i] = d;
    }
  }
  await W.ctx.yield();
  const DS = D.slice();
  for (const p of W.piers) {
    await W.ctx.yield();
    const i0 = Math.max(0, Math.floor((p[0] - p[2] - 40 - x0) / sw * TW)), i1 = Math.min(TW - 1, Math.ceil((p[0] + p[2] + 40 - x0) / sw * TW));
    const j0 = Math.max(0, Math.floor((p[1] - p[3] - 40 - z0) / sh * TH)), j1 = Math.min(TH - 1, Math.ceil((p[1] + p[3] + 40 - z0) / sh * TH));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = x0 + (i + 0.5) / TW * sw, z = z0 + (j + 0.5) / TH * sh, d = Math.hypot(Math.max(Math.abs(x - p[0]) - p[2], 0), Math.max(Math.abs(z - p[1]) - p[3], 0));
      if (d < D[j * TW + i]) D[j * TW + i] = d;
    }
  }
  await W.ctx.yield();
  // THE MIST'S CEILING BY PLACE (blue: -5 to 3 m): the mist keeps MIST_CLEAR metres and more from the flown line. Within
  // MIST_LANE metres of the line's ground track its ceiling is that much under the line; aside it rises half a metre a metre.
  const CEIL = new Float32Array(TW * TH).fill(3), P = new THREE.Vector3(), px = sw / TW, pz = sh / TH, reach = MIST_LANE + 2 * (3 + MIST_CLEAR) + 6;
  for (let m = 0; m <= W.LEN; m += 2) {
    if (m % 20 === 0) await W.ctx.yield();
    W.path.posAtDist(m, P);
    if (P.y - MIST_CLEAR > 3 || P.z < z0 - reach || P.z > z0 + sh + reach) continue;
    const i0 = Math.max(0, Math.floor((P.x - reach - x0) / px)), i1 = Math.min(TW - 1, Math.ceil((P.x + reach - x0) / px)), j0 = Math.max(0, Math.floor((P.z - reach - z0) / pz)), j1 = Math.min(TH - 1, Math.ceil((P.z + reach - z0) / pz));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      // a texel's value serves the whole of its neighbourhood (the texture is read between texels): the nearest it can be
      const d = Math.max(Math.hypot(x0 + (i + 0.5) * px - P.x, z0 + (j + 0.5) * pz - P.z) - 0.75 * Math.hypot(px, pz), 0), c = P.y - MIST_CLEAR + Math.max(d - MIST_LANE, 0) * 0.5;
      if (c < CEIL[j * TW + i]) CEIL[j * TW + i] = c;
    }
  }
  await W.ctx.yield();
  // THE HELD RAFTS' FIELD (the texture's fourth number; see heldRafts)
  const rafts = heldRafts(W, anchored), HELD = heldField(W, TW, TH, x0, z0, sw, sh, rafts);
  await W.ctx.yield();
  for (let k = 0; k < TW * TH; k++) { if (k % 16384 === 0) await W.ctx.yield(); data[k * 4] = Math.round(clamp(D[k] / 40, 0, 1) * 255); data[k * 4 + 1] = Math.round(clamp(DS[k] / 40, 0, 1) * 255); data[k * 4 + 2] = Math.floor(clamp((CEIL[k] + 5) / 8, 0, 1) * 255); data[k * 4 + 3] = Math.round(HELD[k] * 255); }
  W.mistCeil = { CEIL, TW, TH, x0, z0, px, pz }; W.held = { F: HELD, TW, TH, x0, z0, px, pz, rafts };
  const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  W.shoreTex = tex;
  await W.ctx.yield();
  const S = W.shared, mat = new THREE.ShaderMaterial({
    uniforms: {
      uEdge: S.uEdge, uTime: S.uTime, uFogDen: S.uFogDen, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uFogCol: S.uFogCol, uFogWarm: S.uFogWarm,
      tShore: { value: tex }, uRect: { value: new THREE.Vector4(x0, z0, 1 / sw, 1 / sh) }, uIce: { value: W.V.hoar ? 7 : 3.2 }, uFloe: { value: W.V.hoar ? 0.72 : 0.66 },
      // the moving water's own shift (see FLOE_SHIFT): one draw of the seed
      uShift: { value: new THREE.Vector2(drift, drift * FLOE_SLANT) },
      uZen: { value: new THREE.Color('#40588f') }, uHor: { value: new THREE.Color('#a2b3d6') }, uWarm: { value: new THREE.Color('#f8d2a0') },
      uDeep: { value: new THREE.Color('#10201f') }, uIceCol: { value: new THREE.Color('#aeb9c8') }, uSkyCol: S.uSkyCol, uWheel: { value: W.wheels }, uPortalPos: S.uPortalPos, uPortalCol: S.uPortalCol,
    },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: NOISE_GLSL + /* glsl */`
uniform sampler2D tShore; uniform vec4 uRect; uniform vec2 uShift; uniform float uEdge, uTime, uFogDen, uIce, uFloe;
uniform vec3 uSunDir, uSunCol, uFogCol, uFogWarm, uZen, uHor, uWarm, uDeep, uIceCol, uSkyCol, uPortalPos, uPortalCol; uniform vec3 uWheel[7];
varying vec3 vW;
// A RAFT'S GROUND at the place fp of the moving water: 1 in a raft's middle, falling to 0 at its ragged rim, 0 on
// open water. The water is ruled in rows 30 m broad, each row in fields 66 to 80 m long by its own draw and
// shifted by its own draw. A field has one raft or none (share: how many fields have one). A raft's middle is
// thrown anywhere in its field (up to half a field from the field's middle, along the stream and across it); it
// lies along the stream, 27 to 66 m long and from half as broad as long to as broad as long (30 m at the most),
// each by its own draw, before its rim's raggedness. As its plates lie a raft is 18 to 61 m long (nine in ten of
// them 23 to 52 m) and 8 to 30 m broad (nine in ten 13 to 27 m): counted on 1,058 rafts. So no raft knows its
// row: rafts lap over their fields' bounds and here and there two run together. (No raft is longer or broader
// than a field, so a place lies in the rafts of the four fields nearest to it or in none: those four are asked.)
float raftAt(vec2 fp, float share) {
  float g = 0., rag = 1. + .8 * vn(fp * .14), ry = fp.y / 30., r0 = floor(ry), rs = fract(ry) < .5 ? -1. : 1.;
  for (int j = 0; j < 2; j++) {
    float row = r0 + rs * float(j), len = 66. + 14. * h21(vec2(row, 3.)), rx = fp.x / len + h21(vec2(row, 11.)), c0 = floor(rx), cs = fract(rx) < .5 ? -1. : 1.;
    for (int i = 0; i < 2; i++) {
      vec2 ri = vec2(c0 + cs * float(i), row);
      float rl = 13.5 + 19.5 * h21(ri + 13.), rb = min(rl * (.5 + .5 * h21(ri + 19.)), 15.);
      vec2 rf = (vec2(rx, ry) - ri - vec2(h21(ri + 3.), h21(ri + 7.))) * vec2(len, 30.) / vec2(rl, rb);
      g = max(g, step(h21(ri + 29.), share) * (1. - smoothstep(.55, 1., dot(rf, rf) * rag)));
    }
  }
  return g;
}
// A RAFT'S RAGGED BOUND at the place s (added to the rafts' baked number): 4 m over some 12 m and 1.5 m over some
// 4 m, by the place and the seed's one draw of the moving water
float heldRag(vec2 s) { return ((vn((s + uShift) * .085 + 5.) - .5) * 8. + (vn((s + uShift) * .23 + 13.) - .5) * 3.) * ${(1 / (2 * HELD_SOFT)).toFixed(5)}; }
// (raceAt: metres from the place s to the nearest mill race's bound, negative inside a race)
float raceAt(vec2 s) {
  float d = 1e3;
  for (int i = 0; i < 7; i++) d = min(d, length(vec2(max(max(uWheel[i].x - ${HELD_RACE_DOWN.toFixed(1)} - s.x, s.x - uWheel[i].x - ${HELD_RACE_UP.toFixed(1)}), 0.), s.y - uWheel[i].y)) - ${HELD_RACE.toFixed(1)});
  return d;
}
// ONE PLATE OF ICE at the place fq of the moving water, in one of the two sizes of cell (cell metres; off: that
// size's own shift): x how far inside its outline the place lies (metres; negative outside it, far below where the
// cell has no plate), y the plate's own draw, z the picture's grain across its rim (metres), w its breadth (metres).
// A cell has a plate or none as before (by the raft's ground at the cell's own middle, in a string, or one in
// forty alone, and that one only if it is 2 m across and more). A PLATE IS BROKEN ICE: its mean radius by its own draw (r0 to 0.37 of its cell), its middle thrown
// as far from the cell's as its size lets it; an outline of FIVE TO NINE SIDES OF UNEQUAL LENGTH (the bearing
// about its middle warped by its own two draws), each side at its own distance from the middle (0.84 to 1.08 of
// the radius), and ONE OR TWO BITTEN CORNERS (a round bite out of its rim, a fifth to a third of its radius); it
// turns slowly as it goes. No two are alike. (lc: the place in the plate's own frame, metres from its middle, and
// the cosine and sine of its turn: what lies on a plate lies in that frame and turns with it)
vec4 plateAt(vec2 fq, vec2 pg, float cell, float off, float r0, float held, out vec4 lc) {
  vec2 fc = (fq + off) / cell; float lane = h21(vec2(floor(fc.y), 71.)); fc.x += lane;
  vec2 fi = floor(fc) + off * 3.; float fh = h21(fi + 17.);
  // (a string: the plate's place in its lane's stretch of sixteen, where that stretch's string begins and ends)
  vec2 si = vec2(floor(fi.x / 16.), fi.y); float sq = fi.x - si.x * 16., s0 = floor(h21(si + 53.) * 8.);
  float str = step(h21(si + 47.), .05) * step(s0, sq) * step(sq, s0 + 2.5 + floor(h21(si + 59.) * 6.));
  // (mine: the plate is of a drifting raft; else it is one of a string or a single one)
  float mine = step(fh, raftAt((floor(fc) + vec2(.5 - lane, .5)) * cell - off, uFloe) * 2.4), here = max(max(mine, str), step(h21(fi + 37.), .025));
  lc = vec4(0., 0., 1., 0.);
  if (here < .5) return vec4(-1e3, fh, 1., 0.);
  float hr = h21(fi + 5.), r = mix(r0, .37, hr), room = max(.49 - 1.34 * r, 0.);
  // (a single plate is 2 m across and more, anywhere: a smaller one is not drawn)
  if (max(mine, str) < .5 && 2. * r * cell < 2.) return vec4(-1e3, fh, 1., 0.);
  vec2 th = (vec2(h21(fi + 9.), h21(fi + 3.)) - .5) * 2. * room, ff = fract(fc) - .5 - th;
  // NEAR A HELD RAFT (held: the rafts' number at the place asked, over 0 within HELD_SOFT metres of one) a drifting
  // plate MELTS AWAY as its own middle comes from HELD_MELT[0] to HELD_MELT[1] metres outside the raft's ragged
  // bound (two metres of its way: it is the smaller, as a whole, and gone from there on; none is ever drawn half
  // there, and none lies over a held floe: those keep within their raft's bound, see heldAt); but for a mill's
  // race, where it stays whole. NO PIECE OF ICE LIES ALONE IN THE OPEN WATER ABOUT THE HELD RAFTS: a plate of no
  // drifting raft (a single one, one of a string) is gone already HELD_LONE[1] metres outside a held raft's bound
  // (melting from HELD_LONE[0]), and a melting plate that would be less than 2 m across is not drawn at all: what
  // ice there is under 2 m lies in a raft or within 1.5 m of one (the brash)
  if (held > 0.) {
    vec2 wm = (floor(fc) + .5 + th - vec2(lane, 0.)) * cell - off - uShift - vec2(uTime * .6, 0.);
    float inM = (textureLod(tShore, (wm - uRect.xy) * uRect.zw, 0.).a + heldRag(wm) - .5) * ${(2 * HELD_SOFT).toFixed(1)};
    float gone = max(smoothstep(${(-HELD_MELT[0]).toFixed(1)}, ${(-HELD_MELT[1]).toFixed(1)}, inM), (1. - mine) * smoothstep(${(-HELD_LONE[0]).toFixed(1)}, ${(-HELD_LONE[1]).toFixed(1)}, inM));
    if (gone > 0.) gone *= smoothstep(${(-HELD_RACE_IN[1]).toFixed(1)}, ${(-HELD_RACE_IN[0]).toFixed(1)}, raceAt(wm));
    r *= 1. - gone;
    if (gone > .9 || (gone > 0. && 2. * r * cell < 2.)) return vec4(-1e3, fh, 1., 0.);
  }
  float ang = uTime * (fh - .5) * .25 + fh * 40., ca = cos(ang), sa = sin(ang);
  ff = vec2(ca * ff.x - sa * ff.y, sa * ff.x + ca * ff.y);
  lc = vec4(ff * cell, ca, sa);
  float fl = max(length(ff), 1e-4), fa = atan(ff.y, ff.x + 1e-5), sg = 6.2832 / (5. + floor(h21(fi + 23.) * 5.));
  float fb = mod(fa + .35 * sin(fa + fh * 6.28) + .16 * sin(2. * fa + hr * 6.28) + 12.5664, 6.2832), k = floor(fb / sg);
  float d = r * (.84 + .24 * h21(fi + vec2(k, 31.))) / max(cos(fb - (k + .5) * sg), .5) - fl;
  for (int j = 0; j < 2; j++) {
    float hj = h21(fi + 41. + float(j) * 7.), ba = hj * 6.2832, br = r * (.2 + .16 * h21(fi + 43. + float(j) * 7.));
    // (the second bite on one plate in two)
    d = min(d, length(ff - vec2(cos(ba), sin(ba)) * r * 1.02) - br + step(.5, hj) * float(j));
  }
  // (the grain across the plate's rim, along the stream and across it apart)
  vec2 gd = ff / fl, gw = vec2(ca * gd.x + sa * gd.y, ca * gd.y - sa * gd.x);
  return vec4(d * cell, fh, max(dot(abs(gw), pg), 1e-3 * cell), 2. * r * cell);
}
// MAY A FLOE BE HELD at the place s of the world: 0 in a mill's race (raceAt, above) and where the water steps' own
// ice lies (see HELD_RACE and HELD_STEPS), 1 elsewhere, between the two over 3 m (a site holds its floe where this
// is 1/2 and more)
float heldFree(vec2 s) {
  float d = length(vec2(max(max(${HELD_STEPS[0].toFixed(1)} - s.x, s.x - ${HELD_STEPS[1].toFixed(1)}), 0.), max(max(${HELD_STEPS[2].toFixed(1)} - s.y, s.y - ${HELD_STEPS[3].toFixed(1)}), 0.))) - ${HELD_STEPS[4].toFixed(1)};
  return smoothstep(-1.5, 1.5, min(d, raceAt(s)));
}
// ONE HELD FLOE at the place w of the world (the held ice does not go with the moving water; see heldRafts), in
// one of its four sizes of square (cell metres; off: that size's own shift; r0: its least radius in its square;
// share, turn, amp: that size's share of sites, its ground's turn and its ground's bend): the same four numbers
// plateAt gives of a drifting plate. A HELD FLOE IS A DRIFTING PLATE THAT CAME TO REST: an outline of five to nine
// unequal sides with one or two bitten corners, as plateAt draws it, its radius by its own draw (r0 to HELD_ROUND
// of its square), thrown as far from its square's middle as its size lets it, turned its own way once and for
// all. EACH SIZE HAS A GROUND OF ITS OWN: its squares lie in lanes, each lane shifted by its own draw, on a ground
// TURNED by that size's own angle against the stream (HELD_SIZES: 17, -27, 53 and -63 degrees) and BENT by its
// own measure (heldBend: long bends of 1.6 to 3 m over some 9 m, short ones of 0.5 m over some 2 m), so that no
// row of floes is straight, no two sizes' rows run alike and nothing repeats at a square's breadth; the rim is
// chipped in two sizes besides (0.22 m over 1.2 m, 0.08 m over 0.4 m). The four sizes lie over one another as
// they came to rest: a greater floe lies on the smaller ones about it, but at the arrival, where a lead parts
// them (see the sum in main). A square has its
// floe or none by its own draw (share: how many of a size's squares in a raft's middle have one; see HELD_SHARE),
// by the rafts' number AT THE FLOE'S OWN MIDDLE (with heldRag: none whose middle lies less than half its own
// radius inside the raft's ragged bound, all of the share from HELD_RIM metres further in) and by heldFree
// there: a floe is held as a whole or not at all, and lies within its raft. It sways as a whole by the clock
// (HELD_SWAY) and does not turn. (lc: the place in the floe's own axes, metres from its middle, and the cosine
// and sine of its turn against the world's. heldBend: the bend alone, to be added to a place.)
vec2 heldBend(vec2 s, float amp) { return amp * (vec2(vn(s * .11 + 3.), vn(s * .11 + 17.)) - .5) + .5 * (vec2(vn(s * .47 + 31.), vn(s * .47 + 57.)) - .5); }
vec4 heldAt(vec2 w, vec2 pg, float cell, float off, float r0, float share, float turn, float amp, out vec4 lc) {
  vec2 rot = vec2(cos(turn), sin(turn)), ws = w + uShift, wb = ws + heldBend(ws, amp);
  vec2 fc = (vec2(rot.x * wb.x - rot.y * wb.y, rot.y * wb.x + rot.x * wb.y) + off) / cell; float lane = h21(vec2(floor(fc.y), 71.)); fc.x += lane;
  vec2 ci = floor(fc), fi = ci + off * 3.; float fh = h21(fi + 17.);
  lc = vec4(0., 0., 1., 0.);
  float hr = h21(fi + 5.), r = mix(r0, ${HELD_ROUND.toFixed(3)}, hr), sw = ${HELD_SWAY.toFixed(2)} / cell, room = max(.49 - sw - 1.34 * r, 0.);
  vec2 th = (vec2(h21(fi + 9.), h21(fi + 3.)) - .5) * 2. * room;
  // (the floe's own middle as a place of the world: its square's ground turned back and the bend taken off again,
  // to within a fifth of the bend; read at one explicit level: this is asked inside a loop that can end early,
  // where Direct3D leaves derivatives undefined)
  vec2 sq = (ci + .5 + th - vec2(lane, 0.)) * cell - off, su = vec2(rot.x * sq.x + rot.y * sq.y, rot.x * sq.y - rot.y * sq.x), sp = su - heldBend(su, amp) - uShift;
  float in0 = (textureLod(tShore, (sp - uRect.xy) * uRect.zw, 0.).a + heldRag(sp) - .5) * ${(2 * HELD_SOFT).toFixed(1)} - .5 * r * cell;
  if (h21(fi + 37.) >= share * clamp(in0 / ${HELD_RIM.toFixed(1)}, 0., 1.) || heldFree(sp) < .5) return vec4(-1e3, fh, 1., 0.);
  // (the floe's sway by the clock: the place is taken back by it before the floe's own axes are laid)
  vec2 sway = ${HELD_SWAY.toFixed(2)} * sin(uTime * (.55 + .5 * vec2(h21(fi + 71.), h21(fi + 73.))) + fh * vec2(6.2832, 10.681));
  vec2 wq = ws - sway, wc = wq + heldBend(wq, amp), fq = (vec2(rot.x * wc.x - rot.y * wc.y, rot.y * wc.x + rot.x * wc.y) + off) / cell; fq.x += lane;
  vec2 ff = fq - ci - .5 - th;
  float ang = fh * 40., ca = cos(ang), sa = sin(ang);
  ff = vec2(ca * ff.x - sa * ff.y, sa * ff.x + ca * ff.y);
  // (the floe's axes against the world's: its own turn and its size's ground's together)
  float ct = cos(ang + turn), st = sin(ang + turn);
  lc = vec4(ff * cell, ct, st);
  float fl = max(length(ff), 1e-4), fa = atan(ff.y, ff.x + 1e-5), sg = 6.2832 / (5. + floor(h21(fi + 23.) * 5.));
  float fb = mod(fa + .35 * sin(fa + fh * 6.28) + .16 * sin(2. * fa + hr * 6.28) + 12.5664, 6.2832), k = floor(fb / sg);
  float d = r * (.84 + .24 * h21(fi + vec2(k, 31.))) / max(cos(fb - (k + .5) * sg), .5) - fl;
  for (int j = 0; j < 2; j++) {
    float hj = h21(fi + 41. + float(j) * 7.), ba = hj * 6.2832, br = r * (.2 + .16 * h21(fi + 43. + float(j) * 7.));
    // (the second bite on one floe in two)
    d = min(d, length(ff - vec2(cos(ba), sin(ba)) * r * 1.02) - br + step(.5, hj) * float(j));
  }
  vec2 gd = ff / fl, gw = vec2(ct * gd.x + st * gd.y, ct * gd.y - st * gd.x);
  return vec4(d * cell - .22 * (vn(wq * .8 + 3.) - .5) - .08 * (vn(wq * 2.5 + 9.) - .5), fh, max(dot(abs(gw), pg), 1e-3 * cell), 2. * r * cell);
}
// THE RELIEF OF A HELD FLOE'S TOP, metres over its own level, at the place lp in its own axes (fsh: its own draw;
// wide: its breadth). A HELD FLOE IS A SLAB: its top is FLAT right out to its broken edge. A floe of 3.5 m and
// more carries a PRESSURE RIDGE, one great floe in two a second: a sharp crest of pushed-up blocks, 0.3 m high and
// a third of a metre to either side, broken along its length; two great floes in five carry A RAFTED PIECE (a
// slab ridden up on them, a third of a metre over about a third of their top, its broken edge sharp across the
// floe); and half the floes LIE GENTLY TILTED, one side up to 6 in 100 higher than the other.
float heldRelief(vec2 lp, float fsh, float wide) {
  float h = 0.;
  for (int j = 0; j < 2; j++) {
    float hj = fract(fsh * (7.3 + 5.1 * float(j)) + .37 * float(j)), ra = hj * 3.1416, on = j == 0 ? step(3.5, wide) : step(.5, fract(fsh * 13.7)) * step(6., wide);
    float rd = dot(lp, vec2(cos(ra), sin(ra))) - (fract(hj * 9.7) - .5) * .5 * wide + .5 * (vn(lp * .7 + hj * 9.) - .5);
    h += on * .3 * (1. - smoothstep(.04, .32, abs(rd))) * smoothstep(.3, .42, vn(lp * 1.6 + hj * 31.));
  }
  float sa = fract(fsh * 17.9) * 6.2832, ta = fract(fsh * 3.3) * 6.2832;
  h += step(.6, fract(fsh * 5.7)) * step(5., wide) * .32 * smoothstep(-.04, .04, dot(lp, vec2(cos(sa), sin(sa))) - .12 * wide + .6 * (vn(lp * .5 + fsh * 71.) - .5));
  return h + smoothstep(.5, .9, fract(fsh * 11.3)) * .06 * dot(lp, vec2(cos(ta), sin(ta)));
}
// BRASH: one bit of broken ice at the place bc (in squares of its own size), by how much of the grain gw it fills:
// each lane of squares shifted, each bit thrown in its square and turned its own way, A SHARD of four unequal
// straight sides, no two alike, most of them small (its half breadth 0.1 to 0.36 of the square); sw: its sway (in squares) on the slow water, by the clock and
// its own draw. x: how much of the grain is the bit's; y: the square's draw (whether it has a bit at all); z: the
// bit's tone
vec3 brashAt(vec2 bc, float gw, float sw, float big) {
  bc.x += h21(vec2(floor(bc.y), 19.)); vec2 bi = floor(bc); float bh = h21(bi + 4.), bn = bh * 6.2832, br = mix(.1 + .26 * bh * bh, .16 + .2 * bh, big);
  vec2 bf = fract(bc) - .5 - (vec2(h21(bi + 2.), h21(bi + 6.)) - .5) * 2. * max(.49 - 1.34 * br - sw, 0.);
  bf -= sw * sin(uTime * (.7 + .6 * vec2(h21(bi + 31.), h21(bi + 33.))) + bh * vec2(17., 29.));
  bf = vec2(cos(bn) * bf.x - sin(bn) * bf.y, sin(bn) * bf.x + cos(bn) * bf.y);
  // (a shard: four straight sides at uneven bearings, each at its own distance, the whole long or stubby by its own
  // draw, and nothing of it farther from its middle than its square leaves room for)
  float h8 = h21(bi + 8.), h9 = h21(bi + 15.), bd = length(bf) / 1.34; vec2 bg = bf * vec2(.6 + .8 * h8, 1.);
  for (int k = 0; k < 4; k++) { float hk = fract(h9 * (3.7 + 2.9 * float(k)) + .31 * float(k)), ak = (float(k) + .9 * (hk - .5)) * 1.5708; bd = max(bd, dot(bg, vec2(cos(ak), sin(ak))) * (.75 + .75 * fract(hk * 9.1))); }
  return vec3(clamp(.5 + (br - bd) / gw, 0., 1.) * min(1., 2. * br / gw), h21(bi + 13.), h21(bi + 21.));
}
void main() {
  vec2 p = vW.xz; vec4 sh = texture2D(tShore, (p - uRect.xy) * uRect.zw); float sd = sh.r * 40., ss = sh.g * 40.;
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  // a slow dark river: long low swells and small ripples running down the stream (toward -x), sized in metres;
  // each size fades out before it would be finer than the picture's grain
  vec2 q = p + uShift + vec2(uTime * .6, 0.);
  float f1 = clamp(1.4 - fwidth(q.x) * 1.2, 0., 1.), f2 = clamp(1.2 - fwidth(q.x) * 4., 0., 1.);
  vec2 rp = vec2(vn(q * vec2(.35, .7) + vec2(0., uTime * .2)) - .5, vn(q * vec2(.35, .7) + vec2(31., -uTime * .17)) - .5) * .13 * f1
          + vec2(vn(q * 1.9 - vec2(uTime * .7, 0.)) - .5, vn(q * 1.9 + vec2(17., uTime * .5)) - .5) * .07 * f2;
  // eddies where the stream meets a pier or a pile
  rp += (1. - smoothstep(0., 5., sd)) * vec2(sin(q.x * 1.9 + uTime * 1.3), cos(q.y * 2.3 - uTime)) * .04 * f2;
  vec3 N = normalize(vec3(rp.x, 1., rp.y));
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 sunH = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-5, 0., 0.));
  float e = clamp(R.y, 0., 1.);
  // WHAT THE RIVER MIRRORS IS THE SKY'S DEEP BLUE, never the pale rim of the sky: a river's small ripples turn every
  // facet upward, so that even far off and seen flat it gives back the blue well above the horizon. Toward the sun
  // the same: a darker warm tone, and on it the sun's road
  vec3 skyc = mix(uHor * .42, uZen * 1.1, pow(e, .45));
  float toSun = clamp(dot(normalize(R.xz + vec2(1e-5, 0.)), sunH.xz), 0., 1.);
  skyc = mix(skyc, uWarm * .36, pow(toSun, 4.) * pow(1. - e, 3.) * .75);
  // the banks and the houses that stand over the water lie mirrored in it: a dark band along every shore,
  // broken into upright streaks, deeper where the eye is low
  float band = 1. - smoothstep(2., 14. + 44. * (1. - e) * (1. - e), sd + (vn(vec2(p.x * 1.3, p.y * .05) + rp * 12.) - .5) * 5. * f1);
  skyc = mix(skyc, vec3(.06, .068, .1), band * .86);
  float fres = .04 + .96 * pow(clamp(1. - dot(N, V), 0., 1.), 5.);
  vec3 col = mix(uDeep * (.8 + .6 * uSkyCol), skyc, clamp(fres, 0., 1.));
  // BEFORE THE WATER STEPS THE COURT AND THE CHURCH'S SOUTH FRONT LIE MIRRORED: a column on the dark water under the
  // steps, BY PLACE. ACROSS THE WATER it is as broad as the front between its corner buttresses and the steps beside
  // them (x 62 to 94, soft at its sides). ALONG IT IT HAS ONE REACH, measured from z 97 (about where the ice at the
  // steps' foot ends: no piece of it reaches past z 97.9; the lowest step ends at z 90.4), its bounds the same from
  // every metre of the line and at every clock: coming on softly from z 90 to whole at z 97, whole to 8 m beyond z
  // 97, fading softly to nothing at 26 m beyond it (its end ragged by its own streaks, 4.5 m nearer or farther at
  // the most). It is BROKEN BY THE RIPPLES into upright streaks and into short bars that lie along the ripples and
  // run with them by the clock. ITS TONES ARE BY PLACE: at z 97 and nearer the court's snow and the steps' own pale
  // stone; from there outward (whole from 6 m beyond z 97) the front's stone in the blue-grey of its shade, and
  // UNDER THE DOOR (4.5 m to either side of its axis x 78, the ring's own half breadth, soft to nothing at 11 m) A
  // GOLD FOR THE RING THAT STANDS IN THE DOOR: streaks of a typed gold (.86, .63, .31), paler than the ring's colour
  // and not read from it, and no more. Nothing of what stands inside the ring is shown, no shape and no picture of
  // it. OF THE EYE IT HAS THE MIRROR'S OWN SHARE AND NO MORE: the fresnel term by which all this water mirrors, here
  // never under a fifth. (Where its streaks and bars would be finer than the grain it is drawn at their mean: f1,
  // named at the head.) (The world sets neither portal.drawWithin nor portal.drawIn: the ring is drawn at every
  // metre, and so is this gold; what stands inside the ring opens by revealDistance and is not shown here.) (The
  // sun's road lies on this arm toward the sun's own quarter, the east-south-east, up the stream of the steps: the
  // water's own law of the road draws it there, as everywhere.)
  float fx = 1. - smoothstep(12., 19., abs(p.x - 78.)), fz = p.y - 97.;
  if (fx > 0. && fz > -8.) {
    float streak = vn(vec2(p.x * 1.3, p.y * .05) + rp * 12.);
    float fm = (1. - smoothstep(8., 26., fz + (streak - .5) * 9. * f1)) * smoothstep(-7., 0., fz);
    // (a shimmer, never a field: upright streaks some 0.6 m broad and bars along the ripples, the clean dark water
    // between them; a third of the water under the image carries it, and the image is half as strong for it)
    float shim = smoothstep(.5, .6, vn(vec2(p.x * 1.9 + rp.x * 34., p.y * .09 + rp.y * 7.))) * (.4 + .6 * smoothstep(.4, .6, vn(vec2(q.x * .45 + rp.x * 20., q.y * 2.3 + rp.y * 20.))));
    fm *= mix(.3, shim, f1);
    vec3 fc = mix(vec3(.3, .35, .46), mix(vec3(.17, .185, .23), vec3(.86, .63, .31), 1. - smoothstep(4.5, 11., abs(p.x - 78.))), smoothstep(0., 6., fz));
    col = mix(col, fc, fm * fx * max(clamp(fres, 0., 1.), .2));
  }
  // small ripples that move: every one a little lighter on the slope that looks to the sky, darker on the other
  col *= 1. + (vn(q * vec2(1.4, 3.3) + vec2(uTime * .9, uTime * .45)) - .5) * .34 * f2 + (vn(q * vec2(.31, .9) - vec2(uTime * .25, 0.)) - .5) * .2 * f1;
  float lit = smoothstep(uEdge - 1.25, uEdge + 1.25, -5.);
  col += uSunCol * pow(clamp(dot(R, uSunDir), 0., 1.), 160.) * lit * .5;
  // THE SUN'S ROAD: a narrow way of light on the dark water under the sun, made of GLITTER: glints that flash and
  // go out by the clock as the ripples run down the stream
  float road = pow(toSun, 26.) * pow(1. - e, 2.) * (1. - band);
  // GLINTS OF FIVE SIZES OF WAVE LIE ON THE WATER AT ONCE, each of its own fixed size in metres: the facets of
  // ripples in cells of 0.43 by 0.21 m, each next size in cells twice the last, to the backs of swells in cells of
  // 7 by 3.4 m. A glint's breadth and its pace go by the ROOT of its wave's size (a facet's glint is 0.3 m across
  // at its soft rim, a swell's back's 1.3 m, and that flashes at a quarter of a facet's pace), so that a size's
  // share of the road's light halves with every doubling: a facet flashes often, a swell's back seldom and faintly.
  // NO LIGHT OF THE ROAD IS LEFT OUT BY THE PICTURE'S GRAIN AND NONE IS POURED INTO AN EVEN MEAN: a size whose
  // cells are finer than the grain (own) HANDS ITS LIGHT UP to the next greater size, whose glints carry it with
  // their own. A glint is as broad as the root of the light it carries (the rule of a wave's own glint) up to
  // two fifths of its cell at its soft rim (cap; the two smallest sizes' own glints are broader and keep their
  // breadth), and from there so much the brighter (at most 7.75 times a facet's flash). Beyond the swells' backs
  // the law goes on in STRETCHES OF THE WATER, each twice the last (cells of 14 by 7 m, 28 by 14 m and on to
  // 890 by 440 m): a stretch has no light of its own, it flashes at a swell's pace with what is handed
  // up to it, and the greatest shows all it is handed. So a stretch of water sends the same light of the road to
  // every eye and at every picture size (the flashes' mean is the five sizes' whole, 1.94 of the facets' share,
  // whatever the grain): near, many small glints; far, a few large sparkles on dark water and never an even
  // tone. The cells, the glints' places in them and their clocks are the world's; only which size carries the
  // light is read from the grain (named at the head)
  float glit = 0., carry = 0.;
  for (int k = 0; k < 12; k++) {
    float fk = float(k), gs = exp2(-fk), light = gs * step(fk, 4.5) + carry, cap = max(gs * step(fk, 4.5), .25), root = sqrt(clamp(light, 1e-4, cap));
    vec2 gq = (q * vec2(2.3, 4.7) + rp * 26.) * gs + fk * 7.3, gi = floor(gq), gf = fract(gq) - .5;
    float gh = h21(gi), gk = h21(gi + 41.), own = max(clamp(1.5 - max(fwidth(gq.x), fwidth(gq.y)) * 2., 0., 1.), step(10.5, fk));
    float flash = pow(max(sin(uTime * (2.2 + 3.4 * gh) * exp2(-.5 * min(fk, 4.)) + gh * 61.), 0.), 6.) * step(gk, .55) * (1. - smoothstep(.1 * root, (.34 + .1 * gk) * root, length(gf)));
    glit += flash * max(light / cap, 1.) * min(light * 1e4, 1.) * own;   // a size shows only the light it holds, down to none (the clamp at the root only guards the sqrt)
    carry = light * (1. - own);
  }
  col += vec3(1.5, 1.05, .6) * road * glit * 11. * (1. + lit);
  // the door's warm light lies on the southern arm before the court as one highlight broken by the ripples: a
  // mirror's highlight of the lamp at the door's seat, by the mirror's law of direction alone (nothing asks what
  // stands between the water and the lamp). It stands where the sight line, mirrored in the rippled water (R),
  // points at the lamp, so it travels with the eye as the sun's road does; in form it is one smooth lobe, as the
  // sun's glint is, with no glint cells of its own; it is fainter the farther the water lies from the lamp; its one
  // gate by place is a line across the river (nothing north of z 60, whole from z 90: so none on the northern arm);
  // the ripples that break it run by the clock
  vec3 pd = uPortalPos - vW; float pl = length(pd);
  col += uPortalCol * pow(clamp(dot(R, pd / max(pl, 1e-3)), 0., 1.), 90.) * .5 / (1. + pl * .004) * smoothstep(60., 90., p.y);
  // white water down the stream from every mill wheel
  float foam = 0.;
  for (int i = 0; i < 7; i++) { vec3 w = uWheel[i]; float dx = w.x - p.x, dz = abs(p.y - w.y);
    foam += (1. - smoothstep(w.z * .7, w.z * 1.25, dz)) * smoothstep(-2.6, -.5, dx) * (1. - smoothstep(3., 22., dx)); }
  foam *= .35 + .65 * vn(vec2(q.x * .9 + uTime * 1.6, q.y * 2.2));
  col = mix(col, vec3(.8, .84, .9) * (.6 + .5 * uSkyCol), clamp(foam, 0., 1.) * .9);
  // ice at the rims: pale plates, dark leads between them, thinner toward the stream
  float rim = uIce + 2.4 * vn(p * .13);
  float ice = 1. - smoothstep(rim - 1.2, rim + .6, ss);
  vec2 c = p / 1.9 + vec2(vn(p * .3), vn(p * .37 + 5.)) * 1.1; c.x += .5 * floor(c.y); vec2 cf = abs(fract(c) - .5);
  float plate = 1. - smoothstep(.36, .47, max(cf.x, cf.y)) * smoothstep(rim * .35, rim, ss) * f2;
  vec3 icec = uIceCol * (.56 + .2 * h21(floor(c)) * f2) * (.25 + .8 * uSkyCol + vec3(.3, .2, .1) * lit);
  // broad ice is no floor: long cracks run through it and pools of open water stand in it
  float crack = (1. - smoothstep(.006, .03, abs(vn(p * .085 + 11.) - .5))) * f1, pool = smoothstep(.6, .68, vn(p * .045 + 7.));
  icec *= .86 + .28 * vn(p * .21 + 2.);
  col = mix(col, mix(icec, skyc, fres * .3), ice * plate * (1. - .85 * max(crack, pool)));
  // FLOES IN RAFTS: loose plates of broken ice, about 1.5 to 8 m across, with snow on them go down the stream with
  // the water on the whole river, none where the rim's ice lies, each plate turning slowly as it goes: in rafts
  // (raftAt: 18 to 61 m long as their plates lie, about one field in three without one, fewer on a hoar-frost
  // morning) with open dark water between, and between the rafts single plates (one in forty) and STRINGS of three
  // to eight plates in a line along the stream (one stretch of sixteen plates in twenty has one). Plates lie in
  // lanes along the stream, each lane shifted by its own draw and each plate thrown in its own cell, so that they
  // stand in no ranks across it. A plate is of its raft or not as a whole (by the raft's ground at its cell's own
  // middle: close in the raft's middle, loose at its rim). TWO SIZES OF CELL: the great plates (2.5 to 8 m, in cells
  // of 9 m) are few, the small (1.4 to 3.4 m, in cells of 3.8 m) many: six to one (see plateAt for a plate's form).
  // A PLATE HAS THICKNESS: its snow top stands over the water by FLOE_RISE of its kind's middle breadth (ht: its
  // cell times its least and its greatest radius's shares together; 0.77 m a great plate, 0.35 m a small one), and
  // under the snow an upright broken rim of dark blue-green ice goes down to the water, darkest where it meets it,
  // with a thin dark wet line round its foot, a skirt of grey ice under the water and the rim's dark image on it. No mesh carries it: the top and the rim are drawn where the sight line
  // from the eye meets them over the water's own sheet (lift: the line's way over the water for a metre of
  // height), a law of drawing named at the head. BRASH ICE, bits of 0.3 to 1 m, lies between the plates of a
  // raft. Each plate is drawn by how much of the picture's grain it fills, along the stream and across it apart: a
  // plate too far to fill a grain is so much the fainter, and where plates cannot be told at all the water shows
  // their share of white (0.54 of a raft's ground, 0.02 of open water: the same ice at every distance)
  // THE HELD ICE lies in its rafts (see heldRafts and heldAt): what drifts down the stream melts away as it comes
  // to a raft (plateAt; go: the same measure for the drifting brash and for the white that plates show where
  // they cannot be told), but for a mill's race, through which it drifts on (see HELD_RACE_IN); and in a raft the
  // held floes lie, drawn by the drifting plates' own law (top, rim, wet line, skirt, image; brash in and about a
  // raft; the white they show where they cannot be told: HELD_COVER of a raft's ground), each size by its own
  // height (HELD_RISE; at the arrival all by the broken sheet's one thickness at the place)
  vec2 fp = p + uShift + vec2(uTime * .6, 0.), pg = vec2(fwidth(p.x), fwidth(p.y)), lift = V.xz / max(V.y, .06);
  float slow = sh.a, race = slow > .2 ? 1. - smoothstep(${(-HELD_RACE_IN[1]).toFixed(1)}, ${(-HELD_RACE_IN[0]).toFixed(1)}, raceAt(p)) : 0.;
  // (pack: how much of a raft the place is, 0 outside its ragged bound; about: 1 in a raft and to 1.5 m outside it;
  // both 0 in a mill's race and at the water steps' own ice)
  float inR = slow > 0. ? (slow + heldRag(p) - .5) * ${(2 * HELD_SOFT).toFixed(1)} : -99., free = slow > 0. ? heldFree(p) : 0.;
  float pack = clamp(inR / ${HELD_RIM.toFixed(1)}, 0., 1.) * free, about = clamp(.5 + inR / 3., 0., 1.), go = 1. - smoothstep(${(-HELD_MELT[0]).toFixed(1)}, ${(-HELD_MELT[1]).toFixed(1)}, inR) * (1. - race);
  float keep = smoothstep(rim, rim + 4., ss), raft = min(raftAt(fp, uFloe) * 2.4, 1.) * go, told = clamp(2. - max(pg.x, pg.y) / 5., 0., 1.);
  float floe = 0., fsh = 0., fin = 1., foot = 0., wall = 0., wallH = 0., wet = 0., skirt = 0., image = 0., great = 0., wide = 1., heldTop = 0., heldRim = 0.;
  float above = 0., skirtHeld = 0.;
  // (apart: 1 on the arrival's water, where the held floes are the pieces of one broken sheet, see below; sheet:
  // that sheet's thickness at the place; taken: the greater floes' ground at the top's, the foot's and the image's
  // place, metres inside their outlines)
  float apart = slow > 0. ? step(${HELD_APART[0].toFixed(1)}, p.x) * step(p.x, ${HELD_APART[1].toFixed(1)}) * step(p.y, 0.) : 0., sheet = ${HELD_SHEET[0].toFixed(2)} + ${(HELD_SHEET[1] - HELD_SHEET[0]).toFixed(2)} * vn(p * .045 + 23.);
  vec3 taken = vec3(-1e3), lead = vec3(0.);
  if (apart > .5) lead = ${HELD_LEAD[0].toFixed(2)} + ${(HELD_LEAD[1] - HELD_LEAD[0]).toFixed(2)} * vec3(vn((p + lift * sheet) * .27 + 61.), vn(p * .27 + 61.), vn((p - lift * sheet) * .27 + 61.));
  vec4 lc = vec4(0., 0., 1., 0.), l1, l2;
  // (the great drifting plates, the small ones, then the held floes' four sizes, greatest first, where the rafts'
  // number is over 0; the smallest held size is drawn without its image on the water)
  for (int k = 0; k < 6; k++) {
    if (k == 2 && slow <= 0.) break;
    float cell = k == 0 ? 9. : k == 1 ? 3.8 : k == 2 ? ${HELD_SIZES[0][0].toFixed(1)} : k == 3 ? ${HELD_SIZES[1][0].toFixed(1)} : k == 4 ? ${HELD_SIZES[2][0].toFixed(1)} : ${HELD_SIZES[3][0].toFixed(1)}, off = float(k) * 13.7;
    float r0 = k == 0 ? .2 : k == 1 ? .25 : apart > .5 ? ${HELD_FULL.toFixed(2)} : k == 2 ? ${HELD_SIZES[0][1].toFixed(2)} : k == 3 ? ${HELD_SIZES[1][1].toFixed(2)} : k == 4 ? ${HELD_SIZES[2][1].toFixed(2)} : ${HELD_SIZES[3][1].toFixed(2)};
    float ht = k < 2 ? ${FLOE_RISE.toFixed(2)} * cell * (r0 + .37) : apart > .5 ? sheet : k == 2 ? ${HELD_RISE[0].toFixed(2)} : k == 3 ? ${HELD_RISE[1].toFixed(2)} : k == 4 ? ${HELD_RISE[2].toFixed(2)} : ${HELD_RISE[3].toFixed(2)};
    // (thin: the height in a great drifting plate's, by which the rim's wet line, its skirt and the top's bare margin
    // go; hs, tu, am: a held size's share, its ground's turn and its ground's bend)
    float thin = k < 2 ? 1. : ht / ${(FLOE_RISE * 9 * 0.57).toFixed(4)}, hs = k == 2 ? ${HELD_SHARE[0].toFixed(2)} : k == 3 ? ${HELD_SHARE[1].toFixed(2)} : k == 4 ? ${HELD_SHARE[2].toFixed(2)} : ${HELD_SHARE[3].toFixed(2)};
    float tu = k == 2 ? ${HELD_SIZES[0][2].toFixed(2)} : k == 3 ? ${HELD_SIZES[1][2].toFixed(2)} : k == 4 ? ${HELD_SIZES[2][2].toFixed(2)} : ${HELD_SIZES[3][2].toFixed(2)}, am = k == 2 ? ${HELD_SIZES[0][3].toFixed(1)} : k == 3 ? ${HELD_SIZES[1][3].toFixed(1)} : k == 4 ? ${HELD_SIZES[2][3].toFixed(1)} : ${HELD_SIZES[3][3].toFixed(1)};
    // the plate's top where the sight line meets it, its foot on the water, and its foot where the water mirrors
    // the sight line up to the top's height (the rim's image lies on the water before the plate)
    vec4 t, f, m;
    if (k >= 2) { t = heldAt(p + lift * ht, pg, cell, off, r0, hs, tu, am, l1); f = heldAt(p, pg, cell, off, r0, hs, tu, am, l2); m = k == 5 ? vec4(-1e3, 0., 1., 0.) : heldAt(p - lift * ht, pg, cell, off, r0, hs, tu, am, l2); }
    else { t = plateAt(fp + lift * ht, pg, cell, off, r0, slow, l1); f = plateAt(fp, pg, cell, off, r0, slow, l2); m = plateAt(fp - lift * ht, pg, cell, off, r0, slow, l2); }
    // THE ARRIVAL'S ICE IS ONE SHEET BROKEN INTO SEPARATE FLOES (apart): there every held floe is of the sheet's
    // one thickness at the place (HELD_SHEET), none lies on another, and A LEAD OF DARK WATER (HELD_LEAD metres
    // broad, by the place) parts every floe from every greater one beside it: a smaller floe ends a lead's breadth
    // short of a greater one's outline, its edge there broken along the greater one's. No sheet of it is broader
    // than its greatest floe (13.5 m)
    if (k >= 2 && apart > .5) { vec3 own = vec3(t.x, f.x, m.x); t.x = min(t.x, -(taken.x + lead.x)); f.x = min(f.x, -(taken.y + lead.y)); m.x = min(m.x, -(taken.z + lead.z)); taken = max(taken, own); }
    float one = clamp(.5 + t.x / t.z, 0., 1.) * min(1., t.w / t.z), low = clamp(.5 + f.x / f.z, 0., 1.) * min(1., f.w / f.z);
    // (where the floes lie heaped a greater held floe lies ON the smaller ones about it: where its top or its rim
    // stands, a smaller floe is hidden, so that the greater one's dark rim shows against the smaller one's snow)
    if (k >= 2 && apart < .5) { float mine = max(one, low); one *= 1. - above; low *= 1. - above; above = max(above, mine); }
    if (one > floe) { floe = one; fsh = t.y; fin = clamp(t.x / (k >= 2 ? .12 + .015 * t.w : (.25 + .08 * t.w) * min(thin, 1.)), 0., 1.); lc = l1; great = k == 1 ? 0. : 1.; wide = t.w; heldTop = k >= 2 ? 1. : 0.; }
    // the rim: the foot's ground that the top does not cover, and how high on the rim the sight line meets it
    if (low - one > wall) { wall = low - one; wallH = clamp(f.x / max(f.x - t.x, 1e-3), 0., 1.); heldRim = k >= 2 ? 1. : 0.; }
    wet = max(wet, clamp(.5 + (f.x + .14 * thin) / f.z, 0., 1.) * min(1., f.w / f.z) - low);
    // the skirt of ice under the water round the foot (a fifth of a metre and six hundredths of the plate's
    // breadth, fading outward; fainter where it is finer than the grain), and the rim's image
    float sk = (.2 + .06 * f.w) * thin, skv = clamp(1. + f.x / sk, 0., 1.) * min(1., f.w / f.z) * min(1., 2. * sk / f.z) * (1. - low);
    if (skv > skirt) { skirt = skv; skirtHeld = k >= 2 ? 1. : 0.; }
    image = max(image, clamp(.5 + m.x / m.z, 0., 1.) * min(1., m.w / m.z) * (1. - low));
    foot = max(foot, low);
  }
  // brash between the plates of a drifting raft: broken bits in squares of 1.4 m, four squares in five of a raft's
  // middle (see brashAt: most of them small, 0.3 to 1 m across). ABOUT A HELD RAFT, and only there, brash lies in
  // three sizes: within the raft's ground SLABS (0.8 to 1.8 m, in squares of 2.5 m, paler than the rest); there
  // and to 1.5 m outside its ragged bound cakes (0.3 to 1 m, in squares of 1.4 m) and crumbs (0.12 to 0.45 m, in
  // squares of 0.62 m); all CHOKED HERE AND OPEN THERE by the place (patches some 8 m across: nearly nine squares
  // in ten have their bit where the brash is thick, one cake's square in two and one in three of the others' where
  // the water lies open and dark); each bit sways a little by the clock, on two slow periods of its own. TOWARD A
  // MILL'S RACE THE HELD BRASH THINS OUT, square by square, from all of it 8 m outside the race's bound to none at
  // the bound (thinR: no line where it ends), and likewise toward the water steps' own ice
  float bw = max(max(pg.x, pg.y), 1e-3), brash = 0., btone = 0.;
  { vec3 bb = brashAt(fp / 1.4 + 7.3, bw / 1.4, 0., 0.); brash = step(bb.y, .8 * raft) * bb.x; btone = bb.z; }
  if (about > 0.) {
    float choke = smoothstep(.3, .7, vn(p * .13 + 41.)), thinR = about * .92 * smoothstep(0., 8., raceAt(p)) * free;
    vec3 ck = brashAt(p / 1.4 + 7.3, bw / 1.4, .07, 0.), cr = brashAt(p / .62 + 3.1, bw / .62, .1, 0.), cs = brashAt(p / 2.5 + 11.7, bw / 2.5, .04, 1.);
    // (in the arrival's broken sheet the leads lie dark: no slab of brash there)
    ck.x *= step(ck.y, thinR * (.5 + .45 * choke)); cr.x *= step(cr.y, thinR * (.3 + .65 * choke)); cs.x *= step(cs.y, pack * (.3 + .65 * choke) * smoothstep(0., 8., raceAt(p))) * (1. - apart);
    float hb = max(max(ck.x, cr.x), cs.x); if (hb > brash) { brash = hb; btone = cs.x >= hb ? .6 + .4 * cs.z : ck.x > cr.x ? ck.z : cr.z; }
  }
  vec3 day = .25 + .8 * uSkyCol + vec3(.3, .2, .1) * lit;
  // A PLATE MEETS THE WATER: its rim's dark image lies on the water before it, broken by the ripples; a narrow
  // skirt of grey ice shows through the water round its foot; a thin dark wet line runs round the foot itself
  col *= 1. - .62 * image * (1. - foot) * (.72 + .28 * vn(fp * 2.3 + rp * 40.)) * told * keep;
  col = mix(col, mix(vec3(.2, .29, .31), vec3(.13, .18, .2), skirtHeld) * day, mix(.5, .32, skirtHeld) * skirt * told * keep);
  col *= 1. - .6 * wet * (1. - foot) * told * keep;
  col = mix(col, uIceCol * .62 * (.8 + .4 * btone) * day, brash * (1. - foot) * told * keep);
  // the rim: dark blue-green ice, darkest where it meets the water (a held floe's the same ice, its grain the place's)
  vec3 rimc = mix(vec3(.03, .07, .085), mix(vec3(.12, .225, .25), vec3(.07, .12, .14), heldRim), wallH * wallH);
  col = mix(col, rimc * (.75 + .5 * vn(mix(fp, p, heldRim) * 1.7)) * day, wall * told * keep);
  floe = mix(.54 * raft + .02 * go + mix(${HELD_COVER.toFixed(2)}, ${HELD_COVER_SHEET.toFixed(2)}, apart) * pack, floe, told) * keep;
  // THE TOP IS SNOW ON ICE, in the plate's own frame (it turns with the plate): soft drifts in two tones (pale
  // crests, blue hollows; their mean where they are finer than the grain), a greyer wet margin of bare ice round the
  // rim (a quarter of a metre and eight hundredths of the plate's breadth), and on a great plate one ridge of
  // pushed-up ice or two (one great plate in two has the second): a pale crest with its shade on the side away
  // from the sun
  vec2 lp = lc.xy; float fineD = clamp(1.6 - max(pg.x, pg.y) * 1.2, 0., 1.), fineR = clamp(1.5 - max(pg.x, pg.y) * 4., 0., 1.) * great;
  float drift = mix(.6, smoothstep(.36, .64, vn(lp * vec2(.55, 1.2) + fsh * 37.)), fineD);
  vec3 snow = mix(vec3(.64, .71, .85), vec3(.86, .88, .92), drift) * (.9 + .1 * fsh) * (.94 + .12 * vn(lp * 2.1 + fsh * 11.));
  vec2 sl = vec2(lc.z * sunH.x - lc.w * sunH.z, lc.w * sunH.x + lc.z * sunH.z);
  float crest = 0.;
  if (heldTop < .5) {
    float ridge = 0., shade = 0.;
    for (int j = 0; j < 2; j++) {
      float hj = fract(fsh * (7.3 + 5.1 * float(j)) + .37 * float(j)), ra = hj * 3.1416, on = j == 0 ? 1. : step(.5, fract(fsh * 13.7));
      vec2 rn = vec2(cos(ra), sin(ra));
      float rd = dot(lp, rn) - (fract(hj * 9.7) - .5) * .5 * wide + .3 * (vn(lp * .8 + hj * 9.) - .5);
      ridge = max(ridge, on * (1. - smoothstep(.05, .2, abs(rd))));
      shade = max(shade, on * (1. - smoothstep(0., .35, abs(rd + .3 * sign(dot(rn, sl))))));
    }
    snow = mix(snow, snow * vec3(.7, .77, .9), shade * fineR * (1. - ridge));
    snow = mix(snow, vec3(.9, .93, .97), ridge * fineR);
  } else {
    // A HELD FLOE'S TOP IS A SLAB'S (heldRelief: flat to its broken edge, a sharp pressure ridge or two, a rafted
    // piece, a gentle tilt), its snow lying even on it (the drifts' two tones a third as deep as on a drifting
    // plate). The low sun stands in the east-south-east (5 degrees up), and under the cloud bars the bright east
    // is the sky's light: a face that looks toward it is the paler and warmer, one that looks away the bluer and
    // darker (asked 0.15 m to either side: a ridge's two faces and a rafted piece's broken edge are narrow and
    // sharp; a tilted floe is the lighter or the darker as a whole), and WHAT STANDS HIGHER TOWARD THE SUN THROWS
    // ITS SHADE over the top behind it (asked half a metre and 1.6 m toward the sun: 0.09 m of height shades a
    // metre), deeper where the sun itself is on the water. THE SNOW IS UNEVEN: each floe has its own tone, the
    // wind has swept the low places bare to grey ice by the floe's own draw (hardly any on most, the most of the
    // top on one floe in seven), the crests of the ridges are pale
    float h0 = heldRelief(lp, fsh, wide), h1 = heldRelief(lp + sl * .5, fsh, wide), h2 = heldRelief(lp + sl * 1.6, fsh, wide);
    float thrown = clamp(max((h1 - h0 - .044) / .1, (h2 - h0 - .14) / .16), 0., 1.) * fineD, face = clamp((heldRelief(lp - sl * .15, fsh, wide) - heldRelief(lp + sl * .15, fsh, wide)) * 6., -1., 1.) * fineD;
    float sweep = fract(fsh * 7.7), bare = smoothstep(.62, .78, vn(lp * vec2(.45, .9) + fsh * 51.) + (sweep > .86 ? .26 : .3 * sweep - .26) - 1.2 * h0) * fineD;
    snow = mix(vec3(.64, .71, .85), vec3(.86, .88, .92), mix(.72, drift, .33)) * (.9 + .1 * fsh) * (.95 + .1 * vn(lp * 2.1 + fsh * 11.));
    snow *= .95 + .12 * fract(fsh * 5.1);
    snow = mix(snow, vec3(.27, .31, .37) * (.8 + .4 * vn(lp * 1.1 + fsh * 19.)), bare);
    snow *= mix(vec3(1.), face > 0. ? vec3(1.24, 1.16, 1.04) : vec3(.72, .79, .93), abs(face));
    snow = mix(snow, snow * vec3(.44, .54, .8), thrown * (.75 + .25 * lit));
    crest = smoothstep(.2, .4, h0) * (1. - thrown) * fineD;
    snow = mix(snow, vec3(.93, .95, .98) * (face > 0. ? 1. : .88), crest * .7);
  }
  vec3 plc = mix(uIceCol * .5, snow, max(smoothstep(0., 1., fin), crest));
  col = mix(col, plc * day, floe);
  float fog = 1. - exp(-uFogDen * uFogDen * dist * dist);
  float fs = pow(clamp(dot(-V, sunH), 0., 1.), 4.);
  // the low haze over the water: cold blue away from the sun, warm and brighter toward it
  col = mix(col, mix(vec3(.3, .4, .66), vec3(1.05, .74, .46), pow(clamp(dot(-V, sunH), 0., 1.), 1.5) * .8), (1. - exp(-dist * .003)) * .22);
  gl_FragColor = vec4(mix(col, mix(uFogCol, uFogWarm, fs), fog), 1.);
}`,
  });
  const geo = new THREE.PlaneGeometry(6400, 520, 1, 1); geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat); mesh.position.set(0, WATER_Y, 12); mesh.frustumCulled = false; W.scene.add(mesh);
}

// ---------------------------------------------------------------- the town's houses
// One house in its own frame: the ground at y 0, the front toward +z, the breadth along x. o: { w, d, st (storeys), sh (storey
// height), jet (each storey's jut over the street), rise, along ('z' gable to the street, 'x' eaves to the street, 'hip'),
// dormers, plain (plaster or stone without framing), piles, chim: [x, z], out (a lean-to behind) }. simple: the same
// house in few triangles for the middle distance. Returns the geometry and its measures.
const TIMBER = [0.13, 0.11, 0.095], CHIMNEY = [0.21, 0.15, 0.125];
function houseGeometry(o, simple) {
  const g = makeGB(), hw = o.w / 2, hd = o.d / 2, H = o.st * o.sh, tf = o.plain ? 0 : 1, jet = simple ? 0 : (o.jet || 0);
  const zTop = hd + (o.jet || 0) * (o.st - 1), zf = (i) => (simple ? zTop : hd + jet * i);
  // walls: storey by storey where each juts over the one below (an oak beam under every jut), else one face of st storeys
  const wall = (y0, y1, z, n) => {
    g.col([1, 1, 1]).mat(3, tf);
    g.quad([-hw, y0, z], [hw, y0, z], [hw, y1, z], [-hw, y1, z], n);
    g.quad([hw, y0, -hd], [-hw, y0, -hd], [-hw, y1, -hd], [hw, y1, -hd], n);
    g.quad([-hw, y0, -hd], [-hw, y0, z], [-hw, y1, z], [-hw, y1, -hd], n);
    g.quad([hw, y0, z], [hw, y0, -hd], [hw, y1, -hd], [hw, y1, z], n);
  };
  if (simple || !jet) wall(0, H, zTop, o.st);
  else for (let i = 0; i < o.st; i++) {
    const y0 = i * o.sh; wall(y0, y0 + o.sh, zf(i), 1);
    if (i > 0) {
      g.col(TIMBER).mat(5, 0.4).quad([-hw, y0, zf(i - 1)], [hw, y0, zf(i - 1)], [hw, y0, zf(i)], [-hw, y0, zf(i)]);
      g.col(TIMBER, 1.3).mat(5, 0).box(-hw - 0.05, y0 - 0.14, zf(i) - 0.1, hw + 0.05, y0 + 0.14, zf(i) + 0.06, 12, 4 | 8 | 32);
    }
  }
  const ov = simple ? 0.2 : 0.38, top = H + o.rise, zr = o.along === 'hip' ? 0 : (zTop - hd) / 2, hs = (zTop + hd) / 2;
  // the roof's height over a place of the plan (used for the chimney's foot and the bare patch beside it)
  const roofY = o.along === 'z' ? (x) => top - Math.abs(x) / hw * o.rise : (x, z) => top - Math.abs(z - zr) / hs * o.rise;
  g.col([1, 1, 1]).mat(2, 0);
  if (o.along === 'z') {
    // gable to the street: two slopes, the ridge running back from the street
    const z0 = -hd - ov, z1 = zTop + ov, ye = roofY(hw + ov);
    g.quad([-hw - ov, ye, z0], [-hw - ov, ye, z1], [0, top, z1], [0, top, z0], 8);
    g.quad([hw + ov, ye, z1], [hw + ov, ye, z0], [0, top, z0], [0, top, z1], 8);
    g.col([1, 1, 1]).mat(3, tf);
    g.tri([-hw, H, zTop], [hw, H, zTop], [0, top, zTop]); g.tri([hw, H, -hd], [-hw, H, -hd], [0, top, -hd]);
    if (!simple) {
      g.col(TIMBER, 1.2).mat(5, 0);
      g.beam([-hw - ov, ye - 0.05, zTop + 0.14], [0, top - 0.05, zTop + 0.14], 0.3, 0.12, 3); g.beam([0, top - 0.05, zTop + 0.14], [hw + ov, ye - 0.05, zTop + 0.14], 0.3, 0.12, 3);
    }
  } else if (o.along === 'x') {
    // eaves to the street: the ridge along the street, gables at the two ends
    const x0 = -hw - ov, x1 = hw + ov, ye = roofY(0, zTop + ov);
    g.quad([x0, ye, zTop + ov], [x1, ye, zTop + ov], [x1, top, zr], [x0, top, zr], 8);
    g.quad([x1, ye, -hd - ov], [x0, ye, -hd - ov], [x0, top, zr], [x1, top, zr], 8);
    g.col([1, 1, 1]).mat(3, tf);
    g.tri([-hw, H, -hd], [-hw, H, zTop], [-hw, top, zr]); g.tri([hw, H, zTop], [hw, H, -hd], [hw, top, zr]);
  } else {
    // a hipped roof to a short ridge
    const r = Math.min(hw, hd) * 0.3, ye = roofY(0, zTop + ov);
    g.quad([-hw - ov, ye, zTop + ov], [hw + ov, ye, zTop + ov], [r, top, 0], [-r, top, 0], 8);
    g.quad([hw + ov, ye, -hd - ov], [-hw - ov, ye, -hd - ov], [-r, top, 0], [r, top, 0], 8);
    g.tri([-hw - ov, ye, -hd - ov], [-hw - ov, ye, zTop + ov], [-r, top, 0]); g.tri([hw + ov, ye, zTop + ov], [hw + ov, ye, -hd - ov], [r, top, 0]);
  }
  // dormers on the street slope
  for (let i = 0; i < (simple ? 0 : o.dormers || 0); i++) {
    const x = (i - (o.dormers - 1) / 2) * (o.w / (o.dormers + 0.4)), zc = zTop - 0.4, y0 = H + 0.4, dw = 0.75, dh = 1.5, zb = zc - (dh + 0.9) * hs / o.rise;
    g.col([1, 1, 1]).mat(3, tf).quad([x - dw, y0, zc], [x + dw, y0, zc], [x + dw, y0 + dh, zc], [x - dw, y0 + dh, zc], 1);
    g.tri([x - dw, y0 + dh, zc], [x + dw, y0 + dh, zc], [x, y0 + dh + 0.9, zc]);
    g.tri([x - dw, y0, zc], [x - dw, y0 + dh, zc], [x - dw, y0 + dh, zc - dh * hs / o.rise]); g.tri([x + dw, y0 + dh, zc], [x + dw, y0, zc], [x + dw, y0 + dh, zc - dh * hs / o.rise]);
    g.col([1, 1, 1]).mat(2, 0);
    g.quad([x - dw - 0.15, y0 + dh - 0.1, zc + 0.2], [x, y0 + dh + 0.95, zc + 0.2], [x, y0 + dh + 0.95, zb], [x - dw - 0.15, y0 + dh - 0.1, zb + 0.9 * hs / o.rise], 2);
    g.quad([x, y0 + dh + 0.95, zc + 0.2], [x + dw + 0.15, y0 + dh - 0.1, zc + 0.2], [x + dw + 0.15, y0 + dh - 0.1, zb + 0.9 * hs / o.rise], [x, y0 + dh + 0.95, zb], 1);
  }
  // the chimney through one slope with its pot, and a bare patch of roof where its warmth has cleared the snow
  const [cx, cz] = o.chim, cTop = top + 0.75, ry = roofY(cx, cz), cw = simple ? 0.42 : 0.36;
  g.col(CHIMNEY).mat(0, 0).box(cx - cw, ry - 0.5, cz - cw, cx + cw, cTop, cz + cw, 3, simple ? 1 | 2 | 8 | 16 | 32 : 1 | 2 | 16 | 32);
  if (!simple) {
    g.col(CHIMNEY, 1.25).box(cx - 0.46, cTop, cz - 0.46, cx + 0.46, cTop + 0.18, cz + 0.46, 15, 63);
    g.col([1, 1, 1]).mat(2, 1);
    const e = 0.07;
    if (o.along === 'z') {
      const s = cx < 0 ? -1 : 1, xl = cx + s * 1.1, xh = s * Math.max(Math.abs(cx) - 1.1, 0.12), za = cz - 1.2, zb = cz + 1.2, yl = roofY(xl) + e, yh = roofY(xh) + e;
      if (s < 0) g.quad([xl, yl, za], [xl, yl, zb], [xh, yh, zb], [xh, yh, za]); else g.quad([xl, yl, zb], [xl, yl, za], [xh, yh, za], [xh, yh, zb]);
    } else {
      const s = cz < zr ? -1 : 1, zl = cz + s * 1.1, zh = zr + s * Math.max(Math.abs(cz - zr) - 1.1, 0.12), xa = cx - 1.2, xb = cx + 1.2, yl = roofY(0, zl) + e, yh = roofY(0, zh) + e;
      if (s > 0) g.quad([xa, yl, zl], [xb, yl, zl], [xb, yh, zh], [xa, yh, zh]); else g.quad([xb, yl, zl], [xa, yl, zl], [xa, yh, zh], [xb, yh, zh]);
    }
  }
  // a lean-to behind, under its own low roof
  if (o.out && !simple) {
    const [ow, od, oh] = o.out, x0 = -hw + 0.3, x1 = x0 + ow, z1 = -hd, z0 = z1 - od;
    g.col([1, 1, 1]).mat(3, tf);
    g.quad([x1, 0, z0], [x0, 0, z0], [x0, oh, z0], [x1, oh, z0], 1); g.quad([x0, 0, z0], [x0, 0, z1], [x0, oh + 1.4, z1], [x0, oh, z0], 1); g.quad([x1, 0, z1], [x1, 0, z0], [x1, oh, z0], [x1, oh + 1.4, z1], 1);
    g.col([1, 1, 1]).mat(2, 0).quad([x1 + 0.2, oh - 0.1, z0 - 0.3], [x0 - 0.2, oh - 0.1, z0 - 0.3], [x0 - 0.2, oh + 1.5, z1], [x1 + 0.2, oh + 1.5, z1], 0);
  }
  // a house that stands in the water: oak piles and a brace under its back
  if (o.piles) {
    g.col(TIMBER, 1.1).mat(5, 0.3);
    for (const x of simple ? [-hw + 0.3, hw - 0.3] : [-hw + 0.3, 0, hw - 0.3]) g.taper(x, -hd + 0.3, -7.5, 0, 0.2, 0.2, 0.2, 0.2, 0, false);
    if (!simple) g.beam([-hw, -1.2, -hd + 0.3], [hw, -1.2, -hd + 0.3], 0.22, 0.22, 3);
    g.col([1, 1, 1]).mat(3, tf).quad([hw, -1.6, -hd], [-hw, -1.6, -hd], [-hw, 0, -hd], [hw, 0, -hd], 1);
  }
  return { geo: g.build(), w: o.w, d: hd + zTop, zc: (zTop - hd) / 2, eave: H, ridge: top, top: cTop + 0.2, chim: [cx, cTop + 0.2, cz], piles: !!o.piles, tris: g.tris };
}
// the kinds: eight for the streets, two low ones on piles for the island's waterside row
const HOUSE_KINDS = [
  { w: 5.6, d: 10.5, st: 3, sh: 3.45, jet: 0.4, rise: 4.5, along: 'z', chim: [0.9, -2.8], out: [3, 2.6, 2.6] },
  { w: 6.4, d: 11.5, st: 4, sh: 3.3, jet: 0.38, rise: 5.0, along: 'z', chim: [-0.95, -3.4] },
  { w: 5.0, d: 9.5, st: 4, sh: 3.25, jet: 0.3, rise: 4.1, along: 'z', chim: [0.85, 1.2], out: [2.6, 3, 2.4] },
  { w: 9.2, d: 8.4, st: 3, sh: 3.4, jet: 0.35, rise: 5.6, along: 'x', dormers: 2, chim: [3.2, -1.3] },
  { w: 7.2, d: 12, st: 3, sh: 3.7, jet: 0, rise: 5.3, along: 'z', plain: true, chim: [-1.0, -4.2] },
  { w: 4.5, d: 9, st: 4, sh: 3.35, jet: 0.42, rise: 3.8, along: 'z', chim: [0.8, -2.2] },
  { w: 7.6, d: 7.6, st: 3, sh: 3.5, jet: 0.3, rise: 5.0, along: 'hip', dormers: 1, chim: [1.2, -1.1] },
  { w: 10.5, d: 7.8, st: 2, sh: 3.5, jet: 0.3, rise: 5.2, along: 'x', dormers: 3, chim: [-3.8, -1.2], out: [4, 2.4, 2.4] },
  { w: 6.0, d: 9, st: 2, sh: 3.3, jet: 0.3, rise: 4.3, along: 'z', piles: true, chim: [0.85, 1.5] },
  { w: 7.4, d: 8.2, st: 2, sh: 3.2, jet: 0, rise: 4.6, along: 'x', piles: true, dormers: 1, chim: [2.4, -1.2] },
];
// The houses' heights as layHouses deals them, in TWO draws: a house stands 0.9 to 1.1 of its kind (on a bridge's
// deck nine tenths of that), and then, off the decks and the piles, HOUSE_LOW to HOUSE_HIGH of that. And the tallest
// ridge in the kinds' table (the second kind's: 18.2 m).
const HOUSE_LOW = 0.72, HOUSE_HIGH = 1.08, TALLEST_RIDGE = Math.max(...HOUSE_KINDS.map((o) => o.st * o.sh + o.rise));

// ---------------------------------------------------------------- the town's plan: where no house stands, and the lanes
// The church's close (front, square, flanks), the walled court and the garden: typed places with no house.
// THE COURT'S TWO RANGES stand on its two sides (RANGES): the court's keep-out reaches from the one's back wall to
// the other's, widened by a range's own back eave (RANGE_EAVE) and an ALLEY, as round every typed thing among the
// houses but the great house by the entry, whose plot is typed (see layChurches): a house's eave stands 0.48 m
// beyond its plot's rectangle, and the deepest lean-to's roof 3.35 m behind it (out[1] + 0.3 + 0.05).
const RANGE_EAVE = 0.45;
const inClose = (x, z) => (x > -41 && x < 133 && z > -33 && z < 35) || (x > RANGES[0].xb - RANGE_EAVE - ALLEY && x < RANGES[1].xb + RANGE_EAVE + ALLEY && z > 30 && z < 87) || x > 128;
// Where a house may stand: on the island up to its shore (the waterside row a little over it), on the banks behind
// a strand, and only inside the part of the town that is laid out lane by lane (470 m round the square).
const TOWN_R = 470;
const houseLand = (x, z, over = 0) => {
  if (Math.hypot(x + 20, z) > TOWN_R) return false;
  if (x > ISLE_X0 - 6 && x < ISLE_X1 && z > islandN(x) - over && z < islandS(x) - 1.5 + over * 0.2) return !inClose(x, z);
  return z < 0 ? z < bankN(x) - 12 : z > bankS(x) + 10;
};
// rectangles on the plan (houses, lanes, churches, halls) in a hash of 16 m cells, and the test of two of them
function makePlan() {
  const CELL = 16, cells = new Map(), key = (ix, iz) => (ix + 2048) * 4096 + iz + 2048;
  const span = (r, f) => {
    const x0 = Math.floor((r.x - r.rad) / CELL), x1 = Math.floor((r.x + r.rad) / CELL), z0 = Math.floor((r.z - r.rad) / CELL), z1 = Math.floor((r.z + r.rad) / CELL);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) if (f(key(ix, iz))) return true;
    return false;
  };
  const hit = (p, q) => {
    const dx = q.x - p.x, dz = q.z - p.z, rr = p.rad + q.rad;
    if (dx * dx + dz * dz > rr * rr) return false;
    const c = Math.abs(p.ux * q.ux + p.uz * q.uz), s = Math.abs(p.ux * q.uz - p.uz * q.ux);
    if (Math.abs(dx * p.ux + dz * p.uz) > p.a + q.a * c + q.b * s) return false;
    if (Math.abs(dz * p.ux - dx * p.uz) > p.b + q.a * s + q.b * c) return false;
    if (Math.abs(dx * q.ux + dz * q.uz) > q.a + p.a * c + p.b * s) return false;
    if (Math.abs(dz * q.ux - dx * q.uz) > q.b + p.a * s + p.b * c) return false;
    return true;
  };
  return {
    // r: { x, z, ux, uz (unit, along its half length a), a, b }
    add(r) { r.rad = Math.hypot(r.a, r.b); span(r, (k) => { let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(r); return false; }); return r; },
    free(r) {
      r.rad = Math.hypot(r.a, r.b);
      const x1 = Math.floor((r.x + r.rad) / CELL), z0 = Math.floor((r.z - r.rad) / CELL), z1 = Math.floor((r.z + r.rad) / CELL);
      for (let ix = Math.floor((r.x - r.rad) / CELL); ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const c = cells.get(key(ix, iz)); if (c) for (let i = 0; i < c.length; i++) if (hit(r, c[i])) return false; }
      return true;
    },
  };
}
// a lane: a bent line on the plan with its half breadth; at(s) gives the place and heading s metres along
function makeLane(pts, hw, o = {}) {
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  let j = 0;
  const at = (s) => {
    if (s < cum[j]) j = 0;
    while (j < pts.length - 2 && cum[j + 1] < s) j++;
    const L = Math.max(cum[j + 1] - cum[j], 1e-6), t = (s - cum[j]) / L, a = pts[j], b = pts[j + 1];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / L, (b[1] - a[1]) / L];
  };
  return { pts, hw, len, at, sides: o.sides || [1, -1], piles: !!o.piles, over: o.over || 0, wide: !!o.wide, deck: !!o.deck };
}
// THE TOWN'S UNLIKE QUARTERS ARE PLACES, TAKEN BEFORE ANY HOUSE IS LAID (typed; the same on every seed):
//   the great house: on the island about x -96, between the island's second and third long streets;
//   the market: on the southern bank about x 177, a square about the bank's second long street, north of the typed
//     church at (176, 236);
//   the tanners' row: on the southern strand from x 98 to 142 (no house and no lane is ever there).
// The lanes' own rule keeps the first two whole: a long street runs straight past a plot it bounds or crosses (its
// sway dies out over 35 m before the plot's ends), and a cross lane that would cut a plot stops at the plot.
// AN ALLEY: the room every typed thing among the houses (but the great house by the entry, whose plot is typed: see
// layChurches) keeps on the plan round what stands on it, as broad as a cross lane (a neighbour's lean-to, whose
// roof stands up to 3.35 m behind its house's own plot, out[1] + 0.3 + 0.05 at the deepest, has room in it).
const ALLEY = 3.4;
// The great house's two corner turrets as built (buildQuarters): their middles TURRET.off to either side of the
// house's middle, their walls' radius, their cones' eaves beyond the wall. THE PLOT IS TAKEN FROM WHAT STANDS ON
// IT: its half breadth is the turrets' reach with their cones' eaves and an alley.
const TURRET = { off: 14, r: 2.3, eave: 0.35 };
const QUARTERS = { great: { x: -96, a: TURRET.off + TURRET.r + TURRET.eave + ALLEY, row: 1 }, market: { x: 177, a: 19, row: 1 } };
const stillAt = (x, q) => smoothstep(q.a + 3, q.a + 38, Math.abs(x - q.x));
// THE THREE LANDMARKS OF THE SOUTHERN BANK ARE PLACES OF THE SAME KIND (typed; the same on every seed). They are
// DESIGN: three old foundations such as a town of this age has, of the town's own old stone, slate and lead, none
// a named place of any book, none as tall as the church's towers (69 m), each of another outline:
//   THE COLLEGE: on the southern bank east of the market's square, 294 m south-east of the church's walls; its
//     church lies askew to the long streets, its east end to the south-east, its plain square bell tower (to 53 m)
//     at its north-west end, a cloister garth on its north-east side;
//   THE FRIARY OF THREE GABLES: on the southern bank 273 m south of the church's walls, east of the street that
//     runs south from the stone bridge's end and four streets back from the strand: three naves abreast, their
//     gabled fronts in one face to the east, a slim open lead needle (to 58 m) over the middle roof;
//   THE BRIDGE GATE: at the southern bank's end of the stone bridge on x 12, 129 m from the church's walls: two
//     round towers (to 36 m) with the gate's passage between them over the roadway's ramp.
// Each is given by its own place (x, z of its tower's, needle's or passage's middle) and its turn; its measures
// are in its own frame (x along its length, z across). A PLOT IS WHAT STANDS ON IT AND AN ALLEY ROUND IT.
// The lanes run as they ran: a street passes over a plot's ground, and the roadway from the stone bridge runs
// through the gate's passage. THE HOUSES ARE DRAWN AND TRIED AS THEY WOULD BE WITHOUT THE PLOTS, each with its own
// draws on the plan as it was; a house whose ground meets a plot is then NOT BUILT: it stays in the houses' list
// as GONE (gone: true) with its place on the plan, so that every other house, top and plume stands where it
// would stand without the plots. A small church the seed draws on a plot is gone in the same way.
const COLLEGE = { x: 250, z: 282, yaw: -Math.PI / 4, half: 6, stage: [34, 43], wall: 44, cap: 48.5, turret: 53, nave: [6, 52], naveHalf: 7.5, naveWall: 19.5, ridge: 30.5, garth: [10, 44, -37, -9], walk: 4 };
const FRIARY = { x: 56, z: 304, yaw: 0, len: 48, nave: 13.6, wall: 22, ridge: 34, needle: [36, 44, 58] };
const GATE = { x: 12, z: 153, yaw: 0, off: 11, r: 6, wall: 24, cone: 36, block: [7.2, 4.5], blockWall: 21, ridge: 29, arch: [4, 7.5, 10.5] };
// a rectangle of a landmark's own frame as a rectangle on the plan
const markRect = (m, x0, x1, z0, z1) => { const c = Math.cos(m.yaw), sn = Math.sin(m.yaw), lx = (x0 + x1) / 2, lz = (z0 + z1) / 2; return { x: m.x + lx * c + lz * sn, z: m.z - lx * sn + lz * c, ux: c, uz: -sn, a: (x1 - x0) / 2, b: (z1 - z0) / 2 }; };
const MARK_PLOTS = [
  // the college: from its tower's corner turrets to its east gable's buttresses, from the garth's outer walk to the nave's southern buttresses
  markRect(COLLEGE, -COLLEGE.half - 1.5 - ALLEY, COLLEGE.nave[1] + 1 + ALLEY, COLLEGE.garth[2] - 1 - ALLEY, COLLEGE.naveHalf + 1.5 + ALLEY),
  // the friary: its three naves with their buttresses
  markRect(FRIARY, -FRIARY.len / 2 - ALLEY, FRIARY.len / 2 + ALLEY, -FRIARY.nave * 1.5 - 0.5 - ALLEY, FRIARY.nave * 1.5 + 0.5 + ALLEY),
  // the gate: its two towers with their corbelled heads, from the bridge's end to the alley behind them
  markRect(GATE, -GATE.off - GATE.r - 1 - ALLEY, GATE.off + GATE.r + 1 + ALLEY, -GATE.r - 1, GATE.r + 1 + ALLEY),
];
// (two rectangles of the plan that share ground)
const plotsMeet = (p, q) => {
  const dx = q.x - p.x, dz = q.z - p.z, c = Math.abs(p.ux * q.ux + p.uz * q.uz), sn = Math.abs(p.ux * q.uz - p.uz * q.ux);
  return !(Math.abs(dx * p.ux + dz * p.uz) > p.a + q.a * c + q.b * sn || Math.abs(dz * p.ux - dx * p.uz) > p.b + q.a * sn + q.b * c
    || Math.abs(dx * q.ux + dz * q.uz) > q.a + p.a * c + p.b * sn || Math.abs(dz * q.ux - dx * q.uz) > q.b + p.a * sn + p.b * c);
};
const onMarkPlot = (r) => MARK_PLOTS.some((q) => plotsMeet(r, q));
// the uprights no plume stands near and no ring of birds turns about: the college's tower, the friary's needle,
// the gate's two towers ([x, z] on the plan), and how near a plume's pot may stand to one
const MARK_TOWERS = [[COLLEGE.x, COLLEGE.z], [FRIARY.x, FRIARY.z], [GATE.x - GATE.off, GATE.z], [GATE.x + GATE.off, GATE.z]], MARK_SMOKE = 30;
// The lanes of the whole town, in the order in which their houses are set. Typed: the lane the line follows from the
// mill bridge's island end to the square's north-west corner, the square's three built sides, the streets that carry
// each bridge across the island, the strands. Drawn by the seed: every other street's sway and the cross lanes.
async function layLanes(W) {
  const R = W.RNG.lanes, lanes = [];
  const sway = () => { const a = R.range(2, 5.5), l = R.range(60, 110), p = R.range(0, 6.28); return (t) => a * Math.sin(t / l + p) + 0.4 * a * Math.sin(t / (l * 0.37) + p * 2); };
  const line = (f, t0, t1, hw, o) => { const pts = []; for (let t = t0; t <= t1 + 0.01; t += 9) pts.push(f(t)); if (pts.length > 1) lanes.push(makeLane(pts, hw, o)); };
  const G = QUARTERS.great, M = QUARTERS.market, SWAY_MAX = 7.7, plots = {};
  // 0 the five bridges' own rows, 12 m of roadway between them
  for (const b of BRIDGES) { const [z0, z1] = bridgeSpan(b); lanes.push(makeLane([[b.x, z0 + 0.5], [b.x, z1 - 0.5]], 6, { deck: true })); }
  // 1 the lane under the line (a typed place: its bends are the line's own places D, E, F, G on the ground)
  const w1 = R.range(-1.5, 1.5), w2 = R.range(-1.5, 1.5);
  lanes.push(makeLane([[-150, -93], [-133 + w1, -86 - w1], [-115, -80], [-98 + w2, -66 - w2], [-82, -57], [-68, -44.5], [-56, -36], [-47, -30.5]], 2));
  // 2 the square's three built sides
  lanes.push(makeLane([[-41, -31], [0, -31]], 0.5, { sides: [-1] }), makeLane([[0, 31], [-41, 31]], 0.5, { sides: [-1] }), makeLane([[-41, 31], [-41, -31]], 0.5, { sides: [-1] }));
  // 3 the island's waterside row on its north shore (low houses on piles, their backs over the water)
  line((x) => [x, islandN(x) + 8.6], -520, 96, 2, { sides: [-1], piles: true, over: 3.2 });
  // 4 the streets that carry the five bridges over the island and into both banks
  for (const [x, za, zb] of [[-150, -93, 180], [60, -76, -36], [-470, -86, 150], [12, 36, 85], [-330, -100, 180]]) line((z) => [x, z], za, zb, 4.5, { wide: true });
  for (const x of [-150, 60, -470]) line((z) => [x, z], -640, bankN(x) - 1, 4.5, { wide: true });
  for (const x of [12, -330]) line((z) => [x, z], bankS(x) + 1, 600, 4.5, { wide: true });
  // 5 the island's long streets, 31 m apart from the north shore, each with its own sway; and the south shore's
  const bound = [];
  await W.ctx.yield();
  for (let k = 0; k < 9; k++) {
    const s = sway(), off = 26 + 31 * k, by = k === G.row || k === G.row + 1, f = (x) => Math.min(islandN(x) + off + s(x) * (by ? stillAt(x, G) : 1), islandS(x) - 11);
    if (by) bound.push(f);
    line((x) => [x, f(x)], -640, 232, 1.9);
  }
  // the great house's plot: between its two streets, 2.6 m back from each street's middle
  plots.great = { x: G.x, a: G.a, z0: bound[0](G.x) + 2.6, z1: bound[1](G.x) - 2.6 };
  // 6 the island's cross lanes (one that would cut the great house's plot stops at its two streets)
  for (let x = -620 + R.range(0, 30); x < 120; x += R.range(46, 78)) {
    const s = sway(), f = (z) => [x + s(z), z];
    if (Math.abs(x + 150) <= 20 || Math.abs(x + 330) <= 20 || Math.abs(x + 470) <= 20) continue;
    if (Math.abs(x - G.x) > G.a + SWAY_MAX + 4) line(f, islandN(x) + 10, islandS(x) - 10, 1.6);
    else { line(f, islandN(x) + 10, plots.great.z0 - 4.5, 1.6); line(f, plots.great.z1 + 4.5, islandS(x) - 10, 1.6); }
  }
  // 7 the banks: a strand street, long streets every 31 m behind it, cross lanes
  for (const side of [-1, 1]) {
    await W.ctx.yield();
    const sh = side < 0 ? bankN : bankS, m = side < 0 ? 12 : 10;
    line((x) => [x, sh(x) + side * (m - 3)], -600, 560, 3, { sides: [side] });
    for (let k = 0; k < 14; k++) {
      const s = sway(), off = m + 28 + 31 * k, by = side > 0 && (k === M.row || k === M.row + 1), f = (x) => sh(x) + side * off + s(x) * (by ? stillAt(x, M) : 1);
      // the market's place: a square from 13 m north of its street to the typed church's north side
      if (by && k === M.row) plots.market = { x: M.x, a: M.a, street: f(M.x), z0: f(M.x) - 13, z1: 228.5 };
      line((x) => [x, f(x)], -600, 560, 1.9);
    }
    for (let x = -580 + R.range(0, 30); x < 560; x += R.range(50, 86)) {
      const s = sway(), f = (t) => [x + s(t) + side * t * 0.06, sh(x) + side * (m + t)], P = plots.market;
      // (a cross lane that would cut the market's place stops at the square's two ends)
      if (side < 0 || Math.abs(x + 4 - M.x) > M.a + SWAY_MAX + 6) line(f, 0, 450, 1.7);
      else { line(f, 0, P.z0 - sh(x) - m, 1.7); line(f, P.z1 + 12 - sh(x) - m, 450, 1.7); }
    }
  }
  // the plots as rectangles on the plan
  plots.rects = [{ x: G.x, z: (plots.great.z0 + plots.great.z1) / 2, ux: 1, uz: 0, a: G.a, b: (plots.great.z1 - plots.great.z0) / 2 },
    { x: M.x, z: (plots.market.z0 + plots.market.z1) / 2, ux: 1, uz: 0, a: M.a, b: (plots.market.z1 - plots.market.z0) / 2 }];
  W.plots = plots;
  return lanes;
}

// ---------------------------------------------------------------- the town's plan: houses along the lanes
// Every house is set by one rule: fronts stand on the lane's edge side by side, a house yields to whatever stands
// there already (an older house, a lane, a church, a hall), keeps to the land, and keeps its chimney 6 m and more
// under the flown line (a lower house there, or none). Houses within NEAR_M of the line's ground track are built
// in full, the others in few triangles.
const NEAR_M = 72;
// how many steps along the lanes are laid before the build is handed back (a slice of about 20 ms; a sixteenth of
// that through the first of them, while the page's engine is still slow at the loop)
const HOUSE_SLICE = 4800;
async function layHouses(W, plan, lanes, kinds) {
  const R = W.RNG.houses, houses = [], P = new THREE.Vector3();
  // the flown line, every 2 m
  const RX = [], RY = [], RZ = []; for (let m = 0; m <= W.LEN; m += 2) { W.path.posAtDist(m, P); RX.push(P.x); RY.push(P.y); RZ.push(P.z); }
  // (the same places by stretches of TRACK_RUN of them: each stretch's first place, and how far its places lie from
  // that on the plan. The nearest place is sought among the stretches' first places, then in the stretches that can
  // hold a nearer one or one within 'reach': the same nearest place and the same ceiling as by asking every place)
  const TRACK_RUN = 8, SX = [], SZ = [], SR = [];
  for (let i = 0; i < RX.length; i += TRACK_RUN) { let far = 0; for (let j = i; j < Math.min(i + TRACK_RUN, RX.length); j++) far = Math.max(far, Math.hypot(RX[j] - RX[i], RZ[j] - RZ[i])); SX.push(RX[i]); SZ.push(RZ[i]); SR.push(far + 1e-6); }
  const SD = new Float64Array(SX.length);
  const trackOf = (x, z, reach) => {
    let d2 = 1e9, ceil = 1e9;
    if (x < -420 || x > 330 || z < -235 || z > 315) return [999, ceil];
    for (let s = 0; s < SX.length; s++) { const dx = SX[s] - x, dz = SZ[s] - z, q = dx * dx + dz * dz; SD[s] = Math.sqrt(q); if (q < d2) d2 = q; }
    const best = Math.sqrt(d2) + 1e-6;
    for (let s = 0; s < SX.length; s++) {
      const least = SD[s] - SR[s]; if (least > best && least > reach) continue;
      for (let i = s * TRACK_RUN, i1 = Math.min(i + TRACK_RUN, RX.length); i < i1; i++) { const dx = RX[i] - x, dz = RZ[i] - z, q = dx * dx + dz * dz; if (q < d2) d2 = q; if (q < reach * reach && RY[i] - 6 < ceil) ceil = RY[i] - 6; }
    }
    return [Math.sqrt(d2), ceil];
  };
  for (const ln of lanes) for (let i = 0; i < ln.pts.length - 1; i++) {
    const a = ln.pts[i], b = ln.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    plan.add({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L, a: L / 2 + ln.hw * 0.4, b: Math.max(ln.hw - 0.25, 0.1) });
  }
  await W.ctx.yield();
  const street = [0, 0, 1, 1, 2, 2, 3, 4, 5, 5, 6, 7], piles = [8, 8, 9], deck = [0, 3, 6, 0, 5];
  let last = -1, n = 0;
  for (const ln of lanes) {
    for (const side of ln.sides) {
      let s = R.range(0.5, 3);
      while (s < ln.len - 2.5) {
        const set = ln.piles ? piles : ln.deck ? deck : street;
        let k = set[Math.floor(R() * set.length)];
        if (k === last) k = ln.piles ? 17 - k : set[Math.floor(R() * set.length)];
        const K = kinds[k], sw = R.range(0.92, 1.1), w = K.w * sw, sy0 = R.range(0.9, 1.1) * (ln.deck ? 0.9 : 1), tone = R(), hs = R();
        const [px, pz, tx, tz] = ln.at(s + w / 2), nx = -tz * side, nz = tx * side, off = ln.hw + K.d / 2;
        const r = { x: px + nx * off, z: pz + nz * off, ux: -nz, uz: nx, a: w / 2 - 0.1, b: K.d / 2 - 0.05 };
        let ok = true;
        // (its plot's middle and four corners on the land)
        if (!ln.deck) {
          const ax = r.ux * r.a, az = r.uz * r.a, bx = nx * r.b, bz = nz * r.b, o = ln.over;
          ok = houseLand(r.x, r.z, o) && houseLand(r.x + ax + bx, r.z + az + bz, o) && houseLand(r.x + ax - bx, r.z + az - bz, o) && houseLand(r.x - ax + bx, r.z - az + bz, o) && houseLand(r.x - ax - bx, r.z - az - bz, o);
        }
        let sy = sy0, near = false;
        if (ok) {
          const gy = ln.deck ? DECK_Y : groundY(r.x, r.z), [dT, ceil] = trackOf(r.x, r.z, r.a + r.b + 4);
          near = dT < NEAR_M;
          // roofs of unlike height: by this second draw a house stands from 28 hundredths lower to 8 higher than
          // its first draw made it (on a bridge or on piles as it made it); then the line's clearance is kept (a lower
          // house there, or none)
          if (!ln.deck && !ln.piles) sy *= HOUSE_LOW + (HOUSE_HIGH - HOUSE_LOW) * ((hs * 31.7) % 1);
          if (gy + K.top * sy > ceil) { sy = (ceil - gy) / K.top; if (sy < 0.62) ok = false; }
          if (ok && plan.free(r)) {
            plan.add(r);
            // the house's own origin lies K.zc behind the middle of its plot (its front is local +z, toward the lane)
            // (gone: its ground meets a landmark's plot; it is drawn, tried and kept on the plan like every house, and not built)
            houses.push({ x: r.x + nx * K.zc, y: gy, z: r.z + nz * K.zc, yaw: Math.atan2(-nx, -nz), k, sw, sy, near, tone, hs, cx: r.x, cz: r.z, top: gy + K.ridge * sy, rad: Math.max(w, K.d) * 0.5, dT, wide: ln.wide, r, gone: onMarkPlot(r) });
            last = k;
          } else ok = false;
        }
        s += ok ? w + (R() < 0.06 ? R.range(1.2, 3.2) : 0) : 2.2;
        if (++n % (n < HOUSE_SLICE ? HOUSE_SLICE / 16 : HOUSE_SLICE) === 0) await W.ctx.yield();
      }
    }
  }
  return houses;
}

// ---------------------------------------------------------------- the town's unlike quarters: what stands on their plots
// The plots are the lanes' (layLanes: taken before any house is laid, and the houses are laid round them). Here:
// where the market's hall and well stand on its square, the great house's plot, and their masses in the standing shade.
function planQuarters(W) {
  const P = W.plots, mz = P.market.street, hallZ = clamp(mz + 1.9 + 1.2 + 4.2, 205, 222), M = QUARTERS.market;
  const Q = { market: { x0: M.x - M.a, x1: M.x + M.a, z0: P.market.z0, z1: P.market.z1, street: mz, hall: [M.x, hallZ], well: [M.x - 13.5, Math.min(hallZ + 9, 225)] },
    great: { x: P.great.x, z0: P.great.z0, z1: P.great.z1 } };
  W.shade.block(Q.market.hall[0], Q.market.hall[1], 1, 0, 9, 4.2, BANK_Y + 7);
  W.shade.block(Q.great.x, Q.great.z0 + 4.2, 1, 0, 14, 4.2, 12);
  return Q;
}
// the three quarters' own things (and a well by the market hall)
function buildQuarters(W, Q) {
  const g = makeGB(), R = W.RNG.quarters, PALE = [0.33, 0.31, 0.28];
  const wellAt = (x, y, z) => {
    g.col(CHURCH_STONE, 1.05).mat(0, 0).cyl(x, z, y - 0.3, y + 0.95, 1.2, 1.2, 10).cyl(x, z, y + 0.95, y + 0.95, 1.2, 0.8, 10);
    g.col([0.02, 0.03, 0.035]).mat(7, 0).cyl(x, z, y + 0.9, y + 0.9, 0.8, 0, 10);
    g.col(TIMBER, 1.2).mat(5, 0);
    for (const s of [-1, 1]) g.beam([x + s * 1.05, y + 0.9, z], [x + s * 1.05, y + 3.0, z], 0.16, 0.16, 3);
    g.beam([x - 1.05, y + 2.1, z], [x + 1.05, y + 2.1, z], 0.13, 0.13, 3);
    g.col(TILE).mat(2, 0).quad([x - 1.5, y + 2.8, z + 0.95], [x + 1.5, y + 2.8, z + 0.95], [x + 1.5, y + 3.6, z], [x - 1.5, y + 3.6, z], 8).quad([x + 1.5, y + 2.8, z - 0.95], [x - 1.5, y + 2.8, z - 0.95], [x - 1.5, y + 3.6, z], [x + 1.5, y + 3.6, z], 8);
  };
  // the market's covered hall: twelve oak posts under one great tiled roof, open all round; trestles under it
  {
    const [hx, hz] = Q.market.hall, y = groundY(hx, hz), hl = 9, hw = 4.2, ye = y + 4.1, yr = y + 9.6;
    g.col(TIMBER, 1.2).mat(5, 0);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
      const x = hx - hl + 0.4 + i * (2 * hl - 0.8) / 5, z = hz + s * (hw - 0.3);
      g.beam([x, y - 0.3, z], [x, ye, z], 0.34, 0.34, 3);
      g.beam([x, ye - 1.2, z], [x + (i < 5 ? 1.1 : -1.1), ye - 0.1, z], 0.16, 0.16, 3);
      if (s > 0) g.beam([x, ye - 0.15, hz - hw + 0.3], [x, ye - 0.15, hz + hw - 0.3], 0.26, 0.26, 3);
    }
    for (const s of [-1, 1]) g.beam([hx - hl, ye, hz + s * (hw - 0.3)], [hx + hl, ye, hz + s * (hw - 0.3)], 0.3, 0.3, 3);
    g.col(PLASTER, 0.6).mat(3, 1).tri([hx - hl, ye, hz - hw], [hx - hl, ye, hz + hw], [hx - hl, yr - 0.2, hz]).tri([hx + hl, ye, hz + hw], [hx + hl, ye, hz - hw], [hx + hl, yr - 0.2, hz]);
    g.col(TILE).mat(2, 0).quad([hx - hl - 0.6, ye - 0.35, hz + hw + 0.9], [hx + hl + 0.6, ye - 0.35, hz + hw + 0.9], [hx + hl + 0.6, yr, hz], [hx - hl - 0.6, yr, hz], 8).quad([hx + hl + 0.6, ye - 0.35, hz - hw - 0.9], [hx - hl - 0.6, ye - 0.35, hz - hw - 0.9], [hx - hl - 0.6, yr, hz], [hx + hl + 0.6, yr, hz], 8);
    g.col(TIMBER, 1.5).mat(5, 0);
    for (const dx of [-5.5, 0, 5.5]) g.box(hx + dx - 1.6, y + 0.75, hz - 0.6, hx + dx + 1.6, y + 0.85, hz + 0.6, 15, 63).box(hx + dx - 1.4, y, hz - 0.08, hx + dx - 1.3, y + 0.75, hz + 0.08, 0, 1 | 2 | 16 | 32).box(hx + dx + 1.3, y, hz - 0.08, hx + dx + 1.4, y + 0.75, hz + 0.08, 0, 1 | 2 | 16 | 32);
    wellAt(Q.market.well[0], groundY(...Q.market.well), Q.market.well[1]);
  }
  // the great house: a long stone range under a steep slate roof, a round turret at each end of its court side and
  // a stair turret between them, a walled court with a gate arch on the southern street
  if (Q.great) {
    const { x, z0, z1 } = Q.great, zr = z0 + 8.4, yw = 9.2, yr = 15.4, F = wallFrame([x, 0, zr], [0, 0, 1]), holes = [];
    for (let i = 0; i < 7; i++) if (i !== 3) holes.push({ c: -12 + i * 4, w: 0.55, yb: 5.2, ys: 7.2, ya: 7.9, d: 0.35, n: 3 });
    g.col(PALE).mat(0, 0); archWall(g, F, -14, 14, -0.3, yw, holes, 0.5);
    for (const h of holes) { g.col([1, 1, 1]).mat(6, 0); archFill(g, F, h, 0.35); }
    g.col(PALE, 0.96).mat(0, 0).box(x - 14, -0.3, z0, x + 14, yw, zr, 3, 1 | 2 | 16);
    g.tri([x - 14, yw, z0], [x - 14, yw, zr], [x - 14, yr, (z0 + zr) / 2]).tri([x + 14, yw, zr], [x + 14, yw, z0], [x + 14, yr, (z0 + zr) / 2]);
    g.col(SLATE).mat(2, 0).quad([x - 14.4, yw - 0.2, zr + 0.5], [x + 14.4, yw - 0.2, zr + 0.5], [x + 14.4, yr, (z0 + zr) / 2], [x - 14.4, yr, (z0 + zr) / 2], 8).quad([x + 14.4, yw - 0.2, z0 - 0.5], [x - 14.4, yw - 0.2, z0 - 0.5], [x - 14.4, yr, (z0 + zr) / 2], [x + 14.4, yr, (z0 + zr) / 2], 8);
    for (const [tx, r, h] of [[x - TURRET.off, TURRET.r, 12.6], [x + TURRET.off, TURRET.r, 12.6], [x, 1.7, 14.2]]) {
      g.col(PALE, 1.06).mat(0, 0).cyl(tx, zr + (tx === x ? 0.9 : 0.4), -0.3, h, r, r, 10);
      g.col(SLATE).mat(2, 0).cyl(tx, zr + (tx === x ? 0.9 : 0.4), h, h + r * 2.5, r + TURRET.eave, 0, 10);
    }
    for (const s of [-1, 1]) g.col(CHIMNEY, 0.9).mat(0, 0).box(x + s * 7 - 0.6, yr - 1, (z0 + zr) / 2 - 0.5, x + s * 7 + 0.6, yr + 1.8, (z0 + zr) / 2 + 0.5, 3, 1 | 2 | 8 | 16 | 32);
    // the court's walls and the gate
    const wall = (xa, za, xb, zb) => { g.col(PALE, 0.9).mat(0, 0).box(Math.min(xa, xb), -0.3, Math.min(za, zb), Math.max(xa, xb), 3.0, Math.max(za, zb), 3, 1 | 2 | 16 | 32); g.col(PALE, 1.15).box(Math.min(xa, xb) - 0.07, 3.0, Math.min(za, zb) - 0.07, Math.max(xa, xb) + 0.07, 3.2, Math.max(za, zb) + 0.07, 12, 63); };
    wall(x - 15, zr, x - 14.5, z1); wall(x + 14.5, zr, x + 15, z1); wall(x - 15, z1 - 0.5, x - 2.2, z1); wall(x + 2.2, z1 - 0.5, x + 15, z1);
    const Fg = wallFrame([x, 0, z1], [0, 0, 1]), hg = { c: 0, w: 1.6, yb: -0.3, ys: 2.3, ya: 3.5, d: 0.5, sill: false, n: 4 };
    g.col(PALE, 1.0).mat(0, 0); archWall(g, Fg, -2.2, 2.2, -0.3, 4.6, [hg], 0.5); g.box(x - 2.2, -0.3, z1 - 0.5, x + 2.2, 4.6, z1, 3, 1 | 2 | 8 | 16);
    g.col(TIMBER, 0.9).mat(5, 0.5); archFill(g, Fg, hg, 0.3);
  }
  // the tanners' row on the southern strand, x 98 to 142: four open sheds with their vats, hides on frames between
  // them, and before them a side channel: a timber breakwater 17 m out, a wheel in the channel's lower end
  const sh = (x) => bankS(x), strandY = (x, z) => (z >= sh(x) ? BANK_Y : BANK_Y - 6 * (sh(x) - z) / STRAND), HIDES = [[0.42, 0.3, 0.16], [0.26, 0.17, 0.1], [0.5, 0.44, 0.34], [0.33, 0.2, 0.12]];
  for (let i = 0; i < 4; i++) {
    const x = 104 + i * 11, z0 = sh(x) - 4.4, z1 = sh(x) + 0.4;
    g.col(TIMBER, 1.15).mat(5, 0);
    for (const dx of [-3.8, 0, 3.8]) { g.beam([x + dx, strandY(x, z0) - 0.6, z0], [x + dx, 3.9, z0], 0.24, 0.24, 3); g.beam([x + dx, 0.6, z1], [x + dx, 4.8, z1], 0.24, 0.24, 3); g.beam([x + dx, 3.85, z0], [x + dx, 4.75, z1], 0.2, 0.2, 3); }
    g.col(TILE, 0.9).mat(2, 0).quad([x + 4.4, 3.85, z0 - 0.6], [x - 4.4, 3.85, z0 - 0.6], [x - 4.4, 4.95, z1 + 0.4], [x + 4.4, 4.95, z1 + 0.4], 8);
    for (const dx of [-2, 2]) { const vz = z0 + 2.6, vy = strandY(x, vz); g.col(TIMBER, 1.4).mat(5, 0).cyl(x + dx, vz, vy - 0.5, vy + 0.85, 1.0, 1.05, 10); g.col([0.07, 0.06, 0.05]).mat(7, 0).cyl(x + dx, vz, vy + 0.8, vy + 0.8, 1.0, 0, 10); }
    if (i === 3) break;
    // a drying frame between this shed and the next: two posts, a rail, three hides
    const fx = x + 5.5, fz = sh(fx) - 2.4, fy = strandY(fx, fz);
    g.col(TIMBER, 1.2).mat(5, 0);
    for (const dz of [-1.6, 1.6]) g.beam([fx, fy - 0.5, fz + dz], [fx, fy + 2.3, fz + dz], 0.14, 0.14, 3);
    g.beam([fx, fy + 2.25, fz - 1.8], [fx, fy + 2.25, fz + 1.8], 0.1, 0.1, 3);
    for (let k = 0; k < 3; k++) {
      const hz = fz - 1.05 + k * 1.05, c = HIDES[Math.floor(R() * 4)], drop = R.range(1.2, 1.6);
      g.col(c).mat(7, 0).quad([fx, fy + 2.2 - drop, hz - 0.42], [fx, fy + 2.2 - drop, hz + 0.42], [fx, fy + 2.2, hz + 0.38], [fx, fy + 2.2, hz - 0.38]).quad([fx, fy + 2.2 - drop, hz + 0.42], [fx, fy + 2.2 - drop, hz - 0.42], [fx, fy + 2.2, hz - 0.38], [fx, fy + 2.2, hz + 0.38]);
    }
  }
  for (let x = 100; x < 142; x += 6) {
    const xb = Math.min(x + 6, 142), za = sh(x) - 17, zb = sh(xb) - 17;
    g.col(TIMBER, 1.0).mat(5, 0).quad([x, WATER_Y - 0.6, za], [xb, WATER_Y - 0.6, zb], [xb, WATER_Y + 1.0, zb], [x, WATER_Y + 1.0, za]).quad([xb, WATER_Y - 0.6, zb], [x, WATER_Y - 0.6, za], [x, WATER_Y + 1.0, za], [xb, WATER_Y + 1.0, zb]);
    for (const px of [x, x + 3]) g.cyl(px, sh(px) - 17 - 0.2, WATER_Y - 1.5, WATER_Y + 1.5, 0.17, 0.15, 5);
  }
  // the wheel's two timber trestles and its axle, between the breakwater and a short jetty from the strand
  const wx = 101.5, wz = sh(wx) - 12.6, wy = WATER_Y + 0.9;
  g.col(TIMBER, 1.2).mat(5, 0);
  for (const dz of [-2.1, 2.1]) { g.beam([wx - 1.4, WATER_Y - 1, wz + dz], [wx, wy + 0.2, wz + dz], 0.24, 0.24, 3); g.beam([wx + 1.4, WATER_Y - 1, wz + dz], [wx, wy + 0.2, wz + dz], 0.24, 0.24, 3); }
  g.box(wx - 1.2, WATER_Y + 0.5, wz + 2.1, wx + 1.2, WATER_Y + 0.7, sh(wx) - 7.6, 0, 63);
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, 1); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; W.scene.add(mesh);
  return { tris: g.tris, wheel: { p: [wx, wy, wz], speed: -R.range(0.7, 0.95), phase: R.range(0, 6.28) }, channel: (x, z) => x > 94 && x < 148 && z > sh(x) - 20 && z < sh(x) };
}

// ---------------------------------------------------------------- the southern bank's roofs: unlike, and what stands on them
// THE SOUTHERN BANK (a place: every house whose plot's middle lies south of the southern arm's bank line; the
// three landmarks stand among them) is the town the line crosses between the fork and the door. Its houses are
// the town's own, each where it stood and as tall; what is dealt here is dealt BY TWO STREAMS OF THEIR OWN, each
// asked for EVERY house of the town in the houses' own order before anything is tried (six and two draws a
// house), so that no draw the town had before is dealt anew:
//  'roofs': THE ROOF'S STATE (BANK_ROOFS: of a hundred roofs 22 lie under thick snow to the eaves, 36 have half
//    slid, the sunward slope bare far up and the other bare at its foot; 6 are of lead-grey sheets, 8 mossed; the
//    other 28 keep the town's common law; and each roof has a hue of its own, see buildTown) and WHAT STANDS ON
//    IT (dealt to one roof in six: to one in ten one or two gabled dormers, to one in fifteen a stair turret under
//    a cone at the house's back corner; to one in ten more a CROSS GABLE, its ridge across the house's own; and
//    to three in ten a SECOND STACK of its own height at the ridge's other end);
//  'lamps': HOW MANY OF ITS CASEMENTS HAVE A LAMP BEHIND THEM (half the houses none, the others up to 0.55 of
//    them: one casement in seven over the bank; the part's wall law draws them, steady, each with its light on
//    the sill and the wall under it), and whether its dormer's or its cross gable's window is lit (four in ten).
// EVERY ADDED BODY STANDS INSIDE ITS OWN HOUSE'S HULL: within the eaves' outline on the plan (a turret's foot a
// hand outside the two walls it stands at, under their eaves), and under the top of the house's own stack (a
// dormer's and a cross gable's ridge under the house's ridge, a turret's point at most half a metre over it, a
// second stack under the first one's top): no bird's height and no plume's pot is moved by them. AND BY THE LAW
// OF THE LINE nothing is added on a house whose hull comes within ROOF_CLEAR metres of the flown line (see
// buildRoofs: none to three houses a seed keep their plain roofs by it), so that nothing added stands as near the line
// as the houses themselves do. A dormer that would not fit under its ridge is not built (by the house's own
// measures), and on a hipped roof neither a dormer nor a cross gable.
const BANK_ROOFS = [0.22, 0.58, 0.64, 0.72], BANK_DORMER = 0.1, BANK_TURRET = 1 / 6, BANK_CROSS = 1 / 6 + 0.1, BANK_STACK = 0.3, BANK_LAMP = 0.55, BANK_LIT = 0.4;
const ROOF_CLEAR = 7, LEAD_SHEET = [0.2, 0.215, 0.245], LAMP_GLASS = [0.66, 0.33, 0.1], LAMP_SILL = [0.15, 0.065, 0.018];
function dealBank(W, houses) {
  const R = W.RNG.roofs, L = W.RNG.lamps;
  for (const h of houses) {
    const r0 = R(), r1 = R(), r2 = R(), r3 = R(), r4 = R(), r5 = R(), l0 = L(), l1 = L();
    if (!(h.cz > bankS(h.cx))) continue;
    h.bank = {
      state: r0 < BANK_ROOFS[0] ? 1 : r0 < BANK_ROOFS[1] ? 2 : r0 < BANK_ROOFS[2] ? 3 : r0 < BANK_ROOFS[3] ? 4 : 0, hue: (r0 * 97.3) % 1 * 2 - 1,
      add: r1 < BANK_DORMER ? 1 : r1 < BANK_TURRET ? 2 : r1 < BANK_CROSS ? 3 : 0, a: r2, b: r3, stack: r4 < BANK_STACK, tall: r5,
      lamp: l0 < 0.5 ? 0 : (l0 - 0.5) * 2 * BANK_LAMP, lit: l1 < BANK_LIT,
    };
  }
}
// WHAT STANDS ON THE SOUTHERN BANK'S ROOFS, in one mesh of the houses' own surface: every piece carries its house's
// own numbers (its roof's and its wall's colours, its standing shade, its snow, its roof's state, its lamps), so
// that a dormer's slates are its roof's and its cheeks its wall's. Each is laid in its house's own frame (x along
// the breadth, z toward the lane) by the house's own measures as it stands (its breadth's and its height's shares).
async function buildRoofs(W, houses, kinds) {
  const g = makeGB(), spans = [], UP = [0, 1, 0]; let held = 0, seen = 0;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], crossDot = (u, v, o) => (u[1] * v[2] - u[2] * v[1]) * o[0] + (u[2] * v[0] - u[0] * v[2]) * o[1] + (u[0] * v[1] - u[1] * v[0]) * o[2];
  // (a face from its foot's two ends up to its head's two, and a three-cornered one, each turned to look out)
  const face = (e0, e1, r1, r0, out, fl = 0) => { if (crossDot(sub(e1, e0), sub(r0, e0), out) < 0) g.quad(e1, e0, r0, r1, fl); else g.quad(e0, e1, r1, r0, fl); };
  const three = (a, b, c, out) => { if (crossDot(sub(b, a), sub(c, a), out) < 0) g.tri(b, a, c); else g.tri(a, b, c); };
  // (the line's places every metre, for the law of the line below)
  const P = new THREE.Vector3(), LX = [], LY = [], LZ = []; for (let m = 0; m <= W.LEN; m += 1) { W.path.posAtDist(m, P); LX.push(P.x); LY.push(P.y); LZ.push(P.z); }
  for (const h of houses) {
    const B = h.bank; if (!B || h.gone || !B.inst || (!B.add && !B.stack)) continue;
    if (++seen % 60 === 0) await W.ctx.yield();
    const o = HOUSE_KINDS[h.k], hw = o.w / 2 * h.sw, hd = o.d / 2, H = o.st * o.sh * h.sy, rise = o.rise * h.sy, top = H + rise, zTop = hd + (o.jet || 0) * (o.st - 1);
    // THE LAW OF THE LINE: nothing is added on a house whose hull (its eaves' outline on the plan, from its ground to
    // the top of its stack, a hand to spare) comes within ROOF_CLEAR metres of any place of the line
    { const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), ex = hw + 0.5, ez0 = -hd - 0.5, ez1 = zTop + 0.5, yt = h.y + kinds[h.k].top * h.sy + 0.1; let near = 1e9;
      for (let i = 0; i < LX.length; i++) {
        const dx = LX[i] - h.x, dz = LZ[i] - h.z; if (dx * dx + dz * dz > 900) continue;
        const lx = dx * c - dz * sn, lz = dx * sn + dz * c; near = Math.min(near, Math.hypot(Math.max(Math.abs(lx) - ex, 0), Math.max(ez0 - lz, lz - ez1, 0), Math.max(LY[i] - yt, h.y - LY[i], 0)));
      }
      if (near < ROOF_CLEAR) { held++; continue; } }
    const gable = o.along === 'z', zr = o.along === 'hip' ? 0 : (zTop - hd) / 2, L = gable ? hw : (zTop + hd) / 2, tf = o.plain ? 0 : 1, cx = o.chim[0] * h.sw, cz = o.chim[1];
    // THE SLOPE that carries a dormer or a cross gable: on a house with its gable to the lane the side slope away
    // from its chimney, on the others the slope behind. pt(t, a, y): the place t metres from the ridge down that
    // slope on the plan, a metres along the ridge, at the height y; out: the way the slope's eaves look; (a0, a1):
    // how far along the ridge the slope is free
    const s = cx > 0 ? -1 : 1, pt = gable ? (t, a, y) => [s * t, y, a] : (t, a, y) => [a, y, zr - t], out = gable ? [s, 0, 0] : [0, 0, -1], along = gable ? [0, 0, 1] : [1, 0, 0], back = [-along[0], 0, -along[2]];
    const roofY = (t) => top - t / L * rise, free = gable ? [-hd + 1.4, zTop - 1.4] : o.along === 'hip' ? (cx > 0 ? [-1.7, -0.9] : [0.9, 1.7]) : cx > 0 ? [-hw + 1.4, cx - 2.2] : [cx + 2.2, hw - 1.4];
    const first = g.corners; g.at(h.x, h.y, h.z, h.yaw);
    // (a window of lit glass over a lit sill, or of dark glass, a hand before the wall at t)
    const pane = (t, a, y0, y1, hw2) => {
      if (B.lit) { g.col(LAMP_GLASS).mat(8, 0); face(pt(t, a - hw2, y0), pt(t, a + hw2, y0), pt(t, a + hw2, y1), pt(t, a - hw2, y1), out); g.col(LAMP_SILL); face(pt(t, a - hw2 - 0.1, y0 - 0.14), pt(t, a + hw2 + 0.1, y0 - 0.14), pt(t, a + hw2 + 0.1, y0), pt(t, a - hw2 - 0.1, y0), out); }
      else { g.col(MARK_DARK).mat(7, 0); face(pt(t, a - hw2, y0), pt(t, a + hw2, y0), pt(t, a + hw2, y1), pt(t, a - hw2, y1), out); }
    };
    const hip = o.along === 'hip';
    if (B.add === 1 && !hip) {
      // GABLED DORMERS, one or two: a front 1.4 m broad under a small gable at six tenths of the slope's run, its
      // ridge running back into the roof under the house's ridge
      const t0 = 0.6 * L, ga = 0.65, dw = 0.7, dh = Math.min(1.2, (t0 - 0.12 * L) * rise / L - ga), n = B.a > 0.5 && free[1] - free[0] > 4.6 ? 2 : 1;
      if (dh >= 0.7) for (let i = 0; i < n; i++) {
        const a = n === 2 ? lerp(free[0], free[1], i === 0 ? 0.08 + 0.26 * B.b : 0.66 + 0.26 * B.b) : lerp(free[0], free[1], B.b), yb = roofY(t0) - 0.03, ye = yb + dh, yr = ye + ga;
        const tb = t0 - dh * L / rise, te = t0 - (dh - 0.1) * L / rise, tr = t0 - (dh + ga) * L / rise;
        g.col([1, 1, 1]).mat(3, tf); face(pt(t0, a - dw, yb), pt(t0, a + dw, yb), pt(t0, a + dw, ye), pt(t0, a - dw, ye), out, 1);
        three(pt(t0, a - dw, ye), pt(t0, a + dw, ye), pt(t0, a, yr), out);
        three(pt(t0, a - dw, yb), pt(t0, a - dw, ye), pt(tb, a - dw, ye), back); three(pt(t0, a + dw, yb), pt(t0, a + dw, ye), pt(tb, a + dw, ye), along);
        g.col([1, 1, 1]).mat(2, 0);
        face(pt(t0 + 0.2, a - dw - 0.15, ye - 0.1), pt(te, a - dw - 0.15, ye - 0.1), pt(tr, a, yr + 0.05), pt(t0 + 0.2, a, yr + 0.05), UP, 8);
        face(pt(t0 + 0.2, a + dw + 0.15, ye - 0.1), pt(te, a + dw + 0.15, ye - 0.1), pt(tr, a, yr + 0.05), pt(t0 + 0.2, a, yr + 0.05), UP, 8);
        pane(t0 + 0.03, a, yb + 0.3, ye - 0.12, 0.42);
      }
    } else if (B.add === 2) {
      // A STAIR TURRET at the house's back corner: six-sided, 2.1 m across, of the house's own wall, from the ground
      // to a little over the eaves, under a steep cone of the roof's own slates
      const tx = hw - 0.95, tz = -hd + 0.95, tip = Math.min(H + 3.7, top + 0.5), ch = Math.min(2.4, tip - H - 0.4), wt = tip - ch;
      g.col([1, 1, 1]).mat(3, 0).cyl(tx, tz, 0, wt, 1.05, 1.05, 6, { fl: o.st });
      g.col([1, 1, 1]).mat(2, 0).cyl(tx, tz, wt - 0.12, tip, 1.2, 0, 6);
    } else if (B.add === 3 && !hip) {
      // A CROSS GABLE: a gable of the house's own wall standing on the eaves' wall, as high as seven tenths of the
      // roof, its ridge running in across the house's own to where the roof takes it (its two slopes end in the
      // two valleys, each a line of the roof's own plane)
      const gw = Math.min(1.9, 0.2 * (free[1] - free[0] + 2.8)), a = lerp(free[0] + gw - 0.6, free[1] - gw + 0.6, B.b), yr = H + 0.7 * rise, tm = (top - yr - 0.1) * L / rise, te = L + 0.38, ye = roofY(te) + 0.05;
      g.col([1, 1, 1]).mat(3, tf); three(pt(L + 0.02, a - gw, H), pt(L + 0.02, a + gw, H), pt(L + 0.02, a, yr), out);
      g.col([1, 1, 1]).mat(2, 0);
      three(pt(te, a - gw - 0.25, ye), pt(te, a, yr + 0.1), pt(tm, a, yr + 0.1), UP); three(pt(te, a + gw + 0.25, ye), pt(te, a, yr + 0.1), pt(tm, a, yr + 0.1), UP);
      pane(L + 0.05, a, H + 0.35, H + 0.35 + Math.min(1, 0.3 * rise), 0.4);
    }
    if (B.stack && o.along !== 'hip') {
      // A SECOND STACK at the ridge's other end: its top by its own draw, from a hand over the ridge to just under
      // the first stack's top
      const up = Math.min(0.2 + 0.7 * B.tall, 0.95 * h.sy - 0.06), q = gable ? [0, cz < zr ? zTop - 1.6 : -hd + 1.6] : [cx > 0 ? -hw + 1.6 : hw - 1.6, zr], bx = gable ? 0.32 : 0.45, bz = gable ? 0.45 : 0.32;
      g.col(CHIMNEY).mat(0, 0).box(q[0] - bx, top - 0.7, q[1] - bz, q[0] + bx, top + up, q[1] + bz, 3, 1 | 2 | 8 | 16 | 32);
    }
    g.at();
    if (g.corners > first) spans.push([first, g.corners - first, B.inst]);
  }
  await W.ctx.yield();
  const geo = g.build(), n = geo.attributes.position.count, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
  await W.ctx.yield();
  for (const [first, count, inst] of spans) for (let i = first; i < first + count; i++) { iA.set(inst[0], i * 4); iB.set(inst[1], i * 4); iC.set(inst[2], i * 4); }
  geo.setAttribute('iA', new THREE.BufferAttribute(iA, 4)); geo.setAttribute('iB', new THREE.BufferAttribute(iB, 4)); geo.setAttribute('iC', new THREE.BufferAttribute(iC, 4));
  const mesh = new THREE.InstancedMesh(geo, W.townMat, 1); mesh.setMatrixAt(0, new THREE.Matrix4()); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; W.scene.add(mesh);
  W.roofs = { tris: g.tris, pieces: spans.length, held };
}

// ---------------------------------------------------------------- the town's standing shade, and the houses as instances
// The low sun (5 degrees) lays every roof's shadow far over its west-north-west neighbours. That shade stands (the
// sun never moves): a grid of roof heights is marched toward the sun once, and each house, each piece of ground
// and each thing set later learns the height below which it lies in its neighbours' shadow.
const SHADE = { x0: -560, z0: -560, n: 4, w: 290, h: 290 };
function makeShade() {
  const { x0, z0, n, w, h } = SHADE, H = new Float32Array(w * h).fill(-20);
  const sx = SUN[0] / Math.hypot(SUN[0], SUN[2]), sz = SUN[2] / Math.hypot(SUN[0], SUN[2]);
  const put = (x, z, y) => { const i = Math.floor((x - x0) / n), j = Math.floor((z - z0) / n); if (i >= 0 && j >= 0 && i < w && j < h && H[j * w + i] < y) H[j * w + i] = y; };
  return {
    // a block on the plan (centre, axis u, half sizes) with its mean top height
    block(x, z, ux, uz, a, b, y) { for (let s = -a; s <= a; s += 2.5) for (let t = -b; t <= b; t += 2.5) put(x + ux * s - uz * t, z + uz * s + ux * t, y); },
    // the height below which the place (x, z) lies in shadow; skip: metres to pass before looking (its own roof)
    at(x, z, skip = 7) {
      let best = -20;
      for (let d = skip; d < 800; d += d < 300 ? 4 : 9) {
        const i = Math.floor((x + sx * d - x0) / n), j = Math.floor((z + sz * d - z0) / n);
        if (i < 0 || j < 0 || i >= w || j >= h) break;
        const v = H[j * w + i] - d * TAN_SUN; if (v > best) best = v;
      }
      return best;
    },
  };
}
// the church's own masses in the shade grid (towers, nave, aisles, transept, apse), by the part's measures
function shadeChurch(S) {
  const C = CHURCH;
  for (const zc of [-13.5, 13.5]) S.block(7, zc, 1, 0, 7, 7, C.towerTop);
  S.block(59, 0, 1, 0, 45, C.halfNave, C.ridge - 3); S.block(59, 0, 1, 0, 45, C.halfAisle, C.eaves - 4); S.block(59, 0, 1, 0, 45, C.halfBreadth, 14);
  S.block(78, 0, 0, 1, 31, 7, C.ridge - 3); S.block(110, 0, 1, 0, 12, 14, 30); S.block(116, 0, 1, 0, 10, 20, 14);
}
const TILE = [0.21, 0.108, 0.08], SLATE = [0.11, 0.115, 0.13], PLASTER = [0.58, 0.53, 0.43], LEAD_C = [0.235, 0.265, 0.315];
const WALL_TINTS = [[1, 1, 1], [1, 0.9, 0.72], [0.82, 0.84, 0.88], [1, 0.84, 0.76], [0.74, 0.7, 0.64], [1, 0.8, 0.56], [0.92, 0.68, 0.58], [0.6, 0.6, 0.63]];
async function buildTown(W, houses, kinds, simple) {
  const S = W.shade, mat = makeSurface(W.shared, { town: true });
  W.townMat = mat;
  for (const h of houses) { if (h.gone) continue; const K = kinds[h.k]; S.block(h.cx, h.cz, Math.cos(h.yaw), -Math.sin(h.yaw), K.w * h.sw * 0.5, K.d * 0.5, h.y + (K.eave + (K.ridge - K.eave) * 0.55) * h.sy); }
  await W.ctx.yield();
  // the roofing of each district: the island, the northern bank, the southern bank (tile or slate, by the seed)
  const RR = W.RNG.roofing, slateShare = [RR.range(0.15, 0.5), RR.range(0.45, 0.85), RR.range(0.1, 0.4)];
  const groups = new Map();
  for (const h of houses) { if (h.gone) continue; const key = (h.near ? 0 : 100) + h.k; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(h); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  // (of every house's casements about one in nine is lit on a morning of middling density)
  const warm = clamp(0.11 * W.V.density, 0.07, 0.16);
  let tris = 0;
  for (const [key, list] of groups) {
    await W.ctx.yield();
    const K = (key >= 100 ? simple : kinds)[key % 100], mesh = new THREE.InstancedMesh(K.geo, mat, list.length);
    const iA = new Float32Array(list.length * 4), iB = new Float32Array(list.length * 4), iC = new Float32Array(list.length * 4);
    list.forEach((h, i) => {
      M.compose(P.set(h.x, h.y, h.z), Q.setFromAxisAngle(UP, h.yaw), Sc.set(h.sw, h.sy, 1)); mesh.setMatrixAt(i, M);
      const dist = h.cz < bankN(h.cx) ? 1 : h.cz > bankS(h.cx) ? 2 : 0, slate = h.tone < slateShare[dist], B = h.bank, rc0 = B && B.state === 3 ? LEAD_SHEET : slate ? SLATE : TILE, rv = 0.8 + 0.45 * ((h.hs * 7.13) % 1);
      // (a roof of the southern bank has its own hue besides, by its one number: its tiles the town's red-brown or
      // browner, never more purple; its slates browner or bluer)
      const hue = B ? (slate ? B.hue : 0.5 + 0.5 * B.hue) : 0;
      const rc = B && B.state !== 3 ? [rc0[0] * (1 + 0.22 * hue), rc0[1] * (1 + 0.06 * hue), rc0[2] * (1 - 0.2 * hue)] : rc0;
      const tint = WALL_TINTS[Math.floor(((h.hs * 13.7) % 1) * WALL_TINTS.length)], wv = 0.44 + 0.32 * ((h.tone * 5.3) % 1);
      iA.set([rc[0] * rv, rc[1] * rv, rc[2] * rv, S.at(h.cx, h.cz, h.rad + 3)], i * 4);
      iB.set([PLASTER[0] * tint[0] * wv, PLASTER[1] * tint[1] * wv, PLASTER[2] * tint[2] * wv, h.hs], i * 4);
      iC.set([(h.tone * 3.1) % 1, warm, B ? B.state : 0, B ? B.lamp : 0], i * 4);
      // (what stands on a roof of the southern bank is drawn by its house's own numbers: see buildRoofs)
      if (B) B.inst = [iA.slice(i * 4, i * 4 + 4), iB.slice(i * 4, i * 4 + 4), iC.slice(i * 4, i * 4 + 4)];
    });
    K.geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); K.geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); K.geo.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
    mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    W.scene.add(mesh); tris += K.tris * list.length;
  }
  // the ground learns its shade too
  const q = W.groundGeo.attributes.aQ, p = W.groundGeo.attributes.position;
  for (let i = 0; i < q.count; i++) { if (i % 2000 === 0) await W.ctx.yield(); q.setW(i, p.getY(i) < -1 ? 100 : S.at(p.getX(i), p.getZ(i), 2)); }
  q.needsUpdate = true;
  return tris;
}

// ---------------------------------------------------------------- the far town: rows of roofs out to the wall
// Beyond the part that is laid lane by lane the town goes on to its wall (1.3 km out) as street after street of
// plain gabled rows, on the same streets' spacing: a relief under the haze, in four pieces so that each is built in
// its own step and only those in sight are drawn.
const WALL_C = [-100, 0], WALL_R = 1300, FAR_SLICE = 5;
async function buildFarTown(W, sites) {
  const R = W.RNG.far, mat = W.groundMat, gs = [makeGB(), makeGB(), makeGB(), makeGB()];
  const slate = [R.range(0.45, 0.85), R.range(0.1, 0.4)];
  let n = 0, tris = 0;
  const row = (side, zs, x0, x1) => {
    let x = x0 + R.range(0, 20);
    while (x < x1) {
      const len = R.range(11, 32), hlen = len / 2, xc = x + len / 2, zj = R.range(-0.8, 0.8), z = zs(xc) + zj; x += len + (R() < 0.3 ? R.range(3, 9) : 0.6);
      const eave = R.range(7.5, 12.5), rise = R.range(4, 5.6), hd = R.range(4.6, 5.6), tone = R(), v = R.range(0.75, 1.2), sh = R.range(-1.5, 2.5), yaw = R.range(-0.07, 0.07);
      if (Math.hypot(xc + 20, z) < TOWN_R + 6 || Math.hypot(xc - WALL_C[0], z - WALL_C[1]) > WALL_R - 16) continue;
      if (z < 0 ? z > bankN(xc) - 14 && !onIsland(xc, z, 7) : z < bankS(xc) + 12 && !onIsland(xc, z, 7)) continue;
      let clear = true; for (const s of sites) if (Math.abs(s.x - xc) < hlen + 16 && Math.abs(s.z - z) < 13) { clear = false; break; }
      if (!clear) continue;
      const g = gs[(xc < -60 ? 0 : 1) + (z < 0 ? 0 : 2)], y0 = groundY(xc, z), hl = len / 2, top = eave + rise;
      const rc = tone < slate[z < 0 ? 0 : 1] ? SLATE : TILE, wc = WALL_TINTS[Math.floor(tone * 37) % WALL_TINTS.length];
      g.at(xc, y0, z, yaw);
      g.shade(y0 + eave + sh);
      g.col(rc, v).mat(2, 2);
      g.quad([-hl, eave, hd + 0.3], [hl, eave, hd + 0.3], [hl, top, 0], [-hl, top, 0]); g.quad([hl, eave, -hd - 0.3], [-hl, eave, -hd - 0.3], [-hl, top, 0], [hl, top, 0]);
      g.col([PLASTER[0] * wc[0], PLASTER[1] * wc[1], PLASTER[2] * wc[2]], 0.5 + 0.3 * tone).mat(7, 0);
      g.quad([-hl, -2, hd], [hl, -2, hd], [hl, eave, hd], [-hl, eave, hd]); g.quad([hl, -2, -hd], [-hl, -2, -hd], [-hl, eave, -hd], [hl, eave, -hd]);
      g.tri([-hl, eave, -hd], [-hl, eave, hd], [-hl, top, 0]); g.tri([hl, eave, hd], [hl, eave, -hd], [hl, top, 0]);
      g.shade(null);
      n++;
    }
  };
  for (const side of [-1, 1]) {
    const sh = side < 0 ? bankN : bankS, m = side < 0 ? 12 : 10;
    for (let k = 0; k < 32; k++) {
      const off = m + 28 + 42 * k, a = R.range(2, 6), l = R.range(70, 130), ph = R.range(0, 6.28), zs = (x) => sh(x) + side * off + a * Math.sin(x / l + ph);
      row(side, (x) => zs(x) - 7.3, -1420, 1210); row(side, (x) => zs(x) + 7.3, -1420, 1210);
      // (the build is handed back after every FAR_SLICE streets: a slice of about 20 ms; after every street through
      // the first of them, while the page's engine is still slow at the loop)
      if (k % FAR_SLICE === FAR_SLICE - 1 || (side < 0 && k < FAR_SLICE)) await W.ctx.yield();
    }
  }
  // the island's bow, west of the laid part
  for (let k = 0; k < 9; k++) { const off = 26 + 31 * k; row(0, (x) => Math.min(islandN(x) + off, islandS(x) - 11) - 7.3, -660, -420); row(0, (x) => Math.min(islandN(x) + off, islandS(x) - 11) + 7.3, -660, -420); }
  await W.ctx.yield();
  for (const g of gs) { if (!g.tris) continue; tris += g.tris; const mesh = new THREE.Mesh(g.build(), mat); mesh.receiveShadow = false; W.scene.add(mesh); await W.ctx.yield(); }
  return { n, tris };
}

// ---------------------------------------------------------------- the five bridges
// Each carries 12 m of roadway between two rows of houses over one arm of the river: three over the broad northern
// arm (the mill bridge on x -150, of timber on stone piers, with five wheels in the race of its three bays next
// to the island; one of stone on x 60; one of stone on x -470), two over the narrow southern arm (stone on x 12,
// timber on x -330). Their houses are set by the town's plan like every other street's.
const BRIDGES = [{ x: -150, arm: -1, timber: true, wheels: true }, { x: 60, arm: -1 }, { x: -470, arm: -1 }, { x: 12, arm: 1 }, { x: -330, arm: 1, timber: true }];
const DECK_Y = 4.2, DECK_HW = 14, PIER_T = 3.4;
const bridgeSpan = (b) => (b.arm < 0 ? [bankN(b.x), islandN(b.x)] : [islandS(b.x), bankS(b.x)]);
const onBridge = (x, z) => { for (const b of BRIDGES) { const [z0, z1] = bridgeSpan(b); if (Math.abs(x - b.x) < DECK_HW + 2.2 && z > z0 - 1 && z < z1 + 1) return true; } return false; };
const BRIDGE_STONE = [0.235, 0.215, 0.2];
async function buildBridges(W) {
  const g = makeGB(), wheels = [];
  for (const b of BRIDGES) {
    await W.ctx.yield();
    const [z0, z1] = bridgeSpan(b), span = z1 - z0, n = Math.max(2, Math.round(span / 17.5)), pitch = span / n, x = b.x;
    for (let i = 1; i < n; i++) W.piers.push([x, z0 + i * pitch, DECK_HW + 3, PIER_T / 2]);
    g.at(0, 0, 0, 0);
    if (!b.timber) {
      // stone: two faces with their arches, each arch's barrel reaching to the bridge's middle
      const holes = []; for (let i = 0; i < n; i++) holes.push({ c: pitch * (i + 0.5), w: (pitch - PIER_T) / 2, yb: -7.5, ys: -2.4, ya: 2.7, d: DECK_HW, n: 5, sill: false });
      g.col(BRIDGE_STONE).mat(0, 0);
      archWall(g, wallFrame([x + DECK_HW, 0, z1], [1, 0, 0]), 0, span, -7.5, DECK_Y, holes, 0.5);
      archWall(g, wallFrame([x - DECK_HW, 0, z0], [-1, 0, 0]), 0, span, -7.5, DECK_Y, holes, 0.5);
    } else {
      // timber: stone piers, five long beams, struts from every pier, a plank deck
      g.col(BRIDGE_STONE).mat(0, 0);
      // (a pier's top lies under the deck: no snow on it)
      for (let i = 0; i <= n; i++) { const zc = z0 + i * pitch, t = i === 0 || i === n ? 0.6 : PIER_T / 2; g.mat(0, 0).box(x - DECK_HW, -7.5, zc - t, x + DECK_HW, 1.6, zc + t, 15, 1 | 2 | 16 | 32); g.mat(0, 1).box(x - DECK_HW, -7.5, zc - t, x + DECK_HW, 1.6, zc + t, 15, 8); }
      g.col(TIMBER, 1.15).mat(5, 0.25);
      g.box(x - DECK_HW - 0.6, DECK_Y - 0.6, z0, x + DECK_HW + 0.6, DECK_Y, z1, 0, 1 | 2 | 4);
      for (let i = 1; i < n; i++) g.box(x - DECK_HW - 0.4, 1.6, z0 + i * pitch - 0.45, x + DECK_HW + 0.4, 2.3, z0 + i * pitch + 0.45, 0, 1 | 2 | 8 | 16 | 32);
      for (const k of [-1, -0.5, 0, 0.5, 1]) {
        const xb = x + k * (DECK_HW - 0.5);
        g.beam([xb, DECK_Y - 1.1, z0], [xb, DECK_Y - 1.1, z1], 0.6, 1.0, 3);
        for (let i = 0; i <= n; i++) {
          const zc = z0 + i * pitch;
          if (i < n) g.beam([xb, 1.9, zc + 0.3], [xb, DECK_Y - 1.3, zc + pitch * 0.36], 0.45, 0.45, 3);
          if (i > 0) g.beam([xb, 1.9, zc - 0.3], [xb, DECK_Y - 1.3, zc - pitch * 0.36], 0.45, 0.45, 3);
        }
      }
    }
    // cutwaters on both faces of every pier, pointed against and with the stream
    g.col(BRIDGE_STONE, 1.08).mat(0, 0);
    for (let i = 1; i < n; i++) for (const s of [-1, 1]) {
      const zc = z0 + i * pitch, xf = x + s * DECK_HW, xn = xf + s * 3.4, t = PIER_T / 2;
      // (its cap lies flat enough to carry the snow)
      const A = [xf, -7.5, zc - t], B = [xn, -7.5, zc], C = [xf, -7.5, zc + t], A1 = [xf, 0.4, zc - t], B1 = [xn, 0.4, zc], C1 = [xf, 0.4, zc + t], T = [xf, 1.3, zc];
      g.col(BRIDGE_STONE, 1.08).mat(0, 0);
      if (s > 0) { g.quad(B, A, A1, B1, 1); g.quad(C, B, B1, C1, 2); g.tri(B1, A1, T); g.tri(C1, B1, T); }
      else { g.quad(A, B, B1, A1, 2); g.quad(B, C, C1, B1, 1); g.tri(A1, B1, T); g.tri(B1, C1, T); }
      // a foot course a step proud of the cutwater, its ledge 1.2 m over the water (snow lies on it), and a plate
      // of ice frozen round the point
      const e = 0.42, yl = -3.8, Af = [xf, -7.5, zc - t - e], Bf = [xn + s * e * 2, -7.5, zc], Cf = [xf, -7.5, zc + t + e], Al = [xf, yl, zc - t - e], Bl = [xn + s * e * 2, yl, zc], Cl = [xf, yl, zc + t + e];
      const Ai = [xf, yl, zc - t], Bi = [xn, yl, zc], Ci = [xf, yl, zc + t], yi = WATER_Y + 0.06, Ax = [xf, yi, zc - t - 1.3], Bx = [xn + s * 2.2, yi, zc], Cx = [xf, yi, zc + t + 1.3];
      g.col(BRIDGE_STONE, 0.95);
      if (s > 0) { g.quad(Bf, Af, Al, Bl); g.quad(Cf, Bf, Bl, Cl); g.quad(Bl, Al, Ai, Bi); g.quad(Cl, Bl, Bi, Ci); }
      else { g.quad(Af, Bf, Bl, Al); g.quad(Bf, Cf, Cl, Bl); g.quad(Al, Bl, Bi, Ai); g.quad(Bl, Cl, Ci, Bi); }
      g.col([0.5, 0.58, 0.7], 1.1).mat(7, 0);
      if (s > 0) g.tri(Bx, Ax, Cx); else g.tri(Ax, Bx, Cx);
    }
    // the roadway, and a ramp down to the land at each end
    g.col(COBBLE).mat(4, 0.25);
    g.quad([x - DECK_HW, DECK_Y + 0.02, z1], [x + DECK_HW, DECK_Y + 0.02, z1], [x + DECK_HW, DECK_Y + 0.02, z0], [x - DECK_HW, DECK_Y + 0.02, z0]);
    for (const [ze, dir] of [[z0, -1], [z1, 1]]) {
      const yl = groundY(x, ze + dir * 24), zl = ze + dir * 22;
      if (dir > 0) g.quad([x - 4.5, yl, zl], [x + 4.5, yl, zl], [x + 4.5, DECK_Y, ze], [x - 4.5, DECK_Y, ze]); else g.quad([x - 4.5, DECK_Y, ze], [x + 4.5, DECK_Y, ze], [x + 4.5, yl, zl], [x - 4.5, yl, zl]);
      g.col(BRIDGE_STONE).mat(0, 0);
      for (const s of [-1, 1]) {
        const xs = x + s * 4.5, a = [xs, yl - 1, zl], bq = [xs, yl - 1, ze], c = [xs, DECK_Y, ze];
        if (s * dir > 0) g.tri(a, bq, c); else g.tri(a, c, bq);
      }
      g.box(x - DECK_HW, -7.5, Math.min(ze, ze + dir * 0.8), x + DECK_HW, DECK_Y, Math.max(ze, ze + dir * 0.8), 0, 1 | 2 | 16 | 32);
      g.col(COBBLE).mat(4, 0.25);
    }
    if (b.wheels) { const zs = [z1 - pitch * 0.5 - 3.4, z1 - pitch * 0.5 + 3.4, z1 - pitch * 1.5 - 3.4, z1 - pitch * 1.5 + 3.4, z1 - pitch * 2.5]; for (const z of zs) wheels.push([x - DECK_HW - 1.6, -3.3, z]); }
  }
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, 1); mesh.castShadow = true; mesh.receiveShadow = true; W.scene.add(mesh);   // of one instance: see the light's note in build()
  return { wheels, tris: g.tris };
}

// ---------------------------------------------------------------- the mill wheels and the river's mist
// Five undershot wheels, 5 m across, hang in the race under the mill bridge's downstream face, their axles along
// the bridge; each turns by the world's clock at its own even speed, its lower blades going with the stream.
function buildWheels(W, bridgeWheels, extra = []) {
  const places = bridgeWheels.concat(extra.map((e) => e.p));
  const g = makeGB(), r = 2.45, hb = 1.25;
  // (a wheel is to be known for one from down the stream, where it is seen edge on: two stout shrouds, a spoke to
  // every float, and twelve broad floats of pale wet board between them)
  g.col(TIMBER, 1.7).mat(5, 0);
  for (const z of [-hb, hb]) for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, b = a + Math.PI / 6;
    g.beam([Math.cos(a) * r, Math.sin(a) * r, z], [Math.cos(b) * r, Math.sin(b) * r, z], 0.3, 0.36, 3, false, [0, 0, 1]);
    g.beam([0, 0, z], [Math.cos(a) * r, Math.sin(a) * r, z], 0.2, 0.2, 3, false, [0, 0, 1]);
  }
  g.col(TIMBER, 2.6);
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) * Math.PI / 6, c = Math.cos(a), s = Math.sin(a), p0 = [c * (r - 0.95), s * (r - 0.95), -hb], p1 = [c * (r + 0.14), s * (r + 0.14), -hb], q0 = [p0[0], p0[1], hb], q1 = [p1[0], p1[1], hb];
    g.quad(p0, p1, q1, q0, 15); g.quad(p1, p0, q0, q1, 15);
  }
  g.col(TIMBER, 1.7);
  g.beam([0, 0, -hb - 0.4], [0, 0, hb + 0.4], 0.5, 0.5, 3, true);
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, places.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 1);
  // (the bridge's five draw from the bridges' stream as before; a wheel set later brings its own draws)
  const R = W.RNG.bridges, speed = bridgeWheels.map(() => -R.range(0.75, 1.05)).concat(extra.map((e) => e.speed)), phase = bridgeWheels.map(() => R.range(0, 6.28)).concat(extra.map((e) => e.phase));
  const turn = (time) => { places.forEach((p, i) => { M.compose(P.set(p[0], p[1], p[2]), Q.setFromAxisAngle(Z, phase[i] + speed[i] * time), ONE); mesh.setMatrixAt(i, M); }); mesh.instanceMatrix.needsUpdate = true; };
  turn(0); mesh.frustumCulled = false; W.scene.add(mesh);
  // the axle beams from pier to pier, and the white water each wheel leaves down the stream
  W.updates.push((dt, time) => turn(time));
  W.wheels = places.map((p) => new THREE.Vector3(p[0], p[2], hb + 0.5));
  // (the water's shader takes seven wheels' white water; a place not yet set lies far off)
  while (W.wheels.length < 7) W.wheels.push(new THREE.Vector3(1e6, 1e6, 1));
  return g.tris * places.length;
}
// Mist lies on the river only, between its banks, BY PLACE: level sheets from the water up to MIST_LOW metres over it
// (on a mist morning an unbroken sheet to 6.2 m), and everywhere under its ceiling by place (the water's baked map:
// MIST_CLEAR metres and more from the flown line; below the line on the river entry, aside elsewhere). ON A COMMON
// MORNING IT LIES ONLY WHERE THE AIR IS STILL: in narrow drifting ribbons within MIST_BANK metres of a waterline or
// a pier (along both banks and the island's shores, under the bridges) and nowhere else: none over the open stream
// farther than that from a waterline or a pier, the island's lee included. And there it is a VEIL: its MIST_SHEETS sheets
// together hide MIST_VEIL of the light behind them at the most (every sheet at its thickest, along the most
// slanting sight line the shader counts: its factor MIST_SLANT), so that water and ice show through it. Nothing
// of it reads the eye's distance or height. Grey-blue below the edge of the sunlight, a pale gold above it.
const MIST_BANK = 15, MIST_LOW = 1.2, MIST_SHEETS = 5, MIST_VEIL = 1 / 3, MIST_SLANT = 1.9;
// A SHEET'S GROUND IS MADE ONLY WHERE THE SHEET CAN DRAW (a rule of place, at the build, for every sheet on every
// morning; see cutSheet). The shader draws nothing of a sheet at or above its ceiling less MIST_FADE (its own law:
// 1. - smoothstep(cap - .7, cap - MIST_FADE, vW.y)) and reads the ceiling between four texels of the baked map. So a
// sheet's ground is told in the CELLS between the map's texel centres, and a cell all four of whose texels'
// ceilings AS BAKED (the very bytes the shader reads: buildWater's CEIL) lie at or under the sheet's height plus
// MIST_OFF is not made: nothing of that sheet could be drawn anywhere in it. All the rest of the rectangle is made.
// MIST_FADE is how far under its ceiling a sheet is gone (written into the shader from here); MIST_OFF is that
// less a thousandth (for the rounding of the shader's own sums and of the filter).
const MIST_FADE = 0.1, MIST_OFF = MIST_FADE - 0.001;
// (the highest byte of the baked ceiling under which a sheet at height y draws nothing)
const mistByte = (y) => Math.floor((y + MIST_OFF + 5) * 255 / 8);
// Every cell's highest ceiling as baked (a byte): cell (i, j) lies between the centres of texels i, i + 1 and j, j + 1.
// low: the cells that the highest sheet (at yTop) loses, column by column (i, j, i, j ...): a lower sheet loses none but these.
function mistCells(W, yTop) {
  const d = W.shoreTex.image.data, { TW, TH } = W.mistCeil, NX = TW - 1, hi = new Uint8Array(NX * (TH - 1)), low = [], lim = mistByte(yTop);
  for (let i = 0; i < NX; i++) for (let j = 0; j < TH - 1; j++) { const k = (j * TW + i) * 4 + 2, m = Math.max(d[k], d[k + 4], d[k + TW * 4], d[k + TW * 4 + 4]); hi[j * NX + i] = m; if (m <= lim) low.push(i, j); }
  return { hi, low };
}
// One sheet at height y with its void cells left out; false where it loses none. THE FORM OF THE CUT MESH (no cell
// of it is void, no vertex lies on another triangle's edge, every triangle faces up as an uncut sheet's two do):
// the columns of cells that hold a void cell fall into runs, each run a BOX (the bounds of its void cells). In a
// box every cell that is not void is made as it lies (two triangles). Round the box go RINGS, each of cells twice
// as broad as the last, as many as stand clear of the next box and inside the sheet: so the triangles are small
// only by the void and grow with their distance from it. The rest of the sheet is its whole rectangle made round
// the boxes' last rings (the kit's own triangulation of an outline with holes). Every cut sheet is made this way.
function cutSheet(W, { hi, low }, y, [x0, x1, z0, z1], pos, idx, lay, l) {
  const { TW, x0: mx, z0: mz, px, pz } = W.mistCeil, NX = TW - 1, lim = mistByte(y);
  const gx = (i) => mx + (i + 0.5) * px, gz = (j) => mz + (j + 0.5) * pz, isVoid = (i, j) => hi[j * NX + i] <= lim, boxes = [];
  for (let q = 0, cur = null; q < low.length; q += 2) {
    const i = low[q], j = low[q + 1]; if (!isVoid(i, j)) continue;
    if (!cur || i > cur.b) boxes.push(cur = { a: i, b: i + 1, c: j, d: j + 1 }); else { cur.b = i + 1; cur.c = Math.min(cur.c, j); cur.d = Math.max(cur.d, j + 1); }
  }
  if (!boxes.length) return false;
  const base = pos.length / 3, at = new Map(), X = [], Z = [];
  const v = (x, z) => { const k = x + ':' + z; let id = at.get(k); if (id === undefined) { id = X.length; at.set(k, id); X.push(x); Z.push(z); pos.push(x, y, z); lay.push(l); } return id; };
  const tri = (p, q, r) => { const up = (Z[q] - Z[p]) * (X[r] - X[p]) - (X[q] - X[p]) * (Z[r] - Z[p]) > 0; idx.push(base + p, base + (up ? q : r), base + (up ? r : q)); };
  // two rows of points that lie side by side, each told from end to end the same way: the strip between them
  const stitch = (P, Q) => { const m = P.length - 1, n = Q.length - 1; for (let i = 0, j = 0; i < m || j < n;) { if (j === n || (i < m && (i + 0.5) * n < (j + 0.5) * m)) { tri(P[i], P[i + 1], Q[j]); i++; } else { tri(Q[j], Q[j + 1], P[i]); j++; } } };
  // a box's four sides as rows of points a step s apart: its low z side, its high z side, its low x side, its high x side
  const row = (c0, c1, s, f) => { const r = []; for (let c = c0; c <= c1; c += s) r.push(f(c)); return r; };
  const sides = (B, s) => [row(B.a, B.b, s, (i) => v(gx(i), gz(B.c))), row(B.a, B.b, s, (i) => v(gx(i), gz(B.d))), row(B.c, B.d, s, (j) => v(gx(B.a), gz(j))), row(B.c, B.d, s, (j) => v(gx(B.b), gz(j)))];
  const corners = [v(x0, z0), v(x1, z0), v(x1, z1), v(x0, z1)], holes = [];
  boxes.forEach((B, k) => {
    const xl = k ? (gx(boxes[k - 1].b) + gx(B.a)) / 2 : x0, xr = k < boxes.length - 1 ? (gx(B.b) + gx(boxes[k + 1].a)) / 2 : x1;
    for (let j = B.c; j < B.d; j++) for (let i = B.a; i < B.b; i++) {
      if (isVoid(i, j)) continue;
      const a = base + v(gx(i), gz(j)), b = base + v(gx(i + 1), gz(j)), c = base + v(gx(i + 1), gz(j + 1)), e = base + v(gx(i), gz(j + 1));
      idx.push(a, c, b, a, e, c);
    }
    let R = sides(B, 1), In = B;
    for (let s = 2; ; s *= 2) {
      const N = { a: s * (Math.floor(In.a / s) - 1), b: s * (Math.ceil(In.b / s) + 1), c: s * (Math.floor(In.c / s) - 1), d: s * (Math.ceil(In.d / s) + 1) };
      if (!(gx(N.a) > xl && gx(N.b) < xr && gz(N.c) > z0 && gz(N.d) < z1)) break;
      const T = sides(N, s); for (let q = 0; q < 4; q++) stitch(R[q], T[q]); R = T; In = N;
    }
    // (the last ring's outline, told once round)
    holes.push([...R[0], ...R[3].slice(1), ...R[1].slice(0, -1).reverse(), ...R[2].slice(1, -1).reverse()]);
  });
  const P = (r) => r.map((id) => new THREE.Vector2(X[id], Z[id])), ids = corners.concat(...holes);
  for (const [p, q, r] of THREE.ShapeUtils.triangulateShape(P(corners), holes.map(P))) tri(ids[p], ids[q], ids[r]);
  return true;
}
async function buildMist(W) {
  const S = W.shared, thick = W.V.temper === 'mist' ? 1 : 0, n = thick ? 11 : MIST_SHEETS, top = thick ? W.V.mistTop : WATER_Y + MIST_LOW, g = new THREE.BufferGeometry();
  // a common morning's sheet at its thickest, before the slant: MIST_SHEETS of them hide MIST_VEIL at MIST_SLANT
  const veil = (1 - Math.pow(1 - MIST_VEIL, 1 / MIST_SHEETS)) / MIST_SLANT;
  const pos = [], lay = [], idx = [], x0 = -1100, x1 = 1500, z0 = SHORE_RECT[1], z1 = SHORE_RECT[1] + SHORE_RECT[3], cells = mistCells(W, top);
  for (let i = 0; i < n; i++) {
    await W.ctx.yield();
    const y = lerp(WATER_Y + 0.4, top, i / (n - 1)), b = pos.length / 3;
    if (cutSheet(W, cells, y, [x0, x1, z0, z1], pos, idx, lay, i / (n - 1))) continue;
    // (a sheet that loses no cell: the whole rectangle in two triangles)
    pos.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1); for (let k = 0; k < 4; k++) lay.push(i / (n - 1));
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aLay', new THREE.Float32BufferAttribute(lay, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uEdge: S.uEdge, uTime: S.uTime, uFogDen: S.uFogDen, uSunDir: S.uSunDir, uFogCol: S.uFogCol, uFogWarm: S.uFogWarm, tShore: { value: W.shoreTex },
      uRect: { value: new THREE.Vector4(SHORE_RECT[0], SHORE_RECT[1], 1 / SHORE_RECT[2], 1 / SHORE_RECT[3]) }, uThick: { value: thick },
      uCold: { value: new THREE.Color().setRGB(0.3, 0.4, 0.64) }, uGold: { value: new THREE.Color().setRGB(1.05, 0.78, 0.5) }, uSeed: { value: W.RNG.mist.range(0, 50) },
    },
    vertexShader: /* glsl */`attribute float aLay; varying vec3 vW; varying float vLay;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vLay = aLay; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: NOISE_GLSL + /* glsl */`
uniform sampler2D tShore; uniform vec4 uRect; uniform float uEdge, uTime, uFogDen, uThick, uSeed; uniform vec3 uSunDir, uFogCol, uFogWarm, uCold, uGold;
varying vec3 vW; varying float vLay;
void main() {
  vec2 uv = (vW.xz - uRect.xy) * uRect.zw; vec4 sh = texture2D(tShore, clamp(uv, 0., 1.));
  float sd = sh.r * 40., cap = mix(sh.b * 8. - 5., 3., step(.5, max(abs(uv.x - .5), abs(uv.y - .5))));
  float mask = smoothstep(mix(3., .5, uThick), mix(16., 5., uThick), sd);
  // long ribbons lying along the stream and drifting slowly down it; each sheet a little shifted and a little
  // smaller than the one under it, so that a ribbon is a low mound and no flat card
  vec2 q = vW.xz * vec2(mix(.0125, .0065, uThick), .034) + vec2(uTime * .012 + uSeed + vLay * .12, uSeed * 1.7 + vLay * .2 + sin(vW.x * .004 + uSeed) * .7);
  // (only a ribbon's long lie follows the stream: its banks and its grain are as broad as they are long, so that
  // from above it is a chain of soft banks and never a drawn-out streak)
  vec2 qr = vW.xz * .034 + vec2(uTime * .012 * 5.2 + uSeed * 3. + vLay * .3, uSeed + vLay * .2);
  float n = vn(q) * .45 + vn(q * 2.3 + 7.) * .15 + vn(qr * .8 + 3.) * .24 + vn(qr * 2.6 + vec2(uTime * .03, 3.)) * .16;
  float d = smoothstep(mix(.47, .24, uThick) + vLay * mix(.16, .26, uThick), mix(.86, .7, uThick), n);
  if (uThick < .5) {
    // a common morning. Ribbons: within MIST_BANK metres of a waterline or a pier, and nowhere else
    float still = 1. - smoothstep(${(MIST_BANK - 7).toFixed(1)}, ${MIST_BANK.toFixed(1)}, sd);
    d *= still;
    // (and it stands off every strand, pier and wall: it begins 1.5 m off and is whole at 5 m)
    mask = smoothstep(1.5, 5., sd);
  }
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-4);
  // under its ceiling by place only; a level sheet counts thicker along a slanting sight line and thinner along
  // a steep one, as any level layer does (the slant of the line of sight alone: no height, no distance)
  float a = d * mask * (1. - smoothstep(cap - .7, cap - ${MIST_FADE.toFixed(1)}, vW.y)) * mix(${veil.toFixed(4)}, .13, uThick) * clamp(.3 / max(abs(V.y), .05), .5, mix(${MIST_SLANT.toFixed(1)}, 2.4, uThick));
  vec3 sunH = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-5, 0., 0.));
  float toSun = pow(clamp(dot(V, sunH), 0., 1.), 3.);
  // paler on its mounds and higher sheets, deeper in its hollows
  vec3 col = mix(uCold, uGold, smoothstep(uEdge - 1.25, uEdge + 1.25, vW.y)) * (.62 + .5 * n + .2 * vLay);
  col = mix(col, uFogWarm, toSun * .5);
  float fog = 1. - exp(-uFogDen * uFogDen * dist * dist);
  gl_FragColor = vec4(mix(col, mix(uFogCol, uFogWarm, toSun), fog), clamp(a, 0., 1.));
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; W.scene.add(mesh);
}

// ---------------------------------------------------------------- smoke: soft trails that drift down the wind
// One plume a chimney. WHICH CHIMNEYS SMOKE is the seed's as it always was (the smoke's own stream and the upright
// of SMOKE_SEED_H by which it chooses them: see buildSmoke). WHAT EACH PLUME IS comes from its own seven draws
// of the stream 'trails', taken for every chosen chimney before anything is tried: its rise, its trail's length,
// its breadth, its bend, its waver, its strength and its pace, so that no two neighbours are of one shape.
// ONE WIND BLOWS OVER THE WHOLE TOWN (WIND: a way on the plan, a fact of the place, the same from every side).
// A PLUME RISES A LITTLE FROM ITS POT (TRAIL_RISE: 3 to 12 m; a barge's stove pipe's PIPE_RISE) AND ITS TOP IS
// CARRIED DOWN THE WIND AS A TRAIL (TRAIL_LEN: 6 to 28 m to the lee, by the square of its draw, so that the
// short trails are the many and the long ones the few, and never less than TRAIL_LEAST of its own rise, so that
// none stands as an upright stroke; a stove pipe's 6 to PIPE_LEN metres). It climbs fast over the pot
// and levels out (by the power SMOKE_RISE) while it goes to the lee BY ITS OWN BEND (TRAIL_BEND: the power of its
// way's share; by the least it lies over from the pot and runs out slanting, by the greatest it stands up first and
// then runs level). The wind comes in slow gusts by the world's clock: one that crosses the town in a wave (17 s
// long) and each plume's own (4.8 s), which lengthen and shorten its trail by up to SMOKE_GUST of it; the plume
// curls a little about its way, and it WAVERS to either side of it BY ITS OWN MEASURE (TRAIL_WAVER metres) on two
// slow periods (4.8 and 6 s), the waver running down the trail with the smoke.
// ITS FORM IS A DRIFT'S, never a flame's, a rope's or a stroke's: a hand's breadth and hardly seen over the pot,
// BROADENING ALL THE WAY (to its own breadth at its end: TRAIL_BROAD of its rise and trail together, TRAIL_WIDE
// metres at the least and at the most), whole to nearly half its way (0.45 of it) and THINNING FROM THERE to
// nothing at its end, and to nothing at both its rims all along: its broadest place is its faintest, and there it
// frays into soft puffs (SMOKE_FRAY; two sizes, about 4 and 2 m), which run down it AT THE PLUME'S OWN PACE
// (TRAIL_PACE metres a second), a little thicker and lighter than the hollows between them.
// NO PLUME IS THICK. By its strength's draw about a third of the plumes are plainly seen, the others faint or
// hardly there (TRAIL_DEAL: where the one draw parts the three kinds; TRAIL_STRONG: the three kinds' strengths; a
// stronger plume also keeps its smoke farther down its trail: the thinning goes by the power SMOKE_FADE less the
// strength): the thickest place of the strongest plume, a puff's middle on its axis in the first half of its way, lets
// more than half of what stands behind it through (0.42 by 1.15: 0.48), and every other place of every plume more.
// NO BAND, a law of place tried after every draw is taken (buildSmoke): where the trails of three plumes or more
// would lie side by side, their pots within BAND metres of one another across the wind and their trails beside
// one another for BAND_SIDE metres and more along it, the longest of them is KEPT SHORT, and so on from the longest
// trail of the town down, until no three long trails lie so: a plume kept short keeps its rise, its trail is
// TRAIL_SHORT metres (its rise where that is more) and its breadth smaller by as much as its whole way is shorter:
// roofs stand between the trails.
// THE STRIP THAT CARRIES A PLUME IS AS NARROW AS ITS PLUME: at every place of its way the plume's own half breadth
// there at its fullest and SMOKE_EDGE metres to either side, never broader than the plume's end (the law of place
// counts the strip's breadth with the plume's).
// WHERE A PLUME IS FINER THAN THE PICTURE'S GRAIN IT IS DRAWN AS BROAD AS THE GRAIN AND SO MUCH THE FAINTER (one
// grain at the most, a pure filter that keeps the plume's light): the same smoke from its pot up at every distance.
// ITS LIGHT IS THE WORLD'S AT ITS HEIGHT: under the edge of the sunlight it is SMOKE IN THE SHADE, a soft warm grey
// (SMOKE_SHADE: a little lighter than the snow in shade beside it and of another hue, far lighter than slate and
// wall, so that it parts from the roofs behind it) and only what rises over the edge is lit, a pale warm white;
// the world's one haze lies over it as over the roofs beside it (the surface's own laws, by the same measures).
// It is never lit by anything but the sky and the sun.
// BY PLACE (the law of the whole plume as it is drawn, trail and all, gusting, curling and wavering at its widest:
// see plumeBody and the end of buildSmoke): no part of a plume comes within SMOKE_CLEAR metres of the flown line,
// none within 90 m of the church's walls, none stands BEFORE THE CHURCH (see makeSmokeLaw: the law of place calls
// a plume a thread, as before), none comes within MARK_SMOKE metres of a landmark's tower or needle; and as before
// no pot stands within 90 m of the church's walls or on the stone bridge on x 60. A PLUME WHOSE TRAIL WOULD BREAK
// THE LAW KEEPS ITS RISE AND LOSES ITS TRAIL: it stands over its pot and only leans down the wind (by TRAIL_STUB of
// its rise; no broader than STUB_BROAD of its rise, 0.6, and never narrower than the narrowest plume, TRAIL_WIDE[0],
// 3.5 m: so a stub that rises less than 5.83 m is 3.5 m broad and can be broader than its rise; never plainly
// seen: STUB_STRONG at the most); one that would break the law even so is NOT DRAWN: its chimney is quiet, and no
// other chimney smokes for it.
// (SMOKE_SEED_H and SMOKE_REACH: the upright and its reach by which the seed chooses its chimneys, unchanged;
// SMOKE_TOP: the strip that carries a plume is longer than the plume by 1 / SMOKE_TOP; SMOKE_WHOLE: the rise
// from which a plume's curl is whole, a lower plume's smaller by its rise's share)
const SMOKE_REACH = 9, SMOKE_TOP = 0.92, SMOKE_SEED_H = [10, 17], PIPE_H = [5, 8], SMOKE_WHOLE = 14;
const WIND = [-0.9701, 0.2426], SMOKE_RISE = 1.8, SMOKE_GUST = [0.06, 0.08], SMOKE_SWELL = 0.8, SMOKE_CLEAR = 22, SMOKE_CUT = 48, SMOKE_FADE = 1.2, SMOKE_FRAY = 0.55, SMOKE_EDGE = 0.45;
// (a plume's seven measures, each by its own draw; a stove pipe's rise and its longest trail)
const TRAIL_RISE = [3, 12], TRAIL_LEN = [6, 28], TRAIL_LEAST = 1.3, TRAIL_BROAD = [0.32, 0.56], TRAIL_WIDE = [3.5, 13], TRAIL_BEND = [1.1, 1.9], TRAIL_WAVER = [0.5, 2.4], TRAIL_PACE = [1, 2.4];
const TRAIL_STRONG = [[0.34, 0.42], [0.18, 0.28], [0.07, 0.14]], TRAIL_DEAL = [0.34, 0.7], PIPE_RISE = [3, 5.5], PIPE_LEN = 12;
// (a plume that loses its trail; the law of no band; a trail kept short)
const TRAIL_STUB = 0.35, STUB_BROAD = 0.6, STUB_STRONG = 0.2, BAND = 15, BAND_SIDE = 6, TRAIL_SHORT = 6;
// how the puffs read within a plume: how much thicker a puff's smoke is than a hollow's (about the plume's own
// mean), and how much lighter its tone
const PUFF_DEEP = 0.3, PUFF_TONE = 0.5;
// a plume in the shade (a warm grey: the snow in the shade beside it is about 0.24, 0.34, 0.68, a shaded wall or
// slate 0.05 to 0.2), and in the sun
const SMOKE_SHADE = [0.47, 0.43, 0.42], SMOKE_SUN = [1, 0.9, 0.74];
// how many chimneys are tried before the build is handed back
const SMOKE_SLICE = 240;
// THE WHOLE BODY OF ONE PLUME AT ITS WIDEST, for the law of place (the shaders' law, mirrored): SMOKE_CUT + 1 balls
// along its way, [metres to the lee of the pot, metres over the pot, radius, the half breadth's share of the
// radius]. A ball's middle is on the way the plume takes in the mean wind (by its own bend); its radius holds the
// plume's half breadth at its fullest (nine hundredths over its measure), its curl and its own waver aslant, the
// gusts' longest and shortest trail, and half the way to the next ball
function plumeBody(top, broad, trail, bend, waver) {
  const k = Math.min(top / SMOKE_WHOLE, 1), G = SMOKE_GUST[0] + SMOKE_GUST[1], out = [];
  const at = (i) => {
    const s = i / SMOKE_CUT, h = s * SMOKE_TOP, lee = trail * Math.pow(s, bend), w = Math.min(Math.max(h / 0.25, 0), 1);
    const own = 0.05 + (broad * 0.5 - 0.05) * Math.pow(s, SMOKE_SWELL), half = Math.max(own * 1.09 * 1.06, Math.min(own * 1.16 + SMOKE_EDGE, broad * 0.545));
    return [lee, top * (1 - Math.pow(1 - s, SMOKE_RISE)), half + Math.SQRT2 * (h * (0.3 + h) * 0.9 * k + waver * w * w * (3 - 2 * w)) + G * lee, half];
  };
  for (let i = 0; i <= SMOKE_CUT; i++) out.push(at(i));
  for (let i = 0; i <= SMOKE_CUT; i++) {
    const a = out[Math.max(i - 1, 0)], b = out[i], c = out[Math.min(i + 1, SMOKE_CUT)];
    b[4] = Math.max(b[2], c[2]) + 0.5 * Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), Math.hypot(c[0] - b[0], c[1] - b[1]));
  }
  for (const b of out) b[2] = b[4];
  return out;
}
// the church's outline on the plan (the front's buttress strips, both transept fronts, the piers round the east end)
const CHURCH_HULL = [[-2.5, -24.5], [-2.5, 24.5], [68, 33], [90, 33], [123, 19.5], [131, 0], [123, -19.5], [90, -33], [68, -33]];
// the church's masses as a height over the plan (towers, the platform between them, the high roof, the aisles, the
// transept, the round east end): what stands between an eye and a thread behind the church
const churchTop = (x, z) => {
  const C = CHURCH, az = Math.abs(z);
  if (x < 0 || x > C.length) return 0;
  if (x <= C.towerSide) return az <= 20.5 ? (az >= C.gapHalf ? C.towerTop : C.platform) : az <= C.halfBreadth ? 13 : 0;
  const r = x <= C.apseX ? az : Math.hypot(x - C.apseX, z);
  let h = r <= 7.6 ? (x <= C.apseX ? C.ridge - r * 11 / 7.6 : C.eaves) : r <= C.halfAisle ? 21 : r <= C.halfBreadth ? 11.6 : 0;
  if (x >= C.transeptW && x <= C.transeptE && az <= C.southFace) h = Math.max(h, C.ridge - Math.abs(x - 78) * 11 / 7.6);
  return h;
};
// NO SMOKE BEFORE THE CHURCH, a law of place: from every eye on the line between the entry and the square's corner
// (A to G) and from where the line comes round over the southern bank to the door (S to Y), every 2 m, no thread's
// body lies within the bearing of the church's outline, unless it stands behind the church with its top under the
// sight line over the church's own masses. refuse(x, z, yTop) says whether a thread there would break the law.
function makeSmokeLaw(W) {
  const P = new THREE.Vector3(), eyes = [], H = CHURCH_HULL, n = H.length;
  const mG = W.metreOf(...ROUTE[6]), mS = W.metreOf(...ROUTE[18]);
  for (let m = 0; m <= W.LEN; m += 2) {
    if (m > mG && m < mS) continue;
    W.path.posAtDist(m, P);
    const cx = 64 - P.x, cz = -P.z; let a0 = 9, a1 = -9, near = 1e9;
    for (const [hx, hz] of H) { const vx = hx - P.x, vz = hz - P.z, a = Math.atan2(cx * vz - cz * vx, cx * vx + cz * vz); if (a < a0) a0 = a; if (a > a1) a1 = a; near = Math.min(near, Math.hypot(vx, vz)); }
    // an eye at the church's own wall (the last metres into the door) sees no roof, steeple or tower over it
    if (near < 12) continue;
    // (the two bearings that bound the church's outline from this eye, as ways on the plan: a thread that stands
    // farther than its own reach outside either of them is outside the outline's bearing; said only where the
    // outline lies to both sides of the eye's way to the church's middle and takes less than half the round)
    const cl = Math.hypot(cx, cz), ux = cx / cl, uz = cz / cl, plain = a0 <= 0 && a1 >= 0 && a1 - a0 < 3.1;
    eyes.push([P.x, P.y, P.z, cx, cz, a0, a1, plain, ux * Math.cos(a0) - uz * Math.sin(a0), ux * Math.sin(a0) + uz * Math.cos(a0), ux * Math.cos(a1) - uz * Math.sin(a1), ux * Math.sin(a1) + uz * Math.cos(a1)]);
  }
  // one sight line in the plan from the eye (ex, ey, ez) to the point (qx, qz) with the thread's top there
  const breaks = (ex, ey, ez, qx, qz, yTop) => {
    const dx = qx - ex, dz = qz - ez; let t0 = 0, t1 = 1e9;
    for (let i = 0; i < n; i++) {
      const a = H[i], b = H[(i + 1) % n], bx = b[0] - a[0], bz = b[1] - a[1];
      const f0 = bx * (ez - a[1]) - bz * (ex - a[0]), fd = bx * dz - bz * dx;
      if (Math.abs(fd) < 1e-9) { if (f0 > 0) return false; continue; }
      const t = -f0 / fd; if (fd > 0) t1 = Math.min(t1, t); else t0 = Math.max(t0, t);
      if (t0 > t1) return false;
    }
    // the sight line crosses the church's outline: a thread before its far side stands before the church
    if (t1 >= 1) return true;
    const L = Math.hypot(dx, dz), step = 2 / L;
    for (let t = t0; t <= t1; t += step) if (churchTop(ex + dx * t, ez + dz * t) >= ey + (yTop - ey) * t) return false;
    return true;
  };
  return {
    eyes: eyes.length,
    refuse(x, z, yTop, reach = SMOKE_REACH) {
      for (let i = 0; i < eyes.length; i++) {
        const e = eyes[i], ex = e[0], ey = e[1], ez = e[2], cx = e[3], cz = e[4], a0 = e[5], a1 = e[6], vx = x - ex, vz = z - ez;
        if (e[7] && (e[9] * vx - e[8] * vz > reach + 1e-6 || e[10] * vz - e[11] * vx > reach + 1e-6)) continue;
        const d = Math.hypot(vx, vz), a = Math.atan2(cx * vz - cz * vx, cx * vx + cz * vz), w = Math.asin(Math.min(1, reach / Math.max(d, 1e-3)));
        if (a + w < a0 || a - w > a1) continue;
        const px = -vz / d * reach, pz = vx / d * reach;
        for (const k of [-1, -0.5, 0, 0.5, 1]) if (breaks(ex, ey, ez, x + px * k, z + pz * k, yTop)) return true;
      }
      return false;
    },
  };
}
async function buildSmoke(W, houses, kinds, pipes = []) {
  const R = W.RNG.smoke, want = Math.round(clamp(600 * W.V.density, 500, 700) * Math.max(W.detail, 0.7)), P = new THREE.Vector3(), law = makeSmokeLaw(W);
  // (the line's places every 2 m, by squares of SMOKE_CELL metres on the plan: a thread asks the squares within its 22 m)
  const RX = [], RY = [], RZ = [], SMOKE_CELL = 32, cells = new Map(), key = (i, j) => i * 4096 + j;
  for (let m = 0; m <= W.LEN; m += 2) { W.path.posAtDist(m, P); const k = key(Math.floor(P.x / SMOKE_CELL), Math.floor(P.z / SMOKE_CELL)); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(RX.length); RX.push(P.x); RY.push(P.y); RZ.push(P.z); }
  await W.ctx.yield();
  const order = houses.map((h, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
  // one thread's place by every rule of smoke: the church's 90 m, the stone bridge, the line's 22 m, the law above
  const allowed = (x, y, z, H) => {
    const dC = Math.hypot(Math.max(-x, x - CHURCH.length, 0), Math.max(Math.abs(z) - CHURCH.southFace, 0));
    if (dC < 90 || (Math.abs(x - 60) < 24 && z < islandN(60) + 2 && z > bankN(60) - 2)) return false;
    for (let i = Math.floor((x - 22) / SMOKE_CELL), i1 = Math.floor((x + 22) / SMOKE_CELL), j0 = Math.floor((z - 22) / SMOKE_CELL), j1 = Math.floor((z + 22) / SMOKE_CELL); i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const c = cells.get(key(i, j)); if (!c) continue;
      for (let q = 0; q < c.length; q++) { const k = c[q], dy = Math.max(y - RY[k], RY[k] - y - H, 0); if (Math.hypot(RX[k] - x, RZ[k] - z, dy) < 22) return false; }
    }
    return !law.refuse(x, z, y + H * SMOKE_TOP);
  };
  // the barges' stove pipes are threads among the 500 to 700: the chimneys take what the pipes leave
  const piped = [];
  for (const p of pipes) if (allowed(p[0], p[1], p[2], p[3]) && !MARK_TOWERS.some((t) => Math.hypot(t[0] - p[0], t[1] - p[2]) < MARK_SMOKE)) piped.push(p);
  await W.ctx.yield();
  // (the build is handed back after every SMOKE_SLICE chimneys tried: a slice of about 20 ms; a sixteenth of that
  // through the first of them)
  const chosen = []; let tried = 0;
  for (const i of order) {
    if (chosen.length >= want - piped.length) break;
    const h = houses[i], K = kinds[h.k], c = Math.cos(h.yaw), s = Math.sin(h.yaw), lx = K.chim[0] * h.sw, lz = K.chim[2];
    const x = h.x + lx * c + lz * s, y = h.y + K.chim[1] * h.sy, z = h.z - lx * s + lz * c, ph = R.range(0, 6.28), H = R.range(SMOKE_SEED_H[0], SMOKE_SEED_H[1]) / SMOKE_TOP;
    if (++tried % (tried < SMOKE_SLICE ? SMOKE_SLICE / 16 : SMOKE_SLICE) === 0) await W.ctx.yield();
    if (!allowed(x, y, z, H)) continue;
    // (a house that is gone has no chimney, and no plume stands within MARK_SMOKE metres of a landmark's tower or
    // needle: such a chimney takes its draws like any other, so that every other plume is the one it would be, and
    // the seed's next chimneys make up the count)
    if (h.gone || MARK_TOWERS.some((t) => Math.hypot(t[0] - x, t[1] - z) < MARK_SMOKE)) continue;
    chosen.push([x, y, z, ph, 0]);
  }
  // the stove pipes of the barges: a short small plume each, by the same rules of place
  for (const [x, y, z, H, ph] of piped) chosen.push([x, y, z, ph, H * SMOKE_TOP]);
  await W.ctx.yield();
  // THE LAW OF PLACE ON A WHOLE PLUME (its body at its widest: see plumeBody): no part of it within SMOKE_CLEAR
  // metres of the flown line (the line's places every 2 m joined by straight runs), none within MARK_SMOKE metres of
  // a landmark's tower or needle on the plan, none within 90 m of the church's walls, none before the church (the
  // body as one upright round that holds it)
  const lawful = (x, y, z, top, broad, trail, bend, waver) => {
    const body = plumeBody(top, broad, trail, bend, waver); let lo = 1e9, hi = -1e9, yTop = 0;
    for (const b of body) {
      lo = Math.min(lo, b[0] - b[2]); hi = Math.max(hi, b[0] + b[2]); yTop = Math.max(yTop, b[1] + b[3]);
      const px = x + WIND[0] * b[0], pz = z + WIND[1] * b[0];
      if (Math.hypot(Math.max(-px, px - CHURCH.length, 0), Math.max(Math.abs(pz) - CHURCH.southFace, 0)) < 90 + b[2]) return false;
    }
    for (const t of MARK_TOWERS) for (const b of body) if (Math.hypot(x + WIND[0] * b[0] - t[0], z + WIND[1] * b[0] - t[1]) < MARK_SMOKE + b[2]) return false;
    const mx = x + WIND[0] * (lo + hi) / 2, mz = z + WIND[1] * (lo + hi) / 2, reach = (hi - lo) / 2, far = reach + SMOKE_CLEAR + 2;
    for (let i = Math.floor((mx - far) / SMOKE_CELL), i1 = Math.floor((mx + far) / SMOKE_CELL), j0 = Math.floor((mz - far) / SMOKE_CELL), j1 = Math.floor((mz + far) / SMOKE_CELL); i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const c = cells.get(key(i, j)); if (!c) continue;
      for (let q = 0; q < c.length; q++) {
        const k = c[q]; if (k + 1 >= RX.length || Math.hypot(RX[k] - mx, RZ[k] - mz) > far) continue;
        const ax = RX[k], ay = RY[k], az = RZ[k], ux = RX[k + 1] - ax, uy = RY[k + 1] - ay, uz = RZ[k + 1] - az, uu = ux * ux + uy * uy + uz * uz;
        for (const b of body) {
          const px = x + WIND[0] * b[0] - ax, py = y + b[1] - ay, pz = z + WIND[1] * b[0] - az, f = clamp((px * ux + py * uy + pz * uz) / uu, 0, 1);
          if (Math.hypot(px - ux * f, py - uy * f, pz - uz * f) < SMOKE_CLEAR + b[2]) return false;
        }
      }
    }
    return !law.refuse(mx, mz, y + yTop, reach);
  };
  // WHAT EACH PLUME IS: its own seven draws of the stream 'trails', in the order in which the seed chose the
  // chimneys, ALL TAKEN BEFORE ANYTHING IS TRIED (its rise, its trail, its breadth, its bend, its waver, its
  // strength, its pace: a plume that is not drawn takes its draws like any other). BY ITS STRENGTH'S DRAW about
  // a third of the plumes are plainly seen, the others faint or hardly there (TRAIL_DEAL)
  const TR = W.RNG.trails, plumes = [];
  for (const [x, y, z, ph, pipe] of chosen) {
    const fh = TR(), ft = TR(), fb = TR(), fq = TR(), fw = TR(), fs = TR(), fp = TR();
    const kind = fs < TRAIL_DEAL[0] ? 0 : fs < TRAIL_DEAL[1] ? 1 : 2, f = kind === 0 ? fs / TRAIL_DEAL[0] : kind === 1 ? (fs - TRAIL_DEAL[0]) / (TRAIL_DEAL[1] - TRAIL_DEAL[0]) : (fs - TRAIL_DEAL[1]) / (1 - TRAIL_DEAL[1]);
    const top = pipe ? lerp(PIPE_RISE[0], PIPE_RISE[1], fh) : lerp(TRAIL_RISE[0], TRAIL_RISE[1], fh), trail = lerp(Math.max(TRAIL_LEN[0], TRAIL_LEAST * top), pipe ? PIPE_LEN : TRAIL_LEN[1], ft * ft);
    plumes.push({ x, y, z, ph, top, trail, broad: clamp((top + trail) * lerp(TRAIL_BROAD[0], TRAIL_BROAD[1], fb), TRAIL_WIDE[0], TRAIL_WIDE[1]), bend: lerp(TRAIL_BEND[0], TRAIL_BEND[1], fq),
      waver: lerp(TRAIL_WAVER[0], TRAIL_WAVER[1], fw), strong: lerp(TRAIL_STRONG[kind][1], TRAIL_STRONG[kind][0], f), pace: lerp(TRAIL_PACE[0], TRAIL_PACE[1], fp), state: 0, kept: false,
      a: x * WIND[0] + z * WIND[1], c: z * WIND[0] - x * WIND[1] });
  }
  // BY THE LAW OF PLACE: a plume whose whole body stands by the law is drawn with its trail (state 2); else it keeps
  // its rise and loses its trail (state 1: it leans down the wind by TRAIL_STUB of its rise, no broader than
  // STUB_BROAD of its rise and never narrower than TRAIL_WIDE[0], the narrowest plume's breadth, never stronger
  // than STUB_STRONG), if its body stands by the law so; else it is not drawn
  const fit = (p) => lawful(p.x, p.y, p.z, p.top, p.broad, p.trail, p.bend, p.waver);
  const tryPlume = (p) => {
    if (fit(p)) return 2;
    p.trail = TRAIL_STUB * p.top; p.broad = Math.min(p.broad, Math.max(STUB_BROAD * p.top, TRAIL_WIDE[0])); p.strong = Math.min(p.strong, STUB_STRONG);
    return fit(p) ? 1 : 0;
  };
  let done = 0;
  for (const p of plumes) { if (++done % 20 === 0) await W.ctx.yield(); p.state = tryPlume(p); }
  // NO BAND: from the longest trail of the town down, a trail beside which two other long trails lie (all three
  // pots within BAND metres of one another across the wind, each of the two beside it for BAND_SIDE metres and more
  // along the wind) is kept short: its rise stays, its trail is TRAIL_SHORT metres (its rise where that is more),
  // its breadth smaller by as much as its whole way is shorter; and it is tried by the law of place anew
  const long = plumes.filter((p) => p.state === 2).sort((p, q) => q.trail - p.trail);
  for (const p of long) {
    if (++done % 60 === 0) await W.ctx.yield();
    const cs = [];
    for (const q of long) if (q !== p && !q.kept && Math.abs(q.c - p.c) <= BAND && Math.min(p.a + p.trail, q.a + q.trail) - Math.max(p.a, q.a) >= BAND_SIDE) cs.push(q.c - p.c);
    cs.sort((u, v) => u - v);
    let band = false; for (let i = 0; i + 1 < cs.length; i++) if (Math.max(0, cs[i + 1]) - Math.min(0, cs[i]) <= BAND) band = true;
    if (!band) continue;
    const short = Math.max(TRAIL_SHORT, p.top);
    if (short >= p.trail) continue;
    p.kept = true; p.broad = Math.max(p.broad * (p.top + short) / (p.top + p.trail), TRAIL_WIDE[0]); p.trail = short; p.state = tryPlume(p);
  }
  const data = [], high = [], wind = [], own = []; let n = 0, undrawn = 0, trailed = 0, lost = 0, short = 0;
  for (const p of plumes) {
    if (!p.state) { undrawn++; continue; }
    n++; if (p.state === 2) trailed++; else lost++; if (p.kept && p.state === 2) short++;
    data.push(p.x, p.y, p.z, p.ph); high.push(p.top, p.broad); wind.push(p.trail, p.strong, p.bend); own.push(p.waver, p.pace);
  }
  // (n: the plumes drawn; trailed: those with a trail, the short ones among them; lost: those that keep their rise
  // and have lost their trail to a law of place; undrawn: the quiet chimneys)
  W.smoke = { data, high, wind, own, n, undrawn, trailed, lost, short };
  const SEG = 16, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) pos.push(-1, i / SEG, 0, 1, i / SEG, 0);
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(data), 4)); g.setAttribute('iH', new THREE.InstancedBufferAttribute(new Float32Array(high), 2));
  g.setAttribute('iW', new THREE.InstancedBufferAttribute(new Float32Array(wind), 3)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(new Float32Array(own), 2)); g.instanceCount = n;
  const S = W.shared, mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uEdge: S.uEdge, uTime: S.uTime, uFogDen: S.uFogDen, uSunDir: S.uSunDir, uFogCol: S.uFogCol, uFogWarm: S.uFogWarm,
      uCold: { value: new THREE.Color().setRGB(...SMOKE_SHADE) }, uGold: { value: new THREE.Color().setRGB(...SMOKE_SUN) } },
    // the plume's law (plumeBody mirrors it). The strip's way is the plume's, and the plume is gone at SMOKE_TOP
    // of it (hn 1 there). ITS WAY: it climbs iH.x metres over its pot, fast at first and then level (the power
    // SMOKE_RISE), and goes to the lee by lee metres (its trail iW.x at its end, by its own power iW.z of the way's
    // share before it, longer and shorter by the two gusts); a curl of 1.01 m at most each way (k: a lower plume's
    // is smaller, whole from SMOKE_WHOLE metres of rise) and its own waver of iV.x metres each way that runs down
    // the trail with the smoke; m is the metres from the pot along that way. ITS BREADTH (hb): a hand's breadth at
    // the pot (0.1 m), swelling steadily along its way to the plume's own measure at its end (iH.y), and wider and
    // narrower by nine hundredths as its puffs go. The strip that carries it is as broad as the plume is there
    // and SMOKE_EDGE metres more to either side (wide), so that the plume can be drawn in it by the picture's
    // grain, and it is turned about the bent way (T: the way's own lean in the wind) to face the eye.
    // Nothing here asks how far the eye stands
    vertexShader: /* glsl */`attribute vec4 iS; attribute vec2 iH, iV; attribute vec3 iW; uniform float uTime; varying vec3 vW, vB; varying vec4 vU; varying float vP;
// how fast the way runs (metres a share): its climb and its run to the lee at the share u of it
vec2 pace(float u, float top, float tr, float bend) { return vec2(top * ${SMOKE_RISE.toFixed(1)} * pow(1. - min(u, 1.), ${(SMOKE_RISE - 1).toFixed(1)}), tr * bend * pow(u, bend - 1.)); }
void main() {
  float h = position.y, hu = h / ${SMOKE_TOP.toFixed(2)}, hn = min(hu, 1.), t = uTime * .3 + iS.w, top = iH.x, k = min(top / ${SMOKE_WHOLE}., 1.);
  vec2 wd = vec2(${WIND[0].toFixed(4)}, ${WIND[1].toFixed(4)});
  float bend = iW.z, gust = 1. + ${SMOKE_GUST[0].toFixed(2)} * sin(uTime * .37 - dot(iS.xz, wd) * .02) + ${SMOKE_GUST[1].toFixed(2)} * sin(uTime * 1.3 + iS.w * 3.), tr = iW.x * gust;
  float lee = tr * pow(hu, bend), up = top * (1. - pow(1. - hn, ${SMOKE_RISE.toFixed(1)}));
  vec2 run = pace(hu, top, tr, bend);
  float m = (length(pace(0., top, tr, bend)) + 4. * length(pace(hu * .25, top, tr, bend)) + 2. * length(pace(hu * .5, top, tr, bend)) + 4. * length(pace(hu * .75, top, tr, bend)) + length(run)) * hu / 12.;
  vec2 off = wd * lee + vec2(sin(t + h * 4.3), cos(t * .8 + h * 3.1)) * h * (.3 + h) * .9 * k;
  off += vec2(sin(m * .3 - uTime * 1.3 + iS.w * 5.), cos(m * .25 - uTime * 1.05 + iS.w * 2.)) * iV.x * smoothstep(0., .25, h);
  vec3 c = vec3(iS.x + off.x, iS.y + up, iS.z + off.y);
  vec3 T = normalize(vec3(wd.x * run.y, run.x, wd.y * run.y)), sd = normalize(cross(T, c - cameraPosition) + vec3(1e-5, 0., 0.));
  float hb = (.05 + (iH.y * .5 - .05) * pow(hn, ${SMOKE_SWELL.toFixed(2)})) * (1. + .09 * sin(m * .42 - uTime * 1.6 + iS.w * 3.));
  float wide = min((.05 + (iH.y * .5 - .05) * pow(hn, ${SMOKE_SWELL.toFixed(2)})) * 1.16 + ${SMOKE_EDGE.toFixed(2)}, iH.y * .545);
  c += sd * position.x * wide;
  vW = c; vB = vec3(hb, wide, iW.y); vU = vec4(position.x, h, iS.w, m); vP = iV.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.);
}`,
    fragmentShader: NOISE_GLSL + /* glsl */`
uniform float uEdge, uTime, uFogDen; uniform vec3 uSunDir, uFogCol, uFogWarm, uCold, uGold; varying vec3 vW, vB; varying vec4 vU; varying float vP;
void main() {
  float x = vU.x, h = vU.y, hn = min(h / ${SMOKE_TOP.toFixed(2)}, 1.), m = vU.w, side = x * vB.y;
  // THE PLUME BY THE PICTURE'S GRAIN: its own half breadth here is own (below). Where that is finer than a grain (its
  // foot, from afar) the plume is drawn a grain to either side of its axis and its smoke is so much the fainter
  // (the share of the drawn breadth that it fills): the same smoke at every distance, by fwidth across the strip.
  // One grain at the most: a pure filter that keeps the plume's light
  // puffs in metres (two sizes of them, about 4 m and 2 m, as broad as they are long) that run down the plume's
  // way by the clock, each plume at its own pace (vP metres a second)
  float mr = m - uTime * vP;
  // ITS RIMS ARE A DRIFT'S, never two straight lines: as its smoke goes the plume stands now to this side of its
  // way and now to that (by a fifth of its half breadth at the most) and is here fuller and there leaner (0.6 to
  // 0.86 of its half breadth): 1.06 of the half breadth at the most, which is what the law of place counts
  float own = vB.x * (.6 + .26 * vn(vec2(vU.z * 13., mr * .3)));
  side += vB.x * .4 * (vn(vec2(vU.z * 31., mr * .2)) - .5);
  float hb = clamp(max(own, fwidth(x) * vB.y), 1e-3, vB.y), xn = clamp(side / hb, -1., 1.);
  float puff = .65 * vn(vec2(side * .25 + vU.z * 9., mr * .25 + vU.z * 5.)) + .35 * vn(vec2(side * .5 - vU.z * 4., mr * .5));
  // close and whole over its pot; as it goes and spreads its puffs stand apart more and more (it frays)
  float fray = smoothstep(.05, .8, hn) * ${SMOKE_FRAY.toFixed(2)}, body = smoothstep(-.35 + .8 * fray, .25 + .55 * fray, puff);
  // ITS SMOKE THINS TO NOTHING: half seen in the pot's own breadth, whole a little over it and to nearly half its
  // way, and from there the thinner the farther and broader it goes, to nothing at its end (a stronger plume later
  // than a faint one); soft to nothing at both rims; the plume's own strength (vB.z) over all of it. No hard end,
  // no bright core, no dense head, no outline
  float sx = 1. - xn * xn, a = sx * smoothstep(0., .02, h) * mix(.5, 1., smoothstep(0., .18, hn)) * pow(1. - smoothstep(.45, 1., hn), ${SMOKE_FADE.toFixed(2)} - vB.z) * body * vB.z;
  a *= own / hb;
  puff = .12 + .88 * smoothstep(.22, .78, puff);
  // THE PUFFS READ, in every plume alike: from a little over the pot the smoke is thicker in its puffs and
  // thinner between them (by PUFF_DEEP about its own mean), and a puff's own tone is lighter than the hollow's
  a *= mix(1., ${(1 - PUFF_DEEP / 2).toFixed(2)} + ${PUFF_DEEP.toFixed(2)} * puff, smoothstep(.03, .14, hn));
  // the world's light at its height: a warm grey in the shade below the edge of the sunlight, a pale warm white
  // above it, and brightest in the metres where it rises through it
  float lit = smoothstep(uEdge - 1.25, uEdge + 1.25, vW.y);
  float band = lit * (1. - smoothstep(uEdge + 1., uEdge + 9., vW.y));
  vec3 col = mix(uCold, uGold * (1. + .2 * band), lit) * (${(1 - PUFF_TONE / 2).toFixed(2)} + ${PUFF_TONE.toFixed(2)} * puff);
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-4);
  vec3 sunH = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-5, 0., 0.));
  // against the light a lit plume is brighter still (the low sun shines through it)
  float toSun = pow(clamp(dot(V, sunH), 0., 1.), 6.);
  col *= 1. + .25 * toSun * lit;
  float fog = 1. - exp(-uFogDen * uFogDen * dist * dist);
  // the world's one haze lies over a plume exactly as over the roof beside it (the surface's own laws to the
  // number: the low haze's two, then the fog with its warmth toward the sun: see the part's FRAG_MAIN)
  float toSunWide = pow(clamp(dot(V, sunH), 0., 1.), 1.5), low = (1. - exp(-dist * .003)) * (1. - smoothstep(-5., 17., vW.y)) * .5;
  col = mix(col, mix(vec3(.3, .4, .66), vec3(1.05, .74, .46), toSunWide * .8), low);
  low = (1. - exp(-dist * .0016)) * (1. - smoothstep(10., 46., vW.y)) * toSunWide * .42;
  col = mix(col, vec3(1.1, .78, .5), low);
  // (a plume is thin pale air, never a bright pillar: no place of it is thicker than 0.48)
  gl_FragColor = vec4(mix(col, mix(uFogCol, uFogWarm, pow(clamp(dot(V, sunH), 0., 1.), 4.)), fog), clamp(a, 0., 1.));
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; W.scene.add(mesh);
  return { n, tris: n * SEG * 2 };
}

// ---------------------------------------------------------------- the cloud bars before the low sun: the cause of the round
// Long bars of cloud lie low over the eastern ridge and drift southward along the horizon by the world's clock
// (BAR_DRIFT radians a second). They are bodies of the SKY: like the dome's sun and moon they are drawn about the
// eye's ground place, BAR_R metres out, but each at its own height over the world, so that height tells: the main
// bar's top at the sun's azimuth stands at edgeAt(clock) + BAR_R * tan(sun's height), and an eye above the edge of
// the sunlight sees the disc clear over the bar while an eye below it sees the bar across the disc. Along the
// horizon the bar's outline is the same function at the phase clock - angle / BAR_DRIFT: what stands south of the
// sun has been before it, what stands north of it is coming; the edge never moves without them. A gap between two
// bars is where that function stands at its lowest. Two rows of thinner bars lie higher, on the same drift.
const BAR_R = 2600, BAR_DRIFT = 0.45 * Math.PI / 180;
function buildBars(W) {
  const S = W.shared, N = 256, data = new Uint8Array(N * 4);
  // the round's own curve over one period, read by the bars' shader (red: -10 to 90 m)
  for (let i = 0; i < N; i++) { data[i * 4] = Math.round(clamp((edgeAt(i / N * EDGE_PERIOD) + 10) / 100, 0, 1) * 255); data[i * 4 + 3] = 255; }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const seg = 72, pos = [], idx = [], az0 = Math.atan2(SUN[2], SUN[0]);
  for (let i = 0; i <= seg; i++) { const phi = -1.75 + 3.5 * i / seg; pos.push(phi, 150, 0, phi, 740, 0); }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uEdge: S.uEdge, uTime: S.uTime, tProf: { value: tex }, uPeriod: { value: EDGE_PERIOD }, uDrift: { value: BAR_DRIFT }, uR: { value: BAR_R }, uAz: { value: az0 },
      uTan: { value: SUN[1] / Math.hypot(SUN[0], SUN[2]) }, uLow: { value: EDGE_LOW }, uSeed: { value: W.RNG.bars.range(0, 40) },
      uShade: { value: new THREE.Color().setRGB(0.5, 0.5, 0.68) }, uRim: { value: new THREE.Color().setRGB(2.3, 1.62, 0.92) }, uBelly: { value: new THREE.Color().setRGB(1.25, 0.8, 0.66) } },
    vertexShader: /* glsl */`uniform float uR, uAz; varying vec2 vB;
void main() {
  float a = uAz + position.x; vB = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition.x + cos(a) * uR, position.y, cameraPosition.z + sin(a) * uR, 1.);
}`,
    fragmentShader: NOISE_GLSL + /* glsl */`
uniform sampler2D tProf; uniform float uEdge, uTime, uPeriod, uDrift, uR, uTan, uLow, uSeed; uniform vec3 uShade, uRim, uBelly; varying vec2 vB;
float prof(float clock) { return texture2D(tProf, vec2(clock / uPeriod, .5)).r * 100. - 10.; }
void main() {
  float phi = vB.x, y = vB.y, q = phi / uDrift - uTime, sunY = uR * uTan;
  // the main bar: its top is the round's own curve at this place's phase (exact at the sun's azimuth), ragged by
  // its own drifting noise away from the sun; its flat belly lies under every eye's line to the sun
  float away = smoothstep(.03, .16, abs(phi));
  float e = prof(-q) + (uEdge - prof(uTime)) * (1. - away) + (vn(vec2(q * .21 + uSeed, 1.7)) - .5) * 26. * away * smoothstep(uLow, 30., prof(-q));
  float top = sunY + e, low = sunY + uLow - (20. + 14. * vn(vec2(q * .09 + uSeed, 5.))) * smoothstep(uLow, 14., e);
  float th = top - low, a1 = smoothstep(-3., 3., top - y) * smoothstep(-3., 3., y - low) * smoothstep(0., 8., th);
  // how near the sun's place in the sky this point of the curtain stands (radians)
  float dy = (y - cameraPosition.y - sunY) / uR, ang2 = phi * phi + dy * dy;
  float near = exp(-ang2 / .02), tight = exp(-ang2 / .0016);
  float thin = exp(-max(min(top - y, y - low), 0.) / 9.);
  vec3 c1 = mix(uShade * (.82 + .3 * vn(vec2(q * .5, y * .03))), uRim, thin * (.16 + .84 * near)) + uRim * tight * thin;
  a1 *= mix(.95, .8, thin);
  // the higher rows: thin long bars lit from below, where the low sun reaches their bellies
  float c2 = smoothstep(.5, .64, vn(vec2(q * .055 + uSeed * 2., .5)) * .72 + vn(vec2(q * .17, 4.)) * .28);
  float y2 = 440. + 60. * (vn(vec2(q * .02 + uSeed, 9.)) - .5), t2 = 15. * c2, d2 = t2 - abs(y - y2);
  float a2 = smoothstep(0., 6., d2) * .82;
  float c3 = smoothstep(.56, .68, vn(vec2(q * .04 + uSeed * 3., 7.5)) * .7 + vn(vec2(q * .13, 2.)) * .3);
  float y3 = 630. + 50. * (vn(vec2(q * .016 + uSeed, 3.)) - .5), t3 = 10. * c3, d3 = t3 - abs(y - y3);
  float a3 = smoothstep(0., 5., d3) * .6;
  float yb = a2 > a3 ? y2 - t2 : y3 - t3;
  vec3 ch = mix(uShade * 1.12, uBelly, exp(-max(y - yb, 0.) / 7.) * (.35 + .65 * near));
  float ah = max(a2, a3);
  float a = max(a1, ah) * (1. - smoothstep(1.45, 1.72, abs(phi)));
  gl_FragColor = vec4(a1 >= ah ? c1 : ch, clamp(a, 0., 1.));
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; W.scene.add(mesh);
  W.barsTex = tex;
}

// ---------------------------------------------------------------- birds on their standing rounds
// Every flock flies a level round fixed in the world, by the world's clock, at ONE turning rate: each bird keeps
// its station in the flock (its place in the flock's arc, its own radius and height, drawn once) and wanders about
// it by a little (2 m along the round, 1.2 m across it, its bob in height), so that a flock is a flock at every
// clock. None is sent up by anything; the edge of the sunlight only tints them.
// A ROUND IS A PLACE AND ITS MARGINS (the same rule for every round, kept in build on the seed's own town):
//   its ring (radius, spread, wander and the bird's own span all in) lies BIRD_CLEAR metres and more over the top of
//   every roof, chimney, pennon, turret, tree or shed that stands under the ring (W.tops, after the town is laid),
//   or over ground the plan holds free (the square, the market's place, the water);
//   it lies CHURCH_CLEAR metres and more from every wall of the great church, in plan or over its masses;
//   it lies LINE_CLEAR metres and more from the flown line; a round that cannot keep all three is not flown.
// Each round draws from a stream of its own, named by the world's seed and the round's place.
// Jackdaws wheel round the two towers' crowns in two rings about the towers' middle (one 6 m and more over the
// crowns' pinnacles, one wide of the towers' corners at the crowns' height, both 13 m and more over the line);
// rooks over the garden's bare trees; grey pigeons low
// over the square before the west front, round the great house's turrets, over the market's hall, the tanners'
// sheds and the roofs; gulls over the two arms and the fork.
// [kind (0 jackdaw or rook, 1 pigeon, 2 gull), x, lowest height of the ring's middle, z, radius, spread, birds, m/s, flock arc]
const ROUNDS = [
  // jackdaws round the two towers' crowns
  [0, 7, 84, 0, 30, 3, 34, 8, 6.28], [0, 7, 77, 0, 46, 2.5, 34, 8, 6.28],
  // pigeons on the island: the north-west roofs by the mill bridge, the roofs south of the lane, round the great
  // house's turrets, low over the square before the west front, the roofs west of the court
  [1, -215, 21, -60, 28, 5, 34, 11, 1.3], [1, -150, 23, 2, 26, 5, 34, 11, 1.3], [1, -96, 19, -24, 10, 2, 30, 8, 2.2],
  [1, -24, 14, 0, 9, 2, 30, 7, 2.4], [1, -10, 24, 58, 20, 4, 30, 10, 1.6],
  // pigeons over the southern arm's stone bridge and the tanners' sheds
  [1, 12, 26, 115, 18, 4, 30, 10, 1.6], [1, 120, 12, 128, 12, 3, 30, 8, 2.0],
  // pigeons on the southern bank: over the market's hall, south-west of the spire church, the roofs east of it
  [1, 177, 16, 211, 9.5, 2, 34, 8, 2.2], [1, 136, 23, 276, 30, 5, 34, 11, 1.3], [1, 262, 22, 232, 26, 5, 30, 11, 1.4],
  // rooks over the garden's bare trees on the island's point
  [0, 180, 24, -2, 20, 5, 40, 8, 2.4],
  // gulls: the northern arm by the barges, the fork (the most), the southern arm west of the stone bridge
  [2, -235, 7, -172, 22, 6, 9, 7, 2.2], [2, 268, 9, 60, 27, 6, 16, 7, 2.0], [2, -60, 8, 116, 16, 4, 9, 7, 2.2],
];
const roundName = (r) => 'round:' + r[0] + ':' + r[1] + ':' + r[3] + ':' + r[4];
const BIRD_BOB = [0.8, 0.7, 1.2], BIRD_SIZE = [0.55, 0.48, 0.95], BIRD_UP = [4, 1.6, 1.6], BIRD_ALONG = 2, BIRD_ACROSS = 1.2, BIRD_FLAT = 0.82;
const BIRD_CLEAR = 3, CHURCH_CLEAR = 6, LINE_CLEAR = 8;
// the great church's highest stone over a place of the plan: its masses (churchTop) with what stands on them and
// outside them (the towers' corner pinnacles and buttresses, the steeple, the gables' pinnacles and corner turrets,
// crestings and parapets, the front's gallery, the flying buttresses). Fitted to the church as the part builds it:
// none of its stone stands more than 0.2 m outside what this gives
const churchCrown = (x, z) => {
  const C = CHURCH, az = Math.abs(z);
  if (x >= -1.2 && x <= C.towerSide + 1.2 && az >= C.gapHalf - 1.2 && az <= 22.6) return 72;
  if (Math.hypot(x - C.crossing[0], z - C.crossing[1]) <= 3.6) return 79.5;
  if (x >= C.transeptW - 3.9 && x <= C.transeptE + 3.9 && az >= 27.5 && az <= 32.5) return 57.5;
  if (x >= -2.6 && x < 0 && az <= 24.2) return C.platform + 1.2;
  const t = churchTop(x, z), r = x <= C.apseX ? az : Math.hypot(x - C.apseX, z);
  let c = t > 0 ? t + 1.2 : 0;
  // the buttressed body from the towers east and round the east end: the piers outside the aisles' walls with their
  // pinnacles and the flyers' heads over the aisles (to y 28.1)
  if (x >= 13.5 && r <= 28) c = Math.max(c, 28.3);
  // the high walls' parapet outside the high roof's foot, and the roof of the round east end (a half cone to the ridge)
  if (x >= 13.5 && r <= 11) c = Math.max(c, C.eaves + 1.2, Math.min(C.ridge + 1.6 - r * 11 / 7.6, C.ridge + 1.2));
  // the transept's roof to its verges
  if (x >= C.transeptW - 0.6 && x <= C.transeptE + 0.6 && az <= C.southFace) c = Math.max(c, C.eaves + 1.2);
  return c;
};
// The church's plan walked about (x, z) in rings a metre apart from ra out to rb (each ring in steps of 0.9 m and
// less): 'seen' is handed the church's highest stone at every walked place where any stands and may end the walk by
// answering true (the walk then answers true). churchCrown is 0 everywhere outside CROWN_BOX (x from -3 to
// apseX + 28, 33 m to either side of the axis), so a ring that does not reach that box is not walked.
const CROWN_BOX = [-3, CHURCH.apseX + 28, 33];
function churchWalk(x, z, ra, rb, seen) {
  const B = CROWN_BOX, gx = Math.max(B[0] - x, x - B[1], 0), gz = Math.max(Math.abs(z) - B[2], 0), nearest = Math.hypot(gx, gz);
  if (nearest > rb) return false;
  const farthest = Math.hypot(Math.max(x - B[0], B[1] - x), Math.abs(z) + B[2]);
  for (let r = ra; r <= rb; r += 1) {
    if (r < nearest - 1e-6 || r > farthest + 1e-6) continue;
    for (let a = 0, da = Math.min(0.2, 0.9 / Math.max(r, 1)); a < 6.2832; a += da) {
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (px < B[0] || px > B[1] || pz < -B[2] || pz > B[2]) continue;
      const c = churchCrown(px, pz);
      if (c > 0 && seen(c)) return true;
    }
  }
  return false;
}
// What stands where over the town's plan, for whatever flies over it: [x, z, radius on the plan, top]. The trees add
// their own as they are set; the great church is asked by churchCrown.
function gatherTops(W, houses, kinds, sites, Q) {
  const T = W.tops, H = GREAT_HOUSE;
  for (const h of houses) if (!h.gone) T.push([h.cx, h.cz, Math.hypot(h.r.a, h.r.b), h.y + kinds[h.k].top * h.sy + (hasPennon(h) ? 2.7 : 0), h.r]);
  for (const s of sites) {
    if (s.gone) continue;
    // a small church by its own plot: from its tower's or turret's west face to its chancel's east end
    const rect = churchRect(s);
    T.push([rect.x, rect.z, Math.hypot(rect.a, rect.b), s.y + (s.kind === 'turret' ? s.wall + s.rise + 7 : s.th + s.cap) + 2.3, rect]);
  }
  T.push([Q.market.hall[0], Q.market.hall[1], 11, groundY(...Q.market.hall) + 9.8], [Q.great.x, Q.great.z0 + 4.4, 16.5, 19], [Q.great.x, (Q.great.z0 + Q.great.z1) / 2, 21, 4.8]);
  T.push([120, bankS(120) - 2, 26, 5.2], [FORK.mill[0], FORK.mill[1] - 2, 11, WATER_Y + 5.5], [FORK.crane[0], FORK.crane[1] - 4, 11, 12.5], [FORK.ferryX, (islandS(FORK.ferryX) + bankS(FORK.ferryX)) / 2, 34, 4.6]);
  for (const o of RANGES) T.push([(o.xc + o.xb) / 2, (o.z0 + o.z1) / 2, (o.z1 - o.z0) / 2 + 5, o.h0 + o.h1 + o.rise + 2]);
  T.push([H.x, H.z - 3, H.a, H.top], [-290, -62, 12, 60.5], [-60, -230, 19, 24.5], [-260, -260, 25, 16], [64.5, 47, 2, 3.8]);
  // the three landmarks of the southern bank (their uprights carry a sixth number: see the rings' rule)
  for (const t of markTops()) T.push(t);
}
// A small church's plot on the plan, TAKEN FROM WHAT STANDS ON IT: from its tower's or turret's west face to its
// chancel's east end, as broad as its nave's eaves or its tower's buttresses (room: what is kept free round it).
function churchRect(s, room = 0) {
  const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), x0 = -s.len / 2 - (s.kind === 'turret' ? 0.6 : 2 * s.ts), x1 = s.len * 0.8 + 0.5, m = (x0 + x1) / 2;
  return { x: s.x + m * c, z: s.z - m * sn, ux: c, uz: -sn, a: (x1 - x0) / 2 + room, b: Math.max(s.wid / 2, s.ts || 0) + 0.7 + room };
}
// the height of a round's middle, by the rule above, or null where it cannot be flown (the church is asked only
// where the ring comes near it: its plan is walked CHURCH_CLEAR metres round the ring's band, in rings a metre apart;
// near: topsNear of this town; L: the line's places (lineRuns), of which every second one is asked: every 2 m)
function roundHeight(round, near, L) {
  const [kind, x, low, z, rad, spread] = round, body = BIRD_SIZE[kind] * 1.1 * 1.1, dy = BIRD_UP[kind] + BIRD_BOB[kind] + body;
  const r0 = (rad - spread - BIRD_ACROSS) * BIRD_FLAT - body, r1 = rad + spread + BIRD_ACROSS + body;
  let y = low;
  for (const list of near(x, z, r1 + BIRD_CLEAR)) for (let i = 0; i < list.length; i++) {
    // (a thing whose disc lies clear of the band's outer edge is not under the band; one that could lift the ring
    // no higher is not asked)
    const o = list[i], ox = o.x - x, oz = o.z - z, lim = r1 + BIRD_CLEAR + o.r + 1e-6;
    if (ox * ox + oz * oz >= lim * lim) continue;
    const t = o.t, tr = t[2], ty = t[3], rect = t[4];
    if (ty + BIRD_CLEAR + dy <= y) continue;
    // a house by its own plot (the nearest and the farthest of it from the ring's middle), any other thing by its disc
    let dn = Math.hypot(t[0] - x, t[1] - z) - tr, df = dn + 2 * tr;
    if (rect) { const dx = x - rect.x, dz = z - rect.z, pa = Math.abs(dx * rect.ux + dz * rect.uz), pb = Math.abs(dz * rect.ux - dx * rect.uz); dn = Math.hypot(Math.max(pa - rect.a, 0), Math.max(pb - rect.b, 0)); df = Math.hypot(pa + rect.a, pb + rect.b); }
    if (dn < r1 + BIRD_CLEAR && (df > r0 - BIRD_CLEAR || t[5])) y = ty + BIRD_CLEAR + dy;
  }
  let crown = 0;
  churchWalk(x, z, Math.max(r0 - CHURCH_CLEAR, 0), r1 + CHURCH_CLEAR, (c) => { if (c > crown) crown = c; return false; });
  if (crown > 0) y = Math.max(y, crown + CHURCH_CLEAR + dy);
  for (let run = 0, runs = L.CR.length; run < runs; run++) {
    // (a stretch whose every place lies LINE_CLEAR and more beyond the band's outer edge is not asked)
    const ex = L.CX[run] - x, ez = L.CZ[run] - z, lim = r1 + LINE_CLEAR + L.CR[run];
    if (ex * ex + ez * ez >= lim * lim) continue;
    for (let i = run * LINE_RUN, i1 = Math.min(i + LINE_RUN, L.n); i < i1; i += 2) {
      const d = Math.hypot(L.X[i] - x, L.Z[i] - z), gap = Math.max(r0 - d, d - r1, 0), up = Math.max(Math.abs(L.Y[i] - y) - dy, 0);
      if (Math.hypot(gap, up) < LINE_CLEAR) return null;
    }
  }
  return y;
}
// THE BIRDS OF A WINTER TOWN ALONG THE HIGH WAY: beside the sixteen typed rounds, loose flocks fly level rounds of
// their own all along the stretch where the line goes high over the town, from where it lifts toward the mill
// bridge's ridge (C) to where it comes down toward the door (V). A RULE OF PLACE, the same on every seed and morning.
// STATIONS: every FLOCK_STEP metres of that stretch is a station, and each station lays to either hand of the line's
//   track one round of each of THREE KINDS, each by a stream of its own (named by the kind, the station's metre and
//   its hand): grey and slate town PIGEONS, 60 to 150 a flock, and black ROOKS a metre across, 20 to 50 a company,
//   both where the ring's middle lies over land (roofs, lanes, the bare trees); white GULLS 1.3 m across, 30 to 80
//   a flock, only where the ring's whole band lies over the river (water, strands, bridges) and GULL_CHURCH metres
//   and more from the church's walls: no white bird flies over the island, the lanes or about the church. Of every
//   kind more flocks are great than small. At one station the pigeons lay first, at the next the rooks.
// A RING is 25 to 60 m across (more of them small than great), level, fixed in the world, and turns for ever by
//   the world's clock at 9 to 14 m/s, its phase and its way round dealt. A FLOCK IS A LOOSE CLUMP on it: its birds spread over a quarter to a half of the
//   ring (more of them toward the clump's middle), 4 to 9 m across and 4 to 9 m in height, and each bird wanders in
//   the clump on a small period of its own (BIRD_ALONG metres along, BIRD_ACROSS across, its bob in height).
// WHERE A RING IS FLOWN: its middle is thrown from the station to its hand between the track and FLOCK_PASS metres
//   beyond its band, its height between the lowest the roofs allow (BIRD_CLEAR over every top under the band, never
//   under FLOCK_LOW) and the highest the line allows (under the line where the line lies over its band, else its
//   lowest bird FLOCK_OVER metres over the line's own height at the station). It is flown only where
//   - its band as a whole (spread, wander, bob, a banked bird's farthest reach) keeps FLOCK_NEAR metres and more
//     from every place of the line and passes within FLOCK_PASS metres of it;
//   - it lies beside the line or under it and never over it: no place of the line lies under its band, and beside
//     the line its lowest bird flies no more than FLOCK_OVER metres higher than the line's nearest place (so that
//     two kinds can share a stretch of air, one over the other);
//   - no stone of the great church stands within CHURCH_CLEAR + 2 metres of its band on the plan (so none over the
//     church's roof, none in the gap between the towers), and its band keeps TOWER_CLEAR metres on the plan from the
//     two towers' walls and from the steeple: the jackdaws' two typed rounds are the towers' only birds;
//   - its middle stands FLOCK_APART metres and more from the middle of every round of its own kind flown before it
//     (the typed rounds too), and its band shares no air with a round of another kind (different kinds one over
//     the other, never through each other).
//   A hand draws up to FLOCK_TRIES rings and flies the first that keeps all of it, or none. No flock comes to the
//   line, follows it, rises as it comes or answers anything. A flock's bird rolls into its round as a bird does,
//   by its speed and its ring (the tangent of its roll v2 / (g r), FLOCK_BANK at the most: half a right angle), so
//   that a flock shows its backs to one side and its bellies to the other, each bird by a draw of its own between
//   FLOCK_ROLL of that roll and the whole of it; the typed rounds' birds as before.
const FLOCK_STEP = 15, FLOCK_NEAR = 12, FLOCK_PASS = 22, FLOCK_TRIES = 64, FLOCK_APART = 20, FLOCK_BANK = 1, BIRD_BANK = 0.25;
// by kind (0 rooks, 1 pigeons, 2 gulls): the stream's name, the birds of a flock, a bird's half span, the lowest
// height of a ring's middle (12 m over the banks' ground; the gulls 12 m over the water), the wing's beat
const FLOCK_NAME = ['rooks', 'flock', 'gulls'], FLOCK_RNG = ['rooks', 'flocks', 'gulls'], FLOCK_BIRDS = [[20, 50], [60, 150], [30, 80]], FLOCK_SIZE = [0.5, 0.48, 0.65];
const FLOCK_LOW = [BANK_Y + 12, BANK_Y + 12, WATER_Y + 12], FLOCK_BEAT = [[7, 10], [9, 13], [3, 4.5]];
const FLOCK_ACROSS = [25, 60], FLOCK_CLUMP = [4, 9], FLOCK_SPEED = [9, 14], FLOCK_ARC = [Math.PI / 2, Math.PI];
// the farthest a drawn bird's vertex lies from its middle, in its own half span, at any beat of the wing and any
// roll (1.21 by the form: the high wing's tip at the top of its beat in the steepest roll, FLOCK_BANK); how many
// times faster a flock's bird wanders than a typed round's
const FLOCK_REACH = 1.25, FLOCK_WANDER = [3, 5];
// the least of its ring's roll a flock's bird takes (each bird rolls by a draw of its own between that and the whole:
// no two lie in the air alike); a flock's pigeon from slate to grey (its tone times the kind's colour)
const FLOCK_ROLL = 0.6, PIGEON_TONE = [0.6, 1.1];
// how flat the flattest bird's own round is in a flock (a typed round's: BIRD_FLAT)
const FLOCK_FLAT = 0.94;
const TOWER_CLEAR = 40, GULL_CHURCH = 90, FLOCK_OVER = 8;
// a gull's band lies over the river: both its rims, each taken GULL_SHORE metres wider, at GULL_RIM places round
const GULL_SHORE = 1, GULL_RIM = 32;
// how many rings are tried before the build is handed back (W.tried counts them; after every hand through the
// first station, while the page's engine is still slow at the law)
const FLOCK_SLICE = 640;
// a flock's ring is refused where anything of the church stands within CHURCH_CLEAR of its band on the plan: the plan
// is walked two rings farther out than that, so that the walk's metre steps cannot pass by a corner that stands at 6 m
const FLOCK_HULL = CHURCH_CLEAR + 2;
// the stations' metres along the route (the same on every seed: the route is typed)
const flockStations = (metreOf) => { const out = []; for (let m = metreOf(...ROUTE[2]), end = metreOf(...ROUTE[21]); m <= end; m += FLOCK_STEP) out.push(m); return out; };
// the band a flock's birds keep to: on the plan from r0 to r1 about the ring's middle (spread, wander, the flattest
// bird's round, the farthest reach of a bird's body), and dy up and down from the ring's middle
const flockBand = (kind, rad, spread, up) => {
  const body = FLOCK_SIZE[kind] * 1.1 * FLOCK_REACH;
  return { r0: (rad - spread - BIRD_ACROSS) * FLOCK_FLAT - body, r1: rad + spread + BIRD_ACROSS + body, dy: up + BIRD_BOB[kind] + body };
};
// a typed round's band by the same measure (what roundHeight keeps for it)
const roundBand = (kind, rad, spread) => {
  const body = BIRD_SIZE[kind] * 1.1 * 1.1;
  return { r0: (rad - spread - BIRD_ACROSS) * BIRD_FLAT - body, r1: rad + spread + BIRD_ACROSS + body, dy: BIRD_UP[kind] + BIRD_BOB[kind] + body };
};
// What stands near a place, for the many rings that are tried: W.tops in squares of TOPS_CELL metres by each
// thing's middle, each with the disc that holds it whole ([x, z, radius] about its plot's middle). A thing that
// reaches TOPS_REACH metres and less from its own middle can stand under a ring only when that middle lies within
// the ring's reach and TOPS_REACH of the ring's own; the few broader things are handed to every ring.
// near(x, z, reach) gives the squares' lists for a ring that reaches 'reach' metres from (x, z).
const TOPS_CELL = 24, TOPS_REACH = 12;
function topsNear(tops) {
  const cells = new Map(), wide = [], key = (i, j) => i * 4096 + j;
  for (const t of tops) {
    const rc = t[4], o = { t, x: rc ? rc.x : t[0], z: rc ? rc.z : t[1], r: rc ? Math.hypot(rc.a, rc.b) : t[2] };
    if ((rc ? o.r + Math.hypot(rc.x - t[0], rc.z - t[1]) : t[2]) > TOPS_REACH) { wide.push(o); continue; }
    const k = key(Math.floor(t[0] / TOPS_CELL), Math.floor(t[1] / TOPS_CELL)); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(o);
  }
  return (x, z, reach) => {
    const out = [wide], g = reach + TOPS_REACH, i1 = Math.floor((x + g) / TOPS_CELL), j0 = Math.floor((z - g) / TOPS_CELL), j1 = Math.floor((z + g) / TOPS_CELL);
    for (let i = Math.floor((x - g) / TOPS_CELL); i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = cells.get(key(i, j)); if (c) out.push(c); }
    return out;
  };
}
// The line's places for the same, every LINE_EVERY metres, kept by STRETCHES of LINE_RUN places of the way: each
// stretch with one place of its own (its middle one) and how far its places lie from that on the plan, so that a
// ring asks only the stretches that can reach it. No place of the line lies farther than LINE_EVERY / 2 from one
// of these, so the flocks' law keeps FLOCK_NEAR and that half step from each of them. about(x, z, reach): the
// stretches with a place within 'reach' metres of (x, z) on the plan (and more).
const LINE_EVERY = 1, LINE_RUN = 8;
function lineRuns(W) {
  const P = new THREE.Vector3(), n = Math.floor(W.LEN / LINE_EVERY) + 1, X = new Float64Array(n), Y = new Float64Array(n), Z = new Float64Array(n);
  for (let i = 0; i < n; i++) { W.path.posAtDist(i * LINE_EVERY, P); X[i] = P.x; Y[i] = P.y; Z[i] = P.z; }
  const runs = Math.ceil(n / LINE_RUN), CX = new Float64Array(runs), CZ = new Float64Array(runs), CR = new Float64Array(runs);
  for (let r = 0; r < runs; r++) {
    const i0 = r * LINE_RUN, i1 = Math.min(i0 + LINE_RUN, n), c = Math.min(i0 + (LINE_RUN >> 1), n - 1); let far = 0;
    for (let i = i0; i < i1; i++) far = Math.max(far, Math.hypot(X[i] - X[c], Z[i] - Z[c]));
    CX[r] = X[c]; CZ[r] = Z[c]; CR[r] = far + 1e-6;
  }
  const about = (x, z, reach) => { const out = []; for (let r = 0; r < runs; r++) if (Math.hypot(CX[r] - x, CZ[r] - z) - CR[r] < reach) out.push(r); return out; };
  return { n, X, Y, Z, CX, CZ, CR, about };
}
// a gull's rim: the places round it (their cosines and sines, the outer rim's then the inner's), and the order they
// are asked in: four of the outer rim a quarter turn apart, four between them, then all the others (a rim that
// leaves the river is mostly known by the first few)
const GULL_AT = (() => { const cs = []; for (let k = 0; k < 2 * GULL_RIM; k++) { const a = k * 6.2832 / GULL_RIM; cs.push(Math.cos(a), Math.sin(a)); } return cs; })();
const GULL_ORDER = (() => { const first = []; for (const q of [0, GULL_RIM / 8]) for (let k = q; k < GULL_RIM; k += GULL_RIM / 4) first.push(Math.round(k)); const out = [...first]; for (let k = 0; k < 2 * GULL_RIM; k++) if (!first.includes(k)) out.push(k); return out; })();
// (a middle surely nearer than FLOCK_APART to another, and surely farther: between the two the distance itself is asked)
const APART_IN = FLOCK_APART * FLOCK_APART * (1 - 1e-9), APART_OUT = FLOCK_APART * FLOCK_APART * (1 + 1e-9);
// One ring of a flock by the rule above: the height of its middle, or null where it may not be flown.
// (r0, r1, dy: its band (flockBand); lyS: the line's height at the station; h: the height's draw; own, air: the
// rounds flown already that it can come near, of its own kind and of the others, each as [kind, x, y, z, r0, r1, dy];
// near: topsNear of this town; L, runs: the line's places (lineRuns) and the stretches of them that any ring of
// this station can reach)
function flockHeight(kind, x, z, r0, r1, dy, lyS, h, own, air, near, L, runs) {
  const C = CHURCH;
  // the kind's ground: a gull's band far from the church (and whole over the river: below), the others' middle over land
  if (kind === 2) { if (Math.hypot(Math.max(-x, x - C.length, 0), Math.max(Math.abs(z) - C.southFace, 0)) - r1 < GULL_CHURCH) return null; }
  else if (!(onIsland(x, z) || z < bankN(x) || z > bankS(x))) return null;
  // the two towers' walls (the gap between them with them) and the steeple, on the plan
  if (Math.hypot(Math.max(-2.6 - x, x - C.towerSide - 1.2, 0), Math.max(Math.abs(z) - 22.6, 0)) - r1 < TOWER_CLEAR) return null;
  if (Math.hypot(x - C.crossing[0], z - C.crossing[1]) - 3.6 - r1 < TOWER_CLEAR) return null;
  // the middles of its own kind
  for (let i = 0; i < own.length; i++) {
    const f = own[i], dx = f[1] - x, dz = f[3] - z, d2 = dx * dx + dz * dz;
    if (d2 < APART_IN || (d2 <= APART_OUT && Math.hypot(dx, dz) < FLOCK_APART)) return null;
  }
  // a gull's whole band over the river: both rims, each GULL_SHORE metres wider, at GULL_RIM places round
  if (kind === 2) for (let q = 0, ro = r1 + GULL_SHORE, ri = Math.max(r0 - GULL_SHORE, 0); q < 2 * GULL_RIM; q++) { const k = GULL_ORDER[q], r = k < GULL_RIM ? ro : ri, px = x + GULL_AT[2 * k] * r, pz = z + GULL_AT[2 * k + 1] * r; if (onIsland(px, pz) || pz < bankN(px) || pz > bankS(px)) return null; }
  // the line's places near it: where one lies over its band or nearer than FLOCK_NEAR beside it on the plan, the band
  // flies under that place or not at all (top: the highest its middle may then lie)
  const clear = FLOCK_NEAR + LINE_EVERY / 2, LX = L.X, LY = L.Y, LZ = L.Z, n = L.n; let top = 1e9;
  const in2 = Math.max(r0 - clear, 0) ** 2, out2 = (r1 + clear) ** 2, far2 = (r1 + FLOCK_PASS) ** 2;
  for (let k = 0; k < runs.length; k++) {
    // (a stretch whose every place lies beyond the band's reach is not asked)
    const run = runs[k], ex = L.CX[run] - x, ez = L.CZ[run] - z, lim = r1 + clear + L.CR[run];
    if (ex * ex + ez * ez >= lim * lim) continue;
    for (let i = run * LINE_RUN, i1 = Math.min(i + LINE_RUN, n); i < i1; i++) {
      const dx = LX[i] - x, dz = LZ[i] - z, d2 = dx * dx + dz * dz;
      if (d2 >= out2 || d2 <= in2) continue;
      const d = Math.sqrt(d2), gap = Math.max(r0 - d, d - r1, 0);
      if (gap < clear) top = Math.min(top, LY[i] - Math.sqrt(clear * clear - gap * gap) - dy);
    }
  }
  if (top < FLOCK_LOW[kind]) return null;
  // the roofs under its band, and its height by its draw between the lowest they allow and the highest the line
  // allows: under the line where the line lies over it, else its lowest bird FLOCK_OVER metres over the line's own
  // height at the station
  let y = FLOCK_LOW[kind];
  for (const list of near(x, z, r1 + BIRD_CLEAR)) for (let i = 0; i < list.length; i++) {
    // (a thing whose disc lies clear of the band's outer edge is not under the band)
    const o = list[i], ox = o.x - x, oz = o.z - z, lim = r1 + BIRD_CLEAR + o.r;
    if (ox * ox + oz * oz >= lim * lim) continue;
    const t = o.t, ty = t[3], rect = t[4];
    if (ty + BIRD_CLEAR + dy <= y) continue;
    let dn = Math.hypot(t[0] - x, t[1] - z) - t[2], df = dn + 2 * t[2];
    if (rect) { const dx = x - rect.x, dz = z - rect.z, pa = Math.abs(dx * rect.ux + dz * rect.uz), pb = Math.abs(dz * rect.ux - dx * rect.uz); dn = Math.hypot(Math.max(pa - rect.a, 0), Math.max(pb - rect.b, 0)); df = Math.hypot(pa + rect.a, pb + rect.b); }
    if (dn < r1 + BIRD_CLEAR && (df > r0 - BIRD_CLEAR || t[5])) y = ty + BIRD_CLEAR + dy;
  }
  if (y > top) return null;
  y += h * Math.max(Math.min(lyS + FLOCK_OVER + dy, top) - y, 0);
  // the line: FLOCK_NEAR and more from every place of it, a pass within FLOCK_PASS, beside or under and never over
  let pass = 1e9, lineY = 0;
  for (let k = 0; k < runs.length; k++) {
    const run = runs[k], ex = L.CX[run] - x, ez = L.CZ[run] - z, lim = r1 + FLOCK_PASS + L.CR[run];
    if (ex * ex + ez * ez >= lim * lim) continue;
    for (let i = run * LINE_RUN, i1 = Math.min(i + LINE_RUN, n); i < i1; i++) {
      const dx = LX[i] - x, dz = LZ[i] - z, d2 = dx * dx + dz * dz;
      if (d2 >= far2) continue;
      const d = Math.sqrt(d2), gap = Math.max(r0 - d, d - r1, 0), ly = LY[i], q = Math.hypot(gap, Math.max(Math.abs(ly - y) - dy, 0));
      if (q < clear - 1e-9 || (gap === 0 && ly < y)) return null;
      if (q < pass) { pass = q; lineY = ly; }
    }
  }
  if (pass > FLOCK_PASS || y - dy > lineY + FLOCK_OVER) return null;
  // the air of another kind's round
  for (let i = 0; i < air.length; i++) { const f = air[i]; if (Math.abs(f[2] - y) < f[6] + dy) { const D = Math.hypot(f[1] - x, f[3] - z); if (!(D > r1 + f[5] || D + f[5] < r0 || D + r1 < f[4])) return null; } }
  // the church's stone near its band on the plan
  if (churchWalk(x, z, Math.max(r0 - FLOCK_HULL, 0), r1 + FLOCK_HULL, () => true)) return null;
  return y;
}
// A station of the flocks: its place on the line's track, the way across it, the line's height there, and the
// stretches of the line that any ring thrown from it can reach (its middle lies FLOCK_R1_MOST + FLOCK_PASS metres
// and less from the station, its band reaches as far again)
const FLOCK_R1_MOST = FLOCK_ACROSS[1] / 2 + FLOCK_CLUMP[1] / 2 + BIRD_ACROSS + Math.max(...FLOCK_SIZE) * 1.1 * FLOCK_REACH;
function flockStation(W, m, L) {
  const P = new THREE.Vector3(), Q = new THREE.Vector3(); W.path.posAtDist(Math.max(m - 1, 0), P); W.path.posAtDist(Math.min(m + 1, W.LEN), Q);
  const len = Math.hypot(Q.x - P.x, Q.z - P.z) || 1, mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2;
  return { nx: -(Q.z - P.z) / len, nz: (Q.x - P.x) / len, mx, mz, lyS: (P.y + Q.y) / 2, runs: L.about(mx, mz, 2 * (FLOCK_R1_MOST + FLOCK_PASS) + 0.01) };
}
// one station's round of one kind to one hand (side -1 or 1) by the rule above, or null:
// [kind, x, y, z, radius, half the clump's breadth, half its height, birds, m/s, the clump's arc, the way round]
function layFlock(W, kind, St, side, R, F, near, L) {
  const { nx, nz, mx, mz, lyS, runs } = St, body = FLOCK_SIZE[kind] * 1.1 * FLOCK_REACH, C = CHURCH;
  // WHAT THE LAY CAN REACH: every ring's middle lies on the stretch from the station to 'most' metres to its hand,
  // and its band reaches r1Least metres and more from its middle. Where the towers' walls, the steeple or (a gull's)
  // the church stand nearer than the law allows to BOTH ends of that stretch by the smallest band, they stand so
  // to every ring of it (the distance to a wall or a point grows from its least toward both ends of a straight
  // stretch): no ring is drawn, and none would have been flown.
  const r1Least = FLOCK_ACROSS[0] / 2 + FLOCK_CLUMP[0] / 2 + BIRD_ACROSS + body, most = FLOCK_ACROSS[1] / 2 + FLOCK_CLUMP[1] / 2 + BIRD_ACROSS + body + FLOCK_PASS;
  const ex = mx + nx * side * most, ez = mz + nz * side * most;
  const towers = (x, z) => Math.hypot(Math.max(-2.6 - x, x - C.towerSide - 1.2, 0), Math.max(Math.abs(z) - 22.6, 0)), steeple = (x, z) => Math.hypot(x - C.crossing[0], z - C.crossing[1]) - 3.6;
  const church = (x, z) => Math.hypot(Math.max(-x, x - C.length, 0), Math.max(Math.abs(z) - C.southFace, 0));
  if (Math.max(towers(mx, mz), towers(ex, ez)) - r1Least < TOWER_CLEAR - 1e-6 || Math.max(steeple(mx, mz), steeple(ex, ez)) - r1Least < TOWER_CLEAR - 1e-6
    || (kind === 2 && Math.max(church(mx, mz), church(ex, ez)) - r1Least < GULL_CHURCH - 1e-6)) { W.tried += 1; return null; }
  // the rounds flown already that a ring of this lay can come near: its own kind's middles (FLOCK_APART), the
  // other kinds' bands (the air they hold)
  const own = [], air = [];
  for (let i = 0; i < F.length; i++) {
    const f = F[i], d = Math.hypot(f[1] - mx, f[3] - mz);
    if (f[0] === kind) { if (d < most + FLOCK_APART + 0.01) own.push(f); } else if (d < most + most + f[5] + 0.01) air.push(f);
  }
  for (let t = 0; t < FLOCK_TRIES; t++) {
    const rad = (FLOCK_ACROSS[0] + (FLOCK_ACROSS[1] - FLOCK_ACROSS[0]) * R() * R()) / 2, spread = R.range(FLOCK_CLUMP[0], FLOCK_CLUMP[1]) / 2, up = R.range(FLOCK_CLUMP[0], FLOCK_CLUMP[1]) / 2;
    // (its band, as flockBand has it)
    const r0 = (rad - spread - BIRD_ACROSS) * FLOCK_FLAT - body, r1 = rad + spread + BIRD_ACROSS + body, dy = up + BIRD_BOB[kind] + body;
    const off = R.range(0, r1 + FLOCK_PASS), h = R(), x = mx + nx * side * off, z = mz + nz * side * off;
    const y = flockHeight(kind, x, z, r0, r1, dy, lyS, h, own, air, near, L, runs);
    if (y === null) continue;
    W.tried += t + 1;
    return [kind, x, y, z, rad, spread, up, Math.round(FLOCK_BIRDS[kind][0] + (FLOCK_BIRDS[kind][1] - FLOCK_BIRDS[kind][0]) * (1 - R() * R())), R.range(FLOCK_SPEED[0], FLOCK_SPEED[1]), R.range(FLOCK_ARC[0], FLOCK_ARC[1]), R() < 0.5 ? -1 : 1];
  }
  W.tried += FLOCK_TRIES;
  return null;
}
async function buildBirds(W) {
  const iR = [], iP = [], iK = [], flown = [], near = topsNear(W.tops), L = lineRuns(W);
  for (let k = 0; k < ROUNDS.length; k++) {
    const round = ROUNDS[k], [kind, x, , z, rad, spread, count, speed, arc] = round, R = W.RNG.rounds[k], y = roundHeight(round, near, L);
    const n = kind === 2 ? count : Math.round(count * clamp(W.V.density, 0.7, 1.3)), base = R.range(0, 6.28), dir = R() < 0.5 ? -1 : 1;
    if (k % 4 === 3) await W.ctx.yield();
    if (y === null) continue;
    flown.push([kind, x, y, z, rad, spread, n]);
    for (let i = 0; i < n; i++) {
      const r = rad + R.range(-spread, spread), yy = y + R.range(-1, 1) * BIRD_UP[kind];
      // station (the angle at clock 0), the flock's one turning rate, the wing's beat, the size
      iR.push(x, yy, z, r); iP.push(base + R() * arc, dir * speed / rad, kind === 2 ? R.range(3, 4.5) : R.range(9, 13), BIRD_SIZE[kind] * R.range(0.9, 1.1));
      iK.push(kind, BIRD_BOB[kind] * R.range(0.4, 1), R.range(BIRD_FLAT, 1), R.range(0, 6.28));
    }
  }
  // the flocks along the high way (see FLOCK_STEP): a station's rounds of each kind to either hand, each by its own
  // stream. A ring is laid once; its birds are instances of it. (iB: a bird's bank, how fast it wanders, its tone,
  // 1 on a flock's bird)
  const stations = flockStations(W.metreOf), flocks = [], iB = [];
  for (let i = 0; i < iR.length / 4; i++) iB.push(BIRD_BANK, 1, 1, 0);
  const F = flown.map((f) => { const b = roundBand(f[0], f[4], f[5]); return [f[0], f[1], f[2], f[3], b.r0, b.r1, b.dy]; });
  await W.ctx.yield(); W.tried = 0;
  for (let s = 0; s < stations.length; s++) {
    // (one station's place and reach serve its three kinds and both hands)
    const m = stations[s], St = flockStation(W, m, L);
    // (the pigeons lay first at one station, the rooks at the next, and so on; the gulls have the water to themselves)
    for (const kind of s % 2 ? [0, 1, 2] : [1, 0, 2]) for (let hand = 0; hand < 2; hand++) {
      const R = W.RNG[FLOCK_RNG[kind]][s * 2 + hand], f = layFlock(W, kind, St, hand ? 1 : -1, R, F, near, L);
      if (W.tried >= FLOCK_SLICE || s === 0) { W.tried = 0; await W.ctx.yield(); }
      if (!f) continue;
      const [, x, y, z, rad, spread, up, n, speed, arc, dir] = f, base = R.range(0, 6.28), b = flockBand(kind, rad, spread, up), bank = Math.min(speed * speed / (9.81 * rad), FLOCK_BANK);
      flown.push([kind, x, y, z, rad, spread, n]); F.push([kind, x, y, z, b.r0, b.r1, b.dy]); flocks.push([m, x, y, z, rad, spread, n, kind, up, hand, speed, arc]);
      for (let i = 0; i < n; i++) {
        const r = rad + R.range(-spread, spread), yy = y + R.range(-1, 1) * up;
        // station (the angle at clock 0: more birds toward the clump's middle), the flock's one turning rate, the wing's beat, the size
        iR.push(x, yy, z, r); iP.push(base + (R() + R()) / 2 * arc, dir * speed / rad, R.range(FLOCK_BEAT[kind][0], FLOCK_BEAT[kind][1]), FLOCK_SIZE[kind] * R.range(0.9, 1.1));
        iK.push(kind, BIRD_BOB[kind] * R.range(0.4, 1), R.range(FLOCK_FLAT, 1), R.range(0, 6.28));
        iB.push(bank * R.range(FLOCK_ROLL, 1), R.range(FLOCK_WANDER[0], FLOCK_WANDER[1]), kind === 1 ? R.range(PIGEON_TONE[0], PIGEON_TONE[1]) : 1, 1);
      }
    }
  }
  W.rounds = flown; W.flocks = flocks;
  const g = new THREE.InstancedBufferGeometry();
  // x to the right, z forward; the fourth number is 1 on a wing's tip
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, 0.09, 0, 0, -0.09, 0, 0, 0, 0, -0.55, 0.09, 0, 0.2, 0.09, 0, -0.2, 1, 0, -0.08, -0.09, 0, 0.2, -0.09, 0, -0.2, -1, 0, -0.08], 3));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 1, 0, 0, 1], 1));
  g.setIndex([0, 1, 2, 3, 2, 1, 4, 6, 5, 7, 8, 9]);
  g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 4)); g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4));
  g.setAttribute('iK', new THREE.InstancedBufferAttribute(new Float32Array(iK), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); g.instanceCount = iR.length / 4;
  const S = W.shared, mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uEdge: S.uEdge, uTime: S.uTime, uFogDen: S.uFogDen, uFogCol: S.uFogCol },
    // the round's law (the count by place mirrors it): the station turned at the flock's rate, a wander of BIRD_ALONG
    // metres along the round and BIRD_ACROSS across it on two slow sines of the bird's own, a bob in height
    vertexShader: /* glsl */`attribute vec4 iR; attribute vec4 iP; attribute vec4 iK; attribute vec4 iB; attribute float aTip; uniform float uTime; varying vec3 vW; varying float vKind, vTone;
void main() {
  float sg = iP.y < 0. ? -1. : 1.;
  float w1 = sin(uTime * (.23 + .21 * fract(iK.w * 7.7)) * iB.y + iK.w), w2 = sin(uTime * (.19 + .17 * fract(iK.w * 3.3)) * iB.y + iK.w * 2.);
  float a = iP.x + iP.y * uTime + w1 * ${BIRD_ALONG.toFixed(1)} / iR.w, r = iR.w + w2 * ${BIRD_ACROSS.toFixed(1)};
  vec3 c = iR.xyz + vec3(cos(a) * r, sin(a * 2. + iP.x * 3.) * iK.y, sin(a) * r * iK.z);
  vec2 f = normalize(vec2(-sin(a), cos(a) * iK.z)) * sg;
  float fl = sin(uTime * iP.z + iP.x * 7.);
  // a gull glides between its beats: a few beats, then as long on still wings
  if (iK.x > 1.5) fl *= smoothstep(-.35, .35, sin(uTime * iP.z * .21 + iP.x * 11.));
  vec3 p = position * iP.w; p.y += aTip * fl * .55 * iP.w; p.x *= 1. - aTip * .25 * fl * fl;
  // a bank into the round (iB.x its tangent: a typed round's bird sheared a little as before, a flock's bird rolled
  // as its round asks)
  float cb = iB.w > .5 ? inversesqrt(1. + iB.x * iB.x) : 1.;
  p.y += p.x * iB.x * sg * cb; p.x *= cb;
  vec3 wp = c + vec3(f.y, 0., -f.x) * p.x + vec3(0., p.y, 0.) + vec3(f.x, 0., f.y) * p.z;
  vW = wp; vKind = iK.x; vTone = iB.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`uniform float uEdge, uFogDen; uniform vec3 uFogCol; varying vec3 vW; varying float vKind, vTone;
void main() {
  float lit = smoothstep(uEdge - 1.25, uEdge + 1.25, vW.y);
  vec3 col = vKind < .5 ? vec3(.035, .035, .045) + vec3(.03, .02, .01) * lit
           : vKind < 1.5 ? mix(vec3(.15, .16, .2), vec3(.22, .2, .19), lit) : mix(vec3(.5, .54, .62), vec3(.95, .82, .62), lit);
  float dist = length(vW - cameraPosition), fog = 1. - exp(-uFogDen * uFogDen * dist * dist);
  gl_FragColor = vec4(mix(col * vTone, uFogCol, fog), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; W.scene.add(mesh);
  return { n: g.instanceCount, tris: g.instanceCount * 4 };
}

// ---------------------------------------------------------------- the town's small churches and halls
// Two are typed places: the small church with a bell turret at (-112, -48) (turret top y 21, 26 m right of the line
// over the lane) and the one with a slate spire at (176, 236) on the southern bank, south of the market's square
// (tip y 35, 30 m left of the line as it turns west over the bank). About forty more
// are drawn by the seed over the whole town inside the wall, each 130 m and more from the next, 110 m and more
// from the great church and 45 m and more from the flown line's track; which of them carry a turret, a tower or a
// spire is the seed's draw. Each has one bell that swings at full swing by the world's clock, from clock 0.
// The northern bank's two halls are typed too: the town hall at (-60, -230), the market hall at (-260, -260).
const CHURCH_STONE = [0.27, 0.25, 0.225];
function layChurches(W, plan) {
  const R = W.RNG.churches, P = new THREE.Vector3(), sites = [];
  const RX = [], RZ = []; for (let m = 0; m <= W.LEN; m += 4) { W.path.posAtDist(m, P); RX.push(P.x); RZ.push(P.z); }
  sites.push({ x: -112, z: -48, yaw: 0, len: 17, wid: 8, wall: 8, rise: 6, kind: 'turret', th: 14, slate: true, bell: 0.8, twin: true });
  sites.push({ x: 176, z: 236, yaw: 0, len: 20, wid: 9, wall: 9, rise: 6.5, kind: 'spire', th: 18.6, ts: 2.6, cap: 15.4, slate: false, bell: 0.9 });
  const want = Math.round(38 + R.range(0, 5));
  for (let tries = 0; tries < 900 && sites.length < want + 2; tries++) {
    const x = R.range(-1380, 1180), z = R.range(-1280, 1280), kd = R(), yaw = R.range(-0.2, 0.2);
    const s = { x, z, yaw, len: R.range(16, 26), wid: R.range(7.5, 10.5), wall: R.range(7.5, 11), rise: R.range(5.5, 8), kind: kd < 0.15 ? 'turret' : kd < 0.45 ? 'tower' : 'spire', ts: R.range(2.5, 3.3), slate: R() < 0.6, bell: R.range(0.6, 0.95) };
    s.th = s.kind === 'turret' ? s.wall + s.rise : R.range(19, 30); s.cap = s.kind === 'spire' ? R.range(17, 30) : R.range(6, 11);
    if (Math.hypot(x - WALL_C[0], z - WALL_C[1]) > WALL_R - 70) continue;
    if (!(onIsland(x, z, 16) || z < bankN(x) - 26 || z > bankS(x) + 24) || onBridge(x, z)) continue;
    if (Math.hypot(Math.max(-x, x - CHURCH.length, 0), Math.max(Math.abs(z) - CHURCH.southFace, 0)) < 110 || inClose(x, z)) continue;
    let ok = true;
    for (const o of sites) if (Math.hypot(o.x - x, o.z - z) < 130) { ok = false; break; }
    for (let i = 0; i < RX.length && ok; i++) if (Math.hypot(RX[i] - x, RZ[i] - z) < 45) ok = false;
    for (const hall of [[-60, -230], [-260, -260]]) if (Math.hypot(hall[0] - x, hall[1] - z) < 70) ok = false;
    for (const b of BRIDGES) if (Math.abs(b.x - x) < 22) ok = false;
    if (ok) sites.push(s);
  }
  // a plot is what stands on it and an alley round it: a small church's own (churchRect); the town hall's (its
  // roof's eaves 15.4 by 8.4 m, its two river turrets' cones 2.7 m about (15, 8)); the market hall's (its roof's
  // eaves 22.5 by 9.6); the chapel's behind the great house by the entry (its roof's eaves 11.3 by 4.4).
  // THE GREAT HOUSE'S OWN PLOT BY THE ENTRY IS TYPED and is no such sum: x -341 to -267, z -102 to -64
  // (a site the seed draws on a landmark's plot is gone: it keeps its plot on the plan and is not built)
  for (const s of sites) { s.y = groundY(s.x, s.z); const r = churchRect(s, ALLEY); s.gone = onMarkPlot(r); plan.add(r); }
  plan.add({ x: -60, z: -230 + (8 + 2.7 - 8.4) / 2, ux: 1, uz: 0, a: 15 + 2.7 + ALLEY, b: (8 + 2.7 + 8.4) / 2 + ALLEY }); plan.add({ x: -260, z: -260, ux: 1, uz: 0, a: 22.5 + ALLEY, b: 9.6 + ALLEY });
  plan.add({ x: GREAT_HOUSE.x, z: GREAT_HOUSE.z - 3, ux: 1, uz: 0, a: GREAT_HOUSE.a, b: GREAT_HOUSE.b + 6 }); plan.add({ x: -290, z: -62, ux: 1, uz: 0, a: 11.3 + ALLEY, b: 4.4 + ALLEY });
  return sites;
}
// ---------------------------------------------------------------- the three landmarks of the southern bank
// (their places, their plots and what they are: see COLLEGE, FRIARY and GATE before the houses' laying. Every
// height here is over the landmark's own ground. They are built into the small churches' stone mesh.)
const MARK_DARK = [0.032, 0.034, 0.042];
// the gate's stone: the town's old church stone weathered darker (its towers look full into the low sun)
const MARK_OLD = CHURCH_STONE.map((c) => c * 0.62);
// the friary's stone is the great church's own (the part's wall stone, to the number): a lit gable of the friary
// and the church's lit front are one stone. MARK_PALE: the landmarks' dressed stone, pale and worn (window frames
// and tracery, string courses, copings, pinnacles, the gate's corbelled rings). CONE_SLATE: the town's slate, a
// little bluer, so that the gate's cones stay blue-grey where the low sun lies full on them
const FRIARY_STONE = [0.255, 0.232, 0.213], MARK_PALE = [0.4, 0.375, 0.335], CONE_SLATE = [0.07, 0.1, 0.17];
// their masses in the shade grid, like every mass of the town, before the houses learn their shade
function shadeMarks(S) {
  const C = COLLEGE, F = FRIARY, G = GATE, yc = groundY(C.x, C.z), yf = groundY(F.x, F.z), yg = groundY(G.x, G.z);
  const put = (m, x0, x1, z0, z1, y) => { const r = markRect(m, x0, x1, z0, z1); S.block(r.x, r.z, r.ux, r.uz, r.a, r.b, y); };
  put(C, -C.half, C.half, -C.half, C.half, yc + C.wall + 1); put(C, C.nave[0], C.nave[1], -C.naveHalf, C.naveHalf, yc + C.naveWall + (C.ridge - C.naveWall) * 0.5);
  put(F, -F.len / 2, F.len / 2, -F.nave * 1.5, F.nave * 1.5, yf + F.wall + (F.ridge - F.wall) * 0.5);
  for (const s of [-1, 1]) put(G, s * G.off - G.r, s * G.off + G.r, -G.r, G.r, yg + G.wall + 3);
  put(G, -G.block[0], G.block[0], -G.block[1], G.block[1], yg + G.blockWall + 3);
}
// what a ring of birds keeps clear of (see gatherTops): each roof by its own ground on the plan; the college's
// tower, the friary's needle and the gate's two towers are UPRIGHTS (a sixth number): no ring turns about one
function markTops() {
  const C = COLLEGE, F = FRIARY, G = GATE, yc = groundY(C.x, C.z), yf = groundY(F.x, F.z), yg = groundY(G.x, G.z), T = [];
  const rect = (m, x0, x1, z0, z1, top) => { const r = markRect(m, x0, x1, z0, z1); T.push([r.x, r.z, Math.hypot(r.a, r.b), top, r]); };
  T.push([C.x, C.z, C.half * 1.42 + 1.4, yc + C.turret, undefined, true]);
  rect(C, C.nave[0], C.nave[1] + 0.5, -C.naveHalf - 1.5, C.naveHalf + 1.5, yc + C.ridge);
  rect(C, C.garth[0], C.garth[1], C.garth[2], -C.naveHalf, yc + 5.8);
  rect(F, -F.len / 2 - 0.4, F.len / 2, -F.nave * 1.5 - 0.5, F.nave * 1.5 + 0.5, yf + F.ridge);
  T.push([F.x, F.z, 2.2, yf + F.needle[2], undefined, true]);
  for (const s of [-1, 1]) T.push([G.x + s * G.off, G.z, G.r + 1.2, yg + G.cone, undefined, true]);
  rect(G, -G.block[0], G.block[0], -G.block[1] - 0.8, G.block[1] + 0.8, yg + G.ridge);
  return T;
}
// THE COLLEGE: a plain square bell tower with an open bell stage under a low lead cap between four slim corner
// turrets; behind it one long high nave under a steep slate roof, tall windows between plain buttresses; a
// cloister of four low walks round a garth on its north-east side. One bell on an oak frame in the stage.
function buildCollege(g, R, bells) {
  const C = COLLEGE, y0 = groundY(C.x, C.z), h = C.half, [s0, s1] = C.stage, cy = Math.cos(C.yaw), sy = Math.sin(C.yaw);
  const toW = (lx, ly, lz) => [C.x + lx * cy + lz * sy, y0 + ly, C.z - lx * sy + lz * cy];
  g.at(C.x, y0, C.z, C.yaw);
  // the tower's shaft, solid to the bell stage
  g.col(CHURCH_STONE, 0.95).mat(0, 0).box(-h, -3, -h, h, s0, h, 0, 1 | 2 | 8 | 16 | 32);
  // the bell stage: two tall pointed openings a face, the sky through them and the bell between
  const lights = [-1, 1].map((k) => ({ c: k * 2.45, w: 1.45, yb: s0 + 1.2, ys: s1 - 3.6, ya: s1 - 1, d: 1, n: 4 }));
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const F = wallFrame([nx * h, 0, nz * h], [nx, 0, nz]), FI = wallFrame([nx * (h - 1), 0, nz * (h - 1)], [-nx, 0, -nz]);
    g.col(CHURCH_STONE, 0.95).mat(0, 0); archWall(g, F, -h, h, s0, C.wall, lights, 0.5);
    g.col(CHURCH_STONE, 0.7).mat(0, 0.6); archWall(g, FI, -h + 1, h - 1, s0, C.wall, lights.map((o) => ({ ...o, d: 0 })), 0.5);
    // two slits in the shaft
    g.col(MARK_DARK).mat(7, 0); for (const y of [13, 25]) g.quad(F.p(-0.3, y, -0.04), F.p(0.3, y, -0.04), F.p(0.3, y + 2.4, -0.04), F.p(-0.3, y + 2.4, -0.04));
  }
  // string courses, the wall's head, the low lead cap
  g.col(CHURCH_STONE, 1.1).mat(0, 0);
  for (const y of [C.naveWall + 1.2, s0 - 0.5, s1 + 0.2]) g.box(-h - 0.16, y, -h - 0.16, h + 0.16, y + 0.4, h + 0.16, 12, 1 | 2 | 8 | 16 | 32);
  g.col(LEAD_C).mat(1, 0).box(-h, C.wall - 0.1, -h, h, C.wall, h, 0, 8).cyl(0, 0, C.wall, C.cap, (h - 0.5) * 1.4142, 0, 4, { phase: Math.PI / 4 });
  // four slim corner turrets from the ground, each under a small lead cone
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tx = sx * (h - 0.25), tz = sz * (h - 0.25);
    g.col(CHURCH_STONE, 1.02).mat(0, 0).cyl(tx, tz, -3, C.cap + 0.6, 1.2, 1.1, 8, { phase: Math.PI / 8 });
    g.col(CHURCH_STONE, 1.12).cyl(tx, tz, C.cap + 0.6, C.cap + 1, 1.3, 1.3, 8, { phase: Math.PI / 8, cap: true });
    g.col(LEAD_C).mat(1, 0).cyl(tx, tz, C.cap + 1, C.turret, 1.25, 0, 8, { phase: Math.PI / 8 });
  }
  // the bell's frame of black oak: a trestle at either end of the axle on a sill; the bell swings between them
  const ya = s0 + 4.7;
  g.col(TIMBER, 0.9).mat(5, 0);
  for (const sz of [-1, 1]) {
    const z = sz * 2.15;
    g.beam([-1.9, s0 + 0.2, z], [-0.25, ya, z], 0.42, 0.42, 3).beam([1.9, s0 + 0.2, z], [0.25, ya, z], 0.42, 0.42, 3);
    g.beam([-2.3, s0 + 0.22, z], [2.3, s0 + 0.22, z], 0.44, 0.44, 3, true).box(-0.5, ya - 0.25, z - 0.24, 0.5, ya + 0.25, z + 0.24, 15);
  }
  bells.push([toW(0, ya, 0), C.yaw, 2.4, R.range(2.7, 3.3), R.range(0, 6.28)]);
  // the nave: six tall windows a side between plain buttresses
  const [n0, n1] = C.nave, b = C.naveHalf, w = C.naveWall, bay = (n1 - n0) / 6, mid = (n0 + n1) / 2;
  for (const sz of [-1, 1]) {
    const F = wallFrame([mid, 0, sz * b], [0, 0, sz]), holes = [];
    for (let i = 0; i < 6; i++) holes.push({ c: (i - 2.5) * bay, w: 1.5, yb: 6.2, ys: 14.2, ya: 17, d: 0.6, n: 3 });
    g.col(CHURCH_STONE).mat(0, 0); archWall(g, F, -(n1 - n0) / 2, (n1 - n0) / 2, -3, w, holes, 0.5);
    g.col([1, 1, 1]).mat(6, 0); for (const o of holes) archFill(g, F, o, 0.58);
    g.col(CHURCH_STONE, 1.08).mat(0, 0);
    for (const o of holes) bar(g, F, [o.c, o.yb], [o.c, o.ya - 0.5], 0.3, 0.3, 0.58);
    for (let i = 0; i <= 6; i++) { const x = n0 + i * bay; g.box(x - 0.6, -3, sz > 0 ? b : -b - 1.5, x + 0.6, 16.4, sz > 0 ? b + 1.5 : -b, 3, 1 | 2 | 8 | (sz > 0 ? 32 : 16)); }
  }
  // its east gable with one great window; the west gable's two strips beside the tower
  const FE = wallFrame([n1, 0, 0], [1, 0, 0]), east = { c: 0, w: 3.1, yb: 6.2, ys: 14, ya: 18.6, d: 0.7, n: 4 }, wy = w + (C.ridge - w) * (b - h) / b;
  g.col(CHURCH_STONE).mat(0, 0); archWall(g, FE, -b, b, -3, w, [east], 0.5);
  g.tri([n1, w, b], [n1, w, -b], [n1, C.ridge, 0]);
  g.box(n0, -3, -b, n0, w, -h, 0, 1).box(n0, -3, h, n0, w, b, 0, 1).tri([n0, w, -b], [n0, w, -h], [n0, wy, -h]).tri([n0, w, h], [n0, w, b], [n0, wy, h]);
  for (const sz of [-1, 1]) g.box(n1, -3, sz * b - 0.6, n1 + 1, 16.4, sz * b + 0.6, 3, 2 | 8 | 16 | 32);
  g.col([1, 1, 1]).mat(6, 0); archFill(g, FE, east, 0.68);
  g.col(CHURCH_STONE, 1.08).mat(0, 0); tracery(g, FE, east, 0.3, 0.68, 0.32);
  // its steep slate roof
  g.col(SLATE).mat(2, 3);
  g.quad([n0, w - 0.25, b + 0.45], [n1 + 0.4, w - 0.25, b + 0.45], [n1 + 0.4, C.ridge, 0], [n0, C.ridge, 0], 8);
  g.quad([n1 + 0.4, w - 0.25, -b - 0.45], [n0, w - 0.25, -b - 0.45], [n0, C.ridge, 0], [n1 + 0.4, C.ridge, 0], 8);
  // the cloister: four low walks under lean-to slate roofs round the garth, a row of dark pointed bays to it
  const [gx0, gx1, gz0] = C.garth, gz1 = -b, wk = C.walk, yo = 5.6, yi = 3.4;
  const walk = (ax, az, bx, bz, nx, nz, outer) => {
    // p to q runs along the walk with the garth on the side of (nx, nz)
    const fwd = (bx - ax) * nz - (bz - az) * nx > 0, px = fwd ? ax : bx, pz = fwd ? az : bz, qx = fwd ? bx : ax, qz = fwd ? bz : az, L = Math.hypot(qx - px, qz - pz);
    g.col(CHURCH_STONE, 0.98).mat(0, 0);
    if (outer) g.quad([qx, -2, qz], [px, -2, pz], [px, yo, pz], [qx, yo, qz], 8);
    g.quad([px + nx * wk, -2, pz + nz * wk], [qx + nx * wk, -2, qz + nz * wk], [qx + nx * wk, yi, qz + nz * wk], [px + nx * wk, yi, pz + nz * wk]);
    const F = wallFrame([(px + qx) / 2 + nx * wk, 0, (pz + qz) / 2 + nz * wk], [nx, 0, nz]);
    g.col(MARK_DARK).mat(7, 0);
    for (let a = -L / 2 + wk + 1.6; a < L / 2 - wk - 1; a += 3) archFill(g, F, { c: a, w: 0.95, yb: 0.5, ys: 2, ya: 2.9, n: 2 }, -0.03);
    g.col(SLATE).mat(2, 0).quad([px + nx * (wk + 0.3), yi - 0.15, pz + nz * (wk + 0.3)], [qx + nx * (wk + 0.3), yi - 0.15, qz + nz * (wk + 0.3)], [qx - nx * 0.2, yo + 0.1, qz - nz * 0.2], [px - nx * 0.2, yo + 0.1, pz - nz * 0.2], 8);
  };
  walk(gx0, gz0, gx1, gz0, 0, 1, true); walk(gx0, gz0, gx0, gz1, 1, 0, true); walk(gx1, gz0, gx1, gz1, -1, 0, true); walk(gx0, gz1, gx1, gz1, 0, -1, false);
}
// the garth's five bare trees ([x, z] in the college's own frame)
const GARTH_TREES = [[20, -27.5], [34, -27.5], [27, -22], [20, -16.5], [34, -16.5]];
// THE FRIARY OF THREE GABLES: three naves abreast, their three gabled fronts in one face to the east: CHURCH FRONTS
// of the great church's own stone. Each gable has one great window (a moulded frame and tracery of pale worn stone
// about dark glass, a few panes warm), a round opening in a pale ring in its point, and a pale coping up both its
// rakes that stands a hand over the roof and carries snow; under the three gables runs a pale string course;
// between them and at the two corners stand buttresses in two stages that rise into slim pinnacles (their offsets,
// collars and the string course are ledges where snow lies). Three long steep slate roofs under snow; over the
// middle one a slim open lead needle with the sky through it.
// (Every stone of it stands inside the plot its roofs' rectangle takes on the plan, and under its ridge.)
function buildFriary(g, R) {
  const F = FRIARY, y0 = groundY(F.x, F.z), hl = F.len / 2, hb = F.nave / 2, xe = hl - 1.6, w = F.wall, r = F.ridge, sl = (r - w - 0.3) / hb;
  g.at(F.x, y0, F.z, F.yaw);
  for (let k = -1; k <= 1; k++) {
    const zc = k * F.nave, FE = wallFrame([xe, 0, zc], [1, 0, 0]), great = { c: 0, w: 3.3, yb: 6.5, ys: 15.5, ya: 21, d: 0.8, n: 5 };
    g.col(FRIARY_STONE).mat(0, 0); archWall(g, FE, -hb, hb, -3, w, [great], 0.5);
    g.tri([xe, w, zc + hb], [xe, w, zc - hb], [xe, r, zc]);
    g.col([1, 1, 1]).mat(6, 0); archFill(g, FE, great, 0.72);
    // the window's frame and tracery of pale stone: a roll about the opening, four lights under a ring
    g.col(MARK_PALE).mat(0, 0); moulding(g, FE, great, 0.5, 0.22);
    tracery(g, FE, great, 0.26, 0.72, 0.44);
    for (const s of [-1, 1]) bar(g, FE, [s * 1.65, great.yb], [s * 1.65, great.ys + 1.2], 0.36, 0.26, 0.72);
    bar(g, FE, [-great.w, 11], [great.w, 11], 0.36, 0.26, 0.72);
    // a few panes warm: which, by the landmarks' own draws
    g.col([0.62, 0.3, 0.09]).mat(8, 0);
    for (let i = 0, n = 2 + Math.floor(R.range(0, 2)); i < n; i++) {
      const li = Math.floor(R.range(0, 4)), row = Math.floor(R.range(0, 6)), a = (li - 2) * 1.65 + 0.3, y = 7 + row * 1.25 + (row >= 3 ? 0.6 : 0);
      g.quad(FE.p(a, y, 0.66), FE.p(a + 1.05, y, 0.66), FE.p(a + 1.05, y + 0.95, 0.66), FE.p(a, y + 0.95, 0.66));
    }
    // a round opening in the gable's point, in a pale ring
    const oy = 27.2, or = 1.05;
    g.col(MARK_DARK).mat(7, 0);
    for (let i = 0; i < 12; i++) { const a0 = i * Math.PI / 6, a1 = a0 + Math.PI / 6; g.tri(FE.p(0, oy, -0.04), FE.p(Math.cos(a0) * or, oy + Math.sin(a0) * or, -0.04), FE.p(Math.cos(a1) * or, oy + Math.sin(a1) * or, -0.04)); }
    g.col(MARK_PALE).mat(0, 0); arcBars(g, FE, 0, oy, or + 0.14, 0, Math.PI * 2, 12, 0.3, -0.16, 0);
    // the coping up both rakes: a pale slab that stands 0.35 m over the roof at the gable's foot and ends level with
    // the ridge; its top holds snow as the roof does
    for (const s of [-1, 1]) {
      const zf = zc + s * hb, yf = w + 0.65, x0 = xe - 0.3, x1 = xe + 0.6;
      g.col(MARK_PALE, 0.95).mat(2, 3);
      if (s > 0) g.quad([x0, yf, zf], [x1, yf, zf], [x1, r, zc], [x0, r, zc], 8); else g.quad([x1, yf, zf], [x0, yf, zf], [x0, r, zc], [x1, r, zc], 8);
      g.col(MARK_PALE).mat(0, 0);
      if (s > 0) g.quad([x1, yf - 0.5, zf], [x1, r - 0.5, zc], [x1, r, zc], [x1, yf, zf]); else g.quad([x1, r - 0.5, zc], [x1, yf - 0.5, zf], [x1, yf, zf], [x1, r, zc]);
    }
    // the west gable: plain, one tall narrow window
    const FW = wallFrame([-hl, 0, zc], [-1, 0, 0]), slim = { c: 0, w: 1.2, yb: 8, ys: 17, ya: 19.6, d: 0.6, n: 3 };
    g.col(FRIARY_STONE).mat(0, 0); archWall(g, FW, -hb, hb, -3, w, [slim], 0.5); g.tri([-hl, w, zc - hb], [-hl, w, zc + hb], [-hl, r, zc]);
    g.col([1, 1, 1]).mat(6, 0); archFill(g, FW, slim, 0.58);
    // its roof (from the west gable to the east coping's back): the eaves stand out over the two outer walls only
    // (a valley between two naves)
    const o1 = k === 1 ? 0.45 : 0, o0 = k === -1 ? 0.45 : 0;
    g.col(SLATE).mat(2, 3);
    g.quad([-hl - 0.3, w + 0.3 - o1 * sl, zc + hb + o1], [xe - 0.3, w + 0.3 - o1 * sl, zc + hb + o1], [xe - 0.3, r, zc], [-hl - 0.3, r, zc], 8);
    g.quad([xe - 0.3, w + 0.3 - o0 * sl, zc - hb - o0], [-hl - 0.3, w + 0.3 - o0 * sl, zc - hb - o0], [-hl - 0.3, r, zc], [xe - 0.3, r, zc], 8);
  }
  // the pale string course under the gables, from buttress to buttress
  g.col(MARK_PALE).mat(0, 0);
  for (let k = -1; k <= 1; k++) g.box(xe, w - 0.5, k * F.nave - hb + 0.7, xe + 0.4, w, k * F.nave + hb - 0.7, 12, 2 | 4 | 8);
  // the buttresses between the fronts and at their two corners: two stages with an offset, then a slim pinnacle
  // (a square shaft, a collar, a steep four-sided point) to 30.2 m
  for (const q of [-3, -1, 1, 3]) {
    const zb = Math.abs(q) === 3 ? Math.sign(q) * (3 * hb - 0.4) : q * hb, xp = xe + 0.75;
    g.col(FRIARY_STONE, 1.04).mat(0, 0);
    g.box(xe, -3, zb - 0.9, hl, 11.5, zb + 0.9, 3, 2 | 8 | 16 | 32).box(xe, 11.5, zb - 0.75, hl - 0.4, w - 0.6, zb + 0.75, 3, 2 | 8 | 16 | 32);
    g.col(MARK_PALE).box(xp - 0.5, w - 0.6, zb - 0.5, xp + 0.5, 26.4, zb + 0.5, 3, 1 | 2 | 16 | 32).box(xp - 0.66, 26.4, zb - 0.66, xp + 0.66, 26.75, zb + 0.66, 15, 63);
    g.cyl(xp, zb, 26.75, 30.2, 0.56 * Math.SQRT2, 0, 4, { phase: Math.PI / 4 });
  }
  // the two long sides: six tall windows each between flat buttresses
  for (const sz of [-1, 1]) {
    const L = (xe + hl) / 2, FS = wallFrame([(xe - hl) / 2, 0, sz * hb * 3], [0, 0, sz]), bay = 2 * L / 6, holes = [];
    for (let i = 0; i < 6; i++) holes.push({ c: (i - 2.5) * bay, w: 1.4, yb: 7, ys: 16, ya: 19, d: 0.6, n: 3 });
    g.col(FRIARY_STONE).mat(0, 0); archWall(g, FS, -L, L, -3, w, holes, 0.5);
    g.col([1, 1, 1]).mat(6, 0); for (const o of holes) archFill(g, FS, o, 0.58);
    g.col(MARK_PALE).mat(0, 0);
    for (const o of holes) bar(g, FS, [o.c, o.yb], [o.c, o.ya - 0.5], 0.3, 0.3, 0.58);
    g.col(FRIARY_STONE, 1.08);
    for (let i = 0; i <= 6; i++) { const x = -hl + i * bay; g.box(Math.max(x - 0.6, -hl - 0.4), -3, sz > 0 ? hb * 3 : -hb * 3 - 0.5, x + 0.6, 20.6, sz > 0 ? hb * 3 + 0.5 : -hb * 3, 3, 1 | 2 | 8 | (sz > 0 ? 32 : 16)); }
  }
  // the needle: a lead foot astride the middle ridge, an open stage of eight slim posts, a slim lead spire
  const [n0, n1, n2] = F.needle, P8 = Math.PI / 8;
  g.col(LEAD_C).mat(1, 0).cyl(0, 0, r - 2.4, n0, 2.2, 1.75, 8, { phase: P8 }).cyl(0, 0, n0, n0 + 0.35, 1.9, 1.9, 8, { phase: P8, cap: true });
  for (let i = 0; i < 8; i++) { const a = P8 + i * Math.PI / 4, x = Math.cos(a) * 1.5, z = Math.sin(a) * 1.5; g.beam([x, n0 + 0.35, z], [x, n1 - 0.4, z], 0.32, 0.32, 3); }
  g.cyl(0, 0, n1 - 0.4, n1, 1.75, 1.85, 8, { phase: P8 }).cyl(0, 0, n1, n2, 1.6, 0, 8, { phase: P8 });
}
// THE BRIDGE GATE: two fat round towers under DARK slate cones (the part's cone law: snow on their weather side to
// a little over half way up and in a line along the skirt, streaks of it down the other slates, the steep upper
// cone bare; a lead knob and a slim lead rod on each point: the rod's tip is the tower's top), their heads standing
// out on a RING OF SIXTEEN CORBELS, each of the tower's own stone and lighter than the band of deep shade that runs
// round between and behind them, under a pale ledge where snow lies; between them the gate's block with the
// passage through it over the roadway's ramp, under a high slate roof; small deep windows, of each tower's eight
// one in four lit by a lamp (a stream of that law alone: steady warm glass over a lit sill).
function buildGate(g, R) {
  const G = GATE, y0 = groundY(G.x, G.z), [bx, bz] = G.block, [aw, as, ap] = G.arch, R0 = G.r, P8 = Math.PI / 8, yc = G.wall - 3.4, tip = G.cone - 1.6;
  g.at(G.x, y0, G.z, G.yaw);
  for (const s of [-1, 1]) {
    const cx = s * G.off;
    g.col(MARK_OLD, 0.92).mat(0, 0).cyl(cx, 0, -7, yc + 1, R0, R0, 16);
    // the head: the ring of corbels before its band of shade, the pale ledge on them, the parapet's wall standing
    // out on it; the cone
    g.col(MARK_OLD, 1.25);
    for (let i = 0; i < 16; i++) { const a = (i + 0.5) * P8, c = Math.cos(a), sn = Math.sin(a); g.beam([cx + c * (R0 - 0.3), yc + 0.2, sn * (R0 - 0.3)], [cx + c * (R0 + 0.72), yc + 0.2, sn * (R0 + 0.72)], 0.62, 1.3, 3, true); }
    g.col(MARK_DARK).mat(0, 0.9).cyl(cx, 0, yc - 0.45, yc + 0.82, R0 + 0.06, R0 + 0.06, 16); g.mat(0, 0);
    g.col(MARK_PALE).cyl(cx, 0, yc + 0.82, yc + 1.1, R0 + 1.05, R0 + 1.05, 16, { fl: 12 }).cyl(cx, 0, yc + 1.1, yc + 1.12, R0 + 1.05, R0 + 0.75, 16);
    g.col(MARK_PALE, 0.8).cyl(cx, 0, yc + 1.1, G.wall, R0 + 0.75, R0 + 0.75, 16, { fl: 12 });
    g.col(CONE_SLATE).mat(2, 4).cyl(cx, 0, G.wall - 0.15, tip, R0 + 1.15, 0, 16);
    g.col(LEAD_C, 1.1).mat(1, 0).cyl(cx, 0, tip - 0.9, tip - 0.1, 0.62, 0.2, 8).cyl(cx, 0, tip - 0.1, tip + 0.3, 0.2, 0.42, 8).cyl(cx, 0, tip + 0.3, tip + 0.7, 0.42, 0.14, 8).cyl(cx, 0, tip + 0.7, G.cone, 0.13, 0.04, 6);
    // small windows, deep in the wall
    // (one in four of them lit, by the gate's own stream, one draw a window: lit glass over a lit sill)
    for (let i = 0; i < 16; i += 2) {
      const a = (i + 0.5) * P8, y = i % 4 ? 15 : 9.5, rr = R0 * Math.cos(P8 / 2) + 0.04, FT = wallFrame([cx + Math.cos(a) * rr, 0, Math.sin(a) * rr], [Math.cos(a), 0, Math.sin(a)]), lit = R() < 0.25;
      g.col(lit ? LAMP_GLASS : MARK_DARK).mat(lit ? 8 : 7, 0).quad(FT.p(-0.32, y), FT.p(0.32, y), FT.p(0.32, y + 1.9), FT.p(-0.32, y + 1.9));
      if (lit) g.col(LAMP_SILL).quad(FT.p(-0.45, y - 0.2), FT.p(0.45, y - 0.2), FT.p(0.45, y), FT.p(-0.45, y));
    }
  }
  // the block: the passage through it, three slits over the arch on either face, a parapet on corbels
  for (const sz of [-1, 1]) {
    const FG = wallFrame([0, 0, sz * bz], [0, 0, sz]);
    g.col(MARK_OLD, 0.96).mat(0, 0); archWall(g, FG, -bx, bx, -3, G.blockWall, [{ c: 0, w: aw, yb: -3, ys: as, ya: ap, d: sz < 0 ? bz * 2 : 0, n: 5, sill: false }], 0.75);
    g.col(MARK_DARK).mat(7, 0); for (const c of [-3.2, 0, 3.2]) g.quad(FG.p(c - 0.3, 13.6, -0.04), FG.p(c + 0.3, 13.6, -0.04), FG.p(c + 0.3, 15.6, -0.04), FG.p(c - 0.3, 15.6, -0.04));
    g.col(MARK_PALE, 0.9).mat(0, 0);
    for (let i = 0; i < 9; i++) { const x = (i - 4) * 1.45; g.box(x - 0.3, G.blockWall - 2.6, sz > 0 ? bz : -bz - 0.6, x + 0.3, G.blockWall - 1.5, sz > 0 ? bz + 0.6 : -bz, 3, 1 | 2 | 4 | (sz > 0 ? 32 : 16)); }
    g.col(MARK_PALE, 0.8).box(-bx, G.blockWall - 1.5, sz > 0 ? bz : -bz - 0.7, bx, G.blockWall + 0.4, sz > 0 ? bz + 0.7 : -bz, 12, 1 | 2 | 4 | 8 | (sz > 0 ? 32 : 16));
  }
  g.col(SLATE).mat(2, 3);
  g.quad([-bx, G.blockWall + 0.3, bz + 0.6], [bx, G.blockWall + 0.3, bz + 0.6], [bx, G.ridge, 0], [-bx, G.ridge, 0], 8);
  g.quad([bx, G.blockWall + 0.3, -bz - 0.6], [-bx, G.blockWall + 0.3, -bz - 0.6], [-bx, G.ridge, 0], [bx, G.ridge, 0], 8);
}
// the three of them into the builder g; what comes back: the college's bell ([place, turn, size, period, phase])
async function buildMarks(W, g) {
  const R = W.RNG.marks, bells = [];
  buildCollege(g, R, bells); await W.ctx.yield();
  buildFriary(g, R); await W.ctx.yield();
  buildGate(g, W.RNG.gate);
  return bells;
}
// a plain bell for the small churches: unit lip 1 m, hung from the origin, its axle along z
function smallBell() {
  const g = makeGB(), prof = [[0.5, -0.95], [0.4, -0.8], [0.29, -0.45], [0.2, -0.16]];
  g.col([0.17, 0.15, 0.11]).mat(7, 0);
  for (let i = 0; i < prof.length - 1; i++) g.cyl(0, 0, prof[i][1], prof[i + 1][1], prof[i][0], prof[i + 1][0], 8);
  g.cyl(0, 0, -0.16, -0.1, 0.2, 0, 8);
  g.col(TIMBER, 1.2).mat(5, 0).box(-0.14, -0.14, -0.7, 0.14, 0.12, 0.7, 15);
  return g.build();
}

// ---------------------------------------------------------------- the small churches' and the halls' stone
async function buildChurches(W, sites) {
  const g = makeGB(), bells = [], cocks = [], c = Math.cos, sn = Math.sin;
  for (const s of sites) {
    await W.ctx.yield();
    // (a gone site's bells and cock keep their places in the lists, so that every other bell's and cock's draws are its own, and are not set up)
    if (s.gone) { for (let i = 0; i < (s.kind === 'turret' && s.twin ? 2 : 1); i++) bells.push(null); cocks.push(null); continue; }
    const hl = s.len / 2, hw = s.wid / 2, top = s.wall + s.rise, roofC = s.slate ? SLATE : TILE, toW = (lx, ly, lz) => [s.x + lx * c(s.yaw) + lz * sn(s.yaw), s.y + ly, s.z - lx * sn(s.yaw) + lz * c(s.yaw)];
    g.at(s.x, s.y, s.z, s.yaw);
    // the nave, its roof, and a lower chancel at the east end
    g.col(CHURCH_STONE).mat(0, 0).box(-hl, -3, -hw, hl, s.wall, hw, 3, 1 | 2 | 16 | 32);
    g.tri([-hl, s.wall, -hw], [-hl, s.wall, hw], [-hl, top, 0]); g.tri([hl, s.wall, hw], [hl, s.wall, -hw], [hl, top, 0]);
    const cl = s.len * 0.3, cw = hw * 0.72, cwall = s.wall * 0.8, ctop = cwall + s.rise * 0.72, xe = hl + cl;
    g.box(hl, -3, -cw, xe, cwall, cw, 3, 2 | 16 | 32); g.tri([xe, cwall, cw], [xe, cwall, -cw], [xe, ctop, 0]);
    g.col(roofC).mat(2, 0);
    g.quad([-hl - 0.3, s.wall - 0.2, hw + 0.4], [hl + 0.3, s.wall - 0.2, hw + 0.4], [hl + 0.3, top, 0], [-hl - 0.3, top, 0], 8);
    g.quad([hl + 0.3, s.wall - 0.2, -hw - 0.4], [-hl - 0.3, s.wall - 0.2, -hw - 0.4], [-hl - 0.3, top, 0], [hl + 0.3, top, 0], 8);
    g.quad([hl, cwall - 0.2, cw + 0.3], [xe + 0.3, cwall - 0.2, cw + 0.3], [xe + 0.3, ctop, 0], [hl, ctop, 0], 8);
    g.quad([xe + 0.3, cwall - 0.2, -cw - 0.3], [hl, cwall - 0.2, -cw - 0.3], [hl, ctop, 0], [xe + 0.3, ctop, 0], 8);
    // tall dark windows down both sides
    g.col([1, 1, 1]).mat(6, 0);
    const nw = Math.max(3, Math.round(s.len / 4.5)), y0 = s.wall * 0.3, y1 = s.wall * 0.84;
    for (let i = 0; i < nw; i++) {
      const x = -hl + (i + 0.5) * s.len / nw, z = hw + 0.04;
      g.quad([x - 0.45, y0, z], [x + 0.45, y0, z], [x + 0.45, y1, z], [x - 0.45, y1, z]); g.quad([x + 0.45, y0, -z], [x - 0.45, y0, -z], [x - 0.45, y1, -z], [x + 0.45, y1, -z]);
    }
    if (s.kind === 'turret') {
      // a bell turret astride the west gable: a block, two posts, a small pointed cap; the bell swings between the posts
      // (the typed church under the line wears an open belfry of two lights: two bells swing side by side)
      const x0 = -hl - 0.1, x1 = -hl + 0.9, yb = top + 1.2, yp = top + 4.4, ow = s.twin ? 2.15 : 1.3;
      g.col(CHURCH_STONE, 1.05).mat(0, 0).box(x0, top - 1.4, -ow, x1, yb, ow, 15, 1 | 2 | 8 | 16 | 32);
      g.box(x0, yb, -ow, x1, yp, -ow + 0.45, 3, 1 | 2 | 16 | 32); g.box(x0, yb, ow - 0.45, x1, yp, ow, 3, 1 | 2 | 16 | 32);
      if (s.twin) g.box(x0, yb, -0.22, x1, yp, 0.22, 3, 1 | 2 | 16 | 32);
      g.box(x0 - 0.15, yp, -ow - 0.15, x1 + 0.15, yp + 0.3, ow + 0.15, 15, 63);
      if (s.twin) { const xm = (x0 + x1) / 2; g.col(roofC).mat(2, 0).quad([x1 + 0.3, yp + 0.3, ow + 0.3], [x1 + 0.3, yp + 0.3, -ow - 0.3], [xm, top + 6.6, -ow - 0.3], [xm, top + 6.6, ow + 0.3], 8).quad([x0 - 0.3, yp + 0.3, -ow - 0.3], [x0 - 0.3, yp + 0.3, ow + 0.3], [xm, top + 6.6, ow + 0.3], [xm, top + 6.6, -ow - 0.3], 8);
        g.col(CHURCH_STONE, 1.05).mat(0, 0).tri([x0 - 0.3, yp + 0.3, ow + 0.15], [x1 + 0.3, yp + 0.3, ow + 0.15], [xm, top + 6.6, ow + 0.15]).tri([x1 + 0.3, yp + 0.3, -ow - 0.15], [x0 - 0.3, yp + 0.3, -ow - 0.15], [xm, top + 6.6, -ow - 0.15]);
        for (const bz of [-0.98, 0.98]) bells.push([toW(xm, yp - 0.35, bz), s.yaw, s.bell * 0.9]);
        cocks.push(toW(xm, top + 6.6, 0));
      } else {
        g.col(roofC).mat(2, 0).cyl((x0 + x1) / 2, 0, yp + 0.3, top + 7, 1.75, 0, 4, { phase: Math.PI / 4 });
        bells.push([toW((x0 + x1) / 2, yp - 0.35, 0), s.yaw, s.bell]); cocks.push(toW((x0 + x1) / 2, top + 7, 0));
      }
    } else {
      // a square west tower: solid below, an open stage of four corner piers for the bell, a cap or a spire
      const ts = s.ts, cx = -hl - ts + 0.5, yo = s.th - 5.2, yl = s.th - 0.9;
      g.col(CHURCH_STONE, 0.94).mat(0, 0).box(cx - ts, -3, -ts, cx + ts, yo, ts, 3, 1 | 2 | 8 | 16 | 32);
      // the bell stage: two pointed openings a face, the sky through them and the bell between
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const F = wallFrame([cx + nx * ts, 0, nz * ts], [nx, 0, nz]), hs = [-1, 1].map((k) => ({ c: k * ts * 0.45, w: ts * 0.27, yb: yo + 0.5, ys: yl - 1.5, ya: yl - 0.35, d: 0.3, n: 3 }));
        archWall(g, F, -ts, ts, yo, yl, hs, 0.5);
      }
      g.box(cx - ts - 0.15, yl, -ts - 0.15, cx + ts + 0.15, s.th, ts + 0.15, 15, 1 | 2 | 4 | 16 | 32);
      if (s.kind === 'spire') {
        // a slender eight-sided slate spire between four corner pinnacles
        g.col(SLATE).mat(2, 0).cyl(cx, 0, s.th, s.th + s.cap, ts + 0.1, 0, 8, { phase: Math.PI / 8 });
        g.col(CHURCH_STONE, 1.1).mat(0, 0);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(cx + sx * (ts - 0.35), sz * (ts - 0.35), s.th, s.th + 3.4, 0.5, 0, 4, { phase: Math.PI / 4 });
      } else g.col(roofC).mat(2, 0).cyl(cx, 0, s.th, s.th + s.cap, (ts + 0.3) * 1.414, 0, 4, { phase: Math.PI / 4 });
      // string courses and a stepped buttress at each corner of the tower's foot
      g.col(CHURCH_STONE, 1.12).mat(0, 0);
      for (const y of [s.wall + 1, yo - 0.5]) g.box(cx - ts - 0.14, y, -ts - 0.14, cx + ts + 0.14, y + 0.35, ts + 0.14, 15, 1 | 2 | 4 | 16 | 32);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(cx + sx * ts - 0.45, -3, sz * ts - 0.45, cx + sx * ts + 0.45, s.wall + 1, sz * ts + 0.45, 3, 1 | 2 | 4 | 16 | 32);
      bells.push([toW(cx, yl - 0.25, 0), s.yaw, s.bell * 1.5]); cocks.push(toW(cx, s.th + s.cap, 0));
    }
    W.shade.block(s.x, s.z, c(s.yaw), -sn(s.yaw), hl, hw, s.y + s.wall + s.rise * 0.5);
  }
  // the town hall: a tall house of pale stone under a hipped slate roof, a round turret at each river corner
  g.at(-60, BANK_Y, -230, 0);
  g.col([0.5, 0.47, 0.42]).mat(3, 0).box(-15, -1, -8, 15, 13, 8, 3, 1 | 2 | 16 | 32);
  g.col(SLATE).mat(2, 0);
  g.quad([-15.4, 12.8, 8.4], [15.4, 12.8, 8.4], [8, 21, 0], [-8, 21, 0], 8); g.quad([15.4, 12.8, -8.4], [-15.4, 12.8, -8.4], [-8, 21, 0], [8, 21, 0], 8);
  g.tri([-15.4, 12.8, -8.4], [-15.4, 12.8, 8.4], [-8, 21, 0]); g.tri([15.4, 12.8, 8.4], [15.4, 12.8, -8.4], [8, 21, 0]);
  for (const sx of [-1, 1]) { g.col(CHURCH_STONE, 1.2).mat(0, 0).cyl(sx * 15, 8, -1, 16, 2.3, 2.3, 8); g.col(SLATE).mat(2, 0).cyl(sx * 15, 8, 16, 22, 2.7, 0, 8); cocks.push([-60 + sx * 15, BANK_Y + 22, -222]); }
  // the market hall: long and low under one great tiled roof
  g.at(-260, BANK_Y, -260, 0);
  g.col([0.46, 0.42, 0.36]).mat(3, 1).box(-22, -1, -9, 22, 6.5, 9, 2, 1 | 2 | 16 | 32);
  g.tri([-22, 6.5, -9], [-22, 6.5, 9], [-22, 15.5, 0]); g.tri([22, 6.5, 9], [22, 6.5, -9], [22, 15.5, 0]);
  g.col(TILE).mat(2, 0);
  g.quad([-22.5, 6.2, 9.6], [22.5, 6.2, 9.6], [22.5, 15.5, 0], [-22.5, 15.5, 0], 8); g.quad([22.5, 6.2, -9.6], [-22.5, 6.2, -9.6], [-22.5, 15.5, 0], [22.5, 15.5, 0], 8);
  W.shade.block(-60, -230, 1, 0, 15, 8, 17); W.shade.block(-260, -260, 1, 0, 22, 9, 11);
  g.at(0, 0, 0, 0);
  await W.ctx.yield();
  // the three landmarks of the southern bank, in the same stone mesh
  const markBells = await buildMarks(W, g);
  g.at(0, 0, 0, 0);
  await W.ctx.yield();
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, 1); mesh.castShadow = true; mesh.receiveShadow = true; W.scene.add(mesh);   // of one instance: see the light's note in build()
  // the bells: one instanced mesh, each swinging about its own axle on its own period, from clock 0
  // (their periods and start phases on a stream of their own: no draw of theirs follows the count of the churches)
  // (a gone site's bell takes its draws and is left out; a landmark's bell comes after them all with its own period and phase)
  const R = W.RNG.churchbells, per = bells.map(() => R.range(1.5, 2.7)), ph = bells.map(() => R.range(0, 6.28));
  const hung = []; bells.forEach((b, i) => { if (b) hung.push([b[0], b[1], b[2], per[i], ph[i]]); }); for (const b of markBells) hung.push(b);
  const bm = new THREE.InstancedMesh(smallBell(), W.plainMat, hung.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const swing = (time) => { hung.forEach((b, i) => { Q.setFromAxisAngle(Y, b[1]).multiply(Q2.setFromAxisAngle(Z, 0.9 * Math.sin(Math.PI * 2 * time / b[3] + b[4]))); M.compose(P.set(b[0][0], b[0][1], b[0][2]), Q, Sc.set(b[2], b[2], b[2])); bm.setMatrixAt(i, M); }); bm.instanceMatrix.needsUpdate = true; };
  swing(0); bm.frustumCulled = false; W.scene.add(bm); W.updates.push((dt, time) => swing(time));
  return { bells: hung, cocks, tris: g.tris };
}

// ---------------------------------------------------------------- far and typed silhouettes
// The town's wall with its round towers 1.3 km out; the abbey on the schools' hill (its tower to y 85); the fortress
// of nine round towers in the west at (-1150, -330); a dark fortress of eight fat towers by the wall far in the
// east at (1240, -210); the ridge 2.4 km north with its twelve windmills. And beside the river's entry, on the
// island's north shore: a great stone house with three round towers standing in the water (centred on z -96.6 at
// x -330, -304, -278), and behind it at (-290, -62) a chapel with a slender open spire to y 60.
// THE GREAT HOUSE'S HEIGHT IS THE TOWN'S OWN: its towers' tips stand at the tallest kind's ridge at the top of its
// height draw, HOUSE_HIGH (1.08) of the table's 18.2 m: 19.66 m. (A house's other draw, 0.9 to 1.1 of its kind, is
// not in it: a house of that kind can stand to 21.6 m.) Its body is a little lower. A plain dwelling at the scale
// of the houses beside it.
const GREAT_TIP = TALLEST_RIDGE * HOUSE_HIGH;
const GREAT_HOUSE = { x: -304, z: -80, a: 37, b: 13, wall: 12.6, ridge: 19.5, tip: GREAT_TIP, top: GREAT_TIP + 2.9, tz: -96.6 };
function buildFar(W) {
  const g = makeGB(), R = W.RNG.far, mills = [], cocks = [], GREY = [0.2, 0.19, 0.185];
  const round = (x, z, y0, y1, r, cone, sides = 8, col = GREY, k = 1) => { g.col(col, k).mat(0, 0).cyl(x, z, y0, y1, r, r * 0.96, sides); if (cone > 0) g.col(SLATE).mat(2, 0).cyl(x, z, y1 - 0.2, y1 + cone, r * 1.12, 0, sides); else g.col(col, k * 0.9).mat(0, 0).cyl(x, z, y1, y1, r * 0.96, 0, sides); };
  // the wall: a ring broken where the river passes
  const N = 96, land = (x, z) => z < bankN(x) - 6 || z > bankS(x) + 6;
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, p = (a, r) => [WALL_C[0] + Math.cos(a) * r, WALL_C[1] + Math.sin(a) * r];
    const [x0, z0] = p(a0, WALL_R), [x1, z1] = p(a1, WALL_R), [u0, v0] = p(a0, WALL_R - 3), [u1, v1] = p(a1, WALL_R - 3);
    if (!land(x0, z0) || !land(x1, z1)) { if (land(x0, z0)) round(x0, z0, -6, groundY(x0, z0) + 17, 6.5, 6); continue; }
    const ya = groundY(x0, z0), yb = groundY(x1, z1);
    g.col(GREY, 1.1).mat(0, 0);
    g.quad([x0, ya - 3, z0], [x1, yb - 3, z1], [x1, yb + 9, z1], [x0, ya + 9, z0]); g.quad([u1, yb - 3, v1], [u0, ya - 3, v0], [u0, ya + 9, v0], [u1, yb + 9, v1]);
    g.quad([x0, ya + 9, z0], [x1, yb + 9, z1], [u1, yb + 9, v1], [u0, ya + 9, v0]);
    if (i % 2 === 0 || !land(...p(a0 - Math.PI * 2 / N, WALL_R))) round(x0, z0, ya - 3, ya + 15, 5, 5, 6);
  }
  // the abbey on the hill
  const hy = groundY(120, 620);
  g.at(120, hy, 620, 0.12);
  g.col(CHURCH_STONE, 1.05).mat(0, 0).box(-26, -4, -7, 26, 14, 7, 3, 1 | 2 | 16 | 32); g.tri([-26, 14, -7], [-26, 14, 7], [-26, 22, 0]); g.tri([26, 14, 7], [26, 14, -7], [26, 22, 0]);
  g.box(-36, -4, -5, -26, 85 - hy - 6, 5, 3, 1 | 2 | 8 | 16 | 32);
  g.col(SLATE).mat(2, 0).cyl(-31, 0, 85 - hy - 6, 85 - hy, 7.4, 0, 4, { phase: Math.PI / 4 });
  g.quad([-26, 13.8, 7.4], [26, 13.8, 7.4], [26, 22, 0], [-26, 22, 0], 8); g.quad([26, 13.8, -7.4], [-26, 13.8, -7.4], [-26, 22, 0], [26, 22, 0], 8);
  g.col(CHURCH_STONE, 0.9).mat(0, 0).box(-60, -6, -40, 60, 5, 40, 0, 1 | 2 | 16 | 32);
  g.at(0, 0, 0, 0);
  // the western fortress: nine round towers of slate grey and stone about a court
  { const fx = -1150, fz = -330, fy = BANK_Y;
    g.col(GREY, 1.25).mat(0, 0).box(fx - 34, fy - 2, fz - 24, fx + 34, fy + 19, fz + 24, 0, 1 | 2 | 8 | 16 | 32);
    for (const [dx, dz, h] of [[-34, -24, 29], [0, -24, 27], [34, -24, 29], [-34, 0, 27], [34, 0, 27], [-34, 24, 29], [0, 24, 27], [34, 24, 29], [0, 0, 37]]) round(fx + dx, fz + dz, fy - 2, fy + h, 6.5, 9, 8, [0.24, 0.225, 0.2], dz === 0 && dx === 0 ? 0.9 : 1); }
  // the eastern fortress by the wall: eight fat towers, a dark shape against the sunrise
  { const fx = 1240, fz = -210, fy = BANK_Y;
    g.col(GREY, 0.8).mat(0, 0).box(fx - 30, fy - 2, fz - 20, fx + 30, fy + 23, fz + 20, 0, 1 | 2 | 8 | 16 | 32);
    for (const [dx, dz] of [[-30, -20], [-10, -22], [10, -22], [30, -20], [-30, 20], [-10, 22], [10, 22], [30, 20]]) round(fx + dx, fz + dz, fy - 2, fy + 26, 9.5, 0, 8, GREY, 0.8); }
  // the northern ridge and its twelve windmills
  const ridge = (x) => 52 + 16 * Math.sin(x / 700 + 1.3) + 7 * Math.sin(x / 190);
  g.col(FIELD).mat(7, 0);
  for (let x = -2800; x < 2800; x += 200) {
    g.quad([x, BANK_Y, -2120], [x + 200, BANK_Y, -2120], [x + 200, ridge(x + 200), -2420], [x, ridge(x), -2420]);
    g.quad([x, ridge(x), -2420], [x + 200, ridge(x + 200), -2420], [x + 200, BANK_Y, -2900], [x, BANK_Y, -2900]);
  }
  // low snow hills two kilometres out to the east, south and west, opening where the river's valley passes
  const p1 = R.range(0, 6.28), p2 = R.range(0, 6.28), NH = 60;
  const hillY = (a) => (52 + 46 * (0.5 + 0.5 * Math.sin(3 * a + p1)) + 24 * Math.sin(7 * a + p2) + 10 * Math.sin(17 * a + p1 * 2)) * smoothstep(0.04, 0.3, Math.abs(Math.sin(a)));
  for (let i = 0; i < NH; i++) {
    const a0 = i / NH * Math.PI * 2, a1 = (i + 1) / NH * Math.PI * 2, h0 = hillY(a0), h1 = hillY(a1), r0 = 2050 + 180 * Math.sin(5 * a0 + p2), r1 = 2050 + 180 * Math.sin(5 * a1 + p2);
    if (Math.sin((a0 + a1) / 2) * 2050 < -1500) continue;
    const at = (a, r, y) => [WALL_C[0] + Math.cos(a) * r, y, WALL_C[1] + Math.sin(a) * r];
    g.quad(at(a1, r1 - 420, BANK_Y), at(a0, r0 - 420, BANK_Y), at(a0, r0, BANK_Y + h0), at(a1, r1, BANK_Y + h1));
    g.quad(at(a1, r1, BANK_Y + h1), at(a0, r0, BANK_Y + h0), at(a0, r0 + 600, BANK_Y), at(a1, r1 + 600, BANK_Y));
  }
  for (let i = 0; i < 12; i++) {
    const x = -1500 + i * 250 + R.range(-60, 60), y = ridge(x) - 1, z = -2415 + R.range(-12, 12);
    g.col([0.21, 0.19, 0.17]).mat(0, 0).cyl(x, z, y, y + 17, 5.2, 3.6, 6); g.col(SLATE).mat(2, 0).cyl(x, z, y + 17, y + 21, 4.3, 0, 6);
    mills.push([x, y + 17.5, z + 4.4, R.range(0, 6.28), R.range(0.35, 0.5)]);
  }
  W.farG = g; W.mills = mills; W.farCocks = cocks;
}

// ---------------------------------------------------------------- the great house by the entry, the chapel's spire, the mills' sails
async function buildFar2(W) {
  const g = W.farG, ST = [0.26, 0.238, 0.218], H = GREAT_HOUSE;
  // the great house: a tall body under a steep slate roof, three round towers with their feet in the water.
  // It and every quay are of THE TOWN'S OLD STONE: the bridges' own, weathered darker by the water (OLD), with
  // rime on the upper courses (kind 10 of the surface shader)
  const OLD = BRIDGE_STONE.map((c) => c * 0.58);
  g.at(0, 0, 0, 0);
  // (the body's eaves at y 12.6, its ridge at 19.5; the towers' tips at GREAT_HOUSE.tip, by the town's own measure)
  const HW = H.wall, HR = H.ridge, RE = W.RNG.entry, DARK = [0.028, 0.03, 0.04], WARM = [1, 0.46, 0.13];
  const pane = (F, h) => { if (RE() < 0.22) g.col(WARM).mat(8, 0); else g.col(DARK).mat(7, 0); archFill(g, F, h, h.d); };
  g.col(OLD).mat(0, 0).box(-332, -7.5, -93, -276, HW, -70, 3, 1 | 2 | 32);
  g.mat(10, 0).tri([-332, HW, -93], [-332, HW, -70], [-332, HR, -81.5]); g.tri([-276, HW, -70], [-276, HW, -93], [-276, HR, -81.5]);
  // the river front: a tall plinth, two storeys of small deep windows (a few lit), a string band under each, a cornice
  { const F = wallFrame([-304, 0, -93], [0, 0, -1]), cs = [-24.5, -20.6, -16.7, -12.8, -8.9, 8.9, 12.8, 16.7, 20.6, 24.5];
    const rows = [[3.4, 8.2, cs.map((c) => ({ c, w: 0.45, yb: 4.7, ys: 6.3, ya: 6.8, d: 0.5, n: 3 }))], [8.55, HW - 0.3, cs.map((c) => ({ c, w: 0.4, yb: 9.5, ys: 10.7, ya: 11.15, d: 0.5, n: 3 }))]];
    g.col(OLD).mat(0, 0); archWall(g, F, -28, 28, -7.5, 3.0, [], 0.5);
    for (const [y0, y1, hs] of rows) { g.col(OLD).mat(y0 > 8 ? 10 : 0, 0); archWall(g, F, -28, 28, y0, y1, hs, 0.6); for (const h of hs) pane(F, h); }
    g.col(OLD, 1.15).mat(0, 0);
    for (const [y, t, out] of [[3.0, 0.4, 0.3], [8.2, 0.35, 0.25], [HW - 0.3, 0.3, 0.3]]) g.box(-332.2, y, -93 - out, -275.8, y + t, -93, 12, 4 | 8 | 16);
  }
  g.col(SLATE).mat(2, 0);
  g.quad([-332.4, HW - 0.3, -69.5], [-275.6, HW - 0.3, -69.5], [-275.6, HR, -81.5], [-332.4, HR, -81.5], 8); g.quad([-275.6, HW - 0.3, -93.5], [-332.4, HW - 0.3, -93.5], [-332.4, HR, -81.5], [-275.6, HR, -81.5], 8);
  // three round towers of twelve faces, their feet in the water: a battered foot, two storeys of small deep windows
  // between string bands a quarter of a metre proud that carry snow, a table on twenty-four corbels under the eave,
  // and a cone of slate: a steep dark skirt at its eave that holds no snow, snow on its weather side above, a plain
  // lead finial that ends at GREAT_HOUSE.tip
  for (const x of [-330, -304, -278]) {
    await W.ctx.yield();
    const r = 4.2, ap = r * Math.cos(Math.PI / 12), hw = r * Math.sin(Math.PI / 12), cz = H.tz, band = 0.25;
    g.col(OLD, 1.05).mat(0, 0).cyl(x, cz, -7.5, 2.0, r + 0.55, r, 12);
    for (let i = 0; i < 12; i++) {
      const a = (i + 0.5) * Math.PI / 6, n = [Math.cos(a), 0, Math.sin(a)];
      if (n[2] > 0.45) continue;
      const F = wallFrame([x + n[0] * ap, 0, cz + n[2] * ap], n), lo = RE() < 0.5, hi = RE() < 0.5;
      const h1 = lo ? [{ c: 0, w: 0.3, yb: 3.9, ys: 5.2, ya: 5.7, d: 0.5, n: 3 }] : [], h2 = hi ? [{ c: 0, w: 0.3, yb: 9.4, ys: 10.7, ya: 11.2, d: 0.5, n: 3 }] : [];
      g.col(OLD, 1.05).mat(0, 0); archWall(g, F, -hw, hw, 2.55, 7.6, h1, 0.6); for (const h of h1) pane(F, h);
      g.col(OLD, 1.05).mat(10, 0); archWall(g, F, -hw, hw, 8.15, 13.0, h2, 0.6); for (const h of h2) pane(F, h);
    }
    g.col(OLD, 1.15).mat(0, 0);
    for (const y of [2.0, 7.6]) g.cyl(x, cz, y, y, r - 0.1, r + band, 12).cyl(x, cz, y, y + 0.45, r + band, r + band, 12).cyl(x, cz, y + 0.45, y + 0.55, r + band, r - 0.02, 12);
    // the corbels (two a face, each a block 0.4 m broad and 0.55 m high under the table) and the table they carry
    g.mat(10, 0);
    for (let i = 0; i < 24; i++) g.at(x, 0, cz, (i + 0.5) * Math.PI / 12).box(ap - 0.1, 12.45, -0.2, r + 0.3, 13.0, 0.2, 0, 2 | 4 | 16 | 32);
    g.at(0, 0, 0, 0).cyl(x, cz, 13.0, 13.0, r - 0.1, r + 0.45, 12).cyl(x, cz, 13.0, 13.45, r + 0.45, r + 0.45, 12);
    g.col(SLATE, 0.6).mat(7, 0).cyl(x, cz, 13.45, 13.45, r + 0.45, r + 0.95, 12);
    g.col(SLATE).mat(2, 0).cyl(x, cz, 13.45, 14.25, r + 0.95, r + 0.45, 12).cyl(x, cz, 14.25, H.tip - 0.9, r + 0.45, 0.14, 12);
    g.col(LEAD_C).mat(1, 0).cyl(x, cz, H.tip - 1.05, H.tip - 0.85, 0.3, 0.3, 6, { cap: true }).cyl(x, cz, H.tip - 0.85, H.tip, 0.17, 0, 6);
    W.farCocks.push([x, H.tip, cz]);
  }
  // QUAY WALLS: where the island's edge stands upright in the water (under the great house; under the court's wall
  // on both sides of the water steps) it is a built wall and no bare face: a coping of long stones that carries the
  // snow, a buttress every 9 m under a sloped cap, a foot course a step proud, and plates of ice frozen to its foot
  const quay = (x0, x1, zs, dir, RQ) => {
    const QS = OLD, out = (d) => zs + dir * d, zr = (a, b) => [Math.min(out(a), out(b)), Math.max(out(a), out(b))], face = dir < 0 ? 16 : 32;
    // (the wall itself: a face of coursed stone a hand proud of the island's edge, from the river's bed to the
    // coping; it and the foot course are darker with the water's damp)
    let [za, zb] = zr(0, 0.2);
    g.col(QS, 0.85).mat(0, 0).box(x0, -7.5, za, x1, -0.3, zb, 0, 1 | 2 | face);
    [za, zb] = zr(-0.5, 0.55);
    g.col(QS, 1.15).mat(0, 0).box(x0, -0.3, za, x1, 0.22, zb, 12, 1 | 2 | 8 | face);
    [za, zb] = zr(0.4, 1.45);
    g.col(QS, 0.85).box(x0, -7.5, za, x1, -3.7, zb, 8, 1 | 2 | 8 | face);
    for (let x = x0 + Math.min(4.5, (x1 - x0) / 2); x < x1 - 1; x += 9) {
      [za, zb] = zr(0.2, QUAY_OUT);
      g.col(QS).box(x - 0.8, -7.5, za, x + 0.8, -1.6, zb, 3, 1 | 2 | face);
      const zo = out(QUAY_OUT), zi = out(0.5), A = [x - 0.8, -1.6, zo], B = [x + 0.8, -1.6, zo], C = [x + 0.8, -0.3, zi], D = [x - 0.8, -0.3, zi], E = [x - 0.8, -1.6, zi], F2 = [x + 0.8, -1.6, zi];
      if (dir < 0) { g.quad(B, A, D, C); g.tri(A, E, D); g.tri(B, C, F2); } else { g.quad(A, B, C, D); g.tri(A, D, E); g.tri(B, F2, C); }
    }
    for (let x = x0 + 0.2; x < x1 - 1.2; ) {
      const w = Math.min(RQ.range(2.2, 4.4), x1 - x - 0.2), d0 = 1.45, d1 = RQ.range(2.3, 3.3), d2 = RQ.range(2.3, 3.3), y = WATER_Y + 0.07;
      const P0 = [x + 0.08, y, out(d0)], P1 = [x + w - 0.08, y, out(d0)], P2 = [x + w - 0.08 - RQ.range(0, 0.5), y, out(d2)], P3 = [x + 0.08 + RQ.range(0, 0.5), y, out(d1)];
      g.col([0.5, 0.58, 0.7], RQ.range(0.9, 1.25)).mat(7, 0);
      if (dir < 0) g.quad(P0, P1, P2, P3); else g.quad(P1, P0, P3, P2);
      x += w;
    }
  };
  // (each quay's ice by a stream of its own, named by the quay's place)
  await W.ctx.yield();
  QUAYS.forEach((q, k) => quay(q[0], q[1], q[2], q[3], W.RNG.quays[k]));
  await W.ctx.yield();
  // the chapel: a tall narrow nave, and over it a very slender open spire, the sky through it
  g.at(-290, 0, -62, 0);
  g.col(ST, 1.05).mat(0, 0).box(-11, -1, -4, 11, 13, 4, 3, 1 | 2 | 16 | 32); g.tri([-11, 13, -4], [-11, 13, 4], [-11, 21, 0]); g.tri([11, 13, 4], [11, 13, -4], [11, 21, 0]);
  g.col(SLATE).mat(2, 0);
  g.quad([-11.3, 12.8, 4.4], [11.3, 12.8, 4.4], [11.3, 21, 0], [-11.3, 21, 0], 8); g.quad([11.3, 12.8, -4.4], [-11.3, 12.8, -4.4], [-11.3, 21, 0], [11.3, 21, 0], 8);
  g.col([1, 1, 1]).mat(6, 0);
  for (let i = 0; i < 6; i++) { const x = -9.2 + i * 3.68; g.quad([x - 0.5, 3, 4.04], [x + 0.5, 3, 4.04], [x + 0.5, 11.4, 4.04], [x - 0.5, 11.4, 4.04]); g.quad([x + 0.5, 3, -4.04], [x - 0.5, 3, -4.04], [x - 0.5, 11.4, -4.04], [x + 0.5, 11.4, -4.04]); }
  g.col(LEAD_C).mat(1, 0);
  g.cyl(0, 0, 20.2, 23, 1.5, 1.25, 8);
  const ring = (y, r) => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, b = a + Math.PI / 4; g.beam([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(b) * r, y, Math.sin(b) * r], 0.16, 0.2, 3); } };
  const posts = (y0, y1, r0, r1) => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beam([Math.cos(a) * r0, y0, Math.sin(a) * r0], [Math.cos(a) * r1, y1, Math.sin(a) * r1], 0.14, 0.14, 3); } };
  posts(23, 33, 1.2, 0.95); ring(28, 1.08); ring(33, 0.95);
  g.cyl(0, 0, 33, 39, 1.0, 0.72, 8); posts(39, 43, 0.7, 0.55); g.cyl(0, 0, 43, 48, 0.58, 0.4, 8); posts(48, 51, 0.38, 0.3); g.cyl(0, 0, 51, 60, 0.32, 0, 8);
  g.at(0, 0, 0, 0);
  await W.ctx.yield();
  const mesh = new THREE.Mesh(g.build(), W.plainMat); mesh.frustumCulled = false; W.scene.add(mesh);
  W.shade.block(-304, -81, 1, 0, 28, 12, 16);
  // the windmills' sails: four lattice blades a mill, turning by the clock
  const s = makeGB(); s.col(TIMBER, 1.3).mat(5, 0);
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, c = Math.cos(a), n = Math.sin(a), p = (r, w) => [c * r - n * w, n * r + c * w, 0];
    s.quad(p(1.2, 0), p(10.5, 0), p(10.5, 1.7), p(1.2, 1.7)); s.quad(p(10.5, 0), p(1.2, 0), p(1.2, 1.7), p(10.5, 1.7));
  }
  const sm = new THREE.InstancedMesh(s.build(), W.plainMat, W.mills.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 1);
  const turn = (time) => { W.mills.forEach((m, i) => { M.compose(P.set(m[0], m[1], m[2]), Q.setFromAxisAngle(Z, m[3] + m[4] * time), ONE); sm.setMatrixAt(i, M); }); sm.instanceMatrix.needsUpdate = true; };
  turn(0); sm.frustumCulled = false; W.scene.add(sm); W.updates.push((dt, time) => turn(time));
  return g.tris + s.tris * W.mills.length;
}

// ---------------------------------------------------------------- bare trees, the garden's wall, pennons
// Thirty old bare trees stand in the walled garden east of the apse (none taller than y 22) and four in the court
// (two by each range, 16 m and more from the door's axis x 78). Their twigs tremble by the clock; a hoar-frost morning whitens them.
// Plain one-colour pennons stir on poles on the great house's towers and on a few gables that stand 20 m and more
// from the flown line's track.
const hasPennon = (h) => h.dT >= 20 && h.dT <= 140 && (h.hs * 977) % 1 <= 0.07 && HOUSE_KINDS[h.k].along === 'z';
const BARK = [0.1, 0.09, 0.085], PENNON = [[0.3, 0.06, 0.05], [0.07, 0.1, 0.24], [0.36, 0.26, 0.08], [0.5, 0.48, 0.44]];
function treeInto(g, R, x, y, z, height) {
  let top = y;
  const branch = (p, d, len, r, lev) => {
    const q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], r1 = r * 0.6;
    if (q[1] > top) top = q[1];
    // a three-sided tapering limb
    let ax = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [d[1] * ax[2] - d[2] * ax[1], d[2] * ax[0] - d[0] * ax[2], d[0] * ax[1] - d[1] * ax[0]]; const ul = Math.hypot(...u); u = u.map((v) => v / ul);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const ring = (c, rr, k) => { const a = k * 2.094; return [c[0] + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * rr, c[1] + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * rr, c[2] + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * rr]; };
    g.mat(5, 0);
    for (let k = 0; k < 3; k++) g.weights(lev / 3, lev / 3, (lev + 1) / 3, (lev + 1) / 3).quad(ring(p, r, k + 1), ring(p, r, k), ring(q, r1, k), ring(q, r1, k + 1));
    if (lev >= 3) return;
    const n = lev === 0 ? 4 : 3, a0 = R.range(0, 6.28);
    for (let i = 0; i < n; i++) {
      const az = a0 + i * 6.28 / n + R.range(-0.5, 0.5), tilt = lev === 0 ? R.range(0.5, 0.95) : R.range(0.45, 0.9), ct = Math.cos(tilt), st = Math.sin(tilt);
      let nd = [d[0] * ct + (u[0] * Math.cos(az) + v[0] * Math.sin(az)) * st, d[1] * ct + (u[1] * Math.cos(az) + v[1] * Math.sin(az)) * st + 0.12, d[2] * ct + (u[2] * Math.cos(az) + v[2] * Math.sin(az)) * st];
      const nl = Math.hypot(...nd); nd = nd.map((c) => c / nl);
      branch(q, nd, len * R.range(0.62, 0.8), r1, lev + 1);
    }
  };
  g.col(BARK, R.range(0.85, 1.2));
  branch([x, y - 0.4, z], [R.range(-0.08, 0.08), 1, R.range(-0.08, 0.08)], height * 0.36, height * 0.03, 0);
  // its highest twig, for whatever flies over it
  return top;
}
async function buildTrees(W, houses, kinds) {
  const g = makeGB(), R = W.RNG.trees, spots = [];
  // the court's four trees stand clear of its ranges, and cast (a mesh of one instance, like every caster)
  const gc = makeGB();
  for (const [x, z] of [[61.5, 41], [61, 71], [95.5, 44], [94.5, 56.5]]) { const h = R.range(11, 13.5); W.tops.push([x, z, h * 0.5, treeInto(gc, R, x, 0, z, h)]); }
  const swayMat = makeSurface(W.shared, { sway: true }), court = new THREE.InstancedMesh(gc.build(), swayMat, 1);
  court.castShadow = true; court.receiveShadow = true; court.frustumCulled = false; W.scene.add(court);
  for (let tries = 0; tries < 400 && spots.length < 30; tries++) {
    const x = R.range(138, 226), z = R.range(-66, 78);
    if (!onIsland(x, z, 7) || spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 9.5)) continue;
    const h = R.range(13, 19); spots.push([x, z]); W.tops.push([x, z, h * 0.5, treeInto(g, R, x, 0, z, h)]);
    if (spots.length % 10 === 0) await W.ctx.yield();
  }
  // pennons: a pole on the gable's point, a long plain flag
  const flag = (x, y, z, c, ph) => {
    g.col(BARK, 1.3).mat(5, 0).beam([x, y, z], [x, y + 2.6, z], 0.09, 0.09, 3);
    g.col(c).mat(7, 0);
    const a0 = [x, y + 2.55, z], a1 = [x, y + 1.95, z], b0 = [x + Math.cos(ph) * 1.9, y + 2.35, z + Math.sin(ph) * 1.9], b1 = [b0[0], y + 2.2, b0[2]];
    g.weights(0, 5, 5, 0).quad(a1, b1, b0, a0); g.weights(5, 0, 0, 5).quad(b1, a1, a0, b0);
  };
  for (const x of [-330, -304, -278]) flag(x, GREAT_HOUSE.tip, GREAT_HOUSE.tz, PENNON[0], 2.6);
  for (const h of houses) {
    if (h.gone || !hasPennon(h)) continue;
    const K = kinds[h.k], c = Math.cos(h.yaw), s = Math.sin(h.yaw), lz = K.d / 2 + K.zc;
    flag(h.x + lz * s, h.y + K.ridge * h.sy - 0.3, h.z + lz * c, PENNON[Math.floor(h.tone * 4)], 2.6 + h.hs);
  }
  // the college garth's bare trees (their draws are the landmarks' own)
  { const C = COLLEGE, RM = W.RNG.marks, c = Math.cos(C.yaw), s = Math.sin(C.yaw), y = groundY(C.x, C.z);
    for (const [lx, lz] of GARTH_TREES) { const x = C.x + lx * c + lz * s, z = C.z - lx * s + lz * c, h = RM.range(9, 12); W.tops.push([x, z, h * 0.5, treeInto(g, RM, x, y, z, h)]); } }
  const mesh = new THREE.Mesh(g.build(), swayMat); mesh.frustumCulled = false; W.scene.add(mesh);
  // the garden's wall along the island's point, and across the island behind the apse
  const w = makeGB(); w.col(CHURCH_STONE, 0.95).mat(0, 0);
  const wall = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * 0.3, nz = dx / L * 0.3;
    w.quad([a[0] + nx, -0.5, a[1] + nz], [b[0] + nx, -0.5, b[1] + nz], [b[0] + nx, 2.2, b[1] + nz], [a[0] + nx, 2.2, a[1] + nz], 8); w.quad([b[0] - nx, -0.5, b[1] - nz], [a[0] - nx, -0.5, a[1] - nz], [a[0] - nx, 2.2, a[1] - nz], [b[0] - nx, 2.2, b[1] - nz], 8);
    w.quad([a[0] + nx, 2.2, a[1] + nz], [b[0] + nx, 2.2, b[1] + nz], [b[0] - nx, 2.2, b[1] - nz], [a[0] - nx, 2.2, a[1] - nz], 15); };
  let prevN = [133, islandN(133) + 1.5], prevS = [133, islandS(133) - 1.5];
  for (let x = 141; x <= 233; x += 8) { const xx = Math.min(x, 232.5), n = [xx, islandN(xx) + 1.5], s2 = [xx, islandS(xx) - 1.5]; wall(n, prevN); wall(prevS, s2); prevN = n; prevS = s2; }
  wall(prevS, prevN); wall([133, islandN(133) + 1.5], [133, -34]); wall([133, 38], [133, islandS(133) - 1.5]);
  const wm = new THREE.Mesh(w.build(), W.plainMat); wm.receiveShadow = true; W.scene.add(wm);
  return g.tris + gc.tris + w.tris;
}

// ---------------------------------------------------------------- the court before the south door, hemmed by the town
// Two plain old ranges stand on the court's two sides down to the water: the western one its whole length, stone
// below and timber above, with a cart arch; the eastern one by the water only, all stone under slate, so that north
// of it the low sun comes over the court's wall. They leave the way on the door's axis (x 78) 49 m broad.
const RANGES = [
  { xc: 53.4, xb: 45.4, z0: 33.5, z1: 84.5, h0: 3.4, h1: 3.0, rise: 4.6, timber: true, arch: 58, dormers: [40, 49, 67, 76], stacks: [37, 53, 63, 80] },
  { xc: 102.6, xb: 110.6, z0: 62, z1: 84.5, h0: 3.2, h1: 2.6, rise: 4.2, timber: false, arch: 73, dormers: [67, 79], stacks: [65, 82] },
];
function rangeInto(g, o) {
  const dir = Math.sign(o.xc - o.xb), zm = (o.z0 + o.z1) / 2, Lh = (o.z1 - o.z0) / 2, e = o.h0 + o.h1, jet = o.timber ? 0.35 : 0, xm = (o.xc + o.xb) / 2;
  const STONE_R = [0.235, 0.22, 0.2], F = wallFrame([o.xc, 0, zm], [dir, 0, 0]), al = (z) => -dir * (z - zm), holes = [];
  // the ground storey toward the court: plain stone, a cart arch, small shuttered windows
  for (let z = o.z0 + 2.6; z < o.z1 - 2; z += 4.3) if (Math.abs(z - o.arch) > 3.4) holes.push({ c: al(z), w: 0.42, yb: 1.3, ys: 2.3, ya: 2.55, d: 0.3, n: 2 });
  holes.push({ c: al(o.arch), w: 1.6, yb: 0, ys: 2.0, ya: 3.0, d: 0.8, sill: false, n: 4 }); holes.sort((p, q) => p.c - q.c);
  g.col(STONE_R).mat(0, 0); archWall(g, F, -Lh, Lh, 0, o.h0, holes, 0.5);
  for (const h of holes) { if (h.w > 1) g.col(TIMBER, 0.9).mat(5, 0.5); else g.col([0.035, 0.04, 0.05]).mat(7, 0); archFill(g, F, h, h.d); }
  // the upper storey toward the court (jettied where it is timber), the bressummer under it
  const F2 = wallFrame([o.xc + dir * jet, 0, zm], [dir, 0, 0]);
  g.col(o.timber ? PLASTER : STONE_R, o.timber ? 0.72 : 1.04).mat(o.timber ? 3 : 0, o.timber ? 1 : 0).quad(F2.p(-Lh, o.h0), F2.p(Lh, o.h0), F2.p(Lh, e), F2.p(-Lh, e), o.timber ? 1 : 0);
  if (jet) g.col(TIMBER).mat(5, 0).box(Math.min(o.xc, o.xc + dir * jet), o.h0 - 0.2, o.z0, Math.max(o.xc, o.xc + dir * jet), o.h0, o.z1, 0, 4 | (dir > 0 ? 2 : 1));
  // the back and the two gable ends, stone to the eaves and up the gables
  g.col(STONE_R, 0.95).mat(0, 0);
  const Fb = wallFrame([o.xb, 0, zm], [-dir, 0, 0]); g.quad(Fb.p(-Lh, 0), Fb.p(Lh, 0), Fb.p(Lh, e), Fb.p(-Lh, e), 3);
  const xl = Math.min(o.xc + dir * jet, o.xb), xr = Math.max(o.xc + dir * jet, o.xb), yr = e + o.rise;
  g.quad([xr, 0, o.z0], [xl, 0, o.z0], [xl, e, o.z0], [xr, e, o.z0], 3); g.tri([xr, e, o.z0], [xl, e, o.z0], [xm, yr, o.z0]);
  g.quad([xl, 0, o.z1], [xr, 0, o.z1], [xr, e, o.z1], [xl, e, o.z1], 3); g.tri([xl, e, o.z1], [xr, e, o.z1], [xm, yr, o.z1]);
  // the roof: two long slopes, the ridge white
  const xe1 = o.xc + dir * (jet + RANGE_EAVE), xe0 = o.xb - dir * RANGE_EAVE, za = o.z0 - 0.35, zb = o.z1 + 0.35;
  const slopeQ = (xLow, yLow, z0, z1, xHigh, yHigh, fl) => (xLow > xHigh ? g.quad([xLow, yLow, z1], [xLow, yLow, z0], [xHigh, yHigh, z0], [xHigh, yHigh, z1], fl) : g.quad([xLow, yLow, z0], [xLow, yLow, z1], [xHigh, yHigh, z1], [xHigh, yHigh, z0], fl));
  g.col(o.timber ? TILE : SLATE).mat(2, 0); slopeQ(xe1, e - 0.12, za, zb, xm, yr, 8); slopeQ(xe0, e - 0.12, za, zb, xm, yr, 8);
  // dormers on the slope toward the court: a small gabled front, two cheeks, two slopes back into the roof
  const hwR = Math.abs(xe1 - xm), xd = o.xc + dir * jet, yRoof = (x) => e - 0.12 + (o.rise + 0.12) * (1 - Math.abs(x - xm) / hwR);
  for (const zc of o.dormers) {
    const y0 = yRoof(xd), y1 = y0 + 1.35, yt = y1 + 0.75, xAt = (y) => xm + dir * hwR * (1 - (y - e + 0.12) / (o.rise + 0.12)), xe = xAt(y1), xt = xAt(yt), Fd = wallFrame([xd, 0, zc], [dir, 0, 0]);
    g.col(PLASTER, 0.7).mat(3, o.timber ? 1 : 0).quad(Fd.p(-0.8, y0), Fd.p(0.8, y0), Fd.p(0.8, y1), Fd.p(-0.8, y1), 1);
    g.col(TIMBER, 1.1).mat(5, 0).tri(Fd.p(-0.95, y1), Fd.p(0.95, y1), Fd.p(0, yt));
    for (const s of [-1, 1]) {
      const z = zc + s * 0.8, ze = zc + s * 0.95;
      g.col(PLASTER, 0.6).mat(3, 0); if (s * dir > 0) g.tri([xd, y0, z], [xd, y1, z], [xe, y1, z]); else g.tri([xd, y0, z], [xe, y1, z], [xd, y1, z]);
      g.col(o.timber ? TILE : SLATE).mat(2, 0);
      if (s * dir > 0) g.quad([xe, y1, ze], [xd, y1, ze], [xd, yt, zc], [xt, yt, zc], 8); else g.quad([xd, y1, ze], [xe, y1, ze], [xt, yt, zc], [xd, yt, zc], 8);
    }
  }
  // the stacks on the ridge
  for (const z of o.stacks) { g.col(CHIMNEY, 0.9).mat(0, 0).box(xm - 0.5, yr - 0.7, z - 0.55, xm + 0.5, yr + 1.7, z + 0.55, 3, 1 | 2 | 16 | 32); g.box(xm - 0.6, yr + 1.7, z - 0.65, xm + 0.6, yr + 1.9, z + 0.65, 15, 63); }
}

// The court's own things, all clear of the way on the door's axis: a well under a small roof, a frozen trough, the
// ruts of sledges from the cart arch to the water steps (no footprint anywhere), ice at the foot of the steps.
function buildCourt(W) {
  const g = makeGB(), ICE = [0.5, 0.58, 0.7], PRESSED = [0.56, 0.6, 0.7];
  for (const o of RANGES) rangeInto(g, o);
  // the well: a round kerb, two posts, a windlass, a little roof of two slopes
  const wx = 64.5, wz = 47;
  g.col(CHURCH_STONE, 1.05).mat(0, 0).cyl(wx, wz, 0, 0.95, 1.25, 1.25, 12).cyl(wx, wz, 0.95, 0.95, 1.25, 0.85, 12);
  g.col([0.02, 0.03, 0.035]).mat(7, 0).cyl(wx, wz, 0.9, 0.9, 0.85, 0, 12);
  g.col(TIMBER, 1.2).mat(5, 0);
  for (const s of [-1, 1]) g.beam([wx, 0.9, wz + s * 1.1], [wx, 3.1, wz + s * 1.1], 0.18, 0.18, 3);
  g.beam([wx, 2.2, wz - 1.1], [wx, 2.2, wz + 1.1], 0.14, 0.14, 3);
  g.col(TILE).mat(2, 0).quad([wx + 0.95, 2.9, wz + 1.5], [wx + 0.95, 2.9, wz - 1.5], [wx, 3.7, wz - 1.5], [wx, 3.7, wz + 1.5], 8).quad([wx - 0.95, 2.9, wz - 1.5], [wx - 0.95, 2.9, wz + 1.5], [wx, 3.7, wz + 1.5], [wx, 3.7, wz - 1.5], 8);
  // the trough by the eastern wall: a long stone box, its water frozen to the brim
  g.col(CHURCH_STONE, 0.95).mat(0, 0).box(105.4, 0, 39, 106.6, 0.62, 43.4, 3, 1 | 2 | 16 | 32);
  g.col(ICE).mat(7, 0).quad([105.55, 0.56, 43.25], [106.45, 0.56, 43.25], [106.45, 0.56, 39.15], [105.55, 0.56, 39.15]);
  g.col(CHURCH_STONE, 1.1).mat(0, 0).box(105.4, 0.5, 39, 105.55, 0.64, 43.4, 0, 8).box(106.45, 0.5, 39, 106.6, 0.64, 43.4, 0, 8).box(105.4, 0.5, 39, 106.6, 0.64, 39.15, 0, 8).box(105.4, 0.5, 43.25, 106.6, 0.64, 43.4, 0, 8);
  // sledge ruts: two pairs of narrow runner tracks pressed into the snow, from the cart arch round to the steps
  // and from the eastern range's arch to the door's way
  const rut = (pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      for (const off of [-0.55, 0.55]) {
        const ax = a[0] + nx * off, az = a[1] + nz * off, bx = b[0] + nx * off, bz = b[1] + nz * off;
        g.quad([ax - nx * 0.07, 0.045, az - nz * 0.07], [ax + nx * 0.07, 0.045, az + nz * 0.07], [bx + nx * 0.07, 0.045, bz + nz * 0.07], [bx - nx * 0.07, 0.045, bz - nz * 0.07]);
      }
    }
  };
  const curve = (p0, p1, p2, p3, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return out; };
  g.col(PRESSED).mat(7, 0);
  rut(curve([54.5, 58], [64, 58], [70, 66], [71.5, 84], 12)); rut(curve([54.5, 58.6], [66, 60], [84, 62], [101.5, 73], 12)); rut(curve([101.5, 72.4], [90, 68], [86, 50], [84.5, 34], 12));
  // (and one across the way, from the well to the trough: the water sledge's)
  rut(curve([66.3, 48.2], [74, 51], [92, 51.5], [104.4, 44.6], 12));
  // ice at the foot of the water steps: A SHELF OF SHORE ICE frozen to the lowest step, one sheet from end to end,
  // 0.9 to 3.6 m broad by the place, its outer edge BROKEN (every stretch ends at its own breadth, a point thrust
  // out between, a jog where two stretches meet on a slanting crack); and against that edge the PIECES BROKEN OFF
  // IT, a dark lead between: a first lot close under the edge and following it, each of six straight sides and of
  // its own breadth and slant, then fewer and smaller shards beyond those. No two alike, none square, none in a
  // straight row. (Their places and shapes by the stream 'ice', asked as often and in the same order as ever;
  // they lie still: the loose floes that drift are the river's own, and no held floe lies within their ground,
  // see HELD_STEPS.) THE BROKEN PIECES LIE IN NO ROW: by the stream 'shards' (five numbers a stretch of the second
  // and the third lot, taken whether the piece is laid or not) three pieces in ten of the first lot and one in four
  // of the shards beyond are not laid at all; a piece takes 0.3 to 1 of its stretch (0.37 to 3.66 m broad), anywhere
  // along it, so that the leads between pieces are of every breadth; it lies 0.2 to 1.8 m off the shelf's edge
  // (a shard 0.3 to 1.9 m off what lies before it), and it is 0.45 to 1.7 times as deep as its draws of the
  // stream 'ice' make it: unlike sizes, unlike gaps, no two on one line. None reaches past ICE_Z
  const RI = W.RNG.ice, RS = W.RNG.shards, shelf = [], lip = [], ICE_Y = WATER_Y + 0.06, ICE_Z = 97.9;
  const shelfZ = (xq) => { for (const s of shelf) if (xq < s[1]) { const t = clamp((xq - s[0]) / (s[1] - s[0]), 0, 1); return t < s[3] ? lerp(s[2], s[4], t / s[3]) : lerp(s[4], s[5], (t - s[3]) / (1 - s[3])); } return shelf[shelf.length - 1][5]; };
  const lipZ = (xa, xb) => { let z = 0; for (const l of lip) if (l[0] < xb && l[1] > xa) z = Math.max(z, l[2]); return z; };
  const plate = (ring, tone, y) => {
    let cx = 0, cz = 0; for (const q of ring) { q[1] = Math.min(q[1], ICE_Z); cx += q[0] / ring.length; cz += q[1] / ring.length; }
    g.col(ICE, tone).mat(7, 0); for (let k = 0; k < ring.length; k++) g.tri([cx, y, cz], [ring[(k + 1) % ring.length][0], y, ring[(k + 1) % ring.length][1]], [ring[k][0], y, ring[k][1]]);
  };
  for (let row = 0; row < 3; row++) {
    const z0 = 90.45, lead = 0.1 + row * 0.07;
    let x = 59.6 + RI.range(0, 1.2), slant = RI.range(-0.5, 0.5);
    while (x < 95) {
      const w = RI.range(2.3, 4.3) - row * 0.3, s2 = RI.range(-0.55, 0.55), keep = RI() < [1, 0.7, 0.36][row], tone = RI.range(0.88, 1.28);
      const o1 = RI.range(-0.5, 0.45), o2 = RI.range(-0.5, 0.45), mid = RI.range(0.3, 0.7), bulge = RI.range(0.15, 0.6), r1 = RI.range(0, 0.12), r2 = RI.range(0, 0.12);
      if (row === 0) {
        // (one stretch of the shelf: its breadth at either end, the point between; the crack at its end slants)
        const d1 = clamp(2.3 + 2.4 * o1 + 0.9 * Math.sin(x * 0.23 + 1.3), 0.9, 3.6), d2 = clamp(2.3 + 2.4 * o2 + 0.9 * Math.sin((x + w) * 0.23 + 1.3), 0.9, 3.6), dp = Math.max(d1, d2) + bulge;
        shelf.push([x, x + w, z0 + d1, mid, z0 + dp, z0 + d2]);
        plate([[x, z0], [x + w, z0], [x + w + s2 * d2 / 2.2, z0 + d2], [x + w * mid + (slant * d1 + s2 * d2) / 4.4, z0 + dp], [x + slant * d1 / 2.2, z0 + d1]], 1.03 + (tone - 1.08) * 0.3, ICE_Y + 0.015);
      } else {
        const n1 = RS(), n2 = RS(), n3 = RS(), n4 = RS(), n5 = RS();
        if (keep && n1 >= (row === 1 ? 0.3 : 0.25)) {
          const bw = (w - 2 * lead) * lerp(0.3, 1, n2), xa = x + lead + (w - 2 * lead - bw) * n3, xb = xa + bw, xm = xa + bw * mid, deep = lerp(0.45, 1.7, n5);
          if (row === 1) {
            // (a piece under the shelf's edge: its near side follows the edge, its own lead's breadth off it)
            const off = 0.2 + 1.6 * n4 * n4, za = shelfZ(xa) + off + r1, zb = shelfZ(xb) + off + r2, zm = Math.max(shelfZ(xm) + off, (za + zb) / 2 - 0.3), room = ICE_Z - 0.15 - Math.max(za, zb, zm);
            let da = (0.8 + (o1 + 0.5) * 1.2) * deep, db = (0.8 + (o2 + 0.5) * 1.2) * deep, bu = bulge * 0.8 * deep; const f = Math.min(1, room / (Math.max(da, db) + bu));
            if (f > 0.35) {
              da *= f; db *= f; bu *= f; const zp = Math.max(za + da, zb + db) + bu;
              plate([[xa, za], [xm, zm], [xb, zb], [xb + s2 * 1.2 * f, zb + db], [xm + (slant + s2) * 0.6 * f, zp], [xa + slant * 1.2 * f, za + da]], tone, ICE_Y); lip.push([xa - 0.9, xb + 0.9, zp]);
            }
          } else {
            // (a shard beyond: narrower, more slanted, its own lead's breadth off whatever lies before it)
            const zi = Math.max(shelfZ(xa), shelfZ(xm), shelfZ(xb), lipZ(xa - 0.7, xb + 0.7)) + 0.3 + r1 * 3 + 1.2 * n4 * n4, da = (0.5 + (o1 + 0.5) * 0.9) * deep, db = (0.5 + (o2 + 0.5) * 0.9) * deep, bu = bulge * 0.7 * deep;
            if (zi + r2 * 4 + Math.max(da, db) + bu < ICE_Z - 0.15) plate([[xa + bw * 0.1, zi + r2 * 4], [xb - bw * 0.22, zi], [xb - bw * 0.1 + s2 * 1.5, zi + db], [xm + (slant + s2) * 0.7, zi + Math.max(da, db) + bu], [xa + bw * 0.1 + slant * 1.5, zi + da * 0.8]], tone, ICE_Y - 0.01);
          }
        }
      }
      x += w; slant = s2;
    }
  }
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, 1); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; W.scene.add(mesh);
  return g.tris;
}

// ---------------------------------------------------------------- the river's fork: what the broad view east holds
// Typed places, all 35 m and more from the flown line and far under it. A floating mill is moored in the race where
// the stream parts at the island's point (268, 80): two hulls, a timber house, an undershot wheel between them that
// the stream turns. A timber crane stands on the southern strand (258, 115), its load hanging over a barge. A ferry
// hangs on its rope across the southern arm on x 150. Six towers stand over the far banks' roofs up the stream.
const FORK = { mill: [268, 80], crane: [258, 115], ferryX: 150, barges: [[258, 104.6, 0], [287, 99.5, 0.05], [226, -3, Math.PI + 0.45]] };
function buildFork(W) {
  const g = makeGB(), R = W.RNG.fork, WY = WATER_Y, [mx, mz] = FORK.mill, TAR = [0.085, 0.075, 0.07], PLANK = [0.16, 0.14, 0.12];
  // the mill's two hulls (the bows up the stream, toward +x), the cross beams, the house
  const hull = (z0, hw, x0, x1, top) => {
    g.col(TAR).mat(5, 0);
    g.quad([x0, WY - 0.6, z0 + hw * 0.8], [x1 - 2, WY - 0.6, z0 + hw * 0.8], [x1 - 2, top, z0 + hw], [x0, top, z0 + hw], 8); g.quad([x1 - 2, WY - 0.6, z0 - hw * 0.8], [x0, WY - 0.6, z0 - hw * 0.8], [x0, top, z0 - hw], [x1 - 2, top, z0 - hw], 8);
    g.quad([x1 - 2, WY - 0.6, z0 + hw * 0.8], [x1, WY - 0.3, z0], [x1, top, z0], [x1 - 2, top, z0 + hw], 8); g.quad([x1, WY - 0.3, z0], [x1 - 2, WY - 0.6, z0 - hw * 0.8], [x1 - 2, top, z0 - hw], [x1, top, z0], 8);
    g.quad([x0, WY - 0.6, z0 - hw * 0.8], [x0, WY - 0.6, z0 + hw * 0.8], [x0, top, z0 + hw], [x0, top, z0 - hw], 8);
    g.col(PLANK).quad([x0, top - 0.25, z0 + hw], [x1 - 2, top - 0.25, z0 + hw], [x1 - 2, top - 0.25, z0 - hw], [x0, top - 0.25, z0 - hw]).tri([x1 - 2, top - 0.25, z0 + hw], [x1, top - 0.25, z0], [x1 - 2, top - 0.25, z0 - hw]);
  };
  hull(mz, 2.6, mx - 8, mx + 8, WY + 1.0); hull(mz - 6.3, 0.85, mx - 6, mx + 6.5, WY + 0.8);
  g.col(TIMBER, 1.2).mat(5, 0);
  for (const x of [mx - 4.6, mx + 4.6]) g.beam([x, WY + 1.05, mz + 2.2], [x, WY + 1.05, mz - 7], 0.3, 0.3, 3, true);
  g.beam([mx, WY + 1.0, mz - 2.4], [mx, WY + 1.0, mz - 5.6], 0.34, 0.34, 3);
  const hx0 = mx - 6.2, hx1 = mx + 3.2, hz0 = mz - 2.1, hz1 = mz + 2.1, hy0 = WY + 0.75, hy1 = WY + 3.5, hyr = WY + 5.3;
  g.col(PLANK, 1.25).mat(5, 0).box(hx0, hy0, hz0, hx1, hy1, hz1, 3, 1 | 2 | 16 | 32);
  g.tri([hx0, hy1, hz0], [hx0, hy1, hz1], [hx0, hyr, mz]).tri([hx1, hy1, hz1], [hx1, hy1, hz0], [hx1, hyr, mz]);
  g.col([0.2, 0.19, 0.18]).mat(2, 0).quad([hx0 - 0.4, hy1 - 0.1, hz1 + 0.35], [hx1 + 0.4, hy1 - 0.1, hz1 + 0.35], [hx1 + 0.4, hyr, mz], [hx0 - 0.4, hyr, mz], 8).quad([hx1 + 0.4, hy1 - 0.1, hz0 - 0.35], [hx0 - 0.4, hy1 - 0.1, hz0 - 0.35], [hx0 - 0.4, hyr, mz], [hx1 + 0.4, hyr, mz], 8);
  g.col([0.03, 0.035, 0.045]).mat(7, 0).box(hx0 + 1.2, hy0 + 0.1, hz1, hx0 + 2.2, hy0 + 2.0, hz1 + 0.03, 0, 32).box(mx - 1, hy0 + 1.1, hz1, mx - 0.2, hy0 + 1.9, hz1 + 0.03, 0, 32);
  // its two mooring piles up the stream and the ropes to them
  for (const s of [-1, 1]) {
    const pz = mz - 1.8 + s * 5.5;
    g.col(TIMBER, 1.1).mat(5, 0).cyl(mx + 24, pz, WY - 1, WY + 2.2, 0.28, 0.24, 6, { cap: true });
    for (let i = 0; i < 5; i++) { const t0 = i / 5, t1 = (i + 1) / 5, sag = (t) => WY + 1.2 + 0.6 * t - 1.3 * Math.sin(t * Math.PI); g.beam([mx + 7.6 + 16.4 * t0, sag(t0), mz + (pz - mz) * t0], [mx + 7.6 + 16.4 * t1, sag(t1), mz + (pz - mz) * t1], 0.07, 0.07, 0); }
  }
  // the crane on the southern strand: a staging on piles, a square timber tower with its treadwheel's drum, a jib
  // out over the water
  const [cx, cz] = FORK.crane, top = 8.2, tip = [cx, 12.2, cz - 9.6];
  g.col(PLANK).mat(5, 0).box(cx - 3.2, 0.7, cz - 4.6, cx + 3.2, 1.0, cz + 2.2, 0, 63);
  g.col(TIMBER, 1.15).mat(5, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.beam([cx + sx * 2.9, WY - 1, cz - 1.2 + sz * 3.1], [cx + sx * 2.9, 0.8, cz - 1.2 + sz * 3.1], 0.3, 0.3, 3); g.beam([cx + sx * 1.3, 1, cz + sz * 1.3], [cx + sx * 0.9, top, cz + sz * 0.9], 0.3, 0.3, 3); }
  for (const y of [3.4, 5.8, top]) { const k = 1.3 - 0.4 * (y - 1) / (top - 1); g.beam([cx - k, y, cz - k], [cx + k, y, cz - k], 0.2, 0.2, 3).beam([cx - k, y, cz + k], [cx + k, y, cz + k], 0.2, 0.2, 3).beam([cx - k, y, cz - k], [cx - k, y, cz + k], 0.2, 0.2, 3).beam([cx + k, y, cz - k], [cx + k, y, cz + k], 0.2, 0.2, 3); }
  for (let i = 0; i < 10; i++) { const a = Math.PI * 2 * i / 10, b = Math.PI * 2 * (i + 1) / 10; g.beam([cx + 1.9, 3.3 + Math.sin(a) * 2.1, cz + Math.cos(a) * 2.1], [cx + 1.9, 3.3 + Math.sin(b) * 2.1, cz + Math.cos(b) * 2.1], 0.9, 0.14, 0, false, [1, 0, 0]); }
  g.beam([cx, top - 0.3, cz + 1.6], tip, 0.34, 0.34, 3, true); g.beam([cx, 4.2, cz - 1.0], [cx, 9.9, cz - 4.1], 0.2, 0.2, 3);
  g.col(CHIMNEY, 0.6).mat(5, 0).beam([cx, top - 0.2, cz + 1.4], [cx, 3.3, cz + 0.9], 0.06, 0.06, 0);
  // the ferry's rope across the southern arm from post to post, sagging to a man's height over the water
  const fx = FORK.ferryX, fa = islandS(fx) + 2, fb = bankS(fx) - 2, ropeY = (t) => 3.2 + (BANK_Y + 3.2 - 3.2) * t - 5.4 * Math.sin(t * Math.PI);
  g.col(TIMBER, 1.1).mat(5, 0).cyl(fx, fa, -0.5, 3.4, 0.22, 0.18, 6, { cap: true }).cyl(fx, fb, 0.5, BANK_Y + 3.4, 0.22, 0.18, 6, { cap: true });
  g.col(CHIMNEY, 0.6);
  for (let i = 0; i < 14; i++) { const t0 = i / 14, t1 = (i + 1) / 14; g.beam([fx, ropeY(t0), lerp(fa, fb, t0)], [fx, ropeY(t1), lerp(fa, fb, t1)], 0.07, 0.07, 0); }
  // six towers over the far banks' roofs up the stream: the far bank is a town too
  const tower = (x, z, hw, h, kind) => {
    g.col(CHURCH_STONE, 0.9).mat(0, 0);
    if (kind === 1) { g.cyl(x, z, -2, h, hw, hw * 0.94, 10); g.col(SLATE).mat(2, 0).cyl(x, z, h, h + hw * 2.4, hw * 1.12, 0, 10); return; }
    g.box(x - hw, -2, z - hw, x + hw, h, z + hw, 3, 1 | 2 | 16 | 32);
    if (kind === 0) { g.col(SLATE).mat(2, 0).cyl(x, z, h, h + hw * 4.2, hw * 1.25, 0, 4, { phase: Math.PI / 4 }); return; }
    g.col(TILE).mat(2, 0).quad([x - hw - 0.4, h, z + hw + 0.4], [x + hw + 0.4, h, z + hw + 0.4], [x + hw + 0.4, h + hw * 1.6, z], [x - hw - 0.4, h + hw * 1.6, z], 8).quad([x + hw + 0.4, h, z - hw - 0.4], [x - hw - 0.4, h, z - hw - 0.4], [x - hw - 0.4, h + hw * 1.6, z], [x + hw + 0.4, h + hw * 1.6, z], 8);
    g.col(CHURCH_STONE, 0.9).mat(0, 0).tri([x - hw, h, z - hw], [x - hw, h, z + hw], [x - hw, h + hw * 1.5, z]).tri([x + hw, h, z + hw], [x + hw, h, z - hw], [x + hw, h + hw * 1.5, z]);
  };
  for (const [x, z, hw, h, kind] of [[492, -138, 4.5, 34, 0], [590, -164, 5.5, 30, 1], [704, -130, 6, 27, 2], [482, 120, 4, 38, 0], [578, 142, 5, 26, 1], [694, 114, 6.5, 30, 2]]) tower(x, z, hw, h + R.range(-2, 4), kind);
  const mesh = new THREE.Mesh(g.build(), W.plainMat); mesh.frustumCulled = false; W.scene.add(mesh);
  // what moves here: the crane's load swings a little on its rope; the ferry rides to and fro on its traveller where
  // the rope hangs lowest (each a mesh of its own, placed by the clock)
  const lm = makeGB(), fm = makeGB();
  lm.col(CHIMNEY, 0.6).mat(5, 0).beam([0, 0, 0], [0, -7.4, 0], 0.06, 0.06, 0);
  lm.col([0.3, 0.27, 0.2]).mat(5, 0).box(-0.75, -8.6, -0.55, 0.75, -7.4, 0.55, 15, 63);
  fm.col(TAR).mat(5, 0);
  fm.quad([-3.6, -0.5, 1.5], [3.6, -0.5, 1.5], [3.9, 0.45, 1.7], [-3.9, 0.45, 1.7], 8).quad([3.6, -0.5, -1.5], [-3.6, -0.5, -1.5], [-3.9, 0.45, -1.7], [3.9, 0.45, -1.7], 8);
  fm.quad([-3.6, -0.5, -1.5], [-3.6, -0.5, 1.5], [-3.9, 0.45, 1.7], [-3.9, 0.45, -1.7], 8).quad([3.6, -0.5, 1.5], [3.6, -0.5, -1.5], [3.9, 0.45, -1.7], [3.9, 0.45, 1.7], 8);
  fm.col(PLANK).quad([-3.8, 0.2, 1.6], [3.8, 0.2, 1.6], [3.8, 0.2, -1.6], [-3.8, 0.2, -1.6]);
  fm.col(CHIMNEY, 0.6).beam([0, 0.2, 0], [0, 3.32, 0], 0.07, 0.07, 0);
  const load = new THREE.Mesh(lm.build(), W.plainMat), ferry = new THREE.Mesh(fm.build(), W.plainMat); load.frustumCulled = false; ferry.frustumCulled = false; W.scene.add(load, ferry);
  const ph = [R.range(0, 6.28), R.range(0, 6.28), R.range(0, 6.28)], fz0 = lerp(fa, fb, 0.5);
  const loadAt = (time) => [0.035 * Math.sin(time * 0.9 + ph[0]), 0.03 * Math.sin(time * 0.74 + ph[1])], ferryAt = (time) => fz0 + 2.9 * Math.sin(time * 0.37 + ph[2]);
  const place = (time) => { const [a, b] = loadAt(time); load.position.set(tip[0], tip[1], tip[2]); load.rotation.set(a, 0, b); ferry.position.set(fx, WY, ferryAt(time)); ferry.rotation.set(0.02 * Math.sin(time * 1.1 + ph[0]), 0, 0); };
  place(0); W.updates.push((dt, time) => place(time));
  // for the count by place: the load's lowest point and the ferry, at any clock
  W.forkMovers = { tip, loadAt, ferryAt, ferryX: fx, mill: FORK.mill };
  // where no drawn barge may lie: the ferry's course across the southern arm, the race about the floating mill
  const keep = (x, z) => (z > 0 && Math.abs(x - fx) < 16) || Math.hypot(x - mx, z - mz) < 30;
  return { tris: g.tris + lm.tris + fm.tris, wheel: { p: [mx, WY + 1.0, mz - 4.0], speed: -R.range(0.6, 0.8), phase: R.range(0, 6.28) }, barges: FORK.barges, keep };
}

// ---------------------------------------------------------------- barges at their moorings, weathercocks
// Four barges lie at anchor in the northern arm's stream, in a row 17.5 m and more north of the entry's line and 35 m
// and more from where the visitor comes in (from x -282 to x -198); three are typed at the fork (one under the
// crane's load and one beside it off the southern strand, one by the island's point); the others are moored off the strands by the
// seed's draw, clear of the bridges, of the tanners' channel, the ferry's course and the mill's race, 16 m and more
// from the door's axis over the southern arm, and no hull within 18 m of another's middle (a hull is 14.2 m long).
// NO BARGE IN A QUAY: a barge's middle keeps half a hull (BARGE_HALF, its swing on the rope in) and BARGE_ROOM
// from every quay's stone, measured to the quay's own stretch and its buttresses' reach.
// Each rocks and swings a little on its rope by the clock; none casts off.
const BARGE_HALF = 7.3, BARGE_ROOM = 1.7;
const nearQuay = (x, z) => QUAYS.some(([x0, x1, zs, dir]) => Math.hypot(Math.max(x0 - x, x - x1, 0), Math.max((z - zs) * dir - QUAY_OUT, 0)) < BARGE_HALF + BARGE_ROOM);
function buildBoats(W, extra = [], keepOut = () => false) {
  const g = makeGB(), R = W.RNG.boats, TAR = [0.085, 0.075, 0.07];
  // one barge: 14 m long along x (bow +x), 3.6 broad, its deck 0.9 over the water
  const hull = [[-7, 1.5], [-6.2, 1.8], [3.5, 1.8], [6, 1.1], [7.2, 0]];
  g.col(TAR).mat(5, 0);
  for (let i = 0; i < hull.length - 1; i++) {
    const [xa, wa] = hull[i], [xb, wb] = hull[i + 1];
    g.quad([xa, -0.6, wa * 0.8], [xb, -0.6, wb * 0.8], [xb, 0.9, wb], [xa, 0.9, wa], 8); g.quad([xb, -0.6, -wb * 0.8], [xa, -0.6, -wa * 0.8], [xa, 0.9, -wa], [xb, 0.9, -wb], 8);
    g.quad([xa, 0.55, wa * 0.92], [xb, 0.55, wb * 0.92], [xb, 0.55, -wb * 0.92], [xa, 0.55, -wa * 0.92]);
  }
  g.quad([-7, -0.6, -1.2], [-7, -0.6, 1.2], [-7, 0.9, 1.5], [-7, 0.9, -1.5], 8);
  // a load under a tarpaulin amidships, a small cabin aft, a short mooring post forward
  g.col([0.2, 0.19, 0.17]).mat(5, 0);
  g.quad([-2.5, 0.55, 1.5], [3, 0.55, 1.5], [3, 1.7, 0], [-2.5, 1.7, 0]); g.quad([3, 0.55, -1.5], [-2.5, 0.55, -1.5], [-2.5, 1.7, 0], [3, 1.7, 0]);
  g.tri([-2.5, 0.55, -1.5], [-2.5, 0.55, 1.5], [-2.5, 1.7, 0]); g.tri([3, 0.55, 1.5], [3, 0.55, -1.5], [3, 1.7, 0]);
  g.col(TAR, 1.5).box(-6.2, 0.55, -1.2, -3.6, 2.1, 1.2, 15, 1 | 2 | 8 | 16 | 32); g.box(5.2, 0.55, -0.12, 5.45, 1.5, 0.12, 3, 1 | 2 | 8 | 16 | 32);
  // the cabin's stove pipe
  g.col(CHIMNEY, 0.5).box(-5.0, 2.1, 0.5, -4.8, 3.0, 0.7, 0, 1 | 2 | 8 | 16 | 32);
  // the typed barges are set first (the fork's three, then the four at anchor off the entry); every barge the seed
  // draws keeps 18 m from every barge set before it, and keeps out of the places the river's own things hold
  const places = extra.slice();
  for (const x of [-282, -254, -226, -198]) places.push([x + R.range(-3, 3), -149 + R.range(-2, 2), R.range(-0.08, 0.08)]);
  const want = Math.round(16 * clamp(W.V.density, 0.6, 1.4)) + places.length;
  for (let tries = 0; tries < 300 && places.length < want; tries++) {
    const q = R(), x = R.range(-420, 330), yaw = R.range(-0.06, 0.06) + (R() < 0.5 ? Math.PI : 0);
    const z = q < 0.4 ? bankN(x) + STRAND + 2.6 : q < 0.7 ? islandS(x) + strandS(x) + 2.6 : bankS(x) - STRAND - 2.6;
    if (q >= 0.4 && q < 0.7 && (x < -330 || x > 110 || (x > 54 && x < 102))) continue;
    if (BRIDGES.some((b) => Math.abs(b.x - x) < 26) || (z > 0 && Math.abs(x - 78) < 24) || keepOut(x, z) || nearQuay(x, z) || places.some((p) => Math.hypot(p[0] - x, p[1] - z) < 18)) continue;
    places.push([x, z, yaw]);
  }
  // the rocking and the stove pipes' threads are the barges' own life, on a stream of its own
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, places.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
  const RR = W.RNG.boatrock, ph = places.map(() => [RR.range(0, 6.28), RR.range(0.5, 0.8), RR.range(0, 6.28)]);
  const pipes = places.map((p) => { const c = Math.cos(p[2]), s = Math.sin(p[2]); return [p[0] - 4.9 * c + 0.6 * s, WATER_Y + 3.0, p[1] + 4.9 * s + 0.6 * c, RR.range(PIPE_H[0], PIPE_H[1]) / SMOKE_TOP, RR.range(0, 6.28)]; });
  const rock = (time) => { places.forEach((p, i) => { const f = ph[i]; E.set(0.035 * Math.sin(time * f[1] * 2 + f[0]), p[2] + 0.05 * Math.sin(time * 0.31 + f[2]), 0.012 * Math.sin(time * f[1] * 1.3 + f[2]), 'YXZ'); M.compose(P.set(p[0], WATER_Y + 0.04 * Math.sin(time * f[1] * 2.3 + f[0]), p[1]), Q.setFromEuler(E), ONE); mesh.setMatrixAt(i, M); }); mesh.instanceMatrix.needsUpdate = true; };
  rock(0); mesh.frustumCulled = false; W.scene.add(mesh); W.updates.push((dt, time) => rock(time));
  return { n: places.length, tris: g.tris * places.length, places, pipes };
}
// Weathercocks: a rod, a ball and a plain vane on every small church's cap, the halls' turrets and the great
// house's towers, each turning by small angles about the wind's standing direction, by the clock.
function buildCocks(W, places) {
  const g = makeGB(), R = W.RNG.cocks;
  g.col([0.1, 0.095, 0.09]).mat(5, 0).beam([0, -0.2, 0], [0, 1.7, 0], 0.07, 0.07, 3);
  g.col([0.3, 0.24, 0.1]).mat(7, 0).cyl(0, 0, 0.55, 0.75, 0.12, 0.12, 4, { cap: true });
  for (const s of [1, -1]) {
    const a = [[-0.15, 1.1, 0], [0.75, 1.25, 0], [0.75, 1.5, 0], [-0.15, 1.65, 0]], b = [[-0.15, 1.3, 0], [-0.95, 1.38, 0], [-0.15, 1.46, 0]];
    if (s > 0) { g.quad(a[0], a[1], a[2], a[3]); g.tri(b[0], b[2], b[1]); } else { g.quad(a[3], a[2], a[1], a[0]); g.tri(b[0], b[1], b[2]); }
  }
  // (a gone site's cock takes its draws and is left out)
  const drawn = places.map(() => [R.range(0, 6.28), R.range(0.3, 0.6), R.range(0, 6.28)]), ph = drawn.filter((f, i) => places[i]); places = places.filter((p) => p);
  const mesh = new THREE.InstancedMesh(g.build(), W.plainMat, places.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), ONE = new THREE.Vector3(1.3, 1.3, 1.3), Y = new THREE.Vector3(0, 1, 0);
  const turn = (time) => { places.forEach((p, i) => { const f = ph[i]; M.compose(P.set(p[0], p[1], p[2]), Q.setFromAxisAngle(Y, 0.3 + 0.32 * Math.sin(time * f[1] + f[0]) + 0.08 * Math.sin(time * 1.9 + f[2])), ONE); mesh.setMatrixAt(i, M); }); mesh.instanceMatrix.needsUpdate = true; };
  turn(0); mesh.frustumCulled = false; W.scene.add(mesh); W.updates.push((dt, time) => turn(time));
  return g.tris * places.length;
}

// ---------------------------------------------------------------- the route as flown, and the raising of the world
function makeRoute() {
  const path = makePath(ROUTE.map(V3)), LEN = path.length, _p = new THREE.Vector3();
  // the route's own metre nearest a place of the world (a search at every metre)
  const metreOf = (x, y, z) => { let best = 1e9, bm = 0; for (let m = 0; m <= LEN; m += 1) { path.posAtDist(m, _p); const d = (_p.x - x) ** 2 + (_p.y - y) ** 2 + (_p.z - z) ** 2; if (d < best) { best = d; bm = m; } } return bm; };
  return { path, LEN, metreOf };
}
// everything of the world but the sky, the lights and the church: W carries the scene, the shared uniforms, the
// seed's streams, what this visit is like (W.V) and the route
async function raiseWorld(W) {
  const ctx = W.ctx;
  W.piers = []; W.tops = []; W.plainMat = makeSurface(W.shared);
  await buildGround(W); await ctx.yield();
  // ------------------------------------------------------------ the town
  W.shade = makeShade(); shadeChurch(W.shade);
  for (const o of RANGES) W.shade.block((o.xc + o.xb) / 2, (o.z0 + o.z1) / 2, 0, 1, (o.z1 - o.z0) / 2, 3, o.h0 + o.h1 + o.rise * 0.6);
  shadeMarks(W.shade);
  const kinds = HOUSE_KINDS.map((o) => houseGeometry(o, false)), simple = HOUSE_KINDS.map((o) => houseGeometry(o, true));
  await ctx.yield();
  const plan = makePlan(), lanes = await layLanes(W); await ctx.yield();
  const sites = layChurches(W, plan); await ctx.yield();
  // the quarters' plots are on the plan before any house: the houses are laid round them
  for (const r of W.plots.rects) plan.add(r);
  const houses = await layHouses(W, plan, lanes, kinds), quarters = planQuarters(W);
  dealBank(W, houses);
  await ctx.yield();
  await buildTown(W, houses, kinds, simple); await ctx.yield();
  await buildRoofs(W, houses, kinds); await ctx.yield();
  const bridges = await buildBridges(W); await ctx.yield();
  const fork = buildFork(W); await ctx.yield();
  const qt = buildQuarters(W, quarters); buildWheels(W, bridges.wheels, [fork.wheel, qt.wheel]); await ctx.yield();
  const churches = await buildChurches(W, sites); await ctx.yield();
  buildFar(W); await ctx.yield(); await buildFar2(W); await ctx.yield();
  const boats = buildBoats(W, fork.barges, (x, z) => qt.channel(x, z) || fork.keep(x, z)); buildCocks(W, churches.cocks.concat(W.farCocks)); await ctx.yield();
  await buildFarTown(W, sites);
  await buildWater(W, boats.places.slice(fork.barges.length, fork.barges.length + 4)); await ctx.yield(); await buildMist(W); await ctx.yield(); buildBars(W); await ctx.yield();
  // ------------------------------------------------------------ the life
  await buildSmoke(W, houses, kinds, boats.pipes); await ctx.yield();
  await buildTrees(W, houses, kinds); await ctx.yield(); gatherTops(W, houses, kinds, sites, quarters); await ctx.yield(); await buildBirds(W); await ctx.yield();
  buildCourt(W); await ctx.yield();
  W.houses = houses; W.kinds = kinds; W.sites = sites; W.boats = boats; W.bridges = bridges;
  // (for the count by place) the small churches' bells and the seven wheels as they stand
  W.churches = churches; W.wheelPlaces = bridges.wheels.concat([fork.wheel.p, qt.wheel.p]);
  W.lanes = lanes; W.quarters = quarters;
}

// ---------------------------------------------------------------- the world itself
export default {
  id: 'towers-over-the-old-city',
  name: 'Towers Over the Old City',
  category: 'books',
  placeKind: 'city',
  book: 'Notre-Dame de Paris',
  author: 'Victor Hugo, 1802 to 1885',
  media: ['air'],
  weirdness: 0.15,
  async build(ctx) {
    // (the page is handed back before the first piece, after the route's measure the flocks' stations are counted by and
    // after the stream list: the build's first steps are short)
    await ctx.yield();
    const scene = new THREE.Scene();
    // every stream of this world, made from the seed and a name, in one list before any loop runs
    const mk = (name) => ctx.core.makeRng(ctx.core.hashSeed('towers-' + name + ':' + ctx.seed));
    const stationOf = makeRoute().metreOf; await ctx.yield();
    const RNG = { mood: mk('mood'), sky: mk('sky'), lanes: mk('lanes'), houses: mk('houses'), bridges: mk('bridges'), churches: mk('churches'),
      smoke: mk('smoke'), boats: mk('boats'), trees: mk('trees'), far: mk('far'), cocks: mk('cocks'), mist: mk('mist'), snow: mk('snow'), bars: mk('bars'),
      roofing: mk('roofing'), churchbells: mk('churchbells'), boatrock: mk('boatrock'), fork: mk('fork'), quarters: mk('quarters'),
      way: mk('way'), ice: mk('ice'), entry: mk('entry'), quays: QUAYS.map((q) => mk(quayName(q))),
      // one stream a round of birds, named by the round's place
      rounds: ROUNDS.map((r) => mk(roundName(r))),
      // one stream a round of the birds along the high way, named by its kind, its station's metre and its hand
      flocks: flockStations(stationOf).flatMap((m) => [mk('flock:' + m + ':left'), mk('flock:' + m + ':right')]),
      rooks: flockStations(stationOf).flatMap((m) => [mk('rooks:' + m + ':left'), mk('rooks:' + m + ':right')]),
      gulls: flockStations(stationOf).flatMap((m) => [mk('gulls:' + m + ':left'), mk('gulls:' + m + ':right')]),
      // the moving water's shift
      drift: mk('drift'), marks: mk('landmarks'),
      // the held rafts' sizes (a stream of that law alone)
      rafts: mk('rafts'),
      // the pieces broken off the shelf of ice at the water steps (a stream of that law alone)
      shards: mk('shards'),
      // the southern bank's own (each a stream of one law alone): its roofs' states and what stands on them, its
      // lamps; and which of the gate's tower windows are lit
      roofs: mk('roofs'), lamps: mk('lamps'), gate: mk('gatelamps'),
      // each plume's own seven measures (a stream of that law alone)
      trails: mk('trails') };
    await ctx.yield();

    // ------------------------------------------------------------ what this visit is like
    // The hour is the book's and stands (vary.hour is not honoured: it is always this sunrise). The seed's mood draws
    // the sky's temper; a rare morning is a hoar-frost morning; density scales smoke, warm windows, birds and boats.
    const vary = ctx.vary || {}, moodDraw = RNG.mood(), mood = vary.mood ?? moodDraw, density = vary.density ?? 1, hoar = !!vary.rare;
    const temper = mood < 0.45 ? 'clear' : mood < 0.75 ? 'bars' : 'mist';
    const snowDepth = RNG.snow.range(0.82, 1), mistTop = temper === 'mist' ? 1.2 : -1;
    const V = { temper, hoar, density, snowDepth, mistTop };

    // ------------------------------------------------------------ sky, light, air
    const sunDir = V3(SUN).normalize();
    const shared = makeShared({ sunDir, snow: snowDepth, hoar: hoar ? 1 : 0 });
    await ctx.yield();
    const sky = makeSky({
      rng: RNG.sky, preset: 'dawn', zenith: temper === 'clear' ? '#1d3672' : '#2a4480', mid: '#5b7ab8', horizon: '#aab6d8', ground: '#465272',
      horizonPow: 3.2, midPow: 1.4, scatterColor: '#f7bf8c', scatter: 1.0, scatterPow: 2.6, scatterHigh: 0.04, scatterFall: 4.6,
      sunDirection: sunDir, sunColor: '#ffe9c4', sunSize: SUN_RADIUS, sunIntensity: 3.2, sunGlow: 0.42, sunGlowTight: 0.5,
      lightElevationMin: 5, lightColor: '#ffcf9c', lightIntensity: 3.4, ambientColor: '#7186b4', groundLight: '#57526a', ambientIntensity: 1.3,
      clouds: false,
      clouds2: temper === 'bars' ? { coverage: 0.38, stretch: 1, opacity: 0.5, scale: 0.55, softness: 0.6, detail: 0.1, lit: '#f4d6c6', shade: '#8f93b2', wind: [0.006, 0.0015] } : false,
      bodies: temper === 'clear' ? [{ direction: [-0.895, 0.156, 0.418], size: 0.5, phase: 0.9, phaseAngle: 110, color: '#f2efe6', color2: '#c9cbd2', texture: 0.4, intensity: 0.85, glow: 0.12, glowSize: 3 }] : [],
      bake: temper === 'clear', renderer: ctx.renderer, fogColor: '#a9b7d9',
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color('#a9b7d9'), 0.00075);
    const hemi = new THREE.HemisphereLight(new THREE.Color('#7186b4'), new THREE.Color('#57526a'), 1.3);
    const sun = new THREE.DirectionalLight(new THREE.Color('#ffcf9c'), 3.4);
    // one shadow map, drawn once, fitted to the church and the 150 m round it; the sun never moves
    // (every body that casts into it is an instanced mesh, the single ones of one instance, so that the map needs one
    // depth program only and that one is made with the first things the loader draws, never at the first frame)
    sun.target.position.set(60, 20, 8); sun.position.copy(sun.target.position).addScaledVector(sunDir, 700);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -215, right: 215, top: 120, bottom: -75, near: 200, far: 1200 });
    sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.35;
    sun.shadow.autoUpdate = false; sun.shadow.needsUpdate = true;
    scene.add(hemi, sun, sun.target);
    await ctx.yield();

    // ------------------------------------------------------------ the church (the hero), in the world's own axes
    // (the part is handed the route's last point, the ring's seat: what stands behind the ring keeps its distance from it)
    const hero = await buildHero(ctx, { shared, doorSeat: ROUTE[ROUTE.length - 1] });
    hero.object.position.set(CHURCH.length / 2, 0, 0); hero.object.rotation.y = -Math.PI / 2;
    hero.object.updateMatrixWorld(true); scene.add(hero.object);
    await ctx.yield();

    // ------------------------------------------------------------ the route, the town, the life
    const { path, LEN, metreOf } = makeRoute();
    // on a small machine the smoke threads are fewer (ctx.quality.detail)
    const W = { ctx, scene, shared, V, RNG, path, LEN, metreOf, detail: clamp(ctx.quality?.detail ?? 1, 0.4, 1), updates: [] };
    await raiseWorld(W);

    // ------------------------------------------------------------ the gaze and the pace, by places of the world
    const bellM = (m, a, b, f) => smoothstep(a, a + f, m) * (1 - smoothstep(b - f, b, m));
    // every measure here is the metre of a typed place of the route (by its letter in ROUTE)
    const at = (i) => metreOf(...ROUTE[i]), mD = at(3), mE = at(4), mG = at(6), mI = at(8), mJ = at(9), mQ = at(16), mS = at(18), mT = at(19), mW = at(22), mX = at(24), mX2 = at(25);
    // THE PACE: slowest up the west front (G to J) and into the door (it slows from W, over the southern arm, to X2,
    // over the court); quickest over the garden's point and the fork (20 m short of Q to 20 m short of S); the common pace over the
    // bank's roofs, where the gaze turns to the south front
    const paceAt = (m) => 1 - 0.4 * bellM(m, mG - 25, mJ + 20, 25) + 0.3 * bellM(m, mQ - 20, mS - 20, 40) - 0.3 * smoothstep(mW, mX2, m);
    // THE TWO PULLS OF THE GAZE, each ramp laid between named places:
    const westFrom = mD - 20, southFrom = mS - 40;
    const pois = [
      // the west front's rose: it takes the gaze from 20 m short of D (the mill bridge's ridge) to E, holds it, and
      // lets it go over the same length before I (the foot of the climb)
      { at: new THREE.Vector3(0, 31, 0), from: westFrom / LEN, to: mI / LEN, weight: 0.5, fade: (mE - westFrom) / (mI - westFrom) },
      // the south front: it takes the gaze from 40 m short of S to T (the turn west over the bank), holds it, and lets
      // it go over the same length before X (the water steps): from U, within a metre
      { at: new THREE.Vector3(78, 22, CHURCH.southFace), from: southFrom / LEN, to: mX / LEN, weight: 0.55, arc: true, fade: (mT - southFrom) / (mX - southFrom) },
    ];
    // the door's warm light: a metre under the portal's seat (the route's last place) and a metre out toward the
    // court, so that it falls on the jambs' faces and on the way before the door
    const seat = ROUTE[ROUTE.length - 1];
    shared.uPortalPos.value.set(seat[0], seat[1] - 1, seat[2] + 1); shared.uPortalCol.value.set(...lin('#ffb45e', 2.2));

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DURATION,
      pace: (u) => paceAt(u * LEN),
      camera: { fov: 62, near: 0.3, far: 5200, sway: 0.5, bank: 0 },
      pois,
      portal: { shape: 'arch', width: 9, height: 12, color: '#ffb45e', glow: 1, revealDistance: 420 },
      post: { exposure: 1.04, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.03, contrast: 1.05, vignette: 0.26, grain: 0.02 } },
      update(dt, time, camera) {
        shared.uEdge.value = edgeAt(time); shared.uTime.value = time;
        hero.update(dt, time, camera);
        sky.update(dt, time, camera);
        for (const f of W.updates) f(dt, time, camera);
      },
      dispose() { sky.dispose(); },
    };
  },
};
