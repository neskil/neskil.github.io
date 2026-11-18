// The doubled city (hero set piece of city-doubled-in-its-lake): the veranda house (a gallery before a wall) and
// its room, the high street, the quay and its boats, the harbour behind the pier, the crest's arcade of two
// storeys with the tall veranda house beside it, the causeway on great rings and the jetty; and THE DOUBLING.
//
// THE DOUBLING: every mesh of the upper city goes through ONE maker (makeDoubler().add). It hangs the mesh in the
// upper group and lays a twin in a group scaled (1, -1, 1) about the water's plane y = 0. The twin SHARES the
// geometry, the instance buffers and the shader source, and reads the same clock uniform: there is no second plan
// and no second deal. The shader lights in the city's own space (before the turn about the plane) with the city's
// own sun, so the twin is lit by a sun below the plane and shaded where the upper is shaded. Movement is a law of
// the vertex shader in that same space: what rises above sinks below.
// LOWER TONE: one typed figure, LOWER_TONE = 0.32 (red x 0.68, green x 0.84, blue x 1, haze x 0.68).
//
// ROUND 2, STAGE F (what this file does now): the surface kinds are fifteen (KIND below, and RAIL 12, ARCADE 13,
// WALL 14 set after the shells); the bastions' stone (kind WALL) also clothes the causeway's leads, and the
// terraces' cut ends take its colour; a face turned from the sun takes a fifth less of the fill, pale stone a
// third less; the lake carries long ripples and cat's-paws by the clock (makeWater); the leaves stir in
// every crown, hedge and hanging green (kind LEAF with its figure of movement; a leaf laid without one stands:
// the lake rocks' cypresses and bushes, some small greens on the quay);
// (ROUND 5 MENDING 5, L5: ONE RULE ROUND THE WHOLE CITY: every house draws one share of life, and by it its cloth,
// its arcade's curtains and its lit rooms, wherever it stands; a pennant on every gate house and every islet's
// house; the water's light under every arch by its height over the plane; one strength of cat's-paws, shiver and
// ripples on all open water outside the bay; the far water's glitter by place and clock); the quay's lamps
// stand on stone posts, standing lanterns on the high street's coping, a lamp standard at each planted bay;
// PHONES: buildHero reads opts.detail (ctx.quality.detail) and thins the furnishings, far curtains, floats,
// leaves, cypresses and smoking chimneys evenly after they are laid.
//
// ROUND 5 (what this file does now, beside the above): A WALL BEHIND EVERY GALLERY: each room's unit carries the
// house's wall 1.9 m behind its open front (a face flagged 2, an open end's side flagged 3); the shader cuts the
// doorway and windows and paints leaves, shutters, lintel and sill by the room's and the house's own figures, and
// a room's upright face seen from outside is house wall too. THE DAWN GRADE: gold in the sun, blue-violet in the
// shade, a warm rim, in the fragment shader's last block (dayK, litB, rimB). THE CREST: makeHall builds the arcade
// of two storeys in honey stone. (ROUND 5 MENDING 2, the book guard: the stone belvedere tower is gone, no bell
// tower; beside the hall's end stands a veranda house grown tall, six bays and seven timber galleries under one low
// hipped roof of slate, laid by the houses' own makers: crestLot, crestHouse; about one of its rooms in six is
// lit, at any hour, and its galleries carry the near houses' things; mending 4: a deep dark eave. A pennant is a
// narrow strip of ochre-grey linen that hangs straight from a short yard and sways slowly from it (mending 4;
// mending 5: on every gate house and every islet's house). By day every room takes a warm light behind the
// house's wall, and one large thing is painted on each bay's back wall behind its doorway.) Roofs are slate,
// blue-green and timber brown (red tile rare, none in the harbour), a hipped roof coursed with a ridge and hip
// cap; cloth is plain; floats are cork and timber; boats lie moored standing off at posts with rings, along the
// whole quay, off the jetty, in the mooring field on the causeway's lake side and in the roadstead off the near
// rock. The build rests inside
// makeShells, layRooms and the shade map's first rows.
// STREAMS: this file makes none; every maker draws from the stream the world hands it by name (plan, houses,
// rooms, cloth, lamps, boats, trees, rare, shore, crest, pennant, road, flank; road: the lake rocks' crags, the
// near rock's cypresses and pennant, the roadstead; flank: the stair lanes' flank walls' arches, the islets'
// footing stones). EVERY SEED IS DEALT ONCE: what the line's rule takes is drawn first and tested after; the
// line's distance from a thing changes no stream's draws. The garden terrace's length alone is found from the
// line's plan and moves the quay's lots past it. TWO EXCEPTIONS to "no draw thrown away", said as they are:
// the shore's stream goes on taking 24 draws a lake rock for an outline that nothing reads (makeFarShore);
// the stream road takes two draws a lake rock that nothing reads, a point's drop and a summit's place for
// the house's crag, which is level and has no point (dealCrags).
//
// WHAT READS THE LENS here (section 153), by where the eye IS, never by where it looks:
// the dome goes with the eye and the smoke's dabs face it.
// FADES OF FINE DETAIL BY THE EYE'S DISTANCE (from, to, metres): the facade's fine detail (fw) whole at the eye,
// gone by 90; the louvres 8 to 18; the rail's shadow baluster by baluster to 4, one even shade from 6.5; the
// water's net under the arches 25 to 60; the 5 m glints in 60 to 150, out 350 to 700; the 20 m glints in 350 to
// 700; the fine sparkle out by 260; the sheet's far sheen 120 to 900 (the same fade weakens the long ripples by
// six tenths and the cat's-paws' shiver by eight tenths); the shore rings' brightening and a slow noise of the
// sheen whole at the eye, gone by 160; the sun's far path's sheen in 40 to 160 beyond the lower sun, 150 to 400
// at it; the haze.
// FILTERS BY THE PIXEL'S FOOTPRINT (fwidth): the rail's balusters; the jetty's planks, their tones and seams; the
// bright line at the waterline; on the plane the boats' wide rings (1.25 to 2.5 m), the piers' and piles' rings
// (0.6 to 1.2 m), the breath band's brightening and flecks by day (3 to 9 m).
// LIGHT ON WATER AND GLASS (the eye's place against the place lit): the glass's glint, the warm rim, the water's
// Fresnel and sheen by the angle at which the water is seen, the long ripples' two weights by that angle, the
// open lake's cat's-paws by that angle, the harbour's pale sky by that angle, the sun's glitter path by the sun's
// bearing and height.
// Nothing is placed, hidden, moved or sized by the lens: no law moves a built point by it.
//
// THE RULES OF PLACE in this file (typed once; the world's head lists them all with the line's own, LINE_N 4 and
// LINE_H 6, which the world asks through opts.keep): MOOR_OFF 12 to 20 m, MOOR_GAP 13 m (no two posts off the
// quay, off the jetty or in the roadstead nearer than that, 13.0 m and more on seeds 1 to 300; NOT asked of the
// field's row, whose posts stand 9.4 m apart along the row, nor of the harbour's berth posts, 4.4 to 22.9 m
// from the nearest other of them), MOOR_POST 2.4 m, MOOR_FIELD 10 m, MOOR_ROW 8, MOOR_STAG 2.5 m (every second
// post of the field's row that far out of the row's line toward the lake, by its place and no draw;
// neighbours 9.7 m apart), MOOR_BESIDE 2.2 m, MOOR_QUARTER 1.5 m (layBoats: every boat moored at a post lies
// beside it, the post abreast of its quarter ON THE BOAT'S SIDE TOWARD THE FLOWN LINE BY DISTANCE IN SPACE
// (opts.distToLine, asked at the plane), every post MOOR_BESIDE from its own boat's axis and none nearer than
// 2.19 m to any hull's axis (2.198 m at the least on seeds 1 to 300); every post is one plain
// tall pile of one timber tone, mooringPile), HULL_GAP 1.5 m of clear water and more between any two hulls'
// outlines (1.54 m at the least on seeds 1 to 300; the later comer is not laid, nor its post, after its
// draws), MAX_BOATS 40 (every boat has its rings; 38 boats at the most on seeds 1 to 300).
// THE HAND OF THE BOWS, by the mooring's kind: off the quay toward the west horn, off the jetty toward the
// ring, in the field toward the open lake, in the roadstead toward the causeway's foot, each turned 0.05 to
// 0.4 rad to the open water (the roadstead's toward the line). On seeds 1 to 300, against the line's direction
// at its nearest place in plan, every boat of the jetty, the field and the roadstead heads against it and
// every quay boat against the line's run along the quay; THE EXCEPTION: 137 of the 4,104 quay boats, 14 to
// 24 m from the jetty's root, lie nearest the line's END on the jetty, which passes them from abaft the beam.
// NOT OF THIS HAND AT ALL: the harbour's berth boats (bow on to the west flank and to the head's quay), the
// harbour's two boats lying free (any heading, by a draw), the second islet's four (two along its quay's
// front, one along each side).
// LIFE_LO 0.3 to LIFE_HI 0.9, one share of life per house (layRooms: every bay of every house dealt takes its
// draws, so what the line passes or takes changes none of the three streams);
// near detail by the distance from the line: houses whole within 52 m and plainer to 110 m, curtains in full form
// within 40 m, gallery posts within 44 m, the rail's top and a cloth over the rail within 42 m (none within 9 m),
// the hanging lamp within 31 m, a room's things within 24 m, the enfilade's lamp on a quay house's first veranda
// within 30 m, the arcade's reveals within 27 m, swags 9 to 26 m off beside the rising street, a chimney's full
// smoke within 60 m and on the three nearest; the houses that stand free whole at any distance, the crest house
// as at 20 m, the gate houses by their distance; THE GARDEN TERRACE from the east bastion to where the line's
// plan crosses the quay houses' front line outward and three bays further (P.gardenLen, 37.5 to 40.2 m on
// seeds 1 to 300; the quay's lots past it begin where it ends); up to two of the rising street's three planted
// bays with a low cypress, each with its long shadow (P.belvTree); TWO MASTS at the quay's edge, MAST_OFF 6 m
// to each side of the fourth lane's foot (the water stair's head); a pennant on every gate house, every islet
// house and the near rock's house; the water's light under every arch whole to 9 m over the plane, gone by
// 24 m.
// THE LAKE ROCKS (makeFarShore, dealCrags, buildCrag): two rocks with a small house each, dealt 200 to 290 m
// from the bay's centre, 100 to 165 degrees round, one to each hand. THE FAR ISLET stays there (the one across
// the bay's axis from the causeway's foot). THE NEAR ROCK is the other, by the same three draws abreast of the
// causeway's second span on its lake side, its middle ROCK_OFF 70 to 110 m beyond the line's plan (its feet
// 55 m and more from it), its long axis along the causeway turned 0.05 to 0.3 rad, the end toward the second
// islet swung out; 48 to 58 m long, 19 to 24 m broad on seeds 1 to 300. THE LAW OF CRAGS (stream road): CRAG_N
// 4 or 5; one great crag at one end, CRAG_GREAT 12 to 16 m high and 14 to 20 m broad at its foot, of three
// points; the house's crag, CRAG_HOUSE 8 to 11 m, level on top; two low stones, CRAG_LOW 3 to 7 m, of two
// points each; a fifth, if dealt, a low stone before the join of the great crag and the house's; no two points
// of a crag and no two low stones alike in height by less than a metre; every side steep, with the damp band.
// ROCK_TONE 0.67 of the quay's ashlar, three quarters of the way to grey, a touch cool. Its house on a terrace
// of the bastions' pale stone on the level crag (the wall carried down up to 3 m), a mast of 6 m with a
// pennant, two or three cypresses of 3.6 to 6 m at one end of the terrace. The far islet by the same law at
// two thirds (every height, and every crag's plan but its house's), no mast, no cypress, three low bushes.
// BY NIGHT WHAT STANDS ON THE OPEN LAKE IS DARK AS A WHOLE and the law reads the thing itself: the rocks, their
// houses and the islets' footing are one mesh whose material carries uLake 1; by night it keeps 0.15 of its
// light wherever it stands (the near rock's pennant and yard 0.12 and 0.15 of their day's tones).
// THE ROADSTEAD (layBoats): ROAD_N 2 to 3 boats off the near rock ON ITS SIDE TOWARD THE LINE BY DISTANCE IN
// SPACE, each beside its own pile by the moorings' rules; a pile ROAD_OFF 15 to 40 m from the crags' feet (its
// draw held 2.7 m inside both ends: piles 17.7 to 37.8 m, boats' middles 15.1 to 37.4 m on seeds 1 to 300;
// every pile 2.2 m from its boat's axis, the boat heading along the causeway and turned by its own normal);
// ROAD_SPAN 68 m: the piles spread along the rock's axis over 0.6 of that to either hand of its middle, each
// in its own half or third; every draw from the stream road; two boats on 139 seeds of 1 to 300, three on 161.
// THE ISLETS' FOOTING (makeFooting): at each of a plinth's four corners FOOT_N 2 or 3 stones (8 to 12 an
// islet), fanned from the corner (22, 45 and 68 degrees, or 30 and 60), FOOT_OUT 1 to 3 m long and 0.7 to
// 1.2 m broad, FOOT_H 0.5 to 1.6 m over the plane, of ROCK_TONE with the damp band, from the stream flank; a
// stone left out after its draws where the rule of the line refuses it or where less than half a metre of
// water would be left to a hull, a mooring pile or the bay islet's bridge (fewer stones where boats and the
// bridge leave no water: the opening's islet keeps 8 to 12 on every seed of 1 to 300, the bay's 8 to 12 on
// 222 and 4 to 7 on 78).
// THE STAIR LANES' FLANK WALLS (makeFlankWalls): FLANK_NEAR 30 m, in space, from the line to the gap wall's
// foot at the lane's middle (asked 2 m over the tier's floor). On a near wall every blind arch that stands
// whole and clear (a bay to every 6.4 m, head 5.2 m and more, 1.9 m from a house's flank, 0.8 m from the
// stair's end, 1.1 m from a flight wall's ends) holds, 0.22 m back in jambs and a lintel, a timber door of
// 1.7 by 2.5 m on a stone step (the gap's wall, three arches in five) or a shuttered window of 1.6 by 2 m on a
// sill; at one arch in two green hangs from the wall's head, three strips 1 m wide and 1.2 to 3 m long; a
// string course 0.28 m high at each landing's height (6 and 12 m on the gap's wall), stopped 2 m either side
// of an arch that reaches it; every arch draws from the stream flank, near or not. A wall further off stays
// plain; A FACE WITHOUT A BLIND ARCH STAYS PLAIN, near or not (the first flight's wedge wall carries nothing;
// a near wall's stretch under 5.2 m the string course alone). On seeds 1 to 300: 1 to 3 near gaps a seed (2 on
// 262), 1 to 4 furnished arches each, 266 triangles each at the most (532 with the double).
// THE JOINS' LIGHTS BY THE HOUR (the newels' lanterns, the bright line on a water stair, a chain's ring): by
// day at six tenths of the night's light; A CHAIN'S RING BY NIGHT at a fifth (0.2 against a lantern's 1).
// ASKED OF THE RULE OF THE LINE besides boats, posts, floats, buoys, trees, pergola posts and roofs: the west
// rim's pots, the quay's lamp posts (none from the rising street's foot to the east bastion: no quay's edge
// there), the two masts, the islets' footing stones. NOT ASKED, the street's own fittings: the balustrade's
// lanterns. THE BALUSTRADE'S DISTANCE FROM THE LINE'S PLAN, as it is: 2.6 to 2.95 m from the rising street's
// foot to 40 m before its top, under 2.4 m from 32 m before the top, 1.2 m at 20 m, 0.7 m at the least, 12 m
// before the top; there the line turns INLAND from it over the west bastion's top and the harbour's water
// (2.9 m off at the street's top, 10 m by the inlet's middle): its plan never crosses the balustrade's. Every
// lantern of the rising street stands inside LINE_N (1.1 to 2.9 m from the plan, the line 0.8 to 3.1 m over
// its top): the rule would take them all. They keep a typed stretch instead: none stands from 9 m before the
// street's top to 2 m past the inlet's middle, and on the street's last 40 m they have no stem; each of the
// SIX on the rising street has its top 2.7 m and more from the line in space (seeds 1 to 300). A lantern is
// laid only where the balustrade stands under it, west of the harbour's mouth: none over the open mouth
// (makeStreetThings).
// THE GAZE'S FIGURES are the world's (SWING_RATE 2.5 degrees a metre: 20 degrees a second of the gaze's own
// turn at 8 m a second; with the way's own turn the camera tool reads 26.4 to 26.8 on seeds 1 to 300, under
// its bound of 30; GAZE_CAP 72: up to 72.7 read, under 75).
// TRIANGLES on the densest seed of 1 to 300 (seed 147, counted in round 5 mending 7): built 474,784; rendered
// with the portal's ring 475,795 to 475,893, in 82 to 84 calls. Beyond seeds 1 to 300 a seed can build more:
// seed 1947 builds 479,890 and renders 480,869 to 480,967, over the lead's 480,000, under the owner's 500,000.
import * as THREE from 'three';

// (the lower city is a clear step darker and cooler than the upper, so the eye finds the waterline at once and
// reads the upper city as the brighter one; a built city, exact, never blurred, bent or dimmed to a reflection)
export const LOWER_TONE = 0.32;

// ---------------------------------------------------------------- geometry accumulator
// attributes: position, normal, color (linear albedo), aK (x = surface kind, y = how much it moves), uv
export const KIND = { LIME: 0, TIMBER: 1, STONE: 2, SLATE: 3, CLOTH: 4, LEAF: 5, GLASS: 6, LAMP: 7, ROOM: 8, BOAT: 9, ROCK: 10, PAVE: 11 };

export function makeGeo() {
  const P = [], N = [], C = [], K = [], U = [], I = [];
  let kind = 0, col = [1, 1, 1], mv = 0;
  const g = {
    kind(k) { kind = k; return g; },
    col(c) { col = c; return g; },
    move(m) { mv = m; return g; },
    get count() { return P.length / 3; },
    get triangles() { return I.length / 3; },
    vert(x, y, z, nx, ny, nz, u = 0, v = 0, m = mv, c = col) {
      P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); K.push(kind, m); U.push(u, v);
      return P.length / 3 - 1;
    },
    tri(a, b, c) { I.push(a, b, c); },
    // every vertex from the given one on stands dy higher (a thing built at the plane, set on a terrace)
    lift(from, dy) { for (let i = from * 3 + 1; i < P.length; i += 3) P[i] += dy; return g; },
    // every vertex from the given one on turns about the upright through (cx, cz), its normal with it
    turn(from, cx, cz, ang) {
      const c = Math.cos(ang), s = Math.sin(ang);
      for (let i = from * 3; i < P.length; i += 3) {
        const x = P[i] - cx, z = P[i + 2] - cz, nx = N[i], nz = N[i + 2];
        P[i] = cx + x * c - z * s; P[i + 2] = cz + x * s + z * c; N[i] = nx * c - nz * s; N[i + 2] = nx * s + nz * c;
      }
      return g;
    },
    // a quad from four corners (a, b, c, d going round), flat normal given or worked out
    quad(a, b, c, d, n, uv) {
      if (!n) {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz) || 1;
        n = [nx / l, ny / l, nz / l];
      }
      const q = uv || [0, 0, 1, 0, 1, 1, 0, 1];
      const i0 = g.vert(a[0], a[1], a[2], n[0], n[1], n[2], q[0], q[1]);
      const i1 = g.vert(b[0], b[1], b[2], n[0], n[1], n[2], q[2], q[3]);
      const i2 = g.vert(c[0], c[1], c[2], n[0], n[1], n[2], q[4], q[5]);
      const i3 = g.vert(d[0], d[1], d[2], n[0], n[1], n[2], q[6], q[7]);
      I.push(i0, i1, i2, i0, i2, i3);
      return g;
    },
    // an axis box from min to max; faces: string of letters to leave out (x X y Y z Z = min/max sides)
    box(x0, y0, z0, x1, y1, z1, skip = '') {
      if (!skip.includes('x')) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
      if (!skip.includes('X')) g.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
      if (!skip.includes('y')) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
      if (!skip.includes('Y')) g.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
      if (!skip.includes('z')) g.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
      if (!skip.includes('Z')) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
      return g;
    },
    // the inside of a box (a room): faces look inward; the Z side (the open front) is left out
    room(x0, y0, z0, x1, y1, z1, noFloor = false) {
      g.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [1, 0, 0], [1, 0, 0, 0, 0, 1, 1, 1]);
      g.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [-1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1]);
      if (!noFloor) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, 1, 0], [0, 1, 1, 1, 1, 0, 0, 0]);
      g.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1]);
      g.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1]);
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      geo.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      return geo;
    },
  };
  return g;
}

export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- the shaders (one family, two programs: plain and instanced)
// HOW THINGS MOVE (world clock and each thing's own dealt phase only; all are sums of sines, so they have no seam):
//  cloth (curtain, blind, pennant): hangs from its rod, moves most at the hem, never more than 0.62 m
//  lamp: a pendulum on its chain, a few degrees; boat: a slight roll and a bob of 2 cm; leaf: the cypress tops stir
//  the breath of air: five patchy bands that cross the bay by the clock (repeating on BREATH_SPAN) and shiver the
//  lower city where they pass (the same law draws the band on the water's sheet)
export const BREATH_SPAN = 980;
export const GLSL_BREATH = /* glsl */`
uniform vec4 uBreath;   // xy = the air's bearing (unit), z = speed m/s, w = half width m
// five bands cross the bay with the air, each at its own speed, each broken along its length into patches; the
// law repeats every ${BREATH_SPAN} m along the bearing, so a band that leaves on one side is the one that comes in
float breathBand(vec2 xz, float t) {
  float s = dot(xz, uBreath.xy), c = dot(xz, vec2(-uBreath.y, uBreath.x)), sum = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float centre = t * uBreath.z * (0.74 + 0.13 * fi) + 137. + 211. * fi;
    float a = (mod(s - centre + ${BREATH_SPAN / 2}., ${BREATH_SPAN}.) - ${BREATH_SPAN / 2}.) / (uBreath.w * (0.75 + 0.14 * fi));
    float pt = 0.5 + 0.5 * sin(c * 0.021 + 2.4 * fi + 1.3 * sin(c * 0.0083 + fi));
    sum += exp(-min(a * a, 30.)) * smoothstep(0.22, 0.55, pt);
  }
  return min(sum, 1.4);
}`;

const CITY_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aK;
#ifdef INST
attribute vec4 iA; attribute vec3 iC;
#endif
uniform float uTime, uSide, uNight, uHand; uniform vec3 uSunDir;
${GLSL_BREATH}
varying vec3 vP, vN, vC, vL, vV; varying vec2 vK, vUv; varying vec4 vA; varying float vSunF;
void main() {
  vec3 p = position, n = normal;
  vSunF = 1.;
  vec4 A = vec4(0.); vec3 tint = vec3(1.);
  #ifdef INST
  A = iA; tint = iC;
  #endif
  float kind = aK.x, w = aK.y, ph = A.x * 6.2832;
  vL = position;
  if (kind > 3.5 && kind < 4.5) {
    // cloth: w = 0 at the rod, 1 at the hem
    float amp = w * w * (0.26 + 0.2 * A.z);
    float s1 = sin(uTime * (0.8 + 0.5 * A.z) + ph + p.y * 0.9), s2 = sin(uTime * 0.37 + ph * 1.7 + p.x * 1.3);
    p.z += amp * (0.62 * s1 + 0.38 * s2);
    p.x += amp * 0.34 * sin(uTime * 0.53 + ph * 2.3 + p.y * 1.1);
    // (round 5, C6) A PENNANT ON A MAST (the instance's second figure is 1; it is laid on its side, the rod at
    // the mast). (Round 5 flew it level with a quick wave running out along it.)
    // (round 5 mending 2, the guard: a level pennant reads as a floating beam, and the lake is windless.) A PENNANT
    // HANGS FROM ITS MAST IN A SOFT SAG AND LIFTS SLOWLY, each on its own clock: it curls down from the mast in an
    // arc, its fly from 100 degrees under the level (hanging) to 46 (lifted), never level; no quick wave runs in it
    #ifdef INST
    // (ROUND 5 MENDING 4, the guard: that arc read as a white crescent, a sickle.) A PENNANT HANGS STRAIGHT DOWN
    // from its yard, a strip of cloth: the whole strip sways from the yard as one straight line, a few degrees
    // on a slow clock of its own (its free end a metre to and fro), and one soft fold and a half travels down it;
    // never an arc
    if (A.y > 0.5) {
      float Ly = length(instanceMatrix[1].xyz), sw = 0.2 * sin(uTime * (0.34 + 0.1 * A.z) + ph) + 0.06 * sin(uTime * 0.83 + ph * 2.1);
      p.z += Ly * w * sw + 0.13 * w * sin(w * 8. - uTime * 0.7 + ph);
      p.x += 0.35 * w * sin(uTime * 0.27 + ph * 1.3);
    }
    #endif
  } else if (kind > 6.5 && kind < 7.5) {
    // lamp on its chain: the pivot is the local origin, the lamp hangs toward -y
    // (ONLY A HUNG LAMP SWINGS (an instance). A lantern's glass built into the merged mesh has no local origin:
    // it swung by its height over the plane, 1.4 m to and fro on the high street, and stood beside its post
    // like a lamp on a cross arm. It keeps to its seat now)
    #ifdef INST
    p.x += -p.y * 0.07 * sin(uTime * 1.25 + ph);
    p.z += -p.y * 0.05 * sin(uTime * 0.93 + ph * 1.3);
    #endif
  } else if (kind > 8.5 && kind < 9.5) {
    // boat: roll about its length (local z) and bob
    float th = 0.04 * sin(uTime * 0.8 + ph);
    p.y += p.x * th + 0.02 * sin(uTime * 0.61 + ph * 1.9);
    p.x -= p.y * th;
  } else if (kind > 4.5 && kind < 5.5) {
    p.x += w * 0.022 * sin(uTime * 0.7 + ph + p.y * 0.21);
    p.z += w * 0.015 * sin(uTime * 0.53 + ph * 1.4);
  }
  vec4 cp = vec4(p, 1.);
  #ifdef INST
  cp = instanceMatrix * cp; n = mat3(instanceMatrix) * n;
  // the open front of a room looks along its own +z: the sun enters by the front only
  // (a column of no length, an instance scaled away, is no bearing: its length is guarded)
  vec3 zc = mat3(instanceMatrix) * vec3(0., 0., 1.);
  vSunF = dot(zc / max(length(zc), 1e-5), uSunDir);
  #endif
  // the breath of air shivers the lower city where its band passes (by place and clock)
  float sh = (0.5 - 0.5 * uSide) * breathBand(cp.xz, uTime);
  cp.x += sh * 0.07 * sin(cp.y * 7. + uTime * 9.); cp.z += sh * 0.07 * sin(cp.y * 6.3 + uTime * 8.1 + 1.7);
  // (round 4, B3) WHERE A PATCH OF LONG RIPPLES PASSES THE DOUBLE BENDS SOFTLY, by day: the lower city sways there
  // by 6 cm at most, slowly, in waves 3.5 m long up its height (the same drifting patches as the sheet's near
  // ripples); between the patches it stands clear and at rest
  // (round 5 mending 1: THE LENS-KEYED BEND OF ROUND 5, C1 IS GONE WHOLE. It followed the lens, which is what a
  // reflection does; the lower city is a built city and no law here moves a built point by the lens. The breath
  // band above and these drifting patches, which go by place and clock, are all that sways it)
  float rbK = (0.5 - 0.5 * uSide) * (1. - uNight) * smoothstep(0.2, 0.8, sin(dot(cp.xz, vec2(0.021, 0.013)) + uTime * 0.25) * sin(dot(cp.xz, vec2(-0.012, 0.019)) - uTime * 0.18));
  cp.x += rbK * 0.06 * sin(cp.y * 1.8 + uTime * 1.6 + cp.z * 0.3); cp.z += rbK * 0.06 * sin(cp.y * 1.6 + uTime * 1.3 + cp.x * 0.3);
  // a room's things (w = 2) keep their own colours; the cover and the carpet (red below zero) take the dealt colour
  vP = cp.xyz; vN = normalize(n); vC = color.r < -0.5 ? tint : (A.w > 1.5 || (kind > 8.5 && kind < 9.5 && w > 0.5) ? color : color * tint); vK = aK; vUv = uv; vA = A;
  // (round 5, A1) the house's wall behind a gallery (a room's face flagged 2 or 3) is painted in metres: the room's
  // own width, height and depth go with it in place of the face's uv (x: width, y: height; flag 3: x is the depth)
  #ifdef INST
  // (round 5 mending 2: on every face of a room, so the back wall can be painted in metres too)
  if (kind > 7.5 && kind < 8.5) vUv = vec2(length(instanceMatrix[w > 2.5 ? 2 : 0].xyz), length(instanceMatrix[1].xyz));
  #endif
  vec4 mv = viewMatrix * modelMatrix * cp;
  vV = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

// the sky's law, shared by the dome, the glass and the water's sheen (d.y is read with its sign taken off by the caller)
export const GLSL_SKY = /* glsl */`
uniform vec3 uSkyTop, uSkyHor, uSunDir, uSunGlow;
vec3 skyLaw(vec3 d) {
  float h = clamp(d.y, 0., 1.);
  vec3 c = mix(uSkyHor, uSkyTop, 1. - pow(max(1. - h, 0.), 3.2));
  float s = max(dot(normalize(d), uSunDir), 0.);
  // a clear morning gradient: a warm band low on the sun's side, a soft glow about the sun (nothing blown out)
  c += uSunGlow * (0.3 * pow(s, 4.) * (1. - 0.7 * h) + 0.32 * pow(s, 40.));
  // (round 3, A3) NOTHING FLAT AND PALE: by the warmth of the hour's glow (red over blue: none by night, next
  // to none at noon) the low sky on the sun's side goes to peach and gold, the low sky across from the sun to a
  // band of rose under the blue (the first hour's sky seen with the sun behind), and both fade out by a quarter
  // of the way up
  float warm = min(1., 1.3 * max(uSunGlow.r - uSunGlow.b, 0.));
  float sa = max(0.5 + 0.5 * dot(normalize(d.xz + 1e-5), normalize(uSunDir.xz + 1e-5)), 0.);
  // (square to the sun the low sky was a flat pallor: both bands reach round to meet there)
  // (round 5, B1: bolder: the peach and gold stand higher (a third of the way up) and fuller on the sun's side;
  // the water's sheen takes the same law, so the lake carries that gold toward the sun)
  c = mix(c, vec3(1.06, 0.72, 0.4), warm * 0.86 * pow(max(1. - h, 0.), 4.2) * pow(sa, 1.2));
  c = mix(c, vec3(0.86, 0.6, 0.62), warm * 0.46 * pow(max(1. - h, 0.), 5.) * (1. - sa) * smoothstep(0., 0.06, h));
  return c;
}`;
const GLSL_NOISE = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }`;

const CITY_FRAG = /* glsl */`
uniform float uTime, uSide, uHand, uLampGain, uJoin, uNight, uLake;
uniform vec3 uSunCol, uAmbSky, uAmbGround, uTone;
uniform vec4 uHaze, uShadeRect;
uniform sampler2D uShade;
uniform sampler2D uOcc; uniform vec4 uOccRect;
${GLSL_SKY}
${GLSL_NOISE}
varying vec3 vP, vN, vC, vL, vV; varying vec2 vK, vUv; varying vec4 vA; varying float vSunF;
void main() {
  vec3 N = normalize(vN), alb = vC, emis = vec3(0.);
  float vDist = length(vV);
  float kind = vK.x, indoor = clamp(vA.w, 0., 1.), ao = 1., two = 0.;
  // a face's own two axes in the city's space (along the wall, up it; or the plan on a floor)
  vec2 tang = abs(N.y) > 0.6 ? vP.xz : vec2(dot(vP.xz, normalize(vec2(-N.z, N.x) + 1e-5)), vP.y);
  float fw = clamp(1. - vDist / 90., 0., 1.);
  float gq = fwidth(tang.x / 0.17);
  float n1 = vn(tang * vec2(0.9, 0.11) + 3.1), n2 = vn(tang * 2.3);
  float sunCut = 1., vineK = 0., outW = 0., wdK = 0., wdF = 0.;
  vec3 wdC = vec3(0.);
  if (kind > 13.5) {
    // A BASTION'S WALL (kind WALL; vUv.x = metres along it, vUv.y = 0 at its foot and 1 at its head, vK.y = its
    // height there): to each bay of 6.4 m a pilaster and between them a tall blind arch, recessed, hung 2.6 m under
    // the head; a string course and a coping. The relief is drawn by its own light: the recess is a tone deeper,
    // and where the sun rakes along the wall the arch's sunward jamb and head and each pilaster throw their shadow.
    // (vUv.y = metres over the wall's foot. Where the head slopes, as on the rising street and the lanes' flights,
    // each bay's arch is hung level from the height at the bay's own middle: the arches step up with the slope)
    float Hl = vK.y, h = vUv.y, bx = (fract(vUv.x / 6.4) - 0.5) * 6.4, aR = 2.0;
    float du2 = dFdx(vUv.x) * dFdx(vUv.x) + dFdy(vUv.x) * dFdy(vUv.x);
    float Hc = Hl - bx * (dFdx(Hl) * dFdx(vUv.x) + dFdy(Hl) * dFdy(vUv.x)) / max(du2, 1e-8), hsp = Hc - 2.6 - aR;
    vec2 T = normalize(vec2(-N.z, N.x) + 1e-5);
    float sg = sign(dFdx(vUv.x) * dFdx(tang.x) + dFdy(vUv.x) * dFdy(tang.x));
    float rake = dot(T, uSunDir.xz) * sg, rk = clamp(abs(rake) * 1.6, 0., 1.), sw = sign(rake) * rk;
    float ad = h < hsp ? abs(bx) : length(vec2(bx, h - hsp));
    // (under the lanes' lower flights the wall stood blank beside the line where it comes to the quay: a bay whose
    // head is 5.2 m and more carries its blind arch (it was 7 m), a low one under a low head)
    float inA = step(5.2, Hc) * (1. - smoothstep(aR - 0.07, aR + 0.07, ad)) * step(0.25, h);
    vec2 q = vec2(bx + sw * 0.9, h + 0.32);
    float adq = q.y < hsp ? abs(q.x) : length(vec2(q.x, q.y - hsp));
    float below = 1. - step(Hl - 1.5, h), pil = smoothstep(2.55, 2.65, abs(bx)) * below;
    float shA = inA * step(aR, adq), shP = (1. - pil) * below * step(2.6, abs(bx + sw * 0.7));
    // (mending 5, step 3a: under a lane's flight the string course and its shade ran as a ruled
    // dark bar down the wall beside the lens.) Where the head climbs steeper than one in three (the flights; the
    // rising street is one in five and keeps it) no string course is drawn: the stepped parapet is the stair's line
    float lvl = 1. - smoothstep(0.3, 0.45, abs(dFdx(Hl) * dFdx(vUv.x) + dFdy(Hl) * dFdy(vUv.x)) / max(du2, 1e-8));
    float band = lvl * step(Hl - 1.5, h) * step(h, Hl - 1.1), under = lvl * step(Hl - 1.78, h) * below, cope = step(Hl - 0.28, h);
    // (the recess a quarter darker and the pier a tenth lighter, to read from across the lake)
    // (ROUND 5 MENDING 5, step 1a: in shade the relief was too faint to read, the wall one plane.) THE RECESS IS
    // SHADOWED: a third darker, and darker yet in the half metre under the arch's head and by its jambs (the
    // shade a recess keeps without the sun); the pier a seventh lighter
    alb *= (1. - 0.34 * inA - 0.16 * inA * smoothstep(aR - 0.55, aR, ad)) * (1. + 0.14 * pil) * (1. + 0.1 * band + 0.14 * cope) * (1. - 0.24 * under);
    sunCut = 1. - 0.78 * max(max(shA, shP), under);
    // (round 5, A4) NO LARGE BLANK WALL: GREEN HANGS AND CLIMBS on a bastion's wall. In about a third of its bays
    // a curtain of leaves hangs from the coping, 1.5 to 8 m long at the bay's middle with a ragged hem; in about
    // a third green climbs from the foot beside the arch; the rest are bare stone (by the bay's own figure)
    // (the lead's eye: the green stood as large angular patches, a triangle beside the islet, zigzags like cut
    // paper over the opening. It is A TRAILING FRINGE UNDER THE COPING and nothing else: in one bay in four, never
    // wider than its bay (it dies away toward the pilasters), hanging a fifth of the wall's height at most (0.6
    // to 3.6 m), its lower edge soft and broken by a small leaf noise; none climbs from the foot)
    float hv = h21(vec2(floor(vUv.x / 6.4), 3.7)), bxr = abs(bx) / 3.2;
    float depV = min(0.2 * Hl, 0.6 + 2.2 * vn(vec2(vUv.x * 0.8, 2.)) + 0.9 * vn(vec2(vUv.x * 2.9, 5.))) * (0.55 + 0.45 * vn(vUv * 1.3));
    float hang = step(hv, 0.25) * (1. - smoothstep(0.45, 0.95, bxr)) * (1. - smoothstep(-0.45, 0.45, (Hl - h) - depV * (1. - bxr * bxr)));
    vineK = hang * step(6., Hl) * smoothstep(0.1, 0.3, Hl - h);
    sunCut = mix(sunCut, 1., vineK);
    // (ROUND 5 MENDING 5, step 1a) HERE AND THERE A DOORWAY OR A SHUTTERED WINDOW in a blind arch's recess, on the
    // walls that stand on a terrace (their foot over the plane): in one bay in five a plank door 1.5 by 2.4 m, in
    // one in four a shuttered window 1.2 by 1.6 m higher up, each in a surround of paler stone (laid over the stone)
    float hd = h21(vec2(floor(vUv.x / 6.4), 8.3)), onT = step(7., Hc) * step(0.5, vP.y - h), hw = clamp(hsp * 0.55, 3.4, 7.);
    float dK = step(hd, 0.2), wK = step(0.55, hd) * step(hd, 0.8);
    float dIn = step(abs(bx), 0.75) * step(0.25, h) * step(h, 2.65), dFr = step(abs(bx), 0.93) * step(0.25, h) * step(h, 2.83);
    float wIn = step(abs(bx), 0.6) * step(hw, h) * step(h, hw + 1.6), wFr = step(abs(bx), 0.76) * step(hw - 0.2, h) * step(h, hw + 1.76);
    wdK = onT * (dK * dIn + wK * wIn); wdF = onT * (dK * dFr + wK * wFr) * (1. - wdK);
    wdC = dK > 0.5 ? vec3(0.2, 0.13, 0.08) * (0.78 + 0.22 * step(0.12, fract(bx / 0.25 + 0.5)))
      : (hd < 0.68 ? vec3(0.17, 0.27, 0.2) : vec3(0.19, 0.27, 0.37)) * (1. - 0.2 * step(fract(h * 4.5), 0.12) * fw) * (1. - 0.5 * step(abs(bx), 0.03));
  }
  if (kind > 12.5 && kind < 13.5) {
    // a far arcade: the round arch of each bay is cut out of the stone panel; a paler ring of voussoirs round it
    float ax = (fract(vUv.x) - 0.5) * vK.y, aR = min(vK.y * 0.5 - 0.42, 1.7), asp = 2.5 - aR;
    float ad = vUv.y < asp ? abs(ax) : length(vec2(ax, vUv.y - asp));
    if (ad < aR) discard;
    alb *= 1. + 0.14 * (1. - smoothstep(0.2, 0.26, ad - aR));
  }
  if (kind > 11.5 && kind < 12.5) {
    // the rail: turned balusters cut out of the panel, a solid top and foot; the gaps close with the pixel's footprint
    // (round 3, C6: the built balustrades (the streets', the terraces', the causeway's: the merged mesh) have
    // STONE BALUSTERS, stout and turned, 0.27 m apart; the galleries' own rails (instanced) are as they were)
    #ifdef INST
    float bx = abs(fract(tang.x / 0.17) - 0.5), v = clamp(vUv.y, 0., 1.);
    float hw = 0.13 + 0.11 * sin(v * 11.) * sin(v * 3.14159);
    #else
    float bx = abs(fract(tang.x / 0.27) - 0.5), v = clamp(vUv.y, 0., 1.);
    float hw = 0.2 + 0.15 * sin(v * 6.5 + 0.4) * sin(v * 3.14159);
    #endif
    hw = mix(hw, 0.5, smoothstep(0.3, 0.9, gq));
    // (round 5, B0, the lead's eye: behind a gallery's rail the dark shutters read as red or green speckle: the
    // lace of balusters one or two pixels apart over a dark leaf. A GALLERY'S RAIL CLOSES TO A PLAIN PANEL as soon
    // as its balusters are under three pixels apart; the built stone balustrades are as they were)
    // (the speckle was the wall's own, see the room's branch; closed from five pixels a baluster
    // the rails stood as heavy boards along the quay: they close between five and two and a half pixels a baluster)
    #ifdef INST
    hw = mix(hw, 0.5, smoothstep(0.2, 0.4, gq));
    #endif
    indoor = 0.;
    if (vA.w < 0.5) {
      if (v > 0.06 && v < 0.9 && bx > hw) discard;
      alb *= 0.8 + 0.3 * vn(vec2(tang.x * 0.7, tang.y * 13.)) * fw;
    } else {
      // a limewashed parapet: a coping, a stain under it, three small drain slots
      alb *= (0.86 + 0.18 * n1) * (1. - 0.25 * smoothstep(0.86, 0.9, v) * (1. - smoothstep(0.9, 0.94, v)));
    }
  } else if (kind < 0.5) {
    // limewash: long stains running down, a mottle, a darker foot
    alb *= 0.84 + 0.2 * n1 - 0.1 * n2 * fw;
  } else if (kind < 1.5 || (kind > 8.5 && kind < 9.5)) {
    alb *= 0.8 + 0.3 * vn(vec2(tang.x * 0.7, tang.y * 13.)) * fw + 0.1 * n2;
    // (mending 5, step 3c) THE JETTY'S DECK (the quad's second figure 7; vUv = metres along, across): planks
    // 0.26 m wide laid across, each of its own weathered tone with a dark seam between (both die away where a
    // plank is under a pixel wide), and along each side an edge beam 0.2 m wide, a tone deeper, with its own seam
    if (kind < 1.5 && vK.y > 6.5 && vK.y < 7.5) {
      float px = vUv.x / 0.26, pf = clamp(1.6 - fwidth(px) * 1.6, 0., 1.), eb = step(1.4, abs(vUv.y));
      float seam = step(fract(px), 0.1) * pf, tone = 0.84 + 0.32 * (h21(vec2(floor(px), 3.)) - 0.5) * pf;
      alb = vC * mix(tone * (1. - 0.5 * seam) * (0.92 + 0.16 * vn(vec2(vUv.x * 7., vUv.y * 0.9))), 0.62 + 0.1 * vn(vec2(vUv.x * 0.6, 7.)), eb);
      alb *= 1. - 0.45 * step(1.34, abs(vUv.y)) * (1. - eb);
    }
  } else if (kind < 2.5 || kind > 10.5) {
    // stone and paving: joints, staggered courses
    // (round 3, C1) PAVING IS OF SMALLER COURSED STONES (0.5 by 0.27 m), closer in tone to one another
    float pav = step(10.5, kind) * step(kind, 11.5) * step(0.6, abs(N.y));
    vec2 b = tang / mix(vec2(0.9, 0.42), vec2(0.5, 0.27), pav); b.x += 0.5 * floor(b.y);
    vec2 f = abs(fract(b) - 0.5);
    float joint = smoothstep(0.46, 0.5, max(f.x, f.y)) * fw;
    alb *= (0.86 + (0.22 - 0.1 * pav) * h21(floor(b)) * fw) * (1. - 0.4 * joint) * (0.9 + 0.2 * n1);
    // ON THE QUAY (6 m from the water's edge at 270 m, 1.2 m over the plane, and so again in the double): a pale
    // kerb of long stones at the edge, a damp darker margin behind it, a drain line 1.9 m in, and a worn paler
    // band where feet have gone, 3 to 4.6 m in
    float qd = length(vP.xz) - 270., onQ = pav * step(1.12, abs(vP.y)) * step(abs(vP.y), 19.3) * step(0., qd) * step(qd, 6.2);
    // (the rising street and the street on to the bridge have the same kerb, drain and worn band)
    float kerb = onQ * (1. - smoothstep(0.34, 0.38, qd));
    alb = mix(alb, alb * 1.16 / max(0.6, 1. - 0.4 * joint), kerb);
    alb *= 1. - onQ * (1. - kerb) * (0.2 * (1. - smoothstep(0.38, 1.5 + 0.5 * n1, qd)) + 0.34 * (1. - smoothstep(0.03, 0.06, abs(qd - 1.9))));
    alb *= 1. + 0.1 * onQ * smoothstep(2.8, 3.3, qd) * (1. - smoothstep(4.3, 4.9, qd)) * (0.5 + 0.5 * n1);
    if (kind < 2.5 || kind > 13.5) { vec2 b2 = tang / vec2(2.7, 1.26); b2.x += 0.5 * floor(b2.y); alb *= 0.9 + 0.18 * h21(floor(b2) + 7.); }
    // a weathered darker foot where a wall stands in the water (by its height over the plane; a green cast)
    if (abs(N.y) < 0.6 && kind > 1.5) alb *= mix(vec3(0.5, 0.57, 0.47), vec3(1.), smoothstep(0.15, 1.3 + 0.7 * n1, abs(vP.y)));
  } else if (kind < 3.5) {
    // (ROUND 5 MENDING 5, L6) A ROOF READS AS A ROOF FROM ABOVE, on every house: fine courses of slate (a third of
    // a metre, faint), and on a hipped roof's slopes (second figure 1) a shaded eave course and a cap along the
    // ridge and down each hip, paler than a dark roof and darker than a pale one
    float hipK = step(0.5, vK.y), row = fract(vUv.y * mix(9., 20., hipK));
    alb *= 0.8 + mix(0.25, 0.14, hipK) * row * fw + 0.12 * n2;
    float capR = max(smoothstep(0.555, 0.585, vUv.y), 1. - smoothstep(0.012, 0.035, min(vUv.x, 1. - vUv.x)));
    alb *= mix(1., mix(1.9, 0.58, smoothstep(0.13, 0.19, dot(vC, vec3(0.3, 0.5, 0.2)))), hipK * capR);
    alb *= 1. - hipK * 0.25 * (1. - smoothstep(0.015, 0.045, vUv.y)) * (1. - capR);
  } else if (kind < 4.5) {
    // cloth: plain fields in worn tones; some carry one pale band at the hem (no stripes anywhere)
    // (the guard: a striped awning, a red-and-white striped cloth beside the quay. The weave's ribs
    // stood as six pale stripes across every cloth, and the pale hem on a red cloth read red and white.) THE
    // CLOTH IS PLAIN: the ribs are a thirtieth, the hem band a faint one and none on a red cloth
    float st = step(0.84, vUv.y) * step(vUv.y, 0.95) * step(0.5, vA.w) * step(alb.r, 1.5 * alb.g);
    alb = mix(alb, vec3(0.86, 0.83, 0.72), st * 0.3);
    alb *= 0.97 + 0.03 * sin(vUv.x * 40.);
    alb *= 1. + (0.1 + 0.14 * vK.y) * sin(vUv.x * 6.5 + vUv.y * 2.2 + uTime * (1.7 + 0.5 * vA.z) + vA.x * 6.2832);
    two = 1.; indoor = 0.;
  } else if (kind < 5.5) {
    // leaves: dark green, never black (in shade the foliage takes half as much again of the sky's fill)
    // (round 3, C4: a crown has A LIT AND A SHADED SIDE: three tenths of the two-sided law, not all of it)
    alb *= 0.8 + 0.5 * vn(vP.xy * 3.1 + vP.z * 2.7); two = 0.3; ao = 1.5;
    // (stage F: the leaves stir: a dapple of light and dark travels through every crown, hedge and creeper)
    alb *= 1. + 0.22 * sin(uTime * 2.4 + 9. * vn(vP.xz * 0.9 + vP.y * 0.7) + vP.y * 2.1);
  } else if (kind < 6.5) {
    // the looking glass and the panes: the sky turned back, and a glint
    vec3 cam = vec3(cameraPosition.x * uHand, cameraPosition.y * uSide, cameraPosition.z);
    vec3 R = reflect(normalize(vP - cam), N); R.y = abs(R.y);
    alb = vec3(0.02); emis = skyLaw(R) * 0.8 + uSunGlow * 3. * pow(max(dot(R, uSunDir), 0.), 90.);
  } else if (kind < 7.5) {
    // (round 4, D1) NO HARD WHITE SPECKS ON THE QUAY: by day a burning lamp is amber, not a blown white square
    // (its light is held under the amber before the flicker is laid on it); by night it is as it was
    vec3 lampC = vC * vK.y * vA.y * uLampGain;
    lampC = mix(lampC, min(lampC, vec3(1.3, 0.82, 0.36)), 1. - uNight);
    emis = lampC * (0.88 + 0.12 * sin(uTime * 7.3 + vA.x * 40.) * sin(uTime * 3.1 + vA.x * 17.));
    #ifndef INST
    // a join's lantern, the bright line on a water stair, a chain's ring of light: they burn always (no instance)
    // (round 4, D1: by day at six tenths: warm, not white)
    emis = vC * vK.y * (0.82 + 0.08 * sin(uTime * 2.1 + vP.x * 0.7 + vP.z * 0.9)) * (1. - 0.4 * (1. - uNight));
    // (ROUND 5 MENDING 6, M3c: ONE LAW FOR EVERY RING OF LIGHT ON THE WATER BY NIGHT. A chain's ring (second figure
    // 2) lies half under the quay's face, so by night it stood on the dark water as a white crescent: by night it
    // is a fifth as bright, a ripple on dark water; by day it is as it was)
    emis *= 1. - 0.8 * uNight * step(1.5, vK.y);
    #endif
    alb *= 0.5;
  } else if (kind < 8.5) {
    // the room: boards on the floor, a pale ceiling, the back in deeper shade
    if (N.y > 0.6) { alb = vec3(0.55, 0.39, 0.2) * (0.8 + 0.3 * step(0.08, fract(vL.x * 9.)) * fw + 0.15 * n2); }
    else if (N.y < -0.6) { alb = vec3(0.82, 0.78, 0.68); }
    else { alb = mix(alb, vec3(0.62, 0.5, 0.4), 0.22 * step(0.03, vA.w) * step(vA.w, 0.47)) * (0.9 + 0.12 * n1); }
    ao = 0.5 + 0.5 * smoothstep(-0.5, 0.5, vL.z);
    indoor = 1.;
    // (round 5, A1) THE HOUSE'S WALL BEHIND THE GALLERY (the face flagged 2; vUv = the room's width and height in
    // metres): limewash in the house's tone; in every bay of about 4 m A WIDE DOORWAY with its two leaves folded
    // back on the wall, and beside it A WINDOW with a sill, its shutters open or closed (by the room's own
    // figures); a lintel over each, a threshold of stone. The openings are cut out: the room is seen through them
    // (from the west terrace the harbour's houses, seen from behind and from the side, were open
    // racks: no shell stands behind them, and a room's box seen FROM OUTSIDE showed its dark inside faces.) THE
    // BACK AND THE SIDE OF A HOUSE ARE WALL: a room's upright face seen from outside is the house's own wash, out
    // of doors, with a closed shutter of the house's tone to each half bay
    #ifdef INST
    if (!gl_FrontFacing && vK.y < 1.5 && abs(N.y) < 0.6 && vA.w > 0.03 && vA.w < 0.47) {
      float hkO = fract(vA.w * 23.7 + 0.13), xO = abs(fract((vL.x + vL.z) * 2.) - 0.5), yO = (vL.y + 0.5) * 2.7;
      vec3 shO = hkO < 0.35 ? vec3(0.17, 0.27, 0.2) : hkO < 0.65 ? vec3(0.19, 0.27, 0.37) : vec3(0.27, 0.17, 0.1);
      alb = mix(min(vC, vec3(0.9)) * (0.94 + 0.1 * n1), shO, step(xO, 0.2) * step(0.95, yO) * step(yO, 2.1));
      outW = 1.; N = -N; ao = 0.95; indoor = 0.; // (no lamp's wash on it: it stands out of doors, by day and night)
    }
    #endif
    // (round 5 mending 2, the guard) ONE THING OF THE ROOM STANDS PLAIN AGAINST ITS BACK WALL in each half bay, by
    // the room's own figures: a table under its cloth with a jug, a bed's foot and head, a wardrobe with its glass
    // catching the light, or two shelves of jars. Painted on the back wall in metres, flat, as such things stand
    #ifdef INST
    if (gl_FrontFacing && vK.y < 0.5 && vL.z < -0.495 && abs(vL.y) < 0.499 && vA.w > 0.03 && vA.w < 0.47) {
      float nB = max(1., floor(vUv.x / 4.6 + 0.5)), bm = vUv.x / nB, uB = (vL.x + 0.5) * nB, yB = (vL.y + 0.5) * vUv.y;
      // (ROUND 5 MENDING 4, the guard: the four small things were not made out from the quay.) ONE THING TO A BAY,
      // LARGE, OF STRONG CONTRAST, BEHIND THE BAY'S OWN DOORWAY (the wall's figure for the bay is this one): a dark
      // table 2 m long with a white runner and a jug, a white bed under a dark head board, or a dark wardrobe
      // 2.1 m high with its glass catching the light
      float rB = h21(vec2(floor(uB) * 3. + floor(vA.x * 91. + 0.25), floor(vA.z * 57. + 0.25)));
      float xs = (fract(uB) - 0.5) * bm - (rB < 0.5 ? -1. : 1.) * bm * 0.19 * step(2.7, bm), xt = abs(xs), kd = floor(fract(rB * 13.) * 3.);
      vec3 tim = vec3(0.15, 0.095, 0.055), th = alb;
      if (kd < 0.5) {
        th = mix(th, tim, step(xt, 1.) * step(yB, 0.95));
        th = mix(th, vec3(0.92, 0.89, 0.8), step(xt, 0.32) * step(0.45, yB) * step(yB, 0.98));
        th = mix(th, vec3(0.62, 0.4, 0.2), step(abs(xs - 0.6), 0.12) * step(0.95, yB) * step(yB, 1.32));
      } else if (kd < 1.5) {
        th = mix(th, tim, step(xt, 1.05) * step(yB, 1.55));
        th = mix(th, vec3(0.95, 0.94, 0.9), step(xt, 0.95) * step(0.3, yB) * step(yB, 1.08));
      } else {
        th = mix(th, tim, step(xt, 0.8) * step(yB, 2.1));
        th = mix(th, vec3(1.25, 1.32, 1.3), step(xt, 0.25) * step(0.45, yB) * step(yB, 1.85));
      }
      alb = th;
    }
    #endif
    // (an enfilade, the fourth figure 0.48, has its own first partition and door for a wall: none is drawn here)
    if (vK.y > 1.5 && vA.w > 0.47) discard;
    // (the fronts read as racks of cells: each bay's side walls ran out to the rail. THE
    // GALLERY RUNS UNBROKEN ALONG THE HOUSE: before the wall a room's box has no side faces (posts alone part the
    // bays); the rooms are laid the bay's whole width, so floor and ceiling run through)
    #ifdef INST
    if (vK.y < 1.5 && vA.w > -0.5 && vA.w < 0.47 && abs(vL.x) > 0.4995 && vL.z > 0.125) discard;
    #endif
    if (vK.y > 1.5 && vK.y < 2.5) {
      float W = vUv.x, nbW = max(1., floor(W / 4.6 + 0.5)), bwm = W / nbW, uW = (vL.x + 0.5) * nbW, cellW = floor(uW);
      float bxW = (fract(uW) - 0.5) * bwm, yW = (vL.y + 0.5) * vUv.y;
      // (round 5, B0: THE SPECKLE'S CAUSE: the bay's figure was hashed from the room's own figures
      // as they reach the fragment, and the last bit of their interpolation changed the hash from pixel to pixel:
      // two paintings of the same wall in a dither, red or green dots on white. The figures are taken whole
      // (to the nearest of 91 and 57 steps) before the hash: one painting to a bay, solid leaves)
      // (a quarter step is added, not a half: a stone storey's walk has the figures 0.5 and 0.5, on the half step)
      float r1 = h21(vec2(cellW * 3. + floor(vA.x * 91. + 0.25), floor(vA.z * 57. + 0.25))), r2 = fract(r1 * 7.31), sd = r1 < 0.5 ? -1. : 1.;
      // (the harbour's houses, bays of 3 m, read as open racks: a doorway of
      // 1.5 m with its leaves took the whole bay. IN A NARROW BAY (under 3.6 m) the doorway is 1 m wide, its
      // leaves 0.3 m, and a small window stands beside it from 2.7 m: wall to both sides of every opening)
      float nar = step(bwm, 3.6), hasW = step(2.7, bwm), dw = mix(0.68 + 0.1 * r2, 0.5, nar), ww = mix(0.42, 0.3, nar), lf = mix(0.46, 0.3, nar);
      float dX = abs(bxW - sd * bwm * 0.19 * hasW), wX = abs(bxW + sd * bwm * 0.28) + 9. * (1. - hasW);
      float inD = step(dX, dw) * step(0.06, yW) * step(yW, 2.16), inWy = step(0.92, yW) * step(yW, 2.04);
      float shut = step(0.6, fract(r1 * 13.7));
      // (round 5 mending 1) A CURTAIN IN THE OPEN DOORWAY, in every second doorway (by the room's own figure): it
      // hangs from one jamb across a third to two thirds of the opening, of linen or a worn ochre; its free edge
      // sways slowly with the world's clock, most at its foot, and soft folds travel through it (no thing
      // is laid for it and no stream is drawn)
      float cuS = fract(r1 * 5.9) < 0.5 ? -1. : 1., cuX = (bxW - sd * bwm * 0.19 * hasW) * cuS, cuT = uTime * (1.1 + 0.8 * r2) + r1 * 40.;
      // (round 5 mending 2, the guard: a narrow pale curtain read as an upright shape of a person's height: it
      // covers HALF THE OPENING AND MORE, 52 to 78 hundredths of it, so it reads as cloth)
      float cuE = dw * (0.05 + 0.5 * fract(r1 * 3.1)) + (0.13 * sin(cuT) + 0.05 * sin(cuT * 3.7 + yW * 3.)) * (1.15 - yW / 2.16);
      float curt = inD * step(0.5, fract(r1 * 29.3)) * step(cuX, cuE); // (in every second doorway)
      if (inD * (1. - curt) + step(wX, ww) * inWy * (1. - shut) > 0.5) discard;
      float hk = fract(vA.w * 23.7 + 0.13);
      // (the shutters were too pale to read: a muted green, a blue-grey, a brown, here and there a
      // deep red, each a full tone under the wall)
      // (B0: A SHUTTER IS A SOLID LEAF IN ONE MUTED TONE: grey-green, blue-grey, brown; a deep red on one house in
      // ten; a few thin level lines near the lens (see louv), plain further off)
      vec3 shC = hk < 0.35 ? vec3(0.17, 0.27, 0.2) : hk < 0.65 ? vec3(0.19, 0.27, 0.37) : hk < 0.9 ? vec3(0.27, 0.17, 0.1) : vec3(0.25, 0.085, 0.07); // (the red is deeper and duller)
      shC = mix(shC, vec3(0.2, 0.13, 0.08), step(vA.w, 0.02));
      // (at 1.32 times the room's tone every far wall burnt to one white: the wall keeps its
      // house's own wash, bone, cream, ochre, rose or grey-green (A3); a far room's tone is already the lighter)
      alb = min(vC, vec3(0.9)) * (0.94 + 0.1 * n1) * (1. - 0.12 * step(yW, 0.5));
      // (far off the louvres broke into a stipple: they are whole within 8 m of the eye and gone by 18 m)
      float louv = 1. - 0.22 * step(fract(yW * 4.5), 0.09) * (1. - smoothstep(8., 18., vDist));
      float leafD = step(dw, dX) * step(dX, dw + lf) * step(0.06, yW) * step(yW, 2.16);
      float leafW = step(wX, ww + (lf - 0.04) * (1. - shut)) * inWy;
      alb = mix(alb, shC * louv, max(leafD, leafW));
      float lint = step(dX, dw + lf + 0.05) * step(2.16, yW) * step(yW, 2.32) + step(wX, ww + lf + 0.05) * (step(2.04, yW) * step(yW, 2.15) + step(0.82, yW) * step(yW, 0.92));
      alb = mix(alb, vec3(0.8, 0.76, 0.68), min(lint + step(dX, dw + 0.12) * step(yW, 0.06), 1.));
      alb = mix(alb, mix(vec3(0.8, 0.77, 0.68), vec3(0.62, 0.5, 0.3), step(0.7, fract(r1 * 17.3))) * (0.74 + 0.26 * sin(cuX * 15. + cuT * 3.1 + yW * 2.)), curt);
      ao = 0.86;
    } else if (vK.y > 2.5) { alb = min(vC, vec3(0.9)) * (0.94 + 0.1 * n1); ao = 0.9; }
    // a window's pane (the instance's fourth figure is -1): a lamp behind it shows through
    if (vA.w < -0.5) { indoor = 0.; emis = vec3(1., 0.68, 0.34) * vA.y * uLampGain * (0.35 + 0.3 * n2) * (0.9 + 0.1 * sin(uTime * 2.3 + vA.x * 40.)); }
  } else {
    // rock: beds and a mottle
    alb *= 0.7 + 0.35 * vn(vec2(tang.x * 0.15, tang.y * 0.9)) + 0.15 * n2 * fw;
  }
  // (round 5, A4: the green on a bastion's wall took the stone's courses and read as green
  // blocks: it is laid over the finished stone, a leaf mottle of its own, small and soft)
  // (B0: two leaf tones, a deep green and a paler olive, in soft patches; the fringe is three quarters opaque)
  // the wall's doorway or shuttered window and its surround of paler stone, over the finished stone
  if (wdK + wdF > 0.) { alb = mix(alb, min(vC * 1.2, vec3(0.86)), wdF); alb = mix(alb, wdC, wdK); }
  if (vineK > 0.) alb = mix(alb, mix(vec3(0.15, 0.28, 0.1), vec3(0.3, 0.36, 0.14), smoothstep(0.35, 0.65, vn(vUv * 0.9 + 3.))) * (0.7 + 0.35 * vn(vUv * 3.3) + 0.3 * vn(vUv * 9.1) * fw), 0.78 * vineK);
  vec2 suv = (vP.xz - uShadeRect.xy) * uShadeRect.zw;
  float hs = texture2D(uShade, suv).r;
  float inSun = smoothstep(hs - 0.4, hs + 1.1, vP.y);
  // (beyond the shade map's rectangle nothing of the city shades: the far shore stands in the sun)
  inSun = mix(inSun, 1., step(0.5, max(abs(suv.x - 0.5), abs(suv.y - 0.5))));
  // (round 4, A1) SHADOWS THAT ARE SEEN, at no triangle's and no call's cost but the shapes named below.
  // (a) A THING'S OWN SHADOW: a paving quad laid by the builders along the sun's bearing with the weight -1
  // is the same paving standing in that thing's cast shade (posts, lamp posts, the quay's things, the trees)
  float pavK = step(10.5, kind) * step(kind, 11.5) * step(0.6, N.y);
  inSun *= 1. - pavK * step(vK.y, -0.5);
  // (b) THE BALUSTRADE'S STRIPED SHADOW on the promenade's paving (the rising street and the street on to the
  // harbour, 270 to 276.4 m from the centre, above the quay's deck): the line from the paving toward the sun is
  // followed to the rail's circle; under the coping's height it is shaded by the plinth, by the coping, or by a
  // baluster (the rail's own pitch and turned width); far off the stripes run together into their mean
  float rP = length(vP.xz), shL = length(uSunDir.xz);
  // (round 4, A-ii) (c) A HOUSE BLOCK'S LONG SLANTED SHADOW on the bastion face, the terrace and the side wall
  // beside it, from the map of the houses' tops: a place dr behind its tier's front line is reached by the
  // sun's light only across the tier's own houses on the sun's side, as far along the tier as dr times the
  // light's slant; it is shaded where a house stands there higher than that line (which climbs by the sun's height).
  // A front stands on the line itself (dr = 0) and is never shaded by its neighbours
  float kT = floor((rP - uOccRect.z - 0.5) / uOccRect.w);
  if (indoor < 0.5 && kT >= 0. && kT < uOccRect.y && shL > 0.01 && uNight < 0.5) {
    vec2 sH = uSunDir.xz / shL, rad = -vP.xz / rP; float cr = dot(sH, rad), ct = dot(sH, vec2(-rad.y, rad.x));
    float drT = rP - (uOccRect.z + kT * uOccRect.w), aT = atan(vP.x, -vP.z);
    if (cr > 0.08 && abs(ct) > 0.05) {
      float tMax = min(drT * abs(ct) / cr, 40.), blk = 0.;
      for (int i = 0; i < 7; i++) {
        float sT = 0.8 + (tMax - 0.8) * (float(i) + 0.5) / 7.;
        float topT = texture2D(uOcc, vec2((aT - sign(ct) * sT / rP) / (2. * uOccRect.x) + 0.5, (kT + 0.5) / uOccRect.y)).r;
        blk = max(blk, step(0.8, tMax) * smoothstep(0., 0.5, topT - vP.y - uSunDir.y / shL * sT / abs(ct)));
      }
      inSun *= 1. - blk;
    }
  }
  if (pavK > 0.5 && vP.y > 1.32 && vP.y < 19.4 && rP > 270.1 && rP < 276.4 && shL > 0.01) {
    vec2 sh = uSunDir.xz / shL; float pd = dot(vP.xz, sh), disc = pd * pd - (rP * rP - 270.06 * 270.06);
    if (pd < 0. && disc > 0.) {
      float tS = -pd - sqrt(disc), hg = tS * uSunDir.y / shL; vec2 qS = vP.xz + sh * tS;
      float bxS = abs(fract(atan(qS.x, -qS.y) * 270.06 / 0.27) - 0.5), vS = clamp(hg / 1.02, 0., 1.);
      float bal = 1. - smoothstep(-0.03, 0.03, bxS - (0.2 + 0.15 * sin(vS * 6.5 + 0.4) * sin(vS * 3.14159)));
      // (round 5, C7: the stripes read as a striped ramp up the street: they are plain to 9 m from the lens and an
      // even band of shade from 24 m)
      // (the guard's third asking: on the rising street the rail's and the plinth's arcs and
      // the stripes between read as a fan-pattern pavement. The balusters' own shadows are plain only within 4 m of
      // the lens; from 6.5 m the whole is ONE even half shade with a soft far edge and no arcs in it)
      float farS = smoothstep(4., 6.5, vDist), solid = mix(min(step(hg, 0.07) + step(0.9, hg), 1.), 0.5, farS);
      bal = mix(bal, 0.5, farS);
      inSun *= 1. - (1. - smoothstep(1.06 - 0.5 * farS, 1.08 + 0.15 * farS, hg)) * max(bal, solid);
    }
  }
  float ndl = dot(N, uSunDir); ndl = mix(max(ndl, 0.), 0.35 + 0.65 * abs(ndl), two);
  // inside a room the sun reaches only a little way in from the open front
  float isRoom = step(7.5, kind) * step(kind, 8.5);
  // THE LOW SUN IN A ROOM: where the open front faces the sun (vSunF = the cosine between them) the light goes in
  // under the floor above and lies on the floor, the side walls and the back wall up to the height that floor's
  // edge lets it reach (rooms 5 m deep and 2.7 m high: the line falls by depth x sin(sun's height) / vSunF)
  float sunLine = 0.5 - (0.5 - vL.z) * 1.85 * uSunDir.y / max(vSunF, 0.03);
  float reach = mix(1., smoothstep(-0.05, 0.05, sunLine - vL.y) * step(0.03, vSunF), isRoom);
  // indoors the sun comes by the open front only, and only when that front faces it; the things of a room stand in
  // it near the front and in shade further in
  float front = mix(1., smoothstep(0.02, 0.3, vSunF) * mix(smoothstep(-0.4, 1.3, vL.z), 1., isRoom), indoor);
  // (round 5, A1) BEHIND THE HOUSE'S WALL the sun comes only by the doorway and the windows: the room's own faces
  // further in than the wall (0.12 of its depth), and the things that stand in it, take two fifths of the sun
  // (a room's things are laid in metres from its middle: the wall stands 0.6 back; before it they are on the gallery)
  float behindW = (isRoom * step(vK.y, 1.5) * step(vL.z, 0.115) + (1. - isRoom) * indoor * step(vL.z, 0.6)) * (1. - outW);
  // (a room's face seen from outside is a wall in the open air: the sun falls on it as on any wall)
  reach = mix(reach, 1., outW); front = mix(front, 1., outW);
  // (the doorways did not read: by day a quarter of the sun and half the sky's fill go in)
  // (and after its second half: an eighth of the sun: on a sunlit front the doorway is the dark thing in the wall)
  vec3 direct = uSunCol * ndl * inSun * reach * front * sunCut * (1. - 0.87 * behindW);
  ao *= 1. - 0.5 * behindW * (1. - uNight);
  // (the doorways stood blue-black: the fill behind the wall is a warm grey by day, see below)
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5) * ao * mix(1., 0.62, indoor);
  amb = mix(amb, vec3(dot(amb, vec3(0.38))) * vec3(1.12, 0.96, 0.8), 0.85 * behindW * (1. - uNight));
  // STONE IN SHADE IS A COOL PALE GREY, never blue and never dark: stone, rock, paving, arcade and wall take the
  // fill's brightness half as much again and nearly without its blue (pale stone throws the light back and forth)
  float stone = step(1.5, kind) * step(kind, 2.5) + step(9.5, kind) * step(kind, 11.5) + step(12.5, kind);
  amb = mix(amb, vec3(dot(amb, vec3(0.34))) * vec3(0.97, 1., 1.06) * 1.5, stone * (1. - indoor));
  // (round 3, A5) WHERE THE WATER STARTS: by day every stone wall, pier, rock and pile that stands in the lake has
  // a DAMP FOOT, two fifths darker over its lowest half metre (and so again in the double), and at the plane
  // itself a fine line of the sky's light, the water's skin seen from across the bay (upright faces only)
  float wetK = (stone + step(0.5, kind) * step(kind, 1.5)) * (1. - indoor) * (1. - uNight) * step(abs(N.y), 0.5);
  // (THE WATERLINE: across the bay a fine bright line with a dark band over it, and under it in the double, marks
  // where the water starts)
  // (ROUND 5 MENDING 5, L7: ONE HEIGHT EVERYWHERE, whatever the eye's distance: the damp band is whole to 0.8 m and
  // out by 1.33, 0.56 darker; the skin's line is 0.2 m high. A line finer than a pixel is not left to flicker:
  // it is weighed by the share of the pixel's own footprint that it fills (fwidth of the height), nothing more)
  float skinH = 0.2, dampH = 0.8, fpy = max(fwidth(vP.y), 0.02);
  // (MENDING 6, M1: A MOORING PILE (timber, second figure 8) IS OF ONE TONE from the plane to its top: it takes
  // no damp band, wherever it stands; the skin's fine line at the plane it keeps, as every foot in the water does)
  float pileK = step(0.5, kind) * step(kind, 1.5) * step(7.5, vK.y);
  alb *= 1. - 0.56 * wetK * (1. - pileK) * (1. - smoothstep(dampH, dampH * 1.67, abs(vP.y)));
  // (L8: PLAIN ALL ROUND THE BAY: its strength is 0.8, the same at every wall's, pier's, pile's and quay's foot)
  emis += uSkyHor * 0.8 * wetK * clamp((min(skinH, vP.y + 0.5 * fpy) - max(0., vP.y - 0.5 * fpy)) / fpy, 0., 1.);
  // THE WATER'S LIGHT PLAYS UNDER EVERY ARCH by day: on stone that faces down (an arch's soffit, the crown most,
  // nothing on its upright springing) a net of bright wavering lines travels by the clock, as under any bridge
  // over lit water; the same in the double; none by night. (ROUND 5 MENDING 5, L5) ONE LAW OF THE STONE'S HEIGHT
  // OVER THE PLANE, the same under the quay's arches, the causeway's, the jetty's and every other: whole to 9 m,
  // fading out by 24 (it had one reach on the shore and a higher one out over the lake)
  float underH = 1. - smoothstep(9., 24., abs(vP.y));
  float under = stone * (1. - indoor) * (1. - uNight) * (1. - smoothstep(-0.45, -0.1, N.y)) * underH;
  if (under > 0.) {
    // (under the causeway's arches that net read as a stretched cobble texture: it is FINE AND
    // FAINT, at the scale of the stones (its meshes a third of a metre, not a metre), two fifths as bright, and
    // it moves half as fast)
    vec2 cq = vP.xz * 3.4 + vP.y * 2.2;
    float c1 = sin(cq.x * 1.9 + 1.4 * sin(cq.y * 1.3 + uTime * 1.05)), c2 = sin(cq.y * 2.3 + 1.2 * sin(cq.x * 1.7 - uTime * 0.85));
    emis += vec3(1., 0.93, 0.78) * 0.12 * under * pow(max(1. - 0.5 * abs(c1 + c2), 0.), 5.) * (1. - smoothstep(25., 60., vDist));
  }
  // (stage F: a face turned from the sun takes a fifth less of the fill, so the shaded arm and the
  // shaded side of every bastion and tower stand deeper against the lit ones; level floors keep it whole)
  // (the bay's two arms read close in tone; pale stone turned from the sun, which lies
  // there in broad bands, takes a sixth less again)
  amb *= mix(0.8 - 0.13 * stone * (1. - indoor), 1., smoothstep(-0.25, 0.25, dot(N, uSunDir)));
  // (pale stone square to the sun burnt out to white; it takes four fifths of the sun, a little
  // less of its blue: cream to honey)
  // (the lead's eye on the causeway: its sunlit stone read a little mustard: HONEY, a touch less
  // yellow: stone takes a little less of the sun's green and a little more of its blue)
  direct *= mix(vec3(1.), vec3(0.83, 0.745, 0.76), stone * (1. - indoor));
  // (round 3, A1) LIMEWASH, TIMBER AND TILE IN SHADE ARE COOL AND NEVER BLUE: they take the fill with two thirds
  // of its blue taken out; and what stands in the cast shade (the dawn line, the hill's shadow) takes a quarter
  // less of the fill, so the shaded tier is a third to a half darker than the lit ones over it and never black
  // (cloth in the shade went navy, the boats black, the slate roofs blue: cloth and boats take the
  // same law, slate takes the fill nearly grey, and a boat's dark hull half as much fill again)
  float plain = step(kind, 1.5) + step(2.5, kind) * step(kind, 4.5) + step(8.5, kind) * step(kind, 9.5);
  float slateK = step(2.5, kind) * step(kind, 3.5), boatK = step(8.5, kind) * step(kind, 9.5);
  amb = mix(amb, vec3(dot(amb, vec3(0.34))) * vec3(0.96, 1., 1.1) * (1.12 + 1.1 * boatK), (0.66 + 0.26 * slateK) * plain * (1. - indoor) * (1. - uNight));
  // (by day only: the night law is kept as it was)
  amb *= mix(0.76, 1., max(inSun, uNight));
  // (round 4, A1/A2) A CAST SHADOW IS COOL VIOLET-GREY: where stone or paving lies in cast shade by day the fill
  // loses a fifth of its red and a quarter of its green and keeps its blue (a shadow across warm paving reads
  // violet-grey, never brown and never navy)
  // (and so is a stone face turned from the sun: lavender-grey, a tenth deeper)
  // (round 4, A-ii) HIGH UP THE SHADE IS LIGHT: a face in shade (cast, or turned from the sun) takes more of the
  // fill the higher it stands, so the upper tiers' shaded side is a light lavender-grey; and THE UPPER TIERS AND
  // THE CREST CATCH THE GOLD FIRST
  float litK = inSun * smoothstep(-0.2, 0.15, dot(N, uSunDir));
  // (round 5, B1: the shade stays a half darker: that lift is a quarter, not nine tenths)
  // (ROUND 5 MENDING 5, L7: BY PLACE, not by the eye's distance: the lift grows with the HEIGHT over the plane,
  // none at the quay, whole from 60 m up: the upper tiers stand under more open sky)
  amb *= 1. + 0.25 * smoothstep(6., 60., abs(vP.y)) * (1. - uNight) * (1. - indoor) * (1. - litK);
  direct *= 1. + (1. - uNight) * (-0.08 + 0.33 * smoothstep(20., 100., vP.y));
  // (the shade stood purple, not violet-grey: the cast is two thirds of what it was)
  amb *= mix(vec3(0.86, 0.83, 1.), vec3(1.), max(max(inSun, uNight), 1. - stone));
  amb *= mix(vec3(0.93, 0.9, 1.), vec3(1.), max(max(smoothstep(-0.2, 0.15, dot(N, uSunDir)), uNight), max(1. - stone, indoor)));
  // a lamp left burning washes its room (drawn by place: the lamp hangs at the room's middle)
  vec3 lw = vec3(1., 0.72, 0.38) * vA.y * uLampGain * indoor * 1.1 / (1. + 9. * dot(vL - vec3(0., 0.2, -0.1), vL - vec3(0., 0.2, -0.1)));
  float flame = 0.87 + 0.13 * sin(uTime * 2.3 + vA.x * 40.) + 0.045 * sin(uTime * 7.1 + vA.x * 17.);
  lw *= (isRoom + 0.6 * (1. - isRoom)) * flame;
  // (round 3, A2) THE ROOMS' LIGHT READS WARM AGAINST THE SHADE: where the front stands in the cast shade the
  // lamp's wash is twice as strong and a little redder, and reaches the whole room (by day only: the night law
  // is kept as it was)
  // (round 4, A3) GLOW IN THE SHADE: a front is in shade when it stands in cast shade OR is turned from the sun
  // (the west horn's fronts at the opening were dark hollow bays): there, by day, every room has its warm
  // wash whether its lamp was dealt lit or not (the back wall, the ceiling and the things in it glow; the wash
  // is strongest at the room's middle), and a lit lamp's wash is twice as strong as in a sunlit room
  float shF = (1. - uNight) * max(1. - inSun, 1. - smoothstep(0.02, 0.22, vSunF));
  lw *= mix(vec3(1.), vec3(2.1, 1.9, 1.5), shF);
  lw += vec3(1., 0.7, 0.36) * 0.62 * shF * indoor * (isRoom + 0.5 * (1. - isRoom)) / (1. + 4. * dot(vL - vec3(0., 0.2, -0.1), vL - vec3(0., 0.2, -0.1)));
  // (round 4, A-ii: the sunlit fronts stood dull brown, their rooms dark behind the raking sun's line: a room in
  // a front turned to the sun takes a share of the sun's own light on all its walls, so a lit front is warm
  // cream to gold, a shaded one lavender with its warm points)
  // (round 5, A1: that light now lies on the house's wall; the room behind it takes a third of it, a dark doorway)
  // (ROUND 5 MENDING 5, L7: ONE SHARE EVERYWHERE, a quarter of the sun's light, whatever the eye's distance)
  lw += uSunCol * 0.25 * indoor * (1. - shF) * (1. - uNight) * smoothstep(0., 0.4, vSunF) * (1. - 0.67 * behindW);
  // (round 5, B1) THE GRADE: GOLD AGAINST BLUE-VIOLET, by day and out of doors. A face in the sun takes its fill
  // warm and a fifth smaller (the bounce of lit stone, not the grey of the sky), so sunlit stone is a full
  // gold-apricot and not cream; a face in shade (cast, or turned from the sun) takes it blue-violet, so the shaded
  // side is a clear blue-violet about a half under the lit one, near and far; roofs, towers and every edge that
  // looks toward the sun take A WARM RIM (the low sun grazing them), strongest high on the hill
  // (the house's wall behind a gallery, a room's flagged face, stands out of doors for this law: it is most of a
  // front now. B4: THE SHADE GLOWS WARM THROUGH ITS OPENINGS: the wall itself takes a fifth of the room's lamp
  // wash, and behind it, on a front in shade, the wash is stronger, so a shaded front is blue-violet with warm
  // doorways and windows)
  float wallF = max(isRoom * step(1.5, vK.y), outW);
  // (ROUND 5 MENDING 5, L7: that wash is twice as strong on every shaded front, whatever the eye's distance)
  lw *= mix(1., 0.2, wallF * (1. - uNight)) * (1. + behindW * shF);
  // (round 5 mending 2, the book guard: from the quay every doorway was a dark hole by day.) BY DAY THE ROOMS ARE
  // SEEN INTO: in three rooms of four (the room's own figures, which its things share) what lies behind the
  // house's wall, the room's faces and the things in it, takes a warm light (the day off the floor, strongest
  // low), so the back wall stands lit through the doorway and the room's things stand plain against it; half as
  // much on a front in shade, where the rooms already glow. Not by night (the night law is kept)
  // (the guard: a few near openings read dark blue: the one room in four that had none of it. EVERY room takes
  // the warm light by day, that fourth at seven tenths of it)
  // (the quay's arcade openings read blue-grey: a stone storey's walk, whose fourth figure is 0, had none of
  // this light: it takes seven tenths of it too)
  // (the walk is known by its figures, 0.5, 0, 0.5, 0: nothing of the merged mesh and no window pane takes it)
  float seenK = behindW * (1. - uNight) * max(step(0.03, vA.w), 0.7 * step(abs(vA.x - 0.5) + abs(vA.z - 0.5) + abs(vA.w), 0.01)) * mix(0.7, 1., step(0.25, h21(vec2(floor(vA.x * 91. + 0.25), floor(vA.z * 57. + 0.25)) + 7.))) * (1. - 0.5 * shF);
  // (with eight tenths of that light the back wall stood as pale as the sunlit wall round the doorway: six tenths)
  lw += vec3(1., 0.8, 0.52) * 0.6 * seenK * mix(1., mix(1.12, 0.78, clamp(vL.y + 0.5, 0., 1.)), isRoom);
  float dayK = (1. - uNight) * (1. - indoor * (1. - wallF)), litB = inSun * smoothstep(-0.1, 0.35, dot(N, uSunDir));
  amb = mix(amb, amb * vec3(1.05, 0.8, 0.5) * 0.8, dayK * litB);
  // (ROUND 5 MENDING 5, step 1c: the bastions' and terraces' walls in shade stood as flat lilac planes.) A WALL IN
  // SHADE IS STONE IN SHADE: on the kind WALL the shade's cast is a warm grey with a breath of violet, not the
  // blue-violet of the limewashed fronts
  amb = mix(amb, dot(amb, vec3(0.34)) * mix(vec3(0.8, 0.82, 1.3), vec3(1.02, 0.9, 1.0), step(13.5, kind)) * 0.86, 0.8 * dayK * (1. - litB));
  float rimB = pow(max(1. - abs(dot(N, normalize(cameraPosition - vP))), 0.), 3.) * smoothstep(-0.3, 0.4, dot(N, uSunDir)) * inSun;
  direct += uSunCol * 0.4 * rimB * dayK * (0.4 + 0.6 * smoothstep(10., 70., vP.y));
  // (round 5, D1, the guard, BY NIGHT only; by day nothing is changed): THE ROOFS ARE LIT ENOUGH TO SHOW (a roof
  // takes the night sky's fill seven tenths stronger), and THE FAR HILLS STAND DARKER THAN THE SKY (the ranges
  // beyond 900 m, which the haze had made as pale as the horizon, keep half of their tone after it)
  // (from the west terrace by night the near roofs stood a loud blue and the hills were paler than the sky:
  // the roofs' lift is 0.45, the ranges keep 8 hundredths: dark outlines under the stars)
  amb *= 1. + 0.45 * uNight * step(2.5, kind) * step(kind, 3.5);
  vec3 col = alb * (direct + amb + lw) + emis;
  float haze =1. - exp(-vDist * uHaze.a * mix(1., ${(1 - LOWER_TONE).toFixed(2)}, 0.5 - 0.5 * uSide));
  col = mix(col, uHaze.rgb, clamp(haze, 0., 1.));
  // (ROUND 5 MENDING 5, L7: the far ranges by their PLACE: rock from 900 to 1400 m of the bay's centre and beyond)
  col *= 1. - 0.92 * uNight * step(9.5, kind) * step(kind, 10.5) * smoothstep(900., 1400., length(vP.xz));
  // (WHAT STANDS ON THE OPEN LAKE IS DARK BY NIGHT: it keeps 0.15 of its light, a dark shape on the dark
  // water. THE LAW READS THE THING ITSELF: the two rocks with their houses and the islets' footing stones
  // are a mesh of their own whose material carries uLake 1 (everything else 0), so a rock is dark as a whole
  // wherever it stands; no edge in the plane is read)
  col *= 1. - 0.85 * uNight * uLake;
  // a join belongs to both cities: under the plane it takes the lower tone
  gl_FragColor = vec4(col * mix(uTone, vec3(${(1 - LOWER_TONE).toFixed(2)}, ${(1 - LOWER_TONE / 2).toFixed(2)}, 1.), uJoin * step(vP.y, 0.)), 1.);
}`;

// ---------------------------------------------------------------- the look's shared uniforms and THE ONE MAKER
export function makeLook() {
  return {
    uTime: { value: 0 }, uHand: { value: 1 }, uLampGain: { value: 1 },
    uSunCol: { value: new THREE.Color(1, 1, 1) }, uAmbSky: { value: new THREE.Color(0.3, 0.4, 0.6) },
    uAmbGround: { value: new THREE.Color(0.2, 0.2, 0.2) }, uHaze: { value: new THREE.Vector4(0.7, 0.8, 0.9, 0.0006) },
    uShadeRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uShade: { value: null },
    uOccRect: { value: new THREE.Vector4(1.4, 8, 276, 13) }, uOcc: { value: null },
    uSkyTop: { value: new THREE.Color(0.3, 0.5, 0.8) }, uSkyHor: { value: new THREE.Color(0.8, 0.88, 0.95) },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunGlow: { value: new THREE.Color(1, 0.8, 0.6) },
    uBreath: { value: new THREE.Vector4(1, 0, 6, 9) },
    // the hour's night figure (0 by day, 1 by night): the sky's stars, the water's darker tint and its glitter
    uNight: { value: 0 },
  };
}

// makeDoubler(look): add(mesh) hangs the mesh in the upper city and lays its twin under the plane. The twin is a
// second Mesh / InstancedMesh object over the SAME geometry and the SAME instance buffers (no copy), in a group
// scaled y -1; its material is the same program with uSide -1 and the lower tone. pair = { up, low } hands in a
// material pair of the caller's own (smoke) that keeps the same terms.
export function makeDoubler(look) {
  const upper = new THREE.Group(), lower = new THREE.Group();
  lower.scale.y = -1;
  const tone = new THREE.Vector3(1 - LOWER_TONE, 1 - LOWER_TONE / 2, 1), one = new THREE.Vector3(1, 1, 1);
  const mk = (inst, side) => new THREE.ShaderMaterial({
    vertexShader: CITY_VERT, fragmentShader: CITY_FRAG, defines: inst ? { INST: 1 } : {}, side: THREE.DoubleSide,
    uniforms: { ...look, uSide: { value: side }, uTone: { value: side > 0 ? one : tone }, uJoin: { value: 0 }, uLake: { value: 0 } },
  });
  const mats = { up: [mk(false, 1), mk(true, 1)], low: [mk(false, -1), mk(true, -1)] };
  const joinMat = mk(false, 1);
  joinMat.uniforms.uJoin.value = 1;
  // the lake rocks' own pair: the same program with uLake 1 (dark by night as a whole)
  const lakePair = { up: mk(false, 1), low: mk(false, -1) };
  lakePair.up.uniforms.uLake.value = lakePair.low.uniforms.uLake.value = 1;
  const api = {
    upper, lower, mats, tone, joinMat, lakePair, triangles: 0, calls: 0, meshes: [],
    add(mesh, pair) {
      const inst = mesh.isInstancedMesh ? 1 : 0;
      mesh.material = pair ? pair.up : mats.up[inst];
      let twin;
      if (inst) {
        twin = new THREE.InstancedMesh(mesh.geometry, pair ? pair.low : mats.low[1], mesh.count);
        twin.instanceMatrix = mesh.instanceMatrix;
      } else twin = new THREE.Mesh(mesh.geometry, pair ? pair.low : mats.low[0]);
      twin.renderOrder = mesh.renderOrder;
      mesh.frustumCulled = false; twin.frustumCulled = false;
      mesh.matrixAutoUpdate = false; twin.matrixAutoUpdate = false;
      upper.add(mesh); lower.add(twin); mesh.userData.twin = twin;
      const idx = mesh.geometry.index, n = (idx ? idx.count : mesh.geometry.attributes.position.count) / 3;
      api.triangles += 2 * n * (inst ? mesh.count : 1); api.calls += 2;
      api.meshes.push(mesh);
      return mesh;
    },
  };
  return api;
}

// an instanced mesh of one geometry: list = [{ m: Matrix4, a: [phase, lit, var, w], c: [r, g, b] }]
export function makeInstanced(geo, list) {
  const mesh = new THREE.InstancedMesh(geo, undefined, Math.max(1, list.length));
  const A = new Float32Array(mesh.count * 4), C = new Float32Array(mesh.count * 3);
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    mesh.setMatrixAt(i, it.m);
    const a = it.a || [0, 0, 0, 0], c = it.c || [1, 1, 1];
    A.set(a, i * 4); C.set(c, i * 3);
  }
  if (!list.length) mesh.setMatrixAt(0, new THREE.Matrix4().makeScale(0, 0, 0));
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
  geo.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 3));
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// ---------------------------------------------------------------- the plan (polar about the bay's centre; hand +1)
// a = angle from -Z toward +X (radians), r = metres from the centre. pos(r, a) = [r sin a, -r cos a].
// The inward direction (toward the bay) at a is (-sin a, cos a); a house that faces the bay has yaw -a.
const D2R = Math.PI / 180;
export function makePlan(rng, vary = {}) {
  // eight or nine tiers; how fast the hill falls toward the horns is dealt within what leaves six tiers at the inlet
  // ROUND 2, THE TERRACES: FIVE great tiers, each 18 m over the last (a house of an arcade and three verandas is
  // 12 m: the upper 6 m of every bastion wall and its balustered street stand clear above the roofs as a level band
  // of pale stone across the crescent). The hill falls to three tiers toward the horns. The inlet is a basin (two
  // tiers deep since stage E, see below): its rim is street 1. No lane and no piazza.
  // (ROUND 5 MENDING 5, L4: THE DEAL IS DEALT ONCE: no draw is made and thrown away to keep an older deal)
  const NT = 5, steep = rng.range(0.36, 0.46);
  const P = {
    RQ: 270, QW: 6, DECK: 1.2, TP: 13, TR: 18, HD: 8, ST: 5, FLOOR: 3, ROOMD: 5, PROUD: 0.22, EAVE: 0.6,
    aMax: 75 * D2R, NT, steep,
    aI: (56 + rng.range(-1.2, 1.2)) * D2R, inletW: 30, inletD: 32, FB: 10.5, RIMF: 6,
    bay: rng.range(3.5, 4.4),
  };
  P.alpha = (P.inletW / 2) / P.RQ;
  P.rHead = P.RQ + P.inletD;
  // (THE BASIN IS TWO TIERS DEEP, 30 m by 32 m: its head stands at tier 2's front line, 32 m from the mouth;
  // both bastions' tops are open terraces of that depth; over the head a bastion wall rises to street 2)
  // (round 3, B1: the pier's inland face, and the line of the harbour head's house fronts: they stand free, 5.5 m
  // before the high wall)
  P.rPier = P.RQ + P.QW; P.rFront = P.rHead - 5.5;
  // (the head's low quay stands 1.6 m before those fronts: its edge is the harbour water's inland shore)
  P.rHQ = P.rFront - 1.6;
  P.rimY = P.DECK + P.RIMF * P.FLOOR;
  P.pos = (r, a) => [r * Math.sin(a), -r * Math.cos(a)];
  P.polar = (x, z) => [Math.hypot(x, z), Math.atan2(x, -z)];
  P.tierR = (k) => P.RQ + P.QW + P.TP * k;
  P.tierY = (k) => P.DECK + P.TR * k;
  // how many tiers stand at angle a: the hill is highest at the back and falls toward the horns
  P.tiersAt = (a) => Math.max(3, Math.round(P.NT * (1 - P.steep * (a / P.aMax) * (a / P.aMax))));
  // THE STAIR LANES: four gaps 25 m wide between the bastions, from the crest to the quay. In each gap, on every
  // tier, a flight of stairs climbs along the bare bastion wall to the next high street, turning about at each
  // street (a zigzag from the quay to the crest); none in the inlet's sector
  P.laneHalf = 12.5;
  // THE RISING STREET (the climb): from rampA0 the quay's deck itself rises along the contour, 6 m wide between its
  // balustrade at the water's edge and the house fronts, one in five, to the west bastion's top (street 1's level);
  // the houses beside it stand each on the street's level at its lower end
  P.rampA1 = P.aI - P.alpha - P.FB / 293;
  P.rampA0 = P.rampA1 - (P.rimY - P.DECK) * 5 / (P.RQ + 3);
  // (L4) LANES AND TOWERS FALL BY THE SEED'S DRAW OVER THE CRESCENT. The fourth lane, whose foot is the water stair,
  // lies 10 to 13 degrees before the rising street's foot on every seed (the line passes the stair on the level
  // quay, before it swings out over the quay's edge). The other three fall anywhere from 64 degrees west of the
  // middle to LS short of the fourth, never nearer one another than LS = 16 degrees (a gap is 5 degrees wide: 50 m
  // of houses and more stand between two gaps): three draws, sorted, spread over the slack
  const a3 = P.rampA0 / D2R - rng.range(10.1, 13.1), LS = 16, slack = a3 + 64 - 3 * LS;
  P.lanes = [rng(), rng(), rng()].sort((p, q) => p - q).map((u, i) => ({ a: (-64 + u * slack + i * LS) * D2R })).concat([{ a: a3 * D2R }]);
  // THE GALLERY TOWERS: three belvederes of stacked verandas under a pointed roof, each on its place's top tier.
  // Each stands in a span of its own between two gaps (or west of the first, or between the fourth and the
  // harbour's west bastion), never nearer a gap's middle than 6 degrees: no tower's lot is cut by a gap, and no
  // two towers stand nearer than 12 degrees
  const ends = [-70].concat(P.lanes.map((l) => l.a / D2R), [P.rampA1 / D2R + 2]);
  const spans = ends.slice(1).map((e, i) => [ends[i] + 6, e - 6]).filter((s) => s[1] - s[0] > 2);
  P.towers = [0, 1, 2].map(() => { const s = spans.splice(Math.floor(rng() * spans.length), 1)[0], a = (s[0] + rng() * (s[1] - s[0])) * D2R; return { a, k: Math.min(P.tiersAt(a - 5 * D2R), P.tiersAt(a), P.tiersAt(a + 1.5 * D2R)) - 1 }; });
  // (its tier is the top one that holds over the whole lot that may carry it: a lot begins up to 5 degrees before
  // the tower's place and ends up to 1.5 after it)
  // (stage E: three planted bays stand out from the rising street's wall over the water, each a battered buttress
  // with a cypress in it)
  P.belv = [0.3, 0.57, 0.7].map((t) => P.rampA0 + (P.rampA1 - P.rampA0) * t);
  P.rampY = (a) => (a > P.rampA1 + 1e-4 ? P.DECK : P.DECK + (P.rimY - P.DECK) * Math.max(0, (a - P.rampA0) / (P.rampA1 - P.rampA0)));
  // the two flank blocks beside the inlet are radial wedges: their widths are measured at r = 293. aLaneE is the
  // west flank's west edge, aBastE the east flank's east edge (aLaneW is the same edge as aLaneE: no lane lies there)
  P.aLaneE = () => P.aI - P.alpha - P.FB / 293;
  P.aLaneW = () => P.aLaneE();
  P.aBastE = () => P.aI + P.alpha + P.FB / 293;
  // which part of the place a point of the plan belongs to
  P.zone = (r, a) => {
    if (Math.abs(a) > P.aMax) return 'out';
    if (r < P.RQ) return 'water';
    const da = a - P.aI;
    if (r < P.rHead && Math.abs(da) < P.alpha) return 'water';
    // THE HARBOUR: no body of an east bastion stands. Behind THE PIER (6 m deep at the quay's line, where the
    // causeway leaves) the basin's water goes on east to the east
    // arm's cut end: a harbour 30 m wide at its mouth and 40 m wide within, open on that side to the first quay
    // house, the high street's end and the houses over it
    if (r > P.rPier && r < P.rHead && da >= P.alpha && a < P.aBastE()) return 'water';
    if (r < P.rHead && a > P.aLaneE() && a < P.aBastE()) return 'bastion';
    if (r < P.RQ + P.QW) return 'quay';
    return 'tier';
  };
  // the built ground's height at a point (streets, lane floor, rim, rock); houses stand on it
  P.ground = (r, a) => {
    const z = P.zone(r, a);
    if (z === 'out' || z === 'water') return 0;
    if (z === 'quay') return P.rampY(a);
    if (z === 'bastion') return P.rimY;
    const k = Math.floor((r - P.tierR(0)) / P.TP), nt = P.tiersAt(a);
    if (k >= nt) return P.tierY(nt) + Math.min(14, (r - P.tierR(nt)) * 0.5);
    return (r - P.tierR(k)) < P.HD ? P.tierY(k) : P.tierY(k + 1);
  };
  // the top of what is built (for the shade map): houses stand 8 m deep at the front of each tier
  P.top = (r, a) => {
    const z = P.zone(r, a), g = P.ground(r, a);
    if (z === 'bastion') return g + (Math.abs(a - P.aI) > P.alpha + 5.5 / r && r < P.rHead ? 6.5 : 0);
    if (z !== 'tier') return g;
    const k = Math.floor((r - P.tierR(0)) / P.TP), nt = P.tiersAt(a);
    if (k >= nt) return g;
    return P.tierY(k + 1);
  };
  return P;
}

// ---------------------------------------------------------------- the shade map (the hill's own shadow toward the sun)
// One half-float texture over the plan: at each cell the height under which a thing stands in the hill's shade.
// The built tops are read once on the grid, then each cell marches toward the sun over that grid.
export const SHADE_RECT = { x0: -456, z0: -456, x1: 456, z1: 40, nx: 256, nz: 136 };
export async function makeShadeMap(P, sunDir, yieldFn) {
  const R = SHADE_RECT, nx = R.nx, nz = R.nz, dx = (R.x1 - R.x0) / nx, dz = (R.z1 - R.z0) / nz;
  const top = new Float32Array(nx * nz), data = new Uint16Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = R.x0 + (i + 0.5) * dx, z = R.z0 + (j + 0.5) * dz, pl = P.polar(x, z);
      top[j * nx + i] = Math.max(P.top(pl[0], pl[1]), P.extraTop ? P.extraTop(x, z) : 0);
    }
    if (j % 24 === 23) await yieldFn();
  }
  const hl = Math.hypot(sunDir.x, sunDir.z) || 1, hx = sunDir.x / hl, hz = sunDir.z / hl, tanE = sunDir.y / hl;
  const step = 3.2, steps = Math.min(150, Math.ceil(150 / Math.max(0.12, tanE) / step));
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = R.x0 + (i + 0.5) * dx, z = R.z0 + (j + 0.5) * dz;
      // (round 4, A-ii: ONLY WHAT STANDS HIGHER THAN THE PLACE'S OWN TOP CASTS ON IT. A tier is laid in this map
      // as one block as high as its houses: marched over, it shaded its own fronts and the walls behind its gaps,
      // and with the sun far off the axis the whole city stood in one flat shade from afar. Towers, bastions,
      // the hall, the causeway and the harbour's houses cast as before; the houses' own shadows on the walls and
      // terraces beside them are drawn from the map of their tops, see makeOccMap)
      let hs = -50; const own = top[j * nx + i] + 0.5;
      for (let s = 1; s <= steps; s++) {
        const t = 2 + s * step, ii = Math.floor((x + hx * t - R.x0) / dx), jj = Math.floor((z + hz * t - R.z0) / dz);
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) break;
        if (top[jj * nx + ii] <= own) continue;
        const h = top[jj * nx + ii] - tanE * t;
        if (h > hs) hs = h;
      }
      // (no far shore's shade lies on the quay: the low sun reaches it and every thing on it throws a long shadow)
      data[j * nx + i] = THREE.DataUtils.toHalfFloat(hs);
    }
    // (round 5, D2: the march's first rows run cold, 24 to 41 ms for twelve: it rests after rows 2, 5 and 8 too)
    if (j % 12 === 11 || (j < 9 && j % 3 === 2)) await yieldFn();
  }
  const tex = new THREE.DataTexture(data, nx, nz, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return { texture: tex, rect: new THREE.Vector4(R.x0, R.z0, 1 / (R.x1 - R.x0), 1 / (R.z1 - R.z0)) };
}
// (round 4, A-ii) THE MAP OF THE HOUSES' TOPS: one small half-float texture, 2048 bearings by 8 tiers: at each
// bearing of each tier the top of the house that stands there (-50 where the tier has a gap: a stair lane, a
// garden, a street). The city's shader reads it to draw each house block's long slanted shadow on the bastion
// face, the terrace and the neighbour's side wall beside it (no triangle, no call; some 16,000 texels)
export function makeOccMap(P, houses) {
  const W = 2048, H = 8, A = P.aMax + 0.12, vals = new Float32Array(W * H).fill(-50), data = new Uint16Array(W * H);
  for (const h of houses) {
    if (h.kind !== 'tier') continue;
    const r = Math.hypot(h.x, h.z), a = Math.atan2(h.x, -h.z), k = Math.floor((r - P.tierR(0) + 2) / P.TP);
    if (k < 0 || k >= H) continue;
    const top = h.y0 + h.floors * P.FLOOR + 0.6, hw = h.w / 2 / r;
    const i0 = Math.max(0, Math.round((a - hw + A) / (2 * A) * W)), i1 = Math.min(W - 1, Math.round((a + hw + A) / (2 * A) * W));
    for (let i = i0; i <= i1; i++) vals[k * W + i] = Math.max(vals[k * W + i], top);
  }
  for (let i = 0; i < W * H; i++) data[i] = THREE.DataUtils.toHalfFloat(vals[i]);
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return { texture: tex, rect: new THREE.Vector4(A, H, P.tierR(0), P.TP) };
}

// ---------------------------------------------------------------- the rock, the streets and their parapets (one merged mesh)
// Radial wedges of 2.5 degrees; each tier gives a floor under its houses, the retaining wall behind them, the
// street on top and the street's stone parapet on the water side; a crest of rock closes the hill.
export function wedgeAngles(P) {
  const list = [-P.aMax], step = 2.5 * D2R, cuts = [P.aLaneW(), P.aLaneE(), P.aI - P.alpha, P.aI + P.alpha, P.aBastE(), P.aMax];
  let a = -P.aMax;
  while (a < P.aMax - 1e-6) {
    let b = Math.min(a + step, P.aMax);
    for (const c of cuts) if (c > a + 1e-6 && c < b - 1e-6) b = c;
    if (b - a > 1e-5) list.push(b);
    a = b;
  }
  return list;
}
export function makeTerrain(P, pal, far = null, flank = null) {
  const g = makeGeo(), A = wedgeAngles(P);
  const inSector = (a) => a > P.aLaneW() && a < P.aBastE();
  const rSec = P.rHead;
  // the radial profile of a wedge: [r, y, kind]
  const profile = (a) => {
    const nt = P.tiersAt(a), sec = inSector(a), pr = [];
    if (sec) pr.push([rSec, P.rimY, KIND.STONE], [rSec, P.tierY(2), KIND.PAVE]);
    for (let k = 0; k < nt; k++) {
      const r0 = P.tierR(k), r1 = r0 + P.HD, r2 = P.tierR(k + 1);
      if (sec && r2 <= rSec + 0.01) continue;
      if (!sec || r0 >= rSec - 0.01) pr.push([r0, P.tierY(k), KIND.PAVE], [r1, P.tierY(k), KIND.STONE]);
      pr.push([r1, P.tierY(k + 1), KIND.PAVE], [r2, P.tierY(k + 1), KIND.PAVE]);
    }
    const rc = P.tierR(nt), yc = P.tierY(nt);
    pr.push([rc, yc, KIND.ROCK], [rc + 26, yc + 13, KIND.ROCK], [rc + 70, yc - 8, KIND.ROCK]);
    return pr;
  };
  const cap = (pr, a, sgn) => {
    // (stage F: the cut ends of the terraces are of the bastions' own pale stone, coursed like them)
    g.kind(KIND.STONE).col(pal.bastion);
    for (let i = 0; i + 1 < pr.length; i++) {
      const p0 = P.pos(pr[i][0], a), p1 = P.pos(pr[i + 1][0], a);
      const q = [[p0[0], 0, p0[1]], [p1[0], 0, p1[1]], [p1[0], pr[i + 1][1], p1[1]], [p0[0], pr[i][1], p0[1]]];
      g.quad(q[0], q[1], q[2], q[3], [Math.cos(a) * sgn, 0, Math.sin(a) * sgn]);
    }
  };
  let prevKey = '';
  for (let w = 0; w + 1 < A.length; w++) {
    const a0 = A[w], a1 = A[w + 1], ac = (a0 + a1) / 2, z = P.zone(P.RQ + 20, ac);
    const pr = profile(ac), key = pr.length + ':' + pr[0][0] + ':' + (z === 'tier' || inSector(ac) ? 1 : 0);
    if (key !== prevKey) { cap(pr, a0, -1); if (w > 0) cap(profile((A[w - 1] + a0) / 2), a0, 1); }
    prevKey = key;
    for (let i = 0; i + 1 < pr.length; i++) {
      const [r0, y0, kd] = pr[i], [r1, y1] = pr[i + 1];
      const A0 = P.pos(r0, a0), B0 = P.pos(r0, a1), A1 = P.pos(r1, a0), B1 = P.pos(r1, a1);
      // (a bastion's wall is of the pale stone: it is the level band across the crescent)
      g.kind(kd).col(kd === KIND.ROCK ? pal.rock : kd === KIND.STONE ? pal.bastion : pal.pave);
      if (kd === KIND.STONE) {
        // (round 2: a bastion's wall is kind WALL: pilasters, blind arches, a string course and a coping, by the
        // metres along its own circle; and here and there green hangs over its head in ragged strips)
        g.kind(KIND.WALL).move(y1 - y0).quad([A0[0], y0, A0[1]], [B0[0], y0, B0[1]], [B1[0], y1, B1[1]], [A1[0], y1, A1[1]], null, [a0 * r0, 0, a1 * r0, 0, a1 * r0, y1 - y0, a0 * r0, y1 - y0]).move(0);
        const hh = Math.abs(Math.sin(w * 12.9898 + i * 78.233) * 43758.5453) % 1;
        if (hh < 0.3) {
          const rg = r0 - 0.22, wd = (a1 - a0) * rg, n = [-Math.sin(ac), 0, Math.cos(ac)], ns = Math.max(2, Math.min(6, Math.floor(wd / 1.1)));
          g.kind(KIND.LEAF).col(mulc(pal.leaf[hh < 0.15 ? 0 : 1], 0.8)).move(1);
          for (let j = 0; j < ns; j++) {
            const t0 = a0 + (a1 - a0) * (0.1 + 0.8 * j / ns), t1 = a0 + (a1 - a0) * (0.1 + 0.8 * (j + 1) / ns), G0 = P.pos(rg, t0), G1 = P.pos(rg, t1);
            const len = 1.2 + 3.6 * (Math.abs(Math.sin((w * 31 + i * 17 + j) * 3.71) * 9173.13) % 1);
            // (the guard: a lime blade close under the line past the harbour: a strip of this green on the wall
            // there stood 0.35 m over the wall's head. It ends under the coping)
            g.quad([G0[0], y1 - len, G0[1]], [G1[0], y1 - len * 0.8, G1[1]], [G1[0], y1 - 0.14, G1[1]], [G0[0], y1 - 0.14, G0[1]], n);
          }
          g.move(0);
        }
        continue;
      }
      g.quad([A0[0], y0, A0[1]], [B0[0], y0, B0[1]], [B1[0], y1, B1[1]], [A1[0], y1, A1[1]]);
      // THE BALUSTRADE stands on the water side of every high street (where a wall has just risen to it): a string
      // course under it, turned stone balusters (cut by the shader near, a solid band far off), a coping
      if (kd === KIND.PAVE && i > 0 && pr[i - 1][0] === r0 && pr[i - 1][1] < y0 && pr[i - 1][2] !== KIND.ROCK) {
        const ro = r0 - 0.14, Ao = P.pos(ro, a0), Bo = P.pos(ro, a1), yt = y0 + 1.15, n = [-Math.sin(ac), 0, Math.cos(ac)];
        g.kind(KIND.STONE).col(pal.parapet);
        g.quad([Ao[0], y0 - 0.5, Ao[1]], [Bo[0], y0 - 0.5, Bo[1]], [Bo[0], y0, Bo[1]], [Ao[0], y0, Ao[1]], n);
        g.quad([Ao[0], yt, Ao[1]], [Bo[0], yt, Bo[1]], [B0[0], yt, B0[1]], [A0[0], yt, A0[1]], [0, 1, 0]);
        g.quad([Ao[0], yt - 0.12, Ao[1]], [Bo[0], yt - 0.12, Bo[1]], [Bo[0], yt, Bo[1]], [Ao[0], yt, Ao[1]], n);
        g.kind(KIND.RAIL).quad([A0[0], y0, A0[1]], [B0[0], y0, B0[1]], [B0[0], yt - 0.06, B0[1]], [A0[0], yt - 0.06, A0[1]], n);
      }
    }
  }
  cap(profile((A[A.length - 2] + A[A.length - 1]) / 2), A[A.length - 1], 1);
  // THE STAIRS OF THE LANES: on each tier of each gap one flight 2.4 m wide against the bastion's wall, from the
  // tier's floor to the street above (18 m in 22 m: steps by the paving's courses), a balustrade on its open side
  // (round 3, A4) NO FLIGHT RUNS CORNER TO CORNER ACROSS A GAP'S FACE: on each tier the stair is A ZIGZAG OF THREE
  // SHORT FLIGHTS in the gap's middle, 11 m long and 2.2 m wide, each 6 m up, one behind the other (the lowest
  // toward the lake, the highest against the wall), turning about at each landing; the gap's wall stands bare
  // on both sides of it
  for (const l of P.lanes) {
    for (let k = 0; k < P.tiersAt(l.a); k++) for (let j = 0; j < 3; j++) {
      const rise = (P.tierY(k + 1) - P.tierY(k)) / 3, wS = 2.2, ri = P.tierR(k) + P.HD - (3 - j) * wS, r1 = ri + wS, yA = P.tierY(k);
      const dir = (k % 2 ? 1 : -1) * (j % 2 ? -1 : 1), half = 5.5 / r1, NS = 2, yL = yA + j * rise, yB = yL + rise;
      const at = (t) => l.a + dir * half * (2 * t - 1), sl = Math.atan2(rise, 11), cs = Math.cos(sl), sn = Math.sin(sl);
      for (let i = 0; i < NS; i++) {
        const t0 = i / NS, t1 = (i + 1) / NS, a0 = at(t0), a1 = at(t1), am = (a0 + a1) / 2, y0 = yL + rise * t0, y1 = yL + rise * t1;
        const I0 = P.pos(ri, a0), I1 = P.pos(ri, a1), O0 = P.pos(r1, a0), O1 = P.pos(r1, a1), nb = [-Math.sin(am), 0, Math.cos(am)];
        g.kind(KIND.PAVE).col(pal.pave);
        g.quad([I0[0], y0, I0[1]], [I1[0], y1, I1[1]], [O1[0], y1, O1[1]], [O0[0], y0, O0[1]], [-dir * sn * Math.cos(am), cs, -dir * sn * Math.sin(am)]);
        // (round 3, after the lead's look at r3b: the flight's face is THE BASTION'S OWN STONE, a shade deeper, and
        // its ends deeper yet: cut stairs, not a pale zigzag painted on the wall)
        // (round 2: kind WALL, its head sloping: pilasters, a blind arch to each bay stepping up under the flight)
        g.kind(KIND.WALL).col(mulc(pal.bastion, 0.93));
        const hA = y0 - yA, hB = y1 - yA, uA = a0 * ri, uB = a1 * ri;
        const w0 = g.vert(I0[0], yA, I0[1], nb[0], 0, nb[2], uA, 0, hA), w1 = g.vert(I1[0], yA, I1[1], nb[0], 0, nb[2], uB, 0, hB);
        const w2 = g.vert(I1[0], y1, I1[1], nb[0], 0, nb[2], uB, hB, hB), w3 = g.vert(I0[0], y0, I0[1], nb[0], 0, nb[2], uA, hA, hA);
        g.tri(w0, w1, w2); g.tri(w0, w2, w3);
      }
      // (from over the bay the lanes' flights read as shards: a ruled
      // diagonal rail over a bare triangle of wall.) A FLIGHT READS AS A STAIR: its parapet is a STEPPED WALL of
      // five level blocks, each 2.2 m long and 1.2 m over the last, with a coping (the wall's own paint), so the
      // flight's edge is a row of steps against what stands behind it; the ruled balustrade is gone
      for (let s = 0; s < 5; s++) {
        const a0 = at(s / 5), a1 = at((s + 1) / 5), am = (a0 + a1) / 2, yb0 = yL + rise * s / 5, yb1 = yL + rise * (s + 1) / 5, yT = yb1 + 0.95, nb = [-Math.sin(am), 0, Math.cos(am)];
        const I0 = P.pos(ri, a0), I1 = P.pos(ri, a1), J0 = P.pos(ri + 0.3, a0), J1 = P.pos(ri + 0.3, a1), uA = a0 * ri, uB = a1 * ri;
        g.kind(KIND.WALL).col(mulc(pal.bastion, 0.97));
        // (with a head of 2.2 m the wall's string course and its shade fell across each block as
        // a dark wedge: the blocks name a head of 5 m, so they are plain coursed stone under their own coping)
        const v0 = g.vert(I0[0], yb0, I0[1], nb[0], 0, nb[2], uA, 2.2 - (yT - yb0), 5), v1 = g.vert(I1[0], yb1, I1[1], nb[0], 0, nb[2], uB, 2.2 - (yT - yb1), 5);
        const v2 = g.vert(I1[0], yT, I1[1], nb[0], 0, nb[2], uB, 2.2, 5), v3 = g.vert(I0[0], yT, I0[1], nb[0], 0, nb[2], uA, 2.2, 5);
        g.tri(v0, v1, v2); g.tri(v0, v2, v3);
        g.kind(KIND.STONE).col(pal.parapet).quad([I0[0], yT, I0[1]], [I1[0], yT, I1[1]], [J1[0], yT, J1[1]], [J0[0], yT, J0[1]], [0, 1, 0]);
      }
      // the flight's high end
      const ae = at(1), E0 = P.pos(ri, ae), E1 = P.pos(r1, ae);
      g.kind(KIND.WALL).move(yB - yA).col(mulc(pal.bastion, 0.78)).quad([E0[0], yA, E0[1]], [E1[0], yA, E1[1]], [E1[0], yB, E1[1]], [E0[0], yB, E0[1]], [dir * Math.cos(ae), 0, dir * Math.sin(ae)], [2, 0, 4.4, 0, 4.4, yB - yA, 2, yB - yA]).move(0);
      // (and the low end of the second and third flights: the block's other end, as high as the landing)
      if (j > 0) {
        const al = at(0), L0 = P.pos(ri, al), L1 = P.pos(r1, al);
        g.kind(KIND.WALL).move(yL - yA).col(pal.bastion).quad([L1[0], yA, L1[1]], [L0[0], yA, L0[1]], [L0[0], yL, L0[1]], [L1[0], yL, L1[1]], [-dir * Math.cos(al), 0, -dir * Math.sin(al)], [2, 0, 4.2, 0, 4.2, yL - yA, 2, yL - yA]).move(0);
      }
      // (ROUND 5 MENDING 5, step 1a, by form) TWO BUTTRESSES flank each tier's stair on the gap's wall: battered
      // piers of the wall's stone, 1.5 m wide, 1.2 m out at the foot and 0.45 m at 13 m, under a sloped cap; each
      // stands on a painted pier of the wall (the bays' own 6.4 m), 6.4 to 12.8 m from the lane's middle
      if (j === 0) for (const sd of [-1, 1]) {
        const rw = P.tierR(k) + P.HD, nG = sd > 0 ? Math.ceil((l.a * rw + 6.4) / 6.4) : Math.floor((l.a * rw - 6.4) / 6.4), ab = nG * 6.4 / rw, hb = 0.75 / rw, yT = yA + 13;
        const nbb = [-Math.sin(ab), 0, Math.cos(ab)], uvb = [3.2, 0.3, 3.2, 0.3, 3.2, 0.3, 3.2, 0.3];
        const F0 = P.pos(rw - 1.2, ab - hb), F1 = P.pos(rw - 1.2, ab + hb), T0 = P.pos(rw - 0.45, ab - hb), T1 = P.pos(rw - 0.45, ab + hb), W0 = P.pos(rw, ab - hb), W1 = P.pos(rw, ab + hb);
        g.kind(KIND.WALL).move(5).col(mulc(pal.bastion, 1.03));
        g.quad([F0[0], yA, F0[1]], [F1[0], yA, F1[1]], [T1[0], yT, T1[1]], [T0[0], yT, T0[1]], nbb, uvb);
        g.col(pal.parapet).quad([T0[0], yT, T0[1]], [T1[0], yT, T1[1]], [W1[0], yT + 1.1, W1[1]], [W0[0], yT + 1.1, W0[1]], [nbb[0] * 0.6, 0.8, nbb[2] * 0.6], uvb);
        g.col(mulc(pal.bastion, 0.86));
        for (const [Fa, Ta, Wa, s2] of [[F0, T0, W0, -1], [F1, T1, W1, 1]])
          g.quad([Wa[0], yA, Wa[1]], [Fa[0], yA, Fa[1]], [Ta[0], yT, Ta[1]], [Wa[0], yT + 1.1, Wa[1]], [Math.cos(ab) * s2, 0, Math.sin(ab) * s2], uvb);
        g.move(0);
      }
    }
  }
  if (far && flank) makeFlankWalls(g, P, pal, far, flank);
  return g;
}
// A STAIR LANE'S FLANK WALLS NEAR THE LINE ARE NOT BARE. The walls of a lane's gap that face the lake are the
// gap's wall on either hand of the stair and the second and third flights' walls: plain ashlar with painted
// blind arches. Where the gap's wall stands within FLANK_NEAR 30 m of the line in space (asked at its foot at
// the lane's middle, 2 m over the tier's floor: a place, a standing thing of the world), by a rule for every
// lane, tier and seed:
// EVERY BLIND ARCH that stands whole and clear (its middle 1.9 m and more from a house's flank, 0.8 m from the
// stair's end, 1.1 m from a flight wall's ends; the opening whole under the arch's crown) HOLDS, set
// 0.22 m back in jambs and a lintel of the parapets' stone, A TIMBER DOOR ON A STONE STEP (the gap's wall, three in
// five by the stream flank) OR A SHUTTERED WINDOW ON A STONE SILL (the rest, and every arch of a flight's wall),
// in the houses' shutter tones; A STRING COURSE of that stone runs at each landing's height (6 and 12 m over the
// tier's floor on the gap's wall, at its own landing on a flight's wall; it stops at every recess that reaches
// its height); and at one arch in two (flank) GREEN
// HANGS from the wall's head over the arch (under the coping on the gap's wall, over the stepped parapet on a
// flight's), three strips 1 m wide and 1.2 to 3 m long. Every arch takes its draws whether its wall is near or
// not: the line changes no draw. A wall further off stays plain; a face without a blind arch stays plain, near
// or not (the first flight's wedge wall is no face of this maker; a near wall's stretch whose head is under
// 5.2 m carries the string course alone). P.flank: each near gap's arches and triangles
export const FLANK_NEAR = 30;
export function makeFlankWalls(g, P, pal, far, flank) {
  P.flank = [];
  P.lanes.forEach((l, li) => { for (let k = 0; k < P.tiersAt(l.a); k++) {
    const yA = P.tierY(k), rise = (P.tierY(k + 1) - yA) / 3, rw = P.tierR(k) + P.HD, c0 = P.pos(rw, l.a), near = far(c0[0], yA + 2, c0[1]) < FLANK_NEAR;
    const gh = P.laneHalf / P.tierR(k) * rw, faces = [], tri0 = g.triangles; let arches = 0;
    // a face: R its circle, u0 to u1 metres along it, m the clear margins, foot/head/top(u) over the tier's floor
    // (foot: what stands before it; top: where its green hangs from), door: a door may stand, lv: the landings
    for (const sd of [-1, 1]) {
      const ua = l.a * rw + sd * 5.5, ub = l.a * rw + sd * gh;
      faces.push({ R: rw, u0: Math.min(ua, ub), u1: Math.max(ua, ub), m: sd < 0 ? [1.9, 0.8] : [0.8, 1.9], foot: () => 0, head: () => 3 * rise, top: () => 3 * rise - 0.14, door: true, lv: [rise, 2 * rise] });
    }
    for (let j = 1; j < 3; j++) {
      const ri = rw - (3 - j) * 2.2, half = 5.5 / (ri + 2.2), dir = (k % 2 ? 1 : -1) * (j % 2 ? -1 : 1), tOf = (u) => Math.max(0, Math.min(1, ((u / ri - l.a) / (dir * half) + 1) / 2));
      faces.push({ R: ri, u0: (l.a - half) * ri, u1: (l.a + half) * ri, m: [1.1, 1.1], foot: (u) => (j - tOf(u)) * rise, head: (u) => (j + tOf(u)) * rise, top: (u) => (j + (Math.min(4, Math.floor(tOf(u) * 5)) + 1) / 5) * rise + 0.9, door: false, lv: [j * rise] });
    }
    const things = [];
    for (const f of faces) arches += flankFace(g, P, pal, f, yA, near, flank, things);
    if (near) P.flank.push({ lane: li, tier: k, arches, tris: g.triangles - tri0, things });
  } });
}
// one face of a flank wall: its arches' things and its string courses. Wp(u, y, d): the place u metres along the
// face's circle, y over the tier's floor, d out from the wall toward the lake. The arches stand where the wall's
// paint draws them: a bay to every 6.4 m along the circle, hung 2.6 m under the head at the bay's middle, where
// that head is 5.2 m and more
function flankFace(g, P, pal, f, yA, near, flank, things) {
  const Wp = (u, y, d) => { const p = P.pos(f.R - d, u / f.R); return [p[0], yA + y, p[1]]; }, am = (f.u0 + f.u1) / 2 / f.R, nb = [-Math.sin(am), 0, Math.cos(am)];
  const F = (u0, u1, y0, y1, d) => g.quad(Wp(u0, y0, d), Wp(u1, y0, d), Wp(u1, y1, d), Wp(u0, y1, d), nb);
  const E = (u, y0, y1, d, s) => g.quad(Wp(u, y0, 0), Wp(u, y0, d), Wp(u, y1, d), Wp(u, y1, 0), [Math.cos(am) * s, 0, Math.sin(am) * s]);
  const T = (u0, u1, y, d, s) => g.quad(Wp(u0, y, 0), Wp(u1, y, 0), Wp(u1, y, d), Wp(u0, y, d), [0, s, 0]);
  const box = (u0, u1, y0, y1, d) => { F(u0, u1, y0, y1, d); E(u0, y0, y1, d, -1); E(u1, y0, y1, d, 1); T(u0, u1, y1, d, 1); T(u0, u1, y0, d, -1); };
  let n = 0; const rec = [];
  for (let b = Math.ceil(f.u0 / 6.4 - 0.5); (b + 0.5) * 6.4 < f.u1; b++) {
    const c = (b + 0.5) * 6.4, Hc = f.head(c), pick = flank(), grn = flank.chance(0.5), ln = [flank.range(1.2, 3), flank.range(1.2, 3), flank.range(1.2, 3)], sh = flank.pick(pal.shutter);
    if (Hc >= 5.2) rec.push([c, Hc - 2.6]);   // (a recess and its crown: a string course stops at it)
    if (!near || Hc < 5.2 || c < f.u0 + f.m[0] || c > f.u1 - f.m[1]) continue;
    // A DOOR OF TWO LEAVES 1.7 m wide and 2.5 m high on its step at the wall's foot, or A WINDOW 1.6 by 2 m with
    // two shutters on its sill (2.4 m over the tier's floor on the gap's wall; on a flight's wall 1.7 m over the
    // stair before it, so it is seen over that stair's parapet), under the arch's crown; else the arch stays bare
    const isDoor = f.door && pick < 0.6, hwd = isDoor ? 0.85 : 0.8, ht = isDoor ? 2.5 : 2;
    const lo = Math.min(f.foot(c - hwd - 0.3), f.foot(c + hwd + 0.3)), hi = Math.max(f.foot(c - hwd - 0.3), f.foot(c + hwd + 0.3)), y0 = isDoor ? hi + 0.16 : f.door ? 2.4 : hi + 1.7;
    if (y0 + ht + 0.35 > Hc - 2.6) continue;
    g.kind(KIND.STONE).col(pal.parapet).move(0);
    if (isDoor) box(c - hwd - 0.3, c + hwd + 0.3, lo, y0, 0.45); else box(c - hwd - 0.25, c + hwd + 0.25, y0 - 0.14, y0, 0.3);   // the step, or the sill
    box(c - hwd - 0.22, c - hwd, y0, y0 + ht, 0.22); box(c + hwd, c + hwd + 0.22, y0, y0 + ht, 0.22); box(c - hwd - 0.22, c + hwd + 0.22, y0 + ht, y0 + ht + 0.25, 0.22);
    g.kind(KIND.TIMBER).col(sh); F(c - hwd, c - 0.02, y0, y0 + ht, 0.03); F(c + 0.02, c + hwd, y0, y0 + ht, 0.03);
    if (grn) { g.kind(KIND.LEAF).col(mulc(pal.leaf[b & 1], 0.8)).move(1); ln.forEach((len, i) => { const ua = c - 1.5 + i, yt = f.top(ua + 0.5); F(ua, ua + 1, yt - len, yt, 0.06); }); g.move(0); }
    n++; things.push({ at: Wp(c, y0, 0), door: isDoor, grn });
  }
  // THE STRING COURSES, at each landing's height: from end to end of the face, stopped at every recess that
  // reaches that height (a course dies into an arch's jambs)
  if (near) for (const Y of f.lv) {
    const cut = [f.u0].concat(...rec.filter((r) => r[1] > Y).map((r) => [r[0] - 2.05, r[0] + 2.05]), [f.u1]);
    g.kind(KIND.STONE).col(pal.parapet).move(0);
    for (let i = 0; i < cut.length; i += 2) { const a = Math.max(f.u0, cut[i]), e = Math.min(f.u1, cut[i + 1]); if (e - a > 0.3) { F(a, e, Y - 0.14, Y + 0.14, 0.1); T(a, e, Y + 0.14, 0.1, 1); T(a, e, Y - 0.14, 0.1, -1); } }
  }
  return n;
}

// ---------------------------------------------------------------- the houses' layout (one deal, used for both cities)
// A house record: front-centre (x, z) at its base y0, yaw (its open front looks along local +z), width w of nb bays,
// floors of 3 m, depth of the rooms, limewash tint, and its distance from the flown line (for the level of detail,
// a standing figure of the place: the line is a thing of the world, not the lens).
export function layHouses(P, rng, pal, distToLine, keep = () => true) {
  const houses = [], tints = pal.lime;
  const lead = rng.int(0, tints.length - 1);
  // PALE STONE AND BONE LIMEWASH LEAD: three houses in four are bone or pale stone; the fourth takes the seed's
  // leading wash or another, faded half way to bone (the colour of the city is in its cloth, timber and lit rooms)
  const bone = tints[0], pale = tints[4];
  const tint = () => {
    const u = rng(), k = rng.range(0.9, 1.05);
    const c = u < 0.45 ? bone : u < 0.75 ? pale : mixc(rng.chance(0.5) ? tints[lead] : rng.pick(tints), bone, 0.5);
    return [c[0] * k, c[1] * k, c[2] * k];
  };
  // a house is a STONE GROUND STOREY (an arcade) and THREE TO FIVE VERANDAS over it (see stoneAt)
  // (four storeys or five, about half and half: the roofs stand 6 m or 3 m under the next street, whose wall and
  // balustrade are the level band; the roof line under the band rises and falls)
  // (round 3, A4) A VARIED SKYLINE WITHIN EACH TIER, so no tier is one ruled band: THREE TO SIX VERANDAS over the
  // stone storey (four storeys three times in ten, five about as often, six one time in four, seven one in
  // eight: a house of six or seven stands as high as the street behind it or a storey over it, and its hipped
  // roof breaks that street's level band). On the quay east of 14 degrees (under the rising street and the
  // promenade, whose view of the lake goes over these roofs) the houses keep four storeys or five; on the rest
  // of the quay none has more than six
  const floorsDeal = (k = 0, a = 1) => {
    const u = rng();
    if (k === 0 && a > 14 * D2R) return u < 0.55 ? 4 : 5;
    return u < 0.3 ? 4 : u < 0.62 ? 5 : u < 0.87 || k === 0 ? 6 : 7;
  };
  // see: 0 = by its distance from the line; 1 = a front the line never looks into (the stacks under and behind the
  // line: no near things); 2 = THE LOOK's subject, the west flank (the near things whatever its distance)
  const push = (x, z, yaw, y0, w, nb, floors, depth, kind, see = 0) => {
    const d = distToLine(x, y0 + floors * 1.5, z);
    houses.push({ x, z, yaw, y0, w, nb, floors, depth, kind, see, tint: tint(), d, lod: see === 2 ? 0 : d < 52 ? (see === 1 ? 1 : 0) : d < 110 ? 1 : 2, roof: rng(), chim: rng.chance(0.16) && kind !== 'flank', ph: rng(), mason: rng.chance(0.45) });
    order.push(houses[houses.length - 1]);
  };
  // (M4b 1) houses.order: every house dealt, in the deal's order, those the rule of the line takes among them
  // (marked gone): layRooms takes a gone house's draws and lays nothing for it
  const order = houses.order = [];
  // (ROUND 5 MENDING 5, L6) A HOUSE UNDER THE ONE RULE OF THE LINE: its wall may stand beside the line, its ROOF may
  // not lie close under it: asked at the ridge's height at the four corners and the middle of its plan. A house is
  // drawn first and asked after (the houses' stream runs the same whatever the line does). The flank stacks are
  // not asked: they carry the rim street, the line's own ground
  const roofFree = (h) => {
    const s = Math.sin(h.yaw), c = Math.cos(h.yaw), top = h.y0 + h.floors * P.FLOOR + 1.5;
    return [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1], [0, 0.5]].every(([fx, fz]) => keep('house', h.x + c * fx * h.w - s * fz * h.depth, top, h.z - s * fx * h.w - c * fz * h.depth, 0, 0));
  };
  // the tiers of the crescent. On the quay no tier house stands in the basin's sector (its two bastions and its
  // water); on every tier none stands in a stair lane's gap: the last house before a gap is fitted to its edge.
  const gardens = [];
  // (MENDING 6, M4b 4) THE GARDEN TERRACE'S LENGTH BY A PLACE: it runs from the east bastion to where the line's
  // plan crosses the quay houses' front line outward (found on that line's circle, east of the bastion, as the
  // place nearest the line at any height from the quay to 8 m over the rim), and one lot's width further (three
  // bays). P.gardenLen keeps it, in metres along the front line
  const rG = P.tierR(0); let aG = P.aBastE(), dG = Infinity;
  for (let a = P.aBastE(); a < P.aMax; a += 1 / rG) for (let y = P.DECK + 2; y < P.rimY + 8; y += 2) {
    const p = P.pos(rG, a), d = distToLine(p[0], y, p[1]); if (d < dG) { dG = d; aG = a; }
  }
  const gardenLen = P.gardenLen = (aG - P.aBastE()) * rG + 3 * P.bay;
  for (let k = 0; k < P.NT; k++) {
    // what no house may stand in on this tier: the stair lanes, and on the quay the inlet with its two bastions
    const r = P.tierR(k), cuts = P.lanes.map((l) => [l.a - P.laneHalf / r, l.a + P.laneHalf / r]);
    // (on the quay the first stretch east of the harbour is no row of houses but A GARDEN TERRACE at the water,
    // a pergola and trees: the harbour's east side, and what lies under the line as it leaves the harbour and
    // the shore: no quay house's roof stands close under the line there)
    // (the garden terrace is DEALT AS A GARDEN FROM THE START over its whole length: the quay's
    // lots begin at its far end, and no house is dealt there to be taken away after)
    if (P.tierR(k) < P.rHead - 0.5) cuts.push([P.aLaneW() - 1.2 / r, P.aBastE() + (k === 0 ? gardenLen : 0.1) / r]);
    if (k === 0) gardens.push({ k: 0, r, a0: P.aBastE() + 0.6 / r, a1: P.aBastE() + (gardenLen - 0.6) / r });
    cuts.sort((p, q) => p[0] - q[0]);
    let a = -P.aMax + 2 / r, prevH = null, open = true;
    while (a < P.aMax - 6 / r) {
      // FEWER AND LARGER HOUSES: two to four bays; one lot in ten above the quay is a terraced garden
      let nb = rng.chance(0.3) ? 2 : rng.chance(0.6) ? 3 : 4, bw = P.bay * rng.range(0.92, 1.1), w = nb * bw, fl = floorsDeal(k, a), kind = 'tier';
      // (round 3, A4: one house in five stands free of the next by 3 to 7.5 m, the tier's wall seen between them)
      const gap = rng.chance(0.2) ? rng.range(3, 7.5) : 0.12, garden = k > 0 && rng.chance(0.1), gw = rng.range(12, 19);
      // (L4: a tower of the plan stands ONCE: the narrow tower lot could end short of the plan's place, and the next
      // lot took the same tower again, two or three side by side)
      const tw = P.towers.find((t) => !t.stands && t.k === k && t.a >= a && t.a < a + ((garden ? Math.max(w, gw) : w) + gap) / r);
      // (a tower: an arcade, three verandas, a loggia of stone arches, three verandas, a loggia under the pointed roof)
      if (tw) { nb = 2; w = 2 * P.bay * 0.95; fl = 9; kind = 'tower'; } else if (garden) w = gw;
      const cut = cuts.find((c) => c[1] > a);
      let next = a + w / r + gap / r, fitted = false;
      if (cut && a >= cut[0]) { a = cut[1]; open = true; continue; }
      if (cut && a + w / r > cut[0] - 5 / r) {
        // fit the last lot to the cut's edge (a lot too narrow for two bays is left open)
        w = (cut[0] - a) * r; nb = Math.max(1, Math.round(w / P.bay)); next = cut[1]; fitted = true;
        if (kind === 'tower') { kind = 'tier'; fl = 4; }
      }
      const ac = a + (w / 2) / r, a1 = a + w / r;
      a = next;
      if (P.tiersAt(ac) <= k || P.tiersAt(a1) <= k || w < 2.8) { if (prevH) prevH.openR = true; open = true; continue; }
      if (garden && !fitted && kind !== 'tower') { gardens.push({ k, r, a0: ac - (w / 2) / r, a1 }); if (prevH) prevH.openR = true; open = true; continue; }
      const p = P.pos(r, ac);
      // (on the quay a house beside the rising street stands on the street's level at its lower end)
      const yH = k === 0 ? P.rampY(ac - (w / 2) / r) : P.tierY(k);
      push(p[0], p[1], -ac, yH, w, nb, fl, P.ROOMD, kind);
      // (L6: where the rule takes a house its lot is a garden terrace, as one lot in ten is anyway)
      if (!roofFree(houses[houses.length - 1])) {
        houses.pop().gone = true;
        if (yH < P.tierY(k) + 0.01) gardens.push({ k, r, a0: ac - (w / 2) / r, a1 });
        if (prevH) prevH.openR = true; open = true; continue;
      }
      if (yH > P.tierY(k) + 0.01) houses[houses.length - 1].back = P.tierY(1) - yH;
      if (kind === 'tower') tw.stands = true;
      if (kind === 'tower' && prevH) prevH.openR = true;
      prevH = houses[houses.length - 1]; prevH.openL = open || kind === 'tower'; open = gap > 2 || fitted || kind === 'tower';
      if (open) prevH.openR = true;
    }
    if (prevH) prevH.openR = true;
  }
  // (stage E: the back of each bastion's terrace, before the bastion wall, is a garden: a pergola and trees)
  for (const sd of [-1]) {
    const r = P.tierR(1) + 1, a0 = sd < 0 ? P.aLaneE() + 0.8 / r : P.aI + P.alpha + 1.2 / r, a1 = sd < 0 ? P.aI - P.alpha - 1.2 / r : P.aBastE() - 0.8 / r;
    gardens.push({ k: 1, r, a0, a1 });
  }
  houses.gardens = gardens;
  // the inlet's flanks: sheer stacks of RIMF verandas facing each other across the water, and two floors more
  // set back on the rim; the head closes the inlet with the same stack facing the bay
  const nbF = Math.round(P.inletD / (2 * P.bay * 1.0)), wF = P.inletD / nbF;
  for (let i = 0; i < nbF; i++) {
    const rc = P.RQ + (i + 0.5) * wF;
    for (const side of [-1, 1]) {
      // (round 3, B1: on the east side only the pier's stack stands, 6 m wide, its galleries turned round both
      // corners: toward the bay and toward the harbour's east water)
      if (side > 0 && i > 0) continue;
      const wS = side > 0 ? P.QW : wF, af = P.aI + side * P.alpha, p = P.pos(side > 0 ? P.RQ + wS / 2 : rc, af);
      // the west flank (side -1) looks toward +a, the east flank toward -a
      const yaw = Math.atan2(-side * Math.cos(af), -side * Math.sin(af));
      // (stage E: THE LOOK is from the mouth's bridge toward the head: both flanks are its wings, the near things on both)
      push(p[0], p[1], yaw, P.DECK, wS, 2, P.RIMF, P.ROOMD, 'flank', 2);
      // (the stack at the basin's mouth turns its gallery round the corner toward the bay)
      if (i === 0) { houses[houses.length - 1][side < 0 ? 'openL' : 'openR'] = true; }
      if (side > 0) houses[houses.length - 1].openL = houses[houses.length - 1].openR = true;
      // (round 2: no house stands on a bastion's top: it is an open terrace behind its balustrade)
    }
  }
  // each bastion's tip toward the bay: a veranda house on the outer part of the block
  for (const side of [-1, 1]) {
    const wT = P.FB / 293 * P.RQ - 5.3, at = P.aI + side * (P.alpha + (5.3 + wT / 2) / P.RQ), p = P.pos(P.RQ, at);
    push(p[0], p[1], -at, P.DECK, wT, 1, P.RIMF, 4.4, 'flank');
    houses[houses.length - 1][side < 0 ? 'openL' : 'openR'] = true;
  }
  // (round 3, B1) THE HARBOUR'S HEAD IS FOUR SEPARATE ROOFED HOUSES, no two alike (four, three, five and three
  // verandas over their arcades; 8.3, 6.4, 9 and 6.2 m wide), standing free on a low quay 5.5 m before the high
  // wall, with gaps between them (a tree, a stair, the wall's stone seen): [metres from the west flank, width,
  // storeys]. Kind 'harbour': a hipped roof, the near things whatever the distance
  // (B-i: gaps of 2.2 to 3.4 m; the fourth stands behind the east row's corner)
  P.headLots = [[2.2, 8.3, 5], [13.9, 6.4, 4], [22.5, 9.0, 6], [34.5, 6.2, 5]];
  for (const [s0, wH, fl] of P.headLots) {
    const ah = P.aI - P.alpha + (s0 + wH / 2) / P.rFront, p = P.pos(P.rFront, ah);
    push(p[0], p[1], -ah, P.DECK, wH, 2, fl, P.ROOMD, 'harbour', 2);
    houses[houses.length - 1].openL = houses[houses.length - 1].openR = true;
  }
  // (round 3, B-i) THE HARBOUR'S EAST SIDE IS A ROW OF HOUSES at the water, inland of the pier's stack, facing
  // west: [metres inland of the pier, width, storeys]. The line passes over the first (four storeys)
  P.eastLots = [[2.2, 6.0, 4], [10.6, 6.4, 6]];
  for (const [s0, wE, fl] of P.eastLots) {
    // (B-ii: the row stands back against the garden terrace's end, its arcade feet at the water: the harbour is
    // 4.7 m longer under the line, 36.7 m; the pier's stack stands out at its lake corner)
    const rE = P.rPier + s0 + wE / 2, aE = P.aBastE() - 5.6 / rE, p = P.pos(rE, aE);
    push(p[0], p[1], Math.atan2(-Math.cos(aE), -Math.sin(aE)), P.DECK, wE, 2, fl, P.ROOMD, 'harbour', 2);
    houses[houses.length - 1].openL = houses[houses.length - 1].openR = true;
  }
  // (round 2: the piazza and its stacks are gone; street 1 passes over the basin's head and the tiers stand behind)
  // THE ISLET'S GALLERY TOWER (the opening's great near thing): two towers of three bays back to back on a stone
  // islet in the bay, galleries on all four sides (each turns both its corners), no blank wall anywhere
  // (stage E: a second such tower, P.isle2, stands in the open lake off the east horn, before the fall's turn)
  for (const isl of [P.isle, P.isle2]) if (isl) for (const sg of [1, -1]) {
    const [ix, iz, nx, nz] = isl, wI = 3 * P.bay * 0.95;
    // (round 3, B5: six galleries over the arcade, no more: seven storeys under the pointed roof)
    // (mending 5, step 2: the first islet's house stands on a plinth 2 m over the plane; see makeQuay's islet)
    push(ix + nx * P.ROOMD * sg, iz + nz * P.ROOMD * sg, Math.atan2(nx * sg, nz * sg), isl === P.isle ? 2 : P.DECK, wI, 3, 5, P.ROOMD, 'tower', 2);
    const hI = houses[houses.length - 1];
    hI.openL = hI.openR = true; hI.back = 99;
  }
  // THE CAUSEWAY'S GATE HOUSES: on three of its piers a veranda house of two bays on each side of the street, out
  // over the water, its galleries turned round both corners (the two beside the jetty's ring carry the near things)
  for (const [gx, gz, nx, nz] of P.gates || []) {
    push(gx, gz, Math.atan2(nx, nz), P.rimY, 6, 2, rng.chance(0.5) ? 4 : 3, P.ROOMD, 'tier');
    const hG = houses[houses.length - 1];
    hG.openL = hG.openR = true; hG.verandasOnly = true;
  }
  // (round 3, B-i) the mole row's three houses before the causeway's lead, facing the harbour (see makeCauseway)
  for (const [mx, mz, nx, nz, wM, fl] of P.moleRow || []) {
    push(mx, mz, Math.atan2(nx, nz), P.DECK, wM, 2, fl, P.ROOMD, 'harbour', 2);
    houses[houses.length - 1].openL = houses[houses.length - 1].openR = true;
  }
  // (L6: the houses that stand free, the harbour's, the islets' and the gate houses, are asked of the same rule)
  for (let i = houses.length - 1; i >= 0; i--) { const h = houses[i]; if ((h.kind === 'harbour' || h.kind === 'tower' || h.verandasOnly) && h.openL && h.openR && !roofFree(h)) { h.gone = true; houses.splice(i, 1); } }
  return houses;
}

// ---------------------------------------------------------------- the houses' instances (rooms, rails, cloth, lamps, posts, sets)
// S = { rooms, cloth, lamps } named streams; opt = { density, night } from the visit's hints.
// THE HOUSE'S SHARE OF LIFE (L5): every house draws one share between these two, wherever it stands (see layRooms)
const LIFE_LO = 0.3, LIFE_HI = 0.9;
// Every list is laid once; the doubler lays each mesh made from it a second time under the plane.
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _s = new THREE.Matrix4();
// WHICH STOREYS ARE OF STONE: the ground storey of every house (an arcade), and in a sheer stack of more than seven
// storeys every fourth one, which is a RAILED STREET across the face (an arcade behind a stone balustrade): so no
// stack or tower shows more than three verandas one over another; a tier house has three to six over its arcade
// (round 3)
// (round 3, B6: a gate house on the causeway has NO stone storey: two round arches side by side on top of a pier
// read as a belfry stage; its verandas begin at the street)
export const stoneAt = (h, f) => f % 4 === 0 && !h.verandasOnly && (f === 0 || h.floors > 7);
// (round 5 mending 2, the book guard: NO BELL TOWER) THE CREST'S TALL HOUSE: in place of the stone shaft that rose
// out of the hall's roof, A VERANDA HOUSE GROWN TALL stands BESIDE the hall, 3.5 m past its end (the end is the
// hall's own place's figure), on a base of the bastions' stone 4 m over the hall's floor: six bays broad, NINE
// timber galleries floor over floor from its own street up (no stone storey, no arch), the galleries turned round
// both ends, under one low hipped roof of slate with deep eaves. It is laid by the houses' own makers (shell,
// rooms, rails, cloth) on the seed's own named stream 'crest', after every other house, so no other house is
// dealt anew
export function crestLot(P, hall) {
  const nt = P.tiersAt(hall.a), rF = P.tierR(nt) + 5, w = 6 * P.bay * 0.95, sd0 = Math.sin(hall.a * 57) > 0 ? 1 : -1;
  // (the end where the hill is as high as under the hall: the dealt end unless only the other is)
  const at = (s) => hall.a + s * (hall.half + (w / 2 + 3.5) / rF), ok = (s) => P.tiersAt(at(s)) === nt && P.tiersAt(at(s) + s * (w / 2) / rF) === nt;
  const sd = ok(sd0) || !ok(-sd0) ? sd0 : -sd0;
  return { nt, rF, w, sd, level: ok(sd), a: at(sd), yH: P.tierY(nt) + 5, y0: P.tierY(nt) + 9 };
}
export function crestHouse(P, hall, pal, distToLine) {
  // (five bays read as a pale slab with a flat top: SIX BAYS, its wall of gold timber boards
  // (a deeper honey than the hall's stone), its slate roof darker with eaves of 1.6 m: see makeShells)
  const c = crestLot(P, hall), p = P.pos(c.rF, c.a), tint = [0.74, 0.52, 0.27];
  return { x: p[0], z: p[1], yaw: -c.a, y0: c.y0, w: c.w, nb: 6, floors: 7, depth: P.ROOMD, kind: 'crest', see: 0, tint, d: distToLine(p[0], c.y0 + 13, p[1]), lod: 1, // (mending 4: seven galleries, not nine: the city's tallest house, not a tower block)
    roof: 0.2, chim: false, ph: 0.37, mason: false, openL: true, openR: true, verandasOnly: true, back: 0, own: true };
}
export function houseMatrix(h) {
  const m = new THREE.Matrix4().makeTranslation(h.x, h.y0, h.z).multiply(_r.makeRotationY(h.yaw));
  return m;
}
// (round 5, D2: the second longest build step, 22 to 30 ms: it rests after every 60 houses when opt.rest is given)
export async function layRooms(P, houses, S, pal, opt) {
  let nLaid = 0;
  const L = { rooms: [], roomsF: [], roomsL: [], roomsR: [], rails: [], curtN: [], curtF: [], lamps: [], posts: [], sets: [[], [], [], [], [], [], []], toprail: [], stats: { lit: 0, cloth: 0 } };
  const place = (M, x, y, z, sx, sy, sz) => new THREE.Matrix4().copy(M).multiply(_t.makeTranslation(x, y, z)).multiply(_s.makeScale(sx, sy, sz));
  for (const h of (opt.own ? houses : houses.order || houses)) {   // (M4b 1: houses.order holds the ruled lots too)
    if (!h.own !== !opt.own) continue;   // (round 5 mending 2: the crest's tall house is laid in a call of its own)
    if (opt.rest && ++nLaid % 60 === 0) await opt.rest();
    const M = houseMatrix(h), per = h.lod === 2 ? 1 : h.nb, bw = h.w / per;
    // (round 4, D1: THE NEAREST BALUSTERS KEEP THE STONE TONE: on a house near the line a rail of masonry is the
    // parapets' stone with a tenth of the house's tint, never red or green; far off it is the house's own tint)
    const wall = mixc(h.tint, [0.62, 0.5, 0.4], 0.22), railC = h.mason || h.kind === 'tower' ? (h.lod === 0 ? mixc(pal.parapet, h.tint, 0.1) : mulc(h.tint, 1.04)) : pal.timber, railW = 0; // (the islet towers' rails are of pale stone: the shaded tower the arc passes is not a dark stack) // (every rail is of turned balusters)
    // (ROUND 5 MENDING 5, L5) ONE LAW OF LIFE FOR EVERY HOUSE WHEREVER IT STANDS: each house draws ONE share of its
    // own, LIFE_LO to LIFE_HI (stream cloth). That share of its bays carries cloth (times the visit's density),
    // that share of its arcade's arches a worn curtain, and by day half that share of its rooms a lamp left
    // burning. No house has more for standing by the line, beside the rising street, in the harbour or on an islet
    const life = S.cloth.range(LIFE_LO, LIFE_HI), clothP = life * Math.min(1.25, opt.density + 0.1);
    const nearC = (y) => h.lod === 0 && (h.see === 2 || opt.distToLine(M.elements[12], M.elements[13] + y, M.elements[14]) < 40);
    // (ROUND 5 MENDING 6, M4b 1) EVERY BAY DRAWS, WHATEVER THE HOUSE'S PLAINNESS: the three streams (lamps, rooms,
    // cloth) run the same wherever the line lies. bayDraws takes one bay's draws in the bays' own order and lays
    // nothing: a plainest house lays its one broad room by its first bay's draws and takes the other bays' so;
    // a lot whose house the rule of the line took (h.gone) takes every draw its house would have taken
    const bayDraws = () => {
      if (S.lamps.chance(opt.night > 0.5 ? 0.78 : 0.5 * life * opt.density)) S.lamps.range(0.7, 1.15);
      S.rooms(); S.rooms();
      const u = S.cloth(); S.cloth(); S.cloth(); S.cloth.pick(pal.cloth); S.cloth.chance(0.4);
      if (u < clothP) { S.cloth.range(0.7, 1.15); S.cloth.range(2.1, 2.55); if (u >= 0.43 * clothP) S.cloth.chance(0.5); }
    };
    if (h.gone) { for (let f = 0; f < h.floors; f++) for (let b = 0; b < h.nb; b++) { if (stoneAt(h, f)) S.cloth(); else bayDraws(); } continue; }
    for (let f = 0; f < h.floors; f++) {
      const yb = f * P.FLOOR + 0.14;
      if (stoneAt(h, f)) {
        // a storey of stone: one shaded walk behind the arcade (the shell cuts the arches); where it is a street
        // across a stack's face, a stone balustrade stands at its edge
        const rh = P.FLOOR - 0.3, sc = mixc(pal.bastion, [0.62, 0.5, 0.4], 0.12);
        (h.lod === 2 ? L.roomsF : L.rooms).push({ m: place(M, 0, yb + rh / 2, -h.depth / 2 - 0.02, h.w - 0.1, rh, h.depth), a: [0.5, 0, 0.5, 0], c: sc });
        if (f > 0) L.rails.push({ m: place(M, 0, yb, 0.06, h.w, 0.98, 1), a: [0.5, 0, 0.5, 0], c: pal.parapet });
        // (stage F) THE ARCADES' CURTAINS: in the house's share of its arches a plain curtain of worn cloth hangs
        // behind the stone, drawn half across to one side; it stirs like every other cloth (L5: on every house)
        for (let b = 0; b < h.nb; b++) {
          const bwS = h.w / h.nb, aR = Math.min(bwS / 2 - 0.42, 1.7), k = b * 7 + Math.round(h.ph * 97), cw = aR * 1.15, sd = k % 2 ? 1 : -1;
          if (S.cloth() >= clothP) continue;
          (nearC(yb) ? L.curtN : L.curtF).push({ m: place(M, -h.w / 2 + (b + 0.5) * bwS + sd * (aR - cw / 2), yb + 2.56, -0.5, cw, 2.32, 1), a: [(k * 0.37) % 1, 0, (k * 0.61) % 1, 0], c: mixc([0.72, 0.66, 0.55], pal.cloth[(k >> 1) % 5], 0.16) }); // (the guard: red shapes behind the near rail at the rising street's foot: these curtains are of the stone's tone, a sixth of their dye left)
          L.stats.cloth++;
        }
        continue;
      }
      let c1 = null, c2 = null;
      for (let b = 0; b < per; b++) {
        const xb = -h.w / 2 + (b + 0.5) * bw, rw = bw - 0.34, rh = P.FLOOR - 0.3;
        const pLit = opt.night > 0.5 ? 0.78 : 0.5 * life * opt.density;
        let lit = S.lamps.chance(pLit) ? S.lamps.range(0.7, 1.15) : 0;
        const ph = S.rooms(), vr = S.rooms();
        // (round 5 mending 2, step 2, the guard: THE TALL HOUSE ON THE CREST HAS A FEW LIT ROOMS, by its rooms' own
        // figures: about one in six, at any hour; the deal above would light nine in ten of them by night)
        if (h.own) lit = vr > 0.84 ? 0.75 + 0.4 * ph : 0;
        // AN ENFILADE: on the quay houses' first veranda, near the line, one bay in seven is three rooms deep (7.6 m,
        // within the house's own depth): two partitions with open doors, a runner through them, a lamp left burning
        const enf = h.kind === 'tier' && f === 1 && h.lod === 0 && h.d < 30 && h.y0 < P.tierY(1) - 1 && vr > 0.86, dz = enf ? 7.6 : h.depth;
        if (enf) lit = 1.1;
        if (lit > 0) L.stats.lit++;
        // far off a room takes more of its house's wash (the fronts read as blocks of colour, not as dark cells)
        // (round 5, A3: the room's fourth figure is its HOUSE's own, 0.05 to 0.45: the shutters' tone of the whole
        // house is read from it; a stone storey's walk has 0)
        const room = { m: place(M, xb, yb + rh / 2, -dz / 2, enf ? rw : bw - 0.012, rh, dz), a: [ph, lit, vr, enf ? 0.48 : 0.05 + 0.4 * h.ph], c: enf ? wall : h.tint };
        // (round 5, A3: a room carries its HOUSE'S OWN WASH, near and far alike: the wall behind the gallery is
        // painted in it; the shader warms and deepens it a little for the room's inner faces)
        // a house that stands free on a side has its end room open there, and the rail goes round the corner
        const oL = b === 0 && h.openL, oR = b === per - 1 && h.openR && !oL;
        (oL ? L.roomsL : oR ? L.roomsR : h.lod === 2 ? L.roomsF : L.rooms).push(room);
        L.rails.push({ m: place(M, xb, yb, -0.07, rw, 0.98, 1), a: [ph, 0, vr, railW], c: railC });
        if (oL || oR) {
          const sx = oL ? -1 : 1, ms = new THREE.Matrix4().copy(M).multiply(_t.makeTranslation(sx * (h.w / 2 - 0.1), yb, -dz / 2)).multiply(_r.makeRotationY(sx * Math.PI / 2)).multiply(_s.makeScale(dz, 0.98, 1));
          L.rails.push({ m: ms, a: [ph, 0, vr, railW], c: railC });
        }
        // cloth: a long thin curtain at one edge, or a half rolled blind across the bay (each on its own phase)
        const u = S.cloth(), cph = S.cloth(), cvr = S.cloth(), cc0 = S.cloth.pick(pal.cloth), hemBand = S.cloth.chance(0.4) ? 1 : 0;
        // (round 4, D1) NO FLAG ON A GALLERY: a pale cloth never hangs between a blue and a red one on a floor:
        // where the deal would close such a three the third cloth is olive (no draw is added)
        const hung = u < clothP, R = pal.cloth[1], B = pal.cloth[5];
        const cc = hung && c1 && c2 && c1[2] > 0.3 && ((cc0 === R && c2 === B) || (cc0 === B && c2 === R)) ? pal.cloth[6] : cc0;
        c2 = c1; c1 = hung ? cc : null;
        if (hung) {
          const blind = u < 0.43 * clothP, cw = blind ? rw * S.cloth.range(0.55, 0.92) : S.cloth.range(0.7, 1.15);
          const ch = blind ? S.cloth.range(0.7, 1.5) : S.cloth.range(2.1, 2.55);
          const cx = blind ? xb : xb + (S.cloth.chance(0.5) ? -1 : 1) * (rw / 2 - cw / 2 - 0.05);
          (nearC(yb) ? L.curtN : L.curtF).push({ m: place(M, cx, yb + rh - 0.04, -0.2, cw, ch, 1), a: [cph, 0, cvr, hemBand], c: cc });
          L.stats.cloth++;
        }
        // the near things are laid by each room's own distance from the flown line (a standing figure of the place)
        // (round 5 mending 2, step 2: the crest house stands 135 m and more from the line and had none of them: it
        // takes what the near houses' galleries have, the rail's top, the hanging lamp, the room's things, a cloth
        // over a bare rail, as at 20 m; and its posts below)
        const mr = room.m.elements, dr = h.see === 2 ? 0 : h.own ? 20 : h.lod === 0 ? opt.distToLine(mr[12], mr[13], mr[14]) : 999;
        // (round 5, A1) A CLOTH OVER THE RAIL: near the line, on one bare bay in five, a cloth of linen or olive
        // lies over the rail and hangs half a metre down its face (by the bay's own figures: no stream is drawn)
        // (clear air: such a cloth may not stir within arm's reach of the line: none within 9 m of it)
        if (dr > 9 && dr < 42 && !hung && cvr > 0.6 && !enf) {
          L.curtN.push({ m: place(M, xb + (cph - 0.5) * (rw - 1.2), yb + 1.0, 0.0, 0.7 + 0.5 * cph, 0.5 + 0.2 * cvr, 1), a: [cph, 0, cvr, 0], c: cph < 0.5 ? pal.cloth[6] : [0.86, 0.84, 0.78] });
          L.stats.cloth++;
        }
        if (dr < 42) {
          L.toprail.push({ m: place(M, xb, yb + 0.98, -0.07, rw, 1, 1), a: [0, 0, 0, 0], c: railC });
          // (round 5, A1: the lamp hangs under the gallery's ceiling, before the house's wall)
          if (dr < 31) L.lamps.push({ m: place(M, xb + (vr - 0.5) * 0.5, yb + rh, enf ? -1.7 - ph * 0.8 : -0.8 - ph * 0.6, 1, 1, 1), a: [ph, lit, vr, 0], c: [1, 0.78, 0.45] });
          if (enf || dr < 24) L.sets[enf ? 6 : Math.floor(vr * 5.999)].push({ m: place(M, xb, yb, -h.depth / 2, Math.min(1, rw / 3.3) * (ph < 0.5 ? 1 : -1), 1, 1), a: [ph, lit, vr, 2], c: pal.cloth[Math.floor(ph * 4.999)] });
        }
      }
      for (let b = per; b < h.nb; b++) bayDraws();
      // (the tall house at the quay's start read as a glass box from the arc's end: its upper floors, 30 m
      // and more from the line, had no posts, and its open end had rails but no post. Posts now stand on every
      // floor within 44 m of the line, and an open end has a post at its middle and at its back corner)
      const nearP = h.own || (h.lod === 0 && (h.see === 2 || opt.distToLine(M.elements[12], M.elements[13] + yb + 1.4, M.elements[14]) < 44));
      if (nearP) for (const sx of [h.openL ? -1 : 0, h.openR ? 1 : 0]) if (sx) for (const t of [0.5, 1]) L.posts.push({ m: place(M, sx * (h.w / 2 - 0.1), yb - 0.14, -h.depth * t + 0.1, 1, P.FLOOR, 1), a: [0, 0, 0, 0], c: pal.timber });
      if (nearP) for (let b = 0; b <= per; b++) L.posts.push({ m: place(M, Math.max(-h.w / 2 + 0.2, Math.min(h.w / 2 - 0.2, -h.w / 2 + b * bw)), yb - 0.14, P.PROUD, 1, P.FLOOR, 1), a: [0, 0, 0, 0], c: pal.timber });
    }
  }
  return L;
}

// ---------------------------------------------------------------- the houses' shells (one merged mesh): side walls, paired
// posts, floor edges and eaves, the arcades of stone, low hipped roofs, a chimney on a few; the flank stacks carry the rim street and its parapet instead of a roof
// (round 5, D2) THE LONGEST BUILD STEP WAS THIS ONE (36 to 62 ms by measure): it rests after every 40 houses
export async function makeShells(P, houses, pal, rest = null, keep = () => true) {
  const g = makeGeo(), chimneys = [];
  let nShell = 0;
  for (const h of houses) {
    if (rest && ++nShell % 40 === 0) await rest();
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw), H = h.floors * P.FLOOR, w2 = h.w / 2;
    const stack = h.kind === 'flank' || h.kind === 'back' || h.kind === 'side';
    const D = h.kind === 'tier' ? P.HD : h.kind === 'back' ? P.ROOMD : stack ? 5.5 : h.depth + 0.3, per = h.lod === 2 ? 1 : h.nb, bw = h.w / per;
    const W = (x, y, z) => [h.x + x * c + z * s, h.y0 + y, h.z - x * s + z * c];
    const Nv = (x, y, z) => [x * c + z * s, y, -x * s + z * c];
    const face = (a, b, cc, d, n) => g.quad(W(a[0], a[1], a[2]), W(b[0], b[1], b[2]), W(cc[0], cc[1], cc[2]), W(d[0], d[1], d[2]), Nv(n[0], n[1], n[2]));
    const trim = h.roof < 0.35 ? pal.timber : mulc(h.tint, 1.07);
    // (round 3, A4) THE ROOFS ARE SEEN AND QUIET: weathered tile (the tile half way to a grey buff), slate-grey, or
    // slate gone to lichen (a grey green-gold), each a little lighter or darker by the house
    // (round 4, A4: TILE-RED AND COPPER-GREEN ROOFS AMONG THE SLATE: two roofs in five are a plain tile red (they
    // were a brown tile), one in seven is verdigris copper, one in eight mossy slate, the rest slate)
    // (round 5, B3: SLATE, BLUE-GREEN AND TIMBER BROWN LEAD; RED TILE IS THE EXCEPTION: of ten roofs four are
    // slate, two and a half a blue-green (old copper, slate gone green), two a timber brown (shingles), one mossy
    // slate, and one in fourteen a plain tile red)
    // (the lead's eye from the west terrace: the harbour's roofs were loud, orange-red, bright blue, teal. EVERY
    // ROOF IS QUIET: its colour is drawn a third of the way to its own grey and a tenth darker (the tile red half
    // way: a dull brick), so slate is grey-blue, the blue-green a grey sea green, the shingles a grey brown)
    const quiet = (c, k) => { const l = 0.3 * c[0] + 0.5 * c[1] + 0.2 * c[2]; return mulc(mixc(c, [l, l, l * 1.03], k), 0.9); };
    // (the lead's eye from the west terrace: the harbour's roofs, seen from above, were loud: a red, a
    // bright blue, a teal, an olive.) THE HARBOUR'S ROOFS ARE SLATE, BLUE-GREEN AND TIMBER BROWN ONLY, half greyed
    // and an eighth darker: no red tile and no moss there (its houses' own figure picks among the three)
    const hbR = h.kind === 'harbour', rf = hbR ? (h.roof < 0.5 ? 0.3 : h.roof < 0.78 ? 0.7 : 0.9) : h.roof;
    // (round 5 mending 2, step 2, the guard: by night the harbour's roofs ran into one tone: the three differed by
    // hue alone, which the moon takes away. They differ BY DEPTH too: the slate a fifth paler, the blue-green a
    // quarter deeper, the shingles between; by day the same three quiet tones, a step further apart)
    // (ROUND 5 MENDING 4: mending 2's figures were the wrong way about: the blue-green is the palest of the three by
    // nature, and a quarter deeper it came out as deep as the slate, so the roofs ran together all the more. By
    // their own lightness, 0.14, 0.22 and 0.21: the slate a fifth deeper (0.12), the blue-green a fifth paler
    // (0.26), the shingles as they are (0.19): two tones and a middle one, by night as by day)
    const roofC = h.own ? mulc(pal.slate, 0.8) : hbR ? mulc(quiet(roofC0(), 0.5), h.roof < 0.5 ? 0.8 : h.roof < 0.78 ? 1.2 : 0.9) : quiet(roofC0(), rf < 0.07 ? 0.5 : 0.34);
    function roofC0() { return rf < 0.07 ? mulc(mixc(pal.tile, [0.48, 0.085, 0.04], 0.6), 0.88 + 0.26 * h.ph)
      : rf < 0.47 ? mulc(pal.slate, 0.95 + 0.3 * h.ph)
        : rf < 0.57 ? mulc(mixc(pal.slate, [0.27, 0.28, 0.12], 0.55), 0.9 + 0.24 * h.ph)
          : rf < 0.8 ? mulc(mixc(pal.slate, [0.1, 0.33, 0.3], 0.68), 0.92 + 0.2 * h.ph) : mulc([0.3, 0.19, 0.11], 0.85 + 0.3 * h.ph); }
    // side walls
    // A FLANK IS NEVER A TALL BLANK WALL: where the next house hides it, a plain wall; where the house stands free,
    // THE GALLERY'S RETURN: the stone storey, then open rooms behind a rail (laid with the rooms), a string course
    // and an eave to each floor, a pair of posts at the rooms' back, a stone pier behind them
    for (const sg of [-1, 1]) {
      const x = sg * w2, free = sg < 0 ? h.openL : h.openR, RD = h.depth;
      if (!free) {
        // (the guard: where the line leaves the shore a quay house's closed end stood under the lens as
        // a grey wall with a block of green.) A QUAY HOUSE'S CLOSED END IS OF THE BASTIONS' STONE (a quarter of the
        // house's wash in it), with its courses, door and lamp; of the three green panels one low one is left
        const qEnd = h.kind === 'tier' && h.y0 <= P.DECK + 0.1;
        g.kind(qEnd ? KIND.STONE : KIND.LIME).col(qEnd ? mixc(pal.bastion, h.tint, 0.25) : h.tint); face([x, 0, 0], [x, 0, -D], [x, H, -D], [x, H, 0], [sg, 0, 0]);
        // (round 3, C3) ON THE QUAY NO CREAM WALL IS PLAIN: a stone pier at its front with an impost, a string
        // course at every floor, a door in a stone surround with a step, a niche with a lamp over it, and green
        // climbing its back half
        if (h.kind !== 'tier' || h.y0 > P.DECK + 0.1) continue;
        const xo = x + sg * 0.035, F = (z0, z1, y0, y1, d = 0) => face([xo + sg * d, y0, z0], [xo + sg * d, y0, z1], [xo + sg * d, y1, z1], [xo + sg * d, y1, z0], [sg, 0, 0]);
        g.kind(KIND.STONE).col(pal.bastion); F(0, -0.55, 0, H); F(0.04, -0.63, P.FLOOR - 0.22, P.FLOOR, 0.03);
        for (let f = 1; f < h.floors; f++) F(-0.55, -D, f * P.FLOOR - 0.1, f * P.FLOOR + 0.08);
        g.col(pal.parapet); F(-1.5, -2.7, 0, 2.3, 0.01);
        face([xo, 0.16, -1.4], [xo, 0.16, -2.8], [xo + sg * 0.34, 0.16, -2.8], [xo + sg * 0.34, 0.16, -1.4], [0, 1, 0]);
        face([xo + sg * 0.34, 0, -1.4], [xo + sg * 0.34, 0, -2.8], [xo + sg * 0.34, 0.16, -2.8], [xo + sg * 0.34, 0.16, -1.4], [sg, 0, 0]);
        g.kind(KIND.TIMBER).col(pal.shutter[Math.floor(h.ph * 97) % pal.shutter.length]); F(-1.65, -2.55, 0.16, 2.15, 0.03);
        g.kind(KIND.ROOM).col(mulc(h.tint, 0.4)); F(-1.85, -2.35, 2.75, 3.5, 0.01);
        const lp = W(xo + sg * 0.06, 2.95, -2.1);
        g.kind(KIND.LAMP).col([3.2, 2.4, 1.3]).move(1).box(lp[0] - 0.09, lp[1], lp[2] - 0.09, lp[0] + 0.09, lp[1] + 0.26, lp[2] + 0.09, 'y').move(0);
        g.kind(KIND.LEAF).col(mulc(pal.leaf[0], 0.8 + 0.3 * h.ph));
        F(-3.6, -6.2, 0, 2.2 + 1.4 * h.ph, 0.05);
        continue;
      }
      g.kind(KIND.STONE).col(pal.bastion);
      face([x, 0, 0], [x, 0, -D], [x, P.FLOOR, -D], [x, P.FLOOR, 0], [sg, 0, 0]);
      if (D > RD + 0.1) face([x, P.FLOOR, -RD], [x, P.FLOOR, -D], [x, H, -D], [x, H, -RD], [sg, 0, 0]);
      const xe = x + sg * P.EAVE, xp = x + sg * (P.PROUD - 0.01);
      for (let f = 1; f <= h.floors; f++) {
        const yF = f * P.FLOOR;
        g.kind(KIND.STONE).col(pal.bastion);
        face([x + sg * 0.02, yF - 0.16, 0.02], [x + sg * 0.02, yF - 0.16, -RD], [x + sg * 0.02, Math.min(H, yF + 0.14), -RD], [x + sg * 0.02, Math.min(H, yF + 0.14), 0.02], [sg, 0, 0]);
        // (round 4, C1) THE HARBOUR'S HOUSES ARE NO PAGODAS: seen from above, the shallow eave at every deck stood
        // out as a skirt in the roof's colour, floor after floor. A harbour house has none, at its sides or its
        // front: its decks are flush, floor over floor of one width, under one plain low roof
        // (the pier's stack and the west flank's stacks stand in the harbour too: none there either)
        if (f === 1 || (f === h.floors && !stack) || h.kind === 'harbour' || h.kind === 'flank') continue;
        g.kind(KIND.SLATE).col(roofC);
        g.quad(W(xe, yF - 0.2, P.EAVE), W(xe, yF - 0.2, -RD), W(x, yF + 0.02, -RD), W(x, yF + 0.02, P.EAVE), Nv(sg * 0.355, 0.935, 0), [0, 0, 1, 0, 1, 0.34, 0, 0.34]);
        g.kind(KIND.TIMBER).col(pal.timber);
        face([xe, yF - 0.27, P.EAVE], [xe, yF - 0.27, -RD], [xe, yF - 0.2, -RD], [xe, yF - 0.2, P.EAVE], [sg, 0, 0]);
      }
      g.kind(KIND.TIMBER).col(pal.timber);
      for (const pz2 of [-RD + 0.1, -RD + 0.34, -RD / 2 - 0.12, -RD / 2 + 0.12]) face([xp, P.FLOOR, pz2 - 0.035], [xp, P.FLOOR, pz2 + 0.035], [xp, H - 0.2, pz2 + 0.035], [xp, H - 0.2, pz2 - 0.035], [sg, 0, 0]);
    }
    const bk = h.back === undefined ? P.TR : Math.max(0, h.back);
    if (H > bk + 0.1 && !stack) { g.kind(KIND.LIME).col(h.tint); face([w2, bk, -D], [-w2, bk, -D], [-w2, H, -D], [w2, H, -D], [0, 0, -1]); }
    // THE GALLERY'S TIMBERS. Slender PAIRED POSTS stand proud of the floors' edge at every bay line, through each run
    // of verandas (far off they are these two thin faces; near the line the instanced posts stand round them)
    const pz = P.PROUD - 0.01;
    for (let f = 0; f < h.floors; f++) {
      if (stoneAt(h, f) || (f > 0 && !stoneAt(h, f - 1))) continue;
      let f1 = f + 1; while (f1 < h.floors && !stoneAt(h, f1)) f1++;
      g.kind(KIND.TIMBER).col(pal.timber);
      for (let b = 0; b <= h.nb; b++) {
        const x = Math.max(-w2 + 0.2, Math.min(w2 - 0.2, -w2 + b * h.w / h.nb));
        for (const px of [-0.12, 0.12]) face([x + px - 0.035, f * P.FLOOR, pz], [x + px + 0.035, f * P.FLOOR, pz], [x + px + 0.035, f1 * P.FLOOR - 0.2, pz], [x + px - 0.035, f1 * P.FLOOR - 0.2, pz], [0, 0, 1]);
      }
    }
    // each floor's edge, and A SHALLOW EAVE over every veranda (tile or slate on a timber edge, its underside in shade)
    for (let f = 0; f <= h.floors; f++) {
      const y0 = Math.max(0, f * P.FLOOR - 0.16), y1 = Math.min(H, f * P.FLOOR + 0.14), yF = f * P.FLOOR, E = P.EAVE;
      const stoneEdge = f < h.floors && stoneAt(h, f) || (f > 0 && stoneAt(h, f - 1));
      g.kind(stoneEdge ? KIND.STONE : h.roof < 0.35 ? KIND.TIMBER : KIND.LIME).col(stoneEdge ? pal.bastion : trim);
      face([-w2, y0, 0.02], [w2, y0, 0.02], [w2, y1, 0.02], [-w2, y1, 0.02], [0, 0, 1]);
      if (f === 0 || stoneAt(h, f - 1) || (f === h.floors && !stack) || h.kind === 'harbour' || h.kind === 'flank') continue;
      g.kind(KIND.SLATE).col(roofC);
      g.quad(W(-w2, yF - 0.2, E), W(w2, yF - 0.2, E), W(w2, yF + 0.02, 0.02), W(-w2, yF + 0.02, 0.02), Nv(0, 0.935, 0.355), [0, 0, 1, 0, 1, 0.34, 0, 0.34]);
      g.kind(KIND.TIMBER).col(pal.timber);
      face([-w2, yF - 0.27, E], [w2, yF - 0.27, E], [w2, yF - 0.2, E], [-w2, yF - 0.2, E], [0, 0, 1]);
      if (h.lod < 2) g.col(mulc(pal.timber, 0.8)).quad(W(-w2, yF - 0.16, 0.02), W(w2, yF - 0.16, 0.02), W(w2, yF - 0.27, E), W(-w2, yF - 0.27, E), Nv(0, -1, 0));
    }
    // THE STOREYS OF STONE: an arcade, one round arch to a bay on piers 0.84 m wide. Near the line the arches are
    // built with their reveals; further off one panel stands there and the shader cuts the arches out of it
    // (kind ARCADE: u counts the bays, v is metres up the storey, the vertex's second figure is the bay's width)
    const sc = mulc(pal.bastion, 0.94 + 0.1 * h.ph), bwS = h.w / h.nb, aR = Math.min(bwS / 2 - 0.42, 1.7), sp = 2.5 - aR, dp = 0.45;
    for (let f = 0; f < h.floors; f++) {
      if (!stoneAt(h, f)) continue;
      const yb = f * P.FLOOR;
      if (h.lod > 0 || h.d > 27) {
        g.kind(KIND.ARCADE).col(sc).move(bwS);
        g.quad(W(-w2, yb, 0.01), W(w2, yb, 0.01), W(w2, yb + 3, 0.01), W(-w2, yb + 3, 0.01), Nv(0, 0, 1), [0, 0, h.nb, 0, h.nb, 3, 0, 3]);
        g.move(0);
        continue;
      }
      for (let b = 0; b < h.nb; b++) {
        const xc = -w2 + (b + 0.5) * bwS, xl = xc - bwS / 2, xr = xc + bwS / 2;
        g.kind(KIND.STONE).col(sc);
        face([xl, yb, 0.01], [xc - aR, yb, 0.01], [xc - aR, yb + 3, 0.01], [xl, yb + 3, 0.01], [0, 0, 1]);
        face([xc + aR, yb, 0.01], [xr, yb, 0.01], [xr, yb + 3, 0.01], [xc + aR, yb + 3, 0.01], [0, 0, 1]);
        for (let i = 0; i < 5; i++) {
          const t0 = Math.PI * i / 5, t1 = Math.PI * (i + 1) / 5, m = (t0 + t1) / 2;
          const s0 = xc - aR * Math.cos(t0), s1 = xc - aR * Math.cos(t1), u0 = yb + sp + aR * Math.sin(t0), u1 = yb + sp + aR * Math.sin(t1);
          g.col(sc);
          face([s0, u0, 0.01], [s1, u1, 0.01], [s1, yb + 3, 0.01], [s0, yb + 3, 0.01], [0, 0, 1]);
          g.col(mulc(sc, 0.74));
          face([s0, u0, 0.01], [s0, u0, -dp], [s1, u1, -dp], [s1, u1, 0.01], [Math.cos(m), -Math.sin(m), 0]);
        }
        g.col(mulc(sc, 0.8));
        face([xc - aR, yb, 0.01], [xc - aR, yb, -dp], [xc - aR, yb + sp, -dp], [xc - aR, yb + sp, 0.01], [1, 0, 0]);
        face([xc + aR, yb, -dp], [xc + aR, yb, 0.01], [xc + aR, yb + sp, 0.01], [xc + aR, yb + sp, -dp], [-1, 0, 0]);
        // (stage F) GREEN HANGS from the veranda's edge over three piers in four of the arcades beside the rising
        // street: a swag of leaves 1.3 to 1.9 m long, broad above and narrow below (its leaves stir by the clock)
        const kv = b + Math.round(h.ph * 53);
        // (none on a house within 9 m of the line: there a swag stood flat and green hard by the lens)
        if (h.d > 9 && h.d < 26 && kv % 4 !== 1 && Math.atan2(h.x, -h.z) > P.rampA0 - 0.05 && Math.atan2(h.x, -h.z) < P.rampA1 + 0.012) {
          const len = 1.3 + 0.2 * (kv % 4), wt = 0.75 + 0.07 * (kv % 3);
          g.kind(KIND.LEAF).col(mulc(pal.leaf[(kv >> 1) % 2], 0.78)).move(1);
          face([xr - 0.28, yb + 3 - len, 0.09], [xr + 0.28, yb + 3 - len, 0.09], [xr + wt, yb + 3.02, 0.09], [xr - wt, yb + 3.02, 0.09], [0, 0.2, 0.98]);
          g.move(0);
        }
      }
    }
    if (stack) {
      // the rim street on the stack's top and its parapet at the inlet's edge
      g.kind(KIND.PAVE).col(pal.pave);
      face([-w2, H, 0], [w2, H, 0], [w2, H, -D], [-w2, H, -D], [0, 1, 0]);
      // (round 4, C2: STONE-TONED, NOT A WHITE BAND: the coping and the balusters a fifth deeper than the parapets)
      // (three tenths deeper: seen from the west terrace the low band was pale cream)
      g.kind(KIND.STONE).col(mulc(pal.parapet, 0.7));
      // (a balustrade: a string course, turned stone balusters, a coping)
      face([-w2, H - 0.3, 0.03], [w2, H - 0.3, 0.03], [w2, H, 0.03], [-w2, H, 0.03], [0, 0, 1]);
      // (the stack at the basin's mouth leaves its rim open for 4.8 m where the mouth's bridge comes onto it)
      const xa = -w2 + (h.cutRail === -1 ? 4.8 : 0), xb = w2 - (h.cutRail === 1 ? 4.8 : 0);
      face([xa, H + 1.1, 0.03], [xb, H + 1.1, 0.03], [xb, H + 1.1, -0.2], [xa, H + 1.1, -0.2], [0, 1, 0]);
      g.kind(KIND.RAIL);
      face([xa, H, 0.03], [xb, H, 0.03], [xb, H + 1.1, 0.03], [xa, H + 1.1, 0.03], [0, 0, 1]);
      // (round 4, C2) AND BROKEN BY NEWELS: a stone newel 0.4 m square, a hand higher than the coping, every 3.4 m
      // or so along the rim (so the balustrade under the line there is no unbroken band)
      const nN = Math.max(1, Math.round((xb - xa) / 3.4));
      for (let i = 0; i < nN; i++) {
        const xn = xa + (xb - xa) * (i + 0.5) / nN, a0 = xn - 0.2, a1 = xn + 0.2, z0 = -0.3, z1 = 0.1, yT = H + 1.3;
        g.kind(KIND.STONE).col(mulc(pal.parapet, 0.8));
        face([a0, H, z1], [a1, H, z1], [a1, yT, z1], [a0, yT, z1], [0, 0, 1]);
        face([a1, H, z0], [a0, H, z0], [a0, yT, z0], [a1, yT, z0], [0, 0, -1]);
        face([a0, H, z0], [a0, H, z1], [a0, yT, z1], [a0, yT, z0], [-1, 0, 0]);
        face([a1, H, z1], [a1, H, z0], [a1, yT, z0], [a1, yT, z1], [1, 0, 0]);
        face([a0, yT, z1], [a1, yT, z1], [a1, yT, z0], [a0, yT, z0], [0, 1, 0]);
        // (no lantern on them: 3 m from the line each stood as a blown white square)
      }
    } else {
      // A LOW HIPPED ROOF of tile or slate WITH DEEP EAVES: four slopes of one pitch (about one in three), 0.9 m
      // over the front (past the posts), 0.3 m over the sides and back; a timber edge and a shaded soffit in front
      const oF = h.own ? 2.6 : 0.9, oS = h.own ? 2 : 0.3, e = w2 + oS, zf = oF, zb = -D - oS, hx = e, hz = (zf - zb) / 2, run = Math.min(hx, hz);
      // (a tower's roof is pointed: one and a half times as high as it is wide from eave to ridge)
      // (round 3, A4: the pitch is one in two, so the roof is seen over its eave from the lake's level: 2.3 m high)
      // (round 4, D1: THE HIGH TIERS' HOUSES ARE NOT FLAT-TOPPED FROM THE LAKE: looked up at from the opening a
      // roof of one in two on the third tier and above lay hidden behind its own eave; from the third tier each
      // tier's roofs are a ninth steeper than the tier below (0.61, 0.72, 0.83), hipped and plain like the rest)
      const kT = Math.max(0, Math.round((h.y0 - P.DECK) / P.TR) - 1);
      const rh = run * (h.kind === 'tower' ? 1.5 : 0.5 + 0.11 * kT), rx = hx - run, rz = hz - run, zm = (zf + zb) / 2, yE = H - 0.1, l = Math.hypot(rh, run), ny = run / l, nh = rh / l;
      // (L6: the four slopes say 1 in their second figure: the shader paints their eave course and their ridge and
      // hip caps, so a roof seen from above reads as a roof; u runs from hip to hip, v from 0 at the eave to 0.6)
      g.kind(KIND.SLATE).col(roofC).move(1);
      g.quad(W(-e, yE, zf), W(e, yE, zf), W(rx, yE + rh, zm + rz), W(-rx, yE + rh, zm + rz), Nv(0, ny, nh), [0, 0, 1, 0, 1, 0.6, 0, 0.6]);
      g.quad(W(e, yE, zb), W(-e, yE, zb), W(-rx, yE + rh, zm - rz), W(rx, yE + rh, zm - rz), Nv(0, ny, -nh), [0, 0, 1, 0, 1, 0.6, 0, 0.6]);
      g.quad(W(e, yE, zf), W(e, yE, zb), W(rx, yE + rh, zm - rz), W(rx, yE + rh, zm + rz), Nv(nh, ny, 0), [0, 0, 1, 0, 1, 0.6, 0, 0.6]);
      g.quad(W(-e, yE, zb), W(-e, yE, zf), W(-rx, yE + rh, zm + rz), W(-rx, yE + rh, zm - rz), Nv(-nh, ny, 0), [0, 0, 1, 0, 1, 0.6, 0, 0.6]);
      // (ROUND 5 MENDING 4: THE CREST'S TALL HOUSE HAS A DEEP DARK EAVE THAT READS FROM BELOW: 2.6 m over the front
      // and 2 m over the ends, a dark fascia board 0.5 m deep on three sides and a soffit in deep shade under it)
      const fd = h.own ? 0.5 : 0.1;
      g.move(0).kind(KIND.TIMBER).col(h.own ? mulc(pal.timber, 0.3) : pal.timber);
      face([-e, yE - fd, zf], [e, yE - fd, zf], [e, yE, zf], [-e, yE, zf], [0, 0, 1]);
      if (h.own) for (const s of [-1, 1]) face([s * e, yE - fd, s > 0 ? zf : zb], [s * e, yE - fd, s > 0 ? zb : zf], [s * e, yE, s > 0 ? zb : zf], [s * e, yE, s > 0 ? zf : zb], [s, 0, 0]);
      g.col(mulc(pal.timber, h.own ? 0.22 : 0.8));
      face([-e, H - 0.16, 0.02], [e, H - 0.16, 0.02], [e, yE - fd, zf], [-e, yE - fd, zf], [0, -1, 0]);
      if (h.chim && h.kind === 'tier') {
        const cx = (h.ph - 0.5) * (h.w - 1.4), cz = -D + 1.2, y1 = H + 0.3, y2 = H + rh + 0.9;
        g.kind(KIND.LIME).col(mulc(h.tint, 0.92));
        face([cx - 0.3, y1, cz + 0.3], [cx + 0.3, y1, cz + 0.3], [cx + 0.3, y2, cz + 0.3], [cx - 0.3, y2, cz + 0.3], [0, 0, 1]);
        face([cx + 0.3, y1, cz - 0.3], [cx - 0.3, y1, cz - 0.3], [cx - 0.3, y2, cz - 0.3], [cx + 0.3, y2, cz - 0.3], [0, 0, -1]);
        face([cx - 0.3, y1, cz - 0.3], [cx - 0.3, y1, cz + 0.3], [cx - 0.3, y2, cz + 0.3], [cx - 0.3, y2, cz - 0.3], [-1, 0, 0]);
        face([cx + 0.3, y1, cz + 0.3], [cx + 0.3, y1, cz - 0.3], [cx + 0.3, y2, cz - 0.3], [cx + 0.3, y2, cz + 0.3], [1, 0, 0]);
        chimneys.push({ p: W(cx, y2, cz), d: h.d, ph: h.ph });
      }
    }
  }
  for (const gd of houses.gardens || []) {
    const A = P.pos(gd.r, gd.a0), B = P.pos(gd.r, gd.a1), Ai = P.pos(gd.r + 0.3, gd.a0), Bi = P.pos(gd.r + 0.3, gd.a1), y = P.tierY(gd.k), am = (gd.a0 + gd.a1) / 2, n = [-Math.sin(am), 0, Math.cos(am)];
    // A TERRACED GARDEN: a balustrade at its edge and A PERGOLA along its front (two rows of timber posts, two long
    // beams, rafters across, a vine's leaves over two thirds of it); its trees are laid with the cypresses
    g.kind(KIND.STONE).col(pal.parapet);
    g.quad([A[0], y + 1.0, A[1]], [B[0], y + 1.0, B[1]], [Bi[0], y + 1.0, Bi[1]], [Ai[0], y + 1.0, Ai[1]], [0, 1, 0]);
    g.kind(KIND.RAIL).quad([A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + 1.0, B[1]], [A[0], y + 1.0, A[1]], n);
    const wG = (gd.a1 - gd.a0) * gd.r, nP = Math.max(3, Math.round(wG / 3.4)), yT = y + 2.8, V = (r, a, yy) => { const p = P.pos(r, a); return [p[0], yy, p[1]]; };
    // (ROUND 5 MENDING 5, L6: the pergola runs the garden's whole length on every garden; a trestle of it (two posts
    // and their rafter) stands where THE ONE RULE OF THE LINE lets both posts stand, asked at their tops)
    const e0 = gd.a0 + 0.8 / gd.r, e1 = gd.a1 - 0.8 / gd.r, rA = gd.r + 1.0, rB = gd.r + 4.4;
    g.kind(KIND.TIMBER).col(pal.timber);
    for (let i = 0; i <= nP; i++) {
      const a = e0 + (e1 - e0) * i / nP;
      if (![rA, rB].every((rr) => { const p = P.pos(rr, a); return keep('pergola post', p[0], yT, p[1]); })) continue;
      for (const rr of [rA, rB]) { const p = P.pos(rr, a); g.box(p[0] - 0.07, y, p[1] - 0.07, p[0] + 0.07, yT, p[1] + 0.07, 'yY'); }
      g.quad(V(rA - 0.4, a - 0.06 / rA, yT + 0.1), V(rB + 0.4, a - 0.06 / rB, yT + 0.1), V(rB + 0.4, a + 0.06 / rB, yT + 0.1), V(rA - 0.4, a + 0.06 / rA, yT + 0.1), [0, 1, 0]);
      g.quad(V(rA - 0.4, a, yT - 0.04), V(rB + 0.4, a, yT - 0.04), V(rB + 0.4, a, yT + 0.1), V(rA - 0.4, a, yT + 0.1), [Math.cos(a), 0, Math.sin(a)]);
    }
    for (const rr of [rA, rB]) g.quad(V(rr, e0, yT - 0.16), V(rr, e1, yT - 0.16), V(rr, e1, yT), V(rr, e0, yT), n);
    g.kind(KIND.LEAF).col(mulc(pal.leaf[0], 0.9)).move(0.3);
    g.quad(V(rA - 0.2, e0, yT + 0.16), V(rA - 0.2, e0 + (e1 - e0) * 0.68, yT + 0.16), V(rB + 0.2, e0 + (e1 - e0) * 0.68, yT + 0.16), V(rB + 0.2, e0, yT + 0.16), [0, 1, 0]);
    g.move(0);
  }
  return { g, chimneys };
}

// ---------------------------------------------------------------- unit geometries of the instanced kinds
KIND.RAIL = 12; KIND.ARCADE = 13; KIND.WALL = 14;
const WALL_Z = 0.12; // (round 5, A1) where the house's wall stands in a room's unit depth (the open front lies at one half)
export function unitGeos() {
  const U = {};
  // (round 5, A1) A VERANDA IS A GALLERY BEFORE A WALL: every room carries THE HOUSE'S WALL a deck's depth behind
  // its open front (at 0.12 of its depth: 1.9 m back in a room 5 m deep), one face flagged 2 in the vertex's
  // second figure; the shader cuts the doorway and the windows out of it and paints its shutters, lintel and
  // threshold (see the room's branch), so the room is seen only through those openings; what lies before it is
  // the gallery's deck. (An end room open to a side has its side closed behind that wall, flagged 3: plain wall)
  const front = (g, sx = 0) => {
    g.move(2).quad([-0.5, -0.5, WALL_Z], [0.5, -0.5, WALL_Z], [0.5, 0.5, WALL_Z], [-0.5, 0.5, WALL_Z], [0, 0, 1]);
    if (sx) g.move(3).quad([sx * 0.5, -0.5, -0.5], [sx * 0.5, -0.5, WALL_Z], [sx * 0.5, 0.5, WALL_Z], [sx * 0.5, 0.5, -0.5], [sx, 0, 0]);
    return g.move(0);
  };
  U.room = front(makeGeo().kind(KIND.ROOM).room(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5)).build();
  // far off a room is laid without its floor's face (the ceiling of the room under it shows in its place)
  U.roomF = front(makeGeo().kind(KIND.ROOM).room(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, true)).build();
  // THE GALLERY'S RETURN: the end room of a house that stands free on that side has no wall there (sx = -1: the
  // side toward -x is open; +1: the side toward +x): the veranda goes round the corner
  const openRoom = (sx) => {
    const g = makeGeo().kind(KIND.ROOM), x = -sx * 0.5;
    g.quad([x, -0.5, sx * 0.5], [x, -0.5, -sx * 0.5], [x, 0.5, -sx * 0.5], [x, 0.5, sx * 0.5], [sx, 0, 0], [1, 0, 0, 0, 0, 1, 1, 1]);
    g.quad([-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [0, 1, 0], [0, 1, 1, 1, 1, 0, 0, 0]);
    g.quad([-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5], [0, -1, 0]);
    g.quad([-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [0, 0, 1]);
    return front(g, sx).build();
  };
  U.roomL = openRoom(-1); U.roomR = openRoom(1);
  // the rail's panel: the turned balusters are cut out of it by the shader (kind RAIL), with a solid top and foot
  U.rail = makeGeo().kind(KIND.RAIL).quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0], [0, 0, 1]).build();
  U.toprail = makeGeo().kind(KIND.TIMBER).box(-0.5, -0.05, -0.06, 0.5, 0.05, 0.06, 'xXyz').build();
  const cloth = (nx, ny) => {
    const g = makeGeo().kind(KIND.CLOTH);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) g.vert(i / nx - 0.5, -j / ny, 0, 0, 0, 1, i / nx, j / ny, j / ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      g.tri(a, c, b); g.tri(b, c, d);
    }
    return g.build();
  };
  U.clothN = cloth(1, 4); U.clothF = cloth(1, 1);
  // the hanging lamp: a chain from the pivot (the origin) and a small shade that glows where the lamp burns
  const lg = makeGeo().kind(KIND.LAMP).col([0.25, 0.2, 0.15]).move(0);
  lg.quad([-0.012, 0, 0], [0.012, 0, 0], [0.012, -0.7, 0], [-0.012, -0.7, 0], [0, 0, 1]);
  lg.col([3.6, 3.6, 3.6]).move(1);
  const eq = [[0.13, -0.84, 0], [0, -0.84, 0.13], [-0.13, -0.84, 0], [0, -0.84, -0.13]];
  for (let i = 0; i < 4; i++) {
    const p = eq[i], q = eq[(i + 1) % 4], nx = (p[0] + q[0]) * 3.8, nz = (p[2] + q[2]) * 3.8;
    const a = lg.vert(0, -0.68, 0, nx, 0.5, nz), b = lg.vert(p[0], p[1], p[2], nx, 0.5, nz), c = lg.vert(q[0], q[1], q[2], nx, 0.5, nz);
    lg.tri(a, b, c);
    const d = lg.vert(0, -1.0, 0, nx, -0.5, nz), e = lg.vert(p[0], p[1], p[2], nx, -0.5, nz), f = lg.vert(q[0], q[1], q[2], nx, -0.5, nz);
    lg.tri(d, f, e);
  }
  U.lamp = lg.build();
  // A PAIR OF SLENDER POSTS (three sided, 0.24 m apart) one storey high (y 0 to 1 is the storey), a block joining
  // their heads under the eave and A BRACKET from each post out to the eave's edge
  const pg = makeGeo().kind(KIND.TIMBER), top = 0.933;
  for (const cx of [-0.12, 0.12]) {
    const R = 0.06, pts = [0, 1, 2].map((i) => [cx + R * Math.sin(i * 2.094), R * Math.cos(i * 2.094) - 0.02]);
    for (let i = 0; i < 3; i += 2) {
      // (the two faces toward the front and the sides; the face toward the room is left out)
      const p = pts[i], q = pts[(i + 1) % 3], nx = (p[0] + q[0]) / 2 - cx, nz = (p[1] + q[1]) / 2 + 0.02, l = Math.hypot(nx, nz);
      pg.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], top, q[1]], [p[0], top, p[1]], [nx / l, 0, nz / l]);
    }
    const sg = Math.sign(cx);
    pg.tri(pg.vert(cx, 0.77, 0.03, sg, 0, 0), pg.vert(cx, 0.905, 0.37, sg, 0, 0), pg.vert(cx, 0.905, 0.03, sg, 0, 0));
  }
  pg.quad([-0.19, 0.895, 0.05], [0.19, 0.895, 0.05], [0.19, top, 0.05], [-0.19, top, 0.05], [0, 0, 1]);
  U.post = pg.build();
  return U;
}

// the plain things of a room, SIX KINDS (local metres: x across the bay, y from the floor, z toward the open front,
// the back wall at z = -2.5): a laid table; a bed; a desk and shelves; a kitchen with a hanging row of pans; a bare
// room with a carpet; a room with a great wardrobe. The people are known by these only. All furniture is of pale
// timber and low or wide: nothing dark stands upright at a person's size. A vertex whose red is NEG takes a worn
// colour dealt to its room (the bed's cover, the carpet) in the vertex shader.
const NEG = [-1, 0, 0];
export function roomSets(pal) {
  const wood = lin('#c9a66b'), dark = lin('#b08d5c'), linen = [0.86, 0.84, 0.78];
  // a low bench without a back (it takes the place of the first build's chairs, which read as small figures)
  const bench = (g, x, z, len, turn) => {
    const c = Math.cos(turn), s = Math.sin(turn), W = (a, y, b) => [x + a * c + b * s, y, z - a * s + b * c], h = len / 2;
    g.kind(KIND.TIMBER).col(dark);
    g.quad(W(-h, 0.44, 0.17), W(h, 0.44, 0.17), W(h, 0.44, -0.17), W(-h, 0.44, -0.17), [0, 1, 0]);
    g.quad(W(-h, 0.38, 0.17), W(h, 0.38, 0.17), W(h, 0.44, 0.17), W(-h, 0.44, 0.17), [s, 0, c]);
    for (const e of [-h + 0.08, h - 0.08]) g.quad(W(e, 0, 0.15), W(e, 0, -0.15), W(e, 0.38, -0.15), W(e, 0.38, 0.15), [c, 0, -s]);
  };
  // a low chest against the back wall with a LOW WIDE glass over it (it flashes the sky as the light law gives)
  const chest = (g, x, z, w2) => {
    g.kind(KIND.TIMBER).col(wood).box(x - w2, 0, z, x + w2, 0.95, z + 0.48, 'yz');
    g.col(dark).quad([x - w2, 0.46, z + 0.485], [x + w2, 0.46, z + 0.485], [x + w2, 0.5, z + 0.485], [x - w2, 0.5, z + 0.485], [0, 0, 1]);
    g.kind(KIND.GLASS).col([1, 1, 1]).quad([x - w2 * 0.85, 1.2, z + 0.03], [x + w2 * 0.85, 1.2, z + 0.03], [x + w2 * 0.85, 1.7, z + 0.03], [x - w2 * 0.85, 1.7, z + 0.03], [0, 0, 1]);
  };
  const table = (g, x, z) => {
    g.kind(KIND.TIMBER).col(wood).box(x - 0.6, 0.7, z - 0.4, x + 0.6, 0.76, z + 0.4, 'y');
    for (const lx of [-0.49, 0.49]) g.quad([x + lx, 0, z - 0.3], [x + lx, 0, z + 0.3], [x + lx, 0.7, z + 0.3], [x + lx, 0.7, z - 0.3], [lx > 0 ? 1 : -1, 0, 0]);
    // laid: a cloth runner, two plates, a jug
    g.kind(KIND.LIME).col(linen).quad([x - 0.6, 0.765, z + 0.2], [x + 0.6, 0.765, z + 0.2], [x + 0.6, 0.765, z - 0.2], [x - 0.6, 0.765, z - 0.2], [0, 1, 0]);
    g.col([0.92, 0.9, 0.86]);
    for (const px of [-0.3, 0.3]) g.quad([x + px - 0.1, 0.775, z + 0.1], [x + px + 0.1, 0.775, z + 0.1], [x + px + 0.1, 0.775, z - 0.1], [x + px - 0.1, 0.775, z - 0.1], [0, 1, 0]);
    g.col(pal.jug).box(x - 0.06, 0.77, z - 0.33, x + 0.06, 1.0, z - 0.21, 'yYz');
  };
  // a bed with its head to the back wall; its cover's colour is dealt to the room
  const bed = (g, x, z) => {
    g.kind(KIND.TIMBER).col(wood).box(x - 0.55, 0.12, z - 1.0, x + 0.55, 0.42, z + 1.0, 'y');
    g.quad([x - 0.57, 0, z - 1.02], [x + 0.57, 0, z - 1.02], [x + 0.57, 0.9, z - 1.02], [x - 0.57, 0.9, z - 1.02], [0, 0, 1]);
    g.kind(KIND.LIME).col(linen).box(x - 0.4, 0.42, z - 0.92, x + 0.4, 0.55, z - 0.55, 'yxXz');
    g.col(NEG).box(x - 0.55, 0.42, z - 0.45, x + 0.55, 0.5, z + 1.0, 'yz');
  };
  // (round 5, A1) ON THE GALLERY: a tub of worn terracotta with a green bush in it (never red), by the rail or the wall
  const pot = (g, x, z, k) => {
    // (the budget: seed 39 stood at 460,593 with a pot of thirty triangles and three more benches: a pot is
    // fourteen, its hidden faces left out, and the benches are not added)
    g.kind(KIND.LIME).col(mixc(pal.pot[1], pal.parapet, 0.3)).box(x - 0.17, 0, z - 0.17, x + 0.17, 0.4, z + 0.17, 'yYz');
    g.kind(KIND.LEAF).col(pal.leaf[k % 2]).box(x - 0.3, 0.4, z - 0.3, x + 0.3, 0.9, z + 0.3, 'yz');
  };
  const sets = [0, 1, 2, 3, 4, 5, 6].map(() => makeGeo());
  // 1 a laid table with two benches, a chest with its glass at the back
  // (the house's wall stands 0.6 back in these figures (1.9 m behind the open front at 2.5): what is
  // further forward stands ON THE GALLERY: the laid table and its benches, a bench by the door; nothing may
  // straddle the wall)
  table(sets[0], -0.2, 1.5); bench(sets[0], -0.2, 2.12, 1.1, 0); bench(sets[0], -0.2, 0.88, 1.1, 0); chest(sets[0], 0.75, -2.48, 0.6);
  // 2 a bed, a small chest
  bed(sets[1], -0.85, -1.4); chest(sets[1], 0.8, -2.48, 0.5); bench(sets[1], 0.6, 1.45, 0.8, 1.2);
  roomKinds(sets, { wood, dark, linen, bench, chest, table, pal });
  // (round 5, A1) each room's gallery has its pot (the bare room's has two)
  pot(sets[0], 1.25, 2.1, 0); pot(sets[1], -1.2, 2.05, 1); pot(sets[2], 1.2, 2.0, 0);
  pot(sets[3], 1.25, 1.0, 1); pot(sets[4], -1.2, 2.1, 0); pot(sets[4], 1.2, 2.1, 1); pot(sets[5], -1.25, 1.9, 1);
  return sets.map((g) => g.build());
}
// the other four kinds of room
function roomKinds(sets, T) {
  const { wood, dark, linen, bench, chest, table, pal } = T;
  // 3 a desk under shelves on the back wall: books as short blocks of worn colour, a sheet on the desk, a stool
  let g = sets[2];
  g.kind(KIND.TIMBER).col(wood).box(-1.0, 0.72, -2.48, 0.5, 0.78, -1.8, 'y');
  for (const lx of [-0.95, 0.45]) g.quad([lx, 0, -2.45], [lx, 0, -1.85], [lx, 0.72, -1.85], [lx, 0.72, -2.45], [lx > 0 ? 1 : -1, 0, 0]);
  g.kind(KIND.LIME).col(linen).quad([-0.5, 0.785, -1.9], [-0.1, 0.785, -1.9], [-0.1, 0.785, -2.2], [-0.5, 0.785, -2.2], [0, 1, 0]);
  for (let s = 0; s < 3; s++) {
    const y = 1.25 + s * 0.42;
    g.kind(KIND.TIMBER).col(dark).box(-1.3, y, -2.48, 1.3, y + 0.04, -2.22, 'zxXY');
    for (let b = 0; b < 5; b++) {
      const x = -1.2 + b * 0.5 + 0.11 * ((s * 3 + b * 5) % 4), wb = 0.16 + 0.05 * ((s + b) % 3);
      g.kind(KIND.LIME).col(pal.cloth[(s * 2 + b) % 5]).box(x, y + 0.04, -2.46, x + wb, y + 0.27 + 0.03 * (b % 2), -2.26, 'yzxX');
    }
  }
  bench(g, -0.3, -1.35, 0.5, 0);
  // 4 a kitchen: a long work table at the back, a rail with A HANGING ROW OF PANS (copper and iron rounds), a jar, a bench
  g = sets[3];
  g.kind(KIND.TIMBER).col(wood).box(-1.3, 0, -2.48, 1.3, 0.86, -1.9, 'yz');
  // (round 4, D1: THE HANGING SHAPES ARE FEWER AND OF THE TIMBER'S TONE: three pans, not six, each the timber
  // warmed a little toward copper, none iron grey (in a shaded room the six stood as a row of black rounds); the
  // rail is of the room's wood)
  g.col(wood).box(-1.35, 1.92, -2.44, 1.35, 1.96, -2.4, '');
  const pan = [lin('#b9763f'), lin('#c08a4a'), lin('#b9763f')];
  for (let i = 0; i < 6; i += 2) {
    const x = -1.1 + i * 0.44, r = 0.11 + 0.035 * ((i * 2) % 3), y = 1.66 - r;
    g.kind(KIND.LIME).col(mixc(pal.timber, pan[i % 3], 0.1)); // (round 5, D1, the guard again: the hanging shapes are of the timber's tone: a tenth of copper left, not a third)
    const c0 = g.vert(x, y, -2.38, 0, 0, 1);
    const ring = []; for (let k = 0; k < 8; k++) ring.push(g.vert(x + r * Math.cos(k * 0.7854), y + r * Math.sin(k * 0.7854), -2.38, 0, 0, 1));
    for (let k = 0; k < 8; k++) g.tri(c0, ring[k], ring[(k + 1) % 8]);
    g.quad([x - 0.012, y + r, -2.38], [x + 0.012, y + r, -2.38], [x + 0.012, 1.92, -2.38], [x - 0.012, 1.92, -2.38], [0, 0, 1]);
  }
  g.col(pal.jug).box(0.7, 0.86, -2.3, 0.92, 1.16, -2.08, 'y');
  table(g, 0.1, -0.55); bench(g, 0.1, 0.12, 1.1, 0);
  // 5 a bare room with a carpet: a field of dealt colour within a pale border, a low chest, nothing else
  g = sets[4];
  g.kind(KIND.LIME).col(linen).quad([-1.25, 0.012, 0.5], [1.25, 0.012, 0.5], [1.25, 0.012, -1.9], [-1.25, 0.012, -1.9], [0, 1, 0]);
  g.col(NEG).quad([-1.08, 0.02, 0.33], [1.08, 0.02, 0.33], [1.08, 0.02, -1.73], [-1.08, 0.02, -1.73], [0, 1, 0]);
  g.col(linen).quad([-0.4, 0.028, -0.2], [0.4, 0.028, -0.2], [0.4, 0.028, -1.2], [-0.4, 0.028, -1.2], [0, 1, 0]);
  g.kind(KIND.TIMBER).col(wood).box(-0.5, 0, -2.48, 0.5, 0.42, -2.05, 'yz');
  // 6 a room with A GREAT WARDROBE: wide and pale along the back wall, panelled doors, its glass LOW AND WIDE across the
  // middle door at a sitter's height (it flashes the sky); a bench before it
  g = sets[5];
  g.kind(KIND.TIMBER).col(wood).box(-1.25, 0, -2.48, 1.25, 2.1, -1.92, 'yz');
  g.col(dark).box(-1.3, 2.1, -2.48, 1.3, 2.18, -1.88, 'yz');
  for (const dx of [-0.42, 0.42]) g.quad([dx - 0.012, 0.06, -1.915], [dx + 0.012, 0.06, -1.915], [dx + 0.012, 2.05, -1.915], [dx - 0.012, 2.05, -1.915], [0, 0, 1]);
  for (const px of [-0.84, 0.84]) for (const py of [0.18, 1.14]) g.quad([px - 0.3, py, -1.914], [px + 0.3, py, -1.914], [px + 0.3, py + 0.8, -1.914], [px - 0.3, py + 0.8, -1.914], [0, 0, 1]);
  g.kind(KIND.GLASS).col([1, 1, 1]).quad([-0.36, 0.95, -1.912], [0.36, 0.95, -1.912], [0.36, 1.4, -1.912], [-0.36, 1.4, -1.912], [0, 0, 1]);
  bench(g, 0.2, -0.9, 0.9, 0);
  // 7 THE ENFILADE (a bay three rooms deep): two partitions across the bay with an open door in each, a runner of
  // dealt colour through both doors to the far wall, a bench in the first room, a chest and its glass at the far end
  g = sets[6];
  for (const z of [-0.1, -2.6]) {
    g.kind(KIND.LIME).col([0.8, 0.76, 0.66]);
    g.quad([-1.7, 0, z], [-0.55, 0, z], [-0.55, 2.7, z], [-1.7, 2.7, z], [0, 0, 1]);
    g.quad([0.55, 0, z], [1.7, 0, z], [1.7, 2.7, z], [0.55, 2.7, z], [0, 0, 1]);
    g.quad([-0.55, 2.1, z], [0.55, 2.1, z], [0.55, 2.7, z], [-0.55, 2.7, z], [0, 0, 1]);
    g.kind(KIND.TIMBER).col(dark);
    for (const sx of [-1, 1]) g.quad([sx * 0.55, 0, z + 0.01], [sx * 0.63, 0, z + 0.01], [sx * 0.63, 2.18, z + 0.01], [sx * 0.55, 2.18, z + 0.01], [0, 0, 1]);
    g.quad([-0.55, 2.1, z + 0.01], [0.55, 2.1, z + 0.01], [0.55, 2.18, z + 0.01], [-0.55, 2.18, z + 0.01], [0, 0, 1]);
    for (const sx of [-1, 1]) g.quad([sx * 0.55, 0, z], [sx * 0.55, 0, z - 0.14], [sx * 0.55, 2.1, z - 0.14], [sx * 0.55, 2.1, z], [-sx, 0, 0]);
  }
  g.kind(KIND.LIME).col(NEG).quad([-0.4, 0.015, 2.0], [0.4, 0.015, 2.0], [0.4, 0.015, -4.9], [-0.4, 0.015, -4.9], [0, 1, 0]);
  bench(g, -1.1, 1.0, 1.0, 1.5708);
  chest(g, 0, -5.08, 0.5);
}

// (round 2: no closed wall with shutters stood in this city. Round 5, A1: behind every gallery stands the house's
// wall with its doorway and shuttered windows, painted on a face of the room's unit: see unitGeos and the shader)

// ---------------------------------------------------------------- arches that spring at the waterline (whole rings with their doubles)
// archPanel: a wall from foot A to foot B (plan points, y = 0) up to yTop, pierced by one round arch of radius R whose
// centre lies ON the water's plane, so that the arch and its double close into a whole ring. n = the wall's outward
// normal in plan; depth = how far the soffit runs back (back: a dark wall closes it, or none for a through arch).
export function archPanel(g, A, B, yTop, R, n, depth, pal, back = true, segs = 8, baseY = 0, ringW = 0) {
  const ux = B[0] - A[0], uz = B[1] - A[1], L = Math.hypot(ux, uz), tx = ux / L, tz = uz / L, c = L / 2;
  const at = (s, y, d = 0) => [A[0] + tx * s - n[0] * d, y + baseY, A[1] + tz * s - n[1] * d];
  const nn = [n[0], 0, n[1]];
  g.kind(KIND.STONE).col(pal.quay);
  if (c - R > 0.01) {
    g.quad(at(0, 0), at(c - R, 0), at(c - R, yTop), at(0, yTop), nn);
    g.quad(at(c + R, 0), at(L, 0), at(L, yTop), at(c + R, yTop), nn);
  }
  for (let i = 0; i < segs; i++) {
    const t0 = Math.PI * i / segs, t1 = Math.PI * (i + 1) / segs;
    const s0 = c - R * Math.cos(t0), s1 = c - R * Math.cos(t1), y0 = R * Math.sin(t0), y1 = R * Math.sin(t1);
    g.kind(KIND.STONE).col(pal.quay);
    if (yTop > Math.max(y0, y1) + 0.01) g.quad(at(s0, y0), at(s1, y1), at(s1, yTop), at(s0, yTop), nn);
    // the soffit, in the arch's own shade
    const m = (t0 + t1) / 2, sn = [tx * Math.cos(m), -Math.sin(m), tz * Math.cos(m)];
    g.col(mulc(pal.quay, 0.62)).quad(at(s0, y0), at(s0, y0, depth), at(s1, y1, depth), at(s1, y1), sn);
    if (ringW > 0) {
      const k = (R + ringW) / R, o0 = c - R * k * Math.cos(t0), o1 = c - R * k * Math.cos(t1);
      // (mending 5, step 3b: THE RING'S STONES ARE MARKED: on a great ring (its band 1 m and more) each piece is
      // two voussoirs, one pale and one a clear tone deeper, turn about; the ring's line is the same)
      if (ringW >= 1) {
        const sm = (s0 + s1) / 2, ym = (y0 + y1) / 2, om = (o0 + o1) / 2;
        g.col(mulc(pal.quay, 1.36)).quad(at(s0, y0, -0.08), at(sm, ym, -0.08), at(om, ym * k, -0.08), at(o0, y0 * k, -0.08), nn);
        g.col(mulc(pal.quay, 1.08)).quad(at(sm, ym, -0.08), at(s1, y1, -0.08), at(o1, y1 * k, -0.08), at(om, ym * k, -0.08), nn);
      } else
      g.col(mulc(pal.quay, i % 2 ? 1.32 : 1.2)).quad(at(s0, y0, -0.08), at(s1, y1, -0.08), at(o1, y1 * k, -0.08), at(o0, y0 * k, -0.08), nn);
    }
  }
  if (back) g.kind(KIND.ROOM).col(mulc(pal.quay, 0.3)).quad(at(c - R, 0, depth), at(c + R, 0, depth), at(c + R, R, depth), at(c - R, R, depth), nn);
  return g;
}

// the quay: a deck 6 m wide on small arches along the whole crescent, and the same plinth under the inlet's stacks
export function makeQuay(P, pal) {
  const g = makeGeo(), R = 0.86, step = 5.0 / P.RQ, rings = [];
  const run = (aFrom, aTo) => {
    const n = Math.max(1, Math.round((aTo - aFrom) / step)), da = (aTo - aFrom) / n;
    for (let i = 0; i < n; i++) {
      const a0 = aFrom + i * da, a1 = a0 + da, am = (a0 + a1) / 2;
      const A = P.pos(P.RQ, a0), B = P.pos(P.RQ, a1), A2 = P.pos(P.RQ + P.QW, a0), B2 = P.pos(P.RQ + P.QW, a1);
      archPanel(g, A, B, P.DECK, R, [-Math.sin(am), Math.cos(am)], 1.3, pal, true, 6);
      // THE RISING STREET: from rampA0 the deck climbs (one in five) to the west bastion's top; its wall of pale
      // stone stands on the quay's small arches, a balustrade along its water side all the way
      const y0 = P.rampY(a0), y1 = a0 > P.rampA1 ? P.DECK : P.rampY(Math.min(a1, P.rampA1)), nIn = [-Math.sin(am), 0, Math.cos(am)];
      g.kind(KIND.PAVE).col(pal.pave).quad([A[0], y0, A[1]], [B[0], y1, B[1]], [B2[0], y1, B2[1]], [A2[0], y0, A2[1]], [0, 1, 0]);
      if (y1 > P.DECK + 0.01) {
        // (round 2: kind WALL: pilasters, blind arches stepping up with the street, a string course, a coping)
        g.kind(KIND.WALL).col(pal.bastion);
        const hA = y0 - P.DECK, hB = y1 - P.DECK, uA = a0 * P.RQ, uB = a1 * P.RQ;
        const w0 = g.vert(A[0], P.DECK, A[1], nIn[0], 0, nIn[2], uA, 0, hA), w1 = g.vert(B[0], P.DECK, B[1], nIn[0], 0, nIn[2], uB, 0, hB);
        const w2 = g.vert(B[0], y1, B[1], nIn[0], 0, nIn[2], uB, hB, hB), w3 = g.vert(A[0], y0, A[1], nIn[0], 0, nIn[2], uA, hA, hA);
        g.tri(w0, w1, w2); g.tri(w0, w2, w3);
        // green hangs over the street's parapet on the water side, on one run in three
        if (i % 3 === 1 && hA > 3) {
          const G0 = P.pos(P.RQ - 0.2, a0 + da * 0.15), G1 = P.pos(P.RQ - 0.2, a0 + da * 0.55), G2 = P.pos(P.RQ - 0.2, a0 + da * 0.9);
          // (the guard: on the rising street the nearest balusters turned lime yellow close under the line:
          // this green stood 0.2 m behind the balustrade from the street's level to 0.9 m over it, and showed
          // through the balusters' gaps where they are open, near the lens. It hangs from under the street's edge)
          const yg = (t) => y0 + (y1 - y0) * t - 0.06;
          g.kind(KIND.LEAF).col(mulc(pal.leaf[i % 2], 0.8)).move(1);
          g.quad([G0[0], yg(0.15) - 2.6, G0[1]], [G1[0], yg(0.55) - 3.8, G1[1]], [G1[0], yg(0.55), G1[1]], [G0[0], yg(0.15), G0[1]], nIn);
          g.quad([G1[0], yg(0.55) - 3.1, G1[1]], [G2[0], yg(0.9) - 1.7, G2[1]], [G2[0], yg(0.9), G2[1]], [G1[0], yg(0.55), G1[1]], nIn);
          g.move(0);
        }
        g.kind(KIND.STONE);
        const Ai = P.pos(P.RQ + 0.22, a0), Bi = P.pos(P.RQ + 0.22, a1);
        g.col(pal.parapet).quad([A[0], y0 + 1.15, A[1]], [B[0], y1 + 1.15, B[1]], [Bi[0], y1 + 1.15, Bi[1]], [Ai[0], y0 + 1.15, Ai[1]], [0, 1, 0]);
        g.kind(KIND.RAIL).quad([A[0], y0, A[1]], [B[0], y1, B[1]], [B[0], y1 + 1.12, B[1]], [A[0], y0 + 1.12, A[1]], nIn);
      }
      rings.push({ a: am, x: (A[0] + B[0]) / 2, z: (A[1] + B[1]) / 2 });
    }
  };
  run(-P.aMax, P.aLaneE()); run(P.aBastE(), P.aMax);
  // THE PLANTED BAYS of the rising street (stage E): each stands 2.6 m out over the water, 5.2 m long, on a
  // battered buttress of the bastion's stone that goes down through the plane; a balustrade round its three sides
  for (const ab of P.belv || []) {
    const a0 = ab - 2.6 / P.RQ, a1 = ab + 2.6 / P.RQ, y0 = P.rampY(a0), y1 = P.rampY(a1), ro = P.RQ - 2.6, rf = P.RQ - 3.3;
    const V = (r, a, y) => { const p = P.pos(r, a); return [p[0], y, p[1]]; }, nI = [-Math.sin(ab) * 0.97, 0.24, Math.cos(ab) * 0.97], tg = [Math.cos(ab), 0, Math.sin(ab)];
    g.kind(KIND.PAVE).col(pal.pave).quad(V(P.RQ, a0, y0), V(P.RQ, a1, y1), V(ro, a1, y1), V(ro, a0, y0), [0, 1, 0]);
    g.kind(KIND.STONE).col(mulc(pal.bastion, 1.04));
    g.quad(V(rf, a0, 0), V(rf, a1, 0), V(ro, a1, y1), V(ro, a0, y0), nI);
    g.quad(V(P.RQ, a0, 0), V(rf, a0, 0), V(ro, a0, y0), V(P.RQ, a0, y0), [-tg[0], 0, -tg[2]]);
    g.quad(V(rf, a1, 0), V(P.RQ, a1, 0), V(P.RQ, a1, y1), V(ro, a1, y1), tg);
    g.col(pal.parapet);
    g.quad(V(ro, a0, y0 - 0.45), V(ro, a1, y1 - 0.45), V(ro, a1, y1), V(ro, a0, y0), [-Math.sin(ab), 0, Math.cos(ab)]);
    g.kind(KIND.RAIL);
    g.quad(V(ro, a0, y0), V(ro, a1, y1), V(ro, a1, y1 + 1.05), V(ro, a0, y0 + 1.05), [-Math.sin(ab), 0, Math.cos(ab)]);
    g.quad(V(P.RQ, a0, y0), V(ro, a0, y0), V(ro, a0, y0 + 1.05), V(P.RQ, a0, y0 + 1.05), [-tg[0], 0, -tg[2]]);
    g.quad(V(ro, a1, y1), V(P.RQ, a1, y1), V(P.RQ, a1, y1 + 1.05), V(ro, a1, y1 + 1.05), tg);
  }
  // the plinth of the inlet's stacks: west flank, head, east flank (each faces the inlet's water)
  const seg = (r0, a0, r1, a1, nrm) => {
    const A = P.pos(r0, a0), B = P.pos(r1, a1), L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / 3.9));
    for (let i = 0; i < n; i++) {
      const p = [A[0] + (B[0] - A[0]) * i / n, A[1] + (B[1] - A[1]) * i / n], q = [A[0] + (B[0] - A[0]) * (i + 1) / n, A[1] + (B[1] - A[1]) * (i + 1) / n];
      archPanel(g, p, q, P.DECK, R, nrm, 1.1, pal, true, 6);
    }
  };
  const aw = P.aI - P.alpha, ae = P.aI + P.alpha;
  // (round 3, B1: the west flank to the head's quay; the head's quay across the old basin and the east water; the
  // pier's stack)
  const aBE = P.aBastE(), aM = (aw + aBE) / 2;
  seg(P.RQ, aw, P.rHQ, aw, [Math.cos(aw), Math.sin(aw)]);
  seg(P.rHQ, aw, P.rHQ, aBE, [-Math.sin(aM), Math.cos(aM)]);
  seg(P.rPier, ae, P.RQ, ae, [-Math.cos(ae), -Math.sin(ae)]);
  // (round 3, B-i and B-ii: the east row's plinth, 5.9 m before the garden terrace's end, from the pier to the
  // head's quay, on the same small arches)
  const aF = aBE - 5.9 / P.rPier;
  seg(P.rHQ, aF, P.rPier, aF, [-Math.cos(aF), -Math.sin(aF)]);
  // (and the east water's end under the garden terrace, facing west)
  seg(P.rHQ, aBE, P.rPier, aBE, [-Math.cos(aBE), -Math.sin(aBE)]);
  return { g, rings };
}

// ---------------------------------------------------------------- the bastions' walls, the stair lane and its small bridges
export function makeBastion(P, pal) {
  const g = makeGeo(), rimY = P.rimY, rEnd = P.rHead + 0.02;
  const V = (r, a, y) => { const p = P.pos(r, a); return [p[0], y, p[1]]; };
  const tang = (a, s) => [Math.cos(a) * s, 0, Math.sin(a) * s], radial = (a, s) => [Math.sin(a) * s, 0, -Math.cos(a) * s];
  const aw = P.aI - P.alpha, ae = P.aI + P.alpha, aLE = P.aLaneE(), aLW = P.aLaneW(), aBE = P.aBastE();
  // tip faces toward the bay, outer walls, and the rim's deck where no stack carries it
  for (const [a0, a1] of [[aLE, aw], [ae, aBE]]) {
    // (the tip's outer part is a veranda house of its own, laid with the houses; only the stack's end wall is closed)
    const w0 = a0 === ae ? ae : aw - 5.3 / P.RQ, w1 = a0 === ae ? ae + 5.3 / P.RQ : aw;
    g.kind(KIND.WALL).move(rimY).col(pal.bastion).quad(V(P.RQ, w0, 0), V(P.RQ, w1, 0), V(P.RQ, w1, rimY), V(P.RQ, w0, rimY), radial((a0 + a1) / 2, -1), [0.55, 0, 5.85, 0, 5.85, rimY, 0.55, rimY]).move(0);
    // (round 3, B1: the east block is THE PIER only, as deep as the quay is wide)
    const rT = a0 === ae ? P.rPier : rEnd;
    g.kind(KIND.PAVE).col(pal.pave).quad(V(P.RQ, a0, rimY), V(P.RQ, a1, rimY), V(rT, a1, rimY), V(rT, a0, rimY), [0, 1, 0]);
    // (the east tip carries no parapet: the causeway's deck leaves the rim there)
    if (a0 === ae) continue;
    // (the west bastion's top is an open terrace behind a balustrade)
    g.kind(KIND.STONE).col(pal.parapet);
    g.quad(V(P.RQ, a0, rimY - 0.4), V(P.RQ, a1, rimY - 0.4), V(P.RQ, a1, rimY), V(P.RQ, a0, rimY), radial((a0 + a1) / 2, -1));
    g.quad(V(P.RQ, a0, rimY + 1.1), V(P.RQ, a1, rimY + 1.1), V(P.RQ + 0.2, a1, rimY + 1.1), V(P.RQ + 0.2, a0, rimY + 1.1), [0, 1, 0]);
    g.kind(KIND.RAIL).quad(V(P.RQ, a0, rimY), V(P.RQ, a1, rimY), V(P.RQ, a1, rimY + 1.1), V(P.RQ, a0, rimY + 1.1), radial((a0 + a1) / 2, -1));
  }
  // (the bastions' walls are bare pale stone)
  // (round 2: kind WALL, three bays each)
  const uvW = [0, 0, rEnd - P.RQ, 0, rEnd - P.RQ, rimY, 0, rimY];
  g.kind(KIND.WALL).move(rimY).col(pal.bastion);
  g.quad(V(P.RQ, aLE, 0), V(rEnd, aLE, 0), V(rEnd, aLE, rimY), V(P.RQ, aLE, rimY), tang(aLE, -1), uvW);
  // (round 3, B1) THE PIER: its east face, its inland face over the harbour's east water (beside the stack's
  // gallery, which turns that corner) with a balustrade on its head
  const rP = P.rPier, aS = ae + 5.5 / rP, uvP = [0, 0, rP - P.RQ, 0, rP - P.RQ, rimY, 0, rimY];
  g.quad(V(rP, aBE, 0), V(P.RQ, aBE, 0), V(P.RQ, aBE, rimY), V(rP, aBE, rimY), tang(aBE, 1), uvP);
  g.quad(V(rP, aS, 0), V(rP, aBE, 0), V(rP, aBE, rimY), V(rP, aS, rimY), radial(aBE, 1), [0, 0, (aBE - aS) * rP, 0, (aBE - aS) * rP, rimY, 0, rimY]);
  g.move(0);
  g.kind(KIND.STONE).col(pal.parapet).quad(V(rP, aS, rimY + 1.1), V(rP, aBE, rimY + 1.1), V(rP - 0.2, aBE, rimY + 1.1), V(rP - 0.2, aS, rimY + 1.1), [0, 1, 0]);
  g.kind(KIND.RAIL).quad(V(rP, aS, rimY), V(rP, aBE, rimY), V(rP, aBE, rimY + 1.1), V(rP, aS, rimY + 1.1), radial(aBE, 1));
  // THE HARBOUR'S HEAD: the high wall's foot, of the bastions' stone, from the plane to the high street's level
  // behind the houses (seen in the gaps and over the roofs), across the old basin and the east water; and the low
  // quay the houses stand on, 5.5 m deep, its front on small arches like the city's quay
  const hw = (aBE - aw) * rEnd;
  g.kind(KIND.WALL).move(rimY).col(pal.bastion).quad(V(rEnd, aw, 0), V(rEnd, aBE, 0), V(rEnd, aBE, rimY), V(rEnd, aw, rimY), radial(P.aI, -1), [0, 0, hw, 0, hw, rimY, 0, rimY]).move(0);
  g.kind(KIND.PAVE).col(pal.pave).quad(V(P.rFront - 1.6, aw, P.DECK), V(P.rFront - 1.6, aBE, P.DECK), V(rEnd, aBE, P.DECK), V(rEnd, aw, P.DECK), [0, 1, 0]);
  // (round 3, B-i: THE LOW MOLE on the lake side is the mole row's quay, built with the causeway: it leaves the
  // pier's corner along the causeway's foot; the mouth beside it, toward the west terrace, is open to the lake)
  // (round 3, B-i and B-ii) the east row's plinth: 5.9 m deep before the garden terrace's end, from the pier to
  // the head's quay (no back canal: the old east water is closed by it and by the pier)
  {
    const aQ = aBE - 5.9 / rP, rH = P.rFront - 1.6;
    g.quad(V(rP, aQ, P.DECK), V(rH, aQ, P.DECK), V(rH, aBE, P.DECK), V(rP, aBE, P.DECK), [0, 1, 0]);
  }
  // (round 2: the stair lane beside the west bastion, its steps and its small bridges are gone; street 1 passes
  // behind both bastions and over the basin's head, carried by the head stack)
  // (round 3, B1: THE MOUTH'S BRIDGE IS GONE. It closed the harbour's lake side at the rim's
  // height. The harbour's mouth is open to the lake, 32 m
  // wide between the west flank and the pier; the west terrace is a belvedere over it, the causeway leaves from
  // the pier's head, which is reached through the pier's own stack.)
  // (no parterre lies on the west terrace: a clipped bed in a curb read as a kerbed lawn from the street's top;
  // the terrace is paving, its two trees and the parapet)
  // the islet under the gallery tower: a block of quay stone through the plane, paved, 2.4 m clear all round
  for (const isl of [P.isle, P.isle2]) if (isl) {
    // (the first islet's quay is 1.5 m clear, not 2.4: it lay as a slab beside the arc)
    const [ix, iz, nx, nz] = isl, mg = isl === P.isle ? 1.5 : 2.4, hl = P.ROOMD + mg, hw = 1.5 * P.bay * 0.95 + mg, y = isl === P.isle ? 2 : P.DECK;
    const I =(u, v, yy) => [ix + nx * u - nz * v, yy, iz + nz * u + nx * v];
    const first = isl === P.isle, cp = first ? 0.18 : 0;
    g.kind(KIND.PAVE).col(pal.pave).quad(I(-hl - cp, -hw - cp, y), I(-hl - cp, hw + cp, y), I(hl + cp, hw + cp, y), I(hl + cp, -hw - cp, y), [0, 1, 0]);
    g.kind(KIND.STONE).col(pal.quay);
    if (!first) for (const s of [1, -1]) {
      g.quad(I(hl * s, -hw, 0), I(hl * s, hw, 0), I(hl * s, hw, y), I(hl * s, -hw, y), [nx * s, 0, nz * s]);
      g.quad(I(-hl, hw * s, 0), I(hl, hw * s, 0), I(hl, hw * s, y), I(-hl, hw * s, y), [-nz * s, 0, nx * s]);
    }
    // (the bay's house stood on a thin slab, as if floating.) THE FIRST ISLET IS
    // A PLINTH ON LOW ARCHES, 2 m over the plane: each of its four faces is a row of round arches that spring AT the plane,
    // dark within, so the piers between them go down through the plane and each arch closes with its double into
    // a whole ring; over them a coping of pale stone, 0.18 m out. (Its two stepped courses are gone: they were
    // the thin slab. The second islet keeps its stepped quay and its bridge.)
    if (first) for (const s of [1, -1]) {
      // (1.2 m high the plinth was a strip with dots. It stands 2 m over the plane: five
      // arches of 1.25 m at most under each front, four under each side, with stout piers between)
      const nU = 5, nV = 4, RU = Math.min(1.25, hw / nU - 0.22), RV = Math.min(1.25, hl / nV - 0.22), F = (u, v) => { const q = I(u, v, 0); return [q[0], q[2]]; };
      for (let i = 0; i < nU; i++) archPanel(g, F(hl * s, -hw + 2 * hw * i / nU), F(hl * s, -hw + 2 * hw * (i + 1) / nU), y, RU, [nx * s, nz * s], 1.0, pal, true, 6);
      for (let i = 0; i < nV; i++) archPanel(g, F(-hl + 2 * hl * i / nV, hw * s), F(-hl + 2 * hl * (i + 1) / nV, hw * s), y, RV, [-nz * s, nx * s], 1.0, pal, true, 6);
      g.kind(KIND.STONE).col(pal.parapet);
      g.quad(I((hl + cp) * s, -hw - cp, y - 0.24), I((hl + cp) * s, hw + cp, y - 0.24), I((hl + cp) * s, hw + cp, y), I((hl + cp) * s, -hw - cp, y), [nx * s, 0, nz * s]);
      g.quad(I(-hl - cp, (hw + cp) * s, y - 0.24), I(hl + cp, (hw + cp) * s, y - 0.24), I(hl + cp, (hw + cp) * s, y), I(-hl - cp, (hw + cp) * s, y), [-nz * s, 0, nx * s]);
    }
    // (step 2) A WATER STAIR on the face toward the bay's mouth: five steps 2.6 m wide go down from the deck to
    // the plane (and meet their doubles there). THREE MOORING POSTS stand in the water by it, each one post
    // through the plane with its double
    if (first) {
      // (with the plinth at 2 m: five steps of a third of a metre; the posts further out)
      for (let i = 0; i < 5; i++) {
        const u0 = hl + cp + 0.4 * i, u1 = u0 + 0.4, ys = y * (5 - i) / 6;
        g.kind(KIND.PAVE).col(mulc(pal.pave, 0.96)).quad(I(u0, -1.3, ys), I(u0, 1.3, ys), I(u1, 1.3, ys), I(u1, -1.3, ys), [0, 1, 0]);
        g.kind(KIND.STONE).col(mulc(pal.quay, 1.06)).quad(I(u1, -1.3, 0), I(u1, 1.3, 0), I(u1, 1.3, ys), I(u1, -1.3, ys), [nx, 0, nz]);
        for (const s of [1, -1]) g.quad(I(u0, 1.3 * s, 0), I(u1, 1.3 * s, 0), I(u1, 1.3 * s, ys), I(u0, 1.3 * s, ys), [-nz * s, 0, nx * s]);
      }
      // (MENDING 6, M1: the three posts take the one form of every mooring post: no pale head, 2.4 m, 0.3 m thick)
      for (const [pu, pv] of [[hl + 3.3, -2.2], [hl + 3.3, 2.2], [hl + 1.6, 5.4]]) { const q = I(pu, pv, 0); mooringPile(g, pal, q[0], q[2]); }
    }
    // (round 3, C6) A LOW CUT-STONE QUAY WITH STEPS, not a rounded rock: two courses of cut stone step down
    // round the block to the water (0.8 m high and 0.4 m out; 0.4 m high and 0.9 m out), and a stone bollard
    // stands at two corners (the rock apron of stage B is gone)
    for (const [out, yc] of first ? [] : [[0.4, 0.8], [0.9, 0.4]]) {
      const a = hl + out, b = hw + out;
      g.kind(KIND.PAVE).col(mulc(pal.pave, 0.94)).quad(I(-a, -b, yc), I(-a, b, yc), I(a, b, yc), I(a, -b, yc), [0, 1, 0]);
      g.kind(KIND.STONE).col(mulc(pal.quay, 1.06));
      for (const s of [1, -1]) {
        g.quad(I(a * s, -b, 0), I(a * s, b, 0), I(a * s, b, yc), I(a * s, -b, yc), [nx * s, 0, nz * s]);
        g.quad(I(-a, b * s, 0), I(a, b * s, 0), I(a, b * s, yc), I(-a, b * s, yc), [-nz * s, 0, nx * s]);
      }
    }
    for (const s of [1, -1]) { const c = I((hl - 0.5) * s, (hw - 0.5) * s, 0); g.kind(KIND.STONE).col(mulc(pal.quay, 0.8)).box(c[0] - 0.16, y, c[2] - 0.16, c[0] + 0.16, y + 0.62, c[2] + 0.16); }
    // (round 3, B5) THE SECOND ISLET IS JOINED TO THE HORN'S QUAY END BY A SMALL BRIDGE OF ONE ROUND ARCH that
    // springs at the plane (so it closes with its double into a ring): a humped footway 2.4 m wide between low
    // parapets, a ramp up from each deck. (The first islet stands where the line passes between it and the quay
    // 4.3 m over the water: no bridge can stand there.)
    if (isl === P.isle2) {
      const q = P.pos(P.RQ + 1.5, P.aMax), L0 = Math.hypot(q[0] - ix, q[1] - iz), dx = (q[0] - ix) / L0, dz = (q[1] - iz) / L0;
      const t0 = Math.min(hl / Math.max(1e-3, Math.abs(dx * nx + dz * nz)), hw / Math.max(1e-3, Math.abs(dz * nx - dx * nz))) - 0.4;
      const Lb = L0 - t0 + 0.4, hb = 1.2, R = Math.min(3, Math.max(1.8, (Lb - 7) / 2)), yTop = R + 0.55, s1 = Lb / 2 - R - 0.5, s2 = Lb / 2 + R + 0.5;
      const Bq = (s, wv, yy) => [ix + dx * (t0 + s) - dz * wv, yy, iz + dz * (t0 + s) + dx * wv], F = (s, wv) => { const b = Bq(s, wv, 0); return [b[0], b[2]]; };
      for (const sd of [1, -1]) {
        const N = [-dz * sd, 0, dx * sd];
        archPanel(g, F(s1, hb * sd), F(s2, hb * sd), yTop, R, [N[0], N[2]], sd > 0 ? 2 * hb : 0.01, pal, false, 8, 0, 0.25);
        g.kind(KIND.STONE).col(pal.quay);
        g.quad(Bq(0, hb * sd, 0), Bq(s1, hb * sd, 0), Bq(s1, hb * sd, yTop), Bq(0, hb * sd, y), N);
        g.quad(Bq(s2, hb * sd, 0), Bq(Lb, hb * sd, 0), Bq(Lb, hb * sd, y), Bq(s2, hb * sd, yTop), N);
        g.col(pal.parapet);
        for (const [sa, ya, sb, yb] of [[0, y, s1, yTop], [s1, yTop, s2, yTop], [s2, yTop, Lb, y]])
          g.quad(Bq(sa, hb * sd, ya), Bq(sb, hb * sd, yb), Bq(sb, hb * sd, yb + 0.6), Bq(sa, hb * sd, ya + 0.6), N);
      }
      g.kind(KIND.PAVE).col(pal.pave);
      for (const [sa, ya, sb, yb] of [[0, y, s1, yTop], [s1, yTop, s2, yTop], [s2, yTop, Lb, y]])
        g.quad(Bq(sa, -hb, ya), Bq(sb, -hb, yb), Bq(sb, hb, yb), Bq(sa, hb, ya), [0, 1, 0]);
    }
  }
  return { g, bridges: [] };
}

// ---------------------------------------------------------------- the causeway on great arches, the jetty, the ring's hoop
// The causeway runs from the east bastion's tip along the bay's mouth to the west horn; every arch springs at the
// waterline, so each is a whole ring with its double. The jetty leaves a pier's foot into the bay.
export function makeCauseway(P, pal) {
  // (round 2: the deck is street 1's level, 19.2 m: the rings are 15.8 m in radius, 31.6 m across with their doubles)
  const g = makeGeo(), R = Math.min(22, P.rimY - 3.4), pier = 6, pitch = 2 * R + pier, half = 3, deckY = P.rimY;
  const S = P.pos(P.RQ, P.aI + P.alpha + 3.2 / P.RQ), E = P.pos(P.RQ, -P.aMax);
  const L = Math.hypot(E[0] - S[0], E[1] - S[1]), d = [(E[0] - S[0]) / L, (E[1] - S[1]) / L];
  // north = the side toward the bay (left of the heading d when d points west and the bay lies at -z)
  let nb = [-d[1], d[0]];
  if (nb[1] > 0) nb = [d[1], -d[0]];
  const at = (s, o) => [S[0] + d[0] * s + nb[0] * o, S[1] + d[1] * s + nb[1] * o];
  const n = Math.floor((L - 16) / pitch), lead = (L - n * pitch) / 2, centres = [];
  const wall = (s0, s1, o, sg) => {
    // (stage F: the leads are of the bastions' stone, kind WALL with its string course and coping: a short piece is
    // one pilaster (no arch is cut by its end), a long one carries blind arches set from its middle)
    const A = at(s0, o), B = at(s1, o), l = s1 - s0, u0 = l < 4 ? -l / 2 : 3.2 - l / 2, u1 = u0 + l;
    g.kind(KIND.WALL).move(deckY).col(pal.bastion).quad([A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], deckY, B[1]], [A[0], deckY, A[1]], [nb[0] * sg, 0, nb[1] * sg], [u0, 0, u1, 0, u1, deckY, u0, deckY]).move(0);
  };
  // (round 2: each end's lead is no blank slab: where it is long enough a lesser ring stands in it, 3 m of pier
  // each side, whole with its double like the great ones; THE LOOK sees the east one beside the basin)
  const Rl = (lead - 8) / 2;
  for (const [s0, s1, e0, e1] of [[2, lead, 0, 2], [L - lead, L - 2, L - 2, L]]) {
    for (const sg of [1, -1]) { if (Rl < 5) wall(Math.min(s0, e0), Math.max(s1, e1), half * sg, sg); else wall(e0, e1, half * sg, sg); }
    if (Rl < 5) continue;
    archPanel(g, at(s0, half), at(s1, half), deckY, Rl, nb, 2 * half, pal, false, 10, 0, 1.2);
    archPanel(g, at(s0, -half), at(s1, -half), deckY, Rl, [-nb[0], -nb[1]], 0, pal, false, 10, 0, 1.2);
  }
  // (the lead's eye from the west terrace: "a large plain grey wall fills the left": it is the east lead's face over
  // the harbour's mouth, 12 m of bare stone above its lesser ring, seen between and over the mole row's roofs.)
  // A BLIND ARCADE OF THE BASTIONS' STONE stands on that face above the ring's crown, up to the string course
  // under the street: kind WALL, its arches set from the middle, with pilasters, a course and a coping
  if (Rl >= 5 && deckY - Rl > 7.5) {
    const yA = Rl + 2.6, hA = deckY - 0.56 - yA, l = lead - 0.6, A = at(0.3, half + 0.07), B = at(lead - 0.3, half + 0.07);
    g.kind(KIND.WALL).move(hA).col(pal.bastion).quad([A[0], yA, A[1]], [B[0], yA, B[1]], [B[0], yA + hA, B[1]], [A[0], yA + hA, A[1]], [nb[0], 0, nb[1]], [3.2 - l / 2, 0, 3.2 + l / 2, 0, 3.2 + l / 2, hA, 3.2 - l / 2, hA]).move(0);
  }
  for (let i = 0; i < n; i++) {
    const s0 = lead + i * pitch, s1 = s0 + pitch;
    archPanel(g, at(s0, half), at(s1, half), deckY, R, nb, 2 * half, pal, false, 14, 0, 1.5);
    archPanel(g, at(s0, -half), at(s1, -half), deckY, R, [-nb[0], -nb[1]], 0, pal, false, 14, 0, 1.5);
    centres.push({ s: (s0 + s1) / 2, p: at((s0 + s1) / 2, 0) });
  }
  // deck and parapets
  const Q = (s, o, y) => { const p = at(s, o); return [p[0], y, p[1]]; };
  // a buttress on each face of every pier, with a sloped head; a string course under the parapet
  for (let i = 0; i <= n; i++) for (const sg of [1, -1]) {
    const sm = lead + i * pitch, o0 = half * sg, o1 = (half + 1.3) * sg, yb = deckY - 3.2, N = [nb[0] * sg, 0, nb[1] * sg];
    g.kind(KIND.STONE).col(mulc(pal.quay, 1.08));
    g.quad(Q(sm - 1.7, o1, 0), Q(sm + 1.7, o1, 0), Q(sm + 1.7, o1, yb), Q(sm - 1.7, o1, yb), N);
    g.quad(Q(sm - 1.7, o0, 0), Q(sm - 1.7, o1, 0), Q(sm - 1.7, o1, yb), Q(sm - 1.7, o0, yb + 1.6), [-d[0], 0, -d[1]]);
    g.quad(Q(sm + 1.7, o1, 0), Q(sm + 1.7, o0, 0), Q(sm + 1.7, o0, yb + 1.6), Q(sm + 1.7, o1, yb), [d[0], 0, d[1]]);
    g.quad(Q(sm - 1.7, o1, yb), Q(sm + 1.7, o1, yb), Q(sm + 1.7, o0, yb + 1.6), Q(sm - 1.7, o0, yb + 1.6), [N[0] * 0.63, 0.78, N[2] * 0.63]);
  }
  for (const sg of [1, -1]) {
    const o0 = half * sg, o1 = (half + 0.16) * sg, N = [nb[0] * sg, 0, nb[1] * sg];
    g.kind(KIND.STONE).col(pal.parapet);
    g.quad(Q(0, o1, deckY - 0.55), Q(L, o1, deckY - 0.55), Q(L, o1, deckY - 0.05), Q(0, o1, deckY - 0.05), N);
    g.quad(Q(0, o0, deckY - 0.55), Q(L, o0, deckY - 0.55), Q(L, o1, deckY - 0.55), Q(0, o1, deckY - 0.55), [0, -1, 0]);
    // (seen from the lake side the wall over the great arch stood bare.) PLAIN BRACKETS UNDER THE STRING COURSE
    // along the great arches' run, both faces: a stone bracket every 3 m, half a metre wide and 0.7 m high, a
    // wedge that grows out of the wall's face to carry the course. (ROUND 5 MENDING 6, M3a: the band pierced by a
    // row of small openings is gone: it read as a fortress's machicolation. No opening, nothing dark)
    const sA = lead, sB = L - lead, nBr = Math.max(1, Math.round((sB - sA) / 3)), yc0 = deckY - 1.25, yc1 = deckY - 0.55, bw = 0.25;
    for (let i = 0; i < nBr; i++) {
      const sc = sA + (sB - sA) * (i + 0.5) / nBr;
      g.quad(Q(sc - bw, o0, yc0), Q(sc + bw, o0, yc0), Q(sc + bw, o1, yc1), Q(sc - bw, o1, yc1), [N[0] * 0.97, -0.22, N[2] * 0.97]);
      for (const e of [1, -1]) g.tri(...[Q(sc + bw * e, o0, yc0), Q(sc + bw * e, o0, yc1), Q(sc + bw * e, o1, yc1)].map((q) => g.vert(q[0], q[1], q[2], d[0] * e, 0, d[1] * e)));
    }
  }
  g.kind(KIND.PAVE).col(pal.pave).quad(Q(0, half, deckY), Q(L, half, deckY), Q(L, -half, deckY), Q(0, -half, deckY), [0, 1, 0]);
  g.kind(KIND.STONE).col(pal.parapet);
  for (const sg of [1, -1]) {
    const o = half * sg, oi = (half - 0.35) * sg, N = [nb[0] * sg, 0, nb[1] * sg];
    // ROUND 2: THE CAUSEWAY IS A CITY STREET: its parapets are balustrades under a coping (not blank walls)
    g.kind(KIND.STONE).col(pal.parapet).quad(Q(0, o, deckY + 1.1), Q(L, o, deckY + 1.1), Q(L, oi, deckY + 1.1), Q(0, oi, deckY + 1.1), [0, 1, 0]);
    g.quad(Q(0, o, deckY + 0.98), Q(L, o, deckY + 0.98), Q(L, o, deckY + 1.1), Q(0, o, deckY + 1.1), N);
    g.kind(KIND.RAIL).quad(Q(0, o, deckY), Q(L, o, deckY), Q(L, o, deckY + 1.0), Q(0, o, deckY + 1.0), N);
  }
  // lamp posts on the coping at every pier, both sides; and THE GATE HOUSES: on three piers (the two beside the
  // jetty's ring, and one far along) a veranda house stands out over the water on each side of the street, on a
  // pier of quay stone that goes down through the plane (the houses themselves are laid with the houses)
  const posts = [], gates = [], gd = P.ROOMD + 0.3;
  for (let i = 0; i <= n; i++) for (const sg of [1, -1]) {
    const p = at(lead + i * pitch, (half - 0.17) * sg);
    posts.push({ x: p[0], z: p[1], y0: deckY + 1.1, y1: deckY + 4.3, ax: -nb[0] * sg, az: -nb[1] * sg });
  }
  for (const i of [1, 2, n - 3]) for (const sg of [1, -1]) {
    if (i < 1 || i > n - 1) continue;
    const sm = lead + i * pitch, o0 = half * sg, o1 = (half + gd + 0.4) * sg, N = [nb[0] * sg, 0, nb[1] * sg], f = at(sm, (half + gd) * sg);
    gates.push([f[0], f[1], N[0], N[2]]);
    g.kind(KIND.STONE).col(mulc(pal.quay, 1.08));
    g.quad(Q(sm - 3, o1, 0), Q(sm + 3, o1, 0), Q(sm + 3, o1, deckY), Q(sm - 3, o1, deckY), N);
    g.quad(Q(sm - 3, o0, 0), Q(sm - 3, o1, 0), Q(sm - 3, o1, deckY), Q(sm - 3, o0, deckY), [-d[0], 0, -d[1]]);
    g.quad(Q(sm + 3, o1, 0), Q(sm + 3, o0, 0), Q(sm + 3, o0, deckY), Q(sm + 3, o1, deckY), [d[0], 0, d[1]]);
    g.kind(KIND.PAVE).col(pal.pave).quad(Q(sm - 3, o0, deckY), Q(sm + 3, o0, deckY), Q(sm + 3, o1, deckY), Q(sm - 3, o1, deckY), [0, 1, 0]);
  }
  // (round 3, B-i) THE MOLE ROW: no blank wall toward the harbour. Before the causeway's first lead, on the
  // harbour's side, a low quay 7.4 m deep (on the quay's small arches) carries three roofed houses that face the
  // harbour and stand against the wall: [metres out from the pier, width, storeys]; laid with the houses
  {
    const s0 = 1, s1 = Math.min(23, lead - 0.7), oA = half, oB = half + 7.4, nM = Math.max(1, Math.round((s1 - s0) / 3.7));
    for (let i = 0; i < nM; i++) archPanel(g, at(s0 + (s1 - s0) * i / nM, oB), at(s0 + (s1 - s0) * (i + 1) / nM, oB), P.DECK, 0.86, nb, 1.1, pal, true, 6);
    g.kind(KIND.STONE).col(pal.quay);
    g.quad(Q(s0, oA, 0), Q(s0, oB, 0), Q(s0, oB, P.DECK), Q(s0, oA, P.DECK), [-d[0], 0, -d[1]]);
    g.quad(Q(s1, oB, 0), Q(s1, oA, 0), Q(s1, oA, P.DECK), Q(s1, oB, P.DECK), [d[0], 0, d[1]]);
    g.kind(KIND.PAVE).col(pal.pave).quad(Q(s0, oA, P.DECK), Q(s1, oA, P.DECK), Q(s1, oB, P.DECK), Q(s0, oB, P.DECK), [0, 1, 0]);
    P.moleRow = [[2.6, 5.4, 5], [10.0, 6.4, 6], [18.4, 4.4, 4]].filter(([m0, w]) => m0 + w <= s1 - 0.2).map(([m0, w, fl]) => {
      const f = at(m0 + w / 2, oB - 1.5);
      return [f[0], f[1], nb[0], nb[1], w, fl];
    });
  }
  // the jetty (timber on piles that run through the plane)
  // ROUND 2: the jetty lies ON THE AXIS OF THE SECOND RING from the bastion (ring 1), from 5 m inside the arch
  // straight toward the quay, and ends 28 m short of it: the line comes through that ring and runs along it
  const jA = Math.min(n - 1, 1), sJ = lead + (jA + 0.5) * pitch, jd = [nb[0], nb[1]], J0 = at(sJ, half + 5);
  const bq = J0[0] * jd[0] + J0[1] * jd[1], cq = J0[0] * J0[0] + J0[1] * J0[1] - P.RQ * P.RQ, tq = -bq + Math.sqrt(bq * bq - cq);
  const JL = Math.max(40, Math.min(100, tq - 44)), jw = 1.6, jy = 2.2, jn = [-jd[1], jd[0]];
  const JQ = (s, o, y) => [J0[0] + jd[0] * s + jn[0] * o, y, J0[1] + jd[1] * s + jn[1] * o];
  // (from over its own deck the jetty read as a flat dark red wedge.) THE DECK IS OF WEATHERED
  // PLANKS: a grey-brown, and the shader lays planks across it with seams and an edge beam along each side (the
  // quad's second figure 7 names it; u = metres along, v = metres across from the middle). Place and size as before
  // (in the causeway's shade that brown stood maroon and near black: a paler, greyer wood)
  g.kind(KIND.TIMBER).col([0.42, 0.37, 0.3]).move(7);
  g.quad(JQ(0, jw, jy), JQ(JL, jw, jy), JQ(JL, -jw, jy), JQ(0, -jw, jy), [0, 1, 0], [0, jw, JL, jw, JL, -jw, 0, -jw]).move(0);
  g.col(mixc(pal.deck, [0.27, 0.21, 0.145], 0.5));
  g.quad(JQ(0, jw, jy - 0.25), JQ(JL, jw, jy - 0.25), JQ(JL, -jw, jy - 0.25), JQ(0, -jw, jy - 0.25), [0, -1, 0]);
  for (const sg of [1, -1]) g.quad(JQ(0, jw * sg, jy - 0.25), JQ(JL, jw * sg, jy - 0.25), JQ(JL, jw * sg, jy), JQ(0, jw * sg, jy), [jn[0] * sg, 0, jn[1] * sg]);
  g.quad(JQ(JL, jw, jy - 0.25), JQ(JL, -jw, jy - 0.25), JQ(JL, -jw, jy), JQ(JL, jw, jy), [jd[0], 0, jd[1]]);
  // piles go through the plane: each pile and its double are one post (a join only built things have)
  const piles = [];
  for (let s = 3; s < JL; s += 6.25) for (const sg of [1, -1]) {
    // (mending 5, step 3c: THE PILES' HEADS SHOW: every pile stands 0.22 m over the deck (each third one 0.45 m)
    // and its cut head is of paler end grain)
    const top = (Math.round(s / 6.25) % 3 === 0) ? jy + 0.45 : jy + 0.22, o = (jw + 0.12) * sg;
    g.kind(KIND.TIMBER).col(mulc(pal.timber, 1.12)).quad(JQ(s - 0.11, o - 0.11, top), JQ(s + 0.11, o - 0.11, top), JQ(s + 0.11, o + 0.11, top), JQ(s - 0.11, o + 0.11, top), [0, 1, 0]);
    const a = JQ(s - 0.11, o - 0.11, 0), b = JQ(s + 0.11, o + 0.11, top);
    g.kind(KIND.TIMBER).col(mulc(pal.timber, 0.8));
    g.quad(JQ(s - 0.11, o - 0.11, 0), JQ(s + 0.11, o - 0.11, 0), JQ(s + 0.11, o - 0.11, top), JQ(s - 0.11, o - 0.11, top), [-jn[0], 0, -jn[1]]);
    g.quad(JQ(s - 0.11, o + 0.11, 0), JQ(s + 0.11, o + 0.11, 0), JQ(s + 0.11, o + 0.11, top), JQ(s - 0.11, o + 0.11, top), [jn[0], 0, jn[1]]);
    g.quad(JQ(s - 0.11, o - 0.11, 0), JQ(s - 0.11, o + 0.11, 0), JQ(s - 0.11, o + 0.11, top), JQ(s - 0.11, o - 0.11, top), [-jd[0], 0, -jd[1]]);
    g.quad(JQ(s + 0.11, o - 0.11, 0), JQ(s + 0.11, o + 0.11, 0), JQ(s + 0.11, o + 0.11, top), JQ(s + 0.11, o - 0.11, top), [jd[0], 0, jd[1]]);
    piles.push({ x: (a[0] + b[0]) / 2, z: (a[2] + b[2]) / 2, top });
    // THE JETTY'S LAMPS: a low lantern post on every second pile, both sides (1.1 m over the deck: the line keeps
    // its 2.5 m of clear air 3.2 m above the deck between them)
    if (Math.round(s / 6.25) % 2 === 1) { const q = JQ(s, o, 0); posts.push({ x: q[0], z: q[2], y0: jy - 0.05, y1: jy + 1.1, ax: 0, az: 0 }); }
  }
  return { g, S, E, d, nb, L, lead, pitch, R, half, gd, deckY, centres, at, posts, gates, jetty: { J0, jd, jn, JL, jw, jy, piles, sJ } };
}

// ---------------------------------------------------------------- boats, mooring posts, floats and leaves
// A small open boat, flat on the plane (keel to keel with its double), 5 m long; it rolls and bobs by the shader's law.
export function boatGeo(pal) {
  const g = makeGeo().kind(KIND.BOAT).col([1, 1, 1]);
  const st = [[-2.5, 0.42], [-1.3, 0.7], [0, 0.76], [1.3, 0.6], [2.5, 0.03]];
  for (let i = 0; i + 1 < st.length; i++) {
    const [z0, w0] = st[i], [z1, w1] = st[i + 1];
    for (const sg of [1, -1]) {
      g.quad([sg * w0 * 0.72, 0.01, z0], [sg * w1 * 0.72, 0.01, z1], [sg * w1, 0.5, z1], [sg * w0, 0.5, z0], [sg * 0.92, -0.38, 0]);
      // (stage F) A DARK GUNWALE along the hull's top, outside and in (it darkens whatever colour the boat is dealt)
      // (round 3, C6: the gunwale a mid brown, not near black: a moored boat in shade read as a black bar)
      g.col([0.42, 0.36, 0.3]);
      g.quad([sg * (w0 + 0.03), 0.39, z0], [sg * (w1 + 0.03), 0.39, z1], [sg * (w1 + 0.03), 0.54, z1], [sg * (w0 + 0.03), 0.54, z0], [sg * 0.98, 0.2, 0]);
      g.quad([sg * (w1 + 0.03), 0.54, z1], [sg * (w1 - 0.07), 0.54, z1], [sg * (w0 - 0.07), 0.54, z0], [sg * (w0 + 0.03), 0.54, z0], [0, 1, 0]);
      g.col([1, 1, 1]);
    }
    // (round 3, B3) FROM ABOVE A BOAT READS AS A BOAT: inside the painted hull the bottom boards are bare pale
    // timber (w = 1: their own colour, whatever the hull is dealt), with a dark keelson down the middle
    g.move(1).col([0.6, 0.5, 0.36]).quad([-w0 * 0.72, 0.03, z0], [w0 * 0.72, 0.03, z0], [w1 * 0.72, 0.03, z1], [-w1 * 0.72, 0.03, z1], [0, 1, 0]).move(0).col([1, 1, 1]);
  }
  g.quad([-0.42, 0.01, -2.5], [0.42, 0.01, -2.5], [0.42, 0.5, -2.5], [-0.42, 0.5, -2.5], [0, 0, -1]);
  g.move(1).col([0.24, 0.2, 0.16]).box(-0.05, 0.03, -2.3, 0.05, 0.06, 2.1, 'y');
  // three thwarts of bare timber and a stern sheet
  g.col([0.8, 0.7, 0.52]).box(-0.7, 0.3, -1.0, 0.7, 0.34, -0.72, 'y').box(-0.7, 0.3, -0.1, 0.7, 0.34, 0.16, 'y').box(-0.62, 0.3, 1.0, 0.62, 0.34, 1.24, 'y').box(-0.44, 0.3, -2.45, 0.44, 0.34, -1.95, 'y');
  // two oars shipped along the thwarts, each with its blade; and the painter, slack from the stem into the water
  g.col([0.9, 0.84, 0.68]).box(-0.4, 0.36, -1.9, -0.34, 0.4, 1.3, 'y').box(-0.47, 0.36, 1.3, -0.27, 0.39, 1.9, 'y').box(0.3, 0.36, -1.5, 0.36, 0.4, 1.7, 'y').box(0.23, 0.36, -2.1, 0.43, 0.39, -1.5, 'y');
  g.col([0.3, 0.26, 0.2]).quad([-0.04, 0.5, 2.5], [0.04, 0.5, 2.5], [0.04, 0.02, 3.5], [-0.04, 0.02, 3.5], [0, 0.9, 0.44]).move(0);
  return g.build();
}
export function floatGeo() {
  const g = makeGeo().kind(KIND.BOAT).col([1, 1, 1]), r = 0.16, e = [[r, 0, 0], [0, 0, r], [-r, 0, 0], [0, 0, -r]];
  for (let i = 0; i < 4; i++) {
    const p = e[i], q = e[(i + 1) % 4], n = [(p[0] + q[0]) * 3, 0.6, (p[2] + q[2]) * 3];
    const a = g.vert(0, r, 0, n[0], n[1], n[2]), b = g.vert(p[0], 0, p[2], n[0], n[1], n[2]), c = g.vert(q[0], 0, q[2], n[0], n[1], n[2]);
    g.tri(a, b, c);
  }
  return g.build();
}
export function leafGeo() {
  return makeGeo().kind(KIND.LEAF).col([1, 1, 1]).move(0.35).quad([-0.09, 0.012, -0.05], [0.09, 0.012, -0.05], [0.09, 0.012, 0.05], [-0.09, 0.012, 0.05], [0, 1, 0]).build();
}
// where the boats lie: along the quay (more of them by the visit's density), in the inlet, at the jetty; each with its
// post. keep(what, x, yTop, z, margin) is the one rule of the line (see buildHero): true where the thing may lie.
// (L8) the mooring's typed figures: a post stands MOOR_OFF metres from the quay's face (and from the jetty's axis),
// no two of those posts, nor of the roadstead's, nearer than MOOR_GAP (not asked of the field's row nor of the
// harbour's berth posts), MOOR_POST high over the plane; the mooring field's row of MOOR_ROW posts stands
// MOOR_FIELD metres off the gate houses' lake faces
const MOOR_OFF = [12, 20], MOOR_GAP = 13, MOOR_POST = 2.4, MOOR_FIELD = 10, MOOR_ROW = 8;
// MOOR_STAG: every second post of the mooring field's row stands this far out of the row's line toward the
// lake, by its place in the row and not by a draw (the row is no even rank)
export const MOOR_STAG = 2.5;
// (ROUND 5 MENDING 6, M1) THE POST AND ITS BOAT, one rule for every mooring of the world: a boat lies BESIDE its
// post, never before or behind it: the post stands MOOR_BESIDE metres off the hull's axis (the hull is 1.6 m
// wide at its widest, so the nearest gunwale is 1.4 m and more from the post) and abreast of the hull's quarter,
// MOOR_QUARTER metres from the hull's middle along its axis (the hull is 5 m long)
const MOOR_BESIDE = 2.2, MOOR_QUARTER = 1.5;
// (M1) ONE FORM FOR EVERY MOORING POST OF THE WORLD (quay, harbour, jetty, field, the first islet), and every one
// stands in the water: a plain TALL pile of one timber tone from the plane to its top (second figure 8: the shader
// lays no damp band on it), MOOR_POST over the plane, 0.3 m thick, its top cut on a slant in the same tone (no
// cap, no band, no head), and A SMALL DARK IRON RING, 0.25 m across, that hangs flat at its side at half height
// (returned: the ring's height)
function mooringPile(g, pal, x, z) {
  const y1 = MOOR_POST, ys = y1 - 0.24, pw = 0.15, yr = y1 / 2, xr = x + pw + 0.02;
  g.kind(KIND.TIMBER).move(8).col(mulc(pal.timber, 0.75)).box(x - pw, 0, z - pw, x + pw, ys, z + pw, 'yY');
  g.quad([x - pw, ys, z - pw], [x - pw, ys, z + pw], [x + pw, y1, z + pw], [x + pw, y1, z - pw], [-0.62, 0.78, 0]);
  g.quad([x + pw, ys, z - pw], [x + pw, ys, z + pw], [x + pw, y1, z + pw], [x + pw, y1, z - pw], [1, 0, 0]);
  for (const s of [1, -1]) g.quad([x - pw, ys, z + pw * s], [x + pw, ys, z + pw * s], [x + pw, y1, z + pw * s], [x + pw, y1, z + pw * s], [0, 0, s]);
  g.move(0).col([0.2, 0.2, 0.22]);
  for (const [ya, yb, za, zb] of [[0.09, 0.125, -0.125, 0.125], [-0.125, -0.09, -0.125, 0.125], [-0.09, 0.09, -0.125, -0.09], [-0.09, 0.09, 0.09, 0.125]]) g.box(xr, yr + ya, z + za, xr + 0.035, yr + yb, z + zb, 'x');
  return yr;
}
// (ROAD_N: how many boats the roadstead has; ROAD_OFF: a pile's distance from the rock's outline; ROAD_SPAN:
// the roadstead's reach along the rock's axis, 0.6 of it to either hand of the rock's middle, whatever the
// rock's own length: so the piles keep their MOOR_GAP)
export const ROAD_N = [2, 3], ROAD_OFF = [15, 40], ROAD_SPAN = 68;
export function layBoats(P, C, rng, pal, density, keep, avoid = [], far = () => 0, road = null) {
  const boats = [], posts = [], floats = [], leaves = [], rings = [];
  let rs = rng;
  // nothing lies where a water stair goes down (avoid: the stairs' places)
  const clear = (x, z) => { for (const s of avoid) if (Math.hypot(x - s.x, z - s.z) < s.r) return false; return true; };
  // (MENDING 6, M1) NO POST STANDS OVER OR HARD BY ANY HULL: every post keeps MOOR_BESIDE metres from the axis
  // of every hull, its own boat's and every other's (offAxis: a point's distance from a hull's 5 m axis). Asked
  // after the draws; of two that would crowd, the later comer goes
  const hulls = [];
  const offAxis = (b, qx, qz) => { const t = Math.max(-2.5, Math.min(2.5, (qx - b[0]) * b[2] + (qz - b[1]) * b[3])); return Math.hypot(qx - b[0] - b[2] * t, qz - b[1] - b[3] * t); };
  // NO HULL LIES IN OR HARD BY ANOTHER: HULL_GAP 1.5 m of clear water and more between
  // any two hulls' outlines, wherever they lie (the outline is the gunwale's, through the hull's five stations).
  // Asked after the draws, like the post: of two that would crowd, the later comer is not laid (nor its post);
  // no draw is added or left out. Every boat laid enters `hulls` ([x, z, the bow's unit direction])
  const HULL_GAP = 1.5, HULL_ST = [[-2.5, 0.45], [-1.3, 0.73], [0, 0.79], [1.3, 0.63], [2.5, 0.06]];
  const outline = (b) => [1, -1].flatMap((sg) => (sg > 0 ? HULL_ST : [...HULL_ST].reverse()).map(([t, w]) => [b[0] + b[2] * t + b[3] * w * sg, b[1] + b[3] * t - b[2] * w * sg]));
  const ptSeg = (p, a, c) => { const ex = c[0] - a[0], ez = c[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / (ex * ex + ez * ez || 1))); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
  const turnOf = (u, v, w) => (v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]);
  const hullGap = (A, B) => {
    let m = Infinity;
    for (let i = 0; i < A.length; i++) for (let j = 0; j < B.length; j++) {
      const a = A[i], c = A[(i + 1) % A.length], p = B[j], q = B[(j + 1) % B.length];
      if (turnOf(a, c, p) * turnOf(a, c, q) < 0 && turnOf(p, q, a) * turnOf(p, q, c) < 0) return 0;   // two edges cross
      m = Math.min(m, ptSeg(a, p, q), ptSeg(p, a, c));
    }
    return m;
  };
  const hullCrowd = (b) => { const B = outline(b); return hulls.some((o) => Math.hypot(o[0] - b[0], o[1] - b[1]) < 8 && hullGap(o.o || (o.o = outline(o)), B) < HULL_GAP); };
  const crowded = (b, post) => (post && hulls.some((o) => offAxis(o, post[0], post[1]) < MOOR_BESIDE - 0.01)) || (b && posts.some((q) => offAxis(b, q.x, q.z) < MOOR_BESIDE - 0.01)) || (b && hullCrowd(b));
  const moor = (x, z, hx, hz, px, pz, wp = false) => {
    // (ROUND 5 MENDING 5, L4: DRAW FIRST AND TEST AFTER, here and for every float, leaf and buoy below: the boats'
    // stream runs the same whatever the line does)
    const yaw = Math.atan2(hx, hz), col = mulc(rs.pick(pal.boat), rs.range(0.85, 1.1)), a = [rs(), 0, rs(), 0];   // (rs: the stream of the mooring in hand, see the roadstead)
    // (L6: THE ONE RULE OF THE LINE, asked at the hull's middle and at both its ends; a hull's top is 0.6 m over
    // the plane. No stretch of the quay or of the jetty is typed any more: where a boat may lie is the rule's)
    const hl = 3 / Math.hypot(hx, hz);   // (a hull is 6 m long)
    // (L8: a post that stands in the water, wp, is asked of the rule too: post and boat stand or go together)
    if (wp && !keep('post', px, MOOR_POST, pz)) return;
    if (![0, -1, 1].every((t) => keep('boat', x + hx * hl * t, 0.6, z + hz * hl * t, 3.4)) || !clear(x, z)) return;
    const hu = [x, z, hx * hl / 3, hz * hl / 3];
    if (crowded(hu, [px, pz])) return;
    hulls.push(hu);
    boats.push({ m: new THREE.Matrix4().makeTranslation(x, 0, z).multiply(_r.makeRotationY(yaw)), a, c: col });
    // (g: where the rope meets the boat, the gunwale abreast of the post)
    const al = (px - x) * hu[2] + (pz - z) * hu[3], ox = px - x - hu[2] * al, oz = pz - z - hu[3] * al, gk = 0.5 / (Math.hypot(ox, oz) || 1);
    posts.push({ x: px, z: pz, wp, b: [x, z], g: [x + hu[2] * al + ox * gk, z + hu[3] * al + oz * gk], road: rs !== rng });   // (road: a pile of the roadstead, for the counts)
    rings.push({ x, z });
  };
  // (ROUND 5 MENDING 5, L8) A BOAT MOORED STANDING OFF: its post stands in the water at q; the boat heads along
  // t, turned by `turn` toward w (the open water's side). (MENDING 6, M1: the boat lies BESIDE its post, the post
  // abreast of its stern quarter, and THE POST STANDS ON ITS BOAT'S SIDE TOWARD THE WAY: of the two places beside
  // the post the boat takes the one farther from the flown line (far: a place's distance from the line, a
  // standing thing of the world), so along the whole way a post stands in clear water before its boat, not
  // behind its hull.) No two posts dealt here (off the quay, off the jetty, in the roadstead) stand nearer than
  // MOOR_GAP (asked of every such post dealt, whatever the line's rule then does with it). far(x, 0, z) is the
  // distance IN SPACE from the place on the plane to the line at its height, not the plan's
  const dealt = [];
  const beside = (q, hx, hz, lx, lz) => {
    const ax = hx * MOOR_QUARTER, az = hz * MOOR_QUARTER, bx = lx * MOOR_BESIDE, bz = lz * MOOR_BESIDE;
    const sd = far(q[0] + ax + bx, 0, q[1] + az + bz) >= far(q[0] + ax - bx, 0, q[1] + az - bz) ? 1 : -1;
    moor(q[0] + ax + bx * sd, q[1] + az + bz * sd, hx, hz, q[0], q[1], true);
  };
  const standOff = (q, t, w, turn) => {
    if (dealt.some((e) => Math.hypot(e[0] - q[0], e[1] - q[1]) < MOOR_GAP)) return;
    dealt.push(q);
    const c = Math.cos(turn), s = Math.sin(turn);
    beside(q, t[0] * c + w[0] * s, t[1] * c + w[1] * s, w[0] * c - t[0] * s, w[1] * c - t[1] * s);
  };
  // EVERY FLOAT IS OF CORK OR OF TIMBER (two of cork to one of timber, by its own draw; never a cloth's colour)
  const floatC = (pk, a) => pk < 0.67 ? mulc([0.6, 0.45, 0.29], 0.82 + 0.3 * a[0]) : mulc(pal.timber, 1.05 + 0.25 * a[2]);
  // (L8: ONE RULE FOR THE WHOLE QUAY AND EVERY SEED. Anywhere along the quay, from the west horn to the harbour's
  // mouth, a mooring post with a ring stands in the water MOOR_OFF metres from the quay's face (12 to 20 m, by
  // its draw) and a boat lies moored beside it along the quay, turned a little to the open water. None under way,
  // no figure, no sail; the lower city has the same post and the same boat.
  // ONE HAND FOR ALL, AND IT STAYS (typed, for every mooring off the quay, off the jetty and in the field, on every
  // seed): EVERY BOW HEADS TOWARD THE ONCOMING WAY: along the quay toward the west horn, off the jetty toward the
  // ring, in the field toward the open lake. The way runs the quay from west to east, comes in over the lake to
  // the ring and runs the jetty from the ring to the quay; so a boat is met bow first, and its post, abreast of
  // its stern quarter on the way's side, stands clear of its hull in clear water. THE EXCEPTION, counted: the
  // quay boats 14 to 24 m from the jetty's root (137 of 4,104 on seeds 1 to 300) lie nearest the line's end on
  // the jetty, which passes them a second time from abaft the beam. Not of this hand: the harbour's berth
  // boats, its two free boats and the second islet's four, see below)
  const nQ = Math.round(22 * density);
  for (let i = 0; i < nQ; i++) {
    const a = rng.range(-70, 49) * D2R, off = rng.range(MOOR_OFF[0], MOOR_OFF[1]), turn = rng.range(0.05, 0.4);
    standOff(P.pos(P.RQ - off, a), [-Math.cos(a), -Math.sin(a)], [-Math.sin(a), Math.cos(a)], turn);
  }
  // (round 3, B1/B3) IN THE HARBOUR: boats lie bow on to the west flank and bow on to the head's quay (across the
  // old basin and the east water), each at its post. (MENDING 6, M1: here too the post is a pile that stands in
  // the water BESIDE its boat, abreast of the bow quarter, on the hull's side nearer the line by distance in
  // space; no post stands on a hull's axis. These posts are not asked MOOR_GAP: they stand 4.4 to 22.9 m from
  // the nearest other of them on seeds 1 to 300)
  const berth = (p, hx, hz) => {
    const ax = p[0] + hx * MOOR_QUARTER, az = p[1] + hz * MOOR_QUARTER, bx = hz * MOOR_BESIDE, bz = -hx * MOOR_BESIDE, sd = far(ax + bx, 0, az + bz) <= far(ax - bx, 0, az - bz) ? 1 : -1;
    moor(p[0], p[1], hx, hz, ax + bx * sd, az + bz * sd, true);
  };
  for (let i = 0; i < Math.round(6 * density); i++) {
    const head = rng.chance(0.6), r = rng.range(P.RQ + 6, P.rHQ - 6), ah = rng.range(P.aI - P.alpha + 4 / P.rHQ, P.aI + P.alpha - 4 / P.rHQ);
    if (head) { berth(P.pos(P.rHQ - 3.1, ah), Math.sin(ah), -Math.cos(ah)); continue; }
    berth(P.pos(r, P.aI - P.alpha + 3.0 / r), -Math.cos(P.aI), -Math.sin(P.aI));
  }
  const J = C.jetty;
  for (let i = 0; i < Math.round(3 * density); i++) {
    // (L8: OFF THE JETTY the same rule: a post in the water MOOR_OFF metres from the jetty's axis, on either hand,
    // its boat along the jetty beside it, its bow toward the ring, turned a little away from the jetty)
    const s = rng.range(6, J.JL - 8), sd = rng.chance(0.5) ? 1 : -1, o = rng.range(MOOR_OFF[0], MOOR_OFF[1]) * sd, turn = rng.range(0.05, 0.4);
    standOff([J.J0[0] + J.jd[0] * s + J.jn[0] * o, J.J0[1] + J.jd[1] * s + J.jn[1] * o], [-J.jd[0], -J.jd[1]], [J.jn[0] * sd, J.jn[1] * sd], turn);
  }
  // (ROUND 5 MENDING 5, L8) THE MOORING FIELD ON THE CAUSEWAY'S LAKE SIDE, by a rule of place for every seed: a row
  // of MOOR_ROW posts with rings stands in the water along the causeway, MOOR_FIELD metres off the lake faces of
  // the two gate houses beside the jetty's ring, a quarter of the piers' pitch apart, four on each hand of the
  // ring's fairway. At three to five of them (which, by the boats' stream) a boat lies moored beside its post,
  // its bow to the open lake, turned a little away from the fairway; the other posts stand free
  {
    const o = -(C.half + C.gd + MOOR_FIELD), nB = 3 + Math.floor(rng() * 3);
    const order = Array.from({ length: MOOR_ROW }, (_, j) => [rng(), j]).sort((p, q) => p[0] - q[0]);
    order.forEach(([, j], k) => {
      const s = C.lead + C.pitch * (1.5 + (j - (MOOR_ROW - 1) / 2) / 4), q = C.at(s, o - (j % 2 ? MOOR_STAG : 0)), sg = s < J.sJ ? -1 : 1, turn = rng.range(0.05, 0.4);
      // (MENDING 6, M1: A FIELD BOAT LIES ACROSS THE CAUSEWAY'S LINE, ITS BOW TO THE OPEN LAKE, turned a little
      // away from the ring's fairway, beside its post as every boat does. The way comes in over the lake to the
      // ring, across the causeway: a boat lying along the causeway lay broadside to it, its post before its hull)
      const c = Math.cos(turn), sn = Math.sin(turn), hx = -C.nb[0] * c + C.d[0] * sg * sn, hz = -C.nb[1] * c + C.d[1] * sg * sn;
      if (k < nB) beside(q, hx, hz, C.d[0] * sg * c + C.nb[0] * sn, C.d[1] * sg * c + C.nb[1] * sn);
      else if (keep('post', q[0], MOOR_POST, q[1]) && !crowded(null, q)) posts.push({ x: q[0], z: q[1], wp: true });
    });
  }
  // floats and fallen leaves lie on the plane near the shore and the quay's foot (the water reads as water by them)
  for (let i = 0; i < Math.round(46 * density); i++) {
    const a = rng.range(-72, 60) * D2R, r = P.RQ - rng.range(2, 26) * (rng.chance(0.7) ? 1 : 2.4), p = P.pos(r, a);
    const m = new THREE.Matrix4().makeTranslation(p[0], 0, p[1]).multiply(_r.makeRotationY(rng() * 6.28));
    const fl = rng.chance(0.3), a4 = [rng(), 0, rng(), 0], pk = rng();
    if (!clear(p[0], p[1])) continue;
    // (L6: a float is a thing afloat and is asked of the rule; a fallen leaf lies flat in the plane and is not)
    if (fl) { if (keep('float', p[0], 0.2, p[1])) floats.push({ m, a: a4, c: floatC(pk, a4) }); }
    else leaves.push({ m: m.multiply(_s.makeScale(1.6, 1, 1.6)), a: a4, c: pal.leaf[Math.floor(pk * pal.leaf.length)] });
  }
  // (round 3, B3) three mooring buoys on the harbour's water (floats of 0.7 m, in the cloths' colours)
  for (let i = 0; i < 3; i++) {
    const r = rng.range(P.rPier + 2, P.rHQ - 5), a = rng.range(P.aI - P.alpha + 5 / r, P.aI + P.alpha - 4 / r), p = P.pos(r, a);
    const a4 = [rng(), 0, rng(), 0], pk = rng();
    if (clear(p[0], p[1]) && keep('float', p[0], 0.4, p[1])) floats.push({ m: new THREE.Matrix4().makeTranslation(p[0], 0, p[1]).multiply(_s.makeScale(2.2, 2.2, 2.2)), a: a4, c: floatC(pk, a4) });
  }
  // (round 4, C3) IN THE STEEP LOOK'S MIDDLE THE PLANE IS TOLD BY WHAT LIES ON IT: on the harbour's water inland
  // of the pier, from 7 m west of the pier's line to the east row's feet (not on the stair's flight), a drift of
  // broad fallen leaves, a float here and there and two boats lying free at their buoys. (L4: their places, turns,
  // tones and figures by the boats' stream, drawn before the flight's test; only the counts are the design's)
  const hs = avoid[1];
  const onFlight = (x, z) => {
    if (!hs || !hs.head) return false;
    const ax = hs.foot[0] - hs.head[0], az = hs.foot[2] - hs.head[2], t = Math.max(0, Math.min(1, ((x - hs.head[0]) * ax + (z - hs.head[2]) * az) / (ax * ax + az * az)));
    return Math.hypot(x - hs.head[0] - ax * t, z - hs.head[2] - az * t) < 5;
  };
  for (let i = 0; i < 38; i++) {
    const r = P.rPier + 1.5 + (P.rHQ - P.rPier - 4) * rng(), aW = P.aI + P.alpha - 7 / r, aE = P.aBastE() - 6.6 / r;
    const p = P.pos(r, aW + (aE - aW) * rng()), yw = rng() * 6.2832, a4 = [rng(), 0, rng(), 0], pk = rng(), tone = rng.range(0.85, 1.1);
    if (onFlight(p[0], p[1])) continue;
    const m = new THREE.Matrix4().makeTranslation(p[0], 0, p[1]).multiply(_r.makeRotationY(yw));
    if (i === 5 || i === 20) { if (keep('boat', p[0], 0.6, p[1], 3.4) && !crowded([p[0], p[1], Math.sin(yw), Math.cos(yw)], null)) { hulls.push([p[0], p[1], Math.sin(yw), Math.cos(yw)]); boats.push({ m, a: a4, c: mulc(pal.boat[Math.floor(pk * pal.boat.length)], tone) }); rings.push({ x: p[0], z: p[1] }); } }
    else if (i % 4 === 1) { if (keep('float', p[0], 0.4, p[1])) floats.push({ m: m.multiply(_s.makeScale(2.2, 2.2, 2.2)), a: a4, c: floatC(pk, a4) }); }
    else leaves.push({ m: m.multiply(_s.makeScale(4.2, 1, 4.2)), a: a4, c: pal.leaf[Math.floor(pk * pal.leaf.length)] });
  }
  // FOUR BOATS LIE MOORED AT THE SECOND ISLET'S QUAY: two along its front, one along each side, close under
  // the stone (four on every seed of 1 to 300); their berths are the quay's, their tones and figures the
  // boats' stream's; each is asked of the rule of the line and of HULL_GAP after its draws
  if (P.isle2) {
    const [ix, iz, nx, nz] = P.isle2, tx = -nz, tz = nx, hl = P.ROOMD + 2.4 + 1.5, hw = 1.5 * P.bay * 0.95 + 2.4 + 1.5;
    [[-3.7, hl, 0], [4.1, hl, 0], [hw, -1.6, 1], [-hw, 2.2, 1]].forEach(([du, dv, al], i) => {
      const x = ix + tx * du + nx * dv, z = iz + tz * du + nz * dv, col = mulc(rng.pick(pal.boat), rng.range(0.85, 1.1)), a4 = [rng(), 0, rng(), 0];
      if (!keep('boat', x, 0.6, z, 3.4) || crowded(al ? [x, z, nx, nz] : [x, z, tx, tz], null)) return;
      hulls.push(al ? [x, z, nx, nz] : [x, z, tx, tz]);
      boats.push({ m: new THREE.Matrix4().makeTranslation(x, 0, z).multiply(_r.makeRotationY(al ? Math.atan2(nx, nz) : Math.atan2(tx, tz))), a: a4, c: col });
      rings.push({ x, z });
    });
  }
  // THE ROADSTEAD: ROAD_N 2 to 3 boats lie off the near rock on its side toward the line (the side nearer it BY
  // DISTANCE IN SPACE, asked at the plane 13 m to either hand of the rock's middle), their piles ROAD_OFF 15
  // to 40 m from its outline, the crags' feet, one in each third or half of the reach along its axis (0.6 of
  // ROAD_SPAN to either hand of its middle), each beside its own tall pile by the moorings' rules as they
  // stand (standOff: MOOR_GAP, MOOR_BESIDE, MOOR_QUARTER, the post on the boat's side toward the line, HULL_GAP,
  // the rule of the line). Every bow toward the oncoming way, which passes the rock from the causeway's foot
  // outward: toward the foot, turned a little to the line. Every draw of it comes from the stream road; the
  // boats' stream is not touched
  const N = P.nearRock;
  if (N && road) {
    const ax = [Math.cos(N.yaw), Math.sin(N.yaw)], nr = [-ax[1], ax[0]], sd = far(N.x + nr[0] * N.B, 0, N.z + nr[1] * N.B) <= far(N.x - nr[0] * N.B, 0, N.z - nr[1] * N.B) ? 1 : -1;
    const n = ROAD_N[0] + Math.floor(road() * (ROAD_N[1] - ROAD_N[0] + 1));
    rs = road;
    // (the pile stands ROAD_OFF from THE ROCK'S OUTLINE, the crags' feet: out from the rock's axis on the
    // line's side to the first place that far from every foot)
    const shore = (x, z) => !N.feet ? Infinity : Math.min(...N.feet.map((f) => Math.min(...f.map((p, j) => ptSeg([x, z], p, f[(j + 1) % f.length])))));
    for (let i = 0; i < n; i++) {
      // (the boat's middle lies 2.7 m from its pile: the pile keeps 2.7 m inside both ends of ROAD_OFF, so the boat too)
      const al = 1.2 * ((i + road.range(0.3, 0.7)) / n - 0.5), off = Math.min(Math.max(road.range(ROAD_OFF[0], ROAD_OFF[1]), ROAD_OFF[0] + 2.7), ROAD_OFF[1] - 2.7), turn = road.range(0.05, 0.4);
      let wd = N.feet ? 0 : N.B * 1.15 * Math.sqrt(1 - al * al) + off;
      while (wd < 120 && shore(N.x + ax[0] * al * ROAD_SPAN + nr[0] * sd * wd, N.z + ax[1] * al * ROAD_SPAN + nr[1] * sd * wd) < off) wd += 0.5;
      // (standOff is handed a direction and a normal that are SQUARE to one another: the causeway's own, its
      // normal taken on the rock's side toward the line; the rock's normal is turned from it by the rock's yaw
      // and would set the pile nearer than MOOR_BESIDE to its boat's axis)
      const sw = (C.nb[0] * nr[0] + C.nb[1] * nr[1]) * sd >= 0 ? 1 : -1;
      standOff([N.x + ax[0] * al * ROAD_SPAN + nr[0] * sd * wd, N.z + ax[1] * al * ROAD_SPAN + nr[1] * sd * wd], [-C.d[0], -C.d[1]], [C.nb[0] * sw, C.nb[1] * sw], turn);
    }
    rs = rng;
  }
  return { boats, posts, floats, leaves, rings };
}

// ---------------------------------------------------------------- THE JOINS (laid once, NOT doubled: they belong to both cities)
// The quay's water stair goes on down through the plane, step after step, to a landing at the level of the lower
// city's quay (a mirror's stair would turn back up at the waterline). A mooring chain runs slanting through the
// plane from a ring on the upper quay to a ring on the lower one (its mirror image would slant the other way).
export function makeJoins(P, C, pal, aS) {
  const g = makeGeo(), stairs = [], chains = [], lights = [];
  // ONE WATER STAIR (round 2): a broad flight of pale stone, W wide across n, that goes down along t from the head
  // F at the level top STRAIGHT THROUGH THE PLANE and on down to `deep` metres under it (steps of 0.18 on 0.36),
  // to a landing there. Its two stone rails are each one straight line from the head to the foot (no kink at the
  // waterline); newels stand on them at the head, at the foot and between, above and below the surface, each with
  // a lantern that burns; a bright line lies on the water where it cuts the steps.
  const stair = (F, t, n, W, top, deep, stone, pave, dk = 1) => {
    const V = (sx, o, y) => [F[0] + t[0] * sx + n[0] * o, y, F[1] + t[1] * sx + n[1] * o];
    const rise = 0.18, tread = 0.36, steps = Math.round((top + deep) / rise), yB = top - steps * rise, sE = steps * tread;
    const N3 = [n[0], 0, n[1]], T3 = [t[0], 0, t[1]], slope = Math.hypot(rise, tread), up = [-t[0] * rise / slope, tread / slope, -t[1] * rise / slope];
    for (let i = 0; i < steps; i++) {
      const s0 = i * tread, s1 = s0 + tread, y0 = top - i * rise, y1 = y0 - rise;
      // (dark risers and treads pale and less pale turn about: it must read as STEPS from the head and from across)
      g.kind(KIND.STONE).col(mulc(stone, 0.5)).quad(V(s0, 0, y1), V(s0, W, y1), V(s0, W, y0), V(s0, 0, y0), T3);
      // (stage E: under the plane the treads are half as bright again, so the flight tells through the water)
      // (round 3, C5: dk < 1 is the quay's stair: under the plane its treads are no brighter than above it)
      // (round 4, C2: THE HARBOUR'S STAIR IS NO WHITE PATCH: its dk is 0.8: under the plane its treads are two
      // thirds as bright as above, not half as bright again, its landing half, and every tread carries a pale
      // lit nosing 7 cm deep, so from the look above it reads as stone steps with lit edges and lamps)
      g.kind(KIND.PAVE).col(mulc(pave, (i % 2 ? 1.14 : 0.8) * (y1 < 0 ? (dk < 1 ? 0.46 * dk / 0.55 : 1.5) : 1))).quad(V(s0, 0, y1), V(s1, 0, y1), V(s1, W, y1), V(s0, W, y1), [0, 1, 0]);
      if (dk > 0.6 && dk < 1) g.col(mulc(pal.hall, y1 < 0 ? 0.7 : 0.95)).quad(V(s1 - 0.07, 0, y1 + 0.006), V(s1, 0, y1 + 0.006), V(s1, W, y1 + 0.006), V(s1 - 0.07, W, y1 + 0.006), [0, 1, 0]);
    }
    // the landing under the water, and the flight's two cheeks
    // (the quay's stair goes 3 m under the plane, not 7, its treads there a shade deeper than above and its
    // landing deeper yet: 20 m of pale flight lay on the water as a wedge beside the quay)
    // (the treads under the plane and the landing deeper again: the flight under the water lay paler than the
    // water about it)
    g.kind(KIND.PAVE).col(mulc(pave, dk < 1 ? 0.36 * dk / 0.55 : 1)).quad(V(sE, -0.5, yB), V(sE + 3.4, -0.5, yB), V(sE + 3.4, W + 0.5, yB), V(sE, W + 0.5, yB), [0, 1, 0]);
    g.kind(KIND.STONE).col(stone).quad(V(sE + 3.4, -0.5, yB - 1), V(sE + 3.4, W + 0.5, yB - 1), V(sE + 3.4, W + 0.5, yB), V(sE + 3.4, -0.5, yB), T3);
    for (const [o, sg] of [[-0.5, -1], [W + 0.5, 1]]) {
      const Nn = [n[0] * sg, 0, n[1] * sg], oi = o - sg * 0.5;
      // (round 3, C5: the quay's stair (dk < 1) has cheeks and rails of the bastion's stone, a shade deeper: seen
      // along the quay it was a pale wedge on the water)
      g.kind(KIND.STONE).col(mulc(stone, dk));
      g.quad(V(0, o, yB - 1), V(sE + 3.4, o, yB - 1), V(sE + 3.4, o, yB), V(0, o, top), Nn);
      // the rail: its outer and inner faces and its top, each one straight strip from the head to the foot
      g.col(dk < 1 ? mulc(stone, dk * 1.12) : mulc(pal.hall, 0.96));
      g.quad(V(0, o, top), V(sE, o, yB), V(sE, o, yB + 0.95), V(0, o, top + 0.95), Nn);
      g.quad(V(0, oi, top), V(sE, oi, yB), V(sE, oi, yB + 0.95), V(0, oi, top + 0.95), [-Nn[0], 0, -Nn[2]]);
      g.quad(V(0, o, top + 0.95), V(sE, o, yB + 0.95), V(sE, oi, yB + 0.95), V(0, oi, top + 0.95), up);
      // five newels to a rail, the middle three under or at the water; a lantern on each (kind LAMP: it burns)
      for (let k = 0; k <= 4; k++) {
        const s = sE * k / 4, y = top - (top - yB) * k / 4, oc = o - sg * 0.25, a = V(s - 0.27, oc - 0.27, 0), b = V(s + 0.27, oc + 0.27, 0), c = V(s, oc, 0);
        g.kind(KIND.STONE).col(pal.hall);
        g.quad(V(s - 0.27, oc - 0.27, y - 0.3), V(s + 0.27, oc - 0.27, y - 0.3), V(s + 0.27, oc - 0.27, y + 1.45), V(s - 0.27, oc - 0.27, y + 1.45), [-n[0], 0, -n[1]]);
        g.quad(V(s - 0.27, oc + 0.27, y - 0.3), V(s + 0.27, oc + 0.27, y - 0.3), V(s + 0.27, oc + 0.27, y + 1.45), V(s - 0.27, oc + 0.27, y + 1.45), N3);
        g.quad(V(s - 0.27, oc - 0.27, y - 0.3), V(s - 0.27, oc + 0.27, y - 0.3), V(s - 0.27, oc + 0.27, y + 1.45), V(s - 0.27, oc - 0.27, y + 1.45), [-t[0], 0, -t[1]]);
        g.quad(V(s + 0.27, oc - 0.27, y - 0.3), V(s + 0.27, oc + 0.27, y - 0.3), V(s + 0.27, oc + 0.27, y + 1.45), V(s + 0.27, oc - 0.27, y + 1.45), T3);
        g.quad(V(s - 0.27, oc - 0.27, y + 1.45), V(s + 0.27, oc - 0.27, y + 1.45), V(s + 0.27, oc + 0.27, y + 1.45), V(s - 0.27, oc + 0.27, y + 1.45), [0, 1, 0]);
        const lw = y + 1.5 < 0 ? 0.24 : 0.17;
        g.kind(KIND.LAMP).col(y + 1.5 < 0 ? [5.2, 3.9, 2.1] : [3.2, 2.4, 1.3]).move(1).box(c[0] - lw, y + 1.5, c[2] - lw, c[0] + lw, y + 1.92, c[2] + lw, 'y').move(0);
        lights.push([c[0], y + 1.7, c[2]]);
      }
    }
    // the water's skin draws a bright line across the steps where it cuts them (it lies on the plane)
    const sW = top / rise * tread;
    g.kind(KIND.LAMP).col([2.2, 2.3, 2.4]).move(1).quad(V(sW - 0.16, 0, 0.012), V(sW + 0.16, 0, 0.012), V(sW + 0.16, W, 0.012), V(sW - 0.16, W, 0.012), [0, 1, 0]).move(0);
    const mid = V(sE / 2, W / 2, 0);
    stairs.push({ x: mid[0], z: mid[2], r: Math.max(sE / 2, W / 2) + 6, head: V(0, 0, top), foot: V(sE + 3.4, W, yB) });
    return V;
  };
  // ONE TAUT MOORING CHAIN AND ITS DOUBLE (round 2): heavy links (th wide, drawn turn about flat and edge on) from
  // a bollard at c0 above the plane STRAIGHT through it to the ring at c1 under it, and the same chain turned about
  // the plane: the two cross AT THE WATERLINE as an X; a pale ring lies on the water where they pierce it
  const chain = (c0, c1, n, th = 0.17) => {
    const len = Math.hypot(c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]), links = Math.max(8, Math.round(len / (th * 3.2)));
    for (const sy of [1, -1]) {
      const dx = (c1[0] - c0[0]) / links, dy = sy * (c1[1] - c0[1]) / links, dz = (c1[2] - c0[2]) / links;
      g.kind(KIND.TIMBER).col([0.2, 0.19, 0.18]);
      // (round 3, stage D: the quay's six (th under 0.2) are IRON GREY, not black: the links lying flat catch the
      // sky and are pale, the links edge on are a shade deeper, and each ends where the next begins, so they
      // read as links; the harbour's two are as they were)
      const lk = th < 0.2 ? 1.02 : 1.2;
      for (let i = 0; i < links; i++) {
        // (round 5 mending 2, step 2, the guard: the chains were seen by their rings on the water only: the pale
        // flat links were the quay stone's own tone. DARK IRON on the pale stone: flat links a mid grey, the links
        // edge on a deep grey, turn about, so the chain is a beaded dark line from the quay)
        if (th < 0.2) g.kind(KIND.LIME).col(i % 2 ? [0.33, 0.34, 0.36] : [0.13, 0.135, 0.15]);
        const p = [c0[0] + dx * i, sy * c0[1] + dy * i, c0[2] + dz * i], q = [p[0] + dx * lk, p[1] + dy * lk, p[2] + dz * lk];
        const e = i % 2 ? [n[0] * th, 0, n[1] * th] : [0, th, 0];
        g.quad([p[0] - e[0], p[1] - e[1], p[2] - e[2]], [q[0] - e[0], q[1] - e[1], q[2] - e[2]], [q[0] + e[0], q[1] + e[1], q[2] + e[2]], [p[0] + e[0], p[1] + e[1], p[2] + e[2]], i % 2 ? [0, 1, 0] : [n[0], 0, n[1]]);
      }
    }
    // a stone bollard post at each end, through the plane (it carries one chain's head above and the other's below)
    const hb = Math.abs(c0[1]) + 0.3;
    for (const c of [c0, c1]) g.kind(KIND.STONE).col(mulc(pal.hall, 0.9)).box(c[0] - 0.26 - n[0] * 0.3, -hb, c[2] - 0.26 - n[1] * 0.3, c[0] + 0.26 - n[0] * 0.3, hb, c[2] + 0.26 - n[1] * 0.3);
    const m = [(c0[0] + c1[0]) / 2, 0.014, (c0[2] + c1[2]) / 2];
    // (M3c: the ring names itself to the shader by its second figure 2, at half the colour: as bright as it was
    // by day, a fifth of that by night)
    g.kind(KIND.LAMP).col([0.75, 0.8, 0.85]).move(2);
    for (let k = 0; k < 10; k++) {
      const t0 = k * 0.6283, t1 = t0 + 0.6283, r0 = th * 3, r1 = th * 4.6;
      g.quad([m[0] + Math.cos(t0) * r0, m[1], m[2] + Math.sin(t0) * r0], [m[0] + Math.cos(t1) * r0, m[1], m[2] + Math.sin(t1) * r0], [m[0] + Math.cos(t1) * r1, m[1], m[2] + Math.sin(t1) * r1], [m[0] + Math.cos(t0) * r1, m[1], m[2] + Math.sin(t0) * r1], [0, 1, 0]);
    }
    g.move(0);
    chains.push([c0, c1]);
  };
  // 1 THE QUAY'S WATER STAIR at the foot of the stair lane aS, 6 m wide (round 3), straight out from the quay's
  // edge and down to 3 m under the plane; SIX CHAINS along the quay's face, three before it and three after (each
  // an X 5.6 m long and 3.8 m high at the waterline, iron grey, links 0.2 m wide), all beside the line on the quay
  const tq = [Math.cos(aS), Math.sin(aS)], nq = [-Math.sin(aS), Math.cos(aS)], Fq = P.pos(P.RQ, aS - 3 / P.RQ);
  // (round 3, C5: 6 m wide, not 9; cheeks and rails seven tenths as pale; no brighter under the plane)
  stair(Fq, nq, tq, 6, P.DECK, 3, pal.bastion, pal.pave, 0.55);
  const onFace = (r, a, y) => { const p = P.pos(r, a); return [p[0], y, p[1]]; };
  for (const off of [-30, -21.5, -13, 13, 21.5, 30]) {
    const a0 = aS + (off - 2.8) / P.RQ, a1 = aS + (off + 2.8) / P.RQ;
    // (links 0.2 m wide, not 0.34: one stood too large close under the line)
    // (round 5, D1, the guard: the chains a little heavier again: links 0.25 m wide, a quarter more)
    // (mending 2, step 2: links 0.29 m wide, 0.46 m long; mending 4, a little heavier: 0.32 by 0.51)
    chain(onFace(P.RQ - 0.32, a0, 1.9), onFace(P.RQ - 0.32, a1, -1.9), nq, 0.16);
  }
  // 2 (rounds 1 and 2: the basin's water stair stood at the east flank's foot.)
  // (round 3, B1/B3: the east flank is THE PIER now and the harbour's water lies behind it; THE HARBOUR'S WATER
  // STAIR goes out from the head's quay before its tallest house, 6 m wide, straight toward the lake and down to
  // 5 m under the plane, under the steep look; a heavier chain on the quay's face each side of it)
  const aH = P.aI - P.alpha + 26.4 / P.rHQ, ti = [-Math.sin(aH), Math.cos(aH)], ni = [Math.cos(aH), Math.sin(aH)], Fi = P.pos(P.rHQ, aH - 3 / P.rHQ);
  stair(Fi, ti, ni, 6, P.DECK, 5, pal.bastion, mulc(pal.pave, 0.82), 0.8);
  for (const off of [-8.6, 8.6]) chain(onFace(P.rHQ - 0.3, aH + (off - 1.8) / P.rHQ, 2.5), onFace(P.rHQ - 0.3, aH + (off + 1.8) / P.rHQ, -2.5), ti, 0.21);
  return { g, stairs, chains, lights, stairEnd: stairs[0].foot, chain: chains[0], reach: 4.2 };
}

// ---------------------------------------------------------------- small standing things (one merged, doubled mesh):
// mooring posts and ropes, pots on the rim's parapets, masts for pennants (plain, never
// red); it hands back the cloth to hang (the pennants), which joins the curtains' instances
export function makeFurniture(P, C, pal, lay, rng, density, keep = () => true) {
  const g = makeGeo(), cloth = [], J = C.jetty;
  const ribbon = (a, b, sag, wdt) => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, f = (u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      const p = f(u0), q = f(u1);
      g.quad([p[0], p[1] - wdt, p[2]], [q[0], q[1] - wdt, q[2]], [q[0], q[1] + wdt, q[2]], [p[0], p[1] + wdt, p[2]], [0, 0.4, 0.9]);
    }
  };
  for (let i = 0; i < lay.posts.length; i++) {
    const p = lay.posts[i];
    // (MENDING 6, M1: the one form of every mooring post, mooringPile; the rope runs from the ring's height to the
    // gunwale abreast of the post)
    const yr = mooringPile(g, pal, p.x, p.z);
    if (!p.g) continue;
    g.kind(KIND.CLOTH).col([0.5, 0.42, 0.3]).move(0);
    ribbon([p.x, yr, p.z], [p.g[0], 0.5, p.g[1]], 0.25, 0.02);
  }
  // pots with a green tuft on the WEST rim's parapet only, from the quay to the harbour's head (none on the east
  // rim). (MENDING 6, M4b 3: each is drawn first and then asked of THE RULE OF THE LINE at its tuft's top, like
  // everything the deal lays; the typed first 7 m are out of the law: the line crosses that rail there)
  for (const side of [-1]) for (let r = P.RQ + 1; r < P.rHead; r += rng.range(2.6, 5.2)) {
    const a = P.aI + side * (P.alpha + 0.15 / r), p = P.pos(r, a), y = P.rimY + 1.1, s = rng.range(0.13, 0.19), cp = rng.pick(pal.pot), cl = rng.pick(pal.leaf);
    if (!keep('pot', p[0], y + 0.78, p[1])) continue;
    g.kind(KIND.LIME).col(cp).box(p[0] - s, y, p[1] - s, p[0] + s, y + 0.3, p[1] + s, 'y');
    g.kind(KIND.LEAF).col(cl).move(0.2);
    g.quad([p[0] - 0.24, y + 0.28, p[1]], [p[0] + 0.24, y + 0.28, p[1]], [p[0] + 0.2, y + 0.78, p[1]], [p[0] - 0.2, y + 0.78, p[1]], [0, 0.5, 0.86]);
    g.quad([p[0], y + 0.28, p[1] - 0.24], [p[0], y + 0.28, p[1] + 0.24], [p[0], y + 0.78, p[1] + 0.2], [p[0], y + 0.78, p[1] - 0.2], [0.86, 0.5, 0]);
    g.move(0);
  }
  // (MENDING 6, M4b 5) TWO MASTS WITH A PENNANT EACH FLANK THE WATER STAIR'S HEAD: at the quay's edge, MAST_OFF
  // (6 m) to each side of the fourth lane's foot, 3 m beyond the stair's rails and inside the stretch the lamp
  // posts leave free. Their places come from the plan on every seed (the typed bearings are out); each is drawn
  // first and then asked of the rule of the line at its top
  const MAST_OFF = 6;
  const mast = (x, z, y0, h, yaw) => {
    const m = new THREE.Matrix4().makeTranslation(x + Math.cos(yaw) * 0.5, y0 + h - 0.1, z - Math.sin(yaw) * 0.5).multiply(_r.makeRotationY(yaw)).multiply(_s.makeScale(0.8, 2.6, 1));
    const pn = { m, a: [rng(), 0, rng(), 0], c: rng.pick(pal.pennant) };
    if (!keep('mast', x, y0 + h, z)) return;
    g.kind(KIND.TIMBER).col(pal.timber).box(x - 0.07, y0, z - 0.07, x + 0.07, y0 + h, z + 0.07, 'y');
    cloth.push(pn);
  };
  for (const sd of [-1, 1]) { const a = P.lanes[3].a + sd * MAST_OFF / P.RQ, p = P.pos(P.RQ + 1.1, a); mast(p[0], p[1], P.DECK, 6.5, -a); }
  // (round 2: no washing hangs across a lane, no rug airs over a bridge, and THE PALE HOOP at the jetty's end is
  // gone: the portal's own ring stands there alone)
  return { g, cloth };
}

// ---------------------------------------------------------------- the streets' things (one merged, doubled mesh)
// Lamp posts along the quay's edge. It hands back the lamps to hang (they join the rooms' lamps).
// (round 3, C2) ONE OF THE QUAY'S THINGS, kind k of seven, at the place L(along, toward the land, up) gives; h is
// its own chance figure. A box here is five faces set by L (so it stands square to the quay wherever it is)
function quayThing(g, pal, k, L, h) {
  const o0 = L(0, 0, 0), e1 = L(1, 0, 0), e2 = L(0, 1, 0), nT = [e1[0] - o0[0], 0, e1[2] - o0[2]], nR = [e2[0] - o0[0], 0, e2[2] - o0[2]];
  const neg = (v) => [-v[0], 0, -v[2]];
  const ob = (s0, a0, y0, s1, a1, y1) => {
    g.quad(L(s0, a0, y1), L(s1, a0, y1), L(s1, a1, y1), L(s0, a1, y1), [0, 1, 0]);
    g.quad(L(s0, a0, y0), L(s1, a0, y0), L(s1, a0, y1), L(s0, a0, y1), neg(nR));
    g.quad(L(s0, a1, y0), L(s1, a1, y0), L(s1, a1, y1), L(s0, a1, y1), nR);
    g.quad(L(s0, a0, y0), L(s0, a1, y0), L(s0, a1, y1), L(s0, a0, y1), neg(nT));
    g.quad(L(s1, a0, y0), L(s1, a1, y0), L(s1, a1, y1), L(s1, a0, y1), nT);
  };
  const wood = [0.5, 0.39, 0.26], straw = [0.74, 0.62, 0.4], cloth = pal.cloth[Math.floor(h * pal.cloth.length) % pal.cloth.length];
  if (k === 7) {
    // (C2) a few plain cloths on a line between two poles, and a lantern on a bracket on one of them
    g.kind(KIND.TIMBER).col(wood); ob(-1.85, -0.05, 0, -1.75, 0.05, 2.4); ob(1.75, -0.05, 0, 1.85, 0.05, 2.4);
    g.col(mulc(wood, 0.7)); ob(-1.8, -0.012, 2.24, 1.8, 0.012, 2.27); ob(-1.83, -0.5, 2.02, -1.77, -0.05, 2.07);
    g.kind(KIND.CLOTH);
    for (const [s0, s1, d, c] of [[-1.4, -0.6, 1.25, [0.86, 0.83, 0.76]], [-0.4, 0.3, 0.8, cloth], [0.55, 1.45, 1.05, [0.8, 0.78, 0.71]]]) { g.col(c); ob(s0, -0.015, 2.25 - d, s1, 0.015, 2.26); }
    g.kind(KIND.LAMP).col([1.0, 0.56, 0.18]).move(1); ob(-1.88, -0.56, 1.74, -1.72, -0.4, 2.02);
    g.move(0);
    return;
  }
  if (k === 0) {
    // crates and a chest under a plain cloth on four poles
    g.kind(KIND.TIMBER).col(wood); ob(-0.9, -0.4, 0, -0.1, 0.4, 0.6); ob(0.1, -0.35, 0, 0.85, 0.35, 0.46);
    g.col(mulc(wood, 0.8)); ob(-0.6, -0.3, 0.6, 0.1, 0.3, 1.0);
    g.col(mulc(wood, 0.6));
    for (const [s, a] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) ob(s - 0.035, a - 0.035, 0, s + 0.035, a + 0.035, a < 0 ? 2.05 : 2.35);
    g.kind(KIND.CLOTH).col(cloth).quad(L(-1.45, -1.05, 2.02), L(1.45, -1.05, 2.02), L(1.45, 1.0, 2.36), L(-1.45, 1.0, 2.36), [0, 1, 0], [0, 0, 1, 0, 1, 0.8, 0, 0.8]);
  } else if (k === 1) {
    // baskets, one on another, and a coil of rope
    g.kind(KIND.TIMBER).col(straw); ob(-0.7, -0.3, 0, -0.1, 0.3, 0.42); ob(0.05, -0.28, 0, 0.6, 0.27, 0.36);
    g.col(mulc(straw, 0.86)); ob(-0.5, -0.24, 0.42, 0.0, 0.24, 0.74);
    g.col([0.62, 0.55, 0.42]); ob(0.85, -0.3, 0, 1.45, 0.3, 0.14); ob(0.95, -0.2, 0.14, 1.35, 0.2, 0.26);
  } else if (k === 2) {
    // a bench with a cloth laid over one end and a cup
    g.kind(KIND.TIMBER).col(wood); ob(-0.85, -0.2, 0.42, 0.85, 0.2, 0.48); ob(-0.75, -0.17, 0, -0.67, 0.17, 0.42); ob(0.67, -0.17, 0, 0.75, 0.17, 0.42);
    g.kind(KIND.CLOTH).col(cloth).quad(L(0.2, -0.24, 0.49), L(0.7, -0.24, 0.49), L(0.7, 0.24, 0.49), L(0.2, 0.24, 0.49), [0, 1, 0], [0, 0, 1, 0, 1, 0.8, 0, 0.8]);
    g.quad(L(0.2, -0.24, 0.49), L(0.7, -0.24, 0.49), L(0.7, -0.26, 0.2), L(0.2, -0.26, 0.2), neg(nR), [0, 0, 1, 0, 1, 0.8, 0, 0.8]);
    g.kind(KIND.LIME).col([0.9, 0.88, 0.82]); ob(-0.35, -0.05, 0.48, -0.25, 0.05, 0.58);
  } else if (k === 3) {
    // A NET HUNG TO DRY FROM A SINGLE POLE (ROUND 5 MENDING 6, M3b: the rack of two trestles and a bar with the
    // net hung in it read as a goal, and so did a low rail on two props): one plain pole 2.45 m high, the net
    // gathered at its top and falling in three folds, two drawn out wide to the paving on the one side, one
    // hanging short of it on the other. No bar, no second post
    g.kind(KIND.TIMBER).col(mulc(wood, 0.7));
    ob(-0.04, -0.04, 0, 0.04, 0.04, 2.45);
    // (round 4, D1: THE PANEL IS A NET: each length is a mesh of thin cords, ten down and eight across (0.14 by
    // 0.23 m), the paving and the arcade seen through it; it was a solid grey sheet)
    const net = (A, B, C, D, n) => {
      const lp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
      for (let i = 0; i <= 9; i++) g.quad(lp(A, B, i / 9.2), lp(A, B, i / 9.2 + 0.02), lp(D, C, i / 9.2 + 0.02), lp(D, C, i / 9.2), n);
      for (let j = 0; j <= 7; j++) g.quad(lp(A, D, j / 7.15), lp(B, C, j / 7.15), lp(B, C, j / 7.15 + 0.017), lp(A, D, j / 7.15 + 0.017), n);
    };
    g.kind(KIND.CLOTH).col([0.5, 0.47, 0.4]);
    net(L(-0.04, 0.03, 2.4), L(0.05, 0.03, 2.4), L(1.5, 0.75, 0.03), L(0.2, 1.0, 0.03), nR);
    net(L(-0.05, 0.02, 2.4), L(0.03, 0.04, 2.4), L(0.1, 1.0, 0.03), L(-1.2, 0.5, 0.03), nR);
    g.col([0.4, 0.43, 0.42]);
    net(L(-0.04, -0.03, 2.4), L(0.04, -0.03, 2.4), L(0.9, -0.55, 0.35), L(-0.7, -0.7, 0.2), neg(nR));
  } else if (k === 4) {
    // a handcart: its bed, two wheels, the shafts down on the paving
    g.kind(KIND.TIMBER).col(wood); ob(-0.8, -0.45, 0.5, 0.8, 0.45, 0.58); ob(-0.8, -0.45, 0.58, 0.8, -0.41, 0.85); ob(-0.8, 0.41, 0.58, 0.8, 0.45, 0.85);
    g.col(mulc(wood, 0.55)); ob(-0.35, -0.55, 0, 0.35, -0.49, 0.7); ob(-0.35, 0.49, 0, 0.35, 0.55, 0.7);
    for (const a of [-0.38, 0.38]) g.quad(L(0.8, a - 0.03, 0.54), L(0.8, a + 0.03, 0.54), L(2.0, a + 0.03, 0.03), L(2.0, a - 0.03, 0.03), [0, 1, 0]);
    g.col(straw); ob(-0.5, -0.3, 0.58, 0.2, 0.3, 0.9);
  } else if (k === 5) {
    // two oars and a mast with its furled sail, leaning on a trestle
    g.kind(KIND.TIMBER).col(mulc(wood, 0.7)); ob(-0.05, -0.5, 0, 0.05, -0.42, 1.5); ob(-0.05, 0.42, 0, 0.05, 0.5, 1.5); ob(-0.05, -0.5, 1.5, 0.05, 0.5, 1.58);
    g.col([0.82, 0.74, 0.56]);
    for (const a of [-0.3, -0.12]) g.quad(L(-1.9, a, 0.03), L(-1.9, a + 0.07, 0.03), L(1.6, a + 0.07, 2.6), L(1.6, a, 2.6), nR);
    g.col(mulc(wood, 0.9)).quad(L(-2.4, 0.2, 0.03), L(-2.4, 0.3, 0.03), L(2.2, 0.3, 3.3), L(2.2, 0.2, 3.3), nR);
    g.kind(KIND.CLOTH).col([0.86, 0.82, 0.72]).quad(L(-1.4, 0.18, 0.62), L(-1.4, 0.36, 0.72), L(1.5, 0.36, 2.86), L(1.5, 0.18, 2.76), nR, [0, 0, 1, 0, 1, 0.8, 0, 0.8]);
  } else {
    // pots on three steps, a tuft of green in each, and a ladder lying by them
    g.kind(KIND.STONE).col(pal.parapet); ob(-0.9, -0.3, 0, 0.9, 0.3, 0.2); ob(-0.9, 0, 0.2, 0.9, 0.3, 0.4);
    for (const [s, a, y] of [[-0.6, -0.15, 0.2], [0.1, -0.15, 0.2], [-0.3, 0.15, 0.4], [0.55, 0.15, 0.4]]) {
      g.kind(KIND.LIME).col(pal.pot[Math.floor((h * 7 + s * 3 + 9) % pal.pot.length)]); ob(s - 0.13, a - 0.13, y, s + 0.13, a + 0.13, y + 0.26);
      g.kind(KIND.LEAF).col(mulc(pal.leaf[0], 0.9)); ob(s - 0.17, a - 0.17, y + 0.26, s + 0.17, a + 0.17, y + 0.56);
    }
    g.kind(KIND.TIMBER).col(wood); ob(1.2, -0.3, 0, 3.4, -0.25, 0.06); ob(1.2, 0.1, 0, 3.4, 0.15, 0.06);
    for (let j = 0; j < 6; j++) ob(1.4 + j * 0.36, -0.3, 0.02, 1.44 + j * 0.36, 0.15, 0.05);
  }
}
export function makeStreetThings(P, pal, rng, night, sun = null, keep = () => true) {
  // (round 4, A1) A THING'S LONG SHADOW ON THE PAVING: one paving quad (2 triangles) from the thing's foot along
  // the sun's bearing, as long as the thing is high over the sun's slope (9 m at most), cut short where it would
  // leave the deck (the arcades' foot inland, the kerb lakeward); the weight -1 tells the shader it is paving
  // in cast shade. yOf gives the paving's height (the deck's, or the rising street's by its angle)
  const sL = sun ? Math.hypot(sun.x, sun.z) : 0, sax = sL ? -sun.x / sL : 0, saz = sL ? -sun.z / sL : 0, sTan = sL ? Math.max(0.14, sun.y / sL) : 1;
  const shade = (x, z, hw, h, yOf = () => P.DECK, col = pal.pave) => {
    if (!sL || night > 0.5) return;
    let L = Math.min(h / sTan, 9);
    for (let k = 0; k < 6 && (Math.hypot(x + sax * L, z + saz * L) > P.RQ + 5.85 || Math.hypot(x + sax * L, z + saz * L) < P.RQ + 0.1); k++) L *= 0.8;
    const vx = saz * hw, vz = -sax * hw, c = [[x - vx, z - vz], [x - vx + sax * L, z - vz + saz * L], [x + vx + sax * L, z + vz + saz * L], [x + vx, z + vz]];
    g.kind(KIND.PAVE).col(col).move(-1).quad(...c.map(([cx, cz]) => [cx, yOf(cx, cz) + 0.022, cz]), [0, 1, 0]).move(0);
  };
  // (round 3, C6: plain lanterns: the iron is a weathered grey, not black)
  const g = makeGeo(), lamps = [], trees = [], iron = [0.25, 0.24, 0.23];
  const hang = (x, y, z) => lamps.push({ m: new THREE.Matrix4().makeTranslation(x, y, z), a: [rng(), rng.chance(night > 0.5 ? 0.95 : 0.8) ? rng.range(0.8, 1.15) : 0, rng(), 0], c: [1, 0.78, 0.45] });
  // lamp posts along the quay's edge, 15 m apart (none before the basin's mouth)
  for (let a = -P.aMax + 0.03; a < P.aMax - 0.03; a += 15 / P.RQ) {
    // (none from the rising street's foot to 2 m past the east bastion: the street's own body, the west bastion,
    // the harbour's mouth and the pier stand on the quay's edge there, and no post has a quay to stand on; none
    // at the water stair's head. MENDING 6, M4b 3: the typed 44 m before the street's foot are out of the law;
    // every post is drawn first, with its lantern's draws, and then asked of THE RULE OF THE LINE at its top)
    if (a > P.rampA0 && a < P.aBastE() + 2 / P.RQ) continue;
    if (Math.abs(a - P.lanes[3].a) * P.RQ < 7) continue;
    // (round 4, D1: no cross arm: the lantern hangs from a hook a hand's breadth from the stem's head, 0.22 m)
    // (on the quay the lantern read as a bright dot that nothing held: it hung a hand's breadth
    // from a hair of a stem. THE LANTERN HANGS FROM A BRACKET: an arm of 0.5 m with a slim brace under it, the stem
    // 9 cm thick; one slim arm as before, no wedge)
    const p = P.pos(P.RQ + 0.55, a), q = P.pos(P.RQ + 0.55, a + 0.5 / P.RQ), qb = P.pos(P.RQ + 0.55, a + 0.36 / P.RQ), y = P.DECK + 3.5, ys = P.DECK + 2.35;
    hang(q[0], y, q[1]);
    if (!keep('lamp post', p[0], y + 0.06, p[1])) { lamps.pop(); continue; }
    // (stage F: no pole of a modern road: A STONE POST of the bastions' stone with a capstone, an iron stem and
    // bracket on its head, the lantern hung from the bracket's end)
    g.kind(KIND.STONE).col(pal.bastion).box(p[0] - 0.17, P.DECK, p[1] - 0.17, p[0] + 0.17, ys, p[1] + 0.17, 'yY');
    g.col(pal.parapet).box(p[0] - 0.23, ys, p[1] - 0.23, p[0] + 0.23, ys + 0.13, p[1] + 0.23, '');
    // (round 3, C6: against the water the stem and its wedge of a bracket stood black and forked,
    // like birds on posts: the iron is a pale weathered grey and the bracket ONE SLIM ARM, no wedge)
    g.kind(KIND.TIMBER).col([0.5, 0.48, 0.44]).box(p[0] - 0.045, ys + 0.13, p[1] - 0.045, p[0] + 0.045, y + 0.06, p[1] + 0.045, 'yY');
    g.quad([p[0], y - 0.04, p[1]], [q[0], y - 0.04, q[1]], [q[0], y + 0.04, q[1]], [p[0], y + 0.04, p[1]], [-Math.sin(a), 0, Math.cos(a)]);
    g.quad([p[0], y - 0.5, p[1]], [qb[0], y - 0.05, qb[1]], [qb[0], y - 0.01, qb[1]], [p[0], y - 0.42, p[1]], [-Math.sin(a), 0, Math.cos(a)]);
    shade(p[0], p[1], 0.17, 3.5);
  }
  // (round 2: the piazza's well, its rings of paving and its tubs are gone with the piazza)
  // (stage E: low lanterns on the water-side balustrade of the rising street, the west terrace and the mouth's
  // bridge, 13 m apart: a short iron post on the coping; and pots with a green tuft on the paving at its foot)
  // (stage F) A STANDING LANTERN, 1.0 m from the coping to its cap's point: a stone foot, an iron stem and seat, a
  // glass that glows (kind LAMP: its light breathes by the clock), a pitched iron cap wider than the glass
  const lantern = (x, y0, z, stem) => {
    // (along the street's last 40 m, where the line eases out over the rail, the lantern has no stem: 0.78 m)
    const y = y0 - 0.42 + stem;
    g.kind(KIND.STONE).col(pal.parapet).box(x - 0.14, y0, z - 0.14, x + 0.14, y0 + 0.2, z + 0.14, 'y');
    if (stem > 0) g.kind(KIND.TIMBER).col(iron).box(x - 0.035, y0 + 0.2, z - 0.035, x + 0.035, y + 0.62, z + 0.035, 'yY');
    g.kind(KIND.TIMBER).col(iron);
    g.box(x - 0.14, y + 0.62, z - 0.14, x + 0.14, y + 0.66, z + 0.14, '');
    g.kind(KIND.LAMP).col([1.0, 0.56, 0.18]).move(1).box(x - 0.1, y + 0.66, z - 0.1, x + 0.1, y + 0.98, z + 0.1, 'yY');
    g.kind(KIND.TIMBER).col(iron).move(0);
    // (round 3, C6: A PLAIN LANTERN: no hat with eaves; a low cap no wider than the glass)
    const c = [[-0.11, -0.11], [0.11, -0.11], [0.11, 0.11], [-0.11, 0.11]];
    for (let i = 0; i < 4; i++) {
      const e = c[i], f = c[(i + 1) % 4], nx = (e[0] + f[0]) * 2, nz = (e[1] + f[1]) * 2;
      g.tri(g.vert(x + e[0], y + 0.98, z + e[1], nx, 0.7, nz), g.vert(x + f[0], y + 0.98, z + f[1], nx, 0.7, nz), g.vert(x, y + 1.05, z, nx, 0.7, nz));
    }
  };
  // (round 4, A1) the promenade's paving height at a place (the rising street, then the level street), and THE
  // LONG SHADOWS OF THE TREES in its planted bays, slantwise across the street (the bays that have a tree: see
  // layTrees; a shadow 1.3 m wide, 9 m long at most)
  const yProm = (x, z) => { const a = Math.atan2(x, -z); return a > P.rampA1 ? P.rimY : P.rampY(a); };
  (P.belv || []).forEach((ab, i) => { if (P.belvTree && P.belvTree[i]) { const p = P.pos(P.RQ + 0.5, ab); shade(p[0], p[1], 0.65, 6, yProm); } });
  // a turned shape of eight sides with smooth normals: prof is [radius, height] from the foot up
  const lathe = (x, y, z, prof, wob, ph) => {
    const n = 8, id = [];
    prof.forEach(([r, h], j) => {
      for (let i = 0; i < n; i++) {
        const t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), rr = r * (1 + wob * Math.sin(i * 2.4 + j * 1.7 + ph));
        id.push(g.vert(x + c * rr, y + h, z + s * rr, c, 0.3 + 0.6 * j / prof.length, s));
      }
    });
    for (let j = 0; j + 1 < prof.length; j++) for (let i = 0; i < n; i++) {
      const a = id[j * n + i], b = id[j * n + (i + 1) % n], c = id[(j + 1) * n + (i + 1) % n], d = id[(j + 1) * n + i];
      g.tri(a, b, c); g.tri(a, c, d);
    }
  };
  for (let a = P.rampA0 + 5 / P.RQ; a < P.aI + P.alpha; a += 13 / P.RQ) {
    const p = P.pos(P.RQ + 0.06, a), y = (a > P.rampA1 ? P.rimY : P.rampY(a)) + 1.15;
    // (THE BALUSTRADE'S LANTERNS ARE NOT ASKED OF THE RULE OF THE LINE, and why: along the rising street the
    // balustrade stands 2.6 to 2.95 m from the line's plan, and from 32 m before the street's top nearer, 0.7 m
    // at the least 12 m before the top, where the line turns inland from it (its plan never crosses the
    // balustrade's); every lantern of the street is inside LINE_N, 1.1 to 2.9 m from the plan, the line 0.8 to
    // 3.1 m over its top: the rule would take every one. They are the street's own fittings, like its rail,
    // and keep A TYPED STRETCH: none stands from 9 m before the street's top to 2 m past the inlet's middle; on
    // the street's last 40 m a lantern has no stem. The six of the rising street stand 2.7 m and more from the
    // line in space. A LANTERN IS LAID ONLY WHERE THE BALUSTRADE STANDS UNDER IT, west of the harbour's mouth
    // (a < aI - alpha): the loop runs on to the pier's line for the pots' draws and lays none over the open
    // mouth; a lantern takes no draw, so no stream moves)
    if (a < P.aI - P.alpha && !(a > P.rampA1 - 9 / P.RQ && a < P.aI + 2 / P.RQ)) lantern(p[0], y, p[1], a > P.rampA1 - 40 / P.RQ && a < P.aI ? 0 : 0.22);
    for (const off of [3.4, 8.1]) {
      const ap = a + off / P.RQ, q = P.pos(P.RQ + 0.38, ap), yp = ap > P.rampA1 ? P.rimY : P.rampY(ap), s = 0.17 + 0.05 * rng();
      if (ap > P.aI - P.alpha) continue;
      // (round 3, stage D: no green cube on a teal cube: A ROUND TAPERED POT of terracotta or of stone, narrow at
      // the foot, with a rolled rim, and A SOFT CLUMP of leaves in it (eight sides, smooth, a little uneven))
      const pc = rng.pick(pal.pot), ph = rng() * 6.28, tall = ap > P.rampA1 - 20 / P.RQ && ap < P.rampA1;
      shade(q[0], q[1], 0.27, tall ? 1.9 : 0.8, yProm);
      // (round 5, C7) THE PLANTER SITS ON THE PAVING: a small dark patch of contact shade round its foot (a
      // diamond of 0.4 m, paving in cast shade, a third deeper), by day
      if (night < 0.5) g.kind(KIND.PAVE).col(mulc(pal.pave, 0.66)).move(-1).quad(...[[-0.4, 0], [0, 0.4], [0.4, 0], [0, -0.4]].map(([dx, dz]) => [q[0] + dx, yProm(q[0] + dx, q[1] + dz) + 0.027, q[1] + dz]), [0, 1, 0]).move(0);
      g.kind(KIND.LIME).col(pc[0] > pc[2] ? [0.74, 0.44, 0.29] : [0.8, 0.77, 0.7]);
      lathe(q[0], yp, q[1], [[s * 0.8, 0], [s * 1.3, 0.3], [s * 1.42, 0.35], [s * 1.2, 0.36]], 0, 0);
      g.kind(KIND.LEAF).col(mulc(pal.leaf[ph < 3.14 ? 0 : 1], 0.8)).move(0.2);
      // (along the street's last 20 m the line goes high over the rail: there the bush is a soft flame, 1.9 m)
      lathe(q[0], yp, q[1], tall ? [[0.16, 0.3], [0.3, 0.6], [0.27, 1.05], [0.17, 1.5], [0.03, 1.9]] : [[0.17, 0.3], [0.31, 0.46], [0.27, 0.64], [0.13, 0.78], [0.02, 0.82]], 0.16, ph);
      g.move(0);
    }
  }
  // (stage F: the coping's lanterns are too small to read as lamps from the line) A LAMP STANDARD
  // stands at the uphill outer corner of each planted bay, 3.3 m: a stone foot, an iron post and seat, a straight
  // glass (amber, it glows), a low iron cap of the glass's own width (round 4, D1: plain; it had a broad peaked
  // cap and a finial)
  for (const ab of P.belv || []) {
    const a = ab + 2.1 / P.RQ, p = P.pos(P.RQ - 2.25, a), x = p[0], z = p[1], y = P.rampY(a);
    g.kind(KIND.STONE).col(pal.parapet).box(x - 0.2, y, z - 0.2, x + 0.2, y + 0.45, z + 0.2, 'y');
    g.kind(KIND.TIMBER).col(iron).box(x - 0.05, y + 0.45, z - 0.05, x + 0.05, y + 2.7, z + 0.05, 'yY');
    // (round 4, D1) A PLAIN LANTERN: no cross plate under the glass, no peaked cap broader than it, no finial: a
    // seat as wide as the glass, a straight glass, a low cap of its own width
    g.box(x - 0.13, y + 2.7, z - 0.13, x + 0.13, y + 2.76, z + 0.13, '');
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) {
      const e = c[i], f = c[(i + 1) % 4], nx = (e[0] + f[0]) / 2, nz = (e[1] + f[1]) / 2;
      g.kind(KIND.LAMP).col([0.8, 0.46, 0.15]).move(1);
      const v0 = g.vert(x + e[0] * 0.11, y + 2.76, z + e[1] * 0.11, nx, 0, nz), v1 = g.vert(x + f[0] * 0.11, y + 2.76, z + f[1] * 0.11, nx, 0, nz);
      const v2 = g.vert(x + f[0] * 0.12, y + 3.2, z + f[1] * 0.12, nx, 0, nz), v3 = g.vert(x + e[0] * 0.12, y + 3.2, z + e[1] * 0.12, nx, 0, nz);
      g.tri(v0, v1, v2); g.tri(v0, v2, v3);
      g.kind(KIND.TIMBER).col(iron).move(0);
      g.tri(g.vert(x + e[0] * 0.13, y + 3.2, z + e[1] * 0.13, nx, 0.7, nz), g.vert(x + f[0] * 0.13, y + 3.2, z + f[1] * 0.13, nx, 0.7, nz), g.vert(x, y + 3.27, z, nx, 0.7, nz));
    }
  }
  // (stage F) THREE CYPRESSES IN TUBS stand before the arcades on the land side of the rising street's last 21 m
  // (where the line has eased out toward the rail there is room for them): slender, 5.0 to 5.6 m, each in a
  // square tub of fired clay; their leaves stir by the clock
  [21, 13, 5].forEach((s, i) => {
    const a = P.rampA1 - s / 275.15, p = P.pos(275.15, a), y = P.rampY(a), h = 5.0 + 0.3 * i;
    g.kind(KIND.LIME).col(pal.pot[i % 2]).box(p[0] - 0.36, y, p[1] - 0.36, p[0] + 0.36, y + 0.5, p[1] + 0.36, 'y');
    trees.push({ m: new THREE.Matrix4().makeTranslation(p[0], y + 0.42, p[1]).multiply(_r.makeRotationY(1.7 * i)).multiply(_s.makeScale(1.1, h, 1.1)), a: [0.27 + 0.31 * i, 0, 0.6 - 0.2 * i, 0], c: mulc(pal.cypress[0], 0.95 + 0.07 * i) });
  });
  // the causeway's and the jetty's lamps: an iron post, an arm over the street where it has one, a lantern
  for (const s of P.posts || []) {
    const qx = s.x + s.ax * 0.65, qz = s.z + s.az * 0.65, y = s.y1;
    g.kind(KIND.TIMBER).col(iron).box(s.x - 0.06, s.y0, s.z - 0.06, s.x + 0.06, y, s.z + 0.06, 'yY');
    if (s.ax || s.az) g.quad([s.x, y - 0.3, s.z], [qx, y - 0.03, qz], [qx, y + 0.03, qz], [s.x, y + 0.03, s.z], [-s.az, 0, s.ax]);
    hang(qx, y, qz);
  }
  // (round 3, C2) THE QUAY'S THINGS, no figure and no creature: along the flown quay (from 8 degrees before the
  // bay's middle to the rising street's foot) something stands every 9 m on the land side of the deck, before the
  // arcades, a different thing at each place by turns (none at the stair lane's foot): see quayThing
  const hq = (i) => Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1;
  for (let i = 0, a = -8 * D2R; a < P.rampA0 - 5 / P.RQ; a += 9 / P.RQ, i++) {
    // (C1: A MOORING POST WITH ITS IRON RING on the kerb, between the things: a low stone block, an iron band)
    const q = P.pos(P.RQ + 0.34, a + 4.5 / P.RQ);
    g.kind(KIND.STONE).col(mulc(pal.quay, 1.1)).box(q[0] - 0.17, P.DECK, q[1] - 0.17, q[0] + 0.17, P.DECK + 0.44, q[1] + 0.17, 'y');
    g.kind(KIND.TIMBER).col(iron).box(q[0] - 0.2, P.DECK + 0.27, q[1] - 0.2, q[0] + 0.2, P.DECK + 0.33, q[1] + 0.2, '');
    shade(q[0], q[1], 0.19, 0.5);
    if (Math.abs(a - P.lanes[3].a) * P.RQ < 9) continue;
    const r = P.RQ + 4.1 + 1.1 * hq(i), p = P.pos(r, a + (hq(i + 50) - 0.5) * 2.4 / P.RQ);
    const T = [Math.cos(a), Math.sin(a)], R = [Math.sin(a), -Math.cos(a)];
    quayThing(g, pal, (i * 3 + Math.floor(hq(i + 9) * 2)) % 8, (s, o, y) => [p[0] + T[0] * s + R[0] * o, P.DECK + y, p[1] + T[1] * s + R[1] * o], hq(i + 20));
    shade(p[0], p[1], 0.85, 1.3);
  }
  // (C1: the rising street is no bare third of paving either: low things only on its land side, before the
  // arcades, every 11 m up to the cypress tubs: a bench, pots on steps with a ladder, baskets; each lies on the
  // slope)
  for (let i = 0, a = P.rampA0 + 7 / P.RQ; a < P.rampA1 - 27 / P.RQ; a += 11 / P.RQ, i++) {
    const p = P.pos(P.RQ + 5.2, a), T = [Math.cos(a), Math.sin(a)], R = [Math.sin(a), -Math.cos(a)];
    quayThing(g, pal, [2, 6, 1][i % 3], (s, o, y) => [p[0] + T[0] * s + R[0] * o, P.rampY(a + s / P.RQ) + y, p[1] + T[1] * s + R[1] * o], hq(i + 70));
  }
  return { g, lamps, trees };
}

// ---------------------------------------------------------------- the cypresses (instanced) and the long hall
export function treeGeo() {
  // (round 3, C4) NO FACETED CONE: a tall soft flame of nine sides and seven rings, every ring's girth swelling
  // and shrinking round it (lobes that overlap from ring to ring), its axis leaning a little from ring to ring,
  // the normals round and smooth so the sun gives it a lit and a shaded side; scaled broad it is a round head of
  // clumped foliage
  // (a round head read as a faceted lump on the quay: twelve sides, not nine, and the lobes
  // swell by 0.15 of the girth, not 0.24: a softer, rounder form, the cypress's flame a little smoother with it)
  const g = makeGeo().kind(KIND.LEAF).col([1, 1, 1]), n = 12;
  const rings = [[0.1, 0.15], [0.2, 0.36], [0.36, 0.47], [0.54, 0.45], [0.72, 0.34], [0.88, 0.18], [1.0, 0.02]];
  const V = (j, i) => {
    const [y, r] = rings[j], t = (i % n) / n * 6.2832, rr = r * (1 + 0.15 * Math.sin((i % n) * 2.4 + j * 1.9) * (j > 0 && j < 6 ? 1 : 0.3));
    const cx = 0.035 * Math.sin(j * 2.3), cz = 0.035 * Math.cos(j * 1.7), up = 0.25 + 0.9 * y * y;
    return g.vert(cx + Math.cos(t) * rr, y, cz + Math.sin(t) * rr, Math.cos(t), up, Math.sin(t), 0, 0, y * y);
  };
  for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < n; i++) {
    const a = V(j, i), b = V(j, i + 1), c = V(j + 1, i + 1), d = V(j + 1, i);
    g.tri(a, b, c); g.tri(a, c, d);
  }
  g.kind(KIND.TIMBER).col([0.35, 0.28, 0.2]).move(0).box(-0.05, 0, -0.05, 0.05, 0.14, 0.05, 'yY');
  return g.build();
}
export function layTrees(P, rng, pal, density, hall, gardens = [], keep = () => true) {
  const list = [], leafG = (k) => [pal.leaf[0][0] * 0.5 * k, pal.leaf[0][1] * 0.95 * k, pal.leaf[0][2] * 1.2 * k];
  // (the guard: the quay's bushes were faceted green masses close to the line: on the
  // quay's own level, sm = 0.55, a round head is a bush 1.7 to 3.9 m across and as high as it is broad)
  const put = (r, a, y, sm = 1) => {
    // (round 5, B3: CYPRESS FEWER, ROUND-HEADED TREES AMONG THEM: by the place's own figure two trees in five of
    // the crest's row and the lanes' are round heads of leaf green, two thirds the height and 2.4 times the
    // girth (under 6.7 m across: clear of the lanes' stairs), and one in seven is left out. L4: by the seed's
    // own draw, not by a figure of the place that kept an older deal)
    const p = P.pos(r, a), h = rng.range(6.5, 11), w = h * rng.range(0.2, 0.27), q = rng(), fg = 0.2 + 0.8 * rng(), round = q < 0.4, none = q > 0.857;
    const t = { m: new THREE.Matrix4().makeTranslation(p[0], y, p[1]).multiply(_r.makeRotationY(rng() * 6.28)).multiply(round ? _s.makeScale(w * 2.4 * sm, sm < 1 ? w * 2.4 * sm * 1.05 : h * 0.66, w * 2.4 * sm) : _s.makeScale(w, h, w)), a: [rng(), 0, rng(), 0], c: mulc(rng.pick(pal.cypress), rng.range(0.8, 1.15)) };
    // (the guard: an olive-yellow lump at the quay stair: the paler leaf tone in the low sun. Every round head
    // is the deeper leaf green, a touch cooler; the place's figure varies it as before)
    // (in the gold light that green was lime: half the red, a fifth more blue)
    if (round) t.c = leafG(0.74 + 0.3 * (fg - 0.2));
    if (!none) list.push(t);
  };
  // a dark line of cypresses on the crest above the top tier, thinner toward the horns; none where the hall stands
  // (round 2: A ROW along the crest's edge, 4 to 8 m apart, with a few behind it; it stops where the hall stands)
  const clT = crestLot(P, hall), rowPh = rng() * 6.2832;
  for (let a = -P.aMax + 0.02; a < P.aMax - 0.02; a += rng.range(4, 8) / 330 / density) {
    const nt = P.tiersAt(a), off0 = rng.chance(0.75) ? rng.range(2.5, 4.5) : rng.range(8, 20);
    // (round 3, C6: NOT A RULED LINE: the row breaks in stretches of some 25 m, where the trees stand well back,
    // and between the breaks they stand in clumps, a little in and out; L4: the breaks fall by the seed's phase)
    const gap = Math.sin(a * 23 + rowPh) + 0.6 * Math.sin(a * 61 + 1 + 2.7 * rowPh) > 0.7, wob = Math.sin(a * 140 + rowPh);
    const off = off0 + (gap ? 12 + 5 * wob : off0 < 5 ? 1.6 * wob + 1 : 0);
    if (Math.abs(a - hall.a) < hall.half + 0.02 && off < 16) continue;
    // (round 5 mending 2: on the crest house's lot the row stands back behind it, 17 m and more)
    if (Math.abs(a - clT.a) < (clT.w / 2 + 3) / clT.rF && off < 16) { put(P.tierR(nt) + 17 + off * 0.2, a, P.tierY(nt) + 8.2); continue; }
    put(P.tierR(nt) + off, a + (gap ? 0 : 0.006 * Math.sin(a * 310)), P.tierY(nt) + Math.min(13, off * 0.5) - 0.3);
  }
  // two cypresses stand in every stair lane's gap on every tier, before the bare wall at the flight's foot
  for (const l of P.lanes) for (let k = 0; k < P.tiersAt(l.a); k++) {
    const r = P.tierR(k) + 3.2, dir = k % 2 ? 1 : -1;
    // (round 3: one on each side of the zigzag stair, 8.6 m from the gap's middle)
    for (const t of [0.11, 0.89]) put(r, l.a + dir * (11 / r) * (2 * t - 1), P.tierY(k), k ? 1 : 0.55);
  }
  // (stage E: a slender cypress in each planted bay of the rising street)
  // (round 3, C6: NOT A RULED LINE: heights from 4.2 to 7.5 m, and about one bay in four stands empty of a tree;
  // the bay empty by a draw)
  for (const ab of P.belv || []) {
    // (the guard: on the rising street a near dark cypress stood hard by the lens: the line
    // passes 4.4 m from each, the sun beyond it. They cannot stand back, a bay is 1.75 m deep: they stand 2.8 to
    // 4.5 m high, under the eye's line (the lens is 4.2 m over the street), and a quarter lighter)
    // (L4: height and the empty bay by the trees' own draws; M4b 2: each carries its bay's place, see P.belvTree)
    const p = P.pos(P.RQ - 1.75, ab), h = rng.range(2.8, 4.5), none = rng.chance(0.25);
    (none ? [] : list).push({ bay: ab, m: new THREE.Matrix4().makeTranslation(p[0], P.rampY(ab) - 0.1, p[1]).multiply(_r.makeRotationY(rng() * 6.28)).multiply(_s.makeScale(1.15, h, 1.15)), a: [rng(), 0, rng(), 0], c: mulc(pal.cypress[1], rng.range(1.1, 1.35)) });
  }
  // (stage E: two cypresses on the west bastion's terrace beside the basin, 3.6 m back from the
  // flank's rim: from the bridge's end the terrace was bare paving; stage F: none on the east one, the line
  // passes over it)
  for (const [sg, a0] of [[-1, P.aI - P.alpha]]) for (const r of [279.5, 285.5]) {
    const p = P.pos(r, a0 + sg * 3.6 / r), h = rng.range(5.2, 6.6);
    list.push({ m: new THREE.Matrix4().makeTranslation(p[0], P.rimY - 0.1, p[1]).multiply(_r.makeRotationY(rng() * 6.28)).multiply(_s.makeScale(1.25, h, 1.25)), a: [rng(), 0, rng(), 0], c: mulc(pal.cypress[0], rng.range(0.9, 1.1)) });
  }
  // the garden terraces: two or three trees each, slender or broad
  for (const gd of gardens) {
    const n = rng.int(2, 3);
    for (let i = 0; i < n; i++) {
      const a = gd.a0 + (gd.a1 - gd.a0) * (i + rng.range(0.25, 0.75)) / n, p = P.pos(gd.r + rng.range(2.2, 5.6), a), h = rng.range(7, 12), broad = rng.chance(0.6), w = h * (broad ? rng.range(0.6, 0.85) : rng.range(0.22, 0.3));
      list.push({ m: new THREE.Matrix4().makeTranslation(p[0], P.tierY(gd.k), p[1]).multiply(_r.makeRotationY(rng() * 6.28)).multiply(_s.makeScale(w, broad ? h * 0.75 : h, w)), a: [rng(), 0, rng(), 0], c: broad ? leafG(rng.range(0.7, 1.05)) : mulc(rng.pick(pal.cypress), rng.range(0.7, 1.05)) }); // (mending 2: a garden's broad tree is the same cool leaf green as every round head; L4: no tone is picked for it and thrown away)
    }
  }
  // (ROUND 5 MENDING 5, L6: every tree is drawn first and then asked of THE ONE RULE OF THE LINE at its top; and
  // the middle of its crown keeps its own half width and 2.5 m of clear air from the line)
  const kept = list.filter((t) => {
    const e = t.m.elements, wd = Math.hypot(e[0], e[2]);
    return keep('tree', e[12], e[13] + e[5], e[14]) && keep('tree', e[12], e[13] + 0.6 * e[5], e[14], wd / 2 + 2.5, Infinity);
  });
  // (MENDING 6, M4b 2) P.belvTree: which of the rising street's planted bays carries a tree after its draw and
  // after the rule of the line; the long shadow across the street is laid for those bays only (makeStreetThings)
  P.belvTree = (P.belv || []).map((ab) => kept.some((t) => t.bay === ab));
  return kept;
}
// the long plain hall with its open arcade, on the crest terrace at the back (its place is the plan's deal)
export function makeHall(P, pal, hall) {
  // (round 5, B2: the hall and its tower stood chalk white over a golden city: their stone is a
  // honey tone, two fifths of the way from the bone wash to a warm ochre, so the first sun lights them gold)
  pal = Object.assign({}, pal, { hall: mixc(pal.hall, [0.84, 0.6, 0.34], 0.4) });
  const g = makeGeo(), nt = P.tiersAt(hall.a), r0 = P.tierR(nt) + 3, y0 = P.tierY(nt) + 5, H = 12.5, Dp = 10, nA = hall.arches;
  const a0 = hall.a - hall.half, a1 = hall.a + hall.half, V = (r, a, y) => { const p = P.pos(r, a); return [p[0], y, p[1]]; };
  const nIn = [-Math.sin(hall.a), Math.cos(hall.a)];
  // a plinth under it, the arcade's front, side walls, the back, a hipped roof of slate
  g.kind(KIND.STONE).col(pal.bastion).quad(V(r0 - 0.6, a0, y0 - 5.5), V(r0 - 0.6, a1, y0 - 5.5), V(r0 - 0.6, a1, y0), V(r0 - 0.6, a0, y0), [nIn[0], 0, nIn[1]]);
  g.kind(KIND.PAVE).col(pal.pave).quad(V(r0 - 0.6, a0, y0), V(r0 - 0.6, a1, y0), V(r0 + Dp, a1, y0), V(r0 + Dp, a0, y0), [0, 1, 0]);
  // (round 5, B2) THE LANDMARK ON THE CREST: A GREAT OPEN ARCADE OF TWO STOREYS. Over the first arcade stands a
  // second of the same nine arches (its ring springs 2.2 m over its own floor, a string course between the two),
  // so the hall's front is 12.5 m and then the arch's radius and 3.4 m more; and ONE TALL BELVEDERE TOWER of
  // stacked open galleries rises from it (see below), twice the height of anything near it
  const H2 = r0 * Math.sin((a1 - a0) / nA / 2) - 0.8 + 3.4, HT = H + H2;
  g.kind(KIND.STONE).col(mulc(pal.hall, 1.08)).quad(V(r0 - 0.3, a0, y0 + H - 0.45), V(r0 - 0.3, a1, y0 + H - 0.45), V(r0 - 0.3, a1, y0 + H + 0.12), V(r0 - 0.3, a0, y0 + H + 0.12), [nIn[0], 0, nIn[1]]);
  for (const [yF, sp, hh] of [[y0, 4.4, H], [y0 + H, 2.2, H2]]) for (let i = 0; i < nA; i++) {
    const b0 = a0 + (a1 - a0) * i / nA, b1 = a0 + (a1 - a0) * (i + 1) / nA, A = P.pos(r0, b0), B = P.pos(r0, b1);
    // (each arch stands on piers 1.6 m wide and is stilted: its ring springs 4.4 m over the floor)
    const R = Math.hypot(B[0] - A[0], B[1] - A[1]) / 2 - 0.8;
    archPanel(g, A, B, hh - sp, R, nIn, 3.2, { quay: pal.hall }, true, 8, yF + sp);
    const pA = P.pos(r0, b0 + (b1 - b0) * 0.8 / (R + 0.8) / 2), pB = P.pos(r0, b1 - (b1 - b0) * 0.8 / (R + 0.8) / 2), nn = [nIn[0], 0, nIn[1]];
    g.kind(KIND.STONE).col(pal.hall);
    g.quad([A[0], yF, A[1]], [pA[0], yF, pA[1]], [pA[0], yF + sp, pA[1]], [A[0], yF + sp, A[1]], nn);
    g.quad([pB[0], yF, pB[1]], [B[0], yF, B[1]], [B[0], yF + sp, B[1]], [pB[0], yF + sp, pB[1]], nn);
    g.kind(KIND.ROOM).col(mulc(pal.hall, 0.3)).quad([pA[0] - nIn[0] * 3.2, yF, pA[1] - nIn[1] * 3.2], [pB[0] - nIn[0] * 3.2, yF, pB[1] - nIn[1] * 3.2], [pB[0] - nIn[0] * 3.2, yF + sp, pB[1] - nIn[1] * 3.2], [pA[0] - nIn[0] * 3.2, yF + sp, pA[1] - nIn[1] * 3.2], nn);
  }
  g.kind(KIND.LIME).col(pal.hall);
  g.quad(V(r0, a0, y0), V(r0 + Dp, a0, y0), V(r0 + Dp, a0, y0 + HT), V(r0, a0, y0 + HT), [-Math.cos(hall.a), 0, -Math.sin(hall.a)]);
  g.quad(V(r0 + Dp, a1, y0), V(r0, a1, y0), V(r0, a1, y0 + HT), V(r0 + Dp, a1, y0 + HT), [Math.cos(hall.a), 0, Math.sin(hall.a)]);
  g.quad(V(r0 + Dp, a0, y0), V(r0 + Dp, a1, y0), V(r0 + Dp, a1, y0 + HT), V(r0 + Dp, a0, y0 + HT), [-nIn[0], 0, -nIn[1]]);
  g.kind(KIND.SLATE).col(pal.slate);
  const rm = r0 + Dp / 2, yr = y0 + HT + 2.6, e = 0.012;
  g.quad(V(r0 - 0.5, a0 - e / 4, y0 + HT), V(r0 - 0.5, a1 + e / 4, y0 + HT), V(rm, a1 - e, yr), V(rm, a0 + e, yr), [nIn[0] * 0.5, 0.86, nIn[1] * 0.5], [0, 0, 1, 0, 1, 1, 0, 1]);
  g.quad(V(r0 + Dp + 0.5, a1 + e / 4, y0 + HT), V(r0 + Dp + 0.5, a0 - e / 4, y0 + HT), V(rm, a0 + e, yr), V(rm, a1 - e, yr), [-nIn[0] * 0.5, 0.86, -nIn[1] * 0.5], [0, 0, 1, 0, 1, 1, 0, 1]);
  g.quad(V(r0 - 0.5, a0 - e / 4, y0 + HT), V(rm, a0 + e, yr), V(rm, a0 + e, yr), V(r0 + Dp + 0.5, a0 - e / 4, y0 + HT), [-Math.cos(hall.a) * 0.6, 0.8, -Math.sin(hall.a) * 0.6]);
  g.quad(V(r0 + Dp + 0.5, a1 + e / 4, y0 + HT), V(rm, a1 - e, yr), V(rm, a1 - e, yr), V(r0 - 0.5, a1 + e / 4, y0 + HT), [Math.cos(hall.a) * 0.6, 0.8, Math.sin(hall.a) * 0.6]);
  // (round 5, B2 raised a belvedere tower of stone galleries here, through the hall's roof: gone in mending 2)
  // (round 5 mending 2) THE SHAFT AND ITS GALLERIES ARE GONE (the guard: a bell tower over a palace). The crest's
  // tall veranda house stands beside the hall's end (crestLot) on THIS BASE of the bastions' stone: plain, a
  // string course at the hall's floor, a paved top; no opening in it
  const cl = crestLot(P, hall), hwA = (cl.w / 2 + 0.9) / cl.rF, b0 = cl.a - hwA, b1 = cl.a + hwA, rA = cl.rF - 1.1, rB = cl.rF + P.ROOMD + 1.2, yb = P.tierY(nt) - 20;
  const nC = [-Math.sin(cl.a), 0, Math.cos(cl.a)], tC = [Math.cos(cl.a), 0, Math.sin(cl.a)];
  g.kind(KIND.STONE).col(pal.bastion);
  g.quad(V(rA, b0, yb), V(rA, b1, yb), V(rA, b1, cl.y0), V(rA, b0, cl.y0), nC);
  g.quad(V(rA, b0, yb), V(rB, b0, yb), V(rB, b0, cl.y0), V(rA, b0, cl.y0), [-tC[0], 0, -tC[2]]);
  g.quad(V(rB, b1, yb), V(rA, b1, yb), V(rA, b1, cl.y0), V(rB, b1, cl.y0), tC);
  g.col(mulc(pal.hall, 1.08)).quad(V(rA - 0.06, b0, cl.yH - 0.3), V(rA - 0.06, b1, cl.yH - 0.3), V(rA - 0.06, b1, cl.yH + 0.15), V(rA - 0.06, b0, cl.yH + 0.15), nC);
  g.kind(KIND.PAVE).col(pal.pave).quad(V(rA, b0, cl.y0), V(rA, b1, cl.y0), V(rB, b1, cl.y0), V(rB, b0, cl.y0), [0, 1, 0]);
  return { g, top: cl.y0 + 25, r0, y0 };
}

// ---------------------------------------------------------------- the far shore (doubled like everything that stands)
// Hills in haze right round the lake, 1.5 km and more from the bay's centre, in THREE ranges (round 4, B5: they
// were two, so low that the haze took them and sea and sky ran together): each range higher and paler than the one
// before it, so wherever we look out over the water there is a level line where they stand on their doubles and
// the sky begins above a blue outline, not at the water. Their outline is the seed's (stream shore).
// (ROUND 5 MENDING 5, L4) THE OPEN LAKE'S TWO ISLETS FALL BY THE SEED (stream shore), one to each side of the bay's
// axis, in a ring about the bay's centre: bearing 100 to 165 degrees from the crescent's middle (25 degrees and
// more beyond a horn, so across the bay's centre from the causeway and well off the line), 200 to 290 m out (past
// the causeway's reach of 220 m; near enough to stand as a house on a rock; a fifth of the way to the far shore).
// Laid on the plan as P.farIsles: x, z (city's space), the rock's turn; the water's sheet reads them there.
// THE NEAR ROCK. Of the two, the one dealt on the causeway's foot's side of the bay's axis stands nearer the
// way: abreast of the causeway's second span on the lake's side (where along that span, by its bearing's draw),
// out across the line, its middle ROCK_OFF 70 to 110 m beyond the line's plan (by its distance's draw), its
// long axis along the causeway, turned 0.05 to 0.3 rad (by its turn's draw) with the end toward the second
// islet swung out on the lake. The same three draws, mapped: the shore's stream runs the same. The other is
// THE FAR ISLET and stays where it is dealt. The rocks are a geometry of their own (rocks), not the ranges'.
// (ROCK_BIG: only its second figure is read: it sets the far islet's two thirds)
export const ROCK_OFF = [70, 110], ROCK_BIG = [2, 1.5];
// A ROCK OF CRAGS, A CLUMP. The near rock is no low back under one sloped top and no long row of equal
// teeth: it is 48 to 58 m long and 19 to 24 m broad (seeds 1 to 300), of CRAG_N 4 or 5 crags of plainly
// differing size standing into one another. ONE GREAT
// CRAG, CRAG_GREAT 12 to 16 m high, 14 to 20 m broad and 16 to 20 m long at its foot, stands at one end (which,
// by a draw), its summit off the rock's middle; beside it THE HOUSE'S CRAG, CRAG_HOUSE 8 to 11 m, a block level
// on top that holds the terrace whole; past that two low stones, CRAG_LOW 3 to 7 m (the nearer the taller); a
// fifth, if dealt, a low stone before the join of the great crag and the house's, on either hand. The great
// crag has three points, a low stone two, no two of a crag alike in height by less than a metre; no crest of
// teeth anywhere. Every side is steep (76 degrees and more: each takes the damp band at the water). Count,
// sizes, places, points and every facet come from the stream road. The far islet takes the same law at two
// thirds (every height, and every crag's plan but its house's)
export const CRAG_N = [4, 5], CRAG_GREAT = [12, 16], CRAG_HOUSE = [8, 11], CRAG_LOW = [3, 7], ROCK_TONE = 0.67;
// (k: the far islet's two thirds, of every height and of every crag's plan but the house's, which carries the
// same house. s: a crag's middle along the rock from the great crag's end; returns the half-length A too)
export function dealCrags(road, k = 1) {
  const n = CRAG_N[0] + Math.floor(road() * 2), e = road.chance(0.5) ? 1 : -1;
  // (the low stones' heights a metre and more apart: two, or three)
  const hs = (n > 4 ? [[3, 3.8], [6.4, 7], [4.8, 5.4]] : [[3, 4.4], [5.6, 7]]).map((r) => k * road.range(r[0], r[1]));
  const G = { la: k * road.range(8, 10.2), lb: k * road.range(7, 10), h: k * road.range(CRAG_GREAT[0], CRAG_GREAT[1]), great: true, m: 7 };
  const H = { la: road.range(11, 12.5), lb: road.range(9.5, 10.5), h: k * road.range(CRAG_HOUSE[0], CRAG_HOUSE[1]), house: true, m: 8 };
  const O1 = { la: k * road.range(4, 5.3), lb: k * road.range(3, 4.5), h: hs[1], m: 6 }, O2 = { la: k * road.range(2.8, 3.8), lb: k * road.range(2.2, 3.2), h: hs[0], m: 6 };
  G.s = G.la; H.s = 1.85 * G.la + H.la; O1.s = H.s + H.la + 0.8 * O1.la; O2.s = O1.s + O1.la + 0.5 * O2.la;
  const A = (O2.s + O2.la) / 2, crags = [G, H, O1, O2];
  // (the fifth: a low stone before the join of the great crag and the house's, on either hand: a clump, no line)
  if (n > 4) { const lb = k * road.range(2.5, 3.5); crags.push({ la: k * road.range(3, 4.5), lb, h: hs[2], m: 6, s: 1.85 * G.la * road.range(0.8, 1.1), b: (road.chance(0.5) ? 1 : -1) * (12.7 - 1.12 * lb) }); }
  for (const q of crags) {
    q.a = e * (A - q.s); if (q.b === undefined) q.b = q.house || q.great ? 0 : k * road.range(-3, 3);
    // ITS POINTS (along, across, height): the great crag's three, a low stone's two: the summit at one of the
    // places by a draw, the others 2 to 4.5 and 5.5 to 8 m under it (a low stone's: 1 m to 0.45 of its height)
    const drop = q.great ? [road.range(2, 4.5), road.range(5.5, 8)] : [road.range(1, 0.45 * q.h / k)], pos = q.great ? [-0.38, 0.04, 0.42] : [-0.25, 0.25], si = Math.floor(road() * pos.length);
    q.pts = q.house ? [] : pos.map((p, i) => [q.a + p * q.la + k * road.range(-0.5, 0.5), q.b + k * road.range(-0.8, 0.8), q.h - k * (i === si ? 0 : drop.shift())]);
  }
  return { A, crags };
}
// one crag into g. W(a, b, y): a place along and across the rock at a height, in the city's space; every facet a
// triangle of its own normal and its own tone (0.8 to 1.08). Returns the foot's outline (the roadstead keeps
// its distance from it)
export function buildCrag(g, W, q, road, tone) {
  const T3 = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1;
    g.col(mulc(tone, road.range(0.8, 1.08)));
    g.tri(...[a, b, c].map((p) => g.vert(p[0], p[1], p[2], n[0] / l, n[1] / l, n[2] / l)));
  };
  // THE FOOT, of q.m sides, runs in and out (0.88 to 1.06 of its oval); THE RIM over it stands at 0.4 to 0.75 of
  // the height of the point that side of the crag rises to, set in by 0.15 to 0.3 of its own height (faces of
  // 73 degrees and steeper); from the rim the rock climbs in facets to its points, a ridge from point to point.
  // THE HOUSE'S CRAG is a block: a foot of eight sides on a rectangle's corners and sides, an uneven rim up to
  // 2.6 m under its height (the terrace's wall stands on it), set in by 0.08 to 0.14 of its height, and a top
  // that holds the terrace whole
  const m = q.m, P = q.pts, lo = [], hi = [], own = [], ph = q.house ? 0 : road() * 6.2832;
  for (let j = 0; j < m; j++) {
    const t = ph + (j + (q.house ? 0 : road.range(-0.25, 0.25))) / m * 6.2832, f = q.house ? road.range(0.95, 1.06) : road.range(0.88, 1.06);
    const cs = Math.cos(t), sn = Math.sin(t), sq = q.house ? 1 / Math.max(Math.abs(cs), Math.abs(sn)) : 1, x = cs * sq * q.la * f, z = sn * sq * q.lb * f;
    let p = 0; for (let i = 1; i < P.length; i++) if (Math.abs(P[i][0] - q.a - 0.6 * x) < Math.abs(P[p][0] - q.a - 0.6 * x)) p = i;
    const hj = q.house ? q.h - road.range(0, 2.6) : P[p][2] * road.range(0.4, 0.75), d = Math.max(0.3, 1 - hj * (q.house ? road.range(0.08, 0.14) : road.range(0.15, 0.3)) / Math.hypot(x, z));
    lo.push([x, z, 0]); hi.push([x * d, z * d, hj]); own.push(p);
  }
  // (THE GREAT CRAG'S FOOT IS AS BROAD AS DEALT, 14 to 20 m across the rock, whatever its outline's ins and outs)
  const zb = q.great ? 2 * q.lb / (Math.max(...lo.map((v) => v[1])) - Math.min(...lo.map((v) => v[1]))) : 1;
  for (const r of [lo, hi]) r.forEach((v, j) => { r[j] = W(q.a + v[0], q.b + v[1] * zb, v[2]); });
  const top = q.house ? [W(q.a, q.b, q.h)] : P.map((p) => W(p[0], p[1], p[2]));
  for (let j = 0; j < m; j++) {
    const i = (j + 1) % m, sg = Math.sign(own[i] - own[j]);
    T3(lo[i], lo[j], hi[j]); T3(lo[i], hi[j], hi[i]); T3(hi[i], hi[j], top[own[j]]);
    for (let p = own[j]; p !== own[i]; p += sg) T3(hi[i], top[p], top[p + sg]);
  }
  return lo;
}
// THE TWO ISLETS' FOOTING (the opening's islet tower's plinth and the bay's islet house's), so that neither
// stands on a bare slab's edge. AT EACH OF A PLINTH'S FOUR CORNERS FOOT_N 2 or 3 stones of dark wet
// rock stand in the water (8 to 12 an islet), each fanned out from the corner (22, 45 and 68 degrees from the
// one face, or 30 and 60), FOOT_OUT 1 to 3 m long from the plinth's foot and 0.7 to 1.2 m broad, FOOT_H 0.5 to
// 1.6 m over the plane, of the lake rocks' tone (ROCK_TONE) and facets, with the damp band. A corner is before no
// arch's mouth and not before the water stair: the faces between stay clear. A stone is left out (after its
// draws: the stream flank runs the same) where the rule of the line refuses it, or where it would leave less
// than half a metre of water to a hull, to a mooring pile or to the second islet's bridge. They
// are of the lake rocks' geometry: doubled, and dark by night with them. P.footing: every stone dealt
export const FOOT_N = [2, 3], FOOT_OUT = [1, 3], FOOT_H = [0.5, 1.6];
export const rockTone = (pal) => { const l0 = (pal.quay[0] + pal.quay[1] + pal.quay[2]) / 3; return pal.quay.map((v, i) => ROCK_TONE * (0.25 * v + 0.75 * l0) * (i > 1 ? 1.05 : 1)); };
export function makeFooting(g, P, pal, flank, keep, lay) {
  const tone = rockTone(pal), bq = P.pos(P.RQ + 1.5, P.aMax); P.footing = [];
  const seg = (x, z, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1))); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
  for (const isl of [P.isle, P.isle2]) if (isl) {
    const [ix, iz, nx, nz] = isl, first = isl === P.isle, out = first ? 1.5 + 0.18 : 2.4 + 0.9, hl = P.ROOMD + out, hw = 1.5 * P.bay * 0.95 + out;
    for (const su of [1, -1]) for (const sv of [1, -1]) {
      const n = FOOT_N[0] + Math.floor(flank() * 2);
      for (let i = 0; i < n; i++) {
        const phi = (n > 2 ? [22, 45, 68][i] : [30, 60][i]) * D2R + flank.range(-0.1, 0.1), la = flank.range(FOOT_OUT[0], FOOT_OUT[1]) / 2, lb = flank.range(0.35, 0.6), h = flank.range(FOOT_H[0], FOOT_H[1]);
        const cu = su * Math.cos(phi), cv = sv * Math.sin(phi), dx = cu * nx - cv * nz, dz = cu * nz + cv * nx, u = su * hl + cu * la * 0.9, v = sv * hw + cv * la * 0.9;
        const x = ix + nx * u - nz * v, z = iz + nz * u + nx * v;
        // (asked along the stone's own length, at five places from its inner end to its outer: a hull's side is
        // 0.8 m from its middle line, the bridge's 1.2 m; half a metre of water is left)
        const ok = keep('stone', x, h, z) && [-1, -0.5, 0, 0.5, 1].every((t) => { const sx = x + t * la * dx, sz = z + t * la * dz;
          return !(lay.boats || []).some((b) => { const e = b.m.elements; return seg(sx, sz, e[12] - 3 * e[8], e[14] - 3 * e[10], e[12] + 3 * e[8], e[14] + 3 * e[10]) < 0.8 + 0.5 + lb; })
            && !(lay.posts || []).some((p) => Math.hypot(p.x - sx, p.z - sz) < 0.65 + lb) && !(!first && seg(sx, sz, ix, iz, bq[0], bq[1]) < 1.2 + 0.5 + lb); });
        buildCrag(ok ? g.kind(KIND.ROCK).move(0) : makeGeo(), (a, b, y) => [x + a * dx - b * dz, y, z + a * dz + b * dx], { a: 0, b: 0, la, lb, h, m: 5, pts: [[flank.range(-0.2, 0.2) * la, 0, h]] }, flank, tone);
        P.footing.push({ isle: first ? 1 : 2, x, z, h, ok });
      }
    }
  }
}
export function makeFarShore(rng, pal, P, C = null, far = null, road = null) {
  let g = makeGeo().kind(KIND.ROCK); const n = 120, ranges = g;
  P.farIsles = [1, -1].map((sd) => { const p = P.pos(rng.range(200, 290), sd * rng.range(100, 165) * D2R); return [p[0], p[1], rng.range(0, 3.14)]; });
  P.nearRock = null;
  if (C && far) {
    // (which of the two: the one on the causeway's foot's side of the bay's axis; the other, across the axis,
    // stays 200 m and more from the near rock's place on every seed)
    const k = C.at(0, 0)[0] * P.farIsles[0][0] >= 0 ? 0 : 1, f = P.farIsles[k];
    const u = (Math.hypot(f[0], f[1]) - 200) / 90, t = (Math.abs(Math.atan2(f[0], -f[1])) / D2R - 100) / 65, v = f[2] / 3.14;
    const q0 = C.at(C.lead + (1 + t) * C.pitch, -C.half), off = ROCK_OFF[0] + u * (ROCK_OFF[1] - ROCK_OFF[0]);
    // the line's plan from a place: the least distance to the line at any height from 3 to 27 m over the plane
    const plan = (x, z) => { let d = Infinity; for (let y = 3; y < 28; y += 2) d = Math.min(d, far(x, y, z)); return d; };
    // (out from the causeway's lake face along its normal: past the place of that march nearest the line's plan,
    // the first place ROCK_OFF from the plan)
    const ds = []; for (let q = 0; q <= 300; q += 2) ds.push(plan(q0[0] - C.nb[0] * q, q0[1] - C.nb[1] * q));
    let s = ds.indexOf(Math.min(...ds)); while (s < ds.length - 1 && ds[s] < off) s++; s *= 2;
    const x = q0[0] - C.nb[0] * s, z = q0[1] - C.nb[1] * s, y0 = Math.atan2(C.d[1], C.d[0]), tw = 0.05 + 0.25 * v, A = 30;   // (A: the rock's greatest half-length; its own is set when its crags are dealt)
    // (the end toward the second islet swings out: of the two turns, the one that leaves that end farther from it)
    const iq = P.isle2 || [x, z], gap = (yw) => Math.min(...[-1, 1].map((e) => Math.hypot(x + e * A * Math.cos(yw) - iq[0], z + e * A * Math.sin(yw) - iq[1])));
    const yaw = gap(y0 + tw) >= gap(y0 - tw) ? y0 + tw : y0 - tw;
    P.farIsles[k] = [x, z, yaw]; P.nearRock = { k, x, z, yaw, A, B: 15 * 1.5, off: +plan(x, z).toFixed(1) };
  }
  // (the three stood but pale as the sky: each is darker and bluer; the haze steps them as before)
  for (const [r0, h0, h1, k] of [[1500, 30, 100, 0.5], [2050, 70, 190, 0.62], [2700, 120, 300, 0.76]]) {
    const ph = [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28];
    const hAt = (t) => h0 + (h1 - h0) * Math.pow(0.5 + 0.25 * Math.sin(3 * t + ph[0]) + 0.15 * Math.sin(7 * t + ph[1]) + 0.1 * Math.sin(13 * t + ph[2]), 1.5) * (0.75 + 0.25 * Math.sin(2 * t + ph[3]));
    const V = (t, r, y) => [Math.sin(t) * r, y, -Math.cos(t) * r];
    g.col([pal.far[0] * k, pal.far[1] * k, pal.far[2] * k * 1.5]);
    for (let i = 0; i < n; i++) {
      const t0 = i / n * 6.2832, t1 = (i + 1) / n * 6.2832, tm = (t0 + t1) / 2;
      g.quad(V(t1, r0, 0), V(t0, r0, 0), V(t0, r0 + 260, hAt(t0)), V(t1, r0 + 260, hAt(t1)), [-Math.sin(tm) * 0.5, 0.86, Math.cos(tm) * 0.5]);
    }
  }
  // THE TWO LAKE ROCKS (by the seed's draw, see above): each a rock of crags (dealCrags, buildCrag) with a small
  // gallery house of the city on a terrace on its level crag; like everything that stands they are doubled
  g = makeGeo();   // (the two rocks with their houses are a geometry of their own, see the head of this maker)
  P.farIsles.forEach(([rx, rz, yaw], k) => {
    // (cx, cz: where the house stands, the rock's middle or the level crag's; yL: how high its terrace lifts it;
    // crag: a road stream is handed in, as the hero always does, and the rock is a rock of crags)
    let cx = rx, cz = rz, yL = 0, ang = 0, sc = null;
    const big = !!P.nearRock && P.nearRock.k === k, crag = !!road, eA = big ? P.nearRock.A : 34, eB = big ? P.nearRock.B : 15, hK = big ? ROCK_BIG[1] : 1;
    const c = Math.cos(yaw), s = Math.sin(yaw), E = (t, f, y) => [cx + (Math.cos(t) * eA * c - Math.sin(t) * eB * s) * f, y * hK, cz + (Math.cos(t) * eA * s + Math.sin(t) * eB * c) * f];
    // (THE FORMER OUTLINE, by the shore's stream: an oval's waterline running in and out, 0.78 to 1.15 of it,
    // under a broken crest. It is BUILT ONLY WHEN NO ROAD STREAM IS HANDED IN; the hero always hands one, so
    // these 24 draws a rock are taken and nothing reads them: one of the two exceptions the heads name to "no
    // draw is made to be thrown away")
    const nR = 12, fr = [], hc = [];
    for (let i = 0; i < nR; i++) { fr.push(rng.range(0.78, 1.15)); hc.push(1.4 + (0.35 + 0.65 * rng()) * (0.8 + 9 * Math.pow(Math.max(0, Math.cos(i / nR * 6.2832)), 1.2))); }
    g.kind(KIND.ROCK);
    for (let i = 0; i < (crag ? 0 : nR); i++) {
      const j = (i + 1) % nR, t0 = i / nR * 6.2832, t1 = (i + 1) / nR * 6.2832, top = [cx, 2.2, cz];
      g.col(mulc(pal.rock, 0.86 + 0.14 * (i % 3)));
      g.quad(E(t1, fr[j], 0), E(t0, fr[i], 0), E(t0, fr[i] * 0.7, hc[i]), E(t1, fr[j] * 0.7, hc[j]));
      g.quad(E(t1, fr[j] * 0.7, hc[j]), E(t0, fr[i] * 0.7, hc[i]), top, top, [0, 1, 0]);
    }
    // (THE CRAGS, OF DARK WET STONE: the city's stone in shade, ROCK_TONE 0.67 of the quay's ashlar and three
    // quarters of the way to grey, a touch cool, never tan; the shader lays the damp band on every steep face
    // at the water. The house stands on the level crag, lifted onto its terrace)
    // (THE FAR ISLET TAKES THE SAME LAW AT TWO THIRDS: every height and every crag's plan but its house's; its
    // house on its level crag likewise; its three bushes stand on its two low stones)
    if (crag) {
      const N = big ? P.nearRock : {}, W = (a, b, y) => [rx + a * c - b * s, y, rz + a * s + b * c], l0 = (pal.quay[0] + pal.quay[1] + pal.quay[2]) / 3;
      const tone = pal.quay.map((v, i) => ROCK_TONE * (0.25 * v + 0.75 * l0) * (i > 1 ? 1.05 : 1));
      const D = dealCrags(road, hK / ROCK_BIG[1]), O1 = D.crags[2], O2 = D.crags[3]; N.crags = D.crags; N.A = D.A; N.B = 13;
      N.feet = N.crags.map((q) => buildCrag(g, W, q, road, tone).map((p) => [p[0], p[2]]));
      const H = N.crags.find((q) => q.house); [cx, , cz] = W(H.a, H.b, 0); yL = H.h - 1.2;
      // (the house stands square on its crag: turned with the rock, by the turn nearest the bearing it is built at;
      // the far islet's scrub stands on its two low stones)
      ang = yaw % Math.PI; if (ang > Math.PI / 2) ang -= Math.PI;
      sc = W((O1.a + O2.a) / 2, (O1.b + O2.b) / 2, 0.5 * O2.h);
    }
    const v0 = g.count, x0 = cx - 6, x1 = cx + 5, z0 = cz - 3.5, z1 = cz + 3.5, ye = 7.8, yr = 9.5;
    // (round 5, C4, the guard's must-fix: no white red-roofed house between cypresses. ON CUT STONE A SMALL
    // GALLERY HOUSE OF THE CITY UNDER SLATE, AND ONE ROUND-HEADED TREE: a plinth of the bastions' stone, the
    // house in the city's ochre or cream wash, two galleries to the bay (a shaded band, a stone rail and four
    // posts to each floor), a slate roof; the four dark cones are gone)
    // (on a rock of crags the plinth is THE TERRACE, a levelled platform of the bastions' pale stone on the
    // level crag, its wall carried down up to 3 m where it stands out past the crag's shoulder)
    g.kind(KIND.STONE).col(pal.bastion).box(x0 - 2.5, crag ? Math.max(-2.6, 0.05 - yL) : 0.4, z0 - 2.5, x1 + 2.5, 2.05, z1 + 2.5, 'y');
    g.kind(KIND.LIME).col(mulc(pal.lime[k ? 0 : 1], 0.92)).box(x0, 2, z0, x1, ye, z1, 'yY');
    for (let j = 0; j < 2; j++) {
      const wy = 2.5 + j * 2.7, F = (xa, xb, ya, yb, dz) => g.quad([xb, ya, z0 - dz], [xa, ya, z0 - dz], [xa, yb, z0 - dz], [xb, yb, z0 - dz], [0, 0, -1]);
      g.kind(KIND.ROOM).col(mulc(pal.wall, 0.3)); F(x0 + 0.3, x1 - 0.3, wy, wy + 2.2, 0.04);
      g.kind(KIND.STONE).col(pal.parapet); F(x0 + 0.3, x1 - 0.3, wy, wy + 0.8, 0.1);
      for (let i = 0; i < 4; i++) F(x0 + 0.3 + i * 3.4, x0 + 0.6 + i * 3.4, wy, wy + 2.2, 0.12);
    }
    g.kind(KIND.SLATE).col(mulc(pal.slate, 0.9));
    g.quad([x0 - 0.6, ye, z1 + 0.6], [x1 + 0.6, ye, z1 + 0.6], [x1 - 3, yr, cz], [x0 + 3, yr, cz]);
    g.quad([x1 + 0.6, ye, z0 - 0.6], [x0 - 0.6, ye, z0 - 0.6], [x0 + 3, yr, cz], [x1 - 3, yr, cz]);
    g.quad([x0 - 0.6, ye, z0 - 0.6], [x0 - 0.6, ye, z1 + 0.6], [x0 + 3, yr, cz], [x0 + 3, yr, cz], [-0.5, 0.86, 0]);
    g.quad([x1 + 0.6, ye, z1 + 0.6], [x1 + 0.6, ye, z0 - 0.6], [x1 - 3, yr, cz], [x1 - 3, yr, cz], [0.5, 0.86, 0]);
    g.kind(KIND.ROOM).col(mulc(pal.wall, 0.22));
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const wy = 2.9 + j * 2.7, wz = z0 + 1.3 + i * 3.3;
      g.quad([x1 + 0.05, wy, wz + 1.1], [x1 + 0.05, wy, wz], [x1 + 0.05, wy + 1.6, wz], [x1 + 0.05, wy + 1.6, wz + 1.1], [1, 0, 0]);
    }
    // the one tree: a round head of leaf green on a short stem, 13 m from the house along the islet's back
    // (round 5 mending 2, step 2, the guard: the second islet is not one round tree alone: THREE LOW TREES of
    // unlike size in a loose clump along its back, and a rock at its end; the first islet keeps its one tree)
    if (crag) g.lift(v0, yL).turn(v0, cx, cz, ang);   // (the house with its terrace, built at the plane and square to the world, stands on its crag and square to it)
    const rings = [[2, 0.12], [4.2, 0.14], [5, 0.7], [7, 1], [9.2, 0.72], [10.4, 0.05]];
    if (k && !crag) for (let q = 0; q < 5; q++) {
      const R0 = (t) => [cx - 25 * c + Math.cos(t) * 2.6, 1.2, cz - 25 * s + Math.sin(t) * 1.8], ap = [cx - 25.4 * c, 4.1, cz - 25.4 * s];
      g.kind(KIND.ROCK).col(mulc(pal.rock, 0.86)).quad(R0((q + 1) * 1.2566), R0(q * 1.2566), ap, ap);
    }
    // (the guard: the other islet showed one round tree alone: LOW SCRUB there,
    // three bushes under 4 m)
    for (const [ta, tb, R, hs] of crag && big ? [] : k ? [[-10.5, 1, 2.4, 0.64], [-15.5, -2, 2.9, 0.74], [-20, 1.5, 2, 0.55]] : [[-12, 1, 2.5, 0.36], [-16.5, -1.6, 3, 0.4], [-21, 1.2, 2.1, 0.33]])
    for (let j = 0; j + 1 < rings.length; j++) for (let q = 0; q < 7; q++) {
      // (on a rock of crags the three stand on the two low stones, half as far apart, half the lower stone's height up)
      const tx = sc ? sc[0] + (ta + 15.5) * 0.5 * c : cx + ta * c, tz = sc ? sc[2] + (ta + 15.5) * 0.5 * s + tb * 0.6 : cz + ta * s + tb, ty = sc ? sc[1] : 0;
      const t0 = q / 7 * 6.2832, t1 = (q + 1) / 7 * 6.2832, tm = (t0 + t1) / 2, Q = (t, r) => [tx + Math.cos(t) * R * r[1], ty + r[0] * hs, tz + Math.sin(t) * R * r[1]];
      g.kind(j < 1 ? KIND.TIMBER : KIND.LEAF).col(j < 1 ? pal.timber : mulc(pal.leaf[0], 0.8));
      g.quad(Q(t1, rings[j]), Q(t0, rings[j]), Q(t0, rings[j + 1]), Q(t1, rings[j + 1]), [Math.cos(tm), j > 3 ? 0.8 : j < 2 ? 0 : 0.15, Math.sin(tm)]);
    }
    // (THE NEAR ROCK'S HOUSE CARRIES A MAST of 6 m on its ridge; its pennant is hung by the hero)
    if (big) { g.kind(KIND.TIMBER).col(pal.timber).move(0).box(cx - 0.07, yr + yL, cz - 0.07, cx + 0.07, yr + 6 + yL, cz + 0.07, 'y'); P.nearRock.mast = [cx, yr + 6 + yL, cz]; }
    // (TWO OR THREE LOW CYPRESSES OF THE CITY'S KIND stand in a loose clump on the terrace at one end of the
    // house (which end, how many and how tall, by the stream road): dark flames of six sides, 3.6 to 6 m)
    if (crag && big) {
      const e = road.chance(0.5) ? 1 : -1, nC = 2 + Math.floor(road() * 2), fl = [[0, 0.5], [0.22, 1], [0.6, 0.78], [1, 0.05]], v1 = g.count;
      for (let i = 0; i < nC; i++) {
        const tx = (e > 0 ? x1 : x0) + e * road.range(1.1, 1.6), tz = cz + (i - (nC - 1) / 2) * 2.6 + road.range(-0.4, 0.4), th = road.range(3.6, 6), R = 0.55 + 0.05 * th;
        g.kind(KIND.LEAF).col(mulc(pal.cypress[i % 2], road.range(0.9, 1.1)));
        for (let j = 0; j + 1 < fl.length; j++) for (let q = 0; q < 6; q++) {
          const t0 = q / 6 * 6.2832, t1 = (q + 1) / 6 * 6.2832, tm = (t0 + t1) / 2, Q = (t, r) => [tx + Math.cos(t) * R * r[1], 2.05 + yL + th * r[0], tz + Math.sin(t) * R * r[1]];
          g.quad(Q(t1, fl[j]), Q(t0, fl[j]), Q(t0, fl[j + 1]), Q(t1, fl[j + 1]), [Math.cos(tm), 0.2, Math.sin(tm)]);
        }
      }
      g.turn(v1, cx, cz, ang);   // (they stand on the terrace: turned with it)
    }
  });
  return { g: ranges, rocks: g };
}

// ---------------------------------------------------------------- the sky and the second sky (one dome)
// The dome hangs in the city's root group and reads its own direction; below the plane the same law is read with
// the height's sign taken off (the upper sky turned about, with its sun) and multiplied by the lower tone.
export function makeDome(look, tone) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...look, uLow: { value: tone } }, depthWrite: false, depthTest: false, side: THREE.BackSide,
    vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
      if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`uniform float uTime, uNight; uniform vec3 uLow; varying vec3 vD;
      ${GLSL_SKY}
      ${GLSL_NOISE}
      void main() {
        vec3 d = normalize(vD); float low = step(d.y, 0.); d.y = abs(d.y);
        // (round 3, B-ii) THE SECOND SKY AT THE WELL'S FOOT IS THE PALE DAWN SKY, not the zenith's strong blue: by
        // day the lower dome's heights above 0.25 are drawn together (straight down is the sky 24 degrees up, with
        // its clouds), so nothing under the plane is darker or more saturated than the sky seen overhead
        float yRaw = d.y;
        d.y -= 0.8 * max(d.y - 0.25, 0.) * low * (1. - uNight);
        // (the level part is stretched to the new height; to normalize the vector brought the straight-down
        // direction back to the zenith)
        d.xz = normalize(d.xz + 1e-5) * sqrt(max(1. - d.y * d.y, 0.));
        vec3 c = skyLaw(d);
        // (round the lower pole the sun's side and the far side ran together into a point;
        // there the sky is the mean of the two sides, the same all round)
        c = mix(c, 0.5 * (c + skyLaw(vec3(-d.x, d.y, -d.z))), low * (1. - uNight) * smoothstep(0.55, 0.92, yRaw));
        // the sun's disc by day (small, not blown out; by night no disc is drawn: the moon is never in the lens)
        float s = dot(d, uSunDir);
        c += uSunGlow * 2.6 * smoothstep(0.99962, 0.99985, s) * (1. - uNight);
        // a few long thin clouds lying level, low in the sky (bands along the horizon, never spokes from overhead),
        // touched pink on the sun's side; they drift by the clock
        vec2 az = normalize(d.xz + 1e-5);
        // (round 4, D1: NO LONG STRAIGHT STREAK: by day every band rises and falls a degree or two along its
        // length (yc) and is broken into lengths by a slow noise round the horizon (brk); by night as it was)
        // (the bands were long and straight: they bend twice as much and
        // the lengths are half as long)
        float dK = 1. - uNight, yc = d.y + dK * (0.04 * (3. * az.y - 4. * az.y * az.y * az.y) + 0.06 * vn(az * 4.3 + 2.));
        float brk = mix(1., smoothstep(0.35, 0.6, vn(az * 5.2 + 4.)), dK);
        float cl = vn(vec2(az.x * 2.3 + 5. + uTime * 0.004, yc * 34.)) * vn(vec2(az.y * 2.3 + 9. - uTime * 0.003, yc * 21. + 3.));
        float m = smoothstep(0.34, 0.6, cl) * smoothstep(0.05, 0.11, d.y) * (1. - smoothstep(0.26, 0.42, d.y));
        // (round 3, A3) by day a second, higher flight of long clouds (they stand over the crest in the opening),
        // and all of them catch the low sun: pink across from it, gold toward it, by the warmth of the hour's glow
        // (by night the clouds are as they were)
        float wm = min(1., 1.3 * max(uSunGlow.r - uSunGlow.b, 0.)) * (1. - uNight);
        float c2 = vn(vec2(az.x * 1.7 + 2. - uTime * 0.003, yc * 23. + 7.)) * vn(vec2(az.y * 1.7 + 4. + uTime * 0.002, yc * 15. + 1.));
        // (the clouds stood as broad white arcs; they are thinner, broken along their length by a
        // finer noise, and plainly salmon across from the sun and gold toward it)
        float wisp = 0.55 + 0.45 * vn(vec2(az.x * 9. + az.y * 7., d.y * 60.));
        m = max(m * mix(1., wisp, wm), (1. - uNight) * smoothstep(0.4, 0.62, c2) * wisp * smoothstep(0.24, 0.34, d.y) * (1. - smoothstep(0.5, 0.7, d.y)));
        vec3 cc = uSkyHor * mix(1.04, 0.42, wm) + uSunGlow * vec3(0.5, 0.26, 0.3) * (0.35 + 0.65 * pow(max(s, 0.), 2.));
        cc += wm * mix(vec3(0.66, 0.24, 0.2), vec3(0.8, 0.42, 0.1), smoothstep(-0.3, 0.8, s));
        // (no cloud is drawn round the lower dome's pole by day: the clouds ran together
        // into a point straight under the lens)
        // (round 5, C5, the guard's must-fix: the long ribbon and the cut ends) BY DAY THE CLOUDS ARE A FEW SOFT
        // FEATHERED SHAPES, not bands: round the horizon eight places, a cloud in rather more than half of them,
        // each a long lens (15 to 26 degrees long, 2 to 4 high, 7 to 25 degrees up) that thins away to nothing
        // at both ends and all round, its edge broken by a fine noise; two or three are seen at once. They
        // drift by the clock. By night the bands are as they were
        float phi = atan(az.x, az.y) + uTime * 0.0015, cellC = floor(phi / 0.63), mD = 0.;
        for (int k = -1; k < 2; k++) {
          float ci = cellC + float(k), hc = h21(vec2(ci, 7.3)), pc = (ci + 0.25 + 0.5 * h21(vec2(ci, 1.9))) * 0.63;
          float yc0 = 0.13 + 0.3 * h21(vec2(ci, 4.1)), Lc = 0.13 + 0.1 * hc, Hc2 = 0.017 + 0.02 * h21(vec2(ci, 8.8));
          float e = length(vec2((phi - pc) / Lc, (d.y - yc0 - 0.02 * sin((phi - pc) * 6.)) / Hc2));
          // (the guard: a cloud read as one ribbon:
          // on the other hand's side of the dome two long neighbours lie end to end. Every cloud is BROKEN ALONG ITS
          // LENGTH by a slow noise, a third of it open sky in gaps of 3 to 5 degrees, and none is over 21 degrees long)
          // (cut across, a cloud showed a straight cut end. At a gap the cloud's HEIGHT
          // draws in to a fifth and it thins away: every piece is a feathered lens of its own)
          float gp = smoothstep(0.24, 0.66, vn(vec2(phi * 11. + ci * 3.7, 0.5)));
          e = length(vec2((phi - pc) / min(Lc, 0.18), (d.y - yc0 - 0.02 * sin((phi - pc) * 6.)) / (Hc2 * (0.2 + 0.8 * gp))));
          mD = max(mD, step(0.42, hc) * step(-4.5, ci) * step(ci, 3.5) * (1. - smoothstep(0.15, 1., e + 0.7 * (vn(vec2(phi * 16., d.y * 110.)) - 0.5))) * smoothstep(0., 0.55, gp));
        }
        m = mix(m, mD, dK);
        m *= 1. - low * (1. - uNight) * smoothstep(0.7, 0.95, yRaw);
        c = mix(c, cc, m * (0.55 + 0.25 * wm) * (1. - 0.8 * uNight));
        // stars by night
        vec2 sq = d.xz / (d.y + 0.35) * 70., g = floor(sq); float st = h21(g);
        float dot2 = length(fract(sq) - 0.5 - 0.3 * (vec2(h21(g + 3.), h21(g + 9.)) - 0.5));
        c += uNight * vec3(0.8, 0.85, 1.) * step(0.975, st) * (1. - smoothstep(0.04, 0.16, dot2)) * (0.6 + 0.4 * sin(uTime * 2. + st * 300.)) * smoothstep(0.05, 0.3, d.y);
        gl_FragColor = vec4(c * mix(vec3(1.), uLow, low), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 20), mat);
  mesh.renderOrder = -1; mesh.frustumCulled = false;
  return { mesh, mat };
}

// ---------------------------------------------------------------- the water's sheet (a body for the clearances: y = 0)
// Clear where we look steeply down onto the double; a sheen that grows toward the grazing angle and with the
// distance (silver far off), drawn toward a cool deep tint (darker than the sky by night); a skin of light lapping
// at the quay's foot, round the inlet, the jetty's piles and the causeway's piers; small rings about the boats; a
// fine sparkle that thickens where a breath of air crosses (the same law that shivers the lower city); by night the
// lamps' glitter before the quay. Everything by the world's clock and by place.
export const MAX_BOATS = 40;   // (with the roadstead a seed has up to 38 boats on seeds 1 to 300, and every boat has its rings)
export function makeWater(look, P, boats, C) {
  const arr = [], J = C.jetty;
  // where the jetty and the causeway's piers stand (plan figures of the place, for the skin round them)
  const stand = {
    uJet: { value: new THREE.Vector4(J.J0[0], J.J0[1], J.jd[0], J.jd[1]) }, uJetL: { value: new THREE.Vector2(J.JL, J.jw) },
    uCw: { value: new THREE.Vector4(C.S[0], C.S[1], C.d[0], C.d[1]) }, uCwP: { value: new THREE.Vector4(C.lead, C.pitch, C.pitch / 2 - C.R, C.L) },
    uIsle: { value: new THREE.Vector4(...(P.isle || [1e5, 1e5]).slice(0, 2), ...(P.isle2 || [1e5, 1e5]).slice(0, 2)) },
  };
  for (let i = 0; i < MAX_BOATS; i++) { const b = boats[i]; arr.push(b ? new THREE.Vector3(b.x, b.z, b.ph) : new THREE.Vector3(0, 0, -1)); }
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...look, ...stand, uBoats: { value: arr }, uPlan: { value: new THREE.Vector4(P.RQ, P.aMax, P.aI, P.alpha) }, uRHead: { value: P.rHQ }, uDock: { value: new THREE.Vector2(P.rPier, P.aBastE() - P.aI - P.alpha) } },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uTime, uHand, uRHead, uNight; uniform vec4 uPlan, uHaze, uJet, uCw, uCwP, uIsle; uniform vec2 uJetL, uDock; uniform vec3 uBoats[${MAX_BOATS}]; varying vec3 vW;
      ${GLSL_SKY}
      ${GLSL_NOISE}
      ${GLSL_BREATH}
      void main() {
        vec2 p = vec2(vW.x * uHand, vW.z);
        vec3 V = normalize(vec3(cameraPosition.x * uHand, cameraPosition.y, cameraPosition.z) - vec3(p.x, 0., p.y));
        float dist = length(cameraPosition - vW);
        float fres = pow(1. - clamp(V.y, 0., 1.), 5.);
        // NOT ICE: by day the sheet, seen low, turns back the sky from a little way up (the
        // water is never dead flat: its small slopes show the bluer sky over the pale rim), not the horizon's pallor
        vec3 sky = skyLaw(vec3(-V.x, max(V.y, mix(0.13, 0.02, uNight)), -V.z));
        // distance to the shore: the quay's front, the inlet's flanks and head
        float r = length(p), a = atan(p.x, -p.y + 1e-4), da = abs(a - uPlan.z);
        float d = uPlan.x - r;
        // (inside the inlet only: out in the bay the flanks' lines are no shore)
        // (round 3, B1: behind the pier, uDock.x from the centre, the harbour's water goes on east by the angle
        // uDock.y; its shores there are the pier's inland face and the east arm's cut end; uRHead is the head's quay)
        float sA = a - uPlan.z, eE = uPlan.w + uDock.y * step(uDock.x, r), hb = 0.;
        if (sA > -uPlan.w && sA < eE && r > uPlan.x) {
          hb = 1.;
          d = min(min((sA + uPlan.w) * r, (eE - sA) * r), uRHead - r);
          if (sA > uPlan.w) d = min(d, r - uDock.x);
        }
        else if (da < uPlan.w) d = length(vec2((uPlan.w - da) * r, uPlan.x - r));
        d = mix(d, 40., step(uPlan.y, abs(a)));
        // the jetty's piles and the causeway's piers stand in the water too: the skin goes round each of them
        vec2 qj = p - uJet.xy; float js = dot(qj, uJet.zw), jo = abs(dot(qj, vec2(-uJet.w, uJet.z)));
        float dpile = length(vec2(abs(mod(clamp(js, 0., uJetL.x) - 3. + 3.125, 6.25) - 3.125) + max(js - uJetL.x, 0.) + max(-js, 0.), jo - uJetL.y - 0.12)) - 0.16;
        vec2 qc = p - uCw.xy; float cs = dot(qc, uCw.zw), co = abs(dot(qc, vec2(-uCw.w, uCw.z)));
        float dsp = abs(mod(cs - uCwP.x + 0.5 * uCwP.y, uCwP.y) - 0.5 * uCwP.y) - uCwP.z;
        if (cs < uCwP.x || cs > uCwP.w - uCwP.x) dsp = max(max(-cs, cs - uCwP.w), 0.);
        float dpier = length(max(vec2(dsp, co - 4.3), 0.));
        d = min(d, min(dpile, dpier));
        d = max(d, 0.);
        float lap = 0.5 + 0.5 * sin(d * 7. - uTime * 1.1 + 4. * vn(p * 0.35));
        float skin = exp(-d * 2.6) * (0.55 + 0.45 * lap) + 0.22 * exp(-d * 0.45) * smoothstep(0.55, 0.95, lap);
        // rings about the boats (each boat on its own phase)
        // (round 3, A5) and SLOW WIDE RINGS: about each boat a few broad rings (5 m from crest to crest) go out
        // 40 m and more, slowly, so the open lake's reflection is seen to be water (by day; seen from far too)
        float ring = 0., wide = 0.;
        for (int i = 0; i < ${MAX_BOATS}; i++) {
          vec3 b = uBoats[i]; float db = length(p - b.xy);
          ring += step(0., b.z) * exp(-db * 0.42) * smoothstep(0.75, 1., sin(db * 4.2 - uTime * 1.4 + b.z * 6.28)) * smoothstep(0.7, 1.6, db);
          wide += step(0., b.z) * exp(-db * 0.1) * smoothstep(0.4, 1., sin(db * 1.26 - uTime * 0.7 + b.z * 6.28)) * smoothstep(2., 6., db);
        }
        // (ROUND 5 MENDING 5, L7: BY PLACE AND CLOCK ONLY. The rings die out within 25 m of the boat. Only the eye's
        // place is read: a ring, like any fine line, is weighed by the pixel's own footprint on the plane,
        // fp in metres: whole while the footprint is under a quarter of the way from crest to crest, gone at half)
        float fp = max(length(dFdx(p)), length(dFdy(p)));
        wide = min(wide, 1.) * (1. - uNight) * (1. - smoothstep(1.25, 2.5, fp));
        // (round 4, B3) RINGS ROUND THE PIERS AND THE PILES by day: from each of the causeway's piers and the
        // jetty's piles slow rings go out some 12 m (2.4 m from crest to crest, bent a little by a noise), a
        // soft brightening of the sheet that crosses the double and leaves it clear between
        float dpp = min(dpier, dpile);
        float ringP = (1. - uNight) * exp(-dpp * 0.2) * smoothstep(0.7, 1., sin(dpp * 2.6 - uTime * 1.5 + 3. * vn(p * 0.2))) * smoothstep(0.3, 1.2, dpp);
        wide = max(wide, ringP * (1. - smoothstep(0.6, 1.2, fp)));
        // the breath of air: fine ripples inside the band
        float br = breathBand(p, uTime);
        float rip = 0.5 + 0.5 * sin(dot(p, uBreath.xy) * 5.5 + uTime * 4.5 + 5. * vn(p * 0.9 + uTime * 0.2));
        float foot = clamp(1. - dist / 160., 0., 1.);
        // THE SHEET'S BODY: clear where we look steeply down, a sheen that grows toward the grazing angle (graz) and
        // with the distance (far), silver far off; by night a darker sheet than the sky
        float graz = 1. - clamp(V.y, 0., 1.), far = smoothstep(120., 900., dist);
        float alpha = 0.05 + 0.5 * graz * graz * graz + 0.3 * far * graz + 0.16 * uNight;
        // (seen steeply, as from over the harbour's mouth, the sheet is clearer yet: little sheen there)
        float steep = 0.5 + 0.5 * smoothstep(0.25, 0.7, graz);
        alpha *= steep;
        // (ROUND 5 MENDING 5, L7: the breath band is drawn by place and clock only; its shiver in the lower city is
        // the same everywhere. By day the band's brightening and its flecks, some 18 m across, are weighed by the
        // pixel's footprint on the plane like the rings: whole under 3 m, gone at 9 m, half the band's width)
        br *= mix(1. - smoothstep(3., 9., fp), 1., uNight);
        alpha += skin * 0.7 + ring * 0.4 * foot + (0.09 + 0.08 * (1. - uNight)) * br + 0.12 * wide;
        // the lake breathes: a slow, long swell changes how much sky the sheet turns back, everywhere, by place and clock
        float sw = sin(uTime * 1.9 + 9. * vn(p * 0.045) + p.x * 0.02);
        alpha += (0.05 * sw + 0.05 + 0.04 * vn(p * 0.11 + uTime * 0.03) * foot) * steep;
        // a fine sparkle: small glints that come and go by place and clock, thick inside a breath of air, thin
        // elsewhere, and (by night) the lamps' glitter lying on the water before the quay
        vec2 sc = floor(p * 5.5); float sr = h21(sc), tw = 0.5 + 0.5 * sin(uTime * (2.5 + 4. * sr) + sr * 40.);
        // (round 3, A5: by day a third of the flecks outside a breath of air, and fewer inside one)
        // (fewer yet by day: the white specks read as grain on the mirror)
        float glint = step(0.965 + 0.029 * (1. - uNight) - (0.33 - 0.1 * (1. - uNight)) * min(br, 1.), sr) * tw * tw * tw * (1. - smoothstep(0.1, 0.45, length(fract(p * 5.5) - 0.5)));
        float lampGlit = uNight * exp(-d * 0.05) * step(0.82, sr) * tw * (1. - smoothstep(0.1, 0.45, length(fract(p * 5.5) - 0.5)));
        float near = clamp(1. - dist / 260., 0., 1.);
        // (stage F) THE LAKE IS ALIVE EVERYWHERE, by the world's clock and by place: two trains of long low ripples
        // cross it (7 m and 11 m from crest to crest, bent by a slow noise); they change how much sky the sheet
        // turns back and brighten and darken it a tenth. Not where we look steeply down (the double stays clear)
        // (round 3, stage D: a second, finer noise bends both trains by day, so no crest runs straight for long)
        float bend = 2.6 * (1. - uNight) * vn(p * 0.19 + 3.);
        float wv = sin(dot(p, vec2(0.83, 0.56)) * 0.9 + uTime * 1.5 + 4. * vn(p * 0.05) + bend) * sin(dot(p, vec2(-0.5, 0.87)) * 0.55 - uTime * 1.1 + 3. * vn(p * 0.031 + 7.) - bend);
        float wvk = smoothstep(0.3, 0.8, graz) * (1. - 0.6 * far);
        // (round 3, A5) NO RULED LINES: by day the long ripples come in drifting patches (a slow noise), not in
        // trains across the whole lake, and inside the bay they are half as strong
        // (the patches are wide, most of the lake, and inside the bay the ripples are three quarters as strong)
        wvk *= mix(smoothstep(0.2, 0.45, vn(p * 0.011 + vec2(-uTime * 0.02, uTime * 0.015) + 3.)) * mix(0.75, 1., smoothstep(uPlan.y, uPlan.y + 0.12, abs(a))), 1., uNight);
        alpha += 0.09 * wv * wvk;
        // GENTLE LONG RIPPLES ON THE NEAR WATER by day. LIGHT ON WATER, BY THE ANGLE AT WHICH THE WATER IS SEEN
        // (the eye's place against the water's, nothing else): seen low, the long ripples above change the sheen (wvk); seen steeply, the
        // same long ripples pass in slow drifting patches as soft bands of a little more sheen (the lower city
        // itself sways a hand's breadth where they pass: see the vertex law), and between the patches the
        // double is clear
        float nearR = (1. - uNight) * (1. - smoothstep(0.3, 0.8, graz)) * smoothstep(0.2, 0.8, sin(dot(p, vec2(0.021, 0.013)) + uTime * 0.25) * sin(dot(p, vec2(-0.012, 0.019)) - uTime * 0.18));
        alpha += 0.09 * nearR * (0.5 + 0.5 * wv);
        // (stage F) CAT'S-PAWS: patches of ruffled water drift by the clock over half the open lake; inside a patch
        // the sheet shivers finely. INSIDE THE BAY (the crescent's own water, where the city's double lies) they are
        // faint, a fifth brighter and darker, and there is none within 30 m of the quay, in the basin or by a pier;
        // BEYOND THE HORNS they are plain: two fifths, and the ruffled sheet turns back a quarter more of the sky.
        // None within 35 m of either islet's tower (its double stands in calm water too)
        // (ROUND 5 MENDING 5, L5) ONE STRENGTH ON ALL OPEN WATER OUTSIDE THE BAY. kOut is 1 on the open lake: beyond
        // the horns, and on the lake side of the causeway's line from 6 to 40 m off it and on outward, along its
        // whole length (no city's double lies there). Everywhere kOut is 1 the cat's-paws are plain and lie over a
        // little more of the lake, the fine quick shiver inside one is plainer by day, and the long ripples are two
        // thirds stronger: the same figures beyond the horns as beyond the causeway. By place and clock only; the
        // bay's own water, where the city's double lies, is as it was
        float outC = smoothstep(6., 40., -dot(qc, vec2(-uCw.w, uCw.z))) * step(0., cs) * step(cs, uCwP.w);
        float kOut = max(smoothstep(uPlan.y, uPlan.y + 0.12, abs(a)), outC);
        alpha += 0.06 * wv * wvk * kOut;
        float openK = max(smoothstep(30., 90., d), kOut) * smoothstep(0.35, 0.8, graz);
        openK *= smoothstep(35., 60., min(length(p - uIsle.xy), length(p - uIsle.zw)));
        float paw = smoothstep(0.38 - 0.08 * kOut, 0.56 - 0.08 * kOut, vn(p * 0.018 + vec2(uTime * 0.05, -uTime * 0.03))) * openK;
        float shv = sin(dot(p, vec2(0.6, 0.8)) * 2.6 + uTime * 5.2 + 6. * vn(p * 0.6 + uTime * 0.3)) * (1. - 0.8 * far);
        alpha += paw * (0.07 + 0.19 * kOut + 0.1 * shv);
        // the sheet's own colour: the sky turned back, drawn toward a cool deep tint so that the plane is not the sky
        // (round 3, A5: by day a deeper, greener tint and more of it, so the lake is deep water under the pale
        // houses and never a pale pane; a breath band is a tenth brighter, a slow wide ring a little brighter too;
        // the flecks keep the glow's colour and lose their white)
        // (the bay's water was a pale pane over the double: the tint deeper and half the sheet's colour by day)
        vec3 tint = mix(vec3(0.14, 0.3, 0.4), vec3(0.012, 0.02, 0.045), uNight);
        float dayK = 1. - uNight;
        vec3 col = mix(sky * (1. + 0.08 * sw + (0.1 * wvk + 0.4 * paw * kOut) * wv + (0.2 + (0.2 + 0.7 * dayK) * kOut) * paw * shv +dayK * (0.1 * min(br, 1.) + 0.1 * wide)), tint, 0.3 + 0.25 * uNight + dayK * (0.2 + 0.14 * smoothstep(0.85, 1., graz))) + uSunGlow * 0.5 * skin;
        col += (uSunGlow * 1.2 + 0.25 * uNight + 0.06 * dayK) * glint * near * (0.3 + 0.7 * rip) + vec3(1., 0.72, 0.38) * lampGlit * near * 1.6;
        alpha += 0.55 * glint * near + 0.6 * lampGlit * near;
        // THE LOW SUN'S GLITTER PATH, by day (light on water, a mirror's law): where the line from the water to
        // the eye, turned back by the sheet, bears toward the sun (8 degrees to each side) a path of sparks lies on
        // the water from under the sun toward the eye, each spark a cell of a third of a metre on its own clock,
        // warm as the glow; it lies on the sun's side of the lake only
        float gAz = smoothstep(0.985, 0.9985, dot(normalize(-V.xz + 1e-5), normalize(uSunDir.xz + 1e-5)));
        // (ROUND 5 MENDING 5, L8: A LONGER PATH. The sparks reach out from the lens's side to where the sheet is seen
        // at two fifths of the sun's own height (they were whole only at the sun's height: a short patch); beyond
        // them the far path below carries on to the horizon. Light on water: the sun's bearing, its height, the clock)
        float gEl = smoothstep(0.01, max(0.4 * uSunDir.y, 0.03), V.y) * (1. - smoothstep(uSunDir.y + 0.12, uSunDir.y + 0.6, V.y));
        vec2 gc = floor(p * 3.); float gr = h21(gc + 17.), gt = 0.5 + 0.5 * sin(uTime * (3. + 5. * gr) + gr * 40.);
        // (round 4, D1: NO HARD WHITE SPECKS ON THE WATER: each spark is round and soft in its cell, not a hard
        // square, and by day the fine sparkle elsewhere is at half strength)
        float gK = dayK * gAz * gEl * (0.22 + 0.78 * step(0.5, gr) * gt * gt * (1. - smoothstep(0.15, 0.5, length(fract(p * 3.) - 0.5))));
        col -= 0.5 * dayK * (uSunGlow * 1.2 + 0.06) * glint * near * (0.3 + 0.7 * rip); alpha -= 0.27 * dayK * glint * near;
        col += uSunGlow * 1.5 * gK; alpha += 0.5 * gK;
        // (round 4, B4: ONE WATER ALL THE WAY OUT: round 3's shimmer is gone (its noise read as tiled cells and
        // its opaque sheet as a pale matte plate with an edge). The far open water keeps the sheet's own sheen
        // and carries A SLOW SPARSE GLITTER by day, coming in softly with the distance from the quay, so no edge
        // is drawn anywhere; none round the islets, none by night)
        // (ROUND 5 MENDING 5, L5: BY PLACE AND CLOCK ONLY: where it lies is the open water outside the bay, or 70 to
        // 190 m and more out from the quay's front, and nothing else; no term asks how steeply the water is seen)
        float shimK = dayK * max(kOut, smoothstep(70., 190., uPlan.x - r)) * smoothstep(35., 70., min(length(p - uIsle.xy), length(p - uIsle.zw)));
        // (sparks of a third of a metre stood as a grain of white specks on the far water, with an edge where they
        // began. They are SOFT GLINTS, in two sizes: 5 m across from 60 to 700 m off and 20 m across beyond 350 m,
        // one cell in five, each swelling and fading on its own slow clock; seen low each is a short level dash
        // of light, and toward the horizon they close up into a sheen)
        vec2 q1 = p / 5., q2 = p / 20. + 0.37; float r1 = h21(floor(q1) + 31.), r2 = h21(floor(q2) + 57.);
        float s1 = (1. - smoothstep(0.12, 0.48, length(fract(q1) - 0.5))) * smoothstep(60., 150., dist) * (1. - smoothstep(350., 700., dist));
        float s2 = (1. - smoothstep(0.12, 0.48, length(fract(q2) - 0.5))) * smoothstep(350., 700., dist);
        float g1 = step(0.8, r1) * pow(0.5 + 0.5 * sin(uTime * (1.2 + 2.2 * r1) + r1 * 40.), 2.) * s1;
        float g2 = step(0.8, r2) * pow(0.5 + 0.5 * sin(uTime * (1.2 + 2.2 * r2) + r2 * 40.), 2.) * s2;
        // THE SUN'S PATH GOES ON TO THE HORIZON (the open water's own life): under the sun's bearing the same
        // glints stand thick (every second cell) and quick (the sparks' clock) from 60 m off to the hills, over a
        // steady warm sheen (see gFar below); on the eye's side the sparks above carry it on
        // (far off the path is broad, 20 degrees to each side of the sun's bearing, full within 6)
        float gAzF = smoothstep(0.94, 0.9945, dot(normalize(-V.xz + 1e-5), normalize(uSunDir.xz + 1e-5)));
        // (L8: the steady warm sheen is twice as strong in the path's core, the 8 degrees to each side of the sun's
        // bearing, and beyond the sun's own double it comes in from 40 to 160 m off, not from 150 to 400: one path
        // from the lens to the hills. Where the sheet is seen at the sun's own height, the place of the sun under
        // the plane, it is as it was: the lower sun stays plain)
        float gFar = max(smoothstep(150., 400., dist), smoothstep(40., 160., dist) * (1. - smoothstep(0.45 * uSunDir.y, 0.85 * uSunDir.y, V.y)));
        float gP = dayK * gAzF * smoothstep(0.003, 0.03, V.y) * ((0.25 + 0.3 * gAz) * gFar
          + step(0.5, r1) * pow(0.5 + 0.5 * sin(uTime * (3. + 5. * r1) + r1 * 70.), 2.) * s1 + step(0.5, r2) * pow(0.5 + 0.5 * sin(uTime * (3. + 5. * r2) + r2 * 70.), 2.) * s2);
        col += uSunGlow * 1.3 * gP; alpha += 0.5 * gP;
        // the open lake's two islets stand in calm water: within 35 to 110 m of each the sheet is
        // clear (their doubles are seen) and carries no glint
        float dI = min(${P.farIsles.map((f) => `length(p - vec2(${f[0].toFixed(1)}, ${f[1].toFixed(1)}))`).join(', ')});
        float gS = shimK * (g1 + g2) * smoothstep(40., 110., dI);
        col += (uSunGlow * 0.7 + 0.16) * gS; alpha += 0.4 * gS;
        alpha *= mix(0.45, 1., smoothstep(35., 110., dI));
        // THE HARBOUR'S WATER IS THE SAME PALE MIRROR AS EVERYWHERE, never a navy pool: seen 20 to 50 degrees
        // down the clear sheet showed the second sky's deep zenith between the houses' doubles. By day, inside
        // the inlet, the sheet turns back the pale low sky (the sky's light lying on the water) by two fifths
        // where the water is seen less than some 50 degrees down (light on water, by that angle), the doubles
        // plain through it; seen straight down into (the well) it is clear as it was
        // (round 5, C1) THE WATER DARKENS SOFTLY TOWARD EVERY QUAY (depth under the wall): within some 12 m of
        // a shore the sheet is up to a quarter darker and a little less clear, by day, fading out evenly
        // (not in the harbour, which is all near a shore: a quarter of it there)
        float shoreK = dayK * exp(-d * 0.16) * (1. - skin) * (1. - 0.75 * hb);
        col *= 1. - 0.26 * shoreK; alpha += 0.14 * shoreK;
        float hbK = hb * dayK * smoothstep(0.2, 0.55, graz);
        col = mix(col, skyLaw(vec3(-V.x, 0.14, -V.z)) * 0.94, 0.55 * hbK); alpha = max(alpha, 0.42 * hbK);
        gl_FragColor = vec4(col, clamp(alpha, 0., 0.93));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000).rotateX(-Math.PI / 2), mat);
  mesh.renderOrder = 2; mesh.frustumCulled = false;
  return { mesh, mat };
}

// ---------------------------------------------------------------- the thin smoke of a few kitchen chimneys
// Eight soft dabs to a chimney, each rising 12 m straight up on the world's clock and fading at both ends of its
// rise (no seam); the twin under the plane is the same mesh turned about, so there the smoke sinks straight down.
// A dab turns about its own place to face the eye (its place and size are the world's).
export const SMOKE_RISE = 12;
export function makeSmoke(look, chimneys, tone) {
  const list = [];
  // (round 2, E5: the three nearest chimneys and any within 60 m of the line smoke with more body: fourteen puffs
  // each, nearly twice the size and denser, above and, by the doubler, below)
  chimneys.forEach((c, i) => {
    const n = i < 3 || c.d < 60 ? 14 : 8;
    // (round 4, D1: A LITTLE MORE BODY, above and below: the puffs a tenth to a fifth larger, and by day a
    // quarter denser (0.7 of the night's, not 0.56): thin and grey-blue as before)
    // (the guard again: MORE BODY, above and below: the near chimneys' puffs a quarter larger and half as dense
    // again at their middle, the far ones an eighth larger; grey-blue by day as before)
    for (let k = 0; k < n; k++) list.push({ p: c.p, ph: (k + c.ph) / n, sd: c.ph, sz: n > 8 ? 1.7 : 1.35 });
  });
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new Float32Array(Math.max(1, list.length) * 4), B = new Float32Array(Math.max(1, list.length) * 2);
  list.forEach((it, i) => { A.set([it.p[0], it.p[1], it.p[2], it.ph], i * 4); B.set([it.sd, it.sz], i * 2); });
  geo.setAttribute('iP', new THREE.InstancedBufferAttribute(A, 4));
  geo.setAttribute('iS', new THREE.InstancedBufferAttribute(B, 2));
  geo.instanceCount = list.length;
  const mk = (side) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { ...look, uTone: { value: side > 0 ? new THREE.Vector3(1, 1, 1) : tone } },
    vertexShader: /* glsl */`attribute vec4 iP; attribute vec2 iS; uniform float uTime; varying vec2 vQ; varying float vK;
      void main() {
        float k = fract(uTime * 0.085 + iP.w);
        // (the guard: the smoke read as PALE CONES, steam jets. A
        // dab grew from 0.35 to 1.85 of its size over the rise: a cone. It is A THREAD now: it grows from 0.3 to
        // 0.85 only, and leans a little down the air as it rises, all one way, each chimney's by its own measure)
        vec3 c = iP.xyz; c.y += k * ${SMOKE_RISE}.; c.x += 0.22 * k * sin(k * 5. + iS.x * 40.) + 0.8 * (0.9 + 0.5 * sin(iS.x * 17.)) * k * k; c.z += 0.22 * k * sin(k * 4.1 + iS.x * 23.) + 0.6 * (0.9 + 0.5 * sin(iS.x * 17.)) * k * k;
        vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.);
        mv.xy += position.xy * (0.3 + 0.55 * k) * iS.y;
        vQ = position.xy; vK = k + (iS.y > 1.5 ? 2. : 0.); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uSunCol, uAmbSky, uTone; varying vec2 vQ; varying float vK;
      void main() {
        float d = clamp(1. - dot(vQ, vQ), 0., 1.);
        float body = step(1.5, vK), kk = vK - 2. * body;
        // (mending 2, step 2: THINNER AND GREYER by day: the narrow dabs lie three and four deep, so each is a little
        // over half as dense as it was, and the day's tone is drawn six tenths of the way to its own grey, a fifth deeper)
        // (mending 4: the near chimneys' threads are a third narrower (see the dabs' size above) and half as dense
        // again at their middle: one thin grey thread, above and below)
        float a = d * d * sin(3.14159 * clamp(kk, 0., 1.)) * (0.3 + 0.34 * body);
        // (round 3, A6) BY DAY THE SMOKE IS THIN AND GREY-BLUE, never an opaque white (it read as fountain jets
        // or standing shapes): the sky's fill with a little grey of the sun's strength, at a little over half the
        // night's density; by night (the sun's light bluer than red) its tone is as it was (mending 2: thinner too)
        float day = step(uSunCol.b, uSunCol.r);
        vec3 sc = mix(uAmbSky * 0.8 + uSunCol * 0.3, uAmbSky * 0.72 + vec3(0.062, 0.064, 0.068) * dot(uSunCol, vec3(1.)), day);
        sc = mix(sc, mix(sc, vec3(dot(sc, vec3(0.3333))), 0.6) * 0.8, day);
        gl_FragColor = vec4(sc * uTone, a * mix(1., 0.7, day));
      }`,
  });
  const mesh = new THREE.Mesh(geo, undefined);
  return { mesh, pair: { up: mk(1), low: mk(-1) }, count: list.length };
}

// ---------------------------------------------------------------- the palette (the brief's), linear
export function makePalette() {
  return {
    lime: ['#f1e3c6', '#e6b98a', '#d99a8a', '#9fb8a8', '#f6f1e6'].map(lin),
    timber: lin('#a8967c'), deck: lin('#8a6a48'), slate: lin('#5f6a72'), quay: lin('#d3c7ab'), pave: lin('#c4bca9'),
    tile: lin('#a9745c'), parapet: lin('#e2dac6'), wall: lin('#cfc5ae'), rock: lin('#8f8779'), far: lin('#6f8473'), bastion: lin('#e4dccb'), hall: lin('#f6f1e6'), jug: lin('#2f6f7f'),
    // cloth in worn tones (the brief's four, faded); pennants never red
    // (round 4, A4: COLOUR ACCENTS: the cloth is deep red, saffron, indigo, green and a burnt terracotta, with no
    // cream or beige among them (in the low sun the faded tones burnt out to the walls' own cream))
    // (in the sun the five stood as a confetti of pure colours over the far fronts, seen from the bay and from
    // the jetty: each is a dyed cloth's deeper tone now)
    // (round 4, A-ii: NOT BUNTING: of twelve cloths eight are bone, cream or undyed linen and four are dyed, deep
    // and muted (madder, saffron, indigo, olive: never a pure primary), so a tier seen from afar shows a few
    // accents and the rest hangs pale; of the first five, which the rooms' own things take, three are undyed)
    cloth: ['#e3dccb', '#8c3a2e', '#efe6d2', '#d6ccb4', '#c0913a', '#34405f', '#6b7046', '#e3dccb', '#efe6d2', '#d6ccb4', '#cfc8b8', '#e9e0cc'].map(lin), pennant: ['#a3977b', '#a3977b', '#a3977b'].map(lin), /* (mending 4: a dull ochre-grey linen, a clear step under bone) */ boat: ['#2f6f7f', '#b9482f', '#e6d9b8', '#6f8f4a'].map(lin),
    pot: ['#b9482f', '#c98a5a', '#9fb8a8'].map(lin), leaf: ['#6f8f4a', '#8aa05a', '#9aa55c'].map(lin), /* (round 5, D1, the guard: the tan tree is leaf green: the third leaf tone was tan) */ cypress: ['#33583c', '#3c6644'].map(lin), shutter: ['#6f8f8a', '#8a9a74', '#96705f', '#857f6f', '#627886'].map(lin),
  };
}

// ---------------------------------------------------------------- buildHero: lays the whole doubled city
// opts: { P, C (plan and causeway, made by the world before its route), look (shared uniforms), S (named streams),
//   distToLine(x, y, z), keep(x, y, z, margin), sunDir (Vector3, the city's own space), night (0..1), density,
//   hall { a, half, arches }, aStair (where the quay.s water stair stands), rare (bool: the one visit in eight) }
export async function buildHero(ctx, opts) {
  const { P, C, look, S } = opts, pal = opts.palette || makePalette(), Y = () => ctx.yield();
  const root = new THREE.Group(), dbl = makeDoubler(look), owned = [];
  root.add(dbl.upper, dbl.lower);
  const mesh = (g) => { const geo = g.build ? g.build() : g; owned.push(geo); return dbl.add(new THREE.Mesh(geo)); };
  const inst = (geo, list) => { owned.push(geo); return dbl.add(makeInstanced(geo, list)); };
  // PHONES: opts.detail (ctx.quality.detail) thins the plentiful small things after they are laid, evenly through
  // each list (the golden step), so no stream is drawn more or less for it; at detail 1 every list is whole
  const detail = Math.min(1, Math.max(0.4, opts.detail ?? 1));
  const thin = (l, k = detail) => k >= 1 ? l : l.filter((_, i) => (i * 0.618034) % 1 < k);
  // (ROUND 5 MENDING 5, L6) THE ONE RULE OF THE LINE (the world's keep: nothing afloat or standing within LINE_N m
  // of the line's plan where the lens is less than LINE_H m over its top), asked by every maker below for what the
  // deal lays: boats, floats, buoys, trees, pergola posts and houses' roofs. P.ruled lists what it takes away (the
  // place of each) and keeps the least distance from the line of what it leaves, by kind
  const ruled = P.ruled = { gone: {}, near: {} };
  const rule = (what, x, yTop, z, margin = 0, lo) => {
    if (!opts.keep(x, yTop, z, margin, lo)) { (ruled.gone[what] = ruled.gone[what] || []).push([Math.round(x), Math.round(yTop), Math.round(z)]); return false; }
    ruled.near[what] = Math.min(ruled.near[what] ?? Infinity, opts.distToLine(x, yTop, z)); return true;
  };
  // the shade map: the hill's own shadow for this visit's sun
  const shade = await makeShadeMap(P, opts.sunDir, ctx.yield);
  look.uShade.value = shade.texture; look.uShadeRect.value.copy(shade.rect);
  look.uNight.value = opts.night;
  await Y();
  mesh(makeTerrain(P, pal, opts.distToLine, S.flank));
  await Y();
  const houses = layHouses(P, S.houses, pal, opts.distToLine, rule);
  houses.push(crestHouse(P, opts.hall, pal, opts.distToLine));
  const occ = makeOccMap(P, houses); look.uOcc.value = occ.texture; look.uOccRect.value.copy(occ.rect);
  await Y();
  const shells = await makeShells(P, houses, pal, Y, rule);
  await Y();
  mesh(shells.g);
  await Y();
  const L = await layRooms(P, houses, { rooms: S.rooms, cloth: S.cloth, lamps: S.lamps }, pal, { density: opts.density, night: opts.night, distToLine: opts.distToLine, rest: Y });
  // (round 5 mending 2) the crest's tall house, on the seed's own named stream 'crest' (L4)
  const sC = S.crest;
  const Lc = await layRooms(P, houses, { rooms: sC, cloth: sC, lamps: sC }, pal, { density: opts.density, night: opts.night, distToLine: opts.distToLine, own: true });
  for (const k of ['rooms', 'roomsF', 'roomsL', 'roomsR', 'rails', 'curtN', 'curtF', 'lamps', 'posts', 'toprail']) L[k].push(...Lc[k]);
  Lc.sets.forEach((l, i) => L.sets[i].push(...l)); L.stats.lit += Lc.stats.lit; L.stats.cloth += Lc.stats.cloth;
  await Y();
  const quay = makeQuay(P, pal);
  mesh(quay.g);
  await Y();
  const bast = makeBastion(P, pal);
  mesh(bast.g);
  mesh(C.g);
  await Y();
  const hall = makeHall(P, pal, opts.hall);
  mesh(hall.g);
  // (the far ranges under the city's pair; the two lake rocks as a mesh of their own under the lake pair, below)
  const farS = makeFarShore(S.shore, pal, P, C, opts.distToLine, S.road);
  mesh(farS.g);
  // the joins: laid once, in neither group's twin (made before the boats, which keep off the water stairs)
  const joins = makeJoins(P, C, pal, opts.aStair), jgeo = joins.g.build(), jm = new THREE.Mesh(jgeo, dbl.joinMat);
  owned.push(jgeo); jm.frustumCulled = false; root.add(jm);
  const lay = layBoats(P, C, S.boats, pal, opts.density, rule, joins.stairs.concat([P.isle, P.isle2].filter(Boolean).map((q) => ({ x: q[0], z: q[1], r: 15 }))), opts.distToLine, S.road);
  // (the islets' footing joins the lake rocks' geometry, after the boats, which it keeps off)
  makeFooting(farS.rocks, P, pal, S.flank, rule, lay);
  const rocksGeo = farS.rocks.build(); owned.push(rocksGeo); dbl.add(new THREE.Mesh(rocksGeo), dbl.lakePair);
  const furn = makeFurniture(P, C, pal, lay, S.boats, opts.density, rule);
  mesh(furn.g);
  await Y();
  const U = unitGeos(), sets = roomSets(pal);
  inst(U.room, L.rooms); await Y();
  inst(U.roomF, L.roomsF); await Y();
  for (const [u, l] of [[U.roomL, L.roomsL], [U.roomR, L.roomsR]]) if (l.length) inst(u, l); else owned.push(u);
  inst(U.rail, L.rails); await Y();
  inst(U.toprail, L.toprail);
  // THE RARE VISIT (one in eight): long pennants hang from the hall's arcade, one at every pier
  const banners = [];
  if (opts.rare) for (let i = 0; i <= opts.hall.arches; i++) {
    const ab = opts.hall.a - opts.hall.half + 2 * opts.hall.half * i / opts.hall.arches, pb = P.pos(hall.r0 - 0.25, ab);
    banners.push({ m: new THREE.Matrix4().makeTranslation(pb[0], hall.y0 + 9.2, pb[1]).multiply(_r.makeRotationY(-ab)).multiply(_s.makeScale(1.1, 6.4, 1)), a: [S.rare(), 0, S.rare(), i % 2], c: pal.pennant[i % 3] });
  }
  // PENNANTS ON THE CAUSEWAY'S GATE HOUSES, on every visit: from a mast of 6 m on each gate house's roof a
  // pennant (it hangs and sways slowly, see the cloth's vertex law; none on the crest's tall house)
  const rz = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
  // (C3: and one on each islet's house, over the middle of its two halves)
  let nTw = 0;
  // (ROUND 5 MENDING 4, the guard's must-fix: each pennant read as a WHITE CRESCENT on a mast, a sickle, a horn, a
  // moon by night.) A PENNANT IS CLOTH: a long narrow strip, 0.75 m by 4.2, that hangs straight down beside its
  // mast from a short cross yard at the mast's head and sways slowly from the yard (the cloth's vertex law), in a
  // dull ochre-grey linen, three times deeper by night. (L5) ONE RULE: a pennant on EVERY gate house of the
  // causeway and on EVERY islet's house (both islets alike), and nowhere else: none on a tower of the crescent,
  // none on the crest's tall house, none on a harbour roof
  const pnC = mulc(pal.pennant[0], opts.night > 0.5 ? 0.3 : 1), isles = [P.isle, P.isle2].filter(Boolean);
  houses.filter((h) => !h.own && (h.verandasOnly || (h.kind === 'tower' && isles.some((q) => Math.hypot(h.x - q[0], h.z - q[1]) < 12) && nTw++ % 2 === 0))).forEach((h) => {
    const dd = h.kind === 'tower' ? h.depth : h.depth / 2, yT = h.y0 + h.floors * P.FLOOR + (h.kind === 'tower' ? 3.4 : 1.2), cx = h.x - Math.sin(h.yaw) * dd, cz = h.z - Math.cos(h.yaw) * dd;
    // (L4: the yard's bearing and the cloth's two phases by the pennants' own stream)
    const b = S.pennant.range(-0.5, 1.7), pnA = [S.pennant(), 1, S.pennant(), 0], T = () => new THREE.Matrix4().makeTranslation(cx, yT + 6.1, cz).multiply(_r.makeRotationY(b));
    L.posts.push({ m: new THREE.Matrix4().makeTranslation(cx, yT, cz).multiply(_s.makeScale(0.8, 6.3, 0.8)), a: [0, 0, 0, 0], c: pal.timber });
    L.posts.push({ m: T().multiply(rz).multiply(_s.makeScale(0.6, 1.25, 0.6)), a: [0, 0, 0, 0], c: pal.timber });
    banners.push({ m: T().multiply(_t.makeTranslation(-0.68, -0.06, 0)).multiply(_s.makeScale(0.75, 4.2, 1)), a: pnA, c: pnC });
  });
  // (AND ONE ON THE NEAR ROCK'S HOUSE, from the mast on its ridge; the same cloth and yard, its bearing and
  // phases by the stream road; by night it is dark with its rock: the cloth 0.12, the yard 0.15 of their day's)
  if (P.nearRock && P.nearRock.mast) {
    const [mx, my, mz] = P.nearRock.mast, b = S.road.range(-0.5, 1.7), T = () => new THREE.Matrix4().makeTranslation(mx, my - 0.2, mz).multiply(_r.makeRotationY(b));
    L.posts.push({ m: T().multiply(rz).multiply(_s.makeScale(0.6, 1.25, 0.6)), a: [0, 0, 0, 0], c: mulc(pal.timber, opts.night > 0.5 ? 0.15 : 1) });
    banners.push({ m: T().multiply(_t.makeTranslation(-0.68, -0.06, 0)).multiply(_s.makeScale(0.75, 4.2, 1)), a: [S.road(), 1, S.road(), 0], c: mulc(pnC, opts.night > 0.5 ? 0.4 : 1) });
  }
  inst(U.clothN, L.curtN.concat(furn.cloth, banners)); await Y();
  inst(U.clothF, thin(L.curtF, 0.4 + 0.6 * detail)); await Y();
  // (M4b 2: the trees are laid before the street's things, which lay the planted bays' shadows by P.belvTree)
  const treeList = layTrees(P, S.trees, pal, opts.density, opts.hall, houses.gardens, rule);
  // (THE RECORD P.belvTree IS TAKEN AFTER THE THINNING. On a small machine the trees are thinned
  // (thin, below, by each tree's place in this list); a bay carries a tree only if its tree is one that stays,
  // so at every quality.detail a long shadow lies on the rising street only where its tree stands)
  const treeK = 0.3 + 0.7 * detail, treeStays = (i) => treeK >= 1 || (i * 0.618034) % 1 < treeK;
  P.belvTree = (P.belv || []).map((ab) => treeList.some((t, i) => t.bay === ab && treeStays(i)));
  const street = makeStreetThings(P, pal, S.lamps, opts.night, opts.sunDir, rule);
  mesh(street.g);
  inst(U.lamp, L.lamps.concat(street.lamps));
  inst(U.post, L.posts); await Y();
  for (let i = 0; i < 7; i++) if (L.sets[i].length) inst(sets[i], thin(L.sets[i])); else owned.push(sets[i]);
  await Y();
  inst(boatGeo(pal), lay.boats);
  inst(floatGeo(), thin(lay.floats));
  inst(leafGeo(), thin(lay.leaves));
  inst(treeGeo(), thin(treeList.concat(street.trees), treeK));
  await Y();
  return finishHero(ctx, opts, { root, dbl, owned, shade, houses, shells, L, lay, furn, hall, joins, bast, quay, pal });
}

function finishHero(ctx, opts, B) {
  const { root, dbl, owned } = B, { look, P } = opts;
  // the smoke of a few chimneys (the nearest to the flown line first, so that some rise where we pass)
  // (no column of smoke crosses the line: a chimney whose column would come within 6.5 m of it does not smoke)
  const off = (c) => { for (let j = 0; j <= 6; j++) if (opts.distToLine(c.p[0], c.p[1] + j * 2, c.p[2]) < 6.5) return false; return true; };
  const ch = B.shells.chimneys.filter(off).sort((a, b) => a.d - b.d).slice(0, Math.max(4, Math.round(14 * opts.density * Math.min(1, opts.detail ?? 1))));
  const smoke = makeSmoke(look, ch, dbl.tone);
  smoke.mesh.renderOrder = 3;
  dbl.add(smoke.mesh, smoke.pair);
  smoke.mesh.userData.twin.renderOrder = 1;
  owned.push(smoke.mesh.geometry);
  // the sky with the second sky under it, and the water's sheet
  const dome = makeDome(look, dbl.tone);
  root.add(dome.mesh);
  const water = makeWater(look, P, B.lay.rings.map((b, i) => ({ x: b.x, z: b.z, ph: B.lay.boats[i].a[0] })), opts.C);
  root.add(water.mesh);
  owned.push(dome.mesh.geometry, water.mesh.geometry);
  const mats = [...dbl.mats.up, ...dbl.mats.low, dbl.joinMat, dbl.lakePair.up, dbl.lakePair.low, smoke.pair.up, smoke.pair.low, dome.mat, water.mat];   // (every material made here, the lake rocks' pair among them: dispose() frees each)
  const _c = new THREE.Vector3();
  let jointTris = 0;
  { const idx = B.joins.g.triangles; jointTris = idx; }
  return {
    object: root, radius: 460, height: 150, center: new THREE.Vector3(0, 40, -270),
    P, dbl, dome, water, houses: B.houses, lay: B.lay, furn: B.furn, joins: B.joins, hall: B.hall, bast: B.bast, chimneys: ch,
    stats: { triangles: dbl.triangles + jointTris + 2 + 1200, calls: dbl.calls + 3, lit: B.L.stats.lit, cloth: B.L.stats.cloth + B.furn.cloth.length, boats: B.lay.boats.length, rooms: B.L.rooms.length + B.L.roomsF.length, houses: B.houses.length },
    anchors: {},
    update(dt, time, camera) {
      look.uTime.value = time;
      camera.getWorldPosition(_c);
      dome.mesh.position.set(_c.x * look.uHand.value, _c.y, _c.z);
    },
    dispose() {
      for (const g of owned) g.dispose();
      for (const m of mats) m.dispose();
      B.shade.texture.dispose();
      if (look.uOcc.value) look.uOcc.value.dispose();
    },
    ground: false,
  };
}
