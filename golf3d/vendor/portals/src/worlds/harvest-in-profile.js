// HARVEST IN PROFILE. After Giuseppe Arcimboldo (1526 or 1527 to 1593): an original place in the manner of his composite heads.
// A kitchen garden at bee scale beside a dark river climbs into a hill 500 m tall that proves, as the line swings south over
// the water, to be nobody's head in profile, of produce the size of houses.
//
// THE MANNER, said at the head (owner's term g): THE DARK PAINTED GROUND IS THE SKY HERE AND IS WHOLE. There is no sky, no
// fog, no lamp, no bloom: one warm sun by place (0.569, 0.669, -0.478), shade baked by place as a brown glaze, land and water
// lost by place into the ground's own colour. Flat post: a hex written is the hex shown; no inverse tone map anywhere.
// THE READINGS OF THE VIEW, ALL OF THEM (c12; each with its line in the handoff, FIX 13). AS LIGHT DOES: the direction to the eye for each
// glossy piece's highlights and sheens and the grape's rim (the part); for the river, that direction turned over at the level for the sky's
// double it carries (ruling 9, part 1a) and its steepness for the share of that double; the length of dusty air the eye's ray crosses in each
// shaft; the painted ground behind a thing, the colour land and water lost BY PLACE go into. AS A FILTER: the pixel's footprint (fwidth, the
// texture's own level), by which a pattern finer than the picture's grain goes over to ITS OWN MEAN, each mean a figure COUNTED or reckoned and
// written at its place (c13): the ripple bands 0.2229, the pool's glints 0.0711, the plots' seams 0.2584, the hedges' band, the rows' wave (mean 1),
// the plots' plants and paths (ownm: the soil's counted share and uLandOwn, the pigments by their counted shares of the land). uLandMean is NOT such
// a mean: it is the tone the far land is given BY PLACE, a painter's figure, and stays. ON THE PAGE at 640 and 1,920 across, from two poses, the
// land's mean tone differs by 0.04 to 0.39 of 255 (shots/harvest-in-profile/fix14/twosize.txt). UNTRUE AND KEPT (the owner's rule of
// reading of 14 Oct): THE RIVER IS A SHEET WITH NO DEPTH AND NO BED. Its cover is reckoned from the painted ground seen through it in the
// look's direction, so that it stands at its own body's colour whatever lies behind, and its body is set lighter under a flat look by a
// painter's figure. Nothing is faded away by it and no distance from the lens is read; but water does not do this. THE HONEST MEND: a bed
// under the river (or the sheet drawn whole, the doubles drawn into it), then only the mirror and its share by steepness. Not done in c12 nor in c13:
// it would change the picture of 560 m. Nothing is placed, hidden, moved, timed or lit by u, the lens, a seed number or the wall's clock:
// update() writes the world's clock into uniforms and the creatures' reused matrices, by place and that clock alone.
// THE HEAVIEST SEED (c13, counted in node on seeds 1 to 40: shots/harvest-in-profile/fix14/triangles-forty-seeds.txt): seed 37, a rare garden (its dealt
// leaves 37,940 triangles; seed 1's 21,764), builds 493,518 triangles (c12 built 495,382 there); the lightest, seed 27, 475,456. On the gate's seeds the
// page draws at its peak (70 m and equally 2,134 m) 482,245 (seed 3), 480,587 (seed 7), 481,449 (seed 21) in 71 calls; the bound of 488,000 is theirs.
// SECTION 181: none brought in (the hashes' constants are the world's own; a cell pattern by nearest and second-nearest point, a golden-angle spiral, a ray against a box are general methods in this file's own words).
//
// FRAME: the ruling's and the engine's, unchanged: +x east (the way the face looks), +z south, y up from the river (y 0),
// origin under the head's axis. The hero stands at the origin unrotated.
//
// DEPARTURES from the brief and the ruling, in their words (first review, fix 0):
// - "the eye low (y 70 to 90)" at the reveal: the eye is at y 30. From 70 to 90 the far shore falls at the picture's lower edge
//   and nothing of "the whole doubled in the water" can show; from 30 the river is the picture's lower fifth.
// - "the turned-over proxy ... as its mirror": the head's double is pressed to MIRROR_K of its height (see below); every
//   other double stands at its true height (lead's ruling 3, part 2).
// - "one pumpkin 70 across on a spit about (170, 0, -670)": it stands on an islet in the reach at (80, 0, -530), inside the
//   right arc and south of the line (lead's ruling 3, part 2: the line sees its sunlit side, the head beyond it); the rick is
//   at (118, -716) on the north bank.
// - "at most five looks ... the ear, the eye": five (c12): the arrival's lift to the head over the rows (0 to 440 m) and,
//   over the first 150 m, a second lift above it (the rows' stooks and cabbages at the picture's foot, little soil); the
//   pumpkin from the nave; the reveal; and ONE look at the head from the beard (1,146 m) to the line's end, its point
//   sliding by place (the vine with the head, the face, the sunflowers with the pergola's grapes from under the rack's
//   east end, the head with its whole double, the great bough's apples, the whole head from afar, the head with the west
//   bank's sunflower, the sunflowers and the lips, the front, the brow and crown over the ring, the nose's root side).
//   The pumpkin's east shoulder over the reach (c10's look 5) and the wall's own look are out.
// - "2,715 long", "duration 56 s": 3,498 m in 64 s (lead's ruling 7, part 5). To 1,300 m the line is the one of before:
//   rows, nave, the pumpkin's arc, the reveal, the climb to the pergola's west end with the grapes at the picture's left
//   and the head beyond. Then: THE TURN OUT round the pergola's south side (1,300 to 1,470 m); OUT north over the
//   forecourt and the reach, the pumpkin's lit shoulder ahead of the line (to 1,570 m), the gaze swung from the head to the
//   sunflowers and the grapes over the rack's east end and back (c12: 1,300 to 1,640 m; the head is let go there); the gaze stays on the
//   head while the line runs on north by the wall's lit step, its espaliers, the rick, the apple and the pears (1,640
//   to 2,124 m; the head whole in the picture from 1,700 m); the line crosses the wall through its fallen length
//   (2,124 m) and THE WHOLE HEAD FROM AFAR is
//   held round a turn 740 to 810 m north of the head, 40 to 82 m up (2,160 to 2,487 m, 7 s); IN over the reach from north
//   to east, the profile turning to three quarters (to 3,160 m), the sunflowers with the face, the face from the front
//   and the mouth as before. The passes beneath the chin, over the shoulder and by the eye are gone (ruling 7, part 5).
//   "about 10 goldfinches", "18 brimstone butterflies": six goldfinches at their named places and six
//   brimstones in the rows, plus a station beside the line every 32 m of it from the reveal on, a pair of brimstones or one
//   goldfinch (ruling part 7's least motion), each set beside what the lens truly looks at from there, never before the head
//   and never seen wider than a twentieth of the picture (c12: the six of the rows are stations too, and one at a named
//   place is made only where that holds)
//   (lead's review c2: one goldfinch, whole, with one or two brimstones on the dark side; no charms); in the far view none
//   within 150 m of the line (ruling 5, part 3); a flock of 24 sparrows that wheels round the head, nine over the rick by
//   the wall, wasps and brimstones at the near espaliers (ruling 7, part 6).
// - "no bloom ... no second light", "no swallows, no motes" (fauna): lead's ruling 4, part 2, behind the one switch
//   LIGHT_IN_AIR, on the owner's seven terms (ruling 5): five places of the one sun's light in dusty air, each two of its
//   radii and more from the line, with a few pollen specks drifting in them, a warm pool on the land or the water, and
//   the long cast shade of the head's and the garden's own triangles on the land. THE SHAFTS THEMSELVES ARE OUT (ruling
//   9, part 8; SHAFTS_DRAWN false, no mesh, no call): against c9's lighter low sky they read as dull red bars. The
//   motes, the cast shade and the five pools stand. Nothing of it is drawn on the ground (the dome).
// - "on stook ears, sunflower rims and the lower lip": no goldfinch at the lip (ruling 2: none on crown, face, beard or mouth).
// - all the land is planted to where it is lost, which the brief leaves bare (ruling 2, part 2: no edge of the world;
//   ruling 7, parts 2 and 3): beyond the dealt plants it is a kitchen garden's plots, 64 to 136 m, parted by straw paths,
//   each one crop in countable rows (red cabbage, lettuce, carrot, marigold, leek, squash, or fallow), a pool of warm
//   light at each of the five pools and the rest 0.6 of that; it rises in slow swells beyond 880 m. THE FAR LAND HAS
//   DISTANCE (ruling 9, part 5; FARLAND10 below): the plain runs to 2.3 km with parcels of 400 m beyond the plots, and
//   three ranges of hills stand 1.9 to 2.3 km out, unlike by bearing (north-west to 251 m over the plain, a broken
//   south-east range of 94 to 118 m, a low west rise of 49 to 75 m, none between bearings 25 and 110); it fades by
//   place between 500 and 2,300 m, never past 0.72, toward the sky's tone on its own bearing. THE BELT:
//   the garden's far wall, 20 uneven lengths of old brick 700 to 1,000 m from the head with FIVE gateways (c15: this line said three; BELT.wall, L159 to L162, holds five 'g') and two fallen
//   lengths, espaliers on its sunward faces, and 26 great pears, apples and quinces in unequal clumps before and behind
//   it; its north run, which the line crosses, has near specimens. The far tents, hedges, gourds and cabbage domes of
//   before are retired, and the far specimens beyond 690 m with them (the belt stands there).
// LEAD'S RULINGS 2 TO 4 (13 Oct), over the brief's figures: "pods pass 35 to 45 off", "hairpin of radius 50 ... west point
//   (-62, 274, -190)", "east at z -148 beside ear and cheek (20 clear each)", "eye abeam ... 32 clear": those passes are
//   not flown (ruling 7, part 5); the line's nearest to the head is the mouth itself.
//   "#33291A a broad lift low toward plus x": the ground is three close warm
//   near-black values (#0F0C09, #1E170F, #2A2217 at its lightest, low in the south; lead's review c2). "portal ... rim #E0A12B": the engine's glow is 0 (it
//   lays a white core on a rim) and the rim is the world's own gold ring. "Land and water fade by place into the dome's own
//   colour (one shared function)": the land's own glaze loses it sooner and over a longer breadth than the water and the
//   garden's bodies (ruling 4, part 3: no level edge).
// - "climbing the north-west and north shoulder to y 120": the bust is planted rim to neck (y 190) with squash leaves, flowers
//   and fruit on its north, east and south-east faces (second review: no bare soil on the shoulders).
// - THE PAINTED SKY (round c9, ruling 8 part 5; a departure: THE DARK PAINTED GROUND of the manner above and the
//   three near-black values named below are overtaken): the ground is the part file's hpGround, a sky painted by world direction
//   alone: a low band of straw-grey light to about 8 degrees, warmest toward the sun's level bearing, slate blue above
//   it, blue-black umber overhead, deep in the west nearly to the level. Measured on the page (display value of white):
//   its lightest hundredth 0.36, its median over 10 degrees 0.16 to 0.21. Land, water and far things fade toward its
//   tone on their own ray; the river carries its double (0.75 of it at a grazing ray, 0.1 straight down, the sheet's own
//   tone never over 0.40).
//   AS IT IS ON THE PAGE (c13; the twelve stills of seed 7, the picture's top eighth): ONE PAINTED TONE, kept BY DECISION (ruling 12: the sky stays as it
//   is). A dark blue-green, display value about (0.09 to 0.11, 0.23 to 0.25, 0.26 to 0.27), its median 0.19 to 0.22 of white in eleven of the twelve;
//   the straw band shows only low toward the sun over the first 560 m (median 0.30 at 560 m), the bars as faint level streaks. The slate, the umber
//   overhead and the turn by height described above are in the bytes, but the lens, which looks level or down, does not hold them: say one tone.
// - MEASURED TONES (round c10, seed 7, display value of white): the head's lit produce, lightest hundredth 0.74 to 0.77
//   (lightest tenth 0.62 to 0.69); lit produce in the rows 0.72 to 0.82; the laid straw 0.52; the far land beyond
//   1,400 m of the axis 0.36 to 0.45 at its lightest hundredth (median 0.24 to 0.34); the river's own sheet 0.17 to
//   0.26 near and 0.30 to 0.35 far. The head and the lit produce are the lightest and most coloured things.
// - THE OWNER'S c3 (the pumpkin seen lit from the pond) IS NOT MET: over 466 to 660 m the line looks at the pumpkin's
//   shade side (0.13 to 0.14, orange brown) against the light, on water lighter than itself (0.27 to 0.34); its lit
//   east shoulder was shown from the reach by c10's look of 1,404 to 1,699 m, which is gone since c11 (from 1,146 m on the one look is the head's): no look shows it now. A cure needs a new first third of the line.
import * as THREE from 'three';
import { makePath, makeRng, smoothstep, clamp, bell } from '../kit/core.js';
import {
  buildHero, PIGMENTS, SUN_DIR, STYLE, GROUND_GLSL, GLAZE_VERT, GLAZE_FRAG, glazeMaterial, makeGroundDome, makeGlazeTextureAsync,
  Geo, surf, lathe, leaf, headOf, makeSpecimens, seat, aim, frame, leafFrame, bakeShade, bustHeight, trumpet, peaFlower,
} from '../parts/harvest-in-profile.js';

// THE ONE SWITCH (ruling 4, part 2). true: the one sun's light is seen in the air (five shafts with their motes, the warm
// glints in the pool on the water) and standing things throw long cast shade on the land. false: none of it is drawn and
// the world is otherwise the same.
const LIGHT_IN_AIR = true;
// THE SHAFTS ARE OUT (ruling 9, part 8). This one constant governs the shaft mesh and its two shaders and nothing else:
// false, no column is drawn in the air (they read as fog); the table SHAFTS stays, and the shade map, the five pools of
// light on the land, the glint on the water and the motes are built from it as before.
const SHAFTS_DRAWN = false;
const STRAW_K = 0.45;                                                // the laid straws' pigment against the stooks' (ruling 9, part 4: no straw's lit tone over 0.55 of white)
const TAU = Math.PI * 2;
// THE MIRROR (ruling 3, part 2): every doubled thing is its own mesh turned over about the river's level. The low things by
// the water (pumpkin, vine and flowers, islet, stooks, rick, bank leaves, the banks themselves, the muscat vine's poles, the
// sunflowers) are doubled at their TRUE height and hardly stirred, so that the double is crisp at the bank. Only the head is
// pressed, to MIRROR_K of its height (the true double of a 500 m head seen from 500 m falls outside any frame that holds the crown).
const MIRROR_K = 0.26;
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sst = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const hsh = (x, y) => { const s = Math.sin(x * 141.79 + y * 318.23) * 44213.6189; return s - Math.floor(s); };   // the world's own constants (c13)
const vnz = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return (hsh(ix, iy) * (1 - fx) + hsh(ix + 1, iy) * fx) * (1 - fy) + (hsh(ix, iy + 1) * (1 - fx) + hsh(ix + 1, iy + 1) * fx) * fy; };

// ---------------------------------------------------------------- the map (the ruling's, part 1; the brief's `space`)
const MAP = {
  entry: [-550, 16, -614],
  savoy: [-506, -571],                 // the first savoy of the row, 22 off the line
  stooks: [[-372, -503], [-338, -558]],// the two hero stooks, 16 off the line either side
  nave: { a: [-205, -421.5], b: [-102, -459], w: 40, h: 60, y0: 21, y1: 24 },   // bean nave: 110 long, 40 wide inside, poles 60 tall; the line runs its axis at y0 to y1
  pumpkin: [80, 0, -530],               // on its islet in the reach, inside the right arc and south of the line (ruling 3, part 2): on the nave's own axis 190 beyond its mouth, and 80 to 98 from the arc between its north and east points, which look on its sunlit side
  islet: 56,                            // the islet's radius
  cove: [10, -660, 40],
  rick: [118, -716],                    // on the lit north bank: behind the pumpkin and to its right as the line comes at it, then ahead and on the left as the line swings east over the water
  arcB: { c: [60, -505], r: 115 },     // the right arc that ends heading south: the reveal, eye within 20 degrees of strict profile
  vine: { a: [274, -213], b: [322, -190] },
  sunflowers: [[436, -130, 322, 55, 82], [470, -48, 345, 55, 102], [440, 38, 300, 50, 350]],   // x, z, height, head across, and the bearing its face is turned to (0 north, 90 east): the first two east, toward the morning side, so that the line coming from the west meets their backs square with the rays lit through; the third north-north-west, its lit face to the line
  round: [56, 257, 0],
};
// THE FAR BELT (ruling 7, part 3; the owner's terms a to e): the far wall of the walled kitchen garden, part of the land, 700
// to 960 m from the head, an uneven many-sided run (never a circle), and the great fruit trees before and behind it. wall:
// its corners in order (x, z, and what the length that begins there is: 'w' wall, 'g' an open gateway in its middle, 'f' a
// fallen length at its end, 'n' the near lengths about the step, built as specimens). step: the middle of the lit step
// (corner 4 to corner 5), which faces east-south-east to the sun: THE WALL of the line's second half.
const BELT = {
  wall: [[-690, -610, 'g'], [-650, -700, 'w'], [-380, -745, 'w'], [-150, -716, 'f'], [22, -706, 'n'], [52, -768, 'n'], [215, -772, 'w'], [400, -700, 'g'], [640, -560, 'w'], [800, -380, 'g'], [870, -60, 'w'], [820, 260, 'w'],
    [700, 520, 'g'], [430, 720, 'f'], [120, 790, 'w'], [-200, 760, 'g'], [-520, 640, 'w'], [-760, 380, 'w'], [-860, 60, 'w'], [-800, -320, 'w']],
  step: [37, -737],
};

// THE LINE: legs a to d as the brief's journey gives them (true arcs sampled every 22.5 to 45 degrees), e to h as the lead's
// ruling 5 gives them. No point here is a still's
// position: stills fall where fractions of the length fall.
function coursePoints() {
  const P = [], M = MAP, add = (x, y, z) => P.push([x, y, z]);
  const arc = (c, r, a0, a1, y0, y1, n, skipFirst, dip) => { for (let i = skipFirst ? 1 : 0; i <= n; i++) { const t = i / n, a = (a0 + (a1 - a0) * t) * Math.PI / 180; add(c[0] + r * Math.sin(a), dip ? dip + (y0 + (y1 - y0) * t - dip) * (2 * t - 1) * (2 * t - 1) : y0 + (y1 - y0) * (t * t * (3 - 2 * t) * 0.5 + t * 0.5), c[1] - r * Math.cos(a)); } };   // dip: the height at the arc's middle
  // a: entry, level for 60 east-south-east, then the savoy row, the stooks, the nave
  add(...M.entry); add(-523, 16, -598.5); add(-496.3, 16, -583); add(-448, 16.5, -557); add(-406, 17, -531); add(-367, 18, -504);
  add(-330, 19, -476); add(-296, 20, -451); add(-262, 20.5, -433); add(-232, 21, -424); add(-205, 21, -421.5); add(-153.5, 22.5, -440.2); add(-102, 24, -459);
  // b: off the bank, over the water past the pumpkin, the right arc round toward the south (the reveal comes on this arc)
  add(-70, 25, -512);
  arc(M.arcB.c, M.arcB.r, -55, 90, 26, 30, 7);                   // bearing angle a: 0 = the north point (heading east), 90 = the east point (heading south)
  // c: south, low over the water (the head stands whole over its double: from 30 m up the river fills the foot of the picture;
  // from the ruling's 70 to 90 the far shore sits at the picture's lower edge and nothing is doubled), then south-south-east,
  // rising toward the pergola: THE VINE WITH THE HEAD (ruling 5, part 3): the grapes stand at the left of the picture, 80 to
  // 120 m off and level with the eye, the head in three-quarter beyond them at the right
  add(182, 33, -470); add(200, 45, -432); add(238, 68, -392); add(274, 92, -350); add(290, 107, -314); add(290, 118, -284);
  // d: a right turn to the pergola's west end, and THE TURN OUT (ruling 7, part 5): a left turn of radius 54 round the
  // pergola's south side over the forecourt's beds (its poles 25 m and more inside the turn), the head behind the lens
  add(276, 126, -262); add(258, 132, -238);
  arc([297, -206], 54, 270, 90, 136, 104, 6);                      // from its west point (heading south) by the south point to its east point (heading north)
  // e: OUT, north-north-west and down over the reach (the pumpkin's lit side at the left) to the north bank's beds, low, and to
  // THE WALL: the garden's far wall where its north run steps north (BELT below): the east face of the step lit, with its
  // espaliers and the pool of sun at its foot, the rick beside it, great trees over it. The line passes the pool's column on
  // its south-west side and crosses the wall's north run west of the step
  add(345, 93, -262); add(322, 81, -330); add(286, 68, -400); add(243, 57, -470); add(198, 48, -546); add(134, 41, -610); add(58, 38, -645); add(26, 38, -690);
  add(6, 39, -722);
  // f: beyond the wall, a left turn of radius 42 under the great apple's crown, and THE WHOLE HEAD FROM AFAR: from the turn's
  // north point on the head stands whole in strict profile across the wall's top, the river and the lit garden
  add(0, 40, -752); add(-12, 42, -780); add(-42, 45, -791); add(-72, 49, -780); add(-84, 54, -752); add(-83, 60, -716); add(-70, 68, -676); add(-40, 82, -628);
  // g: IN, south-east and up over the reach and the forecourt, the face turning from profile to three quarters: THE SUNFLOWERS
  // WITH THE FACE; h: a right turn before the sunflowers onto the mouth's axis: THE FACE FROM THE FRONT
  add(0, 98, -578); add(60, 124, -504); add(134, 157, -420); add(214, 194, -335); add(290, 232, -250); add(344, 262, -166); add(368, 276, -96); add(366, 273, -58); add(343, 264, -24); add(298, 258, -3);
  // i: straight, level, due west on the mouth's axis to the round
  add(240, 257, 0); add(180, 257, 0); add(125, 257, 0); add(90, 257, 0); add(...M.round);
  return P;
}

// pace: the speed at each place of the line over the average: slow where a picture is held (the pumpkin's arc, the reveal,
// the vine, the wall, the whole head from afar, the sunflowers, the front), quick on the links (out over the reach, in over
// it). Its knots are PLACES of the world (the nearest point of the line to each), never fractions; smooth, a pure function of u.
const LINE = makePath(coursePoints()), LINE_LEN = LINE.length;
const LINE_S = new Float32Array(1201 * 3); { const v = new THREE.Vector3(); for (let i = 0; i <= 1200; i++) { LINE.posAtDist(i / 1200 * LINE_LEN, v); LINE_S[i * 3] = v.x; LINE_S[i * 3 + 1] = v.y; LINE_S[i * 3 + 2] = v.z; } }
const dAtPlace = (x, y, z) => { let best = 1e18, bd = 0; for (let i = 0; i <= 1200; i++) { const ax = LINE_S[i * 3] - x, ay = LINE_S[i * 3 + 1] - y, az = LINE_S[i * 3 + 2] - z, d = ax * ax + ay * ay + az * az; if (d < best) { best = d; bd = i / 1200 * LINE_LEN; } } return bd; };
const PACE = [[MAP.entry, 0.93], [[-102, 24, -459], 0.95], [[-34, 26, -571], 0.74], [[60, 27, -620], 0.68], [[146, 29, -581], 0.74], [[175, 30, -505], 0.86], [[200, 45, -432], 0.9], [[274, 92, -350], 0.8], [[258, 132, -238], 0.84],
  [[243, 136, -206], 0.9], [[297, 120, -152], 0.95], [[351, 104, -206], 1.15], [[286, 68, -400], 1.45], [[198, 48, -546], 1.15], [[134, 41, -610], 0.8], [[58, 38, -645], 0.6], [[6, 39, -722], 0.56], [[-42, 45, -791], 0.72], [[-83, 60, -716], 0.75], [[-40, 82, -628], 0.85],
  [[60, 124, -504], 1.35], [[214, 194, -335], 1.4], [[344, 262, -166], 0.95], [[366, 273, -58], 0.72], [[343, 264, -24], 0.85], [[240, 257, 0], 0.95], [MAP.round, 1]].map(([p, k]) => [dAtPlace(p[0], p[1], p[2]), k]);
PACE[0][0] = 0; PACE[PACE.length - 1][0] = LINE_LEN;
function paceAt(u) {
  const d = u * LINE_LEN; let i = 0; while (i < PACE.length - 2 && d > PACE[i + 1][0]) i++;
  const a = PACE[i], b = PACE[i + 1]; return a[1] + (b[1] - a[1]) * sst(a[0], b[0], d);
}

// ---------------------------------------------------------------- land and water, by place (the same on every seed)
// waterDepth(x, z) > 0 in the river: the narrow channel along the garden's north edge, the broad reach north of the hill,
// the bend south round the front of the bust. landY(x, z): the banks (about 7 above the river) and the shoulders, which are ground.
function waterDepth(x, z) {
  const n = 9 * (vnz(x * 0.011 + 3.1, z * 0.011 + 7.7) - 0.5) + 4 * (vnz(x * 0.031, z * 0.031 + 2.2) - 0.5);
  const dR = Math.min(x + 84, 540 - x, z + 624, -244 - z), dW = Math.min(z + 670, -636 - z, -40 - x), dE = Math.min(x - 500, 705 - x, z + 624);
  return Math.min(Math.max(dR, dW, dE, MAP.cove[2] - Math.hypot(x - MAP.cove[0], z - MAP.cove[1])) + n, Math.hypot(x - MAP.pumpkin[0], z - MAP.pumpkin[2]) - MAP.islet + n * 0.5);
}
// THE LAND HAS GENTLE RELIEF: beyond 880 m of the head's foot (the garden, the river's reach and the whole line lie inside
// that) it rises slowly, 100 m in a kilometre, and rolls in swells of two sizes, so that the far land with what
// stands on it is seen from above even by a low eye and is lost into the ground's colour over a breadth, never along a line.
// FARLAND10 (ruling 9, part 5): THE FAR LAND HAS DISTANCE. Inside 1,400 m of the head's axis the land is c8's to the
// figure. Beyond, BY PLACE ALONE (bearing about the axis: 0 north = -z, 90 east = +x; the sun stands at 50): the even
// rise eases over 1,400 to 1,600 m from 100 m in a kilometre to 35, and to nought between bearings 25 and 110 (the open
// plain under the sun); the swells calm to two fifths (a quarter on the open plain); and three ranges of hills stand on
// the plain, every crest 1,900 to 2,250 m out: a north-west range (bearings 305 through north to 0, easing out by 282
// and 23; 155 m and up to 270 at 325), a broken south-east range (three hills of 120, 120 (c11: lower and broader, 16 degrees to a side; the valley takes half of it) and 110 m about 123, 150 and
// 186 on a low sill of 10 m: a gap between the first two and the river's own valley between the last two), and a low west
// rise (70 m about 255). Toward the river's two far reaches (south and west) the plain eases down over 420 m and the hills over 800: the
// river runs out through valleys, never through a cutting. AS BUILT on the mesh's own cells (c11, by c10's landproof script): crests
// 1,990 to 2,330 m out; over the plain the north-west range 91 to 251 m (highest at bearing 330, tapering to nought by 23),
// the south-east hills 118, 109, 58 and 94 m with gaps, the west rise 49 to 75 m; the steepest hill triangle 29.6 degrees.
const FAR_HILLS = [[123, 12.5, 120], [150, 16, 120], [186, 14, 110], [157, 44, 10], [255, 45, 70], [325, 28, 115]];   // bearing of the middle, half breadth (degrees), height (m)
const FAR_CREST = 2060, bearOff = (b, c) => Math.abs(((b - c) % 360 + 540) % 360 - 180);
function farHills(b) { let h = 155 * sst(50, 27, bearOff(b, 332.5)); for (const [c, hw, hh] of FAR_HILLS) { const o = bearOff(b, c); if (o < hw) h += hh * 0.5 * (1 + Math.cos(Math.PI * o / hw)); } return h; }
function farRise(x, z, d) { const R = Math.hypot(x, z); if (R < 880) return 0;
  const sw = (84 * (vnz(x * 0.0017 + 5.3, z * 0.0017 + 1.7) - 0.5) + 30 * (vnz(x * 0.0046 + 2.1, z * 0.0046 + 8.4) - 0.5)) * sst(880, 1350, R);
  if (R <= 1400) return (0.1 * (R - 880) * sst(880, 1300, R) + sw) * sst(0, 140, d);
  const b = (Math.atan2(x, -z) * 180 / Math.PI + 360) % 360, open = sst(52.5, 42.5, bearOff(b, 67.5)), s1 = 0.035 * (1 - open) - 0.1;
  const t = Math.min(1, (R - 1400) / 200), even = 52 + 0.1 * (R - 1400) + s1 * (200 * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, R - 1600));
  const a = 0.2, tu = Math.min(1, (R - 1400) / (FAR_CREST - 1400)), up = tu < a ? tu * tu / (2 * a * (1 - a)) : tu < 1 - a ? (tu - a / 2) / (1 - a) : 1 - (1 - tu) * (1 - tu) / (2 * a * (1 - a));
  const dv = Math.min(z > 0 ? Math.abs(x - 602.5) - 102.5 : 1e9, x < 0 ? Math.abs(z + 653) - 17 : 1e9), vale = sst(0, 420, dv);
  return ((52 + sw * (1 - (0.6 + 0.15 * open) * sst(1400, 1700, R))) * (1 - 0.6 * (1 - vale) * sst(1400, 1700, R)) + (even - 52 + farHills(b) * up * (1 - 0.6 * sst(FAR_CREST + 30, FAR_CREST + 480, R)) * sst(40, 820, dv)) * vale) * sst(0, 140, d); }
function bankY(x, z) {
  { // far inland the banks' easing is done and the water's own noise (6.5 m at most) changes nothing: the same value with one reading of the noise for three
    const dR = Math.min(x + 84, 540 - x, z + 624, -244 - z), dW = Math.min(z + 670, -636 - z, -40 - x), dE = Math.min(x - 500, 705 - x, z + 624);
    const D0 = Math.min(Math.max(dR, dW, dE, MAP.cove[2] - Math.hypot(x - MAP.cove[0], z - MAP.cove[1])), Math.hypot(x - MAP.pumpkin[0], z - MAP.pumpkin[2]) - MAP.islet);
    if (D0 < -147 || (D0 < -67 && x * x + z * z < 774400)) return 7 + 1.6 * (vnz(x * 0.02 + 11, z * 0.02 + 5) - 0.5) + farRise(x, z, 141); }
  const d = -waterDepth(x, z); return d < 0 ? Math.max(-5, d * 0.25) : 7 * sst(0, 34, d) + 1.6 * (vnz(x * 0.02 + 11, z * 0.02 + 5) - 0.5) * sst(10, 60, d) + farRise(x, z, d); }
const landY = (x, z) => Math.max(bankY(x, z), (x > 80 || x < -170 || z > 215 || z < -215) ? 0 : bustHeight(x, z));   // (the shoulders' hill is exactly nought outside that box)

const WATER_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE FAR FADE (ruling 9, part 5), one law for the land, its double and the water: by the place's distance from the head's
// foot (and from the two fixed places the land already measured from) between 500 and 2,300 m, never past 0.72, so that the far
// plain and the hills keep a tone of their own under the sky's; and whole (1.0) over the last 400 m before the land's
// edge (2,700 m by x or z) and by 3,000 m from the axis, so that no edge and nothing at the lens's far plane is ever seen.
const FAR_FADE = { value: new THREE.Vector2(500, 2300) };
const FADE_GLSL = /* glsl */`
float farFade(vec2 p, float dist, vec2 fd) {
  float tf = clamp((dist - fd.x) / max(fd.y - fd.x, 1.0), 0.0, 1.0);
  float edge = max(smoothstep(2300.0, 2700.0, max(abs(p.x), abs(p.y))), smoothstep(2600.0, 3000.0, length(p)));
  return mix(0.72 * smoothstep(0.0, 1.0, 1.0 - (1.0 - tf) * (1.0 - tf)), 1.0, edge);
}
`;
// The river: one sheet of deep green glass over the turned-over doubles (its mirror). THE WATER IS A MIRROR (ruling 3, part 2): no
// streamline, no hatch, no sheen; near a bank the doubles show whole through it, and further out a few broad soft ripple bands,
// lying along the flow and drifting with it by place and the world's clock, break them. Lost by place into the ground like the land.
const WATER_FRAG = /* glsl */`
uniform sampler2D uTex; uniform vec3 uOrigin, uWater, uWater2, uPool; uniform vec2 uFade, uIslet; uniform float uTime, uIsletR, uGlint;
varying vec3 vW;
${GROUND_GLSL}
${FADE_GLSL}
void main() {
  vec3 Vv = cameraPosition - vW; vec3 V = Vv / max(length(Vv), 1e-4);
  vec2 p = vW.xz;
  // how far out from the nearest bank, by the map's own outline (the reach, the channel, the bend, the cove, the islet)
  float dR = min(min(p.x + 84.0, 540.0 - p.x), min(p.y + 624.0, -244.0 - p.y)), dW = min(min(p.y + 670.0, -636.0 - p.y), -40.0 - p.x), dE = min(min(p.x - 500.0, 705.0 - p.x), p.y + 624.0);
  float off = min(max(max(dR, dW), max(dE, 40.0 - length(p - vec2(10.0, -660.0)))), length(p - uIslet) - uIsletR);
  // the flow: east along the reach, turning south beyond x 420
  float k = smoothstep(420.0, 620.0, p.x);
  vec2 fl = normalize(vec2(1.0 - k, k * 1.2 + 0.001));
  float along = dot(p, fl), across = dot(p, vec2(-fl.y, fl.x));
  float px = max(fwidth(across), 1e-4);
  float t1 = texture2D(uTex, vec2(along / 1300.0 - uTime * 0.006, across / 190.0)).r;
    // (c12, amendment 1 of ruling 11) the ripple bands and, below, the pool's glints go over to their own means (0.2229, 0.0711) where the footprint outgrows them, not to none
  float band = mix(0.2229, smoothstep(0.56, 0.7, t1), 1.0 - smoothstep(6.0, 16.0, px)) * smoothstep(22.0, 70.0, off);   // a band is 20 to 30 m across and a few hundred long; far off, where it would be a line, its own mean 0.2229
  // THE WATER HAS A BODY OF ITS OWN (ruling 5, part 4): deep bottle green going to olive umber in slow fields, a step lighter
  // and greener than the ground. The sheet is written so that over the ground seen through it (the dome's own colour in the
  // look's direction) the river stands at exactly that body; a double under the sheet adds its light on top of it
  // THE WATER CARRIES THE SKY (ruling 9, part 1a): the body is joined to THE SKY'S OWN DOUBLE, the painted sky read where the
  // look's ray, turned over at the level, meets it (the ray's world direction and nothing else); a tenth of it looking
  // straight down, three quarters at 8 degrees of grazing and flatter; the body's own deep shows only under a steep look (2.3 times lighter under 27 degrees, itself from 49: set after c9, whose sky over 10 degrees is 0.16 and would leave the near water, seen from 100 m up, at 0.20). ONE CAP lies over the whole sheet, near and far
  // (WATER_CAP, 0.40 of white as shown), so there is no bright spot toward the sun. Where the ground seen through the sheet
  // would be lighter than that body the sheet thickens just enough to stand at it.
  const vec3 LUM = vec3(0.2126, 0.7152, 0.0722); const float WATER_CAP = 0.127;
  vec3 dome = hpGround(-V), ray = -V;
  vec3 sky = hpGround(vec3(ray.x, max(-ray.y, 0.0), ray.z));
  float steep = clamp((-ray.y - 0.139) / 0.861, 0.0, 1.0), share = mix(0.75, 0.1, steep * sqrt(steep));
  vec3 body = mix(mix(2.3, 1.0, smoothstep(0.45, 0.75, -ray.y)) * mix(uWater, uWater2, smoothstep(0.25, 0.75, texture2D(uTex, p / 460.0 + vec2(0.37, 0.11)).r) * 0.8 + 0.2 * band), sky, share);
  body *= min(1.0, WATER_CAP / max(dot(body, LUM), 1e-3));
  vec3 thru = body / max(dome, vec3(1e-4));
  float a = clamp(max(0.3 + 0.42 * band, 1.0 - min(thru.x, min(thru.y, thru.z))), 0.3, 1.0);
  vec3 col = max(body - (1.0 - a) * dome, vec3(0.0)) / a;
  float f = farFade(p, length(p - uOrigin.xz), uFade);                    // the land's own law and figures (ruling 9, part 5)
  col = mix(col, dome * min(1.0, WATER_CAP / max(dot(dome, LUM), 1e-3)), f);
  // in the shaft's pool on the water (uPool: its middle and half width; uGlint 0 with no light in the air) small warm glints
  // come and go where two fields of points, drifting by the world's clock, pass over one another; their own mean 0.0711 where one would be under a pixel
  vec2 pq = (p - uPool.xy) / max(uPool.z, 1.0);
  float gpx = max(fwidth(p.x), fwidth(p.y));
  float ga = texture2D(uTex, p / 72.0 + vec2(uTime * 0.012, uTime * 0.004)).g, gb = texture2D(uTex, p / 97.0 + vec2(0.37 - uTime * 0.006, 0.11 + uTime * 0.009)).g;
  float glint = mix(0.0711, (1.0 - smoothstep(0.12, 0.34, ga)) * (1.0 - smoothstep(0.2, 0.52, gb)), 1.0 - smoothstep(0.5, 1.4, gpx / 4.5)) * (1.0 - smoothstep(0.3, 1.0, dot(pq, pq))) * uGlint * (1.0 - f);
  col += vec3(0.93, 0.74, 0.4) * glint;
  gl_FragColor = vec4(col, max(mix(a, 1.0, f), glint));   // the mirror shows through the sheet; a ripple band hides most of it
}`;

// ---------------------------------------------------------------- LIGHT IN THE AIR (ruling 4, part 2; all of it behind LIGHT_IN_AIR)
// THE SHAFTS: five broad columns of the one sun's light where it crosses dusty air, parallel (each a slanted elliptic
// cylinder along the sun's own direction), each a PLACE of the world, the same on every seed: p is a point of its axis at
// the level g where it meets land, water or a body; ra, rb its half widths across; full, end the heights over g to which its
// dust stands whole and by which it is lost in the dark. No disc, no fan, no end in the air.
const SHAFTS = [
  { p: [-300, 7, -340], ra: 30, rb: 28, full: 45, end: 165, k: 1 },       // the garden: across the rows south of the stooks, 67 m and more beside the line
  { p: [36, 0.3, -490], ra: 40, rb: 34, full: 40, end: 200, k: 1 },       // the water before the pumpkin's islet and the islet's near side, seen from the nave's mouth against the light: inside the right arc, which rounds it
  { p: [59, 7, -726], ra: 24, rb: 23, full: 60, end: 150, k: 1 },         // AT THE WALL'S LIT STEP (ruling 7, parts 2 and 5): onto the north bank's beds at the foot of the espaliers, between the step and the rick's west end; it leans north-east over the rick's bay, away from the line, which passes its south-west side and crosses the wall west of the step
  { p: [291, 7, 48], ra: 27, rb: 26, full: 250, end: 420, k: 1 },         // between the sunflowers (its axis passes (455, 200, -90), between the first two stalks) onto the forecourt, east of the line's last turn
  { p: [-479.2, 7, 109.3], ra: 30, rb: 28, full: 330, end: 470, k: 1 },   // BESIDE THE HEAD ON ITS NORTH SIDE (ruling 5, part 1): its axis passes (-230, 300, -100), past the nape's north-west, 250 m and more from the line; from the reveal, the far view from the north and the front it stands beside the head's back against the dark and crosses no piece of the face
];
// A shaft lifts the ground behind it TOWARD SHAFT_TOP and never over it: what it adds along a ray is the share g of the
// difference between that value and the ground's own colour in the ray's direction. A mote at its brightest, in the
// column's densest air, stands a little under MOTE_TOP.
const SHAFT_TOP = '#4A3A22', MOTE_TOP = '#B08A3C';
const SHAFT_VERT = !SHAFTS_DRAWN ? '' : /* glsl */`
attribute vec3 aP; attribute vec4 aR; attribute float aK;
varying vec3 vW, vP; varying vec4 vR; varying float vK;
void main() { vW = position; vP = aP; vR = aR; vK = aK; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
// The light a ray gathers on its way through the column: the length of its way inside (from the eye or the near wall to the
// far wall, the pool's level, or this fragment), thinner toward the rim and with height. Added to what stands behind.
const SHAFT_FRAG = !SHAFTS_DRAWN ? '' : /* glsl */`
uniform vec3 uSun, uCol;
varying vec3 vW, vP; varying vec4 vR; varying float vK;
${GROUND_GLSL}
float dustAt(float h) { return (1.0 - smoothstep(vR.z, vR.w, h)) * smoothstep(-2.0, 6.0, h); }
void main() {
  vec3 dv = vW - cameraPosition; float far = length(dv); vec3 d = dv / max(far, 1e-4);
  vec3 e1 = vec3(-uSun.z, 0.0, uSun.x); e1 /= max(length(e1), 1e-4); vec3 e2 = cross(uSun, e1);
  vec3 o = cameraPosition - vP;
  vec2 o2 = vec2(dot(o, e1) / vR.x, dot(o, e2) / vR.y), d2 = vec2(dot(d, e1) / vR.x, dot(d, e2) / vR.y);
  float a = max(dot(d2, d2), 1e-8), b = dot(o2, d2), c = dot(o2, o2) - 1.0, disc = max(b * b - a * c, 0.0), sq = sqrt(disc);
  float t0 = max((-b - sq) / a, 0.0), t1 = min((-b + sq) / a, far);
  if (d.y < -1e-4) t1 = min(t1, (vP.y - cameraPosition.y) / d.y);
  float len = max(t1 - t0, 0.0);
  float m2 = clamp(dot(o2, o2) - b * b / a, 0.0, 1.0), rim = 1.0 - smoothstep(0.0, 1.0, m2);
  float h0 = cameraPosition.y + d.y * t0 - vP.y, h1 = cameraPosition.y + d.y * t1 - vP.y;
  float dust = 0.25 * (dustAt(h0) + 2.0 * dustAt(0.5 * (h0 + h1)) + dustAt(h1));
  float g = 1.0 - exp(-len * rim * rim * dust * vK * 0.034);          // across its middle (50 to 70 m of dusty air) nine tenths of the way to its bound
  gl_FragColor = vec4(max(uCol - hpGround(d), vec3(0.0)) * g, 1.0);
}`;
// THE MOTES: pollen and seed fluff, each on a closed course by the world's clock about its own place in a column, seen only
// inside it (its light is the column's own measure at the mote's place; outside it is lost and drawn as nothing).
const MOTE_VERT = /* glsl */`
attribute vec3 aP; attribute vec4 aR, aC, aQ; attribute vec2 aUv;
uniform vec3 uSun; uniform float uTime;
varying vec2 vUv; varying float vK;
void main() {
  float w = aQ.y, ph = aQ.x, A = aQ.z;
  vec3 c = aC.xyz + vec3(A * sin(uTime * w + ph), 0.45 * A * sin(uTime * w * 2.0 + ph * 1.7) - 0.3 * A * cos(uTime * w + ph), A * 0.8 * sin(uTime * w * 1.0 + ph * 2.3 + 1.1));
  vec3 e1 = vec3(-uSun.z, 0.0, uSun.x); e1 /= max(length(e1), 1e-4); vec3 e2 = cross(uSun, e1);
  vec3 q = c - aP; float h = q.y;
  vec2 q2 = vec2(dot(q, e1) / aR.x, dot(q, e2) / aR.y);
  vK = (1.0 - smoothstep(0.3, 1.0, dot(q2, q2))) * (1.0 - smoothstep(aR.z, aR.w, h)) * smoothstep(0.0, 8.0, h) * aC.w;
  float tw = uTime * (0.3 + 0.2 * aQ.w) + ph, cs = cos(tw), sn = sin(tw);
  vec3 p = position * step(0.02, vK); p = vec3(p.x * cs - p.z * sn, p.y, p.x * sn + p.z * cs);   // it turns slowly as it drifts
  vUv = aUv; gl_Position = projectionMatrix * viewMatrix * vec4(c + p, 1.0);
}`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uCol; varying vec2 vUv; varying float vK;
void main() { float r = clamp(dot(vUv, vUv), 0.0, 1.0); gl_FragColor = vec4(uCol * vK * (1.0 - r) * (1.0 - r), 1.0); }`;
// THE LAND AS A KITCHEN GARDEN THAT READS FROM HIGH (ruling 7, part 2): the world's own paint for its land, called from the
// part's EARTH source in place of its painted beds. Plots 64 to 136 m across in rows of unlike depth, parted by pale straw
// paths 6.4 m wide; each plot one crop that its colour and form name from 300 m: red cabbage (violet rounds 11 m apart),
// lettuce (lime rounds), carrot (feathered tops over orange shoulders), marigold (orange heads on green), leek (blue-green
// lines), squash (orange fruit on dark vines); one plot in seven lies fallow. Each plant has a lit side and a shade side
// under the one sun and throws a short shade on the soil; a wave of wind runs over the leaves. By the pixel's footprint (the filter's own level) plants give way
// to their plot's mean and plots to the land's. POOLS (the owner, 18:18): where a column of light meets the land the land
// stands at its full colour inside an ellipse drawn out along the sun's bearing, soft over a fifth of its width; outside
// the pools it is quieter and deeper, and sinks by place toward the ground's value at the far belt. (c15: reader187 in the comments below is the paper design/asb/harvest/c14/means187-table.txt.)
const LAND_GLSL = FADE_GLSL + /* glsl */`
uniform vec4 uPool[5]; uniform vec3 uCropA[6], uCropB[6], uStraw, uLandMean, uFadeB, uLandOwn[2]; uniform float uEd, uPoolOn; uniform vec3 uFadeC;
float lh(vec2 p) { return fract(sin(dot(p, vec2(11.6371, 67.519))) * 38617.4219); }   // the world's own constants (c13)
float poolAt(vec2 p) { float m = 0.0;
  for (int i = 0; i < 5; i++) { vec2 d = p - uPool[i].xy; float e = length(vec2(dot(d, vec2(0.766, -0.643)) / uPool[i].z, dot(d, vec2(0.643, 0.766)) / uPool[i].w)); m = max(m, 1.0 - smoothstep(0.6, 1.0, e)); }
  return m; }
float landFar(vec2 p) { return min(min(length(p - uOrigin.xz), length(p - uFadeB.xy) + uFadeB.z), length(p - uFadeC.xy) + uFadeC.z); }   // how far a place lies from the garden's three middles: the far fade's own measure
float cutAt(float j, float s) { return j * 100.0 + (lh(vec2(j, s)) - 0.5) * 36.0; }   // where one plot ends and the next begins: no two of one width
vec3 landPlots(vec3 soil, vec2 q, float fp, vec2 fq, float amt, vec4 ta, vec4 tb, vec4 tq) {
  const vec2 SUNQ = vec2(-0.345, 0.939);                                // the sun's bearing in the beds' own coordinates
  float jr = floor(q.y / 100.0); if (q.y < cutAt(jr, 3.7)) jr -= 1.0;
  float cl = cutAt(jr, 3.7), cr = cutAt(jr + 1.0, 3.7);
  float xs = q.x + lh(vec2(jr, 9.1)) * 300.0, ic = floor(xs / 100.0); if (xs < cutAt(ic, jr + 20.0)) ic -= 1.0;
  float bl = cutAt(ic, jr + 20.0), br = cutAt(ic + 1.0, jr + 20.0);
  float eL = xs - bl, eR = br - xs, eB = q.y - cl, eT = cr - q.y, eRow = min(eB, eT), eCol = min(eL, eR), aa = max(fp, 0.4), ae = max(fp, 1.4);   // (c12, W6) a path's and a bed's edge are soft over about three metres
  // (c13, W4) THE PLAIN IS TILLED LAND, NOT A BOARD OF TILES. WHAT LIES ALONG A PLOT'S BOUND IS ITS OWN (by the bound's own number, the same from both its sides; a long bound changes every 230 m):
  // four in ten a straw path as before, three in ten a HEDGE (a dark green band 6 m broad, bushy, lit on its sunward side, its shade on the soil behind), three in ten no more than a soil seam
  // where two crops meet. A bed's edge is soft about ITS OWN PLACE (c12 drew it back as the footprint grew: a far plot shrank inside a dark frame). Each band's edge softens with the footprint,
  // its breadth kept ONLY to a footprint of about 3 m (paths, hedge) or 1.4 m (frame, shade); past it the band GROWS (c15: L424). Paths cross hedges (a gate); the far fade by place is as before (the hedges stand as far as the plots do).
  float jb = eB < eT ? jr : jr + 1.0, ib = eL < eR ? ic : ic + 1.0, sR = eB < eT ? eB : -eT, sC = eL < eR ? -eL : eR;   // sR, sC: metres from the nearest bound of each way, positive on its sunward side
  float kR = lh(vec2(floor(q.x / 230.0 + 3.0 * lh(vec2(jb, 5.5))), jb + 61.0)), kC = lh(vec2(ib + 31.0, jr + 83.0));   // (c15, reader187) paths, frame, hedge, shade: shares of the land beside L418, L419, L422; they GROW with the footprint
  float pR = kR < 0.42 ? 1.0 : 0.0, hR = kR >= 0.42 && kR < 0.72 ? 1.0 : 0.0, pC = kC < 0.42 ? 1.0 : 0.0, hC = kC >= 0.42 && kC < 0.72 ? 1.0 : 0.0, boR = kR < 0.72 ? 5.4 : 2.2, boC = kC < 0.72 ? 5.4 : 2.2;
  float pathm = max(pR * (1.0 - smoothstep(3.2 - ae, 3.2 + ae, eRow)), pC * (1.0 - smoothstep(3.2 - ae, 3.2 + ae, eCol))), bedm = smoothstep(boR - ae, boR + ae, eRow) * smoothstep(boC - ae, boC + ae, eCol);   // paths 0.0791, frame 0.2203
  float bk = 1.0 - smoothstep(1.5, 4.0, fp), bR = 0.5 + 0.5 * sin(q.x * 0.9 + 5.0 * tb.r), bC = 0.5 + 0.5 * sin(q.y * 0.9 + 5.0 * tb.g), ah = max(fp, 0.7);   // bushy edge: own mean 1 (a sine about its middle); the hedge of L420: 0.0336
  float hgR = hR * (1.0 - smoothstep(3.0 * (1.0 + 0.4 * (bR - 0.5) * bk) - ah, 3.0 * (1.0 + 0.4 * (bR - 0.5) * bk) + ah, abs(sR))), hgC = hC * (1.0 - smoothstep(3.0 * (1.0 + 0.4 * (bC - 0.5) * bk) - ah, 3.0 * (1.0 + 0.4 * (bC - 0.5) * bk) + ah, abs(sC)));
  float hlit = hgR > hgC ? mix(0.55, 1.12, smoothstep(-2.2 - ae, 2.2 + ae, sR)) * (1.0 + 0.4 * (bR - 0.5) * bk) : mix(0.75, 1.02, smoothstep(-2.2 - ae, 2.2 + ae, sC)) * (1.0 + 0.4 * (bC - 0.5) * bk);   // own mean 0.835 row, 0.885 column
  float hshd = max(hR * (1.0 - smoothstep(3.0, 8.0 + ae, -sR)) * smoothstep(-ae, ae, -sR), hC * (1.0 - smoothstep(3.0, 5.0 + ae, -sC)) * smoothstep(-ae, ae, -sC));   // shade's own mean 0.0318 of the land while the footprint is under 1.4 m
  float dl = landFar(vW.xz), fpa = smoothstep(800.0, 1500.0, dl), fa = smoothstep(1200.0, 1900.0, dl), fu = smoothstep(450.0, 1200.0, dl);   // BY PLACE (c11): the paths go first, then the plots into their parcel's tone, and the quilt turns toward umber
  pathm *= 1.0 - fpa; bedm = mix(bedm, 1.0, fpa); hshd *= 1.0 - fpa;   // CODE MATTER, not mended in c15: own share of the land, then at fp 32 m: paths 0.0791, 0.1295; frame 0.2203, 0.3316; hedge 0.0336, 0.0788; shade 0.0318, 0.1195
  float hgm = max(hgR, hgC) * (1.0 - pathm);   // (where fpa is 0; reader187) so mid-fade the land's straw reaches 0.0858 (fp 20 m) against its own 0.0737 and its crops 0.1285 (fp 15 m) against 0.1431; ownm brings both home at fp 32 m
  float k = floor(lh(vec2(ic * 7.0 + 3.0 + uEd, jr * 13.0 + 1.0)) * 7.0);
  // (c13, K5) A PLOT'S PLANTS GO TO THEIR OWN MEAN (own): what the drawn pattern itself comes to over a cell, reckoned by integrating these very lines over the cell, the plants' own sizes and
  // places (design/asb/harvest/c13/painter-k5-land.mjs), as shares of the soil beneath (with its shade), of the crop's colour cA and of its second colour cB (plant's cover times its light):
  // red cabbage 0.4847, 0.2824, 0; lettuce 0.5382, 0.2638, 0; carrot 0.5102, 0.2178, 0.0665; marigold 0.6405, 0.1476, 0.0456; squash 0.9083, 0.0460, 0; leek 0.4615 of the soil and 0.2802 of its lit line.
  // (c13, F2) THESE ARE COUNTED (shots/harvest-in-profile/tmp/c13/land.mjs: these very lines in float32 at four million places of a 24 km square, the pattern's own bytes read as the picture
  // reads them). K5's first figures (0.469, 0.306; 0.521, 0.288; 0.494, 0.238, 0.072; 0.625, 0.162, 0.050; 0.908, 0.044; 0.464, 0.2805) left the leaves' dark seams out of the leafy kinds'
  // means (the seam's own mean over the pattern is 0.2584, so a leaf's pigment is 0.912 of itself): those plots still grew 7 to 8 parts in 100 lighter as they shrank. The leek's stood.
  // (c12's were set by hand: cover 0.62 R R / 0.8 times a light of 0.8, a fifth to a quarter paler than the plants drawn, so a plot grew paler as it shrank.)
  // (c13, W4) THE ROWS READ FROM HIGH. Half the plots are tilled across the others (tn: the plot's own coordinates pq are turned a quarter, and the sun's bearing with them). Where the plants
  // go over to their plot's mean (fine) the mean still wears its ROWS as long as the picture can carry them: the plants' share of it runs along the rows' crests and the soil's along the
  // gaps (rw: 0.26 to 1.74 across a row, the first wave of discs of half a spacing in rows 1.22 spacings apart being 0.74 of their mean; its mean 1 exactly, so the plot's mean is K5's to the figure), filtered by the footprint ACROSS the rows alone (fn), so that rows seen along their
  // length stand to a kilometre and more and rows seen across go first. Fallow land is ploughed: furrows 7.5 m apart by the same law. No lens, no distance: the footprint only filters.
  float tn = step(0.5, lh(vec2(ic * 3.0 + 1.0 + uEd, jr * 5.0 + 2.0))), fn = tn > 0.5 ? fq.x : fq.y;
  vec2 pq = tn > 0.5 ? vec2(q.y - cl, br - xs) : vec2(xs - bl, q.y - cl), sq = tn > 0.5 ? vec2(SUNQ.y, -SUNQ.x) : SUNQ;
  vec3 dark = soil * 0.5, col = dark, own = dark;
  if (k < 5.5) {
    int ki = int(k); vec3 cA = uCropA[ki] * (0.86 + 0.28 * tb.r), cB = uCropB[ki];
    float S = k < 0.5 ? 11.0 : k < 1.5 ? 8.6 : k < 3.5 ? 7.6 : k < 4.5 ? 9.0 : 12.0;
    vec2 cell = vec2(S, S * 1.22), g = pq / cell, id = floor(g), d = (fract(g) - 0.5 - (vec2(lh(id + ic), lh(id.yx + jr)) - 0.5) * 0.24) * cell;
    float fine = smoothstep(0.1, 0.26, fp / S), hr = 0.5 * S, e = 0.07 + fp / hr;
    float rw = 1.0 - 0.74 * cos(6.2831853 * g.y) * (1.0 - smoothstep(0.2, 0.5, fn / cell.y));
    float gust = 0.8 + 0.62 * smoothstep(-0.7, 0.9, sin(q.x * 0.026 + q.y * 0.014 - uTime * 1.2 + 5.0 * tb.r));   // THE LAND BREATHES: a wave of wind runs over the beds by place and the world's clock, turning the leaves' pale sides up as it passes
    cA *= gust;
    if (k > 3.5 && k < 4.5) {                                             // leek: blue-green lines along the rows, lit on their sunward side
      float v = (fract(g.y) - 0.5) * cell.y, line = 1.0 - smoothstep(2.2 - aa, 2.2 + aa, abs(v));
      float lam = mix(0.34, 1.0, smoothstep(-1.2, 0.8, v)) * (0.84 + 0.3 * ta.a);
      col = mix(dark * (1.0 - 0.5 * (1.0 - smoothstep(2.0, 4.2, abs(v + 2.2)))), mix(cA, cB, 0.5 * tq.a) * lam, line); own = dark * (0.4615 + 0.5385 * (1.0 - rw)) + mix(cA, cB, 0.5 * tq.a) * (0.2802 * (0.84 + 0.3 * ta.a) * rw);
    } else {
      float R = (k < 0.5 ? 0.9 : k < 1.5 ? 0.84 : k < 2.5 ? 0.86 : k < 3.5 ? 0.72 : 0.44) * (0.8 + 0.2 * lh(id + 3.3 + ic)), r = length(d) / hr;   // no two plants of one size
      float on = k > 4.5 ? step(0.42, lh(id * 1.7 + ic + jr)) : 1.0;       // squash: a fruit in every other cell
      if (k > 1.5 && k < 2.5) r += 0.16 * (ta.g - 0.5);                   // carrot: a feathered outline
      float disc = (1.0 - smoothstep(R - e, R + e, r)) * on;
      vec2 n2 = d / (hr * R); float ndl = dot(n2, sq) * 0.743 + sqrt(max(1.0 - dot(n2, n2), 0.0)) * 0.669, lam = mix(0.2, 1.06, smoothstep(-0.08, 0.42, ndl)) * (1.0 - 0.3 * smoothstep(0.72, 1.0, r / R));
      float sh = (1.0 - smoothstep(R - 0.14, R + 0.1, length(d + sq * 0.3 * S) / hr)) * on;   // its short shade on the soil
      vec3 pc = cA;
      if (k > 1.5 && k < 2.5) pc = mix(cB, cA, smoothstep(0.26, 0.36, r));                          // carrot: the orange shoulder in the tuft
      if (k > 2.5 && k < 3.5) pc = mix(cB, cA, smoothstep(0.2, 0.34, r));                           // marigold: a gold eye in an orange head
      if (k < 0.5) pc *= 0.78 + 0.22 * smoothstep(0.2, 0.55, r);                                    // red cabbage: a deeper heart
      // (c13, F2) THE LEAVES' SEAMS GO TO THEIR OWN MEAN (0.2584 over the pattern; a texel of it is 0.075 m of land). The card read the pattern through its smaller copies as the footprint
      // grew, which wiped the seams out bare (0.66 of their mean at a footprint of 0.2 m, 0.07 at 0.6 m: shots/harvest-in-profile/tmp/c13/seams.mjs), long before the plants go over to
      // their mean: every leafy plot was 9 parts in 100 lighter from 50 m off than close to. The seams now go over to their mean between one texel and 2.7 (0.95 of it at the least).
      if (k < 3.5) pc *= 1.0 - 0.34 * mix(smoothstep(0.5, 0.95, ta.b), 0.2584, smoothstep(0.075, 0.2, fp));   // leaves: dark seams between them while the picture can carry them
      vec3 under = k > 4.5 ? cB * (0.5 + 0.6 * tq.a) * (0.7 + 0.5 * ta.a) : k > 2.5 ? mix(dark, uCropB[5], 0.6) : dark;   // squash: dark vines cover the plot; marigold: green between the heads
      col = mix(under * (1.0 - 0.7 * sh), pc * lam, disc);
      vec3 ow = k < 0.5 ? vec3(0.4847, 0.2824, 0.0) : k < 1.5 ? vec3(0.5382, 0.2638, 0.0) : k < 2.5 ? vec3(0.5102, 0.2178, 0.0665) : k < 3.5 ? vec3(0.6405, 0.1476, 0.0456) : vec3(0.9083, 0.0460, 0.0);
      own = under * (ow.x + (1.0 - ow.x) * (1.0 - rw)) + (cA * ow.y + cB * ow.z) * rw;
    }
    col = mix(col, own, fine);
  } else col = soil * (0.8 + 0.25 * tq.r) * (1.0 + 0.2 * cos(6.2831853 * pq.y / 7.5) * (1.0 - smoothstep(0.2, 0.5, fn / 7.5)));   // fallow: the furrowed soil itself, ploughed; the furrows' own mean is 1 (reader187: 1.0)
  col = mix(soil * 0.6, col, bedm);
  col *= 1.0 - 0.42 * hshd;
  col = mix(col, uStraw * (0.74 + 0.36 * tq.a), pathm);
  col = mix(col, uCropB[5] * hlit * (0.8 + 0.4 * tq.a), hgm);
  // FAR OFF THE LAND IS STILL PARCELLED (ruling 9, part 5): where the 100 m plots are too small for the picture they blur
  // to the tone of their 400 m parcel (the land's mean times 0.8 to 1.2 by the parcel's place), and the parcels blur to the
  // mean by the same law four times further out; a parcel's edge is as soft as the picture's own grain there
  vec2 pg = q / 400.0 - 0.5, pi = floor(pg), pw = smoothstep(0.5 - clamp(max(fp, 70.0 * fa) / 400.0, 0.004, 0.5), 0.5 + clamp(max(fp, 70.0 * fa) / 400.0, 0.004, 0.5), pg - pi);
  float parcel = mix(mix(lh(pi + 7.3), lh(pi + vec2(1.0, 0.0) + 7.3), pw.x), mix(lh(pi + vec2(0.0, 1.0) + 7.3), lh(pi + 8.3), pw.x), pw.y);
  vec3 mean = uLandMean * mix(vec3(1.0), vec3(0.94, 0.80, 0.62), fu);
  col *= mix(vec3(1.0), vec3(0.92, 0.84, 0.72), fu);
  // (c13, F2) THE LAND FILTERED BY THE FOOTPRINT GOES TO ITS OWN MEAN (ownm), not to the far land's tone. uLandMean (0.0622, 0.0636, 0.0216, set by hand) is the tone the far land is given BY
  // PLACE (fa: all of it beyond 1,900 m, a decision of the picture: far land is never pale); c12 sent the too-small plots to that tone as well, wherever they lay, though what the plots
  // themselves come to is 2.5, 1.7 and 2 times it (0.156, 0.111, 0.043 with the paths drawn; 0.129, 0.096, 0.033 where the paths are gone by place; land.mjs as above, every kind a
  // seventh): near land seen flat went dark with the picture's size. ownm is that count: 0.2904 of the soil (0.2821 without paths) and uLandOwn, the pigments by their counted shares (set
  // where the pigments are). The parcels' tone (0.8 to 1.2 by place; the nearest 256 parcels' mean 0.507, the hash's own 0.5) rides on both. Where no footprint is too large the bytes are c12's.
  float pt = 1.0 + (0.4 - 0.2 * fu) * (parcel - 0.5);
  vec3 ownm = (soil * mix(0.2904, 0.2821, fpa) + mix(uLandOwn[0], uLandOwn[1], fpa)) * mix(vec3(1.0), vec3(0.92, 0.84, 0.72), fu);
  col = mix(col, ownm * pt, smoothstep(0.1, 0.32, fp / 100.0));        // by the FOOTPRINT: the plots' own mean, parcelled
  col = mix(col, mean * pt, fa);                                       // BY PLACE: the far land's tone
  col = mix(col, mix(ownm, mean, fa), smoothstep(0.1, 0.32, fp / 400.0));
  col = mix(col, mean, 0.7 * smoothstep(1500.0, 2100.0, dl));
  return mix(soil, col, amt);
}
`;
// THE LAND'S OWN GLAZE: the hero's EARTH source with the world's own lines, each swapped string found exactly once or the
// build stops. The cast shade is read from a map drawn once at build (a 1 by 1 blank with LIGHT_IN_AIR false); the painted
// beds give way to the world's plots (LAND_GLSL); the land takes its pools, is quieter and deeper outside them, and is lost
// by place on a curve that is steep near and flat far, measured from the head's foot or the garden's middle, whichever is
// nearer. FAR LAND IS NEVER PALE (ruling 9, part 5; c11): from 500 to 900 m of the garden's three middles (landFar: the
// head's foot and the two middles of the garden, whichever is nearest), by place, the land's lit tone is bent over a knee (linear 0.12 to at most 0.165, 0.38 to 0.44 as shown) before it is lost: the straw paths between
// far plots stay as lines and never outshine the produce.
function landFrag() {
  const swap = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('harvest-in-profile: the land glaze expected one "' + a + '"'); return s.replace(a, b); };
  let s = 'uniform sampler2D uShade; uniform vec3 uShadeBox;\n' + GLAZE_FRAG;
  s = swap(s, 'void main() {', LAND_GLSL + 'void main() {');
  s = swap(s, 'float lit = smoothstep(-0.1, 0.48, ndl) * vSh.x;', 'float lit = smoothstep(-0.1, 0.48, ndl) * vSh.x * (1.0 - 0.86 * texture2D(uShade, (vW.xz - uShadeBox.xy) * uShadeBox.z).r);');
  s = swap(s, 'skin = mix(skin * (1.0 - 0.55 * thru), pcol, cover); gloss = mix(gloss, 0.1 * uGloss, cover);', 'skin = landPlots(skin, bv, fmax, vec2(fwa, fwb), thru, ta, tb, tq);');
  s = swap(s, 'float f = smoothstep(uFade.x, uFade.y, length(vW.xz - uOrigin.xz));', 'float pool = poolAt(vW.xz) * uPoolOn; col *= mix(mix(vec3(1.0), vec3(0.68, 0.74, 0.6), uPoolOn), vec3(1.0 + 0.14 * uPoolOn), pool); float lu10 = dot(col, vec3(0.2126, 0.7152, 0.0722)); col *= mix(1.0, (min(lu10, 0.12) + 0.045 * (1.0 - exp(-max(lu10 - 0.12, 0.0) / 0.045))) / max(lu10, 0.05), smoothstep(500.0, 900.0, landFar(vW.xz)) * step(0.12, lu10)); float f = farFade(vW.xz, min(min(length(vW.xz - uOrigin.xz), length(vW.xz - uFadeB.xy) + uFadeB.z), length(vW.xz - uFadeC.xy) + uFadeC.z), uFade) * (1.0 - 0.8 * pool);');
  return s;
}

// ---------------------------------------------------------------- the garden's cast (the hero's generators and glaze; palette pigments only)
// Every function writes one specimen into a region store G (skin) / G.L (leaf) and leaves its ellipsoid for the shade bake.
// det is chosen at build by the piece's distance from the flown line and never switched.
const RYm = (a) => new THREE.Matrix4().makeRotationY(a), RXm = (a) => new THREE.Matrix4().makeRotationX(a), RZm = (a) => new THREE.Matrix4().makeRotationZ(a), TRm = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const T4 = (...m) => m.reduce((a, b) => a.clone().multiply(b));
const heart = (t) => Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, t * 0.97 + 0.015), 0.55)), 0.9) * 0.98 + 0.02;   // a broad leaf, widest early
const lance = (t) => Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.015)), 0.8) * 0.96 + 0.04;
const pole = (G, P, a, b, R, key, nu = 7) => {          // a pole or a tie from a to b (arrays), never thinner than R
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]), wood = mix3(P.soil, P.copper, 0.35 + 0.3 * hsh(key, 1));
  lathe(G, { pid: 0, L, R, nu, nv: Math.max(2, Math.round(L / 12)), M: frame([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d, [0.3, 0, 1]), bound: false, prof: (t) => (t < 0.001 || t > 0.999 ? 0 : 1) * (1 + 0.06 * Math.sin(t * 9 + key)), sect: (th) => 1 + 0.05 * Math.cos(th * 3 + key),
    mat: [0.25, 0, hsh(key, 2), 0], pat: [0, 0.9, 0, 0], col: (t, th, S) => { const c = mix3(wood, P.glaze, 0.3 * vnz(th * 2 + key, t * L * 0.2)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
};
const band = (G, P, c, axis, R, key, nu = 12) => lathe(G, { pid: 0, L: R * 0.5, R: R * 1.12, nu, nv: nu < 12 ? 1 : 2, M: frame(c, axis, [1, 0, 0.3]), bound: false, prof: () => 1, sect: (th) => 1 + 0.08 * Math.sin(th * 7 + key), mat: [0.2, 0, 0.4, 0], pat: [0, 0.5, 0, 0], c: mix3(P.copper, P.soil, 0.45) });

// A WHEAT STOOK: a tent of six to eight sheaves leaning together, wider than tall at the foot (never a waisted upright).
function stook(G, P, x, y, z, yaw, key, det, n = 7, far = false) {   // far: the specimen as it stands on the far land (the band kept, six-sided; three ears to a sheaf)
  const straw = mix3(P.copper, P.cream, 0.55), strawD = mix3(P.copper, P.soil, 0.45), ear = mix3(P.gold, P.copper, 0.3), H = 23, cs = Math.cos(yaw), sn = Math.sin(yaw);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, lx = ((i >> 1) - (n - 2) / 4) * 8.5 + 2.5 * (hsh(key, i) - 0.5), lz = side * (13 + 2 * hsh(key, i + 9));
    const fx = x + lx * cs - lz * sn, fz = z + lx * sn + lz * cs, tx = x + (lx * 0.6) * cs - side * 1.5 * -sn, tz = z + (lx * 0.6) * sn + side * 1.5 * cs;
    const dir = [tx - fx, H, tz - fz], dl = Math.hypot(dir[0], dir[1], dir[2]), M = frame([(fx + tx) / 2, y + H / 2 - 0.8, (fz + tz) / 2], dir, [cs, 0, sn]), k = key * 7 + i;
    // (c12, W4) A BOUND SHEAF: its lobes are of orders its own columns can carry (c11's 9 and 23 round on 10 to 23 columns were facets); its straw is
    // DRAWN (the glaze's special 2: 26 bundles round, each its own tone, a dark line between); its cast shade eased over its own mesh; and A TIE of
    // twisted straw at the waist, where the stalks are gathered and the ears burst out above.
    // (c13, K1) THE TIE IS DRAWN IN THE STRAW'S OWN SKIN (aPat.x of a straw body: the waist's place along the sheaf in metres, 0: no tie). c12's tie was a flat ring
    // of 6 or 10 sides through which the sheaf's lobes (up to 1.19 of the waist's radius) stood out: its edge was a zigzag. A drawn band lies on the lobes themselves.
    const nuS = Math.round(22 * det + 4), nvS = Math.round(9 * det + 3), lobA = Math.max(2, Math.round(nuS / 5)), lobB = Math.max(3, Math.round(nuS / 3.6));
    const prf = (t) => (t < 0.004 ? 0 : 1) * (t < 0.7 ? 1.15 - 0.76 * Math.pow(t / 0.7, 0.9) : 0.39 + 2.1 * Math.pow(t - 0.7, 1.15)) * (t > 0.996 ? 0.6 : 1);
    lathe(G, { L: dl * 1.06, R: 5, nu: nuS, nv: nvS, M, bk: 0.8, soft: 1, mat: [0.14, 0, hsh(k, 1), 2], pat: [!far && det >= 0.24 ? 0.7 * dl * 1.06 : 0, TAU * 5 / 26, 0, 0], prof: prf,
      sect: (th, t) => 1 + 0.1 * Math.sin(th * lobA + k) + 0.05 * Math.sin(th * lobB + t * 3 + k) + 0.14 * (t < 0.7 ? (1 - t) : (t - 0.7) * 3) * Math.sin(th * lobA + k * 2),
      col: (t, th, S) => { const c = mix3(mix3(straw, strawD, 0.6 * vnz(th * nuS / 12.6 + k, t * 1.5) + 0.25 * sst(0.15, 0, t)), ear, sst(0.74, 0.95, t) * 0.85); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
    const ne = far ? 3 : Math.round(13 * det + 2.5);
    for (let e = 0; e < ne; e++) { const az = e * 2.4 + k, out = 0.25 + 0.75 * hsh(k, e);     // ears as swept leaves, each bowed its own way
      leaf(G, { L: 7 + 4 * hsh(e, k), W: 1.1, nu: 2, nv: Math.round(4 + 2 * det), M: T4(M, TRm(Math.cos(az) * 2.6, dl * 0.5, Math.sin(az) * 2.6), RYm(-az + Math.PI / 2), RXm(out)), width: lance, curl: 0.4 + 1.0 * hsh(e, k + 3), cup: 0.4, c: ear, c1: mix3(ear, P.cream, 0.5), pid: G.bounds.length, mat: [0.3, 0.75, hsh(e, k), 7], pat: [0, 0.7, 0, 0] }); }   // an ear seen against the sun glows in its own gold
    const nb = Math.round(6 * det);
    for (let e = 0; e < nb; e++) { const az = e * 2.9 + k;                                    // loose straws as blades at the foot
      leaf(G, { L: 8 + 7 * hsh(e, k + 5), W: 0.6, nu: 1, nv: 3, M: T4(M, TRm(Math.cos(az) * 4.6, -dl * 0.5 + 2 * hsh(e, 2), Math.sin(az) * 4.6), RYm(-az + Math.PI / 2), RXm(0.5 + 0.5 * hsh(e, k))), width: (t) => 1 - 0.6 * t, curl: 0.3, c: straw, c1: mix3(straw, P.cream, 0.4), pid: G.bounds.length, mat: [0.25, 0.3, 0, 0], pat: [0, 3, 0, 0] }); }
  }
  return { x, z, R: 21, H: 26 };
}

// THE BEAN NAVE: crossed poles 60 tall, 40 wide inside, 110 long; leaves lit through, scarlet flowers, hanging pods.
// A CLEAN ARCH (ruling 3, part 3): the line runs its length along the axis (N.y0 to N.y1 up); every leaf and pod is set by its
// distance from that axis: a leaf that would reach within 13 m of it is turned over to the pole's outer side, a pod that would
// hang within 11 m of it hangs outside its pole or not at all. Leaves stand to the sides and overhead; the middle is open.
async function nave(G, P, Sp, N, y, det, tick) {
  const a = N.a, b = N.b, dx = b[0] - a[0], dz = b[1] - a[1], Ln = Math.hypot(dx, dz), ux = dx / Ln, uz = dz / Ln, nx = -uz, nz = ux, pairs = 11, foot = N.w / 2 + 7.5, top = 57;
  const ridgeA = [a[0] - ux * 4, y + top, a[1] - uz * 4], ridgeB = [b[0] + ux * 4, y + top, b[1] + uz * 4];
  const off = (px, py, pz) => { const sa = (px - a[0]) * ux + (pz - a[1]) * uz, lat = (px - a[0]) * nx + (pz - a[1]) * nz; return Math.hypot(lat, py - (N.y0 + (N.y1 - N.y0) * Math.min(1, Math.max(0, sa / Ln)))); };   // how far a point is from the line's axis through the nave
  pole(G, P, ridgeA, ridgeB, 0.9, 77);
  for (let i = 0; i < pairs; i++) {
    const s = i / (pairs - 1) * Ln, cx = a[0] + ux * s, cz = a[1] + uz * s;
    for (const side of [-1, 1]) {
      const k = i * 2 + (side > 0 ? 1 : 0), f = [cx + nx * side * foot, y - 1, cz + nz * side * foot], over = 1.1, t = [cx - nx * side * foot * (over - 1), y + top * over, cz - nz * side * foot * (over - 1)];
      pole(G, P, f, t, 0.95, k + 3);
      const nodes = Math.round(7 * det + 2);
      for (let j = 0; j < nodes; j++) {             // a bean vine up each pole: leaves in threes, flowers, pods hung inward and outward
        const h = (j + 0.4 + 0.5 * hsh(k, j)) / nodes, p = [f[0] + (t[0] - f[0]) * h / over, f[1] + (t[1] - f[1]) * h / over, f[2] + (t[2] - f[2]) * h / over];
        for (let q = 0; q < 3; q++) { const az = hsh(k * 3 + q, j) * TAU, el = -0.25 + 0.7 * hsh(q, k + j), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)]; let inw = -(d[0] * nx + d[2] * nz) * side; const Ll = (7.5 + 4 * hsh(j, k + q)) * (inw > 0.2 ? 0.62 : 1), reach = Ll * 1.12 + 1.5;
          if (Math.min(off(p[0] + d[0] * reach * 0.5, p[1] + d[1] * reach * 0.5 - 1.5, p[2] + d[2] * reach * 0.5), off(p[0] + d[0] * reach, p[1] + d[1] * reach - 3, p[2] + d[2] * reach)) < 13) { d[0] += 2 * inw * side * nx; d[2] += 2 * inw * side * nz; inw = -inw;   // turned over to the pole's outer side
            if (Math.min(off(p[0] + d[0] * reach * 0.5, p[1] + d[1] * reach * 0.5 - 1.5, p[2] + d[2] * reach * 0.5), off(p[0] + d[0] * reach, p[1] + d[1] * reach - 3, p[2] + d[2] * reach)) < 13) continue; }
          leaf(G, { shape: 'bean', L: Ll * 1.12, W: Ll * 0.5, nu: 6, nv: 2, dome: 0.16, frill: [Ll * 0.06, 1.5], ph: q + j, M: leafFrame([p[0] + d[0] * 0.8, p[1] + d[1] * 0.8, p[2] + d[2] * 0.8], d, [0.3 * d[0], 1, 0.3 * d[2]]), width: heart, curl: -0.5 - 0.5 * hsh(q, j), cup: 0.3, twist: 0.3 * (hsh(k, q) - 0.5),
            c: mix3(P.savoy, P.lettuce, 0.35 + 0.5 * hsh(j, q + k)), c1: mix3(P.lettuce, P.muscat, 0.4), bound: true, cast: 0.6, mat: [0.35, 0.85, hsh(k, j + q), 0], pat: [0, Ll * 0.07, 0, 0] }); }
        if (hsh(k, j + 31) < 0.55) for (let q = 0; q < 3; q++) { const az = hsh(q, k + j) * TAU;   // scarlet flowers
          peaFlower(G, P, T4(TRm(p[0] - nx * side * 1.5, p[1] + 1.2, p[2] - nz * side * 1.5), RYm(az), RXm(0.5 + 0.6 * q)), 2.0, k + j * 3 + q); }
        if (hsh(k, j + 57) < 0.34 && h > 0.2 && h < 0.92) { const Lp = 11 + 5 * hsh(j, k); let io = hsh(j, k + 5) < 0.6 ? -1 : 1;            // a hanging pod
          const podOff = (o) => Math.min(off(p[0] + nx * side * o * 2.2, p[1] - 0.8, p[2] + nz * side * o * 2.2), off(p[0] + nx * side * o * 2.2, p[1] - Lp * 0.5 - 0.8, p[2] + nz * side * o * 2.2), off(p[0] + nx * side * o * 2.2, p[1] - Lp - 0.8, p[2] + nz * side * o * 2.2)) - 1.5;
          if (podOff(io) < 11) io = 1; if (podOff(io) < 11) continue;
          Sp.pod(G, frame([p[0] + nx * side * io * 2.2, p[1] - Lp * 0.5 - 0.8, p[2] + nz * side * io * 2.2], [0.1 * (hsh(k, j) - 0.5), 1, 0.1 * (hsh(j, k) - 0.5)], [ux, 0, uz]), Lp, 1.25, k + j * 1.3, 0.37 * det, hsh(k + j, 9) < 0.3, true); }
      }
    }
    band(G, P, [cx, y + top * 0.985, cz], [ux, 0.2, uz], 1.7, i);
    if (i % 3 === 2) await tick();
  }
  return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, R: foot, H: top, len: Ln, ux, uz };
}

// An open gold flower (courgette, squash, pumpkin): the part's trumpet, five lobes curved back round a throat. R = its half width.
function openFlower(G, P, c, axis, R, key, det = 1) {
  trumpet(G, P, frame(c, axis, [0.4, 0.1, 1]), R, key, det);
}
// A broad leaf on its stalk, standing (courgette) or lying flat (squash); R = its half width
function gourdLeaf(G, P, foot, dir, R, key, det, flat) {
  const d = [dir[0], flat ? 0.12 : 0.55 + 0.4 * hsh(key, 1), dir[2]], st = flat ? R * 0.2 : R * (0.9 + 0.5 * hsh(key, 2)), l = Math.hypot(d[0], d[1], d[2]), tip = [foot[0] + d[0] / l * st, foot[1] + d[1] / l * st, foot[2] + d[2] / l * st];
  if (!flat) pole(G.S || G, { soil: P.savoy, copper: P.lettuce, glaze: P.bottle }, foot, tip, Math.max(0.5, R * 0.05), key, 5);
  leaf(G, { shape: 'squash', L: R * 2, W: R, nu: det > 0.5 ? 8 : 6, nv: det > 0.5 ? 3 : 2, M: leafFrame(tip, [dir[0], flat ? 0.05 : 0.25, dir[2]], [0, 1, 0]), width: heart, curl: flat ? -0.25 : -0.7 - 0.4 * hsh(key, 3), cup: 0.22, frill: [R * 0.16, 2.5], ph: key, twist: 0.2 * (hsh(key, 4) - 0.5), rib: R * 0.03, bound: true, cast: 0.7,
    col: (v, sA, S) => { const c = mix3(mix3(P.bottle, P.savoy, 0.45 + 0.4 * vnz(sA * 2 + key, v * 5)), P.lettuce, 0.3 * sst(0.6, 1, Math.abs(sA)) + 0.12 * hsh(key, 5)); S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [0.3, 0.55, hsh(key, 6), 9], pat: [0, R * 0.12, 0.55, 0.12] });
}
// A fruit lying on the soil: courgette (long, striped) or squash (orange, ribbed)
function gourdFruit(G, P, c, yaw, L, R, key, det, kind) {
  const orange = mix3(P.gold, P.tomato, 0.42), M = T4(TRm(c[0], c[1] + R * (kind === 'squash' ? 0.62 : 0.8), c[2]), RYm(yaw), kind === 'squash' ? RXm(0.15 * (hsh(key, 1) - 0.5)) : RZm(Math.PI / 2 - 0.12));
  lathe(G, { L, R, nu: Math.round(det < 0.5 ? 10 * det + 4 : 12 * det + 6), nv: Math.round(det < 0.5 ? 5 * det + 3 : 7 * det + 3), ease: 1, M, mat: [0.8, 0, hsh(key, 2), 0], pat: [0.2, 0, 0, 0.1],
    prof: kind === 'squash' ? (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), 2.4)), 1 / 2.4) : (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01))), 0.35) * (0.8 + 0.2 * t),
    sect: kind === 'squash' ? (th, t) => 1 - 0.13 * Math.pow(0.5 + 0.5 * Math.cos(th * 8 + key), 3) : (th) => 1 + 0.03 * Math.cos(th * 6),
    col: (t, th, S) => { const c2 = kind === 'squash' ? mix3(mix3(orange, P.gold, 0.5 * vnz(th * 2 + key, t * 4)), P.savoy, 0.5 * sst(0.9, 1, t)) : mix3(mix3(P.savoy, P.bottle, 0.5 + 0.5 * Math.cos(th * 6)), P.lettuce, 0.3 * vnz(th * 9, t * 14 + key)); S.r = c2[0]; S.g = c2[1]; S.b = c2[2]; } });
}
// THE PLANTS OF THE DEAL. Each returns its footprint { x, z, R, H } for the ground's contact shade.
function plant(G, P, Sp, kind, x, y, z, R, key, det, bolted) {
  if (kind === 'savoy' || kind === 'red' || kind === 'lettuce') {
    const tip = [0.35 * (hsh(key, 1) - 0.5), 1, 0.35 * (hsh(key, 2) - 0.5)];
    headOf(G, { R, kind, M: frame([x, y + R * 0.72, z], tip, [hsh(key, 3) - 0.5, 0, hsh(key, 4) - 0.5]), key, leaves: kind === 'lettuce' ? 10 : 9, det, P, vein: 0.85, bold: 1.6, blunt: 0.45, even: 0.5 });   // (c12, W4) a cream midrib painted into each leaf; the glaze's ribs and quilting 1.6 times broader, to be read from the row's own distance
    if (bolted && kind === 'lettuce') spire(G, P, [x, y + R * 1.2, z], 20, key, det);
    return { x, z, R, H: R * 1.7 };
  }
  if (kind === 'kale' || kind === 'chard') {
    const n = kind === 'kale' ? 6 : 5, H = R * (kind === 'kale' ? 2.3 : 2.6);
    for (let k = 0; k < n; k++) { const b = k * TAU / n + key, lean = 0.3 + 0.35 * hsh(key, k), f = leafFrame([x + 0.12 * R * Math.cos(b), y - 0.5, z + 0.12 * R * Math.sin(b)], [Math.cos(b) * lean, 1, Math.sin(b) * lean], [-Math.cos(b), 0.3, -Math.sin(b)]);
      if (kind === 'kale') Sp.kale(G, f, H * (0.8 + 0.3 * hsh(k, key)), R * (0.55 + 0.2 * hsh(key, k + 3)), key * 5 + k, det * 1.05);
      else Sp.chard(G, f, H * (0.8 + 0.3 * hsh(k, key)), R * (0.5 + 0.15 * hsh(key, k + 3)), key * 5 + k, det, { curl: 0.5 + 0.4 * hsh(k, 7), stalk: k % 2 ? P.beet : mix3(P.beet, P.tomato, 0.4) }); }
    if (bolted && kind === 'kale') spire(G, P, [x, y + H * 0.5, z], 20, key, det);
    G.bounds.push({ inv: new THREE.Matrix4().makeTranslation(x, y + H * 0.45, z).scale(new THREE.Vector3(R * 0.7, H * 0.5, R * 0.7)).invert().elements, a: 0, b: 0, cast: 0.6 });
    return { x, z, R: R * 0.9, H };
  }
  if (kind === 'courgette' || kind === 'squash') {
    const flat = kind === 'squash', n = flat ? 4 : 5;
    for (let k = 0; k < n; k++) { const b = k * TAU / n + key * 1.7 + 0.5 * hsh(key, k); gourdLeaf(G, P, [x, y, z], [Math.cos(b), 0, Math.sin(b)], R * (flat ? 1 : 0.62) * (0.8 + 0.3 * hsh(k, key)), key * 3 + k, det, flat); }
    const fa = key * 2.1; gourdFruit(G, P, [x + Math.cos(fa) * R * 0.5, y, z + Math.sin(fa) * R * 0.5], fa + 0.6, flat ? R * 0.75 : R * 1.1, flat ? R * 0.5 : R * 0.17, key, det, kind);
    for (let k = 0; k < (det > 0.6 ? 2 : 1); k++) { const b = fa + 2 + k * 2.3; openFlower(G, P, [x + Math.cos(b) * R * 0.45, y + R * (flat ? 0.3 : 0.5), z + Math.sin(b) * R * 0.45], [Math.cos(b) * 0.5, 0.8, Math.sin(b) * 0.5], R * (flat ? 0.3 : 0.38), key + k, det); }
    return { x, z, R: R * (flat ? 0.9 : 0.8), H: R * (flat ? 0.4 : 1.2) };
  }
  // 'wigwam': three bean poles tied at the top, leaves and pods (the salad garden's beans)
  const H = R * 4.2;
  for (let k = 0; k < 3; k++) { const b = k * TAU / 3 + key, f = [x + Math.cos(b) * R, y - 0.5, z + Math.sin(b) * R], t = [x - Math.cos(b) * R * 0.15, y + H, z - Math.sin(b) * R * 0.15];
    pole(G, P, f, t, 0.7, key + k, 5);
    for (let j = 0; j < 6; j++) { const h = (j + 0.5) / 6.5, az = hsh(key + k, j) * TAU, d = [Math.cos(az), 0.3, Math.sin(az)], Ll = 6 + 3 * hsh(j, key);
      leaf(G, { shape: 'bean', L: Ll, W: Ll * 0.42, nu: 8, nv: 2, M: leafFrame([f[0] + (t[0] - f[0]) * h, f[1] + (t[1] - f[1]) * h, f[2] + (t[2] - f[2]) * h], d, [0, 1, 0]), width: heart, curl: -0.6, cup: 0.2, c: mix3(P.savoy, P.lettuce, 0.3 + 0.5 * hsh(j, k)), c1: P.lettuce, pid: 0, mat: [0.35, 0.8, hsh(j, key), 0], pat: [0, 0.5, 0.3, 0] }); } }
  band(G, P, [x, y + H * 0.93, z], [0, 1, 0], 1.6, key);
  return { x, z, R: R * 0.8, H };
}
// THE BOLTED SPIRE (the rare event): a stalk 20 tall set with small yellow flowers
function spire(G, P, foot, H, key, det) {
  const top = [foot[0] + 2 * (hsh(key, 21) - 0.5), foot[1] + H, foot[2] + 2 * (hsh(key, 22) - 0.5)], yel = mix3(P.lemon, P.gold, 0.3);
  pole(G.S || G, { soil: P.lettuce, copper: P.savoy, glaze: P.bottle }, foot, top, 0.55, key, 5);
  const n = Math.round(7 * det + 5);
  for (let i = 0; i < n; i++) { const h = 0.3 + 0.7 * (i + hsh(key, i)) / n, az = i * 2.4 + key, r = 1.2 + 2.2 * (1 - h);
    leaf(G, { L: 2.9, W: 1.7, nu: 2, nv: 2, M: T4(TRm(foot[0] + (top[0] - foot[0]) * h + Math.cos(az) * r, foot[1] + H * h, foot[2] + (top[2] - foot[2]) * h + Math.sin(az) * r), RYm(-az), RXm(0.3 + 0.8 * hsh(i, key))), width: heart, curl: 0.8, cup: 0.4, c: yel, c1: mix3(P.lemon, P.cream, 0.3), pid: 0, mat: [0.3, 0.8, hsh(i, key), 7], pat: [0, 2, 0, 0] }); }
}

// THE GREAT PUMPKIN: 70 across, 50 high, ribs 9 across, a corked stalk, its vine with leaves 20 across and flowers the size of rooms
function pumpkin(G, P, Sp, c, y, det, gy) {
  const orange = mix3(P.gold, P.tomato, 0.5), D = 70, H = 50, M = T4(TRm(c[0], y + H * 0.47, c[2]), RYm(0.7), RZm(0.07));
  lathe(G, { L: H, R: D / 2, nu: Math.round(96 * det), nv: Math.round(32 * det), ease: 1, M, mat: [0.75, 0, 0.3, 0], pat: [0.3, 0, 0, 0.1], prof: (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), 2.5)), 1 / 2.5),
    sect: (th, t) => { const w = 0.5 + 0.5 * Math.cos(th * 24 + 0.8 * Math.sin(th * 3)); return 1 - (0.05 + 0.07 * sst(0.3, 1, t)) * w * w * w + 0.03 * Math.sin(th * 2 + 1); },
    bend: (t) => [0, 0, -H * 0.1 * sst(0.75, 1, t)],
    col: (t, th, S) => { const w = 0.5 + 0.5 * Math.cos(th * 24 + 0.8 * Math.sin(th * 3)); let k = mix3(mix3(orange, P.gold, 0.35 * vnz(th * 2, t * 3) + 0.3 * (1 - w)), mix3(P.copper, P.soil, 0.4), 0.45 * w * w * w); /* (c12, W5) the furrows deeper and browner, the crowns paler */ k = mix3(k, P.savoy, 0.35 * sst(0.5, 0.75, vnz(th * 1.3 + 4, t * 2.2)) * sst(0.5, 0.1, t)); S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
  Sp.stalk(G, T4(M, TRm(0, H * 0.4, 0)), 22, 5.2, 0.6, mix3(P.savoy, P.copper, 0.6), 1.8);
  // the vine: two ropes of stem off the stalk and round the islet's rim (north-east about to the south-east, north about to the
  // west), leaves on stalks turned outward over the water, flowers the size of rooms open to the sun
  const pts = [[0, 0], [22, -34], [40, -22], [48, 2], [40, 27], [-12, -40], [-34, -30], [-47, -6]], foot = (i) => [c[0] + pts[i][0], Math.max(0.5, gy(c[0] + pts[i][0], c[2] + pts[i][1])) + 0.7, c[2] + pts[i][1]];
  for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7]]) pole(G, { soil: P.savoy, copper: P.lettuce, glaze: P.bottle }, i === 0 ? [c[0], y + H * 0.9, c[2]] : foot(i), foot(j), 1.3, i + j, 6);
  for (let i = 1; i < pts.length; i++) { const f = foot(i), a = i * 2.3, rl = Math.hypot(pts[i][0], pts[i][1]), rx = pts[i][0] / rl, rz = pts[i][1] / rl;
    const sd = (rx * SUN_DIR.x + rz * SUN_DIR.z) / Math.hypot(SUN_DIR.x, SUN_DIR.z), sunward = sd > 0.4 || sd < -0.5;   // on the islet's sunward rim and in the pumpkin's own shade the leaves lie flat: a leaf standing between the sun and the pumpkin threw a dark leaf-shaped shade on its lit side, and one standing in its shade was a dark leaf-shaped hole before it (ruling 4, part 4)
    gourdLeaf(G, P, f, [Math.cos(a) * 0.6 + rx * 0.7, 0, Math.sin(a) * 0.6 + rz * 0.7], 11 + 2 * hsh(i, 1), 40 + i, 1, sunward);
    gourdLeaf(G, P, [f[0] + rz * 6, f[1], f[2] - rx * 6], [rx * 0.5 - Math.cos(a) * 0.7, 0, rz * 0.5 - Math.sin(a) * 0.7], 11 + 2 * hsh(i, 3), 60 + i, 0.8, sunward);
    gourdLeaf(G, P, f, [rx - 0.5 * rz, 0, rz + 0.5 * rx], 10 + 2 * hsh(i, 2), 50 + i, 0.8, true);
    openFlower(G, P, [f[0] + rx * 5 - rz * (4 - 9 * hsh(i, 4)), f[1] + 6 + 5 * hsh(i, 5), f[2] + rz * 5 + rx * (4 - 9 * hsh(i, 4))], [rx * 0.6 + 0.25, 0.6, rz * 0.6 - 0.2], i % 2 ? 9 : 7.5, i * 3.1, 1); }
  return { x: c[0], z: c[2], R: 33, H };
}
// THE RICK: one long low loaf of straw, banded
function rick(G, P, c, y, yaw, det = 1) {
  const straw = mix3(P.copper, P.cream, 0.45), M = T4(TRm(c[0], y + 6, c[1]), RYm(yaw), RZm(Math.PI / 2));
  lathe(G, { L: 120, R: 1, sx: 21, sz: 19, nu: Math.round(28 * det), nv: Math.round(18 * det), ease: 1, M, mat: [0.15, 0, 0.6, 2], pat: [0, 0.8, 0.4, 0], prof: (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), 2.6)), 0.385) * (1 + 0.04 * Math.sin(t * 31)),
    sect: (th, t) => 1 + 0.05 * Math.sin(th * 5 + t * 9), col: (t, th, S) => { const k = mix3(mix3(straw, P.gold, 0.3 * vnz(th * 5, t * 40)), mix3(P.copper, P.soil, 0.5), 0.5 * vnz(th * 3 + 2, t * 9)); S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
  for (const t of [-0.3, 0.02, 0.33]) lathe(G, { pid: 0, L: det < 1 ? 4 : 2.4, R: 1, sx: 21.6, sz: 19.6, nu: Math.round(24 * det), nv: 1, M: T4(M, TRm(0, t * 120, 0)), bound: false, prof: () => 1, c: mix3(P.copper, P.soil, 0.6), mat: [0.2, 0, 0, 0], pat: [0, 0.5, 0, 0] });
  return { x: c[0], z: c[1], R: 40, H: 26 };
}
// THE MUSCAT VINE ON ITS POLES: a pergola, the vine's rope, leaves, and bunches whose grapes are 9 across and lit through
async function vine(G, P, V, y, det, tick, out) {
  const a = V.a, b = V.b, dx = b[0] - a[0], dz = b[1] - a[1], Ln = Math.hypot(dx, dz), ux = dx / Ln, uz = dz / Ln, nx = -uz, nz = ux, H = 180, hw = 12, n = 4;
  const at = (s, side, h) => [a[0] + ux * s + nx * side * hw, y + h, a[1] + uz * s + nz * side * hw];
  for (let i = 0; i < n; i++) { const s = i / (n - 1) * Ln;
    for (const side of [-1, 1]) pole(G, P, at(s, side * 1.08, -2), at(s, side, H), 1.6, i * 2 + side, 8);
    pole(G, P, at(s, -1.25, H - 2), at(s, 1.25, H - 3), 1.2, i + 20, 6); band(G, P, at(s, -1, H - 2), [nx, 0, nz], 2.3, i); band(G, P, at(s, 1, H - 3), [nx, 0, nz], 2.3, i + 5); }
  for (const side of [-1, 1]) pole(G, P, at(-5, side, H - 0.5), at(Ln + 5, side, H - 1.5), 1.3, 30 + side, 6);
  const rope = { soil: mix3(P.soil, P.glaze, 0.4), copper: P.copper, glaze: P.glaze };
  pole(G, rope, at(4, -1.2, 0), at(10, -0.8, H * 0.5), 2.4, 41, 7); pole(G, rope, at(10, -0.8, H * 0.5), at(6, -0.2, H + 2), 2.0, 42, 7); pole(G, rope, at(6, -0.2, H + 2), at(Ln - 2, 0.3, H + 3), 1.6, 43, 6);
  await tick();
  const russet = mix3(P.copper, P.soil, 0.3), nb = 5;
  for (let q = 0; q < nb; q++) {                 // bunches hang from y 170 to 100 between the rows
    const s = (q + 0.5) / nb * Ln + 3 * (hsh(q, 1) - 0.5), side = (q % 2 ? 0.45 : -0.4), top = at(s, side, H - 12), layers = [3, 5, 5, 4, 4, 3, 2, 1], R0 = 4.5;
    pole(G, rope, at(s, side, H + 2), [top[0], top[1] + 3, top[2]], 0.9, 60 + q, 5);
    let yy = top[1], gi = 0;
    for (let l = 0; l < layers.length; l++) { const m = layers[l], rr = m <= 1 ? 0 : R0 * (0.62 + 0.36 * m / 2.4) * 0.8;
      for (let k = 0; k < m; k++) { const az = k * TAU / m + l * 1.1 + q, R = R0 * (0.9 + 0.22 * hsh(q * 9 + l, k)), split = q === nb - 1 && l === 3 && k === 0;
        const c = [top[0] + Math.cos(az) * rr + 0.8 * (hsh(l, k + q) - 0.5), yy - R * 0.4 * hsh(k, l + q), top[2] + Math.sin(az) * rr + 0.8 * (hsh(k, l + 2 * q) - 0.5)], key = q * 40 + gi++;
        const th0 = Math.atan2(-(c[2] - top[2] + 0.01), c[0] - top[0] + 0.01);
        lathe(G.X || G, { L: R * 2.1, R, nu: Math.round(12 * det), nv: Math.round(7 * det), ease: 1, M: frame(c, [0.2 * (hsh(key, 1) - 0.5), 1, 0.2 * (hsh(key, 2) - 0.5)], [1, 0, 0]), bk: 0.9, mat: [0.9, 0.95, hsh(key, 3), 6], pat: [0.3, 0, 0, 0.3],
          prof: (t) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1))),
          sect: split ? (th, t) => 1 - 0.12 * sst(0.5, 0.0, Math.abs(Math.atan2(Math.sin(th - th0), Math.cos(th - th0)))) * sst(0.1, 0.4, t) * sst(0.95, 0.6, t) : null,
          col: (t, th, S) => { let k2 = mix3(mix3(mix3(P.muscat, P.lemon, 0.3), P.lettuce, 0.3 * hsh(key, 4)), P.gold, 0.25 * vnz(th * 2 + key, t * 3)); k2 = mix3(k2, russet, 0.4 * sst(0.66, 0.82, vnz(th * 5 + key, t * 9)) + 0.4 * sst(0.92, 1, t));
            if (split) { const g = sst(0.42, 0.1, Math.abs(Math.atan2(Math.sin(th - th0), Math.cos(th - th0)))) * sst(0.12, 0.35, t) * sst(0.95, 0.7, t); k2 = mix3(k2, mix3(P.cream, P.muscat, 0.35), g); }
            S.r = k2[0]; S.g = k2[1]; S.b = k2[2]; } });
        if (split) out.split = [c[0] + Math.cos(th0) * R, c[1], c[2] - Math.sin(th0) * R];
      }
      yy -= R0 * 1.52; }
    out.bunches.push([top[0], top[1] - 30, top[2]]);
    await tick();
  }
  for (let i = 0; i < 16; i++) {                  // vine leaves along the top and down the rope
    const s = (i + 0.5) / 16 * Ln, side = (i % 2 ? 1 : -1) * (0.7 + 0.5 * hsh(i, 3)), p = at(s, side, H + 2 - 14 * hsh(i, 4)), az = hsh(i, 5) * TAU, Rl = 13 + 5 * hsh(i, 6);
    leaf(G, { shape: 'vine', L: Rl * 2, W: Rl, nu: 12, nv: 3, M: leafFrame(p, [Math.cos(az) * 0.8 + nx * side * 0.5, -0.45 - 0.5 * hsh(i, 7), Math.sin(az) * 0.8 + nz * side * 0.5], [0.2, 1, -0.2]), width: heart, curl: -0.5, cup: 0.15, frill: [Rl * 0.3, 2.5], ph: i, twist: 0.3 * (hsh(i, 8) - 0.5), rib: 0.5, bound: true, cast: 0.5,
      col: (v, sA, S) => { const k2 = mix3(mix3(P.savoy, P.lettuce, 0.3 + 0.5 * vnz(sA * 2 + i, v * 4)), mix3(P.gold, P.tomato, 0.3), 0.35 * sst(0.7, 1, Math.abs(sA)) * hsh(i, 9)); S.r = k2[0]; S.g = k2[1]; S.b = k2[2]; }, mat: [0.35, 0.8, hsh(i, 10), 9], pat: [0, Rl * 0.11, 0.08, 0] });
  }
  return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, R: Ln / 2 + 10, H };
}
// A GIANT SUNFLOWER: stem, leaves, and a head turned to the bearing the map gives it (never edge-on to the line), rays lit through
function sunflower(G, P, x, y, z, H, D, key, det, out, turn, far = false, quilt = 0.5) {   // far: five leaves, fourteen broad rays, no bracts; quilt: the leaves' quilting (c13, K2: 0 on the one stood close by the line)
  const stemG = mix3(P.savoy, P.lettuce, 0.4), tb = turn * Math.PI / 180, fd = new THREE.Vector3(Math.sin(tb), 0.2, -Math.cos(tb)).normalize();
  const hc = [x + fd.x * 9, y + H, z + fd.z * 9], Rd = D * 0.27, Lr = D * 0.25;
  lathe(G, { L: H + 4, R: far ? 4.2 * Math.sqrt(H / 300) : 4.2, nu: Math.max(3, Math.round(12 * det)), nv: Math.max(3, Math.round(18 * det)), M: TRm(x, y + H / 2 - 2, z), bk: 0.9, mat: [0, 0, hsh(key, 3), 0], pat: [0, 2.2, 0.3, 0], prof: (t) => (1.15 - 0.4 * t) * (t < 0.002 ? 0 : 1), sect: (th) => 1 + 0.06 * Math.cos(th * 7),   // (c13, K2) a hairy stalk is matt: gloss 0.3 put a white hairline of highlight down its ridge, broken into dashes by the ribs
    bend: (t) => [fd.x * 9 * t * t * t + (far ? 1 : 3) * Math.sin(t * 4 + key), fd.z * 9 * t * t * t + (far ? 0.7 : 2) * Math.sin(t * 3 + key * 2)], col: (t, th, S) => { const k = mix3(stemG, P.bottle, 0.4 * vnz(th * 3 + key, t * 30)); S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
  for (let i = 0; i < (far ? 5 : 9); i++) { const h = 0.2 + (far ? 0.15 : 0.085) * i, az = i * 2.4 + key, Rl = (21 - 0.9 * i + 4 * hsh(i, key)) * (far ? H / 300 : 1), d = [Math.cos(az), 0.25, Math.sin(az)];
    leaf(G, { L: Rl * 2.2, W: Rl, nu: Math.round(7 * det), nv: Math.round(11 * det), M: leafFrame([x + d[0] * 4 + 3 * Math.sin(h * 4 + key), y + H * h, z + d[2] * 4 + 2 * Math.sin(h * 3 + key * 2)], d, [0, 1, 0]), width: heart, curl: -0.85 - 0.3 * hsh(i, key + 1), cup: 0.15, frill: [Rl * 0.1, 2], ph: i, twist: 0.25 * (hsh(i, key + 2) - 0.5), rib: 0.8, bound: true, cast: 0.6,
      c: mix3(P.bottle, P.savoy, 0.5 + 0.4 * hsh(i, key + 3)), c1: mix3(P.savoy, P.lettuce, 0.5), mat: [0.3, 0.6, hsh(i, key), 0], pat: [0, Rl * 0.11, quilt, 0] }); }
  const Mh = frame(hc, [fd.x, fd.y, fd.z], [0, 1, 0]);                  // the head's +Y is its face
  lathe(G, { L: Rd * 0.7, R: Rd, nu: Math.max(8, Math.round(30 * det)), nv: Math.max(2, Math.round(8 * det)), M: T4(Mh, TRm(0, -Rd * 0.2, 0)), mat: [0, 0, 0.4, 0], pat: [0.9, 0, 0.6, 0],   /* (c13, K3) a disc of florets is matt: gloss 0.25 laid a pale oval of highlight on its dome */ prof: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.5 + 0.5 * t * t))), 0.5) * (t > 0.995 ? 0 : 1) + (t > 0.995 ? 0 : 0.0),
    col: (t, th, S) => { const k = t < 0.72 ? mix3(P.bottle, P.savoy, 0.3 + 0.5 * t) : mix3(mix3(P.soil, P.glaze, 0.4), P.copper, 0.5 * sst(0.8, 0.9, t) * (0.5 + 0.5 * vnz(th * 9, t * 30))); S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
  const nr = far ? 14 : Math.round(34 * (0.7 + 0.3 * det));
  for (let i = 0; i < nr; i++) { const az = i * TAU / nr + 0.1 * hsh(i, key), rowB = i % 2;      // rays, lit through; bracts behind them
    leaf(G, { L: Lr * (0.85 + 0.3 * hsh(i, key + 5)), W: Lr * (far ? 0.36 : 0.2), nu: far ? 1 : 2, nv: far ? 3 : Math.round(4 + 2 * det), M: T4(Mh, RYm(az), TRm(0, rowB * 0.5, Rd * 0.9), RXm(Math.PI / 2 - 0.12 - 0.2 * hsh(i, key + 6))), width: lance, curl: -0.25 + 0.5 * hsh(i, key + 7), cup: 0.3, twist: 0.3 * (hsh(i, key + 8) - 0.5),
      col: (v, sA, S) => { const c = mix3(mix3(P.gold, P.tomato, 0.16 * sst(0.3, 0, v)), P.lemon, sst(0.15, 0.95, v) * (0.75 + 0.25 * hsh(i, key + 9))); S.r = c[0]; S.g = c[1]; S.b = c[2]; }, pid: G.bounds.length, mat: [0.3, 1, hsh(i, key), 7], pat: [0, 0.3, 0, 0] });   // gold at the disc going to lemon at the tip; one fine midrib (a broad pale rib would bleach the ray)
    if (i % 2 === 0 && !far) leaf(G, { L: Lr * 0.55, W: Lr * 0.17, nu: 2, nv: 3, M: T4(Mh, RYm(az + 0.1), TRm(0, -Rd * 0.22, Rd * 0.82), RXm(Math.PI / 2 + 0.35)), width: lance, curl: -0.6, c: P.bottle, c1: P.savoy, pid: G.bounds.length, mat: [0.3, 0.3, 0, 0], pat: [0, 2, 0, 0] }); }
  out.push({ c: hc, n: [fd.x, fd.y, fd.z], R: Rd + Lr });
  return { x, z, R: 28, H };
}

// ---------------------------------------------------------------- creatures: own meshes in the glaze, closed courses by place and the world's clock
// Each maker returns an InstancedMesh with userData.fly(time). A course is an ellipse about a station, tilted, with a bob:
// always in mid-motion at any clock; nothing reads u or the camera.
// ---------------------------------------------------------------- the far belt's makers (ruling 7, part 3)
// A LENGTH OF THE GARDEN'S WALL from a to b (x, z): warm brick laid in courses 4.2 m deep (the glaze's own ribs, run level:
// the piece's first coordinate is its height) with stone patches and a pale stone coping, 5 m thick, its top stepping
// between 14 and 22 m by place. Three sheets (the face to the left of a to b, the other face, the top), each flat, so a
// face takes the one sun whole or goes into the dark. hk(s): the share of its height that stands at s metres (a fallen end).
function wallRun(G, P, a, b, o = {}) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) return;
  const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz, nz = tx, n = Math.max(1, Math.round(L / (o.step || 45))), key = o.key || 0, T = 2.5, s0 = o.s0 || 0, hk = o.hk || (() => 1);
  const far = (o.step || 45) > 30, moss = mix3(P.bottle, P.soil, 0.4), brick = far ? mix3(mix3(mix3(P.copper, P.tomato, 0.5), P.soil, 0.45), moss, 0.3) : mix3(mix3(P.copper, P.tomato, 0.5), P.soil, 0.12), stone = far ? mix3(mix3(P.husk, P.soil, 0.5), moss, 0.3) : mix3(P.husk, P.cream, 0.3), dk = mix3(P.soil, P.glaze, 0.4);   // far lengths: old brick under moss, a clear step under the lit crowns (a bright wall all round would draw a rim)
  const topAt = (u) => { const s = s0 + u * L; return (14 + 8 * vnz(s * 0.011 + key, key * 1.7)) * hk(u * L); };
  const footAt = (u) => landY(a[0] + tx * u * L, a[1] + tz * u * L) - 1.5;
  const colAt = (u, v, S, k) => { const s = s0 + u * L, m = vnz(s * 0.05 + key, v * 3 + k), c = mix3(mix3(brick, stone, 0.55 * sst(0.62, 0.8, vnz(s * 0.021 + 7 + key, k))), dk, 0.4 * sst(0.55, 0.9, m) + 0.25 * (1 - v));   // damp and moss at the foot
    S.r = c[0]; S.g = c[1]; S.b = c[2]; };
  for (const sd of [1, -1]) surf(G, { nu: n, nv: 1, wrap: false, pid: 0, mat: [0.1, 0, hsh(key, sd), 0], pat: [0.5, 4.2, 0.3, 0], f: (u, v, S) => { const uu = sd > 0 ? u : 1 - u, f = footAt(uu), h = topAt(uu);
    S.x = a[0] + tx * uu * L + nx * sd * T; S.z = a[1] + tz * uu * L + nz * sd * T; S.y = f + v * (h + 1.5); S.a = v * (h + 1.5); S.b2 = s0 + uu * L; colAt(uu, v, S, sd); } });
  surf(G, { nu: n, nv: 1, wrap: false, pid: 0, mat: [0.1, 0, hsh(key, 3), 0], pat: [0.5, 0, 0.2, 0], f: (u, v, S) => { const f = footAt(u), h = topAt(u), w = (1 - 2 * v) * (T + 0.6);
    S.x = a[0] + tx * u * L + nx * w; S.z = a[1] + tz * u * L + nz * w; S.y = f + h + 1.5; S.a = w; S.b2 = s0 + u * L; const c = mix3(stone, brick, 0.3 * vnz(u * L * 0.08 + key, 2)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
}
// A GATE PIER: a square stone pillar with a cap, taller than the wall beside it. No arch, no arms, no figure.
function pier(G, P, x, y, z, H, R, key) {
  const stone = mix3(P.husk, P.cream, 0.3), brick = mix3(mix3(P.copper, P.tomato, 0.42), P.soil, 0.22);
  lathe(G, { L: H, R, nu: 4, nv: 2, M: T4(TRm(x, y + H / 2, z), RYm(key)), bound: false, pid: 0, mat: [0.12, 0, hsh(key, 1), 0], pat: [0.5, 0, 0.2, 0], prof: (t) => (t > 0.86 ? 1.25 : 1) * (t > 0.995 ? 0.02 : 1), col: (t, th, S) => { const c = mix3(brick, stone, t > 0.8 ? 1 : 0.35 + 0.3 * vnz(t * 5 + key, th)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
}
// AN ESPALIER: a fruit tree trained flat as a fan on a wall's sunward face. base: its foot at the wall; t: along the wall; nrm:
// the face's own outward direction; H: the wall's height there. Arms fan from the foot, each a leafy strip standing 0.9 m
// off the brick; near (det 1): seven arms, a trunk, and pears or apples one can name; far: five arms.
function espalier(G, P, base, t, nrm, H, key, det, fruit) {
  const near = det >= 1, arms = near ? 7 : 5, bark = { soil: mix3(P.soil, P.glaze, 0.3), copper: P.copper, glaze: P.glaze };
  const o = [base[0] + nrm[0] * 0.9, base[1], base[2] + nrm[2] * 0.9];
  if (near) pole(G, bark, [o[0], o[1] - 1, o[2]], [o[0], o[1] + H * 0.34, o[2]], 0.9, key, 5);
  for (let i = 0; i < arms; i++) { const th = (i / (arms - 1) - 0.5) * 2.3 + 0.12 * (hsh(key, i) - 0.5), sn = Math.sin(th), cs = Math.cos(th), Lr = Math.min(H * 0.98 / Math.max(cs, 0.42), H * 1.25) * (0.86 + 0.14 * hsh(i, key));
    const d = [t[0] * sn, cs, t[2] * sn], f = [o[0] + d[0] * H * 0.1, o[1] + 1.5 + d[1] * H * 0.1, o[2] + d[2] * H * 0.1], k = key + i * 1.31;
    const cA = mix3(P.bottle, P.savoy, 0.35 + 0.5 * hsh(k, 1)), cB = mix3(P.savoy, P.lettuce, 0.3 + 0.5 * hsh(k, 2));
    leaf(G, { L: Lr * 0.9, W: near ? 2.3 : 2.6, nu: 1, nv: near ? 4 : 1, M: leafFrame(f, d, [nrm[0], 0.12, nrm[2]]), width: (v) => 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.08)), curl: 0.02, cup: 0.12, frill: [near ? 0.5 : 0, 3], ph: k, pid: 0,
      col: (v, s, S) => { const c = mix3(cA, cB, 0.25 + 0.6 * vnz(v * 6 + k, s * 2)); S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [0.3, 0.45, hsh(k, 3), 0], pat: [0, 0.5, 0.6, 0.05] });
    if (near && i % 3 === 0) { const j = 0, v = 0.3 + 0.5 * hsh(k, j + 5), sd = hsh(k, j + 9) < 0.5 ? -1 : 1, c = [f[0] + d[0] * Lr * 0.9 * v + t[0] * cs * sd * 2.4 + nrm[0] * 1.3, f[1] + d[1] * Lr * 0.9 * v - sn * sd * 2.4 - 1.2, f[2] + d[2] * Lr * 0.9 * v + t[2] * cs * sd * 2.4 + nrm[2] * 1.3];
      fruitOf(G, P, c, fruit, 1.8, k + j * 3.7, 4, 2); } }
}
// A FRUIT: a pear (lemon to gold, russet at the eye, a narrow neck), an apple (tomato red over lettuce green) or a quince
// (muscat yellow, lumpy), hung stalk up.
function fruitOf(G, P, c, kind, R, key, nu, nv) {
  const pear = kind === 'pear', quince = kind === 'quince', russet = mix3(P.copper, P.soil, 0.35);
  lathe(G, { L: R * (pear ? 2.7 : quince ? 2.2 : 1.85), R, nu, nv, ease: 1, bound: false, pid: 0, M: T4(TRm(c[0], c[1], c[2]), RYm(key * 2.1), RZm(0.25 * (hsh(key, 1) - 0.5))), mat: [0.6, 0, hsh(key, 2), 0], pat: [0.4, 0, 0, 0.08],
    prof: pear ? (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02))), 0.6) * (1 - 0.52 * sst(0.4, 0.95, t)) : (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02))), 0.55),
    sect: quince ? (th) => 1 + 0.1 * Math.sin(th * 3 + key) : null,
    col: (t, th, S) => { const m = vnz(th * 2 + key, t * 3); const k = pear ? mix3(mix3(mix3(P.lemon, P.gold, 0.5 * m), P.lettuce, 0.3 * sst(0.5, 0.9, vnz(th + key, t * 2 + 3))), russet, 0.5 * sst(0.25, 0.0, t))
      : quince ? mix3(mix3(P.muscat, P.lemon, 0.6), P.lettuce, 0.25 * m) : mix3(mix3(P.lettuce, P.lemon, 0.2), P.tomato, sst(0.25, 0.6, m + 0.5 * Math.sin(th + key)));
      S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
}
// A GREAT FRUIT TREE (ruling 7, part 3): a trunk and five to nine crown masses with fruit as points of its colour. A pear is
// tall and narrow (its masses stacked to a spire), an apple broad and low (a ring of masses about one on top), a quince
// round, between. G takes the trunk and limbs (they stand still), GC the crown (it stirs in the wind by the world's clock):
// masses, fruit, and on a near specimen (det 1) leaf sprays whose outlines are cut in the glaze. ok(x, y, z, r): a mass is
// made only where this allows (a tree by the line keeps its crown out of the line's air and out of the look at the head).
// A mass of a specimen within 110 m of the line is A MASS OF LEAVES: a dark heart and eight broad leaves lapped round it,
// their outlines cut in the glaze. The wall's great apple also carries THE GREAT BOUGH (BOUGH, greatBough, below).
function fruitTree(G, GC, P, x, z, kind, H, key, det, lean, ok, lineDist) {
  const near = det >= 1, pear = kind === 'pear', apple = kind === 'apple', y0 = landY(x, z) - 1.5, lx = lean ? lean[0] : 0, lz = lean ? lean[1] : 0;
  const trH = H * (pear ? 0.3 : apple ? 0.4 : 0.34), trR = H * (pear ? 0.032 : 0.045), bark = mix3(mix3(P.soil, P.glaze, 0.45), P.copper, 0.12), barkL = mix3(P.soil, P.husk, 0.3);
  lathe(G, { L: trH + 1.5, R: trR, nu: near ? 8 : 4, nv: near ? 4 : 1, bound: false, pid: 0, M: TRm(x, y0 + (trH + 1.5) / 2, z), bend: (t) => [lx * t * t, lz * t * t], mat: [0.12, 0, hsh(key, 1), 0], pat: [0.6, near ? 2.4 : 0, 0.4, 0],
    prof: (t) => 1.5 - 1.1 * Math.sqrt(t) + 0.35 * t, col: (t, th, S) => { const c = mix3(bark, barkL, 0.6 * vnz(th * 3 + key, t * 6)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  const n = pear ? (near ? 7 : 6) : apple ? (near ? 7 : 6) : 5, top = [x + lx, y0 + trH, z + lz], M = [];
  for (let i = 0; i < n; i++) { let c, r, sy;
    if (pear) { const f = i / (n - 1), a = i * 2.4 + key; r = H * (0.15 - 0.08 * f) * (0.9 + 0.2 * hsh(key, i)); sy = 1.3; c = [top[0] + Math.cos(a) * r * 0.5 * (1 - 0.7 * f), y0 + H * (0.34 + 0.57 * f), top[2] + Math.sin(a) * r * 0.5 * (1 - 0.7 * f)]; }
    else if (i === 0) { r = H * (apple ? 0.25 : 0.24); sy = apple ? 0.8 : 1; c = [top[0], y0 + H - r * sy, top[2]]; }
    else { const a = (i - 1) / (n - 1) * TAU + key, rr = H * (apple ? 0.36 : 0.2) * (0.8 + 0.3 * hsh(key, i)); r = H * (apple ? 0.2 : 0.21) * (0.85 + 0.3 * hsh(i, key)); sy = apple ? 0.85 : 1; c = [top[0] + Math.cos(a) * rr, y0 + H * (apple ? 0.6 : 0.58) + H * 0.07 * (hsh(key + 2, i) - 0.5), top[2] + Math.sin(a) * rr]; }
    if (ok && !ok(c[0], c[1], c[2], r * Math.max(1, sy))) continue;
    M.push([c, r, sy]); const k = key + i * 1.7, cA = mix3(P.bottle, P.savoy, 0.3 + 0.4 * hsh(k, 1)), cB = mix3(P.savoy, P.lettuce, 0.35), leafy = near && lineDist(c[0], c[1], c[2]) < 110, ks = leafy ? 0.72 : 1;
    lathe(GC, { L: 2 * r * sy * ks, R: r * ks, nu: leafy ? 5 : near ? 7 : 6, nv: leafy ? 3 : 4, ease: 1, M: T4(TRm(c[0], c[1], c[2]), RYm(k), RZm(0.2 * (hsh(k, 2) - 0.5))), mat: [0.18, 0, hsh(k, 3), 0], pat: [0, 0, leafy ? 0.2 : 0.8, 0.04],
      prof: (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), 2.4)), 0.42), sect: (th, t) => 1 + 0.13 * Math.sin(th * 3 + k) + 0.08 * Math.sin(th * 5 + t * 7 + k),
      col: (t, th, S) => { const q = leafy ? mix3(P.glaze, P.bottle, 0.55) : mix3(mix3(mix3(P.glaze, P.bottle, 0.7), cA, sst(0.05, 0.5, t)), cB, 0.5 * sst(0.45, 1, t) * vnz(th * 3 + k, t * 4) + 0.25 * vnz(th * 7, t * 9 + k)); S.r = q[0]; S.g = q[1]; S.b = q[2]; } });
    if (leafy) for (let j = 0; j < 8; j++) { const yy = 0.92 - 1.5 * (j + 0.5) / 8, rad = Math.sqrt(Math.max(0, 1 - yy * yy)), az = j * 2.39996 + k, d = [rad * Math.cos(az), yy, rad * Math.sin(az)], W = r * 0.56;   // lapped like tiles, each leaf's tip turned out and up
      const up = [-d[0] * d[1], 1 - d[1] * d[1] + 0.05, -d[2] * d[1]], kk = k + j * 0.77, c0 = mix3(cA, P.bottle, 0.3 * hsh(kk, 1)), c1 = mix3(P.savoy, P.lettuce, 0.3 + 0.5 * hsh(kk, 2));
      leaf(GC, { shape: 'bean', L: W * 2.6, W, nu: 5, nv: 2, dome: 0.2, M: leafFrame([c[0] + d[0] * r * 0.6 - up[0] * W * 0.5, c[1] + (d[1] * r * 0.6 - up[1] * W * 0.5) * sy, c[2] + d[2] * r * 0.6 - up[2] * W * 0.5], [up[0] + 0.55 * d[0], up[1] + 0.55 * d[1], up[2] + 0.55 * d[2]], d), width: heart, curl: -0.55, cup: 0.2, frill: [W * 0.05, 2], ph: kk, pid: 0,
        col: (v, sA, S) => { const q = mix3(c0, c1, 0.2 + 0.6 * sst(0.1, 0.9, v) * (0.6 + 0.4 * vnz(sA * 2 + kk, v * 4))); S.r = q[0]; S.g = q[1]; S.b = q[2]; }, mat: [0.34, 0.45, hsh(kk, 3), 11], pat: [0, W * 0.06, 0.5, 0.05] }); }
    if (near && (pear || apple)) pole(G, { soil: bark, copper: barkL, glaze: P.glaze }, top, [c[0], c[1] - r * sy * 0.5, c[2]], trR * 0.3, k, 5);
    if (near && !leafy) for (let j = 0; j < 2; j++) { const az = hsh(k, j + 4) * TAU, el = 0.15 + 0.5 * hsh(k, j + 6), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], W = r * 0.3;   // sprays at the outline: broad leaf shapes cut in the glaze
      leaf(GC, { shape: 'bean', L: W * 2, W, nu: 6, nv: 2, dome: 0.14, M: leafFrame([c[0] + d[0] * r * 0.82, c[1] + d[1] * r * sy * 0.82, c[2] + d[2] * r * 0.82], [d[0], d[1] + 0.25, d[2]], [d[0] * 0.4, 1, d[2] * 0.4]), width: heart, curl: -0.25, cup: 0.12, frill: [W * 0.05, 2], ph: k + j, pid: 0,
        c: mix3(cA, P.savoy, 0.5), c1: mix3(P.savoy, P.lettuce, 0.6), mat: [0.32, 0.5, hsh(k, j), 11], pat: [0, W * 0.07, 0.5, 0.05] }); } }
  const nf = near ? 9 : 2, fr = near ? (pear ? 2.3 : 2.6) : 3.8, sunAz = Math.atan2(SUN_DIR.z, SUN_DIR.x);                // fruit hang about the lower halves of the masses (there the wind moves a mass least)
  for (let j = 0; j < nf && M.length; j++) { const [c, r, sy] = M[(j * 2 + 1) % M.length], az = sunAz + (hsh(key + 5, j) - 0.5) * 3.2, el = -0.05 - 0.45 * hsh(key + 7, j);   // on the sunward side, so that they are points of lit colour
    fruitOf(GC, P, [c[0] + Math.cos(az) * Math.cos(el) * r * 1.0, c[1] + Math.sin(el) * r * sy, c[2] + Math.sin(az) * Math.cos(el) * r * 1.0], kind, fr, key + j * 2.3, near ? 4 : 3, near ? 3 : 2); }
  return { x, z, R: trR * 2.5, H: 30, soft: 0.6 };
}
// THE GREAT BOUGH (c11): a limb of the wall's great apple that reaches south over the wall's foot, hung with great apples
// and broad leaves, in place of the crown mass that stood there. By place: BOUGH.
const BOUGH = { at: [27, 55, -702], keep: 14, tip: [34, 62, -694], rise: 8, R: 1.9,
  apples: [[25, 54, -699, 5.2, 32, 18], [34, 49.5, -700, 4.6, 28, 16], [31, 61, -707, 4.4, 28, 16], [18.5, 59, -705, 4.8, 30, 16], [38.5, 56, -693.5, 3.8, 24, 14]],   // x, y, z, R, round the girth, along the axis (c12: 4,576 triangles; c11's 904 showed straight outlines)
  leaves: [[0, -0.75, -0.45, -0.3, 0.1], [0, 0.7, -0.5, 0.2, -0.15], [1, 0.75, -0.4, 0.35, 0.2], [2, -0.6, -0.3, -0.55, -0.1], [2, 0.65, -0.55, -0.2, 0.15], [3, -0.7, -0.45, 0.3, 0.05], [4, 0.6, -0.5, 0.45, -0.1], [-1, 0.5, -0.6, 0.5, 0.1]] };
function greatBough(G, GC, P, from) {
  const B = BOUGH, a = from, b = B.tip, d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]), bark = mix3(mix3(P.soil, P.glaze, 0.45), P.copper, 0.12), barkL = mix3(P.soil, P.husk, 0.3);
  const Ml = frame([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d, [0, 1, 0]), pv = new THREE.Vector3();
  const limbAt = (t) => { pv.set(B.rise * 4 * t * (1 - t), (t - 0.5) * L, 0).applyMatrix4(Ml); return [pv.x, pv.y, pv.z]; };
  lathe(G, { L, R: B.R, nu: 6, nv: 6, bound: false, pid: 0, M: Ml, bend: (t) => [B.rise * 4 * t * (1 - t), 0], mat: [0.12, 0, 0.37, 0], pat: [0.6, 2.4, 0.4, 0],
    prof: (t) => (1 - 0.72 * t) * (t > 0.999 ? 0 : 1), sect: (th, t) => 1 + 0.1 * Math.sin(th * 3 + t * 9), col: (t, th, S) => { const c = mix3(bark, barkL, 0.6 * vnz(th * 3 + 4.1, t * 14)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  const stalks = [];
  B.apples.forEach(([x, y, z, R, nu, nv], j) => { const key = 3.3 + j * 2.3, Lh = R * 1.85, top = [x, y + Lh * 0.5 - Lh * 0.1, z], Ma = T4(TRm(x, y, z), RYm(key * 2.1), RZm(Math.PI + 0.3 * (hsh(key, 1) - 0.5)));
    // the apple: stalk end up and still (its aUv.y is nought there), a cavity at the stalk, five soft lobes about a small dimple at the eye,
    // streaked red over green gold. A WHOLE BODY (c12, F1): its profile comes to a true point at both ends (c11's stopped at a
    // quarter of the radius, and the skin is drawn on its outer side only, so the sky showed through the open end)
    lathe(GC, { L: Lh, R, nu, nv, ease: 1, bound: false, pid: 0, M: Ma, mat: [0.9, 0, hsh(key, 2), 0], pat: [0.45, 0, 0, 0.05],
      prof: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.5) * (1.04 - 0.12 * sst(0.45, 1, t)) * (t < 0.0005 || t > 0.9995 ? 0 : 1), sect: (th, t) => 1 + 0.035 * sst(0.6, 1, t) * Math.sin(th * 5 + key),
      bend: (t) => { const a = Math.max(0, 1 - t / 0.18), b = Math.max(0, (t - 0.88) / 0.12); return [0, 0, Lh * (0.2 * a * a - 0.1 * b * b)]; },
      col: (t, th, S) => { const m = vnz(th * 2 + key, t * 3), st = vnz(th * 11 + key, t * 1.2 + key), blush = sst(0.2, 0.62, m + 0.5 * Math.sin(th + key) + 0.25 * (st - 0.5));
        let k = mix3(mix3(mix3(P.lettuce, P.lemon, 0.35), P.gold, 0.25 * st), mix3(P.tomato, P.beet, 0.18 * st), blush * (0.82 + 0.18 * sst(0.3, 0.7, st)));
        k = mix3(k, mix3(P.lettuce, P.gold, 0.5), 0.55 * sst(0.2, 0.02, t)); k = mix3(k, bark, 0.7 * Math.max(sst(0.035, 0.0, t), sst(0.975, 1.0, t))); S.r = k[0]; S.g = k[1]; S.b = k[2]; } });
    // its twig, from the limb's nearest point down into the stalk's cavity
    pv.set(0, -Lh * 0.27, 0).applyMatrix4(Ma); const foot = [pv.x, pv.y, pv.z];
    let bt = 0, bd = 1e9; for (let i = 4; i <= 20; i++) { const q = limbAt(i / 20), dd = Math.hypot(q[0] - top[0], q[1] - top[1], q[2] - top[2]); if (dd < bd) { bd = dd; bt = i / 20; } }
    const q = limbAt(bt), td = [foot[0] - q[0], foot[1] - q[1], foot[2] - q[2]], tl = Math.hypot(td[0], td[1], td[2]);
    lathe(G, { L: tl, R: 0.55, nu: 4, nv: 2, bound: false, pid: 0, M: frame([(q[0] + foot[0]) / 2, (q[1] + foot[1]) / 2, (q[2] + foot[2]) / 2], td, [0, 1, 0]), bend: (t) => [tl * 0.14 * 4 * t * (1 - t), 0], mat: [0.12, 0, 0.4, 0], pat: [0.6, 2.4, 0.4, 0],
      prof: (t) => 1 - 0.5 * t, col: (t, th, S) => { const c = mix3(bark, barkL, 0.5 * vnz(th * 3 + key, t * 6)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
    stalks.push(top); });
  // broad leaves at the stalks (and one at the limb's tip), their upper faces to the north and a little up
  B.leaves.forEach(([j, dx, dy, dz, tw], n) => { const p = j < 0 ? B.tip : stalks[j], W = j < 0 ? 3.6 : 4.4 - (0.25 * n) % 1.1, kk = 7.7 + n * 0.77, c0 = mix3(mix3(P.bottle, P.savoy, 0.6), P.bottle, 0.3 * hsh(kk, 1)), c1 = mix3(P.savoy, P.lettuce, 0.4 + 0.4 * hsh(kk, 2));
    leaf(GC, { shape: 'bean', L: W * 2.6, W, nu: 6, nv: 3, dome: 0.2, M: leafFrame([p[0], p[1] + 0.4, p[2]], [dx, dy, dz], [-0.02 + tw, 0.3, -0.95]), width: heart, curl: -0.5, cup: 0.2, frill: [W * 0.05, 2], ph: kk, pid: 0,
      col: (v, sA, S) => { const q = mix3(c0, c1, 0.2 + 0.6 * sst(0.1, 0.9, v) * (0.6 + 0.4 * vnz(sA * 2 + kk, v * 4))); S.r = q[0]; S.g = q[1]; S.b = q[2]; }, mat: [0.34, 0.45, hsh(kk, 3), 11], pat: [0, W * 0.06, 0.5, 0.05] }); });
}
// THE BELT'S TREES, by place (x, z, kind, height, near): 26, in unequal clumps with clear gaps, before and behind the wall, 700
// to 960 m from the head; none on the mouth's axis. The three by the line's north turn are specimens for a near view.
const BELT_TREES = [[24, -744, 'apple', 120, 1], [80, -814, 'pear', 165], [-140, -690, 'pear', 150, 1],
  [150, -818, 'apple', 100], [218, -800, 'quince', 72], [362, -748, 'quince', 68], [432, -732, 'pear', 152], [506, -690, 'apple', 96], [704, -432, 'pear', 140], [762, -372, 'apple', 104],
  [832, 300, 'apple', 110], [884, 236, 'pear', 160], [762, 422, 'quince', 74], [562, 692, 'pear', 132], [152, 832, 'apple', 100], [58, 752, 'apple', 116], [-62, 802, 'quince', 70],
  [-432, 722, 'pear', 170], [-560, 560, 'apple', 96], [-642, 602, 'quince', 66], [-822, 150, 'apple', 120], [-902, -80, 'pear', 150], [-792, -140, 'quince', 72], [-222, -772, 'pear', 164], [-470, -692, 'apple', 100], [-150, -806, 'quince', 72]];
// The belt, built a step at a time (each step a plain function; the build yields between them). Bw: wall, piers, rubble,
// trunks and espaliers (still); Bc: the crowns (they stir). out.bodies: footprints for the contact shade; out.esp: the
// near espaliers' places (the creatures' stations by the wall).
function beltSteps(Bw, Bc, P, q, lineDist, clearOfLook, out) {
  const W = BELT.wall, steps = [], sunx = SUN_DIR.x, sunz = SUN_DIR.z;
  const rubble = (x, z, k) => lathe(Bw, { L: 9 + 5 * hsh(k, 1), R: 3.2 + 2 * hsh(k, 2), sz: 0.7, nu: 4, nv: 2, ease: 1, pid: 0, bound: false, M: T4(TRm(x, landY(x, z) + 1.2, z), RYm(k), RZm(Math.PI / 2 - 0.2)), mat: [0.1, 0, hsh(k, 3), 0], pat: [0.5, 0, 0.5, 0],
    prof: (t) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1))), sect: (th) => 1 + 0.2 * Math.sin(th * 4 + k), c: mix3(mix3(P.copper, P.tomato, 0.4), P.soil, 0.35 + 0.3 * hsh(k, 4)) });
  for (let i = 0; i < W.length; i++) steps.push(() => {
    const a = W[i], b = W[(i + 1) % W.length], kind = a[2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz, nz = tx, key = i * 3.7 + 1;
    const at = (s) => [a[0] + tx * s, a[1] + tz * s], mid = at(L / 2), step = kind === 'n' ? 12 : lineDist(mid[0], 30, mid[1]) < 150 ? 22 : 80;
    const run = (s0, s1, hk) => wallRun(Bw, P, at(s0), at(s1), { step, key, s0, hk: hk ? (s) => hk(s0 + s) : null });
    if (kind === 'g') { run(0, L / 2 - 18); run(L / 2 + 18, L);
      for (const sg of [-1, 1]) { const p = at(L / 2 + sg * 20); pier(Bw, P, p[0], landY(p[0], p[1]) - 1.5, p[1], 31, 5.5, Math.atan2(-tz, tx) + Math.PI / 4); } }
    else if (kind === 'f') { run(0, L - 76); run(L - 76, L - 42, (s) => 1 - 0.8 * Math.min(1, Math.floor((s - (L - 76)) / 8.5 + 0.5) / 4)); run(L - 6, L, () => 0.62);   // the broken end steps down; a gap with its fallen brick; a stub at the corner
      for (let j = 0; j < 6; j++) { const p = at(L - 40 + j * 5.5 + 3 * hsh(key, j)), o = (hsh(j, key) - 0.5) * 16; rubble(p[0] + nx * o, p[1] + nz * o, key + j); } }
    else run(0, L);
    // espaliers on the length's sunward face (its inner face where that looks to the sun, else its outer), 22 m apart where the line passes within 105 m, about 60 m apart elsewhere
    const dn = nx * sunx + nz * sunz; if (Math.abs(dn) < 0.1) return; const sd = dn > 0 ? 1 : -1, end = kind === 'f' ? L - 80 : L;
    for (let s = 14; s < end - 10;) { const p = at(s), bx = p[0] + nx * sd * 2.5, bz = p[1] + nz * sd * 2.5, by = landY(bx, bz), dl = lineDist(bx, by + 10, bz), near = dl < 105;
      const inGate = kind === 'g' && Math.abs(s - L / 2) < 30, H = 14 + 8 * vnz(s * 0.011 + key, key * 1.7);
      if (!inGate) { espalier(Bw, P, [bx, by, bz], [tx, 0, tz], [nx * sd, 0, nz * sd], H * 0.92, key * 7 + s * 0.13, near ? 1 : 0.5, (Math.round(s / 22) + i) % 3 ? 'pear' : 'apple'); if (near) out.esp.push([bx + nx * sd * 3, by + H * 0.55, bz + nz * sd * 3, nx * sd, nz * sd]); }
      s += near ? 22 : 52 + 16 * hsh(key, s); }
  });
  for (let i = 0; i < BELT_TREES.length; i++) { steps.push(() => { const [x, z, kind, H, near] = BELT_TREES[i];
    out.bodies.push(fruitTree(Bw, Bc, P, x, z, kind, H, i * 2.9 + 3, near ? 1 : 0.5, near && i === 0 ? [-5, 7] : [H * 0.06 * (hsh(i, 5) - 0.5), H * 0.06 * (hsh(i, 6) - 0.5)], near ? (cx, cy, cz, r) => lineDist(cx, cy, cz) > r + 9 && clearOfLook(cx, cy, cz, r * 1.15) && Math.hypot(cx - BOUGH.at[0], cy - BOUGH.at[1], cz - BOUGH.at[2]) > r + BOUGH.keep : null, lineDist)); });
    if (i === 0) steps.push(() => { const [x, z, , H] = BELT_TREES[0]; greatBough(Bw, Bc, P, [x - 5, landY(x, z) - 1.5 + H * 0.4, z + 7]); }); }
  return steps;
}
function creatureMesh(G, mat, courses, name, upright) {
  const n = Math.max(1, courses.length), mesh = new THREE.InstancedMesh(G.toGeometry(), mat, n); mesh.name = name; mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3(), v2 = new THREE.Vector3(), bx = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const at = (k, a, o) => { if (k.up) return o.set(k.c[0], k.c[1], k.c[2]).addScaledVector(k.t1, Math.cos(a) * k.r).addScaledVector(k.t2, Math.sin(a) * k.r); const ct = Math.cos(k.tilt), st = Math.sin(k.tilt), x = Math.cos(a) * k.r, z = Math.sin(a) * k.r * k.e; return o.set(k.c[0] + x * ct - z * st, k.c[1] + k.bob * Math.sin(2 * a + k.ph) + 0.25 * k.bob * Math.sin(5 * a), k.c[2] + x * st + z * ct); };
  mesh.userData.fly = (time) => { for (let i = 0; i < courses.length; i++) { const k = courses[i], a = time * k.w + k.ph; at(k, a, v); at(k, a + 0.05 * Math.sign(k.w), v2);
    if (k.up) { v2.sub(v); const d = v2.dot(k.up); v2.addScaledVector(k.up, -d).normalize(); bx.crossVectors(k.up, v2); m.makeBasis(bx, k.up, v2); q.setFromRotationMatrix(m); }   // a crawler: +Y the surface's normal, +Z its way
    else { e.set(upright ? 0 : -0.25, Math.atan2(v2.x - v.x, v2.z - v.z), 0, 'YXZ'); q.setFromEuler(e); }
    sc.setScalar(k.s || 1); m.compose(v, q, sc); mesh.setMatrixAt(i, m); }
    mesh.instanceMatrix.needsUpdate = true; };
  mesh.userData.fly(0); mesh.userData.courses = courses; return mesh;
}
const zeroBounce = (G) => { for (let i = 0; i < G.n; i++) { G.shade[i * 3] = 1; G.shade[i * 3 + 1] = 1; G.shade[i * 3 + 2] = 0; } };
// GOLDFINCH (span 12): a red face, a white cheek under a black crown, a black nape, a buff back over a cream belly, black
// wings with one broad gold bar, a black forked tail, a short pale beak. Local frame: +Z forward, wings along X, +Y up. Its
// marks are paint, one row of the mesh to a mark: seven of the body's thirteen rows are the head's (six sides round, not eight: 224 triangles a bird).
function goldfinchGeo(P) {
  const G = new Geo(900); G.bounds = []; const buff = mix3(P.husk, P.copper, 0.45), dark = mix3(P.glaze, P.umber, 0.6), red = mix3(P.tomato, P.beet, 0.1), beak = mix3(P.cream, P.husk, 0.35);
  const L = 7.8, R = 1.8, prof = (t) => { const body = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t / 0.8))), 0.62) * (0.42 + 0.58 * sst(0, 0.42, t)), hd = (t - 0.82) / 0.12, head = 0.76 * Math.sqrt(Math.max(0, 1 - hd * hd)), bk = t > 0.9 ? 0.3 * Math.max(0, 1 - (t - 0.9) / 0.1) : 0; return Math.max(body, head, bk, 0.001); };
  surf(G, { nu: 6, nv: 13, wrap: true, M: RXm(Math.PI / 2), pid: 0, mat: [0.3, 0, 0.2, 0], pat: [0, 0, 0, 0], f: (u, v, S) => {
    const row = Math.round(v * 13), t = row <= 6 ? row / 6 * 0.7 : 0.7 + (row - 6) / 7 * 0.3, th = u * TAU, r = R * prof(t), up = Math.sin(th);   // rows 7 to 13 are the head: 0.743 nape, 0.786 cheek and crown, 0.829 and 0.871 face, 0.914 on the beak
    S.x = r * Math.cos(th); S.z = -r * Math.sin(th); S.y = (t - 0.5) * L; S.a = u * TAU * R; S.b2 = t * L;
    let c = up > 0.3 ? mix3(buff, P.soil, 0.4) : mix3(buff, P.cream, 0.85 * sst(0.25, -0.5, up) + 0.6 * sst(0.16, 0.06, t));   // a brown back over buff flanks and a cream belly
    if (row === 7 || row === 8) c = up > 0.3 ? dark : P.cream;            // black nape and crown over the white cheek
    else if (row === 9) c = up > 0.3 ? dark : red; else if (row === 10) c = red; else if (row > 10) c = beak;   // the red face, under the crown's fore edge
    S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  for (const sg of [-1, 1]) leaf(G, { L: 6.4, W: 2.7, nu: 2, nv: 7, M: T4(TRm(sg * 0.8, 0.7, 0.9), RYm(sg * 1.82), RXm(Math.PI / 2)), width: (t) => (0.5 + 0.5 * sst(0, 0.18, t)) * Math.pow(Math.max(0, 1 - t), 0.5) + 0.03, cup: 0.12, pid: 0,
    col: (v, s2, S) => { const rw = Math.round(v * 7), c = rw === 3 || rw === 4 ? P.gold : dark; S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [0.3, 0, 0.3, 0], pat: [0, 0, 0, 0] });   // A BLACK WING WITH ONE BROAD GOLD BAR (rows 3 and 4 of 7); no light passes through it
  for (const sg of [-1, 1]) leaf(G, { L: 4.2, W: 0.75, nu: 1, nv: 3, M: T4(TRm(sg * 0.25, 0.25, -3.1), RYm(sg * 0.2), RXm(-Math.PI / 2 - 0.08)), width: (t) => 0.75 + 0.25 * t - 0.5 * sst(0.85, 1, t), pid: 0, c: dark, c1: mix3(dark, P.cream, 0.6), mat: [0.25, 0.3, 0, 0], pat: [0, 0, 0, 0] });
  zeroBounce(G); return G;
}
// SPARROW (span 9): the flock's bird, plain: a brown back and cap, a cream belly and cheek, brown wings with one pale bar.
// 74 triangles. Local frame as the goldfinch's.
function sparrowGeo(P) {
  const G = new Geo(120); G.bounds = []; const brown = mix3(P.soil, P.copper, 0.4), dark = mix3(P.glaze, P.soil, 0.4), pale = mix3(P.cream, P.husk, 0.3);
  surf(G, { nu: 5, nv: 6, wrap: true, M: RXm(Math.PI / 2), pid: 0, mat: [0.3, 0, 0.2, 0], pat: [0, 0, 0, 0], f: (u, v, S) => { const th = u * TAU, t = v, r = 1.5 * Math.max(0.001, Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02))), 0.6) * (0.5 + 0.5 * sst(0, 0.35, t))), up = Math.sin(th);
    S.x = r * Math.cos(th); S.z = -r * Math.sin(th); S.y = (t - 0.5) * 6; S.a = u * 9; S.b2 = t * 6; const c = up > 0.25 ? (t > 0.7 ? dark : brown) : pale; S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  for (const sg of [-1, 1]) leaf(G, { L: 4.8, W: 2, nu: 1, nv: 3, M: T4(TRm(sg * 0.6, 0.5, 0.6), RYm(sg * 1.75), RXm(Math.PI / 2)), width: (t) => (0.5 + 0.5 * sst(0, 0.2, t)) * Math.pow(Math.max(0, 1 - t), 0.5) + 0.04, cup: 0.12, pid: 0,
    col: (v, s2, S) => { const c = Math.round(v * 3) === 1 ? pale : brown; S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [0.3, 0, 0.3, 0], pat: [0, 0, 0, 0] });
  leaf(G, { L: 3.2, W: 0.8, nu: 1, nv: 1, M: T4(TRm(0, 0.2, -2.4), RXm(-Math.PI / 2 - 0.08)), width: (t) => 0.7 + 0.3 * t, pid: 0, c: dark, c1: brown, mat: [0.25, 0.3, 0, 0], pat: [0, 0, 0, 0] });
  zeroBounce(G); return G;
}
// WASP (4 long): gold banded dark, two pale wings
function waspGeo(P) {
  const G = new Geo(300); G.bounds = []; const dark = mix3(P.glaze, P.umber, 0.4);
  lathe(G, { pid: 0, L: 4, R: 0.62, nu: 8, nv: 12, M: RXm(Math.PI / 2), bound: false, prof: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.015))), 0.6) * (1 - 0.6 * Math.exp(-Math.pow((t - 0.55) / 0.05, 2))),
    mat: [0.7, 0, 0.1, 0], pat: [0, 0, 0, 0], col: (t, th, S) => { const c = mix3(P.gold, dark, t > 0.55 ? 0.85 : sst(0.45, 0.55, Math.abs(((t * 7) % 1) - 0.5) * 2)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  for (const sg of [-1, 1]) leaf(G, { L: 2.6, W: 0.6, nu: 2, nv: 3, M: T4(TRm(sg * 0.3, 0.4, 0.3), RYm(sg * 1.3), RXm(Math.PI / 2)), width: lance, pid: 0, c: mix3(P.cream, P.husk, 0.3), c1: P.cream, mat: [0.5, 0.8, 0, 0], pat: [0, 0, 0, 0] });
  zeroBounce(G); return G;
}
// BRIMSTONE (span 5), as the hero's before the face: four plain lemon wings, no ribs or bars, one small orange spot each
function brimstoneGeo(P) {
  const G = new Geo(400); G.bounds = []; const wing = mix3(P.lemon, P.lettuce, 0.08);
  // (c12, F4) as the hero's: four wings each of its own drawn shape (the part's SHAPES.wingF, wingH: outline, veins, margin and spot are the glaze's), two-sided; a fan of 5 steps each: 40 triangles the four (c11: 64)
  for (const sg of [-1, 1]) for (const hind of [0, 1]) { const a = hind ? 2.4 : 1.22;
    leaf(G, { shape: hind ? 'wingH' : 'wingF', L: hind ? 2.1 : 2.7, W: hind ? 2.1 : 2.7, nu: 5, nv: 1, dome: 0, M: sg > 0 ? T4(RYm(a - Math.PI), RXm(-Math.PI / 2)) : T4(RYm(-a), RXm(Math.PI / 2)), pid: 0, c: mix3(wing, P.lettuce, 0.3), c1: wing, mat: [0.12, 0.8, 0.3], pat: [0, 0, 0, 0] }); }
  lathe(G, { pid: 0, L: 2.6, R: 0.22, nu: 3, nv: 3, M: RXm(Math.PI / 2), bound: false, prof: (t) => Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01)) * (t > 0.6 ? 1.2 : 0.8), c: mix3(P.glaze, P.lemon, 0.3), mat: [0.3, 0, 0, 0], pat: [0, 0, 0, 0] });
  zeroBounce(G); return G;
}
// SNAIL (9 long): a banded shell on a pale foot with two horns. Local frame: +Z forward, +Y up from the surface it is on.
function snailGeo(P) {
  const G = new Geo(900); G.bounds = []; const foot = mix3(P.husk, P.cream, 0.4), shell = mix3(P.copper, P.husk, 0.4), dark = mix3(P.soil, P.glaze, 0.5);
  lathe(G, { pid: 0, L: 9, R: 1.25, sz: 0.55, nu: 8, nv: 9, M: T4(TRm(0, 0.65, 0), RXm(Math.PI / 2)), bound: false, prof: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.015))), 0.5) * (0.6 + 0.4 * t), mat: [0.75, 0, 0.3, 0], pat: [0.4, 0, 0, 0], col: (t, th, S) => { const c = mix3(foot, dark, 0.35 * vnz(th * 4, t * 12)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  lathe(G, { pid: 0, L: 4.4, R: 2.9, nu: 12, nv: 10, ease: 1, M: T4(TRm(0, 3.3, -0.9), RZm(Math.PI / 2), RXm(0.25)), bound: false, prof: (t) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1))) * (0.8 + 0.2 * t), mat: [0.85, 0, 0.6, 0], pat: [0, 0, 0, 0],
    col: (t, th, S) => { const sp = Math.sin(th * 1.0 + Math.abs(t - 0.5) * 16.0), c = mix3(mix3(shell, P.cream, 0.5 * sst(-0.2, 0.6, sp)), dark, sst(0.55, 0.9, -sp) * 0.8); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  for (const sg of [-1, 1]) pole(G, { soil: foot, copper: P.cream, glaze: dark }, [sg * 0.45, 1.2, 3.9], [sg * 1.0, 3.3, 5.0], 0.2, sg + 3, 5);
  zeroBounce(G); return G;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'harvest-in-profile',
  name: 'Harvest in Profile',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Giuseppe Arcimboldo, 1526 or 1527 to 1593',
  weirdness: 0.5,
  media: ['air', 'open'],
  async build(ctx) {
    const tick = () => ctx.yield(), rng = ctx.rng, vary = ctx.vary || {};
    const q = clamp((ctx.quality && ctx.quality.detail) || 1, 0.6, 1);
    const scene = new THREE.Scene();
    // the hero: the head, the same on every seed, with its turned-over proxy for the river
    const hero = await buildHero(ctx, { detail: q, mirror: true, mirrorStrength: 0.9, mirrorSquash: MIRROR_K, mirrorRipple: 2.2, brimstones: 8 });
    scene.add(hero.object); await tick();
    const P = hero.pigments, Sp = hero.specimens;
    const dome = makeGroundDome(); scene.add(dome);
    const path = makePath(coursePoints());
    const PS = new Float32Array(701 * 3); { const v = new THREE.Vector3(); for (let i = 0; i <= 700; i++) { path.pointAt(i / 700, v); PS[i * 3] = v.x; PS[i * 3 + 1] = v.y; PS[i * 3 + 2] = v.z; } }   // the line, sampled once
    const lineAt = (u, o) => { const f = clamp(u, 0, 1) * 700, i = Math.min(699, Math.floor(f)), k = f - i, j = i * 3; return o.set(PS[j] + (PS[j + 3] - PS[j]) * k, PS[j + 1] + (PS[j + 4] - PS[j + 1]) * k, PS[j + 2] + (PS[j + 5] - PS[j + 2]) * k); };   // the line's place at u, from the samples
    // uAt(place): the fraction of the line nearest a place of the world. Every look below begins and ends at a PLACE.
    const uAt = (x, y, z) => { let best = 1e18, bi = 0; for (let i = 0; i <= 700; i++) { const ax = PS[i * 3] - x, ay = PS[i * 3 + 1] - y, az = PS[i * 3 + 2] - z, d = ax * ax + ay * ay + az * az; if (d < best) { best = d; bi = i; } } return bi / 700; };
    // seeded choices, made once: the garden's edition (1 brassica, 2 gourd, 3 salad) and the rare bolted garden
    const edition = Math.min(2, Math.floor(rng() * 3)), rare = !!vary.rare, dens = clamp(vary.density || 1, 0.7, 1.3);
    const dr = rng.fork ? rng.fork('deal') : rng;
    // THE LONG CAST SHADE (ruling 4, part 2; ruling 5, part 2; the owner's term 6): a map of the land about the head, the garden
    // and the far things within a kilometre, 1.9 m to a texel, drawn once here and read by the land's own glaze alone (it lies on the land, never on the
    // water or the ground that is the sky). IT IS THE SHADE OF THE CASTERS' OWN TRIANGLES: every triangle of the head (and of
    // the sunflowers, the vine, the stooks and rows, the nave, the pumpkin, the rick) is carried along the sun's direction
    // onto the land's level and drawn into the map, so the outline on the land is the head's own as the sun sees it. Then
    // each texel takes the mean over a square whose half width grows with the height of the caster that stood over it (1 m
    // at a body's foot, 7 m under the crown, 540 m out): crisp at the foot, softer and a little lighter toward the far
    // end. With LIGHT_IN_AIR false the map is one blank texel.
    const SHB = { x0: -900, z0: -800, size: 1950, n: LIGHT_IN_AIR ? 1024 : 1 }, shadeData = new Uint8Array(SHB.n * SHB.n), casters = [];
    const shadeTex = new THREE.DataTexture(shadeData, SHB.n, SHB.n, THREE.RedFormat, THREE.UnsignedByteType); shadeTex.magFilter = THREE.LinearFilter; shadeTex.minFilter = THREE.LinearMipmapLinearFilter; shadeTex.generateMipmaps = true;
    const castShade = async (list) => {
      const n = SHB.n, cell = SHB.size / n, kx = SUN_DIR.x / SUN_DIR.y, kz = SUN_DIR.z / SUN_DIR.y, LN = n >> 3, lc = 8, yAt = new Map();
      const cov = new Uint8Array(n * n), hl = new Float32Array(LN * LN);            // what is covered; the tallest caster over each 15 m cell
      const W = n + 1, sat = new Uint32Array(W * W);                              // sums of the covered texels, so that a square's mean is four readings
      let any = false;
      // (the three loops are plain functions called a slice at a time: a long loop written inside an async function runs unoptimised)
      // far: a thing of the far land, measured from the land under it (the land rises beyond 880 m; its level is asked once
      // for each 40 m of land); closed: a mesh of closed bodies, of which the half that faces one way throws the whole shade
      const draw = (P, I, t0, t1, far, closed) => { for (let t = t0; t < t1; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3; let Y0 = 7;
        if (far) { const qx = Math.round(P[a] / 40), qz = Math.round(P[a + 2] / 40), key = qx * 4096 + qz; Y0 = yAt.get(key); if (Y0 === undefined) { Y0 = landY(qx * 40, qz * 40); yAt.set(key, Y0); } }
        const ha = P[a + 1] - Y0, hb = P[b + 1] - Y0, hc = P[c + 1] - Y0, hm = Math.max(ha, hb, hc);
        if (hm < 2.5) continue;                                                // what lies on the land throws none
        const ax = (P[a] - kx * ha - SHB.x0) / cell, az = (P[a + 2] - kz * ha - SHB.z0) / cell, bx = (P[b] - kx * hb - SHB.x0) / cell, bz = (P[b + 2] - kz * hb - SHB.z0) / cell, cx = (P[c] - kx * hc - SHB.x0) / cell, cz = (P[c + 2] - kz * hc - SHB.z0) / cell;
        const ar = (bx - ax) * (cz - az) - (bz - az) * (cx - ax); if ((ar > -1e-9 && ar < 1e-9) || (closed && ar < 0)) continue;
        let xa = ax < bx ? ax : bx, xb = ax > bx ? ax : bx, za = az < bz ? az : bz, zb = az > bz ? az : bz; if (cx < xa) xa = cx; if (cx > xb) xb = cx; if (cz < za) za = cz; if (cz > zb) zb = cz;
        let x0 = Math.ceil(xa - 0.5), x1 = Math.floor(xb - 0.5), z0 = Math.ceil(za - 0.5), z1 = Math.floor(zb - 0.5); if (x0 < 1) x0 = 1; if (x1 > n - 2) x1 = n - 2; if (z0 < 1) z0 = 1; if (z1 > n - 2) z1 = n - 2;
        if (x1 < x0 || z1 < z0) continue;
        const sg = ar < 0 ? -1 : 1, e1x = sg * (bz - az), e1z = sg * (bx - ax), e2x = sg * (cz - bz), e2z = sg * (cx - bx), e3x = sg * (az - cz), e3z = sg * (ax - cx); let hit = false;   // the three edges, each as (its z part at the row) minus (its x part at the texel)
        for (let j = z0; j <= z1; j++) { const pz = j + 0.5, row = j * n, r1 = e1z * (pz - az) + e1x * ax, r2 = e2z * (pz - bz) + e2x * bx, r3 = e3z * (pz - cz) + e3x * cx;
          for (let i = x0; i <= x1; i++) { const px = i + 0.5; if (r1 - e1x * px < 0 || r2 - e2x * px < 0 || r3 - e3x * px < 0) continue; cov[row + i] = 1; hit = true; } }
        if (hit) { any = true; for (let j = z0 >> 3, je = z1 >> 3; j <= je; j++) for (let i = x0 >> 3, ie = x1 >> 3; i <= ie; i++) if (hm > hl[j * LN + i]) hl[j * LN + i] = hm; } } };
      const spread = () => { const src = hl.slice(); for (let j = 1; j < LN - 1; j++) for (let i = 1; i < LN - 1; i++) { let m = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const q = src[(j + dj) * LN + i + di]; if (q > m) m = q; } hl[j * LN + i] = m; } };   // each cell takes the tallest caster of its eight neighbours too: the softening reaches past the outline
      const sums = (j0, j1) => { for (let j = j0; j < j1; j++) { let run = 0; const r0 = j * n, s0 = (j + 1) * W, s1 = j * W; for (let i = 0; i < n; i++) { run += cov[r0 + i]; sat[s0 + i + 1] = sat[s1 + i + 1] + run; } } };
      const soften = (cj) => { for (let ci = 0; ci < LN - 1; ci++) { const o = cj * LN + ci;                                  // by 15 m cells: only where a caster stood over the cell or its neighbours
        if (hl[o] <= 0 && hl[o + 1] <= 0 && hl[o + LN] <= 0 && hl[o + LN + 1] <= 0) continue;
        for (let j = Math.round((cj + 0.5) * lc), je = Math.round((cj + 1.5) * lc); j < je; j++) { const tj = (j + 0.5) / lc - 0.5 - cj;
          for (let i = Math.round((ci + 0.5) * lc), ie = Math.round((ci + 1.5) * lc); i < ie; i++) { const ti = (i + 0.5) / lc - 0.5 - ci;
            const h = (hl[o] * (1 - ti) + hl[o + 1] * ti) * (1 - tj) + (hl[o + LN] * (1 - ti) + hl[o + LN + 1] * ti) * tj; if (h <= 0) continue;
            const k = Math.round((0.8 + 0.013 * h) / cell - 0.3), a0 = Math.max(0, i - k), a1 = Math.min(n, i + k + 1), b0 = Math.max(0, j - k), b1 = Math.min(n, j + k + 1);
            const sum = sat[b1 * W + a1] - sat[b0 * W + a1] - sat[b1 * W + a0] + sat[b0 * W + a0];
            if (sum > 0) shadeData[j * n + i] = Math.round(255 * (1 - 0.28 * Math.min(1, h / 500)) * sum / ((a1 - a0) * (b1 - b0))); } } } };
      for (const { g, far, closed } of list) { const P = g.getAttribute('position').array, I = g.index.array;
        for (let t = 0; t < I.length; t += 4500) { draw(P, I, t, Math.min(I.length, t + 4500), !!far, !!closed); await tick(); } }
      if (!any) return;
      spread(); await tick();
      for (let j = 0; j < n; j += 64) { sums(j, Math.min(n, j + 64)); await tick(); }
      for (let cj = 0; cj < LN - 1; cj++) { soften(cj); if (cj % 4 === 3) await tick(); }
    };
    const earthMat = glazeMaterial('EARTH', { gloss: 0 }); earthMat.name = 'glaze-LAND'; earthMat.fragmentShader = landFrag();
    // (the land's own material: the head's EARTH source with the world's lines, landFrag above, and no highlight: a level field seen from 300 m up drew its one hard point out into a pale streak toward the sun: the smear of review c2)
    const C3 = (a, k = 1) => new THREE.Color().setRGB(a[0] * k, a[1] * k, a[2] * k), orange = mix3(P.gold, P.tomato, 0.36), umb = mix3(P.soil, P.glaze, 0.3), olv = mix3(P.savoy, P.husk, 0.4);
    const landU = { uShade: { value: shadeTex }, uShadeBox: { value: new THREE.Vector3(SHB.x0, SHB.z0, 1 / SHB.size) }, uFade: FAR_FADE, uFadeB: { value: new THREE.Vector3(-360, -470, 150) }, uFadeC: { value: new THREE.Vector3(-20, -730, 300) },
      // the pools: each column's own foot on the land, 2.2 times its footprint (its light's soft skirt), drawn out along the sun's bearing; none with LIGHT_IN_AIR false
      uPool: { value: SHAFTS.map((sh) => new THREE.Vector4(sh.p[0], sh.p[2], 2.2 * sh.ra / SUN_DIR.y, 2.2 * sh.rb)) }, uPoolOn: { value: LIGHT_IN_AIR ? 1 : 0 },
      // the six crops, each a lit pigment and a second: red cabbage, lettuce, carrot (tops; shoulders), marigold (head; eye), leek, squash (fruit; vines)
      // (c12, W6) THE PLOT BOARD two steps toward umber and olive: the violet toward umber, the oranges, the lemon and the light greens toward olive, the straw paths toward umber
      uCropA: { value: [C3(mix3(mix3(P.violet, P.bloom, 0.12), umb, 0.3), 1.4), C3(mix3(P.lettuce, olv, 0.3), 1.08), C3(mix3(mix3(P.savoy, P.lettuce, 0.5), olv, 0.25), 1.2), C3(mix3(orange, olv, 0.3), 1.1), C3(mix3(mix3(P.bottle, P.bloom, 0.5), olv, 0.25), 1.25), C3(mix3(orange, olv, 0.3), 1.12)] },
      uCropB: { value: [C3(mix3(P.violet, umb, 0.3)), C3(P.savoy), C3(mix3(orange, olv, 0.3), 1.1), C3(mix3(P.lemon, olv, 0.3)), C3(mix3(P.savoy, P.bloom, 0.3), 1.2), C3(mix3(P.bottle, P.savoy, 0.35), 0.9)] },
      uStraw: { value: C3(mix3(mix3(P.copper, P.cream, 0.55), umb, 0.3), 1.05) }, uLandMean: { value: C3(mix3(mix3(P.savoy, P.bottle, 0.5), P.soil, 0.5), 0.8) }, uEd: { value: edition * 17.3 } };
    // (c13, F2) the land's own mean without its soil: each pigment by its counted share of the land (shots/harvest-in-profile/tmp/c13/land.mjs; cropA of the six kinds, cropB, straw),
    // first with the paths drawn, then with the paths gone by place
    landU.uLandOwn = { value: [[[0.0350, 0.0321, 0.0265, 0.0178, 0.0258, 0.0059], [0, 0, 0.0073, 0.0050, 0.0086, 0.1536], 0.0737], [[0.0430, 0.0400, 0.0329, 0.0222, 0.0317, 0.0071], [0, 0, 0.0092, 0.0063, 0.0106, 0.1843], 0]].map(([a, b, st]) => {
      const c = new THREE.Vector3(), add = (q, k) => { c.x += q.r * k; c.y += q.g * k; c.z += q.b * k; };
      a.forEach((k, i) => add(landU.uCropA.value[i], k)); b.forEach((k, i) => add(landU.uCropB.value[i], k)); add(landU.uStraw.value, st); return c; }) };
    Object.assign(earthMat.uniforms, landU);
    { const beds = [[P.savoy, mix3(P.violet, P.bloom, 0.14), P.bottle], [P.savoy, mix3(P.savoy, P.gold, 0.4), mix3(P.savoy, P.lettuce, 0.5)], [P.lettuce, mix3(P.beet, P.savoy, 0.3), mix3(P.lettuce, P.cream, 0.3)]][edition];
      for (const m of [hero.mats.earth, hero.mirror.children[2].material]) ['uBedA', 'uBedB', 'uBedC'].forEach((n, i) => { m.uniforms[n] = { value: new THREE.Color().setRGB(...beds[i]) }; }); }   // the bust's painted beds wear the edition's pigments: this build's own uniforms, so a second build changes nothing here
    // the garden's own two materials (the head's programs with the garden's uniforms: leaves sway and, seen against the
    // sun, glow; bodies keep a luminous shade) and the two of its doubles (true height, hardly stirred: crisp at the bank)
    const skinMat = glazeMaterial('SKIN', { garden: 1 }), leafMat = glazeMaterial('LEAF', { sway: 5, garden: 1 });
    const mirO = { dim: 0.9, ripple: 0.3, gloss: 0.2, cut: -1e6, garden: 1, sun: new THREE.Vector3(SUN_DIR.x, -SUN_DIR.y, SUN_DIR.z) }, mirSkin = glazeMaterial('SKIN', mirO), mirLeaf = glazeMaterial('LEAF', { ...mirO, sway: 5 });
    const bodies = [];                                      // footprints for the ground's baked contact shade
    const region = (cap, capL) => { const G = new Geo(cap); G.L = new Geo(capL); G.bounds = []; return G; };
    const finish = async (G, name, mirror, throwsShade, sm = skinMat) => {
      await bakeShade(G.X ? [G, G.L, G.X] : [G, G.L], G.bounds, SUN_DIR, tick, 600);
      for (const [geo, mat, mm, nm] of [[G, sm, mirSkin, 'skin'], [G.L, leafMat, mirLeaf, 'leaf'], [G.X, skinMat, null, 'fruit']]) {   // G.X: bodies of the region that are not doubled
        if (!geo || !geo.n) continue;
        const g = geo.toGeometry(); await tick(); g.computeBoundingSphere(); g.boundingSphere.radius += 10; await tick();
        const mesh = new THREE.Mesh(g, mat); mesh.name = name + '-' + nm; scene.add(mesh);
        if (LIGHT_IN_AIR && throwsShade && (throwsShade !== 'skin' || nm !== 'leaf')) casters.push({ g, closed: nm !== 'leaf' });
        if (mirror && mm) { const m2 = new THREE.Mesh(g, mm); m2.name = name + '-' + nm + '-mirror'; m2.scale.y = -1; scene.add(m2); }
        await tick();
      }
    };
    const pp = new THREE.Vector3(), pt = new THREE.Vector3();
    const along = (d, lat, o = [0, 0, 0]) => { path.posAtDist(d, pp); path.tangentAtDist(d, pt); const l = Math.hypot(pt.x, pt.z) || 1; o[0] = pp.x - pt.z / l * lat; o[2] = pp.z + pt.x / l * lat; o[1] = landY(o[0], o[2]); return o; };   // lat > 0: to the right of the line
    const lineDist = (x, y, z) => path.distanceTo(x, y, z);
    const tallOf = (kind, R) => (kind === 'wigwam' ? R * 4.4 : kind === 'kale' ? R * 2.6 : kind === 'chard' ? R * 2.9 : kind === 'squash' ? R * 0.6 : kind === 'courgette' ? R * 1.5 : R * 1.9) + (rare && (kind === 'kale' || kind === 'lettuce') ? 22 : 0);
    const colDist = (x, y, z, kind, R) => { const H = tallOf(kind, R); let m = 1e9; for (let h = 0; h <= H; h += 5) m = Math.min(m, lineDist(x, y + h, z)); return Math.min(m, lineDist(x, y + H, z)); };
    const detAt = (d) => (d < 34 ? 0.92 : d < 62 ? 0.66 : d < 120 ? 0.45 : 0.33) * (0.55 + 0.45 * q);
    const KINDS = [['savoy', 'kale', 'red'], ['squash', 'courgette', 'lettuce'], ['lettuce', 'chard', 'wigwam']][edition];
    const sizeOf = (kind, r) => kind === 'savoy' ? 6 + 1.5 * r : kind === 'red' ? 5.5 + 1.2 * r : kind === 'lettuce' ? 5.5 + 2 * r : kind === 'kale' ? 6.5 + 1.5 * r : kind === 'chard' ? 6.5 + 1.5 * r : kind === 'courgette' ? 9 + 2 * r : kind === 'squash' ? 9.5 + 1.5 * r : 6 + 1 * r;

    // ---- THE SAVOY ROW (leg a's first subject): the first savoy 14 across, 22 off the line; savoys on, heaped with a courgette
    // in flower and one of the edition's own kinds, each sunk into the next
    const A = region(Math.round(46000 * q + 9000), Math.round(64000 * q + 12000));
    const s0 = along(58, -24), firstSavoy = { c: [s0[0], s0[1] + 7 * 0.72, s0[2]], R: 7 };
    bodies.push(plant(A, P, Sp, 'savoy', s0[0], s0[1], s0[2], 7, 3.3, 1.9 * q, false)); await tick();
    bodies.push(plant(A, P, Sp, 'courgette', s0[0] + 13, s0[1], s0[2] - 7, 10, 5.1, q, false)); await tick();
    bodies.push(plant(A, P, Sp, 'red', s0[0] - 10.5, s0[1], s0[2] + 3.5, 6, 7.7, 1.3 * q, false)); await tick();   // a red cabbage pressed into the savoy (their rounds overlap by two metres: the brown seam)
    for (let i = 1; i <= 9; i++) {
      const side = i % 2 ? 1 : -1, d = 42 + i * 25, lat = side * (21 + 7 * hsh(i, 1)), o = i === 2 ? along(d - 4.2, lat - 5) : along(d, lat), R = 6 + 1.5 * hsh(i, 2), det = (i === 2 ? 1.3 : i < 4 ? 0.8 : 0.55) * q, k2 = i === 2 ? 'red' : i % 3 === 0 ? 'courgette' : KINDS[i % 3], k3 = i === 2 ? 'courgette' : KINDS[(i + 1) % 3];   // the second group on the left is a still life of three kinds on every seed: a savoy, a red cabbage pressed into it, a courgette in flower. FIX 15: this one savoy alone stands 4.2 m back along the line and 5 m further from it (6.5 m in all, the least that does it): at the still of 70 m the frame's left edge cut it, now it is wholly out there and whole in the frame at 0 and 35 m; its two neighbours keep their places (from the old d, lat)
      bodies.push(plant(A, P, Sp, 'savoy', o[0], o[1], o[2], R, i * 1.37 + 1, det, false));
      const o2 = along(d + 8, lat + side * (R + 3.5)); bodies.push(plant(A, P, Sp, k2, o2[0], o2[1], o2[2], sizeOf(k2, hsh(i, 3)), i * 2.9 + 4, det * 0.62, rare));
      const o3 = along(d - 8, lat + side * (R + 3)); bodies.push(plant(A, P, Sp, k3, o3[0], o3[1], o3[2], sizeOf(k3, hsh(i, 4)) * 0.85, i * 3.3 + 9, det * 0.6, rare));
      await tick();
    }
    // ---- THE WHEAT STOOKS: ten; the two of leg a's second subject stand 16 clear either side of the line
    const stookAt = [[268, 38, 0.85], [306, -39, 0.85], [112, -44, 0.5], [205, 66, 0.35], [236, 84, 0.35], [340, 76, 0.35], [372, -70, 0.3], [182, 112, 0.25], [300, 128, 0.25], [150, -56, 0.35]], stookTops = [];
    for (let i = 0; i < stookAt.length; i++) {
      const [d, lat, dt] = stookAt[i], o = along(d, lat); path.tangentAtDist(d, pt);
      const yaw = Math.atan2(pt.z, pt.x) + 0.5 * (hsh(i, 7) - 0.5) + (i > 1 ? hsh(i, 8) * 1.5 : 0);
      bodies.push(stook(A, P, o[0], o[1], o[2], yaw, i + 1, dt * q, 6 + (i % 3)));
      stookTops.push([o[0], o[1] + 30, o[2]]); await tick();
    }
    // ARRIVAL (ruling 9, part 4): all 720 straws are dealt as before and every second one is laid; a straw is the path's own
    // warm straw a step deeper and never the lightest thing beside the lit hearts
    { const strawC = mix3(P.copper, P.cream, 0.3).map((v) => v * STRAW_K), n = Math.round(720 * q);
      for (let i = 0; i < n; i++) { if (i & 1) { if (i % 150 === 149) await tick(); continue; } const d = 6 + (i + hsh(i, 1)) / n * 585, o = along(d, (hsh(i, 2) - 0.5) * 17), az = hsh(i, 3) * TAU; path.tangentAtDist(d, pt);
        const dir = [pt.x + 0.9 * Math.cos(az), 0.03, pt.z + 0.9 * Math.sin(az)];
        if (waterDepth(o[0], o[2]) > -6) continue;
        leaf(A, { L: 4 + 5 * hsh(i, 4), W: 0.16 + 0.14 * hsh(i, 5), nu: 1, nv: 2, M: leafFrame([o[0], o[1] + 0.3 + 0.3 * hsh(i, 6), o[2]], dir, [0, 1, 0]), width: (t) => 1 - 0.5 * t, curl: 0.08, c: mix3(strawC, P.gold.map((v) => v * STRAW_K), 0.5 * hsh(i, 7)), c1: mix3(strawC, P.cream.map((v) => v * STRAW_K), 0.25), pid: 0, mat: [0, 0.2, hsh(i, 8), 0], pat: [0, 0, 0, 0] }); } }
    await finish(A, 'row', false, 'skin');                    // (of the rows the bodies throw the shade: sheaves, hearts, fruit; their low leaves lie in it)
    // ---- THE BEAN NAVE (leg a's third subject): the line runs its length inside
    const B = region(Math.round(14000 * q + 6000), Math.round(52000 * q + 9000));
    { const N = MAP.nave, yN = landY((N.a[0] + N.b[0]) / 2, (N.a[1] + N.b[1]) / 2) - 0.5, f = await nave(B, P, Sp, N, yN, q, tick);
      for (let i = 0; i < 5; i++) bodies.push({ x: N.a[0] + (N.b[0] - N.a[0]) * i / 4, z: N.a[1] + (N.b[1] - N.a[1]) * i / 4, R: f.R, H: 30, soft: 0.5 }); }
    await finish(B, 'nave', false, true);
    const naveBox = (x, z, pad) => { const N = MAP.nave, dx = N.b[0] - N.a[0], dz = N.b[1] - N.a[1], L = Math.hypot(dx, dz), s = ((x - N.a[0]) * dx + (z - N.a[1]) * dz) / L, w = Math.abs((x - N.a[0]) * -dz + (z - N.a[1]) * dx) / L; return s > -pad && s < L + pad && w < N.w / 2 + 6 + pad; };
    // ---- THE DEAL: curved beds across the garden, three kinds to a bed, each sunk into the next; straw paths and soil between
    const D = region(Math.round(30000 * q + 9000), Math.round(60000 * q + 12000));
    const tooNear = (x, z, R) => { for (let i = 0; i < bodies.length; i++) { const b = bodies[i], m = (R + b.R) * (b.H > 20 ? 1.0 : 0.6); if ((x - b.x) * (x - b.x) + (z - b.z) * (z - b.z) < m * m) return true; } return false; };
    let dealt = 0, key = 100;
    for (let r = 0; r < 7; r++) {
      const z0 = -618 + r * 47 + 8 * dr(), ph = dr() * TAU, amp = 9 + 12 * dr(); let i = 0;
      for (let x = -648 + 14 * dr(); x < -92;) {
        const kind = (i % 7 === 6) ? 'squash' : KINDS[(r + (i >> 2)) % 3], R = sizeOf(kind, dr()), z = z0 + amp * Math.sin(x * 0.011 + ph), keep = dr(), y = landY(x, z); i++; key += 1.37;
        const d = colDist(x, y, z, kind, R), ok = waterDepth(x, z) < -12 && z > -628 && !naveBox(x, z, 9) && d > R * (kind === 'squash' ? 1.5 : 1) + 9 && !tooNear(x, z, R);
        if (ok && (d < 62 || keep < 0.1 * dens)) { bodies.push(plant(D, P, Sp, kind, x, y, z, R, key, detAt(d) * 0.58, rare)); dealt++; if (dealt % 3 === 0) await tick(); }
        x += R * (1.7 + 0.5 * dr());
      }
    }
    // the shoulders are ground: beds climb the north-west and north shoulder to about y 120 with no edge; under the line's
    // climb (the north-front quarter) only squash leaves lie flat
    for (let ring = 0; ring < 4; ring++) {
      const h = 20 + ring * 31;
      for (let a = -8; a <= 100; a += 15 - ring) {
        const az = (a + 6 * dr()) * Math.PI / 180, cx = -Math.sin(az), cz = -Math.cos(az); let lo = 20, hi = 260;      // az 0 = north, 90 = west
        for (let k = 0; k < 14; k++) { const mid = (lo + hi) / 2; if (bustHeight(-45 + cx * mid, cz * mid) > h) lo = mid; else hi = mid; }
        const x = -45 + cx * lo, z = cz * lo, y = bustHeight(x, z), front = a < 22, kind = front ? 'squash' : KINDS[(ring + Math.round(a / 15)) % 3], R = sizeOf(kind, dr()) * (front ? 1.05 : 1.15); key += 1.91;
        if (y < 12 || tooNear(x, z, R)) continue;
        const d = lineDist(x, y + R, z); if (d < R + 9) continue;
        bodies.push(plant(D, P, Sp, kind, x, y - 1, z, R, key, detAt(d) * 0.64, rare)); if (++dealt % 3 === 0) await tick();
      }
    }
    // THE BUST IS GARDEN, RIM TO NECK (the shoulders are ground, and no stranger can say where the garden stopped): squash leaves
    // 20 to 25 across lying on the slope, lapped like tiles, gold flowers the size of rooms and orange fruit between them, on
    // every face the sun or the line sees (north, east, south-east). The west goes into the dark under the kale, the edition's
    // heads (above) and the painted beds. Stations at every 15 m of slope. In the river the bust's double wears the painted beds.
    const Bu = region(7000, 17000);
    { const qs = []; let qv = 0.992, acc = 15; const hq = (v) => 204 * Math.pow(Math.max(0, 1 - v * v), 0.8);
      while (qv > 0.33) { if (acc >= 15) { qs.push(qv); acc = 0; } acc += Math.hypot(170 * 0.002, hq(qv - 0.002) - hq(qv)); qv -= 0.002; }
      const nr = [0, 1, 0], dn = [0, 0, 0]; let made = 0;
      for (let ring = 0; ring < qs.length; ring++) {
        const n = Math.max(8, Math.round(TAU * 168 * qs[ring] / 17));
        for (let i = 0; i < n; i++) {
          const th = (i + 0.5 * (ring % 2) + 0.4 * dr()) / n * TAU, c = Math.cos(th), sn = Math.sin(th), keep = dr(), k2 = dr(), a2 = dr() * TAU, kq = dr(); key += 0.73;
          if ((c < -0.3 && sn < 0.6) || (sn < -0.55 && keep < 0.5)) continue;                       // the west and half of the far south are left to the dark
          const r = (qs[ring] + 0.012 * (kq - 0.5)) / Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(sn), 2.6), 1 / 2.6), x = -45 + 125 * r * c, z = -215 * r * sn, y = bustHeight(x, z);
          if (y < 5 || tooNear(x, z, 5)) continue;
          const d = lineDist(x, y + 4, z); if (d < 16) continue;
          const gx = (bustHeight(x + 2, z) - bustHeight(x - 2, z)) / 4, gzz = (bustHeight(x, z + 2) - bustHeight(x, z - 2)) / 4, gl = Math.hypot(gx, 1, gzz); nr[0] = -gx / gl; nr[1] = 1 / gl; nr[2] = -gzz / gl;
          const R = 10 + 2.5 * k2, near = d < 95, kind = made % 11 === 5 ? 1 : made % 14 === 9 ? 2 : 0; made++;
          if (kind === 1) { openFlower(Bu, P, [x + nr[0] * 5, y + nr[1] * 5, z + nr[2] * 5], [nr[0] + 0.3 * Math.cos(a2), nr[1] + 0.2, nr[2] + 0.3 * Math.sin(a2)], 6.2, key, near ? 1 : 0.5); continue; }
          if (kind === 2) { gourdFruit(Bu, P, [x + nr[0] * 2, y - 2.5, z + nr[2] * 2], a2, 9.5, 6.2, key, near ? 0.8 : 0.3, 'squash'); continue; }
          // the leaf lies in the slope's own plane, pointing downhill and aside, tilted a little so each laps the next (its foot,
          // under the next leaf's lap, is painted in shade)
          let dx = Math.cos(a2) * 0.8 + nr[0] * 1.2, dz = Math.sin(a2) * 0.8 + nr[2] * 1.2; const dy = -(dx * nr[0] + dz * nr[2]) / nr[1], dl = Math.hypot(dx, dy, dz) || 1; dn[0] = dx / dl; dn[1] = dy / dl; dn[2] = dz / dl;
          const lift = 1.6 + 2.6 * kq, base = [x + nr[0] * lift - dn[0] * R, y + nr[1] * lift - dn[1] * R, z + nr[2] * lift - dn[2] * R];
          const cA = mix3(P.bottle, P.savoy, 0.35 + 0.55 * keep), cB = mix3(P.savoy, P.lettuce, 0.25 + 0.5 * k2), ky = key;
          leaf(Bu, { shape: 'squash', L: R * 2, W: R, nu: near ? 8 : 6, nv: near ? 3 : 2, M: leafFrame(base, [dn[0] + 0.16 * nr[0], dn[1] + 0.16 * nr[1], dn[2] + 0.16 * nr[2]], [nr[0] + 0.3 * (keep - 0.5), nr[1], nr[2] + 0.3 * (k2 - 0.5)]), width: heart, curl: -0.3 - 0.3 * kq, cup: 0.2, frill: [R * 0.15, 2.5], ph: ky, twist: 0.25 * (keep - 0.5), rib: R * 0.03, pid: 0,
            col: (v, sA, S) => { const cc = mix3(mix3(P.glaze, P.bottle, 0.5), mix3(mix3(cA, cB, 0.3 + 0.5 * vnz(sA * 2 + ky, v * 5)), P.lettuce, 0.3 * sst(0.6, 1, Math.abs(sA))), 0.35 + 0.65 * sst(0.02, 0.45, v)); S.r = cc[0]; S.g = cc[1]; S.b = cc[2]; }, mat: [0.32, 0.5, hsh(ky, 6), 9], pat: [0, R * 0.12, 0.55, 0.12] });
          if (made % 40 === 0) await tick();
        }
      } }
    await finish(Bu, 'bust', false);                        // its double is the bust's own painted beds (the hero's turned-over proxy)
    // the forecourt bed before the chest: low rows the sunflowers stand in
    for (let r = 0; r < 5; r++) for (let k = 0; k < 9; k++) {
      const x = 120 + r * 76 + 20 * dr(), z = -196 + k * 44 + 14 * dr(), flat = (r + k) % 3 !== 0, kind = flat ? 'squash' : KINDS[(r + k) % 3] === 'wigwam' ? 'lettuce' : KINDS[(r + k) % 3], R = flat ? 13 + 4 * dr() : sizeOf(kind, dr()) * 1.6, y = landY(x, z); key += 2.3;
      if (waterDepth(x, z) > -10 || tooNear(x, z, R * 0.8) || lineDist(x, y + R, z) < R + 12 || Math.hypot(x - 298, z + 201) < 44) continue;
      bodies.push(plant(D, P, Sp, kind, x, y - 0.5, z, R, key, 0.36 * (0.6 + 0.4 * q), rare)); if (++dealt % 3 === 0) await tick();
    }
    await finish(D, 'deal', false);
    // ---- THE ISLET IN THE REACH: the great pumpkin with its vine and flowers, doubled in the water all round it
    const C = region(Math.round(9000 * q + 6000), 9000);
    { const pc = MAP.pumpkin; bodies.push(pumpkin(C, P, Sp, pc, Math.max(1.5, landY(pc[0], pc[2])) - 1.5, 0.6 + 0.4 * q, landY)); await tick(); }
    await finish(C, 'bank', true, true);                          // the pumpkin, its vine and flowers, doubled at their true height in the reach
    // the long low rick, a stook and squash behind it (they stand back from the water and are not doubled), and the bank's edge
    // east of the spit, which the line follows over the water: squash and courgettes in flower along it
    const Nb = region(16000, 22000);
    { const rk = MAP.rick; bodies.push(rick(Nb, P, rk, landY(rk[0], rk[1]), -0.45)); await tick();
      bodies.push(stook(Nb, P, rk[0] + 22, landY(rk[0] + 22, rk[1] - 32), rk[1] - 32, 0.9, 41, 0.25 * q, 7)); await tick();   // (behind the rick, between it and the wall: it stood where the line now comes in over the bank)
      for (const [ox, oz, kk] of [[0, 70, 1], [38, 48, 2], [96, 10, 3], [142, 36, 4]]) { const x = rk[0] + ox, z = rk[1] + oz; bodies.push(plant(Nb, P, Sp, 'squash', x, landY(x, z), z, 12 + kk, 70 + kk * 1.7, 0.3, false)); } }
    for (let i = 0; i < 6; i++) { const x = 74 + i * 37 + 10 * hsh(i, 61), z = -650 - 16 * hsh(i, 62), y = landY(x, z), kind = i % 3 === 1 ? 'courgette' : 'squash', R = kind === 'squash' ? 12 + 2 * hsh(i, 63) : 10;
      if (waterDepth(x, z) > -9 || tooNear(x, z, R) || lineDist(x, y + R * 0.6, z) < R + 12) continue;
      bodies.push(plant(Nb, P, Sp, kind, x, y, z, R, 90 + i * 2.3, 0.6 * (0.6 + 0.4 * q), false)); await tick(); }
    // THE NEAR BANK WHERE THE LINE LEAVES IT (ruling 4, part 4): a heap of lit specimens on the garden's east shore, to the
    // left as the line comes out of the nave and looks to the pumpkin, 50 m and more from the line (no leaf is wider than a
    // fifth of the picture): broad squash leaves, a courgette in
    // flower and a stook, pressed together, doubled in the reach
    for (const [x, z, kind, R, kk] of [[-140, -522, 'squash', 12, 1], [-122, -547, 'courgette', 10.5, 2], [-128, -594, 'squash', 11, 3]]) { const y = landY(x, z);
      if (lineDist(x, y + R * 0.6, z) > R + 10) bodies.push(plant(Nb, P, Sp, kind, x, y, z, R, 120 + kk * 3.1, 0.45, false)); await tick(); }
    { const x = -131, z = -571; bodies.push(stook(Nb, P, x, landY(x, z), z, 0.4, 47, 0.18 * q, 6)); await tick(); }
    for (const [x, z, kk] of [[196, -668, 1], [262, -674, 2]]) { bodies.push(stook(Nb, P, x, landY(x, z), z, 0.3 + kk, 50 + kk, 0.16 * q, 6)); await tick(); }   // two stooks lit along the far bank, east of the rick
    await finish(Nb, 'bank-edge', true, true);                    // doubled like the pumpkin
    // THE RIVER'S EDGE IS A PLANTED BANK (the lead's review of c1): along every shore of the reach, the cove and the channel a
    // broad leaf every 20 m or so lies on the bank's lip and hangs over the water, and a few broad leaves lie afloat by the
    // banks; all are doubled, so the water carries a lit edge everywhere and never ends in a ruled dark line
    const Sh = region(16, 10500);
    const Rf = region(16, 11000);                           // the rafts of floating leaves: flat on the water, not doubled
    { const shoreLeaf = (x, z, dx, dz, R, k, afloat, raft) => { const y = afloat ? 0.3 + (raft ? 0.25 * hsh(k, 12) : 0) : Math.max(1.6, landY(x, z) + 0.8), det = lineDist(x, y, z) < 90 ? 0.6 : 0.25;
        leaf(raft ? Rf : Sh, { shape: 'squash', dome: afloat ? -0.09 : 0.04, L: R * 2, W: R, nu: det > 0.5 ? 8 : 6, nv: 2, M: leafFrame([x - dx * R * 0.5, y, z - dz * R * 0.5], [dx, afloat ? 0.0 : -0.05, dz], [0, 1, 0]), width: heart, curl: afloat ? 0.05 : -0.06 - 0.06 * hsh(k, 3), cup: afloat ? -0.05 : 0.16, frill: [R * (afloat ? 0.03 : 0.07), 2.5],   /* a lip leaf lies nearly level: no part of it goes under the water, so its double never stands up out of it */ ph: k, twist: afloat ? 0 : 0.2 * (hsh(k, 4) - 0.5), pid: 0,
          col: (v, sA, S) => { const c = mix3(mix3(P.bottle, P.savoy, (afloat ? 0.3 : 0.45) + 0.4 * vnz(sA * 2 + k, v * 5)), P.lettuce, (afloat ? 0.5 : 1) * (0.3 * sst(0.6, 1, Math.abs(sA)) + 0.14 * hsh(k, 5))); S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [afloat ? 0.2 : 0.34, afloat ? 0.1 : 0.5, hsh(k, 6), 9], pat: afloat ? [0, R * 0.075, 0.8, 0.1] : [0, R * 0.12, 0.5, 0.1] }); };   // (c12, W5) a leaf afloat: its rim lifted off the water, a deeper green, a smaller pale star at the stalk, deeper quilting and less gloss (the pond's lightest hundredth was half these leaves)
      // the shore is found by place: from a point of the water's outline as drawn on the map, the bank's lip along the outward normal
      const lip = (x, z, nx, nz, k) => { let lo = -45, hi = 45; if (waterDepth(x + nx * lo, z + nz * lo) < 0 || waterDepth(x + nx * hi, z + nz * hi) > 0) return;
        for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (waterDepth(x + nx * m, z + nz * m) > 0) lo = m; else hi = m; }
        const sx = x + nx * hi, sz2 = z + nz * hi, R = 9 + 4.5 * hsh(k, 1), a = 0.7 * (hsh(k, 2) - 0.5), dx = -(nx * Math.cos(a) - nz * Math.sin(a)), dz = -(nx * Math.sin(a) + nz * Math.cos(a));
        if (bustHeight(sx, sz2) > 1 || path.nearestXZ(sx, sz2).dist > 430) return;
        const Rl = Math.min(R, 0.2 * lineDist(sx + nx * 3, 3, sz2 + nz * 3));   // no leaf wider than a fifth of the picture as the line passes it (twice its half width under 0.43 of its distance)
        if (Rl >= 4.5) shoreLeaf(sx + nx * (2 + 3 * hsh(k, 7)), sz2 + nz * (2 + 3 * hsh(k, 7)), dx, dz, Rl, k, false);
        if (hsh(k, 8) < 0.3) { const fx = sx - nx * (10 + 16 * hsh(k, 9)), fz = sz2 - nz * (10 + 16 * hsh(k, 9)); if (waterDepth(fx, fz) > 3 && lineDist(fx, 2, fz) > 14) shoreLeaf(fx, fz, Math.cos(k * 2.4), Math.sin(k * 2.4), 6.5 + 3 * hsh(k, 10), k + 0.5, true); } };
      let k = 0;
      for (let x = -70; x <= 530; x += 30) { lip(x + 6 * hsh(k, 11), -624, 0, -1, ++k); lip(x + 6 * hsh(k, 11), -244, 0, 1, ++k); }      // the reach's north and south shores
      for (let z = -610; z <= -256; z += 30) { lip(-84, z + 6 * hsh(k, 11), -1, 0, ++k); if (z < -330) lip(540, z, 1, 0, ++k); }               // its west shore (the garden's edge) and the east point
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.2; lip(MAP.cove[0] + Math.cos(a) * 40, MAP.cove[1] + Math.sin(a) * 40, Math.cos(a), Math.sin(a), ++k); }   // the cove
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.1; lip(MAP.pumpkin[0] + Math.cos(a) * MAP.islet, MAP.pumpkin[2] + Math.sin(a) * MAP.islet, -Math.cos(a), -Math.sin(a), ++k); }   // the islet's rim
      for (let x = -640; x <= -60; x += 30) { lip(x, -636, 0, 1, ++k); }
      for (let i = 0; i < 18; i++) { const fx = -76 + 62 * hsh(i, 71), fz = -604 + 170 * hsh(i, 72); if (waterDepth(fx, fz) > 3) shoreLeaf(fx, fz, Math.cos(i * 2.4), Math.sin(i * 2.4), 5.5 + 3.5 * hsh(i, 73), 200 + i, true); }   // broad leaves afloat off the garden's bank, under and beside the line as it leaves the nave (ruling 4, part 4)
      for (let z = -226; z <= 330; z += 30) { lip(500, z + 6 * hsh(k, 11), -1, 0, ++k); lip(705, z + 6 * hsh(k, 11), 1, 0, ++k); }   // the bend south round the bust's front, under the sunflowers
      await tick();
      // RAFTS OF BROAD FLOATING LEAVES (ruling 5, part 4): a raft is a handful of leaves lapped like tiles about its middle.
      // They cover a third of the reach between the nave's mouth and the islet, and lie off every bank the line sees: the
      // reach's two long shores, the islet's rim, both shores of the bend before the bust. No leaf wider than a fifth of
      // the picture as the line passes over it.
      const raft = (cx, cz, n, spread, R0, kk) => { for (let i = 0; i < n; i++) { const a = i * 2.39996 + kk, r = spread * Math.sqrt((i + 0.5) / n), x = cx + r * Math.cos(a), z = cz + r * Math.sin(a);
        if (waterDepth(x, z) < 4) continue; const R = Math.min(R0 * (0.7 + 0.5 * hsh(i, kk)), 0.2 * lineDist(x, 1, z)); if (R >= 3) shoreLeaf(x, z, Math.cos(a * 1.7 + kk), Math.sin(a * 1.7 + kk), R, kk * 13 + i, true, true); } };
      for (let i = 0; i < 12; i++) raft(-66 + 86 * hsh(i, 81) + (i % 3) * 6, -606 + 172 * ((i + 0.5) / 12) + 10 * (hsh(i, 82) - 0.5), 6, 14 + 4 * hsh(i, 83), 7.2, 300 + i);
      await tick();
      for (let x = -40, i = 0; x <= 520; x += 62, i++) { raft(x + 20 * hsh(i, 84), -606 + 8 * hsh(i, 85), 3, 9, 6.5, 400 + i); raft(x + 20 * hsh(i, 86), -264 - 8 * hsh(i, 87), 4, 11, 7.5, 440 + i); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.5; raft(MAP.pumpkin[0] + Math.cos(a) * (MAP.islet + 20), MAP.pumpkin[2] + Math.sin(a) * (MAP.islet + 20), 3, 9, 6.5, 480 + i); }
      for (let z = -200, i = 0; z <= 330; z += 66, i++) { raft(520 + 6 * hsh(i, 88), z, 4, 11, 8, 500 + i); raft(686 - 6 * hsh(i, 89), z + 30, 4, 11, 8, 520 + i); }
      await tick(); }
    await finish(Rf, 'rafts', false);
    await finish(Sh, 'shore', true);
    // ---- THE MUSCAT VINE on its poles at the forecourt's north shore
    const Vg = region(9000, 5000), vineOut = { bunches: [], split: null };
    Vg.X = new Geo(Math.round(22000 * q + 5000)); Vg.X.bounds = Vg.bounds;
    { const vm = MAP.vine; bodies.push(await vine(Vg, P, vm, landY((vm.a[0] + vm.b[0]) / 2, (vm.a[1] + vm.b[1]) / 2), 0.7 + 0.3 * q, tick, vineOut)); }
    await finish(Vg, 'vine', true, true);                         // poles, rope and leaves are doubled; the grapes (Vg.X) are not
    // ---- THE THREE GIANT SUNFLOWERS in the forecourt before the face, doubled in the water
    const S = region(3500, 9000), heads = [];
    for (let i = 0; i < 3; i++) { const [x, z, H, Dh, turn] = MAP.sunflowers[i]; bodies.push(sunflower(S, P, x, landY(x, z), z, H - landY(x, z), Dh, i * 4.7 + 2, (i === 0 ? 1.2 : 0.9) * (0.6 + 0.4 * q), heads, turn, false, i === 0 ? 0 : 0.5)); await tick(); }
    await finish(S, 'sunflowers', true, true);
    // ---- A FOURTH SUNFLOWER on the west bank (c12, W2), a block of its own: by place, off the line, its face turned to the sun's side
    const WEST_FLOWER = [-162, -520, 130, 55, 55];          // x, z, its height over the land, its head across, the bearing of its face
    { const S4 = region(1200, 3200), [x, z, H, Dh, turn] = WEST_FLOWER; bodies.push(sunflower(S4, P, x, landY(x, z), z, H, Dh, 21.3, 0.9 * (0.6 + 0.4 * q), [], turn)); await tick();
      await finish(S4, 'sunflower-west', false, true); }

    // ---- THINGS OF THE LAND INSIDE THE WALL (ruling 5, part 5; ruling 7, part 3): the far specimens that stand in the garden
    // itself, south and west of the head, stay; those that stood where the belt now stands or beyond it are retired with the
    // far land's simpler forms (the land is lost into the ground's value at the belt).
    const Fs = region(6000, 6000);
    { const bx = 0.94, bz = -0.34;   // the beds run along (0.94, -0.34)
      const okAt = (x, z) => waterDepth(x, z) < -30 && bustHeight(x, z) < 1 && Math.hypot(x, z) < 690 && path.nearestXZ(x, z).dist > 170 && !(x > -680 && x < -60 && z > -660 && z < -280);
      // THE FAR THINGS ARE SPECIMENS: thirty-odd, by place (the same on every seed), each from the garden's own maker at the
      // detail its size on the screen can show, standing or lying low on the land 300 to 1,150 m from the head: groups of
      // stooks (tents of sheaves, banded at the waist, a fringe of ears), ribbed melons and marrows with stalk and leaf, a
      // banded rick, two rows of bean frames (crossed poles hung with leaves), cabbages, a row of small sunflowers. Each
      // is lit on its sunward side and throws its own shade on the land. None over 90 m, none stacked.
      let fk = 0;
      for (const [gx, gz] of [[300, 430], [-330, 470], [860, -120], [-560, 150]]) for (let i = 0; i < 3; i++) { const a = i * 2.1 + gx, x = gx + 34 * Math.cos(a) * (i ? 1 : 0), z = gz + 34 * Math.sin(a) * (i ? 1 : 0);
        if (okAt(x, z)) { stook(Fs, P, x, landY(x, z), z, a * 1.3, 60 + (++fk), 0.1, 4, true); await tick(); } }
      const gourd = (x, z, L, R, yaw, k, melon) => { const y = landY(x, z), cy = Math.cos(yaw), sy = Math.sin(yaw);
        lathe(Fs, { L, R, nu: melon ? 16 : 12, nv: 7, ease: 1, M: T4(TRm(x, y + R * 0.8, z), RYm(yaw), RZm(Math.PI / 2 - 0.05)), mat: [0.5, 0, hsh(k, 1), 0], pat: [0.1, 0, 0, 0.15],
          prof: melon ? (t) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1))) : (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01))), 0.4) * (0.78 + 0.22 * t), sect: (th) => 1 + (melon ? 0.07 : 0.05) * Math.cos(th * (melon ? 8 : 6) + k),
          col: (t, th, S) => { const c = melon ? mix3(mix3(P.muscat, P.lettuce, 0.4 + 0.3 * vnz(th * 3 + k, t * 5)), P.savoy, 0.45 * (0.5 + 0.5 * Math.cos(th * 8 + k))) : mix3(mix3(P.savoy, P.bottle, 0.5 + 0.5 * Math.cos(th * 6 + k)), P.lettuce, 0.3 * vnz(th * 5 + k, t * 9)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
        const ex = x - cy * L * 0.5, ez = z + sy * L * 0.5;                    // the stalk's end, and one broad leaf on the ground by it
        pole(Fs, { soil: P.savoy, copper: P.bottle, glaze: P.glaze }, [ex + cy * 2, y + R * 0.8, ez - sy * 2], [ex - cy * 9, y + R * 0.5, ez + sy * 9], 2, k, 5);
        leaf(Fs, { L: R * 1.7, W: R * 0.85, nu: 3, nv: 5, M: leafFrame([ex - cy * 9, y + R * 0.45, ez + sy * 9], [-cy * 0.8 + sy * 0.4, 0.15, sy * 0.8 + cy * 0.4], [0, 1, 0]), width: heart, curl: -0.25, cup: 0.15, frill: [R * 0.1, 2.5], ph: k, c: mix3(P.bottle, P.savoy, 0.6), c1: mix3(P.savoy, P.lettuce, 0.5), mat: [0.3, 0.5, hsh(k, 6), 0], pat: [0, R * 0.1, 0.5, 0] }); };
      for (const [x, z, L, R, yaw, melon] of [[120, 560, 78, 15, 0.4, 0], [-150, 640, 50, 25, 1.1, 1], [-640, 330, 70, 14, 2.0, 0], [800, 180, 46, 23, 0.3, 1], [880, -330, 76, 15, 2.6, 0], [-760, -40, 44, 22, 0.8, 1]]) if (okAt(x, z)) gourd(x, z, L, R, yaw, x * 0.01 + z * 0.02, !!melon);
      await tick();
      if (okAt(470, 560)) rick(Fs, P, [470, 560], landY(470, 560), 0.5, 0.45);
      for (const [gx, gz] of [[-250, 330], [830, 60]]) for (let i = 0; i < 6; i++) { const x = gx + bx * (i - 2.5) * 30, z = gz + bz * (i - 2.5) * 30; if (!okAt(x, z)) continue; const y = landY(x, z), k = gx + i * 1.7;   // bean frames: two poles crossed near the top, leaves down both
        for (const sd of [-1, 1]) { const f = [x - bz * sd * 13, y - 0.5, z + bx * sd * 13], t = [x + bz * sd * 4, y + 52, z - bx * sd * 4]; pole(Fs, P, f, t, 1.3, k + sd, 4);
          for (let j = 0; j < 4; j++) { const h = (j + 0.6) / 4.4, az = hsh(k + sd, j) * TAU, Ll = 15 + 6 * hsh(j, k);
            leaf(Fs, { L: Ll, W: Ll * 0.45, nu: 1, nv: 3, M: leafFrame([f[0] + (t[0] - f[0]) * h, f[1] + (t[1] - f[1]) * h, f[2] + (t[2] - f[2]) * h], [Math.cos(az), -0.3, Math.sin(az)], [0, 1, 0]), width: heart, curl: -0.5, cup: 0.2, c: mix3(P.savoy, P.lettuce, 0.3 + 0.5 * hsh(j, k)), c1: P.lettuce, mat: [0.3, 0.6, hsh(j, k), 0], pat: [0, 2, 0.4, 0] }); } } }
      await tick();
      for (const [x, z, R, kind] of [[60, 420, 26, 'savoy'], [-480, 600, 30, 'red'], [940, 330, 28, 'savoy']]) if (okAt(x, z)) { plant(Fs, P, Sp, kind, x, landY(x, z), z, R, x * 0.013 + z * 0.007, 0.5, false); await tick(); }
      { const hs = []; for (let i = 0; i < 5; i++) { const x = -380 + bx * (i - 2) * 46, z = 620 + bz * (i - 2) * 46; if (okAt(x, z)) sunflower(Fs, P, x, landY(x, z), z, 74 + 14 * hsh(i, 91), 26, 30 + i * 3.1, 0.25, hs, 62 + 20 * hsh(i, 92), true); } }
      await tick();
      // the far things sink by the land's own measure (the same programs as every garden body, their own fade)
      const farMat = glazeMaterial('SKIN', { garden: 1 }), farLeaf = glazeMaterial('LEAF', { sway: 5, garden: 1 }); farMat.uniforms.uFade = farLeaf.uniforms.uFade = FAR_FADE;   // (ruling 9: the land's own figures, 500 and 2,300 m)
      await bakeShade([Fs, Fs.L], Fs.bounds, SUN_DIR, tick, 600);
      for (const [geo, mat, nm] of [[Fs, farMat, 'far-things-skin'], [Fs.L, farLeaf, 'far-things-leaf']]) { const g = geo.toGeometry(); await tick(); const mesh = new THREE.Mesh(g, mat); mesh.name = nm; mesh.frustumCulled = false; scene.add(mesh); if (LIGHT_IN_AIR) casters.push({ g, far: true }); await tick(); } }

    // ---- THE FAR BELT (ruling 7, part 3; BELT and BELT_TREES above): the garden's far wall and its great fruit trees, part of
    // the land, lit by the one sun, their shade on the land by the head's own law. The crowns stir by the world's clock (the
    // garden's own program with a sway of its own); wall, trunks and espaliers stand still.
    const Bw = region(6500, 3200), Bc = region(11000, 2000), beltOut = { bodies: [], esp: [] };
    { // no crown mass of a near tree stands in the look from the far view's stretch of the line (from the wall's crossing round
      // the turn to the reach) at the head (its outline from the north, crown to shoulders): by place, on the line's own samples.
      // THE FAR VIEW (ruling 9, part 6): nor does any stand within 6 degrees of the sight line from those samples (each 10 m
      // of the line) to farAt's place, (0, 215, 0), the point the long look holds there; a mass that fails is held back by the
      // same rule, the same on every seed (as built none does: the nearest belt triangle is 19.5 degrees off that line)
      const i0 = Math.round(uAt(7, 39, -719) * 700), i1 = Math.round(uAt(-40, 82, -628) * 700);
      const coneK = 6 * Math.PI / 180;
      const clearOfLook = (cx, cy, cz, r) => { for (let i = i0; i <= i1; i += 2) { const ox = PS[i * 3], oy = PS[i * 3 + 1], oz = PS[i * 3 + 2];
        { const tx = -ox, ty = 215 - oy, tz = -oz, tl = Math.hypot(tx, ty, tz), qx = cx - ox, qy = cy - oy, qz = cz - oz, ql = Math.hypot(qx, qy, qz);
          if (ql <= r) return false; if (ql < tl + r && Math.acos(clamp((qx * tx + qy * ty + qz * tz) / (ql * tl), -1, 1)) - Math.asin(r / ql) < coneK) return false; }
        for (const hx of [-120, -40, 40, 150]) for (const hy of [150, 270, 390, 500]) { const dx = hx - ox, dy = hy - oy, dz = -oz, t = clamp(((cx - ox) * dx + (cy - oy) * dy + (cz - oz) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1), ex = ox + dx * t - cx, ey = oy + dy * t - cy, ez = oz + dz * t - cz;
          if (ex * ex + ey * ey + ez * ez < r * r) return false; } } return true; };
      for (const st of beltSteps(Bw, Bc, P, q, lineDist, clearOfLook, beltOut)) { st(); await tick(); }
      for (const b of beltOut.bodies) bodies.push(b); }
    await finish(Bw, 'belt', false, true);
    await finish(Bc, 'belt-crowns', false, true, glazeMaterial('SKIN', { garden: 1, sway: 2 }));

    // ---- THE GROUND: furrowed soil and straw paths (the hero's EARTH glaze), banks about 7 above the river; cut away under the
    // water so the turned-over proxies show through the river's sheet. A soft contact shade is baked under each garden body.
    const stops = (a, b, pts) => { const o = []; for (let i = 0; i < pts.length - 1; i++) { const [x0, st] = pts[i], x1 = pts[i + 1][0]; for (let x = x0; x < x1 - 1e-3; x += st) o.push(x); } o.push(pts[pts.length - 1][0]); return o; };
    const xs = stops(0, 0, [[-2700, 300], [-1500, 200], [-900, 60], [-720, 12], [-36, 22], [558, 55], [778, 180], [1498, 300], [2698, 0]]), zs = stops(0, 0, [[-2700, 300], [-1500, 200], [-900, 60], [-720, 12], [-420, 20], [260, 60], [620, 168], [1460, 310], [2700, 0]]);   // the land runs on for 2.7 kilometres every way and is lost by place before its edge
    const E = new Geo(xs.length * (zs.length + 10) + 16); E.bounds = [];
    const straw = mix3(P.copper, P.cream, 0.42).map((v) => v * 0.08), soilD = mix3(P.soil, P.glaze, 0.3), sx = SUN_DIR.x / SUN_DIR.y, sz = SUN_DIR.z / SUN_DIR.y;
    const iRows = Math.round(640 / path.length * 700), rowDist = (x, z) => { let m = 1e18; for (let i = 0; i <= iRows; i++) { const ax = PS[i * 3] - x, az = PS[i * 3 + 2] - z, d = ax * ax + az * az; if (d < m) m = d; } return Math.sqrt(m); };   // how far a place lies from the line's way through the rows, the nave and out to the islet
    const onP = new Float32Array(E.cap), offP = new Float32Array(E.cap); let nP = 0;      // how much each ground vertex is path and how far it lies from the line, kept for the furrows and the painted beds (vertices are made in order)
    for (let z0 = 0; z0 < zs.length - 1; z0 += 12) { const z1 = Math.min(zs.length - 1, z0 + 12);          // in strips, a yield between
    surf(E, { nu: z1 - z0, nv: xs.length - 1, wrap: false, mat: [0.05, 0, 0.3, 0], pat: [0.3, 0, 0, 0], pid: 0, f: (u, v, Sv) => {
      const x = xs[Math.round(v * (xs.length - 1))], z = zs[z0 + Math.round(u * (z1 - z0))], bh = bustHeight(x, z), y = bh > 2 ? Math.min(bankY(x, z), bh - 6) : bankY(x, z);
      Sv.x = x; Sv.y = y; Sv.z = z; const bed = x * 0.34 + z * 0.94 + 14 * Math.sin(x * 0.011); Sv.a = bed; Sv.b2 = x * 0.94 - z * 0.34;
      const pd = path.nearestXZ(x, z), rd = rowDist(x, z), onPath = sst(11, 3, pd.dist) * sst(40, 24, pd.y - y) * sst(70, 40, rd); offP[nP] = rd; onP[nP++] = onPath;   // the straw path lies under the line through the rows and the nave only
      const nb = sst(-600, -640, z) * sst(-980, -860, z) * sst(-200, -100, x) * sst(600, 440, x);   // the north bank's strip, a little more copper
      let c = mix3(mix3(mix3(P.soil, soilD, vnz(x * 0.013, z * 0.013 + 4)), P.copper, 0.12 * vnz(x * 0.04 + 9, z * 0.04) + 0.1 * nb), straw, Math.min(0.45, onPath * sst(-2, 3, y)) * (0.55 + 0.45 * vnz(x * 0.09, z * 0.09)));
      c = mix3(c, P.copper, 0.1); Sv.r = c[0] * 1.2; Sv.g = c[1] * 1.2; Sv.b = c[2] * 1.2; } });   // LIT LAND (ruling 4, part 3): the soil a warm brown, a clear step brighter
    await tick(); }
    {                                                        // furrows where beds are; shade under bodies; drop the quads under water
      const nB = bodies.length, BX = new Float64Array(nB), BZ = new Float64Array(nB), BR = new Float64Array(nB), BS = new Float64Array(nB);
      const CW = 24, cx0 = -2760, nC = 230, cells = []; for (let c = 0; c < nC; c++) cells.push([]);      // the bodies by strips of x, so that a vertex asks only those that can reach it
      for (let b = 0; b < nB; b++) { const B2 = bodies[b], hh = Math.min(B2.H, 60) * 0.45; BX[b] = B2.x - sx * hh; BZ[b] = B2.z - sz * hh; BR[b] = B2.R * 1.25 + hh * 0.25; BS[b] = B2.soft || 0.85;
        for (let c = Math.max(0, Math.floor((BX[b] - BR[b] - cx0) / CW)), c1 = Math.min(nC - 1, Math.floor((BX[b] + BR[b] - cx0) / CW)); c <= c1; c++) cells[c].push(b); }
      const vertShade = (k0, k1) => { for (let k = k0; k < k1; k++) { const x = E.pos[k * 3], y = E.pos[k * 3 + 1], z = E.pos[k * 3 + 2];
        const garden = sst(-4, 4, y) * (1 - 0.6 * onP[k]); E.pat[k * 4 + 1] = 1.25 * garden;
        E.mat[k * 4 + 1] = sst(0.5, 4, y) * 0.94 * sst(55, 115, offP[k]) * (bustHeight(x, z) > 2 ? 0 : 1);   // the plots: all the land beyond the dealt plants of the rows (over 55 m from the line's first 640 m), in every direction, to where it is lost
        let sh = 1; const near = cells[Math.min(nC - 1, Math.max(0, Math.floor((x - cx0) / CW)))]; for (let q = 0; q < near.length; q++) { const b = near[q], dx = x - BX[b], rr = BR[b]; if (dx > rr || dx < -rr) continue; const dz = z - BZ[b], d2 = (dx * dx + dz * dz) / (rr * rr); if (d2 < 1) sh = Math.min(sh, 1 - (1 - d2) * (1 - d2) * BS[b]); }
        E.shade[k * 3] = sh; E.shade[k * 3 + 1] = 0.75 + 0.25 * sh; E.shade[k * 3 + 2] = 0; } };
      for (let k = 0; k < E.n; k += 400) { vertShade(k, Math.min(E.n, k + 400)); await tick(); }   // (a plain function a slice at a time: a long loop written inside an async function runs unoptimised)
      let w = 0; for (let r = 0; r < E.ni; r += 6) { let wet = true; for (let c = 0; c < 6; c++) if (E.pos[E.idx[r + c] * 3 + 1] > -1.2) wet = false; if (!wet) { for (let c = 0; c < 6; c++) E.idx[w + c] = E.idx[r + c]; w += 6; } }
      E.ni = w; }
    await tick();
    if (LIGHT_IN_AIR) await castShade([{ g: hero.meshes.skin.geometry, closed: true }, { g: hero.meshes.leaf.geometry }, { g: hero.meshes.earth.geometry }, ...casters]);
    shadeTex.needsUpdate = true;
    const ground = new THREE.Mesh(E.toGeometry(), earthMat); ground.name = 'ground'; ground.frustumCulled = false; scene.add(ground); await tick();
    // THE BANK'S DOUBLE: the ground's own quads within 90 m of the water, turned over about the river's level at their true
    // height (the same vertices, an index of their own), so the river carries the lit bank along its whole edge
    { const idx = []; for (let r = 0; r < E.ni; r += 6) { let nearW = false; for (let c = 0; c < 6 && !nearW; c++) { const k = E.idx[r + c] * 3; nearW = waterDepth(E.pos[k], E.pos[k + 2]) > -90 && Math.hypot(E.pos[k], E.pos[k + 2]) < 1100; } if (nearW) for (let c = 0; c < 6; c++) idx.push(E.idx[r + c]); }
      const gm = new THREE.BufferGeometry(); for (const n of ['position', 'normal', 'color', 'aUv', 'aMat', 'aPat', 'aShade']) gm.setAttribute(n, ground.geometry.getAttribute(n)); gm.setIndex(idx);
      const mm = glazeMaterial('EARTH', { dim: 0.9, ripple: 0.3, gloss: 0, cut: -1e6, top: -0.03, sun: new THREE.Vector3(SUN_DIR.x, -SUN_DIR.y, SUN_DIR.z) });
      mm.fragmentShader = earthMat.fragmentShader; Object.assign(mm.uniforms, landU);   // the bank's double wears the land's own plots
      const m2 = new THREE.Mesh(gm, mm); m2.name = 'ground-mirror'; m2.scale.y = -1; m2.frustumCulled = false; scene.add(m2); await tick(); }
    const waterMat = new THREE.ShaderMaterial({ name: 'river', vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false,
      uniforms: { uTex: STYLE.uTex, uOrigin: STYLE.uOrigin, uFade: FAR_FADE, uTime: STYLE.uTime, uG0: STYLE.uG0, uG1: STYLE.uG1, uG2: STYLE.uG2,
        uIslet: { value: new THREE.Vector2(MAP.pumpkin[0], MAP.pumpkin[2]) }, uIsletR: { value: MAP.islet }, uPool: { value: new THREE.Vector3(SHAFTS[1].p[0], SHAFTS[1].p[2], SHAFTS[1].ra * 1.25) }, uGlint: { value: LIGHT_IN_AIR ? 1 : 0 },
        uWater: { value: new THREE.Color('#26301C') }, uWater2: { value: new THREE.Color('#2F3A20') } } });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(6400, 6400, 1, 1).rotateX(-Math.PI / 2), waterMat); water.name = 'river'; water.frustumCulled = false; water.renderOrder = 2; scene.add(water);
    await tick();

    // ---- LIGHT IN THE AIR (ruling 4, part 2; ruling 5, part 1): the shafts, one mesh, built here and on screen from the
    // first frame (their motes are made below, once the head's tests exist); with LIGHT_IN_AIR false neither exists
    if (LIGHT_IN_AIR && SHAFTS_DRAWN) {
      const N = 24, e1 = new THREE.Vector3(-SUN_DIR.z, 0, SUN_DIR.x).normalize(), e2 = new THREE.Vector3().crossVectors(SUN_DIR, e1), v = new THREE.Vector3();
      const pos = [], aP = [], aR = [], aK = [], idx = [];
      const put = (s, x, y, z) => { pos.push(x, y, z); aP.push(s.p[0], s.p[1], s.p[2]); aR.push(s.ra, s.rb, s.full, s.end); aK.push(s.k); };
      for (const s of SHAFTS) {                              // a closed slanted elliptic cylinder from the pool's level to where its dust is lost
        const b0 = pos.length / 3;
        for (const lvl of [0.6, s.end + 4]) for (let i = 0; i < N; i++) { const a = i / N * TAU; v.set(s.p[0], s.p[1], s.p[2]).addScaledVector(e1, s.ra * Math.cos(a)).addScaledVector(e2, s.rb * Math.sin(a)); v.addScaledVector(SUN_DIR, (s.p[1] + lvl - v.y) / SUN_DIR.y); put(s, v.x, v.y, v.z); }
        put(s, s.p[0] + SUN_DIR.x * 0.6 / SUN_DIR.y, s.p[1] + 0.6, s.p[2] + SUN_DIR.z * 0.6 / SUN_DIR.y); put(s, s.p[0] + SUN_DIR.x * (s.end + 4) / SUN_DIR.y, s.p[1] + s.end + 4, s.p[2] + SUN_DIR.z * (s.end + 4) / SUN_DIR.y);
        for (let i = 0; i < N; i++) { const a = b0 + i, b = b0 + (i + 1) % N, c = a + N, d = b + N; idx.push(a, b, c, b, d, c, b0 + 2 * N, b, a, b0 + 2 * N + 1, c, d); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 1)); g.setIndex(idx);
      const shafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'shafts', vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: { uSun: STYLE.uSun, uG0: STYLE.uG0, uG1: STYLE.uG1, uG2: STYLE.uG2, uCol: { value: new THREE.Color(SHAFT_TOP) } } }));
      shafts.name = 'shafts'; shafts.frustumCulled = false; shafts.renderOrder = 3; scene.add(shafts); await tick();
    }
    // ---- CREATURES: few and placed, each on a closed course by place and the world's clock; none crosses the line
    // (stand-off 2.0 plus its whole sweep, pushed out at build wherever a station would be nearer)
    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const standOff = (c, need) => { let best = 1e9, bu = 0; for (let i = 0; i <= 700; i++) { const ax = PS[i * 3] - c[0], ay = PS[i * 3 + 1] - c[1], az = PS[i * 3 + 2] - c[2], d = ax * ax + ay * ay + az * az; if (d < best) { best = d; bu = i / 700; } }
      best = Math.sqrt(best); if (best < need) { path.pointAt(bu, pp); const k = (need - best) / Math.max(best, 1e-3); c[0] += (c[0] - pp.x) * k; c[1] += (c[1] - pp.y) * k + (best < 1e-2 ? need : 0); c[2] += (c[2] - pp.z) * k; } return c; };
    const loop = (c, r, w, o = {}) => ({ c: standOff(c, 2 + r + (o.bob || 0) + (o.span || 0) / 2 + 1), r, e: o.e || 0.7, w, ph: dr() * TAU, tilt: dr() * TAU, bob: o.bob || 0, s: o.s || 1 });
    const flyLeaf = (flap) => glazeMaterial('LEAF', { flap });
    // THE LOOKS. Five (c12), none stacked from 1,270 m on (each rises as the one before lets go), each begun and ended at a place of the world (uAt).
    const lookAt = new THREE.Vector3(), lookAt2 = new THREE.Vector3(), lookAt3 = new THREE.Vector3();
    const uNave = uAt(MAP.nave.b[0], 24, MAP.nave.b[1]) - 0.012, uPumpkin = uAt(MAP.arcB.c[0] + 5, 27, MAP.arcB.c[1] - MAP.arcB.r) /* the arc's north point: there its look lets go */, uArcEnd = uAt(MAP.arcB.c[0] + MAP.arcB.r * 0.95, 29, MAP.arcB.c[1] - MAP.arcB.r * 0.31), uVine0 = uAt(238, 68, -392), uVine = uAt(290, 107, -314) + 0.004, uVineA = uAt(290, 118, -284), uVineB = uAt(248, 136, -205);
    // THE PICTURES OF THE HEAD (ruling 7, part 5; c11, D1 to D4), the one head look's point a place of the head or of the land:
    // vineHeadAt, a place in the air between the grapes and the face (the vine with the head), then headAt, the middle of the
    // face. THE MIDDLE: round the pergola's south side (c12, W1 and F3: from the turn's start, 1,300 m, to its south point, 1,399 m) the point swings to
    // rackAt, a place of the air far to the south and high: from under the rack's east end the gaze is 36 degrees up and
    // looks back over the sunflowers' stems and lit leaves (left) to the grapes of the rack's east end (upper right), whose
    // poles no longer cross the picture as bars (the head is let go there; held 1,399 to 1,520 m, back by 1,640 m). Then
    // backAt, a place of the head's axis 230 m up, over the reach lowAt, the same axis 142 m up (the head whole with its
    // whole double in the river), then boughAt, a place east of the axis (the great bough stands whole at the upper left
    // beyond the wall; c11's, kept: turned to the apples themselves the lens draws them smaller, seen in c12's trials); round
    // the turn beyond the wall farAt, the axis 215 m up (THE WHOLE HEAD FROM AFAR, held 2,300 to 2,350 m), then twoAt (c12,
    // W2), a place of the air west of the head: the head at the picture's left, the west bank's sunflower large and lit at
    // its right (held 2,437 to 2,487 m). Coming IN the point slides by place to sunAt, a place between the first sunflower's head and the lips (the
    // sunflowers at the left, the face at the right), then to frontAt, the head's middle from the front, then (c12, W3) to
    // upAt, the brow's height on the head's own axis (the flat land takes less of the picture), and on the last approach to
    // noseAt, the nose's root side, HELD to the line's end
    // (c11, D2: at 3,288 m the gaze is 9.0 degrees up, the eyes in the upper third, the ring at 63% of the height and the
    // chin's point just inside the picture's foot; the engine's own guard lets the gaze go level before the ring).
    const headAt = new THREE.Vector3(30, 300, 0), vineHeadAt = new THREE.Vector3(215, 200, -110), backAt = new THREE.Vector3(0, 230, 0), liftAt = new THREE.Vector3(0, 300, 0), farAt = new THREE.Vector3(0, 215, 0),
      sunAt = V3(heads[0].c).lerp(new THREE.Vector3(104, 280, 0), 0.8).setY(268), frontAt = new THREE.Vector3(30, 290, 0),
      uBeard = uVine - 0.012, uTurn = uAt(243, 136, -206), uSw1 = uAt(-2, 40, -757), uLiftEnd = uAt(-167, 22, -435),
      uIn1 = uAt(0, 98, -578), uIn2 = uAt(60, 124, -504), uIn3 = uAt(134, 157, -420), uIn4 = uAt(214, 194, -335), uFace1 = uAt(366, 273, -58), uFaceEnd = uAt(270, 257, 0);
    const ab = MAP.arcB, uArc0 = uAt(ab.c[0] - ab.r * 0.82, 26, ab.c[1] - ab.r * 0.57), uArcMid = uAt(ab.c[0] + ab.r * 0.707, 28, ab.c[1] - ab.r * 0.707), pkAt = new THREE.Vector3(MAP.pumpkin[0], 16, MAP.pumpkin[2]), midAt = new THREE.Vector3(91, 58, -322);
    // THE ONE HEAD LOOK (c11, D1; c12, W1 to W3): the point of the look at the head, sliding by place from the vine with the head to the nose's root side.
    // Each stop is a place of the world and each slide begins and ends at a place of the line: the rack's swing 1,300 to 1,399 m and
    // back 1,520 to 1,640 m; the bough 1,880 to 2,101 m (c11's); the two with the west sunflower 2,350 to 2,437 m; the brow's height 2,800 to 3,000 m
    const lowAt = new THREE.Vector3(0, 142, 0), boughAt = new THREE.Vector3(100, 215, 0), noseAt = new THREE.Vector3(20, 300, 0), twoAt = new THREE.Vector3(-277, 187, -62), upAt = new THREE.Vector3(30, 334, 0);
    const uTwo0 = uAt(-74.6, 65.6, -686.6), uTwo1 = uAt(-30, 86, -615), uUp0 = uAt(198, 187, -352), uUp1 = uAt(321, 249, -207);
    const rackAt = new THREE.Vector3(396.9, 345, 100.3), uRk0 = uAt(243, 136, -206.4), uRk1 = uAt(308.7, 117.2, -153.4), uRk2 = uAt(347.1, 95, -251.7), uRk3 = uAt(306.6, 74.9, -362.4);
    const uScr0 = uAt(350, 99, -232), uScr1 = uAt(307, 76, -360), uLow0 = uAt(288, 69, -397), uLow1 = uAt(232, 54, -490), uFar0 = uAt(182, 46, -565), uFar1 = uAt(18, 38, -702), uB1 = uAt(-85, 57, -735);
    const headLook = (u) => lookAt2.copy(vineHeadAt).lerp(headAt, smoothstep(uVineA, uVineB, u)).lerp(backAt, smoothstep(uScr0, uScr1, u)).lerp(rackAt, smoothstep(uRk0, uRk1, u) * (1 - smoothstep(uRk2, uRk3, u))).lerp(lowAt, smoothstep(uLow0, uLow1, u)).lerp(boughAt, smoothstep(uFar0, uFar1, u)).lerp(farAt, smoothstep(uSw1, uB1, u))
      .lerp(twoAt, smoothstep(uTwo0, uTwo1, u)).lerp(sunAt, smoothstep(uIn1, uIn2, u)).lerp(frontAt, smoothstep(uIn3, uIn4, u)).lerp(upAt, smoothstep(uUp0, uUp1, u)).lerp(noseAt, smoothstep(uFace1, uFaceEnd, u));
    // THE LOOKS, as the engine is handed them (the build's return gives this same list as its pois, and LOOK_AHEAD as the
    // lens's reach along the line): they stand here, before the creatures, because lookFrom below reckons the gaze from them.
    // The looks at the head are steady: the line loops away from the head, which the steady camera would otherwise lose for seconds
    const LOOK_AHEAD = 26;
    const skyAt = new THREE.Vector3(-264, 546, -410), uSky0 = uAt(-493.7, 16, -581.6), uSky1 = uAt(-449.7, 16.5, -557.9), uSkyEnd = uAt(-419.7, 16.8, -539.8);
    const looks = [
      // the pumpkin on its islet over its double, from the nave's mouth (the nave's far opening frames it) round the arc. Its point
      // slides by place from the pumpkin's foot to a place between the pumpkin and the head (pkAt to midAt, as the line swings
      // from the arc's start to its north point): there the pumpkin's sunlit side is a third of the picture and the head stands
      // whole beyond it over its shoulder; it lets go at the arc's middle, where the head's look has risen
      { at: (time, u) => lookAt.copy(pkAt).lerp(midAt, smoothstep(uArc0, uPumpkin, u)), from: uNave, to: uArcMid + 0.012, weight: 0.85, fade: 0.2 },
      // THE ARRIVAL'S LIFT (ruling 9, L1): from the first metre to the nave's mouth the gaze is lifted a part of the way to liftAt,
      // a place of the head's axis 300 m up, so that the head stands whole over the rows with the land under it; it lets go
      // over the last 79 m before a place inside the nave's mouth (uLiftEnd, 440 m of the line), so that the nave frames
      // the pumpkin as before, 28 m before the pumpkin's look rises (the engine's own guard halves it 70 m in)
      { at: liftAt, to: uLiftEnd, weight: 0.55, fade: 0.18 },
      // A SECOND LIFT OVER THE FIRST 150 m (c12, W4): toward skyAt, a place of the air high over the rows ahead, so that at 70 m
      // the gaze is 17 degrees up (c11: 6): the soil takes under a fifth of the picture, the stooks and cabbages stand at its
      // foot and the head whole above them. Its point slides by place to liftAt (65 to 115 m of the line) and it lets go by
      // 150 m: from there on the arrival's gaze is the lift's alone, as in c11
      { at: (time, u) => lookAt3.copy(skyAt).lerp(liftAt, smoothstep(uSky0, uSky1, u)), to: uSkyEnd, weight: 0.45, fade: 0.4 },
      // the head across the water: low at first, so that the frame holds the crown above and the river with the head's double
      // below; then sliding to a place between the grapes and the face as the line climbs toward the vine
      { at: (time, u) => lookAt.set(36, 160, 0).lerp(vineHeadAt, smoothstep(uArcEnd + 0.015, uVine0, u)), from: uPumpkin, to: uVine + 0.022, weight: 0.9, fade: 0.14, steady: true },   // it rises from the arc's north point on, as the pumpkin's look lets go
      // THE ONE LOOK AT THE HEAD (c11, D1; c10's looks 4, 5 and 6): from the beard (1,146 m) to the line's end, steady, its point sliding
      // by place (headLook above): the vine with the head, the face's middle, the sunflowers and the grapes from under the rack's
      // east end, the head's axis 230 m up, the same axis 142 m up (the head whole with its whole double), the great bough's
      // apples, the axis 215 m up from beyond the wall, the head with the west bank's sunflower, a place between the sunflowers
      // and the lips, the head's middle from the front, the brow's height, and the nose's root side on the last approach, held
      // to the line's end (the engine's own guard lets the gaze go before the ring)
      { at: (time, u) => headLook(u), from: uBeard, to: 1, weight: 1, arc: true, fade: 0.4 * (uTurn + 0.03 - uBeard) / (1 - uBeard), steady: true },
    ];
    // THE CREATURES OF THE LINE (ruling part 7's least motion). From the reveal on a station every 32 m of the line: a pair of
    // brimstones or one goldfinch, each set by place where a lens on the line at that point finds it BESIDE what it truly looks
    // at (c12, F3: the gaze is lookFrom's, the engine's own): ahead along the gaze and turned 20 to 43 degrees off it (level
    // with it, else above, else below), toward the way the line is going where that differs from the gaze (the dark ground's
    // side), on a ray that meets neither the head nor its bust. Three rules of place hold for each: its whole sweep is never
    // within 8 m of the line nor within 3 m of any piece of the head; from no point of the line that holds it in the picture
    // (within 53 degrees of the gaze held there) while it is more than a speck does its sweep stand before any piece of the
    // head (c12: no second pass that let it stand before the bust); and wherever the line comes nearer to it than its cap
    // (THE CAP, below) its whole sweep lies outside the picture held there, so it is never seen wider than a twentieth of
    // the picture nor cut by its edge while large. No such place: no creature (beside ear and eye
    // most stations find none: every place beside the head there is before the head from another point of the line).
    const pq = new THREE.Vector3(), pq2 = new THREE.Vector3(), gzv = new THREE.Vector3(), sdv = new THREE.Vector3(), dvv = new THREE.Vector3();
    // a ray against the head's own pieces (their baked ellipsoids, let out by pad, 5 m unless said)
    const HB = hero.bounds, HK = new Float64Array(HB.length), allB = []; let HSR = 0, HSP = 1;   // HSR: the radius about (-20, 250, 0) that holds every piece; HSP: how much of a metre of pad the longest piece gains along its longest axis
    { const mI = new THREE.Matrix4(); for (let b = 0; b < HB.length; b++) { const e = HB[b].inv; HK[b] = Math.sqrt(Math.max(e[0] * e[0] + e[4] * e[4] + e[8] * e[8], e[1] * e[1] + e[5] * e[5] + e[9] * e[9], e[2] * e[2] + e[6] * e[6] + e[10] * e[10]));
      mI.fromArray(e).invert(); const c = mI.elements; allB.push(b); { const am = Math.max(Math.hypot(c[0], c[1], c[2]), Math.hypot(c[4], c[5], c[6]), Math.hypot(c[8], c[9], c[10])); HSR = Math.max(HSR, Math.hypot(c[12] + 20, c[13] - 250, c[14]) + am); HSP = Math.max(HSP, am * HK[b]); } } }
    // (c12, the ledger's script time) THE PIECES BY EIGHTS: a ball about each eight that holds every one of its ellipsoids let out by pad (a piece reaches no
    // farther from its middle than 1 + pad * HK times the root of the sum of its axes' squares), so a ray that misses the ball misses all eight. The answer is the same.
    const HC = new Float64Array(Math.ceil(HB.length / 8) * 5);
    { const mI = new THREE.Matrix4(), C = [], F = []; for (let b = 0; b < HB.length; b++) { mI.fromArray(HB[b].inv).invert(); const c = mI.elements; C.push([c[12], c[13], c[14]]); F.push(Math.hypot(c[0], c[1], c[2], c[4], c[5], c[6], c[8], c[9], c[10])); }
      for (let g = 0; g * 8 < HB.length; g++) { const b1 = Math.min(HB.length, g * 8 + 8); let mx = 0, my = 0, mz = 0; for (let b = g * 8; b < b1; b++) { mx += C[b][0]; my += C[b][1]; mz += C[b][2]; } mx /= b1 - g * 8; my /= b1 - g * 8; mz /= b1 - g * 8;
        let r0 = 0, r1 = 0; for (let b = g * 8; b < b1; b++) { r0 = Math.max(r0, Math.hypot(C[b][0] - mx, C[b][1] - my, C[b][2] - mz) + F[b]); r1 = Math.max(r1, F[b] * HK[b]); } HC.set([mx, my, mz, r0, r1], g * 5); } }
    const rayHits = (ox, oy, oz, dx, dy, dz, t0, t1, list, pad = 5) => { { const hx = -20 - ox, hy = 250 - oy, hz = -oz, tc = hx * dx + hy * dy + hz * dz, R = HSR + pad * HSP + 0.01; if (hx * hx + hy * hy + hz * hz - tc * tc > R * R || tc + R < t0 || tc - R > t1) return false; }   // (the ray's direction is of unit length) it misses the head's whole sphere
      const eights = list === allB;
      for (let n = 0; n < list.length; n++) {
        if (eights && (n & 7) === 0) { const g = (n >> 3) * 5, hx = HC[g] - ox, hy = HC[g + 1] - oy, hz = HC[g + 2] - oz, tc = hx * dx + hy * dy + hz * dz, R = HC[g + 3] + pad * HC[g + 4] + 0.01; if (hx * hx + hy * hy + hz * hz - tc * tc > R * R || tc + R < t0 || tc - R > t1) { n += 7; continue; } }
        const b = list[n], e = HB[b].inv;
      const px = e[0] * ox + e[4] * oy + e[8] * oz + e[12], py = e[1] * ox + e[5] * oy + e[9] * oz + e[13], pz = e[2] * ox + e[6] * oy + e[10] * oz + e[14];
      const qx = e[0] * dx + e[4] * dy + e[8] * dz, qy = e[1] * dx + e[5] * dy + e[9] * dz, qz = e[2] * dx + e[6] * dy + e[10] * dz;
      const k = 1 + pad * HK[b], aa = qx * qx + qy * qy + qz * qz, bb = px * qx + py * qy + pz * qz, cc = px * px + py * py + pz * pz - k * k, ds = bb * bb - aa * cc; if (ds < 0 || aa < 1e-12) continue;
      const sq = Math.sqrt(ds); if ((-bb - sq) / aa <= t1 && (-bb + sq) / aa >= t0) return true; } return false; };
    // THE GAZE THE LENS TRULY HOLDS (c12, F3). lookFrom reckons the gaze at a point of the line by the engine's own law
    // (src/core/engine.js, _pose, as it stands for a still: the way to the line's place LOOK_AHEAD metres on, then each look in
    // its order by its bell and weight under the engine's guard at the line's two ends; a look with arc is turned along the
    // angle, any other is mixed as plain vectors), from the SAME list of looks the engine is handed: so every test of a
    // station and of a mote below is made against the picture the lens holds, and a change to a look changes both at once.
    // (c10's lookFrom was a reckoning of its own; c11 changed the looks and it stood up to 162 degrees off the gaze.)
    const lkE = new THREE.Vector3(), lkT = new THREE.Vector3(), lkA = new THREE.Vector3();
    const lookFrom = (uu, o) => { const u = clamp(uu, 0, 1), d = u * path.length; path.posAtDist(d, lkE); path.posAtDist(d + LOOK_AHEAD, o); o.sub(lkE).normalize();
      const guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
      for (const k of looks) { const wt = bell(u, k.from ?? 0, k.to ?? 1, k.fade ?? 0.3) * (k.weight ?? 0.5) * guard; if (wt <= 0.001) continue;
        lkT.copy(typeof k.at === 'function' ? k.at(0, u) : k.at).sub(lkE).normalize();
        if (k.arc) { const ang = Math.acos(clamp(o.dot(lkT), -1, 1)); if (ang > 1e-4) { lkA.crossVectors(o, lkT); if (lkA.lengthSq() < 1e-8) lkA.set(0, 1, 0); else lkA.normalize(); o.applyAxisAngle(lkA, ang * Math.min(1, wt)).normalize(); } }
        else o.multiplyScalar(1 - wt).addScaledVector(lkT, wt).normalize(); }
      return o; };                                                          // the gaze's direction, of unit length
    const gq = new THREE.Vector3(), LK = new Float32Array(2100);          // the gaze held at each of the line's 700 points, unit length
    for (let i = 0; i < 700; i++) { lookFrom(i / 700, gq); LK[i * 3] = gq.x; LK[i * 3 + 1] = gq.y; LK[i * 3 + 2] = gq.z; }
    const inPiece = (x, y, z, pad) => { { const R = HSR + pad * HSP + 0.01; if ((x + 20) * (x + 20) + (y - 250) * (y - 250) + z * z > R * R) return false; }
      for (let b = 0; b < HB.length; b++) { const e = HB[b].inv, qx = e[0] * x + e[4] * y + e[8] * z + e[12], qy = e[1] * x + e[5] * y + e[9] * z + e[13], qz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const k = 1 + pad * HK[b]; if (qx * qx + qy * qy + qz * qz < k * k) return true; } return false; };   // within pad of any piece of the head (its baked ellipsoids)
    // is the offset (ax, ay, az) from the line's point i inside the picture held there, let out to th and tv (the tangents of
    // its half width and half height: the picture itself is 1.07 by 0.6)?
    const inFrame = (ax, ay, az, i, th, tv) => { const lx = LK[i * 3], ly = LK[i * 3 + 1], lz = LK[i * 3 + 2], f = ax * lx + ay * ly + az * lz; if (f <= 0) return false;
      const m = Math.sqrt(lx * lx + lz * lz) || 1e-6; return Math.abs(az * lx - ax * lz) < th * f * m && Math.abs(ay * m * m - (ax * lx + az * lz) * ly) < tv * f * m; };
    // IN THE FAR VIEW (ruling 5, part 3; ruling 7's far view) no creature's course lies within 150 m of the line: where THE
    // WHOLE HEAD FROM AFAR is held, from the place beyond the wall where the look has come round to the head to the reach
    // (places of the line), a station's place is refused that near; the stations of that stretch are set 165 to 225 m
    // off, a goldfinch and a pair of brimstones by turns, small beside the head and never before it
    const iFar0 = Math.round(uSw1 * 700), iFar1 = Math.round(uIn1 * 700);
    const farMid = lineAt((uSw1 + uIn1) / 2, new THREE.Vector3()), farReach = Math.max(farMid.distanceTo(lineAt(uSw1, new THREE.Vector3())), farMid.distanceTo(lineAt(uIn1, new THREE.Vector3()))) + 60;
    const farViewDist = (x, y, z) => { if (Math.hypot(x - farMid.x, y - farMid.y, z - farMid.z) > farReach + 220) return 1e9; let m = 1e18; for (let i = iFar0; i <= iFar1; i++) { const ax = PS[i * 3] - x, ay = PS[i * 3 + 1] - y, az = PS[i * 3 + 2] - z; m = Math.min(m, ax * ax + ay * ay + az * az); } return Math.sqrt(m); };
    const DIRS = []; for (const el of [0.06, 0.3, -0.22, 0.5, -0.42]) for (const ang of [28, 36, 20, 43]) DIRS.push([ang * Math.PI / 180, el]);   // level with the look first, then above it, then below; 20 to 43 degrees off it
    // THE MOTES (ruling 5, part 1): pollen specks, 380 in all and 60 in the column before the face (the ruling's bounds: 600 and 200), each on a closed
    // course by the world's clock about its own place in its column (the same on every seed). BY PLACE: none is made within
    // 45 m of the line; its size is its least distance from the line over 210 (so that from the line's nearest point it is
    // under three pixels of a picture 640 wide, and smaller from anywhere else); its middle is no nearer to the line than
    // 1.5 times its amplitude plus 1.5 times its size plus 2.5 m; and from no point of the line within 400 m that holds it in
    // the picture does its course stand before any piece of the head (the creatures' own test): such a place is not used.
    const beforeHead = (x, y, z, pad) => { for (let i = 0; i <= 700; i += 4) { const ax = x - PS[i * 3], ay = y - PS[i * 3 + 1], az = z - PS[i * 3 + 2], d2 = ax * ax + ay * ay + az * az; if (d2 > 160000) continue; const dd = Math.sqrt(d2);
      const hx = -20 - PS[i * 3], hy = 250 - PS[i * 3 + 1], hz = -PS[i * 3 + 2], tc = (hx * ax + hy * ay + hz * az) / dd; if (tc < dd || hx * hx + hy * hy + hz * hz - tc * tc > 122500) continue;   // the ray beyond the mote misses the head's whole sphere (350 m about (-20, 250, 0))
      if (!inFrame(ax, ay, az, i, 1.2, 0.68)) continue;
      if (rayHits(PS[i * 3], PS[i * 3 + 1], PS[i * 3 + 2], ax / dd, ay / dd, az / dd, dd, dd + 900, allB, pad)) return true; } return false; };
    if (LIGHT_IN_AIR) {
      const e1 = new THREE.Vector3(-SUN_DIR.z, 0, SUN_DIR.x).normalize(), e2 = new THREE.Vector3().crossVectors(SUN_DIR, e1), v = new THREE.Vector3();
      const mr = makeRng('harvest-motes'), mp = [], mC = [], mQ = [], mP = [], mR = [], mU = [], mi = [];
      const counts = [70, 90, 80, 80, 60]; let tested = 0;
      for (let si = 0; si < SHAFTS.length; si++) { const s = SHAFTS[si], n = Math.round(counts[si] * (0.6 + 0.4 * q));
        for (let m = 0, tries = 0; m < n && tries < n * 5; tries++) { const whole = si === 4, h = 6 + (s.end * (whole ? 0.97 : 0.86) - 6) * mr(), rho = Math.sqrt(mr()) * (whole ? 0.97 : 0.8),   /* the face's column: sixty, through its whole width and height (dust, never a line of dots) */ th = mr() * TAU, ph = mr() * TAU, w = (0.12 + 0.18 * mr()) * (mr() < 0.5 ? 1 : -1), A = 2 + 4 * mr(), spin = mr(), br = 0.55 + 0.45 * mr();
          v.set(s.p[0], s.p[1], s.p[2]).addScaledVector(SUN_DIR, h / SUN_DIR.y).addScaledVector(e1, s.ra * rho * Math.cos(th)).addScaledVector(e2, s.rb * rho * Math.sin(th));
          const dl = lineDist(v.x, v.y, v.z), sz = Math.min(2.4, dl / 210);
          if (dl < 45 || dl < 1.5 * A + 1.5 * sz + 2.5) continue;
          const over = beforeHead(v.x, v.y, v.z, 2 + 0.75 * A); tested++;
          if (tested > 12) { tested = 0; await tick(); }
          if (over) continue;
          const b0 = mp.length / 3; m++;
          for (const [ax, az] of [[1, 0], [0, 1]]) for (const [u2, v2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { mp.push(ax * u2 * sz, v2 * sz, az * u2 * sz); mC.push(v.x, v.y, v.z, br); mQ.push(ph, w, A, spin); mP.push(s.p[0], s.p[1], s.p[2]); mR.push(s.ra, s.rb, s.full, s.end); mU.push(u2, v2); }
          mi.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3, b0 + 4, b0 + 5, b0 + 6, b0 + 4, b0 + 6, b0 + 7); }
        await tick(); }
      const mg = new THREE.BufferGeometry(); for (const [nm, arr, k] of [['position', mp, 3], ['aC', mC, 4], ['aQ', mQ, 4], ['aP', mP, 3], ['aR', mR, 4], ['aUv', mU, 2]]) mg.setAttribute(nm, new THREE.Float32BufferAttribute(arr, k)); mg.setIndex(mi);
      const motes = new THREE.Mesh(mg, new THREE.ShaderMaterial({ name: 'motes', vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: { uSun: STYLE.uSun, uTime: STYLE.uTime, uCol: { value: new THREE.Color(MOTE_TOP).sub(new THREE.Color(SHAFT_TOP)).multiplyScalar(0.8) } } }));
      motes.name = 'motes'; motes.frustumCulled = false; motes.renderOrder = 4; scene.add(motes); await tick();
    }
    // (the two tests of a station's place are plain small functions: asked some thousands of times each, they are compiled early; written out inside beside they ran slowly and left their numbers as garbage)
    // is any of its sweep (sw about the place) in the picture from a point of the line where it would be drawn wider than its cap? R is
    // the cap's distance in the picture's middle (CAPW of the width). Toward the edges the wide lens draws a body out, at the most
    // by the square of (its ray's length over its depth): 2.14 times at the side edge, 2.5 in a corner; there it may be drawn
    // EDGEW wide at the most, so its cap's distance is longer by that stretch times CAPW / EDGEW where that is over one
    const bigNear = (x, y, z, R, sw) => { const far = Math.max(1, 2.5 * EDGE) * R + sw, r2 = far * far; for (let i = 0; i < 700; i += 2) { const ax = x - PS[i * 3], ay = y - PS[i * 3 + 1], az = z - PS[i * 3 + 2], d2 = ax * ax + ay * ay + az * az; if (d2 > r2 || d2 < 1) continue;
      const lx = LK[i * 3], ly = LK[i * 3 + 1], lz = LK[i * 3 + 2], f = ax * lx + ay * ly + az * lz; if (f <= 0) continue;
      const dd = Math.sqrt(d2), mg = 1.6 * sw / dd + 0.06, m = Math.sqrt(lx * lx + lz * lz) || 1e-6, tx = Math.abs(az * lx - ax * lz) / (f * m), ty = Math.abs(ay * m * m - (ax * lx + az * lz) * ly) / (f * m);
      if (tx > 1.07 + mg || ty > 0.6 + mg) continue;                            // none of its sweep in the picture held there
      const ex = Math.min(tx, 1.07), ey = Math.min(ty, 0.6); if (dd - sw < R * Math.max(1, EDGE * (1 + ex * ex + ey * ey))) return true; } return false; };
    const standsBefore = (x, y, z, r2, list, pad) => { for (let i = 0; i <= 698; i += 3) { const ax = x - PS[i * 3], ay = y - PS[i * 3 + 1], az = z - PS[i * 3 + 2], d2 = ax * ax + ay * ay + az * az; if (d2 > r2 || d2 < 1) continue; const dd = Math.sqrt(d2);
      if (!inFrame(ax, ay, az, i, 1.33, 0.75)) continue;                     // not in the picture from that point
      if (rayHits(PS[i * 3], PS[i * 3 + 1], PS[i * 3 + 2], ax / dd, ay / dd, az / dd, dd, dd + 600, list, pad)) return true; } return false; };   // its whole sweep, not its station alone, clear of the head
    // the west sunflower's own air (c12, W2): no course inside the round of its leaves and stem, from the land to over its head
    const offFlower = (x, y, z, sw) => { const fx = x - WEST_FLOWER[0], fz = z - WEST_FLOWER[1], R = 50 + sw; return fx * fx + fz * fz > R * R || y > landY(WEST_FLOWER[0], WEST_FLOWER[1]) + WEST_FLOWER[2] + 32 + sw; };
    const beside = (d, Ds, sweep, out, nearR, avoid, reach) => {
      const uu = d / path.length; path.posAtDist(d, pp); path.tangentAtDist(d, pt);
      lookFrom(uu, gzv);
      sdv.set(-gzv.z, 0, gzv.x).normalize();                               // the look's right hand, level
      const tp = sdv.dot(pt), pref = tp >= 0.05 ? 1 : tp <= -0.05 ? -1 : (Math.round(d / 32) % 2 ? 1 : -1);
      { const list = allB; let tries = 0; search: for (const D of Ds) for (const [an, el] of DIRS) for (const sg of [pref, -pref]) {
        dvv.copy(gzv).multiplyScalar(Math.cos(an)).addScaledVector(sdv, sg * Math.sin(an) * (el > 0.1 || el < 0 ? 0.8 : 1)); dvv.y += el; dvv.normalize();
        out.copy(pp).addScaledVector(dvv, D); if (farViewDist(out.x, out.y, out.z) < 150 + sweep) continue;
        if (rayHits(pp.x, pp.y, pp.z, dvv.x, dvv.y, dvv.z, D * 0.5, 800, list, 5 + 0.5 * sweep)) continue;
        if ((avoid && out.distanceTo(avoid) < 11) || inPiece(out.x, out.y, out.z, sweep + 3) || out.y < landY(out.x, out.z) + 10 + sweep || lineDist(out.x, out.y, out.z) < 8 + sweep) continue;
        if (bigNear(out.x, out.y, out.z, nearR, sweep) || !offFlower(out.x, out.y, out.z, sweep)) continue;   // nearer than its cap, the lens looks elsewhere; and never in the west sunflower's own air
        if (++tries > 20) break search;                                          // the dear test below is asked of the first twenty places that meet the cheap ones
        // and from no point of the line within reach of it (where it is more than a speck) does it stand before any piece of the head
        if (!standsBefore(out.x, out.y, out.z, (reach + sweep) * (reach + sweep), list, 0.75 * sweep)) return true;
      } }
      return false;
    };
    // THE CAP (c12, F3 and F4): no creature of the garden is drawn wider than CAPW of the picture's width by the middle's law
    // (its span over its distance), nor wider than EDGEW where the lens draws it out toward the picture's edges (EDGEW an
    // eighth: that second cap is off, the edge's stretch at the most 2.5 times CAPW; a smaller EDGEW thins the stations). Its cap is the
    // distance at which its span is CAPW wide (at a twentieth: a goldfinch 112 m, a brimstone 47 m, a wasp 37 m); nearer than that its
    // whole sweep lies outside the picture held there (bigNear), and from no point of the line that holds it in the picture
    // while it is more than a speck (SPECK of the width: its sweep within 375 m a goldfinch, 156 m a brimstone) does its sweep stand
    // before the head (standsBefore). A creature set by hand (stook, sunflower, espalier, grape) is made only where both hold.
    const CAPW = 0.05, EDGEW = 0.125, EDGE = CAPW / EDGEW, SPECK = 0.015, capOf = (span, share = CAPW) => span / (2 * 1.068 * share), FIN = capOf(12), BRI = capOf(5), WSP = capOf(4), FIN_R = capOf(12, SPECK), BRI_R = capOf(5, SPECK), WSP_R = capOf(4, SPECK);
    const fits = (k, half, cap, reach) => { const sw = k.r + k.bob + half + 1; return !bigNear(k.c[0], k.c[1], k.c[2], cap, sw) && !standsBefore(k.c[0], k.c[1], k.c[2], (reach + sw) * (reach + sw), allB, 0.75 * sw) ? k : null; };
    // goldfinches (span 12): on three stooks' ears, on the sunflowers' rims, and the line's stations (none on crown, face, beard or mouth)
    const finchC = [];
    for (let i = 0; i < 3; i++) { const k = fits(loop([stookTops[i][0], stookTops[i][1] + 3, stookTops[i][2]], 5 + dr() * 2, (0.5 + 0.3 * dr()) * (i % 2 ? 1 : -1), { bob: 1.5, span: 12 }), 6, FIN, FIN_R); if (k) finchC.push(k); }
    for (let i = 0; i < 3; i++) { const h = heads[i], k = fits(loop([h.c[0] - h.n[0] * 4, h.c[1] + h.R * 0.86, h.c[2] - h.n[2] * 4], 4.5, 0.6 * (i % 2 ? 1 : -1), { bob: 1.2, span: 12 }), 6, FIN, FIN_R); if (k) finchC.push(k); }
    await tick();
    const brimC = [];
    // six brimstones over the rows, each a station of the line like those below (set beside the gaze held there, never nearer than its cap in the picture)
    for (const d of [84, 150, 232, 330, 404, 476]) { const r = 3.5 + 2.5 * dr(), w = (0.4 + 0.3 * dr()) * (dr() < 0.5 ? 1 : -1); if (beside(d, [BRI + r + 9, BRI + r + 24, BRI + r + 44], r + 4.5, pq, BRI, undefined, BRI_R)) brimC.push(loop([pq.x, pq.y, pq.z], r, w, { bob: 1.6, span: 5 })); await tick(); }
    const dBeard = uBeard * path.length, dSun = uIn4 * path.length, dFar0 = uSw1 * path.length, dFar1 = uIn1 * path.length;
    for (let d = 840, i = 0; d < path.length - 150; d += 32, i++) {         // a station every 32 m: a pair of brimstones, a goldfinch, by turns
      const fin = i % 2 === 1, r = fin ? 3.5 + 1.5 * dr() : 2.6 + 1.2 * dr(), w = (fin ? 0.6 + 0.3 * dr() : 0.4 + 0.3 * dr()) * (dr() < 0.5 ? 1 : -1);
      await tick();
      const close = d > dBeard && d < dSun, far = d > dFar0 && d < dFar1;                               // from the beard to the sunflowers, where the pace is slow, the stations hold a goldfinch and a pair of brimstones by turns
      // ONE goldfinch to a station, whole, just beyond its cap where it can be (a twentieth of the picture's width), else further; brimstones
      // in pairs set two spans and more apart
      if ((close ? fin : i % 4 === 1) && beside(d, far ? [172, 195, 225] : [FIN + r + 12, FIN + r + 30, FIN + r + 55, FIN + r + 85], r + 9, pq, FIN, undefined, FIN_R)) finchC.push(loop([pq.x, pq.y, pq.z], r, w, { bob: 1.5, span: 12 }));
      await tick();
      if (close ? !fin : i % 4 === 0) { const Db = far ? [164, 185, 210] : [BRI + r + 7, BRI + r + 18, BRI + r + 32, BRI + r + 50];
        if (beside(d, Db, r + 4.5, pq, BRI, undefined, BRI_R)) { brimC.push(loop([pq.x, pq.y, pq.z], r, w, { bob: 1.3, span: 5 }));
          if (beside(d, Db, r + 4.5, pq2.copy(pq), BRI, pq, BRI_R)) brimC.push(loop([pq2.x, pq2.y, pq2.z], r * 0.8, w * -1.3, { bob: 1.3, span: 5 })); } }   // the second of the pair is set by the same rules, two spans and more from the first
    }
    // ROUND THE SUNFLOWERS' STOP (c12, F3): held to their caps the creatures are few in the picture there (the gate's place at
    // 2,799 m): three pairs of brimstones more at half stations and a goldfinch at the one bare station, by the stations' own rules;
    // their turn and phase by their number, with no draw from the stream, so that no other course changes
    for (let j = 0; j < 4; j++) { const d = [2776, 2808, 2840, 2856][j], r = 2.6 + 1.2 * hsh(j, 51), w = (0.4 + 0.3 * hsh(j, 52)) * (j % 2 ? 1 : -1);
      const made = (c, rr, ww, o, n) => ({ c: standOff(c, 2 + rr + o.bob + o.span / 2 + 1), r: rr, e: 0.7, w: ww, ph: TAU * hsh(n, 53), tilt: TAU * hsh(n, 54), bob: o.bob, s: 1 });
      if (j === 3) { if (beside(d, [FIN + r + 13, FIN + r + 31, FIN + r + 56, FIN + r + 86], r + 10, pq, FIN, undefined, FIN_R)) finchC.push(made([pq.x, pq.y, pq.z], r + 1, w * 1.4, { bob: 1.5, span: 12 }, 9)); }
      else { const Db = [BRI + r + 7, BRI + r + 18, BRI + r + 32, BRI + r + 50];
        if (beside(d, Db, r + 4.5, pq, BRI, undefined, BRI_R)) { brimC.push(made([pq.x, pq.y, pq.z], r, w, { bob: 1.3, span: 5 }, 2 * j));
          if (beside(d, Db, r + 4.5, pq2.copy(pq), BRI, pq, BRI_R)) brimC.push(made([pq2.x, pq2.y, pq2.z], r * 0.8, w * -1.3, { bob: 1.3, span: 5 }, 2 * j + 1)); } }
      await tick(); }
    const finches = creatureMesh(goldfinchGeo(P), flyLeaf(0.85), finchC, 'goldfinches', false); scene.add(finches); await tick();
    // THE FLOCK (ruling 7, part 6; the owner's fourth line of 19:21): twenty-four sparrows that wheel round the head on their
    // own slow closed circuits by place and the world's clock, the same on every seed: four companies, each bird on its own
    // ellipse about the head's axis, 226 to 314 m out along the face's way (70 to 160 m out from the face) and 0.76 to 0.86
    // of that across, 298 to 416 m up (cheek to brow), so that from every side the head is seen from some cross before it,
    // lit on their sunward side. No circuit comes near the line: the nearest is over the mouth's axis, 40 m and more above it
    // (tools print each circuit's least distance to the line less its bob and half a span). Nothing on the head moves.
    const flockC = [];
    for (let g = 0; g < 4; g++) { const [a, e, y, w, ph, tilt] = [[245, 0.86, 324, 0.09, 0.4, 0.2], [285, 0.8, 368, 0.075, 2.6, -0.15], [262, 0.84, 394, 0.082, 4.4, 0.3], [300, 0.76, 342, 0.07, 5.5, -0.3]][g];
      for (let j = 0; j < 6; j++) flockC.push({ c: [-10, y + 20 * (hsh(g, j + 1) - 0.5), 0], r: a + 28 * (hsh(g + 3, j) - 0.5), e, w, ph: ph - j * 0.05 + 0.04 * hsh(j, g + 7), tilt, bob: 5 + 4 * hsh(g + 5, j), s: 0.9 + 0.2 * hsh(j + 2, g) }); }
    // THE WALL'S BIRDS (ruling 7, part 5: the wall's picture holds birds): nine sparrows that wheel over the rick beside the
    // lit step, each on its own closed circuit drawn out along the rick (16 m and more over its ridge, 30 m and more from
    // the line, east of the apple's crown): by place and the world's clock; from the far view's turn they lie behind the lens
    for (let j = 0; j < 9; j++) flockC.push({ c: [MAP.rick[0] + 17 + 14 * (hsh(j, 31) - 0.5), 50 + 22 * hsh(j, 32), MAP.rick[1] + 4 + 12 * (hsh(j, 33) - 0.5)], r: 28 + 18 * hsh(j, 34), e: 0.55 + 0.25 * hsh(j, 35),
      w: (0.24 + 0.1 * hsh(j, 36)) * (j % 3 ? 1 : -1), ph: TAU * hsh(j, 37), tilt: 0.45, bob: 3 + 3 * hsh(j, 38), s: 0.9 + 0.2 * hsh(j, 39) });
    const flock = creatureMesh(sparrowGeo(P), flyLeaf(0.95), flockC, 'flock', false); scene.add(flock); await tick();
    // wasps (4 long): at the one split grape and by the wall's espaliers
    const waspC = [], sp = vineOut.split || [250, 150, -195];
    for (let i = 0; i < 3; i++) { const k = fits(loop([sp[0] + 2 * (dr() - 0.5), sp[1] + 2 * (dr() - 0.5), sp[2] + 2 * (dr() - 0.5)], 3 + 2 * dr(), (1.1 + 0.6 * dr()) * (i % 2 ? 1 : -1), { bob: 1, span: 4 }), 2, WSP, WSP_R); if (k) waspC.push(k); }
    // BY THE WALL'S ESPALIERS (ruling 7, part 6): a wasp at the fruit of every second near espalier, a brimstone at each
    for (let i = 0; i < beltOut.esp.length; i++) { const [ex, ey, ez, nx, nz] = beltOut.esp[i];
      if (i % 2 === 0) { const k = fits(loop([ex + nx * 3, ey - 2, ez + nz * 3], 2.5 + 1.5 * dr(), (1.0 + 0.6 * dr()) * (i % 4 ? 1 : -1), { bob: 1, span: 4 }), 2, WSP, WSP_R); if (k) waspC.push(k); }
      { const k = fits(loop([ex + nx * (7 + 4 * dr()), ey + 4 + 5 * dr(), ez + nz * (7 + 4 * dr())], 3 + 2 * dr(), (0.4 + 0.3 * dr()) * (dr() < 0.5 ? 1 : -1), { bob: 1.4, span: 5 }), 2.5, BRI, BRI_R); if (k) brimC.push(k); } }
    const wasps = creatureMesh(waspGeo(P), flyLeaf(1.3), waspC, 'wasps', false); scene.add(wasps); await tick();
    // brimstones (span 5): six in the rows, the line's stations, the hero's eight before the face; forty more over the spires of the bolted garden
    if (rare) for (let i = 0; i < 28; i++) { const o = along(70 + 480 * dr(), (14 + 50 * dr()) * (dr() < 0.5 ? 1 : -1)), k = fits(loop([o[0], o[1] + 22 + 9 * dr(), o[2]], 3.5 + 3 * dr(), (0.4 + 0.3 * dr()) * (dr() < 0.5 ? 1 : -1), { bob: 1.6, span: 5 }), 2.5, BRI, BRI_R); if (k && offFlower(k.c[0], k.c[1], k.c[2], k.r + k.bob + 3.5)) brimC.push(k); }
    const brims = creatureMesh(brimstoneGeo(P), flyLeaf(1.05), brimC, 'brimstones-garden', false); scene.add(brims); await tick();
    // snails (9 long): the first savoy's rim, a bean pod of the beard, the mouth's side wall, the pumpkin, the rick
    const crawl = (c, up, r = 1.6, w = 0.11) => { const u3 = V3(up).normalize(), t1 = new THREE.Vector3(0, 1, 0).cross(u3); if (t1.lengthSq() < 1e-4) t1.set(1, 0, 0); t1.normalize(); return { c, up: u3, t1, t2: new THREE.Vector3().crossVectors(u3, t1), r, w, ph: dr() * TAU, s: 1 }; };
    const fs = firstSavoy, tp = path.posAtDist(58, new THREE.Vector3()), nrm = V3([tp.x - fs.c[0], 0, tp.z - fs.c[2]]).normalize().multiplyScalar(0.45).add(new THREE.Vector3(0, 0.9, 0)).normalize();
    const pk = MAP.pumpkin, snailC = [crawl([fs.c[0] + nrm.x * fs.R * 1.04, fs.c[1] + nrm.y * fs.R * 1.04, fs.c[2] + nrm.z * fs.R * 1.04], [nrm.x, nrm.y, nrm.z]),
      crawl([99.5, 168, -8.6], [0.25, 0.05, -0.97], 1.2), crawl([72, 251, -26.2], [0, 0, 1], 1.4), crawl([pk[0] + 4, landY(pk[0], pk[2]) + 46.5, pk[2] + 9], [0.1, 1, 0.25]), crawl([MAP.rick[0] + 20, landY(MAP.rick[0], MAP.rick[1]) + 24.2, MAP.rick[1] + 4], [0, 1, 0.2])];
    const snails = creatureMesh(snailGeo(P), hero.mats.skin, snailC, 'snails', true); scene.add(snails); await tick();
    // THE ROUND'S RIM: its own ring of pepper gold in the glaze, modelled by the one sun like every other piece (the engine's
    // glow is off: it lays a pure white core on a rim). 480 triangles. Ruling 9's open choice 3: a quarter wider (the tube's
    // middle 13.2 m out, 1.6 m thick, 11.6 to 14.8 m; the nearest true triangle of anything else is a leaf 2.26 m off).
    { const Rg = new Geo(260); Rg.bounds = [];
      surf(Rg, { nu: 6, nv: 40, wrap: true, M: TRm(MAP.round[0] + 0.2, MAP.round[1], MAP.round[2]), pid: 0, mat: [0.3, 0, 0.4, 0], pat: [0, 0, 0, 0], f: (u, v, S) => {
        const a = -u * TAU, b = v * TAU, rr = 13.2 + 1.6 * Math.cos(a); S.x = 0.7 * Math.sin(a); S.y = rr * Math.cos(b); S.z = rr * Math.sin(b); S.a = u * 3.8; S.b2 = v * 77;
        S.r = P.gold[0]; S.g = P.gold[1]; S.b = P.gold[2]; } });
      for (let i = 0; i < Rg.n; i++) Rg.shade[i * 3 + 2] = 1;   // it stands in the mouth's shade and takes the round's own warm light, like the vault's ribs
      const rim = new THREE.Mesh(Rg.toGeometry(), hero.mats.skin); rim.name = 'round-rim'; rim.frustumCulled = false; scene.add(rim); await tick(); }

    return {
      scene, path, duration: 64, pace: paceAt,
      camera: { fov: 62, near: 0.5, far: 4200, lookAhead: LOOK_AHEAD, sway: 0.35, bank: 0 },
      pois: looks,
      portal: { shape: 'circle', radius: 12, color: '#E0A12B', glow: 0, revealDistance: 340 },   // glow 0: the engine's glow lays a pure white core on the rim; the rim is the world's own gold ring
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);                    // the world's clock into the shared uniforms; the hero's brimstones
        finches.userData.fly(time); flock.userData.fly(time); wasps.userData.fly(time); brims.userData.fly(time); snails.userData.fly(time);
      },
      dispose() { hero.dispose(); },
    };
  },
};
