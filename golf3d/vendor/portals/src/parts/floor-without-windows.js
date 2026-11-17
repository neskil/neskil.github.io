// The Floor Without Windows: the part. It holds the plan's measures, the flown line, the laws that go by place and by the
// world clock (the wave of the lights, the doors' wave, the tide of hall two's carpet, the hours of the maze) and
// THE GREAT HALL ABOVE THE CEILINGS (round nine): NO SKY, NO DAYLIGHT, NO KEY LIGHT; a night-like hall without end
// under A DARK SLAB at y 96 that carries a weave of slim bars of light to the horizon; LIGHT COMES ONLY FROM THINGS: the whole
// floor open as a maze of roofless rooms drawn by one law on one sheet, every room a lit tile in one of the
// floors' colours, the lanes glowing ribbons with beads running, a sector after hours turning slowly; a thin
// luminous haze in sheets; the rooms near the high line furnished; the roofs of the flown halls and corridors with
// their glowing skylights, trees in tubs and lamp standards; the well through hall two's roof with its balustrade
// and the slim upright bars of warm light on its handrail; THE TOWERS AS PILES OF FLOOR PLATES AND LIT STOREYS,
// each in a pool of its own light; THE PAVED COURT with its canal (a dark mirror), its jets, its trees and its
// lamps; the street's trees and standards; and the tide with what rides it. No flock of paper flies anywhere. Nothing here reads the metres flown; every
// stream is made from the world's seed and a name.
// ROUND TEN, FROM ABOVE: ONE PLAN, ONE HERO, TWO COLOURS. The maze's rooms take their colour BY DISTRICT (blocks of
// four cells, 104 m, each one colour in near tones), between AVENUES of warm light on every fourth line of the
// plan; far off every pattern settles to ITS OWN MEAN, counted and written beside its line (the owner's section
// 187). THE CORE IS THE HERO: three tiers, warm white and pale gold storeys, a terrace and a warm pool at its
// foot; the dealt towers take five forms (pile, slab on a podium, spire, crown, needle); the well of storeys
// stands among them as a seventeenth pile; EVERY TOWER STANDS ON A TERRACE IN A POOL OF LIGHT; the canal's edge is
// a glowing turquoise line. TOWER B'S DOORWAY STANDS IN A PORCH (canopy on six slim piers, lit soffit, steps,
// balconies). THE TREES are one smooth body of three soft tiers everywhere. THE TIDE HALL: a warm pool under
// every lamp of the fleet, riding the swell (drawn in the carpet's own shader from a table of the lamps' places).
// ROUND ELEVEN: THE LOBBY (P.LOBBY); the line begins at a place of the lobby and bends onto the corridor's axis at
// the corridor's mouth (see THE ARRIVAL). THE TIDE IS
// CROSSED LOW (y 2.0) along a strip 7 m wide that no rider enters, the fleet dense beside it (round eleven f: THE
// FLEET LIES CORNERWISE IN THE HALL, its lattice turned an eighth of a turn about the stair's axis); the carpet's light
// says water (the face of a swell that turns to the eye darker, a line of glints along every crest); UNDER THE
// ROUND OPENING A WHITE ROUND STAIR on a fixed plinth (STAIR), and the rise goes up round it. THE AVENUES ARE
// STREETS, 26 m broad (warm paving, lamp standards' pools, trees' beds, beads; three stretches give way: see
// AVE_OFF); UNDER THE DIAGONAL LIES THE BOULEVARD (BLVD): a round head plaza, a street 28 m broad, a second round
// plaza on the hero's side, a gate with two piers into the garden court; pools that mirror, trees and standards
// as built bodies; glass roofs over the rooms beside it. The districts are plainer and brighter, on a stream of
// their own. THE SLAB IS BUILT: ribs on every 24 m joint, great beams through each great tower's axis, in every
// coffer ONE SLIM BAR OF LIGHT, along x in one coffer and along z in the next, turn about (round eleven c: A WEAVE OF
// LIGHT, in brighter and dimmer provinces, a bar out here and there; no round light stands on the slab);
// EVERY GREAT TOWER MEETS IT IN A CAPITAL, a flared head whose lit rim is its ring of light (no
// ring hovers, the collars are gone); the haze's low sheet lies behind the towers' feet. The hero's terrace
// carries a parapet and lamp standards. Every place of the line that a law goes by has a name (RUNS).
// BROUGHT IN (the owner's section 181): the five numbers of the filmic curve in litJ(), litD() and GLSL_LIT (0.983729,
// 0.0245786, 0.432951, 0.000090537, 0.238081) are those of Stephen Hill's fit of the ACES curve as three.js carries
// it in its ACESFilmicToneMapping (three.js, MIT licence); running that curve backwards is our own. Nothing else in
// this file follows published code (h21 and hT are our own hash, written anew in round seven; round eight: the
// tide's pile goes by the same constants of our own, and no hash here carries the constants the common sine hash
// is published with. Round nine: the water's mirror meets a tower by the ordinary test of a way against a box's
// two pairs of sides, written anew; the haze in sheets, the slab's lights and the hours' sector are our own).
// THE PLAN'S TWO QUARTERS (a fact of the plan, said here once): THE EAST QUARTER is the half of the plan that lies
// east of the street's mouth in the garden court's east wall, the way the street is built (due east): the canal
// and the street run into it, and two dealt towers in three stand in it. THE WEST QUARTER is the half of the plan
// west of the core's axis: one dealt tower in three. (The towers' deal reads both: see TOWERS.)
// COMMON FORMS, NAMED (round eleven b; none is copied code, each is written here for its own use): THE SLAB TEST of a
// ray against a box's pairs of sides (the water's mirror against a tower); ROOMS DRAWN INSIDE ONE FLAT FACE by
// sending the eye's ray into the room's box and taking the nearer of its floor, ceiling and walls, the method
// published as INTERIOR MAPPING (Joost van Dongen, 2008): the sheet's rooms and the towers' storeys (no cube map:
// the rooms come from the maze's own law and from bays); THE EXACT DISTANCE TO A BOX IN THE PLANE, length(max(q,
// 0.)) + min(max(q.x, q.y), 0.), the form Inigo Quilez publishes as sdBox (blvdD and two places of the sheet); THE
// ONE-LINE SINE HASH'S FORM, fract(sin(dot(p, k)) * c), with numbers of our own and a cosine term added (h21, hT,
// the carpet's pile); the Hermite ease t t (3 - 2 t); coverage by clamp((w - d) / fwidth + .5, 0., 1.); a grazing
// sheen by pow(1 - cosine, n), the shape of Schlick's term; THE DISTANCE TO A SEGMENT, length(p - a - b clamp(dot(p -
// a, b) / dot(b, b), 0, 1)), the common form of it (wayD: the metres from a place to the line's plan).
import * as THREE from 'three';
import { makeRng, hashSeed, smoothstep } from '../kit/core.js';

// (the page's filmic curve run backwards, for a shade written into a shader as a number: see GLSL_LIT; BROUGHT IN:
// its five numbers, see the head)
function litJ(d) {
  const s = Math.pow(Math.min(Math.max(d, 0), 0.9), 2.2), A = 1 - 0.983729 * s, B = 0.0245786 - 0.432951 * s, C = 0.000090537 + 0.238081 * s;
  return 0.663 * (-B + Math.sqrt(Math.max(B * B + 4 * A * C, 0))) / (2 * A);
}
// (round nine) a shade named as the eye reads it, written into a shader as the light that gives it
const N3 = (r, g, b) => 'vec3(' + [r, g, b].map((d) => litJ(d).toFixed(4)).join(', ') + ')';
// ---------------------------------------------------------------- the plan, in world metres (x east, z south)
export const P = {
  CW: 7.0, CH: 6.6, COVE: 2.0, EYE: 3.0, SLOT: 1.5, SLOT_W: 0.6, ROOF: 6.9, CELL: 26,
  // (round six: roof is the top of each hall's white roof, 1.5 m over its ceiling)
  // (round ten: HALL ONE IS GONE. H1 is the square foot of THE WELL'S OWN BUILDING, the pile of lit storeys through
  // which the well runs: 100 m to a side about the well's axis; the corridor runs into its south face, the link out
  // of its north face)
  H1: { x0: -134, x1: -34, z0: -193, z1: -93, h: 10, roof: 11.5 },
  H2: { x0: -178, x1: 42, z0: -442, z1: -222, h: 12, roof: 13.5, floor: -2.6, deep: -6 },
  OC: { x: -98, z: -292, r: 42, up: 2.0 },
  // THE WELL (round six): hall two's round opening is a real well through its roof: a deep ring 1.6 m thick whose
  // inner face (radius 42 m) runs from 9 m (3 m under the ceiling) to 14.3 m (0.8 m over the roof), standing on
  // twelve slim columns (radius 0.4 m, 42.8 m from the well's axis: see WELL_COLS for their places)
  WELL: { r: 42, thick: 1.6, foot: 9, top: 14.3, cols: 12, colR: 0.4, colAt: 42.8 },
  LINK_ROOF: 9.5, COR_ROOF: 8.1,
  // (round eleven: AVE is the lens's height in the boulevard and over the court's first part: 6 m over the walls' tops)
  RISE: 30, TOP: 41, AVE: 13, STREET_Y: 9, RING_Y: 9,
  // (round eleven) THE TIDE HALL IS FLOWN LOW: the lens 2.8 m over the highest crest (y -0.8). It comes down from the
  // corridor's 3.0 m over the tide's lapping margin (the first TIDE_LAP[1] metres from the quay, where the swell is
  // still eased toward a third and no crest stands as high) and stays level until the wheel round the stair has
  // turned an eighth of a full turn (RISE_LATE metres of it: the lens has passed the stair's east side close and
  // level, and rises as it begins to round it)
  TIDE_EYE: 2.0, RISE_LATE: 30 * Math.PI / 4,
  // the concourse (round four): an open white street 14 m wide, with no ceiling, from hall two's east wall (x 42) to
  // the core's west foot (x 110); its walls stand 12.6 m with a coping on top. The line no longer runs down it.
  CON: { z: -262, x0: 42, x1: 110, w: 14, h: 12.6, cope: 13.3 },
  // the ceiling of light, far overhead
  SLAB: 96,
  // THE CORE at (160, -262) (round seven): a pile of floor plates and lit storeys, its foot 100 m square, from the
  // floor to the ceiling of light; one great doorway, 16 m wide and high, in its west face, where the concourse
  // ends; three glass lifts on its west face ([metres south of its middle, the shaft's foot])
  CORE: { x: 160, z: -262, r: 50, door: 16, lifts: [[-22, 19.2], [0, 19.2], [22, 19.2]] },
  // TOWER B (round seven): a pile of floor plates and lit storeys, its foot 90 m square, at (392, -86), from the
  // floor to the ceiling of light, dead east at the street's end; in its west face (x 347) A GREAT DOORWAY 30 m WIDE
  // AND HIGH (round eight) UNDER A DEEP WHITE REVEAL (REVEAL: its jambs and lintel are 2 m broad and stand 3 m proud
  // of the face), where the street ends and the ring stands; three glass lifts over and beside it
  TOWB: { x: 392, z: -86, r: 45, door: 30, lifts: [[-28, 34], [0, 34], [28, 34]] },
  REVEAL: { broad: 2, proud: 3 },
  // (round ten) TOWER B'S PORCH: the doorway stands on `steps` steps (each `tread` deep) up to a landing `rise` over
  // the forecourt, which begins `land` metres before the face; the pile's first plate runs `out` metres out from the
  // face, `half` to each side, on piers that stand at `piers` (metres before the face)
  PORCH: { rise: 1, steps: 5, tread: 0.75, land: 2.3, out: 15, half: 19.5, piers: [-13.6, -9.1, -4.6] },
  // THE STREET (round seven): a roofless white street 18 m wide along z -86, FROM THE GARDEN COURT'S EAST WALL (x
  // 248.3: it opens out of the court, no wall across it) to tower B's west face at x 347; its walls stand 6.9 m, as
  // high as the maze's own
  STREET: { z: -86, x0: 248.3, x1: 347, w: 18 },
  // THE FORECOURT (round six; round eight: 40 m wide): for its last 28 m, from x 319 to the tower's glass, the street
  // opens to 40 m, so that the great doorway (30 m and its reveal) stands whole at the end of a square. IN IT LIES A
  // POOL (round eight) before the doorway: still water from x 323 to x 341, 16 m wide, in a pale kerb; two rows of
  // low jets along its long edges; lamp standards beside it
  FORE: { x0: 319, hw: 20 },
  POOL: { x0: 323, x1: 341, hw: 8 },
  // THE WELL OF STOREYS (round ten): where hall one stood, a round well through the storeys, 84 m across, its
  // axis 16 m west of the line at the middle of the old hall's length, so that the line crosses it as a chord of
  // 77.7 m. Round it at every storey runs a ring gallery `deep` metres deep: `below` galleries under the floor's
  // own (5 m apart, down to y -90, sinking into bright haze), the floor's own storey (10 m high: the line flies 3 m
  // over its deck and the corridor's and the link's mouths open into it), `above` galleries over it (the first at
  // y 10, 5 m apart), a round ceiling at `top`. FROM OUTSIDE it is one more stack of lit floors among the towers:
  // a square pile `half` metres to a side from its middle, from the floor up to `roof`.
  SHAFT: { x: -84, z: -143, r: 42, deep: 6, below: 18, above: 6, top: 40, roof: 43, half: 50, plat: 9 },
  // THE LOBBY (round eleven): the flight begins in a white hall 48 m wide, 90 m long and 18 m high. Its east side is
  // GLASS from z `glassS` north in whole bays of `bay` metres (the court beyond it and the towers over the court)
  // for as far as the flown line keeps `glassOff` metres from it (round eleven b: its north end, glassN, is found
  // below with the line); from there to the hall's north wall the side stands open under a lintel: the loggia's
  // first stretch. The corridor leaves the hall at its north-east corner. WHERE THE LINE
  // BEGINS IS A PLACE OF THE LOBBY (round eleven b): `startIn` metres inside its south wall (where the glass begins)
  // on the line `startOff` metres from its west wall (a third of the hall's breadth); `bend`: the radius of the
  // bend that brings the line onto the corridor's axis at the corridor's mouth.
  LOBBY: { x0: -112.5, x1: -64.5, z0: -48, z1: 42, h: 18, roof: 19.5, glassS: 22, bay: 6.1, glassOff: 5, startIn: 20, startOff: 16, bend: 60 },
  // THE LINK'S OWN BUILDING begins at this z, 5 m north of the well's pile, and ends at the quay (hall two's south wall)
  LINK_Z: -198,
  // the island of seven desks stands on a round hanging platform at the well's axis
  ISLAND: { x: -84, z: -143 },
  // the maze's cells of 26 m
  MAZE_N: 256, MAZE_X0: -33 - 26 * 128, MAZE_Z0: -301 - 26 * 128,
};

// (the roof garden's measures)
const RG = { x0: P.H2.x0 - 0.7 + 3.5, x1: P.H2.x1 + 0.7 - 3.5, z0: P.H2.z0 - 0.7 + 3.5, z1: P.H2.z1 + 0.7 - 3.5, strip: -63.5, row: -262, cross: 1.7, well: 52, bedH: 0.9 };

// ---------------------------------------------------------------- the flown line
// pieces of straight and of arc by metres of run; an arc's point is centre + r (cos a, sin a) in (x, z)
const SEG = [];
let RUN = 0;
function straight(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  SEG.push({ h0: RUN, len, x0, z0, tx: (x1 - x0) / len, tz: (z1 - z0) / len });
  RUN += len;
}
function arc(cx, cz, r, a0, a1) {
  const len = Math.abs(a1 - a0) * r;
  SEG.push({ h0: RUN, len, cx, cz, r, a0, a1 });
  RUN += len;
}
// THE ARRIVAL (round eleven b): PLACES OF THE LOBBY DECIDE IT. THE LINE BEGINS at (sx, sz): 20 m inside the lobby's
// south wall, where the glass begins, on the line a third of the hall's breadth from its west wall. ITS BEND ENDS
// AT THE CORRIDOR'S MOUTH (the lobby's north wall, on the corridor's axis), heading north: an arc of radius `bend`
// about a middle that stands that far west of the mouth. Between the two the line is the straight from the start
// that meets that arc as a tangent: as the plan stands, 47.9 m on a heading 27.2 degrees east of north, toward the
// glass (the hero stands 15 degrees right of that heading, beyond the glass and the court), then the arc through
// those 27.2 degrees (28.5 m). THE RUN'S LENGTH AND EVERY LATER METRE FALL WHERE THEY FALL: no place north of the
// mouth is given by a number of metres of run; each is found on the line itself (RUNS, runAtZ).
const AXIS_X = P.LOBBY.x1 - P.CW / 2;
P.LOBBY.sx = P.LOBBY.x0 + P.LOBBY.startOff; P.LOBBY.sz = P.LOBBY.z1 - P.LOBBY.startIn;
{
  const L = P.LOBBY, cx = AXIS_X - L.bend, cz = L.z0, dx = L.sx - cx, dz = L.sz - cz;
  // (of the two tangents from the start to the bend's circle, the one that runs on round it to the mouth)
  const a0 = Math.atan2(dz, dx) - Math.acos(L.bend / Math.hypot(dx, dz));
  straight(L.sx, L.sz, cx + L.bend * Math.cos(a0), cz + L.bend * Math.sin(a0));
  arc(cx, cz, L.bend, a0, 0);
}
const H_MOUTH = RUN;
// THE ROOF OVER A FLOWN CORRIDOR CARRIES ITS SKYLIGHTS IN TWO FILES OF SQUARE CELLS side by side down the corridor's
// axis: each file's middle stands this far from the axis, and a cell is twice that broad. The corridor's two files
// are as broad as the flat of its ceiling (the corridor's breadth less its two coves); the link's cells are twice
// as broad. (Round eleven f: the ceilings under them carry no light; only the roofs read this.)
export const CEIL_FILES = { corridor: (P.CW / 2 - P.COVE) / 2, link: P.CW / 2 - P.COVE };
// NORTH ALONG THE CORRIDOR'S AXIS from the mouth: the corridor; THE WELL, crossed on a slim bridge 16 m east of the
// well's axis; the link, from where its own building begins; the quay (hall two's south wall); over the tide to
// the latitude of the round opening's axis, where the rise begins: a wheel of radius P.RISE about that axis, three
// quarters of a turn
straight(AXIS_X, P.LOBBY.z0, AXIS_X, P.LINK_Z);
const H_LINK = RUN;
straight(AXIS_X, P.LINK_Z, AXIS_X, P.H2.z1);
const H_QUAY = RUN;
straight(AXIS_X, P.H2.z1, AXIS_X, P.OC.z);
const H_RISE = RUN;
arc(P.OC.x, P.OC.z, P.RISE, 0, -1.5 * Math.PI);
const H_TOP = RUN;
// THE LAST LEG (round five). From the top of the rise at (-98, 41, -262), heading east: level; a gentle right turn of
// radius 120 m (the rounding of the corner at (-58, -262)) onto a heading 35 degrees south of east; THE DIAGONAL,
// straight for 222 m to (154.6, -113.1), which passes the core's axis at 125 m (75 m off its face); THE TURN, a left
// turn of radius 150 m through 35 degrees to due east at (240.7, -86); THE STREET, straight east along z -86 to THE
// RING at (345, 9, -86), 2 m outside tower B's west face, facing west. (Round seven: the diagonal's last 47 m and
// the whole turn are flown LOW, INSIDE THE GARDEN COURT, over its canal.)
const DIAG = 35 * Math.PI / 180, TURN_DIAG = 120, TURN_DOWN = 150, CORNER = -58;
const DIAG_TAN = TURN_DIAG * Math.tan(DIAG / 2), DSN = Math.sin(DIAG), DCS = Math.cos(DIAG);
// the turn down ends on the street's axis: its centre lies 150 m north of it, and the diagonal meets it where its own
// heading is the circle's
const DOWN_CZ = P.STREET.z - TURN_DOWN, DOWN_Z0 = DOWN_CZ + TURN_DOWN * DCS, DOWN_X0 = CORNER + (DOWN_Z0 + 262) * DCS / DSN, DOWN_CX = DOWN_X0 + TURN_DOWN * DSN;
straight(-98, -262, CORNER - DIAG_TAN, -262);
arc(CORNER - DIAG_TAN, -262 + TURN_DIAG, TURN_DIAG, -Math.PI / 2, -Math.PI / 2 + DIAG);
const H_DIAG = RUN;
straight(CORNER + DIAG_TAN * DCS, -262 + DIAG_TAN * DSN, DOWN_X0, DOWN_Z0);
const H_DOWN = RUN;
arc(DOWN_CX, DOWN_CZ, TURN_DOWN, Math.PI / 2 + DIAG, Math.PI / 2);
const H_STREET = RUN;
// THE RING: radius 8, its centre 2 m outside tower B's glass on the street's axis, at (345, 9, -86), facing west
export const RING_AT = { x: P.TOWB.x - P.TOWB.r - 2, y: P.RING_Y, z: P.STREET.z, bearing: Math.PI };
straight(DOWN_CX, P.STREET.z, RING_AT.x, P.STREET.z);
const H_END = RUN;
// where the line crosses the inner face of the garden court's north wall (z -140.3): 47.4 m before the turn
const COURT_Z0 = P.MAZE_Z0 + 26 * 134 + 4.7, CANAL_HEAD = 34.5;
const H_COURT = H_DOWN - (DOWN_Z0 - COURT_Z0) / DSN;
// (the last place from which rooms lie beside the line: the court's north wall)
const H_OVER = H_COURT;
// where the canal's head lies under the line (CANAL_HEAD metres before the turn)
const H_CANAL = H_DOWN - CANAL_HEAD;
// where the core stands abeam of the diagonal (the nearest place of the line to its axis)
const H_ABEAM = H_DIAG + (P.CORE.x - CORNER) * DCS - DIAG_TAN;
// where the line's plan crosses the outer edge of the planted border round the well (47 m from the round opening's
// axis): from there on nothing of hall two's roof stands near the line
const H_BORDER = (() => { let a = H_TOP, b = H_DIAG; for (let k = 0; k < 40; k++) { const m = (a + b) / 2, q = lineAt(m); if (Math.hypot(q[0] - P.OC.x, q[1] - P.OC.z) < 47) a = m; else b = m; } return (a + b) / 2; })();
// THE BOULEVARD (round eleven): UNDER THE DIAGONAL LIES A STREET. Its own measure: s metres along the diagonal from
// the diagonal's first metre (ox, oz), n metres to the right of it. It begins in A ROUND HEAD PLAZA (a: 22 m in
// radius, on the diagonal's own line, at the first place where such a round stands 3 m clear of hall two's south
// wall), runs straight from there, 28 m broad (hw: half of it), to THE GARDEN COURT'S NORTH WALL, which it passes
// through an open gate as broad as itself; on its left hand, toward the hero, it opens into A SECOND ROUND PLAZA
// (b: 20 m in radius, about the grid's own node at (97, -171)). Each plaza holds a round pool (`pool`: its
// radius). Round the whole runs a band of GLASS ROOFS `lid` metres broad (the sheet lays them).
export const BLVD = (() => {
  const ox = CORNER + DIAG_TAN * DCS, oz = -262 + DIAG_TAN * DSN, rA = 22, bx = P.MAZE_X0 + 26 * 133, bz = P.MAZE_Z0 + 26 * 133;
  return { ox, oz, hw: 14, lid: 48, zc: COURT_Z0, a: { s: (P.H2.z1 + 1.2 + 3 + rA - oz) / DSN, n: 0, r: rA, pool: 8 }, b: { s: (bx - ox) * DCS + (bz - oz) * DSN, n: -(bx - ox) * DSN + (bz - oz) * DCS, r: 20, pool: 7 } };
})();
// the place s metres along the boulevard, n to the right: [x, z]
export const blvdAt = (s, n) => [BLVD.ox + s * DCS - n * DSN, BLVD.oz + s * DSN + n * DCS];
// a place in the boulevard's measure: [s, n]
export const blvdOf = (x, z) => [(x - BLVD.ox) * DCS + (z - BLVD.oz) * DSN, -(x - BLVD.ox) * DSN + (z - BLVD.oz) * DCS];
// metres from a place to the boulevard's edge (under nought: within it; the court's wall line not counted)
export function blvdD(x, z) {
  const B = BLVD, [s, n] = blvdOf(x, z), qn = Math.abs(n) - B.hw, qs = B.a.s - s;
  const dR = Math.hypot(Math.max(qn, 0), Math.max(qs, 0)) + Math.min(Math.max(qn, qs), 0);
  return Math.min(dR, Math.hypot(s - B.a.s, n - B.a.n) - B.a.r, Math.hypot(s - B.b.s, n - B.b.n) - B.b.r);
}
// where the line stands over the head plaza's middle, and where it crosses the plaza's near rim (the street's mouth)
const H_PLAZA = H_DIAG + BLVD.a.s, H_RIM = H_PLAZA - BLVD.a.r;
// places of the line by metres of run (for windows that open and close between two places of the plan)
// (mouth: the corridor's mouth, where the lobby's bend ends; link: where the link's own building begins; west: the
// wheel's west point, half a turn round the stair; roof: where the line's plan leaves hall two's roof; rim: the
// head plaza's near rim; rimFar: its far rim; corner: where the hero's near corner, its south-west one, stands
// abeam)
export const RUNS = { mouth: H_MOUTH, link: H_LINK, quay: H_QUAY, rise: H_RISE, west: H_RISE + P.RISE * Math.PI, top: H_TOP, border: H_BORDER, diag: H_DIAG, roof: H_DIAG + (P.H2.z1 - BLVD.oz) / DSN, rim: H_RIM, plaza: H_PLAZA, rimFar: H_PLAZA + BLVD.a.r, corner: H_DIAG + (P.CORE.x - P.CORE.r - BLVD.ox) * DCS + (P.CORE.z + P.CORE.r - BLVD.oz) * DSN, plazaB: H_DIAG + BLVD.b.s, abeam: H_ABEAM, court: H_COURT, canal: H_CANAL, down: H_DOWN, street: H_STREET, end: H_END };

// (the plan of the line from the top of the rise to the ring as eleven places, for laws that go by the metres to it:
// the top, the first turn in four even parts, the diagonal's two ends, the last turn in four even parts, the end)
const WAY_H = () => [0, 1, 2, 3].map((k) => H_TOP + (H_DIAG - H_TOP) * k / 4).concat([H_DIAG, H_DOWN], [1, 2, 3].map((k) => H_DOWN + (H_STREET - H_DOWN) * k / 4), [H_STREET, H_END]);
// plan point and heading at h metres of run: [x, z, tx, tz]
export function lineAt(h) {
  let s = SEG[0];
  for (const q of SEG) if (h >= q.h0) s = q;
  const d = Math.min(Math.max(h - s.h0, 0), s.len);
  if (s.r === undefined) return [s.x0 + s.tx * d, s.z0 + s.tz * d, s.tx, s.tz];
  const sg = Math.sign(s.a1 - s.a0), a = s.a0 + sg * d / s.r;
  return [s.cx + s.r * Math.cos(a), s.cz + s.r * Math.sin(a), -sg * Math.sin(a), sg * Math.cos(a)];
}
// THE LOBBY'S GLASS ENDS WHERE THE LINE COMES NEAR IT (round eleven's rule, kept by place: no post, pane edge or bar
// of the glass within `glassOff` metres of the line). The glass runs north from `glassS` in whole bays: as many as
// keep that distance from every metre of the line (the bend brings the line onto the corridor's axis, 3.5 m from
// the glass's plane); the rest of the side, to the hall's north wall, stands open under its lintel. As the plan
// stands: nine bays, 54.9 m, to z -32.9; the line passes that end 5.3 m off.
{
  const L = P.LOBBY;
  const off = (zN) => { let d = 1e9; for (let h = 0; h <= H_LINK; h += 0.25) { const q = lineAt(h); d = Math.min(d, Math.hypot(L.x1 - q[0], Math.max(zN - q[1], q[1] - L.glassS, 0))); } return d; };
  let n = Math.floor((L.glassS - L.z0) / L.bay);
  while (n > 0 && off(L.glassS - n * L.bay) < L.glassOff) n--;
  L.glassN = L.glassS - n * L.bay;
}
// where the line, on its way north from the lobby to the rise, stands at z: metres of run, found on the line itself
export function runAtZ(z) {
  let a = 0, b = H_RISE;
  for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (lineAt(m)[1] > z) a = m; else b = m; }
  return (a + b) / 2;
}
// THE LENS'S HEIGHT, BY PLACE: level at 3.0 m through the lobby, the corridor, the well's bridge and the link; over the
// tide low (see TIDE_EYE); the even climb round the stair to y 41; LEVEL AT 41 until the line has crossed the
// planted border round the well; then ONE EVEN SINKING (about 16 degrees) that comes to y 13 at the head plaza's
// near rim; LEVEL AT 13, 6 m over the walls' tops, across the plaza, down the whole boulevard, through its gate and over the court's
// paving to the canal's head; over the canal's first stretch, from its head to the place where the turn begins, the
// last 4 m down to y 9, the ring's own middle; level from there to the end. Each change rounded over 16 m of run.
const yPlain = (h) => {
  if (h < H_QUAY) return P.EYE;
  // (round eleven: over the tide's lapping margin the lens sinks a metre and crosses the tide LOW, at y 2.0; THE RISE
  // BEGINS LATER AND FROM LOWER: level for the wheel's first eighth of a turn, then one even climb of 117.8 m to
  // y 41: 18.3 degrees)
  if (h < H_QUAY + TIDE_LAP[1]) return P.EYE + (P.TIDE_EYE - P.EYE) * (h - H_QUAY) / TIDE_LAP[1];
  if (h < H_RISE + P.RISE_LATE) return P.TIDE_EYE;
  if (h < H_TOP) return P.TIDE_EYE + (P.TOP - P.TIDE_EYE) * (h - H_RISE - P.RISE_LATE) / (H_TOP - H_RISE - P.RISE_LATE);
  if (h < H_BORDER) return P.TOP;
  if (h < H_RIM) return P.TOP + (P.AVE - P.TOP) * (h - H_BORDER) / (H_RIM - H_BORDER);
  if (h < H_CANAL) return P.AVE;
  if (h < H_DOWN) return P.AVE + (P.STREET_Y - P.AVE) * (h - H_CANAL) / (H_DOWN - H_CANAL);
  return P.STREET_Y;
};
export function heightAt(h) {
  let y = 0;
  for (let k = -8; k <= 8; k++) y += yPlain(h + k);
  return y / 17;
}
// the line as points every `step` metres of run: [x, y, z, h]
export function linePoints(step = 3) {
  const out = [], n = Math.ceil(H_END / step);
  for (let i = 0; i <= n; i++) { const h = H_END * i / n, q = lineAt(h); out.push([q[0], heightAt(h), q[1], h]); }
  return out;
}

// ---------------------------------------------------------------- the wave of the ceiling lights (one law, by place and clock)
// (round two: the doors' wave runs at 40 m/s toward the south and east: phase (x + z) / 150 - t / 3.75, open hump 0.45)
export const WAVE = { rest: 0.6, span: 60, period: 2.0, hump: 0.3, doorSpan: 150, doorPeriod: 3.75, doorHump: 0.45 };
export function discLight(x, z, t) {
  const ph = (((x + z) / WAVE.span + t / WAVE.period) % 1 + 1) % 1, s = Math.sin(Math.PI * Math.min(ph / WAVE.hump, 1));
  return WAVE.rest + (1 - WAVE.rest) * s * s;
}
// the wave of the sliding doors: open fraction of a door at (x, z)
export function doorOpen(x, z, t) {
  const ph = (((x + z) / WAVE.doorSpan - t / WAVE.doorPeriod) % 1 + 1) % 1;
  return smoothstep(0, 0.14, ph) * (1 - smoothstep(0.31, WAVE.doorHump, ph));
}
export const GLSL_WAVE = /* glsl */`
uniform float uTime;
float waveHump(float q){
  float ph = fract(q / 60. + uTime / 2.);
  float s = sin(3.14159265 * min(ph / .3, 1.));
  return s * s;
}
float discLight(float q){ return .6 + .4 * waveHump(q); }
float doorOpen(float q){
  float ph = fract(q / 150. - uTime / 3.75);
  return smoothstep(0., .14, ph) * (1. - smoothstep(.31, .45, ph));
}
`;

// ---------------------------------------------------------------- the tide: one function for hall two's floor over its mean
// THE SWELL IS THE SAME ON EVERY SEED (the owner's hold 2): two trains of fixed numbers, dealt by no stream:
// [half its height m, length m, speed m/s, bearing of travel in degrees from east toward south, phase]. ROUND NINE:
// THE TIDE IS A SEA: a long swell tall enough that its crests stand over the troughs behind them (five crests of
// it lie across the hall on its own bearing, corner to corner). Train one, from the north-west: 3.2 m from trough
// to crest, 60 m long, 7 m/s. Train two, from the north: 0.4 m, 23 m long, 5 m/s. No third. (The note asks 52 m and 0.6 m; with
// those the two trains' slopes sum to 14.5 degrees where both stand at their steepest, over the owner's 12: train
// one keeps its height, its length and train two's height give way.) Their sum never exceeds 1.8 m (the highest
// crest stands at y -0.8). It stays low and long: the steepest slope of the plain swell is 11.85 degrees, and with
// the easing at the edges counted in it is nowhere steeper.
const TRAINS = [[1.6, 60, 7, 45, 0.6], [0.2, 23, 5, 90, 2.1]];
export const TIDE_MAX = 1.8;
// the steepest slope of the plain swell (tangent), both trains at their steepest at one place
export const TIDE_SLOPE = 0.2098;
export const TIDE_TRAINS = TRAINS.map(([a, len, c, deg, ph]) => {
  const ang = deg * Math.PI / 180, k = 2 * Math.PI / len;
  return { a, kx: k * Math.cos(ang), kz: k * Math.sin(ang), w: k * c, ph };
});
// a third of the swell within TIDE_LAP[0] metres of a wall or a quay (the carpet laps there), easing to the whole by
// TIDE_LAP[1] metres off
export const TIDE_LAP = [6, 30];
export function tideEdge(x, z) {
  const H = P.H2;
  return 1 / 3 + 2 / 3 * smoothstep(TIDE_LAP[0], TIDE_LAP[1], Math.min(x - H.x0, H.x1 - x, z - H.z0, H.z1 - z));
}
export function tideH(tr, x, z, t) {
  let h = 0;
  for (const w of tr) h += w.a * Math.sin(w.kx * x + w.kz * z - w.w * t + w.ph);
  return h * tideEdge(x, z);
}
// slope of the tide at a place (the edge's own slope left out: it is gentle): [dh/dx, dh/dz]
export function tideSlope(tr, x, z, t, out) {
  let gx = 0, gz = 0;
  for (const w of tr) { const c = w.a * Math.cos(w.kx * x + w.kz * z - w.w * t + w.ph); gx += c * w.kx; gz += c * w.kz; }
  const e = tideEdge(x, z);
  out[0] = gx * e; out[1] = gz * e;
  return out;
}
// ---------------------------------------------------------------- the furniture adrift on the tide
// THE FLEET (round eleven: DENSE BY THE LINE, THINNING FAR OFF, ON BOTH SIDES OF IT; round eleven f: IT LIES
// CORNERWISE IN THE HALL): an open-plan office adrift on ONE LATTICE: files dx apart and ranks dz apart, laid out
// with a file on the line's own plan at the hall's mouth (x0) and a rank 7 m inside the south wall (z0), and then
// TURNED ONE EIGHTH OF A TURN ABOUT THE STAIR'S AXIS (turn), so that no rank and no file runs along a wall or along
// the line. A point of it has two whole numbers, its file n and its rank j (fleetPlace). Every desk, chair and lamp
// stands by the lattice's own heading. WHERE DESKS STAND, by places: on the lattice's points inside the hall's
// field (`field` metres inside its walls), clear of the stair's plinth, of the round opening's columns, of the
// second formation's ground, of the long table and of every scattered piece, and no nearer the flown line than the
// clear strip lets them. THE THINNING GOES BY THE METRES FROM THE LINE (its plan in the hall, from the quay to the
// top of the rise), in three bands (`bands`): within the first number of metres of it a desk on every point; from
// there to the second number a desk in every other rank; beyond, a desk in every fourth rank of every other file,
// ranks and files counted by the lattice's own whole numbers. (The breadths are the lattice's own: three files and
// half a gap; four files more.) Each desk with its lamp, of two kinds rank by rank. VARIETY in the second band: in
// one rank of six the desks stand in pairs face to face, in one the chairs are pulled out to dealt places and
// headings; in the third band big potted plants ride in the files between the desks'; a long meeting table with
// its chairs is adrift among them. A STRIP 7 m WIDE ALONG THE LINE STANDS CLEAR OF EVERY RIDER (where the line is
// under y 9): no body, leaning its most on the steepest slope, comes nearer the line's plan than 3.5 m.
export const FLEET = { x0: -68, z0: -229, dx: 7.2, dz: 5.5, turn: Math.PI / 4, bands: [3.5 * 7.2, 7.5 * 7.2], field: 8, hx: 2.1, hz: 1.95, tall: 3.05 };
// THE SECOND FORMATION (round four), in the tide's east half, under the level run and the diagonal's first part: round
// tables with their chairs, six by five on a 10.5 m grid, every other one turned a little; they ride the swell as the
// fleet does and turn about no plumb of their own. The nearest stands 45 m east of the low line.
export const FLEET2 = { x0: -23, z0: -234, step: 10.5, nx: 6, nz: 5, rad: 3.9, tall: 2.7 };
// EAST OF THE LINE, the scattered things, half as large again as the fleet's own scale:
// [name, how many, half length, half width, height, turns of its own a second (radians), size]
export const ADRIFT_KINDS = [['cabinet', 12, 0.65, 0.8, 3.6, 0.04, 1.5], ['plant', 10, 1.3, 1.3, 3.5, 0.06, 1.5], ['sofa', 7, 2.5, 0.95, 2.0, 0.04, 1.5], ['table', 3, 3.9, 3.9, 2.7, 0.03, 1.3]];
// WHERE THE WELL'S TWELVE COLUMNS STAND IN THE TIDE: [x, z]: AN EVEN RING, turned 22.5 degrees from due east, one
// column to every 30 degrees. ONE RULE (round eleven b): a column that would stand nearer than COL_CLEAR metres to
// the line's plan, where the line passes under the ring (from the quay to the top of the rise), is turned about the
// ring's axis to the nearest place that is COL_CLEAR metres clear of it: found here, from lineAt, in steps of a
// twentieth of a degree to either hand. (As the plan stands that is one column, the second: on the even ring it
// would stand 3.9 m from the straight run north.) No rider is dealt within 0.6 m of a column.
const COL_CLEAR = 6.5;
export const WELL_COLS = (() => {
  const way = [], at = (a) => [P.OC.x + P.WELL.colAt * Math.cos(a), P.OC.z + P.WELL.colAt * Math.sin(a)];
  for (let h = H_QUAY; h <= H_TOP; h += 0.5) { const q = lineAt(h); way.push(q[0], q[1]); }
  const clear = (c) => { for (let k = 0; k < way.length; k += 2) if (Math.hypot(c[0] - way[k], c[1] - way[k + 1]) < COL_CLEAR) return false; return true; };
  return Array.from({ length: P.WELL.cols }, (_, k) => {
    const a = (22.5 + k * 360 / P.WELL.cols) * Math.PI / 180, step = 0.05 * Math.PI / 180;
    for (let n = 0; n < 600; n++) for (const sg of n ? [1, -1] : [1]) { const c = at(a + sg * n * step); if (clear(c)) return c; }
    return at(a);
  });
})();
// (round eleven) THE STAIR UNDER THE OCULUS (the standard lamp is gone: it read as a scale error): on the round
// opening's own axis, the middle of the rise's wheel (the line is 30 m from it all the way round), A ROUND PLINTH `r`
// metres in radius, FIXED TO THE BUILDING (it stands on the hall's deep floor), its top at `top` (half a metre over
// the highest crest); on it A WHITE ROUND STAIR about a newel, `out` metres to its treads' outer ends, rising
// `turns` half turns (a landing at the end of each) to `head`, the height of the well's rim; from its last landing
// A GANGWAY runs due south to the rim. The world builds it. No rider is dealt within 1.2 m of the plinth.
export const STAIR = { x: P.OC.x, z: P.OC.z, r: 7.5, top: -0.3, out: 4.6, newel: 0.7, head: P.WELL.top, halves: 4 };
// THE FLEET'S LATTICE AND THE PLAN (round eleven f). fleetAxes: a place of the plan in the lattice's own axes, as
// the lattice lay before its turn (the place turned back about the stair's axis: [across the files, down the
// ranks]). fleetPlace: where the lattice's point (file n, rank j) lies in the plan (a half names a gap). The turn
// is a rider's own: about the plumb, by FLEET.turn, the heading every desk of the fleet takes.
const FLEET_C = Math.cos(FLEET.turn), FLEET_S = Math.sin(FLEET.turn);
export const fleetAxes = (x, z) => { const dx = x - STAIR.x, dz = z - STAIR.z; return [STAIR.x + dx * FLEET_C - dz * FLEET_S, STAIR.z + dx * FLEET_S + dz * FLEET_C]; };
export const fleetPlace = (n, j) => { const du = FLEET.x0 + FLEET.dx * n - STAIR.x, dv = FLEET.z0 - FLEET.dz * j - STAIR.z; return [STAIR.x + du * FLEET_C + dv * FLEET_S, STAIR.z - du * FLEET_S + dv * FLEET_C]; };
// (the files and ranks that can hold a point inside the hall's walls: the whole numbers that the hall's four
// corners span in the lattice's axes)
export const FLEET_SPAN = (() => {
  const H = P.H2, c = [[H.x0, H.z0], [H.x1, H.z0], [H.x1, H.z1], [H.x0, H.z1]].map(([x, z]) => fleetAxes(x, z));
  const ns = c.map((q) => (q[0] - FLEET.x0) / FLEET.dx), js = c.map((q) => (FLEET.z0 - q[1]) / FLEET.dz);
  return { n0: Math.floor(Math.min(...ns)), n1: Math.ceil(Math.max(...ns)), j0: Math.floor(Math.min(...js)), j1: Math.ceil(Math.max(...js)) };
})();
// WHERE THE FLEET'S DESK LAMPS STAND (round ten: under each a warm pool lies on the carpet): a table of the fleet's
// own lattice (a place for every file and rank of FLEET_SPAN), each place holding up to two lamps' places (two
// numbers each; far off where there is none), for the carpet's own shader, which turns a place of the plan into
// the lattice's axes before it looks up a cell. A lamp stands at (1.3, -1.35) in its desk's own measure.
export function fleetLampsInto(tex, adrift) {
  // (a table of half floats: each lamp's place IN THE LATTICE'S OWN AXES, in metres FROM ITS OWN CELL'S MIDDLE, so
  // that it is held to under a centimetre; an empty place lies 10 km off)
  const d = tex.image.data, F = FLEET, S = FLEET_SPAN, half = THREE.DataUtils.toHalfFloat, nx = S.n1 - S.n0 + 1;
  d.fill(half(1e4));
  for (const q of adrift) if (q.cell) {
    const cs = Math.cos(q.yaw), sn = Math.sin(q.yaw), k = ((q.cell[1] - S.j0) * nx + q.cell[0] - S.n0) * 4 + 2 * q.cell[2];
    const at = fleetAxes(q.x + 1.3 * cs - 1.35 * sn, q.z - 1.3 * sn - 1.35 * cs);
    d[k] = half(at[0] - (F.x0 + q.cell[0] * F.dx)); d[k + 1] = half(at[1] - (F.z0 - q.cell[1] * F.dz));
  }
  tex.needsUpdate = true;
  return tex;
}
export function adriftDeal(seed) {
  const st = adriftDealStages(seed);
  let s = st.next();
  while (!s.done) s = st.next();
  return s.value;
}
// (the same deal in stages, draw for draw: the page gets a breath between them)
export function* adriftDealStages(seed) {
  // (two streams: fww-adrift deals the scattered pieces; fww-fleet deals what the fleet draws: its pulled-out chairs'
  // places and headings and its plants' headings)
  const r = makeRng(hashSeed('fww-adrift:' + seed)), rf = makeRng(hashSeed('fww-fleet:' + seed)), out = [], H = P.H2, low = [], way = [], F = FLEET;
  // (the line's plan in the hall, a place every 2 m from the quay to the top of the rise: `way`; where the lens is
  // under y 9: `low`)
  for (let h = H_QUAY; h < H_TOP; h += 2) { const q = lineAt(h); way.push(q[0], q[1]); if (heightAt(h) < 9) low.push(q[0], q[1], q[2], q[3]); }
  // kinds: 0 a desk with its chair, 1 cabinet, 2 plant, 3 sofa, 4 round table, 5 a desk alone, 6 a chair, 7 the long
  // meeting table. KEEP: the strip's half width and a rider's lean on the steepest slope (3.5 + 0.7 m). A place
  // that would stand within 0.6 m of one of the well's columns takes no rider.
  const KEEP = 4.2, atCol = (x, z, rad) => WELL_COLS.some((c) => Math.hypot(x - c[0], z - c[1]) < rad + P.WELL.colR + 0.6);
  // THE LONG MEETING TABLE rides ON THE LATTICE, IN THE GAP BETWEEN TWO FILES (a file number and a half) on a rank,
  // by the lattice's heading, AT THE NEAREST SUCH PLACE TO THE MIDDLE OF THE WEST FIELD (half way between the
  // stair's axis and the west wall, on the stair's own east to west axis) WHERE IT STANDS: clear, as every rider,
  // of the strip, the stair's plinth and the round opening's columns, whose ring passes through that middle (the
  // places are tried nearest first; the 49 about the middle are a bound on a search). No draw: it is the same place
  // on every seed. A RULE IN SPACE: no desk and no chair whose box, in the lattice's axes, comes within TABLE_CLEAR
  // metres of the table's box, on any side, is put (room to walk round it and to pull its chairs out). A
  // pulled-out chair goes with its desk: where the desk is not put, no chair is dealt.
  const TABLE = { hx: 6.6, hz: 2.9, on: false }, TABLE_CLEAR = 1.5;
  // (true where the piece is put)
  const put = (kind, name, x, z, yaw, hx, hz, tall, more) => {
    const rad = Math.hypot(hx, hz);
    for (let q = 0; q < low.length; q += 4) if ((x - low[q]) ** 2 + (z - low[q + 1]) ** 2 < (KEEP + rad) ** 2) return false;
    if (Math.hypot(x - STAIR.x, z - STAIR.z) < STAIR.r + 1.2 + rad || atCol(x, z, rad)) return false;
    if (kind !== 7 && TABLE.on) { const at = fleetAxes(x, z); if (Math.abs(at[0] - TABLE.u) < TABLE.hx + hx + TABLE_CLEAR && Math.abs(at[1] - TABLE.v) < TABLE.hz + hz + TABLE_CLEAR) return false; }
    out.push({ kind, name, x, z, yaw, rate: 0, rad, hx, hz, tall, size: 1, ...more });
    return true;
  };
  {
    const west = [(STAIR.x + H.x0) / 2, STAIR.z], wa = fleetAxes(west[0], west[1]), n0 = Math.round((wa[0] - F.x0) / F.dx - 0.5) + 0.5, j0 = Math.round((F.z0 - wa[1]) / F.dz), spots = [];
    for (let dn = -3; dn <= 3; dn++) for (let dj = -3; dj <= 3; dj++) { const p = fleetPlace(n0 + dn, j0 + dj); spots.push({ n: n0 + dn, j: j0 + dj, p, off: Math.hypot(p[0] - west[0], p[1] - west[1]) }); }
    spots.sort((a, b) => a.off - b.off);
    for (const sp of spots) if (put(7, 'long table', sp.p[0], sp.p[1], F.turn, TABLE.hx, TABLE.hz, 2.7)) { TABLE.u = F.x0 + sp.n * F.dx; TABLE.v = F.z0 - sp.j * F.dz; TABLE.on = true; break; }
  }
  for (let j = 0; j < FLEET2.nz; j++) for (let i = 0; i < FLEET2.nx; i++) put(4, 'table', FLEET2.x0 + i * FLEET2.step, FLEET2.z0 - j * FLEET2.step, ((i + j) % 2) * 0.3927, FLEET2.rad, FLEET2.rad, FLEET2.tall);
  yield null;
  // EAST OF THE LINE, THE SCATTERED THINGS: ONE RULE FOR EVERY PIECE: anywhere in the hall's field (F.field metres
  // inside its walls) EAST OF THE FLEET'S TWO DENSE BANDS about the line's straight run (EDGE: bands[1] metres east
  // of that run, whose x is x0), clear of the stair and the columns and 2 m clear of every rider put before it (the
  // long table and the second formation's tables among them). A draw is made only for what the try needs; a
  // piece's heading and its hand are dealt when it is put. They are dealt before the fleet: its desks keep off them.
  const EDGE = F.x0 + F.bands[1], scattered = [];
  for (let k0 = 0; k0 < ADRIFT_KINDS.length; k0++) {
    const [name, n, hx0, hz0, tall0, rate, size] = ADRIFT_KINDS[k0];
    const hx = hx0 * size, hz = hz0 * size, tall = tall0 * size, rad = Math.hypot(hx, hz);
    for (let i = 0; i < n; i++) {
      yield null;
      for (let tries = 0; tries < 300; tries++) {
        const x = r.range(EDGE, H.x1 - F.field), z = r.range(H.z0 + F.field, H.z1 - F.field);
        let ok = true;
        if (Math.hypot(x - STAIR.x, z - STAIR.z) < STAIR.r + 1.2 + rad || atCol(x, z, rad)) ok = false;
        for (const o of out) if ((x - o.x) ** 2 + (z - o.z) ** 2 < (rad + o.rad + 2) ** 2) ok = false;
        if (ok) { const piece = { kind: k0 + 1, name, x, z, yaw: r.range(0, 6.2832), rate: rate * (r.chance(0.5) ? 1 : -1), rad, hx, hz, tall, size }; out.push(piece); scattered.push(piece); break; }
      }
    }
    yield null;
  }
  // THE FLEET, on its turned lattice (see FLEET). A piece of it stands only inside the hall's field, off the second
  // formation's ground (the box of its tables, 2 m and the piece's own reach wider) and 2 m clear of every
  // scattered piece; `put` keeps it off the clear strip, the stair's plinth, the columns and the long table.
  const G2 = { x0: FLEET2.x0 - FLEET2.rad, x1: FLEET2.x0 + (FLEET2.nx - 1) * FLEET2.step + FLEET2.rad, z0: FLEET2.z0 - (FLEET2.nz - 1) * FLEET2.step - FLEET2.rad, z1: FLEET2.z0 + FLEET2.rad };
  const stands = (x, z, rad) => {
    if (x < H.x0 + F.field || x > H.x1 - F.field || z < H.z0 + F.field || z > H.z1 - F.field) return false;
    if (x > G2.x0 - rad - 2 && x < G2.x1 + rad + 2 && z > G2.z0 - rad - 2 && z < G2.z1 + rad + 2) return false;
    for (const o of scattered) if ((x - o.x) ** 2 + (z - o.z) ** 2 < (rad + o.rad + 2) ** 2) return false;
    return true;
  };
  const putF = (kind, name, at, yaw, hx, hz, tall, more) => stands(at[0], at[1], Math.hypot(hx, hz)) && put(kind, name, at[0], at[1], yaw, hx, hz, tall, more);
  // (the metres from a place to the line's plan in the hall)
  const lineOff = (x, z) => { let m = 1e18; for (let k = 0; k < way.length; k += 2) m = Math.min(m, (x - way[k]) ** 2 + (z - way[k + 1]) ** 2); return Math.sqrt(m); };
  const S = FLEET_SPAN, mod = (a, m) => ((a % m) + m) % m;
  for (let j = S.j0; j <= S.j1; j++) {
    const lamp = mod(j, 2);
    if (mod(j, 8) === 0) yield null;
    for (let n = S.n0; n <= S.n1; n++) {
      const at = fleetPlace(n, j), off = lineOff(at[0], at[1]), desk = { lamp, cell: [n, j, 0] };
      if (off < F.bands[0]) { putF(0, 'desk', at, F.turn, F.hx, F.hz, F.tall, desk); continue; }
      if (off < F.bands[1]) {
        if (mod(j, 2)) continue;
        // (a pair face to face: 2 m to either side of the point, down the ranks' own axis; a chair pulled out: on its
        // desk's own side, 3.3 to 4.3 m down that axis and up to 1.6 m across it. Both need the empty rank to either
        // side of theirs: where a neighbour rank's point on the same file lies in the first band, which holds a
        // desk on every point, the point holds a plain desk)
        const room = lineOff(...fleetPlace(n, j - 1)) >= F.bands[0] && lineOff(...fleetPlace(n, j + 1)) >= F.bands[0];
        if (!room) putF(0, 'desk', at, F.turn, F.hx, F.hz, F.tall, desk);
        else if (mod(j, 12) === 4) { putF(0, 'desk', fleetPlace(n, j - 2 / F.dz), F.turn, F.hx, F.hz, F.tall, desk); putF(0, 'desk', fleetPlace(n, j + 2 / F.dz), F.turn + Math.PI, F.hx, F.hz, F.tall, { lamp, cell: [n, j, 1] }); }
        else if (mod(j, 12) === 8) { if (putF(5, 'desk', at, F.turn, F.hx, F.hz, F.tall, desk)) putF(6, 'chair', fleetPlace(n + rf.range(-1.6, 1.6) / F.dx, j - rf.range(3.3, 4.3) / F.dz), rf.range(0, 6.2832), 0.8, 0.8, 2.6); }
        else putF(0, 'desk', at, F.turn, F.hx, F.hz, F.tall, desk);
      } else if (mod(j, 4) === 0) {
        if (mod(n, 2) === 0) putF(0, 'desk', at, F.turn, F.hx, F.hz, F.tall, desk);
        else if (mod(j, 8) === 4) putF(2, 'plant', at, rf.range(0, 6.2832), 1.3 * 1.5, 1.3 * 1.5, 3.5 * 1.5, { size: 1.5 });
      }
    }
  }
  return out;
}
export const GLSL_TIDE = /* glsl */`
uniform vec4 uTr[2];
uniform vec2 uTa;
float tideEdge(vec2 p){
  float d = min(min(p.x + 178., 42. - p.x), min(p.y + 442., -222. - p.y));
  return 1. / 3. + 2. / 3. * smoothstep(${TIDE_LAP[0].toFixed(1)}, ${TIDE_LAP[1].toFixed(1)}, d);
}
// height over the mean in x, slope in yz
vec3 tide(vec2 p){
  float h = 0.; vec2 g = vec2(0.);
  for (int i = 0; i < 2; i++) {
    float th = uTr[i].x * p.x + uTr[i].y * p.y - uTr[i].z * uTime + uTr[i].w;
    h += uTa[i] * sin(th);
    g += uTa[i] * cos(th) * uTr[i].xy;
  }
  float e = tideEdge(p);
  return vec3(h, g) * e;
}
`;

// ---------------------------------------------------------------- the maze: one byte table of 256 x 256 cells of 26 m
// THE PLAN OF A CELL (round three). Along every line of the grid runs a band 9.4 m wide: 7.0 m of floor between two
// walls of 1.2 m. Where the line holds a corridor the band is the corridor; where it holds none it is a long narrow
// room. At every node the bands meet in a square of 7 m: a crossing, a turn or a corridor's end where any of its four
// lines holds a corridor, a small room where none does. Between the bands lies the block, 16.6 m square, of one to
// three rooms across and down, their walls 1.2 m thick. A hall is two or three cells by two with its inner lines cleared.
// r: bit 0 a corridor along the cell's west line, bit 1 along its north line, bit 2 its north-west node holds a corridor,
//    bits 3-4 and 5-6 the cell's rooms across and down (one less), bit 7 the cell is part of a hall
// g: the cell's (or its hall's) own number; b: the district's colour (1 to 7: see the deal)
// a: bit 0 no wall on the west line (the same hall goes on), bit 1 none on the north line; in a hall, bits 2-3 the
//    cell's column in it, bits 4 and 6 its row, bit 5 the hall is three cells wide, bit 7 it is the garden court
//    (eight cells wide and three long: there bit 5 is the third bit of the cell's column)
// ONE DISTRICT STANDS BY PLACE ON EVERY SEED under the last leg: THE GARDEN COURT, eight cells by three (cells x 45
// to 253, z -145 to -67: its floor 198.6 by 68.6 m): the boulevard runs into it through the gate in its north wall,
// and the line flies the diagonal's last 47 m and the whole turn inside it. Its number (255) gives it its floor.
// (Round eleven: the hall of desks and the hall of long tables that stood north of it are gone: the boulevard and
// its glass roofs lie there.)
export const FIXED_HALLS = [{ i: 131, j: 134, id: 255, what: 1, wi: 8, hj: 3 }]
  .map((f) => ({ ...f, cx: P.MAZE_X0 + 13 * (2 * f.i + f.wi), cz: P.MAZE_Z0 + 13 * (2 * f.j + f.hj) }));
// THE AVENUES (round eleven): every fourth line of the plan both ways (the lines 4k + 1) is A BROAD AVENUE: its band
// is 26 m broad (every other line's 9.4 m) and always holds a street. THREE STRETCHES GIVE WAY, each from one
// crossing of avenues to the next: the line x 97 from z -275 to z -67 (it would run under the hero's terrace,
// through the boulevard's second plaza and through the garden court), the line z -171 from x -7 to x 201 (the
// boulevard takes its place) and the line z -67 from x -7 to x 305 (the garden court's south wall stands on it):
// there the line is an ordinary one. [0 a north-south line or 1 an east-west one, its number, its first cell, its last]
export const AVE_OFF = [[0, 133, 129, 136], [1, 133, 129, 136], [1, 137, 129, 140]];
// half the breadth of the band along the west line of the cell (i, j), and along its north line
export const hbW = (i, j) => (i % 4 === 1 && !AVE_OFF.some((o) => o[0] === 0 && o[1] === i && j >= o[2] && j <= o[3]) ? 13 : 4.7);
export const hbN = (i, j) => (j % 4 === 1 && !AVE_OFF.some((o) => o[0] === 1 && o[1] === j && i >= o[2] && i <= o[3]) ? 13 : 4.7);
// THE GARDEN COURT's floor, and in it THE CANAL: 12 m of still water (hw: half of it) that FOLLOWS THE LINE'S PLAN:
// from its head, 34.5 m before the turn on the diagonal's own line, round the whole turn (91.6 m) and 3.4 m on east,
// where it ends 4.3 m before the street's mouth; a stone kerb 0.9 m broad round it. canalAt and canalPlace are its
// own measure (metres from its middle line, metres along it from its head, the side), which the sheet reads too.
export const COURT = { x0: P.MAZE_X0 + 26 * 131 + 4.7, x1: P.MAZE_X0 + 26 * 139 - 4.7, z0: COURT_Z0, z1: P.MAZE_Z0 + 26 * 137 - 4.7, head: CANAL_HEAD, arc: TURN_DOWN * DIAG, tail: 3.4, hw: 6, kerb: 0.9 };
COURT.len = COURT.head + COURT.arc + COURT.tail;
// [metres from the canal's middle line, metres along it from its head, the side: -1 the left hand (the inside of the
// turn), 1 the right]
export function canalAt(x, z) {
  const u = (x - DOWN_X0) * DCS + (z - DOWN_Z0) * DSN;
  if (u < 0) { const ac = -(x - DOWN_X0) * DSN + (z - DOWN_Z0) * DCS; return [Math.abs(ac), u + COURT.head, ac < 0 ? -1 : 1]; }
  if (x > DOWN_CX) return [Math.abs(z - P.STREET.z), COURT.head + COURT.arc + x - DOWN_CX, z < P.STREET.z ? -1 : 1];
  const rx = x - DOWN_CX, rz = z - DOWN_CZ, rl = Math.hypot(rx, rz);
  return [Math.abs(rl - TURN_DOWN), COURT.head + TURN_DOWN * (Math.PI / 2 + DIAG - Math.atan2(rz, rx)), rl < TURN_DOWN ? -1 : 1];
}
// the place n metres to the right of the canal's middle line, s metres along it from its head: [x, z, tx, tz]
export function canalPlace(s, n) {
  if (s < COURT.head) { const u = s - COURT.head; return [DOWN_X0 + DCS * u - DSN * n, DOWN_Z0 + DSN * u + DCS * n, DCS, DSN]; }
  if (s < COURT.head + COURT.arc) { const a = Math.PI / 2 + DIAG - (s - COURT.head) / TURN_DOWN; return [DOWN_CX + (TURN_DOWN + n) * Math.cos(a), DOWN_CZ + (TURN_DOWN + n) * Math.sin(a), Math.sin(a), -Math.cos(a)]; }
  return [DOWN_CX + s - COURT.head - COURT.arc, P.STREET.z + n, 1, 0];
}
// a district's colour and its share of the districts (see the deal)
const DISTRICT_SHARE = [[5, 0.24], [6, 0.16], [3, 0.18], [1, 0.12], [2, 0.11], [4, 0.11], [7, 0.08]];
// (dealt in stages, so that a build can hand the page back between them: the streams run in the same order either way)
export function* mazeDealStages(seed) {
  const r = makeRng(hashSeed('fww-maze:' + seed)), N = P.MAZE_N, d = new Uint8Array(N * N * 4);
  const at = (i, j) => (j * N + i) * 4;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i === 0 && j > 0 && j % 32 === 0) yield null;
    const k = at(i, j);
    // (a line holds a lane with odds 0.42; an avenue always holds its street)
    const w = r() < 0.42 || hbW(i, j) > 5 ? 1 : 0, n = r() < 0.42 || hbN(i, j) > 5 ? 2 : 0;
    const nx = r() < 0.45 ? 0 : r() < 0.72 ? 1 : 2, nz = r() < 0.45 ? 0 : r() < 0.72 ? 1 : 2;
    d[k] = w | n | (nx << 3) | (nz << 5);
    d[k + 1] = Math.floor(r() * 256);
    d[k + 3] = 0;
  }
  // (round ten) DISTRICTS, NOT CONFETTI: EVERY district of 4 x 4 cells (104 m square) has ONE colour of floor, and
  // the districts lie BETWEEN THE AVENUES (an avenue is a line 4k + 1 of the plan: a district is the cells 4k + 1 to
  // 4k + 4 both ways). Its colour, 1 to 7 (a deeper turquoise, coral, turquoise, plum, cobalt, a deeper cobalt, warm
  // white), by ONE DRAW of the districts' own stream (fww-district) against the seven shares: cobalt 0.24, the
  // deeper cobalt 0.16, turquoise 0.18, the deeper turquoise 0.12, coral 0.11, plum 0.11, warm white 0.08: blue
  // leads. Two districts side by side may draw one colour: a block 208 m long.
  const rd = makeRng(hashSeed('fww-district:' + seed));
  for (let bj = 0; bj < N / 4; bj++) for (let bi = 0; bi < N / 4; bi++) {
    let u = rd(), tint = 7;
    for (const [t, w] of DISTRICT_SHARE) { if (u < w) { tint = t; break; } u -= w; }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const ci = bi * 4 + i + 1, cj = bj * 4 + j + 1; if (ci < N && cj < N) d[at(ci, cj) + 2] = tint; }
  }
  for (let k = 0; k < N; k++) { d[at(0, k) + 2] = d[at(1, k) + 2]; d[at(k, 0) + 2] = d[at(k, 1) + 2]; }
  yield null;
  // HALLS (round eleven): a hall is two cells by two IN THE MIDDLE OF A DISTRICT (its cells 4k + 2 and 4k + 3 both
  // ways: a floor 42.6 m square, a ring of rooms between it and the avenues). A district holds one with odds 0.45,
  // by one draw; none lies on the garden court, none under the boulevard or its glass roofs.
  const stamp = (i0, j0, wi, id, hj = 2) => {
    for (let j = 0; j < hj; j++) for (let i = 0; i < wi; i++) {
      const k = at(i0 + i, j0 + j);
      d[k] |= 128; d[k + 1] = id; d[k + 3] = ((i & 3) << 2) | ((j & 1) << 4) | (wi === 3 || i > 3 ? 32 : 0) | ((j >> 1) << 6) | (wi === 8 ? 128 : 0);
      if (i > 0) { d[k] &= ~1; d[k + 3] |= 1; }
      if (j > 0) { d[k] &= ~2; d[k + 3] |= 2; }
    }
  };
  // the one that stands by place comes first; a dealt hall never lies on it
  for (const f of FIXED_HALLS) stamp(f.i, f.j, f.wi, f.id, f.hj);
  for (let bj = 0; bj < N / 4 - 1; bj++) for (let bi = 0; bi < N / 4 - 1; bi++) {
    const has = r() < 0.45, id = Math.floor(r() * 255), i0 = bi * 4 + 2, j0 = bj * 4 + 2;
    if (!has) continue;
    let free = true;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (d[at(i0 + i, j0 + j)] & 128) free = false;
    const x0 = P.MAZE_X0 + 26 * i0 + 4.7, z0 = P.MAZE_Z0 + 26 * j0 + 4.7;
    for (const [fx, fz] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) if (blvdD(x0 + 42.6 * fx, z0 + 42.6 * fz) < BLVD.lid) free = false;
    if (free) stamp(i0, j0, 2, id);
  }
  yield null;
  // nodes: the north-west node of a cell holds a corridor when any of its four lines does
  for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
    const any = (d[at(i, j)] & 3) || (d[at(i, j - 1)] & 1) || (d[at(i - 1, j)] & 2);
    if (any) d[at(i, j)] |= 4;
  }
  return { data: d, N, at };
}
export function mazeDeal(seed) {
  const stages = mazeDealStages(seed);
  let s = stages.next();
  while (!s.done) s = stages.next();
  return s.value;
}

// ---------------------------------------------------------------- shades named as the eye should read them
// the page's filmic curve run backwards: a shade d written here reaches the screen at about d (BROUGHT IN: the
// curve's five numbers are those of Stephen Hill's fit of the ACES curve as three.js carries it, MIT licence; solving
// it backwards for the shade is ours)
export const GLSL_LIT = /* glsl */`
float litD(float d){
  float s = pow(clamp(d, 0., .9), 2.2), A = 1. - .983729 * s, B = .0245786 - .432951 * s, C = .000090537 + .238081 * s;
  return .663 * (-B + sqrt(max(B * B + 4. * A * C, 0.))) / (2. * A);
}
vec3 lit3(vec3 d){ return vec3(litD(d.r), litD(d.g), litD(d.b)); }
`;

// ---------------------------------------------------------------- the great hall above the ceilings (round nine)
// NO SKY, NO DAYLIGHT, NO KEY LIGHT. Above the floor's ceilings stands a night-like hall without end under a dark
// slab, lit only by things. THE AIR: a thin luminous haze lies in it IN SHEETS: one low over the maze (10 to 22 m; round eleven: it lies BEHIND a tower's foot and its pool, never across them),
// a fainter one at 46 to 54 m, one under the slab (84 to 96 m), and a breath of it everywhere. It is a cool pale
// blue and takes its light from the field of light below; strongest far off, so that near, middle and far stand
// apart. Never milky, never warm. nightAir: c the light of a place, eye the lens, rel from the lens to the place.
export const GLSL_NIGHT = /* glsl */`
const vec3 NIGHT_HAZE = ${N3(0.38, 0.5, 0.92)}, NIGHT_UP = ${N3(0.16, 0.21, 0.46)};
float airBand(float ya, float yb, float lo, float hi){
  float dy = abs(yb - ya);
  return dy > .05 ? abs(clamp(yb, lo, hi) - clamp(ya, lo, hi)) / dy : step(lo, ya) * step(ya, hi);
}
// (low: the share of the low sheet that lies before the place: 1 everywhere but at a tower's foot and in its pool)
vec3 nightAirK(vec3 c, vec3 eye, vec3 rel, float low){
  float dist = length(rel), yb = eye.y + rel.y;
  float t1 = dist * (low * airBand(eye.y, yb, 10., 22.) / 1400. + airBand(eye.y, yb, 46., 54.) / 2000. + 1. / 22000.);
  float t3 = dist * airBand(eye.y, yb, 84., 96.) / 2600.;
  c = mix(c, NIGHT_HAZE, 1. - exp(-t1));
  return mix(c, NIGHT_UP, 1. - exp(-t3));
}
vec3 nightAir(vec3 c, vec3 eye, vec3 rel){ return nightAirK(c, eye, rel, 1.); }
`;
// A LAMP ON A BRACKET, ONE LAW WHEREVER ONE HANGS ON A WALL (the garden court's walls, the boulevard's and the plazas',
// a corridor's on the sheet, the court's end walls in the world's file). da: the metres along the wall from the
// lamp, dy: the metres above it. ITS OWN LIGHT (bracketBar) is an upright soft bar, to 1/e BRACKET.bar[0] metres
// broad and BRACKET.bar[1] high either way. ITS WASH on the wall (bracketWash) falls to 1/e BRACKET.wash[0] metres
// to either side and BRACKET.wash[1] metres up and down: three times as high as broad, and as far down as the
// lamp hangs over the floor, so that the wash reaches the wall's foot. FAR OFF (the sheet's walls and the
// boulevard's, which are seen from the roofs): where the lamp's light fades with the pixel's reach, the wash and the
// bar each fade to their own counted mean over the lamp's bay (bracketMean), never to nought.
export const BRACKET = { bar: [0.16, 1], wash: [1.2, 3.6] };
export const GLSL_BRACKET = /* glsl */`
float bracketBar(float da, float dy){ return exp(-da * da / ${(BRACKET.bar[0] * BRACKET.bar[0]).toFixed(4)} - dy * dy / ${(BRACKET.bar[1] * BRACKET.bar[1]).toFixed(1)}); }
float bracketWash(float da, float dy){ return exp(-da * da / ${(BRACKET.wash[0] * BRACKET.wash[0]).toFixed(2)} - dy * dy / ${(BRACKET.wash[1] * BRACKET.wash[1]).toFixed(2)}); }
`;
// (A LAMP'S OWN MEANS over the wall of one lamp's bay, `pitch` metres long, the lamp `up` metres over the floor and
// the wall `top` high: counted on a lattice of 0.05 m from the lamp's law itself: the wash's (law BRACKET.wash) or
// the bar's (law BRACKET.bar). FAR OFF, where a pixel reaches over a lamp's light, THE WASH AND THE BAR EACH FADE TO
// THEIR OWN MEAN, NEVER TO NOUGHT: wherever the bracket lamp fades with the pixel's reach it fades so)
function bracketMean(pitch, up, top, law = BRACKET.wash) {
  let sum = 0, n = 0;
  for (let a = -pitch / 2 + 0.025; a < pitch / 2; a += 0.05) for (let y = 0.025; y < top; y += 0.05) {
    sum += Math.exp(-a * a / (law[0] * law[0]) - (y - up) * (y - up) / (law[1] * law[1])); n++;
  }
  return sum / n;
}
// A WEAVE OF LIGHT (round eleven c): ONE BAR OF IT. A cell of a ceiling holds one slim bar of light: a sixth of the
// cell's breadth wide and two thirds of it long, its ends fading over a sixth of that breadth; along one way of the
// grid in one cell, along the other in the next, turn about, as the strands of a basket lie: the rule is the cell's
// own place in its grid (the sum of its two numbers, even or odd), the same for every eye. The slab's coffers, the
// lobby's lattice (the world's file draws its ceiling) and the skylights' cells on the roofs all go by it.
export const WEAVE = { wide: 1 / 6, long: 2 / 3, soft: 1 / 6 };
// THE SLAB'S LIGHTS (round eleven c): THE WEAVE ON THE SLAB. The slab's panels are coffers, 24 m both ways from rib
// to rib, 22 m clear between ribs 2 m broad (see CEIL_FRAG): IN EACH COFFER LIES ONE BAR, cool white, 3.7 m wide
// and 14.7 m long. No round light, disc, ring or round spot of light stands on the slab.
// THE BARS CARRY THE LIGHTS' ONE LAW: a bar rests at 0.3 and swells to 1 as a front of the wave passes its coffer's
// middle, so fronts cross the whole slab as slanting lines of brighter bars. THE SLAB IS NOT ONE EVEN CLOTH. Its
// bars stand brightest over the hero and fall slowly toward the far rim (slabGain, round ten: 1.5 of their own
// light at the core, 1.23 at 220 m, .87 at 700 m, .56 at 2000 m, .5 at the last). A SKY HAS PROVINCES: a slow
// field over the plan, SKY.province metres to a cell, takes a bar's light between 1 - SKY.swing and 1 + SKY.swing
// of its own, with a mean of one (slabProv). AND HERE AND THERE A BAR IS OUT: SKY.out of the coffers, each by its
// own draw. The field's place over the plan and the outs' draws are the world's seed's (uSky: see skyUniform).
// A LIT BAR IS A LAMP WITH A LIGHT OF ITS OWN (SKY.face): at the wave's crest a bar's face gives a quarter of
// SLAB_LIGHT (a quarter of that light stands near white), at rest three tenths of that, by the lights' one law,
// times the gain of its place over the plan, its province and its own draw (lit or out).
// THE GLOW ABOUT A BAR lies on the bar's own coffer (the 22 m clear between its ribs), in the slab's blue (SKY.blue):
// greatest at the bar's edge, one fifth of that bar's face light there (SKY.halo: light for light, each
// colour weighed as light is), and falling with the metres from the bar, to 1/e at 6 m (SKY.reach: the square of
// those metres). It is one law of metres on the slab, the same wherever the slab is seen from; the bar's own face
// carries none of it (the face shows the lamp, the coffer about it the glow). (SKY.light times SKY.power is
// SLAB_LIGHT, the cool white the shaders name; SKY.blue is their SLAB_BLUE.)
// slabLights: p a place on the slab, dx and dy the pixel's own reach there; x: how much of SLAB_LIGHT the pixel
// takes, y: how much of the slab's blue. Far off a pixel's reach is long and thin: it is asked at six places along
// its length, each a box as long as its share and laid along the plan's two ways; the bar's share of each box is
// counted, not sampled. A PATTERN FADES ONLY TO ITS OWN MEAN: the glow's pattern in a coffer goes to the glow's
// mean over that coffer (SKY_BAR.shape, counted below) as a box comes to reach over half the glow's fall (3 m)
// and is that mean where a box reaches over half a panel (12 m); the bars and their coffers melt into ONE COUNTED
// MEAN (SKY_BAR.cov: a bar's share of a panel times the bars' mean light; SKY_BAR.mean: the same of the glow) as
// a box grows from a third of a panel (8 m) to five sixths of one (20 m): no shimmer and no pattern that crawls.
const SKY = { pitch: 24, rib: 2, province: 350, swing: 0.5, out: 1 / 16, face: 1 / 4, halo: 1 / 5, reach: 36, light: [0.82, 0.9, 1], power: 4.2, blue: [0.1, 0.13, 0.24] };
const SKY_BAR = (() => {
  const c = SKY.pitch - SKY.rib, hw = c * WEAVE.wide / 2, hl = c * WEAVE.long / 2, soft = c * WEAVE.soft, panel = SKY.pitch * SKY.pitch;
  // (the wave's own mean over a bar: it rests at .3 and a squared sine swells it over 30 % of the phase: .405; one
  // bar in sixteen is out)
  const lit = (0.3 + 0.7 * 0.15) * (1 - SKY.out);
  // (the glow of one bar at its crest over its own panel, as a share of the glow at the bar's edge: counted on a
  // lattice of 0.25 m; none on the ribs' 1 m to either side of a joint, none on the bar's own face, whose ends fade
  // as the shader's do)
  let shape = 0, n = 0;
  for (let x = -SKY.pitch / 2 + 0.125; x < SKY.pitch / 2; x += 0.25) for (let z = -SKY.pitch / 2 + 0.125; z < SKY.pitch / 2; z += 0.25) {
    n++;
    if (Math.abs(x) > c / 2 || Math.abs(z) > c / 2) continue;
    const dx = Math.max(Math.abs(x) - hl, 0), dz = Math.max(Math.abs(z) - hw, 0), t = Math.min(Math.max((hl - Math.abs(x)) / soft + 0.5, 0), 1);
    shape += Math.exp(-(dx * dx + dz * dz) / SKY.reach) * (1 - (Math.abs(z) < hw ? t * t * (3 - 2 * t) : 0));
  }
  shape /= n;
  // (brightness as light is weighed, red .2126, green .7152, blue .0722: SLAB_LIGHT's and the slab's blue's)
  const lum = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  // (glow: how much of the slab's blue stands at the edge of a bar at its crest: SKY.halo of its face's brightness)
  const glow = SKY.halo * SKY.face * SKY.power * lum(SKY.light) / lum(SKY.blue);
  return { hw, hl, hc: c / 2, soft, face: SKY.face, glow, shape, cov: 4 * hw * hl / panel * lit, mean: shape * lit };
})();
// THE SKY'S OWN DEAL (the stream fww-sky, which no other deal reads): where the provinces' field lies over the plan
// (x, y) and the number that the outs' draws begin from (z, w)
export function skyUniform(seed) {
  const r = makeRng(hashSeed('fww-sky:' + seed));
  return { value: new THREE.Vector4(r.range(0, 64), r.range(0, 64), r.range(0, 64), r.range(0, 64)) };
}
export const GLSL_SLAB = /* glsl */`
const vec3 SLAB_NEAR = ${N3(0.078, 0.102, 0.235)}, SLAB_FAR = ${N3(0.11, 0.145, 0.33)}, SLAB_LIGHT = vec3(${SKY.light.map((v) => v.toFixed(2)).join(', ')}) * ${SKY.power.toFixed(1)}, SLAB_BLUE = vec3(${SKY.blue.map((v) => v.toFixed(2)).join(', ')});
uniform vec4 uSky;
// (how much of a stretch a long, about d, lies within r of nought)
float slabBox(float d, float r, float a){ return clamp((min(r, d + .5 * a) - max(-r, d - .5 * a)) / a, 0., 1.); }
// ONE BAR OF A WEAVE: how much of a pixel its face fills. q: the place from the bar's middle (along it, across it);
// hb: its half length and half breadth; a: the pixel's reach along it (its end's fade reckoned in) and across it;
// sm: 0 where the pixel is small beside the fade (the end then fades as a soft curve), 1 where it is not
float weaveBar(vec2 q, vec2 hb, vec2 a, float sm){
  float t = slabBox(q.x, hb.x, a.x);
  return mix(t * t * (3. - 2. * t), t, sm) * slabBox(q.y, hb.y, a.y);
}
float slabGain(vec2 p){ return .5 + exp(-length(p - vec2(${P.CORE.x.toFixed(1)}, ${P.CORE.z.toFixed(1)})) / 700.); }
// (a draw between 0 and 1 for a cell of the plan: the common sine hash's form, numbers of our own, a cosine added)
float skyDraw(vec2 c){ return fract(sin(dot(c, vec2(31.417, 47.853))) * 19417.2713 + cos(dot(c, vec2(23.911, 61.337))) * 6143.719); }
// (the provinces: the field's four draws about a place, eased between; pushed a little toward its two ends, which
// keeps its mean)
float slabProv(vec2 p){
  vec2 g = p / ${SKY.province.toFixed(1)} + uSky.xy, i = floor(g), f = g - i;
  f = f * f * (3. - 2. * f);
  float n = mix(mix(skyDraw(i), skyDraw(i + vec2(1., 0.)), f.x), mix(skyDraw(i + vec2(0., 1.)), skyDraw(i + vec2(1., 1.)), f.x), f.y);
  return 1. + ${SKY.swing.toFixed(2)} * (2. * smoothstep(.2, .8, n) - 1.);
}
vec2 slabLights(vec2 p, vec2 dx, vec2 dy){
  bool yl = dot(dy, dy) > dot(dx, dx);
  vec2 mj = yl ? dy : dx, mn = yl ? dx : dy;
  float L = max(length(mj), .02);
  vec2 u = mj / L, w = vec2(-u.y, u.x);
  float W = max(abs(dot(mn, w)), .02), pitch = L / 6.;
  // (one of the six boxes, laid along the plan's two ways: its reach along x and along z; with a bar's end's fade)
  const float SOFT = ${SKY_BAR.soft.toFixed(4)};
  const vec2 HB = vec2(${SKY_BAR.hl.toFixed(4)}, ${SKY_BAR.hw.toFixed(4)});
  vec2 e = max(abs(u) * pitch + abs(w) * W, vec2(.02)), el = sqrt(e * e + SOFT * SOFT), sm = smoothstep(SOFT, 2. * SOFT, e);
  float far = max(smoothstep(8., 20., pitch), smoothstep(8., 20., W)), sum = 0., glow = 0.;
  // (the glow's pattern goes to its coffer's own mean: from a box half as long as the glow's fall to one of half a panel)
  float gFar = smoothstep(${(Math.sqrt(SKY.reach) / 2).toFixed(1)}, ${(SKY.pitch / 2).toFixed(1)}, max(e.x, e.y));
  for (int i = 0; i < 6; i++) {
    vec2 s = p + u * (float(i) - 2.5) * pitch, ci = floor(s / ${SKY.pitch.toFixed(1)}), c = (ci + .5) * ${SKY.pitch.toFixed(1)}, r = s - c;
    float b = (.3 + .7 * waveHump(c.x + c.y)) * slabGain(c) * step(${SKY.out.toFixed(4)}, skyDraw(ci + uSky.zw));
    bool ax = mod(ci.x + ci.y, 2.) < .5;
    vec2 q = ax ? r : r.yx, dq = max(abs(q) - HB, 0.);
    float face = weaveBar(q, HB, ax ? vec2(el.x, e.y) : vec2(el.y, e.x), ax ? sm.x : sm.y);
    sum += b * face;
    // (the glow: by the metres from the bar, on the coffer's clear face between its ribs, none on the bar's own face)
    float about = exp(-dot(dq, dq) / ${SKY.reach.toFixed(1)}) * (1. - face) * slabBox(r.x, ${SKY_BAR.hc.toFixed(1)}, e.x) * slabBox(r.y, ${SKY_BAR.hc.toFixed(1)}, e.y);
    glow += b * mix(about, ${SKY_BAR.shape.toFixed(5)}, gFar);
  }
  // (THE ONE COUNTED MEAN: a bar's face is ${(4 * SKY_BAR.hw * SKY_BAR.hl).toFixed(1)} m2 of a panel of ${(SKY.pitch * SKY.pitch).toFixed(0)} m2; a bar's own mean light is .3 + .7 x .15
  // = .405 of its crest (the wave's mean is .15); one in sixteen is out: so a far pixel takes ${SKY_BAR.cov.toFixed(5)} of a bar's
  // face light at its crest and ${SKY_BAR.mean.toFixed(5)} of the glow at a bar's edge, times the gain of the place and its province)
  return slabProv(p) * mix(vec2(${SKY_BAR.face.toFixed(4)} * sum, ${SKY_BAR.glow.toFixed(4)} * glow) / 6., vec2(${(SKY_BAR.face * SKY_BAR.cov).toFixed(6)}, ${(SKY_BAR.glow * SKY_BAR.mean).toFixed(6)}) * slabGain(p), far);
}
`;
// AFTER HOURS (the brief's own law, restored in round nine), SEEN FROM ABOVE ONLY: a sector 100 degrees wide about
// the oculus' middle is after hours; it turns once in 240 s (uAfter: its middle's bearing at the clock's nought and
// its turn in radians a second, signed: both dealt by the stream fww-after; round ten: its third number is the
// sector's half width in radians, 50 degrees unless the world sets it by the visit's density). hoursAt: 1 where the place m is lit, 0
// where it is after hours; h is the place's own draw: a tile goes out, or comes on, up to 4 s after the sector's
// edge has passed it, each by itself.
const GLSL_HOURS = /* glsl */`
uniform vec3 uAfter;
float hoursAt(vec2 m, float h){
  vec2 r = m - vec2(${P.OC.x.toFixed(1)}, ${P.OC.z.toFixed(1)});
  float d = abs(mod(atan(r.y, r.x) - uAfter.x - uAfter.y * (uTime - 4. * h) + 3.14159265, 6.2831853) - 3.14159265);
  return smoothstep(uAfter.z - .006, uAfter.z + .006, d);
}
`;

// ---------------------------------------------------------------- the open maze: one law for the whole floor seen from above
// A MAZE WITH NO ROOFS (round three), GLOWING WITH ITS OWN LAMPS (round five) IN THE GREAT HALL'S NIGHT (round nine: no
// key light). No ceiling is drawn from above: the floor lies open like an
// architect's model at full size. The law gives, for a place of the plan, the room it lies in: its floor's rectangle,
// which sides stand open, its number and kind. The sheet's shader then looks down into that room along the eye's own
// ray: the floor in its clear colour, or the white inner face of a wall, shaded toward the floor.
export const GLSL_FIELD = /* glsl */`
uniform sampler2D tMaze;
uniform vec2 uOrg;
uniform vec3 uPal[8];
// (a draw between 0 and 1 from a place's two numbers: our own, a sine and a cosine of two weighted sums)
float h21(vec2 p){ return fract(sin(dot(p, vec2(27.619, 57.583))) * 24634.6345 + cos(dot(p, vec2(41.233, 13.171))) * 7919.137); }
float sdBox(vec2 p, vec2 c, vec2 h){ vec2 d = abs(p - c) - h; return max(d.x, d.y); }
// THE CORE stands at:
const vec2 CORE = vec2(${P.CORE.x.toFixed(1)}, ${P.CORE.z.toFixed(1)});
// how much of a pixel's reach a across x the strip from A to B takes
float seg(float x, float A, float B, float a){ return clamp((min(B, x + .5 * a) - max(A, x - .5 * a)) / a, 0., 1.); }
ivec4 cellAt(ivec2 i){ return ivec4(texelFetch(tMaze, i, 0) * 255. + .5); }
// THE WALLS' TOPS NEAR THE LINE ARE 0.6 m WIDE (round six), so that the eye looks into the rooms and not onto their
// walls: gHw is half the width of a wall's top at the place asked (0.3 within 150 m of the last leg's plan, 0.6 from
// 190 m on); a room's floor runs on to the foot of its thinner wall
float gHw = .6;
const vec2 WAY[11] = vec2[11](${WAY_H().map((h) => { const q = lineAt(h); return 'vec2(' + q[0].toFixed(1) + ', ' + q[1].toFixed(1) + ')'; }).join(', ')});
float wayD(vec2 p){
  float d = 1e9;
  for (int i = 0; i < 10; i++) { vec2 a = WAY[i], b = WAY[i + 1] - a; d = min(d, length(p - a - b * clamp(dot(p - a, b) / dot(b, b), 0., 1.))); }
  return d;
}
// (round eleven) half the breadth of the band along the west line of the cell c (the line's number is c.x) beside the
// cell's own row, and along its north line: 13 m where the line is an avenue there, else 4.7 (the plan's own list
// of the stretches that give way: see AVE_OFF)
float hbW(vec2 c){ return abs(mod(c.x, 4.) - 1.) < .5${AVE_OFF.filter((o) => o[0] === 0).map((o) => ` && !(abs(c.x - ${o[1]}.) < .5 && c.y > ${o[2] - 0.5} && c.y < ${o[3] + 0.5})`).join('')} ? 13. : 4.7; }
float hbN(vec2 c){ return abs(mod(c.y, 4.) - 1.) < .5${AVE_OFF.filter((o) => o[0] === 1).map((o) => ` && !(abs(c.y - ${o[1]}.) < .5 && c.x > ${o[2] - 0.5} && c.x < ${o[3] + 0.5})`).join('')} ? 13. : 4.7; }
// (set by mazeRoom: 1 where the room found is an avenue's street or one of its crossings)
float gAve = 0.;
// the room a place lies in (on a wall: the room beside it): lo and hi its floor's rectangle, open its four sides that
// have no wall (-x, +x, -z, +z), id its number (xy), its kind (z: 0 room, 1 hall, 2 corridor running north-south,
// 3 east-west) and its district (w); pd the metres to the middle of a node's corner post (9 where there is none)
void mazeRoom(vec2 p, out vec2 lo, out vec2 hi, out vec4 open, out vec4 id, out vec2 pd){
  vec2 g = (p - uOrg) / 26., ni = clamp(floor(g + .5), 2., 253.), u = (g - ni) * 26., au = abs(u), s = step(0., u);
  ivec2 n = ivec2(ni);
  ivec4 c11 = cellAt(n), c01 = cellAt(n - ivec2(1, 0)), c10 = cellAt(n - ivec2(0, 1)), c00 = cellAt(n - ivec2(1, 1));
  vec2 nodeP = uOrg + ni * 26., ci = ni - 1. + s, O = uOrg + ci * 26.;
  ivec4 c = u.x >= 0. ? (u.y >= 0. ? c11 : c10) : (u.y >= 0. ? c01 : c00);
  // THE BANDS' BREADTHS HERE (round eleven): hs, half the breadth of the stretch of each line that runs beside the
  // place; hn, the node's own half extents: the broader of the two stretches of each line that meet at it. A place
  // lies in the node, in the band of the north-south line (bandZ), in that of the east-west line (bandX), or in the
  // block between the bands.
  vec2 hs = vec2(hbW(vec2(ni.x, ci.y)), hbN(vec2(ci.x, ni.y)));
  vec2 hn = max(hs, vec2(hbW(vec2(ni.x, ni.y - s.y)), hbN(vec2(ni.x - s.x, ni.y))));
  bool nodeR = au.x <= hn.x && au.y <= hn.y, bandZ = !nodeR && au.y > hn.y && au.x <= hs.x, bandX = !nodeR && au.x > hn.x && au.y <= hs.y, hall;
  open = vec4(0.); pd = vec2(9.); gAve = 0.;
  // a hall's cleared lines and inner nodes are its floor
  ivec4 hc = c; vec2 hci = ci;
  if (bandZ) { if (u.y >= 0.) hc = c11; else hc = c10; hci = vec2(ni.x, ci.y); hall = (hc.a & 1) != 0; }
  else if (bandX) { if (u.x >= 0.) hc = c11; else hc = c01; hci = vec2(ci.x, ni.y); hall = (hc.a & 2) != 0; }
  else if (nodeR) { hc = c11; hci = ni; hall = (hc.a & 3) == 3; }
  else hall = (c.r & 128) != 0;
  float tn = float(c.b & 7);
  if (hall) {
    bool crt = (hc.a & 128) != 0;
    lo = uOrg + (hci - vec2(float(((hc.a >> 2) & 3) + (crt ? 4 * ((hc.a >> 5) & 1) : 0)), float(((hc.a >> 4) & 1) + 2 * ((hc.a >> 6) & 1)))) * 26. + 4.7;
    hi = lo + (crt ? vec2(8., 3.) : vec2(float(2 + ((hc.a >> 5) & 1)), 2.)) * 26. - 9.4;
    // (a hall is of one district: that of its own first cell)
    id = vec4(float(hc.g), 311., 1., float(cellAt(ivec2((lo - uOrg) / 26.)).b & 7));
  } else if (bandZ) {
    bool on = u.y >= 0. ? (c11.r & 1) != 0 : (c10.r & 1) != 0;
    // (it runs from this node's edge to the next node's)
    float nf = ni.y + 2. * s.y - 1., hf = max(hbN(vec2(ni.x, nf)), hbN(vec2(ni.x - 1., nf)));
    float z0 = u.y >= 0. ? nodeP.y + hn.y : nodeP.y - 26. + hf, z1 = u.y >= 0. ? nodeP.y + 26. - hf : nodeP.y - hn.y, e = on ? 1.2 : 0.;
    lo = vec2(nodeP.x - hs.x + 2. * gHw, z0 - e); hi = vec2(nodeP.x + hs.x - 2. * gHw, z1 + e);
    if (on) open.zw = vec2(1.);
    id = vec4(ni * 5. + vec2(1.3, s.y + 2.1), on ? 2. : 0., tn);
    gAve = step(5., hs.x);
  } else if (bandX) {
    bool on = u.x >= 0. ? (c11.r & 2) != 0 : (c01.r & 2) != 0;
    float nf = ni.x + 2. * s.x - 1., hf = max(hbW(vec2(nf, ni.y)), hbW(vec2(nf, ni.y - 1.)));
    float x0 = u.x >= 0. ? nodeP.x + hn.x : nodeP.x - 26. + hf, x1 = u.x >= 0. ? nodeP.x + 26. - hf : nodeP.x - hn.x, e = on ? 1.2 : 0.;
    lo = vec2(x0 - e, nodeP.y - hs.y + 2. * gHw); hi = vec2(x1 + e, nodeP.y + hs.y - 2. * gHw);
    if (on) open.xy = vec2(1.);
    id = vec4(ni * 5. + vec2(s.x + 3.2, 1.7), on ? 3. : 0., tn);
    gAve = step(5., hs.y);
  } else if (nodeR) {
    bool on = (c11.r & 4) != 0;
    lo = nodeP - hn + 2. * gHw; hi = nodeP + hn - 2. * gHw;
    if (on) {
      // (a side stands open where the street that leaves it is as broad as the node's own side; a narrower one ends
      // at the node's wall)
      open = vec4(float((c01.r >> 1) & 1), float((c11.r >> 1) & 1), float(c10.r & 1), float(c11.r & 1))
        * step(vec4(hn.y, hn.y, hn.x, hn.x) - .1, vec4(hbN(vec2(ni.x - 1., ni.y)), hbN(ni), hbW(vec2(ni.x, ni.y - 1.)), hbW(ni)));
      lo -= 2. * gHw * open.xz; hi += 2. * gHw * open.yw;
    }
    // (a crossing is of the broader street's way)
    id = vec4(ni * 7. + .5, on ? (hn.y > hn.x + .1 ? 3. : 2.) : 0., tn);
    pd = abs(au - hn + gHw);
    gAve = step(5., max(hn.x, hn.y));
  } else {
    // THE BLOCK between the cell's four bands: 16.6 m square between four ordinary lines, 8.3 m where an avenue
    // runs along it (there it holds one room across)
    vec2 b0 = vec2(hbW(ci), hbN(ci)), bs = 26. - b0 - vec2(hbW(ci + vec2(1., 0.)), hbN(ci + vec2(0., 1.)));
    vec2 nn = min(vec2(float(((c.r >> 3) & 3) + 1), float(((c.r >> 5) & 3) + 1)), max(floor(bs / 5.5), 1.)), ts = bs / nn;
    vec2 ti = clamp(floor((p - O - b0) / ts), vec2(0.), nn - 1.);
    lo = O + b0 + ti * ts + gHw * step(.5, ti); hi = O + b0 + (ti + 1.) * ts - gHw * step(ti, nn - 1.5);
    id = vec4(ci * 3. + ti + float(c.g) * .37, 0., tn);
  }
}
// the garden court's canal at a place (see canalAt): metres from its middle line, metres along it from its head, the side
vec3 canalAt(vec2 p){
  vec2 A = vec2(${DOWN_X0.toFixed(2)}, ${DOWN_Z0.toFixed(2)}), dir = vec2(${DCS.toFixed(5)}, ${DSN.toFixed(5)}), C = vec2(${DOWN_CX.toFixed(2)}, ${DOWN_CZ.toFixed(2)});
  float u = dot(p - A, dir);
  if (u < 0.) { float ac = dot(p - A, vec2(-dir.y, dir.x)); return vec3(abs(ac), u + ${COURT.head.toFixed(1)}, ac < 0. ? -1. : 1.); }
  if (p.x > C.x) return vec3(abs(p.y - ${P.STREET.z.toFixed(1)}), ${(COURT.head + COURT.arc).toFixed(2)} + p.x - C.x, p.y < ${P.STREET.z.toFixed(1)} ? -1. : 1.);
  vec2 r = p - C;
  float rl = length(r);
  return vec3(abs(rl - ${TURN_DOWN.toFixed(1)}), ${COURT.head.toFixed(1)} + ${TURN_DOWN.toFixed(1)} * (${(Math.PI / 2 + DIAG).toFixed(5)} - atan(r.y, r.x)), rl < ${TURN_DOWN.toFixed(1)} ? -1. : 1.);
}
// a wall 1.2 m thick whose middle lies d metres off, weighed by the pixel's own reach a across it
float band(float d, float a){ return clamp((.6 - d) / a + .5, 0., min(1., 1.2 / a)); }
// (the same for a wall whose top is 2 hw wide)
float band2(float d, float a, float hw){ return clamp((hw - d) / a + .5, 0., min(1., 2. * hw / a)); }
// A FLOOR'S COLOUR (round ten: BY DISTRICT, NOT BY THE ROOM'S OWN DRAW). Every room of a district has the district's
// one colour, DEEP AND CLEAR (turquoise, cobalt, coral, plum, a deeper turquoise, a deeper cobalt, warm white; NO
// YELLOW AND NO ORANGE FLOOR: the list's first colour is laid nowhere), in THREE NEAR TONES by the room's own draw
// (round eleven: nearer still: a shade deeper (x .86), as it is, a shade paler (an eighth of the pale)); one room
// in twenty is the district's accent: warm white (in a warm white district: turquoise). A hall has the paler tone.
// So the plain reads from the air as blocks of colour between lit streets. pat comes back as the room's own draw
// for its pattern.
vec3 distCol(int tn){ return uPal[tn == 1 ? 5 : tn == 2 ? 3 : tn == 3 ? 1 : tn == 4 ? 4 : tn == 5 ? 2 : tn == 6 ? 6 : 7]; }
// THE MEAN OF A DISTRICT'S ROOMS (counted, for the far field): the tones are x .86 on .33 of the rooms, x 1 on .37
// and seven parts of the colour to one of the pale (1, .97, .9) on .30; the accent on .05 of all. So of the colour
// itself .95 x (.33 x .86 + .37 + .30 x .875) = .8691, of the pale .95 x .30 x .125 = .0356, of the accent .05.
// A RUG lies in three rooms of five over .28 of the floor (see the sheet): in .36 of all rooms seven parts of the
// room's tone to three of the pale, in .24 the tone x .72: of a room's tone .832 + .1008 x .7 + .0672 x .72 = .951
// stays, and .1008 x .3 = .0302 of the pale comes in. Together: colour .8691 x .951 = .8265, pale .0356 x .951 +
// .0302 = .0641, accent .05 x .951 = .0476.
vec3 distMean(int tn){ return distCol(tn) * .8265 + vec3(1., .97, .9) * .0641 + uPal[7] * .0476; }
vec3 floorTone(vec4 id, out float pat){
  float h1 = h21(id.xy + 3.1), h2 = h21(id.xy + 17.3);
  pat = h21(id.xy + 29.9);
  int tn = int(id.w + .5);
  vec3 c = distCol(tn);
  bool hall = abs(id.z - 1.) < .5;
  c = hall || h1 >= .7 ? mix(c, vec3(1., .97, .9), .125) : h1 < .33 ? c * .86 : c;
  if (!hall && h2 < .05) c = tn == 7 ? uPal[1] : uPal[7];
  // (the garden court: pale stone; its own law lays its paths and its canal)
  if (hall && id.x > 254.5) c = uPal[7];
  return c;
}
`;
// THE BOULEVARD'S OWN MEASURE in a shader (see BLVD): blvdOf: a place as (s metres along it, n to its right); blvdD:
// metres from such a place to the boulevard's edge (under nought: within it)
const GLSL_BLVD = /* glsl */`
vec2 blvdOf(vec2 p){ vec2 r = p - vec2(${BLVD.ox.toFixed(3)}, ${BLVD.oz.toFixed(3)}); return vec2(dot(r, vec2(${DCS.toFixed(5)}, ${DSN.toFixed(5)})), dot(r, vec2(${(-DSN).toFixed(5)}, ${DCS.toFixed(5)}))); }
const vec3 BV_A = vec3(${BLVD.a.s.toFixed(3)}, ${BLVD.a.n.toFixed(3)}, ${BLVD.a.r.toFixed(1)}), BV_B = vec3(${BLVD.b.s.toFixed(3)}, ${BLVD.b.n.toFixed(3)}, ${BLVD.b.r.toFixed(1)});
float blvdD(vec2 sn){
  vec2 q = vec2(abs(sn.y) - ${BLVD.hw.toFixed(1)}, BV_A.x - sn.x);
  return min(length(max(q, 0.)) + min(max(q.x, q.y), 0.), min(length(sn - BV_A.xy) - BV_A.z, length(sn - BV_B.xy) - BV_B.z));
}
`;
// WHAT STILL WATER SHOWS (the canal, the plazas' pools): the eye's ray d, turned at the water at q, meets a tower's
// pile of lit storeys (tower B's doorway a warm light at its foot) or THE SLAB AND ITS WEAVE OF LIGHT; rip: the
// ripples' swing there. (Needs uTow, uStoB, uPal, the slab's lights and h21.)
const GLSL_MIRROR = /* glsl */`
vec3 mirrorLight(vec3 q, vec3 d, float rip){
  vec3 rr = normalize(vec3(d.x, max(-d.y, .02), d.z));
  float rh = max(length(rr.xz), 1e-4), tS = 96. / rr.y;
  vec2 ps = q.xz + rr.xz * tS + rr.xz / rh * 2.2 * rip;
  vec2 sl = slabLights(ps, dFdx(ps), dFdy(ps));
  vec3 skyL = mix(mix(SLAB_NEAR, SLAB_FAR, smoothstep(200., 3200., tS)) + SLAB_LIGHT * sl.x + SLAB_BLUE * sl.y, NIGHT_UP, 1. - exp(-tS / 5000.));
  float tHit = 1e9, hyT = 0., zT = 0., kT = -1.;
  vec2 rd = vec2(abs(rr.x) < 1e-4 ? 1e-4 : rr.x, abs(rr.z) < 1e-4 ? 1e-4 : rr.z);
  for (int k = 0; k < 17; k++) {
    if (uTow[k].z <= 0.) continue;
    vec2 o = uTow[k].xy - q.xz, ta = (o - uTow[k].z) / rd, tb = (o + uTow[k].z) / rd, t0 = min(ta, tb), t1 = max(ta, tb);
    float tn = max(t0.x, t0.y);
    if (tn > 0. && tn < min(t1.x, t1.y) && tn < tHit && rr.y * tn < uTow[k].w) { tHit = tn; hyT = rr.y * tn; kT = float(k); zT = q.z + rr.z * tn - uTow[k].y; }
  }
  if (tHit < 1e8) {
    // (a pile in the water: its plates dark, its storeys each lit in one of the floors' colours, the hero's warm;
    // tower B's great doorway a warm light at its foot)
    bool isB = abs(kT - 1.) < .5;
    float hyW = hyT * (1. + .025 * rip), hs = hyW - (isB ? ${(P.TOWB.door + 2).toFixed(1)} : 8.), fl = floor(max(hs, 0.) / 10.);
    float fh = max(fwidth(hyW), .05), sw = fh + .8, st = hs - 10. * fl, plate = hs < 0. ? 0. : max(1. - smoothstep(2. - sw, 2. + sw, st), smoothstep(10. - sw, 10., st));
    vec3 sc = isB ? uStoB[int(clamp(hs < 0. ? 0. : fl + 1., 0., 9.))] : kT < .5 ? (mod(fl, 2.) < .5 ? uPal[7] : vec3(.95, .86, .68)) : uPal[1 + int(h21(vec2(fl, kT)) * 5.999)];
    vec3 pile = mix(lit3(mix(sc, vec3(1.), .2) * .84), lit3(vec3(.2, .26, .5)), max(plate, .84 + .08 * step(.7, fract(zT / 5.))));
    float door = isB && abs(zT) < ${(P.TOWB.door / 2).toFixed(1)} && hyW < ${P.TOWB.door.toFixed(1)} ? 1. : 0.;
    pile = mix(pile, vec3(1., .86, .62) * 1.05, door);
    skyL = mix(pile, skyL, 1. - exp(-tHit / 2500.));
  }
  return mix(lit3(vec3(.055, .08, .21)), skyL, .5 + .5 * pow(max(1. - rr.y, 0.), 3.)) * (1. + .06 * rip);
}
`;
const ROOF_VERT = /* glsl */`
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// THE SHEET lies at the height of the walls' tops (6.9 m). A place on a wall is the wall's top: a clean bright line.
// Any other place is the open mouth of a room: the eye's ray goes on down into the room's box and meets its floor or
// a wall's inner face, and the depth written is that of the place met (so that what stands in a room is drawn in it).
// Far off a room melts into its mean and the mean into the field's (by the pixel's own reach: no speckle).
// THE SHARES OF A DISTRICT'S GROUND (counted, for the far field: A PATTERN SETTLES TO ITS OWN MEAN). Between its four
// avenues a district is 78 x 78 = 6084 m2: across it lie a block of 8.3 m, a band of 9.4, a block of 16.6, a band,
// a block of 16.6, a band, a block of 8.3 (49.8 m of blocks, 28.2 of bands), and the same down it. Its blocks:
// 49.8 x 49.8 = 2480 m2, of which the inner walls' tops take 168 (0.704 walls each way on the mean in a block of
// 16.6 m, 1.2 m broad: 28 m2 in each of the four middle blocks; in each of the eight blocks that an avenue
// narrows, walls one way only: 7 m2; none in the four corner blocks). Its bands: 2 x 28.2 x 49.8 = 2808.7 m2, of
// which the walls' tops take 2.4 / 9.4: 717.1. Its nine nodes: 28.2 x 28.2 = 795.2 m2, of which the floor is 9 x
// 49 = 441. A line holds a lane with odds 0.42. So: walls' tops (168 + 717.1 + 354.2) / 6084 = 0.204; lanes (0.42
// x 2091.6 + 441) / 6084 = 0.217; rooms (2312 + 0.58 x 2091.6) / 6084 = 0.579. (The avenues are laid over the
// field as ribbons by their own coverage.)
const SH_TOP = '.204', SH_COR = '.217', SH_ROOM = '.579';
// WHAT IS BUILT ON THE FLOOR ALONG THE LINE (round eleven b: WRITTEN ONCE; the sheet's law, the towers' deal and the
// rooms' furnishing all read this one list). halls: the flown halls as they stand in the maze [x0, z0, x1, z1]: the
// well's pile, hall two, the link, the concourse, the street, the forecourt. bands: the wall round each, by its
// side [west, north, east, south]: round the link and the concourse, along the street and along the forecourt it
// is 9.6 m thick (the rooms behind their doors lie in it); the street's west end stands open to the garden court,
// its east end is the forecourt, whose east end is tower B's west face. roofed: what lies under a roof beside the
// line's first stretch: the corridor with its rooms and the court's north part; the lobby with the court beside
// it; the lobby's south end.
export const BUILT = (() => {
  const H1 = P.H1, H2 = P.H2, C = P.CON, S = P.STREET, F = P.FORE, L = P.LOBBY;
  return {
    halls: [[H1.x0, H1.z0, H1.x1, H1.z1], [H2.x0, H2.z0, H2.x1, H2.z1], [-75, H2.z1, -61, P.LINK_Z], [C.x0, C.z - C.w / 2, C.x1, C.z + C.w / 2], [S.x0, S.z - S.w / 2, F.x0, S.z + S.w / 2], [F.x0, S.z - F.hw, S.x1 + 4, S.z + F.hw]],
    bands: [[1.2, 1.2, 1.2, 1.2], [1.2, 1.2, 1.2, 1.2], [9.6, 9.6, 9.6, 9.6], [9.6, 9.6, 9.6, 9.6], [0, 9.6, 0, 9.6], [0, 9.6, 0, 9.6]],
    roofed: [[-83.3, H1.z1 + 1.2, -39.3, L.z0 - 1.2], [L.x0 - 1.2, L.z0 - 1.2, -39.3, L.glassS + 1.2], [L.x0 - 1.2, L.glassS + 1.2, L.x1 + 1.2, L.z1 + 1.2]],
  };
})();
// every box of it, each hall with its walls: [x0, z0, x1, z1]
export const BUILT_BOXES = BUILT.halls.map((h, k) => [h[0] - BUILT.bands[k][0], h[1] - BUILT.bands[k][1], h[2] + BUILT.bands[k][2], h[3] + BUILT.bands[k][3]]).concat(BUILT.roofed);
// true where a square of half width e about (x, z) meets what is built
export const onBuilt = (x, z, e = 0) => BUILT_BOXES.some((b) => x > b[0] - e && x < b[2] + e && z > b[1] - e && z < b[3] + e);
const V4 = (v) => 'vec4(' + v.map((n) => n.toFixed(1)).join(', ') + ')';
const ROOF_FRAG = /* glsl */`
varying vec3 vW;
uniform mat4 projectionMatrix;
const vec2 STACK = vec2(${P.SHAFT.x.toFixed(1)}, ${P.SHAFT.z.toFixed(1)});
uniform vec3 uFog; uniform float uFogK; uniform vec4 uTow[17]; uniform vec3 uStoB[10];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_SLAB}${GLSL_FIELD}${GLSL_HOURS}${GLSL_BLVD}${GLSL_MIRROR}${GLSL_BRACKET}
// (BUILT's lists) the flown halls as they stand in the maze (x0, z0, x1, z1); the wall round each, by its side; what
// lies under a roof beside the flown line's first stretch
const vec4 HOLES[6] = vec4[6](${BUILT.halls.map(V4).join(', ')});
const vec4 BANDS[6] = vec4[6](${BUILT.bands.map(V4).join(', ')});
const vec4 ROOFED[3] = vec4[3](${BUILT.roofed.map(V4).join(', ')});
// the rooms behind the doors of an open street along x from x0 to x1 about z0, hw its half width (the world builds
// them: 9 m square, a door every 14 m, the south wall's from 6 m on, the north wall's from 9.5 m): true where p lies
// in the street's two bands of rooms; lo, hi the room there, solid where the wall's top is whole
bool streetRooms(vec2 p, float x0, float x1, float z0, float hw, out vec2 lo, out vec2 hi, out vec4 id, out float solid){
  float dz = p.y - z0;
  solid = 0.;
  if (abs(dz) <= hw || abs(dz) >= hw + 9.6 || p.x <= x0 || p.x >= x1) return false;
  float sd = sign(dz), d0 = sd > 0. ? 6. : 9.5, qc = d0 + 14. * floor((p.x - x0 - d0) / 14. + .5);
  lo = vec2(x0 + qc - 4.5, sd > 0. ? z0 + hw + .35 : z0 - hw - 9.35); hi = lo + 9.;
  id = vec4(qc + x0, 9. + sd, 0., 0.);
  vec2 o2 = max(lo - p, p - hi);
  if (qc < 0. || qc > x1 - 1.4 - x0 - 9. || max(o2.x, o2.y) > .6) solid = 1.;
  return true;
}
void main(){
  vec2 p = vW.xz, a = max(abs(dFdx(p)) + abs(dFdy(p)), vec2(.02));
  float fw = max(a.x, a.y), cov = 0., hole = 0.;
  vec2 lo, hi, pd; vec4 open, id;
  gHw = mix(.3, .6, smoothstep(150., 190., wayD(p)));
  mazeRoom(p, lo, hi, open, id, pd);
  float aveP = gAve;
  // a wall 1.2 m thick stands round each flown hall; a room that would run on under it ends at it
  for (int k = 0; k < 6; k++) {
    vec4 h = HOLES[k], w = h + vec4(-1., -1., 1., 1.) * BANDS[k];
    bool inX = p.x > w.x && p.x < w.z, inZ = p.y > w.y && p.y < w.w;
    if (p.x > h.x && p.x < h.z && p.y > h.y && p.y < h.w) hole = 1.;
    if (inX && inZ) cov = 1.;
    else if (inZ) {
      if (p.x <= w.x) { if (hi.x > w.x + .05) { hi.x = w.x; open.y = 0.; } }
      else if (lo.x < w.z - .05) { lo.x = w.z; open.x = 0.; }
    } else if (lo.x < w.z - .05 && hi.x > w.x + .05) {
      if (p.y <= w.y) { if (hi.y > w.y + .05) { hi.y = w.y; open.w = 0.; } }
      else if (lo.y < w.w - .05) { lo.y = w.w; open.z = 0.; }
    }
  }
  // THE CORRIDOR WE CAME DOWN and its two arms, with the rooms behind their doors: all of it lies under a roof (round
  // six: what has a ceiling from below has a roof from above); a room of the maze that would run on under it ends at it
  // (round eight: THE HALL BESIDE THE CORRIDOR, beyond its glass, lies under the same roof: from z 23.2 north the
  // roof's east edge stands at x -39.3; the corridor has one arm, to the west)
  // (round eleven: three rectangles lie under roofs: the corridor with its rooms and the court's north part; THE
  // LOBBY with the court beside it; the lobby's south end. The arm and the run behind the entry are gone.)
  float roofed = 0.;
  for (int k = 0; k < 3; k++) {
    vec4 w = ROOFED[k];
    bool inX = p.x > w.x && p.x < w.z, inZ = p.y > w.y && p.y < w.w;
    if (inX && inZ) roofed = 1.;
    else if (inZ) {
      if (p.x <= w.x) { if (hi.x > w.x + .05) { hi.x = w.x; open.y = 0.; } }
      else if (lo.x < w.z - .05) { lo.x = w.z; open.x = 0.; }
    } else if (lo.x < w.z - .05 && hi.x > w.x + .05) {
      if (p.y <= w.y) { if (hi.y > w.y + .05) { hi.y = w.y; open.w = 0.; } }
      else if (lo.y < w.w - .05) { lo.y = w.w; open.z = 0.; }
    }
  }
  // (round nine: THE COURT BESIDE THE CORRIDOR, beyond its glass, is open to the great hall: the sheet has a hole over
  // it (the world draws its floor, its range and what stands in it); a band of wall top stands round it)
  if (p.x > -63.3 && p.x < -40.5 && p.y > -78.2 && p.y < 22.) { roofed = 0.; hole = 1.; }
  // THE ROOMS BEHIND THE CONCOURSE'S AND THE STREET'S DOORS stand open too: the sheet opens over each and is the
  // wall's top between
  float solid = 0.;
  vec2 rlo, rhi; vec4 rid; float rsolid;
  if (streetRooms(p, 42., ${P.CON.x1.toFixed(1)}, -262., 7., rlo, rhi, rid, rsolid) || streetRooms(p, ${P.STREET.x0.toFixed(1)}, ${P.FORE.x0.toFixed(1)}, ${P.STREET.z.toFixed(1)}, ${(P.STREET.w / 2).toFixed(1)}, rlo, rhi, rid, rsolid)
    || streetRooms(p, ${P.FORE.x0.toFixed(1)}, ${P.STREET.x1.toFixed(1)}, ${P.STREET.z.toFixed(1)}, ${P.FORE.hw.toFixed(1)}, rlo, rhi, rid, rsolid)) {
    open = vec4(0.); pd = vec2(9.); cov = 0.;
    lo = rlo; hi = rhi; id = rid; solid = rsolid;
  }
  // THE TOWERS (x, z, half the width of the foot, the height): a white wall stands round each square foot; within it
  // the sheet is open
  // (round ten) ROUND EVERY TOWER'S FOOT LIES A TERRACE at the height of the walls' tops, 10 m and a seventh of the
  // foot's half width broad (the core's: 17 m; not round tower B, whose forecourt is its own, nor round the well's
  // own building): pale stone in slabs of 3 m, a pale kerb at its edge, a row of lights set flush in it 1.5 m in
  // from the kerb, one to every 9 m. THE TOWER'S FOOT IS SEEN ON IT, in its pool of light.
  float apron = 0., apE = 0., apAl = 0.;
  for (int k = 0; k < 17; k++) {
    vec2 r2 = abs(p - uTow[k].xy);
    float rt = max(r2.x, r2.y), ap = 10. + .14 * uTow[k].z;
    if (rt < uTow[k].z + 1.2) cov = 1.;
    if (rt < uTow[k].z - .4) hole = 1.;
    if (k != 1 && uTow[k].z > 0. && rt < uTow[k].z + ap && distance(uTow[k].xy, STACK) > 1.) { apron = 1.; cov = 1.; apE = uTow[k].z + ap - rt; apAl = r2.x > r2.y ? p.y - uTow[k].y : p.x - uTow[k].x; }
  }
  // (the core's and tower B's great doorways, each with its room, 16 and 24 m wide and 12 m deep: open down to the floor)
  if (abs(p.y - CORE.y) < 8. && p.x > CORE.x - 52. && p.x < CORE.x - 38.) hole = 1.;
  if (abs(p.y - ${P.TOWB.z.toFixed(1)}) < ${(P.TOWB.door / 2).toFixed(1)} && p.x > ${(P.TOWB.x - P.TOWB.r - 2).toFixed(1)} && p.x < ${(P.TOWB.x - P.TOWB.r + 12).toFixed(1)}) hole = 1.;
  // THE BOULEVARD (round eleven: see BLVD). WITHIN IT THE SHEET STANDS OPEN: the paving, the walls, the pools, the
  // trees and the standards there are built bodies. A ray that passes THE GATE in the garden court's north wall
  // before it comes down is the court's: the court's own law draws it. ROUND THE BOULEVARD, 12 m broad, THE ROOMS
  // LIE UNDER GLASS ROOFS (not over an avenue's street, which runs on under the open hall).
  vec3 d = normalize(vW - cameraPosition);
  vec2 sn = blvdOf(p);
  float bd = blvdD(sn), lid = 0.;
  bool thru = false;
  if (p.y < ${BLVD.zc.toFixed(1)}) {
    if (bd < 0.) {
      float tc = (${BLVD.zc.toFixed(1)} - p.y) / max(d.z, 1e-4);
      vec2 pg = p + d.xz * tc;
      if (d.z > 0. && tc < 6.9 / max(-d.y, .002) && blvdD(blvdOf(vec2(pg.x, ${(BLVD.zc - 0.01).toFixed(2)}))) < 0.) {
        thru = true;
        mazeRoom(vec2(clamp(pg.x, ${(COURT.x0 + 1).toFixed(1)}, ${(COURT.x1 - 1).toFixed(1)}), ${(BLVD.zc + 1).toFixed(1)}), lo, hi, open, id, pd);
        aveP = 0.;
      } else hole = 1.;
    } else if (bd < ${BLVD.lid.toFixed(1)} && aveP < .5) lid = 1.;
  }
  // the walls' tops (hard: what is whole at any distance: the bands round the flown halls, the roofs, the towers' feet
  // and terraces)
  float hard = cov;
  vec2 dw = vec2(min(p.x - lo.x + 99. * open.x, hi.x - p.x + 99. * open.y), min(p.y - lo.y + 99. * open.z, hi.y - p.y + 99. * open.w));
  cov = max(cov, max(band2(abs(dw.x + gHw), a.x, gHw), band2(abs(dw.y + gHw), a.y, gHw)));
  solid = max(solid, roofed);
  hard = max(hard, solid);
  cov = max(max(cov, solid), min(band2(pd.x, a.x, gHw), band2(pd.y, a.y, gHw)));
  // (through the gate the eye looks down into the court from over the boulevard: no wall's top stands there)
  if (thru) { cov = 0.; hard = 0.; }
  // down into the room along the eye's ray
  vec2 pc = thru ? p : clamp(p, lo, hi), dd = max(abs(d.xz), vec2(1e-4));
  float tf = 6.9 / max(-d.y, .002);
  vec2 tw = vec2(d.x > 0. ? hi.x - pc.x : pc.x - lo.x, d.z > 0. ? hi.y - pc.y : pc.y - lo.y) / dd;
  if ((d.x > 0. ? open.y : open.x) > .5) tw.x = 1e6;
  if ((d.z > 0. ? open.w : open.z) > .5) tw.y = 1e6;
  float t = min(tf, min(tw.x, tw.y));
  vec3 q = vec3(pc.x, 6.9, pc.y) + d * t;
  float kind = id.z, pat;
  vec3 fc = floorTone(id, pat);
  // THE LIGHT (round nine): NO SKY, NO KEY LIGHT, NO SHADE OF A SUN. LIGHT COMES ONLY FROM THINGS. Every roofless
  // room is A LIT TILE: its floor glows in its own clear colour under its lamps, the inner faces of its walls stand
  // pale in that light, brightest low down; the walls' tops between the rooms are deep blue, never black, with a
  // breath of the room beside them; the corridors are warm white ribbons, a row of beads of light running down
  // each by the lights' one law. IN EVERY ROOM STAND LIT WARM LAMPS, by one law that the furnishing reads too: a
  // room's lamps stand on its own lattice, one to each 9 m of its length and of its width, each 0.3 of its cell
  // from the west and 0.7 toward the south. AFTER HOURS (see hoursAt): in the sector the tiles are dark but for one
  // in nine: a deep blue that keeps a breath of their colour; the ribbons glow at a quarter, their beads run on.
  bool cor = kind > 1.5, court = id.x > 254.5 && abs(kind - 1.) < .5;
  // THE AVENUES (round ten; round eleven: STREETS, 26 m broad): every fourth line of the plan both ways (the lines
  // 4k + 1: the districts lie between them). A corridor on such a line is AN AVENUE: warm stone paving in slabs of
  // 3 m under warm light, its two walls' tops lit by it, a row of beads down its middle, a row of lamp standards
  // and trees down each side (see below). Every other corridor is A LANE: a pale cool blue at .6 of the light, its
  // beads small. So the plan reads from the air: lit streets between blocks of colour.
  float ave = cor ? aveP : 0.;
  float m = 1.;
  if (cor) {
    fc = mix(vec3(.6, .67, .88), vec3(.93, .84, .66), ave);
    vec2 jf = abs(fract(q.xz / 3.) - .5) * 3.;
    m = 1. - .12 * ave * smoothstep(1.43 - fw, 1.47, max(jf.x, jf.y)) * (1. - smoothstep(.25, 1.1, fw));
  } else {
    float big = kind > .5 ? 2.5 : 1.;
    // (round eleven: the patterns plainer: two nearer tones, a finer joint)
    if (pat < .24 || (kind > .5 && pat < .6)) {
      // chevrons of two near tones
      float v = abs(fract(q.x / (7.2 * big)) * 7.2 * big - 3.6 * big) + q.z, sw = min(fw / (1.3 * big), .5);
      m = mix(.92, 1.03, smoothstep(.5 - sw, .5 + sw, abs(fract(v / (2.6 * big)) - .5) * 2.));
    } else if (pat < .46 || kind > .5) {
      // tiles: a fine dark joint
      vec2 jf = abs(fract(q.xz / (2.2 * big)) - .5) * 2.2 * big;
      m = 1. - .12 * smoothstep(1.1 * big - .07 - fw, 1.1 * big - .03, max(jf.x, jf.y)) * (1. - smoothstep(.25, 1.1, fw));
    }
    // (round eleven) A RUG OF A SECOND TONE lies in three rooms of five (by the room's own draw) over the middle
    // of the floor (half its length by .56 of its width): in three of those five paler (three parts of the pale
    // to seven of the floor's tone), in two deeper (x .72)
    if (kind < .5) {
      float h3 = h21(id.xy + 83.9);
      vec2 sz = max(hi - lo, vec2(1.)), rq = abs(q.xz - (lo + hi) * .5), eR = vec2(max(fw, .05));
      float inR = (1. - smoothstep(.25 * sz.x - eR.x, .25 * sz.x + eR.x, rq.x)) * (1. - smoothstep(.28 * sz.y - eR.y, .28 * sz.y + eR.y, rq.y)) * step(h3, .6);
      fc = mix(fc, h3 < .36 ? mix(fc, vec3(1., .97, .9), .3) : fc * .72, inR);
    }
  }
  // the floor darkens a little toward the foot of each wall; a wall's inner face is brightest toward the floor
  vec2 e2 = min(q.xz - lo + 99. * open.xz, hi - q.xz + 99. * open.yw);
  float ao = 1. - .27 * exp(-max(min(e2.x, e2.y), 0.) / 1.1), hq = clamp(q.y / 6.9, 0., 1.);
  bool wallHit = t < tf - 1e-3;
  // the inner face met looks into its room
  vec2 nf = tw.x < tw.y ? vec2(-sign(d.x), 0.) : vec2(0., -sign(d.z));
  vec2 size = hi - lo;
  float near1 = 1. - smoothstep(1.2, 4., fw);
  // (how far the room is lit: by the hour, a tile by its own draw; one tile in nine stays lit in the sector; the
  // garden court is flown and always lit; a lit tile is a shade
  // brighter or deeper by its own draw; a ribbon after hours glows at a quarter)
  float hrs = cor ? hoursAt(q.xz, 0.) : max(hoursAt((lo + hi) * .5, h21(id.xy + 43.7)), step(h21(id.xy + 71.3), .111));
  if (abs(kind - 1.) < .5 && id.x > 254.5) hrs = 1.;
  float Lr = cor ? mix(.25, 1., hrs) : hrs * (.9 + .1 * h21(id.xy + 9.9));
  // (a lane stands at .6 of an avenue's light; A FEW ROOMS ARE DARK: three in a hundred, by the room's own draw)
  if (cor) Lr *= mix(.6, 1., ave); else if (kind < .5 && h21(id.xy + 57.1) < .03) Lr = 0.;
  vec3 LAMPW = vec3(1., .84, .56), WALLW = mix(vec3(.9, .9, .87), fc, cor ? .06 : .56), DARKF = mix(vec3(.05, .075, .21), fc, .16), DARKW = vec3(.075, .105, .27), emis = vec3(0.), linW = vec3(0.);
  float wm = 0.;
  vec3 col = mix(DARKF, fc * m * ao * .94, Lr);
  if (wallHit) {
    vec3 face = WALLW * (cor ? mix(.86, .5, hq) : mix(.8, .4, hq));
    // (near the eye a face shows its panel joints every 3.25 m and its skirting: no large face is one flat tone)
    float alw = tw.x < tw.y ? q.z : q.x, jd = abs(fract(alw / 3.25) - .5) * 3.25, jw = max(.6 * fw, .02);
    face *= (1. - .15 * clamp((.045 - jd) / jw + .5, 0., 1.) * clamp(.1 / jw, 0., 1.)) * (1. - .2 * (1. - smoothstep(.3, .36 + .5 * fw, q.y)) * clamp(.5 / jw, 0., 1.));
    col = mix(DARKW * mix(1.2, .9, hq), face, Lr);
  }
  // far off: the room's mean (more of its far wall the flatter the eye's way)
  float run = tf * length(d.xz), ext = dot(size, dd) / (dd.x + dd.y);
  float ff = clamp(1. - run / max(ext, 1.), 0., 1.);
  vec3 wallV = mix(DARKW, WALLW * (cor ? .68 : .6), Lr);
  vec3 fcM = mix(DARKF, fc * .85, Lr) + (cor ? vec3(0.) : LAMPW * .1 * Lr);
  col = mix(mix(mix(wallV, fcM, cor ? .1 : .3), fcM, ff), col, near1);
  if (cor) {
    // A CORRIDOR IS A RIBBON OF WARM WHITE LIGHT. Under a front of the lights' wave the whole of it stands brighter
    // (a broad pulse, seen from far), and DOWN ITS MIDDLE RUNS A ROW OF BEADS, one to every 6 m: each a round light
    // that swells as the front passes its own place: the beads run. A lamp stands on a bracket every 6 m at each
    // wall: a pool at the wall's foot, an upright wash of its light on the wall.
    vec2 mid = (lo + hi) * .5;
    // (ns: the walls here run north and south: by the face met, else by the corridor's own way)
    bool ns = wallHit ? tw.x < tw.y : kind < 2.5;
    float al = ns ? q.z : q.x, off = ns ? q.x - mid.x : q.z - mid.y, k6 = (floor(al / 6.) + .5) * 6., hwF = .5 * (ns ? size.x : size.y);
    float has = 1. - (ns ? (off < 0. ? open.x : open.y) : (off < 0. ? open.z : open.w));
    // (the wave over a ribbon: far off it settles to ITS OWN MEAN, .15: the hump is a squared sine over 30 % of the
    // phase: .5 x .3)
    float wv = mix(waveHump(q.x + q.z), .15, smoothstep(5., 16., fw));
    col = mix(col * (1. + .14 * wv), vec3(.95, .93, .86), .3 * wv * Lr * (wallHit ? 1. - .6 * hq : 1.));
    float beadK = mix(.4, 1., ave), lampR = mix(1.5, 2.25, ave);
    if (!wallHit) {
      vec2 bp = ns ? vec2(mid.x, k6) : vec2(k6, mid.y);
      float bw = waveHump(bp.x + bp.y), rb = max(.9, .8 * fw), db = length(q.xz - bp);
      col = mix(col, vec3(1., .97, .88), .75 * beadK * exp(-db * db / (rb * rb)) * min(.9 / rb, 1.) * (.45 + .55 * bw));
      emis += vec3(1., .94, .8) * 2.6 * beadK * exp(-db * db / .3) * (.35 + .65 * bw) * near1;
    }
    // (an avenue's lamps lay pools half as wide again)
    float rl = max(lampR, .8 * fw), da = al - k6, dw2 = hwF - abs(off), dy = q.y - 3.3;
    // (ON THE WALL: the bracket lamp's one law, a lane's and an avenue's alike: its upright soft bar and its wash, by
    // the metres from the lamp at every pixel's reach. FAR OFF EACH FADES TO ITS OWN MEAN over the wall of the
    // lamp's bay, 6 m long and 6.9 m high (counted: the wash's ${bracketMean(6, 3.3, 6.9).toFixed(4)}, the bar's ${bracketMean(6, 3.3, 6.9, BRACKET.bar).toFixed(4)}), never to nought: the wash
    // from a pixel that reaches as far as the wash falls to either side (1.2 m) to one that reaches a whole bay; the
    // bar, 0.16 m broad and far under a pixel by then, over the reach at which the sheet lets every near thing go
    // (near1). ON THE FLOOR: the lamp's pool.)
    float g = has * Lr * (wallHit ? mix(bracketWash(da, dy), ${bracketMean(6, 3.3, 6.9).toFixed(4)}, smoothstep(${BRACKET.wash[0].toFixed(1)}, 6., fw)) : exp(-(da * da + dw2 * dw2) / (rl * rl)) * (lampR / rl));
    col = mix(col, LAMPW * .92, .5 * g) + LAMPW * .12 * g;
    emis += vec3(1., .8, .5) * 1.5 * has * Lr * (wallHit ? mix(${bracketMean(6, 3.3, 6.9, BRACKET.bar).toFixed(4)}, bracketBar(da, dy), near1) : 0.);
    if (ave > .5 && !wallHit) {
      // AN AVENUE IS A STREET (round eleven): down each side, 5.5 m in from its wall, A ROW OF LAMP STANDARDS, one to
      // every 13 m, each in a pool of warm light 4.2 m in reach, and between every two A TREE IN A ROUND BED 2.3 m
      // in radius (the sheet lays the pool, the standard's own light and the bed)
      float rowD = abs(abs(off) - (hwF - 5.5)), ds = al - (floor(al / 13.) + .5) * 13., dt = 6.5 - abs(ds);
      float d2s = ds * ds + rowD * rowD, rs = max(4.2, .8 * fw), gS = Lr * exp(-d2s / (rs * rs)) * (4.2 / rs) * (4.2 / rs);
      col = mix(col, LAMPW * .92, .45 * gS) + LAMPW * .1 * gS;
      emis += vec3(1., .84, .56) * 2.4 * exp(-d2s / .25) * near1 * Lr;
      float rt = max(2.3, .7 * fw), bed = (1. - smoothstep(rt - .3 - fw, rt + fw, length(vec2(dt, rowD)))) * (2.3 / rt) * (2.3 / rt);
      col = mix(col, mix(vec3(.07, .15, .1), vec3(.2, .4, .22), .5 * Lr), bed);
    }
    // THE DOORS OF THE ROOMS (round six): along a corridor each block has two doors in each wall (a quarter and
    // three quarters of the way down it; one in its middle where an avenue has narrowed the block to 8.3 m),
    // 3.6 m wide and 5 m high, each a leaf in the paler colour of its room's own floor. THE
    // LEAVES SLIDE IN THE DOORS' WAVE, each by its own place; as a leaf slides its room's light stands in the opening
    // and ITS COLOUR FALLS OUT ONTO THE CORRIDOR'S FLOOR. (Drawn where the eye is near enough to read a door.)
    if (fw < 1.2 && has > .5) {
      // (by the place met, not by the block the eye looks in through)
      float org = ns ? uOrg.y : uOrg.x, cl = floor((al - org) / 26.), sdD = off < 0. ? -1. : 1.;
      // (the block behind the wall lies between the bands of the two lines that cross the corridor there)
      float lnC = floor(((ns ? mid.x - uOrg.x : mid.y - uOrg.y)) / 26. + .5) + (sdD < 0. ? -1. : 0.);
      vec2 cB = ns ? vec2(lnC, cl) : vec2(cl, lnC);
      float hA = ns ? hbN(cB) : hbW(cB), hB = ns ? hbN(cB + vec2(0., 1.)) : hbW(cB + vec2(1., 0.)), b0 = org + cl * 26. + hA, bl = 26. - hA - hB;
      float dc = bl > 12. ? b0 + (al - b0 < .5 * bl ? .25 : .75) * bl : b0 + .5 * bl;
      vec2 pc2 = ns ? vec2(mid.x + sdD * (hwF + 2.7), dc) : vec2(dc, mid.y + sdD * (hwF + 2.7));
      vec2 lo2, hi2, pd2; vec4 op2, id2; float pat2;
      mazeRoom(pc2, lo2, hi2, op2, id2, pd2);
      vec3 rc = floorTone(id2, pat2);
      float o = doorOpen(pc2.x + pc2.y), fadeD = 1. - smoothstep(.4, 1.2, fw), da2 = al - dc, eD = max(fw, .04);
      if (wallHit) {
        float inD = (1. - smoothstep(1.8 - eD, 1.8 + eD, abs(da2))) * (1. - smoothstep(5. - eD, 5. + eD, q.y)) * fadeD;
        float gap = 1. - smoothstep(-eD, eD, da2 + 1.8 - 3.6 * o);
        col = mix(col, mix(mix(vec3(.9), rc, .55) * .8 * Lr, min(rc * 1.3 + .06, vec3(.95)), gap), inD);
        emis += rc * .4 * gap * inD * near1;
      } else if (!wallHit) {
        float acr = hwF - abs(off), hwD = 1.8 * o + .2 * acr;
        float poolD = o * (1. - smoothstep(hwD - eD, hwD + eD, abs(da2 + 1.8 - 1.8 * o))) * (1. - smoothstep(1.5, 5.5, acr)) * fadeD;
        col = mix(col, min(rc * 1.35 + .1, vec3(1.)), .75 * poolD);
      }
    }
  } else {
    vec2 nl = clamp(floor(size / 9. + .5), 1., 8.), cell = size / nl;
    vec2 li = clamp(floor((clamp(q.xz, lo, hi) - lo) / cell - vec2(.3, .7) + .5), vec2(0.), nl - 1.), lv = q.xz - lo - (li + vec2(.3, .7)) * cell;
    float rl = max(2.1, .8 * fw), l2 = dot(lv, lv), dy = q.y - 3.4;
    // (THE LAMPS ARE LIGHTS OF THE FLOOR, under the lights' one law: a lamp's pool rests small and swells to twice as
    // wide and full as a front of the wave passes its own place: fronts of warm light run through the rooms to the
    // horizon)
    vec2 lp = lo + (li + vec2(.3, .7)) * cell;
    float lw = waveHump(lp.x + lp.y);
    rl *= 1. + lw;
    // (THE GARDEN COURT, hall 255, has its own lamps: none of the lattice stands in it; after hours a room's lamps are out)
    float dry = court ? 0. : Lr;
    float g = dry * exp(-(l2 + (wallHit ? dy * dy * .5 : 0.)) / (rl * rl)) * min(1.5 / rl * (1. + lw), 1.) * (.6 + .4 * lw);
    col = mix(col, LAMPW * .92, .8 * g) + LAMPW * .18 * g;
    // (the lamp's own light: a bright warm point where it stands)
    emis = vec3(1., .8, .5) * (wallHit ? 0. : 2.4 * exp(-l2 / .3)) * near1 * dry;
    if (court && wallHit) {
      // THE COURT'S WALLS ARE NOT BLANK (round seven): a warm lamp on a bracket every 6.5 m, 3.6 m up, with its
      // light on the wall; between every two pairs of lamps a door 3.6 m wide and 5 m high, its leaf in the
      // paler colour of one of the floors
      // (the bracket lamp's one law: an upright soft bar, to 1/e 0.16 m broad and 1 m high either way, in a wash
      // that falls to 1/e 1.2 m to either side and 3.6 m up and down: it reaches the wall's foot. FAR OFF EACH FADES
      // TO ITS OWN MEAN over the wall of the lamp's bay, 6.5 m long and 6.9 m high (counted: the wash's ${bracketMean(6.5, 3.6, 6.9).toFixed(4)}, the
      // bar's ${bracketMean(6.5, 3.6, 6.9, BRACKET.bar).toFixed(4)}), never to nought, as on a corridor's wall of this sheet: the wash from a pixel that reaches
      // as far as the wash falls to either side (1.2 m) to one that reaches a whole bay; the bar over the reach at
      // which the sheet lets every near thing go (near1))
      float alc = tw.x < tw.y ? q.z : q.x, dac = alc - (floor(alc / 6.5) + .5) * 6.5, dyc = q.y - 3.6;
      float glc = mix(bracketWash(dac, dyc), ${bracketMean(6.5, 3.6, 6.9).toFixed(4)}, smoothstep(${BRACKET.wash[0].toFixed(1)}, 6.5, fw));
      float dcc = floor(alc / 13. + .5) * 13., eD = max(fw, .04);
      float inD = (1. - smoothstep(1.8 - eD, 1.8 + eD, abs(alc - dcc))) * (1. - smoothstep(5. - eD, 5. + eD, q.y)) * (1. - smoothstep(.6, 1.6, fw));
      vec3 rcc = uPal[1 + int(h21(vec2(dcc, nf.x * 3. + nf.y * 7.)) * 5.999)];
      col = mix(vec3(.3, .36, .6) * mix(.8, 1., hq), mix(vec3(.9), rcc, .55) * .6, inD);
      col = mix(col, LAMPW * .92, .7 * glc) + LAMPW * .14 * glc;
      emis += vec3(1., .8, .5) * 1.5 * mix(${bracketMean(6.5, 3.6, 6.9, BRACKET.bar).toFixed(4)}, bracketBar(dac, dyc), near1);
      // (THE STREET'S MOUTH in the east wall, 18 m wide, open to the wall's top: the eye's ray goes on down the street)
      if (tw.x < tw.y && d.x > 0. && abs(q.z - ${P.STREET.z.toFixed(1)}) < ${(P.STREET.w / 2).toFixed(1)}) hole = 1.;
      // (THE BOULEVARD'S GATE in the north wall, as broad as the boulevard: open to the wall's top)
      if (tw.y <= tw.x && d.z < 0. && blvdD(blvdOf(vec2(q.x, ${(BLVD.zc - 0.01).toFixed(2)}))) < 0.) hole = 1.;
    }
    if (court && !wallHit) {
      // THE GARDEN COURT'S FLOOR (round nine: NO LAWN; a paved court in the night-like hall), by the canal's own
      // measure (n metres from its middle line, s along it from its head): THE CANAL, 12 m of dark water in a pale
      // stone kerb; STONE PAVING to the walls, tiles of 1.5 m that go round with the canal, deep blue between the
      // lamps; A POOL OF WARM LIGHT under every lamp standard (one to each 12 m of the canal on both sides, 9 m from
      // its middle; and one at every place of the court's own lattice of 26 m that lies 30 m or more from the
      // canal); A COLOURED PATH 3.2 m wide either side (turquoise on the left hand, plum on the right), a fine
      // line of light along each of its edges.
      vec3 cn = canalAt(q.xz);
      float n = cn.x, s = cn.y, eb = max(.6 * fw, .03);
      float dW = max(n - ${COURT.hw.toFixed(1)}, max(-s, s - ${COURT.len.toFixed(2)}));
      float water = 1. - smoothstep(-eb, eb, dW), inK = 1. - smoothstep(${COURT.kerb.toFixed(1)} - eb, ${COURT.kerb.toFixed(1)} + eb, dW);
      float pathM = 1. - smoothstep(1.6 - eb, 1.6 + eb, abs(n - 11.5));
      vec2 tj = (.5 - abs(fract(vec2(s, n) / 1.5) - .5)) * 1.5;
      float jw = max(fw, .03), jt = max(clamp((.03 - tj.x) / jw + .5, 0., 1.), clamp((.03 - tj.y) / jw + .5, 0., 1.)) * clamp(.06 / jw, 0., 1.);
      vec3 ca = vec3(.6, .62, .7) * (1. - .2 * jt);
      ca = mix(ca, cn.z < 0. ? uPal[1] : uPal[4], pathM);
      // (round eleven) INSIDE THE GATE THE BOULEVARD'S WARM STONE RUNS ON INTO THE COURT, as broad as the gate, and
      // gives way to the court's own stone over 26 m: no line is drawn across the paving under the gate
      vec2 gsn = blvdOf(q.xz);
      float apr = (1. - smoothstep(0., 26., q.z - (${BLVD.zc.toFixed(1)}))) * (1. - smoothstep(${(BLVD.hw - 4).toFixed(1)}, ${BLVD.hw.toFixed(1)}, abs(gsn.y)));
      ca = mix(ca, vec3(.74, .67, .55) * (1. - .16 * jt), apr);
      // (THE LIGHTS' WAVE PASSES OVER THE COURT, by place and the clock as everywhere on the floor: the standards'
      // pools swell under each front)
      float wvC = waveHump(q.x + q.z) * (1. - smoothstep(8., 30., fw));
      float sk = (floor(s / 12.) + .5) * 12., d2s = (s - sk) * (s - sk) + (n - 9.) * (n - 9.);
      float gp = step(0., s) * step(sk, ${(COURT.len - 2).toFixed(2)}) * (exp(-d2s / 10.) + .3 * exp(-d2s / 70.));
      vec2 lc0 = vec2(${COURT.x0.toFixed(1)}, ${COURT.z0.toFixed(1)}), ln = (floor((q.xz - lc0) / 26.) + .5) * 26. + lc0;
      float d2l = dot(q.xz - ln, q.xz - ln);
      gp += step(30., canalAt(ln).x) * (exp(-d2l / 10.) + .3 * exp(-d2l / 70.));
      gp = min(gp * (.8 + .4 * wvC), 1.);
      vec3 gl = ca * ao * (mix(vec3(.2, .26, .5), vec3(.3, .33, .5) + LAMPW * .3, apr) + LAMPW * 1.1 * gp);
      gl = mix(gl, vec3(.9, .93, 1.), .8 * (1. - smoothstep(.12 - eb, .12 + eb, abs(abs(n - 11.5) - 1.6))) * clamp(.24 / eb, 0., 1.));
      vec3 kerbC = (vec3(.5, .54, .68) + LAMPW * .3 * gp) * (1. - .22 * (1. - smoothstep(0., .15, dW)));
      // (round ten) THE CANAL'S EDGE GLOWS: a line of turquoise light under the kerb's lip all the way round the
      // water; its glow lies on the kerb and on the water beside it
      float edgeL = (1. - smoothstep(.09, .09 + 2. * eb, abs(dW + .05))) * clamp(.3 / eb, 0., 1.), edgeG = exp(-abs(dW) / 1.3);
      kerbC += vec3(.04, .46, .46) * edgeG;
      // THE WATER IS A DARK MIRROR: the eye's ray, turned at the water, meets a tower's pile of lit storeys (tower
      // B's doorway a warm light at its foot, the ring in it) or THE SLAB AND ITS WEAVE OF LIGHT. It is never quite
      // still: long low ripples go down the canal, each by its own place and the clock, and the lights tremble.
      float rip = (sin(s * 1.9 + n * .7 - uTime * .8) + sin(s * 1.1 - n * 1.3 + uTime * .6) + .6 * sin(s * 3.1 + n * 2.3 + uTime * 1.1)) * (1. - smoothstep(.25, 1.2, fw));
      linW = mirrorLight(q, d, rip) + vec3(.003, .06, .065) * edgeG * edgeG + vec3(.25, 1.25, 1.2) * edgeL;
      wm = water * inK * near1;
      gl = mix(gl, kerbC, inK);
      col = mix(col, gl, near1);
      emis = emis * (1. - inK) + vec3(.25, 1.25, 1.2) * edgeL * near1;
    }
  }
  // FAR OFF the rooms melt, level by level, and THE FIELD OF LIGHT KEEPS ITS BROAD COLOUR TO THE HORIZON (round nine:
  // what the plain is read by from the air is broad colour that does not fade). ROUND TEN: EVERY LEVEL IS THE MEAN OF
  // THE LEVEL BELOW IT, COUNTED: a cell of the plan (26 m) is one tile of light: its rooms' mean, its lanes' and its
  // walls' tops', each by its share of the cell; a district (104 m) is its cells' mean; and through all of it THE
  // AVENUES run as warm white ribbons to the horizon, the lights' wave pulsing along them. The sector that is after
  // hours lies in it as a deep blue wedge with single lit tiles and ribbons at a quarter.
  vec2 cg = (p - uOrg) / 26., ci2 = floor(cg), cf = (fract(cg) - .5) * 26., cc = (ci2 + .5) * 26. + uOrg;
  float c1 = h21(ci2 + 5.5), c2 = h21(ci2 + 31.7);
  int tnD = int(id.w + .5);
  float hc = max(hoursAt(cc, c1), step(h21(ci2 + 71.3), .111));
  // (a cell's lamps as one warm dab. Its own mean over the cell and the clock: .65 x .325 x .72 = .152 (the draw's
  // mean .3 + .7 x .5; the dab's own, pi x 70 / 676; the wave's, .6 + .8 x .15: a product of three that do not know
  // of one another, so the product of their means). Far off it settles to that mean: lampF goes to 1.)
  float dab = (.3 + .7 * c1) * exp(-dot(cf, cf) / 70.) * (.6 + .8 * waveHump(cc.x + cc.y));
  float lampF = mix(dab / .152, 1., smoothstep(30., 90., fw));
  // (a lit district's rooms: .97 of them lit (three in a hundred are dark), each at .9 to 1 of its light (mean
  // .95): .9215 lit, .0785 deep; a lit floor's own mean is .8475 of its colour (its pattern .98, the shade at the
  // walls' feet .92, the floor's level .94): .9215 x .8475 = .781 of the district's mean colour; its lamps' pools:
  // one lamp to about 90 m2 of room, its pool's reach about 9 m2 with the wave's fronts counted in: a tenth of warm
  // light on the lit share: .092. A lane's mean: its pale cool blue x .8475 x .6, and its lamps: (.31, .34, .45).)
  vec3 DEEP = vec3(.05, .075, .21), TOPF = vec3(.085, .115, .28), LANE = vec3(.31, .34, .45), dM = distMean(tnD);
  vec3 offT = ${SH_ROOM} * mix(DEEP, distCol(tnD), .16) + ${SH_COR} * LANE * .25 + ${SH_TOP} * TOPF;
  vec3 cellT = mix(offT, ${SH_ROOM} * (DEEP * .0785 + dM * .781 * (.85 + .3 * c2) + LAMPW * .092 * lampF) + ${SH_COR} * LANE + ${SH_TOP} * TOPF, hc);
  // (a district's own middle: the districts lie between the avenues, a cell on from the plan's own lines of four;
  // after hours one tile in nine stays lit: .111)
  vec2 dcc = (floor((cg - 1.) / 4.) + .5) * 104. + 26. + uOrg;
  vec3 distT = mix(offT, ${SH_ROOM} * (DEEP * .0785 + dM * .781 + LAMPW * .092) + ${SH_COR} * LANE + ${SH_TOP} * TOPF, mix(.111, 1., hoursAt(dcc, .5)));
  vec3 field = mix(cellT, distT, smoothstep(22., 80., fw));
  // THE AVENUES FAR OFF: ribbons 26 m broad (the floor and its two lit walls' tops), one to every 104 m each way.
  // Each way's own mean, once a pixel reaches further than the plan's period: 26 / 104 = .25; both ways together (a
  // place lies on either): 1 - .75 x .75 = .4375. The ribbon's own tone is its near look's mean, summed over one
  // period of its length: its floor (.93, .84, .66) x .94 x .975 (the shade at the walls' feet); the beads (.007 of
  // it toward white); the walls' lamps (their pools .112 of it: .056 toward the lamps' light and .013 of it added);
  // the standards' pools (.35 of it: .157 toward the lamps' light and .035 of it added); the trees' beds (.095 of
  // it, deep green): (.84, .76, .57) on 23.6 of the 26 m, the lit tops (.72, .67, .56) on 2.4: (.829, .751, .57);
  // the wave over it by the near look's own law, at the wave's own mean (.15) from far. Toward the core the avenues
  // stand brighter (by .6 at its foot, falling over 300 m). A stretch that has given way (AVE_OFF) is no ribbon.
  vec2 av = abs(mod(p - uOrg - 26. + 52., 104.) - 52.), lnI = floor(cg + .5);
  vec2 avOn = step(5., vec2(hbW(vec2(lnI.x, ci2.y)), hbN(vec2(ci2.x, lnI.y))));
  vec2 avs = max(vec2(seg(av.x, -13., 13., a.x), seg(av.y, -13., 13., a.y)) * avOn, .25 * smoothstep(40., 104., a));
  float avc = 1. - (1. - avs.x) * (1. - avs.y), avw = mix(waveHump(p.x + p.y), .15, smoothstep(20., 60., fw));
  float toCore = 1. + .6 * exp(-length(p - CORE) / 300.);
  field = mix(field, mix(vec3(.829, .751, .57) * (1. + .14 * avw), vec3(.95, .93, .86), .3 * avw) * min(toCore, 1.25) * mix(.25, 1., hoursAt(p, 0.)), avc);
  float far = smoothstep(9., 28., fw);
  // the walls' tops: deep blue, never black, with a breath of the lit room beside them; along the edge of a top
  // that looks into a lit room a fine pale line (every form reads by a lit edge); an avenue's two tops stand in its
  // light
  float rim = (1. - smoothstep(.16, .22 + fw, max(-min(dw.x, dw.y), 0.))) * (1. - smoothstep(.4, 1.4, fw)) * (1. - solid);
  vec3 topC = mix(vec3(.085, .115, .28), fc * .5 + .1, .2 * Lr * (1. - solid));
  topC = mix(topC, WALLW * .72, rim * Lr);
  topC = mix(topC, vec3(.72, .67, .56), ave * Lr * (1. - solid));
  col = mix(mix(col, topC, cov), field, far);
  col = mix(col, TOPF, hard * far);
  emis *= 1. - cov;
  float barL = 0.;
  if (lid > .5 && apron < .5) {
    // THE GLASS ROOFS (round eleven): the rooms beneath are seen through the panes, a deep cool sheen over them; THE
    // BARS, 0.24 m broad, every 3 m both ways in the boulevard's own measure, pale in the light from below; along
    // the boulevard's edge A STONE COPING 0.9 m broad with A LINE OF WARM LIGHT behind it; a pale kerb at the
    // roofs' outer edge
    vec2 bj = 1.5 - abs(fract(sn / 3.) - .5) * 3.;
    float jw = max(fw, .03), bars = max(clamp((.12 - bj.x) / jw + .5, 0., 1.), clamp((.12 - bj.y) / jw + .5, 0., 1.)) * clamp(.24 / jw, 0., 1.);
    float cope = 1. - smoothstep(.9 - jw, .9 + jw, bd), kerbL = smoothstep(${(BLVD.lid - 0.5).toFixed(1)} - jw, ${(BLVD.lid - 0.5).toFixed(1)} + jw, bd) * clamp(.5 / jw, 0., 1.);
    float lineL = (1. - smoothstep(.14, .14 + jw, abs(bd - 1.15))) * clamp(.3 / jw, 0., 1.);
    col = mix(col, vec3(.26, .36, .64), .36 - .16 * far);
    col = mix(col, vec3(.8, .83, .9), max(bars * (1. - far), kerbL));
    col = mix(col, vec3(.8, .78, .74), cope);
    emis = emis * (1. - max(bars, cope)) + vec3(1., .84, .56) * 1.6 * lineL * near1;
    col = mix(col, vec3(.98, .86, .6), .8 * lineL);
    barL = max(max(bars, cope), lineL);
  }
  if (apron > .5) {
    // a tower's terrace (see above)
    vec2 tj = (.5 - abs(fract(p / 3.) - .5)) * 3.;
    float jt = max(clamp((.03 - tj.x) / a.x + .5, 0., 1.) * clamp(.06 / a.x, 0., 1.), clamp((.03 - tj.y) / a.y + .5, 0., 1.) * clamp(.06 / a.y, 0., 1.));
    float kerbA = (1. - smoothstep(.6 - fw, .6 + fw, apE)) * clamp(1.2 / fw, 0., 1.);
    float dl = (fract(apAl / 9.) - .5) * 9., d2 = dl * dl + (apE - 1.5) * (apE - 1.5), rg = max(1.6, .8 * fw);
    col = mix(vec3(.46, .5, .64) * (1. - .16 * jt), vec3(.8, .82, .9), kerbA);
    col = mix(col, LAMPW * .95, .6 * exp(-d2 / (rg * rg)) * min(1.6 / rg, 1.));
    emis = vec3(1., .86, .6) * 2.2 * exp(-d2 / .1) * near1;
  }
  // EVERY TOWER STANDS IN A POOL OF ITS OWN LIGHT (round nine): the ground round its foot, floors, walls and tops,
  // stands in a light that falls away over a few tens of metres: cool white; AT THE HERO AND AT TOWER B WARM (round
  // ten: the glow of their lit storeys and doorways spilling on the ground), and reaching half as far again
  vec3 tpc = vec3(0.);
  float tpk = 0.;
  for (int k = 0; k < 17; k++) {
    if (uTow[k].z <= 0.) continue;
    vec2 r2 = abs(p - uTow[k].xy) - uTow[k].z;
    float dT = max(max(r2.x, r2.y), 0.), eT = exp(-dT / (k < 2 ? 12. + .36 * uTow[k].z : 9. + .3 * uTow[k].z));
    tpc = max(tpc, (k < 2 ? vec3(.5, .4, .24) : vec3(.3, .36, .5)) * eT);
    tpk = max(tpk, eT);
  }
  // (on glass and on a terrace's own paving the pool lies at a part: neither bleaches)
  col = min(col + tpc * (1. - .6 * max(lid, apron)), max(col, vec3(.93)));
  // THE GREAT HALL'S AIR (round nine): see nightAir
  float dist = length(vW - cameraPosition);
  // (round eleven: the low sheet of haze lies behind a tower's terrace and its pool of light, never across them)
  col = nightAirK(mix(lit3(col) + emis, linW, wm * (1. - cov)), cameraPosition, vW - cameraPosition, 1. - max(apron, smoothstep(.25, .8, tpk)));
  gl_FragColor = vec4(col, 1.);
  // the depth of the place met, a little behind it (the floor hides nothing; what stands on it must show)
  vec3 dp = cov > .5 || barL > .5 ? vW : q + d * (.5 + .015 * dist);
  vec4 cp = projectionMatrix * viewMatrix * vec4(dp, 1.);
  gl_FragDepth = clamp(cp.z / max(cp.w, 1e-4) * .5 + .5, 0., 1.);
  if (hole > .5) discard;
}`;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
// a colour as written (not as linear light), for shades that are named as the eye reads them
const hex3 = (h) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
// (the same curve as GLSL_LIT, for colours set from here; BROUGHT IN: its five numbers, see the head)
const litD = (d) => {
  const s = Math.pow(Math.min(Math.max(d, 0), 0.9), 2.2), A = 1 - 0.983729 * s, B = 0.0245786 - 0.432951 * s, C = 0.000090537 + 0.238081 * s;
  return 0.663 * (-B + Math.sqrt(Math.max(B * B + 4 * A * C, 0))) / (2 * A);
};
const shade = (h) => { const v = hex3(h); return new THREE.Vector3(litD(v.x), litD(v.y), litD(v.z)); };
// THE GREAT HALL'S AIR as a colour (round nine): the haze's own (NIGHT_HAZE): what lies beyond the camera's far
// reach, between the field of light and the slab, is this
const shade3 = (r, g, b) => new THREE.Vector3(litD(r), litD(g), litD(b));
export const FOG_ABOVE = { color: shade3(0.38, 0.5, 0.92), k: 1 / 1700 };
// the floors' deep clear colours: (the first, a clear yellow, is laid on no floor and lit in no storey since round
// seven: no orange, amber or mustard stands anywhere), turquoise, cobalt, coral (a rose coral), plum, a deeper
// turquoise, a deeper cobalt, white
const FLOORS = ['#f1c530', '#18a8a4', '#2a55c8', '#ee6666', '#84449a', '#0e8e9e', '#2342ae', '#f3e6cc'];
export function makeRoofUniforms(seed, maze) {
  const tex = new THREE.DataTexture(maze.data, maze.N, maze.N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return {
    uTime: { value: 0 }, tMaze: { value: tex }, uOrg: { value: new THREE.Vector2(P.MAZE_X0, P.MAZE_Z0) },
    uPal: { value: FLOORS.map(hex3) }, uFog: { value: FOG_ABOVE.color }, uFogK: { value: FOG_ABOVE.k },
    // (the sector that is after hours: its middle's bearing at the clock's nought, its turn in radians a second)
    uAfter: { value: (() => { const r = makeRng(hashSeed('fww-after:' + seed)); return new THREE.Vector3(r.range(0, Math.PI * 2), (r.chance(0.5) ? 1 : -1) * Math.PI * 2 / 240, 0.8727); })() },
  };
}
export function makeRoofMaterial(uniforms) {
  return new THREE.ShaderMaterial({ uniforms, vertexShader: ROOF_VERT, fragmentShader: ROOF_FRAG });
}

// ---------------------------------------------------------------- the ceiling of light, plain white and the core
// OVERHEAD (round nine): THE SLAB. A plane at y 96: A FLAT DARK SLAB, deep blue-violet, never black (#141a3c overhead,
// a little lighter toward its far rim), and set into it THE WEAVE OF LIGHT (round eleven c: see GLSL_SLAB) that runs
// to the horizon on every side and converges there. No vault of light, no glow of a sky, no blazing rim.
// ROUND ELEVEN: THE CEILING IS BUILT. THE SLAB HAS RIBS AND BEAMS, drawn as relief by the eye's own ray (what hangs
// under the slab is met first): A RIB 2 m broad hangs 1.2 m under the slab along every joint of its panels (24 m
// both ways), so that EVERY BAR OF LIGHT LIES IN A COFFER; A GREAT BEAM 6 m broad hangs 3 m under it through every great
// tower's axis both ways, to the horizon: the towers stand at the crossings of the beams. A soffit is a shade
// lighter than the coffer's face; a flank that looks toward the hero is lit, one that looks away is shaded.
// EVERY GREAT TOWER MEETS THE SLAB IN A CAPITAL (a built body: see capitalsGeo): here its lit rim lies on the slab
// as a line of light round the capital's head and a glow about it (the hero's warm); the slab's own lights stand
// brighter there. No ring hovers.
const CAP_FLARE = (w) => 6 + 0.35 * w;
const CEIL_FRAG = /* glsl */`
varying vec3 vW;
uniform vec4 uTow[17], uTop[17];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_SLAB}
// a band hw broad either side of the line x0, hanging under the slab: c1 the place on the slab across it, c0 where
// the eye's ray passed its soffit's level, aw the pixel's reach. x: how much of its soffit is seen; y: of a flank;
// z: the way that flank looks (-1 or 1)
vec3 beamAt(float c1, float c0, float x0, float hw, float aw){
  float e0 = c0 - x0, sgn = e0 > 0. ? 1. : -1., sof = clamp((hw - abs(e0)) / aw + .5, 0., 1.);
  return vec3(sof, clamp(-(c1 - x0 - sgn * hw) * sgn / aw + .5, 0., 1.) * (1. - sof), sgn);
}
// (the same for the bands along every line of the period pd: the soffit of the line nearest c0, the flank of the
// next band on the ray's way)
vec3 ribsAt(float c1, float c0, float pd, float hw, float aw){
  float k0 = floor(c0 / pd + .5) * pd, e0 = c0 - k0;
  float kc = c1 >= c0 ? (e0 > 0. ? k0 + pd : k0) : (e0 < 0. ? k0 - pd : k0);
  vec3 a = beamAt(c1, c0, k0, hw, aw), b = beamAt(c1, c0, kc, hw, aw);
  return vec3(a.x, b.y * (1. - a.x), b.z);
}
void main(){
  vec3 v = vW - cameraPosition;
  float dist = length(v);
  vec2 p = vW.xz, fp = max(abs(dFdx(p)) + abs(dFdy(p)), vec2(.02));
  vec2 sl = slabLights(p, dFdx(p), dFdy(p));
  vec3 base = mix(SLAB_NEAR, SLAB_FAR, smoothstep(200., 3200., dist)), col = base;
  // (the glow about the bars, on their coffers: the slab's blue)
  col += SLAB_BLUE * sl.y;
  // THE CAPITALS' RIMS (uTop: each great tower's last storey: its middle and its two half widths; a place of the list
  // that holds no great tower has widths under nought)
  float ring = 0.;
  vec3 rimC = vec3(0.);
  float er = max(max(fp.x, fp.y), .05);
  for (int k = 0; k < 17; k++) {
    if (uTop[k].z > 0.) {
      // (the capital's flare: see CAP_FLARE)
      float F = 6. + .35 * min(uTop[k].z, uTop[k].w);
      vec2 q = abs(p - uTop[k].xy) - uTop[k].zw - F;
      float dr = length(max(q, 0.)) + min(max(q.x, q.y), 0.), g = exp(-max(dr, 0.) / (7. + .4 * F));
      float line = clamp((.9 - abs(dr - .9)) / er + .5, 0., 1.) * clamp(1.8 / er, 0., 1.);
      rimC += (k == 0 ? vec3(1., .88, .66) : vec3(.8, .88, 1.)) * (.42 * g + 2.2 * line);
      ring = max(ring, g);
    }
  }
  // the bars' own faces: cool white (brighter about a capital)
  col += SLAB_LIGHT * sl.x * (1. + 1.2 * ring);
  // THE RIBS AND THE BEAMS
  vec2 vd = v.xz / max(v.y, .02), pr = p - vd * 1.2, pb = p - vd * 3., fr = fp + abs(vd) * .02;
  vec3 rx = ribsAt(p.x, pr.x, 24., 1., fr.x), rz = ribsAt(p.y, pr.y, 24., 1., fr.y);
  // (far off a pixel reaches over many ribs: their own mean: the soffits a twelfth each way, the flanks what the
  // slope of the eye's ray lays bare of them, at most the coffer's own breadth)
  vec2 farR = smoothstep(6., 16., fr), slope = min(abs(vd) * 1.2, vec2(22.)) / 24.;
  rx = mix(rx, vec3(1. / 12., slope.x * (11. / 12.), rx.z), farR.x); rz = mix(rz, vec3(1. / 12., slope.y * (11. / 12.), rz.z), farR.y);
  vec3 L = vec3(${P.CORE.x.toFixed(1)} - p.x, 0., ${P.CORE.z.toFixed(1)} - p.y) / max(length(vec2(${P.CORE.x.toFixed(1)}, ${P.CORE.z.toFixed(1)}) - p), 1.);
  vec3 SOF = base * 1.7 + vec3(.012, .016, .03), LITF = base * 2.5 + vec3(.03, .035, .05), DIMF = base * .5;
  float sofR = max(rx.x, rz.x), flR = max(rx.y, rz.y) * (1. - sofR);
  vec3 flC = rx.y > rz.y ? mix(DIMF, LITF, .5 + .5 * rx.z * L.x) : mix(DIMF, LITF, .5 + .5 * rz.z * L.z);
  col = mix(mix(col, flC, flR), SOF, sofR);
  for (int k = 0; k < 17; k++) {
    if (uTop[k].z > 0.) {
      vec3 bx = beamAt(p.x, pb.x, uTop[k].x, 3., fr.x), bz = beamAt(p.y, pb.y, uTop[k].y, 3., fr.y);
      float sofB = max(bx.x, bz.x), flB = max(bx.y, bz.y) * (1. - sofB);
      vec3 fbC = bx.y > bz.y ? mix(DIMF, LITF, .5 + .5 * bx.z * L.x) : mix(DIMF, LITF, .5 + .5 * bz.z * L.z);
      col = mix(mix(col, fbC, flB), SOF * 1.12, sofB);
    }
  }
  col += rimC;
  gl_FragColor = vec4(nightAir(col, cameraPosition, v), 1.);
}`;
// THE CAPITALS (round eleven): EVERY GREAT TOWER MEETS THE SLAB IN A FLARED HEAD, like a column's: from the faces of
// its last storey, 0.9 of the flare's breadth under the slab, four sloping sides run out and up to the slab; the
// flare is 6 m and 0.35 of the storey's lesser half width (the hero's: 15.5 m: its rim 85 m across). ITS RIM IS
// THE RING OF LIGHT. uv: x metres along the side from its middle, y from the storey's face (0) to the rim (1);
// color.x: 1 on the hero (its light is warm).
function capitalsGeo(towers) {
  const pos = [], nor = [], uv = [], col = [];
  towers.forEach((T, k) => {
    if (!T.great) return;
    const b = T.pile.filter((q) => !q.plate).pop(), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, wx = (b.x1 - b.x0) / 2, wz = (b.z1 - b.z0) / 2;
    const F = CAP_FLARE(Math.min(wx, wz)), y0 = P.SLAB - 0.9 * F, y1 = P.SLAB - 0.03, sl = Math.SQRT1_2;
    // (the side that looks toward (nx, nz): its lower edge on the storey's face, its upper at the rim)
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = -nz, tz = nx, w = nx ? wz : wx, d = nx ? wx : wz;
      const at = (a, out, y) => [cx + nx * (d + out) + tx * a, y, cz + nz * (d + out) + tz * a];
      const A = at(-w, 0, y0), B = at(w, 0, y0), C = at(w + F, F, y1), D = at(-w - F, F, y1), n = [nx * sl, -sl, nz * sl];
      for (const [q, u, vv] of [[A, -w, 0], [B, w, 0], [C, w + F, 1], [A, -w, 0], [C, w + F, 1], [D, -w - F, 1]]) { pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); uv.push(u, vv); col.push(k === 0 ? 1 : 0, F, 0); }
    }
  });
  const g = geoOf(pos, nor);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const CAP_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vW; varying vec2 vUv; varying vec3 vCol;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vUv = uv; vCol = color;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// A CAPITAL'S LOOK: pale stone lit from below by its own tower, brighter toward its rim; fins every 4 m run up its
// sides (a fine shaded line each); two mouldings round it, a third and two thirds of the way up; ITS RIM A BAND OF
// LIGHT (cool white; the hero's warm)
const CAP_FRAG = /* glsl */`
varying vec3 vW; varying vec2 vUv; varying vec3 vCol;
${GLSL_LIT}${GLSL_NIGHT}
void main(){
  float v = vUv.y, fu = max(fwidth(vUv.x), .02), fv = max(fwidth(v), .002);
  vec3 tone = mix(vec3(.86, .9, 1.), vec3(1., .9, .72), vCol.x);
  float fin = (1. - smoothstep(.1, .1 + fu, 2. - abs(fract(vUv.x / 4.) - .5) * 4.)) * clamp(.3 / fu, 0., 1.);
  float mould = max(1. - smoothstep(.012, .012 + fv, abs(v - .34)), 1. - smoothstep(.012, .012 + fv, abs(v - .67))) * clamp(.03 / fv, 0., 1.);
  vec3 col = tone * mix(.3, .78, v * v) * (1. - .3 * fin) * (1. - .28 * mould);
  float rim = smoothstep(.925, .95, v);
  gl_FragColor = vec4(nightAir(lit3(min(col, vec3(.9))) + tone * 2.1 * rim, cameraPosition, vW - cameraPosition), 1.);
}`;
// plain white in the even light of the ceiling: tops brightest, sides by the way they face, a shade toward the floor
const WHITE_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const WHITE_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN;
uniform vec3 uFog; uniform float uFogK; uniform vec4 uTow[17];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_FIELD}
void main(){
  vec3 emis = vec3(0.);
  // (round nine) IN THE NIGHT-LIKE HALL a white body takes the glow of the field of light below it: its sides a
  // clear blue-grey, brighter toward their foot; its top deep blue under the slab. No key light, no long shade.
  vec3 side = vec3(.19, .25, .5) * mix(1.2, .82, smoothstep(0., 14., vW.y));
  // (round ten: a top has a seen tone: a blue-grey stone, never a dark blank)
  vec3 col = mix(side, vec3(.17, .215, .42), smoothstep(.3, .7, vN.y));
  #ifndef WELL
  if (abs(vN.y) < .5 && vW.y > ${P.ROOF.toFixed(1)}) {
    // (round ten) A WHITE WALL THAT STANDS OVER THE MAZE'S SHEET IS NO DARK BLANK FACE: it carries WARM LAMPS, one
    // every 9 m along it, 2 m under its top (hall two's and the concourse's walls; the link's and the corridor's
    // lower ones by their own heights), a scallop of warm light falling down the face under each
    // (round eleven: hall two's faces, which the line passes close by at the boulevard's head, carry a lamp every
    // 4.5 m, each with a broader scallop, and a pale coping along their top)
    // (EACH LAMP IS A SLIM UPRIGHT BAR OF WARM LIGHT, 0.16 m broad and 1 m high: its sides fade from 0.06 to 0.10 m
    // from its middle line, its ends from 0.48 to 0.52 m from its middle)
    bool h2w = vW.z < -220.5;
    float sp9 = h2w ? 4.5 : 9., s = abs(vN.x) > .5 ? vW.z : vW.x, dl = (fract(s / sp9) - .5) * sp9;
    // (round eleven: hall two's south face stands at z -220.8: it takes the hall's own lamps, not the link's lower
    // ones, which left its upper 5 m a dark blank face beside the boulevard's head)
    float dyl = (vW.z < -220.5 ? 11.3 : vW.z <= ${(P.H1.z0 + 2).toFixed(1)} ? 8.2 : 7.4) - vW.y, wv = (h2w ? 1.5 : 1.) + .6 * max(dyl, 0.);
    float fl = max(max(fwidth(s), fwidth(vW.y)), 1e-3);
    float scal = exp(-dl * dl / (wv * wv)) * exp(-max(dyl, 0.) / 3.6) * step(-.25, dyl);
    float lamp = (1. - smoothstep(.06, .10, abs(dl))) * (1. - smoothstep(.48, .52, abs(dyl))) * clamp(.4 / fl, 0., 1.);
    col = mix(col, vec3(.95, .8, .56), .8 * scal);
    if (h2w) col = mix(col, vec3(.4, .45, .66), 1. - smoothstep(-1.9, -1.9 + fl, dyl));
    emis = vec3(1., .86, .58) * 1.4 * lamp;
  }
  #endif
  #ifdef ROOF
  // A ROOF'S TOP: paved in stone, deep blue under the slab, WITH GLOWING SKYLIGHTS, the lights' one law running over
  // them: strips every 9 m on hall two; over the lobby a slot over every bar of its ceiling's weave, on that
  // ceiling's lattice of 6 m; over the corridor and the link slots in the same weave in two files of cells, 1.5 m
  // and 3 m, numbered along the line's own metres as below (the run's metre at a z north of the corridor's mouth
  // is RUNZ less z). (Round eleven f: the corridor's, the link's and hall two's ceilings carry no light under
  // them: those skylights are the roof's own.) Each lays a soft pale glow on the roof beside it. Fine joints
  // every 9 m.
  if (vN.y > .5 && vW.y < ${(P.LOBBY.roof + 0.1).toFixed(1)}) {
    vec2 p = vW.xz, fwp = max(fwidth(p), vec2(.02));
    bool h2 = p.y < -222., lk = p.y <= ${(P.H1.z0 + 2).toFixed(1)} && p.y >= -222., lb = vW.y > ${(P.LOBBY.roof - 0.5).toFixed(1)};
    float ds, fs = max(fwp.x, fwp.y);
    if (h2) { ds = abs(mod(p.x + 63.5 + 4.5, 9.) - 4.5); fs = fwp.x; }
    else {
      // (the bar's own cell: its breadth cw, its two numbers ci, the place from its middle r; then the metres to the
      // bar's edge, a sixth of the cell wide and two thirds long, less .45: the slot's glass is that bar)
      float cw; vec2 ci, r;
      if (lb) { cw = 6.; ci = floor((p - vec2(${P.LOBBY.x0.toFixed(1)}, ${P.LOBBY.z0.toFixed(1)})) / cw); r = p - vec2(${P.LOBBY.x0.toFixed(1)}, ${P.LOBBY.z0.toFixed(1)}) - (ci + .5) * cw; }
      else {
        cw = lk ? ${(2 * CEIL_FILES.link).toFixed(1)} : ${(2 * CEIL_FILES.corridor).toFixed(1)};
        float al = ${(H_MOUTH + P.LOBBY.z0).toFixed(3)} - p.y, ac = p.x - (${AXIS_X.toFixed(1)});
        ci = vec2(floor(al / cw), step(0., ac)); r = vec2(al - (ci.x + .5) * cw, abs(ac) - .5 * cw);
      }
      vec2 qb = abs(mod(ci.x + ci.y, 2.) < .5 ? r : r.yx) - vec2(cw * ${(WEAVE.long / 2).toFixed(5)}, cw * ${(WEAVE.wide / 2).toFixed(5)});
      ds = length(max(qb, 0.)) + min(max(qb.x, qb.y), 0.) + .45;
    }
    float strip = clamp((.45 - ds) / fs + .5, 0., 1.) * clamp(.9 / fs, 0., 1.);
    float kerb = clamp((.62 - ds) / fs + .5, 0., 1.) * clamp(1.24 / fs, 0., 1.) - strip;
    vec2 jd = abs(mod(p + vec2(68., 150.) + 4.5, 9.) - 4.5);
    float joint = max(clamp((.05 - jd.x) / fwp.x + .5, 0., 1.) * clamp(.1 / fwp.x, 0., 1.), clamp((.05 - jd.y) / fwp.y + .5, 0., 1.) * clamp(.1 / fwp.y, 0., 1.)) * (h2 ? 1. : 0.);
    float kr = waveHump(p.x + p.y);
    float halo = exp(-max(ds - .45, 0.) / 1.8) * clamp(3. / fs, 0., 1.);
    vec2 tj = (.5 - abs(fract(p / 1.5) - .5)) * 1.5;
    float jt = max(clamp((.025 - tj.x) / fwp.x + .5, 0., 1.) * clamp(.05 / fwp.x, 0., 1.), clamp((.025 - tj.y) / fwp.y + .5, 0., 1.) * clamp(.05 / fwp.y, 0., 1.));
    // (round ten: A ROOF'S TOP HAS A SEEN TONE: a blue-grey stone, lit warm beside every skylight over 3 m and more;
    // hall two's skylights are glazed: a fine dark bar across each strip every 3 m)
    float bar = h2 ? clamp((.07 - abs(fract(p.y / 3.) - .5) * 3.) / fwp.y + .5, 0., 1.) * clamp(.14 / fwp.y, 0., 1.) : 0.;
    halo = exp(-max(ds - .45, 0.) / 2.8) * clamp(3. / fs, .35, 1.);
    col = vec3(.2, .25, .46) * (1. - .2 * joint) * (1. - .18 * jt) * (1. + .5 * kerb) + vec3(.36, .31, .2) * halo * (.5 + .5 * kr);
    col = mix(col, vec3(.97, .95, .88) * (1. - .55 * bar), strip);
    emis = vec3(1., .96, .86) * (.5 + 1.3 * kr) * strip * (1. - .7 * bar);
  }
  #endif
  #ifdef WELL
  {
    // THE WELL: white, lit from the bright hall below; ITS INNER FACE IS LINED WITH SLIM UPRIGHT BARS OF WARM LIGHT,
    // sixty-four round it, each the white walls' own lamp (0.16 m broad and 1 m high, its sides fading from 0.06 to
    // 0.10 m, its ends from 0.48 to 0.52 m), its middle 1.2 m under the ring's top, a scallop of warm light falling
    // down the face under each; its columns plain and slim.
    // (round nine: the reveal is the oculus' bright rim against the dark slab; the ring's outer face over the roof
    // stands in the night-like hall)
    vec2 oc = vW.xz - vec2(${P.OC.x.toFixed(1)}, ${P.OC.z.toFixed(1)});
    float inward = step(dot(vN.xz, oc), -.01) * step(abs(vN.y), .5) * step(${(P.WELL.foot - 0.05).toFixed(2)}, vW.y);
    float ang = atan(oc.y, oc.x), dxl = (fract(ang * 64. / 6.2831853) - .5) * 6.2831853 * ${P.WELL.r.toFixed(1)} / 64., dyl = ${(P.WELL.top - 1.2).toFixed(1)} - vW.y;
    float lamp = (1. - smoothstep(.06, .10, abs(dxl))) * (1. - smoothstep(.48, .52, abs(dyl))), wv = .5 + .4 * max(dyl, 0.);
    float scal = exp(-dxl * dxl / (wv * wv)) * exp(-max(dyl, 0.) / 2.4) * step(-.3, dyl);
    vec3 plain = vec3(.86, .87, .9) * (.84 + .16 * smoothstep(-6., 12., vW.y)) * (.93 + .07 * dot(normalize(vN.xz + vec2(1e-4)), vec2(.8, .6)));
    if (vN.y < -.5) plain *= .82;
    if (vW.y < 13.4 || inward > .5) col = mix(plain, vec3(1., .9, .68), .75 * scal * inward);
    emis = vec3(1., .86, .58) * 1.5 * lamp * inward;
  }
  #endif
  gl_FragColor = vec4(nightAir(lit3(col) + emis, cameraPosition, vW - cameraPosition), 1.);
}`;
// A TOWER'S LOOK (round nine), IN THE NIGHT-LIKE HALL: the plates deep blue, each with a fine pale arris along its top
// and the glow of the storey under it on its under side; the storeys glass walls behind which rooms stand LIT in the
// storey's own colour (each bay a room along the eye's own ray: its floor, its pale ceiling with two slots of
// light, its back wall; one bay in eleven dark, each a shade brighter or dimmer by its own draw), dark slim posts
// against the light, a dark upstand at the foot; far off a storey melts into its own mean: A BAND OF LIT ROOMS. A
// great tower's head is one with the slab's bright collar. The lifts: dark glass shafts, a lit car in each.
const TOWER_VERT = /* glsl */`
attribute vec4 aT, aU;
varying vec3 vW; varying vec3 vN; varying vec4 vT; varying vec4 vU;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = normal; vT = aT; vU = aU;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const TOWER_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec4 vT; varying vec4 vU;
uniform float uTime, uFogK; uniform vec4 uCar[40]; uniform vec3 uCarLight, uWarm, uFog; uniform vec3 uPal[8];
${GLSL_LIT}${GLSL_NIGHT}
// (a draw between 0 and 1 from a bay's own numbers)
float hT(vec2 p){ return fract(sin(dot(p, vec2(27.619, 57.583))) * 24634.6345 + cos(dot(p, vec2(41.233, 13.171))) * 7919.137); }
void main(){
  float y = vW.y, fy = max(fwidth(y), .02), kind = vT.x;
  vec3 dv = normalize(vW - cameraPosition);
  vec2 n2 = normalize(vN.xz + vec2(1e-5, 0.)), dq = vW.xz - cameraPosition.xz, dvn = dq / max(length(dq), 1e-3);
  float up = abs(vN.y);
  vec3 SH = vec3(.13, .18, .4) * mix(1.2, .9, smoothstep(0., 70., y)), EDGE = vec3(.6, .68, .95), col = vec3(0.), lin3;
  if (kind < -.5) {
    // the great doorway: its back wall (the lit car, panel joints every 4 m), its warm frame, its room (brighter
    // toward the back wall, joints every 4 m of its depth)
    // (round eight: the back wall is a wall of warm white-gold light in panels of 5 m, a little under the ring's own
    // brightness; the room's floor, ceiling and sides deepen toward the mouth; THE REVEAL IS WHITE: its faces that
    // look into the opening are lit by the doorway, its front stands pale in the tower's shade, warm along the
    // opening's edge)
    vec2 pj = abs(fract(vec2(y, vW.z) / 5.) - .5) * 5.;
    // (round nine: THE EXPOSURE IS HELD: the back wall is brightest round the ring and falls to a warm mid tone toward
    // its corners (vU.x: metres across from its middle), its panel joints plain; the ring stands in the brightest place)
    float rb = length(vec2(vU.x, y - ${P.RING_Y.toFixed(1)}));
    // (round ten; round eleven c: a porch's lit soffit: warm, in panels of 3 m, ONE SLIM BAR OF LIGHT in the middle of
    // each, 1.8 m long and 0.12 m broad, along in one panel and across in the next: no round light on a soffit)
    vec2 sg3 = (fract(vW.xz / 3.) - .5) * 3., sgi = floor(vW.xz / 3.), sgb = abs(mod(sgi.x + sgi.y, 2.) < .5 ? sg3 : sg3.yx) - vec2(.9, .06);
    float sfw = max(fwidth(vW.x) + fwidth(vW.z), .02), sdl = 1. - smoothstep(0., sfw, max(sgb.x, sgb.y)), sjn = 1. - smoothstep(.04, .04 + sfw, 1.5 - max(abs(sg3.x), abs(sg3.y)));
    if (kind < -3.5) lin3 = lit3(vec3(.84, .76, .62) * (1. - .14 * sjn * clamp(.2 / sfw, 0., 1.))) + vec3(1., .88, .62) * 1.6 * sdl * clamp(.6 / sfw, .25, 1.);
    else if (kind < -2.5) lin3 = lit3(mix(vec3(.6, .5, .4), vec3(.9, .85, .72), exp(-rb * rb / 190.))) * (1. - .22 * smoothstep(2.4, 2.47, max(pj.x, pj.y)));
    else if (kind < -1.5) lin3 = mix(lit3(mix(vec3(.34, .4, .64), vec3(1., .93, .78), smoothstep(.35, 1., vU.y))), uWarm * 1.08, step(.5, vU.x));
    else lin3 = uWarm * (.5 + .42 * vU.x) * (1. - .2 * smoothstep(1.9, 1.97, abs(fract(vU.x * 3.) - .5) * 4.));
  } else if (kind < .5) {
    // a floor plate
    // (round nine: its top deep blue under the slab; its edges a clear blue-grey with a fine pale arris along the
    // top; ITS UNDER SIDE TAKES THE GLOW OF THE STOREY UNDER IT, in that storey's colour)
    float top = vU.y + vU.z - y;
    vec3 under = mix(vec3(.3, .4, .72), mix(uPal[int(vT.y + .5)], vec3(1.), .3), .7);
    col = vN.y > .5 ? vec3(.1, .135, .32) : vN.y < -.5 ? under : SH * 1.2;
    if (up < .5) col = mix(col, EDGE, .8 * (1. - smoothstep(.2, .3 + fy, top)) * clamp(.5 / fy, 0., 1.));
    lin3 = lit3(col);
  } else if (kind < 1.5) {
    // a storey of rooms
    vec3 rc = uPal[int(vT.y + .5)];
    float H = vU.z, yy = y - vU.y, bw = vU.w, bi = floor(vU.x / bw), bx = abs(vU.x - (bi + .5) * bw), fu = max(fwidth(vU.x), .02);
    float cover = 1. - smoothstep(.6, 2.6, max(fy, fu));
    // (a storey taller than 13 m, a great doorway's own or a great tower's last, is drawn as two or three storeys
    // with a plate 2 m thick between each two, flush with the glass)
    float nS = max(floor(H / 9.5 + .5), 1.), hS = H / nS, sub = min(floor(yy / hS), nS - 1.), plateB = 0.;
    if (nS > 1.5) { yy -= sub * hS; H = hS - 2.; plateB = sub < nS - 1.5 ? smoothstep(H - fy, H + fy, yy) : 0.; yy = min(yy, H); }
    float into = max(-dot(dv.xz, n2), .08), tb = 7. / into, tv = dv.y > 0. ? (H - yy) / max(dv.y, 1e-3) : yy / max(-dv.y, 1e-3), t = min(tb, tv);
    float hy = clamp(yy + dv.y * t, 0., H), dep = into * t;
    // (each bay's own draw, from whole numbers only: the bay, the tower, the storey's foot, the way the face looks.
    // THE FOOT IS COUNTED IN QUARTER METRES, rounded to the nearest: every storey's foot in this world is a whole
    // number of quarter metres (the towers' are whole metres, the well's building's are 5.25 m apart), so the
    // rounding has an eighth of a metre to spare either way. Counted in whole metres, as it was, a foot at 10.5 or
    // 31.5 m fell to either side pixel by pixel, and that storey's bays flickered between two draws like static.)
    float draw = hT(vec2(bi + floor(vT.z + .5) * 17., floor(vU.y * 4. + .5) * .0925 + sub * 1.7 + floor(n2.x * 2. + .5) * 3. + floor(n2.y * 2. + .5) * 5.));
    // EVERY BAY HAS ITS OWN STATE (round eight), by that draw: lit in the storey's colour (each a shade brighter or
    // deeper), BRIGHTER, DIM, DARK, or OPEN AS A LOGGIA. A bay's state holds at any distance: no storey is one flat
    // coloured panel.
    // (round ten: A TOWER'S FOOT IS SEEN: its ground storey is its lit hall: no bay of it dark, dim or open, all of
    // it a shade over the storeys' own light)
    float gs = step(vU.y, .5);
    bool dark = draw < .09 && gs < .5, dim = !dark && draw < .23 && gs < .5, logg = draw >= .23 && draw < .33 && gs < .5, bright = draw >= .33 && draw < .48;
    float on = mix(dim ? .46 : bright ? 1.14 : .78 + .16 * fract(draw * 9.), bright ? 1.2 : .98 + .16 * fract(draw * 9.), gs);
    vec3 room = mix(rc, vec3(1., .95, .84), .34) * (.88 + .24 * hy / H);
    if (tv < tb) {
      if (dv.y > 0.) {
        // (its pale ceiling with two rows of light)
        float sl = min(abs(dep - 2.3), abs(dep - 4.9)), es = max(fwidth(dep), .03);
        room = mix(mix(vec3(.88, .9, .93), rc, .22), vec3(1.05, 1.03, .98), (1. - smoothstep(.22 - es, .22 + es, sl)) * clamp(.44 / es, 0., 1.));
      } else room = rc * (.82 + .26 * dep / 7.);
    }
    room *= on;
    vec3 mean = mix(rc, vec3(1., .95, .84), .3) * .92 * on;
    if (dark) { room = mix(vec3(.09, .14, .32), rc, .12); mean = room; }
    if (logg) {
      // A LOGGIA: the bay stands open to the air; its back wall, 3 m in, is lit warm from within; a rail at its edge;
      // on the plate's edge A TREE IN A TUB, or nothing and its back wall a shade warmer, by the bay's own draw.
      // (round eleven: the row of three small lamps is gone: from far off it stood in its bay as three pale specks)
      float lz = vU.x - (bi + .5) * bw, gk = fract(draw * 37.);
      vec3 back = mix(vec3(.8, .7, .52), rc, .3) * (.42 + .4 * yy / H);
      room = mix(back, vec3(.9, .9, .88), (1. - smoothstep(.05, .05 + fy, abs(yy - 2.))) * clamp(.1 / fy, 0., 1.) * .8);
      if (gk < .55) {
        float e = length(vec2(lz / min(1.45, .36 * bw), (yy - .56 * H) / (.27 * H))), leaf = 1. - smoothstep(.82, 1., e);
        vec3 green = vec3(.24, .5, .3) * (.8 + .3 * smoothstep(-1., 1., lz * (n2.y + n2.x)));
        room = mix(room, vec3(.36, .3, .26), (1. - smoothstep(.09, .09 + fu, abs(lz))) * step(1.5, yy) * step(yy, .5 * H));
        room = mix(room, vec3(.9, .88, .84), (1. - smoothstep(.5, .5 + fu, abs(lz))) * step(.9, yy) * step(yy, 1.6));
        room = mix(room, green, leaf);
        mean = mix(back, green, .4);
      } else {
        room = room * 1.3 + vec3(.05, .04, .015);
        mean = back * 1.3 + vec3(.05, .04, .015);
      }
    }
    // the slim posts between the bays (0.32 m), the floor edge under the storey (0.9 m) and the head over it (0.5 m):
    // dark against the lit rooms
    float post = clamp((bx - (.5 * bw - .16)) / fu + .5, 0., 1.) * clamp(.32 / fu, 0., 1.);
    float sill = 1. - smoothstep(.9 - fy, .9 + fy, yy), head = smoothstep(H - .5 - fy, H - .5 + fy, yy) * clamp(.5 / fy, 0., 1.);
    vec3 frameC = SH * 1.1;
    col = mix(mean, room, cover);
    col = mix(col, frameC, post);
    col = mix(col, frameC, max(max(sill, head) * (1. - smoothstep(1.2, 4., fy)), plateB));
    // (a lit room gives light: it glows in its own colour)
    lin3 = lit3(min(col, vec3(.97))) + rc * (gs > .5 ? .26 : bright ? .3 : dark || logg ? 0. : dim ? .03 : .14);
  } else {
    // a lift's glass shaft: two fine mullions, a landing's line at every 10 m; its car a lit box 7 m high, eased at
    // the head and the foot of its run
    int k = int(vT.y + .5);
    float u = vU.x, fu = max(fwidth(u), .004);
    col = vec3(.15, .2, .44) * (1. + .5 * (1. - smoothstep(.02, .02 + fu * 1.5, abs(abs(u) - .8)))) * (1. + .3 * (1. - smoothstep(.12, .12 + fy, abs(fract(y / 10. + .5) - .5) * 10.)));
    vec4 c = uCar[k];
    float yc = mix(c.z, c.w, .5 - .5 * cos(6.2831853 * (uTime / c.x + c.y)));
    float car = (1. - smoothstep(3.5 - fy, 3.5 + fy, abs(y - yc))) * (1. - smoothstep(.72 - fu, .72 + fu, abs(u)));
    // (the car: a lit box, A BRIGHT BEAD on the tower's face from far off)
    lin3 = mix(lit3(col), uCarLight * 1.4 * (1. - .22 * smoothstep(.55, .62, abs(fract((y - yc) / 3.) - .5) * 2.)), car) + uCarLight * .08 * exp(-max(abs(y - yc) - 3.5, 0.) / 5.) * (1. - car);
  }
  // (round eleven: a great tower's head stands in its capital: see capitalsGeo)
  // the air a tower stands in is the great hall's own (see nightAirK): THE LOW SHEET OF HAZE LIES BEHIND ITS FOOT,
  // never across it: a far tower's lowest storeys read as clearly as its upper ones
  gl_FragColor = vec4(nightAirK(lin3, cameraPosition, vW - cameraPosition, 0.), 1.);
}`;
const geoOf = (pos, nor, extra) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (extra) g.setAttribute('aCore', new THREE.Float32BufferAttribute(extra, 2));
  return g;
};
// each car's own period (38 to 70 s), its start in that period, and the foot and head of its run
export function coreDeal(seed, name = 'fww-core') {
  const r = makeRng(hashSeed(name + ':' + seed)), out = [];
  for (let k = 0; k < 20; k++) out.push(new THREE.Vector4(r.range(38, 70), r.range(0, 1), 6 + r.range(0, 8), 90 - r.range(0, 30)));
  return out;
}

// THE TOWERS OF THE FLOOR (round seven): EVERY TOWER IS THE MAZE PILED UP. A pile of white floor plates, square-
// cornered, each 2 m thick, and between every two plates a storey of rooms (8 m; the ground storey 8 or 12 m, or as
// high as its great doorway) lit in ONE of the floors' own colours. Each storey is a little larger or smaller than
// the one below or shifted against it by up to a fifth of the pile's width (the stream fww-pile deals it; the pile's
// middle never strays more than 0.14 of its width from its foot's); a plate lies under and over each storey, 1.5 to
// 3.5 m proud of both. NO DRUM, NO ROUND CORNER, NO AMBER. THE CORE AND TOWER B STAND BY PLACE; TWELVE MORE ARE
// DEALT on every seed (the stream fww-far; see TOWERS), each where its own draws first find ground that keeps the
// rules below (one for which the tries find none is not built). Two in three stand in the east quarter (the
// half-plane east of the street's mouth in the garden court's east wall, distances counted from that mouth), one
// in three in the west quarter (the half-plane west of the core's axis, counted from that axis). In each quarter
// the towers stand on a ladder of distances: ITS NEAR END IS THE LEAST DISTANCE AT WHICH THE SLIMMEST TOWER STANDS
// CLEAR OF EVERYTHING BUILT AND OF THE LINE (worked out: nearClear); ITS FAR END IS WHERE THE HAZE HAS TAKEN HALF
// OF A TOWER'S LIGHT (the air's own measure: FOG_ABOVE.k). A tower's half width lies between half the hero's and
// the hero's own (TOWERS.half: none broader than the hero); THE GREAT ONES (the core, tower B and every fifth of
// the dealt) reach the ceiling of light as the hero does; every other tower's top lies between a third and four
// fifths of the slab's height (TOWERS.top), so that no dealt tower tops the hero
// (the ceiling itself is at 96: a ladder of heights, each dealt among them). None stands within 120 m of the line
// (from its widest plate's corner), on anything that is built along the line (BUILT: the flown halls with their
// walls and what lies under a roof beside the line's first stretch: the one list the sheet reads), or within 110 m
// of another. Each: { x, z, r (half the width of its foot), h (its top), great, door, lifts, pile }; the first two are
// the core and tower B.
// (a storey's colour, as a place of the floors' list, and its share: cobalt, deeper cobalt, turquoise, deeper
// turquoise, coral, plum, white. NO YELLOW STOREY: behind glass against the light it would read as amber)
const STOREY_SHARE = [[2, 0.27], [6, 0.13], [1, 0.16], [5, 0.08], [3, 0.11], [4, 0.12], [7, 0.13]];
// a tower's pile from the ground up, as boxes: { plate (1 a floor plate, 0 a storey of rooms), x0, x1, z0, z1, y0,
// y1, ci (a storey's colour), bay (the width of its bays) }. A tower with a great doorway keeps its west face plumb
// (its lifts run up it).
function towerPile(T, rp) {
  const out = [], W = 2 * T.r, g0 = T.door ? T.door + 2 : rp.chance(0.5) ? 8 : 12;
  const share = () => { let u = rp(); for (const [ci, w] of STOREY_SHARE) { if (u < w) return ci; u -= w; } return 2; };
  let box = [T.x - T.r, T.x + T.r, T.z - T.r, T.z + T.r], y0 = 0, y1 = g0, prev = -1;
  for (let k = 0; k < 12; k++) {
    let ci = share();
    if (ci === prev) ci = share();
    prev = ci;
    // (a great tower's last storey runs up into the ceiling of light; a lesser tower ends with a plate)
    const last = T.great ? y1 + 10 > P.SLAB - 4 : y1 + 2 >= T.h - 1;
    out.push({ plate: 0, x0: box[0], x1: box[1], z0: box[2], z1: box[3], y0, y1: last && T.great ? P.SLAB : y1, ci, bay: [4, 4, 4][rp.int(0, 2)] });
    if (last && T.great) break;
    let nb = box.slice();
    if (!last) for (let tries = 0; tries < 8; tries++) {
      nb = box.slice();
      const a = rp.range(0.06, 0.2) * W * (rp.chance(0.5) ? 1 : -1), b = rp.range(0.04, 0.1) * W * (rp.chance(0.5) ? 1 : -1), mode = rp.int(0, 3);
      if (mode === 0) { nb[0] += a; nb[1] += a; } else if (mode === 1) { nb[2] += a; nb[3] += a; } else if (mode === 2) { nb[0] += b; nb[1] -= b; nb[2] += a / 2; nb[3] += a / 2; } else { nb[2] += b; nb[3] -= b; nb[0] += a / 2; nb[1] += a / 2; }
      if (T.door) { const w0 = nb[1] - nb[0]; nb[0] = T.x - T.r; nb[1] = nb[0] + w0; }
      const w = nb[1] - nb[0], d = nb[3] - nb[2];
      if (w > 0.62 * W && w < 1.05 * W && d > 0.62 * W && d < 1.05 * W && Math.abs((nb[0] + nb[1]) / 2 - T.x) < (T.door ? 0.2 : 0.14) * W && Math.abs((nb[2] + nb[3]) / 2 - T.z) < 0.14 * W) break;
      nb = box.slice();
    }
    const o = rp.range(1.5, 3.5);
    out.push({ plate: 1, x0: Math.min(box[0], nb[0]) - (T.door ? 1.5 : o), x1: Math.max(box[1], nb[1]) + o, z0: Math.min(box[2], nb[2]) - o, z1: Math.max(box[3], nb[3]) + o, y0: y1, y1: y1 + 2 });
    if (last) break;
    box = nb; y0 = y1 + 2; y1 = y0 + 8;
  }
  return out;
}
// (round ten) THE HERO'S PILE: THREE TIERS, each set back from the one below on its north, its south and its east
// side (its west face stays plumb: its three lifts run up it and its great doorway stands in it): the first the
// whole foot (100 m square) up to 40 m, the second 76 m square to 70 m, the third 54 m square up into the slab; a
// broad plate lies on each shoulder. ITS STOREYS ARE WARM: warm white and pale gold by turns (the towers' own list
// holds the pale gold at its first place), against the cool towers. Each: as towerPile's.
// (STACK_PROUD: the most by which a floor plate of the well's own building stands proud of its glass: what is built
// beside that building keeps clear of it by this much and more)
export const STACK_PROUD = 2.2;
// (HERO_SHOULDERS: the heights of its two shoulders, where the second and the third tier begin)
const HERO_TIERS = [1, 0.76, 0.54];
export const HERO_SHOULDERS = [40, 70];
function heroPile(T) {
  const out = [], xw = T.x - T.r, g0 = T.door + 2, tier = HERO_TIERS.map((k) => k * T.r), [s1, s2] = HERO_SHOULDERS;
  const st = [[0, 0, g0], [0, g0 + 2, g0 + 10], [0, g0 + 12, g0 + 20], [1, s1, s1 + 8], [1, s1 + 10, s1 + 18], [1, s1 + 20, s1 + 28], [2, s2, s2 + 8], [2, s2 + 10, s2 + 18], [2, s2 + 20, P.SLAB]];
  st.forEach(([t, y0, y1], i) => {
    const h = tier[t];
    out.push({ plate: 0, x0: xw, x1: xw + 2 * h, z0: T.z - h, z1: T.z + h, y0, y1, ci: i % 2 === 0 ? 7 : 0, bay: 4 });
    if (i + 1 < st.length) out.push({ plate: 1, x0: xw - 1.5, x1: xw + 2 * h + 2.5, z0: T.z - h - 2.5, z1: T.z + h + 2.5, y0: y1, y1: y1 + 2 });
  });
  return out;
}
// (round ten) A DEALT TOWER'S FORM (T.form): 0 the pile as dealt; 1 A SLAB ON A PODIUM (over its first one or two
// storeys the pile is narrowed to 0.42 of its width one way: T.alongX says which way it runs); 2 A SPIRE (each
// storey 7 % narrower than the one below, down to 0.46); 3 A CROWN (each storey 5 % broader than the one below, up
// to 1.3); 4 A NEEDLE ON A PODIUM (narrowed to 0.55 both ways). Every storey keeps its own shift, scaled about the
// foot's middle; a plate is as broad as the broader of its two storeys; THE GROUND STOREY KEEPS THE FOOT WHOLE (the
// sheet opens round it). T.podTop: the top of the podium's last plate.
function shapePile(T) {
  const n = T.pile.filter((b) => !b.plate).length, pod = n > 5 ? 2 : 1, form = T.form;
  const f = (s) => {
    if (s <= 0 || form === 0) return [1, 1];
    if (form === 1) return s < pod ? [1, 1] : T.alongX ? [1, 0.42] : [0.42, 1];
    if (form === 2) { const k = Math.max(1 - 0.07 * s, 0.46); return [k, k]; }
    if (form === 3) { const k = Math.min(1 + 0.05 * s, 1.3); return [k, k]; }
    return s < pod ? [1, 1] : [0.55, 0.55];
  };
  let s = 0;
  T.podTop = 0;
  for (const b of T.pile) {
    const a = f(s), c = b.plate ? f(s + 1) : a, k = b.plate ? [Math.max(a[0], c[0]), Math.max(a[1], c[1])] : a;
    b.x0 = T.x + (b.x0 - T.x) * k[0]; b.x1 = T.x + (b.x1 - T.x) * k[0]; b.z0 = T.z + (b.z0 - T.z) * k[1]; b.z1 = T.z + (b.z1 - T.z) * k[1];
    if (b.plate) { if (s < pod) T.podTop = b.y1; s++; }
  }
}
// THE TOWERS' DEAL. more: how many are dealt, the same on every seed. east: of every `of` dealt towers, in their
// own order, the first `take` stand in the east quarter, the others in the west (see the head: each quarter is a
// half-plane, a quarter turn to either side of its heading, as the side of a wall is). hazeTakes: the share of a
// tower's light that the air has taken at the ladder's far end. half: a tower's half width as a share of the hero's
// (the hero's foot is the broadest in the plan). top: a lesser tower's top as a share of the slab's height. tries,
// goes: A BOUND ON A SEARCH, not a measure of the plan: how often a tower's draws may look for ground, and in how
// many equal goes (in the first it keeps to its own rung).
export const TOWERS = { more: 12, east: { take: 2, of: 3 }, hazeTakes: 1 / 2, half: [1 / 2, 1], top: [1 / 3, 4 / 5], tries: 90, goes: 6 };
// (the least distance from the place c, within `half` radians of the heading a0, at which stands(x, z) holds: worked
// out on a lattice of 5 m and 2 degrees; no draw. The 2000 m: a bound on the search, beyond every ladder's far end)
function nearClear(c, a0, half, stands) {
  for (let d = 0; d < 2000; d += 5) for (let a = -half; a <= half + 1e-9; a += Math.PI / 90) if (stands(c[0] + d * Math.cos(a0 + a), c[1] + d * Math.sin(a0 + a))) return d;
  return 2000;
}
export function towersDeal(seed) {
  const r = makeRng(hashSeed('fww-far:' + seed)), rp = makeRng(hashSeed('fww-pile:' + seed)), K = P.CORE, B = P.TOWB, way = [];
  const out = [{ x: K.x, z: K.z, r: K.r, h: P.SLAB, great: true, door: K.door, lifts: K.lifts }, { x: B.x, z: B.z, r: B.r, h: P.SLAB, great: true, door: B.door, lifts: B.lifts }];
  for (let h = 0; h <= H_END; h += 10) { const q = lineAt(h); way.push(q[0], q[1]); }
  // (a tower of half width rr stands at (x, z): on nothing built, 150 m and more from the line by its widest plate,
  // and off every tower that stands)
  const stands = (x, z, rr) => {
    if (onBuilt(x, z, rr * 1.3)) return false;
    for (let q = 0; q < way.length; q += 2) if (Math.hypot(x - way[q], z - way[q + 1]) < 150 + 1.9 * rr) return false;
    return !out.some((o) => Math.hypot(x - o.x, z - o.z) < 110 + 1.5 * (rr + o.r));
  };
  const rMin = TOWERS.half[0] * K.r, rMax = TOWERS.half[1] * K.r, far = -Math.log(1 - TOWERS.hazeTakes) * (1 / FOG_ABOVE.k);
  // (the east quarter: from the street's mouth in the garden court's east wall, due east as the street is built;
  // the west quarter: from the core's axis, due west; each a half-plane. a0: the heading as an angle from east
  // toward south)
  const quarters = [{ c: [P.STREET.x0, P.STREET.z], a0: 0, half: Math.PI / 2 }, { c: [K.x, K.z], a0: Math.PI, half: Math.PI / 2 }];
  for (const Q of quarters) Q.near = nearClear(Q.c, Q.a0, Q.half, (x, z) => stands(x, z, rMin));
  const n = TOWERS.more;
  // (three ladders, each dealt among the towers so that they are clearly unlike: a rung of the ladder of distances,
  // a half width, a top)
  const rung = r.shuffle(Array.from({ length: n }, (_, i) => i)), rad = r.shuffle(Array.from({ length: n }, (_, i) => rMin + (rMax - rMin) * i / (n - 1)));
  const tall = r.shuffle(Array.from({ length: n }, (_, i) => P.SLAB * (TOWERS.top[0] + (TOWERS.top[1] - TOWERS.top[0]) * i / (n - 1))));
  for (let k = 0; k < n; k++) for (let tries = 0; tries < TOWERS.tries; tries++) {
    // (in its first go a tower keeps to its own rung; after that it may stand anywhere on its quarter's ladder)
    const Q = quarters[k % TOWERS.east.of < TOWERS.east.take ? 0 : 1], a = Q.a0 + r.range(-Q.half, Q.half), own = tries < TOWERS.tries / TOWERS.goes;
    const d = Q.near + (far - Q.near) * (own ? (rung[k] + r()) / n : r()), x = Q.c[0] + d * Math.cos(a), z = Q.c[1] + d * Math.sin(a), rr = rad[k];
    if (stands(x, z, rr)) { out.push({ x, z, r: rr, h: k % 5 === 0 ? P.SLAB : tall[k], great: k % 5 === 0 }); break; }
  }
  // THE HERO IS UNLIKE THE REST: the core's pile is its own, built by rule (see heroPile: no draw is spent on it);
  // every other tower's pile is dealt, each once, in the towers' own order. AND NO TWO TOWERS ARE ALIKE: each dealt
  // tower's pile is given one of five forms, in turn from a hand of fourteen shuffled by the stream fww-form: see
  // shapePile.
  out.forEach((T, k) => { T.pile = k === 0 ? heroPile(T) : towerPile(T, rp); T.h = T.pile[T.pile.length - 1].y1; });
  {
    const rf = makeRng(hashSeed('fww-form:' + seed)), hand = rf.shuffle([0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 1, 2, 3, 4]);
    for (let k = 2; k < out.length; k++) { out[k].form = hand[(k - 2) % hand.length]; out[k].alongX = rf.chance(0.5); shapePile(out[k]); }
  }
  // (round eight: EVERY DEALT TOWER HAS TWO GLASS LIFTS, one before its west face and one before its south face, each
  // a slim glass shaft that stands free before the pile's widest plate, from the floor to the tower's top; off: the
  // metres from the face's middle. The stream fww-lifts deals them, after the piles: no pile changes for it.)
  const rl = makeRng(hashSeed('fww-lifts:' + seed));
  for (let k = 2; k < out.length; k++) {
    const T = out[k];
    T.shafts = [{ face: 'w', off: rl.range(-0.5, 0.5) * T.r }, { face: 's', off: rl.range(-0.5, 0.5) * T.r }];
    // (round ten: a shaft stands before the face it serves: on a slab or a needle it runs up the podium only, where
    // the pile stands back from it above; a spire has none; under a crown it stands at the foot and runs up into the
    // overhang)
    if (T.form === 2) T.shafts = [];
    else if (T.form === 1 || T.form === 4) T.shafts.forEach((s) => { s.top = T.podTop - 0.5; });
    else if (T.form === 3) T.shafts.forEach((s) => { s.at = s.face === 'w' ? T.pile[0].x0 : T.pile[0].z1; });
    // (a shaft is 5 m broad: it keeps within the face of a narrowed podium)
    if (T.form === 1) T.shafts = T.shafts.filter((s) => (s.face === 'w') !== T.alongX || Math.abs(s.off) < 0.42 * T.r - 3);
  }
  // (round ten) THE WELL'S OWN BUILDING, as it stands among the towers: A BROAD LOW PILE of eight lit storeys (4.25 m
  // each) between floor plates of 1 m, from the floor up to 43 m, 100 m to a side; each storey in one of the
  // floors' colours (the stream fww-stack), no two neighbours alike; every plate a little proud of the glass by its
  // own draw. It is hollow: the well runs up inside it. It comes last, after every deal, so that no dealt tower
  // changes for it; it has no great doorway and no lift outside.
  {
    const S = P.SHAFT, rs = makeRng(hashSeed('fww-stack:' + seed)), pile = [], N = 8, pitch = 5.25;
    let prev = -1;
    for (let k = 0; k < N; k++) {
      const y0 = pitch * k, o = rs.range(1.0, STACK_PROUD);
      let ci = STOREY_SHARE[rs.int(0, STOREY_SHARE.length - 1)][0];
      if (ci === prev) ci = STOREY_SHARE[(STOREY_SHARE.findIndex((q) => q[0] === ci) + 2) % STOREY_SHARE.length][0];
      prev = ci;
      const b = [S.x - S.half, S.x + S.half, S.z - S.half, S.z + S.half];
      pile.push({ plate: 0, x0: b[0], x1: b[1], z0: b[2], z1: b[3], y0, y1: y0 + pitch - 1, ci, bay: 5 });
      pile.push({ plate: 1, x0: b[0] - o, x1: b[1] + o, z0: b[2] - o, z1: b[3] + o, y0: y0 + pitch - 1, y1: k === N - 1 ? S.roof : y0 + pitch });
    }
    out.push({ x: S.x, z: S.z, r: S.half, h: S.roof, great: false, stack: true, pile });
  }
  return out;
}
// THE TOWERS' BODIES, all in one mesh: every plate (its top, its under side, its four edges), every storey's four
// glass walls, the two near towers' great doorways with their rooms and warm frames, and their glass lift shafts on
// the west face. aT: the kind (0 a plate, 1 a storey, 2 a lift shaft; -1 a doorway's room, -2 its warm frame, -3 its
// back wall), a storey's colour or a shaft's number, the tower's own number, 1 on a great tower. aU: metres along the
// face (on a face that looks north or south: from its east end), the foot of the plate or storey, its height, and a
// storey's bay (a plate: 1 on a face that looks north or south, else 0); a shaft: across it (-1 to 1) in the first;
// a doorway's room: its depth (0 at the mouth to 1) in the first.
function towersGeo(towers) {
  const pos = [], nor = [], aT = [], aU = [];
  const face = (v, n, t, u) => {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const uu = Array.isArray(u[0]) ? u[i] : u;
      pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); aT.push(t[0], t[1], t[2], t[3]); aU.push(uu[0], uu[1], uu[2], uu[3]);
    }
  };
  // the four upright faces of a box b; bay under nought marks a plate; cut: [z0, z1, y] an opening in its west face
  // from its foot up to y
  const sides = (b, t, bay, cut) => {
    const { x0, x1, z0, z1, y0, y1 } = b, h = y1 - y0;
    const wall = (ax, az, bx, bz, n, ua, ub, ns, ya = y0) => {
      const w = bay < 0 ? ns : bay;
      face([[ax, ya, az], [bx, ya, bz], [bx, y1, bz], [ax, y1, az]], n, t, [[ua, y0, h, w], [ub, y0, h, w], [ub, y0, h, w], [ua, y0, h, w]]);
    };
    wall(x1, z0, x0, z0, [0, 0, -1], 0, x1 - x0, 1); wall(x0, z1, x1, z1, [0, 0, 1], x1 - x0, 0, 1);
    wall(x1, z1, x1, z0, [1, 0, 0], 0, z1 - z0, 0);
    if (!cut) wall(x0, z0, x0, z1, [-1, 0, 0], 0, z1 - z0, 0);
    else {
      wall(x0, z0, x0, cut[0], [-1, 0, 0], 0, cut[0] - z0, 0); wall(x0, cut[1], x0, z1, [-1, 0, 0], cut[1] - z0, z1 - z0, 0);
      wall(x0, cut[0], x0, cut[1], [-1, 0, 0], cut[0] - z0, cut[1] - z0, 0, cut[2]);
    }
  };
  let shaftNo = 0;
  towers.forEach((T, ti) => {
    const gr = T.great ? 1 : 0, half = T.door ? T.door / 2 : 0, xw = T.x - T.r;
    T.pile.forEach((b, bi) => {
      if (T.stack) {
        // THE WELL'S OWN BUILDING IS HOLLOW AND STANDS OPEN WHERE THE CORRIDOR RUNS INTO ITS SOUTH FACE AND THE LINK
        // OUT OF ITS NORTH FACE (each opening as broad as that passage's own roof and as high as its parapet): a
        // face that looks north or south, and a plate's ledge along it, is left out there. A plate's top and its
        // under side are ledges only, round the storey over it and round the one under it (the well itself runs up
        // inside); the last plate's top is whole: it lies over the well's own ceiling.
        const isP = !!b.plate, t = isP ? [0, bi > 0 ? T.pile[bi - 1].ci : 7, ti, gr] : [1, b.ci, ti, gr], h = b.y1 - b.y0, wNS = isP ? 1 : b.bay, wEW = isP ? 0 : b.bay;
        const cutS = [-72.7, -63.3, P.COR_ROOF + 0.7], cutN = [-76.2, -59.8, P.LINK_ROOF + 0.7];
        for (const [zf, nz, c] of [[b.z1, 1, cutS], [b.z0, -1, cutN]]) {
          const seg = (xa, xb, ya) => { if (xb > xa + 1e-6 && b.y1 > ya + 1e-6) face([[xa, ya, zf], [xb, ya, zf], [xb, b.y1, zf], [xa, b.y1, zf]], [0, 0, nz], t, [[b.x1 - xa, b.y0, h, wNS], [b.x1 - xb, b.y0, h, wNS], [b.x1 - xb, b.y0, h, wNS], [b.x1 - xa, b.y0, h, wNS]]); };
          if (b.y0 >= c[2]) seg(b.x0, b.x1, b.y0); else { seg(b.x0, c[0], b.y0); seg(c[1], b.x1, b.y0); seg(c[0], c[1], c[2]); }
        }
        face([[b.x1, b.y0, b.z1], [b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1]], [1, 0, 0], t, [[0, b.y0, h, wEW], [b.z1 - b.z0, b.y0, h, wEW], [b.z1 - b.z0, b.y0, h, wEW], [0, b.y0, h, wEW]]);
        face([[b.x0, b.y0, b.z0], [b.x0, b.y0, b.z1], [b.x0, b.y1, b.z1], [b.x0, b.y1, b.z0]], [-1, 0, 0], t, [[0, b.y0, h, wEW], [b.z1 - b.z0, b.y0, h, wEW], [b.z1 - b.z0, b.y0, h, wEW], [0, b.y0, h, wEW]]);
        if (isP) {
          const u = [0, b.y0, h, 0];
          const ledge = (y, ny, c) => {
            const strip = (xa, xb, za, zb) => { if (xb > xa + 1e-6 && zb > za + 1e-6) face([[xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb]], [0, ny, 0], t, u); };
            for (const [za, zb, k] of [[c.z1, b.z1, cutS], [b.z0, c.z0, cutN]]) { if (y >= k[2]) strip(b.x0, b.x1, za, zb); else { strip(b.x0, k[0], za, zb); strip(k[1], b.x1, za, zb); } }
            strip(b.x0, c.x0, c.z0, c.z1); strip(c.x1, b.x1, c.z0, c.z1);
          };
          if (bi + 1 < T.pile.length) ledge(b.y1, 1, T.pile[bi + 1]);
          else face([[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]], [0, 1, 0], t, u);
          if (bi > 0) ledge(b.y0, -1, T.pile[bi - 1]);
        }
        return;
      }
      if (b.plate) {
        // (a plate knows the colour of the storey under it: its under side takes that storey's glow)
        const t = [0, bi > 0 ? T.pile[bi - 1].ci : 7, ti, gr], h = b.y1 - b.y0, u = [0, b.y0, h, 0];
        sides(b, t, -1, null);
        face([[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]], [0, 1, 0], t, u);
        face([[b.x0, b.y0, b.z0], [b.x1, b.y0, b.z0], [b.x1, b.y0, b.z1], [b.x0, b.y0, b.z1]], [0, -1, 0], t, u);
      } else sides(b, [1, b.ci, ti, gr], b.bay, bi === 0 && T.door ? [T.z - half - P.REVEAL.broad, T.z + half + P.REVEAL.broad, T.door + P.REVEAL.broad] : null);
    });
    if (T.door) {
      // THE GREAT DOORWAY in the west face's ground storey: d metres inward from the face, s across, y up
      const h = T.door, at = (d, s, y) => [xw + d, y, T.z + s], m0 = [-1, 0, ti, gr], fr = [-2, 0, ti, gr];
      const mr = [[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]];
      // its room, 12 m deep: floor (from 1.4 m before the face, where the forecourt's own floor ends), ceiling, two
      // sides, and the back wall: a wall of light
      const FB = P.REVEAL.broad, FP = P.REVEAL.proud, isB = ti === 1, y00 = isB ? P.PORCH.rise : 0;
      face([at(isB ? -P.PORCH.land : -1.4, half, y00), at(12, half, y00), at(12, -half, y00), at(isB ? -P.PORCH.land : -1.4, -half, y00)], [0, 1, 0], m0, mr);
      if (isB) {
        // (round ten) TOWER B'S FRONT IS NOT A FLAT WALL. THE DOORWAY STANDS ON A FLIGHT OF FIVE BROAD LOW STEPS, as
        // broad as itself, up from the forecourt to a landing 1 m over it (the ring stands on the landing), and the
        // doorway's warm light pours down them. IT STANDS IN A DEEP PORCH: the pile's first plate runs out 13.5 m
        // over the forecourt, 39 m broad, on two rows of three slim piers 0.7 m square and 32.8 m tall, a rib across
        // under it at each pair; ITS SOFFIT IS LIT: warm, a slim bar of light to a panel. OVER IT, BALCONIES: at the next
        // three plates a slab 3 m deep either side of the middle lift, each with a slim rail.
        const R = P.PORCH, fr1 = [-2, 0, ti, gr], sof = [-4, 0, ti, gr], pl0 = [0, T.pile[0].ci, ti, gr];
        for (let k = 0; k < R.steps; k++) {
          const d0 = -R.land - (R.steps - 1 - k) * R.tread, yk = (k + 1) * R.rise / R.steps, lit = [0.12 + 0.05 * k, 0, 0, 0];
          if (k < R.steps - 1) face([at(d0, half, yk), at(d0 + R.tread, half, yk), at(d0 + R.tread, -half, yk), at(d0, -half, yk)], [0, 1, 0], m0, lit);
          face([at(d0, -half, yk - R.rise / R.steps), at(d0, half, yk - R.rise / R.steps), at(d0, half, yk), at(d0, -half, yk)], [-1, 0, 0], m0, [0.02 + 0.03 * k, 0, 0, 0]);
          if (d0 < -FP) for (const sg of [-1, 1]) face([at(d0, sg * half, 0), at(-FP, sg * half, 0), at(-FP, sg * half, yk), at(d0, sg * half, yk)], [0, 0, sg], fr1, [0, 0.5, 0, 0]);
        }
        const xa = -R.out, xb = -1.5, hw = R.half, y0 = T.door + 2 + 0.8, y1 = T.door + 4, up = [0, y0, y1 - y0, 0];
        face([at(xa, -hw, y1), at(xb, -hw, y1), at(xb, hw, y1), at(xa, hw, y1)], [0, 1, 0], pl0, up);
        face([at(xa, -hw, y0), at(xb, -hw, y0), at(xb, hw, y0), at(xa, hw, y0)], [0, -1, 0], sof, [0, 0, 0, 0]);
        face([at(xa, -hw, y0), at(xa, hw, y0), at(xa, hw, y1), at(xa, -hw, y1)], [-1, 0, 0], pl0, up);
        for (const sg of [-1, 1]) face([at(xa, sg * hw, y0), at(xb, sg * hw, y0), at(xb, sg * hw, y1), at(xa, sg * hw, y1)], [0, 0, sg], pl0, [0, y0, y1 - y0, 1]);
        for (const dx of R.piers) {
          for (const sg of [-1, 1]) {
            const s0 = sg * (hw - 1.1) - 0.35, s1 = s0 + 0.7, d0 = dx - 0.35, d1 = dx + 0.35, uu = [0, 0.78, 0, 0];
            face([at(d0, s0, 0), at(d0, s1, 0), at(d0, s1, y0), at(d0, s0, y0)], [-1, 0, 0], fr1, [0, 0.55, 0, 0]);
            face([at(d1, s0, 0), at(d1, s1, 0), at(d1, s1, y0), at(d1, s0, y0)], [1, 0, 0], fr1, [1, 0, 0, 0]);
            face([at(d0, s0, 0), at(d1, s0, 0), at(d1, s0, y0), at(d0, s0, y0)], [0, 0, -1], fr1, sg > 0 ? [1, 0, 0, 0] : uu);
            face([at(d0, s1, 0), at(d1, s1, 0), at(d1, s1, y0), at(d0, s1, y0)], [0, 0, 1], fr1, sg < 0 ? [1, 0, 0, 0] : uu);
          }
          // (the rib across, 0.5 m broad and 0.9 m deep)
          const d0 = dx - 0.25, d1 = dx + 0.25, yr = y0 - 0.9;
          face([at(d0, -hw + 1.1, yr), at(d1, -hw + 1.1, yr), at(d1, hw - 1.1, yr), at(d0, hw - 1.1, yr)], [0, -1, 0], fr1, [1, 0, 0, 0]);
          face([at(d0, -hw + 1.1, yr), at(d0, hw - 1.1, yr), at(d0, hw - 1.1, y0), at(d0, -hw + 1.1, y0)], [-1, 0, 0], fr1, [0, 0.7, 0, 0]);
          face([at(d1, -hw + 1.1, yr), at(d1, hw - 1.1, yr), at(d1, hw - 1.1, y0), at(d1, -hw + 1.1, y0)], [1, 0, 0], fr1, [1, 0, 0, 0]);
        }
        // the balconies
        const plates = T.pile.filter((b) => b.plate).slice(1, 4);
        for (const b of plates) for (const [sa, sb] of [[-14, -4.2], [4.2, 14]]) {
          const yb = b.y1, d0 = -4.5, d1 = -1.5, ub = [0, yb - 0.35, 0.35, 0];
          face([at(d0, sa, yb), at(d1, sa, yb), at(d1, sb, yb), at(d0, sb, yb)], [0, 1, 0], pl0, ub);
          face([at(d0, sa, yb - 0.35), at(d1, sa, yb - 0.35), at(d1, sb, yb - 0.35), at(d0, sb, yb - 0.35)], [0, -1, 0], [0, 7, ti, gr], ub);
          face([at(d0, sa, yb - 0.35), at(d0, sb, yb - 0.35), at(d0, sb, yb), at(d0, sa, yb)], [-1, 0, 0], pl0, ub);
          for (const s of [sa, sb]) face([at(d0, s, yb - 0.35), at(d1, s, yb - 0.35), at(d1, s, yb), at(d0, s, yb)], [0, 0, s === sa ? -1 : 1], pl0, [0, yb - 0.35, 0.35, 1]);
          // (the rail: a slim top rail 1.1 m up, a post at each end and at each third)
          const rl = [0, 0.86, 0, 0];
          face([at(d0 + 0.1, sa, yb + 1.02), at(d0 + 0.1, sb, yb + 1.02), at(d0 + 0.1, sb, yb + 1.12), at(d0 + 0.1, sa, yb + 1.12)], [-1, 0, 0], fr1, rl);
          face([at(d0 + 0.1, sa, yb + 1.12), at(d0 + 0.22, sa, yb + 1.12), at(d0 + 0.22, sb, yb + 1.12), at(d0 + 0.1, sb, yb + 1.12)], [0, 1, 0], fr1, rl);
          for (let q = 0; q <= 3; q++) { const s = sa + (sb - sa) * q / 3 - 0.04; face([at(d0 + 0.1, s, yb), at(d0 + 0.1, s + 0.08, yb), at(d0 + 0.1, s + 0.08, yb + 1.02), at(d0 + 0.1, s, yb + 1.02)], [-1, 0, 0], fr1, rl); }
        }
      }
      face([at(0, half, h), at(12, half, h), at(12, -half, h), at(0, -half, h)], [0, -1, 0], m0, mr);
      for (const sg of [-1, 1]) face([at(0, sg * half, 0), at(12, sg * half, 0), at(12, sg * half, h), at(0, sg * half, h)], [0, 0, -sg], m0, mr);
      face([at(12, -half, 0), at(12, half, 0), at(12, half, h), at(12, -half, h)], [-1, 0, 0], [-3, 0, ti, gr], [[-half, 0, 0, 0], [half, 0, 0, 0], [half, 0, 0, 0], [-half, 0, 0, 0]]);
      // THE DEEP WHITE REVEAL (round eight): two jambs and a lintel, FB broad, standing FP proud of the face. aU: 1
      // on a face that looks into the opening (lit by the doorway's own light), and on the front how near the place
      // lies to the opening's edge (0 to 1)
      for (const [sa, sb, ya, yc, ia, ib, iu] of [[-half - FB, -half, 0, h + FB, 0, 1, 0], [half, half + FB, 0, h + FB, 1, 0, 0], [-half, half, h, h + FB, 0, 0, 1]]) {
        const e = (s, y) => [0, iu ? (y === ya ? 1 : 0) : (s === sa ? ia : ib), 0, 0];
        face([at(-FP, sa, ya), at(-FP, sb, ya), at(-FP, sb, yc), at(-FP, sa, yc)], [-1, 0, 0], fr, [e(sa, ya), e(sb, ya), e(sb, yc), e(sa, yc)]);
        face([at(-FP, sa, ya), at(0.4, sa, ya), at(0.4, sa, yc), at(-FP, sa, yc)], [0, 0, -1], fr, [ia, 0, 0, 0]);
        face([at(-FP, sb, ya), at(0.4, sb, ya), at(0.4, sb, yc), at(-FP, sb, yc)], [0, 0, 1], fr, [ib, 0, 0, 0]);
        face([at(-FP, sa, yc), at(-FP, sb, yc), at(0.4, sb, yc), at(0.4, sa, yc)], [0, 1, 0], fr, [0, 0, 0, 0]);
        face([at(-FP, sa, ya), at(-FP, sb, ya), at(0.4, sb, ya), at(0.4, sa, ya)], [0, -1, 0], fr, [iu, 0, 0, 0]);
      }
    }
    // THE LIFTS (the two near towers): glass shafts 6 m wide on the west face, 2.6 m proud of it, each from its foot
    // (the floor, or over the great doorway's frame) up into the ceiling's collar; a lit glass car rises and sinks in each
    for (const [dz, ys] of T.lifts || []) {
      const xa = xw - 2.6, za = T.z + dz - 3, zb = T.z + dz + 3, yt = P.SLAB - 2, t = [2, shaftNo++, ti, gr];
      face([[xa, ys, za], [xa, ys, zb], [xa, yt, zb], [xa, yt, za]], [-1, 0, 0], t, [[-1, ys, 0, 0], [1, ys, 0, 0], [1, ys, 0, 0], [-1, ys, 0, 0]]);
      for (const [z, n] of [[za, -1], [zb, 1]]) face([[xa, ys, z], [xw, ys, z], [xw, yt, z], [xa, yt, z]], [0, 0, n], t, [0.6 * n, ys, 0, 0]);
      if (ys > 0) face([[xa, ys, za], [xw, ys, za], [xw, ys, zb], [xa, ys, zb]], [0, -1, 0], t, [9, ys, 0, 0]);
    }
    for (const S of T.shafts || []) {
      // a dealt tower's lift: a glass shaft 5 m wide and 2.2 m deep (its front, two sides, back and top)
      const yt = S.top !== undefined ? S.top : (T.great ? P.SLAB : T.h) - 1.5, t = [2, shaftNo++, ti, gr], fu = [[-1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [-1, 0, 0, 0]], pl = [9, 0, 0, 0];
      if (S.face === 'w') {
        const xo = (S.at !== undefined ? S.at : Math.min(...T.pile.map((b) => b.x0))) - 2.2, xi = xo + 2.2, za = T.z + S.off - 2.5, zb = za + 5;
        face([[xo, 0, za], [xo, 0, zb], [xo, yt, zb], [xo, yt, za]], [-1, 0, 0], t, fu);
        for (const [z, n] of [[za, -1], [zb, 1]]) face([[xo, 0, z], [xi, 0, z], [xi, yt, z], [xo, yt, z]], [0, 0, n], t, [0.6 * n, 0, 0, 0]);
        face([[xi, 0, za], [xi, 0, zb], [xi, yt, zb], [xi, yt, za]], [1, 0, 0], t, pl);
        face([[xo, yt, za], [xi, yt, za], [xi, yt, zb], [xo, yt, zb]], [0, 1, 0], t, pl);
      } else {
        const zo = (S.at !== undefined ? S.at : Math.max(...T.pile.map((b) => b.z1))) + 2.2, zi = zo - 2.2, xa = T.x + S.off - 2.5, xb = xa + 5;
        face([[xa, 0, zo], [xb, 0, zo], [xb, yt, zo], [xa, yt, zo]], [0, 0, 1], t, fu);
        for (const [x, n] of [[xa, -1], [xb, 1]]) face([[x, 0, zo], [x, 0, zi], [x, yt, zi], [x, yt, zo]], [n, 0, 0], t, [0.6 * n, 0, 0, 0]);
        face([[xa, 0, zi], [xb, 0, zi], [xb, yt, zi], [xa, yt, zi]], [0, 0, -1], t, pl);
        face([[xa, yt, zi], [xb, yt, zi], [xb, yt, zo], [xa, yt, zo]], [0, 1, 0], t, pl);
      }
    }
  });
  const g = geoOf(pos, nor);
  g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 4)); g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 4));
  return g;
}

// ---------------------------------------------------------------- the tide's carpet
// THE CARPET'S OWN PATTERN at a place p of the plan (dx, dy: the place's change from pixel to pixel), one function
// for the tide and for the link's floor, which is the same carpet laid level. x: the share of the carpet's second
// blue (a faint check of 3 m, melting to the two blues' mean far off); y: how much of the pixel the pale lines
// cover (round nine: A GRID OF PALE LINES 3 m APART, each 0.24 m wide: each is weighed by the pixel's own reach
// across x and across z, a box filter per axis, so that lines seen at a skimming angle thin out and never
// flicker); z: the pile's own grain, a factor about 1, seen only near the lens (a draw from a place's two whole
// numbers, by constants of our own: a sine and a cosine of two weighted sums).
export const GLSL_CARPET = /* glsl */`
vec3 carpetWeave(vec2 p, vec2 dx, vec2 dy){
  vec2 f2 = max(abs(dx) + abs(dy), vec2(.03));
  float fm = max(f2.x, f2.y);
  vec2 t = p / 3., ti = floor(t), dl = 1.5 - abs(fract(t) - .5) * 3.;
  vec2 ov = clamp(min(dl + .5 * f2, vec2(.12)) - max(dl - .5 * f2, vec2(-.12)), 0., 1.) / f2;
  ov = mix(ov, vec2(.08), smoothstep(1.2, 3., f2));
  float chk = mod(ti.x + ti.y, 2.);
  vec2 pg = floor(p * 9.);
  float pile = fract(sin(dot(pg, vec2(27.619, 57.583))) * 24634.6345 + cos(dot(pg, vec2(41.233, 13.171))) * 7919.137);
  return vec3(mix(.35 + .3 * chk, .5, smoothstep(.8, 2.5, fm)), 1. - (1. - ov.x) * (1. - ov.y), 1. + .16 * (pile - .5) * (1. - smoothstep(.03, .12, fm)));
}
`;
// THE CARPET'S SHADE BY THE SWELL (the tide's shader reads these). by: the carpet's own blue is taken at the first
// number of itself where a place takes no light and at the second where it takes the whole. turn: at the first
// where its face turns its most away from the eye, at the second where it turns its most toward it. seam: the pale
// lines stand at the first number of their colour, and the second more by the light; they cover the third share of
// what they cross. TIDE_LEVEL: the blue's shade where the swell is level: half way in both.
export const TIDE_SHADE = { by: [0.75, 1.2], turn: [1.25, 0.4], seam: [0.4, 0.8, 0.3] };
export const TIDE_LEVEL = (TIDE_SHADE.by[0] + TIDE_SHADE.by[1]) / 2 * (TIDE_SHADE.turn[0] + TIDE_SHADE.turn[1]) / 2;
const TIDE_VERT = /* glsl */`
varying vec3 vW;
${GLSL_WAVE}${GLSL_TIDE}
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  w.y += tide(w.xz).x;
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const TIDE_FRAG = /* glsl */`
varying vec3 vW;
uniform vec3 uBlueA, uBlueB, uSeam, uFogIn; uniform float uFogKIn;
uniform sampler2D tLamps;
${GLSL_WAVE}${GLSL_TIDE}${GLSL_CARPET}
void main(){
  vec2 p = vW.xz, dx = dFdx(p), dy = dFdy(p);
  float fw = sqrt(abs(dx.x * dy.y - dx.y * dy.x) + 1e-8), a = max(fw, .03);
  vec3 td = tide(p);
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 v = toEye / max(dist, 1e-3);
  // (round nine) A GRID OF PALE LINES 3 m APART is laid in the carpet: over the swells the lines are seen to bend.
  // Between them the carpet's two blues lie as a faint check; near the lens, the pile's own grain (carpetWeave).
  vec3 cw = carpetWeave(p, dx, dy);
  float seamCov = cw.y;
  vec3 col = mix(uBlueA, uBlueB, cw.x) * cw.z;
  // THE CARPET READ AS A SEA (round nine): LIGHT BY HEIGHT, BROAD AND SMOOTH. The crests stand clearly lighter and
  // the troughs deeper, in long bands that are the two trains' own; a soft sheen lies on what is seen at a skimming
  // angle; A FINE PALER LINE runs along each crest. No speckle lies on it.
  float hN = clamp(td.x / 1.8, -1., 1.);
  // (lean: 1 where a face leans its most toward the light, -1 where it leans its most away)
  float lean = clamp(-dot(td.yz, vec2(.94, .34)) * 6.5, -1., 1.);
  // THE LIGHT A PLACE TAKES (0 to 1) GOES BY ITS HEIGHT, EACH TRAIN BY ITSELF: the long swell's crests light and its
  // troughs deep (0.6 of it), the short train's crests and troughs the same (0.45: they band the floor every 23 m:
  // nine of them lie across the hall from north to south), a little by the lean. (Light by the lean alone shows
  // one who looks from the lit side pale faces only: the faces that lean away are foreshortened to slivers.)
  // A linear shade is pressed flat by the filmic curve, so the two ends are given as they are read: THE TROUGHS GO
  // TO A DEEP NAVY, THE CRESTS TO A LIGHT CORNFLOWER BLUE, the carpet's own blue between; the pale lines of the
  // grid go with them. A FINE PALE LINE runs along every crest of both trains. Near the walls, where the swell
  // is a third, the shade is a third too.
  float e2 = tideEdge(p), th2 = uTr[1].x * p.x + uTr[1].y * p.y - uTr[1].z * uTime + uTr[1].w, s2 = sin(th2);
  float s1 = clamp((td.x / e2 - uTa.y * s2) / uTa.x, -1., 1.);
  float L = clamp(.5 + .5 * e2 * (.6 * s1 + .45 * s2 + .2 * lean), 0., 1.);
  vec3 n = normalize(vec3(-td.y, 1., -td.z));
  float sheen = pow(clamp(1. - dot(n, v), 0., 1.), 3.);
  float crest = (1. - smoothstep(.005, .02, abs(dot(td.yz, vec2(.7071, .7071))))) * smoothstep(.25, .7, hN);
  float fc = max(fwidth(th2), .03), crest2 = (1. - smoothstep(.1 - fc, .1 + fc, abs(cos(th2)))) * step(0., s2) * min(1., .2 / fc) * e2;
  col = mix(${N3(0.05, 0.07, 0.3)}, col * mix(${TIDE_SHADE.by[0].toFixed(2)}, ${TIDE_SHADE.by[1].toFixed(2)}, L), smoothstep(0., .5, L));
  col = mix(col, ${N3(0.5, 0.63, 0.97)}, .6 * smoothstep(.5, 1., L));
  // (round eleven) LIGHT THAT SAYS WATER. THE FACE OF A SWELL THAT TURNS TO THE LENS IS THE DARKER, THE FACE THAT
  // TURNS AWAY THE LIGHTER (turn: 1 where the carpet leans its most toward the eye in plan, -1 where it leans its
  // most away): so each swell between the eye and the far wall is one dark band and one light one, and they are
  // counted. The grid of pale lines is drawn faint: the carpet is a sea first and a floor second.
  float turn = clamp(dot(-td.yz, normalize(toEye.xz + 1e-4)) * 6., -1., 1.);
  col *= mix(${TIDE_SHADE.turn[0].toFixed(2)}, ${TIDE_SHADE.turn[1].toFixed(2)}, smoothstep(-1., 1., turn));
  col = mix(col, uSeam * (${TIDE_SHADE.seam[0].toFixed(2)} + ${TIDE_SHADE.seam[1].toFixed(2)} * L), seamCov * ${TIDE_SHADE.seam[2].toFixed(2)});
  // ALONG EVERY CREST OF THE LONG SWELL RUNS A LINE OF GLINTS OF THE HALL'S LIGHT, and it goes with the crest:
  // dashes of warm white 2 m long and 3.6 m apart, lying where the carpet's slope along the swell's own bearing is
  // nothing and the carpet stands high (across: metres from the crest, by that slope over the crest's own bend;
  // both ways weighed by the pixel's reach, so that far off the dashes run together into one fine line).
  float across = dot(td.yz, vec2(.7071, .7071)) / (.0175 * e2), fx = max(fwidth(across), .03);
  float along = dot(p, vec2(-.7071, .7071)), fa = max(fwidth(along), .03), da = (fract(along / 3.6) - .5) * 3.6;
  float dash = clamp(min(da + .5 * fa, 1.) - max(da - .5 * fa, -1.), 0., fa) / fa;
  dash = mix(dash, .556, smoothstep(1.2, 3.6, fa));
  float glint = exp(-across * across / (.3 + fx * fx)) * sqrt(.3 / (.3 + fx * fx)) * dash * smoothstep(.3, .7, hN);
  // (the sheen of a skimming view lies on the far carpet only: near the lens the carpet keeps its depth)
  col += uSeam * (.3 * sheen * smoothstep(12., 80., dist) + .3 * crest + .34 * crest2);
  col = mix(col, vec3(1.5, 1.42, 1.2), min(glint, 1.));
  // (round ten) WARMTH. UNDER EVERY DESK LAMP OF THE FLEET A WARM POOL OF LIGHT LIES ON THE CARPET AND RIDES THE SWELL
  // WITH IT (tLamps: the lamps' places on the fleet's own lattice. THE PLACE IS TURNED INTO THE LATTICE'S OWN AXES,
  // back about the stair's axis by the lattice's turn, before its cell is looked up: pL; the place's own cell and
  // the eight round it are asked); round the stair's plinth lies its own pale light, and WHERE THE CARPET MEETS
  // THE PLINTH A FINE PALE LINE goes up and down it with the swell.
  vec2 dS = p - vec2(${STAIR.x.toFixed(1)}, ${STAIR.z.toFixed(1)}), pL = vec2(${STAIR.x.toFixed(1)}, ${STAIR.z.toFixed(1)}) + vec2(dS.x * ${FLEET_C.toFixed(7)} - dS.y * ${FLEET_S.toFixed(7)}, dS.x * ${FLEET_S.toFixed(7)} + dS.y * ${FLEET_C.toFixed(7)});
  vec2 cF = floor(vec2((pL.x - ${(FLEET.x0 + FLEET_SPAN.n0 * FLEET.dx).toFixed(1)}) / ${FLEET.dx.toFixed(1)}, (${(FLEET.z0 - FLEET_SPAN.j0 * FLEET.dz).toFixed(1)} - pL.y) / ${FLEET.dz.toFixed(1)}) + .5);
  float pool = 0.;
  for (int jj = -1; jj <= 1; jj++) for (int ii = -1; ii <= 1; ii++) {
    ivec2 c = ivec2(cF) + ivec2(ii, jj);
    if (c.x < 0 || c.x >= ${FLEET_SPAN.n1 - FLEET_SPAN.n0 + 1} || c.y < 0 || c.y >= ${FLEET_SPAN.j1 - FLEET_SPAN.j0 + 1}) continue;
    vec4 L4 = texelFetch(tLamps, c, 0);
    vec2 pc = pL - vec2(${(FLEET.x0 + FLEET_SPAN.n0 * FLEET.dx).toFixed(1)} + float(c.x) * ${FLEET.dx.toFixed(1)}, ${(FLEET.z0 - FLEET_SPAN.j0 * FLEET.dz).toFixed(1)} - float(c.y) * ${FLEET.dz.toFixed(1)}), d1 = pc - L4.xy, d2 = pc - L4.zw;
    pool += exp(-dot(d1, d1) / 3.6) + exp(-dot(d2, d2) / 3.6);
  }
  vec2 dO = p - vec2(${STAIR.x.toFixed(1)}, ${STAIR.z.toFixed(1)});
  float rO = length(dO);
  pool = min(pool, 1.2);
  col = mix(col, vec3(1., .62, .28) * (.5 + .22 * L), .7 * min(pool, 1.));
  // (round the stair's plinth: a pale light from under its rim, and the fine pale line where the carpet meets it)
  col = mix(col, uSeam * 1.25, .5 * exp(-max(rO - ${STAIR.r.toFixed(1)}, 0.) / 3.5));
  col = mix(col, uSeam * 1.5, 1. - smoothstep(${(STAIR.r + 0.42).toFixed(2)} - a, ${(STAIR.r + 0.5).toFixed(2)} + a, rO));
  gl_FragColor = vec4(mix(col, uFogIn, 1. - exp(-dist * uFogKIn)), 1.);
}`;
export function makeTideUniforms(seed, timeU) {
  const tr = TIDE_TRAINS, r = makeRng(hashSeed('fww-blue:' + seed));
  // the carpet's two blues: ultramarine with cobalt, or cobalt with a violet blue; never green
  const pair = r.chance(0.5) ? ['#2a49c7', '#1e3aa8'] : ['#1e3aa8', '#4a3cc0'];
  return {
    trains: tr,
    uniforms: {
      uTime: timeU, uTr: { value: tr.map((w) => new THREE.Vector4(w.kx, w.kz, w.w, w.ph)) }, uTa: { value: new THREE.Vector2(tr[0].a, tr[1].a) },
      uBlueA: { value: lin(pair[0]) }, uBlueB: { value: lin(pair[1]) }, uSeam: { value: lin('#a4b3f3') },
      uFogIn: { value: lin('#f4f3ee', 0.92) }, uFogKIn: { value: 1 / 900 },
      // (the fleet's lamps: filled by fleetLampsInto once the fleet is dealt)
      tLamps: { value: (() => { const S = FLEET_SPAN, nx = S.n1 - S.n0 + 1, nz = S.j1 - S.j0 + 1, t = new THREE.DataTexture(new Uint16Array(nx * nz * 4).fill(THREE.DataUtils.toHalfFloat(1e4)), nx, nz, THREE.RGBAFormat, THREE.HalfFloatType); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })() },
    },
  };
}

// ---------------------------------------------------------------- what the flown halls show to an eye above them
// WHAT HAS A CEILING FROM BELOW HAS A ROOF FROM ABOVE (round six). Over the corridor we came down and its two arms,
// hall one, the link and hall two stands a WHITE ROOF 1.5 m thick with a low parapet (0.5 m broad, 0.7 m high) round
// its edge; the material rules glowing skylights on it. Each slab: its outer faces from the
// maze's wall tops up, its parapet, its top (hall two's top is laid round the well).
function roofsGeo() {
  const pos = [], nor = [], H1 = P.H1, H2 = P.H2, R = P.ROOF, O = P.OC, W = P.WELL;
  const quad = (v, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); } };
  // (round eight: WHERE ANOTHER ROOF OR A GREAT MOUTH MEETS A SIDE, THAT SIDE IS CUT: cut.s, cut.n (the south side
  // at z1, the north side at z0): [x from, x to, up to which height]; cut.e: [z from, z to, up to which height]. Till
  // now a side ran on through the link, from the wall tops' height up: a band hanging 1.1 m under the link's ceiling
  // before hall two's mouth.)
  const slab = (x0, x1, z0, z1, yTop, top = true, cut = {}) => {
    const yp = yTop + 0.7, w = 0.5, a0 = x0 + w, a1 = x1 - w, b0 = z0 + w, b1 = z1 - w;
    const side = (fixed, lo, hi, n, isX, c) => {
      const pt = (u, y) => (isX ? [fixed, y, u] : [u, y, fixed]);
      const q = (u0, u1, y0, y1) => { if (u1 > u0 + 1e-6 && y1 > y0 + 1e-6) quad([pt(u0, y0), pt(u1, y0), pt(u1, y1), pt(u0, y1)], n); };
      if (!c) { q(lo, hi, R, yp); return; }
      q(lo, c[0], R, yp); q(c[1], hi, R, yp); q(c[0], c[1], c[2], yp);
    };
    side(z1, x0, x1, [0, 0, 1], false, cut.s); side(z0, x0, x1, [0, 0, -1], false, cut.n);
    side(x0, z0, z1, [-1, 0, 0], true, null); side(x1, z0, z1, [1, 0, 0], true, cut.e);
    for (const [p0, p1, q0, q1] of [[x0, x1, z0, b0], [x0, x1, b1, z1], [x0, a0, b0, b1], [a1, x1, b0, b1]]) quad([[p0, yp, q0], [p1, yp, q0], [p1, yp, q1], [p0, yp, q1]], [0, 1, 0]);
    quad([[a0, yTop, b0], [a1, yTop, b0], [a1, yp, b0], [a0, yp, b0]], [0, 0, 1]); quad([[a0, yTop, b1], [a1, yTop, b1], [a1, yp, b1], [a0, yp, b1]], [0, 0, -1]);
    quad([[a0, yTop, b0], [a0, yTop, b1], [a0, yp, b1], [a0, yp, b0]], [1, 0, 0]); quad([[a1, yTop, b0], [a1, yTop, b1], [a1, yp, b1], [a1, yp, b0]], [-1, 0, 0]);
    if (top) quad([[a0, yTop, b0], [a1, yTop, b0], [a1, yTop, b1], [a0, yTop, b1]], [0, 1, 0]);
    return [a0, a1, b0, b1];
  };
  // (round ten: where hall one's roof lay stands the well's own pile of storeys: see towersDeal; the corridor's
  // roof and the link's run into its faces)
  slab(-76.2, -59.8, H2.z1 + 1.2, H1.z0 + 0.6, P.LINK_ROOF, true, { n: [-76.2, -59.8, 1e3], s: [-76.2, -59.8, 1e3] });
  // (round eleven: the corridor's roof runs from the well's pile to the lobby's north face; the arm and the run
  // behind the entry are gone; THE LOBBY'S ROOF stands 19.5 m up, a white block beside the court)
  const LB = P.LOBBY;
  slab(-72.7, -63.3, H1.z1 - 0.6, LB.z0 - 1.2, P.COR_ROOF, true, { s: [-72.7, -63.3, 1e3] });
  slab(LB.x0 - 1.2, LB.x1 + 1.2, LB.z0 - 1.2, LB.z1 + 1.2, LB.roof);
  // hall two's top, laid in wedges from the well's ring out to the parapet
  // (hall two: its south side cut for the link's roof, its east side for the concourse's mouth, 11 m high, with the
  // mouth's head 1.2 m deep)
  const CN = P.CON, [a0, a1, b0, b1] = slab(H2.x0 - 1.2, H2.x1 + 1.2, H2.z0 - 1.2, H2.z1 + 1.2, H2.roof, false, { s: [-76.2, -59.8, P.LINK_ROOF + 0.7], e: [CN.z - CN.w / 2, CN.z + CN.w / 2, 11] }), angs = [], r0 = W.r + W.thick;
  quad([[H2.x1, 11, CN.z - CN.w / 2], [H2.x1 + 1.2, 11, CN.z - CN.w / 2], [H2.x1 + 1.2, 11, CN.z + CN.w / 2], [H2.x1, 11, CN.z + CN.w / 2]], [-1, 0, 0]);
  for (let i = 0; i < 96; i++) angs.push(i / 96 * Math.PI * 2);
  for (const [cx, cz] of [[a0, b0], [a1, b0], [a1, b1], [a0, b1]]) angs.push((Math.atan2(cz - O.z, cx - O.x) + Math.PI * 2) % (Math.PI * 2));
  angs.sort((p, q) => p - q);
  const rim = (a) => [O.x + r0 * Math.cos(a), H2.roof, O.z + r0 * Math.sin(a)];
  const edge = (a) => {
    const c = Math.cos(a), sn = Math.sin(a);
    const t = Math.min(c > 1e-9 ? (a1 - O.x) / c : c < -1e-9 ? (a0 - O.x) / c : 1e9, sn > 1e-9 ? (b1 - O.z) / sn : sn < -1e-9 ? (b0 - O.z) / sn : 1e9);
    return [O.x + t * c, H2.roof, O.z + t * sn];
  };
  for (let i = 0; i < angs.length; i++) { const p = angs[i], q = i + 1 < angs.length ? angs[i + 1] : angs[0] + Math.PI * 2; quad([rim(p), rim(q), edge(q), edge(p)], [0, 1, 0]); }
  return geoOf(pos, nor);
}
// THE WELL: the deep ring (its inner face, its under side, its outer face under the ceiling and over the roof, its
// top) and the twelve slim columns it stands on, from the hall's deep floor up to it
function wellGeo() {
  const pos = [], nor = [], H = P.H2, O = P.OC, W = P.WELL, N = 96, r0 = W.r, r1 = W.r + W.thick;
  const quad = (v, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); } };
  const pt = (r, y, a) => [O.x + Math.cos(a) * r, y, O.z + Math.sin(a) * r];
  for (let i = 0; i < N; i++) {
    const p = i / N * Math.PI * 2, q = (i + 1) / N * Math.PI * 2, m = (p + q) / 2, out = [Math.cos(m), 0, Math.sin(m)], inw = [-out[0], 0, -out[2]];
    quad([pt(r0, W.foot, p), pt(r0, W.foot, q), pt(r0, W.top, q), pt(r0, W.top, p)], inw);
    quad([pt(r0, W.foot, p), pt(r0, W.foot, q), pt(r1, W.foot, q), pt(r1, W.foot, p)], [0, -1, 0]);
    quad([pt(r1, W.foot, p), pt(r1, W.foot, q), pt(r1, H.h, q), pt(r1, H.h, p)], out);
    quad([pt(r1, H.roof, p), pt(r1, H.roof, q), pt(r1, W.top, q), pt(r1, W.top, p)], out);
    quad([pt(r0, W.top, p), pt(r0, W.top, q), pt(r1, W.top, q), pt(r1, W.top, p)], [0, 1, 0]);
  }
  for (const [cx, cz] of WELL_COLS) for (let i = 0; i < 10; i++) {
    const p = i / 10 * Math.PI * 2, q = (i + 1) / 10 * Math.PI * 2, m = (p + q) / 2, c = (a, y) => [cx + W.colR * Math.cos(a), y, cz + W.colR * Math.sin(a)];
    quad([c(p, H.deep), c(q, H.deep), c(q, W.foot), c(p, W.foot)], [Math.cos(m), 0, Math.sin(m)]);
  }
  return geoOf(pos, nor);
}
// A WALL'S CROWN, for an eye above: along the wall's inner face from a to b, with n the way out of the room: the inner
// face carried up from yIn to the top, the top itself 'wide' metres broad, and the outer face down to yOut. Top and
// outer face run on by the wall's own thickness at both ends, so that corners close.
function crown(pos, nor, a, b, n, yIn, yTop, yOut, wide = 1.2) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), t = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const quad = (v, m) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(m[0], m[1], m[2]); } };
  const a2 = [a[0] - t[0] * wide, a[1] - t[1] * wide], b2 = [b[0] + t[0] * wide, b[1] + t[1] * wide];
  const ao = [a2[0] + n[0] * wide, a2[1] + n[1] * wide], bo = [b2[0] + n[0] * wide, b2[1] + n[1] * wide];
  if (yIn < yTop) quad([[a[0], yIn, a[1]], [b[0], yIn, b[1]], [b[0], yTop, b[1]], [a[0], yTop, a[1]]], [-n[0], 0, -n[1]]);
  quad([[a2[0], yTop, a2[1]], [b2[0], yTop, b2[1]], [bo[0], yTop, bo[1]], [ao[0], yTop, ao[1]]], [0, 1, 0]);
  if (yOut < yTop) quad([[ao[0], yOut, ao[1]], [bo[0], yOut, bo[1]], [bo[0], yTop, bo[1]], [ao[0], yTop, ao[1]]], [n[0], 0, n[1]]);
}
// the crowns of the concourse (the flown halls and the link have roofs: see roofsGeo)
function crownsGeo() {
  const pos = [], nor = [], C = P.CON, R = P.ROOF, zA = C.z - C.w / 2, zB = C.z + C.w / 2;
  // the concourse: a thick coping 1.6 m broad on each wall, from hall two to the core's doorway
  crown(pos, nor, [C.x0 + 2.8, zA], [C.x1 - 3, zA], [0, -1], C.h, C.cope, R, 1.6);
  crown(pos, nor, [C.x0 + 2.8, zB], [C.x1 - 3, zB], [0, 1], C.h, C.cope, R, 1.6);
  return geoOf(pos, nor);
}

// ---------------------------------------------------------------- the gardens (round seven)
// WHAT GROWS AND STANDS IN THE GARDENS (hall two's roof garden, the hedged beds of the other roofs, the well's
// balustrade and border, the garden court): plain few-sided bodies in one mesh each, under one look. aG: the kind (0
// a plain body, 1 a lamp's globe: lit, 2 a bed's planting, 3 leaves), the height from which the low light of the
// east reaches it (under it the body stands in its east neighbour's shade), and its foot.
const GARDEN_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aG;
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vG;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  // (round eight: THE LEAVES STIR, each crown by its own place and the clock, more toward its top; A JET OF WATER
  // (kind 4) rises and falls a little and trembles)
  float up = max(w.y - aG.z, 0.);
  if (aG.x > 2.5 && aG.x < 3.5) w.xz += .028 * up * vec2(sin(uTime * 1.1 + w.x * .5 + w.z * .3), cos(uTime * .87 + w.z * .6 - w.x * .2));
  if (aG.x > 3.5) w.y = aG.z + up * (.82 + .18 * sin(uTime * 2.3 + w.x * .9 + w.z * .7)) + .03 * sin(uTime * 11. + w.x * 5.);
  vW = w.xyz; vN = normal; vCol = color; vG = aG;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GARDEN_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vG;
uniform vec3 uFog; uniform float uFogK; uniform vec4 uTow[17];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}
void main(){
  vec3 alb = vCol, n = normalize(vN);
  float kind = vG.x, lamp = step(.5, kind) * step(kind, 1.5), jet = step(3.5, kind), leaf = step(2.5, kind) * step(kind, 3.5);
  float fw = max(fwidth(vW.x) + fwidth(vW.z), .02), hgt = max(vW.y - vG.z, 0.);
  // (a bed's planting: rows of two near greens run down it, seen only near)
  if (kind > 1.5 && kind < 2.5) alb *= 1. + .16 * (step(.5, fract(vW.x / 1.25)) - .5) * (1. - smoothstep(.3, .9, fw));
  // (round nine) LIT BY LAMPS ONLY. What grows and stands here is deep blue-green where no lamp reaches it; A TREE
  // IS LIT FROM BELOW by the standard beside it: the faces of its crown that look down are warm and bright, those
  // that look up stand deep; a trunk, a tub, a bench, a rail take the lamps' light low down. Every lamp's globe is
  // lit warm; under each front of the lights' wave a globe swells.
  vec3 amb = vec3(.2, .27, .5), warm = vec3(1.05, .88, .6);
  float low = exp(-hgt / 4.);
  vec3 light = amb + warm * (leaf > .5 ? (.3 + .9 * smoothstep(.6, -.7, n.y)) * mix(.6, 1.1, low) : .7 * low + .12);
  vec3 col = min(alb * light, vec3(.88));
  float wv = waveHump(vW.x + vW.z);
  vec3 lin3 = mix(lit3(col), vec3(1.5, 1.26, .84) * (.85 + .5 * wv), lamp);
  // (a jet of water: lit from under, a cool white that sparkles along its fall)
  lin3 = mix(lin3, vec3(.8, .92, 1.1) * (.9 + .6 * step(.6, fract(vW.y * 3.1 + uTime * 2.7 + vW.x))), jet);
  gl_FragColor = vec4(nightAir(lin3, cameraPosition, vW - cameraPosition), 1.);
}`;
// the gardens' colours, as the eye reads them
// (a bed in flower: rose, white or lavender; no yellow and no orange bloom)
const BLOOM = [[0.9, 0.5, 0.64], [0.93, 0.92, 0.86], [0.66, 0.55, 0.88]];
const HEDGE = [0.36, 0.62, 0.3], PLANT = [0.22, 0.48, 0.25], LEAF_A = [0.25, 0.53, 0.27], LEAF_B = [0.33, 0.62, 0.31], BARK = [0.44, 0.4, 0.36], STONE = [0.9, 0.88, 0.82], POST = [0.34, 0.36, 0.42], RAIL = [0.93, 0.93, 0.9];
// A TREE'S CROWN (round ten), the same make in the court, on the roofs, down the street and in the rooms: [its radius
// (1 at its broadest), its height (0 at its foot to 1 at its tip)] ring by ring: three swells, two waists
const TREE_PROF = [[0.07, 0], [0.7, 0.07], [1, 0.18], [0.82, 0.31], [0.42, 0.385], [0.76, 0.48], [0.66, 0.62], [0.3, 0.69], [0.52, 0.78], [0.44, 0.88], [0.05, 1]];
// (the same three swells and two waists in seven rings, for a tree seen from far)
const TREE_FAR = [[0.07, 0], [1, 0.17], [0.42, 0.385], [0.76, 0.5], [0.3, 0.69], [0.5, 0.8], [0.05, 1]];
// (a turned body's own normals, ring by ring: [outward, upward], from the profile's slope there)
const latheNormals = (ring) => ring.map((q, j) => { const a = ring[Math.max(j - 1, 0)], b = ring[Math.min(j + 1, ring.length - 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; });
function gardenBuilder() {
  const pos = [], nor = [], col = [], ag = [];
  const v = (p, n, c, g) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); ag.push(g[0], g[1], g[2]); };
  const quad = (a, b, c, d, n, k, g) => { v(a, n, k, g); v(b, n, k, g); v(c, n, k, g); v(a, n, k, g); v(c, n, k, g); v(d, n, k, g); };
  const G = {
    quad,
    // a box without its under side
    box(x0, x1, y0, y1, z0, z1, k, g) {
      quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], k, g);
      G.sides(x0, x1, y0, y1, z0, z1, k, g);
      return G;
    },
    sides(x0, x1, y0, y1, z0, z1, k, g) {
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], k, g); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], k, g);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], k, g); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], k, g);
    },
    // a block about (cx, cz), its length along the heading (tx, tz): half length hl, half width hw
    block(cx, cz, tx, tz, hl, hw, y0, y1, k, g) {
      const c = (a, b, y) => [cx + tx * a - tz * b, y, cz + tz * a + tx * b];
      quad(c(-hl, -hw, y1), c(-hl, hw, y1), c(hl, hw, y1), c(hl, -hw, y1), [0, 1, 0], k, g);
      quad(c(-hl, hw, y0), c(hl, hw, y0), c(hl, hw, y1), c(-hl, hw, y1), [-tz, 0, tx], k, g); quad(c(hl, -hw, y0), c(-hl, -hw, y0), c(-hl, -hw, y1), c(hl, -hw, y1), [tz, 0, -tx], k, g);
      quad(c(hl, hw, y0), c(hl, -hw, y0), c(hl, -hw, y1), c(hl, hw, y1), [tx, 0, tz], k, g); quad(c(-hl, -hw, y0), c(-hl, hw, y0), c(-hl, hw, y1), c(-hl, -hw, y1), [-tx, 0, -tz], k, g);
      return G;
    },
    // an upright body of n flat sides about the plumb through (x, z): radius r0 at y0, r1 at y1 (nought: a point);
    // cap 1: a flat top
    prism(n, x, z, r0, r1, y0, y1, k, g, cap = 0, turn = 0) {
      const sl = (r0 - r1) / Math.max(Math.hypot(r0 - r1, y1 - y0), 1e-6), up = Math.sqrt(Math.max(1 - sl * sl, 0));
      for (let i = 0; i < n; i++) {
        const a0 = turn + i / n * Math.PI * 2, a1 = turn + (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, nn = [Math.cos(am) * up, sl, Math.sin(am) * up];
        const A = [x + r0 * Math.cos(a0), y0, z + r0 * Math.sin(a0)], B = [x + r0 * Math.cos(a1), y0, z + r0 * Math.sin(a1)], C = [x + r1 * Math.cos(a1), y1, z + r1 * Math.sin(a1)], D = [x + r1 * Math.cos(a0), y1, z + r1 * Math.sin(a0)];
        if (r1 > 0 && r0 > 0) quad(B, A, D, C, nn, k, g); else if (r0 > 0) { v(B, nn, k, g); v(A, nn, k, g); v([x, y1, z], nn, k, g); } else { v([x, y0, z], nn, k, g); v(D, nn, k, g); v(C, nn, k, g); }
        if (cap) { v([x, y1, z], [0, 1, 0], k, g); v(C, [0, 1, 0], k, g); v(D, [0, 1, 0], k, g); }
      }
      return G;
    },
    // A HEDGED BED: a clipped hedge 0.7 m broad round its planting, h high, on the ground at y
    bed(x0, x1, z0, z1, y, h, sunY = -99, plant = PLANT) {
      const g = [0, sunY, y], gp = [2, sunY, y], w = Math.min(0.7, (x1 - x0) / 3, (z1 - z0) / 3), t = y + h, a0 = x0 + w, a1 = x1 - w, b0 = z0 + w, b1 = z1 - w, up = [0, 1, 0];
      G.sides(x0, x1, y, t, z0, z1, HEDGE, g);
      quad([x0, t, z0], [x0, t, z1], [a0, t, b1], [a0, t, b0], up, HEDGE, g); quad([x1, t, z1], [x1, t, z0], [a1, t, b0], [a1, t, b1], up, HEDGE, g);
      quad([x0, t, z0], [a0, t, b0], [a1, t, b0], [x1, t, z0], up, HEDGE, g); quad([x0, t, z1], [x1, t, z1], [a1, t, b1], [a0, t, b1], up, HEDGE, g);
      quad([a0, t, b1], [a1, t, b1], [a1, t, b0], [a0, t, b0], up, plant, gp);
      return G;
    },
    // A TREE h high from y (round ten: NO CONE OF FLAT FACETS): a slim trunk and A CROWN OF THREE SOFT TIERS, one over
    // the other, each a rounded swell with a waist between (TREE_PROF): one smooth body of eleven rings, eight-sided,
    // its normals the surface's own; deeper green in the waists, fresher on the swells
    tree(x, z, y, h, sunY, turn = 0) {
      const R = 0.26 * h, gl = [3, sunY, y], n = 8;
      G.prism(3, x, z, 0.035 * h + 0.05, 0.03 * h + 0.04, y, y + 0.36 * h, BARK, [0, sunY, y], 0, turn);
      const ring = TREE_PROF.map(([r, t]) => [r * R, y + (0.3 + 0.7 * t) * h]), nrm = latheNormals(ring);
      const colr = TREE_PROF.map(([r]) => { const t = Math.min(Math.max((r - 0.35) / 0.6, 0), 1); return [0, 1, 2].map((c) => LEAF_A[c] * 0.82 + (LEAF_B[c] - LEAF_A[c] * 0.82) * t); });
      for (let j = 0; j + 1 < ring.length; j++) for (let i = 0; i < n; i++) {
        const p0 = turn + i / n * Math.PI * 2, p1 = turn + (i + 1) / n * Math.PI * 2;
        const at = (jj, a) => [x + ring[jj][0] * Math.cos(a), ring[jj][1], z + ring[jj][0] * Math.sin(a)], nn = (jj, a) => [nrm[jj][0] * Math.cos(a), nrm[jj][1], nrm[jj][0] * Math.sin(a)];
        v(at(j, p1), nn(j, p1), colr[j], gl); v(at(j, p0), nn(j, p0), colr[j], gl); v(at(j + 1, p0), nn(j + 1, p0), colr[j + 1], gl);
        v(at(j, p1), nn(j, p1), colr[j], gl); v(at(j + 1, p0), nn(j + 1, p0), colr[j + 1], gl); v(at(j + 1, p1), nn(j + 1, p1), colr[j + 1], gl);
      }
      return G;
    },
    // A LOW JET OF WATER (round eight): a thin ribbon that rises from (x, z) and falls 1.5 m on, toward (dx, dz),
    // 1.2 m high at its top (kind 4: the shader lets it play)
    jet(x, z, dx, dz, y, h = 1.2, reach = 1.5) {
      const g = [4, -99, y], N = 4, px = -dz * 0.07, pz = dx * 0.07;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, a = [x + dx * reach * u0, y + h * 4 * u0 * (1 - u0), z + dz * reach * u0], b = [x + dx * reach * u1, y + h * 4 * u1 * (1 - u1), z + dz * reach * u1];
        quad([a[0] - px, a[1], a[2] - pz], [a[0] + px, a[1], a[2] + pz], [b[0] + px, b[1], b[2] + pz], [b[0] - px, b[1], b[2] - pz], [0, 1, 0], [0.9, 0.94, 1], g);
      }
      return G;
    },
    // A LAMP STANDARD: a slim post and a warm globe, its middle `h` over y
    standard(x, z, y, h = 4.5) {
      G.prism(4, x, z, 0.1, 0.07, y, y + h - 0.36, POST, [0, -99, y]);
      G.prism(6, x, z, 0.12, 0.42, y + h - 0.4, y + h, [1, 0.86, 0.6], [1, -99, y]).prism(6, x, z, 0.42, 0, y + h, y + h + 0.36, [1, 0.86, 0.6], [1, -99, y]);
      return G;
    },
    get triangles() { return pos.length / 9; },
    build() {
      const g = geoOf(pos, nor);
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3));
      return g;
    },
    // (the same in stages, one attribute to a stage: the page gets a breath between them)
    *buildStages() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      yield null;
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      yield null;
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      yield null;
      g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3));
      return g;
    },
  };
  return G;
}
// WHAT STANDS ON THE ROOFS (round nine: NO BEDS, NO HEDGES: a field of beds read as open country). Hall two's roof is
// a dark paved terrace under the slab, its skylight strips glowing every 9 m. ON IT: A LAMP STANDARD WITH A WARM
// GLOBE on a lattice of 27 m (RG holds the measures), and beside each A CLIPPED TREE IN A STONE TUB, lit from below
// by it (3.4 to 5.2 m, dealt by the stream fww-garden; none within 10 m of the line's plan). ROUND THE WELL: on the
// deep ring's top A BALUSTRADE WITH A HANDRAIL all round (a post every 3.75 degrees, a mid rail), ON IT THIRTY-TWO
// SLIM UPRIGHT BARS OF WARM LIGHT, one over every third post (each a square bar 0.12 m on a side and 1 m high,
// standing on the handrail), and behind
// it A PLANTED BORDER: a clipped hedge 2.4 m broad and 1 m high, 44.6 to 47 m from the axis, open at four places.
// (Built in stages, so that a build can hand the page back between them.)
export function* roofGardenStages(seed) {
  const G = gardenBuilder(), r = makeRng(hashSeed('fww-garden:' + seed)), H = P.H2, Y = H.roof, O = P.OC, W = P.WELL, way = [];
  for (let h = H_RISE; h <= H_DIAG + 80; h += 3) { const q = lineAt(h); way.push(q[0], q[1]); }
  const off = (x, z) => { let d2 = 1e18; for (let k = 0; k < way.length; k += 2) { const dx = x - way[k], dz = z - way[k + 1], q = dx * dx + dz * dz; if (q < d2) d2 = q; } return Math.sqrt(d2); };
  for (let i = -6; i <= 4; i++) for (let m = -8; m <= 2; m++) {
    if (m === -8 && i > -6 && (i + 6) % 2 === 0) yield null;
    const x = RG.strip + 27 * i + 1.35, z = RG.row + 27 * m + 1.05;
    if (!(x > RG.x0 - 2 && x < RG.x1 - 5 && z > RG.z0 - 2 && z < RG.z1 + 2 && Math.hypot(x - O.x, z - O.z) > RG.well + 4)) continue;
    G.standard(x, z, Y);
    // (a tree's height and turn are drawn when the tree is put: a draw only for what is made)
    if (off(x + 3.15, z) >= 10) { const h = r.range(3.4, 5.2), turn = r.range(0, 1); G.prism(8, x + 3.15, z, 1.0, 1.25, Y, Y + 0.9, STONE, [0, -99, Y], 1); G.tree(x + 3.15, z, Y + 0.8, h, -99, turn); }
  }
  yield null;
  // the well's rim
  const N = 96, pt = (rad, y, a) => [O.x + rad * Math.cos(a), y, O.z + rad * Math.sin(a)], gw = [0, -99, W.top];
  for (let i = 0; i < N; i++) {
    if (i % 24 === 23) yield null;
    const p = i / N * Math.PI * 2, q = (i + 1) / N * Math.PI * 2, m = (p + q) / 2, out = [Math.cos(m), 0, Math.sin(m)], inw = [-out[0], 0, -out[2]], rp = W.r + 0.7;
    G.prism(4, O.x + rp * Math.cos(p), O.z + rp * Math.sin(p), 0.07, 0.07, W.top, W.top + 1.08, RAIL, gw, 0, p + 0.785);
    // (the handrail: its top and its two sides; the mid rail: its two sides)
    G.quad(pt(rp - 0.1, W.top + 1.2, p), pt(rp + 0.1, W.top + 1.2, p), pt(rp + 0.1, W.top + 1.2, q), pt(rp - 0.1, W.top + 1.2, q), [0, 1, 0], RAIL, gw);
    G.quad(pt(rp - 0.1, W.top + 1.08, p), pt(rp - 0.1, W.top + 1.08, q), pt(rp - 0.1, W.top + 1.2, q), pt(rp - 0.1, W.top + 1.2, p), inw, RAIL, gw);
    G.quad(pt(rp + 0.1, W.top + 1.08, q), pt(rp + 0.1, W.top + 1.08, p), pt(rp + 0.1, W.top + 1.2, p), pt(rp + 0.1, W.top + 1.2, q), out, RAIL, gw);
    G.quad(pt(rp, W.top + 0.5, p), pt(rp, W.top + 0.5, q), pt(rp, W.top + 0.58, q), pt(rp, W.top + 0.58, p), inw, RAIL, gw);
    if (i % 3 === 0) G.prism(4, O.x + rp * Math.cos(p), O.z + rp * Math.sin(p), 0.12 * Math.SQRT1_2, 0.12 * Math.SQRT1_2, W.top + 1.2, W.top + 2.2, [1, 0.86, 0.6], [1, -99, W.top], 1, p + 0.785);
    // the planted border behind it, open at four places
    const gap = Math.min(Math.abs(Math.sin(m)), Math.abs(Math.cos(m))) * 45.8 < 2.2, ga = [0, -99, Y], t = Y + 1;
    if (!gap) {
      G.quad(pt(44.6, t, p), pt(47, t, p), pt(47, t, q), pt(44.6, t, q), [0, 1, 0], PLANT, [2, -99, Y]);
      G.quad(pt(44.6, Y, p), pt(44.6, Y, q), pt(44.6, t, q), pt(44.6, t, p), inw, HEDGE, ga); G.quad(pt(47, Y, q), pt(47, Y, p), pt(47, t, p), pt(47, t, q), out, HEDGE, ga);
    }
  }
  yield null;
  return yield* G.buildStages();
}

// THE BOULEVARD'S TREES AND LAMP STANDARDS (round eleven), by its own measure: [0 a standard or 1 a tree, s, n].
// DOWN THE STREET a row of standards 8.5 m either side of its middle line, one to every 13 m from the head plaza's
// middle, and beyond each row a row of trees, 10.8 m off the middle line, half way between the standards: none
// within 1 m of a plaza's round, none in the last 3 m before the garden court's wall. ROUND EACH PLAZA A RING, 4.5 m
// in from its wall: a standard to about every 9 m of the ring and a tree half way between; no standard within
// 6.5 m of the boulevard's middle line (the flown line's plan) and no tree within 8.5 m of it.
export function blvdStands() {
  const B = BLVD, out = [];
  const free = (s, n) => Math.hypot(s - B.a.s, n - B.a.n) > B.a.r + 1 && Math.hypot(s - B.b.s, n - B.b.n) > B.b.r + 1 && blvdAt(s, n)[1] < B.zc - 3;
  for (const sd of [-1, 1]) for (let k = 1; k < 16; k++) {
    const s = B.a.s + 13 * k;
    if (free(s, sd * 8.5)) out.push([0, s, sd * 8.5]);
    if (free(s + 6.5, sd * 10.8)) out.push([1, s + 6.5, sd * 10.8]);
  }
  for (const C of [B.a, B.b]) {
    const rr = C.r - 4.5, N = Math.round(2 * Math.PI * rr / 9);
    for (let k = 0; k < N; k++) for (const [kind, f, keep] of [[0, 0, 6.5], [1, 0.5, 8.5]]) {
      const a = (k + f) / N * 2 * Math.PI, s = C.s + rr * Math.cos(a), n = C.n + rr * Math.sin(a);
      if (Math.abs(n) >= keep) out.push([kind, s, n]);
    }
  }
  return out;
}
// THE BOULEVARD'S BODIES (round eleven): ITS PAVING (the two rounds and the straight street as one floor, 3 cm over
// the plan's nought), ITS WALLS (6.9 m, the maze's own height: round the head plaza but for the street's mouth,
// down both sides of the street to the garden court's wall, round the second plaza's far side) and THE TWO PIERS
// OF ITS GATE (1.8 m square, 10.5 m tall, where its walls meet the court's). uv: x the metres along a wall; y: 0
// the paving, 1 a wall, 2 a pier.
function boulevardGeo() {
  const B = BLVD, pos = [], nor = [], uv = [], Y = 0.03, H = P.ROOF;
  const at = (s, n, y) => { const q = blvdAt(s, n); return [q[0], y, q[1]]; };
  // (a way in the boulevard's measure as one in the plan's)
  const dirOf = (ds, dn) => [ds * DCS - dn * DSN, 0, ds * DSN + dn * DCS];
  const tri = (a, b, c, n, ua, ub, uc, k) => { for (const [q, u] of [[a, ua], [b, ub], [c, uc]]) { pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); uv.push(u, k); } };
  const up = [0, 1, 0];
  // the paving
  for (const C of [B.a, B.b]) for (let i = 0; i < 48; i++) {
    const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2;
    tri(at(C.s, C.n, Y), at(C.s + C.r * Math.cos(a1), C.n + C.r * Math.sin(a1), Y), at(C.s + C.r * Math.cos(a0), C.n + C.r * Math.sin(a0), Y), up, 0, 0, 0, 0);
  }
  // (where each side of the street meets the court's wall line)
  const endOf = (n) => (B.zc - B.oz - n * DCS) / DSN, sL = endOf(-B.hw), sR = endOf(B.hw);
  tri(at(B.a.s, -B.hw, Y), at(sL, -B.hw, Y), at(sR, B.hw, Y), up, 0, 0, 0, 0); tri(at(B.a.s, -B.hw, Y), at(sR, B.hw, Y), at(B.a.s, B.hw, Y), up, 0, 0, 0, 0);
  // a wall from one place to the next, its face toward (fs, fn)
  const wall = (s0, n0, s1, n1, fs, fn, l0, l1) => {
    const nn = dirOf(fs, fn), a = at(s0, n0, 0), b = at(s1, n1, 0), c = at(s1, n1, H), d = at(s0, n0, H);
    tri(a, b, c, nn, l0, l1, l1, 1); tri(a, c, d, nn, l0, l1, l0, 1);
  };
  const th = Math.asin(B.hw / B.a.r), s0 = B.a.s + B.a.r * Math.cos(th), half = Math.sqrt(B.b.r * B.b.r - (B.hw + B.b.n) ** 2), ph = Math.asin((-B.hw - B.b.n) / B.b.r);
  // (round a plaza from the angle a0 to a1, its wall's face toward its middle)
  const round = (C, a0, a1, n) => { for (let i = 0; i < n; i++) { const p = a0 + (a1 - a0) * i / n, q = a0 + (a1 - a0) * (i + 1) / n, m = (p + q) / 2; wall(C.s + C.r * Math.cos(p), C.n + C.r * Math.sin(p), C.s + C.r * Math.cos(q), C.n + C.r * Math.sin(q), -Math.cos(m), -Math.sin(m), C.r * p, C.r * q); } };
  round(B.a, th, 2 * Math.PI - th, 44);
  wall(s0, -B.hw, B.b.s - half, -B.hw, 0, 1, s0, B.b.s - half); wall(B.b.s + half, -B.hw, sL, -B.hw, 0, 1, B.b.s + half, sL);
  wall(s0, B.hw, sR, B.hw, 0, -1, s0, sR);
  round(B.b, Math.PI - ph, 2 * Math.PI + ph, 30);
  // the gate's two piers
  for (const [s, n] of [[sL, -B.hw], [sR, B.hw]]) {
    const c = (a, b, y) => at(s + a, n + b, y), w = 0.9, T = 10.5;
    for (const [a0, b0, a1, b1, fs, fn] of [[-w, -w, w, -w, 0, -1], [w, -w, w, w, 1, 0], [w, w, -w, w, 0, 1], [-w, w, -w, -w, -1, 0]]) { const nn = dirOf(fs, fn); tri(c(a0, b0, 0), c(a1, b1, 0), c(a1, b1, T), nn, 0, 0, 0, 2); tri(c(a0, b0, 0), c(a1, b1, T), c(a0, b0, T), nn, 0, 0, 0, 2); }
    tri(c(-w, -w, T), c(w, -w, T), c(w, w, T), up, 0, 0, 0, 2); tri(c(-w, -w, T), c(w, w, T), c(-w, w, T), up, 0, 0, 0, 2);
  }
  const g = geoOf(pos, nor);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
const BLVD_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = normal; vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// THE BOULEVARD'S LOOK (round eleven): A STREET OF WARM LIGHT in the night-like hall; light comes only from things.
const BLVD_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
uniform vec4 uTow[17]; uniform vec3 uStoB[10];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_SLAB}${GLSL_FIELD}${GLSL_BLVD}${GLSL_MIRROR}${GLSL_BRACKET}
// the light a lamp standard lays on the paving d2 (metres squared) from its foot
float poolOf(float d2){ return exp(-d2 / 12.) + .3 * exp(-d2 / 80.); }
// a ring's standard and tree nearest a place rc (from the plaza's middle C: s, n, radius): x the standard's pool
// there, y the tree's bed (metres to its middle)
vec2 ringAt(vec2 sn, vec3 C){
  vec2 r = sn - C.xy;
  float rr = C.z - 4.5, N = floor(6.2831853 * rr / 9. + .5), st = 6.2831853 / N, a = atan(r.y, r.x);
  float a0 = floor(a / st + .5) * st, a1 = (floor(a / st) + .5) * st;
  vec2 p0 = C.xy + rr * vec2(cos(a0), sin(a0)), p1 = C.xy + rr * vec2(cos(a1), sin(a1));
  return vec2(abs(p0.y) >= 6.5 ? poolOf(dot(sn - p0, sn - p0)) : 0., abs(p1.y) >= 8.5 ? length(sn - p1) : 99.);
}
void main(){
  vec2 p = vW.xz, sn = blvdOf(p);
  float fw = max(fwidth(p.x) + fwidth(p.y), .02), near1 = 1. - smoothstep(1.2, 4., fw), jw = max(fw, .03);
  vec3 LAMPW = vec3(1., .84, .56), col, emis = vec3(0.), linW = vec3(0.);
  float wm = 0., wv = waveHump(p.x + p.y) * (1. - smoothstep(8., 30., fw)), bd = blvdD(sn);
  if (vUv.y < .5) {
    // THE PAVING: warm stone in courses of 1.5 m across the street, slabs of 3 m; down its middle A PALER STRIP 4.4 m
    // broad with THE BEADS, one to every 6 m, running by the lights' one law; IN EACH PLAZA rings of a deeper
    // stone every 3 m about its middle and A ROUND POOL: still water, a dark mirror of the slab's lights and of
    // the towers, in a pale kerb 0.9 m broad with a line of turquoise light under its lip (the canal's own make).
    // A POOL OF WARM LIGHT lies under every lamp standard, A ROUND BED OF PLANTING under every tree (see
    // blvdStands: the same places); a glow of light along the walls' feet.
    float s = sn.x, n = sn.y, an = abs(n);
    vec2 ra = sn - BV_A.xy, rb = sn - BV_B.xy;
    float dA = length(ra), dB = length(rb);
    vec2 tj = (.5 - abs(fract(vec2(s / 3. + .5 * floor(n / 1.5), n / 1.5)) - .5)) * vec2(3., 1.5);
    float jt = max(clamp((.03 - tj.x) / jw + .5, 0., 1.), clamp((.03 - tj.y) / jw + .5, 0., 1.)) * clamp(.06 / jw, 0., 1.);
    vec3 stone = vec3(.74, .67, .55) * (1. - .16 * jt);
    // the plazas' rings (not over the street's own middle)
    float inP = max(1. - smoothstep(BV_A.z - .5, BV_A.z, dA), (1. - smoothstep(BV_B.z - .5, BV_B.z, dB)) * smoothstep(9., 9.6, an));
    float dP = dA < BV_A.z ? dA : dB, rg = (.5 - abs(fract(dP / 3.) - .5)) * 3.;
    stone = mix(stone, vec3(.6, .53, .44), inP * clamp((.3 - rg) / jw + .5, 0., 1.) * clamp(.6 / jw, 0., 1.));
    // the street's middle strip, from the head pool's kerb on
    float midS = (1. - smoothstep(2.2 - jw, 2.2 + jw, an)) * smoothstep(${(BLVD.a.pool + 3).toFixed(1)}, ${(BLVD.a.pool + 4).toFixed(1)}, dA) * step(BV_A.x, s + ${(BLVD.a.pool + 3).toFixed(1)});
    stone = mix(stone, vec3(.84, .78, .66), .8 * midS);
    // the lamps' pools: the street's two rows, the two rings
    float k13 = floor((s - BV_A.x) / 13. + .5), sk = BV_A.x + 13. * k13, nk = n < 0. ? -8.5 : 8.5;
    vec2 pk = vec2(sk, nk);
    float okS = step(.5, k13) * step(BV_A.z + 1., length(pk - BV_A.xy)) * step(BV_B.z + 1., length(pk - BV_B.xy)) * step(${BLVD.oz.toFixed(3)} + sk * ${DSN.toFixed(5)} + nk * ${DCS.toFixed(5)}, ${(BLVD.zc - 3).toFixed(1)});
    float gp = okS * poolOf(dot(sn - pk, sn - pk));
    vec2 rA = ringAt(sn, BV_A), rB = ringAt(sn, BV_B);
    gp += rA.x + rB.x;
    // the trees' beds: the street's two rows, the two rings
    float k65 = floor((s - BV_A.x - 6.5) / 13. + .5), st = BV_A.x + 6.5 + 13. * k65, nt = n < 0. ? -10.8 : 10.8;
    vec2 pt = vec2(st, nt);
    float okT = step(.5, k65) * step(BV_A.z + 1., length(pt - BV_A.xy)) * step(BV_B.z + 1., length(pt - BV_B.xy)) * step(${BLVD.oz.toFixed(3)} + st * ${DSN.toFixed(5)} + nt * ${DCS.toFixed(5)}, ${(BLVD.zc - 3).toFixed(1)});
    float dBed = min(okT > .5 ? length(sn - pt) : 99., min(rA.y, rB.y));
    gp = min(gp * (.8 + .4 * wv), 1.);
    float foot = exp(min(bd, 0.) / 1.8);
    col = stone * (vec3(.3, .33, .5) + LAMPW * (.2 + .95 * gp + .3 * foot));
    col = mix(col, vec3(.8, .78, .72) * (.5 + .5 * gp), (1. - smoothstep(1.75 - jw, 1.75 + jw, dBed)));
    col = mix(col, vec3(.1, .2, .13) + vec3(.1, .16, .08) * gp, (1. - smoothstep(1.45 - jw, 1.45 + jw, dBed)));
    // the beads
    float k6 = (floor(s / 6.) + .5) * 6., db2 = (s - k6) * (s - k6) + n * n, rbd = max(.9, .8 * fw), bw = waveHump(p.x + p.y);
    col = mix(col, vec3(1., .97, .88), .75 * midS * exp(-db2 / (rbd * rbd)) * min(.9 / rbd, 1.) * (.45 + .55 * bw));
    emis += vec3(1., .94, .8) * 2.6 * midS * exp(-db2 / .3) * (.35 + .65 * bw) * near1;
    // the pools
    float rP = dA < BV_A.z ? ${BLVD.a.pool.toFixed(1)} : ${BLVD.b.pool.toFixed(1)}, dW = dP - rP, eb = max(.6 * fw, .03);
    float inRound = dA < BV_A.z || dB < BV_B.z ? 1. : 0.;
    float water = inRound * (1. - smoothstep(-eb, eb, dW)), inK = inRound * (1. - smoothstep(.9 - eb, .9 + eb, dW));
    float edgeL = inRound * (1. - smoothstep(.09, .09 + 2. * eb, abs(dW + .05))) * clamp(.3 / eb, 0., 1.), edgeG = inRound * exp(-abs(dW) / 1.3);
    vec3 kerbC = (vec3(.5, .54, .68) + LAMPW * .3 * gp) * (1. - .22 * (1. - smoothstep(0., .15, dW))) + vec3(.04, .46, .46) * edgeG;
    vec2 pr = dA < BV_A.z ? ra : rb;
    float rip = (sin(pr.x * 1.9 + pr.y * .7 - uTime * .8) + sin(pr.x * 1.1 - pr.y * 1.3 + uTime * .6) + .6 * sin(pr.x * 3.1 + pr.y * 2.3 + uTime * 1.1)) * (1. - smoothstep(.25, 1.2, fw));
    vec3 dv = normalize(vW - cameraPosition);
    linW = mirrorLight(vW, dv, rip) + vec3(.003, .06, .065) * edgeG * edgeG + vec3(.25, 1.25, 1.2) * edgeL;
    wm = water * inK;
    col = mix(col, kerbC, inK);
    emis = emis * (1. - inK) + vec3(.25, 1.25, 1.2) * edgeL * near1;
  } else if (vUv.y < 1.5) {
    // THE WALLS: pale stone in the lamps' light: a warm lamp on a bracket every 6.5 m, 3.6 m up, with its light
    // on the wall; between every two pairs of lamps a door 3.6 m wide and 5 m high, its leaf in the paler colour
    // of one of the floors; a line of light under the coping; brighter toward the lit paving
    // (the bracket lamp's one law: an upright soft bar, to 1/e 0.16 m broad and 1 m high either way, in a wash that
    // falls to 1/e 1.2 m to either side and 3.6 m up and down: it reaches the wall's foot. The wash takes no fade
    // here. Far off the bar, 0.16 m broad and far under a pixel there, fades to ITS OWN MEAN over the wall of its
    // bay, 6.5 m long and 6.9 m high (${bracketMean(6.5, 3.6, 6.9, BRACKET.bar).toFixed(4)}, counted), never to nought)
    float al = vUv.x, y = vW.y, da = al - (floor(al / 6.5) + .5) * 6.5, dy = y - 3.6, gl = bracketWash(da, dy);
    float dc = floor(al / 13. + .5) * 13., eD = max(fw, .04);
    float inD = (1. - smoothstep(1.8 - eD, 1.8 + eD, abs(al - dc))) * (1. - smoothstep(5. - eD, 5. + eD, y)) * (1. - smoothstep(.6, 1.6, fw));
    vec3 leaf = uPal[1 + int(h21(vec2(dc, 4.7)) * 5.999)];
    col = mix(vec3(.5, .5, .58) * mix(1., .72, y / 6.9), mix(vec3(.9), leaf, .55) * .62, inD);
    col = mix(col, LAMPW * .92, .7 * gl) + LAMPW * .14 * gl;
    float top = 1. - smoothstep(.1, .1 + max(fwidth(y), .02), abs(y - 6.5));
    col = mix(col, vec3(1., .9, .68), .8 * top);
    emis = vec3(1., .8, .5) * 1.5 * mix(${bracketMean(6.5, 3.6, 6.9, BRACKET.bar).toFixed(4)}, bracketBar(da, dy), near1) + vec3(1., .86, .6) * .9 * top * near1;
  } else {
    // A PIER OF THE GATE: pale stone lit from below, A BAND OF WARM LIGHT round its head
    float y = vW.y, band = smoothstep(8.9, 9.05, y) * (1. - smoothstep(10., 10.15, y)) * step(vN.y, .5);
    col = vec3(.78, .76, .72) * mix(vec3(.75, .7, .62), vec3(.34, .38, .56), smoothstep(0., 9., y));
    col = mix(col, vec3(.2, .24, .44), step(.5, vN.y));
    emis = vec3(1., .84, .56) * 1.9 * band;
    col = mix(col, vec3(1., .9, .68), band);
  }
  col = min(col, vec3(.93));
  gl_FragColor = vec4(nightAir(mix(lit3(col) + emis, linW, wm), cameraPosition, vW - cameraPosition), 1.);
}`;
// WHAT STANDS IN THE GARDEN COURT (round nine: A PAVED COURT IN THE NIGHT-LIKE HALL; no lawn, no ranks of trees to
// the walls, no hedge). TWO RANKS OF TREES that go round with the canal on each side, 16 and 22.5 m from its middle
// line, a tree every 6.5 m of a rank, 7.2 to 9 m tall (the stream fww-court deals them); NONE WITHIN 12 m OF THE
// LINE'S PLAN (the nearest trunk 16 m, its crown's edge 13.6 m), none within 3.2 m of a wall; each lit from below.
// LAMP STANDARDS WITH WARM GLOBES, 5 m, one to each 12 m of the canal on both sides, 9 m from its middle line;
// between every two a STONE BENCH that looks over the water. BEYOND THE RANKS, to the walls: a lattice of 26 m, and
// at every place of it that lies 30 m or more from the canal A LAMP STANDARD WITH TWO TREES IN STONE TUBS beside it
// (5.2 to 7 m), 6 m off on either hand, lit from below by it: the sheet lays the same lamps' pools on the paving.
// Returns the mesh's geometry and each tree's and standard's own shade for the shades' mesh (as things of the
// furnishing).
export function* courtGardenStages(seed) {
  const G = gardenBuilder(), r = makeRng(hashSeed('fww-court:' + seed)), C = COURT, trees = [], shades = [];
  for (const side of [-1, 1]) for (let j = 0; j < 2; j++) {
    const n = side * (16 + 6.5 * j), rad = TURN_DOWN + n, spots = [];
    for (let s = C.head - 3.25; s > C.head - 200; s -= 6.5) spots.push(canalPlace(s, n));
    for (let a = 3.25 / rad; a < DIAG; a += 6.5 / rad) spots.push(canalPlace(C.head + a * TURN_DOWN, n));
    for (let s = C.head + C.arc + 3.25; s < C.head + C.arc + 30; s += 6.5) spots.push(canalPlace(s, n));
    for (const q of spots) if (q[0] > C.x0 + 3.2 && q[0] < C.x1 - 3.2 && q[1] > C.z0 + 3.2 && q[1] < C.z1 - 3.2) trees.push({ x: q[0], z: q[1], h: r.range(7.2, 9), turn: r.range(0, 1), y: 0 });
  }
  yield null;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 8; i++) {
    const x = C.x0 + (i + 0.5) * 26, z = C.z0 + (j + 0.5) * 26;
    if (x > C.x1 - 8 || z > C.z1 - 8 || canalAt(x, z)[0] < 30) continue;
    // (the two trees' heights and turns are drawn when the place is kept: a draw only for what is made)
    const hA = r.range(5.2, 7), hB = r.range(5.2, 7), tA = r.range(0, 1), tB = r.range(0, 1);
    G.standard(x, z, 0, 5);
    shades.push([9, x, z, 0, 1, 1, 0, 0, 0]);
    const ew = (i + j) % 2 === 0;
    for (const [sg, h, turn] of [[-1, hA, tA], [1, hB, tB]]) {
      const tx = x + (ew ? 6 * sg : 0), tz = z + (ew ? 0 : 6 * sg);
      G.prism(8, tx, tz, 1.2, 1.5, 0, 1.0, STONE, [0, -99, 0], 1);
      trees.push({ x: tx, z: tz, h, turn, y: 0.9 });
    }
  }
  yield null;
  let nt = 0;
  for (const t of trees) {
    if (++nt % 16 === 0) yield null;
    G.tree(t.x, t.z, t.y, t.h, -99, t.turn);
    shades.push([6, t.x, t.z, 0, 1, t.h / 5.5, 0, 0, 0]);
  }
  yield null;
  for (let s = 6; s < C.len - 2; s += 12) for (const sd of [-1, 1]) {
    const q = canalPlace(s, 9 * sd);
    G.standard(q[0], q[1], 0, 5);
    shades.push([9, q[0], q[1], 0, 1, 1, 0, 0, 0]);
  }
  for (let s = 12; s < C.len - 5; s += 12) for (const sd of [-1, 1]) { const q = canalPlace(s, 9.3 * sd); G.block(q[0], q[1], q[2], q[3], 1.4, 0.3, 0, 0.5, STONE, [0, -99, 0]); }
  // LOW JETS ALONG BOTH EDGES OF THE CANAL (round eight), one to every 3 m, each rising at the kerb and falling
  // 1.5 m in toward the water's middle; lit
  for (let s = 1.5; s < C.len - 1; s += 3) for (const sd of [-1, 1]) {
    const q = canalPlace(s, (C.hw - 0.25) * sd), q2 = canalPlace(s, (C.hw - 1.25) * sd);
    G.jet(q[0], q[1], q2[0] - q[0], q2[1] - q[1], 0.05);
  }
  yield null;
  {
    // THE TWO RANKS RUN ON DOWN THE STREET TO THE FORECOURT (round eight): a tree every 6.5 m, 6.7 m either side of
    // the street's axis (5.6 to 6.4 m tall: under the walls' tops), and IN THE TREES' OWN RANK a lamp standard every
    // 13 m, half way between two trees (round eleven: nothing stands nearer the street's axis than the trees do, so
    // the lane under the line is clear from kerb to kerb): each tree is lit from below by the standards beside it.
    // BESIDE THE FORECOURT'S POOL three standards a side, and
    // ALONG ITS TWO LONG EDGES A ROW OF LOW JETS, one to every 3 m.
    const S = P.STREET, F = P.FORE, W = P.POOL;
    for (const sd of [-1, 1]) {
      const z = S.z + sd * 6.7;
      yield null;
      for (let x = S.x0 + 4.5; x < F.x0 - 2; x += 6.5) G.tree(x, z, 0, r.range(5.6, 6.4), -99, r.range(0, 1));
      for (let x = S.x0 + 7.75; x < F.x0 - 2; x += 13) G.standard(x, z, 0, 5);
      for (let x = F.x0 + 5; x < S.x1 - 7; x += 9) G.standard(x, S.z + sd * (W.hw + 4), 0, 5);
      for (let x = W.x0 + 1.5; x < W.x1 - 1; x += 3) G.jet(x, S.z + sd * (W.hw - 0.25), 0, -sd, 0.05);
    }
  }
  yield null;
  // THE BOULEVARD'S (round eleven: see blvdStands): standards of 5 m, trees of 7.6 to 9 m (the lens passes at 13 m)
  for (const [kind, s, n] of blvdStands()) {
    const q = blvdAt(s, n);
    if (kind === 0) { G.standard(q[0], q[1], 0, 5); shades.push([9, q[0], q[1], 0, 1, 1, 0, 0, 0]); }
    else { const h = r.range(7.6, 9); G.tree(q[0], q[1], 0, h, -99, r.range(0, 1)); shades.push([6, q[0], q[1], 0, 1, h / 5.5, 0, 0, 0]); }
  }
  yield null;
  {
    // THE HERO'S TERRACE (round eleven): A LOW STONE PARAPET along its edge and A LAMP STANDARD over each of its flush
    // lights (one to every 9 m, 1.5 m in from the kerb: the sheet's own law); not where the concourse and the rooms
    // behind its doors run into the hero's west face
    const K = P.CORE, e = K.r + 10 + 0.14 * K.r, gapW = P.CON.w / 2 + 9.6 + 1;
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const west = nx < 0, spans = west ? [[-e, -gapW], [gapW, e]] : [[-e, e]];
      for (const [a0, a1] of spans) G.block(K.x + nx * (e - 0.3) - nz * (a0 + a1) / 2, K.z + nz * (e - 0.3) + nx * (a0 + a1) / 2, -nz, nx, (a1 - a0) / 2, 0.2, P.ROOF, P.ROOF + 1.1, STONE, [0, -99, P.ROOF]);
      for (let k = -8; k < 8; k++) {
        const a = 9 * (k + 0.5);
        if (Math.abs(a) > e - 1.5 || (west && Math.abs(a) < gapW)) continue;
        G.standard(K.x + nx * (e - 1.5) - nz * a, K.z + nz * (e - 1.5) + nx * a, P.ROOF, 4.5);
      }
    }
  }
  yield null;
  const geo = yield* G.buildStages();
  return { geo, shades, trees };
}

// ---------------------------------------------------------------- what stands in the rooms near the line
// THE SAME PLAN AS THE SHEET'S LAW, read here cell by cell: every room, long narrow room, small room and hall whose
// middle lies within `reach` metres of the line where it flies above the ceilings and looks down into the rooms (from
// the rise to H_OVER: round seven; the low flight through the court and the street sees no room's floor), and that
// no flown hall cuts.
// Each: { x0, x1, z0, z1, kind (0 room, 1 hall), d (metres to the line) }.
export function roomsNear(maze, reach, towers = [P.CORE, P.TOWB]) {
  const st = roomsNearStages(maze, reach, towers);
  let s = st.next();
  while (!s.done) s = st.next();
  return s.value;
}
// (the same in stages: the page gets a breath after every ten rows of cells)
export function* roomsNearStages(maze, reach, towers = [P.CORE, P.TOWB]) {
  const D = maze.data, at = maze.at, X0 = P.MAZE_X0, Z0 = P.MAZE_Z0, out = [], way = [];
  for (let h = H_RISE; h <= H_OVER; h += 6) { const q = lineAt(h); way.push(q[0], q[1]); }
  let ax = 1e9, bx = -1e9, az = 1e9, bz = -1e9;
  for (let k = 0; k < way.length; k += 2) { ax = Math.min(ax, way[k]); bx = Math.max(bx, way[k]); az = Math.min(az, way[k + 1]); bz = Math.max(bz, way[k + 1]); }
  // what is built along the line (BUILT_BOXES: the flown halls with the walls round them, what lies under a roof
  // beside the first stretch), each tower's inner square: [x0, x1, z0, z1]
  const solid = BUILT_BOXES.map((b) => [b[0], b[2], b[1], b[3]]);
  for (const T of towers) solid.push([T.x - T.r * 0.9, T.x + T.r * 0.9, T.z - T.r * 0.9, T.z + T.r * 0.9]);
  // metres from a place to the way
  const off = (x, z) => { let d2 = 1e18; for (let k = 0; k < way.length; k += 2) { const dx = x - way[k], dz = z - way[k + 1], q = dx * dx + dz * dz; if (q < d2) d2 = q; } return Math.sqrt(d2); };
  const push = (x0, x1, z0, z1, kind) => {
    for (const b of solid) if (x0 < b[1] && x1 > b[0] && z0 < b[3] && z1 > b[2]) return;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, d = off(cx, cz);
    // (a room whose middle lies within the boulevard is no room)
    if (blvdD(cx, cz) < 0) return;
    if (d < reach) out.push({ x0, x1, z0, z1, kind, d });
  };
  const i0 = Math.max(2, Math.floor((ax - reach - X0) / 26) - 3), i1 = Math.min(253, Math.ceil((bx + reach - X0) / 26) + 1);
  const j0 = Math.max(2, Math.floor((az - reach - Z0) / 26) - 2), j1 = Math.min(253, Math.ceil((bz + reach - Z0) / 26) + 1);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (i === i0 && (j - j0) % 10 === 9) yield null;
    const k = at(i, j), c = D[k], a = D[k + 3], ox = X0 + 26 * i, oz = Z0 + 26 * j;
    // (a cell whose middle lies further off than the reach and a hall's own length holds nothing within the reach)
    if (off(ox + 13, oz + 13) > reach + 90) continue;
    if (c & 128) {
      // (the garden court holds its own garden: see courtGarden)
      if (!(a & 128) && ((a >> 2) & 3) === 0 && ((a >> 4) & 1) === 0 && ((a >> 6) & 1) === 0) push(ox + 4.7, ox + 26 * (2 + ((a >> 5) & 1)) - 4.7, oz + 4.7, oz + 26 * 2 - 4.7, 1);
    } else {
      // (the block between the cell's four bands; where an avenue narrows it, fewer rooms across: see mazeRoom)
      const b0x = hbW(i, j), b0z = hbN(i, j), bsx = 26 - b0x - hbW(i + 1, j), bsz = 26 - b0z - hbN(i, j + 1);
      const nx = Math.min(((c >> 3) & 3) + 1, Math.max(Math.floor(bsx / 5.5), 1)), nz = Math.min(((c >> 5) & 3) + 1, Math.max(Math.floor(bsz / 5.5), 1)), tx = bsx / nx, tz = bsz / nz;
      for (let v = 0; v < nz; v++) for (let u = 0; u < nx; u++) push(ox + b0x + u * tx + (u > 0 ? 0.6 : 0), ox + b0x + (u + 1) * tx - (u < nx - 1 ? 0.6 : 0), oz + b0z + v * tz + (v > 0 ? 0.6 : 0), oz + b0z + (v + 1) * tz - (v < nz - 1 ? 0.6 : 0), 0);
    }
    // (a line that holds no lane is a long narrow room between its two nodes, each node as broad as the broader of
    // the two stretches of the crossing line that meet at it; an avenue always holds its street)
    const nz0 = Math.max(hbN(i, j), hbN(i - 1, j)), nz1 = Math.max(hbN(i, j + 1), hbN(i - 1, j + 1)), nx0 = Math.max(hbW(i, j), hbW(i, j - 1)), nx1 = Math.max(hbW(i + 1, j), hbW(i + 1, j - 1));
    if (!(c & 1) && !(a & 1)) push(ox - 3.5, ox + 3.5, oz + nz0, oz + 26 - nz1, 0);
    if (!(c & 2) && !(a & 2)) push(ox + nx0, ox + 26 - nx1, oz - 3.5, oz + 3.5, 0);
    if (!(c & 4) && (a & 3) !== 3) push(ox - 3.5, ox + 3.5, oz - 3.5, oz + 3.5, 0);
  }
  return out;
}
// THE FURNISHING. Every room within 160 m of the line holds things a stranger can name from above: rows of desks, a
// long table with its chairs, cabinets along a wall, sofas round a low table, a tree in a tub, stacks of chairs. A
// hall within 160 m holds a field of desks; from 160 to 400 m a hall holds a few large things only. (The line: where
// it looks down into the rooms, see roomsNear.) WITHIN 60 m OF IT a room is furnished richly: about one and a half
// times the things. (The garden court has its own garden; nothing of this stands within the boulevard or within 2 m
// of its walls.)
// LIT LAMPS IN EVERY ROOM (round five): within 110 m of the line a standing lamp stands at every place of the room's
// own lattice (the sheet's law: one to each 9 m of its length and of its width, 0.3 of the cell from the west, 0.7
// toward the south); a thing that would stand on a lamp's place is left out. TREES (round five): a tree in a room is
// lower than 6 m; within 20 m of the line's plan nothing stands taller than the walls.
// Kinds: 0 desk (with its chair and lamp), 1 long table, 2 chair, 3 cabinet, 4 sofa, 5 low round table, 6 tree in a
// tub, 7 stack of chairs, 8 standing lamp. Each: [kind, x, z, heading, length (a long table's), size, in a wall's
// or a tower's shade (0 to 1), metres along its shade's way to its room's west or north wall, 0].
export const LAMP_REACH = 110;
export function furnishDeal(seed, maze, rooms = null, towers = towersDeal(seed)) {
  const st = furnishDealStages(seed, maze, rooms, towers);
  let s = st.next();
  while (!s.done) s = st.next();
  return s.value;
}
// (the same deal in stages, draw for draw: the page gets a breath after every hundred rooms)
export function* furnishDealStages(seed, maze, rooms = null, towers = towersDeal(seed)) {
  const r = makeRng(hashSeed('fww-furnish:' + seed)), out = [], way = [];
  if (!rooms) rooms = roomsNear(maze, 400, towers);
  for (let h = H_RISE; h <= H_END; h += 4) { const q = lineAt(h); way.push(q[0], q[1]); }
  // (metres from a place to the whole line's plan from the rise on: the trees' rule)
  const off = (x, z) => { let d2 = 1e18; for (let k = 0; k < way.length; k += 2) { const dx = x - way[k], dz = z - way[k + 1], q = dx * dx + dz * dz; if (q < d2) d2 = q; } return Math.sqrt(d2); };
  let nr = 0;
  for (const R of rooms) {
    if (++nr % 100 === 0) yield null;
    const w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, along = w >= d ? 0 : Math.PI / 2, M = Math.max(w, d), m = Math.min(w, d);
    // the room's lamps, by the sheet's own law
    const lamps = [], nlx = Math.min(Math.max(Math.floor(w / 9 + 0.5), 1), 8), nlz = Math.min(Math.max(Math.floor(d / 9 + 0.5), 1), 8), cw = w / nlx, cd = d / nlz;
    const offTowers = (x, z, c) => !towers.some((T) => Math.max(Math.abs(x - T.x), Math.abs(z - T.z)) < T.r + c);
    if (R.d < LAMP_REACH) for (let j = 0; j < nlz; j++) for (let i = 0; i < nlx; i++) { const lx = R.x0 + (i + 0.3) * cw, lz = R.z0 + (j + 0.7) * cd; if (offTowers(lx, lz, 3.5)) lamps.push([lx, lz, 3.5]); }
    // (round eight: NO ROOM NEAR THE LINE STANDS UNLIT. A remnant room at a tower's own foot, every lamp place of
    // which lies within 3.5 m of the tower's wall, gets one lamp in a corner that stands 0.9 m and more off that wall)
    if (R.d < 100 && R.kind !== 1 && lamps.length === 0) for (const [fx, fz] of [[0.3, 0.7], [0.2, 0.8], [0.8, 0.8], [0.2, 0.2], [0.8, 0.2]]) { const lx = R.x0 + fx * w, lz = R.z0 + fz * d; if (offTowers(lx, lz, 0.9)) { lamps.push([lx, lz, 0.9]); break; } }
    // a thing at a place of the plan (a room that a tower's foot cuts keeps the things that stand clear of its walls:
    // 3.5 m and more off it)
    const set = (k, x, z, yaw, len, size, clear = 3.5) => {
      for (const T of towers) if (Math.max(Math.abs(x - T.x), Math.abs(z - T.z)) < T.r + clear + (k === 1 ? len * size / 2 : 0)) return;
      if (blvdD(x, z) < 2 + (k === 1 ? len * size / 2 : FURN_FOOT[k][0] * size)) return;
      if (k !== 8) {
        const cs = Math.cos(yaw), sn = Math.sin(yaw), fx = FURN_FOOT[k][0] * (k === 1 ? len : 1) * size + 0.3, fz = FURN_FOOT[k][1] * size + 0.3;
        for (const L of lamps) { const dx = L[0] - x, dz = L[1] - z; if (Math.abs(dx * cs - dz * sn) < fx && Math.abs(dx * sn + dz * cs) < fz) return; }
      }
      if (k === 6) {
        // (no tree stands within 10 m of the line's plan: the lens passes over a room's things, not through a crown;
        // and none under a glass roof beside the boulevard: a crown would stand against the glass)
        const dl = off(x, z);
        if (dl < 10 || blvdD(x, z) < BLVD.lid + 2) return;
        size = Math.min(size, R.kind !== 1 ? 1.05 : dl < 22 ? 1.2 : 9);
      }
      out.push([k, x, z, yaw, len, size, 0, 0, 0]);
    };
    // a place of the room in its own frame: a metres along its longer side, b across, from its middle
    const put = (k, a, b, yaw = 0, len = 1, size = 1) => set(k, cx + (along ? -b : a), cz + (along ? a : b), yaw - along, len, size);
    // (a room that is given nothing, one that is no hall and lies 160 m and more from the line, draws nothing)
    const given = R.kind === 1 || R.d < 160, pick = given ? r() : 0, flip = given && r.chance(0.5) ? Math.PI : 0, sg = flip ? -1 : 1, rich = R.d < 60, n0 = out.length;
    const desks = (pa, pb, maxA, maxB, b0 = 0) => {
      const na = Math.min(maxA, Math.floor((M - 1.2) / pa)), nb = Math.min(maxB, Math.floor((m - 0.8) / pb));
      for (let v = 0; v < nb; v++) for (let u = 0; u < na; u++) put(0, (u - (na - 1) / 2) * pa, b0 + (v - (nb - 1) / 2) * pb, flip);
      return na * nb;
    };
    const table = (b0, len, size = 1) => {
      // (a table that would stand on a lamp's place stands a little to one side of it)
      let b = b0;
      for (const sh of [0, -1.4, 1.4, -2.8, 2.8]) {
        b = b0 + sh;
        if (!lamps.some((L) => { const la = along ? L[1] - cz : L[0] - cx, lb = along ? cx - L[0] : L[1] - cz; return Math.abs(la) < len / 2 + 0.5 && Math.abs(lb - b) < 1.3 * size + 0.6; })) break;
      }
      if (Math.abs(b) > m / 2 - 1.3 * size - 0.3) return;
      put(1, 0, b, 0, len / size, size);
      for (let u = -len / 2 + 1.3 * size; u < len / 2 - 0.4 * size; u += 2.6 * size) { put(2, u, b - 2.1 * size, 0, 1, size); put(2, u, b + 2.1 * size, Math.PI, 1, size); }
    };
    const cabinets = (b, yaw) => { const n = Math.floor((M - 1.2) / 2.4); for (let u = 0; u < n; u++) put(3, (u - (n - 1) / 2) * 2.4, b, yaw); };
    const stacks = (na, nb) => { for (let v = 0; v < nb; v++) for (let u = 0; u < na; u++) put(7, (u - (na - 1) / 2) * 2, (v - (nb - 1) / 2) * 2, flip); };
    // (the layouts' own lamps of round four are the lattice's now)
    const lamp = () => {};
    if (R.kind === 1) {
      if (R.d < 160) {
        // a field of desks on the lamps' lattice: two to a cell and one to the next, turn about
        for (let j = 0; j < nlz; j++) for (let i = 0; i < nlx; i++) for (const [fa, fb] of (i + j) % 2 ? [[0.75, 0.25]] : [[0.75, 0.75], [0.25, 0.25]]) set(0, R.x0 + (i + fa) * cw, R.z0 + (j + fb) * cd - 0.475 * sg, flip, 1, 1);
      } else {
        // far off: a few large things: great trees, a ring of long sofas, one very long table
        for (const [sa, sb] of [[-1, -1], [1, 1]]) put(6, sa * M * 0.3, sb * m * 0.28, r.range(0, 6.28), 1, 2.6);
        if (pick < 0.5) put(1, 0, 0, 0, M * 0.5, 2); else for (let u = 0; u < 4; u++) put(4, Math.cos(u * 1.5708) * 9, Math.sin(u * 1.5708) * 9, -u * 1.5708 - 1.5708, 1, 2.2);
      }
    } else if (rich) {
      const eA = M / 2 - 0.85, eB = m / 2 - 0.85;
      if (M < 8.2) {
        // a small room: a desk and a standing lamp; a tree, a chair and a lamp; stacks of chairs and a lamp; cabinets
        if (pick < 0.3 && m > 4.2) { put(0, 0, 0, flip); if (M >= 7) lamp(eA, -sg * eB); }
        else if (pick < 0.55) { if (M >= 7) { put(6, -M / 2 + 1.9, 0, r.range(0, 6.28)); put(2, M / 2 - 1.7, -0.5, -Math.PI / 2); lamp(eA, eB); } else put(6, 0, 0, r.range(0, 6.28)); }
        else if (pick < 0.8) { stacks(2, m > 4.5 ? 2 : 1); if (M >= 7) lamp(eA, eB); }
        else { cabinets(-m / 2 + 0.7, 0); if (m > 4.8) put(2, 0, 0.6, Math.PI); lamp(eA, eB); }
      } else if (m < 6) {
        // a long narrow room: three desks down it (the outer two 1.5 m and more inside its end walls: round eleven;
        // they stood 4.4 m from its middle whatever its length, and in a room under 10 m long each stood in a wall);
        // cabinets facing a row of chairs; stacks
        if (pick < 0.4) { for (let u = -1; u <= 1; u++) put(0, u * Math.min(4.4, M / 2 - 1.5), -0.475 * sg, flip); lamp(eA, 0); lamp(-eA, 0); }
        else if (pick < 0.75) { cabinets(-m / 2 + 0.7, 0); for (let u = -2; u <= 2; u++) put(2, u * 2.6, m / 2 - 0.9, Math.PI); lamp(eA, eB); }
        else { stacks(3, 2); put(6, M / 2 - 2, 0, 0); put(6, -M / 2 + 2, 0, 0); lamp(3.9, 0); lamp(-3.9, 0); }
      } else if (m < 10) {
        if (pick < 0.3) { for (let u = -1; u <= 1; u++) put(0, u * Math.min(4.4, M / 2 - 1.5), 0.9 * sg, flip); cabinets(-sg * (m / 2 - 0.7), 0); lamp(eA, 0); lamp(-eA, 0); }
        else if (pick < 0.5) { table(0, Math.min(M - 3.4, 11)); lamp(M / 2 - 1.3, 0); lamp(-M / 2 + 1.3, 0); }
        else if (pick < 0.84) {
          // two rings of sofas with their low tables, a tree between them, a lamp at each end
          for (const a of [-4.1, 4.1]) { put(4, a, -(m / 2 - 1.15), 0); put(4, a, m / 2 - 1.15, Math.PI); put(5, a, 0); }
          put(6, 0, 0, r.range(0, 6.28), 1, 0.9); lamp(eA, 0); lamp(-eA, 0);
        } else { cabinets(-m / 2 + 0.7, 0); for (let u = -1; u <= 1; u++) put(6, u * 5, 1.1, r.range(0, 6.28), 1, 1.1); lamp(eA, eB); lamp(-eA, eB); }
      } else {
        if (pick < 0.32) desks(4.9, 3.9, 3, 4, -0.45 * sg);
        else if (pick < 0.5) { table(-1.7, Math.min(M - 4, 11)); table(3.9, Math.min(M - 4, 11)); cabinets(-m / 2 + 0.7, 0); for (const sa of [-1, 1]) { put(6, sa * 6.9, 1.1, 0, 1, 0.8); lamp(sa * (M / 2 - 0.9), 6.2); } }
        else if (pick < 0.84) {
          // a ring of four sofas round a low table, a tree in each corner, four standing lamps
          for (let u = 0; u < 4; u++) put(4, Math.cos(u * 1.5708) * 4.4, Math.sin(u * 1.5708) * 4.4, -u * 1.5708 - 1.5708);
          put(5, 0, 0, 0, 1, 1.5);
          for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) put(6, sa * (M / 2 - 2), sb * (m / 2 - 2), r.range(0, 6.28));
          lamp(eA, 0); lamp(-eA, 0); lamp(0, eB); lamp(0, -eB);
        } else { cabinets(-m / 2 + 0.7, 0); cabinets(m / 2 - 0.7, Math.PI); desks(4.9, 4.4, 3, 2, -0.45 * sg); }
      }
    } else if (R.d < 160) {
      if (M < 8.2) {
        // a small room: one desk, a tree, stacks of chairs or two cabinets
        if (pick < 0.3 && m > 4.2) put(0, 0, 0, flip); else if (pick < 0.55) put(6, 0, 0, r.range(0, 6.28)); else if (pick < 0.8) stacks(2, m > 4.5 ? 2 : 1); else cabinets(-m / 2 + 0.7, 0);
      } else if (m < 6) {
        // a long narrow room: a row of desks down it, cabinets along one wall, or stacks of chairs and a tree
        if (pick < 0.4) desks(4.6, 4.2, 5, 1); else if (pick < 0.75) cabinets(-m / 2 + 0.7, 0); else { stacks(3, 2); put(6, M / 2 - 2, 0, 0); put(6, -M / 2 + 2, 0, 0); }
      } else if (m < 10) {
        if (pick < 0.38) desks(4.6, 4.2, 3, 2);
        else if (pick < 0.62) table(0, Math.min(M - 3.4, 11));
        else if (pick < 0.84) { put(4, 0, -2.7, 0); put(4, 0, 2.7, Math.PI); put(5, 0, 0); put(6, M / 2 - 1.8, m / 2 - 1.8, 0); }
        else { cabinets(-m / 2 + 0.7, 0); put(6, 0, 1.2, 0, 1, 1.2); }
      } else {
        if (pick < 0.4) desks(4.9, 4.4, 3, 3);
        else if (pick < 0.6) { table(-2.9, Math.min(M - 4, 11)); table(2.9, Math.min(M - 4, 11)); }
        else if (pick < 0.82) { for (let u = 0; u < 4; u++) put(4, Math.cos(u * 1.5708) * 4.4, Math.sin(u * 1.5708) * 4.4, -u * 1.5708 - 1.5708); put(5, 0, 0, 0, 1, 1.5); for (const [sa, sb] of [[-1, -1], [1, 1]]) put(6, sa * (M / 2 - 2), sb * (m / 2 - 2), 0); }
        else { cabinets(-m / 2 + 0.7, 0); cabinets(m / 2 - 0.7, Math.PI); desks(4.9, 4.4, 3, 1); }
      }
    }
    const bare = out.length === n0;
    for (const L of lamps) set(8, L[0], L[1], 0, 1, 1, L[2]);
    // (round eight: NO ROOM NEAR THE LINE STANDS EMPTY. A room within 100 m of the line in which nothing of its
    // layout found a place (its lamp stands where its desk would, or its tree would stand under the line) gets a low
    // round table with a chair in the corner away from its lamp, or, where it is too narrow for that, cabinets along
    // the wall away from its lamp)
    if (R.d < 100 && R.kind !== 1 && bare && M >= 4) {
      const n2 = out.length;
      if (m >= 4.6) {
        const sz = Math.min(1, (m - 1.8) / 4.2), tx = R.x0 + 0.66 * w, tz = R.z0 + 0.34 * d;
        set(5, tx, tz, 0, 1, sz); set(2, tx - 1.45 * sz - 0.95, tz, Math.PI / 2, 1, 1);
        if (M >= 7.5) set(7, R.x0 + 0.24 * w, R.z0 + 0.24 * d, flip, 1, 1);
      } else if (w >= d) for (let x = R.x0 + 1.6; x < R.x1 - 1.5; x += 2.4) set(3, x, R.z0 + 0.75, 0, 1, 1);
      else for (let z = R.z0 + 1.6; z < R.z1 - 1.5; z += 2.4) set(3, R.x1 - 0.75, z, -Math.PI / 2, 1, 1);
      // (a remnant strip beside a tower's foot, where all of that stood too near the tower: cabinets along its walls,
      // 2.1 m and more off the tower's own wall)
      if (out.length === n2) {
        for (const f of [0.5, 0.15, 0.85, 0.3, 0.7]) {
          if (out.length > n2) break;
          const a = 1.6 + (M - 3.2) * f;
          if (w >= d) { set(3, R.x0 + a, R.z0 + 0.75, 0, 1, 1, 2.1); set(3, R.x0 + a, R.z1 - 0.75, Math.PI, 1, 1, 2.1); }
          else { set(3, R.x0 + 0.75, R.z0 + a, Math.PI / 2, 1, 1, 2.1); set(3, R.x1 - 0.75, R.z0 + a, -Math.PI / 2, 1, 1, 2.1); }
        }
      }
    }
  }
  return out;
}

// the furniture's own shapes, plain and few-sided (they are seen from 30 m and more): boxes [x0, x1, y0, y1, z0, z1]
// without their under sides and upright prisms [sides, radius, y0, y1], each with a colour as the eye reads it; a
// colour whose first number is negative is the piece's own accent (dealt by its place), at the shade given second.
const ACC = (k = 1) => [-1, k, 0];
// (a colour whose first number is -2 is a lamp's shade: lit, glowing warm)
const LAMP = [-2, 1, 0];
const FURN_KINDS = [
  // 0 a desk with its chair
  [[-1.9, 1.9, 1.75, 1.9, -1.35, 0.55, [0.9, 0.88, 0.83]], [-1.9, -1.75, 0, 1.75, -1.35, 0.55, [0.6, 0.62, 0.66]], [1.75, 1.9, 0, 1.75, -1.35, 0.55, [0.6, 0.62, 0.66]],
    [-0.75, 0.75, 1.0, 1.2, 0.9, 2.3, ACC()], [-0.75, 0.75, 1.2, 2.6, 2.15, 2.3, ACC(0.8)],
    [-1.5, -0.9, 1.9, 2.75, -1.1, -0.5, LAMP]],
  // 1 a long table, one metre long (its length is the instance's own)
  [[-0.5, 0.5, 1.72, 1.9, -1.3, 1.3, [0.87, 0.84, 0.77]], [-0.43, -0.4, 0, 1.72, -1, 1, [0.3, 0.3, 0.32]], [0.4, 0.43, 0, 1.72, -1, 1, [0.3, 0.3, 0.32]]],
  // 2 a chair, its back to -z
  // (round ten: the stem under a seat is seen by no eye over the rooms: left out, with the cabinet's plinth and the
  // desk's drawers)
  [[-0.7, 0.7, 1.0, 1.2, -0.7, 0.7, ACC()], [-0.7, 0.7, 1.2, 2.5, -0.7, -0.55, ACC(0.8)]],
  // 3 a cabinet
  [[-1.1, 1.1, 0, 3.4, -0.55, 0.55, [0.74, 0.76, 0.8]]],
  // 4 a sofa, facing +z
  [[-2.5, 2.5, 0.3, 1.1, -1, 1, ACC()], [-2.5, 2.5, 1.1, 2.0, -1, -0.5, ACC(0.85)], [-2.5, -2.1, 1.1, 1.6, -0.5, 1, ACC(0.9)], [2.1, 2.5, 1.1, 1.6, -0.5, 1, ACC(0.9)]],
  // 5 a low round table
  [[10, 1.3, 0.85, 1.05, [0.86, 0.84, 0.8]], [4, 0.2, 0, 0.85, [0.3, 0.3, 0.32]]],
  // 6 a tree in a tub (round ten: its crown the trees' one make: three soft tiers, smooth: a turned body)
  // (these stand in the rooms under the high line, seen from 20 m and more: six-sided, the profile in seven rings)
  [[6, 1.2, 0, 1.3, [0.88, 0.88, 0.86]], [3, 0.18, 1.3, 3.2, [0.4, 0.35, 0.31]], { turned: 6, far: 1, r: 1.6, y0: 2.8, y1: 6.0, cA: [0.18, 0.42, 0.22], cB: [0.3, 0.6, 0.3] }],
  // 7 a stack of chairs
  [[-0.7, 0.7, 1.0, 1.16, -0.7, 0.7, ACC()], [-0.7, 0.7, 1.45, 1.61, -0.7, 0.7, ACC()], [-0.7, 0.7, 1.9, 2.06, -0.7, 0.7, ACC()],
    [-0.7, 0.7, 1.2, 3.3, -0.7, -0.55, ACC(0.8)]],
  // 8 a standing lamp: a foot, a thin stem, a straight shade
  [[5, 0.42, 0, 0.12, [0.3, 0.3, 0.32]], [3, 0.1, 0.12, 3.3, [0.3, 0.3, 0.32]], [6, 0.62, 3.3, 4.1, LAMP]],
];
// half length, half width of each kind's contact shade
// (the tenth: a lamp standard's post, for its thin long shade only)
const FURN_FOOT = [[2.3, 2.3], [0.8, 1.8], [0.95, 0.95], [1.4, 0.85], [2.9, 1.4], [1.7, 1.7], [1.6, 1.6], [1.0, 1.0], [1.5, 1.5], [0.05, 0.05]];
function furnGeo(parts) {
  const pos = [], nor = [], col = [];
  const quad = (v, n, c) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); } };
  for (const p of parts) {
    if (p.turned) {
      // (a turned body by the trees' own profile, its normals the surface's own)
      const prof = p.far ? TREE_FAR : TREE_PROF;
      const n = p.turned, ring = prof.map(([r, t]) => [r * p.r, p.y0 + (p.y1 - p.y0) * t]), nrm = latheNormals(ring);
      const colr = prof.map(([r]) => { const t = Math.min(Math.max((r - 0.35) / 0.6, 0), 1); return [0, 1, 2].map((c) => p.cA[c] + (p.cB[c] - p.cA[c]) * t); });
      for (let j = 0; j + 1 < ring.length; j++) for (let i = 0; i < n; i++) {
        const p0 = i / n * Math.PI * 2, p1 = (i + 1) / n * Math.PI * 2;
        for (const [jj, a] of [[j, p1], [j, p0], [j + 1, p0], [j, p1], [j + 1, p0], [j + 1, p1]]) {
          pos.push(ring[jj][0] * Math.cos(a), ring[jj][1], ring[jj][0] * Math.sin(a)); nor.push(nrm[jj][0] * Math.cos(a), nrm[jj][1], nrm[jj][0] * Math.sin(a)); col.push(colr[jj][0], colr[jj][1], colr[jj][2]);
        }
      }
    } else if (p.length === 7) {
      const [x0, x1, y0, y1, z0, z1, c] = p;
      quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], c);
      quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], c);
      quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], c);
      quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], c);
      quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], c);
    } else {
      const [n, r, y0, y1, c] = p;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2, A = [Math.cos(a0) * r, Math.sin(a0) * r], B = [Math.cos(a1) * r, Math.sin(a1) * r];
        quad([[B[0], y0, B[1]], [A[0], y0, A[1]], [A[0], y1, A[1]], [B[0], y1, B[1]]], [Math.cos(am), 0, Math.sin(am)], c);
        for (const q of [[0, y1, 0], [B[0], y1, B[1]], [A[0], y1, A[1]]]) { pos.push(q[0], q[1], q[2]); nor.push(0, 1, 0); col.push(c[0], c[1], c[2]); }
      }
    }
  }
  const g = geoOf(pos, nor);
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
// WHAT STANDS IN A ROOM IS LIT BY ITS ROOM (round nine): vSh is how far that room is lit by the hour: the sheet's own
// law (mazeRoom, hoursAt), asked at the piece's own place
const FURN_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vO; varying float vSh;
${GLSL_WAVE}${GLSL_FIELD}${GLSL_HOURS}
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal); vCol = color; vO = instanceMatrix[3].xyz;
  vec2 lo, hi, pd; vec4 open, id;
  gHw = mix(.3, .6, smoothstep(150., 190., wayD(vO.xz)));
  mazeRoom(vO.xz, lo, hi, open, id, pd);
  vSh = max(hoursAt((lo + hi) * .5, h21(id.xy + 43.7)), step(h21(id.xy + 71.3), .111));
  if (abs(id.z - 1.) < .5 && id.x > 254.5) vSh = 1.;
  if (id.z < .5 && h21(id.xy + 57.1) < .03) vSh = 0.;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FURN_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vO; varying float vSh;
uniform vec3 uFog; uniform float uFogK; uniform vec3 uAcc[5];
${GLSL_LIT}${GLSL_NIGHT}${GLSL_FIELD}
void main(){
  vec3 alb = vCol;
  float lamp = step(alb.r, -1.5);
  // a piece's accent: one of five clear colours by its own place
  if (alb.r < 0.) alb = lamp > .5 ? vec3(.96, .88, .66) : uAcc[int(h21(floor(vO.xz * .5) + 7.7) * 4.999)] * alb.g;
  // lit by its room's lamps: pale and a little warm on top, a clear blue-grey on its sides, deeper toward the floor;
  // after hours all of it stands deep blue. EVERY LAMP IN A LIT ROOM IS LIT: its shade glows warm.
  vec3 side = vec3(.5, .54, .7) * mix(.74, 1., smoothstep(0., 3., vW.y));
  vec3 col = min(alb * mix(side, vec3(.95, .9, .78), smoothstep(.3, .7, vN.y)), vec3(.88));
  col = mix(alb * vec3(.1, .14, .32), col, vSh);
  vec3 lin3 = lit3(col) + lamp * vec3(1., .82, .5) * 1.3 * vSh;
  gl_FragColor = vec4(nightAir(lin3, cameraPosition, vW - cameraPosition), 1.);
}`;
// the soft shade a piece lays on its floor under its room's lamps: one flat quad under each, as large as its foot
// (round nine: no key light: no long shade)
const SHADE_FRAG = /* glsl */`
varying vec2 vUv;
void main(){
  vec2 q = abs(vUv - .5) * 2.;
  float e = max(q.x, q.y), r = length(max(q - .55, 0.)) / .45;
  gl_FragColor = vec4(vec3(.03, .045, .13), (1. - smoothstep(.1, 1., r)) * step(e, 1.) * .42);
}`;
const SHADE_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }`;
// the warm pool a desk's lamp lays round it: one flat quad, added to the floor's light (after hours it is out: vSh)
const POOL_FRAG = /* glsl */`
varying vec2 vUv; varying float vSh;
void main(){
  vec2 q = (vUv - .5) * 2.;
  float g = exp(-dot(q, q) * 4.5) * (1. - smoothstep(.8, 1., length(q)));
  gl_FragColor = vec4(vec3(1., .82, .5) * .16 * g * vSh, 1.);
}`;
const POOL_VERT = /* glsl */`
varying vec2 vUv; varying float vSh;
${GLSL_WAVE}${GLSL_FIELD}${GLSL_HOURS}
void main(){
  vUv = uv;
  vec3 vO = instanceMatrix[3].xyz;
  vec2 lo, hi, pd; vec4 open, id;
  gHw = mix(.3, .6, smoothstep(150., 190., wayD(vO.xz)));
  mazeRoom(vO.xz, lo, hi, open, id, pd);
  vSh = max(hoursAt((lo + hi) * .5, h21(id.xy + 43.7)), step(h21(id.xy + 71.3), .111));
  if (abs(id.z - 1.) < .5 && id.x > 254.5) vSh = 1.;
  if (id.z < .5 && h21(id.xy + 57.1) < .03) vSh = 0.;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
}`;

// ---------------------------------------------------------------- the view from above and the tide, assembled
// opts: { time: { value }, maze } (both optional). Everything stands in the plan's own metres.
export async function buildHero(ctx, opts = {}) {
  const seed = ctx.seed, group = new THREE.Group(), above = new THREE.Group(), tideG = new THREE.Group();
  const timeU = opts.time || { value: 0 };
  let maze = opts.maze;
  if (!maze) {
    const stages = mazeDealStages(seed);
    let s = stages.next();
    while (!s.done) { await ctx.yield(); s = stages.next(); }
    maze = s.value;
  }
  await ctx.yield();
  const roofU = makeRoofUniforms(seed, maze), towers = towersDeal(seed), skyU = skyUniform(seed);
  roofU.uTime = timeU;
  roofU.uSky = skyU;
  roofU.uTow = { value: Array.from({ length: 17 }, (_, i) => (towers[i] ? new THREE.Vector4(towers[i].x, towers[i].z, towers[i].r, towers[i].h) : new THREE.Vector4(0, 0, -99, 0))) };
  // (tower B's storeys from the ground up, each in its own colour: the canal's water shows them)
  const storeysB = towers[1].pile.filter((b) => !b.plate);
  roofU.uStoB = { value: Array.from({ length: 10 }, (_, i) => roofU.uPal.value[storeysB[Math.min(i, storeysB.length - 1)].ci]) };
  const fogU = { uFog: roofU.uFog, uFogK: roofU.uFogK, uTime: timeU };
  let triangles = 0;
  const add = (to, mesh, name) => { mesh.name = name; mesh.frustumCulled = false; to.add(mesh); const g = mesh.geometry; triangles += (g.index ? g.index.count : g.attributes.position.count) / 3; return mesh; };

  // THE SHEET of the open maze at the height of the walls' tops, to the camera's far reach every way
  add(above, new THREE.Mesh(new THREE.PlaneGeometry(10400, 10400).rotateX(-Math.PI / 2).translate(-33, P.ROOF, -301), makeRoofMaterial(roofU)), 'maze sheet');
  // THE CEILING OF LIGHT at y 96, seen from below (in cells of 260 m, so that a place on it is known to the metre)
  add(group, new THREE.Mesh(new THREE.PlaneGeometry(10400, 10400, 40, 40).rotateX(Math.PI / 2).translate(-33, P.SLAB, -301),
    new THREE.ShaderMaterial({ uniforms: { uTime: timeU, uSky: skyU, uTow: roofU.uTow, uTop: { value: Array.from({ length: 17 }, (_, i) => {
      // (each great tower's last storey: its middle and its two half widths)
      const T = towers[i], b = T && T.great ? T.pile.filter((q) => !q.plate).pop() : null;
      return b ? new THREE.Vector4((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2, (b.x1 - b.x0) / 2, (b.z1 - b.z0) / 2) : new THREE.Vector4(0, 0, -99, -99);
    }) } }, vertexShader: ROOF_VERT, fragmentShader: CEIL_FRAG })), 'ceiling of light');
  // the great towers' capitals (round eleven)
  add(group, new THREE.Mesh(capitalsGeo(towers), new THREE.ShaderMaterial({ vertexShader: CAP_VERT, fragmentShader: CAP_FRAG, side: THREE.DoubleSide })), 'capitals');
  await ctx.yield();

  // the crowns of the flown halls' walls and the round opening's reveal
  fogU.uTow = roofU.uTow;
  const whiteMat = new THREE.ShaderMaterial({ uniforms: fogU, vertexShader: WHITE_VERT, fragmentShader: WHITE_FRAG, side: THREE.DoubleSide });
  add(above, new THREE.Mesh(crownsGeo(), whiteMat), 'crowns');
  // the white roofs over the corridor, hall one, the link and hall two, and the well through hall two's roof
  add(above, new THREE.Mesh(roofsGeo(), new THREE.ShaderMaterial({ uniforms: fogU, vertexShader: WHITE_VERT, fragmentShader: WHITE_FRAG, side: THREE.DoubleSide, defines: { ROOF: 1 } })), 'roofs');
  // the roof garden, the well's rim and the other roofs' hedged beds (round seven)
  const gardenMat = new THREE.ShaderMaterial({ uniforms: { ...roofU }, vertexShader: GARDEN_VERT, fragmentShader: GARDEN_FRAG, side: THREE.DoubleSide });
  await ctx.yield();
  const gardenStages = roofGardenStages(seed);
  let gs = gardenStages.next();
  while (!gs.done) { await ctx.yield(); gs = gardenStages.next(); }
  add(above, new THREE.Mesh(gs.value, gardenMat), 'roof garden');
  await ctx.yield();
  const courtStages = courtGardenStages(seed);
  let cs = courtStages.next();
  while (!cs.done) { await ctx.yield(); cs = courtStages.next(); }
  const court = cs.value;
  add(above, new THREE.Mesh(court.geo, gardenMat), 'court garden');
  // the boulevard's paving, walls and gate (round eleven)
  add(above, new THREE.Mesh(boulevardGeo(), new THREE.ShaderMaterial({ uniforms: roofU, vertexShader: BLVD_VERT, fragmentShader: BLVD_FRAG, side: THREE.DoubleSide })), 'boulevard');
  await ctx.yield();
  const upstand = add(group, new THREE.Mesh(wellGeo(), new THREE.ShaderMaterial({ uniforms: fogU, vertexShader: WHITE_VERT, fragmentShader: WHITE_FRAG, side: THREE.DoubleSide, defines: { WELL: 1 } })), 'well');
  await ctx.yield();

  // THE TOWERS (round seven): piles of floor plates and lit storeys, all in one mesh; the core's and tower B's three
  // lifts each (a car's run: from 6 to 14 m over its shaft's foot up to between 60 and 90 m)
  const cars = coreDeal(seed, 'fww-core').slice(0, 3).concat(coreDeal(seed, 'fww-towb').slice(0, 3));
  P.CORE.lifts.concat(P.TOWB.lifts).forEach((L, i) => { cars[i].z += L[1]; cars[i].w = Math.max(cars[i].w, cars[i].z + 24); });
  {
    // (round eight: the dealt towers' cars, in the order of their shafts: each runs from near the floor to near its
    // tower's top, by its own period (24 to 42 s) and start)
    const deal = coreDeal(seed, 'fww-lifts').concat(coreDeal(seed, 'fww-lifts-b'));
    let n = 0;
    for (const T of towers) for (let s = 0; s < (T.shafts || []).length; s++) {
      const c = deal[n++ % deal.length].clone(), top = T.shafts[s].top !== undefined ? T.shafts[s].top : (T.great ? P.SLAB : T.h) - 1.5;
      c.x *= 0.6; c.z = 4 + 0.5 * (c.z - 6); c.w = Math.max(top - 4.5 - 0.1 * (90 - c.w), c.z + 8);
      cars.push(c);
    }
    while (cars.length < 40) cars.push(new THREE.Vector4(60, 0, 0, 1));
  }
  // (round nine: THE TOWERS ARE DRAWN FROM EVERYWHERE: from the corridor they stand beyond its glass, over the court)
  const towerMesh = add(group, new THREE.Mesh(towersGeo(towers), new THREE.ShaderMaterial({ uniforms: { ...fogU, uPal: { value: [hex3('#f2dcae')].concat(roofU.uPal.value.slice(1)) }, uCar: { value: cars }, uCarLight: { value: lin('#fff3d6') }, uWarm: { value: lin('#ffeccd') } },
    vertexShader: TOWER_VERT, fragmentShader: TOWER_FRAG, side: THREE.DoubleSide })), 'towers');
  await ctx.yield();

  // the tide's carpet: a sheet of 2.5 m cells over the whole of hall two, lifted by the tide's own function
  const tideU = makeTideUniforms(seed, timeU), H2 = P.H2;
  const tideMat = new THREE.ShaderMaterial({ uniforms: tideU.uniforms, vertexShader: TIDE_VERT, fragmentShader: TIDE_FRAG });
  add(tideG, new THREE.Mesh(new THREE.PlaneGeometry(H2.x1 - H2.x0, H2.z1 - H2.z0, 88, 88).rotateX(-Math.PI / 2).translate((H2.x0 + H2.x1) / 2, H2.floor, (H2.z0 + H2.z1) / 2), tideMat), 'tide');

  // THE FURNISHING of the open rooms near the line: one instanced mesh for each kind of thing, one for their shades
  await ctx.yield();
  const roomStages = roomsNearStages(maze, 400, towers);
  let rs = roomStages.next();
  while (!rs.done) { await ctx.yield(); rs = roomStages.next(); }
  const rooms = rs.value;
  await ctx.yield();
  const furnStages = furnishDealStages(seed, maze, rooms, towers);
  let fs = furnStages.next();
  while (!fs.done) { await ctx.yield(); fs = furnStages.next(); }
  const things = fs.value, furn = new THREE.Group();
  await ctx.yield();
  const furnMat = new THREE.ShaderMaterial({ uniforms: { ...roofU, uAcc: { value: ['#1d6f78', '#e9e6df', '#c9457a', '#3f7fd6', '#6f8f3a'].map(hex3) } }, vertexShader: FURN_VERT, fragmentShader: FURN_FRAG });
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < FURN_KINDS.length; k++) {
    const list = things.filter((t) => t[0] === k);
    if (!list.length) continue;
    const geo = furnGeo(FURN_KINDS[k]);
    const mesh = new THREE.InstancedMesh(geo, furnMat, list.length);
    list.forEach((t, i) => { m4.compose(v3.set(t[1], 0, t[2]), q4.setFromAxisAngle(up, t[3]), s3.set(t[4] * t[5], t[5], t[5])); mesh.setMatrixAt(i, m4); });
    add(furn, mesh, 'maze ' + ['desks', 'long tables', 'chairs', 'cabinets', 'sofas', 'low tables', 'trees', 'chair stacks', 'standing lamps'][k]);
    triangles += (list.length - 1) * mesh.geometry.attributes.position.count / 3;
    await ctx.yield();
  }
  {
    // (the garden court's trees and standards lay their shades by the same mesh)
    const shaded = things.concat(court.shades);
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const shades = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, transparent: true, depthWrite: false }), shaded.length);
    shaded.forEach((t, i) => {
      // (the quad is as long and as broad as the piece's foot, and half a metre more)
      const fo = FURN_FOOT[t[0]];
      m4.compose(v3.set(t[1], 0.05, t[2]), q4.setFromAxisAngle(up, t[3]), s3.set(2 * (fo[0] * t[4] + 0.5) * t[5], 1, 2 * (fo[1] + 0.5) * t[5])); shades.setMatrixAt(i, m4);
    });
    add(furn, shades, 'maze shades');
    triangles += (shaded.length - 1) * 2;
    await ctx.yield();
    // the warm pool of each desk's own lamp (the lamp stands at (-1.2, -0.8) on its desk)
    const desks = things.filter((t) => t[0] === 0);
    if (desks.length) {
      const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.6, 4.6).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: roofU, vertexShader: POOL_VERT, fragmentShader: POOL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), desks.length);
      desks.forEach((t, i) => { const cs = Math.cos(t[3]), sn = Math.sin(t[3]); pools.setMatrixAt(i, m4.makeTranslation(t[1] - 1.2 * cs - 0.8 * sn, 0.07, t[2] + 1.2 * sn - 0.8 * cs)); });
      pools.renderOrder = 2;
      add(furn, pools, 'maze pools');
      triangles += (desks.length - 1) * 2;
    }
  }
  above.add(furn);
  await ctx.yield();

  group.add(above, tideG);
  return {
    object: group, above, furn, tide: tideG, upstand, core: towerMesh, towerB: towerMesh, towers, radius: 260, height: 96, center: new THREE.Vector3(P.OC.x, 20, P.OC.z), ground: false,
    trains: tideU.trains, maze, triangles, uniforms: { roof: roofU, tide: tideU.uniforms, sky: skyU },
    update(dt, time) { timeU.value = time; },
  };
}
