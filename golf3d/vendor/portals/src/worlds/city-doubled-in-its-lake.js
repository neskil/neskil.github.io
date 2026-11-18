// Valdrada, Verandas Over Still Water (from Invisible Cities by Italo Calvino, 1923 to 1985).
// A steep crescent city of open verandas on a windless lake in the first hour of the morning (round 5: each veranda
// a gallery before the house's wall, the room seen through its doorway and shuttered windows; gold in the low sun,
// blue-violet in the shade; on the crest an arcade of two storeys and, beside it, a veranda house grown tall:
// seven timber galleries under one low slate roof with a deep dark eave; mending 2: no tower of stone stands there),
// standing on a second whole city BUILT under the waterline: the same city turned about the water's plane.
// The place simply stands; nothing begins, turns or ends as we come.
//
// THE DOUBLING (src/parts/city-doubled-in-its-lake.js, makeDoubler): one maker lays every standing and moving thing of
// the upper city a second time in a group scaled y -1, over the same geometry, the same instance buffers, the same
// shader and the same clock. HOW THE LOWER CITY IS LIT: the shader lights in the city's own space, before the turn
// about the plane, with the city's own sun and one baked shade map; so the lower city's sun stands below the plane
// and its shade falls where the upper city's falls. LOWER TONE: one typed figure, LOWER_TONE = 0.32 (red x 0.68,
// green x 0.84, blue x 1, haze x 0.68): cooler, clearer, a shade deeper; a built city, never blurred, bent or
// dimmed to a reflection. The second sky is the same dome read with the height's sign taken off.
// THE JOINS (laid once, not doubled): two broad water stairs of pale stone go straight down through the plane to
// a landing under it, each between two straight stone rails with lantern newels on each rail, above and
// below, dark risers, and a bright line where the water cuts the steps (one on the quay at the foot of the
// fourth stair lane, 6 m wide and 3 m down, under the line; one in the harbour, out from the head's quay, 6 m
// wide and 5 m down, under the steep look; under the plane both flights' treads are deeper than above it (the
// harbour's two thirds as bright, with a pale lit nosing on every tread; the quay's less than half), and the
// lanterns larger, so the flights tell through the water as stone steps); eight taut mooring
// chains (six along the quay's face beside the stair, dark iron with links 0.32 m wide; two heavier ones on the
// harbour's head quay) each cross their
// doubles as an X at the waterline, in a ring of light; every arch of the quay and of the causeway springs at the
// waterline and closes with its double into a whole ring; the jetty's piles run through. (The pale hoop is gone.)
// THE JOINS' LIGHTS BY THE HOUR (the newels' lanterns, the bright line on a water stair, a chain's ring): each
// burns at any hour, by day at six tenths of its night's light. A CHAIN'S RING BY NIGHT keeps a fifth of that
// (0.2 against a lantern's 1; a third of the ring's own light by day): it lies half under the quay's face, a
// ripple on dark water and no white crescent.
//
// TRIANGLES: both cities together with the joins, by the build's own count on the densest seed of 1 to 300 (seed
// 147, counted in round 5 mending 7): 474,784; rendered with the portal's ring 475,795 to 475,893, in 82 to
// 84 calls. The owner's limit is 500,000, the lead's 480,000 rendered. BEYOND SEEDS 1 TO 300 A SEED CAN
// BUILD MORE: seed 1947 builds 479,890 and renders 480,869 to 480,967, over the lead's 480,000 and under
// the owner's 500,000.
//
// WHAT IS DRIVEN BY WHAT. The world's clock (uTime) drives: curtains, blinds and
// pennants (each on its own dealt phase), the folds that travel over them, lamps on their chains, the lamps' flicker
// and the light it throws on its room, the boats' roll, the tree tops, the chimneys' smoke, the lapping skin of
// light, the boats' rings, the lake's slow swell, its two trains of long low ripples and its cat's-paws (patches
// of ruffled water that drift: faint inside the bay, of one strength on all open water outside it, beyond the
// horns and beyond the causeway alike; none near the quay, in the basin or round the islets), the curtains that
// stir in every second open doorway, the far water's soft glints by day (glints of 5 and 20 m, one cell in five
// on slow clocks, on the open water outside the bay and from 70 to 190 m out from the quay),
// the sun's glitter path (sparks on the lens's side, quick glints on to the horizon), the rings round the
// causeway's piers and the jetty's piles, the near water's long ripples in drifting patches and the hand's
// breadth by which the lower city sways where they pass, the water's light playing under EVERY arch by day (a
// fine faint net at the stones' scale on down-facing stone, whole to 9 m over the plane and gone by 24 m), the
// pennants on every gate house, every islet house and the near rock's house (standing things: each a narrow
// strip of ochre-grey linen hanging straight from a short yard, swaying slowly from it; none on a tower of
// the crescent or on a roof's peak), the leaves' stir in every crown, hedge and hanging green of the city,
// the flank walls' among them (the lake rocks' cypresses and bushes, 55 m and more from the line, stand
// without it), the standing lanterns' glow, the breath of air
// (five patchy bands that shiver the lower city where they pass), the high cloud, the stars.
// u drives the camera only (pace, gaze pulls: two light pulls toward the crest (its tall house), over the bay
// and on the jetty; from the rising street's top the gaze lies a little down along the shore, across the
// harbour's mouth onto the pier, then tips into the well; past the well it swings to the causeway and holds it
// round the whole turn). Nothing is driven by the metres flown, the lens's place or our nearness (no law bends
// the near double by the lens).
// DECLARED PACINGS: none. No companion. No figure at all.
//
// WHAT READS THE LENS (section 153), all of it, by where the eye IS and never by where it looks:
// THE DOME follows the camera's place (a sky at infinity); the smoke's dabs face the eye about their own places.
// FADES OF FINE DETAIL BY THE EYE'S DISTANCE (each spares a detail from shimmer far off; from, to, in metres):
// the facade's fine detail, whole at the eye, gone by 90; the louvres 8 to 18; the rail's shadow drawn baluster
// by baluster to 4, one even shade from 6.5; the water's net under the arches 25 to 60; the water's 5 m glints
// in from 60 to 150 and out from 350 to 700; its 20 m glints in from 350 to 700; its fine sparkle out by 260;
// the sheet's far sheen 120 to 900 (the same fade weakens the long ripples by six tenths and the cat's-paws'
// shiver by eight tenths); the brightening of the shore's rings and a slow noise of the sheen, whole at the eye
// and gone by 160; the sun's far path's sheen in from 40 to 160 beyond the lower sun, from 150 to 400 at it; the
// haze (the air itself, by the distance).
// FILTERS BY THE PIXEL'S OWN FOOTPRINT (fwidth; a line finer than a pixel is weighed, not left to flicker): the
// rail's balusters; the jetty's planks, their tones and seams (gone where a plank is under a pixel wide); the
// bright line at the waterline; the boats' wide rings (footprint on the plane 1.25 to 2.5 m), the piers' and
// piles' rings (0.6 to 1.2 m), the breath band's brightening and flecks by day (3 to 9 m).
// LIGHT ON WATER AND ON GLASS (a mirror's law: the eye's place against the place lit): the glass's glint; the
// warm rim on roofs and towers; the water's Fresnel and its sheen by the angle at which the water is seen; the
// long ripples' two weights by that same angle (strong where the sheet is seen low, soft bands where it is seen
// steeply); the cat's-paws of the open lake by that angle (none where the sheet is seen steeply); the harbour's
// pale sky on its water by that angle; the sun's glitter path by the bearing and height of the sun against the
// line from the water to the eye.
// Nothing is placed, hidden, moved or sized by the lens: no law moves a built point by it.
//
// THE RULES OF PLACE (typed once, for the whole way and every seed; all measured from the flown LINE, a standing
// thing of the world laid at the build, or from a built thing):
// LINE_N = 4, LINE_H = 6: nothing afloat or standing that the deal lays (boats, mooring posts, floats, buoys,
// trees, pergola posts, a house's roof, the rim's pots, the quay's lamp posts and masts, the islets' footing
// stones) lies within 4 m of the line's plan where the line is less than 6 m over its top; what the rule takes
// is drawn first and tested after, and every bay of every house dealt takes its draws whether it is laid
// whole, plain or not at all, so no stream's draws are changed by THE LINE'S DISTANCE from a thing. ONE
// THING OF THE DEAL IS FOUND FROM THE LINE'S PLAN ITSELF: the garden terrace's length (below); the lots past
// the east bastion begin where it ends, so they move with it, seed by seed. Three things take their PLACE
// from the line and their draws as they come: the near rock (ROCK_OFF), the roadstead's piles (the rock's
// side toward the line) and a mooring's berth (the post on the boat's side toward the line).
// MOORINGS: MOOR_OFF 12 to 20 m (a post with a ring stands that far from the quay's face, anywhere from the west
// horn to the harbour's mouth, and that far from the jetty's axis), MOOR_GAP 13 m (no two posts off the quay,
// off the jetty or in the roadstead stand nearer than that: 13.0 m and more on seeds 1 to 300. It is NOT asked
// of the field's row, whose posts stand a quarter of the piers' pitch apart, 9.4 m along the row, nor of the
// harbour's berth posts, which stand by their boats, 4.4 to 22.9 m from the nearest other of them), MOOR_POST
// 2.4 m (its height over the plane: one plain tall pile of one timber tone, 0.3 m thick, its top cut on a slant,
// a small dark ring at its side). THE POST AND ITS BOAT: every boat moored at a post lies BESIDE it, MOOR_BESIDE
// 2.2 m from the post to the hull's axis (the nearest gunwale 1.4 m and more away), the post abreast of the
// hull's quarter, MOOR_QUARTER 1.5 m from its middle, ON THE BOAT'S SIDE TOWARD THE FLOWN LINE BY DISTANCE IN
// SPACE (of the two places beside the hull, the one nearer the line itself, measured from the plane to the
// line at its height; not by the plan); every post stands 2.2 m from its own boat's axis and none nearer
// than 2.19 m to any hull's axis (2.198 m at the least on seeds 1 to 300). HULL AGAINST HULL:
// HULL_GAP 1.5 m of clear water and more between any two hulls' outlines wherever they lie (1.54 m at the
// least on seeds 1 to 300); of two that would crowd, the later comer is not laid, nor its post, after its
// draws. MAX_BOATS 40: every boat has its rings on the water (38 boats at the most on seeds 1 to 300).
// THE MOORING FIELD: MOOR_ROW 8 posts in a row MOOR_FIELD 10 m off the lake faces of the two gate houses beside
// the jetty's ring, three to five boats; MOOR_STAG 2.5 m: every second post of the row stands that far out of
// the row's line toward the lake, by its place in the row and no draw (neighbours 9.7 m apart).
// THE HAND OF THE BOWS, by the mooring's kind (typed, the same on every seed): off the quay toward the west
// horn, off the jetty toward the ring, in the field toward the open lake, in the roadstead toward the
// causeway's foot; each turned 0.05 to 0.4 rad to the open water (the roadstead's toward the line). So the
// way's run past a mooring meets its boat bow first. Counted on seeds 1 to 300 against the line's direction at
// its nearest place in plan: every boat of the jetty, the field and the roadstead heads against it, and every
// quay boat against the line's run along the quay; THE EXCEPTION: 137 of the 4,104 quay boats, those 14 to
// 24 m from the jetty's root, lie nearest the line's END on the jetty, which passes them a second time from
// abaft the beam. NOT OF THIS HAND AT ALL: the harbour's berth boats (bow on to the west flank and to the
// head's quay), the harbour's two boats lying free (any heading, by a draw) and the second islet's four (two
// along its quay's front, one along each side).
// NEAR DETAIL BY THE DISTANCE FROM THE LINE (laid at the build, the same along the whole way): a house is laid
// whole within 52 m of the line, plainer to 110 m, plainest beyond; curtains in full form within 40 m; gallery
// posts on every floor within 44 m; the rail's top and a cloth over the rail within 42 m (none within 9 m);
// the hanging lamp within 31 m; a room's things within 24 m; THE ENFILADE'S LAMP: on a quay house's first
// veranda within 30 m of the line one bay in seven is three rooms deep with a lamp left burning; an arcade's
// reveals are built within 27 m of the line (a plain face with its arches drawn beyond); green swags hang on
// the arcades beside the rising street on houses 9 to 26 m from the line; a chimney smokes with its full body
// (fourteen puffs for eight) within 60 m of the line and on the three chimneys nearest it. THE HOUSES THAT
// STAND FREE (the harbour's, the inlet's flank stacks, the mole row's, the islet houses) are laid whole with
// every near thing at any distance; the crest house, 135 m and more from the line, takes its galleries' near
// things as at 20 m; the gate houses go by their distance like any house (the four by the jetty's ring stand
// 26 to 27 m from the line and are whole; the two further out, 60 to 65 m off, are plainer).
// THE GARDEN TERRACE: past the east bastion the quay is a planted terrace, dealt as a garden from the start,
// as far as where the line's plan crosses the quay houses' front line outward and three bays (one lot's
// width) further: 37.5 to 40.2 m on seeds 1 to 300, found from the plan on every seed (the quay's lots past
// it begin where it ends). THE RISING STREET'S THREE PLANTED BAYS: up
// to two carry low cypresses, 2.8 to 4.5 m (a bay in four stands empty by a draw; the third's, by the
// street's top, the rule of the line always takes); a tree's long shadow lies across the street at the bays
// that carry a tree and at no other.
// THE LAKE ROCKS: two rocks, each with its small house, dealt on the open lake 200 to 290 m from the bay's
// centre, 100 to 165 degrees round from the bay's middle, one to each hand. THE FAR ISLET stays where it is
// dealt (the one across the bay's axis from the causeway's foot). THE NEAR ROCK is the other, set by the same
// three draws abreast of the causeway's second span on its lake side, out across the line, its middle
// ROCK_OFF 70 to 110 m beyond the line's plan (its feet 55 m and more from it), its long axis along the
// causeway turned 0.05 to 0.3 rad, the end toward the second islet swung out. It is 48 to 58 m long and 19
// to 24 m broad on seeds 1 to 300. THE LAW OF CRAGS (every figure, place, point and facet from the stream
// road): CRAG_N 4 or 5 crags of unlike size standing into one another: ONE GREAT CRAG at one end, CRAG_GREAT
// 12 to 16 m high and 14 to 20 m broad at its foot, of three points; beside it THE HOUSE'S CRAG, CRAG_HOUSE 8
// to 11 m, a block level on top; then two low stones, CRAG_LOW 3 to 7 m, of two points each; a fifth, if
// dealt, a low stone before the join of the great crag and the house's. No two points of a crag, and no two
// low stones, are alike in height by less than a metre; every side is steep and takes the damp band at the
// water. ROCK_TONE 0.67: the rock is the quay's ashlar at two thirds, three quarters of the way to grey, a
// touch cool. ITS HOUSE stands on a terrace of the bastions' pale stone on the level crag (the terrace's wall
// carried down up to 3 m), a mast of 6 m with a pennant on its ridge and two or three cypresses, 3.6 to 6 m,
// in a clump at one end of the terrace. THE FAR ISLET takes the same law at two thirds (every height, and
// every crag's plan but its house's); it has no mast and no cypress: three low bushes on its two low stones.
// BY NIGHT WHAT STANDS ON THE OPEN LAKE IS DARK AS A WHOLE, and the law reads the thing itself, not its
// place: the two rocks with their houses and the islets' footing stones are one mesh of their own, which by
// night keeps 0.15 of its light wherever it stands; the near rock's pennant and yard are as dark by their
// tones (0.12 and 0.15 of their day's).
// THE ROADSTEAD: ROAD_N 2 to 3 boats lie off the near rock ON ITS SIDE TOWARD THE LINE (the side nearer the
// line by distance in space), each beside its own tall pile by the moorings' rules as they stand (MOOR_GAP,
// MOOR_BESIDE, MOOR_QUARTER, the pile on the boat's side toward the line by distance in space, HULL_GAP, the
// rule of the line). A pile stands ROAD_OFF 15 to 40 m from the rock's outline, the crags' feet (its draw is
// held 2.7 m inside both ends, so the boat's middle, 2.7 m from its pile, keeps them too: piles 17.7 to
// 37.8 m, boats' middles 15.1 to 37.4 m on seeds 1 to 300; every pile 2.2 m from its boat's axis, the boat
// heading along the causeway and turned by the causeway's own normal). ROAD_SPAN 68 m: the piles are spread
// along the rock's axis over 0.6 of that to either hand of its middle, each in its own half or third of
// the reach.
// Every draw of it comes from the stream road; the boats' stream is not touched. Two boats lie there on 139
// seeds of 1 to 300, three on 161.
// THE ISLETS' FOOTING (the opening's islet and the bay's): at each of a plinth's four corners FOOT_N 2 or 3
// stones stand in the water (8 to 12 an islet), fanned out from the corner (22, 45 and 68 degrees from one
// face, or 30 and 60), FOOT_OUT 1 to 3 m long from the plinth's foot and 0.7 to 1.2 m broad, FOOT_H 0.5 to
// 1.6 m over the plane, of the lake rocks' tone and facets (ROCK_TONE), with the damp band; none before an
// arch's mouth or the water stair (a corner faces neither). Every draw from the stream flank. A stone is
// left out, after its draws, where the rule of the line refuses it or where it would leave less than half a
// metre of water to a hull, to a mooring pile or to the bay islet's bridge: FEWER STONES WHERE BOATS AND
// THE BRIDGE LEAVE NO WATER. On seeds 1 to 300 the opening's islet keeps 8 to 12 on every seed, the bay's 8
// to 12 on 222 seeds and 4 to 7 on 78.
// THE STAIR LANES' FLANK WALLS (in every lane's gap on every tier, the walls that face the lake: the gap's
// wall on either hand of the stair, the second and third flights' walls): FLANK_NEAR 30 m: a gap's walls are
// NEAR where the line passes within 30 m, in space, of the gap wall's foot at the lane's middle (asked 2 m
// over the tier's floor). ON A NEAR WALL every blind arch that stands whole and clear (a bay to every 6.4 m,
// the wall's head 5.2 m and more there, its middle 1.9 m and more from a house's flank, 0.8 m from the
// stair's end, 1.1 m from a flight wall's ends, the opening whole under the arch's crown) holds, set 0.22 m
// back in jambs and a lintel of the parapets' stone, A TIMBER DOOR of two leaves, 1.7 by 2.5 m, on a stone
// step (the gap's wall only, three arches in five there) or A SHUTTERED WINDOW, 1.6 by 2 m, on a stone sill
// (the rest, and every arch of a flight's wall), in the houses' shutter tones; at one arch in two GREEN
// hangs from the wall's head over it, three strips 1 m wide and 1.2 to 3 m long; A STRING COURSE of that
// stone, 0.28 m high, runs at each landing's height (6 and 12 m over the tier's floor on the gap's wall, at
// its own landing on a flight's) and stops 2 m either side of an arch that reaches that height. Every arch
// of every flank wall takes its draws from the stream flank, near or not. A wall further off stays plain.
// A WALL'S FACE WITHOUT A BLIND ARCH STAYS PLAIN, near or not: the first flight's wedge wall carries nothing;
// a stretch of a near wall whose head is under 5.2 m carries no opening and no green, the string course
// alone. On seeds 1 to 300: 1 to 3 near gaps a seed (2 on 262), 1 to 4 furnished arches each, 266 triangles
// each at the most (532 with the double).
// TWO MASTS of 6.5 m with a pennant each flank the water stair's head: at the quay's edge 6 m to each side of
// the fourth lane's foot, found from the plan on every seed.
// ALSO ASKED OF THE RULE OF THE LINE: the west rim's pots, the quay's lamp posts (none from the rising street's
// foot to the east bastion: the street's body, the west bastion, the harbour's mouth and the pier stand on the
// quay's edge there), the two masts. NOT ASKED, as the street's own fittings: the balustrade's lanterns. THE
// BALUSTRADE'S DISTANCE FROM THE LINE'S PLAN, as it is: 2.6 to 2.95 m from the rising street's foot to 40 m
// before its top; then the line eases out toward it: under 2.4 m from 32 m before the top, 1.2 m at 20 m,
// 0.7 m at the least, 12 m before the top; there it turns INLAND from it, over the west bastion's top and the
// harbour's water (2.9 m off at the street's top, 10 m by the inlet's middle): the line's plan never crosses
// the balustrade's. Every lantern of the rising street stands inside LINE_N (1.1 to 2.9 m from the plan, the
// line 0.8 to 3.1 m over its top) and the rule would take every one. They keep a typed stretch instead: none
// stands from 9 m before the street's top to 2 m past the inlet's middle (the street's last 9 m, the west
// bastion's rim, the west half of the harbour's mouth), and on the street's last 40 m they have no stem; so
// each of the SIX on the rising street has its top 2.7 m and more from the line in space (seeds 1 to 300).
// A lantern is laid only where the balustrade stands under it, west of the harbour's mouth: none over the
// open mouth.
// THE GAZE: SWING_RATE 2.5 degrees a metre (how fast it swings from the well up to the bay's islet house, the
// second islet's place on the plane, and from there round to the causeway): at the slow pace of that stretch,
// 8 m a second, that is 20 degrees a second of THE GAZE'S OWN TURN. The way turns under it there as well:
// with the way's own turn the camera tool reads 26.4 to 26.8 degrees a second on seeds 1 to 300, under its
// bound of 30. GAZE_CAP 72 degrees against the line's own direction: the eased camera reads up to 72.7 on
// seeds 1 to 300, under the camera tool's bound of 75. GAZE_RAMP 35 m (every pull rises and lets go over
// that length). The swing's ends fall where these put them. The gaze is steeper than 45 degrees only while
// the harbour basin's water is under the lens.
// ONE SHARE OF LIFE PER HOUSE (0.3 to 0.9, by the cloth's stream): its hung cloth and its lit rooms by day follow
// it wherever the house stands. A PENNANT on every gate house, on every islet house and on the near rock's
// house (that one's bearing and phases by the stream road). THE WATER'S LIGHT under every arch by one law of
// its height over the plane.
// THE PORTAL: the world sets portal.drawWithin (300 m) and shows neither a light nor an image of its ring.
//
// THE VISIT'S HINTS. density: how many lamps are left burning (the chance in each room), how many curtains hang,
// how many boats lie moored off the quay, in the inlet and off the jetty, how many chimneys smoke, how thick the
// cypress line stands. rare (one visit in eight): long pennants hang from every
// pier of the hall's arcade (a standing thing). hour: one law (HOURS below): the same place at another hour; by
// night most rooms are lit (in the crest's tall house about one in six, at any hour), the light comes from the
// sun's bearing as moonlight and no disc is drawn in the sky.
// PHONES (ctx.quality.detail, 0.6 or 0.8 on a small machine): the plentiful small things are thinned by it after
// they are laid (no stream is drawn more or less for it): the rooms' furnishings, the far curtains, the floats and
// fallen leaves on the water, the cypresses, the chimneys that smoke. Walls, galleries, lamps and boats stay whole.
//
// STREAMS (each made by name from the seed, none forked from another): plan, houses, rooms, cloth, lamps, boats,
// trees, rare, shore (the far shore's line and the two lake rocks' three draws each), crest (the tall house's
// rooms, cloth and lamps), pennant (the pennants' phases and bearings), road (the lake rocks' crags, the near
// rock's cypresses and pennant, the roadstead), flank (the stair lanes' flank walls' arches, the islets'
// footing stones). EVERY SEED IS DEALT ONCE: no draw is made to be thrown away (TWO EXCEPTIONS, said as they
// are: the shore's stream goes on taking 24 draws a lake rock for an outline that nothing reads, the rocks
// being crags of the stream road; and the stream road takes two draws a lake rock that nothing reads, a
// point's drop and a summit's place for the house's crag, which is level and has no point), and the line's
// distance from a thing changes no stream's draws (boats,
// posts, floats, buoys, trees, houses, flank arches and footing stones draw first and are tested after; the
// garden terrace's length alone is found from the line's plan and moves the quay's lots past it, see the
// rules of place). By the
// seed: the hand of the whole place (it is turned about x on half the visits), five tiers of 18 m (three at the
// horns) and how fast the hill falls toward the horns, the inlet's bearing, the stair lanes' and the three
// towers' places, the bay width of the houses, which limewash leads, floors, gaps and garden lots, the hall's
// place, the open lake's two rocks (the far islet and the near rock), their crags, the roadstead's boats, the
// flank walls' doors, windows and green, the islets' footing stones, the sun's bearing and height, the air's
// bearing.
import * as THREE from 'three';
import { makePath, clamp, smoothstep } from '../kit/core.js';
import { buildHero, makePlan, makeCauseway, makeLook, makePalette, crestHouse } from '../parts/city-doubled-in-its-lake.js';

const D2R = Math.PI / 180;
// THE HOUR'S LAW: one table, read by the visit's hint ('any' and 'dawn' are the first hour of the morning)
const HOURS = {
  // the first hour: WARM AGAINST COOL. The sun 12 degrees high, gold (round 3: 2.5, 1.65, 0.8; round 4: three
  // fifths of that, see below; the ratios given here are round 3's); the sky's fill blue
  // (0.25, 0.36, 0.6), the ground's (0.24, 0.22, 0.22): a pale wall in the sun stands about 11 to 1 over the same
  // wall in shade in red and 3 to 1 in blue, so the lit arm is gold and the shaded arm cool; STONE in shade takes
  // the fill half as strong again and nearly without its blue (the shader's law): a cool pale grey, never navy.
  // (Round 3, stage A: limewash, timber, tile, slate, cloth and boats take the fill with two thirds and more of
  // its blue out; what stands in cast shade takes a quarter less of it; a lamp's wash is twice as strong in a room
  // whose front is in shade; the sky is deeper overhead, peach and gold low toward the sun, rose across from it.)
  // (round 4, A2: with the dawn line gone the lit quay, its timber and its cloth burnt out to one
  // cream: the sun is three fifths as strong and a little deeper in gold, (1.5, 0.98, 0.46), so lit stone is
  // gold-cream under the top of the scale and colour keeps its body; the fill is as it was)
  // THE GRADE IS BOLD (the city had read pale, flat and washed out). The sun is
  // a full gold-apricot, a fifth stronger and deeper (1.85, 1.02, 0.36); the fill is blue-violet (0.27, 0.3, 0.66);
  // the sky a deep clear blue overhead (#2b56a4), a clearer blue low away from the sun, peach and gold toward it
  // (the dome's glow); the air between is warm (the haze peach, not blue-grey). The shader's laws of this round:
  // a sunlit face takes its fill warm (the bounce of lit stone), shade is blue-violet and stays a half darker
  // from afar, roofs and towers take a warm rim.
  // (on the causeway's stone that gold stood mustard: a little less green and more blue in the sun,
  // (1.88, 0.97, 0.43): apricot)
  dawn: { el: 12, sun: [1.88, 0.97, 0.43], amb: [0.27, 0.3, 0.66], gnd: [0.27, 0.22, 0.2], top: '#2b56a4', hor: '#9dbbe2', glow: [1.0, 0.6, 0.28], haze: [0.86, 0.76, 0.7, 0.00045], lamp: 1.15, night: 0, exp: 1.0 },
  day: { el: 40, sun: [2.5, 2.4, 2.2], amb: [0.4, 0.5, 0.7], gnd: [0.38, 0.36, 0.32], top: '#4f7fc0', hor: '#cfe0ee', glow: [0.5, 0.5, 0.45], haze: [0.72, 0.82, 0.93, 0.0005], lamp: 0.55, night: 0, exp: 0.95 },
  golden: { el: 8, sun: [2.7, 1.5, 0.75], amb: [0.34, 0.39, 0.6], gnd: [0.33, 0.26, 0.21], top: '#6a7fb0', hor: '#f0d2b0', glow: [0.95, 0.5, 0.2], haze: [0.8, 0.7, 0.66, 0.0007], lamp: 1.3, night: 0, exp: 1.0 },
  night: { el: 30, sun: [0.3, 0.38, 0.6], amb: [0.1, 0.14, 0.26], gnd: [0.07, 0.07, 0.09], top: '#0a1024', hor: '#22305a', glow: [0.1, 0.13, 0.2], haze: [0.1, 0.14, 0.26, 0.0007], lamp: 1.7, night: 1, exp: 1.25 },
};

// ---------------------------------------------------------------- THE LINE (hand +1; metres; every figure is a place)
// R1 THE OPENING: the entry stands inside the bay on the axis of one of the causeway's arches (the arch is behind
//    us), 5.5 m over the water; 60 to 84 m straight and level along that axis toward the crown and the long hall,
//    the islet's gallery tower whole on the arc's hand, both cities large.
// R2 one wide arc (radius ARC_R) round the islet brings the line alongside the quay near the bearing A_LAND.
// R3 THE QUAY: QUAY_OFF off its edge (the fronts 11 m off), 4.6 m over the plane, some 140 m: past the chains and
//    over the water stair's head.
// R4 THE CLIMB: an S of 33 m over the quay's edge onto THE RISING STREET (the quay's own deck, climbing one in five
//    along the contour on the water side to the west bastion's top), RAMP_R inside its balustrade and RAMP_UP over
//    its paving: verandas at arm's length on the inner hand (a curtain in every arch of their arcades, green
//    hanging over the piers), the lake and the causeway over the rail; three planted bays (three tenths, four
//    sevenths and seven tenths of the way up the street) stand out over the water, each with a cypress and a lamp standard; standing lanterns on the
//    coping, round tapered pots with a soft clump of leaves at its foot, three cypresses in tubs before the arcades at the street's head.
// R5 THE LOOK (IN TWO PARTS, OVER THE HARBOUR). The basin is no closed court: THE HARBOUR is
//    the old basin (32 m wide, open to the lake at its mouth between the west flank and THE PIER) and the east
//    water behind the pier (10 m more, where the east bastion's body stood), 19 to 25 m deep to the head's quay;
//    at its head four separate roofed houses of four to six storeys with gaps between them stand before the high
//    wall, a garden terrace lies beyond its east end, the water stair goes down from the head's quay. The line
//    keeps to the street (1.2 to 1.8 m toward the rail past the cypress tubs), rises to RIM_UP over the terrace,
//    bends on BEND_R to the land hand and runs straight on a slant of SLANT over the west terrace's edge and out
//    over the harbour's water (THE PIVOT lies PIVOT_W before the inlet's axis, some 2 m before the west flank's
//    parapet), then bends back on TURN_R and crosses the whole harbour 9 to 12 m inland of the quay's edge,
//    40 m over water. (No bridge crosses the mouth: it is open to the lake.) THE FIRST
//    PART (whole from the rising street's top to the first water under the lens; the west terrace's balustrade
//    lies level below): the gaze goes out along the shore and down, square over 32 m of the mouth's water onto
//    THE PIER'S INLAND CORNER at the floor of the pier stack's top gallery (a little down along the shore): its
//    stack of verandas at the water with the waterline level, its double hanging below with its rooms lit, the
//    causeway's first ring, the lake, the far shore's line and the sky on the lake hand, the head's houses and
//    the water stair on the land hand. (The far line and the sky stand over the lake hand only: on the land hand
//    the hill rises.) THE SECOND PART (over the harbour's water, 37 m long under the line): from the first water
//    under the lens the gaze tips on down into THE WELL, a point on the plane 11.5 m before the pier's line and 5
//    degrees to the lake hand (64 degrees down at most), is whole there, and comes up again as the lens passes
//    the pier, level over the lake.
// R6 THE FALL: past the well the gaze swings to THE CAUSEWAY (the gate house nearest the lens where the turn
//    begins) and its point then travels along the causeway to the jetty's ring while the line runs its turn;
//    FALL_RUN along that circle past the bend, then two right-hand arcs of TURN_R with a straight between them,
//    out over the lake past the second islet's tower (ISLE_ON on and ISLE_OUT out from the turn's start, off the
//    horn's point) and round, falling gently from 23.5 m to 7 m, onto the axis of the jetty's ring; the
//    mooring field lies on the causeway's lake side beside that ring.
// R7 THROUGH THAT RING, RING_Y over the plane, the crescent and its double seen through it as we come; then
//    straight and level along the jetty between its lamps, JETTY_UP over the plane (3.2 m over its deck).
// No bank and no sway anywhere: the horizon is level all the way. THE LINE'S PLACES IN ORDER: the straight, the
// arc, the quay, the S, the climb to the street's top, the bend, the slant with THE PIVOT, the steep look over the
// harbour, the turn, the fall, the ring, the jetty. Each is a place of the plan and is found on every seed by
// the plan's own figures (layRoute's `places`; build() turns them into metres along the line, M).
const JETTY_UP = 5.4, RAMP_UP = 2.9, RIM_UP = 4.3, ENTRY_BACK = 16, ARC_R = 62, QUAY_OFF = 5, RAMP_R = 2.7, SLANT = 20 * D2R, BEND_R = 34, PIVOT_W = 14, FALL_RUN = 16, ISLE_ON = 78, ISLE_OUT = 38, TURN_R = 44, TAU_IN = 16, RING_Y = 5.6, A_LAND = -9 * D2R;
function layRoute(P, C) {
  const pts = [], places = {};
  const put = (r, a, y) => { const p = P.pos(r, a); pts.push([p[0], y, p[1]]); return pts.length - 1; };
  const J = C.jetty;
  // the entry: along the axis nb of an arch; the arc's centre must lie rq - ARC_R from the bay's centre
  const rq = P.RQ - QUAY_OFF, h = C.nb, rt = [-h[1], h[0]];
  let best = null;
  for (const c of C.centres) {
    // solve |c.p + h t + rt ARC_R| = rq - ARC_R for t (the straight's length from the arch's middle)
    const ox = c.p[0] + rt[0] * ARC_R, oz = c.p[1] + rt[1] * ARC_R, bq = ox * h[0] + oz * h[1], cq = ox * ox + oz * oz - (rq - ARC_R) * (rq - ARC_R);
    const disc = bq * bq - cq;
    if (disc < 0) continue;
    const tt = -bq + Math.sqrt(disc);
    if (tt < ENTRY_BACK + 60) continue;
    const cx = ox + h[0] * tt, cz = oz + h[1] * tt, aT = Math.atan2(cx, -cz);
    // the arch that brings the arc alongside the quay nearest A_LAND (never the jetty's own ring nor its neighbour)
    if (c.s < C.jetty.sJ + 1.5 * C.pitch) continue;
    if (!best || Math.abs(aT - A_LAND) < Math.abs(best.aT - A_LAND)) best = { c, tt, cx, cz, aT };
  }
  const arch = best.c, t0 = best.tt - Math.max(60, Math.min(84, best.tt - ENTRY_BACK));
  for (const s of [0, 0.34, 0.67, 1]) { const d = t0 + (best.tt - t0) * s; pts.push([arch.p[0] + h[0] * d, 5.5 - s * 0.5, arch.p[1] + h[1] * d]); }
  places.entry = 0; places.arc0 = 3; places.arch = arch; places.entryDir = h; places.entryBack = t0;
  // the arc: from heading h round to the quay's tangent at aT
  const ang0 = Math.atan2(-rt[1], -rt[0]), angT = Math.atan2(best.cz, best.cx), sweep = ((angT - ang0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const nA = Math.max(3, Math.round(sweep / (22 * D2R)));
  for (let i = 1; i <= nA; i++) { const g = ang0 + sweep * i / nA; pts.push([best.cx + ARC_R * Math.cos(g), 5.0 - 1.0 * i / nA, best.cz + ARC_R * Math.sin(g)]); }
  places.quay0 = pts.length - 1; places.aT = best.aT;
  // THE OPENING'S GREAT NEAR THING: a gallery tower on its own stone islet inside the arc, on the arc's hand of
  // the straight (30 m off it, a little beyond the straight's end, 28 m inside the arc), its front toward the
  // oncoming lens: [x, z, front's normal x, z]
  const isle = [best.cx - rt[0] * 30 + h[0] * 30, best.cz - rt[1] * 30 + h[1] * 30, -(rt[0] + h[0]) * Math.SQRT1_2, -(rt[1] + h[1]) * Math.SQRT1_2];
  // R3 along the quay, QUAY_OFF off its edge (the fronts 11 m off), past the water stair and the chains
  const rr = P.RQ + RAMP_R, aSh0 = P.rampA0 - 36 / P.RQ, aSh1 = P.rampA0 - 3 / P.RQ;
  const nQ = Math.max(2, Math.round((aSh0 - best.aT) * rq / 24));
  for (let i = 1; i <= nQ; i++) put(rq, best.aT + (aSh0 - best.aT) * i / nQ, 4.6);
  places.shift0 = pts.length - 1;
  // R4 an S of 33 m over the quay's edge onto the rising street, then up it, RAMP_R from its balustrade
  put(rq + (rr - rq) * 0.5, (aSh0 + aSh1) / 2, 5.1);
  places.ramp0 = put(rr, aSh1, P.DECK + RAMP_UP + 0.3);
  for (let i = 1; i <= 3; i++) { const a = P.rampA0 + (P.rampA1 - P.rampA0) * i / 5; put(rr, a, P.rampY(a) + RAMP_UP); }
  // R5 THE LOOK: THE WAY TURNS, not only the gaze (figures in metres from the pivot: s along the rim, o inland).
  // From the rising street's top the line bends inland on BEND_R (look0, the bend's start, lies on the street's
  // own course) over the west terrace's lake side, crosses the west flank's parapet LOOK_IN inland of that course
  // (THE PIVOT: 1 m inside the flank's line, PIVOT_W before the mouth's middle; the bridge lies 1.3 m and more
  // on the water hand, 4.3 m under the lens) and goes on over the whole harbour: 12 m straight on the slant of
  // SLANT, round the bend back on TURN_R, then along the circle ru over the east water: 40 m over water, so the
  // look comes in two parts (see the gaze)
  const ae = P.aI + P.alpha, yM = P.rimY + RIM_UP, aPiv = P.aI - PIVOT_W / rr, sn = Math.sin(SLANT), cs = Math.cos(SLANT);
  const LOOK_IN = BEND_R * (1 - cs) + 1.5 * sn;
  const so = (s, o, y) => put(rr + LOOK_IN + o, aPiv + s / rr, y), T = (t) => [t * cs, t * sn], t4 = T(-1.5), t8 = T(8), te = T(12);
  const bc = [t4[0] - BEND_R * sn, t4[1] + BEND_R * cs], sTop = (P.rampA1 - aPiv) * rr;
  // (along the street's last 23 m the line keeps on at 1.2 m, then 1.8 m toward the rail: the three cypresses in
  // tubs stand on the land side there)
  so(sTop - 23, -LOOK_IN - 1.2, P.rimY - 0.4);
  places.rampTop = so(Math.min(sTop - 9, bc[0] - 6), -LOOK_IN - 1.8, yM);
  places.look0 = so(bc[0], bc[1] - BEND_R, yM);
  so(bc[0] + BEND_R * Math.sin(SLANT / 2), bc[1] - BEND_R * Math.cos(SLANT / 2), yM);
  so(t4[0], t4[1], yM); places.pivot = so(0, 0, yM); so(t8[0], t8[1], yM);
  places.look1 = so(te[0], te[1], yM);
  const lc = [te[0] + TURN_R * sn, te[1] - TURN_R * cs];
  so(lc[0] - TURN_R * Math.sin(SLANT / 2), lc[1] + TURN_R * Math.cos(SLANT / 2), yM);
  const ru = rr + LOOK_IN + lc[1] + TURN_R, aR = aPiv + lc[0] / rr;
  put(ru, aR, yM);
  // R6 THE FALL: past the east bastion one right-hand turn, out over the lake outside the causeway and round,
  // brings the line onto the axis of the jetty's ring, heading into the bay; the lens falls gently all the way.
  // The turn begins FALL_RUN along the circle ru past the bend back (the east arm's galleries stand on the land
  // hand as the line peels off over the lake; the second islet's tower and the causeway come in on the other
  // hand as they leave) and is TWO ARCS of TURN_R with a straight between them: the first
  // arc's angle th is chosen (degree by degree) so that the second arc ends on the axis about TAU_IN before the
  // ring's middle; the straight's length s and that run-in tau follow from th by two linear equations.
  const c1 = C.at(J.sJ, 0), nbv = C.nb, TR = TURN_R;
  const aU = aR + FALL_RUN / ru, U0 = P.pos(ru, aU), Cc = [U0[0] - Math.sin(aU) * TR, U0[1] + Math.cos(aU) * TR];
  const psi1 = Math.atan2(nbv[1], nbv[0]), swU = ((psi1 - aU) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), pE = aU + swU;
  const Dx = c1[0] - Cc[0] - TR * Math.sin(pE), Dz = c1[1] - Cc[1] + TR * Math.cos(pE);
  let tb = null;
  for (let th = 60; th <= 150; th++) {
    const q = aU + th * D2R, vx = Math.cos(q), vz = Math.sin(q), det = vx * nbv[1] - vz * nbv[0];
    const s = (Dx * nbv[1] - Dz * nbv[0]) / det, ta = (vx * Dz - vz * Dx) / det;
    if (s >= 0 && (!tb || Math.abs(ta - TAU_IN) < Math.abs(tb.ta - TAU_IN))) tb = { th: th * D2R, s, ta };
  }
  if (!tb) tb = { th: swU / 2, s: 0, ta: 0 };
  places.turn0 = put(ru, aU, yM);
  const yE = RING_Y + 1.4, Lt = TR * swU + tb.s, yAt = (d) => yM + (yE - yM) * smoothstep(0.08, 1, d / Lt);
  const arcTo = (cx, cz, pa, pb, d0) => {
    const n = Math.max(2, Math.round((pb - pa) / (26 * D2R)));
    for (let i = 1; i <= n; i++) { const ps = pa + (pb - pa) * i / n; pts.push([cx + Math.sin(ps) * TR, yAt(d0 + TR * (ps - pa)), cz - Math.cos(ps) * TR]); }
  };
  const p1 = aU + tb.th, C2 = [Cc[0] + Math.cos(p1) * tb.s, Cc[1] + Math.sin(p1) * tb.s];
  arcTo(Cc[0], Cc[1], aU, p1, 0);
  if (tb.s > 12) pts.push([C2[0] + Math.sin(p1) * TR, yAt(TR * tb.th + tb.s), C2[1] - Math.cos(p1) * TR]);
  arcTo(C2[0], C2[1], p1, pE, TR * tb.th + tb.s);
  places.turn1 = pts.length - 1;
  // R7 straight on that axis: THROUGH THE RING (RING_Y over the plane), then level along the jetty to the portal
  const E = pts[pts.length - 1], tau = (c1[0] - E[0]) * nbv[0] + (c1[1] - E[2]) * nbv[1], oEnd = C.half + 5 + J.JL + 1.2;
  const ax = (o, y) => { pts.push([c1[0] + nbv[0] * o, y, c1[1] + nbv[1] * o]); return pts.length - 1; };
  if (tau > 26) ax(-tau / 2, (yE + RING_Y) / 2 + 0.2);
  places.ring = ax(0, RING_Y);
  const o60 = oEnd - 60;
  if (o60 > 14) ax(o60 / 2, (RING_Y + JETTY_UP) / 2);
  places.jetty0 = ax(Math.max(o60, 6), JETTY_UP);
  ax(oEnd - 40, JETTY_UP); ax(oEnd - 20, JETTY_UP); ax(oEnd, JETTY_UP);
  return { pts, places, aU, ru, tau, swU, fU: tb.s, entry: best.c.s, isle };
}

export default {
  id: 'city-doubled-in-its-lake',
  name: 'Valdrada, Verandas Over Still Water',
  category: 'books',
  placeKind: 'city',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['air'],
  weirdness: 0.55,
  async build(ctx) {
    const core = ctx.core, mk = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    // every stream by name, in one list, before anything is laid
    const S = { plan: mk('plan'), houses: mk('houses'), rooms: mk('rooms'), cloth: mk('cloth'), lamps: mk('lamps'), boats: mk('boats'), trees: mk('trees'), rare: mk('rare'), shore: mk('shore'), crest: mk('crest'), pennant: mk('pennant'), road: mk('road'), flank: mk('flank') };   // (road: the lake rocks' crags and the roadstead's own; flank: the stair lanes' flank walls' and the islets' footing's)
    const vary = ctx.vary || {}, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = vary.rare === true;
    const hourName = HOURS[vary.hour] ? vary.hour : 'dawn', H = HOURS[hourName];
    const scene = new THREE.Scene();
    const P = makePlan(S.plan, vary), pal = makePalette();
    const hand = S.plan.chance(0.5) ? 1 : -1;
    // THE LONG HALL crowns the crest: 80 m long, nine great arches (it is the skyline's first thing from the lake)
    const hall = { a: S.plan.range(-14, 6) * D2R, half: 0, arches: 9 };
    hall.half = 40 / (P.tierR(P.tiersAt(hall.a)) + 3);
    // THE FIRST HOUR'S SUN STANDS LOW OVER THE LAKE, WEST OF THE BAY'S AXIS: its bearing by the plan's deal about
    // 56 degrees off the axis, its height the hour's. The middle's and the east arm's fronts take it warm and
    // RAKING (cream to gold; every shadow falls long and slantwise across the paving and the neighbour's front),
    // the west horn's fronts are turned from it and stand in cooler shade, and every bastion, tower, roof, pier
    // and house has a lit west side and a shaded east side. The quay's paving lies in the sun.
    // (by night the moon stands 72 degrees off the axis: the night law)
    const sunBear = ((H.night > 0.5 ? -72 : -56) + S.plan.range(-4, 4)) * D2R, sunEl = (H.el + S.plan.range(-1.2, 1.2)) * D2R;
    const sunDir = new THREE.Vector3(Math.sin(sunBear) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunBear) * Math.cos(sunEl));
    const airBear = S.plan.range(0, Math.PI * 2);
    const C = makeCauseway(P, pal);
    // the causeway stands in the shade map as a wall (its arches let no light through there)
    P.extraTop = (x, z) => {
      const s = (x - C.S[0]) * C.d[0] + (z - C.S[1]) * C.d[1], o = (x - C.S[0]) * C.nb[0] + (z - C.S[1]) * C.nb[1];
      return s > 0 && s < C.L && Math.abs(o) < 5 ? C.deckY + 1.1 : 0;
    };
    await ctx.yield();
    // the line
    const R = layRoute(P, C);
    P.isle = R.isle; P.posts = C.posts; P.gates = C.gates;
    // A SECOND GALLERY TOWER on its own islet in the open lake off the east horn: the near thing where the line
    // peels off the rim and leaves the east arm behind (ISLE_ON m on along the rim's tangent from the turn's
    // start and ISLE_OUT m out toward the bay's middle: 33 m beyond the horn's point and 17 m out from the
    // quay's line, 29 m from the line at the nearest; its front toward the place where the turn begins)
    {
      const aU = R.aU, U = P.pos(R.ru, aU), ix = U[0] + ISLE_ON * Math.cos(aU) - ISLE_OUT * Math.sin(aU), iz = U[1] + ISLE_ON * Math.sin(aU) + ISLE_OUT * Math.cos(aU);
      const dl = Math.hypot(U[0] - ix, U[1] - iz);
      P.isle2 = [ix, iz, (U[0] - ix) / dl, (U[1] - iz) / dl];
    }
    const path = makePath(R.pts.map((p) => [p[0] * hand, p[1], p[2]]));
    const NS = Math.ceil(path.length / 0.5), sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1);
    const _p = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.posAtDist(i / NS * path.length, _p); sx[i] = _p.x * hand; sy[i] = _p.y; sz[i] = _p.z; }
    await ctx.yield();
    // distance from a point of the city's own space to the flown line (a point of it every 0.5 m), and where along it
    const nearLine = (x, y, z) => {
      let best = Infinity, bi = 0;
      for (let i = 0; i <= NS; i += 4) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 4); i <= Math.min(NS, bi + 4); i++) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      return { d: Math.sqrt(best), m: bi / NS * path.length };
    };
    const distToLine = (x, y, z) => nearLine(x, y, z).d;
    // (ROUND 5 MENDING 5, L6) ONE RULE IN SPACE for what the deal lays under or beside the line, the same along the
    // whole line and on every seed: NOTHING AFLOAT OR STANDING LIES WITHIN LINE_N METRES OF THE LINE'S PLAN WHERE
    // THE LENS IS LESS THAN LINE_H METRES OVER ITS TOP. keep(x, yTop, z, margin, lo) is true where a thing with its
    // top at yTop may lie: farther from the line than the margin, and not under the rule. (lo = 0 asks only for
    // tops under the lens: a house, whose wall may stand beside the line and whose roof may not lie close under it)
    const LINE_N = 4, LINE_H = 6;
    const keep = (x, yTop, z, margin = 0, lo = -Infinity) => {
      if (distToLine(x, yTop, z) <= margin) return false;
      for (let i = 0; i <= NS; i += 2) {
        const dx = sx[i] - x, dz = sz[i] - z, o = sy[i] - yTop;
        if (dx * dx + dz * dz < LINE_N * LINE_N && o >= lo && o < LINE_H) return false;
      }
      return true;
    };
    const metresAt = (i) => nearLine(R.pts[i][0], R.pts[i][1], R.pts[i][2]).m;
    const M = {};
    for (const k of ['arc0', 'quay0', 'shift0', 'ramp0', 'rampTop', 'look0', 'look1', 'turn0', 'turn1', 'ring', 'jetty0']) M[k] = metresAt(R.places[k]);
    const Lp = path.length;
    // the look's uniforms for this visit's hour
    const look = makeLook();
    look.uHand.value = hand; look.uLampGain.value = H.lamp;
    look.uSunCol.value.setRGB(H.sun[0], H.sun[1], H.sun[2]); look.uAmbSky.value.setRGB(H.amb[0], H.amb[1], H.amb[2]);
    look.uAmbGround.value.setRGB(H.gnd[0], H.gnd[1], H.gnd[2]); look.uHaze.value.set(H.haze[0], H.haze[1], H.haze[2], H.haze[3]);
    look.uSkyTop.value.set(H.top); look.uSkyHor.value.set(H.hor); look.uSunDir.value.copy(sunDir);
    look.uSunGlow.value.setRGB(H.glow[0], H.glow[1], H.glow[2]);
    look.uBreath.value.set(Math.cos(airBear), Math.sin(airBear), 6, 15);
    const hero = await buildHero(ctx, { P, C, look, S, palette: pal, distToLine, keep, sunDir, night: H.night, density, hall, aStair: P.lanes[3].a, rare, detail: ctx.quality?.detail ?? 1 });
    hero.object.scale.x = hand;
    hero.dome.mat.uniforms.uNight.value = H.night;
    scene.add(hero.object);
    await ctx.yield();
    // THE PACE (ROUND 5 MENDING 5, L3: EVERY KNOT IS A PLACE OF THE LINE, with no metres hung on it: quick along the entry
    // straight, easing round the arc to the quay's pace, even along the quay, slowing all the way up the rising
    // street to the slowest at its top, slowest from the street's top to the turn's start, rising evenly round
    // the turn, even through the ring and along the jetty)
    const bp = [[0, 1.1], [M.arc0, 1.1], [M.quay0, 0.8], [M.shift0, 0.8], [M.ramp0, 0.9], [M.rampTop, 0.35], [M.turn0, 0.35], [M.turn1, 0.8], [M.ring, 0.9], [Lp, 0.9]];
    const pace = (u) => {
      const d = clamp(u, 0, 1) * Lp;
      for (let i = 0; i + 1 < bp.length; i++) if (d <= bp[i + 1][0]) return bp[i][1] + (bp[i + 1][1] - bp[i][1]) * smoothstep(bp[i][0], bp[i + 1][0], d);
      return 1;
    };
    // THE GAZE: pulls in turn (the crown's two light ones; the quay's; the climb's and THE LOOK's as one, which
    // carries the swing to the causeway round the turn), each rising and letting go evenly over GAZE_RAMP metres.
    const GAZE_RAMP = 35, _q = new THREE.Vector3(), _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3();
    const camPolar = (u) => { path.pointAt(u, _q); return P.polar(_q.x * hand, _q.z); };
    const ringPt = new THREE.Vector3(); path.pointAt(M.ring / Lp, ringPt);
    // THE FIRST LOOK'S PLACE, in the city's own space: [x, y, z]. NOTHING TOPPLES OR LEANS THERE: the gaze lies
    // along the shore, square onto the pier's stack over 32 m of the mouth's water and only a little down, so the
    // harbour's houses stand upright, the lake, the far shore and the lit crescent lie high on the lake hand and
    // the head's houses on the land hand.
    // (THE FIRST LOOK IS LAID BY PLACES.) Its point is the pier's inland corner at the
    // height of THE FLOOR OF THE PIER STACK'S TOP GALLERY (one storey under the stack's rim: a thing of the place,
    // the same on every seed), so the gaze lies a little down along the shore onto the stack and the harbour
    const harbourPt = (() => { const t = P.pos(P.rPier, P.aI + P.alpha); return [t[0], P.rimY - P.FLOOR, t[1]]; })();
    // THE HARBOUR'S TWO EDGES UNDER THE LINE, in metres of the line: where the lens comes over the harbour's water
    // (the west flank's water face, plan angle aI - alpha) and where it leaves it (the pier's face, aI + alpha).
    // The line's plan angle only grows from the rising street's top to the turn's start, so each is found by halving
    const metreAtAngle = (a, lo = M.rampTop, hi = M.turn0) => {
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; path.pointAt(mid / Lp, _q); if (Math.atan2(_q.x * hand, -_q.z) < a) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    };
    const mWater = metreAtAngle(P.aI - P.alpha), mPier = metreAtAngle(P.aI + P.alpha);
    // (L3) THREE MORE PLACES OF THE LINE, from the plan: abeam of the quay's water stair (the fourth lane's foot);
    // over the rising street's foot; and abeam of the jetty's end (the line itself runs on 1.2 m past it)
    const mStair = metreAtAngle(P.lanes[3].a, M.quay0, M.ramp0), mFoot = metreAtAngle(P.rampA0, M.shift0, M.rampTop);
    const mJettyEnd = nearLine(C.jetty.J0[0] + C.jetty.jd[0] * C.jetty.JL, JETTY_UP, C.jetty.J0[1] + C.jetty.jd[1] * C.jetty.JL).m;
    // (ROUND 5 MENDING 5, L2: THE SWING IS LAID BY PLACES.) After the well the gaze goes (MENDING 6, M2: first up
    // to the bay's islet house and its double, see isleG below, and from there) to THE CAUSEWAY ITSELF:
    // to the gate house that stands nearest the lens where the line's turn begins, at the level of the causeway's
    // street; from there the point travels along the causeway to the jetty's ring while the line runs round its
    // turn (from the turn's start to its end). The gaze turns to it at ONE rate, SWING_RATE degrees for each metre
    // flown, wherever that falls. Its aim lies no more than GAZE_CAP degrees against the line's own direction:
    // where the causeway lies further round, the gaze rests at that bearing on the causeway's hand until the
    // line's own turn brings the point inside it.
    // (ROUND 5 MENDING 6, M4a: THE TWO FIGURES' OWN REASONS; the swing's ends fall where they fall.)
    // SWING_RATE 2.5 degrees a metre: the pace from the rising street's top to the turn's start is the slowest of
    // the way, 8 m a second (7.9 to 8.0 by the pace's own law on five seeds), so the gaze turns a calm 20 degrees
    // a second there, two thirds of the camera tool's bound of 30.
    // GAZE_CAP 72 degrees against the line's own direction: the eased camera reads up to a degree and a half
    // more, under the camera tool's bound of 75
    const SWING_RATE = 2.5, GAZE_CAP = 72, ringC = [ringPt.x * hand, ringPt.y, ringPt.z];
    let wellDir = null;
    const gateG = (() => {
      path.pointAt(M.turn0 / Lp, _q); const x0 = _q.x * hand, z0 = _q.z; let b = null;
      for (const g of P.gates || []) { const d = Math.hypot(g[0] - x0, g[1] - z0); if (!b || d < b.d) b = { d, g }; }
      return b ? [b.g[0], P.rimY, b.g[1]] : ringC;
    })();
    // (ROUND 5 MENDING 6, M2) THE SWING'S FIRST AIM IS THE BAY'S ISLET HOUSE AND ITS DOUBLE: the second islet's
    // place on the plane (its house stands over that point, its double under it). aimAt(m, p): the bearing and the
    // pitch, in the world, from the lens at metre m of the line to the point p, its bearing no more than GAZE_CAP
    // against the line's own direction. swingRun(s): the angle the swing has turned s metres after its start, SWING_RATE a metre, beginning
    // softly over its first 6 m
    const isleG = P.isle2 ? [P.isle2[0], 0, P.isle2[1]] : null;
    const aimAt = (m, p) => {
      path.pointAt(m / Lp, _q); const x0 = _q.x * hand, y0 = _q.y, z0 = _q.z; path.pointAt(Math.min(1, (m + 1.5) / Lp), _q);
      const hy = Math.atan2(_q.x * hand - x0, _q.z - z0), dx = p[0] - x0, dz = p[2] - z0;
      let off = Math.atan2(dx, dz) - hy; off -= 2 * Math.PI * Math.round(off / (2 * Math.PI));
      return [hy + clamp(off, -GAZE_CAP * D2R, GAZE_CAP * D2R), Math.atan2(p[1] - y0, Math.hypot(dx, dz))];
    };
    const swingRun = (s) => SWING_RATE * D2R * (s < 6 ? s * s / 12 : s - 3);
    let swing1 = null;
    const win = (d0, d1, weight, at) => ({ from: d0 / Lp, to: d1 / Lp, fade: GAZE_RAMP / (d1 - d0), weight, at });
    // (L3) THE CROWN'S POINT IS THE CREST HOUSE ITSELF: the middle of its roof (the house's own record gives its
    // place, base, floors and depth). Two light pulls toward it lift the gaze a little (the horizon stays level;
    // the line is not touched): along the entry straight, from the entry to where the arc begins, and along the
    // jetty, from the ring to abeam of the jetty's end; each rises and lets go over GAZE_RAMP like every pull
    const crownPt = (() => {
      const ch = crestHouse(P, hall, pal, distToLine), pc = P.polar(ch.x, ch.z), t = P.pos(pc[0] + ch.depth / 2, pc[1]);
      return new THREE.Vector3(t[0] * hand, ch.y0 + ch.floors * P.FLOOR, t[1]);
    })();
    const pois = [
      { ...win(0, M.arc0, 0.16, () => crownPt), arc: true },
      { ...win(M.ring, mJettyEnd, 0.14, () => crownPt), arc: true },
      // along the quay: the veranda fronts a little ahead on the city's hand
      // (L3: from where the line meets the quay to abeam of the quay's water stair)
      win(M.quay0, mStair, 0.5, (time, u) => { const c = camPolar(u), t = P.pos(P.RQ + P.QW + 0.5, c[1] + 26 / 277); return _g1.set(t[0] * hand, 6.5, t[1]); }),
      // THE CLIMB AND THE LOOK, ONE PULL, whole (weight 1, mixed along the angle), its point laid by the HEADING:
      // so many degrees to the land hand of it (az) and so far below the lens, 24.5 m off.
      // THE CLIMB: 17.5 degrees toward the water and level: over the balustrade to the lake, the causeway and
      // their doubles. THE LOOK IN TWO PARTS: over the street's last GAZE_RAMP metres the point passes to THE
      // PIER'S INLAND CORNER across the mouth (a fixed place) and is held there until the harbour's water comes
      // under the lens; from there the gaze tips on down to THE WELL (on the plane 11.5 m ahead, 5 degrees to the
      // lake hand: 64 degrees down); from the well THE SWING carries the gaze up to the bay's islet house and its
      // double, then round to the lake hand, to the causeway and its gate houses, and holds them (see below).
      // THE PULL'S TWO ENDS ARE PLACES: it rises from the rising street's foot and lets go as the line's turn
      // ends on the ring's axis, where the causeway's point has come to the ring; both over GAZE_RAMP
      { from: mFoot / Lp, to: M.turn1 / Lp, fade: GAZE_RAMP / (M.turn1 - mFoot), weight: 1, arc: true, at: (time, u) => {
        const m = u * Lp;
        path.pointAt(u, _q); const x0 = _q.x * hand, y0 = _q.y, z0 = _q.z;
        path.pointAt(Math.min(1, u + 1.5 / Lp), _q);
        let hx = _q.x * hand - x0, hz = _q.z - z0; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
        // a point so many degrees to the land hand of the heading, so far off, at a height
        const by = (azD, dist, y) => { const ca = Math.cos(azD * D2R), sa = Math.sin(azD * D2R); return [x0 + (hx * ca + hz * sa) * dist, y, z0 + (-hx * sa + hz * ca) * dist]; };
        // four points in turn, each passing evenly into the next: the climb's (over the rail to the lake, level);
        // THE PIER across the mouth (a fixed place: its inland corner); THE WELL (on the plane: down the fronts
        // and their doubles); the causeway's.
        // (the climb's turn to the water begins over the street's foot and is whole one GAZE_RAMP on; the street
        // is one even slope with no landing to end it at)
        const p1 = by(-17.5 * smoothstep(mFoot, mFoot + GAZE_RAMP, m), 24.5, y0);
        // THE WELL IS HELD WHILE IT LIES AHEAD: the harbour is 37 m long under the line; the well's point lies
        // 11.5 m ahead on the plane and 5 degrees to the LAKE hand (64 degrees down). THE GAZE COMES UP LEVEL OVER
        // THE LAKE, not in a lean over the garden.
        // THE CAUSEWAY'S POINT: from the gate house to the ring as the line runs round its turn, by its own
        // bearing off the way, or at GAZE_CAP on its hand while it lies further round than that
        const tC = smoothstep(M.turn0, M.turn1, m), cX = gateG[0] + (ringC[0] - gateG[0]) * tC, cY = gateG[1] + (ringC[1] - gateG[1]) * tC, cZ = gateG[2] + (ringC[2] - gateG[2]) * tC;
        const aC = Math.atan2((cX - x0) * hz - (cZ - z0) * hx, (cX - x0) * hx + (cZ - z0) * hz) / D2R;
        const p3 = by(-5, 11.5, 0), pC = by(Math.max(-GAZE_CAP, Math.min(GAZE_CAP, aC)), Math.max(8, Math.hypot(cX - x0, cZ - z0)), cY);
        // (by places and for every seed:) THE LOOK IS WHOLE FROM THE RISING STREET'S TOP (the gaze passes to it from
        // the climb's point over the GAZE_RAMP metres before the top) and is HELD until the harbour's water comes
        // under the lens (mWater). THE TIP to the well begins there and ends where the well's point, 11.5 m ahead
        // on the plane, reaches the pier's face: the harbour's whole length less the well's reach, as gentle as
        // the harbour allows. THE TIP TURNS AT ONE EVEN RATE, easing in and out over an eighth of its length at
        // each end, so its middle runs a seventh over its mean (the usual ease runs half again as fast there)
        const mWell = mPier - 11.5, tT = clamp((m - mWater) / (mWell - mWater), 0, 1), eT = 0.125;
        const w23 = tT < eT ? tT * tT / (2 * eT * (1 - eT)) : tT > 1 - eT ? 1 - (1 - tT) * (1 - tT) / (2 * eT * (1 - eT)) : (tT - eT / 2) / (1 - eT);
        const w12 = smoothstep(M.rampTop - GAZE_RAMP, M.rampTop, m);
        const mix3 = (a, b, w) => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
        // (L2) THE SWING: from where the look lets go (the well whole, mWell: the well's point has reached the
        // pier's face, 11.5 m before the line's plan leaves the basin's water) the gaze turns from the well's
        // direction, SWING_RATE degrees a metre (each leg beginning softly over its first 6 m): up to the islet
        // house, then round to the causeway's point, on which it rests. So the gaze is steeper than 45 degrees
        // only over the basin's water, and is rising where the line leaves it
        const pm = mix3(mix3(p1, harbourPt, w12), p3, w23), sS = m - mWell;
        if (sS <= 0) return _g2.set(pm[0] * hand, pm[1], pm[2]);
        // (the swing begins from THE WELL'S DIRECTION AS IT STOOD where the look let go, a direction of the world,
        // so the gaze's own turn is SWING_RATE whatever the way does under it: the way's own turn is not added)
        if (!wellDir) {
          path.pointAt(mWell / Lp, _q); const wx = _q.x * hand, wy = _q.y, wz = _q.z; path.pointAt(Math.min(1, (mWell + 1.5) / Lp), _q);
          let gx = _q.x * hand - wx, gz = _q.z - wz; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
          const ca = Math.cos(-5 * D2R), sa = Math.sin(-5 * D2R), v = [(gx * ca + gz * sa) * 11.5, -wy, (-gx * sa + gz * ca) * 11.5], vl = Math.hypot(v[0], v[1], v[2]);
          wellDir = [v[0] / vl, v[1] / vl, v[2] / vl];
          // (M2) WHERE THE GAZE HAS COME TO THE ISLET HOUSE (found once, from the line and the islet's place): the
          // first metre at which the swing's run covers the turn from the well to the islet with its soft landing
          const y0w = Math.atan2(wellDir[0], wellDir[2]), p0w = Math.asin(wellDir[1]);
          swing1 = { m: mWell, yaw: y0w, pit: p0w };
          if (isleG) for (let mm = mWell; mm < M.turn1; mm += 0.25) {
            const t = aimAt(mm, isleG); let dy = t[0] - y0w; dy -= 2 * Math.PI * Math.round(dy / (2 * Math.PI));
            if (swingRun(mm - mWell) >= 1.2 * Math.max(Math.abs(dy), Math.abs(t[1] - p0w))) { swing1 = { m: mm, yaw: y0w + dy, pit: t[1] }; break; }
          }
        }
        // (the great circle from a steep look turns the gaze's bearing twice as fast as its own angle.
        // THE SWING IS BY BEARING AND BY PITCH, each at SWING_RATE at most: the bearing goes round toward the
        // causeway's and the pitch comes up toward it, each until it meets its mark, then keeps to it)
        // (MENDING 6, M2) THE SWING IN TWO LEGS, each at SWING_RATE. FIRST UP TO THE BAY'S ISLET HOUSE AND ITS DOUBLE:
        // from the well's direction the gaze comes up and round to the islet's place on the plane, the greater of
        // its bearing and its pitch at SWING_RATE, landing softly (over the last two fifths of the turn); so the
        // gaze is rising where the line leaves the basin's water, and rises past the pier and the bastion to the
        // bay beyond them. THEN, from where it has come to the islet house, ROUND TO THE CAUSEWAY as before
        if (m < swing1.m) {
          const t = aimAt(m, isleG), yw = Math.atan2(wellDir[0], wellDir[2]), pw = Math.asin(wellDir[1]);
          let dy = t[0] - yw; dy -= 2 * Math.PI * Math.round(dy / (2 * Math.PI));
          const x = Math.min(1.2, swingRun(sS) / Math.max(Math.abs(dy), Math.abs(t[1] - pw), 1e-6)), w1 = x <= 0.8 ? x : 1 - (1.2 - x) * (1.2 - x) / 0.8;
          const ya = yw + dy * w1, pa = pw + (t[1] - pw) * w1;
          return _g2.set((x0 + Math.sin(ya) * Math.cos(pa) * 40) * hand, y0 + Math.sin(pa) * 40, z0 + Math.cos(ya) * Math.cos(pa) * 40);
        }
        const dB = [pC[0] - x0, pC[1] - y0, pC[2] - z0], yawT = Math.atan2(dB[0], dB[2]), pitT = Math.atan2(dB[1], Math.hypot(dB[0], dB[2]));
        const yaw0 = swing1.yaw, pit0 = swing1.pit, run = swingRun(m - swing1.m);
        let dY = yawT - yaw0; dY -= 2 * Math.PI * Math.round(dY / (2 * Math.PI));
        // (the second leg, from the islet house round to the causeway: THE PITCH COMES UP IN STEP WITH THE BEARING,
        // from the islet's foot on the plane to the causeway's street)
        const wY = Math.abs(dY) <= run ? 1 : run / Math.abs(dY), yaw = yaw0 + dY * wY, pit = pit0 + (pitT - pit0) * wY;
        return _g2.set((x0 + Math.sin(yaw) * Math.cos(pit) * 40) * hand, y0 + Math.sin(pit) * 40, z0 + Math.cos(yaw) * Math.cos(pit) * 40);
      } },
      // (L3: THE FALL HAS NO PULL OF ITS OWN ANY MORE: round the whole turn the gaze lies on the causeway's point,
      // which travels to the jetty's ring; the one pull above carries it from the turn's start to the turn's end)
    ];
    return {
      scene, path, duration: 50, pace, pois,
      // (no bank and no sway: the horizon and the waterline stay level all the way)
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 14, sway: 0, bank: 0 },
      portal: { shape: 'circle', radius: 4.8, color: '#ffd89a', glow: 0.9, revealDistance: 260, drawWithin: 300 },
      post: { exposure: H.exp, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.05, vignette: 0.26, grain: 0.02 } },
      companion: 'none', ride: 'none',
      hero, plan: P, marks: M, hourName, hand, route: { aU: R.aU, tau: R.tau, swU: R.swU, fU: R.fU, entry: R.entry, aT: R.places.aT },
      update(dt, time, camera) { hero.update(dt, time, camera); },
      dispose() { hero.dispose(); },
    };
  },
};
