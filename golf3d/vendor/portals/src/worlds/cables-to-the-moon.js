// CABLES TO THE MOON, from Hothouse by Brian Aldiss: the far-future Earth that has stopped turning, the side held
// for ever toward a swollen sun, where the plants have won. We glide in over the roof of the one forest, crown beside crown
// to the horizon, where plants glide, fish the air and snap; swing up beside a living cable as thick as a tower
// that leans out of the forest toward a Moon netted in web; overtake a vegetable giant hauling itself up that cable
// with seed pods and their small green passengers stuck to its flank; and climb on as the sky goes from white-gold
// to violet-black, to the ring of web where all the cables meet.
//
// MAP OF THIS FILE
//   1. LAYOUT      the flight (the arrival's five points on the map are typed; its heights are a glide down
//                  from the hill top's height, never under 12 m over the roof as it lies; two typed knots over
//                  the hill; the rest beside the cable as (s, x, m)), the anchor peaks, the bend of the forest,
//                  the climb's two clearances and the traverser's numbers
//   2. build(ctx)  every stream of chance (one list) -> the seeded look -> the flight and its PLACES -> the script ->
//                  sky -> the roof of the forest -> the climber (src/parts/cables-to-the-moon.js) -> everything spun
//                  -> traffic on the other cables -> another of the kind coming down the next cable -> seeds in
//                  the air -> life on the roof -> gaze -> per frame -> return
//   SCRIPT         Nothing here is timed in u. PLACES are found on the route (where we cross the hollow that
//                  rings our hill, come over the hill's foot, level with the cable's foot, level with the
//                  traverser on the next cable, level with the ring's rim). THE GAZE has three pulls, each between
//                  places: to the hill's root in the roof, whole from the route's first point and let go from
//                  the hollow to the hill's foot; to the climber (its body, then its flank, then the cable
//                  ahead, then the ring: by where we are along it), from the cable's foot to the ring, brought
//                  round and let go over the body's depth, 70 m; and to the traverser on the next cable,
//                  about the place where the road comes level with it (TRAV_LOOK in the layout).
//                  WHAT FOLLOWS THE FLIGHT, each declared
//                  once: (1) THE SKY follows the eye's height (thinning(): the share of the air below the eye):
//                  the dome's colours, the stars, the glow round the sun, the sun's reddening and veil, the
//                  bars of high cloud and the far storms' veils on the world's edge (both painted on the far
//                  plane: they thin with the air), the colour the clear air
//                  takes round a thing at the eye's own height, THE AIR OVER THE LAND, and HOW MUCH OF THE MOON COMES
//                  THROUGH THE AIR OVER THE EYE (MOON_AIR: a pale shape in the gold air by day, the bright
//                  webbed Moon above the air).
//                  THE AIR OVER THE LAND, ONE LAW (mend S; stated here once). The land stands in full day at
//                  every height of the eye: the sun stands still, and the sky darkens because we climb out
//                  of the air. (i) THE FAR AIR, in which the far land is lost, and the band of air on the
//                  world's limb: the sky's own colour at the horizon while the eye is in that air (cream,
//                  amber, rose: the sky's law to its third stop), and that rose from the rose stop on
//                  (AIR_HOLD), never the violet or the night. (ii) THE ROOF'S HAZE AND ITS STEAM: THE DAY'S
//                  GOLD, EXACTLY, WHILE THE SKY'S STATE IS THE DAY'S: no further on than it is at the highest
//                  the eye stands on the way in (the hill top's height, where the flight sets out and where
//                  the climb begins: A_IN), so the whole way in has the gold at every height of it; above
//                  that it goes over, across one stop of the sky's law (HAZE_OVER), to the lesser of the gold
//                  and the far air of (i). Nothing of it goes by the eye's height below the hill top's.
//                  No THING is faded, thinned,
//                  sized or lit by the eye's height: the air that dims a thing is the air along the ray to it,
//                  and its fill is the sky's colour at its own height. (2) THE LAND bends and sinks with the share
//                  of the climb (rise(u)). (3) THE CLIMBER's steps go by METRES FLOWN (672 to 1,092 m of route to
//                  one round of its seven limbs: the visit's pace); lead(u), how many metres up the cable we are
//                  ahead of its middle, sets our pace and what the second gaze pull looks at. (4) (mend W, W2) THE THIRD
//                  PULL'S WINDOW is laid about the place where THIS visit comes level with the traverser, found
//                  each frame from the clock the visit came in with (the world's second less 48 s times the
//                  share flown): the meeting is the same meeting whatever the clock read at the way in.
//                  NOTHING HAPPENS ONCE AS WE COME (mend W, W4). Until that mend a trap was sprung once and its
//                  covey put up once, the first time the eye came within its reach: that is gone. THE ROOF'S
//                  HUNTERS HUNT ON THEIR OWN ROUNDS on the world's clock, each from its own drawn phase, whether
//                  or not anyone comes (the life part's COVEY); no moment is written by the eye. All life but
//                  the climber runs on the world clock (the traverser on the next cable among it: its place is
//                  its cable's and that clock's, by its habit of going down a stretch and back, for ever: the
//                  layout's TRAV_GO). The Moon keeps one size and one face for the whole visit.
//   THE MOON'S TINT IS A LOOK THE WORLD DEALS (stream 'look', one draw in four each: two gibbous, one green, one
//                  crescent): a pale ash Moon with three quarters of its green growth on the gibbous and the
//                  crescent visits, the growth all over it on the green visit: grey on some visits, greenish
//                  on others, the same law of light and air on every one.
//   THE EYE'S PLACE is read by nothing else but: the air along the ray to a thing (fog: by the ray's length, the
//                  heights of its two ends and, for the steam's far-air line, the ray's bearing against the
//                  sun's; the sky's band on the far plane goes by the ray's direction alone), a pattern going to its
//                  mean under the pixel's footprint (antialiasing: cmPx in the common part; on the roof's
//                  sheet the crowns, the swells' light, the ranks and the valleys alike; a crown's round
//                  goes to the mean of what the ray sees of it, light as well as shade: the forest part's
//                  cnMean, mend T), the crowns painted on the roof, which are relief drawn by the ray (the
//                  ray is walked to the crown that stands first on it, one step to 7 m of map and 20 at the
//                  most: under rays flatter than about 5.7 degrees a nearer crown's edge can be stepped
//                  over; SHEET_FRAG in the forest part, mend T; and,
//                  in the rounds' mean alone, how open a crown's sides are by the ray's angle to the roof:
//                  cnHid), the hair to the Moon (it stands 400 km long; it is drawn on its own rays at no
//                  more than 8.6 km from the eye, as narrow in the picture as it stands: the web part), a thread or far
//                  rope never drawn narrower than 1.6 pixels (the eye's depth times the pixel's angle): a thread is
//                  dimmed by as much as it is widened (cmRibbon; a web strand by the power 1.5 of that: the web part); a rope is not: it stays solid (the web part), the sky's dome and far
//                  plane, the seeds' slabs (they go with the eye), a seed fading out within 15 m of
//                  the eye's place, a thread of the web fading out within 12 m of it (the web part), and the
//                  painted sheet's own mesh: its middle goes with the eye, its cells
//                  grow from its middle, and where a cell is too coarse to carry a swell the height the MESH
//                  is drawn at goes to the roof's level (a rule of cost of that one mesh: SHEET_VERT in the
//                  forest part; the mesh carries no crown; every crown, shade, edge and grain painted on it
//                  goes by the footprint alone, to its mean, and nothing stands on it). That mesh's height
//                  apart, no thing's tone, shade, relief, height or presence goes by metres from the eye.
//   THE LIGHT GROWS HARDER WITH A THING'S OWN HEIGHT (mend T; the common part's cmSunAt, cmLitAt, cmBounceAt: by
//                  the share of the air under the thing, never the eye's. THE LAND'S FALL IS NOT A HEIGHT
//                  (mend U): the height read is the thing's place plus the share of the land's fall its
//                  point takes, and EACH PROGRAM THAT READS THE LAW NAMES THAT SHARE (CM_FOLLOW): 1.0 for
//                  what stands on the roof (the built crowns, the traps, the kites, the boughs with
//                  their suckers and watchers); a varying for the ropes and the threads (each point's
//                  own share of its line) and for the birds' bodies (none for a high glider, all for
//                  the rest: the one number that moves the bird); a uniform, uFol, for the climbers:
//                  none for the hero's body, hair and fliers (mend V: its hindmost HANDS hold the cable
//                  where the cable sinks with the land, and go down with it: a limb's points, and the
//                  new strand's, name the share the hand, or the strand's far end, has taken with the
//                  rope, by their place along the limb or the strand: the hero part's vFol), and for
//                  the second of the kind, the visit's
//                  traffic and the far lines' climbers the share their line takes at their place,
//                  which their frame returns from the line's own function (the web part's fall), the
//                  one their place is ridden by. The leaf's own law (the painted roof, the hills'
//                  cloth, the twigs' leaves, the birds' wings) reads no height): at the leaves the sun's colour as
//                  the air has dyed it, a soft line between lit and shaded sides and the forest's green
//                  bounce whole; at the ring's rim the sun 1.39 times as light and less dyed, the line
//                  sharper, the bounce three quarters. The loose web drifts by its own height the same way,
//                  and the seeds stop where the sky goes dark (their own height).
//   FAR CABLES FROM OTHER HILLS (mend T): with the visit's ropes UP TO a dozen cables in sight, the rest as
//                  threads from hills 3.2 to 6.5 km off, at bearings of their own stream; the first two
//                  made carry a far climber each. (Mend U: the count is what is ASKED; a line the rules
//                  turn away in all its tries is not made. By the code reader's count on seeds 1 to
//                  200, five visits make fewer than asked: seed 15 has 2 of 3; 87, 110 and 144 have 5 of
//                  6; seed 70 has ONE of 2, and so one far climber.)
//                  None is made that, from any place on the road, would lie within 1.25 radii of
//                  the Moon's middle or of the sun's: the hair is the only line toward the Moon (the web
//                  part: a rule of the whole road, every place on it alike, as the 60 m the lines keep
//                  from it). The gliders' rounds beside the lower cable go by the same rule of the whole
//                  road: none is laid where a glider of it could stand within 1.15 radii of the Moon's
//                  middle or the sun's from any place on the road (the life part, makeBirds).
//                  No leaf of the roof and no rope's shaded side is drawn under the picture's
//                  own black (the forest part's cnDeep, the common part's cmDeepAt: by the thing's height).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, buildSecond, makeFarClimber, bodyShape, BODY, GAIT, LIMBS, LIMB_REACH } from '../parts/cables-to-the-moon.js';
import { makeShared, makeFrame, cableDip, C, DEG, hump, roofAt, peakH, ROOF_Y, AIR_H, AIR_RHO, HAZE_RHO } from '../parts/cables-to-the-moon-common.js';
import { makeHeavens } from '../parts/cables-to-the-moon-sky.js';
import { makeCanopy, makeLeaves, makePeakMesh, makeCrownTrees, roofCrowns, hillCrowns, crownGap, LOD_M } from '../parts/cables-to-the-moon-forest.js';
import { makeCables, dealCables, cableStill, footRoots, makeHub, makeStrands, makeCableHair } from '../parts/cables-to-the-moon-web.js';
import { makeRooted, makeTraps, makeKites, makeBirds, COVEY } from '../parts/cables-to-the-moon-life.js';

// ---------------------------------------------------------------- 1. layout
// in from the side, gliding down over the roof, and up the flank of the anchor peak on the side of it away from the sun,
// passing 42 m from the middle of the cable's foot (35 m from the rope). ARRIVE is the arrival's line on the map
// (x, z): from its second point (424 m from the hill) it crosses the hollow that rings our hill and the ridge
// inside it, to its fifth point at the hill's foot. The road's 21 knots stand along that line 21.86 m apart; 20
// take their heights from the glide and from the roof as it lies on the visit, whichever is the higher (see layArrival below), the last is the typed foot; OVER_HILL are the road's two
// typed knots over the hill (x, y, z): the first is the arrival's last knot.
const ARRIVE = [[380, -20], [295, -95], [200, -160], [110, -208], [56, -300]];
const OVER_HILL = [[56, 38, -300], [42, 88, -408]];
// ... then beside the cable: (s along it, x to its right, m above it): behind the climber, along its left flank,
// out ahead of it; then (round Q, R6 a and d) THE CLIMB BESIDE THE CABLE: leaving the body's bud (it is passed
// near the cable's 430th metre) the road swings in to the cable, a little under its level on the side away from
// the sun, and runs beside it to the ring's middle at the cable's 701st metre.
// (mend R, X1) THE SWING-IN ENDS PAST THE FOREMOST HOLD, BY SIZES. The climber's foremost hand holds the cable up
// to 230.5 m ahead of its body's middle (that limb's place, 205 m, and half its longest stance, 25.5 m), and a
// hand counts as a ball of 2.5 cable radii about the cable's middle where it holds (8.4 m there). On the
// slowest visit a stream can deal (pace 1.6) the body's middle stands at the cable's 359th metre when the eye
// comes level with that hold, the cable's 589th metre (on faster visits earlier). So up to the cable's
// 590th metre the road keeps the 20 m of the limbs' rule and that ball, 28.4 m, from the cable's middle line
// (the knot there stands 31.9 m off), and only then closes on the rope: 26 m off level with its 610th metre,
// 21 to 23 m (the rope is 6.5 m through: three and a half of its breadths) from its 640th metre to the ring.
// One road for every visit: what clears the slowest clears the rest. (Round Q's knots closed to 18 m by the
// 600th metre: on every visit of pace under 2.0 a hand held the cable within 20 m of the eye, 12 m at the least.)
// With these knots the road's turn on the map is drawn out, and the engine's bank on it is 5.7 degrees at the
// most past the cable's 300th metre (round Q's knots: 11.3, by the same count). THE LAST 50 M: from the knot 4.2 m above the ring's axis 50 m short of
// the ring the road comes down to the ring's middle along a line 4.8 degrees flatter than the cable's own (19.2
// degrees up from level, the cable's 24): it crosses the ring's axis AT the ring and does not run along it,
// so the land the cable came from still lies ahead of the eye and under it at the last.
// CABLE_KEEP: the road's one clearance of the cable it climbs: from the bud on it is never nearer the cable's
// middle line than 16 m (a count, not a keep: facts.sweep counts it on every layout: 20.4 m).
const BESIDE = [[84, -50, -30], [180, -112, -56], [300, -140, -68], [430, -104, -60], [520, -56, -36], [590, -26, -18.5], [651, -18.4, -9.6], [701, -18.4, -13.8]];
// how far each of those stands off again for every step the flank's rule has to move the route out (see the flight)
const WIDE = [0, 0.8, 1, 0.8, 0.25, 0, 0, 0];
const CABLE_KEEP = 16, BUD_S = 440;       // (the cable's metre past which the bud never is while we pass: the clearance is read from there)
// ANOTHER OF THE KIND COMES DOWN THE NEXT CABLE (R6 b). The next cable over on the road's side is the one from
// the first far hill (PEAKS[1], which a visit always has): from the ring it runs back and out to the road's
// side, 45 degrees off our cable's line on the map, falling. NEXT_KEEP: the road is never nearer that cable than
// 60 m anywhere the traverser's body can be on its habit (sweep; mend W: the eye is never nearer its middle
// than that at any of six entry clocks either, thrown on in build). Its size (0.42 to 0.5 of ours: 92 to 110 m
// long: a lesser one of the kind on a lesser cable, not the hero's twin), where it is on its cable when the
// world's clock starts and where its round stands are its own stream's ('traverser'); it comes down at the
// kind's own pace for its size (GAIT.speed x its size: 0.79 to 0.94 m a second, 38 to 45 m in a flight).
// TRAV_GO (mend W, W2): ITS HABIT ON THE WORLD'S CLOCK. Until this mend it went down its cable for ever: its middle
// would have come to the rope's foot on the far hill after 17 to 21 minutes of the world's clock (the rope
// is about 1,100 m long), and the text did nothing sensible there (its line ran on past the rope's foot,
// into the hill); from 180 to 240 s by the visit (the reader's count) its foremost hands were on rope that
// sinks with the land while they held a straight line; and a visit that came in with the clock at 300 s
// found it 240 to 280 m farther down than the third pull was laid for. IT NOW WORKS ONE STRETCH OF ITS CABLE, DOWN AND BACK, FOR EVER: `down` seconds down at the
// kind's pace, `turn` seconds to slow, stop and start back, as long backing up the same holds, as long to
// turn again: a round of 104 s over a stretch of 40 to 47 m of rope, under half its own length, 109 to 196 m
// from the ring (travGo in the build). `turn` WAS SETTLED ON THE WHOLE FIELD: with 16 s the top of the stretch lay
// 4 to 4.8 m nearer the ring than where its stream starts it, and the sweep of 200 layouts found the road
// 58.45 m from the next cable where its body can be, under NEXT_KEEP; with 4 s it is 1 to 1.2 m, and the
// sweep's least is in the report. `down` is the flight's 48 s, so that a visit that came in at second 0
// sees what it saw before this mend: the second going down from where its stream put it, all the flight
// long. SAID PLAINLY: it does not turn its body round: it backs up, hand over hand, the way it came (a
// creature with no head and a bud for a leading end; the gait is run backward, each hand taking again the
// hold it left). The other habit was weighed and not taken: to go on down to the rope's foot and back (a
// round of 34 to 42 minutes) leaves it anywhere on a kilometre of its rope by the clock: for most clocks far
// below the stretch mend R's X3 put it on, out over the roof where the road never comes level with it.
// MEET (mend W, W2): what the meeting is tested at in build. `clocks`: the entry clocks of the mend's note. `phases`:
// so many entry clocks an even share of the habit's round apart (13: 8 s), each flown at `paces` times the
// film's pace (the visitor's pace control scales the flight and never the world's clock: 12, hurried to the
// portal; 0.4, the slowest): the whole of the second's course, at every clock a visit can bring to the
// meeting. `turn`: THE DECLARED BOUND on the look's turn about the meeting, degrees to a second of film: 33.5, MEND
// R'S OWN BOUND, the flight's greatest turn (at the hill's foot, 33 to 33.5): the look never turns faster
// about the meeting than it already does there. (SAID PLAINLY: I first declared 28, on 37 visits at the
// film's pace; over the whole round at three paces the run on seeds 1 to 100 stopped the build on seed
// 27 at 28.8. The greatest found on the whole field is in the report.)
// (mend R, X3) WHERE IT STARTS: 110 to 150 m down its cable from the ring, so that when the road comes level with
// it, it is on the stretch of its cable that lies level with our cable's 480th to 540th metre: past the place
// where the hero's bud is passed (our cable's 440th to 470th metre, by the visit's pace) and short of where
// the ring takes the eye (its 601st). The meeting falls at 0.82 to 0.87 of the way by the visit's deal, 93 to
// 110 m off. (Round Q: 200 to 240 m, with no reason: the meeting fell at 0.76 to 0.78 on seeds 7, 3 and 2, while
// the hero's bud was still being passed and the eye was the hero's.) Not nearer the ring than 110 m: the
// largest of them is 55 m long ahead of its middle, and NEXT_KEEP is counted over every place its body can be.
// TRAV_LOOK (mend R, X2): THE EYE IS DRAWN TO IT ABOUT THE PLACE WHERE THE ROAD COMES LEVEL WITH IT (PLACE.level,
// found on the road: where the eye is nearest its body's middle): from `before` metres of road short of that
// place to `after` metres past it, brought round and let go over `ramp` metres at each end: with the numbers
// below it is whole from 90 m to 30 m short of that place, still nine tenths as we come level, and gone 140 m
// past: the traverser is found ahead and to the side, watched as it is passed, and let go as it falls behind. (Round Q began the pull where it was already level and had it whole 110 m later, when
// it was behind: the eye swung back over its shoulder, 49 to 61 degrees a second.)
// THE FOUR NUMBERS WERE SETTLED ON THE WHOLE FLIGHT, NOT ON A PICTURE: in the page, on seeds 7, 3 and 2, 108 sets of
// them were tried (before 140 to 320 m, after 100 to 180, ramp 100 to 200, weight 0.4 to 0.8), and for each
// the eye's turn was counted along the whole road by the engine's own pose, with the seconds the traverser's
// middle stands within 30 degrees of the middle of the look while it is within 250 m. These four: the
// greatest turn from the cable's foot on is under 20 degrees a second on all three (the flight's greatest is
// still at the hill's foot, 33 to 33.5), and it stands within 30 degrees for about 8 of the 18 s.
// (mend W: THAT COUNT WAS AT THE ENGINE'S PACE, AT 480 STEPS, AT ENTRY CLOCK 0 ONLY, on three visits. Counted again in
// build at 2 m steps on every visit, at the film's pace and at the engine's own, over the whole round of its
// habit: see MEET and the report.)
// A stronger or a shorter pull turns faster; a weaker one leaves it at the picture's edge.
const NEXT_KEEP = 60, TRAV = { size: [0.42, 0.5], from: [110, 150] }, TRAV_LOOK = { before: 260, after: 140, ramp: 170, weight: 0.7 };
const FILM = 48, TRAV_GO = { down: 48, turn: 4 }, TRAV_SPAN = [-TRAV_GO.turn / Math.PI, TRAV_GO.down + TRAV_GO.turn / Math.PI];
const MEET = { clocks: [0, 20, 40, 60, 120, 300], turn: 33.5, paces: [1, 12, 0.4], phases: 13 };
// (mend W, W1) RING_KNOT: a rope is free for a hand up to this many metres from its end at the ring, where it goes into
// its knot (the web part's makeHub: turns of rope 3.1 to 3.9 m in radius and up to 1 m thick round the ring at
// every tie). A hold the gait deals nearer the ring than that, or past the rope's end, is taken there.
const RING_KNOT = 6;
// the hollow that rings our hill lies this many of the hill's own radii out from its middle (relief(), the common file)
const HOLLOW_AT = 3.02;
// the anchor peaks: ours first (the cable's root is its top), then the others the brief names, then two a visit may add
const PEAKS = [[0, -400, 95, 180], [760, -260, 88, 170], [-900, -700, 104, 200], [-520, -1750, 96, 190], [430, -2150, 110, 210], [1350, -1250, 92, 180], [-1500, -1500, 100, 200], [150, -2600, 106, 200],
  [-1250, -2350, 98, 190], [1700, -2300, 102, 200]];
// the sphere the forest is bent over as we climb (its top lies under the upper cable), and how far the whole roof
// sinks. (mend R, V2 b) THE FAR LAND GOES NEARER LEVEL INTO THE AIR: the sphere is twice as large (100 km at the
// ring; it was 50), and the roof's fall under the eye is what it was (the sink, 170 m; the sphere itself adds
// under 6 m anywhere beside the cable). By the ring the green edge lies 5.8 degrees under level (it lay 8.2)
// and in a picture 360 rows high its two ends hang 14.5 rows lower than its middle (20.6): counted along the
// whole road on seeds 7 and 3 by the engine's own pose, not on a picture. The land's edge stays in the picture
// higher up the climb. One sphere still: the roof, what stands on it, the air and the sky's band on its limb
// all read this one number.
const BEND = { qz: -1500, radius: 100000, sink: 170 };
// every stream of chance this world uses, one to a kind of thing, in the order the things are built. Each is
// made from the visit's seed and its own name alone (the kit's makeRng and hashSeed), so no stream's deal
// depends on this list's order, on any other stream, or on how many numbers another stream has drawn.
const STREAMS = ['clock', 'look', 'pace', 'sky', 'crowns-hill', 'crown-kinds', 'twigs', 'phase', 'gait', 'sacs', 'pods', 'limbs', 'beards', 'felt', 'fliers',
  'cables', 'collar', 'ring', 'guys', 'strands', 'loose-web', 'cable-hair', 'traffic', 'fluff', 'keys', 'boughs', 'suckers', 'watchers',
  'traps', 'trap-belt', 'coveys', 'kites', 'flocks', 'gliders', 'covey-birds', 'walker', 'traverser', 'far-lines', 'far-climbers', 'high-gliders'];

// THE ARRIVAL GLIDES IN OVER THE ROOF (mend P; it rode the roof before). Its 21 knots stand 21.86 m apart along ARRIVE (the line is 437.2 m: 20 knots are
// laid here, the last is the typed knot at the hill's foot; no leaf near the line is more than 12 m from a knot). Each stands `over` metres over THE HIGHEST LEAF WITHIN 12 m
// OF IT: the built crowns as they stand on the visit, and the painted roof. `over` is 12 m; where the road
// between two knots would still come within KEEP = 10 m of a leaf, the knot nearest that place goes up by what
// is wanting (half a metre at least), toward 15 m (a knot past 15 m is counted: facts.road.past15). On the last
// stretch as on every other, a knot is no lower than THE GLIDE (mend P, Q4 a): the road comes in level with the
// hill's top (GLIDE_TOP: the hill's own 95 m over the roof) and glides down to the foot's typed 38 m, steepest
// first (by the power 1.5 of the share of the line still to fly: 11 degrees down at the start, level at the
// foot), so the roof with its life lies under the eye and no crown ever stands before it. No crown is moved, sunk
// or left out for the road. This is the road asking one clearance of the roof.
const KEEP = 10, REACH = 12, HILL_KEEP = 22, GLIDE_TOP = ROOF_Y + PEAKS[0][2];
// the knots' places on the map, and how far along the last stretch each is (0 before it)
function arrivalLine(mx) {
  const P = ARRIVE.map((p) => [p[0] * mx, p[1]]), seg = [], out = []; let L = 0;
  for (let i = 0; i + 1 < P.length; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push([L, l]); L += l; }
  const n = Math.ceil(L / 23);
  for (let k = 0; k <= n; k++) { const d = (k / n) * L; let i = seg.length - 1; while (i > 0 && d < seg[i][0]) i--; const t = clamp((d - seg[i][0]) / seg[i][1], 0, 1);
    out.push({ x: lerp(P[i][0], P[i + 1][0], t), z: lerp(P[i][1], P[i + 1][1], t), s: k / n }); }
  return out;
}
// the highest leaf within REACH of (x, z): the painted roof there, and every built crown that reaches in
function leafTop(x, z, crowns, roofFn) {
  let top = roofFn(x, z);
  for (let a = 0; a < 8; a++) { const c = Math.cos(a * Math.PI / 4), s = Math.sin(a * Math.PI / 4); top = Math.max(top, roofFn(x + c * REACH, z + s * REACH), roofFn(x + c * 6, z + s * 6)); }
  for (const c of crowns) { const d = Math.max(Math.hypot(x - c.x, z - c.z) - REACH, 0), R = c.R * 1.28; if (d < R) top = Math.max(top, c.y + c.sq * Math.sqrt(R * R - d * d)); }
  return top;
}
// one walk of the arrival: `over` is changed in place; done when the road is clear (the build hands back between walks)
function layStep(line, tops, crowns, roofFn, tail, over, st) {
  const n = line.length - 1, p = new THREE.Vector3();
  const knots = line.map((q, k) => (k === n ? OVER_HILL[0].slice() : [q.x, Math.max(tops[k] + over[k], lerp(OVER_HILL[0][1], GLIDE_TOP, Math.pow(1 - q.s, 1.5))), q.z]));
  knots[n][0] = line[n].x; const skim = knots.concat([[OVER_HILL[1][0] * st.mx, OVER_HILL[1][1], OVER_HILL[1][2]]]), path = makePath(skim.concat(tail)); let at = 0, least = Infinity;
  for (let d = 0; d <= 620; d += 2) { path.posAtDist(d, p); let g = p.y - roofFn(p.x, p.z); for (let c = 0; c < crowns.length; c++) g = Math.min(g, crownGap(p, crowns[c])); if (g < least) { least = g; at = d; } }
  if (least >= KEEP) return { skim, over, least, done: true };
  path.posAtDist(at, p); let k = 0, best = Infinity;
  for (let i = 0; i < n; i++) { const d = Math.hypot(p.x - line[i].x, p.z - line[i].z); if (d < best) { best = d; k = i; } }
  over[k] += Math.max(0.5, KEEP - least);
  return { skim, over, least, done: false };
}
function layArrival(mx, crowns, roofFn, tail) { const line = arrivalLine(mx), tops = line.map((q) => leafTop(q.x, q.z, crowns, roofFn)), over = line.map(() => 12); let r; for (let guard = 0; guard < 200; guard++) { r = layStep(line, tops, crowns, roofFn, tail, over, { mx }); if (r.done) break; } return r; }
// THE SEEDED LOOK of a visit, dealt from its stream 'look' (build() deals it; the report's sweep deals other seeds' looks to count them)
const dealLook = (lr) => ({
  mirror: lr.chance(1 / 2),                                            // sun on the right; the pass is along the flank away from the sun
  sun: lr.pick(['gold', 'gold', 'red', 'veiled']),
  moon: lr.pick(['gibbous', 'gibbous', 'green', 'crescent']),
  cables: lr.int(5, 9),                                              // how many other cables come to the ring
  peakR: lr.range(100, 125), peakP: lr.range(1.8, 2.3), ragged: lr.range(0.6, 1.5),      // the hill: a broad cone of crowns
  storm: lr.chance(1 / 4),                                            // a seed storm streaming up past the cable
  fliers: lr.pick([36, 90, 90, 190]), pods: lr.int(9, 30),
});
const mix3 = (out, a, b, t) => out.copy(a).lerp(b, t);
const _s = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3();

export default {
  id: 'cables-to-the-moon',
  name: 'Cables to the Moon',
  category: 'books',
  placeKind: 'bizarre',
  book: 'Hothouse',
  author: 'Brian Aldiss, 1925 to 2017',
  weirdness: 0.9,
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = vary.density ?? 1;
    const scene = new THREE.Scene(), time = { value: 0 }, updaters = [];
    // ---- the streams of chance: each from the visit's seed and its own name (see STREAMS)
    const visit = ctx.seed ?? Math.floor(ctx.rng() * 1e9);
    const fk = {}; for (const k of STREAMS) fk[k] = makeRng(hashSeed(visit + ':' + k));

    // everything that moves on the world's clock in a shader (swells, gusts, the sun's skin, glints, wings) starts
    // from a time of this visit's own
    const T0 = fk.clock.range(0, 900);
    // ---- the seeded look of this visit
    const look = dealLook(fk.look);
    const mx = look.mirror ? -1 : 1;
    // rad: the disc's radiance at its centre. The picture's tone curve turns anything over about 1.4 white, so the
    // disc is kept where its surface shows (the brief's 3.5 is a white hole here)
    const SUNS = { gold: { core: '#FFDC7A', limb: '#F08A24', radius: 7.5, rad: 1.25, veil: 0, col: '#FFE2A6', I: 3.4 },
      red: { core: '#FFB45A', limb: '#D8501A', radius: 9, rad: 1.15, veil: 0, col: '#FFD09A', I: 3.2 },
      veiled: { core: '#FFD27E', limb: '#EE9A44', radius: 12, rad: 1.3, veil: 0.55, col: '#FFE2B0', I: 2.7 } }, sunL = SUNS[look.sun];
    // the pass beside the cable lies on the side of it AWAY from the sun's bearing (a bearing of the world, dealt
    // by the visit's mirror): the body hangs between us and the sun, its hide, limbs, bladders and beard rim-lit
    const shared = makeShared({ mirror: look.mirror, away: true, sunCol: sunL.col, sunI: sunL.I, hillR: look.peakR });
    // (a part that is not handed one of its streams says so: cmStream in the common part. None is missing today.)
    shared.visit = visit; shared.missing = [];
    // THE VISIT'S OWN PACE: we fly 1.6 to 2.6 of the climber's strides to one limb's turn (stream 'pace'), so a
    // round of its seven limbs takes 7 x pace x 60 m = 672 to 1,092 m of our road, and the body stands where that
    // puts it when we pass.
    const ours = fk.pace.range(1.6, 2.6), gaitClockV = (go) => (go / (GAIT.limbs * ours * GAIT.stride)) * GAIT.T;
    const U = shared.U, CB = shared.cable, HUB = shared.hub;
    // THE FAR HILLS ARE UNLIKE: each is 0.8 to 1.25 of its typed height, 0.75 to 1.45 of its typed width and
    // of its own slope (hollow-flanked 1.3 to 2.5), by its own number in the list (no draw: nothing deals for
    // it), and as ragged with crowns as ours (2.4 to 3.6). Ours is the visit's (the look).
    const fr1 = (x) => x - Math.floor(x);
    const peaks = PEAKS.slice(0, 1 + look.cables).map((p, i) => ({ x: p[0] * mx, z: p[1], h: i ? p[2] * (0.8 + 0.45 * fr1(i * 0.61)) : p[2], r: i ? p[3] * (0.75 + 0.7 * fr1(i * 0.43)) : look.peakR,
      p: i ? 1.3 + 1.2 * fr1(i * 0.37) : look.peakP, ribs: 7 + (i % 4), ragged: i ? 2.4 + 1.2 * fr1(i * 0.29) : look.ragged, thick: i ? 5 + ((i * 1.7) % 4) : 14 }));
    // every hill throws its shade on the roof (cmHillShade in the common part)
    // (O5: a far hill is no lone cone: a second hump and a shoulder stand beside its top, by the hill's own number)
  peaks.forEach((pk, i) => { if (!i) return; const a1 = 6.2832 * fr1(i * 0.77), a2 = a1 + 1.7 + 2.6 * fr1(i * 0.53), r1 = 0.17 + 0.1 * fr1(i * 0.31), r2 = 0.3 + 0.14 * fr1(i * 0.19);
    pk.lumps = [{ x: r1 * Math.cos(a1), z: r1 * Math.sin(a1), k: 0.2 + 0.14 * fr1(i * 0.47), s: 0.085 }, { x: r2 * Math.cos(a2), z: r2 * Math.sin(a2), k: 0.16 + 0.1 * fr1(i * 0.83), s: 0.13 },
      { x: -0.5 * Math.cos(a1), z: -0.5 * Math.sin(a1), k: 0.1, s: 0.2 }];
    // (mend P, Q1 d: NO TWO FAR HILLS ARE OF ONE OUTLINE. By the hill's own number it is one of three kinds: a LONG
    // RIDGE (four more humps in a line through its top, falling away each way), a GROUP of two or three humps as
    // high as its top, or the hill with a shoulder as above; the heights and places of the humps go by its number)
    const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2), kk = 0.45 + 0.3 * fr1(i * 0.67);
    if (i % 3 === 1) pk.lumps.push({ x: 0.3 * c1, z: 0.3 * s1, k: kk, s: 0.15 }, { x: -0.3 * c1, z: -0.3 * s1, k: kk * 0.9, s: 0.15 }, { x: 0.56 * c1, z: 0.56 * s1, k: kk * 0.6, s: 0.14 }, { x: -0.56 * c1, z: -0.56 * s1, k: kk * 0.5, s: 0.14 });
    else if (i % 3 === 2) { pk.lumps.push({ x: 0.42 * c1, z: 0.42 * s1, k: kk + 0.15, s: 0.14 }, { x: 0.46 * c2, z: 0.46 * s2, k: kk, s: 0.13 }); if (i % 2) pk.lumps.push({ x: -0.4 * (c1 + c2) / 2, z: -0.4 * (s1 + s2) / 2, k: kk * 0.7, s: 0.12 }); } });
  peaks.forEach((pk, i) => { if (i < 10) U.uHills.value[i].set(pk.x, pk.z, pk.h, pk.r); });
    // ---- the roof's built crowns (the pattern's own, as they stand), then the arrival laid over them
    const roof = roofCrowns(shared.hump, ARRIVE.map((b) => [b[0] * mx, b[1]]).concat([[OVER_HILL[1][0] * mx, OVER_HILL[1][2]]]), peaks[0]);
    await ctx.yield();
    let low; { const line = arrivalLine(mx), tops = line.map((q) => leafTop(q.x, q.z, roof, shared.roof)), over = line.map(() => 12), tail = BESIDE.map((b) => CB.at(b[0], b[1], b[2]).toArray());
      await ctx.yield();
      for (let guard = 0; guard < 200; guard++) { low = layStep(line, tops, roof, shared.roof, tail, over, { mx }); await ctx.yield(); if (low.done) break; }
      low.line = line; low.tops = tops; }
    const skim = low.skim;

    // ---- the flight
    // THE FLANK'S RULE: the route passes the climber's body no nearer than 1.2 times the body's own thickness at
    // that point of its length (metres from the hide; the thickness is its greatest width there), so that its
    // outline, its limbs on the rope and the sky beyond it are seen together. The climber keeps its cable and its
    // pace: it is the route that stands off, by 6 m more at a time until the rule holds at every 3 m of it. (The
    // knots as typed clear the rule by a hair, so whether the loop acts is the visit's: its pace puts the body up
    // to 20 m elsewhere when we pass, and the lie of its arrival changes the metres flown to that place.
    // facts.flankSweep() tries 300 paces across what a visit can deal on this visit's road and counts how many
    // move it (the report has the counts); facts.flank.moved says what this visit's own pace did.)
    let path;
    await ctx.yield();
    const hide = []; { const sh = bodyShape(ctx.noise, 0); for (let j = 0; j <= 44; j++) for (let k = 0; k < 16; k++) { const h = sh.point(j / 44, (k / 16) * Math.PI * 2); hide.push(h.x, h.y, h.z, 2 * BODY.a * Math.max(sh.prof(j / 44), 0)); } }
    const flankFor = (pace, wide, f) => {
      const q = new THREE.Vector3(), p = new THREE.Vector3(), pth = makePath(skim.concat(BESIDE.map((b, i) => CB.at(b[0], b[1] - wide * WIDE[i], b[2]).toArray())));
      f.least = Infinity; f.moved = wide;
      for (let d = 0; d <= pth.length; d += 3) {
        CB.coords(pth.posAtDist(d, p), q); const pz = GAIT.s0 + GAIT.speed * (d / (GAIT.limbs * pace * GAIT.stride)) * GAIT.T - q.x; let best = Infinity, thick = 0;
        for (let k = 0; k < hide.length; k += 4) { const gx = hide[k] - q.y, gy = hide[k + 1] - q.z, gz = hide[k + 2] - pz, g = gx * gx + gy * gy + gz * gz; if (g < best) { best = g; thick = hide[k + 3]; } }
        best = Math.sqrt(best);
        // (where the body tapers to nothing at its ends the rule asks nothing; it is read where it is 12 m thick or more)
        if (thick >= 12 && best / thick < f.least) { f.least = best / thick; f.at = d; f.gap = best; f.thick = thick; }
      }
      return pth;
    };
    const flankFacts = { least: Infinity, at: 0, gap: 0, thick: 0, moved: 0 };
    for (let wide = 0; wide <= 60; wide += 6) { path = flankFor(ours, wide, flankFacts); await ctx.yield(); if (flankFacts.least >= 1.2) break; }
    await ctx.yield();
    // our hill never comes within 13 m of the flight where the flight is over it: steepen it until it clears (a
    // rule of the land, whatever the visit drew), tried at every 4 m of the route. (A CHECK: the road's knots over
    // the hill are typed to clear every hill a visit can deal; facts.sweep() counts how often this acts.)
    const hillSteps = { n: 0 };
    { const pk = peaks[0];
      for (let guard = 0; guard < 40; guard++) {
        let worst = Infinity;
        for (let d = 0; d <= path.length; d += 4) { const p = path.posAtDist(d); if (Math.hypot(p.x - pk.x, p.z - pk.z) < pk.r) worst = Math.min(worst, p.y - peakH(pk, p.x, p.z)); }
        if (worst > 13) break; pk.p += 0.05; pk.r -= 2; hillSteps.n++;
      } }
    await ctx.yield();

    // ---- PLACES on the route, each found by walking it in even steps of 2 m (then halving): never a typed u
    const lp = new THREE.Vector3(), lc = new THREE.Vector3();
    const cross = (test) => { for (let d = 2; d <= path.length; d += 2) if (test(path.posAtDist(d, lp))) { let lo = d - 2, hi = d; for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (test(path.posAtDist(m, lp))) hi = m; else lo = m; } return hi; } return path.length; };
    // (round Q, R1: there is no mist in the hollows any more. Two heights it gave are kept as what they are: the
    // air the kites fish, 9.5 to 14.5 m over the roof, and the height at which the land begins to fall away under
    // the eye, 30 m: over the kites, the flocks and the emergent crowns.)
    const KITE_AIR = [9.5, 14.5], HAZE_TOP = 30.1, RIM_Y = HUB.H.y - HUB.R * CB.n.y;
    // the clear air's scale height is AIR_H = 320 m (the common file; the same number the air is drawn with): its
    // density has halved 320 x ln 2 = 222 m above the leaves
    // THE AIR'S THINNING, one function of a height and the one scale height the air is drawn with: 0 at the
    // leaves, 1 at the ring's rim. THE SKY takes it for the eye's height (its colours, the sun's glow and
    // reddening, the stars, the high cloud): continuously over the whole climb, with no threshold and no window.
    const thinning = (y) => clamp((1 - Math.exp(-Math.max(y - ROOF_Y, 0) / AIR_H)) / (1 - Math.exp(-(RIM_Y - ROOF_Y) / AIR_H)), 0, 1);
    // (the shaders work the same function for a POINT's own height, taken before the land's sink: the fill a
    // point gets, cmAmb in the common file)
    U.uAirK.value.set(ROOF_Y, AIR_H, 1 - Math.exp(-(RIM_Y - ROOF_Y) / AIR_H), 0);
    const PLACE = {
      // where we come over the foot of the hill
      peakFoot: cross((q) => Math.hypot(q.x - peaks[0].x, q.z - peaks[0].z) < peaks[0].r),
      // where we come level with the foot of the cable
      cableFoot: cross((q) => CB.coords(q, lc).x > 0),
      // where we come level with the ring's lower rim
      ringRim: cross((q) => q.y > RIM_Y),
      // where the road crosses the hollow that rings our hill
      hollow: cross((q) => Math.hypot(q.x - peaks[0].x, q.z - peaks[0].z) < HOLLOW_AT * peaks[0].r),
      // (level: where the road comes level with the traverser on the next cable: found below, once it stands)
    };

    // ---- the script: pure functions of where the eye is
    // THE SHARE OF THE CLIMB: 0 while the eye is within 30 m of the leaves (HAZE_TOP: over all that flies low), 1
    // when the eye is level with the lower rim of the ring. The fall and bend of the forest follow this one number
    // (declared in the header); the sky follows thinning().
    const rise = (u) => clamp((path.pointAt(u, lp).y - HAZE_TOP) / (RIM_Y - HAZE_TOP), 0, 1);
    // the forest's bend and sink: eased at both ends
    const climb = (u) => { const t = rise(u); return t * t * t * (t * (t * 6 - 15) + 10); };
    // (mend V) bendTo(u): THE LAND'S BEND AND SINK AT THE SHARE u OF THE ROAD, set in the ONE place: the frame calls
    // it, and so do the limbs' walk and the test of the hands in build, which must stand in the land the flight
    // has at that place of the road (the climber's hands go down with the rope as the land falls)
    const bendTo = (u) => { const w = climb(u); U.uBend.value.set(0, BEND.qz, w / BEND.radius, BEND.sink * w); return w; };
    // the climber: where its middle is on the cable when we have flown so far, and how many metres up the cable we
    // are ahead of that middle. Its tail is half its length (110 m) behind its middle, its bud as far ahead; it is
    // DEEP = 70 m from ridge to belly.
    const TAIL = -BODY.len / 2, BUD = BODY.len / 2, DEEP = BODY.b * (BODY.up + BODY.down);
    const sClimber = (u) => GAIT.s0 + GAIT.speed * gaitClockV(u * path.length);
    const lead = (u) => CB.coords(path.pointAt(u, lp), lc).x - sClimber(u);
    // brisk over the leaves; we slow over one body's length (220 m) ending at its tail and keep slow all along it
    // (it is what we came to see); we quicken again over one body's length from its bud
    const pace = (u) => { const l = lead(u); return 1.15 - 0.35 * smoothstep(TAIL - BODY.len, TAIL, l) + 0.2 * smoothstep(BUD, BUD + BODY.len, l); };

    await ctx.yield();
    // ---- sky: one kit dome whose colours follow the air's thinning at the eye (thinning(): 0 at the leaves, 1
    // at the ring's rim) through five stops a quarter of it apart: cream at the roof (warmer overhead than at the
    // horizon), amber (whole where the eye is 58 m up), rose (129 m), violet (220 m), and the night with stars
    // (the rim, 346 m): never blue, and never in one step. BY PLACES ON THE CABLE (the road beside it, said once):
    // amber over the hill, 60 m short of the cable's foot; rose beside the cable's 220th metre; violet beside
    // its 437th (the bud's place); night beside its 636th, level with the ring's lower rim, and no darker after.
    // (mend R, V3: THE NIGHT IS A DEEP VIOLET, NOT BLACK. Its last stop was near black overhead (under a
    // hundredth of white) over a far lighter horizon, so a look up at the ring was a black sky and a look out,
    // a breath earlier, a violet one: one sky read as two. Now the last stop is between two and three times
    // lighter, overhead and at the horizon, the same hue as the violet before it: the stars stand on it, the land's far edge and the
    // air on it stay seen to the last, and the way from violet to night is the same law it was.)
    // (mend S, G3: THE TOP OF THE NIGHT IS VIOLET-BLACK, NOT NAVY, AS THE PICTURE SHOWS IT. The engine's film
    // curve and this world's contrast take the last few hundredths off every channel alike, so a dark violet
    // written here with little red reached the screen with NONE: the violet stop overhead ('#46286A') showed as
    // (0, 0, 57) of 255, a navy, and the night's top ('#1E1038', its middle '#2E1C50') as black over navy; that
    // is the dark blue seen from the upper reach, and it is why mend R's "deep violet, not black" did not show
    // overhead. The three colours are written now so that what is SHOWN is the violet: the violet stop overhead
    // '#604E6C' (shown (45, 5, 64)), the night overhead '#464248' (shown (20, 6, 26), a violet-black) and its
    // middle '#4C4050' (shown (39, 6, 48)). Three colours of the law's fifteen, all in its dark end; the two
    // horizons and the stops before are as they were. Counted by fix12/cables-to-the-moon-grade2.py, which
    // follows the grade's own lines; nothing in the flight reads it.)
    // The kit's sun disc is off (ours has a surface), its halo stays
    const SKY = { zen: [C('#D8C27A', 0.64), C('#C0903E', 0.6), C('#8E4E5E', 0.56), C('#604E6C', 0.6), C('#464248', 0.85)],
      mid: [C('#E6D48C', 0.76), C('#D8A654', 0.7), C('#B06A72', 0.62), C('#5E3C7C', 0.62), C('#4C4050', 0.9)],
      hor: [C('#F6E8B4', 0.92), C('#F0CA80', 0.86), C('#E09E84', 0.78), C('#A0708E', 0.7), C('#52406F', 0.8)] };
    const ramp = (out, a, t) => { const x = clamp(t, 0, 1) * (a.length - 1), i = Math.min(a.length - 2, Math.floor(x)); return mix3(out, a[i], a[i + 1], x - i); };
    const sky = makeSky({ rng: fk.sky, preset: 'day', zenith: SKY.zen[0], mid: SKY.mid[0], horizon: SKY.hor[0], ground: SKY.hor[0], horizonPow: 2.6, midPow: 1.3, groundFalloff: 0.01,
      sunElevation: 15, sunAzimuth: -38 * mx, sunColor: sunL.col, sunSize: sunL.radius, sunIntensity: 0, sunGlow: 0.3, sunGlowTight: 0.5,
      scatterColor: '#FFE9B0', scatter: 0.22, scatterPow: 6, stars: 0.001, twinkle: 0.4, starDensity: 0.14, clouds: false, clouds2: false, bodies: [] });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(SKY.hor[0].clone(), AIR_RHO);
    await ctx.yield();
    // The Moon hangs 38 degrees to the side of the cable's line away from the sun and 31 degrees up (the strands
    // that run on from the ring lean over to it), so the ring is seen beside it against the dark
    // ONE SIZE for the whole visit (round Q, R6 c): JUST UNDER THE SUN'S OWN SIZE ON THE SAME VISIT, 0.95 of the
    // sun's radius: 7.1 beside a gold sun (7.5), 8.55 beside a red one (9). A VEILED sun's 12 degrees are its
    // veil's spread, not its disc; the Moon stands in clear sky away from that veil, so beside a veiled sun it is
    // as large as beside the largest bare one, 8.55 (mend R: the cap was a typed 8.6 with no reason). A larger
    // Moon hangs farther to the side by three times what its radius has grown, so it keeps its own breadth
    // clear of the ring as far up the climb as the smallest does (to about 110 m short of it).
    const MOON_R = 0.95 * Math.min(sunL.radius, SUNS.red.radius), MOON_AZ = 38 + 3 * (MOON_R - 7.125);
    const MOON_PH = look.moon === 'crescent' ? -0.25 : look.moon === 'green' ? 0.8 : 0.55;
    const moonDir = new THREE.Vector3(Math.sin(MOON_AZ * DEG * mx) * Math.cos(31 * DEG), Math.sin(31 * DEG), -Math.cos(MOON_AZ * DEG * mx) * Math.cos(31 * DEG));
    const heavens = makeHeavens(ctx, shared, { sunRadius: sunL.radius, sunCore: sunL.core, sunLimb: sunL.limb, sunRadiance: sunL.rad, veil: sunL.veil, seed: fk.look(), windLean: mx,
      moonDir, moonRadius: MOON_R, moonPhase: MOON_PH, moonGreenAmount: look.moon === 'green' ? 1.0 : 0.75, netGain: sunL.veil ? 1.5 : 1,
      // (mend S) the Moon is seen through the sky: it reads the dome's own three colours and its two powers
      // (the same objects the sky's law fills each frame), and it is lit by this visit's sun
      skyU: sky.uniforms, sunLight: sunL.core, sunVeil: sunL.veil });
    scene.add(heavens.object);
    await ctx.yield();

    // ---- the roof of the forest: crowns to the horizon, the twigs nearest the route, the hill the cable is tied to
    const canopy = makeCanopy(ctx, shared, { radius: 12000 });
    scene.add(canopy.object);
    await ctx.yield();
    const peak = makePeakMesh(ctx, shared, peaks[0]); scene.add(peak.object);
    await ctx.yield();
    for (let i = 1; i < peaks.length; i++) { scene.add(makePeakMesh(ctx, shared, peaks[i], { sect: 60, rings: 26 }).object); await ctx.yield(); }
    // (the road's one rule on the hill, HILL_KEEP = 22 m: no crown of the hill, no root of the cable's foot and
    // nothing of the watchers' bough is nearer the road than that; what would be is not made, or goes under)
    const trees = await makeCrownTrees(ctx, shared, { roof, hillRng: fk['crowns-hill'], kindRng: fk['crown-kinds'], path, peak: peaks[0], keep: HILL_KEEP }); scene.add(trees.object);
    await ctx.yield();
    const leaves = await makeLeaves(ctx, shared, { rng: fk.twigs, path, crowns: trees.list });
    scene.add(leaves.object);
    await ctx.yield();

    // ---- the climber (made before the cables: its hands shake them)
    const hero = await buildHero(ctx, { shared, pods: look.pods, clear: Math.min(9, look.pods), flies: Math.round(look.fliers * lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1))),
      clock: gaitClockV, forks: { phase: fk.phase, gait: fk.gait, sacs: fk.sacs, pods: fk.pods, limbs: fk.limbs, beards: fk.beards, felt: fk.felt, fliers: fk.fliers } });
    scene.add(hero.object);
    await ctx.yield();
    // The flight keeps 20 m clear of every limb at every moment of the round, by sizes and not by choosing the
    // moment: beside the body the road stands 1.2 body thicknesses off the hide (the flank's rule above), the
    // knees on our side hang under the body and the hands on our side lift up and in on their swing; past the
    // bud the road stays 28.4 m and more from the cable's middle line until it is past the foremost hold of the
    // slowest visit (the layout's BESIDE says the sizes). Every visit keeps the start of the round its stream
    // dealt. limbWalk() measures it on this visit (the report's number): the least distance from the eye to
    // any limb's surface (a hand: a ball of 2.5 cable radii where it holds and where it is lifted), walking the
    // road at 2 m steps, for 28 starts of the round a twenty-eighth apart. (The report has the count on 200
    // seeds as dealt and over the 28 starts: none under 20 m.) (Mend V: at each stand the land's bend is set as
    // the flight has it there, since the hindmost limbs reach down after the cable as the land falls; the
    // report of mend V has the count made again.)
    const limbWalk = () => { const p = new THREE.Vector3(), dealt = hero.gait.phase0, bend0 = U.uBend.value.clone(); let least = Infinity, at = 0, ph = 0;
      for (let k = 0; k < 28; k++) { hero.gait.phase0 = (dealt + k / 28) % 1;
        for (let d = 0; d <= path.length; d += 2) { bendTo(d / path.length); const g = hero.limbClearance(d, path.posAtDist(d, p)); if (g < least) { least = g; at = d; ph = k; } } }
      hero.gait.phase0 = dealt; U.uBend.value.copy(bend0); return { least, atMetres: at, startMovedBy28ths: ph }; };
    hero.update(0, 0, null, 0);
    updaters.push((dt, t, cam, u) => hero.update(dt, t, cam, u * path.length));
    await ctx.yield();

    // ---- everything spun
    const peakHeight = (x, z) => shared.hump(x, z, 0) * smoothstep(0.55, 1, Math.hypot(x - peaks[0].x, z - peaks[0].z) / peaks[0].r) + peakH(peaks[0], x, z);
    const cables = makeCables(ctx, shared, { rng: fk.cables, rootRng: fk.collar, path, keep: HILL_KEEP, peaks, grips: hero.grips, strandS: hero.strandS }); scene.add(cables.object);
    await ctx.yield();
    const hub = makeHub(ctx, shared, { rng: fk.ring, grips: hero.grips, ties: cables.ties }); scene.add(hub.object);
    await ctx.yield();
    // (mend T, T4) UP TO A DOZEN CABLES COME TO THE RING: ours, the visit's five to nine other ropes, and the rest
    // as threads from hills too far to see (the web part: FAR CABLES AS THREADS). FAR_LINES is the number ASKED,
    // two at the least; the web part makes fewer where its rules turn a line away in all its tries (mend U,
    // the reader's count on seeds 1 to 200: five visits, and on seed 70 one line of the two asked)
    const FAR_LINES = clamp(12 - (1 + look.cables), 2, 6);
    const strands = makeStrands(ctx, shared, { forks: { guys: fk.guys, strands: fk.strands, loose: fk['loose-web'], far: fk['far-lines'] }, farLines: FAR_LINES,
      cableBearings: cables.ends.map((e) => Math.atan2(e.T.z - HUB.H.z, e.T.x - HUB.H.x)), peaks, peakHeight, path, moonDir, moonRadius: MOON_R, moonPhase: MOON_PH, sunRadius: sunL.radius, ties: cables.ties }); scene.add(strands.object);
    await ctx.yield();
    const chair = makeCableHair(ctx, shared, { rng: fk['cable-hair'], grips: hero.grips, ends: cables.ends, count: Math.round(900 * lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1))) }); scene.add(chair.object);
    await ctx.yield();

    // ---- TRAFFIC. The cables are roads. A climber on another road wears the dress of the one beside us in a
    // plainer cut (bark, moss and bladders on its hide, a beard of pale fibre, bent woody limbs lit by the same sun
    // and the same green from the roof), and one in that cut KEEPS FAR: never nearer the route than FAR_M, 700 m,
    // where the air has begun to take its edges. So each other cable is walked at 41 points of its length and each
    // point is measured against the route at every 3 m of it; the cable's traffic keeps to the longest run of the
    // cable that is 700 m or more from all of the route, going up it and backing down it at a climber's pace on
    // the world clock (it never turns round and never starts again from an end), and a cable with no such run of
    // 250 m or more carries none AND DRAWS NOTHING. THE WALKER (mend P, Q5; stream 'walker'): the cable with the
    // longest such run always carries one, of nearly the size of ours, low in its run and going UP; its stream
    // says where it starts, its size and its own form. For each other cable with a run the stream 'traffic' says
    // whether it has one (one in two) and only then where in its run it starts, whether it starts downward (one
    // in three), how big it is and its form. The hair of strands that runs on
    // from the ring to the Moon carries none: from the ring anything on it stands against the Moon's bright face,
    // where the plain cut can only be a dark shape, and the full model is too dear to make twice.
    const FAR_M = 700, trafficFacts = [], farLineFacts = []; let farPosesMoved = 0;
    { const tr = fk.traffic, frameOn = (m, p, dir, sc) => { _t.crossVectors(dir, _s.set(0, 1, 0)).normalize(); _s.crossVectors(_t, dir).normalize();
        m.set(_t.x, _s.x, -dir.x, p.x, _t.y, _s.y, -dir.y, p.y, _t.z, _s.z, -dir.z, p.z, 0, 0, 0, 1); m.scale(_s.set(sc, sc, sc)); };
      const tri = (x) => { const f = x - Math.floor(x); return 1 - Math.abs(2 * f - 1); };
      const rp = [], runs = []; for (let d = 0; d <= path.length; d += 3) { path.posAtDist(d, lp); rp.push(lp.x, lp.y, lp.z); }
      for (let c = 0; c < cables.ends.length; c++) {
        const e = cables.ends[c], pB = new THREE.Vector3();
        // the longest run of this cable that keeps FAR_M from the whole route
        let qa = 0, qb = 0, from = -1, last = 0;
        for (let j = 0; j <= 41; j++) {
          const q = 0.1 + 0.82 * j / 40; let far = j <= 40;
          if (far) { e.at(q, T0, pB); for (let k = 0; k < rp.length && far; k += 3) { const gx = pB.x - rp[k], gy = pB.y - rp[k + 1], gz = pB.z - rp[k + 2]; far = gx * gx + gy * gy + gz * gz >= FAR_M * FAR_M; } }
          if (far) { if (from < 0) from = q; last = q; } else if (from >= 0) { if (last - from > qb - qa) { qa = from; qb = last; } from = -1; }
        }
        runs.push({ c, e, qa, qb, run: (qb - qa) * e.len });
        await ctx.yield();
      }
      const longest = runs.reduce((a, r) => (r.run > a.run ? r : a), { run: 0 }), wk = fk.walker;
      for (const { c, e, qa, qb, run } of runs) {
        const walker = run >= 250 && run === longest.run && c === longest.c;
        if (run < 250 || !(walker || tr.chance(1 / 2))) { trafficFacts.push({ cable: c + 1, runMetres: Math.round(run), carries: false }); continue; }
        const q0 = walker ? wk.range(0.22, 0.5) : tr.range(0.22, 0.8), down = walker ? false : tr.chance(1 / 3), sc = walker ? wk.range(0.85, 1) : tr.range(0.6, 0.95);
        const pB = new THREE.Vector3(), pC = new THREE.Vector3(), dir = new THREE.Vector3();
        trafficFacts.push({ cable: c + 1, runMetres: Math.round(run), carries: true, walker, startsDown: down, size: sc });
        const ph = (q0 - 0.22) / 0.58 * 0.5, ph0 = down ? 1 - ph : ph;
        const f = makeFarClimber(ctx, shared, { rng: walker ? wk : tr, key: 2 + c, frame: (t, m) => {
          const q = qa + (qb - qa) * tri(ph0 + GAIT.speed * t / (2 * run));
          e.at(q, t + T0, pB); e.at(q + 0.004, t + T0, pC); dir.subVectors(pC, pB).normalize(); frameOn(m, pB, dir, sc); return e.fall(q); } });
        if (f.reachLimited) farPosesMoved++;
        scene.add(f.object); updaters.push((dt, t) => f.update(t));
        await ctx.yield();
      }
      // (mend T, T4) AND ON THE FAR THREADS: the first two of them carry a climber each (stream 'far-climbers':
      // its size, 0.45 to 0.7 of ours, where on its line it starts, 1.7 to 2.6 km down the line from the
      // ring, and its form), in the same plain cut, going UP toward the ring at a climber's pace for its
      // size. The same rule of distance, FAR_M from all of the road: a thread lies 25 degrees or more off our
      // cable's line, so 1.7 km down it is never nearer; the nearest start is tried first, and a thread
      // that failed there would carry none and draw nothing. Lit by the one sun; paled by the air's own law.
      { const fc = fk['far-climbers'], pB = new THREE.Vector3(), pC = new THREE.Vector3(), dir = new THREE.Vector3();
        for (let i = 0; i < Math.min(2, strands.farLines.length); i++) {
          const ln = strands.farLines[i]; ln.at(1700 / ln.len, pB);
          let far = true; for (let k = 0; k < rp.length && far; k += 3) { const gx = pB.x - rp[k], gy = pB.y - rp[k + 1], gz = pB.z - rp[k + 2]; far = gx * gx + gy * gy + gz * gz >= FAR_M * FAR_M; }
          if (!far) { farLineFacts.push({ line: i + 1, footKm: Math.round(ln.footKm * 10) / 10, carries: false }); continue; }
          const sc = fc.range(0.45, 0.7), q0 = fc.range(1700, 2600) / ln.len;
          farLineFacts.push({ line: i + 1, footKm: Math.round(ln.footKm * 10) / 10, carries: true, size: sc, fromRingMetres: Math.round(q0 * ln.len) });
          const f = makeFarClimber(ctx, shared, { rng: fc, key: 20 + i, frame: (t, m) => {
            const q = Math.max(q0 - sc * GAIT.speed * t / ln.len, 0.05);
            ln.at(q, pB); ln.at(q - 0.004, pC); dir.subVectors(pC, pB).normalize(); frameOn(m, pB, dir, sc); return ln.fall(q); } });
          if (f.reachLimited) farPosesMoved++;
          scene.add(f.object); updaters.push((dt, t) => f.update(t));
          await ctx.yield();
        } } }

    // ---- ANOTHER OF THE KIND ON THE NEXT CABLE (round Q, R6 b; the layout's TRAV, TRAV_GO and NEXT_KEEP). Its
    // place is its own cable's and its own clock's: travL(t) metres down that cable from the ring at the world's
    // second t, from where its stream put it at second 0, by its habit (mend W: down a stretch at the kind's
    // pace for its size and back up it, for ever); its hands go one after another by its own round (the
    // stream says where the round stands). It heads DOWN the cable, its body and limbs fore and aft along it
    // as ours lie along ours. Nothing of it knows where the road is: the road passes it because the road is
    // laid beside our cable and its cable leaves the ring 45 degrees off ours, so it is seen three-quarters
    // on from ahead and from the side as we pass, its tail last as it falls behind.
    const NEXT = cables.ends[0], tv = fk.traverser, travSize = tv.range(TRAV.size[0], TRAV.size[1]), travFrom = tv.range(TRAV.from[0], TRAV.from[1]), travTg0 = tv.range(0, GAIT.T);
    // (mend W, W2) ITS HABIT, ON THE WORLD'S CLOCK, FOR EVER (the layout's TRAV_GO): travGo(t) is how many seconds of
    // its own going it has made at the world's second t. It goes down for TRAV_GO.down seconds, slows, stops
    // and starts back over TRAV_GO.turn seconds, backs up the same stretch hand over hand for as long, turns
    // again as slowly, and begins again: one round is 104 s, and its going is smooth at every join (its speed
    // is the cosine of the turn's share: no jump of place or of speed). Its hands go by the same seconds, so
    // on the way back each takes again the hold it left. Before this mend it went down for ever (travL had
    // no end): see the layout.
    const travRound = 2 * (TRAV_GO.down + TRAV_GO.turn);
    const travGo = (t) => { const D = TRAV_GO.down, E = TRAV_GO.turn, x = t - travRound * Math.floor(t / travRound);
      if (x <= D) return x;
      if (x <= D + E) return D + (E / Math.PI) * Math.sin(Math.PI * (x - D) / E);
      if (x <= 2 * D + E) return 2 * D + E - x;
      return -(E / Math.PI) * Math.sin(Math.PI * (x - 2 * D - E) / E); };
    const travL = (t) => travFrom + travSize * GAIT.speed * travGo(t), tvA = new THREE.Vector3(), tvB = new THREE.Vector3(), tvD = new THREE.Vector3(), tvX = new THREE.Vector3(), tvN = new THREE.Vector3();
    // its cable's place and line under its middle at the world's second t (tvA; tvD down the cable; tvN its upper side)
    const travLine = (t) => { const q = 1 - travL(t) / NEXT.len; NEXT.at(q, t + T0, tvA); NEXT.at(q - 0.004, t + T0, tvB); tvD.subVectors(tvB, tvA).normalize();
      tvX.crossVectors(tvD, _s.set(0, 1, 0)).normalize(); tvN.crossVectors(tvX, tvD).normalize(); };
    // (mend W, W1) ITS HANDS HOLD ITS ROPE WHERE THAT ROPE IS DRAWN. Its frame is a straight line (the rope's
    // tangent under its middle); its rope hangs slack and sways, so the rope at a hold 130 m from its middle
    // lies metres off that line (4.3 m on seed 7 before this mend, where the rope is 2.5 m in radius). So it
    // is handed its rope as ours is: the frame of THIS moment is kept (fA, fD, fX, fN, its metre on the rope
    // fL, its gait's own metre fS, the second fT), and for a hold at the gait's metre s: holdQ(s) is the
    // hold's own share of the rope, seat(s) the offset of the rope's drawn middle there (NEXT.at: the web
    // part's one function for the mesh's curve, with this second's sway and the land's fall as it stands) from
    // the frame's line, in the frame's own axes and size; radius(s) the rope's own girth there (the web
    // part's one function for the mesh's); share(s) the share of the land's fall the rope takes there less
    // the share its own place takes (the limb's light adds the two).
    const fA = new THREE.Vector3(), fD = new THREE.Vector3(), fX = new THREE.Vector3(), fN = new THREE.Vector3(), fV = new THREE.Vector3(), fNow = { L: 0, S: 0, T: 0 };
    // (THE ROPE ENDS AT THE RING. The hindmost limb's hold lies up to 140 m behind its middle, and its middle starts 110
    // to 150 m from the ring: on most visits the gait deals that limb holds PAST THE ROPE'S END while it is at the top
    // of its stretch. Before this mend the hand closed there on the frame's line, in the ring's knot or beyond
    // it; the test below caught it on the first seeds tried (5.1 m past the end on seed 1). A hold dealt
    // within RING_KNOT of the rope's end, or past it, is taken RING_KNOT short of the end: the hand has the rope
    // where it leaves the knot, and waits there until the gait's hold is below it. clip(s) is that rule in the
    // gait's own metres: the gait takes the clipped metre for the hold, so the rope's line under the fingers
    // is read at the hold the hand has.)
    const holdQ = (s) => clamp(1 - (fNow.L + (s - fNow.S) * travSize) / NEXT.len, 0, 1);
    const travRope = { seat: (s, out) => { NEXT.at(holdQ(s), fNow.T + T0, fV).sub(fA).addScaledVector(fD, -(s - fNow.S) * travSize); return out.set(fV.dot(fX), fV.dot(fN), -fV.dot(fD)).multiplyScalar(1 / travSize); },
      share: (s) => NEXT.fall(holdQ(s)) - NEXT.fall(1 - fNow.L / NEXT.len),
      clip: (s) => Math.max(s, fNow.S + (RING_KNOT - fNow.L) / travSize) };
    const second = await buildSecond(ctx, shared, { rng: tv, tg0: travTg0, go: travGo, rope: travRope, radius: (s) => NEXT.radius(holdQ(s)) / travSize,
      frame: (t, m, down) => { travLine(t); fA.copy(tvA); fD.copy(tvD); fX.copy(tvX); fN.copy(tvN); fNow.L = travL(t); fNow.S = GAIT.s0 + GAIT.speed * (travTg0 + travGo(t)); fNow.T = t;
        m.set(tvX.x, tvN.x, -tvD.x, tvA.x, tvX.y, tvN.y, -tvD.y, tvA.y, tvX.z, tvN.z, -tvD.z, tvA.z, 0, 0, 0, 1); m.scale(_s.set(travSize, travSize, travSize)); down.set(0, -tvN.y, tvD.y).normalize(); return NEXT.fall(1 - fNow.L / NEXT.len); } });
    scene.add(second.object); updaters.push((dt, t) => second.update(t));
    // (mend V, V1) THE TEST IN BUILD, THROWING. A HAND HOLDS THE ROPE WHERE THE ROPE IS DRAWN, at every bend of the
    // land, and no limb is drawn longer than its declared reach. At every 5 m of the road the land's bend and
    // the climber's gait are set as the flight has them there (bendTo; the visit's own gait clock), and for
    // each of its seven limbs: (1) its three joints summed are at most LIMB_REACH of its length; (2) while it is
    // in stance, the hand's seat (the middle its fingers close round) is within 0.5 m of THE CABLE'S MIDDLE AS
    // ITS MESH DRAWS IT at the metre of the hold it has. That middle is read HERE FROM THE MESH'S
    // OWN RINGS (the attributes of the cable's geometry: each ring's place, its share of the land's fall, its
    // metre for the dip, the share of the dip it is spared), each ring moved as ROPE_VERT moves it and the
    // middle straight between two rings as the triangles are: it uses none of the hero part's sums, so a hand
    // that parted from the rope would be caught. The build THROWS if either fails, on any visit.
    // It also counts for the report (handsFacts; nothing reads them in the flight): the greatest gap; the longest
    // a limb is drawn; how far the cable has sunk under a holding hand; on how many metres of the road each
    // limb has shifted its hold along the rope because the gait's hold is beyond its reach (shiftMetres), and
    // the farthest it shifted it (shiftMost); whether the reach's rule ever moved a hand where the rope takes
    // none of the land's fall at the gait's hold or the hold taken (it should not: movedWhereNoFall) or a far
    // climber's pose (farPosesMoved).
    // (mend W, W1) THE NEW STRAND'S FAR END IS WALKED TOO (mend V cured it and did not walk it): at every stand the
    // end as the hair's program is given it (uStrandEnd, in the hero's frame), put back up by the 0.8 of the
    // rope's radius it is made fast under the middle, is within 0.5 m of the cable's middle as its mesh draws
    // it at the strand's metre (the mesh's own radius there). THROWN (strandGap: the greatest).
    // (mend W, W1) THE SECOND OF THE KIND IS WALKED AS OURS IS, AND THROWN ON: see below the hero's walk.
    const handsFacts = { stands: 0, gap: 0, gapAtMetres: 0, gapLimb: 0, longest: 0, longestLimb: 0, sunkUnderHand: 0, shiftMetres: [0, 0, 0, 0, 0, 0, 0], shiftMost: [0, 0, 0, 0, 0, 0, 0], reachMost: [0, 0, 0, 0, 0, 0, 0],
      movedWhereNoFall: 0, strandGap: 0, secondPastReach: 0, secondOnSunkRope: 0, second: { stands: 0, seconds: 0, gap: 0, gapLimb: 0, gapAtSecond: 0, longest: 0, longestLimb: 0, shiftMost: [0, 0, 0, 0, 0, 0, 0], sunkUnderHand: 0, atKnot: 0 }, farPosesMoved };
    { const A = cables.object.geometry.attributes, rings = [], bend0 = U.uBend.value.clone(), G = hero.grips;
      // the main rope is the mesh's first: 57 vertices to a ring; aT.x is a ring's own metre along it (it rises to the ring's rim)
      for (let i = 0; i * 57 < A.position.count; i++) { const v = i * 57, l = A.aT.getX(v); if (rings.length && l <= rings[rings.length - 1].l) break;
        rings.push({ x: A.position.getX(v), y: A.position.getY(v), z: A.position.getZ(v), fol: A.aK.getX(v), r: A.aK.getY(v), s: A.aK.getW(v), l, spare: A.aD.getX(v) }); }
      // (mend W) the mesh's own radius at a metre of the cable, straight between two rings; the strand's far end as its program has it
      const radiusAt = (m) => { let i = 0; while (i < rings.length - 2 && rings[i + 1].l <= m) i++; return lerp(rings[i].r, rings[i + 1].r, (m - rings[i].l) / (rings[i + 1].l - rings[i].l)); };
      const strandEnd = hero.group.children.find((c) => c.name === 'climber-hair').material.uniforms.uStrandEnd.value;
      const ra = new THREE.Vector3(), rb = new THREE.Vector3(), seat = new THREE.Vector3(), mid = new THREE.Vector3(), M = new THREE.Matrix4();
      const ringAt = (i, out) => { const r = rings[i], dp = cableDip(r.s, G) * (1 - r.spare); return out.set(r.x + CB.n.x * dp, r.y - shared.drop(r.x, r.z) * r.fol + CB.n.y * dp, r.z + CB.n.z * dp); };
      const drawnAt = (s, out) => { let i = 0; while (i < rings.length - 2 && rings[i + 1].l <= s) i++; ringAt(i, ra); ringAt(i + 1, rb); return out.lerpVectors(ra, rb, (s - rings[i].l) / (rings[i + 1].l - rings[i].l)); };
      for (let d = 0, k = 0; d <= path.length; d += 5, k++) {
        bendTo(d / path.length); hero.update(0, 0, null, d); const g = hero.gait, J = g.J; CB.matrix(g.sBody, M); handsFacts.stands++;
        { const off = seat.set(strandEnd.x, strandEnd.y + 0.8 * radiusAt(hero.strandS), strandEnd.z).applyMatrix4(M).distanceTo(drawnAt(hero.strandS, mid));
          if (off > handsFacts.strandGap) handsFacts.strandGap = off;
          if (!(off < 0.5)) throw new Error('cables-to-the-moon: the new strand\'s far end stands ' + off.toFixed(2) + ' m off the cable as it is drawn, at ' + d + ' m of the road'); }
        for (let i = 0; i < 7; i++) { const o = i * 4, len = (J[o].distanceTo(J[o + 1]) + J[o + 1].distanceTo(J[o + 2]) + J[o + 2].distanceTo(J[o + 3])) / LIMBS[i].L, gr = g.grips[i];
          if (len > handsFacts.reachMost[i]) handsFacts.reachMost[i] = len;
          if (len > handsFacts.longest) { handsFacts.longest = len; handsFacts.longestLimb = i + 1; }
          if (len > LIMB_REACH + 1e-6) throw new Error('cables-to-the-moon: limb ' + (i + 1) + ' is drawn ' + len.toFixed(4) + ' of its length at ' + d + ' m of the road; its declared reach is ' + LIMB_REACH);
          const sunk = CB.sunk(gr.x, shared.drop), sh = g.shift[i];
          if (sh > 0) { handsFacts.shiftMetres[i] += 5; if (sh > handsFacts.shiftMost[i]) handsFacts.shiftMost[i] = sh;
            if (sunk === 0 && CB.sunk(gr.x - sh, shared.drop) === 0 && CB.sunk(gr.x + sh, shared.drop) === 0) handsFacts.movedWhereNoFall++; }
          if (!(gr.z > 0)) continue;                                        // (the gait's own stance: the seconds since the hand took its hold)
          seat.set(J[o + 3].x, J[o + 3].y - (g.hand[i].y + 0.75), J[o + 3].z).applyMatrix4(M);
          const gap = seat.distanceTo(drawnAt(gr.x, mid));
          if (gap > handsFacts.gap) { handsFacts.gap = gap; handsFacts.gapAtMetres = d; handsFacts.gapLimb = i + 1; }
          if (sunk > handsFacts.sunkUnderHand) handsFacts.sunkUnderHand = sunk;
          if (!(gap < 0.5)) throw new Error('cables-to-the-moon: the hand of limb ' + (i + 1) + ' stands ' + gap.toFixed(2) + ' m off the cable as it is drawn, at ' + d + ' m of the road (grip at ' + gr.x.toFixed(1) + ' m of the cable, sunk ' + sunk.toFixed(1) + ' m)');
        }
        if (k % 64 === 63) await ctx.yield();
      }
      // (mend W, W1) THE SECOND OF THE KIND, WALKED AS OURS IS, THROWING. Through EIGHT ROUNDS of its habit (832 s of
      // the world's clock, every 2.1 s: 397 stands), the WHOLE of its course eight times over. THE CLOCKS DO NOT
      // KEEP STEP WITH WHAT IS COUNTED: the step is a 15th of its gait's round (32 s), under a 9th of the faster
      // of its rope's two sways (20.27 s and 48.33 s) and no whole share of its habit's round (104 s), so each
      // round is walked at other places than the last; and from one round to the next the sway stands 0.13
      // and 0.15 of a period farther on, so a place of its round meets the sway at eight phases spread
      // over the sway's whole period.
      // The land stands as at the road's start on the even rounds and as at the ring on the odd (its stretch
      // of rope takes none of the land's fall, so the land's state moves nothing here: both are walked).
      // (1) no grown limb is drawn longer, its three joints summed, than LIMB_REACH of its length;
      // (2) while a grown limb is in stance its hand's seat is within 0.5 m of THE MIDDLE OF ITS ROPE AS THE
      // MESH DRAWS IT at the hold it has. That middle is read HERE FROM THE MESH'S OWN RINGS (the web part says
      // where the rope lies in the mesh: NEXT.mesh; each ring's place, its share of the land's fall, its sway
      // and phase, its axis), each ring moved as ROPE_VERT moves it at that second and the middle straight
      // between two rings; the hold's metre on the rope is worked here from the gait's hold and the habit's
      // place (the hold the gait HAS: one dealt within RING_KNOT of the rope's end at the ring, or past it, has
      // been taken RING_KNOT short of the end by the gait; atKnot counts the hand-stands held there).
      // THE BUILD THROWS if either fails. Counted and NOT thrown, with the reason: secondPastReach,
      // the limb-stands on which a limb's hold has slipped along the rope because the gait's hold is beyond
      // its reach (with its rope handed over, the slip is the rule's own doing wherever the slack rope lies
      // too far off: it is how the hand stays on the rope, so it is a count and no fault: shiftMost says how
      // far); secondOnSunkRope, the hand-stands on rope that takes any of the land's fall (its stretch lies
      // on the upper quarter of its rope, which takes none, so this is nought on every visit; were it not,
      // the seat is the rope's as drawn, sink and all, and the 0.5 m bound above is the test).
      { const ne = NEXT.mesh, nr = [], S2 = handsFacts.second, M2 = second.object.matrix;
        for (let i = 0; i < ne.rings; i++) { const v = ne.v0 + i * ne.ring, ax = A.aAx.getX(v), az = A.aAx.getZ(v), sl = Math.hypot(ax, az) || 1;
          nr.push({ x: A.position.getX(v), y: A.position.getY(v), z: A.position.getZ(v), fol: A.aK.getX(v), sway: A.aK.getZ(v), l: A.aT.getX(v), ph: A.aT.getZ(v), sx: -az / sl, sz: ax / sl }); }
        const nRing = (i, uT, out) => { const r = nr[i], w = r.sway * Math.sin(uT * 0.31 + r.ph * 6.2831853) * (0.6 + 0.4 * Math.sin(uT * 0.13 + r.ph * 40)); return out.set(r.x + r.sx * w, r.y - shared.drop(r.x, r.z) * r.fol, r.z + r.sz * w); };
        const nDrawn = (l, uT, out) => { let i = 0; while (i < nr.length - 2 && nr[i + 1].l <= l) i++; nRing(i, uT, ra); nRing(i + 1, uT, rb); return out.lerpVectors(ra, rb, (l - nr[i].l) / (nr[i + 1].l - nr[i].l)); };
        { for (let k = 0, t = 0, was = -1; (t = k * 2.1) < 8 * travRound; k++) { const rd = Math.floor(t / travRound); if (rd !== was) bendTo((was = rd) % 2);
            second.update(t); const g = second.gait, J = g.J, uT = t + T0; S2.stands++;
            for (let i = 0; i < 7; i++) { if (second.skip.includes(i)) continue;
              const o = i * 4, len = (J[o].distanceTo(J[o + 1]) + J[o + 1].distanceTo(J[o + 2]) + J[o + 2].distanceTo(J[o + 3])) / LIMBS[i].L, gr = g.grips[i], sh = g.shift[i];
              if (len > S2.longest) { S2.longest = len; S2.longestLimb = i + 1; }
              if (len > LIMB_REACH + 1e-6) throw new Error('cables-to-the-moon: limb ' + (i + 1) + ' of the second is drawn ' + len.toFixed(4) + ' of its length at second ' + t.toFixed(1) + '; its declared reach is ' + LIMB_REACH);
              if (sh > 0) { handsFacts.secondPastReach++; if (sh > S2.shiftMost[i]) S2.shiftMost[i] = sh; }
              if (!(gr.z > 0)) continue;
              const l = NEXT.len - (travL(t) + (gr.x - g.sBody) * travSize), fall = NEXT.fall(l / NEXT.len);
              if (l > NEXT.len - RING_KNOT - 1e-6) S2.atKnot++;
              seat.set(J[o + 3].x, J[o + 3].y - (g.hand[i].y + 0.75), J[o + 3].z).applyMatrix4(M2);
              const gap = seat.distanceTo(nDrawn(l, uT, mid));
              if (fall > 0) { handsFacts.secondOnSunkRope++; S2.sunkUnderHand = Math.max(S2.sunkUnderHand, fall * shared.drop(mid.x, mid.z)); }
              if (gap > S2.gap) { S2.gap = gap; S2.gapLimb = i + 1; S2.gapAtSecond = Math.round(t * 10) / 10; }
              if (!(gap < 0.5)) throw new Error('cables-to-the-moon: the hand of limb ' + (i + 1) + ' of the second stands ' + gap.toFixed(2) + ' m off its rope as it is drawn, at second ' + t.toFixed(1) + ' (hold at ' + l.toFixed(1) + ' m of its rope)');
            }
            if (k % 8 === 7) await ctx.yield(); } }
        S2.seconds = 8 * travRound; S2.step = 2.1;
        for (const key of ['gap', 'longest', 'sunkUnderHand']) S2[key] = Math.round(S2[key] * 1000) / 1000;
        S2.shiftMost = S2.shiftMost.map((v) => Math.round(v * 1000) / 1000); }
      await ctx.yield();
      U.uBend.value.copy(bend0); hero.update(0, 0, null, 0); second.update(0);
      for (const key of ['gap', 'longest', 'sunkUnderHand', 'strandGap']) handsFacts[key] = Math.round(handsFacts[key] * 1000) / 1000;
      for (const key of ['reachMost', 'shiftMost']) handsFacts[key] = handsFacts[key].map((v) => Math.round(v * 1000) / 1000);
    }
    // the middle of its body (it hangs under its cable as ours does), for the eye
    const travMid = (t, out) => { travLine(t); return out.copy(tvA).addScaledVector(tvN, BODY.cy * travSize); };
    // (mend R, X2) PLACE.level: THE METRE OF ROAD AT WHICH WE COME LEVEL WITH IT: where the eye is nearest the middle
    // of its body, the road walked at 2 m steps from the cable's foot with the world's clock at 48 s times the
    // share of the road flown (it moves under a metre a second: the flight's uneven pace shifts the place by
    // a metre or two). PLACE.levelOff: how far off it is there, metres.
    // (mend W, W2) THE MEETING IS THE SAME MEETING WHATEVER THE CLOCK READS WHEN THE VISITOR COMES IN. A world seen
    // through a portal arrives with its clock already running, and the second goes by that clock; so the place
    // of the meeting is found FROM THE CLOCK, every frame: levelWalk(te) is the same walk made for a visit
    // that came in at the world's second te (the clock at te + 48 s times the share of the road flown), and
    // between the walk's 2 m steps it takes the lowest point of the curve through the nearest step and its
    // two neighbours (fine), so that the place moves smoothly as the clock runs. meetAt(te) is the place for
    // such a visit: PLACE.level, the clock-0 place AS MEND V FOUND IT, moved by as far as the fine place
    // itself has moved between an entry at 0 and an entry at te. So at entry clock 0, at the film's clock,
    // the meeting is laid to the last digit where it was. (The places are kept by the second of te and
    // read straight between two of them. The clock-0 walk is mend V's, from the cable's foot to the road's end;
    // the place for another clock is FOLLOWED FROM THE CLOCK-0 PLACE on the same 2 m steps, a step at a time
    // toward the lesser distance until neither neighbour is nearer (levelNear): the second's stretch of rope
    // is under 50 m long and the distance has one hollow there, so it is the walk's place, for a few steps
    // where a walk is hundreds.)
    const lq = new THREE.Vector3(), lw = { at: 0, off: 0, fine: 0, g: [] };
    const levelWalk = (te, out, d0 = PLACE.cableFoot, d1 = path.length) => { let best = Infinity, at = d0, i0 = 0, n = 0; const g = out.g;
      for (let d = d0; d <= d1; d += 2, n++) { g[n] = path.posAtDist(d, lp).distanceTo(travMid(te + FILM * d / path.length, lq)); if (g[n] < best) { best = g[n]; at = d; i0 = n; } }
      out.at = at; out.off = best; out.fine = at;
      if (i0 > 0 && i0 < n - 1) { const a = g[i0 - 1], b = g[i0], c = g[i0 + 1], den = a - 2 * b + c; if (den > 1e-9) out.fine = at + 2 * clamp(0.5 * (a - c) / den, -0.5, 0.5); }
      return out; };
    levelWalk(0, lw); PLACE.level = lw.at; PLACE.levelOff = lw.off;
    const lvKept = new Map([[0, lw.fine]]), level0 = lw.fine;
    const lvG = (d, te) => path.posAtDist(d, lp).distanceTo(travMid(te + FILM * d / path.length, lq));
    const levelNear = (te) => { let d = PLACE.level, b = lvG(d, te), a = lvG(d - 2, te), c = lvG(d + 2, te);
      while (c < b && d + 4 <= path.length) { a = b; b = c; d += 2; c = lvG(d + 2, te); }
      while (a < b && d - 4 >= PLACE.cableFoot) { c = b; b = a; d -= 2; a = lvG(d - 2, te); }
      const den = a - 2 * b + c; return den > 1e-9 ? d + 2 * clamp(0.5 * (a - c) / den, -0.5, 0.5) : d; };
    const lvAt = (k) => { let v = lvKept.get(k); if (v === undefined) { if (lvKept.size > 600) { lvKept.clear(); lvKept.set(0, level0); } v = k === 0 ? level0 : levelNear(k); lvKept.set(k, v); } return v; };
    const meetAt = (te) => { const k = Math.floor(te); return PLACE.level + lerp(lvAt(k), lvAt(k + 1), te - k) - level0; };
    await ctx.yield();

    // ---- SEEDS IN THE AIR, all the way: fluff rising on the heat, and winged keys spinning. There are as many at a
    // height as the air there carries: seeds are heavier than the air that bears them, so their number falls as
    // the SQUARE of the air's density at their own height (exp(-2 h / 320 m): 86 in 100 just over the roof, 10 in
    // 100 at the ring). They are made in level slabs fixed in the world's height, 60 m thick and 48.6 m apart
    // (each fades at its faces, so that together they are even), each slab with the number its own height
    // carries; a slab goes with the eye sideways only. Nothing of them is set by the eye's height.
    const kd = lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1)) * dens;
    // (mend T, T4, the guard's limit) SEEDS, FLUFF AND KEYS ARE ONLY WITHIN THE AIR: they thin with height as
    // above and STOP WHERE THE SKY GOES DARK: none where the air's thinning at their own height is past 0.9
    // (the sky is violet from there up), whole under 0.6 of it. A slab whose number comes to none is not
    // made. (One in ten of the roof's number used to drift at the ring itself, on the night sky.)
    const SLAB = 60, STEP = SLAB * 0.81, seedAir = (y) => Math.exp(-2 * Math.max(y - ROOF_Y, 0) / AIR_H) * (1 - smoothstep(0.6, 0.9, thinning(y)));
    for (let k = 0; ROOF_Y + STEP * (k + 0.5) - SLAB / 2 < RIM_Y + 30; k++) {
      const yc = ROOF_Y + STEP * (k + 0.5), f = seedAir(yc);
      if (Math.round(420 * kd * f) < 1) continue;
      scene.add(fx.makeParticles({ rng: fk.fluff, preset: 'pollen', count: Math.max(1, Math.round((look.storm ? 4200 : 800) * kd * f)), box: [80, SLAB, 80], center: [0, yc, 0], follow: 'xz', velocity: [1.2 * mx, look.storm ? 5.5 : 1.7, -0.4], velocityRandom: [1.0, 0.9, 1.0],
        turbulence: [1.6, 0.8, 0.25], size: [0.07, 0.22], colors: ['#F4EBC4', '#E2E0B0', '#FFF6DA'], intensity: 0.8, opacity: 0.7, additive: 0.2, near: [2, 9], time }).object);
      scene.add(fx.makeParticles({ rng: fk.keys, preset: 'leaves', count: Math.max(1, Math.round(420 * kd * f)), box: [70, SLAB, 70], center: [0, yc, 0], follow: 'xz', velocity: [0.8 * mx, 1.1, -0.3], velocityRandom: [0.8, 0.7, 0.8], turbulence: [1.2, 0.6, 0.3],
        size: [0.3, 0.6], colors: ['#B9A45A', '#8F9A48', '#D8C27A'], spin: 3.2, near: [6, 15], lightDir: shared.sunDir.toArray(), time }).object);
      await ctx.yield();
    }
    // ---- life on the roof: boughs, the six watchers on the hill's top bough, sap-suckers, traps, kites, seed-birds
    const rooted = await makeRooted(ctx, shared, { forks: { boughs: fk.boughs, suckers: fk.suckers, watchers: fk.watchers }, path, crowns: roof, peak: peaks[0], keep: HILL_KEEP }); scene.add(rooted.object);
    await ctx.yield();
    // the hunters are dealt over the whole roof round the hill by the roof's own rule, thick enough that any line
    // across it passes some near (see the life file for the densities and their reasons); none is set by the road
    const traps = await makeTraps(ctx, shared, { rng: fk.traps, beltRng: fk['trap-belt'], coveyRng: fk.coveys, path, peak: peaks[0] }); scene.add(traps.object);
    await ctx.yield();
    scene.add(makeKites(ctx, shared, { rng: fk.kites, path, peak: peaks[0], traps: traps.sites, mist: KITE_AIR, wind: [1.2 * mx, 0, 0.4] }).object);
    await ctx.yield();
    // (mend W, W4) the road's places and the land's fall as the flight has it at each, every 2 m: for the coveys' keep
    // (the birds' deal takes every second place; the test below takes them all)
    const roadTable = { road: [], bends: [] };
    { const B = U.uBend.value, bend0 = B.clone();
      for (let d = 0; d <= path.length; d += 2) { path.posAtDist(d, lp); roadTable.road.push(lp.x, lp.y, lp.z); bendTo(d / path.length); roadTable.bends.push(B.x, B.y, B.z, B.w); }
      B.copy(bend0); }
    await ctx.yield();
    const birds = makeBirds(ctx, shared, { rng: fk.flocks, gliderRng: fk.gliders, coveyRng: fk['covey-birds'], highRng: fk['high-gliders'], high: 3, moonDir, moonRadius: MOON_R, sunRadius: sunL.radius, path, peak: peaks[0], traps: traps.sites, roadTable }); scene.add(birds.object);
    await ctx.yield();
    // (mend W, W4) THE ROOF'S HUNTERS HUNT ON THEIR OWN ROUNDS, WHETHER OR NOT ANYONE COMES: nothing is written here as
    // the eye passes (before this mend an updater sprang a trap, and put up its covey, the first time the eye
    // came within its reach: the one event that followed the flight). Which traps the road passes near, and
    // at what point of their round, is the visit's deal.
    // THE TEST IN BUILD, THROWING: A COVEY'S BIRDS AGAINST THE ROAD AT EVERY PHASE OF THE ROUND. Every bird of a covey
    // that is in the birds' mesh is read from the mesh (its place in the covey, its trap, which of them the
    // jaws take), and its whole line is walked by the rule the birds' program has, written again here: 33
    // states of its rise by 5 of its wander (and for the one the jaws take, the way over the mouth and the
    // newcomer's way in, 17 states), the roof under its trap at the top and the bottom of its swell, against
    // the eye at every 2 m of the road with the land fallen as the flight has it there. No point of any line
    // is nearer the eye than COVEY.keep: the build THROWS if one is. hunterFacts.coveyLeast: the least.
    // (A place of the road is passed over, for one bird, only when it lies farther on the map from the
    // straight line the bird keeps to (out from its trap; its span is taken from the points themselves) than
    // the least already found for that bird, or than the least found so far over all the birds, which is
    // never under the keep: the least over all is the same, and so is every throw. A bird whose whole line
    // (its span said here from the rule: from its place out to 3.6 times as far and 3 m more; for the one the
    // jaws take, from 1.5 m past the mouth to 20 m beyond its place) lies that far from every place of the
    // road near its trap is passed over before its points are made. coveyBirdsWalked: the birds tried.)
    const hunterFacts = { covey: COVEY, dealt: birds.coveys, traps: traps.sites.length, withCovey: traps.sites.filter((q) => q.covey).length, coveyBirdsWalked: 0, coveyLeast: Infinity, sites: traps.sites, roof: shared.roof, drop: shared.drop };
    { const BA = birds.object.geometry.attributes, bend0 = U.uBend.value.clone(), road = roadTable.road, bends = roadTable.bends, near = [], pts = [], B = U.uBend.value; let walked = 0, kx = NaN, kz = NaN, lo = 0, hi = 0;
      // (the work for one trap and for one bird is said as functions of their own: the page's engine does not speed up
      // loops written straight into a function as long as this one)
      const nearOf = (tx, tz) => { near.length = 0; for (let i = 0; i * 3 < road.length; i++) if (Math.hypot(road[i * 3] - tx, road[i * 3 + 2] - tz) < 140) near.push(i);
        lo = Infinity; hi = -Infinity; if (near.length) for (let k = 0; k < 24; k++) { const y = shared.roof(tx, tz, k * 0.95); lo = Math.min(lo, y); hi = Math.max(hi, y); } };
      // the least distance from one bird's whole line to the road; Infinity when it is passed over (it cannot come within `bound`)
      const birdLeast = (tx, tz, bx, by, bz, taken, bound) => { const dl = Math.hypot(bx, bz) || 1, dx = bx / dl, dz = bz / dl;
        { const q0 = taken ? Math.min(-1.5, dl) : Math.min(dl, 3.6 * dl - 3), q1 = taken ? dl + 20 : Math.max(dl, 3.6 * dl + 3); let qm = Infinity;
          for (const i of near) { const qx = road[i * 3] - tx, qz = road[i * 3 + 2] - tz, sq = clamp(qx * dx + qz * dz, q0, q1); qm = Math.min(qm, Math.hypot(qx - sq * dx, qz - sq * dz)); }
          if (qm - 0.01 >= bound) return Infinity; }
        pts.length = 0;
        for (let i = 0; i <= 32; i++) for (let w = -1; w <= 1; w += 0.5) { const f = i / 32;
          if (taken) pts.push(bx + (dx * 1.5 * w - bx) * f, 3.6 + (11 + 0.3 * w - 3.6) * f, bz + (dz * 1.5 * w - bz) * f);
          else pts.push(bx * (1 + 2.6 * f) + dx * 3 * w * f, 3.6 + (13 + 3 * by) * f * (2 - f) + 0.45 * w * f, bz * (1 + 2.6 * f) + dz * 3 * w * f); }
        if (taken) for (let i = 0; i <= 16; i++) pts.push(bx + dx * 20 * (i / 16), 3.6 + 10 * (i / 16), bz + dz * 20 * (i / 16));
        let best = Infinity, s0 = Infinity, s1 = -Infinity, wide = 0, first = near[0], firstAt = Infinity;
        for (let k = 0; k < pts.length; k += 3) { const s = pts[k] * dx + pts[k + 2] * dz; s0 = Math.min(s0, s); s1 = Math.max(s1, s); wide = Math.max(wide, Math.abs(pts[k] * dz - pts[k + 2] * dx)); }
        const lower = (i) => { const qx = road[i * 3] - tx, qz = road[i * 3 + 2] - tz, s = clamp(qx * dx + qz * dz, s0, s1); return Math.hypot(qx - s * dx, qz - s * dz) - wide; };
        for (const i of near) { const l = lower(i); if (l < firstAt) { firstAt = l; first = i; } }
        for (let n = -1; n < near.length; n++) { const i = n < 0 ? first : near[n]; if (n >= 0 && (i === first || lower(i) >= Math.min(Math.sqrt(best), bound))) continue;
          B.set(bends[i * 4], bends[i * 4 + 1], bends[i * 4 + 2], bends[i * 4 + 3]); const rx = road[i * 3], ry = road[i * 3 + 1], rz = road[i * 3 + 2];
          for (let k = 0; k < pts.length; k += 3) { const x = tx + pts[k], z = tz + pts[k + 2], sink = shared.drop(x, z), ex = x - rx, ez = z - rz, h2 = ex * ex + ez * ez;
            const dLo = lo + pts[k + 1] - sink - ry, dHi = hi + pts[k + 1] - sink - ry; best = Math.min(best, h2 + dLo * dLo, h2 + dHi * dHi); } }
        return Math.sqrt(best); };
      for (let j = 0; j < birds.object.geometry.instanceCount; j++) { const kind = BA.aB2.getW(j); if (!(kind < 0 && kind > -2.5)) continue;
        const tx = BA.aB1.getX(j), tz = BA.aB1.getY(j);
        if (tx !== kx || tz !== kz) { kx = tx; kz = tz; nearOf(tx, tz); }
        if (!near.length) continue;
        hunterFacts.coveyBirdsWalked++;
        const best = birdLeast(tx, tz, BA.aB0.getX(j), BA.aB0.getY(j), BA.aB0.getZ(j), kind < -1.5, hunterFacts.coveyLeast);
        if (best < hunterFacts.coveyLeast) hunterFacts.coveyLeast = best;
        if (!(best >= COVEY.keep)) { B.copy(bend0); throw new Error('cables-to-the-moon: a bird of the covey at (' + tx.toFixed(0) + ', ' + tz.toFixed(0) + ') comes ' + best.toFixed(2) + ' m from the road on its round; the keep is ' + COVEY.keep); }
        walked++; await ctx.yield();
      }
      B.copy(bend0); hunterFacts.coveyLeast = Math.round(hunterFacts.coveyLeast * 100) / 100; }
    await ctx.yield();

    // ---- gaze: THE CLIMBER'S PULL (weight 0.5), whose target moves with where we are along the climber. It holds from where
    // we come level with the cable's foot to the ring (the engine lets go of every pull at a portal), brought
    // round over the first 70 m beside the cable (the body's depth, DEEP) and let go over the last 70 m, where the
    // ring is dead ahead.
    const podMean = new THREE.Vector3(); { const cl = hero.pods.filter((p) => p.clear); const list = cl.length ? cl : hero.pods; for (const p of list) podMean.add(p.c); podMean.multiplyScalar(1 / Math.max(1, list.length)); }
    const g0 = new THREE.Vector3(), g1 = new THREE.Vector3(), g2 = new THREE.Vector3(), g3 = new THREE.Vector3(), g4 = new THREE.Vector3();
    const gazeAt = (t, u) => {
      const go = u * path.length, l = lead(u), sCam = l + sClimber(u); path.pointAt(u, g0);
      hero.anchors.bodyCentre(go, g1).sub(g0).normalize();
      // the flank where the pods are gummed on, 40 m ahead of us along it (so that it lies across the frame rather
      // than sliding by under the eye)
      hero.worldOf(go, podMean.x, podMean.y, -(l + 40), g2).sub(g0).normalize();
      // (round Q, R6 a) UP THE CABLE: the cable itself, 90 m up it from where the eye is level with it (its end
      // at the ring's rim at the last)
      CB.at(Math.min(sCam + 90, CB.L), 0, 0, g4).sub(g0).normalize();
      g3.copy(HUB.H).sub(g0).normalize();
      // behind its tail we look at the whole body; the eye goes over to the flank as we come level with the tail,
      // over the body's own depth (from half of it short of the tail to half of it past: 70 m in all), and from
      // the flank to the cable ahead as we draw past the bud, over the same depth (round Q: the eye went to the
      // green edge under the sun there; now the climb is the cable close to, looked up along its length to the
      // ring); over the last 100 m of cable before the ring the eye goes to the ring's middle
      g1.lerp(g2, smoothstep(TAIL - DEEP / 2, TAIL + DEEP / 2, l)).lerp(g4, smoothstep(BUD - DEEP / 2, BUD + DEEP / 2, l)).lerp(g3, smoothstep(HUB.s - 100, HUB.s, sCam)).normalize();
      return g1.multiplyScalar(100).add(g0);
    };
    const gazeFrom = PLACE.cableFoot / path.length;
    // THE WAY IN (mend P, Q4 b): until the hill's foot the eye is drawn to a place, THE HILL'S ROOT IN THE ROOF (the
    // middle of the hill at the height of the leaves), so the hill with its rope and the climber on it stands in
    // the middle and the gaze goes down with the glide. The pull is whole from the route's first point and is LET
    // GO BETWEEN TWO PLACES (round Q, T1): from where the road crosses the hollow that rings the hill
    // (PLACE.hollow: HOLLOW_AT of the hill's own radii from its middle) to the hill's foot (PLACE.peakFoot),
    // where the road's own line takes the hill as it always did. (The engine's window has one share for both
    // its ends: the window is opened as far before the route as the letting go is long, so its opening lies
    // before the first point and only its close is flown.)
    const letGo = (PLACE.peakFoot - PLACE.hollow) / path.length, wayTo = PLACE.peakFoot / path.length, hillRoot = new THREE.Vector3(peaks[0].x, ROOF_Y, peaks[0].z);
    // THE TRAVERSER (round Q, R6 b; mend R, X2): the eye is drawn to the middle of its body about the place where
    // we come level with it (PLACE.level): from TRAV_LOOK.before metres of road short of that place to
    // TRAV_LOOK.after metres past it, brought round and let go over TRAV_LOOK.ramp metres at each end: it is
    // found ahead and to the side, watched as it is passed and let go as it falls behind; then the eye is the
    // ring's. (The numbers were settled on the turn of the whole flight, counted on seeds 7, 3 and 2 and then
    // on more: the layout says them.)
    // (mend W, W2) THE PULL'S WINDOW IS LAID EVERY FRAME FROM THE CLOCK, about the place where this visit comes level
    // with the second (meetAt). WHAT THE ENGINE READS, said plainly: it reads a pull's from, to, fade and weight
    // as plain numbers in its pose, each frame, BEFORE the world's update of that frame, and hands the world
    // neither the eye nor the share of the road there; only a pull's at(t, u) is asked afresh in the pose. So
    // a weight worked from the eye's distance and bearing to the second could only be written by update()
    // and read one frame late (a still made in one frame would show the weight of the place before: the
    // crew's pose test), or folded into at(), which would need the engine's own look and its steady-camera
    // factor. What CAN be had inside this file, and is done: te = t - 48 u is the clock this visit came in
    // with (the world's second less the film's seconds for the share flown: it stands still through a visit
    // at the film's pace, and drifts a second or two with the engine's uneven pace, so reading it one frame
    // late shows nothing); the window is laid from it, [meetAt(te) - before, meetAt(te) + after] metres of
    // road, with the same fade and weight. Every entry clock gets its meeting, since the second's habit
    // keeps it on one stretch of its rope; and while this world is only seen through the way in (u is 0)
    // the window follows the clock, so the first frame of the flight finds it laid.
    const g5 = new THREE.Vector3(), lookA = (PLACE.level - TRAV_LOOK.before) / path.length, lookB = (PLACE.level + TRAV_LOOK.after) / path.length;
    const lookPull = { at: (t) => travMid(t, g5), from: lookA, to: lookB, fade: TRAV_LOOK.ramp / (TRAV_LOOK.before + TRAV_LOOK.after), weight: TRAV_LOOK.weight };
    const layMeeting = (te) => { const m = meetAt(te); lookPull.from = (m - TRAV_LOOK.before) / path.length; lookPull.to = (m + TRAV_LOOK.after) / path.length; return m; };
    updaters.push((dt, t, cam, u) => { layMeeting(t - FILM * u); });
    const pois = [{ at: () => hillRoot, from: -letGo, to: wayTo, fade: letGo / (wayTo + letGo), weight: 0.5 },
      { at: gazeAt, from: gazeFrom, to: 1, fade: DEEP / ((1 - gazeFrom) * path.length), weight: 0.5 },
      lookPull];
    // (mend W, W2) THE TEST IN BUILD, THROWING: THE MEETING AT EVERY CLOCK A VISIT CAN BRING. The visitor's pace control
    // scales the flight and never the world's clock, so at the place of the meeting (about 40 s into the film)
    // a visit can stand at any clock from about 3 s to about 250 s; the second's habit is a round of 104 s,
    // so every such clock is one of its round's. meetWalk(te, pace) is one visit: it came in at the world's
    // second te and flies at `pace` times the film's (1: the film; 12: hurried to the portal; 0.4: the
    // slowest), so the clock stands at te + 48 s x the share flown / pace. The road is walked at 2 m steps
    // from the cable's foot to 0.985 of the way (where the engine lets go of every pull); at each step the
    // window is laid as the world's update lays it there (from the clock less 48 s x the share flown) and
    // THE LOOK is made as the engine's pose makes it (the kit's own bell; the road's line 40 m ahead, each
    // pull in turn by its window and weight, the guard at the road's ends; no steady camera).
    // WALKED: (i) the six entry clocks of the mend's note (MEET.clocks: 0, 20, 40, 60, 120, 300 s) at the film's
    // pace; (ii) THE WHOLE ROUND: MEET.phases (13) entry clocks a thirteenth of the round apart (8 s), at each
    // of MEET.paces (1, 12 and 0.4 of the film's pace): 39 visits. All at 2 m steps. (The road's places, the
    // guard and the look as the first two pulls leave it are worked once for those steps: both pulls go by
    // the road alone, whatever the clock; only the third pull is worked afresh for each visit.)
    // THROWN ON, for every one of them: (1) THE LOOK'S GREATEST TURN from the cable's foot on, in degrees to a second OF
    // THE FILM (the turn to a metre of road x the road's metres to a film second: a visit at another pace
    // turns as much faster or slower as it flies, here as everywhere on the road), is under MEET.turn; for
    // the film-paced visits also at the engine's own pace (this world's pace(u), scaled as the engine
    // scales it so that the road lasts 48 s); (2) THE EYE IS NEVER NEARER THE SECOND'S MIDDLE THAN NEXT_KEEP.
    // (3) Every stance hand of the second is within 0.5 m of its rope as drawn at every 2.1 s of eight
    // rounds of its habit: the hands' test above.
    // For the report (meetingFacts): clocks: by the note's entry clocks, the place where the eye comes level
    // and how far off, the greatest turn at both paces, the seconds its middle is within 30 degrees of the
    // look; band: for each pace, over the whole round, the greatest turn and its clock, the least and the
    // greatest distance at the level place, the first and the last metre of road at which the eye comes
    // level, and the least seconds of film its middle is within 30 degrees of the look.
    const meetingFacts = { turnBound: MEET.turn, keep: NEXT_KEEP, round: travRound, stretch: [travFrom + travSize * GAIT.speed * TRAV_SPAN[0], travFrom + travSize * GAIT.speed * TRAV_SPAN[1]], clocks: [], band: [] };
    { const look = new THREE.Vector3(), prev = new THREE.Vector3(), to = new THREE.Vector3(), L = path.length, AHEAD = clamp(L * 0.05, 8, 40), COS30 = Math.cos(30 * DEG);
      const pk = []; let inv = 0; for (let i = 0; i <= 64; i++) pk.push(clamp(pace(i / 64), 0.35, 2.5)); for (let i = 0; i < 64; i++) inv += 2 / (pk[i] + pk[i + 1]);
      const paceAt = (u) => { const x = clamp(u, 0, 1) * 64, i = Math.min(63, Math.floor(x)); return (pk[i] + (pk[i + 1] - pk[i]) * (x - i)) * inv / 64; };
      // the table: for each 2 m step, the eye's place, the guard, and the look as the pulls before the third leave it
      const RD = [], BASE = [], GD = [], step = 2 * FILM / L;
      for (let d = PLACE.cableFoot, k = 0; d <= 0.985 * L; d += 2, k++) { const u = d / L, guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u)), e = path.posAtDist(d, new THREE.Vector3()), b = path.posAtDist(d + AHEAD, new THREE.Vector3()).sub(e).normalize();
        for (const p of pois) { if (p === lookPull) break; const w = bell(u, p.from ?? 0, p.to ?? 1, p.fade ?? 0.3) * (p.weight ?? 0.5) * guard; if (w <= 0.001) continue; to.copy(p.at(0, u)).sub(e).normalize(); b.multiplyScalar(1 - w).addScaledVector(to, w).normalize(); }
        RD.push(e); BASE.push(b); GD.push(guard); if (k % 32 === 31) await ctx.yield(); }
      // the look at step k when the second's middle stands at `mid`: the third pull by its window as it is laid now
      const lookAt = (k, u, mid, out) => { out.copy(BASE[k]); const w = bell(u, lookPull.from, lookPull.to, lookPull.fade) * lookPull.weight * GD[k];
        if (w > 0.001) { to.copy(mid).sub(RD[k]).normalize(); out.multiplyScalar(1 - w).addScaledVector(to, w).normalize(); } return out; };
      const meetWalk = async (te, pc) => { const row = { clock: te, pace: pc, laid: 0, level: 0, off: Infinity, turn: 0, turnAtShare: 0, turnLive: 0, in30: 0 };
        for (let k = 0; k < RD.length; k++) { const d = PLACE.cableFoot + 2 * k, u = d / L, t = te + FILM * u / pc, m = layMeeting(t - FILM * u), e0 = RD[k]; travMid(t, lq); lookAt(k, u, lq, look);
          const off = lq.distanceTo(e0); if (off < row.off) { row.off = off; row.level = d; row.laid = m; }
          if (to.subVectors(lq, e0).normalize().dot(look) > COS30) row.in30 += step;
          if (k) { const a = Math.acos(Math.min(1, look.dot(prev))) / DEG / step; if (a > row.turn) { row.turn = a; row.turnAtShare = u; } if (pc === 1) row.turnLive = Math.max(row.turnLive, a * paceAt(u - 1 / L)); }
          prev.copy(look); if (k % 64 === 63) await ctx.yield(); }
        if (!(Math.max(row.turn, row.turnLive) < MEET.turn)) throw new Error('cables-to-the-moon: a visit that comes in at clock ' + te + ' s at ' + pc + ' of the film\'s pace has the look turn ' + Math.max(row.turn, row.turnLive).toFixed(1) + ' degrees to a film second about the meeting with the second; the declared bound is ' + MEET.turn);
        if (!(row.off >= NEXT_KEEP)) throw new Error('cables-to-the-moon: a visit that comes in at clock ' + te + ' s at ' + pc + ' of the film\'s pace comes ' + row.off.toFixed(1) + ' m from the second of the kind; the keep is ' + NEXT_KEEP);
        return row; };
      const r1 = (v) => Math.round(v * 10) / 10;
      for (const te of MEET.clocks) { const row = await meetWalk(te, 1); for (const key of ['laid', 'off', 'turn', 'turnLive', 'in30']) row[key] = r1(row[key]); row.turnAtShare = Math.round(row.turnAtShare * 1000) / 1000;
        meetingFacts.clocks.push(row); await ctx.yield(); }
      for (const pc of MEET.paces) { const b = { pace: pc, visits: 0, turnMost: 0, turnMostClock: 0, turnLiveMost: 0, offLeast: Infinity, offMost: 0, levelFirst: Infinity, levelLast: 0, in30Least: Infinity };
        for (let i = 0; i < MEET.phases; i++) { const te = i * travRound / MEET.phases, row = await meetWalk(te, pc); b.visits++;
          if (row.turn > b.turnMost) { b.turnMost = row.turn; b.turnMostClock = te; } b.turnLiveMost = Math.max(b.turnLiveMost, row.turnLive);
          b.offLeast = Math.min(b.offLeast, row.off); b.offMost = Math.max(b.offMost, row.off); b.levelFirst = Math.min(b.levelFirst, row.level); b.levelLast = Math.max(b.levelLast, row.level); b.in30Least = Math.min(b.in30Least, row.in30);
          await ctx.yield(); }
        for (const key of ['turnMost', 'turnLiveMost', 'offLeast', 'offMost', 'levelFirst', 'levelLast', 'in30Least']) b[key] = r1(b[key]);
        meetingFacts.band.push(b); }
      layMeeting(0); }

    // ---- per frame
    const size = new THREE.Vector2(), cp = new THREE.Vector3(), nearSun = new THREE.Color();
    // the fill and the roof's haze have their colours once (a point takes the fill for its own height: cmAmb)
    U.uHemiSky.value.copy(C('#E6D69C', 1.2)); U.uHemiSkyB.value.copy(C('#3A3050', 0.6)); U.uHemiGnd.value.copy(C('#2F5E22', 1.2)); U.uHemiGndB.value.copy(C('#2F5E22', 0.95));
    const HAZE_DAY = C('#F4E0A0', 0.88).lerp(C('#E8D48C', 0.72), 0.45);
    // (mend S, with the guard's G1; the header's one law of the air, i) THE FAR AIR OVER THE LAND IS LIT BY THE
    // SUN THAT STANDS STILL. It has the sky's own colour at the horizon while the eye is in it and KEEPS THE
    // ROSE from the rose stop on (AIR_HOLD = 0.5: beside the cable's 220th metre): seen from above, the far land
    // goes paler into a rose band of air on the world's limb, never into violet-black, while the dome over it
    // goes on to violet and to night. It is the colour of the air round every thing at the leaves' height
    // (cmAirCol in the common part) and of the band on the limb (the sky part).
    // (mend S2, said as it is: in the line that sets it, max(AIR_HOLD, A_IN) NEVER TAKES ITS SECOND ARM: A_IN, the
    // sky's state at the hill top's height, is about 0.39 on every visit and AIR_HOLD is 0.5. The arm is idle;
    // it is left in this mend.)
    const AIR_HOLD = 0.5, landAir = new THREE.Color();
    // (mend S, the reader's R1) THE HAZE IS THE DAY'S GOLD ON THE WHOLE WAY IN. Mend R made it the lesser of the
    // gold and the sky's colour at the horizon at every height of the eye; but the sky is past its cream at
    // every height of the way in (the glide comes down from the hill top's 95 m to 38 m), so the approach's
    // haze changed while the text said it had not. A_IN is the sky's state (the air's thinning) at the highest
    // the eye stands between the route's first point and the cable's foot: while the sky is no further on
    // than that, the haze is the gold itself, as it was before mend R; it goes over from there across
    // HAZE_OVER of the thinning (0.25: one stop of the sky's law).
    let A_IN = 0; for (let d = 0; d <= PLACE.cableFoot; d += 2) A_IN = Math.max(A_IN, thinning(path.posAtDist(d, lp).y));
    const HAZE_OVER = 0.25;
    // (mend S) HOW MUCH OF THE MOON'S LIGHT COMES THROUGH THE AIR OVER THE EYE: e to the minus MOON_AIR at the
    // leaves (0.11), all of it at the ring's rim; between, by the share of the air still over the eye
    // (1 - thinning: the sky's one declared pacing): 0.16 where the road is lowest (38 m over the leaves: by
    // day the Moon is a pale shape in the gold air, a quarter lighter than the sky round it, its seas and its
    // net at a fifth of their night strength), a third at the rose stop, 0.58 at the violet. The sky part
    // adds what comes through to the sky's own colour at the Moon's place. MOON_AIR was tuned on the whole
    // flight: the Moon against the sky beside it at the sky's states, counted in the page on seeds 7, 3
    // and 2 (the report; 1.5 was tried first: a Moon half as light again as the day sky, too much a disc).
    const MOON_AIR = 2.2;
    U.uHazeCol.value.copy(HAZE_DAY);
    U.uFog.value.set(AIR_RHO, HAZE_RHO, AIR_H, 16);
    const su = sky.uniforms;
    const frame = (camera, u, t) => {
      U.uTime.value = t + T0; time.value = t;
      ctx.renderer.getDrawingBufferSize(size);
      U.uPx.value = 2 * Math.tan((camera.fov || 62) * DEG / 2) / Math.max(size.y, 1);
      // the climb: the forest falls away and bends (declared: it follows the share of the climb)
      const w = bendTo(u);
      camera.getWorldPosition(cp);
      // THE SKY (the one declared pacing by the eye's height): the dome's colours, the stars, the glow and the
      // gold scattered round the sun, the sun's reddening and veil and
      // the colour the clear air takes (the sky's own colour at the horizon) follow the air's thinning at the eye
      const eyeY = path.pointAt(u, lp).y, a = thinning(eyeY);
      ramp(su.uZenith.value, SKY.zen, a); ramp(su.uMid.value, SKY.mid, a); ramp(su.uHorizon.value, SKY.hor, a); su.uGround.value.copy(su.uHorizon.value);
      // the stars come out as the cube of the air's thinning (few, and none to speak of low down)
      su.uStars.value.x = 0.001 + 0.3 * a * a * a;
      // the glow round the sun and the gold scattered across the sky belong to the thick air: both thin with height
      su.uSun.value.z = lerp(0.34, 0.07, a); su.uGrad.value.y = lerp(0.26, 0.0, a);
      scene.fog.color.copy(su.uHorizon.value); U.uFogCol.value.copy(scene.fog.color);
      // (the far air keeps the sky's horizon colour to the rose stop, or to the sky's state at the hill top's
      // height if a visit's hill stood past it: on the way in it is the sky's own colour, as it always was)
      U.uLandAir.value.copy(ramp(landAir, SKY.hor, Math.min(a, Math.max(AIR_HOLD, A_IN))));
      // THE ROOF'S HAZE AND ITS STEAM (the header's one law of the air, ii): the day's gold itself while the
      // sky's state is no further on than A_IN; above that, across HAZE_OVER, the lesser on each channel of
      // the gold and the far air (mend R's V2 a, so far as the guard's G1 keeps it: never the violet).
      const hz = U.uHazeCol.value, hr = U.uLandAir.value, over = clamp((a - A_IN) / HAZE_OVER, 0, 1);
      hz.r = lerp(HAZE_DAY.r, Math.min(HAZE_DAY.r, hr.r), over); hz.g = lerp(HAZE_DAY.g, Math.min(HAZE_DAY.g, hr.g), over); hz.b = lerp(HAZE_DAY.b, Math.min(HAZE_DAY.b, hr.b), over);
      // THE AIR that dims things: its densities and scale heights never change (the common file); a frame gives it
      // only where the eye is (its height over the roof as the roof has sunk), for the ray from the eye to a thing
      const eyeH = Math.max(cp.y + shared.drop(cp.x, cp.z), 0);
      U.uFog.value.w = eyeH;
      // (the air on the world's edge is drawn on the far plane with the sun and the Moon: the land's own lit air
      // (uLandAir), whole on the limb at every height of the eye; mend P: no strength of it goes by the eye)
      heavens.update(camera, { roofY: ROOF_Y + 2, skyNearSun: nearSun.copy(su.uHorizon.value).lerp(su.uMid.value, 0.5), thin: a, cloud: (1 - a) * (1 - a), moonAir: Math.exp(-MOON_AIR * (1 - a)) });
      heavens.bandU.uBandCol.value.copy(U.uHazeCol.value);
      canopy.update(camera);
    };

    // FOR THE REPORT. These two functions PLACE NOTHING: nothing in the flight calls them, nothing of the world
    // is made, moved or timed by them, and they take no number from this visit's streams. sweep(n): seeds 1 to n
    // are dealt as those visits would be (each seed's own 'look', 'crowns-hill', 'crown-kinds' and 'collar'
    // streams, made from the seed and the name), and the arrival is laid for each: the least clearance to a leaf,
    // the greatest height of a knot over the highest leaf within 12 m of it, how many knots stand past 15 m, how
    // many layouts would have the hill steepened, and on the hill the least any crown, root or the roof comes to
    // the road and how many crowns and roots the keep-clear costs. flankSweep(n): the flank's rule tried for n
    // paces across what a visit can deal: how many move the road, and by how much.
    // (round Q) climbWalk: one road measured against the cable it climbs and against the traverser's cable: the
    // least the road comes to our cable's middle line from BUD_S on; the least it comes to the next cable
    // anywhere the traverser's body can be on its habit (mend W); the least it comes to the traverser's own place
    // when the world's clock stands at 48 s times the share of the road flown (a visit that came in at second
    // 0: the build's meetingFacts has the other entry clocks); and the least angle between the line
    // of sight to it and its own length while it is within 350 m (head-on would be 0). It places nothing.
    const climbWalk = (pth, fr, k, size, from) => { const r = { cableLeast: Infinity, nextLeast: Infinity, travLeast: Infinity, travAtShare: 0, axisLeast: 90 }, p = new THREE.Vector3(), c = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
      const L0 = from + size * GAIT.speed * TRAV_SPAN[0] - 110 * size, L1 = from + size * GAIT.speed * TRAV_SPAN[1] + 110 * size;      // (mend W: its habit's whole stretch)
      for (let d = 0; d <= pth.length; d += 4) { pth.posAtDist(d, p); fr.coords(p, c); if (c.x < BUD_S - 150) continue;
        if (c.x >= BUD_S) r.cableLeast = Math.min(r.cableLeast, Math.hypot(c.y, c.z));
        for (let L = L0; L <= L1; L += 10) r.nextLeast = Math.min(r.nextLeast, cableStill(k, 1 - L / k.len, a).distanceTo(p));
        const t = 48 * d / pth.length, L = from + size * GAIT.speed * t; cableStill(k, 1 - L / k.len, a); cableStill(k, 1 - (L + 5) / k.len, b); b.sub(a).normalize(); a.y -= -BODY.cy * size * 0.5;
        const g = a.distanceTo(p); if (g < r.travLeast) { r.travLeast = g; r.travAtShare = d / pth.length; }
        if (g < 350) { a.sub(p).normalize(); r.axisLeast = Math.min(r.axisLeast, Math.acos(Math.min(1, Math.abs(a.dot(b)))) / DEG); } }
      return r; };
    const sweep = (n = 200) => { const out = { layouts: 0, least: Infinity, overMost: 0, past15: 0, hillSteepened: 0, crowns: [Infinity, 0], hillCrownLeast: Infinity, hillCrownsLost: [Infinity, 0], rootLeast: Infinity, rootsCut: [Infinity, 0], cableLeast: Infinity, nextLeast: Infinity, travLeast: [Infinity, 0], axisLeast: 90 }, p = new THREE.Vector3();
      const mm = (pair, v) => { pair[0] = Math.min(pair[0], v); pair[1] = Math.max(pair[1], v); };
      for (let s = 1; s <= n; s++) {
        const st = (name) => makeRng(hashSeed(s + ':' + name)), lk = dealLook(st('look')), m = lk.mirror ? -1 : 1;
        const r = lk.peakR, k = r / 112.5, hv = (x, z, t = 0) => hump(x, z, t, k), rf = (x, z) => roofAt(x, z, 0, k), pk = { x: PEAKS[0][0] * m, z: PEAKS[0][1], h: PEAKS[0][2], r, p: lk.peakP, ragged: lk.ragged }, fr = makeFrame(-m);
        const cr = roofCrowns(hv, ARRIVE.map((b) => [b[0] * m, b[1]]).concat([[OVER_HILL[1][0] * m, OVER_HILL[1][2]]]), pk), tail = BESIDE.map((b) => fr.at(b[0], b[1], b[2]).toArray());
        const l = layArrival(m, cr, rf, tail), pth = makePath(l.skim.concat(tail)); let worst = Infinity;
        for (let d = 0; d <= pth.length; d += 4) { pth.posAtDist(d, p); if (Math.hypot(p.x - pk.x, p.z - pk.z) < pk.r) worst = Math.min(worst, p.y - peakH(pk, p.x, p.z)); }
        const hc = hillCrowns(hv, pk, pth, st('crowns-hill'), st('crown-kinds'), HILL_KEEP), rt = footRoots(fr, pk, pth, st('collar'), HILL_KEEP);
        out.layouts++; out.least = Math.min(out.least, l.least); out.overMost = Math.max(out.overMost, ...l.over); out.past15 += l.over.filter((v) => v > 15).length; if (worst <= 13) out.hillSteepened++;
        { const pl = PEAKS.slice(0, 1 + lk.cables).map((q, i) => ({ x: q[0] * m, z: q[1], h: i ? q[2] * (0.8 + 0.45 * fr1(i * 0.61)) : q[2], thick: i ? 5 + ((i * 1.7) % 4) : 14 }));
          const tvs = st('traverser'), cw = climbWalk(pth, fr, dealCables(fr, pl, st('cables')).others[0], tvs.range(TRAV.size[0], TRAV.size[1]), tvs.range(TRAV.from[0], TRAV.from[1]));
          out.cableLeast = Math.min(out.cableLeast, cw.cableLeast); out.nextLeast = Math.min(out.nextLeast, cw.nextLeast); mm(out.travLeast, cw.travLeast); out.axisLeast = Math.min(out.axisLeast, cw.axisLeast); }
        mm(out.crowns, cr.length); out.hillCrownLeast = Math.min(out.hillCrownLeast, hc.least); mm(out.hillCrownsLost, hc.lost); out.rootLeast = Math.min(out.rootLeast, rt.least); mm(out.rootsCut, rt.cut);
      } return out; };
    const flankSweep = (n = 300) => { const out = { paces: n, moved: 0, greatest: 0, atPaces: [] }, f = {};
      for (let i = 0; i < n; i++) { const pace = 1.6 + (i + 0.5) / n; let wide = 0; for (; wide <= 60; wide += 6) { flankFor(pace, wide, f); if (f.least >= 1.2) break; }
        if (wide > 0) { out.moved++; out.greatest = Math.max(out.greatest, wide); if (out.atPaces.length < 12) out.atPaces.push(+pace.toFixed(3)); } }
      return out; };
    // (for the report: the eye's height over the leaves under it at ten places of the arrival, 40 m apart)
    const roadHeights = []; for (let k = 0; k < 10; k++) { path.posAtDist(20 + 40 * k, lp); let top = shared.roof(lp.x, lp.z);
      for (const c of roof) { const d = Math.hypot(lp.x - c.x, lp.z - c.z); if (d < c.R) top = Math.max(top, c.y + c.sq * Math.sqrt(c.R * c.R - d * d)); } roadHeights.push(+(lp.y - top).toFixed(1)); }
    // ==== THE BUDGET'S BLOCK (polish 1b) ==================================================================
    // The site's budget is 500,000 triangles; this world's bar is BAR, 495,000, AS THE GATE COUNTS (the renderer's
    // own triangles in the page: what this scene hands the renderer, and ENGINE more, the engine's own, the same
    // on every visit measured). The heaviest visits went over: in polish 1b's text five visits in 100 were over
    // the bar and two of them over the budget; in polish 1c's text, where every far thread carries a climber,
    // eight in 100 and four (on live's own bytes five and three, of seeds 1 to 400). Most are a storm with seven to nine other
    // ropes, but some have six ropes or five, or no storm at all, and the heaviest visit found builds 529,235
    // in polish 1c's text (seed 8027729, which the code reader found: 526,687 in polish 1b's text). So THE BLOCK
    // IS KEYED ON NO LOOK: IT COUNTS WHAT IS BUILT, whatever dealt it. (Polish 1c changed these words and those of
    // steps 2 and 3 below, and no working line of the block. At a lower graphics level the page builds less, so
    // fewer visits are over the bar there; the heaviest still are, and the block thins such a visit by what
    // that level built: differently at each level.)
    // WHERE IT STANDS AND WHAT IT READS. It stands here, AFTER everything is built and before the first frame, and
    // COUNTS WHAT WAS BUILT, mesh by mesh, as the renderer will count it (drawn(): a mesh's triangles by its
    // instances, twice where a see-through two-sided material is drawn back and front). It reads no stream and
    // deals nothing. (It cannot count before the building from the look's numbers: the crowns, their twigs, the
    // ring's knots, the boughs, the kites and the birds are dealt by their own streams' tries, up to 15,000
    // triangles apart from visit to visit, and a bar that acts ONLY on the visits over it needs the true count.)
    // WHERE THE COUNT IS AT THE BAR OR UNDER IT, THE BLOCK DOES NOTHING: no draw from a stream, no count, no pixel.
    // WHERE IT IS OVER, it thins in this order, each step only as far as the count needs, and stops when under:
    // 1. THE STORM'S SEEDS BY COUNT (a storm visit only): of each slab of the storm's fluff the same share is
    //    drawn, never a smaller share than the thinnest storm the deal itself gives (the visit whose density is
    //    LEAST_STORM, 0.7: a visit at density 1.3 keeps 0.7 / 1.3 of its fluff at the least). Every seed is still
    //    dealt as it was, number for number; fewer of them are drawn. The keys and the calm air's fluff are left.
    // 2. THE FAR HILLS IN A COARSER FORM, one by one, THE FARTHEST FROM THE ROAD FIRST: a hill of another rope (never
    //    ours, never the nearest rope's) is drawn from 36 sectors by 16 rings where it had 60 by 26 (1,152
    //    triangles for 3,120), by the forest part's own maker, which draws from no stream: the same hill, the
    //    same place, height, slope, paint and air, a plainer outline and other, broader lumps. Such a hill's TOP is
    //    0.9 to 2.1 km from the road; the nearest foot of one is about 0.7 km from it (709 m, the code reader's
    //    count). Two visits in five of those the block acts on come to this step; the heaviest take all eight.
    // 3. THE SPRAYS OF NEW TWIGS BY COUNT, the same share of each of their six meshes: the last step, with no floor,
    //    so that the bar holds on every deal. Hardly a visit comes to it: in polish 1b's text none of seeds 1 to
    //    12,000 and, by the code reader's count, 6.2 in 100 of the sprays at the most (seed 8027729); in polish
    //    1c's text one of seeds 1 to 12,000 (0.6 in 100 of its sprays) and, of the 902 heaviest-dealt seeds of
    //    twelve million, 57: 11 in 100 of the sprays at the most (seed 3805191).
    // NEVER THINNED: the great climber and all it carries, the second, the Moon, the nearest rope and its hill, the
    // ropes, the far climbers, the people. No new draw call, no timer, no law that reads the eye; nothing here
    // knows a seed, a still or the lens: the rule is the count, the same on every visit that builds that weight.
    // scene.userData.budget says what it found and did (for the report; nothing in the flight reads it).
    { const BAR = 495000, ENGINE = 113, LEAST_STORM = 0.7, COARSE = { sect: 36, rings: 16 };
      const drawn = (o) => { if (!o.isMesh) return 0; const g = o.geometry, m = o.material, n = g.index ? g.index.count : g.attributes.position.count, r = g.drawRange;
        const inst = o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry && Number.isFinite(g.instanceCount) ? g.instanceCount : 1;
        return Math.floor(Math.max(0, Math.min(n - r.start, r.count)) / 3) * inst * (m.transparent && m.side === THREE.DoubleSide && !m.forceSinglePass ? 2 : 1); };
      const count = () => { let s = ENGINE; scene.traverseVisible((o) => { s += drawn(o); }); return s; };
      const budget = scene.userData.budget = { bar: BAR, built: count(), drawn: 0, acted: false, stormShare: 1, coarseHills: [], twigShare: 1 };
      if (budget.built > BAR) {
        budget.acted = true;
        // 1. the storm's seeds (the slabs of the air are the scene's own nameless seed meshes, fluff then keys, slab by slab)
        const air = scene.children.filter((o) => o.isMesh && !o.name && o.geometry.isInstancedBufferGeometry && o.geometry.getAttribute('aSeed')), fluff = air.filter((o, i) => i % 2 === 0);
        if (look.storm && fluff.length && air.length % 2 === 0 && fluff.every((o, i) => o.geometry.instanceCount >= 5 * air[2 * i + 1].geometry.instanceCount)) {
          const all = fluff.reduce((s, o) => s + drawn(o), 0), share = Math.min(1, Math.max(LEAST_STORM / dens, 1 - (budget.built - BAR) / all));
          for (const o of fluff) o.geometry.instanceCount = Math.max(1, Math.floor(o.geometry.instanceCount * share));
          budget.stormShare = share; }
        // 2. the far hills, the farthest from the road first (the scene's 'peak' meshes stand in the order of `peaks`)
        const hills = scene.children.filter((o) => o.name === 'peak'), far = []; for (let i = 2; i < peaks.length && i < hills.length; i++) far.push({ i, d: path.distanceTo(peaks[i].x, peaks[i].h, peaks[i].z) });
        far.sort((a, b) => b.d - a.d);
        for (const { i, d } of far) { if (count() <= BAR) break;
          const lo = await makePeakMesh(ctx, shared, peaks[i], COARSE); hills[i].geometry.dispose(); hills[i].geometry = lo.object.geometry; lo.object.material.dispose();
          budget.coarseHills.push({ hill: i, metresFromRoad: Math.round(d) }); await ctx.yield(); }
        // 3. the sprays of new twigs
        const over = count() - BAR, twigs = (scene.getObjectByName('twigs') || { children: [] }).children;
        if (over > 0 && twigs.length) { const all = twigs.reduce((s, o) => s + drawn(o), 0), share = Math.max(0, 1 - over / all);
          for (const o of twigs) o.geometry.instanceCount = Math.floor(o.geometry.instanceCount * share);
          budget.twigShare = share; }
      }
      budget.drawn = count(); }
    // ==== THE BUDGET'S BLOCK ends ==========================================================================
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 48, pace,
      camera: { fov: 62, near: 0.3, far: 9600 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#CFEBC2', glow: 0.9, revealDistance: 440, tilt: true },
      post: { exposure: 1.0, bloom: { strength: 0.4, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.0, contrast: 1.06, shadowTint: '#0B0C0C', vignette: 0.3, grain: 0.02 } },
      // what this visit drew, for the builder's report (nothing in the flight reads it)
      facts: { look, place: PLACE, streamsMissing: shared.missing, bud: { bladders: hero.sacs.length, at: hero.budAt, loneMost: hero.loneMost },
        climb: { cableKeep: CABLE_KEEP, nextKeep: NEXT_KEEP, moonRadius: MOON_R, moonBearing: MOON_AZ, moonHair: strands.hair, farLines: strands.farLines.map((l) => ({ footKm: Math.round(l.footKm * 10) / 10, bearingDeg: Math.round(l.bearing / DEG), lengthM: Math.round(l.len), clearMoonSun: l.clear.map((g) => Math.round(g * 100) / 100) })), farLineClimbers: farLineFacts,
          highGliders: birds.highRounds.map((r) => ({ upCable: Math.round(r.upCable), side: Math.round(r.side), radius: Math.round(r.R), height: Math.round(r.h) })), traverser: { size: travSize, fromRing: travFrom, limbsGrown: second.limbsGrown, limbsNotGrown: second.skip.map((i) => i + 1), rope: NEXT.mesh, bosses: second.bosses, loneMost: second.loneMost, triangles: second.triangles },
          walk: climbWalk(path, CB, NEXT.k, travSize, travFrom) }, hills: peaks.map((q) => [Math.round(q.h), Math.round(q.r), Math.round(q.p * 100) / 100]), flank: flankFacts, road: { over: low.over, least: low.least, past15: low.over.filter((v) => v > 15).length, heights: roadHeights, crowns: roof.length, emergent: roof.filter((c) => c.emergent).length, lodMetres: LOD_M },
        hands: handsFacts, meeting: meetingFacts, hunters: hunterFacts,
        hill: { keep: HILL_KEEP, crownsLost: trees.lost, crownLeast: trees.least, rootsCut: cables.roots.cut, rootLeast: cables.roots.least, boughLeast: rooted.watch.least }, hillSteps: hillSteps.n, sweep, flankSweep, farMetres: FAR_M, length: path.length, phase: hero.gait.phase0, gait: hero.gaitDeal, limbWalk, heights: { landFallsFrom: HAZE_TOP, hillTop: peaks[0].h, ringRim: RIM_Y }, ours, thinning, peak: { r: peaks[0].r, p: peaks[0].p }, traps: traps.sites.filter((q) => q.off < 62), flocks: birds.rounds, traffic: trafficFacts, watchers: rooted.watch, lead, rise, sClimber },
      update(dt, t, camera, u) {
        frame(camera, u, t);
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, t, camera, u);
        sky.update(dt, t, camera);
      },
      dispose() { sky.dispose(); },
    };
  },
};
