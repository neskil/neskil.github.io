// Where the Lattice Grows: the growing edge of a crystal, a place of gold lamps, frost and ice in a deep that has
// colour. Gold lamps stand in ranks exact to the vanishing point with dim threads between them; one white gold spark
// burns far down the open rank we come in by, set in a rose of the net's own rings. On the cold side, where the frost
// grows in from, the hollow opens into THE COLD DEEP, and in the hollow turns ONE GREAT PLATE CRYSTAL, THE HERO OF THE
// ARRIVAL, WITH A COMPANY OF NINE GREAT CRYSTALS stepping away beyond and beside it into that deep. We fly 40 m down
// the rank, swing out across the ranks through the bay into the great hollow where the crystal has not yet closed,
// the eye on the plate, pass the plate on the cold hand, come on to ONE GREAT SNOW CRYSTAL (the hero part,
// src/parts/where-the-lattice-grows.js), pass along one of its arms at 30 m and more, turn through the net's edge in
// one wide turn with the eye on the rose, lesser plate crystals standing off the way, and fly the last rank straight
// into the spark through the rose's bowl of rings, the deep behind it violet. (Round r6 re-composed it; round r9 gave
// it the deep, the plate, the crystal's body and the net's edge; round r10 the hero plate, the lesser plates, the
// mist and the net's rest; ROUND r11 STRUCK THE ICE RIDGE and made it ONE SPACE: the company, the deep's broad
// going-over, the net thinning out into the deep, clear faces of ice, the rose a bowl. Where an order of the lead
// and the brief differ, the order rules.)
// THE SPARK IS THE EXIT OPENING: a node where six threads meet. Nothing is built in it or before it; the engine draws
// there whatever world comes next. Its six threads begin at its rim.
//
// AXES (labels for this world only): +Z ahead at the entry, +X the growing side, THE COLD SIDE (the left hand of an
// eye heading +Z), +Y up. E (0,0,0) is the entry, S (0,0,560) the spark. There is no ground and no three.js light.
// EVERYTHING IS ADDITIVE LIGHT, depth-tested and writing no depth: lamps, threads, frost, the faceted ice (the
// plates, the company, the crystal's body, the rings' ice: bodies of flat faces that are light and hide nothing),
// the mist and the glows. Nothing here is solid (round r11: the ridge's pillars, the one solid thing, are gone).
// A BODY OF DEEP ICE SHOWS THE FACES TURNED TO THE EYE (round r10; the materials facetBody and iceBody: the plates,
// the snow crystal's body and bars): its far faces are not drawn, so a body is one skin of light and never the sum
// of its two sides (that sum was white).
//
// THE DEEP (rounds r9 and r11; DOME_FRAG below): the ground of the world is a law of direction on fixed axes, the
// same at every place: a warm amber dusk toward the finished net, a shade lighter toward the level; deep blue going
// to violet toward the cold side, with a soft glow of cold teal low on that side (a colour of direction: no band,
// no streak); THE GOING-OVER IS BROAD (round r11): over 58 degrees of direction the amber goes into the violet
// through rose-brown, mixed in the eye's own measure, so there is no edge of tone anywhere; a thin veil of the violet
// lies over every direction and the deep carries far small lamps in rank in every direction; broad soft clouds of
// that light drift on the world clock; a little lifted toward the six directions in which ranks are seen end on.
// Nothing of it reads the eye's place.
// DISTANCE READS (round r9; the part's GLSL_LAWS): beside the haze, a gold light that stands on the cold side (by its
// own x) cools and shrinks with the length of the sight to it: gold near, rose gold, violet grey far off.
// THE HAZE (the part's GLSL_LAWS): every lamp and thread sinks with the length of its sight through crystal by one
// law (half at 150 m, a tenth at 320 m, nothing past 500 m); the hollow is clear (gold thins in it by
// exp(-L / 600), frost hardly), so the hollow's far wall stands as ranks of dim gold across it; THE COLD DEEP BEYOND
// THE HOLLOW'S FAR END IS CLEAR AS THE HOLLOW IS (round r11: x 334 and more; the company stands in it and is hazed
// by this one law, by the crystal its sight passes). The rose sinks by the lamps' own law (through 500 m of crystal
// its rings are not seen: from the entry the white point stands alone on its rank, and the rose comes up out of the
// deep as every lamp does). The spark's stand-in light carries without loss.
//
// THE HOLLOW (the figures are the part's): half an almond lying along Z on the face (near wall about x 84), 250 m
// deep, 260 m high and 500 m long (z 90 to 590), with THE BAY, a smaller lobe toward the entry whose wall stands
// 50 m from the open rank; round it the gold crystal stands in rank, built out to x 430. A site's depth inside the
// crystal from the hollow's wall gives its state and colour on every wall alike: live rind (0 to 26 m), rind that
// stands (to 48 m), finished; pale gold, gold from 40 m, orange from 144 m, ember red by 304 m. THE WALL'S BORDER IS
// RAGGED GROWTH (the part's rindClock): the nearer the hollow, the younger.
// THE NET'S EDGE IS FINGERS AND BAYS (round r9; the part's netBay, netEdge): from where the bay of the way in is
// left behind, the finished net does not end at the hollow's wall as at a plane: by a slow noise of the place it is
// cut back in bays 30 to 90 m deep, its lamps thinning and dimming over the 40 m inside a bay's border; between the
// bays it reaches the wall in fingers. The open rank and its own rows are whole. The frost of the rind and the ferns
// stand in the bays as on every wall.
// THE COMPANY (round r11; the part's companySpecs; the same on every seed: a rule with no stream): NINE GREAT PLATE
// CRYSTALS of the kinds that exist (the plate's own faces in the great plate's habit, the lesser plates' three and a
// star), 120 m across down to 60 m by their number, each whole, each turning slowly on the world clock about a rank
// of the lattice turned to the hollow's middle. THEIR PLACES ARE THE HOLLOW'S OWN FIGURE GROWN: crystal n stands on
// the hollow's almond grown about its heart by 0.17 of itself for each number, on the part of that shell that lies
// in the cold deep, at an angle that goes by the golden step, in a row within two rows of the level (the rows in
// turn), on the nearest lattice site that passes the laws of place: its disc 35 m and more from the line, off the
// open rank, not before the great plate as seen from the entry's place, clear of the sights to the snow crystal and
// to the spark, 30 m and more from the snow crystal, 20 m from the plate's disc and from every ring of the rose, 30 m
// rim to rim from each other. (As the places lie: 348 to 684 m out along +X, the furthest 929 m from the entry.)
// The net and the frost keep 14 m off their reach, as off a lesser plate's.
// THE PLATE (round r10; the part's plateSpec, buildPlate): THE HERO OF THE ARRIVAL, one six-sided plate crystal of
// deep ice 140 m from tip to tip (a violet heart, six ridged sector arms teal to blue, an end plate on each). ITS
// PLACE IS FOUND FROM THE HOLLOW'S OWN FIGURES, never typed: on the level's own row, at the hollow's middle depth, in
// the sheet where that site has the least bearing off the entry's axis 250 to 400 m ahead, its whole disc 35 m and
// more from the line (as the place lies: (228, -6.9, 320), bearing 35.5 degrees, 393 m ahead, 46.5 m from the line).
// Its axis is a rank of the lattice leaned toward the way in; it turns about it once in 160 s from a dealt first
// angle. BEHIND IT THE NET IS THINNED: of the sites inside a ball one and a half times its reach about a place one
// reach behind it, half are not built (by the site's hash); no fern, flake or point of frost stands within 8 m of
// its disc.
// THE ROSE'S COMPANY (round r10; the part's lesserPlates): two or three lesser plate crystals (three are dealt; one
// finds no site on some seeds, since none may stand where the net's clearing would reach the open rank's own rows), 30 to 60 m across, each of
// its own habit, on lattice sites the stream 'lesser-plates' deals between the pass and the rose, 35 to 65 m from
// the line, facing back to the pass, turning slowly; the net and the frost keep 14 m off their reach.
// MIST (round r10; the part's buildMist): A BODY OF VIOLET AND BLUE MIST 300 to 900 m beyond the rose's plane that
// is gone at 820 m of sight (not seen from the entry).
// THE NET HAS REST (round r10; the part's netRest): by a slow noise of the place (the stream 'net-rest' deals where in
// it the visit lies) the net stands whole, as a third of its ranks, or not at all; the open rank's own rows (48 m
// about its line) are whole. LAMPS DIFFER (the part's lampSize): three in a hundred are great soft lamps, the rest
// small.
// THE NET DOES NOT END AT AN EDGE (round r11; the part's netThin): over the outermost 130 m of the net, from the
// hollow's wall inward and from the cold bound (x 430) inward, the lamps thin (22 in 100 stand at the very end, by
// a hash of the site), shrink (to 0.45 of their size) and cool (frost white at the end, pale gold half way, their
// own gold from 130 m in), their threads with them (a thread has the lesser share of its two ends) and the points
// between the sheets likewise; the deep is seen between them. The open rank's own rows (48 m) are whole.
// THE SNOW CRYSTAL (the part: SNOW, snowFigure) stands in the sheet z 420, its centre at x 204: six arms at 60
// degrees, each a feather of frost on a pitch of 6 m, ice blue white for good, growing at its tips only. IT HAS A
// BODY OF ICE (round r9, the part's addBody, beside the bars of round r8 along its spines and greater ribs): a
// six-sided heart plate 12 m across, a broad flat blade along every spine (4.4 m broad at the heart, tapering), a
// small six-sided plate at the end of each spine and each greater rib, all of faceted ice lit by where each face is
// turned (warm toward the net, cold toward the growing side, dim blue between, a pale line inside every border).
// EACH ARM RUNS ON INTO THE NET (round r9, the part's armRunOn): beyond its tip the frost goes on along the spine's
// line for 24 to 36 m, thinning, with a short fork at every second step. BEHIND IT A GLOW (round r9, the part's
// buildFrostGlow): twenty broad soft clouds of violet and teal light in its sheet and up to 22 m beyond, turning as
// one body about its axis, their summed light where deepest 0.11 of a gold lamp's. ABOUT IT FROST AIR (round r8,
// the part's buildFrostAir): up to 380 small cold motes within 60 m of its centre. IN THE HOLLOW STAND FIVE TO NINE
// SMALL FLAKES (round r8): whole six-armed crystals of the great one's own law, 4 to 12 m across.
// THE HOLLOW IS CLEAR ROUND THE CRYSTAL: no lamp, thread or fern within 40 m of any site of it; the free points
// drift no nearer than 40 m to its sheet. WHERE THE LINE GOES THROUGH A WALL of the hollow the wall wears small
// ferns of the crystal's own frost (the part's wallFern); along the walls and the rim a low frost of small ferns
// (20 to 50 m, dealt by the seed) grows inward.
// THE WAY IN HAS NO FRAGMENTS (rounds r8 to r10), BY PLACE ALONE: along the line from the entry to the wall itself
// (the place where the line leaves the crystal for the hollow) ONE MARGIN holds: no frost form (small fern, wall
// fern, great fern, fern of the ice, flake, thread of the live rind) stands with a site within 90 m of the line
// (twice a great fern's own greatest length). The great ferns of the way in root within 135 m of it and stand
// outside the margin. FERNS OF THE ICE (round r9): in the sheets a hash names, at most six and no two nearer than three sheets,
// a great fern roots in the hollow's far wall, on the cold side, and grows straight out of it into the hollow.
// BETWEEN THE SHEETS (round r6): standing crystal within 260 m of the line carries small points at one third and
// two thirds of every slab, over the centres of the net's triangles, so a slab seen end on is three fine ranks.
// THE ROSE (the join sheet; round r11: THE ROSE HAS DEPTH): ten of the net's own six-sided rings round the line, A
// BOWL OPEN TOWARD US: the two nearest the spark in the spark's own sheet (z 560; 24 and 48 m), the larger ones in
// the sheets before it, two to a sheet (the third and fourth at z 540, the fifth and sixth at 520, the seventh and
// eighth at 500, the ninth and tenth at 480, 80 m before the plane), EACH IN THE NET'S OWN FIGURE FOR ITS SHEET (the
// part's roseRing: in the spark's sheet a node stands on the line and a ring is a regular hexagon; in the sheets
// before it the line pierces a triangle of the net, and the net's own ring of number n about it has three sides of
// n + 1 cells and three of n: the same six directions, the ring's centre a third of a row off a node; the third
// stands 69 m from the line where it is nearest). Ice blue white at the spark through white gold and gold to ember
// at the outermost, with the six threads through them in the spark's own sheet; every band flat in its own sheet's
// plane. A slow pulse of white runs inward ring by ring on the world clock (7.5 s). ITS LIGHT IS
// A LAW OF ITS OWN PLACE (round r7): a ring's light is its number from the spark, its colour and the pulse; between
// a ring and the eye stands only the haze every lamp of the net has. A band has a core (round r8).
// THE RINGS DIFFER BY THEIR NUMBER (round r9; ringGrowth, roseIce): the first a plain band; the second small
// six-sided plates of ice at its six corners; the third a comb of ice spikes outward along each side; the fourth
// lamps like beads along its line; then again in that order outward. All of it in its own ring's plane or behind
// it (round r11: at the ring's own depth; the corner plates 6, 10 and 14 m in reach on the second, sixth and tenth
// ring), a ring and more from the opening and the last rank's tube. ON THE SIX THREADS THE PULSE IS SEEN TO RUN (round r9):
// a thread through the rings takes the white by its own distance from the spark, so the white runs inward along it
// in step with the rings and on down the spark's own threads to the rim.
//
// THE LAST RANK: the last turn (102 m) meets the rank's axis at z 492 and a second route point stands at z 496, so
// the kit's curve lies on x 0, y 0 itself, level, for the whole last 64 m (the part: LAST_M, LEAD_M).
//
// DRAWING LAWS THAT READ THE EYE (declared; the part's head has the same list): sprites and ribbons face it (the
// spark's six threads, the rose's bands and the stand-in patch do not: they lie in their plane, and they tremble
// in it only, so nothing of them stands before its own sheet's plane); the haze and the cold side's cooling by the
// sight's length; a flat feather gives up its light edge on, and so does a thread of frost seen along its own sheet;
// (round r11) a thread of frost seen along itself gives up its feather; a face of faceted ice is clear by how
// squarely it is seen and shows a faint tint of the deep its bent sight runs to (the part's facet shader). (The
// rose is not on this list. The ice's own light reads its faces' directions in the world and the haze.)
// EVERY LAMP, THREAD AND FREE POINT KEEPS ITS SIZE IN METRES AT EVERY DISTANCE (a gold lamp on the cold side shrinks
// with the sight's length by the law above). (One smoothing by the screen's dot is left, inside a feather's ribbon:
// see the part's head.)
// BY PLACE, NOT BY THE EYE: a lamp beside the way (within 30 m of the route's line, fading out by 90 m) has a white
// hot centre and six short rays on its threads, and a thread there has no sheath.
//
// THE SAME ON EVERY SEED: the lattice, the route, the open rank, the hollow, its bay and its walls, the net's edge
// and its thinning out, the rind and its clocks' phases, the ferns of the ice, the plate (place, figure, axis,
// rate), THE COMPANY (places, breadths, habits, axes, rates, first angles: a rule with no stream), the deep's
// colours and far lamps, the mist behind the rose, the lamps' sizes, the snow
// crystal (place, arms, branches, branchlets, body, the arms' run-on) and its ice, the wall ferns' places and shapes,
// the great ferns of the way in, the points between the sheets, the fault plane, the rose (its figure, its depths,
// its colours, its pulse, its rings' growth), the spark with its six threads, six lamps, rays and stand-in light,
// the opening, the look and the pace.
// THE SEED DEALS only what stands off the join, each from a stream of its own by name, all taken at the head of the
// build: which near white the new frost wears ('cold'), the small ferns' shape and each small fern ('shape',
// 'small-fern-n'), the snow crystal's one period and first phase ('snow'), the free points ('free'), the faults' rows,
// rate and phases ('fault'), the breaths of the rank-end glows ('glow'), the rare garnet tint ('red'), the waves'
// phases ('waves'), the frost air ('frost-air'), the small flakes ('flakes'), the drift of the deep's clouds
// ('deep'), the plate's first angle ('plate'), the frost glow's clouds ('frost-glow'), the lesser plates' sites,
// breadths, first angles and rates ('lesser-plates'), where in the net's slow noise of rest the visit lies
// ('net-rest'). (Round r11: the stream 'ice-wall' went with the ridge; no stream was added.) This world reads
// neither the world before it nor any series.
//
// EVERYTHING GOES BY THE WORLD CLOCK AT A STANDING RATE OR STANDS. Nothing begins, turns or ends because the visitor
// comes; light differs only by where a thing stands and by what the sight to it passes through. There is NO declared
// pacing and NO companion: nothing reads the metres flown but the gaze's one look and the pace. THE PACE (round r11)
// is a law of the line's own bend and of its named places: 1.7 of the common pace down the first rank, down to the
// common pace over the rank's last 30 m (the first turn is not flown fast), evenly down to 0.78 at the hollow's
// mouth, 0.78 among the crystals to the end of the snow crystal's pass (where the line is in the crystal again),
// back to the common pace over the next 60 m; the film's length stays 38 s. THE LOOK (rounds r10 and r11) holds,
// between two places of the world (where the line leaves the open rank; where the last rank's clear air begins),
// one aim that passes from subject to subject by places of the line: THE PLATE from the first, FOR AS LONG AS IT FITS
// WHOLE IN THE PICTURE (while its centre stands 1.94 of its reach and more from the line's place: 1 / sin of half
// the world's field), then over to THE SNOW CRYSTAL within the next 50 m (its centre while it fits whole by the same
// rule, and from there down to its near arm as the line comes down to the pass slab); then THE SPARK IN ITS ROSE,
// from the first place after the plate's pass where the line's own heading points at the spark, come to wholly
// where the last turn begins and held to the look's end.
//
// KEPT OFF THE LINE BY PLACE: THE LANE: no standing or growing lamp within 9 m of the route's line and no thread
// within 6.5 m (on the open rank the lattice itself stands further off); a young thread's feather is shortened by
// place (no barb tip within 2.6 m of the line); a point coming in or leaving keeps its whole line 3 m and more from
// the route's line; the crystal's nearest thread and ice pass 30 m from the line and an arm's run-on 30.5 m, a
// wall fern's and a great fern's nearest site 24 m, a small flake's rim 10 m, the whole ring a mote of the frost air
// circles on 6 m and the mote's own breadth, a cloud of the frost glow its own radius and 4 m, the plate's disc and
// a lesser plate's 35 m, the disc of a crystal of the company 35 m (the nearest stands 202 m off). MEDIUM: the free points (pale gold and one in five ice blue, 0.3 to 1.1 m) are dark within 4 m of the
// route's line by a law of their own place.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as L from '../parts/where-the-lattice-grows.js';

// THE DEEP (round r9): THE GROUND OF THE WORLD HAS COLOUR, BY A LAW OF DIRECTION IN THE WORLD (fixed axes, the same at
// every place). Toward the finished gold net (-X, and along the ranks) it is a warm amber dusk: DARK at its darkest
// (straight up and down), LEVEL_BY times lighter in a soft band about the level. Toward THE COLD SIDE (+X, the side the
// frost grows in from) it is deep blue going to violet upward, with a band of cold teal light a little under the
// level, as light seen through thick ice. Between the two the sky falls slowly from one to the other (COLD_FROM to
// COLD_TO of the direction's share along +X). Broad soft clouds of that light drift in it on the world clock.
const DARK = { any: [0.0105, 0.0062, 0.0034], day: [0.0105, 0.0062, 0.0034], night: [0.008, 0.005, 0.003], dawn: [0.0125, 0.007, 0.0034], golden: [0.0125, 0.007, 0.0034] };
// (round r11) ONE SPACE, NO EDGE OF TONE: THE GOING-OVER IS BROAD AND EVEN TO THE EYE. From the amber to the cold deep the
// sky goes over the whole band of directions from COLD_FROM to COLD_TO of the direction's share along +X (from 9 degrees
// on the warm hand of the ranks to 49 degrees on the cold hand: 58 degrees), THROUGH ROSE-BROWN in the band's middle
// (DEEP_ROSE), and the three are mixed IN THE EYE'S OWN MEASURE (the 2.2th root of the light), not in light: the cold
// deep is many times the amber's light, and mixed in light the whole step of tone fell in the band's first tenth (the
// seam of rounds r9 and r10). A THIN VEIL OF THE VIOLET (VEIL of it) lies over every direction, the warm ones too. THE
// TEAL is a soft glow low on the cold side, TEAL_BROAD of the direction's height broad about TEAL_LOW under the level:
// a colour of direction, no band. FAR SMALL LAMPS (farLamps): the lattice goes on beyond what is built, and the deep
// carries its farthest lamps in every direction as fine points in rank (rows FAR_PITCH radians apart, each second
// place of a row a half step on, so they stand in the net's own triangles; FAR_SHARE of the places lit, by a hash of
// the place; FAR_SIZE radians in size, with the cold deep's pale violet toward the cold side and pale gold toward
// the net; each breathes slowly on the world clock). They are part of the deep: a law of direction, the same from
// every place, and the opening hides them as it hides the deep.
const LIFT_BY = 2.4, LEVEL_BY = 3, COLD_FROM = -0.15, COLD_TO = 0.75, VEIL = 0.09;
// the cold deep's lights (linear): deep blue, violet, the teal of the low glow, the rose-brown of the going-over
const DEEP_BLUE = [0.013, 0.0232, 0.0678], DEEP_VIOLET = [0.0509, 0.0237, 0.1117], DEEP_TEAL = [0.0239, 0.0789, 0.0881], DEEP_ROSE = [0.045, 0.016, 0.022], TEAL_LOW = 0.34, TEAL_BROAD = 0.36, TEAL_LIGHT = 0.6;
const FAR_PITCH = 0.036, FAR_SHARE = 0.5, FAR_SIZE = 0.0022, FAR_LIGHT = 0.16;
// the frost's white, by the visit: three near whites on the blue side (blue belongs to the frost alone)
const COLD = { frost: '#F2F8FF', blue: '#E6F0FF', snow: '#F8FBFF' };
// the rose's own white (the join sheet: ice blue white at the spark), never the visit's;
// and the seconds between two of its inward pulses
const ROSE_WHITE = '#C4DCFF', ROSE_S = 7.5;
// (round r9) what a ring carries beside its band, by its number alone: 0 nothing, 1 plates at its corners, 2 a comb of spikes, 3 beads
const ringGrowth = (n) => (n - 1) % 4, BEAD_M = 6, BEAD_R = 2.6, BEAD_LIGHT = 3, THREAD_PULSE = 2.4;
// the rose's light by the ring's number: the first ring's strength, and what each ring keeps of the one inside it
const ROSE_FIRST = 0.9, ROSE_FALL = 0.9;
// (round r10) THE RINGS THE LAST STRAIGHT PASSES NEAREST ARE HELD LOW, by the ring's number: the first ring keeps
// ROSE_NEAR[0] of its strength, each ring further out more, and from ring ROSE_NEAR[1] on a ring has its whole strength
// (a band the line passes within a few tens of metres fills the view in the last 64 m: it must stay under white)
const ROSE_NEAR = [0.55, 4];
// the ember rings (those whose colour has left the gold: the rings past ROSE_GOLD of the way out) are low: each keeps
// EMBER_FALL of the one inside it, so that from far off and aslant they are a faint glow of rings and no bright stroke
const ROSE_GOLD = 0.56, EMBER_FALL = 0.7;

const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
// THE DEEP: a law of the direction of the sight in the world's own axes and of the world clock, and of nothing else
// (it is the same from every place). The six soft glows where ranks are seen end on (breathing) lift it; a sight that
// passes within 60 m of the spark carries no such glow, so that the ring is the one bright thing there.
// THE CLOUDS: three octaves of a smooth noise of the direction, the broadest some 40 degrees across and nothing under
// 10; they drift on the world clock from a first place the visit deals (uDrift) and lift or lower the deep by a third.
const DOME_FRAG = /* glsl */`
uniform vec3 uAmber, uSpark, uBlue, uViolet, uTeal, uRose, uDrift; uniform vec4 uBreath; uniform float uTime, uLift;
varying vec3 vDir;
float glow(float c, float ph){ return exp(-(1. - clamp(c, 0., 1.)) / .012) * (1. + .2 * sin(uTime * .698 + ph)); }
float h3(vec3 q){ q = fract(q * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(mix(h3(i), h3(i + vec3(1., 0., 0.)), f.x), mix(h3(i + vec3(0., 1., 0.)), h3(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h3(i + vec3(0., 0., 1.)), h3(i + vec3(1., 0., 1.)), f.x), mix(h3(i + vec3(0., 1., 1.)), h3(i + vec3(1., 1., 1.)), f.x), f.y), f.z);
}
float cloud(vec3 q){ return .57 * vn(q) + .29 * vn(q * 2.03 + 7.1) + .14 * vn(q * 4.1 + 13.7); }
// FAR SMALL LAMPS: fine points in rank on the deep, by the direction's bearing round the level and its height over it
// (t: the direction's share of the cold deep)
vec3 farLamps(vec3 d, float t){
  float el = asin(clamp(d.y, -1., 1.)), az = atan(d.x, d.z + sign(d.z) * 1e-5), row = floor(el / ${(FAR_PITCH * 0.866).toFixed(5)} + .5);
  float off = .5 * mod(row, 2.), col = floor(az / ${FAR_PITCH.toFixed(4)} - off + .5);
  vec2 v = vec2((az - (col + off) * ${FAR_PITCH.toFixed(4)}) * cos(el), el - row * ${(FAR_PITCH * 0.866).toFixed(5)});
  float h = h3(vec3(col, row, 3.7)), on = step(h, ${FAR_SHARE.toFixed(2)}), k = h3(vec3(row, col, 9.1));
  float s = ${FAR_SIZE.toFixed(4)} * (.7 + .6 * k), a = exp(-dot(v, v) / (s * s)) * on * (.25 + .75 * k * k) * (.8 + .2 * sin(uTime * (.4 + k) + 40. * h));
  return mix(vec3(1., .78, .5), vec3(.74, .76, 1.), t) * (${FAR_LIGHT.toFixed(2)} * a);
}
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4), p = cameraPosition;
  vec3 s = uSpark - p; float t = dot(s, d), deep = (1. - smoothstep(25., 70., length(s - d * max(t, 0.)))) * step(0., t);
  float n1 = cloud(d * 1.5 + uDrift + vec3(.017, .004, -.011) * uTime), n2 = cloud(d * 1.1 + uDrift.zxy - vec3(.009, .003, .013) * uTime);
  // the warm side: amber dusk, a shade lighter toward the level
  vec3 warm = uAmber * (1. + ${(LEVEL_BY - 1).toFixed(2)} * exp(-d.y * d.y / .1) * (.5 + n1));
  // the cold side: deep blue going to violet upward (and by the clouds), darker straight down; the teal a soft glow low on that side
  vec3 cold = mix(uBlue, uViolet, clamp(.8 * smoothstep(-.3, .6, d.y) + .7 * (n2 - .5), 0., 1.)) * (.65 + .7 * n1) * (1. - .45 * smoothstep(.35, 1., -d.y));
  float q = (d.y + ${TEAL_LOW.toFixed(2)}) / ${TEAL_BROAD.toFixed(2)};
  cold += uTeal * (${TEAL_LIGHT.toFixed(2)} * exp(-q * q) * (.45 + .8 * n2));
  // the going-over, through rose-brown, in the eye's own measure: no edge of tone
  float go = smoothstep(${COLD_FROM.toFixed(2)}, ${COLD_TO.toFixed(2)}, d.x + .14 * (n2 - .5));
  vec3 gw = pow(max(warm, vec3(1e-5)), vec3(.4545)), gc = pow(max(cold, vec3(1e-5)), vec3(.4545)), gr = pow(max(uRose * (.7 + .6 * n1), vec3(1e-5)), vec3(.4545));
  vec3 col = pow(max(gw * ((1. - go) * (1. - go)) + gr * (2. * go * (1. - go)) + gc * (go * go), vec3(0.)), vec3(2.2));
  // the thin veil of the cold deep's violet over every direction
  col += uViolet * (${VEIL.toFixed(2)} * (.6 + .8 * n2));
  float g = glow(d.z, uBreath.x) + glow(-d.z, uBreath.y) + glow(abs(d.x), uBreath.z)
    + .6 * (glow(abs(.5 * d.x + .866 * d.y), uBreath.w) + glow(abs(.5 * d.x - .866 * d.y), uBreath.w + 2.1));
  col *= 1. + (uLift - 1.) * clamp(g * (1. - deep), 0., 1.);
  col += farLamps(d, go) * (1. - deep);
  gl_FragColor = vec4(col, 1.);
}`;

// THE SPARK'S SIX THREADS, ITS SIX LAMPS AND THEIR RAYS. Each thread begins at the opening's rim and runs out in
// the opening's own plane to a lamp 24 m from the centre: a thread of white gold one and a half times a common
// thread's width, drawn at its true width. The six lamps are white
// gold and large: a hexagon of lamps round the ring. Every 1.1 s a pulse of white gold leaves the rim along each
// thread (the six 0.18 s apart), reaches its lamp in half a second, flares it, and runs on a third as bright along
// the lamp's outward threads for two more cells. Nothing of it lies inside the rim.
// THE SPARK'S STAND-IN LIGHT (the join sheet, EXIT of 6): a flat round patch of white gold light FIXED IN THE WORLD
// in the plane z 560.3 (0.3 m behind the opening's plane), facing -Z, 4 m in radius (inside the rim's 5), soft, 1.8 m
// in size at its heart and nothing at 4 m. It never turns with the eye and no part of it stands at z under 560. Its
// light carries through the crystal without loss. Where the engine draws the opening the opening hides it; seen from
// a world before, where no opening is drawn, it is the one point down the rank that burns whiter than the rest.
const SPARK_VERT = /* glsl */`
attribute vec3 aP0, aP1; attribute vec4 aInfo;   // spoke, metres from the rim where this piece begins, its standing strength, 1 for a lamp
varying vec4 vS; varying vec2 vM; varying float vW, vR;
${L.GLSL_LAWS}
void main(){
  float m = 38. * mod(uTime - .18 * aInfo.x, 1.1); vW = 0.; vR = 0.;
  // heat, IN THE SHEET'S OWN PLANE: everything of the spark's sheet that this mesh draws (the six threads, the six lamps,
  // the rose) trembles along x and y only, so that no part of it ever stands before its own sheet's plane (the spark's
  // sheet z 560; round r11: a ring's own sheet)
  vec3 tA = tremble(aP0), tB = tremble(aP1);
  vec3 A = aP0 + vec3(tA.xy, 0.) * step(6., length(aP0.xy - uSpark.xy)), B = aP1 + vec3(tB.xy, 0.);
  vec3 ax = B - A; float len = length(ax); ax /= max(len, 1e-4);
  vec3 P = A + ax * (len * position.x);
  vec4 mv = modelViewMatrix * vec4(P, 1.);
  vec3 toP = P - cameraPosition; float d = length(toP), gain = hazeGold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d));
  if (aInfo.w > 3.5) {
    // A BEAD OF A BEADED RING (round r9): a small lamp behind the ring's own line by its reach, drawn at its true size, its
    // light the ring's own (the ring's strength, colour and pulse)
    mv.xy += position.yz * ${BEAD_R.toFixed(1)};
    vS = vec4(position.y * ${BEAD_R.toFixed(1)}, position.z * ${BEAD_R.toFixed(1)}, aInfo.z, 4.); m = aInfo.x; vR = aInfo.x;
  } else if (aInfo.w > 2.5) {
    // THE ROSE: a band of light lying FLAT in its own ring's sheet (round r11; no part of it before that plane), 1.4 m wide on the first
    // ring and thinner ring by ring to 1 m on the last. A PULSE OF WHITE RUNS INWARD RING BY RING on the world clock, one
    // every ROSE_S seconds, a ring at a time (every clock alike: there is always one ring lit by it)
    vec3 side = cross(ax, vec3(0., 0., 1.));
    mv = modelViewMatrix * vec4(P + side * (position.y * mix(.7, .5, aInfo.x) * 2.5), 1.);
    // ITS LIGHT IS A LAW OF ITS OWN PLACE: the ring's own strength (aInfo.z, by the ring's number), its colour and the pulse;
    // between it and the eye stands only the haze every lamp of the net has (gain, counted above by the lamps' own law)
    vS = vec4(position.x * len, position.y * 2.5, aInfo.z, 3.); m = aInfo.x;
    // THE PULSE'S PLACE (round r9): a ring has it by its number; a thread through the rings (aInfo.y 1) by its own
    // distance from the spark, so that on the six threads the white is seen to run inward from ring to ring
    vW = aInfo.y; vR = aInfo.y > .5 ? (length(P.xy - uSpark.xy) / ${L.SIDE.toFixed(1)} - 1.) / ${(L.ROSE_RINGS - 1).toFixed(1)} : aInfo.x;
  } else if (aInfo.w < .5) {
    // a thread of the spark's node: its ribbon lies flat in the plane z 560, as the rose's bands do (it never turns to the eye)
    vec3 side = cross(ax, vec3(0., 0., 1.));
    float hw = aInfo.z > 0. ? .12 : .08;
    mv = modelViewMatrix * vec4(P + side * (position.y * hw * 2.5), 1.);
    vS = vec4(aInfo.y + position.x * len, position.y * 2.5, aInfo.z, 0.);
  } else if (aInfo.w < 1.5) {
    // a lamp of the hexagon: its core 0.55 m, drawn at its true size
    float cd = .55, r = 4.;
    mv.xy += position.yz * r;
    vS = vec4(position.y * r, position.z * r, cd, 1.);
  } else {
    // the spark's stand-in light: a flat patch in the plane z 560.3 of the world, facing -Z (nothing of it is seen from behind)
    mv = modelViewMatrix * vec4(aP0 + vec3(position.y * 4., position.z * 4., 0.), 1.); gain = step(cameraPosition.z, aP0.z);
    vS = vec4(position.y * 4., position.z * 4., 0., 2.);
  }
  vM = vec2(m, gain);
  gl_Position = projectionMatrix * mv;
}`;
const SPARK_FRAG = /* glsl */`
uniform vec3 uWhiteGold, uRoseWhite; uniform float uTime; varying vec4 vS; varying vec2 vM; varying float vW, vR;
float pulse(float x, float m){ float q = (x - m) / 2.2; return exp(-q * q) + .35 * exp(-max(m - x, 0.) / 7.) * step(x, m); }
// the rose's white pulse at a share of the way out (0 at the first ring, 1 at the last): it comes inward, one every ROSE_S seconds
float rosePulse(float sh){ float ph = fract(uTime / ${ROSE_S.toFixed(1)} + .9 * sh); ph = min(ph, 1. - ph); return exp(-ph * ph / .0032); }
// the rose's colour at a share of the way out, lifted and whitened by the pulse
vec3 roseCol(float q, float w){
  vec3 col = mix(uRoseWhite, uWhiteGold, smoothstep(0., .25, q));
  col = mix(col, vec3(1., .5, .1), smoothstep(.2, .56, q));
  col = mix(col, vec3(.75, .1, .02), smoothstep(.56, 1., q));
  return mix(col, uRoseWhite, min(.6 * w, 1.)) * (1. + .9 * w);
}
void main(){
  float k;
  if (vS.w > 3.5) {
    // a bead: a small hot core in a short soft skirt that is nothing at its card's rim
    float r2 = dot(vS.xy, vS.xy);
    gl_FragColor = vec4(roseCol(clamp(vM.x, 0., 1.), rosePulse(vR)) * (vS.z * (1.7 * exp(-r2 / .3) + .3 * exp(-r2 / 1.6) * (1. - smoothstep(3.6, 6.76, r2))) * vM.y), 1.);
    return;
  }
  if (vS.w > 2.5) {
    // the rose (vM.x: 0 at the first ring, 1 at the last): ice blue white at the spark, through white gold (a quarter of
    // the way out) to gold (by the sixth ring) and ember at the outermost ring; its colours are its own, the same on every
    // visit (the join: nothing of it is dealt). The pulse lifts a ring by 0.9 and whitens it.
    // A BAND HAS A CORE (round r8): along its middle runs a bright line a tenth of the band broad (the band is five of
    // these units across); the band's own soft body is lowered by a fifth, so the ring gives the light it gave
    float y2 = vS.y * vS.y, prof = (.8 * exp(-1.1 * y2) + .9 * exp(-y2 / .09)) * (1. - smoothstep(4., 6.25, y2)), q = clamp(vM.x, 0., 1.);
    // (a thread through the rings takes the pulse THREAD_PULSE times as strongly as a ring: there the white runs)
    gl_FragColor = vec4(roseCol(q, rosePulse(vR) * (1. + ${(THREAD_PULSE - 1).toFixed(1)} * vW)) * (vS.z * prof * vM.y), 1.);
    return;
  }
  if (vS.w < .5) {
    float x = vS.x, far = 1. - clamp((x - 19.) / 48., 0., 1.);
    float p = pulse(x, vM.x) + pulse(x, vM.x + 41.8);
    // across: a hot fine core in a faint sheath
    float y2 = vS.y * vS.y, prof = 1.3 * exp(-9. * y2) + .22 * exp(-1.2 * y2);
    // (round r9: the rose's inward pulse runs on down the thread from the first ring to the rim)
    float pin = rosePulse(((${L.RIM.toFixed(1)} + x) / ${L.SIDE.toFixed(1)} - 1.) / ${(L.ROSE_RINGS - 1).toFixed(1)}) * step(.5, vS.z);
    k = (vS.z + p * (x < 19. ? 1.8 : .75 * far) + 1.6 * pin) * prof * vM.y;
  } else if (vS.w > 1.5) {
    // the spark's stand-in light: soft, 1.8 m in size (a sigma), nothing from 4 m
    float r2 = dot(vS.xy, vS.xy);
    k = 3. * exp(-r2 / 6.48) * (1. - smoothstep(9., 16., r2)) * vM.y;
  } else {
    // a lamp of the hexagon: a large white gold lamp that stands, and flares as the pulse reaches it
    float cd = max(vS.z, 1e-3), r2 = dot(vS.xy, vS.xy), q = r2 / (cd * cd), s = clamp(1. - sqrt(r2) / max(4., cd * 6.3), 0., 1.);
    float q1 = (vM.x - 19.) / 5., q2 = (vM.x + 41.8 - 19.) / 5., fl = exp(-q1 * q1) + exp(-q2 * q2);
    k = (2.6 * (exp(-1.4 * q) + .28 * exp(-q / 7.) * smoothstep(0., .35, s)) + 1.2 * exp(-18. * q) + (.4 + 1.6 * fl) * s * s * s) * vM.y;
  }
  gl_FragColor = vec4(uWhiteGold * k, 1.);
}`;

// THE FREE POINTS: slow snow of light crossing the hollow: points 0.3 to 1.1 m across, pale gold and one in five ice
// blue, drifting toward -X with a slow curl, wrapped in the hollow's own depth (x 84 to 334; dealt at y -125 to 125
// over the hollow's whole length) and seen only inside the hollow: each fades to nothing over the 14 m next to its
// walls (the almond's closed form). A MEDIUM: a point's light is nothing within 4 m of the route's LINE and full
// from 9 m, a law of its own place against the fixed curve (the stretch of the route with x over 50, handed over as
// a polyline), the same wherever the eye is. By its own place too: none within 40 m of the crystal's sheet; large
// and few near the line.
const FREE_N = 46;
const FREE_VERT = /* glsl */`
attribute vec4 aSeed;   // where in the box's depth it starts (0 to 1), its y and z, its speed in metres a second
attribute vec2 aPh;
uniform vec3 uRoute[${FREE_N}];
varying vec2 vP; varying float vK, vIce;
${L.GLSL_LAWS}
void main(){
  vec3 p = vec3(HOL_C.x + HOL_R.x - mod((1. - aSeed.x) * HOL_R.x + aSeed.w * uTime, HOL_R.x), aSeed.y + 6. * sin(uTime * .21 + aPh.x), aSeed.z + 6. * sin(uTime * .17 + aPh.y));
  vec3 q = (p - HOL_C) / HOL_R; float rho = max(length(q), 1e-4), g = max(length(q / HOL_R) / rho, 1e-6);
  float fade = smoothstep(2., 16., min(p.x - HOL_C.x, (1. - rho) / g));
  float d2 = 1e9;
  for (int i = 0; i < ${FREE_N - 1}; i++) {
    vec3 a = uRoute[i], ab = uRoute[i + 1] - a, w = p - a;
    w -= ab * clamp(dot(w, ab) / max(dot(ab, ab), 1e-6), 0., 1.);
    d2 = min(d2, dot(w, w));
  }
  float dl = sqrt(d2); fade *= smoothstep(4., 9., dl);
  // dark round the crystal: none shows within SNOW_CLEAR metres of its sheet
  fade *= smoothstep(${L.SNOW_CLEAR.toFixed(1)}, ${(L.SNOW_CLEAR + 15).toFixed(1)}, abs(p.z - ${L.SNOW_AT[2].toFixed(1)}));
  // LARGE AND FEW NEAR THE LINE, by the point's own place: within 70 m of the route's line a point grows (to one and a half times
  // its size at 12 m from it) and two in five of them are lit there
  float byLine = 1. - smoothstep(12., 70., dl);
  fade *= mix(1., step(fract(aPh.y * 3.17), .4), byLine);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vec3 toP = p - cameraPosition; float d = length(toP);
  float r0 = (.3 + .42 * fract(aPh.x * 7.31)) * (1. + .5 * byLine), r = r0;
  fade *= hazeCold(d, hollowLen(cameraPosition, toP / max(d, 1e-3), d)) * (.7 + .3 * sin(uTime * 2.3 + aPh.y * 5.));
  mv.xy += position.xy * (r * 3. * step(.003, fade));
  gl_Position = projectionMatrix * mv;
  vP = position.xy * 3.; vK = fade; vIce = step(.8, fract(aPh.x * 3.71));
}`;
const FREE_FRAG = /* glsl */`
varying vec2 vP; varying float vK, vIce;
void main(){
  // pale gold (#FFD98A), one in five ice blue (#9CC4FF)
  float r2 = dot(vP, vP), g = clamp(1. - sqrt(r2) / 3., 0., 1.);
  vec3 col = mix(vec3(1., .69, .25), vec3(.26, .44, .8), vIce);
  gl_FragColor = vec4(col * ((1.6 * exp(-1.3 * r2) + .18 * g * g) * vK), 1.);
}`;

// the spark's own geometry: six spokes of five ribbons each, and a card for each of the six lamps round it
function sparkGeometry() {
  const pos = [], p0 = [], p1 = [], info = [], ix = [], S = L.SPARK;
  const quad = (a, b, spoke, from, strength, lamp, kind = lamp ? 1 : 0) => {
    const n = pos.length / 3;
    const corners = lamp ? [[0, -1, -1], [0, 1, -1], [0, 1, 1], [0, -1, 1]] : [[0, -1, 0], [1, -1, 0], [1, 1, 0], [0, 1, 0]];
    for (const c of corners) { pos.push(c[0], c[1], c[2]); p0.push(a[0], a[1], a[2]); p1.push(b[0], b[1], b[2]); info.push(spoke, from, strength, kind); }
    ix.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  for (let s = 0; s < 6; s++) {
    const dir = (t) => [Math.cos((s + t) * Math.PI / 3), Math.sin((s + t) * Math.PI / 3)], d = dir(0);
    const at = (r) => [S[0] + d[0] * r, S[1] + d[1] * r, S[2]], lamp = at(L.SIDE);
    // the thread itself: from the rim to the lamp, white gold, one and a half times a common thread's width
    quad(at(L.RIM), lamp, s, 0, 1.3, false);
    // the lamp's three outward threads carry the pulse on (no standing light of their own: the sheet's gold threads are there)
    for (const t of [0, 1, -1]) { const o = dir(t); quad(lamp, [lamp[0] + o[0] * L.SIDE, lamp[1] + o[1] * L.SIDE, lamp[2]], s, L.SIDE - L.RIM, 0, false); }
    quad(at(2 * L.SIDE), at(3 * L.SIDE), s, 2 * L.SIDE - L.RIM, 0, false);
    quad(lamp, [lamp[0] + 1, lamp[1], lamp[2]], s, 0, 0, true);
  }
  // THE ROSE (the join sheet, EXIT of 6; round r11: THE ROSE HAS DEPTH): the net's own six-sided rings round the line,
  // every edge of the net on them. A BOWL OPEN TOWARD US: the two rings nearest the spark stand in the spark's own
  // sheet (z 560), the larger ones in the sheets before it, two rings to a sheet (the part's roseRing: the ring's
  // sheet, its six corners, the cells of each side; in the spark's sheet a regular hexagon, in the sheets before it
  // the net's own ring of that number there, three sides a cell longer than the other three). The six threads
  // through the rings run from the hexagon out in the spark's own sheet, as they did.
  for (let n = 1; n <= L.ROSE_RINGS; n++) {
    // A RING'S STRENGTH IS A LAW OF ITS NUMBER FROM THE SPARK: the first ring the strongest, each ring ROSE_FALL of the one
    // inside it; from the first ember ring on each keeps EMBER_FALL of the one inside it (the tenth has a fourteenth of the first's)
    const share = (n - 1) / (L.ROSE_RINGS - 1), r = n * L.SIDE, R = L.roseRing(n);
    // (how many rings from the spark out to this one, itself counted, are ember rings)
    let ember = 0; for (let m = 1; m <= n; m++) if ((m - 1) / (L.ROSE_RINGS - 1) > ROSE_GOLD) ember++;
    const strength = ROSE_FIRST * Math.pow(ROSE_FALL, n - 1 - ember) * Math.pow(EMBER_FALL, ember) * lerp(ROSE_NEAR[0], 1, smoothstep(1, ROSE_NEAR[1], n));
    for (let q = 0; q < 6; q++) {
      const a = [...R.corners[q], R.z], b = [...R.corners[(q + 1) % 6], R.z], cells = R.sides[q];
      for (let e = 0; e < cells; e++) quad([lerp(a[0], b[0], e / cells), lerp(a[1], b[1], e / cells), a[2]], [lerp(a[0], b[0], (e + 1) / cells), lerp(a[1], b[1], (e + 1) / cells), a[2]], share, 0, strength, false, 3);
      if (n > 1) { const c = Math.cos(q * Math.PI / 3), sn = Math.sin(q * Math.PI / 3); quad([S[0] + (r - L.SIDE) * c, S[1] + (r - L.SIDE) * sn, S[2]], [S[0] + r * c, S[1] + r * sn, S[2]], share, 1, 0.6 * strength, false, 3); }
      // a beaded ring: small lamps along its line, BEAD_M metres apart, each set BEHIND ITS OWN RING'S PLANE by its own
      // reach (BEAD_R), so that no part of a bead stands before that plane from any place
      if (ringGrowth(n) === 3) for (let e = 0; e < cells * L.SIDE / BEAD_M; e++) { const t = (e + 0.5) * BEAD_M / (cells * L.SIDE), at = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), a[2] + BEAD_R]; quad(at, [at[0] + 1, at[1], at[2]], share, 0, BEAD_LIGHT * strength, true, 4); }
    }
  }
  // the spark's stand-in light stands 0.3 m BEHIND the opening's plane: the opening hides it wherever the engine draws the opening
  quad([S[0], S[1], S[2] + 0.3], [S[0] + 1, S[1], S[2] + 0.3], 0, 0, 0, true, 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP0', new THREE.Float32BufferAttribute(p0, 3));
  g.setAttribute('aP1', new THREE.Float32BufferAttribute(p1, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 4)); g.setIndex(ix);
  return g;
}

// THE RINGS' ICE (round r9; the join sheet, THE ROSE ASLANT AND ITS GROWTH; the same on every seed). Beside its band a
// ring carries its own growth BY ITS NUMBER ALONE (ringGrowth: the first a plain band, the second plates, the third a
// comb, the fourth beads, then again outward; the beads are lamps of the spark's own mesh). PLATES: a small six-sided
// plate of faceted ice at each of the ring's six corners, a corner outward, ITS REACH BY THE RING'S NUMBER (round
// r11: ROSE_PLATE[0] metres on the second ring and ROSE_PLATE[1] more for every ring further out: 6, 10 and 14 m on
// the second, sixth and tenth, large enough out there to read as crystals as the line passes through). A COMB: short
// spikes of ice outward along each side, SPIKE_M metres apart, long and short by turns (ROSE_SPIKE), each a blade
// with a groove along its middle. ALL OF IT STANDS AT ITS OWN RING'S DEPTH (round r11): in the ring's own sheet's
// plane and BEHIND it (its nearest part ROSE_BACK metres behind that plane, the rest further back): nothing of it
// stands before its ring, and the innermost of it stands a ring and more from the opening and from the last rank's
// tube. Its light is the ice's law of the face (the part's faceted ice).
const ROSE_PLATE = [6, 1], ROSE_SPIKE = [8, 4.5], SPIKE_M = 6, SPIKE_BROAD = 1.8, ROSE_BACK = 0.05, ROSE_ICE = [1.6, 3];
// (round r11m2) it hands the page back after every ring: a step of the build that changes no draw and no picture
async function roseIce(batch, ctx) {
  const S = L.SPARK, golden = 0.6180339887;
  const face = (pts, share, phase) => {
    const [a, b, c] = pts, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map((v) => v / l * (n[2] > 0 ? -1 : 1));
    batch.face(pts, n, share, [], phase, ROSE_ICE[0], ROSE_ICE[1]);
  };
  for (let n = 1; n <= L.ROSE_RINGS; n++) {
    // (round r11) the ring's own figure and depth: its ice stands in its own sheet's plane and behind it
    const R = L.roseRing(n), z0 = R.z + ROSE_BACK, kind = ringGrowth(n), phase = (n * golden) % 1;
    for (let q = 0; q < 6 && kind === 1; q++) {
      // a corner plate: ROSE_PLATE[0] metres of reach on the second ring and ROSE_PLATE[1] more for every ring further out, a corner outward
      const [cx, cy] = R.corners[q], out = Math.atan2(cy - S[1], cx - S[0]), A = ROSE_PLATE[0] + ROSE_PLATE[1] * (n - 2), c = (rad, i, h) => [cx + rad * Math.cos(out + i * Math.PI / 3), cy + rad * Math.sin(out + i * Math.PI / 3), z0 + h];
      face([0, 1, 2, 3, 4, 5].map((i) => c(0.5 * A, i, 0)), [0, 0, 0, 0, 0, 0], phase);
      for (let i = 0; i < 6; i++) face([c(0.5 * A, i, 0), c(A, i, 0.3 * A), c(A, i + 1, 0.3 * A), c(0.5 * A, i + 1, 0)], [0, 1, 1, 0], phase);
    }
    for (let q = 0; q < 6 && kind === 2; q++) {
      const a = R.corners[q], b = R.corners[(q + 1) % 6], r = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / r, uy = (b[1] - a[1]) / r, mx = (a[0] + b[0]) / 2 - S[0], my = (a[1] + b[1]) / 2 - S[1];
      // (outward: square to the side, away from the line)
      const sgn = -uy * mx + ux * my > 0 ? 1 : -1, ox = -uy * sgn, oy = ux * sgn;
      for (let e = 0; e < r / SPIKE_M; e++) {
        const t = (e + 0.5) * SPIKE_M / r, x = lerp(a[0], b[0], t) + ox * 0.6, y = lerp(a[1], b[1], t) + oy * 0.6, long = ROSE_SPIKE[e & 1], w = SPIKE_BROAD / 2;
        const left = [x - ux * w, y - uy * w, z0], right = [x + ux * w, y + uy * w, z0], tip = [x + ox * long, y + oy * long, z0], mid = [x, y, z0 + 0.6 * w];
        face([left, mid, tip], [0, 0, 1], phase); face([mid, right, tip], [0, 0, 1], phase);
      }
    }
    await ctx.yield();
  }
}

export default {
  id: 'where-the-lattice-grows',
  name: 'Where the Lattice Grows',
  category: 'bizarre',
  media: ['space'],
  weirdness: 0.5,
  async build(ctx) {
    const { core } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    // ------------------------------------------------------------ the forks, in the order they are taken (all here, before any loop)
    // each a stream of its own from the world's seed and a name; every small fern has its own
    const fork = (name) => core.makeRng(core.hashSeed('where-the-lattice-grows:' + name + ':' + ctx.seed));
    const rCold = fork('cold'), rShape = fork('shape'), rSnow = L.snowFork(ctx.seed);
    const nSmall = Math.round(34 * clamp(vary.density ?? 1, 0.7, 1.3) * detail), rSmall = [];
    for (let n = 0; n < nSmall; n++) rSmall.push(fork('small-fern-' + n));
    const rFree = fork('free'), rFault = fork('fault'), rGlow = fork('glow'), rRed = fork('red'), rWaves = fork('waves'), rAir = fork('frost-air'), rFlake = fork('flakes'), rDeep = fork('deep'), rPlate = fork('plate'), rFrostGlow = fork('frost-glow'), rLesser = fork('lesser-plates'), rRest = fork('net-rest');

    // ------------------------------------------------------------ what this visit is like (off the join only)
    const coldName = rCold.pick(['frost', 'frost', 'blue', 'snow']);
    const shape = rShape.pick(['mixed', 'mixed', 'broad', 'needles']);
    const rate = lerp(0.75, 1.35, clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1));
    const faultEvery = lerp(14, 6, clamp(vary.mood ?? 0.5, 0, 1));
    const dark = DARK[vary.hour] || DARK.any;

    const shared = L.makeShared(COLD[coldName]);
    shared.uWavePh.value.set(rWaves() * 6.2832, rWaves() * 6.2832, rWaves() * 6.2832);
    const mats = L.makeMaterials(shared), cold = shared.uCold.value;
    const additive = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };

    // ------------------------------------------------------------ the route (the part keeps its points and its line)
    await ctx.yield();
    const route = await L.primeRouteLine(ctx), path = route.path;

    // ------------------------------------------------------------ the dark
    const v3 = (a) => ({ value: new THREE.Vector3(a[0], a[1], a[2]) });
    const domeU = { ...shared, uAmber: v3(dark), uLift: { value: LIFT_BY }, uBlue: v3(DEEP_BLUE), uViolet: v3(DEEP_VIOLET), uTeal: v3(DEEP_TEAL), uRose: v3(DEEP_ROSE), uDrift: v3([rDeep() * 40, rDeep() * 40, rDeep() * 40]), uBreath: { value: new THREE.Vector4(rGlow() * 6.28, rGlow() * 6.28, rGlow() * 6.28, rGlow() * 6.28) } };
    const dome = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({ ...additive, uniforms: domeU, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ------------------------------------------------------------ the spark's six threads, six lamps and their rays
    const spark = new THREE.Mesh(sparkGeometry(), new THREE.ShaderMaterial({ ...additive, uniforms: { ...shared, uRoseWhite: { value: new THREE.Color(ROSE_WHITE) } }, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG }));
    spark.frustumCulled = false; spark.renderOrder = 2; scene.add(spark);
    await ctx.yield();
    // the rings' ice (roseIce above): plates at the corners of every second ring of four, a comb along every third
    { const batch = L.facetBatch(); await roseIce(batch, ctx); const ice = batch.mesh(mats.facet); ice.name = 'rose ice'; ice.renderOrder = 2; scene.add(ice); }
    await ctx.yield();

    // ------------------------------------------------------------ the hero: THE SNOW CRYSTAL (the part)
    const hero = await L.buildHero(ctx, { shared, materials: mats, rng: rSnow });
    scene.add(hero.object);
    // the frost air about the crystal (the part's buildFrostAir: a standing cloud of cold motes, each on a ring of its own)
    const air = await L.buildFrostAir(ctx, rAir, shared, Math.round(L.AIR_N * clamp(detail, 0.5, 1)));
    scene.add(air.mesh);
    // the frost glow behind the crystal (the part's buildFrostGlow: broad soft violet and teal clouds that turn as one body)
    const frostGlow = await L.buildFrostGlow(ctx, rFrostGlow, shared); frostGlow.mesh.renderOrder = -0.25; scene.add(frostGlow.mesh);
    await ctx.yield();
    // THE PLATE (the part's buildPlate): the great plate crystal of the way in, turning on the world clock from a dealt first angle
    const plate = L.buildPlate(mats.facetBody, rPlate());
    scene.userData.plate = plate.spec;
    plate.mesh.renderOrder = 1; scene.add(plate.mesh);
    await ctx.yield();
    // THE ROSE'S COMPANY (round r10; the part's lesserPlates): the lesser plate crystals between the pass and the rose,
    // each on a lattice site the stream 'lesser-plates' deals among the sites its laws of place allow. byLesser: is a
    // place within LESSER_NET metres of a lesser plate's reach (nothing of the net or the frost is built there)?
    const lesserSpecs = await L.lesserPlates(rLesser, ctx);
    await ctx.yield();
    const lesser = lesserSpecs.map((P) => { const b = L.buildPlate(mats.facetBody, P.phase, P, P.habit, P.turn); b.mesh.renderOrder = 1; b.mesh.name = 'lesser plate'; scene.add(b.mesh); return b; });
    scene.userData.lesser = lesserSpecs.map((P) => [...P.at.map((v) => Math.round(v)), Math.round(2 * P.R), +P.line.toFixed(1), +P.sight.toFixed(1)]);
    await ctx.yield();
    // THE COMPANY (round r11; the part's companySpecs: the same on every seed): the great crystals that step away beyond and
    // beside the great plate into the cold deep, each on the lattice site its law of place finds, turning on the world clock
    const companySpecs = L.companySpecs();
    await ctx.yield();
    const company = companySpecs.map((P) => { const b = L.buildPlate(mats.facetBody, P.phase, P, P.habit, P.turn); b.mesh.renderOrder = 1; b.mesh.name = 'company'; scene.add(b.mesh); return b; });
    scene.userData.company = companySpecs.map((P) => [...P.at.map((v) => Math.round(v)), Math.round(2 * P.R), +P.line.toFixed(1)]);
    // byLesser: is a place within LESSER_NET metres of the reach of a lesser plate or of one of the company (nothing of the net or the frost is built there)?
    const crystals = [...lesserSpecs, ...companySpecs];
    const byLesser = (x, y, z) => crystals.some((P) => Math.hypot(x - P.at[0], y - P.at[1], z - P.at[2]) < P.R + L.LESSER_NET);
    await ctx.yield();
    // the hollow's far wall at the level (the part's farWall: the ferns of the cold side root in it), found in pieces
    await L.primeFarWall(ctx);
    // MIST (round r10; the part's buildMist): the violet and blue deep behind the rose
    const mist = L.buildMist(shared); mist.mesh.renderOrder = -0.25; scene.add(mist.mesh);
    await ctx.yield();
    // THE NET HAS REST (round r10; the part's netRest, netStands): where in the slow noise the visit lies is dealt (the
    // stream 'net-rest'); atRest: does a site not stand by that law?
    const restShift = [rRest.range(0, 3000), rRest.range(0, 3000), rRest.range(0, 3000)];
    const atRest = (q, k = q.k) => !L.netStands(q.c, q.j, k, q.x, q.y, q.z, restShift);
    // BEHIND THE PLATE THE NET IS THINNED TO HALF (round r9): A HOLLOW OF THE NET of the plate's own breadth and half again
    // (a ball of PLATE_NET times its reach, its centre the plate's reach behind the plate's centre along its axis, away
    // from the way): of the lamps that stand or grow in it every second one is not built (a hash of the site, the same on
    // every seed), so that the plate stands out. byPlate: is a place within PLATE_KEEP metres of the disc the plate sweeps?
    const PLATE_NET = 1.5, PLATE_KEEP = 8, netAt = [0, 1, 2].map((a) => plate.at[a] - plate.axis.getComponent(a) * plate.R);
    const inNetHollow = (x, y, z) => Math.hypot(x - netAt[0], y - netAt[1], z - netAt[2]) < PLATE_NET * plate.R;
    const thinned = (q) => inNetHollow(q.x, q.y, q.z) && L.siteHash(q.c, q.j, q.k, 511) < 0.5;
    const byPlate = (x, y, z, keep = PLATE_KEEP) => L.plateClear(x, y, z) < keep;
    // THE HOLLOW IS DARK ROUND IT: is a place within SNOW_CLEAR metres of any site of the crystal? (every sheet alike)
    const bySnow = (x, y, z) => L.snowClear(hero.figure, x, y, z) < L.SNOW_CLEAR;

    // ------------------------------------------------------------ the crystal that stands, and the rind of every wall
    // Lamps for every standing site of every sheet; threads only for sites within 240 m of the route's line. A row of
    // the finished crystal that begins at the built bound far in the haze (x -400) may carry a fault: its first lamp
    // is dark and its last one is marked, the two ends of the row's slide. A row that begins again beyond the hollow
    // or beyond the lane is a row of its own and carries none.
    // THE LANE (round r4), by place: where the line crosses the ranks and the sheets no lamp stands within LANE_LAMP
    // metres of the route's line and no thread within LANE_THREAD (on the open rank the lattice itself keeps further off)
    const LANE_LAMP = 9, LANE_THREAD = 6.5;
    // THE FROST LANE (round r7; a matter of the look, the lane above stays the law of clear air): no thread of young frost
    // (a thread of the live rind with an end on a clock, a small fern's, a wall fern's) stands within FROST_LANE metres of
    // the route's line, so that no white thread passes close beside the way
    const FROST_LANE = 14;
    const RED = (() => { const c = new THREE.Color('#E0452B'); return [c.r * 2.2, c.g * 2.2, c.b * 2.2]; })();
    const redSalt = 77 + rRed.int(0, 900), rare = !!vary.rare;
    const sheets = [...L.K_BEHIND]; for (let k = L.K_FIRST; k <= L.K_LAST; k++) sheets.push(k);
    const lamps = L.lampBatch(false), threads = L.threadBatch(false), gLamps = L.lampBatch(true), gThreads = L.threadBatch(true), faultRows = [];
    const nearRoute = (x, y, z, r) => !L.offRouteBox(x, y, z, r) && L.pointClear(x, y, z, r) < r;
    // THE WAY IN (round r8; round r10: by place alone): the line's stretch from the entry to THE WALL ITSELF, the place
    // where the line leaves the crystal for the hollow (the first place of the line that the hollow's own law calls
    // hollow). ONE MARGIN: NO FROST FORM STANDS WITH A SITE WITHIN WAY_FROST METRES OF THAT STRETCH: no small fern, no
    // wall fern, no great fern, no fern of the ice, no flake's rim and no thread of the live rind (beyond it they stand
    // as everywhere). WAY_FROST is twice a great fern's own greatest length (GREAT_LONG[1]): a fern that stands two of
    // its lengths from the way fills under 30 degrees of the sight when it is nearest, and is passed whole.
    // wayNear: how near a place stands to the stretch (`far` and more: `far`).
    const WAY_FROST = 90, wayBox = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9], cut = { ferns: 0, threads: 0 };
    let wayN = 0; while (wayN < route.n - 1 && L.hollowDepth(route.fine[wayN * 3], route.fine[wayN * 3 + 1], route.fine[wayN * 3 + 2]) > 0) wayN++;
    for (let i = 0; i <= wayN; i += 4) for (let a = 0; a < 3; a++) { const v = route.fine[i * 3 + a]; wayBox[a * 2] = Math.min(wayBox[a * 2], v); wayBox[a * 2 + 1] = Math.max(wayBox[a * 2 + 1], v); }
    const wayNear = (x, y, z, far = WAY_FROST) => {
      if (x < wayBox[0] - far || x > wayBox[1] + far || y < wayBox[2] - far || y > wayBox[3] + far || z < wayBox[4] - far || z > wayBox[5] + far) return far;
      let best = far * far;
      for (let i = 0; i <= wayN; i += 4) { const dx = route.fine[i * 3] - x, dy = route.fine[i * 3 + 1] - y, dz = route.fine[i * 3 + 2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < best) best = d2; }
      return Math.sqrt(best);
    };
    const byWay = (q) => wayNear(q.x, q.y, q.z) < WAY_FROST;
    await ctx.yield();
    const inLane = (x, y, z) => nearRoute(x, y, z, LANE_LAMP);
    const PALE_GATE = L.threadColourOf(0);
    for (const k of sheets) {
      const all = L.latticeSites(k), standing = new Map(), gate = k >= L.K_FAULT - 3 && k < L.K_FAULT;
      // (the net's edge toward the hollow: a site in a bay is not built, one by a bay's border has less light: the part's netEdge)
      for (const s of all) {
        if (s.state === L.RIND_LIVE || inLane(s.x, s.y, s.z) || thinned(s) || byLesser(s.x, s.y, s.z) || atRest(s, k)) continue;
        // (round r11) the net does not end at an edge: toward its end a site may not stand (the part's netThin)
        s.thin = L.netThin(s.x, s.y, s.depth); if (!L.netThinStands(s.c, s.j, k, s.thin)) continue;
        s.edge = L.netEdge(s.c, s.j, k, s.x, s.y, s.z, s.depth); if (s.edge > 0) standing.set(L.siteKey(s.c, s.j, k), s);
      }
      let row = null;
      for (let n = 0; n < all.length; n++) {
        const s = all[n];
        if (n % 20 === 19) await ctx.yield();
        if (!standing.has(L.siteKey(s.c, s.j, k))) continue;
        // the six lamps round the spark are the spark's own (drawn with its threads)
        if (k === L.K_FAULT && Math.hypot(s.x, s.y) < L.SIDE + 1) continue;
        const first = !row || row.j !== s.j || s.c !== row.c + 2, faulty = first ? s.x < L.BOUNDS.x0 + 30 : row.faulty;
        if (first) { row = { j: s.j, y: s.y, z: s.z, x0: s.x, x1: s.x, last: -1, faulty }; if (faulty && k >= L.K_FIRST) faultRows.push(row); }
        row.c = s.c;
        // the rare garnet tint: about one gold lamp in thirty, none within 60 m of the open rank's line, none inside a cone
        // of 24 degrees about the entry axis from E, and none in the red deep (depth 144 m and more), where it could not read as a tint
        const red = rare && s.state === L.FINISHED && s.depth < 144 && L.siteHash(s.c, s.j, k, redSalt) < 1 / 30 && Math.hypot(s.x, s.y) > 60 && Math.atan2(Math.hypot(s.x, s.y), s.z) > 24 * Math.PI / 180;
        row.last = lamps.count; row.x1 = s.x;
        // (round r11) toward the net's end a lamp is small and cool: no great lamp there, frost white at the very end
        const size0 = L.lampSize(s.c, s.j, k), size = lerp(Math.min(size0, 1) * L.NET_SMALL, size0, s.thin), soft = size > 1 ? L.LAMP_GREAT_LIGHT : 1;
        lamps.add(s.x, s.y, s.z, first && faulty ? 1 : 0, red ? RED : L.netThinColour(L.lampColourOf(s.depth), L.PALE, L.NET_FROST, s.thin).map((v) => v * s.edge * soft), s.state === L.FINISHED ? 1 : smoothstep(22, 48, s.depth), null, null, L.lampAux(s.x, s.y, s.z, size));
        if (k < L.K_FIRST || !nearRoute(s.x, s.y, s.z, 240)) continue;
        for (let t = 0; t < 3; t++) {
          const c = s.c + L.STEPS[t][0], j = s.j + L.STEPS[t][1], o = standing.get(L.siteKey(c, j, k));
          if (!o) continue;
          const A = [s.x, s.y, s.z], B = [o.x, o.y, o.z];
          if (L.lineClear(A[0], A[1], A[2], B[0], B[1], B[2], 32) < LANE_THREAD) continue;
          // the row's last thread is marked: it goes out as it slides onto the live rind when a fault runs down its row
          const lastOfRow = t === 0 && row.faulty && !standing.has(L.siteKey(c + 2, j, k));
          const near = L.threadNear(A, B);
          // THE GATE: the threads of the three sheets before the fault plane within 30 m of the line stand out in pale gold at twice the common light
          const g = gate ? 1 - smoothstep(24, 30, L.lineClear(A[0], A[1], A[2], B[0], B[1], B[2], 32)) : 0, lift = near.light * (1 + g);
          const col = L.netThinColour(L.threadColourOf((s.depth + o.depth) / 2), L.THREAD_PALE, L.NET_FROST_THREAD, Math.min(s.thin, o.thin));
          threads.add(A, B, lastOfRow ? 1 : 0, near.width, [lerp(col[0], PALE_GATE[0], g) * lift, lerp(col[1], PALE_GATE[1], g) * lift, lerp(col[2], PALE_GATE[2], g) * lift], null, null, 0, [0, near.vane, 0.5 * g, near.near]);
        }
      }
      await ctx.yield();
      // the growing edge: the live rind of this sheet on its clocks (its threads only within 300 m of the route's line);
      // none in the lane, and none within SNOW_CLEAR of any site of the snow crystal (the hollow is dark round it)
      if (k >= L.K_FIRST) {
        const free = (q) => !inLane(q.x, q.y, q.z) && !bySnow(q.x, q.y, q.z) && !thinned(q) && !byLesser(q.x, q.y, q.z) && !atRest(q, k);
        const set = L.rindSet(k, rate, () => true, () => true, all);
        await ctx.yield();
        set.sites = set.sites.filter(free);
        set.threads = set.threads.filter(([A, B]) => free(A) && free(B) && nearRoute(A.x, A.y, A.z, 300) && L.lineClear(A.x, A.y, A.z, B.x, B.y, B.z, 32) >= (A.clock[0] > 0 || B.clock[0] > 0 ? FROST_LANE : LANE_THREAD));
        // (the way in: no thread of the live rind with an end within WAY_FROST metres of it)
        { const n0 = set.threads.length; set.threads = set.threads.filter(([A, B]) => !byWay(A) && !byWay(B)); cut.threads += n0 - set.threads.length; }
        await ctx.yield();
        L.addGrowth(gLamps, gThreads, set, cold);
        await ctx.yield();
      }
    }
    // ------------------------------------------------------------ THE POINTS BETWEEN THE SHEETS (round r6: no sight along a plane of the lattice is a bare band)
    // The crystal's own order goes on between its sheets: over the centre of every triangle of a sheet's net stands a small
    // dim gold point, a third of the way to the next sheet over the triangles that point up and two thirds of the way over
    // those that point down (so a slab seen end on is three fine slabs, and so is the gap between two rows). They are
    // built within BETWEEN_M metres of the route's line (their light falls to nothing over its outer two fifths), stand only
    // in crystal that stands (26 m and more inside it from the hollow's wall) and never in the lane.
    const BETWEEN_M = 260, BETWEEN_SIZE = 0.5;
    // THE SLAB THE LINE RUNS ALONG IS ORDERED TWICE AS FINE (round r7). A line that crosses a slab leaves it within a
    // few tens of metres; a slab that holds more than SLAB_RUN metres of the line at a stretch is run ALONG, and a sight
    // down the line there is a sight down that slab's own planes, in whichever bare third the line lies: a thin dark
    // lane on the very point the rows run to. Every such slab carries the same points at every sixth of the way: over
    // the triangles that point down at one sixth, over the net's sites half way, over those that point up at five
    // sixths (the same order, gone on), so the line there is never further than a sixth of a slab from a plane of points.
    const SLAB_RUN = 60, fineSlabs = new Set();
    for (let i = 0, k0 = null, from = 0; i < route.n; i++) {
      const k = Math.floor(route.fine[i * 3 + 2] / L.GAP);
      if (k !== k0) { k0 = k; from = i; } else if ((i - from) * 0.25 > SLAB_RUN) fineSlabs.add(k);
    }
    // each family: how far along the row from a site, how far off the row, how far to the next sheet
    const THIRDS = [[12, L.ROW / 3, 1 / 3], [12, -L.ROW / 3, 2 / 3]], SIXTHS = [...THIRDS, [12, -L.ROW / 3, 1 / 6], [0, 0, 1 / 2], [12, L.ROW / 3, 5 / 6]];
    for (let k = L.K_FIRST; k < L.K_LAST; k++) {
      const j0 = Math.ceil(L.BOUNDS.y0 / L.ROW - 1), j1 = Math.floor(L.BOUNDS.y1 / L.ROW + 1);
      for (let j = j0; j <= j1; j++) {
        const y0 = L.rowY(j, k); let c = Math.ceil(L.BOUNDS.x0 / 12); if ((c & 1) !== (j & 1)) c++;
        for (let n = 0; 12 * c <= L.BOUNDS.x1; c += 2, n++) {
          if (n % 12 === 11) await ctx.yield();
          for (const [along, off, share] of fineSlabs.has(k) ? SIXTHS : THIRDS) {
            const x = 12 * c + along, y = y0 + off, z = L.GAP * (k + share);
            if (L.offRouteBox(x, y, z, BETWEEN_M)) continue;
            const d = L.pointClear(x, y, z, BETWEEN_M); if (d >= BETWEEN_M || d < LANE_LAMP) continue;
            const depth = L.hollowDepth(x, y, z); if (depth < 26 || L.gateDist(x, y, z) < L.SIDE || byLesser(x, y, z)) continue;
            const bay = Math.hypot(x, y) < L.RANK_CORE ? 0 : L.netBay(x, y, z); if (depth <= bay) continue;
            // (round r10) a point between the sheets goes with its own rank: it stands where its rank stands by the net's law of rest
            if (!L.netStands(c, j, k, x, y, z, restShift)) continue;
            // (round r11) and it thins out, shrinks and cools toward the net's end as the lamps do
            const thin = L.netThin(x, y, depth); if (!L.netThinStands(c, j, k + 100, thin)) continue;
            const col = L.netThinColour(L.lampColourOf(depth), L.PALE, L.NET_FROST, thin), w = 0.6 * (1 - smoothstep(0.6 * BETWEEN_M, BETWEEN_M, d)) * (bay > 0 ? smoothstep(0, L.EDGE_SOFT, depth - bay) : 1);
            lamps.add(x, y, z, 0, [col[0] * w, col[1] * w, col[2] * w], 0.5, null, null, [BETWEEN_SIZE * lerp(L.NET_SMALL, 1, thin), 0.5, 0, 0, 0]);
          }
        }
        await ctx.yield();
      }
    }
    // mark the last standing lamp of every row that may carry a fault (the near end of its slide)
    const lampMesh = await lamps.meshInSteps(ctx, mats.lamp), siteAttr = lampMesh.geometry.getAttribute('aSite');
    for (const r of faultRows) if (r.last >= 0) siteAttr.setW(r.last, 2);
    scene.add(lampMesh);
    await ctx.yield();
    const threadMesh = await threads.meshInSteps(ctx, mats.thread); scene.add(threadMesh);
    await ctx.yield();

    // ------------------------------------------------------------ A LOW FROST OF SMALL FERNS along the hollow's walls and rim (dealt by the seed)
    // each 20 to 50 m long, growing inward from the near wall, the far wall, the roof or the floor, in a sheet of the
    // hollow, from a stream of its own; white while young, ice blue for a while, then pale gold. A fern takes only
    // sites no earlier one holds. NONE within SNOW_CLEAR of the snow crystal or 14 m of a wall fern, none in the frost lane, and NO
    // FROST BY THE GATE (the part's byGate: within GATE_M of the last rank's line).
    // FROST FERNS WHERE THE LINE GOES THROUGH A WALL OF THE HOLLOW (round r6; the same on every seed: the first of the two
    // places is seen from the entry, a part of the join). The line goes through the wall toward the open rank twice: into the bay, and out of
    // the hollow after the pass. In every sheet within WALL_FERN_Z metres of such a place that wall carries five ferns of
    // ice blue frost (the part's wallFern: small arms of the crystal's own kind, 18 to 42 m), rooted on the wall's
    // outermost standing sites of the five rows about the line's own height there, growing into the hollow; no site of a
    // fern within WALL_FERN_OFF metres of the route's line. THE DARK BEFORE THE CRYSTAL IS KEPT CLEAR AT THE LINE'S OWN
    // HEIGHT (round r7): in the sheets that stand between such a place and the crystal's own sheet the wall wears ferns
    // on the two outermost of the five rows only (two rows over and two rows under the line's height).
    const WALL_FERN_Z = 70, WALL_FERN_OFF = 24, fernSites = [], inHollow = (x, y, z) => L.stateAt(x, y, z) === L.BEYOND && !nearRoute(x, y, z, WALL_FERN_OFF) && !bySnow(x, y, z) && !L.byGate(x, y, z) && !byPlate(x, y, z) && !byLesser(x, y, z);
    {
      const through = []; let was = L.hollowDepth(route.fine[0], route.fine[1], route.fine[2]) > 0;
      for (let i = 4; i < route.n; i += 4) { const x = route.fine[i * 3], y = route.fine[i * 3 + 1], z = route.fine[i * 3 + 2], now = L.hollowDepth(x, y, z) > 0; if (now !== was) through.push([x, y, z]); was = now; }
      await ctx.yield();
      for (let k = L.K_FIRST; k < L.K_FAULT; k++) for (const at of through) {
        if (Math.abs(L.GAP * k - at[2]) > WALL_FERN_Z) continue;
        // is this sheet between the place and the crystal's sheet?
        const toSnow = L.SNOW_AT[2] - at[2], off = L.GAP * k - at[2], before = off * toSnow > 0 && Math.abs(off) < Math.abs(toSnow);
        for (let n = -2; n <= 2; n++) {
          if (before && Math.abs(n) < 2) continue;
          const j = Math.round(at[1] / L.ROW - (L.isB(k) ? 0 : 2 / 3)) + n, y = L.rowY(j, k), z = L.GAP * k;
          // the wall's outermost standing site of this row, going out from the open rank's side
          let c = 1 + (j & 1 ? 0 : 1), W = null;
          for (; 12 * c < 200; c += 2) { if (L.stateAt(12 * c, y, z) === L.BEYOND) break; W = c; }
          if (W === null || 12 * c >= 200) continue;
          const h = (q) => L.siteHash(W, j, k, 410 + q), fig = L.wallFern([12 * W, y, z], [0, 0, 1, 5][Math.floor(4 * h(0))], 3 + Math.floor(5 * h(1)), [(20 + 20 * h(2)) / rate, h(3)], inHollow);
          if (fig.sites.length < 3) continue;
          const first = fig.sites[fig.root[0]];
          if (L.lineClear(first.x, first.y, first.z, fig.root[1][0], fig.root[1][1], fig.root[1][2], 32) < FROST_LANE) continue;
          if (fig.sites.some(byWay)) { cut.ferns++; continue; }
          L.addSnow(gLamps, gThreads, fig, true); for (const q of fig.sites) fernSites.push(q);
        }
        await ctx.yield();
      }
    }
    // THE GREAT FERNS OF THE WAY IN (round r8; the same on every seed: they are seen from the entry, a part of the join).
    // In the sheets the way in runs by, the wall carries AT MOST ONE GREAT FERN A SHEET (GREAT_MAX in all): an arm of the
    // crystal's own kind at the crystal's own light, one rank finer in width (the part's wallFern, drawn by addSnow as a
    // great fern), rooted on the wall's outermost standing site of a row within three rows of the way's height,
    // GREAT_LONG[0] to GREAT_LONG[1] metres from its root to its growing tip. A great fern is WHOLE: every site of its
    // figure stands in the hollow (so none comes within WALL_FERN_OFF metres of the line, the tip included); its root
    // stands within GREAT_ROOT metres of the way in (the margin and a fern's greatest length) and no site of it within the margin WAY_FROST.
    // Of the rows and the three directions into the hollow that allow one, the sheet takes the one its own site's hash names.
    const GREAT_LONG = [25, 45], GREAT_ROOT = WAY_FROST + GREAT_LONG[1], GREAT_MAX = 6, great = [];
    {
      const count = new Map(), whole = (d, N) => { const key = d * 16 + N; if (!count.has(key)) count.set(key, L.wallFern([0, 0, 0], d, N, null, () => true).sites.length); return count.get(key); };
      for (let k = L.K_FIRST; k < L.K_FAULT && great.length < GREAT_MAX; k++) {
        const z = L.GAP * k; if (z < wayBox[4] - WAY_FROST || z > wayBox[5] + WAY_FROST) continue;
        let best = null;
        for (let n = -3; n <= 3; n++) {
          const j = Math.round(-(L.isB(k) ? 0 : 2 / 3)) + n, y = L.rowY(j, k);
          let c = 1 + (j & 1 ? 0 : 1), W = null;
          for (; 12 * c < 200; c += 2) { if (L.stateAt(12 * c, y, z) === L.BEYOND) break; W = c; }
          if (W === null || 12 * c >= 200 || wayNear(12 * W, y, z, GREAT_ROOT + 1) > GREAT_ROOT) continue;
          for (const d of [0, 1, 5]) for (let N = 7; N >= 4; N--) {
            const h = (q) => L.siteHash(W, j, k, 430 + 7 * d + q), fig = L.wallFern([12 * W, y, z], d, N, [(20 + 20 * h(1)) / rate, h(2)], inHollow);
            if (fig.sites.length < whole(d, N) || fig.sites.some(byWay)) continue;
            let tip = null; for (const q of fig.sites) if (q.rank === 0) tip = q;
            const long = Math.hypot(tip.x - 12 * W, tip.y - y);
            if (long < GREAT_LONG[0] || long > GREAT_LONG[1]) continue;
            if (!best || h(0) > best.score) best = { score: h(0), fig, long, at: [12 * W, y, z], d, tip };
            break;
          }
          await ctx.yield();
        }
        if (!best) continue;
        L.addSnow(gLamps, gThreads, best.fig, 'great'); for (const q of best.fig.sites) fernSites.push(q);
        // (kept on the scene for a count: where it roots, its direction, its length, how near its root stands to the way in and its tip to the line)
        great.push([best.at[0], Math.round(best.at[1]), best.at[2], best.d, Math.round(best.long), Math.round(wayNear(best.at[0], best.at[1], best.at[2], 99)), Math.round(L.pointClear(best.tip.x, best.tip.y, best.tip.z, 99))]);
      }
    }
    // THE FERNS OF THE COLD SIDE (round r9; the same on every seed: the cold side is seen from the entry, a part of the join).
    // THE COLD SIDE IS WHERE THE FROST COMES FROM: in the sheets a hash of the sheet names (ICE_FERN_SHARE of them, at most
    // ICE_FERNS), a great fern ROOTS IN THE HOLLOW'S FAR WALL (ICE_FERN_BACK metres behind it, toward the cold deep) and
    // grows straight out of it into the hollow, toward the net: an arm of
    // the crystal's own kind (the part's wallFern on the sheet's direction toward -X, drawn as a great fern), ICE_FERN_N[0]
    // to ICE_FERN_N[1] frost sites long, in a row of the sheet within two rows of the level (by the hash), no two nearer
    // than ICE_FERN_APART sheets, none whose foot stands more than four frost steps before the wall. Its root thread
    // runs ICE_FERN_ROOT metres on behind its root, so it is seen to come out of the cold. It stands only WHOLE (every
    // site in the hollow, clear of the way, the crystal and the plate by the hollow's own rule) and outside the margin of the way in.
    const ICE_FERNS = 6, ICE_FERN_SHARE = 0.5, ICE_FERN_N = [7, 10], ICE_FERN_ROOT = 14, ICE_FERN_BACK = 7, ICE_FERN_APART = 3, iceFerns = [];
    {
      const count = new Map(), whole = (N) => { if (!count.has(N)) count.set(N, L.wallFern([0, 0, 0], 3, N, null, () => true).sites.length); return count.get(N); };
      let lastK = -99;
      for (let k = L.K_FIRST; k < L.K_FAULT && iceFerns.length < ICE_FERNS; k++) {
        const h = (q) => L.siteHash(0, 0, k, 610 + q), z = L.GAP * k;
        if (h(0) > ICE_FERN_SHARE || z < L.FAR_Z[0] + 40 || z > L.FAR_Z[1] - 40 || k - lastK < ICE_FERN_APART) continue;
        const j = Math.round(-(L.isB(k) ? 0 : 2 / 3)) + Math.floor(5 * h(1)) - 2, y = L.rowY(j, k), front = L.farWall().farX(z) + ICE_FERN_BACK;
        // the fern's foot: the first place in from its root, on the frost net's step, whose next step stands in the hollow
        let x = front - L.SNOW.pitch, steps = 0; while (steps < 4 && !inHollow(x - L.SNOW.pitch, y, z)) { x -= L.SNOW.pitch; steps++; }
        if (steps >= 4) continue;
        const N = ICE_FERN_N[0] + Math.floor((ICE_FERN_N[1] - ICE_FERN_N[0] + 0.999) * h(2)), fig = L.wallFern([x, y, z], 3, N, [(20 + 20 * h(3)) / rate, h(4)], inHollow);
        await ctx.yield();
        if (fig.sites.length < whole(N) || !fig.root || fig.sites.some(byWay)) continue;
        fig.root = [fig.root[0], [front + ICE_FERN_ROOT, y, z]];
        L.addSnow(gLamps, gThreads, fig, 'great'); for (const q of fig.sites) fernSites.push(q);
        // (kept on the scene for a count: its foot, its sites to the spine, how near its tip stands to the line)
        let tip = null; for (const q of fig.sites) if (q.rank === 0) tip = q;
        lastK = k; iceFerns.push([Math.round(x), Math.round(y), z, N, Math.round(L.pointClear(tip.x, tip.y, tip.z, 199))]);
      }
    }
    scene.userData.iceFerns = iceFerns;
    scene.userData.wayIn = { metres: wayN * 0.25, great, cut };
    const byFern = (x, y, z) => { for (const q of fernSites) if (Math.abs(q.z - z) < 1 && Math.hypot(q.x - x, q.y - y) < 14) return true; return false; };
    const taken = new Set(), H = L.HOLLOW, high = (k) => L.hollowHigh(L.GAP * k), deep = (k) => L.hollowDeep(L.GAP * k);
    const rowNear = (y, k) => Math.round(y / L.ROW - (L.isB(k) ? 0 : 2 / 3));
    // a root site of row j behind a wall: the column nearest x that the row holds
    const rootAt = (x, j) => { let c = Math.round(x / 12); if ((c ^ j) & 1) c++; return [c, j]; };
    const kHol = []; for (let k = L.K_FIRST; k <= L.K_LAST; k++) if (high(k) >= 2 * L.SIDE) kHol.push(k);
    // ------------------------------------------------------------ THE SMALL FLAKES (round r8; dealt by the seed, a stream of its own)
    // FLAKES[0] to FLAKES[1] small whole six-armed crystals in the hollow, each made by the great crystal's own law at
    // its size (the part's snowFigure with a flake's place and pitch: FLAKE_ARM sites to a spine, FLAKE_ACROSS metres
    // across), each lying in a sheet of the net with its centre on a site of that sheet, NO TWO IN ONE SHEET and none
    // in the crystal's own: they stand at unlike depths before and behind it. By place: a flake's centre stands
    // FLAKE_WALL metres and its own reach inside the hollow, FLAKE_LINE metres and its reach from the flown line,
    // outside the crystal's dark and the gate's, clear of every fern by 14 m, and OFF EVERY STRAIGHT SIGHT FROM THE LINE
    // TO THE CRYSTAL'S CENTRE within the hollow by FLAKE_SIGHT metres and its reach (from no place of the way does a
    // flake stand before the hero's heart). Its threads stand for good; along its six spines lies the crystal's ice
    // at its size, and the ice's own light runs out along them on the world clock as along the hero's.
    // (round r11m1: THE ROSE HAS DEPTH) A FLAKE IS A CRYSTAL: no ring of the rose comes within FLAKE_RING metres of a
    // flake's rim (the part's roseClear at its centre, less its own reach), as LESSER_RING keeps them off the lesser
    // plates; a site that fails takes no flake and the deal goes on to its next try.
    const FLAKES = [5, 9], FLAKE_ACROSS = [4, 12], FLAKE_ARM = [6, 8], FLAKE_WALL = 16, FLAKE_LINE = 10, FLAKE_SIGHT = 4, FLAKE_RING = 20, flakes = [], flakeIce = L.iceBatch();
    {
      const inside = [], C = hero.center;
      for (let i = 0; i < route.n; i += 8) { const x = route.fine[i * 3], y = route.fine[i * 3 + 1], z = route.fine[i * 3 + 2]; if (L.hollowDepth(x, y, z) <= 0) inside.push([C.x - x, C.y - y, C.z - z, x, y, z]); }
      await ctx.yield();
      // how near a place stands to the nearest of the straight sights from the line's places in the hollow to the crystal's centre
      const sightClear = (x, y, z) => {
        let best = 1e9;
        for (const [dx, dy, dz, ex, ey, ez] of inside) {
          const t = clamp(((x - ex) * dx + (y - ey) * dy + (z - ez) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1), d = Math.hypot(ex + dx * t - x, ey + dy * t - y, ez + dz * t - z);
          if (d < best) best = d;
        }
        return best;
      };
      const want = rFlake.int(FLAKES[0], FLAKES[1]), used = new Set([L.SNOW.k]);
      for (let tries = 0; tries < 80 * want && flakes.length < want; tries++) {
        const k = rFlake.pick(kHol), across = rFlake.range(FLAKE_ACROSS[0], FLAKE_ACROSS[1]), arm = rFlake.int(FLAKE_ARM[0], FLAKE_ARM[1]), u = rFlake(), v = rFlake(), R = across / 2;
        if (tries % 6 === 5) await ctx.yield();
        if (used.has(k)) continue;
        const z = L.GAP * k, [c, j] = rootAt(H.x + lerp(0.08, 0.92, u) * deep(k), rowNear(lerp(-0.85, 0.85, v) * high(k), k)), x = 12 * c, y = L.rowY(j, k);
        if (L.hollowDepth(x, y, z) > -(FLAKE_WALL + R) || L.pointClear(x, y, z, FLAKE_LINE + R + 4) < FLAKE_LINE + R) continue;
        if (L.snowClear(hero.figure, x, y, z, L.SNOW_CLEAR + R + 1) < L.SNOW_CLEAR + R || L.byGate(x, y, z)) continue;
        if (fernSites.some((q) => Math.abs(q.z - z) < 1 && Math.hypot(q.x - x, q.y - y) < 14 + R)) continue;
        if (byPlate(x, y, z, PLATE_KEEP + R) || crystals.some((P) => Math.hypot(x - P.at[0], y - P.at[1], z - P.at[2]) < P.R + L.LESSER_NET + R)) continue;
        if (wayNear(x, y, z, WAY_FROST + R + 1) < WAY_FROST + R) continue;
        if (L.roseClear(x, y, z, FLAKE_RING + R + 1) < FLAKE_RING + R) continue;
        const sight = sightClear(x, y, z); if (sight < FLAKE_SIGHT + R) continue;
        const size = R / arm / L.SNOW.pitch, fig = L.snowFigure(null, { at: [x, y, z], pitch: R / arm, arm, salt: flakes.length + 1 });
        L.addSnow(gLamps, gThreads, fig, false, size); L.addIce(flakeIce, fig, size);
        // (its centre and its six tips keep the small ferns off it)
        fernSites.push(fig.sites[0]); for (const spine of fig.spines) fernSites.push(fig.sites[spine[spine.length - 1]]);
        // (kept on the scene for a count: its centre, how broad, its sites to a spine, how near the line and the nearest sight)
        used.add(k); flakes.push([x, Math.round(y), z, Math.round(across * 10) / 10, arm, Math.round(L.pointClear(x, y, z, 99)), Math.round(sight)]);
      }
    }
    scene.userData.flakes = flakes;
    const flakeMesh = flakeIce.mesh(mats.ice); flakeMesh.name = 'flake ice'; scene.add(flakeMesh);
    await ctx.yield();
    // (what was dealt and built, kept on the scene for a count by replay: wall 0 near, 1 far, 2 roof or floor; the sheet's z; metres)
    const smallBuilt = [];
    for (let n = 0; n < nSmall; n++) {
      const r = rSmall[n], wall = r.int(0, 3), k0 = r.pick(kHol), len = r.range(20, 50), kind = r.chance(0.5) ? shape : 'sprig', up = r.chance(0.5), turn = r.chance(0.5);
      const at = wall < 2 ? r.range(-0.8, 0.8) * high(k0) : H.x + r.range(0.15, 0.75) * deep(k0);
      const rule = wall === 0 ? { root: rootAt(36, rowNear(at, k0)), a: 0 } : wall === 1 ? { root: rootAt(L.BOUNDS.x1, rowNear(at, k0)), a: 3 }
        : { root: rootAt(at, rowNear((up ? 1 : -1) * (high(k0) + 2 * L.ROW), k0)), a: up ? (turn ? 4 : 5) : (turn ? 1 : 2) };
      const fig = L.fernFigure({ k0, half: 0, ...rule, ribbon: false, len, shape: kind, period: [20, 40], rate }, r);
      if (n % 4 === 3) await ctx.yield();
      if (!fig.sites.length || fig.sites.some((q) => L.byGate(q.x, q.y, q.z) || bySnow(q.x, q.y, q.z) || nearRoute(q.x, q.y, q.z, FROST_LANE) || byPlate(q.x, q.y, q.z) || byLesser(q.x, q.y, q.z) || byFern(q.x, q.y, q.z) || taken.has(L.siteKey(q.c, q.j, q.k)))) continue;
      const set = L.fernSet(fig, rate);
      if (set.threads.some(([A, B]) => L.lineClear(A.x, A.y, A.z, B.x, B.y, B.z, 32) < FROST_LANE)) continue;
      if (fig.sites.some(byWay)) { cut.ferns++; continue; }
      for (const q of fig.sites) taken.add(L.siteKey(q.c, q.j, q.k));
      L.addGrowth(gLamps, gThreads, set, cold); smallBuilt.push([wall, L.GAP * k0, Math.round(len)]);
    }
    scene.userData.smallFerns = smallBuilt;
    scene.add(gLamps.mesh(mats.lampGrowth));
    await ctx.yield();
    scene.add(gThreads.mesh(mats.threadGrowth));
    await ctx.yield();

    // ------------------------------------------------------------ the free points (a medium; see FREE_VERT)
    // (they drift through the whole hollow; none shows within SNOW_CLEAR metres of the crystal's sheet: a law of the point's own place)
    const nFree = Math.round(1400 * clamp(vary.density ?? 1, 0.7, 1.3) * detail), freeZ0 = H.z - H.az + 5;
    {
      const g = new THREE.InstancedBufferGeometry(), seedA = new Float32Array(nFree * 4), ph = new Float32Array(nFree * 2);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < nFree; i++) { seedA[i * 4] = rFree(); seedA[i * 4 + 1] = rFree.range(-H.ay + 5, H.ay - 5); seedA[i * 4 + 2] = rFree.range(freeZ0, H.z + H.az - 5); seedA[i * 4 + 3] = rFree.range(2, 5); ph[i * 2] = rFree() * 6.2832; ph[i * 2 + 1] = rFree() * 6.2832; }
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedA, 4)); g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 2)); g.instanceCount = nFree;
      // the route's stretch with x over 50, as a polyline of FREE_N points
      let i0 = 0, i1 = 0; for (let i = 0; i < route.n; i++) if (route.fine[i * 3] >= 50) { if (!i0) i0 = i; i1 = i; }
      const line = []; for (let q = 0; q < FREE_N; q++) { const i = Math.round(lerp(i0, i1, q / (FREE_N - 1))); line.push(new THREE.Vector3(route.fine[i * 3], route.fine[i * 3 + 1], route.fine[i * 3 + 2])); }
      const free = new THREE.Mesh(g, new THREE.ShaderMaterial({ ...additive, uniforms: { ...shared, uRoute: { value: line } }, vertexShader: FREE_VERT, fragmentShader: FREE_FRAG }));
      free.frustumCulled = false; scene.add(free);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the faults: which rows a fault may run down
    // a row of the finished crystal (from the built bound to its last standing lamp) whose nearest point to the route's
    // line is 20 to 220 m off; and, for the second fault's clock, those 20 to 90 m off THAT END AT A WALL OF THE HOLLOW
    // OR AT THE LANE (a row that runs on to the far built bound is the first fault's alone: its run is the longest)
    const faults = [], faultsNear = [];
    for (let n = 0; n < faultRows.length; n++) {
      const r = faultRows[n], k = Math.round(r.z / L.GAP);
      if (n % 50 === 49) await ctx.yield();
      // not a row by the gate (within GATE_M of the last rank's line): what surrounds the spark is quiet
      if (r.last < 0 || L.byGate(clamp(0, r.x0, r.x1), r.y, r.z)) continue;
      // the row runs from far in the haze to x1: its nearest point to a sample of the line is the sample's own x, or x1
      let d2 = Infinity;
      for (let i = 0; i < route.n; i += 16) { const dx = Math.max(0, route.fine[i * 3] - r.x1), dy = route.fine[i * 3 + 1] - r.y, dz = route.fine[i * 3 + 2] - r.z; d2 = Math.min(d2, dx * dx + dy * dy + dz * dz); }
      if (d2 >= 400 && d2 <= 48400) faults.push(r);
      if (d2 >= 400 && d2 <= 8100 && r.x1 < L.BOUNDS.x1 - 30) faultsNear.push(r);
    }
    // A KINK RUNS ITS WHOLE ROW BEFORE THE NEXT BEGINS: a row's run is its slides (120 m a second from 10 m before its
    // first lamp to 10 m past its last) and its ripple (to 150 m at 90 m a second, and its width). EVERY ROW
    // STAYS IN ITS LIST AT EVERY MOOD: a schedule's period is never under its longest row's run; the mood sets only
    // the pause between kinks (the visit's faultEvery where that is longer). THE TWO CLOCKS ARE NEVER ONE: the first
    // list's longest run (a row across the whole built width) is longer than 0.61 of the slowest mood's period, so
    // the first clock is always the slower
    const runOf = (r) => (r.x1 - r.x0 + 20) / 120 + 150 / 90 + 0.35, longest = (list) => list.reduce((m, r) => Math.max(m, runOf(r)), 0);
    const faultsA = faults, faultsB = faultsNear, everyA = Math.max(faultEvery, longest(faultsA)), everyB = Math.max(faultEvery * 0.61, longest(faultsB));
    // two schedules at unlike clocks, each with a phase the visit deals
    const faultSalt = rFault.int(0, 100000), faultOff = rFault() * everyA, faultOffB = rFault() * everyB;
    await ctx.yield();

    // ------------------------------------------------------------ the flight: gaze and pace, by places of the route
    // the world's own field of view in degrees (the camera's; the look's rule of fitting reads it)
    const FOV = 62;
    // metres from the start at which the flown line first meets a place (the first sample that satisfies it)
    const LEN = path.length, metresWhere = (test) => { for (let i = 0; i < route.n; i++) if (test(route.fine[i * 3], route.fine[i * 3 + 1], route.fine[i * 3 + 2], i)) return i * 0.25; return LEN; };
    // one pull at a time; each rises and falls over LOOK_FADE metres of the way (round r11: 60, it was 40: the first rank is flown quicker, so the look takes hold over a longer way and the eased camera's turn there keeps under 30 degrees a second at every speed of arrival)
    const LOOK_FADE = 60;
    const look = (at, from, to, weight) => ({ at, from: from / LEN, to: to / LEN, weight, fade: Math.min(0.5, LOOK_FADE / Math.max(1, to - from)) });
    // ONE LOOK, FROM THE PLATE TO THE CRYSTAL TO THE ROSE (round r10; round r11: THE LOOK HOLDS A CRYSTAL WHILE IT
    // FITS), a law of places (the eye's, the plate's, the crystal's, the spark's, the line's own); its aim is one point
    // that moves without a break. A CRYSTAL FITS WHOLE IN THE PICTURE while the ball it sweeps stands inside the
    // picture's lesser angle about its centre: while its centre is FIT times its reach and more from the line's place
    // (FIT = 1 / sin of half the world's own field, FOV). fitTo(at, reach): the metres of the way at which the line
    // first stands nearer a crystal than that.
    //  - THE PLATE, from where the line turns out of the open rank (the entry's first RANK_OUT metres have no pull: the
    //    axis and its one white point are the entry's picture) for as long as the plate fits whole (to plateFit); then
    //    the aim goes over to the crystal's centre within the next LOOK_OVER metres of the way;
    //  - THE CRYSTAL'S CENTRE for as long as the crystal fits whole (to snowFit: with arms of 114 m it fits no longer
    //    than the plate does, so the aim arrives at a crystal that already fills the picture about its knot); from that
    //    place to the middle of the pass slab THE AIM GOES DOWN TO THE ARM AS THE LINE ITSELF DOES: out along the arm
    //    that points at the near wall to the point of its line AIM_AHEAD metres on from the eye, by the smooth share
    //    of z between those two places;
    //  - THE ROSE: from the place where the line's own heading first points at the spark (on the wide arc onto the pass:
    //    the rose stands dead ahead there, seen through the growing rind) the aim goes over to the spark, by the smooth
    //    share of the WAY from that place to where the last turn begins; from there to the last rank it is wholly on
    //    the spark, so the rose stands in the middle of the picture through the whole turn.
    // It ends where the line is within the open rank's own clear air again (the rank's threads stand 6.93 m from its axis).
    const AIM_AHEAD = 30, FIT = 1 / Math.sin(FOV / 2 * Math.PI / 180), LOOK_OVER = 50, LOOK_WEIGHT = 0.75, snowMid = hero.center.clone(), sparkAt = new THREE.Vector3(L.SPARK[0], L.SPARK[1], L.SPARK[2]), plateAt = new THREE.Vector3(plate.at[0], plate.at[1], plate.at[2]);
    const eye = new THREE.Vector3(), aim = new THREE.Vector3(), armAt = new THREE.Vector3();
    // the places, each found on the line itself: where a crystal first no longer fits whole; where the last turn begins
    // (on the pass slab's middle, the first place no further out than the turn's own centre)
    const fitTo = (at, reach) => metresWhere((x, y, z) => Math.hypot(at.x - x, at.y - y, at.z - z) < FIT * reach);
    const snowReach = Math.max(...hero.figure.sites.map((q) => Math.hypot(q.x - snowMid.x, q.y - snowMid.y, q.z - snowMid.z)));
    const plateFit = fitTo(plateAt, plate.R), snowFit = fitTo(snowMid, snowReach), snowFitZ = route.fine[Math.round(snowFit * 4) * 3 + 2];
    const turnFrom = metresWhere((x, y, z) => z > L.PASS_Z - 2 && x < L.TURN_R);
    // how far off the line's own heading (2 m on) a place stands as seen from the line's sample i, in degrees (in plan)
    const offHeading = (i, at) => {
      const q = Math.min(route.n - 1, i + 8), a = Math.atan2(at.x - route.fine[i * 3], at.z - route.fine[i * 3 + 2]) - Math.atan2(route.fine[q * 3] - route.fine[i * 3], route.fine[q * 3 + 2] - route.fine[i * 3 + 2]);
      return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) * 180 / Math.PI;
    };
    // the plate's pass (the line's nearest place to its centre)
    let platePass = 0, passD = Infinity;
    for (let i = 0; i < route.n; i += 4) { const d = Math.hypot(plateAt.x - route.fine[i * 3], plateAt.y - route.fine[i * 3 + 1], plateAt.z - route.fine[i * 3 + 2]); if (d < passD) { passD = d; platePass = i; } }
    // where the line's heading first points at the spark after the plate's pass
    let roseI = platePass; while (roseI < route.n - 9 && offHeading(roseI, sparkAt) > 1) roseI++;
    const roseFrom = roseI * 0.25;
    await ctx.yield();
    // the aim for an eye at p that has flown m metres of the way
    const aimAt = (p, m) => {
      armAt.set(Math.min(p.x - AIM_AHEAD, snowMid.x), snowMid.y, snowMid.z);
      aim.copy(snowMid).lerp(armAt, smoothstep(snowFitZ, L.PASS_Z, p.z));
      aim.lerpVectors(plateAt, aim, smoothstep(plateFit, plateFit + LOOK_OVER, m));
      return aim.lerp(sparkAt, smoothstep(roseFrom, turnFrom, m));
    };
    const lookAim = (time, u) => { const m = clamp(u, 0, 1) * LEN; path.posAtDist(m, eye); return aimAt(eye, m); };
    const lookFrom = metresWhere((x, y, z) => z >= L.RANK_OUT), lookTo = metresWhere((x, y, z, i) => i * 0.25 > lookFrom && z > L.PASS_Z && Math.hypot(x, y) < L.SIDE * Math.sqrt(3) / 6);
    scene.userData.look = { lookFrom, plateFit, snowFit, snowFitZ, snowReach, fit: FIT, platePass: platePass * 0.25, passD, roseFrom, turnFrom, lookTo };
    const pois = [look(lookAim, lookFrom, lookTo, LOOK_WEIGHT)];
    await ctx.yield();
    // pace by the line's own bend alone: 1 where it runs straight (so 1 on the whole last rank), less by 0.15 for the bend of a
    // turn of 44 m radius (the route's own turns are of 80, 50, 70 and 102 m: 0.92, 0.87, 0.91 and 0.94 there)
    const paceTab = new Float32Array(129), tA = new THREE.Vector3(), tB = new THREE.Vector3();
    for (let i = 0; i <= 128; i++) {
      const d = LEN * i / 128; let bend = 0;
      for (let q = -3; q <= 3; q++) { const m = clamp(d + q * 4, 6, LEN - 6); path.tangentAtDist(m - 6, tA); path.tangentAtDist(m + 6, tB); bend += tA.angleTo(tB) / 12; }
      paceTab[i] = 1 - 0.15 * clamp(bend / 7 * 44, 0, 1);
      if (i % 32 === 31) await ctx.yield();
    }
    // THE PACE BY PLACE (round r11): the far view is short and the crystals are long. Down the first rank the flight
    // goes at PACE_RANK of the common pace (to where the line leaves the rank: lookFrom), comes down to the common pace
    // over the PACE_OUT metres in which the look takes hold (the line's first turn begins there: a turn is not flown
    // fast), from there it slows evenly to PACE_CRYSTALS at THE HOLLOW'S MOUTH (the first place of the line the
    // hollow's law calls hollow: the way in's end), keeps that among the crystals to THE END OF THE SNOW CRYSTAL'S PASS
    // (where the line is in the crystal again beyond the pass) and comes back to the common pace over the next
    // PACE_RAMP metres. The film's length stays.
    const PACE_RANK = 1.7, PACE_OUT = 30, PACE_CRYSTALS = 0.78, PACE_RAMP = 60, mouth = wayN * 0.25;
    const passEnd = metresWhere((x, y, z, i) => i * 0.25 > platePass * 0.25 && z > L.PASS_Z - L.GAP && L.hollowDepth(x, y, z) > 0);
    const placePace = (m) => (m < lookFrom ? lerp(PACE_RANK, 1, smoothstep(lookFrom - PACE_OUT, lookFrom, m)) : m < mouth ? lerp(1, PACE_CRYSTALS, smoothstep(lookFrom, mouth, m)) : lerp(PACE_CRYSTALS, 1, smoothstep(passEnd, passEnd + PACE_RAMP, m)));
    scene.userData.pace = { rankOut: lookFrom, mouth, passEnd, ramp: PACE_RAMP, rank: PACE_RANK, crystals: PACE_CRYSTALS };
    const pace = (u) => { const f = clamp(u, 0, 1) * 128, i = Math.min(127, Math.floor(f)); return lerp(paceTab[i], paceTab[i + 1], f - i) * placePace(clamp(u, 0, 1) * LEN); };
    await ctx.yield();

    const hashN = (n, salt) => L.siteHash(n & 1023, (n >> 10) & 1023, 0, salt);
    // the fault of this stretch of a schedule's clock: one row, a kink that runs down it at 120 m a second from one of its ends
    const runFault = (u, list, every, t, salt, slot) => {
      if (!list.length) return;
      const n = Math.floor(t / every), r = list[Math.min(list.length - 1, Math.floor(hashN(n, salt) * list.length))], dir = hashN(n + 7919, salt) < 0.5 ? 1 : -1, X = shared.uFaultX.value;
      u.value.set(r.z, r.y, (dir > 0 ? r.x0 - 10 : r.x1 + 10) + dir * 120 * (t - n * every), dir);
      if (slot) { X.z = r.x0; X.w = r.x1; } else { X.x = r.x0; X.y = r.x1; }
    };

    return {
      scene, path, duration: 38, style: 'none',
      camera: { fov: FOV, near: 0.3, far: 1500, lookAhead: 20 },
      // the opening is the spark: exactly the join sheet's EXIT of 6
      portal: { shape: 'circle', radius: 5, style: 'ring', color: '#FFF1C8', veil: '#F0D9A0', glow: 1.0, halo: true, revealDistance: 60, blendDistance: 25 },
      post: { exposure: 1.25, bloom: { strength: 0.55, radius: 0.7, threshold: 0.85 }, grade: { saturation: 1.08, contrast: 1.0, vignette: 0.35, grain: 0.02 } },
      pois, pace,
      update(dt, time, camera) {
        shared.uTime.value = time;
        runFault(shared.uFault, faultsA, everyA, time + faultOff, faultSalt, 0);
        runFault(shared.uFaultB, faultsB, everyB, time + faultOffB, faultSalt + 31, 1);
        hero.update(dt, time, camera);
        plate.update(time); for (const b of lesser) b.update(time); for (const b of company) b.update(time);
      },
    };
  },
};
