// The Moor Under the Fog Bank: a great upland moor on a moonlit autumn night, under three lights and a fourth. GOLD AT THE HALL: the
// flight comes down an avenue of old oaks to a towered hall, over its roof beside the lit lantern on its ridge, down over the
// walled garden and low along the yew alley, under its lamps, toward the lit summer house and the white wicket gate. SILVER
// ON THE OPEN MOOR: from the gate it follows ONE OLD WAY, which is laid by the land (THE LAND FIRST, below), a few metres over
// it (how many on each stretch, least and most, is a thing for the round's count, not for this line):
// a sunken lane between dry-stone walls, round the foot of a green knoll with a stone circle on its crown, along the brook's
// reach BETWEEN A DOUBLE ROW OF STANDING STONES, past the hut circles on either hand, the ponies and the moorman's cottage
// with its lit window, its door ajar and its smoke, and over the brook on a clapper bridge with a lantern at each end; then
// the miners' path up the tor's hill, straight at a tall thin man who stands on the crown against the moon, and through the
// pass beside the crown's rocks. RED AT THE MINE: from the pass the way goes down to the great mire, where A LOW WHITE BANK OF
// FOG lies level in the hollow on the right hand (THE FOG IS LOW, below), and along boards and white wands from firm island
// to firm island, round the tarn, into the yard of AN OLD MINE, LONG ABANDONED: a roofless engine house with one round plain
// arch and its dead stack beside it, a fallen wall, a wheel that no longer turns, with a third of its rim gone, the adit's dark
// mouth; the ring stands in that mouth, and the only other fire of the works burns in a hut in the yard. The old stack of an
// older working stands alone on the lode's line at the mire's edge. THE FOURTH LIGHT is the hound's: a great black hound in
// pale blue-white fire, whose beat lies at the fog bank's foot, a dozen metres and more from the boards.
//
// Everything is laid out by planMoor() below: the places first (planPlaces, which reads no route), then the line flown among
// them, then the pace and the gaze; all are pure functions of the seed. build() dresses that plan.
// The hound, the fog bank, the ponies, the fox and the figure on the tor come from src/parts/moor-under-the-fog-bank.js.
//
// WHAT IS DRIVEN BY WHAT. Nothing of the story begins, turns or ends because we come: each cast is a STANDING STATE or a HABIT ON THE
// WORLD'S CLOCK, and we see it because the line passes it. A visitor who stands still, or who arrives with the clock at any second,
// finds every one of them going on.
//  BY THE WORLD'S CLOCK (the time the engine hands to update()):
//   - the HOUND: to and fro on its beat (P.houndRound: a narrow oval on the lead's bank at the fog bank's foot), galloping
//     the two legs and slower in its two turns, its stride by the metres it has run. Its fire always burns, and what the fire
//     lights goes where the hound goes: the glow at its head, its light on the ground and on what stands about it, its light
//     on the fog's edge and its light in the pools;
//   - the RARE SECOND HOUND (one visit in eight): round the tarn's shore, the other way, drawn in its fire only;
//   - the FOG BANK: it lies where it lies for the whole visit; its top's slow swells drift in place, and the tongues of its
//     low foot roll out and draw back;
//   - the PONIES: they graze where they stand; each lifts its head once in its own 12 to 22 s;
//   - the CANDLE carried to and fro behind the hall's first-floor windows, shown and hidden once in 9 s; every other lamp, window
//     and fire of the place burns steadily (with the kit's flicker);
//   - the FOX: out along its beat by the wicket gate to its bracken and back, with a rest at each end;
//   - the white OWL: round and round over the yew walk; the BATS: round and round over the towers;
//   - the smoke of the hall's chimneys, of the moor cottage and of the hut in the yard (none from the works' stacks), the wind
//     in the leaves, the mist's grain (its sheets stand where they are laid), the wisps, the brook, the clouds, the man's
//     head on the tor. The wheel stands still.
//  BY THE PLACE OF THE EYE: every term of the eye in this file and in the part, each with its kind. None of MY OWN places,
//     times, shows, hides, thins or moves a thing. THE KIT'S fades and NEAR GUARDS (named below, each with its measure) do
//     thin a thing by its distance from the eye: they are the kit's, and are said here as they are. THE FOG IS ONE BODY, THE
//     SAME FROM EVERY PLACE: no part of it is shown, hidden, faded or shaped by where the eye is; of the eye it has only
//     what every lit thing has, the scene's own air by its distance (three's fog law, written into its shader because the
//     shader is its own).
//   - MIRROR (what still water shows is where the eye's ray, turned up at the water, goes): the kit's water in the pools, the
//     tarn and the brook (the sky, the moon's disc, the land's skyline); and THE WATER'S LIGHT, a sheet of my own over the
//     pools and the tarn and another over the ford's pool, which adds what a mirror shows of THE LIGHTS OF THE PLACE (the
//     fire in the yard's hut, the boards' lanterns, the ring's fire and THE HOUND'S FIRE; at the ford the bridge's two
//     lanterns; each drawn out toward the eye as ripples draw a light out) and of the moon (its broken path of sparks): the
//     mirrored ray; water's own GRAZING term (it mirrors more the lower the ray lies on it); the air between the eye and
//     the water by the scene's own fog law;
//   - GLINTS: the gloss of every lit material is by the eye's ray, as all gloss is (the kit's and three's: the moon's glint on
//     wet peat, wet boards, slate and water). The place's own lights (plPut, lampsOn) are NOT by the eye: each lights what
//     stands near it by its place, its reach and the way the face looks, the same from every eye;
//   - SAMPLING (a drawn pattern goes to ITS OWN MEAN where one pixel covers more of the surface than the pattern's grain, by
//     the pixel's own footprint on the surface: what a texture's mip levels do): the ground's hook (the gravel's edge, the
//     track's ruts, the tussock heads, the heather's mottle and the pale grass heads); the yew's leaves; the ivy's leaves;
//     the water sheet's ripple and the moon's sparks on it;
//   - THE KIT'S OWN, in its makers that are handed the camera every frame: the grass, bracken, heather, gorse, reeds, cotton
//     grass and garden flowers fading out with their distance (the kit's fade) and hidden by the chunk beyond it; the oaks'
//     scatter and the tall reeds (the kit's update); the kit's water; the sky's dome, the far ridges of the
//     horizon (they stand at infinity as the sky does) and the light rig with its shadow map, which keep about the eye;
//   - THE KIT'S NEAR GUARDS (each named with its measure as the kit has it; they are not mine): A CARD OF MIST (a sprite that
//     faces the eye) fades from 1.3 times its own size from the eye to nothing at 0.3 of it: every card of mine is laid
//     farther than that from the whole line by the place (MIST_OFF, mistBar), so that this guard has nothing to do; A PUFF
//     OF SMOKE (the hall's chimneys, the cottage's, the hut's) from 1.2 times its size to 0.3 of it; A GLOW from 1.5 times
//     its size to a quarter of it; A BIRD OF A FLOCK is shrunk from 2.2 times its length and span to nothing at 0.8 of it
//     (the owl's and the bats' courses lie many times that from the line: the lane's notes keep both);
//   - THE KIT'S GLOWS (every lantern, the candle, the windows' and the fires' glows, the wisps, the hound's glow): sprites
//     that face the eye; the lamps' are never smaller on the screen than 0.008 rad across and the hound's never smaller
//     than 0.035 rad (the kit's minAngle: a far lamp is still a point of light);
//   - THE KIT'S FLOCKS (the bats, the owl): the kit's call hands them the camera and the metre flown every frame; each has a
//     closed course of its own, for which the kit reads neither: where a bat or the owl is, is the clock's alone (of the
//     camera the kit takes its near guard, named above, and nothing else);
//   - THE HOUNDS AND THE PONIES (the part): the cards of the hounds' flames turn to the eye about their own axis; the fire's
//     glow on the coat is strongest where the coat turns away from the eye; THE MOON'S DIM EDGE on the first hound's and the
//     ponies' coats (the rare second hound has none) is by the angle of view in the same way (a rim); the hound's HALO is a sprite at its head that faces the
//     eye (small in clear air, broad where the fog's own depth at the hound's place is great).
//     Nothing else. THE GRANITE'S RIM OF MOONLIGHT is by the moon and the stone, not by the eye. THE AIR IS ONE for the whole
//     visit (the hour's own colour and density, set once in build); what is whiter in the bank is the bank's own body.
//  BY THE METRES FLOWN (the film's own, nothing of the story): the pace between places of the line (P.pace) and the gaze's pulls
//     (their weights, as handed to the engine: the long look 0.5, the park's look 0.8, the man 0.55, the mire's look 0.8):
//     THE LONG LOOK on the way down on to the mire, from the pass's end to S.in, where the line lies level on the boards; THE
//     PARK'S LOOK to the wicket gate at the far end of the yew alley, from the entry to 30 m short of that gate; the man on
//     the tor (let go where the line turns from him: where he has swung 5 degrees off the heading); the mire's look (from
//     where the mine's mouth first shows to the mouth, and held on the mouth through the way down and over the boards to
//     the engine's own end guard: round 11); and the opening of the ring at the end (the engine's own, revealDistance).
//
// THE FOG IS LOW (the lead's ruling of round 10). A level-topped white bank over the mire's low eastern ground: its top SEA.top
// metres over the mire's level with slow swells on it, its near edge a face that rises from the shore over the fringe's
// breadth, a low foot of mist creeping out from the shore in tongues. IT LIES BY THE LAND ALONE: its shore is the plan's
// (an oval of the basin's own frame with bays and headlands, farther out down the lead's wet hollow, off rising ground, off
// the old stack with 30 m about its pool, off the works' island and the mine's hill, and, round 11, OFF THE OLD WAY BY SEA.off
// METRES: the way is the plan's road, a thing of the land; the line we fly is not asked); its top is one level; the foot's mist is nowhere higher than its own level over the mire and thinner
// where the ground stands up into it. Nothing in it is laid, capped or thinned by the line or by the eye. Where the land
// stands higher than its top the land stands through it; two old thorns rooted under it show their crowns over it.
// ROUND 11 (A4): its body is MODELLED BY THE MOON (a billow's side to the moon lit, its far side and every hollow blue-grey, a
// slow mottle over all: SEA.model, in the part's FOG_FRAG), its shade by day and at dawn is a deep grey (it was near its
// light: one flat tone), and torn wisps stand over its top near the shore (SEA.shell), drifting by the world's clock.
//
// THE LANE. Nothing that stands comes within 2.5 m of the line we fly, the whole of each thing with its sway, nor within 2.5 m of
// the 280 m of the entry axis behind the entry (the line's first heading continued backward, level: the camera that shows this
// world inside the last world's ring flies it). build() measures every kind against both (see THE LANE there), leaves out what
// can be left out when it stands inside, and keeps the least distance of every kind with the scene. THE GRASS LAW: ground cover
// whose top stays a metre and more under the eye (the grass tufts, the tussocks, the near stones, the cotton grass) is the
// floor's dress and is held to 1.0 m of clear air from the line; the bare floor under the eye (land, gravel) to 2.0 m;
// everything higher keeps the lane's 2.5 m. The lane is the line's ONLY say over the place: a thing that cannot keep it is
// left out, or (a card of mist, a drift) laid no nearer than its own reach allows; nothing else of the world's own is
// placed, moved, thinned or dressed by its distance from the line. ONE THING IS THE KIT'S AND IS SAID HERE AS IT IS: the
// kit's makers of ground cover (the grass tufts, the bracken, the heather, the gorse, the reeds, the cotton grass, the
// garden's flowers) take the line and a radius and lay their plants within that radius of it and nowhere else (30 m for the
// tufts and the cotton grass, 40 for the bracken and the heather, 34 for the gorse, 60 for the reeds, the garden's half
// breadth for its flowers); what grows where inside that band is the place's rule (each maker's density by the place).
// What goes by the world's clock and has a place of its own (the two hounds, the fox, the owl, the bats, the wisps, the candle,
// the smoke) keeps the lane at every clock, since a world entered through a ring arrives with its clock already running: my
// count measured each of them against the whole line at every phase of its own clock (rounds 9 and 10: the count's tool
// is not kept; their rules are as they were, kept with the scene in userData.clockwork).
import * as THREE from 'three';
import * as core from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as FA from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as ST from '../kit/structures.js';
import * as Water from '../kit/water.js';
import { makeHound, makeFogSea, makePonies, makeTorFigure, makeFox, HOUND_FIRE, GHOST_FIRE } from '../parts/moor-under-the-fog-bank.js';

const { clamp, lerp, smoothstep, makePath, makeRng, hashSeed, makeNoise } = core;
// (the root of two squares, plain: the land's height and its zones ask it some millions of times a build)
const hyp2 = (a, b) => Math.sqrt(a * a + b * b);
const DEG = Math.PI / 180;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ------------------------------------------------------------------------------------------------ the plan of the place
// x east, z south, y up, metres. PLAN NORTH is -z: the avenue, the hall and the yew alley lie on x = 0 and run to plan north (the
// compass's west-north-west). Every azimuth in this file is counted clockwise from plan north.
// THE LAND FIRST, THEN THE FOG BY THE LAND, THE WAY BY THE LAND, THE LINE LAST (round 9). planPlaces lays the places by the
// place's own measures and reads no route: the hall on its avenue; the yew alley behind it with the wicket gate in its far
// end; then THE LAND (LAND, below): the knoll, the brook's reach under it and the ford, the tor up the moon's line from the
// ford, the pass beside its crown, the mire's basin with its tarn and its lead, the works on their hill; THE FOG where the
// land has it (SEA: an oval of the basin's own frame on its low eastern side; its shore keeps off rising ground); and only
// then THE OLD WAY from the wicket gate to the mine, laid through the land's places (WAY has its few own measures: a sunken
// lane between dry-stone walls, round the knoll's foot, along the brook's reach to the turn for the clapper bridge, the
// miners' path up the tor's hill, through the pass and down to the mire's shore, the wand path from firm island to firm
// island round the tarn to the works' yard); the hounds' rounds. layLine then flies a line over the old way, a few metres
// over it (its height on each stretch is the eye's, EYE0 to MIRE_EYE below; the least and the most as flown are counted),
// and the pace and the gaze are laid on that line.
// (the hall's front stands 116 m down the avenue; its towers are of the block's own stone and stand 24.5 m, under 1.6 times the
// roof's 15.5 m)
export const HALL = { zFront: -116, depth: 17, halfW: 17, eaves: 12, ridge: 15.5, towerX: 13, towerW: 7, towerH: 24.5 };
// (the yew alley: its head and its far end, where the wicket gate stands in the end hedge; half the breadth between its two hedges'
// faces; a hedge's thickness and its height)
export const ALLEY = { z0: -222, z1: -306, half: 4.75, thick: 2.8, high: 4.0 };
export const RIVER_Y = -13;
// the mine's spoil heaps, in the YARD's own frame (metres along the yard's axis past the mine's mouth, metres to the right of it, radius,
// height): none reaches within 11 m of the axis
const HEAPS = [[-23, -25, 9, 4.6], [-26, 21, 8, 3.6], [5, 26, 9.5, 5.0], [-7, -24, 9, 4.8]];
// THE YARD'S ENGINE HOUSE, in the same frame (the works' own plan): it stands BESIDE AND BEHIND THE MINE'S MOUTH, on its left hand at
// the foot of the mine's hill, roofless, its gable with the one round arch toward the yard: from 15 to 26 m beyond the mouth, its near wall 12.2 m from the
// yard's axis (6 m outside the cutting's lip) and its far wall 26.2 m; its stack stands off its far corner (YARD_STACK). A
// platform of spoil carries them both (houseAt: 1 on the platform, nought 5 m off it).
const YARD_HOUSE = { x0: 15, x1: 26, z0: -26.2, z1: -12.2 }, YARD_STACK = [29.2, -24.6];
// THE HUT IN THE YARD, in the same frame: its middle, its half length along the yard's axis and its half depth across it
const WORKS_HUT = { x: -15, z: -18, hx: 2.3, hz: 1.8 };
const houseAt = (iw, il) => 1 - smoothstep(0, 5, Math.hypot(Math.max(YARD_HOUSE.x0 - 1 - iw, 0, iw - YARD_STACK[0] - 3.5), Math.max(YARD_HOUSE.z0 - 1 - il, 0, il - YARD_HOUSE.z1 - 1)));
const heapAt = (iw, il) => { let h = 0; for (const q of HEAPS) { const d = Math.hypot(iw - q[0], il - q[1]); if (d < q[2]) h = Math.max(h, q[3] * (1 - smoothstep(0.12, 1, d / q[2]))); } return h; };
const GARDEN_HALF = 21;
// THE EYE'S HEIGHTS (they are the line's, not the place's): at the lodge gates and down the avenue; on the yew alley's walk; over the
// wicket gate (which stands 1.3 m); over the old way in the sunken lane and round the knoll; between the stone rows; over
// the brook's bed at the clapper bridge (whose slabs lie 1.56 m over the bed); on the tor's flank; through the pass beside
// the crown; where the way comes down on to the mire's shore
// (OVER: the park's line over the hall: `roof`: the eye over the top of the lantern roof on the hall's ridge, the highest thing
// of the roof under the line; `level`: the line lies level on the walk's height that far before the alley's head.
// ROOF_LANTERN: the lantern roof's top over the ridge.)
const OVER = { roof: 2.7, level: 14 }, ROOF_LANTERN = 1.8;
const EYE0 = 3.4, WALK_EYE = 2.6, GATE_OVER = 3.9, WAY_EYE = 3.9, ROW_EYE = 2.45, BRIDGE_EYE = 4.3, HILL_EYE = 3.6, PASS_EYE = 4.3, GRASS_EYE = 3.3;
// the wand path's walking level (its islands' trodden turf and its boards) stands PATH_UP over the mire's level; the eye is PATH_EYE
// over it
const PATH_UP = 0.28, PATH_EYE = 2.6, MIRE_EYE = PATH_UP + PATH_EYE;
// the camera's field (degrees, top to bottom)
export const FOV = 58;
// (BACK_M: the metres of the entry axis behind the entry that the lane keeps clear. The world is first seen through the last
// ring of the world before it, by an eye that flies this axis from far behind: 280 m, which is as far back as the land is drawn.)
const BACK_M = 280;
// (BLOOM_T: the bloom's threshold; the hound's own fire is held under twice this in the part's shader)
const BLOOM_T = 0.92;
// (THE RING'S FIRE, round 8: the opening at the works burns red-gold, of the mine's own light; the hound's fire is the hound's alone)
const RING_FIRE = '#ff9a4c';
// THE MINE'S HILL, in the yard's frame: its middle lies `e` metres along the yard's axis beyond the ring and `n` to the right of
// it; its radius and its height over the mire
const MINE_HILL = { e: 96, n: -8, r: 76, h: 32 };
// THE LAND'S MEASURES (round 9: THE LAND FIRST; metres and degrees). planPlaces deals the land's places by these and reads no way.
//  knoll: a round green hill north of the park, west of the park's own axis: its foot's radius `r`, its height `h`; its middle lies
//    `north` metres north of the park's wall and its foot's radius and `foot` metres west of the park's axis (the old way goes
//    round its foot `foot` metres outside it).
//  reach: a straight reach of the brook passes the knoll's north-east foot `off` metres outside the way's round; going up it, it
//    bears `bear` degrees to the left of the moon's bearing; `up` metres up it from abreast of the knoll it turns west within
//    `bend` metres, and THE FORD lies ford[0] metres west of the reach's head there (across the moon's bearing) and ford[1]
//    metres beyond it along that bearing; below the knoll it runs `on` metres more and turns east over `out` metres.
//  tor: the man's rock stands `up` metres from the ford up the moon's own line (bearing and height); the crown under him is
//    `crown` metres tall, its main pile's foot `r0` metres in radius; the hill's level top reaches `top` metres from the
//    man's rock; toward the ford its flank ends `foot` metres short of the ford and falls evenly but for its rounded brow
//    and foot (each `round` of its length); on every other hand it is a broad bell `back` metres from the top's edge to its foot.
//  pass: the pass beside the tor's crown runs `at` metres outside the feet of the crown's rocks and ends `end` metres beyond
//    abreast of the man's rock; the landing at the mire's shore lies `lip` metres down the pass's line from abreast of it.
//  lode: the old stack stands on the lode's line, which runs out from the mine's mouth along the works' cutting, `stack` metres
//    out, within `side` metres of the line.
//  basin: the works' yard lies `len` metres down the basin's axis from the landing; the axis bears half the firm ridge's bow
//    (`bow` degrees) and `skew` degrees more to the left of the pass's line; the tarn lies tarn[0] to tarn[1] of `len` short of
//    the basin's middle, tarn[2] to tarn[3] metres to the right of its axis.
//    (THE YARD'S STRAIGHT, round 11: the wand path's one bow ends where the yard's axis takes it, and what is left is the
//    straight into the yard: `len` times the sine of `skew` over the sine of half the `bow`. With the skew from 9.7 degrees
//    up it is 67.4 m and more on every seed (224 m, 9.7 and 68 degrees give the least); until round 11 the skew began at
//    8.5 degrees and the straight at 59 m, too short for a last 60 m that are the straight itself.)
const LAND = { knoll: { r: [50, 58], h: [6.5, 8.5], foot: 13, north: [52, 62] }, reach: { off: 22, bear: [30, 40], up: [72, 94], on: [34, 46], out: 44, bend: 13, ford: [28, 25] },
  tor: { up: 126, crown: 11.5, r0: 8.5, top: 20, foot: 10, round: 0.2, back: 150 }, pass: { at: 9, end: 12, lip: [150, 164] }, lode: { stack: [208, 222], side: 3 }, basin: { len: [224, 240], skew: [9.7, 10.5], bow: [62, 68], tarn: [0.35, 0.39, -2, 6] } };
// THE OLD WAY's own measures (metres): `sunk`: the sunken lane's length from the gate; `brook`: the radius of its turn from beside
// the brook's reach on to the moon's bearing through the ford; `crown`: the radius of its round from the climb on to the
// pass's line. Every other measure of the way is the land's (LAND): it is laid through the land's places in planPlaces,
// after them.
const WAY = { sunk: 48, brook: 55, crown: 48 };
// (the sunken lane lies this deep between its banks; the open track is trodden this deep)
const SUNK_DEEP = 1.25, TRACK_DEEP = 0.26;
// THE BROOK'S POOL AT THE CROSSING: where the old way crosses it the brook lies broad and still, 6 m broader on each side than its
// channel, over the 4 m of its length either side of the crossing, narrowing to the channel 13 m from it; the clapper bridge
// spans the pool
const FORD = { wide: 6, near: 4, far: 13 };
const fordWide = (b) => FORD.wide * (1 - smoothstep(FORD.near, FORD.far, Math.abs(b)));
// THE TARN (its place is the land's: LAND.basin.tarn): its half length and its half breadth; it is `deep` metres deep at its middle
const TARN = { a: 38, b: 24, deep: 1.6 };
// THE FOG BANK (ONE BODY; its shore and its bounds are the plan's: planPlaces, P.seaDepth and P.seaRim). THE FOG IS LOW AND ITS
// GROUND IS THE LAND'S: a level-topped white bank on the low wet ground of the basin's eastern side and beyond its rim. It
// lies in an oval of the basin's own frame: the oval's middle lies at[0] of the basin's half length along its axis from its
// middle and at[1] of its half breadth to the right; its radii are rad[0] of the half length and rad[1] of the half breadth.
// Its shore goes in and out by the land's own noise (`bay`: metres and 1 / the lattice, two sizes), comes lead[0] metres
// farther out in a bay lead[1] metres broad down the lead (the basin's stream; from lead[3] metres up the lead from the
// tarn's head and more, and not at all below lead[2]) and keeps off rising ground (`shelf`: beyond shelf[0] metres over
// the mire's level every metre of the drawn ground takes shelf[1] metres of it). The old way keeps what distance from it
// the land gives, now near, now far, and since round 11 `off` metres at the least (below). ITS BOUNDS are a rounded
// oblong about the basin's middle (P.Cm), in the basin's own frame: `reach[0]` of the basin's half length toward the
// tor's hill, `reach[1]` of it away from the tor, `reach[2]` of the basin's half breadth to either hand.
// ITS BODY (the part builds it of these numbers): `top`: its level top over the mire's level, a house's height; `heave`:
// its slow swells' lattices and heights (metres: the greater, the lesser); `fringe`: the breadth over which its face
// rises from the shore to its top, and how much that varies; `whole`: the thickness from which it hides what is behind
// it; `litK`: its white, of the hour's fog light; `veils`: the skin's and the one inner veil's measures. ITS FOOT
// (`foot`): the low mist that creeps out from the shore in tongues: at the most `thick` metres thick, as far as `reach`
// metres from the shore, and nowhere higher than `level` metres over the mire's level: by the land alone.
// ROUND 11, A4: THE FOG MUST READ AS FOG. What it was: a slab 5.5 m high whose top hardly swelled (0.55 and 0.25 m), lit one
// white all over, one inner veil behind an almost whole skin (0.8), and a foot of mist 60 m out that lay as a white sheet.
// Now: ITS TOP IS LOWER AND BILLOWS (`top` 4.6 m; swells of 1.1 m on a lattice of 46 m and 0.45 m on 15 m: its highest
// possible place is 6.3 m over the mire, as it was); the part lights the billows by the moon (`model`: the slope told so
// many times over in the light alone) and mottles the body's tone; TWO INNER VEILS behind a thinner skin (0.6 each, 4 m
// apart), so that what stands in its edge fades by degrees; THE FOOT IS A THINNER, NEARER MIST (0.8 m thick at the most,
// 30 m out in tongues, alpha 0.5, its tone mottled: not a sheet); and TORN WISPS STAND OVER ITS TOP near the shore (`shell`: two
// layers 0.3 and 0.6 m over the top, drifting and changing by the world's clock). `off`: THE BANK STANDS OFF THE WAND
// PATH: no part of its body lies within 16 m of the old way's middle (a law of the place: the path is the place's own,
// laid where the mire lets a man walk; on 15 seeds of 300 the shore came nearer than that, to 7.75 m, and the bank
// stood over a walker's head hard by the boards).
const SEA = { at: [-0.1, 1.9], rad: [2.75, 1.38], bay: [24, 1 / 95, 9, 1 / 37], lead: [52, 26, 70, 110], shelf: [0.9, 10], reach: [3.0, 3.0, 3.2], top: 4.6, lift: [0, 30, 300], cover: 0, heave: [46, 1.1, 15, 0.45], fringe: [11, 3], whole: 2.2, litK: 0.42,
  veils: { n: 2, step: 4, drop: 0.4, alpha: 0.6, band: 60 }, foot: { thick: 0.8, reach: 30, alpha: 0.5, level: 1.2 }, shell: { band: 45, heights: [0.3, 0.6], alpha: [0.5, 0.34] }, model: 3.2, off: 16 };
// (the grass's tallest tuft and its half spread, as the lane measures them)
const GRASS_H = 0.78, GRASS_R = 0.6;
// THE SPEEDS the line is laid for and the pace table is made of (metres a second; the engine scales the whole table by one factor
// so that the flight takes its FILM_S seconds: layPacing works that factor out, P.paceK): down the avenue; on the rise before the hall;
// over the roof; coming down over the garden; in the yew alley; in the sunken lane; round the knoll; between the stone rows beside
// the brook; on the turn to the clapper bridge and over it; on the tor's hill; past the crown and through the pass; on the way
// down; at the mire's shore; past the hound's beat (the line's slowest: the 48 m before the lead, on whose bank the beat lies);
// on the wand path; into the yard
const SPEED = { avenue: 15.5, rise: 9.5, roof: 10.5, fall: 13.5, alley: 15, lane: 20, knoll: 19, rows: 15.5, brook: 12.5, climb: 14, crown: 10, down: 22, shore: 14, beat: 9.5, wand: 20, yard: 21 };
// (THE SPEEDS BY THE OLD WAY'S OWN PLACES: metres along the way from the gate and the speed laid there; between two places the
// speed goes evenly from one to the other. The drape is laid by them and the pace table is made of them.)
const waySpeeds = (at) => { const b0 = at.ME + 6, b1 = Math.max(b0 + 30, at.lead - 30);
  return [[0, SPEED.alley], [at.sunk, SPEED.lane], [at.k0 + 10, SPEED.knoll], [at.knoll, SPEED.rows], [at.rows1 - 16, SPEED.rows], [at.rows1 + 6, SPEED.brook], [at.V + 4, SPEED.brook], [at.V + 44, SPEED.climb], [at.A0 - 10, SPEED.climb], [at.A0 + 12, SPEED.crown],
    [at.T1, SPEED.crown], [at.T1 + 50, SPEED.down], [at.ME - 60, SPEED.down], [at.ME - 24, SPEED.shore], [b0, SPEED.beat], [b1, SPEED.beat], [Math.min(b1 + 44, at.arcEnd - 8), SPEED.wand], [at.arcEnd, SPEED.wand], [at.I, SPEED.yard]]; };
// (TURN_S: the old way's drape is laid so that the line's pitch turns no faster than 1 / TURN_S radians a second at the speed it is
// laid for)
// (TURN_LANE, round 11: from the wicket gate to 10 m beyond the round about the knoll's foot the line's pitch turns UPWARD no faster
// than 1 / TURN_LANE radians a second at the speed laid: where the way falls into the sunken lane and levels on the water
// meadow the line levels more slowly. At 1 / TURN_S the gaze's pitch came up ten degrees in 1.38 to 1.5 s as flown there.)
const TURN_S = 12.5, TURN_CLIMB = 5.5, TURN_BROW = 9.5, TURN_LANE = 18;
// (FILM_S: the seconds the flight is laid to take; the engine is handed it as the duration and the pace table is scaled to it)
const FILM_S = 49;


// (in parts, so that build() can hand the page back between them: the places, the route's points, the route, its stations, the paces and
// the hound's course)
// EVERY STREAM OF CHANCE in the world, by name: one for each thing that draws, made of the thing's name and the seed and taken once,
// here. A change to how much one thing draws moves no other thing. ('land' is the land's noise: its entry is that noise's seed.)
const STREAMS = ['plan', 'land', 'hound', 'sky', 'clouds', 'terrain', 'ridges', 'hall', 'lit', 'chimneys', 'yard', 'yewform', 'garden', 'oakgeo', 'avenue', 'park', 'oaktint', 'treescatter', 'thorngeo', 'deadgeo', 'drownedgeo',
  'torgeo', 'crown', 'clitter', 'bouldergeo', 'menhirgeo', 'wallgeo', 'stonerow', 'circle', 'huts', 'boulders', 'figure', 'riverwater', 'bridge', 'riverstones', 'ponies',
  'orchard', 'pools', 'wands', 'deadtrees', 'posts', 'drowned', 'ricks', 'boundary', 'reedbeds', 'tongues', 'gardenlit', 'smoke4', 'fogthorns', 'quake', 'subjects', 'subjmore', 'bogoak', 'nearreeds', 'nearwisps', 'newtake', 'mouth', 'rubbish', 'lanterns', 'wheel', 'peat', 'mist', 'miremist', 'mistclose', 'mistwide', 'rowmist', 'rowmistB', 'grass', 'tussock', 'brackengeo', 'bracken',
  'heathergeo', 'heather', 'gorsegeo', 'gorse', 'thorns', 'thornscatter', 'reedgeo', 'reeds', 'cotton', 'hound-flames', 'ghost-flames', 'ghost', 'candle', 'lampglow', 'wisps', 'wispglow', 'bats', 'owl', 'fox', 'houndglow',
  'smoke0', 'smoke1', 'smoke2', 'smoke3', 'moorhut', 'grain', 'ruins', 'ruinbuild', 'seamist', 'hollow', 'nearstones', 'flowers', 'halllit', 'lanewall', 'torgate', 'fordwater', 'lessertors', 'boards', 'leadwater', 'pathblocks', 'sheep', ...[0, 1, 2, 3, 4, 5].map((i) => 'pile' + i), ...Array.from({ length: 12 }, (q, i) => 'torpile' + i), 'hutwall0', 'hutwall1', 'hutwall2', ...[0, 1, 2, 3, 4, 5, 6].map((i) => 'fartor' + i), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => 'outcrop' + i),
  // (POLISH 1, STAGE C3: the fallen blocks, the heather clumps' deal and the kit's own draws for the clumps' bushes: three streams of their own, last in the list)
  'fallen', 'clumps', 'clumpbush',
  // (POLISH 1, THE LAST STAGE: the field wall's draws: one stream of its own, last in the list)
  'fieldwall'];
const takeStreams = (seed) => { const fk = {}; for (const name of STREAMS) fk[name] = name === 'land' ? hashSeed('land:' + seed) : makeRng(hashSeed(name + ':' + seed)); return fk; };
// (the plan, whole, as the tools ask it: the places, then the line and what is laid on the line)
export function planMoor(seed) { const fk = takeStreams(seed), P = planPlaces(seed, fk); layLine(P); liftRoute(P); if (P.lifts) liftRoute(P); if (P.lifts) liftRoute(P); layPath(P); layStations(P); layPacing(P, fk); P.zone = (x, z, o = {}) => zoneAt(P, x, z, o); return P; }
// THE PLACES. Nothing here reads a route: the old way is a thing of the place (a lane, a track, a path), laid by the measures in WAY.
// (laid in steps: planPlacesSteps hands back at each `yield`, so that the build can hand back to the page between them; planPlaces
// runs the same steps through in one go, for the tools and the counts. The same holds for layLineSteps and layLine below.)
function planPlaces(seed, fk) { const it = planPlacesSteps(seed, fk); for (;;) { const r = it.next(); if (r.done) return r.value; } }
function* planPlacesSteps(seed, fk) {
  const rp = fk.plan, noise = makeNoise(fk.land);
  // THE MOON: low, 21 to 29 degrees to the left of plan north: it stands over the left-hand hedge as one goes down the yew alley to
  // the gate. The tor stands on its bearing from the ford (below), so that the climb from the bridge has it dead ahead: the line's
  // heading stays within 12 degrees of it for 96 to 108 m there. Twice more the line turns THROUGH the moon's bearing in passing:
  // in the sunk lane before the knoll (26 to 30 m of the line within 12 degrees of it) and in the mire's bow on the boards (61 to
  // 68 m; nothing is laid on the moon's line there: the old stack stands on the lode's line out from the mine's mouth, more than
  // 100 degrees off the moon's bearing from that place). (Counted from the plan on seeds 1 to 300, round 11; the moon itself
  // stands in one place for the whole flight: nothing moves it.)
  const azOff = rp.range(-29, -21), azDeg = 360 + azOff, elDeg = rp.range(19.5, 23), AZ = azOff * DEG, EL = elDeg * DEG;
  const m = [Math.sin(AZ), -Math.cos(AZ)], nR = [-m[1], m[0]];
  const M = new THREE.Vector3(m[0] * Math.cos(EL), Math.sin(EL), m[1] * Math.cos(EL));
  // (a heading's own direction on the plan and the direction to its right hand; the place where two lines of the plan meet)
  const dirOf = (h) => [Math.sin(h), -Math.cos(h)], rightOf = (h) => [Math.cos(h), Math.sin(h)];
  const meet = (p, t, q, u) => { const k = ((q[0] - p[0]) * u[1] - (q[1] - p[1]) * u[0]) / (t[0] * u[1] - t[1] * u[0]); return [p[0] + k * t[0], p[1] + k * t[1]]; };
  // ================ THE LAND, FIRST (LAND, at the head of the file). No way is read from here down to THE OLD WAY.
  // THE KNOLL: a round green hill north of the park, west of the park's own axis.
  const LK = LAND.knoll, knR = rp.range(LK.r[0], LK.r[1]), knH = rp.range(LK.h[0], LK.h[1]), Rk = knR + LK.foot;
  const K = [-Rk, ALLEY.z1 - rp.range(LK.north[0], LK.north[1])];
  // THE BROOK'S REACH UNDER THE KNOLL: a straight reach of the brook passes the knoll's north-east foot, LAND.reach.off metres
  // outside the round the old way makes about the knoll; upstream it bears 30 to 40 degrees to the left of the moon's bearing
  // (hr: the reach's bearing going up it; Q0: the reach's place abreast of the knoll's middle)
  const LR = LAND.reach, hr = AZ - rp.range(LR.bear[0], LR.bear[1]) * DEG, tr = dirOf(hr), rr = rightOf(hr);
  const Q0 = [K[0] + (Rk + LR.off) * rr[0], K[1] + (Rk + LR.off) * rr[1]];
  // THE FORD (V, where the clapper bridge stands): `up` metres up the reach from abreast of the knoll the brook turns west under
  // the tor's hill and lies broad and still, square to the moon's bearing: the ford lies LAND.reach.ford[0] metres west of the
  // reach's head there and ford[1] metres beyond it along the moon's bearing. (The old way is laid to it afterwards.)
  const upReach = rp.range(LR.up[0], LR.up[1]);
  const V = [Q0[0] + upReach * tr[0] - LR.ford[0] * nR[0] + LR.ford[1] * m[0], Q0[1] + upReach * tr[1] - LR.ford[0] * nR[1] + LR.ford[1] * m[1]];
  // THE BROOK'S COURSE, in the ford's own frame (a metres toward the moon from the ford, b metres to the right of that): a = the
  // course at b. West of the ford (b under nought) it wanders across the moon's bearing by the seed; east of the ford it turns
  // within LAND.reach.bend metres into the reach (bX: where the reach's line meets the ford's), runs down the reach past the
  // knoll, `on` metres beyond abreast of it, and turns east again over `out` metres, away from the park.
  const tb = tr[0] * nR[0] + tr[1] * nR[1], ta = tr[0] * m[0] + tr[1] * m[1], s0 = -ta / tb;
  const bQ = (Q0[0] - V[0]) * nR[0] + (Q0[1] - V[1]) * nR[1], aQ = (Q0[0] - V[0]) * m[0] + (Q0[1] - V[1]) * m[1];
  const bX = bQ + aQ / s0, b1 = bQ - rp.range(LR.on[0], LR.on[1]) * tb;
  const rivA = rp.range(10, 17), rivL = rp.range(52, 70), rivPh = rp.range(0, 6.28);
  // (the slope's own ramp, summed: nought before 0, t - 1/2 after 1)
  const ramp1 = (t) => (t <= 0 ? 0 : t >= 1 ? t - 0.5 : t * t * t - 0.5 * t * t * t * t);
  const course = (b) => (rivA * (Math.sin(b / rivL + rivPh) - Math.sin(rivPh)) + 6 * Math.sin(b / 23 + rivPh * 2) * smoothstep(12, 40, Math.abs(b))) * (1 - 0.75 * smoothstep(0, 30, b))
    - s0 * (LR.bend * ramp1((b - bX) / LR.bend + 0.5) - LR.out * ramp1((b - b1) / LR.out));
  // (the course is kept at every metre of b, with the cosine of its slope there: a place's distance from the brook is its
  // distance from the course along a, by that cosine)
  const BRK = 900, bkA = new Float32Array(2 * BRK + 1), bkC = new Float32Array(2 * BRK + 1);
  for (let i = 0; i <= 2 * BRK; i++) bkA[i] = course(i - BRK);
  let rivLo = 0, rivHi = 0;
  for (let i = 0; i <= 2 * BRK; i++) { const sl = (bkA[Math.min(2 * BRK, i + 1)] - bkA[Math.max(0, i - 1)]) / (i > 0 && i < 2 * BRK ? 2 : 1); bkC[i] = 1 / Math.sqrt(1 + sl * sl); rivLo = Math.min(rivLo, bkA[i]); rivHi = Math.max(rivHi, bkA[i]); }
  const meander = (b) => { const f = clamp(b + BRK, 0, 2 * BRK - 0.001), i = Math.floor(f); return bkA[i] + (bkA[i + 1] - bkA[i]) * (f - i); };
  const brookCos = (b) => bkC[clamp(Math.round(b + BRK), 0, 2 * BRK)];
  // A PLACE'S DISTANCE FROM THE BROOK (a, b in the ford's frame; negative on the park's side of it): its metres from the course
  // along a, by the cosine of the course's slope there; on the park's side, where the place lies abreast of the reach (the foot
  // of its perpendicular on the reach's line falls between the ford's turn and the reach's lower turn), the distance from the
  // reach's line if that is the nearer (the knoll, the lane's end and the park's north-east corner lie in that angle)
  const cR = 1 / Math.sqrt(1 + s0 * s0), brookD = (a, b) => { let da = (a - meander(b)) * brookCos(b); if (da < 0) { const dr = (a + s0 * (b - bX)) * cR, bf = b - dr * s0 * cR, k = dr < 0 ? smoothstep(bX - 20, bX, bf) * (1 - smoothstep(b1, b1 + 40, bf)) : 0; if (k > 0) da = lerp(da, smax(da, dr, 12), k); } return da; };
  yield;
  // THE TOR (LAND.tor): a crown of piled granite 11.5 m tall on a hill; the man stands on its highest rock (F is at his breast),
  // 126 m up the moon's own line from the ford (the line from a man's eye on the bridge to the moon: its bearing and its
  // height), so that from the bridge he stands against the moon. The hill's level top lies under the crown's foot; toward
  // the ford the hill falls in one even flank to the brook's bank, on every other hand it is a broad bell (makeLand).
  const LT = LAND.tor, T0 = LT.up, yV = RIVER_Y + 2.85, hT = T0 * Math.cos(EL);
  const Fp = new THREE.Vector3(V[0] + hT * m[0], yV + T0 * Math.sin(EL), V[1] + hT * m[1]);
  // (the hound's size: P.HOUND_K of the part's own make, whose rest pose is 3.125 m from nose to tail's tip: 2.44 m at rest and
  // 2.49 m at the gallop's longest stretch, by my probe of every vertex through its bones over two rounds: never over 2.5 m)
  const FIG_H = 3.8, STACK_H = LT.crown, CROWN_R = 11, HOUND_K = 0.78, hillTop = Fp.y - FIG_H * 0.62 - STACK_H, hillFront = hT - LT.top - LT.foot;
  // THE CROWN'S SHOULDERS (the plan's; the build piles them): four or five piles round the main pile, each 6.5 to 8.5 m from the
  // man's rock on a foot 4.4 to 6.2 m in radius, lower on the tor's worn side (toward the brook); the main pile's own foot is
  // TOR_R0 in radius. (Dealt from the crown's own stream, each pile's bearing, distance, share of the height, foot and head.)
  const TOR_R0 = LT.r0, rCr = fk.crown, nFlank = 4 + (rCr() < 0.5 ? 1 : 0), crownA0 = rCr.range(0, 6.28), shoulders = [];
  for (let i = 0; i < nFlank; i++) { const a = crownA0 + (i + rCr.range(-0.25, 0.25)) / nFlank * 6.2832, d = rCr.range(6.5, CROWN_R - 2.5), toward = -(Math.cos(a) * m[0] + Math.sin(a) * m[1]), hK = toward > 0.3 ? rCr.range(0.45, 0.62) : rCr.range(0.55, 0.82), r0 = rCr.range(4.4, 6.2), r1 = rCr.range(2.0, 3.0) * 0.9;
    shoulders.push({ x: Fp.x + Math.cos(a) * d, z: Fp.z + Math.sin(a) * d, hK, r0, r1 }); }
  // THE PASS: the hill's north-east shoulder, beside the crown. Its line bears 38 to 43 degrees to the right of the moon's
  // bearing and runs LAND.pass.at metres outside the feet of the crown's rocks as they stand (rL: metres to the right of the
  // man's rock, the farthest foot of the main pile and its shoulders on that hand and the pass's own breadth); T1 is the
  // pass's end, LAND.pass.end metres beyond abreast of the man's rock. THE LANDING (ME): where the pass's line, `lip` metres on down
  // the hill, comes to the mire's shore.
  const downAz = AZ + rp.range(38, 43) * DEG, dn = dirOf(downAz), dnR = rightOf(downAz);
  let rL = TOR_R0; for (const sh of shoulders) rL = Math.max(rL, (sh.x - Fp.x) * dnR[0] + (sh.z - Fp.z) * dnR[1] + sh.r0);
  rL += LAND.pass.at;
  const lip = rp.range(LAND.pass.lip[0], LAND.pass.lip[1]);
  const T1 = [Fp.x + rL * dnR[0] + LAND.pass.end * dn[0], Fp.z + rL * dnR[1] + LAND.pass.end * dn[1]], ME = [Fp.x + rL * dnR[0] + lip * dn[0], Fp.z + rL * dnR[1] + lip * dn[1]];
  // THE BASIN, the land's own: its axis (w, and wR its right hand) bears to the left of the pass's line by half the bow of the
  // firm ridge and 9.7 to 10.5 degrees more; THE WORKS' YARD (I, where the mine's mouth stands) lies `len` metres down the axis
  // from the landing, under the mine's hill; the yard's own axis (d, and dR its right hand: the cutting runs along it into the
  // hill) bears 62 to 68 degrees to the left of the pass's line; the basin's middle (Cm) lies four fifths of the way from the
  // landing to the yard, 12 m to the left of the axis; its floor is level (MIRE_Y) within its rim (mireA along the axis, mireB
  // across).
  const LB = LAND.basin, arcTot = rp.range(LB.bow[0], LB.bow[1]) * DEG, dAz = downAz - arcTot, d = dirOf(dAz), dR = rightOf(dAz);
  const wAz = downAz - arcTot / 2 - rp.range(LB.skew[0], LB.skew[1]) * DEG, w = dirOf(wAz), wR = rightOf(wAz), dIsl = rp.range(LB.len[0], LB.len[1]);
  const I = [ME[0] + dIsl * w[0], ME[1] + dIsl * w[1]];
  const MIRE_Y = RIVER_Y + 3.6, mireA = 190 * rp.range(0.95, 1.08), mireB = 180 * rp.range(0.92, 1.08);
  const Cm = [ME[0] + 0.8 * dIsl * w[0] - 12 * wR[0], ME[1] + 0.8 * dIsl * w[1] - 12 * wR[1]];
  const ISLE_R = 30, CUT_HALF = 6.2, floorY = MIRE_Y - 0.8;
  // THE MINE'S HILL: beyond the yard, behind the mouth, the ground rises out of the mire in a rocky hill (MINE_HILL). The mine's upper
  // works stand on its brow over the yard: the great engine house, the tall stack and the head frame.
  const MH = [I[0] + MINE_HILL.e * d[0] + MINE_HILL.n * dR[0], I[1] + MINE_HILL.e * d[1] + MINE_HILL.n * dR[1]];
  // THE TARN: in the basin's own frame, 0.35 to 0.39 of the basin's length short of its middle and within a few metres of its
  // axis, its long axis along the basin's (x, z, the unit vector of its long axis, its two radii; s: the old way's metre nearest
  // it, found below)
  const tarnAt = [-dIsl * rp.range(LB.tarn[0], LB.tarn[1]), rp.range(LB.tarn[2], LB.tarn[3])], tarnU = dirOf(wAz + rp.range(0, 5) * DEG);
  const tarn = { x: Cm[0] + tarnAt[0] * w[0] + tarnAt[1] * wR[0], z: Cm[1] + tarnAt[0] * w[1] + tarnAt[1] * wR[1], ux: tarnU[0], uz: tarnU[1], a: TARN.a * rp.range(0.94, 1.08), b: TARN.b * rp.range(0.94, 1.08), s: 0 };
  // (how far a place lies outside the tarn's shore, in metres; negative within it, -min(a, b) at its middle)
  const tarnOut = (x, z) => { const px = x - tarn.x, pz = z - tarn.z, u = px * tarn.ux + pz * tarn.uz, v = pz * tarn.ux - px * tarn.uz; return (hyp2(u / tarn.a, v / tarn.b) - 1) * tarn.b; };
  // THE FOG'S OWN GROUND (SEA, at the head of the file): an oval in the basin's frame, its middle (fogC) on the low ground at
  // the basin's eastern side and beyond its rim, its radii along and across the basin's axis. THE LEAD: the basin's stream, a
  // slow lead of open water, comes from that low ground into the tarn's head (the tarn's end toward the landing); leadOf gives a
  // place's metres up the lead from the tarn's head (t) and its metres from the lead's line (c).
  const fogC = [Cm[0] + SEA.at[0] * mireA * w[0] + SEA.at[1] * mireB * wR[0], Cm[1] + SEA.at[0] * mireA * w[1] + SEA.at[1] * mireB * wR[1]], fogA = SEA.rad[0] * mireA, fogB = SEA.rad[1] * mireB;
  const head = [tarn.x - 0.9 * tarn.a * tarn.ux, tarn.z - 0.9 * tarn.a * tarn.uz], leadLen = hyp2(fogC[0] - head[0], fogC[1] - head[1]), lu = [(fogC[0] - head[0]) / leadLen, (fogC[1] - head[1]) / leadLen];
  const leadOf = (x, z, o) => { const px = x - head[0], pz = z - head[1]; o.t = px * lu[0] + pz * lu[1]; o.c = pz * lu[0] - px * lu[1]; return o; };
  // THE LODE AND THE OLD WORKING ON IT (LAND.lode). The mine follows a lode of tin that runs with the works' cutting (the adit
  // is driven along it into the hill); its outcrop crosses the mire on the cutting's own line, out from the mine's mouth.
  // The mine is older than its yard: THE OLD STACK with its fallen wheel pit stands on the lode `stack` metres out from the
  // mouth, at the mire's edge, within `side` metres of the lode's line, the pit running from it along the lode toward
  // the works, turned a little by its own draw; it stands on a low heap of its own spoil in a pool of its own (13 to 16 m
  // in radius), which the land is dug for (makeLand) and the zones name (zoneAt). No fire burns in it. (Its draws are
  // dealt before anything is laid by them. The round-8 engine house in the mire's middle is struck: the works are the
  // yard's, on their island under the mine's hill.)
  const LL = LAND.lode, rRn = fk.ruins, ruins = [1].map((k) => {
    const pool = rRn.range(13, 16), dd = [rRn(), rRn(), rRn(), rRn()], out = rRn.range(LL.stack[0], LL.stack[1]), side = rRn.range(-LL.side, LL.side), yaw = rRn.range(-0.2, 0.2);
    return { k, out, x: I[0] - out * d[0] + side * dR[0], z: I[1] - out * d[1] + side * dR[1], hx: d[0], hz: d[1], pool, heap: 8.5, lit: false, yaw, d: dd };
  });
  yield;
  // ================ THE OLD WAY, LAID BY THE LAND (x, z, heading at every 4 m or less; `mark` keeps the places along it by
  // name). Straight reaches and plain rounds, each round about a place of the land or between two of its lines:
  //   the sunken lane, plan north from the wicket gate, and on to abreast of the knoll's middle;
  //   ROUND THE KNOLL'S FOOT (the round about the knoll's middle, LAND.knoll.foot metres outside its foot) to the reach's bearing;
  //   ALONG THE BROOK, beside the reach (LAND.reach.off metres from the water's middle), to the turn for the bridge: the round of
  //   WAY.brook metres between the reach's bearing and the moon's bearing through the ford; OVER THE CLAPPER BRIDGE;
  //   straight up the tor's hill at the man, and by a round of WAY.crown metres on to THE PASS's line; down the pass's line to
  //   the landing; THE WAND PATH: one bow to the left round the tarn and a straight into the works' yard along the yard's axis
  //   (the bow's radius and the straight's length are what the landing, the yard and the yard's axis leave: 143 to 164 m, 68 to 83 m, round 11's count on seeds 1 to 300).
  const pl = [[0, ALLEY.z1, 0]], idx = {};
  const mark = (name) => { idx[name] = pl.length - 1; return pl[pl.length - 1]; };
  const lineTo = (p) => { const q = pl[pl.length - 1], len = Math.hypot(p[0] - q[0], p[1] - q[1]), n = Math.max(1, Math.round(len / 4)), h = Math.atan2(p[0] - q[0], q[1] - p[1]); for (let i = 1; i <= n; i++) pl.push([q[0] + (p[0] - q[0]) * i / n, q[1] + (p[1] - q[1]) * i / n, h]); };
  // (a plain round about c: from heading h0 to h1, to the left when h1 is the lesser; a point every 3 m or less)
  const roundTo = (c, R, h0, h1) => { const k = h1 < h0 ? R : -R, n = Math.max(2, Math.ceil(Math.abs(h1 - h0) * R / 3)); for (let i = 1; i <= n; i++) { const h = h0 + (h1 - h0) * i / n; pl.push([c[0] + k * Math.cos(h), c[1] + k * Math.sin(h), h]); } };
  mark('gate'); lineTo([0, ALLEY.z1 - WAY.sunk]); mark('sunk'); lineTo([0, K[1]]); mark('k0');
  roundTo(K, Rk, 0, hr); const P1 = mark('knoll').slice(0, 2);
  { const X = meet(P1, tr, V, m), tl = WAY.brook * Math.tan((AZ - hr) / 2), P2 = [X[0] - tl * tr[0], X[1] - tl * tr[1]];
    lineTo(P2); mark('rows1'); roundTo([P2[0] + WAY.brook * rr[0], P2[1] + WAY.brook * rr[1]], WAY.brook, hr, AZ); mark('moonward'); lineTo(V); mark('V'); }
  { const X = [Fp.x - rL / Math.sin(downAz - AZ) * m[0], Fp.z - rL / Math.sin(downAz - AZ) * m[1]], tl = WAY.crown * Math.tan((downAz - AZ) / 2), A0 = [X[0] - tl * m[0], X[1] - tl * m[1]];
    lineTo(A0); mark('A0'); roundTo([A0[0] + WAY.crown * nR[0], A0[1] + WAY.crown * nR[1]], WAY.crown, AZ, downAz); mark('Ae'); lineTo(T1); mark('T1'); lineTo(ME); mark('ME'); }
  { const U = [Math.cos(dAz) - Math.cos(downAz), Math.sin(dAz) - Math.sin(downAz)], ex = I[0] - ME[0], ez = I[1] - ME[1], det = U[0] * d[1] - U[1] * d[0], R = (ex * d[1] - ez * d[0]) / det;
    roundTo([ME[0] - R * dnR[0], ME[1] - R * dnR[1]], R, downAz, dAz); mark('arcEnd'); lineTo(I); mark('I'); }
  yield;
  // (the way read at every metre: its place and its heading there; `at` is each marked place in metres along it from the gate)
  const cum = new Float64Array(pl.length); for (let i = 1; i < pl.length; i++) cum[i] = cum[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
  const wLen = cum[pl.length - 1], wn = Math.floor(wLen), wx = new Float64Array(wn + 2), wz = new Float64Array(wn + 2), wtx = new Float64Array(wn + 2), wtz = new Float64Array(wn + 2);
  for (let i = 0, j = 0; i <= wn + 1; i++) { const s = Math.min(i, wLen); while (j < pl.length - 2 && cum[j + 1] < s) j++; const f = (s - cum[j]) / (cum[j + 1] - cum[j]); wx[i] = lerp(pl[j][0], pl[j + 1][0], f); wz[i] = lerp(pl[j][1], pl[j + 1][1], f); }
  for (let i = 0; i <= wn + 1; i++) { const a = Math.max(0, i - 1), b = Math.min(wn, i + 1), k = 1 / Math.hypot(wx[b] - wx[a], wz[b] - wz[a]); wtx[i] = (wx[b] - wx[a]) * k; wtz[i] = (wz[b] - wz[a]) * k; }
  const at = {}; for (const k in idx) at[k] = Math.min(wn, cum[idx[k]]);
  // (a place of the way: s metres along it from the gate and `lat` metres to its right)
  const wayAt = (s, lat = 0, out = [0, 0]) => { const i = clamp(Math.floor(s), 0, wn), f = clamp(s - i, 0, 1); out[0] = wx[i] + (wx[i + 1] - wx[i]) * f - wtz[i] * lat; out[1] = wz[i] + (wz[i + 1] - wz[i]) * f + wtx[i] * lat; return out; };
  // (and the other way about: for a place on the plan within WAY_REACH metres of the way, the metres along it, the metres to its right
  // (negative: to its left) and the distance; o.d is 99 for a place farther off. The way's points are kept in squares of WAY_CELL
  // metres: each square knows the first and the last point that can lie within the reach of any place in it.)
  const WAY_CELL = 16, WAY_REACH = 44;
  let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity; for (let i = 0; i <= wn; i++) { bx0 = Math.min(bx0, wx[i]); bz0 = Math.min(bz0, wz[i]); bx1 = Math.max(bx1, wx[i]); bz1 = Math.max(bz1, wz[i]); }
  const gx0 = bx0 - WAY_REACH - WAY_CELL, gz0 = bz0 - WAY_REACH - WAY_CELL, gw = Math.ceil((bx1 - gx0 + WAY_REACH) / WAY_CELL) + 1, gh = Math.ceil((bz1 - gz0 + WAY_REACH) / WAY_CELL) + 1;
  const gA = new Int32Array(gw * gh).fill(-1), gB = new Int32Array(gw * gh).fill(-1);
  for (let i = 0; i <= wn; i++) { const cx0 = Math.floor((wx[i] - WAY_REACH - gx0) / WAY_CELL), cx1 = Math.floor((wx[i] + WAY_REACH - gx0) / WAY_CELL), cz0 = Math.floor((wz[i] - WAY_REACH - gz0) / WAY_CELL), cz1 = Math.floor((wz[i] + WAY_REACH - gz0) / WAY_CELL);
    for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) { const k = cz * gw + cx; if (gA[k] < 0) gA[k] = i; gB[k] = i; } }
  const wayOf = (x, z, o) => {
    const cx = Math.floor((x - gx0) / WAY_CELL), cz = Math.floor((z - gz0) / WAY_CELL), k = cx < 0 || cz < 0 || cx >= gw || cz >= gh ? -1 : cz * gw + cx;
    if (k < 0 || gA[k] < 0) { o.s = -1; o.lat = 99; o.d = 99; return o; }
    let best = 1e12, bi = gA[k];
    for (let i = gA[k], e = gB[k]; i <= e; i++) { const dx = wx[i] - x, dz = wz[i] - z, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } }
    const j = bi > 0 && (x - wx[bi]) * wtx[bi] + (z - wz[bi]) * wtz[bi] < 0 ? bi - 1 : bi, f = clamp((x - wx[j]) * wtx[j] + (z - wz[j]) * wtz[j], 0, 1), px = wx[j] + (wx[j + 1] - wx[j]) * f, pz = wz[j] + (wz[j + 1] - wz[j]) * f;
    o.s = j + f; o.lat = (z - pz) * wtx[j] - (x - px) * wtz[j]; o.d = Math.hypot(x - px, z - pz);
    if (o.d > WAY_REACH) { o.s = -1; o.lat = 99; o.d = 99; }
    return o;
  };
  // (places of the land found on the way: the metre nearest the tarn's middle; the metre at which the wand path crosses the lead)
  { let best = 1e12; for (let i = Math.round(at.ME); i <= at.arcEnd; i++) { const dd = (wx[i] - tarn.x) ** 2 + (wz[i] - tarn.z) ** 2; if (dd < best) { best = dd; tarn.s = i; } } }
  { const o = { t: 0, c: 0 }; let was = 0; at.lead = tarn.s; for (let i = Math.round(at.ME) + 20; i <= at.arcEnd; i++) { const c = leadOf(wx[i], wz[i], o).c; if (was !== 0 && c * was < 0) { at.lead = i; break; } was = c; } }
  // THE FIRM ISLANDS of the wand path: low islands of turf in the wet, 40 to 52 m apart from the shore to the yard's apron, each 6 to
  // 8 m in radius (x, z, radius, metres along the way); boards on short posts go from each to the next
  const isles = [];
  for (let s = at.ME + rp.range(26, 34); s < at.I - 52; s += rp.range(40, 52)) { const q = wayAt(s); isles.push([q[0], q[1], rp.range(6, 8), s]); }

  // (at a place: how much of it is a ruin's pool, 0 to 1, and how much its heap)
  const ruinAt = (x, z, o) => { o.pool = 0; o.heap = 0; for (const R of ruins) { const dx = x - R.x, dz = z - R.z, lim = R.pool + 3; if (dx * dx + dz * dz >= lim * lim) continue; const dq = Math.sqrt(dx * dx + dz * dz); o.pool = Math.max(o.pool, 1 - smoothstep(R.pool - 3, R.pool + 3, dq)); o.heap = Math.max(o.heap, 1 - smoothstep(R.heap * 0.8, R.heap * 1.3, dq)); } return o; };
  // THE FOG'S SHORE, BY THE LAND (SEA, at the head of the file; the part builds the bank by this very function): how many
  // metres inside the fog a place of the plan is (negative: clear air). (It read no way till round 11; now it stands off the
  // old way by SEA.off metres, see below, and reads nothing else of it.) A place is inside by its metres
  // within the fog's oval (fogC, fogA, fogB: measured along the oval's own slope there); the shore goes in and out by the
  // land's own noise (SEA.bay: BAYS AND HEADLANDS, two sizes); it comes SEA.lead[0] metres farther out along the lead (the
  // fog lies down the stream's wet hollow toward the tarn: a bay SEA.lead[1] metres broad, which ends between SEA.lead[3] and
  // SEA.lead[2] metres up the lead from the tarn's head); and it KEEPS OFF RISING GROUND:
  // every metre the drawn ground stands over the mire's level beyond SEA.shelf[0] takes SEA.shelf[1] metres of it (the
  // basin's rim, the firm islands, the spoil heaps and the far hills are its headlands and its far shore). No fog lies on
  // the works' yard, on the mine's hill, nor within 30 m of the old stack's pool: nothing of the works stands in it.
  const LQ = { t: 0, c: 0 }, WQ = { s: 0, lat: 0, d: 0 }; let landF = null;
  const seaDepth = (x, z) => {
    const mx = x - fogC[0], mz = z - fogC[1], e = (mx * w[0] + mz * w[1]) / fogA, n = (mx * wR[0] + mz * wR[1]) / fogB, q = Math.sqrt(e * e + n * n);
    let dep = q < 0.05 ? fogB : (1 - q) * q / Math.sqrt(e * e / (fogA * fogA) + n * n / (fogB * fogB));
    dep += SEA.bay[0] * noise.n2(x * SEA.bay[1] + 31, z * SEA.bay[1] - 17) + SEA.bay[2] * noise.n2(x * SEA.bay[3] - 5, z * SEA.bay[3] + 9);
    const lq = leadOf(x, z, LQ); if (lq.t > 0 && Math.abs(lq.c) < 3 * SEA.lead[1]) dep += SEA.lead[0] * Math.exp(-lq.c * lq.c / (SEA.lead[1] * SEA.lead[1])) * smoothstep(SEA.lead[2], SEA.lead[3], lq.t);
    const g = landF(x, z) - MIRE_Y; if (g > SEA.shelf[0]) dep -= SEA.shelf[1] * (g - SEA.shelf[0]);
    // (nothing of the works stands in it: the yard, the mine's hill, and the old stack on the lode with its pool and 30 m about it)
    for (const R of ruins) dep = Math.min(dep, hyp2(x - R.x, z - R.z) - R.pool - 30);
    // (round 11: and it stands SEA.off metres off the old way's middle, wherever the way goes: wayOf, above)
    if (dep > -SEA.foot.reach) { const wq = wayOf(x, z, WQ); if (wq.d < 90) dep = Math.min(dep, wq.d - SEA.off); }
    return Math.min(dep, hyp2(x - I[0], z - I[1]) - 46, hyp2(x - MH[0], z - MH[1]) - MINE_HILL.r * 0.82);
  };
  // (THE FOG'S OUTER BOUNDS: how many metres inside its rounded oblong a place is; the fog thins to drifts toward them)
  const seaRim = (x, z) => { const mx = x - Cm[0], mz = z - Cm[1], dw = mx * w[0] + mz * w[1], dn2 = mx * wR[0] + mz * wR[1]; return Math.min(dw + mireA * SEA.reach[0], mireA * SEA.reach[1] - dw, mireB * SEA.reach[2] - Math.abs(dn2)); };
  // (the country the journey crosses, for the far hills: they rise beyond it)
  const spine = [[0, 40], [0, ALLEY.z1], wayAt(at.knoll), V, [Fp.x, Fp.z], T1, ME, [tarn.x, tarn.z], I, MH];
  const P = { seed, azDeg, elDeg, AZ, EL, m, nR, M, ruins, ruinAt, gate: [0, ALLEY.z1], V, yV, T0, F: Fp, FIG_H, STACK_H, CROWN_R, HOUND_K, TOR_R0, shoulders, crownA0, hillTop, hillFront, T1, ME, I, dIsl, w, wR, d, dR, downAz, dAz,
    way: { n: wn, len: wLen, x: wx, z: wz, tx: wtx, tz: wtz }, at, wayAt, wayOf, isles, tarn, tarnOut, seaDepth, seaRim, spine,
    MIRE_Y, Cm, mireA, mireB, meander, brookCos, brookD, rivLo, rivHi, ISLE_R, CUT_HALF, floorY, MH, noise,
    K, knR, knH, Rk, hr, Q0, bX, rL, fogC, fogA, fogB, lead: { head, lu, len: leadLen, of: leadOf } };
  P.land = landF = makeLand(P);
  return P;
}

const RUINZ = { pool: 0, heap: 0 }, WAYQ = { s: 0, lat: 0, d: 0 };
// (the pools' level lies this far under the mire's)
const POOL_DOWN = 0.3;
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const segDist = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return hyp2(x - a[0] - dx * t, z - a[1] - dz * t);
};
// (the park's level ground: a rectangle about the avenue, the hall and the yew alley, and how far a place lies outside it)
const parkOut = (x, z) => hyp2(x - clamp(x, -64, 64), z - clamp(z, ALLEY.z1 + 2, 46));
// (THE LEAD: how much of a place is the basin's stream, 0 to 1: a lead of open water 3 to 7 m broad that wanders a little about
// its line, from the tarn's head up toward the fog's own ground)
const LEADQ = { t: 0, c: 0 };
const leadAt = (P, x, z) => { const q = P.lead.of(x, z, LEADQ); return q.t > -6 && q.t < P.lead.len && Math.abs(q.c) < 9 ? 1 - smoothstep(1.5, 3.6, Math.abs(q.c + 3.2 * Math.sin(q.t * 0.06))) : 0; };
// (how much of a place is a firm island of the wand path, 0 to 1)
const isleAt = (P, x, z) => { let k = 0; for (const q of P.isles) { const dx = x - q[0], dz = z - q[1], lim = q[2] + 1.2; if (dx * dx + dz * dz < lim * lim) k = Math.max(k, 1 - smoothstep(q[2] - 2.2, q[2] + 1.2, Math.sqrt(dx * dx + dz * dz))); } return k; };
// (the yard's apron: the wand path's last 40 m are a causeway of spoil up to the yard)
const APRON_M = 40;
// (the road outside the lodge gates: how far it lies level)
const ROAD_M = 300;

// The land's height. Park level 0 round the hall; the moor falls to the brook; the tor's hill; the mire's basin with its tarn, its firm
// islands and the ruins' pools; the yard's mound and the cutting; the mine's hill; the old way's own hollow.
function makeLand(P) {
  const { m, nR, V, F, w, wR, d, dR, I, Cm, noise, MIRE_Y, spine, at } = P;
  return (x, z) => {
    const ax = x - V[0], az = z - V[1], a = ax * m[0] + az * m[1], b = ax * nR[0] + az * nR[1];
    // (a place's distance from the brook, negative on the park's side: P.brookD)
    const da = P.brookD(a, b), ada = Math.abs(da), adf = Math.max(0, ada - fordWide(b));
    // (the near bank lies flat for 10 m and more beside the water; the moor falls to it over 150 m: the park stands 13 m over
    // the brook, and the sunken lane goes down from the wicket gate to the water meadow under the knoll)
    let y = da < 0 ? RIVER_Y + 13 * smoothstep(10, 150, -da) : RIVER_Y + 3.0 * smoothstep(4, 70, da);
    y += (2.6 * noise.fbm2(x * 0.006 + 3.1, z * 0.006 - 1.7, 3) + 0.5 * noise.n2(x * 0.03, z * 0.03)) * smoothstep(da < 0 ? 30 : 8, da < 0 ? 80 : 60, ada);
    y -= 1.1 * (1 - smoothstep(2.2, 5.5, adf));
    // far hills: beyond the country the journey crosses the ground rises in long curves
    let dS = Infinity;
    for (let i = 0; i < spine.length - 1; i++) dS = Math.min(dS, segDist(x, z, spine[i], spine[i + 1]));
    if (dS > 170) y += smoothstep(170, 560, dS) * (24 + 26 * noise.fbm2(x * 0.0023 - 5, z * 0.0023 + 2, 3));
    // the tor's hill: a rounded cone whose flank toward the brook lies under the miners' path
    const dF = hyp2(x - F.x, z - F.z);
    if (dF < LAND.tor.top + LAND.tor.back) {
      // (a level top LAND.tor.top metres out from the man's rock, then the fall to the foot, a metre over the brook's level: TOWARD
      // THE FORD (kf: 1 on the ford's bearing from the crown, 0 beyond some 85 degrees from it) ONE EVEN FLANK, P.hillFront
      // metres long, its brow and its foot rounded over LAND.tor.round of that length each; on every other hand a broad bell
      // LAND.tor.back metres long; the crown's own swell at the middle; the flank's small lumps die out toward the foot)
      const LT = LAND.tor, kf = dF > 1 ? smoothstep(0.1, 0.8, -((x - F.x) * m[0] + (z - F.z) * m[1]) / dF) : 0, E = LT.round;
      const tH = clamp((dF - LT.top) / lerp(LT.back, P.hillFront, kf), 0, 1), base = RIVER_Y + 1;
      const even = tH < E ? 1 - tH * tH / (2 * E * (1 - E)) : tH > 1 - E ? (1 - tH) * (1 - tH) / (2 * E * (1 - E)) : 1 - (tH - E / 2) / (1 - E);
      const hill = base + (P.hillTop - base) * lerp(0.5 * (1 + Math.cos(Math.PI * tH)), even, kf) + 1.2 * (1 - smoothstep(6, 24, dF)) + 0.35 * noise.n2(x * 0.06, z * 0.06) * (1 - tH);
      // (THE HILL'S OWN BOUND: over its last 40 m the hill's say goes out evenly, so that the low meadow under its foot meets the
      // land outside with no step: until round 10 the meadow stood up to 1.3 m higher inside the bound than outside it, a
      // scarp on a round of 170 m about the tor, across the brook's meadow and the old way beside the stone rows)
      y = lerp(smax(y, hill, 3.5), y, smoothstep(LT.top + LT.back - 40, LT.top + LT.back, dF));
    }
    // THE KNOLL: a round green hill, a bell on its own foot
    { const kx = x - P.K[0], kz = z - P.K[1], k2 = kx * kx + kz * kz; if (k2 < P.knR * P.knR) { const tk = Math.sqrt(k2) / P.knR; y += P.knH * 0.5 * (1 + Math.cos(Math.PI * tk)) + 0.3 * noise.n2(x * 0.07, z * 0.07) * (1 - tk); } }
    // the old way's own hollow: the sunken lane between its banks; the open track, trodden a hand deep as far as the tor's foot
    const wq = P.wayOf(x, z, WAYQ);
    // the great mire: a level basin of sedge with pools, the tarn, and the wand path's firm islands
    const mx = x - Cm[0], mz = z - Cm[1], dw = mx * w[0] + mz * w[1], dn = mx * wR[0] + mz * wR[1];
    const q = hyp2(dw / P.mireA, dn / P.mireB) + 0.1 * noise.n2(x * 0.011 + 7, z * 0.011 - 3);
    if (q < 1) {
      const mire = 1 - smoothstep(0.78, 1.0, q);
      // (firm: an island's turf, or the yard's apron; wet: the strip of open water and wet peat that the boards cross between islands)
      let firm = 0, wet = 0;
      if (wq.d < 14 && wq.s > at.ME - 6) { firm = Math.max(isleAt(P, x, z), (1 - smoothstep(2.6, 6.5, wq.d)) * smoothstep(at.I - APRON_M - 8, at.I - APRON_M + 4, wq.s)); wet = (1 - smoothstep(2.5, 8, wq.d)) * smoothstep(at.ME + 6, at.ME + 18, wq.s) * (1 - firm); }
      // (a ruin's own pool is dug as the others are, and its heap of spoil stands out of it: half a metre over the mire)
      const rz = P.ruinAt(x, z, RUINZ), tOut = P.tarnOut(x, z), tk = tOut < 6 ? 1 - smoothstep(-5, 6, tOut) : 0;
      const pool = Math.max(smoothstep(0.22, 0.5, noise.n2(x * 0.028 + 11, z * 0.028 + 5)), rz.pool, 0.56 * wet, tk > 0 ? 0.45 + 0.55 * tk : 0, leadAt(P, x, z)) * (1 - firm);
      // (the firm ground is level, PATH_UP over the mire; the tarn's bed falls to TARN.deep at its middle)
      let floor = MIRE_Y + 0.2 * noise.n2(x * 0.16, z * 0.16) * (1 - firm) + PATH_UP * firm - 0.8 * pool - (tk > 0 ? (TARN.deep - 0.8) * smoothstep(0.2, 1, tk) : 0);
      if (rz.heap > 0) floor = lerp(floor, MIRE_Y + 0.5 + 0.25 * noise.n2(x * 0.3, z * 0.3), rz.heap);
      // the yard: a mound of spoil and turf, and the mine's cutting into it along the yard's axis
      const ix = x - I[0], iz = z - I[1], dI = hyp2(ix, iz);
      if (dI < P.ISLE_R + 18) {
        const iw = ix * d[0] + iz * d[1], il = ix * dR[0] + iz * dR[1];
        const mound = (3.4 + 0.5 * noise.n2(x * 0.09, z * 0.09)) * (1 - smoothstep(P.ISLE_R * 0.42, P.ISLE_R, dI));
        floor = Math.max(floor, MIRE_Y + mound + heapAt(iw, il), MIRE_Y + 2.7 * houseAt(iw, il));
        const cut = (1 - smoothstep(P.CUT_HALF, P.CUT_HALF + 2.4, Math.abs(il))) * smoothstep(-36, -22, iw) * (1 - smoothstep(9, 16, iw));
        floor = lerp(floor, lerp(MIRE_Y + 0.25, P.floorY, smoothstep(-30, -6, iw)), cut);
      }
      y = lerp(y, floor, mire);
    }
    // the mine's hill beyond the yard: a level top 0.2 of its radius across, rough flanks, its foot under the mire's level
    const dH = hyp2(x - P.MH[0], z - P.MH[1]) / MINE_HILL.r;
    if (dH < 1.05) {
      const hill = MIRE_Y - 1.5 + (MINE_HILL.h + 1.5) * (1 - smoothstep(0.2, 1, dH + 0.05 * noise.n2(x * 0.05 + 2, z * 0.05 - 8))) + 1.1 * noise.n2(x * 0.11, z * 0.11) * smoothstep(0.22, 0.4, dH);
      // (the yard's cutting runs into the hill's foot: the hill does not stand in it)
      const ix = x - I[0], iz = z - I[1], iw = ix * d[0] + iz * d[1], il = ix * dR[0] + iz * dR[1];
      y = Math.max(y, lerp(hill, y, (1 - smoothstep(P.CUT_HALF + 1, P.CUT_HALF + 9, Math.abs(il))) * (1 - smoothstep(4, 22, iw))));
    }
    // the park: level ground round the avenue, the hall and the yew alley
    const dP = parkOut(x, z);
    if (dP < 46) y = lerp(y, 0.06 * noise.n2(x * 0.11, z * 0.11), 1 - smoothstep(0, 46, dP));
    // THE ROAD TO THE LODGE GATES: south of the park the road that comes to the gates lies level along the moor's brow for ROAD_M
    // metres, 6 m either side of its middle; the ground eases to it over 40 m
    if (z > 40 && Math.abs(x) < 46) { const dRd = hyp2(Math.max(0, Math.abs(x) - 6), z - clamp(z, 46, 46 + ROAD_M)); if (dRd < 40) y = lerp(y, 0.06 * noise.n2(x * 0.11, z * 0.11), 1 - smoothstep(0, 40, dRd)); }
    if (wq.d < 10 && wq.s < at.A0) {
      if (wq.s < WAY.sunk + 10) y -= SUNK_DEEP * (1 - smoothstep(2.3, 4.2, wq.d)) * smoothstep(0.5, 8, wq.s) * (1 - smoothstep(WAY.sunk - 8, WAY.sunk + 10, wq.s));
      y -= TRACK_DEEP * (1 - smoothstep(1.1, 2.6, wq.d)) * smoothstep(WAY.sunk - 8, WAY.sunk + 10, wq.s);
    }
    return y;
  };
}

// THE LINE WE FLY, laid after the plan: down the avenue at a rider's eye, up over the hall's roof between the towers, down over the
// walled garden into the yew alley and LEVEL DOWN ITS WALK, over the wicket gate, and then over the old way from the gate to
// the yard, a few metres over it (the eye's heights at the head of the file; where the ground falls away under an even
// line, down the sunken lane and over the brook, it stands higher: my count prints the least and the most on each
// stretch, HEIGHTS). Its heights are the land's plus an eye height, except over the roof.
function layLine(P) { const it = layLineSteps(P); while (!it.next().done); return P; }
function* layLineSteps(P) {
  const { land, at, wayAt, MIRE_Y } = P, pts = [], walked = [], q = [0, 0];
  const add = (x, y, z) => pts.push([x, y, z]);
  // THE PARK'S LINE (OVER, at the head of the file): LEVEL FOR THE FIRST 62 m, under the avenue's boughs. Then FOUR PLAIN ARCS,
  // two up and two down, each pair of one curvature and meeting half way: (1) up from the avenue's level to THE CREST, which
  // lies over the hall's ridge between the two middle stacks, OVER.roof metres over the top of the lantern roof that stands
  // on the ridge there (the roof's highest thing under the line: the closing count measures every thing of the roof by its
  // true shape); (2) down over the walled garden to the walk's height, level OVER.level metres before the alley's head.
  // The walk is then flown level between the yew hedges, and the line rises over the last 30 m to pass over the wicket gate.
  const sUp = 62, sC = -(HALL.zFront - HALL.depth / 2), yC = HALL.ridge + ROOF_LANTERN + OVER.roof, sE = -ALLEY.z0 - OVER.level;
  const arc2 = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
  // (the park's line at a metre from the gates: its height)
  const parkY = (s) => (s <= sUp ? EYE0 : s <= sC ? EYE0 + (yC - EYE0) * arc2((s - sUp) / (sC - sUp)) : s <= sE ? WALK_EYE + (yC - WALK_EYE) * (1 - arc2((s - sC) / (sE - sC))) : WALK_EYE);
  P.parkLine = { sUp, sC, sE, up: 2 * (yC - EYE0) / (sC - sUp), down: 2 * (yC - WALK_EYE) / (sE - sC), crest: yC, at: parkY };
  for (const z of [0, -12, -24, -36, -49, -sUp]) add(0, EYE0, z);
  { const n1 = Math.round((sC - sUp) / 7), n2 = Math.round((sE - sC) / 7.5); for (let i = 1; i <= n1; i++) { const s = lerp(sUp, sC, i / n1); add(0, parkY(s), -s); } for (let i = 1; i <= n2; i++) { const s = lerp(sC, sE, i / n2); add(0, parkY(s), -s); } }
  { const zg0 = ALLEY.z1 + 30, n = Math.max(2, Math.round((-zg0 - sE) / 14)); for (let i = 1; i <= n; i++) add(0, WALK_EYE, lerp(-sE, zg0, i / n)); for (let i = 1; i <= 3; i++) add(0, GATE_OVER, lerp(zg0, ALLEY.z1, i / 3)); }
  // THE OLD WAY. The highest ground within `reach` metres before and behind a place of it:
  const ground = (s, reach) => { let g = -Infinity; for (const k of [-1, -0.5, 0, 0.5, 1]) { wayAt(s + k * reach, 0, q); g = Math.max(g, land(q[0], q[1])); } return g; };
  // (the speed the way is laid for, by its own places: the pace table in layPacing is made of the same speeds at the same places)
  const WS = waySpeeds(at), speedAt = (s) => { for (let i = 0; i < WS.length - 1; i++) if (s <= WS[i + 1][0]) return lerp(WS[i][1], WS[i + 1][1], clamp((s - WS[i][0]) / Math.max(1e-6, WS[i + 1][0] - WS[i][0]), 0, 1)); return WS[WS.length - 1][1]; };
  // (the eye's height over the way: WAY_EYE down the sunken lane and round the knoll, coming down to ROW_EYE where the stone rows
  // begin; ROW_EYE between the rows; BRIDGE_EYE over the brook's bed at the clapper bridge; HILL_EYE on the tor's flank,
  // PASS_EYE from the way's round under the crown through the pass, coming down to GRASS_EYE and a hand at the hill's foot)
  const over = P.eyeOver = (s) => (s < at.k0 ? WAY_EYE : s < at.knoll ? lerp(WAY_EYE, ROW_EYE, smoothstep(at.k0, at.knoll - 6, s)) : s < at.rows1 - 6 ? ROW_EYE : s < at.V ? lerp(ROW_EYE, BRIDGE_EYE, smoothstep(at.rows1 - 6, at.V - 9, s))
    : s < at.A0 ? lerp(BRIDGE_EYE, HILL_EYE, smoothstep(at.V + 9, at.V + 40, s)) : s < at.T1 ? lerp(HILL_EYE, PASS_EYE, smoothstep(at.A0, at.Ae, s)) : lerp(PASS_EYE, GRASS_EYE + 0.15, smoothstep(at.T1, at.ME, s)));
  // (the drape's turn: TURN_S; TURN_CLIMB from the bridge to the way's round under the crown, where the flank's foot and its brow are short)
  const turnS = (s) => lerp(TURN_S, TURN_CLIMB, smoothstep(at.V - 30, at.V, s) * (1 - smoothstep(at.Ae, at.T1 + 30, s)));
  // (the hill's brow under the crown is a crest: there the line's pitch turns over more slowly, 1 / TURN_BROW radians a second at the
  // most: from 60 m before the way's round under the crown to 30 m beyond the pass's end, where the way down's own turn is slower still)
  const crestS = (s) => Math.max(turnS(s), TURN_BROW * smoothstep(at.A0 - 90, at.A0 - 60, s) * (1 - smoothstep(at.T1 + 30, at.T1 + 60, s)));
  // (the lane's hollow is a dip: from the gate to 10 m beyond the end of the knoll's round, where the line lies level between the
  // stone rows, the line's pitch turns upward more slowly, 1 / TURN_LANE; over the 30 m after that the bound goes back to TURN_S)
  const dipS = (s) => Math.max(turnS(s), TURN_LANE * (1 - smoothstep(at.knoll + 10, at.knoll + 40, s)));
  // THE DRAPE: the line that keeps over(s) metres and more above the highest ground within 4 m before and behind each 8 m step of
  // the way, whose pitch turns no faster than 1 / TURN_S radians a second at the speed laid for (its curvature is
  // 1 / (TURN_S * speed) at the most, upward and downward), and which lies as little over those least heights as it can (the
  // sum of the squares of what it lies over them is the least). It begins at the gate, GATE_OVER over the park's level, and
  // ends at the wand path's height, sIn metres along the way (40 m beyond the mire's shore): its first step and its
  // last two are held, the last two at the wand path's height or, where the basin's rim still stands higher under them
  // (one seed in fifty), PATH_EYE over that ground.
  // (found by Hildreth's rule: each bound in turn (a step's least height, the sharpest dip at a step, the sharpest crest at a
  // step) is met by moving the steps it names by the least that meets it, its own tally of what it has moved kept so that it
  // gives back what later bounds make needless; 2,500 rounds, or until no bound moves anything by a tenth of a millimetre)
  const yLow = MIRE_Y + MIRE_EYE, sIn = at.ME + 40, n = Math.round(sIn / 8), ds = sIn / n, lo = new Float64Array(n + 1), y = new Float64Array(n + 1), kap = new Float64Array(n + 1), kapC = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) { const s = i * ds; lo[i] = i === 0 ? GATE_OVER : s > at.ME ? Math.max(yLow, ground(s, 4) + PATH_EYE) : ground(s, 4) + over(s); kap[i] = ds * ds / (dipS(s) * speedAt(s)) / 2; kapC[i] = ds * ds / (crestS(s) * speedAt(s)) / 2; y[i] = lo[i]; if (i % 12 === 11) yield; }
  // (the walk is level up to the gate: the crest AT the gate is bound as every other is, the step before it being the walk's own height)
  lo[1] = Math.max(lo[1], GATE_OVER - 2 * kap[0]);
  { const free = (i) => i > 0 && i < n - 1, lamL = new Float64Array(n + 1), lamD = new Float64Array(n + 1), lamC = new Float64Array(n + 1);
    for (let it = 0; it < 2500; it++) {
      if (it % 120 === 119) yield;
      let moved = 0;
      for (let i = 1; i < n; i++) {
        if (free(i)) { const dl = Math.max(-lamL[i], lo[i] - y[i]); if (dl !== 0) { lamL[i] += dl; y[i] += dl; moved = Math.max(moved, Math.abs(dl)); } }
        const fa = free(i - 1) ? 1 : 0, fb = free(i) ? 1 : 0, fc = free(i + 1) ? 1 : 0, g2 = fa + 4 * fb + fc; if (!g2) continue;
        // (a dip too sharp: the second difference over twice kap; a crest too sharp: under minus twice kap)
        let d2 = y[i - 1] - 2 * y[i] + y[i + 1], dd = Math.max(-lamD[i], (d2 - 2 * kap[i]) / g2);
        if (dd !== 0) { lamD[i] += dd; y[i - 1] -= dd * fa; y[i] += 2 * dd * fb; y[i + 1] -= dd * fc; moved = Math.max(moved, Math.abs(dd)); }
        d2 = y[i - 1] - 2 * y[i] + y[i + 1]; const dc = Math.max(-lamC[i], (-d2 - 2 * kapC[i]) / g2);
        if (dc !== 0) { lamC[i] += dc; y[i - 1] += dc * fa; y[i] -= 2 * dc * fb; y[i + 1] += dc * fc; moved = Math.max(moved, Math.abs(dc)); }
      }
      if (moved < 1e-4) break;
    }
    // (what the rule leaves a step under its least height, a millimetre or less, is given back)
    for (let i = 1; i < n - 1; i++) y[i] = Math.max(y[i], lo[i]); }
  P.drape = { ds, n, y: Array.from(y), lo: Array.from(lo), ms: Array.from(y, (v, i) => speedAt(i * ds)) };
  // (handed to the line every second step, 16 m, and the step before the end, so that the line lies level into its end)
  for (let i = 2; i <= n; i++) if (i % 2 === 0 || i >= n - 1) { wayAt(i * ds, 0, q); if (i < n - 1) walked.push(pts.length); add(q[0], y[i], q[1]); }
  // THE WAND PATH: level at its own height; over the bow's last 70 m the eye rises to the ring's middle (yEnd), and THE LAST
  // STRAIGHT, the yard's 68 to 83 m as the plan leaves it, IS LEVEL AND STRAIGHT. (The line is a curve through these places: a
  // stretch of it is straight only where the places before and after it lie on one line. So the bow is handed to the line to
  // 6 m before its end, then its end, then 6 m on: from that place on the line is the plan's straight itself; until round 10
  // the first 16 m of the straight still carried the bow's turn, 1.8 degrees at the most.)
  const yEnd = P.floorY + 4.8, sRing = at.arcEnd - 74;
  for (let s = sIn + 16; s < at.arcEnd - 10; s += 16) { wayAt(s, 0, q); add(q[0], lerp(yLow, yEnd, smoothstep(sRing, at.arcEnd - 4, s)), q[1]); }
  { wayAt(at.arcEnd - 6, 0, q); add(q[0], lerp(yLow, yEnd, smoothstep(sRing, at.arcEnd - 4, at.arcEnd - 6)), q[1]); }
  for (const s of [at.arcEnd, at.arcEnd + 6, at.arcEnd + 16, at.arcEnd + 32, at.arcEnd + 48, at.I]) { wayAt(s, 0, q); add(q[0], yEnd, q[1]); }
  P.ctrl = pts; P.walked = walked; P.yEnd = yEnd; P.yLow = yLow; P.sIn = sIn;
  return P;
}
// (the land can swell between two steps: wherever the line laid through the steps comes nearer the land than GRASS_EYE and a hand
// more (over the wand path: than PATH_EYE), the two draped steps nearest that place are lifted by what is missing; the plan
// calls this up to three times, the line being laid again each time. A pass that lifts nothing ends it: P.lifts is how many
// steps the last pass lifted.)
// (liftLine: the line as it stands, one call of the kit; the build makes it in a step of its own before each pass, the tools' plan
// makes it within the pass: the same call either way)
function liftLine(P) { P.liftPath = makePath(P.ctrl, { samples: 500 }); return P; }
function liftRoute(P) {
  const pts = P.ctrl, walked = P.walked, land = P.land, v0 = new THREE.Vector3();
  const pp = P.liftPath ?? makePath(pts, { samples: 500 }), need = new Map(); P.liftPath = null;
  for (let s = 0; s < pp.length; s += 2) {
    pp.posAtDist(s, v0); if (v0.z > ALLEY.z1) continue;
    // (beyond the mire's shore the line also holds its own level over the boards, P.yLow: the boards begin 6 m beyond the shore)
    const lack = Math.max((zoneAt(P, v0.x, v0.z, ZONE).wand > 0.5 ? PATH_EYE - 0.02 : Math.min(GRASS_EYE + 0.15, P.eyeOver(P.wayOf(v0.x, v0.z, WAYQ).s) - 0.1)) - (v0.y - land(v0.x, v0.z)), P.wayOf(v0.x, v0.z, WAYQ).s > P.at.ME + 4 && P.wayOf(v0.x, v0.z, WAYQ).s < P.at.arcEnd ? P.yLow - v0.y : 0); if (lack <= 0.004) continue;
    let a = -1, b = -1, da = 900, db = 900;
    for (const i of walked) { const dd = (pts[i][0] - v0.x) ** 2 + (pts[i][2] - v0.z) ** 2; if (dd < da) { db = da; b = a; da = dd; a = i; } else if (dd < db) { db = dd; b = i; } }
    for (const i of [a, b]) if (i >= 0) need.set(i, Math.max(need.get(i) || 0, lack));
  }
  for (const [i, lack] of need) pts[i][1] += lack * 1.15;
  P.lifts = need.size;
  return P;
}
// The line itself (one call of the kit), then the places on it: the line at every metre; places are found on it, never typed.
function layPath(P) { P.path = makePath(P.ctrl, { samples: 1000 }); P.L = P.path.length; return P; }
function layStations(P) {
  const path = P.path, L = P.L, { V, F, T1, ME, at, wayAt } = P;
  const n = Math.ceil(L), sx = new Float32Array(n + 1), sy = new Float32Array(n + 1), sz = new Float32Array(n + 1), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { path.posAtDist(Math.min(i, L), v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; }
  P.samples = { n, sx, sy, sz };
  const stationOf = P.stationOf = (x, z, s0 = 0, s1 = n) => {
    let best = Infinity, bi = 0;
    for (let i = Math.max(0, Math.floor(s0)); i <= Math.min(n, Math.ceil(s1)); i++) { const dd = (sx[i] - x) * (sx[i] - x) + (sz[i] - z) * (sz[i] - z); if (dd < best) { best = dd; bi = i; } }
    return bi;
  };
  const Sx = P.S = {};
  // (the rise begins where the line's pitch first passes 2 degrees)
  Sx.rise = 0; while (Sx.rise < n - 1 && sy[Sx.rise + 1] - sy[Sx.rise] < Math.sin(2 * DEG)) Sx.rise++;
  Sx.front = stationOf(0, HALL.zFront, 40, 200); Sx.ridge = stationOf(0, HALL.zFront - HALL.depth / 2, 40, 220);
  // (S.garden: where the line crosses the north wall of the walled garden behind the hall, the roof left behind and the line going down)
  Sx.garden = stationOf(0, HALL.zFront - HALL.depth - 5, 80, 240);
  Sx.alley = stationOf(0, ALLEY.z0, 120, 320); Sx.gate = stationOf(0, ALLEY.z1, 200, 400);
  // (S.level: where the park's line lies level on the walk's height, before the alley's head)
  Sx.level = stationOf(0, -P.parkLine.sE, 120, 320);
  // (a place of the old way, as a metre of the line: the line lies over the way from the gate on, a little longer for its heights)
  const lineOf = P.lineOf = (sWay, from = Sx.gate) => { const p = wayAt(sWay); return stationOf(p[0], p[1], from, Math.min(n, from + (sWay - 0) + 400)); };
  Sx.sunk = lineOf(at.sunk); Sx.knoll = lineOf(at.knoll, Sx.sunk); Sx.moonward = lineOf(at.moonward, Sx.knoll); Sx.river = lineOf(at.V, Sx.moonward);
  Sx.A0 = lineOf(at.A0, Sx.river); Sx.tor = stationOf(F.x, F.z, Sx.A0, Sx.A0 + 200); Sx.shoulder = lineOf(at.T1, Sx.A0); Sx.mire = lineOf(at.ME, Sx.shoulder);
  Sx.in = lineOf(P.sIn, Sx.mire); Sx.tarn = lineOf(P.tarn.s, Sx.mire); Sx.lead = lineOf(at.lead, Sx.mire); Sx.arcEnd = lineOf(at.arcEnd, Sx.tarn);
  // (the old way's speeds, each at its place of the line)
  { let from = Sx.gate; P.wayKnots = waySpeeds(at).slice(1).map((q) => { from = lineOf(q[0], from); return [from, q[1]]; }); P.wayKnots[P.wayKnots.length - 1][0] = P.L; }
  // PLACES OF THE LINE'S OWN SHAPE, where it turns short in pitch (the long look is laid by them, in layLook): on the avenue's
  // rise, S.steep, where the line is steepest and the turn upward is done; on the way down to the mire, S.fall, where it is
  // steepest and the levelling on to the mire begins
  const pitchAt = (i) => (sy[i + 1] - sy[i]) / Math.hypot(sx[i + 1] - sx[i], sy[i + 1] - sy[i], sz[i + 1] - sz[i]);
  Sx.steep = Sx.rise; for (let i = Sx.rise; i < Sx.front; i++) if (pitchAt(i) > pitchAt(Sx.steep)) Sx.steep = i;
  Sx.fall = Sx.shoulder; for (let i = Sx.shoulder; i < Sx.mire; i++) if (pitchAt(i) < pitchAt(Sx.fall)) Sx.fall = i;
  return P;
}

// A closed round on the ground plan, for a beast that runs it by the world's clock: laid through the places given (x, z, in the order
// they are run), read every half metre or less, and run at the speed speedOf(x, z) gives for each place of it (metres a second).
// at(metres, out) gives the place and the heading there; atTime(seconds, out) the same for the clock, with out.run the metres run
// since the clock's nought (for the stride); the round has no first place and takes `period` seconds.
// dist(x, z) is how far a place on the plan is from the round.
function makeRound(places, speedOf) {
  const curve = new THREE.CatmullRomCurve3(places.map((q) => new THREE.Vector3(q[0], 0, q[1])), true, 'centripetal'), len = curve.getLength(), n = Math.ceil(len / 0.5), ds = len / n;
  const pts = curve.getSpacedPoints(n), xz = new Float32Array(n * 2), T = new Float32Array(n + 1);
  for (let i = 0; i < n; i++) { xz[i * 2] = pts[i].x; xz[i * 2 + 1] = pts[i].z; }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; T[i + 1] = T[i] + ds / Math.max(1, speedOf((xz[i * 2] + xz[j * 2]) / 2, (xz[i * 2 + 1] + xz[j * 2 + 1]) / 2)); }
  const period = T[n];
  const at = (m, out) => { const f = (((m % len) + len) % len) / len * n, i = Math.min(n - 1, Math.floor(f)), j = (i + 1) % n, k = f - i, hx = xz[j * 2] - xz[i * 2], hz = xz[j * 2 + 1] - xz[i * 2 + 1], d = 1 / Math.max(1e-6, Math.hypot(hx, hz));
    out.x = xz[i * 2] + hx * k; out.z = xz[i * 2 + 1] + hz * k; out.hx = hx * d; out.hz = hz * d; return out; };
  const atTime = (t, out) => { const c = t / period, r = Math.floor(c), tt = (c - r) * period; let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid] <= tt) lo = mid; else hi = mid; }
    const m = (lo + (tt - T[lo]) / (T[lo + 1] - T[lo])) * ds; at(m, out); out.run = r * len + m; return out; };
  const dist = (x, z) => { let m = 1e12; for (let i = 0; i < n; i++) { const dx = xz[i * 2] - x, dz = xz[i * 2 + 1] - z, d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  return { len, n, xz, at, atTime, period, dist };
}
// What goes on in the place by the WORLD'S CLOCK (the two hounds' rounds), and what is laid on the line: the paces between places
// (the film's own pace) and the gaze's places. Nothing here reads the metres flown but the pace and the gaze.
function layPacing(P, fk) {
  const S = P.S, L = P.L, { at, tarn } = P, rh = fk.hound;
  // THE HOUND'S BEAT, a HABIT ON THE WORLD'S CLOCK, laid by the land: ALONG THE LEAD'S BANK, FROM THE FOOT OF THE FOG BANK OUT
  // TOWARD THE BOARDS. The fog lies down the lead's wet hollow in a bay (P.seaDepth); the beat is a narrow oval on the lead's
  // shoreward bank, 8 to 10 m from the lead's line: its near turn 15.5 to 17.5 m short of the boards, which cross the lead
  // there, on every seed; its far turn where the bank's line first lies 3 m inside the fog's shore, where that is 28 to 36 m
  // from the near turn: where the fog's foot is nearer the far turn lies so much within the fog (the fog takes the beast by
  // its own depth there: P.inFog), and where it is farther the far turn lies short of the shore. (THE LEAD'S RULING OF ROUND
  // 10: the hound is no longer than 2.5 m, and its round is brought nearer the way by the plan, not the beast made larger:
  // until then the beat was 30 to 46 m long and its near turn lay farther from the boards where the fog lay far.) It is
  // 5.5 to 6.5 m in half breadth. How near the boards and the line it comes is counted over every phase of its clock, never
  // set by them: my tools give the least. It gallops the two legs (HOUND_FAST, drawn) and takes the two ends slower
  // (HOUND_TURN). Its speeds, its stride and where on the beat it is at the clock's nought are drawn from its own stream. It
  // keeps no station on anyone, begins nowhere and ends nowhere: a visitor who stands still sees it come out from the bank,
  // turn and go back, over and over.
  const LD = P.lead, hOff = rh.range(8, 10), hShort = rh.range(15.5, 17.5), hB = rh.range(5.5, 6.5), wvA = rh.range(0.4, 1.0), wvPh = rh.range(0, 6.28), rd = [];
  // (the bank is the lead's shoreward hand: the hand the landing lies on. A place of the bank's own frame: t metres up the lead
  // from the tarn's head on the beat's line, v metres farther from the lead)
  const lside = Math.sign((P.ME[1] - LD.head[1]) * LD.lu[0] - (P.ME[0] - LD.head[0]) * LD.lu[1]) || 1;
  const bankXZ = (t, v = 0) => [LD.head[0] + t * LD.lu[0] - lside * (hOff + v) * LD.lu[1], LD.head[1] + t * LD.lu[1] + lside * (hOff + v) * LD.lu[0]];
  // (where the boards cross the beat's line, in metres up the lead: found on the old way)
  let tBoards = 60; { const o = { t: 0, c: 0 }; let was = 0; for (let i = Math.round(at.ME) + 20; i <= at.arcEnd; i++) { LD.of(P.way.x[i], P.way.z[i], o); const c = o.c - lside * hOff; if (was !== 0 && c * was < 0) { tBoards = o.t; break; } was = c; } }
  let tNear = tBoards + hShort, tFar = tNear + 8; while (tFar < tNear + 140 && P.seaDepth(...bankXZ(tFar)) < 3) tFar += 1;
  tFar = clamp(tFar, tNear + 28, tNear + 36);
  const tMid = (tNear + tFar) / 2, hA = (tFar - tNear) / 2;
  for (let k = 0; k < 12; k++) { const an = k / 12 * 2 * Math.PI; rd.push(bankXZ(tMid - hA * Math.cos(an), hB * Math.sin(an) + wvA * Math.sin(2 * an + wvPh))); }
  P.roundTurns = [bankXZ(tFar), bankXZ(tNear)]; P.houndMid = bankXZ(tMid); P.beat = { tNear, tFar, tBoards, half: hA };
  const HOUND_FAST = rh.range(12, 13.5), HOUND_TURN = 8, houndPh = rh();
  const round = makeRound(rd, (x, z) => lerp(HOUND_TURN, HOUND_FAST, smoothstep(6, 22, Math.min(Math.hypot(x - P.roundTurns[0][0], z - P.roundTurns[0][1]), Math.hypot(x - P.roundTurns[1][0], z - P.roundTurns[1][1])))));
  P.houndRound = round; P.strideLen = rh.range(5.2, 5.8); P.stridePh = rh();
  // where the hound is at the world's clock `time`: its place, its heading, the metres it has run
  P.houndAt = (time, out = {}) => round.atTime(time + houndPh * round.period, out);
  // (how deep in the fog a place is, 0 to 1, by the fog's own shore as it is built: the hounds' shaders are handed it)
  P.inFog = (x, z) => smoothstep(0, 22, P.seaDepth(x, z));
  // WHERE THE GAZE LOOKS ON THE MIRE: first to the middle of the hound's beat (P.houndMid, above), then to THE MINE'S MOUTH in the
  // works' yard, at the ring's height, across the tarn's red water. Both are places that stand: the look follows nothing that moves.
  P.showAt = [P.I[0], P.yEnd, P.I[1]];
  // THE RARE SECOND HOUND'S ROUND (one visit in eight), a habit on the world's clock like the first: ROUND THE TARN, on its shore.
  // Its near leg runs along the tarn's landward shore, 8 to 12 m from the water; the line rounds the tarn 19.8 to 33 m off its
  // shore, and the round comes no nearer the line than 8.3 m (seed 100; counted from the plan on seeds 1 to 300, round 11: the
  // "16 m and more" written here before was never so). Its far leg 11 to 13 m beyond the tarn's far shore, on the wet ground
  // under the mine's hill.
  // It is loped the other way round at its own speed from its own phase. (The fog bank lies on the path's other hand: this
  // hound is in clear air, among the low drifts.)
  const rg = fk.ghost, kA = tarn.a + rg.range(9, 12), kB = tarn.b + rg.range(8, 12), kF = tarn.b + rg.range(11, 13), gd = [];
  const tarnXZ = (u, v) => [tarn.x + u * tarn.ux - v * tarn.uz, tarn.z + u * tarn.uz + v * tarn.ux];
  for (let k = 0; k < 14; k++) { const an = -k / 14 * 2 * Math.PI, sn = Math.sin(an); gd.push(tarnXZ(kA * Math.cos(an), (sn > 0 ? kB : kF) * sn)); }
  const ghostSpeed = rg.range(13, 15), ghostRound = makeRound(gd, () => ghostSpeed), ghostPh0 = rg();
  P.ghostRound = ghostRound; P.ghostPh = rg();
  P.ghostAt = (time, out = {}) => ghostRound.atTime(time + ghostPh0 * ghostRound.period, out);
  // THE PACE TABLE: the speeds of SPEED (metres a second) at places of the line, eased between them; the engine is handed them
  // over 20 (a pace of 1 is 20 m/s as laid) and scales them all by one factor so that the flight takes its FILM_S seconds. THAT FACTOR is
  // worked out here from the table itself, as the engine does it (the pace sampled at 65 places of the line, held within 0.35
  // and 2.5, the mean of its inverse taken by the trapezium): P.paceK, the speed flown over the speed laid.
  const K = [[0, SPEED.avenue], [S.rise - 30, SPEED.avenue], [S.rise + 6, SPEED.rise], [S.front - 8, SPEED.rise], [S.ridge + 6, SPEED.roof], [lerp(S.ridge, S.level, 0.5), SPEED.fall], [S.level, SPEED.alley], [S.gate, SPEED.alley], ...P.wayKnots].map((q) => [q[0], q[1] / 20]);
  const paceAt = (sAt) => {
    if (sAt <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i++) if (sAt <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], smoothstep(K[i][0], K[i + 1][0], sAt));
    return K[K.length - 1][1];
  };
  // (the engine's own arithmetic: src/core/engine.js makePace)
  { const N = 64, pv = []; let inv = 0; for (let i = 0; i <= N; i++) pv.push(clamp(paceAt(i / N * L), 0.35, 2.5)); for (let i = 0; i < N; i++) inv += 2 / (pv[i] + pv[i + 1]); P.paceMs = L / FILM_S * inv / N; }
  P.paceK = P.paceMs / 20; P.paceKnots = K; P.paceAt = paceAt; P.pace = (u) => paceAt(u * L);
  // EVERY PULL'S RAMP, ON AND OFF, IS LAID TO TAKE 2.2 s BY THE TABLE at the pace laid there (as flown it takes a little less or
  // more: the engine reads the table at 65 places of the line and eases the speed; the round's count, a replay of the engine's
  // own camera, gives every ramp's seconds as flown and the shortest of them on every seed, and that count is what is so): so
  // many METRES OF THE LINE as the pace gives RAMP_S seconds, counted from the pull's own place: P.rampIn(a, b) for a pull that comes on and goes off inside its two places
  // a and b, P.rampBefore(a) and P.rampAfter(b) for one whose weight comes on before a and goes out after b.
  const RAMP_S = 2.2, secsOf = (a, b) => { let t = 0; for (let x = Math.max(0, a); x < Math.min(L, b); x += 0.5) t += 0.5 / (paceAt(x + 0.25) * P.paceMs); return t; };
  P.secsOf = secsOf;
  P.rampBefore = (a) => { let mm = 8; while (mm < 240 && secsOf(a - mm, a) < RAMP_S) mm++; return mm; };
  P.rampAfter = (b) => { let mm = 8; while (mm < 240 && secsOf(b, b + mm) < RAMP_S) mm++; return mm; };
  P.rampIn = (a, b) => { let mm = 8; while (mm < 240 && (secsOf(a, a + mm) < RAMP_S || secsOf(b - mm, b) < RAMP_S)) mm++; return mm; };
  layLook(P);
  return P;
}
// THE GAZE'S PLACES, laid on the line (the gaze in build() tells how each is used). EVERY PLACE HERE IS FOUND ON THE PLAN, none is
// a typed metre; every ramp of a weight is so many metres of the line as the pace gives RAMP_S seconds there, and every move
// of the look from one place to another so many as it gives LOOK_S seconds.
// THE LONG LOOK: where the line itself turns short in pitch the gaze is drawn half way to the line's own place FAR_M metres on, so
// that the same turn is begun sooner and taken more slowly. Its one stretch: THE WAY DOWN ON TO THE MIRE (from the pass's end,
// S.shoulder, to S.in, where the line lies level on the wand path). It comes on and goes off over the metres the pace gives
// RAMP_S seconds there (or half its stretch, if that is less).
// THE THREE PULLS TO PLACES: THE PARK'S LOOK to the wicket gate at the far end of the yew alley (from the entry, where the
// engine's own guard holds every pull at nought and brings it on over the first 0.04 of the line, to 30 m short of that
// gate); the man on the tor (the gaze goes up to him over the old way's turn to the clapper bridge, from the turn's beginning
// to 30 m beyond the bridge, and he is let go where the line turns from him: where the line of sight to him has swung
// MAN_OFF degrees off the line's heading, at the way's round under the crown); the mire's two places: P.showAt, the mine's
// mouth in the works' yard (where the way is bound), and P.houndMid, the middle of the hound's beat on the lead's bank.
// From the pass the look goes to the mouth across the basin; at the shore it goes over to the beat's middle; the beat
// passed, it goes back to the mouth. THE MIRE'S PLACES OF THE LINE, each a thing of the land or of the engine, found on the
// plan (the seconds of a move fall where the pace then puts them):
//   S.pull0: WHERE THE MINE'S MOUTH FIRST SHOWS: the first metre from the pass's end on from which the straight line of sight
//     from the lens to the mouth clears the drawn land; the look goes over to the mouth in the LOOK_S seconds after it
//     (S.works1 is where the pace has spent them);
//   S.pull1: THE MIRE'S SHORE (S.mire): the look is on the beat's middle as the lens comes on to the mire; it leaves the mouth
//     for it LOOK_S seconds of the pace before the shore (S.beat0);
//   S.look0: WHERE THE BEAT IS PASSED: the metre at which the beat's middle has swung BEAT_OFF degrees off the line's heading;
//     the look comes back to the mouth in the LOOK_S seconds after it (S.look1 is where the pace has spent them);
//   S.let1: THE LAST WHOLE METRE BEFORE THE ENGINE'S OWN END GUARD (0.93 of the line's length): until round 10 the look was
//     handed back to the line's own over the ramp of the pace before it (S.let0).
//   ROUND 11 (A5): of these the world reads S.pull0 and S.works1 alone: the look goes over to the mouth and stays on it to the
//   end guard; S.beat0, S.pull1, S.look0, S.look1, S.let0 and S.let1 are laid as they were and turn nothing.
// Where two of these moves fall on one stretch (a seed whose mouth shows late, a short bow) they run together: every one is a
// turn of the direction looked at, and the direction is one at every metre.
// On the last straight the place looked at is the line's own end.
function layLook(P) {
  const S = P.S, L = P.L, FAR_M = 60, FAR_W = 0.5, MAN_OFF = 5, BEAT_OFF = 30, farV = new THREE.Vector3(), pv = new THREE.Vector3(), tv = new THREE.Vector3();
  const farLook = (time, u) => { P.path.posAtDist(Math.min(L, u * L + FAR_M), farV); return farV; };
  const far = [['the way down on to the mire', S.shoulder, S.in]].map((q) => [q[0], q[1], q[2], Math.min(0.5 * (q[2] - q[1]), Math.max(P.rampAfter(q[1]), P.rampBefore(q[2])))]);
  P.farPois = far.map((q) => ({ at: farLook, from: clamp(q[1] / L, 0, 1), to: clamp(q[2] / L, 0, 1), weight: FAR_W, fade: q[3] / (q[2] - q[1]) }));
  P.farRamps = far.flatMap((q) => [{ name: q[0] + ': on', s0: q[1], s1: q[1] + q[3] }, { name: q[0] + ': off', s0: q[2] - q[3], s1: q[2] }]);
  // (the metre of the line at which a place has swung `deg` degrees off our heading on the plan, looked for from s0 on)
  const swungAt = (x, z, deg, s0, s1) => { let s = s0; for (; s < s1; s++) { P.path.posAtDist(s, pv); P.path.tangentAtDist(s, tv); const dx = x - pv.x, dz = z - pv.z; if ((dx * tv.x + dz * tv.z) / (Math.hypot(dx, dz) * Math.hypot(tv.x, tv.z)) < Math.cos(deg * DEG)) break; } return s; };
  // (the first metre of the line, from s0 on, from which the straight line of sight to a place clears the drawn land by a hand)
  const showsAt = (x, y, z, s0, s1) => { let s = s0; for (; s < s1; s += 2) { P.path.posAtDist(s, pv); let clear = true; for (let k = 1; k < 24 && clear; k++) { const f = k / 24; if (P.land(lerp(pv.x, x, f), lerp(pv.z, z, f)) > lerp(pv.y, y, f) - 0.3) clear = false; } if (clear) break; } return Math.min(s, s1); };
  const manUp0 = P.lineOf(P.at.rows1, S.knoll), manUp1 = S.river + 30;
  // (THE PARK'S LOOK: from the entry (where the engine's own guard holds every pull at nought and brings it on over the first 0.04
  // of the line) to 30 m short of the wicket gate, where the line begins its rise over the gate; its weight comes on over the
  // level avenue before the rise and goes out on the level walk, where the place looked at lies dead ahead on the line's
  // own heading and nothing turns)
  const sLet = swungAt(P.F.x, P.F.z, MAN_OFF, S.A0, S.shoulder + 40), parkA = 0, parkB = S.gate - 30, parkIn = Math.max(8, Math.min(P.parkLine.sUp - parkA, parkB - S.level));
  // (A MOVE OF THE LOOK from one place to another is laid to take LOOK_S seconds by the pace table: P.lookAfter and P.lookBefore
  // are those seconds in metres of the line after and before a place)
  const LOOK_S = 3.2, lookAfter = (b) => { let mm = 8; while (mm < 300 && P.secsOf(b, b + mm) < LOOK_S) mm++; return mm; }, lookBefore = (a) => { let mm = 8; while (mm < 300 && P.secsOf(a - mm, a) < LOOK_S) mm++; return mm; };
  // (the man's look is let go over MAN_OUT metres beyond sLet, a move of the look by the pace there; its weight comes on over the
  // FIG_IN metres before the turn to the bridge and goes out over as many after the letting go: the longer of the two ramps)
  const MAN_OUT = lookAfter(sLet), FIG_IN = Math.max(P.rampBefore(manUp0), P.rampAfter(sLet + MAN_OUT));
  // (the engine's own guard takes every pull out over the line's last metres, from 0.93 of its length on: the mire's look is let
  // go before it, S.let1 being the last whole metre before that guard, and S.let0 a ramp of the pace before it)
  P.endIn = P.rampBefore(L); S.let1 = Math.floor(0.93 * L) - 1; const SHOW_OUT = P.rampBefore(S.let1); P.SHOW_OUT = SHOW_OUT; S.let0 = S.let1 - SHOW_OUT;
  S.pull0 = showsAt(P.showAt[0], P.showAt[1], P.showAt[2], S.shoulder, S.mire); S.works1 = S.pull0 + lookAfter(S.pull0);
  S.pull1 = S.mire; S.beat0 = S.pull1 - lookBefore(S.pull1);
  S.look0 = swungAt(P.houndMid[0], P.houndMid[1], BEAT_OFF, S.pull1, S.arcEnd); S.look1 = S.look0 + lookAfter(S.look0);
  // (the mire's look: its weight comes on over the HOUND_IN metres before S.pull0 while the place looked at is still the line's
  // own; between S.pull0 and S.works1 the direction goes over to THE MINE'S MOUTH in the works' yard (P.showAt); between
  // S.beat0 and S.pull1 the direction goes over from the mouth to THE MIDDLE OF THE HOUND'S BEAT (P.houndMid: a place that
  // stands; the look follows nothing that moves), and between S.look0 and S.look1 back to the mouth, each evenly in the
  // seconds the pace gives its metres; over the SHOW_OUT metres before S.let1 the direction is handed back to the line's own
  // (on the last straight they are one); the weight goes out over the line's last metres, under the engine's own guard.
  // ROUND 11: so it was until round 10; now the direction stays on the mouth from S.works1 to the end guard: see the pois)
  const HOUND_IN = Math.max(P.rampBefore(S.pull0), P.endIn);
  // (how far a move from the metre g0 of the line to the metre g1 has gone at a metre between them: evenly in the seconds the pace gives those metres)
  const evenIn = (g0, g1) => { const cum = new Float32Array(g1 - g0 + 1); for (let i = 1; i < cum.length; i++) cum[i] = cum[i - 1] + 1 / P.paceAt(g0 + i - 0.5);
    return (mF) => { const f = clamp(mF - g0, 0, g1 - g0), i = Math.min(cum.length - 2, Math.floor(f)); return (cum[i] + (cum[i + 1] - cum[i]) * (f - i)) / cum[cum.length - 1]; }; };
  // (the direction's going over to the mine's mouth from the pass; the place's going over from the mouth to the beat's middle at the shore)
  P.pullIn = evenIn(S.pull0, S.works1); P.beatIn = evenIn(S.beat0, S.pull1);
  // (the look's coming back from the beat to the mouth: laid still, not read by the world since round 11; and the man's letting go)
  P.backIn = evenIn(S.look0, S.look1); P.manBack = evenIn(sLet, sLet + MAN_OUT);
  P.pulls = { sLet, FIG_IN, HOUND_IN, park: [parkA, parkB, parkIn], man: [manUp0 - FIG_IN, sLet, FIG_IN, manUp0, manUp1, MAN_OUT], mire: [S.pull0 - HOUND_IN, L, HOUND_IN], gate: S.gate, shore: S.mire };
  return P;
}

// What the ground is at a place: masks for the park's parts, the brook, the old way, the tor's hill, the mire with its tarn, its firm
// islands and its pools, the yard.
function zoneAt(P, x, z, o) {
  const { m, nR, V, F, w, wR, d, dR, ME, I, Cm, noise, at } = P;
  // (asked for hundreds of thousands of places while the world is built: each part is worked out only where it can be other than nothing)
  const ax = x - V[0], az = z - V[1], a = ax * m[0] + az * m[1];
  if (a > P.rivHi + 14 || a < P.rivLo - 14) { o.river = a > 0 ? a - P.rivHi : P.rivLo - a; o.west = a > 0 ? 1 : 0; }
  else { const b = ax * nR[0] + az * nR[1], dd = P.brookD(a, b); o.river = Math.max(0, Math.abs(dd) - fordWide(b)); o.west = dd > 0 ? 1 : 0; }
  o.tor = hyp2(x - F.x, z - F.z);
  o.e = (x - ME[0]) * w[0] + (z - ME[1]) * w[1]; o.n = (x - ME[0]) * wR[0] + (z - ME[1]) * wR[1];
  // THE OLD WAY: o.way is how much of a place is its trodden ground (the lane's floor and the cart track, 1.3 m either side of
  // its middle, from the wicket gate to the mire's shore: over the tor's pass and down to the mire it is the same
  // track, of a cart's breadth), 0 to 1; o.wayS the metres along it and o.wayD the metres from it (99: far off);
  // o.wand: the wand path's own strip over the mire
  const wq = P.wayOf(x, z, WAYQ);
  o.wayS = wq.s; o.wayD = wq.d; o.wayLat = wq.lat;
  o.way = wq.d < 3 && wq.s < at.ME + 10 ? (1 - smoothstep(1.3, 2.5, wq.d)) * (1 - smoothstep(at.ME, at.ME + 10, wq.s)) : 0;
  o.wand = wq.d < 5 && wq.s > at.ME - 6 ? 1 - smoothstep(3, 5, wq.d) : 0;
  const mx = x - Cm[0], mz = z - Cm[1], q0 = hyp2((mx * w[0] + mz * w[1]) / P.mireA, (mx * wR[0] + mz * wR[1]) / P.mireB);
  if (q0 > 1.24) { o.mire = 0; o.rim = 0; o.lane = 0; o.pool = 0; o.heap = 0; o.wet = 0; o.tarn = 0; }
  else {
    const q = q0 + 0.1 * noise.n2(x * 0.011 + 7, z * 0.011 - 3);
    o.mire = 1 - smoothstep(0.78, 1.0, q); o.rim = smoothstep(0.7, 0.9, q) * (1 - smoothstep(1.0, 1.12, q));
    // (o.lane: the firm ground of an island or of the yard's apron; o.wet: the open wet between islands, which the boards cross)
    let firm = 0, wet = 0;
    if (o.mire > 0 && wq.d < 14 && wq.s > at.ME - 6) { firm = Math.max(isleAt(P, x, z), (1 - smoothstep(2.6, 6.5, wq.d)) * smoothstep(at.I - APRON_M - 8, at.I - APRON_M + 4, wq.s)); wet = (1 - smoothstep(2.5, 8, wq.d)) * smoothstep(at.ME + 6, at.ME + 18, wq.s) * (1 - firm); }
    o.lane = firm * o.mire; o.wet = wet * o.mire;
    const rz = P.ruinAt(x, z, RUINZ), tOut = P.tarnOut(x, z), tk = tOut < 6 ? 1 - smoothstep(-5, 6, tOut) : 0;
    o.tarn = tk * o.mire;
    o.pool = o.mire > 0 ? Math.max(smoothstep(0.22, 0.5, noise.n2(x * 0.028 + 11, z * 0.028 + 5)), rz.pool, 0.56 * wet, tk > 0 ? 0.45 + 0.55 * tk : 0, leadAt(P, x, z)) * (1 - rz.heap) * (1 - firm) * o.mire : 0;
    o.heap = rz.heap;
  }
  // (the mine's hill stands out of the mire: no sedge and no pool on it)
  const dH = hyp2(x - P.MH[0], z - P.MH[1]) / MINE_HILL.r;
  o.hill = dH < 1.05 ? 1 - smoothstep(0.8, 1.02, dH) : 0;
  if (o.hill > 0) { o.mire *= 1 - o.hill; o.pool *= 1 - o.hill; o.rim *= 1 - o.hill; }
  const ix = x - I[0], iz = z - I[1], dI = hyp2(ix, iz);
  if (dI > P.ISLE_R + 18) { o.isle = o.heap; o.cut = 0; }
  else {
    const iw = ix * d[0] + iz * d[1], il = ix * dR[0] + iz * dR[1];
    o.isle = Math.max(1 - smoothstep(P.ISLE_R * 0.5, P.ISLE_R + 2, dI), Math.min(1, heapAt(iw, il)), houseAt(iw, il));
    o.cut = (1 - smoothstep(P.CUT_HALF, P.CUT_HALF + 2.4, Math.abs(il))) * smoothstep(-36, -22, iw) * (1 - smoothstep(9, 16, iw));
  }
  const dP = parkOut(x, z);
  o.park = dP >= 46 ? 0 : 1 - smoothstep(0, 46, dP);
  if (o.park > 0.6) {
    // the drive (down the avenue to the forecourt), the forecourt before the hall, the walk down the yew alley
    // (the walled garden behind the hall has a cross of paths and a round of gravel at its middle)
    const zf = HALL.zFront, zg0 = zf - HALL.depth - 5, zg1 = ALLEY.z0 + 3, zgc = (zg0 + zg1) / 2;
    const drive = z > zf + 28 ? 1 - smoothstep(2.4, 3.4, Math.abs(x)) : 0;
    // (THE FORECOURT'S GRAVEL MEETS THE HOUSE: a sweep 41 to 48 m wide that lies against the front's walls, the towers' feet and
    // the steps, straight-sided for 12 m before the door and rounded where the drive comes into it, 31 to 34 m before the door)
    const cz = z - zf, cq = cz > 12 ? Math.pow(Math.pow(Math.abs(x) / 24, 4) + Math.pow((cz - 12) / 22, 4), 0.25) : cz > -1.6 ? Math.abs(x) / 24 : 9;
    const court = 1 - smoothstep(0.86, 1.0, cq);
    const walk = z < ALLEY.z0 + 4 && z > ALLEY.z1 - 1 ? 1 - smoothstep(2.6, 3.1, Math.abs(x)) : 0;
    const garden = z < zg0 && z > zg1 && Math.abs(x) < GARDEN_HALF ? Math.max(1 - smoothstep(1.2, 1.8, Math.abs(x)), 1 - smoothstep(1.2, 1.8, Math.abs(z - zgc)), 1 - smoothstep(4.6, 5.4, hyp2(x, z - zgc))) : 0;
    o.gravel = Math.max(drive, court, walk, garden);
  } else o.gravel = 0;
  return o;
}
const ZONE = {};
// The ground's colour (linear), the same function for the land and for everything that grows on it. THE MOOR'S COLOUR IS A FINE
// MOTTLE, NOT PATCHES: where bracken or heather grows the ground under it takes no more than a third of the plant's colour, over
// a wide soft edge broken by a noise 14 m long (the finest the mesh carries near the line); the rust and the purple themselves
// are the plants that stand there (build(): bracken and heather are grown by these same two fields). The mire is tawny sedge
// and olive moss, with bare peat showing through in soft-edged hags; green is kept for the wet edges of its pools. The grain
// close under the eye is the terrain's own near layers.
// ROUND 11, A1: THE MOOR IS IN BROAD SOFT PATCHES NOW, NOT A MOTTLE (the order of round 11 reverses the line above: the fine
// mottle read as a grey speckle from the air). The same fields, at their full strength, and two more: HEATHER in dark
// purple-brown sweeps (four fifths of its colour, was a third), BRACKEN in russet (three quarters), DRIFTS OF PALE GRASS
// whose heads take the moon (a field of its own, 60 m long), and GREEN FLUSHES OF MOSS where the ground is wet (a field of its
// own, and all along the brook's banks). Each is some 30 to 90 m across with an edge 10 to 20 m wide. The plants that stand
// on the ground take its colour as before, so a drift of pale grass is pale grass. (The black peat hags and their wet rims
// are painted to the pixel in the ground's shader: GROUND_GLSL.)
function makeGround(P, pal) {
  const n = P.noise, c = [0, 0, 0];
  const to = (b, t) => { if (t > 0) { c[0] += (b[0] - c[0]) * t; c[1] += (b[1] - c[1]) * t; c[2] += (b[2] - c[2]) * t; } };
  return (x, z, y, ny = 1, out = [0, 0, 0]) => {
    const Z = zoneAt(P, x, z, ZONE);
    const p1 = n.fbm2(x * 0.012 + 40, z * 0.012 - 9, 3) * 0.5 + 0.5, p2 = n.fbm2(x * 0.021 - 17, z * 0.021 + 33, 2) * 0.5 + 0.5, p3 = n.n2(x * 0.071 + 5, z * 0.071 - 31) * 0.5;
    c[0] = pal.moor[0]; c[1] = pal.moor[1]; c[2] = pal.moor[2];
    to(pal.moorB, smoothstep(0.25, 0.75, p2 + 0.3 * p3));
    const p4 = n.fbm2(x * 0.017 + 71, z * 0.017 - 55, 2) * 0.5 + 0.5, p5 = n.fbm2(x * 0.024 - 63, z * 0.024 + 88, 2) * 0.5 + 0.5;
    to(pal.pale, 0.75 * smoothstep(0.52, 0.7, p4 + 0.12 * p3));
    to(pal.bracken, 0.75 * smoothstep(0.4, 0.74, p1 + 0.22 * p3));
    to(pal.heather, 0.8 * smoothstep(0.45, 0.78, 1 - p1 - 0.22 * p3) * smoothstep(0.3, 0.66, p2));
    to(pal.moss, 0.7 * Math.max(smoothstep(0.6, 0.76, p5 + 0.1 * p3), (1 - smoothstep(6, 22, Z.river)) * 0.8));
    to(pal.lawn, Z.park);
    // (THE GRAVEL IS NOT IN THIS COLOUR: carried by the land's corners it was a wash a cell wide at every edge of the drive and the
    // walks. It is painted by place in the ground's own shader, to the pixel: see THE GROUND CLOSE TO in build())
    if (Z.park < 1) { to(pal.bank, (1 - smoothstep(3, 9, Z.river)) * (1 - Z.park)); to(pal.bed, (1 - smoothstep(1.6, 3.2, Z.river)) * (1 - Z.park)); }
    to(pal.granite, Math.max((1 - smoothstep(0.78, 0.9, ny)) * 0.9, (1 - smoothstep(P.CROWN_R + 2, P.CROWN_R + 20, Z.tor)) * 0.7));
    to(pal.mireRim, Z.rim * 0.7);
    if (Z.mire > 0) {
      to(pal.mire, Z.mire); to(pal.mireB, Z.mire * smoothstep(0.3, 0.7, p2 + 0.3 * p3));
      // (bare peat shows through the sedge in hags with soft, broken edges; the firm causeway is trodden peat, darker than the sedge beside it)
      to(pal.peat, Z.mire * smoothstep(0.54, 0.82, p1 + 0.25 * p3) * 0.5);
      // (the firm way is wet trodden peat, not one stripe of it: its darkness comes and goes along it and its edges are broken)
      to(pal.firm, smoothstep(0.2, 0.75, Z.lane + 0.5 * p3) * (0.62 + 0.3 * smoothstep(0.35, 0.65, n.n2(x * 0.19 - 8, z * 0.19 + 3) * 0.5 + 0.5)));
      // (THE POOLS' DARK IS NOT IN THIS COLOUR, round 7: carried by the land's corners, which stand 14 to 28 m apart 60 m and more
      // from the line, it lay as black blots with soft edges on ground that stands over the water, and ended on a cell's
      // straight side. Every pool's dark peat rim and its dark bed are painted in the ground's own shader, to the pixel, by
      // the ground's own height over the pools' level: see THE POOLS' WET RIM in GROUND_GLSL)
    }
    if (Z.isle > 0) { to(pal.spoil, Z.isle * (1 - 0.3 * Z.cut)); to(pal.cutFloor, Z.cut * Z.isle); }
    out[0] = c[0]; out[1] = c[1]; out[2] = c[2];
    return out;
  };
}

// THE GROUND'S GRAIN, a texture of the world's own (256 px, tileable, mip-mapped, read with anisotropy 8 so that it holds at the
// grazing angle a low eye sees the ground at). The kit's ground has soft noise only, whose strong waves are a foot and two feet
// long: close under the eye that is a wash. This carries what is CRISP at a hand's scale, one kind in each channel:
//  R  STONES: a pavement of small stones with dark joints between them, each stone its own tone (the gravel's grain);
//  G  BLADES: short straight strokes lying every way, pale on dark (mown grass close to, moor grass at a larger scale);
//  B  CRACKS: the joints of a net of plates, 0 in a crack and 1 in a plate's middle (dried peat on the firm way);
//  A  MOUNDS: round heads of many sizes, 0 between them (tussocks: the shader lights one side and shades the other by the moon).
// It is made in steps (a generator: the build hands back between them). mean: each channel's mean, so that the shader adds
// the grain about its mean and the ground's colour far off, where the mips have blended it, is what it was.
function* grainSteps(rng, N = 256) {
  // (N is a power of two: a place round the tile is its number's low bits)
  const data = new Uint8Array(N * N * 4), wrap = (v) => v & (N - 1);
  // (stones and cracks: the nearest and the second nearest point of a jittered grid of P by P points, the tile over)
  const net = (P, ch, tone) => {
    const px = new Float32Array(P * P), py = new Float32Array(P * P), pt = new Float32Array(P * P), s = P / N;
    for (let i = 0; i < P * P; i++) { px[i] = 0.1 + 0.8 * rng(); py[i] = 0.1 + 0.8 * rng(); pt[i] = rng(); }
    // (wr: a cell's number round the tile, for the cells one before the first to one after the last)
    const wr = new Int32Array(P + 2); for (let i = -1; i <= P; i++) wr[i + 1] = ((i % P) + P) % P;
    // (the nine points about a texel's cell are read once for each run of texels in that cell, not once a texel: the same sums, in
    // the same order, a fraction of the work)
    const qx = new Float64Array(9), qy = new Float64Array(9), qk = new Int32Array(9);
    for (let y = 0; y < N; y++) { const fy = y * s, cj = Math.floor(fy); let cell = -1;
      for (let x = 0; x < N; x++) {
        const fx = x * s, ci = Math.floor(fx); let f1 = 9, f2 = 9, k1 = 0;
        if (ci !== cell) { cell = ci; let q = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++, q++) { const k = wr[cj + dj + 1] * P + wr[ci + di + 1]; qk[q] = k; qx[q] = ci + di + px[k]; qy[q] = cj + dj + py[k]; } }
        for (let q = 0; q < 9; q++) { const dx = qx[q] - fx, dy = qy[q] - fy, d = dx * dx + dy * dy; if (d < f1) { f2 = f1; f1 = d; k1 = qk[q]; } else if (d < f2) f2 = d; }
        const gap = clamp((Math.sqrt(f2) - Math.sqrt(f1)) * 3.2, 0, 1);
        data[(y * N + x) * 4 + ch] = Math.round(255 * (tone ? gap * (0.35 + 0.65 * pt[k1]) : gap));
      } }
  };
  net(40, 0, true); yield;
  net(9, 2, false); yield;
  // (blades: 1500 strokes, 9 to 26 px long, each its own tone; the brightest stroke at a place is kept)
  for (let i = 0; i < 1500; i++) {
    const x0 = rng() * N, y0 = rng() * N, a = rng() * 6.2832, len = 9 + 17 * rng(), tone = 110 + 145 * rng(), dx = Math.cos(a), dy = Math.sin(a);
    for (let t = 0; t <= len; t += 0.5) {
      const taper = Math.min(1, t / 3, (len - t) / 5), x = x0 + dx * t, y = y0 + dy * t, v = tone * (0.5 + 0.5 * taper);
      for (let o = 0; o < 2; o++) { const k = (wrap(Math.round(y - dx * o * 0.7)) * N + wrap(Math.round(x + dy * o * 0.7))) * 4 + 1; if (v > data[k]) data[k] = v; }
    }
  }
  yield;
  // (mounds: soft heads on a jittered grid of 8 by 8, one place in three filled, 0.2 to 0.5 of a cell in radius)
  { const P = 8, c = N / P;
    for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
      const jx = rng(), jy = rng(), fill = rng() < 0.34, r = (0.2 + 0.3 * rng()) * c, hh = 0.45 + 0.55 * rng();
      if (!fill) continue;
      const cx = (i + jx) * c, cy = (j + jy) * c;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const q = ((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (r * r); if (q >= 1) continue;
        const k = (wrap(y) * N + wrap(x)) * 4 + 3, v = 255 * hh * (1 - q) * (1 - q * 0.5); if (v > data[k]) data[k] = v;
      }
    } }
  yield;
  let m0 = 0, m1 = 0, m2 = 0, m3 = 0; for (let i = 0; i < N * N * 4; i += 4) { m0 += data[i]; m1 += data[i + 1]; m2 += data[i + 2]; m3 += data[i + 3]; }
  const mean = [m0, m1, m2, m3]; for (let k = 0; k < 4; k++) mean[k] /= N * N * 255;
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
  return { tex, mean };
}

// THE GROUND'S OWN LINES in the terrain's fragment shader (build() tells what they paint and puts them in; the K_ names are
// measures of the plan, written in as numbers there). They stand inside the kit's own block, after its ground and rock and
// before it hands the colour on: c is the ground's colour, wp the place, tD and tF the kit's mid and fine noise, flatK and
// rock its own masks.
const GROUND_GLSL = /* glsl */`
  vec3 moorBump = vec3(0.); float moorWet = 0.;
  { vec2 p = wp.xz, pr = vec2(.8 * p.x + .6 * p.y, -.6 * p.x + .8 * p.y), pq = vec2(.28 * p.x - .96 * p.y, .96 * p.x + .28 * p.y);
    vec2 mh = normalize(uMoorMoon.xy), mr = vec2(.8 * mh.x + .6 * mh.y, -.6 * mh.x + .8 * mh.y), mq = vec2(.28 * mh.x - .96 * mh.y, .96 * mh.x + .28 * mh.y);
    vec4 gA = texture2D(tMoorGrain, p * .9346), gB = texture2D(tMoorGrain, pr * .3448), gC = texture2D(tMoorGrain, pq * .137);
    float gC2 = texture2D(tMoorGrain, (pq + mq * .3) * .137).a;
    // (SAMPLING: fwp is a pixel's footprint on the ground, in metres; it is read for filters only, each going to its own mean)
    float fwp = length(dFdx(p)) + length(dFdy(p));
    // the park, and the gravel in it: metres outside the gravel's edge (the drive, the forecourt, the yew walk, the garden's paths)
    vec2 pk = p - clamp(p, vec2(-64., K_PZ0), vec2(64., 46.)); float park = 1. - smoothstep(0., 46., length(pk));
    float ax = abs(p.x), cz = p.y - (K_ZF), dG = 99.;
    if (p.y > K_ZF + 28.) dG = ax - 2.9;
    float cq = cz > 12. ? pow(pow(ax / 24., 4.) + pow((cz - 12.) / 22., 4.), .25) : (cz > -1.6 ? ax / 24. : 9.);
    dG = min(dG, (cq - .93) * 24.);
    if (p.y < K_AZ0 + 4. && p.y > K_AZ1 - 1.) dG = min(dG, ax - 2.85);
    if (p.y < K_ZG0 && p.y > K_ZG1 && ax < K_GHALF) dG = min(dG, min(min(ax - 1.5, abs(p.y - (K_ZGC)) - 1.5), length(vec2(p.x, p.y - (K_ZGC))) - 5.));
    // (the gravel's edge is spread over the pixel's footprint: a pixel that spans the edge holds its share of gravel, the edge's own mean)
    float gravel = (1. - smoothstep(-.04 - fwp, .04 + fwp, dG + (tF.r - .5) * .3)) * step(.6, park);
    // THE FORECOURT'S KERB (round 8): a band of pale setts a foot wide round the forecourt's gravel, where it meets the lawn, and
    // beyond it the lawn's edge worn thin over a metre
    float onCourt = step(K_ZF - 1.6, p.y) * (1. - step(K_ZF + 36., p.y)) * step(.6, park);
    float kerb = (1. - smoothstep(.15 + fwp, .19 + 2. * fwp, abs(dG - .2))) * onCourt, worn = (1. - smoothstep(.4, 1.7, dG)) * step(.38, dG) * onCourt;
    float onDrive = step(K_ZF + 30., p.y), rutX = ax + .07 * sin(p.y * .21) - .78;
    vec3 gcol = uMoorGravel * (1. + 1.15 * (gA.r * .55 + gB.r * .45 - uMoorMean.x)) * (.9 + .2 * tD.r);
    gcol *= 1. - onDrive * (.36 * exp(-rutX * rutX / .03) + .1 * (1. - smoothstep(.2, .6, ax)));
    // the lawn's blades; the moor's and the mire's longer grass and their tussock heads (pale toward the moon, shade behind)
    float lawn = park * (1. - gravel), wild = (1. - park) * flatK * (1. - rock);
    c *= 1. + lawn * 1.2 * (gA.g * .6 + gB.g * .4 - uMoorMean.y);
    c = mix(c, gcol, gravel);
    c = mix(c, gcol * .8, .35 * worn); c = mix(c, uMoorGravel * (1.05 + .5 * (gA.r - uMoorMean.x)), kerb);
    // (round 7: GRAVEL IN THE SHADE IS NOT A BLOT. The avenue's crowns and the yew's balls throw their shade across the pale gravel,
    // and by the moon alone that shade was four times darker than the lit stone: dark blots on a pale road. Pale gravel takes
    // the open sky's light as well, by place: the shade on it stands at about half the lit stone)
    gTEmit += gcol * uMoorSkyG * gravel;
    gMoorOpen = 1. - gravel;   // (mending 1 of polish 1: the night's lift of shaded ground is not for gravel)
    // THE OLD WAY, from its map (build() writes it by the plan's own way): metres from the sunken lane and the moor track (r), from
    // the miners' path over the tor's hill (g), from the wand path (b), and outside the nearest firm island or the yard's apron (a)
    vec4 wm = texture2D(tMoorWay, (p - uMoorWayA.xy) * uMoorWayA.zw) * K_WAYM;
    vec2 mc = p - uMoorMireB.xy;
    float mire = 1. - smoothstep(.78, 1., length(vec2(dot(mc, uMoorMireA.zw) * uMoorMireB.z, dot(mc, vec2(-uMoorMireA.w, uMoorMireA.z)) * uMoorMireB.w)));
    // (the track, from the wicket gate to the mire's shore: bare earth a cart's breadth across, a rut under each wheel and
    // grass still standing along the middle, its edges soft and ragged by the kit's fine noise; the second channel, a
    // trodden foot path, is written nowhere now)
    float jit = (tF.r - .5) * .7, track = 1. - smoothstep(.9, 2.3, wm.r + jit), foot = 1. - smoothstep(.4, .95, wm.g + .6 * jit);
    float rut = exp(-(wm.r - .72) * (wm.r - .72) / .03), bare = max(track * (.4 + .6 * smoothstep(.12, .5, wm.r)), .85 * foot);
    vec3 earth = uMoorEarth * (1. + .9 * (gB.r * .6 + gA.r * .4 - uMoorMean.x)) * (.85 + .3 * tD.r);
    c = mix(c, earth * (1. - .42 * rut * track), bare);
    wild *= 1. - bare;
    // (the firm islands' trodden strip and the yard's apron: dried peat, as below)
    float lane = (1. - smoothstep(0., 1.4, wm.a + jit)) * (1. - smoothstep(1.0, 2.2, wm.b + jit)) * mire;
    wild *= 1. - lane;
    // (the tussock heads stand in patches, by the kit's mid noise; each is a little paler toward the moon and shaded behind, no
    // more. SAMPLING: tRes is how much of a head a pixel still resolves (its footprint on the ground under 5 cm: all; over 16 cm:
    // none). What it does not resolve goes to ITS OWN MEAN over the grain: the heads' height to the texture's mean, their shade
    // and their lit side to the means counted on the texture at build (uMoorTus), the tilt of the light to nothing, its mean)
    float tPatch = smoothstep(.4, .62, tD.r), tRes = 1. - smoothstep(.05, .16, fwp);
    float mound = tPatch * mix(uMoorMean.w, gC.a, tRes);
    float tsh = tPatch * mix(uMoorTus.x, smoothstep(.06, .3, gC2 - gC.a), tRes), tlit = tPatch * mix(uMoorTus.y, smoothstep(.04, .25, gC.a - gC2), tRes);
    // (round 11: the blades' own contrast on the moor is 0.5, was 1.1: at 1.1 the moor was a speckle of black strokes on pale)
    c *= 1. + wild * (.5 * (gB.g * .5 + gC.g * .5 - uMoorMean.y) + .14 * mound - .26 * tsh + .14 * tlit);
    // THE MOOR CLOSE TO (round 8). HEATHER'S MOTTLE IN TWO TONES between the tussock patches: cushions a hand to a foot across, a
    // dark one and a grey-green one (the grain's stones read at a cushion's size; a stone's own tone names which), and THE PALE
    // HEADS of the moor grass among the tussocks. SAMPLING: each goes to its own mean over the grain (uMoorHeath: the two
    // tones' shares and the heads' share, counted on the texture at build) as a pixel's footprint grows past a cushion or a head
    float hPatch = (1. - smoothstep(.34, .5, tD.r)) * wild * (1. - mire), hRes = 1. - smoothstep(.1, .4, fwp), dRes = 1. - smoothstep(.03, .1, fwp);
    float hA = mix(uMoorHeath.x, smoothstep(.58, .66, gC.r), hRes), hB = mix(uMoorHeath.y, smoothstep(.3, .38, gC.r) * (1. - smoothstep(.58, .66, gC.r)), hRes);
    c = mix(c, uMoorHeathA, .4 * hPatch * hA); c = mix(c, uMoorHeathB, .3 * hPatch * hB);
    c += uMoorHeadC * (.16 * mix(uMoorHeath.z, smoothstep(.8, .92, gA.g), dRes) * wild * (1. - hPatch) * (1. - mire));
    // (the measure before wild: polish 1, stage A. It was .5 under the kit's bump of 0.8; the bump is the moon's now, the kit's own
    // uTDetail.y, and the measure is 0.4 over it: the heads' light is what it was)
    moorBump = vec3(mh.x, 0., mh.y) * ((gC2 - gC.a) * tPatch * tRes * (.4 / uTDetail.y) * wild);
    // dried peat in cracked plates, stones trodden in, wet patches that are darker and smooth
    float crk = min(1., (1. - smoothstep(0., .14, gB.b)) * .8 + (1. - smoothstep(0., .1, gA.b)) * .35), wetP = smoothstep(.56, .68, tD.r * .7 + gC.r * .3);
    c *= 1. - lane * (.5 * crk * (1. - wetP) + .45 * wetP);
    c *= 1. + lane * .8 * (gB.r - uMoorMean.x) * (1. - wetP);
    moorWet = lane * wetP;
    // THE PEAT HAGS (round 11, A1): on the open moor, off the track and the tussock patches, BLACK PEAT lies bare in hags 5 to
    // 12 m across, each with A WET RIM a metre wide that is smooth and takes the moon's glint as the wet of the firm way does.
    // They lie where a noise of the place (two sizes, 23 m and 9 m) stands highest: a tenth of the moor. To the pixel: their
    // edges are the noise's own, a little ragged by the kit's fine noise.
    float hgN = moorN2(p * .043 + 7.3) * .62 + moorN2(p * .117 - 3.1) * .38 + (tF.r - .5) * .05, hgOn = wild * (1. - mire) * (1. - .8 * tPatch);
    // (polish 1, stage C2a: THE HAGS TO THE PIXEL. A hag's edge is a band of 3 in a hundred of its noise, and far off, seen flat,
    // a pixel spans more of the noise than that: the hags broke into black dashes, one pixel row a hag or none. Now the
    // band is WIDENED BY THE PIXEL'S OWN SPAN OF THE NOISE (hgW: half of it to either side, of the noise's own two sizes without
    // the kit's fine noise, which is the edge's ragged line and no span of the hag: a pixel that spans an edge holds
    // its share of hag), and where a pixel spans a whole cell of the noise's finer size and more (hgRes: all of a hag under
    // half a cell, none of it from a cell and a half) the hag and its rim go to THEIR OWN MEANS over the noise (0.149 and
    // 0.113: counted over the noise's own lines on a metre's grid three kilometres square). Both spans are the screen's own,
    // of the noise and of the noise's cells: nothing here knows how far the eye is or where)
    float hgW = .5 * fwidth(hgN - (tF.r - .5) * .05), hgRes = 1. - smoothstep(.5, 1.5, length(fwidth(p * .117)));
    float hag = mix(.149, smoothstep(.655 - hgW, .685 + hgW, hgN), hgRes) * hgOn, hagRim = mix(.113, smoothstep(.61 - hgW, .655 + hgW, hgN) * (1. - smoothstep(.685 - hgW, .73 + hgW, hgN)), hgRes) * hgOn;
    c = mix(c, uMoorPoolC * 1.25, .92 * hag); c = mix(c, uMoorWetC, .7 * hagRim * (1. - hag));
    // (stage C2b: A HAG'S LEVEL FLOOR IS STILL DARK PEAT WATER. hgPool: how much of a place is pool: the hag, where the GROUND'S
    // OWN SLOPE is near level (the land's own normal: whole under 2.5 degrees, none from 5: on a slope the floor stays wet
    // dark peat with its sparkle, as it was) and off the track (a cart's way is beaten firm). The pool is the floor and no
    // more: its colour is the hag's dark peat, it is wet whole, and its face is LEVEL (gMoorPoolN, the world's up, which
    // the hook hands to the light in place of the land's normal with its grain): so the moon's mirror lies on it by the
    // eye's ray as on all gloss (held in the hook's line of the glint, so that a pool's bright part stands under the mire's
    // own water's), and by the same ray it shows THE LOW SKY'S TONE as still water does (uMoorPoolA; little
    // from above, most at a flat look: the garden basin's law of the look's angle to the face). A SLOW RIPPLE by the
    // world's clock (uTFx.w, the kit's own, which update already feeds) tilts the face a little: a noise of the place that
    // drifts, as the basin's; a pixel wider than a ripple takes it at its mean, level. Nothing here knows how far the eye is)
    // (polish 1, stage C2 mending 1: THE POOL MIRRORS THE SKY IT FACES, by the eye's ray alone; the two sentences above on the
    // moon's mirror and the low sky's tone are as this now has them. plR is the eye's ray thrown back by the rippled face.
    // Three things of the sky as the picture shows it stand in the mirror: (1) THE LOW SKY'S TONE on the mirrored ray's
    // bearing (uMoorPlA: the kit's own sky at the height uMoorPlA.w, 5 degrees, with the kit's own wash of the far light by
    // the bearing, uMoorPlS and uMoorPlSun; drawn half way to its grey, so that near the picture's toe a pool is slate and
    // no blue paint); (2) THE MOON'S GLOW about the mirrored moon, by the kit's own lines of it (uMoorPlGlow; uMoorPlMoon
    // is the moon as drawn and the sine of its radius); (3) THE MOON'S OWN MIRROR, drawn out by the face's fine ripple into
    // a lobe of uMoorPl.w about the mirrored moon (uMoorPlDisc: of the hour's light where the moon is the light, of the
    // disc's own where it is not), which the slow ripple, tilting the face, breaks into a glitter that drifts by the clock;
    // a pixel wider than the ripple takes the lobe at its mean, wider and fainter by as much (plRs: how much of the ripple
    // a pixel still sees; .2: the mirrored ray's spread for a ripple figure of one, counted over the ripple's own noise).
    // The mirror's strength, uMoorPl.x, falls by the look's angle to the face with the power uMoorPl.y: at night nearly
    // whole to a steep look, by day the garden basin's law as it stood. The gloss's own mirror of the moon is taken off
    // a pool whole in the hook's line of the glint: this is it. Nothing here knows how far the eye is, where it is or
    // how far it has flown)
    float hgPool = hag * smoothstep(.9962, .9990, wnS.y) * (1. - track);
    moorWet = max(moorWet, max(.9 * hagRim, mix(.5 * hag, 1., hgPool)));
    if (hgPool > .002) { float plRs = 1. - smoothstep(.15, .7, fwp), plK = uMoorPl.z * plRs; vec2 plQ = p * 2.6, plA = vec2(.21, .13) * uTFx.w, plB = vec2(.3, -.17) * uTFx.w, plD = vec2(.12, 0.);
      float pl0 = moorN2(plQ + plA) + .5 * moorN2(plQ * 2.3 - plB);
      gMoorPoolN = normalize(vec3((pl0 - moorN2(plQ + plD + plA) - .5 * moorN2((plQ + plD) * 2.3 - plB)) * plK, 1., (pl0 - moorN2(plQ + plD.yx + plA) - .5 * moorN2((plQ + plD.yx) * 2.3 - plB)) * plK));
      vec3 plV = normalize(cameraPosition - wp), plR = reflect(-plV, gMoorPoolN); plR.y = abs(plR.y);
      float plMb = dot(plR, uMoorPlMoon.xyz), plSa = length(plR - uMoorPlMoon.xyz * plMb) + 2. * step(plMb, 0.), plGx = max(plSa - uMoorPlMoon.w, 0.) / uMoorPlGlow.w, plW = uMoorPl.w * uMoorPl.w + pow(.2 * uMoorPl.z * (1. - plRs), 2.);
      vec3 plS = mix(uMoorPlA.rgb, uMoorPlS.rgb, clamp(pow(.5 + .5 * dot(normalize(vec3(plR.x, uMoorPlA.w * length(plR.xz), plR.z) + 1e-5), uMoorPlSun.xyz), uMoorPlSun.w) * uMoorPlS.w, 0., 1.));
      plS += uMoorPlGlow.rgb * ((exp(-plGx * plGx * .5) * .35 + .65 * exp(-plGx * 2.2)) * mix(1., smoothstep(-.03, .24, plR.y), uMoorPlDisc.w));
      plS += uMoorPlDisc.rgb * (uMoorPl.w * uMoorPl.w / plW * exp(-plSa * plSa / plW));
      gTEmit += plS * (uMoorPl.x * (.08 + .92 * pow(1. - saturate(dot(plV, gMoorPoolN)), uMoorPl.y)) * hgPool); }
    // (gMoorPoolH: how far the moon's mirror is held: whole from a quarter of a pool where a pixel sees the pool's edge; the pool's own share where it does not)
    gMoorPool = hgPool; gMoorPoolH = mix(hgPool, smoothstep(0., .25, hgPool), hgRes);
    // (polish 1, stage C3 mending 1, H2: WHERE THE DARKEST LAND'S FLOOR HOLDS, gMoorFloor: on the open moor (not in the park),
    // off a hag's pool, by as much as THE LAND'S OWN SLOPE is turned from the hour's light (wnS, the land's normal without
    // its grain, against the light's bearing and height as the piles' shade has them; whole where the slope takes none of
    // it, out at the lift's own measure uMoorShade.w: level ground and ground that faces the light have none). By the
    // place and the land's shape alone: a cast shadow, the eye and the clock are not read)
    gMoorFloor = (1. - park) * (1. - hgPool) * (1. - smoothstep(0., uMoorShade.w, dot(wnS, normalize(vec3(mh.x, uMoorMoon.z, mh.y)))));
    // THE POOLS' WET RIM, BY THE GROUND'S OWN HEIGHT (round 7): in the mire, off the firm way and off the mine's island, ground
    // that lies under the pools' level is the pool's dark bed, and ground within a hand and a half over it is wet dark peat:
    // the rim follows the water's edge exactly, wherever the ground is cut coarse or fine. (K_POOLY: the pools' level.)
    float wetIn = mire * (1. - lane) * smoothstep(K_ISLER - 1., K_ISLER + 5., distance(p, uMoorMireA.xy));
    c = mix(c, uMoorWetC, .85 * wetIn * (1. - smoothstep(K_POOLY + .03, K_POOLY + .2, wp.y)));
    c = mix(c, uMoorPoolC, .9 * wetIn * (1. - smoothstep(K_POOLY - .35, K_POOLY - .03, wp.y)));
    // the shadows of the tor's piles, down the hill from the moon
    if (uMoorTor.z > 0. && distance(p, uMoorTor.xy) < uMoorTor.z) { float sh = 0.;
      for (int i = 0; i < K_NPILE; i++) { vec4 q = uMoorPiles[i]; if (q.z <= 0.) continue;
        vec2 dq = q.xy - p; float al = dot(dq, mh), ac = abs(dq.x * mh.y - dq.y * mh.x), hr = wp.y + al * uMoorMoon.z;
        sh = max(sh, smoothstep(q.z * .6, q.z * 1.5, al) * (1. - smoothstep(q.z * .7, q.z * 1.05 + .05 * al, ac)) * (1. - smoothstep(q.w - 4. - .06 * al, q.w, hr))); }
      gMoorShade = sh * .82; }
    // THE PLACE'S LIGHTS ON THE GROUND (round 8), wherever a lamp, a lit window or a fire stands: grass, a third as pale as
    // gravel or peat, takes it nearly twice over, so that a pool is seen as a pool on either
    gTEmit += c * moorLamps(wp, vec3(0., 1., 0.), .2) * mix(1.25, uMoorLampG, gravel);   // (uMoorLampG: the gravel's hold is not on its lamps' light)
    // WET GROUND IS DARK UNDER THE NIGHT'S SKY (polish 1, mending 2). moorDamp: how wet a place of the ground is: whole where
    // the wet is whole (the firm way's wet patches, the hags' rims, the pools' rims by the ground's own height), half on the
    // hags' peat, and 0.85 over all the mire's LOW ground off the mine's island (it is wet all over, the trodden strip
    // of the firm islands with it; low: within 0.9 m over the pools' level, and none from 2.2 m over it: the mine's hill
    // and the heaps stand out of the wet). By that much the ground keeps less of its colour under the moon and the sky's
    // fill (uMoorDampK, the night's; nought at the other hours) and takes less of the night's lift of shade. The lamps' and
    // the fires' light on it, above, is not held: a fire's red on wet peat stands on dark ground. And THE MOON'S MIRROR ON DAMP
    // GROUND IS LIVE'S (uMoorDampK.y, in the hook's line of the glint): the moon's rise is taken back on it, as on the wet.
    float moorDamp = max(moorWet, max(.85 * max(wetIn, lane) * (1. - smoothstep(K_POOLY + .9, K_POOLY + 2.2, wp.y)), wetIn * (1. - smoothstep(K_POOLY + .03, K_POOLY + .2, wp.y))));
    c *= 1. - uMoorDampK.x * moorDamp; gMoorOpen *= 1. - moorDamp; gMoorDamp = moorDamp;
  }`;

// THE WRACK ACROSS THE MOON (round 11, A2). A long torn band of thin cloud lies across the moon's height and drifts along it on
// the world's clock. It is a thing of the sky, as the moon is: it stands in the sky's own directions about the moon (uMoon, uRight,
// uUp: the moon's place and the two ways across it), at the sky's distance (drawn at the far end of the depth, behind every solid
// thing), and nothing of it knows where the eye is or which way it looks. ITS LIGHT IS THE MOON'S: the thick of a streak is a grey
// of the lit sky (the moon dimmed behind it), its veils and edges take the moon's light and shine, the more the nearer the moon;
// far from the moon it dims into the sky. Its shapes are a noise of the sky's place and the clock alone (no texture: nothing to free but the material).
const WRACK_VERT = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position * 100.0, 1.0); gl_Position = vec4(p.xy, p.w * 0.99995, p.w); }`;
const WRACK_FRAG = /* glsl */`
  uniform vec3 uMoon; uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uLit; uniform vec3 uDark; uniform float uTime; uniform vec4 uWrack; uniform float uFar;
  varying vec3 vDir;
  float wkH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float wkN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wkH(i), wkH(i + vec2(1.0, 0.0)), f.x), mix(wkH(i + vec2(0.0, 1.0)), wkH(i + vec2(1.0, 1.0)), f.x), f.y); }
  float wkF(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * wkN(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; } return s; }
  void main() {
    vec3 d = normalize(vDir); float f = dot(d, uMoon); if (f < 0.2) discard;
    // (the sky about the moon as a sheet: x along the moon's height, y above and below it, both in radians near the moon)
    float x = dot(d, uRight) / f, y = dot(d, uUp) / f, t = uTime * uWrack.x;
    // (the wrack's shapes: long thin streaks drawn out along x, torn by a finer noise; both drift along x by the clock, the fine
    // faster. Most of the band is clear sky or a thin veil: only the noise's high places are cloud)
    float w = wkF(vec2(x * 3.4 - t, y * 21.0 + x * 2.2)), w2 = wkF(vec2(x * 9.0 - t * 1.7 + 3.1, y * 46.0 - 5.3));
    // (it lies across the moon's height: a band some 12 degrees deep, thinning above and below and along its length)
    float band = smoothstep(-0.17, -0.03, y) * (1.0 - smoothstep(0.04, 0.2, y)) * (1.0 - smoothstep(0.25, 0.8, abs(x)));
    float den = smoothstep(uWrack.y, uWrack.y + 0.42, (w * 0.7 + w2 * 0.3) * (0.6 + 0.5 * band)) * band;
    float ang2 = x * x + y * y, near = exp(-ang2 / uWrack.z), halo = exp(-ang2 / (uWrack.z * 9.0));
    // (a veil and the edges of a streak take the moon's light, the more the nearer the moon; the thick of a streak is a grey of
    // the lit sky about the moon, never darker than that sky: a cloud before the moon, not a hole in the night; uFar is how much
    // of that grey it keeps far from the moon: a third in the night's dark sky, more in a dusk's or a dawn's bright one)
    float core = smoothstep(0.35, 0.95, den);
    vec3 col = mix(uLit * (0.07 + 0.3 * halo + 0.6 * near), uDark * (uFar + 0.9 * halo), core);
    float a = smoothstep(0.0, 0.6, den) * uWrack.w;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }`;

// THE GARDEN'S BASIN (round 11, A3): the water of a round stone basin in the walled garden. STILL DARK WATER THAT MIRRORS: by the
// ray from the eye mirrored in the water's face (rippled a little, by the world's clock) it shows the sky's own tone, and THE
// MOON where the mirrored ray comes near the moon: its disc, broken by the ripples, and about it A BROAD SHINE OF THE MOON ON THE
// RIPPLES (a glitter that falls to a fifth some twelve degrees from the mirrored moon, sparkling by the clock: broader than still water gives, as
// a pond with a breath of wind on it). Nothing here places the moon in the basin for any eye: the water lies where it lies and
// mirrors as water does; the air between is the scene's fog. The ripples are a noise of the place and the clock (no texture).
const BASIN_VERT = /* glsl */`
  varying vec3 vW;
  void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BASIN_FRAG = /* glsl */`
  uniform vec3 uMoonD; uniform vec3 uMoonC; uniform vec3 uDeep; uniform vec3 uSkyA; uniform vec3 uSkyB; uniform float uTime; uniform float uMoonR;
  uniform vec3 fogColor; uniform float fogDensity;
  varying vec3 vW;
  float bsH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float bsN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(bsH(i), bsH(i + vec2(1.0, 0.0)), f.x), mix(bsH(i + vec2(0.0, 1.0)), bsH(i + vec2(1.0, 1.0)), f.x), f.y); }
  float bsW(vec2 p) { return bsN(p + vec2(uTime * 0.21, uTime * 0.13)) + 0.5 * bsN(p * 2.3 - vec2(uTime * 0.3, -uTime * 0.17)); }
  void main() {
    vec3 toP = vW - cameraPosition; float dist = max(length(toP), 0.001); vec3 V = toP / dist;
    // (the ripples: a soft swell a span across and a finer one over it, by the slope of a noise; fw, a pixel's span on the water,
    // takes them to nothing far off)
    float fw = length(fwidth(vW.xz)), k = 1.0 - smoothstep(0.15, 0.7, fw);
    vec2 q = vW.xz * 2.6; float n0 = bsW(q);
    vec2 rp = vec2(bsW(q + vec2(0.12, 0.0)) - n0, bsW(q + vec2(0.0, 0.12)) - n0) * (0.42 * k);
    vec3 N = normalize(vec3(-rp.x, 1.0, -rp.y)), R = reflect(V, N); R.y = abs(R.y);
    float fr = 0.08 + 0.92 * pow(1.0 - clamp(dot(-V, N), 0.0, 1.0), 4.0);
    float ang = acos(clamp(dot(normalize(R), uMoonD), -1.0, 1.0));
    vec3 sky = mix(uSkyA, uSkyB, smoothstep(0.0, 0.6, R.y));
    // (the moon's disc, and its glitter on the ripples: sparks of it, more and less by a quick noise of the place)
    float sp = mix(0.4, smoothstep(0.5, 0.85, bsN(vW.xz * 11.0 + vec2(uTime * 0.8, -uTime * 0.5))), k);
    vec3 moon = uMoonC * (smoothstep(uMoonR * 1.2, uMoonR * 0.85, ang) + exp(-ang * ang / (uMoonR * uMoonR * 12.0)) * (0.25 + 1.1 * sp));
    vec3 col = mix(uDeep, sky, fr) + moon * (0.35 + 0.65 * fr);
    col = mix(col, fogColor, 1.0 - exp(-fogDensity * fogDensity * dist * dist));
    gl_FragColor = vec4(col, 1.0);
  }`;

// The hours. Night is the book's own (and what an unset hour gives); the others keep the moon's place so that the route still holds.
const HOURS = {
  // (ROUND 8, THE MOON'S LAND IS SILVER, NOT BLUE: half the blue is out of the sky's light, the haze and the shade. The moon's
  // light is silver-white, the sky's fill a grey with a little blue in it, the haze a grey-blue; the sky is deep indigo
  // overhead and paler and GREENER toward the moon (the kit's wash on the moon's side), its clouds silver with a warm edge
  // by the moon; the moon is a third larger (6.1 degrees of radius, was 4.6) in a real halo.)
  // (ROUND 11, A2: THE MOON IS SMALLER AND HAS A FACE. It was a plain white disc 12 degrees across, two dozen moons' breadth
  // in the sky. Now its radius is 2.8 degrees at night (under 6 across), its light on the disc is held under full white (0.85, was
  // 1.25) so that its seas show, and the seas are darker and stronger (color2, texture, at the body below); its halo is the
  // same law, narrower with the disc and a little fainter. The light it throws on the land is the hour's own and is not less.)
  // POLISH 1, STAGE C1: THE NIGHT'S LIGHT. One cause stood behind the black hedge, the black hill and the black blots: the
  // post's own curve (with the contrast below) draws everything under 0.0325 of scene light as level 0 and climbs steeply
  // after (0.04 is 26, 0.05 is 44), and under the old figures everything the moon did not reach lay under it. The figures
  // of the night, one law for every place: THE SKY'S FILL 3.5 (ambientK; was 1.75); THE MOON 3.1 (lightK; was 2.9); and by
  // the hour's own measures, which the other hours do not have and so keep what they had: `bank` (the fog bank's own white
  // goes up with the moon: 3.1 over 2.9 of SEA.litK); `shade` (THE GROUND IN ITS OWN SHADE: the fill alone left a slope
  // turned from the moon at 0.03, under the black; its law is the mending's, below); `earth` (the old way's bare earth,
  // the palest ground there is, keeps three quarters of its colour, so that it does not climb over the fog bank's pale);
  // `glint` (what WET ground mirrors of the moon, of the kit's: the mending's, below; dry ground's is whole);
  // `sheet` (the plants' and the stones' soft shade sheets are 0.45 at the most: at 0.55 to 0.66 each took lit ground
  // under the black); `gravel` (the garden's pale gravel keeps a part of its colour, for the same ceiling); and the
  // built walls' own night fill (`fill`, which stands beside the sky's on every wall of the place) is [0.09, 0.1, 0.13],
  // was [0.15, 0.17, 0.22]: with the sky's fill doubled the hall's stone would else have stood a third paler beside
  // its own windows. The leaves' own shares of the sky (the oaks' crowns and the low plants) are left: they go up with the
  // fill as the ground does. The sky's own drawing, the lights of the place and the windows are not touched.
  // POLISH 1, MENDING 1 OF B AND C1 (the night's figures, each read where its thing is made; the other hours have none of
  // them and keep what they had):
  // `shade` 1.3: THE GROUND THE MOON DOES NOT REACH IS LIT BY A NEUTRAL GREY, BY ITS OWN COLOUR. It was the kit's bounce
  //   made fourfold in the sky's blue: that went by the kit's baked shade alone, so it drew the baked shade's pattern, and
  //   on ground that gives back a tenth it stood at the picture's toe, where the post draws a little more blue as paint.
  //   Now the kit's bounce is the kit's own again and the ground's hook adds its own term: where ground takes NONE of the
  //   moon (its turn from the moon, the baked shade, the piles' shade and the shadow map together) the sky's blue fill
  //   is made up to an even grey of 1.3 in every channel; the term fades out as the ground's take of the moon comes up
  //   to 0.8 of what flat open ground takes. None on gravel (pale ground never lay under the black).
  // `rock`, `rockB`: THE STEEP GROUND'S BARE ROCK IS A WARM GREY UNDER THE MOON. The terrain's two bed colours are slate
  //   blue ('#4a5560', '#59636e'): the mine's hill is steep (half of it steeper than 34 degrees; the tor's hill hardly
  //   anywhere steeper than 27) and 4 parts in 10 of it are turned from the moon (the tor's hill: 2), so the kit draws
  //   its steeper parts as bare rock, and they lie in the shade: lifted out of the black, with the air's own blue over a
  //   dark thing 400 m off, they stood as blue blots in the heather.
  // `gravel` 0.87 (was 0.9), `gravelSky` 0: THE COURT. The gravel's own share of the sky (it stood beside the fill, and the
  //   fill is doubled) is out at night, and the lamps' and windows' light on the gravel is not held with the gravel's
  //   colour: the warm pool before the hall's door is live's again.
  // `glint` 0.87 (was 0.35): THE MOON'S OWN MIRROR on wet ground and on granite. At 2.9 over 3.1 it is live's own; the
  //   broad wet patch by the old way then stood 3 levels over live on its lifted ground, at 0.87 it is live's.
  // `water` 2.9: the waters mirror the moon at live's strength (the kit's waters took the moon's rise).
  // `board` 0.745, `boardGlint` 2.9 over 3.1: the plank way's boards mirror the moon as in live (the moon's rise taken
  //   back) and keep three quarters of their colour under the doubled fill: seen toward the moon and seen across it they
  //   stand as in live.
  // `stone` 0.82: GRANITE gives back that much of the moon's direct light (its lit side stood higher against the fog
  //   bank's bright part than in live); its shade is not touched: it keeps the fourfold bounce as its own.
  // `yewHue` 0.5: how far the yew's floor has the fill's hue (the night's walk as it was); the other hours have none.
  // POLISH 1, MENDING 2 (the night's alone, as above):
  // `dull` 0.85: GROUND IN SHADE HAS LITTLE COLOUR. What a slope the moon does not reach gives back of the sky and the lift
  //   is drawn 0.85 of the way to its own grey, in the moon's own tint: the same land as the lit land beside it, darker
  //   and no more coloured (it stood in its whole colour at the picture's toe: a green and rust hill under a night sky).
  // `damp` 0.32, `dampGlint` 2.9 over 3.1: WET GROUND IS DARK. By as much as a place of the ground is wet (the mire's low
  //   ground, the wet patches, the hags, the pools' rims: moorDamp in the ground's lines) it keeps 0.32 less of its colour
  //   under the moon and the sky, takes less of the lift, and mirrors the moon as in live (the moon's rise taken back);
  //   the lamps' and fires' light on it is not held.
  // `coat` 0.45: the hound's coat keeps that much of its colour (coal-black under the doubled fill; the part's coatK).
  // POLISH 1, STAGE C3 MENDING 1 (the night's alone):
  // `floor` 0.0372, 0.95: THE DARKEST LAND IS STILL LAND. On the open moor, where the land's own slope is turned from the
  //   moon, the ground gives back no less than 0.0372 of light (the post's toe draws 0.0325 and under as black), less 0.05
  //   of what it lacks, so that its own grain still shows: the heather sweep's own colour is too dark for the lift, and
  //   the kit's baked shade takes the lift again. In the moon's own tint as the shade's grey is (`dull`); not in the park,
  //   not on a hag's pool, not on level ground or ground that faces the moon (the ground's lines: gMoorFloor).
  night: { sky: { preset: 'night', zenith: '#090c22', mid: '#1c2742', horizon: '#56636f', ground: '#0e1119', stars: 0.85, milkyWay: 0.4, scatterColor: '#9dc0a4', scatter: 0.5, scatterPow: 2.6, scatterHigh: 0.22, scatterFall: 2.2 },
    moon: { size: 2.8, intensity: 0.85, glow: 0.3, color: '#f1efe4', glowColor: '#dfe4dc' }, wrack: '#48505e', wrackFar: 0.35,
    clouds: { lit: '#cfd3d6', shade: '#566174', silver: 1.1, rim: '#ffe6c0' },
    light: '#e6e6e0', lightK: 3.1, ambient: '#747f9b', groundLight: '#3f4452', ambientK: 3.5, fog: '#3c475d', fogD: 0.00085, exposure: 1.3, fogLit: '#dfe3e8', fogShade: '#475064', mineGlow: '#b8401c', night: 1,
    ridge: '#2a303e', fill: [0.09, 0.1, 0.13], bank: 3.1 / 2.9, shade: 1.3, floor: [0.0372, 0.95], dull: 0.85, damp: 0.32, dampGlint: 2.9 / 3.1, coat: 0.45, rock: '#55534d', rockB: '#615f58', earth: 0.75, gravel: 0.87, gravelSky: 0, glint: 0.87, water: 2.9, board: 0.745, boardGlint: 2.9 / 3.1, stone: 0.82, yewHue: 0.5, sheet: 0.45 },
  golden: { sky: { preset: 'night', zenith: '#141c40', mid: '#3a3660', horizon: '#b0584a', ground: '#141224', stars: 0.4, milkyWay: 0.15, scatterColor: '#ff6a3a', scatter: 0.55, scatterPow: 4 }, moon: { size: 3.0, intensity: 0.9, glow: 0.42, color: '#ffe9d0' }, wrack: '#6a5a7c', wrackFar: 0.6,
    light: '#d8c4d0', lightK: 2.7, ambient: '#7a70b0', groundLight: '#40304a', ambientK: 2.3, fog: '#6a5078', fogD: 0.0009, exposure: 1.28, fogLit: '#f0dcdc', fogShade: '#5c4860', mineGlow: '#6a2810', night: 0.9 },
  day: { sky: { preset: 'overcast' }, moon: null, light: '#ece8e0', lightK: 2.0, ambient: '#aab6c6', groundLight: '#70726e', ambientK: 2.0, fog: '#a8b0b6', fogD: 0.0011, exposure: 1.0, fogLit: '#dde1e6', fogShade: '#6e7884', mineGlow: '#1c0a04', night: 0.25 },
  dawn: { sky: { preset: 'dawn' }, moon: { size: 2.6, intensity: 0.7, glow: 0.2 }, wrack: '#8a84a0', wrackFar: 0.85, dawn: true, light: '#ffd9a8', lightK: 2.6, ambient: '#8a90c0', groundLight: '#4a4050', ambientK: 2.3, fog: '#b89a8a', fogD: 0.0009, exposure: 1.12,
    fogLit: '#ffe6b8', fogShade: '#6a5a70', mineGlow: '#40180a', night: 0.6 },
};

export default {
  id: 'moor-under-the-fog-bank',
  name: 'The Moor Under the Fog Bank',
  category: 'books',
  placeKind: 'wilderness',
  book: 'The Hound of the Baskervilles',
  author: 'Arthur Conan Doyle, 1859 to 1930',
  media: ['air', 'open'],
  weirdness: 0.5,

  async build(ctx) {
    const seed = ctx.seed, vary = ctx.vary || { hour: 'any', rare: false, density: 1 }, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3), densC = Math.min(dens, 1);
    // (every stream is taken here, once, by its name: the list stands at the head of the file)
    const fk = takeStreams(seed);
    await ctx.yield();
    let P = null;
    for (const it = planPlacesSteps(seed, fk); ;) { const r = it.next(); if (r.done) { P = r.value; break; } await ctx.yield(); }
    await ctx.yield();
    for (const it = layLineSteps(P); !it.next().done;) await ctx.yield();
    await ctx.yield();
    liftLine(P);
    await ctx.yield();
    liftRoute(P);
    await ctx.yield();
    if (P.lifts) { liftLine(P); await ctx.yield(); liftRoute(P); }
    await ctx.yield();
    if (P.lifts) { liftLine(P); await ctx.yield(); liftRoute(P); }
    await ctx.yield();
    layPath(P);
    await ctx.yield();
    layStations(P);
    await ctx.yield();
    layPacing(P, fk);
    const path = P.path, L = P.L, S = P.S, land = P.land;
    await ctx.yield();
    const hourName = HOURS[vary.hour] ? vary.hour : 'night', H = HOURS[hourName], rare = !!vary.rare;
    const scene = new THREE.Scene(), disposables = [], updaters = [];
    const own = (x) => { disposables.push(x); return x; };
    const sheetK = (k) => Math.min(k, H.sheet ?? 1);

    // ---- the sky and its light: a full moon with its seas on it, in a soft halo, low in the west-south-west, stars, clouds, and
    // a wrack of thin cloud that drifts across the moon (below)
    const cloudCover = fk.clouds.range(0.2, 0.42), cloudSeed = fk.clouds.int ? fk.clouds.int(1, 999) : Math.floor(fk.clouds() * 999);
    // (the halo's width: the kit ends a body's light 1 + 4 widths out and never beyond 1.5 rad; the halo is kept so narrow that this end
    // falls within 1.25 rad of the moon, where the glow has died away, or the end shows as an edge across the sky)
    const haloW = H.moon ? Math.min(3.5, (1.25 / Math.sin(H.moon.size * Math.PI / 180) - 1) / 4) : 0;
    const moonBody = H.moon && { elevation: P.elDeg, azimuth: P.azDeg, size: H.moon.size, phase: 1, intensity: H.moon.intensity, color: H.moon.color ?? '#eef2ff', color2: H.clouds ? '#6f7178' : '#7f87a0', texture: 0.9, dark: 0.03, glow: H.moon.glow, glowColor: H.moon.glowColor ?? '#b9c8e6',
      glowSize: haloW, horizonFade: 0.5, seed: 3 };
    // (THE SKY'S CLOUDS ARE THE KIT'S: one layer of cloud laid on a shell over the sky's dome. Round 9, B5: low in the sky the
    // kit's shell lies far off and its clouds are drawn out flat into streaks, and their edges were hard and ragged. Two of
    // the kit's own measures are handed other values for that: cloudCurve 9 (it was 20: the shell bends down sooner, so a
    // cloud low in the sky is 4 times as far as one overhead, not 6) and the clouds' softness 0.58 (it was 0.46).)
    const HC = H.clouds ?? { lit: '#a9b9e2', shade: '#26345c', silver: 0.55 };
    const skyOpts = { rng: fk.sky, ...H.sky, bake: true, renderer: ctx.renderer, lightColor: H.light, lightIntensity: H.lightK, ambientColor: H.ambient, groundLight: H.groundLight, ambientIntensity: H.ambientK, lightElevationMin: 12, cloudCurve: 9 };
    if (hourName === 'day') Object.assign(skyOpts, { sunElevation: P.elDeg, sunAzimuth: P.azDeg });
    else if (H.dawn) Object.assign(skyOpts, { sunElevation: 7, sunAzimuth: P.azDeg - 180, bodies: [moonBody] });
    else Object.assign(skyOpts, { bodies: [moonBody], key: 0,
      ...(HC.rim ? { cloudLightColor: HC.rim } : {}),
      clouds: { coverage: cloudCover, softness: 0.58, scale: 0.8, lit: HC.lit, shade: HC.shade, opacity: 0.8, silver: HC.silver, absorb: 1.0, haze: 0.6, wind: [0.016, 0.006], seed: cloudSeed } });
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    // THE WRACK ACROSS THE MOON (WRACK_FRAG, above): a patch of the sky about the moon's place, 96 degrees long and 30 deep, laid
    // on the sky's own directions (the moon's, the way along its height, the way up across it). One mesh, 192 triangles, drawn
    // after the sky's dome and before every thing of the land's air (its order is under theirs). uWrack: its drift (the noise's
    // own units a second: about a third of a degree of sky a second, some five of the moon's breadths in the flight), how much
    // of the band is cloud, the moon's own spread of light on it (radians squared) and its opacity. By day there is no moon
    // and no wrack: the day's sky is the kit's overcast.
    let wrack = null;
    if (H.moon) { const Mv = P.M.clone().normalize(), Rv = new THREE.Vector3().crossVectors(Mv, new THREE.Vector3(0, 1, 0)).normalize(), Uv = new THREE.Vector3().crossVectors(Rv, Mv).normalize();
      const NX = 16, NY = 6, pos = [], idx = [];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const x = lerp(-0.95, 0.95, i / NX), y = lerp(-0.24, 0.3, j / NY), d = Mv.clone().addScaledVector(Rv, x).addScaledVector(Uv, y).normalize(); pos.push(d.x, d.y, d.z); }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      const geo = own(new THREE.BufferGeometry()); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      const moonSpread = Math.pow(H.moon.size * DEG * 2.2, 2);
      const mat = own(new THREE.ShaderMaterial({ vertexShader: WRACK_VERT, fragmentShader: WRACK_FRAG, transparent: true, depthWrite: false, depthTest: true, fog: false, toneMapped: false, side: THREE.DoubleSide,
        uniforms: { uMoon: { value: Mv }, uRight: { value: Rv }, uUp: { value: Uv }, uTime: { value: 0 }, uWrack: { value: new THREE.Vector4(0.02, 0.46, moonSpread, 0.8) },
          uLit: { value: new THREE.Color(H.moon.color ?? '#eef2ff') }, uDark: { value: new THREE.Color(H.wrack ?? '#48505e') }, uFar: { value: H.wrackFar ?? 0.35 } } }));
      wrack = new THREE.Mesh(geo, mat); wrack.frustumCulled = false; wrack.renderOrder = -0.5; wrack.name = 'the wrack across the moon'; scene.add(wrack);
      updaters.push((dt, time) => { mat.uniforms.uTime.value = time; }); }
    await ctx.yield();
    // (THE AIR IS ONE FOR THE WHOLE VISIT: the hour's own colour and density, set here once and never changed in update())
    scene.fog = new THREE.FogExp2(new THREE.Color(H.fog), H.fogD);
    const rig = makeLightRig(sky, { shadow: true, shadowSize: 2048, shadowRange: 140, distance: 420 }); scene.add(rig.object);
    const sunDir = sky.lightDirection.clone();
    await ctx.yield();

    // ---- the land
    const C = (hex, k = 1) => mul(lin(hex), k);
    const pal = { moor: C('#4d5644'), moorB: C('#666a55'), bracken: C('#7a5530'), heather: C('#3a2a33'), pale: C('#b5ab82'), moss: C('#4d6a2c'), lawn: C('#33443a'), gravel: C('#918b7d', 0.5), bank: C('#3f4838'), bed: C('#2a3034'), granite: C('#4a5560', 1.25),
      mireRim: C('#55603a'), mire: C('#878266'), mireB: C('#6e7250'), wet: C('#2c2719'), pool: C('#151a18'), peat: C('#30281f'), firm: C('#4b4034'), spoil: C('#6a6258'), cutFloor: C('#4a443e'), track: C('#a39a86') };
    const groundRGB = makeGround(P, pal), gTmp = [0, 0, 0];
    await ctx.yield();
    const xs = P.ctrl.map((q) => q[0]), zs = P.ctrl.map((q) => q[2]);
    // (the land is drawn 400 m out to the west and north, where the journey looks, and 280 m behind it: the far hills are the kit's ridges)
    const bounds = [Math.min(...xs) - 400, Math.min(...zs) - 400, Math.max(...xs) + 280, Math.max(...zs) + 280];
    // (WHAT STRETCHED THE GROUND ALONG THE FLIGHT: the kit's near layer of tufts is laid 2.1 times longer along z than across it,
    // and the avenue, the drive and the yew walk all run along z; that layer is off (tufts: 0) for the whole ground. In its place
    // the ground has the kit's two layers of mottle that have no axis (patch: a tile of 123 m and one of 16 m, bent by each
    // other), its grain and its pebbles; the tufts are the plants that stand on it.)
    // POLISH 1, STAGE A: WHAT STAINED THE OPEN GROUND. The kit tilts the ground's normal by its noise and lights the tilted
    // normal: its mid layer, whose longer waves are 4, 2 and 1 m, and its fine layer, two feet and one (the shorter, 0.5 and
    // 0.26 m and 17, 8 and 4 cm, carry as much of the tilt where a pixel holds them). `bump` is how far, and it was never set
    // here: the kit's own 0.8, three times that within 5 m of the eye. Under this moon, 19.5 to 23 degrees up, the tilt turned
    // a sixth to two fifths of the flat ground in the two bands nearest the eye (3 to 8 and 8 to 15 m from it; four places of
    // two seeds) from the moon, under a quarter of its light, and a twentieth to a tenth of it out to 30 m; of ALL the flat
    // dry ground within 15 m, by area, an eighth to a quarter (the reader's count, twelve seeds); and a tenth to a quarter of
    // the near bands took nearly double: soft dark and pale stains with no relief under them, each 4 to 20 times wider than
    // deep from an eye 2.4 m up. THE BUMP IS SET BY THE HEIGHT OF THE HOUR'S OWN LIGHT: the most the kit's two layers can
    // tilt the normal near the eye along one axis of the noise (2.25 times the bump) is the tangent of the height of the one
    // directional light as the sky hands it to the rig (sunDir, after the kit's floor of 12 degrees). At night, at golden
    // hour and by day that light stands at the moon's own place; at dawn it is the sun on the opposite bearing, 12 degrees
    // up, lower than the moon (mending 1: the bump read the plan's moon at every hour, and at dawn the layers could still
    // turn flat ground from the light). So the rule holds at every hour. Counted at four places of two seeds at night: the
    // dry ground under a quarter of the moon's light is then 0 to 3 in a hundred within 15 m of the lens and none beyond
    // (the tussock heads' own shaded sides: 0 to 2 with the kit's two layers out altogether). WHAT ELSE RODE ON THE BUMP: the
    // kit's small stones (its near layer) keep their colour and lose their light and shade on dry ground to about a fifth;
    // on wet ground the hook keeps them. TWO THINGS OF THE GROUND ARE KEPT AS THEY WERE, each by one measure in the
    // ground's own lines: the tussock heads' light, the world's, which goes through the same strength (in GROUND_GLSL it is
    // 0.4 over the bump now, was .5 under 0.8); and THE WET GROUND'S BROKEN GLINT (the firm way's wet patches, the hags and
    // their rims): by as much as a place is wet the kit's layers tilt its normal as they did (in the hook, at the kit's own
    // line of the tilt): all of live's tilt where the wet is whole, about nine tenths on the hags' rims and six tenths on
    // the hags' black peat. Without that the moon's glint on a wet patch near the lens gathered into one white pool: 13
    // times the near-white pixels in one frame of eight. (The text of the ground's lines is the same on every seed, as
    // before.)
    const GROUND_BUMP = sunDir.y / Math.hypot(sunDir.x, sunDir.z) / 2.25;
    const terrain = await T.makeTerrainAsync({ rng: fk.terrain, noise: P.noise, path, height: land, corridor: false, bounds, cell: 3.5, near: 30, levels: 5, maxTriangles: Math.round(52000 * (0.7 + 0.3 * detail)), biome: 'meadow',
      palette: { rock: H.rock ?? '#4a5560', rockB: H.rockB ?? '#59636e', clouds: 0.14, cloudSize: 900, cloudSpeed: 14, snow: 0, tufts: 0, ripples: 0, pebbles: 0.15, cracks: 0.05, patch: '#c6c0ae', patchAmount: 0.18, detail: 0.6, bump: GROUND_BUMP, streaks: 0, scale: 1.4 }, color: (x, z, h, ny, out) => { groundRGB(x, z, h, ny, gTmp); return out.setRGB(gTmp[0], gTmp[1], gTmp[2]); },
      sunDir, skirt: 30, receiveShadow: true }, ctx.yield);
    // (POLISH 1, MENDING 1: the kit's bounce on the ground is the kit's own again, at every hour; the night's lift of ground in
    // shade is the ground hook's own term, uMoorShade below. The bare rock's two colours are the hour's where it has them.)
    await ctx.yield();
    scene.add(terrain.object);
    const groundY = (x, z) => terrain.surfaceAt(x, z);
    // ---- THE GROUND CLOSE TO. Why it was a wash under the eye (found in round 6): the kit's ground is soft noise whose strong
    // waves are one and two feet long, read with anisotropy 2, with nothing crisp at a hand's scale; and the gravel's colour was
    // carried by the land's corners, 3.5 m apart. (The engine has no blur of speed.) THE MEND is a hook of
    // the world's own on the terrain's material (the kit's own compile is kept whole and called first; the program has a key of
    // its own). By the PLACE of every pixel of the ground it paints:
    //  - THE GRAVEL of the drive, the forecourt, the garden's paths and the yew walk, to the pixel, its edge ragged with grass,
    //    in small stones; the drive's two wheel ruts and its trodden middle;
    //  - THE LAWN's blades; THE MOOR's and THE MIRE's longer grass, and tussock heads whose moonward side is pale and whose
    //    other side lies in shade;
    //  - THE FIRM WAY's dried peat in cracked plates with stones trodden into it, and wet patches that are darker and smooth
    //    (they take the moon's glint as wet ground does);
    //  - THE SHADOWS OF THE TOR'S PILES down the hill, from the moon's own direction (each pile a round of its radius and
    //    height: a place of the ground is shaded where the ray from it to the moon passes through one);
    //  - THE LAMPS' POOLS on the ground of the park (each lamp's place, reach and strength: warm light on what lies there).
    // SAMPLING (round 7, said as it is): the hook reads ONE thing that depends on where the eye is, a pixel's footprint on the ground
    // (the screen's derivatives of the place), and uses it for two filters, each going to ITS OWN MEAN: the gravel's edge is spread
    // over the footprint (a pixel across the edge holds its share of gravel), and the tussock heads' height, shade and lit side
    // go to their means over the grain where a pixel no longer holds a head (uMoorTus: the two means counted on the grain's
    // texture here, with the moon's own shift). The grain itself is blended to its mean by the texture's own mips in the same
    // way. Nothing else of the eye is read, nor the clock, a seed or the metres flown.
    const NPILE = 26, WAYMAP_M = 12, grainIt = grainSteps(fk.grain);
    let grain = null; for (;;) { const r = grainIt.next(); if (r.done) { grain = r.value; break; } await ctx.yield(); }
    own(grain.tex);
    // (POLISH 1, STAGE C1, THE DAWN'S BEARING: the ground's own light and shade go by the hour's one directional light, sunDir,
    // as the bump does: the tussock heads' lit side and tilt, the tor's piles' painted shade (uMoorMoon: its bearing and the
    // tangent of its height) and the heads' two means below. They read the plan's moon, and at dawn the heads leaned to the
    // moon and the piles' shade lay from it while the light came from the other side. At night, at golden hour and by day
    // the light stands at the moon's own place and nothing of this changes.)
    const tanMoon = sunDir.y / Math.hypot(sunDir.x, sunDir.z);
    // (POLISH 1, MENDING 1: THE LIFT OF GROUND IN SHADE, uMoorShade. rgb: what is wanting from the sky's fill on a slope (0.9 of
    // the fill's sky colour) to an even grey of H.shade in every channel, so that shaded ground has its own colour and not
    // the fill's blue; w: the take of the moon at which the lift is out, 0.8 of what flat open ground takes (the moon's
    // height). An hour without `shade` has none: its term is nought.)
    const moorShade = new THREE.Vector4(0, 0, 0, 1);
    if (H.shade) { const A = new THREE.Color(H.ambient).multiplyScalar(H.ambientK * 0.9); moorShade.set(Math.max(0, H.shade - A.r), Math.max(0, H.shade - A.g), Math.max(0, H.shade - A.b), 0.8 * sunDir.y); }
    // (POLISH 1, MENDING 2: SHADE UNDER THE NIGHT'S SKY HAS LITTLE COLOUR, uMoorDull. A slope the moon does not reach stood in
    // the ground's whole colour under the even grey of the lift, at the picture's toe, where the post draws a small
    // difference of hue large: a green and rust hill under a night sky, more coloured than the moonlit land before it.
    // w: how far the light such ground gives back is drawn to ITS OWN GREY (H.dull, by as much as the place is in shade);
    // rgb: that grey's tint, the moon's own colour as the lit land has it, its brightness taken out. An hour without
    // `dull` has (1, 1, 1, 0) and nothing is drawn anywhere.)
    const moorDull = new THREE.Vector4(1, 1, 1, 0);
    if (H.dull) { const M = new THREE.Color(H.light), ml = 0.2126 * M.r + 0.7152 * M.g + 0.0722 * M.b; moorDull.set(M.r / ml, M.g / ml, M.b / ml, H.dull); }
    // (POLISH 1, STAGE C2 MENDING 1: THE SKY THAT THE HAGS' POOLS MIRROR, read from the kit's own sky as the hour has built it
    // (its uniforms and options; nothing of the kit is changed), once, here. POOL_SKY: `low` the height at which the low
    // sky's tone is taken (its tangent: 5 degrees: the picture's low sky stands at 86 to 94 at night, the kit's clear sky
    // there at 95); `grey` how far that tone is drawn to its own grey; `night` and `day` the mirror's whole strength at
    // night and by day and `fall` and `fallDay` the power of its fall by the look's angle, between them by the hour's own
    // `night` (by day what stood, so that the day's pools stay as they were: 0.62 of the low sky is the 0.7 of the
    // horizon's tone that stood); `ripple` the slow ripple's slope figure (0.8: slopes of 4.5 degrees in the mean);
    // `lobe` the sine of the lobe the fine ripple draws the moon's own mirror out into (12 degrees); `moon` the lobe's
    // middle over the hour's light, colour times strength, where the moon is the hour's light (night and golden hour:
    // at night 0.44 of the disc's own tone: under the disc as drawn); at dawn, where the light is the sun's and the
    // moon a pale disc, the lobe holds only the disc's own light spread over it. By day there is no moon.)
    const POOL_SKY = { low: 0.09, grey: 0.5, night: 0.93, day: 0.62, fall: 0.25, fallDay: 4, ripple: 0.8, lobe: 0.21, moon: 0.13 };
    const poolSkyU = (() => { const SU = sky.uniforms, SO = sky.options, K = POOL_SKY, inv = 1 - K.low / Math.hypot(1, K.low), nt = smoothstep(0.25, 0.9, H.night), B = H.moon ? SU.uBodyDir.value[0] : null;
      const grey = (c) => { const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; return c.lerp(new THREE.Color(l, l, l), K.grey); };
      const low = grey(SU.uZenith.value.clone().lerp(SU.uMid.value, Math.pow(inv, SO.midPow)).lerp(SU.uHorizon.value, Math.pow(inv, SO.horizonPow))), sc = grey(SU.uScatterColor.value.clone()), L = new THREE.Color(H.light).multiplyScalar(H.lightK * K.moon);
      return { uMoorPlA: { value: new THREE.Vector4(low.r, low.g, low.b, K.low) }, uMoorPlS: { value: new THREE.Vector4(sc.r, sc.g, sc.b, SO.scatter * (SO.scatterHigh + (1 - SO.scatterHigh) * Math.pow(inv, SO.scatterFall))) },
        uMoorPlSun: { value: new THREE.Vector4(SU.uSunDir.value.x, SU.uSunDir.value.y, SU.uSunDir.value.z, SO.scatterPow) },
        uMoorPlMoon: { value: B ? B.clone() : new THREE.Vector4(0, 1, 0, 0.05) },
        uMoorPlGlow: { value: B ? SU.uBodyGlow.value[0].clone().setW(B.w * SU.uBodyGlow.value[0].w) : new THREE.Vector4(0, 0, 0, 1) },
        uMoorPlDisc: { value: !B ? new THREE.Vector4(0, 0, 0, 0) : H.dawn ? SU.uBodyColor.value[0].clone().multiplyScalar(B.w * B.w / (K.lobe * K.lobe)).setW(SU.uBodyRingColor.value[0].w) : new THREE.Vector4(L.r, L.g, L.b, SU.uBodyRingColor.value[0].w) },
        uMoorPl: { value: new THREE.Vector4(lerp(K.day, K.night, nt), lerp(K.fallDay, K.fall, nt), K.ripple, K.lobe) } }; })();
    const groundU = { tMoorGrain: { value: grain.tex }, uMoorMean: { value: new THREE.Vector4(...grain.mean) }, uMoorTus: { value: new THREE.Vector2(0, 0) }, uMoorHeath: { value: new THREE.Vector3(0, 0, 0) }, uMoorHeathA: { value: new THREE.Color('#3b2f36') }, uMoorHeathB: { value: new THREE.Color('#5c5c4c') }, uMoorHeadC: { value: new THREE.Color('#8a8468') }, uMoorGravel: { value: new THREE.Color().setRGB(...pal.gravel).multiplyScalar(H.gravel ?? 1) },
      uMoorMireA: { value: new THREE.Vector4(P.I[0], P.I[1], P.w[0], P.w[1]) }, uMoorMireB: { value: new THREE.Vector4(P.Cm[0], P.Cm[1], 1 / P.mireA, 1 / P.mireB) },
      tMoorWay: { value: null }, uMoorWayA: { value: new THREE.Vector4(0, 0, 1, 1) }, uMoorEarth: { value: new THREE.Color().setRGB(...pal.track).multiplyScalar(H.earth ?? 1) }, uMoorMoon: { value: new THREE.Vector3(sunDir.x, sunDir.z, tanMoon) },
      uMoorTor: { value: new THREE.Vector3(P.F.x, P.F.z, 0) }, uMoorPiles: { value: Array.from({ length: NPILE }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uMoorSkyG: { value: new THREE.Color(H.ambient).multiplyScalar(H.gravelSky ?? (H.moon ? 0.5 : 0.1)) }, uMoorGlint: { value: H.glint ?? 1 }, uMoorLampG: { value: 1 / (H.gravel ?? 1) }, uMoorShade: { value: moorShade }, uMoorFloor: { value: new THREE.Vector2(...(H.floor ?? [0, 0])) }, uMoorDull: { value: moorDull }, uMoorDampK: { value: new THREE.Vector2(H.damp ?? 0, 1 - (H.dampGlint ?? 1)) }, uMoorWetC: { value: new THREE.Vector3(...pal.wet) }, uMoorPoolC: { value: new THREE.Vector3(...pal.pool) },
      // (polish 1, stage C2b and its mending 1: the sky in the hags' pools: poolSkyU, above; it took the place of the one flat
      // tone, uMoorPoolA, the horizon's colour at 0.7 drawn 0.65 to its grey)
      ...poolSkyU };
    await ctx.yield();
    // THE OLD WAY'S MAP, for the ground's own lines: a texture over the way's bounds; each texel holds the metres (over WAYMAP_M) from
    // the sunken lane and the moor track (r), from the miners' path (g), from the wand path (b), and outside the nearest firm
    // island or the yard's apron (a). It is written along the way itself, metre by metre, into the texels within WAYMAP_M
    // metres of each; the texture's own mips take it to its mean far off.
    { const wy = P.way, at = P.at, WX = 512, WZ = 1024; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let i = 0; i <= wy.n; i++) { x0 = Math.min(x0, wy.x[i]); x1 = Math.max(x1, wy.x[i]); z0 = Math.min(z0, wy.z[i]); z1 = Math.max(z1, wy.z[i]); }
      x0 -= WAYMAP_M + 6; z0 -= WAYMAP_M + 6; x1 += WAYMAP_M + 6; z1 += WAYMAP_M + 6;
      const sx = (x1 - x0) / WX, sz = (z1 - z0) / WZ, data = new Uint8Array(WX * WZ * 4).fill(255);
      // (a round thing written into one channel: the metres outside the radius r about x, z)
      const put = (ch, x, z, r) => { const i0 = Math.max(0, Math.floor((x - r - WAYMAP_M - x0) / sx)), i1 = Math.min(WX - 1, Math.ceil((x + r + WAYMAP_M - x0) / sx)), j0 = Math.max(0, Math.floor((z - r - WAYMAP_M - z0) / sz)), j1 = Math.min(WZ - 1, Math.ceil((z + r + WAYMAP_M - z0) / sz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = x0 + (i + 0.5) * sx - x, dz = z0 + (j + 0.5) * sz - z, v = Math.round(clamp((Math.sqrt(dx * dx + dz * dz) - r) / WAYMAP_M, 0, 1) * 255), k = (j * WX + i) * 4 + ch; if (v < data[k]) data[k] = v; } };
      for (let i = 0; i <= wy.n; i++) { put(i < at.ME ? 0 : 2, wy.x[i], wy.z[i], 0); if (i > at.I - APRON_M) put(3, wy.x[i], wy.z[i], 2.6); if (i % 100 === 99) await ctx.yield(); }
      for (const q of P.isles) put(3, q[0], q[1], q[2] - 1);
      const tex = own(new THREE.DataTexture(data, WX, WZ, THREE.RGBAFormat, THREE.UnsignedByteType));
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
      groundU.tMoorWay.value = tex; groundU.uMoorWayA.value.set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)); }
    await ctx.yield();
    // (the tussock heads' two means, counted on the grain's texture: the shade's and the lit side's, between each texel's height and
    // the height 0.3 m toward the moon, the shift taken to the nearest texel as the shader's own rotation lays it)
    { const d = grain.tex.image.data, N = grain.tex.image.width, mhx = sunDir.x / Math.hypot(sunDir.x, sunDir.z), mhz = sunDir.z / Math.hypot(sunDir.x, sunDir.z), sx = Math.round((0.28 * mhx - 0.96 * mhz) * 0.3 * 0.137 * N), sy = Math.round((0.96 * mhx + 0.28 * mhz) * 0.3 * 0.137 * N);
      let a = 0, b = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = (d[(((y + sy + N) % N) * N + ((x + sx + N) % N)) * 4 + 3] - d[(y * N + x) * 4 + 3]) / 255; a += smoothstep(0.06, 0.3, v); b += smoothstep(0.04, 0.25, -v); }
      groundU.uMoorTus.value.set(a / (N * N), b / (N * N));
      await ctx.yield();
      // (and the heather's two tones' shares and the pale heads' share, counted on the same texture by the shader's own measures)
      let hA = 0, hB = 0, hd = 0;
      for (let i = 0; i < N * N * 4; i += 4) { const r = d[i] / 255, g = d[i + 1] / 255, sA = smoothstep(0.58, 0.66, r); hA += sA; hB += smoothstep(0.3, 0.38, r) * (1 - sA); hd += smoothstep(0.8, 0.92, g); }
      groundU.uMoorHeath.value.set(hA / (N * N), hB / (N * N), hd / (N * N)); }
    await ctx.yield();
    // (the piles that shade the hill are written into this as they are built)
    const groundPiles = [];
    const pilePut = (x, z, r, top) => { if (groundPiles.length < NPILE) { groundU.uMoorPiles.value[groundPiles.length].set(x, z, r, top); groundPiles.push([x, z, r, top]); } };
    { const fx3 = (v) => v.toFixed(3), kitCompile = terrain.material.onBeforeCompile, zfG = HALL.zFront, zg0G = zfG - HALL.depth - 5, zg1G = ALLEY.z0 + 3;
      const PARS = `
        uniform sampler2D tMoorGrain; uniform vec2 uMoorTus; uniform sampler2D tMoorWay; uniform vec4 uMoorMean, uMoorMireA, uMoorMireB, uMoorWayA; uniform vec3 uMoorGravel, uMoorEarth, uMoorMoon, uMoorTor, uMoorWetC, uMoorPoolC, uMoorSkyG, uMoorHeath, uMoorHeathA, uMoorHeathB, uMoorHeadC;
        uniform vec4 uMoorPiles[${NPILE}]; uniform float uMoorGlint, uMoorLampG; uniform vec2 uMoorDampK, uMoorFloor; uniform vec4 uMoorShade, uMoorDull, uMoorPlA, uMoorPlS, uMoorPlSun, uMoorPlMoon, uMoorPlGlow, uMoorPlDisc, uMoorPl;
        float gMoorFloor = 0., gMoorShade = 0., gMoorOpen = 1., gMoorDamp = 0., gMoorPool = 0., gMoorPoolH = 0.; vec3 gMoorPoolN = vec3(0., 1., 0.);
        float moorH2(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
        float moorN2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(moorH2(i), moorH2(i + vec2(1., 0.)), f.x), mix(moorH2(i + vec2(0., 1.)), moorH2(i + vec2(1., 1.)), f.x), f.y); }`;
      const BODY = GROUND_GLSL.replace(/K_NPILE/g, String(NPILE)).replace(/K_WAYM/g, fx3(WAYMAP_M)).replace(/K_ZF/g, fx3(zfG)).replace(/K_ZG0/g, fx3(zg0G)).replace(/K_ZG1/g, fx3(zg1G)).replace(/K_ZGC/g, fx3((zg0G + zg1G) / 2))
        .replace(/K_GHALF/g, fx3(GARDEN_HALF)).replace(/K_AZ0/g, fx3(ALLEY.z0)).replace(/K_AZ1/g, fx3(ALLEY.z1)).replace(/K_ISLER/g, fx3(P.ISLE_R)).replace(/K_POOLY/g, fx3(P.MIRE_Y - POOL_DOWN)).replace(/K_PZ0/g, fx3(ALLEY.z1 + 2));
      const A1 = '  diffuseColor.rgb = c;\n  gTSnow = sn; gTWet = wet;', A2 = '* (1. - .7 * sn);', A3 = 'reflectedLight.directDiffuse *= tsun;', A4 = '(viewMatrix * vec4(gTGrad, 0.)).xyz);', A5 = 'roughnessFactor = mix(roughnessFactor, .32, gTSpark);', A6 = 'reflectedLight.indirectDiffuse *= tamb; reflectedLight.indirectSpecular *= tamb; }';
      // (POLISH 1, STAGE C3 MENDING 1, H2: THE DARKEST LAND'S FLOOR, laid on AFTER the kit's own baked shade of the fill (A6: the
      // kit's last line of its shade), which took the lift again on the climb's near slope: where gMoorFloor holds, what
      // the ground gives back of all its light (the moon's, the fill's and the lift, the lamps' and its own glow) is raised
      // toward uMoorFloor.x by uMoorFloor.y of what it lacks, in the shade's own grey tint (uMoorDull.rgb); ground that
      // gives back more than the floor is not touched. An hour without `floor` has (0, 0): nothing anywhere.)
      const MOOR_FLOOR = '\n  reflectedLight.indirectDiffuse += uMoorDull.rgb * (uMoorFloor.y * gMoorFloor * max(0., uMoorFloor.x - dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance, vec3(.2126, .7152, .0722))));';
      // (POLISH 1, MENDING 1: THE LIFT OF GROUND IN SHADE. moorTook: how much of the moon a place of the ground takes: the
      // kit's baked shade with the piles' own (tsun), its turn to the moon, and the shadow map's word (what three left of the
      // moon's colour after its shadow); the lift is whole where that is nought and out at uMoorShade.w; by the ground's own colour)
      // (MENDING 2: moorIn is how far a place is in that shade; by it the light the ground gives back of the sky and the lift
      // is drawn to its own grey in the moon's tint, uMoorDull, and the ground's colour with it for the kit's bounce, which
      // follows; nothing else reads the colour after this line)
      // (LAST STAGE MENDING 2: THE SHADOW'S WORD IS TAKEN OF directLight.color AS THE ENGINE'S LOOPS OVER THE LIGHTS LEAVE IT:
      // the directional lights' loop is the last to write it, so it holds the LAST directional light's colour after that
      // light's shadow, and it is weighed here against the FIRST's (directionalLights[0]). That is right while the place
      // has ONE directional light, as it has at every hour (the hour's one light); with a second the word would be the
      // last light's and this line would have to take its own.)
      const MOOR_SHADE = '\n#if NUM_DIR_LIGHTS > 0\n    { float moorTook = tsun * saturate(dot(geometryNormal, directionalLights[0].direction)) * (directLight.color.g / max(directionalLights[0].color.g, 1e-4));\n      float moorIn = gMoorOpen * (1. - smoothstep(0., uMoorShade.w, moorTook)); const vec3 moorLum = vec3(.2126, .7152, .0722);\n      reflectedLight.indirectDiffuse += diffuseColor.rgb * uMoorShade.rgb * (RECIPROCAL_PI * moorIn);\n      reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, uMoorDull.rgb * dot(reflectedLight.indirectDiffuse, moorLum), uMoorDull.w * moorIn);\n      diffuseColor.rgb = mix(diffuseColor.rgb, uMoorDull.rgb * dot(diffuseColor.rgb, moorLum), uMoorDull.w * moorIn); }\n#endif\n   ';
      terrain.material.onBeforeCompile = (sh, r) => {
        kitCompile.call(terrain.material, sh, r); Object.assign(sh.uniforms, groundU, plU);
        const f = sh.fragmentShader;
        // (LAST STAGE MENDING 2: EVERY ANCHOR THIS HOOK REPLACES STANDS IN ITS GUARD, A6 with the five: a changed line of the kit's warns)
        if (!f.includes(A1) || !f.includes(A2) || !f.includes(A3) || !f.includes(A4) || !f.includes(A5) || !f.includes(A6)) { console.warn('moor-under-the-fog-bank: the ground\'s hook finds no place in the kit\'s shader; the ground is the kit\'s alone'); return; }
        sh.fragmentShader = f.replace('#include <common>', '#include <common>\n' + PARS + PL_PARS).replace(A1, BODY + '\n  diffuseColor.rgb = c;\n  gTSnow = sn; gTWet = max(wet, moorWet);')
          .replace(A2, A2 + ' gTGrad += moorBump + (gMid + gFine + gNear) * (moorWet * (.8 / uTDetail.y - 1.));').replace(A3, 'tsun *= 1. - gMoorShade; ' + A3 + ' reflectedLight.directSpecular *= mix(1., uMoorGlint, smoothstep(0., .4, gTWet)) * (1. - uMoorDampK.y * gMoorDamp * (1. - smoothstep(0., .4, gTWet))) * (1. - gMoorPoolH);' + MOOR_SHADE)
          // (stage C2b: on a hag's pool the light takes the pool's level face, gMoorPoolN, in place of the land's normal and its grain;
          // the face's smoothness is a pond's with a breath of wind on it (0.5). MENDING 1: the gloss's own mirror of the
          // lights on a pool, above, is taken off whole (it was held at 0.135): the pool's mirror of the sky and the moon is
          // the ground's own line now (the pool's block in the ground's lines), by the eye's ray thrown back;
          // gMoorPoolH: whole from a quarter of a pool, since a pool's edge is already level and smooth)
          .replace(A6, A6 + MOOR_FLOOR)
          .replace(A4, A4 + ' normal = normalize(mix(normal, (viewMatrix * vec4(gMoorPoolN, 0.)).xyz, gMoorPool));').replace(A5, A5 + ' roughnessFactor = mix(roughnessFactor, .5, gMoorPool);');
      };
      terrain.material.customProgramCacheKey = () => 'kit-terrain2-terrain-moor-ground-16'; }
    scene.userData.ground = { piles: groundPiles, grainMean: grain.mean };
    // ---- THE PLACE'S LIGHTS (round 8: THE NIGHT HAS THREE LIGHTS AND THE HOUND'S). A light is a thing of the place: a lamp, a
    // lit window, a fire. Each is written here ONCE, where its lantern or its window is built, as its place, its reach
    // (metres: its light is whole at the lamp and nothing at its reach, by the square of the square) and its colour; and every
    // lit thing that stands within its reach takes that light by its own place and the way its face looks: the ground, what
    // is built, the granite, the yew, the oaks' trunks and leaves, the wands, the tussocks. The same from every eye, at every
    // hour of the clock. GOLD at the hall (lamps and windows), one gold window on the moor, RED at the mine. The hound's
    // fire is the fourth: one light that runs with the hound (its place is the hound's own, by the world's clock).
    // (NPL: THE LIST HOLDS WHAT THE PLACE CAN ASK ON ANY SEED: every plPut call below at the most its loop or its chance can give,
    // added up from the calls' own laws: the lodge 2; the hall's front 4 (a window by its draw); the garden front 8 (two to
    // each of four windows, by their draws) and its door 3; the roof's lantern 2; the wings 6 (by their draws); the door's
    // lamps 2 and the porch 1; the forecourt 2; the stable gate 1; the basin's lamp and the garden's two 3; the wicket 2; the
    // yew walk 6; the summer house 2; the avenue 6; the lane's gate 1; the peat fire 1; the cottage 2; the tor's gate 1; the
    // pass 1; the bridge 2; the yard's hut 2; the boards' lanterns 5 (one to a firm island: the wand path is under 260 m by
    // LAND.basin, the first island 26 m and more along it, the next 40 m and more on, none in its last 52 m): 65. A NEW plPut
    // CALL IS ADDED TO THIS SUM. A full list is never passed over in silence: plPut throws. An entry that is not asked keeps
    // its far place under the land and its reach of a metre, and the shader's loop passes it over. Counted by the plan on
    // seeds 1 to 3000: 55 to 65 are asked, 65 on three of them.)
    const NPL = 65, PL_K = 0.6, GOLD = '#ffae5c', RED = '#ff4a1c', EMBERL = '#ff7a36';
    const plU = { uMoorPL: { value: Array.from({ length: NPL }, () => new THREE.Vector4(0, -9999, 0, 1)) }, uMoorPLC: { value: Array.from({ length: NPL }, () => new THREE.Vector3(0, 0, 0)) },
      uMoorHoundL: { value: new THREE.Vector4(0, -9999, 0, 0) }, uMoorHoundC: { value: new THREE.Color(HOUND_FIRE) } };
    const placeLights = [], plC = new THREE.Color();
    const plPut = (x, y, z, r, hex, k = 1) => { const i = placeLights.length; if (i >= NPL) throw new Error('moor-under-the-fog-bank: the place\'s lights list is full: light ' + (i + 1) + ' is asked and the list holds ' + NPL + ' (NPL)'); plC.set(hex).multiplyScalar(k * PL_K * H.night); plU.uMoorPL.value[i].set(x, y, z, r); plU.uMoorPLC.value[i].set(plC.r, plC.g, plC.b); placeLights.push([x, y, z, r, hex, k]); };
    scene.userData.placeLights = placeLights;
    // (the law, in every material that takes it: p the place, n the way the face looks (the world's axes), soft how little the
    // face's turn matters (1: a thing of leaves, lit from any side))
    const PL_PARS = `
      uniform vec4 uMoorPL[${NPL}]; uniform vec3 uMoorPLC[${NPL}]; uniform vec4 uMoorHoundL; uniform vec3 uMoorHoundC;
      vec3 moorLamps(vec3 p, vec3 n, float soft) {
        vec3 lit = vec3(0.0);
        for (int i = 0; i < ${NPL}; i++) { vec4 q = uMoorPL[i]; vec3 d = q.xyz - p; float d2 = dot(d, d), r2 = q.w * q.w; if (d2 >= r2) continue;
          float f = 1.0 - d2 / r2; lit += uMoorPLC[i] * (f * f * mix(clamp(dot(n, d) * inversesqrt(d2 + 0.01), 0.0, 1.0), 1.0, soft)); }
        vec3 dh = uMoorHoundL.xyz - p; float h2 = dot(dh, dh);
        if (h2 < 1600.0) { float fh = 1.0 - h2 / 1600.0; lit += uMoorHoundC * (uMoorHoundL.w * fh * fh * fh * mix(clamp(dot(n, dh) * inversesqrt(h2 + 0.01), 0.0, 1.0), 1.0, soft)); }
        return lit; }`;
    // (a material takes the lights: its own compile, the kit's where it has one, is kept whole and called first; the lights are
    // added to what the thing gives back of its own colour. world: the name of the shader's own varying of the world's place,
    // where it has one; without it the hook carries the place itself. A shader in which the hook finds no place is left as it is.)
    const lampsOn = (mat, name, o = {}) => {
      const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey, soft = (o.soft ?? 0.25).toFixed(2), E = '#include <emissivemap_fragment>', PV = '#include <project_vertex>', CM = '#include <common>';
      mat.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(mat, sh, r);
        let f = sh.fragmentShader, v = sh.vertexShader;
        if (!f.includes(E) || !f.includes(CM) || (!o.world && (!v.includes(PV) || !v.includes(CM)))) { console.warn('moor-under-the-fog-bank: the lamps find no place in the shader of ' + name); return; }
        Object.assign(sh.uniforms, plU);
        if (!o.world) {
          v = v.replace(CM, CM + '\nvarying vec3 vMoorLW;').replace(PV, PV + '\n  { vec4 moorLW = vec4(transformed, 1.0);\n  #ifdef USE_BATCHING\n    moorLW = batchingMatrix * moorLW;\n  #endif\n  #ifdef USE_INSTANCING\n    moorLW = instanceMatrix * moorLW;\n  #endif\n    vMoorLW = (modelMatrix * moorLW).xyz; }');
          f = f.replace(CM, CM + '\nvarying vec3 vMoorLW;');
        }
        f = f.replace(CM, CM + '\n' + PL_PARS).replace(E, E + '\n  totalEmissiveRadiance += diffuseColor.rgb * moorLamps(' + (o.world || 'vMoorLW') + ', inverseTransformDirection(normal, viewMatrix), ' + soft + ') * ' + (o.k ?? 1).toFixed(2) + ';');
        sh.vertexShader = v; sh.fragmentShader = f;
      };
      mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|moor-lamps-1-' + name;
      return mat;
    };
    // (POLISH 1, MENDING 1: A THING HELD UNDER THE NIGHT'S LIGHT, by the night's own figures and for every thing of its material
    // alike. own: how much of its colour it keeps under every light of the sky (after the lamps' and its other own terms,
    // which are not held); direct: how much it gives back of the moon's direct light alone (its shade is not touched);
    // mirror: how much of the moon's own mirror on it. Each is 1 where it is not named. Laid on after the thing's other hooks.)
    const moonHeld = (mat, o) => {
      const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey, LP = '#include <lights_physical_fragment>', LE = '#include <lights_fragment_end>';
      const own = (o.own ?? 1).toFixed(3), direct = (o.direct ?? 1).toFixed(3), mirror = (o.mirror ?? 1).toFixed(3);
      mat.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(mat, sh, r);
        const f = sh.fragmentShader;
        if (!f.includes(LP) || !f.includes(LE)) { console.warn('moor-under-the-fog-bank: the night\'s hold finds no place in a shader'); return; }
        sh.fragmentShader = f.replace(LP, '  diffuseColor.rgb *= ' + own + ';\n' + LP).replace(LE, LE + '\n  reflectedLight.directDiffuse *= ' + direct + '; reflectedLight.directSpecular *= ' + mirror + ';');
      };
      mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|moor-held-' + own + '-' + direct + '-' + mirror;
      return mat;
    };
    // ---- THE LANE: nothing that stands comes within 2.5 m of the line we fly. The line is kept as a point every half metre, in cells of
    // 12 m; each thing is measured whole against it (an upright thing as a cylinder between two heights, a wall as a box, a crown by its
    // own leaves) before it is made. A thing that can be left out is left out when it stands inside the lane; what is built by a rule of
    // the place (the hall, the yew, the gate, the mine) is measured, and the least distance of every kind is kept.
    const LANE_M = 2.5, LG = 12, lanePts = [], laneCells = new Map(), laneLeast = {}, laneLeft = {}, lv = new THREE.Vector3();
    const laneAdd = () => { const k = (Math.floor(lv.x / LG) + 4096) * 8192 + Math.floor(lv.z / LG) + 4096; let c = laneCells.get(k); if (!c) laneCells.set(k, c = []); c.push(lanePts.length); lanePts.push(lv.x, lv.y, lv.z); };
    for (let s = 0; s <= L; s += 0.5) { path.posAtDist(s, lv); laneAdd(); }
    // (the camera that shows this world inside the last world's opening flies the entry axis BEHIND the entry: the line's first
    // heading continued backward, level, at the entry's height. BACK_M metres of it belong to the lane too)
    const laneOwn = lanePts.length, laneT = new THREE.Vector3(); path.tangentAtDist(0, laneT); laneT.y = 0; laneT.normalize();
    for (let b = 0.5; b <= BACK_M; b += 0.5) { path.posAtDist(0, lv); lv.addScaledVector(laneT, -b); laneAdd(); }
    await ctx.yield();
    // (metres between the line and an upright cylinder of radius r standing at x, z between the heights y0 and y1; 99 when over far m)
    const laneDist = (x, z, r, y0, y1, far = 12) => {
      // (the squares of the two distances are compared and one root taken at the end: this is asked some hundred thousand times a build)
      const reach = r + far, i0 = Math.floor((x - reach) / LG), i1 = Math.floor((x + reach) / LG), j0 = Math.floor((z - reach) / LG), j1 = Math.floor((z + reach) / LG); let best = 99 * 99;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = laneCells.get((i + 4096) * 8192 + j + 4096); if (!c) continue;
        for (const k of c) { const py = lanePts[k + 1], dx = lanePts[k] - x, dz = lanePts[k + 2] - z, dh = Math.max(0, Math.sqrt(dx * dx + dz * dz) - r), dv = py < y0 ? y0 - py : py > y1 ? py - y1 : 0, d2 = dh * dh + dv * dv; if (d2 < best) best = d2; } }
      return Math.min(99, Math.sqrt(best));
    };
    // (the same for a box that lies along the world's axes, up to the height y1)
    const laneBox = (x0, x1, z0, z1, y1, y0 = -99) => {
      let best = 99; const reach = 12, i0 = Math.floor((Math.min(x0, x1) - reach) / LG), i1 = Math.floor((Math.max(x0, x1) + reach) / LG), j0 = Math.floor((Math.min(z0, z1) - reach) / LG), j1 = Math.floor((Math.max(z0, z1) + reach) / LG);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = laneCells.get((i + 4096) * 8192 + j + 4096); if (!c) continue;
        for (const k of c) { const px = lanePts[k], py = lanePts[k + 1], pz = lanePts[k + 2], ex = Math.max(Math.min(x0, x1) - px, 0, px - Math.max(x0, x1)), ey = Math.max(y0 - py, 0, py - y1), ez = Math.max(Math.min(z0, z1) - pz, 0, pz - Math.max(z0, z1)), d = Math.sqrt(ex * ex + ey * ey + ez * ez); if (d < best) best = d; } }
      return best;
    };
    const laneNote = (kind, d) => { if (d < (laneLeast[kind] ?? 99)) laneLeast[kind] = d; return d; };
    // (true when the thing may stand; when not, it is counted as left out)
    const laneOk = (kind, x, z, r, y0, y1, far) => { const d = laneDist(x, z, r, y0, y1, far); if (d < LANE_M) { laneLeft[kind] = (laneLeft[kind] || 0) + 1; return false; } laneNote(kind, d); return true; };
    // (a list of placed blocks: those inside the lane are taken out of it; kr and ky give a block's reach and half height by its scale)
    // (ROUND 11, MENDING 2: a slab that only holds a left-out far pile's number, M.ghost, is taken out by the same measure and is not told)
    const laneSift = (kind, list, kr, ky) => { let n = 0; for (const M of list) { const e = M.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
      if (M.ghost ? laneDist(e[12], e[14], kr * Math.max(sx, sz), e[13] - ky * sy, e[13] + ky * sy) >= LANE_M : laneOk(kind, e[12], e[14], kr * Math.max(sx, sz), e[13] - ky * sy, e[13] + ky * sy)) list[n++] = M; } list.length = n; };
    // THE HARD THINGS, ONE LIST. Every hard thing that is dealt (the trunks of every kind, the wands, the posts, the peat ricks) is
    // written here as its kind is dealt, with the radius of its body where it stands, and every later kind asks the list first:
    // a thing that would stand in another is left out AFTER its draws (so that nothing else moves) and counted by its kind. The
    // reed beds ask it too. (HARD: the radii, metres; a tree's by its scale. A rick is 2.6 m by 1.6: the circle about it.)
    const HARD = { oak: 1.5, orchard: 0.45, thorn: 0.65, wand: 0.3, fencePost: 0.3, drowned: 0.6, rick: 1.55, boundaryPost: 0.35, newtake: 1.25 };
    const hard = [], hardLeft = {}, hardTally = { drownedWet: 0, drownedDry: 0, bedsAsked: 0, bedsStanding: 0, reedsLeft: 0 };
    const hardIn = (x, z, r) => { for (const h of hard) { const m = h[2] + r, dx = h[0] - x, dz = h[1] - z; if (dx * dx + dz * dz < m * m) return h; } return null; };
    // THE GROUND'S SHADES ARE PAINT ON THE GROUND. EVERY sheet of soft shade the kit lays goes through ONE check (shadeCheck):
    // the park oaks', the thorns', the bog oaks', the heather's, the gorse's, the standing things' and the granite's. The
    // check measures each sheet against the DRAWN ground at every vertex AND at the middle of every triangle and of each of
    // its three edges. The kit's drape lifts a vertex where the ground bulges between two of them: each vertex more than
    // SHADE_UP, a hand, over the ground is laid back to it (the sheet is then hidden where the bulge stands through it,
    // as paint is on a face that turns away). A triangle any of whose four middles then stands more than SHADE_FLOAT over
    // the ground (a sheet's cell spanning a cut bank, a ditch, the brook's bed) is taken out of the sheet: no shade hangs
    // in the air. What is kept with the scene (userData.shades) is, for each sheet: the least and the most a vertex stands
    // over the ground as laid, the vertices, those laid back, the least and the most of the kept triangles' middles, the
    // triangles kept and those taken out. A vertex over a hand or a kept middle over SHADE_FLOAT is a fault (the lane's hits).
    const SHADE_UP = 0.12, SHADE_FLOAT = 0.4, SHADE_MIDS = [[1 / 3, 1 / 3, 1 / 3], [0.5, 0.5, 0], [0, 0.5, 0.5], [0.5, 0, 0.5]], shadeOff = {};
    const shadeCheck = async (name, sh) => { if (!sh || !sh.object) return; const geo = sh.object.geometry, a = geo.attributes.position, ix = geo.index; let lo = 1e9, hi = -1e9, laid = 0, mLo = 1e9, mHi = -1e9, kept = 0, cut = 0;
      for (let i = 0; i < a.count; i++) { const g = groundY(a.getX(i), a.getZ(i)); if (a.getY(i) > g + SHADE_UP + 1e-4) { a.setY(i, g + SHADE_UP); laid++; } const d = a.getY(i) - g; if (d < lo) lo = d; if (d > hi) hi = d; }
      const q = ix ? ix.array : [];
      for (let k = 0; k < q.length; k += 3) { if (k % 7200 === 7197) await ctx.yield(); const i0 = q[k], i1 = q[k + 1], i2 = q[k + 2]; if (i0 === i1) continue; let tLo = 1e9, tHi = -1e9;
        for (const w of SHADE_MIDS) { const x = a.getX(i0) * w[0] + a.getX(i1) * w[1] + a.getX(i2) * w[2], z = a.getZ(i0) * w[0] + a.getZ(i1) * w[1] + a.getZ(i2) * w[2], d = a.getY(i0) * w[0] + a.getY(i1) * w[1] + a.getY(i2) * w[2] - groundY(x, z); if (d < tLo) tLo = d; if (d > tHi) tHi = d; }
        if (tHi > SHADE_FLOAT) { q[k + 1] = q[k + 2] = i0; cut++; continue; } kept++; if (tLo < mLo) mLo = tLo; if (tHi > mHi) mHi = tHi; }
      if (laid) { a.needsUpdate = true; geo.computeBoundingSphere(); } if (cut) ix.needsUpdate = true;
      sh.object.userData.shadeChecked = name;
      shadeOff[name] = [a.count ? lo : 0, a.count ? hi : 0, a.count, laid, kept ? mLo : 0, kept ? mHi : 0, kept, cut]; };
    // A BROAD SHADE IS CUT INTO SMALL DISCS: the kit lays each shade as one oval of at most six cells by six, so the long oval of
    // a hut ring or of a granite pile under this low moon (four times as long as broad) would be six cells of ten metres and
    // more, which cannot follow a slope. shadeCut deals a list of casters (x, z, radius) into two: the SMALL, whose whole
    // oval is no longer than six cells of SHADE.cell, laid as the kit lays them; and, for each BROAD one, rows of little
    // ROUND DISCS (none broader than SHADE.disc to either hand, SHADE.step of their radius apart, each of cells of
    // SHADE.cutCell at the most) that together fill the broad one's own oval, overlapping by their soft edges; a broad thing's oval
    // is SHADE.long times the kit's drag (a pile's shade is as long as the pile is high under this moon, and a pile is
    // lower than it is broad). shadeLay lays both sheets and checks both.
    const SHADE = { size: 1.25, stretch: 2.3, cell: 3, disc: 5.2, cutCell: 3.6, long: 0.52, step: 1.3 };
    const shadeCut = (list, sun) => { const hl = Math.hypot(sun.x, sun.z) || 1, dx = -sun.x / hl, dz = -sun.z / hl, cot = Math.min(2.2, hl / Math.max(0.05, sun.y)), KZ = 1 + 0.55 * cot * SHADE.stretch, KB = 1 + 0.55 * cot * SHADE.stretch * SHADE.long, SP = SHADE.step, small = [], cut = [];
      for (const q of list) { const R = q[2] + 0.5, RX = R * SHADE.size, RZ = RX * KB;
        if (2 * RX * KZ <= 6 * SHADE.cell) { small.push({ x: q[0], z: q[1], r: R }); continue; }
        const cols = Math.ceil(Math.max(0, RX / SHADE.disc - 1) * 2 / SP - 1e-6) + 1, rx = RX / (1 + SP * (cols - 1) / 2), rz = rx, rows = Math.max(1, Math.ceil((2 * RZ - 2 * rz) / (SP * rz) - 1e-6) + 1);
        const cx = q[0] + dx * (RZ - RX) * 0.8, cz = q[1] + dz * (RZ - RX) * 0.8;
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const t = rows > 1 ? lerp(-(RZ - rz), RZ - rz, i / (rows - 1)) : 0, w = (j - (cols - 1) / 2) * SP * rx;
          if (cols > 1 && (w / RX) * (w / RX) + (t / RZ) * (t / RZ) > 1) continue;
          cut.push({ x: cx + dx * t + dz * w, z: cz + dz * t - dx * w, r: rx }); } }
      return { small, cut }; };
    const shadeLay = async (name, list, sun) => { const c = shadeCut(list, sun);
      await ctx.yield();
      const a = flora.makeGroundShadows({ points: c.small, heightAt: groundY, sunDir: sun, strength: sheetK(0.66), size: SHADE.size, stretch: SHADE.stretch, cell: SHADE.cell });
      await ctx.yield();
      const b = flora.makeGroundShadows({ points: c.cut, heightAt: groundY, sunDir: sun, strength: sheetK(0.5), size: 1, stretch: 0, cell: SHADE.cutCell });
      await ctx.yield();
      scene.add(a.object, b.object); await shadeCheck(name, a);
      await ctx.yield();
      await shadeCheck(name + ', the broad ones cut small', b); return [a, b]; };
    const hardOk = (kind, x, z, r) => { if (hardIn(x, z, r)) { hardLeft[kind] = (hardLeft[kind] || 0) + 1; return false; } hard.push([x, z, r, kind]); return true; };
    await ctx.yield();
    const ridges =T.makeHorizonRidges({ rng: fk.ridges, layers: 3, radius: [1500, 3000], height: [60, 190], base: -40, jagged: 0.35, coverage: 0.8, colorNear: H.ridge ?? '#27324e', fog: scene.fog, sunDir, sunColor: H.light, sunIntensity: 0.14, rim: 0.12 });
    scene.add(ridges.object);
    await ctx.yield();

    // ---- stone, slate and warm windows: one builder for everything built (the hall, the lodge pillars, walls, bridge, huts, the mine)
    // (round 6, WARM LIGHT AGAINST THE BLUE: nine windows in ten of a lit front are lit, where it was five; and the sky's fill on what
    // the moon does not reach is a third stronger, so that no shadow side of any wall is black)
    const mats = ST.makeMaterials({ night: H.night, lit: 0.92, glow: 2.3, warm: '#ffc878', flood: 0, streetGlow: 0, nightFill: H.fill ?? [0.13, 0.17, 0.28], halo: 0.6 });
    mats.facades.forEach((m, i) => lampsOn(m, 'built-' + i, { soft: 0.3 }));
    const B = ST.makeBuilder(16384), SURF = ST.SURF;
    const STONE = lin('#74757c'), STONE_D = lin('#55585f'), LICHEN = lin('#7d8068'), SLATE = lin('#3c424e'), IRON = lin('#1c1e22'), IVY = lin('#1e3320'), IVY_L = lin('#2e4a2a'), WOOD = lin('#3a2e24'), WHITE = lin('#b8b6ac');
    // A PEAT RICK: DRIED TURVES, a dark peat brown, stacked round and domed as turves are stacked to shed the rain: a beehive of
    // nine sides within a round of 1.3 m, 1.92 m from its foot (0.3 m in the ground) to its top. (lx, dy, zo: its middle)
    const RICK = lin('#5c4a3b');
    const rickOf = (lx, dy, zo, tw) => { B.col(RICK, 0.7, 1.1).surf(SURF.MASONRY, 0).lathe(lx + tw * 0.3, dy - 0.3, zo, [[1.2, 0], [1.3, 0.62], [1.2, 1.12], [0.9, 1.52], [0.42, 1.82], [0, 1.92]], 9); };
    // (THE OLD WORKS' STONE AND TIMBER, round 7: nothing of them is black. Moor stone pale grey in its courses, timber weathered
    // silver-brown, the rods' iron grey, the stacks' brick a dull red. And a wall with ARCHED OPENINGS cut through it, the night
    // seen through them: wallOps lays a wall whose thickness lies between c0 and c1 on one axis (0: the wall runs along the
    // frame's z; 1: along its x) from a0 to a1 and from yb to yt; each opening [middle, half width, sill, springing, and a
    // second sill and springing for a light over it] is left out of it, its round head stepped in four courses; a light whose
    // head the wall does not reach is a breach in the wall's top, and one whose sill it does not reach by 0.6 m is not cut)
    const WSTONE = lin('#9c9e9b'), WTIMBER = lin('#9a8f7e'), WROD = lin('#7d786e'), WDARK = lin('#161a24');
    const wallOps = (axis, c0, c1, a0, a1, yb, yt, ops, o = { m: 0.5 }) => {
      const bx = (p, q, y0, y1) => { if (q - p < 0.02 || y1 - y0 < 0.02) return; if (axis === 0) B.box(c0, y0, p, c1, y1, q, o); else B.box(p, y0, c0, q, y1, c1, o); };
      let at = a0;
      for (const op of ops.slice().sort((p, q) => p[0] - q[0])) { const lo = Math.max(a0, op[0] - op[1]), hi = Math.min(a1, op[0] + op[1]); if (hi <= lo || lo < at) continue;
        const prs = []; for (let i = 2; i + 1 < op.length; i += 2) if (op[i] < yt - 0.6) prs.push([op[i], op[i + 1]]);
        bx(at, lo, yb, yt); bx(lo, hi, yb, prs.length ? prs[0][0] : yt);
        for (let i = 0; i < prs.length; i++) for (let j = 0; j < 4; j++) { const u = (j + 0.5) / 2 - 1; bx(Math.max(lerp(op[0] - op[1], op[0] + op[1], j / 4), a0), Math.min(lerp(op[0] - op[1], op[0] + op[1], (j + 1) / 4), a1), prs[i][1] + Math.sqrt(1 - u * u) * op[1], i + 1 < prs.length ? prs[i + 1][0] : yt); }
        at = hi; }
      bx(at, a1, yb, yt); };
    // (weeds at a wall's broken head: two or three low tufts)
    const weedsAt = (x, y, z, r, n = 2) => { B.col(IVY_L, 0.8, 1.5).surf(SURF.PLAIN); for (let k = 0; k < n; k++) B.sphere(x + (k - (n - 1) / 2) * r * 1.3, y + r * 0.25, z + (k % 2 ? 0.12 : -0.12), r * (k % 2 ? 0.8 : 1), 6, 4); };
    const rH = fk.hall, rLit = fk.lit;
    // (small lanterns, lit with the candle's glows: [x, y, z, size, colour]; filled as each is built)
    const lanternPts = [];
    // (THE PASSAGES of the way, for my count by the owner's rule text S: each member as a box [name, x0, x1, z0, z1, y0, y1])
    const passages = { 'the lodge gates': [], 'the wicket gate': [], 'the avenue\'s lamps': [] };
    scene.userData.passages = passages;
    // the lodge gates: two lichened pillars with stone balls, wrought iron leaves standing open
    // (round 8: A LIT LANTERN ON EACH PILLAR'S FACE toward the road, on an iron bracket 3 m up: its gold lies on the pillar, on the
    // open leaf of the gate and on the gravel between them)
    for (const sx of [-1, 1]) {
      B.col(IRON).surf(SURF.PLAIN).beam([sx * 3.5, 3.7, -8.42], [sx * 3.5, 3.7, -7.95], 0.07, 0.07).cbox(sx * 3.5, 2.95, -7.95, 0.44, 0.72, 0.44).cbox(sx * 3.5, 3.67, -7.95, 0.56, 0.07, 0.56);
      B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(sx * 3.5, 3.04, -7.95, 0.32, 0.5, 0.32);
      laneNote('lodge lantern', laneDist(sx * 3.5, -7.95, 0.3, 2.9, 3.8));
      lanternPts.push([sx * 3.5, 3.3, -7.95, 0.8]); plPut(sx * 3.3, 3.3, -7.6, 11.5, GOLD, 1.5);
      B.col(STONE, 0.8, 1).surf(SURF.MASONRY, 0).cbox(sx * 3.5, 0, -9, 1.15, 4.1, 1.15, { m: 0.5 });
      B.col(LICHEN).surf(SURF.PLAIN).cbox(sx * 3.5, 4.1, -9, 1.45, 0.28, 1.45); B.sphere(sx * 3.5, 4.86, -9, 0.5, 10, 6);
      B.col(STONE_D).surf(SURF.MASONRY, 0).box(sx * 4.1, 0, -9.3, sx * 12, 1.5, -8.7, { m: 0.5 });
      B.col(IRON).surf(SURF.PLAIN);
      for (let i = 0; i <= 12; i++) { const z = -9.6 - i * 0.24, top = 2.5 + 0.5 * Math.sin(i / 12 * Math.PI); B.cbox(sx * 2.92, 0.15, z, 0.045, top, 0.045); }
      B.box(sx * 2.92 - 0.03, 0.35, -12.5, sx * 2.92 + 0.03, 0.43, -9.55); B.box(sx * 2.92 - 0.03, 2.2, -12.5, sx * 2.92 + 0.03, 2.28, -9.55);
    }
    await ctx.yield();
    // the hall: a heavy central block with a porch, twin towers of the block's own stone at its ends (buttressed, crenellated, pierced
    // with loopholes; 24.5 m, under 1.6 times the roof's 15.5 m), lower wings; slate roofs with ridge tiles and dormers, many
    // chimney stacks with pots. ITS WINDOWS ARE SMALL AND MULLIONED (round 8): each a stone surround with a mullion and a transom,
    // four small lights of leaded glass, lit from within or dark by a state drawn for the visit; every lit window of the ground
    // floor throws its gold on the gravel before it (plPut: the place's own law of lights)
    const zf = HALL.zFront, zb = zf - HALL.depth, tx = HALL.towerX, tw = HALL.towerW / 2, wingW = 9 + rH.range(0, 3), wingH = 8.2, rCh = fk.chimneys;
    const cren = (x0, z0, x1, z1, y, step = 2.1) => {
      B.col(STONE, 0.9, 1).surf(SURF.PLAIN);
      for (let x = x0 + 0.4; x < x1 - 0.5; x += step) { B.box(x, y, z1 - 0.5, x + step * 0.52, y + 1.1, z1); B.box(x, y, z0, x + step * 0.52, y + 1.1, z0 + 0.5); }
      for (let z = z0 + 0.4; z < z1 - 0.5; z += step) { B.box(x0, y, z, x0 + 0.5, y + 1.1, z + step * 0.52); B.box(x1 - 0.5, y, z, x1, y + 1.1, z + step * 0.52); }
    };
    // a string course: a band of paler stone standing a hand out of the wall, all round a block
    const course = (x0, z0, x1, z1, y, out = 0.18, h = 0.32) => { B.col(LICHEN, 1, 1.12).surf(SURF.PLAIN).box(x0 - out, y, z0 - out, x1 + out, y + h, z1 + out); };
    // a chimney stack: a shaft of masonry, an oversailing cap and two to four pots; its top is kept (for the smoke and for the lane's test)
    const stacks = [], POT = lin('#7a4a38');
    const chimney = (x, z, y0, h, wd = 1.5, dp = 1.1) => {
      B.col(STONE, 0.8, 1).surf(SURF.MASONRY, 0).cbox(x, y0, z, wd, h, dp, { m: 0.5 });
      B.col(LICHEN).surf(SURF.PLAIN).cbox(x, y0 + h, z, wd + 0.3, 0.22, dp + 0.3);
      const n = Math.max(2, Math.round(wd / 0.55));
      for (let i = 0; i < n; i++) B.col(POT, 0.8, 1).surf(SURF.PLAIN).cyl(x + (i - (n - 1) / 2) * (wd / n), y0 + h + 0.22, z, 0.2, 0.15, 0.6 + rCh.range(0, 0.35), 6);
      stacks.push([x, y0 + h + 1.2, z, Math.max(wd, dp) / 2 + 0.2]);
    };
    B.col(STONE_D).surf(SURF.MASONRY, 0).box(-tx + tw, 0, zb, tx - tw, 1.1, zf + 0.12, { m: 0.4, top: false });
    B.col(STONE, 0.86, 1).surf(SURF.MASONRY, 0).box(-tx + tw, 1.1, zb, tx - tw, 9.5, zf, { m: 0.45, top: false });
    // (a mullioned window on a wall that faces +z (the front) at x, sill y0, w wide and h tall: surround, four lights, mullion, transom)
    const GLASS_ON = lin('#ffc070'), GLASS_OFF = lin('#141a24');
    const mullion = (x, y0, zw, w, h, on, k = 1.5) => {
      B.col(LICHEN, 0.95, 1.08).surf(SURF.PLAIN).box(x - w / 2 - 0.16, y0 - 0.16, zw, x + w / 2 + 0.16, y0, zw + 0.2).box(x - w / 2 - 0.16, y0 + h, zw, x + w / 2 + 0.16, y0 + h + 0.2, zw + 0.2)
        .box(x - w / 2 - 0.14, y0, zw, x - w / 2, y0 + h, zw + 0.14).box(x + w / 2, y0, zw, x + w / 2 + 0.14, y0 + h, zw + 0.14).box(x - 0.06, y0, zw, x + 0.06, y0 + h, zw + 0.12).box(x - w / 2, y0 + h * 0.56, zw, x + w / 2, y0 + h * 0.56 + 0.1, zw + 0.12);
      if (on) B.col(GLASS_ON, k, k).surf(SURF.GLOW, 0, 1).box(x - w / 2, y0, zw + 0.03, x + w / 2, y0 + h, zw + 0.05); else B.col(GLASS_OFF).surf(SURF.PLAIN).box(x - w / 2, y0, zw + 0.03, x + w / 2, y0 + h, zw + 0.05);
    };
    // (the central block's front is six bays of BAY_W; on the ground floor a window in each of the two outer bays either side of
    // the porch, on the floor above one in every bay; seven in eight are lit, by the house's own draw)
    const BAY_W = (2 * (tx - tw)) / 6;
    for (const kb of [-2.5, -1.5, 1.5, 2.5]) { const wx = kb * BAY_W, on = rLit() < 0.88; mullion(wx, 1.9, zf, 1.5, 2.0, on); if (on) plPut(wx, 2.4, zf + 1.6, 8.5, GOLD, 0.9); }
    for (const kb of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) mullion(kb * BAY_W, 6.3, zf, 1.5, 1.9, rLit() < 0.88);
    // THE GARDEN FRONT (the hall's back, on the walled garden): the same windows as the front's (a stream of their own, seven in
    // eight lit), and in the middle a garden door at the head of four steps, one leaf open on the lit hall, a fanlight over
    // it. THEIR GOLD LIES LONG DOWN THE GARDEN: the door and each lit window of the ground floor lay a long warm pane on the
    // gravel, the grass and the beds behind the house (lights of the place: one by the wall, one or two far down the bed).
    const rGl = fk.gardenlit;
    const mullionBack = (x, y0, w, h, on, k = 1.5) => {
      B.col(LICHEN, 0.95, 1.08).surf(SURF.PLAIN).box(x - w / 2 - 0.16, y0 - 0.16, zb - 0.2, x + w / 2 + 0.16, y0, zb).box(x - w / 2 - 0.16, y0 + h, zb - 0.2, x + w / 2 + 0.16, y0 + h + 0.2, zb)
        .box(x - 0.06, y0, zb - 0.12, x + 0.06, y0 + h, zb).box(x - w / 2, y0 + h * 0.56, zb - 0.12, x + w / 2, y0 + h * 0.56 + 0.1, zb);
      if (on) B.col(GLASS_ON, k, k).surf(SURF.GLOW, 0, 1).box(x - w / 2, y0, zb - 0.05, x + w / 2, y0 + h, zb - 0.03); else B.col(GLASS_OFF).surf(SURF.PLAIN).box(x - w / 2, y0, zb - 0.05, x + w / 2, y0 + h, zb - 0.03);
    };
    for (const kb of [-2.5, -1.5, 1.5, 2.5]) { const wx = kb * BAY_W, on = rGl() < 0.88; mullionBack(wx, 1.9, 1.5, 2.0, on); if (on) { plPut(wx, 2.6, zb - 3.5, 9, GOLD, 0.9); plPut(wx * 1.06, 3.4, zb - 15, 12, GOLD, 0.55); } }
    for (const kb of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) mullionBack(kb * BAY_W, 6.3, 1.5, 1.9, rGl() < 0.88);
    B.col(lin('#16110e')).surf(SURF.PLAIN).box(-1.0, 1.1, zb - 0.06, -0.05, 3.5, zb);
    B.col(lin('#ffb866'), 1.7, 1.7).surf(SURF.GLOW, 0, 1).box(-0.05, 1.2, zb - 0.06, 1.0, 3.5, zb).box(-1.0, 3.65, zb - 0.07, 1.0, 4.3, zb);
    B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN);
    for (let k = 0; k < 4; k++) B.box(-1.9 - 0.25 * k, 0, zb - 0.6 - 0.45 * (k + 1), 1.9 + 0.25 * k, 1.1 - 0.275 * (k + 1) + 0.275, zb - 0.6 - 0.45 * k);
    B.box(-1.9, 0, zb - 0.6, 1.9, 1.1, zb);
    plPut(0, 3.0, zb - 4, 10, GOLD, 1.0); plPut(0, 3.6, zb - 15, 12, GOLD, 0.7); plPut(0, 3.8, zb - 27, 13, GOLD, 0.45);
    B.col(STONE).surf(SURF.MASONRY, 0).box(-tx + tw, 9.5, zb, tx - tw, HALL.eaves, zf, { m: 0.4, top: false });
    course(-tx + tw, zb, tx - tw, zf, 5.1, 0.14, 0.26); course(-tx + tw, zb, tx - tw, zf, 9.6);
    cren(-tx + tw, zb, tx - tw, zf, HALL.eaves, 2.0);
    const rz0 = zb + 0.6, rz1 = zf - 0.6, rzm = (rz0 + rz1) / 2, roofY = (z) => HALL.eaves + 0.1 + (HALL.ridge - HALL.eaves - 0.1) * (1 - Math.abs(z - rzm) / (rz1 - rzm));
    B.col(SLATE).surf(SURF.TILES, 0).gable(-tx + tw + 0.5, rz0, tx - tw - 0.5, rz1, HALL.eaves + 0.1, HALL.ridge - HALL.eaves - 0.1, { alongX: true, overhang: 0, wallColor: STONE, m: 0.6 });
    // THE SLATES LIE IN COURSES: on each slope a drip edge of paler slate every 0.8 m down from the ridge (the laps of the
    // heavier courses, which the moon picks out as lines along the roof)
    for (let k = 1; k <= 9; k++) for (const sg of [-1, 1]) { const z = rzm + sg * k * 0.8, y = roofY(z);
      B.col(SLATE, 1.15, 1.4).surf(SURF.PLAIN).box(-tx + tw + 0.5, y - 0.05, Math.min(z, z + sg * 0.1), tx - tw - 0.5, y + 0.05, Math.max(z, z + sg * 0.1)); }
    // ridge tiles along the top, and three dormers in the front slope, each a window with a mullion under a little gable,
    // lit or dark by the house's own draw (one draw each, as before)
    B.col(LICHEN, 0.9, 1.1).surf(SURF.PLAIN).box(-tx + tw + 0.5, HALL.ridge - 0.08, rzm - 0.2, tx - tw - 0.5, HALL.ridge + 0.24, rzm + 0.2);
    const DORMERS = [-5.6, 0, 5.6], DORM = { z1: zf - 2.3, z0: zf - 5.4, half: 1.1, eave: 0.12, gable: 0.95 };
    for (const dx of DORMERS) {
      const z1 = DORM.z1, z0 = DORM.z0, y0 = roofY(z1) - 0.3, y1 = roofY(z0) - 0.1, on = rLit() < 0.88;
      B.col(STONE, 0.85, 1).surf(SURF.MASONRY, 0).box(dx - 0.95, y0, z0, dx + 0.95, y1, z1, { m: 0.5, top: false });
      mullion(dx, y0 + 0.4, z1, 1.1, y1 - y0 - 0.7, on, 1.6);
      B.col(SLATE).surf(SURF.TILES, 0).gable(dx - DORM.half, z0, dx + DORM.half, z1 + 0.2, y1, DORM.gable, { alongX: false, overhang: DORM.eave, wallColor: STONE, m: 0.6 });
    }
    // A LANTERN ROOF RIDES THE RIDGE over the great hall's middle (the old hall's louvre, glazed): a stone curb, four posts,
    // glass on its four sides with the hall's light in it, a leaded cap. Its top stands ROOF_LANTERN over the ridge; its
    // light lies on the slates about it (plPut).
    { const y = HALL.ridge, h = 1.25, cap = ROOF_LANTERN - h - 0.14;
      B.col(STONE, 0.85, 1).surf(SURF.MASONRY, 0).box(-1.3, y - 0.9, rzm - 1.3, 1.3, y + 0.3, rzm + 1.3, { m: 0.4 });
      B.col(LICHEN, 0.9, 1.05).surf(SURF.PLAIN);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cbox(sx * 1.08, y + 0.3, rzm + sz * 1.08, 0.2, h - 0.3, 0.2);
      for (const sg of [-1, 1]) { B.cbox(0, y + 0.3, rzm + sg * 1.08, 0.1, h - 0.3, 0.12); B.cbox(sg * 1.08, y + 0.3, rzm, 0.12, h - 0.3, 0.1); }
      B.col(GLASS_ON, 1.7, 1.7).surf(SURF.GLOW, 0, 1);
      for (const sg of [-1, 1]) { B.box(-0.98, y + 0.3, rzm + sg * 1.08 - 0.02, 0.98, y + h, rzm + sg * 1.08 + 0.02); B.box(sg * 1.08 - 0.02, y + 0.3, rzm - 0.98, sg * 1.08 + 0.02, y + h, rzm + 0.98); }
      B.col(SLATE, 0.9, 1.1).surf(SURF.PLAIN).box(-1.4, y + h, rzm - 1.4, 1.4, y + h + 0.12, rzm + 1.4).cyl(0, y + h + 0.12, rzm, 1.45, 0.1, cap, 8);
      plPut(0, y + 0.8, rzm + 2.2, 7.5, GOLD, 0.8); plPut(0, y + 0.8, rzm - 2.2, 7.5, GOLD, 0.8); }
    // (the stacks of the middle block stand 7.4 m either side of the roof's middle, at the two ends of the ridge)
    for (const sx of [-1, 1]) { chimney(sx * 7.4, zb + 4.2, roofY(zb + 4.2) - 0.4, 18.4 - roofY(zb + 4.2), 1.7, 1.2); chimney(sx * 7.4, zf - 4.4, roofY(zf - 4.4) - 0.4, 17.6 - roofY(zf - 4.4), 1.5, 1.1); }
    for (const sx of [-1, 1]) {
      const x0 = sx * tx - tw, x1 = sx * tx + tw, z0 = zf - 5.9, z1 = zf + 1.1;
      B.col(STONE, 0.82, 1.02).surf(SURF.SLIT, rLit(), 0.08).box(x0, 0, z0, x1, HALL.towerH, z1, { cellW: 3.5, cellH: 4.8, capStyle: SURF.PLAIN });
      course(x0, z0, x1, z1, 9.6); course(x0, z0, x1, z1, 16.2); course(x0, z0, x1, z1, 20.6, 0.12, 0.24);
      // (THE TOWERS CARRY NARROW SLITS, A FEW DIMLY LIT, round 8: the kit's own loopholes all round, and toward the avenue one slit
      // on each of three storeys, each lit dimly or dark by a state drawn for the visit (one in two); the house's gold is the
      // central block's and the wings' windows, the porch and the lamps)
      { const xm = sx * tx, rHl = fk.halllit;
        for (const yL of [6.2, 12.4, 18.0]) { const on = rHl() < 0.5;
          B.col(on ? lin('#e8a860') : lin('#0d1018'), on ? 0.9 : 1, on ? 0.9 : 1).surf(on ? SURF.GLOW : SURF.PLAIN, 0, 1).box(xm - 0.16, yL, z1, xm + 0.16, yL + 1.7, z1 + 0.05);
          B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).box(xm - 0.45, yL - 0.22, z1, xm + 0.45, yL - 0.04, z1 + 0.16); } }
      // (BUTTRESSES at the two outer corners toward the avenue and at the back's outer corner: each steps in twice as it rises)
      B.col(STONE, 0.8, 1).surf(SURF.MASONRY, 0);
      for (const [bx, bz, ax] of [[sx > 0 ? x1 : x0, z1 - 0.7, 0], [sx > 0 ? x0 + 0.7 : x1 - 0.7, z1, 1], [sx > 0 ? x1 - 0.7 : x0 + 0.7, z1, 1], [sx > 0 ? x1 : x0, z0 + 0.7, 0]]) {
        for (const [yb, yt, out] of [[0, 9.0, 1.5], [9.0, 15.6, 1.0], [15.6, 20.2, 0.55]]) {
          if (ax === 0) B.box(sx > 0 ? bx : bx - out, yb, bz - 0.6, sx > 0 ? bx + out : bx, yt, bz + 0.6, { m: 0.5 }); else B.box(bx - 0.6, yb, bz, bx + 0.6, yt, bz + out, { m: 0.5 });
          B.col(LICHEN, 0.95, 1.05).surf(SURF.PLAIN); if (ax === 0) B.box(sx > 0 ? bx : bx - out - 0.06, yt, bz - 0.66, sx > 0 ? bx + out + 0.06 : bx, yt + 0.14, bz + 0.66); else B.box(bx - 0.66, yt, bz, bx + 0.66, yt + 0.14, bz + out + 0.06);
          B.col(STONE, 0.8, 1).surf(SURF.MASONRY, 0); } }
      B.col(STONE_D).surf(SURF.PLAIN).box(x0 - 0.3, HALL.towerH - 0.55, z0 - 0.3, x1 + 0.3, HALL.towerH, z1 + 0.3);
      cren(x0 - 0.3, z0 - 0.3, x1 + 0.3, z1 + 0.3, HALL.towerH, 1.75);
      // a stair turret at the tower's outer back corner, a little taller, with its own cap
      B.col(STONE, 0.8, 1).surf(SURF.SLIT, rLit(), 0.05).cbox(sx * (tx + tw - 0.6), HALL.towerH, z0 + 0.9, 1.9, 2.6, 1.9, { cellW: 1.9, cellH: 2.6 });
      B.col(SLATE).surf(SURF.TILES, 0).hip(sx * (tx + tw - 0.6) - 0.95, z0 - 0.05, sx * (tx + tw - 0.6) + 0.95, z0 + 1.85, HALL.towerH + 2.6, 1.5, { overhang: 0.2, ridge: 0, m: 0.6 });
      // the wing: lower, of darker stone, with its own lit and unlit windows and a hipped slate roof
      const wx0 = sx > 0 ? x1 : x0 - wingW, wx1 = sx > 0 ? x1 + wingW : x0;
      B.col(STONE_D, 0.9, 1).surf(SURF.MASONRY, 0).box(wx0, 0.9, zb + 2, wx1, wingH, zf - 1.5, { m: 0.45, top: false });
      // (three mullioned windows on each floor of the wing's front; three in four are lit)
      for (let k = 0; k < 3; k++) { const wxm = lerp(wx0, wx1, (k + 0.5) / 3), on = rLit() < 0.75; mullion(wxm, 1.7, zf - 1.5, 1.3, 1.8, on, 1.3); if (on) plPut(wxm, 2.2, zf - 0.2, 7.5, GOLD, 0.8); mullion(wxm, 5.2, zf - 1.5, 1.3, 1.6, rLit() < 0.75, 1.3); }
      B.col(STONE_D).surf(SURF.MASONRY, 0).box(wx0, 0, zb + 2, wx1, 0.9, zf - 1.4, { m: 0.4, top: false });
      course(wx0, zb + 2, wx1, zf - 1.5, 4.4, 0.12, 0.24);
      B.col(SLATE).surf(SURF.TILES, 0).hip(wx0, zb + 2, wx1, zf - 1.5, wingH, 3.4, { overhang: 0.5, m: 0.6, ridge: 0.5 });
      B.col(LICHEN, 0.9, 1.1).surf(SURF.PLAIN).box(wx0 + wingW * 0.27, wingH + 3.3, zb + 2 + (HALL.depth - 3.5) / 2 - 0.16, wx1 - wingW * 0.27, wingH + 3.58, zb + 2 + (HALL.depth - 3.5) / 2 + 0.16);
      chimney(sx * (tx + tw + wingW * 0.55), zb + 6, wingH + 1, 5.2); chimney(sx * (tx + tw + wingW - 1.2), zf - 5, wingH + 0.4, 4.8 + rCh.range(0, 0.8), 1.2, 1.0);
    }
    await ctx.yield();
    // the porch, with a dark arched door and a lamp-lit fanlight over it
    B.col(STONE, 0.9, 1).surf(SURF.MASONRY, 0).box(-3.1, 0, zf, 3.1, 5.4, zf + 3.6, { m: 0.4 });
    B.col(SLATE).surf(SURF.TILES, 0).gable(-3.1, zf, 3.1, zf + 3.6, 5.4, 1.7, { alongX: false, overhang: 0.25, wallColor: STONE, m: 0.6 });
    // (round 6: THE PORCH IS LIT. One leaf of the door stands open on the lit hall within; a lantern hangs under the porch's gable;
    // their light lies on the steps and far out on the forecourt's gravel, painted on the ground by place: plPut)
    B.col(lin('#16110e')).surf(SURF.PLAIN).box(-1.25, 0, zf + 3.6, -0.05, 3.3, zf + 3.66);
    B.col(lin('#ffb866'), 1.7, 1.7).surf(SURF.GLOW, 0, 1).box(-0.05, 0.12, zf + 3.6, 1.25, 3.3, zf + 3.66);
    B.col(lin('#ffc878'), 2.2, 2.2).surf(SURF.GLOW, 0, 1).box(-1.0, 3.45, zf + 3.6, 1.0, 4.2, zf + 3.67);
    B.col(IRON).surf(SURF.PLAIN).beam([0, 6.2, zf + 3.95], [0, 5.5, zf + 3.95], 0.05, 0.05).cbox(0, 4.85, zf + 3.95, 0.5, 0.66, 0.5);
    B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(0, 4.93, zf + 3.95, 0.36, 0.48, 0.36);
    // steps before the porch, and a pair of stone urns on plinths at the head of the forecourt
    B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).box(-2.4, 0, zf + 3.6, 2.4, 0.18, zf + 4.9).box(-2.9, 0, zf + 4.9, 2.9, 0.09, zf + 5.6);
    for (const sx of [-1, 1]) { B.col(STONE, 0.9, 1).surf(SURF.MASONRY, 0).cbox(sx * 6.4, 0, zf + 6.2, 0.9, 1.0, 0.9, { m: 0.8 }); B.col(LICHEN).surf(SURF.PLAIN).lathe(sx * 6.4, 1.0, zf + 6.2, [[0.18, 0], [0.14, 0.2], [0.42, 0.55], [0.5, 0.8], [0.4, 0.86], [0, 0.86]], 8); }
    // THE LAMPS AT THE DOOR: an iron lantern on a bracket at each side of the porch's arch, lit; each throws a pool on the gravel
    for (const sx of [-1, 1]) {
      const lx = sx * 2.25, lz = zf + 4.1;
      B.col(IRON).surf(SURF.PLAIN).beam([lx, 3.5, zf + 3.6], [lx, 3.5, lz], 0.07, 0.07).cbox(lx, 2.75, lz, 0.42, 0.7, 0.42).cbox(lx, 3.45, lz, 0.54, 0.07, 0.54);
      B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lx, 2.84, lz, 0.3, 0.5, 0.3);
      lanternPts.push([lx, 3.1, lz, 0.8]); plPut(lx + sx * 0.2, 3.0, lz + 0.4, 9.5, GOLD, 1.1);
    }
    lanternPts.push([0, 5.1, zf + 3.95, 0.9]); plPut(0, 4.4, zf + 4.6, 17, GOLD, 1.4);
    // TWO LANTERNS AT THE FORECOURT'S HEAD (round 6), where the drive runs into it: an iron post 3.2 m tall each side of the drive,
    // 4.8 m from its middle, each with its pool on the gravel.
    for (const sx of [-1, 1]) {
      const lx = sx * 4.8, lz = zf + 30.5;
      B.col(IRON).surf(SURF.PLAIN).beam([lx, 0, lz], [lx, 2.7, lz], 0.12, 0.12).cbox(lx, 2.7, lz, 0.46, 0.66, 0.46).cbox(lx, 3.36, lz, 0.58, 0.07, 0.58);
      B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lx, 2.78, lz, 0.32, 0.5, 0.32);
      laneNote('forecourt lantern', laneDist(lx, lz, 0.4, 0, 3.5));
      lanternPts.push([lx, 3.0, lz, 0.8]); plPut(lx, 3.0, lz, 12.5, GOLD, 1.4);
    }
    // the stable yard east of the hall: a walled court, a range of stables along its north side with a cupola, a gateway in the south wall
    // with a lantern on its pier
    const rYd = fk.yard, yx0 = tx + tw + wingW + 5, yx1 = yx0 + 22 + rYd.range(0, 4), yz0 = zb - 2, yz1 = zf + 4, ygx = (yx0 + yx1) / 2 + rYd.range(-3, 3);
    B.col(STONE_D, 0.8, 1).surf(SURF.WINDOW, rLit(), 0.35).box(yx0, 0, yz0, yx1, 4.2, yz0 + 6.4, { cellW: 3.3, cellH: 4.2, top: false });
    B.col(SLATE).surf(SURF.TILES, 0).hip(yx0, yz0, yx1, yz0 + 6.4, 4.2, 2.7, { overhang: 0.5, m: 0.6, ridge: 0.6 });
    B.col(WOOD, 0.8, 1).surf(SURF.PLANKS, 0).cbox((yx0 + yx1) / 2, 6.5, yz0 + 3.2, 1.7, 1.9, 1.7, { m: 0.8, top: false });
    B.col(SLATE).surf(SURF.TILES, 0).hip((yx0 + yx1) / 2 - 0.85, yz0 + 2.35, (yx0 + yx1) / 2 + 0.85, yz0 + 4.05, 8.4, 1.5, { overhang: 0.3, ridge: 0, m: 0.6 });
    const wallRun = (x0, z0, x1, z1, h = 2.5) => { const t = 0.28; B.col(STONE_D, 0.82, 1).surf(SURF.MASONRY, 0).box(Math.min(x0, x1) - t, 0, Math.min(z0, z1) - t, Math.max(x0, x1) + t, h, Math.max(z0, z1) + t, { m: 0.5, top: false });
      B.col(LICHEN, 0.95, 1.05).surf(SURF.PLAIN).box(Math.min(x0, x1) - t - 0.08, h, Math.min(z0, z1) - t - 0.08, Math.max(x0, x1) + t + 0.08, h + 0.16, Math.max(z0, z1) + t + 0.08); };
    const pier = (x, z, h = 3.2, ball = true) => { B.col(STONE, 0.85, 1).surf(SURF.MASONRY, 0).cbox(x, 0, z, 0.9, h, 0.9, { m: 0.6 }); B.col(LICHEN).surf(SURF.PLAIN).cbox(x, h, z, 1.12, 0.2, 1.12); if (ball) B.sphere(x, h + 0.56, z, 0.38, 9, 6); };
    wallRun(yx1, yz0 + 6.4, yx1, yz1); wallRun(yx0, yz0 + 6.4, yx0, yz1 - 9); wallRun(yx0, yz1, ygx - 2.1, yz1); wallRun(ygx + 2.1, yz1, yx1, yz1);
    pier(ygx - 2.1, yz1, 3.4); pier(ygx + 2.1, yz1, 3.4);
    B.col(IRON).surf(SURF.PLAIN).beam([ygx + 2.1, 3.0, yz1 + 0.45], [ygx + 2.1, 3.0, yz1 + 1.25], 0.06, 0.06).cbox(ygx + 2.1, 2.45, yz1 + 1.25, 0.3, 0.5, 0.3);
    B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(ygx + 2.1, 2.52, yz1 + 1.25, 0.2, 0.34, 0.2);
    lanternPts.push([ygx + 2.1, 2.7, yz1 + 1.25]); plPut(ygx + 2.1, 2.7, yz1 + 1.6, 9, GOLD, 1.3);
    // the walled garden behind the hall (35 m and more to the alley's head): old walls with a coping, piers with balls where the walk leaves it
    // for the yew alley and where it is entered beside the hall; its beds are hedged with box and yew (grown further down)
    const gH = GARDEN_HALF, zg0 = zb - 5, zg1 = ALLEY.z0 + 3;
    wallRun(-gH, zg0, -gH, zg1, 2.8); wallRun(gH, zg0, gH, zg1, 2.8); wallRun(-gH, zg1, -ALLEY.half - ALLEY.thick - 0.6, zg1, 2.8); wallRun(ALLEY.half + ALLEY.thick + 0.6, zg1, gH, zg1, 2.8);
    wallRun(-gH, zg0, -tx - tw + 1, zg0, 2.8); wallRun(tx + tw - 1, zg0, gH, zg0, 2.8);
    for (const sx of [-1, 1]) { pier(sx * (ALLEY.half + ALLEY.thick + 0.6), zg1, 3.6); pier(sx * gH, zg1, 3.2, false); pier(sx * gH, zg0, 3.2, false); }
    // (the ivy is hung on the front further down, once the leaf material exists)
    await ctx.yield();

    // ---- the yew alley: two walls of old clipped yew 9.5 m apart and some 4 m high, a strip of grass each side of the gravel walk;
    // at its far end a hedge closes it but for the gate's gap. THE EAST WALL ENDS BAY metres short of the alley's end, where the
    // alley opens on its east hand into a green BAY_D metres deep, walled with the same yew: at the green's far end, against
    // the end hedge and beside the gate, stands the summer house, its lit door and windows facing up the walk.
    // The walls are grown, not boxed: buttresses every 7 to 9 m, arched niches (a seat in one, a sundial in another), faces that
    // bulge and lean by half a metre, rounded tops of uneven height.
    const rYf = fk.yewform, yewPos = [], yewCol = [], yewIdx = [], GATE_Z = ALLEY.z1 - ALLEY.thick / 2, PIER_X = 3.5, BAY = 36, BAY_D = 7.5;
    // (THE YEW'S SHADE, round 6: the yew itself is not drawn into the shadow map, 29 thousand triangles of it in every frame of
    // the flight; in its place a few plain boxes, each wholly INSIDE a wall, a hedge, a cone or a ball of yew (so that no eye
    // can see one), throw the shade. yewShade: x0, y0, z0, x1, y1, z1 of each.)
    const yewShade = [], shadeBox = (x0, y0, z0, x1, y1, z1) => { if (x1 - x0 > 0.1 && y1 - y0 > 0.1 && z1 - z0 > 0.1) yewShade.push([x0, y0, z0, x1, y1, z1]); };
    // (A GEOMETRY CUT BY PLACE: one geometry for each square of `cell` metres on the plan that holds a triangle's middle; the
    // pieces share the whole's attributes and keep its material groups, each with the bounds of its own triangles, so that a
    // piece behind the eye, or far outside the shadow map's box, is not drawn)
    // (round 7: its two passes over the triangles are two steps of the build, each a plain function of its own, a hand-back
    // between them)
    const cutByPlace = async (geo, cell) => { const st = cutCount(geo, cell); await ctx.yield(); return cutFill(geo, st); };
    const cutCount = (geo, cell) => {
      const ix = geo.index.array, pa = geo.attributes.position.array, groups = geo.groups.length ? geo.groups : [{ start: 0, count: ix.length, materialIndex: 0 }], k3 = 1 / (3 * cell);
      // (first every triangle's square and material are found and counted; then each square's own list is filled, material by material)
      // (triangles that follow one another lie mostly in one square: the lists are asked only when the square changes)
      const keyOf = new Int32Array(ix.length / 3), count = new Map(); let kLast = -1, kRun = 0;
      for (const gr of groups) for (let t = gr.start; t < gr.start + gr.count; t += 3) { const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3, key = ((Math.floor((pa[a] + pa[b] + pa[c]) * k3) + 512) * 1024 + Math.floor((pa[a + 2] + pa[b + 2] + pa[c + 2]) * k3) + 512) * 8 + gr.materialIndex;
        keyOf[t / 3] = key; if (key !== kLast) { if (kRun) count.set(kLast, (count.get(kLast) || 0) + kRun); kLast = key; kRun = 0; } kRun += 3; }
      if (kRun) count.set(kLast, (count.get(kLast) || 0) + kRun);
      return { ix, pa, keyOf, count };
    };
    const cutFill = (geo, st) => {
      const { ix, pa, keyOf, count } = st, cells = new Map();
      for (const key of [...count.keys()].sort((p1, p2) => p1 - p2)) { const ck = Math.floor(key / 8); let q = cells.get(ck); if (!q) cells.set(ck, q = { n: 0, at: new Map(), mats: [] }); q.at.set(key, q.n); q.mats.push([key % 8, q.n, count.get(key)]); q.n += count.get(key); }
      for (const q of cells.values()) { q.ix = new Uint32Array(q.n); q.b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; }
      let q = null, o = 0, b = null, kLast = -1;
      for (let t = 0; t < ix.length; t += 3, o += 3) { const key = keyOf[t / 3];
        if (key !== kLast) { if (q) q.at.set(kLast, o); kLast = key; q = cells.get(Math.floor(key / 8)); o = q.at.get(key); b = q.b; }
        for (let k = 0; k < 3; k++) { const i = ix[t + k], x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2]; q.ix[o + k] = i; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z; } }
      return [...cells.values()].map((q) => { const g = new THREE.BufferGeometry();
        for (const nm in geo.attributes) g.setAttribute(nm, geo.attributes[nm]);
        if (geo.groups.length) for (const mt of q.mats) g.addGroup(mt[1], mt[2], mt[0]);
        g.setIndex(new THREE.BufferAttribute(q.ix, 1)); g.boundingBox = new THREE.Box3(new THREE.Vector3(q.b[0], q.b[1], q.b[2]), new THREE.Vector3(q.b[3], q.b[4], q.b[5])); g.boundingSphere = g.boundingBox.getBoundingSphere(new THREE.Sphere()); return g; });
    };
    const yewBlock = (x0, x1, z0, z1, h, ny = 5, cellW = 1.05) => {
      // a box of yew: faces cut into squares, pushed in and out and shaded by a noise so that it reads as clipped growth
      const face = (o, du, dv, nu, nv, nrm) => {
        const first = yewPos.length / 3;
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
          const x = o[0] + du[0] * i / nu + dv[0] * j / nv, y = o[1] + du[1] * i / nu + dv[1] * j / nv, z = o[2] + du[2] * i / nu + dv[2] * j / nv;
          const edge = (i === 0 || i === nu || j === 0 || j === nv) ? 0 : 1, b = (0.2 * P.noise.n2(x * 0.5 + y * 0.31, z * 0.5 - y * 0.27) + 0.2 * P.noise.n2(x * 2.9 + y * 2.3, z * 2.9 - y * 1.7)) * edge;
          const shade = 0.6 + 0.9 * (P.noise.n2(x * 2.3 + y * 1.7 + 9, z * 2.3 + y + 4) * 0.5 + 0.5) + 0.3 * (y / h - 0.5);
          yewPos.push(x + nrm[0] * b, Math.max(0, y + nrm[1] * b), z + nrm[2] * b); yewCol.push(0.017 * shade, 0.03 * shade, 0.018 * shade);
        }
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = first + j * (nu + 1) + i, b2 = a + 1, c = a + nu + 1, d = c + 1; yewIdx.push(a, b2, c, b2, d, c); }
      };
      const nx = Math.max(1, Math.round((x1 - x0) / cellW)), nz = Math.max(1, Math.round(Math.abs(z1 - z0) / cellW)), zl = Math.min(z0, z1), zh = Math.max(z0, z1);
      { const ins = Math.min(0.3, (x1 - x0) / 4, (zh - zl) / 4, h / 4); shadeBox(x0 + ins, 0, zl + ins, x1 - ins, h - ins, zh - ins); }
      face([x0, 0, zh], [x1 - x0, 0, 0], [0, h, 0], nx, ny, [0, 0, 1]); face([x1, 0, zl], [x0 - x1, 0, 0], [0, h, 0], nx, ny, [0, 0, -1]);
      face([x1, 0, zh], [0, 0, zl - zh], [0, h, 0], nz, ny, [1, 0, 0]); face([x0, 0, zl], [0, 0, zh - zl], [0, h, 0], nz, ny, [-1, 0, 0]);
      face([x0, h, zh], [x1 - x0, 0, 0], [0, 0, zl - zh], nx, nz, [0, 1, 0]);
    };
    const yIn = ALLEY.half, yOut = ALLEY.half + ALLEY.thick;
    // a wall from zA (its south end) to zB on side sd (1: the east wall): a section every 0.85 m and at each jamb of a niche, each a ring of
    // points from the foot of the face on the walk, over the rounded top, to the foot of the back
    // (the ring: the face on the walk to where the shoulder begins, RT metres under the top; the shoulders and the top as one
    // rounded arch over the wall's whole thickness, nine points of it, squarer than a half round; the back down to its foot)
    const FACE = [0, 0.14, 0.3, 0.46, 0.6, 0.74, 0.87, 1], ARC = [20, 40, 58, 74, 90, 106, 122, 140, 160], BACK = [1, 0.66, 0.33, 0], RT = 1.25, RING = FACE.length + ARC.length + BACK.length;
    const yewWall = (sd, zA, zB, butts, niches) => {
      const zs = [], nzz = P.noise, first = yewPos.length / 3; let rows = 0, lastZ = Infinity;
      shadeBox(Math.min(sd * yIn, sd * yOut) + 0.4, 0, zB + 0.3, Math.max(sd * yIn, sd * yOut) - 0.4, ALLEY.high - 0.5, zA - 0.3);
      for (let z = zA; z > zB; z -= 0.85) zs.push(z);
      zs.push(zB);
      for (const n of niches) for (const d of [-1.3, -1.18, 1.18, 1.3]) if (n + d < zA && n + d > zB) zs.push(n + d);
      zs.sort((a, b) => b - a);
      for (const z of zs) {
        if (lastZ - z < 0.06) continue;
        lastZ = z; rows++;
        let bt = 0, nd = 9;
        for (const c of butts) bt = Math.max(bt, 1 - smoothstep(0.5, 1.0, Math.abs(z - c)));
        for (const c of niches) nd = Math.min(nd, Math.abs(z - c));
        const ni = nd < 1.24, archY = 3.3 - (nd / 1.24) * (nd / 1.24), h = ALLEY.high + 0.3 * nzz.n2(z * 0.09 + sd * 7, 3.3) + 0.4 * bt;
        // off: metres out of the face's plane toward the walk (negative: into the wall), with the wall's own lumps on top of it
        const pt = (off, y, dark) => {
          const lump = 0.22 * nzz.n3(z * 0.21, y * 0.3, sd * 5.1 + off * 0.2) + 0.04 * nzz.n3(z * 0.9 + 3, y * 0.9, sd * 2.3);
          const sh = (0.86 + 0.3 * (nzz.n3(z * 0.7 + 9, y * 0.6, sd * 4 + off) * 0.5 + 0.5) + 0.3 * (y / h - 0.5)) * dark;
          yewPos.push(sd * (yIn - off - lump), Math.max(0, y), z); yewCol.push(0.017 * sh, 0.03 * sh, 0.018 * sh);
        };
        const hs = h - RT;
        for (const f of FACE) { const y = f * hs, inN = ni && y < archY; pt(inN ? -1.25 : 0.85 * bt * (1 - 0.35 * y / h), y, inN ? 0.5 : 1); }
        for (const d of ARC) { const ca = Math.cos(d * DEG), kx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.62), ky = Math.pow(Math.sin(d * DEG), 0.72); pt(-(ALLEY.thick / 2) * (1 - kx) + 0.6 * bt * (0.5 + 0.5 * kx), hs + RT * ky, 1 + 0.2 * ky); }
        for (const f of BACK) pt(-ALLEY.thick, f * hs, 0.9);
      }
      for (let r = 0; r < rows - 1; r++) for (let i = 0; i < RING - 1; i++) { const a = first + r * RING + i, b = a + 1, c = a + RING, d = c + 1; if (sd > 0) yewIdx.push(a, b, c, b, d, c); else yewIdx.push(a, c, b, b, c, d); }
      // the two ends are closed (a fan from the first point of the ring, both ways round)
      for (const r of [0, rows - 1]) { const a = first + r * RING; for (let i = 1; i < RING - 1; i++) yewIdx.push(a, a + i, a + i + 1, a, a + i + 1, a + i); }
    };
    // where the buttresses stand (every 7 to 9 m) and which bays between them are niches
    const wallPlan = (zA, zB, nNiche) => {
      const butts = [], bays = [], niches = [];
      for (let z = zA - rYf.range(2, 4); z > zB + 2;) { butts.push(z); const step = rYf.range(7, 9); if (z - step > zB + 2) bays.push(z - step / 2); z -= step; }
      for (let k = 0; k < nNiche && bays.length; k++) niches.push(bays[Math.min(bays.length - 1, Math.floor((k + rYf.range(0.25, 0.75)) / nNiche * bays.length))]);
      return { butts, niches };
    };
    const eastW = wallPlan(ALLEY.z0, ALLEY.z1 + BAY, 2), westW = wallPlan(ALLEY.z0, ALLEY.z1, 3);
    yewWall(1, ALLEY.z0, ALLEY.z1 + BAY, eastW.butts, eastW.niches);
    await ctx.yield();
    yewWall(-1, ALLEY.z0, ALLEY.z1, westW.butts, westW.niches);
    await ctx.yield();
    // (the end hedge on either side of the gate's gap; the green's east hedge, and its return to the east wall's end)
    yewBlock(-yOut, -(PIER_X + 0.55), ALLEY.z1 - ALLEY.thick, ALLEY.z1, ALLEY.high); yewBlock(PIER_X + 0.55, yIn + BAY_D + 1.6, ALLEY.z1 - ALLEY.thick, ALLEY.z1, ALLEY.high);
    await ctx.yield();
    yewBlock(yIn + BAY_D, yIn + BAY_D + 1.6, ALLEY.z1, ALLEY.z1 + BAY + 1.6, ALLEY.high); yewBlock(yOut - 0.3, yIn + BAY_D, ALLEY.z1 + BAY, ALLEY.z1 + BAY + 1.6, ALLEY.high);
    await ctx.yield();
    // the garden's beds: four quarters hedged low with box, a clipped cone of yew in each, two taller drums by the walk into the alley
    const yewCone = (cx, cz, r, h) => {
      const first = yewPos.length / 3, seg = 10, rings = 5;
      shadeBox(cx - 0.5 * r, 0, cz - 0.5 * r, cx + 0.5 * r, 0.2 * h, cz + 0.5 * r); shadeBox(cx - 0.3 * r, 0, cz - 0.3 * r, cx + 0.3 * r, 0.58 * h, cz + 0.3 * r);
      for (let j = 0; j <= rings; j++) for (let i = 0; i < seg; i++) {
        const t = j / rings, a = i / seg * 6.2832, rr = r * (1 - 0.86 * t) * (j === 0 ? 0.85 : 1) + 0.12 * P.noise.n2(cx + i * 1.7, cz + j * 2.3), sh = 0.7 + 0.8 * (P.noise.n2(cx * 3 + i * 2.1, cz + j * 1.9) * 0.5 + 0.5) + 0.3 * (t - 0.5);
        yewPos.push(cx + Math.cos(a) * rr, t * h, cz + Math.sin(a) * rr); yewCol.push(0.017 * sh, 0.03 * sh, 0.018 * sh);
      }
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = first + j * seg + i, b = first + j * seg + (i + 1) % seg, c = a + seg, d = b + seg; yewIdx.push(a, c, b, b, c, d); }
      const top = yewPos.length / 3; yewPos.push(cx, h + 0.15, cz); yewCol.push(0.03, 0.05, 0.03);
      for (let i = 0; i < seg; i++) yewIdx.push(first + rings * seg + i, top, first + rings * seg + (i + 1) % seg);
    };
    // a clipped ball of yew (or, paler, the head of an orchard tree)
    const yewBall = (cx, cy, cz, r, tint = [1, 1, 1]) => {
      const first = yewPos.length / 3, seg = 10, rings = 5;
      shadeBox(cx - 0.5 * r, cy - 0.5 * r, cz - 0.5 * r, cx + 0.5 * r, cy + 0.5 * r, cz + 0.5 * r);
      for (let j = 0; j <= rings; j++) for (let i = 0; i < seg; i++) {
        const t = j / rings, el = (t - 0.5) * 3.0, a = i / seg * 6.2832 + j * 0.4, rr = r * Math.cos(el) * (1 + 0.05 * P.noise.n2(cx + i * 1.7, cz + j * 2.3)), sh = 0.85 + 0.35 * (P.noise.n2(cx * 3 + i * 2.1, cz + j * 1.9) * 0.5 + 0.5) + 0.4 * (t - 0.5);
        yewPos.push(cx + Math.cos(a) * rr, cy + r * Math.sin(el), cz + Math.sin(a) * rr); yewCol.push(0.017 * sh * tint[0], 0.03 * sh * tint[1], 0.018 * sh * tint[2]);
      }
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = first + j * seg + i, b = first + j * seg + (i + 1) % seg, c = a + seg, d = b + seg; yewIdx.push(a, c, b, b, c, d); }
    };
    // (the walls are old clipped work: over every buttress the yew is cut to a ball that stands on the wall's top)
    for (const [sd, plan] of [[1, eastW], [-1, westW]]) for (const zb2 of plan.butts) yewBall(sd * (yIn + ALLEY.thick / 2), ALLEY.high + 1.0, zb2, 1.05);
    const rGd = fk.garden, zgc = (zg0 + zg1) / 2, hedgeH = 0.75;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const xa = sx * 2.6, xb = sx * (gH - 2.4), za = zgc + sz * 2.6, zc = sz > 0 ? zg0 - 2.4 : zg1 + 2.4, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zc), z1 = Math.max(za, zc);
      yewBlock(x0, x1, z0, z0 + 0.6, hedgeH, 1, 1.6); yewBlock(x0, x1, z1 - 0.6, z1, hedgeH, 1, 1.6); yewBlock(x0, x0 + 0.6, z0 + 0.6, z1 - 0.6, hedgeH, 1, 1.6); yewBlock(x1 - 0.6, x1, z0 + 0.6, z1 - 0.6, hedgeH, 1, 1.6);
      // (the quarter's cone: its four draws are taken for every quarter; THE FAR WEST QUARTER HAS THE BASIN IN ITS PLACE, below)
      const cq = [rGd.range(-0.6, 0.6), rGd.range(-0.6, 0.6), rGd.range(1.5, 2.1), rGd.range(3.0, 4.2)];
      if (!(sx < 0 && sz < 0)) yewCone((x0 + x1) / 2 + cq[0], (z0 + z1) / 2 + cq[1], cq[2], cq[3]);
    }
    for (const sx of [-1, 1]) yewCone(sx * 4.2, zg1 + 3.4, 1.3, 2.6 + rGd.range(0, 0.6));
    // THE BEDS ARE FULL: in each quarter, round its cone, an oval of six clipped balls of box (each of its own size); a standard
    // (a ball of yew on a clean stem) inside each of its four corners; a short low hedge of box across each of its ends.
    // In the west quarter by the house a sundial stands on a round stone; in the east one a stone seat faces the walk.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const xa = sx * 2.6, xb = sx * (gH - 2.4), za = zgc + sz * 2.6, zc = sz > 0 ? zg0 - 2.4 : zg1 + 2.4, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zc), z1 = Math.max(za, zc), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      for (let k = 0; k < 6; k++) { const a = (k + 0.5) / 6 * 6.2832, r = rGd.range(0.6, 0.85); yewBall(cx + Math.cos(a) * 4.4, r * 0.75, cz + Math.sin(a) * 9.5, r); }
      for (const ux of [-1, 1]) for (const uz of [-1, 1]) { const px = cx + ux * ((x1 - x0) / 2 - 2.3), pz = cz + uz * ((z1 - z0) / 2 - 2.3); B.col(lin('#3a3028'), 0.8, 1.1).surf(SURF.PLANKS, 0).beam([px, 0, pz], [px, 1.6, pz], 0.1, 0.1); yewBall(px, 2.0, pz, 0.6); }
      for (const uz of [-1, 1]) yewBlock(cx - 2.2, cx + 2.2, cz + uz * 13.4 - 0.3, cz + uz * 13.4 + 0.3, 0.5, 1, 1.6);
    }
    // THE BASIN (round 11, A3): in the middle of the far west quarter, where its cone stood, A ROUND STONE BASIN 6.6 m across:
    // a kerb of dressed stone 0.42 m high and 0.4 m broad, lichened on its top, and still dark water within, a hand under the
    // kerb's top (BASIN_FRAG: it mirrors the sky and, from where the mirrored ray meets it, the moon). It lies on the moon's side
    // of the walk: coming down over the garden the moon's path crosses it. A lamp stands by it, and one at each of two corners
    // of the walks' crossing: lights of the place (plPut), each with its pool on the gravel and the box. No draw is taken.
    { const bcx = -(2.6 + gH - 2.4) / 2, bcz = (zgc - 2.6 + zg1 + 2.4) / 2, BR = 3.3;
      B.col(STONE_D, 0.8, 1.0).surf(SURF.MASONRY, 0).lathe(bcx, 0, bcz, [[BR, 0], [BR, 0.42]], 24);
      B.col(LICHEN, 0.55, 0.7).surf(SURF.PLAIN).lathe(bcx, 0.42, bcz, [[BR, 0], [BR - 0.4, 0]], 24);
      B.col(STONE_D, 0.6, 0.9).surf(SURF.PLAIN).lathe(bcx, 0.24, bcz, [[BR - 0.4, 0.18], [BR - 0.4, 0]], 24);
      const wg = own(new THREE.CircleGeometry(BR - 0.4, 24).rotateX(-Math.PI / 2)), skyA = new THREE.Color(H.sky.horizon ?? H.fog).multiplyScalar(0.7), skyB = new THREE.Color(H.sky.mid ?? H.fog).multiplyScalar(H.sky.mid ? 0.9 : 0.45);
      const wm = own(new THREE.ShaderMaterial({ vertexShader: BASIN_VERT, fragmentShader: BASIN_FRAG, fog: true, toneMapped: false,
        uniforms: { uMoonD: { value: P.M.clone().normalize() }, uMoonC: { value: new THREE.Color(H.moon ? (H.moon.color ?? '#eef2ff') : '#000000').multiplyScalar(H.moon ? H.moon.intensity : 0) }, uMoonR: { value: (H.moon ? H.moon.size : 3) * DEG },
          uDeep: { value: new THREE.Color('#05080b') }, uSkyA: { value: skyA }, uSkyB: { value: skyB }, uTime: { value: 0 }, fogColor: { value: new THREE.Color(0, 0, 0) }, fogDensity: { value: 0 } } }));
      const water = new THREE.Mesh(wg, wm); water.position.set(bcx, 0.3, bcz); water.name = 'the basin\'s water'; scene.add(water);
      updaters.push((dt, t) => { wm.uniforms.uTime.value = t; });
      scene.userData.basin = { x: bcx, z: bcz, r: BR, top: 0.42 };
      for (const [lx, lz, kind] of [[bcx + BR + 1.3, bcz + 2.2, 'basin lamp'], [-2.25, zgc + 2.25, 'garden lamp'], [2.25, zgc - 2.25, 'garden lamp']]) {
        if (!laneOk(kind, lx, lz, 0.35, 0, 3.0)) continue;
        B.col(IRON).surf(SURF.PLAIN).beam([lx, 0, lz], [lx, 2.3, lz], 0.1, 0.1).cbox(lx, 2.3, lz, 0.36, 0.52, 0.36).cbox(lx, 2.82, lz, 0.46, 0.06, 0.46);
        B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lx, 2.36, lz, 0.26, 0.38, 0.26);
        lanternPts.push([lx, 2.6, lz, 0.9]); plPut(lx, 2.6, lz, 11, GOLD, 1.7); } }
    { const bx = (2.6 + gH - 2.4) / 2, bz = zg0 - 2.4 - 4.2;
      B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).lathe(-bx, 0, bz, [[0.9, 0], [0.9, 0.12], [0, 0.12]], 12);
      B.col(LICHEN, 0.9, 1.1).surf(SURF.PLAIN).lathe(-bx, 0.12, bz, [[0.34, 0], [0.34, 0.12], [0.16, 0.2], [0.12, 0.5], [0.19, 0.72], [0.12, 0.95], [0.3, 1.08], [0.34, 1.14], [0, 1.14]], 10);
      B.col(lin('#6a7a70')).surf(SURF.PLAIN).beam([-bx, 1.27, bz + 0.22], [-bx, 1.54, bz - 0.2], 0.03, 0.2);
      B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).box(bx - 1.0, 0.44, bz - 0.3, bx + 1.0, 0.56, bz + 0.3).box(bx - 1.0, 0.56, bz + 0.2, bx + 1.0, 1.0, bz + 0.3);
      for (const dx of [-0.75, 0.75]) B.col(STONE_D).surf(SURF.MASONRY, 0).cbox(bx + dx, 0, bz, 0.22, 0.44, 0.5, { m: 1 }); }
    // THE WELL at the garden's middle, on the round of gravel: a stone ring, two posts, a little slate roof over the windlass
    B.col(STONE, 0.85, 1.05).surf(SURF.MASONRY, 0).lathe(0, 0, zgc, [[1.15, 0], [1.15, 0.85], [1.0, 0.95], [0.8, 0.95], [0.8, 0.3], [0, 0.3]], 12);
    B.col(WOOD, 0.8, 1).surf(SURF.PLANKS, 0).beam([-1.0, 0.9, zgc], [-1.0, 2.5, zgc], 0.16, 0.16).beam([1.0, 0.9, zgc], [1.0, 2.5, zgc], 0.16, 0.16).beam([-1.1, 1.9, zgc], [1.1, 1.9, zgc], 0.14, 0.14);
    B.col(SLATE).surf(SURF.TILES, 0).gable(-1.5, zgc - 0.9, 1.5, zgc + 0.9, 2.5, 0.8, { alongX: true, overhang: 0.15, wallColor: WOOD, m: 0.6 });
    // THE ORCHARD, east of the yew alley: a walled close that joins the garden's south wall (a gap for its gate in the east wall),
    // three rows of five old apple trees, round-headed on short trunks, no taller than 4.3 m (the owl's air is over them)
    const OR = { x0: yOut + 3.2, x1: yOut + 31, z0: zg1, z1: zg1 - 44 }, rOr = fk.orchard;
    wallRun(gH, OR.z0, OR.x1, OR.z0, 1.7); wallRun(OR.x1, OR.z0, OR.x1, OR.z0 - 16, 1.7); wallRun(OR.x1, OR.z0 - 19.5, OR.x1, OR.z1, 1.7); wallRun(OR.x0, OR.z1, OR.x1, OR.z1, 1.7);
    pier(OR.x1, OR.z0 - 16, 2.2, false); pier(OR.x1, OR.z0 - 19.5, 2.2, false);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
      const x = OR.x0 + 4.5 + r * 8.4 + rOr.range(-0.6, 0.6), z = OR.z0 - 5 - k * 8.4 + rOr.range(-0.6, 0.6), hr = rOr.range(1.4, 1.75), th = rOr.range(1.3, 1.7), lx = rOr.range(-0.3, 0.3), lz = rOr.range(-0.3, 0.3);
      B.col(lin('#3a3028'), 0.8, 1.1).surf(SURF.PLANKS, 0).beam([x, -0.2, z], [x + lx, th + 0.4, z + lz], 0.3, 0.3); hard.push([x, z, HARD.orchard, 'orchard tree']);
      // (its head: two balls of leaf run together, the lesser to one side)
      const oa = rOr.range(0, 6.28); yewBall(x + lx, th + hr * 0.75, z + lz, hr, [1.5, 1.45, 1.0]); yewBall(x + lx + Math.cos(oa) * hr * 0.6, th + hr * 0.95, z + lz + Math.sin(oa) * hr * 0.6, hr * 0.68, [1.6, 1.5, 1.0]);
    }
    await ctx.yield();
    // a stone seat in the first niche of the east wall, a sundial on a baluster in a niche of the west wall, an urn in another
    const nicheSeat = eastW.niches[0], nicheDial = westW.niches[0], nicheUrn = westW.niches.length > 1 ? westW.niches[westW.niches.length - 1] : undefined;
    if (nicheSeat !== undefined) { B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).box(yIn + 0.25, 0.44, nicheSeat - 0.95, yIn + 0.85, 0.56, nicheSeat + 0.95); for (const dz of [-0.7, 0.7]) B.col(STONE_D).surf(SURF.MASONRY, 0).cbox(yIn + 0.55, 0, nicheSeat + dz, 0.45, 0.44, 0.22, { m: 1 }); }
    if (nicheDial !== undefined) { B.col(LICHEN, 0.9, 1.1).surf(SURF.PLAIN).lathe(-(yIn + 0.5), 0, nicheDial, [[0.34, 0], [0.34, 0.12], [0.16, 0.2], [0.12, 0.5], [0.19, 0.72], [0.12, 0.95], [0.3, 1.08], [0.34, 1.14], [0, 1.14]], 10);
      B.col(lin('#6a7a70')).surf(SURF.PLAIN).beam([-(yIn + 0.5), 1.15, nicheDial + 0.22], [-(yIn + 0.5), 1.42, nicheDial - 0.2], 0.03, 0.2); }
    if (nicheUrn !== undefined) { B.col(STONE, 0.9, 1).surf(SURF.MASONRY, 0).cbox(-(yIn + 0.55), 0, nicheUrn, 0.7, 0.9, 0.7, { m: 0.8 }); B.col(LICHEN).surf(SURF.PLAIN).lathe(-(yIn + 0.55), 0.9, nicheUrn, [[0.15, 0], [0.12, 0.18], [0.36, 0.5], [0.42, 0.74], [0.33, 0.8], [0, 0.8]], 8); }
    const yewGeo = new THREE.BufferGeometry();
    yewGeo.setAttribute('position', new THREE.Float32BufferAttribute(yewPos, 3));
    await ctx.yield();
    yewGeo.setAttribute('color', new THREE.Float32BufferAttribute(yewCol, 3)); yewGeo.setIndex(yewIdx);
    await ctx.yield();
    // (the yew's normals, as computeVertexNormals makes them (each face's cross product summed at its three corners, then made
    // of length 1), worked on the plain arrays and in steps of 40,000 faces, so that no step of it is long)
    { const ps = yewGeo.attributes.position.array, ix = yewGeo.index.array, nr = new Float32Array(ps.length);
      for (let i = 0; i < ix.length; i += 3) {
        const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3, ux = ps[c] - ps[b], uy = ps[c + 1] - ps[b + 1], uz = ps[c + 2] - ps[b + 2], vx = ps[a] - ps[b], vy = ps[a + 1] - ps[b + 1], vz = ps[a + 2] - ps[b + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nr[a] += nx; nr[a + 1] += ny; nr[a + 2] += nz; nr[b] += nx; nr[b + 1] += ny; nr[b + 2] += nz; nr[c] += nx; nr[c + 1] += ny; nr[c + 2] += nz;
        if (i % 120000 === 119997) await ctx.yield();
      }
      for (let k = 0; k < nr.length; k += 3) { const h = Math.hypot(nr[k], nr[k + 1], nr[k + 2]) || 1; nr[k] /= h; nr[k + 1] /= h; nr[k + 2] /= h; }
      yewGeo.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); }
    await ctx.yield();
    // its leaves are drawn in the material: A FINE DARK LEAF. Three sizes of leaf over the clipped faces (clumps a forearm
    // across, faint; sprays a hand across; needles), each a soft tone no more than a third lighter or darker than the wall and
    // each going to its mean with distance; a floor of its own colour so that the wall the moon does not reach still shows
    // its growth; and THE TOPS ARE MOONLIT: what looks up takes the moon's colour, so that the rounded shoulders and the balls
    // are drawn pale over the dark faces
    // (ROUND 11, A3: WHY THE YEW READ BRIGHT AND UNLIT AT NIGHT, AND ITS CURE. That floor was 1.5 times the leaf's own colour,
    // given off by every face whatever light reached it, and the tops gave off 3 times the moon's colour: against a leaf that
    // gives back 3 parts in a hundred of the light on it, the floor and the tops were most of what the eye got, the same on
    // the moon's side and in the shade. Now, under a moon, the floor is 0.3 and the tops' share 1.6 (YEW_FLOOR, YEW_TOP: by the
    // hour's own night; the day keeps what it had): the walls are dark, old and deep, and what shows on them is light that
    // falls on them: the moon on the faces and shoulders turned to it, inside the shadow map's shade, and the walk's lamps
    // raking along them (the lamps' share on the yew is 2, was 1.4, and it wraps the wall less: 0.2, was 0.45. A share of 5
    // lights every wall olive from end to end (a lamp reaches 12 m and one stands every 12.8 m of the walk); at 2 a lamp has its own pool on the wall).)
    // POLISH 1, STAGE B: WHY THE WALL IN SHADE WAS A BLACK MASS, AND ITS CURE. The west wall's face looks away from the moon for
    // its whole length; its leaf gave back 3 parts in a hundred, and with that floor of 0.3 and the sky's fill it stood at
    // less than half of the picture's black (0.0325 of scene light: the post draws all under it as 0); a lamp lifted its own
    // wall over the black within a metre and a half of itself. Five things, each one figure:
    // (1) THE LEAF IS TWICE AS PALE FOR EVERY LIGHT (YEW_LEAF, in the leaf's own lines): at every hour.
    // (2) THE TOPS AND SHOULDERS ARE LIT BY THE HOUR'S ONE LIGHT, through the shadow map, as the ground is: under a moon the
    //     glow on whatever looks up (YEW_TOP) is out; it was the same in shade and on the side from the moon. By the hour's
    //     night: out at night and at golden hour; BY DAY it keeps what it gave (its figure halved on the leaf made double).
    //     AT DAWN IT DOES NOT QUITE (the hour's night is 0.6: 0.156 of the way to the night's figures): the top's glow is
    //     0.91 of live's (2.53 against 2.78, on the leaf made double) and the floor of (3) is 1.07 of live's (1.41 against
    //     1.31).
    // (3) THE FLOOR IS THE SKY'S: it has the night's own fill colour, half way to white, and is white at the other hours
    //     (uYewFloor, at the floor's strength; the mending's note at the floor's colour below), and
    //     goes by how much sky a place of the yew sees: by its height (0.85 at the foot to 1.25 from 2.75 m up, where the
    //     wall's shoulder begins) and by how far its face looks up (1.4 on a top, 0.6 under an overhang), so that the
    //     clipped lumps are modelled from above. Its strength by the hour's night: 0.45 at night and at golden hour (the
    //     shaded face at about a third of the lit gravel); by day what it gave before.
    // (4) THE LAMPS THAT STAND take 1.5 of the leaf (on the leaf made double; was 2) and wrap the wall half as far (0.1): a
    //     lamp's pool is warm on the leaf about it and its rake shows the lumps and buttresses. No lamp is added or moved.
    // (5) the program's key.
    const YEW_NIGHT = smoothstep(0.5, 0.9, H.night), YEW_LEAF = 2, YEW_FLOOR = lerp(1.5 / YEW_LEAF, 0.45, YEW_NIGHT), YEW_TOP = (H.moon ? lerp(3.0, 0, YEW_NIGHT) : 1.0) / YEW_LEAF;
    const yewMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), yewT = { value: 0 };
    // (the floor's colour: the hour's own fill brought half way to white, made of the floor's strength: its hue, not its
    // weight. With the fill's whole hue the golden hour's violet fill turned the green leaf to grey stone.)
    // (POLISH 1, MENDING 1: half the fill's hue still made grey-olive stone of the leaf at golden hour. THE FLOOR IS WHITE at
    // every hour that names no `yewHue`: the leaf's own green is carried by the floor's strength, and the hour's fill gives
    // its tint through the sky's own light on the leaf and no more. The night names 0.5 and its walk is as it was.)
    const yewLum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, yewFloorC = new THREE.Color(H.ambient);
    yewFloorC.multiplyScalar(1 / yewLum(yewFloorC)).lerp(new THREE.Color(1, 1, 1), 1 - (H.yewHue ?? 0)); yewFloorC.multiplyScalar(YEW_FLOOR / yewLum(yewFloorC));
    // (the walk's lamps glow on the wall by the place's own law of its lights, lampsOn below)
    yewMat.onBeforeCompile = (sh) => {
      sh.uniforms.uYewT = yewT; sh.uniforms.uYewMoon = { value: new THREE.Color(H.light).multiplyScalar(YEW_TOP) }; sh.uniforms.uYewFloor = { value: yewFloorC };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vYew;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvYew = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vYew;
        uniform float uYewT;
        uniform vec3 uYewFloor;
        uniform vec3 uYewMoon;
        float yewH(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
        float yewN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(yewH(i), yewH(i + vec3(1, 0, 0)), f.x), mix(yewH(i + vec3(0, 1, 0)), yewH(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(yewH(i + vec3(0, 0, 1)), yewH(i + vec3(1, 0, 1)), f.x), mix(yewH(i + vec3(0, 1, 1)), yewH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        // (the leaf pattern is in the wall's own metres, three sizes of it; each fades to its mean only when a pixel covers more of the wall than
        // its grain, judged by the pixel's own two spans together, so that the pattern holds at grazing angles down the walk)
        float yewFw = sqrt(length(dFdx(vYew)) * length(dFdy(vYew)));
        // (clumps a forearm across, sprays a hand across, needles: each is cut hard, light leaf against dark, and between the sprays
        // the wall is deep shade)
        float yewA = yewN(vYew * 2.2), yewB = yewN(vYew * 9.0 + 3.1), yewC = yewN(vYew * 31.0 + 7.7);
        float yewKa = 1.0 - smoothstep(0.35, 1.4, yewFw), yewKb = 1.0 - smoothstep(0.08, 0.32, yewFw), yewKc = 1.0 - smoothstep(0.025, 0.09, yewFw);
        float yewL = mix(0.5, smoothstep(0.15, 0.85, yewA), yewKa) * 0.16 + mix(0.5, smoothstep(0.36, 0.64, yewB), yewKb) * 0.42 + mix(0.5, smoothstep(0.42, 0.58, yewC), yewKc) * 0.42;
        float yewGap = mix(0.85, smoothstep(0.15, 0.5, yewB * 0.5 + yewC * 0.5), yewKb);
        // the wind going down the walls: a slow wave of lighter and darker leaf
        float yewGust = 1.0 + 0.12 * sin(vYew.z * 0.55 + vYew.y * 0.9 - uYewT * 1.7) * sin(vYew.z * 0.13 + vYew.x * 0.4 + uYewT * 0.6);
        diffuseColor.rgb *= ${YEW_LEAF.toFixed(1)} * (0.72 + 0.56 * yewL) * (0.72 + 0.28 * yewGap) * yewGust;`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float yewUp = dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz));\n  totalEmissiveRadiance += diffuseColor.rgb * (uYewFloor * (mix(0.85, 1.25, clamp(vYew.y / ' + (ALLEY.high - RT).toFixed(2) + ', 0.0, 1.0)) * (1.0 + 0.4 * yewUp)) + uYewMoon * smoothstep(0.15, 0.9, yewUp)); }');
    };
    yewMat.customProgramCacheKey = () => 'moor-yew-14';
    lampsOn(yewMat, 'yew', { world: 'vYew', soft: 0.1, k: 1.5 });
    // (the yew is drawn in pieces, one for each 64 m square of the plan, and takes shadow; its shade is thrown by yewShade's boxes.
    // Round 11: the squares were 48 m and the shade's 96 m; with 64 m and one piece for all the shade the garden is drawn in
    // seven draws fewer, which pays for the wrack across the moon and the basin's water: the frame's draws are not more.)
    for (const g of await cutByPlace(yewGeo, 64)) { const yewMesh = new THREE.Mesh(g, yewMat); yewMesh.receiveShadow = true; yewMesh.name = 'yew'; scene.add(yewMesh); }
    await ctx.yield();
    { const sp = [], si = [];
      for (const b of yewShade) { const o = sp.length / 3; for (let k = 0; k < 8; k++) sp.push(b[k & 1 ? 3 : 0], b[k & 2 ? 4 : 1], b[k & 4 ? 5 : 2]);
        for (const f of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]) si.push(o + f[0], o + f[1], o + f[2], o + f[0], o + f[2], o + f[3]); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
      const shadeMat = own(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
      for (const g of await cutByPlace(sg, 600)) { const shade = new THREE.Mesh(g, shadeMat); shade.castShadow = true; shade.name = 'yew, its shade'; scene.add(shade); } }
    await ctx.yield();
    // THE GATE at the alley's far end, in the gap of the end hedge: two stone piers 7 m apart, each with a great iron lantern on its
    // top, lit; between them a low wall of moor stone, and in its middle the white wicket, standing open on the moor side. The old
    // way begins at the wicket.
    for (const sx of [-1, 1]) {
      pier(sx * PIER_X, GATE_Z, 3.0, false);
      B.col(STONE_D, 0.85, 1).surf(SURF.MASONRY, 0).box(Math.min(sx * 0.62, sx * (PIER_X - 0.45)), 0, GATE_Z - 0.35, Math.max(sx * 0.62, sx * (PIER_X - 0.45)), 1.05, GATE_Z + 0.35, { m: 0.6 });
      B.col(STONE).surf(SURF.MASONRY, 0).cbox(sx * 0.62, 0, GATE_Z, 0.34, 1.2, 0.34, { m: 0.8 }); B.col(LICHEN).surf(SURF.PLAIN).cbox(sx * 0.62, 1.2, GATE_Z, 0.44, 0.1, 0.44);
      B.col(IRON).surf(SURF.PLAIN).cbox(sx * PIER_X, 3.2, GATE_Z, 0.56, 0.9, 0.56).cbox(sx * PIER_X, 4.1, GATE_Z, 0.72, 0.1, 0.72);
      B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(sx * PIER_X, 3.3, GATE_Z, 0.42, 0.66, 0.42);
      laneNote('gate lamp', laneDist(sx * PIER_X, GATE_Z, 0.4, 3.2, 4.2));
      passages['the wicket gate'].push(['pier and its lamp', sx * PIER_X - 0.85, sx * PIER_X + 0.85, GATE_Z - 0.85, GATE_Z + 0.85, 0, 4.2], ['wicket post', sx * 0.62 - 0.22, sx * 0.62 + 0.22, GATE_Z - 0.22, GATE_Z + 0.22, 0, 1.3],
        ['gate wall', Math.min(sx * 0.62, sx * (PIER_X - 0.45)), Math.max(sx * 0.62, sx * (PIER_X - 0.45)), GATE_Z - 0.35, GATE_Z + 0.35, 0, 1.05]);
      lanternPts.push([sx * PIER_X, 3.65, GATE_Z, 0.8]); plPut(sx * (PIER_X - 0.5), 3.5, GATE_Z + 0.6, 11, GOLD, 1.4);
    }
    B.col(WHITE).surf(SURF.PLAIN);
    for (let i = 0; i <= 5; i++) B.cbox(-0.72, 0.18, GATE_Z - 0.28 - i * 0.2, 0.05, 0.95 + (i % 2) * 0.06, 0.06);
    B.box(-0.75, 0.32, GATE_Z - 1.34, -0.69, 0.4, GATE_Z - 0.22).box(-0.75, 0.86, GATE_Z - 1.34, -0.69, 0.94, GATE_Z - 0.22);
    // THE PARK'S WALL: moor stone, PARK_WALL metres high under a coping, round the whole park: from the lodge gates' pillars along
    // the park's south side, down its east and west sides at the edge of the park's level ground, and along its north side to
    // the yew alley's end hedge either side of the wicket gate. Outside it the moor begins.
    { const PARK_WALL = 1.9, px = 64.3, zs = -9, xh = ALLEY.half + ALLEY.thick + BAY_D + 0.4;
      for (const sx of [-1, 1]) { wallRun(sx * 4.4, zs, sx * px, zs, PARK_WALL); wallRun(sx * px, zs, sx * px, GATE_Z, PARK_WALL); wallRun(sx * xh, GATE_Z, sx * px, GATE_Z, PARK_WALL); }
      laneNote('park wall', Math.min(laneBox(4.1, px + 0.4, zs - 0.4, zs + 0.4, PARK_WALL + 0.2), laneBox(-px - 0.4, -4.1, zs - 0.4, zs + 0.4, PARK_WALL + 0.2), laneBox(xh - 0.3, px + 0.4, GATE_Z - 0.4, GATE_Z + 0.4, PARK_WALL + 0.2), laneBox(-px - 0.4, -xh + 0.3, GATE_Z - 0.4, GATE_Z + 0.4, PARK_WALL + 0.2))); }
    await ctx.yield();
    // LAMPS ALONG THE YEW WALK: iron posts with lanterns in the grass strips, 1.4 m out of the hedge's face, one every 12 to 13 m, on
    // the west and the east side by turns, from 6 m inside the alley's head to 14 m short of its end. Each is a light of the place
    // (plPut): its pool lies on gravel and grass and its glow on the yew behind it.
    { const zA = ALLEY.z0 - 6, zB = ALLEY.z1 + 14, nL = Math.max(2, Math.floor((zA - zB) / 12) + 1);
      for (let k = 0; k < nL; k++) {
        const lz = zA - k * (zA - zB) / (nL - 1), lx = (k % 2 ? 1 : -1) * (yIn - 1.4);
        if (!laneOk('alley lamp', lx, lz, 0.35, 0, 3.0)) continue;
        B.col(IRON).surf(SURF.PLAIN).beam([lx, 0, lz], [lx, 2.3, lz], 0.1, 0.1).cbox(lx, 2.3, lz, 0.36, 0.52, 0.36).cbox(lx, 2.82, lz, 0.46, 0.06, 0.46);
        B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lx, 2.36, lz, 0.26, 0.38, 0.26);
        lanternPts.push([lx, 2.6, lz, 0.65]); plPut(lx - Math.sign(lx) * 0.35, 2.6, lz, 12, GOLD, 1.9);
      } }
    // THE OLD SUMMER HOUSE, at the far end of the green beside the alley's end: boarded, slated, LIT. It faces up the walk: its
    // door stands open on a lamp within and a small window either side of the door is lit; one more window looks on the walk;
    // a lantern hangs over its door. Its gold lies on the green before it and on the walk beside it.
    const SH = { x0: yIn + 0.4, x1: yIn + 5.8, z0: ALLEY.z1 + 1.3, z1: ALLEY.z1 + 5.9 }, shx = (SH.x0 + SH.x1) / 2, shz = (SH.z0 + SH.z1) / 2;
    B.col(WOOD, 0.8, 1).surf(SURF.PLANKS, 0).box(SH.x0, 0, SH.z0, SH.x1, 2.9, SH.z1, { m: 0.8, top: false });
    B.col(SLATE).surf(SURF.TILES, 0).hip(SH.x0, SH.z0, SH.x1, SH.z1, 2.9, 1.8, { overhang: 0.45, ridge: 0 });
    B.col(STONE, 0.9, 1.05).surf(SURF.PLAIN).box(shx - 1.2, 0, SH.z1, shx + 1.2, 0.16, SH.z1 + 0.7);
    B.col(lin('#ffb866'), 1.8, 1.8).surf(SURF.GLOW, 0, 1).box(shx - 0.8, 0.16, SH.z1, shx + 0.8, 2.2, SH.z1 + 0.04).box(SH.x0 + 0.35, 1.1, SH.z1, SH.x0 + 1.15, 2.0, SH.z1 + 0.04).box(SH.x1 - 1.15, 1.1, SH.z1, SH.x1 - 0.35, 2.0, SH.z1 + 0.04).box(SH.x0 - 0.04, 1.1, shz - 0.5, SH.x0, 2.0, shz + 0.5);
    B.col(IRON).surf(SURF.PLAIN).cbox(shx, 2.45, SH.z1 + 0.35, 0.3, 0.42, 0.3); B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(shx, 2.5, SH.z1 + 0.35, 0.2, 0.3, 0.2);
    lanternPts.push([shx, 2.65, SH.z1 + 0.35, 1.0]); plPut(shx, 2.0, SH.z1 + 2.2, 13, GOLD, 1.6); plPut(SH.x0 - 1.7, 1.7, shz, 8.5, GOLD, 0.9);
    await ctx.yield();

    // ---- trees: the avenue (old oaks meeting overhead), a few more about the park, wind-bent thorns on the moor
    const wind = flora.makeWind({ direction: [-0.8, 0.45], strength: 0.9, speed: 0.8 });
    // (ROUND 11, A3: THE LEAVES WERE LIT BY THE SKY'S FILL ALONE, 3.4 times over: the oaks read bright
    // green and flat at night. Under a moon the fill's share is now 1.5 on the leaf and 1.9 on the wood, and what the moon
    // sends through a leaf seen against it is more (backlight 1.0, was 0.6): a tree is a dark mass with a lit rim on the
    // moon's side. The day keeps what it had.)
    const LEAF_NIGHT = smoothstep(0.5, 0.9, H.night);
    const leafOpts = { wind, backlight: lerp(0.6, 1.0, LEAF_NIGHT), backlightTint: '#dfe2da', ambient: lerp(3.0, 1.9, LEAF_NIGHT), leafAmbient: lerp(3.4, 1.5, LEAF_NIGHT) };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMat = flora.windMaterial(leafOpts);
    // (the oaks' bark is a dark grey-brown (oakPal), and a face turned from its lamp takes little of it: a trunk is gilded on
    // the side that looks at its lamp)
    lampsOn(leafMat, 'leaf', { world: 'vFloraWorld', soft: 0.65, k: 0.9 });
    await ctx.yield();
    const rA = fk.avenue, rPk = fk.park, rOg = fk.oakgeo, oakPal = { leaf: '#52642f', leafLight: '#84843e', leafDark: '#34442a', bark: '#4a4338', barkDark: '#27231f' };
    // THE AVENUE: five pairs of old oaks 14 m tall, 7.6 to 9.1 m either side of the drive and 8 m from pair to pair, their crowns
    // meeting over it as a tunnel with the hall at its end. The first pair stands some 26 m down the drive: 15 m and a crown's reach before it there is nothing (an arrival comes out of its portal into the open
    // head of the avenue). The drive's oaks are kept as a drive's oaks are: of two shapes grown for it, every bough and leaf that could come
    // within LANE metres of the line we fly (2.5 m and half a metre for the wind's sway) is cut away, for every place and size a tree of
    // its row may have (the right row stands as grown, the left row turned half round, which is the same cut). Park oaks are two other
    // shapes, uncut, and stand a crown's reach and that lane from the line.
    const LANE = 3.0, AV_X = [7.6, 8.35, 9.1], AV_S = [0.92, 1.0, 1.08], AV_Y = [EYE0, EYE0 + 2.9];
    const pruneLane = (g) => {
      const ps = g.attributes.position, ix = g.index.array, keep = [], q = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      let reach = 0;
      for (let i = 0; i < ix.length; i += 3) {
        for (let k = 0; k < 3; k++) { q[k * 3] = ps.getX(ix[i + k]); q[k * 3 + 1] = ps.getY(ix[i + k]); q[k * 3 + 2] = ps.getZ(ix[i + k]); }
        let hit = false;
        // (seven places on each triangle: its corners, the middles of its sides, its middle)
        for (let k = 0; k < 7 && !hit; k++) {
          const a = k < 3 ? k : k < 6 ? k - 3 : 0, b = k < 3 ? k : k < 6 ? (k - 2) % 3 : 1, c = k < 6 ? b : 2, f = k < 6 ? 2 : 3;
          const lx = (q[a * 3] + q[b * 3] + (k < 6 ? 0 : q[c * 3])) / f, ly = (q[a * 3 + 1] + q[b * 3 + 1] + (k < 6 ? 0 : q[c * 3 + 1])) / f;
          for (const sA of AV_S) for (const xA of AV_X) { const xw = xA + sA * lx, yw = sA * ly, dy = yw < AV_Y[0] ? AV_Y[0] - yw : yw > AV_Y[1] ? yw - AV_Y[1] : 0; if (xw * xw + dy * dy < LANE * LANE) hit = true; }
        }
        if (!hit) { keep.push(ix[i], ix[i + 1], ix[i + 2]); for (let k = 0; k < 3; k++) reach = Math.max(reach, Math.hypot(q[k * 3], q[k * 3 + 2])); }
      }
      g.setIndex(keep); g.userData.triangles = keep.length / 3; g.userData.reach = reach;
      return g;
    };
    // (an old oak's trunk STANDS: below where its boughs leave it (0.42 of its height) the kit's trunk is brought back over its own
    // foot, band by band, and made thicker toward the ground, half as thick again at the root; the lean is left to the boughs)
    const standOak = (g, H) => {
      const ps = g.attributes.position, TL = H * 0.42, NB = 8, cx = new Float32Array(NB + 1), cz = new Float32Array(NB + 1), cn = new Float32Array(NB + 1);
      for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); if (y > TL || Math.hypot(ps.getX(i), ps.getZ(i)) > 1.6) continue; const b = Math.min(NB, Math.round(y / TL * NB)); cx[b] += ps.getX(i); cz[b] += ps.getZ(i); cn[b]++; }
      for (let b = 0; b <= NB; b++) if (cn[b]) { cx[b] /= cn[b]; cz[b] /= cn[b]; }
      const at = (arr, y) => { const f = clamp(y / TL, 0, 1) * NB, b = Math.min(NB - 1, Math.floor(f)); return lerp(arr[b], arr[b + 1], f - b); };
      for (let i = 0; i < ps.count; i++) { const y = ps.getY(i), x = ps.getX(i), z = ps.getZ(i); if (y > TL) continue; const ox = at(cx, y), oz = at(cz, y); if (Math.hypot(x - ox, z - oz) > 1.3) continue;
        const keep = smoothstep(0.6, 1, y / TL), thick = lerp(1.5, 1.0, smoothstep(0, 1, y / TL)); ps.setX(i, ox * keep + (x - ox) * thick); ps.setZ(i, oz * keep + (z - oz) * thick); }
      // (the kit's own normals are kept: its leaves carry normals made for their light)
      ps.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    };
    const oaks = [];
    for (let i = 0; i < 4; i++) { const g = standOak(flora.oakGeometry({ rng: rOg, height: i < 2 ? 14 : 15, detail: 1, fullness: 1.15, flex: 0.6, ...oakPal }), i < 2 ? 14 : 15); await ctx.yield(); oaks.push(i < 2 ? pruneLane(g) : g); await ctx.yield(); }
    const oakReach = Math.max(...oaks.map((g) => { if (g.userData.reach === undefined) { const ps = g.attributes.position; let r = 0; for (let k = 0; k < ps.count; k++) r = Math.max(r, Math.hypot(ps.getX(k), ps.getZ(k))); g.userData.reach = r; } return g.userData.reach; }));
    // wind-bent thorns: the kit's bare tree, leaned over by the square of its height as the moor's wind leans a thorn (toward its own +x)
    const bendThorn = (g, k) => { const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i), t = y / 5; ps.setX(i, ps.getX(i) * (1 + 0.5 * t) + k * 5 * t * t); ps.setY(i, y * (1 - 0.1 * k * t)); } ps.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox(); return g; };
    const thornGeos = [0.42, 0.62].map((k) => bendThorn(flora.deadTreeGeometry({ rng: fk.thorngeo, height: 5, detail: 1, bark: '#3a342e' }), k));
    await ctx.yield();
    // (and two dead trees weathered grey by the mire's water, which stand in it further on: stouter by a third than the kit grows
    // them, their bark the grey of old wood under a moon, no paler than the stone)
    const stout = (g, k) => { const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) { ps.setX(i, ps.getX(i) * k); ps.setZ(i, ps.getZ(i) * k); } ps.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox(); return g; };
    for (let k = 0; k < 2; k++) thornGeos.push(stout(flora.deadTreeGeometry({ rng: fk.deadgeo, height: 6, detail: 1, bark: '#878173', barkDark: '#4a463e', barkLight: '#a8a292' }), 1.3));
    await ctx.yield();
    // (the great bog oaks of the wand path: the kit's dead tree at 10 m, stouter by a quarter; bogReach is how far a bough reaches)
    const bogGeos = [0, 1].map(() => stout(flora.deadTreeGeometry({ rng: fk.bogoak, height: 10, detail: 1, bark: '#6f6a5e', barkDark: '#383630', barkLight: '#958f80' }), 1.25));
    const bogReach = Math.max(...bogGeos.map((g) => { const ps = g.attributes.position; let r = 0; for (let k = 0; k < ps.count; k++) r = Math.max(r, Math.hypot(ps.getX(k), ps.getZ(k))); return r; }));
    await ctx.yield();
    // (the drowned trees of the mire are the kit's dead tree too, bleached paler: two light ones, variants 4 and 5, for the
    // many that stand about the mire; the stand of them beside the wand path takes the two weathered ones above. A tree's
    // reach is how far its boughs go from its foot.)
    const reachOf = (g) => { const ps = g.attributes.position; let r = 0; for (let k = 0; k < ps.count; k++) r = Math.max(r, Math.hypot(ps.getX(k), ps.getZ(k))); return r; };
    for (let k = 0; k < 2; k++) thornGeos.push(stout(flora.deadTreeGeometry({ rng: fk.drownedgeo, height: 6, detail: 0, bark: '#8d897a', barkDark: '#55524a', barkLight: '#b0ab9a' }), 1.5));
    const deadReach = Math.max(reachOf(thornGeos[2]), reachOf(thornGeos[3])), drownReach = Math.max(reachOf(thornGeos[4]), reachOf(thornGeos[5]));
    await ctx.yield();
    // (bare wood is lit as the stone is: the leaves' own lift of the ambient light, which keeps the oaks' crowns out of black, is
    // not given to it, or a dead tree stands self-lit against the moor)
    const barkMat = flora.windMaterial({ wind, map: leafMat.map, ambient: 1.3, leafAmbient: 1.3 });
    lampsOn(barkMat, 'bark', { world: 'vFloraWorld', soft: 0.6, k: 0.9 });
    const treePts = [], thornPts = [], AV_Z0 = -(15 + oakReach * AV_S[2] + 1);
    // THE AVENUE'S LAMPS (round 8): three pairs of iron standards down the drive, 5.2 m either side of its middle (inside the oaks'
    // rows, 2.3 m from the gravel's edge), the first 4 m beyond the first pair of oaks and then every 16 m, half way between
    // two pairs of trunks; a lantern 3 m up on each. Their gold lies on the gravel and the verge, GILDS THE TRUNKS beside them
    // and the under sides of the boughs over them.
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) { const lx = sx * 5.2, lz = AV_Z0 - 4 - k * 16;
      B.col(IRON).surf(SURF.PLAIN).beam([lx, 0, lz], [lx, 3.0, lz], 0.12, 0.12).cbox(lx, 3.0, lz, 0.46, 0.66, 0.46).cbox(lx, 3.66, lz, 0.58, 0.07, 0.58);
      B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lx, 3.08, lz, 0.32, 0.5, 0.32);
      laneNote('avenue lamp', laneDist(lx, lz, 0.4, 0, 3.8)); hard.push([lx, lz, 0.3, 'avenue lamp']);
      passages['the avenue\'s lamps'].push(['lamp standard', lx - 0.3, lx + 0.3, lz - 0.3, lz + 0.3, 0, 3.75]);
      lanternPts.push([lx, 3.3, lz, 0.8]); plPut(lx, 3.3, lz, 13.5, GOLD, 1.5); }
    // (EVERY OAK'S TINT IS ITS OWN DRAW, made when the oak is a candidate and before any test keeps it or leaves it out: two
    // numbers from a stream that deals nothing else, the ten of the drive first and then the hundred and ten candidates of the park, in
    // their order. So an oak that is left out (by the lane, by a hard thing) moves no other oak's tint: the kit's scatter is
    // given no tint to draw (tint 0, hue 0) and takes each oak's colour from here. The measure is the kit's own: brightness by
    // a tenth either way, hue by three parts in a hundred)
    const rTi = fk.oaktint, OAK_TINT = 0.1, OAK_HUE = 0.03;
    const oakTint = () => { const br = 1 + rTi.range(-1, 1) * OAK_TINT, h = rTi.range(-1, 1) * OAK_HUE; return [br * (1 + h), br, br * (1 - h * 1.5)]; };
    for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) treePts.push({ x: sx * rA.range(AV_X[0], AV_X[2]), z: AV_Z0 - k * 8 + rA.range(-1, 1), s: rA.range(AV_S[0], AV_S[2]), rot: sx > 0 ? 0 : Math.PI, v: rA.int(0, 1), d: 8, u: 0, avenue: true, col: oakTint(), k: treePts.length });
    // (THE PARK'S OAKS stand inside the park's wall: a hundred and ten places drawn over the park, 4 m and more inside the wall.
    // THE PARK CARRIES PARK_OAKS OF THEM AT THE MOST beside the avenue's ten: the first that stand, in the order drawn (the
    // places are drawn evenly over the park, so the first twenty-eight are spread as the whole would be). Round 8: a seed whose
    // park took forty-four drew 484,906 triangles at once from the avenue's head; this is where that is saved.)
    const PARK_OAKS = 26, DRIVE_HALF = 3.4;
    for (let i = 0; i < 110; i++) {
      // (every draw of a candidate first, its tint with them, then the tests)
      const x = rPk.range(-60, 60), z = rPk.range(GATE_Z + 6, -14), sz = rPk.range(0.7, 1.1), rot = rPk.range(0, 6.28), v = 2 + rPk.int(0, 1), col = oakTint();
      if (Math.hypot(x, z) < 15 + oakReach * sz + 1) continue;
      // (NO PARK OAK IN THE AVENUE'S STRIP, round 9: from the lodge gates to the forecourt the strip is the drive's breadth and a
      // crown's reach to either hand of it; no park oak's crown, by its own reach, comes into it)
      if (z > HALL.zFront + 28 - oakReach * sz && Math.abs(x) < DRIVE_HALF + oakReach + oakReach * sz) continue;
      if (x > -40 && x < 62 && z < -66 && z > ALLEY.z0 - 4) continue;
      // (none in the orchard, nor a crown's reach from its walls)
      if (x > OR.x0 - 8 && x < OR.x1 + 8 && z < OR.z0 + 8 && z > OR.z1 - 8) continue;
      // (none within 34 m of the yew walk: that air is the owl's)
      if (Math.abs(x) < 34 && z < ALLEY.z0 + 6) continue;
      if (zoneAt(P, x, z, ZONE).park < 0.25) continue;
      treePts.push({ x, z, s: sz, rot, v, d: 40, u: 0, col, k: 10 + i });
    }
    for (const p of treePts) p.y = groundY(p.x, p.z);
    // (the lane: a drive's oak is measured by its own boughs and leaves as it stands, the corners and the middle of every triangle left
    // on it, and must keep the lane and half a metre more for the wind's sway; a park oak by its crown's whole reach; every tree by its trunk)
    const crownLeast = (p, g) => { const ps = g.attributes.position, ix = g.index.array, c = Math.cos(p.rot), sn = Math.sin(p.rot); let best = 99;
      for (let i = 0; i < ix.length; i += 3) { let mx = 0, my = 0, mz = 0;
        for (let k = 0; k < 4; k++) { const j = ix[i + (k % 3)], lx = k < 3 ? ps.getX(j) : mx / 3, ly = k < 3 ? ps.getY(j) : my / 3, lz = k < 3 ? ps.getZ(j) : mz / 3; if (k < 3) { mx += lx; my += ly; mz += lz; }
          const d = laneDist(p.x + (lx * c + lz * sn) * p.s, p.z + (lz * c - lx * sn) * p.s, 0, p.y + ly * p.s, p.y + ly * p.s, 5); if (d < best) best = d; } }
      return best; };
    { let n = 0, nPark = 0;
      for (const p of treePts) {
        let ok = (p.avenue || nPark < PARK_OAKS) && laneOk('tree trunk', p.x, p.z, 1.3 * p.s, p.y, p.y + 15 * p.s);
        if (ok && p.avenue) { const d = crownLeast(p, oaks[p.v]); if (d < LANE_M + 0.5) { ok = false; laneLeft['avenue crown'] = (laneLeft['avenue crown'] || 0) + 1; } else laneNote('avenue crown', d); await ctx.yield(); }
        else if (ok) ok = laneOk('park crown', p.x, p.z, oakReach * p.s, p.y + 2 * p.s, p.y + 15.5 * p.s);
        if (ok) ok = hardOk('tree trunk', p.x, p.z, HARD.oak * p.s);
        if (ok) { treePts[n++] = p; if (!p.avenue) nPark++; }
      }
      treePts.length = n; }
    // (THE OAKS' SHADE IS SOFT: the oaks throw no shadow into the shadow map. Through a map whose grain lies 14 cm by 40 on the
    // ground under so low a moon, their leaves' shadow was long dark streaks across the drive and one black over the lawn
    // beside it. Each oak has instead the kit's soft shade on the ground under its crown, laid away from the moon, which leaves
    // the lawn and the gravel half their light: no part of the ground under the avenue is black.)
    const oakCol = new Map(treePts.map((p) => [p.x + ':' + p.z, p.col]));
    // (a hand-back before and after the kit's scatter: it stands in a step of its own, and the shade's check after it in another)
    await ctx.yield();
    const trees = flora.makeScatter({ rng: fk.treescatter, points: treePts, variants: oaks, material: leafMat, castShadow: false, tint: 0, hue: 0, groundColor: (x, z) => oakCol.get(x + ':' + z), sink: 0.01, tilt: 0, stretch: 0, groundShadow: { heightAt: groundY, lift: 0.08, sunDir, strength: 0.42, size: 1.15 } });
    await ctx.yield();
    await shadeCheck('park oaks', trees.shadow);
    await ctx.yield();
    // (kept with the scene for a count: every oak's colour as built can be checked against its own draw)
    scene.userData.oaks = { meshes: trees.meshes, points: treePts };
    scene.add(trees.object); updaters.push((dt, t, cam) => trees.update(dt, t, cam));
    // THE HALL'S IVY: A MANTLE OF LEAVES LYING ON THE WALL, a hand before its face. It clothes the front between and round the
    // windows from the ground to an uneven upper rim about HALF THE WALL'S HEIGHT (5 to 7 m up, a little higher toward the east),
    // cut clear of every window (its glass and its stone surround), of the porch and the door, and it climbs the foot of the east
    // tower to 9 m at the tower's inner corner, falling away across its face under the lowest lit slit. It is
    // drawn leaf by leaf in the wall's own metres (a leaf 0.12 to 0.17 m, each with its own turn and tilt, dark green, its edge
    // paler so that the moon picks the edges out); toward the rims the leaves thin out and bare stems climb on above them.
    // It is of the place: where it lies is a rule of the wall (ivMask), the same on every visit, for every eye.
    // SAMPLING: where a pixel spans more of the wall than a third of a leaf, leaf and gap go to their own mean (the mantle's
    // mean green where more than half the wall is covered, bare wall where less); nothing else of the eye is read.
    { const ivyMat = (win, org, rim) => { const mat = own(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82, metalness: 0 }));
        const U = { uIvyWin: { value: new THREE.Vector4(...win) }, uIvyOrg: { value: new THREE.Vector4(...org) }, uIvyRim: { value: new THREE.Vector4(...rim) }, uIvySky: { value: new THREE.Color(H.ambient).multiplyScalar(H.moon ? 0.55 : 0.2) } };
        mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', 'varying vec2 vIvy;\n#include <common>').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vIvy = position.xy;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `uniform vec4 uIvyWin, uIvyOrg, uIvyRim; uniform vec3 uIvySky; varying vec2 vIvy;
            float ivH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            vec2 ivH2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
            float ivN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ivH(i), ivH(i + vec2(1.0, 0.0)), f.x), mix(ivH(i + vec2(0.0, 1.0)), ivH(i + vec2(1.0, 1.0)), f.x), f.y); }
            float ivMask(vec2 p) {
              float rimY = uIvyRim.x + uIvyRim.y * p.x + uIvyRim.z * (ivN(vec2(p.x * 0.33, 3.7)) - 0.5) * 2.0 + 0.9 * (ivN(vec2(p.x * 1.3, 9.1)) - 0.5);
              float m = 1.0 - smoothstep(rimY - 2.2, rimY + 0.8, p.y);
              if (uIvyRim.w > 0.0) m *= smoothstep(uIvyRim.w, uIvyRim.w + 0.7, abs(p.x));
              vec2 c = (p - uIvyOrg.xy) / uIvyWin.xy;
              if (c.x > 0.0 && c.y > 0.0 && c.x < uIvyOrg.z && c.y < uIvyOrg.w) { vec2 f = (fract(c) - 0.5) * uIvyWin.xy; m *= smoothstep(0.18, 0.6, max(abs(f.x) - uIvyWin.z, abs(f.y) - uIvyWin.w)); }
              return clamp(m * (0.72 + 0.56 * ivN(p * 0.9 + 17.0)), 0.0, 1.0);
            }
            vec2 gIvyTilt = vec2(0.0);
            #include <common>`)
            .replace('#include <color_fragment>', `#include <color_fragment>
            { vec2 ivP = vIvy; float ivM = ivMask(ivP), ivDen = smoothstep(0.08, 0.55, ivM), ivRes = 1.0 - smoothstep(0.05, 0.16, length(fwidth(ivP)));
              vec2 ivQ = ivP / 0.19, ivC = floor(ivQ); float ivBest = -1.0, ivEdge = 0.0, ivHh = 0.0; vec2 ivT = vec2(0.0);
              for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
                vec2 cc = ivC + vec2(float(i), float(j)), h2 = ivH2(cc); float hh = ivH(cc + 31.7);
                if (hh > ivDen) continue;
                vec2 d = ivQ - (cc + 0.5 + (h2 - 0.5) * 0.9); float a = (h2.x - 0.5) * 1.6, ca = cos(a), sa = sin(a); d = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
                float e = 1.0 - (abs(d.x) * 1.25 + (d.y > 0.0 ? d.y * 1.5 : -d.y * 0.85)) / (0.62 + 0.25 * h2.y);
                if (e > 0.0 && hh > ivBest) { ivBest = hh; ivEdge = e; ivHh = h2.y; ivT = (h2 - 0.5) * 1.1 + d * 0.5; }
              }
              float ivSc = floor(ivP.x / 0.42), ivSh = ivH(vec2(ivSc, 5.3)), ivSx = (ivSc + 0.5 + 0.28 * sin(ivP.y * 2.3 + ivSh * 6.2832)) * 0.42;
              float ivStem = (ivSh < 0.75 && ivM > 0.02) ? 1.0 - smoothstep(0.014, 0.034, abs(ivP.x - ivSx)) : 0.0;
              vec3 ivLeaf = mix(vec3(0.026, 0.066, 0.030), vec3(0.050, 0.110, 0.046), ivHh); ivLeaf = mix(ivLeaf, vec3(0.17, 0.27, 0.16), 1.0 - smoothstep(0.0, 0.28, ivEdge));
              vec3 ivCol = ivBest >= 0.0 ? ivLeaf : vec3(0.070, 0.058, 0.044); float ivA = ivBest >= 0.0 ? 1.0 : ivStem;
              if (mix(0.9 * ivDen, ivA, ivRes) < 0.5) discard;
              diffuseColor.rgb = mix(vec3(0.052, 0.108, 0.052), ivCol, ivRes); gIvyTilt = ivBest >= 0.0 ? ivT * ivRes : vec2(0.0); }`)
            .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = normalize(normal + 0.6 * (gIvyTilt.x * normalize((viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz) + gIvyTilt.y * normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uIvySky;'); };
        mat.customProgramCacheKey = () => 'moor-ivy-1'; return mat; };
      const sheet = (x0, x1, y1, z, mat) => { const g = own(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0, 0, x1, 0, 0, x1, y1, 0, x0, y1, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        const m = new THREE.Mesh(g, mat); m.position.z = z; m.receiveShadow = true; m.name = 'ivy'; scene.add(m); };
      const fx0 = -HALL.towerX + HALL.towerW / 2, fx1 = HALL.towerX - HALL.towerW / 2;
      // (the front: six bays across and two floors, the windows' middles 2.9 and 7.25 m up: each window with its surround is cut out)
      sheet(fx0, fx1, 9.0, HALL.zFront + 0.26, ivyMat([(fx1 - fx0) / 6, 4.35, 0.93, 1.2], [fx0, 0.725, 6, 2], [5.9, 0.07, 0.9, 3.6]));
      // (the east tower's foot: the kit's loopholes two across, 4.8 m to a storey; the rim falls from 9 m at the inner corner to the ground)
      sheet(fx1, fx1 + HALL.towerW, 10.5, HALL.zFront + 1.1 + 0.26, ivyMat([3.5, 4.8, 0.28, 1.35], [fx1, 0, 2, 8], [9.0 + 1.3 * fx1, -1.3, 0.8, 0])); }
    await ctx.yield();

    // ---- granite: the tor with its piled blocks (the figure stands on the topmost), other tors on the skyline, boulders, the hut circles
    // GRANITE IS PALE. Its own colour is a pale silver-grey with
    // darker grain, PALE GREY-GREEN LICHEN on its upper parts and RUST in patches (drawn on every stone's vertices by the noise
    // of the place), the under edge of every slab dark (the joint between two beds is a thin dark line); the kit's material adds
    // its grain and its cracks, and a pale lichen on what looks up.
    const GRANITE = { pale: '#888a83', grain: '#62666a', lichen: '#81866a', rust: '#86694a' };
    // (POLISH 1, MENDING 1: THE GRANITE UNDER THE NIGHT'S FIGURES. Its shade keeps the lift the stage gave it: the kit's bounce
    // fourfold in the sky's colour half way to grey, now the rock's own (the ground has the kit's own again). Where the moon
    // strikes it, it gives back H.stone of the moon's direct light and H.glint of the moon's mirror (moonHeld, at its lamps
    // below): its lit side stands no higher against the fog bank's bright part than in live. The same for the walls' stone
    // and the set stones. An hour without `stone`: nothing of this.)
    const rockHeld = H.stone ? { bounce: new THREE.Color(H.ambient).lerp(new THREE.Color('#7f7f7f'), 0.5), bounceAmount: 4 } : {};
    const rockMat = T.makeRockMaterial({ terrain, strata: 0, top: '#8f947e', topAmount: 0.18, contact: [0.3, 0.14, -0.36], roughness: 0.62, cracks: 0.34, ...rockHeld });
    // THE GRANITE'S LIGHT. Two terms are added to the kit's rock shader (kept whole, under a program key of its own), for every
    // stone of granite in the place alike:
    // THE SKY'S LIGHT ON THE SHADE: every face takes the night sky's grey-blue by its own colour, a little more where it looks
    // up, whichever way it is seen from: a face turned from the moon is BLUE and never darker than a third of a moonlit one
    // (by the moon alone it was near black);
    // THE RIM, BY THE MOON AND THE STONE ALONE (nothing of the eye is in it): where a rounded edge turns to the moon, the band
    // of the stone's face that the moon's light only grazes (the moon 0 to 15 degrees over that face's own horizon), a rough
    // stone gives back more than a smooth one would: that band takes a thin line of the moon's light. It is the same band
    // from wherever it is seen.
    // (graniteLight(mat, rimK): the two terms on a material of the kit's rock; rimK is how much of the rim it takes)
    const graniteLight = (mat, rimK) => { const kitCompile = mat.onBeforeCompile, rimU = { uMoorRimDir: { value: P.M.clone() }, uMoorRimCol: { value: new THREE.Color(H.light).multiplyScalar((H.moon ? 0.17 : 0.03) * rimK) }, uMoorSky: { value: new THREE.Color(H.ambient).lerp(new THREE.Color('#aaaeb2'), 0.7).multiplyScalar(H.moon ? 0.36 : 0.1) } };
      mat.onBeforeCompile = (sh, r) => { kitCompile.call(mat, sh, r); Object.assign(sh.uniforms, rimU);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', 'uniform vec3 uMoorRimDir, uMoorRimCol, uMoorSky;\n#include <common>')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { vec3 rimL = normalize((viewMatrix * vec4(uMoorRimDir, 0.0)).xyz); float rimN = dot(normal, rimL), rimUp = dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz));\n    totalEmissiveRadiance += uMoorRimCol * (smoothstep(-0.03, 0.05, rimN) * (1.0 - smoothstep(0.08, 0.26, rimN)) * (1.0 - smoothstep(0.25, 0.6, rimUp))) + diffuseColor.rgb * uMoorSky * (0.85 + 0.15 * rimUp); }'); };
      mat.customProgramCacheKey = () => 'kit-terrain2-rock-moor-rim-11'; };
    graniteLight(rockMat, 1);
    lampsOn(rockMat, 'granite', { soft: 0.3 });
    if (H.stone) moonHeld(rockMat, { direct: H.stone, mirror: H.glint });
    // THE DRY-STONE WALLS' STONE: a wall is a rough face of many small stones, not one rounded rock: along the sunken
    // lane, which runs nearly toward the moon, the moon grazes both walls' faces, and the rim's band lay over them in broad
    // white patches (white walls blotched black). The walls have the same rock with a quarter of the rim: one program with
    // the granite's (the same shader, its own numbers).
    const wallMat = own(T.makeRockMaterial({ terrain, strata: 0, top: '#8f947e', topAmount: 0.18, contact: [0.3, 0.14, -0.36], roughness: 0.62, cracks: 0.34, ...rockHeld }));
    graniteLight(wallMat, 0.25);
    lampsOn(wallMat, 'granite', { soft: 0.3 });
    if (H.stone) moonHeld(wallMat, { direct: H.stone, mirror: H.glint });
    const rHu = fk.huts;
    // A STONE OF GRANITE IS A ROUNDED FORM (round 7; it was a box with worn corners, creased): a LOAF, much wider than high, its
    // plan and its section both superellipses (no straight edge and no sharp corner in any outline), `segA` round by `segV` up,
    // its faces roughened by the noise on every vertex, its normals smooth. The same extents as the old block (1.3 by 0.36 by
    // 1.02 as cut), so that place() lays either. pe, se: the plan's and the section's exponents (4.2 and 4.5: a SLAB WITH WORN
    // EDGES, its top and its bed nearly flat, its plan a rounded oblong); ext: its half extents as cut. Its top is smooth within seven tenths of its radius.
    const loafOf = (rng, segA, segV, pe = 4.2, se = 4.5, ext = [1.3, 0.36, 1.02]) => {
      const ox = rng.range(-40, 40), oz = rng.range(-40, 40), nz = P.noise, pos = [], col = [], idx = [];
      const ca = new THREE.Color(GRANITE.pale), cb = new THREE.Color(GRANITE.grain), cl = new THREE.Color(GRANITE.lichen), cr = new THREE.Color(GRANITE.rust), c = new THREE.Color();
      const put = (ux, uy, uz) => {
        const rho = Math.hypot(ux, uz), lump = 1 + 0.09 * nz.n3(ux * 1.7 + ox, uy * 1.7, uz * 1.7 + oz) + 0.04 * nz.n3(ux * 4.1 + oz, uy * 4.1 + 3, uz * 4.1 + ox);
        const rough = uy > 0.5 ? smoothstep(0.7, 0.95, rho) : 1;
        pos.push(ux * lump * ext[0], (uy + 0.07 * rough * nz.n3(ux * 2.3 + oz, 3.1 + uy, uz * 2.3 + ox)) * ext[1], uz * lump * ext[2]);
        const v = smoothstep(-0.4, 0.4, nz.n3(ux * 2.1 + oz, uy * 3.4 + ox, uz * 2.1)), li = 0.55 * smoothstep(0.1, 0.45, nz.n3(ux * 1.4 + ox, uy * 1.9 + 7, uz * 1.4 + oz)) * smoothstep(-0.5, 0.4, uy),
          ru = 0.4 * smoothstep(0.25, 0.55, nz.n3(ux * 1.1 + 31 + oz, uy * 1.5, uz * 1.1 - 17 + ox)), sh = lerp(0.5, 1, smoothstep(-1.0, -0.72, uy));
        c.copy(ca).lerp(cb, v).lerp(cl, li).lerp(cr, ru).multiplyScalar(sh); col.push(c.r, c.g, c.b);
      };
      put(0, -1, 0);
      for (let j = 1; j < segV; j++) { const ph = (j / segV - 0.5) * Math.PI, sy = Math.sin(ph), uy = Math.sign(sy) * Math.pow(Math.abs(sy), 2 / se), rr = Math.pow(Math.cos(ph), 2 / se);
        for (let i = 0; i < segA; i++) { const th = i / segA * 6.2832, ct = Math.cos(th), st = Math.sin(th); put(Math.sign(ct) * Math.pow(Math.abs(ct), 2 / pe) * rr, uy, Math.sign(st) * Math.pow(Math.abs(st), 2 / pe) * rr); } }
      put(0, 1, 0);
      const ring = (j, i) => 1 + (j - 1) * segA + (i % segA), topV = 1 + (segV - 1) * segA;
      // (every face is wound outward: the form is a star round its middle, so a face looks out when its normal looks from the middle)
      const tri = (a, b, d) => { const A = a * 3, B2 = b * 3, D = d * 3, ux = pos[B2] - pos[A], uy = pos[B2 + 1] - pos[A + 1], uz = pos[B2 + 2] - pos[A + 2], vx = pos[D] - pos[A], vy = pos[D + 1] - pos[A + 1], vz = pos[D + 2] - pos[A + 2];
        const out = (uy * vz - uz * vy) * (pos[A] + pos[B2] + pos[D]) + (uz * vx - ux * vz) * (pos[A + 1] + pos[B2 + 1] + pos[D + 1]) + (ux * vy - uy * vx) * (pos[A + 2] + pos[B2 + 2] + pos[D + 2]);
        if (out >= 0) idx.push(a, b, d); else idx.push(a, d, b); };
      for (let i = 0; i < segA; i++) { tri(0, ring(1, i), ring(1, i + 1)); tri(topV, ring(segV - 1, i), ring(segV - 1, i + 1));
        for (let j = 1; j < segV - 1; j++) { tri(ring(j, i), ring(j, i + 1), ring(j + 1, i + 1)); tri(ring(j, i), ring(j + 1, i + 1), ring(j + 1, i)); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    // (three makes of the loaf, each for a KIND of pile wherever it stands: 160 faces for the mine's mouth, 96 for the tor's piles,
    // 48 for the outcrops, the lesser tors of the basin and the tors of the hills round about. EVERY BOULDER OF THE MOOR IS A ROUNDED
    // COBBLE, its make chosen by ITS OWN SIZE wherever it lies: 120 faces for one of 1.2 m and more, 48 for one of 0.6 m and more,
    // 24 for a lesser stone; a skirt's boulder 48 over 0.7 m and 24 under. stoneOf is that rule.)
    const slabGeo = loafOf(fk.torgeo, 16, 6), slabFar = loafOf(fk.torgeo, 8, 4), slabMid = loafOf(fk.torgeo, 12, 5);
    const cobbleGeo = loafOf(fk.torgeo, 8, 4, 2.3, 2.3, [1, 0.72, 0.9]), cobbleFar = loafOf(fk.torgeo, 6, 3, 2.3, 2.3, [1, 0.72, 0.9]);
    const boulderGeo = loafOf(fk.bouldergeo, 12, 6, 2.3, 2.3, [1, 0.72, 0.9]), boulderMid = cobbleGeo, boulderSmall = cobbleFar;
    await ctx.yield();
    const stoneOf = (s) => (s >= 1.2 ? boulders : s >= 0.6 ? midBoulders : smallBoulders);
    const slabs = [], hillSlabs = [], farSlabs = [], boulders = [], midBoulders = [], smallBoulders = [], skirtStones = [], skirtSmall = [], WQ = {}, mT = new THREE.Matrix4(), qT = new THREE.Quaternion(), eT = new THREE.Euler(), vT = new THREE.Vector3(), sT = new THREE.Vector3();
    const place = (list, x, y, z, sx, sy, sz, yaw, tilt = 0) => { eT.set(tilt, yaw, tilt * 0.6); qT.setFromEuler(eT); list.push(new THREE.Matrix4().compose(vT.set(x, y, z), qT, sT.set(sx, sy, sz))); };
    // (EVERY THING OF THE MOOR'S GRANITE, THE MIRE AND THE MINE HAS ITS FEET WRITTEN DOWN, scene.userData.feet: the place of each
    // foot, the height of what is built lowest there, and how far it may be sunk; the count asks the drawn ground under each)
    const feet = [], footAt = (kind, x, z, y, foot) => feet.push({ kind, x, z, y, foot });
    // (A SHADE ON THE GROUND UNDER EVERY PILE'S FOOT that stack deals and builds, wherever it stands (the tors of the far hills
    // and the lesser tors in the fog among them: ROUND 11, MENDING 3 makes the words say what the code lays), and
    // under every skirt boulder over 0.7 m, wherever it lies: a sheet of its own of the kit's ground shadows, laid after the granite)
    const pileShade = [];
    // (the lowest ground under a round place: its middle and eight places round it, the drawn ground and the plan's, the lower)
    const lowGround = (x, z, r) => { let g = Math.min(land(x, z), groundY(x, z)); for (let k = 0; k < 8; k++) { const a = k * 0.7854, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; g = Math.min(g, land(px, pz), groundY(px, pz)); } return g; };
    // A PILE (round 7): BEDS OF SLABS LYING FLAT ONE ON ANOTHER, widest at the foot and stepping in. A bed is one slab, or two side
    // by side (where the pile is more than 10.4 m across there) or three (more than 18 m), which overlap each other by a fifth
    // to a quarter of their width with UPRIGHT JOINTS between them and are each of its own length (0.85 to 1.12 of the bed's half
    // width), so that the bed's outline steps; all the pile's slabs lie along one grain (within 9 degrees of it); a bed's slabs are
    // 22 in a hundred thicker than the bed, so that each lies INTO the one under it, the joint a thin dark line, no sky between; its
    // bedding is level (it leans 1.7 degrees at the most, and the foot's not at all); one bed between half and four fifths of
    // the way up is a GREAT CAP that overhangs the bed under it by a quarter to two fifths, and the top bed overhangs by a
    // tenth to a quarter (not the flat top the man stands on, which is a round cap 2.9 m in radius at the least, level and
    // unjittered).
    // ITS FOOT: the lowest bed is laid so that a third of its thickness is under the LOWEST ground of its whole footprint (the
    // drawn ground and the plan's, eight places round each loaf and its middle): on a slope the bed is thicker by what the
    // ground falls, and no part of its under side is in the air (the feet are written down: eight to a loaf, nine tenths out).
    // ITS SKIRT (skirt: how many): rounded boulders, half buried, 0.6 to 3 m across, larger near the foot, spill 10 to 25 m
    // from it, most of them down the slope (seven in ten within 69 degrees of the way the ground falls); each lies with its
    // middle at the lowest ground under it; none in the park, the mire or by the river.
    // (plain: a pile beside the lane, the two pairs at the mine's mouth: no bed of it is wider than the pile's own taper.)
    // (the pile is dealt from a stream of its own, named by its place; thick[2], where given, is its swell)
    // (ROUND 11, MENDING 2: `ghost`: the pile is dealt and its slabs are put in the list, each marked M.ghost, but it is not
    // built: no foot is written, no shade laid, and its slabs are taken out again before anything is drawn. See the far tors.
    // MENDING 3: A GHOST LAYS NO SKIRT EITHER: its skirt's draws are drawn as for any pile, and no boulder, no foot and no
    // shade of it is laid. THE ONE LIMIT THAT IS LEFT: only the far piles' list (farSlabs) is cleared of ghosts when its mesh
    // is made, so a ghost may be dealt into that list alone.)
    const stack = (x0, z0, base, height, r0, r1, flatTop, list = slabs, lean = null, thick = [1.5, 2.0], skirt = 0, plain = false, ghost = false) => {
      const rs = makeRng(hashSeed('loaves:' + seed + ':' + Math.round(x0 * 4) + ':' + Math.round(z0 * 4))), grain = rs.range(0, 3.14), hs = [];
      // (WEATHERED GRANITE, NEVER EVEN STEPS: a bed is as thick as 0.28 to 0.8 of the pile's half width where it
      // lies (of 5.5 m where the pile is broader, and up to 1.6 times that share where the pile is narrower than 5 m: a narrow
      // pile is of blocks, not of plates; 0.8 m at the least), each by its own draw: thick beds and thin ones lie in no order. A bed's
      // half width is the taper's, less a sixth or more a seventh by its own draw, and its middle lies off the pile's by as
      // much as a twelfth of its width: the outline goes in and out, with ledges and overhangs. A bed leans as much as 4
      // degrees; a bed is two loaves side by side where the pile is over 6.4 m across there and three over 13 m, and each
      // bed's grain turns its own way (the narrower the pile, the more). THE TOP BLOCK LEANS: the cap rock lies tilted 7 to 11 degrees, as a rocking stone left askew.
      // EVERY PILE IS LAID BY THIS ONE RULE, wherever it stands.)
      // (THE OUTLINE. A pile's half width goes from r0 to r1 by the share of its height to the
      // power `swell` (thick[2]; 0.8 where none is given): 1.5 for the crown and the greater tor, which keep their
      // breadth to half their height and round in above it: a massif with shoulders. The lowest bed is a fifth thicker than its draw.)
      const swell = thick[2] ?? 0.8, deep = 1.22;
      let sum = 0; while (sum < height || hs.length < 2) { const rr = lerp(r0, r1, Math.pow(Math.min(1, sum / height), swell)), h = Math.max(0.8, Math.min(rr, 5.5) * rs.range(0.28, 0.8) * lerp(1.6, 1, smoothstep(2, 5, rr))) * (hs.length ? 1 : 1.2); hs.push(h); sum += h; }
      const L = hs.length, cap = L > 3 ? Math.min(L - 2, Math.round(L * rs.range(0.5, 0.78))) : -1, topLean = rs.sign() * rs.range(0.12, 0.19);
      let y = base;
      for (let i = 0; i < L; i++) {
        const t = i / (L - 1), top = i === L - 1, h = hs[i] * height / sum, flat = top && flatTop;
        let r = lerp(r0, r1, Math.pow(t, swell)) * rs.range(0.84, 1.14);
        const capK = rs.range(1.25, 1.4), topK = rs.range(1.1, 1.25), ga = grain + rs.range(-0.15, 0.15), ln = [rs.range(0.85, 1.12), rs.range(0.85, 1.12), rs.range(0.85, 1.12)], wid = rs.range(0.62, 0.94), off = [rs.range(-0.16, 0.16), rs.range(-0.16, 0.16)], tilt = rs.range(-0.07, 0.07), sl = rs.range(-0.12, 0.12);
        if (plain) r = Math.min(r, lerp(r0, r1, Math.pow(t, swell))); else if (i === cap) r *= capK; else if (top && !flatTop) r *= topK;
        const x = x0 + (lean ? lean[0] * (1 - t) : 0) + (flat || i === 0 ? 0 : off[0] * r * 0.5), z = z0 + (lean ? lean[1] * (1 - t) : 0) + (flat || i === 0 ? 0 : off[1] * r * 0.5), nL = flat ? 0 : r > 6.5 ? 3 : r > 3.2 ? 2 : 1, gb = grain + (ga - grain) * (nL === 1 ? 4 : nL === 2 ? 2.5 : 1), cg = Math.cos(gb), sg = Math.sin(gb);
        // (each slab: its middle, its half length along the grain, its half width across it; a bed's slabs slide along the grain a little)
        const lo = flat ? [[x, z, Math.max(r, 2.9), Math.max(r, 2.9)]] : nL === 3 ? [-1, 0, 1].map((k) => [x - sg * 0.62 * r * k + cg * sl * r * k, z + cg * 0.62 * r * k + sg * sl * r * k, r * ln[k + 1], r * 0.4])
          : nL === 2 ? [-1, 1].map((k) => [x - sg * 0.36 * r * k + cg * sl * r * k, z + cg * 0.36 * r * k + sg * sl * r * k, r * ln[k + 1], r * 0.58]) : [[x + off[0] * r, z + off[1] * r, r * ln[0], r * wid]];
        let yb = y;
        if (i === 0) { let g = 1e9; for (const q of lo) g = Math.min(g, lowGround(q[0], q[1], Math.max(q[2], q[3]))); yb = Math.min(base, g - h / 3); }
        const hh = y + h - yb, sy = hh * deep / 0.72, yc = flat ? yb + hh * 0.44 : yb + hh * 0.5;
        for (const q of lo) { place(list, q[0], yc, q[1], q[2] / 1.3, sy, q[3] / 1.02, -gb, i === 0 ? 0 : flat ? topLean : tilt); if (ghost) list[list.length - 1].ghost = true;
          if (i === 0 && !ghost) for (let k = 0; k < 8; k++) { const a = k * 0.7854, u = Math.cos(a) * q[2] * 0.9, v = Math.sin(a) * q[3] * 0.9; footAt('granite pile', q[0] + cg * u - sg * v, q[1] + sg * u + cg * v, yc - 0.36 * sy * 0.76, 99); } }
        y += h;
      }
      if (skirt > 0) {
        const gx = land(x0 + 2, z0) - land(x0 - 2, z0), gz = land(x0, z0 + 2) - land(x0, z0 - 2), down = Math.atan2(-gz, -gx), n = Math.round(skirt * rs.range(0.8, 1.2));
        for (let k = 0; k < n; k++) {
          const a = rs() < 0.3 ? rs.range(0, 6.28) : down + rs.range(-1.2, 1.2), u = rs(), d = r0 * 0.9 + 0.5 + u * rs.range(10, 25), s = lerp(1.5, 0.3, Math.pow(u, 0.7)) * rs.range(0.8, 1.2), sy = rs.range(0.75, 1.05), sz = rs.range(0.85, 1.2), yaw = rs.range(0, 6.28);
          const bx = x0 + Math.cos(a) * d, bz = z0 + Math.sin(a) * d, zn = zoneAt(P, bx, bz, ZONE);
          if (ghost || zn.park > 0.02 || zn.mire > 0.02 || zn.river < 12) continue;
          const g = lowGround(bx, bz, s * 0.75); place(s > 0.7 ? skirtStones : skirtSmall, bx, g + 0.03 * s, bz, s, s * sy, s * sz, yaw, 0);
          if (s > 0.7) pileShade.push([bx, bz, s * 0.7]);
          for (let j = 0; j < 4; j++) { const fa = j * 1.5708 + yaw; footAt('skirt boulder', bx + Math.cos(fa) * s * 0.6, bz + Math.sin(fa) * s * 0.6, g + 0.03 * s - 0.72 * s * sy * 0.45, 99); }
        }
      }
      if (!ghost) pileShade.push([x0, z0, r0 * 0.9]);
      return base + height;
    };
    // THE TOR'S CROWN: a main pile P.STACK_H (LAND.tor.crown) tall on a foot twice LAND.tor.r0 across on the hill's top (the man
    // stands on its highest rock, which leans), which keeps its breadth to half its height and rounds in above; round it,
    // 6.5 m and more from its middle, four or five SHOULDERS: lower piles on feet 8.8 to 12.4 m across, which stand into it
    // and into each other (the clefts are between their upper parts); a logan stone lies askew on the tallest of them.
    // THE GREATER TOR: twelve more piles stand round the crown, 14 to 38 m from the man's rock, one in each twelfth of the
    // round (each from a stream of its own): three fifths of the main pile's height near it and a quarter far out, 0.72 of
    // that on the tor's worn side, toward the brook, on feet 7.4 to 11.5 m across (broader than tall). THE PASS: the
    // miners' path goes through the tor between its piles; no pile stands on it (each keeps its widest bed and the lane's
    // 2.5 m clear of the path's middle). The moon shows through the clefts between its piles. Lower piles stand out down
    // the slopes, 50 to 100 m from the crown, and fallen blocks (clitter) lie about the foot and down the hillside. EVERY
    // PILE'S SHADOW lies down the hill from the moon, painted on the grass by the ground's own shader (pilePut: the pile's
    // place, its foot's radius, its top).
    const F = P.F, rCr = fk.crown, BEDS = [2.4, 3.6, 1.5], TOR_R0 = P.TOR_R0, torLean = [P.m[0] * 1.2 + P.m[1] * 1.6, P.m[1] * 1.2 - P.m[0] * 1.6];
    const torTop = stack(F.x, F.z, P.hillTop - 1.5, P.STACK_H + 1.5, TOR_R0, 2.5, true, hillSlabs, torLean, BEDS, 9);
    await ctx.yield();
    const crownPiles = [];
    // (the shoulders stand where the plan has them, P.shoulders: the tor's side toward the brook is its worn side, a pile there is
    // lower: they are SHOULDERS of the main pile, broader than tall)
    const a00 = P.crownA0;
    for (const sh of P.shoulders) {
      const top = stack(sh.x, sh.z, land(sh.x, sh.z) - 1.5, P.STACK_H * sh.hK * 0.8 + 1.5, sh.r0, sh.r1, false, hillSlabs, null, BEDS, 5);
      crownPiles.push({ x: sh.x, z: sh.z, top, r: sh.r0 });
    }
    pilePut(F.x, F.z, TOR_R0 * 0.9, torTop);
    for (const q of crownPiles) pilePut(q.x, q.z, q.r * 0.9, q.top);
    await ctx.yield();
    const torPiles = []; let torLeft = 0;
    for (let i = 0; i < 12; i++) {
      const rTp = fk['torpile' + i], a = a00 + (i + rTp.range(-0.3, 0.3)) / 12 * 6.2832, d = rTp.range(14, 38), x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d, toward = -(Math.cos(a) * P.m[0] + Math.sin(a) * P.m[1]);
      const hK = lerp(0.74, 0.34, (d - 14) / 24) * rTp.range(0.82, 1.15) * (toward > 0.3 ? 0.72 : 1), h = P.STACK_H * hK * 0.8, r0 = rTp.range(4.6, 7.2) * 0.8, r1 = rTp.range(2.0, 3.2) * 0.8;
      if (P.wayOf(x, z, WQ).d < r0 * 1.5 + LANE_M) { torLeft++; continue; }
      const top = stack(x, z, land(x, z) - 1.5, h + 1.5, r0, r1, false, hillSlabs, null, BEDS, 7);
      torPiles.push({ x, z, top, r: r0, h }); pilePut(x, z, r0 * 0.9, top);
    }
    scene.userData.tor = { crown: crownPiles, piles: torPiles, top: torTop, left: torLeft };
    await ctx.yield();
    // the logan stone: one great rounded block lying a little askew on the tallest of the flanking piles
    { const q = crownPiles.reduce((b, c) => (c.top > b.top ? c : b), crownPiles[0]), s = rCr.range(2.6, 3.3); place(boulders, q.x + rCr.range(-0.5, 0.5), q.top + s * 0.62, q.z + rCr.range(-0.5, 0.5), s * 1.25, s * 0.78, s, rCr.range(0, 6.28), rCr.range(0.05, 0.12)); }
    // lower piles down the slopes, 50 to 100 m out (3 to 7.2 m tall: all lower than the crown; none on the miners' path, none by the brook)
    groundU.uMoorTor.value.z = 270;
    // (each has a stream of its own: one that is left out moves no other)
    for (let i = 0; i < 6; i++) {
      const rP = fk['pile' + i], a = rP.range(0, 6.28), d = rP.range(50, 100), x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d, h = rP.range(5, 12) * 0.6, r0 = rP.range(3.6, 5.4), r1 = rP.range(1.8, 2.6) * 0.8;
      if (P.wayOf(x, z, WQ).d >= r0 * 1.5 + LANE_M && zoneAt(P, x, z, ZONE).river > 16) { const top = stack(x, z, land(x, z) - 1.2, h + 1.2, r0, r1, false, hillSlabs, null, [1.6, 2.6], 7); pilePut(x, z, r0 * 0.9, top); }
    }
    // clitter: blocks fallen from the crown, large near its foot and smaller down the hill; none lies on the miners' path (its trodden
    // strip and the block's own size: the path is kept clear by those who use it), and each is held to the lane's law with the
    // other boulders (laneSift); each lies an eighth of its height over the LOWEST ground under it
    const rCl = fk.clitter, nClit = Math.round(90 * densC);
    for (let i = 0; i < nClit; i++) {
      const a = rCl.range(0, 6.28), d = P.CROWN_R * 0.7 + 90 * Math.pow(rCl(), 1.7), x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d, s = lerp(2.6, 0.7, clamp(d / 80, 0, 1)) * rCl.range(0.6, 1.3);
      const yaw = rCl.range(0, 6.28), tl = rCl.range(-0.3, 0.3), sy = s * rCl.range(0.5, 0.8), sz = s * rCl.range(0.8, 1.2);
      if (P.wayOf(x, z, WQ).d < 2.4 + s * 1.3) continue;
      place(stoneOf(s), x, lowGround(x, z, s * 0.7) + sy * 0.12, z, s, sy, sz, yaw, tl);
    }
    // THE MINERS' PATH THROUGH THE CLITTER, BY ONE LAW (round 9): wherever the path lies within the clitter's reach of the crown
    // (CLIT.reach metres of the man's rock: the clitter's own fall, above, lies within it), the blocks that lay on the path
    // were rolled aside and line it: one every CLIT.step metres of the path, on one hand and the other by turns, its middle
    // CLIT.off metres and its own breadth from the path's middle; each 1.3 to 2.1 m across by the draw; none where a pile of
    // the tor stands. Each has its shade on the ground and is held to the lane's law with the other boulders (laneSift).
    // Elsewhere the path has what the place has beside it: the rows, the walls, the wands. (Each block's draws first, then the test.)
    { const rPb = fk.pathblocks, q = [0, 0], CLIT = { reach: 96, step: 17, off: 6 }; let sC0 = -1, sC1 = -1;
      for (let s = 0; s <= P.at.ME; s++) { P.wayAt(s, 0, q); if (Math.hypot(q[0] - F.x, q[1] - F.z) < CLIT.reach) { if (sC0 < 0) sC0 = s; sC1 = s; } }
      scene.userData.pathBlocks = { from: sC0, to: sC1, ...CLIT };
      for (let s = sC0 + CLIT.step / 2, k = 0; sC0 >= 0 && s < sC1; k++) {
        const step = CLIT.step, sz = rPb.range(1.3, 2.1), lat = (k % 2 ? 1 : -1) * (CLIT.off + sz), sy = sz * rPb.range(0.55, 0.8), sz2 = sz * rPb.range(0.8, 1.15), yaw = rPb.range(0, 6.28), tl = rPb.range(-0.25, 0.25);
        P.wayAt(s, lat, q); s += step;
        // (a pile's foot is in the shade's list at nine tenths of its radius; its beds reach one and a half times its radius)
        if (pileShade.some((c) => c[2] >= 2 && Math.hypot(q[0] - c[0], q[1] - c[1]) < c[2] / 0.9 * 1.5 + sz)) continue;
        place(boulders, q[0], lowGround(q[0], q[1], sz * 0.7) + sy * 0.12, q[1], sz, sy, sz2, yaw, tl); pileShade.push([q[0], q[1], sz * 0.7]);
      } }
    await ctx.yield();
    // tors on the hills round about: each is put on the highest ground found in its own sector of the horizon
    // (ROUND 11, MENDING 2: A FAR TOR KEEPS OFF THE MINE'S HILL AND OFF EVERYTHING BUILT OR FLOWN. Till now a try was left out
    // only where it lay in the mire, and the mine's hill, which is no mire and is the high ground of its sector, took a pile in
    // and about the upper works on half the seeds. Now no pile is built where the pile, or its second pile at its own
    // offset, would reach a place of the plan that holds something built or flown (noTor). A PILE'S REACH is TOR_REACH times
    // its foot's radius: stack's own law lets no bed lie farther from the pile's middle (a bed's half width is up to 1.14 of
    // the taper's and 1.4 times that at the great cap; its three slabs lie side by side, each up to 1.12 of that long and slid
    // 0.12 along the grain, the bed's middle up to 0.08 off the pile's either way). THE PLACES, each by its own reach
    // (torRounds: a round about a place; torWay: metres of the old way from and to, with the reach of what stands beside its
    // middle there): the mine's hill with the upper works (MINE_HILL.r); the works' yard on its island (the zones' own bound);
    // the old stack in its pool; the clapper bridge; the stone circle on the knoll (its ring 10 m at the most, 3 m off the
    // knoll's middle); the sunken lane's walls; the two hut circles by the way (the far wall 18 m off) and the third behind
    // the row (31 m); the stone rows; the cottage (17 m); the three peat cuttings (a bank's far end 41 m off); the newtake
    // wall (99 m to either hand of the way); the boards, the wands, the firm islands and everything that stands in the mire
    // beside the wand path (the boundary's posts, the farthest, 88 m); the park within its wall (the hall, its garden, the
    // avenue, the yew walk; the wall and its pillars stand as much as 4 m outside the plan's own bound of the park: 5); and
    // the line that is flown, by the lane's own law. Every draw stays as it was.
    // ROUND 11, MENDING 3: THE LAW MADE PLAIN. The sector's place is its highest try out of the mire, as it always was; where
    // that place is under 6 m there is no tor, as before; where the pile or its second pile may not stand there (noTor), THE
    // SECTOR HAS NO FAR TOR. No other try takes it: mending 2 let the highest try that the test left take the tor, and on
    // seeds 1 to 3000 that never happened (of 13,675 places 12,109 stand and 1,566 are refused, on 1,538 seeds, every one by
    // the mine's hill; the highest try left in such a sector lies 1.98 m up at the most), so the branch was code no seed
    // had tried, and it is struck.
    // THE OTHER PILES KEEP THEIR TINT. The kit tints a slab by its number in its list, and the lesser tors and the tors in
    // the fog lie in the far tors' list after them: were a far pile simply not laid, every later slab would change its
    // tint. So the pile that stood till now where none may stand (`was`: the highest try) is still dealt, as
    // a ghost (stack's `ghost`: its own stream, its slabs in the list, nothing built); its slabs hold their numbers through
    // the lane's sifting and are taken out of the mesh and of the list when the mesh is made (below, at the granite).)
    const TOR_REACH = 2.2, torRounds = [[P.MH[0], P.MH[1], MINE_HILL.r], [P.I[0], P.I[1], P.ISLE_R + 18], ...P.ruins.map((R) => [R.x, R.z, R.pool + 3]), [P.V[0], P.V[1], 11], [P.K[0], P.K[1], 14]];
    const torWay = [[0, P.at.k0, 6], [P.at.knoll - 40, P.at.knoll, 18], [P.at.knoll + 22, P.at.knoll + 46, 31], [P.at.knoll + 6, P.at.rows1 - 8, 6], [P.at.rows1, P.at.rows1 + 18, 17], [P.at.sunk + 50, P.at.V - 50, 41], [P.at.V + 30, P.at.V + 36, 100], [P.at.ME - 73, P.at.I, 88]];
    const noTor = (x, z, r, y0, y1) => torRounds.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2] + r) || parkOut(x, z) < r + 5 || laneDist(x, z, r, y0, y1) < LANE_M
      || torWay.some((c) => { for (let i = Math.max(0, Math.ceil(c[0])), e = Math.min(P.way.n, c[1]); i <= e; i++) if (Math.hypot(x - P.way.x[i], z - P.way.z[i]) < c[2] + r) return true; return false; });
    const tors = [], nTors = 7;
    for (let k = 0; k < nTors; k++) {
      // (each has a stream of its own; everything is drawn for it before anything is tested)
      const rTs = fk['fartor' + k], a0 = (k + rTs.range(0.15, 0.85)) / nTors * 6.2832, cx = (P.V[0] + P.ME[0]) / 2, cz = (P.V[1] + P.ME[1]) / 2, tries = []; let was = null;
      for (let j = 0; j < 14; j++) tries.push([a0 + rTs.range(-0.3, 0.3), rTs.range(330, 560)]);
      const h = rTs.range(14, 24), r0 = rTs.range(11, 16), r1 = rTs.range(3, 5), second = rTs() < 0.6, ox = rTs.range(-14, 14), oz = rTs.range(-14, 14);
      for (const q of tries) { const x = cx + Math.cos(q[0]) * q[1], z = cz + Math.sin(q[0]) * q[1], y = land(x, z); if (zoneAt(P, x, z, {}).mire >= 0.05) continue;
        if (!was || y > was.y) was = { x, z, y }; }
      if (!was || was.y < 6) continue;
      // (ghost: the place may hold no pile, by the pile's own reach or its second pile's. The pile's two calls, as they were:
      // the pile and, where drawn, its second; a ghost into the far piles' list alone)
      const x2 = was.x + ox, z2 = was.z + oz, ghost = noTor(was.x, was.z, r0 * TOR_REACH, was.y - 1.5, was.y + h) || (second && noTor(x2, z2, 8 * TOR_REACH, land(x2, z2) - 1.5, land(x2, z2) + h * 0.55));
      stack(was.x, was.z, groundY(was.x, was.z) - 1.5, h, r0, r1, false, farSlabs, null, [1.8, 2.8, 1.3], 0, false, ghost);
      if (second) stack(x2, z2, groundY(x2, z2) - 1.5, h * 0.55, 8, 3, false, farSlabs, null, [1.8, 2.8, 1.3], 0, false, ghost);
      if (!ghost) tors.push(was);
    }
    await ctx.yield();
    // SET STONES. Each is A ROUGH STANDING STONE: a pillar of the
    // moor's granite that narrows upward from a broad foot, lumpy, never square, with lichen on it; one of two shapes, SHOULDERED
    // (its top narrows over its last two fifths to two fifths of its foot and ends blunt, a little aslant) or BROKEN (its top
    // struck off aslant). Two shapes, 2.6 wide, 2 tall
    // and 0.7 thick as cut, stood where the old people stood them, each scaled, turned and leaned by its own draws.
    // (round 7: of the pale granite, and ROUND IN EVERY OUTLINE: ten round by eight up on a rounded square, its normals smooth; it
    // was a box whose four edges stayed sharp)
    const menhirOf = (rng, broken) => {
      const segA = 10, segV = 8, pos = [], col = [], idx = [];
      const ox = rng.range(-40, 40), oz = rng.range(-40, 40), ca = new THREE.Color(GRANITE.pale), cb = new THREE.Color(GRANITE.grain), cl = new THREE.Color(GRANITE.lichen), cr = new THREE.Color(GRANITE.rust), c = new THREE.Color(), nz = P.noise, lean = rng.range(-0.35, 0.35), cut = rng.range(0.25, 0.45) * (rng() < 0.5 ? -1 : 1);
      const put = (x, y, z) => {
        const t = (y + 1) / 2;
        // (a broad foot, a waist that narrows upward; the shouldered one narrows again over its last two fifths, to a blunt top)
        let k = (1 - 0.3 * Math.pow(t, 1.3)) * (1 + 0.14 * nz.n3(x * 1.3 + ox, y * 2.2, z * 1.3 + oz));
        if (!broken) k *= 1 - 0.42 * smoothstep(0.62, 1, t);
        let yy = y;
        if (!broken && y > 0.99) yy = 1 - 0.2 * (0.5 + 0.5 * x * Math.sign(cut)) - 0.1 * Math.abs(nz.n3(x * 3 + oz, 5.5, z * 3 + ox));
        if (broken && y > 0.99) yy = 1 - 0.5 * (0.5 + 0.5 * x * Math.sign(cut)) * Math.abs(cut) * 2 - 0.12 * Math.abs(nz.n3(x * 3 + oz, 5.5, z * 3 + ox));
        const v = smoothstep(-0.4, 0.4, nz.n3(x * 2.1 + oz, y * 3.4 + ox, z * 2.1)), li = 0.6 * smoothstep(0.1, 0.5, nz.n3(x * 1.4 + ox, y * 1.9 + 7, z * 1.4 + oz)) * smoothstep(-0.6, 0.6, y),
          ru = 0.35 * smoothstep(0.25, 0.55, nz.n3(x * 1.1 + 31 + oz, y * 1.5, z * 1.1 - 17 + ox)), sh = 0.6 + 0.4 * smoothstep(-1, -0.2, y);
        c.copy(ca).lerp(cb, v).lerp(cl, li).lerp(cr, ru).multiplyScalar(sh); col.push(c.r, c.g, c.b);
        pos.push((x * k + lean * t * t * 0.5) * 1.3, yy * 1.02, z * k * 0.36);
      };
      put(0, -1, 0);
      for (let j = 0; j <= segV; j++) for (let i = 0; i < segA; i++) { const th = i / segA * 6.2832, ct = Math.cos(th), st = Math.sin(th); put(Math.sign(ct) * Math.sqrt(Math.abs(ct)), -1 + 2 * j / segV, Math.sign(st) * Math.sqrt(Math.abs(st))); }
      put(0, 1, 0);
      const ring = (j, i) => 1 + j * segA + (i % segA), topV = 1 + (segV + 1) * segA;
      for (let i = 0; i < segA; i++) { idx.push(0, ring(0, i), ring(0, i + 1), topV, ring(segV, i + 1), ring(segV, i));
        for (let j = 0; j < segV; j++) idx.push(ring(j, i), ring(j + 1, i), ring(j + 1, i + 1), ring(j, i), ring(j + 1, i + 1), ring(j, i + 1)); }
      // (wound outward: a face of the side looks from the stone's axis, the foot's faces down, the top's up)
      for (let q = 0; q < idx.length; q += 3) { const A = idx[q] * 3, B2 = idx[q + 1] * 3, D = idx[q + 2] * 3, ux = pos[B2] - pos[A], uy = pos[B2 + 1] - pos[A + 1], uz = pos[B2 + 2] - pos[A + 2], vx = pos[D] - pos[A], vy = pos[D + 1] - pos[A + 1], vz = pos[D + 2] - pos[A + 2];
        const foot = idx[q] === 0, head = idx[q] === topV, my = (pos[A + 1] + pos[B2 + 1] + pos[D + 1]) / 3, t = (my / 1.02 + 1) / 2, mx = (pos[A] + pos[B2] + pos[D]) / 3 - lean * t * t * 0.5 * 1.3, mz = (pos[A + 2] + pos[B2 + 2] + pos[D + 2]) / 3;
        const out = foot ? -(uz * vx - ux * vz) : head ? uz * vx - ux * vz : (uy * vz - uz * vy) * mx + (ux * vy - uy * vx) * mz;
        if (out < 0) { const w2 = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = w2; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    // A LENGTH OF DRY-STONE WALL (round 7; the newtake wall was a long dark beam of masonry and the hut rings were blocks end to
    // end): one lumpy rounded bar of the moor's granite, 2.6 m long as cut, 1 m to its cope and 1.1 m thick at the foot, battered
    // (narrower upward), its faces quilted in and out by the stones (each vertex is a stone's middle or a joint: every other
    // one stands out 5 cm), its COPE a row of stones set on edge (every other ring of its top stands 10 in a hundred higher),
    // its foot built 0.3 m under its level; every stone its own tone of the pale granite, with lichen above; ends closed, so
    // that a gap shows a wall's end. Two shapes by the draw. Its lengths are laid end over end along the wall's line.
    // (WALL_TONE: a wall's stones are weathered field stone, a fifth darker than the tors' clean granite. ITS LIGHT GOES BY THE WALL'S OWN SECTION: the stones' in-and-out is in its
    // outline, and of its normals two fifths; three fifths are the plain wall's (the face's batter, the cope's top), so that
    // a grazing moon lights a face or leaves it, and does not blotch it stone by stone.)
    const WALL_TONE = 0.8;
    const wallOf = (rng) => {
      const SX = 7, sec = [[-0.56, -0.3], [-0.5, 0.45], [-0.36, 0.92], [0, 1.08], [0.36, 0.92], [0.5, 0.45], [0.56, -0.3]], NS = sec.length, pos = [], col = [], idx = [], ox = rng.range(-40, 40), nz = P.noise;
      const ca = new THREE.Color(GRANITE.pale), cb = new THREE.Color(GRANITE.grain), cl = new THREE.Color(GRANITE.lichen), cr = new THREE.Color(GRANITE.rust), c = new THREE.Color();
      for (let k = 0; k <= SX; k++) { const x = -1.3 + 2.6 * k / SX + (k > 0 && k < SX ? rng.range(-0.07, 0.07) : 0), cope = 1 + (k & 1 ? 0.1 : -0.02) + rng.range(-0.04, 0.04);
        for (let q = 0; q < NS; q++) { const up = sec[q][1] > 0.9, quilt = ((k + q) & 1 ? 0.05 : -0.02) + 0.04 * nz.n3(x * 2.2 + ox, q * 1.7, 3.3), zs = sec[q][0] === 0 ? rng.range(-0.08, 0.08) : sec[q][0] + Math.sign(sec[q][0]) * quilt;
          pos.push(x, sec[q][1] * (up ? cope : 1) + (sec[q][1] > 0 ? rng.range(-0.03, 0.03) : 0), zs);
          const tone = rng.range(0.72, 1.12), v = rng(), li = (up ? 0.5 : 0.2) * rng(), ru = rng() < 0.2 ? 0.35 : 0, sh = sec[q][1] < 0 ? 0.55 : 1;
          c.copy(ca).lerp(cb, v).lerp(cl, li).lerp(cr, ru).multiplyScalar(tone * sh * WALL_TONE); col.push(c.r, c.g, c.b); } }
      const at = (k, q) => k * NS + q;
      for (let k = 0; k < SX; k++) for (let q = 0; q < NS - 1; q++) idx.push(at(k, q), at(k, q + 1), at(k + 1, q + 1), at(k, q), at(k + 1, q + 1), at(k + 1, q));
      for (let q = 1; q < NS - 1; q++) idx.push(at(0, 0), at(0, q + 1), at(0, q), at(SX, 0), at(SX, q), at(SX, q + 1));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const nA = g.attributes.normal;
        for (let k = 0; k <= SX; k++) for (let q = 0; q < NS; q++) { const i = at(k, q), up = sec[q][1] > 0.9, py = up ? 1 : 0.3, pz = sec[q][0] === 0 ? 0 : Math.sign(sec[q][0]) * (up ? 0.6 : 1), h = Math.hypot(py, pz);
          const nx = nA.getX(i) * 0.4, ny = nA.getY(i) * 0.4 + py / h * 0.6, nz = nA.getZ(i) * 0.4 + pz / h * 0.6, l = Math.hypot(nx, ny, nz) || 1; nA.setXYZ(i, nx / l, ny / l, nz / l); } }
      return g;
    };
    const wallGeo = [wallOf(fk.wallgeo), wallOf(fk.wallgeo)], wallNear = [[], []];
    // (a length laid from a to b, each [x, y, z] at the wall's own level there: h to its cope, th thick; `which` of the two shapes;
    // its feet are written down: the built foot is 0.3 of its height under its level at both ends)
    const wallLay = (a, b, h, th, which) => { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz), ux = dx / len, uy = dy / len, uz = dz / len, hl = Math.hypot(ux, uz);
      const m = new THREE.Matrix4().set(ux * len / 2.6, -uy * ux / hl * h, -uz / hl * th, (a[0] + b[0]) / 2, uy * len / 2.6, hl * h, 0, (a[1] + b[1]) / 2, uz * len / 2.6, -uy * uz / hl * h, ux / hl * th, (a[2] + b[2]) / 2, 0, 0, 0, 1);
      wallNear[which].push(m); footAt('wall', a[0], a[2], a[1] - 0.3 * h, 0.3 * h + 0.3); footAt('wall', b[0], b[2], b[1] - 0.3 * h, 0.3 * h + 0.3); };
    const menhirGeo = menhirOf(fk.menhirgeo, false), menhirGeoB = menhirOf(fk.menhirgeo, true), menhirs = [], menhirsB = [];
    // (h is what stands above its foot; bury is what goes into the ground besides; broke: which of the two shapes)
    const stone = (x, z, wd, h, th, yaw, tilt = 0, y = null, bury = 0.5, broke = false) => place(broke ? menhirsB : menhirs, x, (y ?? land(x, z)) + (h - bury) * 0.5, z, wd / 2.6, (h + bury) / 2.04, th / 0.72, yaw, tilt);
    const standing = [], AT = P.at, wayTan = (s) => { const i = clamp(Math.round(s), 0, P.way.n); return [P.way.tx[i], P.way.tz[i]]; };
    // a place by the old way: s metres along it from the wicket gate, lat metres to its right (negative: to its left)
    const beside = (s, lat, out = [0, 0]) => P.wayAt(s, lat, out);
    await ctx.yield();
    // THE SUNKEN LANE'S WALLS: from the wicket gate the old way runs 48 m down between two banks, and on each bank's top stands a
    // dry-stone wall 1.1 to 1.4 m high, 5 m from the way's middle. THE LANE'S GATE: where the lane opens on the moor a tall granite
    // gatepost (3.0 to 3.3 m) stands at each side of the way, GATE_HALF metres from its middle BY THE GATE'S OWN BREADTH: post,
    // lean and all it stands clear of the lane by the plan (the way is straight there and the line lies over its middle), and the
    // lane's test only confirms it. gatePosts keeps where each of the four posts of the moor's two gates was dealt.
    const GATE_HALF = 3.9, gatePosts = [];
    { const rLw = fk.lanewall;
      for (const sd of [-1, 1]) { let a = beside(3, sd * 5.0), ga = groundY(a[0], a[1]);
        // (every length's five draws are dealt first; whether it has fallen is told after, and moves no other length)
        for (let s = 5.4; s <= AT.sunk + 2; s += 2.4) { const D = [rLw.range(-0.15, 0.15), rLw.range(1.1, 1.4), rLw(), rLw.range(0.92, 1.12), rLw()];
          const b = beside(s, sd * (5.0 + D[0])), gb = groundY(b[0], b[1]), h = D[1], fallen = D[2] < 0.08;
          if (!fallen) { wallLay([a[0], ga, a[1]], [b[0], gb, b[1]], h, 0.85 * D[3], D[4] < 0.6 ? 0 : 1); standing.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1.3]); }
          a = [b[0], b[1]]; ga = gb; }
        const gp = beside(AT.sunk + 4, sd * GATE_HALF); stone(gp[0], gp[1], 0.62, rLw.range(3.0, 3.3), 0.5, Math.atan2(wayTan(AT.sunk)[0], wayTan(AT.sunk)[1]), rLw.range(-0.03, 0.03)); standing.push([gp[0], gp[1], 0.6]); gatePosts.push([gp[0], gp[1], 'the lane\'s gate']); }
      // (round 11: A LANTERN ON THE LANE'S RIGHT-HAND GATEPOST, on an iron arm toward the way, 2.6 m up: a light of the place.
      // It draws nothing from any stream; it is left out where it cannot keep the lane.)
      { const pq = beside(AT.sunk + 4, GATE_HALF), lq = beside(AT.sunk + 4, GATE_HALF - 0.6), g = groundY(pq[0], pq[1]);
        if (laneOk('lane gate lantern', lq[0], lq[1], 0.3, g + 2.1, g + 2.95)) {
          B.col(IRON).surf(SURF.PLAIN).beam([pq[0], g + 2.85, pq[1]], [lq[0], g + 2.85, lq[1]], 0.06, 0.06).cbox(lq[0], g + 2.25, lq[1], 0.32, 0.52, 0.32).cbox(lq[0], g + 2.77, lq[1], 0.42, 0.06, 0.42);
          B.col(lin('#ffc878'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lq[0], g + 2.31, lq[1], 0.22, 0.38, 0.22);
          lanternPts.push([lq[0], g + 2.5, lq[1], 1.5]); plPut(lq[0], g + 2.5, lq[1], 15, GOLD, 2.0); scene.userData.laneLantern = [lq[0], g + 2.5, lq[1]]; } } }
    // THE STONE ROWS: A DOUBLE ROW OF STANDING STONES, older than the way, runs along the brook's reach from the knoll's foot to
    // the turn for the bridge, and the old way goes down the middle of it: a stone every 4.2 to 5 m on each hand, ROW_HALF metres
    // from the way's middle (a hand more or less), TALL (round 11, A1: 3.1 to 4.7 m, they were 2.2 to 3.4: the eye goes between
    // them 2.5 m up and they stand over it on both hands), each as broad and as thick as it was (0.30 to 0.42 of the height it
    // had, two thirds as thick: a tall narrow stone), leaning up to 4 degrees
    // its own way, shouldered or broken by its draw; AT EACH END OF EACH ROW A TALLER STONE (5.4 to 6.4 m, was 4.2 to 5.0), a pace farther out.
    // EACH STANDS BROAD ALONG ITS ROW, as the stones of such rows were set (within 35 degrees of the row's line, by its draw):
    // the moon stands off the way's right hand here, so the left-hand row shows its moonlit faces to the way and the
    // right-hand row stands dark with a lit edge. Each throws its shadow (the shadow map's, and a long shade on the grass),
    // and their shadows lie across the way. The rows stand clear
    // of the lane by the plan: the reach is straight and the line lies over the way's middle; the lane's test only confirms it
    // (a set stone is measured as it stands: the round about its own axis that holds its corners, and its lean). No cross
    // stands on the moor.
    // (EVERY STONE'S EIGHT DRAWS ARE TAKEN FIRST, whether it is an end stone or not; what it is decides after which of them it uses)
    const rRow = fk.stonerow, ROW_HALF = 3.7, rowA = AT.knoll + 6, rowB = AT.rows1 - 8, nRow = Math.max(8, Math.round((rowB - rowA) / 4.6));
    for (const sd of [-1, 1]) for (let i = 0; i <= nRow; i++) {
      const D = [rRow(), rRow(), rRow(), rRow(), rRow(), rRow(), rRow(), rRow()], end = i === 0 || i === nRow;
      const s = lerp(rowA, rowB, i / nRow) + (end ? 0 : lerp(-0.4, 0.4, D[0])), hw = end ? lerp(4.2, 5.0, D[1]) : lerp(2.2, 3.4, D[1]), h = end ? lerp(5.4, 6.4, D[1]) : lerp(3.1, 4.7, D[1]), q = beside(s, sd * (ROW_HALF + (end ? 0.7 : 0) + lerp(-0.12, 0.12, D[2])));
      stone(q[0], q[1], hw * lerp(0.3, 0.42, D[3]), h, hw * lerp(0.2, 0.28, D[4]), Math.atan2(wayTan(s)[0], wayTan(s)[1]) + Math.PI / 2 + 1.2 * lerp(-0.5, 0.5, D[5]), lerp(-0.07, 0.07, D[6]), null, 0.6, !end && D[7] < 0.35); standing.push([q[0], q[1], h * 0.3]);
    }
    // THE STONE CIRCLE ON THE KNOLL: on the knoll's crown, 16 to 20 m across; one stone has fallen. It stands against the sky from
    // the lane's end and from the old way's round about the knoll's foot.
    const rCi = fk.circle, circR = rCi.range(8, 10), circQ = [P.K[0] + rCi.range(-3, 3), P.K[1] + rCi.range(-3, 3)], nCirc = Math.round(circR * 1.5), fallen = rCi.int(0, nCirc - 1);
    for (let i = 0; i < nCirc; i++) {
      // (3 to 4.4 m tall; rough pillars, every third one broken)
      // (every stone's six draws are dealt first; the fallen one uses two of them)
      const D = [rCi.range(-0.15, 0.15), rCi.range(3.0, 4.4), rCi.range(0.26, 0.36), rCi.range(0.16, 0.22), rCi.range(-0.3, 0.3), rCi.range(-0.14, 0.14)];
      const a = (i + D[0]) / nCirc * 6.2832, x = circQ[0] + Math.cos(a) * circR, z = circQ[1] + Math.sin(a) * circR, h = D[1];
      if (i === fallen) stone(x, z, h * 0.3, 0.6, h, -a, 0.05, null, 0.3); else stone(x, z, h * D[2], h, h * D[3], -a + Math.PI / 2 + D[4], D[5], null, 0.6, i % 3 === 1);
      standing.push([x, z, 1.0]);
    }
    // THE HUT CIRCLES: an old settlement at the knoll's foot, where the old way comes round to the brook: ONE ON EACH HAND OF THE
    // WAY, a little apart along it, and on a dense visit a third behind the left-hand row. Each is A RING OF LOW WALL, 9 to
    // 12 m across: lengths of the dry-stone wall laid round the ring, WAIST HIGH (0.95 to 1.25 m to the cope) and 0.9 m thick,
    // some fallen to half their height; a doorway with TWO DOOR STONES 2 to 2.5 m tall, which looks toward the old way; in
    // the ring's middle a HEARTH: a flat slab with a ring of small stones round it. The two by the way stand with their walls'
    // outer faces HUT_OFF metres from the way's middle: the way goes between them (clear of the lane by the plan). IN THE
    // RIGHT-HAND RING A PEAT FIRE BURNS LOW ON THE HEARTH (a standing state, as the tinners' fire in the ruin is: a small red
    // glow and its light on the ring's wall).
    // They are of the tor's granite: their tops take the moon, and a shade lies along the foot of the wall all the way round
    // (the list of standing things), so that the ring stands in the grass and is read as a ring.
    // (ROUND 11, A1: THE MOOR'S WARM LIGHTS ARE SEEN. The peat fire, the cottage's window and door and the bridge's two lanterns
    // each have a pool of warm light half as wide again as it was and nearly twice as strong, and a glow twice the size, so that
    // each reads from a hundred metres up the way; and two more lanterns stand by the way: one on the lane's gatepost and one
    // at the tor's gate. From the wicket to the pass no stretch of the way is without a warm light before the eye.)
    await ctx.yield();
    const huts = [], nHuts = dens > 1.05 ? 3 : 2, HUT_OFF = 4.8;
    for (let i = 0; i < nHuts; i++) {
      const s = i === 0 ? AT.knoll - rHu.range(6, 12) : i === 1 ? AT.knoll - rHu.range(26, 34) : AT.knoll + rHu.range(28, 40), R0 = rHu.range(4.5, 6), back = i < 2 ? HUT_OFF + 0.5 : rHu.range(13, 18), q = beside(s, (i === 0 ? 1 : -1) * (R0 + back)), cx = q[0], cz = q[1];
      const wq = beside(s + rHu.range(-3, 3), 0), door = Math.atan2(wq[1] - cz, wq[0] - cx) + rHu.range(-0.5, 0.5);
      // (the doorway's two jambs)
      for (const sg of [-1, 1]) { const a = door + sg * 1.4 / R0; stone(cx + Math.cos(a) * R0, cz + Math.sin(a) * R0, 0.9, rHu.range(2.0, 2.5), 0.55, -a, rHu.range(-0.06, 0.06), null, 0.5, rHu() < 0.5); }
      // (the ring's wall is lengths of the dry-stone wall laid round it, each some 2 m long and 1.1 to 1.5 m to its cope,
      // overlapping its neighbours; one in seven has fallen to half its height; none stands in the doorway)
      const rW = fk['hutwall' + i], nL = Math.round(6.2832 * R0 / 2.0);
      for (let j = 0; j < nL; j++) {
        const a = (j + 0.5 + rW.range(-0.1, 0.1)) / nL * 6.2832, off = Math.abs(((a - door + 9.42) % 6.2832) - 3.14), hh = rW.range(0.95, 1.25) * (rW() < 0.14 ? 0.5 : 1), th = rW.range(0.85, 1.0), which = rW() < 0.5 ? 0 : 1, half = 3.1416 / nL * 1.14;
        if (off < 0.26) continue;
        const pa = [cx + Math.cos(a - half) * R0, 0, cz + Math.sin(a - half) * R0], pb = [cx + Math.cos(a + half) * R0, 0, cz + Math.sin(a + half) * R0];
        pa[1] = groundY(pa[0], pa[2]); pb[1] = groundY(pb[0], pb[2]);
        wallLay(pa, pb, hh, th, which);
        if (j % 2 === 0) standing.push([cx + Math.cos(a) * R0, cz + Math.sin(a) * R0, 1.05]);
      }
      // (the hearth: a flat slab at the ring's middle, six small stones round it)
      { const hy = lowGround(cx, cz, 1.0), ha = rHu.range(0, 6.28);
        place(midBoulders, cx, hy + 0.02, cz, 1.05, 0.22, 0.9, ha, 0);
        for (let k = 0; k < 6; k++) { const a = ha + k * 1.047 + rHu.range(-0.15, 0.15), sz = rHu.range(0.26, 0.4); place(smallBoulders, cx + Math.cos(a) * 1.35, hy + 0.1, cz + Math.sin(a) * 1.35, sz, sz * 0.8, sz, a, 0); }
        // (the peat fire on the right-hand ring's hearth)
        if (i === 0) { B.col(lin('#ff5a22'), 1.5, 1.5).surf(SURF.GLOW, 0, 1).cbox(cx, hy + 0.2, cz, 0.55, 0.16, 0.45); lanternPts.push([cx, hy + 0.5, cz, 1.7, '#ff6a2c']); plPut(cx, hy + 0.9, cz, 14, EMBERL, 2.2); scene.userData.peatFire = [cx, hy + 0.4, cz]; } }
      huts.push({ x: cx, z: cz, r: R0, s });
    }
    // THE MOORMAN'S COTTAGE: a low house of moor stone under a turf roof on the way's left hand, COTTAGE_OFF metres from its
    // middle (a house stands by its road: its door is 8 to 10 m from the track), where the way turns to the clapper bridge;
    // it faces the old way, its one small window is lit and its door stands ajar on the fire within: THE ONE GOLD LIGHT OF
    // THE OPEN MOOR, lights of the place (plPut) that lie on the turf before the window and the door; its chimney smokes
    // (the smoke is made with the other smokes, below).
    { const rHt = fk.moorhut, COTTAGE_OFF = [10.5, 12.5], sH = AT.rows1 + rHt.range(4, 14), q = beside(sH, -rHt.range(COTTAGE_OFF[0], COTTAGE_OFF[1])), zn = zoneAt(P, q[0], q[1], ZONE), wp = beside(sH, 0);
      if (zn.park < 0.02 && zn.river > 14 && !standing.some((t) => Math.hypot(t[0] - q[0], t[1] - q[1]) < t[2] + 6)) {
        const nx = wp[0] - q[0], nz = wp[1] - q[1], nl = Math.hypot(nx, nz), g = groundY(q[0], q[1]);
        B.tr(q[0], g, q[1], Math.atan2(nx, nz));
        B.col(STONE_D, 0.75, 1).surf(SURF.MASONRY, 0).box(-2.9, -0.6, -2.0, 2.9, 2.1, 2.0, { m: 0.5, top: false });
        B.col(lin('#3c4630'), 0.8, 1.1).surf(SURF.PLAIN).gable(-3.1, -2.2, 3.1, 2.2, 2.1, 1.6, { alongX: true, overhang: 0.2, wallColor: STONE_D, m: 0.6, style: SURF.PLAIN });
        B.col(STONE_D, 0.7, 0.9).surf(SURF.MASONRY, 0).cbox(2.3, 2.1, -0.4, 0.9, 2.1, 0.9, { m: 0.6 });
        B.col(lin('#0c0a09')).surf(SURF.PLAIN).box(-0.1, 0, 2.0, 0.42, 1.75, 2.04); B.col(lin('#ff9a50'), 1.5, 1.5).surf(SURF.GLOW, 0, 1).box(0.42, 0.04, 2.0, 0.85, 1.75, 2.03);
        B.col(LICHEN, 0.9, 1.05).surf(SURF.PLAIN).box(-2.0, 0.72, 2.0, -0.8, 0.84, 2.1).box(-2.0, 1.6, 2.0, -0.8, 1.72, 2.1);
        B.col(lin('#ffc070'), 2.2, 2.2).surf(SURF.GLOW, 0, 1).box(-1.9, 0.84, 2.0, -0.9, 1.6, 2.06);
        B.col(STONE_D).surf(SURF.PLAIN).box(-1.43, 0.84, 2.0, -1.37, 1.6, 2.08);
        B.pop();
        // (the window's place in the world: 1.4 m to the house's own left of its middle, on the wall that faces the way)
        const rx = nz / nl, rz = -nx / nl, wx = q[0] + (nx / nl) * 2.1 - rx * 1.4, wz = q[1] + (nz / nl) * 2.1 - rz * 1.4;
        plPut(wx + (nx / nl) * 1.2, g + 1.3, wz + (nz / nl) * 1.2, 14, GOLD, 2.0); lanternPts.push([wx + (nx / nl) * 0.1, g + 1.2, wz + (nz / nl) * 0.1, 1.5, '#ffc070']);
        // (the door's place: 0.6 m to the house's own right of its middle; the chimney's: 2.3 m to its right, behind the ridge)
        const dx = q[0] + (nx / nl) * 3.4 + rx * 0.6, dz = q[1] + (nz / nl) * 3.4 + rz * 0.6;
        plPut(dx, g + 1.0, dz, 9, EMBERL, 1.4); lanternPts.push([q[0] + (nx / nl) * 2.1 + rx * 0.63, g + 0.9, q[1] + (nz / nl) * 2.1 + rz * 0.63, 1.1, '#ff9a50']);
        standing.push([q[0], q[1], 4]); laneNote('moor cottage', laneDist(q[0], q[1], 3.8, g - 1, g + 4.4, 40));
        scene.userData.cottage = { x: q[0], z: q[1], window: [wx, g + 1.2, wz], chimney: [q[0] + rx * 2.3 - (nx / nl) * 0.4, g + 4.2, q[1] + rz * 2.3 - (nz / nl) * 0.4] };
      }
    }
    await ctx.yield();
    // THE TOR'S GATE: where the miners' path leaves the brook and takes the hill, 46 m beyond the bridge, two great boulders lie
    // one on each side of it, 6.5 to 8 m from its middle
    { const rTg2 = fk.torgate; for (const sd of [-1, 1]) { const s = rTg2.range(2.6, 3.3), q = beside(AT.V + 46 + rTg2.range(-3, 3), sd * rTg2.range(6.5, 8)), sy = s * rTg2.range(0.62, 0.8);
        place(boulders, q[0], lowGround(q[0], q[1], s * 0.7) + sy * 0.2, q[1], s, sy, s * rTg2.range(0.8, 1.05), rTg2.range(0, 6.28), rTg2.range(-0.12, 0.12)); pileShade.push([q[0], q[1], s * 0.75]); }
      // (round 11: A LANTERN AT THE TOR'S GATE, on a post on the way's right hand 4.7 m from its middle, between the way and the
      // boulder: a light of the place, the one warm thing before the eye on the climb. It draws nothing from any stream.)
      { const lq = beside(AT.V + 46, 4.7), g = groundY(lq[0], lq[1]);
        if (laneOk('tor gate lantern', lq[0], lq[1], 0.35, g, g + 2.9)) {
          B.col(WTIMBER, 0.6, 0.9).surf(SURF.PLANKS, 0).beam([lq[0], g - 0.4, lq[1]], [lq[0], g + 2.6, lq[1]], 0.14, 0.14);
          B.col(IRON).surf(SURF.PLAIN).cbox(lq[0], g + 2.6, lq[1], 0.32, 0.5, 0.32);
          B.col(lin('#ffb060'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lq[0], g + 2.67, lq[1], 0.22, 0.34, 0.22);
          lanternPts.push([lq[0], g + 2.85, lq[1], 1.5]); plPut(lq[0], g + 2.85, lq[1], 14, GOLD, 1.6); standing.push([lq[0], lq[1], 0.3]); footAt('tor gate lantern', lq[0], lq[1], g - 0.4, 0.8); scene.userData.torLantern = [lq[0], g + 2.85, lq[1]]; }  }
      // (round 11: A LANTERN AT THE PASS, the same make, on the way's right hand 4.7 m from its middle where the way tops the
      // tor beside the crown (4 m beyond the way's highest place; the crown and the man stand on the left hand, 17 m and more
      // off): from the lantern at the tor's gate the way climbs 76 to 81 m to this place with no other light beside it; this one
      // stands on the brow at the head of that climb. It draws nothing from any stream; it is left out where a hard thing stands.)
      { const lq = beside(AT.T1 + 4, 4.7), g = groundY(lq[0], lq[1]);
        if (!hardIn(lq[0], lq[1], 0.6) && laneOk('pass lantern', lq[0], lq[1], 0.35, g, g + 2.9)) {
          B.col(WTIMBER, 0.6, 0.9).surf(SURF.PLANKS, 0).beam([lq[0], g - 0.4, lq[1]], [lq[0], g + 2.6, lq[1]], 0.14, 0.14);
          B.col(IRON).surf(SURF.PLAIN).cbox(lq[0], g + 2.6, lq[1], 0.32, 0.5, 0.32);
          B.col(lin('#ffb060'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(lq[0], g + 2.67, lq[1], 0.22, 0.34, 0.22);
          lanternPts.push([lq[0], g + 2.85, lq[1], 1.5]); plPut(lq[0], g + 2.85, lq[1], 14, GOLD, 1.6); standing.push([lq[0], lq[1], 0.3]); footAt('pass lantern', lq[0], lq[1], g - 0.4, 0.8); scene.userData.passLantern = [lq[0], g + 2.85, lq[1]]; } } }
    // outcrops: piles of granite 4 to 7 m tall breaking out of the moor here and there along the old way, 13 to 60 m from it on either
    // hand (none in the park or the mire, by the brook or on the tor; none whose foot and widest bed would reach the way's lane)
    const nOut = Math.round(9 * dens);
    for (let i = 0; i < nOut; i++) {
      // (each has a stream of its own: one that is left out moves no other)
      const rOc = fk['outcrop' + i], q = beside(lerp(AT.sunk + 30, AT.ME - 20, (i + rOc.range(0.1, 0.9)) / nOut), rOc.sign() * rOc.range(13, 60)), zn = zoneAt(P, q[0], q[1], ZONE), r0 = rOc.range(3.4, 5), h = rOc.range(4, 7), r1 = rOc.range(1.6, 2.4);
      if (zn.park > 0.02 || zn.mire > 0.02 || zn.river < 14 || P.wayOf(q[0], q[1], WQ).d < r0 * 1.5 + LANE_M || Math.hypot(q[0] - F.x, q[1] - F.z) < P.CROWN_R + 34 || standing.some((t) => Math.hypot(t[0] - q[0], t[1] - q[1]) < t[2] + r0 + 3)) continue;
      stack(q[0], q[1], land(q[0], q[1]) - 1, h + 1, r0, r1, false, farSlabs, null, [1.2, 1.9], 5);
      for (let k = 0; k < 4; k++) { const a = rOc.range(0, 6.28), d = rOc.range(4, 9), sz = rOc.range(0.5, 1.3); const bx = q[0] + Math.cos(a) * d, bz = q[1] + Math.sin(a) * d; if (P.wayOf(bx, bz, WQ).d >= 1.3 + sz * 1.3) place(stoneOf(sz), bx, lowGround(bx, bz, sz * 0.7) + sz * 0.1, bz, sz, sz * 0.7, sz, a, rOc.range(-0.2, 0.2)); }
    }
    // BOULDERS SCATTERED OVER THE MOOR, by the moor's own plan: places drawn over the country the old way crosses from the gate to
    // the mire's shore (the bounds of the way and 150 m about them), each kept by the ground it falls on (none in the park or the
    // mire; by the brook all are kept, elsewhere 45 in a hundred); 0.35 to 2 m, most of them small; none on the old way's trodden
    // strip. With every other boulder each is held to the lane's law (laneSift).
    { const rBo = fk.boulders, n = Math.round(330 * densC); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let s = 0; s <= AT.ME; s += 8) { const q = beside(s, 0); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
      for (let i = 0; i < n; i++) {
        const x = rBo.range(x0 - 150, x1 + 150), z = rBo.range(z0 - 150, z1 + 150), keep = rBo(), s = 0.35 + 1.65 * Math.pow(rBo(), 2.4), sy = s * rBo.range(0.6, 0.85), sz = s * rBo.range(0.8, 1.15), yaw = rBo.range(0, 6.28), tl = rBo.range(-0.2, 0.2), zn = zoneAt(P, x, z, ZONE);
        if (zn.park > 0.02 || zn.mire > 0.02 || keep > (zn.river < 12 ? 1 : 0.45) || P.wayOf(x, z, WQ).d < 1.3 + s * 1.3) continue;
        place(stoneOf(s), x, lowGround(x, z, s * 0.7) + sy * 0.1, z, s, sy, sz, yaw, tl);
        if (i % 110 === 109) await ctx.yield();
      } }
    // the figure on the tor: a tall thin man, bare-headed, legs a little apart, arms folded, looking out over the moor; his head turns
    const figure = makeTorFigure(ctx, { height: P.FIG_H, turn: 0.6, phase: fk.figure.range(0, 6.28) });
    // he stands on the top rock a pace and a half from its middle on its side toward the brook (the moon's own line runs from the
    // bridge through him) and faces back over the moor toward the hall, a little toward the mire
    figure.object.position.set(F.x - P.m[0] * 1.5, torTop - 0.12, F.z - P.m[1] * 1.5); figure.object.rotation.y = Math.atan2(-P.m[0] + P.w[0] * 0.3, -P.m[1] + P.w[1] * 0.3); scene.add(figure.object);
    await ctx.yield();

    // ---- the brook and its clapper bridge. The old way crosses the brook where it lies broad and still (FORD), on a long clapper
    // bridge: seven great flat slabs of granite end to end, each 3 m long and 2.4 m wide, on piers of piled stone, a pace over the
    // water. The pool mirrors the sky and holds the moon.
    const rRv = fk.riverstones, rivPts = [], rivAt = (b) => { const a = P.meander(b); return [P.V[0] + a * P.m[0] + b * P.nR[0], P.V[1] + a * P.m[1] + b * P.nR[1]]; };
    // (a point every 9.5 m of its own length, from 190 m west of the ford to 150 m beyond the reach's lower turn)
    for (let b = -190; b <= P.bX + 330; b += 9.5 * P.brookCos(b)) { const q = rivAt(b); rivPts.push([q[0], RIVER_Y - 0.62, q[1]]); }
    // (POLISH 1, MENDING 1: the waters mirror the moon at the night's `water`, live's strength: the moon's rise is not theirs)
    const WL = Water.waterLight(sky, H.water ? { sunColor: H.light, sunIntensity: H.water } : {}), river = Water.makeRiver({ rng: fk.riverwater, light: WL, points: rivPts, width: 6.6, speed: 2.4, deep: '#0d1622', shallow: '#3f5166', foamColor: '#56606c', wetColor: '#1c2228', foam: 0.1, bankFoam: 0.05, ripple: 1.4, opacity: 0.8, roughness: 0.1, bankFade: 1.3, glint: 0.75 });
    // (THE BROOK HOLDS THE MOON AS RUNNING WATER: dark water, rippled, with the moon's glint broken on it; hardly any foam, and
    // that slate-grey: no pale band lies along its banks.)
    scene.add(river.object); updaters.push((dt, t, cam) => river.update?.(dt, t, cam));
    await ctx.yield();
    let fordPool = null; const bridgeLamps = [];
    { const rBr = fk.bridge, pool = fordPool = Water.makeLake({ rng: fk.fordwater, light: WL, level: RIVER_Y - 0.62, center: [P.V[0], P.V[1]], radius: FORD.far + 6, segments: 28, depthAt: (x, z) => (zoneAt(P, x, z, ZONE).river < 6 && Math.hypot(x - P.V[0], z - P.V[1]) < FORD.far + 5 ? RIVER_Y - 0.62 - land(x, z) : -1),
        deep: '#0b151c', shallow: '#2b3c44', foamColor: '#2a2a1c', shoreFoam: 0, ripple: 0.5, clarity: 1.1, glitter: 0.8, roughness: 0.05, reflectivity: 1.0, glint: WL.skyQ.z * 0.3 });
      scene.add(pool.object); updaters.push((dt, t, cam) => pool.update?.(dt, t, cam));
      B.tr(P.V[0], RIVER_Y - 1.1, P.V[1], Math.atan2(-P.m[1], P.m[0]));
      // (SLABS ON PIERS: each slab is a pale flat stone 2.86 m long, with a dark joint of a hand and a half between it and the
      // next through which the water shows; each pier is piled stone, broader than the slabs by half a metre to either
      // hand, so that its two ends stand out of the water beside the walk)
      for (let i = -3; i <= 3; i++) { const dy = rBr.range(-0.04, 0.04), dz = rBr.range(-0.12, 0.12); B.col(STONE, 1.0, 1.2).surf(SURF.PLAIN).box(i * 3.0 - 1.43, 1.25 + dy, -1.2 + dz, i * 3.0 + 1.43, 1.56 + dy, 1.2 + dz); }
      for (let i = -3; i <= 2; i++) B.col(STONE_D, 0.8, 1).surf(SURF.MASONRY, 0).box(i * 3.0 + 1.5 - 0.6, 0, -1.7, i * 3.0 + 1.5 + 0.6, 1.25, 1.7, { m: 0.9 });
      for (const px of [-10.9, 10.9]) B.col(STONE_D, 0.8, 1).surf(SURF.MASONRY, 0).box(px - 0.7, 0.2, -1.4, px + 0.7, 1.3, 1.4, { m: 0.9, top: false });
      B.pop();
      laneNote('clapper bridge', laneDist(P.V[0], P.V[1], 11, RIVER_Y - 1.1, RIVER_Y + 0.5, 30)); }
    // A LANTERN AT EACH END OF THE CLAPPER BRIDGE: on a post, at the near end on the way's right hand and at the far end on its
    // left, a gate's half breadth from its middle: their gold lies on the slabs, on the banks and (the ford's own mirror,
    // below) on the water
    for (const en of [-1, 1]) { const bx = P.V[0] + en * 12.2 * P.m[0] - en * GATE_HALF * P.nR[0], bz = P.V[1] + en * 12.2 * P.m[1] - en * GATE_HALF * P.nR[1], g = groundY(bx, bz);
      if (laneOk('bridge lantern', bx, bz, 0.35, g, g + 2.8)) {
        B.col(WTIMBER, 0.6, 0.9).surf(SURF.PLANKS, 0).beam([bx, g - 0.4, bz], [bx, g + 2.6, bz], 0.14, 0.14);
        B.col(IRON).surf(SURF.PLAIN).cbox(bx + en * 0.22 * P.nR[0], g + 2.0, bz + en * 0.22 * P.nR[1], 0.3, 0.5, 0.3);
        B.col(lin('#ffb060'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(bx + en * 0.22 * P.nR[0], g + 2.07, bz + en * 0.22 * P.nR[1], 0.2, 0.34, 0.2);
        lanternPts.push([bx + en * 0.22 * P.nR[0], g + 2.25, bz + en * 0.22 * P.nR[1], 1.5]); plPut(bx + en * 0.5 * P.nR[0], g + 2.25, bz + en * 0.5 * P.nR[1], 15, GOLD, 2.0); standing.push([bx, bz, 0.3]); footAt('bridge lantern', bx, bz, g - 0.4, 0.8); bridgeLamps.push([bx, g + 2.25, bz]); if (en < 0) scene.userData.bridgeLantern = [bx, g + 2.25, bz]; } }
    // stones standing in the stream below the bridge
    for (let i = 0; i < 16; i++) { const b = rRv.range(-60, 70), q = rivAt(b), s = rRv.range(0.35, 0.9), o = rRv.range(-2.6, 2.6) * P.brookCos(b), yaw = rRv.range(0, 6.28); if (Math.abs(b) > 4) place(stoneOf(s), q[0] + o * P.m[0], RIVER_Y - 0.95 + s * 0.3, q[1] + o * P.m[1], s, s * 0.7, s, yaw); }

    await ctx.yield();
    // ---- the ponies: a small herd grazing on the knoll's flank, on the left hand of the way's round about it, 11 to 23 m from the way, a standing state; each lifts its head and looks about it once in
    // its own 12 to 22 s on the world's clock, its head up for three to four and a half tenths of that (the part's own rule)
    const rPo = fk.ponies, ponyList = [], nPony = Math.round(lerp(3, 6, (dens - 0.7) / 0.6)), herdS = AT.k0 + lerp(24, 44, rPo());
    for (let i = 0; i < nPony; i++) {
      const s = herdS + i * rPo.range(7, 12) - 14, side = -(11 + rPo.range(0, 6) + (i % 2) * 6);
      const wt = wayTan(s), wp = beside(s, side), rx = -wt[1], rz = wt[0], fa = rPo.range(-1.2, 1.2);
      const tone = rPo.range(0.7, 1.25);
      ponyList.push({ x: wp[0], z: wp[1], face: [Math.sin(fa) * rx + Math.cos(fa) * wt[0], Math.sin(fa) * rz + Math.cos(fa) * wt[1]], period: 17 + 1.25 * rPo.range(-4, 4),
        up: rPo.range(0.8, 0.95) - 0.5, tint: [tone, tone * rPo.range(0.85, 1.05), tone * rPo.range(0.8, 1.0)], size: rPo.range(0.9, 1.08), look: rPo.range(0.5, 0.9), phase: rPo() });
    }
    // (round 7: each pony's shade lies on the ground under it, with the standing things')
    for (const q of ponyList) standing.push([q.x, q.z, 1.1 * q.size]);
    const ponies = makePonies(ctx, { ponies: ponyList, ground: groundY, moon: H.moon ? H.light : null }); scene.add(ponies.object);
    await ctx.yield();
    // THE NEWTAKE WALL: a dry-stone wall of moor granite 1.15 to 1.5 m high and 0.85 m thick runs along the foot of the tor's hill
    // and crosses the miners' path askew, 30 to 36 m beyond the clapper bridge, 100 m to either hand, following the ground:
    // LENGTHS OF ROUNDED STONES UNDER A COPE (wallOf, above), and lengths of it have fallen to a spill of stones (by the draw). A
    // shade lies along its foot (the list of standing things). THE NEWTAKE GATE: the wall is open where the path goes through,
    // and a tall granite gatepost (3.0 to 3.4 m) stands at each side, GATE_HALF metres from the path's middle BY THE GATE'S OWN
    // BREADTH: each post is laid on the wall's own line at that distance from the path's middle line (the path is straight
    // there, the climb at the man), so that post, lean and all it stands clear of the lane by the plan; the wall's lengths
    // begin beyond the posts; the lane's test only confirms it. No length stands in the park, by the river, on a hut ring, a
    // set stone or a pony's ground. Every length that stands is written into the list of hard things (a round of 1.25 m about
    // its middle: two neighbours' rounds do not touch). It is relief for the moon to rake: its shadow lies down the moor beside it.
    { const rNt = fk.newtake, sW = AT.V + 30 + rNt.range(0, 6), skew = rNt.sign() * rNt.range(0.25, 0.5), SEG = 2.6, NS = 38, dr = [];
      for (let i = 0; i < 2 * NS; i++) dr.push([rNt.range(1.15, 1.5), rNt(), rNt.range(-0.3, 0.3), rNt.range(0.25, 0.75), rNt.range(0.5, 0.9)]);
      const pw = beside(sW, 0), wt = wayTan(sW), hx = wt[0], hz = wt[1], dx = -hz * Math.cos(skew) + hx * Math.sin(skew), dz = hx * Math.cos(skew) + hz * Math.sin(skew), nx = -dz, nz = dx;
      // (a place of the wall's line u metres along it from the path's middle lies u * cos(skew) metres from the path's middle line:
      // the posts stand uGate metres along it to either hand)
      const uGate = GATE_HALF / Math.cos(skew), at = (i) => { const d = (i - NS) * SEG, wob = i > 0 && i < 2 * NS ? dr[i][2] : 0; return [pw[0] + dx * d + nx * wob, pw[1] + dz * d + nz * wob]; };
      for (const sg of [-1, 1]) { const gx = pw[0] + dx * sg * uGate, gz = pw[1] + dz * sg * uGate; stone(gx, gz, 0.62, rNt.range(3.0, 3.4), 0.5, Math.atan2(dx, dz), rNt.range(-0.03, 0.03)); standing.push([gx, gz, 0.6]); gatePosts.push([gx, gz, 'the newtake gate']); }
      let wallN = 0; const wallShade = [];
      for (let i = 0; i < 2 * NS; i++) {
        if (i === NS) await ctx.yield();
        const a = at(i), b = at(i + 1), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, zn = zoneAt(P, mx, mz, ZONE), h = dr[i][0], ga = groundY(a[0], a[1]), gb = groundY(b[0], b[1]), gm = (ga + gb) / 2;
        // (the gate: no length whose end would reach within a hand of a post's own foot, nor between the posts)
        const gap = Math.abs(i + 0.5 - NS) * SEG < uGate + SEG * 0.62 + 0.4, off = zn.park > 0.02 || zn.river < 9 || zn.mire > 0.02 || zn.cut > 0.2 || standing.some((t) => Math.hypot(t[0] - mx, t[1] - mz) < t[2] + 2.6) || ponyList.some((t) => Math.hypot(t.x - mx, t.z - mz) < 5);
        if (gap || off || !hardOk('newtake wall', mx, mz, HARD.newtake)) continue;
        if (!laneOk('newtake wall', mx, mz, 1.7, gm - 0.4, gm + h + 0.4, 12)) continue;
        wallN++;
        // (a length that has fallen: a spill of three rounded stones where it stood)
        if (dr[i][1] < 0.13) { for (let k = 0; k < 3; k++) { const f = (k + 0.5) / 3, bx = lerp(a[0], b[0], f) + nx * (k - 1) * 0.5 * dr[i][3], bz = lerp(a[1], b[1], f) + nz * (k - 1) * 0.5 * dr[i][3], sz = 0.32 + 0.3 * ((dr[i][4] * (k + 2)) % 1);
            place(skirtStones, bx, lowGround(bx, bz, sz * 0.7) + 0.05 * sz, bz, sz, sz * 0.8, sz * 0.95, dr[i][2] * 9 + k, 0); } continue; }
        // (the length reaches an eighth beyond each end, into its neighbours; every length throws its shadow)
        { const ex = (b[0] - a[0]) * 0.12, ez = (b[1] - a[1]) * 0.12; wallLay([a[0] - ex, ga, a[1] - ez], [b[0] + ex, gb, b[1] + ez], h, 0.85 * (0.9 + 0.25 * dr[i][3]), dr[i][4] < 0.7 ? 0 : 1); }
        wallShade.push([mx, mz, 1.3]);
      }
      for (const q of wallShade) standing.push(q);
      scene.userData.newtake = { lengths: wallN, at: sW };
    }
    await ctx.yield();

    // ---- the great mire: pools of still water that mirror the sky, each with a pale rim of dead sedge and a wet green edge; the firm
    // way marked by wands; the island of the old tin mine
    // (THE POOLS HOLD THE MOON: the moon stands to the left of the mire's axis, and its light is in the mire as its path on the
    // water: the pools' mirror is a little rougher and its glitter doubled, so that
    // every pool on the moon's side carries a broken path of it)
    const rWa = fk.wands, rIs = fk.mouth, { ME, I, MIRE_Y, floorY } = P, yd = P.d, ydR = P.dR, wandLen = AT.I - AT.ME;
    // A PLACE OF THE MIRE BY THE WAND PATH: e metres along the path from the mire's shore, n metres to its right (negative: left)
    const mireXZ = (e, n) => P.wayAt(AT.ME + e, n);
    // (the path's own heading there, and its right hand)
    const mireDir = (e) => wayTan(AT.ME + e);
    const poolLevel = MIRE_Y - POOL_DOWN;
    // THE ROUNDS ARE KEPT CLEAR: nothing that stands in the mire stands on the hound's round, nor (on the visits that have it) on the
    // second hound's: roundOff is how far a place is from the nearer of them, and each standing kind below keeps its own breadth
    // and the beast's off it. The pools, the sedge and the cotton grass are run through.
    const roundOff = (x, z) => Math.min(P.houndRound.dist(x, z), rare ? P.ghostRound.dist(x, z) - 1 : 1e9);
    // LESSER TORS IN THE FOG. In the basin itself: up to six piles 11 to 16 m tall on feet 13 to 17 m across, one drawn in each
    // sixth of the round about the basin's middle (P.Cm), 0.45 to 0.8 of the basin's half length and breadth out from it, and
    // kept only where the fog lies 30 m deep and more, on the mire's own ground and off the hounds' ground: their heads stand
    // out of the bank. fogTors: x, z, the round the fog leaves about each, its height over the mire.
    const fogTors = [];
    { const rLt = fk.lessertors;
      for (let k = 0; k < 6; k++) {
        const a = (k + rLt.range(0.15, 0.85)) / 6 * 6.2832, d = rLt.range(0.45, 0.8), x = P.Cm[0] + Math.cos(a) * d * P.mireA, z = P.Cm[1] + Math.sin(a) * d * P.mireB, h = rLt.range(11, 16), r0 = rLt.range(6.5, 8.5), r1 = rLt.range(2.2, 3.2);
        if (P.seaDepth(x, z) < 30 || roundOff(x, z) < r0 + 6 || zoneAt(P, x, z, ZONE).mire < 0.9) continue;
        const g = groundY(x, z); stack(x, z, g - 1.2, h + 1.2, r0, r1, false, farSlabs, null, [1.6, 2.6]); fogTors.push([x, z, r0 + 4, h * 0.8]);
      } }
    await ctx.yield();
    // (THE OLD WORKS' LINE OF TRESTLES ALONG THE TRACK IS STRUCK, round 8: the works are the yard, the hill, the wheel and the two
    // ruins, each by the works' own plan. WHEEL_AT: the wheel's place, FOUND ON THE LAND (see THE WHEEL), written here in the
    // yard's frame for the yard's builders.)
    const WR_ = 12, WHEEL_FOOT = 6.2 + 0.2 * fk.wheel.range(0, 3), TIMBER = WTIMBER;
    const WHEEL_AT = (() => { const dx = P.fogC[0] - P.MH[0], dz = P.fogC[1] - P.MH[1], l = Math.hypot(dx, dz); let r = 10;
      while (r < 90 && P.land(P.MH[0] + dx / l * r, P.MH[1] + dz / l * r) - MIRE_Y >= WHEEL_FOOT) r += 0.5;
      const x = P.MH[0] + dx / l * r, z = P.MH[1] + dz / l * r; return [(x - I[0]) * yd[0] + (z - I[1]) * yd[1], (x - I[0]) * ydR[0] + (z - I[1]) * ydR[1]]; })();
    // (the feet of the mire's and the mine's things are written into the same list as the granite's: the place of each foot, the
    // height of the lowest thing built there, and `foot`, how far below the thing's own level it was built down into the ground;
    // the count holds each against the ground or the water under it: none in the air, none sunk past its foot)
    // THE OLD WORKING ON THE LODE, where the plan laid it (P.ruins: one ruin, on the lode's line out from the mine's mouth, on its
    // heap in its own pool). THE OLD STACK: a round stack alone, a chimney's stump broken on one rake (10 m on its low side, 15 to 16 m on its high), OF ONE DARK WEATHERED STONE from its square plinth to
    // its break (no brick, no band, no change of tone: nothing on it that could be taken for a sea mark); beside it the walls of a wheel pit 13 m long, falling to rubble, with half the rim of a fallen wheel
    // leaning in it. No fire burns in it and no smoke rises from it. It is written into the list of hard things.
    // (RUIN_FOOT: how far under the ruin's level the old stack's plinth and its wheel pit's walls are built, and their feet written)
    const worksFires = [], EMBER = lin('#ff4a1c'), RUIN_FOOT = 3.6;
    for (const R of P.ruins) {
      // (sd: the hand of the ruin that is toward the basin's middle, in its own frame: +1 its right)
      const rb = fk.ruinbuild, ry = Math.atan2(-R.hz, R.hx) + R.yaw, cy_ = Math.cos(ry), sy_ = Math.sin(ry), g = MIRE_Y + 0.5, wpR = P.Cm, sd = (wpR[0] - R.x) * sy_ + (wpR[1] - R.z) * cy_ > 0 ? 1 : -1, D = [rb(), rb(), rb(), rb(), rb(), rb()];
      const toW = (lx, lz) => [R.x + lx * cy_ + lz * sy_, R.z - lx * sy_ + lz * cy_];
      const hardAt = (lx, lz, r) => { const q = toW(lx, lz); hard.push([q[0], q[1], r, 'ruin']); standing.push([q[0], q[1], Math.min(r, 3)]); };
      B.tr(R.x, g, R.z, ry);
      B.col(WSTONE, 0.62, 1.0).surf(SURF.MASONRY, 0);
      let top = 0;
      {
        // the stack on its plinth, broken off, its rim jagged; the flue arch at its foot, dark
        // (the plinth and the wheel pit's walls are built RUIN_FOOT, 3.6 m, under the ruin's level, round 11: built 2.4 m under
        // it they stood up to 0.63 m over the drawn ground or a pool's bed on 18 seeds of 300, where the heap falls away into
        // its pool; built 3.2 m under it, as ordered, the count by the drawn terrain's own triangles still found one place
        // of one seed (200) 0.03 m over the ground: so 0.4 m deeper than the order's figure)
        B.cbox(0, -RUIN_FOOT, 0, 6.6, 2.2 + RUIN_FOOT, 6.6, { m: 0.5 });
        // (a mine's stack: plain coursed stone, tapering, ONE DARK WEATHERED STONE from plinth to rim, no collar, no band and no
        // change of tone on it, 4.6 m across at its foot. ROUND 11: A CHIMNEY'S STUMP, BROKEN ON ONE RAKE. It stood 16.7 m with four
        // stepped shards on its rim, which read as a tower's battlements. Now its whole head is one slanting break: the wall
        // stands 10 m on its low side and 15 to 16 m on its high side, the break running round between them in one sweep, a
        // little ragged by the stack's own draws. The wall has its thickness (0.42 m): the break's face shows pale, the flue
        // inside is black. Nothing level and nothing toothed is left on it.)
        B.col(WSTONE, 0.46, 0.6).cyl(0, 2.2, 0, 2.3, 2.02, 7.4, 12);
        { const NS = 12, yb = 9.6, a0 = D[0] * 6.2832, rAt = (y) => 2.3 - 0.0379 * (y - 2.2), gAt = (y) => mul(WSTONE, 0.46 + 0.28 * (y - 2.2) / 14.5);
          const hOf = (i) => { const c = 0.5 + 0.5 * Math.cos(i / NS * 6.2832 - a0); return yb + 0.5 + 5.4 * c * c + 0.7 * D[1 + i % 5] * c; };
          const pt = (i, y, r) => { const a = i / NS * 6.2832; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
          const SOOT = mul(WSTONE, 0.07), BREAK = mul(WSTONE, 0.8), WALL = 0.42;
          for (let i = 0; i < NS; i++) { const j = (i + 1) % NS, hi = hOf(i), hj = hOf(j), ri = rAt(hi), rj = rAt(hj), r0 = rAt(yb), u0 = i * 0.53, u1 = u0 + 0.53;
            B.quad(pt(j, yb, r0), pt(i, yb, r0), pt(i, hi, ri), pt(j, hj, rj), [u1, yb * 0.5, u0, (hi + hj) * 0.25], gAt(yb), gAt((hi + hj) / 2));
            B.quad(pt(i, yb - 0.4, r0 - WALL), pt(j, yb - 0.4, r0 - WALL), pt(j, hj, rj - WALL), pt(i, hi, ri - WALL), [u0, yb * 0.5, u1, (hi + hj) * 0.25], SOOT, SOOT);
            B.quad(pt(j, hj, rj), pt(i, hi, ri), pt(i, hi, ri - WALL), pt(j, hj, rj - WALL), [u1, 0, u0, 0.2], BREAK, BREAK); }
          weedsAt(Math.cos(a0 + Math.PI) * 1.8, yb + 0.6, Math.sin(a0 + Math.PI) * 1.8, 0.45, 3); }
        B.col(WDARK).surf(SURF.PLAIN).box(-0.9, 2.2, sd * 3.3 - 0.04, 0.9, 4.4, sd * 3.3 + 0.04);
        // the wheel pit beside it, along the way: two walls falling to rubble, and half a fallen wheel's rim leaning in it
        B.col(WSTONE, 0.62, 1.0).surf(SURF.MASONRY, 0);
        const PZ = -sd * 1.2;
        for (let k = 0; k < 6; k++) { const xa = 4.6 + k * 2.2, hA = [3.4, 3.2, 2.6 + D[0], 1.9, 1.2 + D[1], 0.7][k]; B.box(xa, -RUIN_FOOT, PZ - 2.3, xa + 2.2, hA, PZ - 1.4, { m: 0.5 }).box(xa, -RUIN_FOOT, PZ + 1.4, xa + 2.2, hA * (0.6 + 0.4 * D[k]), PZ + 2.3, { m: 0.5 }); }
        B.col(TIMBER, 0.55, 0.95).surf(SURF.PLANKS, 0);
        for (let k = 0; k < 9; k++) { const a0 = (20 + k * 20) * DEG, a1 = a0 + 20 * DEG, Rw = 3.7, at = (a) => [9.5 + Math.cos(a) * Rw, 0.4 + Math.sin(a) * Rw * 0.94, PZ + 0.5 - Math.sin(a) * Rw * 0.33];
          B.beam(at(a0), at(a1), 0.34, 0.4); if (k % 3 === 0) B.beam([9.5, 0.4, PZ + 0.5], at(a0), 0.2, 0.24); }
        B.col(IRON).surf(SURF.PLAIN).beam([9.5, 0.4, PZ - 2.6], [9.5, 0.9, PZ + 2.9], 0.34, 0.34);
        weedsAt(8.2, 3.2, PZ - 1.85, 0.4, 2);
        hardAt(0, 0, 4.9); for (const lx of [6.8, 11.2, 15.6]) hardAt(lx, PZ, 3.0); top = 16.4;
      }
      B.pop();
      R.top = g + top;
      for (const c of R.k === 0 ? [[-5.5, -5.5], [-5.5, 5.5], [5.5, -5.5], [5.5, 5.5], [9.9, -sd * 3.4]] : [[-3.3, -3.3], [-3.3, 3.3], [3.3, -3.3], [3.3, 3.3], [17.8, -sd * 1.2 - 1.85], [17.8, -sd * 1.2 + 1.85]]) { const q = toW(c[0], c[1]); footAt('ruin ' + (R.k + 1), q[0], q[1], g - (R.k === 0 ? 1.6 : RUIN_FOOT), R.k === 0 ? 2.1 : RUIN_FOOT + 0.5); }
      laneNote('ruin', laneDist(R.x, R.z, R.k === 0 ? 9 : 13, g - 2, g + top, 60));
      await ctx.yield();
    }
    await ctx.yield();
    const poolOpts = { light: WL, level: poolLevel,
      // (NO POOL IS WHITE, round 6: the pools mirrored the moon's broad glow at 1.45 times the sky's own light and wore a pale foam at
      // their shores. Now they mirror the sky at its own light, the moon's glow in the mirrored sky is under a fifth of the
      // sky's, and
      // no foam lies at the shore: the brightest thing in a pool is the sky's own blue, or a spark of the moon's path)
      deep: '#0b151a', shallow: '#263a34', foamColor: '#2a2a1c', shoreFoam: 0, foamWidth: 1.5, ripple: 0.6, clarity: 1.1, glitter: 0.7, roughness: 0.055, reflectivity: 1.0, glint: WL.skyQ.z * 0.18,
      // (the pools mirror the sky and the land that stands round the mire: the tor's hill, the far hills, the mine's hill)
      skyline: { heightAt: land, near: 40, far: 900, steps: 14, samples: 64 }, band: { color: '#10131b', top: '#1f2532', amount: 0.9, softness: 0.05 } };
    // THE POOLS' SHEET IS MADE HERE, IN BANDS (round 9, A11: the kit's lake asked the depth of all its 3,700 places in one
    // step): the kit's own layout of a lake's sheet (a square grid of `pn` cells a side about the basin's middle; at every
    // corner the depth, and the depth over its slope as the kit's shore measure; a triangle dry at all three corners is not
    // drawn), eight rows of corners to a step, and handed to the kit's lake as its geometry.
    const pR = Math.max(P.mireA, P.mireB) + 12, pn = Math.round(60 * (0.7 + 0.3 * detail)), pW1 = pn + 1, pCell = 2 * pR / pn, pX0 = P.Cm[0] - pR, pZ0 = P.Cm[1] - pR, pDep = new Float32Array(pW1 * pW1);
    const poolGeo = own(new THREE.PlaneGeometry(2 * pR, 2 * pR, pn, pn)); poolGeo.rotateX(-Math.PI / 2);
    { const ps = poolGeo.attributes.position, shore = new Float32Array(pW1 * pW1);
      for (let j = 0; j < pW1; j++) { if (j % 8 === 7) await ctx.yield();
        for (let i = 0; i < pW1; i++) { const k = j * pW1 + i, x = ps.getX(k) + P.Cm[0], z = ps.getZ(k) + P.Cm[1]; ps.setX(k, x); ps.setZ(k, z); pDep[k] = zoneAt(P, x, z, ZONE).mire > 0.5 ? poolLevel - land(x, z) : -1; } }
      for (let j = 0; j < pW1; j++) for (let i = 0; i < pW1; i++) { const k = j * pW1 + i, i0 = Math.max(0, i - 1), i1 = Math.min(pn, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(pn, j + 1);
        const gx = (pDep[j * pW1 + i1] - pDep[j * pW1 + i0]) / ((i1 - i0) * pCell), gz = (pDep[j1 * pW1 + i] - pDep[j0 * pW1 + i]) / ((j1 - j0) * pCell); shore[k] = Math.max(-50, Math.min(500, pDep[k] / Math.max(0.03, Math.hypot(gx, gz)))); }
      poolGeo.setAttribute('aDepth', new THREE.BufferAttribute(pDep, 1)); poolGeo.setAttribute('aShore', new THREE.BufferAttribute(shore, 1));
      const src = poolGeo.index.array, wet = []; for (let i = 0; i < src.length; i += 3) if (pDep[src[i]] > 0 || pDep[src[i + 1]] > 0 || pDep[src[i + 2]] > 0) wet.push(src[i], src[i + 1], src[i + 2]);
      poolGeo.setIndex(wet); poolGeo.computeBoundingSphere(); }
    await ctx.yield();
    // (the kit's lake: its call stands between two hand-backs of its own; it bakes the land's skyline for the mirror)
    const pools = Water.makeLake({ ...poolOpts, rng: fk.pools, center: [P.Cm[0], P.Cm[1]], radius: pR, geometry: poolGeo });
    scene.add(pools.object); updaters.push((dt, t, cam) => pools.update?.(dt, t, cam));
    await ctx.yield();
    // ONE RULE OF THE WATER (round 9): THE SHEET'S OWN DEPTH at a place, as it is drawn (the sheet is a grid; its depth at a place
    // is the depth its own triangle gives there, and it shows water where that is over nought). What stands on the pools' water
    // (the boat, the reed beds, the tall reeds, the slabs) asks this and nothing else: where the sheet draws no water a thing
    // stands on the ground.
    const sheetDepth = (() => { const ps = poolGeo.attributes.position, dp = pDep, W1 = pW1, H1 = pW1, x0 = ps.getX(0), z0 = ps.getZ(0), sx = ps.getX(1) - x0, sz = ps.getZ(W1) - z0;
      return (x, z) => { const fu = (x - x0) / sx, fv = (z - z0) / sz, i = Math.floor(fu), j = Math.floor(fv); if (i < 0 || j < 0 || i >= W1 - 1 || j >= H1 - 1) return -1; const u = fu - i, v = fv - j, a = dp[j * W1 + i], b = dp[(j + 1) * W1 + i], c = dp[(j + 1) * W1 + i + 1], d = dp[j * W1 + i + 1];
        if (a <= 0 && b <= 0 && d <= 0 && u + v <= 1) return -1; if (b <= 0 && c <= 0 && d <= 0 && u + v > 1) return -1;
        return u + v <= 1 ? a + u * (d - a) + v * (b - a) : c + (1 - u) * (b - c) + (1 - v) * (d - c); }; })();
    // (the level a thing stands at on the mire: the pools' water where the sheet draws it, `down` under its face; the drawn ground elsewhere)
    const WET = 0.03, standOn = (x, z, down = 0) => { const g = groundY(x, z); return sheetDepth(x, z) > WET ? Math.max(g, poolLevel - down) : g; };
    scene.userData.sheetDepth = sheetDepth;
    // THE LEAD'S WATER: the basin's stream is narrower than the sheet's cells, so it has a sheet of its own along its line: every
    // 3 m of its length, five places across 9 m, the depth at each the lead's own (the same water, the same level); where the
    // pools' sheet already shows water (the tarn's head) it has none
    { const Ld = P.lead, lp = [], ld = [], li = [], nT = Math.max(2, Math.ceil((Ld.len + 6) / 3)), CR = [-4.5, -2.25, 0, 2.25, 4.5];
      for (let k = 0; k <= nT; k++) { const t = -6 + (Ld.len + 6) * k / nT, wob = -3.2 * Math.sin(t * 0.06); for (const c of CR) { const x = Ld.head[0] + Ld.lu[0] * t - Ld.lu[1] * (c + wob), z = Ld.head[1] + Ld.lu[1] * t + Ld.lu[0] * (c + wob); lp.push(x, 0, z); ld.push(sheetDepth(x, z) > WET || zoneAt(P, x, z, ZONE).mire < 0.5 ? -0.5 : poolLevel - land(x, z)); } }
      for (let k = 0; k < nT; k++) for (let c = 0; c < 4; c++) { const a = k * 5 + c, b = a + 5; if (ld[a] > 0 || ld[a + 1] > 0 || ld[b] > 0 || ld[b + 1] > 0) li.push(a, b, a + 1, a + 1, b, b + 1); }
      if (li.length) { const lg = own(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aDepth', new THREE.Float32BufferAttribute(ld, 1)); lg.setIndex(li); lg.computeBoundingSphere();
        await ctx.yield();
        // (the same water, the same mirror: the lead's sheet is handed the pools' middle and reach for the land's skyline)
        const leadW = Water.makeLake({ ...poolOpts, rng: fk.leadwater, center: [P.Cm[0], P.Cm[1]], radius: pR, geometry: lg, shoreSlope: 0.3 }); leadW.object.name = 'the lead\'s water'; scene.add(leadW.object); updaters.push((dt, t, cam) => leadW.update?.(dt, t, cam));
        scene.userData.leadWater = { geometry: lg, depth: ld }; } }
    await ctx.yield();
    // THE WANDS: peeled posts as thick as an arm (12 cm at the top, 18 at the foot), 2.2 to 2.7 m tall (2.6 m times 0.85 to 1.05), each
    // with a tuft of twigs bound on its top and NO RAG, every 6.5 m along the old way's LEFT hand (the tarn's side: they mark the water's
    // side of the boards), 3.9 to 4.5 m from the way's middle. THEY BEGIN ON THE HILL'S FOOT, WAND_BACK metres short of the mire's
    // shore, where the miners' path leaves the rock for wet turf, and go on along the boards to the yard. Each leans up to ten degrees its own way: the lane's test takes it whole, as an upright cylinder 1.35 m in radius (its
    // lean and its tuft). Each has a dark foot on the ground where it stands (the shade laid under every standing thing).
    // THEY ARE WHITE: peeled and limewashed, so that a man finds the next one in the dark.
    const WAND_BACK = 72, nW = Math.floor((wandLen - 40 + WAND_BACK + 8) / 6.5), wandMat = new THREE.MeshStandardMaterial({ color: '#d6d2c2', roughness: 0.85, side: THREE.DoubleSide, vertexColors: true });
    const wandGeo = new THREE.CylinderGeometry(0.06, 0.09, 2.6, 6).translate(0, 1.3, 0).toNonIndexed();
    { const p = Array.from(wandGeo.attributes.position.array), rag = [];
      for (let k = 0; k < 5; k++) { const a = k * 1.2566, c = Math.cos(a), sn = Math.sin(a); rag.push(-sn * 0.03, 2.56, c * 0.03, sn * 0.03, 2.56, -c * 0.03, c * 0.24, 2.98 + 0.06 * (k % 2), sn * 0.24); }
      // (the post is peeled wood; the tuft dry twigs)
      const tint = []; for (let k = 0; k < p.length / 3; k++) tint.push(1, 1, 1); for (let k = 0; k < 15; k++) tint.push(0.62, 0.55, 0.38);
      wandGeo.setAttribute('position', new THREE.Float32BufferAttribute(p.concat(rag), 3)); wandGeo.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3)); wandGeo.deleteAttribute('normal'); wandGeo.deleteAttribute('uv'); wandGeo.computeVertexNormals(); }
    lampsOn(wandMat, 'wand', { soft: 0.5 });
    const wands = new THREE.InstancedMesh(wandGeo, wandMat, nW), wandAt = [];
    let wK = 0;
    for (let i = 0; i < nW; i++) { const e = -WAND_BACK + i * 6.5 + rWa.range(-1, 1), n = -rWa.range(3.9, 4.5), q = mireXZ(e, n), lx = 0.8 * rWa.range(-0.16, 0.16), yaw = rWa.range(0, 6.28), lz = 0.8 * rWa.range(-0.16, 0.16), sy = rWa.range(0.85, 1.05);
      const g = land(q[0], q[1]);
      if (!laneOk('wand', q[0], q[1], 1.35, g - 0.2, g + 3.05 * sy) || !hardOk('wand', q[0], q[1], HARD.wand)) continue;
      eT.set(lx, yaw, lz); qT.setFromEuler(eT); wands.setMatrixAt(wK++, mT.compose(vT.set(q[0], g - 0.15, q[1]), qT, sT.set(1, sy, 1))); wandAt.push([q[0], q[1], 2.6 * sy]); standing.push([q[0], q[1], 0.25]); }
    wands.count = wK; wands.instanceMatrix.needsUpdate = true; wands.castShadow = true; wands.computeBoundingSphere(); scene.add(wands);
    // bleached dead trees standing in the mire, 14 to 40 m either side of the firm path, and a line of old fence posts that runs out
    // into it and is lost
    const rDt = fk.deadtrees, nDead = 7;
    for (let i = 0; i < nDead; i++) {
      const e = lerp(24, wandLen - 55, (i + rDt()) / nDead), n = rDt.sign() * rDt.range(14, 40), sz = 1.25 * rDt.range(0.7, 1.15), rot = rDt.range(0, 6.28), v = 2 + rDt.int(0, 1), q = mireXZ(e, n);
      if (zoneAt(P, q[0], q[1], ZONE).mire > 0.6 && ZONE.isle < 0.05 && roundOff(q[0], q[1]) > 4 && laneOk('dead tree', q[0], q[1], deadReach * sz, land(q[0], q[1]), land(q[0], q[1]) + 6.5 * sz) && hardOk('dead tree', q[0], q[1], HARD.thorn * sz)) thornPts.push({ x: q[0], y: land(q[0], q[1]) - 0.2, z: q[1], s: sz, rot, v, d: Math.abs(n), u: 0 });
    }
    const rFp = fk.posts, fpE = rFp.range(40, 90), fpSide = rFp.sign(), fpAng = rFp.range(0.9, 1.3), fpN = 15;
    B.col(lin('#6e695f'), 0.7, 1.05).surf(SURF.PLANKS, 0);
    for (let i = 0; i < fpN; i++) {
      const d = 9 + i * 2.7 + rFp.range(-0.3, 0.3), h = rFp.range(0.8, 1.45) * (1 - 0.4 * i / fpN), lx = rFp.range(-0.25, 0.25), lz = rFp.range(-0.25, 0.25), e = fpE + Math.cos(fpAng) * d, q = mireXZ(e, fpSide * Math.sin(fpAng) * d), g = land(q[0], q[1]);
      if (roundOff(q[0], q[1]) > 1.6 && laneOk('fence post', q[0], q[1], 0.35, g - 0.3, g + h) && hardOk('fence post', q[0], q[1], HARD.fencePost)) { B.beam([q[0], g - 0.3, q[1]], [q[0] + lx, g + h, q[1] + lz], 0.24, 0.24); standing.push([q[0], q[1], 0.3]); }
    }
    await ctx.yield();
    // THE MIRE'S MIDDLE GROUND, between the firm way and the fog (all of it stands; each thing is measured against the lane):
    // DROWNED TREES: bare bleached trees 4 to 7.5 m tall with broken boughs (the kit's dead tree, barked, in the moon's light, a
    // dark foot under each; none reaches more than 2.9 m from its foot), standing in the pools or at their edge, 9 to 60 m
    // from the wand path (of three places drawn for each, the first that is wet; where none of the three is wet, the first that
    // is on the mire and off the isle, the lane and the hound's round: 38 to 39 in a hundred of those that stand take this dry
    // fallback and stand on the sedge, not in water)
    const rDr = fk.drowned, nDr = Math.round(11 * dens);
    for (let i = 0; i < nDr; i++) {
      const c = []; for (let k = 0; k < 3; k++) { const e = lerp(16, wandLen - 60, (i + rDr()) / nDr); c.push(mireXZ(e, rDr.sign() * rDr.range(9, 60))); }
      const h = rDr.range(4, 7.5), lean = [rDr.range(-0.9, 0.9), rDr.range(-0.9, 0.9)], nb = 3 + rDr.int(0, 2), bs = [];
      for (let k = 0; k < nb; k++) bs.push([rDr.range(0.4, 0.92), rDr.range(0, 6.28), rDr.range(1.2, 2.6), rDr.range(0.2, 1.1)]);
      const qWet = c.find((p) => { const zn = zoneAt(P, p[0], p[1], ZONE); return zn.pool > 0.15 && zn.isle < 0.05 && zn.mire > 0.6 && zn.lane < 0.05 && zn.wand < 0.05 && roundOff(p[0], p[1]) > 4.2; });
      const q = qWet || c.find((p) => zoneAt(P, p[0], p[1], ZONE).mire > 0.6 && ZONE.isle < 0.05 && ZONE.lane < 0.05 && ZONE.wand < 0.05 && roundOff(p[0], p[1]) > 4.2);
      if (!q) continue;
      const g = land(q[0], q[1]);
      if (!laneOk('drowned tree', q[0], q[1], 3.0, g - 0.5, g + h + 1) || !hardOk('drowned tree', q[0], q[1], HARD.drowned)) continue;
      if (qWet) hardTally.drownedWet++; else hardTally.drownedDry++;
      // (which of the two trees, and how it is turned, by the draws that used to shape its boughs)
      thornPts.push({ x: q[0], y: g - 0.35, z: q[1], s: Math.min(h / 6, 2.9 / drownReach), rot: bs[0][1], v: 4 + (nb % 2), d: P.wayOf(q[0], q[1], WQ).d, u: 0 });
      standing.push([q[0], q[1], 0.8]);
    }
    await ctx.yield();
    // PEAT RICKS: turves stacked to dry in ricks 1.6 m high, two to four in a row, on the sedge 8 to 34 m from the wand path
    const rRk = fk.ricks, nRk = Math.round(6 * dens);
    for (let i = 0; i < nRk; i++) {
      const e = lerp(30, wandLen - 70, (i + rRk()) / nRk), q = mireXZ(e, rRk.sign() * rRk.range(8, 34)), yaw = rRk.range(0, 3.14), nn = 2 + rRk.int(0, 2), ds = []; for (let k = 0; k < 4; k++) ds.push(rRk.range(-0.3, 0.3));
      const zn = zoneAt(P, q[0], q[1], ZONE);
      if (zn.mire < 0.6 || zn.pool > 0.12 || zn.isle > 0.05 || (zn.lane > 0.05 || zn.wand > 0.05)) continue;
      for (let k = 0; k < nn; k++) {
        const x = q[0] + Math.cos(yaw) * (k - (nn - 1) / 2) * 3.4, z = q[1] + Math.sin(yaw) * (k - (nn - 1) / 2) * 3.4, g = land(x, z);
        if (zoneAt(P, x, z, ZONE).pool > 0.12 || roundOff(x, z) < 3 || !laneOk('peat rick', x, z, 1.7, g - 0.3, g + 1.7) || !hardOk('peat rick', x, z, HARD.rick)) continue;
        standing.push([x, z, 1.5]); B.tr(x, g, z, -yaw + ds[k]); rickOf(0, 0, 0, ds[k] * 0.4); B.pop();
      }
    }
    await ctx.yield();
    // THE OLD BOUNDARY: a line of leaning posts 1.6 to 2.5 m tall, 5.5 m apart, that crosses the wand path and the mire askew (some
    // still carry a rail to the next); the posts that would stand in the lane or within 3.6 m of a hound's round are left out, so the
    // line is broken where the firm way and the rounds cross it (a rail is 5.5 m long: none reaches a round across such a gap)
    const rBd = fk.boundary, bdE = rBd.range(0.24, 0.36) * wandLen, bdAng = rBd.sign() * rBd.range(0.5, 0.8), nBd = 36;
    B.col(lin('#6e695f'), 0.7, 1.05).surf(SURF.PLANKS, 0);
    let bdPrev = null;
    for (let i = 0; i < nBd; i++) {
      // (the page is handed back once in the middle of the posts: the lead's step Q; no draw is moved by it)
      if (i === (nBd >> 1)) await ctx.yield();
      const d = (i - nBd / 2) * 5.5 + rBd.range(-0.5, 0.5), h = rBd.range(1.6, 2.5), lx = rBd.range(-0.45, 0.45), lz = rBd.range(-0.45, 0.45), rail = rBd() < 0.45;
      const q = mireXZ(bdE + Math.sin(bdAng) * d, Math.cos(bdAng) * d), zn = zoneAt(P, q[0], q[1], ZONE), g = land(q[0], q[1]);
      if (zn.mire < 0.5 || zn.isle > 0.05 || (zn.lane > 0.05 || zn.wand > 0.05) || roundOff(q[0], q[1]) < 3.6 || !laneOk('boundary post', q[0], q[1], 0.75, g - 0.4, g + h) || !hardOk('boundary post', q[0], q[1], HARD.boundaryPost)) { bdPrev = null; continue; }
      const topB = [q[0] + lx, g + h, q[1] + lz];
      B.beam([q[0], g - 0.5, q[1]], topB, 0.3, 0.3); standing.push([q[0], q[1], 0.35]);
      // (a rail goes up only where it runs through no hard thing: asked of the list at three places between its posts)
      if (rail && bdPrev && laneDist((q[0] + bdPrev[0]) / 2, (q[1] + bdPrev[2]) / 2, 3.2, g, g + 2.5) >= LANE_M && ![0.25, 0.5, 0.75].some((f) => hardIn(lerp(bdPrev[0], topB[0], f), lerp(bdPrev[2], topB[2], f), 0.1))) B.beam([bdPrev[0], bdPrev[1] - 0.5, bdPrev[2]], [topB[0], topB[1] - 0.7, topB[2]], 0.09, 0.16);
      bdPrev = topB;
    }
    await ctx.yield();
    // ---- THINGS OF THE MIRE ALONG THE WAND PATH. The mire has subjects of its own, each a new thing as it comes: at stations 21 m
    // apart along the wand path (each moved up to 4 m either way by its draw), on either hand by a draw, its middle its own half
    // breadth and 4.6 to 9 m from the boards' middle; each is held to the lane's law (2.5 m). The kinds, each dealt once before any comes twice, in an order
    // shuffled by the draw: A GREAT BOG OAK (dead, barked, 9 to 12 m of boughs: the kit's dead tree, in the moon's light), A PEAT
    // CART sunk to its axle with its shafts in the air, A FIVE-BARRED GATE hanging askew at the end of a broken fence run, A BOAT'S
    // RIBS at a pool's edge, A CAUSEWAY OF SLABS on little piers of stone, A BED OF TALL REEDS, A STAND OF DROWNED TREES in a
    // pool, and WISPS over a pool (which go by the world's clock like the others of their kind).
    // Every draw of a station is taken before anything is tried (four places and sixteen numbers for its shape); of the four
    // places the first that suits the kind (a boat lies at a pool's edge, drowned trees stand in water) and where every part of
    // it keeps the lane's law, clear of the hounds' rounds and of every hard thing already standing; else the first that keeps those
    // without suiting; else the same of six further places drawn for it in a stream of their own (up to 5 m up or down the
    // path); else peat ricks, a bed of tall reeds, wisps or a snag at the first of those ten places that will take one (counted:
    // scene.userData.subjects.swapped); else the station stands empty and is counted (scene.userData.subjects.left). What stands is written into
    // the list of hard things, so that nothing dealt later stands in it.
    const rSu = fk.subjects, rSm = fk.subjmore, SUBJ_KINDS = ['oak', 'cart', 'gate', 'boat', 'slabs', 'reeds', 'drowned', 'ricks'], subjects = [], subjLeft = [], subjSwap = [], nearBeds = [], nearWisps = [], oakPts = [], subjCircles = [];
    for (let i = SUBJ_KINDS.length - 1; i > 0; i--) { const j = Math.floor(rSu() * (i + 1)), t = SUBJ_KINDS[i]; SUBJ_KINDS[i] = SUBJ_KINDS[j]; SUBJ_KINDS[j] = t; }
    const BLEACH_D = lin('#8d897a'), SUBJ_MIN = LANE_M, ryOf = (dx, dz) => Math.atan2(-dz, dx);
    // (the circles a subject fills on the plan, in its own frame: x along its length, z across it, radius, height)
    // (THE CART IS MEASURED BY WHAT IS DRAWN, round 11: its second round holds the two shafts to their tips and the bar across
    // them, which reach 4.0 m along the cart and 2.8 m up before its scale; until then the round ended short of them)
    // (THE NEAR THINGS ARE LARGE, round 6: each kind is built SUBJ_S times the size it was drawn at: a great wain, a
    // lighter's ribs 11 m long, a gate one looks up at; the drowned stand is of trees 8 to 11 m; the reeds stand in a bed
    // 20 m long beside the way; the peat is stacked in four ricks 2.3 m high. The circles are in the size as built.)
    const SUBJ_S = { oak: 1, cart: 1.6, gate: 1.3, boat: 1.7, slabs: 1.25, reeds: 1, drowned: 1, ricks: 1.4, wisps: 1, snag: 1 };
    const SUBJ_FILL = { oak: [[0, 0, 4.6, 12]], cart: [[0, 0, 2.2, 1.6], [2.9, 0, 1.75, 2.95]], gate: [[0.2, 0, 0.9, 2], [2.2, 0.6, 1.9, 1.7], [5, 0, 1.5, 1.6], [8, 0, 1.5, 1.6], [11, 0, 1.5, 1.6], [14, 0, 1.5, 1.6]],
      boat: [[-1.8, 0, 1.9, 1.5], [1.2, 0, 1.9, 1.5], [3.6, 0, 1.2, 1.9]], slabs: [[-8, 0, 2.2, 0.9], [-4, 0, 2.2, 0.9], [0, 0, 2.2, 0.9], [4, 0, 2.2, 0.9], [8, 0, 2.2, 0.9]],
      reeds: [[-7.5, 0, 3.4, 4.6], [-2.5, 0, 3.4, 4.6], [2.5, 0, 3.4, 4.6], [7.5, 0, 3.4, 4.6]], drowned: [[0, 0, 7.2, 12]], ricks: [[-5.1, 0, 2.0, 1.7], [-1.7, 0, 2.0, 1.7], [1.7, 0, 2.0, 1.7], [5.1, 0, 2.0, 1.7]], wisps: [[0, 0, 5.6, 3]], snag: [[0, 0, 0.9, 5]] };
    for (const kd in SUBJ_FILL) SUBJ_FILL[kd] = SUBJ_FILL[kd].map((f) => f.map((v) => v * SUBJ_S[kd]));
    const subjTry = (kind, e, lat, yaw, want) => {
      const q = mireXZ(e, lat), c = Math.cos(yaw), sn = Math.sin(yaw), zn0 = zoneAt(P, q[0], q[1], ZONE), pool0 = zn0.pool;
      if (zn0.mire < 0.6 || zn0.isle > 0.05 || zn0.lane > 0.3 || zn0.wand > 0.05) return null;
      if (want && ((kind === 'boat' && (pool0 < 0.08 || pool0 > 0.75)) || (kind === 'drowned' && pool0 < 0.15) || (kind === 'wisps' && pool0 < 0.3) || (kind === 'reeds' && (pool0 < 0.05 || pool0 > 0.7)) || ((kind === 'oak' || kind === 'cart') && pool0 > 0.45) || (kind === 'ricks' && pool0 > 0.2))) return null;
      let least = 99;
      for (const f of SUBJ_FILL[kind]) {
        // (local x to the world: the builder's own turn about y)
        const x = q[0] + f[0] * c + f[1] * sn, z = q[1] - f[0] * sn + f[1] * c, g = land(x, z), d = laneDist(x, z, f[2], g - 0.6, g + f[3], 30);
        if (d < SUBJ_MIN || hardIn(x, z, f[2]) || roundOff(x, z) < f[2] + 1.5 || zoneAt(P, x, z, ZONE).isle > 0.05) return null;
        if (d < least) least = d;
      }
      // (a cart and a boat lie on ground that is near level under them, as drawn: the cart's wheels and bed's end within 0.45 m of
      // one another, the boat's keel within 0.8 m from end to end; a place on a bank's lip is not taken)
      if (kind === 'cart' || kind === 'boat') { const sc2 = SUBJ_S[kind]; let lo = 1e9, hi = -1e9;
        for (const c2 of kind === 'cart' ? [[-0.1, -1.02], [-1.5, 0], [-0.4, 1.9], [0, 0]] : [[-3.4, 0], [0, 0], [3.4, 0]]) { const px = q[0] + c2[0] * sc2 * c + c2[1] * sc2 * sn, pz = q[1] - c2[0] * sc2 * sn + c2[1] * sc2 * c, gy = kind === 'boat' ? standOn(px, pz) : groundY(px, pz); lo = Math.min(lo, gy); hi = Math.max(hi, gy); }
        if (hi - lo > (kind === 'cart' ? 0.45 : 0.8)) return null; }
      // (a run of causeway slabs lies level too: the drawn ground at each of its five slabs stands no more than 0.4 m over the
      // run's own level, its middle's ground or the water, AND WHAT EACH SLAB STANDS ON (the one rule of the water: standOn) LIES NO
      // MORE THAN 0.85 OF THE RUN'S SIZE UNDER THAT LEVEL: the slabs are built 0.9 of it deep, so none shows its underside over
      // ground or water that falls away; a place under a bank's lip or on one is not taken)
      if (kind === 'slabs') { const sc2 = SUBJ_S.slabs, lv = Math.max(land(q[0], q[1]), sheetDepth(q[0], q[1]) > WET ? poolLevel : -1e9); for (const lx of [-9.1, -4.5, 0, 4.5, 8.5]) { const px = q[0] + lx * sc2 * c, pz = q[1] - lx * sc2 * sn; if (groundY(px, pz) > lv + 0.4 || standOn(px, pz) < lv - 0.85 * sc2) return null; } }
      return { q, least, pool: pool0 };
    };
    // (the stations stand EVENLY from 16 m along the wand path to 10 m before THE BOW'S END (AT.arcEnd, where the way straightens
    // for the yard), 21 m apart or a little less, each moved up to 4 m either way by its draw and its place up to 5 m more (the
    // six further places too): two neighbours stand 39 m apart at the most. THE YARD'S STRAIGHT IS THE WORKS' OWN GROUND: beside
    // it stand the boards, the wands and the lanterns only, and then the yard's own things. Where no place of a station will take the kind dealt, nor ricks, reeds or wisps, a SNAG stands
    // there (the bleached stump of a drowned tree, a pace across: it fits where the broad things do not). The longest
    // stretch of the boards with no near thing is counted with the moor's gaps.)
    const stSpan = AT.arcEnd - AT.ME - 26, nStation = Math.max(2, Math.ceil(stSpan / 21) + 1), stStep = stSpan / (nStation - 1);
    for (let k = 0; k < nStation; k++) {
      if (k % 3 === 0 && k) await ctx.yield();
      let kind = SUBJ_KINDS[k % SUBJ_KINDS.length]; const e0 = 16 + k * stStep + rSu.range(-7, 7) * 4 / 7, cand = [], D = [];
      for (let j = 0; j < 4; j++) cand.push([rSu.sign(), rSu.range(0, 1), rSu.range(-5, 5)]);
      for (let j = 0; j < 16; j++) D.push(rSu());
      const more = []; for (let j = 0; j < 6; j++) more.push([rSm.sign(), rSm.range(0, 1), rSm.range(-5, 5)]);
      // (a thing's middle stands its own half breadth and 4.6 to 9 m from the boards' middle; a run of fence lies outward, a run of
      // slabs along)
      const halfOf = (kd) => (kd === 'oak' ? 4.6 : kd === 'reeds' ? 3.4 : kd === 'drowned' ? 7.2 : kd === 'slabs' ? 2.75 : kd === 'gate' ? 1.6 : kd === 'wisps' ? 5.6 : kd === 'ricks' ? 2.8 : kd === 'boat' ? 4.1 : kd === 'snag' ? 0.9 : 3.8), half = halfOf(kind);
      let got = null, yaw = 0;
      for (const set of [cand, more]) { for (const want of [true, false]) { for (const cd of set) {
        const e = e0 + cd[2], side = cd[0], lat = side * (half + 4.6 + cd[1] * 4.4), w = mireDir(e), wR = [-w[1], w[0]];
        // (the fence runs outward from the path; the slabs and the boat lie along the path, turned a little; the rest any way)
        yaw = kind === 'gate' ? ryOf(side * wR[0] * Math.cos((D[0] - 0.5) * 0.7) + w[0] * Math.sin((D[0] - 0.5) * 0.7), side * wR[1] * Math.cos((D[0] - 0.5) * 0.7) + w[1] * Math.sin((D[0] - 0.5) * 0.7))
          : kind === 'slabs' || kind === 'boat' || kind === 'reeds' || kind === 'ricks' ? ryOf(w[0], w[1]) + (D[0] - 0.5) * 0.5 * (kind === 'boat' ? 2.4 : kind === 'slabs' ? 1 : 0.6) : D[0] * 6.2832;
        const t = subjTry(kind, e, lat, yaw, want);
        if (t) { got = { ...t, e, lat, side }; break; } }
        if (got) break; }
        if (got) break; }
      // (where none of the ten places will take the kind that was dealt, the station takes a bed of tall reeds, or wisps over
      // the bog, at the first of the same ten places that will: no station of the wand path stands empty for the kind's sake)
      if (!got) { const dealt = kind;
        for (const alt of k % 2 ? ['reeds', 'ricks', 'wisps', 'snag'] : ['ricks', 'reeds', 'wisps', 'snag']) { for (const cd of [...cand, ...more]) {
          const e = e0 + cd[2], side = cd[0], lat = side * (halfOf(alt) + 4.6 + cd[1] * 4.4), w = mireDir(e), ya = alt === 'wisps' ? D[0] * 6.2832 : ryOf(w[0], w[1]) + (D[0] - 0.5) * 0.3, t = subjTry(alt, e, lat, ya, false);
          if (t) { got = { ...t, e, lat, side }; kind = alt; yaw = ya; break; } }
          if (got) break; }
        if (got) subjSwap.push(dealt + ' at ' + Math.round(e0) + ' m: ' + kind); }
      if (!got) { subjLeft.push(kind + ' at ' + Math.round(e0) + ' m'); continue; }
      const x = got.q[0], z = got.q[1], g = land(x, z), wy = sheetDepth(x, z) > WET ? Math.max(g, poolLevel) : g, cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
      const toW = (lx, lz) => [x + lx * cy_ + lz * sy_, z - lx * sy_ + lz * cy_];
      for (const f of SUBJ_FILL[kind]) { const p2 = toW(f[0], f[1]); if (kind !== 'wisps') subjCircles.push([p2[0], p2[1], f[2]]); if (kind !== 'wisps' && kind !== 'reeds') { hard.push([p2[0], p2[1], f[2], 'subject: ' + kind]); standing.push([p2[0], p2[1], Math.min(f[2], 2.6)]); } }
      subjects.push({ kind, e: got.e, lat: got.lat, least: got.least, pool: got.pool, x, z });
      // (the feet of what is built here, in the thing's own frame and size: place, lowest built height, how far down it was built)
      // (THE CART AND THE BOAT LIE ON THE LOWEST OF THEIR OWN GROUND AS DRAWN, round 6: the cart on the lowest ground under its wheels and
      // its bed's end, the boat on the lowest ground or water under its keel's ends and middle: no part of either hangs over
      // a hollow. `foot` here is the built depth and the part of the thing that may stand in the ground: a rick's lowest
      // turves (each rick on its own ground), a gate's posts 0.9 m into the mean of their two grounds, the cart's felloes (a SUNK cart: its standing wheel to the axle, its bed's end and its lying wheel up to 0.7 m in
      // the peat), the boat's keel and the roots of its ribs, a gate post's third, a pier whole)
      const sc = SUBJ_S[kind], lowOf = (pts, water) => Math.min(...pts.map((c) => { const q = toW(c[0] * sc, c[1] * sc); return water ? standOn(q[0], q[1]) : groundY(q[0], q[1]); }));
      // (each of the four ricks stands on its own ground AS DRAWN: the terrain's own surface, which is what is seen and what the
      // count holds every foot against; the planned height differs from it by up to 0.8 m where a peat cutting or a pool's lip is)
      const rickDy = kind === 'ricks' ? [0, 1, 2, 3].map((i) => { const q = toW((i - 1.5) * 3.4 * sc, 0); return (groundY(q[0], q[1]) - g) / sc; }) : null;
      const subjBase = kind === 'slabs' ? wy : kind === 'boat' ? lowOf([[-3.4, 0], [0, 0], [3.4, 0]], true) : kind === 'cart' ? lowOf([[-0.1, -1.02], [-1.5, 0], [-0.4, 1.9], [0, 0]], false) : kind === 'gate' ? (lowOf([[0, 0]], false) + lowOf([[3.3, 0]], false)) / 2 : kind === 'snag' ? groundY(x, z) : g;
      { const ft = (lx, lz, y, foot) => { const q = toW(lx * sc, lz * sc); footAt(kind === 'slabs' ? 'causeway' : kind, q[0], q[1], subjBase + y * sc, foot * sc); };
        if (kind === 'ricks') for (let i = 0; i < 4; i++) ft((i - 1.5) * 3.4, 0, rickDy[i] - 0.3, 0.6);
        else if (kind === 'cart') { ft(-0.1, -1.02, -0.55, 0.85); ft(-1.5, 0, 0, 0.7); ft(-0.4, 1.9, 0, 0.7); }
        else if (kind === 'snag') ft(0, 0, -0.7, 1.2);
        else if (kind === 'boat') { ft(-3.4, 0, 0, 0.5); ft(0, 0, 0, 0.5); ft(3.4, 0, 0, 0.5); }
        else if (kind === 'gate') { ft(0, 0, -0.9, 1.4); ft(3.3, 0, -0.9, 1.4); }
        else if (kind === 'slabs') for (const lx of [-9.1, -4.5, 0, 4.5, 8.5]) ft(lx, 0, -0.9, 1.24); }
      laneNote('subject: ' + kind, got.least);
      if (kind === 'oak') { const gy = groundY(x, z); oakPts.push({ x, y: gy - 0.25, z, s: Math.min(0.95 + 0.3 * D[1], 4.4 / bogReach), rot: D[2] * 6.2832, v: D[3] < 0.5 ? 0 : 1, d: Math.abs(got.lat), u: 0 }); footAt('bog oak', x, z, gy - 0.25, 0.55); }
      else if (kind === 'reeds') nearBeds.push({ x, z, yaw, D });
      else if (kind === 'wisps') nearWisps.push({ x, z, D });
      else if (kind === 'drowned') {
        // a stand of drowned trees: three weathered dead trees 5 to 7 m tall, each turned its own way, none reaching out of the
        // stand's round of 5.2 m; a fourth lies fallen among them
        for (let t = 0; t < 3; t++) { const a = t * 2.1 + D[1] * 6.28, r0 = 0.8 + 1.6 * D[2 + t], p2 = toW(Math.cos(a) * r0, Math.sin(a) * r0), ht = 8 + 3 * D[5 + t];
          const gy = groundY(p2[0], p2[1]); thornPts.push({ x: p2[0], y: gy - 0.35, z: p2[1], s: Math.min(ht / 6, (7.0 - r0) / deadReach), rot: D[8 + t] * 6.2832, v: 2 + (t % 2), d: Math.abs(got.lat), u: 0 }); footAt('drowned tree', p2[0], p2[1], gy - 0.35, 0.65); }
        B.tr(x, g, z, yaw); B.col(BLEACH_D, 0.7, 1.1).surf(SURF.PLANKS, 0).beam([-2.4, 0.2, -1.0 + 2 * D[14]], [2.2, 0.55, 0.8 - 2 * D[15]], 0.42, 0.42); B.pop();
      }
      else {
        B.tr(x, subjBase, z, yaw, SUBJ_S[kind]);
        if (kind === 'ricks') {
          // peat stacked to dry: four ricks in a row along the way, each of five courses of dried turves
          for (let i = 0; i < 4; i++) rickOf((i - 1.5) * 3.4, rickDy[i], (D[1 + i] - 0.5) * 0.7, (D[5 + i] - 0.5) * 0.3);
        } else if (kind === 'cart') {
          // a two-wheeled peat cart: its bed tilted back, one wheel standing sunk to the axle, the other lying; shafts in the air
          const tl = 0.28 + 0.2 * D[1], yb = (lx) => 0.42 + tl * lx;
          // (round 7: of weathered boards, as the boat's and the works' timber; it was the hall's dark wood, black in the shade)
          B.col(WTIMBER, 0.65, 1.05).surf(SURF.PLANKS, 0);
          B.beam([-1.5, yb(-1.5), 0], [1.5, yb(1.5), 0], 1.5, 0.12);
          for (const sd of [-1, 1]) B.beam([-1.5, yb(-1.5) + 0.36, sd * 0.78], [1.5, yb(1.5) + 0.36, sd * 0.78], 0.09, 0.6);
          B.beam([-1.5, yb(-1.5) + 0.36, -0.78], [-1.5, yb(-1.5) + 0.36, 0.78], 0.09, 0.6);
          for (const lx of [-1.1, 0, 1.1]) for (const sd of [-1, 1]) B.beam([lx, yb(lx) + 0.05, sd * 0.84], [lx, yb(lx) + 0.95, sd * 0.86], 0.09, 0.09);
          for (const sd of [-1, 1]) B.beam([1.4, yb(1.4) - 0.05, sd * 0.6], [4.0, yb(1.4) + 1.2 + 0.5 * D[2 + (sd > 0 ? 1 : 0)], sd * 0.66], 0.12, 0.12);
          B.beam([3.7, yb(1.4) + 1.3, -0.66], [3.7, yb(1.4) + 1.35, 0.66], 0.08, 0.08);
          B.col(WTIMBER, 0.5, 0.9);
          // (the standing wheel: 1.7 m across, a rim of twelve felloes, six spokes, its axle through the bed)
          const WRc = 0.85, wyc = 0.3;
          for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.2832, a1 = (i + 1) / 12 * 6.2832; B.beam([Math.cos(a0) * WRc - 0.1, wyc + Math.sin(a0) * WRc, -1.02], [Math.cos(a1) * WRc - 0.1, wyc + Math.sin(a1) * WRc, -1.02], 0.11, 0.12); if (i % 2 === 0) B.beam([-0.1, wyc, -1.02], [Math.cos(a0) * WRc - 0.1, wyc + Math.sin(a0) * WRc, -1.02], 0.07, 0.08); }
          B.beam([-0.1, wyc, -1.1], [-0.1, wyc + 0.25, 1.0], 0.12, 0.12);
          // (the other wheel lies flat beside it, half in the peat)
          for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.2832, a1 = (i + 1) / 12 * 6.2832, cx2 = -0.4 + 0.6 * D[4], cz2 = 1.9; B.beam([cx2 + Math.cos(a0) * WRc, 0.08 + 0.1 * Math.cos(a0), cz2 + Math.sin(a0) * WRc], [cx2 + Math.cos(a1) * WRc, 0.08 + 0.1 * Math.cos(a1), cz2 + Math.sin(a1) * WRc], 0.12, 0.11); if (i % 2 === 0) B.beam([cx2, 0.1, cz2], [cx2 + Math.cos(a0) * WRc, 0.08 + 0.1 * Math.cos(a0), cz2 + Math.sin(a0) * WRc], 0.08, 0.07); }
          // (turves still in it)
          B.col(RICK, 0.72, 1.2).surf(SURF.MASONRY, 0).box(-1.2, yb(-0.6) + 0.02, -0.6, 0.2, yb(-0.6) + 0.5, 0.6, { m: 0.5 });
        } else if (kind === 'boat') {
          // a boat's ribs: keel, stem and stern post, nine pairs of ribs, a few strakes still on one side; it lies heeled over
          const heel = (D[1] - 0.5) * 0.5, LB = 3.4;
          B.col(BLEACH_D, 0.7, 1.1).surf(SURF.PLANKS, 0);
          B.beam([-LB, 0.12, 0], [LB, 0.2, 0], 0.2, 0.24).beam([LB - 0.1, 0.2, 0], [LB + 0.9, 1.7, heel * 1.7], 0.18, 0.2).beam([-LB + 0.1, 0.12, 0], [-LB - 0.35, 1.25, heel * 1.25], 0.16, 0.18);
          for (let i = 0; i < 9; i++) { const lx = -LB + 0.5 + i * (2 * LB - 1) / 8, wi = Math.sin((i + 0.9) / 9.8 * Math.PI), hb = 1.25 + 0.25 * Math.abs(i - 4) / 4;
            for (const sd of [-1, 1]) { if (sd > 0 && D[2 + (i % 5)] < 0.22) continue; const z1 = sd * 0.75 * wi + heel * 0.45, z2 = sd * 1.25 * wi + heel * hb, y2 = hb * (sd * heel > 0 ? 0.82 : 1);
              B.beam([lx, 0.2, 0], [lx, 0.45, z1], 0.1, 0.12).beam([lx, 0.45, z1], [lx, y2, z2], 0.09, 0.11); } }
          for (const hk of [0.55, 0.85, 1.1]) B.beam([-LB + 1.0, hk, -(0.5 + 0.55 * hk) + heel * hk], [LB - 0.9 - 1.6 * D[8], hk + 0.08, -(0.52 + 0.55 * hk) + heel * hk], 0.05, 0.2);
        } else if (kind === 'gate') {
          // the gate: two stout posts 3.3 m apart, the gate (five bars, two stiles, a brace) hanging open and dropped at its head
          const open = 0.45 + 0.5 * D[1], drop = 0.25 + 0.3 * D[2], ca = Math.cos(open), sa = Math.sin(open), GL = 3.0;
          B.col(lin('#77726a'), 0.7, 1.05).surf(SURF.PLANKS, 0);
          B.beam([0, -0.9, 0], [0.05, 1.75, 0.03], 0.3, 0.3).beam([3.3, -0.9, 0], [3.38, 1.6, -0.06], 0.3, 0.3);
          const gp = (t, yy) => [0.2 + t * GL * ca, yy - drop * t, t * GL * sa];
          for (let b = 0; b < 5; b++) { const yy = 0.32 + b * 0.27 + (b > 2 ? 0.05 * (b - 2) : 0); B.beam(gp(0, yy), gp(1, yy), 0.05, 0.11); }
          B.beam(gp(0, 0.2), gp(0, 1.6), 0.1, 0.12).beam(gp(1, 0.25), gp(1, 1.55), 0.09, 0.1).beam(gp(0, 0.32), gp(1, 1.45), 0.05, 0.1);
          // the fence run beyond it: a post every 2.7 m, some gone, some fallen; rails between the neighbours that stand, some dropped
          let prev = [3.3, 1.2, 0];
          for (let i = 1; i <= 4; i++) { const px = 3.3 + i * 2.7 + (D[3 + i] - 0.5) * 0.5, gone = D[7 + i] < 0.22, lean = (D[11 + (i % 4)] - 0.5) * 0.7, hp = 1.15 + 0.35 * D[3 + i];
            if (gone) { B.beam([px - 0.6, 0.1, 0.5], [px + 0.7, 0.16, 0.9], 0.16, 0.16); prev = null; continue; }
            const top = [px + lean * 0.4, hp, lean];
            B.beam([px, -0.4, 0], top, 0.18, 0.18);
            if (prev) { B.beam([prev[0], prev[1] - 0.15, prev[2]], [top[0], top[1] - 0.2, top[2]], 0.05, 0.1); if (D[7 + i] > 0.5) B.beam([prev[0], prev[1] - 0.6, prev[2]], [top[0], D[7 + i] > 0.8 ? 0.1 : top[1] - 0.65, top[2] + (D[7 + i] > 0.8 ? 0.3 : 0)], 0.05, 0.1); }
            prev = top; }
        } else if (kind === 'snag') {
          // a snag: the bleached stump of a drowned tree, 3.4 to 4.6 m, leaning, with the stubs of two boughs
          const tx2 = 0.3 + 0.5 * D[1], hS = 3.4 + 1.2 * D[2], tz2 = 0.5 * (D[3] - 0.5);
          B.col(BLEACH_D, 0.7, 1.1).surf(SURF.PLANKS, 0);
          B.beam([0, -0.7, 0], [tx2 * 0.55, hS * 0.55, tz2 * 0.55], 0.62, 0.62).beam([tx2 * 0.55, hS * 0.55, tz2 * 0.55], [tx2, hS, tz2], 0.42, 0.42);
          B.beam([tx2 * 0.5, hS * 0.5, tz2 * 0.5], [tx2 * 0.5 - 0.7, hS * 0.5 + 0.9, 0.5 + 0.4 * D[4]], 0.22, 0.22).beam([tx2 * 0.8, hS * 0.8, tz2 * 0.8], [tx2 * 0.8 + 0.6, hS * 0.8 + 0.6, -0.5 - 0.3 * D[5]], 0.18, 0.18);
        } else if (kind === 'slabs') {
          // the causeway: seven great flat slabs of the moor's granite on little piers, a hand over the water, EACH A STONE OF ITS
          // OWN (round 9: laid end to end in one line and of one dark stone, the run read from the line as a black beam; now
          // each slab is 1.7 to 2.4 m long and 1.3 to 2.0 m broad, a gap of 0.45 to 0.85 m to the next, set up to 0.5 m to
          // either hand of the run's line and a hand higher or lower than its neighbour, of the pale granite); one has slipped
          B.col(lin(GRANITE.pale), 0.85, 1.08).surf(SURF.PLAIN);
          let lx = -9.2;
          for (let i = 0; i < 7; i++) { const len = 1.7 + 0.7 * D[1 + i], wdS = 1.3 + 0.7 * D[8 + (i % 7)], slip = i === Math.floor(D[15] * 7) ? 0.32 : 0, yS = 0.34 - slip + (D[5 + i] - 0.5) * 0.16, zo = (D[2 + i] - 0.5) * 1.0;
            B.beam([lx, yS + 0.13 + (slip ? 0.1 : 0), zo], [lx + len, yS + 0.13 - (slip ? 0.16 : 0) + (D[3 + i] - 0.5) * 0.08, zo + (D[4 + i] - 0.5) * 0.5], wdS, 0.3);
            B.col(STONE_D, 0.7, 1).surf(SURF.MASONRY, 0).cbox(lx + 0.1, -0.9, zo, 0.9, 0.9 + yS, wdS * 0.8, { m: 0.9 }); B.col(lin(GRANITE.pale), 0.85, 1.08).surf(SURF.PLAIN);
            lx += len + 0.45 + 0.4 * D[9 + (i % 6)]; }
        }
        B.pop();
      }
    }
    scene.userData.subjects = { list: subjects, left: subjLeft, swapped: subjSwap };
    await ctx.yield();
    // the mine's mouth: an adit driven into an outcrop of piled granite at the cutting's end, framed with timber; the portal stands in it
    const isleXZ = (iw, il) => [I[0] + iw * yd[0] + il * ydR[0], I[1] + iw * yd[1] + il * ydR[1]], PR = 4.6, yEnd = P.yEnd;
    for (const sd of [-1, 1]) { const q = isleXZ(3.5, sd * (PR + 5.6)); stack(q[0], q[1], floorY - 1, 12.5 + rIs.range(0, 1.5), 5.6, 3.0, false, slabs, null, [1.5, 2.0], 0, true); const q2 = isleXZ(8, sd * (PR + 0.5)); stack(q2[0], q2[1], floorY - 1, 13 + rIs.range(0, 2), 5.5, 3.2, false, slabs, null, [1.5, 2.0], 0, true); }
    { const q = isleXZ(4.6, 0), ya = Math.atan2(ydR[0], ydR[1]) + Math.PI / 2; place(slabs, q[0], yEnd + PR + 1.6, q[1], 8.2, 2.6, 4.6, -Math.atan2(ydR[1], ydR[0])); const q3 = isleXZ(9, 0); place(slabs, q3[0], yEnd + PR + 3.6, q3[1], 6, 2.8, 4.4, ya + 0.4); }
    const isleRy = Math.atan2(-yd[1], yd[0]), gAt = (x, z) => groundY(...isleXZ(x, z)) - floorY;
    B.tr(I[0], floorY, I[1], isleRy);
    // in this frame +x runs up the yard's axis (into the mine) and +z to its right hand: props and a cap beam frame the mouth
    B.col(WTIMBER, 0.7, 1).surf(SURF.PLANKS, 0);
    // (both frames stand outside the ring, on the yard's side of it: their props beside it, their caps over its top)
    const capIn = yEnd - floorY + PR + 0.62, capOut = yEnd - floorY + PR + 1.25, propOut = PR + 1.7;
    for (const sd of [-1, 1]) { B.beam([0.6, 0, sd * (PR + 1.0)], [0.6, capIn - 0.27, sd * (PR + 0.75)], 0.5, 0.5); B.beam([-3.4, 0, sd * (propOut + 0.4)], [-3.4, capOut - 0.2, sd * propOut], 0.42, 0.42); }
    B.beam([0.6, capIn, -(PR + 1.5)], [0.6, capIn, PR + 1.5], 0.55, 0.55); B.beam([-3.4, capOut, -(propOut + 0.9)], [-3.4, capOut, propOut + 0.9], 0.44, 0.44);
    // THE OLD ENGINE HOUSE: THE WORKS ARE OLD AND LEFT. A tall roofless shell of moor stone BESIDE AND BEHIND THE MOUTH, on its
    // left hand at the foot of the mine's hill (YARD_HOUSE, the works' own plan, at the head of the file): 11 m along the
    // yard's axis and 14 m across, its walls 28 m to a broken wall head with no gable left on it (round 11, A5: they were 22 m, and
    // the yard's stack 42 m, now 54: the works stand larger over the mire from the pass on). In the wall that faces
    // the yard ONE ROUND, PLAIN ARCH at its foot (the cylinder door, 4.6 m wide and 7.1 m to its crown) and one round-headed door over
    // it (the plug door); the far end wall has the same two, half as wide again; the side walls a low arch and a light over it. Every
    // opening is cut through the wall: the night is seen through the shell. No fire burns in it. THE WALL ON THE
    // CUTTING'S SIDE HAS FALLEN over its far half to a stump 7 m high, and its stone lies in blocks at its foot. It
    // stands on its platform of spoil and its walls go down 3 m under its floor.
    const ey0 = MIRE_Y + 3.0 - floorY, EX0 = YARD_HOUSE.x0, EX1 = YARD_HOUSE.x1, EZ1 = YARD_HOUSE.z1, EZ0 = YARD_HOUSE.z0, EZC = (EZ0 + EZ1) / 2, EW = 28, EG = 2.2, FIRE = lin('#ff4a1c');
    B.col(WSTONE, 0.7, 1).surf(SURF.MASONRY, 0);
    // (an opening is [middle, half width, sill, springing, and a second sill and springing over it])
    const gOps = [[EZC, 2.3, ey0 + 0.3, ey0 + 4.8, ey0 + 10.6, ey0 + 13.4]], sOps = [[EX0 + 3.0, 0.9, ey0 + 2.4, ey0 + 5.3, ey0 + 9.6, ey0 + 12.7], [EX0 + 8.2, 0.9, ey0 + 2.4, ey0 + 5.3]];
    wallOps(0, EX0, EX0 + 1.2, EZ0, EZ1, ey0 - 3, ey0 + EW, gOps); wallOps(0, EX1 - 1.2, EX1, EZ0, EZ1, ey0 - 3, ey0 + EW - 2.5, gOps.map((q) => [q[0], q[1] * 1.5, q[2], q[3], q[4], q[5]]));
    wallOps(1, EZ0, EZ0 + 1.2, EX0 + 1.2, EX1 - 1.2, ey0 - 3, ey0 + EW, sOps); wallOps(1, EZ1 - 1.2, EZ1, EX0 + 1.2, EX0 + 6.2, ey0 - 3, ey0 + EW, sOps.slice(0, 1)); wallOps(1, EZ1 - 1.2, EZ1, EX0 + 6.2, EX1 - 1.2, ey0 - 3, ey0 + 7, sOps.slice(1));
    // (the broken wall heads: what is left of the yard wall's top courses stands higher at its two corners; the far end wall
    // steps down toward the fallen side; the fallen wall's break steps down from the standing half)
    B.box(EX0, ey0 + EW, EZ0, EX0 + 1.2, ey0 + EW + EG, EZ0 + 3.6, { m: 0.5 }).box(EX0, ey0 + EW, EZ0 + 3.6, EX0 + 1.2, ey0 + EW + 0.9, EZC + 0.8, { m: 0.5 }).box(EX0, ey0 + EW, EZ1 - 2.4, EX0 + 1.2, ey0 + EW + 1.4, EZ1, { m: 0.5 });
    B.box(EX1 - 1.2, ey0 + EW - 2.5, EZ0, EX1, ey0 + EW - 0.6, EZ0 + 5, { m: 0.5 }).box(EX0 + 6.2, ey0 + 7, EZ1 - 1.2, EX0 + 7.6, ey0 + 15.5, EZ1, { m: 0.5 }).box(EX0 + 7.6, ey0 + 7, EZ1 - 1.2, EX0 + 9.0, ey0 + 10.6, EZ1, { m: 0.5 });
    // (what fell of it: blocks of its stone at its foot, on the platform toward the cutting, none nearer the yard's axis than 7 m)
    for (let k = 0; k < 9; k++) { const u = (k * 0.618) % 1, w = (k * 0.371 + 0.2) % 1; B.cbox(EX0 + 6.4 + 4.4 * u, ey0 - 0.4, EZ1 + 0.9 + 3.6 * w, 1.0 + 0.9 * w, 0.7 + 0.6 * u, 0.8 + 0.7 * u, { m: 0.8 }); }
    // (a plinth course and a string course at the wall head, of paler stone; weeds on the broken heads)
    B.col(LICHEN, 0.8, 1.0).surf(SURF.PLAIN).box(EX0 - 0.22, ey0 - 0.2, EZ0 - 0.22, EX0 + 1.3, ey0 + 0.5, EZC - 2.4).box(EX0 - 0.22, ey0 - 0.2, EZC + 2.4, EX0 + 1.3, ey0 + 0.5, EZ1 + 0.22).box(EX0 - 0.16, ey0 + EW - 0.3, EZ0 - 0.16, EX0 + 1.3, ey0 + EW + 0.12, EZ1 + 0.16);
    weedsAt(EX0 + 0.6, ey0 + EW + 0.9, EZC - 1.4, 0.5, 3); weedsAt(EX0 + 8.3, ey0 + 10.6, EZ1 - 0.6, 0.45, 2); weedsAt(EX1 - 0.6, ey0 + EW - 2.5, EZC + 2, 0.5, 3);
    // THE HUT ON THE ISLAND, AND THE ONE FIRE LEFT BURNING: a low hut of moor stone under a slate roof stands in the yard on the
    // left hand of the cutting (WORKS_HUT, the works' own plan, in the yard's frame: between the two spoil heaps of that
    // side, 18 m from the yard's axis). Its round-headed door faces the cutting and a small light in its end wall faces
    // the mire; a fire burns on its hearth at the other end. The firelight on its inner walls is seen through the door
    // and the light; it lies on the ground before the door (a light of the place) and is mirrored in the tarn.
    const HUT = WORKS_HUT, hg = gAt(HUT.x, HUT.z), hy0 = hg - 0.9, hy1 = hg + 2.1, hx0 = HUT.x - HUT.hx, hx1 = HUT.x + HUT.hx, hz0 = HUT.z - HUT.hz, hz1 = HUT.z + HUT.hz, HT = 0.45;
    B.col(WSTONE, 0.7, 1).surf(SURF.MASONRY, 0).box(hx0, hy0, hz0, hx1, hy1, hz0 + HT, { m: 0.5 }).box(hx1 - HT, hy0, hz0 + HT, hx1, hy1, hz1 - HT, { m: 0.5 });
    wallOps(0, hx0, hx0 + HT, hz0 + HT, hz1 - HT, hy0, hy1, [[HUT.z + 0.3, 0.3, hg + 1.0, hg + 1.4]]); wallOps(1, hz1 - HT, hz1, hx0, hx1, hy0, hy1, [[HUT.x - 0.5, 0.5, hg + 0.05, hg + 1.45]]);
    B.col(SLATE).surf(SURF.TILES, 0).gable(hx0 - 0.2, hz0 - 0.25, hx1 + 0.2, hz1 + 0.25, hy1, 1.3, { alongX: true, overhang: 0.1, wallColor: WSTONE, m: 0.6 });
    B.col(WSTONE, 0.7, 1).surf(SURF.MASONRY, 0).cbox(hx1 - 0.5, hy1, HUT.z, 0.9, 2.2, 0.9, { m: 0.5 });
    B.col(EMBER, 1.7, 1.7).surf(SURF.GLOW, 0, 1).cbox(hx1 - HT - 0.45, hg + 0.05, HUT.z, 0.5, 0.4, 0.9);
    B.col(FIRE, 0.5, 0.5).surf(SURF.GLOW, 0, 1).box(hx0 + HT, hg + 0.05, hz0 + HT, hx1 - HT, hg + 1.95, hz0 + HT + 0.03).box(hx1 - HT - 0.03, hg + 0.45, hz0 + HT, hx1 - HT, hg + 1.95, hz1 - HT);
    const hutDoor = isleXZ(HUT.x - 0.5, hz1 + 0.3), hutFire = [hutDoor[0], floorY + hg + 1.0, hutDoor[1]];
    { const q1 = isleXZ(HUT.x - 0.5, hz1 + 2.4), q2 = isleXZ(hx0 - 2.2, HUT.z + 0.3), qm = isleXZ(HUT.x, HUT.z);
      lanternPts.push([hutDoor[0], floorY + hg + 0.9, hutDoor[1], 1.5, '#ff5a2a']); plPut(q1[0], floorY + hg + 1.3, q1[1], 16, EMBERL, 1.25); plPut(q2[0], floorY + hg + 1.3, q2[1], 9, EMBERL, 0.8);
      worksFires.push(hutFire); hard.push([qm[0], qm[1], 3.2, 'works hut']); standing.push([qm[0], qm[1], 2.6]);
      for (const c of [[hx0, hz0], [hx0, hz1], [hx1, hz0], [hx1, hz1]]) { const q = isleXZ(c[0], c[1]); footAt('works hut', q[0], q[1], floorY + hy0, 3.0); }
      laneNote('works hut', laneDist(qm[0], qm[1], 3.4, floorY + hy0, floorY + hy1 + 2.3, 60)); }
    // THE YARD'S STACK, off the house's far corner (YARD_STACK): round, 54 m tall, a collar two thirds up and a corbelled rim; it
    // stands in the platform as the walls do. ROUND 11: ONE DARK WEATHERED STONE FROM FOOT TO RIM, as the old stack on the lode is
    // (STACK_G: the same stone, the same dark at the foot, a little less dark toward the head; it was pale stone below and red
    // brick above, which read as a banded sea mark). The house's own stack below is of the same stone.
    const SKX = YARD_STACK[0], SKZ = YARD_STACK[1], SKH = 54;
    const STACK_G = [0.46, 0.6, 0.72];
    B.col(WSTONE, STACK_G[0], STACK_G[1]).surf(SURF.MASONRY, 0).cyl(SKX, ey0 - 3, SKZ, 2.9, 2.35, 29.4, 14);
    B.col(WSTONE, STACK_G[1], STACK_G[2]).surf(SURF.MASONRY, 0).cyl(SKX, ey0 + 26.4, SKZ, 2.47, 2.52, 0.7, 14).cyl(SKX, ey0 + 27.1, SKZ, 2.3, 1.8, SKH - 27.8, 14).cyl(SKX, ey0 + SKH - 0.7, SKZ, 1.95, 2.08, 0.7, 14);
    // (the stack is cracked from its collar to its head, on the side toward the mire, and weeds grow at its head)
    B.col(lin('#07080c')).surf(SURF.PLAIN).beam([SKX - 2.42, ey0 + 24.5, SKZ + 0.3], [SKX - 2.22, ey0 + 31, SKZ - 0.2], 0.22, 0.12).beam([SKX - 2.2, ey0 + 31, SKZ - 0.2], [SKX - 1.98, ey0 + 37.5, SKZ + 0.35], 0.3, 0.12).beam([SKX - 1.96, ey0 + 37.5, SKZ + 0.35], [SKX - 1.84, ey0 + SKH - 0.6, SKZ], 0.2, 0.12);
    B.col(IVY_L, 0.7, 1.2);
    for (let k = 0; k < 5; k++) { const a = k * 1.26 + 0.4; B.sphere(SKX + Math.cos(a) * 1.75, ey0 + SKH + 0.25, SKZ + Math.sin(a) * 1.75, 0.5 + 0.22 * (k % 2), 6, 4); }
    // THE MINE'S YARD: a dry-stone wall round the left side of the island before the mouth, 1.3 m high, from the shore's side to
    // beside the mouth's outcrop, 29 m from the yard's axis, with a gap for its gate toward the cutting (in the island's frame)
    { const YZ = -29.2, YX0 = -26, YX1 = 6, Y1 = -10.2, yb = ey0 - 3.4, yt = ey0 - 1.7;
      B.col(WSTONE, 0.75, 1.05).surf(SURF.MASONRY, 0).box(YX0, yb, YZ - 0.35, YX1, yt, YZ + 0.35, { m: 0.5 }).box(YX1 - 0.35, yb, YZ, YX1 + 0.35, yt, Y1 - 2, { m: 0.5 });
      B.box(YX0 - 0.35, yb, YZ, YX0 + 0.35, yt, Y1 - 7.5, { m: 0.5 }).box(YX0 - 0.35, yb, Y1 - 4.5, YX0 + 0.35, yt, Y1 - 2, { m: 0.5 });
      for (const z of [Y1 - 7.5, Y1 - 4.5]) B.cbox(YX0, yb, z, 0.9, 2.3, 0.9, { m: 0.6 }); }
    // rubbish: baulks of timber and a broken launder lying about
    const rRb = fk.rubbish;
    for (let i = 0; i < 9; i++) { const x = rRb.range(-26, -6), z = rRb.sign() * rRb.range(P.CUT_HALF + 3, 20), a = rRb.range(0, 3.14), len = rRb.range(2, 4.5), c = Math.cos(a) * len / 2, sn = Math.sin(a) * len / 2;
      B.col(WTIMBER, 0.8, 1).surf(SURF.PLANKS, 0).beam([x - c, groundY(...isleXZ(x - c, z - sn)) - floorY + 0.05, z - sn], [x + c, groundY(...isleXZ(x + c, z + sn)) - floorY + 0.05, z + sn], 0.3, 0.26); }
    B.pop();
    await ctx.yield();
    // THE UPPER WORKS, on the mine's hill behind the mouth (in the hill's frame: +x up the yard's axis, away from the mire; +z to its right
    // hand; y from the hill's top). They stand over the whole mire, OLD AND DARK: THE GREAT ENGINE HOUSE (18.7 m by 18.7, a roofless
    // shell 32 m to its broken wall head, with ROUND-HEADED blind openings (the cylinder door's plain arch in the wall toward the mire), the bob's beam still out of its front wall over the shaft
    // and the pump rod hanging from it), THE TALL STACK beside it (67 m, of the works' one stone from foot to head, a collar at
    // 37 m; no smoke) and THE HEAD FRAME over the second shaft (37 m of timber legs and stays with the winding sheave at its
    // top). (UW holds each of these at three quarters, in the frame's own units; the frame is laid a third greater: UWK, below.)
    const hillY = groundY(P.MH[0], P.MH[1]), UW = { x0: -7, x1: 7, z0: -17, z1: -3, wall: 24, rise: 9, sx: 3, sz: 7.5, stack: 50, fx: -3, fz: 21, frame: 28 }, uzc = (UW.z0 + UW.z1) / 2;
    const hillXZ = (hx, hz) => [P.MH[0] + hx * yd[0] + hz * ydR[0], P.MH[1] + hx * yd[1] + hz * ydR[1]];
    // (THE UPPER WORKS ARE A THIRD GREATER than those measures, every one of them (UWK): the house 32 m to its wall head, the
    // stack 67 m, the head frame 37)
    const UWK = 4 / 3;
    B.tr(P.MH[0], hillY, P.MH[1], isleRy, UWK);
    B.col(WSTONE, 0.7, 1).surf(SURF.MASONRY, 0).box(UW.x0 - 0.4, -9, UW.z0 - 0.4, UW.x1 + 0.4, 2.2, UW.z1 + 0.4, { m: 0.5 });
    // (THE GREAT HOUSE IS A DARK SHELL: plain walls with round-headed blind openings and a broken wall head; its roof has fallen in and
    // nothing of it stands over the walls; no window of it is lit and no fire burns in it)
    B.col(WSTONE, 0.62, 1).surf(SURF.MASONRY, 0).box(UW.x0, 2.2, UW.z0, UW.x1, UW.wall, UW.z1, { m: 0.5, top: false });
    B.box(UW.x0, UW.wall, UW.z0, UW.x0 + 0.9, UW.wall + 2.6, UW.z0 + 4.2, { m: 0.5 }).box(UW.x0, UW.wall, uzc + 1.5, UW.x0 + 0.9, UW.wall + 1.2, UW.z1, { m: 0.5 }).box(UW.x1 - 0.9, UW.wall, UW.z0, UW.x1, UW.wall + 1.8, uzc - 1, { m: 0.5 });
    // (EVERY OPENING OF IT HAS A ROUND, PLAIN HEAD, stepped in four courses, as an engine house's have: in the wall toward the
    // mire the cylinder door's arch (5.3 m wide, 14.7 m to its crown as built) and a round-headed light to either hand of it higher up; in
    // each side wall two round-headed lights. blind: [the wall's axis, its two faces, the opening's middle, half width, sill, springing])
    B.col(WDARK).surf(SURF.PLAIN);
    const blind = (axis, c0, c1, mid, hw, y0, ys) => { const put = (p, q, a, b) => (axis === 0 ? B.box(c0, a, p, c1, b, q) : B.box(p, a, c0, q, b, c1));
      put(mid - hw, mid + hw, y0, ys); for (let j = 0; j < 4; j++) { const um = (j + 0.5) / 4, w = hw * Math.sqrt(1 - um * um); put(mid - w, mid + w, ys + hw * j / 4, ys + hw * (j + 1) / 4); } };
    blind(0, UW.x0 - 0.06, UW.x0, uzc, 2.0, 3.0, 9.0);
    for (const z of [uzc - 4.3, uzc + 4.3]) blind(0, UW.x0 - 0.06, UW.x0, z, 0.9, 12.6, 15.8);
    for (const sd of [-1, 1]) for (const x of [UW.x0 + 3.5, UW.x1 - 3.5]) blind(1, sd > 0 ? UW.z1 : UW.z0 - 0.06, sd > 0 ? UW.z1 + 0.06 : UW.z0, x, 0.9, 8, 11.6);
    B.col(WTIMBER, 0.7, 1).surf(SURF.PLANKS, 0).beam([UW.x0 - 7, 21.6, uzc], [UW.x0 + 2, 18.6, uzc], 0.9, 1.3).beam([UW.x0 - 6.6, 21.4, uzc], [UW.x0 - 6.6, -7, uzc], 0.34, 0.34);
    B.col(WSTONE, STACK_G[0], STACK_G[1]).surf(SURF.MASONRY, 0).cyl(UW.sx, -9, UW.sz, 3.5, 2.7, 37, 14);
    B.col(WSTONE, STACK_G[1], STACK_G[2]).surf(SURF.MASONRY, 0).cyl(UW.sx, 28, UW.sz, 2.85, 2.9, 0.8, 14).cyl(UW.sx, 28.8, UW.sz, 2.6, 1.95, UW.stack - 29.6, 14).cyl(UW.sx, UW.stack - 0.8, UW.sz, 2.15, 2.3, 0.8, 14);
    // (the head frame: two raking legs toward the mire, two back stays, ties between them, the sheave between the legs' heads)
    // (ROUND 11, MENDING 2: EACH FOOT IS FOUND FROM THE GROUND AT ITS OWN PLACE. Each leg and each stay keeps its head, its line
    // (from its head through the place at -8 of the frame's units where its foot was laid till round 11), its section and its
    // timber, and is carried down that line from its head until the HIGHEST of its foot's four corners lies FOOT_UNDER metres
    // under the drawn ground at that corner's own place; there it ends. footOf: over(lam) is the greatest height of the four
    // corners over the drawn ground, lam units down the line from the head, each corner asked at its own place (groundY: the
    // terrain's own triangles as drawn; the section's side and up as the kit's beam lays them); the line is walked down from the
    // head a quarter of a unit at a step to the first place where no corner is less than FOOT_UNDER under the ground, and that
    // place is halved twelve times. WHY: the hill falls away under the frame, by the seed; a foot laid at a depth chosen by
    // number stood in the air on some seeds and ran metres under the ground on others, and the ground is not drawn into the
    // shadow map, so that timber under the ground threw a shadow on open ground beyond the hill. The ties are laid as they were.)
    // (ROUND 11, MENDING 3: NO TIMBER UNDER THE GROUND IN A MESH THAT CASTS. A member ends square to its own line and the
    // ground is not square to it, so under its foot's highest corner a wedge of its last 0.2 to 3.1 m still lay under the
    // ground and threw its shade through the shadow map, which has no ground in it. Now each of the four members is laid in
    // TWO PIECES on its one line, of one section, one timber, one colour and one surface (member, below):
    // THE PIECE THAT CASTS runs from the head and ends AT THE DRAWN GROUND, each of its four long edges at its own place (the
    // edge is walked down from the head a quarter of a unit at a step to where it meets groundY, and that place halved twelve
    // times, as footOf finds the foot): its end is the ground's own line, open, in the built mesh.
    // THE STUB runs on from those four ends to the square foot that footOf finds (unchanged), in a mesh of its own of the same
    // material that throws no shadow and takes shadow and light as the timber over the ground does: it is there so that the
    // foot goes into the hill. The two pieces share their four edge ends to the last digit; the colour (darker toward the
    // foot, as the beam lays it) and the timber's run along the member are carried across the seam by the length from the
    // foot, and the normals are the beam's.
    // WHAT IS LEFT: nothing that casts lies under the ground but slivers where the ground bulges between the four edges.
    // Counted by rays down the moon's light (a slice of the member every 0.1 m, nine places a slice): on seeds 1 to 300, of
    // 4,763,394 places asked 377 places of casting timber lie under the ground and 175 rays from them leave the ground and
    // land again, on 97 seeds (mending 2: 68,496 places and 26,076 rays, on every seed); on seeds 1 to 3000, 3,507 places
    // and 1,705 rays, on 945 seeds, the deepest place 0.25 m under. The shadows that the members' parts OVER the ground
    // and the great house throw on through the hill onto the far ground are untouched and stay: they were in every judged
    // picture, and only the ground in the shadow map would take them away, which is not done.)
    const FOOT_UNDER = 0.15, footOf = (b, a, w) => {
      const l = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), tx = (a[0] - b[0]) / l, ty = (a[1] - b[1]) / l, tz = (a[2] - b[2]) / l, sl = Math.hypot(tx, tz), sx = -tz / sl, sz = tx / sl, ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty;
      const over = (lam) => { let o = -1e9; for (const [cs, cu] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = hillXZ((b[0] + tx * lam + (sx * cs + ux * cu) * w / 2) * UWK, (b[2] + tz * lam + (sz * cs + uz * cu) * w / 2) * UWK); o = Math.max(o, hillY + (b[1] + ty * lam + uy * cu * w / 2) * UWK - groundY(q[0], q[1])); } return o; };
      let lo = 0, hi = 0; while (hi < 2 * l && over(hi) > -FOOT_UNDER) { lo = hi; hi += 0.25; }
      // (MENDING 3: THE WALK TELLS WHERE IT ENDED. It is bound at twice the old member's length; `bound`: it met no ground by then
      // and the foot would end in the air. `under`: the depth of the foot's highest corner under the drawn ground, in metres.)
      const bound = over(hi) > -FOOT_UNDER;
      for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (over(mid) > -FOOT_UNDER) lo = mid; else hi = mid; }
      const foot = [b[0] + tx * hi, b[1] + ty * hi, b[2] + tz * hi]; foot.under = -over(hi); foot.bound = bound; return foot; };
    B.col(WTIMBER, 0.75, 1).surf(SURF.PLANKS, 0);
    const UB = ST.makeBuilder(128), frameFeet = []; UB.push(new THREE.Matrix4().fromArray(B.m)).col(WTIMBER, 0.75, 1).surf(SURF.PLANKS, 0);
    const member = (name, sd, b, old, w) => {
      const a = footOf(b, old, w), dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, tx = dx / l, ty = dy / l, tz = dz / l, sl = Math.hypot(tx, tz), sx = -tz / sl, sz = tx / sl, ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty;
      const corner = (p, s, u) => [p[0] + sx * s * w / 2 + ux * u * w / 2, p[1] + uy * u * w / 2, p[2] + sz * s * w / 2 + uz * u * w / 2];
      const over = (f, g) => { const q = hillXZ((f[0] + tx * g) * UWK, (f[2] + tz * g) * UWK); return hillY + (f[1] + ty * g) * UWK - groundY(q[0], q[1]); };
      const k = WTIMBER, edge = {};
      for (const [s, u] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const f = corner(a, s, u), h = corner(b, s, u); let hi = l, lo = l; while (lo > 0 && over(f, lo) > 0) { hi = lo; lo = Math.max(0, lo - 0.25); }
        for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (over(f, mid) > 0) hi = mid; else lo = mid; }
        const c = 0.75 + 0.25 * hi / l;
        edge[s + ',' + u] = { f: [f[0], f[1], f[2], k[0] * 0.75, k[1] * 0.75, k[2] * 0.75, 0], g: [f[0] + tx * hi, f[1] + ty * hi, f[2] + tz * hi, k[0] * c, k[1] * c, k[2] * c, hi], h: [h[0], h[1], h[2], k[0], k[1], k[2], l] }; }
      const put = (Bq, n, p, u) => Bq.v(p[0], p[1], p[2], n[0], n[1], n[2], p[3], p[4], p[5], u, p[6]);
      for (const [X, Y] of [['1,-1', '-1,-1'], ['-1,1', '1,1'], ['-1,-1', '-1,1'], ['1,1', '1,-1']]) { const x = edge[X], y = edge[Y];
        const ex = y.f[0] - x.f[0], ey = y.f[1] - x.f[1], ez = y.f[2] - x.f[2], vx = x.h[0] - x.f[0], vy = x.h[1] - x.f[1], vz = x.h[2] - x.f[2], nx = ey * vz - ez * vy, ny = ez * vx - ex * vz, nz = ex * vy - ey * vx, nl = Math.hypot(nx, ny, nz) || 1, n = [nx / nl, ny / nl, nz / nl];
        B.quad4(put(B, n, x.g, 0), put(B, n, y.g, w), put(B, n, y.h, w), put(B, n, x.h, 0));
        UB.quad4(put(UB, n, x.f, 0), put(UB, n, y.f, w), put(UB, n, y.g, w), put(UB, n, x.g, 0)); }
      B.quad(edge['1,-1'].h, edge['-1,-1'].h, edge['-1,1'].h, edge['1,1'].h); UB.quad(edge['-1,-1'].f, edge['1,-1'].f, edge['1,1'].f, edge['-1,1'].f);
      frameFeet.push({ member: name, side: sd, under: a.under, bound: a.bound });
    };
    for (const sd of [-1, 1]) {
      const z0 = UW.fz + sd * 3.4, z1 = UW.fz + sd * 1.3, legHead = [UW.fx, UW.frame, z1], stayHead = [UW.fx, UW.frame - 1.5, z1];
      member('leg', sd, legHead, [UW.fx - 6.5, -8, z0], 0.6); member('stay', sd, stayHead, [UW.fx + 12, -8, z0], 0.5);
      for (const k of [0.3, 0.55, 0.78]) B.beam([lerp(UW.fx - 6.5, UW.fx, k), lerp(-8, UW.frame, k), lerp(z0, z1, k)], [lerp(UW.fx + 12, UW.fx, k), lerp(-8, UW.frame - 1.5, k), lerp(z0, z1, k)], 0.3, 0.3);
    }
    for (const k of [0.3, 0.55, 0.78, 1]) B.beam([lerp(UW.fx - 6.5, UW.fx, k), lerp(-8, UW.frame, k), UW.fz - lerp(3.4, 1.3, k)], [lerp(UW.fx - 6.5, UW.fx, k), lerp(-8, UW.frame, k), UW.fz + lerp(3.4, 1.3, k)], 0.34, 0.34);
    B.col(IRON).surf(SURF.PLAIN);
    for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.2832, a1 = (i + 1) / 12 * 6.2832, R = 2.7, cy = UW.frame + 1.2;
      B.beam([UW.fx + Math.cos(a0) * R, cy + Math.sin(a0) * R, UW.fz], [UW.fx + Math.cos(a1) * R, cy + Math.sin(a1) * R, UW.fz], 0.3, 0.22);
      if (i % 2 === 0) B.beam([UW.fx, cy, UW.fz], [UW.fx + Math.cos(a0) * R, cy + Math.sin(a0) * R, UW.fz], 0.14, 0.14); }
    B.pop();
    // (THE STUBS' MESH: of the works' own material; it takes shadow and light as the timber over the ground does and throws no shadow)
    { const under = new THREE.Mesh(UB.toGeometry(), mats.facades); under.receiveShadow = true; under.name = 'built, under the ground'; scene.add(under); }
    // (MENDING 3: the four feet written down for a count: member, side, `under` (the depth of the foot's highest corner under
    // the drawn ground, m) and `bound` (the walk ended at its bound: the member met no ground))
    scene.userData.frameFeet = frameFeet;
    // (no light burns on the hill: the upper works stand dark against the sky)
    laneNote('upper works', laneDist(P.MH[0], P.MH[1], 26 * UWK, hillY - 9 * UWK, hillY + UW.stack * UWK, 200));
    await ctx.yield();
    // (THE TRAMWAY ON ITS TRESTLES IS STRUCK, round 8: it ran beside the cutting 4.4 m from the yard's axis, its first trestle
    // leaning. The works' timber now stands upright and in its own places: the mouth's frames, the head frame on the hill, the
    // launder's trestles by the wheel.)
    B.tr(I[0], floorY, I[1], isleRy);
    // old lantern posts along the rims of the cutting, three to a side, 1.7 m outside the cutting's lip: each with its iron
    // lantern still hanging, dark
    const rLn = fk.lanterns, LZ = P.CUT_HALF + 1.7;
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = -30 + k * 10.5 + rLn.range(-1.5, 1.5), g = gAt(x, sd * LZ), top = g + 2.9, lz = sd * (LZ - 0.6);
      B.col(WOOD, 0.7, 1).surf(SURF.PLANKS, 0).beam([x, g - 0.4, sd * LZ], [x, top, sd * LZ], 0.16, 0.16).beam([x, top - 0.15, sd * LZ], [x, top - 0.15, lz], 0.08, 0.08);
      B.col(IRON).surf(SURF.PLAIN).cbox(x, top - 0.72, lz, 0.3, 0.5, 0.3);
    }
    B.pop();
    await ctx.yield();
    // ---- THE WATER HOLDS THE LIGHT. (The cart ruts and the puddles of the firm way are struck, round 8: the way over the mire is
    // boards from island to island.) Every pool of the mire and the tarn carries, over the kit's water, one sheet that adds
    // what a mirror would show of the lights of the place and of the moon: each light as a LONG REFLECTION drawn out toward
    // the eye from under it, as ripples draw a light out (the fire in the yard's hut, the ring's fire, the boards' lanterns
    // and the hound's fire), and the
    // moon as A BROKEN PATH OF GLITTER on the water under it: sparks that stand on the water where they are (cells 0.3 m, each
    // twinkling by the world's clock from its own phase) and run together into a soft pale path where a pixel no longer holds
    // one spark (by the pixel's footprint and to the sparks' own mean, not by a distance from the eye). It follows the eye
    // as a mirror does (the mirrored ray, the grazing term, the air's fog by the scene's law) and reads nothing else of the
    // camera: the water lies where it lies and shows what a pool shows. The eye's distance is guarded.
    const fireC = new THREE.Color('#ff4a1c').multiplyScalar(1.5), mineL = [];
    // (the duckboards' lanterns: one on each firm island of the wand path, on the path's right hand; x, y of the flame, z)
    const boardLamps = P.isles.map((q) => { const p = P.wayAt(q[3], 3.9); return [p[0], groundY(p[0], p[1]) + 2.25, p[1]]; });
    // (the hut's fire, red, drawn out long on the tarn; the ring's own fire; the lanterns of the duckboards. THE HOUND'S FIRE IS
    // MIRRORED IN THE POOLS: the list's last light is the hound's, and goes where the hound goes)
    mineL.push([hutFire[0], hutFire[1] + 0.6, hutFire[2], fireC, 3.0]);
    mineL.push([I[0] - yd[0] * 3, P.yEnd, I[1] - yd[1] * 3, new THREE.Color(RING_FIRE).multiplyScalar(1.5), 4.0]);
    for (const p of boardLamps) mineL.push([p[0], p[1], p[2], new THREE.Color('#ff8a40').multiplyScalar(0.8), 0.8]);
    const houndMirror = mineL.length; mineL.push([0, -999, 0, new THREE.Color(HOUND_FIRE).multiplyScalar(1.1), 1.5]);
    const mirUOf = (list) => ({ uL: { value: list.map((q) => new THREE.Vector3(q[0], q[1], q[2])) }, uC: { value: list.map((q) => q[3]) }, uS: { value: list.map((q) => q[4]) }, uTime: { value: 0 }, uFogD: { value: H.fogD },
      uMoonD: { value: sunDir.clone().normalize() }, uMoonC: { value: new THREE.Color(H.light).multiplyScalar(H.moon ? 1.15 : 0) }, uK: { value: 1 } });
    const mirU = mirUOf(mineL);
    updaters.push((dt, t) => { mirU.uTime.value = t; });
    // (a mirror sheet shows the lights of ITS OWN water's list: the mire's shows the works', the boards' and the hound's; the
    // ford's shows the bridge's two lanterns; both show the moon)
    const mirrorOn = (geo, y, name, k, U = mirU, nL = mineL.length) => {
      const mat = own(new THREE.ShaderMaterial({ uniforms: { ...U, uK: { value: k } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
        vertexShader: 'attribute float aDepth; varying vec3 vW; varying float vDepth; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vDepth = aDepth; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: `#define NL ${nL}
          uniform vec3 uL[NL]; uniform vec3 uC[NL]; uniform float uS[NL]; uniform float uTime, uFogD, uK; uniform vec3 uMoonD, uMoonC; varying vec3 vW; varying float vDepth;
          float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec3 toP = vW - cameraPosition; float dist = max(length(toP), 1e-3); vec3 V = toP / dist, R = vec3(V.x, -V.y, V.z);
            vec2 hp = normalize(vec2(-R.z, R.x) + vec2(1e-6, 0.0)); vec3 acc = vec3(0.0);
            for (int i = 0; i < NL; i++) { vec3 d = uL[i] - vW; float t = dot(d, R); if (t > 0.0) { vec3 miss = d - R * t; float mh = dot(miss.xz, hp), mv = sqrt(max(dot(miss, miss) - mh * mh, 0.0)), sh = uS[i] * (1.0 + 0.004 * t), sv = uS[i] * (3.0 + 0.07 * t);
              acc += uC[i] * exp(-(mh * mh) / (sh * sh) - (mv * mv) / (sv * sv)); } }
            // (SAMPLING: fw is a pixel's footprint on the water, in metres. The ripple, 1.2 m long, goes to its own mean 0.72 where a
            // pixel spans it. THE GRAZING TERM fr is water's own: a pool mirrors more of a light the lower the ray lies on it.
            // THE AIR between is the scene's own fog law, exp(-(density * distance)^2), with the scene's own density.)
            float fw = length(fwidth(vW.xz));
            float rip = 0.72 + 0.28 * (1.0 - smoothstep(0.3, 1.2, fw)) * sin(vW.x * 5.1 + uTime * 1.3) * sin(vW.z * 4.3 - uTime * 1.1);
            float fr = 0.4 + 0.6 * pow(1.0 - abs(V.y), 3.0), fogK = exp(-uFogD * uFogD * dist * dist);
            // the moon's path: the mirrored ray's bearing within a few degrees of the moon's, its height within a broad band of it
            vec2 rh = normalize(R.xz + vec2(1e-6, 0.0)), mh2 = normalize(uMoonD.xz);
            float da = acos(clamp(dot(rh, mh2), -1.0, 1.0)), de = asin(clamp(R.y, -1.0, 1.0)) - asin(clamp(uMoonD.y, -1.0, 1.0));
            float path = exp(-(da * da) / 0.0036 - (de * de) / (de > 0.0 ? 0.03 : 0.2));
            vec2 cell = floor(vW.xz * 3.3); float h = h21(cell), tw = 0.5 + 0.5 * sin(uTime * (1.2 + 2.6 * h) + h * 40.0);
            vec2 cf = fract(vW.xz * 3.3) - 0.5; float dot2 = 1.0 - smoothstep(0.08, 0.3, length(cf * vec2(1.0, 0.55 + 0.9 * h21(cell + 7.0))));
            // (SAMPLING: where a pixel's footprint spans half a cell of sparks and more, the sparks go to THEIR OWN MEAN over the
            // cells and the clock, 0.217 (counted over two million draws of cell and phase); no distance from the eye is in it)
            float spark = smoothstep(0.46, 0.84, h * 0.55 + tw * 0.45) * dot2 * 6.0, farK = smoothstep(0.5, 2.0, fw * 3.3);
            vec3 moon = uMoonC * path * mix(spark, 0.217, farK) * (0.4 + 0.3 * rip);
            gl_FragColor = vec4((acc * (fr * rip) + moon) * (smoothstep(0.0, 0.03, vDepth) * fogK * uK), 1.0);
          }` }));
      const m = new THREE.Mesh(geo, mat); m.position.y = y; m.renderOrder = 2; m.frustumCulled = false; m.name = name; scene.add(m); return m;
    };
    mirrorOn(pools.object.geometry, poolLevel, 'lights in the pools', 0.85);
    // (THE FORD'S POOL HOLDS THE MOON AND THE BRIDGE'S LANTERNS: the same mirror on the ford's own sheet of water)
    if (fordPool && fordPool.object.geometry && fordPool.object.geometry.attributes.aDepth) { const fordL = bridgeLamps.map((p) => [p[0], p[1], p[2], new THREE.Color('#ffb060').multiplyScalar(0.9), 1.0]);
      if (!fordL.length) fordL.push([0, -999, 0, new THREE.Color(0, 0, 0), 1]);
      const fU = mirUOf(fordL), fm = mirrorOn(fordPool.object.geometry, 0, 'the moon and the lanterns in the ford', 1.0, fU, fordL.length);
      fm.position.copy(fordPool.object.position); fm.rotation.copy(fordPool.object.rotation); fm.scale.copy(fordPool.object.scale); updaters.push((dt, t) => { fU.uTime.value = t; }); }
    // THE DUCKBOARDS: the wand path is a walk of boards from firm island to firm island, from the mire's shore to the yard's
    // apron: planks 1.4 m long laid across two stringers, a plank every half metre, on short posts over the wet between the
    // islands, their top BOARD_UP over the mire's level; where the turf of an island or the apron stands as high, the boards
    // end and the path is the island's own trodden turf. One plank in twenty-five is gone, and each lies a little askew (by
    // the draw). ON EACH FIRM ISLAND A LANTERN hangs on a post on the path's right hand, 3.9 m from its middle, lit red-gold:
    // a light of the place (plPut) and mirrored in the pools with the mine's lights (boardLamps, above).
    { const rBd2 = fk.boards, BOARD_UP = 0.24, by = MIRE_Y + BOARD_UP, plank = new THREE.BoxGeometry(0.42, 0.05, 1.4), mats4 = [], q = [0, 0], run = [];
      // (THE BOARDS ARE PALE: weathered deal, silver under the moon, their stringers and posts of the same timber)
      const boardMat = own(new THREE.MeshStandardMaterial({ color: '#c9c2b0', roughness: 0.8, vertexColors: false }));
      lampsOn(boardMat, 'board', { soft: 0.5 });
      if (H.board) moonHeld(boardMat, { own: H.board, mirror: H.boardGlint });   // (mending 1 of polish 1: the boards stand as in live)
      let wasOn = false, s0 = 0;
      for (let s = AT.ME + 6; s <= AT.I - APRON_M + 6; s += 0.5) {
        P.wayAt(s, 0, q); const t = wayTan(s), on = groundY(q[0], q[1]) < by - 0.07, gone = rBd2() < 0.04, yaw = Math.atan2(-t[1], t[0]) + rBd2.range(-0.05, 0.05), dy = rBd2.range(-0.012, 0.012), off = rBd2.range(-0.05, 0.05), tip = rBd2.range(-0.02, 0.02);
        // (every half metre's five draws are dealt first, whether a plank lies there or not)
        if (on && !gone) { eT.set(0, yaw, tip); qT.setFromEuler(eT); mats4.push(new THREE.Matrix4().compose(vT.set(q[0] - t[1] * off, by - 0.025 + dy, q[1] + t[0] * off), qT, sT.set(1, 1, 1))); }
        if (on && !wasOn) s0 = s; if (!on && wasOn) run.push([s0, s - 0.5]); wasOn = on; }
      if (wasOn) run.push([s0, AT.I - APRON_M + 6]);
      const boards = new THREE.InstancedMesh(plank, boardMat, Math.max(1, mats4.length)); mats4.forEach((M, i) => boards.setMatrixAt(i, M)); boards.count = mats4.length; boards.instanceMatrix.needsUpdate = true; boards.receiveShadow = true; boards.name = 'duckboards'; boards.computeBoundingSphere(); scene.add(boards); own(plank);
      // (the stringers under the planks and the posts they stand on, every 3 m of each run)
      B.col(lin('#c9c2b0'), 0.75, 1.0).surf(SURF.PLANKS, 0);
      for (const r of run) for (let s = r[0] - 0.4; s < r[1] + 0.4; s += 3) { const s1 = Math.min(s + 3, r[1] + 0.4);
        for (const sd of [-1, 1]) { const a = P.wayAt(s, sd * 0.5), b = P.wayAt(s1, sd * 0.5), g = Math.min(groundY(a[0], a[1]), poolLevel); B.beam([a[0], by - 0.13, a[1]], [b[0], by - 0.13, b[1]], 0.12, 0.16); B.beam([a[0], g - 0.5, a[1]], [a[0], by - 0.2, a[1]], 0.14, 0.14); footAt('duckboard post', a[0], a[1], g - 0.5, 1.3); } }
      // (THE BOARDS AGAINST THE LINE, AS BUILT: every plank by its own place, height and tilt (its four upper corners' round); every
      // stringer at each of its ends)
      for (const M of mats4) { const e = M.elements; laneNote('duckboards', laneDist(e[12], e[14], 0.74, e[13] - 0.03, e[13] + 0.045, 12)); }
      for (const r of run) for (let s = r[0] - 0.4; s < r[1] + 0.4; s += 3) for (const sd of [-1, 1]) { const a = P.wayAt(s, sd * 0.5); laneNote('duckboard stringers', laneDist(a[0], a[1], 0.1, by - 0.3, by - 0.05, 12)); }
      scene.userData.boards = { planks: mats4.length, runs: run, top: by };
      for (const p of boardLamps) { const g = p[1] - 2.25;
        if (!laneOk('board lantern', p[0], p[2], 0.35, g, g + 2.6)) continue;
        B.col(WTIMBER, 0.7, 1).surf(SURF.PLANKS, 0).beam([p[0], g - 0.4, p[2]], [p[0], g + 2.6, p[2]], 0.14, 0.14);
        B.col(IRON).surf(SURF.PLAIN).cbox(p[0], g + 2.0, p[2] + 0.22, 0.3, 0.5, 0.3);
        B.col(lin('#ff9a50'), 2.4, 2.4).surf(SURF.GLOW, 0, 1).cbox(p[0], g + 2.07, p[2] + 0.22, 0.2, 0.34, 0.2);
        lanternPts.push([p[0], p[1], p[2] + 0.22, 0.8, '#ff8a40']); plPut(p[0], p[1], p[2] + 0.22, 8.5, '#ff8a4a', 0.95); standing.push([p[0], p[2], 0.3]); footAt('board lantern', p[0], p[2], g - 0.4, 0.8); }
      scene.userData.track = { boards: mats4.length, runs: run.length, lanterns: boardLamps.length }; }
    await ctx.yield();
    // THE WHEEL: twenty-four metres across. ITS PLACE IS FOUND ON THE LAND (round 9; until now it was two typed numbers in the
    // yard's frame). The wheel was turned by the hill's water and its tail-race falls to the low wet ground of the basin's
    // eastern side, where the fog lies: so it stands ON THE FLANK OF THE MINE'S HILL THAT FACES THAT GROUND, on the line from
    // the hill's middle to the fog's middle (P.MH, P.fogC), AT THE FOOT OF THE FLANK'S STEEP: the first place, going down
    // that line from the hill's middle, where the plan's land stands WHEEL_FOOT metres (6.2 to 6.8 by its draw) over the
    // mire's level. There the hill's water comes to its top in the launder, the last length of its leat (no more of the
    // leat is drawn). Where that falls in the yard's frame is counted, not typed (wheel2.mjs of round 9's scratch, 300
    // seeds: 52 to 60 m beyond the mine's mouth, 28 to 36 m to the right of the yard's axis). It stands square to the
    // yard as the works' other buildings do: its axle along the yard's axis and its round across it. IT STANDS ON THE GROUND: under it a platform of flagged moor
    // stone 27 m by 10 stands WHEEL_UP metres out of the ground and goes 3 m down into it; on the platform two stepped piers
    // of masonry carry the axle, each stayed by four raking baulks of timber; low walls line the pit between them. The
    // launder that fed it comes to its top from behind, from the hill, on three tall trestles, 30 m long. It rocks a little in
    // the wind.
    // (THE PLATFORM STANDS OUT OF THE GROUND AT EVERY CORNER, round 6: its top is WHEEL_UP over the ground at the wheel's place or
    // 0.2 m under the highest ground at its four corners, whichever is higher, and it goes 5.5 m down, so that the hill's foot
    // does not lie over its far end and its near end is not in the air)
    const WB = ST.makeBuilder(4096), WHEEL_UP = 0.9, wheelAt = isleXZ(WHEEL_AT[0], WHEEL_AT[1]), wheelCorner = (cx, cz) => { const qx = wheelAt[0] - cx * (WR_ + 1.5) * ydR[0] + cz * 5 * yd[0], qz = wheelAt[1] - cx * (WR_ + 1.5) * ydR[1] + cz * 5 * yd[1]; return Math.max(land(qx, qz), groundY(qx, qz)); },
      wheelBase = Math.max(Math.max(land(wheelAt[0], wheelAt[1]), MIRE_Y) + WHEEL_UP, Math.max(wheelCorner(-1, -1), wheelCorner(1, -1), wheelCorner(1, 1), wheelCorner(-1, 1)) - 0.2), wheelY = wheelBase + WR_ + 0.6;
    // (round 7, by the count of the feet: the works being a third greater, the platform spans more of the hill's foot, and on seed
    // 91 of 1 to 100 its lowest corner stood 0.58 m in the air. It goes down 5.5 m as before, or to 0.6 m under the lowest ground
    // at its four corners, the drawn ground and the plan's, whichever is deeper.)
    const wheelLow = (cx, cz) => { const qx = wheelAt[0] - cx * (WR_ + 1.5) * ydR[0] + cz * 5 * yd[0], qz = wheelAt[1] - cx * (WR_ + 1.5) * ydR[1] + cz * 5 * yd[1]; return Math.min(land(qx, qz), groundY(qx, qz)); };
    const PLAT_DOWN = Math.max(5.5, wheelBase - Math.min(wheelLow(-1, -1), wheelLow(1, -1), wheelLow(1, 1), wheelLow(-1, 1)) + 0.6);
    // (THE WHEEL NO LONGER TURNS: it stands where it stopped, at an angle of its own draw, and a third of its rim has fallen
    // away with the buckets and the ends of the arms that carried it: WHEEL_GONE, the rim's lengths that are gone)
    const wheelPh = [fk.wheel.range(0, 6.2832), fk.wheel.range(0, 6.2832)], WHEEL_GONE = (i) => i >= 2 && i <= 10;
    WB.col(WTIMBER, 0.75, 1).surf(SURF.PLANKS, 0);
    for (let i = 0; i < 28; i++) { const a0 = i / 28 * 6.2832, a1 = (i + 1) / 28 * 6.2832;
      if (WHEEL_GONE(i)) { if (i % 2 === 0) for (const z of [-1.15, 1.15]) WB.beam([0, 0, z], [Math.cos(a0) * WR_ * (i % 4 ? 0.5 : 0.72), Math.sin(a0) * WR_ * (i % 4 ? 0.5 : 0.72), z], 0.3, 0.36); continue; }
      for (const z of [-1.15, 1.15]) { WB.beam([Math.cos(a0) * WR_, Math.sin(a0) * WR_, z], [Math.cos(a1) * WR_, Math.sin(a1) * WR_, z], 0.42, 0.5); WB.beam([Math.cos(a0) * WR_ * 0.88, Math.sin(a0) * WR_ * 0.88, z], [Math.cos(a1) * WR_ * 0.88, Math.sin(a1) * WR_ * 0.88, z], 0.24, 0.3); WB.beam([Math.cos(a0) * WR_ * 0.45, Math.sin(a0) * WR_ * 0.45, z], [Math.cos(a1) * WR_ * 0.45, Math.sin(a1) * WR_ * 0.45, z], 0.2, 0.24); }
      if (i % 2 === 0) for (const z of [-1.15, 1.15]) WB.beam([0, 0, z], [Math.cos(a0) * WR_, Math.sin(a0) * WR_, z], 0.3, 0.36);
      if (i !== 8 && i !== 9 && i !== 18) WB.beam([Math.cos(a0) * WR_ * 0.94, Math.sin(a0) * WR_ * 0.94, -1.25], [Math.cos(a0) * WR_ * 0.94, Math.sin(a0) * WR_ * 0.94, 1.25], 1.4, 0.12); }
    WB.col(IRON).surf(SURF.PLAIN).beam([0, 0, -3.4], [0, 0, 3.4], 0.7, 0.7);
    const wheel = new THREE.Mesh(WB.toGeometry(), mats.facades); wheel.position.set(wheelAt[0], wheelY, wheelAt[1]); wheel.rotation.order = 'YXZ'; wheel.rotation.y = isleRy + Math.PI / 2; wheel.rotation.z = wheelPh[0] * 0.08; wheel.castShadow = true; scene.add(wheel);
    // (in the wheel's frame -x is away from the yard's axis and +z up it; y is from the axle. wAt: the ground's height there)
    const wAt = (lx, lz) => groundY(wheelAt[0] - lx * ydR[0] + lz * yd[0], wheelAt[1] - lx * ydR[1] + lz * yd[1]) - wheelY, PLAT = wheelBase - wheelY, WPX = WR_ + 1.5, WPZ = 5;
    B.tr(wheelAt[0], wheelY, wheelAt[1], isleRy + Math.PI / 2);
    // the platform (its top PLAT), a kerb course round its edge, and the pit's low walls either side of the wheel
    B.col(WSTONE, 0.72, 1).surf(SURF.MASONRY, 0).box(-WPX, PLAT - PLAT_DOWN, -WPZ, WPX, PLAT, WPZ, { m: 0.5 });
    B.col(LICHEN, 0.8, 1.0).surf(SURF.PLAIN).box(-WPX - 0.15, PLAT - 0.05, -WPZ - 0.15, WPX + 0.15, PLAT + 0.16, -WPZ + 0.5).box(-WPX - 0.15, PLAT - 0.05, WPZ - 0.5, WPX + 0.15, PLAT + 0.16, WPZ + 0.15);
    B.col(WSTONE, 0.7, 1).surf(SURF.MASONRY, 0);
    for (const z of [-1.9, 1.9]) B.box(-WR_ - 1.2, PLAT, z - 0.3, WR_ + 1.2, PLAT + 1.5, z + 0.3, { m: 0.5 });
    // the two piers: stepped masonry from the platform to the axle
    for (const z of [-3.1, 3.1]) { B.col(WSTONE, 0.75, 1).surf(SURF.MASONRY, 0).box(-3.4, PLAT, z - 0.9, 3.4, -WR_ * 0.5, z + 0.9, { m: 0.5 }).box(-2.3, -WR_ * 0.5, z - 0.75, 2.3, -0.5, z + 0.75, { m: 0.5 });
      B.col(LICHEN, 0.8, 1.0).surf(SURF.PLAIN).box(-3.55, -WR_ * 0.5 - 0.2, z - 1.0, 3.55, -WR_ * 0.5 + 0.12, z + 1.0).box(-2.45, -0.5, z - 0.85, 2.45, -0.2, z + 0.85); }
    // the raking baulks that stay the piers
    B.col(WTIMBER, 0.7, 1).surf(SURF.PLANKS, 0);
    for (const z of [-4.0, 4.0]) { B.beam([-8.5, PLAT, z], [-1.4, -1.2, z * 0.86], 0.5, 0.5); B.beam([8.5, PLAT, z], [1.4, -1.2, z * 0.86], 0.5, 0.5); B.beam([-4.6, PLAT + (-1.2 - PLAT) * 0.52, z * 0.93], [4.6, PLAT + (-1.2 - PLAT) * 0.52, z * 0.93], 0.3, 0.3); }
    // the launder: a trough of boards on three trestles, falling a little to the wheel's top; it comes from behind the wheel,
    // from the hill (along +z in this frame), and turns its water on to the wheel's breadth
    const LY = WR_ + 0.9, LL = 30;
    for (const sd of [-1, 1]) B.beam([sd * 0.75, LY + 1.2, LL], [sd * 0.75, LY + 0.3, 0.2], 0.12, 0.8);
    B.beam([0, LY + 0.85, LL], [0, LY - 0.05, 0.2], 1.5, 0.12);
    for (const lz of [27, 19, 11]) { const yt = LY - 0.05 + (lz - 0.2) / (LL - 0.2) * 0.9 - 0.12; for (const sd of [-1, 1]) B.beam([sd * 2.6, wAt(sd * 2.6, lz) - 0.4, lz], [sd * 0.85, yt, lz], 0.42, 0.42); B.beam([-1.3, yt - 0.14, lz], [1.3, yt - 0.14, lz], 0.36, 0.36);
      B.beam([-2.1, wAt(-2.2, lz) + 2.2, lz], [1.2, yt - 2.6, lz], 0.2, 0.26); B.beam([1.55, wAt(2.2, lz) + 7.5, lz], [-1.75, yt - 8.5, lz], 0.2, 0.26); }
    B.pop();
    await ctx.yield();

    // PEAT CUTTINGS: three on the low moor between the lane's end and the brook, 14 to 30 m from the old way. Each is a bank of black peat cut
    // straight, 0.8 m high and 1.5 m through, with a strip of darkened turf still on its top, the cut floor before it, turves stood
    // to dry in little stooks on the floor and a rick of them at one end.
    const rPe = fk.peat, PEAT = lin('#17110d'), peatAt = [], peQ = [0, 0];
    for (let i = 0; i < 3; i++) {
      const sP = lerp(AT.sunk + 50, AT.V - 50, (i + rPe.range(0.15, 0.85)) / 3), side = rPe.sign() * rPe.range(14, 30), len = rPe.range(10, 16), yaw = rPe.range(0, 6.28), nSt = 12, stooks = [];
      for (let k = 0; k < nSt; k++) stooks.push([rPe.range(-0.5, 0.5), rPe.range(-0.4, 0.4), rPe.range(0, 1.5)]);
      beside(sP, side, peQ);
      const x = peQ[0], z = peQ[1], zn = zoneAt(P, x, z, ZONE);
      if (zn.park > 0.05 || zn.mire > 0.1 || zn.river < 6 || Math.hypot(x - F.x, z - F.z) < 60 || standing.some((t) => Math.hypot(t[0] - x, t[1] - z) < t[2] + len * 0.6 + 2)) continue;
      const y0 = groundY(x, z) + 0.04; groundRGB(x, z, y0, 1, gTmp); peatAt.push([x, y0, z]); standing.push([x, z, len * 0.4]);
      B.tr(x, y0, z, yaw);
      B.col(PEAT, 0.8, 1.2).surf(SURF.PLAIN).box(-len / 2, -1.2, 0, len / 2, 0.8, 1.5, { m: 0.5 }).box(-len / 2 - 0.4, -1.2, -5.5, len / 2 + 0.4, 0.05, 0, { m: 0.5 });
      B.col([gTmp[0] * 0.62, gTmp[1] * 0.62, gTmp[2] * 0.62]).box(-len / 2 - 0.12, 0.8, -0.12, len / 2 + 0.12, 0.92, 1.62);
      B.col(PEAT, 1.1, 1.5);
      for (let k = 0; k < nSt; k++) { const sx = -len / 2 + 0.8 + (k % 6) * (len - 1.6) / 5 + stooks[k][0], sz = -1.6 - Math.floor(k / 6) * 1.9 + stooks[k][1]; B.tr(sx, 0.05, sz, stooks[k][2]); B.beam([-0.22, 0, 0], [0, 0.5, 0], 0.34, 0.1).beam([0.22, 0, 0], [0, 0.5, 0], 0.34, 0.1).beam([0, 0, -0.22], [0, 0.46, 0], 0.1, 0.34); B.pop(); }
      B.box(len / 2 - 2.6, 0.05, -4.9, len / 2 - 0.2, 1.0, -3.4, { m: 0.5 }).box(len / 2 - 2.3, 1.0, -4.7, len / 2 - 0.5, 1.4, -3.6, { m: 0.5 });
      B.pop();
    }
    // (THE FAR FARM IS STRUCK, round 8: the open moor has one gold window, the moorman's cottage's)
    const farAt = scene.userData.cottage ? scene.userData.cottage.window : [0, -999, 0];
    await ctx.yield();

    // the granite, now that every block has its place: the piled slabs, the near boulders (fine) and the far ones (coarse)
    // (each list is sifted against the lane first)
    laneSift('granite pile', slabs, 1.15, 0.4); laneSift('granite pile', hillSlabs, 1.15, 0.4); laneSift('granite pile', farSlabs, 1.15, 0.4); laneSift('boulder', boulders, 1.0, 0.9); laneSift('boulder', midBoulders, 1.0, 0.9); laneSift('boulder', smallBoulders, 1.0, 0.9); laneSift('skirt boulder', skirtStones, 1.0, 0.75); laneSift('skirt boulder', skirtSmall, 1.0, 0.75); for (const list of wallNear) laneSift('dry-stone wall', list, 1.35, 1.25);
    // (A SET STONE IS MEASURED AS IT STANDS: the menhir's own block is 2.6 broad, 2.04 tall and 0.72 thick before its scale; the round
    // about its own axis that holds its corners, widened by its lean over its half height, between its foot and its top)
    for (const list of [menhirs, menhirsB]) { let n = 0; for (const M of list) { const e = M.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]), lean = Math.hypot(e[4], e[6]) / sy;
        if (laneOk('set stone', e[12], e[14], Math.hypot(1.3 * sx, 0.36 * sz) + 1.02 * sy * lean, e[13] - 1.02 * sy, e[13] + 1.02 * sy)) list[n++] = M; } list.length = n; }
    scene.userData.gateposts = gatePosts.map((g) => ({ gate: g[2], stands: menhirs.concat(menhirsB).some((M) => Math.hypot(M.elements[12] - g[0], M.elements[14] - g[1]) < 0.05) }));
    const slabMesh = T.makeInstances(slabGeo, rockMat, slabs, { castShadow: true, receiveShadow: true, brightness: 0.14 }), boulderMesh = T.makeInstances(boulderGeo, rockMat, boulders, { receiveShadow: true, brightness: 0.14 });
    // (the boulders by their own size, wherever they lie: the cobble of 48 faces for those of 0.6 m and more, the one of 24 for the
    // lesser stones)
    if (smallBoulders.length) scene.add(T.makeInstances(boulderSmall, rockMat, smallBoulders, { receiveShadow: true, brightness: 0.14 }).object);
    // (POLISH 1, STAGE C3: THE FALLEN BLOCKS RIDE IN THE COBBLES' OWN DRAW. FALLEN.n places are kept for them at the END of this
    // mesh (each a copy of the first cobble's place, so that the mesh's round is live's) and are not drawn: the mesh draws live's
    // count until the late block, after the fox, gives each fallen block its place. Every cobble of live keeps its number, and so
    // its place and the tint the kit dealt it by its number; live's lists are not written to.)
    const FALLEN = { n: 16, size: [0.62, 1.19] };
    const midBoulderMesh = T.makeInstances(boulderMid, rockMat, midBoulders.concat(Array.from({ length: FALLEN.n }, () => midBoulders[0] || new THREE.Matrix4())), { receiveShadow: true, brightness: 0.14 }), farSlabMesh = T.makeInstances(slabFar, rockMat, farSlabs, { brightness: 0.14 });
    midBoulderMesh.mesh.count = midBoulders.length;
    // (ROUND 11, MENDING 2: the slabs that only held a left-out far pile's numbers are taken out, of the mesh and of the list:
    // every slab that stays keeps its place and the tint the kit dealt it by its number; nothing of a left-out pile is drawn.
    // MENDING 3: this is the one list that is cleared of ghosts; stack's `ghost` is for a pile dealt into this list alone)
    { const im = farSlabMesh.mesh, cT = new THREE.Color(), all = farSlabs.length; let n = 0;
      for (let k = 0; k < all; k++) { const M = farSlabs[k]; if (M.ghost) continue; if (n !== k) { im.setMatrixAt(n, M); im.getColorAt(k, cT); im.setColorAt(n, cT); } farSlabs[n++] = M; }
      if (n !== all) { farSlabs.length = n; im.count = n; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; if (n) { im.computeBoundingSphere(); im.computeBoundingBox(); } } }
    // (THE SET STONES' OWN GRANITE: the piles' stone with a third of its cracks; a stone no broader than a man is not
    // cracked through as a pile's great blocks are)
    const menhirMat = own(T.makeRockMaterial({ terrain, strata: 0, top: '#8f947e', topAmount: 0.18, contact: [0.3, 0.14, -0.36], roughness: 0.62, cracks: 0.12, ...rockHeld }));
    if (H.stone) moonHeld(menhirMat, { direct: H.stone, mirror: H.glint });
    const menhirMesh = T.makeInstances(menhirGeo, menhirMat, menhirs, { castShadow: true, receiveShadow: true, brightness: 0.1 }), menhirMeshB = T.makeInstances(menhirGeoB, menhirMat, menhirsB, { castShadow: true, receiveShadow: true, brightness: 0.1 });
    // (the piles on the tor's hill throw no shadow of their own into the shadow map: the moon stands behind the crown at the angle of the
    // hillside, so every pile's shadow would lie down the whole slope toward the brook as a straight dark band along the miners' path; they
    // shade their own feet in their material)
    // (the tor's piles are of the middle loaf, 96 faces)
    const hillSlabMesh = T.makeInstances(slabMid, rockMat, hillSlabs, { receiveShadow: true, brightness: 0.14 });
    // (the skirts' boulders: the cobble of 48 faces for those over 0.7 m, the one of 24 for the lesser; the dry-stone walls'
    // lengths, every one of which throws its shadow)
    { if (skirtStones.length) scene.add(T.makeInstances(cobbleGeo, rockMat, skirtStones, { receiveShadow: true, brightness: 0.14 }).object);
      if (skirtSmall.length) scene.add(T.makeInstances(cobbleFar, rockMat, skirtSmall, { receiveShadow: true, brightness: 0.14 }).object);
      for (let k = 0; k < 2; k++) if (wallNear[k].length) scene.add(T.makeInstances(wallGeo[k], wallMat, wallNear[k], { castShadow: true, receiveShadow: true, brightness: 0.1 }).object);
      scene.userData.granite = { skirt: skirtStones.length + skirtSmall.length, wall: wallNear[0].length + wallNear[1].length, piles: hillSlabs.length + farSlabs.length + slabs.length, boulders: boulders.length + midBoulders.length + smallBoulders.length }; }
    scene.add(slabMesh.object, hillSlabMesh.object, boulderMesh.object, midBoulderMesh.object, farSlabMesh.object, menhirMesh.object, menhirMeshB.object);
    await ctx.yield();
    // a shade on the ground under every set stone, hut ring, wall length, peat bank, rick and pony (shadeLay: the small as the
    // kit lays them, the broad cut small; both sheets through the one check)
    await shadeLay('standing things', standing, sunDir);
    await ctx.yield();
    // (and under every pile's foot and the greater boulders of the skirts and the clitter, wherever they lie)
    await shadeLay('granite', pileShade, sunDir);
    await ctx.yield();
    // LOW MIST, in soft sheets that stand where they are laid. The close set lies over the garden's beds; the wide set lies in the
    // park under its wall and its oaks (cold air pools on the lawn), in the brook's valley and over the peat cuttings (thin, a
    // metre over the ground). NO SHEET LIES NEAR THE WAY: the kit thins a card of mist that comes within 1.3 times its own size
    // of the eye, so each set is laid, by place, MIST_OFF times its greatest size and 1.5 m from the way's middle (the
    // drive's, the walk's, the old way's): one that would lie nearer is left out after its draws, and the kit's guard has
    // nothing to do. The garden's lie to either hand of the middle walk, 14.5 m and more from it; the park's 35.5 m and
    // more from the drive.
    const rMs = fk.mist, mistA = [], mistB = [], mistCol = new THREE.Color(H.fogLit).multiplyScalar(H.moon ? 0.5 : 0.8);
    const MIST_OFF = 1.3, MIST = { close: [6, 10], wide: [16, 26], hollow: [26, 40], meadow: [9, 12] }, mistBar = (size) => MIST_OFF * size[1] + 1.5;
    // (a card is laid only where the whole line, in space, is farther from it than the reach of the kit's near guard for the
    // set's largest card and 1.5 m more: the lane's own measure of the line and the entry axis)
    const mistClear = (x, y, z, size) => laneDist(x, z, 0, y, y, 90) >= mistBar(size);
    for (let i = 0; i < 4; i++) mistA.push([rMs.sign() * rMs.range(mistBar(MIST.close), 18), rMs.range(0.4, 0.9), lerp(zg0 - 4, zg1 + 6, (i + rMs()) / 4)]);
    const mistLay = (x, y, z) => { if (mistClear(x, y, z, MIST.wide)) mistB.push([x, y, z]); };
    for (let i = 0; i < 8; i++) mistB.push([(i % 2 ? 1 : -1) * rMs.range(mistBar(MIST.wide), 56), rMs.range(0.5, 1.0), lerp(24, ALLEY.z0, (i + rMs()) / 8)]);
    for (let i = 0; i < 9; i++) { const q = rivAt(lerp(-110, 110, (i + rMs()) / 9)), off = rMs.range(-9, 9), hy = rMs.range(0.6, 1.8); mistLay(q[0] + P.m[0] * off, RIVER_Y + hy, q[1] + P.m[1] * off); }
    for (const q of peatAt) mistLay(q[0] + rMs.range(-5, 5), q[1] + rMs.range(0.3, 0.8), q[2] + rMs.range(-5, 5));
    // (the mire's mists are dealt by a stream of their own: the peat cuttings that happen to stand move none of them)
    // THE MIRE'S MISTS ARE OF THE FOG'S OWN BODY: the places drawn here for the mire's fourteen, and below for the twelve over the
    // pools, are handed to the sea's maker as LOW DRIFTS (mireDrifts: x, z on the plan and the height drawn), lying mounds of
    // the one fog; no puff of the kit's lies on the mire. Each lies on a pool, 9 to 60 m from the wand path (of four places
    // drawn for each, the first that lies in a pool).
    const rMm = fk.miremist, mireDrifts = [];
    for (let i = 0; i < 14; i++) { const c = []; for (let k = 0; k < 4; k++) c.push(mireXZ(lerp(10, wandLen - 40, (i + rMm()) / 14), rMm.sign() * rMm.range(9, 60)));
      const hy = rMm.range(0.5, 1.1), q = c.find((p) => zoneAt(P, p[0], p[1], ZONE).pool > 0.4) || c[0]; mireDrifts.push([q[0], q[1], hy]); }
    // A PALE MIST LIES IN THE HOLLOW BEFORE THE HILL: sixteen broad low sheets are drawn along the brook's valley on the tor's side
    // of the water, 4 to 52 m up from it, each lying 0.8 to 2 m over the ground; none lies within its own reach of the
    // line (mistClear, mistBar: the kit's near guard's reach for the largest sheet and 1.5 m), so the mist lies in the hollow to either
    // hand of the way up, under the hill and its piles.
    const mistH = [], rHo = fk.hollow;
    for (let i = 0; i < 16; i++) { const t = lerp(-150, 150, (i + rHo()) / 16), off = rHo.range(4, 52), hy = rHo.range(0.8, 2.0), q = rivAt(t), x = q[0] + P.m[0] * off, z = q[1] + P.m[1] * off;
      const y = Math.max(RIVER_Y, groundY(x, z)) + hy; if (mistClear(x, y, z, MIST.hollow)) mistH.push([x, y, z]); }
    // LOW DRIFTS OVER THE POOLS: twelve more, 14 to 44 m to either hand of the wand path (of four places drawn for each, the first
    // that lies in a pool; where none does the drift is left out), each 0.8 to 1.1 m high, lying on the water
    const rSe = fk.seamist, seaMist = { pools: 0, left: 0 };
    for (let i = 0; i < 12; i++) { const c = []; for (let k = 0; k < 4; k++) c.push(mireXZ(lerp(20, wandLen - 60, (i + rSe()) / 12), rSe.sign() * rSe.range(14, 44)));
      const hy = rSe.range(0.1, 0.4), q = c.find((p2) => zoneAt(P, p2[0], p2[1], ZONE).pool > 0.4);
      if (q) { mireDrifts.push([q[0], q[1], 0.7 + hy]); seaMist.pools++; } else seaMist.left++; }
    scene.userData.seaMist = seaMist;
    // LOW SILVER MIST ON THE WATER MEADOW: broad low sheets beyond the stone rows on either hand, 17 to 34 m from the way (by
    // the same rule), over the meadow and about the hut circles. Each stands where it is laid. (The small sheets at the
    // rows' feet are struck: they lay within their own size of the way.)
    const rRm = fk.rowmist, mistMeadow = [];
    for (let i = 0; i < 14; i++) { const q = beside(lerp(AT.knoll - 30, AT.rows1 + 4, (i + rRm()) / 14), (i % 2 ? 1 : -1) * rRm.range(mistBar(MIST.meadow), 34)), hy = rRm.range(0.4, 0.9), y = groundY(q[0], q[1]) + hy; if (mistClear(q[0], y, q[1], MIST.meadow)) mistMeadow.push([q[0], y, q[1]]); }
    // (round 11, A1: the meadow's sheets are half as dense again under a moon, 0.26 for 0.16: low mist is seen between the rows' stones)
    const mistMead = fx.makeMist({ rng: fk.rowmistB, positions: mistMeadow, size: MIST.meadow, color: new THREE.Color(H.fogLit).multiplyScalar(H.moon ? 0.6 : 0.85), opacity: H.moon ? 0.26 : 0.16, flatten: 0.16, softness: 0.9, floorFade: 1 });
    scene.add(mistMead.object); updaters.push((dt, t, cam) => { mistMead.update?.(dt, t, cam); });
    scene.userData.rowMist = { feet: 0, meadow: mistMeadow.length };
    scene.userData.mistCards = { off: MIST_OFF, sets: MIST };
    const mistHollow = mistH.length ? fx.makeMist({ rng: rHo, positions: mistH, size: MIST.hollow, color: new THREE.Color(H.fogLit).multiplyScalar(H.moon ? 0.55 : 0.9), opacity: 0.17, flatten: 0.12, softness: 0.9, floorFade: 1 }) : null;
    if (mistHollow) { scene.add(mistHollow.object); updaters.push((dt, t, cam) => mistHollow.update?.(dt, t, cam)); }
    const mistClose = fx.makeMist({ rng: fk.mistclose, positions: mistA, size: MIST.close, color: mistCol, opacity: 0.2, flatten: 0.3, softness: 0.9, floorFade: 1 });
    const mistWide = fx.makeMist({ rng: fk.mistwide, positions: mistB, size: MIST.wide, color: mistCol, opacity: 0.17, flatten: 0.14, softness: 0.9, floorFade: 1 });
    // (every card against the whole line in space, by the lane's own measure: each set's number, its least distance, and that
    // least over the reach of the kit's near guard for the set's largest card: over 1, the guard has nothing to do)
    { const least = {}; for (const [k, list] of [['close', mistA], ['wide', mistB], ['hollow', mistH], ['meadow', mistMeadow]]) { let dm = 1e9; for (const p of list) dm = Math.min(dm, laneDist(p[0], p[2], 0, p[1], p[1], 90)); least[k] = [list.length, dm, dm / (MIST_OFF * MIST[k][1])]; }
      scene.userData.mistCards.least = least; }
    scene.add(mistClose.object, mistWide.object); updaters.push((dt, t, cam) => { mistClose.update?.(dt, t, cam); mistWide.update?.(dt, t, cam); });
    await ctx.yield();
    // ---- everything built, as one mesh; then what grows: moor grass and the mire's sedge (one carpet that takes the ground's colour),
    // russet bracken, heather, rushes by the water, cotton grass on the mire
    // (in pieces, one for each 200 m square of the plan: the hall is not drawn from the mire, nor the mine into the park's shadow map)
    const builtGeo = B.toGeometry();
    await ctx.yield();
    for (const g of await cutByPlace(builtGeo, 200)) { const built = new THREE.Mesh(g, mats.facades); built.castShadow = true; built.receiveShadow = true; built.name = 'built'; scene.add(built); }
    await ctx.yield();
    const groundCol = (x, z, y) => groundRGB(x, z, y, 1, [0, 0, 0]);
    const zq = {};
    // (THE GRASS: tufts of moor grass over the open moor and the mire's sedge, the kit's ground cover (spread evenly to 30 m either
    // side of the line: the kit's own call, said at the head). NONE IN THE PARK, where the lawn is mown; none on the old way's
    // trodden strip nor on the duckboards; none on the mine's yard, whose spoil is bare.)
    // (OUTSIDE THE PARK'S WALL THE MOOR BEGINS AT ONCE: the park's mask fades over 46 m from its plan's rectangle; the tufts,
    // tussocks and stones grow on all the ground outside the wall, the gate's end and the two sides alike.)
    // THE GRASS LAW: ground cover whose top stays a metre and more under the eye is the floor's dress and is held to COVER_M of
    // clear air from the line (the tufts, the tussocks, the near stones, the cotton grass); what stands higher keeps the lane.
    const outGate = (x, z) => z < GATE_Z - 0.6 || Math.abs(x) > 64.6;
    const COVER_M = 1.0, coverOk = (kind, x, z, r, y0, y1) => { const d = laneDist(x, z, r, y0, y1, 5); if (d < COVER_M) { laneLeft[kind] = (laneLeft[kind] || 0) + 1; return false; } laneNote(kind, d); return true; };
    // (a hand-back before the kit's call: what the kit's grass maker does before its own first hand-back is then a step of the kit's alone)
    await ctx.yield();
    const grass = await flora.makeGrassAsync({ rng: fk.grass, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(12200 * detail * (0.85 + 0.15 * densC)), radius: 30, bias: 1.25, chunks: 8, fade: [56, 80],
      width: [0.7, 2 * GRASS_R], height: [0.35, GRASS_H - 0.03], groundColor: groundCol, rootGain: 1.2, flowers: 0, tint: 0.12,
      density: (x, z, lat) => {
        // (the grass law: a tuft's spread and height are measured against the line)
        if (lat < LANE_M + GRASS_R + 0.3) { const g = groundY(x, z); if (!coverOk('grass tuft', x, z, GRASS_R, g, g + GRASS_H)) return 0; }
        const zn = zoneAt(P, x, z, zq); return zn.way > 0.4 || zn.wand > 0.4 ? 0 : zn.gravel > 0.04 ? 0 : (zn.park > 0.5 && !outGate(x, z)) ? 0 : zn.isle > 0.2 ? 0 : zn.pool > 0.45 ? 0 : zn.cut > 0.5 ? 0.1 : zn.river < 3 ? 0 : zn.mire > 0.5 ? 1 : 0.8; },
      materialOptions: { ambient: 1.25, leafAmbient: 1.25 } }, ctx.yield);
    scene.add(grass.object); updaters.push((dt, t, cam) => grass.update(dt, t, cam));
    await ctx.yield();
    // (where each of the kit's plants grows is told to the kit in metres flown between places of the plan: the gate, the mire's
    // shore, the yard's apron; a count that grows with the visit's density stops growing at density 1)
    const uMoor0 = (S.gate + 2) / L, uMoor1 = S.mire / L, uMire0 = (S.mire - 30) / L, uShore = (L - APRON_M) / L;
    const moorOnly = (x, z) => { const zn = zoneAt(P, x, z, zq); return (zn.park > 0.05 && !outGate(x, z)) || zn.mire > 0.1 || zn.river < 4 || zn.way > 0.3 ? 0 : 1; };
    // (WHAT GROWS GIVES THE COLOUR: bracken stands where the ground's first field is high and heather where it is low, the same
    // two fields that tint the ground under them; each within 40 m of the line, as plants with height)
    const brackenPatch = (x, z) => smoothstep(0.42, 0.6, P.noise.fbm2(x * 0.012 + 40, z * 0.012 - 9, 3) * 0.5 + 0.5);
    const heatherPatch = (x, z) => smoothstep(0.45, 0.7, 1 - (P.noise.fbm2(x * 0.012 + 40, z * 0.012 - 9, 3) * 0.5 + 0.5)) * smoothstep(0.3, 0.6, P.noise.fbm2(x * 0.021 - 17, z * 0.021 + 33, 2) * 0.5 + 0.5);
    // TUSSOCKS: the moor's and the mire's ground has form close under the eye. Each is a shock of old grass blades over a dark foot,
    // of the ground's own colour where it stands; they lie within 26 m of the old way from the gate to the yard's apron (thicker on
    // the mire, where they are the hummocks between the pools), none on the way's trodden strip or the boards, each held to the grass law. They grow where water stands: on the flats and
    // the mire, thinning out as the ground steepens and none where it falls more than about 1 in 4 (the tor's slopes keep their
    // clitter, heather and grass: a band of mounds beside the path would stand on the hillside as a stripe)
    // (one tussock: a low dark foot and, standing out of it, a shock of TB pointed blades that lean outward, short ones within and
    // long ones without, dark at the root and pale at the tip: 28 triangles, seen from both sides)
    const rTu = fk.tussock, tuN = Math.round(1060 * detail * densC), TS = 6, TB = 16, tuPos = [], tuCol = [], tuIdx = [];
    for (let i = 0; i < TS; i++) { const a = i / TS * 6.2832; tuPos.push(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); tuCol.push(0.3, 0.3, 0.3); }
    tuPos.push(0, 0.3, 0); tuCol.push(0.55, 0.55, 0.55);
    for (let i = 0; i < TS; i++) tuIdx.push(i, TS, (i + 1) % TS);
    for (let b = 0; b < TB; b++) {
      const a = b * 2.39996, ring = (b % 3) / 2, r0 = 0.12 + 0.36 * ring, r1 = r0 + 0.28 + 0.34 * ring + 0.1 * Math.sin(b * 1.7), h = 0.98 - 0.36 * ring + 0.1 * Math.cos(b * 2.9), wd = 0.065 + 0.03 * ring;
      const c = Math.cos(a), sn = Math.sin(a), v0 = tuPos.length / 3, k = 1.0 + 0.3 * Math.sin(b * 0.9);
      tuPos.push(c * r0 - sn * wd, 0.08, sn * r0 + c * wd, c * r0 + sn * wd, 0.08, sn * r0 - c * wd, c * r1, h, sn * r1);
      tuCol.push(0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 1.25 * k, 1.25 * k, 1.2 * k); tuIdx.push(v0, v0 + 1, v0 + 2);
    }
    const tuGeo = new THREE.BufferGeometry(); tuGeo.setAttribute('position', new THREE.Float32BufferAttribute(tuPos, 3)); tuGeo.setAttribute('color', new THREE.Float32BufferAttribute(tuCol, 3)); tuGeo.setIndex(tuIdx); tuGeo.computeVertexNormals();
    // (the blades are lit as the ground is: every normal is turned most of the way up, so a blade is not black when edge-on to the moon)
    { const nA = tuGeo.attributes.normal; for (let i = 0; i < nA.count; i++) { const nx = nA.getX(i) * 0.45, nz = nA.getZ(i) * 0.45, ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)); nA.setXYZ(i, nx, ny, nz); } }
    const tuMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    // (a blade is lit alike on both its faces: the turn three gives the normal of a back face is turned back again)
    tuMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal *= faceDirection;\n#endif'); };
    tuMat.customProgramCacheKey = () => 'moor-tussock-1';
    lampsOn(tuMat, 'tussock', { soft: 0.8, k: 1.0 });
    const MOSS = 0, nBed = Math.round(14 * densC), BED_N = 24, tussocks = new THREE.InstancedMesh(tuGeo, tuMat, tuN + MOSS + nBed * BED_N), tuC = new THREE.Color(), tuQ = [0, 0];
    // (mounds: every tussock's foot, its place and radius, kept for the fox, whose beat goes round them)
    await ctx.yield();
    let tuK = 0; const mounds = [];
    for (let i = 0; i < tuN * 3 && tuK < tuN; i++) {
      const s = rTu.range(2, AT.I - APRON_M), lat = rTu.sign() * (1.6 + 24.6 * Math.pow(rTu(), 1.5)), sz = rTu.range(0.45, 1.25), yaw = rTu.range(0, 6.28), tone = rTu.range(0.8, 1.15), sy = rTu.range(0.5, 0.8), sx = rTu.range(0.8, 1.2), keep = rTu();
      beside(s, lat, tuQ);
      const zn = zoneAt(P, tuQ[0], tuQ[1], zq);
      if ((zn.park > 0.1 && !outGate(tuQ[0], tuQ[1])) || zn.river < 3.5 || zn.pool > 0.3 || zn.cut > 0.2 || zn.way > 0.3 || zn.wand > 0.3 || (zn.mire < 0.5 && i % 3 === 0)) continue;
      const steep = Math.hypot(land(tuQ[0] + 2, tuQ[1]) - land(tuQ[0] - 2, tuQ[1]), land(tuQ[0], tuQ[1] + 2) - land(tuQ[0], tuQ[1] - 2)) / 4;
      if (keep < smoothstep(0.1, 0.24, steep)) continue;
      const y = groundY(tuQ[0], tuQ[1]);
      if (s > AT.ME - 10 && (roundOff(tuQ[0], tuQ[1]) < 0.8 + sz || subjCircles.some((c) => Math.hypot(tuQ[0] - c[0], tuQ[1] - c[1]) < c[2] + 0.5 * sz))) continue;
      if (!coverOk('tussock', tuQ[0], tuQ[1], sz * 1.45, y, y + sz * 0.9)) continue;
      groundRGB(tuQ[0], tuQ[1], y, 1, gTmp);
      eT.set(0, yaw, 0); qT.setFromEuler(eT); tussocks.setMatrixAt(tuK, mT.compose(vT.set(tuQ[0], y - 0.05, tuQ[1]), qT, sT.set(sz, sz * sy, sz * sx))); mounds.push([tuQ[0], tuQ[1], 0.8 * sz * Math.max(1, sx)]);
      // (old grass is paler than the ground it grows out of: half the ground's colour, half straw)
      tussocks.setColorAt(tuK, tuC.setRGB((gTmp[0] * 0.7 + 0.2) * tone, (gTmp[1] * 0.7 + 0.19) * tone, (gTmp[2] * 0.7 + 0.11) * tone)); tuK++;
      if (i % 100 === 99) await ctx.yield();
    }
    // (THE YEW WALK HAS NO CUSHIONS OF MOSS ON IT: they were the mound laid flat, its blades lying on the gravel and the verge as
    // pale leaf shapes with no thickness. The walk's gravel is bare, the verge is grass.)
    // REED BEDS: the same shock of blades stood tall and narrow (1.2 to 3.2 m), straw-pale, in beds of up to 24 by the pools, 8 to 52 m
    // from the wand path (of three places drawn for a bed, the first at a pool's edge; where none of the three is at one the
    // bed is left out: about 20 beds in a hundred of those asked for stand); they stand still, each is measured against the lane
    // as a tussock is, and a clump that would be rooted in a hard thing is left out (THE HARD THINGS)
    const rBe = fk.reedbeds, reedAt = [];
    for (let b = 0; b < nBed; b++) {
      const c = []; for (let k = 0; k < 3; k++) { const e = lerp(10, wandLen - 50, (b + rBe()) / nBed); c.push(mireXZ(e, rBe.sign() * rBe.range(8, 52))); }
      const rad = rBe.range(4, 8), ang = rBe.range(0, 3.14), cl = [];
      for (let k = 0; k < BED_N; k++) cl.push([rBe.range(-1, 1), rBe.range(-1, 1), rBe.range(0.55, 0.95), rBe.range(2.2, 3.4), rBe.range(0, 6.28), rBe.range(0.75, 1.15)]);
      const q = c.find((p) => { const zn = zoneAt(P, p[0], p[1], zq); return zn.pool > 0.08 && zn.pool < 0.6 && zn.isle < 0.05 && zn.lane < 0.05 && zn.wand < 0.05; });
      hardTally.bedsAsked++;
      if (!q) continue;
      hardTally.bedsStanding++;
      for (const k of cl) {
        const dx = k[0] * rad, dz = k[1] * rad * 0.5, x = q[0] + Math.cos(ang) * dx - Math.sin(ang) * dz, z = q[1] + Math.sin(ang) * dx + Math.cos(ang) * dz, zn = zoneAt(P, x, z, zq);
        if (zn.lane > 0.05 || zn.wand > 0.05 || zn.isle > 0.05 || zn.mire < 0.5 || roundOff(x, z) < 1.2 + k[2] * 1.45) continue;
        const y = standOn(x, z, 0.1), sz = k[2];
        if (!laneOk('reed bed', x, z, sz * 1.45, y, y + sz * k[3] * 1.1, 5)) continue;
        // (no clump is rooted in a hard thing: its foot, 0.8 m at a scale of 1, is asked of the list)
        if (hardIn(x, z, 0.8 * sz)) { hardTally.reedsLeft++; continue; }
        reedAt.push([x, z, 0.8 * sz]); footAt('reed bed', x, z, y - 0.05, 0.05);
        eT.set(0, k[4], 0); qT.setFromEuler(eT); tussocks.setMatrixAt(tuK, mT.compose(vT.set(x, y - 0.05, z), qT, sT.set(sz, sz * k[3], sz)));
        tussocks.setColorAt(tuK, tuC.setRGB(0.42 * k[5], 0.4 * k[5], 0.24 * k[5])); tuK++;
      }
    }
    await ctx.yield();
    // NEAR STONES: moor stone lies in the grass beside the old way from the gate to the yard's apron (the stones cleared from the
    // way lie along it): small faceted stones 0.15 to 0.9 m across (most of them small), spread evenly from 1.8 to 25 m to
    // either hand of the way's middle, each sunk a third into the ground, pale on top where it takes the moon and dark at its
    // foot. None in the park, the brook, a pool, on the way's trodden strip or the boards; on the mire one in three; each is
    // held to the grass law, the hard things and the hounds' rounds after its draws. (A stone is eight faces; they are carried
    // in three meshes, one for each third of the way, each with its own bounds.)
    const stoneBars = [];
    { const rNs = fk.nearstones, nSt = Math.round(1500 * detail * densC), g0 = new THREE.OctahedronGeometry(1, 0), pA = g0.attributes.position, jit = [];
      for (let k = 0; k < 6; k++) jit.push([rNs.range(0.7, 1.25), rNs.range(0.3, 0.55), rNs.range(0.7, 1.25), rNs.range(-0.3, 0.3), rNs.range(-0.3, 0.3)]);
      // (the six corners, each moved its own way: the same corner moves alike in every face it belongs to)
      const key = new Map(); for (let k = 0; k < pA.count; k++) { const id = [pA.getX(k), pA.getY(k), pA.getZ(k)].map((v2) => v2.toFixed(3)).join(','); if (!key.has(id)) key.set(id, jit[key.size % 6]); const j = key.get(id), ay = Math.abs(pA.getY(k)); pA.setXYZ(k, pA.getX(k) * j[0] + ay * j[3], pA.getY(k) * j[1], pA.getZ(k) * j[2] + ay * j[4]); }
      // (each stone is a rounded cobble: its normals are the corners' own directions from its middle, lifted, so that no face is a flat facet)
      const stGeo = g0.index ? g0.toNonIndexed() : g0; { const ps = stGeo.attributes.position, nA = new Float32Array(ps.count * 3), nv = new THREE.Vector3(); for (let k = 0; k < ps.count; k++) { nv.set(ps.getX(k), ps.getY(k) * 1.6 + 0.35, ps.getZ(k)).normalize(); nA[k * 3] = nv.x; nA[k * 3 + 1] = nv.y; nA[k * 3 + 2] = nv.z; } stGeo.setAttribute('normal', new THREE.BufferAttribute(nA, 3)); }
      { const ps = stGeo.attributes.position, cA = new Float32Array(ps.count * 3); for (let k = 0; k < ps.count; k++) { const sh = lerp(0.42, 1.08, smoothstep(-0.5, 0.6, ps.getY(k))); cA[k * 3] = sh; cA[k * 3 + 1] = sh; cA[k * 3 + 2] = sh; } stGeo.setAttribute('color', new THREE.BufferAttribute(cA, 3)); stGeo.deleteAttribute('uv'); }
      const stMat = new THREE.MeshLambertMaterial({ vertexColors: true }), stC = new THREE.Color(), stList = [[], [], []];
      let stK = 0;
      for (let i = 0; i < nSt * 3 && stK < nSt; i++) {
        if (i % 500 === 499) await ctx.yield();
        const s = rNs.range(2, AT.I - APRON_M), lat = rNs.sign() * rNs.range(1.8, 25), sz = 0.075 + 0.38 * Math.pow(rNs(), 2.6), yaw = rNs.range(0, 6.28), tone = rNs.range(0.75, 1.15), tl = rNs.range(-0.3, 0.3), keep = rNs();
        beside(s, lat, tuQ);
        const zn = zoneAt(P, tuQ[0], tuQ[1], zq);
        if ((zn.park > 0.1 && !outGate(tuQ[0], tuQ[1])) || zn.river < 3.5 || zn.pool > 0.3 || zn.way > 0.3 || zn.wand > 0.3 || zn.isle > 0.2 || (zn.mire > 0.5 && keep > 0.34)) continue;
        const y = groundY(tuQ[0], tuQ[1]);
        if (s > AT.ME - 10 && roundOff(tuQ[0], tuQ[1]) < 0.8 + sz) continue;
        if (hardIn(tuQ[0], tuQ[1], sz) || !coverOk('near stone', tuQ[0], tuQ[1], sz * 1.2, y - sz * 0.3, y + sz * 0.6)) continue;
        eT.set(tl, yaw, tl * 0.5); qT.setFromEuler(eT);
        stList[Math.min(2, Math.floor(s / (AT.I - APRON_M) * 3))].push([new THREE.Matrix4().compose(vT.set(tuQ[0], y + sz * 0.12, tuQ[1]), qT, sT.set(sz, sz, sz)), tone]); stK++;
        // (the stones a fox would have to step over are kept for its beat, which goes round them)
        if (sz > 0.14) stoneBars.push(tuQ[0], tuQ[1], sz * 1.25);
      }
      for (const li of stList) { if (!li.length) continue; const stones = new THREE.InstancedMesh(stGeo, stMat, li.length);
        li.forEach((q, k) => { stones.setMatrixAt(k, q[0]); stones.setColorAt(k, stC.setRGB(0.27 * q[1], 0.262 * q[1], 0.245 * q[1])); });
        stones.instanceMatrix.needsUpdate = true; if (stones.instanceColor) stones.instanceColor.needsUpdate = true;
        stones.receiveShadow = true; stones.computeBoundingSphere(); stones.name = 'near stones'; scene.add(stones); } }
    tussocks.count = tuK; tussocks.instanceMatrix.needsUpdate = true; if (tussocks.instanceColor) tussocks.instanceColor.needsUpdate = true;
    tussocks.receiveShadow = true; tussocks.computeBoundingSphere(); tussocks.name = 'tussocks'; scene.add(tussocks);
    await ctx.yield();
    // bracken in patches near the line (russet fronds among the tussocks), heather clumps, gorse: each sits in a shade of its own on the ground
    // (round 7: THE BRACKEN IS RUST, the dead fern of autumn, and THE HEATHER PURPLE-BROWN; they were straw and grey-lilac)
    const brackenGeo = [0, 1].map(() => flora.fernGeometry({ rng: fk.brackengeo, detail: 0, size: 0.8, fronds: 8, leaf: '#5e5236', leafLight: '#7d7048', leafDark: '#383020' }));
    const bracken = flora.makeFerns({ rng: fk.bracken, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(270 * detail * densC), radius: 40, corridor: 2, uRange: [uMoor0, uMoor1], chunks: 3, scale: [0.7, 1.3],
      variants: brackenGeo, density: (x, z) => moorOnly(x, z) * brackenPatch(x, z), tint: 0.2, hue: 0.015,
      materialOptions: { fade: [60, 85], detail: 0, ambient: 1.2, leafAmbient: 1.2, wrap: 0.8, backlight: 0.45, backlightTint: '#a89a6c' } });
    scene.add(bracken.object); updaters.push((dt, t, cam) => bracken.update(dt, t, cam));
    await ctx.yield();
    const heatherGeo = [0, 1].map(() => flora.bushGeometry({ rng: fk.heathergeo, detail: 0, size: 1.5, flowers: 0.6, flowerColor: '#7c5c6c', leaf: '#5a4a46', leafLight: '#7a625c', leafDark: '#30282a', bark: '#3a2c28' }));
    await ctx.yield();
    const heather = flora.makeBushes({ rng: fk.heather, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(125 * detail * densC), radius: 40, corridor: 1.8, spacing: 1.1, uRange: [uMoor0, uMoor1], scale: [0.35, 0.75],
      variants: heatherGeo, materialOptions: { ambient: 1.6, leafAmbient: 1.6 },
      density: (x, z) => moorOnly(x, z) * (1 - 0.85 * brackenPatch(x, z)) * (0.22 + 0.78 * heatherPatch(x, z)), groundShadow: { sunDir, strength: sheetK(0.55) } });
    // (POLISH 1, STAGE C3 MENDING 1, H1: THE HEATHER'S SHADED SIDE HAS ITS OWN COLOUR. The kit's leaf is so dark (its leaf a twelfth,
    // its dark leaf a thirtieth of white) that what the hour's fill drew from it lay under the post's toe: the side of a bush
    // the light does not reach, and by day the whole bush, was a black cut-out. The cure as the yew's (M5), a floor on the leaf,
    // by ONE LAW FOR EVERY HOUR and for every bush of this material (live's heather and the clumps' alike): no part of a
    // bush gives back less than HEATH.floor of what the hour's fill lays on a leaf that looks sideways (half the sky's
    // fill, half the ground's: the hemisphere light's own figure there), times the hour's strength of it. What it lacks
    // of that is laid on (HEATH.k of it: its own leaf-pattern still shows), IN THE LEAF'S OWN HUE under the fill's, drawn
    // toward its grey: at night HEATH.mute of the way, in the moon's own tint, as the ground's shade is (uMoorDull); at the
    // other hours HEATH.muteDay of the way to plain grey (at the picture's toe the post draws a small hue large). A leaf
    // the light reaches gives back more than the floor and is not touched: THE LIT TOPS ARE WHAT THEY WERE. THE DARK HEART: the
    // floor is less on a face that looks down (HEATH.side at straight down), on stems (HEATH.stem), deep in the bush where
    // the wind moves it least (HEATH.heart, by the kit's own sway weight) and on the darker leaf (HEATH.own). At golden hour
    // and at dawn the fill is weak and the floor lies under the toe: the bushes there stay as dark as the ground they stand
    // on. Nothing is read of the clock, a seed or the metres flown; nothing is made or switched in update. OF THE EYE ONE
    // THING IS READ, by the engine and not by a line of this hook (LAST STAGE MENDING 2: said truly): the leaf is two-sided
    // and the engine turns its normal to the side that faces the eye, so `hUp` below is of the side seen and the floor is
    // 0.9 to 1.0 of itself (HEATH.side) by WHICH SIDE OF A LEAF IS SEEN: 1.0 on a side that looks straight up, 0.9 on
    // the same leaf seen from below, 0.95 either way on an upright leaf. That is a shading by the direction from a thing
    // to the eye, and so it can change as the eye passes a bush. THE SHADER IS AS IT WAS.)
    { const HEATH = { floor: 0.100, side: 0.9, stem: 0.88, heart: 0.9, own: 0.15, k: 0.92, mute: 0.93, muteDay: 0.85 }, hm = heather.material, prev = hm.onBeforeCompile, prevKey = hm.customProgramCacheKey;
      const HA = 'reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);', HC = '#include <common>', hLum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const hFill = new THREE.Color(H.ambient), hSide = 0.5 * (hLum(hFill) + hLum(new THREE.Color(H.groundLight))) * H.ambientK; hFill.multiplyScalar(1 / hLum(hFill));
      const heathU = { uHeathFloor: { value: new THREE.Vector4(HEATH.floor * hSide, HEATH.side, HEATH.stem, HEATH.k) }, uHeathFill: { value: hFill }, uHeathForm: { value: new THREE.Vector2(HEATH.heart, HEATH.own) },
        uHeathDull: { value: H.dull ? new THREE.Vector4(moorDull.x, moorDull.y, moorDull.z, HEATH.mute) : new THREE.Vector4(1, 1, 1, HEATH.muteDay) } };
      hm.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(hm, sh, r);
        const f = sh.fragmentShader;
        if (!f.includes(HA) || !f.includes(HC)) { console.warn('moor-under-the-fog-bank: the heather\'s floor finds no place in the kit\'s shader; the heather is the kit\'s alone'); return; }
        Object.assign(sh.uniforms, heathU);
        sh.fragmentShader = f.replace(HC, HC + '\nuniform vec4 uHeathFloor, uHeathDull; uniform vec3 uHeathFill; uniform vec2 uHeathForm;').replace(HA, HA + `
        { const vec3 hLum = vec3(.2126, .7152, .0722);
          vec3 hOwn = diffuseColor.rgb * uHeathFill; float hD = dot(diffuseColor.rgb, hLum);
          hOwn = mix(hOwn / max(dot(hOwn, hLum), 1e-3), uHeathDull.rgb, uHeathDull.w);
          float hUp = dot(normal, normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz));
          float hF = uHeathFloor.x * mix(uHeathFloor.y, 1., .5 + .5 * hUp) * mix(uHeathFloor.z, 1., fLeaf) * mix(uHeathForm.x, 1., vFlora.w) * (1. - uHeathForm.y * (1. - saturate(hD / .08)));
          reflectedLight.indirectDiffuse += hOwn * (uHeathFloor.w * max(0., hF - dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance, hLum))); }`);
      };
      hm.customProgramCacheKey = () => (prevKey ? prevKey.call(hm) : '') + '|moor-heath-1'; }
    scene.add(heather.object); await shadeCheck('heather', heather.shadow); updaters.push((dt, t, cam) => heather.update(dt, t, cam));
    await ctx.yield();
    const gorseGeo = [0, 1].map(() => flora.bushGeometry({ rng: fk.gorsegeo, detail: 0, size: 1.6, flowers: 0.7, flowerColor: '#d8c048', leaf: '#3c4a30', leafLight: '#5e6a3c', leafDark: '#1e2618', bark: '#2a2a20' }));
    await ctx.yield();
    const gorse = flora.makeBushes({ rng: fk.gorse, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(46 * detail * densC), radius: 34, corridor: 4.5, spacing: 1.4, uRange: [uMoor0, uMire0], scale: [0.7, 1.35],
      variants: gorseGeo, materialOptions: { ambient: 1.7, leafAmbient: 1.7 },
      density: (x, z) => moorOnly(x, z) * smoothstep(0.45, 0.62, P.noise.fbm2(x * 0.017 - 60, z * 0.017 + 21, 2) * 0.5 + 0.5), groundShadow: { sunDir, strength: sheetK(0.6) } });
    scene.add(gorse.object); await shadeCheck('gorse', gorse.shadow); updaters.push((dt, t, cam) => gorse.update(dt, t, cam));
    // BRIGHT GREEN QUAKING PATCHES: lawns of bog moss on the mire's wet ground to either hand of the wand path (4.5 to 30 m from
    // it, 2.2 to 5.5 m across), where the ground is neither pool nor firm island: vivid green where the moon lies on their
    // wet. Each is laid on the drawn ground as a soft round of light of that green (the kit's ground glow: one sheet,
    // through the same check as the shades). Each patch's draws first, then the test.
    { const rQk = fk.quake, pts = [];
      for (let i = 0; i < 46; i++) { const s = lerp(8, wandLen - 30, (i + rQk()) / 46), lat = rQk.sign() * rQk.range(4.5, 30), r = rQk.range(2.2, 5.5), q = mireXZ(s, lat), zn = zoneAt(P, q[0], q[1], ZONE);
        if (zn.mire > 0.6 && zn.pool < 0.25 && zn.isle < 0.05 && zn.wand < 0.05) pts.push({ x: q[0], z: q[1], r }); }
      const moss = flora.makeGroundGlow({ points: pts, heightAt: groundY, color: '#6fae3a', radius: 1, intensity: 0.1, lift: 0.06, cell: 3 });
      scene.add(moss.object); await shadeCheck('quaking moss', moss); scene.userData.quake = pts.length; }
    await ctx.yield();
    // wind-bent thorns by the old way, on the moor and down the hill's far side to the mire's shore: 9 to 40 m from the way on
    // either hand, each held to the lane by its own reach
    const rTh = fk.thorns, thornN = Math.round(10 * dens), windYaw = Math.atan2(-0.45, -0.8), thornReach = Math.max(reachOf(thornGeos[0]), reachOf(thornGeos[1]));
    for (let i = 0; i < thornN; i++) {
      const s = lerp(AT.sunk + 30, AT.ME - 30, (i + rTh()) / thornN), side = rTh.sign() * rTh.range(9, 40), sz = rTh.range(0.6, 1.0), rot = windYaw + rTh.range(-0.3, 0.3), v = rTh.int(0, 1);
      beside(s, side, tuQ);
      if (moorOnly(tuQ[0], tuQ[1]) && Math.hypot(tuQ[0] - F.x, tuQ[1] - F.z) > 24 && laneOk('thorn', tuQ[0], tuQ[1], thornReach * sz, groundY(tuQ[0], tuQ[1]), groundY(tuQ[0], tuQ[1]) + 5.5 * sz) && hardOk('thorn', tuQ[0], tuQ[1], HARD.thorn * sz)) thornPts.push({ x: tuQ[0], y: groundY(tuQ[0], tuQ[1]), z: tuQ[1], s: sz, rot, v, d: Math.abs(side), u: 0 });
    }
    // TWO THORN TOPS STAND OUT OF THE FOG FAR OFF (the lead's ruling on the fog): two old thorns rooted in the low ground under the
    // bank, each 40 m and more inside its shore and 70 m and more from the way, on ground that the bank covers, tall enough
    // that its crown stands 1.5 to 3 m over the bank's top with its swell: by the land and the bank alone. Fourteen places are
    // dealt in the fog's own oval, each with all its draws; the first two that the land allows stand.
    { const rFt = fk.fogthorns, bankTop = MIRE_Y + SEA.top + 1.1 * (SEA.heave[1] + SEA.heave[3]), fogThorns = [];
      for (let i = 0; i < 14; i++) { const a = rFt.range(0, 6.2832), rr = Math.sqrt(rFt()) * 0.8, over = rFt.range(1.5, 3), rot = windYaw + rFt.range(-0.3, 0.3), v = rFt.int(0, 1);
        const e = Math.cos(a) * rr * P.fogA, n = Math.sin(a) * rr * P.fogB, x = P.fogC[0] + e * P.w[0] + n * P.wR[0], z = P.fogC[1] + e * P.w[1] + n * P.wR[1], g = groundY(x, z), zn = zoneAt(P, x, z, ZONE);
        if (fogThorns.length >= 2 || P.seaDepth(x, z) < 40 || P.wayOf(x, z, WQ).d < 70 || g > bankTop - 3.5 || zn.pool > 0.3 || zn.tarn > 0.02 || roundOff(x, z) < 6 || fogThorns.some((t) => Math.hypot(t.x - x, t.z - z) < 50)) continue;
        const sz = (bankTop + over - g) / 5.5; if (!hardOk('thorn', x, z, HARD.thorn * sz)) continue;
        laneNote('thorn', laneDist(x, z, thornReach * sz, g, g + 5.5 * sz)); fogThorns.push({ x, y: g, z, s: sz, rot, v, d: 70, u: 0 }); }
      for (const t of fogThorns) thornPts.push(t); scene.userData.fogThorns = fogThorns.map((t) => [t.x, t.y, t.z, 5.5 * t.s]); }
    const thorns = flora.makeScatter({ rng: fk.thornscatter, points: thornPts, variants: thornGeos, material: barkMat, castShadow: false, tilt: 0, stretch: 0, tint: 0.1, groundShadow: { heightAt: groundY, lift: 0.08, sunDir, strength: sheetK(0.6), size: 1.6 } });
    scene.add(thorns.object); await shadeCheck('thorns', thorns.shadow);
    // (the bog oaks of the wand path, where the subjects' deal put them; each is measured again by its own reach)
    for (const p of oakPts) laneNote('bog oak', laneDist(p.x, p.z, bogReach * p.s, p.y, p.y + 10.6 * p.s, 30));
    if (oakPts.length) { const bogOaks = flora.makeScatter({ rng: fk.bogoak, points: oakPts, variants: bogGeos, material: barkMat, castShadow: true, tilt: 0, stretch: 0, tint: 0.06, groundShadow: { heightAt: groundY, lift: 0.08, sunDir, strength: sheetK(0.65), size: 1.5 } }); bogOaks.object.name = 'bog oaks'; scene.add(bogOaks.object); await shadeCheck('bog oaks', bogOaks.shadow); }
    await ctx.yield();
    const reedGeo = [0, 1].map(() => flora.reedGeometry({ rng: fk.reedgeo, blades: 6, cattails: 2, leaf: '#5d7a4a', tip: '#b0a878', head: '#3a2a1e' }));
    await ctx.yield();
    // THE TALL BEDS OF THE WAND PATH (the subjects' deal): reeds standing 3 to 4.6 m, thirty clumps of the kit's reed (stems, blades
    // and their dark heads) within a round of 4.2 m, the tallest in its middle; each clump is measured against the lane by its own
    // spread with the wind's sway, and against the hard things and the hounds' rounds, after its draws
    { const rNb = fk.nearreeds, tallGeo = [0, 1].map(() => flora.reedGeometry({ rng: rNb, height: 3.3, blades: 8, cattails: 3, leaf: '#66744a', tip: '#b4aa7a', head: '#3a2a1e' })), pts = [];
      const spread = Math.max(...tallGeo.map((g) => { const ps = g.attributes.position; let r = 0; for (let k = 0; k < ps.count; k++) r = Math.max(r, Math.hypot(ps.getX(k), ps.getZ(k))); return r; })) + 0.3;
      for (const bd of nearBeds) {
        // (a bed 20 m long and 6.4 m through, lying as the deal turned it: 64 clumps within that oval, the tallest along its middle.
        // Where the deal gave more than one bed, all the beds together hold 80 clumps: each is drawn whole and keeps the first
        // of its clumps, in a shorter oval of the same thickness, so that a visit with five beds draws no more reed than one with two.)
        const cl = []; for (let k = 0; k < 64; k++) cl.push([rNb.range(0, 6.2832), Math.sqrt(rNb()), rNb.range(0.95, 1.4), rNb.range(0, 6.28), rNb.int(0, 1)]);
        const cb = Math.cos(bd.yaw), sb = Math.sin(bd.yaw), bedN = Math.min(64, Math.round(80 / nearBeds.length)), bedL = 10 * Math.sqrt(bedN / 64);
        for (const k of cl.slice(0, bedN)) {
          const sz = k[2] * (1.08 - 0.28 * k[1]), lx = Math.cos(k[0]) * k[1] * Math.max(0.5, bedL - spread * sz), lz = Math.sin(k[0]) * k[1] * Math.max(0.4, 3.2 - spread * sz), x = bd.x + lx * cb + lz * sb, z = bd.z - lx * sb + lz * cb, y = standOn(x, z, 0.1);
          if (roundOff(x, z) < 1.2 + spread * sz || !laneOk('tall reed bed', x, z, spread * sz, y, y + 3.6 * sz, 8)) continue;
          if (hardIn(x, z, 0.3)) { hardTally.reedsLeft++; continue; }
          reedAt.push([x, z, 0.3]); pts.push({ x, y: y - 0.1, z, s: sz, rot: k[3], v: k[4], d: 10, u: 0 }); footAt('tall reeds', x, z, y - 0.1, 0.1);
        }
      }
      if (pts.length) { const tall = flora.makeScatter({ rng: rNb, points: pts, variants: tallGeo, wind, map: leafMat.map, tint: 0.12, hue: 0.02, tilt: 0.06, stretch: 0, materialOptions: { ambient: 1.5, leafAmbient: 1.5 } }); tall.object.name = 'tall reeds'; scene.add(tall.object); updaters.push((dt, t, cam) => tall.update?.(dt, t, cam)); } }
    const reeds = flora.makeReeds({ rng: fk.reeds, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(205 * detail * densC), radius: 60, corridor: 3.4, uRange: [(S.river - 90) / L, uShore], scale: [0.5, 0.9],
      variants: reedGeo, density: (x, z) => { const zn = zoneAt(P, x, z, zq); return zn.cut > 0.2 ? 0 : (zn.river > 3 && zn.river < 6.5 && zn.park < 0.05) ? 1 : (zn.pool > 0.12 && zn.pool < 0.5 && zn.lane < 0.2 && zn.wand < 0.2) ? 0.8 : 0; } });
    scene.add(reeds.object); updaters.push((dt, t, cam) => reeds.update(dt, t, cam));
    await ctx.yield();
    // (COTTON GRASS IS GROUND COVER (the grass law): a clump, measured at its largest, keeps COVER_M of clear air from the line.
    // COTTON_R is its spread at the greatest scale with the wind's fullest sway (0.30 + 0.26 m), COTTON_H its height at the
    // greatest scale with the tenth the kit may stretch it upward (0.51 m), and 2 cm more each way because the lane keeps the
    // line as a point every half metre. It grows thick on the firm islands and beside the boards, none on the boards.
    // Every clump that stands is measured again with the scene.)
    const COTTON_R = 0.62, COTTON_H = 0.53;
    const cotton = flora.makeFlowers({ rng: fk.cotton, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(540 * detail * densC), radius: 30, uRange: [uMire0, uShore], colors: ['#f4f6ff', '#e6ecff', '#ffffff'], chunks: 3,
      scale: [0.26, 0.46], sink: 0.0, density: (x, z, lat) => {
        if (lat < 8) { const g = groundY(x, z); if (laneDist(x, z, COTTON_R, g, g + COTTON_H, 4) < COVER_M) { laneLeft['cotton grass'] = (laneLeft['cotton grass'] || 0) + 1; return 0; } }
        const zn = zoneAt(P, x, z, zq); return zn.wand > 0.4 ? 0 : zn.mire > 0.5 && zn.pool < 0.3 && zn.cut < 0.2 ? (0.4 + 0.6 * Math.max(zn.lane, 1 - smoothstep(4, 12, zn.wayD))) : zn.rim > 0.3 ? 0.4 : 0; } });
    for (const p of cotton.points) laneNote('cotton grass', laneDist(p.x, p.z, COTTON_R, p.y, p.y + COTTON_H, 12));
    cotton.object.name = 'cotton grass'; scene.add(cotton.object); updaters.push((dt, t, cam) => cotton.update(dt, t, cam));
    await ctx.yield();
    // THE GARDEN'S BEDS HOLD DIM FLOWERS (dusty grey, cream and rose), standing 0.3 to 0.5 m within
    // the four quarters' box hedges (0.7 m in from each hedge, none in the clipped cone's round at a quarter's middle); each
    // is measured against the lane with the scene
    { const inBed = (x, z) => { const ax = Math.abs(x), az = Math.abs(z - zgc); return ax > 2.6 + 1.3 && ax < gH - 2.4 - 1.3 && az > 2.6 + 1.3 && az < (zg0 - zg1) / 2 - 2.4 - 1.3 && Math.hypot(ax - (2.6 + gH - 2.4) / 2, az - (2.6 + (zg0 - zg1) / 2 - 2.4) / 2) > 3.4; };
      const beds = flora.makeFlowers({ rng: fk.flowers, path, heightAt: groundY, wind, map: leafMat.map, count: Math.round(250 * detail), radius: gH, uRange: [(S.garden - 4) / L, (S.alley + 2) / L], colors: ['#8e8c98', '#989078', '#96848c', '#9a9a9a'], chunks: 1,
        scale: [0.3, 0.5], sink: 0.0, density: (x, z) => (inBed(x, z) ? 1 : 0) });
      for (const p of beds.points) laneNote('garden flower', laneDist(p.x, p.z, 1.2, p.y, p.y + 1.0, 12));
      beds.object.name = 'garden flowers'; scene.add(beds.object); updaters.push((dt, t, cam) => beds.update(dt, t, cam)); }
    await ctx.yield();

    // SHEEP ON THE LAWN (round 8): the park is grazed. Three small groups, 12 to 16 sheep in all, lie and stand on the lawn to
    // either hand of the drive, between the avenue's oaks and the park's wall: each group's middle is drawn in the park's own
    // frame (16 to 46 m from the drive's middle, between the lodge gates and the forecourt), each sheep within 9 m of it, off the
    // gravel and off every hard thing; two in three lie, the rest stand with their heads down to the grass, each turned as it
    // was drawn. Pale wool that takes the moon and the lamps, a dark face. They do not move, and none looks at anyone.
    { const rSh = fk.sheep, nSh = 12 + rSh.int(0, 4), WOOL = '#b4b0a0', FACE = '#2a2826';
      const tint = (g, hex) => { const g2 = g.toNonIndexed(), c = new THREE.Color(hex), n = g2.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g2.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.dispose(); return g2; };
      const join = (list) => { let n = 0; for (const g of list) n += g.attributes.position.count; const p = new Float32Array(n * 3), nr = new Float32Array(n * 3), c = new Float32Array(n * 3); let o = 0;
        for (const g of list) { p.set(g.attributes.position.array, o); nr.set(g.attributes.normal.array, o); c.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; g.dispose(); }
        const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(p, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); out.setAttribute('color', new THREE.BufferAttribute(c, 3)); return own(out); };
      const lying = join([tint(new THREE.SphereGeometry(0.5, 7, 5).scale(0.66, 0.5, 1.04).translate(0, 0.27, 0), WOOL), tint(new THREE.SphereGeometry(0.15, 5, 4).scale(0.85, 0.95, 1.35).translate(0.05, 0.47, 0.6), FACE)]);
      const legs = [[-0.2, -0.32], [0.2, -0.32], [-0.2, 0.34], [0.2, 0.34]].map((q) => tint(new THREE.BoxGeometry(0.09, 0.42, 0.09).translate(q[0], 0.21, q[1]), FACE));
      const standing2 = join([tint(new THREE.SphereGeometry(0.5, 7, 5).scale(0.62, 0.52, 1.0).translate(0, 0.66, 0), WOOL), tint(new THREE.SphereGeometry(0.15, 5, 4).scale(0.85, 0.95, 1.35).translate(0, 0.3, 0.66), FACE), ...legs]);
      const mat = lampsOn(own(new THREE.MeshLambertMaterial({ vertexColors: true })), 'sheep', { soft: 0.7, k: 1.0 });
      const groups = [0, 1, 2].map((k) => [(k === 1 ? -1 : 1) * rSh.range(16, 46), lerp(-22, HALL.zFront + 40, (k + rSh.range(0.2, 0.8)) / 3)]), lieM = [], standM = [], M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), sheepAt = [];
      for (let i = 0; i < nSh; i++) {
        const g = groups[i % 3], a = rSh.range(0, 6.2832), d = 9 * Math.sqrt(rSh()), x = g[0] + Math.cos(a) * d, z = g[1] + Math.sin(a) * d, lie = rSh() < 0.66, yaw = rSh.range(0, 6.2832), sz = rSh.range(0.92, 1.12);
        if (Math.abs(x) < 12 || Math.abs(x) > 60 || zoneAt(P, x, z, ZONE).gravel > 0.02 || !hardOk('sheep', x, z, 0.8)) continue;
        laneNote('sheep', laneDist(x, z, 0.8, 0, 1.3));
        M4.compose(new THREE.Vector3(x, groundY(x, z) - 0.02, z), Q4.setFromAxisAngle(UP, yaw), new THREE.Vector3(sz, sz, sz)); (lie ? lieM : standM).push(M4.clone()); sheepAt.push([x, z, lie ? 0 : 1]);
      }
      for (const [geo, list, name] of [[lying, lieM, 'sheep, lying'], [standing2, standM, 'sheep, standing']]) { if (!list.length) continue; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.name = name; im.computeBoundingSphere(); scene.add(im); }
      scene.userData.sheep = sheepAt; }
    await ctx.yield();
    // ---- THE FOG BANK. THE FOG IS LOW: a level-topped white bank lying over the low wet ground of the mire's basin on the right
    // hand of the old way, where the LAND has it (SEA, at the head of the file; P.seaDepth, its shore on the plan; P.seaRim,
    // its outer bounds). The part builds it (makeFogSea): its top stands SEA.top metres over the mire's level, level but
    // for slow swells; its face rises from the shore over SEA.fringe metres, in folds (the shore's bays and headlands);
    // before its whole core lie a skin and one inner veil. Under the moon its top is white, its face silver toward the
    // moon and blue-grey from it; the heads of the lesser tors and the dead thorns of the wet stand out of it.
    // ITS FOOT CREEPS: a low mist lies out from the shore as far as SEA.foot.reach metres in tongues that roll out and
    // draw back by the world's clock, on the low ground only. ITS TOP IS THE LAND'S: nowhere higher than SEA.foot.level
    // metres over the mire's level and nowhere thicker than SEA.foot.thick metres (footTop, below); where the ground stands
    // higher than that level there is none. (My count measures the clear air between the lens and the foot's mist and the
    // bank's top against the water and the boards on every seed; no rule here reads the line.)
    // ITS SHORE is the land's (the oval in the basin's frame, the lead's bay, the rising ground it keeps off): to the right
    // of the way; 46 m and more from the yard's middle; clear of the old stack on the lode; up the tor's hill as far as
    // the ground lets it. It laps and thins round the foot of what stands in it. ITS FAR SIDE lies on the low ground beyond
    // the basin and ends where the far hills rise through it; its outer bounds are the plan's (P.seaRim) and the drawn
    // land's, over the last 110 m of which it thins to drifts. Nothing of it is shown, hidden, thinned or lowered by where
    // the eye is or where the line goes.
    // THE WAY'S OTHER HAND IS CLEAR AIR: the tarn, the works' pools, the works and the mine's hill stand under the moon, with
    // low drifts on the wet.
    // THE LOW DRIFTS: lying mounds of the same fog on the wet, each at its own place: (a) of three places drawn for each of 30,
    // 18 to 46 m to either hand of the wand path, the first that is open water; (b) the mire's fourteen and the pools' twelve
    // (mireDrifts, above). A drift lies in clear air outside the bank's shore by its own half length, off the yard and off the
    // hounds' ground (by the hounds' own rule nothing lies on a beast's run: roundOff), and its whole body keeps the lane:
    // IT IS MEASURED AS A SAFE UPRIGHT CYLINDER, NOT AS THE MOUND THE PART DRAWS (round 11 says it plainly; "its true oval" was
    // written here before and was not so). driftLeast takes the cylinder that stands on the oval of its two half axes, turned by
    // its yaw, from the ground up to the highest its top can swell, against every metre of the line. The part draws less than
    // that: a mound of two rings of ten inside that oval, whole in the middle and nothing at the rim, so the cylinder holds it
    // all. One that cannot keep the lane by this measure is left out after its draws.
    const rTg = fk.tongues, driftAt = [];
    for (let i = 0; i < 30; i++) {
      const c = []; for (let k = 0; k < 3; k++) c.push(mireXZ(lerp(20, wandLen - 46, (i + rTg()) / 30), rTg.sign() * rTg.range(18, 46)));
      const r = rTg.range(8, 15), yaw = rTg.range(0, 3.14), tp = rTg.range(0.9, 1.5);
      const q = c.find((p) => { const zn = zoneAt(P, p[0], p[1], ZONE); return zn.pool > 0.4 && zn.isle < 0.05; });
      if (q) driftAt.push([q[0], q[1], r, r * 0.62, yaw, tp, 0.55]);
    }
    for (const q of mireDrifts) { const ra = rTg.range(9, 15), yaw = rTg.range(0, 3.14); driftAt.push([q[0], q[1], ra, ra * rTg.range(0.5, 0.7), yaw, 0.5 + q[2], 0.5]); }
    // (the fog's own grid lies in the basin's frame: e metres from the shore's place along the basin's axis, n metres to its right)
    // (driftUp: the highest a drift's swell can stand over its top. The part's domes are joined softly and can stand to 1.23 times
    // their height where four meet, so 1.25 times the heaves' sum is taken: the cylinder's top is never under the mound's.)
    const sw = P.w, swR = P.wR, seaLen = P.dIsl, DRIFT_HEAVE = 0.06, driftUp = 1.25 * DRIFT_HEAVE * (SEA.heave[1] + SEA.heave[3]);
    const toSea = (x, z) => [(x - ME[0]) * sw[0] + (z - ME[1]) * sw[1], (x - ME[0]) * swR[0] + (z - ME[1]) * swR[1]];
    // (a drift's least distance from the lane, by that cylinder: the oval's own axes lie in the fog's frame, turned by its yaw;
    // every metre of the line is taken into the oval's own frame; outside the oval its distance on the plan is taken by the
    // SHORTER half axis, which is never more than the true distance to the oval; over the cylinder's top the height between
    // is added. Both are on the safe side: the figure is never more than the mound's true distance.)
    const driftLeast = (q) => { const ca = Math.cos(q[4]), sa = Math.sin(q[4]), y1 = MIRE_Y + q[5] + driftUp, far = Math.max(q[2], q[3]) + 20, sm = P.samples; let least = 99;
      for (let i = 0; i <= sm.n; i++) { const dx = sm.sx[i] - q[0], dz = sm.sz[i] - q[1]; if (Math.abs(dx) > far || Math.abs(dz) > far) continue;
        const e = dx * sw[0] + dz * sw[1], n = dx * swR[0] + dz * swR[1], rho = Math.hypot((e * ca + n * sa) / q[2], (n * ca - e * sa) / q[3]);
        least = Math.min(least, Math.hypot(rho <= 1 ? 0 : (rho - 1) * Math.min(q[2], q[3]), Math.max(0, sm.sy[i] - y1))); }
      return least; };
    const drifts = [];
    for (const q of driftAt) {
      if (P.seaDepth(q[0], q[1]) > -q[2] || Math.hypot(q[0] - I[0], q[1] - I[1]) < P.ISLE_R + q[2] || roundOff(q[0], q[1]) < q[2] + 1) continue;
      const least = driftLeast(q); if (least < LANE_M) { laneLeft['fog drift'] = (laneLeft['fog drift'] || 0) + 1; continue; } laneNote('fog drift', least);
      const f = toSea(q[0], q[1]); drifts.push([f[0], f[1], q[2], q[3], q[4], q[5], q[6], DRIFT_HEAVE]);
    }
    await ctx.yield();
    // (the grid's span: from 165 m behind the shore's place to the bounds' far end, and their half breadth; its bounds are the
    // plan's oblong and 50 m beyond the drawn land's)
    const seaSpan = [-(SEA.reach[0] * P.mireA - 0.8 * seaLen) - 10, 0.8 * seaLen + SEA.reach[1] * P.mireA + 10, SEA.reach[2] * P.mireB + 10];
    const seaRim = (e, n) => { const x = ME[0] + e * sw[0] + n * swR[0], z = ME[1] + e * sw[1] + n * swR[1]; return Math.min(P.seaRim(x, z), x - bounds[0] + 50, z - bounds[1] + 50, bounds[2] + 50 - x, bounds[3] + 50 - z); };
    const seaGround = (e, n) => { const x = ME[0] + e * sw[0] + n * swR[0], z = ME[1] + e * sw[1] + n * swR[1]; return (x > bounds[0] && z > bounds[1] && x < bounds[2] && z < bounds[3] ? groundY(x, z) : land(x, z)) - MIRE_Y; };
    const seaDepth = (e, n) => P.seaDepth(ME[0] + e * sw[0] + n * swR[0], ME[1] + e * sw[1] + n * swR[1]);
    // (the fog laps and thins round each lesser tor and each dead thorn that stands in it)
    const seaIsles = fogTors.map((q) => { const f = toSea(q[0], q[1]); return [f[0], f[1], q[2], 0.1]; });
    // (THE PLACE'S FIRES ON THE FOG: each reddens the fog that faces it and stands near it, by its own place: at 20 m half of its
    // light, at 60 m a tenth. Far from the works the bank is the moon's white.)
    const seaLamps = worksFires.map((f) => [f[0], f[1] + 2, f[2], 0.005, '#ff5a22', 0.4]);
    // (the swells and the fringe's order are measured from the basin's middle, P.Cm)
    const basinMid = toSea(P.Cm[0], P.Cm[1]);
    // THE FOOT'S TOP, BY THE LAND ALONE: the greatest thickness the low mist may have at a place is what lies between the ground
    // there (or the pools' bed, 0.4 m under the mire's level) and SEA.foot.level metres over the mire's level, and
    // SEA.foot.thick at the most: cold mist pools on the low ground; it lies on the mire and the shore, and not on the
    // hill, the islands' turf above that level, the apron or the yard.
    const fogCell = 7.5 / Math.sqrt(detail);
    const footTop = (e, n) => Math.max(0, Math.min(SEA.foot.thick, SEA.foot.level - Math.max(seaGround(e, n), -0.4)));
    // (POLISH 1, MENDING 1: at dawn the billows are lit by the hour's own light, sunDir, as the ground is; at the other hours
    // by the plan's moon as before, the same value)
    const bank = await makeFogSea(ctx, { origin: ME, axis: sw, y0: MIRE_Y, depth: seaDepth, ground: seaGround, rim: seaRim, span: seaSpan, fine: [seaSpan[0], seaLen + 150, 225], cell: fogCell, cellMax: 40,
      veils: SEA.veils, foot: { ...SEA.foot, cap: footTop }, litK: SEA.litK * (H.bank ?? 1), pale: 0.35, shell: SEA.shell, model: SEA.model,
      top: SEA.top, lift: SEA.lift, cover: SEA.cover, heave: SEA.heave, mid: basinMid, fringe: SEA.fringe, whole: SEA.whole, rimW: 110, islands: seaIsles, drifts, moon: H.dawn ? sunDir : P.M,
      lit: H.fogLit, shade: H.fogShade, mine: [I[0], yEnd, I[1]], mineGlow: new THREE.Color(H.mineGlow).multiplyScalar(0.6), mineFall: 0.0025, lamps: seaLamps });
    scene.userData.fogBank = bank; scene.userData.fogLevel = { top: SEA.top, swell: 1.1 * (SEA.heave[1] + SEA.heave[3]), shell: 1.5 * SEA.shell.heights[SEA.shell.heights.length - 1], foot: SEA.foot.level };
    scene.add(bank.object);
    await ctx.yield();
    // ---- the hound, and (one visit in eight) a second: a ghost drawn in its fire only, round the tarn's shore (neither hound's
    // ground goes on a rock, a hill or a skyline). The fire of both is the part's one pale blue-white (HOUND_FIRE; the second
    // hound's paler, GHOST_FIRE), ALONG THE JAWS AND THE NECK: at the mouth and the eyes, along muzzle, hackles and dewlap, and in
    // short tongues along the neck from the withers to the skull. The back behind the withers, the flanks, the legs and the
    // tail carry none: by a moon the first hound's have the dim edge the ponies have,
    // in the moon's own colour (the same H.light the ponies are handed), and without a moon no edge; the second hound has no edge.
    // THE HOUND IS NO LONGER THAN 2.5 m (the lead's ruling of round 10): P.HOUND_K times the part's make: 2.44 m from its nose
    // to the tip of its tail at rest, 2.49 m at the gallop's longest stretch. THE SECOND HOUND IS OF THE SAME SIZE.
    // (POLISH 1, MENDING 2: THE COAT IS COAL-BLACK UNDER THE NIGHT'S DOUBLED FILL: at night its coat keeps H.coat of its colour, so
    // that it stands no lighter than it did; its fire, eyes, gums, teeth and pads are not touched. Other hours: the part's own.)
    const hound = makeHound(ctx, { rng: fk['hound-flames'], fireMax: BLOOM_T * 2, moon: H.moon ? H.light : null, light: false, coatK: H.coat }); hound.object.scale.setScalar(P.HOUND_K); scene.add(hound.object);
    // (the hound's fire seen across the mire: one glow at its head, of the kind the lanterns and the wisps are and, like theirs,
    // never smaller on the screen than a point of light (two degrees across its whole soft disc, of which the bright middle is a
    // tenth), so that its round is a pale light going over the mire from the tor's shoulder on; it burns always and goes where
    // the hound goes)
    const houndGlow = fx.makeGlow({ rng: fk.houndglow, color: HOUND_FIRE, size: 3.2 * P.HOUND_K, intensity: 2.8, flicker: 0.4, minAngle: 0.035, fogAmount: 0.3 }); scene.add(houndGlow.object);
    await ctx.yield();
    const ghost = rare ? makeHound(ctx, { ghost: true, fire: GHOST_FIRE, rng: fk['ghost-flames'], fireMax: BLOOM_T * 2, moon: H.moon ? H.light : null }) : null;
    // (the rare second hound: a shape of the hound's own size, drawn in its fire only (its jaws and neck burn; the dim moon edge
    // it had over its whole coat is off: round 11, A6, in the part's makeHound), on a round of its own about
    // the tarn (P.ghostAt, laid in the plan), run by the world's clock)
    if (ghost) { ghost.object.scale.setScalar(P.HOUND_K); scene.add(ghost.object); }
    // (the ring's own light on the island, in the fire's colour: it burns steadily)
    // (round 11, A5: THE RING'S RED LIES ON THE WORKS: the ring's own light reaches 120 m, was 46, and is redder and six times as
    // strong: the engine house's walls, the mouth's timbers, the stack's foot and the yard take it, and it is seen from the pass.
    // Its strength goes by the hour's night (0.1 + 0.9 night squared): whole at night, a sixth of it under the day's sky)
    const portalLight = new THREE.PointLight('#ff6f38', 110 * (0.1 + 0.9 * H.night * H.night), 120, 1.5); portalLight.position.set(I[0] - yd[0] * 3, P.yEnd, I[1] - yd[1] * 3); scene.add(portalLight);
    await ctx.yield();

    // ---- small lights: the candle carried past the windows of the hall (shown and hidden in turn), the cottage's window far out on
    // the moor and every lantern (which burn steadily), and the will-o-wisps over the mire
    const candleX0 = -(3.6 + 1.6 + 3.2 * fk.candle.int(0, 1)), candleY = 1.1 + 4.2 * 1.42, candleZ = HALL.zFront + 0.3, COT_K = 1.3;
    // (the candle, the cottage's window and every lantern are one set of glows: the candle shows and hides, the rest burn steadily)
    const lamps = fx.makeGlows({ rng: fk.lampglow, positions: [[candleX0, candleY, candleZ], farAt, ...lanternPts], colors: ['#ffc878', '#ffd070', ...lanternPts.map((q) => q[4] ?? '#ffa850')], sizes: [1, COT_K, ...lanternPts.map((q) => q[3] ?? 0.8)], size: 1.25, intensity: 2.4, core: 0.7, flicker: 0.3, minAngle: 0.008, fogAmount: 0.3 });
    scene.add(lamps.object);

    // (THE CANDLE shows and hides by the world's clock, once in LAMP_PERIOD seconds, begun at a phase of the visit's own: it is
    // carried past the piers between the windows. THE COTTAGE'S WINDOW on the moor burns steadily: its glow is COT_K times
    // the candle's size.)
    // (candlePh: where the candle is on its walk behind the windows when the world's clock stands at nought: a drawn phase)
    const LAMP_PERIOD = 9, lampPh = fk.candle.range(0, 6.2832), candlePh = fk.candle.range(0, 6.2832);
    const rWi = fk.wisps, nWisp = Math.round(12 * dens), wispBase = [];
    // (each wisp hangs over a pool: of four places drawn for it, all drawn before any is tried, the first that lies over open water and
    // keeps the lane and the hounds' rounds with its fullest wander (WISP_WANDER metres each way in the plan, so 1.42 times that at
    // its farthest, and its glow's half metre), or else the first that keeps them; a wisp with no such place is not lit)
    const WISP_WANDER = 3.2, WISP_BOB = 0.45, wispR = WISP_WANDER * Math.SQRT2 + 0.5;
    for (let i = 0; i < nWisp; i++) { const c = []; for (let k = 0; k < 4; k++) c.push(mireXZ(lerp(30, wandLen - 50, (i + rWi()) / nWisp), rWi.sign() * rWi.range(11, 36)));
      const hy = rWi.range(0.7, 1.5), ph = rWi.range(0, 6.28), sp = rWi.range(0.6, 1.3), free = c.filter((p) => roundOff(p[0], p[1]) > wispR + 1 && laneDist(p[0], p[1], wispR, MIRE_Y + hy - WISP_BOB - 0.5, MIRE_Y + hy + WISP_BOB + 0.5) >= LANE_M);
      const q = free.find((p) => zoneAt(P, p[0], p[1], ZONE).pool > 0.4) || free[0];
      if (q && laneOk('wisp', q[0], q[1], wispR, MIRE_Y + hy - WISP_BOB - 0.5, MIRE_Y + hy + WISP_BOB + 0.5)) wispBase.push([q[0], MIRE_Y + hy, q[1], ph, sp]); else if (!q) laneLeft.wisp = (laneLeft.wisp || 0) + 1; }
    // (the wisps of the wand path, where the subjects' deal put them: three over each such pool, each within half a metre of its
    // middle with the same wander, so that the three keep within the round of 5.6 m the deal measured against the lane)
    const rNw = fk.nearwisps;
    for (const nw of nearWisps) for (let k = 0; k < 3; k++) {
      const ox = rNw.range(-0.35, 0.35), oz = rNw.range(-0.35, 0.35), hy = rNw.range(0.7, 1.5), ph = rNw.range(0, 6.28), sp = rNw.range(0.6, 1.3);
      if (roundOff(nw.x + ox, nw.z + oz) > wispR + 1 && laneOk('wisp', nw.x + ox, nw.z + oz, wispR, MIRE_Y + hy - WISP_BOB - 0.5, MIRE_Y + hy + WISP_BOB + 0.5)) wispBase.push([nw.x + ox, MIRE_Y + hy, nw.z + oz, ph, sp]);
    }
    const wisps = fx.makeGlows({ rng: fk.wispglow, positions: wispBase.map((b) => [b[0], b[1], b[2]]), color: '#cfe2ff', sizeJitter: 0.4, size: 1.0, intensity: 1.5, flicker: 0.55, fogAmount: 0.4 });
    scene.add(wisps.object);
    await ctx.yield();
    // ---- life in the air and on the ground: bats about the towers, a white owl over the yew alley, a fox outside the wicket gate, smoke
    const fLight = FA.lightFrom(scene);
    // THE BATS go round and round over the two towers on the world's clock: an oval course 34 m by 18 m about the hall's middle, 37 m up
    // (over the turrets' caps by the stream's whole spread, its wander and 2 m more); how near its course comes to the line is
    // kept with the lane's notes ('bats course')
    const batY = HALL.towerH + 4.1 + 2.5 + 1.2 + 2 + 2.7, batPts = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; batPts.push([Math.sin(a) * 17, batY + 0.8 * Math.sin(a * 2), zf - 2.4 + Math.cos(a) * 9]); }
    // (the owner's rule texts R and M: each flock call hands its own wander, its count and maxSigma 3: every dealt place is then
    // within three scatters. The kit of this tree (release s0y, 10 October) knows the names; the lane's note 'bats course'
    // and the builder's count measure the course, its spread and its wander against the line by place)
    const bats = FA.makeFlock({ rng: fk.bats, species: 'bats', count: Math.round(34 * detail), light: fLight, speed: 8, spread: [5, 2.5, 40], wander: [2, 1.2, 1.5, 1.6], maxSigma: 3, route: batPts, closed: true });
    // THE OWL: one white owl quarters the yew walk by the world's clock, round and round: down the walk over the one hedge and
    // back over the other, OWL_UP metres over the yews' tops, from OVER.walk metres inside the alley's head to 14 m short of the wicket gate
    // (round 9: the line now comes down into the alley from over the garden and lies level on the walk only from OVER.walk
    // metres inside the head; the round-8 beat began 8 m inside the head and there crossed the line's way down at 3.3 m; the
    // owl's beat is the lower walk, where the line lies under it by the yews' height and OWL_UP).
    // It is one bird on its course (no spread, a wander of a hand's breadth).
    const OWL_UP = 7.5, owlPts = [], owlA = ALLEY.z0 - 10, owlB = ALLEY.z1 + 14, owlOff = ALLEY.half + ALLEY.thick / 2, owlY = ALLEY.high + OWL_UP;
    for (let k = 0; k <= 5; k++) owlPts.push([owlOff, owlY, lerp(owlA, owlB, k / 5)]);
    owlPts.push([0, owlY, owlB - owlOff]);
    for (let k = 5; k >= 0; k--) owlPts.push([-owlOff, owlY, lerp(owlA, owlB, k / 5)]);
    owlPts.push([0, owlY, owlA + owlOff]);
    const owl = FA.makeFlock({ rng: fk.owl, species: 'crows', count: 1, size: 2.3, speed: 7.5, flap: 2.4, glide: 0.55, light: fLight, spread: [0, 0, 0], wander: [0.25, 0.15, 0.25, 0.4], maxSigma: 3, palette: { body: '#d9d2be', belly: '#f2eee2', wingC: '#c2b490', tip: '#8a7a5c', head: '#e8e2d2', tailC: '#c8ba98', beak: '#5a5040' },
      route: owlPts, closed: true });
    for (const fl of [[bats, 'bats course'], [owl, 'owl course']]) { const d = fl[0].route.data; for (let k = 0; k < d.length; k += 4) laneNote(fl[1], laneDist(d[k], d[k + 2], 0, d[k + 1], d[k + 1])); }
    scene.add(bats.object, owl.object);
    await ctx.yield();
    // THE FOX has its beat outside the park's wall, west of the wicket gate and of the sunken lane's west wall: between the wall
    // and the nearest patch of bracken on the moor, the nearest place of bracken found on thirteen bearings between west and
    // north-north-west, 14 to 90 m off, to which it can run straight with nothing standing on its run and every metre of the
    // run outside the lane (laneRun below: the lane's 2.5 m and the fox's own half metre). It goes out to the bracken, goes to ground there, comes out and trots back to the
    // wall, round and round by the world's clock. Where no bearing gives such a run its beat is 44 m west along the outside of
    // the park's wall (or as far as nothing stands on it), and it stands at the far end in the open. Nothing stands on a beat
    // (see below).
    const rFx = fk.fox, foxA = [-PIER_X - 3.4 - rFx.range(0, 4), GATE_Z - 2.5 - rFx.range(0, 3)];
    // THE BEAT IS KEPT CLEAR OF WHAT STANDS: its whole line with the fox's half width (FOX_HALF), and its two ends, where the fox
    // turns, with half its length (FOX_TURN), are asked against every hard thing of the list, every boulder, every block of a
    // granite pile, every set stone, the standing things of the moor and every tussock's mound (foxBars: x, z, radius).
    const FOX_HALF = 0.3, FOX_TURN = 0.6, foxBars = [];
    { const near = (x, z, r) => { if (Math.hypot(x - foxA[0], z - foxA[1]) < 100 + r) foxBars.push(x, z, r); };
      for (const h of hard) near(h[0], h[1], h[2]); for (const t of standing) near(t[0], t[1], t[2]); for (const t of mounds) near(t[0], t[1], t[2]);
      for (let i = 0; i < stoneBars.length; i += 3) near(stoneBars[i], stoneBars[i + 1], stoneBars[i + 2]);
      for (const [list, kr] of [[slabs, 1.15], [hillSlabs, 1.15], [farSlabs, 1.15], [boulders, 1.0], [midBoulders, 1.0], [smallBoulders, 1.0], [skirtStones, 1.0], [skirtSmall, 1.0], [wallNear[0], 1.35], [wallNear[1], 1.35], [menhirs, 1.5], [menhirsB, 1.5]]) for (const M of list) { const e = M.elements; near(e[12], e[14], kr * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10]))); } }
    const beatHit = (dx, dz, len) => { for (let i = 0; i < foxBars.length; i += 3) { const px = foxBars[i] - foxA[0], pz = foxBars[i + 1] - foxA[1], r = foxBars[i + 2], t = px * dx + pz * dz, s = Math.abs(px * dz - pz * dx);
      if ((t > 0 && t < len && s < r + FOX_HALF) || Math.hypot(t, s) < r + FOX_TURN || Math.hypot(t - len, s) < r + FOX_TURN) return true; } return false; };
    // (laneRun: every metre of a run keeps the lane's 2.5 m with the fox's own half metre and a tenth: the law's clearance, no more)
    const laneRun = (dx, dz, d) => { for (let t = 0; t <= d + 4; t += 1) if (laneDist(foxA[0] + dx * t, foxA[1] + dz * t, 0.6, -50, 50) < LANE_M) return false; return true; };
    let foxDir = [-1, 0], foxRun = 44, foxFound = false, foxWay = 'wall';
    for (let k = 0; k < 13; k++) for (let d = 14; d <= 90 && d < foxRun + (foxFound ? 0 : 99); d += 4) {
      const az = (272 + k * 6) * DEG, dx = Math.sin(az), dz = -Math.cos(az), x = foxA[0] + dx * d, z = foxA[1] + dz * d;
      if (brackenPatch(x, z) < 0.55 || !moorOnly(x, z)) continue;
      if (laneRun(dx, dz, d) && !beatHit(dx, dz, d + 3) && (!foxFound || d + 3 < foxRun)) { foxDir = [dx, dz]; foxRun = d + 3; foxFound = true; foxWay = 'bracken'; }
    }
    // (TWO WAYS: 'bracken', a clear run to bracken; else 'wall', the run west along the outside of the park's wall, 44 m or as
    // far as nothing stands on it: one law, its length by what stands)
    if (!foxFound) while (foxRun > 2 && beatHit(-1, 0, foxRun)) foxRun--;
    // (its habit, by the world's clock: FOX_REST seconds by the pier, out to the bracken at FOX_MS metres a second (slow away, slow
    // in), FOX_REST seconds in the bracken (or, where no bracken was found, standing on the moor at its run's end), and back; where
    // in that round it is at the clock's nought is drawn. foxAt gives its place, its heading, its gait and how far it is sunk in
    // the bracken at the clock `time`)
    const FOX_MS = 3.4, FOX_REST = 3.5, foxLeg = foxRun / FOX_MS, foxT = 2 * (foxLeg + FOX_REST), foxPh = rFx(), foxYaw = Math.atan2(foxDir[0], foxDir[1]);
    const foxAt = (time, out) => {
      const c = (((time / foxT + foxPh) % 1) + 1) % 1 * foxT, back = c >= foxLeg + FOX_REST, c2 = back ? c - foxLeg - FOX_REST : c;
      // (f: how far along this leg, 0 while it rests at the leg's start)
      const f = clamp((c2 - FOX_REST) / foxLeg, 0, 1), e = f - Math.sin(f * 6.2832) / 6.2832, fr = foxRun * (back ? 1 - e : e), turn = smoothstep(0.15 * FOX_REST, 0.85 * FOX_REST, c2);
      out.x = foxA[0] + foxDir[0] * fr; out.z = foxA[1] + foxDir[1] * fr; out.fr = fr;
      out.yaw = foxYaw + Math.PI * (back ? turn : 1 + turn); out.gait = foxRun * e; out.amp = 0.55 * (0.5 - 0.5 * Math.cos(f * 6.2832));
      out.gone = foxFound ? smoothstep(foxRun - 3, foxRun, fr) : 0; out.amp *= 1 - out.gone;
      return out;
    };
    scene.userData.fox = { found: foxFound, run: foxRun, dir: foxDir, at: foxAt, period: foxT, way: foxWay, start: foxA };
    // (kept with the scene for the counts in node: the hard things and what was left out of them, the reeds' feet, the fox's bars)
    // (for the count of the moor's gaps: every thing of the place that stands, with its radius: the set stones, the walls' lengths,
    // the huts, the cottage, the ponies, the ricks and posts; the piles and the greater boulders; the thorns and dead trees)
    scene.userData.things = [...standing.map((q) => [q[0], q[1], q[2], 'standing']), ...pileShade.map((q) => [q[0], q[1], q[2], q[2] < 2 ? 'boulder' : 'pile']), ...thornPts.map((p) => [p.x, p.z, 1, 'thorn'])];
    scene.userData.hard = { list: hard, left: hardLeft, tally: hardTally, reeds: reedAt, bars: foxBars };
    const fox = makeFox(ctx, { length: 1.2 }); scene.add(fox.object);
    const smokes = [];
    // (smoke out of three of the chimney stacks: the two of the middle block on its west side and the outer one of the east wing; the
    // wind carries all three away to the west. Each is a plume: it rises a little and is laid over by the wind, widening as it
    // goes; pale on the side the moon lights; the east wing's is the least bent. How near each column comes to the line is
    // counted at every phase of its clock with the other movers.)
    for (const [j, k] of [[0, 0], [1, 1], [2, 7]]) { const st = stacks[k], sm = fx.makeSmokeColumn({ rng: fk['smoke' + j], position: [st[0], st[1] - 0.3, st[2]], height: 17, radius: [0.3, 4.2], size: [1.0, 6.5], count: 28, color: '#b4bccf', colorTop: '#d6ddee',
      shadowColor: '#687088', ambient: '#565d74', opacity: 0.34, bend: j < 2 ? 1.5 : 0.5, rim: 0.6, ragged: 0.9, softness: 0.9, wind: [-0.8, 0, 0.45], sunDir }); scene.add(sm.object); smokes.push(sm); }
    // (THE COTTAGE'S CHIMNEY SMOKES, where the cottage stands: a thin plume of peat smoke, pale under the moon)
    if (scene.userData.cottage) { const c = scene.userData.cottage.chimney, sm = fx.makeSmokeColumn({ rng: fk.smoke4, position: [c[0], c[1] - 0.2, c[2]], height: 9, radius: [0.15, 1.6], size: [0.5, 2.6], count: 16, color: '#b4bccf', colorTop: '#d6ddee',
      shadowColor: '#687088', ambient: '#565d74', opacity: 0.32, bend: 1.5, rim: 0.7, ragged: 0.9, softness: 0.9, wind: [-0.8, 0, 0.45], sunDir }); scene.add(sm.object); smokes.push(sm); }
    // (NO SMOKE RISES FROM THE WORKS' STACKS: the works are left. THE HUT'S CHIMNEY SMOKES: a thin plume from the one fire, laid
    // over by the same wind, warm at its root)
    { const q = isleXZ(hx1 - 0.5, HUT.z), sm = fx.makeSmokeColumn({ rng: fk.smoke3, position: [q[0], floorY + hy1 + 2.0, q[1]], height: 10, radius: [0.15, 1.7], size: [0.5, 2.8], count: 16, color: '#b0b6c6', colorTop: '#d8dce6', hot: '#e0733a', hotFalloff: 9,
      shadowColor: '#6a7084', ambient: '#565b70', opacity: 0.32, bend: 1.5, rim: 0.8, ragged: 0.9, softness: 0.9, wind: [-0.8, 0, 0.45], sunDir }); scene.add(sm.object); smokes.push(sm); }
    await ctx.yield();

    // ---- POLISH 1, STAGE C3: THE GROWN AND THE FALLEN. Heather in clumps on four runs of the open moor and single fallen blocks on
    // two of them, dealt HERE, after everything of live has its place, from streams of their own (fk.fallen, fk.clumps,
    // fk.clumpbush): nothing of live draws less or more, and nothing of live moves. The runs are metres of the line between the
    // plan's own stations (c3Runs); a clump stands where the heather patch's own noise is highest beside the run. Every new body
    // is measured WHOLE before it is made (a bush by its widest vertex with the kit's stir added, a block by the round that
    // holds all of it) and stands by its place alone (c3Why, below): nothing here reads the eye, the clock or the metres flown,
    // and nothing of it is made, shown, hidden or moved in update (the bushes stir in the kit's wind, whose clock live's heather feeds).
    // (C3: plan, the least metres on the plan between a body's edge and the line; bush and block, how far a body's middle lies
    // from the line; root, the least metres between a new root and a set stone, a lantern, a hut ring or another new root;
    // berth, the least metres between a block and anything made, house the same for a house; sight, how far along the line a
    // thing of the way is kept in sight; apart, the least metres between two clumps' middles)
    const C3 = { plan: LANE_M, bush: [3, 14], block: [4.5, 20], bushes: 70, clumps: 16, apart: 10, root: 1.5, berth: 8, house: 20, man: 20, sight: 120, sightFar: 700, tries: 12, pool: 0.58, level: 0.123 };
    const c3Runs = { heather: [[S.gate + 4, S.sunk - 5], [S.sunk + 12, S.knoll - 8], [S.river + 7, S.A0 + 11], [S.shoulder + 20, S.mire - 11]], blocks: [[S.A0 - 29, S.A0 + 11], [S.shoulder + 20, S.mire - 41]] };
    for (const k in c3Runs) c3Runs[k] = c3Runs[k].map((q) => [clamp(q[0], 0, L), clamp(q[1], 0, L)]).filter((q) => q[1] - q[0] > 4);
    // (THE PEAT HAGS' OWN NOISE, as the ground's shader has it (moorH2, moorN2 and the two scales of its hags), in the card's
    // own single floats: a hag's level floor is a pool since C2 and begins at 0.655 of this noise, its rim at 0.61; a new body
    // stands only where the noise is under C3.pool at its middle and at eight places round its edge)
    const f32 = Math.fround, frac32 = (v) => f32(v - Math.floor(v));
    const hagH = (px, py) => { let qx = frac32(f32(px * f32(0.1031))), qy = frac32(f32(py * f32(0.1031))), qz = qx; const d = f32(f32(qx * f32(qy + f32(33.33))) + f32(qy * f32(qz + f32(33.33))) + f32(qz * f32(qx + f32(33.33)))); qx = f32(qx + d); qy = f32(qy + d); qz = f32(qz + d); return frac32(f32(f32(qx + qy) * qz)); };
    const hagN2 = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); let ax = px - ix, ay = py - iy; ax = ax * ax * (3 - 2 * ax); ay = ay * ay * (3 - 2 * ay);
      const a = hagH(ix, iy), b = hagH(ix + 1, iy), c = hagH(ix, iy + 1), d = hagH(ix + 1, iy + 1); return (a + (b - a) * ax) + ((c + (d - c) * ax) - (a + (b - a) * ax)) * ay; };
    const hagN = (x, z) => hagN2(f32(x * 0.043 + 7.3), f32(z * 0.043 + 7.3)) * 0.62 + hagN2(f32(x * 0.117 - 3.1), f32(z * 0.117 - 3.1)) * 0.38;
    // (a pool is a hag's floor where the ground is level: the shader's whole pool lies under 2.5 degrees of the land's slope and
    // none from 5; here the drawn ground's fall over 3 m is asked, and a place counts as pool, floor or rim, under C3.level, 7 degrees)
    const c3Slope = (x, z) => Math.hypot(groundY(x + 1.5, z) - groundY(x - 1.5, z), groundY(x, z + 1.5) - groundY(x, z - 1.5)) / 3;
    const hagAt = (x, z) => hagN(x, z) > C3.pool && c3Slope(x, z) < C3.level;
    const hagIn = (x, z, r) => { if (hagAt(x, z)) return true; for (let k = 0; k < 8; k++) if (hagAt(x + Math.cos(k * 0.7854) * r, z + Math.sin(k * 0.7854) * r)) return true; return false; };
    // (a place beside the line: the line's own point at m metres of it and lat metres to its right hand on the plan)
    const c3V = new THREE.Vector3(), c3T = new THREE.Vector3(), c3Q = [0, 0];
    const lineAt = (m, lat, out) => { path.posAtDist(m, c3V); path.tangentAtDist(m, c3T); const h = Math.hypot(c3T.x, c3T.z) || 1; out[0] = c3V.x - c3T.z / h * lat; out[1] = c3V.z + c3T.x / h * lat; return out; };
    // (A BUSH WHOLE, WITH ITS STIR: the kit sways a vertex by its sway weight times the plant's scale, the wind's strength and the
    // bend (the gust at its most, 0.55 and the wind's gustiness, and 0.24 on each axis), and flutters it by its flutter weight
    // times 0.045, the strength and 0.4 and the gust; so each heather shape's widest reach and its top are taken over all its
    // vertices with both added, at scale 1. A block whole: the farthest of its make's vertices from its middle, at scale 1.)
    const c3Wind = wind.uniforms.uFloraWind.value.z, c3Gust = 0.55 + wind.uniforms.uFloraGust.value.y, STIR = { sway: c3Wind * (c3Gust + 0.34), flutter: 0.045 * c3Wind * (0.4 + c3Gust) * 1.4143 };
    const bushWhole = heatherGeo.map((g) => { const p = g.attributes.position, w = g.attributes.wind; let r = 0, top = 0;
      for (let i = 0; i < p.count; i++) { const st = w ? STIR.sway * Math.abs(w.getX(i)) + STIR.flutter * Math.abs(w.getY(i)) : 0; r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i)) + st); top = Math.max(top, p.getY(i) + st); }
      return { r, top, triangles: g.userData.triangles }; });
    const blockReach = (() => { const p = boulderMid.attributes.position; let m = 0; for (let i = 0; i < p.count; i++) m = Math.max(m, Math.hypot(p.getX(i), p.getY(i), p.getZ(i))); return m; })();
    await ctx.yield();
    // WHAT THE WAY SHOWS STAYS IN SIGHT, BY RULE: every set stone (the rows' and the gates', at a third of its height), each hut
    // ring (eight places on its wall, at the wall's middle height), every lantern and fire of the way (its flame), the man on the
    // crown (his knee and his head), the mine (its fires, its house under the eaves, its stack under the top). From every place
    // of the line within a thing's reach (a point every 3 m of the line; C3.sight metres, C3.sightFar for the man and the mine)
    // the straight line from the lens to the thing is laid, and a new body may not stand under it: sightHid is true where a body
    // (the round that holds it whole, to its top) would stand between any such place and the thing.
    const sightT = [], sightAdd = (x, y, z, far) => sightT.push({ x, y, z, far, eyes: null });
    for (const list of [menhirs, menhirsB]) for (const M of list) { const e = M.elements; sightAdd(e[12], e[13] - 0.34 * Math.hypot(e[4], e[5], e[6]), e[14], C3.sight); }
    for (const h of huts) for (let k = 0; k < 8; k++) { const x = h.x + Math.cos(k * 0.7854) * h.r, z = h.z + Math.sin(k * 0.7854) * h.r; sightAdd(x, groundY(x, z) + 0.6, z, C3.sight); }
    for (const q of lanternPts) sightAdd(q[0], q[1], q[2], C3.sight);
    // (and the living things and the lit window of the moor: each pony at its belly, the cottage's window, the fox's beat at three places a hand over the ground)
    for (const q of ponyList) sightAdd(q.x, groundY(q.x, q.z) + 0.6 * q.size, q.z, C3.sight);
    if (scene.userData.cottage) sightAdd(farAt[0], farAt[1], farAt[2], C3.sight);
    for (const f of [0, 0.5, 1]) { const x = foxA[0] + foxDir[0] * foxRun * f, z = foxA[1] + foxDir[1] * foxRun * f; sightAdd(x, groundY(x, z) + 0.35, z, C3.sight); }
    { const fp = figure.object.position; sightAdd(fp.x, fp.y + 0.25 * P.FIG_H, fp.z, C3.sightFar); sightAdd(fp.x, fp.y + 0.9 * P.FIG_H, fp.z, C3.sightFar); }
    for (const q of worksFires) sightAdd(q[0], q[1], q[2], C3.sightFar);
    for (const c of [[EX0, EZ0], [EX1, EZ0], [EX1, EZ1], [EX0, EZ1]]) { const q = isleXZ(c[0], c[1]); sightAdd(q[0], floorY + ey0 + EW - 2, q[1], C3.sightFar); }
    { const q = isleXZ(SKX, SKZ); sightAdd(q[0], floorY + ey0 + SKH - 3, q[1], C3.sightFar); }
    // (the places of the line a thing is looked at from: within its reach and no more than 20 m past the line's nearest place to
    // it: the film looks along the way, and a thing passed is behind the lens. A sight counts only where the thing is seen at
    // all: the drawn ground is asked every 4 m under the straight line, and where it stands 0.3 m over it the ground itself
    // hides the thing from there (sightClear; kept for each place once asked))
    const sightEyes = (t) => { let kT = 0, best = 1e18; for (let k = 0; k < laneOwn; k += 18) { const dx = lanePts[k] - t.x, dz = lanePts[k + 2] - t.z, d = dx * dx + dz * dz; if (d < best) { best = d; kT = k; } }
      const a = []; for (let k = 0; k < laneOwn && k <= kT + 120; k += 18) { const dx = lanePts[k] - t.x, dz = lanePts[k + 2] - t.z; if (dx * dx + dz * dz < t.far * t.far) a.push(lanePts[k], lanePts[k + 1], lanePts[k + 2]); }
      t.seen = new Int8Array(a.length / 3); return a; };
    const sightClear = (t, E, k) => { let s = t.seen[k / 3]; if (s) return s === 1; const dx = t.x - E[k], dz = t.z - E[k + 2], n = Math.floor(Math.hypot(dx, dz) / 4); s = 1;
      for (let j = 1; j < n; j++) { const u = j / n; if (groundY(E[k] + dx * u, E[k + 2] + dz * u) > E[k + 1] + (t.y - E[k + 1]) * u + 0.3) { s = 2; break; } }
      t.seen[k / 3] = s; return s === 1; };
    const sightHid = (x, z, r, yTop) => { for (const t of sightT) { const bx = x - t.x, bz = z - t.z, bd = bx * bx + bz * bz; if (bd > t.far * t.far) continue; const E = t.eyes || (t.eyes = sightEyes(t));
        for (let k = 0; k < E.length; k += 3) { const dx = t.x - E[k], dz = t.z - E[k + 2], dd = dx * dx + dz * dz; if (dd < 1) continue; const u = ((x - E[k]) * dx + (z - E[k + 2]) * dz) / dd; if (u <= 0.02 || u >= 1) continue;
          const px = x - E[k] - u * dx, pz = z - E[k + 2] - u * dz; if (px * px + pz * pz < r * r && E[k + 1] + (t.y - E[k + 1]) * u < yTop && sightClear(t, E, k)) return true; } } return false; };
    // WHY A NEW BODY MAY NOT STAND AT A PLACE (c3Why: '' where it may). x, z: its middle; r: the round that holds it whole (a
    // bush with its stir); yTop: its top; block: a fallen block (else a bush). In order: the open moor only (the whole body 3 m
    // and more outside the park's wall, 60 m and more from the entry, off the mire and its wand path, 4 m and its own round
    // from the brook (a block 8 m), its edge 2.8 m and more from the old way's middle: the trodden strip is 1.3 m and fades
    // by 2.5); the line (its edge C3.plan metres and more from the line ON THE PLAN, whatever the lens's height, and its
    // middle no nearer than the kind's least); no pool nor a pool's rim under any of it; a bush's edge C3.root metres from
    // every standing thing, lantern, set stone and hut ring's wall and half a metre from a wall's stones, a block's edge
    // C3.berth metres from all of them (C3.house from a house) and C3.man from the man: no made thing and nobody among the
    // blocks; no granite of live under it (a block's edge a metre from every other block and pile: none stacked, none set
    // on another, none touching; a bush's root outside every block); no trunk; C3.root between new roots, 3 m between two
    // new blocks' edges; off the fox's beat; a block not on a tussock, a near stone or a plant of live; and the sights.
    const c3New = [], c3Left = {}, entryAt = [lanePts[0], lanePts[2]];
    // (what of live's granite, walls, set stones and tussocks lies near the runs is written down once, each as its place and the
    // round that holds it: all within 40 m of the box about a run's own line; a new body's middle lies within 20 m of that line)
    const c3Box = [...c3Runs.heather, ...c3Runs.blocks].map(([a0, a1]) => { const b = [1e9, -1e9, 1e9, -1e9]; for (let m = a0; m <= a1; m += 4) { lineAt(m, 0, c3Q); b[0] = Math.min(b[0], c3Q[0] - 40); b[1] = Math.max(b[1], c3Q[0] + 40); b[2] = Math.min(b[2], c3Q[1] - 40); b[3] = Math.max(b[3], c3Q[1] + 40); } return b; });
    const c3Near = (x, z) => c3Box.some((b) => x > b[0] && x < b[1] && z > b[2] && z < b[3]);
    const c3Flat = (lists) => { const a = []; for (const [list, kr] of lists) for (const M of list) { const e = M.elements; if (c3Near(e[12], e[14])) a.push(e[12], e[14], kr * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10]))); } return a; };
    const nearList = (a, x, z, pad) => { for (let i = 0; i < a.length; i += 3) { const m = a[i + 2] + pad, dx = a[i] - x, dz = a[i + 1] - z; if (dx * dx + dz * dz < m * m) return true; } return false; };
    const c3Granite = c3Flat([[slabs, 1.15], [hillSlabs, 1.15], [farSlabs, 1.15], [boulders, 1.0], [midBoulders, 1.0], [smallBoulders, 1.0], [skirtStones, 1.0], [skirtSmall, 1.0]]), c3Walls = c3Flat([[wallNear[0], 1.35], [wallNear[1], 1.35]]), c3Set = c3Flat([[menhirs, 1.5], [menhirsB, 1.5]]);
    const c3Mounds = []; for (const t of mounds) if (c3Near(t[0], t[1])) c3Mounds.push(t[0], t[1], 0.5 * t[2]);
    const c3Why = (x, z, r, yTop, block) => {
      const off = block ? C3.berth : C3.root;
      if (!(z < GATE_Z - 0.6 - r - 3 || Math.abs(x) > 64.6 + r + 3)) return 'the park';
      if (Math.hypot(x - entryAt[0], z - entryAt[1]) < 60) return 'the entry';
      const zn = zoneAt(P, x, z, ZONE); if (zn.mire > 0.02 || zn.wand > 0) return 'the mire'; if (zn.river < (block ? 8 : 4) + r) return 'the stream'; if (zn.wayD < 2.8 + r) return 'the track';
      const dp = laneDist(x, z, r, -999, 999, 16); if (dp < C3.plan || dp + r < (block ? C3.block[0] : C3.bush[0])) return 'the line';
      if (hagIn(x, z, r)) return 'a pool';
      for (const q of standing) { const m = q[2] + r + (block && q[2] >= 2.5 ? C3.house : off), dx = q[0] - x, dz = q[1] - z; if (dx * dx + dz * dz < m * m) return 'a made thing'; }
      for (const q of lanternPts) { const m = r + off, dx = q[0] - x, dz = q[2] - z; if (dx * dx + dz * dz < m * m) return 'a lantern'; }
      for (const h of huts) if (Math.hypot(h.x - x, h.z - z) < h.r + 0.5 + r + off) return 'a hut circle';
      if (nearList(c3Set, x, z, r + off)) return 'a set stone';
      if (nearList(c3Walls, x, z, r + (block ? C3.berth : 0.5))) return 'a wall';
      if (nearList(c3Granite, x, z, block ? r + 1 : 0.4)) return 'granite';
      for (const h of hard) { const m = h[2] + (block ? r + 1 : 0.8), dx = h[0] - x, dz = h[1] - z; if (dx * dx + dz * dz < m * m) return 'a trunk'; }
      for (const b of c3New) { const m = block && b.block ? b.r + r + 3 : b.block ? b.r + C3.root : block ? r + C3.root : C3.root, dx = b.x - x, dz = b.z - z; if (dx * dx + dz * dz < m * m) return 'a new body'; }
      { const px = x - foxA[0], pz = z - foxA[1], t = clamp(px * foxDir[0] + pz * foxDir[1], 0, foxRun); if (Math.hypot(px - foxDir[0] * t, pz - foxDir[1] * t) < r + 1.5) return 'the fox\'s beat'; }
      if (block) { const fp = figure.object.position; if (Math.hypot(fp.x - x, fp.z - z) < C3.man + r) return 'the man';
        if (nearList(c3Mounds, x, z, 0.85 * r)) return 'a tussock';
        for (let i = 0; i < stoneBars.length; i += 3) { const m = r + stoneBars[i + 2], dx = stoneBars[i] - x, dz = stoneBars[i + 1] - z; if (dx * dx + dz * dz < m * m) return 'a near stone'; }
        for (const pl of [heather, gorse, bracken]) for (const p of pl.points) { const dx = p.x - x, dz = p.z - z; if (dx * dx + dz * dz < 0.81 * r * r) return 'a plant of live'; } }
      return sightHid(x, z, r, yTop) ? 'a sight' : '';
    };
    await ctx.yield();
    // THE FALLEN BLOCKS: the hill's own clitter on the climb's upper run and on the way down (c3Runs.blocks), FALLEN.n of them
    // on every seed alike, shared between the two runs by their lengths. EACH IS ONE BLOCK LYING ON THE GROUND AS IT FELL: the
    // moor's rounded cobble of 48 faces (stoneOf's make for a block under 1.2 m: FALLEN.size, so 1.2 to 2.4 m long), laid as
    // live's scattered boulders are (0.6 to 0.85 of its size high, 0.8 to 1.15 broad, turned as it fell, leaning up to 0.2;
    // an eighth of its height over the LOWEST ground under it), in the granite's own stone (rockMat: the lit side under the
    // hold, the shaded side lifted, as every block of the moor) and in the cobbles' own draw. Each is dealt along its run
    // (one in each equal part of it, anywhere in the part), to either hand, C3.block metres from the line, nearer ones
    // more often; where c3Why bars the place, or it would lie in a line with two other fallen blocks (rowOf: a third block
    // within 1.5 m of the line through two others, all three within 30 m), it is dealt again, C3.tries times at the most,
    // and else left out. No two touch and none is set on another (c3Why); none stands in a ring, a row or a heap.
    const c3Blocks = [], rFa = fk.fallen, c3Least = { block: 99, bush: 99 };
    const rowOf = (x, z) => { const B = c3New.filter((b) => b.block && Math.hypot(b.x - x, b.z - z) < 30);
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { const a = B[i], b = B[j], far = Math.max(Math.hypot(b.x - a.x, b.z - a.z), Math.hypot(x - a.x, z - a.z), Math.hypot(x - b.x, z - b.z)); if (Math.abs((b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x)) / far < 1.5) return 'a row'; }
      return ''; };
    { const len = c3Runs.blocks.reduce((a, q) => a + q[1] - q[0], 0); let dealt = 0;
      for (let k = 0; k < c3Runs.blocks.length; k++) { const [a0, a1] = c3Runs.blocks[k], n = k === c3Runs.blocks.length - 1 ? FALLEN.n - dealt : Math.round(FALLEN.n * (a1 - a0) / len); dealt += n;
        for (let i = 0; i < n; i++) for (let t = 0; t < C3.tries; t++) {
          const m = a0 + (a1 - a0) * (i + rFa()) / n, lat = rFa.sign() * lerp(C3.block[0], C3.block[1], Math.pow(rFa(), 2)), s = lerp(FALLEN.size[0], FALLEN.size[1], Math.pow(rFa(), 0.5)), sy = s * rFa.range(0.6, 0.85), sz = s * rFa.range(0.8, 1.15), yaw = rFa.range(0, 6.28), tl = rFa.range(-0.2, 0.2);
          lineAt(m, lat, c3Q); const x = c3Q[0], z = c3Q[1], r = blockReach * Math.max(s, sz), y = lowGround(x, z, s * 0.7) + sy * 0.12, why = c3Why(x, z, r, y + 0.72 * sy + Math.abs(tl) * s, true) || rowOf(x, z);
          if (why) { c3Left['block: ' + why] = (c3Left['block: ' + why] || 0) + 1; continue; }
          place(c3Blocks, x, y, z, s, sy, sz, yaw, tl); c3New.push({ x, z, r, block: true, s });
          laneNote('fallen block', laneDist(x, z, r, y - r, y + r)); c3Least.block = Math.min(c3Least.block, laneDist(x, z, r, -999, 999, 24)); break; }
        await ctx.yield(); } }
    // (each takes one of the places kept for it at the end of the cobbles' mesh; the mesh then draws live's cobbles and these)
    { const im = midBoulderMesh.mesh, n0 = midBoulders.length; c3Blocks.forEach((M, k) => im.setMatrixAt(n0 + k, M)); im.count = n0 + c3Blocks.length; im.instanceMatrix.needsUpdate = true; if (im.count) { im.computeBoundingSphere(); im.computeBoundingBox(); } }
    await ctx.yield();
    // HEATHER IN CLUMPS: the kit's bushes in live's two heather shapes and live's heather material, C3.bushes more (by the
    // visit's detail, as live's are), in C3.clumps clumps of 3 to 6, shared among the four runs by their lengths. WHERE: every
    // 2 m of a run, on both hands, at four distances from the line, the heather patch's own noise is asked (heatherPatch,
    // the field that tints the ground and deals live's heather; where it is nought everywhere, the same two noises before
    // their thresholds: heatherRaw; a place with a pool or a pool's rim within 3.2 m is not asked); a run's clumps stand at
    // its highest places (one in each equal part of the run first: below), no two clumps' middles within C3.apart
    // metres. A CLUMP: three bushes round its middle, or one great bush at the middle with three to five lesser round it,
    // roots C3.root metres and more apart, crowns grown into one another (the great one 0.66 to 0.75 of the shape, the
    // lesser 0.46 to 0.66: live's heather is 0.35 to 0.75); each bush dealt up to six times where c3Why bars its place,
    // and a clump with fewer than three standing is not made (the next highest place is asked). The bushes a clump
    // could not stand are owed to the next. They stir in the kit's wind with live's heather and take the night's
    // light, the lamps and the shade as live's heather does, being of its material.
    const rCp = fk.clumps, c3Pts = [], c3Clumps = [];
    const heatherRaw = (x, z) => (1 - (P.noise.fbm2(x * 0.012 + 40, z * 0.012 - 9, 3) * 0.5 + 0.5)) * (P.noise.fbm2(x * 0.021 - 17, z * 0.021 + 33, 2) * 0.5 + 0.5);
    // (a clump's middle is asked only where a bush could stand at all: off the mire, the brook and the track, and no standing thing within its radius and 2.6 m)
    const clumpBar = (x, z) => { const zn = zoneAt(P, x, z, ZONE); if (zn.mire > 0.02 || zn.wand > 0 || zn.river < 6 || zn.wayD < 4.2) return true; for (const q of standing) { const m = q[2] + 2.6, dx = q[0] - x, dz = q[1] - z; if (dx * dx + dz * dz < m * m) return true; } return false; };
    const clumpAt = (cx, cz, n) => { const got = [], a0 = rCp.range(0, 6.28), ring = n >= 4 ? n - 1 : n;
      for (let k = 0; k < n; k++) for (let t = 0; t < 6; t++) {
        const mid = n >= 4 && k === 0, a = a0 + (n >= 4 ? k - 1 : k) * 6.2832 / ring + rCp.range(-0.12, 0.12), d = mid ? 0 : n === 3 ? rCp.range(0.95, 1.2) : n === 6 ? rCp.range(1.7, 2.0) : rCp.range(1.55, 1.9), s = mid ? rCp.range(0.66, 0.75) : rCp.range(0.46, 0.66), v = rCp.int(0, heatherGeo.length - 1), rot = rCp.range(0, 6.28);
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, r = bushWhole[v].r * s, g = groundY(x, z), why = got.some((p) => Math.hypot(p.x - x, p.z - z) < C3.root) ? 'a new body' : c3Why(x, z, r, g + bushWhole[v].top * s * 1.1, false);
        if (why) { c3Left['bush: ' + why] = (c3Left['bush: ' + why] || 0) + 1; continue; }
        got.push({ x, y: g, z, s, rot, v, u: 0, d: 0, r, top: g + bushWhole[v].top * s * 1.1, great: mid }); break; }
      return got; };
    { const nBush = Math.round(C3.bushes * detail), nClump = Math.max(1, Math.round(C3.clumps * detail)), runs = c3Runs.heather, len = runs.reduce((a, q) => a + q[1] - q[0], 0), sizes = [];
      // (the clumps' sizes, 3 to 6 by the draw, then evened to the whole count; each run's share by its length, the last taking the rest)
      for (let i = 0; i < nClump; i++) sizes.push(3 + rCp.int(0, 3));
      for (let sum = sizes.reduce((a, b) => a + b, 0), i = 0; sum !== nBush && i < 6 * nClump; i++) { const k = i % nClump; if (sum > nBush && sizes[k] > 3) { sizes[k]--; sum--; } else if (sum < nBush && sizes[k] < 6) { sizes[k]++; sum++; } }
      let made = 0, owed = 0, shared = 0;
      for (let ri = 0; ri < runs.length; ri++) { const [a0, a1] = runs[ri], share = Math.min(nClump - shared, Math.round(nClump * (a1 - a0) / len)), want = ri === runs.length - 1 ? nClump - made : share + (shared - made), cands = []; shared += share;
        for (let m = a0 + 1; m <= a1 - 1; m += 2) for (const sd of [-1, 1]) for (const lat of [6.4, 8.2, 10.2, 12]) { lineAt(m, sd * lat, c3Q); if (hagIn(c3Q[0], c3Q[1], 3.2) || hagIn(c3Q[0], c3Q[1], 1.6) || clumpBar(c3Q[0], c3Q[1])) continue; cands.push([heatherPatch(c3Q[0], c3Q[1]) + 0.2 * heatherRaw(c3Q[0], c3Q[1]), c3Q[0], c3Q[1], Math.min(want - 1, Math.floor((m - a0) / (a1 - a0) * want)), 0]); }
        cands.sort((a, b) => b[0] - a[0]);
        await ctx.yield();
        // (ALONG THE RUN: first one clump in each of the run's equal parts, at the part's highest place of the patch that can stand
        // one; then, where a part could stand none, at the run's highest places left: the clumps are passed one after another
        // down the whole run and do not all lie in one patch)
        let got = 0, asked = 0;
        for (let pass = 0; pass < 2; pass++) for (let k = 0; k < (pass ? 1 : want); k++) for (const c of cands) {
          if (got >= want || made >= nClump) break; if (c[4] || (!pass && c[3] !== k) || c3Clumps.some((q) => Math.hypot(q[0] - c[1], q[1] - c[2]) < C3.apart)) continue;
          if (++asked % 3 === 0) await ctx.yield();
          const n = Math.min(6, sizes[made] + owed), list = clumpAt(c[1], c[2], n);
          if (list.length < 3) { c[4] = 1; c3Left['a short clump'] = (c3Left['a short clump'] || 0) + 1; continue; }
          owed = sizes[made] + owed - list.length; made++; got++; c3Clumps.push([c[1], c[2], list.length, heatherPatch(c[1], c[2]), ri]);
          for (const p of list) { p.c = c3Clumps.length - 1; c3Pts.push(p); c3New.push({ x: p.x, z: p.z, r: p.r, block: false }); laneNote('heather clump', laneDist(p.x, p.z, p.r, p.y - 0.3, p.top)); c3Least.bush = Math.min(c3Least.bush, laneDist(p.x, p.z, p.r, -999, 999, 24)); }
          if (!pass) break; }
        await ctx.yield(); } }
    let c3Budget = null;
    // THE BUDGET LAW (the round's): THE SCENE'S WHOLE COUNT STAYS AT OR UNDER BUDGET.whole TRIANGLES ON EVERY SEED, with
    // BUDGET.free kept free for the round's last stage, made after this: the wall and TWO small things (the prints, the
    // boot). NOTHING OF THE LAST STAGE IS COUNTED AGAINST THAT ROOM IN THE BUILD: the room holds by arithmetic (at the
    // most 25 lengths of wall of 94 triangles, 10 fallen stones of 24, the prints' 518 and the boot's 433: 3,541 in
    // 3,600). What stands in the scene now is counted (every mesh by its own triangles and instances: all of
    // live and the fallen blocks); where the clumps' bushes as dealt, each with its
    // shade's round, would pass what is left, FEWER OF THE STAGE'S NEW BUSHES ARE MADE, by this seed's own count and nothing
    // else: first the lesser bushes, one at a time from the clump that holds the most (the last such; its last dealt), no
    // clump under three; then, if that is not enough, whole clumps, the last made first. Nothing of live is thinned. (The
    // lane's notes and the least distances above were taken of every bush dealt: of more bushes than stand, never fewer.)
    // (LAST STAGE MENDING 2: A BUSH'S SHADE ROUND IS COUNTED AS ITS MAKER MAKES IT, not as 8. The kit's sheet lays under a
    // bush a grid of n by n cells, 2 n n triangles: n is the round's greater width over the kit's cell of 4 m, rounded up
    // and held to 2..6; the round is the bush's radius by the kit's 1.1, drawn out along the hour's light by 1 + 0.55 of
    // its cotangent (2.2 at the most). 8 triangles for a bush, 18 for a wide one. 1.1, 0.55, 2.2 and 4 are the kit's own
    // figures for a sheet asked as the maker's call below asks it: with the light's direction and a strength, no more.)
    { const BUDGET = { whole: 500000, free: 3600 }, shadeCot = Math.min(2.2, Math.hypot(sunDir.x, sunDir.z) / Math.max(0.05, sunDir.y)), round = (p) => { const rx = (heatherGeo[p.v].userData.radius || 1) * p.s * 1.1, rz = rx * (1 + 0.55 * shadeCot), n = clamp(Math.ceil(2 * Math.max(rx, rz) / 4), 2, 6); return 2 * n * n; },
      cost = (p) => heatherGeo[p.v].index.count / 3 + round(p), sizeOf = c3Clumps.map((c) => c[2]), dealt = c3Pts.length; let now = 0;
      scene.traverse((m) => { if (!m.isMesh || !m.geometry) return; const g = m.geometry, c = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); let k = m.isInstancedMesh ? m.count : 1; if (g.isInstancedBufferGeometry && Number.isFinite(g.instanceCount)) k = g.instanceCount; now += c / 3 * k; });
      let over = now + c3Pts.reduce((a, p) => a + cost(p), 0) + BUDGET.free - BUDGET.whole, lesser = 0, clumps = 0;
      while (over > 0) { let k = -1, j = -1; for (let i = 0; i < sizeOf.length; i++) if (sizeOf[i] > 3 && (k < 0 || sizeOf[i] >= sizeOf[k])) k = i;
        if (k < 0) break; for (let i = c3Pts.length - 1; i >= 0 && j < 0; i--) if (c3Pts[i].c === k && !c3Pts[i].great) j = i;
        if (j < 0) { sizeOf[k] = -sizeOf[k]; continue; } over -= cost(c3Pts[j]); c3Pts.splice(j, 1); sizeOf[k]--; lesser++; }
      for (let k = sizeOf.length - 1; k >= 0 && over > 0; k--) { if (!sizeOf[k]) continue; for (let i = c3Pts.length - 1; i >= 0; i--) if (c3Pts[i].c === k) { over -= cost(c3Pts[i]); c3Pts.splice(i, 1); } sizeOf[k] = 0; clumps++; }
      for (let k = 0; k < sizeOf.length; k++) c3Clumps[k][2] = Math.abs(sizeOf[k]);
      c3Budget = { whole: BUDGET.whole, free: BUDGET.free, before: Math.round(now), dealt, lesser, clumps, made: c3Pts.length }; }
    await ctx.yield();
    // (the kit makes them: its bushes at the places dealt, of live's heather material and in live's wind, each in its own soft
    // shade on the ground as live's heather is, the sheet through the one check. Two draws for the two shapes and one for the
    // sheet. NO UPDATER IS ADDED: the wind's clock is fed by live's heather; the kit's far cull is not asked for these.)
    const c3Heather = flora.makeBushes({ rng: fk.clumpbush, points: c3Pts, heightAt: groundY, wind, variants: heatherGeo, material: heather.material, groundShadow: { sunDir, strength: sheetK(0.55) } });
    c3Heather.object.name = 'heather clumps'; scene.add(c3Heather.object);
    await ctx.yield();
    await shadeCheck('heather clumps', c3Heather.shadow);
    // (kept with the scene for the counts: the runs, every block and clump with its place, what was left out and why, the
    // least metres on the plan between a new body's edge and the line, the triangles)
    scene.userData.c3 = { budget: c3Budget, runs: c3Runs, stir: STIR, bushWhole, blockReach, blocks: c3New.filter((b) => b.block).map((b) => [b.x, b.z, b.r, b.s]), clumps: c3Clumps.filter((c) => c[2] > 0), bushes: c3Pts.map((p) => [p.x, p.z, p.r, p.s, p.v, p.top - p.y]), left: c3Left, least: c3Least, sights: sightT.length,
      triangles: { blocks: c3Blocks.length * boulderMid.index.count / 3, bushes: c3Heather.triangles, shade: c3Heather.shadow ? c3Heather.shadow.triangles : 0 } };
    await ctx.yield();

    // ---- POLISH 1, THE LAST STAGE: ONE LENGTH OF OLD FIELD WALL ON THE WAY DOWN, AND TWO SMALL THINGS OF THE BOOK (the hound's
    // prints in the yew walk, the old boot in the mire). All of it is made HERE, in the build, after everything of live and of the
    // earlier stages has its place, from a stream of its own (fk.fieldwall: last in the list; the small things draw nothing), in one group
    // ('last stage'). Nothing of it reads the eye, the clock or the metres flown; nothing of it is made, shown, hidden or moved
    // in update; no look is drawn to it; it adds no light. Its triangles lie in the room the budget law keeps (BUDGET.free):
    // they are not counted against it here; the room holds by arithmetic, 3,541 at the most in 3,600 (the law's remark).
    // (THE EMPTY CHAIN AND THE STICK ARE NOT BUILT, by the order's own terms: lastNote.chain and lastNote.stick say why.)
    const lastG = new THREE.Group(); lastG.name = 'last stage';
    const lastNote = { wall: null, prints: null, boot: null, back: 999, triangles: {},
      chain: 'not built: the yard\'s one ruined building is the roofless engine house beyond the mouth, and the line never shows the foot of its wall (the mouth\'s outcrop and the cutting\'s bank hide it; the wall over them is 30 m and more off)',
      stick: 'not built: the foot of the hall\'s door leaves the picture when the lens is still some 26 m from it (the line climbs over the roof)' };
    // (metres on the plan between a place and a stretch a to b; the line's own metre nearest a place and how far it is on the
    // plan; the least metres between anything of this stage and the entry axis behind the entry, kept as lastNote.back)
    const lastSeg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
    const lastM = (x, z) => { let bk = 0, bd = 1e18; for (let k = 0; k < laneOwn; k += 3) { const dx = lanePts[k] - x, dz = lanePts[k + 2] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; bk = k; } } return [bk / 6, Math.sqrt(bd)]; };
    const lastBack = (x, z) => { for (let k = laneOwn; k < lanePts.length; k += 3) lastNote.back = Math.min(lastNote.back, Math.hypot(lanePts[k] - x, lanePts[k + 2] - z)); lastNote.back = Math.min(lastNote.back, Math.hypot(entryAt[0] - x, entryAt[1] - z)); };
    // W. THE FIELD WALL: one length of old drystone wall, 27 slots of 2.6 m (70.2 m), of the world's own make of wall (wallOf's
    // two shapes in the walls' own stone, wallMat: the lit face under the granite's hold, the shaded face lifted as the
    // granite's; each length laid as the newtake's are, from ground to ground and an eighth into its neighbours, 0.95 to
    // 1.12 m to its cope, the lengths at an end or beside the gap slumped to four fifths; every length throws its shadow),
    // RIGHT OF THE WAY DOWN. It begins W.lat metres to the right of the line abreast of a metre of the run S.shoulder + 25 ..
    // S.mire - 41 and RUNS OFF ACROSS THE SLOPE AND AWAY: along the level way at its start (by the drawn ground's fall there,
    // turned W.turn degrees at the most), to the right, straight, and ends abreast of the run (W.over metres past it at the
    // most). ONE TUMBLED GAP of two slots (a spill of three small cobbles in each, as a fallen length of the newtake's is);
    // both ends simply end in two fallen stones. It encloses nothing: one straight run, no return. THE PLACE IS TAKEN BY
    // RULE, in a fixed order: the nearer starts first (W.lat's first list, then its second), in each from the run's lower end
    // upward by W.step metres, at each metre the nearest start and the least turn first; the first is taken where EVERY slot
    // may stand (lastWhy): W.plan metres and more from the line on the plan; off the park, the mire, the wand path, the
    // cuttings and 9 m from the brook; no step of the ground over 0.45 of a slot; no pool nor a pool's rim within 1.5 m of it;
    // W.apart metres from every standing thing, lantern, set stone and hut ring (W.house from a house, 60 m from the
    // cottage's window), W.wall from every other wall (no return, no yard); no made bush of this round's clumps (its edge)
    // and no tree (its crown) within W.apart metres of it on either side, no new fallen block within 3 m; no stone of live of
    // half a metre and more under it and none of 1.2 m and more within W.behind metres (nothing behind it); no trunk or post
    // in it, no plant of live rooted in it; off the fox's beat, 12 m from every pony, 20 m from the man; and no kept sight
    // hidden (sightHid). Where no place holds, no wall stands (lastNote.wall.left).
    { const W = { seg: 2.6, slots: 27, r: 1.7, plan: 10, apart: 8, house: 30, wall: 12, behind: 4, lat: [[12, 14, 16, 19], [22, 26, 30, 35, 40]], turn: [0, 8, -8, 16, -16], step: 2, over: 6, fall: 6 }, rW = fk.fieldwall, Z0 = S.shoulder + 25, Z1 = S.mire - 41, dr = [];
      for (let i = 0; i < W.slots; i++) dr.push([rW.range(0.95, 1.12), rW.range(-0.3, 0.3), rW.range(0.25, 0.75), rW.range(0.5, 0.9), rW.range(0, 6.2832)]);
      dr[0][1] = 0; const gap = 6 + rW.int(0, 9), ends = [0, 1, 2, 3].map(() => [rW.range(0.34, 0.6), rW.range(-0.5, 0.5), rW.range(0, 6.2832)]);
      // (what of live lies near: every stone, wall length, set stone and plant within 110 m of the run's own line)
      const bb = [1e9, -1e9, 1e9, -1e9]; for (let m = Z0; m <= Z1; m += 4) { lineAt(m, 0, c3Q); bb[0] = Math.min(bb[0], c3Q[0] - 110); bb[1] = Math.max(bb[1], c3Q[0] + 110); bb[2] = Math.min(bb[2], c3Q[1] - 110); bb[3] = Math.max(bb[3], c3Q[1] + 110); }
      const inB = (x, z) => x > bb[0] && x < bb[1] && z > bb[2] && z < bb[3];
      const flat = (lists) => { const a = []; for (const [list, kr] of lists) for (const M of list) { const e = M.elements; if (inB(e[12], e[14])) a.push([e[12], e[14], kr * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10]))]); } return a; };
      const stones = flat([[slabs, 1.15], [hillSlabs, 1.15], [farSlabs, 1.15], [boulders, 1], [midBoulders, 1], [smallBoulders, 1], [skirtStones, 1], [skirtSmall, 1]]), walls = flat([[wallNear[0], 1.35], [wallNear[1], 1.35]]), setSt = flat([[menhirs, 1.5], [menhirsB, 1.5]]);
      const plants = []; for (const pl of [heather, gorse, bracken]) for (const p of pl.points) if (inB(p.x, p.z)) plants.push([p.x, p.z]);
      await ctx.yield();
      const lastWhy = (a, b, h) => { const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ga = groundY(a[0], a[1]), gb = groundY(b[0], b[1]), D = (x, z) => lastSeg(x, z, a, b);
        if (!(mz < GATE_Z - 0.6 - 5 || Math.abs(mx) > 64.6 + 5)) return 'the park';
        const zn = zoneAt(P, mx, mz, ZONE); if (zn.mire > 0.02 || zn.wand > 0 || zn.cut > 0.2) return 'the mire'; if (zn.river < 9) return 'the stream';
        if (laneDist(mx, mz, W.r, -999, 999, 16) < W.plan) return 'the line';
        if (Math.abs(gb - ga) > 0.45 * W.seg) return 'a bank';
        if (hagIn(mx, mz, W.r + 1.5)) return 'a pool';
        for (const q of standing) if (D(q[0], q[1]) < q[2] + (q[2] >= 2.5 ? W.house : W.apart)) return 'a made thing';
        for (const q of lanternPts) if (D(q[0], q[2]) < W.apart) return 'a lantern';
        for (const q of huts) if (D(q.x, q.z) < q.r + 0.5 + W.apart) return 'a hut circle';
        for (const q of setSt) if (D(q[0], q[1]) < q[2] + W.apart) return 'a set stone';
        for (const q of walls) if (D(q[0], q[1]) < W.wall) return 'a wall';
        if (D(farAt[0], farAt[2]) < 60) return 'the cottage';
        for (const q of stones) { const d = D(q[0], q[1]); if (q[2] >= 0.5 && d < q[2] + 0.6) return 'granite'; if (q[2] >= 1.2 && d < q[2] + W.behind) return 'a stone by it'; }
        for (const q of c3New) if (q.block && D(q.x, q.z) < q.r + 3) return 'a fallen block';
        for (const q of c3Pts) if (D(q.x, q.z) < q.r + W.apart) return 'a clump';
        for (const q of thornPts) if (D(q.x, q.z) < 3.6 * q.s + W.apart) return 'a tree';
        for (const q of treePts) if (D(q.x, q.z) < 30) return 'a tree';
        for (const q of hard) if (D(q[0], q[1]) < q[2] + 1) return 'a trunk';
        for (const q of plants) if (D(q[0], q[1]) < 0.9) return 'a plant of live';
        { const px = mx - foxA[0], pz = mz - foxA[1], t = clamp(px * foxDir[0] + pz * foxDir[1], 0, foxRun); if (Math.hypot(px - foxDir[0] * t, pz - foxDir[1] * t) < W.r + 1.5) return 'the fox\'s beat'; }
        for (const q of ponyList) if (D(q.x, q.z) < 12) return 'a pony';
        { const fp = figure.object.position; if (D(fp.x, fp.z) < 20) return 'the man'; }
        return sightHid(mx, mz, W.r, (ga + gb) / 2 + h + 0.3) ? 'a sight' : ''; };
      let got = null, tried = 0; const tally = {}, nSt = Math.floor((Z1 - Z0) / W.step) + 1;
      for (const lats of W.lat) { if (got) break;
        for (let j = 0; j < nSt && !got; j++) { const m0 = Z1 - j * W.step;
          for (const lat of lats) for (const turn of W.turn) { if (got) break; tried++; lineAt(m0, lat, c3Q); const hh = Math.hypot(c3T.x, c3T.z) || 1, tx = c3T.x / hh, tz = c3T.z / hh, x0 = c3Q[0], z0 = c3Q[1], pts = [];
            // (ACROSS THE SLOPE: the level way at the start, by the drawn ground's fall over W.fall metres to either side; of its two
            // headings the one that leads to the right of the line, away from it; where the ground has no fall, square off the line)
            const gx = groundY(x0 + W.fall, z0) - groundY(x0 - W.fall, z0), gz = groundY(x0, z0 + W.fall) - groundY(x0, z0 - W.fall), gl = Math.hypot(gx, gz);
            let cx = gl > 0.06 * W.fall ? -gz / gl : -tz, cz = gl > 0.06 * W.fall ? gx / gl : tx; if (cx * -tz + cz * tx < 0) { cx = -cx; cz = -cz; }
            const an = turn * Math.PI / 180, dx = cx * Math.cos(an) - cz * Math.sin(an), dz = cz * Math.cos(an) + cx * Math.sin(an);
            for (let i = 0; i <= W.slots; i++) { const wob = i < W.slots ? dr[i][1] : 0; pts.push([x0 + dx * i * W.seg - dz * wob, z0 + dz * i * W.seg + dx * wob]); }
            const end = lastM(pts[W.slots][0], pts[W.slots][1]); if (end[0] > Z1 + W.over || end[0] < Z0 - W.over) { tally['past the run'] = (tally['past the run'] || 0) + 1; continue; }
            let why = ''; for (let i = 0; i < W.slots && !why; i++) why = lastWhy(pts[i], pts[i + 1], dr[i][0]);
            if (why) tally[why] = (tally[why] || 0) + 1; else got = { pts, m0, lat, turn, end, dx, dz, head: Math.atan2(dx * -tz + dz * tx, dx * tx + dz * tz) * 180 / Math.PI }; }
          await ctx.yield(); } }
      lastNote.wall = { left: got ? null : 'no place holds', tried, tally, run: [Z0, Z1] };
      if (got) { const { pts, dx, dz } = got, mA = [[], []], cob = [], low = (i) => i === 0 || i === W.slots - 1 || i === gap - 1 || i === gap + 2; let least = 99, plan = 99, n = 0; const gapAt = [];
        const stone = (x, z, sz, yaw) => { place(cob, x, lowGround(x, z, sz * 0.7) + 0.05 * sz, z, sz, sz * 0.8, sz * 0.95, yaw, 0); lastBack(x, z); };
        for (let i = 0; i < W.slots; i++) { const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, ga = groundY(a[0], a[1]), gb = groundY(b[0], b[1]), gm = (ga + gb) / 2;
          // (the gap: a spill of three rounded stones in each of its two slots, where the lengths stood)
          if (i === gap || i === gap + 1) { gapAt.push([mx, mz]); for (let k = 0; k < 3; k++) { const f = (k + 0.5) / 3, sz = 0.32 + 0.3 * ((dr[i][3] * (k + 2)) % 1); stone(lerp(a[0], b[0], f) - dz * (k - 1) * 0.5 * dr[i][2], lerp(a[1], b[1], f) + dx * (k - 1) * 0.5 * dr[i][2], sz, dr[i][4] + k); } continue; }
          const h = dr[i][0] * (low(i) ? 0.8 : 1), th = 0.85 * (0.9 + 0.25 * dr[i][2]), ex = (b[0] - a[0]) * 0.12, ez = (b[1] - a[1]) * 0.12, A = [a[0] - ex, ga, a[1] - ez], E = [b[0] + ex, gb, b[1] + ez];
          // (a length laid from A to E as wallLay lays one: the same matrix)
          { const vx = E[0] - A[0], vy = E[1] - A[1], vz = E[2] - A[2], len = Math.hypot(vx, vy, vz), ux = vx / len, uy = vy / len, uz = vz / len, hl = Math.hypot(ux, uz);
            mA[dr[i][3] < 0.7 ? 0 : 1].push(new THREE.Matrix4().set(ux * len / 2.6, -uy * ux / hl * h, -uz / hl * th, (A[0] + E[0]) / 2, uy * len / 2.6, hl * h, 0, (A[1] + E[1]) / 2, uz * len / 2.6, -uy * uz / hl * h, ux / hl * th, (A[2] + E[2]) / 2, 0, 0, 0, 1)); }
          footAt('field wall', A[0], A[2], A[1] - 0.3 * h, 0.3 * h + 0.3); footAt('field wall', E[0], E[2], E[1] - 0.3 * h, 0.3 * h + 0.3);
          least = Math.min(least, laneNote('field wall', laneDist(mx, mz, W.r, gm - 0.4, gm + h + 0.4, 60))); plan = Math.min(plan, laneDist(mx, mz, W.r, -999, 999, 60)); lastBack(mx, mz); n++; }
        // (both ends: two fallen stones beyond the last length, on the wall's own line and a little off it)
        for (let k = 0; k < 4; k++) { const e = k < 2 ? pts[0] : pts[W.slots], sg = k < 2 ? -1 : 1, d = 0.75 + (k % 2) * 0.85, q = ends[k]; stone(e[0] + dx * sg * d - dz * q[1], e[1] + dz * sg * d + dx * q[1], q[0], q[2]); }
        const meshes = [0, 1].filter((k) => mA[k].length).map((k) => T.makeInstances(wallGeo[k], wallMat, mA[k], { castShadow: true, receiveShadow: true, brightness: 0.1 }).object), cobs = T.makeInstances(cobbleFar, rockMat, cob, { receiveShadow: true, brightness: 0.14 }).object;
        meshes.forEach((o, k) => { o.name = 'field wall ' + k; lastG.add(o); }); cobs.name = 'field wall, fallen stones'; lastG.add(cobs);
        const tri = n * wallGeo[0].index.count / 3 + cob.length * cobbleFar.index.count / 3; lastNote.triangles.wall = tri;
        Object.assign(lastNote.wall, { from: pts[0], to: pts[W.slots], metres: [got.m0, got.end[0]], lat: [got.lat, got.end[1]], turn: got.turn, head: got.head, length: W.slots * W.seg, lengths: n, stones: cob.length, gap: gapAt, least, plan, triangles: tri }); }
    }
    await ctx.yield();
    // N1. THE HOUND'S PRINTS IN THE YEW WALK (mending 1 of the last stage: the same place and rule, the FORM made to read from
    // the line): seven prints of a very great dog on the EDGE of the gravel, on the walk's right hand (the east: the left
    // wall stays the darker), 15.5 to 20 m short of the walk's far end. THE GAIT OF A WALKING DOG: they come off the grass,
    // turn PR.turn metres into the gravel and go back to the grass, each PR.step metres from the last along the way it went,
    // left and right of that way by turns (PR.foot), the toes pointing the way it went; THE LAST TWO, nearest the grass, are
    // HALF-PRINTS (toes only) where it sprang off. All on gravel (whole to 2.6 m from the walk's middle; no vertex past
    // 2.4), none on grass, no trail along the walk, none toward the gate, none where the body lay. EACH IS A DOG'S PRINT
    // AND NO MORE, 0.24 m across: ONE broad pad, three-lobed at its back, and FOUR oval toes (six-sided as built) set clear
    // of it by gravel: THE OUTER TWO BY 1.4 cm, THE INNER TWO BY 3.9 cm (measured of PAD and TOE as they stand below; the
    // order asked about 2 cm); no claw, no glow, no scorch. THE GROUND IS ONE HEIGHT FIELD AND CANNOT BE PRESSED, so
    // each lies in a drawn dish: pad and toes DARK (a seventh of the gravel's colour) on a floor a little darker than the
    // walk, and round it a PALE RIM of thrown gravel PR.rim metres wide, PR.rise high at its crest (an inner wall and an
    // outer slope, their normals leaning in and out). No light is added: the moon and the walk's own lamp light the rim.
    // One mesh in the built things' own material; it throws no shadow. No draw is taken: the gait is a rule.
    const lastPrints = ST.makeBuilder(1024), lastBoot = ST.makeBuilder(1024);
    { const PR = { n: 7, half: 2, x: 2.37, turn: 0.9, z: ALLEY.z1 + 20, run: 4.4, step: 0.74, foot: 0.07, lift: 0.012, r: 0.136, rim: 0.036, rise: 0.02 }, gr = pal.gravel, put = [], UP = [0, 1, 0];
      const tone = (k) => [Math.min(1, gr[0] * k), Math.min(1, gr[1] * k), Math.min(1, gr[2] * k)], DARK = tone(0.14), EDGE = tone(0.26), FLOOR = tone(0.8), PALE = tone(1.55), PALE2 = tone(1.2);
      const PAD = [[0, 0.04], [-0.04, 0.034], [-0.076, 0], [-0.086, -0.045], [-0.06, -0.086], [-0.03, -0.066], [0, -0.09], [0.03, -0.066], [0.06, -0.086], [0.086, -0.045], [0.076, 0], [0.04, 0.034]];
      const TOE = [[-0.093, 0.052, 0.45], [-0.034, 0.108, 0.12], [0.034, 0.108, -0.12], [0.093, 0.052, -0.45]];
      // (the way it went: off the grass at the walk's edge, PR.turn metres in and back; its length by 96 pieces; a print at each PR.step of it)
      const way = (t) => [PR.x - PR.turn * Math.sin(Math.PI * t), PR.z - PR.run * t], cum = [0]; for (let i = 1; i <= 96; i++) { const a = way((i - 1) / 96), e = way(i / 96); cum.push(cum[i - 1] + Math.hypot(e[0] - a[0], e[1] - a[1])); }
      const tAt = (s) => { let i = 1; while (i < 96 && cum[i] < s) i++; return (i - 1 + (s - cum[i - 1]) / (cum[i] - cum[i - 1])) / 96; }, s0 = (cum[96] - (PR.n - 1) * PR.step) / 2;
      let least = 99, wide = 0; lastPrints.surf(SURF.PLAIN);
      for (let j = 0; j < PR.n; j++) { const t = tAt(s0 + j * PR.step), a = way(t - 0.004), e = way(t + 0.004), fl = Math.hypot(e[0] - a[0], e[1] - a[1]), fx = (e[0] - a[0]) / fl, fz = (e[1] - a[1]) / fl, rx = -fz, rz = fx, sd = j % 2 ? 1 : -1, w = way(t), cx = w[0] + rx * sd * PR.foot, cz = w[1] + rz * sd * PR.foot, half = j >= PR.n - PR.half;
        // (u across, v the way it went; a vertex y metres over the drawn ground; a triangle wound to face up)
        const vert = (u, v, y, n, c) => { const x = cx + u * rx + v * fx, z = cz + u * rz + v * fz; wide = Math.max(wide, Math.abs(x)); return [lastPrints.v(x, groundY(x, z) + y, z, n[0], n[1], n[2], c[0], c[1], c[2]), x, z]; };
        const up3 = (A, B, C) => { if ((B[2] - A[2]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[2] - A[2]) > 0) lastPrints.tri3(A[0], B[0], C[0]); else lastPrints.tri3(A[0], C[0], B[0]); };
        const fan = (cu, cv, ring, y, cm, ce) => { const m = vert(cu, cv, y, UP, cm), vs = ring.map((q) => vert(q[0], q[1], y, UP, ce)); for (let k = 0; k < vs.length; k++) up3(m, vs[k], vs[(k + 1) % vs.length]); };
        // (the dish: its floor; the rim round it, whole round a print and round the toes alone of a half-print)
        const seg = half ? 5 : 10, a0 = half ? -0.26 : 0, da = half ? 0.733 : 0.62832, ring = [];
        for (let k = 0; k <= seg; k++) { const an = a0 + k * da, cu = Math.cos(an), sv = Math.sin(an), ox = cu * rx + sv * fx, oz = cu * rz + sv * fz, at = (r, y, n, c) => vert(cu * r, 0.027 + sv * r, y, n, c);
          ring.push([at(PR.r - 0.004, 0.005, [-ox * 0.7, 0.71, -oz * 0.7], PALE2), at(PR.r + 0.014, PR.lift + PR.rise, UP, PALE), at(PR.r + PR.rim, 0.004, [ox * 0.7, 0.71, oz * 0.7], PALE2)]); }
        if (!half) fan(0, 0.027, ring.slice(0, seg).map((q, k) => [Math.cos(k * da) * (PR.r - 0.004), 0.027 + Math.sin(k * da) * (PR.r - 0.004)]), 0.006, FLOOR, FLOOR);
        for (let k = 0; k < seg; k++) { const p = ring[k], q = ring[k + 1]; up3(p[0], p[1], q[1]); up3(p[0], q[1], q[0]); up3(p[1], p[2], q[2]); up3(p[1], q[2], q[1]); }
        // (the pad, three-lobed at its back; the four toes, oval, the outer two splayed)
        if (!half) fan(0, -0.028, PAD, PR.lift, DARK, EDGE);
        for (const q of TOE) { const cs = Math.cos(q[2]), sn = Math.sin(q[2]), hex = []; for (let k = 0; k < 6; k++) { const u = Math.cos(k * 1.0472) * 0.026, v = Math.sin(k * 1.0472) * 0.038; hex.push([q[0] + u * cs - v * sn, q[1] + u * sn + v * cs]); } fan(q[0], q[1], hex, PR.lift, DARK, EDGE); }
        const g = groundY(cx, cz); least = Math.min(least, laneNote('hound prints', laneDist(cx, cz, 0.18, g, g + 0.04, 12))); lastBack(cx, cz); put.push([cx, cz, lastM(cx, cz)[0]]); }
      const mesh = new THREE.Mesh(own(lastPrints.toGeometry()), mats.facades); mesh.receiveShadow = true; mesh.name = 'hound prints'; lastG.add(mesh);
      const mid = way(0.5), lamp = Math.min(...lanternPts.map((q) => Math.hypot(q[0] - mid[0], q[2] - mid[1])));
      lastNote.triangles.prints = lastPrints.triangles; lastNote.prints = { n: PR.n, half: PR.half, at: put, short: [put[0][1] - ALLEY.z1, put[PR.n - 1][1] - ALLEY.z1], step: PR.step, across: 0.24, wide, lamp, least, triangles: lastPrints.triangles }; }
    await ctx.yield();
    // N2. THE OLD BLACK BOOT, where the prose has it (mending 1 of the last stage: the same rule of place, the FORM made to
    // read from the line): in the mire beside the plank way toward the mine, BT.lat metres from the way's middle (1.5 m from
    // the planks' edge), on the OTHER HAND of the way from the hound's beat and BT.past metres and more past the boards'
    // crossing of the lead, BT.off metres and more from both hounds' rounds: at the FIRST place along the way, by the half
    // metre, that is beside the boards (a plank within 2 m), dry (the lowest ground under it BT.dry m over the pools' level;
    // no pool of the mire, no hag pool nor its rim, no cutting), clear of every hard and standing thing and of live's
    // tussocks, and 2 m and more from the line. THE MIRE'S COTTON GRASS OF LIVE KEEPS 4 M FROM THE WAY, so the boot lies on
    // a tuft of its own: a low pale cushion 1.36 m across with short blades and five white heads of cotton grass, the heads
    // beside and behind the boot, none between it and the line. ONE BOOT, whole, worn, EMPTY, 0.34 m long, its leg 0.26 m:
    // IT LIES ON ITS SIDE ON the cushion's slope THAT FACES THE LINE AT THE PLACE BT.fore METRES BEFORE THE LINE PASSES
    // NEAREST (the comer along the line has the boot before him there; where the line passes nearest it lies abreast), its
    // flank up and turned to that place, its leg up the slope, ITS TOE ACROSS, pointing to the way and a little along it (the
    // way's heading squared to the facing): the L of leg and foot whole to the comer, not end on. Black leather with a dull
    // sheen along its upper curve and a scuffed toe; A PALER WORN SOLE AND HEEL, the strip along its lower edge; the top of the
    // leg LYING OPEN, its pale lining round THE DARK OVAL OF THE EMPTY MOUTH; a pale tongue out, pale lacing on the leg's
    // front and two loose pale laces, one over the black of the foot, one over the tuft. Never upright, nothing in it,
    // nothing marked on it; nothing sinks. Where no such place is, no boot lies (lastNote.boot.left).
    { const BT = { lat: 2.2, past: 12, near: 1.3, dry: 0.25, off: 10, r: 0.75, fore: 9, at: 0.51, th: 0.045 }, runs = scene.userData.boards.runs, q = [0, 0], qa = [0, 0], qb = [0, 0], hm = P.houndMid; let put = null, tries = 0;
      P.wayAt(AT.lead, 10, qa); P.wayAt(AT.lead, -10, qb); const hand = Math.hypot(hm[0] - qa[0], hm[1] - qa[1]) <= Math.hypot(hm[0] - qb[0], hm[1] - qb[1]) ? 1 : -1;
      for (let s = AT.lead + BT.past; s <= AT.arcEnd - 4 && !put; s += 0.5) { if (!runs.some((r) => s >= r[0] - BT.near && s <= r[1] + BT.near)) continue; tries++;
        P.wayAt(s, -hand * BT.lat, q); const x = q[0], z = q[1], g = groundY(x, z);
        if (lowGround(x, z, 0.6) < poolLevel + BT.dry) continue;
        const zn = zoneAt(P, x, z, ZONE); if (zn.pool > 0.3 || zn.cut > 0.2) continue;
        if (roundOff(x, z) < BT.off || hardIn(x, z, 0.9) || hagIn(x, z, BT.r)) continue;
        if (standing.some((t) => Math.hypot(t[0] - x, t[1] - z) < t[2] + 1.5) || lanternPts.some((t) => Math.hypot(t[0] - x, t[2] - z) < 2)) continue;
        if (mounds.some((t) => Math.hypot(t[0] - x, t[1] - z) < t[2] + 0.6)) continue;
        if (laneDist(x, z, BT.r, g, g + 0.5, 12) < 2.0) continue;
        put = [x, z, g, s]; }
      lastNote.boot = { left: put ? null : 'no dry place beside the boards', hand: -hand, tries };
      if (put) { const [x, z, g, s] = put, wt = wayTan(s), b = lastBoot, kq = Math.max(0, Math.round((lastM(x, z)[0] - BT.fore) * 6));
        // (c: the level heading from the tuft to the line's place BT.fore metres before the nearest; t: the way's heading, squared to c: the toe's.
        // The boot's own frame: X its toe, Y up its leg, Z its upper flank's normal: the cushion's slope that faces c, the leg up it)
        const c0 = [lanePts[kq] - x, lanePts[kq + 2] - z], cl = Math.hypot(c0[0], c0[1]) || 1, cx = c0[0] / cl, cz = c0[1] / cl, dt = wt[0] * cx + wt[1] * cz, t0 = [wt[0] - dt * cx, wt[1] - dt * cz], tl = Math.hypot(t0[0], t0[1]) || 1, tx = t0[0] / tl, tz = t0[1] / tl;
        const PROF = [[0.68, 0], [0.62, 0.03], [0.4, 0.16], [0, 0.17]], tilt = Math.atan2(PROF[2][1] - PROF[1][1], PROF[1][0] - PROF[2][0]), ca = Math.cos(tilt), sa = Math.sin(tilt), hS = PROF[1][1] + (PROF[2][1] - PROF[1][1]) * (PROF[1][0] - BT.at) / (PROF[1][0] - PROF[2][0]);
        const X = [tx, 0, tz], Y = [-cx * ca, sa, -cz * ca], Z = [cx * sa, ca, cz * sa], rh = X[0] * (Y[1] * Z[2] - Y[2] * Z[1]) + X[1] * (Y[2] * Z[0] - Y[0] * Z[2]) + X[2] * (Y[0] * Z[1] - Y[1] * Z[0]) > 0;
        const O = [0, 1, 2].map((i) => [x + cx * BT.at, g - 0.02 + hS, z + cz * BT.at][i] + Z[i] * (BT.th + 0.008) - X[i] * 0.04 - Y[i] * 0.13);
        const LEATHER = lin('#1d1b19'), SHEEN = lin('#4b4640'), WORN = lin('#5f564a'), SOLE = lin('#e7d5ad'), HEEL = lin('#cdb98f'), WELT = lin('#8f7d5f'), INSIDE = lin('#030303'), LINING = lin('#8b7e68'), TONGUE = lin('#b3a588'), LACE = lin('#efe6c8'), HEAD = lin('#f4f6ff'), STALK = lin('#7d8458'), TUFT = lin('#8f8a62'), STRAW = lin('#b5ab82');
        // (the tuft: a low pale cushion, short blades round its far rim, five heads of cotton grass on short stalks beside and behind
        // the boot: angles from c toward the toe)
        const dir = (an, r) => [x + (cx * Math.cos(an) + tx * Math.sin(an)) * r, z + (cz * Math.cos(an) + tz * Math.sin(an)) * r];
        b.surf(SURF.PLAIN).col(TUFT, 0.62, 1.0).lathe(x, g - 0.02, z, PROF, 10, { smooth: true });
        for (let j = 0; j < 7; j++) { const an = 1.0 + j * 0.53, p = dir(an, 0.5 + 0.04 * (j % 3)), e = dir(an, 0.72 + 0.04 * (j % 3)), sx = (e[1] - p[1]) * 0.14, sz = -(e[0] - p[0]) * 0.14, p0 = [p[0] + sx, g + 0.04, p[1] + sz], p1 = [p[0] - sx, g + 0.04, p[1] - sz], tip = [e[0], g + 0.15 + 0.05 * (j % 2), e[1]];
          b.col(j % 2 ? TUFT : STRAW).tri(p0, p1, tip).tri(p1, p0, tip); }
        for (const h of [[1.3, 0.52, 0.27, 0.05], [2.0, 0.45, 0.37, 0.06], [2.7, 0.4, 0.31, 0.045], [3.3, 0.47, 0.4, 0.055], [3.9, 0.53, 0.29, 0.06]]) { const p = dir(h[0], h[1]), e = dir(h[0], h[1] + 0.05), top = [e[0], g + h[2], e[1]];
          b.col(STALK).tri([p[0] - 0.01, g + 0.06, p[1]], [p[0] + 0.01, g + 0.06, p[1]], top).tri([p[0] + 0.01, g + 0.06, p[1]], [p[0] - 0.01, g + 0.06, p[1]], top); b.col(HEAD, 1.6, 2.0).sphere(top[0], top[1], top[2], h[3], 5, 3, { sy: 1.1 }); }
        // (the boot's own make: a vertex and a triangle in its frame; a PILLOW: an outline of its side, counter-clockwise seen from the
        // upper flank, its upper face drawn in at zc + th, its edge at zc, its lower rim at zc - th; a RIBBON along places of its frame)
        const vtx = (p, n, c) => b.v(O[0] + X[0] * p[0] + Y[0] * p[1] + Z[0] * p[2], O[1] + X[1] * p[0] + Y[1] * p[1] + Z[1] * p[2], O[2] + X[2] * p[0] + Y[2] * p[1] + Z[2] * p[2], X[0] * n[0] + Y[0] * n[1] + Z[0] * n[2], X[1] * n[0] + Y[1] * n[1] + Z[1] * n[2], X[2] * n[0] + Y[2] * n[1] + Z[2] * n[2], c[0], c[1], c[2]);
        const t3 = (i, j, k) => { if (rh) b.tri3(i, j, k); else b.tri3(i, k, j); };
        const pillow = (pts, zc, th, ins, colOf) => { const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n, top = [], mid = [], bot = [], m = vtx([mx, my, zc + th * 1.08], [0, 0, 1], colOf(mx, my, 2));
          for (const p of pts) { const ox = p[0] - mx, oy = p[1] - my, ol = Math.hypot(ox, oy) || 1, ux = ox / ol, uy = oy / ol, qx = mx + ox * ins, qy = my + oy * ins;
            top.push(vtx([qx, qy, zc + th], [ux * 0.4, uy * 0.4, 0.92], colOf(qx, qy, 1))); mid.push(vtx([p[0], p[1], zc], [ux, uy, 0], colOf(p[0], p[1], 0))); bot.push(vtx([qx, qy, zc - th], [ux * 0.4, uy * 0.4, -0.92], colOf(p[0], p[1], 0))); }
          for (let i = 0; i < n; i++) { const j = (i + 1) % n; t3(m, top[i], top[j]); t3(mid[i], mid[j], top[j]); t3(mid[i], top[j], top[i]); t3(mid[j], mid[i], bot[i]); t3(mid[j], bot[i], bot[j]); } };
        const ribbon = (pts, w, c) => { for (let i = 0; i + 1 < pts.length; i++) { const p = pts[i], e = pts[i + 1], dx = e[0] - p[0], dy = e[1] - p[1], dl = Math.hypot(dx, dy) || 1, px = -dy / dl * w, py = dx / dl * w, N = [0, 0, 1];
          const i0 = vtx([p[0] - px, p[1] - py, p[2]], N, c), i1 = vtx([e[0] - px, e[1] - py, e[2]], N, c), i2 = vtx([e[0] + px, e[1] + py, e[2]], N, c), i3 = vtx([p[0] + px, p[1] + py, p[2]], N, c); t3(i0, i1, i2); t3(i0, i2, i3); t3(i0, i2, i1); t3(i0, i3, i2); } };
        // (the paler sole and heel along the lower edge; the foot, its toe scuffed, a dull sheen along its upper curve; the leg's shaft)
        const tread = (pts, y0, y1, c) => { const n = pts.length, m = vtx([pts.reduce((a, p) => a + p[0], 0) / n, y0, 0], [0, -1, 0], c), lo = pts.map((p) => vtx([p[0], y0, p[1]], [0, -1, 0], c)), ed = pts.map((p) => { const l = Math.hypot(p[0] - 0.04, p[1]) || 1; return [vtx([p[0], y0, p[1]], [(p[0] - 0.04) / l, 0, p[1] / l], WELT), vtx([p[0], y1, p[1]], [(p[0] - 0.04) / l, 0, p[1] / l], WELT)]; });
          for (let i = 0; i < n; i++) { const j = (i + 1) % n; t3(m, lo[i], lo[j]); t3(ed[j][0], ed[i][0], ed[i][1]); t3(ed[j][0], ed[i][1], ed[j][1]); } };
        tread([[-0.128, 0], [-0.118, -0.03], [-0.07, -0.036], [-0.02, -0.028], [0.07, -0.046], [0.15, -0.05], [0.196, -0.032], [0.21, 0], [0.196, 0.032], [0.15, 0.05], [0.07, 0.046], [-0.02, 0.028], [-0.07, 0.036], [-0.118, 0.03]], 0, 0.036, SOLE);
        tread([[-0.128, 0], [-0.118, -0.03], [-0.07, -0.036], [-0.052, -0.034], [-0.052, 0.034], [-0.07, 0.036], [-0.118, 0.03]], -0.014, 0, HEEL);
        pillow([[-0.122, 0.034], [0.2, 0.034], [0.21, 0.052], [0.186, 0.078], [0.11, 0.092], [0.03, 0.126], [-0.128, 0.126], [-0.13, 0.08]], 0, BT.th, 0.84, (px, py, lv) => (lv > 0 && py > 0.066 ? (px > 0.15 ? WORN : SHEEN) : LEATHER));
        pillow([[-0.128, 0.1], [0.004, 0.1], [-0.004, 0.18], [-0.126, 0.18]], 0, BT.th, 0.84, (px, py, lv) => (lv > 0 && px > -0.04 ? SHEEN : LEATHER));
        // (the top of the leg lying open: its lower flank with the pale lining up, and on it the dark oval of the empty mouth)
        pillow([[-0.126, 0.17], [-0.004, 0.17], [-0.008, 0.26], [-0.12, 0.26]], 0.012 - BT.th, 0.012, 0.9, (px, py, lv) => (lv > 0 ? LINING : LEATHER));
        { const m = vtx([-0.064, 0.214, 0.03 - BT.th], [0, 0, 1], INSIDE), vs = []; for (let k = 0; k < 8; k++) vs.push(vtx([-0.064 + Math.cos(k * 0.7854) * 0.042, 0.214 + Math.sin(k * 0.7854) * 0.034, 0.03 - BT.th], [0, 0, 1], INSIDE)); for (let k = 0; k < 8; k++) t3(m, vs[k], vs[(k + 1) % 8]); }
        // (the tongue out at the leg's front; the lacing on the leg's front; the two loose laces)
        ribbon([[-0.122, 0.171, BT.th + 0.005], [-0.008, 0.171, BT.th + 0.005]], 0.008, LINING); ribbon([[-0.004, 0.15, 0.02], [0.04, 0.215, -0.01]], 0.024, TONGUE);
        for (const y of [0.112, 0.136, 0.16]) ribbon([[-0.04, y - 0.006, BT.th + 0.006], [0.002, y + 0.006, BT.th * 0.5]], 0.005, LACE);
        ribbon([[-0.006, 0.172, BT.th + 0.004], [0.05, 0.12, BT.th + 0.008], [0.1, 0.06, BT.th + 0.01], [0.135, -0.02, 0.03], [0.16, -0.085, -0.035]], 0.006, LACE);
        ribbon([[-0.012, 0.178, BT.th + 0.004], [0.07, 0.21, 0], [0.14, 0.18, -0.04], [0.2, 0.2, -0.05]], 0.006, LACE);
        const mesh = new THREE.Mesh(own(b.toGeometry()), mats.facades); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'old boot'; lastG.add(mesh);
        const least = laneNote('old boot', laneDist(x, z, BT.r, g, g + 0.5, 12)); lastBack(x, z);
        lastNote.triangles.boot = b.triangles; Object.assign(lastNote.boot, { at: [x, z], way: s, metre: lastM(x, z)[0], plank: s >= AT.lead && runs.some((r) => s >= r[0] && s <= r[1]) ? BT.lat - 0.7 : Math.hypot(BT.lat - 0.7, Math.min(...runs.map((r) => Math.max(r[0] - s, s - r[1], 0)))), dry: lowGround(x, z, 0.6) - poolLevel, rounds: roundOff(x, z), face: [cx, cz], toe: [tx, tz], tilt, long: 0.338, leg: 0.26, least, triangles: lastNote.triangles.boot }); }
    }
    scene.add(lastG); lastNote.triangles.all = (lastNote.triangles.wall || 0) + (lastNote.triangles.prints || 0) + (lastNote.triangles.boot || 0); scene.userData.last = lastNote;
    await ctx.yield();

    // ---- THE LANE, closed: what is built by a rule of the place is measured whole against the line (the sifted lists were measured as
    // they were made), then the eye's height over the land and the ring's fit. The least distance of every kind is kept with the scene.
    { const N = laneNote, bx = (kind, x0, x1, z0, z1, y1, y0) => N(kind, laneBox(x0, x1, z0, z1, y1, y0)), cy = (kind, x, z, r, y0, y1) => N(kind, laneDist(x, z, r, y0, y1));
      // (the hall's roof by its true shape: its two slopes in strips a metre deep, each to the higher of its two edges with the
      // courses' drip edges on it; the ridge's cap; every dormer by its walls and its gable's ridge with its eaves; the
      // lantern roof by its cap's whole breadth to its top; every chimney by its shaft's round to its pots' tops)
      { const rz0 = zb + 0.6, rz1 = zf - 0.6, rzm = (rz0 + rz1) / 2, roofAt = (z) => HALL.eaves + 0.1 + (HALL.ridge - HALL.eaves - 0.1) * Math.max(0, 1 - Math.abs(z - rzm) / (rz1 - rzm));
        for (let z = zb; z < zf; z += 1) { const z1 = Math.min(zf, z + 1); bx('hall roof', -tx + tw, tx - tw, z, z1, Math.max(roofAt(z), roofAt(z1), z < rzm && z1 > rzm ? HALL.ridge : 0) + 0.12); }
        bx('hall roof', -tx + tw, tx - tw, rzm - 0.2, rzm + 0.2, HALL.ridge + 0.24);
        for (const dx of DORMERS) bx('dormer', dx - DORM.half - DORM.eave, dx + DORM.half + DORM.eave, DORM.z0 - DORM.eave, DORM.z1 + 0.2 + DORM.eave, roofAt(DORM.z0) - 0.1 + DORM.gable + 0.05);
        bx('roof lantern', -1.45, 1.45, rzm - 1.45, rzm + 1.45, HALL.ridge + ROOF_LANTERN); }
      for (const sx of [-1, 1]) { bx('tower', sx * tx - tw - 0.3, sx * tx + tw + 0.3, zf - 6.2, zf + 1.4, HALL.towerH + 1.1); bx('tower', sx * (tx + tw - 0.6) - 1.15, sx * (tx + tw - 0.6) + 1.15, zf - 6.0, zf - 3.9, HALL.towerH + 4.1);
        bx('wing', sx > 0 ? tx + tw : -tx - tw - wingW, sx > 0 ? tx + tw + wingW : -tx - tw, zb + 1.5, zf - 1, wingH + 3.6); bx('lodge pillar', sx * 3.5 - 0.73, sx * 3.5 + 0.73, -9.73, -8.27, 5.4); bx('lodge pillar', sx * 2.89, sx * 2.95, -12.5, -9.55, 3.05);
        passages['the lodge gates'].push(['pillar', sx * 3.5 - 0.73, sx * 3.5 + 0.73, -9.73, -8.27, 0, 5.4], ['gate leaf', sx * 2.89, sx * 2.95, -12.5, -9.55, 0, 3.05]);
        bx('garden wall', sx * gH - 0.4, sx * gH + 0.4, zg1, zg0, 3.0); bx('garden wall', sx * (ALLEY.half + ALLEY.thick + 0.6), sx * gH, zg1 - 0.4, zg1 + 0.4, 4.6); bx('garden wall', sx * (tx + tw - 1), sx * gH, zg0 - 0.4, zg0 + 0.4, 3.0); }
      for (const st of stacks) cy('chimney', st[0], st[2], st[3], 0, st[1]);
      bx('porch', -3.1, 3.1, zf, zf + 3.85, 7.1);
      // (the yew by its own points: every corner of its walls, cut ends, buttresses and garden hedges)
      for (let k = 0; k < yewPos.length; k += 3) N('yew', laneDist(yewPos[k], yewPos[k + 2], 0, yewPos[k + 1], yewPos[k + 1], 5));
      for (const sg of [-1, 1]) { cy('gate pier', sg * PIER_X, GATE_Z, 0.85, 0, 4.2); bx('gate wall', Math.min(sg * 0.62, sg * (PIER_X - 0.45)), Math.max(sg * 0.62, sg * (PIER_X - 0.45)), GATE_Z - 0.35, GATE_Z + 0.35, 1.05); bx('wicket', sg * 0.62 - 0.22, sg * 0.62 + 0.22, GATE_Z - 0.22, GATE_Z + 0.22, 1.3); }
      bx('wicket', -0.75, -0.69, GATE_Z - 1.4, GATE_Z - 0.2, 1.07);
      bx('summer-house', SH.x0 - 0.5, SH.x1 + 0.5, SH.z0 - 0.5, SH.z1 + 0.5, 4.75);
      for (const q of peatAt) cy('peat bank', q[0], q[2], 9, q[1] - 1, q[1] + 1.5);
      for (const p of thornPts) cy('thorn', p.x, p.z, 3.6 * p.s, p.y, p.y + 6.2 * p.s);
      // the mine, in the island's frame: the props and caps of the mouth, the engine house's walls, the stack, the wheel and its launder,
      // the lantern posts
      for (const sd of [-1, 1]) { let q = isleXZ(-3.4, sd * propOut); cy('mine timber', q[0], q[1], 0.45, floorY, floorY + capOut); q = isleXZ(0.6, sd * (PR + 0.9)); cy('mine timber', q[0], q[1], 0.45, floorY, floorY + capIn);
        for (let k = 0; k < 3; k++) { q = isleXZ(-30 + k * 10.5, sd * (LZ - 0.3)); cy('lantern post', q[0], q[1], 2.0, floorY, floorY + gAt(-30 + k * 10.5, sd * LZ) + 3.0); } }
      for (let z = -(propOut + 0.9); z <= propOut + 0.9; z += 0.8) { const q = isleXZ(-3.4, z); cy('mine timber', q[0], q[1], 0.4, floorY + capOut - 0.25, floorY + capOut + 0.25); }
      for (let x = EX0; x <= EX1; x += 1) { const q = isleXZ(x, EZ1 - 0.6); cy('engine house', q[0], q[1], 0.85, floorY, floorY + ey0 + EW); }
      for (let z = EZ0; z <= EZ1; z += 1) { const q = isleXZ(EX0 + 0.6, z); cy('engine house', q[0], q[1], 0.85, floorY, floorY + ey0 + EW + EG + 1.5); }
      { const q = isleXZ(SKX, SKZ); cy('mine stack', q[0], q[1], 2.9, floorY, floorY + ey0 + SKH); }
      // (the wheel as it stands, its piers and stays, the platform under it, the launder and its trestles)
      for (let k = -WR_; k <= WR_ + LL; k += 1.5) { const q = k <= WR_ ? [wheelAt[0] + k * ydR[0], wheelAt[1] + k * ydR[1]] : [wheelAt[0] + (k - WR_) * yd[0], wheelAt[1] + (k - WR_) * yd[1]]; cy(k <= WR_ ? 'wheel' : 'launder', q[0], q[1], k <= WR_ ? 4.4 : 2.9, k <= WR_ ? wheelBase - 1 : wheelBase, wheelY + WR_ + 2.2); }
      for (let k = -WPX; k <= WPX; k += 1.5) { const q = [wheelAt[0] + k * ydR[0], wheelAt[1] + k * ydR[1]]; cy('wheel platform', q[0], q[1], WPZ + 0.3, wheelBase - 4, wheelBase + 0.2); }
    }
    // (the eye over the land as it is drawn: over the gravel of the walk, where nothing grows, and over the open ground apart)
    let lowest = Infinity, lowAt = 0, lowGravel = Infinity; const hits = [];
    let lowPath = Infinity;
    for (let k = 0; k < laneOwn; k += 3) { const h = lanePts[k + 1] - groundY(lanePts[k], lanePts[k + 2]), Z = zoneAt(P, lanePts[k], lanePts[k + 2], ZONE); if (Z.gravel > 0.5) lowGravel = Math.min(lowGravel, h); else if (Z.lane > 0.5 || Z.wand > 0.5) lowPath = Math.min(lowPath, h); else if (h < lowest) { lowest = h; lowAt = k / 6; } }
    laneNote('land under the eye', lowest); laneNote('gravel under the eye', lowGravel); laneNote('the mire\'s firm ground under the eye', lowPath);
    // (and the land under the entry axis behind the entry)
    { let lowBack = Infinity; for (let k = laneOwn; k < lanePts.length; k += 3) lowBack = Math.min(lowBack, lanePts[k + 1] - groundY(lanePts[k], lanePts[k + 2])); laneNote('land under the entry axis behind the entry', lowBack); }
    for (const M of slabs) { const e = M.elements, r = 1.15 * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10])), hy = 0.4 * Math.hypot(e[4], e[5], e[6]), ix = e[12] - I[0], iz = e[14] - I[1], iw = ix * yd[0] + iz * yd[1], il = ix * ydR[0] + iz * ydR[1];
      if (iw > -40 && iw < 0.5 && Math.abs(il) - r * 0.85 < PR && e[13] + hy > yEnd - PR && e[13] - hy < yEnd + PR) hits.push('granite in the ring\'s tube ' + (-iw).toFixed(1) + ' m before it, ' + il.toFixed(1) + ' m aside'); }
    // (the bar of each kind: the bare floor under the eye (the land's turf and the walk's gravel) EYE_FLOOR, 2.0 m of clear air
    // under the lens: the line is laid ROW_EYE over the way between the stone rows and WALK_EYE over the walk, and the
    // drawn ground stands a hand or two over the plan's in places; ground cover the grass law's metre; everything else,
    // the boards and the mire's firm ground with them, the lane's 2.5 m)
    const COVERS = { 'grass tuft': 1, tussock: 1, 'near stone': 1, 'cotton grass': 1 }, EYE_FLOOR = 2.0, FLOORS = { 'land under the eye': 1, 'gravel under the eye': 1 };
    for (const k in laneLeast) if (laneLeast[k] < (FLOORS[k] ? EYE_FLOOR : COVERS[k] ? COVER_M : LANE_M)) hits.push(k + ' at ' + laneLeast[k].toFixed(2) + ' m');
    for (const k in shadeOff) if (shadeOff[k][0] < 0 || shadeOff[k][1] > SHADE_UP + 0.005 || shadeOff[k][5] > SHADE_FLOAT) hits.push('the shade of the ' + k + ' ' + shadeOff[k][0].toFixed(2) + ' to ' + shadeOff[k][1].toFixed(2) + ' m off the drawn ground');
    scene.userData.shades = shadeOff;
    scene.userData.lane = { least: laneLeast, left: laneLeft, hits, lowAt };
    // (the engine house and its stack on the plan, for the count of what hides the hound's fire: my tools' r8fire.mjs)
    // (the engine house: its footing goes 3 m under its floor, and it stands cut into the hill's foot: the bank may lie up to a
    // metre against its back wall)
    for (const c of [[EX0, EZ0], [EX1, EZ0], [EX1, EZ1], [EX0, EZ1]]) { const q = isleXZ(c[0], c[1]); footAt('engine house', q[0], q[1], floorY + ey0 - 3, 4.0); }
    { const q = isleXZ(SKX, SKZ); footAt('mine stack', q[0], q[1], floorY + ey0 - 3, 3.5); }
    // (the wheel's platform: its four corners; in the wheel's frame x runs across the yard's axis and z up it)
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) footAt('wheel', wheelAt[0] - c[0] * (WR_ + 1.5) * ydR[0] + c[1] * 5 * yd[0], wheelAt[1] - c[0] * (WR_ + 1.5) * ydR[1] + c[1] * 5 * yd[1], wheelBase - PLAT_DOWN, PLAT_DOWN + 0.3);
    scene.userData.feet = feet; scene.userData.poolLevel = poolLevel;
    scene.userData.ruins = P.ruins.map((R) => ({ k: R.k, x: R.x, z: R.z, high: R.top - poolLevel, lit: false }));
    // (the hounds' skins, for the count that mirrors their shader's law: the skinned mesh and its bones' matrices as the shader reads them)
    { const skinOf = (h) => { let m = null; h.object.traverse((o2) => { if (!m && o2.isMesh && o2.geometry.attributes.aSkin) m = o2; }); return { mesh: m, bones: h.skin.u.uBones.value }; };
      scene.userData.skins = { hound: skinOf(hound), ghost: ghost ? skinOf(ghost) : null }; }
    scene.userData.mine = { house: [isleXZ(EX0, EZ0), isleXZ(EX1, EZ0), isleXZ(EX1, EZ1), isleXZ(EX0, EZ1)], houseTop: floorY + ey0 + EW, stack: [...isleXZ(SKX, SKZ), 2.9, floorY + ey0 + SKH] };
    if (hits.length) console.warn('moor-under-the-fog-bank: ' + hits.length + ' places where the lane is not kept: ' + hits.slice(0, 5).join('; '));
    // (the kit's own plants, each made with a material of the kit's: the grass, the bracken and heather, the reeds, the flowers.
    // Every one of them takes the place's lights as the oaks' leaves do, before anything is compiled)
    { const done = new Set([leafMat, barkMat]); let n = 0;
      scene.traverse((o3) => { const m = o3.material; if (!m || Array.isArray(m) || done.has(m) || !m.isMeshLambertMaterial || typeof m.customProgramCacheKey !== 'function') return;
        if (!String(m.customProgramCacheKey()).startsWith('flora-wind')) return; done.add(m); lampsOn(m, 'plant-' + (n++), { world: 'vFloraWorld', soft: 0.8, k: 1.0 }); }); }
    await sky.prewarm(ctx.renderer, null, scene);

    // ---- gaze. Each pull's weight is the share of the direction it takes from the route's own look ahead (the long look's stands
    // above, with its law: FAR_W in layLook; the others each at its own pull below; none over 1); each place is worked out from u inside its own function.
    // (the places and the metres of each pull's ramp are the plan's, by the pace: P.pulls, laid in layLook)
    const { FIG_IN, HOUND_IN, sLet } = P.pulls, [parkA, parkB, parkIn] = P.pulls.park, manUp0 = P.pulls.man[3], manUp1 = P.pulls.man[4], manOut = P.pulls.man[5];
    const U = (s) => clamp(s / L, 0, 1), hs = {}, gs = {}, showEye = new THREE.Vector3(), showAt = new THREE.Vector3(P.showAt[0], P.showAt[1], P.showAt[2]), figAt = new THREE.Vector3(F.x, F.y, F.z);
    scene.userData.pulls = P.pulls;
    const gateAt = new THREE.Vector3(0, GATE_OVER - 0.7, ALLEY.z1), aheadV = new THREE.Vector3(), figEye = new THREE.Vector3(), beatAt = new THREE.Vector3(P.houndMid[0], MIRE_Y + 1.5, P.houndMid[1]);
    // (a pull that would begin as a quick turn begins instead in the direction the camera already looks in, 24 m down the line, and
    // that direction is turned at an even rate to its own place (turnTo); the round's count, a replay of the engine's camera, measures every turn that comes of it)
    const eyeV = new THREE.Vector3(), dirA = new THREE.Vector3(), dirB = new THREE.Vector3();
    // (a direction between two places as the eye sees them at a metre of the line: `ang` radians from the direction of `b` toward
    // the direction of `a`, and no further than `a` (or `part` of the whole way from one to the other, where that is handed);
    // the place handed back stands 24 m from the eye on it)
    const dirC = new THREE.Vector3(), dirD = new THREE.Vector3(), eyeC = new THREE.Vector3();
    const offBy = (mF, a, b, ang, out, part) => {
      path.posAtDist(mF, eyeC); dirC.subVectors(b, eyeC).normalize(); dirD.subVectors(a, eyeC).normalize();
      const full = dirC.angleTo(dirD), k = full < 1e-4 ? 0 : part ?? Math.min(1, ang / full);
      if (k <= 0 || full > 3.12) return out.copy(eyeC).addScaledVector(dirC, 24);
      if (k >= 1) return out.copy(eyeC).addScaledVector(dirD, 24);
      dirC.multiplyScalar(Math.sin((1 - k) * full) / Math.sin(full)).addScaledVector(dirD, Math.sin(k * full) / Math.sin(full));
      return out.copy(eyeC).addScaledVector(dirC, 24);
    };
    // (the angle between two places as the eye sees them at a metre of the line)
    const angAt = (mF, a, b) => { path.posAtDist(mF, eyeC); dirC.subVectors(b, eyeC).normalize(); dirD.subVectors(a, eyeC).normalize(); return dirC.angleTo(dirD); };
    // (a pull that comes on: the DIRECTION looked at goes over from the route's own, 24 m down the line, to the pull's place by an
    // angle that turns evenly with k; the place handed to the engine stands 24 m from the eye on that direction)
    const turnTo = (mF, at, k) => {
      if (k >= 1) return at;
      path.posAtDist(mF, eyeV); path.posAtDist(Math.min(L, mF + 24), aheadV);
      if (k <= 0) return at.copy(aheadV);
      dirA.subVectors(aheadV, eyeV).normalize(); dirB.subVectors(at, eyeV).normalize();
      const a = dirA.angleTo(dirB);
      if (a < 1e-4) return at;
      dirA.multiplyScalar(Math.sin((1 - k) * a) / Math.sin(a)).addScaledVector(dirB, Math.sin(k * a) / Math.sin(a));
      return at.copy(eyeV).addScaledVector(dirA, 24);
    };
    // THE CAMERA'S TWO MEASURES: a brisk span is a stretch of the flight in which an angle (the yaw or the pitch, of the gaze the
    // engine is handed or of the eased camera) goes one way at 5 degrees a second and more (its rate smoothed over a tenth of
    // a second); a one-way swing is a stretch in which it goes one way at all. EVERY TURN OF TEN DEGREES AND MORE IS LAID TO
    // LAST 1.65 s AND MORE BY BOTH MEASURES, on both cameras, after an entry at any clock: the line's own turns by their
    // radii and the drape's turn, the look's moves by LOOK_S. The round's count (a replay of the engine's own camera, in the
    // builder's report) counts both on every seed it is handed, and that count, not this line, is what is so.
    // THE LONG LOOK. The engine looks 24 m down the line, so where the line itself turns short the gaze turns short with it:
    // on the way down on to the mire. Over that stretch the gaze is drawn half way to the line's OWN place 60 m on: the same
    // turn, begun sooner and taken more slowly. Its stretch, its ends (each a place of the line) and its ramps are laid in
    // the plan (layLook, P.farPois). It is a pull by the
    // metres flown like the others, to a place of the line and to nothing in the scene; it stands first in the list, so that
    // the pulls after it keep their whole weight; the engine holds every pull at nought at the first pose and over the last
    // metres. The turns as flown, with every pull, are counted on both cameras in the round's count.
    // (the angles the two lets go begin from: the man off the line's own look where he is let go; the beat's middle off the mouth where the beat is passed)
    const ownV = new THREE.Vector3(); path.posAtDist(Math.min(L, sLet + 24), ownV);
    const manA0 = angAt(sLet, figAt, ownV);
    const pois = [
      ...P.farPois,
      // (THE PARK'S LOOK: THE WICKET GATE at the far end of the yew alley, on the park's own axis, at its lanterns' height: a place
      // that stands, dead ahead on the level avenue and again on the level walk. While the line rises before the hall, crosses
      // its ridge and comes down over the walled garden, the gaze is held most of the way to that place: it stays near level
      // and on the axis. ITS ENDS ARE LAID BY PLACES (layLook): its weight comes on over the level avenue and goes out on the
      // level walk, where it turns nothing.)
      { at: gateAt, from: U(parkA), to: U(parkB), weight: 0.8, fade: parkIn / (parkB - parkA) },
      // (the man on the tor: the pull's weight comes on over the metres before the river's rising arc that the pace gives RAMP_S
      // seconds (FIG_IN), while the place looked at is still the line's own; over the arc's own metres the direction goes evenly up
      // to him; it is held up the moon line to sLet, the place where the line turns from him (he has swung MAN_OFF degrees off
      // our heading); over the manOut metres after it the angle between the direction looked at and the line's own goes
      // evenly to nought in the pace's seconds (P.manBack), on the side he stands on; the weight goes out over the FIG_IN
      // metres after that, when it no longer turns anything)
      { at: (time, u) => { const mF = u * L; if (mF <= sLet) return turnTo(mF, figEye.copy(figAt), clamp((mF - manUp0) / (manUp1 - manUp0), 0, 1));
        path.posAtDist(Math.min(L, mF + 24), ownV); return offBy(mF, figAt, ownV, manA0 * (1 - P.manBack(mF)), figEye); }, from: U(manUp0 - FIG_IN), to: U(sLet + manOut + FIG_IN), weight: 0.55, fade: FIG_IN / (sLet + manOut + 2 * FIG_IN - manUp0) },
      // (the mire: a pull to one place that stands: THE MINE'S MOUTH in the works' yard (P.showAt: where the way is bound). Its
      // weight comes on over the HOUND_IN metres before S.pull0, while the place looked at is still the line's own; over the
      // metres to S.works1 the direction goes over to the mouth, evenly in the seconds the pace table gives those metres
      // (P.pullIn): from the pass the works stand in the look across the basin, the fog on the right hand; IT IS HELD ON THE
      // MOUTH TO THE END: its weight goes out under the engine's own end guard, on the last straight, where the line's own
      // look and the mouth are one. (Until round 10 it was let go over a ramp before that guard, S.let0 to S.let1; with the
      // look held on the mouth at 0.8 that letting go, on the bow's last metres, was a turn of 10 to 12 degrees in 1.3 s on
      // one seed in four, counted: it is gone, and S.let0 and S.let1 are laid still and read by nothing.)
      // ROUND 11, A5: THE LOOK HOLDS THE MINE'S MOUTH from the pass to the end. Until round 10 it went over to the middle of
      // the hound's beat at the shore and back (P.beatIn, P.backIn: still laid in the plan, no longer read here; offBy below
      // is handed no angle and gives the mouth's own place): from S.works1 on the place looked at is the mouth and nothing
      // else, through the way down and over the boards; and its weight is 0.8 (was 0.5): at the landing the line's own
      // heading lies 39.3 to 44.2 degrees off the mouth (the line's tangent in plan where it passes nearest the landing, counted
      // on seeds 1 to 3000; 39.4 to 44.1 on the first 300: ROUND 11, MENDING 2 says the line's own, where "41 to 45" was the
      // land's law), and the mouth is where the way is bound. The hound runs its beat on the right hand and
      // is seen there or not as it comes: the way is bound for the mine.)
      { at: (time, u) => { const mF = u * L; offBy(mF, beatAt, showAt, 0, showEye, 0); return turnTo(mF, showEye, P.pullIn(mF)); },
        from: U(S.pull0 - HOUND_IN), to: 1, weight: 0.8, fade: HOUND_IN / (L + HOUND_IN - S.pull0) },
    ];
    // WHAT GOES BY THE WORLD'S CLOCK and has a place of its own: the rule of each as update() uses it, kept with the scene so that
    // my count can measure each against the line at every clock an arrival through a ring can come in at (the wisps, the
    // candle, the bats, the owl, the smoke, the fox, the two hounds; the wheel and the ponies stand)
    const wv = new THREE.Vector3();
    const candleAt = (time, out) => out.set(candleX0 + 1.4 * Math.sin(time * 0.23 + candlePh), candleY, candleZ);
    const wispAt = (i, time, out) => { const b = wispBase[i], ph = b[3]; return out.set(b[0] + WISP_WANDER * Math.sin(time * 0.21 * b[4] + ph), b[1] + WISP_BOB * Math.sin(time * 0.6 + ph * 2), b[2] + WISP_WANDER * Math.cos(time * 0.17 * b[4] + ph * 1.3)); };
    // (the height each hound's feet are at, at a place: on the ground, or a hand's breadth under a pool's face)
    const houndY = (x, z) => Math.max(groundY(x, z), MIRE_Y - 0.25) + 0.02, ghostY = (x, z) => Math.max(groundY(x, z), MIRE_Y - 0.3) + 0.2;
    scene.userData.clockwork = { candleAt, wispAt, wisps: wispBase.length, bats, owl, smokes, wheel: [wheelAt[0], wheelY, wheelAt[1], WR_], back: BACK_M, foxAt, foxPeriod: foxT, houndAt: P.houndAt, houndPeriod: P.houndRound.period,
      ghostAt: ghost ? P.ghostAt : null, ghostPeriod: P.ghostRound.period, ponies: ponyList, ground: groundY, houndY, ghostY, houndRound: P.houndRound, ghostRound: ghost ? P.ghostRound : null, houndK: P.HOUND_K, ghostK: P.HOUND_K };
    const headW = new THREE.Vector3(), fs = {};
    const eyeW = new THREE.Vector3();
    const update = (dt, time, camera, u) => {
      camera.getWorldPosition(eyeW);
      sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); ridges.update(dt, time, camera); mats.update(dt, time);
      for (const f of updaters) f(dt, time, camera);
      yewT.value = time; figure.update(time); ponies.update(time);
      // the sea of fog stands; its sheets drift in place by the world's clock. The air itself is not touched here: it is one for
      // the whole visit (set once in build); what is whiter in the sea is the sea's own sheets, where they stand
      bank.update(time);
      // the hound on its round: its place, heading and stride by the world's clock alone
      P.houndAt(time, hs);
      {
        // (it runs through the pools as over the ground; the ground is wet all over the mire, wetter in patches and in the pools: its
        // feet throw water up by that; how much of it the fog hides is told by the place it is at)
        const zh = zoneAt(P, hs.x, hs.z, zq), gy = houndY(hs.x, hs.z), wet = Math.max(zh.pool, zh.mire * (1 - 0.7 * zh.cut) * (0.5 + 0.5 * smoothstep(-0.2, 0.4, P.noise.n2(hs.x * 0.09, hs.z * 0.09))));
        hound.object.position.set(hs.x, gy, hs.z); hound.object.rotation.y = Math.atan2(hs.hx, hs.hz);
        hound.set(hs.run / P.HOUND_K, time, { stride: P.strideLen, phase: P.stridePh, eye: eyeW, lamp: 17, inFog: P.inFog(hs.x, hs.z), wet, fire: 1 });
        headW.set(hs.x + hs.hx * 1.5 * P.HOUND_K, gy + 1.2 * P.HOUND_K, hs.z + hs.hz * 1.5 * P.HOUND_K); bank.setFire(headW, 0.75);
        // (round 8, THE FOURTH LIGHT: the hound's fire lights the ground and what stands about it, by its own place, and lies in the pools)
        plU.uMoorHoundL.value.set(headW.x, headW.y + 0.6, headW.z, 2.4 * H.night); mirU.uL.value[houndMirror].set(headW.x, headW.y, headW.z);
        houndGlow.object.position.copy(headW); houndGlow.update(dt, time);
      }
      if (ghost) {
        P.ghostAt(time, gs);
        ghost.object.position.set(gs.x, ghostY(gs.x, gs.z), gs.z); ghost.object.rotation.y = Math.atan2(gs.hx, gs.hz);
        ghost.set(gs.run / P.HOUND_K, time, { stride: 6, phase: P.ghostPh, eye: eyeW, inFog: P.inFog(gs.x, gs.z), fire: 1 });
      }
      // the candle is carried along the first floor, shown and hidden in turn once in LAMP_PERIOD seconds of the world's clock
      const cyc = Math.cos(time * 6.2832 / LAMP_PERIOD + lampPh);
      candleAt(time, wv); lamps.setPosition(0, wv.x, wv.y, wv.z); lamps.setSize(0, 0.03 + 0.97 * smoothstep(-0.35, 0.05, cyc)); lamps.update(dt, time);
      for (let i = 0; i < wispBase.length; i++) { wispAt(i, time, wv); wisps.setPosition(i, wv.x, wv.y, wv.z); }
      wisps.update(dt, time);
      bats.update(dt, time, camera, u); owl.update(dt, time, camera, u);
      foxAt(time, fs);
      fox.object.position.set(fs.x, groundY(fs.x, fs.z) - 0.9 * fs.gone, fs.z); fox.object.rotation.y = fs.yaw; fox.set(fs.gait, time, fs.amp);
      for (const sm of smokes) sm.update(dt, time);
    };
    const cam0 = new THREE.PerspectiveCamera(FOV, ctx.aspect || 1.78, 0.3, 4200); cam0.position.set(0, EYE0, 0); cam0.updateMatrixWorld();
    update(0, 0, cam0, 0);
    return {
      scene, path, duration: FILM_S, pace: P.pace,
      // (bank 0: the line asks no roll of the camera in any turn)
      camera: { fov: FOV, near: 0.3, far: 4200, lookAhead: 24, sway: 0.5, bank: 0 },
      pois,
      // (the opening begins to show from the tarn's middle on: L - S.tarn metres before the end)
      portal: { shape: 'circle', radius: 4.6, color: RING_FIRE, glow: 1.25, revealDistance: Math.round(L - S.tarn), blendDistance: 40 },
      post: { exposure: H.exposure, bloom: { strength: 0.26, radius: 0.6, threshold: BLOOM_T }, grade: { saturation: 0.95, contrast: 1.05, tint: H.moon && H.clouds ? '#fbfaf6' : '#eef2ff', shadowTint: H.moon && H.clouds ? '#05060a' : '#04060e', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update,
      dispose() { sky.dispose(); hound.dispose(); if (ghost) ghost.dispose(); bank.dispose(); ponies.dispose(); figure.dispose(); fox.dispose(); for (const d of disposables) d.dispose?.(); },
    };
  },
};
