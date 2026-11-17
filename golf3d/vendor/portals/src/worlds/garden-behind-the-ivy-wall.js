// Through the Door in the Ivy. Inspired by The Secret Garden, Frances Hodgson Burnett, 1849 to 1924.
// One place that stands, at one hour, under one sky: from the edge of a winter moor up a walk between kitchen-garden
// walls to a door standing open under ivy, and through it into one old walled rose garden that lies in every season at
// once BY DEPTH: bare grey rose stems by the door, roses in full fall at its far end.
//
// AT THE HEAD, as the order asks:
// - THE SCALE: everything is built at three and a half times life size, every thing alike; the eye flies at a child's
//   eye height (3.6 to 4.6 m over the ground) and at a child's run.
// - HOW WIDE THE DOOR STANDS: 5.0 m in the clear between its stone jambs (2.5 m to either hand of the flown line, the
//   line through its middle), 7.0 m clear under its stone lintel, over a step 0.3 m high.
// - THE SEASON: one function of place, seasonAt(x, z) of the part: S is x over 130 held to 0..1 inside the garden, with
//   a slow wobble of place of at most 8 m of x, and 0 outside. Windows: bare under 0.25, buds and a green veil to 0.5,
//   full leaf to 0.7, bloom from 0.7; bulbs' green points 0 to 0.3. Never the clock, u, the lens or a seed.
// - THE SIGHT LANE, a rule of place, the same on every seed: from the sill (0, 0) to the great rose tree (160, 14),
//   16 m wide as far as x 100, widening to 30 m at the tree; no trunk in it, nothing hanging into it below 30 m.
// - ONE HOUR, ONE SKY: a clear late afternoon, the sun low behind us and to the right as we come up the walk (toward
//   the sun (-0.75, 0.41, 0.52)). THE VISIT'S HOUR HINT IS NOT FOLLOWED (ctx.vary.hour is not read): one hour is the
//   source owner's term. THE RARE VISIT IS NOT USED (ctx.vary.rare is not read): no rare thing is staged.
// - THE VISIT'S MOOD AND DENSITY ARE USED: mood sets the cloud field and the wind's strength; density how thick the
//   rough grass, the green points and the snowdrops lie (the middle's drifts, trees and things are not the visit's).
// - THE WAY OUT: the world sets NEITHER portal.drawWithin NOR portal.drawIn; the ring stands whole from metre 0,
//   hidden until the long arc only by fixed things of the place (the alcove's turn from the door and its yew wings):
//   by that geometry it is covered from metre 100 to 199 and first shows at metre 200 to 201, on the line's right hand.
// - THE ROUTE is the same on every seed: laid by arithmetic in the part (layRoute), 320.9 m, never a table of u.
// - NO DECLARED PACING: nothing in this world reads u, the metres flown or the lens but the film's pace and its gaze
//   pulls below (the camera's own: a pull's mark may glide by the route's metre; it turns the lens and draws
//   nothing; the way out's reveal is the engine's, handed revealDistance) and the
//   sky dome, light rig, far ridges and ground material, which follow the camera they are handed (the kit's own).
//   BESIDE THOSE, said plainly (G8): the fog reads the length of air; the bell glasses' rim, the glint on iron, key
//   and knob (G11) and the kit's sheen, backlight and rim read the bearing as light does; NOTHING THAT GROWS HERE
//   CHANGES BY ITS DISTANCE (G9a): no flower, bulb, border plant, daisy or grass tuft is sunk, sized, faded or left
//   undrawn for being far; every set is drawn at every distance and none is given a cull distance. A LEVEL OF
//   DETAIL BY WHERE THE EYE STANDS, never by where it looks (the part's head says the same): THREE SWAPS, each one
//   flag by the eye's side of a typed plane of the plan, nothing left out:
//   1. THE MIDDLE'S FINE FLOWERS (the fine daffodils, narcissi, bluebells and iris wherever they are dealt, the few in a lane band too, and the north-east's pools): while the eye is west of x 0, the door wall's inner face (the line's metres 0 to 120.6), each stands as its far stand-in, two triangles at its own place, turn, scale and tint; measured, near and far: the same height, mean colour and showing area (far over near 1.00).
//   2. THE LAST LAWN'S border plants and daisies and THE YEW'S SHAG: while the eye is west of x 30, where the door's shade ends (metres 0 to 151.4), the plants stand as their far stand-ins (as in 1) and the shag as broad kites; measured on seeds 1 to 300, near and far: sprays 592 and 586 m2, fallen needles 107 and 96, tufts 42 and 42, every mean colour within 0.004.
//   3. THE DOOR WALL'S IVY (mass, single leaves, sprays): while the eye is west of x -30 or east of x 30, 30 m from the wall's plane (metres 0 to 90.6 and from 151.4 on), each stands as its far form; measured, near and far: the mass 0.095 0.190 0.110 and 0.098 0.194 0.112 at the near's own cover; a leaf as a round of its own area and mean colour; the sprays 0.138 0.268 0.150 and 0.139 0.270 0.151 over the leaves' own share.
//   All of them as themselves from every place would pass our law of 485,000 triangles (counted at G9a). THE WEST
//   CUT is no level of detail: it leaves out only WHAT CANNOT SHOW. While the eye stands west of the kitchen garden
//   door's east jamb (x -53.5: the line's metres 0 to 66.5) the garden's inside is drawn in the triangles that can
//   show from that stretch over the door wall's top, through the doorway or past the wall's ends; what the wall
//   hides from every such place is drawn from that plane on (the moor's clothing at the entry is paid from that).
//   The kit's grass keeps a fade pair because it has no other handle: 400 to 500 m, which begins beyond its
//   farthest tuft from any place on the line (342 m at most, by the plan's corners), so it never acts here.
//   The bands of the door wall, the made things and the wood are left out only
//   by three's own test of each band's sphere. THE TWO SHADOW SHEETS (flat layers with no thickness) have no distance
//   of their own (G8b): each sheet's strength is times this fog's own clear share at that place, so a far
//   shadow pales as the ground or the brick under it does; the moving dapple goes to its own mean far off.
//   No body of the place is lit, faded, hidden, thinned or sized by its distance.
// - NO RIDE AND NO COMPANION are asked for (ride 'none', companion 'none'): the place has no creature but its own birds
//   and insects, and nothing that stands for a person.
// - THE STREAMS (G9b): A STREAM IS ITS NAME. Every stream is made by one maker at the head of build from the
//   world's seed and its own plain name and from nothing else, so it is the same stream whatever any other has
//   drawn. NONE IS FORKED: the kit's fork was tried by its own calls and takes a draw of its parent (a child
//   differs after a parent's draw), so it is not used; the kit's makers are handed streams of this maker. Nothing
//   is drawn to be thrown away; no deal repeats an older build's; a set that a rule of place turns off draws
//   nothing and stamps nothing. A number in a name is the thing's own (which wall, which buffer); no name carries
//   a letter or a number picked among tries. The names, by what they deal: 'sky', 'ground', 'ridge',
//   'grass-<set>', 'lawns-<set>', 'lastlawn-<set>' (the kit's sky, terrain, ridges and scatters); 'petals' (the
//   falling petals' columns);
//   'ivy-cards', 'ivy-trails' (the door wall's leaves and bare trails); 'things-border', 'things-frames',
//   'things-beds', 'things-middle', 'things-more' (the made things' turn, tilt, state and wear); 'wood-fans', 'wood-kitchen',
//   'wood-orchard', 'wood-pier', 'wood-moor', 'wood-far', 'wood-tufts', 'wood-rookery' (the bare wood's limbs, the
//   moor's and the far wood's forms); 'moor', 'far' (where the moor's plants and rocks and the far wood stand);
//   'moor-cloth', 'moor-gorse', 'moor-sprigs', 'moor-blades', 'moor-sprays' (the moor's clothing beside the line,
//   the gorse's sprays, the heather's sprigs, the tussocks' blades, the heather's twiggy sprays by the line);
//   'grey-lay', 'grey-build', 'grey-roses', 'grey-bridges' (the old trees: where, their limbs, their roses, the
//   bridges from crown to crown); 'swell' (the old
//   beds, the sunk path, the mounds at tree feet); 'under-lay', 'under-build', 'thickets-lay', 'thickets-build'
//   (undergrowth, leaf drifts, edging; the greening mounds and the last old trees); 'blossom-lay',
//   'blossom-build', 'blossom-standards', 'blossom-heads', 'blossom-cloth<buffer>', 'blossom-dial',
//   'blossom-petals' (the blossom trees' colour, height and limbs, the standard roses, the dial's roses, the
//   fallen petals); 'lawns-lay' (the bulb lawns' drifts); 'bulbs' (green points and snowdrops);
//   'roses-wall<wall>', 'roses-hang<wall>' (the wall roses); 'cascades-wall<wall>', 'cascades-cloth<wall>',
//   'alcove', 'alcove-roses', 'alcove-yew', 'alcove-finale' (the far walls' cascades, the alcove's yew and roses,
//   the yew's shag, the finale's roses); 'lastlawn-lay', 'finale-lay',
//   'lastlawn-roses', 'lastlawn-cloth' (the last lawn's drifts, standards and bushes; the finale's); 'rose-tree',
//   'rose-tree-wood', 'rose-tree-cloth', 'rose-tree-shoots', 'rose-neighbour', 'rose-neighbour-wood',
//   'rose-neighbour-cloth', 'rose-bridge', 'rose-bridge-cloth', 'rose-bridge-canes', 'rose-bridge-heaps' (the great
//   rose tree, its neighbour, the bridge, its sheaf of canes and its heaps);
//   'robin-phase', 'mate-phase' (the two birds); 'life-shafts', 'life-motes', 'life-bees', 'life-white',
//   'life-small', 'life-rooks', 'life-larks' (the sunlit gaps and the small life). The season, the sight lane's
//   rule, the line's rule of clear air and every window of S are rules of place and never the seed's.
// - THE PLAN OR THE SEED, SAID WHICH (G9b). THE GARDENER'S PLAN is typed in metres in the part and is the same on
//   every seed; the seed gives such a thing its turn, tilt, state and form, never its place: three cold frames in
//   a row on the grass 3.6 m out from the north wall's foot, 7.4 and 7.6 m apart from x -84; bell glasses in rows
//   (three 2.1 m apart from x -81, four on the border's straw 3.4 m apart from x -30); stacks of clay pots at the
//   walls' feet (three by the north wall west of the kitchen door, four by the low south wall before the door
//   wall); the water can by the frames; six fans trained on the walk's north wall (two west of the kitchen door
//   13.5 m apart from x -84, four east of it 11.2 to 13 m apart from x -46); five kitchen-garden trees (two pairs
//   to either hand of its path, one among the far beds); the orchard's four rows 13.5 m apart, seven trees a row
//   13 m apart; the climber's feet on the gateway's north pier, 1 m apart; the blossom trees' stations (a tree
//   stands at its station, or at the first place the rules of place allow on a fixed spiral about it); the three
//   island beds; the spade, the dial, the fork and the chair; the great rose tree's root, leader and vast boughs,
//   its neighbour's root, the bridge's two ends. THE SEED'S, by rules of place said in the part: the moor's
//   plants, rocks and tufts (the eight gorse by the entry among them); the far wood; the eighteen old trees; the
//   undergrowth and the thickets; the green points, the snowdrops and the lawns' drifts (the lane's bands: one
//   band dealt in each 6.33 m stretch of the lane from x 22 to x 98, its two middle pools on every seed, so the
//   open door shows bloom of each depth on every seed); the standard roses and the bushes; the wall roses, the
//   cascades and the borders' drifts; the small life. THE MATE'S PERCHES are the seed's by one rule (of the lawful
//   perches of each kind the one nearest the fork's handle; the handle is the plan's), and ALL SIX LARKS by one
//   rule (over the moor from x -150 to -99, 14 to 60 m to either hand of the gate's axis, 34 to 46 m up, each its
//   own circle and phase): none is typed by the entry.
// - THE BIRDS' PHASES ARE THE SEED'S (G9b): the robin's and the mate's each from a stream of its own; neither is
//   typed so that a bird sits where the flight passes at clock zero, and nothing reads the metres flown. THE ROBIN
//   RESTS 0.56 OF ITS ROUND (53.8 s of 96) WITHIN 12 M OF THE LINE: on the spade's grip, 7.0 m from it in plan,
//   the round's one perch that near; that is the round's own doing, the same on every seed.
// - THE MIDDLE (x about 20 to 118), by place and by S at each root: crocus S 0.15 to 0.42, daffodil and narcissus 0.33
//   to 0.62, bluebell and iris 0.5 to 0.75, in drifts of one kind that cross the sight lane as its floor; the greening
//   thickets; twelve to fourteen blossom trees at the plan's stations (fourteen on 270 seeds of 300; none in the lane, none nearer the line than the rule lets; the line passes
//   under their boughs between about metres 204 and 248); the dial at (104, -8) with its standard roses; the fork,
//   trowel and pots at (47, -9); the empty wheeled chair at (84, -24) in a pool of sun the shadow sheet leaves lit.
//   THE FALLING PETALS (G9c): about 2,400, the part's own field on the world's clock, under and beside the blossom
//   trees and nowhere else. NO PETAL IS EVER WITHIN 3 m OF THE FLOWN LINE (G11), by place at build: each is dealt a
//   fall column (a start in or beside a crown, a fall to the grass slanted down the wind, a sway about it) whose
//   whole course in plan keeps 3 m and more from the line, its sway and the petal's own reach counted; nothing
//   is tested while the world runs, and no petal is hidden, moved, faded or sized by where the eye is. Seven in
//   ten are dealt beside the line (the middle of the course within 9 m of it). A petal is 0.10 to 0.16 m long
//   (G11), two to three times a plum petal at this place's scale (said plainly), and turns as it falls.
// - THE WAY UNDER THE LINE (G11; the part's WAY): every grass tuft's and every flower's top, at full sway, stands
//   2.5 m and more from the flown line, by place at build and never by the eye. Under the line the long grass gives
//   way to a verge and to short turf of its own (the grass sets 'verge' and 'turf'), the ground there a paler mown
//   and trodden green, and the lawns' flowers there are low or set aside: the brief's grass walk, which also shows
//   where the way leads. Counted on seeds 1 to 300 at full sway: the nearest of all low cover stands 2.69 m from
//   the line (2.56 m at the strongest wind and the fullest density, on thirty seeds).
// - THE BRIDGES OF ROSE between the old trees are the place's own rule (G11): old roses have bridged the way
//   through the garden, so a bridge stands where two climbed crowns face each other across the way.
// - THE FAR END (x over 115, S 0.88 to 1): the great rose tree at the lane's end (160, 14), 40 m, a crown 34 m across
//   on seven vast bowed boughs of the plan (with the bridge's, one in every eighth of the compass), clothed in rose
//   from foot to top (cream, shell pink and deep pink; ONE mass of crimson low on its sunlit side and nowhere
//   else), its curtains ending 6 m and more over the grass, ONE bridge of rose, a sagging swag off the middle, to
//   its neighbour (119.7, 32.2) that the line passes under between about metres 299 and 313 (its lowest part 17.6
//   to 19.0 m over the flown line, 16.7 to 18.0 m at full swing). NO PICKED DEAL (G9b): the tree, its neighbour and the
//   bridge are dealt by the seed as every tree is, inside bounds that hold by rule on every seed (the part's
//   ROSE_TREE; counted by dry builds on seeds 1 to 300): the leader is the plan's, so the clothed top stands 38.0
//   to 42.1 m; in every eighth of the compass a mass reaches 10.4 m and more from the root; 105 to 157 masses (at
//   most 33, 56 and 64 by level, on an even share of the places); 24 curtains, the neighbour's 12, and the bridge
//   between its typed ends on every seed (span 24.5 m, sag 7.85 m); 18,154 to 24,186 triangles. Its rules measure
//   from the plan's level lawn, not the seed's swells. The walls' cascades; borders at the walls' feet in groups
//   with green between and three island beds (delphinium, white lily, poppy, foxglove, columbine, each drift ONE
//   kind, the tall against the brick); a walk of paler rough grass to the alcove with standard roses and low bushes
//   off it, no row; the yew alcove at (149, 45) with its urns and seat, the ring 15 m inside its mouth. The wood's
//   edge behind the alcove and beyond the east wall is bare crowns only (no evergreen stands over the far end).
// - WHAT IS DRAWN WHERE: every flower, bulb, border plant, daisy and tuft of the garden is drawn from every place
//   on the line, at every distance (G9a). Real flower forms stand within 15 m of the line in the middle and within
//   30 m of it on the last lawn, clumps and washes of colour farther off (rules of place, at build). The lane's
//   bands (all but the few fine daffodils and narcissi dealt in them, which go with the fine sets), the crocus by the line, the washes, the pools of the last lawn, the snowdrops and the grass stand as
//   themselves from every place; the fine daffodils, narcissi, bluebells and iris and the north-east's pools stand
//   as their far stand-ins on the line's metres 0 to 120.6 (the eye west of x 0) and as themselves from the sill
//   on, the last lawn's border plants and daisies as theirs, and the yew's shag as its broad kites, on metres 0 to
//   151.4 (the eye west of x 30) and as themselves from there on. The door wall's
//   ivy and roses lie in bands along z that share their stores, so three's own test leaves out the bands the line has passed;
//   the made things and the winter wood lie in six bands along x in the same way (so the moor is left out once the line has passed it).
// - THE OUTSIDE (metres 0 to 121), by place: the moor's heather as twiggy hummocks with bleached tufts between, gorse
//   as spiny flowering masses, bedded lichened rocks (none nearer the entry's axis than the rule lets); the gateway's
//   piers of old unlike stones under worn caps, the sill's flags with grass in the joints; the walk's brick to the
//   palette (a face in its own shade a muted plum brown), old stone copings, fine broken lichen; raked gravel (its pebbles sharp near at hand, gone to their mean by the pixel's footprint: G12) between
//   kerbs of brick on edge, turf verges, leaf drifts and moss at the walls' feet under the orchard trees' long shadows (cast from the limbs the seed
//   dealt, drawn 1.9 times as long as the sun's height gives: a low sun's reach, said here); the bell glasses a
//   clear mesh of their own; the door wall's ivy a swelling mass with a ragged top, the doorway's old stone found
//   under it, the leaf's old green paint flaked to grey wood, forged straps, knob and key. ONE LAW OF CLOUD
//   SHADE (G9c): the clouds' shade is one field over the whole place, moor, walk, door and garden alike, moving on
//   the world's clock, with no switch, no edge and one depth everywhere, and mild: the kit's cloud figure is handed
//   0.09 (G11), so ground under the thickest cloud keeps 91 parts in 100 of its light; as drawn, counted along the
//   whole line, nothing in cloud shade stands under 82 parts in 100 of itself with no cloud (the law: never under 80).
//   THE SHADE AT ITS OWN HEIGHT (G12): a wall shades what stands under its top; what stands over a wall's top (a crest of rose or evergreen, ivy on a coping, the yew's top) takes the sun, by its own place and height at build.
//   THE BREATHS PACKED (G12): every ask of the build says its work as a count, and one meter (at the top of build) asks the engine only when the counts since its last hand-back reach 21 (a unit is about a millisecond of the builder's machine), or when the piece named as following would carry them past 30. No clock is read; what is built is the same to the bit. On a slower machine every piece is longer in proportion.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import { PLAN, layMoorCloth, buildMoorFloor, makeYewMaterial, layRoute, routePoints, speedAt, layGaze, makeHeight, makeSun, makeGroundColor, buildWalls, buildWalk, makeClock, makeIvyUniforms, buildIvyShell, buildIvyLeaves, buildThings, buildWood, layMoor, layFarWood, layGrey, buildGrey, makeTwigAtlas, makeSwell, bakeShadows, buildShadowSheet, makeGrassPlan, makeWay, layUnder, buildUnder, buildWallRoses, buildWallShade, buildBulbs, placeBy, layBlossom, buildBlossom, layStandards, middleCasters, middleClear, layPetals, makePetals, bulbForms, layLawns, lawnShade, farStandIn, FAR_CUT, IVY_CUT, splitBands, splitBandsAsync, splitWest, splitWestAsync, WEST_CUT, alcovePanels, buildAlcove, buildRoseTree, buildCascades, layFarEnd, buildFarRoses, farForms, makeBird, layRobin, layMate, birdPose, makeLife, layLife, layShafts } from '../parts/garden-behind-the-ivy-wall.js';

export default {
  id: 'garden-behind-the-ivy-wall',
  name: 'Through the Door in the Ivy',
  category: 'books',
  placeKind: 'domestic',
  book: 'The Secret Garden',
  author: 'Frances Hodgson Burnett, 1849 to 1924',
  media: ['air'],
  weirdness: 0.35,
  async build(ctx) {
    const scene = new THREE.Scene();
    const owned = [];
    // ------------------------------------------------------------ THE BREATHS PACKED (G12). The engine hands the page
    // back at the first ask that comes 6 ms after a frame, and the build then waits out that frame: a piece of 6 to 16 ms
    // costs a whole frame. So every ask of this build SAYS ITS OWN WORK AS A COUNT (`done`: a typed figure at the ask, or so
    // many triangles, rows or rounds at a typed figure each; a unit is about a millisecond of the builder's machine; NO
    // CLOCK IS READ, here or in the part), and the engine is asked only when the counts since its last hand-back reach
    // 21, or when the piece that follows (`next`, where an ask knows it) would carry them past 30. What is built, and in
    // what order, is the same to the bit: an ask left out changes no number. The kit's own makers ask by their own
    // measure, about a piece of 10 ms each time: two of their pieces make one of ours.
    let due = 0;
    const eased = Promise.resolve(), breath = (done = 4, next = 0) => { due += done; if (due < 21 && due + next <= 30) return eased; due = 0; return ctx.yield(); };
    const kitBreath = () => breath(11.5, 11.5);
    // ------------------------------------------------------------ THE STREAMS (G9b): a stream is its name. Each is
    // made here from the world's seed and its own plain name and from nothing else, so it is the same stream
    // whatever any other has drawn. None is forked from another (the kit's fork takes a draw of its parent). The
    // part's makers are handed this maker and name the streams of their own sets.
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // ------------------------------------------------------------ what this visit is like (standing states)
    const mood = ctx.vary && typeof ctx.vary.mood === 'number' ? ctx.vary.mood : 0.5;
    const density = ctx.vary && typeof ctx.vary.density === 'number' ? Math.max(0, Math.min(1, ctx.vary.density)) : 0.5;

    // ------------------------------------------------------------ the sky and the one sun (the brief's light)
    // (G10c) THE KEY AND THE FILL. The key is gold (ffd494) at 5.0; the fill is the sky's blue from above (a8c2ea) and
    // the ground's warm grey from below at 0.8, the rig's share of it 0.9 and its light thrown back 0.6. One sky and
    // one hour over moor, walk and garden; nothing here is set by place or by the clock. What stands in baked shade
    // keeps 0.22, 0.27 and 0.36 of its lit red, green and blue (the part's SHADE_KEEPS: cooler, the blue kept most),
    // the same on every seed. COUNTED ON WHAT IS DRAWN (G11), the whole line every 5 m on five seeds, 330 pictures:
    // no picture has more than 3.7 in 100 of its pixels at 250 of 255 and over (the sky by the sun), nor more than
    // 1.9 in 100 black. The sky warms toward the sun's side (scatterColor) and the clouds are lit warm on that side
    // (their lit tone).
    const sunTo = new THREE.Vector3(PLAN.sunTo[0], PLAN.sunTo[1], PLAN.sunTo[2]).normalize();
    const sunElevation = Math.asin(sunTo.y) * 180 / Math.PI;
    const sunAzimuth = Math.atan2(sunTo.x, -sunTo.z) * 180 / Math.PI;
    const sky = makeSky({
      rng: stream('sky'), preset: 'day', sunElevation, sunAzimuth,
      zenith: '#6c99d3', mid: '#a4c3e3', horizon: '#e7ecec', ground: '#8a7f6c',
      scatterColor: '#ffdca6', scatter: 0.4, sunColor: '#ffe9c4',
      clouds: { coverage: 0.4 + 0.16 * mood, softness: 0.3, scale: 1.15, lit: '#f8e9cc', shade: '#a2adc2', wind: [0.012, 0.005] },
      clouds2: { coverage: 0.3, stretch: 1, opacity: 0.45, lit: '#f6efe2', shade: '#b4bccb' },
      lightColor: '#ffd494', lightIntensity: 5.0, ambientColor: '#a8c2ea', groundLight: '#8f8468', ambientIntensity: 0.8,
      lightElevationMin: 8,
    });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 0.9, bounce: 0.6 });
    scene.add(rig.object);
    // (G10c: the air a little bluer and a little more of it: a thing 300 m off is 14 parts in 100 air, where 9)
    const fogColor = new THREE.Color('#cfd9e6').lerp(sky.horizonColor, 0.4);
    scene.fog = new THREE.FogExp2(fogColor, 0.0013);
    await breath(11.5, 13.5);

    // ------------------------------------------------------------ the line: the part's arithmetic, the same on every seed
    const route = layRoute();
    const path = makePath(routePoints(route));
    const LEN = route.length;
    // the film's pace by place: metres a second at the metre of route that u stands for (the engine keeps only its shape)
    const pace = (u) => speedAt(route, Math.max(0, Math.min(1, u)) * LEN) / 7.1;
    let seconds = 0;
    for (let d = 0; d < LEN; d += 0.5) seconds += 0.5 / speedAt(route, d + 0.25);
    await breath(13.5);

    // ------------------------------------------------------------ the world's clock, wind and cloud shadow (uniforms set in update only)
    const clock = makeClock();
    clock.uWind.value = 0.7 + 0.5 * mood;               // a still day to a breezy one; never over the part's WIND_MAX
    // the kit's ONE wind and ONE wind material (its bark, its leaf atlas): the old trees, the hanging roses and the grass
    // GUSTS CROSS THE PLACE AS BANDS (G7): on the grass and the bulb lawns about 29 m from crest to crest at 4.8 m/s,
    // on the standing trees and curtains broad ones; the part's own leaves (ivy, bare wood, moor) read the same vectors
    const wind = flora.makeWind({ direction: [0.92, 0.38], strength: 0.55 + 0.4 * mood, speed: 0.9, gustScale: 0.18, gustiness: 0.5 });
    clock.gWind.value = wind.uniforms.uFloraWind.value; clock.gGust.value = wind.uniforms.uFloraGust.value;
    // (G10b: the bark's plates at 0.22 of the kit's measure, where they stood at 0.5: on a bough's shaded side between two lit
    // boughs the plates' cracks stood as a dark net laid on the wood; now they are a faint grain in shade and in sun alike)
    const greyOptions = { wind, backlight: 0.2, backlightTint: '#d9dde6', ambient: 1.7, leafAmbient: 1.9, detail: 0.22, detailScale: 2.0, barkBump: 0.55, sheen: 0.15 };
    // the grey's own sheet of bare twig and hanging rose (the kit's atlas holds leaves only), drawn by the same material kind in the same wind
    await breath(0.2, 14.5);
    const twigAtlas = await makeTwigAtlas(breath);
    const greyMat = flora.windMaterial({ ...greyOptions, map: twigAtlas.texture });
    owned.push(greyMat, twigAtlas.texture);
    // the grey's trees: where they stand (the part's rule; the seed deals inside it) before the ground takes its mounds
    const greyLay = layGrey(stream('grey-lay'), route);
    // the middle's places that the old trees decide: the wheeled chair (9 m from the line) and the fork's border (7 m),
    // each at the plan's place or the nearest place along the line's side that no old tree stands on; the blossom trees
    const chairAt = placeBy(greyLay.rule, greyLay.trees, PLAN.chair, 9, 1), forkAt = placeBy(greyLay.rule, greyLay.trees, PLAN.fork, 7, 1);
    const blossomLay = layBlossom(stream('blossom-lay'), greyLay.rule, greyLay.trees, chairAt, route);
    const standardsLay = layStandards(stream('blossom-standards'), greyLay.rule, greyLay.trees, blossomLay);

    // ------------------------------------------------------------ the walls of the plan and the sun past them
    const walls = buildWalls(clock);
    scene.add(walls.object);
    owned.push(walls.object.geometry, walls.material);
    const sun = makeSun([...walls.panels, ...alcovePanels()]);   // (the yew alcove's wings and back shade as the walls do)
    await breath(17.5, 12);

    // ------------------------------------------------------------ the ground: one height of place, drawn, coloured by place
    const swell = await makeSwell(route, greyLay.trees, stream('swell'), breath);   // old beds, a sunk path, mounds at the tree feet
    const heightAt = makeHeight(ctx.noise, swell);
    // (G11) the way mown and trodden under the line: the part's rule of place for grass and flowers, and the floor's tone there
    const way = makeWay(greyLay.rule, heightAt);
    const groundColor = makeGroundColor(ctx.noise, sun.sunAt, way.tone);
    const terrain = await T.makeTerrainAsync({
      rng: stream('ground'), noise: ctx.noise, height: heightAt, path, corridor: false,
      bounds: [-470, -300, 330, 300], cell: 3, near: 34, levels: 5, maxTriangles: 60000,
      biome: 'meadow', color: groundColor, sunDir: sunTo, shadow: 0, ao: 0.2, skirt: 30,
      palette: { tufts: 0.28, pebbles: 0.45, detail: 0.3, bump: 0.3, cracks: 0, patchAmount: 0, strata: 0, clouds: 0.09, cloudSize: 520, cloudSpeed: 9 },   // (clouds: the one depth of the cloud shade, mild: 0.09 since G11 by the bound said at the part's SHADE_GLSL; bump 0.3 since G10c, where 0.5: under the low key at 5.0 the ground's small relief turned from the sun lay as dark blots on bare ground)
    }, kitBreath);
    scene.add(terrain.object);
    // the clouds' shadow drifts over the ground by the world's clock (the kit's field); the same field is handed to
    // every drawn surface of the part so that walk, walls, ivy and things darken under the same cloud
    const cloudField = terrain.uniforms && terrain.uniforms.uTCloud ? terrain.uniforms.uTCloud.value : null;
    clock.gCloudTex.value = terrain.detailTexture || null;
    await breath(7, 16.5);

    // ------------------------------------------------------------ the far ridge of the moor all round, under haze
    const ridges = T.makeHorizonRidges({
      rng: stream('ridge'), layers: 2, radius: [1300, 2700], height: [22, 70], base: -10, segments: 160, jagged: 0.1, coverage: 1,
      colorNear: '#8a8494', haze: fogColor, hazeNear: 0.72, hazeFar: 0.94, footHaze: 0.8, sunDir: sunTo, sunColor: '#ffe2b8', ambient: '#a3b5ca', rim: 0.25,
    });
    scene.add(ridges.object);

    // ------------------------------------------------------------ the walk's own surface (raked gravel between kerbs of brick on edge, turf verges)
    const walk = buildWalk(route, sun.sunAt, clock);
    scene.add(walk.object);
    owned.push(walk.object.geometry, walk.material, walk.shade, walk.paths.geometry, walk.paths.material);
    // the moor's floor beside the line (G10b): thatch, peat in the worn patches, the track with its ruts, small
    // stones; a drawn sheet of its own over the ground, from behind the line's start to the gateway
    const moorFloor = buildMoorFloor(heightAt, groundColor, clock);
    scene.add(moorFloor.object);
    owned.push(moorFloor.geometry, moorFloor.material);
    await breath(16.5, 15);

    // ------------------------------------------------------------ the ivy on the door wall: mass, leaves, stems, trails
    const ivyColors = makeIvyUniforms();
    const ivyMass = await buildIvyShell(sun.sunAt, ivyColors, clock, breath);
    await breath(16.5);
    // (the door wall's long meshes go in bands along the wall: once we are inside, three leaves out what lies behind)
    for (const m of splitBands(ivyMass.object, 2)) { scene.add(m); owned.push(m.geometry); }
    owned.push(ivyMass.material);
    await breath(5.5, 12);
    const ivyLeaves = await buildIvyLeaves(sun.sunAt, ivyColors, clock, stream, breath);
    await breath(6, 14.5);
    for (const m of splitBands(ivyLeaves.object, 4)) { scene.add(m); owned.push(m.geometry); }
    owned.push(ivyLeaves.material);
    await breath(12.5, 16);

    // ------------------------------------------------------------ the moor's plants and rocks: where they stand (rules of place in the part)
    const moor = layMoor(stream('moor'), heightAt);
    // (G10b) the moor clothed beside the line: hummocks and tussocks on a lattice of place, by a stream of their own
    moor.cloth = layMoorCloth(stream('moor-cloth'), heightAt, moor);
    const far = layFarWood(stream('far'), heightAt);          // the wood's edge beyond the grounds, in fixed rows

    // ------------------------------------------------------------ the made things: the folded leaf, the walk's things,
    // the kitchen garden's beds, the wood's edge, the moor's heather, gorse, rocks and rough grass
    const things = await buildThings({ sunAt: sun.sunAt, stream, route, heightAt, clock, moor, far, middle: { chair: chairAt, fork: forkAt }, yieldNow: breath });
    await breath(1);
    for (const m of await splitBandsAsync(things.object, 6, 0, 1.5, breath)) { scene.add(m); owned.push(m.geometry); }
    owned.push(things.material);
    scene.add(things.glass.object); owned.push(things.glass.object.geometry, things.glass.material);
    // the moor's near form (G10b): the clothing's hummocks and tussocks, the gorse's sprays, the heather's sprigs
    if (things.moorNear) { scene.add(things.moorNear.object); owned.push(things.moorNear.object.geometry, things.moorNear.material); }
    await breath(1.5, 10.5);

    // ------------------------------------------------------------ winter wood: the trained fans, the kitchen garden's
    // fruit trees, the old orchard (all bare; nothing outside the garden reads the season: it is S 0 there)
    const wood = await buildWood({ sunAt: sun.sunAt, stream, colors: ivyColors, clock, moor, far, yieldNow: breath });
    await breath(2.5);
    for (const m of splitBands(wood.object, 6, 0)) { scene.add(m); owned.push(m.geometry); }
    owned.push(wood.material);
    // ------------------------------------------------------------ the robin (G7): one small bird on a round of its
    // own between fixed perches of the walk (the spade its long sit), posed from the world's clock and nothing else;
    // where it is in its round at clock zero is the seed's (a stream of its own)
    const robin = makeBird(clock), robinRound = layRobin(things.perch, wood.tops, sun.sunAt, stream('robin-phase')), birdNow = {};
    robin.set(birdPose(robinRound, 0, birdNow));
    scene.add(robin.object);
    owned.push(robin.geometry, robin.material);
    await breath(6);
    // the orchard trees' long shadows across the walk, from the limbs the seed dealt them (read by the walk's sheet)
    await walk.castTrees(wood.casters, breath);
    await breath(6, 12);

    // ------------------------------------------------------------ the grey: the old trees hung with rose inside the door,
    // their curtains and bridges (by the seed, inside the part's rule for the sight lane and the flown line)
    const grey = await buildGrey({ lay: greyLay, sunAt: sun.sunAt, rng: stream('grey-build'), stream, heightAt, material: greyMat, yieldNow: breath });
    // THE WEST CUT (G10b): a mesh of the inside goes in two by its triangles: what can show from the line's metres
    // west of the kitchen door's east jamb (over the door wall's top, through the doorway or past the wall's ends: the part's count, splitWest) and what cannot;
    // the second hangs in one group that update draws only while the eye stands east of that plane
    const westHid = new THREE.Group();
    westHid.name = 'garden-inside-unseen-from-west'; westHid.visible = false;
    scene.add(westHid);
    const addWest = async (mesh) => {   // (G11: the cut in three breaths)
      const cut = await splitWestAsync(mesh, route, breath);
      if (cut.shown) { scene.add(cut.shown); owned.push(cut.shown.geometry); }
      if (cut.hidden) { westHid.add(cut.hidden); owned.push(cut.hidden.geometry); }
    };
    await breath(10.5);
    await addWest(grey.object);
    await breath(0.5);
    // the blossom trees of the middle (plum and cherry, white or shell pink by tree), three meshes by region
    const blossom = await buildBlossom({ trees: blossomLay, rule: greyLay.rule, sunAt: sun.sunAt, rng: stream('blossom-build'), rngStd: stream('blossom-heads'), stream, heightAt, material: greyMat, standards: standardsLay, dial: true, yieldNow: breath });
    await breath(16); for (const m of blossom.objects) await addWest(m);
    await breath(0.3);
    // THE GREAT ROSE TREE at the lane's end (160, 14), its neighbour on the route's right hand and the ONE GREAT BRIDGE of
    // rose between them: dealt by the seed as every tree is, inside the part's bounds (ROSE_TREE), which hold its
    // form on every seed (one mesh of the grey's one material)
    const roseTree = await buildRoseTree({ rule: greyLay.rule, sunAt: sun.sunAt, rng: stream('rose-tree'), stream, material: greyMat, yieldNow: breath });
    scene.add(roseTree.object);
    owned.push(roseTree.geometry);
    await breath(2);
    // THE LAST LAWN (x over 118) by a stream of its own: where the walk's standard roses and low bushes stand (built
    // here as one mesh: they cast), and the places of the borders, the island beds, the fallen petals and the daisies
    const farLay = await layFarEnd({ rng: stream('lastlawn-lay'), rule: greyLay.rule, heightAt, grey: greyLay.trees, blossom: blossomLay, standards: standardsLay, more: stream('finale-lay'), yieldNow: breath });
    const farRoses = await buildFarRoses({ standards: farLay.standards, bushes: farLay.bushes, rule: greyLay.rule, sunAt: sun.sunAt, rng: stream('lastlawn-roses'), stream, heightAt, material: greyMat, yieldNow: breath });
    for (const m of farRoses.objects) scene.add(m);
    owned.push(...farRoses.geometries);
    await breath(0.3, 11.5);
    // the undergrowth is laid out first (places only): its bushes cast, and the grass gives way where a thing lies
    // (the greening thickets of the middle are laid with it, by a stream of their own, clear of the blossom trees)
    const underLay = layUnder({ rng: stream('under-lay'), rule: greyLay.rule, heightAt, trees: grey.trees, blossom: blossomLay, rngT: stream('thickets-lay') });
    // the long shadows of every trunk and bough, of the blossom's clouds, the standard roses, the bushes and the dial,
    // baked along the sun: one multiply sheet over the ground, and the same function shades the grass. A pool of sun
    // is left on the wheeled chair.
    const casters = middleCasters({ heightAt, mounds: underLay.mounds, chair: chairAt, fork: forkAt });
    await breath(11.5, 18);
    const shadows = await bakeShadows({ trees: [...grey.trees, ...blossom.trees, ...roseTree.trees], falls: [...grey.falls, ...roseTree.falls], forms: [...blossom.forms, ...casters.forms, ...roseTree.forms, ...farRoses.forms], pools: casters.pools, late: casters.late, heightAt, sunAt: sun.sunAt, yieldNow: breath });
    await breath(1, 16.5);
    const sheet = buildShadowSheet(shadows, heightAt, clock, scene.fog.density);
    scene.add(sheet.object);
    owned.push(sheet.geometry, sheet.material, sheet.texture);
    await breath(16.5, 12);
    // the grass, long and unmown, by the kit's maker in the one wind: it takes the ground's own colour (so the season
    // shows in the blades) and the baked shadows; flattened and paler under the old trees
    // the bulb lawns are laid first (places only): drifts of crocus, of daffodil and narcissus, of bluebell and iris, each
    // kind by its window of the season; the grass gives way to a drift
    const lawnForms = bulbForms();
    await breath(12, 14);
    const lawns = await layLawns({ yieldNow: breath, rng: stream('lawns-lay'), route, rule: greyLay.rule, heightAt, grey: grey.trees, blossom: blossomLay, standards: standardsLay, mounds: underLay.mounds, edging: underLay.edging, chair: chairAt, fork: forkAt, free: underLay.clear, forms: lawnForms, way });
    const thingsClear = middleClear(forkAt), clear = (x, z) => underLay.clear(x, z) * blossom.clear(x, z) * thingsClear(x, z) * lawns.clear(x, z) * farLay.clear(x, z);
    const grassPlan = makeGrassPlan({ trees: grey.trees, groundColor, shade: shadows.shade, heightAt, rule: greyLay.rule, density, clear, way, path, sill: route.sill / route.length });
    const grasses = [];
    for (const g of grassPlan.sets) {
      await flora.prepareLeafTexture(g.materialOptions, kitBreath);
      const made = await flora.makeGrassAsync({ ...g, rng: stream('grass-' + g.name), wind }, kitBreath);
      made.object.name = 'garden-grass-' + g.name;
      scene.add(made.object);
      grasses.push(made);
      owned.push(made.material);
      if (made.material && made.material.map) owned.push(made.material.map);
      for (const m of made.meshes || []) owned.push(m.geometry);
    }

    // ------------------------------------------------------------ the undergrowth: bramble and old rose mounds, the
    // fallen wood, leaf drifts, lying grass, the lost beds' stone edging (one mesh of the grey's one material)
    const under = await buildUnder({ lay: underLay, rule: greyLay.rule, sunAt: sun.sunAt, shade: shadows.shade, rng: stream('under-build'), rngT: stream('thickets-build'), heightAt, material: greyMat, yieldNow: breath });
    await breath(2.2);   // (a hand-back between the undergrowth's last piece and its west split: together they made one long step)
    await addWest(under.object);
    await breath(0.2);
    // ------------------------------------------------------------ the robin's mate (G7): a second small bird, inside,
    // on a round of its own between a low grey bough (its long sit), a rose bush's top, the fork's handle and a
    // blossom bough, all on the flown line's right hand; posed from the world's clock and nothing else
    const mateRound = layMate({ rule: greyLay.rule, grey: greyLay.trees, blossom: blossomLay, mounds: underLay.mounds, fork: things.perch.fork, sunAt: sun.sunAt, heightAt, rng: stream('mate-phase') });
    await breath(11.5);
    const mate = mateRound ? makeBird(clock) : null, mateNow = {};
    if (mate) { mate.set(birdPose(mateRound, 0, mateNow)); scene.add(mate.object); owned.push(mate.geometry, mate.material); }
    await breath(1);

    // ------------------------------------------------------------ the roses on the four walls' inner faces: real form
    // (canes, sprays, mounds; a mesh a wall, of the grey's one material; the season at each plant's own root) and
    // their soft shade on the brick as one multiply layer
    const wallRoses = await buildWallRoses({ sunAt: sun.sunAt, stream, heightAt, rule: greyLay.rule, material: greyMat, yieldNow: breath });
    for (const m of wallRoses.objects) { if (m.name === 'garden-wall-roses-0') for (const b of splitBands(m, 2, 2, 3)) { scene.add(b); owned.push(b.geometry); } else await addWest(m); }
    // at the far end (x over 116) they are lifted into CASCADES: heaps over the coping, garlands down the face, swags
    // of bloom between (a mesh a wall; their shade goes into the same lattice)
    const cascades = await buildCascades({ sunAt: sun.sunAt, stream, heightAt, rule: greyLay.rule, material: greyMat, shade: wallRoses.shade, yieldNow: breath });
    for (const m of cascades.objects) scene.add(m);
    owned.push(...cascades.geometries);
    await breath(0);
    const wallShade = buildWallShade(wallRoses.shade, scene.fog.density);
    scene.add(wallShade.object);
    owned.push(wallShade.geometry, wallShade.material, wallShade.texture);
    await breath(7.5);

    // ------------------------------------------------------------ THE FAR END. The yew alcove round the way out: its
    // shaggy hull (fixed geometry: it is what hides the ring), its two urns and its seat, the roses over it; one mesh of
    // the grey's one material, the ring's light standing on it by place
    const yewMat = makeYewMaterial(clock);   // (G10b: the yew's hull in its own drawn material)
    owned.push(yewMat);
    const alcove = await buildAlcove({ sunAt: sun.sunAt, rng: stream('alcove'), stream, material: greyMat, yew: yewMat, heightAt, yieldNow: breath });
    await breath(3.3);
    await addWest(alcove.object);
    await breath(0.1);
    await addWest(alcove.hull.object);
    await breath(0.1);

    // ------------------------------------------------------------ falling petals under and beside the blossom trees
    // (G9c): the part's own field, one mesh on the world's clock. Each petal's whole fall column is dealt at build
    // 3 m and more from the flown line in plan; nothing is tested or changed while the world runs.
    const petalList = await layPetals({ rng: stream('petals'), rule: greyLay.rule, trees: blossomLay, heightAt, sunAt: sun.sunAt, wind: clock.uWind.value, yieldNow: breath });
    const petals = makePetals(clock, petalList);
    scene.add(petals.object);
    owned.push(petals.geometry, petals.material);
    await breath(14.5);

    // ------------------------------------------------------------ the green points and the snowdrops from the sill
    // (G10c: the bulbs stand in the one shade field: the sun of place past the walls times the trees' clear share there)
    const bulbs = await buildBulbs({ sunAt: (x, y, z) => sun.sunAt(x, y, z) * (1 - shadows.at(x, z)), rng: stream('bulbs'), route, heightAt, clock, trees: grey.trees, edging: underLay.edging, density, yieldNow: breath });
    scene.add(bulbs.points.object, bulbs.drops.object);
    owned.push(bulbs.points.geometry, bulbs.drops.geometry, bulbs.material, bulbs.points.object, bulbs.drops.object);
    await breath(1.3);

    // ------------------------------------------------------------ the bulb lawns: every set is one call of the kit's
    // scatter over the part's own forms and places, nodding in the one wind, of the grey's one material, drawn at
    // every distance (G9a: no fade material, no cull distance). The lane's bands, the west and the south, the crocus
    // by the line and the washes stand as themselves from every place. The sets marked `far` (the fine daffodils,
    // narcissi, bluebells and iris wherever dealt, a lane band's few too, and the north east's pools) hang in one group and their FAR STAND-INS in another:
    // a stand-in is a mesh of the part's two-triangle form on the real set's OWN store of places, turns, scales
    // and tints (no stream is drawn for it). update shows the stand-ins while the eye stands west of the cut's plane
    // and the sets themselves east of it: for these the door wall's inner face, x 0 (stand-ins on the line's metres
    // 0 to 120.6); for the last lawn's below x 30 (metres 0 to 151.4). A cut by the eye's side, nothing by distance.
    const flowerCut = (x, name) => {
      const near = new THREE.Group(), far = new THREE.Group();
      near.name = name + '-near'; far.name = name + '-far'; near.visible = false;
      scene.add(near, far);
      return { x, near, far };
    };
    const lawnCut = flowerCut(FAR_CUT.lawn, 'garden-lawn-flowers'), endCut = flowerCut(FAR_CUT.end, 'garden-end-flowers');
    // (G10b) the yew's shag (its true sprays, the tufts and the fallen needles at its foot) stands with the end's near
    // sets: shown while the eye is east of x 30. (G11) West of it ITS FAR FORM stands with the end's far forms (one
    // broad kite for every five of the shag, of their summed area and their mean colours: a swap, nothing left
    // out); what of it cannot show from west of the west cut's plane is drawn only east of that plane
    endCut.near.add(alcove.shag.object);
    owned.push(alcove.shag.geometry);
    const shagFar = splitWest(alcove.shagFar.object, route), endWestHid = new THREE.Group();
    endWestHid.name = 'garden-end-far-unseen-from-west';
    endCut.far.add(endWestHid);
    if (shagFar.shown) { endCut.far.add(shagFar.shown); owned.push(shagFar.shown.geometry); }
    if (shagFar.hidden) { endWestHid.add(shagFar.hidden); owned.push(shagFar.hidden.geometry); }
    const standIn = (made, form, cut) => {
      const geo = farStandIn(form);
      owned.push(geo);
      cut.near.add(made.object);
      for (const m of made.meshes) {
        const t = new THREE.InstancedMesh(geo, m.material, m.count);
        t.instanceMatrix = m.instanceMatrix; t.instanceColor = m.instanceColor; t.frustumCulled = m.frustumCulled;
        if (m.boundingSphere) t.boundingSphere = m.boundingSphere.clone();
        t.name = 'garden-flower-far';
        cut.far.add(t);
        owned.push(t);
      }
    };
    owned.push(lawnForms.wash, lawnForms.low, lawnForms.tuft, ...lawnForms.fine, ...lawnForms.pool);
    const lawnSets = [];
    for (const S of lawns.sets) {
      const form = (S.geo === 'fine' || S.geo === 'pool' ? lawnForms[S.geo][S.kind] : lawnForms[S.geo]).clone();
      const made = flora.makeScatter({ rng: stream('lawns-' + S.name), points: S.points, variants: [form], material: greyMat, chunks: 1, shade: lawnShade(S, shadows.shadeAll), tint: 0.08, hue: 0.02, stretch: 0.15 });
      made.object.name = 'garden-lawn-' + S.name;
      if (S.far) standIn(made, form, lawnCut); else scene.add(made.object);
      lawnSets.push(made);
      if (lawnSets.length % 4 === 0) await breath(3.6);
      owned.push(form);
      for (const m of made.meshes) owned.push(m.geometry, m);
    }
    // the last lawn's borders and island beds the same way, every set drawn at every distance: the pools of colour
    // and the fallen petals stand as themselves from every place; the real flowers and the daisies are marked `far`
    // (their stand-ins while the eye stands west of x 30, themselves east of it)
    const borderForms = farForms();
    owned.push(borderForms.petal, borderForms.daisy, ...borderForms.fine, ...borderForms.pool);
    await breath(7);
    for (const S of farLay.sets) {
      const form = (S.geo === 'fine' || S.geo === 'pool' ? borderForms[S.geo][S.kind] : borderForms[S.geo]).clone();
      const made = flora.makeScatter({ rng: stream('lastlawn-' + S.name), points: S.points, variants: [form], material: greyMat, chunks: 1, shade: shadows.shadeAll, tint: 0.08, hue: 0.02, stretch: 0.15 });
      made.object.name = 'garden-lastlawn-' + S.name;
      if (S.far) standIn(made, form, endCut); else scene.add(made.object);
      lawnSets.push(made); if (lawnSets.length % 4 === 0) await breath(1.4);
      owned.push(form);
      for (const m of made.meshes) owned.push(m.geometry, m);
    }
    await breath(0.5);

    // ------------------------------------------------------------ the rest of the life (G7 piece 3): the sunlit
    // gaps' places first, then bees, white butterflies, small birds, rooks, larks and the gaps' motes as ONE mesh
    // moved in its vertex stage on the world's clock alone (nothing runs for it in update); each kind a stream of its own
    const lifeTrees = [...grey.trees, ...blossomLay];
    const shaftsLay = layShafts({ rule: greyLay.rule, route, rng: stream('life-shafts'), heightAt, sunAt: sun.sunAt, shadeAt: shadows.at, trees: lifeTrees, mounds: underLay.mounds });
    const lifeList = layLife({ rule: greyLay.rule, stream, heightAt, sunAt: sun.sunAt, shadeAt: shadows.at, grey: grey.trees, trees: lifeTrees, lawns: lawns.drifts, far: farLay.drifts, shafts: shaftsLay });
    await breath(10.6);
    const life = makeLife(clock, lifeList);
    scene.add(life.object);
    owned.push(life.geometry, life.material);
    // (G10b: no column of lit air is drawn; a sunlit gap shows by its lit ground and by its motes)
    await breath(10);

    // ------------------------------------------------------------ the gaze (S7): the part's three pulls, each between
    // two marks of the place and 30 m long and more, never two at once: the kitchen garden's open green door on the
    // left; one curtain-hung tree of the north side; the dial on the right, then the great rose tree up its height.
    // None in the first 30 m, none from 20 m before the sill to 30 m past it, none on the last straight. Metres of
    // route become shares of the path here and nowhere else; the marks are places, the same at every hour.
    const gazeMark = new THREE.Vector3();
    const pois = layGaze(route, grey.trees, grey.info.bridgesAt, heightAt).map((g) => ({ from: g.from / LEN, to: g.to / LEN, fade: g.fade, weight: g.weight, at: (time, u) => g.at(u * LEN, gazeMark) }));

    return {
      scene, path, duration: Math.round(seconds * 10) / 10, pace,
      ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 16, sway: 0.5, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: PLAN.ringR, color: '#ffe6b0', glow: 1.1, revealDistance: 130 },
      post: {
        exposure: 1.12, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.03, tint: '#fff8ee', shadowTint: '#141a2a', vignette: 0.24, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera) {
        clock.uTime.value = time; wind.update(time);
        sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); ridges.update(dt, time, camera);
        for (const g of grasses) g.update(dt, time, camera);
        for (const g of lawnSets) g.update(dt, time, camera);
        // the flowers' two cuts (G9a): each by the eye's side of its typed plane, never by a distance
        const eyeX = camera.matrixWorld.elements[12];
        for (const c of [lawnCut, endCut]) { c.near.visible = eyeX >= c.x; c.far.visible = eyeX < c.x; }
        // the ivy's far forms (G10a): by the eye's side of two typed planes, never by a distance
        ivyColors.uIvyFar.value = eyeX < IVY_CUT.west || eyeX > IVY_CUT.east ? 1 : 0;
        // the west cut (G10b): what of the inside cannot show from west of its plane is drawn only east of that plane
        westHid.visible = eyeX >= WEST_CUT.x; endWestHid.visible = eyeX >= WEST_CUT.x;
        for (const b of [bulbs.points, bulbs.drops]) b.object.count = eyeX >= WEST_CUT.x ? b.count : b.shown;
        if (cloudField) clock.gCloud.value.copy(cloudField);
        robin.set(birdPose(robinRound, time, birdNow));
        if (mate) mate.set(birdPose(mateRound, time, mateNow));
      },
      dispose() {
        sky.dispose?.(); rig.dispose?.(); terrain.dispose?.(); ridges.dispose?.();
        for (const o of owned) o.dispose?.();
      },
    };
  },
};
