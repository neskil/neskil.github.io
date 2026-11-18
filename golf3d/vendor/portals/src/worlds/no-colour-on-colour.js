// no-colour-on-colour: a country that is a coat of arms. Five dead-flat colours and two shining
// metals, colour never on colour, metal never on metal; a gold lion 160 m long goes its own built
// road along the dancetty ridge (terrace, bridge, wall, steps) and rears on the mount at its end; we come in high and stoop,
// run with the herd, rise over the river, go down the camp's street and through its gate, and climb to the ring; the snowfield is ermine, its tails painted flat on the ground in the fur's rows; whatever crosses
// a dividing line swaps its tinctures (counterchange, one law of world x and z).
//
// HANDEDNESS. The brief is written with +X on our right as we look along +Z; in three.js +X is on
// the left. The whole place is therefore built mirrored in x (world x = -brief x), so that the
// brief's lefts and rights are the picture's: hub and sun on the right, ridge and lion on the left.
//
// LAWS OF PLACE kept here: nothing is placed, timed or sized for any one place of the way, for a seed or for the
// lens. Every body's clear air is given by its place and MEASURED at the build FROM THE LENS'S PLACE AS FLOWN: the
// path as built, every 0.25 m of it (the engine sets the lens on the path's own point; its look, bank and sway are
// turns only: it rides no offset from the line), to the body's own outline as cut and at its motion's furthest
// reach, WHATEVER THE TURN, in the picture or not (see CLEAR below). Every kind stands 2.0 m and more from it, so
// no count by the picture's window is needed. The build only notes the least figure of each kind: nothing is
// moved, thinned or hidden by it.
//
// WHAT READS THE EYE (all of it, said once). In JavaScript NOTHING reads the camera's place: update() hands the
// camera to the kit's style.update alone, which takes from it the size of a pixel (uPx: the projection and the
// drawing buffer's height) and nothing else; the lion's drawn flank is chosen by the flown line's own point (the
// part). IN THE SHADERS these terms filter by a pixel's footprint or by the view, and no others:
//   the sky's dome is drawn in the view's own direction (viewMatrix), its edges one pixel soft (uPx);
//   the ground: strewn charges and fur spots dissolve into their field as a pixel's reach on the ground grows
//     (derivatives of world x and z); lines of partition, fillets and the ridge's foot hold their widths in pixels;
//   the road's masonry: its joints go where a course is under four pixels (derivatives); fillets one pixel soft;
//   striped slabs (tents, round pavilions, lances, the rail, the sail): the stripes merge by pairs, eight to four
//     to two to one tincture, by the pixels the thing's own width covers at its own place (uPx and the eye's distance);
//   the cloth: its partition's level and its keyline's width by the same measure and by derivatives; a face turned
//     from the eye takes the other normal (gl_FrontFacing);
//   the martlets: beyond the distance at which a pixel spans BIRD_PLAIN m a bird is one tincture, no fimbriation;
//   every keyline of the kit holds a pixel and a half by widening with the eye's distance;
//   the metals' highlight answers the one sun and the direction of the view (not the lion's: its own drawing);
//   the rare deal's falling gouttes (particles): the kit's near law by true distance to the eye (nothing inside
//     0.6 m, whole from 2.5 m), each card turned to the lens about its own upright.
// And one thing is TYPED, not read: the model of the picture's lower edge by which small tents are left out under
// the way (THE PICTURE'S FOOT: field of view, two picture shapes, the look-ahead and the bank, typed there).
//
// THE TYPED RULES OF PLACE (rounds 11, 12 and 13). Each is a place of the world, named in metres of our route (0 at the
// entry; metres of the way IN PLAN: the path as built is 729.4 m long over 719 m of plan, and THE MARTLETS' formation
// and THE PACE go by metres ALONG THE PATH, which run up to 10 m ahead of the plan's) or of the crest's own arc, or by
// a thing; each holds for its WHOLE stretch and is THE SAME ON EVERY SEED; none is laid, sized, turned or timed for
// any one place of the way. Lines A, B and C cross our way at route metres 173, 319 and 456: the first field 0 to
// 173, the second to the river on line B, the third to the gate on line C, the lists from there to the ring.
//   THE WAY'S HEIGHT (routeY; one law of route metres, every change the quintic ease): 40 m over the first field at
//     the entry, down in ONE STOOP to 9.4 m by route metre 125; low over line A and the second field; a gentle rise
//     from 85 m short of line B to 17.5 m on it (over the river) and down over the next 68 m to 7 m; 7 m down the
//     camp's street and through the gate; from 6 m past the gate a slow rise over 98 m to 16 m over the lists; the
//     last climb as it was (11 degrees to the ring at 40 m).
//   THE LION'S ROAD stands on the crest's plan line, flank-on to the way, one unbroken way of level tops, a post or
//     tower at every joint: THE TERRACE (crest arc 250 to 870; vert) beside the first field; THE BRIDGE (870 to 1077;
//     four round arches) beside the second; THE WALL (1077 to 1290; gules) beside the third; THE FAIR'S WALL (round
//     14, T5c: the three degrees, 1290 to 1608, and THE MOUNT, 1608 to 1811, ALL LEVEL WITH THE RED WALL'S WALK,
//     86.5 m: vert masoned argent, buttressed every 45 m, merlons on the far kerb: footing of the long wall's own
//     height and kind) beside the last stretch. THE ROLL OF ARMS (round 14, T1): eight great shields 32 m by 50 hang
//     on the face toward the way, their heads 7 m under the top, 103 to 155 m apart: four on the terrace (one past
//     the water gate), two on the bridge's piers (the wall's colour there), two on the red wall; each a metal field (argent
//     and or by turns) with a charge of the WALL'S OWN COLOUR, dealt from fifteen plain charges, no two neighbours
//     alike; between every second pair a pennon 34 m long streams from the top. THE ROLL RUNS ON ALONG THE FAIR'S
//     WALL (round 16): five more of the same make and size, in the middle of every other bay between its buttresses
//     (92 m apart), vert on argent and gold by turns, taking the five charges the first ten leave: all fifteen hang.
//   THE FIRST WALL IS MASONED (round 13b, S6; the terrace's whole length): its face carries the walls' own masonry
//     (joints in the metal), a BUTTRESS 9 m broad every 45 m (its head 7 m under the top) and MERLONS 8 m long and 5 m
//     high every 16 m on its far kerb: no plates. At the lion's stand the far kerb is set back 6.5 m in a BAY (32 m
//     toward the entry, 26 m on): the turned lion's hind paws stand in it.
//   THE LOW WAY (round 13b, S1b; ROAD.low, a law of the road by its own arc): from 8 m past the lion's stand the
//     lion's way goes DOWN behind the terrace's face, lowest (224 m under the walk) under the bridge's first arch,
//     30 m past the bridge's head, and UP again to 8 m short of the bridge's third pier: there the lion is under the wall and the ground,
//     drawn as ever, covered by place; the walk above is built and unbroken.
//   THE WALK (round 13, FOOTING; the whole road): the lion never stands on a line. Every top of its road is a walk with
//     two edges: the face's own top edge before the lion (it covers the paws' lowest 0.3 m) and, behind the lion's
//     plane, a FAR KERB 8 m high in the thing's own tincture with a fine argent line along its top: the paws stand IN
//     the band between the two. On the red wall the battlements stand on the far kerb, behind the paws. The mount by
//     the ring stands on a BASE of two plain courses (11 m and 5.5 m high) that run on past its round end to the ground.
//   THE LION HAS ITS OWN WAY ALONG ITS ROAD (round 13; LION_WAY, one typed timetable of our own route metres, the same
//     on every seed; it never keeps our pace: it is always STANDING AT A PLACE while we come to it, or RUNNING AHEAD OF
//     US to the next, courant, in whole bounds). Its four places are built things of its road: the terrace 40 m past
//     the water gate; the bridge's third pier (over the valley and the ship); the red wall's end, 59 m short of the
//     steps (seen from the street it stands clear of the gate's tower); the mount by the ring.
//       0 to 28 m: it stands on the terrace in its kerb's bay, HALF REARED AND TURNED 22 degrees out of its road's
//       line TOWARD THE ENTRY (four fifths of its breadth shows), roaring at us. 28 to 56: it wheels (rears, turns on
//       its hind paws, launches). 56 to 76: ONE RUN takes it DOWN THE LOW WAY, out of sight behind its own wall. 76
//       to 150: it waits there, drawn as ever: THE FIRST FIELD IS THE HERD'S ALONE. 150 to 168: its road comes up and
//       IT BOUNDS INTO SIGHT on to the bridge above the ship. 168 to 191: it wheels to face us. 191 to 271: IT WAITS
//       AT THE RIVER COUCHANT (round 14, T5b): lying along the walk, its head up and toward the way, the end of its
//       tail and its tuft moving by the world's clock. 271 to 289: it rises as we come to the river. 289 to 319 (from 30 m short of
//       line B to line B): IT ROARS over the ship. 319 to 331: it wheels as we cross
//       the river. (WHAT SETS THE ROAR: line B, the river's middle, and one length typed from it: the roar begins
//       30 m short of line B, which is 5 m before the river's edge (its water lies 25 m to either hand of line B),
//       and ends on line B. The rise before it is 18 m and the wheel after it 12 m: lengths chosen freely.) 331 to 366: IT RUNS AHEAD down the red wall. 366 to 377: it wheels at the wall's end to face the
//       street. 377 to 391: IT ROARS ONCE over the street, whole, clear of the gate's tower. 391 to 400: it wheels
//       and gathers. 400 to 416: IT GOES DOWN THE SECOND LOW WAY behind the red wall (S8: from 8 m past its stand its
//       way goes down 110 m under the walk, lowest 16 m short of the steps, and comes up to the walk 40 m on: a law
//       of the road); the wall's crest takes it as it goes. From there to 528 it waits there, drawn lower yet (its
//       head 2 m and more under the walls' tops, till the last 16 m of our way before its launch bring it back to
//       its way's level): from the gate's approach to its run past there is NO LION in the picture. 528 to 591: its
//       way comes up behind us and
//       IT COMES PAST US AT A RUN along the fair's wall (the three degrees, level with the red wall's walk). 591 to the
//       end: it gathers on its mount, springs SALIENT (by 606, held to 620) and stands RAMPANT (by 638), facing the ring.
//     Its head is as each attitude draws it (no head turned back: it faces us with its whole body, or runs ahead).
//   THE FIRST HERD RUNS IN FILE (ridge's hand): seven stags 28 m apart along ONE TRACK (nose to tail 2.5 m and
//     more of clear air at the extended gallop, round the turn too): straight out, square to the way, 61 m
//     short of line B (36 m before the river's edge), from 18 m to 136 m from the flown line, then back along the
//     first wall's foot, 19 to 25 m before its face (the further for the first 75 m from the turn, past the second
//     three trees; its last 32 m, beyond the trees, close to 14 m): its line 11.7 m and more from the feet of the
//     trees that stand there. Its place is a law of our route metre: to 50 m it stands drawn out along its first leg;
//     from 50 it runs, 1.4 m of its track for every metre of ours, across the whole ground ahead of us and round
//     the turn; at 140 m it halts strung out along the wall's foot before the trees and lodges. It crosses line A
//     at the wall's foot, each stag swapping as it crosses, on a line drawn broad under it. No stag comes within
//     2 m of a tree, nor within 1 m of another stag's outline, at any time (a law of the places typed at the herd).
//   THE SHIP lies on the river's middle line (line B), 150 m to the ridge's hand of the way, its side to the way,
//     under the bridge and the lion's stand on it. It is seen from the side, from a little above: no deck is drawn,
//     its oars are drawn in profile. It stands IN ITS RIVER (round 13b): a band of the river's own waves (barry wavy
//     azure and argent) is drawn across the foot of its hull, so that from the first field it is seen afloat.
//   THE CAMP'S STREET: from 25 m past the river's far bank (route metre 373) to the gate, great pavilions in two rows,
//     their middles 17 m to either hand of the flown line, 20 m apart on the ridge's hand and 16.5 m on the hub's,
//     set half a step on hand to hand; a low tent and a shield on a stand in every gap.
//   THE GATE stands on line C ASTRIDE THE WAY, square to it, the flown line through the middle of its open arch
//     (ROUND 14, T3: 30 m wide and 25 m to the crown at its face, splayed to 25 m wide at the back, 5 m deep; the
//     inner faces 12.5 to 15 m from the flown line, the crown 15.5 m and more over it); the arch's ring of stones
//     gules and argent by turns round its face and under its soffit; a raised portcullis in its back plane, its
//     seven points 18.6 m over the ground; one shield of the roll's kind on each inner face. A tower 10.5 m broad to
//     either hand (their outer edges, heights and roofs as before) and a low wing along the line from each.
//   THE CAMP behind the street: the old camp's blocks, 96 m and more from the way on either hand; on the ridge's hand
//     from 27 m past the gate to route metre 620 only its rearmost row, 124 m off, and from there to 150 m beyond
//     the ring none.
//   THE PAVILIONS OF THE STREET'S RIDGE HAND (route metres 377, 397, 417 and 437: the lion runs down the red wall and
//     roars from its end over the street) stand 10 m to the finial: under the lion's paws as seen from
//     the way. (Those of the hub's hand 14 m.)
//   THE FAIR'S NEAR LANE (round 14, T4; from the gate to the ring): within 8 m to either hand of the flown line only
//     the ground. 13.2 m to either hand ONE ROW OF LANCES 8 m tall, one every 13 m from 13 m past the arch to 45 m
//     past the foot of the last climb, upright and square to the way, each with a forked pennon 4 m long. THE TILT'S
//     RAIL on the ridge's hand, 16 m out, from 20 m past the gate to 45 m past the foot of the last climb, two shields
//     HUNG FLAT on it in every bay, their faces to the way's line. The tilt's great banners and its head on the hub's
//     hand are taken down (they stood end-on to the way: slabs at the picture's foot). The lists' two great standards
//     38 m beyond the arch, 15 m to the hub's hand and 24 m to the ridge's; four great standards 84 m out on the
//     hub's hand. NO BUILT THING within 25 m is turned toward the way, and no stag within 21 m: the
//     nearest stag is the ridge seven's innermost, which lies, stands and runs 30 m out on the ridge's hand, turned
//     65 then 50 degrees with its nose to the way, its outline 21 m from the way in plan (25 m from the flown line);
//     on the hub's hand the nearest three run 36 m out, turned the same, their outlines 27 m from it (see THE
//     SECOND HERD).
//   THE LISTS' FLOOR (round 13b, S4): its strewn charges are one size, 1.4 times the old, in strict rows from the
//     arch to the ring. THE SECOND HERD'S NEAREST LANE: three stags run 36, 52 and 68 m to the hub's hand of the
//     flown line, outside the lane's row of lances and their pennons, from 40 m short of the gate, holding berths
//     125, 137 and 149 m ahead of us till they are drawn up 60 m and more beyond the ring's plane. (WHAT SETS
//     THEIR HALT: the ring's plane and their own berths; they hold one pace with us the whole way: no metre of the
//     way is typed at which they draw ahead.)
//   THE FUR FIELD (round 13b, S5; round 16): the fur's spots are painted FLAT on the ground, one size, in strict
//     offset rows, under the way as beside it, from the entry to the river; no tail stands or falls in the air.
//     A SPOT IS AS LONG AS THE STAG THAT LODGES ON THE FUR IS LONG (the lodged stag's own mesh, nose to tail), and
//     its rows stand as far apart for its length as the lists' rows do for their charge. It is drawn as heraldry
//     draws it: three dots over a tail that flares to three points.
//   THE CLOUDS' EDGES are hard, as everything's (one pixel's ramp).
//   THE GATE'S ARCH AND WHAT WE COME OUT TO (round 13, S2): no cloth or staff stands on the ground within 15 m before
//     the arch: the gate's two standards are gone up as pennons on the points of its towers' roofs. THE LISTS' GREAT
//     STANDARD stands 38 m beyond the arch, 15 m to the HUB's hand of the flown line: a staff 25 m tall, its banner
//     11 m by 6 flown under its head and streaming away from the way.
//   THE PALE OF THE WAY (the fillet drawn under our line) ends at the gate: none in the lists, but the bar drawn
//     across the second herd's crossing. THE LINE UNDER THE HERD (round 14, T2c): where a herd's track crosses a
//     dividing line the line is drawn broad across it, 4 m in all (line A at the first wall's foot; the pale beyond
//     the ring's plane).
//   THE MARTLETS: a bird's flat faces the flown line at the head of our flight (never edge-on to the way). THE LION'S HEAD: the skein's chevron is laid with its
//     middle line to the hub's hand of the head, by the angle 120 m at the lion subtends from us, 2.5 degrees more and its own half breadth (see THE FORMATION);
//     that is a law of the chevron's middle line, and no single bird's line from us is measured against it. The skein's ridge five cross to the hub's hand UNDER
//     THE LION (ROUND 15, THE CROSSING: ways laid in the world; near us on the ridge's hand of the lion, the near places at two heights, a bird's height and
//     the clear air apart, every second bird at the upper; then by two places under the lion, below its one end and below its other, each on the line from our
//     eye to the middle of the terrace's face there; at the metre the lion springs in echelon, a span and 1 m of clear air abreast and a length deeper from
//     bird to bird; from there they close into the formation), nearer the head than the chevron's law would hold them.
//   THE GATE'S MARTLETS (round 13, S9; ROUND 14, T3c: FARTHER AND LOWER IN THE PICTURE): TWENTY-EIGHT WHEEL IN THE
//     ARCH'S SKY about the place 110 m beyond line C on the gate's own axis: twenty in a level round 14 m in radius,
//     33 m over the lists' ground (17 m over the way where it passes under them), eight in an inner round 7 m in
//     radius 3.5 m higher, one lap in 7 seconds of the world's clock: whole in the opening from the way's last 60 m before the arch.
//   THE THREE TREES stand at the mount's foot, beyond the ring's plane. THE TREES AT THE FIRST WALL'S FOOT (round 14,
//     T2b): two threes of fruited trees before the terrace's face, the first in the first field and the second
//     beyond line A, each three midway between two shields of the roll, its trees 34 m apart and 36 to 40 m tall,
//     7 m before the face.
//   (As before: the second herd's other lanes in the lists, the ring and its lances, the keep.)
// THE GAZE (round 13): ONE LOOK, a pure law of our route metre, the same on every seed (see THE GAZE below). While
//   the lion is in the picture it is WHOLE in it, standing, wheeling and running, but for the half second in which it
//   comes past us at its run. Entry to a third of the street: 16 degrees to the ridge's hand of our heading, further
//   only as the lion's far end asks, and, while the lion is in its low way, as THE FIRST HERD asks (every stag
//   taller than a sixth of the picture whole in it). ROUND 15, THE LOOK RESTS ON THE WALL: from the entry to 60 m short of line B (the river's) the gaze's
//   tilt aims at the middle of the terrace's face, half its merlons' height at the face's nearest distance from us, and gives that up over the next 40 m of
//   route for the 4 degrees it held before; the lion's top, where it asks more, rules as before. THE GATE'S APPROACH (S8): from 44 to 32 m short of the arch
//   (412 to 424: the lion has gone down behind its wall) ONE TURN to THE ARCH'S OWN MIDDLE, and the gaze rests THROUGH
//   THE ARCH on the lists: the opening in the middle of the picture, a jamb and a tower to either hand, the great
//   standard in the opening; the two jambs leave by both sides together some 18 m short of the arch. Over the last 12 m,
//   ONE TURN to the lists with the sun whole ahead (through the arch and for the lists' first 80 m the lion is in its
//   low way behind us). From 80 to 102 m past the arch, ONE TURN to the ridge's hand to MEET THE LION as it comes
//   past at its run; the gaze goes with it to its mount by the ring and rests there between the lion and the sun.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, bell, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, nccCrest, NCC_PALETTE } from '../parts/no-colour-on-colour.js';

const RAD = Math.PI / 180;
const HUB = [-300, 110];                       // the hub H (mirrored)
const R_ROUTE = 300, R_RIDGE = 520;
const EXIT_HEADING = 74;                       // degrees from +Z toward the hub's side: the heading of the last straight (the exit axis)
const THROUGH = [[-7, 172], [-70, 303], [-178, 384]];   // lines A, B, C pass through H and these
// THE RIDGE IN PLAN (a rule of the place, the same on every seed). The crest's distance from the hub is given by the
// hub's bearing alone (ridgeR): ONE STEADY SPIRAL OUTWARD, from 520 m behind the entry to 753 m at the summit tooth
// (bearing 122.7 degrees), slow at first and never steep: R = 520 exp(K s(t^Q)), t the share of the bearing from RIDGE_P0
// to the summit, s the smooth step. Why a spiral and no bay: seen from the way, which goes round the hub inside the
// ridge, a crest that runs outward is a crest that runs AWAY, and the lion on it shows its rump (the plan before this
// one took the crest 85 m in to the river and 335 m out again to the summit: from the river to line C the lion stood
// 24 to 43 degrees from end-on). On this line the crest is nowhere turned more than 20 degrees out of the hub's circle,
// and the line from our place to the lion meets the lion's own plane at 30 to 35 degrees as far as line A (round 11:
// the lion goes 400 to 450 m before us there, so that it is not drawn over 0.45 of the picture's height; it is seen
// three-quarter on) and at 35 to 70 degrees from line A to the ring (measured every 5 m of route). The summit tooth's tip stands some 310 m beyond
// the ring's plane and well to the ridge's hand of the exit axis; beyond it the last slope runs straight on down.
// The plan line is laid once, a point every metre of its length (RIDGE_T); SUMMIT_D is the arc distance of the summit tip.
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const RIDGE_P0 = 0, RIDGE_END = 122.7 * RAD, RIDGE_K = 0.37, RIDGE_Q = 1.3;
// THE NEAR REACH (a rule of the place, the same on every seed): beside the first field the crest comes IN toward the way
// and crosses ahead of it: from the hub's bearing DIP[0] it leaves the spiral, is RIDGE_DIP m nearer the hub by DIP[1],
// holds that to DIP[2] and is back on the spiral's own line by DIP[3] (eased both ways). So where we come in the crest
// runs in across the view ahead and the lion on it is near, great and flank-on; and the ridge from the lists to the
// summit stands where it stood.
const RIDGE_DIP = 62, DIP = [-8 * RAD, 30 * RAD, 34 * RAD, 78 * RAD];
const ridgeR = (phi) => R_RIDGE * Math.exp(RIDGE_K * sstep(0, 1, Math.pow(Math.min(1, Math.max(0, (phi - RIDGE_P0) / (RIDGE_END - RIDGE_P0))), RIDGE_Q))) - RIDGE_DIP * sstep(DIP[0], DIP[1], phi) * (1 - sstep(DIP[2], DIP[3], phi));
const RIDGE_T = [];
{
  let phi = -40 * RAD;
  const end = RIDGE_END, put = (p) => { const r = ridgeR(p); RIDGE_T.push(HUB[0] + r * Math.cos(p), HUB[1] + r * Math.sin(p)); };
  // a metre along the line at a time (the step in bearing from the line's own slope at the step's middle)
  const dphi = (p) => { const r = ridgeR(p), dr = (ridgeR(p + 1e-4) - ridgeR(p - 1e-4)) / 2e-4; return 1 / Math.hypot(r, dr); };
  while (phi < end) { put(phi); phi += dphi(phi + 0.5 * dphi(phi)); }
}
const SUMMIT_D = RIDGE_T.length / 2;           // arc distance of the summit tooth's tip along the crest (metres, whole)
{
  // the summit tip itself, and the straight run beyond it along the line's last heading
  const n = RIDGE_T.length, x1 = RIDGE_T[n - 2], z1 = RIDGE_T[n - 1], x0 = RIDGE_T[n - 4], z0 = RIDGE_T[n - 3], l = Math.hypot(x1 - x0, z1 - z0);
  for (let i = 1; i <= 400; i++) RIDGE_T.push(x1 + (x1 - x0) / l * i, z1 + (z1 - z0) / l * i);
}
const RIDGE_N = RIDGE_T.length / 2 - 1;
// the camp's front: its distance from the way at route metre h, on either hand (line C is crossed at route metre 455.6)
const campFront = (h) => 96;
const rng_fork = (rng, label) => (rng.fork ? rng.fork(label) : rng);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// The route in plan by horizontal distance h: 110 m along +Z, an arc of radius 300 about H through
// 74 degrees, then straight on (heading 74 degrees) to the ring, 719 m in all: the last straight is laid
// so that the summit stands 20 to 33 degrees to its left, never nearer than 220 m.
// Returns [x, z, tangent x, tangent z].
const H_ARC0 = 110, H_ARC1 = 110 + EXIT_HEADING * RAD * R_ROUTE, H_END = 719;
function routeXZ(h, out = [0, 0, 0, 1]) {
  if (h <= H_ARC0) { out[0] = 0; out[1] = h; out[2] = 0; out[3] = 1; return out; }
  const a = Math.min(h, H_ARC1) - H_ARC0, phi = a / R_ROUTE, c = Math.cos(phi), s = Math.sin(phi);
  out[0] = HUB[0] + R_ROUTE * c; out[1] = HUB[1] + R_ROUTE * s; out[2] = -s; out[3] = c;
  if (h > H_ARC1) { const r = h - H_ARC1; out[0] += out[2] * r; out[1] += out[3] * r; }
  return out;
}
// THE WAY'S HEIGHT (round 12; ONE TYPED LAW OF ROUTE METRES, the same on every seed; every change is the quintic ease:
// no kink, no step). WE COME IN HIGH AND STOOP: Y_IN m over the first field at the entry, down in one long stoop to the
// low level (Y_LOW, 9.4 m) by route metre STOOP1 (two thirds of the first field; the ease is taken of the stoop's share
// to the power STOOP_P, so it begins level and tips over gently); low among the herd over line A and
// the second field; OVER THE RIVER a gentle rise, from RIVER_UP m short of line B to Y_RIVER m on the line (the ship is
// passed from mast height), and down over the next RIVER_DOWN m into THE CAMP'S STREET, which we go down at Y_STREET m
// (half its pavilions' height) and through the gate on line C; from LISTS_UP[0] m past the gate a slow rise to Y_LISTS
// m over the lists; then the last climb to the ring as it was: 11 degrees to the ring at 40 m, eased into over 60 m.
const ease5 = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * t * (t * (6 * t - 15) + 10); };
const RAMP = Math.tan(11 * RAD), H_CLIMB = H_END - 127.6, Y_CLIMB = 40 - 127.6 * RAMP, Y_LOW = Y_CLIMB - 30 * RAMP;
const Y_IN = 40, STOOP1 = 125, STOOP_P = 1.5, Y_RIVER = 17.5, RIVER_UP = 85, RIVER_DOWN = 68, Y_STREET = 7, Y_LISTS = 16, LISTS_UP = [6, 104];
const H_LIFT = H_CLIMB + (Y_LISTS - Y_CLIMB) / RAMP;      // (where the climb's own line stands at the lists' level: the ease into it runs 30 m to either side)
function routeY(h) {
  if (h < STOOP1) return Y_LOW + (Y_IN - Y_LOW) * (1 - ease5(0, 1, Math.pow(Math.max(0, h) / STOOP1, STOOP_P)));
  if (h < H_B) return Y_LOW + (Y_RIVER - Y_LOW) * ease5(H_B - RIVER_UP, H_B, h);
  if (h < H_C + LISTS_UP[0]) return Y_RIVER - (Y_RIVER - Y_STREET) * ease5(H_B, H_B + RIVER_DOWN, h);
  if (h < H_LIFT - 30) return Y_STREET + (Y_LISTS - Y_STREET) * ease5(H_C + LISTS_UP[0], H_C + LISTS_UP[1], h);
  if (h < H_LIFT + 30) { const r = h - (H_LIFT - 30); return Y_LISTS + RAMP * r * r / 120; }
  return Y_CLIMB + (h - H_CLIMB) * RAMP;
}
// Line B (the river's middle) and line C (the middle line of the lists) cross the route at these horizontal distances.
const H_B = H_ARC0 + R_ROUTE * Math.atan2(THROUGH[1][1] - HUB[1], THROUGH[1][0] - HUB[0]);
const H_C = H_ARC0 + R_ROUTE * Math.atan2(THROUGH[2][1] - HUB[1], THROUGH[2][0] - HUB[0]);
// The crest of the ridge in plan by arc distance d (0 behind the entry, SUMMIT_D at the summit tip).
function crestXZ(d, out = [0, 0]) {
  const e = Math.min(Math.max(d, 0), RIDGE_N - 1e-6), i = Math.floor(e), f = e - i;
  out[0] = RIDGE_T[i * 2] + (RIDGE_T[i * 2 + 2] - RIDGE_T[i * 2]) * f; out[1] = RIDGE_T[i * 2 + 1] + (RIDGE_T[i * 2 + 3] - RIDGE_T[i * 2 + 1]) * f;
  return out;
}
// The place abeam on the crest: the arc distance of the crest's point on the hub's own ray through a place (the crest at
// the place's bearing from the hub); a pure function of the place, and one that only grows as our way goes round the hub.
function crestAbeamOf(x, z) {
  const bx = x - HUB[0], bz = z - HUB[1];
  // the plan line's point whose bearing is the place's: the first crossing of the ray, found on the line as laid (a point a metre)
  let lo = 0, hi = RIDGE_N;
  const side = (i) => (RIDGE_T[i * 2] - HUB[0]) * bz - (RIDGE_T[i * 2 + 1] - HUB[1]) * bx;   // > 0 while the line's point is short of the ray
  if (side(0) <= 0) return 0;
  for (let k = 0; k < 24; k++) { const m = (lo + hi) >> 1; if (side(m) > 0) lo = m; else hi = m; if (hi - lo <= 1) break; }
  const a = side(lo), b = side(hi);
  return lo + (a > b ? a / (a - b) : 0);
}

// The ten lawful pairs: one colour, one metal.
const COLOURS = ['gules', 'azure', 'vert', 'sable', 'purpure'], METALS = ['or', 'argent'];
// The sun in splendour's place: its angle to the right of the exit axis, and its height. Dawn, night and golden are the
// brief's own (60 and 12; 32 and 18). The DAY sun stands, as the golden hour's does, 32 degrees right of the exit axis
// and 22 degrees up (the crew lead's ruling: inside the brief's rule that the sun is never within 30 degrees of that
// axis), so that from the last straight it is seen whole to the right of the ring as the reared lion stands to its left.
const HOURS = {
  day: [32, 22], dawn: [60, 12], golden: [32, 18], night: [60, 12],
};

// (a jointed figure's vertices as a joint table carries them: VP their places as cut [x, y, ...], VJ four times each
// one's joint's number, T the table [cos, sin, x, y, ...]: out = [the highest, the hindmost, the foremost])
function jointSpan(VP, VJ, T, out) {
  let top = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (let i = 0; i < VJ.length; i++) {
    const x = VP[2 * i], y = VP[2 * i + 1], j = VJ[i], fx = T[j] * x - T[j + 1] * y + T[j + 2], fy = T[j + 1] * x + T[j] * y + T[j + 3];
    if (fy > top) top = fy; if (fx < x0) x0 = fx; if (fx > x1) x1 = fx;
  }
  out[0] = top; out[1] = x0; out[2] = x1; return out;
}

// THE DEAL: everything a seed may choose, drawn once and in a fixed order from ctx.rng.
function deal(ctx) {
  const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
  const f = rng();
  const fur = f < 0.6 ? 'ermine' : f < 0.8 ? 'ermines' : 'erminois';     // ermines: the reverse first
  // the plain's colour is gules or purpure, never vert: the ridge vert stands on it (no colour on colour)
  const plainMetal = rng.pick(METALS), plainColour = rng.pick(['gules', 'purpure']);
  const pairs = [];
  for (const c of COLOURS) for (const m of METALS) pairs.push([c, m]);
  rng.shuffle(pairs);
  // gules is never dealt to cloth or pennon, with either metal (gold and red pales, or red and white bands or
  // stripes, read as known flags), nor azure (the sky is azure on every seed: colour on colour)
  const lawful = pairs.filter((p) => p[0] !== 'gules' && p[0] !== 'azure');
  const rowPairs = lawful.slice(0, 3);
  // a row that stands on the ridge's side of the route is seen against the ridge vert: its cloth never takes vert
  const ridgePairs = lawful.filter((p) => p[0] !== 'vert').slice(0, 3);
  const hourPick = rng.pick(['day', 'day', 'day', 'golden', 'dawn']);
  const hour = HOURS[vary.hour] ? vary.hour : hourPick;
  const wind = rng.range(0.55, 1.25);                                      // lazy to stiff
  const density = (vary.density || 1);
  const leanPick = rng();
  return {
    fur, plainMetal, plainColour, rowPairs, ridgePairs, hour, wind, density, detail, rare: !!vary.rare,
    count: (n) => Math.max(1, Math.round(n * density * detail)), leanPick,
  };
}

export default {
  id: 'no-colour-on-colour',
  name: 'No Colour upon Colour',
  category: 'bizarre',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const D = deal(ctx);
    const az = EXIT_HEADING + HOURS[D.hour][0], el = HOURS[D.hour][1];
    const sun = new THREE.Vector3(-Math.sin(az * RAD) * Math.cos(el * RAD), Math.sin(el * RAD), Math.cos(az * RAD) * Math.cos(el * RAD));
    // The counterchange: three lines through the hub, the same on every seed. The deal only says
    // which class of ground the entry's parity carries (metal, or colour when the reverse fur leads).
    const entryMetal = D.fur !== 'ermines';
    const style = makeStyle(ctx, {
      palette: NCC_PALETTE, sun: [sun.x, sun.y, sun.z],
      // (way: the line of the way itself is the fourth dividing line, a pale: the first straight, the arc about the hub and
      // the straight after it, as the route is laid in plan; on its hub's hand every ground is the counterchange)
      counterchange: { hub: HUB, through: THROUGH, entry: entryMetal ? [0, 0] : [-60, 240], way: { end: [Math.cos(EXIT_HEADING * RAD), Math.sin(EXIT_HEADING * RAD)], radius: R_ROUTE } },
    });
    scene.background = style.tinctures.azure.clone();
    const disposables = [], updaters = [];
    await ctx.yield();

    // ---- THE FLOWN LINE
    const pts = [];
    const _r = [0, 0, 0, 1];
    for (let i = 0, n = 72; i <= n; i++) { const h = H_END * i / n; routeXZ(h, _r); pts.push([_r[0], routeY(h), _r[1]]); }
    const path = makePath(pts, { samples: 720 });
    await ctx.yield();
    // CLEAR: the path as built, a point every 0.25 m of it, and the measures of clear air: the distance in metres from
    // a point to the flown line, the lens's own place (every kind of body 2.0 m and more, seen or not). THE SEARCH IS WHOLE:
    // the line's points are held in runs of RUN (8 m of the line), each with its middle and its reach from it; the
    // run whose middle is nearest is gone over point by point, then every other run whose middle less its reach
    // could still hold a nearer point. No stride that can miss. (ky 0: the distance in plan.)
    const NS = Math.ceil(path.length / 0.25), PS = new Float32Array((NS + 1) * 3), _p = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.posAtDist(path.length * i / NS, _p); PS[i * 3] = _p.x; PS[i * 3 + 1] = _p.y; PS[i * 3 + 2] = _p.z; if (i % 400 === 399) await ctx.yield(); }
    const RUN = 32, NB = Math.ceil((NS + 1) / RUN), PB = new Float32Array(NB * 5);   // (a run: its middle x, y, z; its reach in space; its reach in plan)
    for (let b = 0; b < NB; b++) {
      const i0 = b * RUN, i1 = Math.min(NS, i0 + RUN - 1), m = (i0 + i1) >> 1; let r = 0, rp = 0;
      for (let i = i0; i <= i1; i++) { const dx = PS[i * 3] - PS[m * 3], dy = PS[i * 3 + 1] - PS[m * 3 + 1], dz = PS[i * 3 + 2] - PS[m * 3 + 2]; r = Math.max(r, Math.hypot(dx, dy, dz)); rp = Math.max(rp, Math.hypot(dx, dz)); }
      PB.set([PS[m * 3], PS[m * 3 + 1], PS[m * 3 + 2], r, rp], b * 5);
    }
    // (the least squared distance from a point to the points of run b, or `best` if none is nearer)
    const scanRun = (b, x, y, z, ky, best) => {
      for (let i = b * RUN, e = Math.min(NS, i + RUN - 1); i <= e; i++) { const dx = PS[i * 3] - x, dy = (PS[i * 3 + 1] - y) * ky, dz = PS[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
      return best;
    };
    const nearOf = (x, y, z, ky) => {
      let b0 = 0, m0 = Infinity;
      for (let b = 0; b < NB; b++) { const dx = PB[b * 5] - x, dy = (PB[b * 5 + 1] - y) * ky, dz = PB[b * 5 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < m0) { m0 = d; b0 = b; } }
      let best = scanRun(b0, x, y, z, ky, Infinity);
      for (let b = 0; b < NB; b++) {
        if (b === b0) continue;
        const dx = PB[b * 5] - x, dy = (PB[b * 5 + 1] - y) * ky, dz = PB[b * 5 + 2] - z, lb = Math.sqrt(dx * dx + dy * dy + dz * dz) - PB[b * 5 + (ky ? 3 : 4)];
        if (lb <= 0 || lb * lb < best) best = scanRun(b, x, y, z, ky, best);
      }
      return Math.sqrt(best);
    };
    const clearOf = (x, y, z) => nearOf(x, y, z, 1), planOf = (x, z) => nearOf(x, 0, z, 0);
    // ROUTE METRES ARE METRES OF THE WAY IN PLAN (round 12: the way moves in height, so the path's own length runs ahead of
    // its plan). hOfU(u): the route metre at progress u along the path as built; uOfM(h): the progress at route metre h.
    const HN = 1440, H_OF = new Float32Array(HN + 1);
    { let px = 0, pz = 0, acc = 0; for (let i = 0; i <= HN; i++) { path.pointAt(i / HN, _p); if (i) acc += Math.hypot(_p.x - px, _p.z - pz); H_OF[i] = acc; px = _p.x; pz = _p.z; } }
    const hOfU = (u) => { const x = clamp01(u) * HN, i = Math.min(HN - 1, Math.floor(x)); return H_OF[i] + (H_OF[i + 1] - H_OF[i]) * (x - i); };
    const uOfM = (h) => { let lo = 0, hi = HN; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (H_OF[m] <= h) lo = m; else hi = m; } return clamp01((lo + (h - H_OF[lo]) / Math.max(1e-6, H_OF[hi] - H_OF[lo])) / HN); };
    const CLEAR = {};   // the least clear air measured per kind of body, as built, metres (noted only: nothing is placed, moved or hidden by it)
    const noteClear = (kind, d) => { if (!(CLEAR[kind] <= d)) CLEAR[kind] = d; };
    // THE MEASURE OF A BODY ON ITS REAL OUTLINE. A slab is measured by its own points: cloudOf(outlines, step) lays
    // them out in the slab's own plane, along every outline half of `step` m apart at the most and over its inside on
    // a square lattice of `step` m (inside by the crossings of a ray), with their middle and their reach from it. No
    // point of the slab is further than 0.96 of `step` from one of them. A large cloud carries a coarse one of
    // three times the step (co), for the first look.
    const cloudOf = (ols, step = 1, coarse = false) => {
      const pts = []; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const ol of ols) {
        const n = ol.length; let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
        for (let i = 0; i < n; i++) {
          const a = ol[i], b = ol[(i + 1) % n], k = Math.max(1, Math.ceil(2 * Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
          for (let j = 0; j < k; j++) pts.push(a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k);
          ax = Math.min(ax, a[0]); bx = Math.max(bx, a[0]); ay = Math.min(ay, a[1]); by = Math.max(by, a[1]);
        }
        for (let y = ay + step / 2; y < by; y += step) for (let x = ax + step / 2; x < bx; x += step) {
          let ins = false;
          for (let i = 0, j = n - 1; i < n; j = i++) { const a = ol[i], b = ol[j]; if ((a[1] > y) !== (b[1] > y) && x < a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])) ins = !ins; }
          if (ins) pts.push(x, y);
        }
        x0 = Math.min(x0, ax); x1 = Math.max(x1, bx); y0 = Math.min(y0, ay); y1 = Math.max(y1, by);
      }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let r = 0;
      for (let i = 0; i < pts.length; i += 2) r = Math.max(r, Math.hypot(pts[i] - cx, pts[i + 1] - cy));
      return { pts, cx, cy, r, h: 0.96 * step, co: !coarse && pts.length > 240 ? cloudOf(ols, 3 * step, true) : null };
    };
    // measure(kind, e, cl, pad, z): the least distance from the flown line to the slab of that cloud set by the matrix
    // whose elements are e (x and y the slab's own plane, z out of it), less `pad` (half its thickness and its
    // keyline's breadth). Three short cuts, all exact: a slab whose middle cannot be nearer the line than the kind's
    // least so far plus the slab's reach (by the runs' middles and reaches) is not gone over; one that is, is gone
    // over against those runs of the line alone that can hold the nearest point to any point of it, and for each
    // point only those of them whose middle, less the run's reach, is nearer than the least found so far; and a
    // large one is first gone over by its coarse cloud, and left if that, less the coarse cloud's own reach, is no
    // nearer than the kind's least so far. It gives back the room a slab left by the first short cut has: how many
    // metres nearer every point of it would have to come before it could lower the kind's least (nought if gone over).
    const _runs = new Int32Array(NB), _lb = new Float32Array(NB);
    const measure = (kind, e, cl, pad, z = 0) => {
      const bx = e[8] * z + e[12], by = e[9] * z + e[13], bz = e[10] * z + e[14], sc = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6])), R = cl.r * sc;
      const cx = e[0] * cl.cx + e[4] * cl.cy + bx, cy = e[1] * cl.cx + e[5] * cl.cy + by, cz = e[2] * cl.cx + e[6] * cl.cy + bz;
      // (lo: the middle is no nearer the line than this; hi: no further than this)
      let lo = Infinity, hi = Infinity, nb = 0;
      for (let b = 0; b < NB; b++) { const d = Math.hypot(PB[b * 5] - cx, PB[b * 5 + 1] - cy, PB[b * 5 + 2] - cz); _lb[b] = d - PB[b * 5 + 3]; if (_lb[b] < lo) lo = _lb[b]; if (d < hi) hi = d; }
      if (CLEAR[kind] <= lo - R - pad) return lo - R - pad - CLEAR[kind];
      for (let b = 0; b < NB; b++) if (_lb[b] <= hi + 2 * R) _runs[nb++] = b;
      const over = (P) => {
        let m = Infinity, sm = Infinity;
        for (let i = 0; i < P.length; i += 2) {
          const x = e[0] * P[i] + e[4] * P[i + 1] + bx, y = e[1] * P[i] + e[5] * P[i + 1] + by, zz = e[2] * P[i] + e[6] * P[i + 1] + bz;
          for (let k = 0; k < nb; k++) {
            const b = _runs[k] * 5, dx = PB[b] - x, dy = PB[b + 1] - y, dz = PB[b + 2] - zz, t = sm + PB[b + 3];
            if (dx * dx + dy * dy + dz * dz < t * t) { const m2 = scanRun(_runs[k], x, y, zz, 1, m); if (m2 < m) { m = m2; sm = Math.sqrt(m); } }
          }
        }
        return sm;
      };
      if (cl.co && CLEAR[kind] <= over(cl.co.pts) - cl.co.h * sc - pad) return 0;
      noteClear(kind, over(cl.pts) - pad); return 0;
    };
    // (lowAt: a point is no nearer the line than this, by the runs' middles and reaches alone)
    const lowAt = (x, y, z) => { let lo = Infinity; for (let b = 0; b < NB; b++) { const d = Math.hypot(PB[b * 5] - x, PB[b * 5 + 1] - y, PB[b * 5 + 2] - z) - PB[b * 5 + 3]; if (d < lo) lo = d; } return lo; };
    // measureQuad(kind, P, o): the same for a sheet's quad (its four corners in order, twelve numbers of P from o),
    // gone over on a lattice of a metre at the most, eight steps by eight at a time: a patch whose middle, less its
    // reach (6 m), is no nearer than the kind's least so far is not gone over. It gives back how many points it took.
    const measureQuad = (kind, P, o) => {
      const len = (a, b) => Math.hypot(P[o + a * 3] - P[o + b * 3], P[o + a * 3 + 1] - P[o + b * 3 + 1], P[o + a * 3 + 2] - P[o + b * 3 + 2]);
      const nu = Math.max(1, Math.ceil(Math.max(len(0, 1), len(3, 2)))), nv = Math.max(1, Math.ceil(Math.max(len(1, 2), len(0, 3))));
      const at = (u, v, k) => (1 - u) * (1 - v) * P[o + k] + u * (1 - v) * P[o + 3 + k] + u * v * P[o + 6 + k] + (1 - u) * v * P[o + 9 + k];
      let m = Infinity, n = 0;
      for (let ci = 0; ci <= nu; ci += 8) for (let cj = 0; cj <= nv; cj += 8) {
        const i1 = Math.min(nu, ci + 8), j1 = Math.min(nv, cj + 8), uc = (ci + i1) / 2 / nu, vc = (cj + j1) / 2 / nv; n++;
        if (Math.min(m, CLEAR[kind] ?? Infinity) <= lowAt(at(uc, vc, 0), at(uc, vc, 1), at(uc, vc, 2)) - 6) continue;
        for (let i = ci; i <= i1; i++) for (let j = cj; j <= j1; j++) { m = Math.min(m, clearOf(at(i / nu, j / nv, 0), at(i / nu, j / nv, 1), at(i / nu, j / nv, 2))); n++; }
      }
      if (m < Infinity) noteClear(kind, m);
      return n;
    };
    // lateral place by the route: a point `ahead` metres of horizontal distance h, `side` metres to the
    // left of travel (the ridge side) when positive, to the right (the hub side) when negative
    const beside = (h, side, out = [0, 0, 0, 1]) => { routeXZ(h, out); out[0] += out[3] * side; out[1] -= out[2] * side; return out; };
    // THE KEEP'S PLACE (see THE KEEP; round 8): BEYOND THE RING, on the hub's hand: abeam of the place KEEP_ON m along the
    // exit axis past the ring's plane and KEEP_LAT m from that axis, past the camp's end. (Where it stood, by the river
    // 36 m from the way, it lay on the picture's side for 150 m of our way: our look is to the ridge's hand there.)
    // [x, z, the way's heading there x, z]
    const KEEP_LAT = 76, KEEP_ON = 241, KEEP = beside(H_END + KEEP_ON, -KEEP_LAT, [0, 0, 0, 1]);
    const KEEP_H = 30, KEEP_PAIR = D.rowPairs[1];
    await ctx.yield();
    // ---- THE SKY: one dome shader. Azure, one flat coat. Clouds are argent charges in a strict drop
    // repeat on the sky's own wall (azimuth and height), nebuly-edged, drifting slowly, none within
    // 14 degrees of the sun. The sun in splendour, or: a disc 5 degrees across, sixteen rays out to
    // 12 degrees, alternately straight and wavy. The skyline: a low argent band with an indented top.
    const T = style.tinctures, tones = style.tones;
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uSun: style.uniforms.uSun, uTime: style.uniforms.uTime, uPx: style.uniforms.uPx,
        uAzure: { value: T.azure }, uArgent: { value: T.argent }, uArgentDeep: { value: tones.argentDeep },
        uOr: { value: T.or }, uOrDeep: { value: tones.orDeep }, uOrCore: { value: tones.orCore }, uSable: { value: T.sable },
        uGroundFar: { value: T.sable },
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = position;
          vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
          if (abs(p.w) < 1e-4) p.w = 1e-4;
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vDir;
        uniform vec3 uSun, uAzure, uArgent, uArgentDeep, uOr, uOrDeep, uOrCore, uSable, uGroundFar;
        uniform float uTime, uPx;
        const float DEG = 57.29578;
        float bulb(float x) { float s = sin(x); return s / sqrt(s * s + 0.12); }   // the nebuly line: a rounded square wave
        void main() {
          vec3 d = vDir / max(length(vDir), 1e-4);
          float aa = max(uPx * DEG, 1e-3) * 1.2;                         // degrees a pixel
          float el = asin(clamp(d.y, -1., 1.)) * DEG;
          float az = (abs(d.x) + abs(d.z) > 1e-4) ? atan(d.x, d.z) * DEG : 0.;
          vec3 col = uAzure;
          // clouds: rows 8 degrees apart, 30 degrees a repeat, each row dropped half a repeat
          float drift = uTime * 0.22;
          float row = floor((el - 5.) / 8.);
          if (el > 5. && row < 6.5) {
            float y = el - 5. - (row + 0.5) * 8.;
            float xa = az + drift + row * 15.;
            float cell = floor(xa / 30.), x = xa - (cell + 0.5) * 30.;
            // the cell's own middle, as a direction: metal never on metal, so none near the sun
            float caz = ((cell + 0.5) * 30. - drift - row * 15.) / DEG, cel = (5. + (row + 0.5) * 8.) / DEG;
            vec3 cd = vec3(sin(caz) * cos(cel), sin(cel), cos(caz) * cos(cel));
            float clearSun = step(dot(cd, uSun), 0.857);                 // 31 degrees: 14 clear of the rays' reach
            // ROUND 10, FOUR SHAPES OF THE NEBULY CLOUD, laid by place: a cloud has TWO, THREE, FOUR OR FIVE WAVES by its
            // place in the repeat (cell + 2 * row, counted in fours: so each differs from its two neighbours in the row
            // and from the four nearest of the rows above and below), and its SIZE, 0.6 to 1.6 of the first cloud's (no
            // longer than 28 degrees: it keeps inside its own cell), by the hash of its place.
            float waves = 2. + mod(cell + 2. * row, 4.);
            float hsh = fract(sin(dot(vec2(mod(cell, 12.), row), vec2(127.1, 311.7))) * 43758.5453);
            float sz = mix(0.6, min(1.6, 5.6 / waves), hsh);
            float halfLen = 2.5 * waves * sz;                             // degrees (the first cloud: four waves, 20 degrees long)
            float env = sqrt(max(1. - (x * x) / (halfLen * halfLen), 0.));
            float mid = 0.75 * sz * bulb(x * 1.26 / sz);
            float t = 1.55 * sz * env - abs(y - mid);
            // (ROUND 13b: THE CLOUD'S EDGE IS HARD, as every edge here: one pixel of the picture's own, by the derivative
            // of the cloud's own line; bounded, so that no seam of the rows or the cells draws a line)
            float ft = clamp(fwidth(t), 1e-5, 2. * aa);
            float m = clamp(t / ft + 0.5, 0., 1.) * clearSun * step(abs(x), halfLen);
            // each cloud is one leaf and takes ONE tone from the one sun by its own place in the sky (no band, no shading across it)
            float sunward = dot(cd, uSun);
            vec3 cc = mix(uArgent, vec3(1.), 0.7 * smoothstep(0.2, 0.8, sunward));
            col = mix(col, cc, m);
          }
          // the sun in splendour
          float cz = dot(d, uSun);
          if (cz > 0.96) {
            vec3 e1 = cross(uSun, vec3(0., 1., 0.)); e1 = e1 / max(length(e1), 1e-4);
            vec3 e2 = cross(e1, uSun);
            vec2 s = vec2(dot(d, e1), dot(d, e2));
            float a = atan(length(s), cz) * DEG;
            if (a < 2.5) {
              vec3 disc = mix(uOr, uOrCore, (1. - smoothstep(0.4, 1.7, length(s * DEG - vec2(-0.5, 0.55)))));
              disc = mix(disc, uOrDeep, smoothstep(1.9, 2.3, length(s * DEG - vec2(-0.25, 0.3))));
              col = mix(disc, uSable, smoothstep(2.32 - aa, 2.32 + aa, a));
            } else if (a < 12.2) {
              float th = atan(s.y, s.x) / 6.2831853 * 16.;
              float k = floor(th + 0.5), f = th - k;
              float lat = f * (6.2831853 / 16.) * a;                      // degrees across the ray
              float odd = mod(k, 2.);
              float wav = 0.42 * sin((a - 2.5) * 1.5 - uTime * 2.4 + k * 1.3) * smoothstep(2.5, 4.5, a);
              lat -= wav * odd;
              float w = 0.52 * (12. - a) / 9.5 * (1. - 0.25 * odd) + 0.1 * odd * (1. - smoothstep(9., 12., a));
              float inside = smoothstep(-aa, aa, w - abs(lat)) * (1. - smoothstep(12. - aa, 12. + aa, a));
              vec3 ray = mix(uOrDeep, uOr, smoothstep(-aa, aa, lat));    // each ray cut in two faces
              ray = mix(ray, uOrCore, (1. - odd) * smoothstep(0.1, 0.3, lat) * (1. - smoothstep(3., 7., a)) * 0.6);
              col = mix(col, ray, inside);
            }
          }
          // the skyline: a line of partition, indented, argent, keylined below against the ground
          float tooth = abs(fract(az / 2.4) - 0.5) * 2.;
          float top = 0.75 + 0.55 * tooth;
          col = mix(col, uArgent, 1. - smoothstep(top - aa, top + aa, el));
          col = mix(col, uSable, 1. - smoothstep(0.16 - aa, 0.16 + aa, el));
          col = mix(col, uGroundFar, 1. - smoothstep(-0.2 - aa, -0.2 + aa, el));
          gl_FragColor = vec4(col, 1.);
        }`,
      depthWrite: false, depthTest: false, side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'sky';
    scene.add(sky);
    await ctx.yield();
    // ---- THE GROUND: one flat mesh, everything drawn in the fragment shader in world x and z.
    // Six fields about the hub, parted by the three lines (S0 the entry's, then S1, S2, S3 as the
    // route crosses A, B and C; S4 and S5 lie beyond the hub). A field is a fur or a plain tincture
    // strewn with one plain charge; the river lies along B, barry wavy; a fountain marks the hub.
    const other = (m) => (m === 'or' ? 'argent' : 'or');
    const furMetal = D.fur === 'erminois' ? 'or' : 'argent';
    const pm = D.fur === 'erminois' ? 'argent' : D.plainMetal, pc = D.plainColour;
    const far5 = 'vert';                                             // the far fields beyond the hub (the plain's colour is never vert)
    // [base, charge, kind] by field; kind 1 ermine spot, 2 roundel (the far fields), 7 the lists' large strewing
    // (ROUND 9: THE LISTS' FLOOR IS STREWN LARGE, in the way's own rows: kind 7, see bigStrewn; BIG_KINDS: the charge of
    // the lists' first half and of its second, by the deal: 2 roundel, 3 billet, 6 lozenge, 8 trefoil)
    const strew = 7, BIG_KINDS = [[3, 2], [2, 6], [8, 3]][Math.floor(D.leanPick * 3) % 3];
    const fieldsMetalFirst = [[furMetal, 'sable', 1], ['sable', furMetal, 1], [pm, pc, strew], [pc, pm, strew], [other(pm), far5, 2], [far5, other(pm), 2]];
    const fieldsColourFirst = [['sable', furMetal, 1], [furMetal, 'sable', 1], [pc, pm, strew], [pm, pc, strew], [far5, other(pm), 2], [other(pm), far5, 2]];
    const fields = entryMetal ? fieldsMetalFirst : fieldsColourFirst;
    const metalId = (n) => (n === 'or' ? 1 : n === 'argent' ? 2 : 0);
    const groundMat = new THREE.ShaderMaterial({
      uniforms: {
        ...style.uniforms,
        uBase: { value: fields.map((f) => T[f[0]]) }, uChg: { value: fields.map((f) => T[f[1]]) },
        uBig: { value: new THREE.Vector2(BIG_KINDS[0], BIG_KINDS[1]) },
        // (the fourth: the far fields' rows, metres apart; ON THE FUR THE SPOT'S OWN LENGTH, laid where the stag is cut: see THE STAGS)
        uInfo: { value: fields.map((f) => new THREE.Vector4(metalId(f[0]), metalId(f[1]), f[2], f[2] === 2 ? 22 : f[2] === 1 ? 0 : 8)) },
        uOr: { value: T.or }, uOrDeep: { value: tones.orDeep }, uOrCore: { value: tones.orCore },
        uArg: { value: T.argent }, uArgDeep: { value: tones.argentDeep }, uArgCore: { value: tones.argentCore },
        uAzure: { value: T.azure }, uSable: { value: T.sable }, uRiverFirst: { value: style.isMetal(fields[1][0]) ? 1 : 0 },
        // the ridge's foot: the crest's plan line set in 8.7 m toward the hub (the nearest flat's face and the line's own width)
        uFoot: { value: new THREE.Vector3(R_RIDGE, 1.5, 1.5 + 1.3) }, uBridgePh: { value: new THREE.Vector4(9, 9, 9, 9) }, uRidge: { value: new THREE.Vector4(RIDGE_K, RIDGE_P0, RIDGE_END, RIDGE_Q) }, uDip: { value: new THREE.Vector4(DIP[0], DIP[1], DIP[2], DIP[3]) }, uDipM: { value: RIDGE_DIP },
        uRingFoot: { value: (() => { const q = routeXZ(H_END, [0, 0, 0, 1]); return new THREE.Vector4(q[0], q[1], q[2], q[3]); })() }, uRiverEnd: { value: 7000 }, uCross: { value: new THREE.Vector4(0, -1e4, 0, -1e4) },
        uSpur: { value: new THREE.Vector4(crestXZ(SUMMIT_D)[0] - HUB[0], crestXZ(SUMMIT_D)[1] - HUB[1], crestXZ(SUMMIT_D + 1)[0] - crestXZ(SUMMIT_D)[0], crestXZ(SUMMIT_D + 1)[1] - crestXZ(SUMMIT_D)[1]) },
      },
      vertexShader: /* glsl */`
        varying vec3 vW;
        void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: style.glsl.counter + /* glsl */`
        varying vec3 vW;
        uniform vec3 uSun, uOr, uOrDeep, uOrCore, uArg, uArgDeep, uArgCore, uAzure, uSable;
        uniform vec3 uBase[6]; uniform vec3 uChg[6]; uniform vec4 uInfo[6];
        uniform float uLeafSeed, uTime, uRiverFirst, uRiverEnd; uniform vec4 uCross; uniform vec3 uFoot; uniform vec4 uRidge; uniform vec4 uDip; uniform float uDipM; uniform vec4 uSpur; uniform vec4 uRingFoot; uniform vec4 uBridgePh;
        // the ridge's plan line: its distance from the hub at the bearing ph (one steady spiral outward to the summit)
        float ridgeR(float ph) { float t = clamp((ph - uRidge.y) / max(uRidge.z - uRidge.y, 1e-4), 1e-6, 1.); return uFoot.x * exp(uRidge.x * smoothstep(0., 1., pow(t, uRidge.w))) - uDipM * smoothstep(uDip.x, uDip.y, ph) * (1. - smoothstep(uDip.z, uDip.w, ph)); }
        float gHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
        // leaf on the ground: d is the answer of this leaf square to the one sun and the view
        vec3 leafTone(float id, float d, float seam) {
          vec3 leaf = id < 1.5 ? uOr : uArg;
          return leaf;
        }
        vec3 tinct(float id, vec3 flatc, float d, float seam) { return id < 0.5 ? flatc : leafTone(id, d, seam); }
        // THE ERMINE SPOT AS HERALDRY DRAWS IT (round 16): THREE DOTS OVER A TAIL THAT FLARES TO THREE POINTS, the tail
        // toward us as it was. No round head: the tail begins narrow under the dots (0.18 broad at 0.55), flares in a
        // curve to 1.24 broad and ends in three points, the middle one at -1.15, the two outer at -1.05, parted by two
        // notches cut up to -0.70. The drawing's own measures, in its own units (SPOT: its length, from the middle
        // point's tip to the top of the upper dot; 1.46 broad over the two lower dots); every divisor is the length of
        // its line's own gradient, so that an edge is one pixel soft.
        const float SPOT = 2.38;
        float sdCharge(vec2 p, float kind) {
          if (kind < 1.5) {
            float ax = abs(p.x), t = clamp((0.55 - p.y) / 1.3, 0., 1.), k = 2. * 0.53 * t / 1.3;
            float side = (ax - 0.09 - 0.53 * t * t) / sqrt(1. + k * k);
            float ends = min((1.73 * ax - 1.15 - p.y) / 2., (-0.70 - 0.97 * (ax - 0.26) - p.y) / 1.39);
            float tail = max(max(side, ends), p.y - 0.55);
            float dots = min(length(p - vec2(0., 1.02)) - 0.21, min(length(p - vec2(-0.52, 0.72)) - 0.21, length(p - vec2(0.52, 0.72)) - 0.21));
            return min(tail, dots);
          }
          return length(p) - 1.5;                                       // the roundel (the far fields')
        }
        // one strewn charge of the lattice at xz: staggered rows sp apart; sc scales the drawn charge
        const float LANE = 36.;
        float strewn(vec2 xz, float sp, float kind, float sc, float pmin) {
          float row = floor(xz.y / sp + 0.5);
          vec2 q = vec2(xz.x - 0.5 * sp * mod(row, 2.), xz.y);
          q.x -= sp * floor(q.x / sp + 0.5); q.y -= sp * row;
          // (ROUND 13b, THE FUR LIES FLAT AND WHOLE: the ermine's spots are painted marks in the fur's own offset rows
          // (their length and their rows: see field), over the whole fur country and under our way too: a patterned floor.)
          // (A LANE LIES CLEAR ALONG THE WAY, round 8, for every other charge: a charge whose own middle lies within LANE m of the way's line is
          // not strewn, whole: so no charge passes under us and is cut by the foot of the picture. A rule of the floor.)
          return (kind < 1.5 ? 1. : step(LANE, abs(nccWay(xz - q)))) * clamp(0.5 - sdCharge(q / sc, kind) * sc / pmin, 0., 1.);
        }
        // THE LISTS' FLOOR IS STREWN LARGE (round 9), AS THE ERMINE IS, IN ROWS THAT RUN AWAY WITH THE WAY'S PALE: the lattice is
        // laid in the way's own coordinates (metres to a hand of the way's line; metres along it: round the hub's arc to the
        // arc's end, straight on after it). A row lies on the pale and every BIG.x m to either hand of it,
        // its charges BIG.y m apart along the row, every other row set half a step along (the fur's own drop repeat).
        // A charge is plain and large, 3.8 to 4 m: a roundel, a billet, a lozenge or a trefoil slipped, by the deal: one kind
        // on the first half of the lists and another beyond line C, taken by the side of line C the charge's own middle lies
        // on, so a charge that lies across line C is one whole charge, two-coloured exactly at the line.
        // (ROUND 13b, S4: THE CHARGES ARE BOLD: each BOLD times the size it was cut at, 5.3 to 5.6 m, one size, in the same
        // strict rows 10 m apart, right from the gate's arch: the floor reads as a patterned floor)
        const vec2 BIG = vec2(10., 10.); const float BOLD = 1.4;
        uniform vec2 uBig;
        float sdBig(vec2 p, float kind) {
          if (kind < 2.5) return length(p) - 1.9;
          if (kind < 3.5) { vec2 q = abs(p) - vec2(1.15, 1.9); return max(q.x, q.y); }
          if (kind < 6.5) return (abs(p.x) / 1.5 + abs(p.y) / 2.0 - 1.) * 1.2;
          float leaves = min(length(p - vec2(0., 0.9)) - 0.98, length(vec2(abs(p.x) - 0.98, p.y + 0.35)) - 0.98);
          return min(leaves, max(abs(p.x) - 0.3, abs(p.y + 1.25) - 0.75));
        }
        float bigStrewn(vec2 xz, float pmin) {
          vec2 r = xz - uCcH, tng = vec2(-uCcW.y, uCcW.x);
          // (ROUND 10: A ROW LIES ON THE PALE ITSELF, and the others every BIG.x m to either hand of it: each charge of that
          // row lies across the pale of the way, the seam that runs on through the ring, and is two-coloured exactly at it,
          // by the law of counterchange, per fragment: so the seam reads as the counterchange it is.)
          float l = nccWay(xz), row = floor(l / BIG.x + 0.5), lc = row * BIG.x, rr = max(uCcW.z + lc, 30.);
          float s = dot(r, tng), c0 = dot(r, uCcW.xy), len = length(r);
          float ph = (abs(s) + abs(c0) > 1e-4) ? atan(s, c0) : 0.;
          float along = s > 0. ? s : ph * rr, off = 0.5 * mod(row, 2.);
          float ac = (floor(along / BIG.y - off + 0.5) + off) * BIG.y;
          vec2 q = vec2(l - lc, (along - ac) * (s > 0. ? 1. : len / rr));
          // the charge's own middle, as a place: its side of line C says which of the two kinds it is
          float pc = ac / rr;
          vec2 mid = ac > 0. ? uCcW.xy * (uCcW.z + lc) + tng * ac : rr * (cos(pc) * uCcW.xy + sin(pc) * tng);
          float kind = (uCcC.x * mid.y - uCcC.y * mid.x) > 0. ? uBig.y : uBig.x;
          return clamp(0.5 - sdBig(q / BOLD, kind) * BOLD / pmin, 0., 1.);
        }
        // a field: its base tincture strewn with its charge. pmin is a pixel's short reach on the ground (metres),
        // maj its long reach as a vector (four taps along it, so far rows stay rows), fade the dissolve to the plain tincture
        // (hw 1: the hub's hand of the pale of the way: the field's two tinctures change places, its strewn charge counterchanged)
        vec3 field(vec2 xz, float a, float b, float c, float hw, float pmin, vec2 maj, float fade, float d, float seam) {
          float n = a + b + c;
          float fi = (a > 0.5 || n < 0.5) ? n : 6. - n;
          int i = int(clamp(fi, 0., 5.) + 0.5);
          vec4 info = uInfo[i];
          vec3 base = hw > 0.5 ? tinct(info.y, uChg[i], d, seam) : tinct(info.x, uBase[i], d, seam);
          vec3 chg = hw > 0.5 ? tinct(info.x, uBase[i], d, 0.) : tinct(info.y, uChg[i], d, 0.);
          // (ROUND 16, THE FUR'S SPOT IS AS LONG AS THE STAG THAT LODGES ON IT IS LONG, AND THE FUR IS STREWN AS THICKLY AS
          // THE LISTS ARE: on the fur info.w is the lodged stag's own length, nose to tail (metres, read from its mesh);
          // the spot is drawn that long (SPOT is its drawing's length) and its rows stand as far apart for it as the
          // lists' rows do for their charge: BIG.x m to a charge of big m. One law for the three furs, from the entry
          // to the river. Till the stag is cut the fur lies plain.)
          float big = 3.8 * BOLD;
          float sp = info.z < 1.5 ? info.w * BIG.x / big : info.w, sc = info.z < 1.5 ? info.w / SPOT : info.z < 2.5 ? 1.8 : 1.05;   // (the far fields' roundels stand 22 m apart, 5.4 m across; the lists' charges 10 m apart)
          float cov = 0.;
          if (info.z > 6.5) cov = 0.25 * (bigStrewn(xz - 0.375 * maj, pmin) + bigStrewn(xz - 0.125 * maj, pmin) + bigStrewn(xz + 0.125 * maj, pmin) + bigStrewn(xz + 0.375 * maj, pmin));
          else if (sp > 0.) cov = 0.25 * (strewn(xz - 0.375 * maj, sp, info.z, sc, pmin) + strewn(xz - 0.125 * maj, sp, info.z, sc, pmin)
            + strewn(xz + 0.125 * maj, sp, info.z, sc, pmin) + strewn(xz + 0.375 * maj, sp, info.z, sc, pmin));
          // (ROUND 9: a flat ermine spot seen so low that it is under some four pixels tall is no spot but a grey streak
          // on its field: it dissolves into the field's tincture as a pixel's long reach on the ground grows from a
          // fifth of the spot's length to two fifths of it (ROUND 16: the same counts of pixels as when the spot was 3 m
          // long and the reach grew from 0.6 to 1.2 m; the dissolve is scaled with the spot, here and by S below).)
          if (info.z < 1.5) fade *= 1. - smoothstep(info.w / 5., info.w / 2.5, length(maj));
          // (ROUND 11, NO DOT UNDER TWO PIXELS: a strewn charge seen so low that its own depth (S m, its least breadth) is drawn
          // under 4.5 pixels dissolves into its field's plain tincture, and is gone where it would be 3 pixels (so that what is
          // still seen of a dissolving charge, more than half its strength, is two pixels deep and more): the far floor
          // lies plain, with no band of fine dots. Standing paint, by the picture's own derivatives: a pixel's long reach.)
          float S = info.z > 6.5 ? big : 2. * sc;
          fade *= 1. - smoothstep(S / 4.5, S / 3., length(maj));
          return mix(base, chg, cov * fade);
        }
        // the class of a field's own ground (0 a colour, 1 or, 2 argent), by the sides of the three lines and of the pale of the way
        float baseId(float a, float b, float c, float hw) {
          float n = a + b + c;
          float fi = (a > 0.5 || n < 0.5) ? n : 6. - n;
          vec4 info = uInfo[int(clamp(fi, 0., 5.) + 0.5)];
          return hw > 0.5 ? info.y : info.x;
        }
        void main() {
          vec2 xz = vW.xz;
          vec2 gx = dFdx(xz), gy = dFdy(xz);
          float lx = length(gx), ly = length(gy);
          vec2 maj = lx > ly ? gx : gy;
          float pmin = max(min(lx, ly), 1e-4), pmaj = max(lx, ly);
          float fade = (1. - smoothstep(0.6, 1.8, pmin)) * (1. - smoothstep(4.5, 9., pmaj));
          // THE FLOOR'S METALS LIE FLAT (the crew lead's ruling: no sheen, no seam, no gradient): one tone, the palette's own
          float d = 0.5, seam = 0.;
          // the three lines: this fragment's field, and the field across the nearest line where it is within a pixel
          float sA = nccSide(uCcA, xz), sB = nccSide(uCcB, xz), sC = nccSide(uCcC, xz);
          float a = step(0., sA), b = step(0., sB), c = step(0., sC);
          float sW = nccWay(xz), hw = uCcW.w * step(sW, 0.);
          vec3 col = field(xz, a, b, c, hw, pmin, maj, fade, d, seam);
          // a line of partition is one pixel soft ACROSS ITSELF (the derivative of its own signed side), however far off
          float nA = abs(sA) / max(fwidth(sA), 1e-5), nB = abs(sB) / max(fwidth(sB), 1e-5), nC = abs(sC) / max(fwidth(sC), 1e-5);
          float nW = uCcW.w > 0.5 ? abs(sW) / max(fwidth(sW), 1e-5) : 1e5;
          float m = min(min(nA, nW), min(nB, nC));
          if (m < 0.5) {
            float a2 = a, b2 = b, c2 = c, h2 = hw;
            if (nW <= m) h2 = 1. - hw; else if (nA <= m) a2 = 1. - a; else if (nB <= m) b2 = 1. - b; else c2 = 1. - c;
            col = mix(field(xz, a2, b2, c2, h2, pmin, maj, fade, d, seam), col, 0.5 + m);
          }
          // THE RIVER along B, hub to ridge foot: BARRY WAVY OF THREE, bold: the two bars that meet the banks azure (the river's
          // colour), the middle bar argent, sliding toward the hub at 6 m/s. Where a bank's own ground is a colour the river is
          // FIMBRIATED argent there (an edge 1.5 m wide), so no colour lies against a colour and no metal against a metal.
          vec2 r = xz - uCcH; float t = dot(r, uCcB); float rr0 = length(r);
          float sw = sB + 3.6 * sin((t + 6. * uTime) * 0.17);
          float wsw = max(fwidth(sw), 1e-4);
          float wet = clamp((25. - abs(sw)) / wsw + 0.5, 0., 1.) * step(30., t) * (1. - smoothstep(uRiverEnd, uRiverEnd + 1., t));
          vec3 argentW = leafTone(2., d, seam);
          vec3 water = mix(uAzure, argentW, clamp((8.3 - abs(sw)) / wsw + 0.5, 0., 1.));
          float bankMetal = baseId(a, step(0., sw), c, hw);
          water = mix(water, argentW, (1. - step(0.5, bankMetal)) * clamp((abs(sw) - 23.5) / wsw + 0.5, 0., 1.));
          // THE FILLETS (the crew lead's ruling): every dividing line of the fields is DRAWN, a bold fillet 1.5 m wide laid
          // along it: a sable keyline to either edge and a core of argent 0.8 m wide (a metal between keylines: lawful on
          // every field). Lines A and C whole (line B is the river); THE PALE OF THE WAY FROM THE ENTRY TO THE GATE ON LINE
          // C (round 12, a rule of the place: beyond the gate the lists are parted per pale along the way, colour and
          // metal, by the bare line of partition as a parted field is; we fly the lists high and straight over that line,
          // and a fillet under the flown line is seen end-on, a spike up the picture's foot: so none is laid there).
          // Far off the core and its keylines hold their own pixels (round 11, below).
          float wA = max(fwidth(sA), 1e-4), wC = max(fwidth(sC), 1e-4), wW = max(fwidth(sW), 1e-4);
          float onWay = uCcW.w * (1. - c) * step(0., xz.y);
          // (ROUND 11: a fillet reads as a DRAWN LINE ALL ALONG: far off its argent core holds 1.8 pixels across itself and a
          // keyline of 1.1 pixels lies to either edge of it, so the line never thins to a bare change of tincture. The
          // widths are read from the picture's own derivatives of the line's distance, nothing else.)
          // THE LINE UNDER THE HERD (round 14, T2c; a rule of the herds' tracks, the same on every seed): WHERE A HERD'S
          // TRACK CROSSES A DIVIDING LINE THE LINE IS DRAWN BROAD ACROSS THE TRACK: a core of argent 2.4 m wide between
          // sable keylines, 4 m in all, for uCross.y m of the line to either hand of the crossing, narrowing to the
          // common fillet over 20 m more: a stag astride it is seen half and half ON a line anyone can see. Line A
          // where the first herd's file crosses it at the first wall's foot (uCross.xy: metres along line A from the
          // hub, half the length); THE PALE OF THE WAY where four of the second herd cross it beyond the ring's plane
          // (uCross.zw: metres along the last straight, half the length): there, where no fillet lies, the line is
          // drawn as a bar across the lanes, pointed at its two ends.
          float eA = 1. - smoothstep(uCross.y, uCross.y + 20., abs(dot(r, uCcA) - uCross.x));
          float eW = 1. - smoothstep(uCross.w, uCross.w + 14., abs(dot(r, vec2(-uCcW.y, uCcW.x)) - uCross.z));
          onWay = max(onWay, uCcW.w * step(0.02, eW));
          float gW = mix(eW, 1., uCcW.w * (1. - c) * step(0., xz.y));   // (beyond the gate the bar's breadth is the crossing's own; before it the fillet's)
          float hA = max(0.4 + 0.8 * eA, 0.9 * wA), hC = max(0.4, 0.9 * wC), hW = max((0.4 + 0.8 * eW) * gW, 0.9 * wW * step(0.3, gW));
          float kA = clamp((max(0.75 + 1.25 * eA, hA + 1.1 * wA) - abs(sA)) / wA + 0.5, 0., 1.), kC = clamp((max(0.75, hC + 1.1 * wC) - abs(sC)) / wC + 0.5, 0., 1.);
          float kW = clamp((max((0.75 + 1.25 * eW) * gW, hW + 1.1 * wW * step(0.3, gW)) - abs(sW)) / wW + 0.5, 0., 1.) * onWay;
          float cA = clamp((hA - abs(sA)) / wA + 0.5, 0., 1.), cC = clamp((hC - abs(sC)) / wC + 0.5, 0., 1.), cW = clamp((hW - abs(sW)) / wW + 0.5, 0., 1.) * onWay;
          col = mix(col, uSable, max(kA, max(kC, kW)));
          col = mix(col, argentW, max(cA, max(cC, cW)));
          col = mix(col, water, wet);
          // the keyline at the ridge's foot (the ridge is a charge laid on the fields): a line that holds a
          // pixel and a half across itself, however far; nothing off the line takes any sable
          float wR = max(fwidth(rr0), 1e-4);
          // (the plan line as the world lays it: ridgeR, the hub's circle and its eased steps;
          // then the summit's last slope, straight)
          float ph = rr0 > 1. ? atan(r.y, r.x) : 0.;
          float rl = ridgeR(ph), drl = (ridgeR(ph + 0.004) - ridgeR(ph - 0.004)) / 0.008;
          float dF = (rr0 - rl) * rl / max(sqrt(rl * rl + drl * drl), 1e-3) + uFoot.z;      // metres outside the foot's line
          float wF = max(fwidth(dF), 1e-4);
          float footR = (ph > -0.6981 && ph < uRidge.z && (ph < uBridgePh.x || ph > uBridgePh.y) && (ph < uBridgePh.z || ph > uBridgePh.w)) ? (abs(dF) - max(uFoot.y, 0.75 * wF)) / wF : 1e5;   // (no line under the bridge nor in the water gate: their arches stand open on the valleys' floors)
          vec2 qs = r - uSpur.xy; float ss = dot(qs, uSpur.zw), dS = dot(qs, vec2(-uSpur.w, uSpur.z)) - uFoot.z, wS = max(fwidth(dS), 1e-4);
          float footS = max((abs(dS) - max(uFoot.y, 0.75 * wS)) / wS, max(-ss, ss - 129.));
          float foot = min(footR, footS);
          col = mix(col, uSable, clamp(0.5 - foot, 0., 1.));
          // the fountain at the hub: a roundel barry wavy, keylined
          float fb = r.y + 2.2 * sin((r.x - 3. * uTime) * 0.3);
          float fm = abs(mod(floor(fb / 9.), 2.) - uRiverFirst);
          vec3 fount = mix(uAzure, leafTone(2., d, seam), fm);
          col = mix(col, uSable, clamp((34. - rr0) / wR + 0.5, 0., 1.));
          col = mix(col, fount, clamp((32.6 - rr0) / wR + 0.5, 0., 1.));
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000, 1, 1).rotateX(-Math.PI / 2), groundMat);
    ground.position.set(HUB[0], 0, HUB[1]); ground.name = 'ground'; ground.frustumCulled = false;
    scene.add(ground);
    await ctx.yield();
    // ---- THE RIDGE: dancetty, three flats deep, vert edged argent so it never touches the sky.
    // Each half tooth is one straight facet (a chord of the crest's circle); a facet is an instance of
    // one slab, sheared so its top lies along the crest line the lion's paws are solved against.
    // THE CREST RISES ALL THE WAY (no saddle): its tips climb evenly from 34 m to 100 m at the summit,
    // so that the ridge's vert stands broad under the lion's paws, above the fields and above the camp (the crew lead's ruling),
    // and the whole beast, tail and all, stands under the picture's top from the first metre of the way.
    // (THE NEAR REACH STANDS HIGH: no tip of the crest is lower than CREST_MIN m, so from the entry to the tip where the
    // old climb passes that height the tips stand level, and the ridge's vert is a broad band under the lion's paws)
    const CREST_MIN = 68, crestBase = nccCrest({ summit: SUMMIT_D, low: 34, high: 100 });
    const TOOTH = 110;
    // THE RIDGE'S END (round 10; a rule of the place): NO FLAT OF THE RIDGE ENDS IN A CLIFF. Past the summit tooth's far
    // slope (from TAIL.from m beyond the summit tip) each flat RUNS DOWN TO THE GROUND BY ITS OWN TEETH: a flank falling
    // TAIL.fall in one for half a tooth, a flank rising TAIL.rise in one for the next half, and so on until it meets the ground.
    const TAIL = { from: 70, fall: 0.6, rise: 0.2, half: TOOTH / 2 };
    const tailY = (y0, r) => { let y = y0; for (let k = 0; r > 0; k++) { const st = Math.min(r, TAIL.half); if (k % 2 === 0) { if (y - TAIL.fall * st <= 0) return 0; y -= TAIL.fall * st; } else y += TAIL.rise * st; r -= st; } return y; };
    const tailLen = (y0) => { let y = y0, r = 0; for (let k = 0; ; k++) { if (k % 2 === 0) { if (y <= TAIL.fall * TAIL.half) return r + y / TAIL.fall; y -= TAIL.fall * TAIL.half; } else y += TAIL.rise * TAIL.half; r += TAIL.half; } };
    const tailBreaks = (from, y0) => { const len = tailLen(y0), out = []; for (let r = TAIL.half; r < len - 1; r += TAIL.half) out.push(from + r); out.push(from + len); return out; };
    const CREST_TAIL0 = crestBase(SUMMIT_D + TAIL.from);
    const crestY = (d) => (d > SUMMIT_D + TAIL.from ? tailY(CREST_TAIL0, d - SUMMIT_D - TAIL.from) : d > SUMMIT_D ? crestBase(d) : crestBase(d) + Math.max(0, CREST_MIN - Math.max(34, 100 - (SUMMIT_D - d) * 66 / SUMMIT_D)));
    const FACET = 55, BODY = 160;
    // THE LION'S STATIONS (round 11): places of its road one STRIDE apart, counted back from the mount's station at
    // SUMMIT_D; TIP(k) the k-th from the station it stands at as we come in (TIP(9) the mount's). A degree of the steps is
    // one STRIDE long, so each degree carries one station at the same place of its length.
    const STRIDE = 106;
    const TIP = (k) => SUMMIT_D - (9 - k) * STRIDE;
    // THE LION'S ROAD (round 11; a rule of the place, the same on every seed): EVERYWHERE THE LION GOES IT STANDS ON THE TOP
    // LINE OF A LEVEL-TOPPED BUILT THING. The road stands on the crest's own plan line (the line the hills' nearer flats
    // stood on: of every line a road may take between the way and the summit it is the one seen flank-on from the whole
    // way), and from ROAD.t0 on the three nearer flats of the hills are not there: the road's faces stand in their place
    // (ROAD.out m before the line), and the rear flat stands on behind as the land's skyline. Arcs of the crest, metres:
    //   THE TERRACE   t0 to b0: a long level wall vert masoned argent, a buttress every 45 m, embattled on its far kerb;
    //                 where the river comes to it (line B's own ray) THE WATER GATE: two low round arches, a pier between;
    //   THE BRIDGE    b0 to b1: four low round arches over THE VALLEY (there the rear flat too comes down to the ground
    //                 by its own flanks: sky and the far fields are seen through the arches), piers between and a
    //                 parapet band; of the tincture BRIDGE_C, masoned argent; its deck is level with the terrace;
    //   THE WALL      b1 to w1: embattled, gules masoned argent, as built in round 10, a tower behind either end of its walk;
    //   THE STEPS     w1 to m0: three great degrees, each ROAD.deg m long; VERT MASONED ARGENT (not the wall's gules:
    //                 beyond line C the picture's left is no longer the wall);
    //   THE MOUNT     m0 to m1: vert masoned argent, its far end rounded down to the ground: there the lion rears.
    //   ROUND 14 (T5c; a rule of the road, the same on every seed): IN THE FAIR THE LION WALKS ON FOOTING OF THE LONG
    //   WALL'S OWN HEIGHT AND KIND. The three degrees and the mount stand LEVEL WITH THE RED WALL'S WALK (ROAD.riser 0:
    //   they stepped down 8.5 m each to a plain mount 61 m high, far under the lion's own height): one wall 86.5 m
    //   high from the red wall to the ring, vert masoned argent, a buttress before it
    //   every 45 m and merlons on its far kerb as the first wall has them; a pier still stands at each degree's joint.
    // roadFloor(d): the level the lion's planted paws stand on: THE WALK of each of those things, ROAD.sink m under the
    // face's own top edge (on the wall WALL.walk m under it); see THE WALK'S FAR KERB below (round 13, FOOTING).
    const WALL = { t1: 1102, t2: 1265, half: 25, top: 86.8, up: 31.2, cren: 10, tcren: 8, walk: 0.3, out: 1.5, tback: 7.5, merlon: 15, tmerlon: 10 };
    const _phv = [0, 0];
    // (THE WATER GATE: where the river comes to the terrace it runs out under two low round arches, a pier in midstream)
    const ROAD = { t0: 250, b0: 870, b1: WALL.t1 - WALL.half, w1: WALL.t2 + WALL.half, deg: STRIDE, riser: 0, m1: SUMMIT_D + 130, round: 62, out: 1.5, back: 2.2, sink: 0.3, kerb: 8, kerbOut: -3.8, base: [[11, 9, 0.8], [5.5, 21, 1.2]], yT: 84, arches: 4, spring: 4, pier: 15.75,
      gate: crestAbeamOf(THROUGH[1][0], THROUGH[1][1]), gateR: 15, gateSpring: 7, gatePier: 4 };   // (gate: the crest's arc on line B's own ray from the hub: where the river comes to the road)
    ROAD.gateHalf = 2 * ROAD.gateR + ROAD.gatePier / 2; ROAD.stand = ROAD.gate + ROAD.gateHalf + 40; ROAD.bay = [32, 26, 6.5, 14]; ROAD.but = [9, 1.5, 7]; ROAD.merlon = [8, 5]; ROAD.m0 = ROAD.w1 + 3 * ROAD.deg; ROAD.yW = WALL.top - WALL.walk; ROAD.yM = ROAD.yW - 3 * ROAD.riser;
    // (STREET0: where the camp's street begins, 25 m past the river's far bank; see THE CAMP'S STREET)
    const STREET0 = H_B + 54, STREET = { lat: 17, gap: 20, gapHub: 16.5, turn: 45, turnHub: 30, wide: 0.82, short: 16, tent: 6.4, shield: 13.6, low: 10 };
    const GATE = { half: 16.5, tur: 10.5, top: 27, cren: 2.6, tTop: 32, band: 1.5, roof: 8, R: 15, Rb: 12.5, deep: 5, spring: 10, ring: 1.5, quoin: 2.5, port: 18.6, bars: 2.2, wing: 45, wTop: 11 };   // (THE GATE ACROSS THE WAY, below)
    const roadFloor = (d) => (d < ROAD.b1 ? ROAD.yT : d < ROAD.w1 ? ROAD.yW : ROAD.yW - ROAD.riser * Math.min(3, 1 + Math.floor((d - ROAD.w1) / ROAD.deg)));
    // (the mount's far end: its top line comes down to the ground in a quarter round over the last ROAD.round m)
    const mountTop = (d) => { const x = Math.max(0, (d - (ROAD.m1 - ROAD.round)) / ROAD.round); return x >= 1 ? 0 : ROAD.yM * Math.sqrt(1 - x * x); };
    // THE VALLEYS (round 11): between each pair of joints of its facets the rear flat stands at nothing; the facet to
    // either side is its flank, down to the ground. The first is the river's (behind the terrace's water gate), the
    // second lies behind the bridge.
    const VALLEYS = [[SUMMIT_D - 18 * 55, SUMMIT_D - 17 * 55], [SUMMIT_D - 15 * 55, SUMMIT_D - 11 * 55]];
    const inValley = (d) => VALLEYS.some((v) => d > v[0] - 0.5 && d < v[1] + 0.5);
    { const phOf = (d) => { crestXZ(d, _phv); return Math.atan2(_phv[1] - HUB[1], _phv[0] - HUB[0]); };
      groundMat.uniforms.uBridgePh.value.set(phOf(ROAD.b0), phOf(ROAD.b1), phOf(ROAD.gate - ROAD.gateHalf), phOf(ROAD.gate + ROAD.gateHalf)); }
    const WALL_GAP = [ROAD.t0, 1e9];
    const ridge = new THREE.Group(); ridge.name = 'ridge';
    const _ca = [0, 0], _cb = [0, 0], _m4 = new THREE.Matrix4();
    // (ROUND 10, THE FACETS MEET: every joint of a flat is set out from the crest's plan line along the bisector of its
    // two facets' normals, a mitre, so that facet meets facet at one upright line whatever the flat's distance from the
    // plan line (set out each along its own normal, the facets of a pushed flat stood apart or stepped at every
    // joint); and a facet's two upright ends carry no rim (the worn rim's red clay showed at every joint of the
    // argent edge): the rim runs along the flat's top and foot only.)
    const noEndRim = (g, rim) => {
      const ps = g.attributes.position, lf = g.attributes.aLeaf, dm = g.attributes.aDome;
      for (let i = 0; i < ps.count; i++) {
        const x = ps.getX(i), nx = Math.abs(x - rim) < 1e-3 ? 0 : Math.abs(x - FACET + rim) < 1e-3 ? FACET : x;
        if (nx !== x) { ps.setX(i, nx); lf.setX(i, nx); dm.setX(i, (nx - FACET / 2) / (FACET / 2)); }
        dm.setZ(i, 0);   // (and no wear on a hill's edge at all: a rim 0.7 m broad, seen from 100 m and more, wore through as red dashes along every crest)
      }
      return g;
    };
    function flatOfRidge(cy, summit, inset, thick, band, zPush, tail, gap) {
      let spans = [];
      for (let b = summit; b > 2; b -= FACET) spans.push([Math.max(b - FACET, 2), b]);
      for (let i = 0, a = summit; i < tail.length; a = tail[i++]) spans.push([a, tail[i]]);
      // (gap: a stretch of the crest where this flat does not stand: its facets are cut at the stretch's two ends)
      if (gap) spans = spans.flatMap(([a, b]) => (b <= gap[0] || a >= gap[1] ? [[a, b]] : [a < gap[0] ? [a, gap[0]] : null, b > gap[1] ? [gap[1], b] : null].filter(Boolean)));
      const gBand = noEndRim(style.slab([[0, -band], [FACET, -band], [FACET, 0], [0, 0]], { thickness: thick, keyline: 0, rim: 0.7 }).geometry, 0.7);
      const gBody = noEndRim(style.slab([[0, -BODY], [FACET, -BODY], [FACET, -band], [0, -band]], { thickness: thick, keyline: 0, rim: 0.5 }).geometry, 0.5);
      const mBand = new THREE.InstancedMesh(gBand, style.metal('argent'), spans.length);
      const mBody = new THREE.InstancedMesh(gBody, style.colour('vert'), spans.length);
      const push = inset + zPush, joints = new Map();
      for (const [dA, dB] of spans) {
        crestXZ(dA, _ca); crestXZ(dB, _cb);
        const ex = _cb[0] - _ca[0], ez = _cb[1] - _ca[1], el = Math.hypot(ex, ez) || 1;
        for (const d of [dA, dB]) { const j = joints.get(d) || [0, 0, 0]; j[0] += -ez / el; j[1] += ex / el; j[2]++; joints.set(d, j); }   // (toward the hub: the face the route sees)
      }
      const at = (d, o) => { const j = joints.get(d), mx = j[0] / j[2], mz = j[1] / j[2], mm = mx * mx + mz * mz; crestXZ(d, o); o[0] += mx * push / mm; o[1] += mz * push / mm; return o; };
      spans.forEach(([dA, dB], i) => {
        at(dA, _ca); at(dB, _cb);
        const yOf = (d) => { const y = cy(d); return y > 0.05 ? y : -7; }, yA = yOf(dA), yB = yOf(dB);
        const ex = _cb[0] - _ca[0], ez = _cb[1] - _ca[1], el = Math.hypot(ex, ez) || 1;
        const nx = -ez / el, nz = ex / el;
        const k = 1 / FACET;
        _m4.set(ex * k, 0, nx, _ca[0],
          (yB - yA) * k, 1, 0, yA,
          ez * k, 0, nz, _ca[1],
          0, 0, 0, 1);
        mBand.setMatrixAt(i, _m4); mBody.setMatrixAt(i, _m4);
      });
      mBand.frustumCulled = false; mBody.frustumCulled = false;
      ridge.add(mBody, mBand);
    }
    const ph2 = 37, ph3 = 81;                                       // the lower flats' teeth stand between the crest's
    const CREST_TAIL = [SUMMIT_D + TAIL.from].concat(tailBreaks(SUMMIT_D + TAIL.from, CREST_TAIL0));
    flatOfRidge(crestY, SUMMIT_D, 0, 3, 5.5, 0, CREST_TAIL, WALL_GAP);
    // THE REAR FLAT (round 9: THE LION STANDS ON THE RIDGE, NOT IN THE SKY; a rule of the place, the same on every seed):
    // behind the crest the lion walks stands one flat more, REAR_PUSH m further from the hub (behind the lion's furthest
    // layer) and REAR_RISE m higher than the walked crest at every place of it, tooth for tooth: so behind every paw set
    // on the walked crest, and up its leg to the hock, lies this flat's vert under its own argent edge, and the body,
    // head, mane and tail stand over that edge against the azure. Past the summit it comes down to the ground where the
    // walked flat's own end does.
    // (ROUND 10: the rear flat stands REAR_PUSH m behind the walked crest's plan line, 13 m behind the lion's own plane in the fold (the figure is one flat plane 190 m long on a curved crest: its ends stand up to 9 m further back than its middle).)
    const REAR_RISE = 34, REAR_PUSH = 9 + 12, REAR_END = tailLen(CREST_TAIL0);
    // (past the summit tooth's far slope it runs down with the walked crest, tooth for tooth, its rise over it falling away to nothing where both meet the ground)
    const rearY = (d) => (inValley(d) ? 0 : d <= SUMMIT_D + TAIL.from ? crestY(d) + REAR_RISE : crestY(d) + REAR_RISE * Math.max(0, 1 - (d - SUMMIT_D - TAIL.from) / REAR_END));
    flatOfRidge(rearY, SUMMIT_D, 0, 3, 5, -REAR_PUSH, CREST_TAIL);
    // (the two lower flats: each runs down by its own teeth from the foot of its own summit tooth)
    const lowOf = (base, sm) => { const y0 = base(sm + TAIL.half); return (d) => (d > sm + TAIL.half ? tailY(y0, d - sm - TAIL.half) : base(d)); };
    const base2 = nccCrest({ summit: SUMMIT_D - ph2, depth: 14.5, low: 21, high: 58 }), base3 = nccCrest({ summit: SUMMIT_D - ph3, depth: 11.5, low: 11, high: 33 });
    const flat2Y = lowOf(base2, SUMMIT_D - ph2), flat3Y = lowOf(base3, SUMMIT_D - ph3);
    flatOfRidge(flat2Y, SUMMIT_D - ph2 + TAIL.half, 0, 2.4, 4.4, 3.2, tailBreaks(SUMMIT_D - ph2 + TAIL.half, base2(SUMMIT_D - ph2 + TAIL.half)), WALL_GAP);
    flatOfRidge(flat3Y, SUMMIT_D - ph3 + TAIL.half, 0, 2.4, 3.6, 6.2, tailBreaks(SUMMIT_D - ph3 + TAIL.half, base3(SUMMIT_D - ph3 + TAIL.half)), WALL_GAP);
    // a place on a lower flat's crest: [x, z, y, the face's normal x, z] at arc distance d, `out` metres toward the hub
    scene.add(ridge);
    // ---- THE ROAD'S FACES: one sheet of quads standing ROAD.out m before the crest's own plan line (true geometry: every
    // merlon and crenel, every arch, every riser and the mount's round end are cut in it). Paint (roadMat): the masoning,
    // the argent fillet along every top, down every free side and round every arch, the towers' loops.
    // Unlit: every tincture as its hex. Behind the lion's own plane (ROAD.back m behind the line) stand the wall-walk's
    // band, the wall's two towers and a plain post at every other joint of the road: nothing of it stands before the lion.
    const W_N = 2 * Math.round(((ROAD.w1 - ROAD.b1) / WALL.merlon - 1) / 2) + 1, W_SEG = (ROAD.w1 - ROAD.b1) / W_N;
    const T_TOP = WALL.top + WALL.up, T_N = 2 * Math.round((2 * WALL.half / WALL.tmerlon - 1) / 2) + 1, T_SEG = 2 * WALL.half / T_N;
    const ARCH = (ROAD.b1 - ROAD.b0) / ROAD.arches, ARCH_R = (ARCH - ROAD.pier) / 2;
    // THE ROAD'S ARCHES, each [the arc of its middle, its radius, the height it springs at]: the terrace's water gate over
    // the river, then the bridge's
    const ARCHES = [-1, 1].map((sg) => [ROAD.gate + sg * (ROAD.gateR + ROAD.gatePier / 2), ROAD.gateR, ROAD.gateSpring]);
    for (let k = 0; k < ROAD.arches; k++) ARCHES.push([ROAD.b0 + (k + 0.5) * ARCH, ARCH_R, ROAD.spring]);
    // THE ROLL OF ARMS (round 14, T1; a rule of the long wall, the same on every seed): GREAT SHIELDS hang on the face
    // toward the way, each ROLL.w m broad and ROLL.h m tall (three fifths of the face's 84 m: a bay between two
    // buttresses is 38 m clear), its head ROLL.under m under the face's top, ROLL.out m proud of the face. THEIR PLACES
    // (ROLL.at, arcs of the road): on the terrace the middle of every third bay counted back from the water gate (three)
    // and of the first bay past it; on the bridge over its first and third piers; on the red wall at a quarter and at
    // three quarters of its length: eight, 103 to 155 m apart. THE WORLD'S LAW SAID ONCE MORE ON EACH: the wall is a
    // colour, so the field is a metal and the charge is cut in the wall's own colour there (vert on the terrace, the
    // bridge's colour on the bridge, gules on the red wall); see the charges where they are dealt (THE ROLL'S CHARGES).
    // BETWEEN EVERY SECOND PAIR (ROLL.pens) a staff stands ROLL.staff[0] m before the face, its head ROLL.staff[2] m
    // under the face's top, and from it A LONG PENNON, forked, ROLL.pen[0] m long and 8 m deep at the staff, streams
    // along the face the way we go, by the world's clock. NOTHING OF THE ROLL RISES OVER THE FACE'S TOP: the lion runs
    // and waits on the walk above it. The nearest of it is 150 m from the flown line.
    // THE ROLL RUNS ON ALONG THE FAIR'S WALL (round 16; a rule of that wall, the same on every deal): the same shields,
    // hung the same way (the head ROLL.under m under the face's top, ROLL.out m proud of the face), IN THE MIDDLE OF
    // EVERY OTHER BAY between its buttresses, counted from the red wall's end (ROLL.fair, arcs of the road): the
    // first, the third and so on of the bays its level face holds: five on its nine bays. (The terrace's law, every
    // third bay, would hang three on this face; every other bay hangs five, the even spacing its own buttresses
    // give.) No staff and no pennon is added. The face is vert, as the terrace's: a metal field, the charge
    // vert. A bay is 37 m clear of its buttresses, the shield 34 m with its keyline.
    const ROLL = { w: 32, h: 50, under: 7, out: 0.6, thick: 0.8, staff: [3, 11, 1, 1.2], pen: [34, 6.5] };
    { const bays = (sa, sb) => { const n = Math.max(1, Math.round((sb - sa) / 45)), w = (sb - sa) / n; return Array.from({ length: n - 1 }, (_, i) => sa + (i + 1) * w); };
      const b1 = bays(ROAD.t0, ROAD.gate - ROAD.gateHalf), b2 = bays(ROAD.gate + ROAD.gateHalf, ROAD.b0);
      ROLL.at = [b1[1], b1[4], b1[7], b2[0], ROAD.b0 + ARCH, ROAD.b0 + 3 * ARCH, ROAD.b1 + (ROAD.w1 - ROAD.b1) / 4, ROAD.b1 + 3 * (ROAD.w1 - ROAD.b1) / 4];
      ROLL.pens = [0, 2, 4, 6].map((i) => (ROLL.at[i] + ROLL.at[i + 1]) / 2);
      ROLL.fair = bays(ROAD.w1, ROAD.m1 - ROAD.round).filter((_, i) => i % 2 === 0);
      ROLL.top = (s) => (s < ROAD.b1 ? ROAD.yT + ROAD.sink : s < ROAD.w1 ? WALL.top : roadFloor(s) + ROAD.sink); }
    // the bridge's colour (a colour, on the lists' metal floor and under the gold lion): sable, or purpure where the lists' own colour is gules
    const BRIDGE_C = pc === 'purpure' ? 'sable' : 'purpure';
    // the gate's colour (it stands on the lists' own floor, on line C): the wall's gules, or the bridge's colour where the lists' own colour is gules
    const GATE_C = pc === 'gules' ? BRIDGE_C : 'gules';
    {
      const pos = [], aW = [], aE = [], aK = [], idx = [], _pl = [0, 0], tags = [];
      let tag = 'road face';   // (the kind each quad of the sheet is measured under, see CLEAR: set before each run of pieces)
      // where a point of the sheet stands in plan: along the crest's plan line at arc sv, `out` m before it (the road); the
      // gatehouse sets its own (below). loopY: 1 = a tower's loops at the wall's own height (uLoop), else their height
      const onCrest = (sv, out, o) => { crestXZ(sv, _ca); crestXZ(sv + 1, _cb); const ex = _cb[0] - _ca[0], ez = _cb[1] - _ca[1], el = Math.hypot(ex, ez) || 1; o[0] = _ca[0] - ez / el * out; o[1] = _ca[1] + ex / el * out; return o; };
      let place = onCrest, loopY = 1;
      // a piece of the face from arc s0 to s1: its foot y0 (a: at s0, b: at s1) and its top y1; out: metres before the plan
      // line; kind: 0 the terrace, 1 the wall, 8 the steps (vert masoned argent), 2 the bridge, 3 the mount, 4 the wall-walk's band (no fillet), 5 the gatehouse's face, 6 its roofs (plain azure, filleted argent), 7 plain argent (its bands and bars);
      // free: 1 its left side is a free edge, 2 its right (filleted between sLo and sHi); rim: its foot is an arch's rim;
      // tc: a tower's middle (its loops are set out from it)
      const piece = (s0, s1, y0a, y0b, y1a, y1b, out, kind, free = 0, sLo = -10, sHi = 1e3, rim = 0, tc = -1) => {
        const base = pos.length / 3; tags.push(tag);
        for (const [sv, y, yt, yb] of [[s0, y0a, y1a, y0a], [s1, y0b, y1b, y0b], [s1, y1b, y1b, y0b], [s0, y1a, y1a, y0a]]) {
          place(sv, out, _pl);
          pos.push(_pl[0], y, _pl[1]);
          aW.push(sv, y, yt, yb);
          aE.push(free & 1 ? sv - s0 : 1e3, free & 2 ? s1 - sv : 1e3, sLo, sHi);
          aK.push(kind, rim, tc < 0 ? 0 : sv - tc, tc < 0 ? 0 : loopY);
        }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      };
      const quad = (s0, s1, y0, y1, out, kind, free, sLo, sHi, tc) => piece(s0, s1, y0, y0, y1, y1, out, kind, free, sLo, sHi, 0, tc);
      // THE TERRACE: one level bank, in pieces 25 m long (it follows the plan line's curve), open at the water gate
      const G0 = ROAD.gate - ROAD.gateHalf, G1 = ROAD.gate + ROAD.gateHalf;
      const yTf = ROAD.yT + ROAD.sink;   // (FOOTING: every face's top stands ROAD.sink m over the walk's floor)
      for (let a = ROAD.t0; a < G0 - 1e-6; a += 25) { const b = Math.min(a + 25, G0); quad(a, b, -3, yTf, ROAD.out, 0, (a === ROAD.t0 ? 1 : 0) + (b === G0 ? 2 : 0), -10, b === G0 ? ROAD.gateSpring : 1e3); }
      for (let a = G1; a < ROAD.b0 - 1e-6; a += 25) quad(a, Math.min(a + 25, ROAD.b0), -3, yTf, ROAD.out, 0, a === G1 ? 1 : 0, -10, ROAD.gateSpring);
      // THE FIRST WALL IS NOT A BLANK (ROUND 13b, S6; a rule of the terrace, the same on every seed): its face is VERT
      // MASONED ARGENT in the walls' own manner (the shader: courses and blocks as the wall's), without plates; A BUTTRESS
      // stands before it every 43 to 48 m (ROAD.but: [its breadth, metres before the face, metres its head stands under
      // the wall's top]: set out evenly along each of its two stretches, to either side of the water gate), filleted
      // argent down both sides and along its head; and ITS CREST IS EMBATTLED: on the far kerb, behind the lion's plane,
      // merlons ROAD.merlon[0] m long and ROAD.merlon[1] m high, a merlon and a crenel by turns (in the bay of the
      // lion's stand they stand on the bay's kerb).
      tag = 'road buttress';
      for (const [sa, sb] of [[ROAD.t0, G0], [G1, ROAD.b0]]) {
        const n = Math.max(1, Math.round((sb - sa) / 45)), w = (sb - sa) / n;
        for (let i = 0; i < n; i++) { const c = sa + (i + 0.5) * w; quad(c - ROAD.but[0] / 2, c + ROAD.but[0] / 2, -3, yTf - ROAD.but[2], ROAD.out + ROAD.but[1], 0, 3); }
      }
      tag = 'road merlon';
      for (let a = ROAD.t0 + ROAD.merlon[0] / 2; a + ROAD.merlon[0] < ROAD.b0; a += 2 * ROAD.merlon[0]) {
        const b = a + ROAD.merlon[0], B0 = ROAD.stand - ROAD.bay[0], B1 = ROAD.stand + ROAD.bay[1], inBay = a >= B0 && b <= B1;
        if (!inBay && b > B0 && a < B1) continue;
        quad(a, b, ROAD.yT + ROAD.kerb, ROAD.yT + ROAD.kerb + ROAD.merlon[1], ROAD.kerbOut - (inBay ? ROAD.bay[2] : 0), 10, 3, ROAD.yT + ROAD.kerb - 1);
      }
      // AN ARCH: over it the spandrel in sixteen pieces up to the road's top (a pier, or the bank, to either side of it)
      tag = 'road face';
      const arch = (c, r, sp, kind) => { for (let i = 0; i < 16; i++) {
        const xa = -r * Math.cos(Math.PI * i / 16), xb = -r * Math.cos(Math.PI * (i + 1) / 16);
        piece(c + xa, c + xb, sp + r * Math.sin(Math.PI * i / 16), sp + r * Math.sin(Math.PI * (i + 1) / 16), yTf, yTf, ROAD.out, kind, 0, -10, 1e3, 1);
      } };
      for (const sg of [-1, 1]) arch(ROAD.gate + sg * (ROAD.gateR + ROAD.gatePier / 2), ROAD.gateR, ROAD.gateSpring, 0);
      quad(ROAD.gate - ROAD.gatePier / 2, ROAD.gate + ROAD.gatePier / 2, -3, yTf, ROAD.out, 0, 0);
      // THE BRIDGE: a pier's half to either side of every arch
      for (let k = 0; k < ROAD.arches; k++) {
        const a0 = ROAD.b0 + k * ARCH, c = a0 + ARCH / 2;
        quad(a0, c - ARCH_R, -3, yTf, ROAD.out, 2, 2, -10, ROAD.spring); quad(c + ARCH_R, a0 + ARCH, -3, yTf, ROAD.out, 2, 1, -10, ROAD.spring);
        arch(c, ARCH_R, ROAD.spring, 2);
      }
      // THE WALL: W_N pieces, merlon and crenel by turns, a merlon first and last; behind the lion's plane the wall-walk's
      // band (through a crenel the walk is seen solid under the paws) and, behind that, a tower at either end
      // (ROUND 13, FOOTING: its near face ends in a plain edge WALL.walk m over the walk; ITS BATTLEMENTS STAND ON THE
      // WALK'S FAR KERB, behind the lion's plane: W_N pieces, merlon and crenel by turns, a merlon first and last)
      for (let a = ROAD.b1; a < ROAD.w1 - 1e-6; a += 27) { const b = Math.min(a + 27, ROAD.w1); quad(a, b, -3, WALL.top, WALL.out, 1, (a === ROAD.b1 ? 1 : 0) + (b === ROAD.w1 ? 2 : 0), a === ROAD.b1 ? yTf : ROAD.yW - ROAD.riser + ROAD.sink); }
      tag = 'road merlon';
      for (let i = 0; i < W_N; i += 2) quad(ROAD.b1 + i * W_SEG, ROAD.b1 + (i + 1) * W_SEG, ROAD.yW + ROAD.kerb, ROAD.yW + ROAD.kerb + WALL.cren, ROAD.kerbOut, 1, 3, ROAD.yW + ROAD.kerb - 1);
      tag = 'road tower or post';
      for (const c of [WALL.t1, WALL.t2]) {
        quad(c - WALL.half, c + WALL.half, -3, T_TOP - WALL.tcren, -WALL.tback, 1, 3, -10, 1e3, c);
        for (let i = 0; i < T_N; i += 2) quad(c - WALL.half + i * T_SEG, c - WALL.half + (i + 1) * T_SEG, T_TOP - WALL.tcren, T_TOP, -WALL.tback, 1, 3, T_TOP - WALL.tcren - 3, 1e3, c);
      }
      // (THE ROLL'S PENNON STAFFS: plain argent, upright before the face, their heads under its top)
      tag = 'roll staff';
      for (const c of ROLL.pens) quad(c - ROLL.staff[3] / 2, c + ROLL.staff[3] / 2, ROLL.top(c) - ROLL.staff[2] - ROLL.staff[1], ROLL.top(c) - ROLL.staff[2], ROAD.out + ROLL.staff[0], 7, 0);
      // THE STEPS: three degrees, each a level piece (cut in three along the curve); its riser is the free side toward the wall of the degree above
      tag = 'road face';
      for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) quad(ROAD.w1 + (k + j / 3) * ROAD.deg, ROAD.w1 + (k + (j + 1) / 3) * ROAD.deg, -3, ROAD.yW - (k + 1) * ROAD.riser + ROAD.sink, ROAD.out, 8, j === 2 && k < 2 ? 2 : 0, ROAD.yW - (k + 2) * ROAD.riser + ROAD.sink);
      // THE MOUNT: level with the last degree, its far end a quarter round down to the ground
      for (let a = ROAD.m0; a < ROAD.m1 - ROAD.round - 1e-6; a += 27) quad(a, Math.min(a + 27, ROAD.m1 - ROAD.round), -3, ROAD.yM + ROAD.sink, ROAD.out, 8, 0);
      for (let i = 0; i < 12; i++) { const a = ROAD.m1 - ROAD.round + ROAD.round * Math.sin(Math.PI / 2 * i / 12), b = ROAD.m1 - ROAD.round + ROAD.round * Math.sin(Math.PI / 2 * (i + 1) / 12); piece(a, b, -3, -3, mountTop(a) + ROAD.sink, i < 11 ? mountTop(b) + ROAD.sink : 0, ROAD.out, 8); }
      // (T5c: the degrees and the mount are buttressed and embattled as the first wall is: a buttress every 45 m from the
      // red wall's end to the round end's beginning, merlons on the far kerb, a merlon and a crenel by turns)
      { const sa = ROAD.w1, sb = ROAD.m1 - ROAD.round, n = Math.max(1, Math.round((sb - sa) / 45)), w = (sb - sa) / n;
        tag = 'road buttress';
        for (let i = 0; i < n; i++) { const c = sa + (i + 0.5) * w; quad(c - ROAD.but[0] / 2, c + ROAD.but[0] / 2, -3, ROAD.yM + ROAD.sink - ROAD.but[2], ROAD.out + ROAD.but[1], 8, 3); }
        tag = 'road merlon';
        for (let a = sa + ROAD.merlon[0] / 2; a + ROAD.merlon[0] < sb; a += 2 * ROAD.merlon[0]) quad(a, a + ROAD.merlon[0], ROAD.yM + ROAD.kerb, ROAD.yM + ROAD.kerb + ROAD.merlon[1], ROAD.kerbOut, 18, 3, ROAD.yM + ROAD.kerb - 1); }
      // A POST AT EVERY OTHER JOINT (terrace and bridge; degree and degree; the last degree and the mount): a plain pier
      // 12 m broad behind the lion's plane, 16 m higher than the higher of the two tops it joins, of the thing it ends
      tag = 'road tower or post';
      for (const [c, y, kind] of [[ROAD.b0, ROAD.yT + 16, 2], [ROAD.w1 + ROAD.deg, ROAD.yW - ROAD.riser + 16, 8], [ROAD.w1 + 2 * ROAD.deg, ROAD.yW - 2 * ROAD.riser + 16, 8], [ROAD.m0, ROAD.yM + 16, 8]]) quad(c - 6, c + 6, -3, y, -WALL.tback, kind, 3);
      // THE WALK'S FAR KERB (ROUND 13, FOOTING; a rule of the whole road, the same on every seed): behind the lion's plane,
      // along the whole road, a plain band of the thing's own tincture ROAD.kerb m high over the walk's floor, a fine
      // argent line along its top (kinds 10 and over: the thing's kind + 10). The paws stand IN the walk: their lowest
      // ROAD.sink m behind the face's own top edge, their backs against the far kerb; never on a single line.
      {
        const K = ROAD.kerb, ko = ROAD.kerbOut, under = 1.5; tag = 'road kerb';
        const run = (s0, s1, y, kind, f0, f1, sLo) => { for (let a = s0; a < s1 - 1e-6; a += 25) { const b = Math.min(a + 25, s1); quad(a, b, y - under, y + K, ko, kind, (a === s0 ? f0 : 0) + (b === s1 ? f1 : 0), sLo); } };
        // (THE LION'S STAND ON THE TERRACE, ROAD.stand, where it stands TURNED at the entry: from ROAD.bay[0] m short of
        // it to ROAD.bay[1] m past it the far kerb stands ROAD.bay[2] m further back, a bay of the walk, so that the turned
        // figure's hind paws stand in the walk before the kerb; the bay's kerb runs on ROAD.bay[3] m behind the kerb's
        // own ends to either side, so that no sight line from our way passes between them)
        run(ROAD.t0, ROAD.stand - ROAD.bay[0], ROAD.yT, 10, 1, 0, -10); run(ROAD.stand + ROAD.bay[1], ROAD.b0, ROAD.yT, 10, 0, 0, -10); run(ROAD.b0, ROAD.b1, ROAD.yT, 12, 0, 0, -10);
        for (let a = ROAD.stand - ROAD.bay[0] - ROAD.bay[3]; a < ROAD.stand + ROAD.bay[1] + ROAD.bay[3] - 1e-6; a += 27) quad(a, Math.min(a + 27, ROAD.stand + ROAD.bay[1] + ROAD.bay[3]), ROAD.yT - under, ROAD.yT + K, ko - ROAD.bay[2], 10, 0, -10);
        run(ROAD.b1, ROAD.w1, ROAD.yW, 11, 1, 2, ROAD.yT + K);
        for (let k = 0; k < 3; k++) run(ROAD.w1 + k * ROAD.deg, ROAD.w1 + (k + 1) * ROAD.deg, ROAD.yW - (k + 1) * ROAD.riser, 18, 0, k < 2 ? 2 : 0, ROAD.yW - (k + 2) * ROAD.riser + K);
        run(ROAD.m0, ROAD.m1 - ROAD.round, ROAD.yM, 13, 0, 0, -10);
        for (let i = 0; i < 12; i++) { const a = ROAD.m1 - ROAD.round + ROAD.round * Math.sin(Math.PI / 2 * i / 12), b = ROAD.m1 - ROAD.round + ROAD.round * Math.sin(Math.PI / 2 * (i + 1) / 12);
          piece(a, b, Math.max(-3, mountTop(a) - under), Math.max(-3, mountTop(b) - under), mountTop(a) + K, mountTop(b) + K, ko, 13); }
        // THE MOUNT'S BASE (it meets the ground): two plain courses along its foot, each standing a little before the
        // face and running on past the round end, [height, metres past the end, metres before the face], filleted
        tag = 'road face';
        for (const [hB, past, fore] of ROAD.base) for (let a = ROAD.m0; a < ROAD.m1 + past - 1e-6; a += 25) { const b = Math.min(a + 25, ROAD.m1 + past); quad(a, b, -3, hB, ROAD.out + fore, 3, (a === ROAD.m0 ? 1 : 0) + (b === ROAD.m1 + past ? 2 : 0)); }
      }
      // THE GATE ACROSS THE WAY ON LINE C (round 12; a rule of the place, the same on every seed: THE DIVIDING LINE MADE A
      // THING). It stands on line C astride the way, square to it, our line through the middle of its open arch; a curtain
      // embattled over the arch, a tower to either hand under a pointed roof, each with two loops, and from each tower a
      // low embattled wing along the line. GULES MASONED ARGENT, in the wall's own manner (where the lists' own colour is
      // gules, of the bridge's colour: a colour never stands on its own ground); the roofs sable filleted argent.
      // It closes the camp's street; beyond it the lists open and the grounds change (line C's fillet runs under it).
      // (Its own arc: metres across its face from the arch's middle, positive to the ridge's hand.)
      // ROUND 14 (T3; a rule of the place, the same on every seed): THE OPENING IS WIDE AND ITS INSIDE IS WORKED. The
      // gate is a PORTAL GATE.deep m deep: its front arch GATE.R m to either hand of the flown line (it was 10), its back
      // arch GATE.Rb m, both round and springing GATE.spring m up: the crown 25 m up before and 22.5 m behind (15.5 m
      // over the line); between them each INNER FACE stands splayed, turned toward the oncomer, 12.5 to 15 m from the
      // line, and carries ONE GREAT SHIELD of the roll (see THE ROLL OF ARMS); the arch's RING OF STONES alternates
      // argent and the gate's colour, seventeen stones through the whole depth of the arch and GATE.ring m of the front
      // face round it, and down the jambs quoins GATE.quoin m high by turns; a PORTCULLIS is drawn up in the back arch,
      // seven bars GATE.bars m apart and two cross bars, its points GATE.port m up (3.9 m under the crown, 11.6 m over
      // the line). The stones of the gatehouse are a sixth of the wall's (1.5 m courses).
      // The towers keep their outer edges, their height, loops and roofs: each is 10.5 m broad (it was 14).
      {
        const q = beside(H_C, 0, [0, 0, 0, 1]), ax = q[3], az = -q[2], fx = -q[2], fz = -q[3];
        place = (sv, out, o) => { o[0] = q[0] + ax * sv + fx * out; o[1] = q[1] + az * sv + fz * out; return o; };
        const B = GATE.half, E = B + GATE.tur, R = GATE.R, Rb = GATE.Rb, DP = GATE.deep, SP = GATE.spring, NM = 9, NV = 17;
        // a piece set anywhere in the gate's own space: four corners [across, before the face, y, the masoning's x, its top y, its foot y]
        const put3 = (P, kind) => { const base = pos.length / 3; tags.push(tag);
          for (const [sv, out, y, wx, yt, yb] of P) { place(sv, out, _pl); pos.push(_pl[0], y, _pl[1]); aW.push(wx, y, yt, yb); aE.push(1e3, 1e3, -10, 1e3); aK.push(kind, 0, 0, 0); }
          idx.push(base, base + 1, base + 2, base, base + 2, base + 3); };
        // the front face: the jambs and the spandrel over the arch (rim 1: the ring of stones is painted round the arch)
        // (each jamb runs on 1.5 m behind its tower's front, which stands 0.4 m before the face: no chink between the two from any place before the gate)
        tag = 'gate front (jambs, spandrel, battlements)';
        piece(-B - 1.5, -R, -3, -3, GATE.top, GATE.top, 0, 5, 0, -10, 1e3, 1); piece(R, B + 1.5, -3, -3, GATE.top, GATE.top, 0, 5, 0, -10, 1e3, 1);
        for (let i = 0; i < NV; i++) { const xa = -R * Math.cos(Math.PI * i / NV), xb = -R * Math.cos(Math.PI * (i + 1) / NV); piece(xa, xb, SP + R * Math.sin(Math.PI * i / NV), SP + R * Math.sin(Math.PI * (i + 1) / NV), GATE.top, GATE.top, 0, 5, 0, -10, 1e3, 1); }   // (the same seventeen chords as the soffit's stones: no chink between them)
        for (let i = 0; i < NM; i++) quad(-B + i * 2 * B / NM + (i ? 0.9 : 0), -B + (i + 1) * 2 * B / NM - (i < NM - 1 ? 0.9 : 0), GATE.top, GATE.top + GATE.cren, 0, 5, 3, GATE.top - 1);
        // the inner faces: splayed from the front arch's jamb to the back arch's, masoned, an impost line at the spring
        const SL = Math.hypot(R - Rb, DP); tag = 'gate inner face';
        for (const sg of [-1, 1]) put3([[sg * R, 0, -3, 200, SP, -3], [sg * Rb, -DP, -3, 200 + SL, SP, -3], [sg * Rb, -DP, SP, 200 + SL, SP, -3], [sg * R, 0, SP, 200, SP, -3]], 5);
        // the arch's own depth: seventeen stones from the front arch to the back, argent and the gate's colour by turns
        tag = 'gate soffit (the arch\'s stones)';
        for (let i = 0; i < NV; i++) { const a0 = Math.PI * i / NV, a1 = Math.PI * (i + 1) / NV;
          put3([[-R * Math.cos(a0), 0, SP + R * Math.sin(a0), 0, 1e3, -3], [-R * Math.cos(a1), 0, SP + R * Math.sin(a1), 0, 1e3, -3], [-Rb * Math.cos(a1), -DP, SP + Rb * Math.sin(a1), 0, 1e3, -3], [-Rb * Math.cos(a0), -DP, SP + Rb * Math.sin(a0), 0, 1e3, -3]], i % 2 ? 9 : 7); }
        loopY = GATE.tTop - 11;
        for (const sg of [-1, 1]) {
          const t0 = sg < 0 ? -E : B, t1 = t0 + GATE.tur, tc = (t0 + t1) / 2;
          tag = 'gate tower'; quad(t0, t1, -3, GATE.tTop, 0.4, 5, 3, -10, 1e3, tc); tag = 'gate roof';
          quad(t0 - 0.8, t1 + 0.8, GATE.tTop, GATE.tTop + GATE.band, 0.5, 7, 0);
          piece(t0 - 1.6, tc, GATE.tTop + GATE.band, GATE.tTop + GATE.band, GATE.tTop + GATE.band, GATE.tTop + GATE.band + GATE.roof, 0.5, 6, 0);
          piece(tc, t1 + 1.6, GATE.tTop + GATE.band, GATE.tTop + GATE.band, GATE.tTop + GATE.band + GATE.roof, GATE.tTop + GATE.band, 0.5, 6, 0);
          // the wing: a low wall along the line from the tower outward, embattled (merlon and crenel by turns)
          const w0 = sg < 0 ? -E - GATE.wing : E, WN = 9, ws = GATE.wing / WN; tag = 'gate wing';
          quad(w0, w0 + GATE.wing, -3, GATE.wTop, -0.4, 5, sg < 0 ? 1 : 2);
          for (let i = 0; i < WN; i += 2) quad(w0 + i * ws, w0 + (i + 1) * ws, GATE.wTop, GATE.wTop + GATE.cren, -0.4, 5, 3, GATE.wTop - 1);
        }
        loopY = 1;
        // the portcullis, drawn up in the back arch: seven bars pointed below and two cross bars
        tag = 'gate portcullis';
        const PO = -DP + 0.3, yArch = (x) => SP + Math.sqrt(Math.max(0, Rb * Rb - x * x));
        for (let k = -3; k <= 3; k++) { const x = k * GATE.bars;
          quad(x - 0.4, x + 0.4, GATE.port + 0.9, yArch(x), PO, 7, 0); piece(x - 0.4, x, GATE.port + 0.9, GATE.port, GATE.port + 0.9, GATE.port + 0.9, PO, 7, 0); piece(x, x + 0.4, GATE.port, GATE.port + 0.9, GATE.port + 0.9, GATE.port + 0.9, PO, 7, 0); }
        for (const [y0, y1] of [[GATE.port + 1.0, GATE.port + 1.6], [GATE.port + 2.8, GATE.port + 3.3]]) { const hw = Math.sqrt(Math.max(0, Rb * Rb - (y1 - SP) * (y1 - SP))) - 0.2; quad(-hw, hw, y0, y1, PO, 7, 0); }
        place = onCrest;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 4));
      g.setAttribute('aE', new THREE.Float32BufferAttribute(aE, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 4)); g.setIndex(idx);
      const roadMat = new THREE.ShaderMaterial({
        uniforms: { uGules: { value: T.gules }, uArg: { value: T.argent }, uVert: { value: T.vert }, uBridge: { value: T[BRIDGE_C] }, uSable: { value: T.sable }, uAzure: { value: T.azure }, uGateC: { value: T[GATE_C] }, uLoop: { value: T_TOP - WALL.tcren - 16 },
          uArch: { value: new THREE.Vector4(ROAD.b0, ARCH, ARCH_R, ROAD.spring) }, uGate: { value: new THREE.Vector4(ROAD.gate, ROAD.gateR, ROAD.gateSpring, ROAD.gateR + ROAD.gatePier / 2) }, uGH: { value: new THREE.Vector2(GATE.R, GATE.spring) }, uRing: { value: new THREE.Vector3(GATE.ring, GATE.quoin, 17) } },
        vertexShader: /* glsl */`
          attribute vec4 aW; attribute vec4 aE; attribute vec4 aK; varying vec4 vW; varying vec4 vE; varying vec4 vK;
          void main() { vW = aW; vE = aE; vK = aK; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec4 vW; varying vec4 vE; varying vec4 vK; uniform vec3 uGules, uArg, uVert, uBridge, uSable, uAzure, uGateC; uniform float uLoop; uniform vec4 uArch; uniform vec4 uGate; uniform vec2 uGH; uniform vec3 uRing;
          const float COURSE = 9., BLOCK = 22., FIL = 2.6;
          void main() {
            float fy = max(fwidth(vW.y), 1e-4), fx = max(fwidth(vW.x), 1e-4), kind = vK.x > 9.5 ? vK.x - 10. : vK.x, below = vW.z - vW.y;
            bool kerb = vK.x > 9.5;   // (the walk's far kerb: the thing's own tincture, plain, a fine line along its top)
            bool bank = kind < 0.5 || (kind > 2.5 && kind < 3.5), bridge = kind > 1.5 && kind < 2.5;
            bool gh = kind > 4.5 && kind < 5.5, roof = kind > 5.5 && kind < 6.5, plainA = kind > 6.5 && kind < 7.5, steps = kind > 7.5 && kind < 8.5, plainG = kind > 8.5;   // (plainG: a stone of the gate's own colour, plain: the arch's ring)
            vec3 col = (bank || steps) ? uVert : bridge ? uBridge : roof ? uSable : plainA ? uArg : (gh || plainG) ? uGateC : uGules;
            // MASONED: plain courses COURSE m high, blocks BLOCK m long, every other course set half a block on; a joint is
            // 0.9 m broad and never under a pixel and a half; where a course is under 4 pixels the joints go (no shimmer)
            float CO = gh ? COURSE / 6. : COURSE, BL = gh ? BLOCK / 6. : BLOCK, JW = gh ? 0.1 : 0.45;   // (the gatehouse: stones a sixth of the wall's)
            float cy = vW.y / CO, row = floor(cy + 0.5), dC = abs(cy - row) * CO;
            float cr = floor(cy), xs = (vW.x + 0.5 * BL * mod(cr, 2.)) / BL, dJ = abs(xs - floor(xs + 0.5)) * BL;
            float hy = max(JW, 0.75 * fy), hx = max(JW, 0.75 * fx);
            float joint = max(1. - smoothstep(hy - 0.5 * fy, hy + 0.5 * fy, dC), 1. - smoothstep(hx - 0.5 * fx, hx + 0.5 * fx, dJ));
            joint *= (1. - smoothstep(CO / 5., CO / 2.5, fy)) * ((kind > 2.5 && kind < 3.5) || roof || plainA || plainG || kerb ? 0. : 1.);   // (the mount, the roofs, the bands and the kerbs are plain; the terrace is masoned as the walls are)
            // THE BRIDGE'S PARAPET: a plain band 7 m deep under its top line, one drawn line at its foot
            if (bridge && !kerb) joint = max(joint * step(7.6, below), 1. - smoothstep(hy - 0.5 * fy, hy + 0.5 * fy, abs(below - 7.)));
            // THE FILLET, argent: along the top of every piece, down every free side, and round every arch
            float FILK = gh || roof ? 0.9 : kerb ? 1.6 : FIL;   // (the gate is a third of the wall's size: its fillets are finer)
            float fil = (kind > 3.5 && kind < 4.5) || plainA || plainG ? 0. : 1. - smoothstep(FILK - 0.5 * fy, FILK + 0.5 * fy, below);
            float side = (1. - smoothstep(0.8 * FILK - 0.5 * fx, 0.8 * FILK + 0.5 * fx, min(vE.x, vE.y))) * step(vE.z, vW.y) * step(vW.y, vE.w);
            float ax = bridge ? mod(vW.x - uArch.x, uArch.y) - 0.5 * uArch.y : gh ? vW.x : abs(vW.x - uGate.x) - uGate.w, fa = max(fx, fy);
            float aR = bridge ? uArch.z : gh ? uGH.x : uGate.y, aS = bridge ? uArch.w : gh ? uGH.y : uGate.z;
            float rr = length(vec2(ax, max(vW.y - aS, 0.))) - aR;
            float rim = gh ? 0. : vK.y * (1. - smoothstep(0.8 * FILK - 0.5 * fa, 0.8 * FILK + 0.5 * fa, rr));
            // THE GATE'S RING OF STONES (round 14): round the front arch a band uRing.x m broad, argent and the gate's colour
            // by turns: uRing.z stones over the arch (the keystone and the two springers argent), quoins uRing.y m high down the jambs
            float ringW = gh ? vK.y * (1. - smoothstep(uRing.x - 0.5 * fa, uRing.x + 0.5 * fa, rr)) : 0.;
            float sR = vW.y > aS ? atan(vW.y - aS, ax) / 3.14159265 * uRing.z : (vW.y - aS) / uRing.y;
            float fR = fract(0.5 * sR), dR = fR < 0.5 ? min(fR, 0.5 - fR) : -min(fR - 0.5, 1. - fR);
            float parR = clamp(dR / max(0.5 * fwidth(sR), 1e-5) + 0.5, 0., 1.);
            // A TOWER'S TWO LOOPS, argent, round-headed: 9 m to either hand of its middle, 5 m broad and 13.5 m tall
            float lk = vK.w > 1.5 ? 0.3 : 1.;   // (a turret of the gatehouse: its loops at their own height, three tenths the size)
            vec2 q = vec2(abs(abs(vK.z) - 9. * lk), vW.y - (vK.w > 1.5 ? vK.w : uLoop));
            float dL = q.y > 11. * lk ? length(vec2(q.x, q.y - 11. * lk)) - 2.5 * lk : max(q.x - 2.5 * lk, -q.y);
            float loop = step(0.5, vK.w) * (1. - smoothstep(-0.5 * fy, 0.5 * fy, dL));
            vec3 outc = mix(col, uArg, clamp(max(max(max(joint, loop), max(fil, side)), rim), 0., 1.));
            gl_FragColor = vec4(mix(outc, mix(uGateC, uArg, parR), ringW), 1.);
          }`,
        side: THREE.DoubleSide,
      });
      const road = new THREE.Mesh(g, roadMat); road.name = 'road'; road.frustumCulled = false;
      scene.add(road); disposables.push(g, roadMat);
      // its clear air as built: EVERY QUAD OF THE SHEET, the road's and the gate's, on its own four corners and all between
      // them, under its kind (a sheet has no thickness: nothing is taken off)
      // (first a corner of every quad, so that each kind's least is near its true one before the patches are gone over)
      for (let q = 0; q < tags.length; q++) noteClear(tags[q], clearOf(pos[q * 12], pos[q * 12 + 1], pos[q * 12 + 2]));
      await ctx.yield();
      for (let q = 0, n = 0; q < tags.length; q++) { n += measureQuad(tags[q], pos, q * 12); if (n > 600) { n = 0; await ctx.yield(); } }
    }
    await ctx.yield();

    // ---- THE LION (the hero): walks, halts, roars and runs its road from station to station and rears on the mount. Its
    // place is the part's law: an arc along the road named by our place on the route (LION_KNOTS below).
    const H_A = H_ARC0 + R_ROUTE * Math.atan2(THROUGH[0][1] - HUB[1], THROUGH[0][0] - HUB[0]);   // where the route crosses line A
    // ROUND 13, THE LION HAS ITS OWN WAY ALONG ITS ROAD (the lead's S1; it no longer goes abreast of our flight). ONE TYPED
    // TIMETABLE, LION_WAY: [route metre of OUR way, the place on its road where its hind paws stand (the crest's arc),
    // which way it faces (1 along its road, -1 back along it: toward us as we come), the attitude held]. Between two
    // keys it STANDS (same place, same facing), WHEELS (same place, the facing changed: it rears, turns on its hind paws
    // and comes down) or RUNS (another place: courant, the bounding gallop of the part). It is always standing at a place
    // or running ahead of us to the next; its place is a smooth law of our own place on the way, the same on every seed.
    // ITS FOUR PLACES (each a built thing of its road): LION_E on the terrace, 40 m past the water gate (turned back, it
    // stands astride the gate where the river comes out: the nearest place at which the whole beast stands under the
    // picture's top at the way's first metre); LION_R the bridge's third pier (it stands on the bridge, where it halted
    // in rounds 11 and 12, above the valley and the ship);
    // LION_S the red wall's end, 59 m short of the steps (S8: where it roars over the street, clear of the gate's tower);
    // LION_G, 16 m short of the steps, where its second low way is deepest and its last run begins (seen from the street hard by the gate's tower on the
    // ridge's hand); LION_M the mount by the ring.
    //   0 to 28 m      it STANDS at LION_E TURNED TOWARD THE ENTRY, roaring at us, and TURNED OUT OF ITS ROAD'S LINE by
    //                  LION_TURN degrees about its hind paws' place (its head toward the far side of its walk), so that
    //                  the flat figure shows us three quarters of its breadth and more over our first 30 m;
    //   28 to 56 m     IT WHEELS: rears, turns on its hind paws (the turn itself takes a twelfth of the wheel: a flat
    //                  charge turns as a banner flips) and launches off them along its road;
    //   56 to 76 m     ONE BOUND takes it DOWN THE LOW WAY (ROAD.low, a law of its road: from 8 m past LION_E the lion's
    //                  way leaves the walk and goes down behind the first wall, a straight ramp to LOW.deep m under the
    //                  walk at LION_H, under the bridge's first arch, and up again as straight to the walk 8 m short of
    //                  LION_R): the wall's crest takes it as it goes, moving;
    //   76 to 150 m    IT WAITS IN THE LOW WAY, gathered, drawn as ever, under the wall and the ground: the whole
    //                  first field is the herd's alone;
    //   150 to 168 m   ONE BOUND brings it UP on to the bridge's third pier above the ship: it rises whole over the walk;
    //   to 18 m past line A            it wheels on the pier to face us and roars;
    //   to 48 m short of line B        IT WAITS AT THE RIVER COUCHANT while we come up the whole second field (round 14,
    //                                  T5b): lying along the walk, head up and toward the way, the end of its tail and
    //                                  its tuft moving by the world's clock (couchantW and couchantB, blended);
    //   to 30 m short of line B (BANK) it rises (over 18 m of our way) as we come to the river, whose edge is 5 m on;
    //   to line B                      IT ROARS over the ship: for the 5 m before the river's edge and over its near half;
    //   to 12 m past line B            it wheels as we cross the river on the rise, and
    //   to 90 m short of line C        RUNS AHEAD AGAIN, off the bridge and down the red wall to LION_S (two bounds: its
    //                                  runs go in the whole number of bounds nearest their length over 130 m);
    //   to 79 m short of line C        it wheels at the wall's end to face the street;
    //   to 65 m short of line C        IT ROARS ONCE over the street (S8): whole in the picture, its outline 21 m and
    //                                  more clear of the gate's tower as seen from the way (metres at the gate's face);
    //   to 56 m short of line C        it wheels to go and gathers (never nearer the tower's outline than 6 m);
    //   to 40 m short of line C        IT GOES DOWN THE SECOND LOW WAY (ROAD.low2) behind the red wall, gathered (its
    //                                  down-bound is 43 m long: it lands where it leapt), drawn lower than its way by
    //                                  the low way's share of LOW2.under: the wall's crest takes it as it goes, moving,
    //                                  over 8 m of our way (under half a second), and it is gone a metre and more
    //                                  clear of the tower's outline;
    //   to 72 m past line C            IT WAITS IN THE LOW WAY under LION_G, DRAWN LOW2.under m LOWER YET till the last
    //                                  LOW2.ease m of our way bring it back to its way's level (THE WAITING LION STANDS
    //                                  UNDER THE WALLS' TOPS, below): no lion stands by the gate's tower, and from the
    //                                  gate's approach to its run past none is in the picture;
    //                                  from line C to its launch IT IS DRAWN STANDING BACK from the walls' faces
    //                                  (THE WAITING LION STANDS BACK, below): no part of it before the red wall's
    //                                  face or the fair wall's, none in or before a shield of the roll;
    //   to the foot of the last climb  its way comes up behind us (it is on its walk before the picture has it) and
    //                                  IT COMES PAST US AT A RUN along the fair's wall (the three degrees, level) to its mount, 6 times our pace;
    //   from there it gathers, springs SALIENT (whole 15 m up the climb, held 14 m) and comes upright RAMPANT over the
    //   next 18 m, to the end.
    const LION_E = ROAD.stand, LION_R = ROAD.b0 + 3 * ARCH, LION_G = ROAD.w1 - 16, LION_M = SUMMIT_D;
    const LION_H = ROAD.b0 + 30, LION_TURN = 22, LOW = ROAD.low = { a: LION_E + 8, b: LION_H - 6, c: LION_H + 6, d: LION_R - 8, deep: 224 };
    // (S8: THE STAND ON THE RED WALL, LION_S, 43 m short of LION_G; and THE SECOND LOW WAY, ROAD.low2: from 8 m past that
    // stand the lion's way goes down behind the red wall, LOW2.deep m under the walk (its paws under the ground),
    // lowest about LION_G, and comes up to the walk again 40 m on, on the first degree. In it the figure is DRAWN
    // LOW2.under m lower yet (by the low way's share of it as it goes down; less and less over the last LOW2.ease m
    // of our way before its launch): from its landing until then its head stands under every top of the wall and the
    // degrees. See THE WAITING LION STANDS UNDER THE WALLS' TOPS, below; LOW2.margin is that law's one bare length.
    // LOW2.back, LOW2.ease: how far and how soon the waiting figure stands back from the walls' faces, see THE
    // WAITING LION STANDS BACK, below)
    const LION_S = LION_G - 43, LOW2 = ROAD.low2 = { a: LION_S + 8, b: LION_G - 6, c: LION_G + 6, d: LION_G + 40, deep: 110, ease: 16, back: 0, under: 0, margin: 2 };
    // (the level of the lion's way by its station on its road, metres from the walk: nought everywhere but in the low ways)
    const lowShare = (s, L) => Math.min(1, Math.max(0, Math.min((s - L.a) / (L.b - L.a), (L.d - s) / (L.d - L.c))));
    const lionSunk = (s) => Math.max(lowShare(s, LOW), lowShare(s, LOW2));   // (how far down a low way, 0 to 1)
    // (lionH: the metre of our way the figure is being DRAWN for, -1 while anything else asks of it. lowUnder: how much
    // lower than its way the figure is drawn in the second low way at that metre: THE WAITING LION STANDS UNDER THE
    // WALLS' TOPS, below)
    let lionH = -1;
    const lowUnder = () => (lionH < 0 || lionH >= LOW2.to ? 0 : LOW2.under * (1 - sstep(LOW2.to - LOW2.ease, LOW2.to, lionH)));
    const roadDip = (s) => -Math.max(LOW.deep * lowShare(s, LOW), (LOW2.deep + lowUnder()) * lowShare(s, LOW2));
    // (BANK: a line across the way 30 m SHORT OF LINE B: a length typed from line B, not read from the paint. The
    // river's water lies 25 m to either hand of line B, square to the way, and its wave carries its edge between 21.4
    // and 28.6 m: BANK is 5 m before the river's edge and 1.4 m before the furthest its water ever reaches. The
    // lion's roar and the first herd's track are laid from it.)
    const BANK = H_B - 30;
    const LION_WAY = [[0, LION_E, -1, 'roarUp', LION_TURN], [28, LION_E, -1, 'roarUp', LION_TURN], [56, LION_E, 1, 'launch'],
      [76, LION_H, 1, 'gathered'], [150, LION_H, 1, 'launch'], [168, LION_R, 1, 'gathered'],
      [H_A + 18, LION_R, -1, 'couchant'], [BANK - 18, LION_R, -1, 'couchant'], [BANK, LION_R, -1, 'roar'], [H_B, LION_R, -1, 'roar'], [H_B + 12, LION_R, 1, 'launch'],
      [H_C - 90, LION_S, 1, 'gathered'], [H_C - 79, LION_S, -1, 'roar'], [H_C - 65, LION_S, -1, 'roar'], [H_C - 56, LION_S, 1, 'launch'], [H_C - 40, LION_G, 1, 'gathered'], [H_C + 72, LION_G, 1, 'launch'],
      [H_CLIMB, LION_M, 1, 'gathered'], [H_CLIMB + 5, LION_M, 1, 'gathered'], [H_CLIMB + 15, LION_M, 1, 'salient'], [H_CLIMB + 29, LION_M, 1, 'salient'], [H_CLIMB + 47, LION_M, 1, 'rampant'], [H_END + 60, LION_M, 1, 'rampant']];
    // THE LION STANDS AT THE ROAD'S FACE (round 11): its own plane ROAD.back m behind the crest's plan line (its nearest
    // slab half a metre behind the face, true depth), every planted paw on the road's own top line, roadFloor.
    // THE WAITING LION STANDS BACK (a law of the lion's own way, by its timetable's metres; of the figure AS IT IS
    // DRAWN). While it waits in the second low way its hind paws keep LION_G and the figure gathers and stretches
    // toward its launch: its plane goes through that place along the crest's heading at the figure's ORIGIN, which
    // stands further and further before its hind paws (LOW2.reach m at the launch). The crest bends toward the way
    // there, so that plane lay across the walls' faces, and the stretched figure's fore part stood through the fair
    // wall's face and the red wall's end.
    // THE LAW: from line C (eased in over the next LOW2.ease m of our way) to the metre of its launch, the figure is
    // drawn with its plane LOW2.back m further behind the crest's plan line: AS FAR AS THE CREST'S POINT AT LION_G LIES
    // BEFORE THE LINE LAID ALONG THE CREST'S HEADING THROUGH ITS POINT AT THE LAUNCHING FIGURE'S ORIGIN (read from the
    // road and the figure, below: 2.1 m). So the stretched figure waits where its launch will have it, ROAD.back m
    // behind the crest's line at its origin and further behind it everywhere else along its length: no part of it
    // stands before the red wall's face or the fair wall's, none in or before a shield that hangs there. Before line
    // C and from its launch on it is drawn ROAD.back m behind the line, as on all its road.
    // (lionH: the metre of our way the figure is being drawn for, set by the world's own update while it places the
    // lion and -1 otherwise: what is asked of the figure as the world is built (the birds' keep off its head, the
    // gaze's ends, its clear air) is asked of its plane ROAD.back m behind the line, as on all its road: up to 2.1 m
    // nearer the way than the waiting figure is drawn. LOW2.ease is a bare length; LOW2.to is the timetable's own
    // metre of the launch from LION_G.)
    LOW2.to = LION_WAY.find((k) => k[1] === LION_G && k[3] === 'launch')[0];
    const walkY = roadFloor, foldBack = () => ROAD.back + LOW2.back * (lionH < LOW2.to ? sstep(H_C, H_C + LOW2.ease, lionH) : 0);
    const hero = await buildHero(ctx, {
      style, palette: NCC_PALETTE, crestY: roadFloor, crestXZ, summit: SUMMIT_D, pitch: STRIDE, side: -1, ridge: false, detail: D.detail,
      way: { keys: LION_WAY, hOf: hOfU, dip: roadDip, stride: 130 }, floorY: walkY, back: foldBack,
      line: (u, out) => path.pointAt(u, out),   // (the flown line's own point at progress u: the lion's drawn flank is the one that point is on)
    });
    // (LOW2.reach and LOW2.back, read from the figure and the road: the origin's arc as the figure launches from LION_G,
    // the crest's point and heading there, and how far the crest's point at LION_G lies before that line, toward the way)
    { const dL = hero.solveAt(uOfM(LOW2.to)).d, g = crestXZ(LION_G, [0, 0]), o = crestXZ(dL, [0, 0]), a = crestXZ(dL - 1, [0, 0]), b = crestXZ(dL + 1, [0, 0]), ex = b[0] - a[0], ez = b[1] - a[1];
      LOW2.reach = dL - LION_G; LOW2.back = (-(g[0] - o[0]) * ez + (g[1] - o[1]) * ex) / (Math.hypot(ex, ez) || 1); }
    // THE WAITING LION STANDS UNDER THE WALLS' TOPS (a law of the lion's own way, by its timetable's metres; of the
    // figure AS IT IS DRAWN). LOW2.deep m under the walk alone, the gathered figure's ears would stand over the top
    // of the faces it waits behind, and its head and mane higher as it stretches toward its launch.
    // THE LAW: in the second low way the figure is drawn LOW2.under m lower than its way lies: SO MUCH THAT, LOWERED BY
    // IT, ITS HIGHEST VERTEX AT ANY METRE OF ITS WAIT (from the timetable's metre of its landing under LION_G to that
    // of its launch: every mesh of it as its joints carry it, ears, mane, the keyline's rim as cut) STANDS LOW2.margin
    // m UNDER THE LOWEST TOP OF THE FACES ALONG ITS LENGTH (read from the figure and the road, below: 25.4 m). It
    // takes the low way's own share of that as it goes down (it lands already under the tops) and keeps the whole of
    // it as it waits, till the last LOW2.ease m of our way before the metre of its launch: over those it gives it
    // back, eased, while it is in nobody's picture (its head comes over the tops again there), and from its launch on
    // it is drawn as its way lies. (LOW2.margin is a bare length; it also takes what the picture broadens the
    // keyline's rim by, far off. What is asked of the figure as the world is built is asked of its way, LOW2.deep m
    // under the walk: lionH is -1 then.)
    await ctx.yield();
    { const k = LION_WAY.findIndex((q) => q[1] === LION_G && q[3] === 'launch'), M = [], sp = [0, 0, 0]; let c = 0;
      hero.object.traverse((o) => { if (o.isMesh && o.geometry.attributes.aPart) M.push(o.geometry.attributes); });
      const n = M.reduce((a, g) => a + g.position.count, 0), VP = new Float32Array(2 * n), VJ = new Int32Array(n);
      for (const g of M) for (let i = 0; i < g.position.count; i++, c++) { VP[2 * c] = g.position.getX(i); VP[2 * c + 1] = g.position.getY(i); VJ[c] = 4 * Math.floor(g.aPart.getX(i) + 0.5); }
      for (let h = LION_WAY[k - 1][0]; ; h = Math.min(h + 1, LOW2.to)) {
        const sol = hero.solveAt(uOfM(h)); jointSpan(VP, VJ, sol.T, sp); let face = Infinity;
        for (let x = sp[1]; x < sp[2] + 4; x += 4) face = Math.min(face, ROLL.top(sol.d + Math.min(x, sp[2])));
        LOW2.under = Math.max(LOW2.under, sp[0] + sol.dy - (face - LOW2.margin));
        if (h >= LOW2.to) break;
      } }
    scene.add(hero.object);
    {
      // the lion's clear air as built: the figure is a slab standing in its own upright plane, so at every place it takes
      // (every 1/1200 of the flight: THE RUNNING LION COUNTED ALONG ITS WHOLE ROAD, and every turn of its wheels) its
      // outline is measured where it stands: every 15 m along its plane from 180 m behind its origin (the streaming
      // tail) to 110 m before it, at four heights from its paws to 190 m over them (no attitude reaches further),
      // against the whole flown line, less 3 m for the slab's thickness and its keyline; and the same outline in plan
      // against the lens's own place at that moment
      const lp = new THREE.Vector3();
      for (let i = 0; i <= 1200; i++) {
        const sol = hero.solveAt(i / 1200), y0 = roadFloor(Number.isNaN(sol.piv) ? sol.d : sol.piv) + sol.dy; path.pointAt(i / 1200, lp);
        for (let o = -180; o <= 110; o += 15) {
          const x = sol.ox + o * sol.hx, z = sol.oz + o * sol.hz;
          for (const y of [0, 60, 125, 190]) noteClear('lion', clearOf(x, y0 + y, z) - 3);
          noteClear('lion from the lens', Math.hypot(x - lp.x, z - lp.z) - 3);
        }
        if (i % 10 === 9) await ctx.yield();
      }
    }
    await ctx.yield();
    // ---- THE PARTICLES' HELPERS. NO TAIL IS BUILT (the fur is the floor's own painted spots alone, see the ground):
    // what stands here cuts the rare deal's falling drops, the gouttes, and nothing else (see THE RARE EVENT for where
    // their columns stand). A drop falls FALL_V m a second down its own column from the height fallOf gives (below the
    // flown line's own height abeam of the column, and never above 14 m: the drops fall under our flight), stands a
    // second and sinks in. In the shader it takes the kit's near law for particles (nothing inside 0.6 m of the eye,
    // whole from 2.5 m, by true distance) and turns its card to the lens about its own upright.
    const FALL_V = 6, TAIL_LEN = 2.9;
    const _fp = new THREE.Vector3();
    const fallOf = (x, z) => {                                     // the height a column's fall begins at
      const nr = path.nearestXZ(x, z); path.pointAt(nr.u, _fp);
      return Math.max(0.5, Math.min(14, _fp.y - 1.5) - TAIL_LEN);
    };
    // (key: the particle's KEYLINE, the outline set out behind it by 0.12 m and held to a pixel and a half: where the
    // charge is a colour the line is the fur's own metal, where it is a metal the line is sable, so that on its own
    // ground the line is not seen and across another charge of its tincture, a sable bird or a stag, it parts the two)
    const partMat = (metalName, colourName, key) => new THREE.ShaderMaterial({
      uniforms: {
        uTime: style.uniforms.uTime, uSun: style.uniforms.uSun, uPx: style.uniforms.uPx, uKeyMetal: { value: T[furMetal] }, uSable: { value: T.sable },
        uFlat: { value: T[colourName] }, uLeaf: { value: T[metalName] }, uDeep: { value: tones[metalName + 'Deep'] }, uCore: { value: tones[metalName + 'Core'] },
        uFall: { value: new THREE.Vector2(FALL_V, TAIL_LEN + 0.1) },   // (metres a second down the column; the tail's length and a tenth)
      },
      vertexShader: /* glsl */`
        attribute vec4 aCol;            // x, z of the column, phase 0..1, 1 metal or 0 colour
        attribute float aFall;          // the height its fall begins at
        ${key ? 'attribute vec2 aOut; uniform float uPx;' : ''}
        uniform float uTime; uniform vec2 uFall;
        varying float vMetal; varying vec3 vW;
        void main() {
          float tf = aFall / uFall.x, per = tf + 1.6;
          float tau = mod(uTime + aCol.z * per, per);
          float y = tau < tf ? aFall - uFall.x * tau : -max(tau - tf - 1., 0.) / 0.6 * uFall.y;
          vec3 base = vec3(aCol.x, y, aCol.y);
          vec3 eye = cameraPosition;
          float near = smoothstep(0.6, 2.5, distance(eye, base + vec3(0., 1.4, 0.)));   // the kit's near law for particles
          vec3 right = vec3(viewMatrix[0][0], 0., viewMatrix[2][0]);                 // a card faces the lens about its own upright
          right = right / max(length(right), 1e-4);
          vec2 pp = position.xy${key ? ' + aOut * max(0.12, 1.5 * uPx * distance(eye, base))' : ''};
          vec3 wp = base + (right * pp.x + vec3(0., pp.y, 0.)) * near;
          vMetal = aCol.w; vW = wp;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uFlat, uLeaf, uDeep, uCore, uSun, uKeyMetal, uSable;
        varying float vMetal; varying vec3 vW;
        void main() {
          ${key ? 'gl_FragColor = vec4(mix(uKeyMetal, uSable, step(0.5, vMetal)), 1.); return;' : ''}
          vec3 v = cameraPosition - vW; v = v / max(length(v), 1e-4);
          vec3 hv = uSun + v; hv = hv / max(length(hv), 1e-4);
          float d = max(dot(v, hv), 0.);
          vec3 m = mix(uDeep, uLeaf, smoothstep(0.5, 0.86, d));
          float p = d * d; p *= p; p *= p; p *= p;
          m = mix(m, uCore, clamp(p * p, 0., 1.));
          gl_FragColor = vec4(mix(uFlat, m, step(0.5, vMetal)), 1.);
        }`,
      side: THREE.DoubleSide, polygonOffset: !!key, polygonOffsetFactor: key ? 1 : 0, polygonOffsetUnits: key ? 2 : 0,
    });
    const shapeGeo = (pts2) => {
      const tri = THREE.ShapeUtils.triangulateShape(pts2.map((q) => new THREE.Vector2(q[0], q[1])), []);
      const g = new THREE.BufferGeometry(), pos = [];
      for (const q of pts2) pos.push(q[0], q[1], 0);
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(tri.flat());
      // each corner's way out of the shape (the mean of its two edges' normals), for the keyline's outset copy
      const n = pts2.length, out = []; let area = 0;
      for (let i = 0; i < n; i++) { const a = pts2[i], b = pts2[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
      for (let i = 0; i < n; i++) {
        const a = pts2[(i + n - 1) % n], b = pts2[i], c = pts2[(i + 1) % n], sg = area > 0 ? 1 : -1;
        let nx = sg * ((b[1] - a[1]) + (c[1] - b[1])), ny = -sg * ((b[0] - a[0]) + (c[0] - b[0])); const l = Math.hypot(nx, ny) || 1;
        out.push(nx / l, ny / l);
      }
      g.setAttribute('aOut', new THREE.Float32BufferAttribute(out, 2));
      return g;
    };
    // (the tails' own fork of the deal is still taken, though no tail is built: IT ONLY HOLDS THE DEAL, so that every
    // other draw stands as it stood)
    rng_fork(ctx.rng, 'tails');
    const mkParticles = (geo, attr, fall, n, mat, name) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; g.setAttribute('position', geo.attributes.position); g.setAttribute('aOut', geo.attributes.aOut);
      g.setAttribute('aCol', new THREE.InstancedBufferAttribute(attr, 4)); g.setAttribute('aFall', new THREE.InstancedBufferAttribute(fall, 1)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = name; scene.add(m); return m;
    };
    await ctx.yield();
    // ---- THE MARTLETS: the charge we fly in. Forty footless swallows, each a profile slab with a
    // wing slab held in three attitudes (raised, level, lowered; 2.5 changes a second). They fly WITH us the whole way,
    // ahead of us: low in ranks, then climbing and crossing over the way, then high in a skein, and at the end in file
    // into the ring (see THE FORMATION below).
    const birdRng = rng_fork(ctx.rng, 'martlets');
    // (BIRD: the martlet is cut 1.4 times the brief's size, 3.4 m long and 4.5 m across the wings: the nearest fly 30 m
    // ahead of us and are a tenth of the picture wide, the furthest 125 m and still a bird of two tinctures)
    const N_BIRD = 40, BIRD = 1.4, bs = (pts) => pts.map((q) => [q[0] * BIRD, q[1] * BIRD]);
    // S9 (round 13), THE GATE'S MARTLETS (a law of the place, the same on every seed): WHEEL.n more martlets WHEEL IN THE
    // ARCH'S SKY, by the world's clock alone (see THE WHEEL below): so far beyond line C on the gate's own axis its
    // middle, so wide its round, so high over the lists' ground, one lap in so many seconds.
    const WHEEL = { n: 28, d: 110, r: 14, y: 33, lap: 7, inN: 8, inR: 7, inY: 36.5 };   // (n: all of them; the last inN fly the inner round)
    // EVERY MARTLET IS PARTY PER PALE ARGENT AND SABLE: split along its body, the one half (that flank of the body and
    // that wing) argent, the other sable, each a filled half, the whole keylined sable; so it reads on the azure and
    // before an argent cloud alike. Past each dividing line it flies over the two halves change hands (the law of
    // counterchange at the bird's own place, per fragment). aDome.z carries the half (+1 or -1) at every corner.
    // A FAR MARTLET IS DRAWN PLAINLY (round 9): where a pixel spans more than BIRD_PLAIN m at the bird's own place (its
    // wings then under 36 pixels across) it is one clean swallow shape of one tincture: no party line, no fimbriation,
    // and a sable keyline 0.12 m broad, a seventh of its body's depth, which is not thickened with distance: it pales.
    const BIRD_PLAIN = 3.2 * 1.4 / 36;
    const birdMat = new THREE.ShaderMaterial({
      uniforms: { ...style.uniforms, uSable: { value: T.sable }, uLeaf: { value: T.argent }, uDeep: { value: tones.argentDeep }, uCore: { value: tones.argentCore }, uPlain: { value: new THREE.Vector2(BIRD_PLAIN, 0) } },
      defines: { NCC_PLAIN: 1 }, vertexShader: style.glsl.vertex,
      fragmentShader: style.glsl.fragHead + style.glsl.metal + style.glsl.counter + /* glsl */`
        uniform vec3 uSable, uLeaf, uDeep, uCore; varying float vPlain;
        void main() {
          vec3 n = vN / max(length(vN), 1e-4);
          vec3 mc = nccMetal(uDeep, uLeaf, uCore, n, vT, vB, vW, vLeaf, 0.);
          // (a far martlet is ONE tincture, sable over metal ground and argent over colour, with no line down its body)
          float half_ = mix(step(0., vEdge), 1., vPlain), g = nccGroundAA(vW.xz);
          gl_FragColor = vec4(mix(uSable, mc, abs(half_ - g)), 1.);
        }`,
    });
    // EVERY MARTLET IS FIMBRIATED ARGENT, the metal of the sky it flies in: an edge BIRD_FIM m broad inside its sable keyline
    const BIRD_KEY = 0.1, BIRD_FIM = 0.28;
    // ROUND 10: A MARTLET IS DRAWN IN PLAN, AS A SWALLOW IS SEEN FROM BEHIND AND BELOW (it flies ahead of us, and we look up
    // its back): a slender body with a FORKED TAIL, cut down its middle (its two halves are the party's two tinctures),
    // and two SICKLE WINGS spread wide, 6.2 m from tip to tip; no legs. BODY_HALF is the half on the bird's one hand
    // (x toward the bill, y outward from the long axis); the body lies flat (its slab turned into the wings' plane), and
    // the whole bird is carried nose-up, BIRD_PITCH from the level, its back turned to the head of our flight (see THE FORMATION).
    const BODY_HALF = bs([[1.25, 0], [1.0, 0.17], [0.75, 0.2], [0.4, 0.3], [-0.2, 0.26], [-0.7, 0.16], [-0.95, 0.22], [-1.75, 0.62], [-1.2, 0.1], [-1.0, 0]]);
    const BODY_OL = BODY_HALF.concat(BODY_HALF.slice(1, -1).reverse().map((q) => [q[0], -q[1]]));
    const bodySlab = style.slab(BODY_OL, { thickness: 0.42 * BIRD, keyline: BIRD_KEY + BIRD_FIM, rim: 0.05, keyInset: 0.04 });
    bodySlab.fimGeometry = style.slab(BODY_OL, { thickness: 0.42 * BIRD, keyline: BIRD_FIM, rim: 0.05, keyInset: 0.04 }).keyGeometry;
    {
      // (the body's fill: its two halves as two slabs, the half of the one hand first, so that the party line is the long axis itself)
      const ha = style.slab(BODY_HALF, { thickness: 0.42 * BIRD, keyline: 0, rim: 0.05 }).geometry, hb = style.slab(BODY_HALF.slice().reverse().map((q) => [q[0], -q[1]]), { thickness: 0.42 * BIRD, keyline: 0, rim: 0.05 }).geometry;
      bodySlab.geometry.dispose(); bodySlab.geometry = mergeGeometries([ha, hb], false); ha.dispose(); hb.dispose();
    }
    const wingHalf = bs([[0.45, 0], [0.42, 0.55], [0.2, 1.2], [-0.3, 1.8], [-0.95, 2.2], [-0.5, 1.5], [-0.3, 0.8], [-0.25, 0]]);
    // (aOut3: a keyline's way out, turned with its slab about the body's long axis)
    const out3 = (g, th) => { const o = g.attributes.aOut, v = new Float32Array(o.count * 3), c = Math.cos(th), sn = Math.sin(th); for (let i = 0; i < o.count; i++) { v[i * 3] = o.getX(i); v[i * 3 + 1] = o.getY(i) * c; v[i * 3 + 2] = o.getY(i) * sn; } g.setAttribute('aOut3', new THREE.BufferAttribute(v, 3)); };
    out3(bodySlab.keyGeometry, Math.PI / 2); out3(bodySlab.fimGeometry, Math.PI / 2);
    for (const g of [bodySlab.geometry, bodySlab.keyGeometry, bodySlab.fimGeometry]) g.rotateX(Math.PI / 2);   // (the body lies in the wings' plane)
    const wingSlab = (deg) => {
      const out = {};
      for (const part of ['geometry', 'keyGeometry', 'fimGeometry']) {
        const a = style.slab(wingHalf, { thickness: 0.1, keyline: part === 'fimGeometry' ? BIRD_FIM : BIRD_KEY + BIRD_FIM, rim: 0.05, keyInset: 0.02 })[part === 'geometry' ? part : 'keyGeometry'], b = a.clone();
        if (part !== 'geometry') out3(a, Math.PI / 2 - deg * RAD), out3(b, deg * RAD - Math.PI / 2);   // the keyline grows in the wing's own plane
        a.rotateX(Math.PI / 2 - deg * RAD); b.rotateX(deg * RAD - Math.PI / 2);
        out[part] = mergeGeometries([a, b], false); a.dispose(); b.dispose();
      }
      return out;
    };
    // THE BIRDS' KEYLINE: sable, the kit's own (it holds a pixel and a half): it parts the argent half from a cloud and bird from bird.
    const birdKeyMat = style.keyline({ keyWidth: BIRD_KEY + BIRD_FIM, out3: true, plain: [BIRD_PLAIN, 0.12] }), birdFimMat = style.fimbriation('argent', { keyWidth: BIRD_FIM, out3: true, plain: [BIRD_PLAIN, 0] });
    const flock = new THREE.Group(); flock.name = 'martlets';
    const birdSlabs = [bodySlab, wingSlab(42), wingSlab(2), wingSlab(-36)];
    const mkBirdMesh = (g, mat) => { const m = new THREE.InstancedMesh(g, mat, N_BIRD + WHEEL.n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); flock.add(m); return m; };
    const birdMeshes = birdSlabs.map((sl, k) => {
      // the half each corner belongs to: the body by its flank (the slab's own two faces), a wing by which of the pair it is
      // (the first half of the merged pair is the one wing, the second the other). No worn rim on so small a charge: no clay.
      const dm = sl.geometry.attributes.aDome, ps = sl.geometry.attributes.position;
      for (let i = 0; i < dm.count; i++) dm.setZ(i, i < dm.count / 2 ? 1 : -1);
      return mkBirdMesh(sl.geometry, birdMat);
    });
    const birdKeys = birdSlabs.map((sl) => mkBirdMesh(sl.keyGeometry, birdKeyMat)), birdFims = birdSlabs.map((sl) => mkBirdMesh(sl.fimGeometry, birdFimMat));
    scene.add(flock);
    // (a martlet's reach, as cut: the furthest any corner of it lies from its own middle, wings in any attitude, keyline and
    // all; and how far the lowest corner hangs under that middle; and its own measure as cut, wings in every attitude,
    // keyline and all: BIRD_LEN from bill to tail, BIRD_SPAN from wing tip to wing tip, BIRD_DEEP across its flat from
    // the lowest a wing tip goes to the highest)
    let BIRD_REACH = 0, BIRD_DOWN = 0; const _bb = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
    for (const sl of birdSlabs) for (const g of [sl.geometry, sl.keyGeometry]) { const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) { const x = ps.getX(i), y = ps.getY(i), z = ps.getZ(i); BIRD_REACH = Math.max(BIRD_REACH, Math.hypot(x, y, z)); BIRD_DOWN = Math.max(BIRD_DOWN, -y); _bb[0] = Math.min(_bb[0], x); _bb[1] = Math.max(_bb[1], x); _bb[2] = Math.min(_bb[2], y); _bb[3] = Math.max(_bb[3], y); _bb[4] = Math.min(_bb[4], z); _bb[5] = Math.max(_bb[5], z); } }
    const BIRD_LEN = _bb[1] - _bb[0], BIRD_DEEP = _bb[3] - _bb[2], BIRD_SPAN = _bb[5] - _bb[4];
    // (and no less than a box 2.9 m to every side of its middle: the measure the flock has always been held to)
    BIRD_REACH = Math.max(BIRD_REACH, 5.05); BIRD_DOWN = Math.max(BIRD_DOWN, 2.9);
    const birds = [];
    // THE FORMATION (laid at the build, the same on every seed; nothing reads the lens). WE FLY AS ONE OF THE FLOCK. Forty
    // martlets cannot be told apart in one piece of sky, so the flock is TEN THAT STAY WITH US, THE SKEIN, and THIRTY THAT
    // GO ON AHEAD, THE VAN. All of it is set by the place of the head of our flight (sLens, our route metre).
    // ROUND 12, THE CHEVRON KEEPS TO THE HUB'S HAND OF THE LION'S HEAD: its middle line is laid from the hub's edge of the head's keep (headEdge: the head's
    // bearing from the head of our flight, the angle HEAD_KEEP m subtends at the lion, and 2.5 degrees more) by its own half breadth (CHEV_HALF), see 3
    // below. That is a law of the chevron's middle line alone: no single bird's line from us is measured against HEAD_KEEP, and the five's crossing (2 below)
    // passes under the lion, nearer its head. The head's place is the lion's own smooth law (HEAD_AT: so far before the law's place on the crest, so high).
    // THE SKEIN DOES THREE THINGS, then goes in at the ring:
    // 1 LOW, ONE RANK ABREAST (from the entry): LOW_A[0] m ahead of us, five places to either hand of the way's pale, the innermost 13.8 m from the flown
    //   line and LOW_S[0] m from bird to bird, a few metres over our eye: they stoop with us. The hub's five fly in it. Of the ridge's five only the last
    //   is in it, at the entry itself, and leaves it there: the other four are on their ways already (see 2: their ways begin before the entry).
    // 2 THE RIDGE'S FIVE CROSS TO THE HUB'S HAND UNDER THE LION (ROUND 15, THE CROSSING: each on a way laid in the
    //   world's own space, reached by our route metres and not hung at a place before our eye; crossWay). A way is
    //   its places and the one smooth curve through them (wayAt), and holds to no line between them: the bird's
    //   place in the rank; its NEAR place on the ridge's hand of the lion (OVER.near m from us, clear of the lion's
    //   end by OVER.keep m at the lion and by its own reach; half a step over the skein's height over our eye for
    //   every second bird, half a step under it for every other: the step a bird's whole height as it is carried,
    //   the clear air OVER.air and the rise and fall of both); TWO PLACES UNDER THE LION, each on the line from our
    //   eye, at the route metre the place is reached, to the middle of the terrace's face below one end of the lion
    //   (OVER.far m from us: below its ridge-most end, then below its hub-most; far before us); for all but the
    //   last a place IN ECHELON at route metre LION_WAY[2][0] (the figure of the metre at which the lion springs),
    //   when the last stands at its second place under the lion: a span and the clear air further to the hub's hand
    //   and a length further from us for every bird between; and its place in the formation, on the hub's hand
    //   SKEIN_DIP m under our eye's height (the way ahead of us lies 17 to 25 m lower), where it is at route metre
    //   OVER.end. The five fly ways of this one make, the innermost first, each as many route metres after the one
    //   before (a third of the metres from a bird's leaving the rank to its near place): the second is at its near
    //   place as we come in, the first has passed its own, and the last leaves the rank as we come in. HOW THE FIVE
    //   ARE HELD APART, by these places and by no measure taken of bird from bird: to route metre LION_WAY[2][0] the
    //   one that comes to its near place and the one that leaves its own are at two heights, and past the lion they
    //   stand off into the echelon, each abreast of the next by its span and the clear air; from that metre to
    //   OVER.end they close into the formation's own places, where nothing holds bird from bird.
    //   Then all ten climb on the hub's hand (HIGH_U: the share of a bird's CLIMB_LEN in which it rises).
    // 3 HIGH, ONE OPEN CHEVRON (to route metre FILE0 and, thinning, on to the ring): its point SKEIN_A m ahead of us,
    //   five birds to an arm (the ridge's five its nearer arm, the hub's five its farther), an arm stepping CHEV[0] m
    //   out, CHEV[1] m up and CHEV[2] m back toward us from bird to bird, set out from our own place and heading. ITS
    //   MIDDLE LINE BEARS TO THE HUB'S HAND OF THE LION'S HEAD by HEAD_KEEP and its own half breadth (CHEV_HALF), and
    //   never less than CHEV_B's law (2 degrees, 6 by route metre 370, 11 by the gate), which rules once the lion has
    //   come round to the ridge's hand; its point shows CHEV_E[0] degrees up.
    // THEN IN FILE AT THE RING: from FILE0 the chevron gives up its point, the two birds at the heads of its arms
    //   together, one pair every 4 * ARRIVE_D m of our way; the birds behind move up. A pair that leaves flies
    //   JOIN[0] - JOIN[1] m of our way to THE RIBBON: a fixed line in the air (RIBBON: so far to the hub's hand, up, and
    //   beyond the ring's plane for every metre of it) that comes down from the hub's hand, from above and from beyond
    //   the ring's plane, behind the lance, to the top of the ring's band. The two birds of a pair fly it abreast
    //   (ABREAST); a pair reaches the band's top at its own route metre of our flight (ARRIVE0 and every 4 * ARRIVE_D m
    //   after), curves down behind the disc, a quarter circle about the ring's centre, and is gone. (No bird goes
    //   through the opening before the disc: the opening is the flown line's own end, and a bird in it would be nearer
    //   the flown line than any bird may be.)
    // THE VAN flies THREE RANKS ABREAST ON THE HUB'S HAND (the lion stands to the other): ten birds to a rank, LOW_S[1] m
    //   from bird to bird, the innermost VAN_IN m from the flown line, the ranks LOW_A[1..3] m ahead of us and
    //   LOW_Y[1..3] m up, a stair up the sky. Then it GOES ON TO THE RING IN ONE LONG FILE, the furthest rank first, one
    //   bird every VAN_D m of our way (the first leaves its rank as we pass route metre VAN0 - JOINV[0]; each is on the
    //   ribbon JOINV[0] - JOINV[1] m of our way later, VAN_ROW m behind the bird before it, and goes down behind the
    //   disc far ahead of us, small and plainly drawn).
    // None comes nearer the flown line than 8 m, wings at full spread: that is the formation's own law, MEASURED below
    // against the whole line and noted (CLEAR, 'martlet'); no bird is moved by the measure.
    // ROUND 12, A MARTLET IS NEVER EDGE-ON TO THE WAY: its flat (body and wings are cut in one plane) is turned about the
    // upright to face the flown line at the head of our flight, the place the whole formation is laid from, its long
    // line raised BIRD_PITCH from the level; within its flat its bill points the way it goes. So from our place a bird
    // shows the sine of (BIRD_PITCH less its height in the sky) of its length: half at the least. (Not the line's
    // NEAREST place: a bird flies 40 to 130 m ahead of us, and faced abeam it would stand edge-on to us.)
    const CLIMB0 = 45, RIDGE_CLIMB = 26, CLIMB_LEN = 130, JOIN = [80, 40], ARRIVE0 = 500, FILE0 = ARRIVE0 - JOIN[0], ARRIVE_D = 8, ROW = 14.5, RING_TOP = 16.9, SKEIN_LIFT = [7, 520, 560];
    const LOW_A = [44, 60, 90, 130], LOW_S = [12, 9], LOW_Y = [3, 24, 40, 60], SKEIN_UP = 5.8, CHEV = [4.8, 3.6, 1.5], CHEV_B = [2, 4, 5], CHEV_E = [16.5, -3.5], SKEIN_A = 115, VAN0 = 250, VAN_D = 2.8, VAN_ROW = 7.6, JOINV = [150, 60];
    const VAN_IN = [0, 13.8, 17, 22], HIGH_H = 0.4, HIGH_U = [[0.25, 0.6], [0.42, 0.78]], SKEIN_DIP = 6, HEAD_KEEP = 120, HEAD_AT = [66, 96];   // (HEAD_AT: the head's middle in the lion's own rest drawing)
    const CHEV_HALF = Math.atan(CHEV[0] * 4.75 / (SKEIN_A - CHEV[2] * 4.75));
    // (OVER, THE CROSSING of the ridge's five: near, metres from us at the near place; far, metres from us under the
    // lion's one end and under its other; keep, metres at the lion; len and under, our route metres from the near
    // place to the first place under the lion and from that to the second; end, the route metre at which each is in
    // its place in the formation; air, the clear air the lay leaves between two of the five, metres. BIRD_RISE: a
    // martlet's own rise and fall by the clock, metres to either side of its place)
    const OVER = { near: 42, far: [66, 92], keep: 30, len: 16, under: 16, end: 80, air: 1 }, BIRD_RISE = 0.3;
    const RIBBON = [0.45, 0.27, 360, 0.06, 0.5, 30], ABREAST = [3.6, 1.2], RING_A = 30 * RAD, RING_C = Math.cos(RING_A), RING_S = Math.sin(RING_A);
    const _bp = new THREE.Vector3(), _bt = new THREE.Vector3(), _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const WING_SEQ = [1, 2, 3, 2], BIRD_PITCH = 55 * RAD, BIRD_C = Math.cos(BIRD_PITCH), BIRD_S = Math.sin(BIRD_PITCH), _bq = new THREE.Vector3(), _bg = new THREE.Vector3();
    // the ring's own frame: its centre, the flown line's last heading, the hub's hand (level) and up square to the heading
    const RING_E = path.posAtDist(path.length, new THREE.Vector3()), RING_T = path.tangentAtDist(path.length, new THREE.Vector3()).normalize();
    const RING_R = new THREE.Vector3(-RING_T.z, 0, RING_T.x).normalize(), RING_U = new THREE.Vector3().crossVectors(RING_R, RING_T).normalize();
    // THE LION'S HEAD AS THE FLOCK IS LAID BY IT: for every HEAD_STEP m of our way, the bearing (from our heading, toward
    // the hub's hand) of the hub's edge of the head's keep: the head's own bearing from the head of our flight and the
    // angle HEAD_KEEP m subtends at it, and 2.5 degrees more (the figure holds its stations and trails or leads the law)
    const HEAD_STEP = 4, headTab = [];
    await ctx.yield();
    {
      const o = new THREE.Vector3(), tg = new THREE.Vector3(), hd = new THREE.Vector3();
      for (let s = 0; s <= path.length + HEAD_STEP; s += HEAD_STEP) {
        const sc = Math.min(s, path.length); path.posAtDist(sc, o); path.tangentAtDist(sc, tg); const tl = Math.hypot(tg.x, tg.z) || 1;
        hero.lionPart(sc / path.length, 5, HEAD_AT[0], HEAD_AT[1], hd); const dx = hd.x - o.x, dz = hd.z - o.z, dist = Math.hypot(dx, hd.y - o.y, dz);   // (ROUND 13: the head's own middle, wherever the lion stands, turns or runs)
        headTab.push(Math.atan2((-tg.z * dx + tg.x * dz) / tl, (tg.x * dx + tg.z * dz) / tl) + Math.asin(Math.min(1, HEAD_KEEP / dist)) + 2.5 * RAD);
      }
    }
    const headEdge = (s) => { const x = Math.min(headTab.length - 1.001, Math.max(0, s / HEAD_STEP)), i = Math.floor(x); return headTab[i] + (headTab[i + 1] - headTab[i]) * (x - i); };
    const flockAt = (b, sLens, out) => {
      const jn = b.van ? JOINV : JOIN, sC = Math.min(Math.max(sLens, 0), path.length);
      const t = clamp01((sLens - b.climb) / CLIMB_LEN), wF = sstep(b.arrive - jn[0], b.arrive - jn[1], sLens), sway = 1 - wF;
      // (its place on its arm of its chevron, counted from the point: as the birds before it leave for the ring it moves up)
      const c = b.van ? b.rank : Math.min(b.rank, Math.max(0, (b.arrive - jn[0] - sLens) / (4 * ARRIVE_D))), k = c + 0.75, aHi = b.A - CHEV[2] * k;
      // (its station high: so far ahead of our place, so far to the hub's hand of our heading and so far up. The chevron's
      // middle line bears to the hub's hand of the lion's head by the head's keep and the chevron's own half breadth, and
      // never less than CHEV_B's law; the greater of the two, taken smoothly)
      const sk = sstep(300, 370, sLens), bOld = (CHEV_B[0] + CHEV_B[1] * sk + CHEV_B[2] * sstep(380, 456, sLens)) * RAD, over = headEdge(sC) + CHEV_HALF - bOld, bc = bOld + 0.5 * (over + Math.hypot(over, 2 * RAD));
      const latHi = aHi * Math.tan(bc) + b.arm * CHEV[0] * k, upHi = aHi * Math.tan((CHEV_E[0] + CHEV_E[1] * sk + b.dE) * RAD) + CHEV[1] * k;
      // (from low to high: it draws ahead and to its bearing over the first HIGH_H of its CLIMB_LEN, and rises over its own share b.hU of it)
      const wH = sstep(0, HIGH_H, t), wU = sstep(b.hU[0], b.hU[1], t);
      const ahead = b.aLo + (aHi - b.aLo) * wH + sway * b.dA * Math.sin(sLens * b.kA + b.pA), on = Math.min(sLens + ahead, path.length);
      // LOW, by the route: so far ahead, so far to the hub's hand of the flown line at its own route metre; the van at its
      // rank's own height, a bird of the skein so far over our eye's height on the flown line (the ridge's five from
      // route metre OVER.end on SKEIN_DIP m under it: until then each is in the rank or on THE CROSSING)
      path.posAtDist(sC, _bg); const eyeY = _bg.y;
      path.posAtDist(on, _bp); path.tangentAtDist(on, _bt);
      _bz.set(-_bt.z, 0, _bt.x); const l = _bz.length() || 1; _bz.multiplyScalar(1 / l);          // to the right of travel (the hub's side), level
      out.copy(_bp).addScaledVector(_bz, b.lLo); out.y = b.van ? b.yLo : eyeY + b.yUp - (sLens < OVER.end ? 0 : b.dip);
      b.gone = false;
      if (!b.van && (wH > 0 || wU > 0)) {
        // HIGH, the chevron: set out from OUR place and heading, so that its lines hold on the arc and on the straight alike
        path.tangentAtDist(sC, _bt); const tl = Math.hypot(_bt.x, _bt.z) || 1, lt = latHi * ahead / aHi + sway * b.dL * sstep(0.9, 1, t) * Math.sin(sLens * b.kB + b.pB);
        out.x += (_bg.x + (_bt.x * ahead - _bt.z * lt) / tl - out.x) * wH; out.z += (_bg.z + (_bt.z * ahead + _bt.x * lt) / tl - out.z) * wH;
        // (and lifts, all of it alike, where the way ahead begins its climb to the ring)
        out.y += (eyeY + ahead * (upHi / aHi) + SKEIN_LIFT[0] * sstep(SKEIN_LIFT[1], SKEIN_LIFT[2], sLens) - out.y) * wU;
      }
      out.y += sway * b.dU * Math.sin(sLens * b.kC + b.pC);
      if (wF > 0) {
        // the ribbon: sg metres of it still to fly to the band's top (less than nothing: over the band and down behind the disc)
        const sg = b.rib * (b.arrive - sLens);
        // (the two birds of a pair fly ABREAST across the ribbon: ABREAST[0] m to a hand and ABREAST[1] m up or down from its line)
        const ax = b.ab * ABREAST[0], rr = RING_TOP + b.ab * ABREAST[1];
        if (sg >= 0) {
          // (from the hub's hand, from above and from beyond the ring's plane: level with the plane over the last metres)
          _bg.copy(RING_E).addScaledVector(RING_R, RIBBON[0] * sg + ax)
            .addScaledVector(RING_U, rr * RING_C + RIBBON[1] * Math.min(sg, RIBBON[2]) + RIBBON[3] * Math.max(0, sg - RIBBON[2]))
            .addScaledVector(RING_T, rr * RING_S + RIBBON[4] * (sg - RIBBON[5] * Math.tanh(sg / RIBBON[5])));
        } else {
          const th = Math.min(RING_A - sg / RING_TOP, Math.PI / 2);
          _bg.copy(RING_E).addScaledVector(RING_R, ax).addScaledVector(RING_U, rr * Math.cos(th)).addScaledVector(RING_T, rr * Math.sin(th));
          b.gone = th >= Math.PI / 2;
        }
        out.lerp(_bg, wF);
      }
      return out;
    };
    // (a way laid in the world, see THE CROSSING above: w.p the places, w.s our route metres at which they
    // are reached, w.v the bird's run at each; between two of them the one cubic through both places and both runs)
    const wayAt = (w, s, out) => {
      let k = 0; while (k < w.s.length - 2 && s >= w.s[k + 1]) k++;
      const d = w.s[k + 1] - w.s[k], x = (s - w.s[k]) / d, x2 = x * x, x3 = x2 * x;
      return out.copy(w.p[k]).multiplyScalar(2 * x3 - 3 * x2 + 1).addScaledVector(w.p[k + 1], 3 * x2 - 2 * x3).addScaledVector(w.v[k], (x3 - 2 * x2 + x) * d).addScaledVector(w.v[k + 1], (x3 - x2) * d);
    };
    // (THE CROSSING'S WAY of one of the ridge's five, the r-th of n, see THE CROSSING above: its places, the route
    // metres at which they are reached and the runs at them)
    const crossWay = (b, n) => {
      const V = () => new THREE.Vector3(), a = V(), c = V();
      // (the route metres: the last of them leaves its place in the formation as we come in and is at its
      // second place under the lion at route metre LION_WAY[2][0]; the second is at its near place as we come
      // in; the others evenly before and between, so the first has passed its near place when we come in)
      const lead = LION_WAY[2][0] - OVER.under - OVER.len, s1 = lead * (b.rank - 1) / (n - 2), s0 = s1 - lead, s2 = s1 + OVER.len, s3 = s2 + OVER.under;
      // (the way's own frame at a route metre: the place of the head of our flight, its level heading; a bearing in it, + to the hub's hand)
      const at = (s) => { const t = path.tangentAtDist(s, V()), tl = Math.hypot(t.x, t.z) || 1; return { e: path.posAtDist(s, V()), hx: t.x / tl, hz: t.z / tl }; };
      const bear = (f, p) => Math.atan2(-(p.x - f.e.x) * f.hz + (p.z - f.e.z) * f.hx, (p.x - f.e.x) * f.hx + (p.z - f.e.z) * f.hz);
      // (the lion's end as it stands at that metre: side -1 the one to the ridge's hand as seen from the way, +1 the one to the hub's)
      const lionEnd = (f, s, side) => { hero.lionEnds(s / path.length, a, c); return (bear(f, a) < bear(f, c)) === (side < 0) ? a : c; };
      // THE NEAR PLACE: OVER.near m from us at our eye's height and the skein's own height over it, to the ridge's hand
      // of the lion's end by OVER.keep m at the lion and the bird's own reach. THE NEAR PLACES LIE AT TWO HEIGHTS, one
      // STEP apart: a bird's whole height as it is carried (its length and its depth, raised BIRD_PITCH), the clear
      // air and the rise and fall of both. Every second bird's (the second's, the fourth's) lies half the step over
      // the skein's own height, every other's half the step under it: the one that comes to its near place and the
      // one that leaves its own are then never at one height
      const up = (b.rank & 1 ? 0.5 : -0.5) * (BIRD_LEN * BIRD_S + BIRD_DEEP * BIRD_C + OVER.air + 2 * BIRD_RISE);
      const f1 = at(s1), e1 = lionEnd(f1, s1, -1), be = bear(f1, e1) - Math.asin(Math.min(1, OVER.keep / Math.hypot(e1.x - f1.e.x, e1.z - f1.e.z))) - Math.asin(BIRD_REACH / OVER.near), cb = Math.cos(be), sb = Math.sin(be);
      const p1 = V().set(f1.e.x + OVER.near * (cb * f1.hx - sb * f1.hz), f1.e.y + b.yUp + up, f1.e.z + OVER.near * (cb * f1.hz + sb * f1.hx));
      // THE TWO PLACES UNDER THE LION: on the line from our eye to THE MIDDLE OF THE TERRACE'S FACE below the lion's
      // end (half the height of its merlons' tops: the height the gaze rests on, see THE LOOK RESTS ON THE WALL),
      // under the lion's one end OVER.far[0] m from us and under its other OVER.far[1] m from us
      const under = (s, side, far) => { const f = at(s); return V().copy(lionEnd(f, s, side)).setY((ROAD.yT + ROAD.kerb + ROAD.merlon[1]) / 2).sub(f.e).normalize().multiplyScalar(far).add(f.e); };
      const p0 = flockAt(b, s0, V()), p4 = flockAt(b, OVER.end, V()), s = [s0, s1, s2, s3], p = [p0, p1, under(s2, -1, OVER.far[0]), under(s3, 1, OVER.far[1])];
      // THE ECHELON AT THE LION'S SPRING: at route metre LION_WAY[2][0] the last of the five is at its second place
      // under the lion; every one before it has a place more at that metre: from the last one's, as seen from us
      // there, a span and the clear air further to the hub's hand and a length further from us for every bird
      // between (level with it)
      if (b.rank < n - 1) {
        const sp = LION_WAY[2][0], f = at(sp), q = under(sp, 1, OVER.far[1]), dx = q.x - f.e.x, dz = q.z - f.e.z, dl = Math.hypot(dx, dz), k = n - 1 - b.rank, out = k * (BIRD_SPAN + OVER.air), on = k * BIRD_LEN;
        q.x += (-dz * out + dx * on) / dl; q.z += (dx * out + dz * on) / dl; s.push(sp); p.push(q);
      }
      s.push(OVER.end); p.push(p4);
      // (the runs: the formation's own at the two ends; at each place between, the run that carries the bird from the place before to the place after)
      const N = p.length, v = p.map(() => null); v[0] = flockAt(b, s0 + 1, V()).sub(p0); v[N - 1] = flockAt(b, OVER.end + 1, V()).sub(p4);
      for (let k = 1; k < N - 1; k++) v[k] = V().subVectors(p[k + 1], p[k - 1]).multiplyScalar(1 / (s[k + 1] - s[k - 1]));
      return { s, p, v };
    };
    // A MARTLET'S PLACE when the head of our flight is at route metre sLens: on its crossing where it has one and is on
    // it, by the formation's law otherwise; and its own small rise and fall by the clock
    const birdAt = (b, sLens, time, out) => {
      if (b.cross && sLens > b.cross.s[0] && sLens < OVER.end) { wayAt(b.cross, sLens, out); b.gone = false; }
      else flockAt(b, sLens, out);
      out.y += BIRD_RISE * Math.sin(time * 1.3 + b.phase * 6.283);
      return out;
    };
    await ctx.yield();
    {
      // the forty, in twenty pairs (pair p, the birds of a pair side -1 and +1; rank = p >> 1, line = p & 1): THE SKEIN is the
      // birds of side -1 of the first five ranks (rank: its place on its arm, counted from the chevron's point; line: its arm)
      const TWO_PI = 2 * Math.PI;
      for (let i = 0; i < N_BIRD; i++) {
        const p = i >> 1, side = i & 1 ? 1 : -1, rank = p >> 1, line = p & 1;
        // (THE VAN: all the others, in leaving order vj, 0 the first to leave)
        const van = side > 0 || rank >= 5, far = van && side < 0, vj = far ? 2 * (9 - rank) + line : 10 + 2 * (9 - rank) + line;
        // (low: four RANKS ABREAST over the first field, LOW_S m from bird to bird, so that from our place no bird shows
        // across another: nearest and lowest the ten of the skein, five to either hand of the way; then the van in three
        // ranks of ten on the hub's hand alone (the lion stands to the other), each rank further ahead and higher than the
        // one before it, a stair up the sky, those that leave first for the ring in the furthest)
        const slot = van ? 10 + (29 - vj) : (rank << 1) + line;
        birds.push({
          side, van, arm: line ? 1 : -1, ab: van ? 0 : (line ? -1 : 1), A: SKEIN_A, dE: 0, phase: 0, gone: false,
          // (a bird of the skein rises over this share of its CLIMB_LEN; THE CROSSING sets the ridge's five SKEIN_DIP m under our eye first)
          hU: HIGH_U[!van && !line ? 1 : 0], dip: !van && !line ? SKEIN_UP + SKEIN_DIP : 0,
          aLo: LOW_A[slot / 10 | 0],
          lLo: van ? VAN_IN[slot / 10 | 0] + LOW_S[1] * (slot % 10) : (slot & 1 ? 1 : -1) * (13.8 + LOW_S[0] * (slot >> 1)), yLo: LOW_Y[slot / 10 | 0] + 0.2 * (i % 3),
          rank: far ? rank - 5 : rank, line, climb: van ? 1e9 : (line ? CLIMB0 : RIDGE_CLIMB) + 0.2 * (39 - i),
          // (low, a bird of the skein flies so far above our eye's height: the five of the ridge's hand SKEIN_UP m; the five of
          // the hub's hand 1.3 m higher from bird to bird outward. The ridge's five are counted from RIDGE_CLIMB (THE
          // CROSSING sets each in the place that law gives it at OVER.end); the hub's five from CLIMB0.)
          yUp: van ? 0 : SKEIN_UP + (slot & 1 ? 1.3 * (slot >> 1) : 0),
          rib: van ? VAN_ROW / VAN_D : ROW / ARRIVE_D,
          arrive: van ? VAN0 + VAN_D * vj : ARRIVE0 + 4 * ARRIVE_D * rank,
          dA: 2, kA: TWO_PI / (150 + 37 * ((i * 7) % 8)), pA: i * 2.399,
          dL: 0.6, kB: TWO_PI / (190 + 29 * ((i * 3) % 8)), pB: i * 1.117,
          dU: 0.4, kC: TWO_PI / (170 + 41 * ((i * 5) % 7)), pC: i * 0.731,
        });
      }
      for (const b of birds) b.phase = birdRng();
      { const five = birds.filter((b) => b.dip > 0); for (const b of five) b.cross = crossWay(b, five.length); }   // (the ridge's five: THE CROSSING)
      for (const m of flock.children) m.count = birds.length + WHEEL.n;
    }
    await ctx.yield();
    {
      // clear air of the flock as built: every bird at every place of the head of our flight (every 3 m of route), wings
      // at full spread, against the whole flown line; and from the lens's own place (the formation's law: no kit flock)
      const q = new THREE.Vector3(), lens = new THREE.Vector3();
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        for (let sL = 0; sL <= path.length; sL += 3) {
          birdAt(b, sL, 0, q); noteClear('martlet', clearOf(q.x, q.y, q.z) - BIRD_REACH - 0.3);
          path.posAtDist(sL, lens); noteClear('martlet from the lens', q.distanceTo(lens) - BIRD_REACH - 0.3);
          noteClear('martlet height over the ground (wings lowered)', q.y - BIRD_DOWN - 0.3);
        }
        await ctx.yield();
      }
    }
    updaters.push((dt, time, u) => {
      const sLens = clamp01(u) * path.length;
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        // it heads the way it goes: from its place a metre of our way back to its place a metre on (the law of its place)
        birdAt(b, sLens - 1, time, _bq); _bx.copy(_bq); birdAt(b, sLens + 1, time, _bq); _bx.sub(_bq).multiplyScalar(-1);
        birdAt(b, sLens, time, _bq); _bp.copy(_bq);
        // ITS FLAT FACES THE FLOWN LINE AT THE HEAD OF OUR FLIGHT (round 12): _bg, level and away from that place; the
        // flat's long line is raised BIRD_PITCH from the level (its normal _by: up and toward that place), the wings' line level
        path.posAtDist(sLens, _bg); _bg.set(_bp.x - _bg.x, 0, _bp.z - _bg.z);
        if (_bg.lengthSq() < 1e-6) _bg.set(RING_T.x, 0, RING_T.z); _bg.normalize();
        _bz.set(-_bg.z, 0, _bg.x);
        _by.set(-BIRD_S * _bg.x, BIRD_C, -BIRD_S * _bg.z);
        // within its flat the bill points the way it goes over the ground (straight away from us: up the picture)
        const hl = Math.hypot(_bx.x, _bx.z), ca = hl > 1e-4 ? (_bx.x * _bg.x + _bx.z * _bg.z) / hl : 1, sz = hl > 1e-4 ? (_bx.x * _bz.x + _bx.z * _bz.z) / hl : 0;
        _bq.set(BIRD_C * _bg.x, BIRD_S, BIRD_C * _bg.z);                                             // (straight away, in the flat)
        _bx.copy(_bq).multiplyScalar(ca).addScaledVector(_bz, sz); _bz.multiplyScalar(ca).addScaledVector(_bq, -sz);
        _bm.makeBasis(_bx, _by, _bz).setPosition(_bp);
        const body = b.gone ? _zero : _bm;                                                         // (behind the disc it is gone)
        birdMeshes[0].setMatrixAt(i, body); birdKeys[0].setMatrixAt(i, body); birdFims[0].setMatrixAt(i, body);
        const att = b.gone ? 0 : WING_SEQ[Math.floor(time * 2.5 + b.phase * 4) & 3];
        for (let k = 1; k < 4; k++) { birdMeshes[k].setMatrixAt(i, k === att ? _bm : _zero); birdKeys[k].setMatrixAt(i, k === att ? _bm : _zero); birdFims[k].setMatrixAt(i, k === att ? _bm : _zero); }
      }
      for (const m of birdMeshes) m.instanceMatrix.needsUpdate = true;
      for (const m of birdKeys) m.instanceMatrix.needsUpdate = true;
      for (const m of birdFims) m.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();
    // THE WHEEL (S9): the gate's own martlets fly ONE LEVEL ROUND IN THE LISTS' SKY BEYOND THE GATE, seen from the
    // street THROUGH THE ARCH. ROUND 14 (T3c), FARTHER AND LOWER IN THE PICTURE: its middle lies WHEEL.d m beyond line C
    // on the gate's own axis (it lay 20 m beyond, hard over the arch: cut by the picture's top as we came under), its
    // round is WHEEL.r m in radius and WHEEL.y m over the ground, with an inner round of WHEEL.inN birds WHEEL.inR m in
    // radius at WHEEL.inY m, turning with it (the way has climbed 9 m where it passes under: 17 m
    // over the flown line there, no nearer it than the round was). From the way's last 60 m before the arch the whole
    // round stands in the opening, under the portcullis' points; beyond the arch it leaves by the picture's top from
    // some 50 m on. The birds are evenly spaced in file and fly one lap in
    // WHEEL.lap seconds OF THE WORLD'S CLOCK (their place is the clock's alone: no timer; a frame with dt 0 moves
    // nothing). Each is the flock's own martlet: its flat faces the arch's middle on line C, raised BIRD_PITCH from
    // the level, and within its flat its bill points the way it goes.
    const WH_C = (() => { const q = beside(H_C, 0, [0, 0, 0, 1]); return [q[0] + q[2] * WHEEL.d, q[1] + q[3] * WHEEL.d, q[0], q[1]]; })();
    // (its clear air, wings at full spread, against the whole flown line: the lens passes under it, so the two measures are one)
    for (let k = 0; k < 120; k++) {
      const a = k * Math.PI / 60, d = Math.min(clearOf(WH_C[0] + WHEEL.r * Math.cos(a), WHEEL.y - 0.3, WH_C[1] + WHEEL.r * Math.sin(a)), clearOf(WH_C[0] + WHEEL.inR * Math.cos(a), WHEEL.inY - 0.3, WH_C[1] + WHEEL.inR * Math.sin(a))) - BIRD_REACH - 0.3;
      noteClear('martlet', d); noteClear('martlet from the lens', d);
    }
    noteClear('martlet height over the ground (wings lowered)', WHEEL.y - 0.3 - BIRD_DOWN - 0.3);
    updaters.push((dt, time) => {
      for (let j = 0; j < WHEEL.n; j++) {
        const NO = WHEEL.n - WHEEL.inN, inner = j >= NO, wr = inner ? WHEEL.inR : WHEEL.r, wy = inner ? WHEEL.inY : WHEEL.y;
        const i = birds.length + j, a = 2 * Math.PI * ((inner ? (j - NO + 0.5) / WHEEL.inN : j / NO) + time / WHEEL.lap), c = Math.cos(a), s = Math.sin(a);
        _bp.set(WH_C[0] + wr * c, wy + 0.3 * Math.sin(time * 1.3 + j * 2.399), WH_C[1] + wr * s);
        _bg.set(_bp.x - WH_C[2], 0, _bp.z - WH_C[3]).normalize();                                   // (level and away from the arch's middle)
        _bz.set(-_bg.z, 0, _bg.x); _by.set(-BIRD_S * _bg.x, BIRD_C, -BIRD_S * _bg.z);
        const ca = -s * _bg.x + c * _bg.z, sz = -s * _bz.x + c * _bz.z;                             // (the way it goes, (-s, c), in the flat)
        _bq.set(BIRD_C * _bg.x, BIRD_S, BIRD_C * _bg.z);
        _bx.copy(_bq).multiplyScalar(ca).addScaledVector(_bz, sz); _bz.multiplyScalar(ca).addScaledVector(_bq, -sz);
        _bm.makeBasis(_bx, _by, _bz).setPosition(_bp);
        const att = WING_SEQ[Math.floor(time * 2.5 + j * 1.37) & 3];
        birdMeshes[0].setMatrixAt(i, _bm); birdKeys[0].setMatrixAt(i, _bm); birdFims[0].setMatrixAt(i, _bm);
        for (let k = 1; k < 4; k++) { birdMeshes[k].setMatrixAt(i, k === att ? _bm : _zero); birdKeys[k].setMatrixAt(i, k === att ? _bm : _zero); birdFims[k].setMatrixAt(i, k === att ? _bm : _zero); }
      }
      for (const m of flock.children) m.instanceMatrix.needsUpdate = true;
    });
    // ---- THE STAGS: two herds (seven in the first field, fourteen in the lists), each stag 18.9 m long as cut (23.5 m at the
    // extended gallop) and 20.7 m to the antler tips, layered slabs in profile, keylined.
    // Six attitude meshes (lodged, statant, trippant, and THREE OF THE GALLOP: courant extended, gathered, alighting)
    // instanced; each attitude's mesh holds only the stags holding it. Gules on metal ground, or on colour
    // ground, by the law of counterchange per fragment: a stag on a line is two-coloured exactly at it.
    // ROUND 12, ONE CLEAN SILHOUETTE: body with neck and head, attires and four legs are cut in ONE plane and painted as
    // one leaf (one dome, one tincture), and ONE sable keyline lies round the whole beast: every part's line is set out
    // behind every part's face, so it shows only round the figure, never within it. No fimbriation, no inner line.
    const SK = 1.45, C1 = 1;
    const STAG_BODY = [[-5.2, 7.2], [-3, 7.6], [1.5, 7.9], [3.2, 9.6], [4.2, 11.0], [3.9, 11.9, C1], [4.8, 11.1], [6.4, 10.2], [6.8, 9.7, C1], [6.2, 9.3],
      [5.0, 9.4], [4.4, 8.4], [3.9, 6.6], [2.8, 5.0], [-1, 4.9], [-3.5, 5.3], [-5.6, 5.4], [-6.2, 6.4, C1], [-5.5, 7.0]];
    const STAG_ANTLER = [[4.3, 10.9, C1], [4.9, 11.0, C1], [4.8, 11.9], [5.9, 12.5, C1], [4.7, 12.4], [4.5, 13.0], [5.4, 13.9, C1], [4.2, 13.5], [3.6, 14.3, C1],
      [3.5, 13.2], [2.6, 13.6, C1], [3.6, 12.4], [4.0, 11.6]];
    // legs: [hip, knee, foot] for near fore, far fore, near hind, far hind; dy lowers the whole body
    const STAG_ATT = [
      { dy: -3.9, legs: [[[2.6, 1.7], [4.4, 1.0], [2.6, 0.35]], [[2.0, 1.7], [3.9, 1.3], [2.2, 0.4]], [[-4.2, 1.9], [-2.6, 1.4], [-4.2, 0.4]], [[-3.6, 1.9], [-2.1, 1.6], [-3.6, 0.5]]] },
      { dy: 0, legs: [[[2.6, 5.6], [2.7, 2.9], [2.6, 0]], [[2.0, 5.6], [2.1, 2.9], [1.9, 0]], [[-4.2, 5.8], [-4.9, 3.1], [-4.5, 0]], [[-3.6, 5.8], [-4.2, 3.1], [-3.7, 0]]] },
      { dy: 0, legs: [[[2.6, 5.6], [4.3, 3.9], [3.9, 1.9]], [[2.0, 5.6], [1.9, 2.9], [1.4, 0]], [[-4.2, 5.8], [-4.4, 3.1], [-3.6, 0]], [[-3.6, 5.8], [-4.6, 3.2], [-4.9, 0.1]]] },
      { dy: 0.9, legs: [[[2.6, 6.5], [5.0, 5.8], [7.4, 5.3]], [[2.0, 6.5], [4.6, 5.2], [6.9, 4.3]], [[-4.2, 6.7], [-6.3, 6.1], [-8.6, 5.5]], [[-3.6, 6.7], [-6.0, 5.5], [-8.2, 4.4]]] },
      { dy: 0.3, legs: [[[2.6, 5.9], [2.9, 3.5], [0.9, 2.3]], [[2.0, 5.9], [2.2, 3.3], [0.4, 2.7]], [[-4.2, 6.1], [-3.4, 2.9], [-1.0, 0.2]], [[-3.6, 6.1], [-2.9, 3.7], [-1.2, 2.0]]] },
      { dy: 0.6, legs: [[[2.6, 6.2], [4.3, 4.4], [5.0, 1.6]], [[2.0, 6.2], [3.3, 4.0], [3.4, 0.9]], [[-4.2, 6.4], [-6.0, 5.0], [-8.0, 3.6]], [[-3.6, 6.4], [-5.3, 4.2], [-6.8, 2.3]]] },
    ];
    const STAG_RUN = [3, 5, 4];   // the gallop's three attitudes in order: extended, alighting on the forefeet, gathered
    // a leg, cut in one piece: broad at the hip, drawn in to the knee, a slender shank and a hoof a little broader than
    // the shank, its toe forward (the knee's two sides are rounded by the outline's own curve; the hip and hoof are corners)
    const legCut = (hip, knee, foot) => {
      const nrm = (a, b) => { const x = -(b[1] - a[1]), y = b[0] - a[0], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
      const n1 = nrm(hip, knee), n2 = nrm(knee, foot); let kx = n1[0] + n2[0], ky = n1[1] + n2[1]; const kl = Math.hypot(kx, ky) || 1; kx /= kl; ky /= kl;
      const dl = Math.hypot(foot[0] - knee[0], foot[1] - knee[1]) || 1, dx = (foot[0] - knee[0]) / dl, dy = (foot[1] - knee[1]) / dl, f = [foot[0] - dx * 0.55, foot[1] - dy * 0.55];
      return [[hip[0] + n1[0] * 0.66, hip[1] + n1[1] * 0.66, C1], [knee[0] + kx * 0.4, knee[1] + ky * 0.4], [f[0] + n2[0] * 0.25, f[1] + n2[1] * 0.25, C1], [foot[0] + n2[0] * 0.5, foot[1] + n2[1] * 0.5, C1],
        [foot[0] - n2[0] * 0.3, foot[1] - n2[1] * 0.3, C1], [f[0] - n2[0] * 0.25, f[1] - n2[1] * 0.25, C1], [knee[0] - kx * 0.4, knee[1] - ky * 0.4], [hip[0] - n1[0] * 0.66, hip[1] - n1[1] * 0.66, C1]];
    };
    const STAG_KEY = 0.2;
    const stagKeyMat = style.keyline({ keyWidth: STAG_KEY });
    const stagMat = style.counter('gules', 'or');
    const stagGeos = [], STAG_CL = [];   // (STAG_CL: each attitude's own outlines as cut, for the measures)
    for (const att of STAG_ATT) {
      const geos = [], keys = [], ols = [];
      // (every part about the one plane z = 0; the faces 0.35 to 0.37 m out, every keyline 0.28 to 0.30 m out: behind every face)
      const add = (outline, th) => {
        const g = style.slab(outline.map((q) => [q[0] * SK, q[1] * SK]), { z: 0, thickness: th, keyline: STAG_KEY, rim: 0.01, keyInset: 0.07 });
        geos.push(g.geometry); keys.push(g.keyGeometry); ols.push(outline.map((q) => [q[0] * SK, q[1] * SK]));
      };
      const shift = (spec) => spec.map((q) => [q[0], q[1] + att.dy, q[2]]);
      add(style.outline(shift(STAG_BODY), 3), 0.7);
      add(style.outline(shift(STAG_ANTLER), 2), 0.72);
      att.legs.forEach((lg) => add(style.outline(legCut(lg[0], lg[1], lg[2]), 2), 0.74));
      const g = mergeGeometries(geos, false), k = mergeGeometries(keys, false);
      for (const x of geos) x.dispose(); for (const x of keys) x.dispose();
      // one leaf over the whole beast: the dome is taken across the figure's own breadth and height, not each part's
      g.computeBoundingBox();
      const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, hx = (bb.max.x - bb.min.x) / 2, hy = (bb.max.y - bb.min.y) / 2;
      const ps = g.attributes.position, nr = g.attributes.normal, dm = g.attributes.aDome;
      for (let v = 0; v < ps.count; v++) if (Math.abs(nr.getZ(v)) > 0.5) dm.setXYZ(v, (ps.getX(v) - cx) / hx, (ps.getY(v) - cy) / hy, 0);
      stagGeos.push([g, k]); STAG_CL.push(cloudOf(ols, 1));
      await ctx.yield();
    }
    // THE FUR'S SPOT IS AS LONG AS THE STAG THAT LODGES ON THE FUR IS LONG (round 16; a rule of the fur, the same on
    // every deal): the lodged attitude's own mesh, its face and its keyline, measured nose to tail as it is cut; the
    // ground's paint takes the spot's length from here and nowhere else (see field, in the ground's shader).
    { let x0 = Infinity, x1 = -Infinity; for (const g of stagGeos[0]) { g.computeBoundingBox(); x0 = Math.min(x0, g.boundingBox.min.x); x1 = Math.max(x1, g.boundingBox.max.x); }
      for (const v of groundMat.uniforms.uInfo.value) if (v.z === 1) v.w = x1 - x0; }
    // THE FIRST HERD (the ridge's hand, the hand the look rests on; it runs in file along one track: see THE
    // FIRST HERD RUNS STRUNG OUT IN FILE, below). A stag standing is as tall as a sixth of the picture at its side from HERD.tall
    // (184) m; lying, 15 m tall, HERD.low of that. A second-herd stag shows its flank: running it is turned RUN_TURN
    // of 65 degrees (50: a three-quarter face) toward the way. No stag ever turns its edge to the way. THE GAZE keeps
    // every stag of the first herd whole while it stands taller than a sixth of the picture (see THE GAZE).
    const stagRng = rng_fork(ctx.rng, 'stags');
    const N_HERD1 = 7, N_HERD2 = 14, N_STAG = N_HERD1 + N_HERD2, RUN_TURN = 50 / 65;
    const STAG_REACH = 6.6 * SK / 0.92;
    const stagMeshes = stagGeos.map(([g, k], a) => {
      const m = new THREE.InstancedMesh(g, stagMat, N_STAG), mk = new THREE.InstancedMesh(k, stagKeyMat, N_STAG);
      for (const x of [m, mk]) { x.frustumCulled = false; x.instanceMatrix.setUsage(THREE.DynamicDrawUsage); x.name = 'stags-' + a; scene.add(x); }
      return [m, mk];
    });
    const _sr = [0, 0, 0, 1];
    const stags = [];
    const HERD = { tall: 184, low: 0.63 };
    // THE FIRST HERD RUNS STRUNG OUT IN FILE ALONG ONE TRACK (laws of the herd's place, the same on every seed).
    // THE TRACK (FILE.pts: [route metre abeam, metres to the ridge's hand]): it begins FILE.pts[0][1] m from the
    // flown line (18: never nearer) and its FIRST LEG runs STRAIGHT OUT, square to the way, 31 m short of BANK (61 m
    // short of line B: 36 m before the river's edge), to 136 m out; there it turns and runs BACK ALONG THE WALL'S
    // FOOT toward the entry, 19 to 25 m before the wall's face: for its first 75 m from the turn, past the second
    // three trees, it is laid 3 to 6 m nearer the way than beyond them (a stag coming round the turn still has its
    // nose toward the wall); its last 32 m, beyond the trees, close to 14 m before the face (the foremost stag
    // lodges 16 m before it). The six trees stand 7 m before the face, their feet 11.7 m and more from the track.
    // THE LAW these places keep: no stag's outline, antlers and all, in any attitude it can hold at any place of
    // its track, comes within 2 m of a tree's outline, fruit and all, nor within 1 m of another stag's (the
    // build does not measure this: it is kept by the track, the gap and the trees' places typed here). A track square to the way is the one track on which a file ahead of us shows
    // every stag's flank from every place of the way (a file that runs along the way is seen from behind, one stag
    // before the next; a slanting track points at us somewhere). THE FILE: seven stags FILE.gap (28) m apart along
    // the track (a stag is 18.9 m long as cut, 23.5 at the extended gallop: nose to tail 2.5 m and more of clear
    // air, round the turn too), their gallops a third of a stride out of step from each to the next. ITS PLACE IS A
    // LAW OF OUR ROUTE METRE (FILE.way: [our route metre, the track metre of its head], as the lion's timetable
    // is): to route metre FILE.rise (50) it stands drawn out along its first leg, the rearmost 18 m from our line and
    // the foremost two round the turn, 200 m and more ahead of us; from 50 it RUNS, FILE.v (1.4) m of its track for
    // every metre of ours: out along its first leg ahead of us, across the whole ground (165 m and more from us while we
    // stoop), round the turn and along the wall's foot. AT ROUTE METRE 140 IT HALTS, the rearmost FILE.halt m past
    // the turn, strung out along the wall's foot before the trees, and LODGES (FILE.stand m after): we pass the
    // file 132 m and more off (its nearest outline from us, moment by moment; its track there 136 m from the way). From there to the river NO STAG STANDS IN THE GROUND WE PASS. IT CROSSES LINE A at
    // the wall's foot: there the line is drawn broad across its track (see THE LINE UNDER THE HERD, the ground's
    // paint).
    // A stag on the first leg shows its flank: its nose straight out along the track; on the wall's foot it is turned as it runs.
    const FILE = { gap: 28, rise: 50, v: 1.4, stand: 4, halt: 8, nose: [90, 158],
      pts: [[BANK - 31, 18], [BANK - 31, 136], [BANK - 39, 143], [BANK - 53, 144], [BANK - 80, 148], [BANK - 105, 160], [BANK - 129, 172], [BANK - 152, 182], [BANK - 175, 190], [BANK - 205, 201]] };
    { let L = 0; FILE.len = [0]; for (let i = 1; i < FILE.pts.length; i++) { L += Math.hypot(FILE.pts[i][0] - FILE.pts[i - 1][0], FILE.pts[i][1] - FILE.pts[i - 1][1]); FILE.len.push(L); }
      FILE.S0 = (N_HERD1 - 1) * FILE.gap; FILE.E = FILE.len[1] + FILE.halt + FILE.S0; FILE.done = FILE.rise + (FILE.E - FILE.S0) / FILE.v; FILE.way = [[0, FILE.S0], [FILE.rise, FILE.S0], [FILE.done, FILE.E]]; }
    // (the head's track metre for our route metre; a place of the track: out = [route metre abeam, metres out])
    const fileHead = (h) => { const W = FILE.way; if (h <= W[0][0]) return W[0][1]; for (let i = 1; i < W.length; i++) if (h <= W[i][0]) return W[i - 1][1] + (W[i][1] - W[i - 1][1]) * (h - W[i - 1][0]) / (W[i][0] - W[i - 1][0]); return W[W.length - 1][1]; };
    const fileAt = (sT, out) => { const P = FILE.pts, Ln = FILE.len, x = Math.min(Math.max(sT, 0), Ln[Ln.length - 1]); let i = 1; while (i < P.length - 1 && Ln[i] < x) i++; const f = (x - Ln[i - 1]) / (Ln[i] - Ln[i - 1]); out[0] = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f; out[1] = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f; return out; };
    const _ft = [0, 0];
    for (let k = 0; k < N_HERD1; k++) {
      const st = { rank: k, lat: FILE.pts[0][1], phase: stagRng(), file: true, back: (N_HERD1 - 1 - k) * FILE.gap };
      st.phase = (k * 0.37 + 0.11) % 1;   // (the gaits out of step: a third of a stride and a little more from each stag to the next)
      stags.push(st);
    }
    // THE SECOND HERD, THE LAW IN FORCE (fourteen stags in the lists; the same on every seed). Each lies lodged till
    // it rises; rising it stands (8 m of our way), steps off (10 m more, coming round from broadside to RUN_TURN) and
    // runs, turned 50 degrees to the way, its nose toward the way on the hand it rose on (its flank shown), 1.8 m of
    // the route for every metre of ours, in its own lane; at its halt it is drawn up, turned as it ran. NO TWO STAGS'
    // OUTLINES COME WITHIN 1 M AT ANY TIME: stags that run together are turned alike, so their slabs are parallel, and
    // EVERY BAND KEEPS ONE AND THE SAME OFFSET FROM STAG TO STAG from its lodging to its halt (a band that re-forms
    // on its way runs through itself). On the hub's hand and among the four that cross, each next one lies further
    // from the way and further on; the ridge's seven lie each further out and further BACK.
    //   THE REAR SEVEN are ONE RIGID BAND on the ridge's hand, the same lodged, rising, running and drawn up: the
    //   innermost RIDGE7.lat (30) m from the way (THE NEAREST STAG TURNED TO THE WAY: nose to it, turned 65 then 50
    //   degrees, its outline 21 m from the way in plan and 25 m from the flown line), each next RIDGE7.out (20) m
    //   further out and RIDGE7.back (5) m further BACK, the outermost and rearmost 150 m out, lodged at route metre
    //   HERD2 - 12. WHY SO: seen from the way, a band whose outer stags lie further on stands on one bearing, each
    //   stag before the next; laid further back it spreads as a row (from every place of our way between route
    //   metres 540 and 700, taken every 2 m, no two of the seven overlap in bearing by a third of the nearer one's
    //   breadth, and no bearing holds more than two of them). The step back is small because the slabs are parallel,
    //   turned 65 degrees lodged and 50 running: at 20 m out and 5 m back their planes stand 3.9 m apart lodged and
    //   9 m running, and no outline comes within 4.8 m of the next one's (at 16 m out and 9 m back the lodged
    //   planes stood 1.4 m apart). The lanes of 90 m and more lie wholly on the herd's floor, the ground the camp
    //   of that hand leaves open (LOW_END to CAMP_GAP1), the outermost inside the great pavilion that stands 185 m
    //   out: no outline of the seven comes within 6 m of a tree or of anything built. They rise ALL TOGETHER as
    //   our flight reaches RISE2, run straight on, each in its own lane, and are drawn up together, the rearmost
    //   RIDGE7.on (121) m beyond the ring's plane and the innermost 30 m further on.
    //   FOUR OF THE FRONT SEVEN (CROSSERS) lie beyond the ring's plane on the ridge's hand, CROSSERS.lat m from the
    //   way and each next CROSSERS.ech m further out and 9 m further on, from HERD2 + 66. They rise together as our
    //   flight reaches RISE2B, run slantwise across the way's line beyond the ring's plane (each two-coloured exactly
    //   at the pale as it crosses), every one CROSSERS.over m to the hub's hand over the same CROSSERS.on m of its
    //   way, and stand drawn up on the hub's hand of the ring, 55 to 79 m from the way and 121 to 148 m beyond the
    //   ring's plane, long before we come there.
    //   THE THREE OF NEAR2 lie lodged on the hub's hand, NEAR2.lat m from the way (their middles: OUTSIDE THE LANE'S
    //   ROW OF LANCES AND THEIR PENNONS, and no outline of theirs within 25 m of the flown line) and each next ECH2 m
    //   further out. They rise as we come to the gate (NEAR2.rise) and run before us through the lists, each holding
    //   its berth ahead of our own place (NEAR2.berth: the outer further on), in its own straight lane, till they are
    //   drawn up NEAR2.on m and more beyond the ring's plane, short of the four that crossed.
    // How near a stag's own outline comes to the flown line is measured below (CLEAR, 'stag'). THE LAW of its
    // distance to other bodies: no stag's outline, in any attitude it can hold, at any place of its law, comes
    // within 1 m of another stag's, 2 m of a tree's, or 1.5 m of a lance, a cloth at full stream, a rail, a shield,
    // a tent or the gate. The build does not measure this: it is kept by the lanes, homes, berths and halts typed
    // here. None stands in the ring's opening.
    const HERD2 = 656, RISE2 = 528, RISE2B = RISE2 - 208, ECH2 = 16, RIDGE7 = { lat: 30, out: 20, back: 5, on: 121 }, NEAR2 = { lat: 36, berth: [125, 137, 149], rise: H_C - 40, on: 60 }, CROSSERS = { lat: 54, ech: 8, on: 118, over: 133 };
    for (const sd of [1, -1]) {
      for (let j = 0; j < N_HERD2 / 2; j++) {
        const k = j - NEAR2.berth.length, lat = sd > 0 ? RIDGE7.lat + RIDGE7.out * j : CROSSERS.lat + CROSSERS.ech * k, st = { rank: j, lat, phase: stagRng(), v: 1.8, berth: 1e9 }, back = RIDGE7.back * (N_HERD2 / 2 - 1 - j);
        st.home = sd > 0 ? HERD2 - 12 + back : HERD2 + 66 + 9 * k; st.rise = sd > 0 ? RISE2 : RISE2B; st.halt = sd > 0 ? H_END + RIDGE7.on + back : st.home + CROSSERS.on;
        st.lane = sd > 0 ? [lat, lat, 0, 1, lat, 0, 1] : [lat, lat, 0, 1, lat - CROSSERS.over, st.home + 20, st.halt - 5];
        if (sd < 0 && j < NEAR2.berth.length) {
          st.lat = -(NEAR2.lat + ECH2 * j); st.berth = NEAR2.berth[j]; st.rise = NEAR2.rise; st.home = st.rise + 13 + st.berth; st.halt = H_END + NEAR2.on + st.berth - NEAR2.berth[0];
          st.lane = [st.lat, st.lat, 0, 1, st.lat, 0, 1];
        }
        stags.push(st);
      }
    }
    // THE LINE UNDER THE HERD (T2c; see the ground's paint): the crossings are found here from the tracks themselves:
    // the first herd's file where its track changes sides of line A; the second herd's four where their lanes come
    // to the way's own line beyond the ring's plane. (CROSS: half lengths of the broad line, metres.)
    const CROSS = { a: 30, w: 10 };
    {
      const H = style.uniforms.uCcH.value, A = style.uniforms.uCcA.value, W = style.uniforms.uCcW.value, cr = groundMat.uniforms.uCross.value, q = [0, 0, 0, 1];
      let last = 0;
      for (let sT = FILE.S0; sT <= FILE.E; sT += 1) {
        fileAt(sT, _ft); beside(_ft[0], _ft[1], q); const side = A.x * (q[1] - H.y) - A.y * (q[0] - H.x);
        if (last * side < 0) { cr.x = (q[0] - H.x) * A.x + (q[1] - H.y) * A.y; cr.y = CROSS.a; break; }
        last = side;
      }
      let lo = 1e9, hi = -1e9;
      for (const st of stags) {
        const L = st.lane; if (!L || L[1] * L[4] >= 0) continue;
        for (let h = L[5]; h <= L[6]; h += 0.5) if ((L[1] + (L[4] - L[1]) * sstep(L[5], L[6], h)) * L[1] <= 0) { beside(h, 0, q); const al = -(q[0] - H.x) * W.y + (q[1] - H.y) * W.x; lo = Math.min(lo, al); hi = Math.max(hi, al); break; }
      }
      if (hi >= lo) { cr.z = (lo + hi) / 2; cr.w = (hi - lo) / 2 + CROSS.w; }
    }
    const _sm = new THREE.Matrix4();
    const stagPlace = (st, o, out) => { const L = st.lane; if (st.file) return beside(o[0], o[3], out); return beside(o[0], L[0] + (L[1] - L[0]) * sstep(L[2], L[3], o[0]) + (L[4] - L[1]) * sstep(L[5], L[6], o[0]), out); };
    // where a stag is and what it holds, for the head of our flight at route metre sLens: out = [h, attitude, turn], and for a stag of
    // the file a fourth, its track's metres to the ridge's hand there
    const stagState = (st, sLens, time, out) => {
      const x = sLens - st.rise;
      let h = st.home, att = 0, turn = 1;
      const beat = Math.floor(time * 1.5 + st.phase * 2) & 1, paw = (Math.floor(time * 0.75 + st.phase * 4) & 3) === 0 ? 2 : 1;   // standing: a forefoot lifted one beat in four
      const gallop = STAG_RUN[Math.floor(time * 3.6 + st.phase * 3) % 3];   // the gallop: three attitudes in turn, 1.2 strides a second, from the clock alone
      if (st.file) {
        // the first herd's file: its place on the track by our route metre; standing till it runs, galloping, drawn up, lodged
        const sT = fileHead(sLens) - st.back, c0 = FILE.len[1] - 8, c1 = FILE.len[3] + 14; fileAt(sT, _ft);
        out[0] = _ft[0]; out[1] = sLens <= FILE.rise ? paw : sLens < FILE.done ? gallop : sLens < FILE.done + FILE.stand ? paw : 0;
        out[2] = -(FILE.nose[0] + (FILE.nose[1] - FILE.nose[0]) * sstep(c0, c1, sT)) / 65; out[3] = _ft[1]; return out;
      }
      if (x >= 18) {
        h = Math.min(st.home + 5 + st.v * (x - 18), sLens + st.berth); att = gallop; turn = RUN_TURN;   // running: up to its berth, then holding it
        if (h >= st.halt) { h = st.halt; att = paw; }            // drawn up, turned as it ran
      } else if (x >= 8) { h += 0.5 * (x - 8); att = beat ? 2 : 1; turn = 1 - (1 - RUN_TURN) * sstep(13, 18, x); } else if (x >= 0) att = 1;
      out[0] = h; out[1] = att; out[2] = turn; return out;
    };
    const STAG_TURN = 65 * RAD;
    {
      // as built, ON ITS REAL OUTLINE: every stag at every place it takes (the head of our flight every half metre of
      // the route), set as it is drawn (its own matrix, whichever way it is turned), in every attitude it can hold
      // there (lodged; standing or stepping, either forefoot lifted; the gallop's three, the extended one among them):
      // all its points, body, antlers to their tips and legs, against the flown line, less half its thickness and
      // its keyline. (A stag the measure left with room to spare is not gone over again until it has moved by that
      // room: its place's own move, and its nose's turning times the furthest any point of it lies along its nose,
      // are more than any point of it has moved. So too a place and attitude it held the step before.)
      const o = [0, 0, 0, 0], em = new Float32Array(16), ATTS = [[0], [1, 2], [1, 2], [3, 4, 5], [3, 4, 5], [3, 4, 5]]; em[5] = 1; em[15] = 1;
      let far = 0; for (const c of STAG_CL) for (let k = 0; k < c.pts.length; k += 2) far = Math.max(far, Math.abs(c.pts[k]));
      for (let i = 0; i < N_STAG; i++) {
        const st = stags[i]; let lx = 0, lz = 0, ln = 0, lm = 0, la = null, room = 0;
        for (let sL = 0, n = 0; sL <= H_END; sL += 0.5, n++) {
          stagState(st, sL, 0, o); stagPlace(st, o, _sr);
          const ta = o[2] * STAG_TURN * (st.lat > 0 ? 1 : -1), tc = Math.cos(ta), ts = Math.sin(ta), nx = _sr[2] * tc - _sr[3] * ts, nz = _sr[3] * tc + _sr[2] * ts;
          if (n % 32 === 31) await ctx.yield();
          if (ATTS[o[1]] === la && Math.hypot(_sr[0] - lx, _sr[1] - lz) + Math.hypot(nx - ln, nz - lm) * far <= room) continue;
          lx = _sr[0]; lz = _sr[1]; ln = nx; lm = nz; la = ATTS[o[1]]; room = Infinity;
          em[0] = nx; em[2] = nz; em[8] = -nz; em[10] = nx; em[12] = _sr[0]; em[14] = _sr[1];
          for (const a of la) room = Math.min(room, measure('stag', em, STAG_CL[a], 0.37 + STAG_KEY) - 0.01);
          room = Math.max(0, room);
        }
        await ctx.yield();
      }
    }
    const _so = [0, 0, 0, 0], stagCount = [0, 0, 0, 0, 0, 0];
    updaters.push((dt, time, u) => {
      const sLens = hOfU(u);   // (our place in route metres, metres of the way in plan)
      stagCount.fill(0);
      for (let i = 0; i < N_STAG; i++) {
        const st = stags[i];
        stagState(st, sLens, time, _so);
        stagPlace(st, _so, _sr);
        // columns: nose, up, the slab's normal. The nose is the heading turned toward the line by the stag's own turn
        const ta = _so[2] * STAG_TURN * (st.lat > 0 ? 1 : -1), tc = Math.cos(ta), ts = Math.sin(ta);
        const nx = _sr[2] * tc - _sr[3] * ts, nz = _sr[3] * tc + _sr[2] * ts;
        _sm.set(nx, 0, -nz, _sr[0], 0, 1, 0, 0, nz, 0, nx, _sr[1], 0, 0, 0, 1);
        const a = _so[1], k = stagCount[a]++;                        // each attitude's mesh holds only the stags holding it
        stagMeshes[a][0].setMatrixAt(k, _sm); stagMeshes[a][1].setMatrixAt(k, _sm);
      }
      for (let a = 0; a < 6; a++) { const pr = stagMeshes[a]; pr[0].count = pr[1].count = stagCount[a]; for (const x of pr) x.instanceMatrix.needsUpdate = true; }
    });
    await ctx.yield();
    // ---- STRIPED SLABS (paly, bendy): one colour and one metal in stripes across the slab's own
    // plane; where `counter` is set the two change places by the law of counterchange, per fragment.
    const stripedMat = (colourName, metalName, dirx, diry, width, counter, far) => new THREE.ShaderMaterial({
      uniforms: {
        ...style.uniforms, uCol: { value: T[colourName] }, uLeaf: { value: T[metalName] }, uDeep: { value: tones[metalName + 'Deep'] }, uCore: { value: tones[metalName + 'Core'] },
        uStripe: { value: new THREE.Vector4(dirx, diry, width, counter ? 1 : 0) }, uFar: { value: far ? 1 : 0 },
      },
      defines: { NCC_FAR: 1 }, vertexShader: style.glsl.vertex,
      fragmentShader: style.glsl.fragHead + style.glsl.metal + style.glsl.counter + /* glsl */`
        uniform vec3 uLeaf, uDeep, uCore, uCol; uniform vec4 uStripe; uniform float uFar;
        varying vec2 vFar;
        void main() {
          vec3 n = vN / max(length(vN), 1e-4);
          vec3 mc = nccMetal(uDeep, uLeaf, uCore, n, vT, vB, vW, vLeaf, vEdge);
          // THE STRIPES MERGE BY PAIRS, IN WHOLE STEPS (paint only; never a blend, never a tint): px3 is three pixels of the
          // thing's own width at its own place, one value over the whole thing. A PAVILION (uFar) is paly of eight across
          // its 8 m: eight panes while a pane is three pixels and more, then four, then two (per pale: its colour and its
          // metal, which lies lawfully on any ground behind its keyline); only a tent under three pixels wide altogether is
          // one tincture, its pair's metal. A LANCE is bendy: its bends double once, and under three pixels wide it is its metal.
          float px3 = vFar.x * 3., tw; bool one;
          if (uFar > 0.5) {
            float n = px3 <= 1. ? 8. : px3 <= 2. ? 4. : 2.;
            float s = clamp((vLeaf.x + 4.) * n / 8., 0.001, n - 0.001);
            tw = abs(fract(s * 0.5 + 0.25) - 0.5) * 2. - 0.5; one = px3 > 8.;
          } else {
            float f = dot(vLeaf, uStripe.xy) / max(px3 <= uStripe.z ? uStripe.z : 2. * uStripe.z, 1e-3);
            tw = abs(fract(f * 0.5) - 0.5) * 2. - 0.5; one = px3 > 2. * uStripe.z;
          }
          float par = clamp(tw / max(fwidth(tw), 1e-4) + 0.5, 0., 1.);
          float g = nccGroundAA(vW.xz);
          par = mix(par, abs(par - (1. - g)), uStripe.w);
          gl_FragColor = vec4(one ? mc : mix(uCol, mc, par), 1.);
        }`,
    });

    // ---- PARTED SLABS (the great pavilions): one colour and one metal by a plain line of partition across the slab's own
    // plane (a marquee 10.4 m across and 9 m tall as cut), the two changing places by the law of counterchange, per fragment.
    // kind: 0 bendy, 1 chevronny, 2 per pale, 3 per fess (at the eaves), 4 per bend.
    // THE PARTED THINGS' PASS-OVERS (partOf: a branch on tinctures only). Which of a thing's two tinctures lies over
    // the other is the ground's to say, fragment by fragment (the law of counterchange), so a pair is passed over in
    // either order. PER FESS is never taken by
    //   sable with argent: the Templars' banner (black over white), Fribourg's and Ulm's shields, Siena's balzana;
    //   sable with or:     Wuerttemberg's colours (black over gold);
    //   vert with argent:  Saxony's flag (white over green).
    // There the thing is parted per bend.
    const partOf = (colourName, metalName, kind) => (kind === 3 && ((colourName === 'sable' && (metalName === 'argent' || metalName === 'or')) || (colourName === 'vert' && metalName === 'argent')) ? 4 : kind);
    const partedMat = (colourName, metalName, kind) => new THREE.ShaderMaterial({
      uniforms: { ...style.uniforms, uCol: { value: T[colourName] }, uLeaf: { value: T[metalName] }, uDeep: { value: tones[metalName + 'Deep'] }, uCore: { value: tones[metalName + 'Core'] }, uPart: { value: kind } },
      vertexShader: style.glsl.vertex,
      fragmentShader: style.glsl.fragHead + style.glsl.metal + style.glsl.counter + /* glsl */`
        uniform vec3 uLeaf, uDeep, uCore, uCol; uniform float uPart;
        void main() {
          vec3 n = vN / max(length(vN), 1e-4);
          vec3 mc = nccMetal(uDeep, uLeaf, uCore, n, vT, vB, vW, vLeaf, vEdge);
          vec2 q = vec2(vLeaf.x, vLeaf.y - 4.5);
          float tw = q.x;
          if (uPart < 0.5) tw = abs(fract((q.x + q.y) / 3.2) - 0.5) * 2. - 0.5;
          else if (uPart < 1.5) tw = abs(fract((q.y + abs(q.x)) / 3.2) - 0.5) * 2. - 0.5;
          else if (uPart < 2.5) tw = q.x;
          else if (uPart < 3.5) tw = q.y + 0.75;
          else tw = q.x * 0.87 + q.y;
          float par = clamp(tw / max(fwidth(tw), 1e-4) + 0.5, 0., 1.);
          par = abs(par - (1. - nccGroundAA(vW.xz)));
          gl_FragColor = vec4(mix(uCol, mc, par), 1.);
        }`,
    });

    // ---- THE TREES ERADICATED: one kind, a slab crown of three lobes to either hand (drawn and fructed, below) on a trunk with three bare roots,
    // 24 m tall as cut and set half as large again and more (few and large, so each reads as a tree); vert on metal
    // ground, argent on colour. THE GROVE'S PLACE: on the hub's hand, 40 to 220 m from the way, beyond line A; none stands
    // within 250 m of the entry (the gate we come in by) nor beside the first 100 m of the way, so the first field lies
    // open about the entry; clear of the stags' lanes, the river, the fountain, the keep and the lists.
    const treeRng = rng_fork(ctx.rng, 'trees');
    const TREE = [[-3.6, 0, 1], [-1.6, 1.3], [-0.9, 0.9], [0, 0, 1], [0.9, 0.9], [1.6, 1.3], [3.6, 0, 1], [1.5, 2.6], [0.9, 5], [0.9, 8.5, 1],
      [4.2, 7.4], [7.6, 9.2], [8.2, 12.6], [5.6, 14.2], [7.4, 16], [7, 19.2], [4.2, 19.8], [4.6, 22.4], [2.2, 24], [0, 22.8],
      [-2.2, 24], [-4.6, 22.4], [-4.2, 19.8], [-7, 19.2], [-7.4, 16], [-5.6, 14.2], [-8.2, 12.6], [-7.6, 9.2], [-4.2, 7.4],
      [-0.9, 8.5, 1], [-0.9, 5], [-1.5, 2.6]];
    {
      const treeOl = style.outline(TREE, 3), tg = style.slab(treeOl, { thickness: 0.9, keyline: 0.3, rim: 0.2, keyInset: 0.08 });
      const want = D.count(34), places = [];
      // THREE TREES ERADICATED BY THE LISTS (the crew lead's ruling; a place, the same on every seed). ROUND 11: THEY STAND
      // BEYOND THE RING'S PLANE, AT THE FOOT OF THE STEPS' LAST DEGREE AND THE MOUNT (abeam of route metres 955, 1003 and
      // 1010 of the exit's line run on, 165 to 205 m from it, 38 to 41 m tall), their faces back along the way and turned
      // 35 degrees toward its line: from the whole last stretch they are seen whole and small at the mount's foot, under
      // the lion, and the picture's side never crosses them while the look is on the lion or the ring.
      for (const [h, lat, sc] of [[955, 178, 1.6], [1003, 205, 1.7], [1010, 165, 1.6]]) {
        const c35 = Math.cos(35 * RAD), s35 = Math.sin(35 * RAD);
        beside(h, lat, _sr); places.push([_sr[0], _sr[1], -_sr[2] * c35 - _sr[3] * s35, -_sr[3] * c35 + _sr[2] * s35, 0, sc]);
      }
      for (let tries = 0; places.length < want && tries < want * 90; tries++) {
        if (tries % 400 === 399) await ctx.yield();
        const h = treeRng.range(-30, H_END - 20), lat = -treeRng.range(40, 220), tw = treeRng.range(-0.35, 0.35), sc = treeRng.range(1.45, 1.9);
        if (h > 80 && lat > -100) continue;                         // the stags' lanes and the lists
        if (h > H_B + 20 && -lat < campFront(h) + 84) continue;     // the camp, to its last row
        if (h < 100) continue;                                      // no tree beside the first 100 m of the way
        beside(Math.max(h, 0), lat, _sr); if (h < 0) _sr[1] += h;
        if (Math.hypot(_sr[0], _sr[1]) < 250) continue;              // (nor within 250 m of the entry itself, a place: the first field lies open about it)
        const rx = _sr[0] - HUB[0], rz = _sr[1] - HUB[1], rr = Math.hypot(rx, rz), uA = style.uniforms.uCcA.value, uB = style.uniforms.uCcB.value;
        if (rr < 50 || (Math.abs(uB.x * rz - uB.y * rx) < 45 && uB.x * rx + uB.y * rz > 0)) continue;   // the fountain; the river and its banks (25 m of water to either hand of line B, the crown's reach, a margin)
        // THE GROVE STANDS BEYOND LINE A (a rule of the fields, not of any picture): the first field, the fur we enter over, carries
        // only its spots, the herd and the three trees at its wall's foot (round 14); the grove's trees are charges of the
        // counterchanged fields, on the ring's side of line A
        routeXZ(H_END, _r);
        if ((uA.x * rz - uA.y * rx) * (uA.x * (_r[1] - HUB[1]) - uA.y * (_r[0] - HUB[0])) <= 0) continue;
        if (Math.hypot(_sr[0] - KEEP[0], _sr[1] - KEEP[1]) < 30) continue;   // none by the keep
        if (places.some((q) => Math.hypot(q[0] - _sr[0], q[1] - _sr[1]) < 34)) continue;
        // the face: back along the route, turned 35 degrees toward the line (as the pavilions stand)
        const c35 = Math.cos(35 * RAD), s35 = Math.sin(35 * RAD);
        places.push([_sr[0], _sr[1], -_sr[2] * c35 + _sr[3] * s35, -_sr[3] * c35 - _sr[2] * s35, tw, sc]);
      }
      // ROUND 14 (T2b), THE TREES AT THE FIRST WALL'S FOOT (a rule of the wall, the same on every seed; they are set
      // after the grove is dealt, so no deal shifts): TWO THREES of the fair's fruited trees stand before the terrace's
      // face, the first in the first field and the second beyond line A, each three midway between two shields of the roll (arcs 415 and 557 of the road: 120
      // to 159 and 204 to 248 m of our way abeam, 161 to 201 m from it), its trees FOOT.gap (34) m apart, 36 m tall and
      // the middle one 40; FOOT.out (7) m before the face (their crowns' far ends 2 m from it), their faces turned FOOT.turn (25) degrees from the wall's
      // own toward the entry, the way we come. Shield, three trees, shield, three trees, shield: the wall's foot is no
      // longer bare. The tree takes the tincture the ground under it calls for, as every tree does: vert fructed or on
      // the ermine, argent fructed gules beyond line A. The herd's file runs and is drawn up along the wall's foot, its track 11.7 m and more from their feet.
      const FOOT = { gap: 34, out: 7, turn: 25, sc: [1.5, 1.65, 1.5] };
      const _c0 = [0, 0], _c1 = [0, 0];
      for (const c of [ROLL.pens[0], (ROLL.at[1] + ROLL.at[2]) / 2]) for (let k = -1; k <= 1; k++) {
        const sA = c + k * FOOT.gap; crestXZ(sA, _c0); crestXZ(sA + 1, _c1);
        const ex = _c1[0] - _c0[0], ez = _c1[1] - _c0[1], el = Math.hypot(ex, ez) || 1, nx = -ez / el, nz = ex / el, ct = Math.cos(FOOT.turn * RAD), sn = Math.sin(FOOT.turn * RAD);
        places.push([_c0[0] + nx * (ROAD.out + FOOT.out), _c0[1] + nz * (ROAD.out + FOOT.out), nx * ct - ex / el * sn, nz * ct - ez / el * sn, 0, FOOT.sc[k + 1]]);
      }
      // (no tree stands on the ridge: its vert is bare under the lion's paws, by the crew lead's ruling)
      const tm = new THREE.InstancedMesh(tg.geometry, style.counter('vert', 'argent'), places.length);
      const tk = new THREE.InstancedMesh(tg.keyGeometry, style.keyline({ keyWidth: 0.3 }), places.length);
      // THE TREE IS DRAWN AND FRUCTED (round 8). DRAWN: sable lines on both its faces (slabs a hand proud of the crown): the
      // trunk goes up into the crown as a bough that forks three times to either hand, a line runs in from every notch
      // between two lobes (six lobes: three to a hand), and two lines run down the trunk. FRUCTED: seven
      // roundels 3 m across as cut, one in every lobe and one at the heart, each keylined: OR on the tree where it is
      // vert (on metal ground), GULES where it is argent (on colour ground): the fruit is counterchanged with its tree.
      const ribbon = (pts, wd) => {
        const L = [], R = [];
        pts.forEach((q, i) => {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          const hw = wd * (i === 0 || i === pts.length - 1 ? 0.3 : 0.5);                       // (a stroke tapers at its two ends)
          L.push([q[0] - dy / l * hw, q[1] + dx / l * hw]); R.push([q[0] + dy / l * hw, q[1] - dx / l * hw]);
        });
        return L.concat(R.reverse());
      };
      const strokes = [[[0, 8.2], [0, 13], [0, 17.5], [0, 20.6]], [[-0.35, 2.8], [-0.3, 5], [-0.35, 7.6]], [[0.4, 3.6], [0.35, 5.6], [0.4, 8]]];
      for (const sx of [-1, 1]) {
        strokes.push([[0, 10.2], [sx * 2.2, 11.4], [sx * 4.4, 11.2]], [[0, 14.2], [sx * 2, 16.2], [sx * 3.9, 16.9]], [[0, 18.2], [sx * 1.3, 20.2], [sx * 2.3, 21.4]]);
        strokes.push([[sx * 5.3, 14.2], [sx * 3.9, 13.9], [sx * 2.7, 13.1]], [[sx * 3.9, 19.7], [sx * 2.9, 19.2], [sx * 2, 18.3]], [[sx * 4.0, 7.7], [sx * 3.2, 8.6], [sx * 2.2, 9]]);
      }
      const lineGeo = mergeGeometries(strokes.map((q) => style.slab(ribbon(q, 0.5), { thickness: 1.12, keyline: 0, rim: 0.02 }).geometry), false);
      const tl = new THREE.InstancedMesh(lineGeo, style.colour('sable'), places.length);
      const disc = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * Math.PI; disc.push([1.5 * Math.cos(a), 1.5 * Math.sin(a)]); }
      const fruitAt = [[0, 15.6], [-5.6, 10.8], [5.6, 10.8], [-5.2, 17.2], [5.2, 17.2], [-2.5, 21.7], [2.5, 21.7]];
      const fs = style.slab(disc, { thickness: 1.5, keyline: 0.28, rim: 0.12, keyInset: 0.06 });
      const fruitGeo = mergeGeometries(fruitAt.map((q) => fs.geometry.clone().translate(q[0], q[1], 0)), false), fruitKeyGeo = mergeGeometries(fruitAt.map((q) => fs.keyGeometry.clone().translate(q[0], q[1], 0)), false);
      const tf = new THREE.InstancedMesh(fruitGeo, style.counter('gules', 'or', { fruit: true }), places.length), tfk = new THREE.InstancedMesh(fruitKeyGeo, style.keyline({ keyWidth: 0.28 }), places.length);
      // (its clear air as built, on its real outline: the crown, trunk and roots as cut, less half the thickness of
      // the lines drawn on it and its keyline; and its seven fruit, each disc as cut, less half a fruit's thickness
      // and its keyline)
      const treeCl = cloudOf([treeOl], 1), fruitCl = cloudOf(fruitAt.map((f) => disc.map((d) => [d[0] + f[0], d[1] + f[1]])), 1);
      for (let i = 0; i < places.length; i++) {
        const q = places[i], c = Math.cos(q[4]), sn = Math.sin(q[4]), zx = q[2] * c - q[3] * sn, zz = q[2] * sn + q[3] * c;   // the face, with the hand's small twist
        _m4.set(zz * q[5], 0, zx, q[0], 0, q[5], 0, 0, -zx * q[5], 0, zz, q[1], 0, 0, 0, 1);
        tm.setMatrixAt(i, _m4); tk.setMatrixAt(i, _m4); tl.setMatrixAt(i, _m4); tf.setMatrixAt(i, _m4); tfk.setMatrixAt(i, _m4);
        measure('tree', _m4.elements, treeCl, 0.56 + 0.3 * q[5]); measure('tree (its fruit)', _m4.elements, fruitCl, 0.75 + 0.28 * q[5]);
        if (i % 8 === 7) await ctx.yield();
      }
      for (const x of [tm, tk, tl, tf, tfk]) x.frustumCulled = false;
      tm.name = 'trees'; tk.name = 'trees-key'; tl.name = 'trees-lines'; tf.name = 'trees-fruit'; tfk.name = 'trees-fruit-key'; scene.add(tm, tk, tl, tf, tfk);
    }
    await ctx.yield();

    // ---- THE EXIT: two lances 62 m tall and 17 m apart, bendy in the plain's pair, hold between them
    // 40 m up a plain gold ring 14 m across inside, its band 1.2 m; the portal fills the ring.
    const exitFrame = path.frameAt(1, new THREE.Matrix4(), true);
    const ringOutline = [];
    for (let i = 0; i <= 64; i++) { const a = (-90 + 0.4 + (359.2 * i) / 64) * RAD; ringOutline.push([8.3 * Math.cos(a), 8.3 * Math.sin(a)]); }
    for (let i = 64; i >= 0; i--) { const a = (-90 + 0.4 + (359.2 * i) / 64) * RAD; ringOutline.push([7.1 * Math.cos(a), 7.1 * Math.sin(a)]); }
    const ringSlab = style.slab(ringOutline, { thickness: 0.8, keyline: 0.28, rim: 0.25, keyInset: 0.1 });
    {
      // the band is burnished round: its leaf is domed across the band, from the inner edge to the outer
      const ps = ringSlab.geometry.attributes.position, nr = ringSlab.geometry.attributes.normal, dm = ringSlab.geometry.attributes.aDome;
      for (let i = 0; i < ps.count; i++) {
        if (Math.abs(nr.getZ(i)) < 0.5) continue;
        const x = ps.getX(i), y = ps.getY(i), r = Math.hypot(x, y) || 1, across = Math.max(-1, Math.min(1, (r - 7.7) / 0.6)) * 5.5;
        dm.setXY(i, x / r * across, y / r * across);
      }
    }
    const ring = new THREE.Group(); ring.name = 'ring';
    ring.add(new THREE.Mesh(ringSlab.geometry, style.metal('or')), new THREE.Mesh(ringSlab.keyGeometry, style.keyline({ keyWidth: 0.28 })));
    {
      // (THE BAND IS WHOLE: where its outline closes, at the foot, a leaf of the same gold lies over the join, a hair proud
      // of the band on either face, so that no line crosses the band under the disc)
      const patchOutline = [];
      for (let i = 0; i <= 8; i++) { const a = (-97 + (14 * i) / 8) * RAD; patchOutline.push([8.015 * Math.cos(a), 8.015 * Math.sin(a)]); }
      for (let i = 8; i >= 0; i--) { const a = (-97 + (14 * i) / 8) * RAD; patchOutline.push([7.385 * Math.cos(a), 7.385 * Math.sin(a)]); }
      const patch = style.slab(patchOutline, { thickness: 0.92, keyline: 0.05, rim: 0.02, keyInset: 0.01 });
      const ps = patch.geometry.attributes.position, nr = patch.geometry.attributes.normal, dm = patch.geometry.attributes.aDome;
      for (let i = 0; i < ps.count; i++) {
        if (Math.abs(nr.getZ(i)) < 0.5) continue;
        const x = ps.getX(i), y = ps.getY(i), r = Math.hypot(x, y) || 1, across = Math.max(-1, Math.min(1, (r - 7.7) / 0.6)) * 5.5;
        dm.setXY(i, x / r * across, y / r * across);
      }
      patch.keyGeometry.dispose();
      const pm = new THREE.Mesh(patch.geometry, ring.children[0].material); pm.name = 'ring-join'; ring.add(pm);
    }
    ring.applyMatrix4(exitFrame);
    scene.add(ring);
    // (the band's clear air, measured on the band as cut and set, less half its thickness and its keyline: the flown
    // line ends at its middle)
    measure('ring band', exitFrame.elements, cloudOf([ringOutline], 0.5), 0.4 + 0.28);
    {
      const lanceOl = [[-0.75, 0], [0.75, 0], [0.6, 57], [1.3, 57.6], [0, 62], [-1.3, 57.6], [-0.6, 57]], lanceCl = cloudOf([lanceOl], 0.5);
      const lance = style.slab(lanceOl, { thickness: 0.7, keyline: 0.3, rim: 0.15, keyInset: 0.08 });
      const lancePair = pc === 'gules' ? D.rowPairs[0] : [pc, pm];   // bendy in the plain's pair, unless that is gules with a metal (never on cloth or lance): then the first row's pair
      const lm = new THREE.InstancedMesh(lance.geometry, stripedMat(lancePair[0], lancePair[1], 0.7071, 0.7071, 1.5, false), 2);
      const lk = new THREE.InstancedMesh(lance.keyGeometry, style.keyline({ keyWidth: 0.3 }), 2);
      const e = path.end, t = path.endTangent, tl = Math.hypot(t.x, t.z) || 1, fx = t.x / tl, fz = t.z / tl;
      [-1, 1].forEach((sd, i) => {
        // each lance stands on the ground 8.5 m plus half its width to one side of the ring's middle, its face square to the flown line
        const lx = e.x + fz * sd * 9.35, lz = e.z - fx * sd * 9.35;
        _m4.set(-fz, 0, -fx, lx, 0, 1, 0, 0, fx, 0, -fz, lz, 0, 0, 0, 1);
        lm.setMatrixAt(i, _m4); lk.setMatrixAt(i, _m4);
        measure('exit lance', _m4.elements, lanceCl, 0.35 + 0.3);   // (the lance as cut, foot to point, less half its thickness and its keyline)
      });
      lm.frustumCulled = false; lk.frustumCulled = false; lm.name = 'lances'; scene.add(lm, lk);
    }
    await ctx.yield();
    // ---- THE FLIGHT
    const SPEEDS = [[0, 15], [90, 17], [175, 19.5], [321, 18], [537, 14.5], [617, 18]];   // metres along the route, m/s (the journey's)
    const pace = (u) => {
      const sAt = u * path.length; let v = SPEEDS[0][1];   // metres along the path as built
      for (let i = 1; i < SPEEDS.length; i++) v += (SPEEDS[i][1] - SPEEDS[i - 1][1]) * sstep(SPEEDS[i][0] - 18, SPEEDS[i][0] + 18, sAt);
      return v / 17.1;
    };
    // ---- THE GAZE (ROUND 13: ONE LOOK FOR THE WHOLE WAY; a pure function of our place on the way, typed in route metres
    // and in places of the world; the same on every seed and at every hour: the sun's bearing is taken as by day).
    // WHAT IT KEEPS, the whole way: while the lion is in the picture it is WHOLE in it (its far end GZ_IN degrees inside
    // the picture's ridge side, its top GZ_TOP degrees under the picture's top), standing, wheeling and running; the
    // sun is whole in the picture or out of it but while the gaze turns (at the gate, to meet the lion, to and from its rearing).
    //   ENTRY TO A THIRD OF THE STREET: the gaze rests FIELD_LEFT degrees to the ridge's hand of our heading (the lion on
    //     its road, the herd in the field under it), and further round only as the lion's far end asks: at the river
    //     crossing, where it stands nearest, wheels and runs off, the gaze goes with it.
    //   DOWN THE STREET the fields' law holds: the lion runs down the red wall and roars from its end, whole.
    //   THE GATE'S APPROACH (S8), from GZ.arch[0] to GZ.arch[1] m short of line C (the lion has bounded down behind its
    //     wall: it stands 46 degrees to the ridge's hand of the arch's axis, outside any picture that has the arch in
    //     its middle): ONE TURN to THE ARCH'S OWN MIDDLE (the place GZ.arch[2] m beyond it, square to the
    //     gate), and the gaze RESTS THROUGH THE ARCH on the lists: the opening in the middle of the picture, a jamb and
    //     a tower to either hand (neither wall more than a third of the picture's breadth), the great standard in the
    //     opening; the two jambs leave by both sides together, some 18 m short of the arch (the opening is 30 m wide).
    //   THROUGH THE ARCH AND THE LISTS' FIRST 80 m: over the last GZ.hid m before the arch (nothing of the gate is in the
    //     picture then but its opening), ONE TURN of GZ.turn m of route to THE LISTS WITH THE SUN AHEAD:
    //     the bearing at which the sun in splendour stands whole, 2 degrees inside the picture's hub side; the tilt, the
    //     banners and the ring lie in the picture and the lion waits in its low way behind us.
    //   THE LION COMES PAST (from 80 m past line C): ONE TURN of 22 m of route to the ridge's hand MEETS IT as it runs down
    //     its degrees (the sun passes out of the picture), and the gaze goes with it, its streaming tail just inside the
    //     picture, to its mount by the ring; there it rests between the lion's far flank and the sun's outer rays, the
    //     lion kept whole, and goes over to the lion as it rears (from 31 to 55 m past the climb's foot); the engine
    //     alone eases the gaze into the ring.
    // (HALF_PIC: half the width of a 16:9 picture at this world's field of view; 25: half its height: typed constants,
    // not readings of the lens.)
    const HALF_PIC = Math.atan(Math.tan(25 * RAD) * 16 / 9) / RAD, SUN_AZ = EXIT_HEADING + Math.min(32, HOURS[D.hour][0]), SUN_RAYS = 12;
    const RAYS_EDGE = SUN_AZ - SUN_RAYS - HALF_PIC;      // the bearing of the gaze at which the picture's hub side touches the rays' reach
    const GZ = { step: 2, in: 2.5, top: 3, env: 5, fieldLeft: 16, arch: [44, 32, 6], hid: 12, turn: 12, meet0: 80, meet1: 102, rear: [31, 55, 75, 99], sunIn: 2 };
    const GZ_N = Math.ceil(H_END / GZ.step) + 1, gzL = new Float32Array(GZ_N), gzT = new Float32Array(GZ_N), gzS = new Float32Array(GZ_N), gzH = new Float32Array(GZ_N), gzK = new Float32Array(GZ_N), gzN = new Float32Array(GZ_N);
    // THE FIRST FIELDS: THE LOOK RESTS ON THE WALL (round 15; a law of the gaze's aim at a thing of the world, as the
    // lion's top is; typed from the terrace's own height and place and from the place of the head of our flight, and
    // from nothing else). From the entry to WALL_OUT[0] (60 m short of line B, the river's) the gaze's tilt aims at THE MIDDLE OF THE TERRACE'S FACE:
    // WALL_MID, half the height of its merlons' tops (the walk, the kerb and the merlons as the road holds them), at
    // the plan distance from us to the NEAREST place of the face (FACE: the crest's plan line from ROAD.t0 to ROAD.b0,
    // ROAD.out m before it, a point every 10 m of its arc). It is given up between WALL_OUT (route metres: 60 to 20 m short of line B) for the 4
    // degrees the gaze held there before. The lion's top, where it asks more, rules as it did.
    const WALL_MID = (ROAD.yT + ROAD.kerb + ROAD.merlon[1]) / 2, WALL_OUT = [H_B - 60, H_B - 20], FACE = [];
    { const a = [0, 0], b = [0, 0];
      for (let d = ROAD.t0; d <= ROAD.b0 + 1e-6; d += 10) { crestXZ(d, a); crestXZ(d + 1, b); const ex = b[0] - a[0], ez = b[1] - a[1], el = Math.hypot(ex, ez) || 1; FACE.push(a[0] - ez / el * ROAD.out, a[1] + ex / el * ROAD.out); } }
    const faceNear = (x, z) => {
      let best = Infinity;
      for (let i = 0; i + 3 < FACE.length; i += 2) {
        const sx = FACE[i + 2] - FACE[i], sz = FACE[i + 3] - FACE[i + 1], t = Math.min(1, Math.max(0, ((x - FACE[i]) * sx + (z - FACE[i + 1]) * sz) / (sx * sx + sz * sz)));
        best = Math.min(best, Math.hypot(FACE[i] + sx * t - x, FACE[i + 1] + sz * t - z));
      }
      return best;
    };
    // (the aim's tilt, degrees, when the head of our flight is at route metre h, at the place e)
    const wallAim = (h, e) => { const wo = sstep(WALL_OUT[0], WALL_OUT[1], h); return wo < 1 ? Math.atan2(WALL_MID - e.y, faceNear(e.x, e.z)) / RAD * (1 - wo) + 4 * wo : 4; };
    {
      // the lion as it stands at every GZ.step m of our way: the bearing of its far end (the lesser of its two ends':
      // degrees from +Z toward the hub's side), the elevation of its top and of its shoulders, and our own heading;
      // then, so that the gaze never jerks with a wheel or a bound, the far end and the top are taken as the furthest
      // and the highest over GZ.env places to either side, and evened over the same
      const a = new THREE.Vector3(), b = new THREE.Vector3(), e = new THREE.Vector3(), t = new THREE.Vector3(), rL = new Float32Array(GZ_N), rT = new Float32Array(GZ_N), rS = new Float32Array(GZ_N), rK = new Float32Array(GZ_N), rN = new Float32Array(GZ_N), so = [0, 0, 0, 0], sr = [0, 0, 0, 1];
      for (let i = 0; i < GZ_N; i++) {
        const u = uOfM(Math.min(H_END, i * GZ.step)); path.pointAt(u, e); path.tangentAt(u, t); gzH[i] = Math.atan2(-t.x, t.z) / RAD;
        const yb = hero.lionEnds(u, a, b), dist = Math.min(Math.hypot(a.x - e.x, a.z - e.z), Math.hypot(b.x - e.x, b.z - e.z));
        // (in its low way the lion asks nothing of the gaze: its ends are taken 60 degrees off, by its depth's share)
        const sunk = lionSunk(hero.solveAt(u).at), bA = Math.atan2(-(a.x - e.x), a.z - e.z) / RAD, bB = Math.atan2(-(b.x - e.x), b.z - e.z) / RAD;
        rL[i] = Math.min(bA, bB) + 60 * sunk; rN[i] = Math.max(bA, bB) - 60 * sunk;
        // THE FIRST HERD: the bearing of the ridge-most end of every stag that stands taller than a sixth of the picture
        // (nearer than HERD.tall m: at the picture's side a thing stands 1.3 times as tall in it as in its middle; a
        // lodged stag, HERD.low as tall, so much nearer; beyond that the stag's claim falls away over 14 m) and is not behind us
        let hk = gzH[i] + 40;
        for (let s = 0; s < N_HERD1; s++) {
          stagState(stags[s], i * GZ.step, 0, so); stagPlace(stags[s], so, sr);
          const ta = so[2] * STAG_TURN, tc = Math.cos(ta), ts = Math.sin(ta), nx = (sr[2] * tc - sr[3] * ts) * STAG_REACH, nz = (sr[3] * tc + sr[2] * ts) * STAG_REACH;
          if ((sr[0] - e.x) * t.x + (sr[1] - e.z) * t.z < 0) continue;
          const sd = Math.hypot(sr[0] - e.x, e.y - 10, sr[1] - e.z);
          hk = Math.min(hk, Math.min(Math.atan2(-(sr[0] + nx - e.x), sr[1] + nz - e.z), Math.atan2(-(sr[0] - nx - e.x), sr[1] - nz - e.z)) / RAD + 50 * sstep(-4, 10, sd - HERD.tall * (so[1] === 0 ? HERD.low : 1)));
        }
        rK[i] = hk;
        rT[i] = Math.atan2(a.y - e.y, dist) / RAD; rS[i] = Math.atan2(yb + 10 - e.y, dist) / RAD;
        if (i % 40 === 39) await ctx.yield();
      }
      const ext = (r, o, sg) => { const m = new Float32Array(GZ_N); for (let i = 0; i < GZ_N; i++) { let v = r[i]; for (let j = Math.max(0, i - GZ.env); j <= Math.min(GZ_N - 1, i + GZ.env); j++) v = sg < 0 ? Math.min(v, r[j]) : Math.max(v, r[j]); m[i] = v; }
        for (let i = 0; i < GZ_N; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - GZ.env); j <= Math.min(GZ_N - 1, i + GZ.env); j++) { s += m[j]; n++; } o[i] = s / n; } };
      ext(rL, gzL, -1); ext(rT, gzT, 1); ext(rS, gzS, 1); ext(rK, gzK, -1); ext(rN, gzN, 1);
    }
    const gzAt = (arr, h) => { const x = Math.min(GZ_N - 1.001, Math.max(0, h / GZ.step)), i = Math.floor(x); return arr[i] + (arr[i + 1] - arr[i]) * (x - i); };
    const _gs = [0, 0, 0, 1], _ge = new THREE.Vector3(), _gv = new THREE.Vector3();
    // (the arch's own middle: the place GZ.arch[2] m beyond it on its axis, square to the gate; our line goes through it)
    const AXIS = (() => { const q = beside(H_C, 0, [0, 0, 0, 1]); return [q[0] + q[2] * GZ.arch[2], q[1] + q[3] * GZ.arch[2]]; })();
    const gazeAt = (h, u, out) => {
      path.pointAt(u, _ge);
      const head = gzAt(gzH, h), farL = gzAt(gzL, h), keepL = farL + HALF_PIC - GZ.in;
      // the gate's arch: a place of our own line 30 m beyond the gate, 3 m over the line there; within 40 m of it the place 40 m on
      const hT = Math.max(H_C + 30, h + 40); routeXZ(hT, _gs);
      const dx = _gs[0] - _ge.x, dz = _gs[1] - _ge.z, elArch = Math.atan2(routeY(hT) + 3 * (1 - sstep(H_C - 10, H_C + 20, h)) - _ge.y, Math.hypot(dx, dz) || 1) / RAD;
      const azSun = SUN_AZ + SUN_RAYS - HALF_PIC + GZ.sunIn;
      // the last straight: midway between the lion's far end and the rays' outer reach, the lion whole; as it rears, to the lion
      const rest = Math.min(keepL, (SUN_AZ + SUN_RAYS + gzAt(gzL, h)) / 2), toLion = sstep(H_CLIMB + GZ.rear[0], H_CLIMB + GZ.rear[1], h) * (1 - sstep(H_CLIMB + GZ.rear[2], H_CLIMB + GZ.rear[3], h));
      const azEnd = rest + (Math.min(rest, RAYS_EDGE - 9) - rest) * toLion;
      const w2 = sstep(H_C - GZ.arch[0], H_C - GZ.arch[1], h), w3 = sstep(H_C - GZ.hid, H_C - GZ.hid + GZ.turn, h), w4 = sstep(H_C + GZ.meet0, H_C + GZ.meet1, h);
      const azAxis = Math.atan2(-(AXIS[0] - _ge.x), AXIS[1] - _ge.z) / RAD;
      // (the fields: the rest, and further round as the lion's far end or a tall stag's asks; never so far that the
      // lion's hub-most end, where it shows, comes to the picture's hub side)
      let az = Math.max(Math.min(head - GZ.fieldLeft, keepL, gzAt(gzK, h) + HALF_PIC - GZ.in), Math.min(keepL, gzAt(gzN, h) - HALF_PIC + GZ.in));
      az += (azAxis - az) * w2; az += (azSun - az) * w3; az += (azEnd - az) * w4;
      // (the lion's top in the picture: a thing off the picture's middle stands higher in it than its own elevation, by
      // the cosine of its bearing from the gaze; the top is taken at the lion's far end, where that is most)
      const elClear = Math.atan(Math.tan(gzAt(gzT, h) * RAD) / Math.cos(Math.min(HALF_PIC, Math.max(0, az - farL)) * RAD)) / RAD + GZ.top - 25;
      // its height: from the entry to 60 m short of line B on the middle of the terrace's face, given up by 20 m short of it (THE LOOK RESTS ON THE WALL, above),
      // then 4 degrees up; never lower than the lion's top allows (the lion's term as it stood: half a degree more
      // over the lion's top until route metre STOOP1 - 60, given up by STOOP1 + 5); down
      // the street on the arch; through the lists along our own line; from the meeting between our line and the lion's shoulders
      const ws = sstep(STOOP1 - 60, STOOP1 + 5, h);
      let el = Math.max(wallAim(h, _ge), elClear + 0.5 * (1 - ws));
      el += (Math.max(elArch, elClear) - el) * w2; el += (elArch - el) * w3; el += (Math.max(0.38 * elArch + 0.62 * gzAt(gzS, h), elClear) - el) * w4;
      const c = Math.cos(el * RAD);
      return out.set(_ge.x - Math.sin(az * RAD) * c * 2000, _ge.y + Math.sin(el * RAD) * 2000, _ge.z + Math.cos(az * RAD) * c * 2000);
    };
    const pois = [{ at: (time, u) => gazeAt(hOfU(u), u, _gv), from: -1, to: 2, fade: 0.1, weight: 0.95 }];
    await ctx.yield();
    // ---- THE PICTURE'S FOOT, AS FLOWN (round 10; worked out here, at the build, from the route's own course and heights
    // and the looks above; nothing reads the lens): a model of where the picture stands at route metre h, laid as the
    // flight itself lays it: the eye on the flown line, the line of sight to the line's own place CAM.lookAhead m on,
    // drawn to each look by its own share, banked with the turn. FOOT[i] is the picture at route metre FOOT_H0 + 2 i:
    // eye, right, up, forward. footCuts(pts): is this outline (points [x, y, z] in order) crossed by the foot of the
    // picture, 16:9 or 21:9, at any of those places while it stands taller than a twentieth of the picture's height?
    const CAM = { fov: 50, near: 0.5, far: 9000, lookAhead: 24, sway: 0.5, bank: 0.25 };
    const FOOT_H0 = H_B - 60, FOOT = [], FOOT_TAN = Math.tan(CAM.fov * RAD / 2);
    {
      const e = new THREE.Vector3(), a = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Vector3(), t0 = new THREE.Vector3(), t1 = new THREE.Vector3(), r = new THREE.Vector3(), up = new THREE.Vector3();
      for (let h = FOOT_H0, i = 0; h <= H_END; h += 2, i++) {
        const u = uOfM(h); path.pointAt(u, e); path.posAtDist(u * path.length + CAM.lookAhead, a); d.subVectors(a, e).normalize();
        const guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
        for (const poi of pois) {
          const wt = bell(u, poi.from ?? 0, poi.to ?? 1, poi.fade ?? 0.3) * (poi.weight ?? 0.5) * guard; if (wt <= 0.001) continue;
          q.copy(poi.at(0, u)).sub(e).normalize(); d.multiplyScalar(1 - wt).addScaledVector(q, wt).normalize();
        }
        path.tangentAtDist(u * path.length, t0); path.tangentAtDist(u * path.length + CAM.lookAhead, t1);
        const bank = Math.max(-0.28, Math.min(0.28, -(t0.z * t1.x - t0.x * t1.z) * 0.55)) * CAM.bank;
        r.set(-d.z, 0, d.x).normalize(); up.set(r.x * bank, 1, r.z * bank).normalize();
        r.crossVectors(d, up).normalize(); up.crossVectors(r, d);
        FOOT.push([e.x, e.y, e.z, r.x, r.y, r.z, up.x, up.y, up.z, d.x, d.y, d.z]);
        if (i % 40 === 39) await ctx.yield();
      }
    }
    const _fy = [], _fx = [];
    const footCuts = (pts, hFrom, hTo) => {
      for (let i = Math.max(0, Math.floor((hFrom - FOOT_H0) / 2)), n = Math.min(FOOT.length - 1, Math.ceil((hTo - FOOT_H0) / 2)); i <= n; i++) {
        const F = FOOT[i]; let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < pts.length; k++) {
          const x = pts[k][0] - F[0], y = pts[k][1] - F[1], z = pts[k][2] - F[2], cz = x * F[9] + y * F[10] + z * F[11];
          if (cz < 0.5) { _fy[k] = NaN; continue; }
          _fy[k] = (x * F[6] + y * F[7] + z * F[8]) / (cz * FOOT_TAN); _fx[k] = (x * F[3] + y * F[4] + z * F[5]) / (cz * FOOT_TAN * 16 / 9);
          if (_fy[k] < lo) lo = _fy[k]; if (_fy[k] > hi) hi = _fy[k];
        }
        if (!(hi - lo > 0.1) || lo >= -1 || hi <= -1) continue;
        for (let k = 0; k < pts.length; k++) {
          const b = (k + 1) % pts.length, ya = _fy[k], yb = _fy[b];
          if (ya !== ya || yb !== yb || (ya < -1) === (yb < -1)) continue;
          if (Math.abs(_fx[k] + (_fx[b] - _fx[k]) * (-1 - ya) / (yb - ya)) <= 21 / 16 * 1.03) return true;
        }
      }
      return false;
    };
    // ---- THE LISTS: the tournament plain from the river's far bank to the ring; the camp stands back 96 m along both
    // sides of it (see THE CAMP STANDS BACK, IN BLOCKS); ROUND 12: THE CAMP'S STREET runs along the way itself
    // from the river to the gate on line C (see there); past the gate one row of tall banners stands beside the way on the hub's hand. A small tent is
    // a slab 8 m across and 9 m tall, paly of eight in its row's pair (the crew lead's ruling: panes that merge by pairs), its face turned back along
    // the route. Their stripes change places across line C (counterchange, per fragment).
    const listRng = rng_fork(ctx.rng, 'lists');
    const H_LIST0 = H_B + 36, H_CAMP = H_END + 190;   // the camp runs on past the ring
    // (LOW_END: where the camp of the ridge's hand ends, route metre 616, 28 m short of where the second herd's rearmost stag lodges; CAMP_GAP1: where it begins again beyond the ring)
    const LOW_END = HERD2 + 30 - 54 - 16, CAMP_GAP1 = H_END + 150;
    const cloths = [];            // every cloth's place: [x, z, pole foot y, pole top y, pair, kind, wind x, wind z, length, hoist]
    // THE GREAT PAVILIONS (the crew lead's ruling). Two stand on
    // the HUB's hand, each alone in its clearing: one abeam of route metre 372, 170 m from the way and 28.8 m tall, the
    // second abeam of metre 540, 110 m off and 30.6 m tall, of another partition and pair: so far to that hand that
    // neither lies on the picture's side as we come in or as we pass (our look is to the ridge's hand). The two others
    // stand 185 m from the way, one to either hand, abeam of route metres 640 and 655: 79 and 64 m short of the ring's
    // plane. The fourth, on the ridge's hand, is the one great pavilion between the way and the lion's ridge (the
    // ridge's road lies some 350 m out there); the second herd's rear seven pass inside it, nearer the way.
    // the great pavilions' places: [route metre, metres to the ridge's hand, height (times a tent's), partition, width (times a
    // tent's), the turn of its face toward the way's line in degrees]; the two of the lists are cut tall and narrow (24 m
    // across) and stand almost square to the way (6 degrees toward its line): so we see the face as we come and they
    // leave the picture's side quickly as we pass. Each stands in
    // a clearing of the camp (no tent, round pavilion or camp lance within 13 m of its reach): [x, z, hand, size, partition, route's heading x, z]
    const GREATS = [[372, -170, 3.2, 2, 2.3, 6], [540, -110, 3.4, 1, 2.3, 6], [640, -185, 3.5, 3, 3.5, 25], [655, 185, 3, 4, 3, 25]].map((g) => { const q = beside(g[0], g[1], [0, 0, 0, 1]); return [q[0], q[1], Math.sign(g[1]), g[2], g[3], q[2], q[3], g[4], g[5] * RAD]; });
    // THE STRIPED THINGS' PASS-OVER (a branch on the two tinctures only; the same on every seed): SABLE WITH GOLD NEVER
    // GOES PALY ANYWHERE IN THE WORLD (Saxony's bars upright: barred on the roll too, see KNOWN). Whatever is striped
    // paly in a dealt pair (a small tent, a low tent, a round pavilion, a striped pavilion of the street, the
    // ship's sail) and would take sable with gold takes THE NEXT PAIR by the rule its deal already has: the tents
    // and pavilions take their hand's three pairs in turn, so the next of the three (palyOf); the sail takes the
    // first of the rows' pairs it may, so the first that is not sable with gold. A hand's three pairs are three
    // different pairs of one colour and one metal: the next is never sable with gold, no new colour comes in and
    // colour on metal holds. (The rail takes the plain's pair, never sable: see THE RAIL'S PASS-OVER. Cloth: see
    // THE CLOTH'S PASS-OVERS.)
    const noPaly = (p) => p[0] === 'sable' && p[1] === 'or', palyOf = (pairs, k) => (noPaly(pairs[k % 3]) ? pairs[(k + 1) % 3] : pairs[k % 3]);
    // the ship's place on the river (see THE SHIP): on the river's own middle line (line B), SHIP_LAT m to the ridge's hand of
    // the way: [x, z, the way's heading there x, z]; its size; the pair of its sail and pennon
    const SHIP_LAT = 150, SHIP_S = 2.6, SHIP = beside(H_B, SHIP_LAT, [0, 0, 0, 1]), SHIP_PAIR = D.rowPairs.find((p) => p[0] !== 'azure' && !noPaly(p)) || D.rowPairs[0];
    // (its face: back along the way as the way comes to the river, turned 30 degrees toward the way's line, as the camp's faces are turned)
    const SHIP_N = [-SHIP[2] * Math.cos(30 * RAD) - SHIP[3] * Math.sin(30 * RAD), -SHIP[3] * Math.cos(30 * RAD) + SHIP[2] * Math.sin(30 * RAD)];
    const inClearing = (x, z) => GREATS.some((g) => Math.hypot(x - g[0], z - g[1]) < 5.3 * g[7] + 13);
    const TENT = [[-3.8, 0, 1], [3.8, 0, 1], [4.0, 4.4, 1], [4.5, 4.2, 1], [0.35, 8.5, 1], [0.35, 9, 1], [-0.35, 9, 1], [-0.35, 8.5, 1], [-4.5, 4.2, 1], [-4.0, 4.4, 1]];
    {
      const tg = style.slab(TENT.map((q) => [q[0], q[1]]), { thickness: 0.8, keyline: 0.25, rim: 0.2, keyInset: 0.08 });
      // (a round pavilion: a drum under a bell roof and a ball; cut 9 m tall and set at twice its size; paly of eight as the tents)
      const ROUND = [[-2.7, 0], [2.7, 0], [2.8, 4.2], [3.5, 4.0], [3.45, 4.5], [3.0, 5.7], [2.2, 6.8], [1.2, 7.6], [0.4, 8.0], [0.3, 8.3], [0.55, 8.55], [0.3, 8.85], [0, 9],
        [-0.3, 8.85], [-0.55, 8.55], [-0.3, 8.3], [-0.4, 8.0], [-1.2, 7.6], [-2.2, 6.8], [-3.0, 5.7], [-3.45, 4.5], [-3.5, 4.0], [-2.8, 4.2]];
      // (THE CAMP'S CLEAR AIR AS BUILT: every tent and pavilion on its own outline as cut and set, less half its
      // thickness and its keyline as set)
      const tentCl = cloudOf([TENT], 1), roundCl = cloudOf([ROUND], 1);
      const step = 12 / Math.min(1.25, Math.max(0.8, D.density)), per = new Map(), all = [];
      // a row's pair: by its number, and by its side of the route (a row on the ridge's side never takes vert); every
      // tent and round pavilion of the camp is paly, so never sable with gold: the next of its hand's three (palyOf)
      const pairOf = (k, sd) => palyOf(sd > 0 ? D.ridgePairs : D.rowPairs, k);
      const perOf = (pr, kind = 0) => { const key = pr[0] + '|' + pr[1] + '|' + kind; if (!per.has(key)) per.set(key, { pr, kind, list: [] }); return per.get(key).list; };
      const ca = Math.cos(25 * RAD), sa = Math.sin(25 * RAD);
      // (tentCut: is a tent standing at _sr, its face's normal (nx, nz), sx broad and sy tall of its cut, crossed by the
      // picture's foot at any place of the way from 100 m before route metre h to 14 m past it? See THE PICTURE'S FOOT.)
      const _lt = TENT.map(() => [0, 0, 0]);
      const tentCut = (nx, nz, sx, sy, h, back = 100) => {
        for (let k = 0; k < TENT.length; k++) { _lt[k][0] = _sr[0] + nz * sx * TENT[k][0]; _lt[k][1] = sy * TENT[k][1]; _lt[k][2] = _sr[1] - nx * sx * TENT[k][0]; }
        return footCuts(_lt, h - back, h + 14);
      };
      // THE CAMP STANDS BACK, IN BLOCKS (the crew lead's ruling). Its FRONT stands 96 m from the way on either hand, from
      // the river to the camp's end beyond the ring: the lists lie open between, 190 m wide, for the great things, the herd
      // and the martlets. The small tents stand in TIDY BLOCKS: a block is three rows of four tents, 12 m apart along the
      // way and 14 m from row to row, every tent of a block in ONE pair of tinctures, its cloth too (the next block takes the next pair
      // of its hand); between block and block a LANE 20 m wide runs back from the lists, and two lances stand in every
      // lane. Behind the blocks of the hub's hand (and of both hands beyond the ring) stands one row of ROUND PAVILIONS
      // twice a tent's height, two to a block, each with its banner. The GREAT PAVILIONS stand singly.
      const ROWS = [[0, 12, 0], [14, 12, 0], [28, 12, 0], [50, 24, 1]], BLOCK = 68, BLOCK_LEN = 46;
      const allR = [];
      for (let j = 0; j < 4; j++) {
        for (const sd of [1, -1]) {
          const [off, gap, kind] = ROWS[j];
          for (let h = H_LIST0 + (kind ? 6 : 0); h < H_CAMP; h += gap) {
            const bi = Math.floor((h - H_LIST0) / BLOCK), pair = pairOf(bi + (sd > 0 ? 0 : 1), sd);
            if (h - H_LIST0 - bi * BLOCK > BLOCK_LEN) { h = H_LIST0 + (bi + 1) * BLOCK + (kind ? 6 : 0) - gap; continue; }   // the lane
            beside(h, sd * (campFront(h) + off), _sr);
            const r1 = listRng();
            // (THE STRAND BEHIND THE SHIP: on the ridge's hand the camp begins a block further on, so the ship is seen against open ground)
            if (inClearing(_sr[0], _sr[1]) || (sd > 0 && h < H_LIST0 + BLOCK)) continue;
            if (sd > 0 && h > LOW_END + 4 && h < CAMP_GAP1) continue;   // (round 9: the herd's floor: from LOW_END to 150 m beyond the ring no camp stands on the ridge's hand)
            // (ROUND 11: beyond the gatehouse the ridge's hand keeps only the camp's rearmost row of small tents, 124 m from
            // the way: a tent there leaves the picture by its left side under a tenth of the picture's height)
            if (sd > 0 && !kind && h > H_C + 27 && h < CAMP_GAP1 && off < 28) continue;
            // (THE CAMP LIES LOW UNDER THE RIDGE: on the ridge's hand only the blocks of small tents stand, as far as the ring, so the
            // ridge's vert is seen under the lion's paws)
            if (sd > 0 && j >= 3 && h < H_END + 30) continue;
            // the face: back along the route, turned 25 degrees toward the line
            // (a small tent stands 0.92 to 1.04 times its cut height, by the camp's own draw)
            const nx = -_sr[2] * ca - sd * _sr[3] * sa, nz = -_sr[3] * ca + sd * _sr[2] * sa, s = kind ? 2 : 0.92 + 0.12 * listRng();
            // (ROUND 10: no small tent of the camp stands where the picture's foot would cross it: see THE PICTURE'S FOOT)
            if (!kind && h < H_END + 60 && tentCut(nx, nz, s, s, h, 160)) continue;
            const m = new THREE.Matrix4().set(nz * s, 0, nx, _sr[0], 0, s, 0, 0, -nx * s, 0, nz, _sr[1], 0, 0, 0, 1);
            perOf(pair, kind).push(m); (kind ? allR : all).push(m);
            if (kind) {
              measure('round pavilion', m.elements, roundCl, 0.4 + 0.25 * s);
              cloths.push([_sr[0], _sr[1], 18, 21 + r1 * 1.2, pair, 0, undefined, undefined, 9]);
              continue;
            }
            measure('small tent', m.elements, tentCl, 0.4 + 0.25 * s);
            // THE SMALL TENTS FLY THEIR CLOTH LOW (a rule of the camp's place): just over their tops, nothing above 12.2 m.
            const top = 11.4 + r1 * 0.8;
            cloths.push([_sr[0], _sr[1], 9 * s, Math.max(9 * s + 2.2, top + 9 * (s - 1)), pair, 0, undefined, undefined, 7]);
          }
        }
        await ctx.yield();
      }
      // THE CAMP'S STREET (round 12; a rule of the place for the whole street, the same on every seed). THE WAY GOES DOWN
      // THE CAMP: from STREET0 (25 m past the river's far bank) to the gate on line C, GREAT PAVILIONS stand in two rows
      // along the way, one to each hand. A street pavilion is one slab, 14 m to its finial (twice our eye's height in the
      // street) and 9.2 m across, its face turned back along the way and STREET.turn toward its line (45 degrees on the
      // ridge's hand, where our look goes; 30 on the hub's): its middle STREET.lat m from the flown line, its nearest
      // cloth 13.7 m and more. On the ridge's hand they stand STREET.gap m apart (the gaps wider than the pavilions:
      // between them the red wall and the lion on it are seen), on the hub's hand STREET.gapHub m apart and set half a
      // step on (staggered hand to hand). Each is parted in one of the camp's pairs of its hand, by turns paly, per pale
      // and chevronny (a colour and a metal; counterchanged per fragment as every cloth here), and flies a pennon from its
      // finial. BETWEEN THEM, in every gap, a LOW TENT (the camp's tent cut squat, under our eye) stands 6 m further from
      // the way and a SHIELD ON A STAND nearer it (STREET.shield m from the line), parted per pale, per fess or per bend.
      // Nothing of the street stands nearer the flown line than 12 m, by place (CLEAR: street pavilion, street shield).
      const PAVIL = [[-4.6, 0], [4.6, 0], [4.8, 5.2], [5.6, 5.0], [5.55, 5.7], [3.7, 7.4], [2.1, 9.4], [0.9, 11.2], [0.4, 11.9], [0.35, 12.2], [0.75, 12.5], [0.75, 12.9], [0.35, 13.2], [0, 14],
        [-0.35, 13.2], [-0.75, 12.9], [-0.75, 12.5], [-0.35, 12.2], [-0.4, 11.9], [-0.9, 11.2], [-2.1, 9.4], [-3.7, 7.4], [-5.55, 5.7], [-5.6, 5.0], [-4.8, 5.2]];
      const SHIELD = [[-0.18, 0], [0.18, 0], [0.18, 2.9], [0.95, 3.45], [1.5, 4.4], [1.65, 5.4], [1.65, 6.7], [-1.65, 6.7], [-1.65, 5.4], [-1.5, 4.4], [-0.95, 3.45], [-0.18, 2.9]];
      {
        const pg = style.slab(PAVIL, { thickness: 0.8, keyline: 0.25, rim: 0.2, keyInset: 0.08 }), sg = style.slab(SHIELD, { thickness: 0.5, keyline: 0.2, rim: 0.15, keyInset: 0.06 });
        const pavs = new Map(), shields = new Map(), allP = [], allS = [], pavilCl = cloudOf([PAVIL], 1), shieldCl = cloudOf([SHIELD], 0.5);
        const put = (map, key, make, m) => { if (!map.has(key)) map.set(key, { make, list: [] }); map.get(key).list.push(m); };
        for (const sd of [1, -1]) {
          const gap = sd > 0 ? STREET.gap : STREET.gapHub, turn = (sd > 0 ? STREET.turn : STREET.turnHub) * RAD, tc = Math.cos(turn), ts = Math.sin(turn), pairs = sd > 0 ? D.ridgePairs : D.rowPairs;
          const n = Math.floor((H_C - STREET.short - STREET0 - 4) / gap) + 1;
          for (let k = 0; k < n; k++) {
            const h = STREET0 + 4 + (sd > 0 ? 0 : gap / 2 - 4) + k * gap; if (h > H_C - STREET.short) continue;
            // the pavilion: its face back along the way, turned toward the way's line
            beside(h, sd * STREET.lat, _sr);
            const nx = -_sr[2] * tc - sd * _sr[3] * ts, nz = -_sr[3] * tc + sd * _sr[2] * ts, kind = (k + (sd > 0 ? 0 : 1)) % 3, pair = kind ? pairs[(k + (sd > 0 ? 0 : 2)) % 3] : palyOf(pairs, k + (sd > 0 ? 0 : 2));   // (kind 0 is the striped pavilion: palyOf)
            // (THE STREET'S RIDGE HAND, the lead's L3 and round 13: the lion runs down the red wall and stands by the gate's
            // tower the whole street long, so EVERY pavilion of the ridge's hand stands STREET.low m to the finial, and
            // fly their pennons at it: seen from the way, 7 m up and 17 m off, they pass UNDER the lion's paws)
            const sy = sd > 0 ? STREET.low / 14 : 1;
            const m = new THREE.Matrix4().set(nz * STREET.wide * sy, 0, nx, _sr[0], 0, sy, 0, 0, -nx * STREET.wide * sy, 0, nz, _sr[1], 0, 0, 0, 1);
            put(pavs, pair[0] + '|' + pair[1] + '|' + kind, () => (kind ? partedMat(pair[0], pair[1], kind === 1 ? 2 : 1) : stripedMat(pair[0], pair[1], 1, 0, 1, true, true)), m); allP.push(m);
            measure('street pavilion', m.elements, pavilCl, 0.4 + 0.25 * Math.max(1, STREET.wide));
            if (sy < 1) cloths.push([_sr[0], _sr[1], 13.4 * sy, STREET.low + 0.5, pair, 0, undefined, undefined, 3, 0.9]);
            else cloths.push([_sr[0], _sr[1], 13.4, 16.2, pair, 0, undefined, undefined, sd > 0 ? 4 : 7, sd > 0 ? 1.1 : 1.8]);   // (the pennon: shorter on the ridge's hand, where it streams toward the way under the lion)
            // in the gap beyond it: a low tent further from the way, a shield on its stand nearer it
            if (k === n - 1) continue;
            beside(h + gap / 2, sd * (STREET.lat + 6), _sr);
            const tp = palyOf(pairs, k + (sd > 0 ? 1 : 0)), tm = new THREE.Matrix4().set(nz * 0.8, 0, nx, _sr[0], 0, STREET.tent / 9, 0, 0, -nx * 0.8, 0, nz, _sr[1], 0, 0, 0, 1);
            perOf(tp, 0).push(tm); all.push(tm); measure('low tent', tm.elements, tentCl, 0.4 + 0.25);
            beside(h + gap / 2, sd * STREET.shield, _sr);
            const sp = pairs[(k + (sd > 0 ? 2 : 1)) % 3], sk = partOf(sp[0], sp[1], 2 + (k + (sd > 0 ? 0 : 1)) % 3), sm = new THREE.Matrix4().set(nz, 0, nx, _sr[0], 0, 1, 0, 0, -nx, 0, nz, _sr[1], 0, 0, 0, 1);
            put(shields, sp[0] + '|' + sp[1] + '|' + sk, () => partedMat(sp[0], sp[1], sk), sm); allS.push(sm);
            measure('street shield', sm.elements, shieldCl, 0.25 + 0.2);
          }
        }
        let np = 0;
        for (const [map, geo, nm, alls, kw] of [[pavs, pg, 'street-pavilions-', allP, 0.25], [shields, sg, 'street-shields-', allS, 0.2]]) {
          map.forEach(({ make, list }) => { const im = new THREE.InstancedMesh(geo.geometry, make(), list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; im.name = nm + (np++); scene.add(im); });
          const ik = new THREE.InstancedMesh(geo.keyGeometry, style.keyline({ keyWidth: kw }), alls.length); alls.forEach((m, i) => ik.setMatrixAt(i, m)); ik.frustumCulled = false; ik.name = nm + 'keyline'; scene.add(ik);
        }
      }
      let nPav = 0;
      const rg = style.slab(ROUND, { thickness: 0.8, keyline: 0.25, rim: 0.2, keyInset: 0.08 });
      per.forEach(({ pr, kind, list }) => {
        const tm = new THREE.InstancedMesh((kind ? rg : tg).geometry, stripedMat(pr[0], pr[1], 1, 0, 1, true, true), list.length);
        list.forEach((m, i) => tm.setMatrixAt(i, m));
        tm.frustumCulled = false; tm.name = (kind ? 'round-pavilions-' : 'pavilions-') + (nPav++); scene.add(tm);
      });
      // the tents' keyline: the kit's own, sable at every distance (it holds a pixel and a half): a far tent is a small whole outlined thing
      const tentKey = style.keyline({ keyWidth: 0.25 });
      for (const [kg, list] of [[tg.keyGeometry, all], [rg.keyGeometry, allR]]) {
        const tk = new THREE.InstancedMesh(kg, tentKey, list.length);
        list.forEach((m, i) => tk.setMatrixAt(i, m));
        tk.frustumCulled = false; scene.add(tk);
      }
      // THE GREAT PAVILIONS: marquees of two peaks, three times a tent's height and more, each of its own plain partition
      // (bendy, chevronny, per pale, per fess, per bend) in a pair of its hand's rows, the two tinctures changing places by
      // the law of counterchange; each flies a long banner from either peak.
      const GREAT = [[-4.6, 0], [4.6, 0], [4.7, 3.6], [5.2, 3.5], [5.15, 3.9], [2.6, 8.3], [2.6, 8.6], [2.35, 9], [2.1, 8.6], [2.1, 8.3], [0, 6.6],
        [-2.1, 8.3], [-2.1, 8.6], [-2.35, 9], [-2.6, 8.6], [-2.6, 8.3], [-5.15, 3.9], [-5.2, 3.5], [-4.7, 3.6]];
      const gg = style.slab(GREAT, { thickness: 0.8, keyline: 0.25, rim: 0.2, keyInset: 0.08 });
      const gk = new THREE.InstancedMesh(gg.keyGeometry, tentKey, GREATS.length), greatCl = cloudOf([GREAT], 1);
      GREATS.forEach((G, i) => {
        const [x, z, sd, sc, kind, fx, fz, sw, turn] = G, gc = Math.cos(turn), gs = Math.sin(turn), nx = -fx * gc - sd * fz * gs, nz = -fz * gc + sd * fx * gs;
        const pair = (sd > 0 ? D.ridgePairs : D.rowPairs)[i % 3];   // (no row's pair holds azure: see the deal)
        const m = new THREE.Matrix4().set(nz * sw, 0, nx, x, 0, sc, 0, 0, -nx * sw, 0, nz, z, 0, 0, 0, 1);
        const gm = new THREE.Mesh(gg.geometry, partedMat(pair[0], pair[1], partOf(pair[0], pair[1], kind))); gm.matrixAutoUpdate = false; gm.matrix.copy(m); gm.matrixWorld.copy(m);
        gm.frustumCulled = false; gm.name = 'great-pavilion-' + i; scene.add(gm); gk.setMatrixAt(i, m);
        measure('great pavilion', m.elements, greatCl, 0.4 + 0.25 * Math.max(sw, sc));
        for (const e of [-1, 1]) cloths.push([x + nz * 2.35 * sw * e, z - nx * 2.35 * sw * e, 9 * sc, 9 * sc + 5 + listRng(), pair, 0, undefined, undefined, 12]);
      });
      gk.frustumCulled = false; gk.name = 'great-pavilions-keyline'; scene.add(gk);
    }
    // THE LANCES OF THE LISTS: every lance is a CHARGE, a staff with a body (a slab 0.9 m wide and half a metre thick
    // under a lance head, bendy in its row's pair, keylined sable) and one great cloth, a standard 9 m by 3.2, flown
    // below its head. They stand few and wide apart, so each is a thing one can count with sky between it and the next.
    // staffs: [x, z, foot y, height, pair, face x, face z]; standards: the cloth each flies (no pole of its own).
    const staffs = [], standards = [], great = [], LANE_PENS = [];
    const STD_L = 9, STD_H = 3.2, HEAD = 1.7;
    const DOWN = [0, 0, 0, 0, null, 1, 0, 0, 0, 0, undefined, 1];   // (a standard taken down: dealt, not made)
    const lanceAt = (x, z, y0, height, pair, fx, fz, wx, wz, len = STD_L, hoist = STD_H, part) => {   // (part: the cloth's own partition, where its place gives it)
      staffs.push([x, z, y0, height, pair, fx, fz]);
      standards.push([x, z, y0, y0 + height - HEAD, pair, 1, wx, wz, len, hoist, part]);
    };
    const toHub = (x, z) => { const dx = HUB[0] - x, dz = HUB[1] - z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
    {
      const ca = Math.cos(25 * RAD), sa = Math.sin(25 * RAD);
      // a lance beside the route: its face back along the route, turned 25 degrees toward the line (as the pavilions stand)
      const NT_ON = 45;
      const row = (h, lat, height, pair) => {
        beside(h, lat, _sr); const sd = lat > 0 ? 1 : -1, w = toHub(_sr[0], _sr[1]);
        lanceAt(_sr[0], _sr[1], 0, height, pair, -_sr[2] * ca - sd * _sr[3] * sa, -_sr[3] * ca + sd * _sr[2] * sa, w[0], w[1]);
      };
      // THE TILT STANDS NEAR (round 12; a rule of the place for the whole of the lists, the same on every seed). ON THE
      // RIDGE'S HAND a tilt barrier runs along the way, NT.lat m from the flown line, from 20 m past the gate on line C
      // to NT_ON m past the foot of the last climb (so the lower third of the picture is never bare where the lists are
      // seen): a rail NT.tall m tall in panels 5 m long, paly of the plain's own pair (see its pass-over) in panes 2.5 m wide
      // (counterchanged per fragment as every parted thing here). TWO SHIELDS hang from the rail in every bay of
      // NT.gap m, their points 1.5 m over the ground and their heads 2 m over the rail, FLAT ON THE RAIL, their faces
      // to the way's line (no BUILT thing within 25 m is turned toward the way), each parted per pale, per
      // bend, per fess, chevronny or bendy in a pair of that hand. THE TILT'S GREAT BANNERS (a staff every NT.gap m,
      // NT.back m behind the rail, each as tall as the lion's footing allows) ARE TAKEN DOWN in round 14: see below.
      // Nothing of the tilt stands nearer the flown line than 14 m, by place (CLEAR).
      // On the hub's hand the second herd's ground lies open, as it was.
      {
        // (THE TILT'S GREAT BANNERS AND ITS HEAD ON THE HUB'S HAND ARE TAKEN DOWN: on that hand the lane's row of lances
        // stands alone before the open ground of the second herd. Their cloths keep their draws of the lists' deal:
        // see DOWN.)
        const NT = { lat: 16, h0: H_C + 20, h1: H_CLIMB + NT_ON, tall: 3.6, pane: 2.5, staff0: H_C + 50, gap: 26, tallest: 18, least: 8, fly: 5.6, lion: 135, under: 0.5 * RAD, back: 4, flat: 0.6 };
        // (staffTop ONLY HOLDS THE DEAL NOW: no banner of the tilt is set up; for each staff that this law would have
        // set up, NT.least m tall and more, a cloth taken down is dealt (DOWN: its two draws of the lists' deal are
        // spent and nothing is made), so no other cloth's deal shifts. The law, as it stood:)
        // NO BANNER OF THE TILT STANDS BEFORE THE LION: from every place of the way at which a staff's bearing lies within
        // the lion's own length (NT.lion m of the crest to either side of the lion's place by its law, and the banner's
        // fly more), the staff's head shows NT.under below the lion's footing (the crest under its place, the reared
        // lion's reach allowed for). Each staff is as tall as that allows and no taller than NT.tallest; one that would
        // stand under NT.least is not set up. So the staffs are low where the way is low (after the gate) and rise with it.
        const _lf = new THREE.Vector3(), _l0 = new THREE.Vector3(), _l1 = new THREE.Vector3(), _so = [0, 0, 0, 1], wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
        const staffTop = (hs, x, z) => {
          let top = NT.tallest;
          for (let h = Math.max(0, hs - 150); h <= hs - 4; h += 2) {
            const u = uOfM(h), oy = routeY(h); routeXZ(h, _so);
            if (hero.solveAt(u).dy < 0) continue;                        // (in a low way of its road the lion is under the ground: no banner can stand before it)
            hero.lionAbeam(u, _lf); hero.lionAbeam(u, _l0, NT.lion); hero.lionAbeam(u, _l1, -NT.lion);
            const ds = Math.hypot(x - _so[0], z - _so[1]), pad = Math.atan2(NT.fly, ds), bf = Math.atan2(_lf.x - _so[0], _lf.z - _so[1]);
            const d0 = wrapA(Math.atan2(_l0.x - _so[0], _l0.z - _so[1]) - bf), d1 = wrapA(Math.atan2(_l1.x - _so[0], _l1.z - _so[1]) - bf), db = wrapA(Math.atan2(x - _so[0], z - _so[1]) - bf);
            if (db < Math.min(d0, d1) - pad || db > Math.max(d0, d1) + pad) continue;
            top = Math.min(top, oy + ds * Math.tan(Math.atan2(_lf.y - 80 - oy, Math.hypot(_lf.x - _so[0], _lf.z - _so[1])) - NT.under));
          }
          return top;
        };
        // (THE RAIL'S PASS-OVER, a branch on tinctures only: never paly of gules with gold, Aragon's pales; there the
        // rail takes the bridge's colour with the gold. Gules with white stays.)
        const n = Math.floor((NT.h1 - NT.h0) / 5), pair = pc === 'gules' && pm === 'or' ? [BRIDGE_C, pm] : [pc, pm];
        const railOl = [[-2.5, 0], [2.5, 0], [2.5, NT.tall], [-2.5, NT.tall]], railCl = cloudOf([railOl], 0.5);   // (a panel of the rail as cut: measured as set, less half its thickness and its keyline)
        const pg = style.slab(railOl, { thickness: 0.6, keyline: 0.2, rim: 0.15, keyInset: 0.06 });
        const rm = new THREE.InstancedMesh(pg.geometry, stripedMat(pair[0], pair[1], 1, 0, NT.pane, true, false), n);
        const rk = new THREE.InstancedMesh(pg.keyGeometry, style.keyline({ keyWidth: 0.2 }), n);
        for (let i = 0; i < n; i++) {
          beside(NT.h0 + 2.5 + 5 * i, NT.lat, _sr);
          _m4.set(_sr[2], 0, -_sr[3], _sr[0], 0, 1, 0, 0, _sr[3], 0, _sr[2], _sr[1], 0, 0, 0, 1);
          rm.setMatrixAt(i, _m4); rk.setMatrixAt(i, _m4); measure('tilt rail', _m4.elements, railCl, 0.3 + 0.2);
        }
        rm.frustumCulled = false; rk.frustumCulled = false; rm.name = 'tilt'; rk.name = 'tilt-keyline'; scene.add(rm, rk);
        const RSHIELD = [[0, 1.5], [0.95, 2.2], [1.5, 3.2], [1.7, 4.3], [1.7, 5.6], [-1.7, 5.6], [-1.7, 4.3], [-1.5, 3.2], [-0.95, 2.2]];
        const sg = style.slab(RSHIELD, { thickness: 0.5, keyline: 0.2, rim: 0.15, keyInset: 0.06 }), per = new Map(), allS = [], rshieldCl = cloudOf([RSHIELD], 0.5);
        const KINDS = [2, 4, 3, 1, 0];
        let ns = 0;
        for (let h = NT.staff0, k = 0; h <= NT.h1; h += NT.gap, k++) {
          beside(h, NT.lat + NT.back, _sr); const top = staffTop(h, _sr[0], _sr[1]);
          if (top >= NT.least) standards.push(DOWN);   // (a cloth taken down keeps its two draws of the lists' deal: no other cloth's deal shifts)
          if (h + NT.gap > NT.h1) break;
          for (const f of [1 / 3, 2 / 3]) {
            beside(h + NT.gap * f, NT.lat - NT.flat, _sr);
            const nx = -_sr[3], nz = _sr[2];   // (flat on the rail, its face to the way's line)
            const sp = D.ridgePairs[(ns + 1) % 3], kind = partOf(sp[0], sp[1], KINDS[ns % 5]);   // (no row's pair holds azure: see the deal)
            const m = new THREE.Matrix4().set(nz, 0, nx, _sr[0], 0, 1, 0, 0, -nx, 0, nz, _sr[1], 0, 0, 0, 1), key = sp[0] + '|' + sp[1] + '|' + kind;
            if (!per.has(key)) per.set(key, { sp, kind, list: [] }); per.get(key).list.push(m); allS.push(m); ns++;
            measure('tilt shield', m.elements, rshieldCl, 0.25 + 0.2);
          }
        }
        // THE LISTS' SECOND GREAT STANDARD (round 14; a rule of the place, the same on every seed; it takes the first of
        // the hub lances' places in the lists' deal): GS2.past m beyond the arch (abeam of the first, see THE LISTS'
        // GREAT STANDARD) and GS2.lat m to the RIDGE'S hand of the flown line, behind the tilt's rail: a staff GS2.tall m
        // tall, square to the way, its banner GS2.len m by GS2.hoist bendy in the first pair of that hand, streaming
        // toward the hub: it ends 14.5 m from the line, 17 m and more over the ground. The two stand to either hand of the
        // lane in the arch's opening.
        { const GS2 = { past: 38, lat: 24, tall: 25, len: 9.5, hoist: 6.5 };
          beside(H_C + GS2.past, GS2.lat, _sr); const w = toHub(_sr[0], _sr[1]); lanceAt(_sr[0], _sr[1], 0, GS2.tall, D.ridgePairs[0], -_sr[2], -_sr[3], w[0], w[1], GS2.len, GS2.hoist, 1); }   // (its staff and its banner are measured with the lances and the cloth, below)
        standards.push(DOWN, DOWN);   // (the other two of the hub lances' places: their cloths taken down, dealt and not made)
        let np = 0;
        per.forEach(({ sp, kind, list }) => { const im = new THREE.InstancedMesh(sg.geometry, partedMat(sp[0], sp[1], kind), list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; im.name = 'tilt-shields-' + (np++); scene.add(im); });
        const sk = new THREE.InstancedMesh(sg.keyGeometry, style.keyline({ keyWidth: 0.2 }), allS.length); allS.forEach((m, i) => sk.setMatrixAt(i, m)); sk.frustumCulled = false; sk.name = 'tilt-shields-keyline'; scene.add(sk);
      }
      // THE FAIR'S NEAR LANE (a law by place for the whole of the lists, the same on every seed). WITHIN 8 M TO EITHER
      // HAND OF THE FLOWN LINE NOTHING IS BUILT: only the ground lies there. FROM 8 TO 14 M ONE ORDERLY ROW ON EACH
      // HAND: lances LANE.tall m tall, LANE.lat m from the line, one every LANE.gap m from 13 m past the gate's arch to
      // 45 m past the foot of the last climb (thirteen to a hand), upright, their faces square to the way, each with a
      // forked pennon 4 m long under its head, streaming toward the hub (on the ridge's hand toward the way). The lion
      // is in its low way till 72 m past line C: no lance of the lane stands before the lion. FROM 14 M OUT: the
      // tilt's rail (16 m on the ridge's hand), its shields hung flat on the rail, their faces to the way's line, and
      // the lists' great standard (15 m on the hub's hand); beyond the rail the ground lies open to the herd's lanes
      // and the far tent crowd. NO BUILT THING WITHIN 25 M IS TURNED TOWARD THE WAY: every staff's face is square to
      // it. (A stag is no built thing: the nearest turned to the way is the ridge seven's innermost, 30 m out on the
      // ridge's hand, its outline 21 m from the way in plan; the hub hand's three run 36 m out: see THE SECOND HERD.)
      {
        const LANE = { lat: 13.2, h0: H_C + 13, gap: 13, h1: H_CLIMB + NT_ON, tall: 8, pen: [4, 1.8] };
        for (let h = LANE.h0, k = 0; h <= LANE.h1; h += LANE.gap, k++) for (const sd of [1, -1]) {
          beside(h, sd * LANE.lat, _sr); const w = toHub(_sr[0], _sr[1]), pair = (sd > 0 ? D.ridgePairs : D.rowPairs)[k % 3], yp = LANE.tall * 12.2 / 14 - 0.1;
          staffs.push([_sr[0], _sr[1], 0, LANE.tall, pair, -_sr[2], -_sr[3]]);
          LANE_PENS.push([_sr[0], _sr[1], 0, yp, pair, 1, (k * 0.618 + (sd > 0 ? 0 : 0.31)) % 1, LANE.pen[0], w[0], w[1], LANE.pen[1]]);
        }
      }
      // THE GATE'S TWO STANDARDS (round 12; a rule of the place, the same on every seed): a lance before each tower of the
      // gate on line C, 22.5 m to either hand of the flown line and 3 m before the gate's face, 16 m tall, each with a
      // great standard 14 m by 6 flown under its head and streaming toward the hub: the one of the ridge's hand streams
      // toward the way and ends 8.5 m from the flown line, before the arch's jamb; the other streams before its tower.
      // ROUND 13 (S2; a rule of the place, the same on every seed): THEY ARE GONE UP ONTO THE TOWERS. On the point of each
      // tower's roof a short staff GP.staff m tall with a pennon GP.len m by GP.hoist streaming toward the hub; nothing of
      // cloth or staff stands on the ground within 15 m before the arch.
      // THE LISTS' GREAT STANDARD (S2: what we come out to is near and large): GS.past m beyond the arch and GS.lat m to
      // the HUB'S hand of the flown line a staff GS.tall m tall, its banner GS.len m by GS.hoist flown under its head and
      // streaming toward the hub (away from the way).
      const GP = { staff: 8, len: 6, hoist: 2.6 }, GS = { past: 38, lat: 15, tall: 25, len: 11, hoist: 6 };
      for (const sd of [1, -1]) { beside(H_C - 0.6, sd * (GATE.half + GATE.tur / 2), _sr); const w = toHub(_sr[0], _sr[1]); lanceAt(_sr[0], _sr[1], GATE.tTop + GATE.band + GATE.roof - 1, GP.staff, (sd > 0 ? D.ridgePairs : D.rowPairs)[1], -_sr[2], -_sr[3], w[0], w[1], GP.len, GP.hoist); }
      { beside(H_C + GS.past, -GS.lat, _sr); const w = toHub(_sr[0], _sr[1]); lanceAt(_sr[0], _sr[1], 0, GS.tall, D.rowPairs[0], -_sr[2], -_sr[3], w[0], w[1], GS.len, GS.hoist, 4); }
      // THE CAMP'S LANCES: two in every lane between the blocks, on either hand (7 and 21 m behind the camp's front), each
      // with its standard; they carry their standards low, as the camp does: the heads 13.4 to 14.2 m.
      for (let j = 0; j < 2; j++) {
        for (const sd of [1, -1]) {
          const off = j ? 21 : 7, pair = (sd > 0 ? D.ridgePairs : D.rowPairs)[(j + (sd > 0 ? 1 : 2)) % 3];
          for (let h = H_LIST0 - 11; h < H_CAMP; h += 68) {
            const ht = 13.4 + listRng() * 0.8;
            beside(h, sd * (campFront(h) + off), _sr); if (!inClearing(_sr[0], _sr[1]) && !(sd > 0 && h < H_LIST0 + 45) && !(sd > 0 && h > LOW_END + 4 && h < CAMP_GAP1)) row(h, sd * (campFront(h) + off), ht, pair);
          }
        }
      }
      // THE LISTS' FOUR GREAT STANDARDS (hub's hand; ROUND 8; they stood at the old tilt's ends and bays: round 12 brought
      // the rail itself near, to the ridge's hand, above): 84 m to the hub's hand of the way, abeam of route metres 566 to
      // 656 every 30 m, each a GREAT LANCE 30 m tall with a standard 12 m by 4.
      {
        const TILT_LAT = -84, TILT0 = 566, TILT_LANCE = 30, pair = D.ridgePairs[0];
        for (let i = 0; i <= 3; i++) {
          beside(TILT0 + 30 * i, TILT_LAT, _sr); const w = toHub(_sr[0], _sr[1]);
          great.push([_sr[0], _sr[1], 0, TILT_LANCE, pair, -_sr[2], -_sr[3]]);
          standards.push([_sr[0], _sr[1], 0, TILT_LANCE - 3.6 * TILT_LANCE / 32, pair, 1, w[0], w[1], 12, 4]);
        }
      }
      // THE PAIR OF GREAT STANDARDS WITH THE GONFALON (the crew lead's ruling; ROUND 8: ON THE HUB'S HAND, behind its camp):
      // abeam of route metre GONF_H, two great lances 30 m tall, 161 and 179 m from the way, each with a standard 12 m by 5, and slung between
      // them from a bar 26 m up a gonfalon 12 m wide and 15 m deep, of three tails, bendy in a pair of the ridge's hand.
      {
        const GONF_H = 432, pair = D.ridgePairs[1], gp = D.ridgePairs[2];
        for (const lat of [-161, -179]) {
          beside(GONF_H, lat, _sr); const w = toHub(_sr[0], _sr[1]);
          great.push([_sr[0], _sr[1], 0, 30, pair, -_sr[2], -_sr[3]]);
          standards.push([_sr[0], _sr[1], 0, 30 - 3.6 * 30 / 32, pair, 1, w[0], w[1], 12, 5]);
        }
        const gonfOl = [[-6, 13], [-4.2, 11], [-2.4, 13], [-2.4, 15], [-1.8, 15], [-1.8, 13], [0, 11], [1.8, 13], [1.8, 15], [2.4, 15], [2.4, 13], [4.2, 11], [6, 13], [6, 26],
          [9, 26], [9, 26.8], [-9, 26.8], [-9, 26], [-6, 26]];
        const fg = style.slab(gonfOl, { thickness: 0.5, keyline: 0.3, rim: 0.15, keyInset: 0.08 });
        beside(GONF_H, -170, _sr);
        _m4.set(-_sr[3], 0, -_sr[2], _sr[0], 0, 1, 0, 0, _sr[2], 0, -_sr[3], _sr[1], 0, 0, 0, 1);
        for (const [g, mt, nm] of [[fg.geometry, partedMat(gp[0], gp[1], 0), 'gonfalon'], [fg.keyGeometry, style.keyline({ keyWidth: 0.3 }), 'gonfalon-keyline']]) {
          const gm = new THREE.Mesh(g, mt); gm.matrixAutoUpdate = false; gm.matrix.copy(_m4); gm.matrixWorld.copy(_m4); gm.frustumCulled = false; gm.name = nm; scene.add(gm);
        }
        measure('gonfalon', _m4.elements, cloudOf([gonfOl], 1), 0.25 + 0.3);   // (the gonfalon and its bar as cut and set, less half its thickness and its keyline)
      }
    }
    await ctx.yield();
    // ---- THE CLOTH: every banner is a ribbon of 24 triangles waved in the vertex shader, streaming
    // down its own wind (iWind.xy; iWind.z is the hoist): from the ridge to the hub over the camp, and along the
    // ridge's face on the ridge's flats. Partitions only, in the row's pair of one colour and one metal; the two change
    // places by the law of counterchange. A pavilion's banner carries its own pole (two crossed strips 0.36 m wide);
    // a standard has none: it flies from a LANCE, which is a body (a keylined slab, bendy of the row's pair).
    const windAmp = 0.8 / D.wind, windDroop = Math.max(0, 1.1 - D.wind) * 0.5, CLOTH_H = 2.4;
    const clothMat = new THREE.ShaderMaterial({
      uniforms: {
        ...style.uniforms, uWind: { value: new THREE.Vector3(windDroop, windAmp, 2.6 * D.wind + 1.2) },
        uOr: { value: T.or }, uOrDeep: { value: tones.orDeep }, uOrCore: { value: tones.orCore },
        uArg: { value: T.argent }, uArgDeep: { value: tones.argentDeep }, uArgCore: { value: tones.argentCore }, uSable: { value: T.sable },
      },
      vertexShader: /* glsl */`
        attribute vec4 iPlace; attribute vec3 iCol; attribute vec4 iMisc; attribute vec3 iWind; attribute float aKind; attribute float aRim;
        uniform float uTime, uPx; uniform vec3 uWind;
        varying vec2 vUv; varying vec3 vCol; varying vec4 vMisc; varying vec3 vN; varying vec3 vT; varying vec3 vW; varying float vKind; varying float vRim;
        varying vec2 vFar;   // the cloth's own place (its pole's head): metres a pixel spans there, and its height: one value over the whole cloth and pole
        varying vec2 vXY;    // metres along and down the cloth (beyond its own edges in the keyline set out round it)
        varying float vHoist; // the cloth's own height on its staff, metres (one value over the cloth)
        void main() {
          vHoist = iWind.z;
          vXY = vec2(0.);
          vFar = vec2(uPx * length(vec3(iPlace.x, iPlace.w, iPlace.y) - cameraPosition), iPlace.w);
          vec2 w2 = iWind.xy;                                                    // the way this cloth streams (its own place's wind, set at the build)
          vec3 w = vec3(w2.x, 0., w2.y), p = vec3(-w2.y, 0., w2.x), wp, n = p;
          if (aKind < 0.5) {
            float L = iMisc.w, X = position.x * L, k = 1.15;
            float a1 = uWind.y * position.x;
            float arg = k * X - uWind.z * uTime + iMisc.z * 6.2832 + position.y * 0.6;
            float disp = a1 * (sin(arg) + 0.3 * sin(2.3 * arg + 1.7));
            float dd = a1 * k * (cos(arg) + 0.69 * cos(2.3 * arg + 1.7)) + uWind.y / L * sin(arg);
            float droop = uWind.x * X * X / L;
            // (round 12: the fly also lifts and falls in the cloth's own plane, more toward its free end, 0.4 m at the
            // end itself; the cloth's field rides with it)
            // (round 14: a cloth longer than 12 m, the roll's long pennons, lifts and falls by its length's share more)
            droop += 0.4 * max(1., L / 12.) * position.x * sin(0.6 * X - 0.8 * uWind.z * uTime + iMisc.z * 9.1);
            // THE KEYLINE LIES ROUND THE CLOTH, OUTSIDE IT (a rectangular cloth): the ribbon's edges are set out by the line's
            // width, which holds a pixel and a fifth at the cloth's own place, so a far cloth is a small whole outlined thing
            float kw = aRim < -0.5 ? max(0.11, 1.2 * vFar.x) : 0.;
            vXY = vec2(X + (position.x < 0.001 ? -kw : position.x > 0.999 ? kw : 0.), position.y * vHoist + (position.y * 2. - 1.) * kw);
            wp = vec3(iPlace.x, iPlace.w, iPlace.y) + w * vXY.x + p * disp - vec3(0., vXY.y + droop, 0.);
            n = p - w * dd * 0.12; n = n / max(length(n), 1e-4);   // the leaf answers the cloth's own plane, barely the fold: one tone across the wave, the highlight travelling
          } else {
            vec3 base = vec3(iPlace.x, mix(iPlace.z, iPlace.w + 0.4, position.y), iPlace.y);
            float hw = 0.18;                                                        // a pole 0.36 m thick: one width in the world, the same from everywhere
            wp = base + (aKind < 1.5 ? w : p) * position.x * hw;
          }
          vUv = position.xy; vCol = iCol; vMisc = iMisc; vN = n; vT = w; vW = wp; vKind = aKind;
          vRim = aRim < -0.5 ? aRim : aRim * max(1., step(${(2 * CLOTH_H).toFixed(1)}, iWind.z) * iWind.z / ${CLOTH_H.toFixed(1)});   // (a forked pennon's own rim, metres: a great pennon's by its own hoist)
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
      fragmentShader: style.glsl.metal + style.glsl.counter + /* glsl */`
        uniform vec3 uOr, uOrDeep, uOrCore, uArg, uArgDeep, uArgCore, uSable;
        varying vec2 vUv; varying vec3 vCol; varying vec4 vMisc; varying vec3 vN; varying vec3 vT; varying vec3 vW; varying float vKind; varying float vRim;
        varying vec2 vFar; varying vec2 vXY; varying float vHoist;
        void main() {
          float g = nccGroundAA(vW.xz);
          float id = vMisc.y, L = vMisc.w, X = clamp(vXY.x, 0., L), Y = clamp(vXY.y, 0., vHoist);
          vec2 uv = vec2(X / max(L, 1e-3), Y / max(vHoist, 1e-3));
          // metres a pixel spans here (the mean of the two screen derivatives of the place itself: a cloth seen aslant from above counts as it is drawn)
          float mpp = max(sqrt(length(dFdx(vW)) * length(dFdy(vW))), 1e-4);
          // the lawful cloth and no other: 0 paly of eight, 1 bendy, 2 per chevron, 3 per saltire, 4 gyronny of eight
          // (never bars across: no per fess, barry or chevronny).
          // THE PARTITIONS MERGE BY PAIRS, IN WHOLE STEPS (paint only; one step for the whole cloth, by three pixels of its own
          // place, px3): while a pane of the paly is three pixels and more, the cloth's own partition (lvl 0); then the
          // partition of half as many panes (paly of four, the bends doubled, gyronny gone to per saltire: lvl 1); then
          // PER PALE (lvl 2: its colour and its metal, lawful on any ground behind its keyline); a cloth under three pixels
          // long altogether is its pair's metal (lvl 3). Never a blend and never a tint. (Because gyronny goes to per
          // saltire here, the deal passes over BOTH for the pairs that may not show per saltire: THE CLOTH'S PASS-OVERS.)
          float px3 = vFar.x * 3.;
          float lvl = px3 <= 0.875 ? 0. : px3 <= 1.75 ? 1. : px3 <= L ? 2. : 3.;
          // A LINE OF PARTITION IS ONE HARD EDGE: the signed distance in pixels to the nearest line, one step, at every fold
          float nP = lvl < 0.5 ? 8. : 4., sP = clamp(uv.x * nP, 0.001, nP - 0.001);
          float twP = abs(fract(sP * 0.5 + 0.25) - 0.5) * 2. - 0.5;
          float twB = abs(fract((X + Y) / (lvl < 0.5 ? 2.6 : 5.2)) - 0.5) * 2. - 0.5;
          float tw = id < 0.5 ? twP : twB;
          float pS = tw / max(fwidth(tw), 1e-5);
          float xs = uv.x * 2. - 1., ys = uv.y * 2. - 1.;
          float dCh = ys - (0.8 - 1.6 * (1. - abs(xs))), d1 = xs - ys, d2 = xs + ys;
          float pC = dCh / max(fwidth(dCh), 1e-5);
          float p1 = d1 / max(fwidth(d1), 1e-5), p2 = d2 / max(fwidth(d2), 1e-5), p3 = xs / max(fwidth(xs), 1e-5), p4 = ys / max(fwidth(ys), 1e-5);
          float s12 = (p1 < 0. ? -1. : 1.) * (p2 < 0. ? -1. : 1.), s34 = (p3 < 0. ? -1. : 1.) * (p4 < 0. ? -1. : 1.);
          float pSal = min(abs(p1), abs(p2)) * s12;
          float pGy = min(min(abs(p1), abs(p2)), min(abs(p3), abs(p4))) * s12 * s34;
          float sdp = lvl > 1.5 ? p3 : id < 1.5 ? pS : id < 2.5 ? pC : (id < 3.5 || lvl > 0.5) ? pSal : pGy;
          float par = clamp(sdp + 0.5, 0., 1.);
          vec3 n = vN / max(length(vN), 1e-4); if (!gl_FrontFacing) n = -n;
          bool gold = vMisc.x < 0.5;
          // the metal half carries the leaf's own travelling highlight and nothing else; the colour half is its hex
          vec3 mc = nccMetal(gold ? uOrDeep : uArgDeep, gold ? uOr : uArg, gold ? uOrCore : uArgCore, n, vT, vec3(0., -1., 0.), vW, vec2(X, Y), 0.);
          vec3 cloth = lvl > 2.5 ? mc : mix(vCol, mc, abs(par - (1. - g)));
          // THE KEYLINE every charge has, sable at every distance: round a rectangular cloth it lies outside the cloth's own
          // edge (set out in the vertex shader, a pixel and a fifth and more); a forked pennon carries it inside its edge
          float rimIn = min(min(vXY.x, L - vXY.x), min(vXY.y, vHoist - vXY.y));
          float kw = max(0.11, 1.1 * mpp);
          float key = vRim < -0.5 ? 1. - smoothstep(-0.5 * mpp, 0.5 * mpp, rimIn) : 1. - smoothstep(kw - 0.5 * mpp, kw + 0.5 * mpp, vRim);
          cloth = mix(cloth, uSable, key);
          // the pole: argent on colour ground, sable on metal ground, at every distance
          vec3 col = vKind > 0.5 ? mix(uArg, uSable, g) : cloth;
          gl_FragColor = vec4(col, 1.);
        }`,
      side: THREE.DoubleSide,
    });
    const clothBase = (kind) => {                                // 0 a banner on its own short pole, 1 a standard (no pole: its lance is a slab), 2 the forked pennon
      const pos = [], knd = [], rim = [], idx = [], SEG = 12;
      if (kind < 2) {
        for (let i = 0; i <= SEG; i++) { pos.push(i / SEG, 0, 0, i / SEG, 1, 0); knd.push(0, 0); rim.push(-1, -1); }
        for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
        let b = pos.length / 3;
        if (kind === 0) for (const kd of [1, 2]) { pos.push(-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0); knd.push(kd, kd, kd, kd); rim.push(-1, -1, -1, -1); idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); b += 4; }
      } else {
        // the forked pennon: tapering, a notch cut in from the fly
        for (let i = 0; i <= SEG; i++) { const s = i / SEG, hh = 0.62 * (1 - 0.4 * s); pos.push(s, 0.62 - hh, 0, i === SEG ? 0.6 : s, 0.62, 0, s, 0.62 + hh, 0); knd.push(0, 0, 0); rim.push(0, i === 0 || i === SEG ? 0 : hh * CLOTH_H, 0); }
        for (let i = 0; i < SEG; i++) { const a = i * 3; idx.push(a, a + 1, a + 3, a + 3, a + 1, a + 4, a + 1, a + 2, a + 4, a + 4, a + 2, a + 5); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(knd, 1)); g.setAttribute('aRim', new THREE.Float32BufferAttribute(rim, 1)); g.setIndex(idx);
      return g;
    };
    // list items: [x, z, pole foot, top, pair, partition, phase, length, wind x, wind z, hoist]
    const mkCloth = (base, list, name) => {
      const n = list.length, place = new Float32Array(n * 4), col = new Float32Array(n * 3), misc = new Float32Array(n * 4), wind = new Float32Array(n * 3);
      list.forEach((c, i) => {
        place.set([c[0], c[1], c[2], c[3]], i * 4);
        const tc = T[c[4][0]]; col.set([tc.r, tc.g, tc.b], i * 3);
        misc.set([c[4][1] === 'or' ? 0 : 1, c[5], c[6], c[7]], i * 4); wind.set([c[8], c[9], c[10]], i * 3);
      });
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
      g.setAttribute('position', base.attributes.position); g.setAttribute('aKind', base.attributes.aKind); g.setAttribute('aRim', base.attributes.aRim);
      g.setAttribute('iPlace', new THREE.InstancedBufferAttribute(place, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(col, 3));
      g.setAttribute('iMisc', new THREE.InstancedBufferAttribute(misc, 4)); g.setAttribute('iWind', new THREE.InstancedBufferAttribute(wind, 3)); g.instanceCount = n;
      const m = new THREE.Mesh(g, clothMat); m.frustumCulled = false; m.name = name; scene.add(m); return m;
    };
    // THE CLOTH'S CLEAR AIR, AT FULL STREAM (one measure for every cloth: banners, standards and forked pennons; `depth`
    // is the cloth's own from its top edge, a forked pennon's 1.24 of its hoist): every half metre along it and every
    // half metre down it, less its furthest reach there: its wave to either side (1.3 of the wind's amplitude, by its
    // share of the length), the fly's own lift and fall (0.4 m by its share; a cloth longer than 12 m by its length's
    // share more) and the keyline set round it (0.11 m). A cloth whose head, less its whole length, depth and reach,
    // is no nearer than the kind's least so far is not gone over.
    const clothClear = (kind, x0, z0, top, wx, wz, L, depth) => {
      const lift = 0.4 * Math.max(1, L / 12), nd = Math.max(1, Math.ceil(depth / 0.5));
      if (CLEAR[kind] <= clearOf(x0, top, z0) - L - depth - windDroop * L - 1.3 * windAmp - lift - 0.11) return;
      for (let n = Math.max(1, Math.ceil(L / 0.5)), k = 0; k <= n; k++) {
        const s = k / n, X = L * s, x = x0 + wx * X, z = z0 + wz * X, y = top - windDroop * X * X / L, reach = (1.3 * windAmp + lift) * s + 0.11;
        for (let j = 0; j <= nd; j++) noteClear(kind, clearOf(x, y - depth * j / nd, z) - reach);
      }
    };
    {
      const lists = [[], []];
      const all = cloths.map((c) => [c, 0]).concat(standards.map((c) => [c, 1]));
      for (let i = 0; i < all.length; i++) {
        const c = all[i][0], std = all[i][1], L = c[8] ?? 7, hoist = std ? c[9] : (c[9] ?? CLOTH_H);
        const w = std ? [c[6], c[7]] : c[6] !== undefined ? [c[6], c[7]] : toHub(c[0], c[1]);
        const dealt = Math.floor(listRng() * 5) % 5, phase = listRng();
        if (c[11]) continue;
        const item = [c[0], c[1], c[2], c[3], c[4], std && c[10] !== undefined ? c[10] : dealt, phase, L, w[0], w[1], hoist];   // paly, bendy, per chevron, per saltire, gyronny (dealt, or the cloth's own where its place gives it)
        // THE CLOTH'S PASS-OVERS (branches on the two tinctures and the kind only; the same on every seed):
        // GOLD WITH SABLE OR WITH VERT NEVER SHOWS PER SALTIRE, AT ANY DISTANCE: gold quartered per saltire with black or
        // green comes near a known flag, and gyronny of gold and black is a known house's arms.
        // The paint draws a cloth dealt gyronny PER SALTIRE at its middle distance (see the fragment shader: sdp), so
        // ONE LAW covers whatever the paint can show per saltire: per saltire and gyronny alike, of gold with sable or
        // with vert, fly PER CHEVRON instead.
        // SABLE WITH GOLD NEVER FLIES PALY (Saxony's bars upright; barred on the roll, KNOWN, and on every striped thing,
        // palyOf): the cloth flies the next kind of the five, BENDY.
        if (item[4][1] === 'or' && (item[4][0] === 'sable' || item[4][0] === 'vert') && (item[5] === 3 || item[5] === 4)) item[5] = 2;
        if (noPaly(item[4]) && item[5] === 0) item[5] = 1;
        lists[std].push(item);
        clothClear(std ? 'cloth (standards of the lances)' : c[9] !== undefined ? 'cloth (the street\'s pennons)' : 'cloth (the camp\'s banners)', c[0], c[1], c[3], w[0], w[1], L, hoist);
        if (!std) for (let y = c[2]; y <= c[3] + 0.4; y += 0.5) noteClear('cloth (a banner\'s own pole)', clearOf(c[0], y, c[1]) - 0.18);
        if (i % 10 === 9) await ctx.yield();
      }
      mkCloth(clothBase(0), lists[0], 'cloth');
      mkCloth(clothBase(1), lists[1], 'standards');
      await ctx.yield();
      // THE LANCES' BODIES: one slab 14 m tall, set to each lance's own height; bendy in the row's pair, keylined
      // (each is measured as it is set, foot to point, on the slab as cut: less half its thickness and its keyline)
      const lgOl = [[-0.45, 0], [0.45, 0], [0.4, 12.2], [0.85, 12.75], [0, 14], [-0.85, 12.75], [-0.4, 12.2]], lgCl = cloudOf([lgOl], 0.5);
      const lg = style.slab(lgOl, { thickness: 0.5, keyline: 0.14, rim: 0.08, keyInset: 0.05 });
      const per = new Map(), lk = new THREE.InstancedMesh(lg.keyGeometry, style.keyline({ keyWidth: 0.14 }), staffs.length);
      staffs.forEach((q, i) => {
        const sy = q[3] / 14, m = new THREE.Matrix4().set(q[6], 0, q[5], q[0], 0, sy, 0, q[2], -q[5], 0, q[6], q[1], 0, 0, 0, 1);
        lk.setMatrixAt(i, m);
        const key = q[4][0] + '|' + q[4][1]; if (!per.has(key)) per.set(key, { pr: q[4], list: [] }); per.get(key).list.push(m);
        measure('lance of the lists', m.elements, lgCl, 0.25 + 0.14);
      });
      lk.frustumCulled = false; lk.name = 'lists-lances-keyline'; scene.add(lk);
      let nL = 0;
      per.forEach(({ pr, list }) => {
        const lm = new THREE.InstancedMesh(lg.geometry, stripedMat(pr[0], pr[1], 0.7071, 0.7071, 0.45, false), list.length);
        list.forEach((m, i) => lm.setMatrixAt(i, m));
        lm.frustumCulled = false; lm.name = 'lists-lances-' + (nL++); scene.add(lm);
      });
      // the lances of the great standards: one slab 32 m tall, set to each one's height; bendy, keylined
      {
        const ggOl = [[-1.1, 0], [1.1, 0], [0.95, 28], [2.0, 29], [0, 32], [-2.0, 29], [-0.95, 28]], ggCl = cloudOf([ggOl], 0.5);
        const gg = style.slab(ggOl, { thickness: 0.8, keyline: 0.3, rim: 0.15, keyInset: 0.08 });
        const gper = new Map(), gk = new THREE.InstancedMesh(gg.keyGeometry, style.keyline({ keyWidth: 0.3 }), great.length);
        great.forEach((q, i) => {
          const m = new THREE.Matrix4().set(q[6], 0, q[5], q[0], 0, q[3] / 32, 0, q[2], -q[5], 0, q[6], q[1], 0, 0, 0, 1);
          gk.setMatrixAt(i, m);
          const key = q[4][0] + '|' + q[4][1]; if (!gper.has(key)) gper.set(key, { pr: q[4], list: [] }); gper.get(key).list.push(m);
          measure('great lance', m.elements, ggCl, 0.4 + 0.3);
        });
        gk.frustumCulled = false; gk.name = 'great-lances-keyline'; scene.add(gk);
        let nG = 0;
        gper.forEach(({ pr, list }) => {
          const gm = new THREE.InstancedMesh(gg.geometry, stripedMat(pr[0], pr[1], 0.7071, 0.7071, 1.1, false), list.length);
          list.forEach((m, i) => gm.setMatrixAt(i, m));
          gm.frustumCulled = false; gm.name = 'great-lances-' + (nG++); scene.add(gm);
        });
      }
      // the two forked pennons, 12 m long, streaming from the lance heads well above the opening
      const e = path.end, t = path.endTangent, tl = Math.hypot(t.x, t.z) || 1, fx = t.x / tl, fz = t.z / tl;
      const penPair = pc === 'gules' ? D.rowPairs[0] : [pc, pm];   // gules never flies on cloth: a gules plain's pennons take the first row's pair
      const pens = [-1, 1].map((sd) => { const x = e.x + fz * sd * 9.35, z = e.z - fx * sd * 9.35, w = toHub(x, z); return [x, z, 0, 61.2, penPair, 1, listRng(), 12, w[0], w[1], CLOTH_H]; });
      pens.push([SHIP[0], SHIP[1], 0, 14.2 * SHIP_S, SHIP_PAIR, 1, listRng(), 10, -SHIP[3], SHIP[2], CLOTH_H * 1.1]);   // the ship's own pennon, streaming toward the hub
      // the keep's forked banner, 11 m long, from the head of its staff, streaming toward the hub (away from the way)
      pens.push([KEEP[0], KEEP[1], 0, KEEP_H + 5.6, KEEP_PAIR, 1, listRng(), 11, -KEEP[3], KEEP[2], CLOTH_H * 1.2]);
      // ---- THE ROLL'S CHARGES AND SHIELDS (round 14, T1; the places and sizes are THE ROLL OF ARMS', at the road).
      // A SHIELD is a heater: a slab of its field's METAL (argent and or by turns along the wall, the first dealt),
      // keylined sable, and on it ONE CHARGE cut flat in the wall's own COLOUR. THE CHARGES, our own and plain, fifteen:
      // four roundels (two and two), a chevron, a bend, a pale, a fess, a pile, three mullets in bend, three crescents
      // in pale, six billets (two pales of three), three lozenges in pale, a bordure, checky, barry of six, paly of six,
      // a chief. DEALT by the deal (the lists' own stream, after its last cloth): the fifteen are shuffled and each
      // shield takes the next one its tinctures allow, so NO TWO SHIELDS OF THE ROLL ARE ALIKE. Never: a plain cross, a
      // saltire, any beast, bird or flower, keys, a harp, a crown, three of anything two and one; and PASSED OVER
      // wherever the wall's colour, the shield's metal and the charge together are arms or a flag a visitor would know
      // as someone's (the owner's ruling on rider 2; KNOWN below, each with whose it is: a branch on the two tinctures
      // and the charge only, never on a seed). What is left for the worst wall: gules on argent seven kinds (roundels,
      // a pale, mullets, crescents, billets, lozenges, a bordure), gules on gold seven (a pale, mullets, crescents,
      // billets, lozenges, a bordure, a chief), six of them common to both: the gate's two and the red wall's two (two
      // of each metal at most, dealt first) are always filled, no two alike.
      // THE FAIR'S WALL'S FIVE (round 16) are hung LAST, after the gate's two and the eight, and draw nothing new from
      // the deal: each takes the next of the five kinds those ten have left (vert is passed over for nothing in KNOWN,
      // so the next is always allowed), its metal by turns onward from the red wall's last: so every shield hung
      // before them is as it was, and the fifteen kinds hang once each.
      // THE GATE'S TWO INNER FACES carry one shield of the roll each (T3), 4.2 m by 6.5, its head under the impost.
      {
        const SW = ROLL.w / 2, SH = ROLL.h, SS = 18, cxA = (SW * SW - (SH - SS) * (SH - SS)) / (2 * SW), rA = SW - cxA, aEnd = Math.asin((SH - SS) / rA);
        const HEATER = [[-SW, 0], [-SW, -SS]];   // (counter-clockwise from its head's left corner: down the left side, round the point, up the right)
        for (let k = 1; k <= 8; k++) { const a = aEnd * k / 8; HEATER.push([-cxA - rA * Math.cos(a), -SS - rA * Math.sin(a)]); }
        for (let k = 7; k >= 0; k--) { const a = aEnd * k / 8; HEATER.push([cxA + rA * Math.cos(a), -SS - rA * Math.sin(a)]); }
        HEATER.push([SW, 0]);
        const area = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
        // (a convex piece cut by the heater's own outline: Sutherland and Hodgman)
        const clip = (P) => { let out = area(P) < 0 ? P.slice().reverse() : P;
          for (let i = 0; i < HEATER.length && out.length; i++) { const A = HEATER[i], B = HEATER[(i + 1) % HEATER.length], inp = out, ins = (p) => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]) >= -1e-9; out = [];
            for (let j = 0; j < inp.length; j++) { const p = inp[j], q = inp[(j + 1) % inp.length], ip = ins(p), iq = ins(q);
              if (ip) out.push(p);
              if (ip !== iq) { const d1 = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]), d2 = (B[0] - A[0]) * (q[1] - A[1]) - (B[1] - A[1]) * (q[0] - A[0]), t = d1 / (d1 - d2); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } }
          return out; };
        const circle = (cx, cy, r, n = 20) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);
        const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        const band = (x0, y0, x1, y1, hw) => { const l = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / l * hw, ny = (x1 - x0) / l * hw; return [[x0 + nx, y0 + ny], [x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x1 + nx, y1 + ny]]; };
        const star = (cx, cy, r) => Array.from({ length: 5 }, (_, i) => { const a = Math.PI / 2 + 2 * Math.PI * i / 5, b = Math.PI / 5; return [[cx, cy], [cx + 0.42 * r * Math.cos(a - b), cy + 0.42 * r * Math.sin(a - b)], [cx + r * Math.cos(a), cy + r * Math.sin(a)], [cx + 0.42 * r * Math.cos(a + b), cy + 0.42 * r * Math.sin(a + b)]]; });
        // (a crescent, its horns up: the strip between a round's lower arc and the lower arc of a smaller round set higher)
        const crescent = (cx, cy, r) => Array.from({ length: 14 }, (_, i) => { const P = (t, R, c, a0, a1) => { const a = (a0 + (a1 - a0) * t) * RAD; return [cx + R * Math.cos(a), c + R * Math.sin(a)]; }, t0 = i / 14, t1 = (i + 1) / 14;
          return [P(t0, r, cy, 39.7, -219.7), P(t1, r, cy, 39.7, -219.7), P(t1, 0.8 * r, cy + 0.42 * r, 15.8, -195.8), P(t0, 0.8 * r, cy + 0.42 * r, 15.8, -195.8)]; });
        const inset = (p) => [p[0] * 0.76, -19 + (p[1] + 19) * 0.8];
        const CHARGES = {
          roundels: () => [circle(-7, -10, 5), circle(7, -10, 5), circle(-7, -26, 5), circle(7, -26, 5)],
          chevron: () => [band(0, -16.5, -24, -40.5, 3.4), band(0, -16.5, 24, -40.5, 3.4), [[0, -16.5 + 3.4 * Math.SQRT2], [-3.4 / Math.SQRT2, -16.5 + 3.4 / Math.SQRT2], [0, -16.5], [3.4 / Math.SQRT2, -16.5 + 3.4 / Math.SQRT2]]],
          bend: () => [band(-21.6, 7.3, 17.7, -50.9, 5)], pale: () => [rect(-5.3, -60, 5.3, 5)], fess: () => [rect(-20, -24.5, 20, -13.5)],
          pile: () => [[[-11, 2], [0, -41.5], [11, 2]]],
          mullets: () => [].concat(star(-7.5, -8.5, 5.4), star(0, -19.5, 5.4), star(7.5, -30.5, 5.4)),
          crescents: () => [].concat(crescent(0, -9, 4.8), crescent(0, -21, 4.8), crescent(0, -33, 4.8)),
          billets: () => [-6.5, 6.5].flatMap((x) => [-8, -19, -30].map((y) => rect(x - 1.9, y - 3.6, x + 1.9, y + 3.6))),
          lozenges: () => [-8.5, -20.5, -32.5].map((y) => [[0, y + 5.6], [-4.2, y], [0, y - 5.6], [4.2, y]]),
          bordure: () => HEATER.map((p, i) => { const q = HEATER[(i + 1) % HEATER.length]; return [p, q, inset(q), inset(p)]; }),
          checky: () => { const o = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) o.push(rect(-SW + 8 * i, -8 * (j + 1), -SW + 8 * (i + 1), -8 * j)); return o; },
          barry: () => [1, 3, 5].map((k) => rect(-20, -SH * (k + 1) / 6, 20, -SH * k / 6)),
          paly: () => [1, 3, 5].map((k) => rect(-SW + 2 * SW * k / 6, -60, -SW + 2 * SW * (k + 1) / 6, 5)),
          chief: () => [rect(-20, -13.5, 20, 5)],
        };
        const KNOWN = {
          gules: [                 // (the wall's colour with either metal)
            'checky',              // Croatia's chequy of red and white
            'paly',                // Aragon's pales, red on gold (Catalonia's flag)
            'barry',               // Hungary's bars, red and white
            'bend',                // Baden (gold, a red bend) and the city of Strasbourg (white, a red bend)
            'fess',                // Austria's colours, red and white in three bands
            'chevron'],            // Stafford (gold, a red chevron)
          'gules|argent': [
            'pile',                // Sir John Chandos (white, a red pile)
            'chief'],              // Menzies (white, a red chief)
          'gules|or': [
            'roundels',            // red balls on gold: the Medici, and Courtenay's three
            'pile'],               // Chandos again, as other rolls give him (gold, a red pile)
          'sable|or': [
            'barry',               // Saxony's bars, black and gold
            'paly',                // the same bars upright (and so nowhere in the world: no cloth, tent, pavilion or sail goes paly of sable and gold: palyOf, THE CLOTH'S PASS-OVERS)
            'bend'],               // Mauley (gold, a black bend)
          'sable|argent': [
            'checky',              // the chequered flag
            'pale',                // Erskine (white, a black pale)
            'chevron',             // Trelawny of Cornwall (white, a black chevron)
            'barry'],              // Brittany's flag, its black and white bars
        };
        const order = Object.keys(CHARGES); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(listRng() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
        const first = listRng() < 0.5 ? 0 : 1, METAL = ['argent', 'or'];
        const sg = style.slab(HEATER, { thickness: ROLL.thick, keyline: 0.9, rim: 0.5, keyInset: 0.15 });
        const fields = { argent: [], or: [] }, allM = [], tris = {}, _v = new THREE.Vector3(), _c0 = [0, 0], _c1 = [0, 0], heaterCl = cloudOf([HEATER], 2);
        // a shield set up: M its own space (x along its face, y up from its head's middle, z out of its face); the charge is dealt and cut
        // (the next of the shuffled fifteen that its tinctures allow. THERE IS ALWAYS ONE: a gules shield, with eight
        // kinds passed over at the most, is among the first four hung, twelve kinds and more yet unhung; a sable
        // shield, with four kinds passed over at the most, is among the first six hung, ten kinds and more yet
        // unhung; a purpure or a vert shield passes over none and takes the next kind unhung, and there are fifteen
        // kinds for the fifteen shields: the last of the fair wall's five takes the one kind left.) Its clear air is
        // measured as it is set: the heater as cut (a lattice of 2 m of its own), less half its thickness, its
        // charge's rise from it and its keyline, as set.
        const hang = (M, colour, metal, kind) => {
          const bad = (KNOWN[colour] || []).concat(KNOWN[colour + '|' + metal] || []), k = order.findIndex((n) => !bad.includes(n)), name = order.splice(k, 1)[0];
          fields[metal].push(M); allM.push(M); measure(kind, M.elements, heaterCl, (ROLL.thick / 2 + 0.5 + 0.9) * Math.hypot(M.elements[0], M.elements[1], M.elements[2]));
          const out = tris[colour] || (tris[colour] = { pos: [], nor: [] }), e = M.elements, nl = Math.hypot(e[8], e[9], e[10]) || 1;
          for (const piece of CHARGES[name]()) { const P = clip(piece); for (let i = 1; i + 1 < P.length; i++) for (const p of [P[0], P[i], P[i + 1]]) {
            _v.set(p[0], p[1], ROLL.thick / 2 + 0.5).applyMatrix4(M); out.pos.push(_v.x, _v.y, _v.z); out.nor.push(e[8] / nl, e[9] / nl, e[10] / nl); } }
        };
        // (dealt in this order: the gate's two, then the roll from the red wall back to the entry: gules has the fewest charges to take from)
        const wallC = (s) => (s < ROAD.b0 ? 'vert' : s < ROAD.b1 ? BRIDGE_C : s < ROAD.w1 ? 'gules' : 'vert');
        const onFace = (s) => { crestXZ(s, _c0); crestXZ(s + 1, _c1); const ex = _c1[0] - _c0[0], ez = _c1[1] - _c0[1], el = Math.hypot(ex, ez) || 1, nx = -ez / el, nz = ex / el, off = ROAD.out + ROLL.out + ROLL.thick / 2;
          return new THREE.Matrix4().set(nz, 0, nx, _c0[0] + nx * off, 0, 1, 0, ROLL.top(s) - ROLL.under, -nx, 0, nz, _c0[1] + nz * off, 0, 0, 0, 1); };
        { const q = beside(H_C, 0, [0, 0, 0, 1]), ax = q[3], az = -q[2], fx = -q[2], fz = -q[3], SL = Math.hypot(GATE.R - GATE.Rb, GATE.deep), K = 0.13;
          for (const sd of [1, -1]) {
            const nl = -sd * GATE.deep / SL, no = (GATE.R - GATE.Rb) / SL, nx = ax * nl + fx * no, nz = az * nl + fz * no, lat = sd * (GATE.R + GATE.Rb) / 2, off = 0.15 + ROLL.thick * K / 2;
            const x = q[0] + ax * lat - fx * GATE.deep / 2 + nx * off, z = q[1] + az * lat - fz * GATE.deep / 2 + nz * off, y = GATE.spring - 0.3;
            const M = new THREE.Matrix4().set(nz * K, 0, nx * K, x, 0, K, 0, y, -nx * K, 0, nz * K, z, 0, 0, 0, 1);
            hang(M, GATE_C, METAL[(first + (sd > 0 ? 0 : 1)) % 2], 'gate (the shields of its inner faces)');
          } }
        for (let i = ROLL.at.length - 1; i >= 0; i--) {
          const s = ROLL.at[i];
          hang(onFace(s), wallC(s), METAL[(first + i) % 2], 'roll of arms (its shields)');
        }
        // (the fair's wall's five, last: from the red wall's end onward)
        ROLL.fair.forEach((s, j) => hang(onFace(s), wallC(s), METAL[(first + ROLL.at.length + j) % 2], 'roll of arms (its shields on the fair\'s wall)'));
        let nf = 0;
        for (const mt of METAL) { if (!fields[mt].length) continue; const im = new THREE.InstancedMesh(sg.geometry, style.metal(mt), fields[mt].length); fields[mt].forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; im.name = 'roll-field-' + (nf++); scene.add(im); }
        const rk = new THREE.InstancedMesh(sg.keyGeometry, style.keyline({ keyWidth: 0.9 }), allM.length); allM.forEach((m, i) => rk.setMatrixAt(i, m)); rk.frustumCulled = false; rk.name = 'roll-keyline'; scene.add(rk);
        for (const colour of Object.keys(tris)) {
          const g = new THREE.BufferGeometry(), n = tris[colour].pos.length / 3;
          g.setAttribute('position', new THREE.Float32BufferAttribute(tris[colour].pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(tris[colour].nor, 3));
          g.setAttribute('aDome', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aLeaf', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
          const m = new THREE.Mesh(g, style.colour(colour)); m.frustumCulled = false; m.name = 'roll-charges-' + colour; scene.add(m); disposables.push(g);
        }
        disposables.push(sg.geometry, sg.keyGeometry);
        // THE ROLL'S PENNONS: each streams along the face the way we go, from its staff's head; of a pair of the ridge's hand whose colour is not the wall's there
        for (const c of ROLL.pens) {
          crestXZ(c, _c0); crestXZ(c + 1, _c1); const ex = _c1[0] - _c0[0], ez = _c1[1] - _c0[1], el = Math.hypot(ex, ez) || 1, off = ROAD.out + ROLL.staff[0] + 0.3;
          const pair = D.ridgePairs.find((p) => p[0] !== wallC(c)) || D.ridgePairs[0];
          pens.push([_c0[0] - ez / el * off, _c0[1] + ex / el * off, 0, ROLL.top(c) - ROLL.staff[2] - 0.4, pair, 1, listRng(), ROLL.pen[0], ex / el, ez / el, ROLL.pen[1]]);
        }
      }
      for (const lp of LANE_PENS) pens.push(lp);
      // (every forked pennon at full stream, by its kind: the exit lances' two, the ship's, the keep's banner, the
      // roll's, the lane's)
      pens.forEach((c, i) => clothClear('cloth (' + (i < 2 ? 'the exit lances\' pennons' : i === 2 ? 'the ship\'s pennon' : i === 3 ? 'the keep\'s banner' : i < 4 + ROLL.pens.length ? 'the roll\'s pennons' : 'the lane\'s pennons') + ')', c[0], c[1], c[3], c[8], c[9], c[7], 1.24 * c[10]));
      mkCloth(clothBase(2), pens, 'pennons');
    }
    await ctx.yield();

    // ---- THE SHIP ON THE RIVER (the crew lead's ruling): a LYMPHAD, flat as every charge here: a hull sable with both ends
    // upturned, one mast, one square sail paly of a row's pair (a colour and a metal; never the river's own azure, never sable with gold), a forked
    // pennon of the same pair at the masthead, and a bank of seven oars or, beating together on the world's cyclic clock.
    // It lies on the river's middle line on the RIDGE's hand of the way, its middle SHIP_LAT (150 m) from the way: 46.8 m
    // long, 36.9 m to the masthead, its side to the way that comes down to the river: from the black field it is seen
    // whole on the bars under the bridge and the lion. WHY 150 M (a length chosen freely): nearer the way the ship lies hard by us
    // as we come down to the river; further out it stands under the bridge's arches. From the way's height on line B
    // it is seen 6 degrees down, from the side: no deck shows and none is drawn; the oars are drawn in profile.
    {
      const sx = SHIP[0], sz = SHIP[1], hx = -SHIP_N[0], hz = -SHIP_N[1], S = SHIP_S, pair = SHIP_PAIR;
      const base = new THREE.Matrix4().set(-hz * S, 0, -hx, sx, 0, S, 0, 0, hx * S, 0, -hz, sz, 0, 0, 0, 1);   // local x: along the hull; the face: toward the way
      const part = (outline, mat, fwd, name) => {
        const sl = style.slab(outline, { thickness: 0.4, keyline: 0.2, rim: 0.12, keyInset: 0.06 }), m = base.clone(); m.elements[12] -= hx * fwd; m.elements[14] -= hz * fwd;
        measure('ship', m.elements, cloudOf([outline], 1), 0.2 + 0.2 * S);   // (each of its slabs, hull, mast, sail and the band of waves, as cut and set: less half its thickness and its keyline as set)
        for (const [g, mt, nm] of [[sl.geometry, mat, name], [sl.keyGeometry, shipKey, name + '-keyline']]) { const o = new THREE.Mesh(g, mt); o.matrixAutoUpdate = false; o.matrix.copy(m); o.matrixWorld.copy(m); o.frustumCulled = false; o.name = nm; scene.add(o); }
      };
      const shipKey = style.keyline({ keyWidth: 0.2 });
      part([[-9, 3.5], [-8.7, 1.7], [-7.2, 0.35], [-5, 0], [5, 0], [7.2, 0.35], [8.7, 1.7], [9, 3.5], [8.3, 3.75], [7.3, 2.1], [5.6, 1.7], [-5.6, 1.7], [-7.3, 2.1], [-8.3, 3.75]], style.colour('sable'), 0.3, 'ship-hull');
      part([[-0.28, 1.5], [0.28, 1.5], [0.22, 13.2], [0.5, 13.6], [0, 14.2], [-0.5, 13.6], [-0.22, 13.2]], style.colour('sable'), 0, 'ship-mast');
      part([[-4.3, 5.0], [-2.2, 4.5], [0, 4.35], [2.2, 4.5], [4.3, 5.0], [4.7, 11.3], [5.1, 11.4], [5.1, 11.9], [-5.1, 11.9], [-5.1, 11.4], [-4.7, 11.3]], stripedMat(pair[0], pair[1], 1, 0, 1.55, false), 0.6, 'ship-sail');
      // (ROUND 13b: THE SHIP STANDS IN ITS RIVER. From the first field the river's band is seen so low that it is a
      // line: the hull seemed to sit on the field. A BAND OF THE RIVER'S WAVES stands under the hull, upright in the
      // ship's own plane and before it: barry argent and azure, its crest wavy, 2.9 m high and 60 m long; the keel and
      // the oars' blades go down behind it.)
      part([...Array.from({ length: 47 }, (_, i) => [11.5 - i * 0.5, 0.92 + 0.2 * Math.sin((11.5 - i * 0.5) * 2 * Math.PI / 2.3)]), [-11.5, 0], [11.5, 0]], stripedMat('azure', 'argent', 0, 1, 0.37, false), 0.9, 'ship-water');
      // the oars: seven, each pivoted at the gunwale, 1.5 m apart; they sweep together between 35 and 65 degrees from the
      // upright, their blades toward the stern, dipping under the water at the catch (a cycle of 2.4 s, from the clock alone)
      const oarOl = [[-0.42, -2.9], [0.42, -2.9], [0.42, -2.0], [0.16, -1.7], [0.16, 0], [-0.16, 0], [-0.16, -1.7], [-0.42, -2.0]], oarCl = cloudOf([oarOl], 0.5);
      const og = style.slab(oarOl, { thickness: 0.3, keyline: 0.14, rim: 0.08, keyInset: 0.05 });
      const om = new THREE.InstancedMesh(og.geometry, style.metal('or'), 7), ok = new THREE.InstancedMesh(og.keyGeometry, style.keyline({ keyWidth: 0.14 }), 7);
      om.frustumCulled = ok.frustumCulled = false; om.name = 'ship-oars'; ok.name = 'ship-oars-keyline'; scene.add(om, ok);
      const _om = new THREE.Matrix4(), _or = new THREE.Matrix4();
      // (an oar's matrix at `deg` degrees from the upright; the oars' clear air at the two ends of their sweep and its middle)
      const oarAt = (i, deg) => { const a = deg * RAD, c = Math.cos(a), s = Math.sin(a); _or.set(c, s, 0, -4.5 + 1.5 * i, -s, c, 0, 1.5, 0, 0, 1, 0, 0, 0, 0, 1); _om.multiplyMatrices(base, _or); _om.elements[12] -= hx * 0.6; _om.elements[14] -= hz * 0.6; return _om; };
      for (let i = 0; i < 7; i++) for (const deg of [35, 50, 65]) measure('ship (its oars)', oarAt(i, deg).elements, oarCl, 0.15 + 0.14 * S);
      updaters.push((dt, time) => {
        const a = (50 + 15 * Math.sin(time * 2 * Math.PI / 2.4)) * RAD, c = Math.cos(a), s = Math.sin(a);
        for (let i = 0; i < 7; i++) {
          _or.set(c, s, 0, -4.5 + 1.5 * i, -s, c, 0, 1.5, 0, 0, 1, 0, 0, 0, 0, 1); _om.multiplyMatrices(base, _or);
          _om.elements[12] -= hx * 0.6; _om.elements[14] -= hz * 0.6;
          om.setMatrixAt(i, _om); ok.setMatrixAt(i, _om);
        }
        om.instanceMatrix.needsUpdate = ok.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();

    // ---- THE KEEP (the crew lead's ruling): beyond the ring on the hub's hand (see THE KEEP'S PLACE) stands
    // one tall plain tower, a flat charge as everything here: 8.4 m across and KEEP_H (30 m) to its battlements, embattled,
    // PARTY PER PALE of a row's pair (a colour and a metal, changing places by the law of counterchange), keylined sable, a
    // short staff on its head and from it one forked banner streaming toward the hub. No device and nothing lettered. Its
    // face is turned as the camp's faces are: back along the way, 25 degrees toward the way's line. It is a made thing beside
    // the way (no passage): it comes into the picture far off as our look turns to the ring, and stands whole beside the ring to the end.
    {
      const W2 = 4.2, H = KEEP_H, c = 5.0, m = 2.0;   // half width, height, the corbelled head's half width, a merlon's width
      const outline = [[-W2, 0], [W2, 0], [W2, H - 5.2], [c, H - 4.2], [c, H], [c - m, H], [c - m, H - 1.9], [m / 2, H - 1.9], [m / 2, H], [0.3, H], [0.3, H + 5.2], [0.75, H + 5.6], [0, H + 6.6], [-0.75, H + 5.6], [-0.3, H + 5.2],
        [-0.3, H], [-m / 2, H], [-m / 2, H - 1.9], [-(c - m), H - 1.9], [-(c - m), H], [-c, H], [-c, H - 4.2], [-W2, H - 5.2]];
      const kg = style.slab(outline, { thickness: 1.2, keyline: 0.3, rim: 0.2, keyInset: 0.1 });
      const ca = Math.cos(25 * RAD), sa = Math.sin(25 * RAD), nx = -KEEP[2] * ca + KEEP[3] * sa, nz = -KEEP[3] * ca - KEEP[2] * sa;
      const mk = new THREE.Matrix4().set(nz, 0, nx, KEEP[0], 0, 1, 0, 0, -nx, 0, nz, KEEP[1], 0, 0, 0, 1);
      for (const [g, mt, nm] of [[kg.geometry, partedMat(KEEP_PAIR[0], KEEP_PAIR[1], 2), 'keep'], [kg.keyGeometry, style.keyline({ keyWidth: 0.3 }), 'keep-keyline']]) {
        const o = new THREE.Mesh(g, mt); o.matrixAutoUpdate = false; o.matrix.copy(mk); o.matrixWorld.copy(mk); o.frustumCulled = false; o.name = nm; scene.add(o);
      }
      // its clear air as built: the tower and its staff as cut and set, less half its thickness and its keyline
      measure('keep', mk.elements, cloudOf([outline], 1), 0.6 + 0.3);
    }
    await ctx.yield();

    // ---- THE RARE EVENT, goutty: from line A to the river it also rains gold, gouttes 2.1 m long falling down fixed
    // columns (particles: see THE PARTICLES' HELPERS for their fall and their near law; or over colour, gules over
    // metal). WHERE THE COLUMNS STAND: between line A and 29 m short of line B, before the river's edge (the test of place below is the
    // law; the box they are drawn from, route metres 150 to 330 and 50 m to either hand, is only wide enough to
    // hold that stretch), 5.6 to 50 m from the flown line in plan.
    if (D.rare) {
      const gRng = rng_fork(ctx.rng, 'gouttes');
      const want = D.count(380), attr = new Float32Array(want * 4), gFall = new Float32Array(want), uA = style.uniforms.uCcA.value, uB = style.uniforms.uCcB.value;
      let n = 0;
      for (let tries = 0; n < want && tries < want * 6; tries++) {
        if (tries % 120 === 119) await ctx.yield();
        const h = gRng.range(150, 330), lat = gRng.range(-50, 50), ph = gRng();
        beside(h, lat, _sr);
        const rx = _sr[0] - HUB[0], rz = _sr[1] - HUB[1];
        if (uA.x * rz - uA.y * rx < 2 || uB.x * rz - uB.y * rx > -29) continue;     // between line A (2 m past it) and 29 m short of line B: before the river's edge (25) and every reach of its wave (28.6)
        const near = planOf(_sr[0], _sr[1]);
        if (near < 5.6 || near > 50) continue;
        gFall[n] = fallOf(_sr[0], _sr[1]);
        attr.set([_sr[0], _sr[1], ph, style.ground(_sr[0], _sr[1]) > 0.5 ? 0 : 1], n * 4); n++;
        noteClear('goutte column (particle)', near - 0.4);
      }
      const drop = shapeGeo([[0, 0], [0.26, 0.08], [0.37, 0.32], [0.3, 0.6], [0.12, 1.02], [0, 1.4], [-0.12, 1.02], [-0.3, 0.6], [-0.37, 0.32], [-0.26, 0.08]].map((q) => [q[0] * 1.5, q[1] * 1.5]));
      mkParticles(drop, attr, gFall, n, partMat('or', 'gules', true), 'gouttes-keyline');
      mkParticles(drop, attr, gFall, n, partMat('or', 'gules'), 'gouttes');
    }
    await ctx.yield();
    return {
      scene, path, duration: 42, pace,
      camera: CAM,
      pois,
      // THE DISC IN THE RING is a plate of gold (the crew lead's ruling, as it stood two rounds before round 11): colour
      // (5, 3.9, 1.1), glow 0.08.
      portal: { shape: 'circle', radius: 7, tilt: true, color: new THREE.Color(5, 3.9, 1.1), glow: 0.08, halo: false, revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        style.update(dt, time, camera);                             // the kit's own shared uniforms (clock, pixel size)
        lionH = hOfU(u);                                            // (the metre of our way the lion is drawn for: THE WAITING LION STANDS BACK, AND UNDER THE WALLS' TOPS)
        hero.setProgress(u);
        hero.update(dt, time);                                      // (the lion: its place, attitude and drawn flank by u and the clock; the camera is not passed)
        lionH = -1;
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, time, u);
      },
      dispose() { for (const d of disposables) d.dispose(); hero.dispose(); },
    };
  },
};
