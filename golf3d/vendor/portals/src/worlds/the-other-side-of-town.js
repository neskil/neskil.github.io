// The Other Side of Town. A television world: an original place of ours on the IDEA a series is known for (named only in
// the header fields below): a quiet small town has a cold dead double lying just behind thin places in the air, and
// the lights on the living side answer what moves on the dead side.
//
// ROUND EIGHT (design/tv/notes/the-other-side-of-town-mend-r8.md; this head replaces the history of rounds one to
// seven: the spruce, storm, bands, drapes and falling snow of the early rounds and round seven's two great side
// leaves of Main Street are no longer in the world).
//
// ROUND EIGHT C (design/tv/notes/the-other-side-of-town-mend-r8c.md): THE LEAVES STAND OPEN, ALWAYS, and every
// place, size and look follows a rule of the PLAN. Nothing in the world is placed, timed, sized or shaped by where
// the eye or the lens is. THE ONE DECLARED EXCEPTION is the brief's: bulbs and their ghosts thin away inside 8 m of
// the lens and keep a floor and a cap in pixels; the lead allows it for every dab of light the part's bulb shader
// draws (lamp heads, lanterns, far window glows, far lamps and moths with them: said at its lines there).
// ROUND EIGHT D (design/tv/notes/the-other-side-of-town-mend-r8d.md): besides that exception a FRAGMENT'S REACH (which
// follows the picture's size) is read in two shaders of the part, and only to choose between a pattern and that
// pattern's own mean: a clapboard wall's lines and its rime's lip, a brick wall's courses and a roof's wind ridges
// fade to means counted at load, and a leaf's edge finer than a fragment keeps its light. No mean tone, size or
// light follows the picture's size. A GREAT LEAF THAT STANDS IN A CROSSING STANDS IN AN OPEN GREEN (the part's
// GREENS and greenLot).
//
// THE LAW OF THE LEAVES (the part's deadAt; in every material of both copies and of both skies). EVERY FRAGMENT SHOWS
// THE LOOK OF THE SIDE THE EYE STANDS ON (living while the eye stands east of the plane x = -80, dead while it stands
// west of it), TURNED TO THE OTHER LOOK WHERE THE SIGHT LINE FROM THE EYE TO IT PASSES THROUGH THE OUTLINE OF A LEAF
// standing between them (a sight line through two leaves shows the eye's own side's look again). It is decided per
// fragment by the leaf's own fixed plane and outline and the eye's place: no metres flown, no fade, no seed, and no
// clock but the leaf's own slow breathing (its outline's width, a tenth, each 5 s, each leaf with a phase from its
// own place). Things of one look only are drawn
// or left out by the same test: per fragment (a crown of leaves, the rime's lace and combs, a pool of light, a moon
// shadow, smoke, the dead sky's dome and its northern lights) or per small thing at its own place (a bulb, a falling
// leaf, a frond of rime, a mote of diamond dust, a porch swing, a weathervane).
//
// THE SIXTEEN LEAVES (the part's LEAVES: fixed in the plan, the same on every seed; each is two bright bowed edges, a
// close glow and motes on an upright plane of its own). EVERY LEAF STANDS OPEN AT ITS FULL BREADTH ON EVERY VISIT.
// TWO ARE FLOWN THROUGH (L3 and LR, on the line). EVERY OTHER IS PASSED, under one rule of the plan named once in
// the part, LEAF_BACK: a thin place stands no nearer the flown line, in the plan, than TWICE ITS OWN HEIGHT, at any
// metre of the line, counted to the nearer end of its foot at its widest breath (the part's leafGap and leafTable
// work every leaf's distance out; each of the four hall leaves stands at the first lot of its row that keeps the
// rule).
//   L1  THE FIRST LEAF, bright plan (-16, 24.5), 3.4 by 7 m: on the first lot line north of the entry's crossing, its
//       middle on the front line of the houses west of the street: the dead side of the next house and yard
//   L2  bright plan (16, 80), 3.4 by 7 m, on the axis of the first cross street, in the front line of the houses east
//       of the street: the dead cross street and its corner
//   L3  THE FIRST THIN PLACE, on the plane x = -80 across the cross street (bright plan (-80, 160)), 5 by 15 m, flown
//       through: the dead street seen only inside its outline, the street alive all round it
//   L4  dark plan (-16, 80), 3.4 by 7 m, the same place as L2's on the dark copy, west of the dead street: the
//       living cross street and its corner
//   GC  dark plan (160, 240), 12 by 36 m, in the middle of the crossing east of the climb's end, facing the climb's
//       end. IT STANDS IN AN OPEN GREEN, as G3 does (one rule of the plan, the part's greenLot): the corner lots of
//       its crossing hold no house, nor does any lot whose ground comes within one height of the leaf behind its
//       foot line across its breadth, and no street tree stands where its crown would reach into that ground:
//       lawn, the verge's other trees and a small wound tree in each corner yard, so that the living town shows
//       through the leaf in depth and never as one house, row or crown close behind it
//   GT  THE GREATEST, 12 by 38 m, as tall as the water tower, 12 m before the tower's axis on the sight line from the
//       climb's end (the part's greatTower works its place out: about dark plan (111, 351)): its right edge runs down
//       the middle of the tank as the climb sees it, so that ONE TOWER STANDS HALF DEAD AND HALF ALIVE
//   G3  dark plan (0, 400), 14 by 36 m, in the roadway of the home street's far crossing, north of Main Street,
//       facing the climb's end, in its open green: the goal of the first dead street's long view and of the turn
//   LR  THE LAST, the one great leaf of Main Street, dark plan (-232, 320), 24 by 36 m, at the square, the ring in its
//       lower middle: the living square and the square's oak
//   S1 to S4  DOOR-SIZED LEAVES IN MAIN STREET'S SHOP FRONTS (5 by 4.6 m, on alternate sides, twice their height and
//       more from the line): in the two corner stores that flank the courthouse square (north fronts), opposite the
//       courthouse's door and in the middle of the last row (south fronts); each stands a hand before the open front
//       of its own store, a lit shop inside (shelves, a counter, a lamp: plain forms, nothing lettered)
//   H1, H2, HC, H3  DOOR-SIZED LEAVES BEFORE HOUSE FRONTS OF THE DEAD TOWN (2.8 by 5.2 m), all four by one rule of
//       the plan (the part's HALLS: in its row, counted from its named place, the first lot that is no open green
//       and whose leaf keeps LEAF_BACK): H1 on the west side of the first dead street and H2 on its east side
//       beyond H1's lot, HC in the row north of the cross street the climb goes over, H3 in the row north of the
//       cross street beyond the climb's end: behind each a low house lit in every window, its glazed hall door in
//       the middle of its front (the part's addHall)
// THE LIVING SIDE'S LIGHT SPILLS OUT at the foot of each (the part's spill and hearth: fixed lights at fixed places):
// a broad amber fan on the dead look's snow, 7 to 57 m long (one and a half times the height of each great
// leaf of the air), warm on the walls, trunks and rime turned to it; from LR A CARPET OF WARM LIGHT 175 m down the
// middle of Main Street; a cold pale pool on the lawn at the bright street's leaves; and seen ALIVE through a leaf,
// the ground and the fronts just behind it glow warm.
//
// DECLARED AT THE HEAD (the brief's techNotes):
// - THE GROWTH on the dead side is RIME ICE: fronds of ice 0.5 to 3 m long streaming one way (away from the far point
//   the standing wind blows toward) from every pole, eave, bough and fence, longest on the water tower, the spire and
//   the oak; combs of needles on every wire and string; a lace of rimed twigs in every crown. White, crystalline,
//   weather. Nothing red grows; nothing holds a house; there is no creature and no figure, and nothing lettered.
// - THE HOUR IS FIXED: night. ctx.vary.hour is read and ignored.
// - ONE PLAN, BUILT TWICE (src/parts/the-other-side-of-town.js): plan (p east, q north) stands on the BRIGHT copy at
//   world (x, z) = (p, -q), only where x > -80, and on the DARK copy at world (-80 - q, -160 - p), only where x < -80.
//   Either copy can show either look (the law above).
// - THE LEAVES are light, a medium, not bodies. Two stand on the route's line by design and are flown through (L3,
//   and LR with the ring); every other stands twice its own height and more from the line's plan (LEAF_BACK).
// - THE DEAD SIDE IS DEAD: no window, lamp, lantern or shop front is lit at rest (dark panes with a faint moon glint
//   and frost ferns); THE GHOSTS OF THE BULBS ARE ITS ONLY OWN LIGHT, AND THEY CARRY IT (the cure of round eight, B): on
//   every rimed string the ghost bulbs are lit bulbs of cold white with the least blue, plainly seen at rest from the
//   street's length; most are lit and some stand dark; each blinks on the world's clock at its own slow rate, and
//   short runs of brightness start along a string and die (the part's bulbs' law: by each bulb's own dice, promised
//   at no place). They are never warm, never coloured, never red, and lay no warm light: their breath on the rime is
//   cold white; as the wave's front passes each flares whiter for a third of a second and every pane answers with one
//   cold flicker. No warm wash lies on the dead side but the leaves' spill. Its sky (the part's makeNight and aurora, drawn only where a ray is
//   seen dead; the kit's living night stands behind it): deep blue, fine stars, its own moon low in the west (the key
//   light), northern lights to 45 degrees up over the north and west and a fourth ribbon over the east (green at the
//   foot through violet to blue-violet; no red). Deep blue shade, bright moonlit snow, long moon shadows, ruts and
//   drifts, an uneven horizon. NOTHING FALLS: the air holds diamond dust (the part's makeDust: motes that hang at
//   places of their own along the dead line, drift slowly along the standing wind and flash in the moon; as a
//   medium they thin by true distance inside 0.6 to 2.5 m of the eye, and by nothing else).
// - THE LIVING SIDE (the bright street, and the dark copy wherever a leaf shows it): autumn crowns, lawns, lit
//   windows, lamps, strings in colour, the wet road with dappled pools, leaves falling, smoke rising from chimneys
//   (the part's makeSmoke), a weathervane turning, a porch swing swaying (the part's movers).
// - THE GREAT TREE IS THE SQUARE'S OAK (the part's OAK): 28 m tall, its crown reaching 17 to 19 m from its trunk, ON
//   THE SQUARE'S NORTH SIDE, 16 m north of Main Street's axis and 30 m behind the last leaf's plane (the cure of round
//   eight, A2: it stood on the axis and filled the last leaf with one mass); gold and copper with wound bulbs alive,
//   bare and feathered with rime dead. No spruce, no tiers, no star, no baubles, no market stall, no wreath anywhere.
// - THE LAST LEAF IS A WINDOW ONTO THE LIVING SQUARE (the cure of round eight, A): the living night's sky in its upper
//   part, the oak on its north side, Main Street's festoon going on behind it across the square (the street's own
//   even series of strings, at the street's own pitch as far as the plaza's west edge, none abreast of the oak's
//   trunk: the part's dealStrings), the square's lanterns and the lit
//   houses beyond it to either side of the ring. NOTHING SEEN THROUGH ANY LEAF IS RED (the part's noRed: a leaf's own
//   glass turns every red toward gold, for every leaf, eye and seed). The ring stands as a ring: its halo is held low
//   (portal.glow 0.2), so that no white lies over the leaf's foot.
// - THE WAVE through the bulbs and their ghosts runs on the world clock, for ever: d = |p| + |q| in the plan,
//   36 m a second, one front each 3.5 s, the same law on both copies: where a string crosses a leaf's outline the
//   front runs from living colour into ghost without a break.
// - THE DEAD SIDE'S LIGHT AND SHADE (round eight): the northern lights tint the snow (moving, on the world's clock);
//   the moon casts long blue shadows of houses, trees, poles, masts and the water tower; trunks, walls in shade and
//   windows stay dark (glass mirrors the northern lights faintly); every leaf lays its fan of amber. Nothing burns.
// - THE WATER TOWER (K.TOWER: in the middle of the block the climb heads for, where four back yards meet; 38 m to
//   its cap's tip) is the landmark of the air: dead, rimed on dark legs with icicles under its tank and its long moon
//   shadow across the roofs; alive (through GT), painted and lit from its foot.
// - MAIN STREET (round eight): stores of six bricks with cornices, piers, recessed doors, end walls and backs of
//   their own; kerb banks of ploughed snow, drifts, wandering ruts, cars under snow, dead lamp standards with
//   icicles, awnings bowed with snow; the last leaf's warm carpet coming up the street.
// - THE LINE, ITS HEIGHTS, THE PACE AND THE GAZE ARE GIVEN BY PLACES (the part's LINE, routes().marks and flight, in
//   metres of run); nothing is placed, timed or shaped by a fraction of the flight or by the lens, and every join and
//   mark is worked out in the part from the plan's own places. The bright street and the first dead street at
//   2.2 m, the gaze 7 degrees up. THE CLIMB begins at the outer edge of the far walk of the first dead crossing (L4
//   stands beside that crossing) and rises over the back lots toward the water tower, which stands on its heading,
//   the gaze on the tower; the rise takes the climb's whole course and ends where the climb ends and the turn
//   begins. THE HIGH PLACE: 25 m, from the climb's end, held into the turn as far as the place abreast of the water
//   tower; the pace is slow there and the gaze tilted 7 degrees up: the tower half dead and half alive along the
//   leaf's edge, the whole town with its warm fans, the northern lights. THE TURN: one left turn; the gaze pans with
//   it, from the place where the turn begins to the place where it ends over Main Street, from the tower's bearing
//   to the ring's, and from abreast of the tower the line sinks in one ease to 9.5 m at the turn's end, over the
//   crossing of the home street and Main Street. MAIN STREET: down to 3.2 m (the shop
//   fronts' height) by the second shop leaf, held to the third, in one slow S (3 m south of the axis abreast of the
//   first shop leaf, 3 m north abreast of the second, on the axis from the fourth on), rising to the ring 7.5 m up;
//   the gaze 8 degrees up and never more.
// - camera.nearThrough is set (0.3): the lens starts 2.2 m over the road, lower than an opening is tall; the road and
//   the fields exist for 400 m behind the entry and nothing solid stands in the cone 2.6 m + 15 m x d / 340 round the
//   entry axis.
// - The world sets neither portal.drawWithin nor portal.drawIn: the ring is whole at every metre. No double of the ring.
// - WHAT IS DRAWN IS CHOSEN BY WHERE THE EYE STANDS, never by where it looks and never by the metres flown: the
//   bright copy while the eye is east of x -81; the dark town's far things from 60 m before the plane; a near block's
//   small relief within 72 m of its square and its trees whole within 100 m; street things, rime and ghost bulbs in
//   lots along the dark line (cut by lines of the plan: the part's LOTS); a crown of leaves on the dead side (and
//   the rime on the living side) only while its mesh's own box can be seen through a leaf from where the eye
//   stands; pools, moon shadows, wires, falling leaves and smoke of the north lot only while the eye stands within
//   140 m of that lot's line.
// - THE RARE VISIT (vary.rare): the living night's moon is a great pale-gold harvest moon, full, in a clearer sky. No
//   snow lies or falls on the living look on any visit (round seven: the two looks are not two seasons; the brief's
//   older "first snow" on the rare visit is not built), and the dead look is the same on every visit.
// - SECTION 181: nothing in this file or in the part is brought in from published code; both are our own writing but
//   for common forms that belong to nobody (one-line sine hashes with constants of our own, smooth steps, rotations)
//   and what the kit gives.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as P from '../parts/the-other-side-of-town.js';

const K = P.K;

export default {
  id: 'the-other-side-of-town',
  name: 'The Other Side of Town',
  category: 'screen',
  placeKind: 'city',
  screen: 'Stranger Things',
  screenYear: '2016',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.55,
  async build(ctx) {
    const seed = ctx.seed, mk = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // (round five, the build's time) in the long loops the page is handed back by the WORK done since the last
    // hand-back, counted in vertices built or baked (w: the work of about 7 ms on a quiet machine; a piece is 1.6 of
    // them; every hand-back waits one turn of the page, so fewer and longer pieces build sooner; none comes near 50 ms), not at
    // every pass: a far house is a two-hundredth, a store a tenth
    // (a kind of work done for the first time in a build is dearer than its claim, the maps and the code being cold: it asks at once)
    // (and the first three hundred claims of a build count double: the first blocks are built by cold code)
    let owed = 0, asked = 0; const warm = new Set(), pause = (w, kind) => { owed += asked++ < 300 ? w * 2 : w; if (kind !== undefined && !warm.has(kind)) warm.add(kind); else if (owed < 1.6) return null; owed = 0; return ctx.yield(); };
    // every stream, taken once, in one list, each from the world's seed and its own name (none draws from another)
    const rSky = mk('sky'), rMoon = mk('moon'), rWave = mk('wave'), rAur = mk('aurora'), rDust = mk('dust'), rMoth = mk('moths'), rOrder = mk('rime-order'), rGhost = mk('ghost-order'), rChase = mk('chase');
    const vary = ctx.vary || {}, rare = !!vary.rare, density = vary.density ?? 1, detail = (ctx.quality && ctx.quality.detail) || 1;
    // the hour is fixed: night (vary.hour is read here and ignored on purpose)
    const hourIgnored = vary.hour;
    void hourIgnored;
    const scene = new THREE.Scene();
    // the bright side's moon (the kit's sky), its place by the seed (the brief: never behind the visitor at the
    // entry): over the far end of the home street, 4 to 11 degrees to its right; 15 to 30 degrees up: a low moon of
    // late autumn, clear above the crowns at the street's far end (a 16 m crown at the cross street stands 6 degrees
    // up from the entry) and no higher than a third of the way to the zenith
    const moonAz = 4 + rMoon() * 7, moonEl = 15 + rMoon() * 15, moonPhase = 0.6 + rMoon() * 0.35;
    // THE DARK SIDE'S OWN MOON IS ITS KEY LIGHT (round six; drawn by the part's night dome), in the DARK copy's plan:
    // low in the west, 18 degrees up, 8 degrees south of Main Street's axis. sunD = [dp, dq, cot]: the way its shadows
    // fall (east by north) and their length to a metre of height; keyP = [dp, dq, up]: the unit vector toward it
    const sunD = [0.9903, 0.1392, 3.078], keyP = [-0.9418, -0.1324, 0.3090], shades = [];
    await ctx.yield();
    const R = P.routes();
    await ctx.yield();
    const path = makePath(R.knots), L = path.length;
    await ctx.yield();
    const noiseTex = await P.makeNoiseTex(seed, ctx.yield);
    const U = P.makeShared(noiseTex);
    U.uPhase.value = rWave() * K.WAVE_PERIOD;
    // (the chase along the strings: where its round of three steps of 0.4 s stands, from a stream of its own)
    U.uChase.value = rChase() * 1.2;
    U.uSnow.value = 0;   // (round seven: no snow lies on the living look on any visit: the two looks are not two seasons)
    const matB = P.makeSurface(U, false), matD = P.makeSurface(U, true), roadB = P.makeSurface(U, false, true), roadD = P.makeSurface(U, true, true);
    // (round seven) a crown of leaves is the living look's alone (only 1), the rime's lace and ice the dead look's alone (only 2): each on both copies
    const leafB = P.makeSurface(U, false, false, true, 1), leafD = P.makeSurface(U, true, false, true, 1), laceD = P.makeSurface(U, true, false, true, 2), laceB = P.makeSurface(U, false, false, true, 2);
    const darkM = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(K.DARK_OX, 0, K.DARK_OZ);
    // darkFar: what of the dark copy lies far from the plane; drawn only while the eye stands within the plane's cross-fade
    // or beyond it (a level of detail by where the eye IS: from the bright streets it lies behind houses and haze)
    const darkFar = [], darkOuter = [], darkOuter2 = [], brightAll = [], darkDetail = [], darkNorth = [];   // darkOuter2 (round four, room): the outer town but for the first street's own far end: drawn from 30 m past the plane on (the mist of the thin place is 30 m behind by then; the first street's own far end is there 10 m sooner)
      // darkOuter: the dark town's outer sectors (240 m and more from its first street): drawn from 20 m past the plane on; brightAll: the bright copy, not drawn once the eye stands a metre past the plane (the eye stands in the dark copy there)
      // darkDetail: the dark copy's small things (ghosts, feathers, masts): drawn once the eye has left the home street's line toward the plane (x < -6)
    // ROUND FIVE (room): cells: the near blocks (their small relief and their trees swap by the eye's distance to the
    // block's own square); zones: lots along the dark line (street things, the rime's feathers) that swap or fill by
    // the eye's distance to the lot
    const movB = new P.Geo(8192), movD = new P.Geo(8192), movDN = new P.Geo(8192), movLB = [], movLD = [], movLDN = [];   // (round seven, F) the movers of each copy: porch swings, weathervanes, wires
    const farLeafD = new P.Geo(16384);   // (round seven, room) the far town's crowns of the dark copy alone: one mesh, drawn from everywhere on the dead side
    const cells = [], zones = [], dress = [], roadZ = [new P.Geo(8192), new P.Geo(16384), new P.Geo(2048)];
    const addBoth = (geo, inB, inD, mB, mD, order = 0, far = false) => {
      if (inB) { const m = new THREE.Mesh(geo, mB); m.renderOrder = order; m.matrixAutoUpdate = false; scene.add(m); brightAll.push(m); }
      if (inD) { const m = new THREE.Mesh(geo, mD); m.renderOrder = order; m.matrixAutoUpdate = false; m.matrix.copy(darkM); scene.add(m); if (far) (far === 3 ? darkOuter2 : far === 2 ? darkOuter : darkFar).push(m); }
    };
    await ctx.yield();

    // ------------------------------------------------------------------ the plan's lights and strings (dealt once)
    const lamps = P.dealLamps(seed);
    await ctx.yield();
    const street = P.dealStrings(seed), grid = P.makeBulbGrid();
    await ctx.yield();
    const nearBulbs = [], lampL = lamps.map((l) => [l.hp, l.hq, l.y, 1.0, 55, 1]);
    // (a bulb row's seventh slot: it hangs over a street; its eighth: it hangs on the bright side only, round four)
    for (const s of street.strings) { const n0 = nearBulbs.length; P.bulbsAlong(s.pts, s.sp, s.mix, 0, nearBulbs); for (let i = n0; i < nearBulbs.length; i++) { nearBulbs[i][6] = 1; nearBulbs[i][7] = s.brightOnly ? 1 : 0; } }
    const streetD = { strings: street.strings.filter((s) => !s.brightOnly), posts: street.posts.filter((o) => !o.brightOnly) };   // what of them the dark copy holds
    // THE FIRST CROSSING'S DRESS (round four): the wound corner posts with their lanterns, the hedges' and fences' strings
    const cross = P.dealCross(seed);
    for (const cs of cross.strings) P.bulbsAlong(cs.pts, 0.32, cs.mix, 0, nearBulbs);
    for (const cs of cross.spirals) P.bulbsAlong(cs.pts, 0.3, cs.mix, 0, nearBulbs);
    for (const l of cross.lanterns) lampL.push([l[0], l[1], l[2] - 0.2, 0.8, 30, 0]);
    // Main Street's lamp posts (round three): each lantern is a small lamp in the bake, each evergreen ring is wound with bulbs
    const lanterns = street.posts.filter((o) => o.lantern);
    for (const o of lanterns) lampL.push([o.p, o.q, o.h - 0.3, 0.7, 26, 0]);
    // (round seven: no ring of bulbs on a lamp post any more)
    await ctx.yield();

    // ------------------------------------------------------------------ the town, block by block
    const inBright = P.inBright, inDark = P.inDark;   // (where each copy stands: the part's rules, written once)
    // (the plan's measures this file cuts its lots by, each named once in the part: a block's length; the lots' lines
    // P.LOTS; the plane's place in the plan, PL; the near town's blocks and the whole town's)
    const B = K.BLOCK, LT = P.LOTS, PL = K.THIN1[0], SP = P.span(), TW = P.TOWN;
    const track2 = (i, j, low) => {
      // least plan distance from the block's square to either route (low: only where the lens is under 14 m)
      let best = 1e9;
      for (const T of [R.bright, R.dark]) for (let k = 0; k < T.length; k += 2) {
        if (low && T[k][2] > 14) continue;
        const dx = Math.max(i * B - T[k][0], 0, T[k][0] - (i + 1) * B), dy = Math.max(j * B - T[k][1], 0, T[k][1] - (j + 1) * B), d = Math.hypot(dx, dy);
        if (d < best) best = d;
      }
      return best;
    };
    const sectors = new Map(), farBulbs = new Map(), lightsOut = [], glows = [];
    const towerG = new P.Geo(4096), markLamps = [];   // (round six) the water tower's own mesh; the landmarks' lanterns as [p, q, y, the pool's width]
    const planTo = (T, p, q) => { let best = 1e9; for (let k = 0; k < T.length; k += 2) { const dd = Math.hypot(T[k][0] - p, T[k][1] - q); if (dd < best) best = dd; } return best; };
    const sectorOf = (i, j, b, d) => {
      const key = Math.floor(i / 3) + ':' + Math.floor(j / 3) + ':' + (b ? 1 : 0) + (d ? 1 : 0);
      // (a sector is three blocks by three, counted from the plan's origin) tier 1: a sector whose ground touches the
      // home street's axis and holds a stretch of it between the entry's line and the first thin place's cross street
      // (the two that flank the first street); 2: the outer town
      const si = Math.floor(i / 3), sj = Math.floor(j / 3), S3 = 3 * K.BLOCK, tier = si * S3 <= 0 && (si + 1) * S3 >= 0 && sj * S3 < K.THIN1[1] && (sj + 1) * S3 > 0 ? 1 : 2;
      if (!sectors.has(key)) { sectors.set(key, { g: new P.Geo(8192), leaf: new P.Geo(1024), lace: new P.Geo(1024), b, d, tier }); farBulbs.set(key, []); }
      return key;
    };
    await ctx.yield();
    // (the things are dealt before the blocks: a near block of the dead town takes the snow of its own cars. The deal
    // runs in the part's own steps, the page handed back between them, so that no step of the build is long)
    let things = null; for (const it = P.dealThingsSteps(seed); ;) { const s = it.next(); if (s.done) { things = s.value; break; } await ctx.yield(); }
    await ctx.yield();
    let nHouses = 0, nTrees = 0; const chimneys = [], leafCols = [], leafColsD = [], lightsOutD = [], shadesB = [], stood = new Map(), nearCells = new Set();
    // (round seven) where the dark copy's trees drop leaves in the living look: about the leaves that show them
    // (round seven, room) a crown of the dark copy is seen alive only through a leaf: within 70 m of the two leaves the
    // line passes close by (the dead street's L4 and the last, LR) it is leafed as richly as the bright copy's far
    // trees; elsewhere (seen through the great leaves, which stand twice their height and more from the line) with
    // four broad cards a clump
    // (the leaves of the dark copy that stand in the open and whose foot the dark line passes within two fronts'
    // depth, 2 K.FRONT: the dead street's side leaf and the last)
    const closeBy = P.LEAVES.filter((l) => l.copy === 'd' && l.role === 'great' && planTo(R.dark, l.p, l.q) < 2 * K.FRONT);
    const crownClose = (p, q) => { for (const l of closeBy) if (Math.hypot(p - l.p, q - l.q) < 70) return true; return false; };
    const fallsAt = (p, q) => { for (const l of closeBy) if (Math.hypot(p - l.p, q - l.q) < 46) return true; return false; };
    const deadB = P.deadB, DB = P.DEAD_B, deadBox = [-DB.p - 4, DB.p + 4, -DB.q1 - 4, -DB.q0 + 4];   // the bright copy's part that its side leaves can show dead (the part's rule), and its box in the world with 4 m to spare
    // ROUND THREE: the pools of light on the dark side's ground (below lit windows, before far houses, under far lamps)
    const pools = [], poolY = K.KERB + 0.07, AMBERP = '#ffb060';
    const winPools = (wins) => { for (const w of wins) pools.push([w[0], w[1], poolY, w[7] || AMBERP, Math.abs(w[0]) + Math.abs(w[1]), w[2], w[3], w[4], w[5], w[6] || 1]); };
    let started = false;
    for (let j = P.TOWN.j0; j <= P.TOWN.j1; j++) for (let i = P.TOWN.i0; i <= P.TOWN.i1; i++) {
      const b = inBright(i, j), d = inDark(i, j);
      if (!b && !d) continue;
      const first = !started; started = true;   // (the first block built pays for the part's lazy maps: it hands back between its own steps)
      const holds = (pt) => Math.floor(pt[0] / K.BLOCK) === i && Math.floor(pt[1] / K.BLOCK) === j;   // this block holds the plan point
      const exists = P.blockExists(i, j, seed), d2 = track2(i, j, false), near = d2 < 60, low = track2(i, j, true) < 45, liveD = d && d2 < 430;   // liveD: a great leaf can show this block of the dark copy alive
      // (a dark block whose whole square lies 250 m and more from the dark route: every house of it is a glow)
      let farDark = false; if (d && !b && !near) { let m = 1e9; for (let k = 0; k < R.dark.length; k += 2) { const T = R.dark[k], dx = Math.max(i * B - T[0], 0, T[0] - (i + 1) * B), dy = Math.max(j * B - T[1], 0, T[1] - (j + 1) * B), dd = Math.hypot(dx, dy); if (dd < m) m = dd; } farDark = m > 250; }
      const key = near ? null : sectorOf(i, j, b, d), g = near ? new P.Geo(16384) : sectors.get(key).g, leaf = near ? new P.Geo(2048) : sectors.get(key).leaf, lace = near ? new P.Geo(2048) : sectors.get(key).lace;
      // (round five, room: the near blocks' roadways lie in three meshes: the bright side's alone, those both copies
      // hold, the dark side's alone; where the bright copy does not stand, or the lens is high, they are plain quads)
      const road = near ? roadZ[b && d ? 1 : b ? 0 : 2] : null, r0 = road ? road.nv : 0, bulbs = near ? nearBulbs : farBulbs.get(key), v0 = g.nv;
      // ROUND FOUR (room): a near block's SMALL RELIEF (window and door casings, porch rails, twigs) is a mesh of its
      // own, drawn only while the eye stands within 72 m of the block's square (round five; farther off it is too fine to tell)
      const det = near ? new P.Geo(8192) : null; if (det) g.det = det;
      // ROUND FIVE (room): a near block's TREES are a mesh of their own (tr); on the dark side a plain stand-in of the
      // same skeletons (trF: a trunk and one limb a bough) is drawn instead while the eye stands 100 m and more from
      // the block's square (the lace of rimed twigs stays: it is the crown)
      const tr = near ? new P.Geo(8192) : g, trF = near && d ? new P.Geo(1024) : null; if (near) tr.det = det;
      const mainN = P.mainRow(i, j, 'N') !== 0, mainS = P.mainRow(i, j, 'S') !== 0;   // (a block whose north or south side is a row of Main Street's stores)
      const made = () => g.nv + leaf.nv + lace.nv + (near ? det.nv + tr.nv + (trF ? trF.nv : 0) : 0);
      P.buildCellGround(g, road, i, j, exists, near, mainN, mainS, low && b);
      // (round eight, E3) the snow on the cars of a near block of the dead town (the dead look's alone)
      if (near && d) for (const c of things.cars) if (c.close && Math.floor(c.p / B) === i && Math.floor(c.q / B) === j && c.q > 0.5) { P.buildCarSnow(lace, c); lace.mixed = true; }
      if (exists) {
        const houses = P.dealBlock(seed, i, j);
        if (first) await ctx.yield();
        for (const h of houses) {
          // ROUND FOUR: no blank block: a house within 170 m of a route in the plan has its windows on every wall
          // (lod 1) whatever its block; beyond 250 m of the dark route a house is ONE SOFT GLOW (no string, no points)
          const c = P.housePt(h, 0, -h.dp / 2), dD = farDark ? 999 : d ? planTo(R.dark, c[0], c[1]) : 1e9, dN = near ? P.lodDist(c[0], c[1]) : 1e9, dist = dN < 1e8 ? dN : Math.min(dD, b ? planTo(R.bright, c[0], c[1]) : 1e9);
          // ROUND FIVE: every house within 90 m of the dark route's plan is in full relief
          const lod = near && (dist < 50 || (d && dD < 90)) ? 0 : dist < 170 ? 1 : 2, glow = d && !b && dD > 250;
          if (!warm.has('h' + lod)) { owed = 0; await ctx.yield(); }
          const hv = g.nv, dv = det ? det.nv : 0, lights = lod < 2 && (b || near) ? [] : null;
          const wins = d && lod < 2 ? [] : null, built = P.buildHouse(g, h, lod, lights, wins);
          if (wins) winPools(wins);
          // a house drawn plain (far, or in a block that is not baked): its eaves take its string's colours; before the plainest lies one pool of its windows' light
          if ((!near || lod > 0) && h.kind !== 'store') { const dm = P.houseDims(h); P.tintEaves(g, hv, g.nv, h.mix, dm.eave); if (d && lod === 2) { const w = P.housePt(h, 0, (dm.porchD || 0) + 4.2); pools.push([w[0], w[1], poolY, AMBERP, Math.abs(w[0]) + Math.abs(w[1]), dm.hw * 0.95, 4.0, h.face[0], h.face[1], 2]); } }
          if (d && h.kind === 'store') { P.buildStoreIce(lace, h, lod, seed); lace.mixed = true; }
          if (lod === 0) { if (b) P.buildSwing(movB, seed, h, movLB); if (d) P.buildSwing(movD, seed, h, movLD); }
          if (lod < 2) { const v = P.vaneOf(seed, h); if (v) { if (b) P.buildVane(movB, v, movLB); if (d) P.buildVane(movD, v, movLD); } }
          if (lod === 0) P.buildYard(g, seed, h);
          // (round seven, F) every chimney of a house in relief may smoke in the living look: [p, y, q, on the bright copy, on the dark copy]
          if (lod < 2 && built && built.chimney && h.kind !== 'store') { const w = P.housePt(h, built.chimney[0], built.chimney[2]); chimneys.push([w[0], built.chimney[1], w[1], b && w[0] > PL + 10 ? 1 : 0, d ? 1 : 0]); }
          nHouses++;
          if (d || (b && deadB(c[0], c[1]))) { const dm = P.houseDims(h), st = h.kind === 'store', sh = P.shadeOf(c[0], c[1], h.w / 2, h.dp / 2, h.face, st ? h.ridge : (dm.eave + dm.ridge) / 2, sunD, 1); if (d) shades.push(sh); if (b && deadB(c[0], c[1])) shadesB.push(sh); }
          if (lights) for (const l of lights) { const w = P.housePt(h, l[0], l[2]); (b ? lightsOut : lightsOutD).push([w[0], w[1], l[1]]); }
          if (glow) {
            // (round five: its windows are one soft amber glow, off at rest; its string is its front eave's, sparse)
            const dm = P.houseDims(h), gw = P.housePt(h, 0, 0.3); glows.push([gw[0], gw[1], dm.eave * 0.6 + 0.8, '#ffb060', Math.abs(gw[0]) + Math.abs(gw[1]), 1, 2]);
            for (const line of P.houseStrings(h, true)) P.bulbsAlong(line.map((q) => { const w = P.housePt(h, q[0], q[2]); return [w[0], w[1], q[1]]; }), 3.2, h.mix, 0, bulbs);
          }
          else {
            const full = lod === 0 && h.strung, sp = lod === 0 ? (dist < 45 ? (full ? 0.4 : 0.6) : dist < 75 ? 0.65 : 0.9) : lod === 1 ? (dist < 110 ? 1.1 : 1.5) : 2.3;   // round four (room): the far strings' points stand wider apart (round five: a house in full relief 45 m and more from the line too)
            for (const line of P.houseStrings(h, !full)) P.bulbsAlong(line.map((q) => { const w = P.housePt(h, q[0], q[2]); return [w[0], w[1], q[1]]; }), sp, h.mix, 0, bulbs);
          }
          // a far house's lit windows have no panes to glow: two ghosts stand for them on its front wall
          { const nv = g.nv - hv + (det ? det.nv - dv : 0); await pause(nv / 30000 + (nv > 150 ? 0.016 : 0.004), 'h' + lod); }   // (a unit is about 7 ms of work)
          if (lod === 2 && !glow && h.kind !== 'store') { const dm = P.houseDims(h); for (const sgn of [-1, 1]) { const w = P.housePt(h, sgn * dm.hw * 0.45, 0.06); bulbs.push([w[0], w[1], dm.floor + 1.7, '#ffb060', Math.abs(w[0]) + Math.abs(w[1]), 1, 2]); } }
        }
        // (round eight, B4) MAIN STREET UNDER SNOW: the kerb's bank of ploughed snow, the drifts against the fronts, the
        // lamp standards' icicles: the dead look's alone, with the block's ice
        if (d && (mainN || mainS)) { P.buildMainSnow(lace, i, j, houses, street.posts, seed); lace.mixed = true; }
        // ROUND FIVE (A6): the back yards and the garden lots (a near block: in full; a block within 200 m: plain shapes)
        const m1 = made();
        if (near || (d && d2 < 200)) { const bk = P.dealBack(seed, i, j).items; if (bk.length) P.buildBack(g, bk, near ? 0 : 1); }
        // the landmarks stand once each in the plan, in their own blocks, with their strings
        const marks = [];
        if (holds(K.CHURCH)) { P.buildChurch(g, seed); marks.push([P.churchStrings(), 2, 0.5]); markLamps.push([...P.churchLamp(), 6]); }
        if (holds(P.CORNER_TREE)) P.buildCorner(g, seed);
        // (the water tower in the middle of its block: K.TOWER)
        if (holds(K.TOWER)) { P.buildWaterTower(towerG); if (d) { P.buildTowerIce(lace, seed); lace.mixed = true; } marks.push([P.towerString(), 0, 0.45]); const tl = P.towerLamps(); markLamps.push([...tl[0], 7], [...tl[1], 0]); }
        if (holds([1, K.BLOCK - 1])) P.buildCross(g, seed);   // (the first crossing's dress is built once, with the block at its south-east corner)
        if (holds(K.COURT)) {
          P.buildCourthouse(g, seed); P.buildBandstand(g); lace.mixed = true; if (d) P.buildBandstandIce(lace, seed); marks.push([P.courthouseStrings(), 3, 0.55]); marks.push([P.bandstandStrings(), 0, 0.42]);
          // (round seven, C1: THE MARKET STALLS ARE GONE, on both looks: the square is lawn, great trees, the bandstand, two benches)
          P.buildSquareBenches(g);
        }
        if (holds([K.PLAZA[0], K.PLAZA[1] - 1])) {   // (the plaza lies across Main Street's axis: it is built with the block south of the axis)
          // THE PLAZA AND THE GREAT OAK (round seven, C5; the cure of round eight: the oak on the square's north side),
          // beyond the last leaf: the paving, the plinth, the benches; the
          // oak's body (trunk, boughs, twigs: one skeleton); its crown of gold and copper (the living look: seen through
          // the last leaf), its lace of rimed twigs (the dead look: outside the leaf's outline); bulbs wound up its trunk
          // and out along every great bough; its light on the plaza (a wide lamp in the bake) and six pools of its colours
          const S = P.OAK, osk = P.oakSkeleton(); P.buildPlaza(g);
          // (the great oak is one tree on every seed: P.EVERY_SEED stands where a seed would. Its twigs are built
          // with its body: the tree is seen whole from the turn on)
          { const og = g.det; g.det = null; P.buildTree(g, P.EVERY_SEED, S, osk, 0); g.det = og; }
          P.buildLeaves(leaf, P.EVERY_SEED, S, osk, 1); P.buildLace(lace, P.EVERY_SEED, S, osk, 0, keyP);
          for (const ts of P.treeStrings(P.EVERY_SEED, S, osk)) P.bulbsAlong(ts.pts, 0.42, ts.mix, 0, nearBulbs);
          for (const c of osk.clumps) leafColsD.push(c);
          shades.push(P.shadeOf(S.p, S.q, 12, 12, [0, 1], S.H * 0.72, sunD, 0.6, 1), P.shadeOf(S.p, S.q, 1.1, 1.1, [0, 1], 9, sunD, 0.85));
          lampL.push([S.p, S.q, 14, 0.4, 420, 0]);
          for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + 0.4; pools.push([S.p + Math.cos(a) * 13, S.q + Math.sin(a) * 13, poolY, k, Math.abs(S.p) + Math.abs(S.q), 14, 14, 1, 0, 0]); }
        }
        for (const [lines, mix, sp] of marks) for (const line of lines) P.bulbsAlong(line, sp, mix, 0, bulbs);
        await pause((made() - m1) / 20000 + 0.06);
        if (first) await ctx.yield();
        const dealt = P.dealTrees(seed, i, j, houses);
        if (first) await ctx.yield();
        for (const t of dealt) {
          // (a block 60 m and more from both routes, past the entry: the tree rule holds of itself; on the dark side alone
          // such a tree is the far town's plain tree)
          const sk = near || b ? P.treeSkeleton(seed, t) : P.treeSkeletonFar(seed, t);
          if ((near || j < 0) && !P.treeStands(t, sk)) continue;
          if (near) { const key = i + ':' + j; if (!stood.has(key)) stood.set(key, []); stood.get(key).push([t, sk]); }
          const dist = near ? P.lodDist(t.p, t.q) : 999, lod = dist < 36 ? 0 : dist < 90 ? 1 : near ? 2 : 3;
          if (!warm.has('t' + lod + (b ? 'b' : 'd'))) { owed = 0; await ctx.yield(); }
          P.buildTree(tr, seed, t, sk, lod); if (trF) P.buildTree(trF, seed, t, sk, 2);
          for (const ts of P.treeStrings(seed, t, sk)) P.bulbsAlong(ts.pts, 0.4, ts.mix, 0, nearBulbs);
          // (round seven) THE CROWN OF LEAVES IS THE LIVING LOOK'S, ON BOTH COPIES: a shared block's one crown serves both;
          // a block of the dark copy alone gets its own (a near block's in fewer sprays, the far town's as three great sprays)
          if (b || liveD) P.buildLeaves(b || near ? leaf : farLeafD, seed, t, sk, b ? Math.min(lod, 2) : near ? (dist < 20 ? 0 : crownClose(t.p, t.q) ? Math.max(1, Math.min(lod, 2)) : 2) : 3);   // (within 20 m of a line: the small near sprays, which keep the clear air)
          if (b && t.p > K.PLANE_X + 4 && planTo(R.bright, t.p, t.q) < K.BLOCK) for (const c of sk.clumps) leafCols.push(c);   // (leaves fall from the bright copy's crowns within a block's length of the bright line, none into the plane)
          if (d && fallsAt(t.p, t.q)) for (const c of sk.clumps) leafColsD.push(c);
          if (d) { P.buildLace(lace, seed, t, sk, lod, keyP); const cr = t.H * 0.34, s1 = P.shadeOf(t.p, t.q, cr, cr, [0, 1], t.H * 0.72, sunD, 0.6, 1), s2 = near ? P.shadeOf(t.p, t.q, 0.3, 0.3, [0, 1], t.H * 0.42, sunD, 0.85) : null; shades.push(s1); if (s2) shades.push(s2); if (b && deadB(t.p, t.q)) { shadesB.push(s1); if (s2) shadesB.push(s2); } }
          nTrees++;
          await pause(lod === 0 ? (b ? 0.085 : 0.045) : lod === 1 ? (b ? 0.033 : 0.026) : lod === 2 ? 0.026 : 0.0036, 't' + lod + (b ? 'b' : 'd'));   // (a tree's cost is its skeleton, its strings and its lace: counted by number and level of detail)
        }
      }
      void v0;
      if (near) { sectors.set('near:' + i + ':' + j, { g, det, tr, trF, leaf, lace, b, d, road, r0, r1: road.nv, near: true, i, j }); nearCells.add(i + ':' + j); }
      await pause(0.01);
    }
    // ------------------------------------------------------------------ bake the lamps' and the bulbs' light into the near blocks
    for (const l of markLamps) lampL.push([l[0], l[1], l[2] - 0.2, 0.8, 30, 0]);
    for (const bl of nearBulbs) grid.add(bl);
    grid.close();
    // the street's standing things, once for each side of the plane (lamp masts, string posts, poles and wires)
    await ctx.yield();
    const pw = P.dealPoles(seed), thingsB = new P.Geo(8192), thingsD = new P.Geo(16384);
    await ctx.yield();
    const wireNear = (p, q) => { for (const T of [R.bright, R.dark]) for (let k = 0; k < T.length; k += 4) if (Math.abs(T[k][0] - p) + Math.abs(T[k][1] - q) < 130) return true; return false; };
    // the dark copy's things about its first street (P.LOTS: firstP, firstQ): seen through the first thin place
    const dNear = (p, q) => q > 0 && q < LT.firstQ && Math.abs(p) < LT.firstP;
    P.buildStreetThings(thingsB, lamps, street.posts, pw, P.brightThing, street.strings);
    await ctx.yield();
    P.buildStreetThings(thingsD, lamps, streetD.posts, pw, dNear, streetD.strings);
    await ctx.yield();
    // (round seven, F) THE MOVERS: one mesh on the bright copy, two lots on the dark copy
    P.buildWires(movB, pw, (p, q) => P.brightThing(p, q) && wireNear(p, q), movLB);
    await ctx.yield();
    // (room) the dark copy's wires and combs lie in two lots, as its pools and moon shadows do: those north of the far
    // walk of the cross street beyond the climb's end (P.LOTS.northQ) are drawn only while the eye stands within
    // P.LOTS.northSeen of that line (farther off a wire is too fine to tell)
    P.buildWires(movD, pw, (p, q) => q > 0.5 && q < LT.northQ && wireNear(p, q), movLD);
    P.buildWires(movDN, pw, (p, q) => q >= LT.northQ && wireNear(p, q), movLDN);
    await ctx.yield();
    P.buildCombs(movB, street.strings, (p, q) => p > PL); P.buildCombs(movD, streetD.strings, (p, q) => q > 0.5 && q < LT.northQ); P.buildCombs(movDN, streetD.strings, (p, q) => q >= LT.northQ);
    await ctx.yield();
    if (movB.nv) { const m = new THREE.Mesh(P.moverGeometry(movB, movLB), P.makeMover(U, false)); m.matrixAutoUpdate = false; scene.add(m); brightAll.push(m); }
    { const mm = P.makeMover(U, true); for (const [g, l, to] of [[movD, movLD, darkFar], [movDN, movLDN, darkNorth]]) if (g.nv) { const m = new THREE.Mesh(P.moverGeometry(g, l), mm); m.matrixAutoUpdate = false; m.matrix.copy(darkM); scene.add(m); to.push(m); } }
    const farD = (p, q) => planTo(R.dark, p, q) > 70;   // round four (room): 70 m and more from the dark line a street thing is plain
    // ROUND FOUR (room): the far town's street things stand in their own sector's mesh (a sector of the dark side alone),
    // so that each sector's things can be left out with their sector; thingsZ keeps those of the near blocks
    const secOf = (p, q) => { const i = Math.floor(p / B), j = Math.floor(q / B); if (nearCells.has(i + ':' + j) || inBright(i, j) || !inDark(i, j)) return null; return sectors.get(Math.floor(i / 3) + ':' + Math.floor(j / 3) + ':01') || null; };
    const farKeep = (p, q) => q > 0 && !dNear(p, q);
    // ROUND FIVE (room): the near blocks' street things beyond the first street stand in four lots along the dark line
    // (the climb's sides: south of the cross street beyond the climb's end; the turn: east of the middle of the first
    // block west of the home street; Main Street's east and west, parted at the middle of the third block west); each
    // lot has a plain stand-in (masts, shafts, cars without wheels; no wire) that is drawn instead while the eye
    // stands 150 m and more from the lot
    const tzOf = (p, q) => q < LT.endQ ? 0 : p >= LT.west(1) ? 1 : p >= LT.west(3) ? 2 : 3, thingsZ = [0, 1, 2, 3].map(() => ({ full: new P.Geo(8192), far: new P.Geo(2048) }));
    const zKeep = (z) => (p, q) => farKeep(p, q) && !secOf(p, q) && tzOf(p, q) === z, yes = () => true;
    await ctx.yield();
    for (let z = 0; z < 4; z++) { P.buildStreetThings(thingsZ[z].full, lamps, streetD.posts, pw, zKeep(z), streetD.strings, farD); P.buildStreetThings(thingsZ[z].far, lamps, streetD.posts, pw, zKeep(z), null, yes); }
    for (const s of sectors.values()) if (!s.near && s.d && !s.b) P.buildStreetThings(s.g, lamps, streetD.posts, pw, (p, q) => farKeep(p, q) && secOf(p, q) === s, streetD.strings, farD);
    await ctx.yield();
    P.buildThings(thingsB, things, (p, q) => p > PL);
    P.buildSignal(thingsB); P.buildSignal(thingsD);
    // ROUND FIVE (room): the fallen leaves in four lots (the home street to the cross street's near walk in thirds,
    // the cross street), each drawn only while the eye stands within 70 m of the lot (farther off a fallen leaf is
    // too small to tell), on either copy
    const litters = [];
    {
      const litG = [0, 1, 2, 3].map(() => new P.Geo(8192)), flat = await P.buildLitter(litG, seed, Math.round(9000 * clamp(density, 0.6, 1.4)), (p, q) => q < LT.overQ ? Math.min(2, Math.floor(3 * q / LT.overQ)) : 3, ctx.yield);
      await ctx.yield();
      for (let k = 0; k < 4; k++) {
        const litter = litG[k]; if (!litter.nv) continue;
        for (let a = 0; a < flat[k]; a += 4000) { P.bakeLight(litter, a, Math.min(flat[k], a + 4000), grid, lampL, 4); await ctx.yield(); }   // (small pieces: the engine answers at once while its slice is young)
        P.bakeLight(litter, flat[k], litter.nv, grid, lampL);
        const geo = litter.toGeometry(), mb = new THREE.Mesh(geo, matB), md = new THREE.Mesh(geo, matD); mb.matrixAutoUpdate = false; md.matrixAutoUpdate = false; md.matrix.copy(darkM); scene.add(mb, md);
        geo.computeBoundingBox(); const bb = geo.boundingBox;
        litters.push({ mb, md, b: [bb.min.x, bb.max.x, bb.min.z, bb.max.z], d: [K.PLANE_X + bb.min.z, K.PLANE_X + bb.max.z, -K.THIN1[1] - bb.max.x, -K.THIN1[1] - bb.min.x] });
      }
    }
    P.buildThings(thingsD, things, dNear);
    for (let z = 0; z < 4; z++) { P.buildThings(thingsZ[z].full, things, zKeep(z), farD); P.buildThings(thingsZ[z].far, things, zKeep(z), yes); }
    for (const s of sectors.values()) if (!s.near && s.d && !s.b) P.buildThings(s.g, things, (p, q) => farKeep(p, q) && secOf(p, q) === s, farD);
    await ctx.yield();
    for (let a = 0; a < thingsB.nv; a += 4000) { P.bakeLight(thingsB, a, Math.min(thingsB.nv, a + 4000), grid, lampL); await ctx.yield(); }   // (small pieces, as the litter's)
    addBoth(thingsB.toGeometry(), true, false, matB, null);
    addBoth(thingsD.toGeometry(), false, true, null, matD);
    const zoneOf = (full, far, near, fill = 0, keep = 0, gain = null) => {
      // a lot of the dark copy: its sphere in the world, the distance inside which its full mesh is drawn
      const bs = full.geometry.boundingSphere, c = bs.center.clone().applyMatrix4(darkM);
      zones.push({ full, far, x: c.x, z: c.z, r: bs.radius, near, n: fill ? full.geometry.instanceCount : 0, fill, keep, gain });
    };
    const darkMesh = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.matrixAutoUpdate = false; m.matrix.copy(darkM); scene.add(m); return m; };
    for (const tz of thingsZ) { if (!tz.full.nv) continue; zoneOf(darkMesh(tz.full.toGeometry(), matD), tz.far.nv ? darkMesh(tz.far.toGeometry(), matD) : null, 150); }
    const porch = lightsOut.map((l) => [l[0], l[1], l[2], 0.3, 6, 0]);
    if (towerG.nv) {
      // THE WATER TOWER (round six, D1): its own mesh on both copies; the dark copy's is drawn with the dark side's
      // first things (from 60 m before the plane on), so that its ring of bulbs never shows without the tank
      const cl = lampL.filter((l) => Math.abs(l[0] - K.TOWER[0]) < 62 && Math.abs(l[1] - K.TOWER[1]) < 62);
      P.bakeLight(towerG, 0, towerG.nv, grid, cl); await ctx.yield();
      // (round seven, C3) the tower is furred all over with the longest rime: seen dead it is white from every side and reads against the night
      const twB = P.makeSurface(U, false), twD = P.makeSurface(U, true); twB.uniforms.uLift.value.set(0.9, 1.7); twD.uniforms.uLift.value.set(0.9, 1.7);
      addBoth(towerG.toGeometry(), true, true, twB, twD, 0, 1);
    }
    let baked = 0;   // (the first twelve pieces of the bake count threefold: cold code again)
    for (const s of sectors.values()) {
      if (!s.near) continue;
      const cx = (s.i + 0.5) * B, cy = (s.j + 0.5) * B, cl = lampL.concat(porch).filter((l) => Math.abs(l[0] - cx) < 62 && Math.abs(l[1] - cy) < 62);
      const rc = s.b ? 2 : 1;   // (round five: a block of the dark copy alone takes its bulbs' light from close by only; its trees' limbs and their far stand-ins take none)
      for (const g of [s.g, s.det, s.b ? s.tr : null, s.leaf, s.d ? s.lace : null]) {   // (a dark-only block's trunks take no bake: rimed bark shows next to none of it)
        if (!g) continue;
        const cards = g === s.leaf || (g === s.lace && !g.mixed), n = (cards ? 24000 : 6000) * (3 - rc);   // (leaf sprays and fans of lace are baked a card at a time; a bright block's vertex costs about three of a dark block's)
        const kind = 'k' + rc + (cards ? 'c' : 'v');   // (the first piece of a kind is a quarter piece, with an ask before it and after it)
        for (let a = 0; a < g.nv;) { const cold = !warm.has(kind); if (cold) { owed = 0; await ctx.yield(); } const e = Math.min(g.nv, a + (cold ? n >> 2 : n)); P.bakeLight(g, a, e, grid, cl, cards ? 4 : 1, rc); await pause((e - a) / n * (rc === 2 ? 0.4 : 0.25) * (baked++ < 12 ? 3 : 1), kind); a = e; }
      }
      if (s.b) for (let a = s.r0; a < s.r1; a += 6000) { const e = Math.min(s.r1, a + 6000); P.bakeLight(s.road, a, e, grid, cl); await pause((e - a) / 6000 * 0.34); }
    }
    // the rime's feathers on the dark copy: about the first dark street always, the rest of the town with the far town
    owed = 0; await ctx.yield();
    const rime = await P.dealRime(seed, lamps, streetD, pw, things, ctx.yield, 14000, null, stood), rimeMat = P.makeRimeMaterial(U);
    await ctx.yield();
    // ROUND FIVE (room): in lots along the dark line. The first street's three lots (its thirds) are drawn whole (from
    // the home street's end on); the others (the climb's sides; then west of each block's middle line: P.LOTS) fill
    // by number as the eye comes within 160 to 110 m of the lot (farther off a feather is too fine to tell), in a
    // dealt order, so no lot appears at once
    { const nf = rime.length / 10, rs = rOrder, tmp = new Float32Array(10); for (let a = nf - 1; a > 0; a--) { const b2 = Math.floor(rs() * (a + 1)); tmp.set(rime.subarray(a * 10, a * 10 + 10)); rime.copyWithin(a * 10, b2 * 10, b2 * 10 + 10); rime.set(tmp, b2 * 10); } }
    const rz = (p, q) => dNear(p, q) ? -1 : q < LT.endQ ? 0 : p >= LT.west(1) ? 1 : p >= LT.west(2) ? 2 : p >= LT.west(3) ? 3 : 4;
    // (round seven, C3: the long feathers of the water tower, the spire and the oak are a lot of their own, drawn from
    // everywhere on the dead side: they are seen from far)
    for (const [pick, far] of [[(p, q) => dNear(p, q) && q < LT.firstQ / 3, false], [(p, q) => dNear(p, q) && q >= LT.firstQ / 3 && q < 2 * LT.firstQ / 3, false], [(p, q) => dNear(p, q) && q >= 2 * LT.firstQ / 3, false], [(p, q) => rz(p, q) === 0, true], [(p, q) => rz(p, q) === 1, true], [(p, q) => rz(p, q) === 2, true], [(p, q) => rz(p, q) === 3, true], [(p, q) => rz(p, q) === 4, true], [null, 2]]) {
      const geo = P.makeRimeGeometry(rime, pick ? (p, q, s) => s < 2 && pick(p, q) : (p, q, s) => s >= 2); if (!geo.instanceCount) continue;
      const m = darkMesh(geo, rimeMat); if (far === 2) darkFar.push(m); else if (far) zoneOf(m, null, 160, 50); else darkDetail.push(m);
      await pause(0.6);   // (a lot's geometry is about 2 ms of work)
    }
    // (round seven) the same feathers on the bright copy where its two side leaves show it dead
    { const geo = P.makeRimeGeometry(rime, deadB); if (geo.instanceCount) { const m = new THREE.Mesh(geo, P.makeRimeMaterial(U, false)); m.matrixAutoUpdate = false; m.visible = false; scene.add(m); dress.push({ m, dark: false, look: 1, b: deadBox, late: 0, first: true }); } }
    await ctx.yield();
    let builtTris = 0;
    for (const s of sectors.values()) {
      // the dark copy of a near block of Main Street's rows (240 m and more beyond the plane, behind the whole home
      // street) is drawn with the outer town: from 20 m past the plane on
      const mainPart = (s.j + 1) * K.BLOCK >= P.MAIN.q, homeSide = Math.abs(s.i + 0.5) < 1;   // (a near block of the row south of Main Street's axis or north of it; one of the two that flank the home street)
      const late = s.near ? (mainPart ? (homeSide ? 2 : 3) : 0) : s.tier === 2 ? 3 : s.tier;
      if (s.g.nv) { addBoth(s.g.toGeometry(), s.b, s.d, matB, matD, 0, late); builtTris += s.g.triangles; }
      if (s.near) {
        // a near block: its square in the world on either copy, its small relief (mb, md), its trees (tn) and their stand-in (tf)
        const p0 = s.i * 80, q0 = s.j * 80, w0 = P.darkW(p0, q0), w1 = P.darkW(p0 + 80, q0 + 80);
        const c = { late, mb: null, md: null, tn: null, tf: null, b: s.b ? [p0, p0 + 80, -q0 - 80, -q0] : null, d: s.d ? [Math.min(w0[0], w1[0]), Math.max(w0[0], w1[0]), Math.min(w0[1], w1[1]), Math.max(w0[1], w1[1])] : null };
        if (s.det.nv) {
          const geo = s.det.toGeometry();
          if (s.b) { const m = new THREE.Mesh(geo, matB); m.matrixAutoUpdate = false; scene.add(m); c.mb = m; }
          if (s.d) c.md = darkMesh(geo, matD);
          builtTris += s.det.triangles;
        }
        if (s.tr.nv) {
          const geo = s.tr.toGeometry();
          if (s.b) { const m = new THREE.Mesh(geo, matB); m.matrixAutoUpdate = false; scene.add(m); brightAll.push(m); }
          if (s.d) c.tn = darkMesh(geo, matD);
          builtTris += s.tr.triangles;
        }
        if (s.trF && s.trF.nv) c.tf = darkMesh(s.trF.toGeometry(), matD);
        cells.push(c);
      }
      // (round seven) THE ONE-LOOK DRESS ON BOTH COPIES: the crowns of leaves (living look) and the rime's lace and ice
      // (dead look). Each mesh is listed with its copy, its look and its circle in the world: it is drawn only while it
      // can be seen in its look from where the eye STANDS (through a leaf's outline, or all round on its own side)
      {
        const si = s.near ? s.i : 0, sj = s.near ? s.j : 0;
        // (the mesh's own box in the world: the dark copy stands at (K.PLANE_X + z, -K.THIN1[1] - x) of the mesh's own x and z)
        const put = (geo, mat, dark, look) => {
          const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; if (dark) m.matrix.copy(darkM); m.visible = false; scene.add(m);
          if (!geo.boundingBox) geo.computeBoundingBox();
          const bb = geo.boundingBox, b = dark ? [K.PLANE_X + bb.min.z - 0.5, K.PLANE_X + bb.max.z + 0.5, -K.THIN1[1] - bb.max.x - 0.5, -K.THIN1[1] - bb.min.x + 0.5] : [bb.min.x - 0.5, bb.max.x + 0.5, bb.min.z - 0.5, bb.max.z + 0.5];
          dress.push({ m, dark, look, b, late, first: s.near && (sj + 1) * K.BLOCK < P.MAIN.q && Math.abs(si + 0.5) < 1 });   // (first: a near block south of Main Street's part that flanks the home street: its crowns can be seen through the first thin place)
        };
        if (s.leaf.nv) { const geo = s.leaf.toGeometry(); if (s.b) put(geo, leafB, false, 0); if (s.d) put(geo, leafD, true, 0); builtTris += s.leaf.triangles; }
        if (s.lace.nv && s.d) { const geo = s.lace.toGeometry(); put(geo, laceD, true, 1); if (s.b && s.near) put(geo, laceB, false, 1); builtTris += s.lace.triangles; }
      }
      await pause(0.3);   // (a sector's meshes are about a millisecond of work: a hand-back after six of them)
    }
    if (farLeafD.nv) { const m = new THREE.Mesh(farLeafD.toGeometry(), leafD); m.matrixAutoUpdate = false; m.matrix.copy(darkM); m.visible = false; scene.add(m); dress.push({ m, dark: true, look: 0, all: true, b: null, late: 0, first: false }); builtTris += farLeafD.triangles; }
    if (roadZ[0].nv) addBoth(roadZ[0].toGeometry(), true, false, roadB, null, 2);
    if (roadZ[1].nv) addBoth(roadZ[1].toGeometry(), true, true, roadB, roadD, 2);
    if (roadZ[2].nv) addBoth(roadZ[2].toGeometry(), false, true, null, roadD, 2);

    // ------------------------------------------------------------------ bulbs, their ghosts, and their images under the wet road
    const dabB = P.makeDabMaterial(U, false), dabD = P.makeDabMaterial(U, true);
    // each copy draws only the bulbs on its own side of the plane. ROUND SIX: NO LIGHT HAS AN IMAGE IN ANY ROADWAY, on
    // either side (`lots`: the near bulbs, drawn in lots along the dark line)
    const dabs = async (list, b, d, lots, tier = 1) => {
      if (!list.length) return;
      const add = (geo, mat, dark, order, detail) => { if (!geo.instanceCount) return; const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.matrixAutoUpdate = false; if (dark) m.matrix.copy(darkM); scene.add(m); if (dark) (detail ? darkDetail : tier === 2 ? darkOuter2 : darkFar).push(m); else brightAll.push(m); };
      if (b) add(P.makeDabGeometry(list, (x) => x[0] > PL - 0.5), dabB, false, 4);
      if (lots) await ctx.yield();
      if (d && lots) {
        // (round four, room: the first street's first third is a lot apart, and the rest of the home street to the
        // cross street's near walk another. ROUND FIVE, room: beyond them the ghosts stand in four lots along the
        // dark line (the climb's sides, then west of each block's middle line: P.LOTS); a lot 140 m and more from
        // the eye is drawn with a third of its points, each a little stronger, and fills in a dealt order, from a
        // stream of its own, as the eye comes nearer)
        const inFirst = (x) => x[1] < LT.firstQ / 3 && Math.abs(x[0]) < LT.firstP, nz = (x) => x[1] < LT.overQ ? 0 : x[1] < LT.endQ && x[0] > -LT.firstP ? 1 : x[0] >= LT.west(1) ? 2 : x[0] >= LT.west(2) ? 3 : 4, rest = list.filter((x) => x[1] > -0.5 && !x[7] && !inFirst(x));
        add(P.makeDabGeometry(list, (x) => x[1] > -0.5 && !x[7] && inFirst(x)), dabD, true, 4, true); add(P.makeDabGeometry(rest, (x) => nz(x) === 0), dabD, true, 4, true);
        for (let z = 1; z <= 4; z++) {
          const lot = rest.filter((x) => nz(x) === z); if (!lot.length) continue;
          for (let k = lot.length - 1; k > 0; k--) { const b2 = Math.floor(rGhost() * (k + 1)), t = lot[k]; lot[k] = lot[b2]; lot[b2] = t; }
          const mat = P.makeDabMaterial(U, true); zoneOf(darkMesh(P.makeDabGeometry(lot), mat, 4), null, 140, 80, 0.34, mat.uniforms.uGain);
        }
      }
      else if (d) add(P.makeDabGeometry(list, (x) => x[1] > -0.5 && !x[7]), dabD, true, 4, false);
    };
    await dabs(nearBulbs, true, true, true);
    await ctx.yield();
    for (const [key, list] of farBulbs) { const s = sectors.get(key); await dabs(list, s.b, s.d, false, s.tier); }
    // the far town's glows (round four): one soft disc a house beyond 250 m of the dark route
    if (glows.length) { const gm = P.makeDabMaterial(U, true, 9, false, 5); gm.uniforms.uLo.value = 1.7; gm.uniforms.uSoft.value = 1; gm.uniforms.uDim.value = 0.75; const m = new THREE.Mesh(P.makeDabGeometry(glows), gm); m.renderOrder = 4; m.matrixAutoUpdate = false; m.matrix.copy(darkM); scene.add(m); darkOuter2.push(m); }
    await ctx.yield();
    // the lamps' heads and the porch lamps: steady light on the bright side
    const lampDabs = lamps.filter((l) => l.hp > PL).map((l) => [l.hp, l.hq, l.y - 0.2, '#ffb060', 0, 0, 0]);
    const porchDabs = lightsOut.map((l) => [l[0], l[1], l[2], '#ffd9a0', 0, 0, 0]);
    for (const o of lanterns) if (o.p > PL) porchDabs.push([o.p, o.q, o.h - 0.28, '#ffb060', 0, 0, 0]);
    for (const l of cross.lanterns) porchDabs.push([l[0], l[1], l[2], '#ffb060', 0, 0, 0]);
    for (const l of markLamps) porchDabs.push([l[0], l[1], l[2], '#ffb060', 0, 0, 0]);
    porchDabs.push([K.TOWER[0], K.TOWER[1], 38.4 * K.TS, '#ff2a1a', 0, 0, 0]);   // the water tower's small red beacon (bright side only)
    const lampMat = P.makeDabMaterial(U, false, 3.6, true), porchMat = P.makeDabMaterial(U, false, 1.8, true);
    lampMat.uniforms.uGain.value = 0.6;   // a street lamp holds its halo small
    if (lampDabs.length) { const a = new THREE.Mesh(P.makeDabGeometry(lampDabs), lampMat); a.renderOrder = 4; scene.add(a); brightAll.push(a); }
    if (porchDabs.length) { const a = new THREE.Mesh(P.makeDabGeometry(porchDabs), porchMat); a.renderOrder = 4; scene.add(a); brightAll.push(a); }
    // (round seven) the dark copy's porch lamps and the tower's beacon: the living look's alone (its street lamps, lanterns and far windows are the lights of the flag 128 below)
    { const pd = lightsOut.filter((l) => l[1] > 0).concat(lightsOutD).map((l) => [l[0], l[1], l[2], '#ffd9a0', 0, 0, 0]); pd.push([K.TOWER[0], K.TOWER[1], 38.4 * K.TS, '#ff2a1a', 0, 0, 0]);
      const a = new THREE.Mesh(P.makeDabGeometry(pd), P.makeDabMaterial(U, true, 1.8, true)); a.renderOrder = 4; a.matrixAutoUpdate = false; a.matrix.copy(darkM); a.frustumCulled = false; scene.add(a); darkFar.push(a); }
    // (ROUND SIX: every mirrored dab is gone: the wet road mirrors nothing but its small kerb puddles)
    // the dark copy's street lamps, lanterns and the horizon's lights (the flag 128): the LIVING look's alone (seen dead
    // no lamp burns: round seven, C1); the signal's ghost
    const lampGhostMat = P.makeDabMaterial(U, true, 2.6, false, 7), sigGhostMat = P.makeDabMaterial(U, true, 2.4, true);
    const fd = new P.Geo(4096), hzn = P.buildHorizon(fd, seed);   // (round six) the horizon's things: farms, elevators, hedge lines, roads
    {
      const lg = lamps.filter((l) => l.hq > 0).map((l) => [l.hp, l.hq, l.y - 0.2, '#ffb060', Math.abs(l.hp) + Math.abs(l.hq), 1, 2]);   // (2: a lamp's light: it rests at half)
      for (const o of lanterns) lg.push([o.p, o.q, o.h - 0.28, '#ffb060', Math.abs(o.p) + Math.abs(o.q), 1, 2]);
      for (const l of cross.lanterns) lg.push([l[0], l[1], l[2], '#ffb060', Math.abs(l[0]) + Math.abs(l[1]), 1, 2]);
      for (const l of markLamps) { lg.push([l[0], l[1], l[2], '#ffb060', Math.abs(l[0]) + Math.abs(l[1]), 1, 2]); if (l[3]) pools.push([l[0], l[1], poolY, '#ffc060', Math.abs(l[0]) + Math.abs(l[1]), l[3], l[3], 1, 0, 0]); }   // (round six, D) the water tower's two lanterns, the lamp over the church's door
      // ROUND FIVE: a lamp each half block on every street of the dark town (P.TOWN), to its edge, at the dealt
      // lamps' own pitch: beyond the near town (P.span(), whose lamps are dealt and have masts) each is one dab at a
      // lamp's head (P.LAMP), sodium gold (round six: at half at rest, full inside a band)
      const far0 = lg.length;
      for (let k = TW.i0; k <= TW.i1 + 1; k++) for (let n = 0; n < (TW.j1 + 1) * 2; n++) {
        const q = B / 4 + B / 2 * n, p = B * k, s = ((n + k) & 1) ? 1 : -1, j = Math.floor(q / B);
        if ((k >= SP.i0 && k <= SP.i1 + 1 && n >= SP.j0 * 2 && n < (SP.j1 + 1) * 2) || !(P.blockExists(k, j, seed) || P.blockExists(k - 1, j, seed))) continue;
        lg.push([p + s * P.LAMP.head, q, P.LAMP.y, '#ffb060', Math.abs(p) + Math.abs(q), 1, 2]);
      }
      for (let j = 0; j <= TW.j1 + 1; j++) for (let n = TW.i0 * 2; n < (TW.i1 + 1) * 2; n++) {
        const p = B / 4 + B / 2 * n, q = B * j, s = ((n + j) & 1) ? 1 : -1, i = Math.floor(p / B);
        if ((j >= SP.j0 && j <= SP.j1 + 1 && n >= SP.i0 * 2 && n < (SP.i1 + 1) * 2) || !(P.blockExists(i, j, seed) || (j > 0 && P.blockExists(i, j - 1, seed)))) continue;
        lg.push([p, q + s * P.LAMP.head, P.LAMP.y, '#ffb060', Math.abs(p) + Math.abs(q), 1, 2]);
      }
      for (let k = far0; k < lg.length; k++) pools.push([lg[k][0], lg[k][1], poolY, '#ffb060', lg[k][4], 10, 10, 1, 0, 3]);
      // under every lamp a warm pool on the road, about 8 m across: the living look's alone (the pool's material keeps
      // the law per fragment); it lies over roadway, kerb and verge alike
      for (const l of lamps) if (l.hq > 0 && track2(Math.floor(l.hp / B), Math.floor(l.hq / B), false) < 60) pools.push([l.hp, l.hq, poolY, '#ffc060', Math.abs(l.hp) + Math.abs(l.hq), 8, 8, 1, 0, 0]);
      for (const o of lanterns) pools.push([o.p, o.q, poolY, '#ffc060', Math.abs(o.p) + Math.abs(o.q), 5.5, 5.5, 1, 0, 0]);
      // under a lamp whose block is not baked: a round pool of its light on the ground
      for (const l of lamps) if (l.hq > 0 && track2(Math.floor(l.hp / B), Math.floor(l.hq / B), false) >= 60) pools.push([l.hp, l.hq, poolY, '#ffb060', Math.abs(l.hp) + Math.abs(l.hq), 10, 10, 1, 0, 3]);
      // THE HORIZON'S LIGHTS (round six): a lamp far apart on each road out of town, a yard lamp and a warm window or two
      // at each farm, a lamp at each elevator's head: points in their own gold, each with its pool on the snow
      const hzL = [];
      for (const l of hzn.lamps) { const dd = Math.abs(l[0]) + Math.abs(l[1]); hzL.push([l[0], l[1], l[2], '#ffb060', dd, 1, 2]); if (l[2] < 20) pools.push([l[0], l[1], poolY, '#ffb060', dd, 11, 11, 1, 0, 3]); }
      for (const l of hzn.wins) { const dd = Math.abs(l[0]) + Math.abs(l[1]); hzL.push([l[0], l[1], l[2], '#ffb060', dd, 1, 2]); pools.push([l[0] + l[3] * 4.5, l[1] + l[4] * 4.5, poolY, AMBERP, dd, 3.2, 4.5, l[3], l[4], 2]); }
      for (const s of hzn.shades) shades.push(P.shadeOf(s[0], s[1], s[2], s[3], [0, 1], s[4], sunD, 0.9));
      { const hm = P.makeDabMaterial(U, true, 3.2, false, 7); hm.uniforms.uDim.value = 3.5; const m = new THREE.Mesh(P.makeDabGeometry(hzL), hm); m.renderOrder = 4; m.matrixAutoUpdate = false; m.matrix.copy(darkM); m.frustumCulled = false; scene.add(m); darkFar.push(m); }
      await ctx.yield();
      // (round seven, room) the dark copy's pools and moon shadows lie in two lots: those of the town north of the
      // north lot's line (P.LOTS.northQ) are laid only while the eye stands within P.LOTS.northSeen of that line
      // (farther off they lie flat on the ground behind the houses)
      { const pmat = P.makePoolMaterial(U, true); for (const [pick, to] of [[(x) => x[1] < LT.northQ, darkFar], [(x) => x[1] >= LT.northQ, darkNorth]]) { const lot = pools.filter(pick); if (!lot.length) continue; const pm = new THREE.Mesh(P.makePoolGeometry(lot), pmat); pm.renderOrder = 3; pm.matrixAutoUpdate = false; pm.matrix.copy(darkM); scene.add(pm); to.push(pm); } }
      await ctx.yield();
      // THE WET ROAD'S POOLS OF COLOUR (round three, D): under every string that crosses a street of the bright side,
      // soft round pools in the string's own colours, one to 2.3 m of string, each brightening as a front passes it
      const rp = [];
      for (const st of street.strings) {
        const M = P.MIXES[st.mix]; let k = 0, acc = 1.2;
        for (let i = 1; i < st.pts.length; i++) {
          const a = st.pts[i - 1], b = st.pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (; acc <= len; acc += 2.3, k++) { const t = acc / len, p = lerp(a[0], b[0], t), q = lerp(a[1], b[1], t); if (p > PL + 1 && P.groundY(p, q) < 0.1) rp.push([p, q, 0.11, M[k % M.length], Math.abs(p) + Math.abs(q), 2.5, 2.5, 1, 0, 0]); }
          acc -= len;
        }
      }
      // round four: under every lamp of the bright side a warm pool lies on the road (steady: the pool's fourth kind)
      for (const l of lamps) if (l.hp > PL + 1) rp.push([l.hp, l.hq, 0.115, '#ffb060', Math.abs(l.hp) + Math.abs(l.hq), 7.5, 7.5, 1, 0, 3]);
      for (const l of cross.lanterns) rp.push([l[0], l[1], 0.2, '#ffb060', Math.abs(l[0]) + Math.abs(l[1]), 5, 5, 1, 0, 3]);
      if (rp.length) { const rm = new THREE.Mesh(P.makePoolGeometry(rp), P.makePoolMaterial(U, false, 0.32)); rm.renderOrder = 3; scene.add(rm); brightAll.push(rm); }
      // (round seven) the same pools of the strings' colours on the dark copy's wet road, where it is seen alive
      { const rd = []; for (const st of streetD.strings) { const M = P.MIXES[st.mix]; let k = 0, acc = 1.2; for (let i = 1; i < st.pts.length; i++) { const a = st.pts[i - 1], b = st.pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (; acc <= len; acc += 2.3, k++) { const t = acc / len, p = lerp(a[0], b[0], t), q = lerp(a[1], b[1], t); if (q > 0.5 && P.groundY(p, q) < 0.1) rd.push([p, q, 0.11, M[k % M.length], Math.abs(p) + Math.abs(q), 2.5, 2.5, 1, 0, 0]); } acc -= len; } }
        if (rd.length) { const rm = new THREE.Mesh(P.makePoolGeometry(rd), P.makePoolMaterial(U, false, 0.32)); rm.renderOrder = 3; rm.matrixAutoUpdate = false; rm.matrix.copy(darkM); scene.add(rm); darkFar.push(rm); } }
      // and the moon's shadows on the bright copy where its two side leaves show it dead
      if (shadesB.length) { const m = new THREE.Mesh(P.makePoolGeometry(shadesB), P.makeShadeMaterial(U)); m.renderOrder = 2.5; m.visible = false; scene.add(m); dress.push({ m, dark: false, look: 1, b: deadBox, late: 0, first: true }); }
      await ctx.yield();
      // the long soft shadows the dark side's moon lays to the east by north on the snow: every house and tree of the
      // dark copy, the tower, the spire, the courthouse (paint on the ground)
      // (round eight, D1: the water tower's shadow is the surface's own: it lies on roofs and crowns as on the ground;
      // C2: EVERY POLE, MAST AND POST within 90 m of the dark line casts its own long thin shadow)
      for (const o of pw.poles) if (o.q > 0.5 && planTo(R.dark, o.p, o.q) < 90) shades.push(P.shadeOf(o.p, o.q, 0.17, 0.17, [0, 1], o.h, sunD, 0.72));
      for (const l of lamps) if (l.q > 0.5 && planTo(R.dark, l.p, l.q) < 90) shades.push(P.shadeOf(l.p, l.q, 0.13, 0.13, [0, 1], 8.4, sunD, 0.72));
      for (const o of streetD.posts) if (o.q > 0.5 && o.h < 9 && planTo(R.dark, o.p, o.q) < 90) shades.push(P.shadeOf(o.p, o.q, 0.12, 0.12, [0, 1], o.h, sunD, 0.72));   // (a string's pole on a cornice casts no bar on the ground)
      for (const c of P.churchBodies()) shades.push(P.shadeOf(c[0], c[1], c[2], c[3], [0, 1], c[4], sunD, 1));   // (the nave and the spire: the part's own measures)
      shades.push(P.shadeOf(K.COURT[0], K.COURT[1], 15, 10, [0, 1], 15, sunD, 1), P.shadeOf(K.COURT[0], K.COURT[1], 3.4, 3.4, [0, 1], 30, sunD, 1));
      // (round five: the shafts of light are gone, all three)
      { const smat = P.makeShadeMaterial(U); for (const [pick, to] of [[(x) => x[1] < LT.northQ, darkFar], [(x) => x[1] >= LT.northQ, darkNorth]]) { const lot = shades.filter(pick); if (!lot.length) continue; const sm = new THREE.Mesh(P.makePoolGeometry(lot), smat); sm.renderOrder = 2.5; sm.matrixAutoUpdate = false; sm.matrix.copy(darkM); scene.add(sm); to.push(sm); } }
      const a = new THREE.Mesh(P.makeDabGeometry(lg), lampGhostMat), sg = new THREE.Mesh(P.makeDabGeometry([[P.SIGNAL.p, P.SIGNAL.q, P.SIGNAL.y0 + 0.38, '#ffb21c', Math.abs(P.SIGNAL.p) + Math.abs(P.SIGNAL.q), 1, 2]]), sigGhostMat);
      for (const m of [a, sg]) { m.renderOrder = 4; m.matrixAutoUpdate = false; m.matrix.copy(darkM); m.frustumCulled = false; scene.add(m); darkFar.push(m); }
    }
    await ctx.yield();
    // the hanging lantern's light over the first crossing (round seven, E3: it burns steadily; a lamp's light, the living
    // look's alone on either copy) and the moths about the lamps near the bright route
    const sigMat = P.makeDabMaterial(U, false, 2.4, true), mothMat = P.makeDabMaterial(U, false, 0.11, true); mothMat.uniforms.uMoth.value = 1;
    { const a = new THREE.Mesh(P.makeDabGeometry([[P.SIGNAL.p, P.SIGNAL.q, P.SIGNAL.y0 + 0.38, '#ffb21c', 0, 0, 2]]), sigMat); a.renderOrder = 4; scene.add(a); brightAll.push(a); }
    const moths = [];
    for (const l of lamps) { if (l.hp < PL || P.routeDist([l.hp, l.hq, 8], [l.hp, l.hq, 8]) > 40) continue; const n = 8 + Math.floor(rMoth() * 9); for (let k = 0; k < n; k++) moths.push([l.hp, l.hq, l.y - 0.5, '#ffe2b0', 0.35 + rMoth() * 0.9, rMoth() * 97, 0]); }
    if (moths.length) { const a = new THREE.Mesh(P.makeDabGeometry(moths), mothMat); a.renderOrder = 4; a.frustumCulled = false; scene.add(a); brightAll.push(a); }

    // ------------------------------------------------------------------ what lies under and beyond: the floor under the wet road, the fields
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    floor.position.set(-400, -45, 0); scene.add(floor);
    {
      const fb = new P.Geo(256), up = (g, p0, q0, p1, q1) => g.quad([p0, -0.02, -q0], [p1, -0.02, -q0], [p1, -0.02, -q1], [p0, -0.02, -q1]);
      fb.frame(0, 0, 0, null).kind(P.KIND.FIELD).color('#2a241c');
      // (beyond the bright copy's built ground, the part's brightBounds: south of it the home street's road runs on
      // between fields for four blocks' length, in strips of half a block; east and north of it, and beyond that
      // road's end, open field as far as FIELD, well beyond the horizon's farthest farm)
      const [BP0, BP1, BQ0, BQ1] = P.brightBounds(), SOUTH = BQ0 - 4 * B, HR = K.ROAD / 2, FIELD = 2600;
      for (let q = BQ0; q > SOUTH; q -= B / 2) { up(fb, BP0, q - B / 2, -HR, q); up(fb, HR, q - B / 2, BP1, q); }
      up(fb, BP0, -FIELD, FIELD, SOUTH); up(fb, BP1, SOUTH, FIELD, FIELD); up(fb, BP0, BQ1, BP1, FIELD);
      fb.kind(P.KIND.WALK).color('#15161a');
      for (let q = BQ0; q > SOUTH; q -= B / 4) { fb.quad([-HR, 0, -(q - B / 4)], [0, 0.08, -(q - B / 4)], [0, 0.08, -q], [-HR, 0, -q]); fb.quad([0, 0.08, -(q - B / 4)], [HR, 0, -(q - B / 4)], [HR, 0, -q], [0, 0.08, -q]); }
      fd.frame(0, 0, 0, null).kind(P.KIND.FIELD).color('#2a241c');
      // (the dark copy's fields: round the whole town, P.TOWN's edges, north of the plane)
      { const W0 = TW.i0 * B, W1 = (TW.i1 + 1) * B, N1 = (TW.j1 + 1) * B; up(fd, -FIELD, N1, FIELD, FIELD); up(fd, -FIELD, 0, W0, N1); up(fd, W1, 0, FIELD, N1); }
      const mb = new THREE.Mesh(fb.toGeometry(), matB), md = new THREE.Mesh(fd.toGeometry(), matD);
      md.matrixAutoUpdate = false; md.matrix.copy(darkM); mb.frustumCulled = false; md.frustumCulled = false; scene.add(mb, md);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ two skies by where the eye stands
    const sky = makeSky({ rng: rSky, preset: 'night', milkyWay: 0, bake: true, renderer: ctx.renderer, transparent: true, zenith: '#0b1430', mid: '#17214a', horizon: '#2a3558', ground: '#0c1020',
      bodyOverrides: { 0: { elevation: moonEl, azimuth: moonAz, phase: rare ? 0.98 : moonPhase, size: rare ? 4.6 : 3.0, color: rare ? '#f6bd72' : '#f2ecd8', intensity: 1.1, glow: rare ? 0.32 : 0.2 } }, clouds: { coverage: rare ? 0.2 : 0.3, softness: 0.4, lit: '#8a9cc8', shade: '#1a2648', opacity: 0.85 } });
    scene.add(sky.object);
    U.uMoon.value.copy(sky.bodyDirections[0]);
    const night = P.makeNight(U, rAur); scene.add(night.object, night.aurora);   // (round six) the dark side's clear night: stars, its own moon, the northern lights (round seven: drawn wherever a ray is seen dead, by the law of the leaves; the living night stands behind it)
    await ctx.yield();

    // ------------------------------------------------------------------ the leaves
    // ROUND SEVEN: EVERY LEAF IS A WINDOW. Each of the part's sixteen leaves (P.LEAVES: fixed in the plan, the same on every
    // seed) is the leaf alone: two bright edges bowed apart, breathing, motes rising along them, a soft glow close
    // about the edges. No thread, no curtain, no pane, no patch of haze. What is seen inside its outline is the other
    // look, by the law (the part's deadAt), on every material.
    // By its role: a door-sized leaf's rim is a fine line (no great glowing ring). EVERY LEAF STANDS OPEN AT ITS FULL
    // BREADTH ON EVERY VISIT (the part's LEAVES): nothing here writes a leaf's width, rim or fan after the build.
    const LW = P.LEAVES.map(P.leafWorld), rimsB = [], rimsD = [];
    const sideIdx = [], greatIdx = []; let firstIdx = 0;
    for (let k = 0; k < LW.length; k++) {
      const w = LW[k], door = w.role === 'door', c = P.makeCurtain(U, { waist: w.waist, top: w.top, foot: w.foot, gain: door ? 0.6 : w.top > 25 ? 1.0 : 0.85, fine: door });
      c.object.position.set(w.x, 0, w.z); c.object.rotation.y = Math.atan2(w.nx, w.nz); scene.add(c.object);
      (w.x > K.PLANE_X ? rimsB : rimsD).push(c.object);
      if (door) continue;
      if (w.role === 'side') sideIdx.push(k); else if (w.role === 'first') firstIdx = k; else greatIdx.push(k);
    }
    // can the circle (cx, cz, r) be seen through leaf k from the eye's place (ex, ez)? It lies beyond the leaf's plane
    // and reaches into the wedge from the eye through the leaf's waist (a tenth wider: it breathes). By where the eye
    // STANDS: nothing here reads where the lens looks.
    // (a mesh's box b = [x0, x1, z0, z1] can be seen through leaf k from the eye: the part of the box that lies 3 m and
    // more beyond the leaf's plane (a polygon of up to five corners) is not wholly outside either edge of the wedge
    // from the eye through the leaf's waist, taken an eighth wider for its breathing. So a crown that hangs over a
    // leaf's plane by less than 3 m from the eye's own side does not call up its whole block)
    // (room, by the leaf's own breadth: through a leaf the line passes by, nothing is called up that stands more than
    // REACH_BY times that leaf's breadth behind its plane; through the two the line flies through, everything)
    const REACH_BY = 40, clip = new Float64Array(16), REACH = P.leafTable().map((t) => t.flown ? 1e9 : REACH_BY * t.waist);
    const through = (k, ex, ez, b) => {
      const l = LW[k], se = (ex - l.x) * l.nx + (ez - l.z) * l.nz >= 0 ? 1 : -1;
      let n = 0, least = 1e9;
      for (let c = 0; c < 4; c++) {
        const c1 = (c + 1) & 3, x0 = b[c === 1 || c === 2 ? 1 : 0], z0 = b[c >= 2 ? 3 : 2], x1 = b[c1 === 1 || c1 === 2 ? 1 : 0], z1 = b[c1 >= 2 ? 3 : 2];
        const d0 = -se * ((x0 - l.x) * l.nx + (z0 - l.z) * l.nz) - 3, d1 = -se * ((x1 - l.x) * l.nx + (z1 - l.z) * l.nz) - 3;
        if (d0 > 0) { clip[n * 2] = x0; clip[n * 2 + 1] = z0; n++; if (d0 < least) least = d0; }
        if ((d0 > 0) !== (d1 > 0)) { least = 0; const t = d0 / (d0 - d1); clip[n * 2] = x0 + (x1 - x0) * t; clip[n * 2 + 1] = z0 + (z1 - z0) * t; n++; }
      }
      if (!n || least > REACH[k]) return false;
      const hx = -l.nz * l.waist * 0.56, hz = l.nx * l.waist * 0.56, ax = l.x - hx - ex, az = l.z - hz - ez, bx = l.x + hx - ex, bz = l.z + hz - ez;
      const sg = ax * bz - az * bx >= 0 ? 1 : -1;
      let inA = false, inB = false;
      for (let c = 0; c < n; c++) {
        const vx = clip[c * 2] - ex, vz = clip[c * 2 + 1] - ez;
        if (sg * (ax * vz - az * vx) > 0) inA = true;
        if (sg * (vx * bz - vz * bx) > 0) inB = true;
      }
      return inA && inB;
    };

    // ------------------------------------------------------------------ air: falling leaves and chimney smoke (the living look), diamond dust (the dead look)
    const tU = { value: 0 };
    // the falling leaves are the part's own: small leaf shapes that fall from the trees' crowns, none within 6 m of the lens
    await ctx.yield();
    const leaves = P.makeLeafFall(U, P.dealLeafFall(seed, Math.round(2200 * clamp(density, 0.7, 1.3) * detail), leafCols));
    brightAll.push(leaves);
    await ctx.yield();
    // (round seven) the same fall on the dark copy where its leaves show the town alive (the square, the first street's corner)
    // (room: in the same two lots: the fall about the first dead street's leaf, and the fall of the north lot)
    const nLD = Math.round(1500 * clamp(density, 0.7, 1.3) * detail), colS = leafColsD.filter((c) => c[1] < LT.northQ), colN = leafColsD.filter((c) => c[1] >= LT.northQ), nLS = Math.round(nLD * colS.length / Math.max(leafColsD.length, 1));
    const leavesD = P.makeLeafFall(U, P.dealLeafFall(seed, nLS, colS, true)), leavesDN = P.makeLeafFall(U, P.dealLeafFall(seed, nLD - nLS, colN, true));
    leavesD.matrix.copy(darkM); leavesDN.matrix.copy(darkM); scene.add(leavesD, leavesDN);
    await ctx.yield();
    // THE DEAD AIR: NOTHING FALLS. DIAMOND DUST hangs in it (the part's own medium, makeDust): motes that hang, ride
    // slowly on the standing wind and flash in the moon, EACH AT A PLACE OF THE WORLD along the dead line (the part's
    // DUST: one mote to each fifty cubic metres of the tube of air about the dark line; the count to a metre of the
    // line follows there from the tube's cross-section), drawn where its own place is seen dead. The same on every visit.
    // It is a part of the dark copy and is drawn while that copy is (update: nearPlane).
    const dust = P.makeDust(U, rDust, Math.round(P.DUST.per * (R.dark.length - 1) * clamp(detail, 0.5, 1)));
    scene.add(dust);
    await ctx.yield();
    // CHIMNEY SMOKE (round seven, F): the part's own soft puffs, the living look's alone (cut at a leaf's outline): on the
    // bright copy from the chimneys nearest the line, on the dark copy from every second chimney of the houses in relief
    {
      // (the bright copy: the fourteen chimneys nearest the bright line)
      const pickB = chimneys.filter((c) => c[3]).map((c) => [c, planTo(R.bright, c[0], c[2])]).sort((a, b) => a[1] - b[1]).slice(0, 14).map((x) => x[0]);
      const cd = chimneys.filter((c, k) => c[4] && k % 2 === 0);
      if (pickB.length) { const m = P.makeSmoke(U, pickB); scene.add(m); brightAll.push(m); }
      for (const [lot, to] of [[cd.filter((c) => c[2] < LT.northQ), darkFar], [cd.filter((c) => c[2] >= LT.northQ), darkNorth]]) if (lot.length) { const m = P.makeSmoke(U, lot, 10); m.matrix.copy(darkM); scene.add(m); to.push(m); }
    }
    await ctx.yield();
    scene.add(leaves);

    // ------------------------------------------------------------------ pace and looks, by places (the part's flight)
    // THE PACE AND THE THREE LOOKS ARE THE PART'S (P.flight: each given by the place of its subject in metres of the
    // line, on the routes' marks, with its reason there). Here the metres are turned into what the engine asks for:
    // a look's window and its ease as shares of the line's length, the pace as a ratio (the engine scales it so that
    // the flight lasts its seconds). The line's own point at a metre is the path's.
    const FL = P.flight(), linePt = new THREE.Vector3(), lineAt = (m, out) => { path.posAtDist(m, linePt); out[0] = linePt.x; out[1] = linePt.y; out[2] = linePt.z; return out; };
    const pois = FL.looks.map((lk) => { const v = new THREE.Vector3(), t = [0, 0, 0]; return { at: (time, u) => { lk.at(u * L, lineAt, t); return v.set(t[0], t[1], t[2]); }, from: lk.from / L, to: lk.to / L, weight: lk.weight, fade: lk.ease / (lk.to - lk.from), steady: lk.steady }; });
    await sky.prewarm(ctx.renderer, null, scene);
    const eye = new THREE.Vector3(), size = new THREE.Vector2();
    return {
      scene, path, duration: P.LENS.seconds,
      pace: (u) => FL.speedAt(u * L) / FL.speedAt(0),
      camera: { fov: P.LENS.fov, near: 0.25, far: 4200, lookAhead: P.LENS.ahead, sway: P.LENS.sway, bank: P.LENS.bank, nearThrough: 0.3 },   // round three: bank 0.2 (the horizon tilts 3.2 degrees at most in the turns: every pole stands near plumb)
      pois,
      portal: { shape: 'circle', radius: 7, color: '#dfeaff', glow: 0.2, revealDistance: 170 },
      style: 'none', ride: 'none', companion: 'none',
      post: { exposure: 1.2, bloom: { strength: 0.55, radius: 0.7, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.0, tint: '#ffffff', shadowTint: '#05070f', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        camera.getWorldPosition(eye);
        // (round seven) THE LAW OF THE LEAVES needs no state of the world's: every material reads the eye's own place and
        // the leaves' fixed planes. Here only what is DRAWN is chosen, by where the eye STANDS (never by where it looks)
        const ex = eye.x, ez = eye.z, live = ex > K.PLANE_X, nearPlane = ex < K.PLANE_X + P.NEAR_PLANE;
        U.uTime.value = time; tU.value = time;
        ctx.renderer.getDrawingBufferSize(size); U.uH.value = size.y;
        sky.update(dt, time, camera);   // the living night stands behind the dead sky's dome, which is drawn only where a ray is seen dead
        for (let k = 0; k < darkFar.length; k++) darkFar[k].visible = nearPlane;
        dust.visible = nearPlane;
        const outer = eye.x < K.PLANE_X - 20, br = eye.x > K.PLANE_X - 1;
        for (let k = 0; k < darkOuter.length; k++) darkOuter[k].visible = outer;
        const outer2 = eye.x < K.PLANE_X - 30; for (let k = 0; k < darkOuter2.length; k++) darkOuter2[k].visible = outer2;
        const north = eye.x < K.PLANE_X - (P.LOTS.northQ - P.LOTS.northSeen); for (let k = 0; k < darkNorth.length; k++) darkNorth[k].visible = north;
        for (let k = 0; k < brightAll.length; k++) brightAll[k].visible = br;
        const det = eye.x < -6; for (let k = 0; k < darkDetail.length; k++) darkDetail[k].visible = det;
        // the near blocks: their small relief while the eye stands within 72 m of the block's square, their trees whole
        // within 100 m of it (beyond: the stand-in). By where the eye STANDS only: on a pause the world is not updated
        // while the viewer may look round, so nothing is hidden by where the lens looks
        for (let k = 0; k < cells.length; k++) {
          const c = cells[k];
          if (c.mb) { const x = Math.max(c.b[0] - eye.x, 0, eye.x - c.b[1]), z = Math.max(c.b[2] - eye.z, 0, eye.z - c.b[3]); c.mb.visible = br && x * x + z * z < 5184; }
          if (c.d) {
            const x = Math.max(c.d[0] - eye.x, 0, eye.x - c.d[1]), z = Math.max(c.d[2] - eye.z, 0, eye.z - c.d[3]), d2 = x * x + z * z, on = c.late === 3 ? outer2 : c.late ? outer : true;
            if (c.md) c.md.visible = on && d2 < 5184;
            if (c.tn) c.tn.visible = on && d2 < 10000;
            if (c.tf) c.tf.visible = on && d2 >= 10000;
          }
        }
        for (let k = 0; k < litters.length; k++) {
          const c = litters[k], x = Math.max(c.b[0] - eye.x, 0, eye.x - c.b[1]), z = Math.max(c.b[2] - eye.z, 0, eye.z - c.b[3]), x2 = Math.max(c.d[0] - eye.x, 0, eye.x - c.d[1]), z2 = Math.max(c.d[2] - eye.z, 0, eye.z - c.d[3]);
          c.mb.visible = br && x * x + z * z < 4900; c.md.visible = det && x2 * x2 + z2 * z2 < 4900;
        }
        // the lots along the dark line: whole within their distance, the stand-in (or fewer feathers) beyond it
        for (let k = 0; k < zones.length; k++) {
          const zn = zones[k], x = eye.x - zn.x, z = eye.z - zn.z, dist = Math.sqrt(x * x + z * z) - zn.r;
          if (zn.fill) { const n = Math.round(zn.n * (zn.keep + (1 - zn.keep) * (1 - smoothstep(zn.near - zn.fill, zn.near, dist)))); zn.full.geometry.instanceCount = n; zn.full.visible = nearPlane && n > 0; if (zn.gain) zn.gain.value = Math.pow(zn.n / Math.max(n, 1), 0.6); }
          else { zn.full.visible = nearPlane && dist < zn.near; if (zn.far) zn.far.visible = nearPlane && dist >= zn.near; }
        }
        // THE ONE-LOOK DRESS (round seven): a crown of leaves (look 0) or the rime's lace, feathers and shadows (look 1) is
        // drawn while it can be seen in its look from where the eye stands: all round on the side whose look it is, and
        // on the other side only through a leaf's outline (the wedge from the eye through the leaf's waist)
        for (let k = 0; k < dress.length; k++) {
          const c = dress[k]; let on;
          if (c.all) on = !live;
          else if (!c.dark) { on = br && c.look === 0; if (br && !on) for (let q = 0; q < sideIdx.length && !on; q++) on = through(sideIdx[q], ex, ez, c.b); }
          else if (live) on = nearPlane && (c.look === 0 ? c.first : through(firstIdx, ex, ez, c.b));
          else if (c.look === 1) on = c.late === 3 ? outer2 : c.late ? outer : true;
          else { on = false; for (let q = 0; q < greatIdx.length && !on; q++) on = through(greatIdx[q], ex, ez, c.b); }
          c.m.visible = on;
        }
        // a leaf's rim is a part of its own copy and is drawn while that copy is: while the eye stands on that copy's
        // side of the plane or within P.NEAR_PLANE of the plane on the other side (the copies' own rule, above)
        const rimB = ex > K.PLANE_X - P.NEAR_PLANE; for (let k = 0; k < rimsB.length; k++) rimsB[k].visible = rimB;
        for (let k = 0; k < rimsD.length; k++) rimsD[k].visible = nearPlane;
        leavesD.visible = !live; leavesDN.visible = north;
      },
      dispose() { sky.dispose(); noiseTex.dispose(); },
      stats: { nHouses, nTrees, builtTris, bulbs: nearBulbs.length, feathers: rime.length / 10, pools: pools.length, shades: shades.length },
    };
  },
};
