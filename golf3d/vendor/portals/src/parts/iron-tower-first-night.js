// The tower of iron-tower-first-night: the iron tower of the Paris exposition on an evening of 1889, built at the origin.
// WHAT THIS FILE HOLDS, in its order:
//  1. the FRAME (where the grounds' named things stand), the tower's OUTLINE (levels, half widths, legs, arches, decks,
//     lifts) and a conservative distance to its solid ENVELOPE, for the clear-air proofs;
//  2. the ROUTE (knots, places, pace, looks, portal, camera), laid on call by layRoute(), which the world file imports
//     so that the world, the tower and the route's proofs all count from the same figures;
//  3. the iron as DATA: towerMembers() lists every bar of the tower as a straight member between two points,
//     plateQuads() every panel face as a quad (the plate that closes the face's cells far off or seen aslant, and that draws the
//     fine lattice on a face where no fine bars stand), nearPanels() which faces have their fine bars as members;
//  4. the iron DRAWN: buildIron();
//  5. what stands on the iron: buildDecks() (the decks, the crown's solids, the lifts, the flags; liftCarAt and
//     flagPointAt are its movers' places by the clock);
//  6. the whole tower as the part's contract: buildHero(ctx, opts);
//  7. the tower's lamps: buildLamps(ctx, hero, opts): the gas cordons and the arcades' globes, the beacon, the two
//     projectors' beams and the Bengal fire, with their own lawful readings named where they are drawn.
// Nothing of the route or of the tower is worked while the file loads (a few levels and sizes apart): the route is
// laid by layRoute(), the envelope at its first reading, the members, plates and movers at their first call.
//
// The frame: the tower's centre at ground level is the origin, Y is up, metres; the ground of the Champ de Mars is y 0.
// Axes: +Z runs down the garden to the central dome and the glass hall, -Z to the river and the Trocadero;
// +X is upstream (north-east), -X downstream. The four legs: north (+X, -Z), west (-X, -Z), east (+X, +Z), south (-X, +Z).
//
// Every size is from design/cb/newworld/figures.md (A for the tower, B for the grounds). A figure that file does not give
// is a modest working value and carries the word WORKING on its line or in the comment over its block.
//
// THE THREE SOURCES (the tower as it stood that year; no later lighting of it):
// COLOUR: a glossy red-brown, darkest at the foot and paling in five bands to near gold at the cupola (La tour de
//   trois cents metres, 1900, on the last coat of spring 1889; Les Merveilles de l'Exposition de 1889 on its tints).
// LAMPS: gas burners in opal glass globes about 0.35 m apart, in lines on each platform, on the pier bases and round
//   the four great arches, none up the legs (La tour de trois cents metres), 3,836 by Le Genie civil of 1889.
//   BUILT HERE: 4,077 burners (the arches and the pier bases 2,476, the first platform 819, the second 433, the
//   third and its terrace 349), counted from the built deal; the spacing is the source's and the difference from
//   3,836 is the lines' length as built (WORKING).
// BEACON: a fixed white electric light in the lantern, with a drum turning in about ninety seconds that gives red,
//   white and blue flashes (the same two; Les Merveilles de la science says green for blue), not seen from the
//   grounds (Guide bleu du Figaro, 1889). Two projectors on the third platform play beams over the grounds and the
//   Bengal fire burns red on the platforms on the evenings of the lights (figures.md C).
// A CONFLICT, NAMED: the tower's present official history dates the first graded paint to 1899 and gives 10,000
//   burners. This file follows the builder's own book (La tour de trois cents metres, 1900) and two works of 1889
//   (Le Genie civil; Les Merveilles de l'Exposition de 1889), and takes the paint's five tints from Les Merveilles
//   de l'Exposition de 1889.
// WHAT THE PAINT AND THE BURNERS REST ON: the crew's research in those three works as read in their scanned text;
//   the builder's book itself could not be opened to read its printed date for the last coat (the scanned text
//   prints 1899 for it and the sentence after it shows the spring of 1889), so the graded paint of 1889 stands on
//   that reading and on Les Merveilles de l'Exposition de 1889, a book of that year, and the burners' number on
//   Le Genie civil of 1889.
//
// WHAT RUNS BY WHAT. BY METRES FLOWN, between places of ROUTE.places and nothing else: the gas coming on (one wave
// over six stages: the arches, the pier bases, the three platforms, the terrace), the two beams lit and doused
// (the garden's begins to come on where the river's is out, half way from helixTop to comeAboutStart, so the two
// never show together), the Bengal fire's two flarings and dyings with their red on the iron (one on the climb,
// one on the run back), its smoke's growing, hanging and thinning after each, and the hour (the world's night
// number, handed in).
// BY THE WORLD'S CLOCK, each a pure function of it: the gas's flicker, the beacon's round (four flashes' rounds to
// the drum's turn), the beams' rests and swings and their haze, the fire's flames and smoke and the flicker of its
// red on the iron (two faint ripples from each deck), the lift cars and the counterweight trucks on their runs,
// the flags' cloth. Nothing is advanced by dt.
//
// SOURCED AND INVENTED, the tower's things (the world file's head lists the grounds'; each is tagged again at its
// place):
// SOURCED (figures.md A and C): the outline, levels and half widths, the four legs and arches, the arch girders,
//   the four masonry footings and the south one's glazed roof; the three platforms; the first platform's arcaded
//   gallery, its masts and flags, its four pavilions and its arcades' globes; the second's roofed gallery, tanks,
//   timber pavilion and tents; the third's glazed room, the terrace's pavilion and the projectors' track; the
//   crown, lantern and flag; the three weights of lattice in kind; the paint's five bands; the lifts' makers, runs
//   and that the upper pair move opposite ways; the gas cordons, their spacing and where they ran; the beacon; the
//   two projectors; the Bengal fire.
// INVENTED BY NEED (no line of the sources gives it; the need is told at its place): the lift cars' lit panes (a
//   car that carried riders after dark was lit; unlit it could not be seen to move); the Otis lifts' counterweight
//   trucks; the lifts' rails and the half-way platform; the landing cages and head frames in which the cars end
//   their climbs; the first platform's stairs' heads and eighteen kiosks; the legs' shoes on the footings; the
//   consoles under the gallery; the gilt of the arcades' crescents; the stair's drum up through the campanile (the
//   lantern's floor must stand on something from the pavilion's roof: no line gives it); the pool of light a beam
//   lays where it rests;
//   the plates that close a lattice's cells, far off or on a face seen aslant, to the face's mean, and the share of
//   sky that mean carries (a drawing's filter: the true iron stands behind it, and it is lace, not a slab); the
//   sky's third tone, over the mid sky, by which that share is laid; the count and pattern of the fine bracing
//   inside a panel (the sources give its kind, not each bar); the route's looks (where the gaze goes is no thing
//   of 1889: the river's look, the helix's with its panorama and its pan to the tower's head, the fly-out's
//   pull-back and the come-about's look across the garden are told at their places).
// NOT BUILT: any light the cars throw on the iron; anything lettered (the frieze's names are a plain band); any
//   later lighting of the tower.
//
// THREE WEIGHTS OF IRON, none thinner than 0.3 m: heavy (corner rafters, the arches' chords, the decks' girders, the
// crown's girders and arches), medium (ties, the St Andrew's cross and mid tie of each panel face, the arches' posts),
// fine (0.3 to 0.4 m: the bracing inside each cross, the grille between an arch's chords).
//
// A member: { ax, ay, az, bx, by, bz, w, h, weight, band, group, panel }. w is its breadth across (its side vector is
// level, as a kit beam's), h its depth. band is the paint band 0 to 4 by the height of its middle: darkest to deck 1,
// lighter to deck 2, three lighter above. group is 'zone:kind'. panel is the index of the plate quad a fine member
// belongs to (or -1), so that a builder can keep or drop a face's fine bars together.
//
// THE IRON DRAWN: the members as instanced unit boxes in four bands of height (a box to a band, one material, each
// instance's matrix written straight into the buffer; a bar that braces a panel face carries that face's normal,
// tint and cell), one flat plate over every panel face (one mesh), and the four masonry footings. Its light is a key direction and colour, a sky fill and, for the Bengal fire, a red glow from the decks' heights
// over a low red on all the iron while the fires burn, under which the key and the fill count for less (the
// glare), all uniforms: the world sets the key and the fill, the lamps (buildLamps) the red and its
// flicker's phase; no light reads the lens.
// ON THE IRON: the solids (one merged geometry of flat faces, each vertex carrying a skin: plain, a wall of lit
// windows, the arcaded gallery, a railing of posts), the slender bars (masts, the rod, the lifts' rails: instances of
// a box of the members' form under a material of the members' program, each made again here), the flags, and the cars (eight instances of one box: six cars and the two
// counterweight trucks of the Otis lifts).
// EVERY MOVER IS A PURE FUNCTION OF THE CLOCK: a car's place is liftCarAt(index, time); a flag's cloth is drawn by the
// vertex shader from uTime alone. update(dt, time) writes that uniform, the drawing buffer's height and the eight
// cars' matrices; nothing is advanced by dt.
// NOTHING IS LETTERED: the frieze under the first gallery is a plain band; the flags are plain bands of colour.
//
// LAWFUL READINGS OF L1 USED BY THE DRAWING, each named here, none other made:
//  - A LEVEL OF DETAIL BY WHERE THE ROUTE RUNS, DECIDED AT BUILD: a panel face is NEAR when any of it lies within
//    FINE_REACH metres of the flown line, counted from the route's own curve and never from the lens. Near faces get
//    their fine bars as real members; on any other face the plate draws the same pattern's bars. The choice is made
//    once, from the route, and does not change while the world runs. (This route passes within that reach of every
//    face, so every face's fine bars are members.)
//  - A FILTER BY A PIXEL'S FOOTPRINT on the members and the slender bars: the vertex shader widens a member's two thin
//    axes so that it is never drawn thinner than uPx.y pixels, the metres one pixel covers worked from the member's own
//    depth and the projection. It widens and never hides, thins or fades.
//  - A FILTER BY A PIXEL'S FOOTPRINT on the members' shading, with THE DIRECTION FROM A BAR TO THE EYE: a bar a pixel
//    or two broad shows its lit face and its unlit one inside one pixel, so there it takes the mean light of its two
//    faces turned to the eye, each weighed by how much of it the eye sees, and carries no highlight; a bar several
//    pixels broad is shaded face by face. Between the two the shading goes over by the bar's breadth in pixels.
//    A broad bar's face that is turned so far from the eye that it shows as a sliver under a pixel or two (its
//    breadth in pixels times the cosine between it and the line of sight) takes that same mean and no highlight.
//  - A FILTER BY A PIXEL'S FOOTPRINT on the plates and on the bars that brace a panel face, counted ACROSS THE
//    FACE: the metres one pixel covers at the place's own depth, over the cosine between the face and the line of
//    sight, so that a face seen aslant is counted by its foreshortened breadth, with its bars as deep as they
//    show aslant. A plate lies over every panel face. Where the hole of a lattice cell (worked from the pattern:
//    the round that fits in a cell, less the bars as drawn) falls under CLOSE.open pixels across, the cell's plate
//    comes in, in the tone an open hole shows there (the sky's own along the eye's ray, and the iron's by the
//    share of the hole that the bars' depth hides aslant), and by CLOSE.shut pixels it stands in the face's MEAN,
//    the paint at CLOSE.tone of its light with its share of that sky; a wider cell is not drawn and the real bars
//    stand before the open sky. So a face far off is one calm tone and never a field of pinholes of sky. The
//    face's own bars (its fine bars, its cross and mid tie) go over to the same mean as the face closes and is
//    seen aslant, so a face seen nearly edge-on is one tone and never a field of dashes; seen square on they keep
//    their own paint and the face stays lace. On a face without real fine bars the plate also draws the pattern's
//    bars as lines, each as wide as its bar and never narrower than the members' least breadth. Nothing
//    translucent: a pixel of a plate is drawn whole or not at all.
//  - A SHADING BY THE DIRECTION FROM A THING TO THE EYE on a face's mean: it is lattice, not plate, so it carries
//    CLOSE.air of the sky's own tone on the line of sight through it (the horizon's tone, the mid sky's or a
//    deeper one, by how steeply that line rises), less as the face is seen aslant (by the share of each hole the
//    bars' depth then hides) and none edge-on; a cell on its way to the mean carries more of that sky, and where
//    it begins to close all of the share seen through. And the mean is lit half way between the face's normal
//    and the direction to the eye, as bars are that show the eye the faces turned to it. By direction alone: one
//    number at any range.
//  - WHICH SIDE OF A SHEET IS SEEN (gl_FrontFacing): the plates, the decks' flat solids and the flags' cloth are
//    drawn from both sides, and each turns its normal to the side seen so that both are lit as faces. A turning of
//    the light only: nothing is hidden by it.
//  - THE AIR: every material here takes the scene's fog (the world's, one exponential fog whose colour and
//    density the hour sets). It is the order's own dusk air and by nature a fade by distance to the eye; it falls
//    on every thing alike and no thing of the tower is singled out, hidden or thinned by it.
//  - A FILTER BY A PIXEL'S FOOTPRINT on the arcades' columns and the railings' posts, drawn on flat walls: they are
//    never narrower than about 1.3 pixels (fwidth); the openings beside them close by the metres one pixel covers
//    there, so far off the gallery is a solid band.
//  - A FILTER BY A PIXEL'S FOOTPRINT on the lit windows: their edges are eased over one pixel's footprint (fwidth), and
//    the panes go to their mean light as the cells shrink under a pixel, so that a wall of windows does not shimmer.
//  - A SHADING BY THE DIRECTION FROM A THING TO THE EYE: the paint is glossy, so each surface mirrors a share of the
//    dusk sky and of the afterglow along that direction's reflection, more as it turns edge-on to the eye.
// AND BY THE LAMPS (buildLamps), each named again where it is drawn:
//  - SQUARES TURNED TO THE EYE: every lamp (a gas globe, an arcade's globe, the beacon) is one small square that
//    faces the eye; a flame of the Bengal fire and a plume of its smoke are upright blades that turn about their
//    own uprights to face the eye. A turning only: none is sized, shaped, faded or hidden by where the eye is.
//  - A HOLD BY A PIXEL'S FOOTPRINT on the lamps and on the beams: a globe's radius and a beam's half breadth are in
//    metres and never drawn under about a pixel, their light lowered with the ratio. It widens and dims, never hides.
//  - A SHADING BY THE DIRECTION FROM A THING TO THE EYE on a cordon's globes (seen along its own row, the nearer globe
//    hides the farther: each gives the share of itself that shows beside its neighbour), on the beacon (its whole
//    light within the level sheet its optic throws, its lit glass alone under that sheet) and on the beams (the
//    depth of lit haze along the line of sight).

import * as THREE from 'three';

const RAD = Math.PI / 180;

// A compass bearing and a distance from the tower as a place in the frame: +X lies at bearing 44, +Z at bearing 134.
function fromBearing(deg, dist) {
  return { x: Math.cos((deg - 44) * RAD) * dist, z: Math.cos((deg - 134) * RAD) * dist };
}

const glow = fromBearing(308, 1);                 // sunset's bearing in late June, behind the Trocadero, a little downstream
const BRIDGE_Z0 = -325, BRIDGE_Z1 = -170;         // the bridge spans the whole river
const BRIDGE_SPAN = 28, BRIDGE_PIER = 3;
const bridgeMid = (BRIDGE_Z0 + BRIDGE_Z1) / 2;
// five arches and four piers, set evenly about the river's middle; index 0 is the Trocadero's bank, 4 the tower's bank
const bridgeArchZ = [-2, -1, 0, 1, 2].map((k) => bridgeMid + k * (BRIDGE_SPAN + BRIDGE_PIER));

export const FRAME = {
  groundY: 0,
  waterY: -7,                                     // WORKING (figures B)
  afterglow: { x: glow.x, z: glow.z, bearing: 308 },   // unit vector on the ground plane toward the glow
  upstream: { x: 1, z: 0 },                       // the river runs from +X to -X past the bridge
  river: { z0: BRIDGE_Z0, z1: BRIDGE_Z1,
    // the river's middle bends toward +Z both ways from the bridge: places of its centre line for the far reaches
    upstreamBend: { x: 810, dz: 230 },            // at the next bridge upstream the centre lies about 230 m toward +Z
    downstreamBend: { x: -560, dz: 100 } },       // at the iron footbridge downstream about 100 m toward +Z
  bridge: {
    halfWidth: 7, z0: BRIDGE_Z0, z1: BRIDGE_Z1, length: BRIDGE_Z1 - BRIDGE_Z0,
    archZ: bridgeArchZ, span: BRIDGE_SPAN, rise: 3.3, pierWidth: BRIDGE_PIER,
    crownY: 0.5,                                  // WORKING: the intrados crown, 7.5 m over the water
    springY: 0.5 - 3.3,                           // where the arch leaves the pier: the crown less the rise
    deckY: 1.7,                                   // WORKING: the roadway, 1.2 m of stone over the crown
    parapetY: 2.7,                                // WORKING: a parapet 1 m high
    pedestals: { z: [BRIDGE_Z0 - 4, BRIDGE_Z1 + 4], x: [-9, 9], height: 10 },   // WORKING: four horsemen on end pedestals
    arcLamps: 10,
  },
  lowBank: { z: -170, y: -5, shedHeight: 4 },     // the low bank with its sheds; level and shed height WORKING
  quayHouses: { z0: -168, z1: -143, gapHalf: 15, minHeight: 5, maxHeight: 15, count: 44 },   // heights WORKING
  railwayCut: { z0: -140, z1: -125, width: 15, depth: 4, tunnelX: 0 },   // the narrow-gauge line's trench; depth WORKING
  fountain: { x: 0, z: 0, basinDiameter: 24, groupWidth: 12, groupHeight: 9 },   // the group under the tower's centre
  lakes: { x: [-86, 86], z: 0, sizeX: 45, sizeZ: 65 },   // 65 by 45; the long side along Z is WORKING (it clears the footings)
  brazilTower: { x: -150, z: 40, height: 40 },    // place WORKING
  parterre: { z0: 77, z1: 187, halfWidth: 15, sunk: 1.5 },   // 110 by 30; sunk depth WORKING
  awningWalks: { x: [-27, 27], z0: 75, z1: 460 },
  mainJet: { x: 0, z: 220, basinDiameter: 28, jetHeight: 20 },
  canal: { z0: 234, z1: 285, halfWidth: 7, jets: 14, jetHeight: 8 },   // 51 by 14; jet height WORKING
  coutan: { x: 0, z: 303, basinDiameter: 38, height: 8 },   // the great group facing the tower; height WORKING
  palaces: {                                      // fine arts on +X, liberal arts on -X; the two alike
    z0: 97, z1: 329, xNear: 110, xFar: 195, nave: 52.8, bodyHeight: 25,   // body height WORKING
    dome: { x: 155, z: 223, height: 56 },         // one on each palace, at x +155 and -155
  },
  centralDome: { x: 0, z: 495, diameter: 30, domeTop: 55, statueTop: 65 },
  industries: { z0: 359, z1: 690, halfWidth: 215, height: 18 },   // height WORKING
  glassHall: { z0: 720, z1: 865, halfWidth: 210, ridge: 48 },     // 420 by 145 under one glass roof
  railwayEnd: { x: -235, z0: 830, z1: 880 },
  farAvenue: { z: 885, fenceX: 230 },
  trocadero: {
    rotunda: { x: 0, z0: -690, z1: -600, lantern: 57 },
    towers: { x: [-50, 50], z: -645, height: 82.5 },   // z WORKING: beside the rotunda's middle
    wings: { endX: 215, endZ: -570, overall: 430 },
    hill: { fromZ: -340, rise: 25 },              // WORKING: the ground climbs 25 m from the far bank to the palace
    pool: { z0: -600, z1: -490, sizeX: 75, sizeZ: 44 },
  },
  // the far city: places from bearing and distance, heights above the ground plane
  farCity: {
    invalides: { x: 640, z: 1210, height: 107 },       // bearing 106, 1.4 km
    arch: { x: 1260, z: -1160, height: 50 },           // bearing 1, 1.7 km
    pantheon: { ...fromBearing(110, 4000), height: 83 },
    cathedral: { ...fromBearing(98, 4100), height: 96 },
    hill: { ...fromBearing(48, 4750), height: 95 },   // a dark hill, its church unfinished
    schoolDome: { x: 0, z: 980, height: 40 },
  },
};

// ---------------------------------------------------------------------------------------------------------------
// THE TOWER'S OUTLINE

const LEVELS = {
  bearings: 2.5, deck1: 57.63, deck2: 115.73, deck3: 276.13, terrace: 278.71, lanternFloor: 293.2, top: 300, rodTop: 310.8,
};

// Half widths to the corner rafters' axes: [height, outer, the legs' inner side or null where the table gives none].
const OUTLINE = [
  [0, 62.45, 37.12],        // the masonry of the footings
  [2.5, 58.20, 43.20],
  [17, 50.9, 35.9],
  [28, 45.4, 30.4],
  [39, 39.9, 24.9],
  [50, 34.3, 19.3],
  [57.6, 31.3, 16.3],
  [79, 24.7, null],
  [100, 19.3, 8.0],
  [115.7, 15.85, 5.44],
  [150, 12.2, null],
  [200, 8.8, null],
  [250, 6.0, null],
  [270, 5.0, null],
  [276, 5.0, null],
  [293, 2.2, null],
  [296, 1.3, null],
  [300, 1.3, null],
];

// The table's row pair that brackets a height (clamped to the table's ends) and the share of the way between them.
function bracket(y) {
  const n = OUTLINE.length;
  if (y <= OUTLINE[0][0]) return [0, 0, 0];
  if (y >= OUTLINE[n - 1][0]) return [n - 1, n - 1, 0];
  let i = 0;
  while (y > OUTLINE[i + 1][0]) i++;
  return [i, i + 1, (y - OUTLINE[i][0]) / (OUTLINE[i + 1][0] - OUTLINE[i][0])];
}

// Half width of the tower's outer outline at a height, by straight interpolation of the table.
function halfOuter(y) {
  const [i, j, f] = bracket(y);
  return OUTLINE[i][1] + (OUTLINE[j][1] - OUTLINE[i][1]) * f;
}

// Half width to the legs' inner side at a height, by straight interpolation of the table; null wherever a bracketing
// row gives none (between deck 1 and the 100 m row, and above deck 2 where the four legs have become one shaft).
function legInner(y) {
  const [i, j, f] = bracket(y);
  const a = OUTLINE[i][2], b = OUTLINE[j][2];
  if (f === 0) return a;
  if (f === 1) return b;                            // exactly on a row: that row's own figure
  if (a === null || b === null) return null;
  return a + (b - a) * f;
}

// The side of one leg's square box: 15 m up to deck 1, narrowing to 11.3 m at 100 m and 10.41 m at deck 2.
// WORKING: 11.3 is the table's own rows at 100 m (19.3 less 8.0); the book's figure is 11.32.
// Below the bearings the table's masonry row widens it to the footing.
function legWidth(y) {
  if (y <= 57.6) { const v = legInner(y); return halfOuter(y) - v; }
  if (y <= 100) return 15 + (11.3 - 15) * (y - 57.6) / (100 - 57.6);
  return 11.3 + (10.41 - 11.3) * Math.min(1, (y - 100) / (115.7 - 100));
}

const LEG_SIGNS = { north: [1, -1], west: [-1, -1], east: [1, 1], south: [-1, 1] };

// The height below deck 1 at which the clear width between two legs' inner sides is a given length (it narrows upward).
function girderLevel(length) {
  let lo = LEVELS.bearings, hi = LEVELS.deck1;
  for (let it = 0; it < 50; it++) { const y = (lo + hi) / 2; if (2 * innerSide(y) > length) lo = y; else hi = y; }
  return (lo + hi) / 2;
}

// The structure's own figures (figures A): the masonry footings, the levels of the legs' ties and girders, the panels
// above the first deck, and the three weights of member, each below deck 2 and above it.
const STRUCTURE = {
  footing: { side: 25, height: 5.4 },               // each a rusticated block with a cove above; 25.33 by the table's ground row
  baseGirder: [2.5, 6], ties: [17, 28, 39, 50],
  panel5: [50, 57],                                 // the leg's fifth and last panel under the first deck
  // the arch girder stands on the arches' extrados crown: its two chords at the two levels where the clear width
  // between two legs' inner sides is the sources' two lengths, 45.287 m below and 38.250 m above
  archGirder: [girderLevel(45.287), girderLevel(38.250)],
  panels: { deck1to2: 6, deck2to3: 18, firstHeight: 11.3, lastHeight: 5.83 },   // each a crossed panel with a mid tie
  members: { rafter: [0.88, 0.50], tie: [0.80, 0.60], lattice: 0.25 },         // metres across; the lattice bars' 0.25 is WORKING
};

// The square footprint of one leg at a height at or below deck 2: its centre and half side. Null above deck 2.
function legBox(y, leg) {
  if (y > LEVELS.deck2) return null;
  const s = LEG_SIGNS[leg], o = halfOuter(y), w = legWidth(y), c = o - w / 2;
  return { x: s[0] * c, z: s[1] * c, half: w / 2 };
}

// Half width to the legs' inner side at any height up to deck 2 (the table's gap between deck 1 and 100 m filled
// from the box's side), for the things that need a figure where legInner gives none.
function innerSide(y) { return halfOuter(y) - legWidth(Math.min(y, 115.7)); }

// The four great arches, one on each face, each a half ring in the leaning plane of the legs' outer faces with a
// second in the plane of their inner faces. In elevation the intrados is a half circle of 37 m about a centre 2.4 m up.
const ARCH = { radius: 37, centreY: 2.4, grille: 3.92, crownY: 2.4 + 37, extradosCrownY: 2.4 + 37 + 3.92, lean: 0.5027 };

function makeArch(name, axis, sign) {
  return {
    name, axis, sign,                               // the face stands across this axis, on this side of the tower
    // the face's plane leans in toward the axis as it rises: its place along the axis at a height
    plane: { outerAt: (y) => sign * halfOuter(y), innerAt: (y) => sign * innerSide(y), lean: ARCH.lean },
    radius: ARCH.radius, centreY: ARCH.centreY, crownY: ARCH.crownY,
    extradosRadius: ARCH.radius + ARCH.grille, extradosCrownY: ARCH.extradosCrownY,
  };
}

const ARCHES = {
  river: makeArch('river', 'z', -1),                // faces the bridge and the Trocadero
  garden: makeArch('garden', 'z', 1),               // faces the dome; the portal stands in it
  upstream: makeArch('upstream', 'x', 1),
  downstream: makeArch('downstream', 'x', -1),
};

// Half the clear width under an arch at a height (0 above the crown, the full radius at and below the centre).
function archHalfSpan(y) {
  const d = y - ARCH.centreY;
  if (d <= 0) return ARCH.radius;
  if (d >= ARCH.radius) return 0;
  return Math.sqrt(ARCH.radius * ARCH.radius - d * d);
}

// The decks. half: to the deck's own edge; halfGallery: to the gallery's outer side; thick: floor structure below
// the floor; above: how far the deck's rails, roofs and furniture stand over the floor (for the envelope).
const DECKS = [
  { name: 'deck1', floor: LEVELS.deck1, half: 35.3, halfGallery: 35.85, voidHalf: 14.5,
    galleryDrop: 1.2, galleryWidth: 2.6, arcades: 9, arcadeBay: 7.76, arcadeKey: 6.94,
    thick: 2.2,                                     // WORKING: the gallery's drop and 1 m of floor beams
    above: 6.94,                                    // WORKING: the arcades' 6.94 m to the key, counted from the deck floor
    mast: 8, flag: 3 },                             // masts between the arcades; flag length WORKING
  { name: 'deck2', floor: LEVELS.deck2, half: 18.95, halfGallery: 18.95, galleryWidth: 2.1, postStep: 3.3,
    thick: 2.0,                                     // WORKING: reaches the belt 1 m under the floor and its brackets
    above: 6.0 },                                   // WORKING: the gallery's roof, the tanks and the tents
  { name: 'deck3', floor: LEVELS.deck3, half: 8.25, halfGallery: 8.3, ceiling: 2.5,
    thick: 6.1,                                     // WORKING: the brackets that carry the glazed box out from the shaft
    above: LEVELS.terrace - LEVELS.deck3 + 2.5,     // the terrace over the box, its pavilion (2.27) and rail; 2.5 WORKING
    terraceHalf: 8.3, pavilionHalf: 5.25, pavilionHeight: 2.27 },
];

// The four pavilions of deck 1, each 23.3 by 15, centred on a face between the legs, as boxes (x0..x1, y0..y1, z0..z1).
// Depth from 16.3 to 31.3 (flush with the outline) and the walls' 8 m are WORKING; the roof light adds 2.65.
const PAVILION = { wide: 23.3, deep: 15, inner: 16.3, wall: 8, light: 2.65 };
function makePavilion(name, axis, sign, finish) {
  const a0 = PAVILION.inner, a1 = PAVILION.inner + PAVILION.deep, h = PAVILION.wide / 2;
  const lo = Math.min(sign * a0, sign * a1), hi = Math.max(sign * a0, sign * a1);
  const y0 = LEVELS.deck1, y1 = LEVELS.deck1 + PAVILION.wall + PAVILION.light;
  return axis === 'x' ? { name, finish, x0: lo, x1: hi, y0, y1, z0: -h, z1: h } : { name, finish, x0: -h, x1: h, y0, y1, z0: lo, z1: hi };
}
const PAVILIONS = [
  makePavilion('river', 'z', -1, 'timber'),
  makePavilion('upstream', 'x', 1, 'timber'),
  makePavilion('garden', 'z', 1, 'white'),
  makePavilion('downstream', 'x', -1, 'timber'),
];

// The crown of the tower as simple solids about the axis (radius, from y0 to y1).
const CROWN = {
  // two diagonal girders and, on them, two crossed half-round arches up to the lantern's floor
  campanile: { radius: 7.435, y0: 281, y1: LEVELS.lanternFloor, girderLength: 14.87, girderHeight: 4.5, archWidth: 1.3 },
  // ten-sided, glazed, under a cupola; radius is the table's half width at its floor, the service balcony with it
  lantern: { radius: 2.2, y0: LEVELS.lanternFloor, y1: LEVELS.top, sides: 10, height: 3.98, side: 0.8,
    glassRadius: 1.29, glassHeight: 1.14, cupolaRadius: 1.343, cupolaHeight: 2.18 },
  rod: { radius: 0.1, y0: LEVELS.top, y1: LEVELS.rodTop },           // radius WORKING
  flag: { length: 7.5, width: 4.5, y0: LEVELS.rodTop - 4.5, y1: LEVELS.rodTop },   // WORKING: hoisted to the rod's head, its 4.5 m
                                                                                    // down the rod; it flies any way the wind turns
};

// The lifts' lines as segments { a: [x, y, z], b: [x, y, z] }, each with the leg or shaft it runs in.
// A leg's lift runs up the inside of the leg's box, LIFT_INSET in from its inner corner on both axes (WORKING),
// so that a car's whole track lies inside the leg and the leg's clear air covers it.
const LIFT_INSET = 3.0;
function legLine(leg, yTop) {
  const s = LEG_SIGNS[leg], ys = [0];
  for (const row of OUTLINE) if (row[0] > 0 && row[0] < yTop) ys.push(row[0]);
  ys.push(yTop);
  // at the ground the iron's own line is produced down through the masonry, not widened to the footing
  const at = (y) => (y < 2.5 ? innerSide(2.5) + ARCH.lean * (2.5 - y) : innerSide(y)) + LIFT_INSET;
  const segs = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const p = at(ys[i]), q = at(ys[i + 1]);
    segs.push({ a: [s[0] * p, ys[i], s[1] * p], b: [s[0] * q, ys[i + 1], s[1] * q] });
  }
  return segs;
}
const EDOUX_X = 2.0;                                  // WORKING: the pair's cars stand 2 m either side of the axis
const midShaft = (LEVELS.deck2 + LEVELS.deck3) / 2;   // WORKING: the riders change cars half way up the shaft
const LIFTS = [
  { name: 'otis-north', maker: 'otis', leg: 'north', segments: legLine('north', LEVELS.deck2) },
  { name: 'otis-south', maker: 'otis', leg: 'south', segments: legLine('south', LEVELS.deck2) },
  { name: 'roux-east', maker: 'roux', leg: 'east', segments: legLine('east', LEVELS.deck1) },
  { name: 'roux-west', maker: 'roux', leg: 'west', segments: legLine('west', LEVELS.deck1) },
  // the pair above deck 2: one car serves the lower half of the shaft, the other the upper half. The pair hung on
  // one set of cables and moved as one, opposite ways, meeting half way (figures A: "moving opposite"): the two
  // keep one round (LIFT_PHASE), the upper car running it backward.
  { name: 'edoux-lower', maker: 'edoux', leg: null, segments: [{ a: [EDOUX_X, LEVELS.deck2, 0], b: [EDOUX_X, midShaft, 0] }] },
  { name: 'edoux-upper', maker: 'edoux', leg: null, segments: [{ a: [-EDOUX_X, midShaft, 0], b: [-EDOUX_X, LEVELS.deck3, 0] }] },
];

// ---------------------------------------------------------------------------------------------------------------
// THE SOLID ENVELOPE, for the clear-air proofs. The tower is cut into level slices; each slice is a box that holds
// everything the outline holds between its two heights (the widest outer, the least inner over the slice), so the
// union of boxes contains the tower as the outline gives it. The outline runs to the corner rafters' AXES and the
// decks' gallery sides: the built iron's bodies stand up to 0.7 m outside the boxes (a rafter's half breadth beyond
// its axis, the first deck's frieze), so a distance read from the envelope can be that much greater than the true
// one. Round things about the axis are upright cylinders. Kinds let a proof ask for iron apart from flags. Only the
// proofs read the envelope, so it is worked at the first reading and not while this file loads (about 3,000 boxes,
// some ten milliseconds).
const ENV_KINDS = ['footing', 'leg', 'arch', 'shaft', 'deck', 'pavilion', 'flags', 'campanile', 'lantern', 'rod', 'flag'];
const envBoxes = [];        // x0, x1, y0, y1, z0, z1, kind index: seven numbers a box
const envRounds = [];       // radius, y0, y1, kind index: four numbers a cylinder

function envBox(kind, x0, x1, y0, y1, z0, z1) {
  envBoxes.push(Math.min(x0, x1), Math.max(x0, x1), y0, y1, Math.min(z0, z1), Math.max(z0, z1), ENV_KINDS.indexOf(kind));
}

// The least and greatest of a piecewise-straight function of height over a slice: at its ends and at every table row inside.
function overSlice(fn, ya, yb) {
  let lo = Math.min(fn(ya), fn(yb)), hi = Math.max(fn(ya), fn(yb));
  for (const row of OUTLINE) if (row[0] > ya && row[0] < yb) { const v = fn(row[0]); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return [lo, hi];
}

function buildEnvelope() {
  const legs = Object.values(LEG_SIGNS);
  // the masonry footings: square by the table's ground row, to their own height
  for (const s of legs) envBox('footing', s[0] * OUTLINE[0][2], s[0] * OUTLINE[0][1], 0, STRUCTURE.footing.height, s[1] * OUTLINE[0][2], s[1] * OUTLINE[0][1]);
  // the four iron legs, in slices half a metre high, from the bearings (the footings hold all below) to deck 2
  for (let ya = LEVELS.bearings; ya < LEVELS.deck2; ya += 0.5) {
    const yb = Math.min(ya + 0.5, LEVELS.deck2);
    const outer = overSlice(halfOuter, ya, yb)[1], inner = overSlice(innerSide, ya, yb)[0];
    for (const s of legs) envBox('leg', s[0] * inner, s[0] * outer, ya, yb, s[1] * inner, s[1] * outer);
  }
  // the shaft above deck 2, a square prism in slices one metre high
  for (let ya = LEVELS.deck2; ya < LEVELS.top; ya += 1) {
    const yb = Math.min(ya + 1, LEVELS.top), h = overSlice(halfOuter, ya, yb)[1];
    envBox('shaft', -h, h, ya, yb, -h, h);
  }
  // the arches' grillwork: on each face everything between the two leaning planes, between the legs, from the
  // intrados up to deck 1, taken as solid. Slices are thin, and thinner still near the crown where the curve is flat.
  let ya = ARCH.centreY;
  while (ya < LEVELS.deck1) {
    const step = ya < ARCH.crownY - 1 || ya >= ARCH.crownY ? 0.25 : 0.05;
    const yb = Math.min(ya + step, ya < ARCH.crownY ? ARCH.crownY : LEVELS.deck1);
    const outer = overSlice(halfOuter, ya, yb)[1], sides = overSlice(innerSide, ya, yb);
    const inner = sides[0], reach = sides[1], open = archHalfSpan(yb);   // the opening's least half width in the slice
    for (const sign of [-1, 1]) {
      if (open > 0) for (const side of [-1, 1]) {
        envBox('arch', sign * inner, sign * outer, ya, yb, side * open, side * reach);   // faces across X
        envBox('arch', side * open, side * reach, ya, yb, sign * inner, sign * outer);   // faces across Z
      } else {
        envBox('arch', sign * inner, sign * outer, ya, yb, -reach, reach);
        envBox('arch', -reach, reach, ya, yb, sign * inner, sign * outer);
      }
    }
    ya = yb;
  }
  // the decks as slabs out to their galleries, with what stands on them; the central opening of deck 1 is not cut
  for (const d of DECKS) envBox('deck', -d.halfGallery, d.halfGallery, d.floor - d.thick, d.floor + d.above, -d.halfGallery, d.halfGallery);
  // the masts of deck 1 and the reach of their flags, whatever the wind
  const d1 = DECKS[0], reachOut = d1.halfGallery + d1.flag;
  envBox('flags', -reachOut, reachOut, d1.floor, d1.floor + d1.above + d1.mast, -reachOut, reachOut);
  for (const p of PAVILIONS) envBox('pavilion', p.x0, p.x1, p.y0, p.y1, p.z0, p.z1);
  // the crown: the rod and the flag's sweep read to 311 m, the height the summit is built to
  const head = Math.max(LEVELS.rodTop, 311);
  envRounds.push(CROWN.campanile.radius, CROWN.campanile.y0, CROWN.campanile.y1, ENV_KINDS.indexOf('campanile'));
  envRounds.push(CROWN.lantern.radius, CROWN.lantern.y0, CROWN.lantern.y1, ENV_KINDS.indexOf('lantern'));
  envRounds.push(CROWN.rod.radius, CROWN.rod.y0, head, ENV_KINDS.indexOf('rod'));
  envRounds.push(CROWN.flag.length, CROWN.flag.y0, head, ENV_KINDS.indexOf('flag'));
}
let ENV_B = null, ENV_R = null;                      // the boxes and the cylinders as flat arrays, once worked
function envelope() {
  if (!ENV_B) { buildEnvelope(); ENV_B = Float64Array.from(envBoxes); ENV_R = Float64Array.from(envRounds); }
  return ENV_B;
}

// The nearest part of the envelope to a point: { distance, kind }. Distance is 0 inside a solid. `only`, if given,
// is a list of kinds to read alone (as ['flags', 'flag'] or the iron's kinds).
function envelopeNearest(x, y, z, only) {
  let best = Infinity, kind = -1;
  envelope();
  const pick = only ? ENV_KINDS.map((k) => only.includes(k)) : null;
  for (let i = 0; i < ENV_B.length; i += 7) {
    if (pick && !pick[ENV_B[i + 6]]) continue;
    const dx = Math.max(ENV_B[i] - x, 0, x - ENV_B[i + 1]);
    const dy = Math.max(ENV_B[i + 2] - y, 0, y - ENV_B[i + 3]);
    const dz = Math.max(ENV_B[i + 4] - z, 0, z - ENV_B[i + 5]);
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < best) { best = d2; kind = ENV_B[i + 6]; }
  }
  const r = Math.hypot(x, z);
  for (let i = 0; i < ENV_R.length; i += 4) {
    if (pick && !pick[ENV_R[i + 3]]) continue;
    const dr = Math.max(r - ENV_R[i], 0), dy = Math.max(ENV_R[i + 1] - y, 0, y - ENV_R[i + 2]);
    const d2 = dr * dr + dy * dy;
    if (d2 < best) { best = d2; kind = ENV_R[i + 3]; }
  }
  return { distance: Math.sqrt(best), kind: ENV_KINDS[kind] };
}

// The least distance in metres from a point to the tower's solid envelope (up to 0.7 m more than to the built iron).
function envelopeDistance(x, y, z, only) { return envelopeNearest(x, y, z, only).distance; }

export const TOWER = {
  levels: LEVELS, outline: OUTLINE, legs: LEG_SIGNS, structure: STRUCTURE,
  halfOuter, legInner, innerSide, legWidth, legBox,
  arch: ARCH, arches: ARCHES, archHalfSpan,
  decks: DECKS, pavilions: PAVILIONS, crown: CROWN, lifts: LIFTS, liftInset: LIFT_INSET,
  envelopeKinds: ENV_KINDS, ironKinds: ['footing', 'leg', 'arch', 'shaft', 'deck', 'pavilion', 'campanile', 'lantern', 'rod'],
  get envelopeBoxCount() { return envelope().length / 7; },
  envelopeNearest, envelopeDistance,
};

// ---------------------------------------------------------------------------------------------------------------
// THE ROUTE. It is laid in plan as straights and circular arcs, given heights by a smooth curve through named
// stations, and sampled into knots; the kit's path is a centripetal Catmull-Rom through them. Every place is found
// from FRAME and TOWER; none is typed as a share of the flight.

const STEP = 0.5;                                     // metres between the laid line's points, in plan
const EASE = 20;                                      // metres either way over which the laid line is eased

// A line laid in plan from a place and a heading. The heading is the angle of (cos, sin) in (x, z): 0 is +X, 90 is +Z.
// A left turn lowers the angle and a right turn raises it (+X lies on the left hand of one facing +Z).
function makeLay(x0, z0, deg) {
  const xs = [x0], zs = [z0], ss = [0], marks = {};
  let x = x0, z = z0, a = deg * RAD, s = 0;
  const put = () => { xs.push(x); zs.push(z); ss.push(s); };
  const lay = {
    xs, zs, ss, marks,
    get x() { return x; }, get z() { return z; }, get s() { return s; }, get heading() { return a / RAD; },
    mark(name) { marks[name] = s; return lay; },
    straight(len) {
      const n = Math.max(1, Math.round(len / STEP)), d = len / n, cx = Math.cos(a), cz = Math.sin(a);
      for (let i = 0; i < n; i++) { x += cx * d; z += cz * d; s += d; put(); }
      return lay;
    },
    // a circular arc of this radius through this many degrees; turn +1 is a right turn, -1 a left turn
    arc(radius, degrees, turn) {
      const ox = x - Math.sin(a) * radius * turn, oz = z + Math.cos(a) * radius * turn;   // the arc's centre
      const len = radius * degrees * RAD, n = Math.max(1, Math.round(len / STEP)), da = turn * degrees * RAD / n;
      for (let i = 0; i < n; i++) {
        a += da;
        x = ox + Math.sin(a) * radius * turn; z = oz - Math.cos(a) * radius * turn; s += len / n; put();
      }
      return lay;
    },
  };
  return lay;
}

// A smooth height through stations [s, y] that never overshoots them (a monotone cubic): level where two
// neighbours are level and at every crest, so a climb eases in and out by itself.
function makeHeights(stations) {
  const n = stations.length, h = [], d = [], m = new Array(n).fill(0);
  for (let i = 0; i + 1 < n; i++) { h.push(stations[i + 1][0] - stations[i][0]); d.push((stations[i + 1][1] - stations[i][1]) / h[i]); }
  for (let i = 1; i + 1 < n; i++) {
    if (d[i - 1] * d[i] > 0) { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  // the stations as flat arrays, and the span the last reading fell in: a run of readings in rising order (the laid
  // line's four and a half thousand points) then finds each span from the one before instead of from the first
  const S = Float64Array.from(stations, (q) => q[0]), Y = Float64Array.from(stations, (q) => q[1]);
  let last = 0;
  return (s) => {
    if (s <= S[0]) return Y[0];
    if (s >= S[n - 1]) return Y[n - 1];
    let i = s > S[last] ? last : 0;
    while (s > S[i + 1]) i++;
    last = i;
    const t = (s - S[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h[i] * m[i]
      + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// The plan's few free figures; everything else follows from FRAME and TOWER.
const PLAN = {
  startX: 250, slant: 15, slantRadius: 300,          // the river leg: begins here, 15 degrees toward the tower's bank
  riverY: FRAME.waterY + 3.5,                        // 3.5 m over the water and 4 m under the bridge's crown
  quayRadius: 80, quayY: 24,                         // the second left turn of the quay (the first follows from it); the height there
  towerY: 22.5,                                      // under the tower: 13.5 m over the fountain group, 16.9 under the crowns
  enterX: -50,                                       // where the second quay turn ends on the tower's cross axis
  turnOutClear: 0.5, turnOutRadius: 70, turnOutDegrees: 190,   // the right turn out begins just clear of the upstream arch's face
  helixRadius: 80, helixCentre: [0, 0],              // the helix's last, tightest ring, about the tower's own axis
  sideY: [78, 160, 232, 305],                        // over the garden, downstream and river sides, and the crest. The ring gains
                                                     // no more than some 70 m a quarter turn inside the slope's limit, which sets
                                                     // the river and downstream sides from the crest down; the garden side is as
                                                     // low as keeps the line well over the upstream palace's corner on the way
  comeAboutRadius: 80, comeAboutZ: 338, comeAboutY: [165, 52],   // the come-about: radius, the z it ends at on the axis, heights in and out.
                                                     // It ends just beyond the great group's basin, as far out as the flight's
                                                     // length allows, and comes out low, so that from the axis the fountains lie
                                                     // in the picture at the tower's foot
  portal: { shape: 'arch', width: 26, height: 34 },
};

function layPlan() {
  const B = FRAME.bridge, zArch = B.archZ[3];        // the second arch from the tower's bank
  const sl = PLAN.slant * RAD, R0 = PLAN.slantRadius;
  // the river: a slanted straight, an easy right turn onto the arch's axis, a straight under the arch
  const runIn = 60;                                  // straight before the bridge's face
  const firstLen = (PLAN.startX - B.halfWidth - runIn - R0 * Math.sin(sl)) / Math.cos(sl);
  const z0 = zArch - R0 * (1 - Math.cos(sl)) - firstLen * Math.sin(sl);
  const lay = makeLay(PLAN.startX, z0, 180 - PLAN.slant);
  lay.mark('riverStart').straight(firstLen).mark('slantEnd').arc(R0, PLAN.slant, 1).mark('archAxis');
  lay.straight(runIn).mark('bridgeIn').straight(2 * B.halfWidth).mark('bridgeOut');
  // the quay: on downstream, a left turn to +Z, a short straight, a left turn to +X onto the tower's cross axis
  // The first turn begins EASE past the bridge's downstream face, so the eased line is still straight under the arch;
  // its radius is the one that brings the second turn's end to enterX (103 m with these figures).
  const Rq = PLAN.quayRadius, turnX = -B.halfWidth - EASE, Rfirst = Rq + turnX - PLAN.enterX;
  lay.straight(lay.x - turnX).mark('quayTurn').arc(Rfirst, 90, -1).mark('quayStraight');
  lay.straight(-Rq - lay.z).mark('towerTurn').arc(Rq, 90, -1).mark('crossAxis');
  // under the tower along its cross axis, in by the downstream arch and out by the upstream one
  const face = TOWER.halfOuter(PLAN.towerY);
  lay.straight(-face - lay.x).mark('towerIn').straight(face).mark('towerCentre').straight(face).mark('towerOut');
  lay.straight(PLAN.turnOutClear).mark('helixStart');
  // the helix: a right turn out, a wide arc that closes on the tower, then a ring about the tower's axis.
  // The wide arc's radius is the one that meets the ring tangent to it (two circles touching from inside).
  const Rt = PLAN.turnOutRadius, Rh = PLAN.helixRadius, qx = PLAN.helixCentre[0], qz = PLAN.helixCentre[1];
  const c1x = lay.x, c1z = lay.z + Rt;
  lay.arc(Rt, PLAN.turnOutDegrees, 1).mark('helixWide');
  const dx = (c1x - lay.x) / Rt, dz = (c1z - lay.z) / Rt, px = lay.x - qx, pz = lay.z - qz, pd = px * dx + pz * dz;
  const Rb = (Rh * Rh - px * px - pz * pz) / (2 * pd + 2 * Rh);
  const c2x = lay.x + dx * Rb, c2z = lay.z + dz * Rb;
  const turn = (to, from) => ((to - from) / RAD % 360 + 360) % 360;
  lay.arc(Rb, turn(Math.atan2(qz - c2z, qx - c2x), Math.atan2(lay.z - c2z, lay.x - c2x)), 1).mark('ring');
  // the ring is left on the straight that touches both it and the come-about's circle (both turn right), so the
  // fly-out drifts out from the tower's upstream side to the come-about, which ends on the axis heading -Z
  const Rc = PLAN.comeAboutRadius, ox = Rc - qx, oz = PLAN.comeAboutZ - qz, apart = Math.hypot(ox, oz);
  const leave = Math.atan2(oz, ox) + Math.asin((Rh - Rc) / apart);            // the straight's heading
  lay.arc(Rh, turn(leave, lay.heading * RAD), 1).mark('flyOut');
  lay.straight(Math.sqrt(apart * apart - (Rh - Rc) * (Rh - Rc))).mark('comeAboutStart');
  lay.arc(Rc, turn(270 * RAD, leave), 1).mark('comeAboutEnd');
  // The portal stands IN the garden-side arch: upright on the axis where its own head meets the leaning plane of the
  // arch's outer face, so all of it lies behind that plane, between the two garden-side footings, and from the axis
  // run its head stays under the arch's crown until the last metres.
  lay.portalZ = TOWER.halfOuter(PLAN.portal.height);
  lay.straight(lay.z - lay.portalZ - 60).mark('portalRun').straight(60).mark('end');
  lay.wideRadius = Rb; lay.quayFirstRadius = Rfirst;
  return lay;
}

// The first station at or after `from` where a test of the laid point holds.
function stationWhere(lay, from, test) {
  const ss = lay.ss, xs = lay.xs, zs = lay.zs, n = ss.length;
  let lo = 0, hi = n;                                // the first laid point at or after `from`, by halving (the stations rise)
  while (lo < hi) { const mid = (lo + hi) >> 1; if (ss[mid] < from) lo = mid + 1; else hi = mid; }
  for (let i = lo; i < n; i++) if (test(xs[i], zs[i])) return ss[i];
  return ss[n - 1];
}

// The laid line in space: the plan with its heights, as points [x, y, z] with the metres laid to each.
function layLine() {
  const lay = layPlan(), m = lay.marks, H = FRAME.quayHouses;
  // the four sides of the tower as the helix passes them: garden (+Z), downstream (-X), river (-Z); upstream is its top
  m.helixGarden = stationWhere(lay, m.helixStart, (x, z) => z > 0 && x <= 0);
  m.helixDownstream = stationWhere(lay, m.helixGarden, (x, z) => x < 0 && z <= 0);
  m.helixRiver = stationWhere(lay, m.helixDownstream, (x, z) => z < 0 && x >= 0);
  m.helixTop = stationWhere(lay, m.helixRiver, (x, z) => x > 0 && z >= 0);
  // the quay's height is reached 8 m before the river face of the quay houses and held to the second turn
  m.quayTop = stationWhere(lay, m.bridgeOut, (x, z) => z >= H.z0 - 8);
  // on the axis run the line is still 18 m over the main jet's top where it leaves that basin toward the tower
  const J = FRAME.mainJet;
  m.mainJet = stationWhere(lay, m.comeAboutEnd, (x, z) => z <= J.z - J.basinDiameter / 2);
  const crest = 40;                                  // the climb's crest lies this far past the upstream side
  // (the climb to the quay begins where the first quay turn does, EASE past the bridge's downstream face, so the eased
  // line is still level under the arch and has all the way from there to the quay houses to rise in)
  const portalY = PLAN.portal.height / 2;
  const height = makeHeights([
    [m.riverStart, PLAN.riverY], [m.quayTurn, PLAN.riverY], [m.quayTop, PLAN.quayY], [m.towerTurn, PLAN.quayY],
    [m.crossAxis, PLAN.towerY], [m.helixStart, PLAN.towerY],
    [m.helixGarden, PLAN.sideY[0]], [m.helixDownstream, PLAN.sideY[1]], [m.helixRiver, PLAN.sideY[2]],
    [m.helixTop, PLAN.sideY[3] - 5], [m.helixTop + crest, PLAN.sideY[3]],
    [m.comeAboutStart, PLAN.comeAboutY[0]], [m.comeAboutEnd, PLAN.comeAboutY[1]],
    [m.mainJet, J.jetHeight + 18], [m.portalRun - EASE - 2, portalY], [m.end, portalY],
  ]);
  // The line is eased before it is flown: each point is the mean of the laid points within EASE metres either way
  // (fewer near the two ends, always as many behind as ahead). A straight stays where it is; where a straight meets
  // an arc the curvature comes on over 2 * EASE metres instead of at once. The mean of an arc's points lies a little
  // inside it, so each arc is flown about one and a half percent tighter than laid (a radius of 80 m as 78.8).
  const n = lay.ss.length, pts = new Array(n), len = new Float64Array(n), reach = Math.round(EASE / STEP);
  const sx = new Float64Array(n + 1), sy = new Float64Array(n + 1), sz = new Float64Array(n + 1), xs = lay.xs, zs = lay.zs, ss = lay.ss;
  for (let i = 0; i < n; i++) { sx[i + 1] = sx[i] + xs[i]; sy[i + 1] = sy[i] + height(ss[i]); sz[i + 1] = sz[i] + zs[i]; }
  for (let i = 0, lx = 0, ly = 0, lz = 0; i < n; i++) {
    const h = Math.min(reach, i, n - 1 - i), w = 2 * h + 1;
    const x = (sx[i + h + 1] - sx[i - h]) / w, y = (sy[i + h + 1] - sy[i - h]) / w, z = (sz[i + h + 1] - sz[i - h]) / w;
    pts[i] = [x, y, z];
    if (i) len[i] = len[i - 1] + Math.hypot(x - lx, y - ly, z - lz);
    lx = x; ly = y; lz = z;
  }
  // a plan station as a place in space, and the metres laid to it along the eased line: the first laid point at or
  // past the station (the stations rise all the way), found by halving
  const index = (s) => {
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (ss[mid] < s - 1e-9) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const at = (s) => pts[index(s)], metresTo = (s) => len[index(s)];
  return { lay, marks: m, pts, len, length: len[n - 1], at, metresTo, portalZ: lay.portalZ };
}

// Knots from the laid line, evenly spaced along it (the first and the last are its ends).
function knotsFrom(line, spacing) {
  const count = Math.round(line.length / spacing), knots = [];
  let i = 0;
  for (let k = 0; k <= count; k++) {
    const d = line.length * k / count;
    while (i + 1 < line.pts.length && line.len[i + 1] <= d) i++;
    const j = Math.min(i + 1, line.pts.length - 1), f = j > i ? (d - line.len[i]) / (line.len[j] - line.len[i]) : 0;
    const a = line.pts[i], b = line.pts[j];
    knots.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
  }
  return knots;
}

// The kit's path through the knots, worked here by the same rule (a centripetal Catmull-Rom with the end knots
// mirrored) so that places can be counted in metres flown without the kit. Returns the curve as points every `step`
// metres along it: { x, y, z, length, step, count }. Each knot gap is walked in SPLINE_SUB chords (0.375 m each with
// knots 3 m apart: on the tightest arc a chord lies a quarter of a millimetre inside the curve), all in typed arrays
// with nothing made per point, because this is the heaviest step of laying the route.
const SPLINE_SUB = 8;
function splineThrough(knots, step) {
  const n = knots.length, sub = SPLINE_SUB, total = (n - 1) * sub + 1;
  const fx = new Float64Array(total), fy = new Float64Array(total), fz = new Float64Array(total), acc = new Float64Array(total);
  const ghost = (a, b) => [2 * a[0] - b[0], 2 * a[1] - b[1], 2 * a[2] - b[2]];
  const gap = (a, b) => Math.pow((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2, 0.25);
  const before = ghost(knots[0], knots[1]), after = ghost(knots[n - 1], knots[n - 2]);
  let d0 = 0, d1 = gap(before, knots[0]), d2 = gap(knots[0], knots[1]);   // each gap's measure is worked once and handed on
  let lx = 0, ly = 0, lz = 0, run = 0;                // the last point walked and the metres walked to it
  for (let i = 0, w = 0; i + 1 < n; i++) {
    const p1 = knots[i], p2 = knots[i + 1], p0 = i > 0 ? knots[i - 1] : before, p3 = i + 2 < n ? knots[i + 2] : after;
    d0 = d1; d1 = d2; d2 = gap(p2, p3);
    // the gap's cubic in each of x, y and z: the knot, the tangent there, and the two terms that bring it to the next knot
    const ax = p0[0], x0 = p1[0], bx = p2[0], cx = p3[0], ay = p0[1], y0 = p1[1], by = p2[1], cy = p3[1], az = p0[2], z0 = p1[2], bz = p2[2], cz = p3[2];
    const x1 = ((x0 - ax) / d0 - (bx - ax) / (d0 + d1) + (bx - x0) / d1) * d1, xt = ((bx - x0) / d1 - (cx - x0) / (d1 + d2) + (cx - bx) / d2) * d1;
    const y1 = ((y0 - ay) / d0 - (by - ay) / (d0 + d1) + (by - y0) / d1) * d1, yt = ((by - y0) / d1 - (cy - y0) / (d1 + d2) + (cy - by) / d2) * d1;
    const z1 = ((z0 - az) / d0 - (bz - az) / (d0 + d1) + (bz - z0) / d1) * d1, zt = ((bz - z0) / d1 - (cz - z0) / (d1 + d2) + (cz - bz) / d2) * d1;
    const x2 = -3 * x0 + 3 * bx - 2 * x1 - xt, x3 = 2 * x0 - 2 * bx + x1 + xt;
    const y2 = -3 * y0 + 3 * by - 2 * y1 - yt, y3 = 2 * y0 - 2 * by + y1 + yt;
    const z2 = -3 * z0 + 3 * bz - 2 * z1 - zt, z3 = 2 * z0 - 2 * bz + z1 + zt;
    for (let j = i ? 1 : 0; j <= sub; j++, w++) {
      const t = j / sub, qx = x0 + t * (x1 + t * (x2 + t * x3)), qy = y0 + t * (y1 + t * (y2 + t * y3)), qz = z0 + t * (z1 + t * (z2 + t * z3));
      if (w) { const dx = qx - lx, dy = qy - ly, dz = qz - lz; run += Math.sqrt(dx * dx + dy * dy + dz * dz); }
      fx[w] = lx = qx; fy[w] = ly = qy; fz[w] = lz = qz; acc[w] = run;
    }
  }
  const length = acc[total - 1], count = Math.ceil(length / step) + 1;
  const x = new Float64Array(count), y = new Float64Array(count), z = new Float64Array(count);
  for (let k = 0, i = 0; k < count; k++) {
    const d = Math.min(k * step, length);
    while (i + 2 < total && acc[i + 1] < d) i++;
    const f = (d - acc[i]) / (acc[i + 1] - acc[i]);
    x[k] = fx[i] + (fx[i + 1] - fx[i]) * f; y[k] = fy[i] + (fy[i + 1] - fy[i]) * f; z[k] = fz[i] + (fz[i + 1] - fz[i]) * f;
  }
  return { x, y, z, length, step, count };
}

// Metres flown at the curve's point nearest a place in space, sought within NEAR_REACH metres either way of `about`.
// The place is a point of the eased line and `about` the metres laid to it: the curve holds that line within
// millimetres and is as long within a metre, so its nearest point lies there, and a later pass of the line over the
// same ground (the helix over the cross axis) cannot be taken for it.
const NEAR_REACH = 25;
function metresAt(curve, p, about) {
  const x = curve.x, y = curve.y, z = curve.z, px = p[0], py = p[1], pz = p[2];
  const i0 = Math.max(0, Math.floor((about - NEAR_REACH) / curve.step)), i1 = Math.min(curve.count - 1, Math.ceil((about + NEAR_REACH) / curve.step));
  let best = Infinity, bi = i0;
  for (let i = i0; i <= i1; i++) {
    const dx = x[i] - px, dy = y[i] - py, dz = z[i] - pz, d = dx * dx + dy * dy + dz * dz;
    if (d < best) { best = d; bi = i; }
  }
  return Math.min(bi * curve.step, curve.length);
}

const KNOT_SPACING = 3;                               // metres between knots. The spline's curvature ripples from knot to knot; at 3 m
                                                      // the tightest arc is flown within a hundredth of its own radius, and the spline
                                                      // holds the eased line within millimetres
const AXIS_NEAR = 5;                                  // metres from the garden axis that count as on it for the whole-tower stretch
const FIT_DEGREES = 58;                               // the tower counts as whole in a picture 62 degrees high with 2 degrees to spare at foot and head

// The eased laid line, worked once. layRouteLine() works it alone, so that a world may give it a step of its own
// before layRoute() takes it up (it is near half of the laying).
let laidLine = null;
export function layRouteLine() { if (!laidLine) laidLine = layLine(); }

function buildRoute() {
  layRouteLine();
  const line = laidLine, m = line.marks;
  const knots = knotsFrom(line, KNOT_SPACING);
  const curve = splineThrough(knots, STEP), L = curve.length;
  // the route's own point at a share of the flight, from the curve worked above (never the lens)
  const pointAt = (u, out = [0, 0, 0]) => {
    const d = Math.min(Math.max(u, 0), 1) * L / curve.step, i = Math.min(curve.count - 2, Math.floor(d)), f = Math.min(1, d - i);
    out[0] = curve.x[i] + (curve.x[i + 1] - curve.x[i]) * f;
    out[1] = curve.y[i] + (curve.y[i + 1] - curve.y[i]) * f;
    out[2] = curve.z[i] + (curve.z[i + 1] - curve.z[i]) * f;
    return out;
  };
  // the places, in metres flown, each found where the laid line's own station lies on the curve
  const places = {};
  for (const name of ['riverStart', 'slantEnd', 'bridgeIn', 'bridgeOut', 'quayTop', 'towerCentre', 'helixStart', 'helixWide', 'helixGarden',
    'helixDownstream', 'helixRiver', 'helixTop', 'comeAboutStart', 'comeAboutEnd', 'portalRun']) places[name] = metresAt(curve, line.at(m[name]), line.metresTo(m[name]));
  places.riverStart = 0; places.end = L;
  // in and out of the tower: where the line crosses the outer faces of the downstream and upstream arches at its height
  const face = TOWER.halfOuter(PLAN.towerY);
  places.towerIn = places.towerCentre - face; places.towerOut = places.towerCentre + face;
  // the stretch of the axis run (with the come-about's last metres, once within AXIS_NEAR of the axis) from which the
  // tower is whole: the angle from its garden foot to its rod's head fits the picture
  const foot = [0, 0, TOWER.halfOuter(0)], head = [0, LEVELS.rodTop, 0];
  let from = -1, to = -1;
  const p = [0, 0, 0];
  for (let d = places.comeAboutStart; d <= L; d += curve.step) {
    pointAt(d / L, p);
    if (Math.abs(p[0]) > AXIS_NEAR) continue;
    const a = [foot[0] - p[0], foot[1] - p[1], foot[2] - p[2]], b = [head[0] - p[0], head[1] - p[1], head[2] - p[2]];
    const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]));
    if (Math.acos(cos) / RAD <= FIT_DEGREES) { if (from < 0) from = d; to = d; }
  }
  places.axisWholeFrom = from; places.axisWholeTo = to;
  return { line, knots, curve, length: L, pointAt, places };
}

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// The pace along the flight: 1.1 on the river, then a list of eases [from, to, pace after], in metres flown between
// places. The engine scales the whole so that the flight lasts its duration (by a little over a quarter with these
// figures), and each turn's figure is the one that, so scaled, keeps the turn under 30 degrees a second with a degree
// to spare: the turn out of the tower (the tightest) slowest, then the quay's turns and the come-about, then the
// helix's ring. The line slows before the bridge and is slowest of the quay while it climbs, so that the pull up, the
// levelling and the turn together swing its direction no quicker than a turn alone may. The helix's wide arc, half
// as far again from the tower as the ring, is flown quicker, so the line turns about the tower at about one rate all
// the way up. The straights pay for the turns: most of all the fly-out, high over the garden where speed is least
// felt (it gathers pace only past the crest, where the line noses over); the run to the portal is flown a little
// slower than the river.
const PACE = { river: 1.1, quayClimb: 0.6, quay: 0.625, turnOut: 0.549, helixWide: 1.05, helixRing: 0.708, flyOut: 1.5, comeAbout: 0.641, last: 1.0 };
function makePace(P, L) {
  const eases = [
    [P.bridgeIn - 45, P.bridgeOut + 45, PACE.quayClimb],                    // slowing before and under the arch, before the pull up
    [P.quayTop + 10, P.quayTop + 70, PACE.quay],                            // level over the quay houses
    [P.towerCentre, P.helixStart, PACE.turnOut],
    [P.helixWide - 10, P.helixWide + 60, PACE.helixWide],
    [P.helixDownstream - 90, P.helixDownstream - 10, PACE.helixRing],       // the ring begins over the downstream side
    [P.helixTop, P.helixTop + 110, PACE.flyOut],                            // off the ring, over the helix's top and its crest
    [P.comeAboutStart - 100, P.comeAboutStart, PACE.comeAbout],
    [P.comeAboutEnd - 10, P.comeAboutEnd + 80, PACE.last],                  // out of the come-about, then one pace to the portal
  ];
  return (u) => {
    const d = Math.min(1, Math.max(0, u)) * L;
    let v = PACE.river;
    for (const e of eases) v += (e[2] - v) * smooth(e[0], e[1], d);
    return v;
  };
}

// THE LOOKS. A look is a point the gaze is drawn to inside a window of metres flown. Each of these is a function of u
// alone: it finds the route's own point there (never the lens), works a DIRECTION for the gaze from that point and the
// named things of FRAME and TOWER, and gives back the point AIM_FAR metres along it. Each has its whole weight, so
// the gaze lies on the direction it works; where a look comes on or lets go it turns that direction itself from or
// to the route's own gaze (the eye's line to the route's point the camera's lookAhead on), evenly BY THE PLANNED CLOCK and not
// by metres, so that a swing is no quicker where the line is flown fast. Every window is written in metres flown
// between ROUTE.places; every angle below is a figure of the picture (a side of the middle, a row), not of a place.
// INVENTED BY NEED, all of them: where the gaze goes is no thing of 1889 (the head lists the looks so).
const PICTURE_HALF = 31 * RAD;                        // half the picture's height (the engine's field is 62 degrees)
const AIM_FAR = 400;                                  // metres from the eye at which a look's point stands along its direction
const OPENING = 0.04;                                 // THE ENGINE'S OWN: it lets any look in by degrees over the flight's first twenty-fifth
                                                      // (src/core/engine.js, the looks' guard). No figure of this route: the river's
                                                      // look must know the engine's ramp to work against it, and a part may not read the engine
const WINDOW_RAMP = 20;                               // metres over which the engine brings a look's window in and out. A window
                                                      // ends that far past the stretch its look works (the look's direction is the
                                                      // route's own there, so the fall changes nothing) but BEGINS with the stretch:
                                                      // begun sooner, it would pull the gaze to the route's own while the look
                                                      // before it is still letting go, and quicken that swing (the look under the
                                                      // tower begins a ramp sooner: the quay's has let go by then; so does the
                                                      // helix's: over that ramp its direction is the lift's own)
const GLIDE_EASE = 0.25;                              // the share of a swing spent gathering its rate, and again losing it
const VOID_FROM = 10;                                 // metres before the tower's near arch's face at which the lift under the tower
                                                      // begins (the quay's look must have let go a window's ramp before it)

// A direction from a heading and a pitch (radians; heading 0 is +X, a quarter turn is +Z), and back.
const dirOf = (h, p) => [Math.cos(p) * Math.cos(h), Math.sin(p), Math.cos(p) * Math.sin(h)];
const headingOf = (v) => Math.atan2(v[2], v[0]), pitchOf = (v) => Math.asin(Math.min(1, Math.max(-1, v[1])));
// A direction turned toward another by a share t of the way, in heading (the shorter way round) and in pitch each
// (t over 1 carries it on past the second by as much). Between two downward directions the gaze so turned never
// dips under the lower of them, as the straightest swing between the two would.
function turnToward(a, b, t) {
  const ha = headingOf(a), pa = pitchOf(a);
  let dh = headingOf(b) - ha;
  dh -= 2 * Math.PI * Math.round(dh / (2 * Math.PI));
  return dirOf(ha + dh * t, pa + (pitchOf(b) - pa) * t);
}
// A swing's share done at a share t of its time: its rate gathers over GLIDE_EASE, is then even, and is lost over
// GLIDE_EASE, so that its quickest is a third over its mean (a plain ease would be half over).
function glideShare(t) {
  const e = GLIDE_EASE, k = 1 / (2 * e * (1 - e));
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < e ? k * t * t : t > 1 - e ? 1 - k * (1 - t) * (1 - t) : (t - e / 2) / (1 - e);
}

// What every look works from, made once: the route's point and the route's own gaze at metres flown, the planned
// clock, and the tower's axis as seen from a point.
function makeGazeTools(B) {
  const L = B.length, pace = makePace(B.places, L), ahead = ROUTE.camera.lookAhead;
  // the planned clock at metres flown (in the pace's own unit: only shares of it are used), summed every two metres
  const n = Math.ceil(L / 2), step = L / n, clock = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) clock[i + 1] = clock[i] + step / pace((i + 0.5) / n);
  const clockAt = (d) => { const x = Math.min(n, Math.max(0, d / step)), i = Math.min(n - 1, Math.floor(x)); return clock[i] + (clock[i + 1] - clock[i]) * (x - i); };
  const a = [0, 0, 0];
  return {
    metres: (u) => Math.min(1, Math.max(0, u)) * L,
    eyeAt: (d, out) => B.pointAt(d / L, out),
    // the route's own gaze at d: from its point there to its point lookAhead on (as the engine aims an eye no look draws)
    ownAt(d, eye) {
      B.pointAt((d + ahead) / L, a);
      const x = a[0] - eye[0], y = a[1] - eye[1], z = a[2] - eye[2], len = Math.hypot(x, y, z) || 1;
      return [x / len, y / len, z / len];
    },
    // the planned clock at metres flown (only its shares are used: between places, or of the whole flight's)
    clock: clockAt,
    // the share of the clock gone at d between metres `from` and metres `to`, and the share of a swing done there
    // when it runs between the two evenly by the clock
    share: (from, to, d) => Math.min(1, Math.max(0, (clockAt(d) - clockAt(from)) / (clockAt(to) - clockAt(from)))),
    glide: (from, to, d) => glideShare((clockAt(d) - clockAt(from)) / (clockAt(to) - clockAt(from))),
    // the heading from a point to the tower's axis
    bearing: (eye) => Math.atan2(-eye[2], -eye[0]),
    // the pitch that sets a level of that axis on a row of the picture (row 0 its middle, 1 its top edge) when the
    // gaze stands `side` beside the axis
    pitchTo: (eye, level, row, side = 0) => Math.atan2(level - eye[1], Math.hypot(eye[0], eye[2]) * Math.cos(side)) - Math.atan(row * Math.tan(PICTURE_HALF)),
    // the look's point: AIM_FAR along a direction from the eye
    point: (eye, v, out) => { const x = eye[0] + v[0] * AIM_FAR, y = eye[1] + v[1] * AIM_FAR, z = eye[2] + v[2] * AIM_FAR; return out ? out.set(x, y, z) : [x, y, z]; },
  };
}

// THE RIVER'S LOOK, two pictures and one swing between them. FIRST the tower whole in the picture's left part, the
// river and the bridge under it, for as long as the river keeps a good share of the picture under it (nearer, the
// gaze would have to rise so far for the rod's head that the water is lost and the tower leans at the picture's
// side). The gaze stands RIVER.side to the right of the tower's axis (so the axis stands well left
// of the middle and the whole foot stays inside the left edge) and is lifted until the rod's head lies on row
// RIVER.head, just under the top edge; both follow the eye, so the tower stays whole as it nears and grows. At the
// first metre the engine gives no look any weight (the first picture is the route's own level gaze, the tower cut
// by the top edge), and it lets a look in over OPENING of the flight; the gaze is brought up from the route's own
// SOONER than that, over the first `rise` metres, by setting the point as much further round the turn (along the
// great circle from the route's gaze through this look's) as makes the gaze lie where this look wants it. `rise` is
// the least length at which the point never has to stand more than RIVER.reach round from the route's gaze (near
// the half turn the engine's turn has no sure side); it is worked from the route's first metre, not typed.
// THEN, between RIVER.letGo[0] and RIVER.letGo[1] metres past slantEnd (where the line straightens for the bridge),
// the gaze swings down and to the right in one move, level, onto the stretch's SECOND picture: the stone bridge
// across the whole width with its lamps and their long streaks on the water, the steamers, the far bank and the
// afterglow on the right. It stands RIVER.far to the right of the route's heading there (the far bank has the
// wider part, the near quay's wall is left out) and level, so the horizon is level and in the middle; between
// RIVER.arch[0] and RIVER.arch[1] metres before the bridge's face it comes onto the route's own, through the arch.
// `under` is how far inside the arch the look's window is held.
const RIVER = { side: 23 * RAD, head: 0.93, reach: 150 * RAD, letGo: [0, 100], far: 14 * RAD, arch: [70, 6], under: 2 };
// A direction swung from a toward b along the great circle through both, by a share t of the angle between them
// (t over 1 carries it on past b by as much): the way the engine turns a gaze toward a look's point.
function swingToward(a, b, t) {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), ang = Math.acos(dot);
  const n = [b[0] - a[0] * dot, b[1] - a[1] * dot, b[2] - a[2] * dot], len = Math.hypot(n[0], n[1], n[2]);
  if (len < 1e-9) return b;
  const c = Math.cos(ang * t), k = Math.sin(ang * t) / len;
  return [a[0] * c + n[0] * k, a[1] * c + n[1] * k, a[2] * c + n[2] * k];
}
function makeRiverGaze(B, G) {
  const P = B.places, eye = [0, 0, 0];
  const wantAt = (d) => { G.eyeAt(d, eye); return dirOf(G.bearing(eye) + RIVER.side, G.pitchTo(eye, LEVELS.rodTop, RIVER.head, RIVER.side)); };
  // the turn wanted at the first metre, and from it the rise's length: the two rises' ratio there, (OPENING's
  // metres / rise) squared, times that turn is RIVER.reach
  const first = wantAt(0), own0 = G.ownAt(0, eye);
  const turn = Math.acos(Math.min(1, first[0] * own0[0] + first[1] * own0[1] + first[2] * own0[2]));
  const lead = Math.max(1, RIVER.reach / Math.max(turn, 1e-6)), rise = OPENING * B.length / Math.sqrt(lead);
  return (time, u, out) => {
    const d = G.metres(u), want = wantAt(d), own = G.ownAt(d, eye);
    const bridge = dirOf(headingOf(own) + RIVER.far * (1 - G.glide(P.bridgeIn - RIVER.arch[0], P.bridgeIn - RIVER.arch[1], d)), pitchOf(own));
    const v = turnToward(want, bridge, G.glide(P.slantEnd + RIVER.letGo[0], P.slantEnd + RIVER.letGo[1], d));
    const given = smooth(0, OPENING, u), wanted = smooth(0, rise, d);   // the weight the engine gives so far; the weight wanted
    return G.point(eye, swingToward(own, v, given > 1e-6 ? Math.min(lead, wanted / given) : lead), out);
  };
}

// THE QUAY'S LOOK: from the bridge's far face the gaze is brought round to the tower and kept on it through both
// turns: its arches and first deck come from the left into the middle of the picture while the line climbs over the
// quay houses, with the houses, the lamps and the walkers under them. The gaze stands QUAY.side to the right of the
// tower's axis at the bridge and on it from the quay's height on; its pitch is QUAY.pitch at the bridge (from the
// water the houses hide the tower's foot: the gaze rests on what rises over their roofs), QUAY.pitchTop at the
// quay's height (the horizon just under the middle: the lower half is the quay, never the sky) and level by
// QUAY.clear[0] metres before the tower's face. Between there and QUAY.clear[1] metres before the face it is let
// go to the route's own, along the cross axis through the two arches (the two nearly agree there already).
const QUAY = { side: 12 * RAD, pitch: 9 * RAD, pitchTop: 3 * RAD, swing: [-12, 86], clear: [70, VOID_FROM + WINDOW_RAMP] };
function makeQuayGaze(B, G) {
  const P = B.places, eye = [0, 0, 0];
  const side = makeHeights([[P.bridgeOut, QUAY.side], [P.quayTop, 0]]);
  const pitch = makeHeights([[P.bridgeOut, QUAY.pitch], [P.quayTop, QUAY.pitchTop], [P.towerIn - QUAY.clear[0], 0]]);
  return (time, u, out) => {
    const d = G.metres(u);
    G.eyeAt(d, eye);
    const own = G.ownAt(d, eye), want = dirOf(G.bearing(eye) + side(d), pitch(d));
    const on = G.glide(P.bridgeOut + QUAY.swing[0], P.bridgeOut + QUAY.swing[1], d) * (1 - G.glide(P.towerIn - QUAY.clear[0], P.towerIn - QUAY.clear[1], d));
    return G.point(eye, turnToward(own, want, on), out);
  };
}

// UNDER THE TOWER: the first deck's floor is a great square opening 35 m over the line, the iron going up through
// it into the dark. The gaze is lifted from the route's own by VOID.lift, most at VOID.peak metres before the
// tower's middle (the opening then stands ahead and above), and is brought down again onto the far arch, level
// VOID.level metres past the middle: by then the helix's look has begun to turn the gaze back to the tower, and
// the two moves run into one. The lift begins VOID.from metres before the near arch's face and
// not sooner: up to there the picture is the arch itself and the fountain through it. It rises and falls evenly by
// the clock as one swell; no roll comes of it (the camera's bank is the route's alone).
const VOID = { lift: 40 * RAD, from: VOID_FROM, peak: 14, level: 24 };
// the lift at metres flown: up to VOID.peak metres before the tower's middle, down again by VOID.level metres past it
function voidLift(P, G, d) {
  const half = Math.PI / 2, top = P.towerCentre - VOID.peak;
  const up = d < top ? Math.sin(half * G.share(P.towerIn - VOID.from, top, d)) : Math.cos(half * G.share(top, P.towerCentre + VOID.level, d));
  return VOID.lift * up * up;
}
function makeVoidGaze(B, G) {
  const P = B.places, eye = [0, 0, 0];
  return (time, u, out) => {
    const d = G.metres(u);
    G.eyeAt(d, eye);
    const own = G.ownAt(d, eye);
    return G.point(eye, dirOf(headingOf(own), pitchOf(own) + voidLift(P, G, d)), out);
  };
}

// THE HELIX'S LOOK, and the fly-out's and the come-about's after it: one function. Round the tower's base it sets
// the gaze a set angle beside the tower's axis (the side, inside the picture's inner 40 percent) and a named level
// of the tower on a named row of the picture; higher, where the tower so near is bare lattice, it rests on the
// evening's river side and comes back to the tower at its head:
//   THE TURN ONTO THE TOWER. The line leaves by the upstream arch with the tower straight behind it. The gaze is
//     turned to the right, back to the tower, from HELIX.turn[0] metres past the tower's middle (the lift under the
//     tower still coming down in it) to HELIX.turn[1] metres past helixStart, evenly by the clock and as quickly as
//     a gaze may turn: it passes the upstream palace, the garden's far end with the dome and the lit hall, and the
//     east leg close by (the gaze rises by HELIX.turnLift there, so the first deck's corner with its flags stands
//     over the leg, not a cut leg alone), and comes to rest on the TOWER'S BASE, its axis in the picture's middle: the first deck
//     with its flags and lit arcade on row HELIX.deck1Row, the great arches with their cordons and the fountain
//     under it, both near legs whole, the second deck under the top edge;
//   as the line comes round to the garden side the gaze drifts to HELIX.side[0] AHEAD of the axis along the turn
//     (the tower in the picture's right third; the river, the far palace and the afterglow open on its left), the
//     roofs of the first deck's pavilions on the middle row over the garden side, from above, and the second deck
//     comes down the picture's right part as the line climbs toward the downstream side;
//   THE PANORAMA. Between the second deck and the third, 160 m apart, the tower stands square to the side and so
//     near that nothing of it is in reach of a level gaze but bare lattice. So the gaze, which has turned with the
//     tower as the line rounds it, STOPS where that turn has brought it to the far palace across the river
//     (PAN.beside to the right of its rotunda, FRAME.trocadero: a fixed place of the world, so the gaze rests
//     while the body turns) and stays there, HELIX.topDown under level (the horizon level, six tenths up the
//     picture): the tower slides out of the picture on the right by the line's own turn, and the picture is the
//     evening's river side from high up: the afterglow's sky, the palace on its hill with its cascade under it,
//     the far bank, the river with the bridge, its lamps and the boats below. No window is typed for the stop:
//     it falls where the route itself brings the two headings together, and it is rounded over PAN.round, so the
//     gaze slows into its rest and never swings back;
//   THE PAN TO THE TOWER'S HEAD. About PAN.from metres past the downstream side (the corner is rounded over
//     PAN.round, so the gaze first stirs PAN.round / PAN.rate seconds sooner) the gaze leaves the palace in
//     ONE pan to the LEFT, PAN.rate degrees a second by the clock, toward the tower, which the line's turn
//     brings round from behind on that side: the palace and its garden pass out on the right, then the river's
//     lower reach and the lit city down the stream pass under the horizon. Over the pan's second half the gaze
//     rises until the rod's head lies on row HELIX.rodRow, so the tower's head comes in from the left WHOLE:
//     the third deck, the campanile, the lantern with its beacon, the flag. The pan ends where the route
//     brings it together with the gaze that keeps the tower HELIX.side[1] beside its axis (found on the route:
//     no window is typed for it; the corner is rounded over PAN.round), and from there the gaze is carried
//     round with the tower, its head in the picture's left third with the upper shaft running up to it, the
//     lower river and then the afterglow on its right. The head is held on that row while the line climbs, so
//     the gaze comes down by itself;
//   ON THE LANTERN. Where that pitch has fallen to HELIX.topDown under level it rests there (eased over
//     HELIX.settle) to the helix's top: the tower's head, from the third deck's floor to the rod's head, a third
//     of the picture's height and more, the lantern against the lit city just under the horizon, the flag in the
//     sky, the city and the river with more of the picture than the sky.
// Rows are of the picture's half height: 0 the middle, 1 the top edge.
const HELIX = {
  turn: [10, 118],                                    // the turn onto the tower: from so far past the tower's middle to so far past helixStart
  turnLift: 9 * RAD,                                  // the gaze's rise in that turn, most where the east leg passes close by
  side: [17 * RAD, -18.5 * RAD],                      // beside the axis: ahead of it, round the base; behind it, where the pan meets the tower and at the top
  drift: 20,                                          // metres before helixWide by which the gaze stands side[0] ahead of the axis
  deck1Row: 0.2,                                      // the first deck's floor on the turn out: over the middle, the arch under it
  roofsRow: 0,                                        // the roofs of the first deck's pavilions over the garden side
  topDown: 8 * RAD,                                   // the gaze's rest on the panorama and at the top: so far under level (the horizon six tenths up the picture)
  rodRow: 0.9,                                        // the pan to the head: the rod's head is held on this row until the gaze has come down to its rest
  settle: 3 * RAD,                                    // the breadth of the easing by which the falling gaze comes to that rest
};
const PAN = {
  beside: 10 * RAD,                                   // the rest: so far to the right of the far palace's rotunda (the palace left of the middle, the river's reach leading right)
  from: 60,                                           // the pan to the tower's head begins so far past the downstream side
  rate: 40 * RAD,                                     // and turns to the left so much a second of the planned clock
  round: 20 * RAD,                                    // the breadth over which the stop and the pan's two ends are rounded
};
// OUT FROM THE TOP the same function carries the gaze on: A PULL-BACK. From the fly-out all that
// is worth seeing lies behind the line (the tower, the river, the afterglow), so the gaze STAYS ON THE TOWER,
// turned back over the line's right shoulder, while the line leaves the top and sinks down the garden:
//   1. from the helix's top, over FLY.lower metres, the aim is lowered down the tower until the rod's head lies
//      on row FLY.headRow, and it is held there (over the same metres the gaze crosses from HELIX.side[1]
//      behind the tower's axis to FLY.side ahead of it, so the tower moves from the picture's left third to
//      its middle): the lantern draws away, the tower's top is never cut, and as
//      the tower recedes its decks, its arches and at last its feet rise into the picture from below. From
//      where it fits (the middle of its foot from some 250 m off, its near feet from
//      some 330) it stands WHOLE and upright in the picture's middle third, the gaze FLY.side beside its axis:
//      the river, the far palace and the afterglow behind it on its right, the isle's fireworks on its left,
//      the garden under it: the whole evening in one picture, from above and afar (the axis run's picture is
//      the tower from low and in front);
//   2. then, between FLY.toGarden metres about the come-about's start (it is held until the line slows for the
//      turn: the tower is whole to its near feet only there), ONE swing forward and down to the garden SQUARE
//      ACROSS ITS AXIS (ACROSS: a fixed heading of the world, so the gaze rests while the line turns in under
//      it), FLY.down under level: the court at the garden's far end, the gold central dome on the left, the
//      three basins with their coloured jets on the right, the downstream palace's blue dome over them and the
//      isle's fireworks over that; the tower is out of the picture;
//   3. from there the gaze is LED ROUND BY THE LINE'S OWN TURN, FLY.lead inside the route's heading from where
//      that has come round to it, and rising, until it lies on the downstream palace's blue dome across the
//      garden: the fountains under it, the fireworks over it, the tower coming in at the picture's right side
//      behind it, where the axis run's look takes it up.
// The gaze on the dome is no steeper down than FLY.floor, and no gaze here lies straight down on a roof.
const FLY = {
  lower: [0, 190],                                    // the aim lowered down the tower: metres past the helix's top
  headRow: 0.92,                                      // the rod's head on this row from there on: the top never cut, the feet rising into the picture
  side: 6 * RAD,                                      // the gaze beside the axis in the whole picture: a little ahead of it, so the isle's fireworks stand inside the left edge
  toGarden: [-30, 50],                                // the swing to the come-about's first picture: metres about the come-about's start
  down: 18 * RAD,                                     // the gaze across the garden lies so far under level (the horizon in the picture's upper quarter, the basins under its middle)
  lead: 15 * RAD,                                     // led round the turn, the gaze stands so far inside the route's own heading
  round: 10 * RAD,                                    // the breadth over which that gaze's two corners (leaving its rest, coming onto the dome) are rounded
  floor: 24 * RAD,                                    // the gaze on the palace's dome lies no steeper down than this
};
const FAR_PALACE = [0, (FRAME.trocadero.rotunda.z0 + FRAME.trocadero.rotunda.z1) / 2];   // the far palace's rotunda in plan: x, z
const PALACE_AIM = [-FRAME.palaces.dome.x, FRAME.palaces.dome.height, FRAME.palaces.dome.z];
const ACROSS = Math.PI;                               // the heading square across the garden's axis, from its upstream side to its downstream side (toward -X)
// The lesser of two angles with the corner where they cross rounded over k (within k of each other the two are
// blended; further apart it is the lesser exactly), and the greater likewise.
const roundMin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
const roundMax = (a, b, k) => -roundMin(-a, -b, k);
// An angle brought to within half a turn of another.
const nearTo = (a, c) => a - 2 * Math.PI * Math.round((a - c) / (2 * Math.PI));
function makeTowerGaze(B, G) {
  const P = B.places, eye = [0, 0, 0], at = (d) => B.pointAt(d / B.length), mid = (a, b) => (a + b) / 2;
  const roofs = PAVILIONS[0].y1;
  const half = mid(P.helixStart, P.helixGarden);
  const turnFrom = P.towerCentre + HELIX.turn[0], turnTo = Math.min(P.helixStart + HELIX.turn[1], half - 1);   // (the turn's end is a station of the pitch below and stands before the next)
  // THE REST'S HEADING from a point of the route (toward the far palace, PAN.beside to its right), and how far
  // round to the right of it the gaze stands that keeps the tower `s` beside its middle (near `about`: the tower's
  // bearing goes once round while the line climbs)
  const restAt = (e) => Math.atan2(FAR_PALACE[1] - e[2], FAR_PALACE[0] - e[0]) + PAN.beside;
  const lead = (e, s, about) => nearTo(G.bearing(e) - s - restAt(e), about);
  // the stop: the metres at which the gaze that follows the tower has come round to the rest's heading, sought on
  // the route from the garden side; its rounding is no broader than that gaze stands short of the rest there
  const roundStop = Math.min(PAN.round, Math.max(1e-3, -lead(at(P.helixGarden), HELIX.side[0], 0)));
  let leave = P.helixGarden, stop;                   // (leave: where the rounding begins and the gaze first falls behind the tower)
  while (leave < P.helixDownstream && lead(at(leave), HELIX.side[0], 0) < -roundStop) leave += 1;
  for (stop = leave; stop < P.helixDownstream && lead(at(stop), HELIX.side[0], 0) < 0;) stop += 1;
  const lowerFrom = P.helixTop + FLY.lower[0], lowerTo = P.helixTop + FLY.lower[1];
  // the pan to the tower's head: its turn to the left at metres flown (PAN.rate by the planned clock's seconds,
  // counted from its beginning), and where it meets the gaze that follows the tower (sought on the route)
  const panFrom = P.helixDownstream + PAN.from, perSecond = ROUTE.duration / G.clock(B.length);
  const panAt = (d) => -PAN.rate * (G.clock(d) - G.clock(panFrom)) * perSecond;
  let panTo = panFrom;
  while (panTo < P.helixTop - 1 && panAt(panTo) > lead(at(panTo), HELIX.side[1], -Math.PI)) panTo += 1;
  // the gaze's place beside the tower's axis from the pan on: behind it to the helix's top, and over to the
  // pull-back's side past the top
  const besideAt = (d) => HELIX.side[1] + (FLY.side - HELIX.side[1]) * G.glide(lowerFrom, lowerTo, d);
  const side = makeHeights([[turnTo, 0], [Math.max(P.helixWide - HELIX.drift, turnTo + 1), HELIX.side[0]]]);
  const low = makeHeights([
    [turnTo, G.pitchTo(at(turnTo), LEVELS.deck1, HELIX.deck1Row)], [half, G.pitchTo(at(half), LEVELS.deck1, HELIX.deck1Row)],
    [P.helixGarden, G.pitchTo(at(P.helixGarden), roofs, HELIX.roofsRow)], [Math.max(stop, P.helixGarden + 1), -HELIX.topDown],
  ]);
  // the direction from the eye to a thing, no steeper down than a floor
  const toward = (p, floor) => { const x = p[0] - eye[0], y = p[1] - eye[1], z = p[2] - eye[2]; return dirOf(Math.atan2(z, x), Math.max(-floor, Math.atan2(y, Math.hypot(x, z)))); };
  const gaze = (time, u, out) => {
    const d = G.metres(u);
    G.eyeAt(d, eye);
    let p = low(d), v;
    if (d <= P.helixGarden) v = dirOf(G.bearing(eye) - side(d), p);
    else {
      // the heading, counted to the right of the rest's. To the downstream side: the lesser of the tower's own
      // (the gaze that follows the tower, beside its axis as the place has it) and of the rest. Past it: the
      // rest and the pan to the left after it, until the tower's own, coming round from behind, is the greater
      const s = d > P.helixDownstream ? besideAt(d) : HELIX.side[0];
      const turn = d > P.helixDownstream ? roundMax(lead(eye, s, -Math.PI), roundMin(0, panAt(d), PAN.round), PAN.round)
        : roundMin(lead(eye, s, 0), 0, roundStop);
      // the pitch: the rest's; over the pan's second half the gaze rises until the rod's head lies on its row and
      // keeps it there until that pitch has come down to the rest again; out from the top the aim is lowered
      // down the tower
      if (d > panFrom) {
        const top = G.pitchTo(eye, LEVELS.rodTop, HELIX.rodRow, s) + HELIX.topDown;
        p += ((top + Math.hypot(top, HELIX.settle)) / 2 - HELIX.topDown - p) * G.glide((panFrom + panTo) / 2, panTo, d);
      }
      if (d > lowerFrom) p += (G.pitchTo(eye, LEVELS.rodTop, FLY.headRow, s) - p) * G.glide(lowerFrom, lowerTo, d);
      v = dirOf(restAt(eye) + turn, p);
    }
    if (d < turnTo) {                                // brought round from the route's own heading (the lift under the tower still in it, the climb's own pitch left out)
      const own = G.ownAt(d, eye);
      const t = G.glide(turnFrom, turnTo, d);
      v = turnToward(dirOf(headingOf(own), Math.min(0, pitchOf(own)) + voidLift(P, G, d)), v, t);
      v = dirOf(headingOf(v), pitchOf(v) + HELIX.turnLift * 6.75 * t * t * (1 - t));   // a swell, its most (the whole lift: 6.75 brings it to 1) at two thirds of the turn
    }
    // the swing forward and down to the come-about's first picture, square across the garden, and from it the
    // gaze led round by the line's turn onto the downstream palace's dome
    if (d > P.comeAboutStart + FLY.toGarden[0]) {
      const dome = toward(PALACE_AIM, FLY.floor), onDome = nearTo(headingOf(dome), ACROSS);
      const h = roundMin(onDome, roundMax(ACROSS, nearTo(headingOf(G.ownAt(d, eye)) + FLY.lead, ACROSS), FLY.round), FLY.round);
      const there = Math.min(1, Math.max(0, (h - ACROSS) / (onDome - ACROSS)));   // the share of the way from across the garden to the dome
      v = turnToward(v, dirOf(h, -FLY.down + (pitchOf(dome) + FLY.down) * there), G.glide(P.comeAboutStart + FLY.toGarden[0], P.comeAboutStart + FLY.toGarden[1], d));
    }
    return G.point(eye, v, out);
  };
  // the panorama's stretch in metres flown, for the route's checkers: where the gaze leaves the tower, where the
  // pan to its head begins, where that pan meets it
  gaze.panorama = { from: leave, pan: panFrom, to: panTo };
  return gaze;
}

// The axis run's look: a point on the tower's axis, found from the route's own place at u, at the height that sets the
// rod's head half of FIT_DEGREES above the picture's middle. The tower then stands whole and centred for as long as
// it fits (the stretch between axisWholeFrom and axisWholeTo), its head just under the top edge, and whatever room
// the picture has to spare lies under its foot, where the garden's lit axis and the fountains are.
function makeAxisGaze(B) {
  const eye = [0, 0, 0];
  return (time, u, out) => {
    B.pointAt(u, eye);
    const far = Math.hypot(eye[0], eye[2]), head = Math.atan2(LEVELS.rodTop - eye[1], far);
    const y = eye[1] + far * Math.tan(head - FIT_DEGREES / 2 * RAD);
    return out ? out.set(0, y, 0) : [0, y, 0];
  };
}

// A look's window whose rise (or fall) takes a given length in metres: [from, to, fade] for a look that must have its
// weight at `full` and keep it to `hold`. The engine's bell rises and falls over the same share of the window.
function windowFor(full, hold, ramp) {
  const from = full - ramp, to = hold + ramp;
  return [from, to, ramp / (to - from)];
}

function makeLooks(B) {
  const P = B.places, L = B.length, G = makeGazeTools(B);
  const look = (name, at, from, to, fade, weight, arc, steady) =>
    ({ name, at, fromMetres: from, toMetres: to, from: from / L, to: to / L, weight, fade, arc, steady });
  return [
    // on the river: the tower whole on the left, then the bridge across the picture until its arch takes the gaze
    // (the look's own rise lies before the first metre; it works the opening and the letting go itself)
    look('riverTower', makeRiverGaze(B, G), ...windowFor(P.riverStart, P.bridgeIn + RIVER.under, WINDOW_RAMP), 1.0, true, false),
    // from the bridge's far face to the tower's near arch: the gaze brought round to the tower and kept on it
    look('quayTower', makeQuayGaze(B, G), ...windowFor(P.bridgeOut + QUAY.swing[0] + WINDOW_RAMP, P.towerIn - QUAY.clear[1], WINDOW_RAMP), 1.0, true, true),
    // under the tower: the gaze lifted into the first deck's opening and brought down toward the far arch. The steady
    // camera takes under half of the lift (this look is not marked steady; the helix's, which is, carries the lift's
    // last part in its turn): a comfort setting is not swung up and down in two seconds
    look('towerVoid', makeVoidGaze(B, G), ...windowFor(P.towerIn - VOID.from, P.towerCentre + VOID.level, WINDOW_RAMP), 1.0, true, false),
    // round the tower, out from its top down the garden and into the come-about: it brings the gaze round itself from
    // under the tower (its window begins a ramp before its turn) and keeps its weight until the axis run's look has
    // the gaze whole (at axisWholeFrom)
    look('towerGaze', makeTowerGaze(B, G), ...windowFor(P.towerCentre + HELIX.turn[0], P.axisWholeFrom, WINDOW_RAMP), 1.0, true, true),
    // on the axis run: the tower whole and centred, with all its weight so that the rod's head rests where the look sets it
    look('towerWhole', makeAxisGaze(B), P.comeAboutEnd - 90, P.axisWholeTo + 60, 0.25, 1.0, true, true),
    // the last stretch: the garden-side arch with the portal in it, the gaze on the arch's crown while the line sinks
    // to the portal's height (the flight's last metres give the gaze back to the route by themselves)
    look('archAndPortal', [0, ARCH.crownY, TOWER.halfOuter(ARCH.crownY)], P.axisWholeTo, P.end, 0.25, 0.9, true, true),
  ];
}

// THE ROUTE, one object. What needs no laid line stands in it from the start; the rest (null here) is filled by
// layRoute(), and nothing of the route is worked while this file loads.
export const ROUTE = {
  knots: null, knotSpacing: KNOT_SPACING, length: 0, places: null,
  duration: 50, pace: null, paces: PACE,
  looks: null,
  portal: { ...PLAN.portal, sill: 0, centre: [0, PLAN.portal.height / 2, TOWER.halfOuter(PLAN.portal.height)], drawWithin: 300, revealDistance: 300 },
  camera: { lookAhead: 40, bank: 0.08 },
  plan: PLAN, fitDegrees: FIT_DEGREES,
  pointAt: null,                                       // the route's own point at a share of the flight, [x, y, z], from this file's own working of the curve
  curve: null,                                         // that curve as points every half metre: { x, y, z, length, step, count }
  laid: null,                                          // the eased laid line the knots are taken from, with the two radii that follow from the others
  // The kit's path through the knots, with samples every metre and a half for its nearest-point readings, and the
  // same path as a dense polyline (every half metre: x, y, z in turn) for distance work.
  makePath(core) {
    const R = layRoute(), path = core.makePath(R.knots, { samples: Math.ceil(R.length / 1.5) });
    const count = Math.ceil(path.length / STEP) + 1, polyline = new Float32Array(count * 3), v = path.posAtDist(0);
    for (let i = 0; i < count; i++) { path.posAtDist(Math.min(i * STEP, path.length), v); polyline[i * 3] = v.x; polyline[i * 3 + 1] = v.y; polyline[i * 3 + 2] = v.z; }
    return { path, polyline, step: STEP, count };
  },
};

// Lays the route and fills ROUTE: the first call works the laid line, the knots, the curve, the places, the pace and
// the looks; every later call returns ROUTE at once. It is worked on call and not while this file loads because the
// laying is some twenty milliseconds of arithmetic: at load it would lengthen the one task in which the page takes
// in its modules, and a visitor would feel that as a hitch while the world loads behind a portal. So the load is cut
// into short tasks: a world calls layRouteLine() and then layRoute() inside its build, a yield before each, before
// its first use of the route's laid fields; a tool calls layRoute() before it reads them.
export function layRoute() {
  if (ROUTE.knots) return ROUTE;
  const B = buildRoute(), line = B.line;
  ROUTE.knots = B.knots; ROUTE.length = B.length; ROUTE.places = B.places;
  ROUTE.pace = makePace(B.places, B.length);
  ROUTE.looks = makeLooks(B);
  ROUTE.pointAt = B.pointAt; ROUTE.curve = B.curve;
  ROUTE.laid = { points: line.pts, metres: line.len, length: line.length, stations: line.marks,
    quayFirstRadius: line.lay.quayFirstRadius, helixWideRadius: line.lay.wideRadius };
  return ROUTE;
}

// ---------------------------------------------------------------------------------------------------------------
// THE IRON AS DATA: every bar as a member, every panel face as a quad. Every size is taken from TOWER above.

const LV = TOWER.levels, ST = TOWER.structure;
// Metres from the flown line within which a face keeps its fine bars. WORKING: the flown line passes within 92 m of
// every face of the tower, so at this reach all the fine lattice is real bars and no seam shows between bars and
// plates; a face farther off than this (on a route that ran wider) would be drawn as a plate.
const FINE_REACH = 95;

// Breadths in metres. Rafters and ties are the book's; the rest are WORKING, chosen to read at the sizes of a sheet.
const SIZE = {
  rafter: ST.members.rafter,                         // [below deck 2, above]: 0.88 and 0.50
  tie: ST.members.tie,                               // 0.80 and 0.60
  cross: [0.6, 0.45],                                // WORKING: the arms of each face's cross
  midTie: [0.5, 0.4],                                // WORKING
  fine: [0.36, 0.3],                                 // WORKING: the book's lattice bars thickened to read
  archChord: 0.6, archPost: 0.4, archGrille: 0.3,    // chords in boxes of 600 mm, posts of 400 mm; the grille's bars WORKING
};

// The three bands above deck 2 are thirds of the height from deck 2 to the top (WORKING: the sources give three tints, not their limits).
const BAND_TOPS = [LV.deck1, LV.deck2, LV.deck2 + (LV.top - LV.deck2) / 3, LV.deck2 + (LV.top - LV.deck2) * 2 / 3];
function bandAt(y) { let b = 0; while (b < 4 && y > BAND_TOPS[b]) b++; return b; }

// The fine bracing of a full panel face, as straight bars in the face's own (u, v): u from the left rafter to the right,
// v from the lower tie to the upper. A diamond through the middles of the four sides, and a tie at each quarter height.
// The main cross is u = v and u + v = 1; the mid tie is v = 0.5. A plate's shader draws these same lines.
export const FINE_PATTERN = [
  [0, 0.5, 0.5, 1], [0.5, 1, 1, 0.5], [1, 0.5, 0.5, 0], [0.5, 0, 0, 0.5],
  [0, 0.25, 1, 0.25], [0, 0.75, 1, 0.75],
];
// The grille between an arch's two chords, bay by bay: one small cross.
export const GRILLE_PATTERN = [[0, 0, 1, 1], [0, 1, 1, 0]];

// An accumulator of members and plates for one call of the two public functions.
function makeBag() {
  const members = [], plates = [];
  const add = (a, b, w, h, weight, group, panel = -1) => {
    members.push({ ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], w, h, weight, band: bandAt((a[1] + b[1]) / 2), group, panel });
  };
  // a face's quad: corners in the order lower left, lower right, upper right, upper left
  const plate = (c0, c1, c2, c3, zone, pattern) => {
    const y = (c0[1] + c1[1] + c2[1] + c3[1]) / 4;
    plates.push({ corners: [c0, c1, c2, c3], band: bandAt(y), zone, pattern });
    return plates.length - 1;
  };
  return { members, plates, add, plate };
}

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// a point of a face from its four corners and (u, v)
const onFace = (c, u, v) => mix(mix(c[0], c[1], u), mix(c[3], c[2], u), v);

// The heights at which a chain of rafter pieces has a joint: the panel levels themselves and every row of the outline's
// table between them (but for a row within a metre of a level, where the straight piece leaves the outline by
// centimetres), so that a rafter follows the outline's bends.
function joints(levels) {
  const ys = levels.slice();
  for (const row of TOWER.outline) {
    if (row[0] > levels[0] && row[0] < levels[levels.length - 1] && !ys.some((y) => Math.abs(y - row[0]) < 1)) ys.push(row[0]);
  }
  return ys.sort((a, b) => a - b);
}

const FULL_PANEL = 5.7;                              // WORKING: a panel lower than this is a girder or a belt: a cross alone, no mid tie, no fine bars

// One face of one panel: its cross (and mid tie and fine bars if the panel is a full one) and its plate.
// c: corners lower left, lower right, upper right, upper left. k: 0 below deck 2, 1 above. lattice false: a cross alone.
function panelFace(bag, c, zone, k, lattice = true) {
  const full = lattice && (c[3][1] + c[2][1] - c[0][1] - c[1][1]) / 2 >= FULL_PANEL;
  bag.add(c[0], c[2], SIZE.cross[k], SIZE.cross[k], 'medium', zone + ':cross');
  bag.add(c[1], c[3], SIZE.cross[k], SIZE.cross[k], 'medium', zone + ':cross');
  const p = bag.plate(c[0], c[1], c[2], c[3], zone, full ? 'panel' : 'none');
  if (!full) return;
  bag.add(mix(c[0], c[3], 0.5), mix(c[1], c[2], 0.5), SIZE.midTie[k], SIZE.midTie[k], 'medium', zone + ':midtie');
  for (const s of FINE_PATTERN) bag.add(onFace(c, s[0], s[1]), onFace(c, s[2], s[3]), SIZE.fine[k], SIZE.fine[k], 'fine', zone + ':fine', p);
}

// A square prism of four rafters through the given panel levels: rafters jointed at every outline row, a ring of
// four ties at every level (the first left out where the prism below has laid it), and the four faces of every panel.
// cornersAt(y) gives the four corners in ring order.
function prism(bag, zone, levels, cornersAt, k, firstRing = true) {
  const ys = joints(levels);
  for (let i = 0; i + 1 < ys.length; i++) {
    const a = cornersAt(ys[i]), b = cornersAt(ys[i + 1]);
    for (let j = 0; j < 4; j++) bag.add(a[j], b[j], SIZE.rafter[k], SIZE.rafter[k], 'heavy', zone + ':rafter');
  }
  for (let i = 0; i < levels.length; i++) {
    const a = cornersAt(levels[i]);
    if (i || firstRing) for (let j = 0; j < 4; j++) bag.add(a[j], a[(j + 1) % 4], SIZE.tie[k], SIZE.tie[k], 'medium', zone + ':tie');
    if (i + 1 === levels.length) break;
    const b = cornersAt(levels[i + 1]);
    for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; panelFace(bag, [a[j], a[j1], b[j1], b[j]], zone, k); }
  }
}

// The panel levels. Below deck 1: the base girder, the ties at 17, 28, 39 and 50, and the fifth panel's 7 m to the
// head the structure gives it (57 m: deck 1's floor lies 0.63 m over it, on the floor beams).
// Deck 1 to deck 2, counted from that head: six panels of 11, 11, 11, 10.2 and 10 m and the floor's belt.
const LEG_LEVELS = [ST.baseGirder[0], ST.baseGirder[1], ...ST.ties, ST.panel5[1]];
const MID_LEVELS = [0, 11, 22, 33, 43.2, 53.2].map((d) => ST.panel5[1] + d).concat([LV.deck2]);

// The four corners of a leg's box at a height, in ring order.
function legCorners(leg) {
  return (y) => {
    const b = TOWER.legBox(y, leg), h = b.half;
    return [[b.x - h, y, b.z - h], [b.x + h, y, b.z - h], [b.x + h, y, b.z + h], [b.x - h, y, b.z + h]];
  };
}

// THE SHOES: each rafter stands in a cast shoe on its footing, a block square to the rafter that takes in the foot of
// the rafter and the ends of the lowest ties and cross arms that meet there. INVENTED BY NEED (no line of the sources
// gives the shoes: a rafter that ended bare on the masonry would read as a fault where the line comes in under the
// tower, 38 m from a footing). WORKING: its size; it runs from a little inside the masonry's top to over the base girder's upper tie.
const SHOE = { side: 2.0, sunk: 0.3, over: 1.3 };
function addLeg(bag, leg) {
  const at = legCorners(leg), y0 = ST.footing.height - SHOE.sunk, y1 = ST.baseGirder[1] + SHOE.over;
  prism(bag, 'legs', LEG_LEVELS, at, 0);
  prism(bag, 'mid', MID_LEVELS, at, 0, false);
  const a = at(y0), b = at(y1);
  for (let j = 0; j < 4; j++) bag.add(a[j], b[j], SHOE.side, SHOE.side, 'heavy', 'legs:shoe');
}
function addLegs(bag) { for (const leg of Object.keys(TOWER.legs)) addLeg(bag, leg); }

// THE SHAFT, deck 2 to deck 3: eighteen panels. The first is 11.3 m; the other seventeen shrink from 11.3 m to 5.83 m.
// WORKING: the book gives the two ends and the sum, not each height; here each is 11.3 less a share of the difference
// that grows as a power of the panel's number, the power found so that the eighteen end exactly on deck 3.
function shaftLevels() {
  const P = ST.panels, n = P.deck2to3 - 1, want = LV.deck3 - LV.deck2 - P.firstHeight;
  const heights = (p) => Array.from({ length: n }, (_, i) => P.firstHeight - (P.firstHeight - P.lastHeight) * Math.pow(i / (n - 1), p));
  let lo = 1, hi = 4;
  for (let it = 0; it < 60; it++) { const p = (lo + hi) / 2; if (heights(p).reduce((a, b) => a + b, 0) < want) lo = p; else hi = p; }
  const ys = [LV.deck2, LV.deck2 + P.firstHeight];
  for (const h of heights((lo + hi) / 2)) ys.push(ys[ys.length - 1] + h);
  ys[ys.length - 1] = LV.deck3;
  return ys;
}
const SHAFT_LEVELS = shaftLevels();
// Twelve rafters stand above deck 2 (each leg's three outer ones) up to the top of the book's panel 17, the sixth
// above the deck: on each face the two inner ones close on the face's middle and meet there. Above, four.
const SHAFT_SPLIT = 6;
const SHAFT_JOIN = SHAFT_LEVELS[SHAFT_SPLIT];
const gapAt = (y) => TOWER.innerSide(LV.deck2) * Math.max(0, (SHAFT_JOIN - y) / (SHAFT_JOIN - LV.deck2));   // half the open slot between two legs

// a point of the shaft's face f (0 to 3, in ring order) at a height and a place across it
const FACE = [[1, 0, 0, -1], [0, 1, 1, 0], [-1, 0, 0, 1], [0, -1, -1, 0]];   // across (x, z), outward (x, z)
function onShaft(f, y, across) {
  const F = FACE[f], h = TOWER.halfOuter(y);
  return [F[0] * across + F[2] * h, y, F[1] * across + F[3] * h];
}

function addShaft(bag) {
  const L = SHAFT_LEVELS, k = 1, raf = SIZE.rafter[k];
  // the four corner rafters, jointed at the outline's rows
  const ys = joints(L);
  for (let i = 0; i + 1 < ys.length; i++) for (let f = 0; f < 4; f++) {
    bag.add(onShaft(f, ys[i], TOWER.halfOuter(ys[i])), onShaft(f, ys[i + 1], TOWER.halfOuter(ys[i + 1])), raf, raf, 'heavy', 'shaft:rafter');
  }
  for (let i = 0; i < L.length; i++) for (let f = 0; f < 4; f++) {
    const y0 = L[i], h0 = TOWER.halfOuter(y0), g0 = gapAt(y0);
    // deck 2's own ring is the legs' top ring below the split; the shaft lays every ring above it
    if (i) bag.add(onShaft(f, y0, -h0), onShaft(f, y0, h0), SIZE.tie[k], SIZE.tie[k], 'medium', 'shaft:tie');
    if (i + 1 === L.length) continue;
    const y1 = L[i + 1], h1 = TOWER.halfOuter(y1), g1 = gapAt(y1);
    if (i < SHAFT_SPLIT) {
      // two leg faces with the slot between them, and the two inner rafters that bound the slot
      for (const s of [-1, 1]) {
        bag.add(onShaft(f, y0, s * g0), onShaft(f, y1, s * g1), raf, raf, 'heavy', 'shaft:rafter');
        const lo = [onShaft(f, y0, s * h0), onShaft(f, y0, s * g0)], up = [onShaft(f, y1, s * h1), onShaft(f, y1, s * g1)];
        panelFace(bag, s < 0 ? [lo[0], lo[1], up[1], up[0]] : [lo[1], lo[0], up[0], up[1]], 'shaft', k);
      }
    } else {
      panelFace(bag, [onShaft(f, y0, -h0), onShaft(f, y0, h0), onShaft(f, y1, h1), onShaft(f, y1, -h1)], 'shaft', k);
    }
  }
}

// THE FOUR GREAT ARCHES. Each is two rings, one in the leaning plane of the legs' outer faces and one in the plane of
// their inner faces. A ring is two chords (the intrados and the extrados, chains of short pieces), radial posts
// between them and a grille bay between each pair of posts. The chords' axes stand half a chord inside the two
// circles, so the iron's face is the circle itself. The rings spring just under the tops of the footings; where the
// extrados would run into a leg, the posts stop on the leg's inner rafter and the leg carries the ring's outer side.
const ARCH_BAYS = 36;                                // WORKING: bays of about 3.1 m on the intrados
function addArch(bag, arch, planeAt, zone) {
  const A = TOWER.arch, ri = arch.radius + SIZE.archChord / 2, re = arch.extradosRadius - SIZE.archChord / 2;
  const y0 = ST.footing.height - 0.4, t0 = Math.asin((y0 - A.centreY) / ri);
  const at = (r, th) => {
    const t = r * Math.cos(th), y = A.centreY + r * Math.sin(th), a = planeAt(y);
    return arch.axis === 'z' ? [t, y, a] : [a, y, t];
  };
  // how far out along a radius the ring reaches: to the extrados, or to the leg's inner rafter if that comes first
  const reach = (th) => {
    const over = (r) => Math.abs(r * Math.cos(th)) - TOWER.innerSide(A.centreY + r * Math.sin(th));
    if (over(re) <= 0) return re;
    let lo = ri, hi = re;
    for (let it = 0; it < 30; it++) { const r = (lo + hi) / 2; if (over(r) > 0) hi = r; else lo = r; }
    return lo;
  };
  const inn = [], out = [], whole = [], depth = [];
  for (let i = 0; i <= ARCH_BAYS; i++) {
    const th = t0 + (Math.PI - 2 * t0) * i / ARCH_BAYS, r = reach(th);
    inn.push(at(ri, th)); out.push(at(r, th)); whole.push(r > re - 1e-6 ? 1 : 0); depth.push(r - ri);
  }
  const c = SIZE.archChord;
  for (let i = 0; i <= ARCH_BAYS; i++) {
    if (depth[i] >= 1) bag.add(inn[i], out[i], SIZE.archPost, SIZE.archPost, 'medium', zone + ':post');
    if (i === ARCH_BAYS) break;
    bag.add(inn[i], inn[i + 1], c, c, 'heavy', zone + ':chord');
    if (whole[i] || whole[i + 1]) bag.add(out[i], out[i + 1], c, c, 'heavy', zone + ':chord');
    if (Math.min(depth[i], depth[i + 1]) < 1.5) continue;      // too shallow a bay for a grille
    const q = [inn[i], inn[i + 1], out[i + 1], out[i]], p = bag.plate(q[0], q[1], q[2], q[3], zone, 'grille');
    for (const s of GRILLE_PATTERN) bag.add(onFace(q, s[0], s[1]), onFace(q, s[2], s[3]), SIZE.archGrille, SIZE.archGrille, 'fine', zone + ':grille', p);
  }
}

// THE ARCH GIRDER (SOURCED: figures.md A, "Panels": the arch girder, 7.00 m high): on each face, in both planes, a lattice girder from leg to leg that the arch's extrados touches at
// its crown. The builder's book gives its two lengths, 45.287 m below and 38.250 m above (7 m apart on the legs'
// lean); its two chords stand at the heights where the clear width between two legs' inner sides is those lengths,
// which the outline's section works and gives as the structure's archGirder.
// Its bays are each a panel face (cross, mid tie, fine bars, plate). Over it, from its upper chord to the height the
// structure gives for the fifth panel's head, the first floor's own girder between the legs: a cross a bay (WORKING).
const GIRDER_BAYS = 5;                               // WORKING: bays about as wide as the girder is high
const GIRDER_LEVELS = [ST.archGirder[0], ST.archGirder[1], ST.panel5[1]];   // the girder's two chords, then the fifth panel's head
function addArchGirder(bag, arch, planeAt, zone) {
  const L = GIRDER_LEVELS, k = 0;
  const at = (y, u) => { const t = (2 * u - 1) * TOWER.innerSide(y), a = planeAt(y); return arch.axis === 'z' ? [t, y, a] : [a, y, t]; };
  for (const y of L) bag.add(at(y, 0), at(y, 1), SIZE.rafter[k], SIZE.rafter[k], 'heavy', zone + ':girder');
  for (let tier = 0; tier < 2; tier++) for (let i = 0; i < GIRDER_BAYS; i++) {
    const ya = L[tier], yb = L[tier + 1], u0 = i / GIRDER_BAYS, u1 = (i + 1) / GIRDER_BAYS;
    if (i) bag.add(at(ya, u0), at(yb, u0), SIZE.tie[k], SIZE.tie[k], 'medium', zone + ':tie');
    panelFace(bag, [at(ya, u0), at(ya, u1), at(yb, u1), at(yb, u0)], zone, k, tier === 0);
  }
}

function addArchFace(bag, arch) {
  addArch(bag, arch, arch.plane.outerAt, 'arch');
  addArch(bag, arch, arch.plane.innerAt, 'archin');
  addArchGirder(bag, arch, arch.plane.outerAt, 'girder');
  addArchGirder(bag, arch, arch.plane.innerAt, 'girder');
}
function addArches(bag) { for (const arch of Object.values(TOWER.arches)) addArchFace(bag, arch); }

// THE LIFT CARS' SIZES AND THE ROOM THEY NEED. Sizes are WORKING (the sources give the makers and the runs, not these).
// A leg's car is an upright box: the middle of its floor rides the lift's line, TOWER.liftInset in from the leg's two
// inner faces, and its long side lies across the leg's diagonal. Its plan is small enough that its corners stand
// 0.67 m inside the planes of those faces, clear of the ties' half breadth (0.4 m) and of every bar in them.
const CAR = {
  otis: { long: 4.0, deep: 2.6, high: 5.6, period: 120 },
  roux: { long: 4.0, deep: 2.6, high: 5.4, period: 100 },
  edoux: { long: 3.6, deep: 3.2, high: 4.2, period: 110 },
  truck: { long: 2.4, deep: 1.6, high: 2.4 },
};
const LEG_CAR_HIGH = Math.max(CAR.otis.high, CAR.roux.high);
const CAR_REACH = (CAR.otis.long + CAR.otis.deep) / (2 * Math.SQRT2);   // a leg car's half extent along X and along Z
const FLOOR_DEPTH = 1.2;                             // WORKING: how far a deck's floor beams reach below its floor
const WELL_GAP = 0.3;                                // metres of air between a car's sweep and the edge of its well
const liftLineAt = (y) => TOWER.innerSide(y) + TOWER.liftInset;        // a leg's lift line, on both axes, at a height
// The square well a leg's car needs in a deck's floor, as its near and far sides' distances from the tower's two
// axis planes. The line leans, the car is upright: while the car's roof is coming up through the floor its plan
// stands farther out than it will with its floor at the deck. The well holds the whole sweep and WELL_GAP round it.
function wellAt(deck) {
  return [liftLineAt(deck.floor) - CAR_REACH - WELL_GAP, liftLineAt(deck.floor - FLOOR_DEPTH - LEG_CAR_HIGH) + CAR_REACH + WELL_GAP];
}
const WELL1 = wellAt(TOWER.decks[0]), WELL2 = wellAt(TOWER.decks[1]);
// The steepest lean of a leg's inner side below deck 1, metres in for a metre up, from the outline's own rows.
const LEG_LEAN = TOWER.outline.reduce((most, row, i, all) => (i && row[0] <= 57.6 && all[i - 1][0] >= LV.bearings
  ? Math.max(most, (TOWER.innerSide(all[i - 1][0]) - TOWER.innerSide(row[0])) / (row[0] - all[i - 1][0])) : most), 0);
// THE OTIS LIFTS' COUNTERWEIGHT TRUCKS. INVENTED BY NEED (the sources give the Otis lifts' makers and runs, not
// their works: a lift of 1889 was hauled against a counterweight, and the leg's inside is seen close from under the
// tower, where a car alone on its rails would be a lift with no works). Plain paint, unlit.
// An Otis lift's counterweight truck runs up the middle of its leg, under deck 1 only: its line lies TRUCK_OFF deeper
// in the leg than the car's on both axes. That is far enough for the upright car (whose roof stands the lean times
// its height nearer the truck's line than its floor does) to pass the truck and its rail with TRUCK_GAP between
// the two boxes whatever their heights.
const TRUCK_GAP = 0.3;
const TRUCK_OFF = ((CAR.otis.deep + CAR.truck.deep) / 2 + TRUCK_GAP) / Math.SQRT2 + LEG_LEAN * CAR.otis.high;
// the height of the truck's floor at the head of its run: its roof stands 0.4 m under deck 1's floor beams
const TRUCK_TOP = TOWER.decks[0].floor - FLOOR_DEPTH - CAR.truck.high - 0.4;
const TRUCK_FROM = 0.12;                             // WORKING: the share of its own line at which the truck's run begins

// THE DECKS' GIRDERS. A square ring of four girders at a half side and a height.
function ring(bag, half, y, w, h, weight, group) {
  const c = [[-half, y, -half], [half, y, -half], [half, y, half], [-half, y, half]];
  for (let j = 0; j < 4; j++) bag.add(c[j], c[(j + 1) % 4], w, h, weight, group);
}

const VOID_CUT = 4;                                  // WORKING: how much of each corner of deck 1's central opening is cut off
function addDecks(bag) {
  const [d1, d2, d3] = TOWER.decks;
  // WORKING: every breadth and depth typed in this function (the sources give the decks' plans and levels, not
  // their girders', beams' and brackets' sections).
  // deck 1: the rim girder under the gallery's columns, the eight-sided rim of the central opening, and floor beams
  // on the arcades' bays (7.76 m), both ways, broken at the opening
  const y1 = d1.floor - 0.6;
  ring(bag, d1.half, y1, 0.6, 1.2, 'heavy', 'deck1:girder');
  const v = d1.voidHalf, cut = v - VOID_CUT, oct = [[-cut, -v], [cut, -v], [v, -cut], [v, cut], [cut, v], [-cut, v], [-v, cut], [-v, -cut]];
  for (let j = 0; j < 8; j++) { const a = oct[j], b = oct[(j + 1) % 8]; bag.add([a[0], y1, a[1]], [b[0], y1, b[1]], 0.6, 1.0, 'heavy', 'deck1:girder'); }
  // a beam that would cross a lift's well stops on the well's trimmers, which stand a quarter metre outside its edges
  const w0 = WELL1[0] - 0.25, w1 = WELL1[1] + 0.25;
  for (let n = -4; n <= 4; n++) {
    const o = n * d1.arcadeBay, m = Math.abs(o);
    const spans = m < v ? [[-d1.half, -v], [v, d1.half]] : m > w0 && m < w1 ? [[-d1.half, -w1], [-w0, w0], [w1, d1.half]] : [[-d1.half, d1.half]];
    for (const [a, b] of spans) {
      bag.add([o, y1, a], [o, y1, b], 0.5, 1.0, 'medium', 'deck1:beam');
      bag.add([a, y1, o], [b, y1, o], 0.5, 1.0, 'medium', 'deck1:beam');
    }
  }
  for (const s of Object.values(TOWER.legs)) for (const e of [w0, w1]) {
    bag.add([s[0] * e, y1, s[1] * (w0 - 0.25)], [s[0] * e, y1, s[1] * (w1 + 0.25)], 0.5, 1.0, 'medium', 'deck1:beam');
    bag.add([s[0] * (w0 - 0.25), y1, s[1] * e], [s[0] * (w1 + 0.25), y1, s[1] * e], 0.5, 1.0, 'medium', 'deck1:beam');
  }
  // deck 2: the rim girder, the belt a metre under the floor round the four legs, and floor beams on the legs' own lines
  const y2 = d2.floor - 0.5;
  ring(bag, d2.half - 0.25, y2, 0.5, 1.0, 'heavy', 'deck2:girder');
  ring(bag, TOWER.halfOuter(d2.floor - 1), d2.floor - 1, SIZE.tie[0], SIZE.tie[0], 'heavy', 'deck2:girder');
  for (const o of [TOWER.innerSide(d2.floor), TOWER.halfOuter(d2.floor)]) for (const s of [-1, 1]) {
    bag.add([s * o, y2, -d2.half], [s * o, y2, d2.half], 0.5, 1.0, 'medium', 'deck2:beam');
    bag.add([-d2.half, y2, s * o], [d2.half, y2, s * o], 0.5, 1.0, 'medium', 'deck2:beam');
  }
  // deck 3: the rim girder of the glazed room and of the terrace over it, and the brackets that carry them out from the shaft
  const y3 = d3.floor - 0.3, yb = d3.floor - d3.thick + 0.3, hb = TOWER.halfOuter(yb);
  ring(bag, d3.half - 0.25, y3, 0.5, 0.6, 'heavy', 'deck3:girder');
  ring(bag, d3.terraceHalf - 0.25, LV.terrace - 0.3, 0.5, 0.6, 'heavy', 'deck3:girder');
  for (let f = 0; f < 4; f++) for (const t of [-1, 0, 1]) {
    const F = FACE[f], rim = d3.half - 0.25;
    bag.add([F[0] * t * hb + F[2] * hb, yb, F[1] * t * hb + F[3] * hb], [F[0] * t * hb + F[2] * rim, y3, F[1] * t * hb + F[3] * rim], 0.4, 0.4, 'medium', 'deck3:bracket');
  }
  for (const s of Object.values(TOWER.legs)) bag.add([s[0] * hb, yb, s[1] * hb], [s[0] * (d3.half - 0.25), y3, s[1] * (d3.half - 0.25)], 0.4, 0.4, 'medium', 'deck3:bracket');
}

// THE CROWN: four posts from deck 3 up to the campanile's girders, the two diagonal girders (two chords, posts and
// crosses), the two crossed half-round arches that rise from the girders' ends to the lantern's floor, and the
// lantern's ten posts with a ring at foot and head. WORKING: the bars' sections typed below and the pieces in an
// arch (the girders' length and height, the arches' radius and width and the lantern's sides are the sources').
function addCrown(bag) {
  const C = TOWER.crown.campanile, N = TOWER.crown.lantern, q = Math.SQRT1_2;
  for (const s of Object.values(TOWER.legs)) {
    const a = TOWER.halfOuter(LV.deck3), b = TOWER.halfOuter(C.y0);
    bag.add([s[0] * a, LV.deck3, s[1] * a], [s[0] * b, C.y0, s[1] * b], SIZE.rafter[1], SIZE.rafter[1], 'heavy', 'crown:post');
  }
  const ya = C.y0 + 0.25, yb = C.y0 + C.girderHeight - 0.25, r = C.girderLength / 2 - 0.25;
  const yc = C.y1 - C.radius, ra = C.radius - 0.25, steps = 12;        // the arches' centre, their axis radius, pieces in each
  for (const d of [[q, q], [q, -q]]) {
    const at = (t, y) => [d[0] * t, y, d[1] * t];
    bag.add(at(-r, ya), at(r, ya), 0.5, 0.5, 'heavy', 'crown:girder');
    bag.add(at(-r, yb), at(r, yb), 0.5, 0.5, 'heavy', 'crown:girder');
    for (let i = 0; i <= 4; i++) {
      const t = -r + 2 * r * i / 4, t1 = -r + 2 * r * (i + 1) / 4;
      if (i !== 2 || d[1] > 0) bag.add(at(t, ya), at(t, yb), 0.4, 0.4, 'medium', 'crown:tie');   // the middle post is one for both girders
      if (i < 4) { bag.add(at(t, ya), at(t1, yb), 0.3, 0.3, 'medium', 'crown:cross'); bag.add(at(t, yb), at(t1, ya), 0.3, 0.3, 'medium', 'crown:cross'); }
    }
    for (let i = 0; i < steps; i++) {
      const t0 = Math.PI * i / steps, t1 = Math.PI * (i + 1) / steps;
      bag.add(at(ra * Math.cos(t0), yc + ra * Math.sin(t0)), at(ra * Math.cos(t1), yc + ra * Math.sin(t1)), C.archWidth, 0.5, 'heavy', 'crown:arch');
    }
  }
  const top = N.y0 + N.height, post = (i, y) => { const a = 2 * Math.PI * i / N.sides; return [N.glassRadius * Math.cos(a), y, N.glassRadius * Math.sin(a)]; };
  for (let i = 0; i < N.sides; i++) {
    bag.add(post(i, N.y0), post(i, top), 0.3, 0.3, 'medium', 'lantern:post');
    bag.add(post(i, N.y0), post(i + 1, N.y0), 0.3, 0.3, 'medium', 'lantern:ring');
    bag.add(post(i, top), post(i + 1, top), 0.3, 0.3, 'medium', 'lantern:ring');
  }
}

function buildAll() {
  const bag = makeBag();
  addLegs(bag);
  addShaft(bag);
  addArches(bag);
  addDecks(bag);
  addCrown(bag);
  return bag;
}

// The same list as buildAll's, in the same order, made in steps with a pause after each leg, the shaft and each
// face's arches, for a build that must not hold the frame.
async function buildAllInSteps(pause) {
  const bag = makeBag();
  for (const leg of Object.keys(TOWER.legs)) { addLeg(bag, leg); await pause(); }
  addShaft(bag); await pause();
  for (const arch of Object.values(TOWER.arches)) { addArchFace(bag, arch); await pause(); }
  addDecks(bag);
  addCrown(bag);
  return bag;
}

// Every member of the tower. Pure: the same list at every call.
export function towerMembers() { return buildAll().members; }

// Every panel face as a quad: { corners: [[x, y, z] x 4], band, zone, pattern }, in the order the members' panel
// indices count. pattern: 'panel' (FINE_PATTERN), 'grille' (GRILLE_PATTERN) or 'none' (a girder's face: its cross alone).
export function plateQuads() { return buildAll().plates; }

// The least distance from a point to the flown line, read from the route's own curve (points every half metre):
// a coarse pass over every sixteenth point, then every point round the best of them.
const COARSE = 16;
function toRoute(x, y, z) {
  const C = layRoute().curve, cx = C.x, cy = C.y, cz = C.z, n = C.count;   // the route is laid at the first asking
  // the three best coarse points are searched round, so that a point between two passes of the helix finds the nearer
  let d0 = Infinity, d1 = Infinity, d2 = Infinity, i0 = 0, i1 = 0, i2 = 0;
  for (let i = 0; i < n; i += COARSE) {
    const dx = cx[i] - x, dy = cy[i] - y, dz = cz[i] - z, d = dx * dx + dy * dy + dz * dz;
    if (d < d0) { d2 = d1; i2 = i1; d1 = d0; i1 = i0; d0 = d; i0 = i; } else if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2) { d2 = d; i2 = i; }
  }
  let least = d0;
  for (const at of [i0, i1, i2]) {
    const to = Math.min(n - 1, at + COARSE);
    for (let i = Math.max(0, at - COARSE); i <= to; i++) {
      const dx = cx[i] - x, dy = cy[i] - y, dz = cz[i] - z, d = dx * dx + dy * dy + dz * dz;
      if (d < least) least = d;
    }
  }
  return Math.sqrt(least);
}

// THE LEVEL OF DETAIL BY WHERE THE ROUTE RUNS: for each plate quad, 1 if any of its bounding ball lies within `reach`
// metres of the flown line (its fine bars are then built as members and its plate draws no pattern), else 0.
// Also gives each quad's least distance from its middle to the line. Decided once, from the route alone.
export function nearPanels(reach = FINE_REACH) { return nearOf(buildAll().plates, reach); }
// one quad's middle, the radius of the ball about it that holds its four corners, and the middle's distance to the line
function faceReach(plate) {
  const c = plate.corners, m = [0, 1, 2].map((k) => (c[0][k] + c[1][k] + c[2][k] + c[3][k]) / 4);
  let r = 0;
  for (const q of c) r = Math.max(r, Math.hypot(q[0] - m[0], q[1] - m[1], q[2] - m[2]));
  return { distance: toRoute(m[0], m[1], m[2]), radius: r };
}
function nearOf(plates, reach) {
  const near = new Uint8Array(plates.length), distance = new Float32Array(plates.length);
  for (let i = 0; i < plates.length; i++) {
    const f = faceReach(plates[i]);
    distance[i] = f.distance;
    near[i] = f.distance - f.radius < reach ? 1 : 0;
  }
  return { near, distance, reach };
}

// The members that are built as bars: all the heavy and medium, and the fine of the near panels alone.
export function builtMembers(reach = FINE_REACH) {
  const bag = buildAll(), near = nearOf(bag.plates, reach).near;
  return bag.members.filter((m) => m.weight !== 'fine' || (m.panel >= 0 && near[m.panel]));
}

export const PANEL_LEVELS = { legs: LEG_LEVELS, mid: MID_LEVELS, shaft: SHAFT_LEVELS, shaftJoin: SHAFT_JOIN };
export const MEMBER_SIZES = SIZE;
export { FINE_REACH };

// ---------------------------------------------------------------------------------------------------------------
// THE IRON DRAWN

// The paint of the five bands, foot to cupola, in LINEAR colour (WORKING: the sources give a red-brown paling in five
// bands to near gold, not its values). The brown-red of an iron oxide paint: its green stands at about half its red
// and its blue at about a quarter, so that under the dusk's and the night's fills it reads as brick and rust and
// never as scarlet. One iron going lighter: each band about a sixth brighter than the one below and a very little
// more yellow, so that the top is a pale red-brown and never an orange (the gold is the cupola's alone).
export const PAINT = [
  [0.165, 0.074, 0.046],
  [0.190, 0.087, 0.052],
  [0.220, 0.103, 0.059],
  [0.255, 0.122, 0.067],
  [0.295, 0.144, 0.076],
];
// The paint at a height: its band's tint, brushed into the next band's over PAINT_EASE metres either side of the limit
// between them (WORKING: the sources give five tints, not how sharp their limits were), so that a bar's colour steps
// by its own middle through a panel or two and the tower shows no hard line across the open shaft.
const PAINT_EASE = 8;
export function paintAt(y) {
  const b = bandAt(y), p = PAINT[b];
  let q = null, t = 0;
  if (b < 4 && BAND_TOPS[b] - y < PAINT_EASE) { q = PAINT[b + 1]; t = 0.5 * (1 - (BAND_TOPS[b] - y) / PAINT_EASE); }
  else if (b > 0 && y - BAND_TOPS[b - 1] < PAINT_EASE) { q = PAINT[b - 1]; t = 0.5 * (1 - (y - BAND_TOPS[b - 1]) / PAINT_EASE); }
  return q ? [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t] : p;
}
const STONE = [0.50, 0.46, 0.39];                    // WORKING: the footings' pale limestone, linear
const MIN_PIXELS = 1.5;                              // WORKING: the least breadth a member is drawn at, in pixels; a far lattice's cells close a little sooner than they sparkle
const THIN = [1, 2.5];                               // WORKING: pixels of breadth under which a bar is shaded by its faces' mean alone, and over which by each face
// THE CLOSING OF A LATTICE'S CELLS TO THE FACE'S MEAN. INVENTED BY NEED (a filter of the drawing, no thing of 1889:
// bars held at a pixel and a half leave, far off or on a face seen aslant, holes of a pixel or two that show as
// pinholes of sky and as dashes that sit differently in each frame of the flight). A face's cells go over to ITS
// MEAN by degrees, by the hole a cell leaves in pixels, counted ACROSS the face (the metres one pixel covers there
// over the cosine between the face and the line of sight, and the bars as deep as they show aslant, so a face seen
// aslant closes by its foreshortened breadth): from `open` pixels of hole (the cell's plate comes in, in the tone
// an open hole shows there: the sky's own square on, the iron's by the share of the hole the bars' depth hides
// aslant) to `shut` (the plate stands in the mean). The face's bars go over to the same mean by how far the face
// has closed and by the share of each hole the bars' depth hides aslant: none square on, all edge-on. WORKING, all
// five: `open`, `shut`; `tone` is the mean's paint beside the bars'; `air` is the share of the mean that is the sky
// behind the tower when the face is seen square on (the cell is mostly hole, so a far lattice stays a veil against
// the sky and never turns to a wall); `aslant` is the least cosine a face is counted at.
const CLOSE = { open: 3.0, shut: 1.5, tone: 0.8, air: 0.88, aslant: 0.02 };
const SLIVER = [1, 2.5];                             // WORKING: pixels of a face's seen breadth under which it is shaded by the bar's mean alone, and over which by its own
const TONE = { under: 0.82, top: 1.05, side: 0.95, end: 0.9 };   // a box's face tones, baked in its vertex colours

// a number 0 to 1 from a whole number: an item's own tone, so that no stream is shared between pieces
function hash01(i) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// The light that falls on the iron, shared by all its programs and by both their stages. N is the surface's normal,
// W its place, both in the world.
const GLOW_SHARE = [1, 0.6, 0.4];                    // WORKING: the red each deck's fires throw on the iron beside the first deck's (72, 20 and 8 flames)
// WORKING: a deck's fires stand on its floor, which shades the iron under it: their red carries down the iron by
// uGlowReach and up it by this share of the way to the next deck (from the third, to the rod's top)
const GLOW_UP = 0.45, GLOW_REACH_UP = [LV.deck2 - LV.deck1, LV.deck3 - LV.deck2, LV.rodTop - LV.deck3].map((v) => v * GLOW_UP);
const GLOW_ALL = 0.07;                               // WORKING: the share of the first deck's red that stands on all the iron while the fires burn (a hundred fires' light in their own smoke)
const GLOW_GLARE = { most: 0.75, at: 0.7 };           // WORKING: the fires' glare drowns the dusk's own light on the iron: the most of it that goes, and the red's strength at which that is reached
// WORKING: the red wavers as the flames do, unevenly up the lattice: two faint ripples run away from each deck's
// fires by the clock, a flicker and no band of light. depth: the most the red rises and falls by; reach: radians a metre of each ripple; rate: radians a
// second of each deck's first ripple; second: the second ripple's rate beside the first's; slant: how far a
// ripple's front leans across the tower (metres of height to a metre along X and along Z), so it is no level band
const GLOW_WAVER = { depth: 0.15, reach: [0.16, 0.37], rate: [1.9, 2.3, 2.6], second: 1.4, slant: [0.11, 0.07] };
const FALL_GLSL = /* glsl */`
uniform vec3 uKeyDir, uKeyColor, uSkyTop, uSkyHorizon, uGlow, uGlowY, uGlowWave;   // uGlowWave: each deck's ripples' phase, by the clock
uniform float uGlowReach, uGloss;
vec3 ironFall(vec3 N, vec3 W) {
  vec3 fill = mix(uSkyHorizon, uSkyTop, N.y * .5 + .5);
  vec3 light = fill + uKeyColor * max(dot(N, uKeyDir), 0.);
  // the Bengal fire: red light from each deck's height, falling off up the iron toward the next deck and (sooner)
  // down it, stronger on faces turned to it, over a low red on all the iron: the tower is lit from within, deck by
  // deck, its rims brightest
  vec3 dy = uGlowY - W.y;
  vec3 g = exp(-abs(dy) / mix(vec3(${GLOW_REACH_UP.map((v) => v.toFixed(1)).join(', ')}), vec3(uGlowReach), step(0., dy))) * (.65 + .35 * clamp(N.y * sign(dy), -1., 1.));
  // the red wavers as the flames do: two ripples run up and down the iron from each deck's fires
  vec3 run = abs(dy) + W.x * ${GLOW_WAVER.slant[0].toFixed(2)} + W.z * ${GLOW_WAVER.slant[1].toFixed(2)};
  g *= 1. + ${(GLOW_WAVER.depth * 0.6).toFixed(3)} * sin(run * ${GLOW_WAVER.reach[0].toFixed(3)} - uGlowWave) + ${(GLOW_WAVER.depth * 0.4).toFixed(3)} * sin(run * ${GLOW_WAVER.reach[1].toFixed(3)} - uGlowWave * ${GLOW_WAVER.second.toFixed(2)});
  float red = ${GLOW_ALL.toFixed(2)} + dot(g, vec3(${GLOW_SHARE.map((v) => v.toFixed(2)).join(', ')}));
  // where the red stands strong the sky's fill and the key count for less (the glare), so the lattice reads red and not brown under a red wash
  return light * (1. - ${GLOW_GLARE.most.toFixed(2)} * min(uGlow.r * red * ${(1 / GLOW_GLARE.at).toFixed(4)}, 1.)) + uGlow * red;
}
`;
// The paint's gloss, by the direction from the surface to the eye: the dusk sky and the afterglow mirrored in the
// paint, a few percent face-on and more as the face turns edge-on to the eye (Schlick's rise, held under a brushed
// paint's share: it is no mirror). The afterglow is a broad band, so its image is a wide lobe about the key's direction.
const SHEEN = { faceOn: 0.05, edgeOn: 0.3, lobe: 2.5, lobePow: 6 };   // WORKING: the paint's mirror share seen face-on and edge-on; the afterglow's image, its gain and breadth
const LIGHT_GLSL = /* glsl */`
${FALL_GLSL}
vec3 ironSheen(vec3 N, vec3 W) {
  vec3 V = normalize(cameraPosition - W), R = reflect(-V, N);
  float rim = 1. - max(dot(N, V), 0.), rim2 = rim * rim;
  float share = ${SHEEN.faceOn.toFixed(3)} + ${(SHEEN.edgeOn - SHEEN.faceOn).toFixed(3)} * rim2 * rim2 * rim;
  vec3 seen = mix(uSkyHorizon, uSkyTop, R.y * .5 + .5) + uKeyColor * (${SHEEN.lobe.toFixed(2)} * pow(max(dot(R, uKeyDir), 0.), ${SHEEN.lobePow.toFixed(1)}));
  return seen * share;
}
vec3 ironLight(vec3 alb, vec3 N, vec3 W, float gloss) {
  return alb * ironFall(N, W) + ironSheen(N, W) * (gloss * uGloss);
}
`;

// A lattice face's MEAN, shared by the members' vertex stage and the plates' fragment stage so that a face's bars and
// its plate go over to one tone together. ironSlant: the tangent of the angle between the face's normal and the line
// of sight, from its cosine. ironShut: how far (0 to 1) a cell has closed, from the radius of the round that fits in
// it, its bars' half breadth, the metres one pixel covers across the face and that tangent (a bar as deep as it is
// broad shows its side aslant; and no bar is drawn under the members' least breadth: the hole is what the bars
// leave as seen and as drawn). ironOpen: the share of a hole that is still seen through aslant, squared (a leg is
// two faces deep on the eye's line): the mean's share of sky falls by it, and the bars' going over rises.
// ironSky: THE SKY'S TONE ALONG A RAY, for the mean's share of sky. INVENTED BY NEED (the world hands the iron two
// of its sky's tones, the horizon's and the mid sky's, and the sky deepens above the mid tone: a mean laid with
// the mid tone alone stands out pale against the high sky behind it). The third tone is taken as the mid tone
// deepened (WORKING: `deep`, about what a dusk's and a night's zenith stand at beside their mid tone), and the
// three are laid by the height of the ray as a dusk sky's are (WORKING: the two powers).
const SKY_OVER = { deep: [0.3, 0.17, 0.36], midPow: 1.8, lowPow: 4.2 };
const MEAN_GLSL = /* glsl */`
uniform vec3 uAirLow, uAirHigh;         // the sky's tone at the horizon and half way up, as the hour has it
float ironSlant(float mu) { return sqrt(max(1. - mu * mu, 0.)) / max(mu, ${CLOSE.aslant.toFixed(3)}); }
float ironShut(float cell, float halfBar, float px, float slant) {
  float hole = 2. * (cell - max(halfBar * (1. + slant), ${(MIN_PIXELS / 2).toFixed(2)} * px)) / px;
  return 1. - smoothstep(${CLOSE.shut.toFixed(2)}, ${CLOSE.open.toFixed(2)}, hole);
}
float ironOpen(float cell, float halfBar, float slant) {
  float open = clamp(1. - halfBar * slant / max(cell - halfBar, 1e-3), 0., 1.);
  return open * open;
}
vec3 ironSky(vec3 ray) {
  float inv = 1. - clamp(ray.y, 0., 1.);
  vec3 c = mix(uAirHigh * vec3(${SKY_OVER.deep.map((v) => v.toFixed(2)).join(', ')}), uAirHigh, pow(inv, ${SKY_OVER.midPow.toFixed(1)}));
  return mix(c, uAirLow, pow(inv, ${SKY_OVER.lowPow.toFixed(1)}));
}
`;
// The radius of the round that fits in a cell of a face W broad and H high, as one number for the face (the mean of
// its two sizes of cell). kind 0: the fine pattern's cells (the diamond and quarter ties within the cross and mid
// tie); kind 1: the cross's own four. The plates' fragment stage works the same two lines.
function cellRound(W, H, kind) {
  const D = Math.max(Math.hypot(W, H), 1e-3);
  return kind === 0 ? 0.125 * W * H * (1 / (W + D) + 1 / (W + D + H)) : 0.25 * W * H * (1 / (D + W) + 1 / (D + H));
}

// One vertex and one fragment text for the members (instanced boxes), the footings (plain geometry) and, under the
// define PLATE, the lattice plates.
const IRON_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${FALL_GLSL}
${MEAN_GLSL}
uniform vec2 uPx;                       // x: the drawing buffer's height in pixels, y: the least breadth of a member in pixels
varying vec3 vCol, vN, vW, vMean;       // vMean: the mean light of a bar's faces turned to the eye
varying float vThin;                    // 1 where a bar is thinner than a pixel or two, 0 where each face is seen
varying vec4 vShut;                     // a bar's braced face's mean tone, and how far the bar has gone over to it
varying float vFace;                    // the breadth in pixels of the box's face this vertex lies in, seen square on
#ifdef PLATE
attribute vec4 aDim;                    // the face's breadth here and its height in metres, its bar's breadth, its pattern
attribute float aClose;                 // 1: the face's bars are real members and the plate only closes its cells; 0: the plate draws the bars too
varying vec2 vUv; varying vec4 vDim; varying float vClose, vMpp;
#endif
#ifdef USE_INSTANCING
attribute vec4 aFace;                   // the normal of the panel face this bar braces (none: zero) and the round that fits in a cell of its kind
attribute vec3 aMean;                   // that face's paint, as its plate carries it
#endif
void main() {
  vec3 p = position, n = normal;
  vCol = color; vMean = vec3(0.); vThin = 0.; vShut = vec4(0.); vFace = 1e6;   // (a mesh that is no bar has no face to count: none of it is a sliver)
  #ifdef PLATE
    vUv = uv; vDim = aDim; vClose = aClose;
  #endif
  #ifdef USE_INSTANCING
    // A filter by a pixel's footprint: the box's two thin axes (its breadth and depth, the lengths of the matrix's
    // first two columns) are widened so that neither covers less than uPx.y pixels at this end's own depth.
    vec4 onAxis = modelViewMatrix * (instanceMatrix * vec4(0., 0., p.z, 1.));
    float mPerPx = 2. * max(-onAxis.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
    float breadth = max(length(instanceMatrix[0].xyz), .02), depth = max(length(instanceMatrix[1].xyz), .02);
    p.x *= clamp(uPx.y * mPerPx / breadth, 1., 8.);
    p.y *= clamp(uPx.y * mPerPx / depth, 1., 8.);
    // the breadth of this face as drawn, in pixels: a side's is the box's depth, a top's its breadth, an end's the lesser
    vFace = (abs(n.x) > .5 ? max(depth, uPx.y * mPerPx) : abs(n.y) > .5 ? max(breadth, uPx.y * mPerPx) : max(min(breadth, depth), uPx.y * mPerPx)) / mPerPx;
    vec4 wp = modelMatrix * (instanceMatrix * vec4(p, 1.));
    n = normalize(mat3(instanceMatrix) * n);
    // A filter by a pixel's footprint on the shading: a bar a pixel or two broad shows its lit face and its unlit one
    // inside one pixel, so there it takes the mean light of its two faces turned to the eye, each weighed by how
    // much of it the eye sees (the direction from the bar to the eye), and its faces' own tones go to their mean.
    vec3 sideN = normalize(mat3(modelMatrix) * instanceMatrix[0].xyz), upN = normalize(mat3(modelMatrix) * instanceMatrix[1].xyz);
    vec3 toEye = normalize(cameraPosition - wp.xyz);
    float sideSeen = dot(sideN, toEye), upSeen = dot(upN, toEye);
    vMean = (abs(sideSeen) * ironFall(sideN * sign(sideSeen), wp.xyz) + abs(upSeen) * ironFall(upN * sign(upSeen), wp.xyz)) / max(abs(sideSeen) + abs(upSeen), 1e-4);
    vThin = 1. - smoothstep(${THIN[0].toFixed(2)}, ${THIN[1].toFixed(2)}, min(breadth, depth) / mPerPx);
    vCol = mix(vCol, vec3(${TONE.side.toFixed(3)}), vThin);
    #ifdef USE_INSTANCING_COLOR
      vCol *= instanceColor;
    #endif
    // A filter by a pixel's footprint on a braced face's bars, with the direction from the face to the eye: where
    // the face's cells can no longer be drawn as holes (by the metres one pixel covers ACROSS the face: this end's
    // own over the cosine between the face and the line of sight) and the face is seen aslant (by the share of
    // each hole the bars' depth hides), the bar goes over by degrees to the face's mean, the tone its plate takes.
    vec3 faceN = mat3(modelMatrix) * aFace.xyz;
    if (dot(faceN, faceN) > .25) {
      faceN = normalize(faceN);
      float seen = dot(faceN, toEye), mu = abs(seen), slant = ironSlant(mu), halfBar = .5 * min(breadth, depth);
      float open = ironOpen(aFace.w, halfBar, slant);
      vec3 mean = aMean * ${CLOSE.tone.toFixed(2)} * ironFall(normalize((seen < 0. ? -faceN : faceN) + toEye), wp.xyz);
      vShut = vec4(mix(mean, ironSky(-toEye), ${CLOSE.air.toFixed(2)} * open), ironShut(aFace.w, halfBar, mPerPx / max(mu, ${CLOSE.aslant.toFixed(3)}), slant) * (1. - open));
    }
  #else
    vec4 wp = modelMatrix * vec4(p, 1.);
  #endif
  vN = normalize(mat3(modelMatrix) * n); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  #ifdef PLATE
    vMpp = 2. * max(-mvPosition.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);   // the metres one pixel covers at this depth
  #endif
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const IRON_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${LIGHT_GLSL}
varying vec3 vCol, vN, vW, vMean;
varying float vThin;
varying vec4 vShut;
varying float vFace;
#ifdef PLATE
${MEAN_GLSL}
varying vec2 vUv; varying vec4 vDim; varying float vClose, vMpp;
#endif
void main() {
  vec3 N = normalize(vN);
  #ifdef PLATE
    // The face in its own coordinates, distances in metres. Its lattice: a diamond through the middles of the four
    // sides and a tie at each quarter height inside the face's cross and mid tie (pattern 0), or a cross alone
    // (pattern 1). Either way the bars cut the face into three-cornered cells of two sizes.
    // A FILTER BY A PIXEL'S FOOTPRINT, in two parts. THE BARS (a face that keeps no real fine bars): a line's half
    // breadth is its bar's, and never under half the members' least breadth in pixels times the metres one pixel
    // covers across the face. THE CELLS (every face): the bars round a cell are never drawn thinner than that
    // hold, so far off, or on a face seen aslant, the hole they leave shrinks to a pinhole of sky that comes and
    // goes. So the cell goes over to the face's MEAN by degrees (ironShut, by the hole in pixels across the face):
    // its plate comes in in the tone an open hole shows there (the sky's own along the eye's ray where the face
    // is seen square on; the iron's by the share of the hole that the bars' depth hides aslant) and ends in the
    // mean, the paint a little darker with its share of that sky; on a face seen aslant its real bars end in the
    // same tone (the vertex stage). Nothing translucent; in a cell not yet begun to close: nothing.
    if (!gl_FrontFacing) N = -N;
    vec3 ray = normalize(vW - cameraPosition);
    float mu = abs(dot(N, ray));
    vec2 q = abs(vUv - .5);
    float W = vDim.x, H = vDim.y, D = max(length(vDim.xy), 1e-3), diag = W * H / D;
    float px = vMpp / max(mu, ${CLOSE.aslant.toFixed(3)}), hold = max(.5 * vDim.z, ${(MIN_PIXELS / 2).toFixed(2)} * px);
    float d = vDim.w < .5 ? min(abs(q.x + q.y - .5) * diag, abs(q.y - .25) * H) : abs(q.x - q.y) * diag;
    // the radius of the round that fits in a cell, one number for the face (cellRound's two lines)
    float cell = vDim.w < .5 ? .125 * W * H * (1. / (W + D) + 1. / (W + D + H)) : .25 * W * H * (1. / (D + W) + 1. / (D + H));
    float slant = ironSlant(mu), shut = ironShut(cell, .5 * vDim.z, px, slant), open = ironOpen(cell, .5 * vDim.z, slant);
    bool bar = vClose < .5 && d <= hold;
    if (!bar && shut <= 0.) discard;
    // the mean's light: a lattice shows the eye the faces of its bars that are turned to it, so the mean is lit
    // half way between the face's own normal and the direction to the eye
    vec3 fall = ironFall(N, vW), sky = ironSky(ray), iron = vCol * ${CLOSE.tone.toFixed(2)} * ironFall(normalize(N - ray), vW);
    // a cell's tone: the iron's with the sky's by the share of the hole that is seen through (open): all of that
    // share where the cell begins to close, CLOSE.air of it where it has closed (the mean)
    gl_FragColor = vec4(bar ? mix(vCol * fall + ironSheen(N, vW) * uGloss, mix(iron, sky, ${CLOSE.air.toFixed(2)} * open), shut * (1. - open)) : mix(iron, sky, open * mix(1., ${CLOSE.air.toFixed(2)}, shut)), 1.);
  #else
    // A filter by a pixel's footprint on the shading, in two parts. A THIN BAR's light is the mean of its seen
    // faces and carries no highlight; a broad bar's is each face's own. And A FACE SEEN AS A SLIVER, turned so far
    // from the eye that it shows under a pixel or two broad (its breadth in pixels times the cosine between it and
    // the line of sight), takes that same mean and no gloss: its own light and its mirror image on a sliver are a
    // pale dash that comes and goes beside the bar's broad face.
    float sliver = 1. - smoothstep(${SLIVER[0].toFixed(2)}, ${SLIVER[1].toFixed(2)}, vFace * abs(dot(N, normalize(cameraPosition - vW))));
    float thin = max(clamp(vThin, 0., 1.), sliver);
    vec3 fall = mix(ironFall(N, vW), max(vMean, 0.), thin);
    gl_FragColor = vec4(vCol * fall + ironSheen(N, vW) * (uGloss * (1. - thin)), 1.);
    // a braced face's bar goes over to the face's mean as the face's cells close and the face is seen aslant
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vShut.rgb, clamp(vShut.a, 0., 1.));
  #endif
  #include <fog_fragment>
}
`;

// The uniforms the iron's three materials share. Any may be handed in by opts.uniforms as the world's own { value }
// (so that the world's dusk drives the iron with the rest); the others take opts' plain values or a dusk's defaults.
function ironUniforms(opts) {
  const given = opts.uniforms || {}, v3 = (a, d) => (a && a.isVector3 ? a.clone() : new THREE.Vector3().fromArray(a || d));
  const col = (a, d) => (a && a.isColor ? a.clone() : new THREE.Color().fromArray(a || d));
  const D = TOWER.decks;
  const U = {
    uKeyDir: { value: v3(opts.keyDir, [FRAME.afterglow.x * 0.94, 0.34, FRAME.afterglow.z * 0.94]).normalize() },   // toward the afterglow, low
    uKeyColor: { value: col(opts.keyColor, [0.95, 0.42, 0.22]) },         // WORKING: the afterglow's rose orange
    uSkyTop: { value: col(opts.skyTop, [0.10, 0.14, 0.26]) },             // WORKING: the dusk's blue from above
    uSkyHorizon: { value: col(opts.skyHorizon, [0.16, 0.13, 0.14]) },     // WORKING: its dim warm grey from below and the sides
    uAirLow: { value: col(opts.airLow, [0.15, 0.16, 0.37]) },             // WORKING: the dusk sky's own tone at the horizon and
    uAirHigh: { value: col(opts.airHigh, [0.014, 0.10, 0.24]) },          // half way up (the closed cells' share of sky): the world writes both
    uGlow: { value: col(opts.glow, [0, 0, 0]) },                          // the Bengal fire's red times its strength: the lamps write it
    uGlowY: { value: new THREE.Vector3(D[0].floor, D[1].floor, D[2].floor) },
    uGlowWave: { value: new THREE.Vector3(0, 0, 0) },                     // the phase of each deck's ripples in its red: the lamps write it, by the clock
    uGlowReach: { value: opts.glowReach ?? 13 },                          // WORKING: metres down the iron a deck's fire carries (up it: GLOW_REACH_UP)
    uPx: { value: new THREE.Vector2(720, opts.minPixels ?? MIN_PIXELS) },
  };
  for (const k of Object.keys(U)) if (given[k]) U[k] = given[k];
  return U;
}
function ironMaterial(U, gloss, plate) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uGloss: { value: gloss } },
    vertexShader: IRON_VERT, fragmentShader: IRON_FRAG, vertexColors: true, fog: true,
    defines: plate ? { PLATE: 1 } : {}, side: plate ? THREE.DoubleSide : THREE.FrontSide,
  });
  // bars that brace no face and carry no aFace of their own (the slender bars on the decks) read it as none
  m.defaultAttributeValues.aFace = [0, 0, 0, 0]; m.defaultAttributeValues.aMean = [0, 0, 0];
  return m;
}

// The unit box every member is an instance of: one metre each way about its middle, the face tones baked in its
// vertex colours (the underside darker, the top lighter, the two ends a little darker than the sides).
function unitBox() {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.deleteAttribute('uv');
  const n = g.attributes.normal, c = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) {
    const t = n.getY(i) > 0.5 ? TONE.top : n.getY(i) < -0.5 ? TONE.under : Math.abs(n.getZ(i)) > 0.5 ? TONE.end : TONE.side;
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = t;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

// One member's matrix written straight into an instance buffer at slot `at`: columns side times w, up times h, axis
// times length, and the midpoint. The side vector is level, as a kit beam's; up is turned so that it never points down.
function writeMember(arr, at, m) {
  const dx = m.bx - m.ax, dy = m.by - m.ay, dz = m.bz - m.az, L = Math.hypot(dx, dy, dz) || 1e-6;
  const ax = dx / L, ay = dy / L, az = dz / L, hl = Math.hypot(ax, az);
  let sx = 1, sz = 0;
  if (hl > 1e-5) { sx = az / hl; sz = -ax / hl; }               // level and square to the axis
  let ux = ay * sz, uy = az * sx - ax * sz, uz = -ay * sx;      // up = axis cross side
  if (uy < 0) { sx = -sx; sz = -sz; ux = -ux; uy = -uy; uz = -uz; }
  const o = at * 16;
  arr[o] = sx * m.w; arr[o + 1] = 0; arr[o + 2] = sz * m.w; arr[o + 3] = 0;
  arr[o + 4] = ux * m.h; arr[o + 5] = uy * m.h; arr[o + 6] = uz * m.h; arr[o + 7] = 0;
  arr[o + 8] = dx; arr[o + 9] = dy; arr[o + 10] = dz; arr[o + 11] = 0;
  arr[o + 12] = (m.ax + m.bx) / 2; arr[o + 13] = (m.ay + m.by) / 2; arr[o + 14] = (m.az + m.bz) / 2; arr[o + 15] = 1;
}

// The four bands of height the members are drawn in, each one instanced mesh, so that a view of the foot does not
// draw the shaft: to deck 1, to deck 2, to half way up the shaft, and above. By a member's middle.
const CULL_TOPS = [LV.deck1, LV.deck2, (LV.deck2 + LV.deck3) / 2];
function cullBand(m) { const y = (m.ay + m.by) / 2; let b = 0; while (b < 3 && y > CULL_TOPS[b]) b++; return b; }
const HOLD_PAD = 4;                                  // WORKING: metres a band's sphere is grown by, for what the pixel hold can add to a member

// A small accumulator of flat quads: place, normal (from the quad's own winding, a to b to c anticlockwise seen from
// outside) and colour, with a uv and a four-number attribute for the plates.
function makeQuads() {
  const pos = [], nor = [], col = [], uv = [], dim = [], shut = [], idx = [];
  const quad = (a, b, c, d, rgb, dims = null, close = 0) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const base = pos.length / 3, corners = [a, b, c, d], uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    for (let k = 0; k < 4; k++) {
      pos.push(corners[k][0], corners[k][1], corners[k][2]); nor.push(nx, ny, nz); col.push(rgb[0], rgb[1], rgb[2]);
      uv.push(uvs[k * 2], uvs[k * 2 + 1]);
      if (dims) { dim.push(dims[k][0], dims[k][1], dims[k][2], dims[k][3]); shut.push(close); }
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const toGeometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    if (dim.length) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
      g.setAttribute('aDim', new THREE.BufferAttribute(new Float32Array(dim), 4));
      g.setAttribute('aClose', new THREE.BufferAttribute(new Float32Array(shut), 1));
    }
    g.setIndex(pos.length / 3 > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
    return g;
  };
  return { quad, toGeometry, count: () => idx.length / 6 };
}

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// One face's plate: the quad itself, in the paint at its middle's height, carrying the face's breadth at its foot and
// head, its height, its bar's breadth and its pattern (0 the panel's diamond and quarter ties within its cross, 1 a
// cross alone: an arch's grille, a girder's face). real: the face's bars all stand as members (a near face's fine
// bars, a girder's cross), so the plate draws none of them and only closes the cells that fall under a few pixels.
function addPlate(Q, plate, i, real) {
  const c = plate.corners, k = plate.zone === 'shaft' ? 1 : 0;
  const bar = plate.pattern === 'grille' ? SIZE.archGrille : plate.pattern === 'none' ? SIZE.cross[k] : SIZE.fine[k], kind = plate.pattern === 'panel' ? 0 : 1;
  const w0 = dist3(c[0], c[1]), w1 = dist3(c[3], c[2]), h = (dist3(c[0], c[3]) + dist3(c[1], c[2])) / 2;
  Q.quad(c[0], c[1], c[2], c[3], plateTint(plate, i), [[w0, h, bar, kind], [w0, h, bar, kind], [w1, h, bar, kind], [w1, h, bar, kind]], real || plate.pattern === 'none' ? 1 : 0);
}
// a face's paint as its plate carries it: the paint at its middle's height times a tone of its own index
function plateTint(plate, i) {
  const c = plate.corners, tone = 0.92 + 0.16 * hash01(i + 7919), p = paintAt((c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4);
  return [p[0] * tone, p[1] * tone, p[2] * tone];
}
// What a face hands the bars that brace it, for their going over to its mean: its normal, its tint and the round
// that fits in a cell of each kind of bar (the fine pattern's cells, or the cross's own four; a grille's and a
// girder's face have the cross's alone). Eight numbers written at `at` of `out`.
function faceMean(plate, i, out, at) {
  const c = plate.corners, e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], e2 = [c[3][0] - c[0][0], c[3][1] - c[0][1], c[3][2] - c[0][2]];
  const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], l = Math.hypot(nx, ny, nz) || 1;
  const W = (dist3(c[0], c[1]) + dist3(c[3], c[2])) / 2, H = (dist3(c[0], c[3]) + dist3(c[1], c[2])) / 2, t = plateTint(plate, i);
  out[at] = nx / l; out[at + 1] = ny / l; out[at + 2] = nz / l;
  out[at + 3] = cellRound(W, H, plate.pattern === 'panel' ? 0 : 1); out[at + 4] = cellRound(W, H, 1);
  out[at + 5] = t[0]; out[at + 6] = t[1]; out[at + 7] = t[2];
}

// THE FOUR FOOTINGS (SOURCED: figures.md A, "Footings": 25 m square, 5.4 high, a rusticated block with a cove
// above; the South pier's glazed roof): each a masonry block 25 m square and 5.4 m high under one leg, centred on the table's ground
// row. Its profile is WORKING (the sources give "a rusticated block with a cove above"): a plinth, a body of four
// rusticated courses set back from it, a hollow cove that swings out again, and a cap slab; the legs' shoes stand in it.
// THE SOUTH FOOTING, over the machines, has a glazed roof (the builder's book). Its form is WORKING: in place of the
// cap's flat stone top a low hipped roof of glass panes, from eaves a little over the cap's foot up to a flat middle
// at the footing's own height, so that it stays inside the block and under the lifts' lowest places.
const FOOT = { plinth: 0.9, setBack: 0.4, courses: 4, coveFrom: 4.3, capFrom: 5.0, joint: 0.12, blocks: 9, coveSteps: 4,
  glass: { eaves: 0.25, flat: 4.5, across: 8, rows: 3, rgb: [0.17, 0.25, 0.29] } };
function addFooting(Q, sign, serial, glazed = false) {
  const half = ST.footing.side / 2, top = ST.footing.height, mid = (TOWER.outline[0][1] + TOWER.outline[0][2]) / 2;
  const cx = sign[0] * mid, cz = sign[1] * mid, body = half - FOOT.setBack;
  const OUT = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const tint = (t) => [STONE[0] * t, STONE[1] * t, STONE[2] * t];
  // a point of face f: `t` along the face, at a height, `h` out from the centre
  const P = (f, t, y, h) => { const o = OUT[f]; return [cx + o[0] * h + o[1] * t, y, cz + o[1] * h - o[0] * t]; };
  // four faces between the square of half side h0 at y0 and the square of half side h1 at y1
  const band = (h0, y0, h1, y1, t) => { for (let f = 0; f < 4; f++) Q.quad(P(f, -h0, y0, h0), P(f, h0, y0, h0), P(f, h1, y1, h1), P(f, -h1, y1, h1), tint(t)); };
  band(half, 0, half, FOOT.plinth, 0.96);
  band(half, FOOT.plinth, body, FOOT.plinth, 1.0);                          // the plinth's ledge
  band(body - FOOT.joint, FOOT.plinth, body - FOOT.joint, FOOT.coveFrom, 0.5);   // the joints' depth, behind the blocks
  // the rusticated courses: blocks standing proud of the joints, every other course shifted half a block
  const ch = (FOOT.coveFrom - FOOT.plinth) / FOOT.courses, bl = 2 * body / FOOT.blocks, g = FOOT.joint / 2;
  let n = serial * 1000;
  for (let j = 0; j < FOOT.courses; j++) for (let f = 0; f < 4; f++) {
    const y0 = FOOT.plinth + j * ch + g, y1 = FOOT.plinth + (j + 1) * ch - g;
    for (let b = -1; b < FOOT.blocks; b++) {
      const t0 = Math.max(-body, -body + (b + (j & 1) * 0.5) * bl + g), t1 = Math.min(body, -body + (b + 1 + (j & 1) * 0.5) * bl - g);
      if (t1 - t0 < 0.2) continue;
      Q.quad(P(f, t0, y0, body), P(f, t1, y0, body), P(f, t1, y1, body), P(f, t0, y1, body), tint(0.9 + 0.2 * hash01(n++)));
    }
  }
  // the cove: a hollow quarter round from the body's face out to the cap's
  const rise = FOOT.capFrom - FOOT.coveFrom;
  for (let i = 0; i < FOOT.coveSteps; i++) {
    const a0 = Math.PI / 2 * i / FOOT.coveSteps, a1 = Math.PI / 2 * (i + 1) / FOOT.coveSteps;
    band(body + FOOT.setBack * (1 - Math.cos(a0)), FOOT.coveFrom + rise * Math.sin(a0), body + FOOT.setBack * (1 - Math.cos(a1)), FOOT.coveFrom + rise * Math.sin(a1), 0.98);
  }
  if (!glazed) {
    band(half, FOOT.capFrom, half, top, 1.02);
    Q.quad([cx - half, top, cz + half], [cx + half, top, cz + half], [cx + half, top, cz - half], [cx - half, top, cz - half], tint(1.04));
    return;
  }
  // the glazed roof: four hipped slopes of panes and a flat middle of panes, each pane with a tone of its own
  const G = FOOT.glass, ye = FOOT.capFrom + G.eaves, pane = () => { const t = 0.7 + 0.6 * hash01(n++); return [G.rgb[0] * t, G.rgb[1] * t, G.rgb[2] * t]; };
  band(half, FOOT.capFrom, half, ye, 1.02);
  for (let f = 0; f < 4; f++) for (let r = 0; r < G.rows; r++) for (let a = 0; a < G.across; a++) {
    const h0 = half + (G.flat - half) * r / G.rows, h1 = half + (G.flat - half) * (r + 1) / G.rows;
    const y0 = ye + (top - ye) * r / G.rows, y1 = ye + (top - ye) * (r + 1) / G.rows, u0 = 2 * a / G.across - 1, u1 = 2 * (a + 1) / G.across - 1;
    Q.quad(P(f, u0 * h0, y0, h0), P(f, u1 * h0, y0, h0), P(f, u1 * h1, y1, h1), P(f, u0 * h1, y1, h1), pane());
  }
  const m = G.across / 2, w = 2 * G.flat / m;
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
    const x0 = cx - G.flat + i * w, z0 = cz - G.flat + j * w;
    Q.quad([x0, top, z0 + w], [x0 + w, top, z0 + w], [x0 + w, top, z0], [x0, top, z0], pane());
  }
}

// THE IRON DRAWN. ctx: the engine's (yield; renderer if there is one). opts: uniforms (the world's own { value }
// objects by name, see ironUniforms), keyDir, keyColor, skyTop, skyHorizon, glow, glowReach, gloss (the mirror's strength, 1), minPixels
// (1.5), reach (FINE_REACH), stoneUniforms (uniforms by name that the footings' masonry takes in place of the
// iron's, as its two fills). Returns { object, triangles, calls, update(dt, time), dispose(), uniforms, stats }.
// update writes one uniform (the drawing buffer's height, for the pixel hold) and moves nothing: the iron stands still.
export async function buildIron(ctx, opts = {}) {
  const reach = opts.reach ?? FINE_REACH, gloss = opts.gloss ?? 1;
  const U = ironUniforms(opts);
  const iron = ironMaterial(U, gloss, false), lace = ironMaterial(U, gloss, true);
  // the footings' masonry may take fills of its own (the world's plain stone light) in place of the iron's
  const stone = ironMaterial({ ...U, ...(opts.stoneUniforms || {}) }, 0, false);
  const object = new THREE.Group(); object.name = 'iron';
  const box = unitBox();
  await ctx.yield();
  const bag = await buildAllInSteps(() => ctx.yield()), M = bag.members, P = bag.plates;
  await ctx.yield();

  // the level of detail by where the route runs: which faces keep their fine bars, decided here once
  const near = new Uint8Array(P.length);
  let nearCount = 0;
  for (let i = 0; i < P.length; i++) {
    const f = faceReach(P[i]);
    if (f.distance - f.radius < reach) { near[i] = 1; nearCount++; }
    if ((i & 127) === 127) await ctx.yield();
  }
  await ctx.yield();

  // which members are built, and how many stand in each band of height
  const keep = new Uint8Array(M.length), bandOf = new Uint8Array(M.length), counts = [0, 0, 0, 0];
  const byWeight = { heavy: 0, medium: 0, fine: 0 };
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    if (m.weight !== 'fine' || (m.panel >= 0 && near[m.panel])) { keep[i] = 1; bandOf[i] = cullBand(m); counts[bandOf[i]]++; byWeight[m.weight]++; }
    if ((i & 511) === 511) await ctx.yield();
  }
  await ctx.yield();

  // the face each built bar braces (or -1), for its going over to that face's mean: a fine bar's is its panel; a
  // cross's arm and a mid tie are found by their two ends, which are the face's own corners and sides' middles
  const FM = new Float32Array(P.length * 8), ends = new Map(), faceOf = new Int32Array(M.length).fill(-1);
  const endsKey = (a, b) => a[0] + ',' + a[1] + ',' + a[2] + ',' + b[0] + ',' + b[1] + ',' + b[2];
  for (let i = 0; i < P.length; i++) {
    const c = P[i].corners;
    faceMean(P[i], i, FM, i * 8);
    ends.set(endsKey(c[0], c[2]), i); ends.set(endsKey(c[1], c[3]), i);
    if (P[i].pattern === 'panel') ends.set(endsKey(mix(c[0], c[3], 0.5), mix(c[1], c[2], 0.5)), i);
    if ((i & 127) === 127) await ctx.yield();
  }
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    if (keep[i] && m.weight === 'fine') faceOf[i] = m.panel;
    else if (keep[i] && m.weight === 'medium' && (m.group.endsWith(':cross') || m.group.endsWith(':midtie'))) {
      const f = ends.get(endsKey([m.ax, m.ay, m.az], [m.bx, m.by, m.bz]));
      if (f !== undefined) faceOf[i] = f;
    }
    if ((i & 511) === 511) await ctx.yield();
  }
  await ctx.yield();

  // one box to a band, each with its own instances' faces (aFace: the normal and the cell's round; aMean: the tint)
  const meshes = [], fill = [0, 0, 0, 0], boxes = [];
  for (let b = 0; b < 4; b++) {
    const geo = box.clone();
    geo.setAttribute('aFace', new THREE.InstancedBufferAttribute(new Float32Array(counts[b] * 4), 4));
    geo.setAttribute('aMean', new THREE.InstancedBufferAttribute(new Float32Array(counts[b] * 3), 3));
    const mesh = new THREE.InstancedMesh(geo, iron, counts[b]);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(counts[b] * 3), 3);
    mesh.name = 'iron-band-' + b; mesh.matrixAutoUpdate = false;
    meshes.push(mesh); boxes.push(geo);
    await ctx.yield();
  }
  // every built member: its matrix and its colour (the paint at its middle's height times a tone of its own index)
  for (let i = 0; i < M.length; i++) {
    if (keep[i]) {
      const m = M[i], b = bandOf[i], at = fill[b]++, mesh = meshes[b], c = mesh.instanceColor.array, p = paintAt((m.ay + m.by) / 2);
      writeMember(mesh.instanceMatrix.array, at, m);
      const tone = 0.9 + 0.2 * hash01(i);
      c[at * 3] = p[0] * tone; c[at * 3 + 1] = p[1] * tone; c[at * 3 + 2] = p[2] * tone;
      const f = faceOf[i];
      if (f >= 0) {
        const fa = boxes[b].attributes.aFace.array, fm = boxes[b].attributes.aMean.array, o = f * 8;
        fa[at * 4] = FM[o]; fa[at * 4 + 1] = FM[o + 1]; fa[at * 4 + 2] = FM[o + 2]; fa[at * 4 + 3] = FM[m.weight === 'fine' ? o + 3 : o + 4];
        fm[at * 3] = FM[o + 5]; fm[at * 3 + 1] = FM[o + 6]; fm[at * 3 + 2] = FM[o + 7];
      }
    }
    if ((i & 511) === 511) await ctx.yield();
  }
  let triangles = 0, calls = 0;
  for (const mesh of meshes) {
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    await ctx.yield();
    mesh.computeBoundingSphere();
    mesh.boundingSphere.radius += HOLD_PAD;
    if (mesh.count) { object.add(mesh); triangles += mesh.count * 12; calls++; }
    await ctx.yield();
  }

  // the lattice plates, in one mesh: a plate to every face. A face that keeps no fine bars has them drawn on its
  // plate; every face's plate closes the cells of its lattice where they fall under a few pixels.
  const QP = makeQuads();
  for (let i = 0; i < P.length; i++) {
    addPlate(QP, P[i], i, near[i] === 1);
    if ((i & 127) === 127) await ctx.yield();
  }
  const built = [box, ...boxes], plateCount = QP.count();
  if (plateCount) {
    const g = QP.toGeometry(); g.computeBoundingSphere(); built.push(g);
    const mesh = new THREE.Mesh(g, lace); mesh.name = 'iron-plates'; mesh.matrixAutoUpdate = false;
    object.add(mesh); triangles += plateCount * 2; calls++;
  }
  await ctx.yield();

  // the four footings, in one mesh
  const QF = makeQuads();
  let serial = 0;
  for (const [leg, sign] of Object.entries(TOWER.legs)) { addFooting(QF, sign, serial++, leg === 'south'); await ctx.yield(); }
  const gf = QF.toGeometry(); gf.computeBoundingSphere(); built.push(gf);
  const footings = new THREE.Mesh(gf, stone); footings.name = 'iron-footings'; footings.matrixAutoUpdate = false;
  object.add(footings); triangles += QF.count() * 2; calls++;
  await ctx.yield();

  const size = new THREE.Vector2();
  return {
    object, triangles, calls, uniforms: U,
    stats: { members: M.length, built: counts[0] + counts[1] + counts[2] + counts[3], byWeight, bands: counts, faces: P.length, nearFaces: nearCount, plates: plateCount, footingQuads: QF.count(), reach },
    update(dt, time) { if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uPx.value.x = size.y; } },
    dispose() { for (const g of built) g.dispose(); for (const m of meshes) m.dispose(); iron.dispose(); lace.dispose(); stone.dispose(); },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE DECKS, THE CROWN AND THE LIFTS (buildDecks), and the whole tower (buildHero)
//
// What stands on the iron: the three decks with their galleries, pavilions and landings, the glazed room and the
// terrace, the lantern, cupola, rod and flag, and the six lift cars on their rails. Four meshes: the solids, the
// slender bars, the flags and the cars, as the head of this file names them with their movers and their filters.

const DK = TOWER.decks, CR = TOWER.crown;
const ZINC = [0.34, 0.37, 0.40];                     // WORKING: the roofs' zinc under a dusk sky, linear
const TIMBER = [0.20, 0.105, 0.05];                  // WORKING: the timber pavilions' varnished wood
const STAFF = [0.62, 0.59, 0.52];                    // WORKING: the French pavilion's white staff
const MAST_TINT = 0.2;                               // WORKING: the flag masts' dark paint beside it: a mast is held a pixel and a half broad far off, and a pale
                                                     // one would stand over the deck like a lit lamp in the dusk
const FLOOR = [0.115, 0.075, 0.05];                  // WORKING: the decks' planking
const GILT = [0.50, 0.33, 0.085];                    // WORKING: the cupola, near gold, and the arcades' gilt crescents
const WARM = [1.0, 0.62, 0.25];                      // WORKING: lamplight through a window, linear, before its strength
const CLOTH = { blue: [0.02, 0.06, 0.34], white: [0.36, 0.36, 0.35], red: [0.56, 0.03, 0.035], gold: [0.60, 0.40, 0.06] };   // WORKING
const paint = (band, t = 1) => [PAINT[band][0] * t, PAINT[band][1] * t, PAINT[band][2] * t];
const tint = (c, t) => [c[0] * t, c[1] * t, c[2] * t];

// The skins a solid's vertex may carry, as [kind, p, q, glow]:
const SKIN = {
  plain: [0, 0, 0, 0],
  // a surface that gives light of its own colour (the lantern's glazing): glow is its strength
  lamp: (glow) => [0, 0, 0, glow],
  // a wall of lit windows: uv counts window cells; p and q are the pane's half breadth and half height as shares of a cell
  windows: (p, q, glow) => [1, p, q, glow],
  // the arcaded gallery: uv.x counts arcades, uv.y metres above the gallery's floor; p the arcade's breadth, q their count
  arcade: (p, q) => [2, p, q, 0],
  // a railing with posts: uv.x counts bays, uv.y metres above the floor; p the bay's breadth, q the rail's height,
  // glow the height above which a head band is solid (0: none)
  posts: (p, q, head) => [3, p, q, head],
};

// An accumulator of flat faces with the skin: place, normal (from the winding, a to b to c anticlockwise seen from
// outside), colour, uv and skin for every vertex.
function makeSkin() {
  const pos = [], nor = [], col = [], uv = [], skin = [], idx = [];
  const UV4 = [[0, 0], [1, 0], [1, 1], [0, 1]];
  // toward, if given, is a direction the face must look to: the points are taken the other way round if it does not
  const face = (pts, rgb, sk = SKIN.plain, uvs = UV4, toward = null) => {
    const a = pts[0], b = pts[1], d = pts[pts.length - 1];
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const n = pts.length, turn = toward && nx * toward[0] + ny * toward[1] + nz * toward[2] < 0;
    if (turn) { nx = -nx; ny = -ny; nz = -nz; }
    const base = pos.length / 3;
    for (let j = 0; j < n; j++) {
      const k = turn ? n - 1 - j : j;
      pos.push(pts[k][0], pts[k][1], pts[k][2]); nor.push(nx, ny, nz); col.push(rgb[0], rgb[1], rgb[2]);
      uv.push(uvs[k % uvs.length][0], uvs[k % uvs.length][1]); skin.push(sk[0], sk[1], sk[2], sk[3]);
    }
    for (let k = 1; k + 1 < pts.length; k++) idx.push(base, base + k, base + k + 1);   // a fan: the face is convex
  };
  const S = {
    face,
    quad: (a, b, c, d, rgb, sk, uvs, toward) => face([a, b, c, d], rgb, sk, uvs, toward),
    // a level face in plan order (x, z pairs) at a height, seen from above (up true) or from below
    level(plan, y, up, rgb, sk) {
      const pts = plan.map((p) => [p[0], y, p[1]]);
      // plan order anticlockwise in (x, z) faces down by the winding rule; turn it for the side asked
      let area = 0;
      for (let i = 0; i < plan.length; i++) { const p = plan[i], q = plan[(i + 1) % plan.length]; area += p[0] * q[1] - q[0] * p[1]; }
      if ((area > 0) === up) pts.reverse();
      face(pts, rgb, sk);
    },
    // an upright wall between two places in plan, from height y0 to y1, facing the side (ox, oz);
    // uv runs from u0 over us across it and from vs0 to vs1 up it
    wall(ax, az, bx, bz, y0, y1, ox, oz, rgb, sk, us = 1, vs0 = 0, vs1 = 1, u0 = 0) {
      // order the two ends so that the face's normal points to (ox, oz)
      const flip = (bz - az) * ox - (bx - ax) * oz > 0;
      const p = flip ? [bx, bz] : [ax, az], q = flip ? [ax, az] : [bx, bz];
      face([[p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]], rgb, sk, [[u0, vs0], [u0 + us, vs0], [u0 + us, vs1], [u0, vs1]]);
    },
    // an upright box: its four walls, its top and (if asked) its underside
    box(x0, x1, y0, y1, z0, z1, rgb, o = {}) {
      const sk = o.skin || SKIN.plain, top = o.top || rgb, us = o.us || [1, 1], vs = o.vs || 1;
      S.wall(x0, z1, x1, z1, y0, y1, 0, 1, rgb, sk, us[0], 0, vs);
      S.wall(x0, z0, x1, z0, y0, y1, 0, -1, rgb, sk, us[0], 0, vs);
      S.wall(x1, z0, x1, z1, y0, y1, 1, 0, rgb, sk, us[1], 0, vs);
      S.wall(x0, z0, x0, z1, y0, y1, -1, 0, rgb, sk, us[1], 0, vs);
      if (o.top !== null) S.level([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y1, true, top);
      if (o.under) S.level([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, false, tint(rgb, 0.7));
    },
    triangles: () => idx.length / 3,
    toGeometry() {
      const g = new THREE.BufferGeometry(), f32 = (a) => new Float32Array(a);
      g.setAttribute('position', new THREE.BufferAttribute(f32(pos), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(f32(nor), 3));
      g.setAttribute('color', new THREE.BufferAttribute(f32(col), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(f32(uv), 2));
      g.setAttribute('aSkin', new THREE.BufferAttribute(f32(skin), 4));
      g.setIndex(pos.length / 3 > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
      return g;
    },
  };
  return S;
}

// The arcades of the first gallery (SOURCED: figures.md A, "Deck 1": 9 arcades a face, each split into two
// half-round arches, 6.94 to the key), in metres above the gallery's floor: a balustrade, then in each arcade two
// half-round arches on columns, and over them the crescent under the arcade's own arch, keyed at the deck's 6.94 m.
// THE CRESCENT'S GILT: INVENTED BY NEED (the sources give the arches, not the tone of the field left between them;
// a tone it must have, and in the iron's own paint it reads as a blank wall over every arcade).
const ARCADE = { column: 0.4, rail: 1.0, spring: 3.3, key: DK[0].arcadeKey, crest: 0.55 };   // WORKING but the key
const POST = 0.3;                                    // WORKING: the breadth of a railing's post

// The solids' and the cars' program. The skin picks what a face is; the light is the iron's own.
const DECK_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aSkin;
#ifdef USE_INSTANCING
attribute float aCar;                   // 1 for a lit car, 0 for a counterweight truck (plain paint: no panes, no light)
#endif
varying vec3 vCol, vN, vW; varying vec2 vUv; varying vec4 vSkin;
void main() {
  vec4 wp = vec4(position, 1.); vec3 n = normal;
  vCol = color; vUv = uv; vSkin = aSkin;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp; n = normalize(mat3(instanceMatrix) * n); vSkin.xw *= aCar;
  #endif
  wp = modelMatrix * wp;
  vN = normalize(mat3(modelMatrix) * n); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const DECK_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${LIGHT_GLSL}
uniform float uTime, uLit;
uniform vec3 uWarm;
varying vec3 vCol, vN, vW; varying vec2 vUv; varying vec4 vSkin;
float cell(vec2 c) { return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 N = normalize(vN), alb = vCol, glow = vec3(0.);
  if (!gl_FrontFacing) N = -N;
  float kind = vSkin.x;
  vec2 fw = fwidth(vUv);
  if (kind < .5) {
    glow = vCol * vSkin.w * uLit;
  } else if (kind < 1.5) {
    // lit windows: one pane a cell, its edge eased over a pixel's footprint; each pane has a strength of its own
    // and a slow small flicker of the gas by the clock
    vec2 c = floor(vUv), q = abs(fract(vUv) - .5), e = max(fw, vec2(1e-4));
    float pane = clamp((vSkin.y - q.x) / e.x + .5, 0., 1.) * clamp((vSkin.z - q.y) / e.y + .5, 0., 1.);
    // as the cells shrink under a pixel the wall goes to the panes' mean light
    float tiny = clamp(max(fw.x, fw.y) - .5, 0., 1.);
    pane = mix(pane, 4. * vSkin.y * vSkin.z, tiny);
    float h = cell(c), own = mix(.55 + .45 * h, .78, tiny);
    own *= 1. + .06 * sin(uTime * (5. + 4. * h) + h * 40.) * (1. - tiny);
    glow = uWarm * (vSkin.w * uLit * own * pane);
    alb = mix(alb, vec3(.02), pane);
  } else if (kind < 2.5) {
    // the arcaded gallery, in metres about the arcade's middle and above the gallery's floor
    float w = vSkin.y, x = (fract(vUv.x) - .5) * w, y = vUv.y;
    float r = w * .25 - ${(ARCADE.column / 2).toFixed(3)}, xs = abs(x) - w * .25, hs = ${ARCADE.spring.toFixed(3)};
    // how far inside an opening this place is (negative: in the solid)
    float d = y < hs ? min(r - abs(xs), y - ${ARCADE.rail.toFixed(3)}) : r - length(vec2(xs, y - hs));
    if (vUv.x < 0. || vUv.x > vSkin.z) d = -1.;
    // a filter by a pixel's footprint: a column is never drawn narrower than about 1.3 pixels
    float px = max(fw.x * w, fw.y);
    if (d > max(0., .65 * px - ${(ARCADE.column / 2).toFixed(3)})) discard;
    // the gilt crescent between the two small arches and the arcade's own arch
    vec2 k = vec2(x / (w * .5 - ${(ARCADE.column / 2).toFixed(3)}), (y - hs) / ${(ARCADE.key - ARCADE.spring).toFixed(3)});
    if (y > hs && dot(k, k) < 1.) alb = mix(alb, vec3(${GILT.map((v) => v.toFixed(3)).join(', ')}), .7);
  } else {
    // a railing: solid to the rail's height, a post at each bay's edge, a head band above vSkin.w
    float w = vSkin.y, x = (.5 - abs(fract(vUv.x) - .5)) * w, y = vUv.y;
    float px = max(fw.x * w, fw.y);
    bool keep = y < vSkin.z || x < max(${(POST / 2).toFixed(3)}, .65 * px) || (vSkin.w > 0. && y > vSkin.w);
    if (!keep) discard;
  }
  gl_FragColor = vec4(ironLight(alb, N, vW, kind < .5 ? 1. : .3) + glow, 1.);
  #include <fog_fragment>
}
`;

// The flags' cloth. A vertex stands on its mast at its own height; aFly gives its distance along the cloth from the
// mast, the cloth's whole length and the flag's phase. The cloth streams down a wind that swings slowly, with a wave
// that runs out along it and grows from the mast, and its fly end's hoist closes and opens a little.
// The cloth never reaches farther from its mast than its own length: a point at distance s lies FLAG.reach * s down
// the wind and no more than FLAG.wave * s aside, and reach squared plus wave squared is under 1.
const FLAG = { wind: 0.9, swing: 0.5, swingRate: 0.23, reach: 0.93, wave: 0.3, waveMax: 0.55, ripple: 1.9, rate: 5.2, squeeze: 0.08 };   // WORKING
// The same working as the vertex shader's, for the counts: the place of the cloth's point at distance s from the mast
// and height y (on the mast) at a clock. flag: { x, z, y1, length, phase }.
export function flagPointAt(flag, s, y, time) {
  const a = FLAG.wind + FLAG.swing * Math.sin(time * FLAG.swingRate + flag.phase * 6.2831853), dx = Math.cos(a), dz = Math.sin(a);
  const run = s * FLAG.ripple - time * FLAG.rate + flag.phase * 6.2831853;
  const off = Math.min(FLAG.wave * s, FLAG.waveMax) * Math.sin(run);
  const yy = flag.y1 - (flag.y1 - y) * (1 - FLAG.squeeze * (s / flag.length) * (0.5 + 0.5 * Math.sin(run * 0.5)));
  return [flag.x + dx * FLAG.reach * s - dz * off, yy, flag.z + dz * FLAG.reach * s + dx * off];
}
const g3 = (v) => v.toFixed(4);
const FLAG_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aFly;                    // distance along the cloth from the mast, the cloth's length, phase, the hoist's top
uniform float uTime;
varying vec3 vCol, vN, vW;
void main() {
  float s = aFly.x, ph = aFly.z * 6.2831853;
  float a = ${g3(FLAG.wind)} + ${g3(FLAG.swing)} * sin(uTime * ${g3(FLAG.swingRate)} + ph);
  vec2 d = vec2(cos(a), sin(a));
  float run = s * ${g3(FLAG.ripple)} - uTime * ${g3(FLAG.rate)} + ph;
  float amp = min(${g3(FLAG.wave)} * s, ${g3(FLAG.waveMax)}), off = amp * sin(run);
  vec3 p = position;
  p.y = aFly.w - (aFly.w - p.y) * (1. - ${g3(FLAG.squeeze)} * (s / aFly.y) * (.5 + .5 * sin(run * .5)));
  p.x += d.x * ${g3(FLAG.reach)} * s - d.y * off;
  p.z += d.y * ${g3(FLAG.reach)} * s + d.x * off;
  // the cloth's normal: its side, turned by the wave's slope
  vec2 nn = normalize(vec2(-d.y, d.x) * ${g3(FLAG.reach)} - d * (amp * ${g3(FLAG.ripple)} * cos(run)));
  vCol = color;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * vec3(nn.x, 0., nn.y)); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FLAG_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${LIGHT_GLSL}
varying vec3 vCol, vN, vW;
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  // cloth lets a little of the light behind it through, so the side turned from the glow is not black
  vec3 c = ironLight(vCol, N, vW, 0.) + .35 * ironLight(vCol, -N, vW, 0.);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// THE LIFTS (SOURCED: figures.md A, "Lifts": the makers, the legs and the runs; the trucks are INVENTED BY NEED, see
// TRUCK_OFF). Eight movers: the six cars of TOWER.lifts in its order, then the counterweight trucks of the two Otis
// lifts. A leg's car runs its lift's line up the inside of its leg from just over the footing's top (the station in
// the pier's base is in the masonry) to its deck; the upper Edoux car stops with its roof under deck 3's floor.
// A truck runs the other way up the middle of its leg, between a little over the footing and deck 1's floor beams.
// Sizes (with the wells and the trucks' lines, above), periods and rests are WORKING (the sources give the makers and the runs, not these); the cars are quicker
// than the true ones (about 3, 2 and 2 m a second for 2, 1 and 0.9) so that their motion reads.
const LIFT_REST = 0.1;                               // the share of a round rested at each end
// WORKING: where in its round each lift is at clock 0. SOURCED (figures A): the Edoux pair move opposite ways at
// every clock, so the two share one place in the round (the upper car runs it backward) and rest together, one at
// the second platform and one at the third, or side by side half way up.
const LIFT_PHASE = [0.12, 0.62, 0.33, 0.83, 0.25, 0.25];

// a track from a lift's segments: its points with the metres to each, cut below a height
function makeTrack(segments, fromY, toY, off = [0, 0]) {
  const raw = [segments[0].a, ...segments.map((s) => s.b)], pts = [];
  const cut = (a, b, y) => mix(a, b, (y - a[1]) / (b[1] - a[1]));
  for (let i = 0; i + 1 < raw.length; i++) {
    const a = raw[i], b = raw[i + 1];
    if (b[1] <= fromY || a[1] >= toY || b[1] - a[1] < 1e-9) continue;
    if (!pts.length) pts.push(a[1] < fromY ? cut(a, b, fromY) : a);
    pts.push(b[1] > toY ? cut(a, b, toY) : b);
  }
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + dist3(pts[i - 1], pts[i]));
  return { pts: pts.map((p) => [p[0] + off[0], p[1], p[2] + off[1]]), len, length: len[len.length - 1] };
}
function trackAt(track, share) {
  const d = Math.min(1, Math.max(0, share)) * track.length;
  let i = 0;
  while (i + 2 < track.len.length && track.len[i + 1] < d) i++;
  return mix(track.pts[i], track.pts[i + 1], (d - track.len[i]) / (track.len[i + 1] - track.len[i]));
}
// the level direction of a mover's long side: across its leg's diagonal, so that its short side lies up the leg; along X in the shaft
const longAxis = (leg) => (leg ? [TOWER.legs[leg][1] * Math.SQRT1_2, -TOWER.legs[leg][0] * Math.SQRT1_2] : [1, 0]);
function makeMovers() {
  const movers = [], foot = ST.footing.height + 0.2;
  TOWER.lifts.forEach((l, i) => {
    const size = CAR[l.maker], top = l.segments[l.segments.length - 1].b[1];
    const toY = l.name === 'edoux-upper' ? top - size.high - 0.3 : top;
    movers.push({ name: l.name, maker: l.maker, leg: l.leg, size, lit: 1, lift: i, along: longAxis(l.leg),
      track: makeTrack(l.segments, l.leg ? foot : -1, toY), from: 0, to: 1, back: l.name === 'edoux-upper' });
  });
  for (const i of [0, 1]) {
    const l = TOWER.lifts[i], s = TOWER.legs[l.leg];
    movers.push({ name: l.name + '-truck', maker: 'truck', leg: l.leg, size: CAR.truck, lit: 0, lift: i, along: longAxis(l.leg),
      track: makeTrack(l.segments, foot, TRUCK_TOP, [s[0] * TRUCK_OFF, s[1] * TRUCK_OFF]), from: TRUCK_FROM, to: 1, back: true });
  }
  return movers;
}
let MOVERS = null;                                   // worked at the first asking, not while this file loads
export function liftMovers() { return MOVERS || (MOVERS = makeMovers()); }

// The share of its way up a lift is at a clock: a rest at the foot, an eased ride up, a rest at the head, an eased ride down.
function rideShare(time, period, phase) {
  const f = ((time / period + phase) % 1 + 1) % 1, m = 0.5 - LIFT_REST, e = (t) => t * t * (3 - 2 * t);
  if (f < LIFT_REST) return 0;
  if (f < 0.5) return e((f - LIFT_REST) / m);
  if (f < 0.5 + LIFT_REST) return 1;
  return 1 - e((f - 0.5 - LIFT_REST) / m);
}
// The share of its own track a mover stands at, at a clock (a truck and the upper Edoux car run against their lift).
export function liftShareAt(index, time) {
  const m = liftMovers()[index], p = rideShare(time, CAR[TOWER.lifts[m.lift].maker].period, LIFT_PHASE[m.lift]);
  return m.from + (m.to - m.from) * (m.back ? 1 - p : p);
}
// A mover's place at a clock, a pure function of the clock: the middle of its floor, [x, y, z].
export function liftCarAt(index, time) { return trackAt(liftMovers()[index].track, liftShareAt(index, time)); }

// A place on face f of a square about the axis: t across the face, h out from the axis, as [x, z] and as [x, y, z].
const plan2 = (f, t, h) => [FACE[f][0] * t + FACE[f][2] * h, FACE[f][1] * t + FACE[f][3] * h];
const plan3 = (f, t, y, h) => [FACE[f][0] * t + FACE[f][2] * h, y, FACE[f][1] * t + FACE[f][3] * h];
const outOf = (f) => [FACE[f][2], 0, FACE[f][3]];
// a slender bar for the bars' mesh: a member of the given breadth and colour
const bar = (bars, a, b, w, rgb) => bars.push({ ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], w, h: w, rgb });
// a closed square at a half side and a height, as a polyline whose last point is its first
const squareLoop = (half, y) => [[-half, y, -half], [half, y, -half], [half, y, half], [-half, y, half], [-half, y, -half]];

// A level floor as the cells of a grid of lines (the same lines both ways), leaving out the cells for which skip(i, j)
// holds: its top at y and its underside `thick` below.
function floorCells(S, lines, y, thick, skip, rgb) {
  for (let i = 0; i + 1 < lines.length; i++) for (let j = 0; j + 1 < lines.length; j++) {
    if (skip(i, j)) continue;
    const c = [[lines[i], lines[j]], [lines[i + 1], lines[j]], [lines[i + 1], lines[j + 1]], [lines[i], lines[j + 1]]];
    S.level(c, y, true, rgb); S.level(c, y - thick, false, tint(rgb, 0.6));
  }
}

const SLAB = 0.3;                                    // WORKING: the floors' planking and joists, metres
const FRIEZE = { y0: 52.4, out: 0.75, console: 0.5 };   // WORKING: the plain band's foot, how far it stands out from the rafters' plane
                                                     // (clear of the rafters' own faces at any range), and a console's breadth
const WINDOW_GLOW = 1.6;                             // WORKING: a lit window's strength before the world's own lamp level
const RAIL_H = 1.1;                                  // WORKING: a railing's height
const FIRE_OUT = 0.5;                                // WORKING: a Bengal fire burns this far outside its platform's rail, at the rail's height (the sources give the platforms, not where on them)

// DECK 1: the floor with its central opening and lift wells, the plain frieze and the cove under the gallery, the
// gallery's floor, arcades and roof, the masts and their flags. Records the arcades' globes and the fires' places.
function addDeck1(S, bars, flags, A) {
  const d = DK[0], y = d.floor, gy = y - d.galleryDrop, inner = d.half - d.galleryWidth, v = d.voidHalf, cut = v - VOID_CUT;
  const lines = [-inner, -WELL1[1], -WELL1[0], -v, v, WELL1[0], WELL1[1], inner];
  floorCells(S, lines, y, SLAB, (i, j) => (i === 3 && j === 3) || ((i === 1 || i === 5) && (j === 1 || j === 5)), FLOOR);
  // the opening's four cut corners, its rim and its railing
  const oct = [[-cut, -v], [cut, -v], [v, -cut], [v, cut], [cut, v], [-cut, v], [-v, cut], [-v, -cut]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tri = [[sx * cut, sz * v], [sx * v, sz * v], [sx * v, sz * cut]];
    S.level(tri, y, true, FLOOR); S.level(tri, y - SLAB, false, tint(FLOOR, 0.6));
  }
  for (let j = 0; j < 8; j++) {
    const a = oct[j], b = oct[(j + 1) % 8], ox = -(a[0] + b[0]), oz = -(a[1] + b[1]), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    S.wall(a[0], a[1], b[0], b[1], y - SLAB, y, ox, oz, paint(0, 1.1));
    S.wall(a[0], a[1], b[0], b[1], y, y + RAIL_H, ox, oz, paint(0, 1.2), SKIN.posts(len / Math.round(len / 2), 0.9, 0), Math.round(len / 2), 0, RAIL_H);
  }
  const top = gy + ARCADE.key + ARCADE.crest, bay = d.arcadeBay, n = d.arcades;
  const yf = y - d.thick, hf0 = TOWER.halfOuter(FRIEZE.y0) + FRIEZE.out, hf1 = TOWER.halfOuter(yf) + FRIEZE.out;
  for (let f = 0; f < 4; f++) {
    const out = outOf(f), q = (t, yy, h) => plan3(f, t, yy, h);
    // the plain frieze on the girder's face, then the hollow cove that swings out under the gallery
    S.quad(q(-hf0, FRIEZE.y0, hf0), q(hf0, FRIEZE.y0, hf0), q(hf1, yf, hf1), q(-hf1, yf, hf1), paint(0, 1.7), SKIN.plain, undefined, out);
    for (let i = 0; i < 3; i++) {
      const a0 = Math.PI / 2 * i / 3, a1 = Math.PI / 2 * (i + 1) / 3, R = d.halfGallery - hf1, H = gy - yf;
      const h0 = hf1 + R * (1 - Math.cos(a0)), y0 = yf + H * Math.sin(a0), h1 = hf1 + R * (1 - Math.cos(a1)), y1 = yf + H * Math.sin(a1);
      S.quad(q(-h0, y0, h0), q(h0, y0, h0), q(h1, y1, h1), q(-h1, y1, h1), paint(0, 1.25 - 0.15 * i), SKIN.plain, undefined, [out[0], -0.5, out[2]]);
    }
    // the gallery: its floor, the step up to the deck, the arcades, the posts on the deck's side and the zinc roof
    S.quad(q(-inner, gy, inner), q(inner, gy, inner), q(d.halfGallery, gy, d.halfGallery), q(-d.halfGallery, gy, d.halfGallery), FLOOR, SKIN.plain, undefined, [0, 1, 0]);
    S.quad(q(-inner, gy, inner), q(inner, gy, inner), q(inner, y, inner), q(-inner, y, inner), paint(0, 1.1), SKIN.plain, undefined, out);
    const u0 = (n * bay / 2 - d.half) / bay, u1 = n - u0, hh = top - gy;
    S.quad(q(-d.half, gy, d.half), q(d.half, gy, d.half), q(d.half, top, d.half), q(-d.half, top, d.half), paint(1, 1.15), SKIN.arcade(bay, n),
      [[u0, 0], [u1, 0], [u1, hh], [u0, hh]], out);
    const bays = Math.round(2 * inner / (bay / 2));
    S.quad(q(-inner, y, inner), q(inner, y, inner), q(inner, top + 0.5, inner), q(-inner, top + 0.5, inner), paint(1, 1.0), SKIN.posts(2 * inner / bays, 0, top + 0.1 - y),
      [[0, 0], [bays, 0], [bays, top + 0.5 - y], [0, top + 0.5 - y]], out);
    S.quad(q(-d.halfGallery, top - 0.15, d.halfGallery), q(d.halfGallery, top - 0.15, d.halfGallery), q(inner, top + 0.5, inner), q(-inner, top + 0.5, inner), ZINC, SKIN.plain, undefined, [0, 1, 0]);
    // one globe in each arcade, hung before the crescent (SOURCED: figures.md C, "Arcade globes": one per deck-1
    // arcade); two fires in each, FIRE_OUT outside the rail before the two small arches (the Bengal fire's places: WORKING)
    for (let i = 0; i < n; i++) {
      const t = (i - (n - 1) / 2) * bay;
      A.arcadeGlobes.push(q(t, gy + ARCADE.spring + 1.4, d.half + 0.45));
      for (const s of [-1, 1]) A.bengal.push(q(t + s * bay / 4, gy + ARCADE.rail, d.half + FIRE_OUT));
    }
    // the consoles that stand out under the cove, one under every column between two arcades. INVENTED BY NEED: the
    // gallery stands out from the iron (SOURCED) and is seen from below as the line comes in under the tower; with
    // nothing under it, it would hang in the air
    for (let i = 1; i < n; i++) {
      const t = (i - n / 2) * bay, c = FRIEZE.console / 2, a = plan2(f, t - c, hf1 - 0.1), b = plan2(f, t + c, d.halfGallery - 0.5);
      S.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), yf - 0.5, gy - 0.25, Math.min(a[1], b[1]), Math.max(a[1], b[1]), paint(0, 1.4), { top: null, under: true });
    }
    // the masts between the arcades (one at each corner of the gallery) and their flags. SOURCED: figures.md A,
    // "Deck 1" (8 m masts between the arcades, with unlettered flags)
    for (let i = 0; i < n; i++) {
      const p = i ? q((i - n / 2) * bay, top, d.half) : q(-d.half, top, d.half), k = flags.length;
      bar(bars, p, [p[0], top + d.mast, p[2]], 0.3, tint(STAFF, MAST_TINT));
      flags.push({ x: p[0], z: p[2], y0: top + d.mast - 2.0, y1: top + d.mast, length: d.flag, phase: hash01(k * 31 + 5), kind: k % 3 === 0 ? 'bands' : 'tricolour', serial: k });
    }
  }
  A.cordons.deck1 = squareLoop(d.halfGallery, gy);
}

// THE FOUR PAVILIONS of deck 1 (SOURCED: figures.md A, "Deck 1": four pavilions, 23.3 by 15, one centred on each
// face, a three-bay barrel roof in zinc and a 2.65 m lantern light), each in its own box of TOWER.pavilions: walls of lit windows (timber, or white staff for the
// garden's), three barrel roofs in zinc side by side across its breadth, and a roof light along the middle one.
// The roof light's 2.65 m is the sources'; the barrels' rise is WORKING. Records each wall for the lights.
const PAV = { light: 2.65, rise: 2.0, lightHigh: 0.65, steps: 6, cells: [9, 5], rows: 2 };
function addPavilion(S, p, A) {
  const alongX = Math.abs(p.x0 + p.x1) < 1e-6;                        // its breadth lies along X: it stands on a Z face
  const sgn = Math.sign(alongX ? p.z0 + p.z1 : p.x0 + p.x1), wide = alongX ? p.x1 - p.x0 : p.z1 - p.z0;
  const a0 = Math.min(Math.abs(alongX ? p.z0 : p.x0), Math.abs(alongX ? p.z1 : p.x1)), deep = (alongX ? p.z1 - p.z0 : p.x1 - p.x0);
  // u across the breadth, w from the side toward the tower's middle outward
  const at = (u, yy, w) => (alongX ? [u, yy, sgn * (a0 + w)] : [sgn * (a0 + w), yy, u]);
  const out = alongX ? [0, 0, sgn] : [sgn, 0, 0], side = alongX ? [1, 0, 0] : [0, 0, 1];
  const y0 = p.y0, yw = p.y1 - PAV.light, h = wide / 2, body = p.finish === 'white' ? STAFF : TIMBER;
  const win = SKIN.windows(0.3, 0.33, WINDOW_GLOW);
  const walls = [
    [at(-h, y0, deep), at(h, y0, deep), out, PAV.cells[0], 'front'], [at(-h, y0, 0), at(h, y0, 0), [-out[0], 0, -out[2]], PAV.cells[0], 'back'],
    [at(h, y0, 0), at(h, y0, deep), side, PAV.cells[1], 'side'], [at(-h, y0, 0), at(-h, y0, deep), [-side[0], 0, -side[2]], PAV.cells[1], 'side'],
  ];
  for (const [a, b, nrm, cells, name] of walls) {
    const c = [b[0], yw, b[2]], dd = [a[0], yw, a[2]];
    S.quad(a, b, c, dd, body, win, [[0, 0], [cells, 0], [cells, PAV.rows], [0, PAV.rows]], nrm);
    A.pavilionWalls.push({ pavilion: p.name, finish: p.finish, wall: name, corners: [a, b, c, dd], normal: nrm });
  }
  // the three barrels: arcs of a circle on the walls' heads, the ridges running from the back to the front
  const hs = wide / 6, R = (hs * hs + PAV.rise * PAV.rise) / (2 * PAV.rise), span = Math.asin(hs / R);
  for (let b = -1; b <= 1; b++) {
    const arc = [];
    for (let i = 0; i <= PAV.steps; i++) { const th = -span + 2 * span * i / PAV.steps; arc.push([b * 2 * hs + R * Math.sin(th), yw + PAV.rise - R + R * Math.cos(th)]); }
    for (let i = 0; i < PAV.steps; i++) {
      const m = (arc[i][0] + arc[i + 1][0]) / 2 - b * 2 * hs;
      S.quad(at(arc[i][0], arc[i][1], 0), at(arc[i + 1][0], arc[i + 1][1], 0), at(arc[i + 1][0], arc[i + 1][1], deep), at(arc[i][0], arc[i][1], deep),
        tint(ZINC, 1 - 0.25 * Math.abs(m) / hs), SKIN.plain, undefined, [0, 1, 0]);
    }
    S.face(arc.map((q) => at(q[0], q[1], deep)), tint(body, 0.9), SKIN.plain, undefined, out);
    S.face(arc.map((q) => at(q[0], q[1], 0)), tint(body, 0.9), SKIN.plain, undefined, [-out[0], 0, -out[2]]);
  }
  // the roof light on the middle barrel: lit glazed sides under a zinc lid
  const l = PAV.light / 2, ya = yw + PAV.rise - 0.3, yb = p.y1, w0 = deep * 0.15, w1 = deep * 0.85, glass = SKIN.windows(0.4, 0.36, WINDOW_GLOW * 0.8);
  for (const s of [-1, 1]) {
    S.quad(at(s * l, ya, w0), at(s * l, ya, w1), at(s * l, yb, w1), at(s * l, yb, w0), tint(ZINC, 0.8), glass, [[0, 0], [8, 0], [8, 1], [0, 1]], [s * side[0], 0, s * side[2]]);
    const w = s < 0 ? w0 : w1;
    S.quad(at(-l, ya, w), at(l, ya, w), at(l, yb, w), at(-l, yb, w), tint(ZINC, 0.8), glass, [[0, 0], [2, 0], [2, 1], [0, 1]], [s * out[0], 0, s * out[2]]);
  }
  S.quad(at(-l, yb, w0), at(l, yb, w0), at(l, yb, w1), at(-l, yb, w1), ZINC, SKIN.plain, undefined, [0, 1, 0]);
}

// The lift and stair landings of deck 1 in the four legs. Over each Roux well a cage with a row of lit windows under
// a zinc roof, in which the car ends its climb. An Otis car passes on up to deck 2, leaning in with the leg, so its
// well has the cage's two walls on the sides away from the tower's middle alone: the leg's own inner faces close the
// other two. Beside each well the stair's head. Eighteen kiosks near the legs (their places are WORKING): two each
// side of each leg between it and the pavilions, and a third each side of the garden's pavilion: lit, under zinc.
// INVENTED BY NEED, all three (no line of the sources gives them): the cages, since a car must end its climb in
// something and an open well would show it rising through bare boards; the stairs' heads and the kiosks, since the
// deck's floor between the legs and the pavilions lies open to the eye from above on the climb (the line passes
// 30 m off) and bare boards there would read as unfinished. The kiosks' number is the builder's book's by report.
const LANDING = { out: 0.1, high: 6.4, stairAt: 27.5, stairHalf: 2.0, stairHigh: 3.0,
  kiosk: { half: 1.5, wall: 2.6, peak: 3.7, across: 13.6, out: [20.5, 27], garden: [18.6, 23.8, 29] } };   // WORKING
function addLandings1(S) {
  const y = DK[0].floor, win = SKIN.windows(0.3, 0.3, WINDOW_GLOW * 0.6), K = LANDING.kiosk;
  let kiosks = 0;
  for (let f = 0; f < 4; f++) for (const s of [-1, 1]) for (const h of (FACE[f][3] > 0 ? K.garden : K.out)) {
    const c = plan2(f, s * K.across, h), sq = squarePlan(K.half).map((p) => [p[0] + c[0], p[1] + c[1]]);
    ringWalls(S, sq, y, y + K.wall, tint(TIMBER, 1.1), () => [SKIN.windows(0.32, 0.3, WINDOW_GLOW * 0.9), 2, 1]);
    for (let i = 0; i < 4; i++) {
      const a = sq[i], b = sq[(i + 1) % 4];
      S.face([[a[0], y + K.wall, a[1]], [b[0], y + K.wall, b[1]], [c[0], y + K.peak, c[1]]], tint(ZINC, 0.8 + 0.08 * i), SKIN.plain, undefined, [(a[0] + b[0]) / 2 - c[0], 1, (a[1] + b[1]) / 2 - c[1]]);
    }
    kiosks++;
  }
  for (const l of TOWER.lifts) {
    if (!l.leg) continue;
    const s = TOWER.legs[l.leg], a = WELL1[0] - LANDING.out, b = WELL1[1] + LANDING.out, y1 = y + LANDING.high, rgb = tint(TIMBER, 0.9);
    if (l.maker === 'otis') {
      S.wall(s[0] * b, s[1] * a, s[0] * b, s[1] * b, y, y1, s[0], 0, rgb, win, 4, 0, 1);
      S.wall(s[0] * a, s[1] * b, s[0] * b, s[1] * b, y, y1, 0, s[1], rgb, win, 4, 0, 1);
    } else {
      S.box(Math.min(s[0] * a, s[0] * b), Math.max(s[0] * a, s[0] * b), y, y1, Math.min(s[1] * a, s[1] * b), Math.max(s[1] * a, s[1] * b), rgb, { skin: win, us: [4, 4], vs: 1, top: ZINC });
    }
    const t = LANDING.stairAt, k = LANDING.stairHalf;
    S.box(s[0] * t - k, s[0] * t + k, y, y + LANDING.stairHigh, s[1] * t - k, s[1] * t + k, tint(TIMBER, 0.8), { top: ZINC });
  }
  return kiosks;
}

// plans about the axis: a square with cut corners (eight sides), and a round of n sides
const cutSquare = (h, c) => [[-(h - c), -h], [h - c, -h], [h, -(h - c)], [h, h - c], [h - c, h], [-(h - c), h], [-h, h - c], [-h, -(h - c)]];
const squarePlan = (h) => [[-h, -h], [h, -h], [h, h], [-h, h]];
const roundPlan = (r, n, cx = 0, cz = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cz + r * Math.sin(2 * Math.PI * i / n)]);
const loopOf = (plan, y) => plan.concat([plan[0]]).map((p) => [p[0], y, p[1]]);
// The upright walls round a plan (convex, about its own middle) from y0 to y1, facing out; skinOf(length) may give
// a side's own [skin, cells across, cells up]. The plan may narrow to a second plan at the top (a cone's or a dome's ring).
function ringWalls(S, plan, y0, y1, rgb, skinOf = null, topPlan = null, tone = null) {
  let mx = 0, mz = 0;
  for (const p of plan) { mx += p[0] / plan.length; mz += p[1] / plan.length; }
  const up = topPlan || plan;
  for (let i = 0; i < plan.length; i++) {
    const j = (i + 1) % plan.length, a = plan[i], b = plan[j], ox = (a[0] + b[0]) / 2 - mx, oz = (a[1] + b[1]) / 2 - mz;
    const sk = skinOf ? skinOf(Math.hypot(b[0] - a[0], b[1] - a[1])) : [SKIN.plain, 1, 1];
    const lean = topPlan ? (Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(up[i][0] - mx, up[i][1] - mz)) / (y1 - y0) : 0;
    S.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [up[j][0], y1, up[j][1]], [up[i][0], y1, up[i][1]], tone ? tint(rgb, tone(i)) : rgb, sk[0],
      [[0, 0], [sk[1], 0], [sk[1], sk[2]], [0, sk[2]]], [ox, lean * Math.hypot(ox, oz), oz]);
  }
}
// a railing round a plan: posts about `step` metres apart under a head rail
const railOf = (step) => (len) => { const n = Math.max(1, Math.round(len / step)); return [SKIN.posts(len / n, 0, RAIL_H - 0.14), n, RAIL_H]; };

// DECK 2: the floor with the two Otis wells, the roofed gallery with its posts, the Otis head frames, the tanks,
// the timber pavilion and two tents. SOURCED: figures.md A, "Deck 2" (the roofed gallery 2.1 wide with posts every
// 3.3 m; cylindrical tanks, a timber pavilion and tents); their places, sizes and counts (four tanks, two tents)
// are WORKING. The head frames are INVENTED BY NEED (a car must end its climb in something).
const DECK2 = { frameOut: 0.1, galleryHigh: 3.0, tank: { r: 1.8, high: 3.6, at: [14, 3], sides: 10 },
  cabin: { half: 4, z0: 9.6, z1: 15.4, wall: 3.4, ridge: 1.4 }, tent: { half: 1.6, wall: 2.0, peak: 3.4, at: [3.6, -13] } };
function addDeck2(S, A) {
  const d = DK[1], y = d.floor, W = WELL2, lines = [-d.half, -W[1], -W[0], W[0], W[1], d.half];
  const wells = TOWER.lifts.filter((l) => l.maker === 'otis').map((l) => TOWER.legs[l.leg]);
  floorCells(S, lines, y, SLAB, (i, j) => wells.some((s) => i === (s[0] > 0 ? 3 : 1) && j === (s[1] > 0 ? 3 : 1)), FLOOR);
  const rim = squarePlan(d.half), posts = Math.round(2 * d.half / d.postStep), gh = DECK2.galleryHigh, inner = d.half - d.galleryWidth;
  // the gallery: a railing with a post at every bay under a fascia, and the roof falling outward
  ringWalls(S, rim, y, y + gh, paint(1, 1.1), (len) => [SKIN.posts(len / posts, RAIL_H, gh - 0.3), posts, gh]);
  for (let f = 0; f < 4; f++) {
    S.quad(plan3(f, -d.half, y + gh, d.half), plan3(f, d.half, y + gh, d.half), plan3(f, inner, y + gh + 0.5, inner), plan3(f, -inner, y + gh + 0.5, inner), ZINC, SKIN.plain, undefined, [0, 1, 0]);
    for (let i = 0; i < 5; i++) A.bengal.push(plan3(f, (i - 2) * 6.5, y + RAIL_H, d.half + FIRE_OUT));
  }
  // the Otis head frames over the wells, lit; the cars end their climb inside them
  const win = SKIN.windows(0.3, 0.3, WINDOW_GLOW * 0.6);
  for (const s of wells) {
    const c = (W[0] + W[1]) / 2, g = (W[1] - W[0]) / 2 + DECK2.frameOut;
    S.box(s[0] * c - g, s[0] * c + g, y, y + d.above, s[1] * c - g, s[1] * c + g, tint(TIMBER, 0.9), { skin: win, us: [3, 3], vs: 1, top: ZINC });
  }
  // four cylindrical tanks
  const T = DECK2.tank;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const plan = roundPlan(T.r, T.sides, sx * T.at[0], sz * T.at[1]);
    ringWalls(S, plan, y, y + T.high, paint(1, 0.9), null, null, (i) => 0.8 + 0.4 * hash01(i * 7 + 3));
    S.level(plan, y + T.high, true, paint(1, 1.2));
  }
  // the timber pavilion on the garden side: lit windows under a pitched roof
  const C = DECK2.cabin, yw = y + C.wall, yr = yw + C.ridge, zm = (C.z0 + C.z1) / 2;
  S.box(-C.half, C.half, y, yw, C.z0, C.z1, TIMBER, { skin: SKIN.windows(0.3, 0.3, WINDOW_GLOW), us: [5, 3], vs: 1, top: null });
  for (const s of [-1, 1]) {
    const z = s < 0 ? C.z0 : C.z1;
    S.quad([-C.half, yw, z], [C.half, yw, z], [C.half, yr, zm], [-C.half, yr, zm], ZINC, SKIN.plain, undefined, [0, 1, s]);
    S.face([[s * C.half, yw, C.z0], [s * C.half, yw, C.z1], [s * C.half, yr, zm]], tint(TIMBER, 0.9), SKIN.plain, undefined, [s, 0, 0]);
  }
  // two tents on the river side
  const N = DECK2.tent;
  for (const sx of [-1, 1]) {
    const cx = sx * N.at[0], cz = N.at[1], plan = squarePlan(N.half).map((p) => [p[0] + cx, p[1] + cz]);
    ringWalls(S, plan, y, y + N.wall, tint(STAFF, 0.75));
    for (let i = 0; i < 4; i++) {
      const a = plan[i], b = plan[(i + 1) % 4];
      S.face([[a[0], y + N.wall, a[1]], [b[0], y + N.wall, b[1]], [cx, y + N.peak, cz]], tint(STAFF, 0.9 - 0.08 * i), SKIN.plain, undefined, [(a[0] + b[0]) / 2 - cx, 1, (a[1] + b[1]) / 2 - cz]);
    }
  }
  A.cordons.deck2 = squareLoop(d.half, y);
}

// DECK 3 AND THE TERRACE: the glazed room with cut corners, lit from within; over it the open terrace with its
// railing, its low pavilion under a lead roof, and the narrow track round it on which the two projectors are moved.
// SOURCED: figures.md A, "Deck 3" (the glazed box 16.5 wide with cut corners; the terrace 16.6 overall, a timber
// pavilion 10.5 square and 2.27 high) and figures.md C, "Two projectors" (the track at the terrace's rail).
const DECK3 = { cut: 2.2, trackHalf: 6.9, trackWide: 0.7, pavWall: 1.85, pane: 1.1 };   // WORKING
function addDeck3(S, A) {
  const d = DK[2], y = d.floor, ty = LV.terrace, room = cutSquare(d.half, DECK3.cut), rim = cutSquare(d.terraceHalf, DECK3.cut * d.terraceHalf / d.half);
  S.level(room, y - SLAB, false, paint(4, 0.6));
  ringWalls(S, room, y - SLAB, y, paint(4, 1.0));
  ringWalls(S, room, y, ty, paint(4, 0.9), (len) => { const n = Math.max(1, Math.round(len / DECK3.pane)); return [SKIN.windows(0.42, 0.34, WINDOW_GLOW * 1.2), n, 1]; });
  S.level(rim, ty, true, FLOOR);
  ringWalls(S, rim, ty, ty + RAIL_H, paint(4, 1.1), railOf(1.4));
  // the projectors' track: a flat band round the terrace between the pavilion and the railing
  const k = DECK3.cut / d.half, h0 = DECK3.trackHalf - DECK3.trackWide / 2, h1 = DECK3.trackHalf + DECK3.trackWide / 2;
  const t0 = cutSquare(h0, h0 * k), t1 = cutSquare(h1, h1 * k);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    S.quad([t0[i][0], ty + 0.08, t0[i][1]], [t0[j][0], ty + 0.08, t0[j][1]], [t1[j][0], ty + 0.08, t1[j][1]], [t1[i][0], ty + 0.08, t1[i][1]], paint(4, 0.45), SKIN.plain, undefined, [0, 1, 0]);
  }
  A.projectorRail = loopOf(cutSquare(DECK3.trackHalf, DECK3.trackHalf * k), ty + 0.08);
  // the two projectors' places on it, one over the garden side and one over the river side, each on a plain truck
  for (const s of [1, -1]) {
    S.box(-0.6, 0.6, ty + 0.08, ty + 0.6, s * DECK3.trackHalf - 0.6, s * DECK3.trackHalf + 0.6, paint(4, 0.5));
    A.projectors.push([0, ty + 1.3, s * DECK3.trackHalf]);
  }
  // the low pavilion: a row of lit windows under a lead roof
  const p = d.pavilionHalf, yw = ty + DECK3.pavWall, yp = ty + d.pavilionHeight, sq = squarePlan(p);
  ringWalls(S, sq, ty, yw, tint(TIMBER, 1.1), () => [SKIN.windows(0.3, 0.3, WINDOW_GLOW * 0.8), 7, 1]);
  for (let i = 0; i < 4; i++) {
    const a = sq[i], b = sq[(i + 1) % 4];
    S.face([[a[0], yw, a[1]], [b[0], yw, b[1]], [0, yp, 0]], tint(ZINC, 0.75 + 0.07 * i), SKIN.plain, undefined, [a[0] + b[0], 4 * p, a[1] + b[1]]);
  }
  for (let f = 0; f < 4; f++) for (const s of [-1, 1]) A.bengal.push(plan3(f, s * 3, ty + RAIL_H, d.terraceHalf + FIRE_OUT));
  A.cordons.deck3 = loopOf(room, y);
  A.cordons.terrace = loopOf(rim, ty + RAIL_H);
}

// THE CROWN'S SOLID PARTS (its girders, arches and the lantern's posts are members): the stair's drum up through the
// campanile, the lantern's floor with its service balcony, the lantern's plate chamber, its glazing band (the
// beacon's light), the cupola near gold, the top platform, the rod and the flag.
// From the builder's book: the chamber's 2.342 m of plate, the top platform's 1.70 m. INVENTED BY NEED: the stair's
// drum (no line of the sources gives it; without it the lantern's floor hangs in the air over the pavilion's roof).
// WORKING: the drum's size, the neck, the rod's breadth, the glazing's light and glow and the cupola's rings.
const LANTERN = { chamber: 2.342, drum: 0.9, neck: 0.4, platform: 0.85, rod: 0.3, light: [1.0, 0.93, 0.80], glow: 3.0, rings: 4 };
function addCrownSolids(S, bars, flags, A) {
  const N = CR.lantern, n = N.sides, gold = PAINT[4];
  ringWalls(S, roundPlan(LANTERN.drum, 8), LV.terrace + DK[2].pavilionHeight - 0.4, N.y0, paint(4, 0.9), null, null, (i) => 0.75 + 0.5 * hash01(i + 11));
  // the lantern's floor and balcony
  const deck = roundPlan(N.radius, n);
  S.level(deck, N.y0, true, paint(4, 0.8)); S.level(deck, N.y0 - 0.25, false, paint(4, 0.6));
  ringWalls(S, deck, N.y0 - 0.25, N.y0, paint(4, 1.0));
  ringWalls(S, deck, N.y0, N.y0 + 1.0, paint(4, 1.1), (len) => [SKIN.posts(len, 0, 0.86), 1, 1.0]);
  // the lantern: plate, glazing, plate
  const body = roundPlan(N.glassRadius, n), g0 = N.y0 + LANTERN.chamber, g1 = g0 + N.glassHeight, head = N.y0 + N.height;
  ringWalls(S, body, N.y0, g0, gold, null, null, (i) => 0.8 + 0.3 * hash01(i + 29));
  ringWalls(S, body, g0, g1, LANTERN.light, () => [SKIN.lamp(LANTERN.glow), 1, 1]);
  ringWalls(S, body, g1, head, gold);
  A.beacon = [0, (g0 + g1) / 2, 0];
  // the cupola: a dome of rings, near gold, then the neck and the top platform at 300 m
  let below = roundPlan(N.cupolaRadius, n), yb = head;
  S.level(below, head, false, tint(GILT, 0.5));
  for (let i = 1; i <= LANTERN.rings; i++) {
    const a = Math.PI / 2 * i / LANTERN.rings, r = Math.max(LANTERN.neck, N.cupolaRadius * Math.cos(a)), yy = head + N.cupolaHeight * Math.sin(a);
    const ring = roundPlan(r, n);
    ringWalls(S, below, yb, yy, GILT, null, ring, (k) => 0.85 + 0.3 * hash01(k + i * 13));
    below = ring; yb = yy;
  }
  ringWalls(S, below, yb, LV.top - 0.12, tint(GILT, 0.8));
  const plat = roundPlan(LANTERN.platform, n);
  S.level(plat, LV.top, true, tint(GILT, 0.8)); S.level(plat, LV.top - 0.12, false, tint(GILT, 0.5));
  ringWalls(S, plat, LV.top - 0.12, LV.top, GILT);
  // the rod and the flag at its head
  bar(bars, [0, CR.rod.y0, 0], [0, CR.rod.y1, 0], LANTERN.rod, paint(4, 0.9));
  flags.push({ x: 0, z: 0, y0: CR.flag.y0, y1: CR.flag.y1, length: CR.flag.length, phase: 0.37, kind: 'tricolour', serial: flags.length, top: true });
}

// THE LIFTS' RAILS: two rails beside each leg car's line and two beside each truck's, up the inside of the leg, each
// RAILS.side clear of its mover's long side; two beside each Edoux car's run in the shaft, with the half-way
// platform on which the riders change cars. INVENTED BY NEED (the sources give the lifts' runs, not their rails: a
// car that climbed a leg's inside on nothing would read as floating; the platform stands where the two Edoux
// cars, SOURCED as moving opposite ways, come side by side).
const RAILS = { size: 0.35, side: 0.5, edouxZ: 1.85, platform: [-5.2, 0.1, 3.2] };   // WORKING
function addLiftRails(S, bars) {
  for (const m of liftMovers()) {
    const P = m.track.pts, rgb = (y) => paint(bandAt(y), 0.75);
    if (!m.leg) {
      const top = P[P.length - 1][1] + m.size.high + 0.3;
      for (const s of [-1, 1]) bar(bars, [P[0][0], P[0][1], s * RAILS.edouxZ], [P[0][0], top, s * RAILS.edouxZ], RAILS.size, rgb((P[0][1] + top) / 2));
      continue;
    }
    const side = m.size.long / 2 + RAILS.side;
    for (const s of [-1, 1]) for (let i = 0; i + 1 < P.length; i++) {
      if (dist3(P[i], P[i + 1]) < 0.5) continue;
      const ox = s * m.along[0] * side, oz = s * m.along[1] * side;
      bar(bars, [P[i][0] + ox, P[i][1], P[i][2] + oz], [P[i + 1][0] + ox, P[i + 1][1], P[i + 1][2] + oz], RAILS.size, rgb((P[i][1] + P[i + 1][1]) / 2));
    }
  }
  const mid = TOWER.lifts[4].segments[0].b[1], G = RAILS.platform;
  S.box(G[0], G[1], mid - SLAB, mid, -G[2], G[2], FLOOR, { under: true });
}

// The car every mover is an instance of: a box one metre each way standing on its floor, a zinc roof. Round it run
// two bands of tall lit panes (CAR_GLASS: a pane's half breadth and half height as shares of its cell, its strength
// beside the decks' windows), so that a car reads as a lit room climbing inside the iron; the paint between the panes is
// dark. A counterweight truck is the same box in plain paint (the vertex program takes its panes away). An
// instance's matrix sets its long side, height and short side. WORKING: the panes' size, number and strength.
// THE CARS' LAMPS: INVENTED BY NEED (figures A gives the cars and their runs, not their lamps: a car that carried
// riders after dark was lit, and unlit it could not be seen to move). NOT BUILT: any light thrown by the cars on
// the iron round them (the sources give the tower its gas, its beacon, its projectors and its fires, no other).
const CAR_GLASS = { across: 0.45, up: 0.4, strength: 1.7 };
function carGeometry() {
  const S = makeSkin();
  S.box(-0.5, 0.5, 0, 1, -0.5, 0.5, paint(1, 0.85), { skin: SKIN.windows(CAR_GLASS.across, CAR_GLASS.up, WINDOW_GLOW * CAR_GLASS.strength), us: [4, 3], vs: 2, top: ZINC, under: true });
  return S.toGeometry();
}
// a mover's matrix at a place, written into an instance buffer
function writeCar(arr, at, m, p) {
  const o = at * 16, ex = m.along[0], ez = m.along[1], z = m.size;
  arr[o] = ex * z.long; arr[o + 1] = 0; arr[o + 2] = ez * z.long; arr[o + 3] = 0;
  arr[o + 4] = 0; arr[o + 5] = z.high; arr[o + 6] = 0; arr[o + 7] = 0;
  arr[o + 8] = -ez * z.deep; arr[o + 9] = 0; arr[o + 10] = ex * z.deep; arr[o + 11] = 0;
  arr[o + 12] = p[0]; arr[o + 13] = p[1]; arr[o + 14] = p[2]; arr[o + 15] = 1;
}

// THE FLAGS' CLOTH: each flag a strip of upright bands, every vertex on the mast at its own height with its
// distance along the cloth; the vertex shader streams it down the wind. Plain bands of colour and nothing else:
// the tricolour's blue at the mast, then white, then red; the other flags two plain bands (WORKING: the sources
// give unlettered flags on the masts, not their colours; one mast in three carries a two-band flag).
const PLAIN_PAIRS = [['red', 'white'], ['blue', 'gold'], ['gold', 'red'], ['white', 'blue']];
function flagGeometry(flags) {
  const pos = [], col = [], fly = [], idx = [];
  for (const f of flags) {
    const bands = f.kind === 'tricolour' ? ['blue', 'white', 'red'] : PLAIN_PAIRS[Math.floor(hash01(f.serial * 17 + 3) * PLAIN_PAIRS.length) % PLAIN_PAIRS.length];
    const per = f.top ? 5 : 6 / bands.length;                      // pieces along each band
    for (let b = 0; b < bands.length; b++) {
      const c = CLOTH[bands[b]];
      for (let i = 0; i <= per; i++) {
        const s = f.length * (b + i / per) / bands.length, base = pos.length / 3;
        for (const y of [f.y0, f.y1]) { pos.push(f.x, y, f.z); col.push(c[0], c[1], c[2]); fly.push(s, f.length, f.phase, f.y1); }
        if (i < per) idx.push(base, base + 2, base + 3, base, base + 3, base + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute('aFly', new THREE.BufferAttribute(new Float32Array(fly), 4));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  return g;
}

// THE CORDONS' LINES that are the iron's and the masonry's own, for the lamps: each arch's intrados as a polyline on
// the outer face (standing CORDON_OUT off the rafters' plane, clear of the chord), and the four footings' top edges.
const CORDON_OUT = 0.6, CORDON_STEPS = 48;           // WORKING
function ironCordons(A) {
  A.cordons.arches = {};
  for (const arch of Object.values(TOWER.arches)) {
    const r = arch.radius, t0 = Math.asin((ST.footing.height - arch.centreY) / r), line = [];
    for (let i = 0; i <= CORDON_STEPS; i++) {
      const th = t0 + (Math.PI - 2 * t0) * i / CORDON_STEPS, t = r * Math.cos(th), y = arch.centreY + r * Math.sin(th);
      const a = arch.plane.outerAt(y) + arch.sign * CORDON_OUT;
      line.push(arch.axis === 'z' ? [t, y, a] : [a, y, t]);
    }
    A.cordons.arches[arch.name] = line;
  }
  const row = TOWER.outline[0], c = (row[1] + row[2]) / 2, h = ST.footing.side / 2, y = ST.footing.height;
  A.cordons.piers = Object.values(TOWER.legs).map((s) => squareLoop(h, y).map((p) => [p[0] + s[0] * c, y, p[2] + s[1] * c]));
}

// THE DECKS, THE CROWN AND THE LIFTS DRAWN. ctx: the engine's. opts: as buildIron's (uniforms by name, so that the
// iron's own light drives these too), and lit (the lamps' level, 0 to 1, or the world's { value } as uniforms.uLit).
// Returns { object, triangles, calls, update(dt, time), dispose(), anchors, uniforms, flags, stats }.
// anchors (every place an [x, y, z] in the tower's frame): cordons { deck1, deck2, deck3, terrace: closed
// polylines; piers: four closed polylines; arches: { river, garden, upstream, downstream }: polylines }, arcadeGlobes,
// bengal (the fires' places), beacon, projectors (two), projectorRail (a closed polyline), pavilionWalls
// ({ pavilion, finish, wall, corners, normal }).
export async function buildDecks(ctx, opts = {}) {
  const U = ironUniforms(opts), given = opts.uniforms || {};
  const own = { uTime: { value: 0 }, uLit: given.uLit || { value: opts.lit ?? 1 }, uWarm: given.uWarm || { value: new THREE.Color().fromArray(WARM) } };
  const make = (vert, frag, gloss) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uGloss: { value: gloss }, ...own },
    vertexShader: vert, fragmentShader: frag, vertexColors: true, fog: true, side: THREE.DoubleSide,
  });
  const gloss = opts.gloss ?? 1;
  const solidMat = make(DECK_VERT, DECK_FRAG, gloss), carMat = make(DECK_VERT, DECK_FRAG, gloss), flagMat = make(FLAG_VERT, FLAG_FRAG, 0);
  const barMat = ironMaterial(U, gloss, false);
  const object = new THREE.Group(); object.name = 'decks';
  const A = { cordons: {}, arcadeGlobes: [], bengal: [], beacon: null, projectors: [], projectorRail: null, pavilionWalls: [] };
  const S = makeSkin(), bars = [], flags = [];
  await ctx.yield();
  addDeck1(S, bars, flags, A); await ctx.yield();
  for (const p of TOWER.pavilions) { addPavilion(S, p, A); await ctx.yield(); }
  const kiosks = addLandings1(S); await ctx.yield();
  addDeck2(S, A); await ctx.yield();
  addDeck3(S, A); await ctx.yield();
  addCrownSolids(S, bars, flags, A); await ctx.yield();
  addLiftRails(S, bars); ironCordons(A); await ctx.yield();

  // the solids, one mesh
  const built = [], gs = S.toGeometry(); gs.computeBoundingSphere(); built.push(gs);
  const solids = new THREE.Mesh(gs, solidMat); solids.name = 'deck-solids'; solids.matrixAutoUpdate = false;
  object.add(solids);
  await ctx.yield();

  // the slender bars: instances of the members' box, each with a colour of its own
  const box = unitBox(); built.push(box);
  const slender = new THREE.InstancedMesh(box, barMat, bars.length);
  slender.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bars.length * 3), 3);
  slender.name = 'deck-bars'; slender.matrixAutoUpdate = false;
  for (let i = 0; i < bars.length; i++) {
    writeMember(slender.instanceMatrix.array, i, bars[i]);
    const t = 0.9 + 0.2 * hash01(i + 4001);
    slender.instanceColor.array.set([bars[i].rgb[0] * t, bars[i].rgb[1] * t, bars[i].rgb[2] * t], i * 3);
    if ((i & 255) === 255) await ctx.yield();
  }
  slender.computeBoundingSphere(); slender.boundingSphere.radius += HOLD_PAD;
  object.add(slender);
  await ctx.yield();

  // the flags, one mesh; its sphere holds every cloth wherever the wind lays it
  const gf = flagGeometry(flags); gf.computeBoundingSphere(); gf.boundingSphere.radius += CR.flag.length; built.push(gf);
  const cloth = new THREE.Mesh(gf, flagMat); cloth.name = 'deck-flags'; cloth.matrixAutoUpdate = false;
  object.add(cloth);
  await ctx.yield();

  // the cars: eight instances, their places written at every update from the clock alone
  const gc = carGeometry(); built.push(gc);
  const cars = new THREE.InstancedMesh(gc, carMat, liftMovers().length);
  gc.setAttribute('aCar', new THREE.InstancedBufferAttribute(Float32Array.from(liftMovers(), (m) => m.lit), 1));
  cars.name = 'deck-cars'; cars.matrixAutoUpdate = false; cars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // one sphere about every track, so the mesh need not be measured again as the cars move
  cars.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, LV.deck3 / 2, 0), Math.hypot(LV.deck3 / 2, TOWER.halfOuter(0) * Math.SQRT2) + 8);
  const place = (time) => {
    const arr = cars.instanceMatrix.array;
    for (let i = 0; i < liftMovers().length; i++) writeCar(arr, i, liftMovers()[i], liftCarAt(i, time));
    cars.instanceMatrix.needsUpdate = true;
  };
  place(0);
  object.add(cars);
  await ctx.yield();

  const triangles = S.triangles() + bars.length * 12 + gf.index.count / 3 + liftMovers().length * gc.index.count / 3;
  return {
    object, triangles, calls: 4, anchors: A, uniforms: { ...U, ...own }, flags,
    stats: { solids: S.triangles(), bars: bars.length, flags: flags.length, flagTriangles: gf.index.count / 3, movers: liftMovers().length, kiosks,
      wells: { deck1: WELL1, deck2: WELL2 } },
    update(dt, time) { own.uTime.value = time; place(time); },
    dispose() { for (const g of built) g.dispose(); slender.dispose(); cars.dispose(); solidMat.dispose(); carMat.dispose(); flagMat.dispose(); barMat.dispose(); },
  };
}

// THE WHOLE TOWER, the part's contract: the iron and all that stands on it, at the origin, its front toward +Z.
// opts as buildIron's and buildDecks'. The tower stands on the world's ground at y 0 and brings none of its own.
export async function buildHero(ctx, opts = {}) {
  const iron = await buildIron(ctx, opts);
  await ctx.yield();
  const decks = await buildDecks(ctx, { ...opts, uniforms: { ...(opts.uniforms || {}), ...iron.uniforms } });
  const object = new THREE.Group(); object.name = 'iron-tower';
  object.add(iron.object, decks.object);
  const top = Math.max(LV.rodTop, 311), foot = TOWER.outline[0][1];
  return {
    object, radius: Math.hypot(foot * Math.SQRT2, top / 2), height: top, center: new THREE.Vector3(0, top / 2, 0),
    anchors: decks.anchors, uniforms: decks.uniforms, flags: decks.flags, iron, decks,
    triangles: iron.triangles + decks.triangles, calls: iron.calls + decks.calls,
    update(dt, time) { iron.update(dt, time); decks.update(dt, time); },
    dispose() { iron.dispose(); decks.dispose(); },
    ground: false, groundY: FRAME.groundY,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE TOWER'S LAMPS (buildLamps): the gas cordons and the arcades' globes, the beacon in the lantern, the two
// projectors' beams and the Bengal fire, each at the places buildHero gives (its anchors). What runs by what:
//  - the gas COMES ON BY METRES FLOWN: one number, the wave, a table over named places of ROUTE.places (LAMP_STAGES);
//    every lamp has an order dealt at build from its place on its cordon and is lit as the wave passes that order;
//  - the gas FLICKERS, the beacon turns its round, the beams rest and swing and their haze drifts, and the fire's
//    flames, its smoke and the waver of its red on the iron move BY THE WORLD'S CLOCK, each a pure function of it;
//  - the beams are lit and doused, and the Bengal fire flares and dies, BY METRES FLOWN between the route's places.
// Nothing here is advanced by dt and nothing remembers: update(dt, time, metres) writes uniforms only.

// The gas. A burner every 0.35 m (figures C) on each cordon the hero gives; the rest is WORKING.
const GAS = {
  step: 0.35,
  out: 0.3, up: 0.45,                                // a globe stands this far out from its rim's line and over it, on its bracket
  globe: 0.13, arcade: 0.3, lantern: 0.9,           // radii in metres: a cordon's opal globe, an arcade's globe, the lantern's light
  halo: 7, haloSigma: 2.2, haloK: 0.06, lanternK: 0.3,   // a globe's own halo: its reach and its breadth in globe radii, its strength beside the globe (and the lantern's: its glass stands before its light)
  minPixels: 0.9,                                    // the least radius a globe is drawn at, in pixels (the hold by a pixel's footprint)
  hold: 1.6,                                         // the power of (true radius over drawn radius) a held globe's light is lowered by: between 1 (a far row
                                                     // never dims) and 2 (the true share of a pixel its globes fill), so a far cordon stays pale gold, never white
  gold: [1.0, 0.70, 0.32], white: [1.0, 0.86, 0.62], level: 1.25, arcadeLevel: 2.2,   // pale gold and white gold, linear, and their strengths
  front: 0.05, deal: 0.02,                           // the wave's soft front, in stages; the spread of a lamp's own dealt order
  stagger: 0.3,                                      // the share of a stage by which the last of four arches (or piers) begins after the first
  waver: [0.035, 0.025], dip: 0.3,                   // the flicker: two slow wavers' depths, and a rare dip's
};

// WHERE THE GAS COMES ON, as [metres flown, the wave]: the wave runs 0 to 6 through six stages, each lit while the
// wave crosses it: 0 the four arches (each from both springings up to the crown), 1 the pier bases, 2 the first
// platform's rim with its arcades' globes, 3 the second platform's, 4 the third's, 5 the terrace's. The places are
// the route's own: the arches take light as the line comes off the bridge and are whole half way from the quay's
// height to the tower's face, so their half rings are seen to close while the tower comes round into the picture;
// the pier bases follow up to the face; nothing is lit while the line is under the tower; the first platform's rim
// runs round while the line turns out and climbs past it (it is over that deck where the wide arc ends); the second
// is whole where the line reaches its height, half way from the garden side to the downstream side; the third and
// the terrace follow, and all is lit at the river side, a quarter turn before the helix's top.
function lampStages(P) {
  const mid = (a, b) => (a + b) / 2;
  return [[P.bridgeOut, 0], [mid(P.quayTop, P.towerIn), 1], [P.towerIn, 2], [P.helixStart, 2], [P.helixWide, 3],
    [mid(P.helixGarden, P.helixDownstream), 4], [P.helixDownstream, 5], [P.helixRiver, 6]];
}
// a table of [x, y] rows read at x: straight between rows, held at its ends
function tableAt(rows, x) {
  if (x <= rows[0][0]) return rows[0][1];
  for (let i = 0; i + 1 < rows.length; i++) if (x <= rows[i + 1][0]) return rows[i][1] + (rows[i + 1][1] - rows[i][1]) * (x - rows[i][0]) / (rows[i + 1][0] - rows[i][0]);
  return rows[rows.length - 1][1];
}
// a polyline's points every `step` metres along it (as many as stand evenly), each [x, y, z, metres along, and the
// line's own direction there as a unit vector]; and its length
function alongLine(line, step) {
  const acc = [0], points = [];
  for (let i = 0; i + 1 < line.length; i++) acc.push(acc[i] + dist3(line[i], line[i + 1]));
  const length = acc[acc.length - 1], n = Math.max(1, Math.round(length / step));
  for (let k = 0, i = 0; k < n; k++) {
    const d = (k + 0.5) * length / n;
    while (i + 2 < line.length && acc[i + 1] < d) i++;
    const f = (d - acc[i]) / (acc[i + 1] - acc[i]), a = line[i], b = line[i + 1];
    const l = dist3(a, b) || 1;
    points.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, d, (b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l]);
  }
  return { points, length };
}
// the metres along a polyline to its point nearest a place
function nearestAlong(line, p) {
  let best = Infinity, at = 0, run = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz;
    const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / l2));
    const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1], a[2] + dz * t - p[2]);
    if (d < best) { best = d; at = run + t * Math.sqrt(l2); }
    run += Math.sqrt(l2);
  }
  return at;
}

// EVERY LAMP OF THE TOWER, dealt at build: its place, its order in the wave, a number of its own for its flicker and
// its kind (0 a cordon's burner, 1 an arcade's globe, 2 the beacon). A cordon's lamps stand every GAS.step along the
// hero's line. An arch's are lit from both springings up to its crown; a rim's and a pier base's run both ways round
// from the point of the rim nearest the route's own place where its stage begins. The four arches (and the four pier
// bases) begin one after another, the nearest to that place first. All of it is decided here once, from the route's
// curve and never from the lens.
function dealLamps(A, R) {
  const pos = [], par = [], tan = [], stages = lampStages(R.places), span = 1 - GAS.front - GAS.deal;
  const routeAt = (stage) => R.pointAt(stages.filter((s) => s[1] === stage).pop()[0] / R.length);
  // (row: the direction of the lamp's own cordon there, or nothing for a lamp that stands alone)
  const add = (p, order, kind, row = null) => {
    const k = par.length / 4;
    pos.push(p[0], p[1], p[2]); par.push(order + hash01(k * 3 + 17) * GAS.deal, hash01(k * 3 + 18), kind, 0);
    tan.push(row ? row[4] : 0, row ? row[5] : 0, row ? row[6] : 0);
  };
  // how many of the others lie nearer a place than each: 0 for the nearest
  const ranks = (middles, from) => { const d = middles.map((m) => dist3(m, from)); return d.map((v) => d.filter((w) => w < v).length); };
  const middleOf = (line) => { const m = [0, 0, 0], n = line.length - 1; for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) m[k] += line[i][k] / n; return m; };
  const arches = Object.values(A.cordons.arches), archRank = ranks(arches.map((l) => l[(l.length - 1) >> 1]), routeAt(0));
  arches.forEach((line, a) => {
    const { points, length } = alongLine(line, GAS.step);
    for (const p of points) add(p, span * (GAS.stagger * archRank[a] / 3 + (1 - GAS.stagger) * (1 - Math.abs(2 * p[3] / length - 1))), 0, p);
  });
  // a closed rim: its lamps a little out from its middle and over it; lead and share place its run within the stage
  const rim = (line, stage, lead = 0, share = 1) => {
    const { points, length } = alongLine(line, GAS.step), start = nearestAlong(line, routeAt(stage)), c = middleOf(line);
    const round = (along) => { const d = Math.abs(along - start); return Math.min(d, length - d) / (length / 2); };
    for (const p of points) {
      const ox = p[0] - c[0], oz = p[2] - c[2], l = Math.hypot(ox, oz) || 1;
      add([p[0] + ox / l * GAS.out, p[1] + GAS.up, p[2] + oz / l * GAS.out], stage + span * (lead + share * round(p[3])), 0, p);
    }
    return round;
  };
  const piers = A.cordons.piers, pierRank = ranks(piers.map(middleOf), routeAt(1));
  piers.forEach((line, i) => rim(line, 1, GAS.stagger * pierRank[i] / 3, 1 - GAS.stagger));
  const round1 = rim(A.cordons.deck1, 2);
  rim(A.cordons.deck2, 3); rim(A.cordons.deck3, 4); rim(A.cordons.terrace, 5);
  const burners = par.length / 4;
  // an arcade's globe is lit with the rim's lamps beside it
  for (const g of A.arcadeGlobes) add(g, 2 + span * round1(nearestAlong(A.cordons.deck1, g)), 1);
  add(A.beacon, 0, 2);
  return { pos: new Float32Array(pos), par: new Float32Array(par), tan: new Float32Array(tan), count: par.length / 4, burners, globes: A.arcadeGlobes.length, stages };
}

// THE BEACON: a fixed white light in the lantern; the drum that turns round it gives a red flash, a white one (the
// brightest) and a blue one in turn, then the fixed light alone, and so again every 22.5 s (figures C: four such
// rounds to the drum's turn of about ninety seconds). A pure function of the clock; it throws no beam.
// Its optic sends the light out level: none of it lands within BEACON.land metres of the tower's foot (figures C) and
// it is not seen from the grounds. LAWFUL READING (L1), A SHADING BY THE DIRECTION FROM THE LIGHT TO THE EYE: an eye
// that stands no lower under the lantern than the edge of that sheet of light has the whole light; lower than that
// it has only the lantern's lit glass, the share BEACON.under of it. The shading asks which way the eye lies and
// never how far off it is.
// WORKING: the flashes' length and every strength; the light is lower in the dusk than at night; the glass's share
// and the breadth of the sheet's soft edge (BEACON.soft, in times the edge's own angle).
const BEACON = { round: 22.5, flash: 0.55, fixed: [2.4, 2.3, 2.1], red: [9, 0.35, 0.2], white: [8, 7.6, 6.6], blue: [0.8, 2.4, 11], dusk: 0.55,
  land: 1500, under: 0.12, soft: 2 };
function beaconAt(time, night, out) {
  const at = (time / BEACON.round) % 1, k = BEACON.dusk + (1 - BEACON.dusk) * night;
  const bell = (c) => { const d = (at - c) * BEACON.round; return Math.exp(-d * d / (2 * BEACON.flash * BEACON.flash)); };
  const r = bell(0.125), w = bell(0.375), b = bell(0.625), F = BEACON.fixed, R = BEACON.red, W = BEACON.white, B = BEACON.blue;
  const f = 1 - Math.min(1, r + w + b);               // a flash's glass stands before the fixed light while it passes
  return out.setRGB(k * (f * F[0] + r * R[0] + w * W[0] + b * B[0]), k * (f * F[1] + r * R[1] + w * W[1] + b * B[1]), k * (f * F[2] + r * R[2] + w * W[2] + b * B[2]));
}

// THE LAMPS DRAWN: every lamp one small square turned to the eye, all in one call. In it a soft round globe and,
// round that, the globe's own halo (so a lamp reads as a lamp where the engine's bloom is off). LAWFUL READING (L1),
// A HOLD BY A PIXEL'S FOOTPRINT: a globe is sized in metres and never drawn smaller than GAS.minPixels pixels' radius
// (the metres one pixel covers there, worked from the lamp's own depth and the projection), and its light is then
// lowered by a power of that ratio (GAS.hold), so that a cordon far off closes to one calm line of pale gold
// instead of sparkling from pixel to pixel. It widens and dims a lamp; it never hides, thins or fades one.
const LAMP_VERT = /* glsl */`
attribute vec3 iPos;                     // the lamp's place
attribute vec4 iPar;                     // its order in the wave, a number of its own, its kind
attribute vec3 iTan;                     // the direction of its cordon there (nothing for a lamp that stands alone)
uniform float uWave, uTime;
uniform vec2 uPx;                        // x: the drawing buffer's height in pixels
uniform vec3 uGold, uWhite, uBeacon, uRadius;
uniform vec3 uSheet;                     // the beacon's sheet of light: the sines of its edge's two angles under the level, the glass's share
varying vec2 vQ; varying vec4 vCol;      // vCol.a: the halo's strength beside the globe
void main() {
  float kind = iPar.z, n = iPar.y;
  // lit as the wave passes the lamp's order (the beacon burns always)
  float lit = kind > 1.5 ? 1. : smoothstep(0., ${GAS.front.toFixed(3)}, uWave - iPar.x);
  // the gas flickers by the clock: two slow wavers of a few percent at the lamp's own rates, and a rare short dip
  float waver = 1. + ${GAS.waver[0].toFixed(3)} * sin(uTime * (1.9 + 2.3 * n) + n * 97.) + ${GAS.waver[1].toFixed(3)} * sin(uTime * (4.1 + 3.7 * fract(n * 7.31)) + n * 41.);
  float turn = fract(uTime / (11. + 9. * fract(n * 13.7)) + n * 5.3);
  float dip = 1. - ${GAS.dip.toFixed(2)} * smoothstep(0., .015, turn) * (1. - smoothstep(.02, .05, turn));
  // the beacon by the way the eye lies from it: the whole light within its level sheet, the lit glass alone under it
  float sheet = mix(1., uSheet.z, smoothstep(uSheet.x, uSheet.y, normalize(iPos - cameraPosition).y));
  float gas = kind > 1.5 ? sheet : waver * dip;
  vec3 col = kind < .5 ? uGold : kind < 1.5 ? uWhite : uBeacon;
  float radius = kind < .5 ? uRadius.x : kind < 1.5 ? uRadius.y : uRadius.z;
  vec4 mv = modelViewMatrix * vec4(iPos, 1.);
  float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  float drawn = max(radius, ${GAS.minPixels.toFixed(2)} * mPerPx);
  // a cordon seen along its own length: its globes stand one before another and the nearer hides the farther, so
  // each gives the share of itself that shows beside its neighbour (the spacing as the eye sees it, over a globe's breadth)
  float row = dot(iTan, iTan) < .5 ? 1. : min(1., length(cross(iTan, normalize(cameraPosition - iPos))) * ${(GAS.step / (2 * GAS.globe)).toFixed(3)});
  vCol = vec4(col * (lit * gas * row * pow(radius / drawn, ${GAS.hold.toFixed(2)})), kind > 1.5 ? ${GAS.lanternK.toFixed(2)} : ${GAS.haloK.toFixed(3)});
  vQ = position.xy * ${GAS.halo.toFixed(1)};
  mv.xy += position.xy * (${GAS.halo.toFixed(1)} * drawn * step(1e-4, lit));   // an unlit lamp draws nothing
  gl_Position = projectionMatrix * mv;
}`;
const LAMP_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vCol;
void main() {
  float r = length(vQ);                  // in globe radii
  float globe = 1. - smoothstep(.5, 1.2, r);
  float halo = max(exp(-r * r / ${(2 * GAS.haloSigma * GAS.haloSigma).toFixed(2)}) - ${Math.exp(-GAS.halo * GAS.halo / (2 * GAS.haloSigma * GAS.haloSigma)).toFixed(4)}, 0.);
  gl_FragColor = vec4(vCol.rgb * (globe + vCol.a * halo), 1.);
}`;
// a square of two triangles, corners at -1 and 1, for a mesh of instances turned to the eye
function spriteQuad() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));
  return g;
}
// light added to the picture behind it: no depth written, hidden by what stands in front
const lightMaterial = (uniforms, vertexShader, fragmentShader) => new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader,
  blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
// a sphere that holds the whole tower and what its lights add round it
const towerSphere = (pad) => new THREE.Sphere(new THREE.Vector3(0, LV.rodTop / 2, 0), Math.hypot(LV.rodTop / 2, TOWER.halfOuter(0) * Math.SQRT2) + pad);

function makeGasLamps(A, hero) {
  const D = dealLamps(A, ROUTE), g = spriteQuad(), c3 = (a, k) => new THREE.Color(a[0] * k, a[1] * k, a[2] * k);
  // the angle under the level at which the beacon's light would land BEACON.land metres from the foot
  const edge = Math.atan2(A.beacon[1] - FRAME.groundY, BEACON.land);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(D.pos, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(D.par, 4));
  g.setAttribute('iTan', new THREE.InstancedBufferAttribute(D.tan, 3));
  g.instanceCount = D.count; g.boundingSphere = towerSphere(GAS.lantern * GAS.halo);
  const U = { uWave: { value: 0 }, uTime: { value: 0 }, uPx: hero.uniforms.uPx, uGold: { value: c3(GAS.gold, GAS.level) }, uWhite: { value: c3(GAS.white, GAS.arcadeLevel) },
    uBeacon: { value: new THREE.Color(0, 0, 0) }, uRadius: { value: new THREE.Vector3(GAS.globe, GAS.arcade, GAS.lantern) },
    uSheet: { value: new THREE.Vector3(Math.sin(edge), Math.sin(edge * BEACON.soft), BEACON.under) } };
  const material = lightMaterial(U, LAMP_VERT, LAMP_FRAG), mesh = new THREE.Mesh(g, material);
  mesh.name = 'tower-lamps'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 3;
  return { mesh, uniforms: U, deal: D, triangles: D.count * 2,
    update(time, metres, night) { U.uTime.value = time; U.uWave.value = tableAt(D.stages, metres); beaconAt(time, night, U.uBeacon.value); },
    dispose() { g.dispose(); material.dispose(); } };
}

// THE TWO PROJECTORS on the terrace (figures C: hard white, a bluish haze, steered and held). Each beam RESTS on a
// place, is steered slowly to its other place and rests again, by the clock alone (beamAt, a pure function of time: a
// table of places and a smooth step between them). The two keep no step with one another (rounds of 38 and 34 s),
// differ in strength, and both play to the downstream side, so they never stand as a pair. The garden side's
// projector holds the crown of the downstream palace's dome, then the ridge of that palace's nave half a nave's
// breadth in from its far end; the river side's holds the river under the iron footbridge downstream, then the
// reach beyond it.
// A BEAM IS A NARROW CONE OF LIT HAZE: bright and thin at the lamp, broadening and thinning away from it (its light
// falls with its breadth and is spent along its length), soft at its edges, pale blue-white, and it ENDS ON WHAT IT
// LIGHTS: the haze lies thicker low over the grounds, so the beam shows again as it comes down on its place, and
// its pool lies there.
// WHERE A BEAM RESTS IT LAYS A POOL OF LIGHT: a level disc on the dome's crown, on the ridge, on the water.
// INVENTED BY NEED (the sources give the beams and what they were held on, not the lit patch: a beam that reached
// a roof or the water and lit nothing there would read as a fault). The
// river's beam always ends on the water, so its pool slides down the river's middle with it; the garden's passes
// over roofs between its two places, so there its pool goes out as it leaves and comes on as it arrives, and its far
// end thins out in the air. THE HAZE in a beam drifts along it by the clock, so a held beam is never dead still.
// EACH IS LIT BY METRES FLOWN, between two of the route's own places: the river's comes on from helixRiver and is
// full half way to helixTop (`lit`), and is doused again from helixTop to half way to comeAboutStart (`out`); the
// garden's (`late`) comes on only from there, half way between helixTop and comeAboutStart, is full at
// comeAboutStart and burns to the end. THE TWO NEVER SHOW TOGETHER: the one begins to come on at the very metre the
// other is out, so at any place one beam alone plays or none, the river's while the line rounds the helix's top
// over the river, the garden's on the come-about and the run back down the axis.
// CLEAR AIR (L5) chooses the places: every beam is counted from the route's own curve over a whole round of its
// clock, and its whole swept volume stays over 40 m from the flown line. The central dome, the far palace across
// the river and the great fountain group on the garden's axis cannot be held so (the come-about, the helix's river
// side and the axis run pass within 40 m of those beams) and are left out. WORKING: the mouth, the spread, the
// rests' and swings' lengths, the levels, the pools' sizes.
const PAL = FRAME.palaces, PDM = PAL.dome, FTB = FRAME.river.downstreamBend, RIVER_MIDDLE = (FRAME.river.z0 + FRAME.river.z1) / 2;
const BEAMS = {
  mouth: 0.45, spread: 0.7,                          // the mirror's radius in metres; the beam's half angle in degrees
  minPixels: 0.8,                                    // the least half breadth a beam is drawn at, in pixels (the hold by a pixel's footprint)
  fall: 0.8,                                         // its haze's light falls with its breadth, by this power of it (1: the same light through a broader beam; a little less: a lamp's beam is brightest in its heart)
  fade: 1.5,                                         // and by its length: the air it lights spends it, to e to the minus this where it lands
  low: { more: 2.5, height: 40 },                    // the haze lies thicker low over the grounds: this much more of it is lit at the ground's level, less by 1/e for every so many metres up
  edge: 3,                                           // the power of the line of sight's chord through it that its light goes by: soft at its edges
  cap: 0.9,                                          // the least sine its depth along the line of sight is divided by
  end: [0.97, 0.6],                                  // the share of its length where its end begins to go out: resting on its place, and in the air while steered
  white: [1.0, 0.97, 0.9], haze: [0.6, 0.77, 1.0],   // its heart at the mouth; the pale blue-white haze it lights
  drift: { size: 60, rate: 0.3, depth: 0.22 },       // the haze's thicker and thinner stretches: their length in metres, their drift in lengths a second, their depth
  pool: { k: 1.7, most: 9, colour: [0.72, 0.84, 1.0], go: 0.25 },   // a pool's radius in beam radii and its greatest in metres; its colour; the share of a swing over which it goes out
  list: [
    { name: 'garden', lit: ['helixTop', 'comeAboutStart'], late: true, out: null, rest: 9, swing: 10, lead: 0, level: 0.9, poolLevel: 1.6,
      to: [{ at: [-PDM.x, PDM.height, PDM.z], lift: 0.5, stretch: 1.3 }, { at: [-PDM.x, PAL.bodyHeight, PAL.z1 - PAL.nave / 2], lift: 0.4, stretch: 1.3 }] },
    // the river's middle at the footbridge, and at a little over one and a half times that way downstream (the river's line is straight beyond the footbridge)
    { name: 'river', lit: ['helixRiver', 'helixTop'], out: ['helixTop', 'comeAboutStart'], rest: 11, swing: 6, lead: 13, level: 0.6, poolLevel: 0.7, water: FRAME.waterY,
      to: [{ at: [FTB.x, FRAME.waterY, RIVER_MIDDLE + FTB.dz], lift: 0.15, stretch: 2.4 }, { at: [FTB.x * 1.6, FRAME.waterY, RIVER_MIDDLE + FTB.dz * 2.2], lift: 0.15, stretch: 2.4 }] },
  ],
};
// A beam at a clock, from its mouth `from`: its direction (a unit vector), its length, the place its pool lies at
// and `held`, 1 while it rests on a place and 0 while it is steered between two. It rests on its first place, turns
// to its second, rests there and turns back; the direction turns evenly eased along the great circle between the
// two. A beam with `water` ends where it meets the water's level (the great circle between two places on the water
// meets it along the straight line between them); another's length goes evenly from one place's to the other's.
// Returns out = { dir, length, pool: [x, y, z], held, place }.
export function beamAt(beam, from, time, out = { dir: [0, 0, 0], length: 0, pool: [0, 0, 0], held: 0, place: 0 }) {
  const half = beam.rest + beam.swing, t = (time + beam.lead) % (2 * half), leg = t < half ? 0 : 1, s = smooth(beam.rest, half, t - leg * half);
  const a = beam.to[leg].at, b = beam.to[1 - leg].at, da = [a[0] - from[0], a[1] - from[1], a[2] - from[2]], db = [b[0] - from[0], b[1] - from[1], b[2] - from[2]];
  const la = Math.hypot(da[0], da[1], da[2]), lb = Math.hypot(db[0], db[1], db[2]);
  const om = Math.acos(Math.min(1, Math.max(-1, (da[0] * db[0] + da[1] * db[1] + da[2] * db[2]) / (la * lb)))), so = Math.sin(om);
  const wa = so > 1e-6 ? Math.sin((1 - s) * om) / so : 1 - s, wb = so > 1e-6 ? Math.sin(s * om) / so : s;
  for (let k = 0; k < 3; k++) out.dir[k] = da[k] / la * wa + db[k] / lb * wb;
  out.place = s < 0.5 ? leg : 1 - leg;
  const rest = beam.to[out.place], go = BEAMS.pool.go;
  if (beam.water !== undefined) {
    out.length = (beam.water - from[1]) / out.dir[1]; out.held = 1;
    for (let k = 0; k < 3; k++) out.pool[k] = from[k] + out.dir[k] * out.length;
  } else {
    out.length = la + (lb - la) * s; out.held = Math.max(0, 1 - Math.min(s, 1 - s) / go);
    for (let k = 0; k < 3; k++) out.pool[k] = rest.at[k];
  }
  out.pool[1] += rest.lift;
  return out;
}
// THE BEAMS DRAWN: both in one call, each a long thin cone of twelve sides from its mouth and a level disc for its
// pool, laid by the vertex shader from the beam's direction, length and pool (uniforms the update writes from
// beamAt). LAWFUL READINGS (L1): A SHADING BY THE DIRECTION FROM THE BEAM TO THE EYE: lit haze shows by its depth
// along the line of sight, so the beam is brightest along its axis and goes to nothing at its edges, and deeper as
// the eye looks more along it; and A HOLD BY A PIXEL'S FOOTPRINT: its half breadth is never drawn under
// BEAMS.minPixels pixels and its light is lowered by the same ratio, so the thin end at the mouth is a steady line.
// Its light falls as it widens and along its length: white at the mouth alone, then a pale shaft. A pool is a lit patch of
// the thing it lies on: the same from every side, no reading of the eye. Nothing fades or hides by distance to the eye.
const BEAM_SIDES = 12;
const BEAM_VERT = /* glsl */`
attribute vec2 aBeam;                    // which of the two; 0 the cone (position: cos, sin, the share along the beam), 1 the pool (position: a square's corner)
uniform vec3 uFrom[2], uDir[2];
uniform vec4 uRun[2];                    // its length, the share of it where its end begins to go out, its strength, its pool's strength
uniform vec4 uPool[2];                   // its pool's middle and radius across the beam
uniform vec2 uStretch;                   // each pool's length along the beam, in its breadths
uniform vec2 uPx;
varying vec3 vN, vAxis, vW, vQ; varying vec4 vRun; varying float vT, vHold;
void main() {
  bool two = aBeam.x > .5;
  vec3 o = two ? uFrom[1] : uFrom[0], d = two ? uDir[1] : uDir[0];
  vRun = two ? uRun[1] : uRun[0]; vAxis = d; vT = position.z; vHold = 1.; vN = vec3(0., 1., 0.); vQ = vec3(0.);
  if (aBeam.y > .5) {
    vec4 pool = two ? uPool[1] : uPool[0];
    vec2 ax = normalize(d.xz);
    vW = pool.xyz + vec3(ax.x, 0., ax.y) * (position.x * pool.w * (two ? uStretch.y : uStretch.x)) + vec3(-ax.y, 0., ax.x) * (position.y * pool.w);
    vQ = vec3(position.xy, 1.);
  } else {
    float t = position.z, len = vRun.x;
    vec3 side = normalize(cross(d, vec3(0., 1., 0.))), up = cross(side, d), c = o + d * (t * len);
    float r = ${BEAMS.mouth.toFixed(3)} + t * len * ${Math.tan(BEAMS.spread * RAD).toFixed(6)};
    vec4 mv = viewMatrix * vec4(c, 1.);
    float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
    float drawn = max(r, ${BEAMS.minPixels.toFixed(2)} * mPerPx);
    vN = side * position.x + up * position.y; vHold = r / drawn;
    vW = c + vN * drawn;
  }
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uWhite, uHaze, uPoolCol; uniform float uTime;
varying vec3 vN, vAxis, vW, vQ; varying vec4 vRun; varying float vT, vHold;
float bh(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float bn(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(bh(i), bh(i + 1.), f); }
void main() {
  if (vQ.z > .5) {
    float f = max(1. - dot(vQ.xy, vQ.xy), 0.);                      // a pool: brightest in its middle, out to nothing at its rim
    gl_FragColor = vec4(uPoolCol * (vRun.w * f * f), 1.);
    return;
  }
  vec3 v = normalize(vW - cameraPosition), a = normalize(vAxis), vp = v - a * dot(v, a);
  float s = length(vp);                                             // the sine of the angle between the line of sight and the beam
  float across = max(-dot(normalize(vN), vp / max(s, 1e-4)), 0.);   // the line of sight's chord through the beam, as a share of its breadth
  float m = vT * vRun.x, thin = ${BEAMS.mouth.toFixed(3)} / (${BEAMS.mouth.toFixed(3)} + m * ${Math.tan(BEAMS.spread * RAD).toFixed(6)});   // metres from the mouth; the mouth's breadth over the beam's here
  float along = smoothstep(0., 1.5, m) * (1. - smoothstep(vRun.y, 1., vT)) * exp(-${BEAMS.fade.toFixed(2)} * vT);   // lit from its mouth, spent by its length, out at its end
  along *= 1. + ${BEAMS.low.more.toFixed(2)} * exp(-max(vW.y - ${FRAME.groundY.toFixed(1)}, 0.) / ${BEAMS.low.height.toFixed(1)});   // and brighter in the thicker haze low over the grounds
  // the haze's thicker and thinner stretches drift along the beam by the clock
  float q = m / ${BEAMS.drift.size.toFixed(1)} - uTime * ${BEAMS.drift.rate.toFixed(2)};
  float haze = 1. + ${BEAMS.drift.depth.toFixed(2)} * (bn(q) + .5 * bn(q * 2.7 + 5.) - .75) * 2.;
  vec3 col = mix(uHaze, uWhite, across * across * thin);            // white in its heart at the mouth, bluish haze beyond
  gl_FragColor = vec4(col * (vRun.z * vHold * pow(thin, ${BEAMS.fall.toFixed(2)}) * pow(across, ${BEAMS.edge.toFixed(1)}) / max(s, ${BEAMS.cap.toFixed(2)}) * along * haze), 1.);
}`;
function makeBeams(A, hero) {
  const pos = [], which = [], idx = [], n = BEAM_SIDES, RINGS = 6;
  for (let b = 0; b < 2; b++) {
    const base = pos.length / 3;
    for (let j = 0; j <= RINGS; j++) for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n; pos.push(Math.cos(a), Math.sin(a), j / RINGS); which.push(b, 0); }
    for (let j = 0; j < RINGS; j++) for (let i = 0; i < n; i++) { const p = base + j * n + i, q = base + j * n + (i + 1) % n; idx.push(p, p + n, q + n, p, q + n, q); }
    const pool = pos.length / 3;
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); which.push(b, 1); }
    idx.push(pool, pool + 2, pool + 1, pool, pool + 3, pool + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('aBeam', new THREE.BufferAttribute(new Float32Array(which), 2));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  const L = BEAMS.list, P = ROUTE.places, tan = Math.tan(BEAMS.spread * RAD);
  const reach = Math.max(...L.flatMap((b, i) => b.to.map((p) => dist3(p.at, A.projectors[i]))));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, LV.terrace, 0), reach + 40);
  const v4 = () => [new THREE.Vector4(1, 1, 0, 0), new THREE.Vector4(1, 1, 0, 0)];
  const U = { uFrom: { value: A.projectors.map((p) => new THREE.Vector3().fromArray(p)) }, uDir: { value: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)] },
    uRun: { value: v4() }, uPool: { value: v4() }, uStretch: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
    uPx: hero.uniforms.uPx, uWhite: { value: new THREE.Color().fromArray(BEAMS.white) }, uHaze: { value: new THREE.Color().fromArray(BEAMS.haze) }, uPoolCol: { value: new THREE.Color().fromArray(BEAMS.pool.colour) } };
  const material = lightMaterial(U, BEAM_VERT, BEAM_FRAG), mesh = new THREE.Mesh(g, material), at = { dir: [0, 0, 0], length: 0, pool: [0, 0, 0], held: 0, place: 0 };
  // the cone is seen from outside (the flown line never comes within 40 m of it): its near side alone is drawn, so each
  // line of sight adds the beam's depth once; a pool's disc is laid face up
  material.side = THREE.FrontSide;
  mesh.name = 'tower-beams'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 4;
  return { mesh, uniforms: U, triangles: idx.length / 3,
    update(time, metres) {
      U.uTime.value = time;
      for (let b = 0; b < 2; b++) {
        // lit, and doused, by the metres flown between the route's own places: it comes on over the first half
        // of its `lit` stretch (a `late` beam over the second half) and is doused over the first half of its `out`
        const beam = L[b], l0 = P[beam.lit[0]], l1 = P[beam.lit[1]], lm = (l0 + l1) / 2;
        const lit = (beam.late ? smooth(lm, l1, metres) : smooth(l0, lm, metres)) * (beam.out ? 1 - smooth(P[beam.out[0]], (P[beam.out[0]] + P[beam.out[1]]) / 2, metres) : 1);
        beamAt(beam, A.projectors[b], time, at);
        const stretch = Math.min(1 / Math.max(-at.dir[1], 0.05), beam.to[at.place].stretch);
        U.uDir.value[b].fromArray(at.dir);
        U.uRun.value[b].set(at.length, BEAMS.end[1] + (BEAMS.end[0] - BEAMS.end[1]) * at.held, beam.level * lit, beam.poolLevel * lit * at.held);
        U.uPool.value[b].set(at.pool[0], at.pool[1], at.pool[2], Math.min(BEAMS.pool.k * (BEAMS.mouth + at.length * tan), BEAMS.pool.most));
        if (b) U.uStretch.value.y = stretch; else U.uStretch.value.x = stretch;
      }
    },
    dispose() { g.dispose(); material.dispose(); } };
}

// THE BENGAL FIRE (figures C: a hundred red flames and red smoke on all the decks; sudden, brief, then dark;
// src-light.md 4: "deux embrasements" of a Sunday evening, "a plusieurs reprises" on 6 May). BY METRES FLOWN IT
// FLARES TWICE AND DIES TWICE
// (bengalFlares): once on the climb, rising from half way between helixGarden and helixDownstream, full from
// helixDownstream to helixRiver, its flames out half way to helixTop; and once on the run back, full over the
// stretch from which the whole tower stands in the picture (axisWholeFrom to axisWholeTo, found by the route's own
// geometry), rising over half that stretch's length before it and its flames out half its length after it. One
// number, bengalAt(metres), 0 to 1, gives the flames' strength and the red on the iron (the hero's uGlow).
// THE SMOKE OUTLASTS THE FLAMES (bengalSmokeAt): its columns grow with the metres flown from where a flaring
// begins to rise and stand whole where it is full; from where the flames begin to die it thins, by metres flown,
// to nothing at helixTop (the first) and at portalRun (the second), so it hangs on the decks, ever fainter, well
// after the flames are out. As the flames go out its red goes too and it is lit dull and grey by the platforms'
// gas below; no new smoke leaves a dead fire, so the hanging smoke lifts off the decks' rims as it thins.
// BY THE CLOCK the flames flicker and wave and the smoke's wisps climb their plumes, which sway and lean down the
// flags' wind.
// THE SMOKE IS THIN AND THE FIRE'S OWN: eighteen slender plumes, each over one fire, red at the foot where the
// flames light it and dark above, none a third as broad as the tower at its deck; the tower's outline stays
// the iron's own. THE LIGHT SHOW IS THE IRON: the fires' red on the lattice (the hero's uGlow: from each deck's height
// over a low red on all the iron, with its ripples by the clock, uGlowWave) and the flames, each a small bright
// tongue half a metre outside its platform's rail, at the rail's height.
// WORKING: every size, colour and strength here; the half minute between the two flarings (the sources' half hour
// drawn into one flight).
const BENGAL = {
  flame: { half: 3.4, lift: 1.53, level: 4.5, coreLevel: 14, haloK: 0.55, halo: 0.045 },   // a flame's square (half its side, metres), its middle's height over the fire's place, its strengths; its own halo's strength and breadth
  red: [1.0, 0.07, 0.03], core: [1.0, 0.56, 0.36],     // a flame's red, and the pale rose of its heart (each fire tells as a point of its own)
  iron: [1.0, 0.03, 0.02],                           // the red light on the iron at the first deck's own height (it falls off up and down the iron from each deck): a deep red, under the paint's white-out
  // A PLUME OF SMOKE: one slender column over a fire. tall: its height in metres; wide: half its blade's breadth at its head
  // and foot: its foot's share of that; lean: how far its head stands down the wind; life: the seconds its wisps
  // take from foot to head; sway, curl: its line's wander by the clock and its wisps' curl, each as a share of
  // its breadth; alpha: its cover at its thickest;
  // low, high: its colours at its foot and its head in the fire's own light; gasLow, gasHigh: the same once the
  // flames are out and the platforms' gas alone lights it; each, first: on each deck one fire in this many carries
  // a plume, beginning with this one of the deck's own count (three to a side of the first deck, one to a side of
  // the second, two on the terrace); lift: the share of its height its foot has left the fires by once they are out
  smoke: { tall: 60, wide: 8, foot: 0.16, lean: 18, life: 7, sway: 0.22, curl: 0.3, alpha: 0.6, low: [0.62, 0.07, 0.045], high: [0.06, 0.025, 0.035],
    gasLow: [0.24, 0.215, 0.205], gasHigh: [0.15, 0.145, 0.16], each: [6, 5, 4], first: [2, 2, 0], lift: 0.15 },
  decks: [72, 20, 8], scale: [1, 0.8, 0.55],         // the fires on each deck (figures C's hundred); the flames' and plumes' size there
  grow: 1.2,                                         // the column stands this many times its height where a flaring is full
};
// THE TWO FLARINGS, each as counts of metres flown between the route's own places: where it begins to rise, where it
// is full, where it begins to die, where its flames are out, and where the last of its smoke is gone.
function bengalFlares(P) {
  const h = (P.axisWholeTo - P.axisWholeFrom) / 2, mid = (a, b) => (a + b) / 2;
  return [
    { rise: mid(P.helixGarden, P.helixDownstream), full: P.helixDownstream, die: P.helixRiver, out: mid(P.helixRiver, P.helixTop), gone: P.helixTop },
    { rise: P.axisWholeFrom - h, full: P.axisWholeFrom, die: P.axisWholeTo, out: P.axisWholeTo + h, gone: P.portalRun },
  ];
}
// the flames' level at a count of metres flown, 0 to 1 (the two flarings never overlap)
function bengalAt(P, metres) {
  let fire = 0;
  for (const F of bengalFlares(P)) fire = Math.max(fire, smooth(F.rise, F.full, metres) * (1 - smooth(F.die, F.out, metres)));
  return fire;
}
// THE SMOKE at a count of metres flown: out.level, its cover (it comes up with its flames, stands while they burn
// full, and thins from where they begin to die to nothing at the flaring's `gone`, well past where they are out:
// smoke does not go out with a flame),
// and out.grown, how high its columns have grown since the flaring began (in column heights)
function bengalSmokeAt(P, metres, out = { level: 0, grown: 0 }) {
  out.level = 0; out.grown = 0;
  for (const F of bengalFlares(P)) if (metres > F.rise && metres < F.gone) {
    out.level = smooth(F.rise, F.full, metres) * (1 - smooth(F.die, F.gone, metres));
    out.grown = BENGAL.grow * (metres - F.rise) / (F.full - F.rise);
  }
  return out;
}
const FIRE_VERT = /* glsl */`
attribute vec3 iPos;                     // a fire's place (a plume stands over its own fire)
attribute vec4 iPar;                     // a number of its own, its kind (0 a plume of smoke, 1 a flame), its deck's scale
uniform float uTime, uFire, uSmoke;      // the clock; the flames' level and the smoke's (metres flown)
varying vec2 vQ; varying vec3 vF;        // vF: kind, the item's number, its strength
void main() {
  float n = iPar.x, kind = iPar.y, size, show, high = 1.;
  vec3 c = iPos;
  if (kind < .5) {
    // a plume: its line runs from the fire's place up to its head, which stands down the flags' wind
    c += vec3(${(Math.cos(FLAG.wind) * BENGAL.smoke.lean).toFixed(3)}, ${BENGAL.smoke.tall.toFixed(1)}, ${(Math.sin(FLAG.wind) * BENGAL.smoke.lean).toFixed(3)}) * ((position.y * .5 + .5) * iPar.z);
    size = ${BENGAL.smoke.wide.toFixed(2)} * iPar.z; high = 0.; show = uSmoke * iPar.z;   // (a smaller deck's fewer fires give a thinner smoke)
  } else {
    size = ${BENGAL.flame.half.toFixed(2)} * iPar.z; c.y += ${BENGAL.flame.lift.toFixed(2)} * iPar.z;
    show = uFire * (.78 + .14 * sin(uTime * 13. + n * 50.) + .08 * sin(uTime * 29. + n * 131.));
  }
  size *= step(1e-3, show);                                         // nothing is drawn of a flame that is out or of smoke that is gone
  // a flame and a plume stand upright in the world and are round about their uprights: each is a blade that turns
  // about its upright alone, to the eye (the plume's corners already stand at its foot and its head)
  vec2 e = cameraPosition.xz - c.xz, sd = normalize(vec2(e.y, -e.x) + 1e-5);
  vec4 mv = viewMatrix * vec4(c + vec3(sd.x * position.x, position.y * high, sd.y * position.x) * size, 1.);
  vQ = position.xy; vF = vec3(kind, n, show);
  gl_Position = projectionMatrix * mv;
}`;
const FIRE_FRAG = /* glsl */`
uniform float uTime, uFire, uGrown; uniform vec3 uRed, uCore, uSmokeLow, uSmokeHigh, uGasLow, uGasHigh;   // uGrown: how high the plumes have grown (metres flown)
varying vec2 vQ; varying vec3 vF;
float fh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(fh(i), fh(i + vec2(1., 0.)), f.x), mix(fh(i + vec2(0., 1.)), fh(i + 1.), f.x), f.y); }
void main() {
  float n = vF.y;
  if (vF.x < .5) {
    // A SLENDER PLUME: s is the share of its height. It is narrow at its foot and broadens to its head; its line
    // sways by the clock (more the higher) and curls with its wisps; it is soft at its edges; its wisps climb it
    // by the clock (a noise drawn out along the plume that travels foot to head in the smoke's life). It is shown as high as the column
    // has grown, thins out toward its head, and its foot leaves the fires as they die. Lit from below: by the
    // flames while they burn (red at the foot, dark above), by the platforms' gas alone once they are out (grey).
    float s = vQ.y * .5 + .5, w = (${BENGAL.smoke.foot.toFixed(2)} + ${(1 - BENGAL.smoke.foot).toFixed(2)} * pow(max(s, 0.), .7)) * ${(1 - BENGAL.smoke.sway - BENGAL.smoke.curl / 2).toFixed(2)};
    float climb = uTime / ${BENGAL.smoke.life.toFixed(1)};
    float line = ${BENGAL.smoke.sway.toFixed(2)} * s * (.6 * sin(s * 4.1 - uTime * .7 + n * 40.) + .4 * sin(s * 9. - uTime * 1.5 + n * 23.))
      + ${BENGAL.smoke.curl.toFixed(2)} * s * (fn(vec2(s * 5. - climb * 5., n * 31.)) - .5);
    float d = (vQ.x - line) / w, body = max(1. - d * d, 0.);
    float wisp = .6 * fn(vec2(d * 1.7 + n * 9., s * 9. - climb * 9.)) + .4 * fn(vec2(d * 3.3 - n * 5., s * 21. - climb * 21.));
    float foot = ${BENGAL.smoke.lift.toFixed(2)} * (1. - uFire);
    float along = smoothstep(foot, foot + .1, s) * (1. - smoothstep(.55, 1., s)) * (1. - smoothstep(uGrown - .25, uGrown, s));
    float a = body * body * along * smoothstep(.3, .62, wisp + .3 * (1. - s)) * vF.z * ${BENGAL.smoke.alpha.toFixed(2)};
    float up = smoothstep(0., .4, s);
    vec3 col = mix(mix(uGasLow, uGasHigh, up), mix(uSmokeLow, uSmokeHigh, up), uFire);
    gl_FragColor = vec4(col * a, a);
  } else {
    // a tongue of flame from its foot to its tip, waving by the clock, with a paler heart, in its own red halo
    float y = (vQ.y + .45) / (.85 + .15 * sin(uTime * 7. + n * 60.)), up = clamp(y, 0., 1.);
    float sway = up * (.10 * sin(y * 5. + uTime * 9. + n * 40.) + .05 * sin(y * 11. - uTime * 14. + n * 71.));
    float w = .17 * pow(1. - up, .6) * smoothstep(0., .1, y) + 1e-3, d = abs(vQ.x - sway) / w;
    float tongue = (1. - smoothstep(.5, 1., d)) * step(0., y) * step(y, 1.), heart = (1. - smoothstep(0., .7, d)) * (1. - up);
    vec2 h = vQ - vec2(0., -.25);
    float halo = exp(-dot(h, h) / ${BENGAL.flame.halo.toFixed(3)}) * max(1. - dot(vQ, vQ), 0.);   // a small glare about its foot, out to nothing inside the square
    gl_FragColor = vec4((uRed * (tongue + ${BENGAL.flame.haloK.toFixed(2)} * halo) + uCore * (heart * tongue)) * vF.z, 0.);
  }
}`;
function makeBengal(A, hero) {
  const pos = [], par = [], g = spriteQuad(), B = BENGAL, col = (a, k = 1) => new THREE.Color(a[0] * k, a[1] * k, a[2] * k);
  // the plumes first (they are drawn under the flames): one over a fire in every few of a deck's own count
  const deckOf = (i) => (i < B.decks[0] ? 0 : i < B.decks[0] + B.decks[1] ? 1 : 2), firstOf = [0, B.decks[0], B.decks[0] + B.decks[1]];
  A.bengal.forEach((p, i) => {
    const d = deckOf(i);
    if ((i - firstOf[d]) % B.smoke.each[d] === B.smoke.first[d]) { pos.push(p[0], p[1], p[2]); par.push(hash01(i * 5 + 301), 0, B.scale[d], 0); }
  });
  const plumes = par.length / 4;
  A.bengal.forEach((p, i) => { pos.push(p[0], p[1], p[2]); par.push(hash01(i * 5 + 302), 1, B.scale[deckOf(i)], 0); });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(par), 4));
  g.instanceCount = par.length / 4; g.boundingSphere = towerSphere(B.smoke.tall + B.smoke.lean + B.smoke.wide);
  const U = { uTime: { value: 0 }, uFire: { value: 0 }, uSmoke: { value: 0 }, uGrown: { value: 0 }, uRed: { value: col(B.red, B.flame.level) }, uCore: { value: col(B.core, B.flame.coreLevel) },
    uSmokeLow: { value: col(B.smoke.low) }, uSmokeHigh: { value: col(B.smoke.high) }, uGasLow: { value: col(B.smoke.gasLow) }, uGasHigh: { value: col(B.smoke.gasHigh) } };
  // the smoke veils what is behind it and the flames add their light, in one call: colour already times its cover
  const material = new THREE.ShaderMaterial({ uniforms: U, vertexShader: FIRE_VERT, fragmentShader: FIRE_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, material), P = ROUTE.places, smoke = { level: 0, grown: 0 }, glow = hero.uniforms.uGlow.value, wave = hero.uniforms.uGlowWave.value;
  mesh.name = 'tower-bengal-fire'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 2;
  return { mesh, uniforms: U, triangles: g.instanceCount * 2, plumes, flames: A.bengal.length,
    update(time, metres) {
      const fire = bengalAt(P, metres), waver = 0.9 + 0.1 * Math.sin(time * 11.3) * Math.sin(time * 7.1 + 1);
      bengalSmokeAt(P, metres, smoke);
      U.uTime.value = time; U.uFire.value = fire; U.uSmoke.value = smoke.level; U.uGrown.value = smoke.grown;
      glow.setRGB(B.iron[0] * fire * waver, B.iron[1] * fire * waver, B.iron[2] * fire * waver);   // the iron glows red from within, by the fire's own level
      wave.set(time * GLOW_WAVER.rate[0], time * GLOW_WAVER.rate[1] + 2, time * GLOW_WAVER.rate[2] + 4);   // and its red ripples away from each deck's fires, by the clock
    },
    dispose() { g.dispose(); material.dispose(); } };
}

// what the proofs and the tools read of the lights
export const LIGHTS = { gas: GAS, beacon: BEACON, beams: BEAMS, bengal: BENGAL, lampStages, beaconAt, bengalAt, bengalFlares, bengalSmokeAt };

// THE TOWER'S LAMPS, the part's second contract. ctx: the engine's. hero: what buildHero returned (its anchors and
// its uniforms). opts.nightAt: the world's night number at a count of metres flown (0 dusk, 1 night); without it the
// night is taken as come. Returns { group, triangles, calls, update(dt, time, metres), dispose(), stats }.
// update writes uniforms only, each from the clock or from the metres flown.
export async function buildLamps(ctx, hero, opts = {}) {
  const A = hero.anchors, nightAt = opts.nightAt || (() => 1), group = new THREE.Group();
  group.name = 'tower-lights';
  await ctx.yield();
  const gas = makeGasLamps(A, hero);
  group.add(gas.mesh);
  await ctx.yield();
  const beams = makeBeams(A, hero);
  group.add(beams.mesh);
  await ctx.yield();
  const fire = makeBengal(A, hero);
  group.add(fire.mesh);
  await ctx.yield();
  const parts = [gas, beams, fire];
  return {
    group, triangles: parts.reduce((s, p) => s + p.triangles, 0), calls: parts.length,
    stats: { burners: gas.deal.burners, globes: gas.deal.globes, stages: gas.deal.stages, flames: fire.flames, plumes: fire.plumes },
    update(dt, time, metres = 0) { const night = nightAt(metres); for (const p of parts) p.update(time, metres, night); },
    dispose() { for (const p of parts) p.dispose(); },
  };
}
