// The Loom of Numbers. One long house of iron and glass in clear morning light holds a works that was never built:
// whole, of a cathedral's size, and running with no one in it. The line of the flight: in high under the Store's
// glass vault and down between its ranks of golden number columns; past the Drive's flywheel in its brick bay (in a
// kerbed pit between two bearing frames, its one leather belt going up to the line shaft); half round the dark drum
// of the Mill, where the carry's wave climbs the tall wheel stacks (the hero: src/parts/loom-of-numbers.js); under
// two curtains of hanging card chains, through a third and over a fourth; and down the cloth's face on the great
// loom to the gate in its foot, the drawn-off cloth hanging to either hand.
// No person and no figure anywhere; no digit, letter or sign on anything.
//
// AXES: +x east along the house and the way, +z south, y up, metres; the floor is y 0. The house's measures are the
// part's PLAN. FOUR HALLS on one axis: the Store x -40 to 240 (the Drive's crossing 240 to 300), the Mill's drum
// 75 m about (420, 0) with links to x 300 and 540, the Cards x 540 to 740, the Loom x 740 to its oak end wall at x 942.
//
// EVERY MOVER KEEPS ITS OWN TIME BY THE WORLD'S CLOCK and its own draws: wheels in runs, racks out and back with their
// pinions and the down rods and bell cranks that carry a rack's motion down a column's side, the flywheel, beam and
// governor, the flywheel's turning shade on the bay's floor and walls, the leather belt (its laps and stitches run
// at the rim's own speed by the wheel's dealt phase) and its three pulleys, the steam (by the engine's stroke), the
// barrels' steps and their combs, the carry's waves, every chain's step, the lifting threads, the heddle bars, the
// shuttles (four as parts of ONE dealt round, so that one is in the warp at every clock), reed, the creeping cloth
// and its light on the floor, the two falls of drawn-off cloth and their take-up rolls, the spools (the last creels'
// too), the glint up each drawn thread, the hung lengths' breathing (the two outer lengths' too), the cloud banks
// beyond the glass, the dust of the lit air. Nothing reads the metres flown or the eye's place to move,
// begin, stop, light or come on; no round is the first and none the last. A thing with no spindle carries no wave
// by rule (the part's NO_WAVE). THERE IS NO DECLARED PACING and no companion. The pace of the flight is by place
// (slower inside the Mill's drum). FOUR PULLS OF THE GAZE, each by named places of the house, with one law of rise
// and fall (PULL_RAMP): THE FLYWHEEL'S HUB (from the first metre at which the wheel's whole face is clear of the
// north inner rank's last column, found by geometry, to the hub abeam); THE ROUND'S LEAN (GAZE_LEAN: the gaze 73
// degrees inward of the round's own heading, the one typed measure of the round's gaze, which is a point of the
// fans' inner ring; the Mill's centre then stands 17 degrees inside the picture's middle and is never abeam); THE
// WAY OUT (from the round's bearing HAND_BEAR the gaze goes to the east arch on the house's axis and on down the
// Cards); THE LOOPS OVERHEAD (while loops hang over the line: from the first curtain's first loop to the second
// curtain's last card). THE WAY OUT'S MEASURES follow from two places, the round's radius and the east arch's
// opening by the plan's measure (where the drum's open bays end on the drum's own circle: the plane x = JAMB_X,
// JAMB_Z, 14.63 m, to either side of the axis): the line is on the Cards' axis JAMB_Z before that plane; the arc
// out's radius ARC_OUT (14.7 m) and the round's end (bearing 14.0 degrees) follow from that place. (The built
// jambs are piers standing inside that circle: their inner faces are 13.64 m from the axis.)
//
// WHAT READS THE PICTURE'S GRAIN OR THE EYE in this file's shaders (the part names its own). Each is a law of drawing
// only: no thing's place, form, clock or number is taken from it.
// A FILTER BY A PIXEL'S FOOTPRINT (fwidth; this file has no dFdx and no dFdy):
//  - the glazing bars in a pane (barLine, the glass); the floor's slab joints; the far ranks' drawn wheels (the
//    drum's notches, worn edges and wheel joints go to their mean tone); a card's holes (cut near, then a darker
//    mark, then one even tone: a far card is one even tone of its own pasteboard, ivory or dyed), its cut edge and
//    its laces; the leather belt's laps and stitch
//    rows (to the leather's mean tone); the cloth's weave; the threads ruled on the warp, the harness, and
//    the creels' sheets (lines go to an even veil of their mean), and the gaps between the bundles of the warp and
//    the harness (a gap goes to the sheet's mean cover before it is finer than the grain);
//  - THE MORNING BEYOND THE GLASS: the fields' tones, the lawn's swathes and the shade beside a hedge go to their
//    mean before they are finer than the grain, and a hedge's, a tree line's and a wood's edge is as soft as the
//    grain (the footprint of the land's meeting point: fq, px); so do the strips a near field lies in (a strip's
//    edge is as soft as the grain, and strips finer than it go to the meadows' mean), the sward's mottle and the
//    ground's broad swell; the banks' shade on the land goes to its mean before its patches are finer than the
//    grain (the same footprint, carried to the sheet: fs); the cloud banks lose their finer octaves by the
//    footprint of the sheet's meeting point (bankAt) and a bank's edge is as soft as the grain (e0); the far
//    ranges' skylines and the mist's band by the footprint of the elevation looked at (ee).
// THIS WORLD'S FAR MORNING, BY THE DIRECTION LOOKED IN ALONE (declared: the three things drawn as endlessly far, the
// same from every place of the house): the sky's colour, the sun's glow, and the far ranges of hills in three blues.
// BY THE EYE'S TRUE PLACE, AS A MEETING POINT IN THE WORLD: the cloud sheet and the near land. The eye's line through
// a pane is met with a level plane (CLOUD_Y over the floor for the banks; LAND_Y under it for the land, and the
// levels of its hedges' and crowns' tops) from the eye's own place (cameraPosition), and the pattern is drawn by
// that meeting point's world x and z. So a hedge stands at its own place of the world: it passes as the house is
// flown, sinks as the line climbs, and stands there again on the next visit of the seed. The banks drift by the
// world's clock. THE BANKS' SHADE ON THE LAND is by the land's own place and the sun, not by the eye: a place of
// the land lies in shade where its own line toward the seed's sun meets a bank of the sheet, so a patch of shade
// stands at its place of the world and passes over the fields with the banks' drift.
// A SHADING BY THE DIRECTION FROM A THING TO THE EYE (cameraPosition):
//  - the floor's polish (what it shows of the ranks' feet, of the Mill's thirty columns and three barrels, of the
//    links' glass walls and the east link's ten falls, of the Cards' windows and, west of the Loom hall's west
//    wall, of the Cards' chains, each in the pasteboard it was dealt, and of the loom's warp: each found where the
//    eye's line turned up off the floor meets the thing's own standing place; the Mill's feet, the links' glass
//    and every chain of cards stand in it the softer the longer that line;
//    and THE CLOTH'S POOL: the cloth lit through, drawn out by the polish into a long soft pool of its own colours
//    before the loom, found the same way, the colours by the cloth's own creep); the far ranks' drums (the broad
//    highlight and the turning edge of a round, as the part's true wheels);
//    the lantern's shaft of lit air in the Mill and the sunlit air of three rooms (what is gathered along the eye's
//    line through each, brightest looked through toward the sun); and the part's shadeMetal, shadeDull, hazed.
// TURNED BY THE EYE'S PLACE: the steam's puffs only (round dabs of a medium, each turned about its own place of the
// world to face the eye; its place, size and age are the world's). Nothing is centred on the eye or follows it: the
// land and the banks are places of the world, and the far morning is by direction as a thing endlessly far is.
// PLACED WITH THE WAY IN MIND, each at a place of the house and not of the flight: the four pulls of the gaze, the
// pace's slowing inside the drum, the rooms of lit air (all south of the line). MEDIA (not bodies of matter, but
// counted as bodies for clear air): the steam (the ball its puffs never leave: 7.7 m from the line at the nearest),
// the lantern's shaft (28 m), the rooms of sunlit air in the Store, the Drive's south bay and the Loom hall (each
// 4 m and more from every place of the line; the Cards' air is clear: no room of lit air stands in that hall).
// BEHIND THE ENTRY the nave stands 40 m on to its west wall of glass, whole.
// THE HALL'S EAST END is an oak wall from wall to wall and floor to roof (boards and two posts), with the gateway under
// the loom and THREE windows, each behind cloth: the opening behind the loom's cloth, and one to either side behind
// an outer hung length (PLAN.outerZ, outerY); cloth covers each whole, so no glass there is seen bare, and the only
// sun from the east is what has passed the silk (the part's loomSun and clothLight). Beside the gate, outside the
// loom's foot posts, the finished cloth is drawn off in TWO FALLS over a guide rail down to take-up rolls on the
// floor (PLAN.fallZ, fallTop, fallX): from floor to roof the wall is cloth, oak only as posts and beams between.
// IN THE MILL every column, spindle, comb post and barrel stands on its own foot on the bare floor (no plate, no
// plinth); the floor's contact shade lies about each foot alone (footShade). OVER THE ENGINE WING'S MOUTH each
// bridge hangs from the vault's purlins in one clear span, which is the wing's own mouth (PLAN.storeX1 to crossX1:
// no trestle before the flywheel; the bed's east end is carried off the arch's pier).
// THE CARDS' PASTEBOARDS: a chain of cards is of one pasteboard, ivory or dyed in a colour of the seed's own cloth
// (the dealt colours are read; the cloth's stream gives no draw for it). Which chain is of which is dealt by the
// dye's streams, made after every other stream of the world: one for the hall's order of dyes and the curtains'
// leads, one for each curtain's loops, one for the walls' falls, one for the link's falls. They deal that and
// nothing else, and no other stream gives or loses a draw for it. The runs of chain to the loom's head are ivory
// on every seed.
// THE WAY OUT: the engine's ring is a gate standing on the floor in the loom's foot, in the end wall's gateway;
// nothing here comes on by the
// metres still to fly, and this source draws no ring, no lamp that grows and no double of the ring (a standing lamp
// of the place is in the part).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  PLAN, makeShared, LIGHT_GLSL, SHADE_GLSL, RACK_GLSL, WHEEL_GLSL, makeMesher, lin, MATTER, wheelStackGeometry, makeWheelMaterial,
  makeWheelColumn, makePlainMaterial, buildHero, NO_WAVE, PASTE, PASTE_GLSL,
} from '../parts/loom-of-numbers.js';

// ---------------------------------------------------------------- the line (by geometry; its length falls where it falls)
// IN HIGH: the first metres run level under the glass vault, 4 m over the rack beds, so that the whole Store lies under
// the eye; then the line sinks between the two inner ranks into the nave and runs low to the ranks' end (no rise where
// columns stand). The rise past the flywheel, from its hub's height; a right arc of ARC_R into the Mill; the round
// ROUND_R from the Mill's centre by the south, sinking from EYE_MILL to EYE_OUT; the arc out (ARC_OUT) onto the axis.
// THE CARDS, two unlike halves. From the east arch the line SINKS to pass UNDER the first two curtains, EYE_UNDER over
// the floor: their loops and the sun through them are overhead, the lowest cards UNDER_CLEAR over the eye. From the
// first gallery post east of the second curtain it CLIMBS: through the third curtain, which hangs from the two upper
// rails only (the hall's high curtain: see buildCards), and over the low loops of the fourth, on without a flat to
// its HIGHEST at the head chains' first roller in the Loom hall, at the height of the middle of the loom's cloth;
// from there ONE eased slope down the face of the loom to the gate's middle, level from the last creels' first spool.
const RISE0 = PLAN.colX0 + (PLAN.colN - 1) * PLAN.colStep, ROUND_R = 46, ARC_R = 40, EYE0 = 8, EYE_MILL = 30, EYE_OUT = 18;
// THE WAY OUT OF THE ROUND, by two places: the round's own radius and the east arch. THE ARCH'S OPENING BY THE
// PLAN'S MEASURE ends where the drum's open bays end on the drum's own circle (the drum's bays are 7.5 degrees,
// three of them open: 11.25 degrees to either side of the axis): in the plane x = JAMB_X, JAMB_Z (14.63 m) from the
// axis. (The built jambs are piers 1.6 m broad whose middles stand 0.4 m inside that circle: their inner faces are
// 13.64 m from the axis, a metre nearer it than JAMB_Z.) THE LINE IS ON THE CARDS' AXIS JAMB_Z BEFORE THAT PLANE
// (the plan's half breadth of the opening before its plane: x = JAMB_X - JAMB_Z, 14.63 m before the plane).
// The arc out is the one arc that leaves the round as its tangent and meets the axis as its
// tangent at that place, and its radius ARC_OUT follows (about 14.7 m; the round then runs on to bearing 14.0
// degrees and the arc out turns 76.0 degrees). Such an arc is only where that place lies outside the round, more
// than ROUND_R from the Mill's centre: layRoute checks it.
const JAMB_BEAR = 11.25 * Math.PI / 180;
const JAMB_X = PLAN.cx + PLAN.drumR * Math.cos(JAMB_BEAR), JAMB_Z = PLAN.drumR * Math.sin(JAMB_BEAR);
const ARC_OUT = ((JAMB_X - JAMB_Z - PLAN.cx) ** 2 - ROUND_R ** 2) / (2 * ROUND_R);
// the gate in the loom's foot: an arch 16 m broad and 20 m high standing on the floor; the line ends at its middle
const GATE_W = PLAN.gateW, GATE_H = PLAN.gateH, EYE_END = GATE_H / 2, END_X = PLAN.loomX;
// the high entry: over the rack beds (their upper faces stand at y 30.15) and under the line shaft's wheels (y 43.5).
// the sinkings: 19 degrees at the steepest into the nave; each slope eased over SINK_EASE metres at either end
const EYE_HIGH = 34, SINK_WEST = Math.tan(19 * Math.PI / 180), SINK_EASE = 18;
// WHERE THE SINKING INTO THE NAVE BEGINS: it lies in the middle of the ranks as flown. Of the way from the entry
// (x 0) to the ranks' last column (RISE0) the sinking takes SINK_RUN (its fall at SINK_WEST and the slope's two
// easings); what is left is shared alike by the high run before it and the low run after it, and the sinking begins
// under the vault's rib next west of that place (the ribs stand VAULT_STEP apart from VAULT_X0, 1.5 m inside the
// west wall): so the high run ends under a rib, and the low run is the longer by what is left of a bay.
const VAULT_STEP = 14, VAULT_X0 = PLAN.storeX0 + 1.5, SINK_RUN = (EYE_HIGH - EYE0) / SINK_WEST + SINK_EASE;
const ENTRY_LEVEL = VAULT_X0 + VAULT_STEP * Math.floor(((RISE0 - SINK_RUN) / 2 - VAULT_X0) / VAULT_STEP);
// THE CARDS' CURTAINS as the line reads them: where the four stand, how far a curtain reaches along the hall at its
// broadest deal (six loops abreast, four metres apart, a card three metres long, and its swing), where a loop's
// lowest card hangs over the hall's middle for each rail [least, most], and the gallery posts (every 10 m)
const CURTAIN_X = [580, 620, 660, 700], CURTAIN_REACH = 2.5 * 4 + 1.5 + 0.45, LOOP_LOW = { 44: [36, 38], 35: [27.5, 29.5], 17: [9, 11] };
const GAL_POST0 = PLAN.cardX0 + 5, GAL_POST_STEP = 10;
// under the first curtains: UNDER_CLEAR under the lowest card of the lowest loop (CLEAR_AIR, 2.6 m, the loop's
// swing and a margin). THE SINKING FROM THE EAST ARCH, by two places: it begins in the arch's plane and is level at
// UNDER_X, the last gallery post that stands CLEAR_AIR or more west of the first curtain's first loop (CURTAIN_X[0]
// less CURTAIN_REACH). Its slope follows from the two (SINK_CARDS, with the slopes' law below: about 13.5 degrees);
// SINK_CEIL, the 14 degrees once ordered, is only its ceiling (were the two places to ask for more, the slope would
// keep to the ceiling and the sinking end later).
const UNDER_CLEAR = 3.5, EYE_UNDER = LOOP_LOW[17][0] - UNDER_CLEAR, CLEAR_AIR = 2.6, SINK_CEIL = Math.tan(14 * Math.PI / 180);
const UNDER_X = GAL_POST0 + GAL_POST_STEP * Math.floor((CURTAIN_X[0] - CURTAIN_REACH - CLEAR_AIR - GAL_POST0) / GAL_POST_STEP);
// the climb begins at the first gallery post east of the second curtain's last card
const CLIMB0 = GAL_POST0 + GAL_POST_STEP * Math.ceil((CURTAIN_X[1] + CURTAIN_REACH - GAL_POST0) / GAL_POST_STEP);
// THE HIGHEST PLACE: under the head chains' first roller (the Loom hall's fourth roof beam, where the chains that go
// on to the loom's head are first carried), at the height of the middle of the cloth on the loom (half way from
// the roller's top face to the fell). No flat is held there: the climb's slope eases out into the sinking's.
// (the Loom hall's roof beams stand ROOF_STEP apart from 4 m inside its west wall)
const ROOF_STEP = 16, PEAK_X = PLAN.loomX0 + 4 + 3 * ROOF_STEP, EYE_PEAK = (PLAN.rollY + 1.2 + PLAN.fellY) / 2;
// THE LAST LEVEL RUN is from a thing of the hall: the gate is met level from abeam the first spool of the last creels
// (LAST_X0, with the creels below), so the eye runs level between the two last creels to the gate. LAST_CEIL: the
// last sinking's ceiling, 17 degrees (a check, as the Cards' is).
const LAST_CEIL = Math.tan(17 * Math.PI / 180);
// how far a sinking of h metres has come d metres after its start: the slope eases in over e metres, holds, eases out
function sunk(d, h, slope, e = SINK_EASE) {
  const T = h / slope + e;
  if (d <= 0) return 0;
  if (d >= T) return h;
  if (d < e) return slope * d * d / (2 * e);
  if (d > T - e) return h - slope * (T - d) * (T - d) / (2 * e);
  return slope * (d - e / 2);
}
// the slope that carries h metres over a run of T metres, eased over e at either end
const slopeOver = (h, T, e = SINK_EASE) => h / (T - e);
const SINK_CARDS = Math.min(SINK_CEIL, slopeOver(EYE_OUT - EYE_UNDER, UNDER_X - PLAN.archE));
function layRoute() {
  const off = Math.sqrt((ROUND_R + ARC_R) ** 2 - ARC_R ** 2), xa = PLAN.cx - off, xb = JAMB_X - JAMB_Z;
  // (the check of the way out's place: it lies outside the round, or no arc leaves the round to meet the axis there)
  if (!(xb - PLAN.cx > ROUND_R)) throw new Error('loom-of-numbers: the way out would meet the axis inside the round');
  const sweep = Math.acos(ARC_R / (ROUND_R + ARC_R)), sweepOut = Math.acos(ARC_OUT / (ROUND_R + ARC_OUT)), b0 = Math.PI / 2 + sweep, b1 = Math.PI / 2 - sweepOut;
  const pts = [];
  const yWest = (x) => (x < RISE0 ? EYE_HIGH - sunk(x - ENTRY_LEVEL, EYE_HIGH - EYE0, SINK_WEST) : EYE0 + (EYE_MILL - EYE0) * smoothstep(RISE0, PLAN.archW, x));
  // east of the Mill: down from the east arch to be level at UNDER_X and pass under the first two curtains; up from
  // CLIMB0 to the highest place at PEAK_X; down in one slope to be level from LAST_X0 to the gate. The two long
  // slopes follow from their ends (the climb about 13.7 degrees, the last sinking 17.0, under its ceiling)
  const up = slopeOver(EYE_PEAK - EYE_UNDER, PEAK_X - CLIMB0), down = Math.min(LAST_CEIL, slopeOver(EYE_PEAK - EYE_END, LAST_X0 - PEAK_X));
  const yEast = (x) => {
    if (x < CLIMB0) return EYE_OUT - sunk(x - PLAN.archE, EYE_OUT - EYE_UNDER, SINK_CARDS);
    if (x < PEAK_X) return EYE_UNDER + sunk(x - CLIMB0, EYE_PEAK - EYE_UNDER, up);
    return EYE_PEAK - sunk(x - PEAK_X, EYE_PEAK - EYE_END, down);
  };
  for (let x = 0; x < xa - 3; x += 6) pts.push([x, yWest(x), 0]);
  for (let i = 0; i <= 6; i++) { const a = sweep * i / 6; pts.push([xa + ARC_R * Math.sin(a), EYE_MILL, ARC_R - ARC_R * Math.cos(a)]); }
  for (let i = 1; i <= 17; i++) { const t = i / 18, b = b0 + (b1 - b0) * t; pts.push([PLAN.cx + ROUND_R * Math.cos(b), EYE_MILL + (EYE_OUT - EYE_MILL) * smoothstep(0, 1, t), ROUND_R * Math.sin(b)]); }
  for (let i = 6; i >= 0; i--) { const a = sweepOut * i / 6, x = xb - ARC_OUT * Math.sin(a); pts.push([x, yEast(x), ARC_OUT - ARC_OUT * Math.cos(a)]); }
  // (east of the arc out's end the axis' stations are laid at one step of 6 m, from xb + 6 to the end)
  for (let x = xb + 6; x < END_X - 3; x += 6) pts.push([x, yEast(x), 0]);
  pts.push([END_X, EYE_END, 0]);
  return { pts, xa, xb, b0, b1, up, down };
}

// ---------------------------------------------------------------- glass: the sky seen in the house's panes
// A pane shows the morning sky in the direction it is looked through (pale low, bluer high, the sun's glow where the
// sun stands) and carries its glazing bars, drawn in metres of the pane's own face (uv) and softened by the grain.
// the Cards' panes: the share of the morning they let through, and the shoulder that holds them under white
const CARD_PANE = 0.62, PANE_KNEE = 0.5, PANE_TOP = 0.78;
// THE MORNING'S TWO LEVEL PLANES, each a place of the world. LAND_Y: the house stands on a terrace, its floor three
// metres over its lawn (so the land lies under every eye of the flight). CLOUD_Y: the base of fair-weather banks on a
// clear morning, 800 m over the floor. THE LAND'S MEASURES: the lawn reaches LAWN from the house's walls; a field is
// FIELD metres; a hedge stands HEDGE_H; a tree line, a wood or a great tree stands WOOD_H over the land (under the
// lowest eye of the flight, EYE_UNDER over the floor, so the eye's line always comes down on a crown from above)
// and none stands nearer the house than FAR_WOOD. A field whose middle lies within STRIPS_NEAR of the house's walls is
// parted into strips of meadow. From WOODS_CLOSE[0] to WOODS_CLOSE[1] metres out the woods close up into one dark
// band. The shade beside what stands on a boundary lies SHADE_LONG times as long as the sun's height gives it.
const LAND_Y = -3, CLOUD_Y = 800, LAWN = 45, FIELD = [170, 120], HEDGE_H = 3, WOOD_H = 7, FAR_WOOD = 250, CROWN = 14;
const STRIPS_NEAR = 400, WOODS_CLOSE = [700, 1700], SHADE_LONG = 2;
// the land by its own place (p: world x, z in metres): the house's plan, the fields' grid, what stands tall
function landGlsl() {
  const box = (x0, x1, z0, z1) => `boxD(p, vec2(${f1((x0 + x1) / 2)}, ${f1((z0 + z1) / 2)}), vec2(${f1((x1 - x0) / 2)}, ${f1((z1 - z0) / 2)}))`;
  return /* glsl */`
      float vnoise(vec2 x){
        vec2 i = floor(x), f = fract(x); f = f*f*(3. - 2.*f);
        return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
      }
      float boxD(vec2 p, vec2 c, vec2 h){ vec2 d = abs(p - c) - h; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
      // (the cloud sheet's banks at a place of the sheet, as the panes' sky has them: the land reads its shade there)
      float bankAt(vec2 c, float fw);
      // how far a place of the land lies from the house's walls (the four halls, the crossing's wings, the links)
      float houseD(vec2 p){
        float d = ${box(PLAN.storeX0, PLAN.storeX1, -PLAN.storeHalf, PLAN.storeHalf)};
        d = min(d, ${box(PLAN.storeX1, PLAN.crossX1, -WING_N, WING_S)});
        d = min(d, ${box(PLAN.crossX1, PLAN.cardX0, -LINK_HALF, LINK_HALF)});
        d = min(d, length(p - vec2(${f1(PLAN.cx)}, ${f1(PLAN.cz)})) - ${f1(PLAN.drumR)});
        d = min(d, ${box(PLAN.cardX0, PLAN.cardX1, -PLAN.cardHalf, PLAN.cardHalf)});
        return min(d, ${box(PLAN.loomX0, PLAN.loomX1, -PLAN.loomHalf, PLAN.loomHalf)});
      }
      // the fields' grid: turned twenty degrees from the house's axis and gently bent; one unit is one field
      const mat2 FROT = mat2(.94, .342, -.342, .94);
      const vec2 FIELD = vec2(${f1(FIELD[0])}, ${f1(FIELD[1])});
      vec2 fieldAt(vec2 p){ vec2 q = FROT*p; q += 14.*sin(q.yx*.011 + vec2(1.3, 4.1)); return q/FIELD; }
      // a band from a to b softened by the grain px (the same measure under one pixel), gone to its mean share
      // before it is finer than the grain
      float bandAA(float s, float a, float b, float px){
        return smoothstep(a - px, a + px, s)*(1. - smoothstep(b - px, b + px, s))*clamp((b - a)/max(px, 1e-4), 0., 1.);
      }
      // A FIELD IS A WOOD where the drifts lie (a low noise over the fields' own numbers) and the whole field stands
      // FAR_WOOD and more from the house. Farther out the drifts close up: from WOODS_CLOSE[0] to WOODS_CLOSE[1]
      // metres from the house more and more fields are wood, and beyond nearly every one: a dark band of woods
      // lies about the country's far rim, under the hills.
      float woodCell(vec2 id){
        float dw = houseD(((id + .5)*FIELD)*FROT);
        return step(.56 - .44*smoothstep(${f1(WOODS_CLOSE[0])}, ${f1(WOODS_CLOSE[1])}, dw), vnoise(id*.42 + 3.3))*step(${f1(FAR_WOOD + 135)}, dw);
      }
      // WHAT STANDS ON A BOUNDARY, its height in metres at s metres along it. Everywhere a hedge; FAR_WOOD and more
      // from the house a tree line on some boundaries (a crown to every CROWN metres, a few missing) and a single
      // great tree here and there on the others; a wood's edge where a wood lies on either hand (w); nothing on the
      // lawn. key: the boundary's own number; dh: how far the house is.
      float wallH(vec2 key, float s, float w, float dh){
        float far = smoothstep(${f1(FAR_WOOD)}, ${f1(FAR_WOOD + 30)}, dh), line = step(.55, hash21(key*1.3 + 4.));
        float slot = floor(s/${f1(CROWN)}), f = (fract(s/${f1(CROWN)}) - .5)*${f1(CROWN / 5.5)};
        float has = step(hash21(vec2(slot, key.x*7. + key.y)), mix(.05, .85, line));
        float crown = has*far*max(1. - f*f, 0.);
        return mix(${f1(HEDGE_H)}, ${f1(WOOD_H)}, max(crown, w))*smoothstep(${f1(LAWN)}, ${f1(LAWN + 6)}, dh);
      }
      // the meadows' four clear tones by their number: fresh green, yellower hay, darker rough pasture, pale new-mown
      vec3 meadow(float i){
        return i < .5 ? vec3(.2, .4, .1) : i < 1.5 ? vec3(.56, .5, .19) : i < 2.5 ? vec3(.1, .19, .075) : vec3(.42, .55, .25);
      }
      // THE GROUND at a place of the land (p in metres, q in fields; fw: the grain in fields, px in metres): the
      // house's lawn, then meadows in the four tones, and on them the long shade of what stands on a field's
      // sunward boundaries (Ls: metres of shade to a metre of height, toward the sun, in the fields' frame).
      // A far field is one meadow, a tone by its own number. A FIELD NEAR THE HOUSE (its middle within STRIPS_NEAR
      // of the walls) LIES IN STRIPS along its length, two or three by its own number, each a meadow of a tone of
      // its own: the tones are taken in their order from the field's own, forward or back by the field's number,
      // so no two strips side by side are alike. No hedge parts the strips; a strip's edge is as soft as the grain.
      vec3 groundAt(vec2 p, vec2 q, vec2 fw, float px, vec2 Ls){
        float dh = houseD(p), k = hash21(floor(q)*1.7 + 2.3);
        vec2 id = floor(q);
        float i0 = k < .32 ? 0. : k < .56 ? 1. : k < .8 ? 2. : 3.;
        float n = 1. + step(houseD(((id + .5)*FIELD)*FROT), ${f1(STRIPS_NEAR)})*(1. + step(.5, hash21(id*2.9 + 7.1)));
        float turn = 1. + 2.*step(.5, hash21(id*4.3 + 1.9));
        float e = fract(q.y)*n - .5, s0 = floor(e), sw = clamp(fw.y*n, 1e-4, .5);
        vec3 tone = mix(meadow(mod(i0 + turn*clamp(s0, 0., n - 1.), 4.)), meadow(mod(i0 + turn*clamp(s0 + 1., 0., n - 1.), 4.)), smoothstep(.5 - sw, .5 + sw, fract(e)));
        // (finer than the grain the meadows go to their mean tone)
        tone = mix(tone, vec3(.31, .4, .15), smoothstep(.4, 1.2, max(fw.x, fw.y*n)));
        // (the sward's mottle, eleven metres across, and the ground's broad swell of lighter and darker, sixty-seven)
        tone *= (.9 + .2*mix(vnoise(p/11.), .5, smoothstep(3., 11., px)))*(.86 + .28*mix(vnoise(p/67. + 5.), .5, smoothstep(20., 67., px)));
        float lawn = 1. - smoothstep(${f1(LAWN - 1)} - px, ${f1(LAWN + 1)} + px, dh);
        // (the lawn is mown in swathes four metres broad that follow the house's walls)
        tone = mix(tone, vec3(.3, .48, .17)*(.96 + .08*mix(vnoise(p/23.), .5, smoothstep(6., 23., px)))*(1. + .16*sin(dh*.785)*(1. - smoothstep(1., 4., px))), lawn);
        float ix = id.x + step(0., Ls.x), iy = id.y + step(0., Ls.y);
        float hx = wallH(vec2(ix, id.y), q.y*FIELD.y, max(woodCell(vec2(ix - 1., id.y)), woodCell(vec2(ix, id.y))), dh);
        float hy = wallH(vec2(iy, id.x) + 17., q.x*FIELD.x, max(woodCell(vec2(id.x, iy - 1.)), woodCell(vec2(id.x, iy))), dh);
        float shade = max(bandAA(abs(ix - q.x)*FIELD.x, 0., hx*abs(Ls.x), fw.x*FIELD.x), bandAA(abs(iy - q.y)*FIELD.y, 0., hy*abs(Ls.y), fw.y*FIELD.y));
        return tone*mix(vec3(1.), vec3(.3, .4, .56), shade*.92);
      }
      // ONE FAMILY OF BOUNDARIES as the eye's line passes them. a: where the line comes down through the level of
      // the crowns' tops; b: where it meets the ground (in fields, this family's axis first; pa, pb the same two
      // places in metres). Between the two the line sinks WOOD_H, so it is stopped by the n-th boundary back from b
      // if what stands there is taller than the line is there. Out: what is seen (colour times cover), the cover,
      // and how far down the sinking the nearest stop lies (1 at the ground).
      void walls(vec2 a, vec2 b, vec2 pa, vec2 pb, float fw, float along, float sunS, float fam, float px, out vec3 wc, out float cover, out float lam){
        float span = b.x - a.x, dir = span < 0. ? -1. : 1., len = max(abs(span), 1e-4);
        float g0 = dir > 0. ? fract(b.x) : 1. - fract(b.x), i0 = dir > 0. ? floor(b.x) : floor(b.x) + 1.;
        wc = vec3(0.); cover = 0.; lam = 1.;
        // the face seen is the one toward the eye: lit when the sun stands on the eye's side of the boundary
        vec3 leaf = mix(vec3(.04, .08, .06), vec3(.15, .25, .08), step(0., -dir*sunS));
        for (int n = 0; n < 3; n++){
          float g = g0 + float(n), r = min(g/len, 1.), i = i0 - dir*float(n), sy = mix(b.y, a.y, r), row = floor(sy);
          vec2 lo = fam < .5 ? vec2(i - 1., row) : vec2(row, i - 1.), hi = fam < .5 ? vec2(i, row) : vec2(row, i);
          float h = wallH(vec2(i, row) + 17.*fam, sy*along, max(woodCell(lo), woodCell(hi)), houseD(mix(pb, pa, r)));
          float c = bandAA(g, 0., len*h/${f1(WOOD_H)}, fw);
          vec3 tone = leaf*(.62 + .5*(1. - r)*${f1(WOOD_H)}/max(h, 1.))*(.85 + .3*mix(vnoise(vec2(sy*along/6., i*3.1)), .5, smoothstep(3., 9., px)));
          wc = mix(wc, tone, c); cover = 1. - (1. - cover)*(1. - c); lam = mix(lam, 1. - r, step(.5, c));
        }
      }
      // THE LAND where the eye's line meets it (p0, q0: the ground's meeting point in metres and in fields; fw, px:
      // the grain there). No upright thing is drawn flat: a hedge, a tree line, a wood's edge stands on its
      // boundary as high as it is, and a wood's crowns lie on their own level sheet, each met by the line itself.
      vec3 landAt(vec3 V, vec2 p0, vec2 q0, vec2 fw, float px){
        float dn = min(V.y, -1e-3);
        vec2 eye = cameraPosition.xz, Ls = FROT*(uSunDir.xz/max(uSunDir.y, .2))*${f1(SHADE_LONG)};
        vec2 p7 = eye + V.xz*((${f1(LAND_Y + WOOD_H)} - cameraPosition.y)/dn), q7 = fieldAt(p7);
        vec3 col = groundAt(p0, q0, fw, px, Ls), cx, cy;
        float ax, ay, lx, ly;
        walls(q7, q0, p7, p0, fw.x, FIELD.y, Ls.x, 0., px, cx, ax, lx);
        walls(q7.yx, q0.yx, p7, p0, fw.y, FIELD.x, Ls.y, 1., px, cy, ay, ly);
        float xn = step(lx, ly);
        col = mix(cy, cx, xn) + (1. - mix(ay, ax, xn))*(mix(cx, cy, xn) + (1. - mix(ax, ay, xn))*col);
        // a wood's crowns, on their own sheet: lit, mottled crown by crown
        vec2 ed = min(fract(q7), 1. - fract(q7))/max(fw, vec2(1e-4));
        float top = woodCell(floor(q7))*clamp(min(ed.x, ed.y) + .5, 0., 1.);
        col = mix(col, vec3(.085, .155, .07)*(.7 + .6*mix(vnoise(p7/7.), .5, smoothstep(2., 7., px))), top);
        // THE BANKS' OWN SHADE ON THE LAND: where the cloud sheet stands between this place of the land and the sun
        // (the place's own line toward the sun, met with the sheet's level), the place lies in soft shade. The
        // sheet is read by the place it is met at, as the panes read it, so the patches of shade pass over the
        // fields with the banks' own drift, by the world's clock. Finer than the grain the shade goes to its mean.
        vec2 cs = (p0 + uSunDir.xz*(${f1(CLOUD_Y - LAND_Y)}/max(uSunDir.y, .1)))*${f1(1.3 / CLOUD_Y)} + uCloud.xy + uCloud.zw*uTime;
        float fs = px*${f1(1.3 / CLOUD_Y)};
        float under = mix(smoothstep(.47, .62, bankAt(cs, fs)), .4, smoothstep(.3, 1.2, fs));
        col *= mix(vec3(1.), vec3(.5, .58, .7), under*.8);
        // the morning's air: tones clear to the middle distance, a thin mist only at the hills' feet (by distance)
        float dist = length(p0 - eye);
        col = mix(col, vec3(.6, .7, .8), 1. - exp(-min(dist, 4e4)/9000.));
        return mix(col, vec3(.74, .8, .84), smoothstep(2500., 9000., dist)*.85);
      }`;
}
function makeGlassMaterial(shared, cloud) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uCloud: { value: cloud } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aBar;
      varying vec3 vW; varying vec2 vUv; varying vec4 vBar;
      void main(){
        vec4 w = modelMatrix*vec4(position, 1.);
        vW = w.xyz; vUv = uv; vBar = aBar;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec2 vUv; varying vec4 vBar;
      uniform vec4 uCloud;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      float barLine(float v, float period, float halfW){
        float d = abs(fract(v/period) - .5)*period, px = fwidth(v);
        return (1. - smoothstep(halfW - px, halfW + px, d))*clamp(halfW*2./max(px, 1e-4), 0., 1.);
      }
      ${landGlsl()}
      // THE MORNING BEYOND THE GLASS (one law for every pane). THIS WORLD'S FAR MORNING is by the direction looked in
      // alone: the sky's blue paling to the horizon, the sun's glow, and the far ranges (three layers of blue hills
      // with a broken skyline, farther than any place of the flight can tell apart). THE CLOUD SHEET AND THE LAND
      // EACH HAVE A PLACE: the eye's line through the pane, from the eye's true place, meets a level plane (CLOUD_Y
      // over the floor; LAND_Y under it) and what is drawn there is by that meeting point's world x and z alone, so
      // the banks and the country stand still as the eye passes. The banks drift by the world's clock from the
      // place the sky's stream dealt them.
      float bankAt(vec2 c, float fw){
        float a1 = 1. - smoothstep(.4, 1.2, fw), a2 = 1. - smoothstep(.17, .5, fw), a3 = 1. - smoothstep(.08, .23, fw), a4 = 1. - smoothstep(.035, .1, fw);
        return .5 + (vnoise(c) - .5)*.55*a1 + (vnoise(c*2.3 + 7.) - .5)*.3*a2 + (vnoise(c*5.1 + 3.) - .5)*.15*a3 + (vnoise(c*11.7 + 1.) - .5)*.07*a4;
      }
      vec3 skyAt(vec3 V){
        float up = V.y, h = clamp(up, 0., 1.);
        vec3 sky = mix(vec3(.6, .72, .84), vec3(.15, .32, .68), pow(h, .5));
        float sd = clamp(dot(V, uSunDir), 0., 1.);
        sky += uSunCol*(pow(sd, 900.)*2.2 + pow(sd, 40.)*.1 + pow(sd, 6.)*.03);
        // the banks: where the line meets the sheet; grey where a bank is deep, lit where it is thin and on its
        // sunward rim; paled by the air between toward the far sheet
        float t = (${f1(CLOUD_Y)} - cameraPosition.y)/max(up, 1e-3);
        vec2 c = (cameraPosition.xz + V.xz*t)*${f1(1.3 / CLOUD_Y)} + uCloud.xy + uCloud.zw*uTime;
        float fw = max(fwidth(c.x), fwidth(c.y)), n = bankAt(c, fw), e0 = clamp(fwidth(n), .015, .2);
        float bank = smoothstep(.53 - e0, .53 + e0 + .02, n), deep = clamp((n - .53)/.12, 0., 1.);
        float rim = n - bankAt(c + normalize(uSunDir.xz)*.09, fw);
        vec3 cloud = mix(vec3(.46, .51, .61), vec3(.98, .95, .9), clamp(1.05 - deep*1.3 + rim*9. + .2*sd, 0., 1.));
        float air = 1. - exp(-min(t, 6e4)/18000.);
        sky = mix(sky, mix(cloud, vec3(.66, .76, .86), air), bank*step(1e-3, up)*(1. - smoothstep(.55, 1., air))*.94);
        // the far ranges, by direction: the farthest tallest and palest, the nearest lowest and deepest
        float az = atan(V.z, V.x), e = up/max(length(V.xz), .05), ee = max(fwidth(e), 2e-4);
        float k3 = sin(az*13. + 2.), k2 = sin(az*23. + 1.), k1 = sin(az*37. + .7);
        float r3 = .078 + .024*sin(az*3. + 1.3) + .012*sin(az*7. + 4.) + .016*k3*k3*k3*k3 + .003*sin(az*61.);
        float r2 = .05 + .016*sin(az*5. + .4) + .009*sin(az*11. + 2.2) + .011*k2*k2*k2*k2 + .002*sin(az*89.);
        float r1 = .024 + .01*sin(az*8. + 2.1) + .006*sin(az*19. + .5) + .007*k1*k1 + .0015*sin(az*131.);
        float mist = 1. - smoothstep(0., .016, e);
        sky = mix(sky, mix(vec3(.5, .62, .78), vec3(.7, .78, .85), mist*.8), 1. - smoothstep(r3 - ee, r3 + ee, e));
        sky = mix(sky, mix(vec3(.36, .49, .68), vec3(.7, .78, .85), mist*.8), 1. - smoothstep(r2 - ee, r2 + ee, e));
        sky = mix(sky, mix(vec3(.2, .33, .47), vec3(.7, .78, .85), mist*.8), 1. - smoothstep(r1 - ee, r1 + ee, e));
        // below the level: the land, where the line meets it (the grain is measured here, outside the branch)
        vec2 p0 = cameraPosition.xz + V.xz*((${f1(LAND_Y)} - cameraPosition.y)/min(up, -1e-3)), q0 = fieldAt(p0);
        vec2 fq = fwidth(q0);
        float px = max(fwidth(p0.x), fwidth(p0.y));
        if (up < 0.) sky = mix(sky, landAt(V, p0, q0, fq, px), 1. - smoothstep(-ee, 0., e));
        return sky;
      }
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        vec3 sky = skyAt(V);
        float bar = max(barLine(vUv.x, vBar.x, vBar.z), barLine(vUv.y, vBar.y, vBar.z));
        // A PANE'S OWN LIGHT (vBar.w). 1 and over: a clear pane, a little brighter than the sky's law. Under 1: a
        // pane of the Cards' old crown glass, which lets that share of the morning through and holds what it shows
        // under white (a soft shoulder from PANE_KNEE toward PANE_TOP), so that no pane of that hall glares
        vec3 seen = sky*mix(vBar.w, mix(1., vBar.w, .2), step(1., vBar.w));
        float top = max(seen.r, max(seen.g, seen.b)), over = max(top - ${f1(PANE_KNEE)}, 0.);
        seen *= mix((min(top, ${f1(PANE_KNEE)}) + ${f1(PANE_TOP - PANE_KNEE)}*(1. - exp(-over/${f1(PANE_TOP - PANE_KNEE)})))/max(top, 1e-4), 1., step(1., vBar.w));
        vec3 col = mix(seen, vec3(.03, .035, .045), bar);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
function makeGlassMesher() {
  const P = [], U = [], B = [];
  const o = {};
  // a pane a, b, c, d with its face measured in metres: (u0, v0) at a, (u1, v0) at b, (u1, v1) at c, (u0, v1) at d
  o.quad = (a, b, c, d, u0, v0, u1, v1, bar) => {
    for (const [p, u, v] of [[a, u0, v0], [b, u1, v0], [c, u1, v1], [a, u0, v0], [c, u1, v1], [d, u0, v1]]) { P.push(p[0], p[1], p[2]); U.push(u, v); B.push(bar[0], bar[1], bar[2], bar[3]); }
  };
  o.tri = (a, b, c, ua, ub, uc, bar) => {
    for (const [p, u] of [[a, ua], [b, ub], [c, uc]]) { P.push(p[0], p[1], p[2]); U.push(u[0], u[1]); B.push(bar[0], bar[1], bar[2], bar[3]); }
  };
  o.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
    g.setAttribute('aBar', new THREE.BufferAttribute(new Float32Array(B), 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  return o;
}

// ---------------------------------------------------------------- the floor: dark, polished, and what stands in it
// The floor is one level of dark polished slabs. It takes the sun's bars and the columns' shadows by place (the
// part's sunAt) and shows, faintly, what a polished floor shows: the ranks of the Store; the Mill's thirty columns
// and three barrels; the links' glass walls and the east link's ten falls; the windows of the Cards and, west of the
// Loom hall's west wall, the Cards' chains, each in the pasteboard it was dealt; the loom against its glass. Each is
// found where the eye's line, turned up off the floor, meets the thing's own place. Under the Mill's lantern lies
// its round of daylight; about every foot and every pile of folded cards the floor darkens softly. No body is made
// for any of it: the floor stays bare.
const f1 = (v) => (Number.isInteger(v) ? v + '.' : String(v));
// the Mill's ribs as the floor's shade reads them: the fans' first bearings and step, the columns' step along a rib
const RB = PLAN.ribBearings, RB_STEP = RB[1] - RB[0], RIB_GAP = PLAN.ribR[1] - PLAN.ribR[0];
// THE EAST LINK'S FALLS, where they hang (buildCards hangs them by these; the floor's polish finds them by these):
// the rail's metres from the middle line, the prisms' height, the bays' step, the first bay's middle
const ELINK_RAIL = 10.5, ELINK_TOP = 37.5, ELINK_BAY = 7.5, ELINK_X0 = PLAN.cx + Math.sqrt(PLAN.drumR * PLAN.drumR - 15 * 15) - 0.4 + ELINK_BAY;
// WHAT HANGS OVER THE CARDS' FLOOR AND THE EAST LINK'S, as the floor's polish reads it. buildCards writes these as
// it hangs each chain, from the pasteboard that chain was dealt (nothing is dealt for the floor). FLOOR_PASTE tones,
// each with one measure of its chain:
//   from FP_LOOP, six to a curtain: the loops of the curtain's lowest rail in their order along the hall; the
//     tone, and the loop's lowest height (nought where no loop hangs)
//   from FP_FALL, two to a curtain: the sheer falls east of it, the north one first; the tone, the pile's height
//   from FP_WALL, twenty: the sheer falls along the walls in the order they are hung; the tone, the fall's own
//     metres along the hall (uWallAt keeps its top and its pile's height)
//   from FP_LINK, ten: the east link's falls, the north hand's first; the tone, the pile's height
// uLoopTop: for each curtain the height of its lowest rail's loops' ends.
// OF THESE THE FLOOR'S SHADER READS every tone, a loop's lowest height, a wall fall's metres along the hall and its
// top (uWallAt's first number), and uLoopTop. The piles' heights (with the curtains' falls, with the link's falls,
// and uWallAt's second number) are kept here and the shader does not read them.
const FLOOR_PASTE = 62, FP_LOOP = 0, FP_FALL = 24, FP_WALL = 32, FP_LINK = 52;
function makeFloorMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared,
      uPaste: { value: Array.from({ length: FLOOR_PASTE }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uWallAt: { value: Array.from({ length: 20 }, () => new THREE.Vector2(0, 0)) },
      uLoopTop: { value: new THREE.Vector4(0, 0, 0, 0) } },
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      // a rank of the Store's columns on z = zr, met by the line from p along R: how much of a column is met
      float rankMet(vec3 p, vec3 R, float zr){
        float t = (zr - p.z)/(abs(R.z) < .02 ? .02*sign(R.z + 1e-5) : R.z);
        vec3 q = p + R*t;
        float dx = abs(fract((q.x - ${(PLAN.colX0).toFixed(1)})/6. + .5) - .5)*6.;
        // only a column's lowest metres stand in the floor, soft, fading upward from its foot within six metres
        return (1. - smoothstep(.5, 1.3 + t*.03, dx))*step(0., t)*(1. - smoothstep(.3, 6., q.y))*step(-38., q.x)*step(q.x, 234.)*(1. - smoothstep(30., 90., t));
      }
      float boxNear(vec2 p, vec2 c, vec2 hw){ vec2 d = max(abs(p - c) - hw, 0.); return length(d); }
      uniform vec4 uPaste[${FLOOR_PASTE}]; uniform vec2 uWallAt[20]; uniform vec4 uLoopTop;
      // the Mill's ten ribs, each as the level direction from the drum's centre along it
      const vec2 RIB_DIR[10] = vec2[10](${RB.map((b) => `vec2(${Math.cos(b * Math.PI / 180).toFixed(5)}, ${Math.sin(b * Math.PI / 180).toFixed(5)})`).join(', ')});
      // a round upright thing of radius rad that stands on the Mill's floor at c (metres from the drum's centre), met
      // by the line from the floor's place d along the level direction Rh, rising by slope a metre: how much of it
      // is met. Only its lowest metres stand in the floor, soft, fading upward from its foot within MILL_STREAK.
      const float MILL_STREAK = 18.;
      // the light the Mill's brass stands in as the floor shows it (shares of the clerestory's sky and of the fans'
      // glow), the barrels' steel (a share of the lantern's daylight), the links' panes (a share of the sky)
      const vec2 MILL_BRASS = vec2(2.4, 1.3); const float MILL_STEEL = 3., LINK_GLASS = 1.2;
      // a loop's under side, which the floor shows, stands in the hall's shade: this share of its pasteboard's tone
      const float LOOP_UNDER = .6;
      // THE LANTERN'S ROUND on the Mill's floor: how strong the round of daylight under the lantern lies on the slabs
      // over the lantern's wider light (a share of the lantern's own daylight), from the drum's centre to its soft
      // rim 18 to 21 m out. It stands: no clock moves it.
      const float LANTERN_ROUND = 1.;
      float roundMet(vec2 d, vec2 Rh, float slope, vec2 c, float rad){
        vec2 rel = c - d;
        float along = dot(rel, Rh), off = abs(rel.x*Rh.y - rel.y*Rh.x);
        return (1. - smoothstep(rad*.55, rad*1.1 + along*.03, off))*smoothstep(0., rad, along)*(1. - smoothstep(.3, MILL_STREAK, along*slope));
      }
      // a loop of cards hung across the Cards' hall (its lowest point low over the middle line, its ends at top over
      // the rails 14.8 m to either hand), met by the line from the floor's place p along R: the metres along that
      // line to the loop, or -1 where the line passes it by
      float loopMeet(vec3 p, vec3 R, float low, float top){
        float a = (top - low)/(14.8*14.8);
        float A = a*R.z*R.z, B = 2.*a*p.z*R.z - R.y, C = low + a*p.z*p.z, disc = B*B - 4.*A*C;
        return (B < 0. && disc > 0.) ? 2.*C/(-B + sqrt(disc)) : -1.;
      }
      // how much of a sheer fall of cards is met at the height y, t metres along the line (soft is the softness
      // there): the whole fall from the floor to its top, its lowest metres the strongest, less the farther
      float fallMet(float y, float top, float soft, float t){
        return step(0., t)*(1. - smoothstep(top - soft, top + soft, y))*(1. - .75*smoothstep(4., 30., y))*(1. - smoothstep(40., 110., t));
      }
      // the light a brass column or a hung pasteboard stands in, as the polish shows it (one law, the Store's ranks')
      vec3 streakLight(){ return uSkyCol*.9 + uSunCol*.12; }
      // in the floor's polish before the loom: how strong the gate's own light stands (GATE_POOL), and the share of
      // a lit-through cloth's pool that the cloth drawn off beside the gate (lit on its face only) leaves (GATE_FALL)
      const float GATE_POOL = 1.8, GATE_FALL = .3;
      // the shade about one round foot of radius R, d metres from its axis: darkest under its rim, gone two metres out
      float footRound(float d, float R){ return mix(.3, 1., smoothstep(R*.85, R*.85 + 2., d)); }
      // THE CONTACT SHADE, by place: the floor darkens softly about every foot that stands on it (the Store's columns;
      // the Mill's columns, spindles, comb posts and barrels, each foot alone; the loom's posts and breast, the creels)
      float footShade(vec3 p){
        float s = 1.;
        if (p.x < 240.) {
          float dx = abs(fract((p.x - ${(PLAN.colX0).toFixed(1)})/6. + .5) - .5)*6., az = abs(p.z);
          float dz = min(abs(az - 9.), min(abs(az - 16.), uRanks > 2.5 ? abs(az - 23.) : 99.));
          s = mix(.3, 1., smoothstep(1., 3., length(vec2(dx, dz))))*step(-40., p.x) + step(p.x, -40.);
        } else if (p.x < ${f1(PLAN.crossX1)}) {
          // the Drive: the wheel's pit (dark between its kerbs), the bearing frames' two bed plates, the governor's stand
          vec2 q = p.xz - vec2(${f1(FLY.x)}, ${f1(FLY.z)});
          float pit = boxNear(q, vec2(0.), vec2(${f1(FLY.R + 0.7)}, ${f1(PIT_HALF)}));
          float beds = boxNear(vec2(q.x, abs(q.y)), vec2(0., ${f1(FRAME_Z)}), vec2(${f1(FRAME_FOOT + 1.4)}, 1.2));
          float gov = boxNear(q, vec2(${f1(GOV_X - FLY.x)}, ${f1(GOV_Z)}), vec2(2.2));
          s = mix(.1, 1., smoothstep(0., .3, pit))*mix(.4, 1., smoothstep(0., 2., min(beds, gov)));
        } else if (p.x < 540.) {
          // the Mill: every column, spindle and comb post of a rib and every barrel stands on its own foot on the bare
          // floor; the shade lies about each foot alone (a round of its own size), bare floor between
          vec2 d = p.xz - MILL_C; float r = length(d), ang = degrees(atan(d.y, d.x));
          ang = ang < 0. ? ang + 360. : ang;
          float b = ang < 180. ? ${f1(RB[0])} + ${f1(RB_STEP)}*clamp(floor((ang - ${f1(RB[0])})/${f1(RB_STEP)} + .5), 0., 4.) : ${f1(RB[5])} + ${f1(RB_STEP)}*clamp(floor((ang - ${f1(RB[5])})/${f1(RB_STEP)} + .5), 0., 4.);
          float da = radians(ang - b);
          vec2 q = vec2(r*cos(da), r*sin(da));
          float uc = ${f1(PLAN.ribR[0])} + ${f1(RIB_GAP)}*clamp(floor((q.x - ${f1(PLAN.ribR[0])})/${f1(RIB_GAP)} + .5), 0., 2.);
          float us = ${f1(PLAN.ribR[0] + PLAN.spindleOff)} + ${f1(RIB_GAP)}*clamp(floor((q.x - ${f1(PLAN.ribR[0] + PLAN.spindleOff)})/${f1(RIB_GAP)} + .5), 0., 2.);
          s = footRound(length(vec2(q.x - uc, q.y)), ${f1(PLAN.footCol)})*footRound(length(vec2(q.x - us, q.y)), ${f1(PLAN.footSpindle)})*footRound(length(vec2(q.x - ${f1(PLAN.postR)}, q.y)), ${f1(PLAN.footPost)});
          float bz = ${f1(PLAN.barrelZ[2])}*clamp(floor(d.y/${f1(PLAN.barrelZ[2])} + .5), -1., 1.);
          s *= footRound(length(d - vec2(0., bz)), ${f1(PLAN.footBarrel)})*footRound(length(vec2(d.x, abs(d.y) - ${f1(PLAN.midPostZ)})), .6);
        } else if (p.x < ${f1(PLAN.loomX0 - 4)}) {
          // the Cards: the floor darkens softly about every pile of folded cards (the two under each curtain's sheer
          // falls, the twenty along the walls), bare floor between; the shade dies away from 12 m to 4 m before
          // the Loom hall's west wall, and the last 4 m before that wall have none
          float az = abs(p.z), cz = clamp(floor((p.x - 560.)/40.), 0., 3.);
          float pile = boxNear(vec2(p.x, az), vec2(${f1(CURTAIN_X[0])} + 40.*cz + uAbreast*2. + 3.2, 8.), vec2(.75, 1.6));
          float bay = clamp(floor((p.x - 600.)/40. + .5), -1., 3.);
          int at = int((bay + 1.)*4. + (p.z > 0. ? 2. : 0.) + step(600. + 40.*bay, p.x));
          pile = min(pile, boxNear(vec2(p.x, az), vec2(uPaste[${FP_WALL} + at].w, 14.6), vec2(1.6, .75)));
          s = mix(1., mix(.5, 1., smoothstep(0., 1.8, pile)), 1. - smoothstep(${f1(PLAN.loomX0 - 12)}, ${f1(PLAN.loomX0 - 4)}, p.x));
        } else if (p.x > 740.) {
          float az = abs(p.z);
          float frame = boxNear(vec2(p.x, az), vec2(${(PLAN.loomX).toFixed(1)}, ${((PLAN.postZ - PLAN.postHalf + 28.5) / 2).toFixed(2)}), vec2(1.2, ${((28.5 - PLAN.postZ + PLAN.postHalf) / 2).toFixed(2)}));
          float creel = boxNear(vec2(p.x, az), vec2(${(CREEL_X0 + CREEL_STEP * (CREEL_N - 1) / 2).toFixed(1)}, 19.4), vec2(${(CREEL_STEP * (CREEL_N - 1) / 2 + 1).toFixed(1)}, 3.));
          // (the last creels before the gate; the take-up rolls of the cloth drawn off)
          creel = min(creel, boxNear(vec2(p.x, az), vec2(${f1(LAST_X0 + CREEL_STEP * (LAST_N - 1) / 2)}, ${f1(LAST_Z)}), vec2(${f1(CREEL_STEP * (LAST_N - 1) / 2 + 1)}, 1.)));
          frame = min(frame, boxNear(vec2(p.x, az), vec2(${f1(PLAN.fallX - TAKE_R)}, ${f1((PLAN.fallZ[0] + PLAN.fallZ[1]) / 2)}), vec2(${f1(TAKE_R)}, ${f1((PLAN.fallZ[1] - PLAN.fallZ[0]) / 2)})));
          s = mix(.35, 1., smoothstep(0., 2.5, frame))*mix(.6, 1., smoothstep(0., 2., creel));
        }
        return s;
      }
      // (the cloth's pool, found by mirrorAt for the place last asked; laid on by the floor's own polish)
      vec3 pool = vec3(0.);
      vec3 mirrorAt(vec3 p, vec3 R){
        vec3 m = envAt(R, p);
        if (p.x < 240.) {
          float s = sign(R.z + 1e-5);
          float met = max(rankMet(p, R, 9.*s), max(rankMet(p, R, 16.*s), rankMet(p, R, 23.*s)*step(2.5, uRanks)));
          m = mix(m, vec3(.55, .36, .1)*(uSkyCol*.9 + uSunCol*.12), met*.8);
        } else if (p.x <= 540.) {
          vec2 d = p.xz - MILL_C;
          float hl = max(length(R.xz), .05), slope = R.y/hl; vec2 Rh = R.xz/hl;
          if (dot(d, d) < 78.*78.) {
            // THE MILL IN ITS FLOOR, by the feet's own places: under each of the thirty columns of the two fans a
            // soft upright streak of its brass (in the clerestory's sky and the fans' own glow), under each of the
            // three barrels one of its blue steel (in the lantern's daylight)
            float brass = 0.;
            for (int i = 0; i < 10; i++) for (int k = 0; k < 3; k++)
              brass = max(brass, roundMet(d, Rh, slope, RIB_DIR[i]*(${f1(PLAN.ribR[0])} + ${f1(RIB_GAP)}*float(k)), 1.3));
            float steel = max(roundMet(d, Rh, slope, vec2(0.), 4.), max(roundMet(d, Rh, slope, vec2(0., ${f1(PLAN.barrelZ[2])}), 4.), roundMet(d, Rh, slope, vec2(0., -${f1(PLAN.barrelZ[2])}), 4.)));
            m = mix(m, vec3(.55, .36, .1)*(uSkyCol*MILL_BRASS.x + vec3(.95, .66, .28)*MILL_BRASS.y), brass*.8);
            m = mix(m, vec3(.05, .115, .28)*lanternCol()*MILL_STEEL, steel*.8);
          }
          // THE LINKS IN THEIR FLOORS (each from its arch to its far end, between its glass walls): THE GLASS WALLS'
          // LIGHT lies in the floor as long soft bars: the panes between the hoops' posts (7.5 m apart) and the
          // rails, found where the line meets the wall it runs toward, the softer the longer the line; far off the
          // bars go to their mean
          float lx0 = p.x < MILL_C.x ? ${f1(PLAN.crossX1)} : ${f1(PLAN.archE - 0.4)}, lx1 = p.x < MILL_C.x ? ${f1(PLAN.archW + 0.4)} : ${f1(PLAN.cardX0)};
          float open = 1. - millDark(p);
          if (open > 0. && p.x > lx0 && p.x < lx1) {
            float sz = sign(R.z + 1e-5), t = (15.*sz - p.z)/(abs(R.z) < .02 ? .02*sz : R.z);
            vec3 q = p + R*t;
            float soft = t*.03;
            float dp = abs(fract((q.x - lx0)/7.5 + .5) - .5)*7.5, dr = abs(fract((q.y - 6.)/9.5) - .5)*9.5;
            float glass = mix(smoothstep(.38, .6 + soft, dp)*smoothstep(.2, .42 + soft, dr), .85, smoothstep(25., 80., t));
            float wall = step(0., t)*smoothstep(lx0 - 1., lx0 + 1., q.x)*(1. - smoothstep(lx1 - 1., lx1 + 1., q.x))*smoothstep(5.9 - soft, 6.2 + soft, q.y)*(1. - smoothstep(44. - soft, 44.3 + soft, q.y));
            m = mix(m, mix(vec3(.05, .06, .075), uSkyCol*LINK_GLASS, glass), wall*open*.85);
            if (p.x > MILL_C.x) {
              // THE EAST LINK'S TEN FALLS stand in its floor, each a soft streak of its own pasteboard: found where
              // the line meets a fall's own plane within the fall's breadth, the nearest fall over the farther
              vec4 acc = vec4(0.);
              float rx = abs(R.x) < .02 ? .02*sign(R.x + 1e-5) : R.x;
              for (int j = 0; j < 5; j++) {
                int k = R.x > 0. ? 4 - j : j;
                float tf = (${f1(ELINK_X0 - 0.62)} + ${f1(ELINK_BAY)}*float(k) - p.x)/rx;
                vec3 qf = p + R*tf;
                float sf = .2 + tf*.03;
                float w = fallMet(qf.y, ${f1(ELINK_TOP)}, sf, tf)*(1. - smoothstep(1.5 - sf, 1.5 + sf, abs(abs(qf.z) - ${f1(ELINK_RAIL)})));
                acc = mix(acc, vec4(uPaste[${FP_LINK} + (qf.z > 0. ? 5 : 0) + k].rgb, 1.), w);
              }
              m = m*(1. - acc.a*open*.85) + acc.rgb*streakLight()*open*.85;
            }
          }
        } else if (p.x > 540. && p.x < 740.) {
          float t = (20. - p.z)/max(R.z, .02);
          vec3 q = p + R*t;
          float gy = mod(q.y - 8., 9.);
          float win = gap(q.x, 5., .28)*smoothstep(1.3, 1.6, gy)*(1. - smoothstep(7.5, 7.8, gy))*step(8., q.y)*step(q.y, 50.)*step(0.02, R.z);
          m = mix(m, uSkyCol*1.25, win*.85);
          // THE CHAINS IN THE CARDS' FLOOR, west of the Loom hall's west wall: each stands in the polish as a soft
          // streak of the pasteboard it was dealt, found where the line meets the chain's own place: the walls'
          // sheer falls (on the wall the line runs toward), then curtain by curtain from the farthest to the
          // nearest its two sheer falls east of it and the loops of its lowest rail (seen from under, in shade).
          // The streaks die away from 12 m to 4 m before that wall; the last 4 m before it show none.
          float keepW = 1. - smoothstep(${f1(PLAN.loomX0 - 12)}, ${f1(PLAN.loomX0 - 4)}, p.x);
          if (keepW > 0.) {
            vec4 acc = vec4(0.);
            float rx = abs(R.x) < .02 ? .02*sign(R.x + 1e-5) : R.x;
            float sz = sign(R.z + 1e-5), tw = (14.78*sz - p.z)/(abs(R.z) < .02 ? .02*sz : R.z);
            vec3 qw = p + R*tw;
            float bay = clamp(floor((qw.x - 600.)/40. + .5), -1., 3.), sw = .2 + tw*.03;
            int at = int((bay + 1.)*4. + (sz > 0. ? 2. : 0.) + step(600. + 40.*bay, qw.x));
            vec4 pw = uPaste[${FP_WALL} + at];
            acc = mix(acc, vec4(pw.rgb, 1.), fallMet(qw.y, uWallAt[at].x, sw, tw)*(1. - smoothstep(1.5 - sw, 1.5 + sw, abs(qw.x - pw.w))));
            for (int j = 0; j < 4; j++) {
              int c = R.x > 0. ? 3 - j : j;
              float cx = ${f1(CURTAIN_X[0])} + ${f1(CURTAIN_X[1] - CURTAIN_X[0])}*float(c);
              float tf = (cx + uAbreast*2. + 3.38 - p.x)/rx;
              vec3 qf = p + R*tf;
              float sf = .2 + tf*.03;
              vec4 fall = vec4(uPaste[${FP_FALL} + c*2 + (qf.z > 0. ? 1 : 0)].rgb, 1.);
              float wf = fallMet(qf.y, 49.6, sf, tf)*(1. - smoothstep(1.5 - sf, 1.5 + sf, abs(abs(qf.z) - 8.)));
              // (the loop's place along the hall is found on a loop of the rail's middle sag, then the line is met
              // again with that loop's own sag)
              float top = uLoopTop[c], t0 = loopMeet(p, R, top - 9.45, top);
              float i = clamp(floor((p.x + R.x*t0 - cx)/4. + uAbreast*.5), 0., uAbreast - 1.);
              vec4 pl = uPaste[${FP_LOOP} + c*6 + int(i)];
              float tl = loopMeet(p, R, pl.w, top), sl = .2 + tl*.03;
              vec3 ql = p + R*tl;
              float wl = step(0., t0)*step(0., tl)*step(.5, pl.w)*(1. - smoothstep(1.5 - sl, 1.5 + sl, abs(ql.x - cx - (i - (uAbreast - 1.)*.5)*4.)))
                *(1. - smoothstep(14.8 - sl, 14.8 + sl, abs(ql.z)))*(1. - smoothstep(40., 110., tl));
              vec4 loop = vec4(pl.rgb*LOOP_UNDER, 1.);
              if (R.x > 0.) { acc = mix(acc, fall, wf); acc = mix(acc, loop, wl); }
              else { acc = mix(acc, loop, wl); acc = mix(acc, fall, wf); }
            }
            m = m*(1. - acc.a*keepW*.85) + acc.rgb*streakLight()*keepW*.85;
          }
        } else if (p.x >= 740.) {
          // the loom in the floor: only what glows of it. THE CLOTH'S POOL: a polished floor of slabs is no true
          // mirror: it draws a bright thing out into a long soft streak toward the eye and toward the thing's foot.
          // So the cloth lit through stands in the floor as a long pool of its own colours before the loom: found
          // where the eye's line, turned up off the floor, meets the loom's plane inside the cloth's breadth, from
          // well under the cloth's foot to well over the fell, the softer the longer the line. The bright warp over
          // it shows faintly.
          float t = (${(PLAN.loomX).toFixed(1)} - p.x)/max(R.x, .02);
          vec3 q = p + R*t;
          float az = abs(q.z), ahead = step(.02, R.x)*step(p.x, ${(PLAN.loomX - 1).toFixed(1)});
          float sf = 2. + t*.08;
          float inFrame = 1. - smoothstep(${f1(PLAN.warpHalf)} - sf, ${f1(PLAN.warpHalf)} + sf, az);
          float cloth = inFrame*smoothstep(${f1((PLAN.rollY + 1.2) * 0.3)}, ${f1(PLAN.rollY + 1.2)}, q.y)*(1. - smoothstep(${f1(PLAN.fellY)}, ${f1(PLAN.fellY * 1.7)}, q.y));
          float warp = inFrame*smoothstep(${f1(PLAN.fellY)} - sf, ${f1(PLAN.fellY)} + sf, q.y)*(1. - smoothstep(${f1(PLAN.warpTop)} - sf, ${f1(PLAN.warpTop)} + sf, q.y));
          // (so do the two outer lengths before their windows, lit through; the cloth drawn off beside the gate,
          // which is lit on its face only, stands in it the fainter; and THE GATE'S OWN LIGHT lies before the gate
          // as a long warm streak of the gate's breadth)
          float outerL = (1. - smoothstep(${f1((PLAN.outerZ[1] - PLAN.outerZ[0]) / 2)} - sf, ${f1((PLAN.outerZ[1] - PLAN.outerZ[0]) / 2)} + sf, abs(az - ${f1((PLAN.outerZ[0] + PLAN.outerZ[1]) / 2)})))*(1. - smoothstep(${f1(PLAN.outerY[1])}, ${f1(PLAN.outerY[1] * 1.4)}, q.y));
          float fall = (1. - smoothstep(${f1((PLAN.fallZ[1] - PLAN.fallZ[0]) / 2)} - sf, ${f1((PLAN.fallZ[1] - PLAN.fallZ[0]) / 2)} + sf, abs(az - ${f1((PLAN.fallZ[0] + PLAN.fallZ[1]) / 2)})))*(1. - smoothstep(${f1(PLAN.fallTop)}, ${f1(PLAN.fallTop * 1.7)}, q.y));
          float gate = (1. - smoothstep(${f1(GATE_W / 2)} - sf, ${f1(GATE_W / 2)} + sf, az))*(1. - smoothstep(${f1(GATE_H * 0.6)}, ${f1(GATE_H * 1.6)}, q.y));
          pool = (clothLight(q.zy)*max(cloth, max(outerL, fall*GATE_FALL)) + vec3(1., .86, .62)*gate*GATE_POOL)*ahead*(1. - smoothstep(60., 220., t));
          m = mix(m, (uSkyCol*.5 + vec3(.2, .19, .15)), .4*ahead*warp*(1. - cloth));
        }
        return m;
      }
      void main(){
        vec3 N = vec3(0., 1., 0.);
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, N);
        // the slabs' joints, six metres apart, softened by the picture's grain
        vec2 g = vW.xz/6., gw = fwidth(g);
        // inside the Mill's drum the slabs lie in rings about its centre, each ring cut by its own count of spokes
        vec2 dm = vW.xz - MILL_C; float rm = length(dm);
        if (rm < 75.) {
          float ring = floor(rm/6.), spokes = floor(6.2831853*(ring + .5));
          float th = atan(dm.y, dm.x)/6.2831853;
          g = vec2(rm/6., th*spokes + ring*.37);
          gw = vec2(fwidth(rm)/6., fwidth(vW.x)/max(rm, 3.)*spokes/6.2831853*1.5);
        }
        vec2 jd = abs(fract(g) - .5);
        float joint = 1. - .55*min(smoothstep(.5 - gw.x*1.2 - .002, .5, jd.x) + smoothstep(.5 - gw.y*1.2 - .002, .5, jd.y), 1.)*clamp(.012/max(gw.x, gw.y), 0., 1.);
        float slab = .9 + .2*hash21(floor(g));
        vec3 alb = vec3(.115, .095, .078)*slab*joint;
        vec3 col = alb*lightAt(N, vW);
        col += alb*lanternCol()*LANTERN_ROUND*(1. - smoothstep(18., 21., rm));
        float fr = .05 + .33*pow(clamp(1. - dot(N, V), 0., 1.), 3.);
        col += mirrorAt(vW, R)*fr*joint;
        col += pool*(.1 + .9*fr)*joint;
        col *= footShade(vW);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the house's shell (iron, timber, glass)
const IR = MATTER.iron, IRL = MATTER.ironLit, STL = MATTER.steel, TIM = MATTER.timber, OAK = MATTER.oak;
// the vault of the Store: its section at the angle a (0 at a wall's head, a quarter turn at the crown)
const vaultAt = (a, side) => [side * PLAN.storeHalf * Math.cos(a), 30 + (PLAN.storeCrown - 30) * Math.sin(a)];
// the crossing's wings reach to z 55 on the south (glass) and to z -40 on the north (the Drive's brick bay); the links
// to and from the Mill are 30 m broad under a round vault of glass that springs 30 m up (crown 45)
const WING_S = 55, WING_N = 40, LINK_HALF = 15, LINK_SPRING = 30, BRICK = [lin('#6a3f33', 1.0), [0, 0.1]];
async function shellStore(M, G, ctx) {
  // every iron face of the Store's shell takes the plates' grain (joints 3.5 m apart, rivet rows)
  M.dress = [6, 3.5, 3.5, 0];
  const X0 = PLAN.storeX0, X1 = 300, H = PLAN.storeHalf, bar = [7, 6, 0.2, 1.15];
  for (const s of [-1, 1]) {
    // the nave's wall: an iron plinth and glass over it to the vault's foot, as far as the crossing
    M.box((X0 + PLAN.storeX1) / 2, 3, s * (H + 0.6), PLAN.storeX1 - X0, 6, 1.2, IR[0], IR[1]);
    G.quad([X0, 6, s * H], [PLAN.storeX1, 6, s * H], [PLAN.storeX1, 30, s * H], [X0, 30, s * H], X0, 6, PLAN.storeX1, 30, bar);
    // the vault's glass in six bands a side, on over the crossing
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI / 2, a1 = ((i + 1) / 6) * Math.PI / 2, p = vaultAt(a0, s), q = vaultAt(a1, s), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      G.quad([X0, p[1], p[0]], [X1, p[1], p[0]], [X1, q[1], q[0]], [X0, q[1], q[0]], X0, 30 + i * len, X1, 30 + (i + 1) * len, [7, 60, 0.2, 1.2]);
      M.rod([X0, q[1] - 0.1, q[0]], [X1, q[1] - 0.1, q[0]], 0.22, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
    }
    // the ribs, fourteen metres apart: a pier and the arch over it
    for (let x = X0 + 1.5; x < X1; x += 14) {
      if (x < PLAN.storeX1) M.box(x, 15, s * (H - 0.5), 1.1, 30, 1, IRL[0], IRL[1], { skip: '-y' });
      for (let i = 0; i < 6; i++) {
        const p = vaultAt((i / 6) * Math.PI / 2, s * 0.985), q = vaultAt(((i + 1) / 6) * Math.PI / 2, s * 0.985);
        M.rod([x, p[1] - 0.4, p[0]], [x, q[1] - 0.4, q[0]], 0.55, 4, IRL[0], IRL[1], { flat: true, twist: Math.PI / 4 });
        // THE RIB'S WEB: an iron plate PLAN.ribDeep deep under the rib, in the rib's own plane (the sun's law reads it)
        const web = (a) => [s * (PLAN.storeHalf - PLAN.ribDeep) * Math.cos(a), 30 + (PLAN.storeCrown - 30 - PLAN.ribDeep) * Math.sin(a)];
        const pi = web((i / 6) * Math.PI / 2), qi = web(((i + 1) / 6) * Math.PI / 2);
        M.quad([x, p[1] - 0.4, p[0]], [x, q[1] - 0.4, q[0]], [x, qi[1], qi[0]], [x, pi[1], pi[0]], IRL[0], IRL[1]);
      }
    }
    // the crossing's wings. SOUTH (the sun's side): a lean-to of glass from the vault's foot down to the outer wall of
    // glass. NORTH (the Drive's): an engine bay ten metres deep with a back wall of dark brick to the vault's foot
    // and a flat iron roof, so that the wheel and its steam stand against the brick with the south sun on them.
    const xa = PLAN.storeX1;
    if (s > 0) {
      G.quad([xa, 30, H], [X1, 30, H], [X1, 24, WING_S], [xa, 24, WING_S], xa, 0, X1, 26, [7, 6.5, 0.2, 1.2]);
      G.quad([xa, 6, WING_S], [X1, 6, WING_S], [X1, 24, WING_S], [xa, 24, WING_S], xa, 6, X1, 24, bar);
      M.box((xa + X1) / 2, 3, WING_S + 0.6, X1 - xa, 6, 1.2, IR[0], IR[1]);
      M.box(xa - 0.5, 13.5, (H + WING_S) / 2, 1, 27, WING_S - H, IR[0], IR[1]);
    } else {
      M.box((xa + X1) / 2, 15, -(WING_N + 0.6), X1 - xa, 30, 1.2, BRICK[0], BRICK[1], { paint: [8, 0.6, 0, 0] });
      M.box((xa + X1) / 2, 30.3, -(H + WING_N) / 2, X1 - xa, 0.6, WING_N - H + 1.2, IR[0], IR[1], { paint: [6, 5, 5, 0] });
      M.box(xa - 0.5, 15, -(H + WING_N) / 2, 1, 30, WING_N - H, BRICK[0], BRICK[1], { paint: [8, 0.6, 0, 0] });
    }
    M.box(xa, 15, s * (H - 0.5), 1.6, 30, 1.6, IRL[0], IRL[1], { skip: '-y' });
  }
  await ctx.yield();
  // the west wall of glass, under the vault's own line
  const N = 12, ol = [];
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI, z = -H * Math.cos(a), y = 30 + (PLAN.storeCrown - 30) * Math.sin(a); ol.push([z, y]); }
  G.quad([X0, 6, H], [X0, 6, -H], [X0, 30, -H], [X0, 30, H], H, 6, -H, 30, [6, 6, 0.2, 1.15]);
  for (let i = 0; i < N; i++) G.tri([X0, 30, 0], [X0, ol[i + 1][1], ol[i + 1][0]], [X0, ol[i][1], ol[i][0]], [0, 30], [ol[i + 1][0], ol[i + 1][1]], [ol[i][0], ol[i][1]], [6, 6, 0.2, 1.15]);
  M.box(X0 - 0.6, 3, 0, 1.2, 6, 2 * H, IR[0], IR[1]);
  M.rod([X0, PLAN.storeCrown - 0.3, 0], [X1, PLAN.storeCrown - 0.3, 0], 0.4, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
  // THE EAST END of the nave and crossing: a wall of glass on an iron plinth under the vault and the wings' roofs,
  // and in it THE TALL OPEN ARCH to the Mill: thirty metres broad, round-headed, its crown 45 m up (the vault's is 48),
  // ringed in iron. Through it the link's hoops and the Mill's barrels in their light stand at the nave's end.
  const vy = (z) => 30 + 18 * Math.sqrt(Math.max(0, 1 - (z / H) ** 2)), eb = [7.5, 6, 0.2, 1.15];
  const pane = (pts) => { for (let i = 1; i + 1 < pts.length; i++) G.tri([X1, pts[0][1], pts[0][0]], [X1, pts[i][1], pts[i][0]], [X1, pts[i + 1][1], pts[i + 1][0]], pts[0], pts[i], pts[i + 1], eb); };
  for (const s of [-1, 1]) {
    const zw = s > 0 ? WING_S : WING_N;
    M.box(X1 + 0.6, 3, s * (LINK_HALF + zw) / 2, 1.2, 6, zw - LINK_HALF, IR[0], IR[1]);
    // (the engine bay's east end is brick like its back and its west end, from the arch's pier to the back wall)
    if (s > 0) pane([[LINK_HALF, 6], [zw, 6], [zw, 24], [H, 30], [LINK_HALF, 30]]);
    else M.box(X1 + 0.3, 18, -(LINK_HALF + 1.2 + zw) / 2, 0.6, 24, zw - LINK_HALF - 1.2, BRICK[0], BRICK[1], { paint: [8, 0.6, 0, 0] });
    for (let i = 0; i < 6; i++) { const z0 = LINK_HALF + i * 2.5, z1 = z0 + 2.5; pane([[s * z0, 30], [s * z1, 30], [s * z1, vy(z1)], [s * z0, vy(z0)]]); }
    M.box(X1 - 0.3, 15, s * (LINK_HALF + 0.6), 1.8, 30, 1.2, IRL[0], IRL[1], { skip: '-y' });
    M.box(X1 - 0.3, 15, s * H, 1.2, 30, 1.2, IRL[0], IRL[1], { skip: '-y' });
    if (s > 0) M.box(X1 - 0.3, 12.6, s * 42.5, 0.9, 25.2, 0.9, IRL[0], IRL[1], { skip: '-y' });
    M.box(X1 - 0.3, 30, s * (LINK_HALF + H) / 2, 0.7, 0.7, H - LINK_HALF, IRL[0], IRL[1]);
  }
  // over the arch: the glass between its ring and the vault; and the ring itself, an iron band on the arch's line
  const ARC_N = 12, ay = (z) => LINK_SPRING + Math.sqrt(Math.max(0, LINK_HALF * LINK_HALF - z * z));
  for (let i = 0; i < ARC_N; i++) {
    const z0 = -LINK_HALF + (2 * LINK_HALF * i) / ARC_N, z1 = z0 + (2 * LINK_HALF) / ARC_N;
    pane([[z0, ay(z0)], [z1, ay(z1)], [z1, vy(z1)], [z0, vy(z0)]]);
    M.rod([X1 - 0.3, ay(z0), z0], [X1 - 0.3, ay(z1), z1], 1.0, 4, IRL[0], IRL[1], { flat: true, twist: Math.PI / 4 });
  }
}
// the rods that carry a ramp of the Store's low bay from the vault's ribs, and a hung shaft from a link's hoop: their
// half breadths (stout, to be read from across a hall)
const RAMP_ROD = 0.2, LINK_ROD = 0.22, LINK_STEP = 7.5;
// a wall bay's rack is WALL_BAR broad; its pinion's radius
const WALL_BAR = 2.0, WALL_PIN = 1.3;
// a link's glass wall: its panes' breadth and height, its bars' half breadth, its light
const LINK_PANE = [2.5, 4, 0.13, 1.15];
// (built in two steps of the build, the drum and then the links: half 0 and half 1)
function shellMill(M, G, rackSalt, wallPins, half) {
  M.dress = [6, 3.75, 3.75, 0];
  const C = [PLAN.cx, PLAN.cz], R = PLAN.drumR, D = Math.PI / 180, STEP = 7.5, at = (deg, r) => [C[0] + Math.cos(deg * D) * r, C[1] + Math.sin(deg * D) * r];
  const inw = (deg, ny = 0) => { const l = Math.hypot(1, ny); return [-Math.cos(deg * D) / l, ny / l, -Math.sin(deg * D) / l]; };
  const rows = [[R, 46], [56, 57], [36, 66], [PLAN.lanternR, PLAN.lanternY]], WALL = [lin('#2c343f', 2.8), [0, 1]];
  if (half === 0) for (let i = 0; i < 48; i++) {
    const a0 = i * STEP - 11.25, a1 = a0 + STEP, am = a0 + STEP / 2, p = at(a0, R), q = at(a1, R);
    const open = Math.abs(((am + 180) % 360) - 180) < 11.3 || Math.abs(am - 180) < 11.3;
    const n0 = inw(a0), n1 = inw(a1), nn = [n0, n1, n1, n0], arc0 = a0 * D * R, arc1 = a1 * D * R;
    if (!open) {
      // the bay's face: plain iron panels, two abreast and six high (the grain's law of plates on the round wall)
      M.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], 40, q[1]], [p[0], 40, p[1]], WALL[0], WALL[1], [9, STEP * D * R / 2, 40 / 6, 0], nn);
      G.quad([p[0], 40, p[1]], [q[0], 40, q[1]], [q[0], 46, q[1]], [p[0], 46, p[1]], arc0, 40, arc1, 46, [2.455, 20, 0.13, 1.3]);
      const m = at(am, R - 0.35);
      for (const y of [13.5, 27, 39.6]) M.box(m[0], y, m[1], 0.7, 0.7, 2 * R * Math.sin(STEP * D / 2), IRL[0], IRL[1], { ry: -am * D, skip: '+x' });
      // the bay's ONE rack: a broad toothed steel bar up the wall from the floor to the wall bed, sliding up and
      // back (a tooth and its gap 0.4 m each), and its one brass pinion beside it at half height, its axis in the wall
      const k = at(am, R - 0.75), pk = at(am + Math.atan2(WALL_BAR / 2 + WALL_PIN - 0.15, R - 0.9) / D, Math.hypot(WALL_BAR / 2 + WALL_PIN - 0.15, R - 0.9));
      M.box(k[0], 20.6, k[1], 0.5, 37.2, WALL_BAR, STL[0], STL[1], { ry: -am * D, skip: '+x', paint: [5, 0.8, 200 + i + rackSalt, 1] });
      wallPins.push({ x: pk[0], y: 20, z: pk[1], deg: am, col: [1 / (WALL_PIN * 0.6283), 0, NO_WAVE, 0], seed: 200 + i + rackSalt });
      M.rod([pk[0] - Math.cos(am * D) * 0.1, 20, pk[1] - Math.sin(am * D) * 0.1], [pk[0] + Math.cos(am * D) * 0.8, 20, pk[1] + Math.sin(am * D) * 0.8], 0.3, 6, IRL[0], IRL[1], {});
    } else M.quad([p[0], 44, p[1]], [q[0], 44, q[1]], [q[0], 46, q[1]], [p[0], 46, p[1]], IR[0], IR[1], undefined, nn);
    const pp = at(a0, R - 0.4);
    const jamb = Math.abs(Math.abs(((a0 + 180) % 360) - 180) - 11.25) < 0.1 || Math.abs(Math.abs(a0 - 180) - 11.25) < 0.1;
    const inOpen = Math.abs(((a0 + 180) % 360) - 180) < 11 || Math.abs(a0 - 180) < 11;
    // (a pilaster and a jamb are piers: each upright face a sunk panel between two lit arrises, the part's aPaint 12)
    if (!inOpen) M.box(pp[0], jamb ? 22 : 20, pp[1], jamb ? 1.3 : 0.8, jamb ? 44 : 40, jamb ? 1.6 : 1, IRL[0], IRL[1], { ry: -a0 * D, skip: '-y', arris: true });
    // the dome: three courses of dark iron up to the lantern's ring, a rib on every joint
    for (let k = 0; k < 3; k++) {
      const [r0, y0] = rows[k], [r1, y1] = rows[k + 1], a = at(a0, r0), b = at(a1, r0), c = at(a1, r1), d = at(a0, r1), ny = -(r0 - r1) / (y1 - y0);
      M.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], WALL[0], WALL[1], [4, 2.75, 0, 0], [inw(a0, ny), inw(a1, ny), inw(a1, ny), inw(a0, ny)]);
      if (i % 2 === 0) { const e = at(a0, r0 - 0.3), f = at(a0, r1 - 0.3); M.rod([e[0], y0 - 0.3, e[1]], [f[0], y1 - 0.3, f[1]], 0.3, 4, IRL[0], IRL[1], { flat: true }); }
    }
    const l0 = at(a0, PLAN.lanternR), l1 = at(a1, PLAN.lanternR);
    G.tri([C[0], PLAN.lanternY, C[1]], [l0[0], PLAN.lanternY, l0[1]], [l1[0], PLAN.lanternY, l1[1]], [C[0], C[1]], l0, l1, [3.75, 3.75, 0.11, 1.6]);
    M.rod([l0[0], PLAN.lanternY - 0.3, l0[1]], [l1[0], PLAN.lanternY - 0.3, l1[1]], 0.35, 4, IRL[0], IRL[1], { flat: true });
    M.rod([p[0], 46.2, p[1]], [q[0], 46.2, q[1]], 0.3, 4, IRL[0], IRL[1], { flat: true });
  }
  if (half === 0) return;
  // the two glazed links, from the crossing to the west arch and from the east arch to the Cards: walls of glass to the
  // springing, a round vault of glass over them with an iron hoop every 7.5 m; where a link meets the drum (whose own
  // arch is square-headed, 44 m high) and the Cards' west wall, the space over the vault's round is closed
  const jx = Math.sqrt(R * R - LINK_HALF * LINK_HALF), VB = 5, vp = (i, s) => { const a = (i / VB) * Math.PI / 2; return [s * LINK_HALF * Math.cos(a), LINK_SPRING + LINK_HALF * Math.sin(a)]; };
  const ay = (z) => LINK_SPRING + Math.sqrt(Math.max(0, LINK_HALF * LINK_HALF - z * z));
  for (const [x0, x1, west] of [[300, C[0] - jx + 0.4, true], [C[0] + jx - 0.4, PLAN.cardX0, false]]) {
    for (const s of [-1, 1]) {
      M.box((x0 + x1) / 2, 3, s * (LINK_HALF + 0.6), x1 - x0, 6, 1.2, IR[0], IR[1]);
      // THE LINK'S WALL OF GLASS, one law for both links and both sides: glazing bars LINK_PANE apart (three panes
      // to a post's bay, a transom every four metres), and a lit iron sill along the plinth's head inside the glass
      G.quad([x0, 6, s * LINK_HALF], [x1, 6, s * LINK_HALF], [x1, LINK_SPRING, s * LINK_HALF], [x0, LINK_SPRING, s * LINK_HALF], x0, 6, x1, LINK_SPRING, LINK_PANE);
      M.box((x0 + x1) / 2, 6.2, s * (LINK_HALF - 0.4), x1 - x0, 0.6, 0.8, IRL[0], IRL[1], { skip: '-y' });
      for (let x = x0 + 3.75; x < x1; x += 7.5) M.box(x, LINK_SPRING / 2, s * (LINK_HALF - 0.3), 0.7, LINK_SPRING, 0.6, IRL[0], IRL[1], { skip: '-y', arris: true });
      for (let i = 0; i < VB; i++) {
        const p = vp(i, s), q = vp(i + 1, s), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        G.quad([x0, p[1], p[0]], [x1, p[1], p[0]], [x1, q[1], q[0]], [x0, q[1], q[0]], x0, i * len, x1, (i + 1) * len, [7.5, 60, 0.2, 1.2]);
        for (let x = x0 + 3.75; x < x1; x += 7.5) M.rod([x, p[1] - 0.3, p[0] * 0.98], [x, q[1] - 0.3, q[0] * 0.98], 0.45, 4, IRL[0], IRL[1], { flat: true, twist: Math.PI / 4 });
      }
    }
    M.rod([x0, LINK_SPRING + LINK_HALF - 0.3, 0], [x1, LINK_SPRING + LINK_HALF - 0.3, 0], 0.3, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
    const xd = west ? x1 : x0, nd = west ? [1, 0, 0] : [-1, 0, 0], xc = west ? x0 : x1;
    for (let i = 0; i < 8; i++) {
      const z0 = -LINK_HALF + (2 * LINK_HALF * i) / 8, z1 = z0 + (2 * LINK_HALF) / 8;
      M.quad([xd, ay(z0), z0], [xd, ay(z1), z1], [xd, 44.2, z1], [xd, 44.2, z0], WALL[0], WALL[1], [6, 4, 4, 0], [nd, nd, nd, nd]);
      if (!west) M.quad([xc, ay(z0), z0], [xc, ay(z1), z1], [xc, 44.2, z1], [xc, 44.2, z0], TIM[0], TIM[1], [7, 0.45, 0, 0], [nd, nd, nd, nd]);
    }
  }
  for (const [am] of [[180], [0]]) { const m = at(am, R - 0.5); M.box(m[0], 44.5, m[1], 1.6, 1.2, 31, IRL[0], IRL[1], { ry: -am * D }); }
}
function shellCards(M, G) {
  const X0 = PLAN.cardX0, X1 = PLAN.cardX1, H = PLAN.cardHalf, L = X1 - X0, mx = (X0 + X1) / 2, EAVE = 50, RIDGE = PLAN.cardHigh;
  // the hall's timber is warm amber oak in boards (amber in the sun, brown in shade), its rails and posts the same
  // oak darker; every face of it takes the boards' grain. THE BOARDS BEHIND THE CHAINS (the north wall at the
  // galleries' backs, the south wall's plinth and its bands between the windows) are a deeper oak, BACK, so that
  // the pasteboards stand before them; the galleries' floors and edges, the rails and the posts keep the amber.
  const TIM = MATTER.timber, dark = [lin('#b98a55', 0.55), [0, 0.25]], BACK = [lin('#b48f71'), [0, 0.25]];
  M.dress = [7, 0.42, 0, 0];
  for (const s of [-1, 1]) {
    // the galleries: five timber floors four metres deep with a rail and posts; the south wall between them is glass
    for (const gy of PLAN.galY) {
      M.box(mx, gy - 0.25, s * (H - PLAN.galDeep / 2), L, 0.5, PLAN.galDeep, TIM[0], TIM[1]);
      M.box(mx, gy + 1.15, s * (H - PLAN.galDeep + 0.1), L, 0.16, 0.16, dark[0], dark[1]);
      M.box(mx, gy + 0.6, s * (H - PLAN.galDeep + 0.1), L, 0.1, 0.1, dark[0], dark[1]);
    }
    for (let x = X0 + 5; x < X1; x += 10) M.box(x, 25, s * (H - PLAN.galDeep + 0.1), 0.36, 50, 0.36, dark[0], dark[1], { skip: '-y' });
    if (s > 0) {
      M.box(mx, 4, s * (H + 0.3), L, 8, 0.6, BACK[0], BACK[1]);
      for (const gy of PLAN.galY) {
        G.quad([X0, gy + 1.3, s * H], [X1, gy + 1.3, s * H], [X1, Math.min(gy + 7.8, EAVE), s * H], [X0, Math.min(gy + 7.8, EAVE), s * H], X0, 0, X1, 6.5, [5, 30, 0.28, CARD_PANE]);
        M.box(mx, gy + 0.2, s * (H + 0.2), L, 2.2, 0.4, BACK[0], BACK[1]);
      }
    } else M.box(mx, EAVE / 2, s * (H + 0.3), L, EAVE, 0.6, BACK[0], BACK[1]);
    // the pitched ridge of glass and its rafters
    G.quad([X0, EAVE, s * H], [X1, EAVE, s * H], [X1, RIDGE, 0], [X0, RIDGE, 0], X0, 0, X1, 21, [5, 60, 0.2, CARD_PANE]);
    for (let x = X0 + 5; x < X1; x += 10) M.rod([x, EAVE - 0.3, s * H], [x, RIDGE - 0.3, 0], 0.28, 4, dark[0], dark[1], { flat: true });
  }
  M.rod([X0, RIDGE - 0.4, 0], [X1, RIDGE - 0.4, 0], 0.35, 4, dark[0], dark[1], { flat: true });
  // the west end: the wall round the way in from the Mill's link (30 m broad, 44 m high)
  for (const s of [-1, 1]) M.box(X0 - 0.3, 25, s * 17.5, 0.6, 50, 5, TIM[0], TIM[1], { skip: '-y' });
  M.quad([X0, 44, -15], [X0, 44, 15], [X0, RIDGE, 0], [X0, RIDGE, 0], TIM[0], TIM[1], undefined, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
  M.quad([X0, 44, -15], [X0, RIDGE, 0], [X0, EAVE, -H], [X0, 44, -H], TIM[0], TIM[1], undefined, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
  M.quad([X0, 44, 15], [X0, 44, H], [X0, EAVE, H], [X0, RIDGE, 0], TIM[0], TIM[1], undefined, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
  M.dress = [0, 0, 0, 0];
}
// the Loom's hall: the south wall is glass from its plinth to the eaves between oak posts (the sun's way in); the
// north wall is oak boards with four galleries; an oak roof with a ridge strip of glass; the east end is the oak end
// wall the loom stands against, with one window behind the loom's cloth and the gateway in its foot
const LOOM_GAL = [12, 26, 40, 54], OUTER_IN = 2, OUTER_RIM = 0.5, OUTER_X = PLAN.loomX1 - 1.2;
function shellLoom(M, G) {
  const X0 = PLAN.loomX0, X1 = PLAN.loomX1, H = PLAN.loomHalf, T = PLAN.loomHigh, L = X1 - X0, mx = (X0 + X1) / 2;
  const wall = [lin('#a98a62', 0.5), [0, 0.3]], rail = [lin('#a98a62', 0.4), [0, 0.25]], N4 = (n) => [n, n, n, n];
  M.dress = [7, 0.45, 0, 0];
  // south: plinth, glass, eaves
  M.box(mx, 3, H + 0.3, L, 6, 0.6, wall[0], wall[1]);
  G.quad([X0, 6, H], [X1, 6, H], [X1, 72, H], [X0, 72, H], 0, 0, L, 66, [8, 11, 0.22, 1.25]);
  M.box(mx, 73, H + 0.3, L, 2, 0.6, wall[0], wall[1]);
  // north: boards to the roof, and the galleries with their rails
  M.box(mx, T / 2, -(H + 0.3), L, T, 0.6, wall[0], wall[1]);
  for (const gy of LOOM_GAL) {
    M.box(mx, gy - 0.3, -(H - 2), L, 0.6, 4, TIM[0], TIM[1]);
    M.box(mx, gy + 1.25, -(H - 3.9), L, 0.2, 0.2, rail[0], rail[1], { paint: [0, 0, 0, 0] });
    M.box(mx, gy + 0.65, -(H - 3.9), L, 0.12, 0.12, rail[0], rail[1], { paint: [0, 0, 0, 0] });
  }
  for (const s of [-1, 1]) {
    for (let x = X0 + 4; x < X1; x += ROOF_STEP) {
      M.box(x, T / 2, s * (H - 0.35), 0.9, T, 0.9, OAK[0], OAK[1], { skip: '-y', paint: [7, 0.45, 0, 1] });
      if (s < 0) M.box(x, 28, -(H - 3.9), 0.4, 56, 0.4, OAK[0], OAK[1], { skip: '-y', paint: [7, 0.4, 0, 1] });
    }
    // the roof: oak boards either side of a ridge strip of glass
    M.quad([X0, T, s * 8], [X1, T, s * 8], [X1, T, s * H], [X0, T, s * H], wall[0], wall[1], undefined, N4([0, -1, 0]));
    // the west wall beside and over the Cards' own section
    M.quad([X0, 0, s * PLAN.cardHalf], [X0, 0, s * H], [X0, T, s * H], [X0, T, s * PLAN.cardHalf], wall[0], wall[1], undefined, N4([1, 0, 0]));
    M.quad([X0, 50, s * PLAN.cardHalf], [X0, T, s * PLAN.cardHalf], [X0, T, 0], [X0, PLAN.cardHigh, 0], wall[0], wall[1], undefined, N4([1, 0, 0]));
  }
  G.quad([X0, T, -8], [X1, T, -8], [X1, T, 8], [X0, T, 8], X0, -8, X1, 8, [8, 8, 0.25, 1.3]);
  for (let x = X0 + 4; x < X1; x += ROOF_STEP) M.box(x, T - 0.5, 0, 0.8, 1, 2 * H, OAK[0], OAK[1], { paint: [7, 0.4, 0, 0] });
  // THE END WALL, at the loom's back: dark oak boards and posts from wall to wall and floor to roof. Its one light is
  // the window behind the loom's cloth (the cloth's own breadth, from the roller to the fell): a pane of the morning
  // which the cloth covers from every place of the hall. In its foot is the gateway where the gate stands: the gate's
  // own arch, a hand narrower all round, so that its rim lies behind the gate.
  const EW = [lin('#4a3524', 1.9), [0, 0.4]], WH = PLAN.warpHalf, wy0 = PLAN.rollY + 1.2, wy1 = PLAN.fellY, up = [7, 0.5, 0, 1];
  const face = (z0, z1, y0, y1) => M.quad([X1, y0, z0], [X1, y0, z1], [X1, y1, z1], [X1, y1, z0], EW[0], EW[1], up, N4([-1, 0, 0]));
  const gw = GATE_W / 2 - 0.3, spring = GATE_H - GATE_W / 2, arch = (z) => spring + Math.sqrt(Math.max(0, gw * gw - z * z));
  // THE OUTER WINDOWS: between each side post of the loom and the hall's side wall the end wall has a tall window,
  // which a hung length of the finished cloth covers (PLAN.outerZ, outerY: the cloth's own breadth and height; the
  // pane is OUTER_IN narrower on the side of the hall's middle and OUTER_RIM narrower elsewhere, so that no place of
  // the hall sees glass past the cloth's edge)
  const oz = PLAN.outerZ, oy = PLAN.outerY, pz0 = oz[0] + OUTER_IN, pz1 = oz[1] - OUTER_RIM, py0 = oy[0] + 2 * OUTER_RIM, py1 = oy[1] - 2 * OUTER_RIM;
  for (const s of [-1, 1]) {
    face(s * WH, s * pz0, 0, T); face(s * pz1, s * H, 0, T); face(s * pz0, s * pz1, 0, py0); face(s * pz0, s * pz1, py1, T);
    G.quad([X1, py0, s > 0 ? pz1 : -pz0], [X1, py0, s > 0 ? pz0 : -pz1], [X1, py1, s > 0 ? pz0 : -pz1], [X1, py1, s > 0 ? pz1 : -pz0], s > 0 ? pz1 : -pz0, py0, s > 0 ? pz0 : -pz1, py1, [8, 9.25, 0.25, 1.15]);
    face(s * gw, s * WH, 0, wy0);
    M.box(X1 - 0.45, T / 2, s * (H + 31) / 2, 0.9, T, 0.9, OAK[0], OAK[1], { skip: '-y', paint: [7, 0.45, 0, 1] });
  }
  face(-WH, WH, wy1, T);
  for (let i = 0; i < 16; i++) {
    const z0 = -gw + (2 * gw * i) / 16, z1 = z0 + (2 * gw) / 16;
    M.quad([X1, arch(z0), z0], [X1, arch(z1), z1], [X1, wy0, z1], [X1, wy0, z0], EW[0], EW[1], up, N4([-1, 0, 0]));
  }
  G.quad([X1, wy0, WH], [X1, wy0, -WH], [X1, wy1, -WH], [X1, wy1, WH], WH, wy0, -WH, wy1, [8, 9.25, 0.25, 1.15]);
  M.dress = [0, 0, 0, 0];
}

// ---------------------------------------------------------------- the Store: ranks of number columns
// THE FAR RANKS: one drum a column. Its shader draws the forty wheels on the drum's face and turns each by the
// part's one law of turning (the same wheelTurn the near ranks' true wheels are turned by).
// the low bay of one inner rank: ten columns of half height from x 110 to 170, its rack bed brought down two ramps of 13 m
const LOW_BAY = [110, 170], LOW_RAMP = 13;
// the grid an instance's numbers are laid on where a fragment shader reads them (rounded back to it there)
const GRID = 256;
function makeDrumMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec4 aCol; attribute vec2 aMeta;
      varying vec3 vW, vN, vL; varying vec4 vCol; varying vec2 vMeta;
      void main(){
        vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal); vL = position; vCol = aCol; vMeta = aMeta;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vL; varying vec4 vCol; varying vec2 vMeta;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${WHEEL_GLSL}
      const vec3 BRASS = vec3(${lin('#c9a04a').map((v) => v.toFixed(4)).join(', ')});
      const vec3 BRASS_DARK = vec3(${lin('#6e5320').map((v) => v.toFixed(4)).join(', ')});
      const vec3 BLUE_STEEL = vec3(${lin('#3d5f8f', 1.5).map((v) => v.toFixed(4)).join(', ')});
      const vec3 BRASS_EDGE = vec3(${lin('#f0d48a').map((v) => v.toFixed(4)).join(', ')});
      void main(){
        vec3 N = normalize(vN);
        // the grain of the picture on the drum's face, in scallops: finer than this and the scallops go to their mean tone
        float grain = length(fwidth(vL.xz))/(.9*.62831853);
        float y = vL.y - ${(PLAN.storeFoot).toFixed(1)}, k = floor(y/.6), fy = y - k*.6;
        vec3 col;
        if (vL.y > 26.02 || y < 0.) col = shadeDull(vec3(.012, .014, .018), N, vW, 1.);
        else {
          float act;
          vec4 dc = floor(vCol*${GRID}. + .5)/${GRID}.; float ds = floor(vMeta.x*${GRID}. + .5)/${GRID}.;
          float turn = wheelTurn(dc, ds, floor(vMeta.y + .5), k, uTime*uTempo, act);
          float th = atan(vL.z, vL.x)/.62831853 - turn;
          float s = fract(th), idx = mod(floor(th + .5), 10.);
          float notch = smoothstep(.2, .3, s)*(1. - smoothstep(.7, .8, s));
          float fade = smoothstep(.25, .9, grain);
          notch = mix(notch, .5, fade);
          float blue = step(idx, .5)*(1. - notch)*(1. - fade*.7);
          float tint = .86 + .28*hash21(vec2(k*1.7, ds*3.3));
          // as the true wheels are shaded (the part's wheel material): a worn bright edge above and below, the under
          // edge in the shade of the wheel over it, the stack's broad highlight and its darker turning edge
          float e = fy*4. - 1., worn = smoothstep(.8, 1., clamp(abs(e), 0., 1.))*(1. - fade);
          vec3 F0 = mix(mix(mix(BRASS, BRASS_DARK, notch*.45), BRASS_EDGE, worn*.6)*tint, BLUE_STEEL, blue);
          col = shadeMetal(F0, N, vW, .5 + .3*(1. - notch))*mix(1., .72, notch);
          vec3 V = normalize(cameraPosition - vW);
          float broad = pow(clamp(dot(N, normalize(uSunDir + V)), 0., 1.), 5.);
          col = col*mix(.5, 1.08, smoothstep(.05, .7, clamp(dot(N, V), 0., 1.))) + F0*gSun*broad*.55;
          col *= mix(.8, 1.12, smoothstep(-1., .6, e));
          col = mix(col, shadeMetal(vec3(.3, .33, .38), N, vW, .5)*.4, step(.5, fy)*(1. - fade*.6));
        }
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
function drumGeometry() {
  const m = makeMesher(), c = [0, 0, 0], s = [0, 0], R = PLAN.storeR;
  m.rod([0, PLAN.storeFoot, 0], [0, 26, 0], R, 12, c, s, {});
  m.rod([0, 0, 0], [0, PLAN.storeFoot, 0], R * 1.3, 12, c, s, { r2: R * 0.85, capB: true });
  // (the neck's top lies under the head's disc, and the disc's underside under the rank's bed: neither is drawn)
  m.rod([0, 26, 0], [0, 27.2, 0], R * 0.82, 12, c, s, { r2: R * 0.6 });
  m.rod([0, 27.3, 0], [0, 27.8, 0], 0.8, 10, c, s, { capB: true });
  return m.build();
}
// THE DOWN RODS. Each level section of an inner rank's bed sends its bars' motion down two of its columns (those
// nearest the section's quarter points): under the bed, on the column's lane side, a brass BELL CRANK takes the
// lane-side bar; it rocks as the bar slides (by the racks' own law and that section's own number: LINK_ROCK at the
// bar's farthest), and its level arm lifts and lowers a steel DOWN ROD that runs down the column's flank to a second
// bell crank over the column's foot, which pushes a short link along the foot. Plain mechanics; movers by the
// world's clock. One drawn form, many times; its parts move in its vertex shader (aPaint.x: 1 the rod, 2 a crank,
// 3 the foot link; a crank turns about its own pivot: the upper one under the bed, the lower one over the foot).
const LINK_ROCK = 0.55, LINK_ARM = 1.2, LINK_OUT = 1.45, LINK_TOP = 27.6, LINK_FOOT = 3.4, LINK_BED = 29.5;
function makeLinkMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 aSurf; attribute vec4 aPaint; attribute vec2 aRack;
      varying vec3 vW, vN, vC; varying vec2 vS;
      ${LIGHT_GLSL}
      ${RACK_GLSL}
      void main(){
        vec3 p = position, n = normal;
        float th = ${f1(LINK_ROCK)}*rackSlide(aRack.x, uTime*uTempo)/5., c = cos(th), sn = sin(th), kind = aPaint.x, up = step(10., p.y);
        vec2 piv = vec2(0., mix(${f1(LINK_FOOT)}, ${f1(LINK_TOP)}, up));
        if (kind > 1.5 && kind < 2.5) { vec2 d = p.xy - piv; p.xy = piv + vec2(c*d.x + sn*d.y, -sn*d.x + c*d.y); n.xy = vec2(c*n.x + sn*n.y, -sn*n.x + c*n.y); }
        else if (kind > .5 && kind < 1.5) p.y -= ${f1(LINK_ARM)}*sn;
        else if (kind > 2.5) p.x -= ${f1(LINK_ARM)}*sn;
        // (a station under the low bay's bed is the shorter by the bed's own drop)
        p.y += up*(aRack.y - ${f1(LINK_BED)});
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n); vC = color; vS = aSurf;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vC; varying vec2 vS;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      void main(){
        vec3 N = normalize(vN);
        vec3 col = vS.x > .5 ? shadeMetal(vC, N, vW, vS.y) : shadeDull(vC, N, vW, vS.y);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
function linkGeometry() {
  const m = makeMesher(), BR = MATTER.brass, Z = LINK_OUT, A = LINK_ARM, t = 0.14;
  // a bell crank: a brass lever of two slim arms at a right angle (one to the bar or the foot link, one level to the
  // rod), tapering from a boss on its pivot: a lever and nothing else
  const crank = (py, dy) => {
    const q = { paint: [2, 0, 0, 0] };
    m.rod([0, py, Z - t - 0.06], [0, py, Z + t + 0.06], 0.3, 6, BR[0], BR[1], { ...q, capA: true, capB: true });
    for (const e of [[0, py + dy * 1.1], [A, py]]) m.rod([0, py, Z], [e[0], e[1], Z], 0.17, 4, BR[0], BR[1], { ...q, flat: true, r2: 0.1 });
  };
  crank(LINK_TOP, 1); crank(LINK_FOOT, -1);
  m.rod([A, LINK_FOOT, Z], [A, LINK_TOP, Z], 0.13, 4, STL[0], STL[1], { flat: true, paint: [1, 0, 0, 0] });
  m.rod([0, LINK_FOOT - 1.05, Z], [-1.5, LINK_FOOT - 1.05, Z - 0.4], 0.11, 4, STL[0], STL[1], { flat: true, paint: [3, 0, 0, 0] });
  return m.build();
}
async function buildStore(W) {
  const { scene, shared, ctx } = W, rng = W.RNG.store;
  const share = clamp(0.3 + 0.15 * (W.vary.density - 0.7) / 0.6, 0.3, 0.45);
  const draw = () => { const p = (1.5 / share) * rng.range(0.85, 1.15); return { col: [p, rng.range(0, p), NO_WAVE, 0], seed: rng.range(1, 90) }; };
  const stack = { R: PLAN.storeR, depth: 0.19, pitch: PLAN.storeBand, thick: 0.5, segs: 2, capped: false, foot: PLAN.storeFoot, y0: PLAN.storeFoot };
  const gTall = wheelStackGeometry({ ...stack, wheels: PLAN.storeWheels }), gLow = wheelStackGeometry({ ...stack, wheels: PLAN.storeWheels / 2 });
  const pinGeo = wheelStackGeometry({ wheels: 1, R: 0.8, depth: 0.2, pitch: 0.6, thick: 0.5, segs: 3, capped: false, bare: true, foot: 0, y0: 0 });
  const wheelMat = makeWheelMaterial(shared, { y0: PLAN.storeFoot }), pinMat = makeWheelMaterial(shared, { y0: 0 });
  // a column under the low bay's bed or under either of its ramps is a low one (no stack stands up into a ramp)
  const lowAt = (x) => x > LOW_BAY[0] - LOW_RAMP && x < LOW_BAY[1] + LOW_RAMP;
  // a bar's number: its section's own, and the Store's salt from the racks' stream (so period, reach and phase are dealt)
  const M = makeMesher(), far = [], pins = [], links = [], teeth = (id) => [1, 0.5, id + W.rackSalt.store, 1];
  // (the iron of the beds, the Drive and the bridges takes the plates' grain where it names no paint of its own)
  M.dress = [6, 3, 3, 0];
  const sides = [-1, 1], rankZ = PLAN.rankZ.slice(0, W.ranks);
  for (const s of sides) for (let r = 0; r < rankZ.length; r++) {
    const z = s * rankZ[r], inner = r === 0, lowRank = inner && s === W.lowSide, rankId = (s > 0 ? 3 : 0) + r;
    let chunk = [], chunkLow = [];
    const flush = () => {
      if (chunk.length) scene.add(makeWheelColumn(gTall, wheelMat, chunk));
      if (chunkLow.length) scene.add(makeWheelColumn(gLow, wheelMat, chunkLow));
      chunk = []; chunkLow = [];
    };
    // the rank's bed in level sections [x0, x1, height, number], each section's bars sliding on their own; the low
    // bay's section lies lower, between two ramps
    const xa = PLAN.colX0 - 3, xb = PLAN.colX0 + (PLAN.colN - 1) * PLAN.colStep + 3, sections = [];
    if (lowRank) sections.push([xa, LOW_BAY[0] - LOW_RAMP, 29.5, rankId * 10], [LOW_BAY[0], LOW_BAY[1], 17.5, 90 + rankId], [LOW_BAY[1] + LOW_RAMP, xb, 29.5, rankId * 10 + 3]);
    else for (let k = 0; k < 5; k++) sections.push([xa + (xb - xa) * k / 5, xa + (xb - xa) * (k + 1) / 5, 29.5, rankId * 10 + k]);
    for (let i = 0; i < PLAN.colN; i++) {
      const x = PLAN.colX0 + i * PLAN.colStep, d = draw(), low = lowRank && lowAt(x);
      if (!inner) { far.push({ x, z, ...d }); continue; }
      (low ? chunkLow : chunk).push({ x, y: 0, z, ...d });
      // a pinion at the column's head where a level section's bars pass over it, turning with that section's bars
      const over = sections.find((q) => x >= q[0] && x <= q[1]);
      if (over) pins.push({ x, y: over[2] - 2.2, z, col: [1 / (0.8 * 0.6283), 0, NO_WAVE, 0], seed: over[3] + W.rackSalt.store });
      if (i % 10 === 9) { flush(); await ctx.yield(); }
    }
    flush();
    // the rank's rack bed over its heads (y 28 to 31): an iron bed and a toothed steel bar on either side
    const bed = (x0, y0, x1, y1, id) => {
      const len = Math.hypot(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      if (Math.abs(y1 - y0) < 0.01) {
        M.box(mx, my, z, len, 1.3, 1.5, IR[0], IR[1]);
        for (const e of [-1, 1]) M.box(mx, my - 0.75, z + e * 0.95, len, 0.5, 0.4, STL[0], STL[1], { paint: teeth(id) });
      } else {
        M.rod([x0, y0, z], [x1, y1, z], 0.85, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
        // A RAMP IS A BED TOO, and it is carried: its two toothed bars run on down it beside the bed, and at every
        // rib of the vault that stands over it a pair of iron rods comes down from the rib's web to a yoke under the
        // bed (the ribs stand VAULT_STEP apart from 1.5 m inside the west wall; the web's foot over this rank)
        for (const e of [-1, 1]) M.rod([x0, y0 - 0.75, z + e * 0.95], [x1, y1 - 0.75, z + e * 0.95], 0.3, 4, STL[0], STL[1], { flat: true, twist: Math.PI / 4, paint: teeth(id) });
        const webY = 30 + (PLAN.storeCrown - 30 - PLAN.ribDeep) * Math.sqrt(Math.max(0, 1 - (z / (PLAN.storeHalf - PLAN.ribDeep)) ** 2));
        for (let x = PLAN.storeX0 + 1.5; x < Math.max(x0, x1); x += VAULT_STEP) if (x > Math.min(x0, x1)) {
          const y = y0 + (y1 - y0) * (x - x0) / (x1 - x0);
          for (const e of [-1, 1]) M.rod([x, y - 0.9, z + e * 1.25], [x, webY, z + e * 1.25], RAMP_ROD, 4, IRL[0], IRL[1], { flat: true });
          M.box(x, y - 1.05, z, 0.4, 0.3, 2.9, IRL[0], IRL[1]);
        }
      }
    };
    for (const q of sections) bed(q[0], q[2], q[1], q[2], q[3]);
    // the down rods' stations of this rank: at the columns nearest the quarter points of each level section
    if (inner) for (const q of sections) for (const f of [0.25, 0.75]) {
      const i = clamp(Math.round((q[0] + (q[1] - q[0]) * f - PLAN.colX0) / PLAN.colStep), 0, PLAN.colN - 1);
      links.push({ x: PLAN.colX0 + i * PLAN.colStep, z, turn: s > 0 ? Math.PI : 0, seed: q[3] + W.rackSalt.store, bed: q[2] });
    }
    if (lowRank) { const [b0, b1] = LOW_BAY, r = LOW_RAMP; bed(b0 - r, 29.5, b0, 17.5, rankId * 10); bed(b1, 17.5, b1 + r, 29.5, rankId * 10 + 3); }
    // the rank's bed turns in to its hand's bridge (z 12) at the crossing
    M.rod([xb, 29.5, z], [xb + 12, 29.5, s * 12], 0.85, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
  }
  const pinMesh = makeWheelColumn(pinGeo, pinMat, pins);
  pinMesh.geometry.getAttribute('aMeta').array.forEach((_, i, arr) => { if (i % 2 === 1) arr[i] = -1; });
  scene.add(pinMesh);
  // the down rods with their bell cranks: one drawn form at every station
  {
    const g = linkGeometry(), n = links.length, rack = new Float32Array(n * 2), m4 = new THREE.Matrix4();
    const mesh = new THREE.InstancedMesh(g, makeLinkMaterial(shared), n);
    links.forEach((c, i) => { rack[i * 2] = c.seed; rack[i * 2 + 1] = c.bed; mesh.setMatrixAt(i, m4.makeRotationY(c.turn).setPosition(c.x, 0, c.z)); });
    g.setAttribute('aRack', new THREE.InstancedBufferAttribute(rack, 2));
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    mesh.userData = { kind: 'instanced', reach: LINK_ARM };
    scene.add(mesh);
  }
  // the far ranks, one drum a column
  if (far.length) {
    const g = drumGeometry(), n = far.length, col = new Float32Array(n * 4), meta = new Float32Array(n * 2), m4 = new THREE.Matrix4();
    const drums = new THREE.InstancedMesh(g, makeDrumMaterial(shared), n);
    // (a drum's numbers are read in its fragment shader: they are laid on a grid of 1/256 here and rounded back to it
    // there, so that no smear between a face's corners can reach the law of turning)
    const grid = (v) => Math.round(v * GRID) / GRID;
    far.forEach((c, i) => { col.set(c.col.map(grid), i * 4); meta[i * 2] = grid(c.seed); meta[i * 2 + 1] = PLAN.storeWheels; drums.setMatrixAt(i, m4.makeTranslation(c.x, 0, c.z)); });
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 4)); g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 2));
    drums.instanceMatrix.needsUpdate = true; drums.computeBoundingSphere();
    drums.userData = { kind: 'instanced', reach: 0 };
    scene.add(drums);
  }
  W.storeIron = M;
}
// ---------------------------------------------------------------- the Drive: flywheel, rocking beam, cylinder, governor
// It stands in the crossing's north bay, its face to the south sun and to the line. The flywheel turns once in nine
// seconds of the world's clock; the beam rocks with it; the governor whirls. Its iron is painted (one of four
// hues by the seed, three deep and one a cream, none a red or a brown: THE DRIVE'S PAINT below), the rim's tread
// worn bright, bands and oil cups of brass.
// (the cylinder stands east of the wheel, its bands clear of the wheel's rim and belt)
const FLY = PLAN.fly, BEAM_Y = 32, CYL = { x: FLY.x + FLY.R + 3.5, r: 2.5, top: 24 };
// the bearing frames' distance from the wheel's plane and their legs' spread; the pit's half breadth; the governor's
// place (west of the wheel, south of its plane) and its stand's height
const FRAME_Z = 3.8, FRAME_FOOT = 4.4, PIT_HALF = 1.5, GOV_X = FLY.x - FLY.R - 3, GOV_Z = 5.5, GOV_STAND = 3;
function ball(M, c, r, col, surf) {
  const A = 8, B = 6;
  for (let i = 0; i < A; i++) for (let j = 0; j < B; j++) {
    const pt = (a, b) => { const th = (a / A) * Math.PI * 2, ph = (b / B) * Math.PI, n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)]; return [[c[0] + n[0] * r, c[1] + n[1] * r, c[2] + n[2] * r], n]; };
    const [p0, n0] = pt(i, j), [p1, n1] = pt(i + 1, j), [p2, n2] = pt(i + 1, j + 1), [p3, n3] = pt(i, j + 1);
    if (j > 0) M.tri(p0, p1, p2, col, surf, undefined, [n0, n1, n2]);
    if (j < B - 1) M.tri(p0, p2, p3, col, surf, undefined, [n0, n2, n3]);
  }
}
// THE DRIVE'S PAINT parts from the red brick behind it on every seed. ONE draw of the drive's stream deals the hue,
// the four alike (the hue is the draw times four, floored), none a red or a brown: a deep green, a slate
// blue-grey, a cream and a black-green. Each is told from BRICK by its hue or by its depth, in both its tones.
const DRIVE_PAINT = ['#1d5a45', '#34506b', '#8a816c', '#17382f'];
function buildDrive(W) {
  const { scene, shared } = W, S = W.storeIron, mat = makePlainMaterial(shared), rng = W.RNG.drive;
  const phase = rng.range(0, FLY.turn), deal = rng();
  const hue = DRIVE_PAINT[Math.floor(deal * DRIVE_PAINT.length)];
  shared.uWheel.value = phase;
  const PA = [lin(hue, 1.5), [0, 0.8]], PAL = [lin(hue, 2.3), [0, 0.8]], BR = [lin('#d9b45a'), [1, 0.8]], bright = [lin('#c8d0da'), [1, 0.9]];
  // the wheel: a painted rim with a bright worn tread and a brass band, eight spokes each with a raised rib, a hub with
  // its brass cap and bolts, an oil cup at every spoke's root; its face in the x-y plane
  const wm = makeMesher(), N = 48, R = FLY.R, r = R - 2.3, hz = 1.0;
  const ringFace = (ra, rb, z, col, e) => { for (let i = 0; i < N; i++) { const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, n = [0, 0, e]; wm.quad([Math.cos(a0) * ra, Math.sin(a0) * ra, z], [Math.cos(a0) * rb, Math.sin(a0) * rb, z], [Math.cos(a1) * rb, Math.sin(a1) * rb, z], [Math.cos(a1) * ra, Math.sin(a1) * ra, z], col[0], col[1], undefined, [n, n, n, n]); } };
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const P = (c, s, rad, z) => [c * rad, s * rad, z];
    wm.quad(P(c0, s0, R, hz), P(c0, s0, R, -hz), P(c1, s1, R, -hz), P(c1, s1, R, hz), bright[0], bright[1], undefined, [[c0, s0, 0], [c0, s0, 0], [c1, s1, 0], [c1, s1, 0]]);
    wm.quad(P(c0, s0, r, -hz), P(c0, s0, r, hz), P(c1, s1, r, hz), P(c1, s1, r, -hz), PA[0], PA[1], undefined, [[-c0, -s0, 0], [-c0, -s0, 0], [-c1, -s1, 0], [-c1, -s1, 0]]);
  }
  for (const e of [-1, 1]) { ringFace(r, R - 0.5, e * hz, PAL, e); ringFace(R - 0.5, R - 0.2, e * (hz + 0.04), BR, e); ringFace(R - 0.2, R, e * hz, bright, e); }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    wm.rod([c * 1.4, sn * 1.4, 0], [c * (r + 0.05), sn * (r + 0.05), 0], 1.0, 4, PA[0], PA[1], { flat: true, r2: 0.62 });
    for (const e of [-1, 1]) wm.rod([c * 1.6, sn * 1.6, e * 0.62], [c * (r - 0.1), sn * (r - 0.1), e * 0.42], 0.24, 4, PAL[0], PAL[1], { flat: true });
    ball(wm, [c * 2.3, sn * 2.3, 1.05], 0.3, BR[0], BR[1]);
    wm.rod([c * 1.15, sn * 1.15, 1.3], [c * 1.15, sn * 1.15, 1.5], 0.14, 6, bright[0], bright[1], { capB: true });
  }
  wm.rod([0, 0, -1.3], [0, 0, 1.3], 1.7, 16, PA[0], PA[1], { capA: true, capB: true });
  wm.rod([0, 0, 1.3], [0, 0, 1.75], 0.75, 12, BR[0], BR[1], { capB: true });
  wm.rod([4, 0, 1.0], [4, 0, 1.9], 0.4, 8, STL[0], STL[1], { capB: true });
  const wheel = new THREE.Mesh(wm.build(), mat); wheel.position.set(FLY.x, FLY.y, FLY.z);
  wheel.userData = { kind: 'spinZ', R: R + 0.1, half: 2 };
  // the beam over it (30 m, its pivot under the vault), on two posts; the cylinder; the rods between
  const bm = makeMesher();
  bm.box(0, 0, 0, 30, 1.9, 0.9, PA[0], PA[1]); bm.box(0, 0, 0, 3.2, 3.2, 1.1, PAL[0], PAL[1]); bm.box(0, 1.05, 0, 29, 0.2, 1.1, PAL[0], PAL[1]);
  for (const e of [-1, 1]) { bm.rod([e * 15, 0, -0.8], [e * 15, 0, 0.8], 0.45, 8, STL[0], STL[1], { capA: true, capB: true }); ball(bm, [e * 7.5, 1.3, 0], 0.28, BR[0], BR[1]); }
  bm.rod([0, 0, -0.7], [0, 0, 0.7], 0.6, 10, BR[0], BR[1], { capA: true, capB: true });
  const beam = new THREE.Mesh(bm.build(), mat); beam.position.set(FLY.x, BEAM_Y, FLY.z);
  beam.userData = { kind: 'swing', reach: 2.6 };
  const rodGeo = (() => { const m = makeMesher(); m.rod([0, 0, 0], [0, 1, 0], 0.22, 6, STL[0], STL[1], {}); return m.build(); })();
  const crankRod = new THREE.Mesh(rodGeo, mat), pistonRod = new THREE.Mesh(rodGeo, mat);
  crankRod.userData = { kind: 'swing', reach: 9 }; pistonRod.userData = { kind: 'swing', reach: 3 };
  // THE WHEEL'S BED. To either side of the wheel, FRAME_Z from its plane, a heavy iron BEARING FRAME stands on a bed
  // plate bolted to the floor: two raking legs and a tie carry the bearing block at the hub's height, and the wheel's
  // shaft lies in the two bearings (a brass bush in each block, an oil cup on it). On each bearing block stands a
  // STOUT COLUMN to the beam's height; the two columns' heads carry the beam's pivot in two plummer blocks, and the
  // beam rocks between them over the wheel.
  for (const e of [-1, 1]) {
    const z = FLY.z + e * FRAME_Z, x = FLY.x;
    S.box(x, 0.25, z, 2 * FRAME_FOOT + 2.8, 0.5, 2.4, PA[0], PA[1], { skip: '-y' });
    for (const ex of [-1, 1]) {
      S.rod([x + ex * FRAME_FOOT, 0.5, z], [x + ex * 0.9, FLY.y - 1, z], 0.85, 4, PA[0], PA[1], { flat: true, twist: Math.PI / 4 });
      for (const ez of [-1, 1]) S.rod([x + ex * (FRAME_FOOT + 0.8), 0.5, z + ez * 0.8], [x + ex * (FRAME_FOOT + 0.8), 0.85, z + ez * 0.8], 0.2, 6, bright[0], bright[1], { capB: true });
    }
    S.box(x, FLY.y / 2 - 0.5, z, FRAME_FOOT + 0.9, 0.6, 0.8, PAL[0], PAL[1]);
    S.box(x, FLY.y, z, 3.0, 2.4, 1.8, PAL[0], PAL[1]);
    S.rod([x, FLY.y, z - 1.0], [x, FLY.y, z + 1.0], 0.9, 12, BR[0], BR[1], { capA: true, capB: true });
    ball(S, [x, FLY.y + 1.5, z], 0.32, BR[0], BR[1]);
    const c0 = FLY.y + 1.2, c1 = BEAM_Y - 1.0;
    S.rod([x, c0, z], [x, c0 + 0.7, z], 1.35, 12, PAL[0], PAL[1], { capB: true });
    S.rod([x, c0 + 0.7, z], [x, c1 - 0.8, z], 1.0, 12, PA[0], PA[1], { r2: 0.78 });
    S.rod([x, c1 - 0.8, z], [x, c1 - 0.5, z], 0.92, 12, BR[0], BR[1], { capA: true, capB: true });
    S.rod([x, c1 - 0.5, z], [x, c1, z], 1.25, 12, PAL[0], PAL[1], { capA: true, capB: true });
    S.box(x, BEAM_Y, z, 2.2, 2.0, 1.5, PAL[0], PAL[1]);
    ball(S, [x, BEAM_Y + 1.2, z], 0.3, BR[0], BR[1]);
  }
  S.rod([FLY.x, FLY.y, FLY.z - FRAME_Z - 1.3], [FLY.x, FLY.y, FLY.z + FRAME_Z + 1.3], 0.55, 10, STL[0], STL[1], { capA: true, capB: true });
  S.rod([FLY.x, BEAM_Y, FLY.z - FRAME_Z - 1.0], [FLY.x, BEAM_Y, FLY.z + FRAME_Z + 1.0], 0.45, 8, STL[0], STL[1], { capA: true, capB: true });
  S.rod([CYL.x, 0, FLY.z], [CYL.x, CYL.top, FLY.z], CYL.r, 20, PA[0], PA[1], { capB: true });
  for (const y of [1, CYL.top / 3, 2 * CYL.top / 3, CYL.top - 0.5]) S.rod([CYL.x, y - 0.3, FLY.z], [CYL.x, y + 0.3, FLY.z], CYL.r + 0.2, 20, BR[0], BR[1], { capA: true, capB: true });
  // THE PIT: the wheel's lowest part turns in a pit in the floor (PIT_HALF broad to either side of the wheel's plane,
  // a metre longer than the wheel at either end), kerbed in iron all round
  for (const e of [-1, 1]) { S.box(FLY.x, 0.45, FLY.z + e * (PIT_HALF + 0.3), 2 * R + 2.6, 0.9, 0.6, IRL[0], IRL[1]); S.box(FLY.x + e * (R + 1), 0.45, FLY.z, 0.6, 0.9, 2 * PIT_HALF, IRL[0], IRL[1]); }
  // the steam pipe: out of the cylinder's foot on its south side and up to its mouth
  S.rod([CYL.x, STEAM_AT[1] - 2, FLY.z + CYL.r - 0.2], [STEAM_AT[0], STEAM_AT[1] - 2, STEAM_AT[2]], 0.35, 8, IRL[0], IRL[1], {});
  S.rod([STEAM_AT[0], STEAM_AT[1] - 2.2, STEAM_AT[2]], [STEAM_AT[0], STEAM_AT[1] - 0.1, STEAM_AT[2]], 0.45, 8, IRL[0], IRL[1], { capB: true });
  // the governor: a spindle and two iron balls on arms, whirling, between the wheel and the line
  const gm = makeMesher();
  gm.rod([0, 0, 0], [0, 16, 0], 0.22, 6, STL[0], STL[1], { capB: true });
  for (const e of [-1, 1]) { gm.rod([0, 15, 0], [e * 2.6, 11.4, 0], 0.12, 6, STL[0], STL[1], {}); ball(gm, [e * 2.6, 11.2, 0], 0.75, BR[0], BR[1]); gm.rod([e * 2.6, 11.2, 0], [0, 9, 0], 0.1, 6, STL[0], STL[1], {}); }
  // (ITS OWN STAND: a bed plate bolted to the floor and an iron pedestal GOV_STAND high with a brass band at its
  // head; the governor's spindle rises from the pedestal. It stands GOV_Z south of the wheel's plane, west of the
  // wheel: its balls whirl clear of the belt)
  const gz = FLY.z + GOV_Z;
  const gov = new THREE.Mesh(gm.build(), mat); gov.position.set(GOV_X, GOV_STAND, gz);
  gov.userData = { kind: 'spin', R: 3.4, y0: 0, y1: 16 };
  S.box(GOV_X, 0.2, gz, 4.4, 0.4, 4.4, PA[0], PA[1], { skip: '-y' });
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) S.rod([GOV_X + ex * 1.8, 0.4, gz + ez * 1.8], [GOV_X + ex * 1.8, 0.7, gz + ez * 1.8], 0.18, 6, bright[0], bright[1], { capB: true });
  S.rod([GOV_X, 0.4, gz], [GOV_X, GOV_STAND - 0.3, gz], 1.5, 10, PA[0], PA[1], { r2: 0.9 });
  S.rod([GOV_X, GOV_STAND - 0.3, gz], [GOV_X, GOV_STAND, gz], 1.05, 10, BR[0], BR[1], { capA: true, capB: true });
  // W1: THE BAY'S EAST END, the wall beside the cylinder: lined with painted iron plates in the Drive's own paint
  // (seams and rivet rows by the plates' grain), between iron pilasters a plate's breadth apart, under an iron
  // cornice and over a skirting, with a brass rail at the cylinder's top height
  {
    const x = PLAN.crossX1 - 0.12, z0 = -(LINK_HALF + 1.2), z1 = -WING_N, n = Math.round((z0 - z1) / 6);
    S.box(x, 15.5, (z0 + z1) / 2, 0.24, 29, z0 - z1, PA[0], PA[1], { skip: '-y', paint: [6, 3, 3, 0] });
    for (let k = 0; k <= n; k++) S.box(x - 0.3, 15, z0 + (z1 - z0) * k / n, 0.6, 30, 0.9, IRL[0], IRL[1], { skip: '-y' });
    S.box(x - 0.35, 29.4, (z0 + z1) / 2, 0.7, 1.2, z0 - z1, IRL[0], IRL[1]);
    S.box(x - 0.3, 1.0, (z0 + z1) / 2, 0.6, 2.0, z0 - z1, IRL[0], IRL[1], { skip: '-y' });
    S.rod([x - 0.35, CYL.top, z0], [x - 0.35, CYL.top, z1], 0.18, 6, BR[0], BR[1], {});
  }
  scene.add(wheel, beam, crankRod, pistonRod, gov);
  const up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  const link = (mesh, from, to) => { d.subVectors(to, from); const len = d.length(); mesh.position.copy(from); mesh.scale.set(1, len, 1); mesh.quaternion.setFromUnitVectors(up, d.divideScalar(len)); };
  W.drivePhase = phase; W.drivePaint = { PA, PAL, bright };
  W.updates.push((dt, time) => {
    const ang = ((time * shared.uTempo.value + phase) / FLY.turn) * Math.PI * 2, rock = -0.157 * Math.sin(ang);
    wheel.rotation.z = ang; beam.rotation.z = rock; gov.rotation.y = ang * 5;
    link(crankRod, a.set(FLY.x + 4 * Math.cos(ang), FLY.y + 4 * Math.sin(ang), FLY.z + 1.6), b.set(FLY.x - 15 * Math.cos(rock), BEAM_Y - 15 * Math.sin(rock), FLY.z + 1.6));
    link(pistonRod, a.set(CYL.x, CYL.top, FLY.z), b.set(FLY.x + 15 * Math.cos(rock), BEAM_Y + 15 * Math.sin(rock), FLY.z));
  });
}
// THE BELT: ONE broad flat leather belt drives the house from the flywheel's rim. It lies on the rim's tread (BELT_W
// broad on a tread of two metres) round the wheel's east side and through the pit; from the wheel's top and from its
// west side its two spans run west and up, in the wheel's own plane, to a GUIDE HEAD hung under the bay's roof edge at
// BELT_X (2.5 m east of the bridges' west end, between the vault's ribs and clear of the line shaft's bevel wheels):
// there each span turns over its own guide pulley (GUIDE_R; the upper span at BELT_TURN[0], the lower at BELT_TURN[1])
// into the plane across the hall and climbs south under the vault to the DRUM on the line shaft under the Store's
// ridge (LINE_R), which it wraps on its far side. Between wheel, guides and drum the flat belt turns on itself (a
// quarter turn and less), as a belt between crossed shafts does. It runs at the rim's own speed on the world's
// clock by the wheel's own dealt phase; the guide pulleys and the drum turn with it. Plain mechanics; no rope.
const BELT_W = 1.5, BELT_X = RISE0 + 15 + 2.5, BELT_TURN = [28, 24], GUIDE_R = 1.2, LINE_R = 1.8, LINE_Y = 45, BELT_SEAM = 4;
function beltLoop() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), C = V(FLY.x, FLY.y, FLY.z), R = FLY.R + 0.06, pts = [];
  // a tangent from the place K to a round of radius r about c, in the plane with the axes ex, ey (sign: which of the two)
  const tangent = (K, c, r, ex, ey, sign) => {
    const d = c.clone().sub(K), dx = d.dot(ex), dy = d.dot(ey), len = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + sign * Math.asin(r / len), L = Math.sqrt(len * len - r * r);
    return K.clone().addScaledVector(ex, L * Math.cos(a)).addScaledVector(ey, L * Math.sin(a));
  };
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1), K1 = V(BELT_X, BELT_TURN[0], FLY.z), K2 = V(BELT_X, BELT_TURN[1], FLY.z), Lc = V(BELT_X, LINE_Y, 0);
  const T1 = tangent(K1, C, R, X, Y, 1), T2 = tangent(K2, C, R, X, Y, -1), LT = tangent(K1, Lc, LINE_R, Z, Y, 1), LB = tangent(K2, Lc, LINE_R, Z, Y, -1);
  // a guide pulley in the corner at K between the span from P and the span to Q: its centre, axis, and the arc's ends
  const guide = (P, K, Q, like) => {
    const a = P.clone().sub(K).normalize(), v = Q.clone().sub(K).normalize(), th = Math.acos(clamp(a.dot(v), -1, 1)), t = GUIDE_R / Math.tan(th / 2);
    const O = K.clone().addScaledVector(a.clone().add(v).normalize(), GUIDE_R / Math.sin(th / 2)), A = K.clone().addScaledVector(a, t), B = K.clone().addScaledVector(v, t);
    const n = a.clone().cross(v).normalize(); if (n.dot(like) < 0) n.negate();
    return { O, A, B, n, turn: Math.PI - th, u: a.clone().negate() };
  };
  const G1 = guide(T1, K1, LT, Z), bL = X.clone().multiplyScalar(G1.n.dot(X) < 0 ? -1 : 1), G2 = guide(LB, K2, T2, bL);
  const put = (p, b) => pts.push({ p: p.clone(), b: b.clone().normalize() });
  const span = (P, Q, b0, b1, n) => { for (let i = 1; i < n; i++) { const f = i / n; put(P.clone().lerp(Q, f), b0.clone().lerp(b1, f)); } };
  const arc = (O, A, axis, turn, b, n) => { const r = A.clone().sub(O); for (let i = 0; i <= n; i++) put(O.clone().add(r.clone().applyAxisAngle(axis, turn * i / n)), b); };
  const spin = (g) => g.n.clone().multiplyScalar(Math.sign(g.n.clone().cross(g.A.clone().sub(g.O)).dot(g.u)) || 1);
  // the wheel's far side, from the lower span's meeting (west, low) down through the pit and up the east side to the top
  const a2 = Math.atan2(T2.y - C.y, T2.x - C.x), a1 = Math.atan2(T1.y - C.y, T1.x - C.x), wrap = ((a1 - a2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  arc(C, T2, Z, wrap, Z, 36);
  span(T1, G1.A, Z, G1.n, 7); arc(G1.O, G1.A, spin(G1), G1.turn, G1.n, 5);
  span(G1.B, LT, G1.n, bL, 9);
  const lt = Math.atan2(LT.y - Lc.y, LT.z - Lc.z), lb = Math.atan2(LB.y - Lc.y, LB.z - Lc.z), over = ((lt - lb) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  arc(Lc, LT, X, over, bL, 10);
  span(LB, G2.A, bL, G2.n, 9); arc(G2.O, G2.A, spin(G2), G2.turn, G2.n, 5);
  span(G2.B, T2, G2.n, Z, 7);
  return { pts, G1, G2, Lc, spin, bL };
}
// the belt's leather: its laps (a joint every BELT_SEAM metres, a hide's length) and the stitch rows along its edges
// travel with it; they go to their mean tone before they are finer than the picture's grain
function makeBeltMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vUv;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      void main(){
        vec3 N = normalize(vN); N = gl_FrontFacing ? N : -N;
        // metres along the belt, less the way the rim has gone by the wheel's own clock
        float s = vUv.x - ${f1(FLY.R)}*6.2831853*(uTime*uTempo + uWheel)/${f1(FLY.turn)};
        float k = fract(s/${f1(BELT_SEAM)}), g = fwidth(vUv.x)/${f1(BELT_SEAM)};
        float lap = smoothstep(0., .015, k)*(1. - smoothstep(.1, .115, k));
        lap = mix(lap, .1, smoothstep(.04, .12, g));
        float edge = smoothstep(.7, .78, abs(vUv.y))*(1. - smoothstep(.9, .96, abs(vUv.y)));
        float stitch = mix(step(.5, fract(s/.6)), .5, smoothstep(.1, .3, fwidth(vUv.x)/.6))*edge;
        vec3 alb = vec3(.2, .1, .045)*(1. - .45*lap)*(.9 + .2*hash11(floor(s/${f1(BELT_SEAM)}))) + vec3(.3, .25, .16)*stitch;
        gl_FragColor = vec4(hazed(shadeDull(alb, N, vW, .25), vW), 1.);
      }`,
  });
}
function buildBelt(W) {
  const { scene, shared } = W, S = W.storeIron, { pts, G1, G2, Lc, spin, bL } = beltLoop(), n = pts.length;
  const P = [], N = [], U = [], I = [], t = new THREE.Vector3(), nr = new THREE.Vector3();
  let along = 0;
  for (let i = 0; i <= n; i++) {
    const c = pts[i % n], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    if (i > 0) along += c.p.distanceTo(a.p);
    t.subVectors(b.p, a.p).normalize(); nr.crossVectors(t, c.b).normalize();
    for (const e of [-1, 1]) { P.push(c.p.x + c.b.x * e * BELT_W / 2, c.p.y + c.b.y * e * BELT_W / 2, c.p.z + c.b.z * e * BELT_W / 2); N.push(nr.x, nr.y, nr.z); U.push(along, e); }
    if (i < n) I.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); g.setIndex(I); g.computeBoundingSphere(); g.computeBoundingBox();
  const belt = new THREE.Mesh(g, makeBeltMaterial(shared)); belt.userData = { kind: 'still' };
  scene.add(belt);
  // a pulley: a rim with a bright tread, four flat spokes and a hub, in the Drive's paint; its axis is its own z
  const { PA, PAL, bright } = W.drivePaint, mat = makePlainMaterial(shared);
  const pulley = (r, half) => {
    const m = makeMesher(), K = 20;
    for (let i = 0; i < K; i++) {
      const a0 = (i / K) * Math.PI * 2, a1 = ((i + 1) / K) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), ri = r - 0.28;
      m.quad([c0 * r, s0 * r, half], [c0 * r, s0 * r, -half], [c1 * r, s1 * r, -half], [c1 * r, s1 * r, half], bright[0], bright[1], undefined, [[c0, s0, 0], [c0, s0, 0], [c1, s1, 0], [c1, s1, 0]]);
      m.quad([c0 * ri, s0 * ri, -half], [c0 * ri, s0 * ri, half], [c1 * ri, s1 * ri, half], [c1 * ri, s1 * ri, -half], PA[0], PA[1], undefined, [[-c0, -s0, 0], [-c0, -s0, 0], [-c1, -s1, 0], [-c1, -s1, 0]]);
      for (const e of [-1, 1]) m.quad([c0 * ri, s0 * ri, e * half], [c0 * r, s0 * r, e * half], [c1 * r, s1 * r, e * half], [c1 * ri, s1 * ri, e * half], PAL[0], PAL[1], undefined, [[0, 0, e], [0, 0, e], [0, 0, e], [0, 0, e]]);
    }
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; m.rod([0, 0, 0], [Math.cos(a) * (r - 0.2), Math.sin(a) * (r - 0.2), 0], 0.3, 4, PA[0], PA[1], { flat: true }); }
    m.rod([0, 0, -half - 0.15], [0, 0, half + 0.15], 0.38, 8, PAL[0], PAL[1], { capA: true, capB: true });
    return m.build();
  };
  const zAxis = new THREE.Vector3(0, 0, 1), q0 = new THREE.Quaternion(), qs = new THREE.Quaternion(), half = BELT_W / 2 + 0.12;
  const wheels = [[G1.O, spin(G1), GUIDE_R - 0.06], [G2.O, spin(G2), GUIDE_R - 0.06], [Lc, new THREE.Vector3(1, 0, 0), LINE_R - 0.06]].map(([O, axis, r]) => {
    const m = new THREE.Mesh(pulley(r, half), mat), reach = r + half; m.position.copy(O);
    m.userData = { kind: 'course', lo: [O.x - reach, O.y - reach, O.z - reach], hi: [O.x + reach, O.y + reach, O.z + reach] };
    scene.add(m);
    return { m, base: new THREE.Quaternion().setFromUnitVectors(zAxis, axis), r };
  });
  // THE GUIDE HEAD: the two guide pulleys' axles are carried by iron arms from the bay's roof edge beam overhead
  const edge = [BELT_X, 30, -(PLAN.storeHalf - 0.6)];
  for (const G of [G1, G2]) {
    const ax = spin(G), a = G.O.clone().addScaledVector(ax, -half - 0.5), b = G.O.clone().addScaledVector(ax, half + 0.5);
    S.rod(a.toArray(), b.toArray(), 0.2, 6, STL[0], STL[1], { capA: true, capB: true });
    for (const [q, dx] of [[a, -1], [b, 1]]) S.rod([edge[0] + dx, edge[1], edge[2]], q.toArray(), 0.22, 4, IRL[0], IRL[1], { flat: true });
  }
  S.box(edge[0], edge[1] - 0.1, edge[2], 3.2, 0.5, 0.6, IRL[0], IRL[1]);
  W.updates.push((dt, time) => {
    const turn = ((time * shared.uTempo.value + W.drivePhase) / FLY.turn) * Math.PI * 2 * FLY.R;
    for (const w of wheels) { qs.setFromAxisAngle(zAxis, turn / w.r); w.m.quaternion.copy(w.base).multiply(qs); }
  });
}
// THE STEAM'S LAW. Its mouth is placed from the cylinder: two radii east of its axis and 2.5 m off its south side (the
// side toward the line: from every place of the line the steam then rises beside the cylinder and never behind it),
// 17 m under its top, at the valve chest by its foot: the bay's roof is only 6 m over the cylinder's top, and a
// cluster needs 20 m of rise to live its two turns. A cluster leaves at each stroke (the piston at its top: three
// quarters of a turn after the crank pin passes east, by the flywheel's own dealt phase) and lives two turns, so two
// are in the air at every clock on every detail; detail only thins the puffs of a cluster (five to ten: so many, lying
// over one another, that a cluster reads as one soft plume and not as separate balls).
const STEAM_AT = [CYL.x + 2 * CYL.r, CYL.top - 17, FLY.z + CYL.r + 2.5], STEAM_LIFE = 2 * FLY.turn, STEAM_RISE = 1.15, STEAM_STROKE = 0.75 * FLY.turn;
// the racks' two bridges over the crossing into the Mill, their climb along the drum wall to the wall bed, the line
// shaft under the Store's ridge with its bevel wheels, and the steam
function buildBridges(W) {
  const { scene, shared } = W, S = W.storeIron, D = Math.PI / 180, salt = W.rackSalt.drive, BR = MATTER.brass, pins = [];
  // A BRIDGE: an iron bed (y 29.55 to 30.15) with three toothed steel bars under it side by side (a hand's ranks),
  // each sliding on its own, on trestles (see THE WING'S MOUTH below for where they stand). At every trestle a brass
  // pinion stands under each bar on a cross shaft and turns as its bar slides. Between trestles the same shaft and
  // pinions hang under the bed at the thirds of the span. From its inner end (6 m inside an arch)
  // the bed climbs along the drum wall, on a bracket at every joint, to the wall bed's end.
  // The west pair bring the Store's racks; at the east arch the wall bed's ends come down to a trestle by each jamb.
  const SPAN = 34, PIN_R = 1.5, RACK_Y = 28.45;
  // A BED PASSES CLEAR OF THE MILL'S WEST JAMB (whose inner face stands 13.64 m from the hall's middle line): the
  // bed is BED_W broad and its middle lies BED_IN nearer the hall's middle line than its shafts' middle, so its edge
  // toward the line lies where it always lay; its three bars lie BAR_STEP apart under it, their middle BAR_IN
  // nearer the hall's middle line than the shafts' (the bar nearest the line where it always lay), and their
  // pinions under them.
  // WHAT CARRIES A CROSS SHAFT IS SEEN: at every shaft a CROSS HEAD lies over the bed (HEAD_H deep, from the bed's
  // top), and the two irons in which the shaft's ends turn (a hung shaft's hangers, a trestle's posts) rise past the
  // bed's edges to its ends: the shaft hangs from the head, the head rests on the bed or is itself hung or propped.
  // Every such iron is 0.25 m and more across and has a lit arris up each edge (the part's paint 12).
  const BED_W = 3.4, BED_IN = 0.25, BAR_STEP = 1.15, BAR_IN = 0.15, HEAD_H = 0.35, HEAD_TOP = 30.15 + HEAD_H;
  // (end: the trestle at a bridge's inner end, where the bed turns aside to climb along the drum wall. The climbing
  // bed leaves over the post away from the hall's middle line, so that post stands to the climbing bed's underside,
  // END_POST high, and the cross head runs from the other post into the climbing bed's flank, END_HEAD past the
  // shafts' middle. The post toward the line keeps its height there (the line turns past it at the bed's own
  // height), and a strap END_STRAP broad rises from its head past the bed's edge to the cross head, its face
  // toward the line set a hand's breadth back from the post's.)
  const END_POST = 30.2, END_HEAD = 0.3, END_STRAP = 0.26;
  const trestle = (x, z, ids, end = false) => {
    const yS = RACK_Y - PIN_R + 0.12, s = Math.sign(z), zq = z - s * BAR_IN;
    for (const e of [-1, 1]) {
      const strap = end && e === -s, top = !ids || strap ? 29.55 : end ? END_POST : HEAD_TOP;
      S.rod([x, 0, z + e * 3.4], [x, yS - 1.2, z + e * 2.45], 0.3, 4, IRL[0], IRL[1], { flat: true, arris: !!ids });
      S.box(x, (yS - 1.2 + top) / 2, z + e * 2.45, 0.5, top - yS + 1.2, 0.3, IRL[0], IRL[1], { arris: !!ids, skip: strap ? '+y' : '' });
      if (strap) S.box(x, (29.55 + HEAD_TOP) / 2, z + e * (2.3 + END_STRAP / 2), 0.5, HEAD_TOP - 29.55, END_STRAP, IRL[0], IRL[1], { arris: true, skip: '-y' });
      S.box(x, 0.2, z + e * 3.4, 1.4, 0.4, 1.0, IR[0], IR[1], ids ? { skip: '-y' } : {});
    }
    // (two legs and one tie: a light trestle, so that what stands behind a bridge is seen through it; a bridge's
    // tie ends inside its two legs)
    { const y = 14, w = 3.4 - 0.95 * y / (yS - 1.2); S.box(x, y, z, 0.3, 0.4, 2 * w, IRL[0], IRL[1], ids ? { skip: '-z+z' } : {}); }
    // (a bridge's trestle: its two posts stand to the cross head over the bed; the shaft's ends lie inside their brass)
    if (ids) { const out = end ? END_HEAD : 2.3; S.box(x, 30.15 + HEAD_H / 2, z + s * (out - 2.3) / 2, 0.5, HEAD_H, out + 2.3, IRL[0], IRL[1], { skip: '-y-z+z' }); }
    S.rod([x, yS, z - 2.6], [x, yS, z + 2.6], 0.2, 6, STL[0], STL[1], ids ? {} : { capA: true, capB: true });
    for (const e of [-1, 1]) S.rod([x, yS, z + e * 2.3], [x, yS, z + e * 2.62], 0.42, 8, BR[0], BR[1], { capA: true, capB: true });
    if (ids) for (const e of [-1, 0, 1]) pins.push({ x, y: yS, z: zq + e * BAR_STEP, col: [1 / (PIN_R * 0.6283), 0, NO_WAVE, 0], seed: ids + e + salt });
  };
  // between two trestles the bars are borne twice more, at the thirds of the span: the same cross shaft with its three
  // brass pinions, hung by a hanger at either end from the cross head over the bed (so a bar meets a turning pinion
  // every third of a span). outer: how far the head reaches on the side away from the hall's middle line
  const hung = (x, z, ids, outer = 2.325) => {
    const yS = RACK_Y - PIN_R + 0.12, s = Math.sign(z), zq = z - s * BAR_IN;
    for (const e of [-1, 1]) S.box(x, (yS - 0.5 + HEAD_TOP) / 2, z + e * 2.45, 0.4, HEAD_TOP - yS + 0.5, 0.25, IRL[0], IRL[1], { arris: true });
    S.box(x, 30.15 + HEAD_H / 2, z + s * (outer - 2.325) / 2, 0.4, HEAD_H, outer + 2.325, IRL[0], IRL[1], { skip: '-y-z+z' });
    // UNDER A LINK'S VAULT what carries a hung shaft is seen: from the vault's hoop nearest it a pair of stout iron
    // rods comes down to the cross head over the shaft (the hoops stand LINK_STEP apart from half a bay inside
    // the link's west end; the vault springs LINK_SPRING up, a round of LINK_HALF)
    if (x > PLAN.crossX1 + 0.1 && x < PLAN.archW) {
      const hoop = PLAN.crossX1 + LINK_STEP / 2 + LINK_STEP * Math.round((x - PLAN.crossX1 - LINK_STEP / 2) / LINK_STEP);
      for (const e of [-1, 1]) { const zv = z + e * 2.3; S.rod([x, 30.15, z + e * 1.9], [hoop, LINK_SPRING + Math.sqrt(LINK_HALF * LINK_HALF - zv * zv) - 0.3, zv], LINK_ROD, 4, IRL[0], IRL[1], { flat: true, arris: true }); }
    }
    S.rod([x, yS, z - 2.6], [x, yS, z + 2.6], 0.2, 6, STL[0], STL[1], {});
    for (const e of [-1, 1]) S.rod([x, yS, z + e * 2.3], [x, yS, z + e * 2.62], 0.42, 8, BR[0], BR[1], { capA: true, capB: true });
    for (const e of [-1, 0, 1]) pins.push({ x, y: yS, z: zq + e * BAR_STEP, col: [1 / (PIN_R * 0.6283), 0, NO_WAVE, 0], seed: ids + e + salt });
  };
  // THE WING'S MOUTH: a bridge crosses the engine wing's mouth in ONE CLEAR SPAN, so that no trestle stands between the
  // line and the flywheel. The mouth is the wing's own: from its west wall to its east wall (PLAN.storeX1 to
  // PLAN.crossX1, the crossing's two ends); no trestle stands between them (the south bridge the same, for the
  // pair's sake). Over the mouth the bed HANGS FROM THE VAULT: at its start and at the thirds of the clear span a
  // pair of iron rods comes down from the vault's two purlins overhead to the bed's edges, and the cross shaft with
  // its pinions hangs under the bed there as between any two trestles. At the east wall itself the bed is borne by
  // the arch's pier (the cross head over the bed runs on into the pier, and one iron strut off the pier props it
  // at the outer hanger, clear of the bars and their pinions; the cross shaft hung under the bed). From
  // there on its trestles stand at an even step of about SPAN to its end; a bridge that crosses no mouth has them
  // at an even step from end to end
  const MOUTH_E = PLAN.crossX1;
  const stations = (xa, xb) => {
    const from = xa < MOUTH_E && xb > MOUTH_E ? MOUTH_E : xa, n = Math.max(1, Math.round((xb - from) / SPAN)), st = [];
    for (let k = 0; k <= n; k++) st.push(from + (xb - from) * k / n);
    return st;
  };
  const onPier = (x, z, ids) => {
    const s = Math.sign(z), pier = s * (LINK_HALF + 0.3);
    hung(x, z, ids, Math.abs(pier - z));
    S.rod([x, 25, pier], [x, 30.15 + HEAD_H / 2, z + s * 2.45], 0.26, 4, IRL[0], IRL[1], { flat: true, arris: true });
  };
  // (a vault hanger: an iron bar HANG_ROD in half breadth from a purlin of the vault down to the cross head)
  const HANG_ROD = 0.18;
  const hanger = (x, z) => {
    const s = Math.sign(z);
    for (const i of [4, 5]) { const [pz, py] = vaultAt((i / 6) * Math.PI / 2, s); S.rod([x, 30.15, z + (i === 4 ? 1 : -1) * s * 1.8], [x, py - 0.1, pz], HANG_ROD, 4, IRL[0], IRL[1], { flat: true, arris: true }); }
  };
  const bridge = (xa, xb, xIn, s, id, bEnd) => {
    const z = 12 * s, len = xb - xa, mx = (xa + xb) / 2, zb = z - s * BED_IN, zq = z - s * BAR_IN;
    if (len > 0.1) {
      S.box(mx, 29.85, zb, len, 0.6, BED_W, IR[0], IR[1], { paint: [6, 4.25, 3.9, 0] });
      // a bar: a solid steel back with its teeth below (a tooth and its gap half a metre each)
      for (const e of [-1, 0, 1]) {
        S.box(mx, 29.3, zq + e * BAR_STEP, len, 0.5, 0.9, STL[0], STL[1], { skip: '+y-y' });
        S.box(mx, RACK_Y + 0.3, zq + e * BAR_STEP, len, 0.6, 0.8, STL[0], STL[1], { skip: '+y', paint: [1, 1.0, id + e + salt, 1] });
      }
      const st = stations(xa, xb);
      for (let k = 0; k < 3 && st[0] > xa; k++) { const x = xa + (st[0] - xa) * k / 3; hung(x, z, id); hanger(x, z); }
      st.forEach((x, k) => { if (x === MOUTH_E && st[0] > xa) onPier(x, z, id); else trestle(x, z, id, x === xIn); if (k + 1 < st.length) for (const f of [1 / 3, 2 / 3]) hung(x + (st[k + 1] - x) * f, z, id); });
    } else trestle(xa, z, 0);
    const r0 = Math.hypot(xIn - PLAN.cx, z), b0 = Math.atan2(z, xIn - PLAN.cx) / D, steps = 6;
    let prev = [xIn, 29.5, z];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, b = (b0 + (bEnd - b0) * t) * D, r = r0 + (72 - r0) * t, c = Math.cos(b), sn = Math.sin(b);
      const p = [PLAN.cx + c * r, 29.5 + (40.2 - 29.5) * t, PLAN.cz + sn * r];
      S.rod(prev, p, 0.95, 4, IR[0], IR[1], { flat: true, twist: Math.PI / 4 });
      // its bracket off the drum wall: a strut from the wall 4 m lower, and a tie level with the bed
      if (i < steps) {
        const wall = PLAN.drumR - 0.5, q = [PLAN.cx + c * wall, p[1] - 4, PLAN.cz + sn * wall], q1 = [PLAN.cx + c * wall, p[1] - 0.5, PLAN.cz + sn * wall];
        S.rod(q, [p[0], p[1] - 0.5, p[2]], 0.22, 4, IRL[0], IRL[1], { flat: true, arris: len > 0.1 }); S.rod(q1, [p[0], p[1] - 0.5, p[2]], 0.18, 4, IRL[0], IRL[1], { flat: true, arris: len > 0.1 });
      }
      prev = p;
    }
  };
  const xw = PLAN.colX0 + (PLAN.colN - 1) * PLAN.colStep + 15;
  for (const s of [-1, 1]) {
    bridge(xw, PLAN.archW + 6, PLAN.archW + 6, s, 70 + 10 * s, 154 * s);
    bridge(PLAN.archE - 6, PLAN.archE - 6, PLAN.archE - 6, s, 0, 26 * s);
  }
  // the pinions that stand on a level axis: brass wheels of the wheel's own form, laid over. The bridges' on their
  // cross shafts (axis across the hall); the Mill's wall bays' beside their racks (axis in the wall, toward the centre)
  const geo = wheelStackGeometry({ wheels: 1, R: 0.8, depth: 0.2, pitch: 0.6, thick: 0.5, segs: 3, capped: true, bare: true, foot: 0, y0: 0 });
  const pinMat = makeWheelMaterial(shared, { y0: 0 }), m4 = new THREE.Matrix4(), v = new THREE.Vector3(), yUp = new THREE.Vector3(0, 1, 0), ax = new THREE.Vector3(), q = new THREE.Quaternion();
  const laid = (list, R, thick, axisOf) => {
    const mesh = makeWheelColumn(geo, pinMat, list), sc = new THREE.Vector3(R / 0.8, thick / 0.5, R / 0.8);
    list.forEach((c, i) => { axisOf(c, ax); q.setFromUnitVectors(yUp, ax); mesh.setMatrixAt(i, m4.compose(v.set(c.x, c.y, c.z).addScaledVector(ax, -thick / 2), q, sc)); });
    mesh.geometry.getAttribute('aMeta').array.forEach((_, i, arr) => { if (i % 2 === 1) arr[i] = -1; });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    mesh.userData = { kind: 'instanced', reach: 0.1 };
    scene.add(mesh);
  };
  laid(pins, PIN_R, 0.75, (c, a) => a.set(0, 0, 1));
  laid(W.wallPins, WALL_PIN, 0.6, (c, a) => a.set(-Math.cos(c.deg * D), 0, -Math.sin(c.deg * D)));
  // the line shaft under the Store's ridge, with its bevel wheels turning
  {
    S.rod([PLAN.storeX0 + 1, 45, 0], [298, 45, 0], 0.28, 8, STL[0], STL[1], {});
    for (let x = PLAN.storeX0 + 8.5; x < 298; x += 14) S.rod([x, 45, 0], [x, 47.4, 0], 0.2, 4, IR[0], IR[1], { flat: true });
    const bevel = wheelStackGeometry({ wheels: 1, R: 0.8, depth: 0.2, pitch: 0.6, thick: 0.5, segs: 3, capped: false, bare: true, foot: 0, y0: 0 });
    const wheels = [];
    for (let x = PLAN.storeX0 + 5; x < 298; x += 14) wheels.push({ x, y: 45, z: 0, col: [2.2, x * 0.37, NO_WAVE, 0], seed: 1 });
    const mesh = makeWheelColumn(bevel, makeWheelMaterial(shared, { y0: 0 }), wheels), m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2), sc = new THREE.Vector3(1.9, 1.2, 1.9), v = new THREE.Vector3();
    wheels.forEach((c, i) => mesh.setMatrixAt(i, m4.compose(v.set(c.x - 0.3, c.y, c.z), q, sc)));
    mesh.geometry.getAttribute('aMeta').array.forEach((_, i, arr) => { if (i % 2 === 1) arr[i] = -2; });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    mesh.userData = { kind: 'instanced', reach: 3.1 };
    scene.add(mesh);
  }
}
// the steam: soft white puffs from the pipe by the cylinder, rising before the bay's brick wall and thinning under its
// roof. A MEDIUM, its puffs 17 m and more from the line; each puff is a round dab that turns about
// its own place to face the eye (its place and size are the world's).
function buildSteam(W) {
  const per = clamp(Math.round(10 * W.detail), 5, 10), N = 2 * per, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  const puff = new Float32Array(N * 3), rng = W.RNG.drive;
  // a puff: its cluster (0 or 1: the strokes in turn), its delay after the stroke (a cluster's puffs leave one after
  // another through the first 85 hundredths of the turn, the first the strongest, each with a small dealt offset),
  // its drift to either side: so the puffs lie over one another as ONE plume that swells with every stroke
  for (let i = 0; i < N; i++) { puff[i * 3] = Math.floor(i / per) * FLY.turn + (i % per) * (0.85 * FLY.turn / per) + rng.range(0, 0.3); puff[i * 3 + 1] = rng.range(-1, 1); puff[i * 3 + 2] = rng.range(-1, 1); }
  g.setAttribute('aPuff', new THREE.InstancedBufferAttribute(puff, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...W.shared, uStroke: { value: W.drivePhase - STEAM_STROKE } }, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aPuff;
      uniform float uTime, uTempo, uStroke;
      varying vec2 vQ; varying float vA; varying vec3 vW;
      void main(){
        float age = mod(uTime*uTempo + uStroke - aPuff.x, ${STEAM_LIFE.toFixed(1)});
        vec3 c = vec3(${STEAM_AT.map((v) => v.toFixed(1)).join(', ')}) + vec3(aPuff.y*.09*age + .5*sin(age*.5 + aPuff.z*3.), ${STEAM_RISE.toFixed(2)}*age, aPuff.z*.07*age);
        float size = .9 + 3.4*(1. - exp(-age*.16));
        float late = fract(aPuff.x/${FLY.turn.toFixed(1)});
        vA = smoothstep(0., .9, age)*(1. - smoothstep(${(STEAM_LIFE * 0.4).toFixed(1)}, ${STEAM_LIFE.toFixed(1)}, age))*mix(.5, .26, late);
        vQ = position.xy;
        vec4 mv = viewMatrix*vec4(c, 1.);
        mv.xy += position.xy*size;
        vW = c;
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vA; varying vec3 vW;
      ${LIGHT_GLSL}
      void main(){
        float d = clamp(length(vQ), 0., 1.);
        float a = (1. - d*d)*(1. - d*d)*(1. - d*d)*vA;
        vec3 col = vec3(.86, .89, .94)*(.78 + .22*clamp(vQ.y, -1., 1.)) + uSunCol*.1*sunAt(vW);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.InstancedMesh(g, mat, N);
  mesh.frustumCulled = false;
  // for counts by place: a medium, and its whole course lies within this ball over the pipe's mouth
  const rise = STEAM_RISE * STEAM_LIFE;
  mesh.userData = { kind: 'medium', centre: [STEAM_AT[0], STEAM_AT[1] + rise / 2, STEAM_AT[2]], radius: rise / 2 + 5 };
  W.scene.add(mesh);
}
// ---------------------------------------------------------------- the sunlit air: shafts of sun standing in the halls
// THE LAW: the air of certain rooms of the house is drawn as lit air, each room a level box given by places of the
// house, every box wholly 4 m and more to the south of the line (never laid where the line would enter it):
//  - the Store's south side aisles, between its ranks, as far as the ranks run and as high as their heads;
//  - the Drive's south bay, from the bridge's trestles to the vault's foot;
//  - the Loom hall's south side, from the hung lengths' inner row to the south wall, to the gathering bar's height.
// What is seen in a box is the SUN OF THE PLACE (the part's sunAt, the same law the floor and every face are lit by)
// gathered along the eye's line through the box: so the shafts stand where the glass lets the sun in, slanted as
// the seed's sun stands, cut by the bars' and the columns' shade, and each ends in its own bright patch on the
// floor. A box's air thins to nothing at its sides. A slow drift of the air's dust is written by the world's clock.
// A MEDIUM, a still body; shading by the direction from a thing to the eye (named at the head).
function buildAir(W) {
  const rooms = [], top = PLAN.storeFoot + PLAN.storeWheels * PLAN.storeBand, xr = PLAN.colX0 + (PLAN.colN - 1) * PLAN.colStep;
  const rz = PLAN.rankZ.slice(0, W.ranks);
  for (let i = 0; i + 1 < rz.length; i++) rooms.push([[PLAN.colX0, 0, rz[i] + 1.5], [xr, top, rz[i + 1] - 1.5], 1.3]);
  rooms.push([[PLAN.storeX1 + 2, 0, 12 + 4.5], [PLAN.crossX1 - 2, 24, PLAN.storeHalf - 2], 1]);
  rooms.push([[PLAN.loomX0 + 6, 0, HANG_Z[0] - 3], [BAR_X, BAR_Y, PLAN.loomHalf - 2], 0.14]);
  const P = [], A = [], B = [];
  for (const [lo, hi, k] of rooms) {
    const c = (i, j, l) => [i ? hi[0] : lo[0], j ? hi[1] : lo[1], l ? hi[2] : lo[2]];
    const faces = [[c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)], [c(1, 0, 1), c(1, 0, 0), c(1, 1, 0), c(1, 1, 1)], [c(0, 1, 0), c(0, 1, 1), c(1, 1, 1), c(1, 1, 0)],
      [c(1, 0, 0), c(0, 0, 0), c(0, 1, 0), c(1, 1, 0)], [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)]];
    for (const f of faces) for (const q of [f[0], f[1], f[2], f[0], f[2], f[3]]) { P.push(q[0], q[1], q[2]); A.push(lo[0], lo[1], lo[2]); B.push(hi[0], hi[1], hi[2], k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('aLo', new THREE.BufferAttribute(new Float32Array(A), 3)); g.setAttribute('aHi', new THREE.BufferAttribute(new Float32Array(B), 4));
  g.computeBoundingSphere(); g.computeBoundingBox();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...W.shared }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    vertexShader: /* glsl */`
      attribute vec3 aLo; attribute vec4 aHi;
      varying vec3 vW, vLo; varying vec4 vHi;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vLo = aLo; vHi = aHi; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vLo; varying vec4 vHi;
      ${LIGHT_GLSL}
      void main(){
        vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
        vec3 inv = 1./(abs(rd) + 1e-5)*sign(rd + 1e-6);
        vec3 ta = (vLo - ro)*inv, tb = (vHi.xyz - ro)*inv;
        vec3 t0 = min(ta, tb), t1 = max(ta, tb);
        float tn = max(max(t0.x, t0.y), max(t0.z, 0.)), tf = min(t1.x, min(t1.y, t1.z));
        float chord = max(tf - tn, 0.);
        vec3 sum = vec3(0.);
        for (int i = 0; i < 10; i++) {
          vec3 p = ro + rd*(tn + chord*(float(i) + .5)/10.);
          vec3 e = min(p - vLo, vHi.xyz - p);
          float thin = smoothstep(0., 1.5, e.x)*smoothstep(0., 1.5, e.z)*smoothstep(0., 3., vHi.y - p.y);
          float dust = .82 + .18*sin(p.x*.37 + uTime*.11 + 2.*sin(p.y*.21 - uTime*.05))*sin(p.z*.9 + p.y*.33 + uTime*.07);
          sum += sunAt(p)*thin*dust;
        }
        // lit dust sends most of its light on the sun's own way: the air is brightest looked through toward the sun
        float toSun = max(dot(rd, uSunDir), 0.);
        vec3 col = uSunCol*(sum/10.)*(1. - exp(-chord*.03))*vHi.w*.22*(.3 + 2.*toSun*toSun*toSun);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 4; mesh.userData = { kind: 'still', air: true };
  W.scene.add(mesh);
}
// the lantern's shaft of daylight in the Mill: the lit air under the lantern, a standing round column of pale light
// (the sky's colour and the sun's, the sun's the stronger: the air of the one warm round in the cool room),
// 15 m from the Mill's axis at the lantern and 18 m at the floor (24 m and more from the line at its nearest: the
// line never enters it). A MEDIUM. Its brightness at a place of its skin is the length of the eye's line through the
// column there (long through the middle, nothing at the rim), so it has no edge: shading by the direction to the eye.
function buildShaft(W) {
  const N = 48, P = [], Nn = [], top = PLAN.lanternY, r1 = PLAN.lanternR, r0 = 18;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const A = [PLAN.cx + c0 * r0, 0, PLAN.cz + s0 * r0], B = [PLAN.cx + c1 * r0, 0, PLAN.cz + s1 * r0], C = [PLAN.cx + c1 * r1, top, PLAN.cz + s1 * r1], Dd = [PLAN.cx + c0 * r1, top, PLAN.cz + s0 * r1];
    for (const [q, c, sn] of [[A, c0, s0], [C, c1, s1], [B, c1, s1], [A, c0, s0], [Dd, c0, s0], [C, c1, s1]]) { P.push(q[0], q[1], q[2]); Nn.push(c, 0, sn); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
  g.computeBoundingSphere(); g.computeBoundingBox();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...W.shared }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    vertexShader: /* glsl */`
      varying vec3 vW, vN;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN;
      uniform vec3 uSkyCol, uSunCol; uniform float uTime;
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        float flat_ = max(length(V.xz), .2);
        float chord = 2.*16.5*abs(dot(normalize(vN.xz), V.xz/flat_))/flat_;
        float lit = clamp(chord/40., 0., 1.5);
        float dust = .88 + .12*sin(vW.y*.3 - uTime*.06 + 2.*sin(atan(vN.z, vN.x)*3. + uTime*.04));
        gl_FragColor = vec4((uSkyCol*.4 + uSunCol*.17)*lit*lit*(.2 + .16*vW.y/${top.toFixed(1)})*dust, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 4; mesh.userData = { kind: 'still' };
  W.scene.add(mesh);
}
// ---------------------------------------------------------------- the Cards: chains of pierced cards over square prisms
// THE CHAIN'S LAW (CHAIN_GLSL for its path; its step is the part's chainStep, which the sun's dots read too; chainPoint
// below is the same path on the processor). A chain is a row of cards on a path: a LOOP hung across the hall between
// two prisms (a parabola in the y-z plane), a sheer FALL, or a RUN hung along the hall from roller to roller on its way
// to the loom's head (the same parabola along x, on a rising line). At every step of its own period the whole chain
// moves on by one card; one chain in five is backed four steps in every twelve and run again. After each step a hung
// loop swings a little and comes to rest.
const CARD_PITCH = 1.08, CARD_LONG = 3.0, SWING = 0.45;
// a rail's upper face lies RAIL_DROP under its prisms' axes (a prism is 1.2 m square and turns: its corners sweep 0.85)
const RAIL_DROP = 0.95;
const CHAIN_GLSL = /* glsl */`
// the place s metres along a chain: (across-hall or downward offset, height); a = the loop's parabola (0 for a fall)
vec2 chainAt(float s, float a, float len){
  s = clamp(s, 0., len);
  if (a <= 0.) return vec2(0., -s);
  float h = len*.5, x = s - h, z = x*.8;
  // the place on the parabola whose arc from the lowest point is x: three steps of Newton's rule
  float k = 2.*a;
  z -= (.5*z*sqrt(1. + k*k*z*z) + log(k*z + sqrt(k*k*z*z + 1.))/(2.*k) - x)/sqrt(1. + k*k*z*z);
  z -= (.5*z*sqrt(1. + k*k*z*z) + log(k*z + sqrt(k*k*z*z + 1.))/(2.*k) - x)/sqrt(1. + k*k*z*z);
  z -= (.5*z*sqrt(1. + k*k*z*z) + log(k*z + sqrt(k*k*z*z + 1.))/(2.*k) - x)/sqrt(1. + k*k*z*z);
  return vec2(z, a*z*z);
}
`;
// the same path on the processor (for the bounds and for counts by place): a chain's place s metres along it
function chainPoint(ch, s) {
  s = clamp(s, 0, ch.len);
  if (!(ch.a > 0)) return [ch.x, ch.top - s, ch.z];
  const x = s - ch.len / 2, k = 2 * ch.a; let z = x * 0.8;
  for (let i = 0; i < 3; i++) z -= (0.5 * z * Math.sqrt(1 + k * k * z * z) + Math.asinh(k * z) / (2 * k) - x) / Math.sqrt(1 + k * k * z * z);
  if (ch.kind === 3) return [ch.x + z, ch.low + ch.a * z * z + ch.slope * z, ch.z];
  return [ch.x, ch.low + ch.a * z * z, ch.z + z];
}
const loopLength = (a, half) => { const k = 2 * a; return half * Math.sqrt(1 + k * k * half * half) + Math.asinh(k * half) / k; };
// ONE CARD FORM: a flat of ivory pasteboard 3.0 m by 1.0 m, pierced with round holes in rows (holes only; which
// places are pierced is dealt by a hash of chain and card and stands for nothing), laced to the next by crimson cord.
// (the brightest a card's face is drawn is the part's PASTE: see A CARD STAYS UNDER WHITE in its shader)
// the share of the sun that comes through pasteboard; the grain (metres of card to a pixel) between which a far
// card goes over to its even tone
const CARD_THRU = 0.3, CARD_FAR = [0.25, 0.7];
// AN IVORY CARD'S SHADE SIDE in the Cards' hall and the link: pale pasteboard is matte and takes CARD_SHADE of the hall's fill
// (a share to each of red, green and blue, the red the least: so a loop's under side stands at about half its lit
// side's value, a fall's shade side a little over that, and both cooler). FAR_SUN: the share of the sun a far card's even tone keeps.
const CARD_SHADE = [0.6, 0.65, 0.74], FAR_SUN = 0.07;
// THE PASTEBOARDS. A chain calls one colour of thread and is of one pasteboard: IVORY, or DYED in a colour of the
// seed's own cloth (its ground, its two flower colours, its leaf: the dealt numbers are read, no draw is taken from
// the cloth's stream). A DYE'S TONE, from the cloth's own number: its hue is kept and its value (its brightest
// channel) is set to DYE_DEEP and DYE_FULL of its own value more, so that the deepest ground still stands as a
// full tone on the card and a bright flower stands brighter than it (never pale: the part's PASTE holds a dyed
// card's lit face under its own top); then it is taken DYE_IVORY toward the pasteboard's ivory (dye on pasteboard
// is matte). A PALE colour (ivory, white, silver: its hue weaker than DYE_PALE) has no deep tone: the ivory chains
// are the ones that call it, and the seed's hall has three dyes. A BLACK ground (its value under DYE_BLACK) is
// dyed CHARCOAL, a deep charcoal blue, at that tone's own value: black thread's pasteboard is the deepest of the
// hall and is still told from shade. LACES are crimson; where the pasteboard is itself red (its red over DYE_RED
// times its green and its blue) they are ivory, so the lace reads.
const IVORY = [0.807, 0.738, 0.565], DYE_DEEP = 0.38, DYE_FULL = 0.45, DYE_IVORY = 0.1, DYE_PALE = 0.35, DYE_BLACK = 0.03, DYE_RED = 2.5, CHARCOAL = '#40557a';
function dyeOf(hex) {
  const c = lin(hex), v = Math.max(c[0], c[1], c[2]), black = v < DYE_BLACK;
  if (!black && (v - Math.min(c[0], c[1], c[2])) / v < DYE_PALE) return null;
  const tone = (black ? lin(CHARCOAL) : c.map((x) => x * (DYE_DEEP + DYE_FULL * v) / v)).map((x, i) => lerp(x, IVORY[i], DYE_IVORY));
  return { tone, dyed: 1, ivoryLace: tone[0] > DYE_RED * Math.max(tone[1], tone[2]) ? 1 : 0 };
}
const PASTE_IVORY = { tone: IVORY, dyed: 0, ivoryLace: 0 };
// WHICH CHAIN HAS WHICH PASTEBOARD. THE DYE'S STREAMS (dy; they deal this and nothing else): dy.hall deals the
// hall's order and the curtains' leads; each curtain's loops (dy.curtains), the walls' falls (dy.walls) and the
// link's falls (dy.link) are dealt each by a stream of its own, so the count of draws one of them takes moves no
// other's deal. THE HALL'S ORDER: the seed's dyes in a dealt order, each called less than the one before it
// (DYE_SHARE: unlike shares). EACH CURTAIN IS LED BY ONE DYE: the high curtain by the hall's first; its two
// neighbours by two others, in a dealt order; the first curtain by the dye that is left (where the seed has three
// dyes, by the fourth curtain's, which stands farthest from it): so no curtain is led by its neighbour's colour.
// A CURTAIN'S LOOPS: IVORY_LOW of a low curtain's loops are ivory, IVORY_HIGH of the high curtain's, and a low
// curtain gives up dyed loops to ivory until the high curtain has more dyed loops than it has (the line climbs
// through the high curtain: so on every seed); the curtain's loops take their pasteboards in a dealt order. THE
// FIRST AND THE SECOND CURTAIN (the first OWN_CURTAINS) HANG IN THEIR OWN DYE AND IVORY: every dyed loop of theirs
// is of the curtain's lead and no call is taken for it, so no two unlike dyes hang loop beside loop in these two,
// and the ivory loops hang between. IN THE THIRD AND THE FOURTH CURTAIN DYE_LEAD of the dyed loops are of the
// curtain's lead, the others each the hall's call. A CURTAIN'S TWO SHEER FALLS, the tall faces east of it, are of
// its lead.
// THE SHEER FALLS ALONG THE WALLS: IVORY_FALLS of them are dealt ivory, the others each the hall's call, in a dealt
// order (east of the second curtain some of them then change pasteboards: see EAST OF THE SECOND CURTAIN).
// THE LINK'S FALLS ARE LED BY IVORY: so many of them are ivory as bring the ivory chains of the whole hall (every
// chain dealt here: the curtains' loops and falls, the walls' falls, the link's) to HALL_IVORY of their number, and
// never fewer than IVORY_FALLS of the link's; the others take the hall's dyes one after another, beginning with
// the dye the hall calls least, so no dye has as many of the link's falls as ivory has. EACH HAND of the link has
// half of the ivory falls (the south hand the odd one) and its dyed falls are the next of that turn of dyes, no
// two of them alike. A hand's first fall, the one next the Mill's arch, is ivory; the four east of it hang in a
// dealt order of their own, and the south hand's four are then turned on in their round, a place at a time, to
// where the fewest falls hang alike across the link (the first such turn). So the two first falls hang alike,
// both ivory, on every seed; of the four east of them a pair hangs alike only where every turn leaves one.
// Three chains in eight of the hall are ivory, to within half a chain.
// EAST OF THE SECOND CURTAIN the hall's two hands hang unlike. The third and the fourth curtain's two sheer falls are
// no pair: the north one is of the curtain's lead, the south one, which hangs before the south wall's windows, is
// IVORY. It changes pasteboards with a sheer fall along the walls east of the second curtain (those from eastFrom
// on; they are hung four to a bay of forty metres, the north hand's two and then the south hand's two, the first
// bay west of the first curtain): with the first ivory one of the south hand in the curtain's own bay, else of the
// south hand west to east, else of the north hand; that fall is then of the curtain's lead. By this change the
// hall keeps its count of ivory chains and of each dye's, and the north hand hangs as dealt wherever the south has
// an ivory fall to give. Where no ivory fall is left there the fourth curtain's falls stay a pair and
// the third's south fall is of the fourth curtain's lead. EACH BAY EAST OF THE SECOND CURTAIN'S LOOPS IS LED BY ITS
// OWN CURTAIN'S DYE (a bay: a curtain's loops, its two sheer falls and the four wall falls east of them): while
// another dye has as many of the bay's chains as the curtain's lead has, a wall fall of the bay that is of that
// dye takes the lead (the hall's dyes in their order, the bay's four falls in theirs); the count of ivory chains
// stands, a dye's count changes by that fall. So no bay there is led by the colour that leads the bay west of it.
const DYE_SHARE = { 3: [0.5, 0.3, 0.2], 4: [0.4, 0.3, 0.2, 0.1] }, IVORY_LOW = 0.5, IVORY_HIGH = 0.125, IVORY_FALLS = 0.375, HALL_IVORY = 0.375, DYE_LEAD = 0.6, HIGH_CURTAIN = 2, OWN_CURTAINS = 2;
function dealPaste(dy, cloth, loops, wallN, linkN, eastFrom) {
  const dyes = cloth.map(dyeOf).filter(Boolean), nd = dyes.length, share = DYE_SHARE[nd];
  const order = dy.hall.shuffle(dyes.slice()), next = dy.hall.shuffle(order.slice(1));
  // the hall's call, drawn from the stream of the thing that hangs it
  const call = (rng) => { let r = rng(), k = 0; while (k < nd - 1 && (r -= share[k]) >= 0) k++; return order[k]; };
  const lead = [next[2] || next[1], next[0], order[0], next[1]];
  const ivoryOf = (n, c) => Math.round(n * (c === HIGH_CURTAIN ? IVORY_HIGH : IVORY_LOW));
  const highDyed = loops[HIGH_CURTAIN] - ivoryOf(loops[HIGH_CURTAIN], HIGH_CURTAIN);
  // n chains in an order dealt by rng: so many ivory, led of them of the dye first, the others each the hall's call
  const mixed = (rng, n, ivory, led, first) => {
    const list = [];
    for (let i = 0; i < n; i++) list.push(i < ivory ? PASTE_IVORY : i < ivory + led ? first : call(rng));
    return rng.shuffle(list);
  };
  const curtains = loops.map((n, c) => {
    let ivory = ivoryOf(n, c);
    if (c !== HIGH_CURTAIN) while (n - ivory >= highDyed) ivory++;
    const dyed = n - ivory;
    return { loops: mixed(dy.curtains[c], n, ivory, c < OWN_CURTAINS ? dyed : Math.round(dyed * DYE_LEAD), lead[c]), falls: [lead[c], lead[c]] };
  });
  const wallIvory = Math.round(wallN * IVORY_FALLS), wall = mixed(dy.walls, wallN, wallIvory, 0);
  const bayOf = (i) => Math.floor(i / 4) - 1, ivoryEast = (c, hand) => { for (let i = eastFrom; i < wallN; i++) if (!wall[i].dyed && (i % 4 < 2 ? 0 : 1) === hand && (c < 0 || bayOf(i) === c)) return i; return -1; };
  for (let c = HIGH_CURTAIN; c < curtains.length; c++) {
    let from = ivoryEast(c, 1); if (from < 0) from = ivoryEast(-1, 1); if (from < 0) from = ivoryEast(-1, 0);
    if (from >= 0) { wall[from] = lead[c]; curtains[c].falls[1] = PASTE_IVORY; } else if (c === HIGH_CURTAIN) curtains[c].falls[1] = lead[c + 1];
  }
  const inBay = (c, pb) => curtains[c].loops.concat(curtains[c].falls, wall.slice(4 * (c + 1), 4 * (c + 2))).filter((x) => x === pb).length;
  for (let c = bayOf(eastFrom); c < curtains.length; c++) for (const d of order) if (d !== lead[c]) for (let i = 4 * (c + 1); i < 4 * (c + 2) && inBay(c, d) >= inBay(c, lead[c]); i++) if (wall[i] === d) wall[i] = lead[c];
  const hallN = loops.reduce((a, n) => a + n + 2, 0) + wallN + linkN, hallIvory = curtains.reduce((a, c) => a + c.loops.filter((pb) => !pb.dyed).length, 0) + wallIvory;
  const linkIvory = clamp(Math.round(hallN * HALL_IVORY) - hallIvory, Math.ceil(linkN * IVORY_FALLS), linkN - nd);
  const half = linkN / 2, hands = [Math.floor(linkIvory / 2), Math.ceil(linkIvory / 2)].map((ivory, h) => {
    const hand = [];
    for (let i = 1; i < half; i++) hand.push(i < ivory ? PASTE_IVORY : order[nd - 1 - ((h * (half - Math.floor(linkIvory / 2)) + i - ivory) % nd)]);
    return [PASTE_IVORY].concat(dy.link.shuffle(hand));
  });
  const alike = (k) => hands[0].reduce((a, pb, i) => a + (i > 0 && pb === hands[1][1 + ((i - 1 + k) % (half - 1))] ? 1 : 0), 0);
  let turn = 0; for (let k = 1; k < half - 1; k++) if (alike(k) < alike(turn)) turn = k;
  return { curtains, wall, link: hands[0].concat([PASTE_IVORY], hands[1].slice(1 + turn), hands[1].slice(1, 1 + turn)) };
}
function makeCardMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aA, aB, aDye; attribute vec3 aC;
      varying vec3 vW, vN; varying vec2 vUv; varying vec2 vId; varying vec4 vDye;
      ${LIGHT_GLSL}
      ${CHAIN_GLSL}
      void main(){
        vec3 st = chainStep(uTime*uTempo, aB.z, aB.w, aC.z);
        float s = (aC.x + st.x + position.y)*${CARD_PITCH.toFixed(2)};
        vec2 pt = chainAt(s, aB.x, aB.y), p2 = chainAt(s + .05, aB.x, aB.y);
        vec2 tg = p2 - pt; tg = length(tg) > 1e-5 ? normalize(tg) : vec2(0., -1.);
        float u = clamp(s/aB.y, 0., 1.);
        float swing = ${SWING.toFixed(2)}*exp(-st.z*1.8)*sin(st.z*5.)*4.*u*(1. - u);
        float lx = position.x*${CARD_LONG.toFixed(1)};
        vec3 w, tx, ty;
        if (aA.w < .5) { w = vec3(aA.x + lx + swing, aA.y + pt.y, aA.z + pt.x); tx = vec3(1., 0., 0.); ty = vec3(0., tg.y, tg.x); }
        else if (aA.w < 1.5) { w = vec3(aA.x + lx, aA.y + pt.y, aA.z + swing); tx = vec3(1., 0., 0.); ty = vec3(0., -1., 0.); }
        else if (aA.w < 2.5) { w = vec3(aA.x + swing, aA.y + pt.y, aA.z + lx); tx = vec3(0., 0., 1.); ty = vec3(0., -1., 0.); }
        else {
          // a run along the hall: the loop's span lies along x on a line that rises by (aA.w - 3) a metre
          float rise = aA.w - 3.;
          w = vec3(aA.x + pt.x, aA.y + pt.y + rise*pt.x, aA.z + lx); tx = vec3(0., 0., 1.); ty = normalize(vec3(tg.x, tg.y + rise*tg.x, 0.));
        }
        vW = w; vN = normalize(cross(tx, ty));
        vUv = vec2(lx, position.y*${CARD_PITCH.toFixed(2)}); vId = vec2(aC.x - st.y, aC.y); vDye = aDye;
        gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vUv; varying vec2 vId; varying vec4 vDye;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${PASTE_GLSL}
      void main(){
        // the picture's grain on the card, in metres: holes finer than it are not cut but go to the card's mean tone
        float grain = max(fwidth(vUv.x), fwidth(vUv.y));
        vec3 N = normalize(vN); N = gl_FrontFacing ? N : -N;
        float id = floor(vId.x + .5), cs = floor(vId.y*8. + .5)/8.;
        float cord = 1. - smoothstep(.06, .1, abs(abs(vUv.x) - 1.25));
        if (vUv.y > 1. && cord < .5) discard;
        vec2 g = vec2(vUv.x + 1.5, vUv.y)/.25, cell = floor(g), cf = fract(g) - .5;
        float inField = step(.5, cell.x)*step(cell.x, 10.5)*step(vUv.y, 1.);
        float pierced = step(.5, hash21(cell + vec2(id*7.13, cs*3.7)))*inField;
        float hole = pierced*(1. - smoothstep(.26, .32, length(cf)));
        // THE HOLES BY THE PICTURE'S GRAIN (metres of card under a pixel). Near (a hole five grains across and more)
        // a hole is cut. Farther it is not cut but stands as a ROUND dark mark of its own size, its rim softened by
        // the grain (never a dark square). Before a row of holes is two and a half grains apart the marks go to
        // their mean: the card is then one even pale tone (the same tone the marks average to, so no card's tone
        // changes as it goes over).
        float fine = smoothstep(.022, .04, grain), even = smoothstep(.05, .1, grain);
        if (hole > .5 && fine < .5) discard;
        float soft = max(grain/.25, .02), mark = pierced*(1. - smoothstep(.36 - soft, .36 + soft, length(cf)));
        // (each card is its own pasteboard, paler or deeper than the next, by its chain's number and its own
        // place in the chain: so a chain's step is seen as far as a card is, when every card takes the next one's place)
        // THE CHAIN'S PASTEBOARD (aDye: its tone; its fourth number 0 ivory, 1 dyed, 3 dyed with ivory laces)
        float dyed = step(.5, vDye.w), ivoryLace = step(2.5, vDye.w), pv = max(vDye.r, max(vDye.g, vDye.b));
        vec3 alb = vDye.rgb*(.8 + .34*hash11(id*1.31 + cs));
        // (where a hole is not cut its place stands as a dark mark, 0.78 of the card's tone taken off there, so that
        // a card reads as a punched card and its chain's step is seen from as far as its holes' rows are told
        // apart; where the marks have gone to their mean the whole card stands 0.16 darker)
        alb *= 1. - mix(.78*mark, .16, even)*fine;
        // (a card's own edge: the pasteboard's cut rim stands a little darker all round it, as far as it can be told)
        alb *= 1. - .22*(1. - smoothstep(0., .045 + grain, min(min(vUv.y, 1. - vUv.y), 1.5 - abs(vUv.x))))*(1. - even)*step(vUv.y, 1.);
        // (the card as the sun comes through it: its own colour with its marks and rim. West of the Cards' west
        // wall a dyed card's is brought to the ivory's value, its hue kept, and less and less so over the 8 m east
        // of that wall: see BEFORE THE LINK'S GLASS)
        float glassed = dyed*(1. - smoothstep(${f1(PLAN.cardX0)}, ${f1(PLAN.cardX0 + 8)}, vW.x));
        vec3 thru = alb*mix(1., ${f1(Math.max(...IVORY))}/max(pv, .02), glassed);
        float stitch = cord*step(abs(vUv.y - .5), .5)*(step(vUv.y, .09) + step(.91, vUv.y));
        vec3 lace = mix(vec3(.6, .03, .05), vec3(${IVORY.join(', ')}), ivoryLace);
        alb = mix(alb, lace, max(stitch, cord*step(1., vUv.y))); thru = mix(thru, lace, max(stitch, cord*step(1., vUv.y)));
        vec3 col = shadeDull(alb, N, vW, .15);
        // THE SHADE SIDE (the Cards' hall and the link, west of the Loom hall's west wall): where the sun does not
        // strike it, ivory pasteboard keeps CARD_SHADE of the hall's fill, so a pale card's shade side stands well
        // under its lit side, and cooler. A dyed pasteboard is deep of itself and takes the hall's fill whole (its
        // shade side is a deep tone, never a dark shape). Under the Loom hall's ridge of glass the runs to the
        // loom's head hang in the sky's whole light.
        float west = 1. - smoothstep(${f1(PLAN.loomX0 - 4)}, ${f1(PLAN.loomX0 + 4)}, vW.x);
        vec3 keep = mix(vec3(1.), vec3(${CARD_SHADE.join(', ')}), west*(1. - dyed)*(1. - clamp(gSun.g*max(dot(N, uSunDir), 0.)*2., 0., 1.)));
        col -= alb*fillAt(N, vW)*(1. - keep);
        // the morning sun on pasteboard is warm
        col *= 1. + vec3(.07, .01, -.09)*clamp(gSun.g*.4, 0., 1.)*max(dot(N, uSunDir), 0.);
        // PASTEBOARD LETS A SHARE OF THE SUN THROUGH: the face turned from the sun glows warm where the sun strikes
        // the card's other face (so a loop seen from under and a fall seen from its shaded side stand as lit ivory
        // with their holes dark or bright in them, never as a dark shape)
        // BEFORE THE LINK'S GLASS (the falls west of the Cards' west wall) as much of the sun comes through a dyed
        // pasteboard as through an ivory one, and in the dye's own hue (thru: the dyed card's colour at the ivory's
        // value): so a dyed fall with the sun behind it stands as lit pasteboard of its own dye, held under its own
        // top as its sunlit face is (see A CARD STAYS UNDER WHITE), and never as a dark slab
        col += thru*gSun*vec3(1., .92, .76)*max(-dot(N, uSunDir), 0.)*${f1(CARD_THRU)};
        // FAR CARDS GO TO AN EVEN TONE: where the picture's grain on a card is coarser than a hole's row (a card far
        // off, or seen along its face), its sunlit and shaded tones go to one even tone of its pasteboard in the
        // hall's fill (with FAR_SUN of the sun west of the Loom hall, where the shade side is the deeper), so that
        // far chains never stand as a lattice of thin bright streaks
        col = mix(col, alb*(fillAt(N, vW)*keep + uSunCol*mix(.04, ${f1(FAR_SUN)}, west)), smoothstep(${f1(CARD_FAR[0])}, ${f1(CARD_FAR[1])}, grain)*.85);
        // A CARD STAYS UNDER WHITE: pasteboard in the full sun keeps its tone, so that its holes and laces read on
        // the sunlit loops: a soft shoulder on its lit colour from a knee up toward a top it never reaches (the
        // part's PASTE: ivory's, a dyed pasteboard's by its own tone's value, and under the Loom hall's ridge)
        float knee = mix(${f1(PASTE.roof[0])}, mix(${f1(PASTE.knee)}, ${f1(PASTE.dyeKnee)}*pv, dyed), west), top = mix(${f1(PASTE.roof[1])}, mix(${f1(PASTE.top)}, ${f1(PASTE.dyeTop)}*pv, dyed), west);
        col = underTop(col, knee, top);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// a square prism: a drum of four flat sides, turning a quarter turn with every step of its chain
function makePrismMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec3 aStep;
      varying vec3 vW, vN, vL;
      ${LIGHT_GLSL}
      void main(){
        vec3 st = chainStep(uTime*uTempo, aStep.x, aStep.y, aStep.z);
        float a = (st.y + st.x)*1.5707963, c = cos(a), s = sin(a);
        vec3 p = position, n = normal;
        p.yz = vec2(c*p.y - s*p.z, s*p.y + c*p.z); n.yz = vec2(c*n.y - s*n.z, s*n.y + c*n.z);
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n); vL = position;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vL;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      void main(){
        vec3 N = normalize(vN);
        float edge = smoothstep(.46, .6, max(abs(vL.y), abs(vL.z)))*step(abs(vL.x), 1.69);
        vec3 alb = mix(vec3(.39, .2, .075), vec3(.12, .05, .02), edge);
        alb = mix(alb, vec3(.5, .42, .3), step(1.69, abs(vL.x))*.0 + (1. - smoothstep(.03, .05, abs(abs(vL.x) - 1.25)))*.5);
        vec3 col = shadeDull(alb, N, vW, .4);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
function buildCards(W) {
  const { scene, shared } = W, rng = W.RNG.cards, fr = W.RNG.falls, M = makeMesher();
  const abreast = clamp(Math.round(5 * W.vary.density), 4, 6), HALF = 14.8, RAIL = PLAN.cardHalf - PLAN.galDeep - 0.6;
  shared.uAbreast.value = abreast;
  // THE FOUR CURTAINS: which rails hang loops, and whether the chains are backed. Three of them hang low loops (from
  // the y 17 rail) beside their upper ones; these three stand first, second and fourth along the hall in an order
  // the seed deals. The third place is THE HIGH CURTAIN's: its chains come from the two upper rails only, so that
  // the hall's middle stands open from the floor to the y 35 loops (the line climbs through it there).
  const lowKinds = rng.shuffle([{ tiers: [35, 17] }, { tiers: [44, 35, 17], backed: 1 }, { tiers: [44, 17] }]);
  const kinds = [lowKinds[0], lowKinds[1], { tiers: [44, 35] }, lowKinds[2]];
  const chains = [], prisms = [];
  // THE EAST LINK's rail and bays (its falls are laid below, after the hall's)
  const LINK_RAIL = ELINK_RAIL, LINK_TOP = ELINK_TOP, LINK_BAY = ELINK_BAY, lx0 = ELINK_X0, ly = LINK_TOP - RAIL_DROP;
  const linkXs = []; for (let x = lx0; x < PLAN.cardX0 - 2; x += LINK_BAY) linkXs.push(x);
  // every chain's pasteboard, dealt before a chain is laid (the dye's streams; see WHICH CHAIN HAS WHICH PASTEBOARD):
  // a curtain's loops in the order they are laid here, its two falls, the walls' twenty falls, the link's
  // (EAST_FALL: the first of the walls' falls that hangs east of the second curtain's last card)
  const WALL_FALLS = 20, EAST_FALL = 4 * (1 + Math.ceil((CURTAIN_X[1] + CURTAIN_REACH + 5 - 600) / 40));
  const paste = dealPaste(W.RNG.dye, W.cloth, kinds.map((k) => k.tiers.length * abreast), WALL_FALLS, 2 * linkXs.length, EAST_FALL);
  let wallAt = 0, linkAt = 0;
  // what the floor's polish reads of each chain as it is hung (the floor's own uniforms; see FLOOR_PASTE)
  const FP = W.floorMat.uniforms, floorPaste = (k, pb, measure) => FP.uPaste.value[k].set(pb.tone[0], pb.tone[1], pb.tone[2], measure);
  // a pile under a fall is its chain's pasteboard, folded (the part's paint 13: the pile's middle along its long
  // axis, and 1 where that axis lies along z, 2 for ivory laces, 4 for a dyed pasteboard)
  const pileBox = (x, z, sx, pile, sz, pb) => M.box(x, pile / 2, z, sx, pile, sz, pb.dyed ? pb.tone : MATTER.ivory[0], MATTER.ivory[1], { skip: '-y', paint: [13, 0.09, sz > sx ? z : x, (sz > sx ? 1 : 0) + 2 * pb.ivoryLace + 4 * pb.dyed] });
  const stepOf = (r) => { const p = r.range(0.8, 1.6); return [p, r.range(0, p)]; };
  // a backed chain's own number: where in its round of twelve it stands at the clock's nought (0 to 11); kept as 1 + that
  const backedOf = (r, yes) => (yes ? 1 + r.int(0, 11) : 0);
  kinds.forEach((kind, c) => {
    const cx = CURTAIN_X[c]; let loopAt = 0;
    for (const g of kind.tiers) for (let i = 0; i < abreast; i++) {
      const x = cx + (i - (abreast - 1) / 2) * 4, top = g + 2.45, low = rng.range(LOOP_LOW[g][0], LOOP_LOW[g][1]), a = (top - low) / (HALF * HALF), [period, phase] = stepOf(rng);
      const backed = backedOf(rng, kind.backed ? true : rng.chance(0.12)), pb = paste.curtains[c].loops[loopAt++];
      chains.push({ kind: 0, x, z: 0, low, top, a, len: loopLength(a, HALF), period, phase, backed, seed: rng.range(1, 60), paste: pb });
      // (the curtain's lowest rail is the last of its tiers: its loops are the ones that stand in the floor)
      if (g === kind.tiers[kind.tiers.length - 1]) { floorPaste(FP_LOOP + c * 6 + i, pb, low); FP.uLoopTop.value.setComponent(c, top); }
      for (const s of [-1, 1]) prisms.push({ x, y: top - 0.72, z: s * RAIL, along: 'x', period, phase, backed });
      // the sun's dots under this place step with the loop that hangs nearest the windows' middle height (the y 35
      // tier where the curtain has one, else its highest)
      if (g === 35 || (g === kind.tiers[0] && !kind.tiers.includes(35))) shared.uDots.value[c * 6 + i].set(period, phase, backed);
    }
    // the truss east of the curtain, its two prisms, and the two sheer falls to their piles
    const tx = cx + (abreast * 4) / 2 + 4;
    M.box(tx, 51.6, 0, 0.5, 1.6, 2 * PLAN.cardHalf, IR[0], IR[1]); M.box(tx, 50.4, 0, 0.3, 0.3, 2 * PLAN.cardHalf, IRL[0], IRL[1]);
    for (const s of [-1, 1]) {
      const [period, phase] = stepOf(fr), pile = fr.range(4, 5.4), pb = paste.curtains[c].falls[s < 0 ? 0 : 1];
      chains.push({ kind: 2, x: tx - 0.62, z: s * 8, top: 49.6, a: 0, len: 49.6 - pile, period, phase, backed: 0, seed: fr.range(1, 60), paste: pb });
      prisms.push({ x: tx, y: 49.6, z: s * 8, along: 'z', period, phase, backed: 0 });
      pileBox(tx - 0.8, s * 8, 1.5, pile, 3.2, pb);
      floorPaste(FP_FALL + c * 2 + (s < 0 ? 0 : 1), pb, pile);
    }
  });
  // between the curtains and before the first and after the last: sheer falls from the rails' prisms to piles
  for (let c = -1; c < 4; c++) for (const s of [-1, 1]) for (const dx of [-4, 4]) {
    const x = 600 + 40 * c + dx + fr.range(-1, 1), g = fr.pick([26, 35, 44]), top = g + 1.7, pile = fr.range(3, 5), [period, phase] = stepOf(fr), backed = backedOf(fr, fr.chance(0.2)), pb = paste.wall[wallAt++];
    chains.push({ kind: 1, x, z: s * (RAIL - 0.62), top, a: 0, len: top - pile, period, phase, backed, seed: fr.range(1, 60), paste: pb });
    prisms.push({ x, y: top, z: s * RAIL, along: 'x', period, phase, backed });
    pileBox(x, s * (RAIL - 0.8), 3.2, pile, 1.5, pb);
    floorPaste(FP_WALL + wallAt - 1, pb, x); FP.uWallAt.value[wallAt - 1].set(top, pile);
  }
  // WHAT THE CHAINS HANG FROM. Every prism of the hall's two sides turns in two iron cheeks on a RAIL: an iron bar
  // along the hall under the prisms of its height, one rail to each of the four heights a prism can sit at (the
  // loops' three rails and the falls'), on both sides, from end to end of the hall. The rails hang from the roof: a
  // purlin runs under the rafters over them, and from it an iron strap comes down past all four rails in the
  // middle of every bay between two gallery posts, bolted to each. All of it stands 15.4 m and more from the hall's
  // middle line (the galleries' own edge), clear of every card.
  {
    const railY = [17, 26, 35, 44].map((g) => g + 1.7 - RAIL_DROP), X0 = PLAN.cardX0, X1 = PLAN.cardX1, mx = (X0 + X1) / 2, purlinY = 50 + (PLAN.cardHigh - 50) * (PLAN.cardHalf - RAIL) / PLAN.cardHalf - 0.75;
    for (const s of [-1, 1]) {
      for (const y of railY) M.box(mx, y - 0.16, s * (RAIL + 0.05), X1 - X0, 0.32, 0.36, IRL[0], IRL[1]);
      M.box(mx, purlinY, s * RAIL, X1 - X0, 0.3, 0.3, TIM[0], TIM[1], { paint: [7, 0.3, 0, 0] });
      for (let x = X0 + GAL_POST_STEP; x < X1; x += GAL_POST_STEP) M.box(x, (purlinY + railY[0]) / 2 - 0.2, s * (RAIL + 0.3), 0.22, purlinY - railY[0] + 0.4, 0.1, IRL[0], IRL[1]);
    }
    for (const p of prisms) if (p.along === 'x' && Math.abs(Math.abs(p.z) - RAIL) < 0.01) {
      for (const e of [-1, 1]) M.box(p.x + e * 1.82, p.y - RAIL_DROP / 2 + 0.12, p.z, 0.12, RAIL_DROP + 0.24, 0.5, IRL[0], IRL[1], { skip: '-y+y' });
    }
  }
  // THE EAST LINK (x 495 to 540) is where the cards go in to the Mill: a rail along each glass wall, and across it
  // in the middle of every bay between two of the link's hoops (7.5 m apart) a prism on a short cross arm; from each
  // a sheer fall hangs ACROSS the link, its face to the
  // way in from the Mill (as the curtains' mid-hall falls hang), down to its pile: 11 m from the middle line on
  // either hand. Seen along the link the falls stand one behind another as faces of cards with the sun through
  // them, not as strips seen along their edges.
  // (the rail lies LINK_RAIL from the middle line at LINK_TOP less a prism's drop, under the link's round vault, which
  // stands 40.7 m high over it; the falls' cards hang 9 m and more from the line)
  for (const s of [-1, 1]) {
    M.box((PLAN.archE + PLAN.cardX0) / 2, ly - 0.25, s * LINK_RAIL, PLAN.cardX0 - PLAN.archE, 0.5, 0.5, IR[0], IR[1]);
    for (const x of linkXs) {
      const top = LINK_TOP, pile = fr.range(3, 5), [period, phase] = stepOf(fr), backed = backedOf(fr, fr.chance(0.2)), pb = paste.link[linkAt++];
      chains.push({ kind: 2, x: x - 0.62, z: s * LINK_RAIL, top, a: 0, len: top - pile, period, phase, backed, seed: fr.range(1, 60), paste: pb });
      prisms.push({ x, y: top, z: s * LINK_RAIL, along: 'z', period, phase, backed });
      pileBox(x - 0.8, s * LINK_RAIL, 1.5, pile, 3.2, pb);
      floorPaste(FP_LINK + linkAt - 1, pb, pile);
      M.box(x, ly - 0.15, s * LINK_RAIL, 0.3, 0.3, 3.9, IRL[0], IRL[1]);
      for (const e of [-1, 1]) M.box(x, ly + 0.45, s * LINK_RAIL + e * 1.82, 0.5, 0.9, 0.12, IRL[0], IRL[1], { skip: '-y' });
      M.rod([x + LINK_BAY / 2, ly, s * LINK_RAIL], [x + LINK_BAY / 2, 30 + Math.sqrt(15 * 15 - LINK_RAIL * LINK_RAIL) - 0.3, s * LINK_RAIL], 0.12, 4, IR[0], IR[1], { flat: true });
    }
  }
  // THE CHAINS GO ON INTO THE LOOM: three chains abreast leave the last curtain's truss, pass out under the Cards'
  // ridge and run along the Loom's hall from roller to roller under the roof beams, rising to the one long prism at
  // the loom's head; past it each falls a little way into the head's tray. One prism, so one step for all three.
  const hd = W.RNG.head, [hPeriod, hPhase] = stepOf(hd), SAG = 2, T = PLAN.loomHigh;
  const txLast = 700 + (abreast * 4) / 2 + 4, stays = [[txLast, 53.2], [PLAN.loomX0 + 0.6, 53.6]];
  for (const k of [3, 6, 9]) { const x = PLAN.loomX0 + 4 + ROOF_STEP * k; stays.push([x, 53.6 + (HEAD_Y + 0.75 - 53.6) * (x - PLAN.loomX0 - 0.6) / (HEAD_X - PLAN.loomX0 - 0.6)]); }
  stays.push([HEAD_X, HEAD_Y + 0.75]);
  for (const z of [-5, 0, 5]) {
    const seed = hd.range(1, 60);
    for (let i = 0; i + 1 < stays.length; i++) {
      const [xa, ya] = stays[i], [xb, yb] = stays[i + 1], half = (xb - xa) / 2, a = SAG / (half * half);
      chains.push({ kind: 3, x: (xa + xb) / 2, z, low: (ya + yb) / 2 - SAG, top: Math.max(ya, yb), a, len: loopLength(a, half), slope: (yb - ya) / (xb - xa), period: hPeriod, phase: hPhase, backed: 0, seed });
    }
    chains.push({ kind: 2, x: HEAD_X + 0.9, z, top: HEAD_Y, a: 0, len: 5.6, period: hPeriod, phase: hPhase, backed: 0, seed });
  }
  prisms.push({ x: HEAD_X, y: HEAD_Y, z: 0, along: 'z', period: hPeriod, phase: hPhase, backed: 0, scale: [7.2, 1.25, 1.25] });
  // the rollers the runs hang from: a bar under each third roof beam, on two rods; one under the Cards' east gable
  for (let i = 1; i + 1 < stays.length; i++) {
    const [x, y] = stays[i];
    M.rod([x, y - 0.45, -7.4], [x, y - 0.45, 7.4], 0.4, 8, STL[0], STL[1], { capA: true, capB: true });
    if (i > 1) for (const z of [-7.2, 7.2]) M.box(x, (y + T) / 2 - 0.5, z, 0.25, T - y - 0.2, 0.25, IR[0], IR[1]);
    else for (const z of [-7.2, 7.2]) M.box(x, y + 0.1, z, 0.25, 1.1, 0.25, IR[0], IR[1]);
  }
  M.box(HEAD_X + 1.0, HEAD_Y - 6.2, 0, 2.2, 0.4, 14.5, OAK[0], OAK[1]);
  for (const z of [-7, 7]) M.box(HEAD_X + 1.9, HEAD_Y - 4.3, z, 0.3, 4.2, 0.3, IR[0], IR[1]);
  // the cards: one quad many times; each knows its chain and its slot
  const slots = []; for (const ch of chains) { const n = Math.ceil(ch.len / CARD_PITCH); for (let j = -1; j < n; j++) slots.push([ch, j]); }
  const g = new THREE.BufferGeometry(), n = slots.length;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), Cc = new Float32Array(n * 3), Dy = new Float32Array(n * 4);
  // (aDye: the chain's pasteboard: its tone, then 0 ivory, 1 dyed, 3 dyed with ivory laces; the runs to the loom's
  // head are ivory)
  slots.forEach(([ch, j], i) => {
    const pb = ch.paste || PASTE_IVORY;
    A.set([ch.x, ch.a > 0 ? ch.low : ch.top, ch.z, ch.kind + (ch.slope || 0)], i * 4); B.set([ch.a, ch.len, ch.period, ch.phase], i * 4); Cc.set([j, Math.round(ch.seed * 8) / 8, ch.backed], i * 3);
    Dy.set([pb.tone[0], pb.tone[1], pb.tone[2], pb.dyed + 2 * pb.ivoryLace], i * 4);
  });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(Cc, 3));
  g.setAttribute('aDye', new THREE.InstancedBufferAttribute(Dy, 4));
  const cards = new THREE.InstancedMesh(g, makeCardMaterial(shared), n);
  cards.boundingSphere = new THREE.Sphere(new THREE.Vector3((PLAN.archE + HEAD_X) / 2, 36, 0), 222);
  // for counts by place: each chain's own path (chainPoint), its cards' breadth, the step's slide and the swing
  cards.userData = { kind: 'chains', chains, pitch: CARD_PITCH, long: CARD_LONG, swing: SWING, point: chainPoint };
  // the prisms
  const pm = makeMesher(); pm.box(0, 0, 0, 3.4, 1.2, 1.2, [1, 1, 1], [0, 0]);
  const pg = pm.build(), st = new Float32Array(prisms.length * 3), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), sc = new THREE.Vector3(), v = new THREE.Vector3();
  const pmesh = new THREE.InstancedMesh(pg, makePrismMaterial(shared), prisms.length);
  prisms.forEach((p, i) => { st.set([p.period, p.phase, p.backed], i * 3); pmesh.setMatrixAt(i, m4.compose(v.set(p.x, p.y, p.z), q.setFromAxisAngle(up, p.along === 'z' ? Math.PI / 2 : 0), p.scale ? sc.set(p.scale[0], p.scale[1], p.scale[2]) : one)); });
  pg.setAttribute('aStep', new THREE.InstancedBufferAttribute(st, 3));
  pmesh.instanceMatrix.needsUpdate = true; pmesh.computeBoundingSphere();
  pmesh.userData = { kind: 'instanced', reach: 1.8 };
  M.dress = [0, 0, 0, 0];
  const iron = new THREE.Mesh(M.build(), makePlainMaterial(shared)); iron.userData = { kind: 'still' };
  scene.add(cards, pmesh, iron);
  W.cardChains = chains;
}
// ---------------------------------------------------------------- the Loom: cloth, warp, cords
// THE CLOTH'S DRAWING (ours; no pattern book holds it): on a ground colour, stems that are waves, leaves that are
// simple closed loops (one lobe of a figure-of-eight curve) and flowers that are rose curves (a radius that swells
// and falls a whole number of times round the flower). q is a place on the cloth in metres (across, down the cloth).
const CLOTH_CELL = 5.2;
const CLOTH_GLSL = /* glsl */`
uniform vec3 uGround, uFlowerA, uFlowerB, uLeaf, uPetals;
uniform float uBands;
// the cloth's colour at q; w is 1 on a figure (stem, leaf, flower) and 0 on the ground
vec4 clothAt(vec2 q, float salt){
  // the ground; on the rare visit it is woven in broad bands of two grounds, nine metres to a pair
  vec3 ground2 = mix(uGround, uFlowerB, .32)*.8 + uLeaf*.12;
  vec3 col = mix(uGround, ground2, uBands*smoothstep(.46, .5, abs(fract(q.y/9. + salt*.37) - .5)));
  float fig = 0.;
  // stems, one to every 4.6 m of breadth, and their leaves, one to every 2.1 m, left and right in turn
  float sx = q.x/4.6, si = floor(sx), sf = (fract(sx) - .5)*4.6;
  float wav = .85*sin(q.y*.55 + si*2.4 + salt);
  float stem = 1. - smoothstep(.08, .13, abs(sf - wav));
  col = mix(col, uLeaf*.8, stem); fig = max(fig, stem);
  float ly = q.y/2.1, li = floor(ly), lc = (li + .5)*2.1, side = mod(li, 2.)*2. - 1.;
  vec2 p = vec2(sf - .85*sin(lc*.55 + si*2.4 + salt), q.y - lc);
  float ca = cos(.7*side), sa = sin(.7*side);
  p = vec2(ca*p.x + sa*p.y, -sa*p.x + ca*p.y)*vec2(side, 1.);
  float r2 = dot(p, p);
  float leaf = step(0., p.x)*(1. - smoothstep(-.02, .02, r2*r2 - .62*(p.x*p.x - p.y*p.y)));
  col = mix(col, uLeaf, leaf); fig = max(fig, leaf);
  col = mix(col, uLeaf*.55, leaf*(1. - smoothstep(.0, .035, abs(p.y))));
  // flowers: a cell to every ${CLOTH_CELL.toFixed(1)} m, four cells in five bearing one, 2 to 4 m across
  float cs = ${CLOTH_CELL.toFixed(1)};
  vec2 c = q/cs, ci = floor(c), cf = (fract(c) - .5)*cs;
  float h = hash21(ci + salt*3.1), h2 = hash21(ci*1.7 + 9. + salt);
  float kind = floor(h2*3.), there = step(h, .8);
  float n = kind < .5 ? uPetals.x : (kind < 1.5 ? uPetals.y : uPetals.z);
  vec2 fp = cf - (vec2(h, h2) - .5)*.9;
  float R = 1. + h2, fr = length(fp), th = atan(fp.y, fp.x + 1e-5) + h*6.2832;
  float rose = R*(.3 + .7*abs(cos(n*.5*th)));
  vec3 fc = kind < .5 ? uFlowerA : (kind < 1.5 ? uFlowerB : mix(uFlowerA, uFlowerB, .5));
  float petals = (1. - smoothstep(rose - .04, rose + .04, fr))*there;
  col = mix(col, fc, petals); fig = max(fig, petals);
  float inner = R*.55*(.3 + .7*abs(cos(n*.5*th + 1.5708)));
  col = mix(col, mix(fc, uGround, .55), (1. - smoothstep(inner - .04, inner + .04, fr))*there);
  col = mix(col, uLeaf*1.2 + .05, (1. - smoothstep(R*.1, R*.1 + .05, fr))*there);
  return vec4(col, fig);
}
`;
// the cloth on the loom (lit THROUGH by the morning behind the end wall's one window: silk that glows like a window) and the
// finished lengths hung in the hall (lit on the face the sun strikes, and through from the other)
function makeClothMaterial(shared, look, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, ...look, uCreep: { value: o.creep ?? 0.3 }, uBack: { value: o.back ?? 1 }, uSalt: { value: o.salt ?? 0 }, uStart: { value: o.start ?? 0 }, uThru: { value: o.thru ?? 0 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aHang, aDraught;
      uniform float uTime, uTempo;
      varying vec3 vW, vN; varying vec2 vQ; varying float vSalt;
      void main(){
        vec3 p = position;
        // a hung length breathes in the hall's draught: a slow billow that grows down its fall (aHang.x = how free
        // the cloth is here), each length on its own slow period and phase (aDraught, dealt), a ripple running along it
        float turn = 6.2831853*uTime/max(aDraught.x, 1.) + aDraught.y;
        float sway = aHang.x*(${HANG_SWAY.toFixed(2)}*sin(turn + p.y*.11) + ${HANG_RIPPLE.toFixed(2)}*sin(turn*2.3 + aHang.y*2.3 + p.x*.4));
        p += normal*sway;
        vec4 w = modelMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vQ = uv; vSalt = aHang.y;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vQ; varying float vSalt;
      uniform float uCreep, uBack, uSalt, uStart, uThru;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${CLOTH_GLSL}
      void main(){
        vec3 N = normalize(vN); N = gl_FrontFacing ? N : -N;
        vec2 q = vec2(vQ.x, vQ.y - uTime*uTempo*uCreep + uStart);
        // the weft's lines, a finger's breadth apart, going to their mean tone before the picture's grain
        float grain = fwidth(q.y);
        float weft = mix(.5 + .5*sin(q.y*120.), .5, smoothstep(.008, .03, grain));
        vec4 pc = clothAt(q, uSalt + floor(vSalt*8. + .5)/8.);
        vec3 pat = pc.rgb*(.9 + .2*weft);
        // a hung length: the sun on the face it strikes, and through the silk from behind (the figures let more through)
        vec3 sun = uSunCol*sunAt(vW);
        float facing = dot(N, uSunDir);
        vec3 lit = shadeDull(pat, N, vW, .35) + uThru*pat*sun*max(-facing, 0.)*(1.1 + .9*pc.a);
        // the loom's cloth, lit through: the ground stays deep, the figures glow; its brightest part is held at 1.3
        float soft = .82 + .3*sin(vQ.x*.11 + 1.3)*sin(vQ.y*.19 + .4);
        vec3 glow = pat*mix(1.25, 2.9, pc.a)*soft + pat*lightAt(N, vW)*.3;
        glow *= min(1., 1.3/max(max(glow.r, glow.g), max(glow.b, 1e-3)));
        gl_FragColor = vec4(hazed(mix(lit, glow, uBack), vW), 1.);
      }`,
  });
}
// ONE THREAD SHADER for the warp, the fan of cords and the creels' threads: a sheet ruled with fine lines. uv.x counts
// threads across the sheet, uv.y runs along them (0..1). Threads finer than the picture's grain go to their mean
// cover. Groups of threads brighten and dim as they are lifted, in ripples that cross the sheet on the world's clock.
// THE BUNDLES (o.gap): the threads of a group stand together with a gap to the next group (a group goes through one
// heddle), so that far off, where single threads are an even veil, the sheet still stands as bright bundles with
// what is behind it between them; the gap goes to its mean before it is finer than the grain.
// THE GLINT (o.glint): a bright place runs up every thread from its foot to its head on the world's clock, each
// group a little after its neighbour (and a little off by its own number), so the glints cross a sheet as a wave.
const THREAD_KNEE = 0.62, THREAD_TOP = 0.9;
function makeThreadMaterial(shared, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uThread: { value: new THREE.Color(o.color || '#e9dfc6') }, uPar: { value: new THREE.Vector4(o.half ?? 0.2, o.group ?? 24, o.waves ?? 5, o.period ?? 2.4) }, uLift: { value: new THREE.Vector3(o.lift ?? 0, o.liftY ?? 0.2, o.glow ?? 1) }, uDense: { value: o.dense ?? 0 },
      uMore: { value: new THREE.Vector4(o.gap ?? 0, o.glint ?? 0, o.glintPeriod ?? 2.2, o.warm ?? 0) }, uKnee: { value: o.knee ? 1 : 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime, uTempo; uniform vec4 uPar; uniform vec3 uLift;
      varying vec3 vW; varying vec2 vUv; varying float vRip;
      void main(){
        float grp = floor(uv.x/uPar.y);
        float rip = sin(6.2831853*(grp*uPar.z/40. - uTime*uTempo/uPar.w) + 1.7*sin(grp*12.9898));
        vec3 p = position;
        // the shed: lifted groups stand off the sheet, most a little way up from the fell, not at all at either end
        float shed = smoothstep(0., uLift.y, uv.y)*(1. - smoothstep(uLift.y, 1., uv.y));
        p.x -= uLift.x*shed*rip;
        vec4 w = modelMatrix*vec4(p, 1.);
        vW = w.xyz; vUv = uv; vRip = rip;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uThread; uniform vec4 uPar, uMore; uniform vec3 uLift; uniform float uDense, uKnee;
      varying vec3 vW; varying vec2 vUv; varying float vRip;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      void main(){
        float grain = fwidth(vUv.x);
        float d = abs(fract(vUv.x) - .5);
        float line = 1. - smoothstep(uPar.x - grain, uPar.x + grain, d);
        float cover = mix(line, 2.*uPar.x, smoothstep(.35, 1., grain));
        // the bundles: the gap between two groups, a share uMore.x of a group's breadth
        float gx = vUv.x/uPar.y, gg = fwidth(gx), id = floor(gx);
        float inGap = smoothstep(.5 - uMore.x*.5 - gg, .5 - uMore.x*.5 + gg, abs(fract(gx) - .5));
        cover *= 1. - mix(inGap, uMore.x, smoothstep(.35, 1., gg))*step(.001, uMore.x);
        float twitch = .5 + .5*sin(vUv.x*7.31 + uTime*3.1*hash11(id) + id);
        float bright = (.4 + .95*smoothstep(-.5, .9, vRip))*(.85 + .3*twitch);
        // the glint running up the thread
        float at = fract(uTime*uTempo/uMore.z - id*.045 - .15*hash11(id*1.7 + 2.)), gd = (clamp(vUv.y, 0., 1.) - at)/.09;
        float glint = uMore.y*exp(-gd*gd);
        vec3 light = lightAt(vec3(-1., 0., 0.), vW)*.55 + mix(uSkyCol*.75, uSunCol*.3, uMore.w)*uLift.z;
        vec3 col = uThread*light*(bright + 2.2*glint);
        // THE THREADS' SHOULDER (the creels' threads and the cord fan; the warp has none): a lit thread's colour is
        // held under white, from THREAD_KNEE up toward THREAD_TOP, which it never reaches (as a card's is), so a lit
        // thread stays a thread with air beside it and does not burn into its neighbours
        float top = max(col.r, max(col.g, col.b)), over = max(top - ${f1(THREAD_KNEE)}, 0.);
        col *= mix(1., (min(top, ${f1(THREAD_KNEE)}) + ${f1(THREAD_TOP - THREAD_KNEE)}*(1. - exp(-over/${f1(THREAD_TOP - THREAD_KNEE)})))/max(top, 1e-4), uKnee);
        // (a dense sheet, the warp, hides more of what stands behind it)
        float lifted = smoothstep(-.4, .8, vRip);
        float alpha = cover*mix(.4 + .58*lifted, .5 + .5*lifted, uDense);
        gl_FragColor = vec4(hazed(col, vW), min(1., alpha*(1. + 1.5*glint)));
      }`,
  });
}
// a silk spool on the creel: a wound body between two timber flanges, turning; the winding's slant lines show the turn
function makeSpoolMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec4 aSpool;
      uniform float uTime, uTempo;
      varying vec3 vW, vN, vL, vC; varying float vA;
      void main(){
        float a = uTime*uTempo*aSpool.w + aSpool.x*40., c = cos(a), s = sin(a);
        vec3 p = position, n = normal;
        p.xz = vec2(c*p.x - s*p.z, s*p.x + c*p.z); n.xz = vec2(c*n.x - s*n.z, s*n.x + c*n.z);
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*n); vL = position; vC = instanceColor; vA = aSpool.x;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vL, vC; varying float vA;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      void main(){
        vec3 N = normalize(vN);
        float body = step(.25, vL.y)*step(vL.y, 2.75)*step(length(vL.xz), 1.02);
        float th = atan(vL.z, vL.x + 1e-5);
        // the winding lies in two broad slanted bands, lighter and darker, so that the spool is seen to turn
        float wind = smoothstep(-.25, .25, sin(th*2. + vL.y*2.2));
        float spoke = step(.55, fract(th/1.0472 + .5*vA));
        vec3 alb = mix(vec3(.3, .2, .11)*mix(.6, 1., spoke), vC*mix(.5, 1.3, wind), body);
        vec3 col = shadeDull(alb, N, vW, mix(.3, .6, body));
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// THE BOLTS OF FINISHED CLOTH on the north wall's galleries: in every bay between two gallery posts, on every
// gallery, a rack of two oak shelves over the gallery's own floor stands against the wall, and on each of the three
// levels lie bolts of cloth end to end, each wound to its own length and thickness, in the cloth's own colours (its
// ground the most, then its flowers', its leaf's and ivory); here and there a place is empty, and here and there a
// second bolt lies on two below. Dealt from the bolts' own stream. Stills, 36 m and more from the line.
function buildBolts(W, galleries) {
  const M = makeMesher(), rng = W.RNG.bolts, cloth = W.cloth;
  const X0 = PLAN.loomX0, X1 = PLAN.loomX1, H = PLAN.loomHalf, BAY = ROOF_STEP, RACK = BAY - 4, zc = -(H - 1.15), SHELF = 2.1;
  const hues = [cloth[0], cloth[0], cloth[1], cloth[2], cloth[3], '#e9dfc6'];
  const bolt = (x, y, len, r, hex) => {
    const c = lin(hex, 1.25).map((v) => v + 0.02);
    // (a bolt's east end is not drawn, nor a rack's east face: a face whose outward side looks only toward places
    // east of itself. This hall's only eyes are on the line's lane (x 740 to 940 on the axis, z 0), heading east,
    // and none looks back west from a place east of the face. A rack's wall-side face looks only at the north wall
    // it stands against, a metre behind it, where no eye is.)
    M.rod([x, y + r * 0.81, zc], [x + len, y + r * 0.81, zc], r, 5, c, [0, 0.2], { flat: true, capA: true, twist: Math.PI / 2, paint: [4, 0.07, 0, 0] });
  };
  for (const gy of galleries) for (let x0 = X0 + 4; x0 + BAY < X1; x0 += BAY) {
    const xa = x0 + (BAY - RACK) / 2;
    for (const e of [0, 0.5, 1]) M.box(xa + RACK * e, gy + SHELF * 1.5, zc, 0.16, SHELF * 3, 1.5, OAK[0], OAK[1], { skip: '-y-z+x', paint: [7, 0.3, 0, 1] });
    for (let k = 1; k <= 2; k++) M.box(xa + RACK / 2, gy + SHELF * k - 0.06, zc, RACK, 0.12, 1.5, OAK[0], OAK[1], { skip: '-z+x', paint: [7, 0.4, 0, 0] });
    for (let k = 0; k < 3; k++) {
      let x = xa + 0.25 + rng.range(0, 0.6), last = null;
      while (x < xa + RACK - 2.2) {
        const len = Math.min(rng.range(2.0, 3.4), xa + RACK - 0.25 - x), r = rng.range(0.3, 0.46), hex = rng.pick(hues), there = !rng.chance(0.12);
        if (there) {
          bolt(x, gy + SHELF * k, len, r, hex);
          if (last && rng.chance(0.3)) bolt((last.x + x) / 2 + 0.2, gy + SHELF * k + 1.5 * Math.min(r, last.r), Math.min(len, last.len) * 0.8, 0.3, rng.pick(hues));
        }
        last = there ? { x, len, r } : null;
        x += len + rng.range(0.12, 0.5);
      }
    }
  }
  // (the galleries' bolts are built two galleries to a step of the build, a mesh to each step)
  const bolts = new THREE.Mesh(M.build(), makePlainMaterial(W.shared)); bolts.userData = { kind: 'still' };
  W.scene.add(bolts);
}
// where things of the loom's hall stand: the gathering bars over the creels' east end (under a roof beam), the head
// prism over the comb board, the rails the lengths of finished cloth hang from
const BAR_X = PLAN.loomX0 + 4 + 10 * ROOF_STEP, BAR_Y = 58, HEAD_X = 924.4, HEAD_Y = 70.4, COMB_X = 932, HANG_TOP = 70, HANG_LONG = 14, HANG_Z = [9, 13.5];
// a hung length's breathing at its free foot: the slow billow and the ripple on it (metres to either side of its rest)
const HANG_SWAY = 0.55, HANG_RIPPLE = 0.15;
// the take-up rolls of the cloth drawn off (their radius, and how high their cheeks seat them over the floor); how
// free an outer length hangs before its window (a share of a hung length's breathing)
const TAKE_R = 1.3, TAKE_SEAT = 0.25, OUTER_FREE = 0.3;
function buildLoom(W) {
  const { scene, shared } = W, rng = W.RNG.loom, LX = PLAN.loomX, WH = PLAN.warpHalf, FELL = PLAN.fellY, M = makeMesher();
  const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  // the cloth's deal: the ground and the flowers' colours, three kinds of flower (their counts of petals); where the
  // weave stands on the cloth (a salt and a start); on the rare visit a second ground colour in broad bands
  const petals = rng.shuffle([3, 4, 5, 6, 7, 8]).slice(0, 3);
  const look = { uGround: { value: col(W.cloth[0]) }, uFlowerA: { value: col(W.cloth[1]) }, uFlowerB: { value: col(W.cloth[2]) }, uLeaf: { value: col(W.cloth[3]) },
    uPetals: { value: new THREE.Vector3(petals[0], petals[1], petals[2]) }, uBands: { value: W.vary.rare ? 1 : 0 } };
  const clothSalt = rng.range(1, 40), clothStart = rng.range(0, CLOTH_CELL);
  // the frame: two great side posts of dark oak to the roof, the head beam, the warp beam under it, the two foot posts
  // either side of the gate, a boarded breast from each foot post to its side post, the comb board at the head
  const FR = [lin('#4a3524', 2.2), [0, 0.5]], T = PLAN.loomHigh, PZ = PLAN.postZ, PH = PLAN.postHalf;
  M.dress = [7, 0.5, 0, 1];
  for (const s of [-1, 1]) {
    M.box(LX, T / 2, s * 27, 4, T, 8, FR[0], FR[1], { skip: '-y' });
    M.box(LX, (PLAN.rollY - 1.5) / 2, s * PZ, 2 * PH, PLAN.rollY - 1.5, 2 * PH, FR[0], FR[1], { skip: '-y' });
    M.box(LX + 0.4, PLAN.breastTop / 2, s * (PZ + PH + 23) / 2, 1.0, PLAN.breastTop, 23 - PZ - PH, FR[0], FR[1], { skip: '-y' });
    M.box(LX + 0.4, PLAN.breastTop + 0.3, s * (PZ + 23) / 2, 1.8, 0.6, 23 - PZ + PH, FR[0], FR[1], { paint: [7, 0.5, 0, 0] });
    M.box(LX, PLAN.rollY, s * 23.6, 2.8, 3.6, 1.2, FR[0], FR[1]);
    for (const x of [926.6, 937.4]) M.box(x, (68.3 + T) / 2, s * 23.4, 0.6, T - 68.3, 0.6, FR[0], FR[1]);
    M.box(HEAD_X, HEAD_Y, s * 12.9, 1.4, 2.2, 0.9, FR[0], FR[1]);
    M.box(HEAD_X, (HEAD_Y + T) / 2 + 0.5, s * 12.9, 0.5, T - HEAD_Y - 1, 0.5, FR[0], FR[1]);
    // the gathering bar of this hand's creel, hung from a roof beam
    M.box(BAR_X, BAR_Y, s * 19.25, 0.8, 0.8, 9.9, FR[0], FR[1], { paint: [7, 0.4, 0, 0] });
    for (const z of [14.6, 23.9]) M.box(BAR_X, (BAR_Y + T) / 2, s * z, 0.3, T - BAR_Y, 0.3, IR[0], IR[1], { paint: [0, 0, 0, 0] });
  }
  M.dress = [7, 0.5, 0, 0];
  M.box(LX, 64, 0, 4.4, 4, 62, FR[0], FR[1]);
  M.box(COMB_X, 68, 0, 12, 0.6, 48, FR[0], FR[1]);
  M.rod([LX, PLAN.warpTop, -WH - 0.5], [LX, PLAN.warpTop, WH + 0.5], 1.3, 14, MATTER.ivory[0], MATTER.ivory[1], { capA: true, capB: true, paint: [0, 0, 0, 0] });
  // the cloth from the fell down to the roller, creeping; uv in metres of cloth
  const clothMat = makeClothMaterial(shared, look, { creep: 0.3, back: 1, salt: clothSalt, start: clothStart });
  const cg = new THREE.PlaneGeometry(1, 1, 1, 1), cp = cg.getAttribute('position'), cuv = cg.getAttribute('uv'), y0 = PLAN.rollY + 1.2;
  for (let i = 0; i < cp.count; i++) { const u = cp.getX(i) + 0.5, v = cp.getY(i) + 0.5; cp.setXYZ(i, LX, y0 + (FELL - y0) * v, -WH + 2 * WH * u); cuv.setXY(i, 2 * WH * u, (FELL - y0) * (1 - v)); cg.getAttribute('normal').setXYZ(i, -1, 0, 0); }
  cg.setAttribute('aHang', new THREE.BufferAttribute(new Float32Array(cp.count * 2), 2)); cg.setAttribute('aDraught', new THREE.BufferAttribute(new Float32Array(cp.count * 2), 2));
  cg.computeBoundingSphere(); cg.computeBoundingBox();
  const cloth = new THREE.Mesh(cg, clothMat); cloth.userData = { kind: 'still' };
  // THE LENGTHS OF FINISHED CLOTH: hung from rails under the roof beams in two rows, one to either hand of the line and
  // 9 m and more from it (never over it), each at its own distance and to its own depth; the two rows are set a roof
  // bay apart from one another. They hang along the hall, so the south windows' sun comes through the south row.
  const hr = W.RNG.hangs, dr = W.RNG.draught, HP = [], HN = [], HU = [], HH = [], HD = [], HI = [], NX = 6, NY = 10;
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x0 = PLAN.loomX0 + 4 + ROOF_STEP * (1 + 2 * i + (s > 0 ? 1 : 0)) + 1, z = s * hr.range(HANG_Z[0], HANG_Z[1]), foot = hr.range(30, 46), salt = Math.round(hr.range(1, 40) * 8) / 8, base = HP.length / 3;
    // its breathing: a period of 5 to 9 s of the world's clock and a phase, its own (the draught's stream)
    const period = dr.range(5, 9), phase = dr.range(0, Math.PI * 2);
    for (let j = 0; j <= NY; j++) for (let k = 0; k <= NX; k++) {
      const x = x0 + HANG_LONG * k / NX, y = HANG_TOP - (HANG_TOP - foot) * j / NY;
      HP.push(x, y, z); HN.push(0, 0, -s); HU.push(x - x0, HANG_TOP - y); HH.push(Math.min(1, (HANG_TOP - y) / 30), salt); HD.push(period, phase);
    }
    for (let j = 0; j < NY; j++) for (let k = 0; k < NX; k++) { const a = base + j * (NX + 1) + k, b = a + 1, c = a + NX + 1, d = c + 1; HI.push(a, c, b, b, c, d); }
    M.box(x0 + HANG_LONG / 2, HANG_TOP + 0.2, z, HANG_LONG + 0.6, 0.3, 0.3, IR[0], IR[1], { paint: [0, 0, 0, 0] });
    for (const x of [x0 - 1 + 0.2, x0 + ROOF_STEP - 1.2]) M.box(x, (HANG_TOP + T) / 2, z, 0.2, T - HANG_TOP - 0.4, 0.2, IR[0], IR[1], { paint: [0, 0, 0, 0] });
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HP), 3)); hg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(HN), 3));
  hg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(HU), 2)); hg.setAttribute('aHang', new THREE.BufferAttribute(new Float32Array(HH), 2));
  hg.setAttribute('aDraught', new THREE.BufferAttribute(new Float32Array(HD), 2));
  hg.setIndex(HI); hg.computeBoundingSphere(); hg.computeBoundingBox();
  const hangs = new THREE.Mesh(hg, makeClothMaterial(shared, look, { creep: 0, back: 0, thru: 1 }));
  hangs.userData = { kind: 'still', reach: HANG_SWAY + HANG_RIPPLE };
  // A SHEET OF CLOTH laid as a grid: at(a, b) gives a corner's place, its uv in metres of cloth, how free it hangs
  // and its salt; the sheet's normal is n; its breathing (period, phase) is dr2
  const sheet = (S, nx, ny, n, dr2, at) => {
    const base = S.P.length / 3;
    for (let j = 0; j <= ny; j++) for (let k = 0; k <= nx; k++) { const c = at(k / nx, j / ny); S.P.push(...c.p); S.N.push(...n); S.U.push(...c.uv); S.H.push(c.free, c.salt); S.D.push(...dr2); }
    for (let j = 0; j < ny; j++) for (let k = 0; k < nx; k++) { const a = base + j * (nx + 1) + k, b = a + 1, c = a + nx + 1, d = c + 1; S.I.push(a, c, b, b, c, d); }
  };
  const sheetMesh = (S, mat, reach) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(S.P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(S.N), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(S.U), 2)); g.setAttribute('aHang', new THREE.BufferAttribute(new Float32Array(S.H), 2));
    g.setAttribute('aDraught', new THREE.BufferAttribute(new Float32Array(S.D), 2));
    g.setIndex(S.I); g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new THREE.Mesh(g, mat); m.userData = { kind: 'still', reach };
    return m;
  };
  const blank = () => ({ P: [], N: [], U: [], H: [], D: [], I: [] });
  // THE CLOTH DRAWN OFF, in two broad falls: the finished cloth leaves the roller's underside to either hand of the
  // gate, outside the foot posts (PLAN.fallZ: 12.5 m broad), passes west over an iron guide rail under the roller
  // (PLAN.fallX, fallTop) and hangs from it to the floor, where a take-up roll in two oak cheeks winds it on. It is
  // the loom's own cloth (the same weave, salt and start, its uv going on down from the roller) and it creeps down
  // at the cloth's own creep. It hangs taut: no billow. Lit on its face by the hall and the gate's lamp.
  const FZ = PLAN.fallZ, FX = PLAN.fallX, FT = PLAN.fallTop, FALLS = blank(), down0 = FELL - y0 + 2 * Math.PI * 0.75;
  for (const s of [-1, 1]) {
    const foot = TAKE_R + TAKE_SEAT, slant = Math.hypot(LX - 0.3 - FX, PLAN.rollY - 1.5 - FT - 0.17);
    for (const [ya, yb, ny, top] of [[PLAN.rollY - 1.52, FT + 0.17, 1, true], [FT + 0.17, foot, 8, false]]) sheet(FALLS, 4, ny, top ? [0, -1, 0] : [-1, 0, 0], [1, 0], (a, b) => {
      const z = FZ[0] + (FZ[1] - FZ[0]) * a, onRoll = top && b === 0, y = ya + (yb - ya) * b;
      return { p: [onRoll ? LX - 0.3 : FX, y, s * (onRoll ? Math.min(z, WH - 0.1) : z)], uv: [WH + s * z, down0 + (top ? slant * b : slant + ya - y)], free: 0, salt: 0 };
    });
    M.rod([FX, FT, s * (FZ[0] - 0.9)], [FX, FT, s * (FZ[1] + 0.3)], 0.15, 6, IR[0], IR[1], { capA: true, capB: true });
    M.box((FX + LX - PH) / 2, FT, s * (FZ[0] - 0.7), LX - PH - FX + 0.3, 0.3, 0.3, FR[0], FR[1], { paint: [7, 0.4, 0, 0] });
    M.box((FX + LX - 2) / 2, FT, s * (FZ[1] + 0.1), LX - 2 - FX + 0.3, 0.3, 0.3, FR[0], FR[1], { paint: [7, 0.4, 0, 0] });
    for (const z of [FZ[0] - 0.25, FZ[1] + 0.25]) M.box(FX - TAKE_R, (TAKE_R + TAKE_SEAT + 0.4) / 2, s * z, 2 * TAKE_R + 0.8, TAKE_R + TAKE_SEAT + 0.4, 0.4, FR[0], FR[1], { skip: '-y', paint: [7, 0.4, 0, 1] });
  }
  const falls = sheetMesh(FALLS, makeClothMaterial(shared, look, { creep: 0.3, back: 0, salt: clothSalt, start: clothStart }), 0);
  // THE OUTER LENGTHS: before each of the end wall's two outer windows a finished length of the cloth hangs from an
  // iron rail, from near the roof to near the floor (PLAN.outerZ, outerY), covering the window: lit through by the
  // morning as the loom's cloth is. Each stands on the weave at its own dealt place and breathes a little in the
  // hall's draught on its own dealt period and phase (the drawn cloth's own stream).
  const OZ = PLAN.outerZ, OY = PLAN.outerY, OUTER = blank(), dw = W.RNG.drawn;
  for (const s of [-1, 1]) {
    const salt = Math.round(dw.range(1, 40) * 8) / 8, period = dw.range(6, 10), phase = dw.range(0, Math.PI * 2);
    sheet(OUTER, 3, 12, [-1, 0, 0], [period, phase], (a, b) => {
      const z = OZ[0] + (OZ[1] - OZ[0]) * a, y = OY[1] - (OY[1] - OY[0]) * b;
      return { p: [OUTER_X, y, s * z], uv: [z - OZ[0], OY[1] - y], free: OUTER_FREE * Math.min(1, (OY[1] - y) / 30), salt };
    });
    M.box(OUTER_X, OY[1] + 0.2, s * (OZ[0] + OZ[1]) / 2, 0.3, 0.3, OZ[1] - OZ[0] + 0.6, IR[0], IR[1], { paint: [0, 0, 0, 0] });
    for (const z of OZ) M.box((OUTER_X + PLAN.loomX1) / 2, OY[1] + 0.2, s * z, PLAN.loomX1 - OUTER_X, 0.2, 0.2, IR[0], IR[1], { paint: [0, 0, 0, 0] });
  }
  const outer = sheetMesh(OUTER, makeClothMaterial(shared, look, { creep: 0, back: 1 }), OUTER_FREE * (HANG_SWAY + HANG_RIPPLE));
  const frame = new THREE.Mesh(M.build(), makePlainMaterial(shared)); frame.userData = { kind: 'still' };
  scene.add(frame, cloth, hangs, falls, outer);
  // the warp: thousands of taut threads from the warp beam down to the fell, lifted in groups (the shed stands most
  // a little above the fell); a sheet ruled by the thread shader
  const warpGeo = new THREE.PlaneGeometry(1, 1, 92, 8);
  { const p = warpGeo.getAttribute('position'), uv = warpGeo.getAttribute('uv');
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5; p.setXYZ(i, LX, FELL + (PLAN.warpTop - FELL) * v, -WH + 2 * WH * u); uv.setXY(i, u * 1840, v); }
    warpGeo.computeBoundingSphere(); warpGeo.computeBoundingBox(); }
  // (golden threads in bundles of forty, a metre to a bundle, the dark oak of the loom's back between them)
  const warp = new THREE.Mesh(warpGeo, makeThreadMaterial(shared, { color: '#f3cf6a', half: 0.3, group: 40, waves: 3, period: 2.6, lift: 0.8, liftY: 0.2, glow: 1.9, dense: 1, gap: 0.3, warm: 1 }));
  warp.userData = { kind: 'still', reach: 0.8 }; warp.renderOrder = 2;
  // THE HARNESS: the cords fall from the comb board at the head in one great fan, twelve metres broad under the head
  // prism and the warp's whole breadth at their foot, where they take the heddle bars (which lift the warp's bundles);
  // they lift in groups. A ruled sheet between the head's line (uv.y 0) and the bars' line (uv.y 1), n strips across.
  const P = [], U = [], n = 46, top = [[COMB_X - 1, 67.7, -12], [COMB_X - 1, 67.7, 12]], takeY = HEDDLE_Y + HEDDLE_LIFT + HEDDLE_DEEP / 2, foot = [[HEDDLE_X, takeY, -WH], [HEDDLE_X, takeY, WH]];
  const L3 = (pq, t) => [pq[0][0] + (pq[1][0] - pq[0][0]) * t, pq[0][1] + (pq[1][1] - pq[0][1]) * t, pq[0][2] + (pq[1][2] - pq[0][2]) * t];
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, A = L3(top, t0), B = L3(top, t1), C = L3(foot, t1), Dd = L3(foot, t0);
    for (const [pt, u, v] of [[A, t0, 0], [B, t1, 0], [C, t1, 1], [A, t0, 0], [C, t1, 1], [Dd, t0, 1]]) { P.push(pt[0], pt[1], pt[2]); U.push(u * 920, v); }
  }
  const hg2 = new THREE.BufferGeometry();
  hg2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); hg2.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
  hg2.computeBoundingSphere(); hg2.computeBoundingBox();
  const harness = new THREE.Mesh(hg2, makeThreadMaterial(shared, { half: 0.16, group: 10, waves: 7, period: 1.3, glow: 1.25, gap: 0.4, knee: true }));
  harness.userData = { kind: 'still' }; harness.renderOrder = 3;
  scene.add(warp, harness);
  W.loomLook = look;
}
// the loom's movers: the cloth roller, the reed, the shuttles with their trailing threads, the heddle bars, and the two
// creels of spools
const SHUTTLE_FLIGHT = 1.4, REED_ROUND = 0.9, SHUTTLES = 4;
// the shuttles fly one over another just above the fell, SHUTTLE_STEP apart (each SHUTTLE_R thick at the middle and
// 2 SHUTTLE_HALF long: seven metres of bright steel, a shape that reads from the hall's far end); a shuttle rests
// with its whole length inside a side post, SHUTTLE_REST beyond the warp's edge, and is thrown across at one even
// speed; over them, under the warp beam, the heddle bars: six bars across the warp, each HEDDLE_GAP west of the one
// behind, which go up and down HEDDLE_LIFT about HEDDLE_Y in two groups of three, turn about, once in every HEDDLE_ROUND
const SHUTTLE_STEP = 1.45, SHUTTLE_R = 0.7, SHUTTLE_HALF = 3.5, SHUTTLE_REST = SHUTTLE_HALF + 0.3;
const HEDDLE_Y = PLAN.fellY + 6.45, HEDDLE_LIFT = 0.7, HEDDLE_DEEP = 0.6, HEDDLE_X = PLAN.loomX - 1.5, HEDDLE_GAP = 0.2, HEDDLE_ROUND = 1.8;
// THE SHUTTLES' ONE ROUND (as the Mill's waves are parts of one round): the round is twice the time a shuttle's
// middle is inside the warp's breadth on one flight; the round is cut in as many parts as there are shuttles, and
// each shuttle is thrown at a dealt place within its own part, one way on one round and back on the next. Two
// throws that follow one another are therefore less than half a round apart, which is the time a shuttle's middle
// is in the warp: at every clock a shuttle is crossing. By the world's clock alone.
const SHUTTLE_IN = SHUTTLE_FLIGHT * PLAN.warpHalf / (PLAN.warpHalf + SHUTTLE_REST), SHUTTLE_ROUND = 2 * SHUTTLE_IN;
// the creels: three tiers a side stepping up and outward from the hall's middle, forty spools to a tier
const CREEL_X0 = 770, CREEL_STEP = 3.4, CREEL_N = 40, CREEL_TIERS = [[17, 0.24], [19.4, 4.2], [21.8, 8.2]];
// THE LAST CREELS, by places only. The creels' own series (CREEL_X0, CREEL_STEP) goes on east of the gathering bars
// as a low creel on the floor to either hand of the line: every place of the series whose spool stands whole east
// of the bars (its flange SPOOL_R past the bar's east face, BAR_X + BAR_HALF) and whose flange is still LAST_CLEAR
// (a spool's breadth of floor) west of the frames of the take-up rolls, which stand before the loom's breast (their
// west face TAKE_FACE: a frame's cheek 0.4 m beyond its roll). LAST_K0 and LAST_K1 are the first and the last such
// place of the series and LAST_N their count: it falls where it falls. LAST_Z from the line: the gate's half
// breadth, a spool's flange and LAST_HAND more, so that from the line no spool stands before the gate.
// THEIR THREADS, by clear air: each rises BACK, west and up, to the NEAREST gathering bar, its own hand's (and goes
// on from it to the warp beam with the rest), to a place on that bar's outer half, so that it has passed outside
// the hung lengths' rows before it is as high as their feet. It begins LAST_Z from the line's plane and ends
// further out: so none crosses the gateway's breadth and none comes within 9 m of the line (counted with the
// clear air). A thread is CREEL_THREAD broad at its spool (half that breadth to either side).
const SPOOL_R = 1.1, BAR_HALF = 0.4, LAST_HAND = 0.4, LAST_CLEAR = 2 * SPOOL_R, CREEL_THREAD = 0.12, TAKE_FACE = PLAN.fallX - 2 * TAKE_R - 0.4;
const LAST_K0 = Math.ceil((BAR_X + BAR_HALF + SPOOL_R - CREEL_X0) / CREEL_STEP), LAST_K1 = Math.floor((TAKE_FACE - LAST_CLEAR - SPOOL_R - CREEL_X0) / CREEL_STEP);
const LAST_Z = GATE_W / 2 + SPOOL_R + LAST_HAND, LAST_X0 = CREEL_X0 + CREEL_STEP * LAST_K0, LAST_N = LAST_K1 - LAST_K0 + 1;
function buildLoomWorks(W) {
  const { scene, shared } = W, rng = W.RNG.loom, LX = PLAN.loomX, WH = PLAN.warpHalf, FELL = PLAN.fellY, mat = makePlainMaterial(shared);
  // the roller: three metres thick from side post to side post, the cloth wound on it in bands of its own colours
  const cols = W.cloth.map((h) => lin(h, 0.9));
  const wound = (R, half, ends) => {
    const rm = makeMesher();
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2, c = cols[i % 2 === 0 ? 0 : 1 + (i >> 1) % 3];
      const P = (a, z) => [Math.cos(a) * R, Math.sin(a) * R, z], n0 = [Math.cos(a0), Math.sin(a0), 0], n1 = [Math.cos(a1), Math.sin(a1), 0];
      rm.quad(P(a0, -half), P(a1, -half), P(a1, half), P(a0, half), c, [0, 0.4], undefined, [n0, n1, n1, n0]);
      if (ends) for (const e of [-1, 1]) rm.tri([0, 0, e * half], e > 0 ? P(a0, half) : P(a1, -half), e > 0 ? P(a1, half) : P(a0, -half), c, [0, 0.4]);
    }
    return rm.build();
  };
  const roller = new THREE.Mesh(wound(1.5, WH, false), mat); roller.position.set(LX, PLAN.rollY, 0);
  roller.userData = { kind: 'spinZ', R: 1.55, half: WH };
  // the two take-up rolls of the cloth drawn off: the cloth wound on in bands of its own colours, turning at the
  // cloth's own creep (the fall comes down onto a roll's east side)
  const takeHalf = (PLAN.fallZ[1] - PLAN.fallZ[0]) / 2, takeGeo = wound(TAKE_R, takeHalf, true);
  const takeUps = [-1, 1].map((sd) => {
    const m = new THREE.Mesh(takeGeo, mat); m.position.set(PLAN.fallX - TAKE_R, TAKE_R + TAKE_SEAT, sd * (PLAN.fallZ[0] + PLAN.fallZ[1]) / 2);
    m.userData = { kind: 'spinZ', R: TAKE_R + 0.05, half: takeHalf };
    scene.add(m);
    return m;
  });
  // the reed: a bright steel bar across the warp in the warp's own plane, rising 1.5 m up the threads and beating down on the fell
  const bm = makeMesher(); bm.box(0, 0, 0, 0.5, 0.8, 2 * WH, lin('#c4ccd6'), [1, 0.85]);
  const reed = new THREE.Mesh(bm.build(), mat); reed.position.set(LX - 0.35, FELL + 0.45, 0);
  reed.userData = { kind: 'swing', reach: 1.6 };
  // the shuttles, each seven metres long, of bright polished steel (pale against the golden warp), thrown from side
  // post to side post at its own height above the fell, its thread half a metre deep behind it in one of the cloth's
  // colours (the two flowers', the leaf's, ivory), bright
  const sm = makeMesher(), br = [lin('#f1f3f6', 2.1), [1, 0.95]];
  for (const e of [-1, 1]) for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI * 2, a1 = ((k + 1) / 6) * Math.PI * 2, r = SHUTTLE_R;
    sm.tri([Math.cos(a0) * r, Math.sin(a0) * r, 0], [Math.cos(a1) * r, Math.sin(a1) * r, 0], [0, 0, e * SHUTTLE_HALF], br[0], br[1]);
  }
  const sg = sm.build(), weft = [W.cloth[1], W.cloth[2], W.cloth[3], '#e9dfc6'];
  const trailOf = (hex) => { const m = makeMesher(), c = lin(hex, 2.2).map((v) => v + 0.25); m.box(0, 0, 0.5, 0.3, 0.8, 1, c, [0, 0], { skip: '-z+z' }); return m.build(); };
  const shuttles = [], rr = W.RNG.round, roundPhase = rr.range(0, SHUTTLE_ROUND);
  for (let i = 0; i < SHUTTLES; i++) {
    const body = new THREE.Mesh(sg, mat), trail = new THREE.Mesh(trailOf(weft[i % weft.length]), mat);
    // for counts by place: the box a shuttle and its thread never leave (its own height, from side post to side post)
    const y = FELL + 1.1 + SHUTTLE_STEP * i, course = { kind: 'course', lo: [LX - 1.3, y - 0.9, -WH - 2 * SHUTTLE_REST], hi: [LX + 0.6, y + 0.9, WH + 2 * SHUTTLE_REST] };
    body.userData = course; trail.userData = course;
    // (its throw begins at a dealt place within its own part of the one round)
    shuttles.push({ body, trail, start: ((i + rr()) / SHUTTLES) * SHUTTLE_ROUND, y });
    scene.add(body, trail);
  }
  // the spools: a wound body two metres across and three tall between two timber flanges, in the cloth's four colours
  // and the warp's ivory (the upper flange's underside is not drawn: a ring 0.15 m broad about the body, which only
  // the top tier shows from below, from 0.95 m under it at 21.8 m and more: finer than the picture's grain)
  const spm = makeMesher(), z0 = [0, 0, 0], ns = [0, 0];
  spm.rod([0, 0.25, 0], [0, 2.75, 0], 0.95, 10, z0, ns, {}); spm.rod([0, 0, 0], [0, 0.25, 0], SPOOL_R, 10, z0, ns, { capB: true }); spm.rod([0, 2.75, 0], [0, 3, 0], SPOOL_R, 10, z0, ns, { capB: true });
  spm.rod([0, 3, 0], [0, 3.5, 0], 0.12, 5, z0, ns, {});
  const spg = spm.build(), N = 2 * (CREEL_TIERS.length * CREEL_N + LAST_N), sp = new Float32Array(N * 4), m4 = new THREE.Matrix4(), c3 = new THREE.Color();
  const spools = new THREE.InstancedMesh(spg, makeSpoolMaterial(shared), N), palette = [...W.cloth, '#e9dfc6'];
  const cr = W.RNG.creel, cm = makeMesher(), P = [], U = [];
  cm.dress = [7, 0.4, 0, 0];
  let i = 0;
  // a spool's thread: from its head up to its place on its hand's gathering bar, and on from the bar to the warp beam
  const threadOf = (head, bar, beam) => {
    for (const [a, b, wa, wb] of [[head, bar, CREEL_THREAD, 0.09], [bar, beam, 0.09, 0.09]]) {
      const A = [a[0] - wa, a[1], a[2]], B = [a[0] + wa, a[1], a[2]], C = [b[0], b[1], b[2] + wb], Dd = [b[0], b[1], b[2] - wb];
      for (const [pt, u, v] of [[A, 0, 0], [B, 1, 0], [C, 1, 1], [A, 0, 0], [C, 1, 1], [Dd, 0, 1]]) { P.push(pt[0], pt[1], pt[2]); U.push(i * 3 + 0.2 + u * 0.6, v); }
    }
  };
  // the last creels: the series' places LAST_K0 to LAST_K1 (their turning from their own stream)
  for (const s of [-1, 1]) {
    const lr = W.RNG.last, len = CREEL_STEP * (LAST_N - 1) + 3, ty = 0.24;
    cm.box(LAST_X0 + CREEL_STEP * (LAST_N - 1) / 2, ty - 0.12, s * LAST_Z, len, 0.24, 2.5, OAK[0], OAK[1], { skip: '-y' });
    for (let k = 0; k < LAST_N; k++, i++) {
      const x = LAST_X0 + CREEL_STEP * k, f = (k + 0.5) / LAST_N;
      spools.setMatrixAt(i, m4.makeTranslation(x, ty, s * LAST_Z)); spools.setColorAt(i, c3.set(palette[(k + (s > 0 ? 3 : 0)) % palette.length]));
      sp.set([lr(), 0, 0, lr.range(0.5, 1.4) * (lr.chance(0.5) ? 1 : -1)], i * 4);
      // (they take the bar's outer half, so that a thread has passed outside the hung lengths' rows before it is as high as their feet)
      threadOf([x, ty + 3.5, s * LAST_Z], [BAR_X, BAR_Y + 0.4, s * (14.8 + 8.9 * (0.5 + 0.5 * f))], [LX - 0.5, PLAN.warpTop + 1.3, s * (0.6 + 22 * (0.5 + 0.5 * f))]);
    }
  }
  for (const s of [-1, 1]) CREEL_TIERS.forEach(([tz, ty], tier) => {
    const z = s * tz, len = CREEL_STEP * (CREEL_N - 1) + 3, mx = CREEL_X0 + CREEL_STEP * (CREEL_N - 1) / 2;
    cm.box(mx, ty - 0.12, z, len, 0.24, 2.5, OAK[0], OAK[1], { skip: tier ? '' : '-y' });
    if (tier) for (let k = 0; k <= CREEL_N; k += 4) cm.box(CREEL_X0 + CREEL_STEP * (k - 0.5), (ty - 0.24) / 2, z + s * 1.0, 0.3, ty - 0.24, 0.3, OAK[0], OAK[1], { skip: '-y', paint: [7, 0.3, 0, 1] });
    for (let k = 0; k < CREEL_N; k++, i++) {
      const x = CREEL_X0 + CREEL_STEP * k, f = (k + tier / CREEL_TIERS.length) / CREEL_N;
      spools.setMatrixAt(i, m4.makeTranslation(x, ty, z)); spools.setColorAt(i, c3.set(palette[(k + 2 * tier + (s > 0 ? 1 : 0)) % palette.length]));
      sp.set([cr(), 0, 0, cr.range(0.5, 1.4) * (cr.chance(0.5) ? 1 : -1)], i * 4);
      // this spool's thread: up to its own place on its hand's gathering bar, and on from the bar to the warp beam
      threadOf([x, ty + 3.5, z], [BAR_X, BAR_Y + 0.4, s * (14.8 + 8.9 * f)], [LX - 0.5, PLAN.warpTop + 1.3, s * (0.6 + 22 * f)]);
    }
  });
  spg.setAttribute('aSpool', new THREE.InstancedBufferAttribute(sp, 4));
  spools.instanceMatrix.needsUpdate = true; spools.instanceColor.needsUpdate = true; spools.computeBoundingSphere();
  spools.userData = { kind: 'instanced', reach: 0 };
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); cg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); cg.computeBoundingSphere();
  const creelThreads = new THREE.Mesh(cg, makeThreadMaterial(shared, { half: 0.2, group: 3, waves: 3, period: 1.7, glow: 1.5, glint: 1, glintPeriod: 2.4, knee: true }));
  creelThreads.userData = { kind: 'still' }; creelThreads.renderOrder = 3;
  const creelBed = new THREE.Mesh(cm.build(), mat); creelBed.userData = { kind: 'still' };
  scene.add(roller, reed, spools, creelThreads, creelBed);
  const reedPhase = rng.range(0, REED_ROUND);
  // THE HEDDLE BARS: pale timber laths across the warp, hung on the harness' cords; two groups of three, one going
  // up as the other goes down (the shed changing), on the world's clock from the heddles' own stream
  const heddles = [0, 1].map((gk) => {
    // (pale laths HEDDLE_DEEP deep, in bright new timber: two groups that read as two pale lines changing places)
    const hm = makeMesher(), lath = [lin('#ecd9ae', 2.0), [0, 0.3]];
    for (let k = gk; k < 6; k += 2) {
      hm.box(HEDDLE_X - HEDDLE_GAP * k, 0, 0, 0.14, HEDDLE_DEEP, 2 * WH + 0.8, lath[0], lath[1], { paint: [0, 0, 0, 0] });
      for (const e of [-1, 1]) hm.box(HEDDLE_X - HEDDLE_GAP * k, 0, e * (WH + 0.55), 0.2, HEDDLE_DEEP + 0.12, 0.3, MATTER.brass[0], MATTER.brass[1], { paint: [0, 0, 0, 0] });
    }
    const mesh = new THREE.Mesh(hm.build(), mat); mesh.position.y = HEDDLE_Y;
    // for counts by place: the box a group of bars never leaves
    mesh.userData = { kind: 'course', lo: [HEDDLE_X - HEDDLE_GAP * 5 - 0.1, HEDDLE_Y - HEDDLE_LIFT - HEDDLE_DEEP, -WH - 0.8], hi: [HEDDLE_X + 0.1, HEDDLE_Y + HEDDLE_LIFT + HEDDLE_DEEP, WH + 0.8] };
    scene.add(mesh);
    return mesh;
  });
  const heddlePhase = W.RNG.heddle.range(0, HEDDLE_ROUND);
  W.updates.push((dt, time) => {
    const t = time * shared.uTempo.value;
    roller.rotation.z = -(t * 0.3) / 1.5;
    // (a bar rests at the top or the foot of its stroke and changes over in a quarter of the round)
    const hs = Math.sin((2 * Math.PI * (t + heddlePhase)) / HEDDLE_ROUND), lift = HEDDLE_LIFT * (2 * smoothstep(-0.7, 0.7, hs) - 1);
    heddles[0].position.y = HEDDLE_Y + lift; heddles[1].position.y = HEDDLE_Y - lift;
    const f = ((t + reedPhase) % REED_ROUND) / REED_ROUND;
    reed.position.y = FELL + 0.45 + 1.5 * (f < 0.7 ? smoothstep(0, 0.7, f) : 1 - smoothstep(0.7, 0.86, f));
    for (const tk of takeUps) tk.rotation.z = -(t * 0.3) / TAKE_R;
    for (const sh of shuttles) {
      const c = (t + roundPhase - sh.start) / SHUTTLE_ROUND, n = Math.floor(c), fl = clamp(((c - n) * SHUTTLE_ROUND) / SHUTTLE_FLIGHT, 0, 1), dir = Math.abs(n) % 2 === 0 ? 1 : -1;
      const z = dir * (WH + SHUTTLE_REST) * (2 * fl - 1);
      sh.body.position.set(LX - 0.45, sh.y, z);
      const from = -dir * (WH + 0.2), len = Math.max(0.01, Math.abs(z - dir * SHUTTLE_HALF - from));
      sh.trail.position.set(LX - 0.45, sh.y, Math.min(from, z - dir * SHUTTLE_HALF)); sh.trail.scale.set(1, 1, Math.abs(z) > WH ? 0.01 : len);
    }
  });
}
// ---------------------------------------------------------------- the world itself
// (the flywheel's pull is a short one, 47 m of route from its start to the hub abeam: its weight is held to
// FLY_PULL so that the camera's eased turn stays under 30 degrees a second as it comes on and as it lets go)
const CRUISE = 23, MILL_SPEED = 13, PULL_RAMP = 40, FLY_PULL = 0.45;
// THE GAZE ON THE ROUND (a typed measure of the design): GAZE_LEAN degrees inward of the heading. HAND_BEAR: the
// round's bearing at which the way out's pull begins to come on. REACH: the camera's own reach along the line.
const GAZE_LEAN = 73, HAND_BEAR = 82, REACH = 34;
// CAM_FOV: the camera's own field, in degrees of height. A field of the camera only: no place is laid by it.
const CAM_FOV = 62;
// the cloth's five deals: [ground, flower, flower, leaf]. EVERY GROUND IS DEEP (blue, violet, green, crimson,
// black-brown); ivory is a flower's colour only
const CLOTHS = [['#1c2f5e', '#d9a520', '#b3202e', '#1f6b5a'], ['#3a1d5c', '#e9dfc6', '#b3202e', '#2a8a6a'], ['#17402f', '#d9a520', '#f1ead8', '#d98a9a'],
  ['#8f1a26', '#d9a520', '#e9dfc6', '#3d5f8f'], ['#1c120d', '#c9ccd2', '#d9a520', '#3d5f8f']];
export default {
  id: 'loom-of-numbers',
  name: 'The Loom of Numbers',
  category: 'books',
  placeKind: 'interior',
  book: 'Notes on the Analytical Engine',
  author: 'Ada Lovelace, 1815 to 1852',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    // the viewer's graphics level thins what is plentiful only: the steam's puffs, and the upper and under faces of
    // the near fan's wheels (their rims, the fingers and every mover stay)
    const detail = ctx.quality?.detail ?? 1;
    // every stream of the world, taken here in one list before anything is laid; each draws from no other
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('loom-' + name + ':' + ctx.seed));
    const RNG = { look: stream('look'), store: stream('store'), drive: stream('drive'), mill: stream('mill'), cards: stream('cards'), loom: stream('loom'),
      // the streams of this round's new things, each its own: the sheer falls, the chains that go on to the loom's head,
      // the hung lengths, the creels' spools, the racks' numbers, the cloud banks beyond the glass
      falls: stream('falls'), head: stream('head'), hangs: stream('hangs'), creel: stream('creel'), racks: stream('racks'), sky: stream('sky'),
      // the streams of the mend round's new things, each its own: the heddle bars' phase, the hung lengths' breathing
      // in the hall's draught, the bolts of finished cloth on the galleries
      heddle: stream('heddle'), draught: stream('draught'), bolts: stream('bolts'),
      // the streams of the second mend round's new things, each its own: the outer lengths of the end wall (the
      // drawn cloth), the last creels before the gate, the shuttles' one round
      drawn: stream('drawn'), last: stream('last'), round: stream('round'),
      // which chain of cards is of which pasteboard, made after every other stream: the hall's order of dyes and the
      // curtains' leads (hall), then a stream to each thing whose chains are dealt one by one: each curtain's loops,
      // the walls' falls, the link's falls
      dye: { hall: stream('dye'), curtains: CURTAIN_X.map((x, c) => stream('dye-curtain-' + (c + 1))), walls: stream('dye-walls'), link: stream('dye-link') } };
    // the look the seed deals: the sun's height and bearing, the haze, the cloth, the Store's ranks, the low bay's hand
    const lk = RNG.look, hour = vary.hour;
    const sunUp = hour === 'dawn' ? lk.range(12, 16) : hour === 'golden' ? lk.range(16, 22) : hour === 'day' ? lk.range(32, 40) : lk.range(12, 40);
    const sunBear = lk.range(15, 40), haze = lk.range(0.0008, 0.0015), cloth = CLOTHS[lk.int(0, CLOTHS.length - 1)];
    const ranks = lk.chance(0.6) ? 3 : 2, lowSide = lk.chance(0.5) ? -1 : 1, tempo = 0.95 + 0.1 * vary.mood;
    const D = Math.PI / 180, low = 1 - smoothstep(12, 30, sunUp);
    const sunDir = new THREE.Vector3(Math.cos(sunUp * D) * Math.cos(sunBear * D), Math.sin(sunUp * D), Math.cos(sunUp * D) * Math.sin(sunBear * D));
    const sunColor = new THREE.Color('#fff1cf').lerp(new THREE.Color(hour === 'dawn' ? '#ffd9b8' : '#ffe2b4'), low);
    const shared = makeShared({ sunDir, sunColor, sunPower: 3, fogDensity: haze, ranks, clothA: cloth[0], clothB: cloth[1], clothC: cloth[2], clothD: cloth[3], tempo });
    const W = { ctx, scene, shared, RNG, vary, detail, ranks, lowSide, cloth, updates: [] };
    // the racks' salts, one to a hall (eighths, so that a bar's number can be rounded back to its grid where a fragment
    // reads it): every bar's period, reach and phase come of its own number and its hall's salt
    W.rackSalt = { store: RNG.racks.int(0, 400) / 8, drive: RNG.racks.int(0, 400) / 8, mill: RNG.racks.int(0, 400) / 8 };
    // the cloud banks beyond the glass: where the sheet lies at the clock's nought, and its slow drift (the sky's stream)
    { const sk = RNG.sky, a = sk.range(0, Math.PI * 2), v = sk.range(0.012, 0.024); W.cloud = new THREE.Vector4(sk.range(0, 40), sk.range(0, 40), Math.cos(a) * v, Math.sin(a) * v); }
    scene.background = new THREE.Color('#b4c6d8');
    // the line
    const route = layRoute(), path = makePath(route.pts);
    W.path = path; W.route = route;
    await ctx.yield();
    // floor and shell
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1040, 160, 1, 1).rotateX(-Math.PI / 2).translate(465, 0, 0), makeFloorMaterial(shared));
    floor.userData = { kind: 'still' };
    scene.add(floor);
    W.floorMat = floor.material;
    const M = makeMesher(), G = makeGlassMesher();
    await ctx.yield();
    await shellStore(M, G, ctx); await ctx.yield();
    W.wallPins = [];
    shellMill(M, G, W.rackSalt.mill, W.wallPins, 0); await ctx.yield();
    shellMill(M, G, W.rackSalt.mill, W.wallPins, 1); await ctx.yield();
    shellCards(M, G); shellLoom(M, G); await ctx.yield();
    W.plain = makePlainMaterial(shared, { side: THREE.DoubleSide });
    const shell = new THREE.Mesh(M.build(), W.plain), glass = new THREE.Mesh(G.build(), makeGlassMaterial(shared, W.cloud));
    shell.userData = { kind: 'still' }; glass.userData = { kind: 'still' };
    scene.add(shell, glass);
    await ctx.yield();
    await buildStore(W); await ctx.yield();
    buildDrive(W); await ctx.yield();
    buildBelt(W); await ctx.yield();
    buildBridges(W); await ctx.yield();
    buildSteam(W); buildShaft(W); buildAir(W); await ctx.yield();
    const storeIron = new THREE.Mesh(W.storeIron.build(), makePlainMaterial(shared));
    storeIron.userData = { kind: 'still' };
    scene.add(storeIron);
    await ctx.yield();
    buildCards(W);
    await ctx.yield();
    buildLoom(W); await ctx.yield();
    buildBolts(W, LOOM_GAL.slice(0, 2)); await ctx.yield();
    buildBolts(W, LOOM_GAL.slice(2)); await ctx.yield();
    buildLoomWorks(W);
    await ctx.yield();
    // the Mill's works (the hero)
    const hero = await buildHero(ctx, { shared, rng: RNG.mill, rare: vary.rare, detail, plainMaterial: makePlainMaterial(shared), rackSalt: W.rackSalt.mill });
    scene.add(hero.object); W.hero = hero;
    await ctx.yield();
    // the flight's pace by place: slower inside the Mill's drum
    const P = new THREE.Vector3();
    const paceAtX = (x) => lerp(1, MILL_SPEED / CRUISE, smoothstep(PLAN.archW - 20, PLAN.archW, x) * (1 - smoothstep(PLAN.archE, PLAN.archE + 20, x)));
    const pace = (u) => paceAtX(path.pointAt(clamp(u, 0, 1), P).x);
    let seconds = 0;
    for (let m = 0; m < path.length; m += 2) seconds += 2 / (CRUISE * paceAtX(path.posAtDist(m + 1, P).x));
    const DURATION = clamp(seconds, 35, 50);
    // THE PULLS OF THE GAZE, four, each written by places of the house; where a place lies along the line is found on
    // the line itself, in metres of route. ONE LAW OF RISE AND FALL for all four: a pull comes on over PULL_RAMP metres of
    // route and lets go over the same; a pull shorter than twice PULL_RAMP comes on over half its own length and
    // lets go over the other half. Each pull's point is a place of its thing, found from u inside the pull.
    const L = path.length, C2 = [PLAN.cx, PLAN.cz], D2 = Math.PI / 180;
    const metreOf = (test) => { for (let m = 0; m <= L; m += 0.5) if (test(path.posAtDist(m, P))) return m; return L; };
    const pull = (m0, m1, weight, at, more = {}) => ({ from: m0 / L, to: m1 / L, fade: Math.min(0.5, PULL_RAMP / (m1 - m0)), weight, arc: true, at, ...more });
    const Q2 = new THREE.Vector3(), Q3 = new THREE.Vector3(), Q4 = new THREE.Vector3(), Q5 = new THREE.Vector3(), E = new THREE.Vector3();
    // the inner columns' ring (its radius) and the columns' middle height, from the Mill's own layout
    const innerR = PLAN.ribR[0], colMid = PLAN.millFoot + PLAN.millWheels * PLAN.millBand / 2;
    const GAZE_ON = GAZE_LEAN * D2 - Math.acos(ROUND_R * Math.cos(GAZE_LEAN * D2) / innerR);
    const mHand = metreOf((p) => p.z > 1 && Math.atan2(p.z - C2[1], p.x - C2[0]) <= HAND_BEAR * D2);
    const pois = [
      // THE FLYWHEEL, its hub. From the first metre of the route from which the wheel's WHOLE FACE is clear of the
      // north inner rank's last column (the straight line from the eye to the wheel's west rim passes east of that
      // column's foot: found on the line itself, the same place on every seed) until the hub is abeam (the wheel is
      // then behind the heading's quarter and is let go).
      pull(metreOf((p) => p.x + (FLY.x - FLY.R - p.x) * (-PLAN.rankZ[0] - p.z) / (FLY.z - p.z) >= RISE0 + PLAN.storeR * 1.3), metreOf((p) => p.x >= FLY.x), FLY_PULL, () => Q2.set(FLY.x, FLY.y, FLY.z)),
      // THE MILL, whole from the west arch's plane (by the one law of rise it comes on over the PULL_RAMP before that
      // plane, in the link, where its point lies all but straight ahead) to the place where the way out's pull has
      // wholly come on. So through the arc in the gaze already rests on the fans while the line swings south. ONE LAW
      // FOR THE WHOLE ROUND: the gaze stands GAZE_LEAN degrees inward of the round's own heading, which is to look at the
      // point on the ring of the fans' inner columns GAZE_ON degrees of bearing on from our own, at the columns'
      // middle height (GAZE_ON follows from the lean, the round's radius and that ring's). So the Mill's centre, the
      // barrels in the lantern's shaft, stands 90 less GAZE_LEAN degrees to the inward side of the picture's middle
      // (never abeam), the fans' columns and their waves before it, the rib end coming up is the near thing on the
      // heading's side, and the drum wall keeps to the picture's outer quarter. The pull has its whole weight (and
      // keeps it for the steady camera: the round turns about its subject), so the pose is this law itself.
      pull(metreOf((p) => p.x >= PLAN.archW) - PULL_RAMP, mHand + 2 * PULL_RAMP, 1,
        (time, u) => { path.pointAt(clamp(u, 0, 1), E); const b = Math.atan2(E.z - C2[1], E.x - C2[0]) - GAZE_ON; return Q3.set(C2[0] + innerR * Math.cos(b), colMid, C2[1] + innerR * Math.sin(b)); }, { steady: true }),
      // THE WAY OUT, from the round's place at bearing HAND_BEAR (where the east arch stands whole before the heading)
      // until the line is on the Cards' axis and the pull has let go (the route's own gaze is then the same): the
      // point of the house's axis the camera's own reach east of our place, never west of the plane x = JAMB_X (the
      // east arch's opening by the plan's measure, on the drum's own circle), at the eye's own height. From the
      // round that is the arch's middle; from the axis it is the Cards straight ahead.
      // Listed after the Mill's pull, it takes the gaze from it as it comes on, by the one law of rise.
      pull(mHand, metreOf((p) => p.x > C2[0] && p.x >= route.xb && Math.abs(p.z) < 0.01) + PULL_RAMP, 1,
        (time, u) => { path.pointAt(clamp(u, 0, 1), E); return Q5.set(Math.max(JAMB_X, E.x + REACH), E.y, 0); }, { steady: true }),
      // THE LOOPS OVERHEAD, by the thing looked at: the gaze leans up while loops hang over the line, from the first
      // curtain's first loop (CURTAIN_X[0] less CURTAIN_REACH) to the second curtain's last card (CURTAIN_X[1] and
      // CURTAIN_REACH). By the one law of rise and fall it comes on over the PULL_RAMP before the first of those
      // two places and lets go over the PULL_RAMP after the second. Its point: a point of the hall's middle line
      // one curtain's whole reach before our own place, at the height where the y 35 rail's loops hang lowest. The
      // gaze leans up into the loops and the sun through them; the point slides with the place, so loop after loop
      // comes down over us and passes.
      pull(metreOf((p) => p.x >= CURTAIN_X[0] - CURTAIN_REACH) - PULL_RAMP, metreOf((p) => p.x >= CURTAIN_X[1] + CURTAIN_REACH) + PULL_RAMP, 0.6,
        (time, u) => { path.pointAt(clamp(u, 0, 1), E); return Q4.set(E.x + 2 * CURTAIN_REACH, LOOP_LOW[35][0], 0); }),
    ];
    return {
      scene, path, duration: DURATION, pace,
      ride: 'none', companion: 'none',
      camera: { fov: CAM_FOV, near: 0.3, far: 1300, lookAhead: REACH, sway: 1, bank: 0 },
      pois,
      portal: { shape: 'arch', width: GATE_W, height: GATE_H, color: '#ffe9c0', glow: 1, revealDistance: 1200 },
      post: { exposure: 1, bloom: { strength: 0.32, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.05, vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        shared.uTime.value = time;
        hero.update(dt, time);
        for (const f of W.updates) f(dt, time);
      },
      dispose() {},
    };
  },
};
