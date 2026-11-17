// THE STUDY AT MOUSE HEIGHT: a chart maker's study at night, built eighty times life (1 cm of the room is 0.8 m here):
// A TALL LIBRARY, its walls shelves of books to a ceiling lost in warm darkness, a brass ladder on its rail, a second tall
// window in the east wall with the moon low in it. Smaller than a mouse we leave the sill of the open south window and
// sink in one long glide across the room to the fire behind its brass fender, turn along the hearth wall past the tall
// clock in the moon's bar, climb a sea chart that hangs from the table like a hillside of paper, and come out on the
// table top: the gold of the one oil lamp, the blue night, and an empty bottle of green glass lying aslant with its round
// base toward us. One round out over the dark room, the lit table an island in it, and the last straight to the base.
// The base IS the opening: nothing is built in it or before it, and nothing inside the bottle but its slow green mist.
// Compass: +X east, -Z north. Window wall south (z 160), table against the north wall, hearth in the west wall.
// The light law (lamp, fire, night, moon, each written from where it stands) and the hero live in ../parts/study-at-mouse-height.js.
// Everything of the join (sill, entry axis, table, lamp, bottle, caustic, hanging chart, dividers, sand glass, route) is the
// same on every seed; a seed changes the fire (high or embers), rain, the moths, the moon's place in the east light, the
// charts' coasts, the books of every shelf, the colours of the rug, and what lies about off the route.
// MEDIA (passed through): the dust motes. A mote's size is its own, in metres, and its light is its own (the lamp's, the
// fire's, the moon's or the bottle's by its place). THE AIR ROUND THE FLOWN LINE IS CLEAR BY PLACE: a mote whose whole reach
// keeps 12 m and more of clear air from the line is lit in full, one with 5 m or less is dark, evenly between (the same at
// every clock and on every seed). The one law that reads the lens is the medium's near law: within 3 m of the eye a mote's
// light falls to nothing by its true distance (it bites nowhere while the eye keeps the line).
// Also media: the fire's tongue sheets and sparks (each sheet turns on its own upright to face the eye), the pipe's smoke, the
// mug's steam, the lamp's glow and the heat over its chimney. NO TEXTURE is made anywhere in this world or its part, and no timer.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeFlames } from '../kit/interior.js';
import { buildHero, makeLib, makeBuilder, lathe, tube, M4, SURF, WOOD_PARS, GLSL_NOISE, GLSL_LIGHT } from '../parts/study-at-mouse-height.js';

const TAU = Math.PI * 2, PI = Math.PI, V3 = THREE.Vector3;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 24, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const lin3 = (hex, k = 1) => { const c = new THREE.Color(hex); return new V3(c.r * k, c.g * k, c.b * k); };

// ---------------------------------------------------------------- the room's measures (metres, eighty times life)
// THE BOTTLE lies aslant where the join sheet has it: BASE is the centre of its base and the way it lies (so many degrees
// north of east, into the bottle). The bottle, its ring and its cradle are GROW times their first size about that centre
// (GROW: the opening's radius over the first 5 m); LEN0: its glass at the first size, base plane to lip (the part's own).
const GROW = 1.8, LEN0 = 27.5, BASE = { x: 121.2, y: 68, z: -130.1, lies: 42 };
const AXIS = [Math.cos(BASE.lies * Math.PI / 180), -Math.sin(BASE.lies * Math.PI / 180)], ACROSS = [-AXIS[1], AXIS[0]];
// THE ROOM GIVES WAY TO THE BOTTLE BY RULE: reach is the bottle from its base to the end of the cork's wax, along its axis;
// the end of the wax lies 1 m inside the table's back edge, the table's back stands 2 m off the north wall, and THE NORTH
// WALL STANDS WHERE THAT PUTS IT (z0); the table's top stands GROW times the cradle's 8 m under the axis and its east end
// 4 m beyond the wax's end. NZ: how far the north wall stands beyond z -160, where the room first had it (what is built
// against that wall is moved by as much). h: A TALL LIBRARY, the ceiling half as high again as the first room's.
const REACH = (LEN0 + 3.75) * GROW;
const ROOM = { x0: -200, x1: 200, z0: BASE.z + AXIS[1] * REACH - 3, z1: 160, h: 330, wain: 80 }, NZ = ROOM.z0 + 160;
// the south window's two lights (the east one stands open: the entry) are TALL: from the sill to y1
const WIN = { x0: 39, x1: 111, y0: 56, y1: 256, zIn: 160, zOut: 184, wx0: -105, wx1: 25 };
const TABLE = { x0: -15, x1: BASE.x + REACH * AXIS[0] + 4, z0: ROOM.z0 + 2, z1: -92, y: BASE.y - 8 * GROW, thick: 3, reach: REACH };
// THE EAST LIGHT, the room's second tall window, by a rule of the east wall: its north jamb stands one shelf's depth and a
// jamb's breadth (SHELF.deep + 4 m) south of the north wall, it is EWIN.wide broad (a light and a quarter of the south
// window's), its sill is the wainscot's rail and its head the south window's; the wall is as thick there as the south wall
const SHELF = { deep: 16, pitch: 30, bay: 40, board: 1.6, y0: ROOM.wain + 4 };
const EWIN = { z0: ROOM.z0 + SHELF.deep + 4, wide: 90, y0: ROOM.wain + 4, y1: WIN.y1, xIn: ROOM.x1, xOut: ROOM.x1 + 24 };
EWIN.z1 = EWIN.z0 + EWIN.wide;
// the working chart on the table top: from 4 m east of the hanging chart's end to 2 m inside the table's east, north and south edges
const CHART = { x0: 22, x1: TABLE.x1 - 2, z0: TABLE.z0 + 2, z1: TABLE.z1 - 2 };
const FIRE = [-186, 14, -25];
const FENDER = { x: -160, z0: -82, z1: 32, h: 10 };
// the mantel shelf over the fire: its front edge 14 m out from the west wall, its underside 104 m up, 134 m long about the fire
const MANTEL = { x: ROOM.x0 + 14, y: 104, z0: FIRE[2] - 67, z1: FIRE[2] + 67 };
// (the hanging chart: its north edge 6 m inside the table's back, under the book pile)
const SHEET = { xFoot: -95, xEdge: -15, z0: TABLE.z0 + 6, z1: -96, xFlat: -112, xTop: 18 };
const sheetH = (x) => { const s = clamp((x - SHEET.xFoot) / (SHEET.xEdge - SHEET.xFoot), 0, 1); return TABLE.y * (0.7 * s + 0.3 * s * s); };
// the rug and the armchair's legs; the chair's faces stand CHAIR.out outside its legs' middles.
// THE ARMCHAIR STANDS IN THE SOUTH-WEST CORNER, WELL ASIDE OF THE LINE, TURNED NORTH TO THE FIRE: its legs' square (CHAIR.wide)
// stands CHAIR.off before the west wall's shelves and CHAIR.off before the south wall (its faces, CHAIR.out outside the
// legs). So it stands far to the left hand of the fire's long straight, behind the hearth turn: no leg and no seat is
// between the line and the fire, and none stands near the eye on the way to it
const RUG = { x0: -125, x1: 80, z0: -55, z1: 50 };
const CHAIR = { wide: 56, off: 6, leg: 2.5, out: 3.5 };
CHAIR.x0 = ROOM.x0 + SHELF.deep + CHAIR.off + CHAIR.out; CHAIR.x1 = CHAIR.x0 + CHAIR.wide; CHAIR.z1 = ROOM.z1 - CHAIR.off - CHAIR.out; CHAIR.z0 = CHAIR.z1 - CHAIR.wide;
// the bottle's measures in the room's metres: the centre of its base, the height of its axis, its length of glass (the reach
// less the cork and its wax, 3.75 m at the first size), body and neck: the glass's radius at the body and at the lip
// (AXIS, into the bottle; ACROSS: level and square to it, on the side away from the lamp, south-east)
const BOTTLE = { x: BASE.x, y: BASE.y, z: BASE.z, len: LEN0 * GROW, lies: BASE.lies, body: 5.7 * GROW, neck: 2.34 * GROW };
// THE ROLL STAND: a basket of rolled charts on the floor before the east shelves, ROLLS.off metres out from their face, midway
// between the table's south edge and the door's north jamb (DOOR); the basket ROLLS.r in radius and ROLLS.h high; keep: what
// lies on the floor keeps this far from its middle (its leaning rolls reach as far at their tops).
const DOOR = { z0: 22, z1: 108, top: 180 };
const ROLLS = { x: ROOM.x1 - SHELF.deep - 12, z: (TABLE.z1 + DOOR.z0) / 2, off: 12, r: 8, h: 40, keep: 12 };
// THE LAMP STANDS BY THE BOTTLE (the join sheet's EXIT of 2): north-west of the bottle's base, LAMP.left metres to the left of
// the last straight (the sheet gives 25 to 32: the middle of that), its font (LAMP.font in radius) LAMP.edge metres inside the
// table's north edge; its flame 13 m over the table top. So lamp and bottle stand together on the table's east half, the lamp
// at the table's back beside the bottle's body: from the sill, the crest and the crossing the whole bottle lies clear before
// it, and its light comes through the glass. MOTHS: the furthest reach of the moths' ring from the lamp's axis (10 m and a wing).
const LAMP = { left: 28.5, font: 6, edge: 4 }, MOTHS = 11.6;
const FLAME = (() => { const z = TABLE.z0 + LAMP.edge + LAMP.font, al = (z - BOTTLE.z + LAMP.left * ACROSS[1]) / AXIS[1];
  return [BOTTLE.x + al * AXIS[0] - LAMP.left * ACROSS[0], TABLE.y + 13, z]; })();
// THE LINE, entry to the centre of the bottle's base, LAID AS A PLAN OF STRAIGHTS AND ROUND TURNS. EVERY RADIUS AND EVERY
// LENGTH IS GIVEN BY THINGS OF THE ROOM; the way's length falls where they put it:
//   sill      level and straight north on the entry axis for LINE.sill metres;
//   THE FIRE  one left turn as wide as half the south window (its radius the window's half width) and ONE LONG STRAIGHT,
//             sinking all the way, toward the hearth: the straight that touches that turn and the hearth turn;
//   the hearth turn, to the right, as wide as half the fender is long: it ends abeam of the fire's middle, heading north,
//             LINE.hearth metres before the fender's face;
//   the hearth run, north along the fender and the hearth wall's shelves, the clock ahead;
//   the clock turn, to the right: it ends over the hanging chart's foot heading east on the crossing's line (so its radius is
//             the foot's distance east of the hearth run), the clock standing to the left hand as it goes round;
//   THE CLIMB AND THE CROSSING, one straight, east: up over the hanging chart LINE.crest metres in from the sheet's south
//             edge, over its crest (the table's west edge) and across the table top, the bottle ahead on the left hand,
//             the lamp behind it;
//   THE ROUND, to the right all the way, on one radius (LINE.bottle: the round turns as far from its middle as it keeps from
//             the glass): its first bend, a quarter turn, leaves the crossing where its nearest place to the bottle's glass
//             is LINE.bottle metres; THE JOIN runs due south, square out over the table's south edge and on over the room,
//             the south window ahead; its second bend, whose middle stands due south of the first's, comes round over
//             the room onto the bottle's axis;
//   the last straight, level, on the axis: as long as the round's place makes it (LINE.straight is the join sheet's least).
// lane: the height over the boards along the hearth; top: the height across the table (the bottle's axis); rise: how far over
// that the line stands on the round, over the room; over: the climb ends this many metres past the crest; ease: the rounding
// of the heights' corners; blend: the reach over which a turn is run into and out of; step: one knot every so many metres.
const LINE = { sill: 60, hearth: 25, crest: 14, bottle: 45, straight: 90, lane: 10, level: BOTTLE.y, top: BOTTLE.y, rise: 15, over: 20, ease: 15, blend: 6, step: 3 };
// a place's distance in plan from the bottle's glass (the body's breadth from the base to the lip)
const offGlass = (x, z) => { const s = (x - BOTTLE.x) * AXIS[0] + (z - BOTTLE.z) * AXIS[1], y = (x - BOTTLE.x) * ACROSS[0] + (z - BOTTLE.z) * ACROSS[1];
  return Math.hypot(s - clamp(s, 0, BOTTLE.len), y - clamp(y, -BOTTLE.body, BOTTLE.body)); };
const layLine = () => {
  const D = Math.PI / 180, S = [], put = (c, R, h, hand) => [c[0] + hand * R * Math.sin(h * D), c[1] + hand * R * Math.cos(h * D)];
  const line = (a, b) => S.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) });
  const arc = (c, R, h0, h1, hand) => S.push({ c, R, h0, h1, hand, len: Math.abs(h1 - h0) * D * R });
  const inB = (s, y) => [BOTTLE.x + AXIS[0] * s + ACROSS[0] * y, BOTTLE.z + AXIS[1] * s + ACROSS[1] * y];
  // (headings in degrees: 0 east, 90 north; hand 1 left, -1 right)
  const R1 = (WIN.x1 - WIN.x0) / 2, C1 = [75 - R1, 150 - LINE.sill], xh = FENDER.x + LINE.hearth, RH = (FENDER.z1 - FENDER.z0) / 2, CH = [xh + RH, FIRE[2]];
  // the fire's straight: its heading is the one at which it touches both turns (found by stepping)
  let h2 = 170; for (let i = 0; i < 80; i++) { const p = put(C1, R1, h2, 1), q = put(CH, RH, h2, -1); h2 = Math.atan2(p[1] - q[1], q[0] - p[0]) / D; if (h2 < 0) h2 += 360; }
  line([75, 150], [75, 150 - LINE.sill]); arc(C1, R1, 90, h2, 1); line(put(C1, R1, h2, 1), put(CH, RH, h2, -1)); arc(CH, RH, h2, 90, -1);
  // the crossing's line and the clock turn that ends on it over the chart's foot
  const zc = SHEET.z1 - LINE.crest, RC = SHEET.xFoot - xh, crest = [SHEET.xEdge + 1, zc];
  line([xh, FIRE[2]], [xh, zc + RC]); arc([SHEET.xFoot, zc + RC], RC, 90, 0, -1);
  // the round: its second bend's middle by the axis, its first bend's by the glass (walked east until its nearest place
  // to the glass is LINE.bottle)
  const RR = LINE.bottle; let x1 = SHEET.xEdge;
  while (x1 < TABLE.x1 && offGlass(x1 + 0.25, zc + RR) - RR > LINE.bottle) x1 += 0.25;
  // (the second bend's middle stands on the axis's right hand at the round's radius, due south of the first's: that gives the
  // last straight's length; never less than the sheet's least)
  const run = Math.max(LINE.straight + LINE.blend, (BOTTLE.x + RR * ACROSS[0] - x1) / AXIS[0]), C3 = inB(-run, RR);
  const C2 = [x1, zc + RR], hs = Math.atan2(C2[1] - C3[1], C3[0] - C2[0]) / D;
  line([SHEET.xFoot, zc], [x1, zc]); arc(C2, RR, 0, hs, -1); line(put(C2, RR, hs, -1), put(C3, RR, hs, -1)); arc(C3, RR, hs, BOTTLE.lies - 360, -1);
  line(inB(-run, 0), [BOTTLE.x, BOTTLE.z]);
  // the plan's marks (metres along the plan at each piece's beginning) and the heights, keyed with even slopes between: level
  // on the sill; ONE EVEN DESCENT down the first turn, the fire's straight and the hearth turn to the lane's height abeam of
  // the fire; level along the hearth; up from where the clock turn begins, round it and over the hanging chart, to the
  // table's height LINE.over past the crest; level across the table; up by LINE.rise round the first bend and the join, out
  // over the room (so that the eye, coming round, looks down on the lit table); level through the first half of the second
  // bend; down again to the axis's height before the last sixty metres begin (their height's corner is rounded before them)
  const m = [0]; for (const s of S) m.push(m[m.length - 1] + s.len);
  const dCrest = m[6] + crest[0] - SHEET.xFoot;
  const K = [[0, 72], [m[1], 72], [m[4], LINE.lane], [m[5], LINE.lane], [dCrest + LINE.over, LINE.top], [m[7], LINE.top], [m[9], LINE.top + LINE.rise], [(m[9] + m[10]) / 2, LINE.top + LINE.rise], [m[11] - 60 - LINE.ease - 2 * LINE.step, LINE.level], [m[11], LINE.level]];
  const yKey = (d) => { let i = 0; while (i < K.length - 2 && d > K[i + 1][0]) i++; return K[i][1] + (K[i + 1][1] - K[i][1]) * clamp((d - K[i][0]) / (K[i + 1][0] - K[i][0]), 0, 1); };
  // every corner of the heights is rounded over LINE.ease metres to either side (the mean of the keyed heights there)
  const yAt = (d) => { let y = 0; for (let i = -4; i <= 4; i++) y += yKey(d + i * LINE.ease / 4) * (i === -4 || i === 4 ? 0.5 : 1); return y / 8; };
  // the plan walked in metres; every turn is run into and out of over LINE.blend metres to either side (each place of the
  // line is the mean of the plan's places within that reach: on a straight the same place, in a turn the turn's own
  // round a hand's breadth inside it, between them an even change of bend); one knot every LINE.step metres
  const walk = [];
  S.forEach((s, k) => { const n = Math.max(1, Math.round(s.len));
    for (let i = 0; i < n; i++) { const t = i / n, p = s.c ? put(s.c, s.R, s.h0 + (s.h1 - s.h0) * t, s.hand) : [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]; walk.push([p[0], p[1], m[k] + s.len * t]); } });
  walk.push([BOTTLE.x, BOTTLE.z, m[S.length]]);
  const last = walk.length - 1, at = (i) => (i < 0 ? [2 * walk[0][0] - walk[-i][0], 2 * walk[0][1] - walk[-i][1]] : i > last ? [2 * walk[last][0] - walk[2 * last - i][0], 2 * walk[last][1] - walk[2 * last - i][1]] : walk[i]);
  const knots = [];
  for (let i = 0; i < last; i += LINE.step) { let x = 0, z = 0; for (let j = -LINE.blend; j <= LINE.blend; j++) { const q = at(i + j); x += q[0]; z += q[1]; }
    knots.push([x / (2 * LINE.blend + 1), yAt(walk[i][2]), z / (2 * LINE.blend + 1)]); }
  knots.push([BOTTLE.x, LINE.level, BOTTLE.z]);
  // the places where each piece of the plan begins, in the order of MARK below; the crest; the place abeam of the fire; the
  // radii of the turns in the order flown
  const marks = S.map((s, k) => { const p = s.c ? put(s.c, s.R, s.h0, s.hand) : s.a; return [p[0], yAt(m[k]), p[1]]; });
  return { knots, marks, crest: [crest[0], yAt(dCrest), crest[1]], radii: [R1, RH, RC, RR], plan: S, heading: h2, straight: run - LINE.blend };
};
const LAID = layLine(), ROUTE = LAID.knots;
// the pieces of the plan by name (LAID.marks holds the place where each begins)
const MARK = { sill: 0, first: 1, fire: 2, hearth: 3, run: 4, clock: 5, climb: 6, round: 7, out: 8, home: 9, straight: 10 };
// the names the table's rules use: the crest's place, the last straight's length, the height of the bottle's axis
const JOIN = { crest: LAID.crest, straight: LAID.straight, level: LINE.level };
// THE TABLE'S STANDING THINGS, each by a rule of the table's own measures (the sums are here):
//   RING: the bottle's base ring and one metre (the opening as the line sees it); every sight from the line to it is a cone
//   RULE: the parallel rule (two bars, 10 m across both, 30 m long) lies along the working chart's south border at its west end,
//         its south edge 2.5 m inside the border: the swing passes it on its inner side, and it lies under every sight to the base
//   PILE: three books against the table's back, from 5 m inside the west edge to 2 m short of the working chart
//   PIPE: on the lamp's own row, west of the lamp, so far that its smoke's veil, which drifts 18.4 m east as it rises, ends at
//         the moths' ring
//   THE INKWELL, THE DIVIDERS and THE MUG are placed in build() from the flown line (INK, DIV, MUG there): they stand by the line
const RING = 5.84 * GROW + 1, TRAY = 6.9;
// THE GREEN FAN before the bottle's base (the join sheet's EXIT of 2): half strength GREEN.reach metres before the base
// along the axis (the sheet's eighty metres), opening by GREEN.spread to either hand from the ring's width
const GREEN = { reach: 80, spread: 0.6, gain: 2.2 };
// THE DROPPED QUILL lies on the bare boards before the fender's south end, pointing at the
// hearth: its root QUILL.back metres west of the fender's face and QUILL.south south of its south end, its tip 28 m on to the
// north-east (so the line, coming round the hearth turn, has the whole quill in the fire's light on its left hand)
const QUILL = (() => { const back = 8, south = 10, a = [FENDER.x - back, FENDER.z1 + south]; return { a, b: [a[0] + 28 * Math.cos(0.69), a[1] - 28 * Math.sin(0.69)] }; })();
// THE GLOBE on its stand in the south-east corner, between the door and the window wall (its ball 22 m in radius at y 70)
const GLOBE = { x: 165, z: 125, keep: 26, y: 70, r: 22, post: [3.4, 45] };
// THE STOOL stands on the bare boards south-west of the table, pushed back from the hanging chart: STOOL.back west of the
// table's west edge and south of its south edge (aside of the climb, the round and the last straight)
const STOOL = { back: 30, x: TABLE.x0 - 30, z: TABLE.z1 + 30 };
// THE LIBRARY LADDER: brass, on a rail along the north wall's shelves LADDER.under metres under the ceiling; it leans in the
// bay between the clock's and the hanging chart's flat end (midway), its feet LADDER.out before the shelves' face
const LADDER = { x: (-144 + SHEET.xFlat) / 2, wide: 28, out: 18, under: 30, step: 18 };
// THE TELESCOPE on its tripod (feet TRIPOD.feet out from its head's foot) stands before the east light's south jamb and looks
// at the moon: its feet's round 2 m before the east shelves' face, its two northern feet just south of the table's south edge
const TRIPOD = { feet: 28, x: ROOM.x1 - SHELF.deep - 2 - 28, z: TABLE.z1 + 3 + 14 };
// the open light's two casement leaves stand outward beyond the wall, so far past square to it (radians)
const LEAF = 0.22;
// THE WINDOW STAY on the seat, with its ring and the feather leaned in its curl: it hangs where a casement's stay hangs, by
// the jamb (STAY.in metres in from the west jamb of the open light), so the whole of it stands aside of the line that begins
// on the seat's middle, thirty metres from it and outside the first sights along it; the ring leans on
// the curl's jamb side (STAY.ring metres from the bar), the side away from the line
const STAY = { in: 6, x: WIN.x0 + 6, ring: 2.7 };
const RULE = { x: 35, half: 5, z: CHART.z1 - 2.5 - 5 };
const PILE = { x0: TABLE.x0 + 5, x1: CHART.x0 - 2, z: TABLE.z0 + 0.5 + 7.5 };
const PIPE = { x: FLAME[0] - (MOTHS + 18.4), z: FLAME[2] };
//   WEIGHT: the one lead weight on the hanging chart's table end, 8 m in from the table's edge and 14 m north of the crest's line
const WEIGHT = { x: SHEET.xEdge + 8, z: JOIN.crest[2] - 14 };
// THE ROOM IS DARK AND FOUR STANDING LIGHTS MAKE IT, each a pool by its own place with shade between them. All in metres:
//   the LAMP: its pool is half at LIGHT.reach from the flame, which is the flame's distance from the wall behind it: so the
//   gold lies on the chart round the lamp, on the wall behind it and on the shelves over it, is a fifth at the bottle and has
//   fallen to dark at the table's far end; round the pool a wider glow, a ninth of it (tail), half at the table's own breadth
//   (near): the gold dusk on the shelves and the wall about the table, which the sill sees as an island of light; the lamp's
//   bounce off the table top is half at the same;
//   the FIRE: half at LIGHT.fire, the distance from the fire to the fender's face: a pool on the hearth and the boards before the
//   fender, a fifth of it and less on any wall (A4); round it a wider glow, a tenth of it (fireTail), half at the rug's middle (fireGlow);
//   floor: the share of bounce that no place is without (the deep brown shade in which shapes are still read);
//   hearth: the fire's glow in the shadows near it, half at the distance of the rug's hearth edge from the fire.
// The MOON's bar and the NIGHT's blue at the window wall are written in the light law's call; the bottle's GREEN with the bottle.
// THE NIGHT: each window's blue is half at NIGHT.reach from its middle (the east light's own breadth); all: the share of it that
// lies on the whole room
const NIGHT = { reach: EWIN.wide, gain: 1.6, all: 0.1 };
// THE OPEN SOUTH LIGHT'S SKY (the part's law): the night sky's own cold light comes in at the open light and lies on the
// seat, the boards, the wall and the globe beside it, half at the light's own breadth from its nearest place. (The moon's bar
// from the east light runs west to the clock's foot: by that window's own place it cannot come to the south-east corner, so
// the globe has the sky's light.) And THE FAR FIRE'S LOW GLOW along the boards: its strength, the distance at which it has
// grown to half (where the rug ends, as far from the hearth as its far edge lies: SKY.far), its reach (the room's breadth)
// and its height (as high as the fender stands from the fire: it skims the boards and the wainscot's foot and leaves the
// table top to the lamp).
// THE MOTH AT THE OPEN SOUTH LIGHT: its home (before the light's middle, over the stone seat) and its reach each way about it:
// inside the light's own breadth, short of the wall, and in the light's lower half where the room looks at it; its lowest
// reach stands 24 m over the line that begins on the seat below it, as high as its whole reach lies ahead of that beginning,
// so from the seat it is overhead and then behind, and no nearer the line than that anywhere
// (size: a great moth of the night, so many times the lamp's small ones)
const WMOTH = { x: (WIN.x0 + WIN.x1) / 2, y: ROUTE[0][1] + 24 + 28, z: WIN.zIn - 24, rx: 30, ry: 28, rz: 10, size: 2.2 };
const SKY = { color: '#6F98E6', gain: 11, reach: WIN.x1 - WIN.x0, low: 0.12, far: RUG.x1 - FIRE[0], band: 1.3, sheen: 0.9 };
const LIGHT = { reach: FLAME[2] - ROOM.z0, near: TABLE.z1 - TABLE.z0, tail: 0.15, fire: FENDER.x - FIRE[0], fireTail: 0.02, fireGlow: RUG.x1 - FIRE[0] - (RUG.x1 - RUG.x0) / 2, floor: 0.2, hearth: 0.03, hearthNear: RUG.x0 - FIRE[0] };

// ---------------------------------------------------------------- THE RULES OF A SHEET for what the seed draws on a chart (all in the sheet's
// own metres). BORDER: the border's inner rule stands 3.4 m inside the edge; STAR: a compass star's ring is 10.8 m in radius.
//   a place on the sheet: drawn anywhere in its box that keeps the thing's half sizes inside the box and passes its test; three
//   hundred draws at most, else none
//   a star: its ring's radius plus 3 m inside the border, and 3 m clear of every foot (x, y, r) of what stands on the paper
//   the wind's face: in the corner that lies furthest from the stars and the feet, blowing toward the sheet's middle
const BORDER = 3.4, STAR = 10.8;
const sheetPlace = (rng, box, hx, hy, ok) => {
  if (box[1] - box[0] < 2 * hx || box[3] - box[2] < 2 * hy) return null;
  for (let t = 0; t < 300; t++) { const x = rng.range(box[0] + hx, box[1] - hx), y = rng.range(box[2] + hy, box[3] - hy); if (ok(x, y)) return [x, y]; }
  return null;
};
const starOn = (rng, box, ring, feet) => sheetPlace(rng, box, ring + BORDER + 3, ring + BORDER + 3, (x, y) => feet.every((f) => Math.hypot(x - f[0], y - f[1]) > ring + f[2] + 3));
const windOn = (size, sc, feet) => {
  let best = [0, 0], far = -1e9; const inset = BORDER + 2 + 6 * sc;
  for (const cx of [0, 1]) for (const cy of [0, 1]) { const x = cx ? size[0] - inset : inset, y = cy ? size[1] - inset : inset; let d = 1e9;
    for (const f of feet) d = Math.min(d, Math.hypot(x - f[0], y - f[1]) - f[2]); if (d > far) { far = d; best = [x, y]; } }
  return [best[0], best[1], Math.atan2(size[1] / 2 - best[1], size[0] / 2 - best[0]), sc];
};
// the wind's face is drawn at a share of its full size (windK metres to a unit): the hanging chart at eight tenths, the working
// chart (crowded with standing things) at six tenths; a wall chart carries none. NO BEAST IS DRAWN ON ANY CHART.
const FIG = { windK: 1.6, hang: 0.8, work: 0.6 };
//   the shoals: THREE OR FOUR SMALL BANKS on a sheet, each a ragged round 4.5 to 7 m in radius, anywhere on the sheet that keeps it
//   2 m inside the border and 2 m clear of the stars, the wind's face and the feet; where the sheet has no room for one, none
const banksOn = (rng, size, feet) => { const out = [], n = rng.int(3, 4);
  // a bank that finds no room at its dealt size is tried again at four fifths and at two thirds of it
  for (let i = 0; i < n; i++) { const r0 = rng.range(3.5, 5.5);
    for (const k of [1, 0.8, 0.66]) { const r = r0 * k, at = sheetPlace(rng, [0, size[0], 0, size[1]], r + BORDER + 2, r + BORDER + 2, (x, y) => feet.every((f) => Math.hypot(x - f[0], y - f[1]) > r + f[2] + 2) && out.every((b) => Math.hypot(x - b[0], y - b[1]) > r + b[2] + 4));
      if (at) { out.push([at[0], at[1], r]); break; } } }
  return out; };

// ---------------------------------------------------------------- surfaces of the room (GLSL for the part's light law)
// floorboards: DARK OLD OAK boards 12 m wide running north-south, waxed (the wax takes the fire as a long orange road and the
// moon as a cold one), dark gaps, staggered ends with two nail heads each
const FLOOR_GLSL = /* glsl */`{
  float bx=vW.x/12.+.5, bi=floor(bx), fxb=fract(bx), hb=h21(vec2(bi,3.7));
  float len=90.+50.*hb, bz=(vW.z+hb*200.)/len, zi=floor(bz), fz=fract(bz);
  float tone=h21(vec2(bi*7.3+zi*3.1,1.9));
  float ex=min(fxb,1.-fxb)*12., ez=min(fz,1.-fz)*len;
  float aa=max(fwidth(vW.x)+fwidth(vW.z),.06);
  float gap=max(1.-smoothstep(.25,.25+aa,ex),1.-smoothstep(.2,.2+aa,ez))*clamp(.6/(.3+aa),0.,1.);
  vec2 g=vec2(vW.x+bi*13.7,vW.z+zi*31.);
  float w=fbm(vec2(g.x*.3,g.y*.03)+tone*20.);
  float far=clamp(aa*1.6,0.,1.);
  float lines=mix(vn(vec2(g.x*2.4+w*5.,g.y*.085)),.5,far), fine=mix(vn(vec2(g.x*10.,g.y*.55)),.5,far);
  vec2 kc=vec2(g.x*.16,g.y*.045); float kn=vn(kc+tone*9.);
  float knot=smoothstep(.83,.93,kn);
  vec3 oak=mix(vec3(.07,.044,.027),vec3(.15,.097,.058),tone*.65+.15);
  alb=oak*mix(.8,1.06,lines)*(.93+.14*fine)*(.82+.36*w)*(1.-.55*knot);
  alb*=.7+.3*smoothstep(.25,1.4,ex);
  vec2 nq=vec2(abs(fxb-.5)*12.-3.2,ez-2.6);
  float nail=1.-smoothstep(.42,.5+aa,length(nq));
  alb=mix(alb,vec3(.04,.036,.032),nail);
  float wear=smoothstep(.3,.8,fbm(vW.xz*.02+3.));
  gloss=mix(.66*(.55+.5*lines)*(.6+.5*wear),.03,gap); gloss=mix(gloss,.55,nail); metal=nail*.5;
  alb*=1.-.93*gap;
  // dust lying in drifts along the gaps and the board ends
  float dust=(1.-smoothstep(.4,2.2,min(ex,ez)))*smoothstep(.42,.66,fbm(vW.xz*.06+11.))*(1.-gap);
  alb=mix(alb,vec3(.17,.15,.125)*(.8+.4*fine),dust*.4); gloss*=1.-.8*dust;
  // relief: the grain stands in ridges, the boards' edges are eased, the nail heads are low domes (heights in metres)
  { float hh=(.05*lines+.02*fine)*(1.-far)+.16*sqrt(max(1.-dot(nq,nq)/.25,0.))-.22*(1.-smoothstep(.25,.9,ex));
    vec3 dpx=dFdx(vW), dpy=dFdy(vW); float hx=dFdx(hh), hy=dFdy(hh);
    vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
    N=normalize((abs(det)+1e-6)*N-sign(det)*(hx*r1+hy*r2)*(1.-far)); }
  // THE FAR FIRE'S LONG WARM SHEEN ON THE WAX: where the eye looks along the boards toward the hearth, the wax gives back the
  // fire's low glow as a long soft road, on every board alike by its own gloss; it is nothing near the hearth and grows fast
  // with the distance as the light comes to skim (half at uSheen.y), dies slowly with the room's breadth (uSheen.z), beats with the fire, and what stands between a
  // board and the fire shades it (the table and its hanging sheet first of all)
  { vec3 Lq=uFirePos+vec3(0.,6.,0.)-vW; float dq=length(Lq); Lq/=max(dq,1e-3);
    float qq=dq*dq/(uSheen.y*uSheen.y), low=qq*qq/(1.+qq*qq)/(1.+dq/uSheen.z);
    emis+=uFireCol*uSheen.x*low*pow(clamp(dot(reflect(-V,N),Lq),0.,1.),uSheen.w)*gloss*fireVis(vW)*lowVis(vW); } }`;
// walls: oak wainscot in framed panels to the dado, umber plaster above. THE PANELS STAND IN REAL RELIEF (D6): every 30 m a stile 6 m
// wide and a top rail stand RELIEF.frame proud of the wall, and in each field between them lies a raised panel RELIEF.field proud
// with a bevel RELIEF.bevel wide, on every wainscoted wall alike; the shader paints the same layout, so paint and relief agree
const RELIEF = { frame: 1.3, field: 0.7, bevel: 3, pitch: 30, stile: 6, y0: 7, y1: ROOM.wain - 4 };
const WALL_GLSL = /* glsl */`{
  float along=abs(vN.x)>.5 ? vW.z : vW.x; float y=vW.y;
  if(y<uWain){
    float px=along/30.+.5, pf=fract(px), pid=floor(px);
    float ex=min(pf,1.-pf)*30., ey=min(y-7.,uWain-4.-y);
    float e=min(ex-3.,ey);
    float bev=smoothstep(0.,1.6,e)*(1.-.0);
    float tone=h21(vec2(pid,along>0.?2.:5.));
    vec2 g=vec2(along+pid*17.,y);
    float gy=e>0. ? g.y : (ex<3. ? g.y : g.x), gx=e>0. ? g.x : (ex<3. ? g.x : g.y);
    float w=fbm(vec2(gx*.3,gy*.03)+tone*9.); float lines=vn(vec2(gx*2.2+w*5.,gy*.08));
    alb=mix(vec3(.05,.031,.021),vec3(.095,.058,.036),tone*.5+.2)*mix(.84,1.05,lines)*(.85+.3*w);
    alb*=mix(.55,1.,smoothstep(0.,.5,abs(e)))*(e>0. ? .78+.22*bev : 1.05);
    gloss=.3*(.6+.5*lines);
    // the shade a frame throws across its field in a flame's raking light: its length is the frame's stand (uRelief) times the
    // slope of the sight to the flame, measured from the stile on the flame's side and from the skirting when the flame is below;
    // the fire's shade and the lamp's, each by its share of the light that reaches the place
    if(e>0.){ float shT=0., wT=0.;
      for(int i=0;i<2;i++){ vec3 fv=(i==0 ? uFirePos : uLampPos)-vW; float rr=i==0 ? uFireR : uLampR;
        float fn=max(abs(dot(fv,vN)),1.), fa=(abs(vN.x)>.5 ? fv.z : fv.x)/fn, fy=fv.y/fn;
        float gap=(fa<0. ? pf : 1.-pf)*30.-3.;
        float sh=1.-smoothstep(0.,.6,gap-min(abs(fa)*uRelief,12.));
        if(fy<0.) sh=max(sh,1.-smoothstep(0.,.6,(y-7.)-min(-fy*uRelief,12.)));
        float w=length(i==0 ? uFireCol : uLampCol)/(1.+dot(fv,fv)/(rr*rr)); shT+=sh*w; wT+=w; }
      alb*=1.-.45*shT/max(wT,1e-4); }
  } else {
    float w=fbm(vec2(along,y)*.03), sp=vn3(vW*.8);
    alb=vec3(.26,.205,.16)*(.8+.35*w)*(.95+.1*sp); gloss=.04;
    alb*=.8+.2*smoothstep(uWain,uWain+14.,y);
  } }`;

export default {
  id: 'study-at-mouse-height',
  name: 'The Study at Mouse Height',
  category: 'domestic',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    // ---------------------------------------------------------------- streams: every dealt thing draws from a stream of its own,
    // made from the world's seed and a name; all taken here, in one list, before any loop runs
    const stream = (label) => ctx.core.makeRng(ctx.core.hashSeed(label + ':' + ctx.seed));
    const R = {
      mood: stream('study-mood'), mothCount: stream('study-moth-count'), draught: stream('study-chart-draught'), charts: stream('study-charts'), chartCourse: stream('study-chart-course'), wallCharts: stream('study-wall-charts'), rolls: stream('study-rolls'), library: stream('study-library'), sand: stream('study-sand'),
      hanging: { stars: stream('study-chart-stars-hanging'), banks: stream('study-chart-banks-hanging') },
      working: { stars: stream('study-chart-stars-working'), banks: stream('study-chart-banks-working') }, rug: stream('study-rug'), fringe: stream('study-fringe'), quill: stream('study-quill'),
      table: { weights: stream('study-table-weights'), folded: stream('study-table-folded'), shaker: stream('study-table-shaker'), pencil: stream('study-table-pencil'), magnifier: stream('study-table-magnifier') },
      floor: { piles: stream('study-floor-piles'), wax: stream('study-floor-wax'), balls: stream('study-floor-balls'), glove: stream('study-floor-glove'),
        spectacles: stream('study-floor-spectacles'), boulder: stream('study-floor-boulder'), slipper: stream('study-floor-slipper'), shield: stream('study-floor-shield') }, books: stream('study-books'), shelf: stream('study-shelf'),
      moth: stream('study-moth'), mothWindow: stream('study-moth-window'), motes: stream('study-motes'), motesMoon: stream('study-motes-moon'), motesGreen: stream('study-motes-green'), motesFire: stream('study-motes-fire'), moon: stream('study-moon'),
      fireCoals: stream('study-fire-coals'), fireSparks: stream('study-fire-sparks'), fireTongues: stream('study-fire-tongues'), sky: stream('study-sky'), curtain: stream('study-curtain'),
      globe: stream('study-globe'), smoke: stream('study-smoke'), clock: stream('study-clock'), windowS: stream('study-window'),
      fly: stream('study-fly'), beetle: stream('study-beetle'), sillKey: stream('study-sill-key'), sillGrit: stream('study-sill-grit'), gnaw: stream('study-gnaw'),
      small: { pins: stream('study-floor-pins'), thimble: stream('study-floor-thimble'), buttons: stream('study-floor-buttons'), key: stream('study-floor-key'), string: stream('study-floor-string'), drips: stream('study-floor-drips'), shells: stream('study-floor-shells'), feather: stream('study-floor-feather') },
    };
    const detail = ctx.quality?.detail ?? 1;
    await ctx.yield();

    // ---------------------------------------------------------------- what the seed changes (never the join)
    // each choice has a stream of its own (dealt anew in r6: there is no draw that nothing reads); it is deep night with the
    // moon on every seed
    const vary = ctx.vary || {};
    const dMood = R.mood(), dMoths = R.mothCount();
    const moon = true;
    // tongues, or a bed of embers
    const fireHigh = (vary.mood ?? dMood) > 0.42;
    // rain on the panes; the curtain breathes deeper
    const rain = vary.rare === true;
    // two moths about the lamp on every night, a third on some (more often where the night is dense)
    const nMoths = dMoths < ((vary.density ?? 1) > 1.08 ? 0.7 : 0.25) ? 3 : 2;
    // the hem's furthest reach into the room
    const breathZ = rain ? 114 : 118;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#04060f');
    scene.fog = new THREE.FogExp2('#0b0c15', 0.0016);

    // ---------------------------------------------------------------- the light law (the part's), with the room's own places
    // THE MOON STANDS LOW IN THE EAST ON EVERY SEED, seen in the east light, and its place is decided by two places of the room:
    // its ray through the middle of the east light (the window's opening, in the middle plane of the wall's thickness) meets the
    // floor at the clock's foot, at a place its own stream chooses: within 8 m east or west of the clock's middle, 4 to 20 m
    // before its face. So the moon's bar lies on the table's top (which shades the boards under it) and, beyond the table's
    // west end, across the north-west of the room: on the boards before the clock, on the clock's case and on the shelves of
    // the corner behind it, a cool light where the fire's and the lamp's do not reach; from the south sill the east light
    // holds stars only, and the moon comes into it as the eye comes onto the table top.
    const winMid = [(EWIN.xIn + EWIN.xOut) / 2, (EWIN.y0 + EWIN.y1) / 2, (EWIN.z0 + EWIN.z1) / 2];
    const moonFloor = [-166 + R.moon.range(-8, 8), 0, NZ - 132 + R.moon.range(4, 20)];
    const moonDir = new V3(winMid[0] - moonFloor[0], winMid[1] - moonFloor[1], winMid[2] - moonFloor[2]).normalize();
    // THE LIGHT IS THE WORLD: it is night and the room is dark. The lamp's pool (gold: half strength LIGHT.reach from the flame, and
    // a faint wider glow), the fire's (orange, low, raking: half at LIGHT.fire), the moon's bar, a cold spill at the window wall
    // and the bottle's green; of bounce only a deep warm umber, so that the hollows between the pools are shade and never black.
    await ctx.yield();
    const lib = makeLib({
      lamp: FLAME, lampColor: '#FFC673', lampGain: 2.6, lampReach: LIGHT.reach, lampFar: LIGHT.tail, lampFarReach: LIGHT.near, fireFarReach: LIGHT.fireGlow, bounceNear: LIGHT.near, bounceFloor: LIGHT.floor, fireBounce: LIGHT.hearth, fireNear: LIGHT.hearthNear,
      fire: FIRE, fireColor: '#FF9A4A', fireGain: fireHigh ? 12 : 10, fireReach: LIGHT.fire, fireFar: LIGHT.fireTail, fireBreath: fireHigh ? 0 : 0.2,
      table: [TABLE.x0, TABLE.x1, TABLE.z0, TABLE.z1], tableY: TABLE.y,
      fender: [FENDER.x, FENDER.z0, FENDER.z1, FENDER.h], mantel: [MANTEL.x, MANTEL.y, MANTEL.z0, MANTEL.z1], sheet: [SHEET.xFoot, SHEET.xEdge, SHEET.z0, SHEET.z1],
      win: [EWIN.z0, EWIN.z1, EWIN.y0, EWIN.y1], winX: [EWIN.xIn, EWIN.xOut], winE: winMid, winS: [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, (WIN.zIn + WIN.zOut) / 2], nightReach: NIGHT.reach,
      hemiSky: '#A08878', hemiGround: '#4A3A30', bounce: 1,
      night: '#27407C', nightGain: NIGHT.gain, nightAll: NIGHT.all,
      moonDir: [moonDir.x, moonDir.y, moonDir.z], moonColor: '#86AEEA', moonGain: 2.8, rain,
      greenA: [BOTTLE.x + AXIS[0] * 3 * GROW, BOTTLE.y, BOTTLE.z + AXIS[1] * 3 * GROW], greenB: [BOTTLE.x + AXIS[0] * (BOTTLE.len - 14.3 * GROW), BOTTLE.y, BOTTLE.z + AXIS[1] * (BOTTLE.len - 14.3 * GROW)], greenReach: BOTTLE.body,
      greenBase: [BOTTLE.x, BOTTLE.y, BOTTLE.z], greenAxis: [AXIS[0], 0, AXIS[1]], greenFan: [GREEN.reach, GREEN.spread, RING, GREEN.gain],
      airLamp: 0.09, airFire: 0.08, airSoft: 16,
      sky: [WIN.x0, WIN.x1, WIN.y0, WIN.y1], skyZ: [WIN.zIn, WIN.zOut], skyColor: SKY.color, skyGain: SKY.gain, skyReach: SKY.reach,
      globe: [GLOBE.x, GLOBE.y, GLOBE.z, GLOBE.r], globePost: [GLOBE.x, GLOBE.z, GLOBE.post[0], GLOBE.post[1]],
      fireLow: [SKY.low, SKY.far, ROOM.x1 - ROOM.x0, LIGHT.fire],
    });
    await ctx.yield();
    const solid = (hex, surface, o = {}) => lib.mat({ ...o, uniforms: { uCol: { value: lin3(hex) }, ...(o.uniforms || {}) }, pars: 'uniform vec3 uCol;' + (o.pars || ''), surface: 'alb*=uCol;' + (surface || '') });
    const woodU = (grain = 0.5, gl = 0.4) => ({ uGrain: { value: grain }, uWoodGloss: { value: gl } });
    const woodMat = lib.mat({ name: 'wood', vertexColors: true, grain: true, pars: WOOD_PARS, uniforms: woodU(0.5, 0.42), surface: SURF.wood });
    const brassMat = lib.mat({ name: 'brass', vertexColors: true, grain: true, surface: SURF.brass });
    const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; scene.add(m); return m; };

    await ctx.yield();
    // ---------------------------------------------------------------- the route (entry at the sill, level; exit at the bottle's base, level)
    const path = makePath(ROUTE), L = path.length;
    await ctx.yield();
    const _p = new V3();
    // distance from a point to the flown line, tested at every 2 m of route
    const lineS = []; for (let d = 0; d <= L; d += 2) { if (d % 100 === 98) await ctx.yield(); path.posAtDist(d, _p); lineS.push(_p.x, _p.y, _p.z); }
    const offLine = (x, y, z) => { let best = 1e9; for (let k = 0; k < lineS.length; k += 3) { const e = (lineS[k] - x) ** 2 + (lineS[k + 1] - y) ** 2 + (lineS[k + 2] - z) ** 2; if (e < best) best = e; } return Math.sqrt(best); };
    await ctx.yield();
    // metres flown at the route's nearest point to a place of the room (the nearest of those samples, then to the half metre round it)
    const flownAt = (x, y, z) => { let best = 1e9, bk = 0; for (let k = 0; k < lineS.length; k += 3) { const e = (lineS[k] - x) ** 2 + (lineS[k + 1] - y) ** 2 + (lineS[k + 2] - z) ** 2; if (e < best) { best = e; bk = k; } }
      let bd = bk / 3 * 2; best = 1e9; for (let d = Math.max(0, bk / 3 * 2 - 2); d <= Math.min(L, bk / 3 * 2 + 2); d += 0.5) { path.posAtDist(d, _p); const e = (_p.x - x) ** 2 + (_p.y - y) ** 2 + (_p.z - z) ** 2; if (e < best) { best = e; bd = d; } } return bd; };
    await ctx.yield();
    // metres flown at each place where a piece of the plan begins (LAID.marks), and at the crest
    const AT = LAID.marks.map((q) => flownAt(q[0], q[1], q[2]));
    const dCrest = flownAt(LAID.crest[0], LAID.crest[1], LAID.crest[2]), dFire = AT[MARK.run];
    await ctx.yield();
    // THE PACE GOES BY THE LINE'S BEND AND BY NOTHING ELSE (the bend as an eye that follows the line turns in it: the heading's
    // turn and the pitch's, so a turn that sinks or climbs counts by its heading). EVERY TURN IS FLOWN AT ONE RATE, PACE.turn
    // degrees a second, and the straights at the full speed: the speed's share at a place is the bend's radius there over the
    // radius that the full speed turns at that rate (found by stepping: the full speed is what the whole line needs to be
    // flown in PACE.seconds, and it depends on that radius in its turn). The share at a place
    // is the least within PACE.before metres ahead of it and one place's spacing behind it (the engine draws the pace
    // straight from place to place); a bend more than PACE.lag metres ahead counts for less by the way still to go to it, 1 +
    // PACE.early times its share at PACE.before metres (the gaze rests on the line that far ahead and turns into the bend little by little). The engine reads the pace at PACE.places even places and comes to a new speed at the rate
    // PACE.ease a second: so each place is given its share and, on top, the share's change along the line times the
    // speed flown there over that rate, where the share falls (the speed is taken off early by as much as the engine lags;
    // it is given back only where the bend has ended). Between two bends less than PACE.short apart the speed is not raised.
    // PACE.top: the full speed as written (the engine sets the mean itself); PACE.floor: the least it reads. PACE.brake: how
    // much of that early taking-off is asked for (an eighth over: we may come in faster than this world flies).
    // PACE.seconds: the whole flight's time (the world's duration is this same number).
    const PACE = { turn: 20, least: 0.1, before: 34, lag: 17, early: 1, brake: 1.12, most: 1, places: 64, ease: 1.4, short: 40, top: 2.5, floor: 0.35, seconds: 50 };
    const pace = (() => { const n = PACE.places, dd = L / n, rad = [], tab = [], a = new V3(), b = new V3();
      for (let d = 0; d <= L; d += 2) { path.tangentAtDist(Math.max(0, d - 6), a); path.tangentAtDist(Math.min(L, d + 6), b);
        let yaw = Math.atan2(b.x, -b.z) - Math.atan2(a.x, -a.z); if (yaw > PI) yaw -= TAU; if (yaw < -PI) yaw += TAU;
        const ang = Math.hypot(yaw, Math.asin(clamp(b.y, -1, 1)) - Math.asin(clamp(a.y, -1, 1))); rad.push(ang > 1e-4 ? 12 / ang : 1e6); }
      // the shares, and the speed in metres a second that a share of 1 stands for, where the full speed turns on the radius wide
      const shares = (wide) => { const sh = [];
        for (let i = 0; i <= n; i++) { let v = 1; for (let d = (i - 1) * dd; d <= i * dd + PACE.before; d += 2) v = Math.min(v, clamp(rad[clamp(Math.round(d / 2), 0, rad.length - 1)] / wide, PACE.least, PACE.most) * (1 + PACE.early * Math.max(0, d - i * dd - PACE.lag) / (PACE.before - PACE.lag))); sh.push(v); }
        const k = Math.round(PACE.short / 2 / dd), lo = (i0, i1) => { let v = 1; for (let i = i0; i <= i1; i++) v = Math.min(v, sh[clamp(i, 0, n)]); return v; };
        const cut = sh.map((v, i) => Math.min(v, Math.max(lo(i - k, i), lo(i, i + k))));
        let inv = 0; for (let i = 0; i < n; i++) inv += 2 * dd / (cut[i] + cut[i + 1]);
        return { sh: cut, full: inv / PACE.seconds }; };
      let got = shares(60); for (let i = 0; i < 12; i++) got = shares(got.full / (PACE.turn * PI / 180));
      const sh = got.sh, full = got.full;
      for (let i = 0; i <= n; i++) { const slope = (sh[Math.min(n, i + 1)] - sh[Math.max(0, i - 1)]) / ((Math.min(n, i + 1) - Math.max(0, i - 1)) * dd);
        tab.push(Math.max(PACE.floor, PACE.top * sh[i] * (1 + PACE.brake * full * Math.min(0, slope) / PACE.ease))); }
      return (u) => { const x = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); }; })();
    await ctx.yield();
    // EVERY SIGHT FROM THE LINE TO THE OPENING: the cones from the line's points between the beginning of the round's second bend and the
    // base (one every 2 m) to the base ring plus 1 m; a thing stands in a cone if its top is higher than the cone's underside
    // where it stands
    const coneClear = (() => {
      const eyes = []; for (let d = AT[MARK.home]; d < L - 1; d += 2) { path.posAtDist(d, _p); eyes.push(_p.x, _p.y - TABLE.y, _p.z); }
      const hB = BOTTLE.y - TABLE.y;
      return (x, z, r, h) => {
        for (let k = 0; k < eyes.length; k += 3) {
          const ex = eyes[k], eh = eyes[k + 1], ez = eyes[k + 2], dx = BOTTLE.x - ex, dz = BOTTLE.z - ez, len = Math.hypot(dx, dz);
          const t = clamp(((x - ex) * dx + (z - ez) * dz) / (len * len), 0, 1), off = Math.max(0, Math.hypot(ex + dx * t - x, ez + dz * t - z) - r), rad = RING * t;
          if (off < rad && h > eh + (hB - eh) * t - Math.sqrt(rad * rad - off * off)) return false;
        }
        return true;
      };
    })();
    await ctx.yield();
    // the line's track over the table, in plan (its samples every 2 m), and a place's distance from it
    const track = []; for (let k = 0; k < lineS.length; k += 3) if (lineS[k] > TABLE.x0 - 8) track.push(lineS[k], lineS[k + 2]);
    const offTrack = (x, z) => { let best = 1e9; for (let k = 0; k < track.length; k += 2) best = Math.min(best, Math.hypot(track[k] - x, track[k + 1] - z)); return best; };
    // THE INKWELL in its tray, with its pen: on the hanging chart's table end, its tray 2 m inside the sheet's east end, and as near
    // the line as two rules of the table allow (found by walking north from the line in half metres): its tray 6 m and more
    // from the line's track, and tray and pen (15 m tall, a metre round them) outside every sight from the line to the opening
    const INK = (() => { const x = SHEET.xTop - 2 - TRAY;
      for (let z = JOIN.crest[2] - 6 - TRAY; z > TABLE.z0 + 2 * TRAY; z -= 0.5) if (offTrack(x, z) >= 6 + TRAY && coneClear(x, z, TRAY + 1.3, 15)) return { x, z, tray: TRAY };
      return { x, z: TABLE.z0 + 2 * TRAY, tray: TRAY }; })();
    // THE CHART MAKER'S THINGS AT THE TABLE'S BACK, each by the table's own measures. THE MUG (3.6 m in radius) stands in the
    // working chart's north-west corner, the width of the lamp's font inside each border: its steam rises before the dark
    // wainscot. Between the mug and the pipe, a quarter of the table's depth before its back edge, stand THE SAND GLASS (a third
    // of the way from the mug to the pipe: 18 m tall, its sand falling) and THE DIVIDERS (two thirds of the way: legs 20 m,
    // their points 12 m apart north and south, the hinge 19 m over the chart, an arch of steel): the lamp stands beyond them
    // and throws their long shadows toward the line; none of them stands before the bottle from the crest or the crossing.
    const MUG = { x: CHART.x0 + 2 * LAMP.font, z: CHART.z0 + 2 * LAMP.font }, ROW = TABLE.z0 + (TABLE.z1 - TABLE.z0) / 4;
    const SAND = { x: MUG.x + (PIPE.x - MUG.x) / 3, z: ROW, r: 5.4, h: 18.4 };
    const DIV = { at: [MUG.x + (PIPE.x - MUG.x) * 2 / 3, TABLE.y, ROW], heading: [1, 0], across: [0, 1], half: 6, leg: 20, hinge: Math.sqrt(400 - 36) };
    await ctx.yield();

    // ---------------------------------------------------------------- the shell: floor, walls, ceiling and beams
    const DEEP = ROOM.z1 - ROOM.z0, ZM = (ROOM.z0 + ROOM.z1) / 2;
    const floorG = new THREE.PlaneGeometry(400, DEEP); floorG.rotateX(-PI / 2); floorG.translate(0, 0, ZM);
    const floorMat = lib.mat({ name: 'floor', occF: true, surface: FLOOR_GLSL, pars: 'uniform vec4 uSheen;', uniforms: { uSheen: { value: new THREE.Vector4(SKY.sheen, SKY.far, ROOM.x1 - ROOM.x0, 5) } } });
    mesh(floorG, floorMat, 'floor');
    const wallMat = lib.mat({ name: 'wall', occF: true, uniforms: { uWain: { value: ROOM.wain }, uRelief: { value: RELIEF.frame - RELIEF.field } }, pars: 'uniform float uWain, uRelief;', surface: WALL_GLSL });
    const plasterMat = solid('#5a4a3d', SURF.plaster, { name: 'plaster' });
    const stoneMat = lib.mat({ name: 'stone', vertexColors: true, surface: SURF.stone });
    {
      const wb = makeBuilder(), H = ROOM.h;
      const quad = (w, h, m) => wb.add(new THREE.PlaneGeometry(w, h), m);
      // north wall, facing south
      quad(400, H, M4(0, H / 2, ROOM.z0, 0, 0, 0));
      // east wall, facing west
      // (a wall 24 m thick round the east light, as the window wall is)
      const ew = (za, zb, ya, yb) => wb.add(box(24, yb - ya, zb - za), M4(ROOM.x1 + 12, (ya + yb) / 2, (za + zb) / 2));
      ew(ROOM.z0, ROOM.z1, 0, EWIN.y0); ew(ROOM.z0, ROOM.z1, EWIN.y1, H); ew(ROOM.z0, EWIN.z0, EWIN.y0, EWIN.y1); ew(EWIN.z1, ROOM.z1, EWIN.y0, EWIN.y1);
      // west wall round the hearth's opening (z -70..20, to y 80)
      quad(-70 - ROOM.z0, H, M4(ROOM.x0, H / 2, (ROOM.z0 - 70) / 2, 0, PI / 2, 0)); quad(140, H, M4(ROOM.x0, H / 2, 90, 0, PI / 2, 0)); quad(90, H - 80, M4(ROOM.x0, 80 + (H - 80) / 2, -25, 0, PI / 2, 0));
      // window wall (z 160..184) round its two lights
      const sw = (xa, xb, ya, yb) => wb.add(box(xb - xa, yb - ya, 24), M4((xa + xb) / 2, (ya + yb) / 2, 172));
      sw(-200, 200, 0, WIN.y0); sw(-200, 200, WIN.y1, H); sw(-200, WIN.wx0, WIN.y0, WIN.y1); sw(WIN.wx1, WIN.x0, WIN.y0, WIN.y1); sw(WIN.x1, 200, WIN.y0, WIN.y1);
      mesh(wb.build(), wallMat, 'walls');
      await ctx.yield();
      // the wainscot's relief, by one rule on the north, east and west walls: `to` places a piece by its place along the wall
      {
        const rb = makeBuilder(), Q = RELIEF, mid = (Q.y0 + Q.y1) / 2, tall = Q.y1 - Q.y0;
        // a raised field: a low frustum, flat faces
        const fieldGeo = (w, h) => { const a = w / 2, b = h / 2, c = a - Q.bevel, d = b - Q.bevel, z = Q.field, o = [[-a, -b, 0], [a, -b, 0], [a, b, 0], [-a, b, 0]], i = [[-c, -d, z], [c, -d, z], [c, d, z], [-c, d, z]], P = [];
          const quad4 = (p, q, r, t) => P.push(...p, ...q, ...r, ...p, ...r, ...t);
          quad4(i[0], i[1], i[2], i[3]); for (let k = 0; k < 4; k++) quad4(o[k], o[(k + 1) % 4], i[(k + 1) % 4], i[k]);
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g; };
        const run = (a0, a1, to) => {
          rb.add(box(a1 - a0, ROOM.wain - 0.5 - Q.y1, Q.frame), to((a0 + a1) / 2, (Q.y1 + ROOM.wain - 0.5) / 2, Q.frame / 2));
          for (let k = Math.ceil((a0 + Q.pitch / 2) / Q.pitch) - 1; k * Q.pitch - Q.pitch / 2 < a1; k++) { const c = k * Q.pitch - Q.pitch / 2;
            const s0 = Math.max(c - Q.stile / 2, a0), s1 = Math.min(c + Q.stile / 2, a1); if (s1 - s0 > 0.5) rb.add(box(s1 - s0, tall, Q.frame), to((s0 + s1) / 2, mid, Q.frame / 2));
            const f0 = Math.max(c + Q.stile / 2, a0) + 2, f1 = Math.min(c + Q.pitch - Q.stile / 2, a1) - 2; if (f1 - f0 > 3 * Q.bevel) rb.add(fieldGeo(f1 - f0, tall - 4), to((f0 + f1) / 2, mid, 0)); }
        };
        run(ROOM.x0, ROOM.x1, (a, y, d) => M4(a, y, ROOM.z0 + d));
        await ctx.yield();
        run(ROOM.z0, ROOM.z1, (a, y, d) => M4(ROOM.x1 - d, y, a, 0, -PI / 2, 0));
        await ctx.yield();
        run(ROOM.z0, -70, (a, y, d) => M4(ROOM.x0 + d, y, a, 0, PI / 2, 0)); run(20, ROOM.z1, (a, y, d) => M4(ROOM.x0 + d, y, a, 0, PI / 2, 0));
        mesh(rb.build(), wallMat, 'wainscot');
      }
      await ctx.yield();
      const cg = new THREE.PlaneGeometry(400, DEEP); cg.rotateX(PI / 2); cg.translate(0, H, ZM);
      mesh(cg, plasterMat, 'ceiling');
      const bm = makeBuilder();
      for (let z = 140; z > ROOM.z0 + 12; z -= 40) bm.add(box(400, 10, 8), M4(0, H - 5, z), '#7a5a3c', { g: 'x' });
      // skirting and dado rail on the three plain walls
      // THE GNAWED HOLE (D6): in the north skirting, in the open run between the clock's plinth and the hanging chart's foot, at a place the seed deals
      // within 8 m of the middle of that run: an arch 6 m wide gnawed through the board, its edge raw and toothed, black behind,
      // chips of the board on the floor before it. EMPTY: nothing lives in it and nothing ever comes out
      const GN = { half: 6, w: 3, h: 5.6, x: (-166 + 21.5 + SHEET.xFlat) / 2 + R.gnaw.range(-8, 8) };
      {
        const g = R.gnaw, sh = new THREE.Shape(), n = 16; sh.moveTo(-GN.half, 0); sh.lineTo(-GN.w, 0);
        for (let i = 1; i < n; i++) { const a = PI * (1 - i / n), k = 1 + g.range(-0.09, 0.09); sh.lineTo(GN.w * Math.cos(a) * k, GN.h * Math.pow(Math.sin(a), 0.8) * k); }
        sh.lineTo(GN.w, 0); sh.lineTo(GN.half, 0); sh.lineTo(GN.half, 7); sh.lineTo(-GN.half, 7);
        const raw = (px, py) => (Math.abs(px) < GN.w * 1.12 && py < GN.h * 1.12 ? 3.2 : 1);
        bm.add(new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }), M4(GN.x, 0, ROOM.z0), '#3d2414', { g: 'x', shade: raw });
        const dark = new THREE.PlaneGeometry(2 * GN.w + 1, GN.h + 0.6); dark.translate(GN.x, (GN.h + 0.6) / 2, ROOM.z0 + 0.05);
        mesh(dark, lib.mat({ name: 'gnawed-dark', surface: 'alb=vec3(.003);gloss=0.;' }), 'gnawed-hole');
        for (let i = 0; i < 16; i++) { const r = 1 + 5 * Math.sqrt(g()), a = g.range(0.15, PI - 0.15), l = g.range(0.35, 0.9);
          bm.add(box(l, 0.07, l * g.range(0.25, 0.5)), M4(GN.x + r * Math.cos(a), 0.04, ROOM.z0 + 1.8 + r * Math.sin(a), 0, g.range(0, PI), g.range(-0.2, 0.2)), '#b08a55', { g: 'x' }); }
      }
      await ctx.yield();
      for (const [y, hh, d, c] of [[3.5, 7, 1.6, '#3d2414'], [81, 3, 2.4, '#4a2c18']]) {
        if (hh === 7) for (const [a, b] of [[ROOM.x0, GN.x - GN.half], [GN.x + GN.half, ROOM.x1]]) bm.add(box(b - a, hh, d), M4((a + b) / 2, y, ROOM.z0 + d / 2), c, { g: 'x' });
        else bm.add(box(400, hh, d), M4(0, y, ROOM.z0 + d / 2), c, { g: 'x' });
        bm.add(box(400, hh, d), M4(0, y, ROOM.z1 - d / 2), c, { g: 'x' });
        bm.add(box(d, hh, DEEP), M4(ROOM.x1 - d / 2, y, ZM), c, { g: 'z' });
        bm.add(box(d, hh, -70 - ROOM.z0), M4(ROOM.x0 + d / 2, y, (ROOM.z0 - 70) / 2), c, { g: 'z' }); bm.add(box(d, hh, 140), M4(ROOM.x0 + d / 2, y, 90), c, { g: 'z' });
      }
      mesh(bm.build(), woodMat, 'beams');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the hero: the lamp and the bottle on the chart (the part), turned so
    // that its front (+Z, out of the bottle's base) lies back along the route's last straight and seated under the centre of the base
    // ring. THE BOTTLE LIES ASLANT: its base to the south-west, toward the room, its cork toward the table's north-east corner.
    const tick = [];
    // static brass, iron and stone of the whole room are gathered here and built once at the end
    const WD = makeBuilder(), BR = makeBuilder(), IR = makeBuilder(), ST = makeBuilder(), PP = makeBuilder(), BK = makeBuilder(), PB = makeBuilder(), dealt = [], BRASS = '#C9A04A';
    const weightGeo = () => lathe([[0, 0], [2.5, 0], [2.65, 0.3], [2.65, 1.7], [2.2, 2.1], [0.9, 2.3], [0.7, 2.9], [1.15, 3.4], [0.95, 3.8], [0, 3.9]], 28);
    // the lamp's place in the part's own frame, from the room's measures: so far to the side of the bottle's axis (the part's -x
    // is the lamp's side) and so far before the base plane (the part's +z)
    const lampRel = [FLAME[0] - BOTTLE.x, FLAME[2] - BOTTLE.z];
    const hero = await buildHero(ctx, { lib, greenGain: 1.7, palette: { brass: '#C9A04A' }, length: BOTTLE.len / GROW, grow: GROW, paper: [CHART.x0, CHART.x1, CHART.z0, CHART.z1],
      lampAt: [lampRel[0] * ACROSS[0] + lampRel[1] * ACROSS[1], -(lampRel[0] * AXIS[0] + lampRel[1] * AXIS[1])] });
    hero.object.rotation.y = Math.atan2(-AXIS[0], -AXIS[1]); hero.object.position.set(BOTTLE.x, TABLE.y, BOTTLE.z);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    {
      // the lamp must stand where the room's light law has it
      const f = hero.anchors.flame.clone().applyMatrix4(hero.object.matrixWorld);
      if (Math.abs(f.x - FLAME[0]) + Math.abs(f.y - FLAME[1]) + Math.abs(f.z - FLAME[2]) > 0.01) console.error('study: the part\'s flame stands at ' + f.toArray().join(',') + ', the room has it at ' + FLAME.join(','));
      // what stands on the table between the lamp and the chart: the bottle in its cradle (posts along its axis: body, shoulder, neck)
      // and the cork under its wax, which is no glass: its part of the bottle's light on the chart is dark
      // (stations at the first size: three on the body, the shoulder, the neck, the cork; all GROW times that)
      { const U = BOTTLE.len / GROW, sh0 = U - 14.3, nk = U - 8.2;
        for (const [a, r, top] of [[3, 5.6, 13.4], [(3 + sh0) / 2, 5.6, 13.4], [sh0, 5.6, 13.4], [sh0 + 4.3, 4.6, 12.6], [nk + 3.2, 2.2, 10], [U + 1.6, 1.9, 9.8]]) lib.addOccL(BOTTLE.x + AXIS[0] * a * GROW, BOTTLE.z + AXIS[1] * a * GROW, r * GROW, TABLE.y + top * GROW); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the chart table against the north wall, and the stool before it
    {
      const b = makeBuilder(), T = TABLE, oak = '#8a5a34', oakD = '#74482a';
      const cx = (T.x0 + T.x1) / 2, cz = (T.z0 + T.z1) / 2, w = T.x1 - T.x0, d = T.z1 - T.z0;
      b.add(box(w, 2.2, d), M4(cx, T.y - 1.1, cz), oak, { g: 'x' });
      b.add(box(w - 1.2, 0.8, d - 1.2), M4(cx, T.y - 2.6, cz), oakD, { g: 'x' });
      // the top's rounded edge: a half-round moulding all the way round
      for (const [x, z, len, ry] of [[cx, T.z1, w, PI / 2], [cx, T.z0, w, PI / 2], [T.x0, cz, d, 0], [T.x1, cz, d, 0]]) b.add(cyl(1.1, 1.1, len, 12), M4(x, T.y - 1.1, z, PI / 2, 0, ry === 0 ? 0 : PI / 2), oak);
      // apron with two drawer fronts on the south side
      const ay = T.y - 3 - 4;
      b.add(box(w - 10, 8, 2), M4(cx, ay, T.z1 - 4), oakD, { g: 'x' }); b.add(box(w - 10, 8, 2), M4(cx, ay, T.z0 + 4), oakD, { g: 'x' });
      b.add(box(2, 8, d - 10), M4(T.x0 + 4, ay, cz), oakD, { g: 'z' }); b.add(box(2, 8, d - 10), M4(T.x1 - 4, ay, cz), oakD, { g: 'z' });
      for (const dx of [-34, 34]) { b.add(box(52, 5.6, 0.7), M4(cx + dx, ay, T.z1 - 2.8), oak, { g: 'x' }); }
      // four turned legs 7 m thick
      const leg = [[3.5, 49], [3.5, 40], [3.1, 39.4], [2.5, 38.6], [3.2, 37.6], [3.3, 36.8], [2.4, 35.8], [2.2, 34], [2.9, 28], [3.2, 22], [2.9, 15], [2.2, 10], [2.0, 8.6], [2.9, 7.6], [3.1, 6.6], [2.3, 5.6], [2.1, 4.4], [2.8, 3], [2.9, 1.2], [2.4, 0]].reverse();
      for (const [x, z] of [[T.x0 + 8, T.z0 + 8], [T.x0 + 8, T.z1 - 8], [T.x1 - 8, T.z0 + 8], [T.x1 - 8, T.z1 - 8]]) { b.add(lathe(leg, 40), M4(x, 0, z), oakD); b.add(box(7.4, 9.5, 7.4), M4(x, 44.6, z), oakD); }
      lib.addOccF(T.x0 + 8, T.z0 + 8, 3.3, 49); lib.addOccF(T.x0 + 8, T.z1 - 8, 3.3, 49);
      // the stool: a dished round seat on three splayed legs (STOOL)
      const sx = STOOL.x, sz = STOOL.z;
      b.add(lathe([[0, 41.4], [9, 41.2], [13, 41.8], [14, 43], [14, 44], [13, 44.6], [9, 44.1], [0, 43.7]], 48), M4(sx, 0, sz), oak);
      for (let i = 0; i < 3; i++) {
        const a = i * TAU / 3 + 0.5, top = new V3(sx + Math.cos(a) * 8, 42, sz + Math.sin(a) * 8), foot = new V3(sx + Math.cos(a) * 15, 0, sz + Math.sin(a) * 15);
        const mid = top.clone().add(foot).multiplyScalar(0.5), dir = foot.clone().sub(top), len = dir.length();
        const m = new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(new V3(0, -1, 0), dir.normalize()), new V3(1, 1, 1));
        b.add(lathe([[1.4, -len / 2], [1.9, -len * 0.3], [2.3, -len * 0.05], [1.9, len * 0.2], [2.4, len * 0.3], [1.8, len * 0.42], [2.1, len / 2]], 20), m, oakD);
      }
      mesh(b.build(), woodMat, 'table-and-stool');
      // brass drawer knobs
      for (const dx of [-34, 34]) for (const kx of [-14, 14]) BR.add(lathe([[0, 0], [0.9, 0], [0.6, 0.8], [1.3, 1.6], [1.1, 2.3], [0, 2.6]], 20), M4(cx + dx + kx, ay, T.z1 - 2.4, PI / 2, 0, 0), BRASS);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- THE LIBRARY (A1): above the wainscot's rail the north, east and west
    // walls are SHELVES OF BOOKS to the ceiling, by one rule on every wall alike: a board every SHELF.pitch metres from the rail
    // up, an upright every SHELF.bay metres along the wall, all SHELF.deep metres deep. A wall's holes (from, to along the wall,
    // top): where a thing of the wall stands (the clock, the three old shelves over the table, the east light, the door, the
    // chimney breast) no shelf stands below its top. The books: plain spines in deep oxblood, ink blue, ochre, vellum cream, plum
    // and black brown (NO GREEN: green is the bottle's), each with its own gilt bands, some standing in sets of one binding, a
    // few leaning, gaps here and there; every book from the library's own stream.
    const SHELVES = [
      { a0: ROOM.x0, a1: ROOM.x1, at: (a, y, d) => M4(a, y, ROOM.z0 + d), holes: [[-188, -144, 180], [-32, 152, 200]] },
      { a0: ROOM.z0 + SHELF.deep, a1: ROOM.z1, at: (a, y, d) => M4(ROOM.x1 - d, y, a, 0, -PI / 2, 0), holes: [[EWIN.z0 - 4, EWIN.z1 + 4, EWIN.y1 + 8], [22, 108, 180]] },
      { a0: ROOM.z0 + SHELF.deep, a1: ROOM.z1, at: (a, y, d) => M4(ROOM.x0 + d, y, a, 0, PI / 2, 0), holes: [[MANTEL.z0 - 4, MANTEL.z1 + 4, ROOM.h]] },
    ];
    {
      const lr = R.library, Q = SHELF, wal = '#2c1b12', walD = '#20130c', mats = [], cols = [], phs = [];
      const hues = ['#5a1612', '#6e1d16', '#1d2a4a', '#243556', '#9a7226', '#cdbf9a', '#4a2238', '#2a1a12', '#3a2416'];
      const tiers = []; for (let y = Q.y0; y + Q.pitch <= ROOM.h - 4; y += Q.pitch) tiers.push(y);
      const yTop = tiers[tiers.length - 1] + Q.pitch, col = new THREE.Color();
      for (const W of SHELVES) {
        for (const yb of tiers) {
          // the free runs of this tier: the wall's length less its holes that reach above the tier's board
          let runs = [[W.a0, W.a1]];
          for (const h of W.holes) if (h[2] > yb) runs = runs.flatMap(([a, b]) => (h[1] <= a || h[0] >= b ? [[a, b]] : [[a, Math.min(b, h[0])], [Math.max(a, h[1]), b]].filter((r) => r[1] - r[0] > 6)));
          for (const [a, b] of runs) {
            WD.add(box(b - a, Q.board, Q.deep), W.at((a + b) / 2, yb + Q.board / 2, Q.deep / 2), wal, { g: 'x' });
            const ups = [a + 0.8]; for (let u = Math.ceil((a + 8) / Q.bay) * Q.bay; u < b - 8; u += Q.bay) ups.push(u); ups.push(b - 0.8);
            for (const u of ups) WD.add(box(1.6, Q.pitch - Q.board, Q.deep - 0.6), W.at(u, yb + Q.board + (Q.pitch - Q.board) / 2, (Q.deep - 0.6) / 2), walD);
            // the books of this run, between its uprights
            for (let k = 0; k + 1 < ups.length; k++) {
              let x = ups[k] + 1.1 + lr.range(0, 0.6), set = 0, sw = 0, sh = 0, sc = 0;
              const end = ups[k + 1] - 1.1;
              while (x < end - 2.4) {
                if (lr.chance(0.05)) { x += lr.range(2.5, 8); set = 0; continue; }
                if (set <= 0 && lr.chance(0.28)) { set = lr.int(3, 9); sw = lr.range(3, 5.6); sh = lr.range(17, 25.5); sc = lr.int(0, hues.length - 1); }
                const inSet = set > 0, w = Math.min(inSet ? sw : lr.range(2.4, 7), end - x), h = inSet ? sh : lr.range(13, 26.5), d = lr.range(10, 13.6);
                const lean = !inSet && lr.chance(0.12) ? lr.range(0.06, 0.2) * (lr.chance(0.5) ? 1 : -1) : 0, reach = Math.sin(Math.abs(lean)) * h;
                col.set(inSet ? hues[sc] : lr.pick(hues)).multiplyScalar(lr.range(0.7, 1.2));
                mats.push(W.at(x + w / 2 + (lean > 0 ? 0 : reach), yb + Q.board + h / 2 * Math.cos(lean), Q.deep - 1.2 - d / 2 - lr.range(0, 1.2)).multiply(M4(0, 0, 0, 0, 0, lean, w, h, d)));
                cols.push(col.r, col.g, col.b); phs.push(lr());
                x += w + 0.12 + reach; set--;
              }
            }
          }
          await ctx.yield();
        }
        // the top board and the cornice over it, the wall's whole length less the holes that reach the ceiling
        let runs = [[W.a0, W.a1]];
        for (const h of W.holes) if (h[2] >= ROOM.h) runs = runs.flatMap(([a, b]) => (h[1] <= a || h[0] >= b ? [[a, b]] : [[a, h[0]], [h[1], b]]));
        for (const [a, b] of runs) { WD.add(box(b - a, Q.board, Q.deep), W.at((a + b) / 2, yTop + Q.board / 2, Q.deep / 2), wal, { g: 'x' }); WD.add(box(b - a, ROOM.h - yTop - Q.board, Q.deep + 1.5), W.at((a + b) / 2, (yTop + Q.board + ROOM.h) / 2, (Q.deep + 1.5) / 2), walD, { g: 'x' }); }
      }
      await ctx.yield();
      const n = phs.length, bg = box(1, 1, 1);
      bg.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(phs), 1));
      const libMat = lib.mat({ name: 'library-books', vpars: 'attribute float aPh; varying float vPh; varying vec3 vT;', pars: 'varying float vPh; varying vec3 vT;',
        vworld: 'vPh=aPh; vT=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*vec3(1.,0.,0.));',
        surface: /* glsl */`{ float spine=step(.49,vG.z), v=vG.y+.5, hs=fract(vPh*7.31), sp=vn3(vW*1.1);
          float band=(1.-smoothstep(0.,.012,abs(v-.87)-.012))+(1.-smoothstep(0.,.01,abs(v-.11)-.01))
            +(1.-smoothstep(0.,.008,abs(v-(.58+.2*hs))-.006))*step(.3,hs)+(1.-smoothstep(0.,.008,abs(v-(.3+.12*hs))-.006))*step(.62,hs);
          band=spine*clamp(band,0.,1.);
          alb*=.8+.35*sp; gloss=.24;
          // the spine is rounded, and the binding's raised bands stand a little proud
          N=normalize(N+vT*vG.x*1.2*spine);
          alb=mix(alb,vec3(.78,.57,.2),band); metal=band*.85; gloss=mix(gloss,.62,band);
          // THE GILT GLINTS SLOWLY in the lamp and the fire: each book's bands on a slow clock of their own (phase and rate
          // from the book's own draw), by the two flames' distance
          float gt=.5+.5*sin(uTime*(.22+.5*hs)+vPh*6.2832); gt=gt*gt*gt; gt=gt*gt;
          vec3 ql=uLampPos-vW, qf=uFirePos-vW;
          emis=band*gt*(uLampCol*(.5/(1.+dot(ql,ql)/19600.))+uFireCol*(.35/(1.+dot(qf,qf)/19600.))); }` });
      const books = new THREE.InstancedMesh(bg, libMat, n); books.name = 'library-books'; books.frustumCulled = false;
      for (let i = 0; i < n; i++) { books.setMatrixAt(i, mats[i]); books.setColorAt(i, col.setRGB(cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2])); if (i % 400 === 399) await ctx.yield(); }
      scene.add(books); scene.userData.library = { books: n };
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the charts: coasts with their hatching, sea lining, shoals as three or
    // four small dotted banks, rhumb lines from two compass stars and a border of ticks; on the hanging chart and the working chart
    // also soundings as single dots in the open sea and a wind's face blowing from a corner; all drawn in the
    // shader from the seed. No names, no letters, no numerals, and NO VESSEL OF ANY KIND on any chart. (The sea beast of earlier
    // rounds is struck: its row of humps read as a written word.)
    const CHART_GLSL = /* glsl */`{
      vec2 p=vUv; float pl=max(length(fwidth(p)),1e-4), pg=max(sqrt(max(length(dFdx(p))*length(dFdy(p)),0.)),1e-4), pm=pg;
      vec2 q=p*uScale+uOff;
      // (the coast is a BROKEN coast: a third, finer noise frays it into capes, inlets and skerries, so no land reads as a shape)
      float n=fbm(q)+.38*fbm(q*2.9+7.)+.2*fbm(q*7.3+19.)-uSea-.1;
      // THE SHOALS ARE A FEW SMALL BANKS (uBank: middle and radius, dealt by the sheet's rules): the ground sinks gently toward
      // each (a bank lies in a bay), and only inside a bank's ragged round is the sea stippled
      float bank=0.;
      for(int i=0;i<4;i++){ vec3 b=uBank[i]; if(b.z>.01){ float e=length(p-b.xy)/b.z; n-=.5*(1.-smoothstep(.4,2.,e)); bank=max(bank,1.-smoothstep(.72,.95,e+.3*(vn(p*.4+b.xy)-.5))); } }
      float gn=max(length(vec2(dFdx(n),dFdy(n)))/pl,2e-3);
      float dm=clamp(n/gn,-30.,30.);
      float dw=clamp(fwidth(dm),pg*.5,pl);
      float land=smoothstep(-dw,dw,dm);
      vec3 paper=uCol*(.9+.14*fbm(p*1.1))*(.97+.06*vn(p*9.));
      paper=mix(paper,paper*vec3(.82,.7,.5),.5*smoothstep(.62,.85,fbm(p*.045+9.)));
      paper=mix(paper,paper*vec3(.93,.86,.7),land*.75);
      // age: brown blooms a few metres across, and margins gone darker than the middle
      paper=mix(paper,paper*vec3(.8,.66,.45),.6*smoothstep(.6,.8,fbm(p*.21+31.)));
      { vec2 ee=min(p,uSize-p); paper*=.8+.2*smoothstep(0.,7.,min(ee.x,ee.y)); }
      // the sheet's cockle: a low swell of the paper, so that raking light models it
      { float hc=1.1*fbm(p*.15+4.)+.35*fbm(p*.5+17.);
        vec3 dpx=dFdx(vW), dpy=dFdy(vW); float hx=dFdx(hc), hy=dFdy(hc);
        vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
        N=normalize((abs(det)+1e-6)*N-sign(det)*(hx*r1+hy*r2)); }
      // laid paper seen near: chain lines and fibre
      float nearK=clamp(1.-pm*6.,0.,1.);
      paper*=1.-.07*nearK*(1.-smoothstep(.02,.06,abs(fract(p.y/.36)-.5)*.36));
      paper*=1.+.12*nearK*(vn(p*vec2(3.,38.))-.5);
      float ink=0.;
      // the graticule: fine squares 8 m across
      { vec2 gq=abs(fract(p/8.)-.5)*8.; float wg=max(.035,pm*.6); ink=max(ink,(1.-smoothstep(wg,wg+pm,min(gq.x,gq.y)))*.2); }
      // hills on the land away from the shore: a small arc each, shaded on one flank
      { vec2 hc=p/3.4, hi=floor(hc); vec2 hf=fract(hc)-.5-.25*(vec2(h21(hi+7.1),h21(hi+1.7))-.5);
        float hill=step(.5,h21(hi+11.))*smoothstep(2.5,5.,dm), hr=length(vec2(hf.x,hf.y*1.5));
        ink=max(ink,(1.-smoothstep(.05,.05+pm,abs(hr-.3)*3.4))*step(0.,hf.y)*hill*.75*(1.-smoothstep(0.24,.4,pm)));
        ink=max(ink,(1.-smoothstep(.035,.035+pm,abs(fract(hf.x*9.)-.5)/9.*3.4))*step(0.,hf.x)*step(0.,hf.y)*step(hr,.3)*hill*.5*(1.-smoothstep(0.18,.3,pm))); }
      // a second fine line inside the coast
      ink=max(ink,(1.-smoothstep(.05,.05+dw,abs(dm-.75)))*.55*(1.-smoothstep(.25,.5,dw)));
      float wl=max(.17,dw*.6);
      ink=max(ink,1.-smoothstep(wl,wl+dw,abs(dm)));
      // hatching on the land side of the coast
      float hs=abs(fract((p.x+p.y)*.7071/.62)-.5)*.62;
      ink=max(ink,(1.-smoothstep(.07,.07+pm,hs))*land*(1.-smoothstep(.6,2.8,dm))*.8*(1.-smoothstep(0.3,.5,pm)));
      // sea lining: lines that follow the coast, wider apart further out
      float k=max(-dm,0.), f=abs(fract(sqrt(max(k,0.))*1.9)-.5)/1.9*2.*sqrt(max(k,.05));
      ink=max(ink,(1.-smoothstep(.06,.06+pm,f))*(1.-land)*(1.-smoothstep(1.,3.6,k))*.6*(1.-smoothstep(0.27,.45,pm)));
      // stippled shoals: dots in the banks only
      vec2 sc=p/.72, si=floor(sc); vec2 so=fract(sc)-.5-.3*(vec2(h21(si),h21(si+3.3))-.5);
      float shoal=bank*(1.-land);
      ink=max(ink,(1.-smoothstep(.09,.09+pm,length(so)*.72))*shoal*.75*(1.-smoothstep(0.24,.4,pm)));
      // soundings: single dots in the open sea beyond the sea lining, one in some of the cells of a loose grid (dots only)
      { vec2 dc=p/2.7, di=floor(dc); vec2 dq=fract(dc)-.5-.32*(vec2(h21(di+5.3),h21(di+9.1))-.5);
        ink=max(ink,(1.-smoothstep(.13,.13+pm,length(dq)*2.7))*step(.52,h21(di+2.9))*(1.-land)*smoothstep(3.6,6.,k)*(1.-bank)*.7*(1.-smoothstep(.24,.4,pm))); }
      // rhumb lines from two compass stars, and the stars themselves
      float rose=0., roseDark=0.;
      for(int i=0;i<2;i++){ vec2 v=(p-(i==0?uStarA:uStarB))/(i==0?uRoseK:1.); float r=length(v), ang=atan(v.y,v.x+1e-5);
        float a=fract(ang*32./6.2832)-.5, dist=abs(a)*(6.2832/32.)*r*(i==0?uRoseK:1.), wr=max(.06,pm*.7)/(i==0?uRoseK:1.);
        float major=step(abs(fract(ang*8./6.2832+.5)-.5),.07);
        ink=max(ink,(1.-smoothstep(max(.06,pm*.7),max(.06,pm*.7)+pm,dist))*smoothstep(10.,12.,r)*(.3+.22*major));
        float kk=fract(ang*8./6.2832), tri=abs(kk-.5)*2.;
        float longp=step(.5,fract(ang*4./6.2832+.25));
        float re=mix(mix(6.2,10.,longp),2.6,pow(clamp(1.-tri,0.,1.),.75));
        float inside=1.-smoothstep(re-pm,re+pm,r);
        rose=max(rose,inside); roseDark=max(roseDark,inside*step(.5,kk));
        ink=max(ink,(1.-smoothstep(wr*1.6,wr*1.6+pm,abs(r-10.8)))*.7);
        ink=max(ink,(1.-smoothstep(wr,wr+pm,abs(r-2.6)))*.7);
        ink=max(ink,(1.-smoothstep(wr,wr+pm,abs(r-re)))*step(r,10.3)*.9); }
      // our own figure, drawn in a plain firm line: the wind's face (at its place by the sheet's rule)
      { float wf=max(.17,pm*.6);
        if(uWind.w>.01){ vec2 dd=p-uWind.xy; float c=cos(uWind.z), sn=sin(uWind.z); vec2 l=vec2(c*dd.x+sn*dd.y,-sn*dd.x+c*dd.y)/uWind.w;
          if(l.x>-6.5&&l.x<15.&&abs(l.y)<5.) ink=max(ink,(1.-smoothstep(wf,wf+pm,figWind(l)*uWind.w))*.9); } }
      // the border: a double rule with a band of ticks between
      vec2 ed=min(p,uSize-p); float e=min(ed.x,ed.y);
      float wb=max(.12,pm*.8);
      ink=max(ink,1.-smoothstep(wb,wb+pm,abs(e-2.))); ink=max(ink,1.-smoothstep(wb,wb+pm,abs(e-3.4)));
      float per=ed.x<ed.y ? p.y : p.x;
      ink=max(ink,step(2.,e)*step(e,3.4)*step(.5,fract(per/2.4))*.85);
      float fold=p.x-uSize.x*uFold;
      paper*=1.-.2*exp(-abs(fold)*1.4)*step(0.,fold)+.12*exp(-abs(fold)*1.4)*step(fold,0.);
      vec3 inkCol=vec3(.045,.03,.02);
      paper=mix(paper,mix(vec3(.5,.13,.06),paper,.25),rose*.0+roseDark*.8);
      alb=mix(paper,inkCol,clamp(ink,0.,1.)*.92);
      // the working chart's plotted course in pencil: legs between fixes, each fix a small ring with a dot (no figures)
      if(uCourse>.5){ float pen=0., wc=max(.1,pm*.6);
        for(int i=0;i<5;i++){ vec2 a=uFix[i], ba=uFix[i+1]-a, pa=p-a; float d=length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.));
          pen=max(pen,(1.-smoothstep(wc,wc+pm,d))*.75); }
        for(int i=0;i<6;i++){ float r=length(p-uFix[i]);
          pen=max(pen,(1.-smoothstep(wc,wc+pm,abs(r-1.2)))*.9); pen=max(pen,1.-smoothstep(.24,.24+pm,r)); }
        alb=mix(alb,vec3(.1,.1,.125),pen*.85); }
      if(!gl_FrontFacing) alb=uCol*.5*(.9+.2*fbm(p*.8))*(1.-.2*ink);
      gloss=.06; wrap=.4; }`;
    const CHART_PARS = /* glsl */`uniform vec3 uCol; uniform vec2 uSize, uOff, uStarA, uStarB, uFix[6]; uniform float uScale, uSea, uFold, uCourse, uRoseK; uniform vec4 uWind; uniform vec3 uBank[4];
      float sdSeg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a, ba=b-a; return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.)); }
      // THE WIND'S FACE (it blows toward +x): a round head, a brow, an eye, a puffed cheek, pursed lips, curls of cloud behind,
      // and four lines of breath that open out
      float figWind(vec2 l){ float d=1e3, r=length(l); d=min(d,abs(r-3.2));
        d=min(d,length(l-vec2(.9,1.2))-.3); d=min(d,sdSeg(l,vec2(.1,2.),vec2(1.7,1.9)));
        d=min(d,abs(length(l-vec2(1.3,-.9))-1.25)+step(l.x,.6)*9.); d=min(d,abs(length(l-vec2(3.5,-.9))-.55));
        if(r>3.2){ d=min(d,abs(length(l-vec2(-3.2,2.))-1.5)); d=min(d,abs(length(l-vec2(-4.1,-.4))-1.6)); d=min(d,abs(length(l-vec2(-2.6,-2.7))-1.5)); }
        for(int i=0;i<4;i++){ float k=float(i)-1.5; d=min(d,sdSeg(l,vec2(4.6,-.9+.35*k),vec2(abs(k)<1.?14.:11.,-.9+1.9*k))); }
        return d; }`;
    // PAPER IN STRONG LIGHT GOES GOLD, NOT WHITE (D8), every chart alike: past a knee its brightness is pressed (the hue kept)
    // and it takes the flame's own gold the more the brighter it stands
    const PAPER_POST = '{ float m=max(col.r,max(col.g,col.b)); if(m>.7) col*=(.7+(m-.7)/(1.+1.5*(m-.7)))/m; col*=mix(vec3(1.),vec3(1.,.84,.56),smoothstep(.45,1.3,m)); }';
    const chartMat = (size, seedOff, starA, starB, fold, figs, course = null, banks = []) => lib.mat({ name: 'chart', side: THREE.DoubleSide, occL: true, post: PAPER_POST,
      uniforms: { uCol: { value: lin3('#E9DDBE', 0.5) }, uSize: { value: new THREE.Vector2(size[0], size[1]) }, uOff: { value: new THREE.Vector2(seedOff[0], seedOff[1]) },
        uStarA: { value: new THREE.Vector2(starA[0], starA[1]) }, uStarB: { value: new THREE.Vector2(starB[0], starB[1]) }, uScale: { value: 0.042 }, uSea: { value: 0.68 }, uFold: { value: fold },
        uCourse: { value: course ? 1 : 0 }, uRoseK: { value: 1 }, uWind: { value: new THREE.Vector4(...figs.wind) }, uBank: { value: [0, 1, 2, 3].map((i) => new THREE.Vector3(...(banks[i] || [0, 0, 0]))) }, uFix: { value: (course || [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]).map((f) => new THREE.Vector2(f[0], f[1])) } },
      pars: CHART_PARS, surface: CHART_GLSL });
    {
      const cr = R.charts;
      // THE HANGING CHART: lies on the table from x 18 to the edge, hangs to the floor in one long curve, lies flat to x -112
      const xs = [];
      for (let x = SHEET.xTop; x > SHEET.xEdge + 1; x -= 5.5) xs.push(x);
      for (const x of [-14.4, -14.8, -15.0, -15.3, -15.8, -16.6]) xs.push(x);
      for (let x = -18; x > SHEET.xFoot + 1; x -= 1.6) xs.push(x);
      for (const x of [-94.6, -95.0, -95.6, -96.6]) xs.push(x);
      for (let x = -98.5; x >= SHEET.xFlat; x -= 2.25) xs.push(x);
      const NZ = 28, P = [], Nn = [], U = [], I = [];
      const yAt = (x) => (x >= SHEET.xEdge ? TABLE.y : x <= SHEET.xFoot ? 0 : sheetH(x)) + 0.05;
      let arc = 0, aEdge = 0, aFoot = 0;
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i], y = yAt(x);
        if (i > 0) arc += Math.hypot(x - xs[i - 1], y - yAt(xs[i - 1]));
        if (x >= SHEET.xEdge) aEdge = arc; if (x >= SHEET.xFoot) aFoot = arc;
        const e = 0.05, slope = (yAt(x + e) - yAt(x - e)) / (2 * e), nl = Math.hypot(slope, 1);
        for (let j = 0; j <= NZ; j++) { const z = SHEET.z0 + (SHEET.z1 - SHEET.z0) * j / NZ; P.push(x, y, z); Nn.push(-slope / nl, 1 / nl, 0); U.push(arc, z - SHEET.z0); }
        if (i > 0) for (let j = 0; j < NZ; j++) { const a = (i - 1) * (NZ + 1) + j, b = a + 1, c = a + NZ + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); sg.setIndex(I);
      // what the seed draws on it, by the rules of a sheet (its metres: along from the table end, across from the north edge).
      // aEdge, aFoot: the sheet's length to the table's edge and to the foot of its fall. Its feet: the book pile, the weight, the
      // inkwell's tray.
      // The GREAT STAR (its ring 1.75 times a star's) stands anywhere on the free fall; the second star anywhere on the sheet; the
      // fold lies across the middle of the fall.
      // (each sheet draws its stars and its banks from streams of its own: what one sheet finds room for moves nothing on another)
      const hSize = [arc, SHEET.z1 - SHEET.z0], hK = 1.75; let hFeet, hA, hB, hFigs;
      { const cs = R.hanging.stars;
      hFeet = [[SHEET.xTop - WEIGHT.x, WEIGHT.z - SHEET.z0, 2.7], [SHEET.xTop - INK.x, INK.z - SHEET.z0, INK.tray + 1]];
      for (let x = Math.min(PILE.x1, SHEET.xTop); x > PILE.x0; x -= 6) hFeet.push([SHEET.xTop - x, PILE.z - SHEET.z0, 8]);
      hA = starOn(cs, [aEdge, aFoot, 0, hSize[1]], STAR * hK, []) || [(aEdge + aFoot) / 2, hSize[1] / 2]; hFeet.push([hA[0], hA[1], STAR * hK]);
      hB = starOn(cs, [0, arc, 0, hSize[1]], STAR, hFeet) || [arc - STAR - BORDER - 3, hSize[1] / 2]; hFeet.push([hB[0], hB[1], STAR]);
      hFigs = {};
      hFigs.wind = windOn(hSize, FIG.windK * FIG.hang, hFeet);
      }
      const hBanks = banksOn(R.hanging.banks, hSize, hFeet.concat([[hFigs.wind[0], hFigs.wind[1], 9 * hFigs.wind[3]]]));
      const hang = chartMat(hSize, [cr.range(0, 40), cr.range(0, 40)], hA, hB, (aEdge + aFoot) / 2 / arc, hFigs, null, hBanks);
      hang.uniforms.uRoseK.value = hK;
      scene.userData.chartDeal = { hanging: { size: hSize, aEdge, aFoot, A: hA, B: hB, ...hFigs, banks: hBanks } };
      // the sheet lives in the draught: its free fall between the floor and the table's edge lifts and settles (0.35 m) and a slow
      // ripple (0.28 m) runs up it, both dying out to nothing at the table's edge and at the foot, so the paper under the line's
      // crest does not move; the curled south-west corner lifts up to 2.2 m. Phases from the charts' own stream (drawn below).
      // grains of sand (the shaker's) roll down the fall: A FEW, LARGE (D7): in about four columns in ten, each 3.2 m wide, one
      // grain every 30 m, 0.75 to 1.05 m across, each at its own rate, slowing and hurrying; it ROLLS: its two dark flecks go round
      // its middle by the way it has come (the turn is the distance over the radius), and its shadow lies beside it on the paper
      const SAND_GLSL = /* glsl */`{ float steep=1.-smoothstep(.9,.97,abs(vN.y)); float cw=3.2, cl=floor(vUv.y/cw), hc=h21(vec2(cl,3.1)); float run=step(.6,hc);
        float sp=2.+3.*h21(vec2(cl,7.7)); float trav=uTime*sp+2.5*sin(uTime*.6+hc*40.);
        vec2 dq=vec2(mod(vUv.x-trav+hc*90.,30.)-15.,(fract(vUv.y/cw)-.5)*cw+1.6*(hc-.8));
        float rg=.38+.14*h21(vec2(cl,1.3)), d=length(dq), ang=trav/rg;
        float gr=1.-smoothstep(rg-.07,rg,d), sh=(1.-smoothstep(rg*.5,rg*1.9,length(dq-vec2(.75,.55)*rg)))*.6;
        vec2 rq=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*dq/rg;
        float fleck=(1.-smoothstep(.12,.3,length(rq-vec2(.45,0.))))+.7*(1.-smoothstep(.1,.24,length(rq+vec2(.3,.42))));
        vec3 gc=vec3(.8,.6,.32)*(.72+.28*(1.-d/rg))*(1.-.55*clamp(fleck,0.,1.));
        alb=mix(alb*(1.-sh*steep*run),gc,gr*steep*run); }`;
      const sheetPh = new V3();
      const hm = lib.mat({ name: 'hanging-chart', side: THREE.DoubleSide, uniforms: { ...hang.uniforms, uSheetPh: { value: sheetPh } }, pars: CHART_PARS, vpars: 'uniform vec3 uSheetPh;', surface: CHART_GLSL + SAND_GLSL, post: PAPER_POST,
        vert: /* glsl */`{ float cw=1.-smoothstep(0.,15.,length(vec2(p.x+112.,p.z+96.)));
          float lift=cw*cw*(1.25+.75*sin(uTime*.7+uSheetPh.x)+.2*sin(uTime*1.9+uSheetPh.y));
          p.y+=lift; p.x+=lift*.4; p.z-=lift*.25;
          float free=smoothstep(-100.,-86.,p.x)*(1.-smoothstep(-30.,-17.,p.x));
          p+=n*free*(.35*sin(uTime*.6+uSheetPh.z+p.z*.02)+.28*sin(vUv.x*.16-uTime*1.1+uSheetPh.y+p.z*.045)); }` });
      hm.polygonOffset = true; hm.polygonOffsetFactor = -1; hm.polygonOffsetUnits = -2;
      mesh(sg, hm, 'hanging-chart');
      // (No shaft of lit dust is drawn over the table's west edge: the lamp's light in the air is the soft glow round the flame
      // that every surface of the room carries, the part's airlight; a slab of lit air there read as a straight-edged beam.)
      // THE WORKING CHART on the table top
      const wx0 = CHART.x0, wx1 = CHART.x1, wz0 = CHART.z0, wz1 = CHART.z1;
      const wg = new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0, 8, 4); wg.rotateX(-PI / 2); wg.translate((wx0 + wx1) / 2, TABLE.y + 0.05, (wz0 + wz1) / 2);
      { const uv = wg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (wx1 - wx0), uv.getY(i) * (wz1 - wz0)); }
      // what the seed draws on it, by the rules of a sheet (its metres: x - CHART.x0 east, CHART.z1 - z north). Its feet are what
      // stands on the paper: the lamp, the rule, the pipe's dish, the mug, the bottle in its cradle and its green light.
      const wSize = [wx1 - wx0, wz1 - wz0], sx = (x) => x - wx0, sy = (z) => wz1 - z;
      const wFeet = [[sx(FLAME[0]), sy(FLAME[2]), 7.5], [sx(PIPE.x - 3), sy(PIPE.z), 9], [sx(MUG.x), sy(MUG.z), 4]];
      for (const k of [-1, 0, 1]) wFeet.push([sx(RULE.x + k * 10), sy(RULE.z), RULE.half + 0.5]);
      for (const sd of [-1, 1]) wFeet.push([sx(DIV.at[0] + DIV.across[0] * DIV.half * sd), sy(DIV.at[2] + DIV.across[1] * DIV.half * sd), 2]);
      for (let al = 0; al <= BOTTLE.len + 3 * GROW; al += 5) wFeet.push([sx(BOTTLE.x + AXIS[0] * al), sy(BOTTLE.z + AXIS[1] * al), BOTTLE.body + 2.3 * GROW]);
      { const c = hero.anchors.caustic; wFeet.push([sx(BOTTLE.x + ACROSS[0] * c[0] - AXIS[0] * c[1]), sy(BOTTLE.z + ACROSS[1] * c[0] - AXIS[1] * c[1]), c[3]]); }
      // one star in the sheet's west half and one in its east half
      const cs = R.working.stars;
      const wA = starOn(cs, [0, wSize[0] / 2, 0, wSize[1]], STAR, wFeet) || [wSize[0] * 0.4, STAR + BORDER + 3]; wFeet.push([wA[0], wA[1], STAR]);
      const wB = starOn(cs, [wSize[0] / 2, wSize[0], 0, wSize[1]], STAR, wFeet) || [wSize[0] * 0.6, STAR + BORDER + 3]; wFeet.push([wB[0], wB[1], STAR]);
      const wFigs = {};
      wFigs.wind = windOn(wSize, FIG.windK * FIG.work, wFeet);
      // THE PLOTTED COURSE, six fixes: it starts 6 m in from the rule's west end and 3 m north of the rule (the rule was laid along its
      // first leg), and steps east by equal parts to a last fix 20 m short of the bottle's base; from the third fix on each stands
      // somewhere between the first leg's line and 6 m short of the base's own line across the sheet, drawn from its own stream
      const cx0 = sx(RULE.x - 15) + 6, cx5 = sx(BOTTLE.x) - 20, cyN = sy(RULE.z - RULE.half) + 3, cc = R.chartCourse;
      const course = [0, 1, 2, 3, 4, 5].map((i) => [cx0 + (cx5 - cx0) * i / 5, i < 2 ? cyN : cc.range(cyN, sy(BOTTLE.z) - 6)]);
      const wBanks = banksOn(R.working.banks, wSize, wFeet.concat([[wFigs.wind[0], wFigs.wind[1], 9 * wFigs.wind[3]]]));
      const wm = chartMat(wSize, [cr.range(50, 90), cr.range(50, 90)], wA, wB, 0.5, wFigs, course, wBanks);
      Object.assign(scene.userData.chartDeal, { working: { size: wSize, A: wA, B: wB, ...wFigs, course, banks: wBanks } });
      wm.polygonOffset = true; wm.polygonOffsetFactor = -1; wm.polygonOffsetUnits = -2;
      mesh(wg, wm, 'working-chart');
      // charts hung on the walls between two battens each: two on the north wall between the clock and the shelves, one on the east wall
      // north of the door; their coasts are the seed's own, their places and sizes the room's. A WALL CHART CARRIES NO FIGURE: coast,
      // hatching, sea lining, the two compass stars with their rhumb lines and the border, and nothing else (a figure drawn small
      // between the sea's lines reads as a written word from across the room): no wind's face, no banks
      const wallChart = (w, h, m, name) => {
        const g = new THREE.PlaneGeometry(w, h, 6, 4), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
        g.applyMatrix4(m);
        // its two stars by the rule of a sheet, from the wall charts' own stream: the first anywhere on the sheet, the second
        // anywhere 3 m clear of the first; where a sheet has no room, the first in its middle and the second none the worse
        // beside its far border (as on the hanging chart). Its coast and its fold are drawn from the same stream.
        const wc = R.wallCharts, sA = starOn(wc, [0, w, 0, h], STAR, []) || [w / 2, h / 2];
        const sB = starOn(wc, [0, w, 0, h], STAR, [[sA[0], sA[1], STAR]]) || [w - STAR - BORDER - 3, h / 2];
        const cm = chartMat([w, h], [wc.range(100, 400), wc.range(100, 400)], sA, sB, wc.range(0.3, 0.7), { wind: [0, 0, 0, 0] });
        mesh(g, cm, name);
        for (const sy of [-1, 1]) { WD.add(cyl(1.3, 1.3, w + 5, 12), new THREE.Matrix4().copy(m).multiply(M4(0, sy * (h / 2 + 0.6), 0.9, 0, 0, PI / 2)), '#4a2c18', { g: 'y' });
          for (const sx of [-1, 1]) BR.add(new THREE.SphereGeometry(1.7, 12, 8), new THREE.Matrix4().copy(m).multiply(M4(sx * (w / 2 + 2.9), sy * (h / 2 + 0.6), 0.9)), BRASS); }
      };
      // (the wall charts hang before the shelves, from the shelves' own edges)
      wallChart(74, 52, M4(-92, 122, ROOM.z0 + SHELF.deep + 0.6, 0, 0, 0.012), 'wall-chart-north');
      wallChart(44, 60, M4(170, 128, ROOM.z0 + SHELF.deep + 0.6, 0, 0, -0.01), 'wall-chart-north-east');
      // (the east wall's chart: midway between the east light's south jamb and the door's north post)
      wallChart(78, 54, M4(ROOM.x1 - SHELF.deep - 0.6, 124, (EWIN.z1 + 4 + 22) / 2, 0, -PI / 2, 0), 'wall-chart-east');
      sheetPh.set(R.draught.range(0, TAU), R.draught.range(0, TAU), R.draught.range(0, TAU));
      await ctx.yield();
      // the one lead weight that holds the hanging chart, the same on every seed (WEIGHT, above: the line passes 14 m south of it)
      IR.add(weightGeo(), M4(WEIGHT.x, TABLE.y + 0.05, WEIGHT.z), '#6a6a70');
      lib.addOccL(WEIGHT.x, WEIGHT.z, 2.6, TABLE.y + 3.9);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the hearth in the west wall: surround, mantel, slab, basket, logs, fire, fender
    // a box with rounded edges (w along x, h along y, d along z)
    const rbox = (w, h, d, r = 1, seg = 3) => {
      const s = new THREE.Shape(), a = w / 2 - r, c = d / 2 - r;
      s.moveTo(-a, -d / 2); s.lineTo(a, -d / 2); s.absarc(a, -c, r, -PI / 2, 0, false); s.lineTo(w / 2, c); s.absarc(a, c, r, 0, PI / 2, false);
      s.lineTo(-a, d / 2); s.absarc(-a, c, r, PI / 2, PI, false); s.lineTo(-w / 2, -c); s.absarc(-a, -c, r, PI, PI * 1.5, false);
      const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(h - 2 * r, 0.01), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: seg, bevelOffset: -r, curveSegments: 5 });
      g.rotateX(-PI / 2); g.translate(0, -h / 2 + r, 0);
      return g;
    };
    {
      const stone = '#8d8072', stoneD = '#6f655a', soot = '#3b2d25', X0 = ROOM.x0, sootUp = { shade: (px, py) => 1 - 0.62 * clamp((py + 40) / 80, 0, 1) };
      // the recess behind the wall plane
      ST.add(new THREE.PlaneGeometry(90, 80), M4(X0 - 26, 40, -25, 0, PI / 2, 0), soot, sootUp);
      ST.add(new THREE.PlaneGeometry(26, 80), M4(X0 - 13, 40, -70, 0, 0, 0), soot, sootUp); ST.add(new THREE.PlaneGeometry(26, 80), M4(X0 - 13, 40, 20, 0, PI, 0), soot, sootUp);
      ST.add(new THREE.PlaneGeometry(26, 90), M4(X0 - 13, 80, -25, PI / 2, 0, 0), soot); ST.add(new THREE.PlaneGeometry(26, 90), M4(X0 - 13, 0.02, -25, -PI / 2, 0, 0), soot);
      // surround: jambs, lintel, stepped cornice, mantel shelf
      ST.add(box(4.5, 80, 15), M4(X0 + 2.25, 40, -77.5), stone); ST.add(box(4.5, 80, 15), M4(X0 + 2.25, 40, 27.5), stone);
      ST.add(box(2, 74, 9), M4(X0 + 5.2, 41, -77.5), stoneD); ST.add(box(2, 74, 9), M4(X0 + 5.2, 41, 27.5), stoneD);
      ST.add(box(5.5, 16, 120), M4(X0 + 2.75, 88, -25), stone); ST.add(box(2, 9, 96), M4(X0 + 6.2, 88, -25), stoneD);
      ST.add(box(8, 4, 124), M4(X0 + 4, 98, -25), stone); ST.add(box(11, 4, 128), M4(X0 + 5.5, 102, -25), stoneD);
      ST.add(box(MANTEL.x - X0, 3.2, MANTEL.z1 - MANTEL.z0), M4((X0 + MANTEL.x) / 2, MANTEL.y + 1.6, FIRE[2]), stone);
      // the hearth slab, 1 m high
      ST.add(box(42, 1, 120), M4(X0 + 21, 0.5, -25), '#4c4640');
      // two brass candlesticks, unlit, on the mantel
      const stick = [[0, 0], [4.2, 0], [4.4, 0.5], [3.2, 1.3], [1.4, 1.9], [1.1, 3.4], [1.8, 4.3], [1.9, 5.2], [1.0, 6.2], [0.9, 11], [1.5, 12], [1.6, 13], [0.9, 14], [0.9, 18], [2.6, 19.2], [2.8, 20], [1.5, 20.2], [1.5, 21], [0, 21]];
      for (const z of [-78, 28]) { BR.add(lathe(stick, 28), M4(X0 + 7, 107.2, z), BRASS); ST.add(cyl(1.3, 1.35, 9, 16), M4(X0 + 7, 107.2 + 25, z), '#d8cfb8'); }
      // iron fire basket: bars along the front and sides, four feet
      const bz0 = -45, bz1 = -5, bx0 = -196, bx1 = -176, iron = '#3a3836';
      for (let z = bz0; z <= bz1 + 0.01; z += 5) IR.add(cyl(0.55, 0.55, 9, 8), M4(bx1, 5.5 + 4.5, z), iron);
      for (const y of [5.6, 10, 14.4]) { IR.add(box(1.0, 0.9, 41), M4(bx1, y, -25), iron); for (const z of [bz0, bz1]) IR.add(box(20, 0.9, 1.0), M4(-186, y, z), iron); }
      IR.add(box(21, 0.8, 41), M4(-186, 5.4, -25), iron);
      for (const x of [bx0 + 1, bx1 - 1]) for (const z of [bz0 + 1, bz1 - 1]) IR.add(lathe([[1.4, 0], [1.0, 1], [0.7, 3], [1.0, 5]], 10), M4(x, 1, z), iron);
      lib.u.uFender.value.set(FENDER.x, FENDER.z0, FENDER.z1, FENDER.h);
    }
    await ctx.yield();
    {
      // logs 8 m thick, charred, with glowing cracks; an ember bed under them
      // (the logs' tilt and the coals from the coals' stream; the kit's sparks and the tongues below each from a stream of its own,
      // so that no kind's dealing depends on how many of another the graphics level draws)
      const lb = makeBuilder(), fr = R.fireCoals;
      const logs = fireHigh ? [[-190.5, 10.2, -25, 0.05, 36], [-181.5, 10.2, -24, -0.06, 33], [-186, 16.6, -26, 0.16, 30], [-188, 12, -9, 0.9, 20]] : [[-190, 9.6, -26, 0.08, 30], [-182, 9.4, -23, -0.1, 26], [-186, 13.5, -30, 0.5, 18]];
      for (const [x, y, z, yaw, len] of logs) {
        const g = cyl(4, 4, len, 14, false); const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const k = 1 + 0.09 * Math.sin(p.getY(i) * 0.7 + i) + 0.06 * Math.sin(p.getX(i) * 3.1 + p.getY(i) * 0.3); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
        g.computeVertexNormals();
        lb.add(g, M4(x, y, z, PI / 2 + fr.range(-0.05, 0.05), 0, yaw));
      }
      lb.add(new THREE.SphereGeometry(1, 20, 10), M4(-186, 6.6, -25, 0, 0, 0, 9.5, 2.4, 19));
      await ctx.yield();
      // the ember bed: broken coals heaped over the grate's floor (they glow by the same law as the logs' cracks)
      for (let i = 0; i < 46; i++) { const r = fr.range(1.1, 2.6), ex = fr.range(-0.92, 0.92), ez = fr.range(-0.92, 0.92), up = 1 - 0.5 * (ex * ex + ez * ez);
        if (i % 12 === 11) await ctx.yield();
        lb.add(new THREE.DodecahedronGeometry(r, 0), M4(-186 + ex * 8.6, 6.4 + 2.6 * up + fr.range(0, 0.8), -25 + ez * 18, fr.range(0, 3), fr.range(0, 3), 0, 1, 0.7, 1)); }
      await ctx.yield();
      const logMat = lib.mat({ name: 'logs', grain: true, uniforms: { uHot: { value: fireHigh ? 1 : 1.5 } }, pars: 'uniform float uHot;',
        surface: /* glsl */`{ float n=fbm3(vG*.4), cr=vn3(vG*vec3(1.1,.28,1.1)+3.);
          alb=mix(vec3(.035,.026,.022),vec3(.11,.085,.07),n); gloss=.1;
          float low=1.-smoothstep(5.,19.,vW.y); N=normalize(N+(vec3(vn3(vG*1.7),vn3(vG*1.7+5.),vn3(vG*1.7+9.))-.5)*.5);
          float pulse=.62+.38*sin(uTime*.9+fbm3(vW*.11)*13.+vG.y*.3);
          float hot=smoothstep(.42,.75,cr*(.55+.7*n)+.3*low)*uHot;
          emis=vec3(1.,.26,.035)*2.6*hot*pulse+vec3(1.,.62,.2)*2.4*smoothstep(.7,.95,cr*(.6+n)*low*1.5)*pulse*uHot; }` });
      mesh(lb.build(), logMat, 'logs');
      await ctx.yield();
      // THE FIRE: layered tongues that climb and part, row behind row (each sheet turns about its own upright to face the eye, a
      // MEDIUM: light only, no surface); the kit's sheets carry only the sparks going up. On ember nights: a red bed that breathes
      // with low flames and small blue flames walking on it. Sizes in metres; every phase and rate from the fire's stream.
      const fl = makeFlames({ rng: R.fireSparks, gain: fireHigh ? 0.5 : 0.55,
        fires: [{ position: [0, 0, 0], width: fireHigh ? 38 : 30, height: fireHigh ? 22 : 12, tongues: 0, embers: Math.round((fireHigh ? 40 : 18) * detail) }] });
      fl.object.position.set(-186, fireHigh ? 9 : 8, -25); fl.object.rotation.y = PI / 2; scene.add(fl.object);
      tick.push((dt, time) => fl.update(dt, time));
      {
        const P = [], Cc = [], Pa = [], Ix = [];
        const ft = R.fireTongues;
        const tongue = (x, y, z, w, h, kind) => { const n = P.length / 3, ph = ft.range(0, 40), sp = ft.range(0.8, 1.25);
          for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(u, v, 0); Cc.push(x, y, z, kind); Pa.push(w, h, ph, sp); }
          Ix.push(n, n + 1, n + 2, n, n + 2, n + 3); };
        // ONE RULE FOR EVERY TONGUE: it stands anywhere on the bed (across it from the back log to the front one, along it from end
        // to end); the fire is tallest at the back and lowest at the front (crown), and a tongue reaches from under four tenths of
        // the crown there to the whole of it, most of them low and a few great; its breadth goes with its depth in the fire and its
        // height. So no two stand in a row or reach alike.
        const bed = fireHigh ? { n: 22, x0: -192, x1: -180, y: 11.5, top: 44, front: 17, w: 6 } : { n: 9, x0: -191, x1: -183, y: 10.2, top: 10, front: 7, w: 3.6 };
        for (let i = 0; i < bed.n; i++) { const x = ft.range(bed.x0, bed.x1), z = ft.range(-43, -7), sd = (x - bed.x0) / (bed.x1 - bed.x0), crown = bed.top + (bed.front - bed.top) * sd;
          const h = crown * (0.38 + 0.62 * Math.pow(ft(), 1.6)); tongue(x, bed.y + ft.range(-1, 1), z, (bed.w + 5 * (1 - sd) * (fireHigh ? 1 : 0.3)) * ft.range(0.8, 1.25) * Math.sqrt(h / crown), h, 0); }
        if (!fireHigh) for (let i = 0; i < 9; i++) tongue(ft.range(-190, -179), ft.range(9.2, 12), ft.range(-41, -9), ft.range(2.2, 3.6), ft.range(2.5, 5), 1);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 4));
        g.setAttribute('aPar', new THREE.Float32BufferAttribute(Pa, 4)); g.setIndex(Ix); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-186, 28, -25), 48);
        const fmat = new THREE.ShaderMaterial({ uniforms: { uTime: lib.u.uTime, uGain: { value: fireHigh ? 1.0 : 0.8 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: /* glsl */`uniform float uTime; attribute vec4 aC; attribute vec4 aPar; varying vec2 vQ; varying vec3 vP;
            void main(){ vec3 c=aC.xyz; float t=uTime*aPar.w+aPar.z;
              if(aC.w>.5) c.xz+=vec2(2.2*sin(t*.31),5.*sin(t*.17+aPar.z*3.));
              vec2 e=normalize(cameraPosition.xz-c.xz); vec3 rt=vec3(-e.y,0.,e.x);
              // each tongue climbs and sinks at its own rate, and leans as it climbs (its own lean, and a slow sway)
              float climb=.82+.2*sin(t*1.1+aPar.z*2.)+.1*sin(t*2.7+aPar.z);
              float lean=.22*sin(aPar.z*1.7)+.14*sin(t*.5+aPar.z*.6);
              vec3 p=c+rt*(position.x*aPar.x*.5+lean*position.y*position.y*aPar.y*climb)+vec3(0.,position.y*aPar.y*climb,0.);
              vQ=position.xy; vP=vec3(t,aPar.z,aC.w); gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
          fragmentShader: /* glsl */`uniform float uGain; varying vec2 vQ; varying vec3 vP;
            float hh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
            float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y); }
            void main(){ float x=vQ.x, y=vQ.y, t=vP.x, ph=vP.y;
              float n=vn(vec2(x*2.4+ph*3.,y*3.2-t*1.7))*.65+vn(vec2(x*5.+ph,y*7.-t*3.1))*.35;
              float sway=(.2*sin(t*1.6+y*4.)+.1*sin(t*2.9+y*9.+ph))*y;
              float part=smoothstep(.4,.95,y)*(.5+.5*sin(t*.8+ph*5.));
              float xx=abs(abs(x-sway)-.2*part*y)+(n-.5)*.4*y;
              float w=mix(.82,.1,pow(max(y,0.),.8))*(1.-.35*part);
              float body=(1.-smoothstep(w*.45,w,xx))*(1.-smoothstep(.62,1.,y+(n-.5)*.45))*smoothstep(0.,.07,y);
              float core=(1.-smoothstep(0.,w*.6,xx))*(1.-smoothstep(.0,.75,y));
              vec3 col=mix(vec3(.7,.07,.01),vec3(1.25,.42,.06),smoothstep(.15,.75,body*(1.-.6*y)));
              col=mix(col,vec3(1.9,1.25,.45),core*core);
              if(vP.z>.5) col=mix(vec3(.1,.22,1.1),vec3(.55,.8,1.5),core)*.9;
              float al=body*(.55+.45*n);
              gl_FragColor=vec4(col*uGain*(.7+.5*n),al*.92); }` });
        const tongues = new THREE.Mesh(g, fmat); tongues.name = 'fire-tongues'; tongues.renderOrder = 3; scene.add(tongues);
      }
      await ctx.yield();
      // the fire irons lean on the north jamb inside the fender: poker, shovel and tongs, iron with turned brass handles
      { const lean = (x0, z0, x1, z1, len, f) => { const d = new THREE.Vector3(x1 - x0, Math.sqrt(Math.max(len * len - (x1 - x0) ** 2 - (z1 - z0) ** 2, 1)), z1 - z0).normalize();
          const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)).setPosition(x0, 1.0, z0); f((g, l, c, B = IR) => B.add(g, m.clone().multiply(l), c)); };
        const handle = [[0, 0], [0.75, 0], [0.9, 0.6], [0.6, 1.2], [0.95, 2.6], [1.0, 4.4], [0.7, 5.6], [1.05, 6.4], [0.8, 7.2], [0, 7.6]], irn = '#34322f';
        lean(-184, -70, -193.6, -73, 52, (put) => { put(cyl(0.42, 0.5, 44, 8), M4(0, 22, 0), irn); put(lathe(handle, 16), M4(0, 44, 0), BRASS, BR); put(cyl(0.1, 0.5, 2.4, 8), M4(0, -1.2 + 1.2, 0, PI, 0, 0), irn); put(cyl(0.3, 0.42, 3, 6), M4(0.9, 2.2, 0, 0, 0, -1.1), irn); });
        lean(-181, -66, -193.6, -70, 50, (put) => { put(cyl(0.42, 0.42, 38, 8), M4(0, 25, 0), irn); put(lathe(handle, 16), M4(0, 44, 0), BRASS, BR); put(box(6.5, 9, 0.35), M4(0, 3.6, 0, 0.12, 0, 0), irn); put(box(0.35, 9, 1.2), M4(-3.2, 3.6, 0.5), irn); put(box(0.35, 9, 1.2), M4(3.2, 3.6, 0.5), irn); });
        lean(-186.5, -74, -193.6, -76, 50, (put) => { for (const sgn of [-1, 1]) { put(cyl(0.3, 0.36, 44, 6), M4(sgn * 0.9, 22, 0, 0, 0, sgn * 0.035), irn); put(cyl(1.1, 1.1, 0.3, 12), M4(sgn * 1.7, 0.3, 0, 0, 0, PI / 2), irn); }
          put(new THREE.TorusGeometry(1.5, 0.45, 8, 18), M4(0, 45.5, 0), BRASS, BR); }); }
      // the fender's turned posts: a brass baluster with a ball every 19 m along the front
      for (let z = FENDER.z0 + 19; z < FENDER.z1 - 5; z += 19) BR.add(lathe([[0, 0], [1.5, 0], [1.5, 0.7], [0.9, 1.2], [0.75, 4], [1.2, 5.4], [0.7, 7], [0.85, 10], [1.3, 10.6], [1.3, 11.3], [0.7, 11.8], [1.25, 12.9], [1.1, 13.9], [0, 14.5]], 18), M4(FENDER.x + 0.9, 0, z), BRASS);
      await ctx.yield();
      // THE BRASS FENDER: a pierced wall 10 m high, its face at x -160, with returns to the wall, a top rail and corner posts
      const fb = makeBuilder(), F = FENDER, flen = F.z1 - F.z0;
      fb.add(box(0.5, F.h, flen), M4(F.x, F.h / 2, (F.z0 + F.z1) / 2), BRASS);
      for (const z of [F.z0, F.z1]) fb.add(box(40, F.h, 0.5), M4(F.x - 20, F.h / 2, z), BRASS);
      const fenderMat = lib.mat({ name: 'fender', vertexColors: true, grain: true, side: THREE.DoubleSide,
        surface: /* glsl */`{ float al=abs(vN.x)>.5 ? vW.z-uFender.y : vW.x+200.; if(abs(vN.y)<.5 && fret(vec2(al,vW.y))<0.) discard; }` + SURF.brass });
      mesh(fb.build(), fenderMat, 'fender');
      BR.add(cyl(0.75, 0.75, flen + 1.5, 14), M4(F.x, F.h + 0.5, (F.z0 + F.z1) / 2, PI / 2, 0, 0), BRASS);
      BR.add(box(1.4, 1.2, flen + 1), M4(F.x, 0.6, (F.z0 + F.z1) / 2), BRASS);
      for (const z of [F.z0, F.z1]) {
        BR.add(cyl(0.75, 0.75, 40, 14), M4(F.x - 20, F.h + 0.5, z, 0, 0, PI / 2), BRASS); BR.add(box(40, 1.2, 1.4), M4(F.x - 20, 0.6, z), BRASS);
        BR.add(lathe([[0, 0], [2.0, 0], [2.0, 0.8], [1.2, 1.4], [1.0, 9.6], [1.5, 10.2], [1.5, 11], [0.9, 11.6], [1.7, 13], [1.5, 14.3], [0, 15.2]], 24), M4(F.x, 0, z), BRASS);
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the armchair in the south-west corner, turned north to the fire (its legs at
    // CHAIR's corners; the block's own measures are written from a first place, facing west, and carried there whole, a quarter turn):
    // turned walnut legs, a buttoned back with an arched top, rolled arms, wings, a loose seat cushion, brass studs
    {
      const CS = new THREE.Matrix4().makeTranslation((CHAIR.x0 + CHAIR.x1) / 2, 0, (CHAIR.z0 + CHAIR.z1) / 2).multiply(new THREE.Matrix4().makeRotationY(-PI / 2)).multiply(new THREE.Matrix4().makeTranslation(100, 0, 10)), CW = { add: (g, m, c, o) => WD.add(g, CS.clone().multiply(m), c, o) }, CB = { add: (g, m, c) => BR.add(g, CS.clone().multiply(m), c) };
      const wal = '#5c3a22', legP = [[2.1, 0], [2.5, 1.2], [1.9, 2.6], [1.7, 4], [2.4, 8], [2.5, 13], [2.2, 18], [1.7, 20.5], [2.4, 21.6], [2.5, 22.6], [1.9, 23.4], [2.5, 24.2], [2.5, 26]];
      for (const x of [-128, -72]) for (const z of [-38, 18]) { CW.add(lathe(legP, 36), M4(x, 0, z), wal); CW.add(box(5.6, 5, 5.6), M4(x, 28.5, z), wal); lib.addOccF(x + 128 + CHAIR.x0, z + 38 + CHAIR.z0, 2.5, 27); }
await ctx.yield();
      CW.add(box(62, 5, 4), M4(-100, 28.5, -39), wal, { g: 'x' }); CW.add(box(62, 5, 4), M4(-100, 28.5, 19), wal, { g: 'x' });
      CW.add(box(4, 5, 54), M4(-129, 28.5, -10), wal, { g: 'z' }); CW.add(box(4, 5, 54), M4(-71, 28.5, -10), wal, { g: 'z' });
      // under the seat: pale hessian on the frame, and the webbing's straps across it both ways (what one sees from the floor)
      CW.add(box(56, 1, 54), M4(-100, 26.6, -10), '#8b7755', { g: 'x' });
      for (let k = -2; k <= 2; k++) { CW.add(box(5, 0.5, 54), M4(-100 + k * 11, 25.95, -10), '#b39a6c', { g: 'z' }); CW.add(box(56, 0.5, 5), M4(-100, 25.7, -10 + k * 10.5), '#a88f62', { g: 'x' }); }
      const lb = makeBuilder(), LB = { add: (g, m) => lb.add(g, CS.clone().multiply(m)) };
      LB.add(rbox(54, 8, 50, 2.6), M4(-103, 34.6, -10));
      await ctx.yield();
      LB.add(rbox(45, 7.5, 39, 3.4, 4), M4(-105, 41.6, -10));
      await ctx.yield();
      // the back: an arch 62 m wide, 66 m tall, 9 m thick, leaning 0.11 rad away from the fire
      const arch = new THREE.Shape();
      arch.moveTo(-31, 0); arch.lineTo(31, 0); arch.lineTo(31, 44); arch.bezierCurveTo(31, 60, 15, 66, 0, 66); arch.bezierCurveTo(-15, 66, -31, 60, -31, 44); arch.closePath();
      const lean = new THREE.Matrix4().makeRotationZ(-0.11), backM = new THREE.Matrix4().makeTranslation(-78.5, 32, -10).multiply(lean).multiply(new THREE.Matrix4().makeRotationY(PI / 2));
      LB.add(new THREE.ExtrudeGeometry(arch, { depth: 6, bevelEnabled: true, bevelThickness: 2.6, bevelSize: 2.6, bevelSegments: 4, curveSegments: 14 }), backM);
      await ctx.yield();
      // wings: a quarter leaf each side, from the shoulder of the back forward to the arm
      const wing = new THREE.Shape();
      wing.moveTo(0, 0); wing.lineTo(22, 0); wing.bezierCurveTo(27, 8, 27, 30, 15, 40); wing.bezierCurveTo(9, 45, 3, 46, 0, 46); wing.closePath();
      for (const z of [-36, 16]) {
        await ctx.yield();
        LB.add(rbox(50, 15, 10.5, 3.6), M4(-101, 44.6, z));
        await ctx.yield();
        LB.add(cyl(6.4, 6.4, 10.6, 28), M4(-127, 46.2, z, PI / 2, 0, 0));
        LB.add(new THREE.ExtrudeGeometry(wing, { depth: 2.4, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 3, curveSegments: 10 }),
          new THREE.Matrix4().makeTranslation(-72, 51, z < 0 ? -37.2 : 19.6).multiply(lean).multiply(new THREE.Matrix4().makeRotationY(PI)));
      }
      await ctx.yield();
      // leather: creased, worn pale on the rolls; the inner back is buttoned in a diamond quilt 11 m across
      const leather = solid('#5e3323', /* glsl */`{ float n=fbm3(vW*.33), cr=vn3(vW*1.5); float wear=smoothstep(.45,.8,fbm3(vW*.11+5.));
        alb*=(.75+.5*n)*(.92+.16*cr); alb=mix(alb,alb*1.9+vec3(.03,.018,.008),wear*.5); gloss=.5+.2*n;
        float tf=smoothstep(.55,.8,-N.z)*smoothstep(50.,56.,vW.y);
        float qz=vW.x-(${((CHAIR.x0 + CHAIR.x1) / 2).toFixed(1)}); vec2 d=vec2(qz+vW.y,qz-vW.y)/11.; vec2 c=fract(d+.5)-.5, ac=abs(c);
        float pl=min(ac.x,ac.y), r=length(c);
        vec2 gd=(ac.x<ac.y?vec2(sign(c.x),0.):vec2(0.,sign(c.y)))*exp(-pl*9.)*1.1+c/max(r,1e-3)*exp(-r*7.)*1.4;
        N=normalize(N-tf*.5*vec3(0.,gd.x-gd.y,gd.x+gd.y));
        alb*=mix(1.,.45+.55*smoothstep(0.,.16,pl),tf);
        alb=mix(alb,alb*1.7,tf*(1.-smoothstep(.04,.07,r))); }`, { name: 'leather' });
      mesh(lb.build(), leather, 'armchair-leather');
      await ctx.yield();
      // brass studs: along the seat rail's west face, round the arm fronts, round the arch of the outer back, down the wings' edges
      const stud = () => new THREE.SphereGeometry(0.6, 8, 5);
      for (let z = -37; z <= 17.01; z += 2.7) CB.add(stud(), M4(-131.1, 28.5, z), BRASS);
      for (const z of [-36, 16]) for (let i = 0; i < 14; i++) { const a = i * TAU / 14; for (const dz of [-5.4, 5.4]) CB.add(stud(), M4(-127 + Math.cos(a) * 5.5, 46.2 + Math.sin(a) * 5.5, z + dz), BRASS); }
      await ctx.yield();
      const outer = arch.getSpacedPoints(96), sv = new V3(); let ns = 0;
      for (const p of outer) {
        if (p.y < 1) continue;
        // 2.2 m inside the edge of the arch, on the outer (east) face of the back
        const k = 1 - 2.2 / Math.max(Math.hypot(p.x, p.y - 30), 1);
        sv.set(p.x * k, 30 + (p.y - 30) * k, 8.8).applyMatrix4(backM);
        CB.add(stud(), M4(sv.x, sv.y, sv.z), BRASS);
        if (++ns % 24 === 0) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the tall clock against the north wall (case x -186..-146, z -160..-132)
    {
      // its case is ebony black with brass stringing: a line of brass round the long door, round the plinth's panel and round a
      // long panel on each side of the trunk (the sides are what the lane and the climb go by)
      const oak = '#2a2321', oakD = '#1a1514', cx = -166;
      for (const [x0, x1, y0, y1] of [[cx - 10.3, cx + 10.3, 40, 110], [cx - 13, cx + 13, 9, 23]]) { const z = y0 < 30 ? (NZ - 131.3) : (NZ - 135.3);
        for (const x of [x0, x1]) BR.add(box(0.5, y1 - y0, 0.3), M4(x, (y0 + y1) / 2, z), BRASS); for (const y of [y0, y1]) BR.add(box(x1 - x0, 0.5, 0.3), M4((x0 + x1) / 2, y, z), BRASS); }
      for (const sx of [-1, 1]) { const x = cx + sx * 18.1; for (const z of [(NZ - 157), (NZ - 139)]) BR.add(box(0.3, 78, 0.5), M4(x, 75, z), BRASS); for (const y of [36, 114]) BR.add(box(0.3, 0.5, 18), M4(x, y, (NZ - 148)), BRASS); }
      // plinth to y 30 with mouldings
      WD.add(box(40, 26, 28), M4(cx, 15, (NZ - 146)), oak); WD.add(box(43, 4, 30), M4(cx, 2, (NZ - 145.5)), oakD, { g: 'x' }); WD.add(box(42, 2.5, 29.4), M4(cx, 28.8, (NZ - 145.6)), oakD, { g: 'x' });
      WD.add(box(28, 16, 0.8), M4(cx, 16, (NZ - 131.8)), oakD, { g: 'x' });
      // trunk y 30..120: sides, back, and a door frame round the glass (x -176..-156, y 40..110)
      WD.add(box(3, 90, 24), M4(cx - 16.5, 75, (NZ - 148)), oak); WD.add(box(3, 90, 24), M4(cx + 16.5, 75, (NZ - 148)), oak);
      WD.add(box(36, 90, 1.5), M4(cx, 75, (NZ - 159)), '#2c1a10');
      WD.add(box(8, 90, 2.4), M4(cx - 14, 75, (NZ - 136.6)), oak); WD.add(box(8, 90, 2.4), M4(cx + 14, 75, (NZ - 136.6)), oak);
      WD.add(box(20, 10, 2.4), M4(cx, 35, (NZ - 136.6)), oak, { g: 'x' }); WD.add(box(20, 10, 2.4), M4(cx, 115, (NZ - 136.6)), oak, { g: 'x' });
      // hood y 120..170, cornice, the dial's ring
      WD.add(box(42, 50, 28), M4(cx, 145, (NZ - 146)), oak); WD.add(box(46, 3, 31), M4(cx, 121, (NZ - 145.5)), oakD, { g: 'x' }); WD.add(box(47, 4.5, 32), M4(cx, 171, (NZ - 145)), oakD, { g: 'x' }); WD.add(box(44, 3, 30), M4(cx, 175, (NZ - 145.5)), oak, { g: 'x' });
      for (const dx of [-17, 17]) { WD.add(lathe([[1.6, 0], [1.9, 2], [1.4, 4], [1.5, 40], [1.9, 42], [1.6, 44]], 16), M4(cx + dx, 123, (NZ - 130.6)), oakD); BR.add(lathe([[0, 0], [1.4, 0], [0.8, 1.5], [1.9, 3.5], [1.2, 5.5], [0, 7.5]], 16), M4(cx + dx, 176.5, (NZ - 133)), BRASS); }
      // the dial, 28 m across at y 145: ticks and two hands, no numerals
      const dial = new THREE.Mesh(new THREE.CircleGeometry(14, 64), lib.mat({ name: 'dial', surface: /* glsl */`{ vec2 q=(vUv-.5)*28.; float r=length(q), a=atan(q.y,q.x);
        float aa=max(fwidth(r),.03);
        alb=mix(vec3(.62,.52,.3),vec3(.5,.36,.13),smoothstep(10.8,11.,r)); metal=smoothstep(10.8,11.,r)*.9; gloss=mix(.2,.6,metal);
        float tm=abs(fract(a*60./6.2832)-.5)*6.2832/60.*r, th=abs(fract(a*12./6.2832)-.5)*6.2832/12.*r;
        float ink=(1.-smoothstep(.1,.1+aa,tm))*step(9.4,r)*step(r,10.4);
        ink=max(ink,(1.-smoothstep(.32,.32+aa,th))*step(8.2,r)*step(r,10.4));
        ink=max(ink,1.-smoothstep(.12,.12+aa,abs(r-10.6))); ink=max(ink,1.-smoothstep(.08,.08+aa,abs(r-8.)));
        alb=mix(alb,vec3(.03,.025,.02),ink*step(r,10.8)); }` }));
      dial.position.set(cx, 145, (NZ - 131.9)); dial.name = 'dial'; scene.add(dial);
      const handG = (len, w) => { const g = box(w, len, 0.3); g.translate(0, len * 0.38, 0); return g; };
      const handMat = solid('#15120f', '{ gloss=.5; metal=.6; }', { name: 'hands' });
      const hMin = new THREE.Mesh(handG(11.5, 0.8), handMat), hHour = new THREE.Mesh(handG(8, 1.3), handMat);
      hMin.position.set(cx, 145, (NZ - 131.5)); hHour.position.set(cx, 145, (NZ - 131.65)); hMin.name = 'clock-hand-minute'; hHour.name = 'clock-hand-hour'; scene.add(hMin, hHour);
      const h0 = R.clock.range(0, TAU), pendPh = R.clock.range(0, TAU);
      // the pendulum behind the glass: rod from y 118, bob 9 m across with its lowest point at y 46, 7 m each way, period 4 s
      const pend = new THREE.Group(); pend.position.set(cx, 118, (NZ - 148));
      const pb = makeBuilder();
      pb.add(box(0.9, 63, 0.35), M4(0, -31.5, 0), BRASS); pb.add(lathe([[0, -0.9], [2.4, -0.75], [4.2, -0.3], [4.5, 0], [4.2, 0.3], [2.4, 0.75], [0, 0.9]], 40), M4(0, -67.5, 0, PI / 2, 0, 0), BRASS);
      pb.add(cyl(0.5, 0.5, 2, 10), M4(0, -73, 0), BRASS);
      const pendMesh = new THREE.Mesh(pb.build(), brassMat); pendMesh.name = 'pendulum'; pend.add(pendMesh); scene.add(pend);
      const swing = Math.asin(7 / 67.5);
      // two brass weights on their chains
      // (each weight a turned brass cylinder with a cap and a hook; each chain a string of links 0.8 m long)
      for (const [dx, y] of [[-7.5, 78], [7, 92]]) {
        BR.add(lathe([[0, -5.4], [1.9, -5.4], [2.2, -5], [2.2, 4.4], [1.9, 5], [0.7, 5.3], [0.5, 6.2], [0.9, 6.8], [0.5, 7.4], [0, 7.5]], 24), M4(cx + dx, y, (NZ - 151)), BRASS);
        const links = [], top = 118 - y - 7.5; for (let k = 0; k * 0.8 < top; k++) links.push([k % 2 ? 0.42 : 0.2, k * 0.8]);
        BR.add(lathe(links, 8), M4(cx + dx, y + 7.5, (NZ - 151)), '#a08a52'); }
      // the escapement, set behind the top of the door's glass where the line can see it: a brass wheel 15 m across, of twenty
      // long teeth, that steps one tooth (18 degrees: 2.3 m at its rim) each second, and over it the anchor rocking with the pendulum
      const wheel = new THREE.Mesh(new THREE.CircleGeometry(7.5, 80), lib.mat({ name: 'escape-wheel', side: THREE.DoubleSide, surface: /* glsl */`{ vec2 q=(vUv-.5)*15.; float r=length(q), a=atan(q.y,q.x);
        float saw=fract(a*20./6.2832); float rim=5.6+1.85*saw*saw;
        float spoke=step(abs(sin(a*2.5)),.12)+step(r,1.5)+step(4.7,r);
        if(r>rim || spoke<.5) discard;
        alb=vec3(.79,.63,.29)*(.8+.3*vn(q*3.)); metal=1.; gloss=.7; }` }));
      wheel.position.set(cx, 103, (NZ - 146.4)); wheel.name = 'escape-wheel'; scene.add(wheel);
      const anchorG = new THREE.TorusGeometry(8.35, 0.5, 8, 24, 1.5); anchorG.rotateZ(PI / 2 - 0.75); anchorG.translate(0, -9.5, 0);
      const anchor = new THREE.Mesh(anchorG, brassMat); anchor.position.set(cx, 103 + 10, (NZ - 146.2)); anchor.name = 'anchor'; scene.add(anchor);
      // the door's glass
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(20, 70), lib.mat({ name: 'clock-glass', transparent: true, depthWrite: false,
        surface: /* glsl */`{ float ndv=clamp(dot(N,V),0.,1.); alb=vec3(.02,.025,.03); gloss=.2; alpha=.05+.3*pow(clamp(1.-ndv,0.,1.),3.);
          // the fire in the glass: its mirrored light, a soft upright streak that slides as the flames sway and as the eye goes by
          vec3 Rg=reflect(-V,N), Lg=normalize(uFirePos+vec3(0.,10.,0.)-vW); vec2 dg=Rg.xz-Lg.xz;
          float mir=exp(-dot(dg,dg)*190.)*smoothstep(-.5,.3,dot(Rg,Lg));
          emis=uFireCol*.45*mir*(.6+.4*vn(vec2(vW.x*.6,vW.y*.15))); alpha=clamp(alpha+.38*mir,0.,1.); }`,
        post: 'col=min(col,vec3(.25)+emis)+uLampCol*.02+uFireCol*.02;' }));
      glass.position.set(cx, 75, (NZ - 136.2)); glass.renderOrder = 3; glass.name = 'clock-glass'; scene.add(glass);
      lib.addOccF(cx, (NZ - 146), 15, 172);
      tick.push((dt, time) => {
        const sw = TAU * time / 4 + pendPh, beat = sw / (PI / 2), bf = beat - Math.floor(beat);
        pend.rotation.z = swing * Math.sin(sw);
        wheel.rotation.z = -(Math.floor(beat) + smoothstep(0, 0.16, bf)) * (TAU / 20); anchor.rotation.z = 0.1 * Math.sin(sw);
        // the minute hand goes on one notch at each pass of the bob through the middle
        const m = h0 - Math.floor(sw / PI) * (TAU / 60);
        hMin.rotation.z = m; hHour.rotation.z = h0 * 0.37 + m / 12;
      });
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the rug (x -125..80, z -55..50, pile 1 m), its west fringe, the dropped quill
    {
      const rr = R.rug;
      const red = new THREE.Color('#5c1713').lerp(new THREE.Color('#74241a'), rr()), blue = new THREE.Color('#1c2746').lerp(new THREE.Color('#27405e'), rr()), cream = new THREE.Color('#9c8a5e').lerp(new THREE.Color('#86764a'), rr());
      const rg = rbox(205, 1.0, 105, 0.42, 2); rg.translate(-22.5, 0.5, -2.5);
      const rugMat = lib.mat({ name: 'rug', occF: true, uniforms: { uRugA: { value: new V3(red.r, red.g, red.b) }, uRugB: { value: new V3(blue.r, blue.g, blue.b) }, uRugC: { value: new V3(cream.r, cream.g, cream.b) } },
        pars: 'uniform vec3 uRugA, uRugB, uRugC;', surface: /* glsl */`{
          vec2 p=vW.xz, q=p-vec2(-22.5,-2.5); vec2 e2=vec2(102.5,52.5)-abs(q); float e=min(e2.x,e2.y);
          vec2 d=q/vec2(17.,13.); vec2 dd=vec2(d.x+d.y,d.x-d.y); vec2 di=floor(dd), df=fract(dd)-.5;
          float loz=max(abs(df.x),abs(df.y)), h=h21(di);
          vec3 field=mix(uRugA,uRugB,step(.55,h));
          field=mix(field,uRugC,(1.-step(.1,loz))*.9); field=mix(field,mix(uRugB,uRugA,step(.55,h))*.8,step(.2,loz)*(1.-step(.26,loz)));
          field=mix(field,uRugA*.45,smoothstep(.44,.47,loz));
          float per=e2.x<e2.y ? q.y : q.x;
          vec3 border=mix(uRugB*.8,uRugC,step(.5,fract(per/3.4))*step(4.2,e)*step(e,7.));
          border=mix(border,uRugA,step(e,3.2)); border=mix(border,uRugC*.8,step(8.2,e));
          alb=mix(field,border,step(e,9.));
          vec2 ki=floor(p/.45); alb*=(.78+.4*h21(ki))*(.9+.2*vn(p*1.3));
          gloss=.015; wrap=.55; }` });
      mesh(rg, rugMat, 'rug');
      await ctx.yield();
      // sixty wool tassels along the west edge: each 9 m long, lying west and curling up; no tip's middle west of x -133.5,
      // south of z 50 or higher than 2.2 m: the line crosses the fringe's south end at the lane's height, 2 m and more over them
      const fr = R.fringe, tb = makeBuilder();
      for (let i = 0; i < 60; i++) {
        const z0 = -54.2 + i * (104.4 / 59), yaw = fr.range(-0.32, 0.32) - (z0 > 40 ? 0.25 : 0), curl = fr.range(1, 2.2), reach = fr.range(6.6, 8.6), bend = fr.range(-1.2, 1.2);
        const dz = Math.sin(yaw), dx = -Math.cos(yaw);
        const at = (t, y, side) => [Math.max(-133.5, -125 + dx * reach * t - Math.abs(dz) * 0.2 * t), y, Math.min(49.6, z0 + dz * reach * t + bend * side)];
        const pts = [[-124.6, 0.75, z0], at(0.14, 0.42, 0), at(0.4, 0.3, 0.5), at(0.68, 0.3 + curl * 0.08, 1), at(0.88, curl * 0.5, 0.8), at(0.97, curl * 0.92, 0.45 + fr.range(-0.5, 0.5))];
        tb.add(tube(pts, fr.range(0.22, 0.29), 14, 6), null, [fr.range(0.8, 1.05), fr.range(0.78, 1), fr.range(0.7, 0.95)]);
        if (i % 3 === 2) await ctx.yield();
      }
      const woolMat = lib.mat({ name: 'fringe', vertexColors: true, occF: true, uniforms: { uCol: { value: lin3('#b9a987') } }, pars: 'uniform vec3 uCol;',
        vert: 'p.z+=.16*uv.x*uv.x*sin(uTime*1.1+position.z*.9); p.y+=.08*uv.x*uv.x*sin(uTime*1.7+position.z*1.3);',
        surface: '{ alb*=uCol*(.72+.28*sin(vUv.x*130.+vUv.y*12.566))*(.85+.3*vn(vW.xz*3.)); gloss=.03; wrap=.5; }' });
      mesh(tb.build(), woolMat, 'fringe');
    }
    await ctx.yield();
    {
      // THE QUILL: a dropped goose quill 28 m long on the bare boards before the fender (QUILL: root to tip); vane up to 4 m
      // high, barbs split in places
      const A = new V3(QUILL.a[0], 0.5, QUILL.a[1]), B = new V3(QUILL.b[0], 1.5, QUILL.b[1]), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
      const side = new V3(-dir.z, 0, dir.x), qr = R.quill;
      const shaft = [], NS = 40;
      for (let i = 0; i <= NS; i++) { const s = i / NS; shaft.push(A.clone().addScaledVector(dir, s * len).add(new V3(0, 1.3 * Math.sin(s * PI) * s, 0))); }
      const qb = makeBuilder();
      qb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shaft), 40, 0.42, 8, false), null, '#d9d2bd');
      await ctx.yield();
      const P = [], Nn = [], U = [], I = [];
      for (const sg of [-1, 1]) {
        const NA = 6, n0 = P.length / 3;
        for (let i = 0; i <= NS; i++) {
          const s = i / NS, sv = clamp((s - 0.2) / 0.8, 0, 1), wdt = (sg < 0 ? 3.3 : 4.4) * Math.pow(Math.sin(Math.pow(sv, 0.8) * PI), 0.6) * (0.85 + 0.15 * Math.sin(s * 37));
          for (let j = 0; j <= NA; j++) {
            const a = j / NA, rise = sg > 0 ? 0.95 : 0.3, out = wdt * a, up = wdt * a * rise * (0.6 + 0.4 * a);
            const p = shaft[i].clone().addScaledVector(side, sg * out * Math.sqrt(Math.max(1 - rise * rise * 0.8, 0.05))).add(new V3(0, up, 0)).addScaledVector(dir, 0.9 * a * wdt * 0.3);
            P.push(p.x, Math.max(p.y, 0.12), p.z); Nn.push(sg * side.x * 0.5, 0.86, sg * side.z * 0.5); U.push(s, a * sg);
          }
          if (i > 0) for (let j = 0; j < NA; j++) { const a0 = n0 + (i - 1) * (NA + 1) + j, b0 = a0 + 1, c0 = a0 + NA + 1, d0 = c0 + 1; I.push(a0, c0, b0, b0, c0, d0); }
        }
      }
      const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); vg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); vg.setIndex(I); vg.computeVertexNormals();
      await ctx.yield();
      const so = qr.range(0, 10);
      const vaneMat = lib.mat({ name: 'quill-vane', side: THREE.DoubleSide, uniforms: { uSo: { value: so } }, pars: 'uniform float uSo;',
        vert: '{ float a=abs(uv.y); p.y+=.12*a*a*sin(uTime*2.3+uv.x*40.)+.07*a*sin(uTime*3.7+uv.x*93.); }',
        surface: /* glsl */`{ float a=abs(vUv.y), s=vUv.x; float bi=floor(s*46.+a*5.+uSo), hsh=h21(vec2(bi,sign(vUv.y)+uSo));
          float split=step(.8,hsh)*smoothstep(.25+.5*h21(vec2(bi,7.)),1.,a+.25*abs(fract(s*46.+a*5.+uSo)-.5));
          if(split>.42) discard;
          float barb=.82+.18*sin((s*46.+a*5.)*6.2832*6.);
          alb=vec3(.78,.75,.68)*barb*(.75+.25*a); gloss=.12; wrap=.6; }` });
      mesh(vg, vaneMat, 'quill-vane');
      mesh(qb.build(), solid('#ffffff', '{ alb=vC*(.9+.1*vn(vW.xz*2.)); gloss=.45; }', { name: 'quill-shaft', vertexColors: true }), 'quill-shaft');
      for (const s of [0.3, 0.55, 0.8]) { const p = shaft[Math.round(s * NS)]; lib.addOccF(p.x, p.z, 1.6, 3.2); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the great curtain, drawn to the west (x -112..30), hung from the rod 20 m
    // over the tall window's head, z 156: HEAVY DARK RED CLOTH IN DEEP SOFT FOLDS with a border of old gold at the hem (A6); the
    // draught bellies it into the room: the hem lies at z 132 at rest and breathes out to z 118 (114 in rain) and back in 9 s
    {
      const ROD = WIN.y1 + 20, X0 = -112, X1 = 30, Y0 = 3, Y1 = ROD - 3, TALL = (Y1 - Y0).toFixed(1), NX = 112, NY = 44, P = [], U = [], I = [];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { P.push(X0 + (X1 - X0) * i / NX, Y1 + (Y0 - Y1) * j / NY, 156); U.push(i / NX, j / NY); }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; I.push(a, b, c, b, d, c); }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      cg.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length).fill(0).map((v, k) => (k % 3 === 2 ? -1 : 0)), 3)); cg.setIndex(I);
      cg.boundingSphere = new THREE.Sphere(new V3(-41, (Y0 + Y1) / 2, 135), 190);
      await ctx.yield();
      const cu = { uBelly: { value: new THREE.Vector2(156 - 132, 156 - breathZ) }, uCloth: { value: lin3('#6a1d1a') }, uBand: { value: lin3('#a07c36') }, uGlowK: { value: moon ? 1 : 0.45 },
        // the breath's, the fold drift's and the hem ripple's phases, the tied curtain's stir: from the curtain's own stream
        uPh: { value: new THREE.Vector4(R.curtain.range(0, TAU), R.curtain.range(0, TAU), R.curtain.range(0, TAU), R.curtain.range(0, TAU)) } };
      const CLOTH_PARS = 'uniform vec2 uBelly; uniform vec3 uCloth, uBand; uniform float uGlowK; uniform vec4 uPh;';
      const CLOTH_SURF = /* glsl */`{
        // every fine figure of the cloth fades to its own mean where it is drawn smaller than its own width (pw: metres to a
        // picture point): the weave first, then the slub, then the border's lozenges and the key
        float pw=fwidth(vW.x)+fwidth(vW.y);
        // (no thread is ruled on it: the cloth's nap is a soft grain, and it shines a little where it is seen aslant, as velvet does)
        float th=(vn(vW.xy*vec2(2.3,1.1))-.5)*clamp(1.-pw*1.2,0.,1.), slub=mix(.5,fbm(vec2(vW.x*.21,vW.y*.07)),clamp(1.-pw*.6,0.,1.));
        alb=uCloth*(.9+.3*th)*(.72+.56*slub);
        alb*=1.+.9*pow(1.-clamp(abs(dot(N,V)),0.,1.),2.);
        float band=smoothstep(11.,12.,vW.y)*(1.-smoothstep(17.,18.,vW.y))+smoothstep(21.,21.6,vW.y)*(1.-smoothstep(23.4,24.,vW.y));
        alb=mix(alb,uBand*(.8+.3*th),band*.85);
        // the woven border between the two gold bands: a chain of lozenges with a small cross in each, on a madder ground, and a
        // running key above the upper band (figures only)
        { float by=(vW.y-14.5)/3.; float inB=1.-smoothstep(.9,1.,abs(by)); vec2 c=vec2(fract(vW.x/7.)-.5,by*.5);
          float loz=abs(c.x)+abs(c.y); float fig=(1.-smoothstep(.34,.38,loz))*smoothstep(.2,.24,loz)+(1.-smoothstep(.07,.1,min(abs(c.x),abs(c.y))))*(1.-smoothstep(.12,.16,loz));
          fig=mix(.28,fig,clamp(1.5-pw*2.5,0.,1.));
          vec3 madder=vec3(.3,.045,.035); alb=mix(alb,mix(madder,uBand*1.25,fig)*(.8+.3*th),inB*band);
          float ky=(vW.y-27.5)/1.6; vec2 kq=vec2(fract(vW.x/5.),ky); float key=step(abs(ky),1.)*(step(.9,abs(ky))+step(kq.x,.14)*step(0.,ky*sign(fract(vW.x/10.)-.5)));
          key=mix(.35*step(abs(ky),1.),key,clamp(1.5-pw*2.,0.,1.));
          alb=mix(alb,uBand*(.75+.3*th),key*.8); }
        alb*=.7+.3*smoothstep(3.,7.,vW.y);
        gloss=.02; wrap=.35;
        // the folds: the same wave the cloth is hung in; its hollows hold the shade
        { float cv=(${Y1.toFixed(1)}-vW.y)/${TALL}, ph=vW.x*.3+1.7*sin(vW.x*.071+1.3)+1.2*sin(cv*2.2+vW.x*.02)+.4*sin(uTime*.35+vW.x*.03+uPh.y);
          float hollow=1.-smoothstep(-1.,.7,sin(ph)*(gl_FrontFacing?1.:-1.));
          // THE FALL IS NEVER A BLACK WALL (D3): wool holds light. Into its hollows comes what the room's two flames throw across
          // the boards and up the cloth: the fire's from the west (it beats with the fire and is strongest low and to the west,
          // by its distance), and the lamp's far gold; both small, both by place
          vec3 fq=vW-uFirePos, lq=vW-uLampPos;
          vec3 glowIn=uFireCol*(.2/(1.+dot(fq,fq)/(170.*170.)))*(.55+.45*exp(-vW.y/70.))+uLampCol*(.05/(1.+dot(lq,lq)/(200.*200.)));
          emis+=alb*glowIn*(.5+.5*hollow);
          alb*=.22+.78*(1.-hollow);
          // THE BLUE RIM FROM THE NIGHT: the flank of each fold that is turned toward the open light, and the cloth's free edge
          // beside it, catch the night's blue, the more the nearer the open light
          emis+=uNight*.55*smoothstep(.15,.85,N.x)*(1.-hollow)*exp(-max(${X1}.-vW.x,0.)/60.)*(.6+.4*slub); }
        // the night comes through the cloth where the shut light stands behind it
        vec2 wq=smoothstep(vec2(${WIN.wx0}.,${WIN.y0}.)-6.,vec2(${WIN.wx0}.,${WIN.y0}.)+10.,vW.xy)*(1.-smoothstep(vec2(${WIN.wx1}.,${WIN.y1}.)-10.,vec2(${WIN.wx1}.,${WIN.y1}.)+6.,vW.xy));
        float bars=1.-.6*(1.-smoothstep(.0,1.6,abs(fract(vW.x/26.)-.5)*26.))-.5*(1.-smoothstep(0.,1.4,abs(fract((vW.y-56.)/30.)-.5)*30.));
        emis+=uNight*.35*uGlowK*alb*wq.x*wq.y*clamp(bars,0.,1.); }`;
      const CLOTH_VERT = /* glsl */`{ float v=uv.y, x=position.x;
          float B=mix(uBelly.x,uBelly.y,.5-.5*cos(uTime*6.2832/9.+uPh.x));
          float vc=clamp(v,0.,1.), f=vc*sqrt(vc), fd=1.5*sqrt(max(vc,1e-4));
          float edge=smoothstep(0.,.06,uv.x)*(.35+.65*(1.-smoothstep(.8,1.,uv.x)));
          float k=.3+.1207*cos(x*.071+1.3), ph=x*.3+1.7*sin(x*.071+1.3)+1.2*sin(v*2.2+x*.02)+.4*sin(uTime*.35+x*.03+uPh.y);
          // deep folds: gathered at the rod, fuller toward the hem
          float a=5.+5.5*v;
          float rip=.45*v*sin(v*24.-uTime*1.5+x*.07+uPh.z);
          p.z=156.-B*f*edge-a*sin(ph)-rip;
          float zx=-a*k*cos(ph)-.0315*v*cos(v*24.-uTime*1.5+x*.07+uPh.z);
          float zy=(B*fd*edge+5.5*sin(ph)+.45*(sin(v*24.-uTime*1.5+x*.07+uPh.z)+v*24.*cos(v*24.-uTime*1.5+x*.07+uPh.z)))/${TALL};
          n=normalize(vec3(zx,zy,-1.)); }`;
      const curtainMat = lib.mat({ name: 'curtain', side: THREE.DoubleSide, uniforms: cu, pars: CLOTH_PARS, vpars: 'uniform vec2 uBelly; uniform vec4 uPh;',
        vert: CLOTH_VERT,
        surface: CLOTH_SURF });
      mesh(cg, curtainMat, 'curtain');
      // the fringe at the hem: threads 3 m long that hang from the hem and go where it goes (the same law, taken at the hem), cut by the surface
      { const FP = [], FU = [], FI = [];
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= NX; i++) { FP.push(X0 + (X1 - X0) * i / NX, Y0 - 2.8 * j, 156); FU.push(i / NX, 1); }
        for (let i = 0; i < NX; i++) { const a = i, b = a + 1, c = a + NX + 1, d = c + 1; FI.push(a, b, c, b, d, c); }
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(FP, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(FU, 2));
        fg.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(FP.length).map((v, k) => (k % 3 === 2 ? -1 : 0)), 3)); fg.setIndex(FI);
        fg.boundingSphere = new THREE.Sphere(new V3(-41, 2, 135), 120);
        mesh(fg, lib.mat({ name: 'curtain-fringe', side: THREE.DoubleSide, uniforms: cu, pars: CLOTH_PARS, vpars: 'uniform vec2 uBelly; uniform vec4 uPh;', vert: CLOTH_VERT,
          surface: /* glsl */`{ float t=fract(vW.x*1.1), d=(3.-vW.y)/2.8; float knot=1.-smoothstep(.05,.16,d);
            if(abs(t-.5)>mix(.2,.42,knot)+.06*sin(vW.x*9.+d*5.)) discard;
            alb=uBand*(.7+.5*vn(vec2(vW.x*3.,vW.y*.7)))*(1.-.35*d); gloss=.08; wrap=.5; }` }), 'curtain-fringe'); }
      // the brass rod with its finials, and rings
      BR.add(cyl(1.2, 1.2, 246, 16), M4(3, ROD, 156, 0, 0, PI / 2), BRASS);
      for (const x of [-120, 126]) BR.add(lathe([[0, -3], [1.6, -2.6], [2.6, -1], [2.8, 0.4], [2, 2], [0.9, 3], [0, 3.4]], 20), M4(x, ROD, 156, 0, 0, x < 0 ? PI / 2 : -PI / 2), BRASS);
      for (let x = -108; x <= 28; x += 11.3) BR.add(new THREE.TorusGeometry(2.3, 0.35, 8, 20), M4(x, ROD - 0.8, 156, 0, PI / 2, 0), BRASS);
      for (const x of [-116, 122]) BR.add(box(1.2, 1.2, 6), M4(x, ROD, 158.5), BRASS);
      // the narrow tied curtain on the east side (x 116..124), which stirs
      const tg = lathe([[3.6, 3], [4.2, 10], [3.9, 50], [2.6, 82], [1.5, 92], [2.4, 100], [3.9, 130], [4.3, 180], [4.0, 193]], 18); tg.scale(1, Y1 / 193, 0.55); tg.translate(120, 0, 154.5);
      const tiedMat = lib.mat({ name: 'tied-curtain', uniforms: cu, pars: CLOTH_PARS, vpars: 'uniform vec4 uPh;',
        vert: `p.x+=(.5+.5*sin(position.y*.05))*.5*sin(uTime*.7+position.y*.03+uPh.w)*(1.-smoothstep(60.,${Y1.toFixed(1)},position.y));`,
        surface: CLOTH_SURF + '{ float fold=sin(atan(vN.z,vN.x)*9.+vW.y*.02); alb*=.75+.25*fold; emis*=0.; }' });
      mesh(tg, tiedMat, 'tied-curtain');
      BR.add(new THREE.TorusGeometry(1.9, 0.5, 8, 18), M4(120, 92, 154.5, PI / 2, 0, 0), '#8a6a34');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the window: stone sills, the shut west light, the open east light's two
    // casement leaves standing open OUTWARD beyond the wall (z 184), and the night sky outside (sky only)
    // (two sheets of one night: the south one beyond the open light, without the moon; the east one beyond the east light, with it.
    // uBank: the height of the cloud bank's top on the sheet; uDisc: the moon's radius on it; uStarK: the stars' spacing on it,
    // wider on the east sheet, which the eye comes near)
    const skyU = { uTime: lib.u.uTime, uMoon: { value: new THREE.Vector3(0, 0, 0) }, uTop: { value: lin3('#070c22') }, uLow: { value: lin3('#1c2c58') }, uSo: { value: R.sky.range(0, 100) }, uBank: { value: -330 }, uDisc: { value: 16 }, uStarK: { value: 2.2 }, uGlow: { value: SKY.band } };
    const skyE = { ...skyU, uMoon: { value: new THREE.Vector3(0, 0, 1) }, uSo: { value: R.sky.range(0, 100) }, uBank: { value: -330 }, uDisc: { value: 46 }, uStarK: { value: 2.6 }, uGlow: { value: 0 } };
    {
      for (const [xa, xb] of [[WIN.x0 - 4, WIN.x1 + 4], [WIN.wx0 - 4, WIN.wx1 + 4]]) { ST.add(box(xb - xa, 4.3, 31), M4((xa + xb) / 2, WIN.y0 - 1.85, 169.5), '#8f8678'); }
      const paint = '#b9b2a2', fb = makeBuilder();
      // the shut west light: frame, mullions and glazing bars before dark panes
      const wx = (WIN.wx0 + WIN.wx1) / 2, ww = WIN.wx1 - WIN.wx0, wh = WIN.y1 - WIN.y0, wy = (WIN.y0 + WIN.y1) / 2;
      for (let k = 0; k <= 5; k++) fb.add(box(k % 5 === 0 ? 4 : 2.2, wh, 2.4), M4(WIN.wx0 + ww * k / 5 + (k === 0 ? 2 : k === 5 ? -2 : 0), wy, 174), paint);
      for (let k = 0; k <= 4; k++) fb.add(box(ww, k % 4 === 0 ? 4 : 1.8, 2.2), M4(wx, WIN.y0 + wh * k / 4 + (k === 0 ? 2 : k === 4 ? -2 : 0), 174), paint, { g: 'x' });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 uTop, uLow; varying vec2 vUv; void main(){ gl_FragColor=vec4(mix(uLow,uTop,vUv.y)*.55,1.); }' }));
      pane.rotation.y = PI; pane.position.set(wx, wy, 175.2); pane.name = 'shut-panes'; scene.add(pane);
      // the two leaves of the open light, hinged at the jambs, 36 m each, standing outward
      const leaves = [];
      for (const sgn of [-1, 1]) {
        const lb = makeBuilder(), W = 36, Hh = wh;
        for (const x of [1.5, W / 2, W - 1.5]) lb.add(box(x === W / 2 ? 1.6 : 3, Hh, 1.8), M4(x, 0, 0), paint);
        for (let k = 0; k <= 4; k++) lb.add(box(W, k % 4 === 0 ? 3 : 1.5, 1.7), M4(W / 2, -Hh / 2 + Hh * k / 4 + (k === 0 ? 1.5 : k === 4 ? -1.5 : 0), 0), paint, { g: 'x' });
        const g = new THREE.Group(); g.position.set(sgn < 0 ? WIN.x0 : WIN.x1, wy, WIN.zOut + 1.2);
        const m = new THREE.Mesh(lb.build(), woodMat); m.name = 'casement-leaf'; g.add(m);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(W - 4, Hh - 4), lib.mat({ name: 'casement-glass', transparent: true, depthWrite: false, side: THREE.DoubleSide, 
          surface: /* glsl */`{ float ndv=clamp(abs(dot(N,V)),0.,1.); alb=vec3(.35,.45,.6); gloss=.95;
            float col_=floor(vUv.x*46.), sp=.25+.6*h21(vec2(col_,3.)), y=fract(vUv.y*1.3+uTime*sp*.16+h21(vec2(col_,9.)));
            float streak=uRain*step(.55,h21(vec2(col_,5.)))*smoothstep(.0,.08,y)*(1.-smoothstep(.2,.5,y))*(1.-smoothstep(.2,.45,abs(fract(vUv.x*46.)-.5)));
            emis=(uNight*.5+uMoonCol*.25)*streak;
            alpha=.08+.45*pow(clamp(1.-ndv,0.,1.),3.)+.5*streak; }` }));
        gl.position.set(W / 2, 0, 0); gl.renderOrder = 3; gl.name = 'casement-glass'; g.add(gl);
        g.rotation.y = sgn < 0 ? -(PI / 2 + LEAF) : -(PI / 2 - LEAF);
        scene.add(g); leaves.push({ g, base: g.rotation.y, ph: R.windowS.range(0, TAU), ph2: R.windowS.range(0, TAU) });
      }
      tick.push((dt, time) => { for (const l of leaves) l.g.rotation.y = l.base + 0.025 * Math.sin(time * 0.45 + l.ph) + 0.008 * Math.sin(time * 1.7 + l.ph2); });
      // the night sky: one far sheet south of the house
      const skyMat = (uniforms) => new THREE.ShaderMaterial({ uniforms, depthWrite: false,
        vertexShader: 'varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: /* glsl */`uniform float uTime, uSo, uBank, uDisc, uStarK, uGlow; uniform vec3 uMoon, uTop, uLow; varying vec2 vP;
          ${GLSL_NOISE}
          // THE NIGHT IN THE WINDOW (sky only: no land, no roof, no water). A sky graded from a deep blue overhead to a paler glow
          // low down; stars of three sizes and many strengths, the small ones many and faint, the great ones few, each soft, each
          // with its own colour and twinkle, thicker along one pale band; low down a bank of cloud that drifts, dark where it is
          // thick and silver where the moon's light catches its upper edges; the moon with a soft ring round it
          float star(vec2 p, float cell, float keep, float size, float so){ vec2 c=p/cell+so, ci=floor(c), cf=fract(c)-.5; float hs=h21(ci);
            vec2 o=(vec2(h21(ci+3.1),h21(ci+7.7))-.5)*.7; float d=length(cf-o)*cell, r=size*(.6+.8*h21(ci+5.3));
            float tw=.7+.3*sin(uTime*(1.2+3.*hs)+hs*40.);
            return step(keep,hs)*exp(-d*d/(r*r))*tw*(.25+1.6*pow(clamp((hs-keep)/(1.-keep),0.,1.),2.)); }
          void main(){ vec2 p=vP; float h=clamp((p.y+650.)/1300.,0.,1.);
            float md=length(p-uMoon.xy);
            vec3 col=mix(uLow,uTop,smoothstep(.3,.95,h))*.75+vec3(.035,.06,.1)*exp(-max(p.y-uBank-10.,0.)/170.);
            float band=smoothstep(.35,.7,fbm(vec2(p.x*.0016+p.y*.0011,p.y*.0035-p.x*.0012)+uSo));
            vec3 st=vec3(.75,.84,1.)*star(p,5.*uStarK,.74-.22*band,.9,uSo)*.5+vec3(.9,.92,1.)*star(p,13.*uStarK,.62,1.7,uSo+17.)+vec3(1.,.9,.74)*star(p,37.*uStarK,.7,3.,uSo+41.)*1.5;
            col+=st*(.55+.45*smoothstep(-200.,150.,p.y))+vec3(.02,.03,.05)*band;
            // (the south night's paler band low down, uGlow: the last of the day's light over the cloud bank, strongest at the
            // bank's top and gone a third of the way up the open light; the stars stand in it)
            col+=uGlow*mix(vec3(.2,.3,.46),vec3(.07,.12,.26),smoothstep(0.,190.,p.y-uBank))*exp(-max(p.y-uBank-60.,0.)/150.);
            // the cloud bank: its top edge rolls between the height of the sill and a third of the way up the open light
            float cx=p.x*.0038+uTime*.004, top=uBank+150.*fbm(vec2(cx,3.+uSo))+60.*fbm(vec2(cx*3.1,9.));
            float body=smoothstep(40.,-50.,p.y-top+40.*(fbm(p*.012+vec2(uTime*.01,0.))-.5));
            float rim=body*(1.-smoothstep(0.,70.,top-p.y))*(.35+.65*fbm(p*.02+7.));
            float lit=exp(-md/420.);
            col=mix(col,vec3(.012,.018,.035)+vec3(.05,.065,.1)*fbm(p*.006+uSo)*(.4+lit),body*.93);
            col+=vec3(.42,.5,.66)*rim*(.12+.9*lit);
            // the moon: a pale disc with soft grey seas of our own shapes, a bright limb, and two soft rings of light round it
            col+=uMoon.z*(vec3(.9,.92,1.)*2.2*(1.-smoothstep(uDisc-1.5,uDisc,md))*(.62+.38*smoothstep(.35,.7,fbm((p-uMoon.xy)*.045+uSo)))*(1.-.8*body)+vec3(.2,.26,.4)*exp(-md/(uDisc*1.6))+vec3(.035,.05,.085)*exp(-md/(uDisc*7.)));
            gl_FragColor=vec4(col,1.); }` });
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1300), skyMat(skyU));
      sky.rotation.y = PI; sky.position.set(75, 200, 600); sky.name = 'night-sky'; sky.renderOrder = -1; scene.add(sky);
      // the east sheet, turned to face the room (its x runs south), and the moon's disc on it: where the ray from the east light's
      // middle along the moon's direction meets the sheet, written in the sheet's own coordinates
      const SK = { x: 640, y: 320, z: winMid[2] - 40 }, t = (SK.x - winMid[0]) / moonDir.x;
      skyE.uMoon.value.set(winMid[2] + moonDir.z * t - SK.z, winMid[1] + moonDir.y * t - SK.y, 1);
      const skyEast = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1300), skyMat(skyE));
      skyEast.rotation.y = -PI / 2; skyEast.position.set(SK.x, SK.y, SK.z); skyEast.name = 'night-sky-east'; skyEast.renderOrder = -1; scene.add(skyEast);
      // THE EAST LIGHT'S STONE AND BARS: two stone mullions part it in three lights, glazing bars part each light in three by six
      // panes (the same measures the moon's law shades the room with); a stone sill inside
      { const E = EWIN, zm = (E.z0 + E.z1) / 2, hh = E.y1 - E.y0, ym = (E.y0 + E.y1) / 2, xb = E.xIn + 14;
        for (const sd of [-1, 1]) ST.add(box(10, hh, 8), M4(xb, ym, zm + sd * E.wide / 6), '#8f8678');
        for (let k = 1; k < 9; k++) if (k % 3) fb.add(box(1.6, hh, 1), M4(xb, ym, E.z0 + E.wide * k / 9), paint);
        for (let k = 1; k < 6; k++) fb.add(box(1.6, 1, E.wide), M4(xb, E.y0 + hh * k / 6, zm), paint, { g: 'z' });
        ST.add(box(30, 4, E.wide + 8), M4(E.xIn + 11, E.y0 - 2, zm), '#8f8678'); }
      mesh(fb.build(), woodMat, 'window-frames');
    }
    await ctx.yield();
    // ---------------------------------------------------------------- WE ARE SMALL FROM THE FIRST METRE: what lies under the entry axis
    // behind its first 24 m, each beside or under the axis and never across it, none behind the entry (z over 154): the open
    // light's stone seat, 28 m deep (a deep sill, 35 cm in life), 15.7 m under the axis, ending in a moulded edge at z 126;
    // on it, by the west jamb (STAY), the casement's iron stay swung inward, a bar 0.9 m thick and 20 m long with a curled end,
    // and a spare brass curtain ring 4.6 m across leaning on the curl. Nothing hangs in the air here.
    const creatureMat = lib.mat({ name: 'creature', vertexColors: true, surface: '{ alb*=.8+.4*vn3(vG*7.); gloss=.55; }' });
    {
      ST.add(box(84, 4.3, 28), M4(75, WIN.y0 - 1.85, 140), '#8f8678');
      ST.add(cyl(2.15, 2.15, 84, 16), M4(75, WIN.y0 - 1.85, 126, 0, 0, PI / 2), '#877e70');
      ST.add(box(86, 1.4, 3), M4(75, WIN.y0 - 4.6, 127.5), '#7a7265');
      for (const x of [41, 75, 109]) { ST.add(box(6, 10, 24), M4(x, WIN.y0 - 9, 142), '#7d7568'); ST.add(box(6, 9, 14), M4(x, WIN.y0 - 18.4, 152), '#746c60'); }
      // the stay: a pivot plate, the bar lying on the stone, its end curled up
      const sx = STAY.x, sy = WIN.y0 + 0.3;
      IR.add(box(3.4, 0.5, 5), M4(sx, sy + 0.25, 150), '#2e2c2b');
      IR.add(tube([[sx, sy + 1.0, 151.5], [sx, sy + 0.75, 146], [sx + 0.2, sy + 0.5, 139], [sx + 0.3, sy + 0.5, 134.5], [sx + 0.3, sy + 1.2, 131.2], [sx + 0.2, sy + 3.4, 129.6], [sx, sy + 5.4, 131], [sx - 0.1, sy + 5.3, 133.3], [sx - 0.1, sy + 3.9, 134.2], [sx, sy + 3.0, 133]], 0.45, 56, 10), null, '#3a3836');
      IR.add(cyl(0.7, 0.7, 1.6, 12), M4(sx, sy + 0.9, 151.5, 0, 0, PI / 2), '#2e2c2b');
      // the spare ring: on edge on the stone, leaning against the curl
      BR.add(new THREE.TorusGeometry(2.05, 0.28, 10, 40), M4(sx - STAY.ring, sy + 2.28, 130.2, 0, -0.5, -0.2), BRASS);
      await ctx.yield();
      // THE SILL'S SMALL THINGS, each at eighty times life. All lie on the seat or rise from it, beside the axis and never
      // across it:
      //   a grey wing feather 11 m long, come in at the open light, propped over the stay's curl with its vane in the air west of the
      //   axis, grey and dim (it has no light of its own);
      //   a brass key 8.5 m long (plain: no mark) lying 13 m east of the axis, 10 m in from the seat's edge, turned as its stream says;
      //   a dead fly on its back, 5 m west of the axis and 6 m in from the edge; a moth's wing and the dust of its scales beside it;
      //   grit like pebbles, scattered by its own stream anywhere on the seat but on the other things;
      //   and the shade the stay lays on the stone on its side away from the open light.
      const SEAT = { x0: 33, x1: 117, z0: 126, z1: 154, y: sy }, ax = ROUTE[0][0], sb = makeBuilder();
      { // the feather: rachis (root on the stone, over the curl's top, tip in the air) and its vane, broad to the south-east
        const root = new V3(sx - 1.6, sy + 0.3, 134), piv = new V3(sx + 0.2, sy + 6.05, 130.6), tip = new V3(sx + 1.4, sy + 9.8, 128.4);
        const curve = new THREE.CatmullRomCurve3([root, root.clone().lerp(piv, 0.5).add(new V3(0, 0.25, 0)), piv, piv.clone().lerp(tip, 0.55).add(new V3(0.1, 0.2, 0)), tip]);
        sb.add(new THREE.TubeGeometry(curve, 40, 0.13, 7, false), null, '#9d968a');
        const P = [], U = [], I = [], n0 = new V3(0.55, 0.6, 0.58).normalize(), NS = 48, tg = new V3(), sd = new V3(), q = new V3();
        for (let i = 0; i <= NS; i++) { const tt = i / NS, t = 0.2 + 0.8 * tt; curve.getPointAt(t, q); curve.getTangentAt(t, tg); sd.crossVectors(tg, n0).normalize();
          const w = 1.5 * Math.pow(Math.sin(Math.min(tt * 1.04, 1) * PI), 0.55) * (0.65 + 0.35 * tt);
          for (const [k, v] of [[-0.5, -1], [0, 0], [1, 1]]) { P.push(q.x + sd.x * w * k, q.y + sd.y * w * k + 0.12 * Math.abs(k) * w, q.z + sd.z * w * k); U.push(tt, v); }
          if (i > 0) { const b = (i - 1) * 3; I.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); } }
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); fg.setIndex(I); fg.computeVertexNormals();
        mesh(fg, lib.mat({ name: 'sill-feather', side: THREE.DoubleSide, surface: /* glsl */`{ float u=vUv.x, v=abs(vUv.y); float barb=sin(u*300.+v*34.)*.5+.5;
          float split=step(.11,fract(u*8.3+.3*sin(u*41.)));
          if(v>.9+.1*barb||(split<.5&&v>.28&&barb<.55)) discard;
          alb=mix(vec3(.5,.47,.43),vec3(.2,.2,.23),smoothstep(.6,.97,u))*(.7+.3*barb); alb=mix(alb,vec3(.6,.57,.5),1.-smoothstep(0.,.05,v));
          gloss=.15; wrap=.6; emis=alb*(uNight*.1+uLampCol*.012); }` }), 'sill-feather'); }
      await ctx.yield();
      const kx = ax + 13, kz = SEAT.z0 + 10, ka = R.sillKey.range(0, TAU), fx = ax - 5, fz = SEAT.z0 + 6, mwx = ax + 5.5, mwz = SEAT.z0 + 17;
      { // the key: a bow, a shank with a collar, a bit of two wards
        const m = M4(kx, sy + 0.36, kz, 0, ka, 0), put = (g, l) => BR.add(g, m.clone().multiply(l), BRASS);
        put(new THREE.TorusGeometry(1.3, 0.34, 10, 28), M4(-2.9, 0, 0, PI / 2, 0, 0)); put(cyl(0.29, 0.29, 5.6, 14), M4(1.1, 0, 0, 0, 0, PI / 2)); put(cyl(0.46, 0.46, 0.5, 14), M4(-1.45, 0, 0, 0, 0, PI / 2));
        put(lathe([[0, 0], [0.3, 0], [0.42, 0.25], [0.3, 0.5], [0, 0.55]], 12), M4(3.9, 0, 0, 0, 0, -PI / 2)); put(box(1.2, 0.28, 1.6), M4(3.0, 0, 0.9)); put(box(0.45, 0.28, 0.9), M4(2.05, 0, 0.6)); }
      { // the dead fly, on its back: body, head, two wings flat on the stone, six legs drawn up
        const m = M4(fx, sy + 0.42, fz, 0, 0.7, 0), dark = '#17130f';
        sb.add(new THREE.SphereGeometry(0.42, 14, 10), m.clone().multiply(M4(0, 0, 0.15, 0, 0, 0, 1, 0.85, 1.7)), dark); sb.add(new THREE.SphereGeometry(0.27, 12, 8), m.clone().multiply(M4(0, 0.02, -0.72)), '#2c1612');
        for (const sd of [-1, 1]) { sb.add(new THREE.CircleGeometry(0.62, 12), m.clone().multiply(M4(sd * 0.72, -0.36, 0.5, -PI / 2, 0, sd * 0.5, 0.62, 1.5, 1)), '#8f8a7c');
          for (let k = 0; k < 3; k++) sb.add(tube([[sd * 0.2, 0.25, -0.3 + k * 0.3], [sd * 0.55, 0.75, -0.42 + k * 0.38], [sd * 0.38, 1.02, -0.36 + k * 0.36], [sd * 0.12, 0.88, -0.3 + k * 0.33]], 0.04, 8, 5).applyMatrix4(m), null, dark); } }
      { // the moth's wing: a fan lying flat, and the dust of its scales strewn beside it
        const P = [], I = []; const fan = [[0.2, -0.8], [1.1, -1.15], [1.9, -1.0], [2.3, -0.5], [2.15, 0.1], [1.45, 0.45], [0.3, 0.35]];
        P.push(0, 0, -0.35); for (const f of fan) P.push(f[0], 0, f[1]); for (let k = 1; k < fan.length; k++) I.push(0, k + 1, k);
        const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setIndex(I); wg.computeVertexNormals();
        sb.add(wg, M4(mwx, sy + 0.04, mwz, 0, 2.2, 0), '#8a765a');
        const dg = new THREE.PlaneGeometry(5.2, 2.6); dg.rotateX(-PI / 2); dg.rotateY(2.5); dg.translate(mwx + 1.6, sy + 0.03, mwz - 1.4);
        mesh(dg, lib.mat({ name: 'wing-dust', surface: /* glsl */`{ vec2 q=vUv-.5; float fall=1.-smoothstep(.15,.5,length(q*vec2(1.,1.6)));
          vec2 c=vW.xz*9., ci=floor(c); float hs=h21(ci); if(hs>fall*.55||length(fract(c)-.5)>.34) discard;
          alb=mix(vec3(.62,.5,.32),vec3(.85,.78,.6),h21(ci+3.)); gloss=.5; emis=alb*(uNight*.2+uLampCol*.03); }` }), 'wing-dust'); }
      await ctx.yield();
      { // grit like pebbles: seventy grains 0.12 to 0.45 m across, each anywhere on the seat that is clear of
        // the stay, the ring, the feather's root, the key, the fly and the wing
        const gr = R.sillGrit, keep = [[kx, kz, 5], [fx, fz, 1.6], [mwx + 1, mwz - 1, 3.4], [sx - 1.6, 134, 1.5], [sx - STAY.ring, 130.2, 3]];
        for (let i = 0; i < 70; i++) { if (i === 35) await ctx.yield(); const x = gr.range(SEAT.x0 + 1, SEAT.x1 - 1), z = gr.range(SEAT.z0 + 0.8, SEAT.z1 - 1), r = gr.range(0.12, 0.45) * (gr.chance(0.15) ? 1.6 : 1), ry = gr.range(0, TAU), fl = gr.range(0.5, 0.8), tone = gr.range(0.75, 1.15);
          if (Math.abs(x - sx) < 1.2 + r || keep.some((k) => Math.hypot(x - k[0], z - k[1]) < k[2] + r)) continue;
          const cc = new THREE.Color('#b8ae9c').multiplyScalar(tone); sb.add(new THREE.DodecahedronGeometry(r, 0), M4(x, sy + r * fl * 0.55, z, 0.4, ry, 0.3, 1, fl, 1), [cc.r, cc.g, cc.b]); } }
      await ctx.yield();
      { // the stay's shade on the stone: a soft dark band beside the bar, on its side away from the open light's middle
        const w = 3.4, sg = new THREE.PlaneGeometry(w, 21); sg.rotateX(-PI / 2); sg.translate(sx + Math.sign(sx - ax) * (0.3 + w / 2), sy + 0.02, 141);
        const sh = new THREE.Mesh(sg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
          fragmentShader: 'varying vec2 vUv; void main(){ float nearBar=' + (sx < ax ? 'vUv.x' : '1.-vUv.x') + '; float a=smoothstep(0.,.9,nearBar)*smoothstep(0.,.06,vUv.y)*(1.-smoothstep(.94,1.,vUv.y)); gl_FragColor=vec4(0.,0.,0.,.42*a*a); }' }));
        sh.name = 'stay-shade'; sh.renderOrder = 1; scene.add(sh); }
      mesh(sb.build(), lib.mat({ name: 'sill-things', vertexColors: true, side: THREE.DoubleSide, surface: '{ alb*=.8+.4*vn3(vG*5.); gloss=.4; emis=alb*uNight*.12; }' }), 'sill-things');
      await ctx.yield();
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the small lives of the room, none larger than a moth, each on its own
    // clock, none answering us. A FLY crosses the middle air on a wide ring high over the rug, like a far bird. A BEETLE walks the
    // gap between two boards 8 m west of the lane by the fender, to and fro between the rug's corner and the fender's north end.
    {
      const wb = makeBuilder(), dark = '#14110f';
      wb.add(new THREE.SphereGeometry(0.34, 12, 8), M4(0, 0, 0.1, 0, 0, 0, 1, 0.8, 1.6), dark); wb.add(new THREE.SphereGeometry(0.22, 10, 8), M4(0, 0.03, -0.5), '#2a1410');
      for (const sd of [-1, 1]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.2, -0.1, sd * 0.95, 0.42, 0.25, sd * 0.4, 0.3, 0.95], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2)); wb.add(g, null, '#9a9484'); }
      const flyMat = lib.mat({ name: 'fly', vertexColors: true, side: THREE.DoubleSide, surface: '{ gloss=.6; }' });
      const fly = new THREE.Mesh(wb.build(), flyMat); fly.name = 'fly'; scene.add(fly);
      const f1 = R.fly.range(0, TAU), f2 = R.fly.range(0, TAU), fw = (R.fly.chance(0.5) ? 1 : -1) * TAU / R.fly.range(46, 58);
      const flyAt = (t, o) => { const a = f1 + fw * t; return o.set(-20 + 62 * Math.cos(a) + 3 * Math.sin(t * 0.9 + f2), 100 + 9 * Math.sin(a * 2 + f2) + 1.5 * Math.sin(t * 1.3 + f1), 10 + 44 * Math.sin(a) + 3 * Math.cos(t * 0.7 + f2)); };
      const fa = new V3(), fb2 = new V3();
      tick.push((dt, time) => { flyAt(time, fa); flyAt(time + 0.1, fb2); fly.position.copy(fa); fly.lookAt(fa.x * 2 - fb2.x, fa.y * 2 - fb2.y, fa.z * 2 - fb2.z); });
      await ctx.yield();
      // the beetle: 1.3 m long, wing cases with a gloss, six legs
      const bb = makeBuilder(), shell = '#231a12';
      bb.add(new THREE.SphereGeometry(0.42, 16, 10), M4(0, 0.36, 0.18, 0, 0, 0, 1, 0.62, 1.5), shell); bb.add(new THREE.SphereGeometry(0.3, 12, 8), M4(0, 0.33, -0.55, 0, 0, 0, 1, 0.6, 0.9), '#1a1410'); bb.add(new THREE.SphereGeometry(0.17, 10, 6), M4(0, 0.3, -0.88), '#120e0b');
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) bb.add(tube([[sd * 0.25, 0.3, -0.45 + i * 0.4], [sd * 0.7, 0.42, -0.6 + i * 0.5], [sd * 0.92, 0.02, -0.7 + i * 0.6]], 0.035, 6, 5), null, '#120e0b');
      const beetle = new THREE.Mesh(bb.build(), creatureMat); beetle.name = 'beetle'; scene.add(beetle);
      const gapX = -150, zA = 44, zB = FENDER.z0 + 12, span = zA - zB, bp = R.beetle.range(0, 2 * span), bs = R.beetle.range(0.9, 1.3);
      tick.push((dt, time) => { const w = (bp + time * bs) % (2 * span), fwd = w < span, k = fwd ? w : 2 * span - w;
        beetle.position.set(gapX + 0.08 * Math.sin(time * 5.1 + bp), 0.02 + 0.03 * Math.sin(time * 9 + bp), zA - k);
        const turn = smoothstep(span - 1.5, span + 1.5, w) - smoothstep(2 * span - 1.5, 2 * span, w) - (1 - smoothstep(0, 1.5, w)); beetle.rotation.y = PI * turn; });
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the brass library ladder on its rail (LADDER): the rail runs before the
    // north shelves from the clock's bay to the old shelves over the table, on a bracket at every bay; the ladder's two stiles
    // hook over it and stand on two small wheels, its rungs LADDER.step apart
    {
      const face = ROOM.z0 + SHELF.deep, top = ROOM.h - LADDER.under, zr = face + 1.6, zf = face + LADDER.out, len = Math.hypot(top, zf - zr), tilt = Math.atan2(zf - zr, top);
      BR.add(cyl(1.1, 1.1, 112, 10), M4(-88, top, zr, 0, 0, PI / 2), BRASS);
      for (let x = -144; x <= -32; x += SHELF.bay / 2) BR.add(box(1.2, 1.2, 2.6), M4(x, top, zr - 1.2), BRASS);
      for (const sd of [-1, 1]) { const x = LADDER.x + sd * LADDER.wide / 2;
        BR.add(cyl(1.2, 1.2, len, 10), M4(x, top / 2, (zr + zf) / 2, -tilt, 0, 0), BRASS);
        BR.add(new THREE.TorusGeometry(2.0, 0.7, 8, 14, PI), M4(x, top, zr, 0, PI / 2, 0), BRASS);
        BR.add(cyl(3, 3, 1.6, 16), M4(x + sd * 1.8, 3, zf, 0, 0, PI / 2), BRASS); }
      for (let y = LADDER.step; y < top - 6; y += LADDER.step) BR.add(cyl(0.8, 0.8, LADDER.wide, 8), M4(LADDER.x, y, zf + (zr - zf) * y / top, 0, 0, PI / 2), BRASS);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the telescope on its tripod before the east light (TRIPOD): three mahogany legs from feet 28 m out to a brass head at y 118, a barrel 84 m long laid in a yoke, looking up and east
    {
      const HX = TRIPOD.x, HY = 118, HZ = TRIPOD.z, mah = '#6a3220';
      const up = new V3(0, 1, 0), qd = new THREE.Quaternion(), one = new V3(1, 1, 1), a = new V3(), b = new V3(), mid = new V3();
      const pole = (ax, ay, az, bx, by, bz, r0, r1, col, B) => {
        a.set(ax, ay, az); b.set(bx, by, bz); const len = a.distanceTo(b); mid.copy(a).add(b).multiplyScalar(0.5);
        qd.setFromUnitVectors(up, b.clone().sub(a).normalize());
        B.add(cyl(r1, r0, len, 14), new THREE.Matrix4().compose(mid, qd, one), col, { g: 'y' });
      };
      for (let k = 0; k < 3; k++) {
        const ang = PI / 2 + k * TAU / 3, fx = HX + Math.cos(ang) * 28, fz = HZ + Math.sin(ang) * 28, tx = HX + Math.cos(ang) * 3.4, tz = HZ + Math.sin(ang) * 3.4;
        pole(fx, 1.6, fz, tx, HY - 4, tz, 1.7, 1.2, mah, WD);
        pole(fx + Math.cos(ang) * 0.5, 0, fz + Math.sin(ang) * 0.5, fx, 4.2, fz, 0.5, 1.9, BRASS, BR);
        // a brass stay from each leg to the centre column, a third of the way up
        pole(HX + Math.cos(ang) * 18.5, 40, HZ + Math.sin(ang) * 18.5, HX, 52, HZ, 0.45, 0.45, BRASS, BR);
        BR.add(box(2.6, 5, 3.4), M4(tx, HY - 3.4, tz, 0, -ang, 0), BRASS);
      }
      pole(HX, 50, HZ, HX, HY - 2, HZ, 0.9, 0.9, BRASS, BR);
      BR.add(lathe([[0, 0], [5, 0], [5.2, 1.4], [4.2, 2.8], [2.2, 3.4], [1.6, 6], [0, 6]], 28), M4(HX, HY - 3, HZ), BRASS);
      // the barrel, balanced on the yoke and laid along the moon's own ray: eyepiece low to the west, objective high in the east light
      const dir = moonDir.clone(), piv = new V3(HX, HY + 9, HZ);
      qd.setFromUnitVectors(up, dir);
      const bm = new THREE.Matrix4().compose(piv.clone().addScaledVector(dir, -40), qd, one);
      BR.add(lathe([[0, 0], [1.3, 0], [1.9, 1.2], [1.9, 3.2], [1.2, 4], [2.3, 4.6], [2.3, 18], [2.9, 18.6], [3.1, 20], [3.1, 30], [3.7, 30.6], [3.9, 32], [3.9, 34]], 26), bm, BRASS);
      WD.add(lathe([[3.9, 34], [4.3, 34.4], [4.5, 70], [4.1, 70.4]], 26), bm, mah, { g: 'y', gs: 0.6 });
      BR.add(lathe([[4.1, 70], [4.9, 70.6], [5.1, 72], [5.1, 78], [5.5, 78.6], [5.6, 84], [5.1, 84], [5.0, 79.5], [0, 79.5]], 30), bm, BRASS);
      for (const y of [44, 60]) BR.add(lathe([[4.45, y], [4.8, y + 0.3], [4.8, y + 1.7], [4.45, y + 2]], 26), bm, BRASS);
      // the yoke: two brass cheeks and the pivot pin across the barrel
      const side = new V3().crossVectors(dir, up).normalize();
      for (const s of [-1, 1]) pole(HX + side.x * 5.6 * s, HY + 2.4, HZ + side.z * 5.6 * s, piv.x + side.x * 5.6 * s, piv.y + 1.5, piv.z + side.z * 5.6 * s, 0.9, 0.7, BRASS, BR);
      pole(piv.x - side.x * 6.6, piv.y, piv.z - side.z * 6.6, piv.x + side.x * 6.6, piv.y, piv.z + side.z * 6.6, 0.7, 0.7, BRASS, BR);
      pole(HX - side.x * 6, HY + 2.6, HZ - side.z * 6, HX + side.x * 6, HY + 2.6, HZ + side.z * 6, 1.0, 1.0, BRASS, BR);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- shelves on the north wall over the table: books with plain spines and gilt
    // bands, a rack of rolled charts, a brass spyglass, a sand glass. The shut door in the east wall. The floor globe.
    {
      const sr = R.shelf, br = R.books, oak = '#553420';
      const bookB = BK, paperB = PP;
      const spine = ['#4a2c1c', '#5a3220', '#3c2416', '#5c1c16', '#6a2a1c', '#2c3850', '#35404e', '#63462a', '#402018'];
      const bookAt = (x, y, z, w, h, d, lean) => {
        const c = new THREE.Color(br.pick(spine)).multiplyScalar(br.range(0.75, 1.25));
        bookB.add(box(w, h, d), M4(x, y + h / 2, z, 0, 0, lean), [c.r, c.g, c.b]);
        paperB.add(box(w * 0.78, h * 0.96, d * 0.97), M4(x, y + h / 2 + 0.02, z - d * 0.05, 0, 0, lean), '#b9aa86');
      };
      const gaps = { 110: [[40, 110]], 140: [[-26, 12]], 170: [[92, 122]] };
      for (const sy of [110, 140, 170]) {
        WD.add(box(180, 2, 18), M4(60, sy - 1, (NZ - 151)), oak, { g: 'x' });
        for (let x = -22; x <= 142; x += 41) WD.add(box(1.6, 9, 12), M4(x, sy - 6.5, (NZ - 154)), oak, { shade: (px, py, pz) => (py < 0 && pz > 2 ? 0.7 : 1) });
        let x = -28 + br.range(0, 2);
        while (x < 147) {
          const gp = gaps[sy].find((g) => x > g[0] && x < g[1]);
          if (gp) { x = gp[1] + br.range(0.5, 2); continue; }
          if (br.chance(0.08)) { x += br.range(3, 9); continue; }
          const w = br.range(2.2, 6.4), h = br.range(10.5, 27), d = br.range(10.5, 14.5);
          const lean = br.chance(0.2) ? br.range(-0.2, 0.2) : 0;
          bookAt(x + w / 2 + Math.sin(Math.abs(lean)) * h * 0.5 * Math.sign(-lean || 1) * (lean ? 1 : 0), sy, (NZ - 150.5) + (14.5 - d) * 0.4, w, h, d, lean); x += w + 0.15 + Math.sin(Math.abs(lean)) * h;
        }
        await ctx.yield();
      }
      await ctx.yield();
      // a few books lying flat in one of the gaps
      { let y = 110; for (let k = 0; k < 3; k++) { const h = br.range(3, 5); const c = new THREE.Color(br.pick(spine)); bookB.add(box(br.range(18, 22), h, br.range(12, 15)), M4(98 + br.range(-2, 2), y + h / 2, (NZ - 150), 0, br.range(-0.15, 0.15), 0), [c.r, c.g, c.b]); y += h; } }
      await ctx.yield();
      // more books lying: a pile in the gap of the middle shelf and one on the top shelf, spines to the room
      for (const [sy, x0, n] of [[140, -8, 3], [170, 106, 2]]) { let y = sy; for (let k = 0; k < n; k++) { const h = br.range(3, 5.5), w = br.range(17, 23), d = br.range(12, 15), c = new THREE.Color(br.pick(spine)).multiplyScalar(br.range(0.8, 1.2)), ry = br.range(-0.12, 0.12);
        bookB.add(box(w, h, d), M4(x0 + br.range(-1.5, 1.5), y + h / 2, (NZ - 150), 0, ry, 0), [c.r, c.g, c.b]); paperB.add(box(w * 0.97, h * 0.74, d * 0.96), M4(x0, y + h / 2, (NZ - 150.4), 0, ry, 0), '#b9aa86'); y += h; } }
      // the rack of rolled charts (tubes 3 m thick, 60 m long) on the lowest shelf, in a wooden rack
      const tubes = [[0, 0], [3.2, 0], [6.4, 0], [9.6, 0], [1.6, 2.8], [4.8, 2.8], [8, 2.8], [3.2, 5.6], [6.4, 5.6]];
      for (const [dz, dy] of tubes) { const tg = cyl(1.5, 1.5, sr.range(54, 62), 14); paperB.add(tg, M4(75 + sr.range(-2, 2), 111.6 + dy, (NZ - 157) + dz, 0, 0, PI / 2), '#d9cdaa', { shade: (px, py) => (Math.abs(py) > 26.5 ? 0.6 : 1) }); }
      for (const x of [50, 100]) { WD.add(box(1.5, 10, 14), M4(x, 115, (NZ - 151.5)), oak); }
      await ctx.yield();
      // a brass spyglass on the top shelf, a sand glass on the middle one
      BR.add(lathe([[0, 0], [2.6, 0], [2.6, 12], [2.9, 12.2], [2.9, 13], [2.2, 13.2], [2.2, 24], [2.5, 24.2], [2.5, 25], [1.8, 25.2], [1.8, 34], [2.3, 34.3], [2.3, 36], [0, 36]], 24), M4(89, 172.9, (NZ - 150), 0, 0.12, PI / 2), BRASS);
      for (const y of [140.6, 156.4]) WD.add(cyl(5, 5, 1.2, 24), M4(-7, y, (NZ - 150)), oak);
      for (let k = 0; k < 3; k++) WD.add(cyl(0.5, 0.5, 15, 8), M4(-7 + 4.2 * Math.cos(k * TAU / 3), 148.5, (NZ - 150) + 4.2 * Math.sin(k * TAU / 3)), oak);
      const sg = lathe([[0.3, 0], [3.2, 0.6], [3.6, 3], [2.4, 5.6], [0.45, 7.3], [2.4, 9], [3.6, 11.6], [3.2, 14], [0.3, 14.6]], 28); sg.translate(-7, 141.2, (NZ - 150));
      mesh(sg, lib.mat({ name: 'sand-glass', surface: /* glsl */`{ float y=vW.y-141.2; float sand=step(y,4.2)+step(7.3,y)*step(y,8.6+.3*sin(uTime*.5));
        alb=mix(vec3(.25,.3,.3),vec3(.6,.42,.2),sand); gloss=.9; emis=uLampCol*.03; }` }), 'sand-glass');
      await ctx.yield();
      // THE ROLL STAND (ROLLS, above). The basket: a tub of dark withies, wider at the rim, with three hoops. In it seven to nine
      // rolled charts of old tan paper stand on end, each from its own draws: 1.5 to 2.1 m in radius and 70 to 88 m long (their
      // mouths stand about the height of the line over the table, and well under the wall charts), its foot somewhere
      // on the basket's floor, leaning outward the way its foot lies from the middle as far as the rim lets it, and never
      // nearer a wall than 2.5 m; a ribbon of its own colour somewhere about its upper half; the sheet's free edge runs down it; its upper mouth dark.
      { const rr = R.rolls, Q = ROLLS, withy = '#4a3320';
        WD.add(lathe([[0, 0], [Q.r - 2, 0], [Q.r - 1.6, 1], [Q.r - 0.6, Q.h - 1.4], [Q.r, Q.h], [Q.r - 0.9, Q.h], [Q.r - 2.4, 2.2], [0, 2.2]], 28), M4(Q.x, 0, Q.z), withy);
        for (const t of [0.12, 0.5, 0.93]) WD.add(new THREE.TorusGeometry(Q.r - 1.75 + 1.25 * t, 0.55, 6, 28), M4(Q.x, Q.h * t, Q.z, PI / 2, 0, 0), '#35230f');
        const n = rr.int(7, 9), ribbons = ['#6a2a22', '#27405a', '#5a4a2c', '#4a2f4a'];
        for (let k = 0; k < n; k++) {
          const rad = rr.range(1.5, 2.1), len = rr.range(70, 88), a = (k + rr.range(0.15, 0.85)) * TAU / n, fr = rr.range(1.2, Q.r - 5.5), dx = Math.cos(a), dz = Math.sin(a);
          // the lean: as far as the rim lets it, and its top no nearer a wall than 2.5 m
          let top = fr + (Q.r - 0.9 - rad - fr) * len / Q.h * rr.range(0.7, 1);
          if (dx > 0) top = Math.min(top, (Q.off - 2.5 - rad) / dx); if (dz < 0) top = Math.min(top, (Q.off - 2.5 - rad) / -dz);
          const tilt = Math.atan2(top - fr, len), m = new THREE.Matrix4().makeTranslation(Q.x + dx * fr, 2.2, Q.z + dz * fr)
            .multiply(new THREE.Matrix4().makeRotationY(-a)).multiply(new THREE.Matrix4().makeRotationZ(-tilt));
          const tone = rr.range(0.86, 1.06);
          PP.add(cyl(rad, rad, len, 18, true), new THREE.Matrix4().copy(m).multiply(M4(0, len / 2, 0)), [0.33 * tone, 0.265 * tone, 0.175 * tone]);
          // the sheet's free edge down the roll, on the side its own draw turns to the room
          { const e = rr.range(0, TAU); PP.add(box(0.5, len - 0.4, 0.16), new THREE.Matrix4().copy(m).multiply(M4(Math.cos(e) * rad, len / 2, Math.sin(e) * rad, 0, -e, 0)), [0.17 * tone, 0.13 * tone, 0.085 * tone]); }
          PP.add(cyl(rad * 0.62, rad * 0.62, 0.2, 14), new THREE.Matrix4().copy(m).multiply(M4(0, len - 1.2, 0)), '#3a2c1c');
          PP.add(new THREE.RingGeometry(rad * 0.62, rad, 18), new THREE.Matrix4().copy(m).multiply(M4(0, len, 0, -PI / 2, 0, 0)), [0.29 * tone, 0.23 * tone, 0.15 * tone]);
          PP.add(cyl(rad + 0.12, rad + 0.12, 2.2, 18, true), new THREE.Matrix4().copy(m).multiply(M4(0, len * rr.range(0.48, 0.8), 0)), rr.pick(ribbons));
        }
        lib.addOccF(Q.x, Q.z, Q.r, Q.h);
      }
      await ctx.yield();
      // the one door, shut and dark, in the east wall (z 30..100, to y 168)
      const dx = ROOM.x1, dk = '#3a2414';
      WD.add(box(2.4, 168, 8), M4(dx - 1.2, 84, 26), dk); WD.add(box(2.4, 168, 8), M4(dx - 1.2, 84, 104), dk); WD.add(box(2.4, 8, 86), M4(dx - 1.2, 172, 65), dk, { g: 'z' });
      WD.add(box(1.0, 168, 70), M4(dx - 0.5, 84, 65), '#2c1a10');
      for (const [y, h] of [[22, 30], [80, 66], [140, 40]]) for (const z of [47, 83]) WD.add(box(0.8, h, 28), M4(dx - 1.3, y + h * 0, z), dk, { shade: () => 0.85 });
      BR.add(lathe([[0, 0], [1.2, 0], [0.8, 1], [1.8, 2.4], [2.0, 3.6], [1.2, 4.6], [0, 5]], 20), M4(dx - 1.6, 82, 35, 0, 0, PI / 2), BRASS);
    }
    await ctx.yield();
    {
      // THE GLOBE on its stand (GLOBE): ball radius 22 at y 70, pale seas and darker lands of our own shapes, turning once in 40 s
      const gx = GLOBE.x, gz = GLOBE.z, wal = '#55331e';
      WD.add(lathe([[0, 0], [9, 0], [9.5, 1.5], [7, 3], [3, 5], [2.4, 9], [3.4, 12], [2.2, 15], [2.0, 28], [3.2, 31], [2.4, 34], [2.6, 40], [5, 43], [5.4, 45], [0, 45]], 32), M4(gx, 0, gz), wal);
      for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + 0.4; WD.add(box(16, 2.4, 3), M4(gx + Math.cos(a) * 11, 1.4, gz + Math.sin(a) * 11, 0, -a, 0), wal, { g: 'x' }); }
      const tilt = 0.41, ring = new THREE.TorusGeometry(23.6, 0.8, 10, 64);
      BR.add(ring, M4(gx, 70, gz, 0, 0.5, tilt), BRASS); BR.add(new THREE.TorusGeometry(24.6, 1.0, 8, 48, PI), M4(gx, 70, gz, 0, 0.5 + PI / 2, PI), BRASS);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(22, 48, 32), lib.mat({ name: 'globe', uniforms: { uSo: { value: R.globe.range(0, 50) } }, pars: 'uniform float uSo;',
        surface: /* glsl */`{ vec3 d=normalize(vG); float n=fbm3(d*2.1+uSo)+.45*fbm3(d*5.3+uSo*1.7)-.63;
          float land=smoothstep(-.01,.01,n), coast=1.-smoothstep(0.,.03,abs(n));
          float lat=asin(clamp(d.y,-1.,1.)), lon=atan(d.z,d.x);
          float grat=max(1.-smoothstep(0.,.012,abs(fract(lat*6./3.1416)-.5)*.5236),1.-smoothstep(0.,.012,abs(fract(lon*12./6.2832)-.5)*.5236*cos(lat)));
          // (pale seas of old varnished paper, darker lands of umber and moss, the coasts and the graticule inked)
          alb=mix(vec3(.62,.68,.66)*(.92+.16*fbm3(d*4.+uSo)),mix(vec3(.3,.2,.1),vec3(.2,.24,.12),fbm3(d*3.7-uSo))*(.8+.5*fbm3(d*9.)),land);
          alb=mix(alb,vec3(.06,.045,.03),max(coast*.8,grat*.35)); gloss=.55; wrap=.05; }` }));
      const axis = new THREE.Group(); axis.position.set(gx, 70, gz); axis.rotation.set(0, 0.5, tilt); axis.add(ball); ball.name = 'globe'; scene.add(axis);
      const g0 = R.globe.range(0, TAU);
      tick.push((dt, time) => { ball.rotation.y = g0 + time * TAU / 40; });
    }
    await ctx.yield();

    // ---------------------------------------------------------------- what stands on the table top (y 60), the same on every seed:
    // the dividers astride the line, the parallel rule, the inkwell and pen, the pipe in its dish, the pewter mug, three books
    const TY = TABLE.y + 0.06;
    {
      // DIVIDERS of brass and steel, as the chart maker left them standing on the working chart BESIDE THE LINE (DIV, at the
      // head of build): both points through the paper into the wood, the legs spread across our way
      const dp = new V3(DIV.at[0], DIV.at[1], DIV.at[2]), dt_ = new V3(DIV.heading[0], 0, DIV.heading[1]);
      const across = new V3(-dt_.z, 0, dt_.x).normalize(), hinge = new V3(dp.x, TABLE.y + DIV.hinge, dp.z), steel = '#9aa0a6';
      const hq = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), across);
      for (const sd of [-1, 1]) {
        const tip = new V3(dp.x + across.x * DIV.half * sd, TY, dp.z + across.z * DIV.half * sd), dir = tip.clone().sub(hinge), len = dir.length(); dir.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, -1, 0), dir).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.atan2(dt_.x, dt_.z)));
        const upper = new THREE.Matrix4().compose(hinge.clone().addScaledVector(dir, len * 0.3), q, new V3(1, 1, 1));
        const lower = new THREE.Matrix4().compose(hinge.clone().addScaledVector(dir, len * 0.8), q, new V3(1, 1, 1));
        BR.add(box(0.9, len * 0.6, 1.5), upper, BRASS);
        IR.add(cyl(0.45, 0.06, len * 0.4, 12), lower, steel);
        BR.add(cyl(0.7, 0.7, 1.0, 12), new THREE.Matrix4().compose(hinge.clone().addScaledVector(dir, len * 0.6), q, new V3(1, 1, 1)), BRASS);
        lib.addOccL(tip.x - across.x * DIV.half / 3 * sd, tip.z - across.z * DIV.half / 3 * sd, 0.6, TABLE.y + 7);
      }
      const hm4 = (g) => new THREE.Matrix4().compose(hinge, hq, new V3(1, 1, 1));
      BR.add(cyl(2.1, 2.1, 2.0, 28).rotateX(PI / 2), hm4(), BRASS);
      BR.add(lathe([[0, 0], [0.9, 0], [0.9, 1.4], [1.5, 1.8], [1.5, 2.4], [0.8, 2.8], [0.8, 4.4], [1.3, 4.8], [1.3, 6], [0, 6.3]], 16), M4(hinge.x, hinge.y + 1.6, hinge.z), BRASS);
      IR.add(cyl(0.5, 0.5, 2.6, 10).rotateX(PI / 2), hm4(), steel);
      scene.userData.dividers = { at: [dp.x, dp.y, dp.z], across: [across.x, across.z] };
      await ctx.yield();
      // PARALLEL RULE on the working chart's west end, along its south border: two ebony bars 30 m by 3 m, 4 m apart, two brass
      // links. It lies under every sight from the line to the bottle's base (RULE, at the module's head; counted below)
      const ebony = '#2b211b', rzN = RULE.z - 3.5, rzS = RULE.z + 3.5;
      for (const z of [rzN, rzS]) { WD.add(rbox(30, 0.9, 3, 0.25, 2), M4(RULE.x, TY + 0.45, z), ebony, { g: 'x' });
        // brass edges let into both long arrises of each bar, and a brass plate at each end
        for (const e of [-1.32, 1.32]) BR.add(box(29.4, 0.14, 0.26), M4(RULE.x, TY + 0.9, z + e), BRASS);
        for (const x of [20.5, 49.5]) BR.add(box(0.7, 0.14, 2.5), M4(x, TY + 0.9, z), BRASS); }
      for (const x of [27, 43]) { BR.add(box(1.3, 0.25, 8.2), M4(x + 0.9, TY + 1.05, RULE.z, 0, 0.26, 0), BRASS); for (const z of [rzN, rzS]) BR.add(cyl(0.55, 0.55, 0.5, 12), M4(x + (z < RULE.z ? -0.05 : 1.85), TY + 1.25, z), BRASS); }
      for (const x of [31, 39]) BR.add(lathe([[0, 0], [0.5, 0], [0.4, 0.8], [0.9, 1.3], [0.7, 1.9], [0, 2.1]], 12), M4(x, TY + 0.9, rzS), BRASS);
      await ctx.yield();
      // INKWELL of glass in a brass tray (INK, at the head of build), 7 m wide and 6 m high, a steel-nibbed pen 16 m long leaning
      // in it, away from the line (to the north-east)
      BR.add(lathe([[0, 0], [6.2, 0], [6.8, 0.5], [6.9, 1.3], [6.3, 1.0], [5.6, 0.6], [0, 0.6]], 40), M4(INK.x, TY, INK.z), BRASS);
      const well = rbox(7, 4.8, 7, 0.9, 3); well.translate(INK.x, TY + 0.6 + 2.4, INK.z);
      const inkAt = `vec2(${INK.x.toFixed(2)},${INK.z.toFixed(2)})`, glintAt = `vec2(${(INK.x + 0.9).toFixed(2)},${(INK.z - 0.5).toFixed(2)})`;
      const inkMat = lib.mat({ name: 'inkwell', surface: /* glsl */`{ float top=smoothstep(${(TABLE.y + 5.3).toFixed(2)},${(TABLE.y + 5.5).toFixed(2)},vW.y);
        alb=vec3(.03,.045,.05); gloss=.95; float r=length(vW.xz-${inkAt});
        { float rim=pow(1.-clamp(abs(dot(N,V)),0.,1.),2.5); alb+=vec3(.1,.14,.13)*rim; }
        float men=top*(1.-smoothstep(1.7,1.9,r)); emis=uLampCol*men*(.25+.9*smoothstep(1.,1.8,r)+1.6*exp(-dot(vW.xz-${glintAt},vW.xz-${glintAt})*6.)*(.8+.2*sin(uTime*5.3))); alb=mix(alb,vec3(.2,.24,.24),top*smoothstep(1.9,2.1,r)*.6); }` });
      mesh(well, inkMat, 'inkwell');
      BR.add(lathe([[1.9, 0], [2.3, 0.1], [2.3, 0.7], [1.9, 0.8]], 24), M4(INK.x, TY + 5.4, INK.z), BRASS);
      { const a = new V3(INK.x + 0.6, TY + 5.2, INK.z - 0.6), d = new V3(0.55, 0.62, -0.56).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d);
        WD.add(lathe([[0.25, 0], [0.42, 1], [0.5, 4], [0.36, 9], [0.22, 12.4], [0, 12.6]], 10), new THREE.Matrix4().compose(a.clone().addScaledVector(d, 2.6), q, new V3(1, 1, 1)), '#4a1c14');
        IR.add(cyl(0.3, 0.05, 3.4, 8), new THREE.Matrix4().compose(a.clone().addScaledVector(d, 1.0), q, new V3(1, 1, 1)), '#b8bcc0'); }
      lib.addOccL(INK.x, INK.z, 4.2, TABLE.y + 5.6);
      await ctx.yield();
      // a clay PIPE in a brass dish (PIPE, above)
      BR.add(lathe([[0, 0], [3.4, 0], [4.8, 0.7], [5.2, 1.5], [4.9, 1.3], [3.4, 0.6], [0, 0.6]], 32), M4(PIPE.x, TY, PIPE.z), BRASS);
      PP.add(lathe([[0.5, 0], [1.3, 0.4], [1.6, 1.6], [1.6, 3.4], [1.45, 3.6], [1.2, 3.5], [1.2, 1.6], [0.2, 1.1]], 20), M4(PIPE.x + 2.2, TY + 0.9, PIPE.z - 0.6, 0, 0, -0.5), '#d9d3c3');
      PP.add(tube([[1.6, 1.5, -0.5], [-2, 1.9, 0.2], [-7, 1.4, 1.4], [-11.4, 0.9, 2.6]].map((q) => [PIPE.x + q[0], TY + q[1], PIPE.z + q[2]]), 0.33, 16, 8), null, '#d9d3c3');
      // the pipe is alight: an ember in the bowl that draws and dulls on its own slow clock
      { const em = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16), lib.mat({ name: 'pipe-ember', surface: '{ float n=vn(vW.xz*3.); alb=vec3(.04,.03,.03); emis=vec3(1.,.28,.04)*(.5+1.3*n)*(.7+.3*sin(uTime*.8+n*4.)); }' }));
        em.position.set(PIPE.x + 2.2 + 3.35 * Math.sin(0.5), TY + 0.9 + 3.35 * Math.cos(0.5), PIPE.z - 0.6); em.rotation.set(-PI / 2, 0, 0); em.rotateY(0.5); em.name = 'pipe-ember'; scene.add(em); }
      // HEAT TREMBLES over the chimney: a column of warm air 7 m wide rising 34 m from the chimney's mouth, seen as slow bright
      // bands that climb and waver (a MEDIUM; it turns on its upright to the eye and thins within 6 m of the lens)
      { const hg = new THREE.PlaneGeometry(1, 1); hg.translate(0, 0.5, 0);
        const heat = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: { uTime: lib.u.uTime, uCol: { value: lin3('#FFD596') } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: `varying vec2 vQ; varying float vD; void main(){ vec3 c=vec3(${FLAME[0].toFixed(2)},${(FLAME[1] + 19).toFixed(1)},${FLAME[2].toFixed(2)}); vec2 e=normalize(cameraPosition.xz-c.xz);
            vec3 p=c+vec3(-e.y,0.,e.x)*position.x*7.+vec3(0.,position.y*34.,0.); vQ=vec2(position.x*2.,position.y); vD=distance(cameraPosition,p); gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
          fragmentShader: `uniform float uTime; uniform vec3 uCol; varying vec2 vQ; varying float vD;
            void main(){ float y=vQ.y, x=vQ.x+.25*sin(y*9.-uTime*2.1)*y+.12*sin(y*23.-uTime*3.7);
              float w=.35+.5*y; float col=1.-smoothstep(.3*w,w,abs(x));
              float band=.5+.5*sin(y*46.-uTime*4.2+3.*sin(x*5.+uTime*.9));
              gl_FragColor=vec4(uCol*.07*col*band*band*(1.-y)*smoothstep(0.,.06,y)*smoothstep(1.5,6.,vD),1.); }` }));
        heat.frustumCulled = false; heat.name = 'lamp-heat'; heat.renderOrder = 5; scene.add(heat); }
      await ctx.yield();
      // a dented PEWTER MUG (MUG, above), 8 m high
      const mg = lathe([[0, 0], [3.2, 0], [3.5, 0.4], [3.3, 1], [3.15, 4], [3.25, 7.2], [3.5, 7.8], [3.5, 8], [3.1, 8], [2.9, 7.4], [2.85, 1.2], [0, 1.0]], 36);
      { const p = mg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const k = 1 - 0.07 * Math.exp(-(((a - 0.8) / 0.35) ** 2) - ((y - 4.6) / 1.5) ** 2) - 0.05 * Math.exp(-(((a + 1.9) / 0.3) ** 2) - ((y - 2.6) / 1.2) ** 2); p.setX(i, x * k); p.setZ(i, z * k); } mg.computeVertexNormals(); }
      IR.add(mg, M4(MUG.x, TY, MUG.z), '#8d9096');
      IR.add(new THREE.TorusGeometry(2.3, 0.45, 8, 20, PI * 1.1), M4(MUG.x + 3.3, TY + 4.3, MUG.z, 0, 0, -PI * 0.55), '#8d9096');
      lib.addOccL(MUG.x, MUG.z, 3.6, TABLE.y + 8);
      // a pile of three books against the table's back (PILE, above): it also holds the hanging chart's end down
      { let y = TY; const pw = PILE.x1 - PILE.x0, pcx = (PILE.x0 + PILE.x1) / 2;
        for (const [w, h, d, ry, c] of [[pw, 4.2, 15, 0.02, '#4a2c1c'], [pw * 0.9, 3.6, 14, -0.05, '#5c1c16'], [pw * 0.77, 3.2, 12.5, 0.08, '#2c3850']]) {
          BK.add(rbox(w, h, d, 0.35, 2), M4(pcx, y + h / 2, PILE.z, 0, ry, 0), c); PP.add(box(w - 1, h - 1.1, d - 0.6), M4(pcx, y + h / 2, PILE.z + 0.4, 0, ry, 0), '#b9aa86'); y += h; }
        for (const k of [-1, 0, 1]) lib.addOccL(pcx + k * pw / 3, PILE.z, 7, TABLE.y + 11); }
      // THE SAND GLASS (SAND): two brass plates on three thin posts, two bulbs of glass between them; the upper bulb's sand sinks
      // and the lower heap grows on the world's clock, one turn in ten minutes, and a thread of sand falls between them
      { const y0 = TY, gl = lathe([[0, 1.0], [3.6, 1.1], [4.2, 2.4], [4.2, 5.0], [3.5, 6.9], [1.7, 8.4], [0.55, 9.0], [0.55, 9.4], [1.7, 10.0], [3.5, 11.5], [4.2, 13.4], [4.2, 16.0], [3.6, 17.3], [0, 17.4]], 28);
        gl.translate(SAND.x, y0, SAND.z);
        for (const y of [0, 17.4]) BR.add(lathe([[0, 0], [5.2, 0], [5.4, 0.3], [5.4, 0.8], [5.0, 1.0], [0, 1.0]], 28), M4(SAND.x, y0 + y, SAND.z), BRASS);
        for (let k = 0; k < 3; k++) { const a = 0.5 + k * TAU / 3; BR.add(cyl(0.32, 0.32, 16.4, 8), M4(SAND.x + Math.cos(a) * 4.8, y0 + 9.2, SAND.z + Math.sin(a) * 4.8), BRASS); }
        const su = { uAt: { value: new V3(SAND.x, y0, SAND.z) }, uPh: { value: R.sand.range(0, 1) } };
        const glass = new THREE.Mesh(gl, lib.mat({ name: 'table-sand-glass', transparent: true, depthWrite: false, uniforms: su, pars: 'uniform vec3 uAt; uniform float uPh;',
          surface: /* glsl */`{ float y=vW.y-uAt.y, run=fract(uTime/600.+uPh), ndv=clamp(abs(dot(N,V)),0.,1.);
            // the sand: the lower heap (a cone that grows), the upper store (its top sinks, dished to the middle)
            float rr=length(vW.xz-uAt.xz), low=step(y,2.2+2.4*run+1.6*(1.-rr/4.2)), up=step(10.2,y)*step(y,15.6-4.6*run-.8*(1.-rr/4.2));
            float sand=max(low,up), gr=.8+.4*vn3(vW*3.);
            alb=mix(vec3(.05,.07,.07),vec3(.62,.45,.24)*gr,sand); gloss=mix(.9,.1,sand); wrap=.4;
            alpha=mix(clamp(.1+.7*pow(1.-ndv,2.),0.,.85),1.,sand); }` }));
        glass.name = 'table-sand-glass'; glass.renderOrder = 4; scene.add(glass);
        const tg = new THREE.CylinderGeometry(0.2, 0.2, 7.6, 6, 1, true); tg.translate(SAND.x, y0 + 5.6, SAND.z);
        const thread = new THREE.Mesh(tg, lib.mat({ name: 'sand-thread', uniforms: su, pars: 'uniform vec3 uAt; uniform float uPh;', side: THREE.DoubleSide,
          surface: '{ float g=vn(vec2(atan(vW.z-uAt.z,vW.x-uAt.x)*2.,vW.y*2.4+uTime*14.)); alb=vec3(.62,.45,.24)*(.7+.6*g); gloss=.1; wrap=.5; }' }));
        thread.name = 'sand-thread'; thread.renderOrder = 3; scene.add(thread);
        lib.addOccL(SAND.x, SAND.z, 4.2, TABLE.y + SAND.h); }
      await ctx.yield();
      // NOTHING OF THE TABLE'S STANDING THINGS STANDS IN A SIGHT FROM THE LINE TO THE OPENING: counted here on the built places
      // (x, z, radius, height over the table); a thing that does is said aloud
      for (const [what, x, z, r, h] of [['lamp and moths', FLAME[0], FLAME[2], MOTHS + 1, 30], ['inkwell and pen', INK.x, INK.z, TRAY + 1.3, 15], ['mug', MUG.x, MUG.z, 4.4, 8.2], ['pipe', PIPE.x - 3, PIPE.z, 9, 4.8],
        ['rule', RULE.x - 10, RULE.z, RULE.half + 0.5, 3.2], ['rule', RULE.x, RULE.z, RULE.half + 0.5, 3.2], ['rule', RULE.x + 10, RULE.z, RULE.half + 0.5, 3.2], ['weight', WEIGHT.x, WEIGHT.z, 2.7, 3.9],
        ['dividers', DIV.at[0] + DIV.across[0] * DIV.half, DIV.at[2] + DIV.across[1] * DIV.half, 0.6, 20], ['dividers', DIV.at[0] - DIV.across[0] * DIV.half, DIV.at[2] - DIV.across[1] * DIV.half, 0.6, 20], ['sand glass', SAND.x, SAND.z, SAND.r, SAND.h]])
        if (!coneClear(x, z, r, h)) console.error('study: the ' + what + ' stands in a sight from the line to the opening');
    }
    await ctx.yield();

    // ---------------------------------------------------------------- what the seed lays on the table: lead weights on the working chart, a
    // folded chart, a sand shaker, a pencil, a magnifying glass. Each KIND draws from a stream of its own and stands by ONE rule: a
    // place drawn anywhere on the table top (the weights anywhere on the working chart) that is kept only if it lies outside every
    // keep-out, each a place of the table:
    //   the line's tube (6 m to either side of the line's track over the table);
    //   every sight from the line to the opening (coneClear, at the head of build);
    //   the fans of sight from the sill's point to the lamp's foot and to the bottle from its base to its cork;
    //   the bottle in its cradle and the caustic beside it; what stands on the table; the table's edge; each other.
    scene.userData.coneClear = coneClear; scene.userData.AT = AT;
    const tableFree = (() => {
      // in the bottle's own frame: along its axis from the base, across it toward the side away from the lamp
      const inBottle = (x, z, r) => { const al = (x - BOTTLE.x) * AXIS[0] + (z - BOTTLE.z) * AXIS[1], ac = (x - BOTTLE.x) * ACROSS[0] + (z - BOTTLE.z) * ACROSS[1], c = hero.anchors.caustic;
        return (Math.abs(ac) < BOTTLE.body + 2.3 * GROW + r && al > -4 * GROW - r && al < BOTTLE.len + 5 * GROW + r) || ((ac - c[0]) / (c[2] + 1 + r)) ** 2 + ((al + c[1]) / (c[3] + 1 + r)) ** 2 < 1; };
      // a fan of sight in plan: from the sill's point S to the stretch between two places A and B
      const S = [ROUTE[0][0], ROUTE[0][2]];
      const side = (ax, az, bx, bz, x, z) => ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / Math.hypot(bx - ax, bz - az);
      const inFan = (A, B, x, z, r) => { const sg = Math.sign(side(S[0], S[1], A[0], A[1], B[0], B[1])) || 1;
        return side(S[0], S[1], A[0], A[1], x, z) * sg > -r && side(S[0], S[1], B[0], B[1], x, z) * sg < r && side(A[0], A[1], B[0], B[1], x, z) * Math.sign(side(A[0], A[1], B[0], B[1], S[0], S[1])) > -r; };
      const fans = [[[FLAME[0] - 8, FLAME[2]], [FLAME[0] + 8, FLAME[2]]],
        [[BOTTLE.x - ACROSS[0] * RING, BOTTLE.z - ACROSS[1] * RING], [BOTTLE.x + AXIS[0] * (BOTTLE.len + 3), BOTTLE.z + AXIS[1] * (BOTTLE.len + 3)]]];
      // rectangles (x0, x1, z0, z1): the rule, the book pile, the pipe in its dish with its stem
      const rects = [[RULE.x - 15, RULE.x + 15, RULE.z - RULE.half, RULE.z + RULE.half], [PILE.x0, PILE.x1, PILE.z - 7.5, PILE.z + 7.5], [PIPE.x - 12.5, PIPE.x + 5.5, PIPE.z - 5.5, PIPE.z + 5.5]];
      // rounds (x, z, r): the sand glass, the lamp, the inkwell and its pen, the mug, the hanging chart's weight, the dividers' two points
      const dv = scene.userData.dividers, rounds = [[SAND.x, SAND.z, SAND.r + 1], [FLAME[0], FLAME[2], 7.5], [INK.x, INK.z, 7.2], [INK.x + 5, INK.z - 4.5, 4], [MUG.x + 0.6, MUG.z, 5.2], [WEIGHT.x, WEIGHT.z, 3],
        [dv.at[0] + dv.across[0] * DIV.half, dv.at[2] + dv.across[1] * DIV.half, 2], [dv.at[0] - dv.across[0] * DIV.half, dv.at[2] - dv.across[1] * DIV.half, 2]];
      const put = [];
      const ok = (x, z, r, h, box) => {
        if (x < box[0] + r || x > box[1] - r || z < box[2] + r || z > box[3] - r) return false;
        for (let k = 0; k < track.length; k += 2) if (Math.hypot(track[k] - x, track[k + 1] - z) < 6 + r) return false;
        if (inBottle(x, z, r) || !coneClear(x, z, r, h)) return false;
        for (const f of fans) if (inFan(f[0], f[1], x, z, r)) return false;
        for (const q of rects) if (x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r) return false;
        for (const q of rounds) if (Math.hypot(x - q[0], z - q[1]) < q[2] + r + 1) return false;
        for (const q of put) if (Math.hypot(x - q[0], z - q[1]) < q[2] + r + 1.5) return false;
        return true;
      };
      const TOP = [TABLE.x0 + 2, TABLE.x1 - 2, TABLE.z0 + 2, TABLE.z1 - 2], ONCHART = [CHART.x0, CHART.x1, CHART.z0, CHART.z1];
      // one try after another from the kind's own stream, at most 80; null when the table has no room left for it
      return (rng, r, h, onChart = false) => { const box = onChart ? ONCHART : TOP;
        for (let t = 0; t < 80; t++) { const x = rng.range(box[0], box[1]), z = rng.range(box[2], box[3]); if (ok(x, z, r, h, box)) { put.push([x, z, r]); return [x, z]; } }
        return null; };
    })();
    {
      const T = R.table;
      // three to five lead weights on the working chart
      const nW = T.weights.int(3, 5);
      for (let i = 0; i < nW; i++) { const at = tableFree(T.weights, 2.7, 3.9, true), ry = T.weights.range(0, TAU), sc = T.weights.range(0.92, 1.06); if (!at) continue;
        dealt.push({ kind: 'weight', on: 'table', x: at[0], z: at[1], r: 2.7, h: 3.9 }); IR.add(weightGeo(), M4(at[0], TY, at[1], 0, ry, 0, sc), '#6a6a70'); lib.addOccL(at[0], at[1], 2.6, TABLE.y + 3.9); }
      await ctx.yield();
      // a folded chart, on some nights
      { const on = T.folded.chance(0.45), at = on ? tableFree(T.folded, 5.6, 0.9) : null, ry = T.folded.range(0, PI);
        if (at) { dealt.push({ kind: 'folded chart', on: 'table', x: at[0], z: at[1], r: 5.6, h: 0.9 }); for (let k = 0; k < 3; k++) PP.add(box(9.2 - k * 0.2, 0.28, 6.4), M4(at[0] + k * 0.1, TY + 0.14 + k * 0.29, at[1], 0, ry + k * 0.01, 0), '#d9cdaa', { shade: () => 1 - k * 0.06 }); } }
      // a sand shaker
      { const on = T.shaker.chance(0.7), at = on ? tableFree(T.shaker, 2, 4.9) : null;
        if (at) { dealt.push({ kind: 'shaker', on: 'table', x: at[0], z: at[1], r: 2, h: 4.9 }); IR.add(lathe([[0, 0], [1.9, 0], [2.0, 0.3], [1.5, 1.0], [1.3, 2.6], [1.9, 3.6], [2.0, 4.4], [1.6, 4.7], [0, 4.9]], 24), M4(at[0], TY, at[1]), '#8d9096'); } }
      await ctx.yield();
      // a pencil (its whole length inside its round)
      { const on = T.pencil.chance(0.7), at = on ? tableFree(T.pencil, 7.6, 0.8) : null, a = T.pencil.range(0, PI);
        if (at) { const [x, z] = at; dealt.push({ kind: 'pencil', on: 'table', x, z, r: 0.4, h: 0.8, a, half: 7.4 });
          WD.add(cyl(0.38, 0.38, 12, 6), M4(x, TY + 0.36, z, 0, a, PI / 2), '#5c1c16'); IR.add(cyl(0.38, 0.03, 1.4, 6), M4(x + Math.cos(a) * 6.7, TY + 0.36, z - Math.sin(a) * 6.7, 0, a, PI / 2), '#2a2a2c'); } }
      // a magnifying glass (ring and handle inside its round)
      { const on = T.magnifier.chance(0.35), at = on ? tableFree(T.magnifier, 11, 1.2) : null, a = T.magnifier.range(0, TAU);
        if (at) { const [x, z] = at; dealt.push({ kind: 'magnifier', on: 'table', x, z, r: 4, h: 1.2, reach: 11 });
          BR.add(new THREE.TorusGeometry(3.6, 0.42, 10, 36), M4(x, TY + 0.5, z, PI / 2, 0, 0), BRASS);
          WD.add(lathe([[0.45, 0], [0.7, 1], [0.8, 4], [0.55, 6.6], [0.3, 7]], 12), M4(x + Math.cos(a) * 3.9, TY + 0.6, z + Math.sin(a) * 3.9, 0, -a, -PI / 2), '#3a2416');
          const lens = new THREE.Mesh(new THREE.SphereGeometry(3.4, 28, 8, 0, TAU, 0, 0.5), lib.mat({ name: 'magnifier', surface: '{ alb=vec3(.3,.26,.16); gloss=.95; emis=uLampCol*(.05+.12*fbm(vW.xz*.6)); }' }));
          lens.scale.set(1, 0.35, 1); lens.position.set(x, TY + 0.55 - 3.4 * 0.35 * Math.cos(0.5), z); lens.name = 'magnifier'; scene.add(lens); } }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the moths: each circles the chimney for ever on the lamp's ring (radius 8 to
    // 10 m about the lamp's axis, 12 to 22 m above the table), on the world clock. A body, kept off the route by place: the ring's
    // furthest reach with a wing (10 + 1.6 m = MOTHS) is LAMP.left - MOTHS = 16.9 m short of the route's line, at every phase,
    // and outside every sight from the line to the opening (checked at build with coneClear).
    {
      const mr = R.moth, ring = hero.anchors.mothRing, P = [], Nn = [], W = [], I = [];
      const tri = (a, b, c, w) => { const n = P.length / 3; P.push(...a, ...b, ...c); const nn = new V3().crossVectors(new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2])).normalize(); for (let k = 0; k < 3; k++) { Nn.push(nn.x, nn.y, nn.z); W.push(w); } I.push(n, n + 1, n + 2); };
      // wings: a fore and a hind wing each side, as fans from the root (x is the span, z the heading, forward -z)
      for (const sg of [-1, 1]) {
        const fan = (root, pts) => { for (let k = 0; k < pts.length - 1; k++) tri(root, [sg * pts[k][0], 0, pts[k][1]], [sg * pts[k + 1][0], 0, pts[k + 1][1]], sg); };
        fan([0, 0, -0.25], [[0.15, -0.55], [0.75, -0.8], [1.3, -0.7], [1.6, -0.35], [1.5, 0.05], [1.0, 0.3], [0.2, 0.25]]);
        fan([0, 0, 0.15], [[0.2, 0.15], [0.85, 0.35], [1.1, 0.7], [0.9, 1.05], [0.45, 1.1], [0.12, 0.75]]);
      }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); mg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); mg.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1)); mg.setIndex(I);
      const bodyG = lathe([[0, -0.75], [0.2, -0.7], [0.3, -0.45], [0.27, -0.1], [0.3, 0.2], [0.22, 0.6], [0.08, 0.85], [0, 0.88]], 10); bodyG.rotateX(PI / 2);
      mg.boundingSphere = new THREE.Sphere(new V3(), 2);
      // (one law for every moth's wings and body; glow: the light it flies in, of which its pale scales give a little back)
      const mothMat = (beat, glow) => lib.mat({ name: 'moth', side: THREE.DoubleSide, uniforms: { uBeat: { value: beat } }, vpars: 'attribute float aW; uniform float uBeat; varying float vWg;', pars: 'varying float vWg;',
        vert: /* glsl */`{ vWg=aW; float ang=aW*(.2+.95*sin(uTime*31.416+uBeat)); float c=cos(ang), s=sin(ang);
          p=vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z); n=vec3(n.x*c-n.y*s,n.x*s+n.y*c,n.z); }`,
        surface: /* glsl */`{ float r=length(vG.xz); float band=smoothstep(.35,.65,sin(r*9.+vG.z*4.)*.5+.5);
          alb=mix(vec3(.62,.54,.4),vec3(.3,.2,.12),band*.75); alb*=.8+.4*vn(vG.xz*9.);
          float eye=1.-smoothstep(.1,.16,length(vec2(abs(vG.x)-.95,vG.z+.25))); alb=mix(alb,vec3(.1,.07,.05),eye*abs(vWg));
          alb=mix(alb,vec3(.42,.32,.22)*(.7+.6*vn(vG.xz*30.)),1.-abs(vWg));
          gloss=.05; wrap=.8; emis=${glow}*alb*.1; }` });
      const moths = [];
      for (let i = 0; i < nMoths; i++) {
        const mm = mothMat(mr.range(0, TAU), 'uLampCol');
        const g = new THREE.Group(), wings = new THREE.Mesh(mg, mm), body = new THREE.Mesh(bodyG, mm);
        wings.name = 'moth-wings'; body.name = 'moth-body'; g.add(wings, body); scene.add(g);
        moths.push({ g, a0: mr.range(0, TAU), w: (mr.chance(0.5) ? 1 : -1) * mr.range(0.75, 1.05), p1: mr.range(0, TAU), p2: mr.range(0, TAU), p3: mr.range(0, TAU), k: i });
      }
      const cx = FLAME[0], cz = FLAME[2], rMid = (ring.radiusMin + ring.radiusMax) / 2, rAmp = (ring.radiusMax - ring.radiusMin) / 2 - 0.1;
      const yMid = TABLE.y + (ring.yMin + ring.yMax) / 2, yAmp = (ring.yMax - ring.yMin) / 2 - 0.4;
      const at = (m, t, out) => { const th = m.a0 + m.w * t + 0.45 * Math.sin(0.31 * t + m.p1), r = rMid + rAmp * Math.sin(0.53 * t + m.p2); return out.set(cx + r * Math.cos(th), yMid + yAmp * Math.sin(0.41 * t + m.p3) + 0.25 * Math.sin(t * 9 + m.p1), cz + r * Math.sin(th)); };
      const a = new V3(), b = new V3();
      tick.push((dt, time) => {
        for (const m of moths) {
          at(m, time, a); at(m, time + 0.05, b);
          m.g.position.copy(a); m.g.lookAt(a.x - (b.x - a.x), a.y - (b.y - a.y) * 0.5, a.z - (b.z - a.z));
          m.g.rotateZ(0.25 * Math.sin(time * 1.3 + m.p2));
          lib.u.uMoth.value[m.k].set(a.x, a.y, a.z, 1.25 + 0.3 * Math.sin(time * 31.416 + m.p1));
        }
      });
      // THE MOTH AT THE OPEN SOUTH LIGHT (WMOTH): one more on every night, come in from the dark, that wanders for ever before the
      // open light in the sky's cold light, over the stone seat: two slow waves each way about its home on the world clock,
      // never out of its own reach (WMOTH.rx, ry, rz), which lies wholly before the south wall and far from the line.
      { const wr = R.mothWindow, g = new THREE.Group(), mm = mothMat(wr.range(0, TAU), 'uSkyCol'), q = [wr.range(0, TAU), wr.range(0, TAU), wr.range(0, TAU)];
        const wings = new THREE.Mesh(mg, mm), body = new THREE.Mesh(bodyG, mm); wings.name = 'window-moth-wings'; body.name = 'window-moth-body'; g.add(wings, body); g.scale.setScalar(WMOTH.size); scene.add(g);
        const wat = (t, out) => out.set(WMOTH.x + WMOTH.rx * (0.8 * Math.sin(0.37 * t + q[0]) + 0.2 * Math.sin(0.93 * t + q[1])),
          WMOTH.y + WMOTH.ry * (0.84 * Math.sin(0.23 * t + q[1]) + 0.15 * Math.sin(1.31 * t + q[2])) + 0.25 * Math.sin(t * 9 + q[0]), WMOTH.z + WMOTH.rz * Math.sin(0.51 * t + q[2]));
        tick.push((dt, time) => { wat(time, a); wat(time + 0.05, b);
          g.position.copy(a); g.lookAt(a.x - (b.x - a.x), a.y - (b.y - a.y) * 0.5, a.z - (b.z - a.z)); g.rotateZ(0.25 * Math.sin(time * 1.3 + q[0])); }); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the air: dust motes in the lamp's reach (and falling in the moon's bar), the
    // pipe's blue thread of smoke, the mug's steam. All MEDIA: each thins to nothing toward the eye by its true distance; none within
    // 3 m of the opening's plane.
    {
      // DUST IN THE FOUR LIGHTS: the lamp's (n1, round the flame and through the room), the moon's bar (n2, falling), the green fan
      // before the bottle's base (n3: in the fan's own wedge, none in the sights to the opening) and the fire's light before
      // the fender (n4). Every mote takes every light by its own place; the kinds differ only in where they are dealt
      // A MOTE'S REACH ABOUT ITS HOME, the shader's own figures (it is moved by them below): it sways MOTE.x metres east and west
      // and MOTE.z north and south (two slow waves each), bobs MOTE.bob up and down, and a silver mote of the moon's light falls
      // MOTE.fall metres below its home and begins again. THE MOON'S MOTES KEEP OUT OF THE OPENING BY PLACE, at every clock and
      // the same on every seed: a home is dealt only where that whole reach, with the largest mote's own size (MOTE.size), stays
      // outside the tube of sights to the opening: MOTE.tube metres round the bottle's axis (the base ring and a metre and a
      // half, as the green motes keep), from where the last sixty metres of the line begin to as far behind the base's plane
      // as the lamp's motes keep from it. So none hangs, drifts or falls before the opening inside its outline, and none in
      // the tube round the last sixty metres.
      const MOTE = { x: [1.1, 0.3], z: [1.0, 0.3], bob: 0.7, fall: 12, size: 0.18, tube: RING + 1.5, before: 60, behind: 4.5 * GROW, dark: 5, full: 12, drift: 26, lift: 7, rise: [46, 30], out: [8, 2, 6] };
      // A MOTE'S LIGHT BY ITS PLACE FROM THE FLOWN LINE (no law of the lens): the least way from the line to the mote's whole
      // track (its home; the moon's fall below it; the green drift along the axis and its lift; a spark's rise and its way
      // out), less its sway and bob, is its clear air. With MOTE.full metres of it and more the mote is lit in full; with
      // MOTE.dark or less it is dark; evenly between. The figures below are the shader's own (it moves the mote by them).
      const moteSway = Math.hypot(MOTE.x[0] + MOTE.x[1], MOTE.z[0] + MOTE.z[1], MOTE.bob), axisH = lib.u.uAxisH.value;
      const moteAir = (x, y, z, kind, a) => { let air = offLine(x, y, z);
        if (kind === 1) for (let f = 3; f <= MOTE.fall; f += 3) air = Math.min(air, offLine(x, y - f, z));
        else if (kind === 2) for (let k = 0; k <= 4; k++) { const l = k / 4 - 0.5; air = Math.min(air, offLine(x + axisH.x * l * MOTE.drift, y + l * MOTE.lift, z + axisH.z * l * MOTE.drift) - MOTE.drift / 8); }
        else if (kind === 3) { const ph = a * TAU; for (let k = 1; k <= 5; k++) { const l = k / 5; air = Math.min(air, offLine(x + l * MOTE.out[0] * Math.sin(ph * 3), y + l * l * (MOTE.rise[0] + MOTE.rise[1] * a), z + l * MOTE.out[2] * Math.cos(ph * 5)) - l * MOTE.out[1] - 3); } }
        return air - moteSway; };
      const moteClear = (x, y, z, fall) => { const rh = Math.hypot(MOTE.x[0] + MOTE.x[1], MOTE.z[0] + MOTE.z[1]);
        const al = (x - BOTTLE.x) * AXIS[0] + (z - BOTTLE.z) * AXIS[1], ac = (x - BOTTLE.x) * ACROSS[0] + (z - BOTTLE.z) * ACROSS[1];
        if (al < -MOTE.before - rh || al > MOTE.behind + rh) return true;
        // (the nearest it comes to the axis's height on its way down, and the nearest to the axis's line in plan)
        const lo = y - fall - MOTE.bob - BOTTLE.y, hi = y + MOTE.bob - BOTTLE.y, hv = lo > 0 ? lo : hi < 0 ? -hi : 0;
        return Math.hypot(Math.max(Math.abs(ac) - rh, 0), hv) > MOTE.tube + MOTE.size; };
      const mo = R.motes, n1 = Math.round(1500 * detail), n2 = moon ? Math.round(800 * detail) : 0, n3 = Math.round(520 * detail), n4 = Math.round(420 * detail), n = n1 + n2 + n3 + n4;
      const pos = new Float32Array(n * 3), par = new Float32Array(n * 4), lit = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        if (i % 300 === 299) await ctx.yield();
        let x, y, z;
        if (i < n1) {
          for (let k = 0; k < 20; k++) {
            if (i % 10 < 7) { const a = mo.range(0, TAU), r = 6 + 150 * Math.pow(mo(), 0.7); x = FLAME[0] + r * Math.cos(a); z = FLAME[2] + r * Math.sin(a) * 0.9; y = mo.range(61, 150); }
            else { x = mo.range(-180, 190); z = mo.range(ROOM.z0 + 10, 148); y = mo.range(40, ROOM.h - 10); }
            if (x < -195 || x > 195 || z < ROOM.z0 + 3 || z > 157) continue;
            { const al = (x - BOTTLE.x) * AXIS[0] + (z - BOTTLE.z) * AXIS[1], ac = (x - BOTTLE.x) * ACROSS[0] + (z - BOTTLE.z) * ACROSS[1]; if (Math.abs(al) < 4.5 * GROW && Math.hypot(y - BOTTLE.y, ac) < 9 * GROW) continue; }
            break;
          }
        } else if (i < n1 + n2) {
          // (silver motes in the moon's light: each on a ray from a place of the east light, so far into the room; a home whose
          // whole reach would touch the opening's tube is dealt again, twenty times at most, and then stands over the tube
          // by its own fall)
          const mm = R.motesMoon;
          for (let k = 0; k < 20; k++) { const t = mm.range(12, 420); x = EWIN.xIn - moonDir.x * t; y = mm.range(EWIN.y0 + 3, EWIN.y1 - 3) - moonDir.y * t; z = mm.range(EWIN.z0 + 3, EWIN.z1 - 3) - moonDir.z * t;
            if (y < 1) y = mm.range(1, 12);
            if (moteClear(x, y, z, MOTE.fall)) break; }
          if (!moteClear(x, y, z, MOTE.fall)) y = BOTTLE.y + MOTE.tube + MOTE.fall + MOTE.bob + 1;
        } else if (i < n1 + n2 + n3) {
          // in the fan: so far before the base, so far to a hand, so far over or under the axis; never in the tube of sights
          // to the opening (the ring and 1.5 m round the axis), never under the table top
          const mg = R.motesGreen; let sB = 0, yB = 0, hB = 0;
          for (let k = 0; k < 20; k++) { sB = 5 + 95 * Math.pow(mg(), 1.4); const w = RING + GREEN.spread * sB; yB = mg.range(-0.85, 0.85) * w; hB = mg.range(-1, 1) * Math.min(0.2 * w, 12); if (Math.hypot(yB, hB) > RING + 1.5) break; }
          x = BOTTLE.x - AXIS[0] * sB + ACROSS[0] * yB; z = BOTTLE.z - AXIS[1] * sB + ACROSS[1] * yB; y = BOTTLE.y + hB;
          if (x > TABLE.x0 && x < TABLE.x1 && z > TABLE.z0 && z < TABLE.z1) y = Math.max(y, TABLE.y + 0.8);
        } else {
          // (the fire's sparks: over the grate and the hearth before it, each rising its own way and going out; some drift out past the fender)
          const mf = R.motesFire, out = Math.pow(mf(), 1.6); x = FIRE[0] - 6 + out * (FENDER.x + 40 - FIRE[0]); z = FIRE[2] + mf.range(-1, 1) * (16 + 40 * out); y = mf.range(8, 26);
        }
        const kind = i < n1 ? 0 : i < n1 + n2 ? 1 : i < n1 + n2 + n3 ? 2 : 3, pr = [mo, R.motesMoon, R.motesGreen, R.motesFire][kind];
        pos.set([x, y, z], i * 3); par.set([pr(), kind === 2 ? pr.range(0.1, 0.24) : kind === 3 ? pr.range(0.1, 0.22) : pr.range(0.06, 0.18), pr.range(0.5, 1.5), kind], i * 4);
        lit[i] = THREE.MathUtils.smoothstep(moteAir(x, y, z, kind, par[i * 4]), MOTE.dark, MOTE.full);
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4)); g.setAttribute('aLit', new THREE.InstancedBufferAttribute(lit, 1)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new V3(0, 110, 0), 320);
      const lightV = GLSL_NOISE + '\n' + GLSL_LIGHT;
      const mat = new THREE.ShaderMaterial({ uniforms: { ...lib.u }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`attribute vec3 aPos; attribute vec4 aPar; attribute float aLit; varying vec2 vQ; varying vec3 vCol;
          ${lightV}
          void main(){ float ph=aPar.x*6.2832, sp=aPar.z; vec3 c=aPos;
            c.x+=${MOTE.x[0].toFixed(2)}*sin(uTime*.13*sp+ph)+${MOTE.x[1].toFixed(2)}*sin(uTime*.41*sp+ph*3.); c.z+=${MOTE.z[0].toFixed(2)}*cos(uTime*.11*sp+ph*2.)+${MOTE.z[1].toFixed(2)}*sin(uTime*.37*sp+ph*5.);
            float isMoon=(aPar.w>.5&&aPar.w<1.5)?1.:0., isGreen=(aPar.w>1.5&&aPar.w<2.5)?1.:0., isSpark=aPar.w>2.5?1.:0.;
            c.y+=${MOTE.bob.toFixed(2)}*sin(uTime*.09*sp+ph*4.)-isMoon*mod(uTime*.35*sp+aPar.x*40.,${MOTE.fall.toFixed(1)});
            // the green motes rise slowly and drift toward the base; the sparks rise from the fire and go out: each on a round of
            // its own (life), lit at its middle and dark where the round begins again
            float life=fract(uTime*(.022*isGreen+.11*isSpark)*sp+aPar.x*9.), lit=mix(1.,sin(3.14159*life),max(isGreen,isSpark));
            c+=isGreen*(uAxisH*(life-.5)*${MOTE.drift.toFixed(1)}+vec3(0.,(life-.5)*${MOTE.lift.toFixed(1)},0.));
            c.y+=isSpark*life*life*(${MOTE.rise[0].toFixed(1)}+${MOTE.rise[1].toFixed(1)}*aPar.x); c.x+=isSpark*life*(${MOTE.out[0].toFixed(1)}*sin(ph*3.)+${MOTE.out[1].toFixed(1)}*sin(uTime*.9+ph)); c.z+=isSpark*life*${MOTE.out[2].toFixed(1)}*cos(ph*5.);
            vec3 Ll=uLampPos-c; float dl=length(Ll); float al=1./(1.+dl*dl/(uLampR*uLampR));
            float tws=clamp(.5+.5*sin(uTime*(.8+1.7*aPar.x)+ph*7.),0.,1.); float tw=.35+.65*tws*tws*tws;
            vec3 Lf=uFirePos+vec3(0.,6.,0.)-c; float df=length(Lf), af=1./(1.+df*df/(uFireR*uFireR));
            vCol=(uLampCol*al*lampVis(c)*.5*(1.-isMoon)+uMoonCol*moonVis(c)*.45+uFireCol*af*fireVis(c)*.4+greenAt(c,normalize(uBase-c),dl)*.5)*tw*lit;
            vCol+=isSpark*vec3(1.,.42,.08)*(1.-life)*lit*1.6;
            vec4 mv=viewMatrix*vec4(c,1.); float dist=length(mv.xyz);
            // its light by its place from the flown line (aLit, dealt at the build: the air round the line is clear), and the
            // medium's near law, the one term that reads the lens: within 3 m of the eye its light falls to nothing
            vCol*=aLit*smoothstep(.8,3.,dist);
            mv.xy+=position.xy*aPar.y; vQ=position.xy;
            gl_Position=projectionMatrix*mv; }`,
        fragmentShader: 'varying vec2 vQ; varying vec3 vCol; void main(){ float r=length(vQ); float a=1.-smoothstep(.15,1.,r); gl_FragColor=vec4(vCol*a*a,1.); }' });
      const motes = new THREE.Mesh(g, mat); motes.name = 'motes'; motes.frustumCulled = false; motes.renderOrder = 6; scene.add(motes);
    }
    await ctx.yield();
    {
      // the pipe's smoke: one blue thread rising 40 m... here to the level of the chimney's top, where it breaks into a flat veil
      const NS = 56, P = [], U = [], I = [];
      for (let i = 0; i <= NS; i++) { for (const sd of [-1, 1]) { P.push(0, 0, 0); U.push(sd, i / NS); } if (i > 0) { const a = (i - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); sg.setIndex(I);
      sg.boundingSphere = new THREE.Sphere(new V3(PIPE.x + 8, TABLE.y + 16, PIPE.z), 40);
      const so = R.smoke.range(0, 20);
      const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: lib.u.uTime, uLampCol: lib.u.uLampCol, uBase: { value: new V3(PIPE.x + 2.9, TABLE.y + 4.6, PIPE.z - 1.1) }, uSo: { value: so } },
        vertexShader: /* glsl */`uniform float uTime, uSo; uniform vec3 uBase; varying vec2 vU; varying float vA;
          vec3 line(float s){ float t=uTime*.45+uSo; float veil=smoothstep(.62,1.,s);
            vec3 c=uBase+vec3(0.,24.*(s-.45*veil*veil*(s-.62)*2.2),0.);
            c.x+=(1.6*s*s)*sin(s*7.-t*1.3)+.5*s*sin(s*17.-t*2.3)+13.*veil*veil+2.5*veil*sin(t*.5+s*5.);
            c.z+=(1.3*s*s)*cos(s*6.-t*1.1)+.4*s*sin(s*15.-t*1.9)+3.5*veil*sin(t*.4+s*4.+1.);
            return c; }
          void main(){ float s=uv.y; vec3 c=line(s), c2=line(s+.01); vec3 tg=normalize(c2-c); vec3 toE=normalize(cameraPosition-c);
            vec3 sd=normalize(cross(tg,toE)+vec3(1e-5)); float veil=smoothstep(.62,1.,s);
            float w=.18+1.3*s*s+4.5*veil*veil; c+=sd*uv.x*w; vU=uv;
            float dist=length(cameraPosition-c);
            vA=smoothstep(0.,.05,s)*(1.-smoothstep(.8,1.,s))*(.5/(.35+w*.5))*smoothstep(1.,6.,dist);
            gl_Position=projectionMatrix*viewMatrix*vec4(c,1.); }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uLampCol; varying vec2 vU; varying float vA;
          ${GLSL_NOISE}
          void main(){ float e=1.-vU.x*vU.x; float wisp=.55+.45*vn(vec2(vU.x*2.5,vU.y*26.-uTime*.9));
            gl_FragColor=vec4((vec3(.32,.4,.62)*.5+uLampCol*vec3(.1,.12,.2))*e*e*wisp*vA,1.); }` }));
      smoke.name = 'pipe-smoke'; smoke.renderOrder = 6; scene.add(smoke);
      // the mug's steam: a short soft plume leaning east with the draught
      const ns = 14, sp = new Float32Array(ns * 4); for (let i = 0; i < ns; i++) sp.set([R.smoke(), R.smoke.range(3.2, 5.2), R.smoke.range(-1, 1), R.smoke.range(-1, 1)], i * 4);
      const pg = new THREE.InstancedBufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
      pg.setAttribute('aS', new THREE.InstancedBufferAttribute(sp, 4)); pg.instanceCount = ns; pg.boundingSphere = new THREE.Sphere(new V3(MUG.x + 4, TABLE.y + 12, MUG.z), 22);
      const steam = new THREE.Mesh(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: lib.u.uTime, uLampCol: lib.u.uLampCol, uBase: { value: new V3(MUG.x, TABLE.y + 8.2, MUG.z) } },
        vertexShader: /* glsl */`attribute vec4 aS; uniform float uTime; uniform vec3 uBase; varying vec2 vQ; varying float vA, vSeed;
          void main(){ float age=fract(uTime/aS.y+aS.x); vSeed=aS.x*31.;
            vec3 c=uBase+vec3(aS.z*1.2+5.5*age*age+.8*sin(age*5.+vSeed),10.*age,aS.w*1.2+.8*cos(age*4.+vSeed));
            vec4 mv=viewMatrix*vec4(c,1.); float dist=length(mv.xyz); mv.xy+=position.xy*(1.3+3.4*age); vQ=position.xy;
            vA=smoothstep(0.,.15,age)*(1.-smoothstep(.45,1.,age))*smoothstep(1.,6.,dist);
            gl_Position=projectionMatrix*mv; }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uLampCol; varying vec2 vQ; varying float vA, vSeed;
          ${GLSL_NOISE}
          void main(){ float r=length(vQ); float a=(1.-smoothstep(.1,1.,r))*(.5+.5*vn(vQ*1.7+vSeed+uTime*.3));
            gl_FragColor=vec4((uLampCol*.07+vec3(.02,.025,.035))*a*vA,1.); }` }));
      steam.name = 'mug-steam'; steam.renderOrder = 6; scene.add(steam);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- what the seed leaves about on the floor. Each KIND draws from a stream
    // of its own and stands by ONE rule: a place drawn in the kind's home (a part of the room named by its things) is kept only if it
    // lies outside every keep-out, each a place: the line's tube (the thing's skin no nearer the line than 3 m plus twice its own
    // height, tested on this line at every 2 m), the rug and its fringe, the hearth behind its fender, the hanging sheet, the table's
    // and the chair's legs, the stool, the clock, the globe, the door, the curtain's reach, the quill, the tripod, the walls, each other.
    const floorPut = [];
    const floorFree = (x, z, r, h, onRug = false) => {
      const qa = QUILL.a, qb = QUILL.b;
      const segD = (a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); };
      if (offLine(x, h * 0.5, z) - r < 3 + 2 * h) return false;
      // a thing of the rug lies wholly on the pile and clear of the chair; every other thing lies clear of the rug and its fringe
      if (x > CHAIR.x0 - CHAIR.out - r - 2 && x < CHAIR.x1 + CHAIR.out + r + 2 && z > CHAIR.z0 - CHAIR.out - r - 2 && z < CHAIR.z1 + CHAIR.out + r + 2) return false;
      if (onRug) { if (x < RUG.x0 + r || x > RUG.x1 - r || z < RUG.z0 + r || z > RUG.z1 - r) return false; }
      else if (x > -125 - r - 10 && x < 80 + r && z > -55 - r && z < 50 + r) return false;
      if (x < FENDER.x + r + 3 && z > FENDER.z0 - r - 3 && z < FENDER.z1 + r + 3) return false;
      if (x > SHEET.xFlat - r - 3 && x < TABLE.x1 + r + 3 && z < SHEET.z1 + r + 8) return false;
      if (x < -140 + r && z < NZ - 128 + r) return false;
      if (z > 108 - r) return false;
      if (segD(qa, qb) < r + 5) return false;
      if (Math.hypot(x - TRIPOD.x, z - TRIPOD.z) < TRIPOD.feet + 6 + r) return false;
      if (Math.abs(x - LADDER.x) < LADDER.wide / 2 + 4 + r && z < ROOM.z0 + SHELF.deep + LADDER.out + 4 + r) return false;
      if (Math.hypot(x - STOOL.x, z - STOOL.z) < 20 + r || Math.hypot(x - GLOBE.x, z - GLOBE.z) < GLOBE.keep + r || Math.hypot(x - ROLLS.x, z - ROLLS.z) < ROLLS.keep + r) return false;
      if (x > ROOM.x1 - r - 12 && z > 24 - r && z < 106 + r) return false;
      if (x < ROOM.x0 + r + 2 || x > ROOM.x1 - r - 2 || z < ROOM.z0 + r + 2) return false;
      for (const p of floorPut) if (Math.hypot(x - p[0], z - p[1]) < r + p[2] + 1.5) return false;
      return true;
    };
    // tries from the kind's own stream, at most 60, in its home: home(rng) gives a place [x, z]
    const floorPlace = (rng, home, r, h) => { for (let t = 0; t < 60; t++) { const [x, z] = home(rng); if (floorFree(x, z, r, h)) { floorPut.push([x, z, r]); return [x, z]; } } return null; };
    // the homes, each by things of the room: by a wall (a point along the west, north or east wall, the thing's back 2 m off it);
    // the hearth side (round the fire as far as the rug's middle, where what is thrown at the fire and misses lies); the bare
    // boards before the fender, from its face to the hearth run's line, from 30 m beyond its north end to 30 m beyond its south end
    const homeWall = (r) => (rng) => { const w = rng.int(0, 2), t = rng(); return w === 0 ? [ROOM.x0 + r + 2.5, lerp(ROOM.z0, ROOM.z1, t)] : w === 1 ? [lerp(ROOM.x0, ROOM.x1, t), ROOM.z0 + r + 2.5] : [ROOM.x1 - r - 2.5, lerp(ROOM.z0, ROOM.z1, t)]; };
    const homeHearth = (rng) => { const a = rng.range(0, TAU), d = ((RUG.x0 + RUG.x1) / 2 - FIRE[0]) * Math.sqrt(rng()); return [FIRE[0] + d * Math.cos(a), FIRE[2] + d * Math.sin(a)]; };
    const homeBoards = (rng) => [rng.range(FENDER.x + 2, FENDER.x + LINE.hearth), rng.range(FENDER.z0 - 30, FENDER.z1 + 30)];
    // ---------------------------------------------------------------- THE GREAT FALLEN THINGS on the rug and on the bare boards before the
    // fire, which tell the scale: a pair of spectacles lying folded, a ball of crumpled blank paper like a boulder, a slipper
    // like a hull on its side, a brass button like a shield. Each from a stream of its own, by the floor's ONE rule (floorFree:
    // the line's tube of 3 m plus twice the thing's height, and every other keep-out), each in its home:
    //   the spectacles on the bare boards round the fender's south end, as far from it as half the fender is long (where one
    //   who sat at the fire let things fall);
    //   the slipper and the boulder on the rug's hearth end (kicked off, thrown at the fire and fallen short): the third of
    //   the rug nearest the hearth, 8 m inside its borders;
    //   the button on the rug's south-west quarter, 3 m inside its borders.
    // EACH LIES BY THE LINE, BY ONE RULE FOR ALL: its skin no nearer to the line than its own tube (3 m and twice its height:
    // the floor's rule) and no further than that tube and NEAR.wide, twice the height at which the line goes along the hearth.
    // So a low thing lies close under the eye and a tall one stands off by its own height.
    // THEY ARE DEALT FIRST of all that lies on the floor, so that each finds its room on every night; what is small lies
    // down round them.
    const NEAR = { wide: 2 * LINE.lane };
    {
      const G = R.floor, homeFore = (rng) => { const a = rng.range(0, TAU), d = (FENDER.z1 - FENDER.z0) / 2 * Math.sqrt(rng()); return [FENDER.x + d * Math.cos(a), FENDER.z1 + d * Math.sin(a)]; };
      // a place of the home whose skin stands within NEAR.wide of its own tube from the line (the line's own samples every 2 m)
      const place = async (rng, r, h, home = homeFore, onRug = false) => { const tube = 3 + 2 * h; for (let t = 0; t < 600; t++) { if (t % 40 === 39) await ctx.yield(); const [x, z] = home(rng), o = offLine(x, h * 0.5, z) - r; if (o >= tube && o <= tube + NEAR.wide && floorFree(x, z, r, h, onRug)) { floorPut.push([x, z, r]); return [x, z]; } } return null; };
      const homeRug = (rng) => [rng.range(RUG.x0 + 8, RUG.x0 + (RUG.x1 - RUG.x0) / 3), rng.range(RUG.z0 + 8, RUG.z1 - 8)], homeStrip = (rng) => [rng.range(RUG.x0 + 3, (RUG.x0 + RUG.x1) / 2), rng.range((RUG.z0 + RUG.z1) / 2, RUG.z1 - 3)];
      // the slipper first (the largest, with the fewest places): 22 m long, lying on its side on the rug's hearth end
      { const at = await place(G.slipper, 11.5, 8, homeRug, true), turn = G.slipper.range(-0.5, 0.5), col = G.slipper.pick(['#6a1f1c', '#27344e', '#3f3a1f']);
        if (at) { const b = makeBuilder(), sh = new THREE.Shape();
          for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, w = 3.2 + 0.9 * Math.cos(a), x = 11 * Math.cos(a), z = w * Math.sin(a); if (i === 0) sh.moveTo(x, z); else sh.lineTo(x, z); }
          const sole = new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2, curveSegments: 8 }); sole.rotateX(PI / 2);
          const m = new THREE.Matrix4().makeRotationY(turn).multiply(new THREE.Matrix4().makeRotationX(1.3)).setPosition(at[0], 4.9, at[1]);
          b.add(sole, m.clone(), '#8a6a42');
          b.add(new THREE.SphereGeometry(1, 28, 12, -PI / 2, PI, 0, PI / 2), m.clone().multiply(M4(2, 0, 0, 0, 0, 0, 9, 4.3, 3.9)), col);
          b.add(new THREE.SphereGeometry(1, 28, 12, -PI / 2, PI, 0, PI / 2), m.clone().multiply(M4(2.2, 0.1, 0, 0, 0, 0, 8.6, 4.0, 3.6)), '#cbb892');
          b.add(new THREE.TorusGeometry(3.9, 0.45, 8, 24, PI), m.clone().multiply(M4(2, 0, 0, 0, PI / 2, 0, 1, 1.1, 1)), '#cbb892');
          mesh(b.build(), lib.mat({ name: 'slipper', vertexColors: true, side: THREE.DoubleSide, surface: '{ float n=fbm3(vW*.7); alb*=(.75+.5*n)*(.9+.2*vn3(vW*3.)); gloss=.12; wrap=.5; }' }), 'slipper');
          dealt.push({ kind: 'slipper', on: 'rug', x: at[0], z: at[1], r: 11.5, h: 9 }); lib.addOccF(at[0], at[1], 6, 7); } }
      await ctx.yield();
      // the spectacles, 11 m across: two round glasses in brass wire, the side pieces folded behind them; they lean back on the
      // folded sides, and they were put down by one who sat at the fire: their glasses are turned toward the hearth, within half
      // a radian either way. THE FIRE IS IN BOTH GLASSES by the light law: a glass shows the fire where the sight through it, or
      // the sight thrown back by it, goes toward the fire, and only as far as the fire sees the glass (the fender's shade counts).
      { const at = await place(G.spectacles, 6, 4.8), off = G.spectacles.range(-0.5, 0.5);
        if (at) { const face = Math.atan2(FIRE[0] - at[0], FIRE[2] - at[1]) + off;
          const m = new THREE.Matrix4().makeRotationY(face).multiply(new THREE.Matrix4().makeRotationX(-0.4)).setPosition(at[0], 0.25, at[1]);
          const put = (g, l) => BR.add(g, l ? m.clone().multiply(l) : m, BRASS), lens = [];
          for (const sd of [-1, 1]) { put(new THREE.TorusGeometry(2.3, 0.28, 10, 44), M4(sd * 2.85, 2.5, 0)); put(box(0.5, 0.7, 0.5), M4(sd * 5.3, 2.9, -0.1));
            put(tube([[sd * 5.3, 2.9, -0.35 - 0.3 * (sd + 1)], [sd * 1.5, 2.8, -0.75 - 0.3 * (sd + 1)], [-sd * 3.6, 2.6, -0.95 - 0.3 * (sd + 1)], [-sd * 4.9, 2.2, -0.95 - 0.3 * (sd + 1)], [-sd * 5.5, 1.3, -0.95 - 0.3 * (sd + 1)]], 0.16, 28, 7));
            const lg = new THREE.CircleGeometry(2.2, 40); lg.applyMatrix4(m.clone().multiply(M4(sd * 2.85, 2.5, 0))); lens.push(lg); }
          put(tube([[-0.6, 3.1, 0], [-0.3, 3.5, 0.12], [0.3, 3.5, 0.12], [0.6, 3.1, 0]], 0.18, 12, 7));
          const lb = makeBuilder(); for (const g of lens) lb.add(g, null, '#ffffff');
          const glass = lib.mat({ name: 'spectacle-glass', transparent: true, depthWrite: false, side: THREE.DoubleSide, surface: /* glsl */`{
            vec3 Lh=normalize(uFirePos+vec3(0.,8.,0.)-vW), Rf=reflect(-V,N);
            float thru=pow(clamp(dot(-V,Lh),0.,1.),5.), back=pow(clamp(dot(Rf,Lh),0.,1.),5.);
            float lick=.3+.7*vn(vec2(vW.x*.9+vW.z*.9,vW.y*1.3-uTime*2.4)), beat=.8+.2*sin(uTime*6.1+vW.x);
            float see=.3+.7*fireVis(vW);
            alb=vec3(.02,.03,.03); gloss=.95;
            emis=uFireCol*(thru+back)*see*lick*beat*.5+uFireCol*.02;
            alpha=clamp(.22+.7*(thru+back)*see,0.,.95); }` });
          const lm = mesh(lb.build(), glass, 'spectacle-glasses'); lm.renderOrder = 3;
          dealt.push({ kind: 'spectacles', on: 'floor', x: at[0], z: at[1], r: 6, h: 4.8 }); } }
      await ctx.yield();
      // the boulder of paper, 11 to 13 m across
      { const r = G.boulder.range(5.5, 6.5), at = await place(G.boulder, r, r * 1.6, homeRug, true), o = G.boulder.range(0, 50), ry = G.boulder.range(0, TAU);
        if (at) { const g = new THREE.IcosahedronGeometry(1, 7), p = g.attributes.position;
          for (let k = 0; k < p.count; k++) { if (k % 800 === 799) await ctx.yield(); const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k); const d = 1 - 0.32 * Math.abs(ctx.noise.n3(vx * 1.9 + o, vy * 1.9, vz * 1.9)) - 0.18 * Math.abs(ctx.noise.n3(vx * 4.7, vy * 4.7 + o, vz * 4.7)) - 0.09 * Math.abs(ctx.noise.n3(vx * 9.3, vy * 9.3, vz * 9.3 + o)); p.setXYZ(k, vx * d, vy * d * 0.86, vz * d); }
          await ctx.yield(); g.computeVertexNormals(); await ctx.yield(); PB.add(g, M4(at[0], r * 0.74, at[1], 0, ry, 0, r), '#d6ccae', { shade: (px, py) => 0.8 + 0.2 * py });
          dealt.push({ kind: 'paper boulder', on: 'rug', x: at[0], z: at[1], r, h: r * 1.6, ball: true }); lib.addOccF(at[0], at[1], r * 0.8, r * 1.5); } }
      await ctx.yield();
      // the brass button, 9 m across, like a shield: domed, with a rolled rim and a ring of small bosses, lying on the pile a
      // little tipped on its shank (plain: no mark)
      { const at = await place(G.shield, 4.6, 2, homeStrip, true), ry = G.shield.range(0, TAU), tip = G.shield.range(0.14, 0.26);
        if (at) { const m = M4(at[0], 1.9, at[1], tip, ry, 0), put = (g, l) => BR.add(g, l ? m.clone().multiply(l) : m, BRASS);
          put(lathe([[0, 1.5], [1.4, 1.42], [2.8, 1.05], [3.6, 0.6], [3.9, 0.5], [4.1, 0.75], [4.4, 0.7], [4.5, 0.35], [4.3, 0], [0, 0]], 48));
          for (let k = 0; k < 12; k++) { const a = k * TAU / 12; put(new THREE.SphereGeometry(0.3, 10, 8), M4(3.15 * Math.cos(a), 0.95, 3.15 * Math.sin(a))); }
          put(new THREE.TorusGeometry(0.9, 0.22, 8, 20), M4(0, -0.75, 0, 0, 0, PI / 2));
          dealt.push({ kind: 'button', on: 'rug', x: at[0], z: at[1], r: 4.6, h: 2.9 }); } }
      await ctx.yield();
    }
    {
      const F = R.floor;
      // one or two piles of books standing by a wall
      const nPiles = F.piles.int(1, 2);
      for (let i = 0; i < nPiles; i++) {
        const at = floorPlace(F.piles, homeWall(11), 13, 4), nb = F.piles.int(2, 5), books = [];
        for (let k = 0; k < nb; k++) books.push([F.piles.range(15, 21), F.piles.range(3, 5.5), F.piles.range(22, 28), F.piles.range(-0.2, 0.2), F.piles.pick(['#4a2c1c', '#5c1c16', '#2c3850', '#63462a', '#3c2416'])]);
        if (!at) continue;
        let y = 0; const [x, z] = at, turn = Math.abs(z - ROOM.z0) < 16 ? PI / 2 : 0;
        for (const [w, h, d, ry, c] of books) { BK.add(rbox(w, h, d, 0.35, 2), M4(x, y + h / 2, z, 0, ry + turn, 0), c); PP.add(box(w - 0.7, h - 1.2, d - 1.2), M4(x + (turn ? 0 : 0.5), y + h / 2, z + (turn ? 0.5 : 0), 0, ry + turn, 0), '#b9aa86'); y += h; }
        dealt.push({ kind: 'book pile', on: 'floor', x, z, r: 13, h: y });
      }
      await ctx.yield();
      // a stick of sealing wax on the hearth side, on some nights
      { const on = F.wax.chance(0.65), at = on ? floorPlace(F.wax, homeHearth, 7, 2.2) : null, a = F.wax.range(0, PI);
        if (at) { WD.add(cyl(1.1, 1.1, 13, 12), M4(at[0], 1.1, at[1], 0, a, PI / 2), '#7a1712', { shade: (px, py) => (py > 5.6 ? 0.45 : 1) }); dealt.push({ kind: 'sealing wax', on: 'floor', x: at[0], z: at[1], r: 1.1, h: 2.2, a, half: 6.5 }); } }
      await ctx.yield();
      // two to five balls of crumpled paper 5 to 9 m across, thrown at the fire
      const nBalls = F.balls.int(2, 5);
      for (let i = 0; i < nBalls; i++) {
        const r = F.balls.range(2.5, 4.5), at = floorPlace(F.balls, homeHearth, r, r * 1.6), o = F.balls.range(0, 50), rx = F.balls.range(0, 1), ry = F.balls.range(0, TAU);
        if (!at) continue;
        const [x, z] = at, g = new THREE.IcosahedronGeometry(1, 6), p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { if (k % 800 === 799) await ctx.yield(); const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k); const d = 1 - 0.32 * Math.abs(ctx.noise.n3(vx * 1.9 + o, vy * 1.9, vz * 1.9)) - 0.18 * Math.abs(ctx.noise.n3(vx * 4.7, vy * 4.7 + o, vz * 4.7)) - 0.09 * Math.abs(ctx.noise.n3(vx * 9.3, vy * 9.3, vz * 9.3 + o)); p.setXYZ(k, vx * d, vy * d * 0.86, vz * d); }
        await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
        PB.add(g, M4(x, r * 0.74, z, rx, ry, 0, r), '#d6ccae', { shade: (px, py) => 0.8 + 0.2 * py });
        dealt.push({ kind: 'paper ball', on: 'floor', x, z, r, h: r * 1.6, ball: true }); lib.addOccF(x, z, r * 0.8, r * 1.5);
        await ctx.yield();
      }
      await ctx.yield();
      // THE FLOOR IS A COUNTRY: the small things of a study on the bare boards between the fringe and the fender, each in its true size
      // at eighty times life, each kind from its own stream, by the one rule above: pins like spears, a thimble like a silver tub,
      // buttons, a key (no mark), a coil of string, drips of sealing wax, nut shells, a feather
      const S = R.small, SM = makeBuilder(), rec = (kind, x, z, r, h, o = {}) => dealt.push({ kind, on: 'floor', x, z, r, h, ...o });
      for (let i = 0; i < 36; i++) { const at = floorPlace(S.pins, homeBoards, 1.15, 0.2), a = S.pins.range(0, TAU); if (!at) continue; const [x, z] = at;
        IR.add(cyl(0.05, 0.012, 2.2, 6), M4(x, 0.07, z, 0, a, PI / 2), '#c2c6cc'); IR.add(new THREE.SphereGeometry(0.15, 8, 6), M4(x - Math.cos(a) * 1.1, 0.15, z + Math.sin(a) * 1.1), '#c2c6cc'); rec('pin', x, z, 0.1, 0.3, { a, half: 1.1 }); }
      await ctx.yield();
      { const at = floorPlace(S.thimble, homeBoards, 0.9, 1.6), ry = S.thimble.range(0, TAU), lying = S.thimble.chance(0.4);
        if (at) { IR.add(lathe([[0.62, 0], [0.78, 0.03], [0.8, 0.14], [0.74, 0.2], [0.7, 0.9], [0.6, 1.4], [0.42, 1.6], [0, 1.64]], 28), lying ? M4(at[0], 0.75, at[1], PI / 2 - 0.05, ry, 0) : M4(at[0], 0, at[1], 0, ry, 0), '#d4d7dc', { shade: (px, py) => 0.82 + 0.18 * Math.sin(py * 40) }); rec('thimble', at[0], at[1], 0.8, 1.6); } }
      for (let i = 0; i < 6; i++) { const at = floorPlace(S.buttons, homeBoards, 0.6, 0.2), c = S.buttons.pick(['#d9cfb4', '#3a2a1c', '#7a5a3a', '#c9c2b0']); if (!at) continue;
        SM.add(lathe([[0, 0], [0.5, 0], [0.6, 0.06], [0.6, 0.14], [0.5, 0.2], [0.42, 0.13], [0, 0.11]], 20), M4(at[0], 0, at[1]), c); rec('button', at[0], at[1], 0.6, 0.2); }
      await ctx.yield();
      { const at = floorPlace(S.key, homeBoards, 2.6, 0.5), a = S.key.range(0, TAU);
        if (at) { const m = M4(at[0], 0.2, at[1], 0, a, 0), put = (g, l) => IR.add(g, m.clone().multiply(l), '#4a4744');
          put(new THREE.TorusGeometry(0.75, 0.2, 8, 20), M4(-1.7, 0, 0, PI / 2, 0, 0)); put(cyl(0.17, 0.17, 3.2, 10), M4(0.6, 0, 0, 0, 0, PI / 2)); put(cyl(0.26, 0.26, 0.3, 10), M4(-0.85, 0, 0, 0, 0, PI / 2));
          put(box(0.7, 0.16, 0.9), M4(1.75, 0, 0.5)); put(box(0.25, 0.16, 0.5), M4(1.2, 0, 0.35)); rec('key', at[0], at[1], 0.3, 0.5, { a, half: 2.5 }); } }
      { const at = floorPlace(S.string, homeBoards, 2.4, 0.7), a = S.string.range(0, TAU), e = S.string.range(2.5, 4.5);
        if (at) { const [x, z] = at; for (let k = 0; k < 4; k++) SM.add(new THREE.TorusGeometry(1.25 + 0.14 * Math.sin(k * 2.3 + a), 0.11, 6, 28), M4(x + 0.1 * Math.cos(k * 1.9), 0.11 + k * 0.17, z + 0.1 * Math.sin(k * 1.7), PI / 2 + 0.05 * Math.sin(k * 3 + a), 0, 0), '#b9a987');
          SM.add(tube([[x + 1.25 * Math.cos(a), 0.6, z + 1.25 * Math.sin(a)], [x + 1.9 * Math.cos(a + 0.3), 0.15, z + 1.9 * Math.sin(a + 0.3)], [x + (1.6 + e * 0.5) * Math.cos(a + 0.7), 0.11, z + (1.6 + e * 0.5) * Math.sin(a + 0.7)], [x + (1.4 + e) * Math.cos(a + 0.5), 0.11, z + (1.4 + e) * Math.sin(a + 0.5)]], 0.11, 20, 6), null, '#b9a987'); rec('string', x, z, 2.4, 0.7); } }
      await ctx.yield();
      for (let i = 0; i < 20; i++) { const r = S.drips.range(0.18, 0.46), at = floorPlace(S.drips, homeBoards, r, 0.2); if (!at) continue;
        SM.add(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, PI / 2), M4(at[0], 0, at[1], 0, 0, 0, r, r * 0.45, r), '#7a1712'); rec('wax drip', at[0], at[1], r, 0.2); }
      for (let i = 0; i < 12; i++) { const r = S.shells.range(0.9, 1.3), at = floorPlace(S.shells, homeBoards, r, r), rx = S.shells.range(-0.5, 0.5), ry = S.shells.range(0, TAU), up = S.shells.chance(0.5); if (!at) continue;
        SM.add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, PI / 2), M4(at[0], up ? r * 0.72 : 0.02, at[1], up ? PI + rx : rx * 0.3, ry, 0, r, r * 0.72, r * 0.86), '#6b4a2a', { shade: (px, py) => 0.75 + 0.25 * Math.sin(px * 9) }); rec('nut shell', at[0], at[1], r, r); }
      await ctx.yield();
      // a small down feather (6 m at our size): the shaft a tube, the vane one curled sheet whose barbs are cut by the surface
      { const at = floorPlace(S.feather, homeBoards, 3.2, 0.8), a = S.feather.range(0, TAU);
        if (at) { const g = new THREE.PlaneGeometry(6.2, 2.2, 16, 6), p = g.attributes.position;
          for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.22 * y * y - 0.012 * x * x + 0.55); }
          g.computeVertexNormals();
          const fm = new THREE.Mesh(g, lib.mat({ name: 'feather', side: THREE.DoubleSide, surface: /* glsl */`{ vec2 q=vUv-.5; float w=.46*pow(max(sin(clamp(vUv.x*1.06,0.,1.)*3.1416),0.),.6)*(.6+.4*vUv.x);
            float barb=sin((vUv.x*90.+abs(q.y)*70.))*.5+.5; float split=step(.12,fract(vUv.x*5.3+.2*sin(vUv.x*31.)))+step(abs(q.y),.2*w);
            if(abs(q.y)>w*(.86+.14*barb)||split<.5&&abs(q.y)>.25*w&&barb<.5) discard;
            alb=mix(vec3(.78,.74,.66),vec3(.5,.44,.36),smoothstep(.0,.5,vUv.x))*(.75+.25*barb); alb=mix(alb,vec3(.86,.82,.72),1.-smoothstep(.0,.03,abs(q.y)));
            gloss=.12; metal=0.; }` }));
          fm.rotation.set(-PI / 2, a, 0, 'YXZ'); fm.position.set(at[0], 0.05, at[1]); fm.name = 'feather'; scene.add(fm);
          rec('feather', at[0], at[1], 3.2, 0.8, { a }); } }
      if (SM.triangles) mesh(SM.build(), lib.mat({ name: 'small-things', vertexColors: true, grain: true, surface: '{ float sp=vn3(vG*3.); alb*=.85+.3*sp; gloss=.3; }' }), 'small-things');
      await ctx.yield();
      // on some nights a dropped glove on the boards by the chair: a hill of leather 16 m long
      // (its home is before the chair's seat, where it slid from a knee: within 20 m of the chair's north face, along its breadth)
      if (F.glove.chance(0.4)) {
        const gb = makeBuilder(), gr = 10, gx = F.glove.range(CHAIR.x0 + gr, CHAIR.x1 - gr), gz = F.glove.range(CHAIR.z0 - CHAIR.out - gr - 20, CHAIR.z0 - CHAIR.out - gr), ry = F.glove.range(-0.6, 0.6);
        dealt.push({ kind: 'glove', on: 'floor', x: gx, z: gz, r: gr, h: 4 });
        const gm = new THREE.Matrix4().makeRotationY(ry).setPosition(gx, 1, gz), put = (g, m) => gb.add(g, gm.clone().multiply(m));
        put(rbox(8.5, 2.6, 7.4, 1.1, 3), M4(0, 1.4, 0));
        for (let k = 0; k < 4; k++) put(rbox(7.6 - Math.abs(k - 1.4) * 0.9, 1.9, 1.7, 0.8, 2), M4(7.4 - Math.abs(k - 1.4) * 0.4, 1.2 + 0.3 * Math.sin(k * 2.1), -2.7 + k * 1.8, 0, 0.06 * (k - 1.5), -0.07 * k));
        put(rbox(5, 1.9, 1.9, 0.8, 2), M4(1.8, 1.2, 5.0, 0, -0.7, 0)); put(rbox(3.4, 2.9, 7.8, 1.0, 2), M4(-5.4, 1.5, 0));
        mesh(gb.build(), solid('#4a3524', '{ float n=fbm3(vW*.5); alb*=(.7+.6*n)*(.9+.2*vn3(vW*2.2)); gloss=.3+.2*n; }', { name: 'glove' }), 'glove');
      }
    }
    await ctx.yield();

    // what the seed dealt and where, kept with the scene as a plain record (kind, what it lies on, place, radius, height)
    scene.userData.dealt = dealt;
    scene.userData.night = { moon, fireHigh, rain, moths: nMoths };
    // ---------------------------------------------------------------- the gathered brass, iron and stone
    if (WD.triangles) mesh(WD.build(), woodMat, 'woodwork');
    await ctx.yield();
    if (BR.triangles) mesh(BR.build(), brassMat, 'brass');
    await ctx.yield();
    if (IR.triangles) mesh(IR.build(), lib.mat({ name: 'iron', vertexColors: true, grain: true, surface: SURF.iron }), 'iron');
    if (ST.triangles) mesh(ST.build(), stoneMat, 'stone');
    await ctx.yield();
    const bookMat = lib.mat({ name: 'books', vertexColors: true, surface: /* glsl */`{ float sp=vn3(vW*1.1);
      float band=step(.5,vN.z)*((1.-smoothstep(.0,.012,abs(vUv.y-.84)-.012))+(1.-smoothstep(0.,.01,abs(vUv.y-.14)-.01))+(1.-smoothstep(0.,.008,abs(vUv.y-.7)-.004)));
      alb*=.85+.3*sp; gloss=.25; alb=mix(alb,vec3(.75,.55,.2),clamp(band,0.,1.)); metal=clamp(band,0.,1.)*.8; gloss=mix(gloss,.6,clamp(band,0.,1.)); }` });
    if (BK.triangles) mesh(BK.build(), bookMat, 'books');
    if (PP.triangles) mesh(PP.build(), lib.mat({ name: 'paper-things', vertexColors: true, occL: true, surface: '{ alb*=(.88+.2*vn3(vW*1.6))*.8; gloss=.05; wrap=.4; }' }), 'paper-things');
    // crumpled paper: creases drawn where two folds of noise cross, each facet tipped a little its own way
    if (PB.triangles) mesh(PB.build(), lib.mat({ name: 'paper-balls', vertexColors: true, occL: true, surface: /* glsl */`{ vec3 q=vW*.55;
      float c1=abs(vn3(q)-.5)*2., c2=abs(vn3(q*2.3+7.)-.5)*2.6, crease=min(c1,c2);
      alb*=(.6+.4*smoothstep(0.,.2,crease))*(.9+.2*vn3(vW*1.6))*.8;
      N=normalize(N+(vec3(vn3(q*1.9),vn3(q*1.9+3.),vn3(q*1.9+9.))-.5)*.7); gloss=.05; wrap=.4; }` }), 'paper-balls');
    await ctx.yield();

    // ---------------------------------------------------------------- the looks, each by PLACE: a window is the stretch of route between two
    // places of the plan, in metres flown; a fade of 45 m, and of 65 m where the line is flown fast (floor and ramp). Each look's point is found BY A LAW OF ANGLE from
    // the line's own place and heading: the gaze turns to the thing itself while the thing stands within the look's cap of
    // the heading, and stays at the cap, on the thing's side, while it stands further round. So the gaze is never further
    // off the heading than a cap, and where a thing goes by, the gaze turns no faster than the line does.
    const FADE = 45, FADE_LONG = 65;
    await ctx.yield();
    const look = (d0, d1, weight, at, more, fade = FADE) => ({ from: d0 / L, to: d1 / L, weight, fade: Math.min(0.5, fade / Math.max(d1 - d0, 1)), at, arc: true, ...more });
    // byRight: metres flown from which the thing's bearing is counted round by the right hand (it goes round us by the right
    // on the round and the last turn, through straight behind, and is never on our left there by more than a quarter turn)
    // cap: degrees, or a law of place (metres flown) that gives degrees, or a pair of them: to the left hand and to the right
    // THE EYE'S OWN LAW OF LEVEL: no look lies more than CAP.pitch degrees above or below level (a thing that stands higher or
    // lower than that from where the eye is, is looked at at that pitch: its foot or its lower part).
    const CAP = { table: 30, round: 25, home: 25, fire: 55, ahead: 25, pitch: 9, reach: 22 };
    const gazeTo = (tx, ty, tz, cap, byRight = 1e9) => { const out = new V3(), o = new V3(), h = new V3(), rise = Math.tan(CAP.pitch * PI / 180);
      return (time, u) => { const d = clamp(u, 0, 1) * L; path.posAtDist(d, o); path.tangentAtDist(d, h); const hl = Math.max(Math.hypot(h.x, h.z), 1e-6), hx = h.x / hl, hz = h.z / hl;
        const gx = tx - o.x, gz = tz - o.z, dist = Math.max(Math.hypot(gx, gz), 1e-3);
        let ang = Math.atan2(hx * gz - hz * gx, hx * gx + hz * gz); if (d >= byRight && ang < -PI / 2) ang += TAU;
        const c = typeof cap === 'function' ? cap(d) : cap, k = PI / 180; ang = c.length ? clamp(ang, -c[0] * k, c[1] * k) : clamp(ang, -c * k, c * k); const cs = Math.cos(ang), sn = Math.sin(ang);
        return out.set(o.x + (hx * cs - hz * sn) * dist, clamp(ty, o.y - rise * dist, o.y + rise * dist), o.z + (hx * sn + hz * cs) * dist); }; };
    // the middle of the bottle's glass, on its axis; the place of the round where it stands straight behind the line (from
    // there on its bearing is counted round by the right hand)
    const mid = BOTTLE.len / 2, bodyAt = [BOTTLE.x + AXIS[0] * mid, BOTTLE.y, BOTTLE.z + AXIS[1] * mid];
    const dBehind = (() => { const o = new V3(), h = new V3(); for (let d = AT[MARK.round]; d < AT[MARK.straight]; d += 2) { path.posAtDist(d, o); path.tangentAtDist(d, h);
      if (h.x * (bodyAt[2] - o.z) - h.z * (bodyAt[0] - o.x) > 0 && h.x * (bodyAt[0] - o.x) + h.z * (bodyAt[2] - o.z) < 0) return d; } return AT[MARK.home]; })();
    // the line's own gaze, held to the eye's law of level: the place the eye rests on along the line (as far ahead as the
    // camera looks), no more than CAP.pitch above or below level
    const levelAhead = (() => { const out = new V3(), o = new V3(), a = new V3(), rise = Math.tan(CAP.pitch * PI / 180);
      return (time, u) => { const d = clamp(u, 0, 1) * L; path.posAtDist(d, o); path.posAtDist(Math.min(L, d + CAP.reach), a); let dx = a.x - o.x, dz = a.z - o.z, dy = a.y - o.y, hl = Math.hypot(dx, dz);
        if (hl < 1) { path.tangentAtDist(d, a); dx = a.x; dz = a.z; dy = a.y; hl = Math.max(Math.hypot(dx, dz), 1e-6); }
        const k = 100 / hl; return out.set(o.x + dx * k, o.y + clamp(dy, -rise * hl, rise * hl) * k, o.z + dz * k); }; })();
    const pois = [
      // THE EYE'S LEVEL, the whole way and before every other look: where the line sinks or climbs more steeply than the law
      // of level allows (down to the hearth, up the hanging chart), the eye lies along the line at the law's pitch
      { from: 0, to: 1, weight: 1, fade: 0.001, at: levelAhead, arc: true, steady: true },
      // THE FIRE, from the sill until it is abeam (the engine gives a look no weight at the entry itself): the hearth stands
      // ahead on the right all the way down the long straight and grows; round the hearth turn it comes across the heading
      // and is held on the left, behind the fender, to CAP.fire degrees. Its cap to the left opens to CAP.ahead on the sill's
      // last stretch (the eye goes into the first turn that far ahead of the line) and to CAP.fire along the hearth turn.
      look(0, dFire + FADE, 0.8, gazeTo(FIRE[0], FIRE[1] + 6, FIRE[2], (d) => [CAP.ahead * smoothstep(AT[MARK.first] - FADE, AT[MARK.first], d) + (CAP.fire - CAP.ahead) * smoothstep(AT[MARK.hearth], AT[MARK.hearth] + 2 * FADE, d), CAP.ahead]), null, FADE_LONG),
      // THE CLOCK, along the hearth: its long lit glass in the moon's bar, ahead on the left as the line runs north; it lets go
      // as the clock turn begins (the eye's law of level keeps the look on the glass's lower part and the foot from near)
      look(dFire - FADE_LONG, AT[MARK.clock] + FADE / 2, 0.8, gazeTo(-166, 75, NZ - 132, [CAP.ahead, CAP.ahead]), null, FADE_LONG),
      // THE LAMP, round the clock turn and up the climb: the eye goes round with the line onto the paper hill; the straight points east over the paper's crest, and the eye lies level over the table's edge
      // to the flame, whose gold rises over that edge and grows (the bottle's look takes hold beside it at the crest)
      look(AT[MARK.clock], dCrest + LINE.over, 1, gazeTo(FLAME[0], FLAME[1], FLAME[2], (d) => [CAP.table, CAP.table * smoothstep(AT[MARK.clock], AT[MARK.climb], d)]), null, FADE_LONG),
      // THE BOTTLE (the lamp beside it) from the crest to the base, one pull. Across the table it stands ahead on the left.
      // Round the round it falls behind on the left: the eye stays on it to CAP.round degrees and comes back evenly to the
      // heading by the place where the bottle is straight behind; from there the eye lies inward, opening evenly to
      // CAP.home degrees to the right over half the second bend, until the lit table comes round into it; then the
      // bottle is held, and it is dead ahead where the last straight begins. Whole for the steady camera, whose own gaze
      // would lie across the round.
      look(dCrest - FADE, L, 1, gazeTo(bodyAt[0], bodyAt[1], bodyAt[2], (d) => (d < dBehind
        ? [CAP.table + (CAP.round - CAP.table) * smoothstep(AT[MARK.round] - FADE, AT[MARK.round], d) - CAP.round * smoothstep(AT[MARK.round], dBehind, d), CAP.ahead * (1 - smoothstep(AT[MARK.round], dBehind, d))]
        : [0, CAP.home * smoothstep(dBehind, dBehind + (AT[MARK.straight] - AT[MARK.home]) / 2, d)]), dBehind), { steady: true }),
    ];

    // ---------------------------------------------------------------- what the engine gets
    return {
      scene, path, duration: PACE.seconds, pace,
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: CAP.reach, sway: 1, bank: 0.09 },
      pois,
      // the join sheet's EXIT of 2, field by field: the bottle's base is the opening
      portal: { shape: 'circle', radius: 5 * GROW, style: 'lens', halo: false, glow: 1.0, color: '#6FA98A', veil: '#2F7F6C', revealDistance: 260, blendDistance: 25 },
      post: { exposure: 1.5, bloom: { strength: 0.6, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.02, contrast: 1.02, tint: '#fff6ea', shadowTint: '#1c2036', vignette: 0.2, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        hero.update(dt, time);
        for (const f of tick) f(dt, time);
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
