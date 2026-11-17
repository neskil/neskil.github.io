// The Other Side of Town: the plan of one small Midwestern town, dealt once and laid out twice, and what both copies
// are drawn with. Series named only in the world's header. Everything here is our own drawing from the real Midwest.
// (Section 181: nothing in this file is brought in from published code: every function and shader passage is our own
// writing but for common forms that belong to nobody (one-line sine hashes, smooth steps, rotations) and the kit's.)
// THE LIVING TOWN AND ITS DEAD DOUBLE ARE SEEN TOGETHER, BY ONE LAW FOR EVERY LEAF (round seven; deadAt in the
// shaders' common part): every fragment of both copies and of both skies shows the look of the side the eye stands on
// (living east of the plane x -80, dead west of it), turned to the other look where the sight line passes through the
// outline of one of SIXTEEN LEAVES fixed in the plan (LEAVES). ROUND EIGHT C: EVERY LEAF STANDS OPEN, ALWAYS; two
// are flown through, every other stands twice its own height and more from the flown line (LEAF_BACK, leafGap);
// nothing here is placed, timed, sized or shaped by where the eye or the lens is, but for the brief's one declared
// exception at the bulbs' dabs (DAB_VERT says so at its lines). ROUND EIGHT D: a great leaf that stands in a
// crossing stands in an OPEN GREEN (GREENS, greenLot, greenKeepsTree: no house and no street tree close behind
// it); a fragment's reach is read only to fade a pattern to that pattern's own counted mean (LAP_MEAN, BRICK_MEAN,
// RIDGE_MEAN before SURF_FRAG; a leaf's edge keeps its light).
// THE DEAD LOOK is the same town frozen under a clear night (makeNight: fine stars, its own moon low in the west as
// the key light, tall northern lights that tint the snow; packed snow, deep blue shade, long moon shadows, dark
// trunks, walls and glass), with NO LIT WINDOW, LAMP OR SHOP FRONT at rest: the ghosts of the bulbs are its only own
// light (the cure of round eight: lit bulbs of cold white on every rimed string, most lit and some dark, each blinking
// at its own slow rate, with short runs along a string; never warm or coloured); the rime is large (fronds on every pole, eave, bough and
// fence: dealRime; combs on every wire and string: combOf; lace on every twig); NOTHING FALLS (diamond dust hangs:
// makeDust). THE LIVING LOOK has the crowns of leaves, falling leaves, chimney smoke (makeSmoke), lit windows and lamps
// on both copies. The living side's light spills out at each leaf's foot as a broad amber fan (spill) and glows on
// what stands just behind it (hearth). The few things that move are one mesh a copy (makeMover: porch swings,
// weathervanes, swaying wires). The great tree is the square's OAK; the landmark of the air is the WATER TOWER.
// THE ROUTES' MARKS (routes().marks) are places in metres of run: every height of the line and every look and pace
// of the world hang on them, never on a fraction of the flight.
//
// THE PLAN'S AXES (p east, q north, y up, metres). A thing dealt at plan (p, q) stands on the BRIGHT copy at world
// (x, z) = (p, -q) and on the DARK copy at world (-80 - q, -160 - p). Geometry is built in the axes
// (X, Y, Z) = (p, y, -q): the bright copy is drawn with the identity, the dark copy with a quarter turn about Y and a
// shift, so no thing is mirrored. The plane x = -80 lies on a street's centre line in both copies.
//
// This file holds (1) the two routes as plain arithmetic, (2) planOf(seed): lots, houses, trees, things and strings in
// plan coordinates with every body's primitive for the clear-air count, (3) the builders that turn the plan into
// geometry, (4) the materials, (5) buildHero: one strung house, its tree and a parted curtain, standing alone.
import * as THREE from 'three';
import { makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

export const K = {
  BLOCK: 80, ROAD: 9, VERGE: 3, WALK: 1.5, YARD: 7, FRONT: 16, LOT: 15.5, KERB: 0.15,
  // THE LINE'S HEIGHTS, each with its reason by a place: EYE, along both streets (the brief's: under the strings,
  // which hang 5.25 m and more up); TOP, the high place (the water tower's tank stands from 24.2 m up: the eye is
  // level with its foot, every roof and crown of the town below); TURN_END, at the turn's end over the crossing of
  // the home street and Main Street (the brief's line sinks to about 10 m there: under Main Street's strings, 11.5 m
  // at their lowest, over its lamp standards, 5.2 m); MAIN_Y, the shop fronts' height held down Main Street (the
  // brief's)
  EYE: 2.2, PLANE_X: -80, DARK_OX: -80, DARK_OZ: -160, TOP: 25, TURN_END: 9.5, MAIN_Y: 3.2,
  WAVE_SPEED: 36, WAVE_PERIOD: 3.5, WAVE_DECAY: 1.2, CHASE: 0.4,
  CLEAR: 2.6, TREE_CLEAR: 4, CROSS_CLEAR: 22,
  // TS: the water tower's scale. It stands at its own measures, 38 m to its cap's tip: with the leaf before it, as
  // tall as it is, it holds LEAF_BACK where the plan puts it (TOWER'S PLACE, below)
  TS: 1,
  WIND: [-700, 320], RING: [-232, 320, 7.5],   // WIND: the far point the standing wind blows toward (the rime grows away from it)
  // (K.TOWER, the water tower's axis, is worked out below from the climb: see TOWER'S PLACE)
  THIN1: [-80, 160], CHURCH: [-58, 134], COURT: [-120, 364], PLAZA: [-262, 320, 26],   // the plaza's middle on Main Street's axis, 30 m behind the last leaf's plane (the square's oak stands on its north side: OAK)
};
export const brightW = (p, q) => [p, -q];
export const darkW = (p, q) => [K.DARK_OX - q, K.DARK_OZ - p];
const windWorld = () => darkW(K.WIND[0], K.WIND[1]);
// NAMED MEASURES OF THE PLAN, each written once; the lines, the deals and the world read them.
// WALK_OUT: from a street's centre line to the outer edge of its walk (9 m).
const WALK_OUT = K.ROAD / 2 + K.VERGE + K.WALK;
// BUNG_EAVE: the eaves' line of a bungalow, the lowest house that stands along the lines (houseDims reads it).
const BUNG_EAVE = 3.1;
// AIR_Y: the height at which the line has risen clear of the street: the eaves' line of the street's lowest houses.
const AIR_Y = BUNG_EAVE;
// TREE_OFF: a verge tree stands this far from its street's centre line (the tree deal and the leaves' tree rule read it).
const TREE_OFF = 6;
// the block a plan point lies in
export const blockOf = (p, q) => [Math.floor(p / K.BLOCK), Math.floor(q / K.BLOCK)];
const inBlock = (pt, i, j) => Math.floor(pt[0] / K.BLOCK) === i && Math.floor(pt[1] / K.BLOCK) === j;
// MAIN STREET: its axis (q); its own blocks reach from the home street (p 0) west to the far side of the block the
// plaza lies in (w); its stores' front walls stand `front` metres from the axis and are at most `deep` metres deep.
export const MAIN = { q: K.RING[1], w: Math.floor((K.PLAZA[0] - K.PLAZA[2]) / K.BLOCK) * K.BLOCK, front: 11, deep: 20 };
// the row of Main Street a block's side belongs to: 1 the north fronts, -1 the south fronts, 0 none
export const mainRow = (i, j, side) => (i * K.BLOCK >= MAIN.w && (i + 1) * K.BLOCK <= 0) ? (side === 'S' && j * K.BLOCK === MAIN.q ? 1 : side === 'N' && (j + 1) * K.BLOCK === MAIN.q ? -1 : 0) : 0;
// THE WATER TOWER'S OWN MEASURES before K.TS: its tank's wall from foot to top, its cap's point
const TOWER_TANK = [24.2, 32], TOWER_CAP = 38;
// THE LINES' OWN MEASURES: every join, mark and later metre of the two tracks is worked out from these and from the
// plan's places (the length of the flight falls where they put it).
export const LINE = {
  BR: 34,                          // the bright turn: a quarter circle of this radius from the home street's axis onto the cross street's
  Q0: K.BLOCK + WALK_OUT,          // the dark line leaves the home street at the outer edge of the far walk of its first crossing
  HE: 20 * Math.PI / 180,          // the climb's heading where it ends, east of north (the brief's line: a climb bending right to this place)
  PE: 58,                          // the climb ends this far east of the home street's axis, over the east row of its block (the brief's line)
  R: 73,                           // the turn's radius (the brief's line); the turn ends heading due west on Main Street's axis
  SWING: 3,                        // Main Street's S: metres to either side of the axis
  RISE_EASE: 20,                   // the rise is eased in over this many metres from the climb's foot and out over as many before the climb's end
  BEND: 40,                        // the climb's heading bends east over this many metres of northing from its foot and back over as many before its end
};
// where the climb ends and the turn begins: on the turn's circle, which ends on Main Street's axis
const CLIMB_END = [LINE.PE, MAIN.q - LINE.R - LINE.R * Math.sin(LINE.HE)];
// TOWER'S PLACE: the water tower stands on the back land in the middle of a block, where its four back yards meet:
// the block that the climb's own heading, carried straight on from the climb's end, enters beyond Main Street's line.
// The climb so heads for the tower, and the turn leaves it LEAF_BACK and more aside (the leaves' table).
K.TOWER = [(Math.floor((CLIMB_END[0] + (MAIN.q - CLIMB_END[1]) * Math.tan(LINE.HE)) / K.BLOCK) + 0.5) * K.BLOCK, (Math.floor(MAIN.q / K.BLOCK) + 0.5) * K.BLOCK];
// A LOT'S PLACE, written once (the house deal, the landmarks' rules and the house leaves read it): block (i, j), the
// side of the block the lot lies on (W, E, S, N), its number k along that side (four lots to a side along the
// north-south streets, two between them along the cross streets). fp, fq: the middle of the front wall's line, FRONT
// metres from the street's centre line; face: the unit vector from the house toward its street.
export function lotPlace(i, j, side, k) {
  const B = K.BLOCK, p0 = i * B, q0 = j * B, cross = side === 'S' || side === 'N', along = WALK_OUT + K.LOT * (k + (cross ? 1.5 : 0.5));
  if (side === 'W') return { fp: p0 + K.FRONT, fq: q0 + along, face: [-1, 0] };
  if (side === 'E') return { fp: p0 + B - K.FRONT, fq: q0 + along, face: [1, 0] };
  if (side === 'S') return { fp: p0 + along, fq: q0 + K.FRONT, face: [0, -1] };
  return { fp: p0 + along, fq: q0 + B - K.FRONT, face: [0, 1] };
}
// THE ANCHOR STORES (round eight, B2): four stores that stand at the same place on every seed, each with an open front,
// a shop inside and a door leaf before it. By places: on the north fronts the two corner stores that flank the
// courthouse square, across its two side streets; on the south fronts the store opposite the courthouse's own door
// and the store in the middle of the last block's row. Along the line they alternate: north, south, north, south.
// p0: the store's west wall; w: its width (the door stands in its middle).
const SQUARE_W = Math.floor(K.COURT[0] / K.BLOCK) * K.BLOCK, SQUARE_E = SQUARE_W + K.BLOCK, ANCHOR_W = 9;
const ANCHORS = [
  { north: true, p0: SQUARE_E + WALK_OUT, w: ANCHOR_W },
  { north: false, p0: K.COURT[0] - ANCHOR_W / 2, w: ANCHOR_W },
  { north: true, p0: SQUARE_W - WALK_OUT - ANCHOR_W, w: ANCHOR_W },
  { north: false, p0: SQUARE_W - K.BLOCK / 2 - ANCHOR_W / 2, w: ANCHOR_W },
];

// ---------------------------------------------------------------------------------------------- the two routes
// Each returns points [p, q, y] one metre apart along the ground track (the last step shorter), in its own copy's plan.
function brightTrack() {
  // north from the entry along the home street; a quarter circle to the left that comes out on the axis of the cross
  // street in which the first thin place stands; west along that axis to the thin place
  const out = [], R = LINE.BR, A = K.THIN1[1] - R, arc = R * Math.PI / 2, W = -K.THIN1[0] - R, L = A + arc + W;
  for (let s = 0; ; s += 1) {
    const t = Math.min(s, L);
    if (t <= A) out.push([0, t, K.EYE]);
    else if (t <= A + arc) { const a = (t - A) / R; out.push([-R + R * Math.cos(a), A + R * Math.sin(a), K.EYE]); }
    else out.push([-R - (t - A - arc), A + R, K.EYE]);
    if (t >= L) break;
  }
  out.marks = { turn: A, turnEnd: A + arc };   // (metres of run: where the quarter circle at the corner lawn begins and ends)
  return out;
}
const herm = (y0, y1, m0, m1, t) => {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
};
function darkTrack() {
  // (1) THE DARK STREET: from the plane north along the home street at the street's height (K.EYE), over its first
  // crossing, to the outer edge of that crossing's far walk (LINE.Q0).
  const out = [], mk = {}, Q0 = LINE.Q0, HE = LINE.HE, R = LINE.R, CQ = MAIN.q - R, CP = LINE.PE - R * Math.cos(HE), [PE, QE] = CLIMB_END;
  const turnAt = (s) => { const a = -HE + s / R; return [CP + R * Math.cos(a), CQ + R * Math.sin(a)]; };   // the turn: s metres round a circle about (CP, CQ); it ends (a = 90 degrees) heading due west on Main Street's axis
  for (let s = 0; s < Q0; s += 1) out.push([0, s, K.EYE]);
  mk.climb = out.length;
  // (2) THE CLIMB: from (0, Q0) bending right: the heading eases to H0 east of north over LINE.BEND metres of
  // northing, holds, and eases back to HE over the last LINE.BEND; H0 is solved so that the climb ends on the turn's
  // circle (CLIMB_END). It passes over the roadway of the cross street the first thin place stands in.
  const head = (h0, q) => h0 * smoothstep(Q0, Q0 + LINE.BEND, q) - (h0 - HE) * smoothstep(QE - LINE.BEND, QE, q);
  const endP = (h0) => { let p = 0; for (let q = Q0; q < QE; q += 0.25) p += Math.tan(head(h0, q + 0.125)) * 0.25; return p; };
  let lo = HE, hi = 0.9;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (endP(mid) < PE) lo = mid; else hi = mid; }
  const H0 = (lo + hi) / 2, cl = [];
  { let p = 0, g = 0; for (let q = Q0; q <= QE + 0.0001; q += 0.25) { cl.push([p, q, g]); const h = head(H0, q + 0.125); p += Math.tan(h) * 0.25; g += 0.25 / Math.cos(h); } }
  // THE RISE takes the climb's whole course: from the climb's foot to the climb's own end, where the turn begins,
  // eased in and out over LINE.RISE_EASE metres each; the line goes up over the back lots toward the water tower,
  // which stands on its heading. THE HIGH PLACE, K.TOP (the tower's tank stands at that height and above; the
  // town's roofs and its warm fans lie below), begins where the turn begins (mk.high is mk.top) and is held into
  // the turn until the line is abreast of the water tower: there THE LINE BEGINS TO SINK (see the turn)
  const G = cl[cl.length - 1][2], E = LINE.RISE_EASE, TOP = K.TOP, END = K.TURN_END, smax = (TOP - K.EYE) / (G - E);
  const yAt = (g) => { const gg = Math.min(g, G), a = Math.min(gg, E), b = Math.max(0, gg - (G - E)); return K.EYE + smax * (gg - a + a * a / (2 * E) - b * b / (2 * E)); };
  for (let g = 0, i = 0; g < G; g += 1) { while (i < cl.length - 2 && cl[i + 1][2] < g) i++; const a = cl[i], b = cl[i + 1], t = clamp((g - a[2]) / (b[2] - a[2]), 0, 1); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), yAt(g)]); }
  // where the line has risen clear of the street (AIR_Y)
  mk.clear = mk.climb; while (out[mk.clear][2] < AIR_Y) mk.clear++;
  // (3) THE TURN: one left turn of radius LINE.R, from the climb's end round to Main Street's axis, heading due west.
  // The high place is held into it as far as the place ABREAST OF THE WATER TOWER (mk.sink: the turn's metre nearest
  // the tower's axis); from there THE LINE SINKS in one ease to the turn's end, K.TURN_END up over the crossing of
  // the home street and Main Street (there 4.3 degrees down, on its way to the shop fronts' height)
  mk.top = out.length; mk.high = mk.top;
  const arc = R * (Math.PI / 2 + HE), sEnd = 0.075;
  let S0 = 0; for (let s = 1, best = 1e9; s < arc - 1; s++) { const d = Math.hypot(turnAt(s)[0] - K.TOWER[0], turnAt(s)[1] - K.TOWER[1]); if (d < best) { best = d; S0 = s; } }
  mk.sink = out.length + S0;
  for (let s = 0, DS = arc - S0; s < arc; s += 1) { const [tp, tq] = turnAt(s); out.push([tp, tq, s <= S0 ? TOP : herm(TOP, END, 0, -sEnd * DS, (s - S0) / DS)]); }
  mk.turnEnd = out.length;
  // (4) MAIN STREET, ALL OF IT (round seven, D): LOW, IN ONE SLOW S, its places given by the doors of the four anchor
  // stores, before which the four door leaves of the shop fronts stand (S1 to S4, in the order the line passes them). West from the turn's end, sinking from K.TURN_END to
  // K.MAIN_Y (the shop fronts' height) by the second door leaf, held there to the third, then rising gently, level
  // at the end, to the ring's centre. In plan: LINE.SWING metres LEFT (south) of the axis abreast of the first door
  // leaf, which stands in the north fronts, the same RIGHT (north) of it abreast of the second, which stands in the
  // south fronts (each is so seen across the street's breadth), and back on the axis abreast of the fourth, straight
  // from there to the ring.
  const LM = CP - K.RING[0], door = (k) => CP - (ANCHORS[k - 1].p0 + ANCHORS[k - 1].w / 2), SW1 = door(1), SW2 = door(2), SW3 = door(4), LOW = door(2), UP = door(3), SWING = LINE.SWING;   // (metres of Main Street, westward from the turn's end)
  for (let s = 0; ; s += 1) {
    const t = Math.min(s, LM), y = t <= LOW ? herm(END, K.MAIN_Y, -sEnd * LOW, 0, t / LOW) : K.MAIN_Y + (K.RING[2] - K.MAIN_Y) * smoothstep(UP, LM, t);
    const off = t <= SW1 ? -SWING * smoothstep(0, SW1, t) : t <= SW2 ? -SWING * Math.cos(Math.PI * (t - SW1) / (SW2 - SW1)) : SWING * (1 - smoothstep(SW2, SW3, t));   // (the S is a small one, LINE.SWING either way: the one great leaf on the axis stays the goal)
    out.push([CP - t, MAIN.q + off, y]);
    if (t >= LM) break;
  }
  mk.low = mk.turnEnd + Math.round(LOW); mk.up = mk.turnEnd + Math.round(UP);
  out.marks = mk;
  return out;
}
let _routes = null;
// { bright, dark }: the two tracks in plan coordinates; world: every point [x, y, z, m] with its metres from the entry;
// knots: the points handed to makePath; lenBright: metres of route at the plane.
export function routes() {
  if (_routes) return _routes;
  const bright = brightTrack(), dark = darkTrack(), world = [];
  let m = 0, prev = null;
  const push = (x, y, z) => { if (prev) m += Math.hypot(x - prev[0], y - prev[1], z - prev[2]); prev = [x, y, z]; world.push([x, y, z, m]); };
  for (const [p, q, y] of bright) { const w = brightW(p, q); push(w[0], y, w[1]); }
  const lenBright = m;
  for (let i = 1; i < dark.length; i++) { const w = darkW(dark[i][0], dark[i][1]); push(w[0], dark[i][2], w[1]); }
  const knots = [];
  // a knot every KNOT metres; every quarter of that through the climb, from one knot before its foot to one knot
  // past its end (a path through knots KNOT apart would cut the corner of each of the climb's eases)
  const KNOT = 8, nb = bright.length - 1, k0 = nb + dark.marks.climb - KNOT, k1 = nb + dark.marks.top + KNOT;
  for (let i = 0; i < world.length - KNOT / 2; i += (i >= k0 && i < k1) ? KNOT / 4 : KNOT) knots.push(world[i].slice(0, 3));
  knots.push(world[world.length - 1].slice(0, 3));
  // THE MARKS: places along the route in metres from the entry, each taken from the tracks themselves: the bright
  // turn's start and end; the plane; the climb's foot; where the line has risen clear of the street; where the rise
  // is done and the turn begins (the high place begins: high and top are one place); where the line begins to sink,
  // abreast of the water tower; the end of the turn over
  // Main Street; on Main Street, where the line has come down to the shop fronts' height and where it begins to rise
  // to the ring
  const at = (i) => world[bright.length - 1 + i][3], D = dark.marks;
  const marks = { bturn: bright.marks.turn, bturnEnd: bright.marks.turnEnd, plane: lenBright, climb: at(D.climb), clear: at(D.clear), high: at(D.high), top: at(D.top), sink: at(D.sink), turnEnd: at(D.turnEnd), low: at(D.low), up: at(D.up) };
  _routes = { bright, dark, world, knots, lenBright, length: m, marks };
  return _routes;
}
// ---------------------------------------------------------------------------------------------- the leaves
// THE LEAVES, FIXED IN THE PLAN, THE SAME ON EVERY SEED AND ON EVERY VISIT. EVERY LEAF STANDS OPEN AT ITS FULL
// BREADTH, ALWAYS: nothing about a leaf follows where the eye stands. Each stands upright on a plane of its own:
// (p, q) the middle of its foot in its copy's plan ('b' the bright copy, 'd' the dark copy), n the plane's normal in
// the plan (it points toward the oncoming line), waist and top its outline's greatest width and its height, foot the
// height of its lower point, spill the reach of the fan of light before its foot (under 0: on both sides of it),
// fan: [half width at the foot, widening a metre, strength].
// TWO LEAVES ARE FLOWN THROUGH and stand on the line: L3, the first thin place, on the axis of the cross street the
// bright line ends in; LR, the last, on Main Street's axis, with the ring in its lower middle. EVERY OTHER LEAF IS
// PASSED, and for those there is ONE RULE OF THE PLAN, LEAF_BACK: a passed leaf stands no nearer the flown line, in
// the plan, than LEAF_BACK times its own height, at any metre of the line. It is counted to the nearer end of the
// leaf's foot line, its breadth taken wider by its breathing (BREATHE: leafGap; leafTable lists every leaf).
export const LEAF_BACK = 2, BREATHE = 0.1;
// (the phase of a leaf's breathing, in radians, is its foot's world place (x, z) times this: see leafOf)
const LEAF_PH = 'vec2(0.37, 0.61)';
// half the width of a leaf's outline at the height y (the law's own outline, leafOf, at rest)
export const leafHalf = (l, y) => { const ty = clamp((y - l.foot) / Math.max(l.top - l.foot, 0.1), 0, 1); return 0.5 * l.waist * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(ty, 0.8))), 0.75); };
// a leaf in the world: the middle of its foot (x, z), its plane's unit normal (nx, nz)
export function leafWorld(l) {
  const m = Math.hypot(l.n[0], l.n[1]), a = l.n[0] / m, b = l.n[1] / m;
  return l.copy === 'b' ? { x: l.p, z: -l.q, nx: a, nz: -b, waist: l.waist, top: l.top, foot: l.foot, spill: l.spill, role: l.role, id: l.id } : { x: K.DARK_OX - l.q, z: K.DARK_OZ - l.p, nx: -b, nz: -a, waist: l.waist, top: l.top, foot: l.foot, spill: l.spill, role: l.role, id: l.id };
}
// A LEAF AGAINST THE WHOLE FLOWN LINE, in the plan: foot, the least distance from the line to the middle of its foot;
// edge, to the nearer end of its foot line; at, the metre of the run where the line is nearest; flown: the line
// passes through it (a point of the line lies within half its waist of its foot's upright, between its foot and its
// top); holds: it is flown through, or it keeps LEAF_BACK
export function leafGap(l) {
  const w = leafWorld(l), hw = (1 + BREATHE) / 2 * l.waist; let foot = 1e9, edge = 1e9, at = 0, flown = false;
  for (const a of routes().world) {
    const dx = a[0] - w.x, dz = a[2] - w.z, d = Math.hypot(dx, dz), e = Math.hypot(dx * w.nx + dz * w.nz, Math.max(Math.abs(dz * w.nx - dx * w.nz) - hw, 0));
    if (d < foot) { foot = d; at = a[3]; }
    if (e < edge) edge = e;
    if (d < l.waist / 2 && a[1] > l.foot && a[1] < l.top) flown = true;
  }
  return { foot, edge, at, flown, holds: flown || edge >= LEAF_BACK * l.top };
}
export const leafTable = () => LEAVES.map((l) => ({ id: l.id, copy: l.copy, p: l.p, q: l.q, waist: l.waist, top: l.top, ...leafGap(l) }));
// A SIDE LEAF (L1 and L2 beside the bright street, L4 beside the dark street): the middle of its foot stands on the
// front line of the home street's houses (K.FRONT from the street's axis), its plane square to the street, facing
// the oncoming line. It is as tall as LEAF_BACK lets a leaf be there (to the tenth of a metre below), SIDE_SHAPE
// times as broad as tall: a low house's height, clear of every fence of the yards. L1, the first leaf, stands on the
// first lot line north of the entry's crossing, on the west side: between two front yards, the dead side of the next
// house seen through it from the entry. L2 stands on the axis of the first cross street, east of the home street;
// L4 the same on the dark copy, west of it.
const SIDE_SHAPE = 0.48, SIDE_TOP = Math.floor(10 * K.FRONT / (LEAF_BACK + (1 + BREATHE) / 2 * SIDE_SHAPE)) / 10;
const sideLeaf = (id, copy, role, p, q, spill, widen, strength) => ({ id, copy, role, p, q, n: [0, -1], waist: SIDE_SHAPE * SIDE_TOP, top: SIDE_TOP, foot: 0.2, spill, fan: [SIDE_SHAPE * SIDE_TOP / 2, widen, strength] });
// THE GREAT LEAVES OF THE AIR (GC, GT, G3) each face the climb's end, where the high place begins and the town lies
// open below; each lays a fan one and a half times its height long.
const toClimbEnd = (p, q) => { const d = Math.hypot(CLIMB_END[0] - p, CLIMB_END[1] - q); return [(CLIMB_END[0] - p) / d, (CLIMB_END[1] - q) / d]; };
const airLeaf = (id, p, q, waist, top, strength) => ({ id, copy: 'd', role: 'great', p, q, n: toClimbEnd(p, q), waist, top, foot: 0, spill: 1.5 * top, fan: [waist / 2, 0.5, strength] });
// GC, right of the climb: in the middle of a crossing: of the first cross street north of the climb's end with the
// first street east of the climb's end that lies LEAF_BACK times the leaf's height, and half its breadth, beyond it.
const GC_SIZE = [12, 36], J_END = Math.ceil(CLIMB_END[1] / K.BLOCK);
const GC_AT = [Math.ceil((CLIMB_END[0] + LEAF_BACK * GC_SIZE[1] + (1 + BREATHE) / 2 * GC_SIZE[0]) / K.BLOCK) * K.BLOCK, J_END * K.BLOCK];
// GT, THE GREATEST LEAF: as tall as the water tower, on the sight line from the climb's end to the tower's axis,
// GT_BEFORE metres before that axis (clear of the legs' feet and of the ring of bulbs), facing the climb's end, and
// moved to the left of that line by half its outline's width at the tank's middle height: seen from the climb, the
// leaf's right edge runs down the middle of the tank, which so stands half dead and half alive.
const GT_BEFORE = 12;
function greatTower() {
  const top = Math.round(TOWER_CAP * K.TS), g = { id: 'GT', copy: 'd', role: 'great', waist: 12, top, foot: 0, spill: 1.5 * top, fan: [6, 0.5, 1.3] };
  const dp = K.TOWER[0] - CLIMB_END[0], dq = K.TOWER[1] - CLIMB_END[1], d = Math.hypot(dp, dq), u = [dp / d, dq / d], off = leafHalf(g, (TOWER_TANK[0] + TOWER_TANK[1]) / 2 * K.TS);
  g.p = K.TOWER[0] - u[0] * GT_BEFORE - u[1] * off; g.q = K.TOWER[1] - u[1] * GT_BEFORE + u[0] * off; g.n = [-u[0], -u[1]];
  return g;
}
// THE LEAVES THAT STAND IN THE OPEN (every leaf that is not door-sized), in the order the list keeps: the bright
// copy's first
const OPEN_LEAVES = [
  sideLeaf('L1', 'b', 'side', -K.FRONT, WALK_OUT + K.LOT, SIDE_TOP, 0.42, 1),
  sideLeaf('L2', 'b', 'side', K.FRONT, K.BLOCK, SIDE_TOP, 0.42, 1),
  { id: 'L3', copy: 'b', role: 'first', p: K.THIN1[0], q: K.THIN1[1], n: [1, 0], waist: 5, top: 15, foot: 0.2, spill: -16, fan: [2.5, 0.42, 1] },
  sideLeaf('L4', 'd', 'great', -K.FRONT, K.BLOCK, 20, 0.5, 1.15),
  airLeaf('GC', GC_AT[0], GC_AT[1], GC_SIZE[0], GC_SIZE[1], 1.25),
  greatTower(),
  // G3: in the roadway of the home street's far crossing, a block north of Main Street: the dead street's goal and the turn's
  airLeaf('G3', 0, MAIN.q + K.BLOCK, 14, 36, 1.3),
  { id: 'LR', copy: 'd', role: 'great', p: K.RING[0], q: K.RING[1], n: [1, 0], waist: 24, top: 36, foot: 0, spill: 175, fan: [5, 0.022, 2.1] },
];
// THE OPEN GREEN (one rule of the plan for every great leaf that stands in a crossing: the middle of its foot in the
// roadway of a north-south street and of a cross street): (1) THE FOUR CORNER LOTS OF ITS CROSSING HOLD NO HOUSE
// (cornerOf: a lot whose front's middle stands within a front line and a half of the crossing's middle); (2) NO LOT
// HOLDS A HOUSE whose ground (lotGround: its frontage, from its walk's outer edge to its block's middle line) comes
// within ONE HEIGHT OF THE LEAF BEHIND THE LEAF'S FOOT LINE, ACROSS ITS BREADTH (its breadth a tenth wider, as it
// breathes). By the lots' ground, read from K and the leaf's own measures: the same greens on every seed and on
// both copies. (3) NO STREET TREE STANDS WHERE ITS CROWN WOULD REACH INTO THAT SAME GROUND (greenKeepsTree: one
// height deep behind the foot line, across the breadth): a great tree of the verge, 13 to 18 m tall with a crown
// as broad as the leaf, is one mass in the leaf as a house is. Such a lot is lawn: the verge's other trees stand
// by their own rule, and each corner yard of the crossing has the small wound tree a lit corner yard of this town
// has (dealTrees), no tree within TREE_OFF of the leaf's foot line. What shows through the leaf is so the town in
// depth, never one house, row or crown close behind it.
const cornerOf = (fp, fq, mid) => Math.hypot(fp - mid[0], fq - mid[1]) < 1.5 * K.FRONT;
const lotGround = (i, j, side, k) => { const t = lotPlace(i, j, side, k), deep = K.BLOCK / 2 - WALK_OUT; return { p: t.fp - t.face[0] * (deep / 2 - K.YARD), q: t.fq - t.face[1] * (deep / 2 - K.YARD), dir: t.face, hl: deep / 2, hw: K.LOT / 2 }; };
// do two rectangles of the plan { p, q, dir (unit, along hl), hl, hw } meet
const rectsMeet = (a, b) => {
  for (const u of [a.dir, [-a.dir[1], a.dir[0]], b.dir, [-b.dir[1], b.dir[0]]]) {
    const reach = (r) => r.hl * Math.abs(u[0] * r.dir[0] + u[1] * r.dir[1]) + r.hw * Math.abs(u[1] * r.dir[0] - u[0] * r.dir[1]);
    if (Math.abs((b.p - a.p) * u[0] + (b.q - a.q) * u[1]) > reach(a) + reach(b)) return false;
  }
  return true;
};
const inRoadway = (v) => Math.abs(v - Math.round(v / K.BLOCK) * K.BLOCK) < K.ROAD / 2;
// each such leaf's green: mid, the middle of its crossing; behind, the ground one height deep behind its foot line
export const GREENS = OPEN_LEAVES.filter((l) => l.role === 'great' && inRoadway(l.p) && inRoadway(l.q)).map((l) => {
  const m = Math.hypot(l.n[0], l.n[1]), n = [l.n[0] / m, l.n[1] / m];
  return { id: l.id, mid: [Math.round(l.p / K.BLOCK) * K.BLOCK, Math.round(l.q / K.BLOCK) * K.BLOCK], behind: { p: l.p - n[0] * l.top / 2, q: l.q - n[1] * l.top / 2, dir: n, hl: l.top / 2, hw: (1 + BREATHE) / 2 * l.waist } };
});
// how far a tree's crown reaches from its trunk, by its kind (the skeleton's own measure)
const crownReach = (kind, H) => H * (kind === 'oak' ? 0.46 : kind === 'elm' ? 0.4 : 0.36);
// does a street tree at (p, q) keep its crown out of every open green's ground behind its leaf
const greenKeepsTree = (p, q, kind, H) => {
  for (const { behind: b } of GREENS) {
    const u = (p - b.p) * b.dir[0] + (q - b.q) * b.dir[1], v = (q - b.q) * b.dir[0] - (p - b.p) * b.dir[1];
    if (Math.hypot(Math.max(0, Math.abs(u) - b.hl), Math.max(0, Math.abs(v) - b.hw)) < crownReach(kind, H)) return false;
  }
  return true;
};
// THE GREEN LOTS, worked out once at load (the greens are the plan's, the same on every seed): every lot of the
// blocks that a green's crossing or its ground behind the leaf can reach is asked the rule's two questions
const GREEN_LOTS = new Set();
for (const G of GREENS) {
  const b = G.behind, far = Math.hypot(b.hl, b.hw) + K.BLOCK / 2;
  const i0 = Math.floor(Math.min(G.mid[0] - 1.5 * K.FRONT, b.p - far) / K.BLOCK), i1 = Math.floor(Math.max(G.mid[0] + 1.5 * K.FRONT, b.p + far) / K.BLOCK);
  const j0 = Math.floor(Math.min(G.mid[1] - 1.5 * K.FRONT, b.q - far) / K.BLOCK), j1 = Math.floor(Math.max(G.mid[1] + 1.5 * K.FRONT, b.q + far) / K.BLOCK);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const side of ['W', 'E', 'S', 'N']) for (let k = 0; k < (side === 'W' || side === 'E' ? 4 : 2); k++) {
    const t = lotPlace(i, j, side, k);
    if (cornerOf(t.fp, t.fq, G.mid) || rectsMeet(lotGround(i, j, side, k), b)) GREEN_LOTS.add(i + ':' + j + ':' + side + ':' + k);
  }
}
export const greenLot = (i, j, side, k) => GREEN_LOTS.has(i + ':' + j + ':' + side + ':' + k);
// THE HALL HOUSES: the lots whose houses stand, lit, behind a door-sized leaf on every seed. ONE RULE FOR ALL FOUR:
// in its row, counting from its named place, THE FIRST LOT THAT IS NO OPEN GREEN AND WHOSE LEAF KEEPS LEAF_BACK from
// the line. H1: the dead street's west side, counting north from the plane's crossing. H2: its east side, counting
// north from the lot beyond H1's (a lot further on and across the street, as the shop leaves alternate). HC: the row
// north of the cross street the climb goes over (the first thin place's street), counting east from the home
// street. H3: the row north of the first cross street beyond the climb's end, counting east from the home street.
// (A row along the home street ends at the thin place's cross street; a row along a cross street ends at the street
// the leaf GC stands in.) HALL_GAP: the leaf stands this far before the front wall.
const HALL_GAP = 3, J_OVER = Math.round(K.THIN1[1] / K.BLOCK);
const hallLeaf = (a, id) => { const t = lotPlace(a[0], a[1], a[2], a[3]), home = t.face[0] !== 0; return { id, copy: 'd', role: 'door', p: t.fp + t.face[0] * HALL_GAP, q: t.fq + t.face[1] * HALL_GAP, n: t.face, waist: 2.8, top: 5.2, foot: 0.15, spill: home ? 19 : 24, fan: [1.4, home ? 0.55 : 0.6, 1.3] }; };
// the lots of a row, in the order they are counted: along the home street's side `side` north from the plane's
// crossing; along the north side of the cross street q = j blocks, east from the home street
const rowHome = (i, side) => { const out = []; for (let j = 0; j < J_OVER; j++) for (let k = 0; k < 4; k++) out.push([i, j, side, k]); return out; };
const rowCross = (j) => { const out = []; for (let i = 0; i * K.BLOCK < GC_AT[0]; i++) for (let k = 0; k < 2; k++) out.push([i, j, 'S', k]); return out; };
const hallLot = (row) => row.find((a) => !greenLot(a[0], a[1], a[2], a[3]) && leafGap(hallLeaf(a, '')).holds);
const HALL_1 = hallLot(rowHome(-1, 'E')), HALL_2 = hallLot(rowHome(0, 'W').filter((a) => HALL_1 && lotPlace(a[0], a[1], a[2], a[3]).fq > lotPlace(HALL_1[0], HALL_1[1], HALL_1[2], HALL_1[3]).fq));
const HALLS = [['H1', HALL_1], ['H2', HALL_2], ['HC', hallLot(rowCross(J_OVER))], ['H3', hallLot(rowCross(J_END))]].filter((h) => h[1]);
const isHall = (h) => HALLS.some(([, a]) => a[0] === h.i && a[1] === h.j && a[2] === h.side && a[3] === h.k);
// role: 'side' (the bright street's two), 'first' (L3), 'great' (the dark copy's standing leaves: L4 beside the dead
// street at its first crossing; GC, GT and G3 over the town, beside each other as the climb sees them; LR the last,
// the ONE great leaf of Main Street), 'door' (door-sized leaves in shop fronts and before house fronts: a wall
// stands behind each).
export const LEAVES = [
  ...OPEN_LEAVES,
  // FOUR DOOR-SIZED LEAVES IN MAIN STREET'S SHOP FRONTS, on alternate sides, each 0.35 m before the open front of its
  // own anchor store (ANCHORS), in the middle of that front
  ...ANCHORS.map((a, k) => ({ id: 'S' + (k + 1), copy: 'd', role: 'door', p: a.p0 + a.w / 2, q: MAIN.q + (a.north ? 1 : -1) * (MAIN.front - 0.35), n: [0, a.north ? -1 : 1], waist: 5, top: 4.6, foot: 0.12, spill: 17, fan: [2.4, 0.5, 1.4] })),
  // DOOR-SIZED LEAVES BEFORE HOUSE FRONTS OF THE DEAD TOWN, each HALL_GAP before the front wall of its hall house
  // (HALLS), facing its street; each lays its fan of warm light over the snowed path and the roadway
  ...HALLS.map(([id, a]) => hallLeaf(a, id)),
];
export const NL = LEAVES.length, NB = LEAVES.filter((l) => l.copy === 'b').length;   // (NB: the bright copy's leaves, which stand first in the list)
// NO TREE BEFORE A LEAF: one rule for every leaf alike, counted from the leaf: no tree stands within TREE_OFF of a
// leaf's foot line across its breadth: before it, behind it or beside it. By plan place, so on both copies; a leaf
// that stands in the plane itself (the first thin place) is counted at its place in each copy's plan.
// LEAF_LINES: each leaf's foot line in the plan: [p, q, the line's unit vector (2), half its length, door-sized]
const LEAF_LINES = [];
for (const l of LEAVES) {
  const m = Math.hypot(l.n[0], l.n[1]), a = l.n[0] / m, b = l.n[1] / m, hw = (1 + BREATHE) / 2 * l.waist, w = leafWorld(l);
  LEAF_LINES.push([l.p, l.q, -b, a, hw, l.role === 'door']);
  if (Math.abs(w.x - K.PLANE_X) < TREE_OFF) LEAF_LINES.push(l.copy === 'b' ? [K.DARK_OZ - w.z, K.DARK_OX - w.x, a, b, hw, l.role === 'door'] : [w.x, -w.z, a, b, hw, l.role === 'door']);
}
const leafKeepsTree = (p, q) => { for (const [lp, lq, tp, tq, hw] of LEAF_LINES) { const s = clamp((p - lp) * tp + (q - lq) * tq, -hw, hw); if (Math.hypot(p - lp - s * tp, q - lq - s * tq) < TREE_OFF) return false; } return true; };

// ---------------------------------------------------------------------------------------------- the flight: pace and looks, by places
// WHAT THE WORLD HANDS THE ENGINE, written once: fov, the lens's angle in degrees; ahead, the metres along the line
// at which the engine's gaze rests; sway and bank as the engine takes them; seconds, the flight's length. Of these
// the plan reads `ahead` alone (a pace changes where the gaze, resting that far on, comes to a turn): no place, size,
// look or pace of the world is worked out from the lens's angle or the picture's shape.
export const LENS = { fov: 64, ahead: 24, sway: 0.4, bank: 0.2, seconds: 50 };
// EASE: the metres over which a look is taken up or let go and a change of pace or of the gaze's tilt is made (two
// and a half seconds at the streets' pace). UP: the gaze's rest above the line's own way along the streets and its
// tilt over the high place; MAIN_UP: its rest above level down Main Street.
const EASE = 40, UP = 7 * Math.PI / 180, MAIN_UP = 8 * Math.PI / 180;
// THE FLIGHT'S PACE AND ITS THREE LOOKS, each given by the PLACE of its subject in metres of the line (the marks of
// routes()); no share of the flight and no clock stands in them (the world turns the metres into the shares the
// engine asks for). A look: from, to (metres between which it holds), ease (metres over which it comes and goes at
// either end), weight (the engine's blend of it with the line's own way), at(m, pos, out): the point looked at from
// metre m, where pos(m, out) gives the line's own point at a metre.
let _flight = null;
export function flight() {
  if (_flight) return _flight;
  const R = routes(), M = R.marks, L = R.length, A = LENS.ahead;
  // THE PACE in metres a second (the engine scales the whole so that the flight lasts LENS.seconds), each change
  // eased between two places
  const speedAt = (m) => {
    let v = 15.5;                                                                 // the living street
    v = lerp(v, 14, smoothstep(M.bturn - A, M.bturn, m));                         // the bright turn at the corner lawn: slower from the place where the gaze, which rests A metres on, begins to turn (the turn stays under 26 degrees a second)
    v = lerp(v, 14.5, smoothstep(M.bturnEnd, M.bturnEnd + A, m));                 // out of it: the cross street and the dead street, a little slower than the living one (the change of the look wants its time)
    v = lerp(v, 20, smoothstep(M.climb, M.clear + EASE, m));                      // the climb: gathered from its foot until the line is an ease's length past the street's eaves
    v = lerp(v, 15, smoothstep(M.high - EASE, M.high, m));                        // SLOW over the high place (the whole town and the tower stand there), eased over the climb's last metres
    v = lerp(v, 19, smoothstep(M.sink, M.sink + EASE, m));                        // the sinking turn, from where the line begins to sink, abreast of the water tower
    v = lerp(v, 17, smoothstep(M.turnEnd - EASE / 2, M.turnEnd + EASE / 2, m));   // Main Street, across the turn's end
    v = lerp(v, 13, smoothstep(M.low, M.up, m));                                  // slowest before the shop fronts and the last leaf: from where the line is down at the fronts' height to where it begins to rise to the ring
    return v;
  };
  // the tangent of the elevation of a point that the engine's blend, weight w, with a level way brings to the angle th
  const liftFor = (th, w) => Math.tan(th + Math.asin(Math.sin(th) * (1 - w) / w));
  const twr = darkW(K.TOWER[0], K.TOWER[1]), rg = darkW(K.RING[0], K.RING[1]), o = darkW(0, 0), wst = darkW(-1, 0), west = [wst[0] - o[0], wst[1] - o[1]];   // (west along Main Street's axis, in the world)
  const e = [0, 0, 0], a = [0, 0, 0];
  // (1) THE STREET LOOK: along the bright street and the dark street, from before the entry (so that it stands whole
  // there; the engine's own guard eases the flight's first metres) to the place where the line has risen clear of
  // the street, the gaze rests UP above the line's own way: the point A metres on along the line, raised: toward the
  // strings overhead and the street's far end, a small angle, so that walls, masts and poles stay near upright.
  const WS = 0.6, liftS = liftFor(UP, WS);
  const street = { from: -EASE, to: M.clear, ease: EASE, weight: WS, steady: true, at: (m, pos, out) => { pos(m + A, out); out[1] += A * liftS; return out; } };
  // (2) THE ONE LOOK OF THE AIR, from the climb's foot until EASE metres past the turn's end over Main Street, as a
  // bearing and a pitch by the metres of the line. UP THE CLIMB the gaze rests on THE WATER TOWER's axis at the high
  // place's own height (level there). OVER THE HIGH PLACE it is tilted UP besides, toward the northern lights over
  // the whole town, eased in over the climb's last EASE metres and out over the first EASE metres of the sinking.
  // THE PAN goes with the turn, from the place where the turn begins to the place where it ends over Main Street:
  // the gaze swings left, eased, by the north, from the tower to the ring at the far end of Main Street, and its
  // pitch goes from the tower's to the ring's centre; at the turn's end the line itself heads for the ring.
  const air = { from: M.climb, to: M.turnEnd + EASE, ease: EASE, weight: 0.92, steady: false, at: (m, pos, out) => {
    pos(m, e);
    const s = smoothstep(M.high, M.turnEnd, m), b0 = Math.atan2(twr[1] - e[2], twr[0] - e[0]);
    let b1 = Math.atan2(rg[1] - e[2], rg[0] - e[0]); while (b1 - b0 > Math.PI) b1 -= 2 * Math.PI; while (b1 - b0 < -Math.PI) b1 += 2 * Math.PI;
    const b = b0 + (b1 - b0) * s, tilt = UP * smoothstep(M.high - EASE, M.high, m) * (1 - smoothstep(M.sink, M.sink + EASE, m));
    const ph = Math.atan2(K.TOP - e[1], Math.hypot(twr[0] - e[0], twr[1] - e[2])) * (1 - s) + Math.atan2(K.RING[2] - e[1], Math.hypot(rg[0] - e[0], rg[1] - e[2])) * s + tilt;
    out[0] = e[0] + Math.cos(b) * Math.cos(ph) * 100; out[1] = e[1] + Math.sin(ph) * 100; out[2] = e[2] + Math.sin(b) * Math.cos(ph) * 100; return out;
  } };
  // (3) MAIN STREET (round seven, D): from the turn's end to beyond the ring (so that it stands whole at the end) THE
  // GAZE RESTS MAIN_UP ABOVE LEVEL AND NEVER MORE: a point A metres to the west of the lens, raised so that the
  // engine's blend of it with the line's own way, which rises to the ring at the end, comes to that angle. There is
  // no look up at the tree: walls stand upright to the end.
  const WM = 0.6;
  const main = { from: M.turnEnd, to: L + EASE, ease: EASE, weight: WM, steady: true, at: (m, pos, out) => { pos(Math.min(m + A, L), a); pos(Math.min(m, L), e); out[0] = e[0] + west[0] * A; out[1] = e[1] + (A * Math.tan(MAIN_UP) - (1 - WM) * (a[1] - e[1])) / WM; out[2] = e[2] + west[1] * A; return out; } };
  return (_flight = { speedAt, looks: [street, air, main] });
}
// NEAR_PLANE (the world's rule for what is drawn, by where the eye stands; written once): the copy beyond the plane,
// with the rims of its leaves, is drawn while the eye stands within this many metres of the plane.
export const NEAR_PLANE = 60;
// THE LINES THE WORLD CUTS ITS LOTS BY, named here once. (A lot is a share of the fine things that is drawn
// together, by where the eye STANDS; no thing's place or look follows from a lot.) Each is a line of the plan:
//   firstP, firstQ: the dark copy's FIRST STREET: the fronts either side of the home street inside the next
//     streets' walks, from the plane to the middle of the blocks beyond the cross street of the first thin place;
//   overQ: the near walk of that cross street; endQ: the cross street beyond the climb's end; northQ: that street's
//     far walk (what lies beyond is the north lot, drawn while the eye stands within northSeen metres of that line);
//   west(k): the middle line of the k-th block west of the home street (so a north-south street lies whole in a lot)
export const LOTS = {
  firstP: K.BLOCK - WALK_OUT, firstQ: K.THIN1[1] + K.BLOCK / 2, overQ: K.THIN1[1] - WALK_OUT,
  endQ: J_END * K.BLOCK, northQ: J_END * K.BLOCK + WALK_OUT, northSeen: 140,
  west: (k) => -(k - 0.5) * K.BLOCK,
};
// A STREET THING IS THE BRIGHT COPY'S where it stands east of the plane, within the bright copy's bounds or on the
// far verge of a street that bounds them (a street's masts and posts stand on both its verges)
export const brightThing = (p, q) => { const [p0, p1, q0, q1] = brightBounds(), m = K.ROAD / 2 + K.VERGE; return p > p0 && p < p1 + m && q > q0 - m && q < q1 + m; };
// A STREET LAMP'S MEASURES: its mast behind the walk, its head over the roadway, the head's height
export const LAMP = { mast: WALK_OUT + 0.2, head: K.ROAD / 2 - 0.1, y: 8.2 };
// THE BRIGHT COPY'S PART THAT ITS SIDE LEAVES CAN SHOW DEAD (written once: the rime's and the moon shadows' dress of
// the bright copy is made for it and drawn by it): from a yard's depth before the first side leaf's plane north to
// the near walk of the cross street the first thin place stands in, and to either side as far as the front lines of
// the houses that face the two neighbouring streets
export const DEAD_B = { p: K.BLOCK - K.FRONT, q0: LEAVES[0].q - K.YARD, q1: K.THIN1[1] - WALK_OUT };
export const deadB = (p, q) => Math.abs(p) < DEAD_B.p && q > DEAD_B.q0 && q < DEAD_B.q1;
// least distance from a plan point (p, q, y) to a track (a list of [p, q, y]); points are a metre apart
export function trackDist(track, p, q, y) {
  let best = 1e18, bestR = 1e9;                 // the least squared distance so far, and its root
  for (let i = 0, n = track.length; i < n;) {
    const a = track[i], d = (a[0] - p) * (a[0] - p) + (a[1] - q) * (a[1] - q) + (a[2] - y) * (a[2] - y);
    if (d < best) { best = d; bestR = Math.sqrt(d); i++; }
    // 20 m and more beyond the least: the track's points lie at most 1.024 m apart, so none of those passed over can
    // be nearer than the least (the same answer, found sooner)
    else if (d > best + 40 * bestR + 400) i += Math.floor((Math.sqrt(d) - bestR) / 1.03);
    else i++;
  }
  return bestR;
}
// least distance from a plan segment a-b to BOTH tracks (the bright one counts only where the bright copy stands, east of the plane;
// the dark one only where the dark copy stands, q > 0), sampled every half metre along the segment
export function routeDist(a, b, both = false) {
  const R = routes(), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.5));
  let best = 1e9;
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = lerp(a[0], b[0], t), q = lerp(a[1], b[1], t), y = lerp(a[2], b[2], t);
    if (both || p > K.THIN1[0] - 12) best = Math.min(best, trackDist(R.bright, p, q, y));
    if (both || q > -12) best = Math.min(best, trackDist(R.dark, p, q, y));
  }
  return best;
}

// the coarse map as a first sieve for a segment a-b: true when it certainly keeps more than `need` metres from both
// routes (its midpoint's cell centre is that far and more; 5.7 m is the cell's half diagonal). The answers are the same.
const farSeg = (a, b, need) => routeNear((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) - 5.7 - Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 > need;

// NOTHING NEAR THE LINE IN THE CLIMB AND OVER THE HIGH PLACE: the least distance from an upright (p, q, 0 to h) to the
// dark route from the place where the line has risen clear of the street (AIR_Y: the eaves' line of the street's
// lowest houses; below that it flies among the street's own things and the street's rule holds) to the end of the
// high place, where the line begins to sink. A pole, a mast, a post, a house, a shed or a car keeps AIR_KEEP from
// it (airClear: the same for a box), and so does a tree with every limb and every clump of its crown (treeStands):
// while the line rises through the height of the crowns no bough hangs close beside it.
const AIR_KEEP = 12;
let _air = null;
const airSpan = () => { if (!_air) { const T = routes().dark; _air = [T.marks.clear, T.marks.sink]; } return _air; };
export function airNear(p, q, h) { const T = routes().dark, [AIR0, AIR1] = airSpan(); let best = 1e9; for (let i = AIR0; i <= AIR1; i++) { const a = T[i], d = Math.hypot(a[0] - p, a[1] - q, Math.max(a[2] - h, 0)); if (d < best) best = d; } return best; }
// A STANDING THING (a post, a mast, a pole: plan place, height, radius) keeps 8 m from a route where the line is
// low (under 4 m) and 3 m where the route passes high over it, against BOTH routes
export function standClear(p, q, h, r, brightOnly = false) {
  const R = routes();
  for (const T of brightOnly ? [R.bright] : [R.bright, R.dark]) for (let i = 0; i < T.length; i++) {
    const a = T[i], dx = a[0] - p, dq = a[1] - q; if (Math.abs(dx) > 8 || Math.abs(dq) > 8) continue;
    const dy = Math.max(a[2] - h, 0, -a[2]), d = Math.hypot(dx, dq, dy) - r;
    if (d < (a[2] < 4 ? 8.12 : 3)) return false;   // 8 m where the line is low; 0.12 m more for the spline between the track's points
  }
  return true;
}

// FOR THE LEVELS OF DETAIL ONLY (round four, room): the distance from a point 6 m up to the nearer route, from a
// coarse map (8 m cells, read between their centres); 1e9 beyond 100 m. No rule of the plan reads this.
let _lod = null;
export function lodDist(p, q) {
  const { C, G0, GN } = MAP, RAD = 12;
  if (!_lod) {
    const R = routes(); _lod = new Float32Array(GN * GN).fill(1e9);
    for (const T of [R.bright, R.dark]) for (let k = 0; k < T.length; k += 4) {
      const t = T[k], c0 = Math.floor((t[0] - G0) / C), c1 = Math.floor((t[1] - G0) / C), dy = (t[2] - 6) * (t[2] - 6);
      for (let b = Math.max(0, c1 - RAD); b <= Math.min(GN - 1, c1 + RAD); b++) for (let a = Math.max(0, c0 - RAD); a <= Math.min(GN - 1, c0 + RAD); a++) {
        const dx = (a + 0.5) * C + G0 - t[0], dq = (b + 0.5) * C + G0 - t[1], d = dx * dx + dq * dq + dy; if (d < _lod[b * GN + a]) _lod[b * GN + a] = d;
      }
    }
    for (let k = 0; k < _lod.length; k++) _lod[k] = _lod[k] < 1e8 ? Math.sqrt(_lod[k]) : 1e9;
  }
  const fx = (p - G0) / C - 0.5, fy = (q - G0) / C - 0.5, ci = Math.floor(fx), cj = Math.floor(fy);
  if (ci < 0 || cj < 0 || ci >= GN - 1 || cj >= GN - 1) return 1e9;
  const a = _lod[cj * GN + ci], b = _lod[cj * GN + ci + 1], c = _lod[(cj + 1) * GN + ci], d = _lod[(cj + 1) * GN + ci + 1];
  if (a > 1e8 || b > 1e8 || c > 1e8 || d > 1e8) return Math.min(a, b, c, d) > 1e8 ? 1e9 : Math.min(a, b, c, d);
  const tx = fx - ci, ty = fy - cj; return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

// a coarse map (8 m cells) of the plan distance to the nearer of the two routes: a first sieve for the tests below
let _map = null;
export function routeNear(p, q) {
  const { C, G0, GN } = MAP;
  if (!_map) {
    const R = routes(); _map = new Float32Array(GN * GN).fill(1e9);
    for (const T of [R.bright, R.dark]) for (const t of T) for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) {
      const ci = Math.floor((t[0] - G0) / C) + a, cj = Math.floor((t[1] - G0) / C) + b; if (ci < 0 || cj < 0 || ci >= GN || cj >= GN) continue;
      const d = Math.hypot((ci + 0.5) * C + G0 - t[0], (cj + 0.5) * C + G0 - t[1]); if (d < _map[cj * GN + ci]) _map[cj * GN + ci] = d;
    }
  }
  const ci = Math.floor((p - G0) / C), cj = Math.floor((q - G0) / C);
  return ci < 0 || cj < 0 || ci >= GN || cj >= GN ? 1e9 : _map[cj * GN + ci];
}

// ---------------------------------------------------------------------------------------------- the plan: lots and houses
export const PAINTS = ['#e8e2d4', '#b9c7c9', '#d8c9a0', '#8f9aa0', '#c96a50'];
export const ROOFS = ['#2c2f36', '#4a3a34'];
export const BULBS = ['#e23a2e', '#2fae4a', '#2f6fe0', '#ffb21c', '#ff6fb0', '#f4f0e0'];
// bulb mixes a house or a string is dealt: all six; red and green; blue and white; all amber
export const MIXES = [[0, 1, 2, 3, 4, 5], [0, 1], [2, 5], [3]];
const HOUSE_KINDS = ['gable', 'four', 'bung', 'ell', 'ranch'];
const lotRng = (seed, name) => makeRng(hashSeed(name + ':' + seed));
// THE SAME ON EVERY SEED, said here once: the square's great oak is ONE tree, the goal's own landmark, as the
// courthouse and the bandstand beside it are one building each; it is dealt from its name alone (EVERY_SEED stands
// where a seed would). Every other stream of this file comes from the seed and a name.
export const EVERY_SEED = 'every seed';
// which blocks exist: the town reaches about 700 m from the origin, within TOWN's block numbers (written once: the
// world's loop over the town reads them too)
export const TOWN = { i0: -9, i1: 8, j0: -1, j1: 8 };
// THE COARSE MAPS' GROUND (the first sieves of the clear-air tests, the levels of detail, the rime): square cells C
// metres wide over the whole of TOWN's breadth, both ways from its west edge (G0), GN cells to a side
const MAP = { C: 8, G0: TOWN.i0 * K.BLOCK, GN: (TOWN.i1 + 1 - TOWN.i0) * K.BLOCK / 8 };
export function blockExists(i, j, seed) {
  if (j < TOWN.j0 || j > TOWN.j1 || i < TOWN.i0 || i > TOWN.i1) return false;
  const cp = (i + 0.5) * K.BLOCK, cq = (j + 0.5) * K.BLOCK, r = Math.hypot(cp, cq);
  return r < 640 + 90 * lotRng(seed, 'edge:' + i + ':' + j)();
}
// WHERE EACH COPY STANDS (written once; the world builds by these): the dark copy north of the plane (plan q 0 and
// more); the bright copy east of the plane, in the blocks whose middle lies within two blocks' length of the
// rectangle the bright line spans in the plan
export const inDark = (i, j) => j * K.BLOCK >= 0;
let _brightSpan = null;
export function inBright(i, j) {
  if (!_brightSpan) _brightSpan = spanOf([routes().bright], 2);
  return i * K.BLOCK >= K.THIN1[0] && i <= _brightSpan.i1 && j >= _brightSpan.j0 && j <= _brightSpan.j1;
}
// the bright copy's built ground in the plan: [p0, p1, q0, q1] (the plane to its last block's east edge; its first
// block row's south edge to its last one's north edge)
export function brightBounds() { inBright(0, 0); const S = _brightSpan, B = K.BLOCK; return [K.THIN1[0], (S.i1 + 1) * B, Math.max(S.j0, TOWN.j0) * B, (S.j1 + 1) * B]; }
// the blocks whose middle lies within `blocks` blocks' length of the rectangle the given tracks span in the plan
function spanOf(tracks, blocks) {
  const B = K.BLOCK, reach = blocks * B; let p0 = 1e9, p1 = -1e9, q0 = 1e9, q1 = -1e9;
  for (const T of tracks) for (const t of T) { p0 = Math.min(p0, t[0]); p1 = Math.max(p1, t[0]); q0 = Math.min(q0, t[1]); q1 = Math.max(q1, t[1]); }
  const lo = (v) => Math.ceil((v - reach) / B - 0.5), hi = (v) => Math.floor((v + reach) / B - 0.5);
  return { i0: lo(p0), i1: hi(p1), j0: lo(q0), j1: hi(q1) };
}
// THE NEAR TOWN, written once: the blocks whose middle lies within one block's length of the rectangle the two lines
// span in the plan (i0..i1, j0..j1). In these blocks the streets' small things are dealt (drives, cars, mailboxes;
// a hydrant at every crossing inside them); lamps, poles and kerb cars stand along the street lines that bound
// them, where a block stands on each side of the street (streetAt)
let _span = null;
export function span() { if (!_span) { const R = routes(); _span = spanOf([R.bright, R.dark], 1); } return _span; }
// is the place (p, q) on the north-south street line p = B k (ns) or the cross street line q = B j a street of the town: a block on each side
const streetAt = (seed, ns, n, at) => { const m = Math.floor(at / K.BLOCK); return ns ? blockExists(n, m, seed) && blockExists(n - 1, m, seed) : blockExists(m, n, seed) && blockExists(m, n - 1, seed); };
// what a block is: the courthouse square is the block the courthouse stands in; every other holds homes (and, on a
// side that faces Main Street, a row of stores: mainRow)
export function blockKind(i, j) { return inBlock(K.COURT, i, j) ? 'square' : 'homes'; }
const isMainSide = (i, j, side) => mainRow(i, j, side) !== 0;
// one lot's house, dealt from the lot's own stream. face: unit vector from the house toward its street.
function dealHouse(seed, i, j, side, k) {
  const r = lotRng(seed, 'lot:' + i + ':' + j + ':' + side + ':' + k);
  const corner = (side === 'W' || side === 'E') && (k === 0 || k === 3), cross = side === 'S' || side === 'N';
  let kind = HOUSE_KINDS[Math.min(4, Math.floor(r() * 4.45))];
  const paint = Math.floor(r() * 5), roof = Math.floor(r() * 2);
  let w = r.range(8, 11), dp = r.range(10, 13), ridge = r.range(6.8, 9.5);
  const strung = r() < 0.8, mix = Math.floor(r() * 4), litSeed = r(), drive = r() < 0.5, extra = r(), extra2 = r();
  if (corner) dp = Math.min(dp, 10.4);
  if (cross) { w = Math.min(w, 8.8); dp = Math.min(dp, 11); if (kind === 'ranch') kind = 'bung'; }
  if (kind === 'bung') ridge = Math.min(ridge, 7.2);
  if (kind === 'ranch') { ridge = 5.2 + (ridge - 6.8) * 0.3; w = Math.min(11, w + 1.2); }
  const t = lotPlace(i, j, side, k);
  // (seed: the deal's own, kept on the record so that a builder's stream is named by the seed and the lot)
  return { id: i + ':' + j + ':' + side + ':' + k, seed, i, j, side, k, kind, paint, roof, w, dp, ridge, fp: t.fp, fq: t.fq, face: t.face, strung, mix, litSeed, drive, extra, extra2 };
}
// a store of Main Street: a brick box with a cornice; front wall MAIN.front from the street's centre line. THE ONE
// BLANK MARQUEE (canopy) is the south fronts' corner store opposite the courthouse square's west corner (the store
// that holds the point a metre inside its row's west end)
const MARQUEE_P = SQUARE_W + WALK_OUT + 1;
function dealStore(seed, i, j, side, k, p0, w) {
  const r = lotRng(seed, 'store:' + i + ':' + j + ':' + k);
  const h = r.range(8, 10), brick = Math.floor(r() * 6), awn = r() < 0.6, canopy = side === 'N' && p0 <= MARQUEE_P && p0 + w > MARQUEE_P, litSeed = r(), extra = r();
  const fq = side === 'N' ? MAIN.q - MAIN.front : MAIN.q + MAIN.front, face = side === 'N' ? [0, 1] : [0, -1];
  const three = extra > 0.64 && !canopy;   // round three: about a third of the stores stand three storeys tall
  return { id: 'st:' + i + ':' + j + ':' + k, seed, i, j, side, k, kind: 'store', w, dp: r.range(MAIN.deep - 5, MAIN.deep), ridge: h + (three ? 3.5 : 0), three, fp: p0 + w / 2, fq, face, brick, awn, canopy, litSeed, extra, strung: true, mix: Math.floor(r() * 4), paint: 4, roof: 0 };
}
// A LOT A LANDMARK TAKES, by rules in space on the lot's front point (fp, fq): (1) THE CHURCHYARD: 28 m either way
// from the church's axis along its cross street (east as far as the corner lawn the bright turn rounds), 14 m either
// way along its side street (the nave is 24 m long); (2) UNDER THE WATER TOWER: within its legs' feet and 3 m
// (TOWER_KEEP: no thing of a back yard stands within it either: dealBack);
// (3) IN THE DEPTH OF MAIN STREET'S ROWS OF STORES (round five): within the stores' front line, their greatest depth
// and half a house's width of the axis, between the home street and the last leaf's plane; (4) ON THE PLAZA
// (round six), beyond the last leaf.
const TOWER_KEEP = 6.6 * K.TS + 3;
const CHURCH_YARD = [28, 14], CROSS1 = [0, K.BLOCK];   // (CROSS1: the middle of the home street's first crossing, where the signal hangs)
const lotTaken = (fp, fq) => (Math.abs(fp - K.CHURCH[0]) < CHURCH_YARD[0] && Math.abs(fq - K.CHURCH[1]) < CHURCH_YARD[1])
  || Math.hypot(fp - K.TOWER[0], fq - K.TOWER[1]) < TOWER_KEEP
  || (Math.abs(fq - MAIN.q) < MAIN.front + MAIN.deep + 5.5 && fp < 0 && fp > K.RING[0])
  || Math.hypot(fp - K.PLAZA[0], fq - K.PLAZA[1]) < K.PLAZA[2];
// THE CORNER LAWN the bright turn rounds: a lot whose front point lies within the turn's own circle (buildCorner dresses it)
const cornerLawn = (fp, fq) => Math.hypot(fp + LINE.BR, fq - (K.THIN1[1] - LINE.BR)) < LINE.BR;
// every house of one block (stores on Main Street; none where a landmark stands)
const _blocks = new Map(); let _blocksSeed = null;
export function dealBlock(seed, i, j) {
  // (kept for the seed: the world, the tree deal and the rime all ask for the same block; nobody writes to a dealt house)
  if (_blocksSeed !== seed) { _blocks.clear(); _blocksSeed = seed; }
  const key = i * 64 + j, had = _blocks.get(key); if (had) return had;
  const out = [], kind = blockKind(i, j); _blocks.set(key, out);
  if (kind === 'square') return out;
  for (const side of ['W', 'E', 'S', 'N']) {
    if (isMainSide(i, j, side)) {
      // a row of stores between the block's two side walks, east of the last leaf's plane (west of it, about the
      // plaza, none stands), each 7 to 10 m wide, wall to wall
      const r = lotRng(seed, 'row:' + i + ':' + j), pa = Math.max(i * K.BLOCK + WALK_OUT, K.RING[0]), pb = (i + 1) * K.BLOCK - WALK_OUT;
      let p = pa, k = 0;
      const first = out.length, anc = ANCHORS.find((a) => Math.floor(a.p0 / K.BLOCK) === i && a.north === (side === 'S'));
      // (round eight, B2) a row with an ANCHOR: the store before it ends at the anchor's wall (5 to 15 m wide); the
      // anchor itself is two storeys, 9 m wide, with no awning: the same on every seed
      while (p < pb - 3) {
        let w = r.range(7, 10); const isA = anc && Math.abs(p - anc.p0) < 1e-6;
        if (isA) w = anc.w; else if (anc && p < anc.p0 && anc.p0 - p < w + 5) w = anc.p0 - p;
        if (pb - (p + w) < 5 && !(anc && p < anc.p0)) w = pb - p;
        const st = dealStore(seed, i, j, side, k++, p, w); if (isA) { st.anchor = true; st.awn = false; st.canopy = false; if (st.three) { st.three = false; st.ridge -= 3.5; } }
        out.push(st); p += w;
      }
      if (out.length > first) { out[first].endW = true; out[out.length - 1].endE = true; }
      continue;
    }
    const n = side === 'W' || side === 'E' ? 4 : 2;
    for (let k = 0; k < n; k++) {
      const t = lotPlace(i, j, side, k);
      // (a landmark's lot and an open green's lot hold no house: asked before the lot's own stream, so that no draw is
      // spent on a house that is not made)
      if (lotTaken(t.fp, t.fq) || greenLot(i, j, side, k)) continue;
      const h = dealHouse(seed, i, j, side, k);
      // (round four) THE FIRST CROSSING'S CORNER HOUSES (cross: the four whose fronts stand within a front line and a
      // half of the crossing's middle: cornerOf): every eave, porch and window lit
      if (cornerOf(h.fp, h.fq, CROSS1)) { h.allLit = true; h.strung = true; h.cross = true; }
      // (round eight, C4) the house behind a house leaf: a low house with its glazed hall door in the middle of its front, every window lit
      if (isHall(h)) { h.allLit = true; h.strung = true; h.hall = true; h.kind = 'bung'; h.ridge = Math.min(h.ridge, 7.2); }
      out.push(h);
    }
  }
  // THE HOUSE RULE (the bright route cuts the church block's corner over its verge and lawn, and the dark route
  // climbs over the east side's roofs): a house is dealt first; if its whole body (porch, steps, carport, eaves,
  // chimney) comes within 3.2 m of either route it is built narrow (8 m, no carport), then low (a bungalow 6.6 m to
  // the ridge), and if it still comes within 3.2 m the lot stays a lawn. The same on both copies.
  for (let a = out.length - 1; a >= 0; a--) {
    const h = out[a]; if (h.kind === 'store' || routeNear(h.fp, h.fq) > 34) continue;   // (round five: wherever a route passes, not only about the first crossing)
    if (houseOK(h)) continue;
    h.w = 8; if (h.kind === 'ranch') { h.kind = 'bung'; h.ridge = Math.min(Math.max(h.ridge, 6.2), 7.2); }
    if (houseOK(h)) continue;
    h.kind = 'bung'; h.ridge = 6.6;
    if (!houseOK(h)) { out.splice(a, 1); (out.gone || (out.gone = [])).push(h); }   // (round five: such a lot is a GARDEN, see dealBack)
  }
  // no two neighbours alike: a house that repeats the kind of the one before it on its side takes the next kind
  for (let a = 1; a < out.length; a++) {
    const h = out[a], g = out[a - 1];
    if (h.kind !== 'store' && g.side === h.side && g.kind === h.kind) {
      // ROUND FOUR (the dark climb is lower): a house under the HOUSE RULE takes the next kind that still keeps the
      // rule's 3.2 m, and stays as it is if none does (seed 18: a low ranch under the climb had become a foursquare)
      const was = h.kind, wr = h.ridge, ruled = routeNear(h.fp, h.fq) <= 34;
      for (let t = 1; t <= 4; t++) {
        h.kind = HOUSE_KINDS[(HOUSE_KINDS.indexOf(was) + t) % 4]; h.ridge = h.kind === 'bung' ? Math.min(wr, 7.2) : wr;
        if (h.kind === was || !ruled || houseOK(h)) break;
        if (t === 4) { h.kind = was; h.ridge = wr; }
      }
    }
    if (h.kind !== 'store' && g.side === h.side && g.paint === h.paint) h.paint = (h.paint + 1 + Math.floor(h.extra * 3)) % 5;
  }
  return out;
}
// THE HOUSE RULE's test: the house's whole box keeps 3.2 m from both routes, and 7.5 m from the dark route's CLIMB
// AND TURN (where the line passes over and between the roofs: no house stands so near the line that it is passed
// as one blank wall), and AIR_KEEP from the climb and the high place
const houseOK = (h) => { const b = houseBox(h); return boxClear(b) >= 3.2 && climbClear(b) >= 7.5 && airClear(b) >= AIR_KEEP; };
// a house's whole body as one box for the clear-air law: walls, eaves, porch and steps, carport, chimney
export function houseBox(h) {
  const d = houseDims(h), store = h.kind === 'store', front = store ? (h.canopy ? 2.9 : 1.8) : d.porchD + 2.5, c = housePt(h, 0, (front - h.dp) / 2);
  return { p: c[0], q: c[1], dir: h.face, hl: (h.dp + front) / 2 + 0.5, hw: h.w / 2 + (d.carport || 0) + 0.7, y0: 0, y1: store ? h.ridge + 1.7 : d.ridge + 1.6 };   // (round eight: a store's parapet may stand 1.4 m over its cornice)
}
// plan position of a house-local point (u to the right seen from the street, w toward the street, front wall at w 0)
export const housePt = (h, u, w) => [h.fp - h.face[1] * u + h.face[0] * w, h.fq + h.face[0] * u + h.face[1] * w];

// THE BACK YARDS AND THE GARDEN LOTS (no bare lawn under the line). Dealt for every block from the
// lots' own streams, the same on both copies. (1) The four middle lots of a block (W and E sides, k 1 and 2) reach
// the block's middle: each has a hedge along its outer side, a hedge or a board fence along the rear line, a fence
// between the two, and by its dice a shed, raised beds, a picnic table, a woodpile, a small tree. (2) A lot the
// HOUSE RULE left empty (a route passes low over it) is a GARDEN: a picket fence along the walk, hedges round it, a
// shed at the end of a drive, raised beds, a woodpile, a table, a small tree. Every body is a box
// { kind, p, q, dir, hl, hw, y0, y1 } (dir: the plan vector its length lies along) and stands only if it keeps the
// clear air + 0.4 m from BOTH routes; none is over 2.8 m tall. The count reads these boxes.
const _backs = new Map(); let _backsSeed = null;
export function dealBack(seed, i, j) {
  if (_backsSeed !== seed) { _backs.clear(); _backsSeed = seed; }
  const key = i * 64 + j, had = _backs.get(key); if (had) return had;
  const out = { items: [], trees: [], drives: [] }; _backs.set(key, out);
  if (blockKind(i, j) === 'square' || !blockExists(i, j, seed)) return out;
  const houses = dealBlock(seed, i, j), ky = K.KERB;
  const put = (h, kind, u, w, alongW, hl, hw, y1, extra = null) => {
    const c = housePt(h, u, w), b = { kind, p: c[0], q: c[1], dir: alongW ? h.face : [-h.face[1], h.face[0]], hl, hw, y0: 0, y1, ...extra };
    // (none within the water tower's feet and 3 m, counted to the thing's nearest corner)
    if (Math.hypot(c[0] - K.TOWER[0], c[1] - K.TOWER[1]) - Math.hypot(hl, hw) < TOWER_KEEP) return;
    if (routeNear(c[0], c[1]) - 5.7 - Math.hypot(hl, hw) > 16 || (boxClear(b) >= K.CLEAR + 0.4 && (kind !== 'shed' || airClear(b) >= AIR_KEEP))) out.items.push(b);
  };
  for (const h of houses) {
    if (h.kind === 'store' || !(h.side === 'W' || h.side === 'E') || !(h.k === 1 || h.k === 2)) continue;
    // sg: the side (in the house's own axes) on which the block's other middle lot lies; the yard runs from the house's back to the block's middle line
    const r = lotRng(seed, 'back:' + h.id), sg = (h.side === 'W') === (h.k === 1) ? -1 : 1, uS = sg * 7.75, uO = -sg * 4.25, wB = -24, wH = -h.dp - 0.8, len = (wH - wB) / 2;
    const hedgeRear = r() < 0.5, picketMid = r() < 0.6, shed = r() < 0.6, beds = r() < 0.5, nb = 2 + Math.floor(r() * 2), table = r() < 0.35, pile = r() < 0.4, tree = r() < 0.4, th = r.range(4.6, 6.4), paint = Math.floor(r() * 5), roof = Math.floor(r() * 2);
    if (h.side === 'W') put(h, hedgeRear ? 'hedge' : 'board', (uS + uO) / 2, wB, false, 6, hedgeRear ? 0.4 : 0.05, hedgeRear ? 1.4 : 1.7);
    if (h.k === 1) put(h, picketMid ? 'picket' : 'board', uS, (wH + wB) / 2, true, len, 0.05, picketMid ? ky + 0.95 : 1.7);
    put(h, 'hedge', uO + sg * 0.4, (wH + wB) / 2, true, len - 0.5, 0.4, 1.3);
    if (shed) put(h, 'shed', uO + sg * 2.5, wB + 2.0, false, 1.5, 1.2, 2.75, { paint, roof });
    if (beds) for (let b = 0; b < nb; b++) put(h, 'bed', uS - sg * (1.5 + 1.5 * b), wB + 3.4, true, 1.6, 0.5, ky + 0.3);
    if (table) put(h, 'table', sg * 1.75, wH - 2.4, false, 0.9, 0.75, ky + 0.78);
    if (pile) put(h, 'pile', uO + sg * 1.15, wH - 2.6, true, 1.1, 0.28, ky + 1.0);
    if (tree) { const c = housePt(h, uS - sg * 2.4, wH - 3.2); out.trees.push({ id: 'b:' + h.id, kind: 'maple', p: c[0], q: c[1], H: th, tr: 0.14, street: false }); }
  }
  for (const h of houses.gone || []) {
    // (the first crossing's four corner lots and the corner lawn the bright turn rounds have their own dress)
    if (h.cross || cornerLawn(h.fp, h.fq)) continue;
    const r = lotRng(seed, 'garden:' + h.id), s = r() < 0.5 ? -1 : 1, nb = 3 + Math.floor(r() * 2), paint = Math.floor(r() * 5), roof = Math.floor(r() * 2), tree = r() < 0.7, th = r.range(4.4, 5.4), table = r() < 0.6;
    put(h, 'picket', s * 4.15, 6.75, false, 3.25, 0.05, ky + 0.95); put(h, 'picket', -s * 1.95, 6.75, false, 1.05, 0.05, ky + 0.95); put(h, 'picket', -s * 6.6, 6.75, false, 0.8, 0.05, ky + 0.95);
    for (const sd of [-1, 1]) put(h, 'hedge', sd * 7.3, -2.5, true, 8.5, 0.4, 1.3);
    put(h, 'hedge', 0, -11.4, false, 6.9, 0.4, 1.3);
    put(h, 'shed', -s * 4.4, -7.2, false, 1.6, 1.3, 2.75, { paint, roof });
    for (let b = 0; b < nb; b++) put(h, 'bed', s * (0.6 + 1.6 * b), -3.0, true, 2.0, 0.55, ky + 0.3);
    if (table) put(h, 'table', s * 3.2, -8.6, false, 0.9, 0.75, ky + 0.78);
    put(h, 'pile', -s * 6.55, -2.0, true, 1.2, 0.28, ky + 1.0);
    if (tree) { const c = housePt(h, s * 4.6, 3.6); out.trees.push({ id: 'b:' + h.id, kind: 'maple', p: c[0], q: c[1], H: th, tr: 0.13, street: false }); }
    out.drives.push({ h, s: -s, u: -s * 4.4 });
  }
  return out;
}
// lod 0: every body in full (the table into the block's small relief); 1 (a block of the far town within 200 m of the
// dark line): hedges, fences and sheds as plain shapes
export function buildBack(g, items, lod = 0) {
  const ky = K.KERB;
  for (const b of items) {
    const hw = b.hw, hl = b.hl;
    g.frame(b.p, b.q, 0, b.dir);
    if (b.kind === 'hedge') {
      // (round seven, E2: a clipped hedge with a rounded back, not a plain box)
      g.kind(KIND.LAWN, 1).color('#2c5230');
      if (lod) g.box(-hw, ky, -hl, hw, b.y1, hl, 'bfk');
      else {
        const ys = b.y1 - 0.34, tw = hw * 0.5, pr = [[-hw, ky], [-hw, ys], [-tw, b.y1], [tw, b.y1], [hw, ys], [hw, ky]];
        for (let k = 0; k < 5; k++) g.quad([pr[k][0], pr[k][1], hl], [pr[k][0], pr[k][1], -hl], [pr[k + 1][0], pr[k + 1][1], -hl], [pr[k + 1][0], pr[k + 1][1], hl]);
        for (const z of [hl, -hl]) { const A = (k) => [pr[k][0], pr[k][1], z]; if (z > 0) { g.quad(A(5), A(4), A(1), A(0)); g.quad(A(4), A(3), A(2), A(1)); } else { g.quad(A(0), A(1), A(4), A(5)); g.quad(A(1), A(2), A(3), A(4)); } }
      }
    }
    else if (b.kind === 'board') { g.kind(KIND.SMOOTH, 0.8).color('#5a4a3a'); g.box(-0.04, ky, -hl, 0.04, b.y1, hl, lod ? 'bfkt' : 'b'); }
    else if (b.kind === 'picket') { g.kind(KIND.FENCE).color(TRIM, Math.min(1, hl * 2 / 0.106 / 255)); g.quad([0, ky, -hl], [0, ky, hl], [0, b.y1, hl], [0, b.y1, -hl]); g.quad([0, ky, hl], [0, ky, -hl], [0, b.y1, -hl], [0, b.y1, hl]); }
    else if (b.kind === 'shed') {
      // a garden shed: clapboard walls, a low gable roof (its ridge along its length), a plank door and a small pane toward the house
      const ev = 2.0, rd = b.y1, o = 0.22, sl = (rd - ev) / hw, ey = ev - o * sl;
      g.kind(KIND.WALL).color(PAINTS[b.paint]); g.box(-hw, ky, -hl, hw, ev, hl, 'bt');
      g.tri([-hw, ev, hl], [hw, ev, hl], [0, rd, hl]); g.tri([hw, ev, -hl], [-hw, ev, -hl], [0, rd, -hl]);
      g.kind(KIND.ROOF).color(ROOFS[b.roof]);
      g.quad([-hw - o, ey, hl + o], [0, rd, hl + o], [0, rd, -hl - o], [-hw - o, ey, -hl - o]); g.quad([hw + o, ey, hl + o], [hw + o, ey, -hl - o], [0, rd, -hl - o], [0, rd, hl + o]);
      if (lod) continue;
      const x = -hw - 0.025;
      g.kind(KIND.SMOOTH).color(DOORS[b.paint % 4]); g.quad([x, ky, -hl + 0.35], [x, ky, -hl + 1.3], [x, ky + 1.8, -hl + 1.3], [x, ky + 1.8, -hl + 0.35]);
      g.kind(KIND.PANE, 0.4).color(GLASS, 0); g.quad([x, 1.05, hl - 1.1], [x, 1.05, hl - 0.4], [x, 1.6, hl - 0.4], [x, 1.6, hl - 1.1]);
    } else if (lod) continue;
    else if (b.kind === 'bed') {
      g.kind(KIND.SMOOTH, 0.8).color('#5a4630'); g.box(-hw, ky, -hl, hw, b.y1, hl, 'bt');
      g.kind(KIND.FIELD).color('#2a241c'); g.quad([-hw, b.y1 - 0.06, hl], [hw, b.y1 - 0.06, hl], [hw, b.y1 - 0.06, -hl], [-hw, b.y1 - 0.06, -hl]);
      // (round seven, E2: A FINISHED RAISED BED) four corner posts stand proud of its boards, and two rows of low plants
      // grow in it (seen dead: small humps under the snow)
      g.kind(KIND.SMOOTH, 0.8).color('#5a4630'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * hw - 0.05, ky, sz * hl - 0.05, sx * hw + 0.05, b.y1 + 0.12, sz * hl + 0.05, 'b');
      g.kind(KIND.LAWN, 0.9).color('#2f5a2c');
      for (let k = 0; k < 5; k++) for (const sx of [-0.5, 0.5]) { const z = -hl + (k + 0.5) * (2 * hl / 5), x = sx * hw * 0.9, y = b.y1 - 0.06, s = 0.24, t = 0.17; g.tri([x - s, y, z + s], [x + s, y, z + s], [x, y + t, z]); g.tri([x + s, y, z + s], [x + s, y, z - s], [x, y + t, z]); g.tri([x + s, y, z - s], [x - s, y, z - s], [x, y + t, z]); g.tri([x - s, y, z - s], [x - s, y, z + s], [x, y + t, z]); }   // (round eight: low humps, 0.17 m: seen dead they were rows of white teeth)
    } else if (b.kind === 'pile') { g.kind(KIND.BARK).color('#6a5238'); g.box(-hw, ky, -hl, hw, b.y1, hl, 'b'); }
    else if (b.kind === 'table') {
      // a picnic table: a top of planks, a bench either side, two trestles
      const d = g.detail(); d.kind(KIND.SMOOTH, 0.9).color('#6a5a44');
      d.box(-0.4, b.y1 - 0.05, -hl, 0.4, b.y1, hl, ''); for (const sx of [-1, 1]) d.box(sx * 0.62 - 0.13, ky + 0.42, -hl, sx * 0.62 + 0.13, ky + 0.46, hl, '');
      for (const z of [-hl + 0.25, hl - 0.25]) { d.box(-0.7, ky + 0.36, z - 0.04, 0.7, ky + 0.42, z + 0.04, ''); for (const sx of [-1, 1]) d.box(sx * 0.3 - 0.04, ky, z - 0.04, sx * 0.3 + 0.04, b.y1 - 0.05, z + 0.04, 'bt'); }
    }
  }
  g.frame(0, 0, 0, null);
}

// ---------------------------------------------------------------------------------------------- the plan: trees
const TREE_KINDS = ['maple', 'elm', 'oak'];
// THE CORNER LAWN'S TREE (round six): a tall tree inside the bright turn's arc, on the diagonal from the turn's centre
// toward the crossing, 19 m inside the line (twice its crown's radius and more): its crown stands between the
// turning line and the church's spire
export const CORNER_TREE = [-LINE.BR + (LINE.BR - 19) * Math.SQRT1_2, K.THIN1[1] - LINE.BR + (LINE.BR - 19) * Math.SQRT1_2];
// every tree a block is dealt: four to a street side in the verge TREE_OFF from the centre line (none within CROSS_CLEAR
// of a crossing's centre: the run between is cut into four equal parts and each tree stands in the middle half of
// its own; none on Main Street), yard trees behind the sidewalks, great trees on the courthouse lawn
export function dealTrees(seed, i, j, houses = null) {
  const out = [], B = K.BLOCK, p0 = i * B, q0 = j * B, square = blockKind(i, j) === 'square';
  const part = (B - 2 * K.CROSS_CLEAR) / 4;
  for (const side of ['W', 'E', 'S', 'N']) {
    if (isMainSide(i, j, side) || (square && side === 'S')) continue;
    for (let k = 0; k < 4; k++) {
      const r = lotRng(seed, 'tree:' + i + ':' + j + ':' + side + ':' + k), a = K.CROSS_CLEAR + part * (k + r.range(0.25, 0.75));
      const kind = TREE_KINDS[Math.floor(r() * 3)], H = r.range(13, 18), tr = r.range(0.25, 0.45), absent = r() < 0.08;
      const p = side === 'W' ? p0 + TREE_OFF : side === 'E' ? p0 + B - TREE_OFF : p0 + a, q = side === 'S' ? q0 + TREE_OFF : side === 'N' ? q0 + B - TREE_OFF : q0 + a;
      // (none under the water tower; none within TREE_OFF of a leaf's foot line; none whose crown reaches into an open green's ground behind its leaf)
      if (!absent && Math.hypot(p - K.TOWER[0], q - K.TOWER[1]) > 20 && leafKeepsTree(p, q) && greenKeepsTree(p, q, kind, H)) out.push({ id: 'v:' + i + ':' + j + ':' + side + ':' + k, kind, p, q, H, tr, street: true });
    }
  }
  if (square) {
    // THE COURTHOUSE LAWN'S SIX GREAT TREES: three along each of the square's two side streets, on the lawn's edge
    // (from the walk's outer edge to 6 m inside it), evenly from a store's depth north of Main Street's front line
    // to the front line of the square's north street
    const qa = MAIN.q + MAIN.front + MAIN.deep, qb = q0 + B - K.FRONT;
    for (let k = 0; k < 6; k++) {
      const r = lotRng(seed, 'great:' + k), kind = TREE_KINDS[1 + Math.floor(r() * 2)], west = k < 3, in0 = WALK_OUT + r.range(0, 6);
      const p = west ? p0 + in0 : p0 + B - in0, q = lerp(qa, qb, (k % 3) / 2) + r.range(-3, 3);
      out.push({ id: 'g:' + k, kind, p, q, H: r.range(16, 19), tr: r.range(0.38, 0.5), street: true });
    }
    return out;
  }
  // the corner lawn the bright route's turn rounds: one tall tree, wound with bulbs (round two), in the block it stands in
  if (inBlock(CORNER_TREE, i, j)) out.push({ id: 'corner', kind: 'oak', p: CORNER_TREE[0], q: CORNER_TREE[1], H: 18, tr: 0.45, street: true, lit: true });
  // A LIT CORNER YARD'S TREE (round four): a small tree wound with bulbs in each corner yard of the first crossing
  // and of every crossing a great leaf stands in (the open greens), 2 m inside the corner of the two walks
  for (const mid of [CROSS1, ...GREENS.map((G) => G.mid)]) for (const [sx, sq] of CROSS_CORNERS) { const c = [mid[0] + sx * (WALK_OUT + 2), mid[1] + sq * (WALK_OUT + 2)]; if (inBlock(c, i, j)) out.push({ id: 'cross:' + i + ':' + j, kind: 'maple', p: c[0], q: c[1], H: 6.4, tr: 0.16, street: false, lit: true }); }
  for (const h of houses || dealBlock(seed, i, j)) {
    if (h.kind === 'store' || h.allLit) continue;
    const r = lotRng(seed, 'yard:' + h.id);
    if (r() > 0.45) continue;   // (every yard tree is a maple)
    const u = (r() < 0.5 ? -1 : 1) * r.range(h.w / 2 - 0.5, h.w / 2 + 1.6), w = r.range(2.6, 4.6), at = housePt(h, u, w);
    out.push({ id: 'y:' + h.id, kind: 'maple', p: at[0], q: at[1], H: r.range(6, 9), tr: r.range(0.12, 0.2), street: false });
  }
  for (const t of dealBack(seed, i, j).trees) out.push(t);   // round five: a small tree in some back yards and gardens
  return out.filter((t) => t.street || (leafKeepsTree(t.p, t.q) && Math.hypot(t.p - K.TOWER[0], t.q - K.TOWER[1]) > 14));
}
const bez = (a, c, b, t) => { const s = 1 - t; return [s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1], s * s * a[2] + 2 * s * t * c[2] + t * t * b[2]]; };
// A tree's whole body from its own stream: segs [a, b, ra, rb, level] in plan coordinates (level 0 trunk, 1 bough,
// 2 branch) and clumps [p, q, y, r] (the balls of twigs and leaves at the branch ends). The count reads these.
export function treeSkeleton(seed, t) {
  const r = lotRng(seed, 'skel:' + t.id), segs = [], clumps = [], { p, q, H, tr, kind } = t;
  const small = !t.street, great = !!t.great, fork = great ? 7 : small ? r.range(2.2, 3) : kind === 'elm' ? r.range(5.4, 6.8) : kind === 'oak' ? r.range(4.6, 5.4) : r.range(4.8, 6);
  const top = [p + r.range(-0.03, 0.03) * fork, q + r.range(-0.03, 0.03) * fork, fork];
  segs.push([[p, q, 0], top, tr, tr * 0.8, 0]);
  const cr = t.cr || crownReach(kind, H), vr = (H - fork) * 0.5, cy = fork + vr;
  const n1 = great ? 10 : small ? 4 : kind === 'oak' ? 6 : 5, az0 = r() * 6.283;
  for (let b = 0; b < n1; b++) {
    const leader = b === n1 - 1, az = az0 + (b / (n1 - 1)) * 6.283 + r.range(-0.3, 0.3);
    const phi = leader ? r.range(0, 0.25) : kind === 'elm' ? r.range(0.5, 1.0) : kind === 'oak' ? r.range(1.0, 1.5) : r.range(0.7, 1.3);
    const sh = r.range(0.62, 0.8), end = [top[0] + Math.cos(az) * Math.sin(phi) * cr * sh, top[1] + Math.sin(az) * Math.sin(phi) * cr * sh, cy + Math.cos(phi) * vr * sh];
    if (end[2] < fork + 0.8) end[2] = fork + 0.8 + r() * 0.8;
    const k = kind === 'elm' ? 0.22 : kind === 'oak' ? 0.6 : 0.42, kink = kind === 'oak' ? 1.2 : 0.4;
    const ctrl = [lerp(top[0], end[0], k) + r.range(-kink, kink), lerp(top[1], end[1], k) + r.range(-kink, kink), lerp(top[2], end[2], kind === 'elm' ? 0.8 : 0.6)];
    const r0 = tr * (leader ? 0.62 : 0.48), pts = [top, bez(top, ctrl, end, 0.34), bez(top, ctrl, end, 0.68), end];
    for (let s = 0; s < 3; s++) segs.push([pts[s], pts[s + 1], lerp(r0, tr * 0.14, s / 3), lerp(r0, tr * 0.14, (s + 1) / 3), 1]);
    clumps.push([end[0], end[1], end[2], cr * r.range(0.3, 0.4)]);
    const n2 = great ? 3 + (r() < 0.5 ? 1 : 0) : small ? 1 : 2 + (r() < 0.5 ? 1 : 0);
    for (let c = 0; c < n2; c++) {
      const tt = r.range(0.4, 0.9), from = bez(top, ctrl, end, tt), az2 = az + r.range(-1.3, 1.3), len = cr * r.range(0.3, 0.5), up = r.range(0.1, 0.9);
      const e2 = [from[0] + Math.cos(az2) * len, from[1] + Math.sin(az2) * len, from[2] + up * len * 0.7 + 0.4];
      segs.push([from, e2, tr * 0.16, tr * 0.07, 2]);
      clumps.push([e2[0], e2[1], e2[2], cr * r.range(0.24, 0.34)]);
    }
  }
  return { segs, clumps, cone: null };
}
// THE FAR TOWN'S TREE (round four, room: a block 60 m and more from both routes): a trunk and three boughs (two on a
// yard tree) from its own stream, in the full skeleton's form; within the same crown. Nothing of the count reads it
// (the count's trees are those of the near blocks).
export function treeSkeletonFar(seed, t) {
  const { p, q, H, tr, kind } = t;
  const r = lotRng(seed, 'far:' + t.id), small = !t.street, fork = small ? 2.6 : kind === 'elm' ? 6.1 : kind === 'oak' ? 5 : 5.4, top = [p, q, fork], segs = [[[p, q, 0], top, tr, tr * 0.8, 0]];
  const cr = H * (kind === 'oak' ? 0.46 : kind === 'elm' ? 0.4 : 0.36), n = small ? 2 : 3, a0 = r() * 6.283;
  for (let b = 0; b < n; b++) {
    const az = a0 + b / n * 6.283 + r.range(-0.4, 0.4), out = cr * r.range(0.45, 0.62), end = [p + Math.cos(az) * out, q + Math.sin(az) * out, fork + (H - fork) * r.range(0.45, 0.8)];
    segs.push([top, end, tr * 0.4, tr * 0.2, 1], [end, end, 0, 0, 1], [end, end, 0, 0, 1]);
  }
  return { segs, clumps: [], cone: null };
}
// the strings a street tree carries along the home street and the cross street: a spiral up the trunk to the first
// boughs, and (the greatest trees) along two or three boughs. Plan polylines of [p, q, y] with a mix each.
// (onHome: a verge tree of the home street between the entry's crossing and the thin place's street; onCross: a
// verge tree of that cross street between the plane and the home street)
export function treeStrings(seed, t, sk) {
  const out = [], onHome = Math.abs(t.p) < TREE_OFF + 1 && t.q > 0 && t.q < K.THIN1[1], onCross = Math.abs(t.q - K.THIN1[1]) < TREE_OFF + 1 && t.p > K.THIN1[0] && t.p < 0;
  if (t.lit) {
    // the lit tree: a spiral up its trunk and a string out along every bough to its end
    const top = sk.segs[0][1], h = top[2], n = Math.round(h / 0.5 * 10), sp = [];
    for (let k = 0; k <= n; k++) { const f = k / n, a = f * (h / 0.5) * 6.2832, rad = t.tr + 0.06; sp.push([lerp(t.p, top[0], f) + Math.cos(a) * rad, lerp(t.q, top[1], f) + Math.sin(a) * rad, 0.4 + (h - 0.4) * f]); }
    out.push({ pts: sp, mix: 3 });
    for (let k = 1; k + 2 < sk.segs.length; k++) if (sk.segs[k][4] === 1 && sk.segs[k][0] === top) out.push({ pts: [0, 1, 2].map((j) => sk.segs[k + j][0]).concat([sk.segs[k + 2][1]]).map((x) => [x[0], x[1], x[2] + 0.1]), mix: 0 });
    return out;
  }
  if (!t.street || !(onHome || onCross)) return out;
  const r = lotRng(seed, 'spiral:' + t.id), mix = Math.floor(r() * 4), a0 = r() * 6.283, boughs = t.H >= 15.5 ? 2 + (r() < 0.5 ? 1 : 0) : 0, mix2 = Math.floor(r() * 4), first = Math.floor(r() * 5);
  const top = sk.segs[0][1], h = top[2] - 0.2, n = Math.max(8, Math.round(h / 1.15 * 12)), sp = [];
  for (let k = 0; k <= n; k++) { const f = k / n, y = 0.5 + (h - 0.5) * f, a = a0 + f * (h / 1.15) * 6.2832, rad = t.tr * lerp(1, 0.82, f) + 0.07; sp.push([lerp(t.p, top[0], f) + Math.cos(a) * rad, lerp(t.q, top[1], f) + Math.sin(a) * rad, y]); }
  out.push({ pts: sp, mix });
  const lv1 = []; for (let k = 1; k + 2 < sk.segs.length; k++) if (sk.segs[k][4] === 1 && sk.segs[k][0] === top) lv1.push(k);
  for (let b = 0; b < boughs && lv1.length; b++) { const k = lv1[(first + b * 2) % lv1.length]; out.push({ pts: [0, 1, 2].map((j) => sk.segs[k + j][0]).concat([sk.segs[k + 2][1]]).map((x) => [x[0], x[1], x[2] + 0.12]), mix: mix2 }); }
  return out;
}
// THE TREE RULE: dealt its dice first, then it stands only if its whole body keeps 4 m from BOTH routes' lines as they
// lie in the plan, and (behind the entry) keeps out of the cone 2.6 m + 15 m x d / 340 round the entry axis, and
// keeps AIR_KEEP from the dark line where the line is clear of the street (the air span: see airNear)
export function treeStands(t, sk) {
  const R = routes(), reach = t.H * 0.6 + K.TREE_CLEAR + 1;
  if (airNear(t.p, t.q, t.H) < AIR_KEEP + t.H * 0.6 + 1) {
    const T = R.dark, [A0, A1] = airSpan();
    const near = (c, rad) => { for (let i = A0; i <= A1; i++) { const a = T[i]; if (Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]) - rad < AIR_KEEP) return true; } return false; };
    for (const c of sk.clumps) if (near(c, c[3])) return false;
    for (const s of sk.segs) if (near(s[0], s[2]) || near(s[1], s[3])) return false;
  }
  const near2 = (track) => { let b = 1e9; for (let i = 0; i < track.length; i += 2) { const d = Math.hypot(track[i][0] - t.p, track[i][1] - t.q); if (d < b) b = d; } return b; };
  const axis = (pt, rad) => pt[1] < 0 && pt[1] > -345 && Math.hypot(pt[0], pt[2] - K.EYE) - rad < K.CLEAR + 15 * (-pt[1]) / 340;
  for (const c of sk.clumps) if (axis(c, 0.95 * c[3] + 1.35)) return false;   // the leaf spray, not only the twigs
  for (const s of sk.segs) if (axis(s[1], s[2]) || axis(s[0], s[2])) return false;
  if (routeNear(t.p, t.q) - 5.7 > reach || (near2(R.bright) > reach && near2(R.dark) > reach)) return true;
  for (const s of sk.segs) if (!farSeg(s[0], s[1], K.TREE_CLEAR + Math.max(s[2], s[3])) && routeDist(s[0], s[1], true) - Math.max(s[2], s[3]) < K.TREE_CLEAR) return false;
  for (const c of sk.clumps) if (!farSeg(c, c, K.TREE_CLEAR + c[3]) && routeDist(c, c, true) - c[3] < K.TREE_CLEAR) return false;
  return true;
}

// ---------------------------------------------------------------------------------------------- the plan: house shapes and strings
// The measures every level of detail, the strings and the count share. House-local axes: u to the right seen from the
// street, w toward the street (front wall at w 0, back wall at w -dp), y up.
export function houseDims(h) {
  const hw = h.w / 2, d = { hw, dp: h.dp, ridge: h.ridge, floor: 0.55, porchD: 2.4, porchY: 2.85, over: 0.4, wing: 0, setback: 0, side: h.extra < 0.5 ? -1 : 1 };
  if (h.kind === 'gable') { d.ridge = Math.max(h.ridge, 8.3); d.eave = d.ridge - hw * 0.62; d.roof = 'front'; }
  else if (h.kind === 'four') { d.ridge = Math.max(h.ridge, 8); d.eave = d.ridge - 2.3; d.roof = 'hip'; d.porchD = 2.7; }
  else if (h.kind === 'bung') { d.ridge = Math.min(h.ridge, 7.2); d.eave = BUNG_EAVE; d.roof = 'side'; d.porchD = 2.6; d.porchY = 2.7; }
  else if (h.kind === 'ell') { d.ridge = Math.max(h.ridge, 7.6); d.wing = h.w * 0.5; d.setback = 3; d.eave = d.ridge - d.wing * 0.5 * 0.7; d.roof = 'ell'; d.porchD = 2.6; }
  else if (h.kind === 'ranch') { d.eave = 2.9; d.roof = 'side'; d.porchD = 0; d.floor = 0.3; d.carport = 3.6; }
  else { d.eave = h.ridge; d.roof = 'flat'; d.porchD = 0; d.floor = 0.15; }
  return d;
}
// the strings a house carries, as house-local polylines of [u, y, w]. far: only the eave line every level shows.
export function houseStrings(h, far = false) {
  const d = houseDims(h), o = d.over, hw = d.hw, out = [], e = d.eave + 0.02;
  // a store: one string along its cornice and (near) one along its shopfront, over the display windows
  if (h.kind === 'store') { out.push([[-hw + 0.2, d.eave + 0.25, 0.3], [hw - 0.2, d.eave + 0.25, 0.3]]); if (!far && !h.canopy) out.push([[-hw + 0.3, 3.78, 0.22], [hw - 0.3, 3.78, 0.22]]);
    // the one blank marquee: a border of bulbs round its front panel (they chase by the wave's own law)
    if (!far && h.canopy) out.push([[-hw + 0.35, 3.78, 2.87], [hw - 0.35, 3.78, 2.87], [hw - 0.35, 4.82, 2.87], [-hw + 0.35, 4.82, 2.87], [-hw + 0.35, 3.78, 2.87]]);
    for (const [end, sg] of [[h.endW, h.face[1] > 0 ? 1 : -1], [h.endE, h.face[1] > 0 ? -1 : 1]]) if (end && !far) out.push([[sg * (hw + 0.3), d.eave + 0.25, 0.3], [sg * (hw + 0.3), d.eave + 0.25, -h.dp + 0.3]]);   // and along a row's end wall
    return out; }
  if (d.roof === 'front') {
    out.push([[-hw - o, e, o + 0.05], [0, d.ridge + 0.03, o + 0.05], [hw + o, e, o + 0.05]]);
    if (!far) { out.push([[-hw - o, e, o], [-hw - o, e, -d.dp - o]]); out.push([[hw + o, e, o], [hw + o, e, -d.dp - o]]); }
  } else if (d.roof === 'hip') {
    out.push([[-hw - o, e, -d.dp - o], [-hw - o, e, o], [hw + o, e, o], [hw + o, e, -d.dp - o]]);
  } else if (d.roof === 'side') {
    const fw = d.porchD + o, fy = h.kind === 'bung' ? d.porchY : e, rw = -d.dp * 0.45;
    out.push([[-hw - o, fy, fw], [hw + o, fy, fw]]);
    if (!far) for (const s of [-1, 1]) out.push([[s * (hw + o), fy, fw], [s * (hw + o), d.ridge + 0.03, rw], [s * (hw + o), e, -d.dp - o]]);
  } else if (d.roof === 'ell') {
    const s = d.side, a = s * hw, b = a - s * d.wing, mid = (a + b) / 2;
    out.push([[a + s * o, e, o + 0.05], [mid, d.ridge + 0.03, o + 0.05], [b - s * o, e, o + 0.05]]);
    out.push([[b, e - 0.3, -d.setback + o], [-a - s * o, e - 0.3, -d.setback + o]]);
  }
  if (!far && d.porchD > 0 && h.kind !== 'bung') {
    const u0 = d.roof === 'ell' ? (d.side > 0 ? -hw : hw - h.w + d.wing) : -hw, u1 = d.roof === 'ell' ? (d.side > 0 ? hw - d.wing : hw) : hw, w0 = d.roof === 'ell' ? -d.setback : 0;
    out.push([[u0, d.porchY - 0.25, w0 + d.porchD + 0.25], [u1, d.porchY - 0.25, w0 + d.porchD + 0.25]]);
  }
  return out;
}
// bulbs along a plan polyline of [p, q, y] every `sp` metres: [p, q, y, colourIndex, d, chaseIndex]
export function bulbsAlong(pts, sp, mix, start = 0, out = []) {
  let carry = sp * 0.5, n = start;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    for (; carry <= len; carry += sp) { const t = carry / len, p = lerp(a[0], b[0], t), q = lerp(a[1], b[1], t); out.push([p, q, lerp(a[2], b[2], t), MIXES[mix][n % MIXES[mix].length], Math.abs(p) + Math.abs(q), n]); n++; }
    carry -= len;
  }
  return out;
}
const hang = (a, b, low, n = 14) => {
  const pts = [], sag = Math.max(0.3, Math.min(a[2], b[2]) - low);
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t) - 4 * sag * t * (1 - t)]); }
  return pts;
};
// THE STRINGS OVER THE STREETS: a zig-zag from walk to walk up the home street, from the first walk north of the
// entry's crossing to the near walk of the thin place's street; the same across that cross street from the turn to
// the thin place; strings across Main Street at 11.5 m. Each is dealt first, then hangs only if every point of it
// keeps 3 m from BOTH routes' lines as they lie in the plan (so the roof has the same gap on both sides where the
// dark route climbs out of the street). posts: the slim poles that carry them. EVERY RUN HAS A STREAM OF ITS OWN
// (the seed and the run's name; Main Street's and the square's strings one each by their number): moving a place
// that one run is counted from deals no other run anew.
const MAIN_POSTS = [-10, 20];   // Main Street's lamp standards: the first one's p, and their pitch
const MAIN_PITCH = 14;          // Main Street's strings: one every so many metres
const POST_OFF = WALK_OUT + 0.2;   // a string's post stands just behind the walk: this far from its street's centre line
export function dealStrings(seed) {
  const strings = [], posts = [], ok = (pts) => { for (let i = 0; i + 1 < pts.length; i++) if (!farSeg(pts[i], pts[i + 1], 3) && routeDist(pts[i], pts[i + 1], true) < 3) return false; return true; };
  // a string that keeps its 3 m from the bright line but not from the dark one (the dark line climbs out of the home
  // street through the strings' height beyond the climb's foot) may hang ON THE BRIGHT SIDE ONLY (brightOnly: the
  // dark copy draws neither it, its posts nor its ghosts)
  const okB = (pts) => { const T = routes().bright; for (let i = 0; i + 1 < pts.length; i++) for (let s = 0; s < 3; s++) { const t = s / 3; if (trackDist(T, lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t), lerp(pts[i][2], pts[i + 1][2], t)) < 3) return false; } return true; };
  const add = (id, a, b, low, mix, sp, postH, mayB = false) => {
    const pts = hang(a, b, low);
    let brightOnly = false;
    if (!ok(pts)) { if (!mayB || !okB(pts)) return; brightOnly = true; }
    if (postH && !brightOnly && (airNear(a[0], a[1], a[2] + 0.25) < AIR_KEEP || airNear(b[0], b[1], b[2] + 0.25) < AIR_KEEP)) { if (!mayB) return; brightOnly = true; }   // (round eight, D3)
    if (postH && (!standClear(a[0], a[1], a[2] + 0.25, 0.09, brightOnly) || !standClear(b[0], b[1], b[2] + 0.25, 0.09, brightOnly))) {
      if (brightOnly || !mayB || !standClear(a[0], a[1], a[2] + 0.25, 0.09, true) || !standClear(b[0], b[1], b[2] + 0.25, 0.09, true)) return;
      brightOnly = true;
    }
    strings.push({ id, pts, mix, sp, brightOnly });
    for (const e of [a, b]) if (postH) { const o = posts.find((x) => Math.hypot(x.p - e[0], x.q - e[1]) < 0.5); if (o) { if (!brightOnly) o.brightOnly = false; } else posts.push({ p: e[0], q: e[1], h: e[2] + 0.25, r: 0.09, brightOnly }); }
  };
  // THE HOME STREET, by places of the plan alone: the zig-zag begins at the outer edge of the first walk north of the
  // entry's crossing, on the side its stream deals, and runs from post to post to the near walk of the cross street
  // the first thin place stands in. None hangs over the first crossing, between the outer edges of its two walks,
  // where the tent of lights hangs (the dark line's climb begins at the far one: to there the strings hang on both
  // sides; past it, where the dark line climbs through their height, on the bright side only)
  { const r = lotRng(seed, 'strings:home'); let q = WALK_OUT, side = r() < 0.5 ? -1 : 1, k = 0;
    while (q < K.THIN1[1] - WALK_OUT) {
      const q2 = q + r.range(5, 7), low = r.range(5.25, 5.9), mix = Math.floor(r() * 4), ha = r.range(7.15, 7.7);
      if (!(q2 > CROSS1[1] - WALK_OUT && q < CROSS1[1] + WALK_OUT)) add('home:' + k, [side * POST_OFF, q, ha], [-side * POST_OFF, q2, ha], low + 0.08, mix, 0.45, true, true);
      q = q2; side = -side; k++;
    } }
  // the cross street from the turn to the thin place: the same zig-zag (round four: a crossing every 5 to 7 m; no post
  // where a lamp's mast or a pole stands)
  // (from 7 m before the place where the bright turn comes out on the cross street's axis to 4 m before the walk's
  // edge on the near side of the thin place's own street; lamps and poles stand every half block from a quarter block on)
  { const r = lotRng(seed, 'strings:cross'), QX = K.THIN1[1], mast = (p) => Math.abs(((p - K.BLOCK / 4) % (K.BLOCK / 2) + 1.5 * K.BLOCK / 2) % (K.BLOCK / 2) - K.BLOCK / 4);   // metres from p to the nearest mast along a street
    let pc = -LINE.BR + 7 - r.range(0, 1.5), sd = r() < 0.5 ? -1 : 1, c = 0;
    while (pc > K.THIN1[0] + WALK_OUT + 4) {
      let p2 = pc - r.range(5.2, 6.6); if (mast(p2) < 1.7) p2 -= 2.2;
      add('cross:' + c, [pc, QX + sd * POST_OFF, 7.55], [p2, QX - sd * POST_OFF, 7.55], r.range(5.25, 5.9) + 0.08, Math.floor(r() * 4), 0.45, true);
      pc = p2; sd = -sd; c++;
    } }
  // THE TENT OF LIGHTS over the first crossing (round four): four strings from the signal's corner posts (5.45 m up)
  // to its span wires' middle (9.45 m), lowest bulb 5.4 m over the road
  for (const [sx, sq] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) add('tent:' + sx + sq, [SIGNAL.p + sx * SIGNAL.post, SIGNAL.q + sq * SIGNAL.post, 5.45], [SIGNAL.p + sx * 0.3, SIGNAL.q + sq * 0.3, SIGNAL.y0 + 0.86], 5.4, 0, 0.42, false, true);   // (round seven, E3: the four strings meet at the hanging lantern's cap)
  // MAIN STREET (round five): strings cross it every MAIN_PITCH metres from half a block west of the home street to
  // 10 m before the last leaf, straight from cornice to cornice on slim poles just behind the cornices, 12.5 m up at
  // their ends and 11.5 m (and a little more) at their lowest (the line passes under them 3.2 to about 7 m up)
  let pSq = -K.BLOCK / 2;
  for (let p = -K.BLOCK / 2, c = 0; p >= K.RING[0] + 10; p -= MAIN_PITCH, c++) { pSq = p - MAIN_PITCH; const r = lotRng(seed, 'string:main:' + c); add('main:' + c, [p, MAIN.q - MAIN.front - 0.3, 12.5], [p, MAIN.q + MAIN.front + 0.3, 12.5], 11.5 + r.range(0, 0.3), Math.floor(r() * 4), 0.5, true); }
  // MAIN STREET'S LAMP POSTS (round three): both sides, every 20 m from 10 m west of the home street's axis to 20 m
  // before the last leaf (MAIN_POSTS), on the walks 8.7 m from the centre line: a slim
  // post 5.2 m tall with a lantern (rr: the lantern head's reach, for the count)
  // (round eight, E1: no standard close beside the low line: one stands only if it keeps 8 m in the plan from every metre of
  // Main Street's line that is under 7 m up: where the line swings 3 m to a side, that side's standards do not stand)
  const lowFar = (p, q) => { const T = routes().dark; for (let i = T.marks.turnEnd; i < T.length; i++) if (T[i][2] < 7 && Math.hypot(T[i][0] - p, T[i][1] - q) < 8) return false; return true; };
  for (let p = MAIN_POSTS[0]; p >= K.RING[0] + MAIN_POSTS[1]; p -= MAIN_POSTS[1]) for (const sd of [-1, 1]) { const o = { p, q: MAIN.q + sd * 8.7, h: 5.2, r: 0.1, rr: 0.6, lantern: true, sd }; if (standClear(o.p, o.q, o.h + 0.5, o.rr) && lowFar(o.p, o.q)) posts.push(o); }
  for (const o of PLAZA_LAMPS) posts.push({ ...o });   // round five: the plaza's eight lanterns (beyond the routes' end)
  // THE SQUARE'S STRINGS (the cure of round eight, A2): MAIN STREET'S FESTOON GOES ON BEHIND THE LAST LEAF, across the
  // square: the same even series on the same slim poles at the same height, as far as the plaza's west edge; none
  // hangs abreast of the oak's trunk (within half a pitch of it), where its great boughs come down on the square's
  // north side. Seen alive (through the last leaf) they are the street's own strings of white and coloured bulbs
  // across the opening, to either side of the ring; seen dead they are rimed strings with their ghost bulbs.
  for (let p = pSq, c = 0; p >= K.PLAZA[0] - K.PLAZA[2]; p -= MAIN_PITCH, c++) {
    if (Math.abs(p - OAK.p) < MAIN_PITCH / 2) continue;
    const r = lotRng(seed, 'string:square:' + c); add('square:' + c, [p, MAIN.q - MAIN.front - 0.3, 12.5], [p, MAIN.q + MAIN.front + 0.3, 12.5], 11.5 + r.range(0, 0.3), Math.floor(r() * 4), 0.5, true);
  }
  return { strings, posts };
}

// ---------------------------------------------------------------------------------------------- the plan: street lamps
// Cobra-head lamps, one to 40 m of street, alternating sides, the mast in the verge 5.6 m from the centre line and the
// head 2.6 m from it, 8.2 m up. Dealt by the grid, then each stands only if mast, arm and head keep 3 m from BOTH routes.
// no cobra lamp and no pole stands along two stretches of cross street: Main Street's own blocks (it has its own lamp
// standards on the walks, round three; MAIN.w to the home street), and the street the plane itself lies in on the
// dark copy (plan q 0), west of the first thin place's street
const MAST_OFF = 16;
const noCobra = (p, q) => (q === MAIN.q && p < 0 && p > MAIN.w) || (q === 0 && p < K.THIN1[0]);
export function dealLamps(seed) {
  const out = [], ok = (a, b, r) => farSeg(a, b, 3 + r) || routeDist(a, b, true) - r >= 3;
  const tryLamp = (p, q, hp, hq) => {
    // no mast stands within MAST_OFF of the foot of a leaf that stands in the open (a door-sized leaf has its wall):
    // its arm and head would hang before the leaf
    for (const [lp, lq, , , , door] of LEAF_LINES) if (!door && Math.hypot(p - lp, q - lq) < MAST_OFF) return;
    if (!(routeNear(p, q) > 20 || standClear(p, q, 8.4, 0.12)) || !ok([p, q, 8.4], [hp, hq, 8.3], 0.06) || !ok([hp, hq, 8.2], [hp, hq, 8.2], 0.45) || airNear(p, q, 8.4) < AIR_KEEP) return;
    out.push({ p, q, hp, hq, y: LAMP.y });
  };
  // along every street line that bounds a block of the near town (span), every half block from a quarter block on,
  // where a block stands on each side of the street
  const S = span(), B = K.BLOCK;
  for (let k = S.i0; k <= S.i1 + 1; k++) for (let n = S.j0 * 2; n < (S.j1 + 1) * 2; n++) {
    const q = B / 4 + B / 2 * n, s = ((n + k) & 1) ? 1 : -1, p = B * k;
    if (!streetAt(seed, true, k, q)) continue;
    if (p === K.THIN1[0] && s < 0) continue;   // (on the plane's own street none on the side beyond the plane: the bright copy ends there)
    // (ROUND EIGHT, E1: the mast behind the walk, the head just inside the kerb: LAMP)
    tryLamp(p + s * LAMP.mast, q, p + s * LAMP.head, q);
  }
  for (let j = S.j0; j <= S.j1 + 1; j++) for (let n = S.i0 * 2; n < (S.i1 + 1) * 2; n++) {
    const p = B / 4 + B / 2 * n, s = ((n + j) & 1) ? 1 : -1, q = B * j;
    if (!streetAt(seed, false, j, p) || noCobra(p, q)) continue;
    tryLamp(p, q + s * LAMP.mast, p, q + s * LAMP.head);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------- the plan: poles and wires
// Wooden utility poles every 40 m on the east side of the north-south streets and the north side of the east-west
// streets (5.6 m from the centre line, where that side's lamps hang on them), three sagging wires from crossarm to
// crossarm, a drum transformer on some. Dealt by the grid; a pole or a span stands only if it keeps 3 m from BOTH
// routes (so there is none on Main Street's store fronts and none within 60 m of the ring).
export function dealPoles(seed) {
  const poles = [], wires = [], ok = (a, b, r) => farSeg(a, b, 6.3 + r) || routeDist(a, b, true) - r >= 6.3;   // (no wire within 6 m of the line)
  const run = (at, n0, n1, along) => {
    let prev = null;
    for (let n = n0; n <= n1; n++) {
      const [p, q, skip] = at(n), r = lotRng(seed, 'pole:' + p + ':' + q), h = r.range(9.3, 10), trans = r() < 0.3, lows = [r.range(0.5, 0.8), r.range(0.5, 0.8), r.range(0.5, 0.8)];
      const stands = !skip && Math.hypot(p - K.RING[0], q - K.RING[1]) > 60 && (routeNear(p, q) > 20 || standClear(p, q, h, 0.17)) && airNear(p, q, h) >= AIR_KEEP;
      const pole = stands ? { p, q, h, trans, along } : null;
      if (pole) poles.push(pole);
      if (pole && prev) for (let w = 0; w < 3; w++) {
        const o = (w - 1) * 0.85, ya = prev.h - 0.55, yb = pole.h - 0.55, A = along ? [prev.p, prev.q + 0, ya] : [prev.p, prev.q, ya], B = [pole.p, pole.q, yb];
        const a = along ? [A[0], A[1] + o, A[2]] : [A[0] + o, A[1], A[2]], b = along ? [B[0], B[1] + o, B[2]] : [B[0] + o, B[1], B[2]];
        const pts = hang(a, b, Math.min(ya, yb) - lows[w], 4);
        let clear = true; if (routeNear((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) < 44) for (let i = 0; i + 1 < pts.length; i++) if (!ok(pts[i], pts[i + 1], 0.04)) clear = false;
        if (clear) wires.push(pts);
      }
      prev = pole;
    }
  };
  // (the same street lines and places as the lamps: dealLamps)
  const S = span(), B = K.BLOCK;
  for (let k = S.i0; k <= S.i1 + 1; k++) run((n) => { const q = B / 4 + B / 2 * n; return [B * k + 9.2, q, !streetAt(seed, true, k, q)]; }, S.j0 * 2, (S.j1 + 1) * 2 - 1, false);
  for (let j = S.j0; j <= S.j1 + 1; j++) run((n) => { const p = B / 4 + B / 2 * n; return [p, B * j + 9.2, !streetAt(seed, false, j, p) || noCobra(p, B * j)]; }, S.i0 * 2, (S.i1 + 1) * 2 - 1, true);
  return { poles, wires };
}

// ---------------------------------------------------------------------------------------------- the plan: cars, drives, mailboxes, hydrants
// Each is dealt first from its own stream and then stands only if its body keeps the clear air from BOTH routes.
// A box is { p, q, dir: [dp, dq], hl, hw, y0, y1 } (centre, heading, half length, half width, bottom, top).
export const boxDist = (b, x) => {
  const dx = x[0] - b.p, dq = x[1] - b.q, a = dx * b.dir[0] + dq * b.dir[1], c = dx * b.dir[1] - dq * b.dir[0];
  return Math.hypot(Math.max(Math.abs(a) - b.hl, 0), Math.max(Math.abs(c) - b.hw, 0), Math.max(b.y0 - x[2], 0, x[2] - b.y1));
};
// least distance from a box to the dark route's climb and turn (from where the line has risen clear of the street to
// the turn's end over Main Street: the line's own marks)
export function climbClear(b) {
  const T = routes().dark; let best = 1e9;
  if (routeNear(b.p, b.q) > 36) return best;
  for (let i = T.marks.clear; i < T.marks.turnEnd; i++) { if (Math.abs(T[i][0] - b.p) + Math.abs(T[i][1] - b.q) > 34) continue; const d = boxDist(b, T[i]); if (d < best) best = d; }
  return best;
}
export function airClear(b) {
  const T = routes().dark, [AIR0, AIR1] = airSpan(); let best = 1e9;
  if (routeNear(b.p, b.q) > 44) return best;
  for (let i = AIR0; i <= AIR1; i++) { if (Math.abs(T[i][0] - b.p) + Math.abs(T[i][1] - b.q) > 44) continue; const d = boxDist(b, T[i]); if (d < best) best = d; }
  return best;
}
export function boxClear(b) {
  const R = routes(); let best = 1e9;
  if (routeNear(b.p, b.q) > 36) return best;   // the coarse map first: no track point within 30 m of it (the same answer, sooner)
  for (const T of [R.bright, R.dark]) for (let i = 0; i < T.length; i++) {
    if (Math.abs(T[i][0] - b.p) + Math.abs(T[i][1] - b.q) > 30) continue;
    for (let s = 0; s < 2; s++) { const n = T[Math.min(i + 1, T.length - 1)], d = boxDist(b, [lerp(T[i][0], n[0], s * 0.5), lerp(T[i][1], n[1], s * 0.5), lerp(T[i][2], n[2], s * 0.5)]); if (d < best) best = d; }
  }
  return best;
}
// behind the entry: nothing solid within 2.6 m + 15 m x d / 340 of the entry axis (d the metres behind it)
export function coneClear(b) {
  if (b.q - b.hl - 1 > 0) return true;
  for (let q = Math.min(0, b.q + b.hl + 1); q >= b.q - b.hl - 1; q -= 0.5) if (boxDist(b, [0, q, K.EYE]) < K.CLEAR + 15 * (-q) / 340) return false;
  return true;
}
const CAR_KINDS = ['sedan', 'wagon', 'pickup', 'van'], CAR_SIZE = { sedan: [2.3, 0.88, 1.42], wagon: [2.5, 0.9, 1.46], pickup: [2.65, 0.95, 1.78], van: [2.4, 0.95, 2.02] };
// dark bodies (round two): they show by their lit edges and by the lights' colours lying on their roofs
export const CAR_PAINTS = ['#4a1614', '#1c2f46', '#3a3c40', '#2a2d33', '#22302a', '#3a2f22', '#16181c', '#4a3c1c'];
// no car stands within 5 m of either route's line (a car the line passes at arm's length is a pale slab no one can
// name). Along the bright street the cars stand in the drives; at the kerbs they stand where the line keeps 5 m
// from them.
export const CAR_CLEAR = 5;
// the share of the raked heaps that keep a barrow (r8d, E)
export const BARROW_SHARE = 1 / 4;
// (round eight: the deal runs in steps, so that the world's build can hand the page back between them: dealThingsSteps
// is the deal itself, pausing after the barrows, after each kerb street and after each row of blocks;
// dealThings runs it through at once for whoever wants the whole)
export function dealThings(seed) { const it = dealThingsSteps(seed); for (;;) { const s = it.next(); if (s.done) return s.value; } }
export function* dealThingsSteps(seed) {
  const cars = [], drives = [], boxes = [], hydrants = [], barrows = [];
  const car = (id, p, q, dir) => {
    const r = lotRng(seed, 'car:' + id), kind = CAR_KINDS[Math.floor(r() * 4)], paint = Math.floor(r() * 8), sz = CAR_SIZE[kind];
    const c = { id, p, q, dir, kind, paint, hl: sz[0], hw: sz[1], y0: 0, y1: sz[2], close: routeNear(p, q) < 45 };
    if (boxClear(c) >= CAR_CLEAR && coneClear(c) && airClear(c) >= AIR_KEEP) cars.push(c);
  };
  // (E3; r8d, E) A BARROW WITH A RAKE beside a raked heap of the home street's verge (the heaps' one deal: dealHeaps).
  // WHICH HEAPS KEEP ONE IS A DRAW OF THE BARROW'S OWN STREAM OVER ALL THE HEAPS THAT STAND: ONE HEAP IN FOUR
  // (BARROW_SHARE), wherever along the street that falls, on every seed alike; no heap is counted from the entry.
  // It stands on the verge's middle line as the heap is, 1.5 m off the heap's edge along the street, on the side of
  // the heap its stream draws; where a verge tree stands within 1.8 m of that place, or its box (rake and all) would
  // not keep the clear air + 0.4 m, it stands on the heap's other side; where neither side is free the heap keeps none
  for (const h of dealHeaps(seed)) {
    const r = lotRng(seed, 'barrow:' + h.k);
    if (r() >= BARROW_SHARE) continue;
    const first = r() < 0.5 ? -1 : 1, yaw = r.range(-0.35, 0.35), rake = r() < 0.5 ? -1 : 1;
    const at = (sd) => ({ p: h.p, q: h.q + sd * (h.rad + 1.5), dir: [Math.sin(yaw), Math.cos(yaw)], hl: 1.25, hw: 0.42, y0: 0, y1: 1.65, rake });
    const free = (b) => !dealTrees(seed, h.side < 0 ? -1 : 0, Math.floor(b.q / K.BLOCK)).some((t) => Math.hypot(t.p - b.p, t.q - b.q) < 1.8) && boxClear(b) >= K.CLEAR + 0.4 && coneClear(b);
    const b = [at(first), at(-first)].find(free);
    if (b) barrows.push(b);
  }
  yield;
  // AT THE KERB, by a rule in space: along every street line that bounds a block of the near town, one candidate to
  // a lot's length on each side, wherever the middle of that length lies within a block's length of either line in
  // the plan and the street has a block on each side; three in ten hold a car, half of them along Main Street's rows
  // of stores (round eight, B4: rimed cars at the kerbs); none within 14 m of a crossing's middle; each stands only
  // if it keeps CAR_CLEAR from both lines
  const S = span(), B = K.BLOCK, kerbs = [];
  for (let k = S.i0; k <= S.i1 + 1; k++) kerbs.push(['q', B * k, k, S.j0 * B, (S.j1 + 1) * B]);
  for (let j = S.j0; j <= S.j1 + 1; j++) kerbs.push(['p', B * j, j, S.i0 * B, (S.i1 + 1) * B]);
  for (const [axis, at, num, from, to] of kerbs) {
    for (let a = from, n = 0; a < to; a += K.LOT, n++) for (const side of [-1, 1]) {
      const mid = a + K.LOT / 2, ns = axis === 'q';
      if (routeNear(ns ? at : mid, ns ? mid : at) > B || !streetAt(seed, ns, num, mid)) continue;   // (asked before the place's own stream)
      const rows = !ns && at === MAIN.q && mid < 0 && mid > K.RING[0];
      const r = lotRng(seed, 'kerb:' + axis + at + ':' + n + ':' + side), there = r() < (rows ? 0.5 : 0.3), along = a + r.range(3, K.LOT - 3), m = ((along % B) + B) % B;   // (its middle 3 m and more inside the lot's length)
      if (!there || m < 14 || m > B - 14) continue;
      if (axis === 'q') car('k' + at + ':' + n + ':' + side, at + side * 3.62, along, [0, side]); else car('k' + at + ':' + n + ':' + side, along, at + side * 3.62, [-side, 0]);
    }
    yield;
  }
  // drives beside every second house near the routes, a car on some; a mailbox at the kerb by most houses
  for (let j = S.j0; j <= S.j1; j++) for (let i = S.i0; i <= S.i1; i++) {   // (every block of the near town)
    if (i === S.i0) yield;
    if (!blockExists(i, j, seed)) continue;
    for (const h of dealBlock(seed, i, j)) {
      if (h.kind === 'store') continue;
      const r = lotRng(seed, 'drive:' + h.id), s = r() < 0.5 ? -1 : 1, hasCar = r() < 0.55, cw = r.range(2.2, 5), box = r() < 0.75, bu = r.range(-3, 3);
      if (h.drive && h.w <= 10.2) {
        drives.push({ h, s, u: s * 6.4 });
        if (hasCar) { const c = housePt(h, s * 6.4, cw); car('d' + h.id, c[0], c[1], h.face); }
      }
      if (box) { const m = housePt(h, h.drive && h.w <= 10.2 ? s * 4.6 : bu, 8.72), b = { p: m[0], q: m[1], dir: h.face, hl: 0.25, hw: 0.12, y0: 0, y1: 1.4 }; if (boxClear(b) >= 7.05 && coneClear(b)) boxes.push(b); }   // round three: no post within 7 m of the line
    }
  }
  yield;
  // round five: a garden lot (see dealBack) has a drive to its shed and a car on it
  for (let j = S.j0; j <= S.j1; j++) for (let i = S.i0; i <= S.i1; i++) for (const dr of dealBack(seed, i, j).drives) {
    drives.push({ h: dr.h, s: dr.s, u: dr.u, dp: 5 });
    const c = housePt(dr.h, dr.u, 1.6); car('g' + dr.h.id, c[0], c[1], dr.h.face);
  }
  // a hydrant at every crossing inside the near town, on one of its four corners; none at the crossings of Main
  // Street's own blocks (the stores' walks carry the lamp standards and the snow banks); none within 20 m of the
  // dark line's first point, north of the plane (round six: nothing stands in the first metres past the thin place)
  for (let j = S.j0 + 1; j <= S.j1; j++) for (let k = S.i0 + 1; k <= S.i1; k++) {
    if (B * j === MAIN.q && B * k < 0 && B * k > MAIN.w) continue;   // (before the crossing's own stream is asked)
    const r = lotRng(seed, 'hydrant:' + k + ':' + j), sx = r() < 0.5 ? -1 : 1, sy = r() < 0.5 ? -1 : 1, hy = { p: B * k + sx * 5.3, q: B * j + sy * 10.5, dir: [0, 1], hl: 0.2, hw: 0.2, y0: 0, y1: 0.8 };
    if (hy.q > 0 && Math.hypot(hy.p, hy.q) < 20) continue;
    if (boxClear(hy) >= K.CLEAR + 0.1 && coneClear(hy)) hydrants.push(hy);
  }
  return { cars, drives, boxes, hydrants, barrows };
}

// ---------------------------------------------------------------------------------------------- geometry
// A small accumulator in the build axes (X = p, Y = y, Z = -q). Per vertex: position, normal (bytes), colour (sRGB
// bytes; alpha = how strongly a pane glows), aL (baked light: rgb the bulbs' colour near it, a the lamps') and
// aT (u, v, shade, kind). Indexed quads and triangles; one draw call for each Geo.
export const KIND = { WALL: 0, ROOF: 1, PANE: 2, LAWN: 3, BARK: 4, SMOOTH: 5, BRICK: 6, WALK: 7, LAMP: 8, STONE: 9, FIELD: 10, LEAF: 11, FENCE: 12, LITTER: 13, ROAD: 14, LACE: 15 };
const _c = new THREE.Color();
const _hexes = new Map(), _rings = new Map();
export class Geo {
  constructor(cap = 2048) {
    this.cap = cap; this.nv = 0; this.ni = 0; this.icap = cap * 2;
    this.pos = new Float32Array(cap * 3); this.nor = new Int8Array(cap * 4); this.col = new Uint8Array(cap * 4);
    this.lit = new Uint8Array(cap * 4); this.tex = new Uint8Array(cap * 4); this.idx = new Uint32Array(this.icap);
    this.ox = 0; this.oy = 0; this.oz = 0; this.cs = 1; this.sn = 0;
    this.c = [200, 200, 200, 0]; this.k = 0; this.sh = 255;
    this.det = null; this.cards = null; this._c0 = 0; this.mixed = false;   // (every Geo holds the same fields: one shape for the engine's fast paths)
  }
  // local axes: origin (plan p, q at height y) and the unit vector the local +z looks along, in the plan
  frame(p, q, y = 0, face = null) {
    this.ox = p; this.oy = y; this.oz = -q;
    if (face) { this.sn = face[0]; this.cs = -face[1]; } else { this.sn = 0; this.cs = 1; }
    return this;
  }
  color(hex, glow = 0, gain = 1) {
    let v = _hexes.get(hex); if (!v) { _c.set(hex); v = [_c.r, _c.g, _c.b]; _hexes.set(hex, v); }   // (a colour's name is read once)
    const f = (x) => Math.max(0, Math.min(255, Math.round(Math.sqrt(Math.max(0, x * gain)) * 255)));
    this.c = [f(v[0]), f(v[1]), f(v[2]), Math.round(clamp(glow, 0, 1) * 255)]; return this;
  }
  kind(k, shade = 1) { this.k = k; this.sh = Math.round(clamp(shade, 0, 1) * 255); return this; }
  // ROUND FOUR (room): the Geo that takes this one's SMALL RELIEF (window casings, rails, twigs): its own .det when
  // the world gave it one (drawn only while the eye is near the block), else itself; it stands on the same origin
  detail() { const d = this.det; if (!d) return this; d.ox = this.ox; d.oy = this.oy; d.oz = this.oz; d.cs = this.cs; d.sn = this.sn; return d; }
  // a run of small four-cornered cards (the bake takes each as one): .cards = [from, to, from, to, ...]
  cardsOn() { this._c0 = this.nv; return this; }
  cardsOff() { if (this.nv > this._c0) { const C = this.cards || (this.cards = []); if (C.length && C[C.length - 1] === this._c0) C[C.length - 1] = this.nv; else C.push(this._c0, this.nv); } return this; }
  shade(s) { this.sh = Math.round(clamp(s, 0, 1) * 255); return this; }
  _grow(nv, ni) {
    if (this.nv + nv > this.cap) {
      this.cap = Math.max(this.cap * 2, this.nv + nv);
      const g = (A, n) => { const B = new A.constructor(this.cap * n); B.set(A.subarray(0, this.nv * n)); return B; };
      this.pos = g(this.pos, 3); this.nor = g(this.nor, 4); this.col = g(this.col, 4); this.lit = g(this.lit, 4); this.tex = g(this.tex, 4);
    }
    if (this.ni + ni > this.icap) { this.icap = Math.max(this.icap * 2, this.ni + ni); const B = new Uint32Array(this.icap); B.set(this.idx.subarray(0, this.ni)); this.idx = B; }
  }
  // one vertex at local (x, y, z) with local normal (nx, ny, nz) and pane coordinates (u, v)
  v(x, y, z, nx, ny, nz, u = 0, vv = 0) {
    const i = this.nv++, cs = this.cs, sn = this.sn;
    this.pos[i * 3] = this.ox + x * cs + z * sn; this.pos[i * 3 + 1] = this.oy + y; this.pos[i * 3 + 2] = this.oz - x * sn + z * cs;
    this.nor[i * 4] = Math.round((nx * cs + nz * sn) * 127); this.nor[i * 4 + 1] = Math.round(ny * 127); this.nor[i * 4 + 2] = Math.round((-nx * sn + nz * cs) * 127);
    const c4 = this.c, o4 = i * 4; this.col[o4] = c4[0]; this.col[o4 + 1] = c4[1]; this.col[o4 + 2] = c4[2]; this.col[o4 + 3] = c4[3];
    this.tex[i * 4] = Math.round(clamp(u, 0, 1) * 255); this.tex[i * 4 + 1] = Math.round(clamp(vv, 0, 1) * 255); this.tex[i * 4 + 2] = this.sh; this.tex[i * 4 + 3] = this.k * 16;
    return i;
  }
  // a quad a, b, c, d (counter-clockwise seen from outside); the normal is the face's own
  quad(a, b, c, d) {
    this._grow(4, 6);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    // (the four corners written in place: the face's normal is turned into the local axes once)
    const cs = this.cs, sn = this.sn, N0 = Math.round((nx * cs + nz * sn) * 127), N1 = Math.round(ny * 127), N2 = Math.round((-nx * sn + nz * cs) * 127);
    const i0 = this.nv, pos = this.pos, nor = this.nor, col = this.col, tex = this.tex, c4 = this.c, sh = this.sh, kk = this.k * 16, ox = this.ox, oy = this.oy, oz = this.oz;
    for (let k = 0; k < 4; k++) {
      const q = k === 0 ? a : k === 1 ? b : k === 2 ? c : d, o3 = (i0 + k) * 3, o4 = (i0 + k) * 4;
      pos[o3] = ox + q[0] * cs + q[2] * sn; pos[o3 + 1] = oy + q[1]; pos[o3 + 2] = oz - q[0] * sn + q[2] * cs;
      nor[o4] = N0; nor[o4 + 1] = N1; nor[o4 + 2] = N2;
      col[o4] = c4[0]; col[o4 + 1] = c4[1]; col[o4 + 2] = c4[2]; col[o4 + 3] = c4[3];
      tex[o4] = k === 1 || k === 2 ? 255 : 0; tex[o4 + 1] = k >= 2 ? 255 : 0; tex[o4 + 2] = sh; tex[o4 + 3] = kk;
    }
    this.nv = i0 + 4;
    const idx = this.idx, ni = this.ni; idx[ni] = i0; idx[ni + 1] = i0 + 1; idx[ni + 2] = i0 + 2; idx[ni + 3] = i0; idx[ni + 4] = i0 + 2; idx[ni + 5] = i0 + 3; this.ni = ni + 6; return this;
  }
  tri(a, b, c) {
    this._grow(3, 3);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, 0, 0); this.v(b[0], b[1], b[2], nx, ny, nz, 1, 0); this.v(c[0], c[1], c[2], nx, ny, nz, 0.5, 1);
    this.idx.set([i0, i0 + 1, i0 + 2], this.ni); this.ni += 3; return this;
  }
  // an axis box x0..x1, y0..y1, z0..z1 in the local axes; skip: letters of faces left out (b bottom, t top)
  box(x0, y0, z0, x1, y1, z1, skip = 'b') {
    const A = [x0, y0, z1], B = [x1, y0, z1], C = [x1, y1, z1], D = [x0, y1, z1], E = [x0, y0, z0], F = [x1, y0, z0], G = [x1, y1, z0], H = [x0, y1, z0];
    if (!skip.includes('f')) this.quad(A, B, C, D);
    if (!skip.includes('k')) this.quad(F, E, H, G);
    if (!skip.includes('r')) this.quad(B, F, G, C);
    if (!skip.includes('l')) this.quad(E, A, D, H);
    if (!skip.includes('t')) this.quad(D, C, G, H);
    if (!skip.includes('b')) this.quad(E, F, B, A);
    return this;
  }
  // a tapered tube from a to b (local points), `sides` round; smooth normals
  tube(a, b, ra, rb, sides = 5, cap = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, tx = dx / L, ty = dy / L, tz = dz / L;
    let ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1, uz = 0;
    let vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
    ux = vy * tz - vz * ty; uy = vz * tx - vx * tz; uz = vx * ty - vy * tx;
    this._grow(sides * 2 + 2 + (cap ? sides + 1 : 0), sides * 6 + (cap ? sides * 3 : 0));
    const i0 = this.nv;
    // (each side's two points written in place: its normal is turned into the local axes once; the circle's steps are kept by count)
    let T = _rings.get(sides); if (!T) { T = new Float64Array((sides + 1) * 2); for (let s = 0; s <= sides; s++) { const an = (s / sides) * 6.2832; T[s * 2] = Math.cos(an); T[s * 2 + 1] = Math.sin(an); } _rings.set(sides, T); }
    const fc = this.cs, fs = this.sn, pos = this.pos, nor = this.nor, col = this.col, tex = this.tex, c4 = this.c, sh = this.sh, kk = this.k * 16, ox = this.ox, oy = this.oy, oz = this.oz;
    for (let s = 0; s <= sides; s++) {
      const c = T[s * 2], sn = T[s * 2 + 1], nx = ux * c + vx * sn, ny = uy * c + vy * sn, nz = uz * c + vz * sn;
      const N0 = Math.round((nx * fc + nz * fs) * 127), N1 = Math.round(ny * 127), N2 = Math.round((-nx * fs + nz * fc) * 127), U = Math.round(clamp(s / sides, 0, 1) * 255);
      for (let e = 0; e < 2; e++) {
        const q = e ? b : a, rr = e ? rb : ra, x = q[0] + nx * rr, y = q[1] + ny * rr, z = q[2] + nz * rr, i = this.nv++, o3 = i * 3, o4 = i * 4;
        pos[o3] = ox + x * fc + z * fs; pos[o3 + 1] = oy + y; pos[o3 + 2] = oz - x * fs + z * fc;
        nor[o4] = N0; nor[o4 + 1] = N1; nor[o4 + 2] = N2;
        col[o4] = c4[0]; col[o4 + 1] = c4[1]; col[o4 + 2] = c4[2]; col[o4 + 3] = c4[3];
        tex[o4] = U; tex[o4 + 1] = e ? 255 : 0; tex[o4 + 2] = sh; tex[o4 + 3] = kk;
      }
    }
    const idx = this.idx; let ni = this.ni;
    for (let s = 0; s < sides; s++) { const k = i0 + s * 2; idx[ni] = k; idx[ni + 1] = k + 1; idx[ni + 2] = k + 3; idx[ni + 3] = k; idx[ni + 4] = k + 3; idx[ni + 5] = k + 2; ni += 6; }
    if (cap) { const c0 = this.v(b[0], b[1], b[2], tx, ty, tz, 0.5, 1); for (let s = 0; s < sides; s++) { idx[ni] = i0 + s * 2 + 1; idx[ni + 1] = c0; idx[ni + 2] = i0 + s * 2 + 3; ni += 3; } }
    this.ni = ni;
    return this;
  }
  get triangles() { return this.ni / 3; }
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.nv;
    // (views of the Geo's own arrays, not copies: the Geo is done with once its geometry is made)
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.subarray(0, n * 3), 3));
    g.setAttribute('aN', new THREE.BufferAttribute(this.nor.subarray(0, n * 4), 4, true));
    g.setAttribute('aC', new THREE.BufferAttribute(this.col.subarray(0, n * 4), 4, true));
    g.setAttribute('aL', new THREE.BufferAttribute(this.lit.subarray(0, n * 4), 4, true));
    g.setAttribute('aT', new THREE.BufferAttribute(this.tex.subarray(0, n * 4), 4, true));
    g.setIndex(new THREE.BufferAttribute(n > 65535 ? this.idx.subarray(0, this.ni) : new Uint16Array(this.idx.subarray(0, this.ni)), 1));
    // the bounding sphere from the box of the points (one pass)
    { const P = this.pos; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
      for (let i = 0, m = n * 3; i < m; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), n ? Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 : 0); }
    return g;
  }
}

// ---------------------------------------------------------------------------------------------- houses
const TRIM = '#f2efe6', GLASS = '#0a0d14', AMBER = '#ffb060', AMBERP = '#ffb060', COOL = '#dfe8ff', STONE = '#6a6258', BRICKS = ['#8a3a2a', '#7a4a3a', '#9a5a40', '#6a4038', '#c2ab86', '#a8a498'];   // (the last two, round eight: buff brick and grey limestone among the stores: on the dead side each front has its own value)
// wall-local to house-local: a runs to the right seen from outside, out is the distance proud of the wall
const wallPt = (d, side, w0) => side === 'f' ? (a, y, o) => [a, y, w0 + o] : side === 'k' ? (a, y, o) => [-a, y, -d.dp - o]
  : side === 'r' ? (a, y, o) => [d.hw + o, y, w0 - a] : (a, y, o) => [-d.hw - o, y, -d.dp + a];
// a sash window: pane (glows by `lit`: 0 dark, else its strength), and at full detail a casing standing proud, a sill
// and a cross of glazing bars
let _wins = null;   // while a house is built: its ground-floor windows as house-local [u, w, du, dw, width, the pool's kind, its colour] (for the patches of light below them)
let _panes = null;  // (round six) while a house is built: its windows' panes as [geo, first vertex, its row in _wins or -1, its wall (1 front, -1 back, 2 right, -2 left), its sill's height] (some are dealt to glow at rest)
function addWindow(g, P, a, y, ww, wh, lit, cool, lod) {
  let wi = -1;
  if (_wins && y < 3) { const c = P(a, 0, 1.7), b = P(a, 0, 0); wi = _wins.length; _wins.push([c[0], c[2], c[0] - b[0], c[2] - b[2], ww, 1, AMBERP]); }
  if (_panes) { const c1 = P(a, 0, 1), c0 = P(a, 0, 0); _panes.push(g, g.nv, wi, Math.round(c1[0] - c0[0]) * 2 + Math.round(c1[2] - c0[2]), y); }
  g.kind(KIND.PANE).color(lit > 0 ? (cool ? COOL : AMBER) : GLASS, lit);
  g.quad(P(a - ww / 2, y, 0.03), P(a + ww / 2, y, 0.03), P(a + ww / 2, y + wh, 0.03), P(a - ww / 2, y + wh, 0.03));
  if (lod > 0) return;
  const g0 = g; g = g.detail().cardsOn();
  g.kind(KIND.SMOOTH).color(TRIM);
  const f = 0.11, o = 0.09, bx = (a0, y0, a1, y1, oo) => { g.quad(P(a0, y0, oo), P(a1, y0, oo), P(a1, y1, oo), P(a0, y1, oo)); };
  bx(a - ww / 2 - f, y - f, a - ww / 2, y + wh + f, o); bx(a + ww / 2, y - f, a + ww / 2 + f, y + wh + f, o);
  bx(a - ww / 2, y + wh, a + ww / 2, y + wh + f, o); bx(a - ww / 2 - f - 0.05, y - f - 0.04, a + ww / 2 + f + 0.05, y, o + 0.05);
  g.quad(P(a - ww / 2 - f, y + wh + f, 0), P(a + ww / 2 + f, y + wh + f, 0), P(a + ww / 2 + f, y + wh + f, o), P(a - ww / 2 - f, y + wh + f, o));
  g.quad(P(a - ww / 2 - f, y - f, o), P(a - ww / 2 - f, y + wh + f, o), P(a - ww / 2 - f, y + wh + f, 0), P(a - ww / 2 - f, y - f, 0));
  g.quad(P(a + ww / 2 + f, y - f, 0), P(a + ww / 2 + f, y + wh + f, 0), P(a + ww / 2 + f, y + wh + f, o), P(a + ww / 2 + f, y - f, o));
  bx(a - 0.025, y, a + 0.025, y + wh, 0.05); bx(a - ww / 2, y + wh * 0.5 - 0.025, a + ww / 2, y + wh * 0.5 + 0.025, 0.05);
  g.cardsOff(); if (g !== g0) g0.kind(KIND.SMOOTH).color(TRIM);
}
// a row of windows on one wall between a0 and a1 at sill height y
function windowRow(g, P, a0, a1, y, n, ww, wh, r, lod, litP) {
  for (let i = 0; i < n; i++) {
    const a = lerp(a0, a1, (i + 0.5) / n), x = r(), lit = x < litP ? 0.55 + 0.45 * r() : 0;
    addWindow(g, P, a, y, ww, wh, lit, x < 0.07, lod);
  }
}
// roofs in house-local coordinates. o: the overhang; rk: roof colour already set by the caller
function roofFront(g, u0, u1, w0, w1, eave, ridge, o, wall) {
  const um = (u0 + u1) / 2, sl = (ridge - eave) / (um - u0), ey = eave - o * sl;
  g.quad([u0 - o, ey, w1 + o], [um, ridge, w1 + o], [um, ridge, w0 - o], [u0 - o, ey, w0 - o]);
  g.quad([u1 + o, ey, w1 + o], [u1 + o, ey, w0 - o], [um, ridge, w0 - o], [um, ridge, w1 + o]);
  g.kind(KIND.ROOF, 0.45); g.quad([u0 - o, ey, w0 - o], [um, ridge, w0 - o], [um, ridge, w1 + o], [u0 - o, ey, w1 + o]);
  g.quad([u1 + o, ey, w0 - o], [u1 + o, ey, w1 + o], [um, ridge, w1 + o], [um, ridge, w0 - o]);
  g.kind(KIND.WALL).color(wall); g.tri([u0, eave, w1], [u1, eave, w1], [um, ridge, w1]); g.tri([u1, eave, w0], [u0, eave, w0], [um, ridge, w0]);
}
// ridge along u at w = rw; front eave at (wf, yf), back eave at (wb, yb); the gable walls close down to `base`
function roofSide(g, u0, u1, wb, wf, yb, yf, rw, ridge, o, wall, base, w0, w1) {
  const sf = (ridge - yf) / (wf - rw), sb = (ridge - yb) / (rw - wb), fy = yf - o * sf * 0, by = yb;
  g.quad([u0 - o, fy, wf], [u1 + o, fy, wf], [u1 + o, ridge, rw], [u0 - o, ridge, rw]);
  g.quad([u1 + o, by, wb], [u0 - o, by, wb], [u0 - o, ridge, rw], [u1 + o, ridge, rw]);
  g.kind(KIND.ROOF, 0.45); g.quad([u1 + o, fy, wf], [u0 - o, fy, wf], [u0 - o, ridge, rw], [u1 + o, ridge, rw]);
  g.quad([u0 - o, by, wb], [u1 + o, by, wb], [u1 + o, ridge, rw], [u0 - o, ridge, rw]);
  g.kind(KIND.WALL).color(wall);
  const hf = ridge - sf * (w1 - rw), hb = ridge - sb * (rw - w0);
  for (const s of [-1, 1]) {
    const u = s < 0 ? u0 : u1, A = [u, base, w1], B = [u, base, w0], C = [u, hb, w0], D = [u, ridge, rw], E = [u, hf, w1];
    if (s > 0) { g.tri(A, B, C); g.tri(A, C, D); g.tri(A, D, E); } else { g.tri(B, A, C); g.tri(C, A, D); g.tri(D, A, E); }
  }
}
function roofHip(g, u0, u1, w0, w1, eave, ridge, o) {
  const um = (u0 + u1) / 2, wm = (w0 + w1) / 2, rl = Math.max(0.4, ((u1 - u0) - (w1 - w0)) / 2 + 0.6), a = [um - rl, ridge, wm], b = [um + rl, ridge, wm], y = eave - 0.12;
  g.quad([u0 - o, y, w1 + o], [u1 + o, y, w1 + o], b, a); g.quad([u1 + o, y, w0 - o], [u0 - o, y, w0 - o], a, b);
  g.tri([u1 + o, y, w1 + o], [u1 + o, y, w0 - o], b); g.tri([u0 - o, y, w0 - o], [u0 - o, y, w1 + o], a);
  g.kind(KIND.ROOF, 0.45); g.quad([u0 - o, y, w0 - o], [u1 + o, y, w0 - o], [u1 + o, y, w1 + o], [u0 - o, y, w1 + o]);
}
const DOORS = ['#5a2a22', '#2a3a30', '#3a2c22', '#26303e'];
// a porch: floor slab, shed roof, posts; at full detail a rail with balusters and steps. u0..u1 across, from w0 out by pd.
function addPorch(g, d, u0, u1, w0, pd, wall, roofC, lod, door, lights) {
  const fl = d.floor, py = d.porchY, w1 = w0 + pd;
  g.kind(KIND.WALK, 0.8).color('#8a8478'); g.box(u0, 0, w0, u1, fl, w1, 'bk');
  g.kind(KIND.ROOF).color(roofC); g.quad([u0 - 0.2, py - 0.08, w1 + 0.3], [u1 + 0.2, py - 0.08, w1 + 0.3], [u1 + 0.2, py + 0.5, w0], [u0 - 0.2, py + 0.5, w0]);
  g.kind(KIND.SMOOTH, 0.5).color(TRIM); g.quad([u1 + 0.2, py - 0.1, w1 + 0.3], [u0 - 0.2, py - 0.1, w1 + 0.3], [u0 - 0.2, py + 0.3, w0], [u1 + 0.2, py + 0.3, w0]);
  g.kind(KIND.SMOOTH).box(u0 - 0.2, py - 0.28, w1 + 0.12, u1 + 0.2, py - 0.08, w1 + 0.3, '');
  const n = Math.max(3, Math.round((u1 - u0) / 2.6) + 1), ps = 0.09;
  for (let i = 0; i < n; i++) { const u = lerp(u0 + 0.15, u1 - 0.15, i / (n - 1)); g.box(u - ps, fl, w1 - 0.1 - ps * 2, u + ps, py - 0.28, w1 - 0.1, 'bt'); }
  if (lights) lights.push([door, py - 0.2, w0 + 0.5, 0]);
  if (lod > 0) return;
  // rail and balusters between the posts, an opening before the door; steps down to the walk
  const g0 = g; g = g.detail().cardsOn(); g.kind(KIND.SMOOTH).color(TRIM);
  for (let i = 0; i + 1 < n; i++) {
    const a = lerp(u0 + 0.15, u1 - 0.15, i / (n - 1)), b = lerp(u0 + 0.15, u1 - 0.15, (i + 1) / (n - 1));
    if (door > a && door < b) continue;
    g.box(a, fl + 0.82, w1 - 0.2, b, fl + 0.9, w1 - 0.12, ''); g.box(a, fl + 0.1, w1 - 0.19, b, fl + 0.16, w1 - 0.13, '');
    for (let u = a + 0.16; u < b - 0.05; u += 0.16) g.quad([u - 0.025, fl + 0.16, w1 - 0.13], [u + 0.025, fl + 0.16, w1 - 0.13], [u + 0.025, fl + 0.82, w1 - 0.13], [u - 0.025, fl + 0.82, w1 - 0.13]);
  }
  g.kind(KIND.WALK, 0.9).color('#8a8478');
  g.cardsOff(); g = g0;   // (the steps stay with the house)
  g.kind(KIND.WALK, 0.9).color('#8a8478');
  for (let s = 0; s < 3; s++) g.box(door - 0.75, 0, w1 + s * 0.3, door + 0.75, fl * (1 - (s + 1) / 4), w1 + (s + 1) * 0.3, 'bk');
}
// (round eight, C4) A HALL HOUSE'S FRONT DOOR: a glazed double door in the middle of its front, behind its leaf. Seen
// alive the glass is not there (the open glass, class 0.1) and the lit hall shows: a warm wall, its wainscot, the line of
// a stair, a lamp (flat glowing faces, class 0.3: plain forms). Seen dead it is dark glass in a white casing.
function addHall(g, P, fl) {
  const w = 0.95, top = fl + 2.15, q = (c, s, a0, y0, a1, y1, o) => { g.kind(KIND.PANE, 0.3).color(c, s); g.quad(P(a0, y0, o), P(a1, y0, o), P(a1, y1, o), P(a0, y1, o)); };
  q('#f0c890', 0.8, -w, fl, w, top, 0.02);
  q('#a8743c', 0.5, -w, fl, w, fl + 0.7, 0.03);
  g.kind(KIND.PANE, 0.3).color('#8a5a30', 0.45); g.quad(P(-w, fl + 0.7, 0.04), P(-0.15, fl + 0.7, 0.04), P(w, fl + 1.85, 0.04), P(w, fl + 1.3, 0.04));
  q('#fff0c8', 1, -0.56, fl + 1.5, -0.28, fl + 1.86, 0.05);
  g.kind(KIND.PANE, 0.1).color(GLASS, 0); g.quad(P(-w, fl, 0.08), P(w, fl, 0.08), P(w, top, 0.08), P(-w, top, 0.08));
  g.kind(KIND.SMOOTH).color(TRIM);
  for (const [a0, y0, a1, y1] of [[-w - 0.09, fl, -w, top + 0.09], [w, fl, w + 0.09, top + 0.09], [-w, top, w, top + 0.09], [-0.035, fl, 0.035, top], [-w, fl, w, fl + 0.14]]) g.quad(P(a0, y0, 0.095), P(a1, y0, 0.095), P(a1, y1, 0.095), P(a0, y1, 0.095));
}
function addDoor(g, P, a, fl, r, lod) {
  g.kind(KIND.SMOOTH).color(DOORS[Math.floor(r() * 4)]); g.quad(P(a - 0.48, fl, 0.03), P(a + 0.48, fl, 0.03), P(a + 0.48, fl + 2.05, 0.03), P(a - 0.48, fl + 2.05, 0.03));
  g.kind(KIND.PANE).color(AMBER, 0.8); g.quad(P(a - 0.48, fl + 2.12, 0.03), P(a + 0.48, fl + 2.12, 0.03), P(a + 0.48, fl + 2.42, 0.03), P(a - 0.48, fl + 2.42, 0.03));
  if (lod > 0) return;
  const g0 = g; g = g.detail().cardsOn();
  g.kind(KIND.SMOOTH).color(TRIM);
  for (const s of [-1, 1]) g.quad(P(a + s * 0.54 - 0.06, fl, 0.07), P(a + s * 0.54 + 0.06, fl, 0.07), P(a + s * 0.54 + 0.06, fl + 2.5, 0.07), P(a + s * 0.54 - 0.06, fl + 2.5, 0.07));
  g.quad(P(a - 0.6, fl + 2.44, 0.07), P(a + 0.6, fl + 2.44, 0.07), P(a + 0.6, fl + 2.56, 0.07), P(a - 0.6, fl + 2.56, 0.07));
  g.cardsOff(); if (g !== g0) g0.kind(KIND.SMOOTH).color(TRIM);
}
// ONE HOUSE into g at level of detail lod (0 full relief, 1 fewer triangles, 2 a plain roofed block). lights: porch
// lamps pushed as house-local [u, y, w, kind]. Returns nothing; the Geo's origin is left on the house.
export function buildHouse(g, h, lod, lights = null, wins = null) {
  _wins = wins ? [] : null; _panes = lod < 2 ? [] : null;
  const out = buildHouse0(g, h, lod, lights);
  // (round six) AT REST two to five of a house's windows glow amber on the dark side (one to three of a store's upper
  // windows), dealt from the house's own stream, made by the seed and its name (r8d, F2): their panes take the class
  // 0.8, their patches the kind 5
  if (_panes && _panes.length) restPanes(_panes, lotRng(h.seed, 'rest:' + h.id), h.kind === 'store' ? 1 : 2, h.kind === 'store' ? 3 : 4, h.kind !== 'store' && lod === 0);
  // the patches of light below its ground-floor windows, in plan coordinates: [p, q, half width, half depth, dir p, dir q, kind, colour]
  if (wins) for (const w of _wins) { const c = housePt(h, w[0], w[1]), e = housePt(h, w[0] + w[2], w[1] + w[3]), l = Math.hypot(e[0] - c[0], e[1] - c[1]) || 1; wins.push([c[0], c[1], w[4] * 0.5 + 0.35, w[5] === 4 ? 1.9 : 1.25, (e[0] - c[0]) / l, (e[1] - c[1]) / l, w[5], w[6]]); }
  _wins = null; _panes = null;
  return out;
}
// of the panes on a list, `least` to `least + spread - 1` take the class 0.8 (they glow at rest). walls (a house in
// full relief, round six, D3): first one on EVERY WALL that has windows (on a side or back wall a ground-floor one
// before an upper one: its patch of light lies on the yard), so that no wall of it stands without a lit window; five
// at most
function restPanes(panes, rr, least, spread, walls = false) {
  const np = panes.length / 5; let want = Math.min(np, least + Math.floor(rr() * spread)), k = 0;
  const light = (j) => {
    const G = panes[j], i0 = panes[j + 1]; if (G.tex[i0 * 4 + 2] !== 255) return false;
    for (let c = 0; c < 4; c++) G.tex[(i0 + c) * 4 + 2] = 204;
    if (_wins && panes[j + 2] >= 0) _wins[panes[j + 2]][5] = 5;
    return true;
  };
  if (walls) {
    for (const w of [1, 2, -2, -1]) {
      const low = [], high = []; for (let j = 0; j < panes.length; j += 5) if (panes[j + 3] === w) (panes[j + 4] < 3 ? low : high).push(j);
      const from = low.length && (w !== 1 || rr() < 0.6) ? low : high.length ? high : low; if (!from.length) continue;
      if (light(from[Math.floor(rr() * from.length)])) k++;
    }
    want = Math.min(np, Math.max(want, k), 5);
  }
  for (let tries = 0; k < want && tries < 60; tries++) if (light(Math.floor(rr() * np) * 5)) k++;
}
// a box in a wall's own coordinates (a along the wall, y up, o out from it): P is the wall's wallPt
function wallBox(g, P, a0, y0, o0, a1, y1, o1, skip = '') {
  const A = P(a0, y0, o1), B = P(a1, y0, o1), C = P(a1, y1, o1), D = P(a0, y1, o1), E = P(a0, y0, o0), F = P(a1, y0, o0), G = P(a1, y1, o0), H = P(a0, y1, o0);
  if (!skip.includes('f')) g.quad(A, B, C, D); if (!skip.includes('k')) g.quad(F, E, H, G); if (!skip.includes('r')) g.quad(B, F, G, C);
  if (!skip.includes('l')) g.quad(E, A, D, H); if (!skip.includes('t')) g.quad(D, C, G, H); if (!skip.includes('b')) g.quad(E, F, B, A);
}
// A FIRE STAIR (round six, D3) on a two-storey house's side wall: a platform of iron under the middle upstairs window
// (am: its middle along the wall; yp: its floor), on two brackets, a rail on three sides with its balusters, and a
// ladder down from its end to 0.7 m over the ground. It stands 0.68 m proud at most (inside the house's own box).
function fireStair(g, P, am, yp) {
  const a0 = am - 1.15, a1 = am + 1.15, o1 = 0.62, yr = yp + 0.95;
  g.kind(KIND.SMOOTH, 0.7).color('#30353b');
  wallBox(g, P, a0, yp - 0.06, 0.02, a1, yp, o1, 'k');
  for (const a of [a0 + 0.12, a1 - 0.12]) g.tube(P(a, yp - 0.8, 0.04), P(a, yp - 0.06, o1 - 0.06), 0.03, 0.03, 3);
  wallBox(g, P, a0, yr - 0.05, o1 - 0.05, a1, yr, o1, '');
  wallBox(g, P, a0, yr - 0.05, 0.02, a0 + 0.05, yr, o1 - 0.05, 'fk'); wallBox(g, P, a1 - 0.05, yr - 0.05, 0.02, a1, yr, o1 - 0.05, 'fk');
  g.cardsOn();
  for (let a = a0; a < a1 - 0.6; a += 0.21) g.quad(P(a, yp, o1), P(a + 0.035, yp, o1), P(a + 0.035, yr - 0.05, o1), P(a, yr - 0.05, o1));
  for (const o of [0.2, 0.42]) { g.quad(P(a0, yp, o + 0.035), P(a0, yp, o), P(a0, yr - 0.05, o), P(a0, yr - 0.05, o + 0.035)); g.quad(P(a1, yp, o), P(a1, yp, o + 0.035), P(a1, yr - 0.05, o + 0.035), P(a1, yr - 0.05, o)); }
  // the ladder: two rails from the rail's height down, a rung each 0.3 m
  const la = a1 - 0.5, lo = o1 + 0.03;
  for (let y = 0.95; y < yr - 0.2; y += 0.3) g.quad(P(la, y, lo), P(la + 0.4, y, lo), P(la + 0.4, y + 0.04, lo), P(la, y + 0.04, lo));
  g.cardsOff();
  for (const a of [la, la + 0.4]) g.tube(P(a, 0.7, lo), P(a, yr, lo), 0.027, 0.027, 3);
}
function buildHouse0(g, h, lod, lights) {
  const d = houseDims(h), r = makeRng(Math.floor(h.litSeed * 4e9)), hw = d.hw, dp = d.dp, o = d.over, litP = h.allLit ? 2 : 0.72, lp = (x) => (h.allLit ? 2 : x);
  g.frame(h.fp, h.fq, 0, h.face);
  if (h.kind === 'store') return buildStore(g, h, d, r, lod);
  const wall = PAINTS[h.paint], roofC = ROOFS[h.roof], fl = d.floor, F = wallPt(d, 'f', 0), Rw = wallPt(d, 'r', 0), Lw = wallPt(d, 'l', 0), Bk = wallPt(d, 'k', 0);
  const y1 = fl + 0.75, y2 = fl + 3.55, two = d.eave > 5;
  if (lod === 0) { g.kind(KIND.STONE).color(STONE); g.box(-hw - 0.06, 0, -dp - 0.06, hw + 0.06, fl, 0.06, 'bt'); }
  g.kind(KIND.WALL).color(wall);
  if (d.roof === 'ell') {
    const s = d.side, a = s * hw, b = a - s * d.wing, ua = Math.min(a, b), ub = Math.max(a, b), va = Math.min(-a, b), vb = Math.max(-a, b), e2 = d.eave - 0.3, rm = (-dp - d.setback) / 2;
    g.box(ua, lod ? 0 : fl, -dp, ub, d.eave, 0, 'bt'); g.box(va, lod ? 0 : fl, -dp, vb, e2, -d.setback, 'bt' + (s > 0 ? 'r' : 'l'));
    g.kind(KIND.ROOF).color(roofC); roofFront(g, ua, ub, -dp, 0, d.eave, d.ridge, o, wall);
    g.kind(KIND.ROOF).color(roofC); roofSide(g, va, vb, -dp - o, -d.setback + o, e2, e2, rm, d.ridge - 0.9, 0, wall, e2, -dp, -d.setback);
    if (lod < 2) {
      const Fw = (aa, y, oo) => [aa, y, oo], Fs = (aa, y, oo) => [aa, y, -d.setback + oo], mid = (ua + ub) / 2;
      windowRow(g, Fw, ua + 0.4, ub - 0.4, y1, 2, 0.95, 1.6, r, lod, litP); windowRow(g, Fw, ua + 0.4, ub - 0.4, y2, 2, 0.95, 1.5, r, lod, litP);
      addWindow(g, Fw, mid, d.eave + 0.5, 0.6, 0.8, r() < lp(0.3) ? 0.7 : 0, false, lod);
      windowRow(g, Fs, va + 0.6, vb - 1.8 * (s > 0 ? 0 : 1) - 0.4, y1, 1, 0.95, 1.6, r, lod, litP); windowRow(g, Fs, va + 0.4, vb - 0.4, y2 - 0.2, 2, 0.9, 1.3, r, lod, litP);
      const doorU = s > 0 ? vb - 1.1 : va + 1.1; addDoor(g, Fs, doorU, fl, r, lod);
      windowRow(g, s > 0 ? Rw : Lw, 1, dp - 1, y1, 3, 0.95, 1.6, r, lod, litP); windowRow(g, s > 0 ? Rw : Lw, 1, dp - 1, y2, 3, 0.95, 1.5, r, lod, litP);
      addPorch(g, d, va, vb, -d.setback, d.porchD, wall, roofC, lod, doorU, lights);
      // round four: no blank wall: the wing's own side and the back
      if (dp - d.setback > 4.4) { if (s > 0) windowRow(g, Lw, 0.9, dp - d.setback - 0.9, y1, 2, 0.95, 1.6, r, lod, litP); else windowRow(g, Rw, d.setback + 0.9, dp - 0.9, y1, 2, 0.95, 1.6, r, lod, litP); }
      windowRow(g, Bk, -hw + 0.8, hw - 0.8, y1, 3, 0.95, 1.5, r, lod, lp(0.5)); windowRow(g, Bk, -hw + 0.8, hw - 0.8, y2 - 0.2, 3, 0.9, 1.3, r, lod, lp(0.5));
    }
  } else {
    g.box(-hw, lod ? 0 : fl, -dp, hw, d.eave, 0, 'bt');
    g.kind(KIND.ROOF).color(roofC);
    if (d.roof === 'front') roofFront(g, -hw, hw, -dp, 0, d.eave, d.ridge, o, wall);
    else if (d.roof === 'hip') roofHip(g, -hw, hw, -dp, 0, d.eave, d.ridge, o + 0.15);
    else roofSide(g, -hw, hw, -dp - o, d.porchD + o, d.eave - 0.1, h.kind === 'bung' ? d.porchY : d.eave - 0.1, h.kind === 'bung' ? -dp * 0.45 : -dp / 2, d.ridge, o, wall, d.eave, -dp, 0);
    if (lod < 2) {
      const nf = h.w > 9.4 ? 3 : 2, doorU = h.hall ? 0 : (h.extra2 < 0.5 ? -1 : 1) * (hw - 1.5), wa = doorU < 0 ? doorU + 1.2 : -hw + 0.5, wb = doorU < 0 ? hw - 0.5 : doorU - 1.2;
      if (h.hall) { windowRow(g, F, -hw + 0.5, -1.5, y1, 1, 1.0, 1.65, r, lod, litP); windowRow(g, F, 1.5, hw - 0.5, y1, 1, 1.0, 1.65, r, lod, litP); addHall(g, F, fl); }
      else { windowRow(g, F, wa, wb, y1, nf - 1, 1.0, 1.65, r, lod, litP); addDoor(g, F, doorU, fl, r, lod); }
      if (two) { windowRow(g, F, -hw + 0.5, hw - 0.5, y2, nf, 0.95, 1.5, r, lod, litP); windowRow(g, Rw, 1, dp - 1, y2, 3, 0.95, 1.5, r, lod, litP); windowRow(g, Lw, 1, dp - 1, y2, 3, 0.95, 1.5, r, lod, litP); }
      if (d.roof === 'front') addWindow(g, F, 0, d.eave + 0.7, 0.7, 0.9, r() < lp(0.3) ? 0.7 : 0, false, lod);
      windowRow(g, Rw, 1, dp - 1, y1, 3, 0.95, 1.6, r, lod, litP); windowRow(g, Lw, 1, dp - 1, y1, 3, 0.95, 1.6, r, lod, litP);
      windowRow(g, Bk, -hw + 0.8, hw - 0.8, y1, 2, 0.95, 1.5, r, lod, lp(0.5)); if (two) windowRow(g, Bk, -hw + 0.8, hw - 0.8, y2, 2, 0.95, 1.4, r, lod, lp(0.5));   // round four: at lod 1 too, and upstairs
      if (d.porchD > 0) addPorch(g, d, -hw, hw, 0, d.porchD, wall, roofC, lod, doorU, lights);
      else if (lights) lights.push([doorU + 0.8, fl + 2.1, 0.3, 0]);
    }
  }
  if (lod === 0) {
    // round five (A6): the roof's small relief: gutters along the eaves (white with rime on the dark side) and a ridge cap
    const t = g.detail(), gut = (x0, z0, x1, z1, y) => t.box(Math.min(x0, x1) - 0.07, y - 0.13, Math.min(z0, z1) - 0.07, Math.max(x0, x1) + 0.07, y, Math.max(z0, z1) + 0.07, 'b');
    t.kind(KIND.SMOOTH).color(TRIM);
    if (d.roof === 'front' || d.roof === 'ell') {
      const a = d.roof === 'ell' ? d.side * hw : -hw, b = d.roof === 'ell' ? a - d.side * d.wing : hw, ua = Math.min(a, b), ub = Math.max(a, b), um = (ua + ub) / 2, sl = (d.ridge - d.eave) / (um - ua), ey = d.eave - o * sl;
      gut(ua - o, -dp - o, ua - o, o, ey); gut(ub + o, -dp - o, ub + o, o, ey);
      t.kind(KIND.ROOF, 0.6).color(roofC); t.box(um - 0.15, d.ridge - 0.03, -dp - o - 0.03, um + 0.15, d.ridge + 0.08, o + 0.03, 'b');
    } else if (d.roof === 'hip') {
      const oo = o + 0.15, y = d.eave - 0.12, rl = Math.max(0.4, (2 * hw - dp) / 2 + 0.6), wm = -dp / 2;
      gut(-hw - oo, oo, hw + oo, oo, y); gut(-hw - oo, -dp - oo, hw + oo, -dp - oo, y); gut(-hw - oo, -dp - oo, -hw - oo, oo, y); gut(hw + oo, -dp - oo, hw + oo, oo, y);
      t.kind(KIND.ROOF, 0.6).color(roofC); t.box(-rl, d.ridge - 0.03, wm - 0.15, rl, d.ridge + 0.08, wm + 0.15, 'b');
    } else if (d.roof === 'side') {
      const rw = h.kind === 'bung' ? -dp * 0.45 : -dp / 2, yf = h.kind === 'bung' ? d.porchY : d.eave - 0.1;
      gut(-hw - o, d.porchD + o, hw + o, d.porchD + o, yf); gut(-hw - o, -dp - o, hw + o, -dp - o, d.eave - 0.1);
      t.kind(KIND.ROOF, 0.6).color(roofC); t.box(-hw - o - 0.03, d.ridge - 0.03, rw - 0.15, hw + o + 0.03, d.ridge + 0.08, rw + 0.15, 'b');
    }
    // ROUND SIX (D3): NO BLANK WALL NEAR THE LENS: a frieze board under the eaves all round the main block, a board up
    // every corner, two downpipes; on a two-storey house a fire stair on the side wall nearer the line
    {
      const ell = d.roof === 'ell', ea = ell ? d.side * hw : -hw, eb = ell ? ea - d.side * d.wing : hw, a0 = Math.min(ea, eb), a1 = Math.max(ea, eb), ev = d.eave;
      t.kind(KIND.SMOOTH).color(TRIM);
      t.box(a0 - 0.05, ev - 0.42, -dp - 0.05, a1 + 0.05, ev - 0.15, 0.05, 't');
      for (const [cx, sx] of [[a0, -1], [a1, 1]]) for (const [cz, sz] of [[0, 1], [-dp, -1]]) t.box(Math.min(cx + sx * 0.05, cx - sx * 0.13), fl, Math.min(cz + sz * 0.05, cz - sz * 0.13), Math.max(cx + sx * 0.05, cx - sx * 0.13), ev - 0.42, Math.max(cz + sz * 0.05, cz - sz * 0.13), 'tb');
      t.kind(KIND.SMOOTH, 0.8).color('#59646a');
      t.tube([a1 + 0.11, 0.25, -0.42], [a1 + 0.11, ev - 0.2, -0.42], 0.055, 0.055, 4); t.tube([a0 - 0.11, 0.25, ell ? -0.42 : -dp + 0.42], [a0 - 0.11, ev - 0.2, ell ? -0.42 : -dp + 0.42], 0.055, 0.055, 4);
      if (two || ell) {
        let side = d.side > 0 ? 'r' : 'l';
        if (!ell) { const cr = housePt(h, hw + 4, -dp / 2), cl = housePt(h, -hw - 4, -dp / 2); side = lodDist(cr[0], cr[1]) <= lodDist(cl[0], cl[1]) ? 'r' : 'l'; }
        fireStair(t, wallPt(d, side, 0), dp / 2, y2 - 0.12);
      }
    }
  }
  g.kind(KIND.BRICK).color(BRICKS[Math.floor(r() * 4)]);
  const cu = (r() < 0.5 ? -1 : 1) * hw * 0.45, cw = -dp * r.range(0.35, 0.7); if (lod < 2) g.box(cu - 0.32, d.eave - 0.5, cw - 0.32, cu + 0.32, d.ridge + 0.9, cw + 0.32, 'b');
  return { chimney: [cu, d.ridge + 0.9, cw] };
}
const AWNS = ['#2a4a3a', '#5a2a2a', '#2a3450', '#6a5a3a'];
// PLAIN THINGS IN A DISPLAY WINDOW (round three; round four: LIT THINGS, each glowing in a colour of its own, 4 cm
// before the glowing pane: no flat dark shape), between a0 and a1 on the window's floor y0: a row of table lamps with
// bright shades, stacked boxes in the bulbs' colours, a stand of shelves with jars, two chairs by a standing lamp, bolts of cloth
const THING_COLS = ['#ff5a48', '#58d070', '#5a94ff', '#ffc040', '#ff8ac0', '#fff4dc'];
function shopThings(g, F, a0, a1, y0, what, r) {
  const o = 0.07, q = (x0, ya, x1, yb, dx = 0) => g.quad(F(x0, ya, o), F(x1, ya, o), F(x1 + dx, yb, o), F(x0 + dx, yb, o)), m = (a0 + a1) / 2, w = a1 - a0;
  const lit = (c, s = 0.9) => g.kind(KIND.PANE, 0.55).color(c, s), pick = () => THING_COLS[Math.floor(r() * 6)];   // (class 0.55: a lit thing; no frost fern grows on it)
  if (what === 0) {
    lit('#c08a58', 0.55); q(a0 + 0.15, y0 + 0.5, a1 - 0.15, y0 + 0.56); q(a0 + 0.25, y0, a0 + 0.31, y0 + 0.5); q(a1 - 0.31, y0, a1 - 0.25, y0 + 0.5);
    for (let k = 0; k < 3; k++) { const x = lerp(a0 + 0.45, a1 - 0.45, k / 2), hh = 0.42 + 0.14 * r(); lit('#c08a58', 0.55); q(x - 0.02, y0 + 0.56, x + 0.02, y0 + 0.56 + hh); lit(k === 1 ? '#fff4dc' : pick(), 1); g.quad(F(x - 0.19, y0 + 0.56 + hh, o), F(x + 0.19, y0 + 0.56 + hh, o), F(x + 0.1, y0 + 0.84 + hh, o), F(x - 0.1, y0 + 0.84 + hh, o)); }
  } else if (what === 1) {
    const bw = Math.min(0.5, w / 3.4);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) { const x = m + (k - (2 - row) / 2) * (bw + 0.05) + (r() - 0.5) * 0.05; lit(pick(), 0.85); q(x - bw / 2, y0 + row * 0.42, x + bw / 2, y0 + row * 0.42 + 0.38); }
  } else if (what === 2) {
    // (round seven: the small lit tree is gone: a stand of three shelves with rows of jars in the bulbs' colours)
    lit('#c08a58', 0.55); q(m - 0.62, y0, m - 0.57, y0 + 1.75); q(m + 0.57, y0, m + 0.62, y0 + 1.75);
    for (let row = 0; row < 3; row++) {
      const yb = y0 + 0.3 + row * 0.5; lit('#c08a58', 0.55); q(m - 0.6, yb, m + 0.6, yb + 0.05);
      for (let k = 0; k < 4; k++) { const x = m - 0.42 + k * 0.28 + (r() - 0.5) * 0.04, hh = 0.2 + 0.14 * r(); lit(pick(), 0.9); q(x - 0.09, yb + 0.05, x + 0.09, yb + 0.05 + hh); }
    }
  } else if (what === 3) {
    for (const sg of [-1, 1]) { const x = m + sg * Math.min(0.62, w * 0.24); lit(pick(), 0.75); q(x - 0.24, y0 + 0.44, x + 0.24, y0 + 0.5); q(x - 0.24, y0, x - 0.2, y0 + 0.44); q(x + 0.2, y0, x + 0.24, y0 + 0.44); q(x + sg * 0.2 - 0.03, y0 + 0.5, x + sg * 0.2 + 0.03, y0 + 1.05); q(x + sg * 0.2 - 0.14, y0 + 0.92, x + sg * 0.2 + 0.14, y0 + 1.05); }
    lit('#c08a58', 0.55); q(m - 0.02, y0, m + 0.02, y0 + 1.5); lit('#fff4dc', 1); g.quad(F(m - 0.2, y0 + 1.5, o), F(m + 0.2, y0 + 1.5, o), F(m + 0.11, y0 + 1.8, o), F(m - 0.11, y0 + 1.8, o));
  } else {
    for (let k = 0; k < 4; k++) { const x = lerp(a0 + 0.3, a1 - 0.3, (k + 0.5) / 4), hh = 0.95 + 0.6 * r(), ln = (r() - 0.5) * 0.36; lit(pick(), 0.85); q(x - 0.1, y0, x + 0.1, y0 + hh, ln); g.quad(F(x - 0.13 + ln, y0 + hh, o), F(x + 0.13 + ln, y0 + hh, o), F(x + 0.1 + ln, y0 + hh + 0.09, o), F(x - 0.1 + ln, y0 + hh + 0.09, o)); }
  }
}
// (round eight, B2) AN ANCHOR STORE'S OPEN FRONT AND THE SHOP INSIDE IT. The whole middle of the front (5.4 m wide, 3 m
// tall) is glass in slim casings, with a glazed double door: SEEN DEAD it is dark glass that mirrors the northern
// lights (the pane class 0.1); SEEN ALIVE (through the door-sized leaf that stands before it) the glass is not there
// and the eye looks INTO A LIT SHOP with its own depth: a wooden floor, shelves of goods along the back wall, a table
// of goods, a counter, two hanging lamps. Plain forms in flat warm light (panes that glow: the class 0.3); nothing
// lettered.
function shopInside(g, h, hw, H, r) {
  const ow = 2.7, oh = 3.05, fl = 0.17, rx = Math.min(3.6, hw - 0.5), rz = -5.2, ry = 3.25, pick = () => THING_COLS[Math.floor(r() * 6)];
  const wall = (a0, y0, a1, y1) => g.quad([a0, y0, 0], [a1, y0, 0], [a1, y1, 0], [a0, y1, 0]);
  g.kind(KIND.BRICK).color(BRICKS[h.brick]); wall(-hw, 0, -ow, H); wall(ow, 0, hw, H); wall(-ow, oh, ow, H); wall(-ow, 0, -0.85, 0.6); wall(0.85, 0, ow, 0.6);
  g.kind(KIND.WALK).color('#6e6c66'); g.quad([-0.85, fl, 0], [0.85, fl, 0], [0.85, fl, -0.3], [-0.85, fl, -0.3]);
  // the glass
  g.kind(KIND.PANE, 0.1).color(GLASS, 0);
  wall(-ow, 0.6, -0.85, oh); wall(0.85, 0.6, ow, oh); wall(-0.85, fl, 0.85, oh);
  // its casings: jambs, the door's stiles and middle rail, the transom, the sills
  g.kind(KIND.SMOOTH).color(TRIM);
  const bar = (x0, y0, x1, y1) => g.quad([x0, y0, 0.03], [x1, y0, 0.03], [x1, y1, 0.03], [x0, y1, 0.03]);
  bar(-ow, 0.6, -ow + 0.08, oh); bar(ow - 0.08, 0.6, ow, oh); bar(-0.92, fl, -0.82, oh); bar(0.82, fl, 0.92, oh); bar(-0.03, fl, 0.03, 2.3); bar(-0.82, 2.3, 0.82, 2.4); bar(-ow, oh - 0.08, ow, oh); bar(-ow, 0.56, -0.92, 0.64); bar(0.92, 0.56, ow, 0.64);
  // the room (every face a glowing pane of its own flat colour: the class 0.3)
  const rm = (c, s) => g.kind(KIND.PANE, 0.3).color(c, s), q2 = (x0, y0, x1, y1, z) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
  const topQ = (x0, z0, x1, z1, y) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);   // (z0 the nearer edge: it looks up)
  rm('#7a5a3c', 0.5); topQ(-rx, -0.02, rx, rz, fl);
  rm('#d8a868', 0.7); topQ(-1.3, -1.2, 1.3, -3.3, fl + 0.01);                                        // the lamp's light on the floor
  rm('#e8d8b8', 0.3); g.quad([-rx, ry, rz], [rx, ry, rz], [rx, ry, -0.02], [-rx, ry, -0.02]);         // the ceiling
  rm('#d9b98a', 0.5); q2(-rx, fl, rx, ry, rz);                                                        // the back wall
  rm('#c9a878', 0.42); g.quad([-rx, fl, -0.02], [-rx, fl, rz], [-rx, ry, rz], [-rx, ry, -0.02]); g.quad([rx, fl, rz], [rx, fl, -0.02], [rx, ry, -0.02], [rx, ry, rz]);
  // shelves of goods along the back wall
  for (let row = 0; row < 3; row++) {
    const y = 0.95 + row * 0.62; rm('#5a3a20', 0.4); q2(-rx + 0.3, y, 1.1, y + 0.06, rz + 0.3); topQ(-rx + 0.3, rz + 0.3, 1.1, rz + 0.02, y + 0.06);
    for (let x = -rx + 0.5; x < 0.95; x += 0.42) { const hh = 0.2 + 0.24 * r(), w = 0.13 + 0.05 * r(); rm(pick(), 0.9); q2(x - w, y + 0.06, x + w, y + 0.06 + hh, rz + 0.16); }
  }
  rm('#5a3a20', 0.4); q2(-rx + 0.3, fl, -rx + 0.38, 2.6, rz + 0.3); q2(1.02, fl, 1.1, 2.6, rz + 0.3);
  // a table of goods, left; the counter, right, with a jar and a box on it
  rm('#8a5a30', 0.45); q2(-2.9, fl, -1.5, 0.8, -1.5); g.quad([-1.5, fl, -1.5], [-1.5, fl, -2.5], [-1.5, 0.8, -2.5], [-1.5, 0.8, -1.5]); rm('#c89a60', 0.6); topQ(-2.9, -1.5, -1.5, -2.5, 0.8);
  for (let k = 0; k < 3; k++) { rm(pick(), 0.9); q2(-2.75 + k * 0.42, 0.8, -2.45 + k * 0.42, 1.0 + 0.2 * r(), -1.9); }
  rm('#8a5a30', 0.45); q2(1.5, fl, rx - 0.3, 1.1, -2.6); g.quad([1.5, fl, -3.4], [1.5, fl, -2.6], [1.5, 1.1, -2.6], [1.5, 1.1, -3.4]); rm('#c89a60', 0.6); topQ(1.5, -2.6, rx - 0.3, -3.4, 1.1);
  rm(pick(), 0.9); q2(1.9, 1.1, 2.15, 1.5, -3.0); rm(pick(), 0.9); q2(2.5, 1.1, 2.9, 1.34, -3.0);
  // two hanging lamps: a pale shade on a cord, seen from the front and from either side
  for (const [lx, lz] of [[0, -2.2], [2.3, -3.0]]) {
    rm('#fff0c8', 1); g.quad([lx - 0.38, 2.42, lz], [lx + 0.38, 2.42, lz], [lx + 0.15, 2.76, lz], [lx - 0.15, 2.76, lz]);
    g.quad([lx, 2.42, lz + 0.38], [lx, 2.42, lz - 0.38], [lx, 2.76, lz - 0.15], [lx, 2.76, lz + 0.15]); g.quad([lx, 2.42, lz - 0.38], [lx, 2.42, lz + 0.38], [lx, 2.76, lz + 0.15], [lx, 2.76, lz - 0.15]);
    rm('#3a2c22', 0.3); q2(lx - 0.015, 2.76, lx + 0.015, ry, lz);
  }
  if (_wins) _wins.push([0, 2.2, 0, 1, 5.4, 4, '#ffcf8a']);   // its light lies in a panel on the pavement
}
// A STORE OF MAIN STREET (round three): brick, two or three storeys, each its own: end pilasters, a stepped cornice on
// corbels, a recessed doorway between two tall display windows that hold plain things, rows of upper windows.
// ROUND SIX: ITS SHOP FRONT IS A LIT WINDOW DISPLAY, unlike its neighbours' in colour and warmth (DISPLAYS: amber,
// cream, soft rose, pale green, blue-white, dealt so that no two neighbours share one); about half the stores have a
// row of small coloured lamps along the top of each display; on the dark side the displays are lit at rest
const DISPLAYS = ['#ffb060', '#fff0cf', '#ffb7b0', '#c4f0c0', '#d6e6ff'];
export const displayOf = (h) => DISPLAYS[(((h.k * 2 + h.i * 3 + (h.j === 3 ? 0 : 2)) % 5) + 5) % 5];
function buildStore(g, h, d, r, lod) {
  const hw = d.hw, dp = d.dp, H = h.ridge, F = wallPt(d, 'f', 0), near = lod < 2;
  g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.box(-hw, 0, -dp, hw, H, 0, near ? 'btf' : 'bt');
  g.kind(KIND.ROOF).color('#2a2c30'); g.quad([-hw, H - 0.3, 0], [hw, H - 0.3, 0], [hw, H - 0.3, -dp], [-hw, H - 0.3, -dp]);
  g.kind(KIND.STONE).color('#9a9488'); g.box(-hw, H - 0.55, 0, hw, H + 0.2, 0.32, '');
  if (!near) return {};
  g.box(-hw, H - 0.85, 0, hw, H - 0.55, 0.16, 'tk'); g.box(-hw, 3.35, 0, hw, 3.6, 0.14, '');
  if (lod === 0) for (let x = -hw + 0.5; x < hw - 0.3; x += 1.15) g.box(x - 0.11, H - 1.15, 0, x + 0.11, H - 0.85, 0.2, 'tk');
  // (round eight, B4) the piers at a store's two ends stand 0.26 m proud (they stood 0.13 m)
  g.kind(KIND.BRICK).color(BRICKS[h.brick]); for (const sg of [-1, 1]) g.box(sg > 0 ? hw - 0.42 : -hw, 0, 0, sg > 0 ? hw : -hw + 0.42, H - 0.85, 0.26, 'btk');
  if (h.anchor) shopInside(g, h, hw, H, r);
  else {
  // the front wall in three pieces round the doorway, and the doorway's recess (0.9 m deep, its sides glazed)
  const dw = 0.8, dh = 2.55, bw = -0.9, wall = (a0, y0, a1, y1) => g.quad(F(a0, y0, 0), F(a1, y0, 0), F(a1, y1, 0), F(a0, y1, 0));
  g.kind(KIND.BRICK).color(BRICKS[h.brick]); wall(-hw, 0, -dw, H); wall(dw, 0, hw, H); wall(-dw, dh, dw, H);
  g.kind(KIND.WALK).color('#6e6c66'); g.quad([-dw, 0.17, 0], [dw, 0.17, 0], [0.5, 0.17, bw], [-0.5, 0.17, bw]);
  g.kind(KIND.SMOOTH, 0.5).color(TRIM); g.quad([-dw, dh, 0], [-0.5, dh, bw], [0.5, dh, bw], [dw, dh, 0]);
  g.kind(KIND.SMOOTH).color(DOORS[Math.floor(r() * 4)]); g.quad([-0.5, 0.17, bw], [0.5, 0.17, bw], [0.5, 2.18, bw], [-0.5, 2.18, bw]);
  const lit = 0.5 + 0.3 * r(), disp = displayOf(h), r2 = lotRng(h.seed, 'shop-lamps:' + h.id), lamps = r2() < 0.5;   // every shop window is lit; its ghost glows on the dark side
  g.kind(KIND.PANE, 0.65).color(disp, lit);
  g.quad([-0.5, 2.22, bw], [0.5, 2.22, bw], [0.5, dh, bw], [-0.5, dh, bw]);
  g.quad([-dw, 0.6, 0], [-0.5, 0.6, bw], [-0.5, dh, bw], [-dw, dh, 0]); g.quad([0.5, 0.6, bw], [dw, 0.6, 0], [dw, dh, 0], [0.5, dh, bw]);
  g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.quad([-dw, 0.17, 0], [-0.5, 0.17, bw], [-0.5, 0.6, bw], [-dw, 0.6, 0]); g.quad([0.5, 0.17, bw], [dw, 0.17, 0], [dw, 0.6, 0], [0.5, 0.6, bw]);
  // two tall display windows (0.55 to 2.95 m), a plain thing or two standing in each
  for (const sg of [-1, 1]) {
    const a0 = sg < 0 ? -hw + 0.55 : dw + 0.12, a1 = sg < 0 ? -dw - 0.12 : hw - 0.55;
    g.kind(KIND.PANE, 0.65).color(disp, lit); g.quad(F(a0, 0.55, 0.03), F(a1, 0.55, 0.03), F(a1, 2.95, 0.03), F(a0, 2.95, 0.03));
    g.kind(KIND.STONE).color('#9a9488'); g.box(a0 - 0.08, 0.43, 0, a1 + 0.08, 0.55, 0.12, 'k');
    shopThings(g, F, a0 + 0.1, a1 - 0.1, 0.58, Math.floor(r() * 5), r);
    // (round six) a row of small coloured lamps along the display's top
    if (lamps) for (let x = a0 + 0.22, c = Math.floor(r2() * 6); x < a1 - 0.15; x += 0.3, c++) { g.kind(KIND.PANE, 0.55).color(THING_COLS[c % 6], 1); g.quad(F(x - 0.045, 2.68, 0.08), F(x + 0.045, 2.68, 0.08), F(x + 0.045, 2.77, 0.08), F(x - 0.045, 2.77, 0.08)); }
    if (_wins) _wins.push([(a0 + a1) / 2, 2.2, 0, 1, a1 - a0, 4, disp]);   // its light lies in a panel on the pavement
  }
  }
  // upper storeys (two, or three). ROUND EIGHT (B4: NO FRONT IS A FLAT BOX WITH ONE WINDOW REPEATED): each store has its
  // own upper front by its own dice: plain sashes; broad windows under stone lintels; tall narrow ones under hoods; a
  // wide middle window between two narrow ones; and its own parapet over the cornice: none, a raised middle, a low
  // gable, two end blocks
  const n = Math.max(2, Math.round(h.w / 2.5)), tall = h.three ? 2.1 : Math.min(2.3, H - 6.2), sty = h.anchor || h.w < 7.2 ? 0 : Math.floor(h.litSeed * 97) % 4, par = h.anchor ? 1 : Math.floor(h.litSeed * 131) % 4;
  const upper = (y, th, litP) => {
    if (sty === 0) windowRow(g, F, -hw + 0.6, hw - 0.6, y, n, 0.95, th, r, lod, litP);
    else if (sty === 1) { const m = Math.max(2, n - 1); windowRow(g, F, -hw + 0.7, hw - 0.7, y, m, 1.5, th * 0.86, r, lod, litP); g.kind(KIND.STONE).color('#9a9488'); for (let k = 0; k < m; k++) { const a = lerp(-hw + 0.7, hw - 0.7, (k + 0.5) / m); g.box(a - 0.95, y + th * 0.86 + 0.12, 0, a + 0.95, y + th * 0.86 + 0.36, 0.12, 'k'); } }
    else if (sty === 2) { const m = n + 1; windowRow(g, F, -hw + 0.55, hw - 0.55, y, m, 0.66, th, r, lod, litP); g.kind(KIND.STONE).color('#9a9488'); for (let k = 0; k < m; k++) { const a = lerp(-hw + 0.55, hw - 0.55, (k + 0.5) / m); g.box(a - 0.5, y + th + 0.12, 0, a + 0.5, y + th + 0.28, 0.2, 'k'); } }
    else { addWindow(g, F, 0, y, Math.min(2.6, h.w * 0.3), th, r() < litP ? 0.6 + 0.4 * r() : 0, false, lod); for (const sg of [-1, 1]) addWindow(g, F, sg * (hw * 0.5 + 0.9), y + 0.2, 0.7, th - 0.2, r() < litP ? 0.6 + 0.4 * r() : 0, false, lod); }
  };
  upper(4.6, tall, h.anchor ? 1 : 0.4);
  if (h.three) upper(8.0, Math.min(2.1, H - 9.6), 0.3);
  if (par === 1) { g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.box(-hw * 0.42, H + 0.2, -0.3, hw * 0.42, H + 1.0, 0.16, 'b'); g.kind(KIND.STONE).color('#9a9488'); g.box(-hw * 0.42 - 0.1, H + 1.0, -0.36, hw * 0.42 + 0.1, H + 1.16, 0.26, ''); }
  else if (par === 2) {
    const w2 = hw * 0.6, top = H + 0.2 + w2 * 0.38;
    g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.quad([-w2, H + 0.2, 0.16], [w2, H + 0.2, 0.16], [0.02, top, 0.16], [-0.02, top, 0.16]); g.quad([w2, H + 0.2, -0.2], [-w2, H + 0.2, -0.2], [-0.02, top, -0.2], [0.02, top, -0.2]);
    g.kind(KIND.STONE).color('#9a9488'); g.quad([-w2 - 0.1, H + 0.2, 0.2], [0, top + 0.1, 0.2], [0, top + 0.1, -0.24], [-w2 - 0.1, H + 0.2, -0.24]); g.quad([w2 + 0.1, H + 0.2, -0.24], [0, top + 0.1, -0.24], [0, top + 0.1, 0.2], [w2 + 0.1, H + 0.2, 0.2]);
  }
  else if (par === 3) { g.kind(KIND.STONE).color('#9a9488'); for (const sg of [-1, 1]) g.box(sg > 0 ? hw - 0.7 : -hw, H + 0.2, -0.3, sg > 0 ? hw : -hw + 0.7, H + 0.9, 0.32, 'b'); }
  // the row's end walls face a side street
  for (const [end, west] of [[h.endW, true], [h.endE, false]]) {
    if (!end) continue;
    const side = (h.face[1] > 0) === west ? 'r' : 'l', S = wallPt(d, side, 0), sg = side === 'r' ? 1 : -1, fa = (af) => side === 'r' ? af : dp - af, mid = dp / 2;   // fa: a place on this wall by its metres from the front
    // (round eight, B4: NO FLAT BOX) the end wall carries the front's stone belt and cornice round the corner, and three brick piers
    { const sb = (a0, y0, a1, y1, o) => { g.quad(S(a0, y0, o), S(a1, y0, o), S(a1, y1, o), S(a0, y1, o)); g.quad(S(a0, y1, 0), S(a1, y1, 0), S(a1, y1, o), S(a0, y1, o)); };
      g.kind(KIND.STONE).color('#9a9488'); sb(0, 3.35, dp, 3.6, 0.14); sb(0, H - 0.55, dp, H + 0.2, 0.3);
      g.kind(KIND.BRICK).color(BRICKS[h.brick]);
      for (const a of [0.21, dp / 2, dp - 0.21]) { sb(a - 0.21, 0, a + 0.21, H - 0.55, 0.2); g.quad(S(a + 0.21, 0, 0), S(a + 0.21, H - 0.55, 0), S(a + 0.21, H - 0.55, 0.2), S(a + 0.21, 0, 0.2)); g.quad(S(a - 0.21, 0, 0.2), S(a - 0.21, H - 0.55, 0.2), S(a - 0.21, H - 0.55, 0), S(a - 0.21, 0, 0)); } }
    // (round eight, B4: NO WALL IS A GRID OF ONE WINDOW) the front bay: the shop's side window below, one broad window
    // above; the rear bay: blank brick with a whitewashed panel low on it (an old painted sign, nothing lettered) and,
    // at the upper floor, a door on an iron fire escape: a landing, its rail, a stair down toward the back (on the
    // dead side their tops lie under snow: white steps against the dark wall)
    const fb = mid * 0.5 + 0.1;
    addWindow(g, S, fa(fb), 4.6, 1.5, tall, r() < 0.7 ? 0.6 + 0.4 * r() : 0, false, lod);
    addWindow(g, S, fa(fb), 1.0, Math.min(3.0, mid - 1.4), 1.9, r() < 0.75 ? 0.6 + 0.4 * r() : 0, false, lod);
    if (h.three) addWindow(g, S, fa(fb), 8.0, 1.5, Math.min(2.1, H - 9.6), r() < 0.6 ? 0.6 + 0.4 * r() : 0, false, lod);
    { const a0 = Math.min(fa(mid + 0.8), fa(dp - 1.0)), a1 = Math.max(fa(mid + 0.8), fa(dp - 1.0)); g.kind(KIND.BRICK).color('#c9c2b0'); g.quad(S(a0, 0.9, 0.02), S(a1, 0.9, 0.02), S(a1, 3.0, 0.02), S(a0, 3.0, 0.02)); }
    addDoor(g, S, fa(mid + 1.3), 4.36, r, 1);
    { const x0 = sg * (hw + 0.02), x1 = sg * (hw + 1.0), za = -(mid + 0.5), zb = -(mid + 3.2), ze = -(dp - 0.7), xa = sg * (hw + 0.12), xb = sg * (hw + 0.88);
      const bx = (u0, y0, z0, u1, y1, z1) => g.box(Math.min(u0, u1), y0, Math.min(z0, z1), Math.max(u0, u1), y1, Math.max(z0, z1), '');
      g.kind(KIND.BARK).color('#3a433e'); bx(x0, 4.28, zb, x1, 4.36, za); bx(sg * (hw + 0.95), 5.3, zb, x1, 5.36, za);
      g.quad([xa, 4.36, zb], [xb, 4.36, zb], [xb, 2.3, ze], [xa, 2.3, ze]); g.quad([xb, 4.28, zb], [xa, 4.28, zb], [xa, 2.22, ze], [xb, 2.22, ze]); }
  }
  if (h.three) for (const sd of ['r', 'l']) windowRow(g, wallPt(d, sd, 0), 2.5, dp - 2.5, 9.9, 2, 0.9, Math.min(1.5, H - 10.9), r, 1, 0.7);   // round four: the party walls over a lower neighbour
  // round four: the back wall is no blank block: upper windows, a back door with a lit transom, a ground window or two
  // (round eight, B4: seen from the air the backs are no grids either: windows of their own widths and heights, some
  // left out; a back door; a lean-to under its own low roof, white with snow on the dead side)
  { const Bk = wallPt(d, 'k', 0), nb = Math.max(2, Math.round(h.w / 3.2));
    const row = (y, th, litP) => { for (let k = 0; k < nb; k++) { const a = lerp(-hw + 0.9, hw - 0.9, (k + 0.5) / nb), ww = r.range(0.75, 1.25), wh = th * r.range(0.72, 1), out = r() < 0.3, lit = r() < litP ? 0.6 + 0.4 * r() : 0; if (!out) addWindow(g, Bk, a, y + th - wh, ww, wh, lit, false, lod); } };
    row(4.6, tall, 0.5);
    if (h.three) row(8.0, Math.min(2.1, H - 9.6), 0.4);
    addDoor(g, Bk, hw - 1.6, 0.17, r, 1);
    const lw = Math.min(4.2, h.w * 0.45), l0 = -hw + 0.5, l1 = l0 + lw;
    g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.box(l0, 0, -dp - 2.1, l1, 2.3, -dp, 'btf');
    g.kind(KIND.ROOF).color('#2a2c30'); g.quad([l0 - 0.15, 2.25, -dp - 2.3], [l1 + 0.15, 2.25, -dp - 2.3], [l1 + 0.15, 3.0, -dp], [l0 - 0.15, 3.0, -dp]); }
  // on the flat roof: a stair hatch, a vent stack or two, a skylight (seen from the air over Main Street)
  // (a stream of their own, from the store's name and the store's own dealt number)
  { const rr = makeRng(hashSeed('store-roof:' + h.id + ':' + Math.floor(h.extra * 1e9))), y = H - 0.3;
    const hx = rr.range(-hw + 1.4, hw - 2.4), hz = -rr.range(3, dp - 3); g.kind(KIND.BRICK).color(BRICKS[h.brick]); g.box(hx, y, hz - 1.6, hx + 1.4, y + 2.1, hz, 'b');
    g.kind(KIND.SMOOTH).color('#5a6066'); for (let k = 0; k < 2; k++) { const vx = rr.range(-hw + 0.8, hw - 0.8), vz = -rr.range(1.5, dp - 1.5); g.tube([vx, y, vz], [vx, y + rr.range(0.7, 1.3), vz], 0.22, 0.22, 6, true); }
    const sx = rr.range(-hw + 1, hw - 3), sz = -rr.range(2, dp - 4); g.kind(KIND.PANE).color(GLASS, 0); g.quad([sx, y + 0.35, sz], [sx + 1.8, y + 0.35, sz], [sx + 1.8, y + 0.5, sz - 1.2], [sx, y + 0.5, sz - 1.2]);
    g.kind(KIND.SMOOTH).color('#5a6066'); g.box(sx - 0.06, y, sz - 1.26, sx + 1.86, y + 0.34, sz + 0.06, 'bt'); }
  if (h.canopy) {
    // a cinema's canopy: a blank lit box over the walk, panels and plain shapes only
    g.kind(KIND.SMOOTH).color('#3a3a44'); g.box(-hw + 0.3, 3.7, 0, hw - 0.3, 4.9, 2.8, '');
    g.kind(KIND.PANE, 0.55).color('#ffd9a4', 0.5); g.quad([-hw + 0.5, 3.9, 2.83], [hw - 0.5, 3.9, 2.83], [hw - 0.5, 4.7, 2.83], [-hw + 0.5, 4.7, 2.83]);
  } else if (h.awn) {
    g.kind(KIND.SMOOTH).color(AWNS[Math.floor(h.extra * 4)]);
    g.quad([-hw + 0.3, 2.75, 1.7], [hw - 0.3, 2.75, 1.7], [hw - 0.3, 3.35, 0.05], [-hw + 0.3, 3.35, 0.05]);
    g.quad([hw - 0.3, 2.75, 1.7], [-hw + 0.3, 2.75, 1.7], [-hw + 0.3, 3.3, 0.05], [hw - 0.3, 3.3, 0.05]);
    g.quad([-hw + 0.3, 2.5, 1.7], [hw - 0.3, 2.5, 1.7], [hw - 0.3, 2.75, 1.7], [-hw + 0.3, 2.75, 1.7]);
  }
  return {};
}

// ---------------------------------------------------------------------------------------------- trees
const BARKS = { maple: '#4a4038', elm: '#4e463c', oak: '#40382f' };
const P3 = (a) => [a[0], a[2], -a[1]];
// the wood of one tree (plan skeleton -> tubes). lod 0: round limbs and twigs in every clump; 1: fewer sides, no twigs.
export function buildTree(g, seed, t, sk, lod) {
  g.frame(0, 0, 0, null).kind(KIND.BARK).color(BARKS[t.kind]);
  if (lod >= 2) {
    // far: the trunk and one limb for each bough (lod 3: flat blades), pale against the ground from the air
    const top = sk.segs[0][1];
    g.tube(P3(sk.segs[0][0]), P3(top), t.tr * 1.2, t.tr, lod === 2 ? 4 : 3);
    for (let k = 1; k + 2 < sk.segs.length; k++) {
      const s = sk.segs[k];
      if (s[4] !== 1 || s[0] !== top) continue;
      const e = sk.segs[k + 2][1], w = t.tr * 0.9;
      if (lod === 2) g.tube(P3(top), P3(e), w * 0.6, w * 0.2, 3);
      else { const a = P3(top), b = P3(e); g.quad([a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] + w * 0.3, b[1], b[2]], [b[0] - w * 0.3, b[1], b[2]]); }
    }
    return;
  }
  for (const s of sk.segs) {
    const sides = s[4] === 0 ? (lod ? 6 : 9) : s[4] === 1 ? (lod ? 4 : 6) : (lod ? 3 : 4);
    g.tube(P3(s[0]), P3(s[1]), s[2], s[3], sides);
  }
  if (lod > 0) return;
  const r = lotRng(seed, 'twig:' + t.id);
  g = g.detail().cardsOn(); g.kind(KIND.BARK).color(BARKS[t.kind]);
  for (const c of sk.clumps) {
    for (let k = 0; k < 4; k++) {
      const az = r() * 6.283, el = r.range(-0.3, 1.2), len = c[3] * r.range(0.6, 0.95), a = [c[0], c[1], c[2] - c[3] * 0.2];
      const b = [c[0] + Math.cos(az) * Math.cos(el) * len, c[1] + Math.sin(az) * Math.cos(el) * len, c[2] + Math.sin(el) * len];
      const A = P3(a), B = P3(b), wx = Math.sin(az) * 0.04, wz = Math.cos(az) * 0.04;
      g.quad([A[0] - wx, A[1], A[2] - wz], [A[0] + wx, A[1], A[2] + wz], [B[0] + wx * 0.3, B[1], B[2] + wz * 0.3], [B[0] - wx * 0.3, B[1], B[2] - wz * 0.3]);
    }
  }
  g.cardsOff();
}
// THE LACE of one bare tree (dark side only; round two): fans of fine rimed twigs at every branch end, each a card
// the shader cuts into branching twigs, so that a bare crown stands white and lacy. A fan reaches 1.15 r from its
// clump's middle at most. lod 0: four fans a clump; 1 and 2: two; 3 (the far town): two great fans to a tree.
export function buildLace(g, seed, t, sk, lod, moon = null) {
  const r = lotRng(seed, 'lace:' + t.id), top0 = sk.segs[0][1], mid = [top0[0], top0[1], (top0[2] + t.H) / 2];
  g.frame(0, 0, 0, null).kind(KIND.LACE);
  const fan = (c, s, az, el, roll) => {
    // moon: the plan vector toward the moon [dp, dq, up]: a clump on the crown's moonward side is lit, the far side in shade
    if (moon) { const ox = c[0] - mid[0], oq = c[1] - mid[1], oy = c[2] - mid[2], ol = Math.hypot(ox, oq, oy) || 1; g.shade(clamp(0.5 + 0.62 * (ox * moon[0] + oq * moon[1] + oy * moon[2]) / ol, 0.08, 1)); }
    const ce = Math.cos(el), vx = Math.cos(az) * ce, vy = Math.sin(el), vz = -Math.sin(az) * ce;
    let ax = -vz, ay = 0, az2 = vx; const al = Math.hypot(ax, az2) || 1; ax /= al; az2 /= al;
    const bx = vy * az2 - vz * ay, by = vz * ax - vx * az2, bz = vx * ay - vy * ax, ct = Math.cos(roll), st = Math.sin(roll);
    const ux = (ax * ct + bx * st) * s * 0.5, uy = (ay * ct + by * st) * s * 0.5, uz = (az2 * ct + bz * st) * s * 0.5, cx = c[0], cy = c[2], cz = -c[1];
    g.color('#ffffff', 0.08 + 0.92 * r());   // the slot is the fan's own number; over 0.05 always (under it the shader cuts no twigs)
    g.quad([cx - ux, cy - uy, cz - uz], [cx + ux, cy + uy, cz + uz], [cx + ux + vx * s, cy + uy + vy * s, cz + uz + vz * s], [cx - ux + vx * s, cy - uy + vy * s, cz - uz + vz * s]);
  };
  if (lod >= 3) { const top = sk.segs[0][1], cr = t.H * 0.36, a0 = r() * 6.283; for (let k = 0; k < 2; k++) fan([top[0], top[1], top[2] + (t.H - top[2]) * 0.3], cr * 1.25, a0 + k * 3.1416, 0.4, 0.25); return; }
  const n = lod === 0 ? 4 : 2;
  for (const c of sk.clumps) for (let k = 0; k < n; k++) fan([c[0], c[1], c[2] - c[3] * 0.15], c[3] * 1.15, r() * 6.283, r.range(-0.2, 1.2), r() * 6.283);
}
// THE ICE DRESS of Main Street (dark side only; round two), into the dark copy's own Geo: on each store a load of
// rime lying on the awning (it sags under it) and ICICLES along the awning's edge and the cornice; icicles round the
// bandstand's eave. Icicles are slim cones 0.15 to 0.8 m long that hang straight down from an edge that is itself
// clear of the routes; the count reads them inside their store's box and the bandstand's capsule.
const icicle = (g, r, x, y, z, l0, l1) => { const len = r.range(l0, l1), rad = 0.018 + len * 0.045; g.tube([x, y, z], [x + r.range(-0.015, 0.015), y - len, z], rad, 0.004, 3); };
export function buildStoreIce(g, h, lod, seed) {
  if (h.kind !== 'store' || lod > 1) return;
  const d = houseDims(h), hw = d.hw, H = h.ridge, r = lotRng(seed, 'ice:' + h.id);
  g.frame(h.fp, h.fq, 0, h.face).kind(KIND.LACE).color('#ffffff', 0);
  // the cornice's icicles (its lower front edge 0.32 m out, 0.55 m under the roof line)
  for (let x = -hw + 0.2; x < hw - 0.1; x += r.range(0.35, lod ? 1.3 : 0.75)) icicle(g, r, x, H - 0.55, 0.3, 0.15, 0.7);
  if (h.awn && !h.canopy) {
    // the awning's load of rime: a bulging white slab on it, thickest at its outer edge, hanging over the valance
    const x0 = -hw + 0.26, x1 = hw - 0.26, n = 4, top = (t, k) => [lerp(x0, x1, k / n), lerp(3.42, 2.84, t) - 0.1 * Math.sin(t * 3.1416) + 0.05 * Math.sin(k * 2.1 + t * 4) + (t > 0.9 ? 0.07 : 0), lerp(0.04, 1.74, t)];
    for (let k = 0; k < n; k++) {
      g.quad(top(1, k), top(1, k + 1), top(0.5, k + 1), top(0.5, k)); g.quad(top(0.5, k), top(0.5, k + 1), top(0, k + 1), top(0, k));
      const a = top(1, k), b = top(1, k + 1); g.quad([a[0], 2.62, 1.77], [b[0], 2.62, 1.77], b, a);
    }
    for (let x = x0 + 0.1; x < x1; x += r.range(0.22, lod ? 0.9 : 0.5)) icicle(g, r, x, 2.6, 1.73, 0.12, 0.8);
  }
  if (h.canopy) for (let x = -hw + 0.4; x < hw - 0.4; x += r.range(0.25, 0.6)) icicle(g, r, x, 3.7, 2.75, 0.15, 0.8);
  g.frame(0, 0, 0, null);
}
// MAIN STREET UNDER SNOW (round eight, B4: NO BARE STRIPED ROAD), the dead look's alone (into the blocks' ice dress):
// (1) A BANK OF PLOUGHED SNOW ALONG EACH KERB from the home street's crossing to the plaza: its foot on the roadway
// 4.4 m from the centre line, its lumpy crest 5.1 to 5.8 m from it and 0.45 to 0.95 m high, its back on the walk;
// it sinks to nothing at the side streets, before each open shop front (ANCHORS) and at a path every 40 m, and it is
// lower wherever its crest would stand within 3.4 m of the line. mainBank(sd, p): the crest [lateral, height] at p on
// the side sd (+1 north, -1 south); the count reads the same crests. (2) A DRIFT AGAINST EVERY FRONT between its
// doors, to 0.85 m up the wall and 2 m out. (3) ICICLES under the cap of every dead lamp standard.
let _bankN = null, _bankSeed = null;
const bankNoise = (seed, x, k) => { if (_bankSeed !== seed) { const r = lotRng(seed, 'mainbank'); _bankN = new Float32Array(1024); for (let i = 0; i < 1024; i++) _bankN[i] = r(); _bankSeed = seed; } const i = Math.floor(x), t = x - i, s = t * t * (3 - 2 * t); return lerp(_bankN[(i * 7 + k * 131) & 1023], _bankN[((i + 1) * 7 + k * 131) & 1023], s); };
// THE BANK'S GAPS [from p, to p, side (0: both)]: no bank from 4 m behind the last leaf's plane on (its cross street,
// then the plaza); at the home street's crossing and at each side street (half a metre inside the walks' outer
// edges); a path through it at every second lamp standard (an even pitch); before each open shop front
const BANK_GAPS = [[-1e9, K.RING[0] - 4, 0]];
for (let p = 0; p > K.RING[0]; p -= K.BLOCK) BANK_GAPS.push([p - WALK_OUT + 0.5, p + WALK_OUT - 0.5, 0]);
for (let p = MAIN_POSTS[0] - MAIN_POSTS[1]; p > K.RING[0]; p -= 2 * MAIN_POSTS[1]) BANK_GAPS.push([p - 1.3, p + 1.3, 0]);
for (const a of ANCHORS) BANK_GAPS.push([a.p0 + a.w / 2 - 2.6, a.p0 + a.w / 2 + 2.6, a.north ? 1 : -1]);
export function mainBank(sd, p, seed) {
  let e = 1e9;
  for (const [a, b, s] of BANK_GAPS) { if (s && s !== sd) continue; e = Math.min(e, p < a ? a - p : p > b ? p - b : 0); }
  const t = smoothstep(0, 2.4, e), k = sd > 0 ? 1 : 2, lat = 5.45 + 0.7 * (bankNoise(seed, p / 4.3 + 11, k) - 0.5);
  let h = (0.45 + 0.5 * (0.6 * bankNoise(seed, p / 3.1, k) + 0.4 * bankNoise(seed, p / 1.3 + 40, k + 2))) * t;
  const T = routes().dark;
  while (h > 0.03 && trackDist(T, p, MAIN.q + sd * lat, h + 0.1) < 3.4) h -= 0.1;
  return [lat, Math.max(h, 0)];
}
// a strip of smooth snow through rows of points [x, y, z] (each row the same length), counter-clockwise seen from above
function snowStrip(g, rows) {
  const nr = rows.length, nc = rows[0].length; if (nr < 2) return;
  g._grow(nr * nc, (nr - 1) * (nc - 1) * 6);
  const i0 = g.nv;
  for (let a = 0; a < nr; a++) for (let b = 0; b < nc; b++) {
    const A = rows[Math.max(a - 1, 0)][b], B = rows[Math.min(a + 1, nr - 1)][b], C = rows[a][Math.max(b - 1, 0)], D = rows[a][Math.min(b + 1, nc - 1)];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - C[0], vy = D[1] - C[1], vz = D[2] - C[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } const l = Math.hypot(nx, ny, nz) || 1;
    g.v(rows[a][b][0], rows[a][b][1], rows[a][b][2], nx / l, ny / l, nz / l, b / (nc - 1), (a & 1));
  }
  // (the strip's own turn: its faces look up whichever way its rows and points run)
  const A = rows[0][0], B = rows[1][0], C = rows[0][nc - 1], up = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]) >= 0;
  for (let a = 0; a + 1 < nr; a++) for (let b = 0; b + 1 < nc; b++) { const k = i0 + a * nc + b, k1 = up ? k + nc : k + 1, k3 = up ? k + 1 : k + nc; g.idx[g.ni++] = k; g.idx[g.ni++] = k1; g.idx[g.ni++] = k + nc + 1; g.idx[g.ni++] = k; g.idx[g.ni++] = k + nc + 1; g.idx[g.ni++] = k3; }
}
export function buildMainSnow(g, i, j, houses, posts, seed) {
  const sd = mainRow(i, j, 'S') || mainRow(i, j, 'N'); if (!sd) return;   // (1: the block north of Main Street's axis, -1: south of it)
  const ky = K.KERB, p0 = i * K.BLOCK, p1 = p0 + K.BLOCK;
  g.frame(0, 0, 0, null).kind(KIND.LAWN).color('#2e4a2a');
  // the bank, in runs between its gaps
  let rows = [];
  const flush = () => { if (rows.length > 1) snowStrip(g, rows); rows = []; };
  for (let p = p0; p <= p1 + 0.01; p += 1.6) {
    const [lat, h] = mainBank(sd, p, seed), [, hn] = mainBank(sd, Math.min(p + 1.6, p1), seed), [, hp] = mainBank(sd, Math.max(p - 1.6, p0), seed);
    if (h < 0.03 && hn < 0.03 && hp < 0.03) { flush(); continue; }
    const z = (l) => -(MAIN.q + sd * l), w = 0.55 + 0.5 * h;
    rows.push([[p, 0.03, z(lat - w - 0.5)], [p, 0.62 * h + 0.04, z(lat - 0.5 * w)], [p, h + 0.08, z(lat)], [p, 0.6 * h + 0.14, z(lat + 0.55 * w)], [p, ky + 0.03, z(lat + w + 0.6)]]);
  }
  flush();
  // the drifts against the fronts
  for (const h of houses) {
    if (h.kind !== 'store') continue;
    const hw = h.w / 2, door = h.anchor ? 3.0 : 1.15, r = lotRng(seed, 'drift:' + h.id), ph = r() * 40;
    g.frame(h.fp, h.fq, 0, h.face).kind(KIND.LAWN).color('#2e4a2a');
    for (const sg of [-1, 1]) {
      const x0 = sg * door, x1 = sg * (hw - 0.05), n = Math.max(2, Math.round(Math.abs(x1 - x0) / 1.5)), rw = [];
      for (let k = 0; k <= n; k++) {
        const x = lerp(x0, x1, k / n), t = smoothstep(0, 1.3, Math.abs(x - x0)), hd = (0.22 + 0.63 * bankNoise(seed, x / 2.2 + ph, 5)) * t, rz = 0.5 + 1.5 * bankNoise(seed, x / 2.9 + ph + 9, 6) * (0.4 + 0.6 * t);
        rw.push([[x, hd + ky, 0.03], [x, 0.5 * hd + ky + 0.02, 0.45 * rz + 0.03], [x, ky + 0.03, rz + 0.03]]);
      }
      snowStrip(g, rw);
    }
  }
  // icicles under each lamp standard's cap, and a white cap of snow on it
  g.frame(0, 0, 0, null).kind(KIND.LACE).color('#ffffff', 0);
  for (const o of posts) {
    if (!o.lantern || o.p < p0 || o.p >= p1 || Math.sign(o.q - MAIN.q) !== sd || Math.abs(o.q - MAIN.q) > 12) continue;
    const r = lotRng(seed, 'ice:post:' + o.p + ':' + sd);
    for (let k = 0; k < 7; k++) { const a = (k + r.range(-0.3, 0.3)) / 7 * 6.2832; icicle(g, r, o.p + Math.cos(a) * 0.27, o.h - 0.02, -o.q + Math.sin(a) * 0.27, 0.18, 0.75); }
    g.tube([o.p, o.h + 0.02, -o.q], [o.p, o.h + 0.42, -o.q], 0.34, 0.05, 5);
  }
  g.frame(0, 0, 0, null);
}
// the bank's crests for the count: [p, q, y] each 1.6 m, both sides
export function mainBankCrests(seed) { const out = []; for (const sd of [-1, 1]) for (let p = K.RING[0] - 4; p <= -WALK_OUT + 1; p += 1.6) { const [lat, h] = mainBank(sd, p, seed); if (h > 0.03) out.push([p, MAIN.q + sd * lat, h + 0.08]); } return out; }
// THE WATER TOWER'S ICE (round eight, D1), the dead look's alone: a ragged curtain of long icicles under the tank's
// bowl and under its walk, and shorter ones on the cage's braces
export function buildTowerIce(g, seed) {
  const r = lotRng(seed, 'ice:tower'), S = K.TS, [cp, cq] = K.TOWER;
  g.frame(cp, cq, 0, null).kind(KIND.LACE).color('#ffffff', 0);
  const ic = (x, y, z, l0, l1) => { const len = r.range(l0, l1), rad = 0.05 + len * 0.045; g.tube([x * S, y * S, z * S], [(x + r.range(-0.03, 0.03)) * S, (y - len) * S, z * S], rad * S, 0.01, 3); };
  for (let k = 0; k < 30; k++) { const a = (k + r.range(-0.35, 0.35)) / 30 * 6.2832; ic(Math.cos(a) * 5.45, 24.25, Math.sin(a) * 5.45, 0.8, 3.6); }
  for (let k = 0; k < 22; k++) { const a = (k + r.range(-0.35, 0.35)) / 22 * 6.2832; ic(Math.cos(a) * 6.45, 26.9, Math.sin(a) * 6.45, 0.5, 2.2); }
  for (let k = 0; k < 6; k++) for (const y of [8, 16]) for (let m = 0; m < 3; m++) { const a0 = k / 6 * 6.2832 + 0.3, a1 = (k + 1) / 6 * 6.2832 + 0.3, rr = lerp(6.6, 4.9, y / 24), t = r.range(0.15, 0.85); ic(lerp(Math.cos(a0), Math.cos(a1), t) * rr, y - 0.08, lerp(Math.sin(a0), Math.sin(a1), t) * rr, 0.4, 1.5); }
  g.frame(0, 0, 0, null);
}
export function buildBandstandIce(g, seed) {
  const r = lotRng(seed, 'ice:bandstand');
  g.frame(K.COURT[0], 337, 0, null).kind(KIND.LACE).color('#ffffff', 0);
  for (let k = 0; k < 64; k++) { const a = (k + r.range(-0.3, 0.3)) / 64 * 6.2832; icicle(g, r, Math.cos(a) * 4.95, 3.92, Math.sin(a) * 4.95, 0.15, 0.8); }
  // a white cap of rime on the roof's point and a drift on the floor's edge
  g.tube([0, 5.9, 0], [0, 6.75, 0], 1.0, 0.05, 6); g.tube([0, 1.0, 0], [0, 1.12, 0], 4.62, 4.3, 12);
  g.frame(0, 0, 0, null);
}
// THE LEAVES of one tree (bright side only): sprays of autumn leaves as small cards scattered through every clump, each
// cut into leaves by the shader near the eye. A tree leans to one colour and keeps a dealt share of its leaves (it is
// late October: some crowns are half bare). lod 0: 12 cards a clump, 1: 6 larger, 2: 4 large.
const LEAFC = ['#c8701c', '#e0a83a', '#8a3a1c'], OAKC = ['#c8701c', '#f0d050'];   // (the square's oak: copper and a clear gold, no rust)
export function buildLeaves(g, seed, t, sk, lod) {
  const r = lotRng(seed, 'leaf:' + t.id), keep = r.range(0.5, 1), tone = Math.floor(r() * 3);
  const n = t.great ? 24 : lod === 0 ? 12 : lod === 1 ? 6 : 4, size = t.great ? 2.8 : lod === 0 ? 1.05 : lod === 1 ? 1.6 : 2.1;   // near cards reach 0.95 r + 1.25 m from a clump's middle at most
  g.frame(0, 0, 0, null).kind(KIND.LEAF);
  if (lod >= 3) {
    // (round seven) THE FAR TOWN'S CROWN, seen alive through a great leaf: three great soft sprays to a tree
    const top = sk.segs[0][1], cr = t.H * 0.36, cy = top[2] + (t.H - top[2]) * 0.45, a0 = r() * 6.283;
    for (let k = 0; k < 3; k++) {
      const az = a0 + k * 2.094, ux = Math.cos(az) * cr, uz = -Math.sin(az) * cr, lean = k === 2 ? 0.6 : 0.12, vy = cr * 0.9, ox = -uz * lean, oz = ux * lean;
      g.color(LEAFC[k === 1 ? Math.floor(r() * 3) : tone], 0.49 * r(), r.range(0.6, 1));
      g.quad([top[0] - ux - ox, cy - vy, -top[1] - uz - oz], [top[0] + ux - ox, cy - vy, -top[1] + uz - oz], [top[0] + ux + ox, cy + vy, -top[1] + uz + oz], [top[0] - ux + ox, cy + vy, -top[1] - uz + oz]);
    }
    return;
  }
  for (const c of sk.clumps) {
    for (let k = 0; k < n; k++) {
      const az = r() * 6.283, sinEl = r.range(-0.55, 1), rad = c[3] * Math.cbrt(r()) * 0.95, s = r.range(0.5, 0.9) * size, tilt = r() * 6.283, own = r() < 0.6, ci = Math.floor(r() * 3), gain = r.range(0.55, 1), off = r(), drop = r();
      if (drop > keep && !t.great) continue;
      const cosEl = Math.sqrt(1 - sinEl * sinEl), nx = Math.cos(az) * cosEl, ny = sinEl, nz = -Math.sin(az) * cosEl;
      const cx = c[0] + Math.cos(az) * cosEl * rad, cy = c[2] + sinEl * rad * 0.85, cz = -(c[1] + Math.sin(az) * cosEl * rad);
      // two axes across the card: perpendicular to the outward direction, turned by `tilt`, leaning a little
      let ax = -nz, ay = 0, az2 = nx; const al = Math.hypot(ax, az2) || 1; ax /= al; az2 /= al;
      const bx = ny * az2 - nz * ay, by = nz * ax - nx * az2, bz = nx * ay - ny * ax, ct = Math.cos(tilt), st = Math.sin(tilt);
      const ux = (ax * ct + bx * st) * s, uy = (ay * ct + by * st) * s + nx * 0.2 * s, uz = (az2 * ct + bz * st) * s;
      const vx = (-ax * st + bx * ct) * s * 0.8 + nx * 0.25 * s, vy = (-ay * st + by * ct) * s * 0.8, vz = (-az2 * st + bz * ct) * s * 0.8 + nz * 0.25 * s;
      // (the alpha slot: the spray's own pattern, under a half; a GREAT tree's spray over a half: the shader cuts its
      // larger cards into leaves from as much further off; its clumps are darker below and brighter above: depth)
      g.color(t.great ? OAKC[drop < 0.64 ? 1 : 0] : LEAFC[own ? tone : ci], t.great ? 0.53 + 0.47 * off : 0.49 * off, t.great ? gain * lerp(0.62, 1.12, smoothstep(-0.5, 0.7, sinEl)) : gain);   // (the square's oak: gold in two of three sprays, copper in the rest, no rust)
      g.quad([cx - ux - vx, cy - uy - vy, cz - uz - vz], [cx + ux - vx, cy + uy - vy, cz + uz - vz], [cx + ux + vx, cy + uy + vy, cz + uz + vz], [cx - ux + vx, cy - uy + vy, cz - uz + vz]);
    }
  }
}

// ---------------------------------------------------------------------------------------------- landmarks (each stands once in the plan)
const LIME = '#b8b2a2', STEEL = '#8a969a';
// THE CHURCH: white clapboard, a square bell tower at its front with a slender spire to 30 m. Its front wall stands
// on the front line of its cross street's south side (CHURCH_FQ), its nave 11 m wide and 24 m long behind it, its
// tower before the front. churchBodies: the nave and the spire as [p, q, half width, half length, height] (the
// world casts their moon shadows)
const CHURCH_FQ = K.THIN1[1] - K.FRONT;
export const churchBodies = () => [[K.CHURCH[0], CHURCH_FQ - 12, 5.5, 12, 9], [K.CHURCH[0], CHURCH_FQ + 0.6, 1.5, 1.5, 24]];
export function buildChurch(g, seed) {
  const [cp, fq] = [K.CHURCH[0], CHURCH_FQ], hw = 5.5, dp = 24, wall = PAINTS[0], d = { hw, dp };
  g.frame(cp, fq, 0, [0, 1]).kind(KIND.STONE).color(STONE); g.box(-hw - 0.1, 0, -dp - 0.1, hw + 0.1, 0.8, 0.1, 'bt');
  g.kind(KIND.WALL).color(wall); g.box(-hw, 0.8, -dp, hw, 7, 0, 'bt');
  g.kind(KIND.ROOF).color(ROOFS[0]); roofFront(g, -hw, hw, -dp, 0, 7, 11.6, 0.5, wall);
  const r = lotRng(seed, 'church');
  _panes = [];
  for (const side of ['r', 'l']) { const P = wallPt(d, side, 0); for (let k = 0; k < 5; k++) addWindow(g, P, 3.4 + k * 4.3, 2.4, 1.1, 3.6, 0.5 + 0.3 * r(), false, 0); }
  for (let j = 0; j < _panes.length; j += 5) for (let c = 0; c < 4; c++) _panes[j].tex[(_panes[j + 1] + c) * 4 + 2] = 204;   // (round six) its tall plain windows glow amber at rest
  _panes = null;
  // the tower: square shaft, louvred belfry, spire
  g.kind(KIND.WALL).color(wall); g.box(-2.2, 0, -1.5, 2.2, 15, 2.7, 'b');
  g.kind(KIND.SMOOTH).color(TRIM); g.box(-2.4, 14.6, -1.7, 2.4, 15.1, 2.9, '');
  g.kind(KIND.PANE).color(GLASS, 0);
  for (const [a, b, c, e] of [[-0.8, 2.72, 0.8, 2.72], [2.22, 1.4, 2.22, -0.2], [-2.22, -0.2, -2.22, 1.4]]) g.quad([a, 11, b], [c, 11, e], [c, 13.6, e], [a, 13.6, b]);
  g.kind(KIND.SMOOTH).color(DOORS[2]); g.quad([-0.9, 0.8, 2.72], [0.9, 0.8, 2.72], [0.9, 3.4, 2.72], [-0.9, 3.4, 2.72]);
  g.kind(KIND.PANE).color(AMBER, 0.7); g.quad([-0.5, 5.2, 2.72], [0.5, 5.2, 2.72], [0.5, 7.6, 2.72], [-0.5, 7.6, 2.72]);
  g.kind(KIND.ROOF).color(ROOFS[0]); g.tube([0, 15.1, 0.6], [0, 30, 0.6], 2.6, 0.06, 4);
  // (round six, D2) rime on the spire and the ridge: the spire's top and the ridge's cap are sheet metal in the roof's
  // own colour (on the dark side: furred white); a lantern on an iron arm over the door
  g.kind(KIND.SMOOTH).color(ROOFS[0]); g.tube([0, 24.6, 0.6], [0, 30.06, 0.6], 1.0, 0.07, 4); g.box(-0.2, 11.52, -dp - 0.52, 0.2, 11.7, 0.52, 'b');
  g.kind(KIND.SMOOTH).color('#2e3a36'); g.box(-0.04, 4.42, 2.72, 0.04, 4.49, 3.2, 'bk'); g.tube([0, 4.42, 3.12], [0, 4.56, 3.12], 0.24, 0.03, 4);
  g.kind(KIND.PANE, 0.55).color(AMBER, 0.9); g.tube([0, 3.98, 3.12], [0, 4.42, 3.12], 0.13, 0.21, 4);
  g.kind(KIND.WALK).color('#8a8478'); for (let k = 0; k < 4; k++) g.box(-1.6, 0, 2.7 + k * 0.32, 1.6, 0.8 * (1 - k / 4), 3.02 + k * 0.32, 'bk');
}
export const churchLamp = () => [K.CHURCH[0], CHURCH_FQ + 3.12, 4.2];
// its spire's four edges as strings of bulbs (plan polylines)
export const churchStrings = () => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const c = [K.CHURCH[0], CHURCH_FQ + 0.6]; return [[c[0] + a * 1.8, c[1] + b * 1.8, 15.3], [c[0], c[1], 29.8]]; });
// THE WATER TOWER: a steel tank on six braced legs with a cone cap and a centre riser, TOWER_CAP (38 m) to the cap's
// point before K.TS (the tank's wall: TOWER_TANK).
// ROUND SIX (D1): IT READS WHOLE WHENEVER IT IS SEEN. The legs, the braces and the ladder are dark iron (on the dark
// side: dark with white rime); the tank is pale steel in plates, with dark seams between them and four hoop bands
// (moonlit blue-white on its west side, blue shade on the other); a ladder in a cage climbs THE LEG NEAREST MAIN
// STREET (the way a townsman comes to it); a lantern stands at its foot and one at the cage's head. It is a mesh of
// its own, drawn with the dark side's first things, so that its ring of bulbs never shows without the tank behind it.
// THE LADDER'S LEG IS WORKED OUT, NOT TYPED (r8d, F3): of the six legs (towerLegAt: where each stands round the
// axis), the one whose foot stands nearest Main Street's own stretch (its axis, from MAIN.w to the home street).
// It is read from K.TOWER and MAIN alone: nothing of the line.
const TOWER_LEGS = 6, TOWER_FOOT = 6.6, towerLegAt = (k) => k / TOWER_LEGS * 6.2832 + 0.3;
const TOWER_LEG = (() => {
  let best = 0, least = Infinity;
  for (let k = 0; k < TOWER_LEGS; k++) {
    const a = towerLegAt(k), p = K.TOWER[0] + Math.cos(a) * TOWER_FOOT * K.TS, q = K.TOWER[1] - Math.sin(a) * TOWER_FOOT * K.TS, d = Math.hypot(p - clamp(p, MAIN.w, 0), q - MAIN.q);
    if (d < least) { least = d; best = k; }
  }
  return best;
})();
const TOWER_LADDER = towerLegAt(TOWER_LEG);
export function buildWaterTower(g) {
  const [cp, cq] = K.TOWER, IRON = '#4e5a62', v0 = g.nv;
  g.frame(cp, cq, 0, null).kind(KIND.BARK).color(IRON);
  const leg = (k, y) => { const a = towerLegAt(k), rr = lerp(TOWER_FOOT, 4.9, y / 24); return [Math.cos(a) * rr, y, Math.sin(a) * rr]; };
  for (let k = 0; k < TOWER_LEGS; k++) {
    g.tube(leg(k, 0), leg(k, 24.5), 0.3, 0.26, 5);
    for (const y of [8, 16]) g.tube(leg(k, y), leg(k + 1, y), 0.1, 0.1, 3);
    for (const [y0, y1] of [[0, 8], [8, 16], [16, 24]]) { g.tube(leg(k, y0), leg(k + 1, y1), 0.06, 0.06, 3); g.tube(leg(k + 1, y0), leg(k, y1), 0.06, 0.06, 3); }
  }
  g.kind(KIND.SMOOTH).color(STEEL);
  g.tube([0, 0, 0], [0, 21, 0], 0.9, 0.9, 8);
  // (round eight, D1: ALIVE, THE TOWER IS PAINTED: a cream tank with one broad band of blue under its roof; seen dead it is rime-white all the same)
  g.color('#e6dcc0'); g.tube([0, 20.6, 0], [0, TOWER_TANK[0], 0], 0.9, 5.5, 14); g.tube([0, TOWER_TANK[0], 0], [0, 29.7, 0], 5.5, 5.5, 14);
  g.color('#3f6f9f'); g.tube([0, 29.7, 0], [0, TOWER_TANK[1], 0], 5.5, 5.5, 14);
  g.kind(KIND.ROOF).color('#59646a'); g.tube([0, TOWER_TANK[1], 0], [0, TOWER_CAP, 0], 5.8, 0.05, 14);
  // the plates' seams and the hoop bands
  g.kind(KIND.BARK).color('#34404a');
  for (const y of [24.25, 26.2, 29.7, 31.84]) g.tube([0, y, 0], [0, y + 0.15, 0], 5.57, 5.57, 14);
  for (let k = 0; k < 14; k++) for (const [y0, y1, half] of [[24.4, 26.2, 0], [26.35, 29.7, 1], [29.85, 31.84, 0]]) {
    // (the middle course's seams stand half a plate round from those above and below)
    const a = (k + half * 0.5) / 14 * 6.2832, ox = Math.cos(a), oz = -Math.sin(a), r = half ? 5.40 : 5.535, X = ox * r, Z = oz * r, ux = oz * 0.05, uz = -ox * 0.05;
    g.quad([X - ux, y0, Z - uz], [X + ux, y0, Z + uz], [X + ux, y1, Z + uz], [X - ux, y1, Z - uz]);
  }
  g.kind(KIND.SMOOTH).color('#6a767a'); g.tube([0, 26.9, 0], [0, 27.1, 0], 5.5, 6.5, 14); g.tube([0, 27.1, 0], [0, 26.9, 0], 6.5, 5.5, 14);
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832, b = (k + 1) / 14 * 6.2832, A = [Math.cos(a) * 6.4, 27.1, Math.sin(a) * 6.4], B = [Math.cos(b) * 6.4, 27.1, Math.sin(b) * 6.4]; g.tube(A, [A[0], 28.2, A[2]], 0.04, 0.04, 3); g.tube([A[0], 28.2, A[2]], [B[0], 28.2, B[2]], 0.04, 0.04, 3); }
  // the ladder in its cage, up the outside of one leg to a landing at the rail; ties to the leg
  const al = TOWER_LADDER, er = [Math.cos(al), Math.sin(al)], et = [-Math.sin(al), Math.cos(al)], LR = 7.05;
  const at = (y, t, o) => [er[0] * (LR + o) + et[0] * t, y, er[1] * (LR + o) + et[1] * t];
  g.kind(KIND.BARK).color(IRON);
  for (const s of [-1, 1]) g.tube(at(0, s * 0.23, 0), at(28.3, s * 0.23, 0), 0.04, 0.04, 3);
  for (let y = 0.5; y < 28.2; y += 0.5) g.tube(at(y, -0.23, 0), at(y, 0.23, 0), 0.022, 0.022, 3);
  for (let y = 3.2; y < 28.3; y += 1.75) for (let s = 0; s < 5; s++) { const f0 = s / 5 * 3.1416, f1 = (s + 1) / 5 * 3.1416; g.tube(at(y, 0.4 * Math.cos(f0), 0.42 * Math.sin(f0)), at(y, 0.4 * Math.cos(f1), 0.42 * Math.sin(f1)), 0.022, 0.022, 3); }
  for (const f of [0.7854, 1.5708, 2.3562]) g.tube(at(3.2, 0.4 * Math.cos(f), 0.42 * Math.sin(f)), at(27.7, 0.4 * Math.cos(f), 0.42 * Math.sin(f)), 0.02, 0.02, 3);
  for (const y of [4, 10, 16, 22]) g.tube(leg(TOWER_LEG, y), at(y, 0, 0), 0.035, 0.035, 3);
  g.kind(KIND.SMOOTH).color('#6a767a'); { const a = at(27.0, -0.45, -0.7), b = at(27.0, 0.45, 0.15); g.box(Math.min(a[0], b[0]), 27.0, Math.min(a[2], b[2]), Math.max(a[0], b[0]), 27.1, Math.max(a[2], b[2]), ''); }
  // the two lanterns: one on a short post at the ladder's foot, one on a gooseneck at the cage's head
  for (const [x, y, z] of towerLampsLocal()) {
    g.kind(KIND.SMOOTH).color('#2e3a36');
    if (y < 10) g.tube([x, 0, z], [x, y - 0.25, z], 0.07, 0.05, 4); else { const b = at(28.3, 0.23, 0); g.tube(b, [x, y + 0.3, z], 0.03, 0.03, 3); }
    g.tube([x, y + 0.2, z], [x, y + 0.36, z], 0.27, 0.03, 4);
    g.kind(KIND.PANE, 0.55).color(AMBER, 0.9); g.tube([x, y - 0.25, z], [x, y + 0.2, z], 0.14, 0.23, 4);
  }
  // every measure times K.TS, about the foot of its axis
  for (let i = v0, S = K.TS; i < g.nv; i++) { g.pos[i * 3] = cp + (g.pos[i * 3] - cp) * S; g.pos[i * 3 + 1] *= S; g.pos[i * 3 + 2] = -cq + (g.pos[i * 3 + 2] + cq) * S; }
}
const towerLampsLocal = () => { const al = TOWER_LADDER; return [[Math.cos(al - 0.22) * 8.3, 3.3, Math.sin(al - 0.22) * 8.3], [Math.cos(al) * 7.25 - Math.sin(al) * 0.6, 29.0, Math.sin(al) * 7.25 + Math.cos(al) * 0.6]]; };
// its two lanterns in the plan: [p, q, y]
export const towerLamps = () => towerLampsLocal().map((l) => [K.TOWER[0] + l[0] * K.TS, K.TOWER[1] - l[2] * K.TS, l[1] * K.TS]);
export const towerString = () => { const out = []; for (let k = 0; k <= 28; k++) { const a = k / 28 * 6.2832; out.push([K.TOWER[0] + Math.cos(a) * 6.5 * K.TS, K.TOWER[1] + Math.sin(a) * 6.5 * K.TS, 28.3 * K.TS]); } return [out]; };
// THE COURTHOUSE: limestone, three storeys, a clock tower with a dome to 36 m; four faces with plain ticks and hands
// that stand still at different times (dealt). It faces Main Street across its square.
export function buildCourthouse(g, seed) {
  const [cp, cq] = K.COURT, hw = 15, dp = 20, H = 13, r = lotRng(seed, 'courthouse'), d = { hw, dp };
  g.frame(cp, cq - 10, 0, [0, -1]).kind(KIND.STONE).color('#8a8478'); g.box(-hw - 0.4, 0, -dp - 0.4, hw + 0.4, 1.4, 0.4, 'b');
  g.color(LIME); g.box(-hw, 1.4, -dp, hw, H, 0, 'bt'); g.box(-5, 1.4, 0, 5, H + 0.6, 2.2, 'bk');
  g.color('#a39d8e'); g.box(-hw - 0.5, H, -dp - 0.5, hw + 0.5, H + 0.9, 0.5, 'b'); g.box(-5.4, H + 0.6, -0.2, 5.4, H + 1.3, 2.6, 'b');
  g.kind(KIND.ROOF).color('#3a4046'); roofHip(g, -hw, hw, -dp, 0, H + 1.6, H + 4.2, 0.2);
  g.kind(KIND.STONE).color(LIME); g.tri([-5.4, H + 1.3, 2.6], [5.4, H + 1.3, 2.6], [0, H + 3.6, 2.6]);
  for (let k = 0; k < 4; k++) g.tube([-3.6 + k * 2.4, 1.4, 2.9], [-3.6 + k * 2.4, H - 0.6, 2.9], 0.42, 0.36, 8);
  g.kind(KIND.WALK).color('#8a8478'); for (let k = 0; k < 5; k++) g.box(-5.5, 0, 2.2 + k * 0.4 + 0.9, 5.5, 1.4 * (1 - k / 5), 2.6 + k * 0.4 + 0.9, 'bk');
  const F = wallPt(d, 'f', 0), Rw = wallPt(d, 'r', 0), Lw = wallPt(d, 'l', 0), Bk = wallPt(d, 'k', 0);
  for (let fl = 0; fl < 3; fl++) {
    const y = 2.6 + fl * 3.6;
    for (const [a0, a1] of [[-hw + 1, -5.6], [5.6, hw - 1]]) windowRow(g, F, a0, a1, y, 3, 1.25, 2.3, r, 0, 0);
    windowRow(g, F, -3.8, 3.8, y + (fl ? 0 : 9), fl ? 3 : 0, 1.25, 2.3, r, 0, 0);
    windowRow(g, Rw, 1.5, dp - 1.5, y, 5, 1.25, 2.3, r, 1, 0); windowRow(g, Lw, 1.5, dp - 1.5, y, 5, 1.25, 2.3, r, 1, 0); windowRow(g, Bk, -hw + 1.5, hw - 1.5, y, 8, 1.25, 2.3, r, 1, 0);
  }
  g.kind(KIND.SMOOTH).color(DOORS[2]); g.quad([-1.2, 1.4, 2.23], [1.2, 1.4, 2.23], [1.2, 4.6, 2.23], [-1.2, 4.6, 2.23]);
  // the clock tower over the middle: square shaft, four faces, an eight-sided lantern, the dome and its finial
  const tz = -dp / 2, ty = H + 3.2;
  g.kind(KIND.STONE).color(LIME); g.box(-3.6, ty, tz - 3.6, 3.6, 25, tz + 3.6, 'b'); g.color('#a39d8e'); g.box(-4, 24.6, tz - 4, 4, 25.4, tz + 4, '');
  for (let s = 0; s < 4; s++) {
    const a = s * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), at = (x, y, o) => [x * ca + (3.62 + o) * sa, y, tz - x * sa + (3.62 + o) * ca];
    g.kind(KIND.SMOOTH).color('#d8d2c0');
    for (let k = 0; k < 12; k++) { const b0 = k / 12 * 6.2832, b1 = (k + 1) / 12 * 6.2832; g.tri(at(0, 21.2, 0.05), at(Math.cos(b0) * 1.7, 21.2 + Math.sin(b0) * 1.7, 0.05), at(Math.cos(b1) * 1.7, 21.2 + Math.sin(b1) * 1.7, 0.05)); }
    g.color('#1c1e22');
    for (let k = 0; k < 12; k++) { const b = k / 12 * 6.2832, c = Math.cos(b), sn = Math.sin(b), w = 0.05; g.quad(at(c * 1.3 + sn * w, 21.2 + sn * 1.3 - c * w, 0.08), at(c * 1.6 + sn * w, 21.2 + sn * 1.6 - c * w, 0.08), at(c * 1.6 - sn * w, 21.2 + sn * 1.6 + c * w, 0.08), at(c * 1.3 - sn * w, 21.2 + sn * 1.3 + c * w, 0.08)); }
    for (const [len, w] of [[1.25, 0.06], [0.85, 0.09]]) { const b = r() * 6.2832, c = Math.cos(b), sn = Math.sin(b); g.quad(at(sn * w, 21.2 - c * w, 0.1), at(c * len + sn * w, 21.2 + sn * len - c * w, 0.1), at(c * len - sn * w, 21.2 + sn * len + c * w, 0.1), at(-sn * w, 21.2 + c * w, 0.1)); }
  }
  g.kind(KIND.STONE).color(LIME); g.tube([0, 25.4, tz], [0, 28.6, tz], 3.1, 3.0, 8);
  // (round six, F4) THE LANTERN UNDER THE DOME IS LIT: a tall pane in each of its eight sides
  g.kind(KIND.PANE, 0.55).color(AMBER, 0.9);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832, ox = Math.cos(a), oz = -Math.sin(a), X = ox * 2.87, Z = tz + oz * 2.87, ux = oz * 0.62, uz = -ox * 0.62; g.quad([X - ux, 26.0, Z - uz], [X + ux, 26.0, Z + uz], [X + ux, 28.2, Z + uz], [X - ux, 28.2, Z - uz]); }
  g.kind(KIND.ROOF).color('#4a565a');
  let pr = 3.3, py = 28.6; for (let k = 1; k <= 5; k++) { const a = k / 5 * Math.PI / 2, nr = 3.3 * Math.cos(a), ny = 28.6 + 4.4 * Math.sin(a); g.tube([0, py, tz], [0, ny, tz], pr, Math.max(nr, 0.25), 12); pr = nr; py = ny; }
  g.kind(KIND.SMOOTH).color('#9a9a8a'); g.tube([0, 33, tz], [0, 36, tz], 0.22, 0.03, 5);
}
// the dome's ribs and the cornice as strings of bulbs (plan polylines)
export function courthouseStrings() {
  const [cp, cq] = K.COURT, out = [], y = 13.95;
  out.push([[cp - 15.5, cq - 10.5 + 0, y], [cp + 15.5, cq - 10.5, y]]); out.push([[cp - 15.5, cq + 10.5, y], [cp - 15.5, cq - 10.5, y]]); out.push([[cp + 15.5, cq - 10.5, y], [cp + 15.5, cq + 10.5, y]]);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832, line = []; for (let t = 0; t <= 5; t++) { const b = t / 5 * Math.PI / 2; line.push([cp + Math.cos(a) * 3.4 * Math.cos(b), cq + Math.sin(a) * 3.4 * Math.cos(b), 28.7 + 4.45 * Math.sin(b)]); } out.push(line); }
  return out;
}
// the bandstand on the square: an eight-sided roof on posts over a raised floor
export function buildBandstand(g) {
  g.frame(K.COURT[0], 337, 0, null).kind(KIND.WALK).color('#8a8478'); g.tube([0, 0, 0], [0, 1, 0], 4.6, 4.5, 8, true);
  g.kind(KIND.SMOOTH).color(TRIM);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832, x = Math.cos(a) * 4.1, z = Math.sin(a) * 4.1; g.tube([x, 1, z], [x, 4, z], 0.1, 0.1, 4); const b = (k + 1.5) / 8 * 6.2832; if (k !== 2) g.tube([x, 1.9, z], [Math.cos(b) * 4.1, 1.9, Math.sin(b) * 4.1], 0.05, 0.05, 3); }
  g.kind(KIND.ROOF).color(ROOFS[1]); g.tube([0, 3.9, 0], [0, 6.3, 0], 5, 0.1, 8);
}
// (round six, F4) THE BANDSTAND IS STRUNG: a string of bulbs round its eave and four up its roof to the peak (plan polylines)
export function bandstandStrings() {
  const c = [K.COURT[0], 337], out = [[]];
  for (let k = 0; k <= 8; k++) { const a = k / 8 * 6.2832; out[0].push([c[0] + Math.cos(a) * 5.05, c[1] + Math.sin(a) * 5.05, 3.84]); }
  for (let k = 0; k < 4; k++) { const a = k / 4 * 6.2832; out.push([[c[0] + Math.cos(a) * 4.9, c[1] + Math.sin(a) * 4.9, 4.02], [c[0] + Math.cos(a) * 0.25, c[1] + Math.sin(a) * 0.25, 6.36]]); }
  return out;
}
// THE GREAT TREE IS THE SQUARE'S OAK (round seven, C5): NOT A SPRUCE, NO STAR, NO TIERS, NO BAUBLES. The town's
// greatest tree: a bur oak 28 m tall whose crown reaches 17 to 19 m from its trunk, on the round plaza behind the last
// leaf. THE CURE OF ROUND EIGHT (A2): IT STANDS ASIDE. It stood on Main Street's axis 19 m behind the last leaf's plane
// and filled the leaf with one mass. It now stands on the square's NORTH SIDE, OAK_ASIDE m north of the axis and 30 m
// behind the leaf's plane (level with the plaza's middle, its plinth whole on the paving), so that the leaf holds the
// living street's night sky above, the oak on the north side with its inner boughs reaching to the axis, the square's
// strings to either side of the ring, and the square's lanterns and the houses beyond it below. (A verge's row of
// street trees stands 6 m from the axis; at 6 m this crown would still fill the leaf, so the oak stands on the square,
// at 16.) One skeleton (the same on every seed): a trunk 2.2 m thick that forks 7 m up into nine great crooked
// boughs, each with three or four branches. LIVING (seen through the last leaf): gold in two sprays of three and
// copper in the rest, no rust (OAKC); bulbs wound up its trunk and out along its great boughs like the street's trees,
// leaves falling. DEAD (outside the leaf's outline): bare, every bough and twig a white feather of rime against the
// northern lights.
const OAK_ASIDE = 16;
export const OAK = { id: 'great-oak', kind: 'oak', p: K.PLAZA[0], q: K.PLAZA[1] + OAK_ASIDE, H: 28, tr: 1.1, cr: 15, street: true, lit: true, great: true };
let _oak = null;
// (one tree on every seed: EVERY_SEED)
export const oakSkeleton = () => _oak || (_oak = treeSkeleton(EVERY_SEED, OAK));
// two benches on the courthouse square's street edge (the market stalls of round five are gone)
export function buildSquareBenches(g) { for (const p of [-128.5, -111.5]) buildBench(g, p, 331.2, [0, -1]); g.frame(0, 0, 0, null); }
// THE PLAZA (round five): a round paved place of 26 m radius about K.PLAZA, where Main Street ends beyond the second
// thin place: three rings of flags, a low stone plinth round the great tree's foot, six benches facing the tree
// (PLAZA_BENCHES, 6.5 m about the tree's foot: all on the paving); eight lantern posts stand round it (PLAZA_LAMPS:
// among the street's posts)
export const PLAZA_LAMPS = [28, 66, 114, 152, -28, -66, -114, -152].map((deg) => { const a = deg * Math.PI / 180; return { p: K.PLAZA[0] + 22 * Math.cos(a), q: K.PLAZA[1] + 22 * Math.sin(a), h: 5.2, r: 0.1, rr: 0.6, lantern: true, sd: deg > 0 ? 1 : -1 }; });
export const PLAZA_BENCHES = [0, 70, 110, 180, -45, -135].map((deg) => { const a = deg * Math.PI / 180; return { p: OAK.p + 6.5 * Math.cos(a), q: OAK.q + 6.5 * Math.sin(a), face: [-Math.cos(a), -Math.sin(a)] }; });
function buildBench(g, p, q, face) {
  g.frame(p, q, 0, face).kind(KIND.SMOOTH).color('#2a3a30');
  g.box(-0.9, K.KERB + 0.42, -0.25, 0.9, K.KERB + 0.48, 0.25, ''); g.box(-0.9, K.KERB + 0.48, -0.25, 0.9, K.KERB + 0.92, -0.19, 'b');
  for (const u of [-0.8, 0.8]) g.box(u - 0.04, K.KERB, -0.22, u + 0.04, K.KERB + 0.42, 0.22, 'bt');
  g.frame(0, 0, 0, null);
}
export function buildPlaza(g) {
  const [cp, cq, R] = K.PLAZA, y = K.KERB + 0.03, rings = [0, 6, 13, 20, R], n = 28, at = (r, a) => [r * Math.cos(a), y, -r * Math.sin(a)];
  g.frame(cp, cq, 0, null);
  for (let a = 0; a < rings.length - 1; a++) {
    g.kind(KIND.WALK, 0.86 + 0.07 * (a % 2)).color(a % 2 ? '#7d776e' : '#6f6a62');
    for (let k = 0; k < n; k++) {
      const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, r0 = rings[a], r1 = rings[a + 1];
      if (a === 0) g.tri([0, y, 0], at(r1, a0), at(r1, a1)); else g.quad(at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1));
    }
  }
  g.frame(OAK.p, OAK.q, 0, null).kind(KIND.STONE).color(STONE); g.tube([0, 0, 0], [0, 0.6, 0], 4.3, 4.1, 14, true);
  g.frame(0, 0, 0, null);
  for (const b of PLAZA_BENCHES) buildBench(g, b.p, b.q, b.face);
}
// THE HORIZON IS A PLACE (round six). Beyond the town's edge the moonlit snowfields run to a clear horizon line, and on
// them stand, dealt by the seed: dark HEDGE AND FENCE LINES along the quarter-mile grid; a few STRAIGHT ROADS out of
// town with a lamp far apart; SIX FARMS (a house with a warm window or two, a dark barn, a silo, a windbreak of
// slim poplars, a yard lamp); TWO GRAIN ELEVATORS (rows of concrete silos 34 m tall with a head house, the first by a
// railway), tall dark shapes with a lamp at the head. Returns what the world lights and shades:
// { lamps: [[p, q, y]], wins: [[p, q, y, dp, dq]], shades: [[p, q, hw, hl, H]] } (hw across p, hl along q).
export function buildHorizon(g, seed) {
  const r = lotRng(seed, 'horizon'), out = { lamps: [], wins: [], shades: [] };
  g.frame(0, 0, 0, null);
  const elevator = (p, q, alongP, n) => {
    g.kind(KIND.BARK).color('#3c3c40');   // (a tall dark shape: dark, rime on its lee side only)
    for (let k = 0; k < n; k++) { const a = (k - (n - 1) / 2) * 11.4, x = p + (alongP ? a : 0), z = -(q + (alongP ? 0 : a)); g.tube([x, 0, z], [x, 34, z], 5.6, 5.6, 10, true); }
    const hl = n * 5.7 + 1;
    if (alongP) { g.box(p - hl, 34, -q - 4.5, p + hl, 38, -q + 4.5, 'b'); g.box(p - 6, 38, -q - 5, p + 6, 50, -q + 5, 'b'); g.box(p + hl + 3, 0, -q - 5, p + hl + 15, 42, -q + 5, 'b'); }
    else { g.box(p - 4.5, 34, -q - hl, p + 4.5, 38, -q + hl, 'b'); g.box(p - 5, 38, -q - 6, p + 5, 50, -q + 6, 'b'); g.box(p - 5, 0, -q - hl - 15, p + 5, 42, -q - hl - 3, 'b'); }
    out.lamps.push([p, q, 51.3]); out.shades.push([p, q, alongP ? hl : 5.6, alongP ? 5.6 : hl, 36]);
  };
  elevator(-446, 778, true, 9); elevator(-1080, 590, false, 7);
  g.kind(KIND.WALK).color('#3a3c40'); g.quad([-900, 0.5, -762], [100, 0.5, -762], [100, 0.5, -766], [-900, 0.5, -766]);
  // the farms
  const farm = (p, q) => {
    const hx = p, hz = -q, bx = p + (r() < 0.5 ? -1 : 1) * (22 + r() * 8), bz = -(q + (r() - 0.5) * 20), sx = bx + (r() < 0.5 ? -9.5 : 9.5), sz = bz + (r() - 0.5) * 10;
    g.kind(KIND.WALL).color('#b9b4a6'); g.box(hx - 4.5, 0, hz - 3.75, hx + 4.5, 5.6, hz + 3.75, 'bt');
    g.tri([hx - 4.5, 5.6, hz - 3.75], [hx - 4.5, 5.6, hz + 3.75], [hx - 4.5, 8.4, hz]); g.tri([hx + 4.5, 5.6, hz + 3.75], [hx + 4.5, 5.6, hz - 3.75], [hx + 4.5, 8.4, hz]);
    g.kind(KIND.ROOF).color('#2c2f36');
    g.quad([hx - 4.9, 5.4, hz + 4.2], [hx + 4.9, 5.4, hz + 4.2], [hx + 4.9, 8.5, hz], [hx - 4.9, 8.5, hz]); g.quad([hx + 4.9, 5.4, hz - 4.2], [hx - 4.9, 5.4, hz - 4.2], [hx - 4.9, 8.5, hz], [hx + 4.9, 8.5, hz]);
    // a warm window or two on the wall turned to the town
    const tp = -100 - p, tq = 300 - q, two = r() < 0.6;
    if (Math.abs(tp) > Math.abs(tq)) { const s = Math.sign(tp); out.wins.push([p + s * 4.62, q - 1.8, 1.9, s, 0]); if (two) out.wins.push([p + s * 4.62, q + 1.6, 4.3, s, 0]); }
    else { const s = Math.sign(tq); out.wins.push([p - 2.2, q + s * 3.87, 1.9, 0, s]); if (two) out.wins.push([p + 2.0, q + s * 3.87, 4.3, 0, s]); }
    // the barn: a dark gambrel roof on dark walls
    g.kind(KIND.WALL).color('#3a1a16'); g.box(bx - 5.5, 0, bz - 8.5, bx + 5.5, 6, bz + 8.5, 'bt');
    for (const e of [1, -1]) {
      const z = bz + e * 8.5, A = [bx - 5.5, 6, z], B = [bx + 5.5, 6, z], C = [bx + 3, 9, z], D = [bx - 3, 9, z], E = [bx, 10.6, z];
      if (e > 0) { g.tri(A, B, C); g.tri(A, C, D); g.tri(D, C, E); } else { g.tri(B, A, C); g.tri(C, A, D); g.tri(C, D, E); }
    }
    g.kind(KIND.ROOF).color('#24262c');
    for (const s of [1, -1]) {
      const a = [bx + s * 5.8, 5.8, bz + s * 8.9], b = [bx + s * 5.8, 5.8, bz - s * 8.9], c = [bx + s * 3, 9, bz - s * 8.9], d = [bx + s * 3, 9, bz + s * 8.9], e = [bx, 10.7, bz - s * 8.9], f = [bx, 10.7, bz + s * 8.9];
      g.quad(a, b, c, d); g.quad(d, c, e, f);
    }
    // the silo and its dome
    g.kind(KIND.WALL).color('#9a968c'); g.tube([sx, 0, sz], [sx, 15, sz], 2.7, 2.7, 8); g.kind(KIND.ROOF).color('#5a5c62'); g.tube([sx, 15, sz], [sx, 17, sz], 2.75, 0.5, 8, true);
    // the windbreak: a row of slim poplars to the north-west of the yard (round seven: they were spruces)
    const wn = 5 + Math.floor(r() * 3), wq = q + 16 + r() * 6, wh = [];
    g.kind(KIND.BARK).color('#2e2a1e', 0);
    for (let k = 0; k < wn; k++) { const x = p - 20 + k * 6.5 + (r() - 0.5) * 2, h = 9 + r() * 4; wh.push(h); g.tube([x, 0, -wq], [x, 1.6, -wq], 0.22, 0.2, 4); g.tube([x, 1.4, -wq], [x, h * 0.45, -wq], 0.5, 1.45, 6); g.tube([x, h * 0.45, -wq], [x, h, -wq], 1.45, 0.25, 6); }
    // the yard lamp on its pole
    const lx = (hx + bx) / 2, lq = q - 7;
    g.kind(KIND.SMOOTH).color('#5a5650'); g.tube([lx, 0, -lq], [lx, 7, -lq], 0.11, 0.08, 4);
    out.lamps.push([lx, lq, 7.1]);
    out.shades.push([p, q, 4.5, 3.75, 7], [bx, -bz, 5.5, 8.5, 8.5], [sx, -sz, 2.7, 2.7, 16], [p - 20 + (wn - 1) * 3.25, wq, wn * 3.25, 2.2, 10]);
  };
  for (const [fp, fq] of [[150, 1010], [-330, 1090], [-780, 900], [-930, 240], [930, 430], [610, 930]]) farm(fp + (r() - 0.5) * 120, fq + (r() - 0.5) * 120);
  // hedge and fence lines along the quarter-mile grid (none inside the town)
  for (let a = -2200; a <= 2200; a += 400) for (let b = 0; b < 2400; b += 400) {
    for (const ns of [true, false]) {
      // ns: a line along q at p = a + 200, from q = b; else a line along p at q = b + 200, from p = a
      const pm = ns ? a + 200 : a + 200, qm = ns ? b + 200 : b + 200, roll = r(), t0 = 0.04 + r() * 0.3, t1 = 0.96 - r() * 0.3, h = roll < 0.42 ? 2.2 + r() * 1.4 : 1.15, w = roll < 0.42 ? 1.5 : 0.22;
      if (Math.hypot(pm, qm) < 840 || Math.abs(pm) > 2300 || roll > 0.78) continue;
      g.kind(KIND.WALL).color(roll < 0.42 ? '#2a2a22' : '#4a463c');
      if (ns) { const p0 = a + 200, q0 = b + 400 * t0, q1 = b + 400 * t1; g.box(p0 - w, 0, -q1, p0 + w, h, -q0, 'b'); out.shades.push([p0, (q0 + q1) / 2, w, (q1 - q0) / 2, h]); }
      else { const q0 = b + 200 + (ns ? 0 : 40), p0 = a + 400 * t0, p1 = a + 400 * t1; g.box(p0, 0, -q0 - w, p1, h, -q0 + w, 'b'); out.shades.push([(p0 + p1) / 2, q0, (p1 - p0) / 2, w, h]); }
    }
  }
  // the straight roads out of town (packed snow, on the plan's own lattice), each with a lamp far apart
  g.kind(KIND.ROAD).color('#15161a');
  const road = (p0, q0, p1, q1) => {
    const ns = p0 === p1, y = 0.1;
    if (ns) g.quad([p0 - 4.5, y, -q0], [p0 + 4.5, y, -q0], [p0 + 4.5, y, -q1], [p0 - 4.5, y, -q1]); else g.quad([p0, y, -(q0 - 4.5)], [p1, y, -(q0 - 4.5)], [p1, y, -(q0 + 4.5)], [p0, y, -(q0 + 4.5)]);
    const len = ns ? q1 - q0 : p1 - p0;
    for (let s = 130, k = 0; s < len - 40; s += 240, k++) { const sd = (k & 1) ? 5.6 : -5.6; out.lamps.push(ns ? [p0 + sd, q0 + s, 8] : [p0 + s, q0 + sd, 8]); }
  };
  road(0, 640, 0, 2500); road(-400, 600, -400, 2500); road(-2500, MAIN.q, -640, MAIN.q); road(640, MAIN.q, 2500, MAIN.q); road(-2500, 1200, 2500, 1200);
  g.kind(KIND.SMOOTH).color('#5a5650');
  for (const l of out.lamps) if (l[2] === 8) g.tube([l[0], 0, -l[1]], [l[0], 8, -l[1]], 0.12, 0.09, 4);
  return out;
}

// ---------------------------------------------------------------------------------------------- the street's standing things
// Lamp masts with their arms and cobra heads, the slim posts that carry the strings, the wooden poles with crossarms,
// drum transformers and three wires. keep(p, q): whether the thing stands on this Geo's side of the plane.
export function buildStreetThings(g, lamps, posts, pw, keep, strings = null, far = null) {
  g.frame(0, 0, 0, null);
  for (const l of lamps) {
    if (!keep(l.p, l.q)) continue;
    if (far && far(l.p, l.q)) { g.frame(0, 0, 0, null).kind(KIND.SMOOTH).color('#59646a'); g.tube([l.p, 0, -l.q], [l.p, 8.4, -l.q], 0.12, 0.08, 3); g.tube([l.p, 8.25, -l.q], [l.hp, 8.34, -l.hq], 0.06, 0.2, 3); continue; }   // round four (room): far off, a mast and its arm
    const onPole = pw.poles.some((o) => Math.abs(o.p - l.p) < 0.5 && Math.abs(o.q - l.q) < 0.5), dl = Math.hypot(l.hp - l.p, l.hq - l.q) || 1;
    g.frame(0, 0, 0, null).kind(KIND.BARK).color('#4a545a');   // (round eight, C2: dark iron)
    if (!onPole) { g.tube([l.p, 0, -l.q], [l.p, 8.4, -l.q], 0.11, 0.07, 5); g.tube([l.p, 0, -l.q], [l.p, 0.5, -l.q], 0.2, 0.13, 6); }
    g.tube([l.p, 8.25, -l.q], [l.hp, 8.34, -l.hq], 0.05, 0.045, 4);
    g.kind(KIND.SMOOTH);
    g.frame(l.hp, l.hq, 8.2, [(l.hp - l.p) / dl, (l.hq - l.q) / dl]).color('#3e464c');
    g.quad([-0.17, 0.02, -0.5], [0.17, 0.02, -0.5], [0.2, 0.02, 0.28], [-0.2, 0.02, 0.28]).quad([-0.17, 0.02, -0.5], [-0.2, 0.02, 0.28], [-0.12, 0.2, 0.2], [-0.08, 0.16, -0.5]);
    g.quad([0.2, 0.02, 0.28], [0.17, 0.02, -0.5], [0.08, 0.16, -0.5], [0.12, 0.2, 0.2]).quad([-0.12, 0.2, 0.2], [0.12, 0.2, 0.2], [0.08, 0.16, -0.5], [-0.08, 0.16, -0.5]).quad([-0.2, 0.02, 0.28], [0.2, 0.02, 0.28], [0.12, 0.2, 0.2], [-0.12, 0.2, 0.2]);
    g.quad([-0.2, 0.02, 0.28], [0.2, 0.02, 0.28], [0.17, 0.02, -0.5], [-0.17, 0.02, -0.5]);
  }
  g.frame(0, 0, 0, null).kind(KIND.SMOOTH).color('#6a786f');
  for (const o of posts) {
    if (!keep(o.p, o.q)) continue;
    if (!o.lantern) { g.kind(KIND.BARK).color('#3a433e'); g.tube([o.p, 0, -o.q], [o.p, o.h, -o.q], o.r, o.r * 0.75, 4); continue; }   // (round eight, C2: a dark post: seen dead it is dark iron, rimed on its windward side)
    if (far && far(o.p, o.q)) { g.kind(KIND.SMOOTH).color('#2e3a36'); g.tube([o.p, 0, -o.q], [o.p, o.h - 0.55, -o.q], 0.12, 0.07, 3); g.kind(KIND.PANE, 0.55).color(AMBER, 0.9); g.tube([o.p, o.h - 0.55, -o.q], [o.p, o.h - 0.02, -o.q], 0.14, 0.24, 4); continue; }   // round five (room): far off, a shaft and its lantern
    // a lamp post of Main Street: fluted foot, slim shaft, a four-paned lantern under a cap
    g.kind(KIND.BARK).color('#2e3a36'); g.tube([o.p, 0, -o.q], [o.p, 0.9, -o.q], 0.2, 0.12, 6); g.tube([o.p, 0.9, -o.q], [o.p, o.h - 0.55, -o.q], 0.085, 0.07, 5);   // (round eight, C2: dark iron)
    g.kind(KIND.SMOOTH); g.tube([o.p, o.h - 0.02, -o.q], [o.p, o.h + 0.3, -o.q], 0.3, 0.03, 4, true);
    g.kind(KIND.PANE, 0.55).color(AMBER, 0.9); g.tube([o.p, o.h - 0.55, -o.q], [o.p, o.h - 0.02, -o.q], 0.14, 0.24, 4);
  }
  // each string over a street hangs on a thin dark wire (round three: separate bulbs on a wire, no line of light)
  if (strings) { g.kind(KIND.SMOOTH).color('#14161a'); for (const st of strings) { const m = st.pts[st.pts.length >> 1]; if (!keep(m[0], m[1])) continue; for (let i = 0; i + 2 < st.pts.length; i += 2) g.tube([st.pts[i][0], st.pts[i][2] + 0.06, -st.pts[i][1]], [st.pts[i + 2][0], st.pts[i + 2][2] + 0.06, -st.pts[i + 2][1]], 0.012, 0.012, 3); } }
  for (const o of pw.poles) {
    if (!keep(o.p, o.q)) continue;
    if (far && far(o.p, o.q)) { g.kind(KIND.BARK).color('#4a3c30'); g.tube([o.p, 0, -o.q], [o.p, o.h, -o.q], 0.18, 0.13, 3); const ya = o.h - 0.55; if (o.along) g.box(o.p - 0.07, ya - 0.07, -o.q - 1.05, o.p + 0.07, ya + 0.07, -o.q + 1.05, 'fk'); else g.box(o.p - 1.05, ya - 0.07, -o.q - 0.07, o.p + 1.05, ya + 0.07, -o.q + 0.07, 'lr'); continue; }
    g.kind(KIND.BARK).color('#4a3c30'); g.tube([o.p, 0, -o.q], [o.p, o.h, -o.q], 0.17, 0.12, 6, true);
    const y = o.h - 0.55;
    if (o.along) g.box(o.p - 0.06, y - 0.06, -o.q - 1.05, o.p + 0.06, y + 0.06, -o.q + 1.05, '');
    else g.box(o.p - 1.05, y - 0.06, -o.q - 0.06, o.p + 1.05, y + 0.06, -o.q + 0.06, '');
    if (o.trans) {
      const tp = o.p + (o.along ? 0.45 : 0), tq = o.q + (o.along ? 0 : 0.45);
      g.kind(KIND.SMOOTH).color('#6a7276'); g.tube([tp, o.h - 2.7, -tq], [tp, o.h - 1.8, -tq], 0.27, 0.27, 7, true); g.tube([tp, o.h - 2.69, -tq], [tp, o.h - 2.7, -tq], 0.27, 0.27, 7, true);
    }
  }
}

const carCabin = (kind) => kind === 'sedan' ? [0.95, 0.3, -1.05, -1.6] : kind === 'wagon' ? [1.1, 0.45, -2.2, -2.45] : kind === 'pickup' ? [1.0, 0.5, -0.45, -0.55] : [2.3, 1.75, -2.36, -2.4];
// cars (our own plain shapes: a boxy sedan, a long wagon, a pickup, a van; no badge, no plate), drives, mailboxes,
// hydrants. keep(p, q): whether the thing stands on this Geo's side of the plane.
function buildCar(g, c, far = false) {
  const { hl, hw, kind } = c, body = CAR_PAINTS[c.paint], y0 = kind === 'pickup' || kind === 'van' ? 0.42 : 0.3, belt = kind === 'van' ? 1.05 : kind === 'pickup' ? 1.02 : 0.88, top = c.y1;
  g.frame(c.p, c.q, 0, c.dir).kind(KIND.SMOOTH).color(body);
  g.box(-hw, y0, -hl, hw, belt, hl, '');
  // the cabin: windscreen, roof, back light and two sides (zf0 front foot, zf1 front top, zr1 rear top, zr0 rear foot);
  // near, its sides lean in to a narrower roof (tw), as a car's do
  const [zf0, zf1, zr1, zr0] = carCabin(kind);
  const cw = hw - 0.09, tw = far ? cw : cw - 0.13, A = [-cw, belt, zf0], B = [cw, belt, zf0], C = [tw, top, zf1], D = [-tw, top, zf1], E = [-tw, top, zr1], F = [tw, top, zr1], G = [cw, belt, zr0], H = [-cw, belt, zr0];
  g.quad(D, C, F, E);
  g.kind(KIND.PANE, 0.4).color(GLASS, 0); g.quad(A, B, C, D); g.quad(G, H, E, F);   // (shade slot under 0.6: no room behind this glass: it never lights)
  const sideGlass = kind === 'van' ? 0.3 : 1, zm = lerp(zf1, zr1, sideGlass), zmb = lerp(zf0, zr0, sideGlass);
  g.quad(B, [cw, belt, zmb], [tw, top, zm], C); g.quad([-cw, belt, zmb], A, D, [-tw, top, zm]);
  if (sideGlass < 1) { g.kind(KIND.SMOOTH).color(body); g.quad([cw, belt, zmb], G, F, [tw, top, zm]); g.quad(H, [-cw, belt, zmb], [-tw, top, zm], E); }
  if (kind === 'pickup') { g.kind(KIND.SMOOTH).color(body); g.box(-hw, belt, -hl, hw, belt + 0.28, -0.6, 'b'); g.color('#15171a'); g.quad([-hw + 0.1, belt + 0.285, -0.7], [hw - 0.1, belt + 0.285, -0.7], [hw - 0.1, belt + 0.285, -hl + 0.1], [-hw + 0.1, belt + 0.285, -hl + 0.1]); }
  g.kind(KIND.SMOOTH).color('#14151a');
  if (far) { g.box(-hw + 0.03, 0.04, -hl * 0.86, hw - 0.03, y0, hl * 0.86, 'bt'); return; }   // round four (room): far off, the dark of its underside stands for the wheels
  // (round eight, E3: A CAR READS AS A CAR, alive or under snow) one that stands within 45 m of a route's line (close)
  // has the pillars between its side windows, in the body's colour, and four wheels that show: a dark arch cut into
  // the flank over each tyre, the tyre a finger proud of it, a pale hub
  if (c.close && (kind === 'sedan' || kind === 'wagon')) {
    g.color(body);
    for (const f of kind === 'wagon' ? [0.35, 0.69] : [0.5]) { const zt = lerp(zf1, zr1, f), zb = lerp(zf0, zr0, f); for (const sx of [-1, 1]) { const a = [sx * (cw + 0.008), belt, zb - 0.05], b = [sx * (cw + 0.008), belt, zb + 0.05], cc = [sx * (tw + 0.008), top, zt + 0.045], d = [sx * (tw + 0.008), top, zt - 0.045]; if (sx > 0) g.quad(b, a, d, cc); else g.quad(a, b, cc, d); } }
  }
  const a0 = Math.asin(clamp((y0 - 0.33) / 0.44, -1, 1));
  for (const sx of [-1, 1]) for (const z of [hl * 0.62, -hl * 0.62]) {
    const x = sx * (hw + 0.01), xh = sx * (hw + 0.046), fan = (xx, cy, rad, b0, b1, n) => { for (let k = 0; k < n; k++) { const a = b0 + (b1 - b0) * k / n, b = b0 + (b1 - b0) * (k + 1) / n, P0 = [xx, cy, z], P1 = [xx, cy + rad * Math.sin(a), z + rad * Math.cos(a)], P2 = [xx, cy + rad * Math.sin(b), z + rad * Math.cos(b)]; if (sx > 0) g.tri(P0, P2, P1); else g.tri(P0, P1, P2); } };
    g.color('#14151a'); g.tube([sx * (hw - 0.3), 0.33, z], [sx * (hw + (c.close ? 0.04 : 0.02)), 0.33, z], 0.33, 0.33, 8, true);
    if (!c.close) continue;
    g.color('#0b0c0f'); fan(x, Math.max(y0, 0.33), 0.44, a0, Math.PI - a0, 5);
    g.color('#9aa0a6'); fan(xh, 0.33, 0.16, 0, 6.2832, 5);
  }
  g.color('#d8d4c0'); for (const sx of [-1, 1]) g.quad([sx * (hw - 0.2) - 0.14, y0 + 0.3, hl + 0.01], [sx * (hw - 0.2) + 0.14, y0 + 0.3, hl + 0.01], [sx * (hw - 0.2) + 0.14, y0 + 0.48, hl + 0.01], [sx * (hw - 0.2) - 0.14, y0 + 0.48, hl + 0.01]);
  g.color('#5a1512'); for (const sx of [-1, 1]) g.quad([sx * (hw - 0.2) + 0.14, y0 + 0.3, -hl - 0.01], [sx * (hw - 0.2) - 0.14, y0 + 0.3, -hl - 0.01], [sx * (hw - 0.2) - 0.14, y0 + 0.46, -hl - 0.01], [sx * (hw - 0.2) + 0.14, y0 + 0.46, -hl - 0.01]);
  g.color('#8a8f94'); g.box(-hw + 0.05, y0 + 0.02, hl, hw - 0.05, y0 + 0.16, hl + 0.1, 'k'); g.box(-hw + 0.05, y0 + 0.02, -hl - 0.1, hw - 0.05, y0 + 0.16, -hl, 'f');
}
// (round eight, E3) A CAR UNDER SNOW, the dead look's alone (into a block's lace Geo): a pillow of snow on its roof, one
// on its bonnet, one on its boot or in its bed: white rounded tops over a dark body with dark glass and four wheels
export function buildCarSnow(g, c) {
  const { hl, hw, kind } = c, belt = kind === 'van' ? 1.05 : kind === 'pickup' ? 1.02 : 0.88, top = c.y1, [zf0, zf1, zr1, zr0] = carCabin(kind), tw = hw - 0.22;
  g.frame(c.p, c.q, 0, c.dir).kind(KIND.LAWN).color('#2e4a2a');
  const pillow = (x, y, z0, z1, hgt) => { const rows = []; for (const [f, k] of [[0, 0.25], [0.5, 1], [1, 0.25]]) { const z = lerp(z0, z1, f); rows.push([[-x - 0.03, y + 0.01, z], [-0.55 * x, y + 0.02 + hgt * k * 0.85, z], [0, y + 0.02 + hgt * k, z], [0.55 * x, y + 0.02 + hgt * k * 0.85, z], [x + 0.03, y + 0.01, z]]); } snowStrip(g, rows); };
  pillow(tw, top, zr1 - 0.04, zf1 + 0.04, 0.13);
  pillow(hw - 0.03, belt, zf0 + 0.12, hl - 0.02, 0.09);
  if (kind === 'sedan') pillow(hw - 0.03, belt, -hl + 0.02, zr0 - 0.12, 0.09);
  if (kind === 'pickup') pillow(hw - 0.12, belt + 0.2, -hl + 0.12, -0.72, 0.1);
  g.frame(0, 0, 0, null);
}
export function buildThings(g, T, keep, far = null) {
  for (const c of T.cars) if (keep(c.p, c.q)) buildCar(g, c, !!(far && far(c.p, c.q)));
  for (const d of T.drives) {
    const h = d.h; if (!keep(h.fp, h.fq)) continue;
    g.frame(h.fp, h.fq, 0, h.face).kind(KIND.WALK).color('#7a766c');
    const u0 = d.u - 1.2, u1 = d.u + 1.2, y = K.KERB + 0.025;
    for (const [w0, w1] of [[-(d.dp || h.dp) * 0.6, 0], [0, 4], [4, 8], [8, 11.45]]) g.quad([u0, y, w1], [u1, y, w1], [u1, y, w0], [u0, y, w0]);
  }
  for (const b of T.boxes) {
    if (!keep(b.p, b.q)) continue;
    if (far && far(b.p, b.q)) continue;
    g.frame(b.p, b.q, 0, b.dir).kind(KIND.BARK).color('#5a4a3a'); g.box(-0.05, 0, -0.05, 0.05, 1.08, 0.05, 'bt');
    g.kind(KIND.SMOOTH).color('#9aa0a4'); g.box(-0.1, 1.08, -0.26, 0.1, 1.24, 0.24, ''); g.tube([0, 1.24, -0.26], [0, 1.24, 0.24], 0.1, 0.1, 5);
  }
  for (const b of T.hydrants) {
    if (!keep(b.p, b.q) || (far && far(b.p, b.q))) continue;
    g.frame(b.p, b.q, K.KERB, null).kind(KIND.SMOOTH).color('#a8281c');
    g.tube([0, 0, 0], [0, 0.52, 0], 0.13, 0.11, 7); g.tube([0, 0.52, 0], [0, 0.68, 0], 0.13, 0.03, 7, true); g.tube([0, 0, 0], [0, 0.06, 0], 0.18, 0.18, 7, true);
    g.tube([-0.2, 0.36, 0], [0.2, 0.36, 0], 0.06, 0.06, 5, true); g.tube([0.2, 0.36, 0], [-0.2, 0.36, 0], 0.06, 0.06, 5, true);
  }
  for (const b of T.barrows || []) {
    if (!keep(b.p, b.q) || (far && far(b.p, b.q))) continue;
    // a wheelbarrow (round five): a tapered tray half full of leaves, one wheel, two handles and legs; a rake leaning in it
    g.frame(b.p, b.q, K.KERB, b.dir).kind(KIND.SMOOTH).color('#3f5a4a');
    const T0 = [[-0.34, 0.62, 0.78], [0.34, 0.62, 0.78], [0.34, 0.62, -0.18], [-0.34, 0.62, -0.18]], B0 = [[-0.2, 0.34, 0.62], [0.2, 0.34, 0.62], [0.2, 0.34, 0.0], [-0.2, 0.34, 0.0]];
    for (let k = 0; k < 4; k++) { const a = k, c = (k + 1) % 4; g.quad(B0[a], B0[c], T0[c], T0[a]); g.quad(B0[c], B0[a], T0[a], T0[c]); }
    g.quad(B0[3], B0[2], B0[1], B0[0]);
    g.kind(KIND.LAWN, 1).color('#7a4a1c', 0, 0.9); g.quad([-0.31, 0.56, 0.746], [0.31, 0.56, 0.746], [0.31, 0.56, -0.142], [-0.31, 0.56, -0.142]);
    g.kind(KIND.SMOOTH).color('#14151a'); g.tube([-0.05, 0.2, 0.95], [0.05, 0.2, 0.95], 0.2, 0.2, 8, true); g.tube([0.05, 0.2, 0.95], [-0.05, 0.2, 0.95], 0.2, 0.2, 8, true);
    g.color('#6a4a2a'); for (const sx of [-1, 1]) { g.tube([sx * 0.08, 0.2, 0.95], [sx * 0.3, 0.36, 0.1], 0.02, 0.02, 4); g.tube([sx * 0.3, 0.36, 0.1], [sx * 0.33, 0.6, -0.8], 0.02, 0.02, 4); g.tube([sx * 0.3, 0.36, 0.0], [sx * 0.3, 0, -0.05], 0.02, 0.02, 4); }
    g.color('#8a6a3a'); g.tube([b.rake * 0.1, 0.5, 0.5], [b.rake * 0.25, 1.45, -0.6], 0.016, 0.016, 4); g.color('#3a3c40'); g.box(b.rake * 0.1 - 0.2, 0.44, 0.48, b.rake * 0.1 + 0.2, 0.5, 0.54, '');
  }
  g.frame(0, 0, 0, null);
}

// ---------------------------------------------------------------------------------------------- the rime's feathers (dark side)
// RIME ICE grows INTO the wind, and the standing wind blows toward a far point in the west (K.WIND): every feather
// points AWAY from it, the same way on every house, turning slowly across the town. Each feather is dealt its dice first (length,
// yaw, lift, roll) and then stands only if its tip keeps the clear air from the dark route. Ten numbers a feather:
// base (build axes), the vector to its tip, roll, plan distance d (for the wave), tint (a bulb colour or -1), a seed.
// stood: the world's own list of each near block's standing trees ([tree, skeleton] in the deal's order, keyed i:j):
// the same trees as the rule gives, not worked out twice
const FROND_AIR = [[0, 0.12], [0.15, 0.2], [0.5, 0.2], [1, 0.2]];   // [place along the frond, air beyond the clear air it keeps there]
export async function dealRime(seed, lamps, street, pw, things, yieldFn, cap = 14000, stat = null, stood = null) {
  // EVERY THING'S FEATHERS COME FROM A STREAM OF ITS OWN (the seed, 'rime:' and the thing's own name: of()): a house,
  // a tree, a mast, a pole, a post, a car, a box, a hydrant, each landmark. Moving the line, or one thing, deals no
  // other thing's feathers anew. (r: the stream of the thing in hand; of() names it before any feather is dealt, and
  // no stream is taken that is not drawn from)
  let r = null;
  const of = (name) => { r = lotRng(seed, 'rime:' + name); };
  const R = routes(), out = [], E = K.WIND, CAP = cap * 10, note = (k) => { if (stat) stat[k] = out.length / 10; };
  // a coarse map of the distance to the dark route (MAP's cells; the route's height over 12 m counts) for the first sieve
  const { C, G0, GN } = MAP, map = new Float32Array(GN * GN).fill(1e9);
  let nt = 0;
  for (const t of R.dark) {
    for (let a = -8; a <= 8; a++) for (let b = -8; b <= 8; b++) {
      const ci = Math.floor((t[0] - G0) / C) + a, cj = Math.floor((t[1] - G0) / C) + b; if (ci < 0 || cj < 0 || ci >= GN || cj >= GN) continue;
      const d = Math.hypot((ci + 0.5) * C + G0 - t[0], (cj + 0.5) * C + G0 - t[1], Math.max(0, t[2] - 12)); if (d < map[cj * GN + ci]) map[cj * GN + ci] = d;
    }
    if (yieldFn && (++nt & 127) === 0) await yieldFn();
  }
  if (yieldFn) await yieldFn();
  const planD = (p, q) => { const ci = Math.floor((p - G0) / C), cj = Math.floor((q - G0) / C); return ci < 0 || cj < 0 || ci >= GN || cj >= GN ? 1e9 : map[cj * GN + ci]; };
  const wind = (p, q) => { const x = p - E[0], y = q - E[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  // (it asks to hand back by the work done: after every 1100 feathers tried, about 5 ms; the engine answers at once while its slice is young)
  let tried = 0, handed = 0; const due = () => yieldFn && tried - handed >= 1100 && ((handed = tried), true), handBack = async () => { if (due()) await yieldFn(); };
  let great = 0;   // (round seven, C3) 2 while the three great things are dealt (the water tower, the spire, the oak): their feathers are a lot of their own, drawn from everywhere on the dead side
  const feather = (p, q, y, l0, l1, tint = -1, lift = 0.22) => {
    tried++;
    const len = r.range(l0, l1), yaw = r.range(-0.36, 0.36), tilt = lift + r.range(-0.25, 0.35), roll = r() * 6.283, sd = r() * 0.999 + great;
    if (q < 0.5 || out.length >= CAP) return;
    const w = wind(p, q), c = Math.cos(yaw), sn = Math.sin(yaw), hl = Math.hypot(1, tilt), dx = (w[0] * c - w[1] * sn) / hl * len, dq = (w[0] * sn + w[1] * c) / hl * len, dy = tilt / hl * len;
    // (round seven: the frond is a card 0.19 m to each side at its broadest: its foot, its broadest place, its middle
    // and its tip all keep the clear air, from the dark line and, where the bright copy shows it, from the bright line)
    const nb = deadB(p, q) && routeNear(p, q) < 14;   // (the bright copy shows the rime in its dead part: DEAD_B)
    if (planD(p, q) < 14 || nb) for (const [f, m] of FROND_AIR) { const fp = p + dx * f, fq = q + dq * f, fy = y + dy * f; if (trackDist(R.dark, fp, fq, fy) < K.CLEAR + m || (nb && trackDist(R.bright, fp, fq, fy) < K.CLEAR + m)) return; }
    out.push(p, y, -q, dx, dy, -dq, roll, Math.abs(p) + Math.abs(q), tint, sd);
  };
  // feathers along a plan polyline of [p, q, y]; lee(p, q): true where the point lies on a thing's lee side (left bare)
  const line = (pts, sp, l0, l1, tint = null, lim = 50, lee = null) => {
    let carry = sp * r(), n = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      for (; carry <= len; carry += sp, n++) {
        const t = carry / len, p = lerp(a[0], b[0], t), q = lerp(a[1], b[1], t);
        if (planD(p, q) > lim || (lee && lee(p, q))) continue;
        feather(p, q, lerp(a[2], b[2], t), l0, l1, tint ? tint[n % tint.length] : -1);
      }
      carry -= len;
    }
  };
  const ring = (p, q, y, rad, n) => { const o = []; for (let k = 0; k <= n; k++) o.push([p + Math.cos(k / n * 6.2832) * rad, q + Math.sin(k / n * 6.2832) * rad, y]); return o; };
  // houses and stores: eaves, gable edges, porch lines (where their bulbs hang) and ridges, on the windward half only
  // (every block of the town that the dark copy holds and whose middle lies within 110 m of the dark line)
  for (let j = Math.max(TOWN.j0, 0); j <= TOWN.j1; j++) for (let i = TOWN.i0; i <= TOWN.i1; i++) {
    if (planD((i + 0.5) * K.BLOCK, (j + 0.5) * K.BLOCK) > 110 || !blockExists(i, j, seed)) continue;
    for (const h of dealBlock(seed, i, j)) {
      const c = housePt(h, 0, -h.dp / 2); if (planD(c[0], c[1]) > 52) continue;
      of('h:' + h.id);
      const w = wind(c[0], c[1]), lee = (p, q) => (p - c[0]) * w[0] + (q - c[1]) * w[1] < -1.2, d = houseDims(h), tint = h.strung ? MIXES[h.mix] : null, T = (pt) => { const x = housePt(h, pt[0], pt[2]); return [x[0], x[1], pt[1]]; };
      for (const ln of houseStrings(h, false)) line(ln.map(T), 1.0, 0.5, 1.5, tint, 44, lee);
      if (d.roof === 'front') line([T([0, d.ridge, 0.4]), T([0, d.ridge, -h.dp - 0.4])], 0.95, 0.5, 1.3, null, 40);
      if (d.roof === 'side') line([T([-d.hw - 0.4, d.ridge, -h.dp * 0.45]), T([d.hw + 0.4, d.ridge, -h.dp * 0.45])], 0.95, 0.5, 1.3, null, 40);
      for (const [u, ww] of [[-d.hw, 0], [d.hw, 0], [-d.hw, -h.dp], [d.hw, -h.dp]]) line([T([u, 0.6, ww]), T([u, d.eave, ww])], 1.1, 0.5, 1.2, null, 34, lee);
      // (round seven) and from every picket fence along a front yard
      if (h.kind !== 'store' && hasFence(seed, h)) line([T([-7.4, 1.1, 6.75]), T([7.4, 1.1, 6.75])], 0.9, 0.5, 0.9, null, 40);
      if (due()) await yieldFn();
    }
    note('H' + i + ':' + j);
    await handBack();
    const have = stood ? stood.get(i + ':' + j) : null;
    for (const e of have || dealTrees(seed, i, j)) {
      const t = have ? e[0] : e;
      if (planD(t.p, t.q) > 30) continue;
      const sk = have ? e[1] : treeSkeleton(seed, t); if (!have && !treeStands(t, sk)) continue;
      of('t:' + t.id);
      const w = wind(t.p, t.q);
      for (const sg of sk.segs) { const o = Math.max(sg[2], sg[3]) * 0.8; line([[sg[0][0] + w[0] * o, sg[0][1] + w[1] * o, sg[0][2]], [sg[1][0] + w[0] * o, sg[1][1] + w[1] * o, sg[1][2]]], sg[4] === 0 ? 0.8 : sg[4] === 1 ? 2.3 : 3.1, 0.5, sg[4] === 0 ? 1.7 : 1.3, null, 34); }
      for (const cl of sk.clumps) if (planD(cl[0], cl[1]) < 24) for (let k = 0; k < 2; k++) feather(cl[0] + r.range(-1, 1) * cl[3] * 0.7, cl[1] + r.range(-1, 1) * cl[3] * 0.7, cl[2] + r.range(-0.6, 0.8) * cl[3], 0.5, 1.2);
      if (due()) await yieldFn();
    }
    note('T' + i + ':' + j);
    await handBack();
  }
  note('blocks');
  // the street's standing things: masts, poles, wires, posts, the strings themselves (each bulb a bud in a ruff)
  for (const l of lamps) { of('lamp:' + l.p + ':' + l.q); line([[l.p, l.q, 0.6], [l.p, l.q, 8.4], [l.hp, l.hq, 8.3]], 0.8, 0.6, 1.6, null, 46); }
  for (const o of pw.poles) { of('pole:' + o.p + ':' + o.q); line([[o.p, o.q, 0.8], [o.p, o.q, o.h]], 0.7, 0.7, 2.0, null, 46); }
  note('masts');
  await handBack();
  // (round seven: the wires and the strings over the streets carry combs of rime, not single feathers: combOf)
  for (const o of street.posts) { of('post:' + o.p.toFixed(2) + ':' + o.q.toFixed(2)); line([[o.p, o.q, 0.5], [o.p, o.q, o.h]], 0.85, 0.6, 1.5, null, 46); }
  note('wires+strings');
  await handBack();
  for (const c of things.cars) if (planD(c.p, c.q) < 46) { of('car:' + c.id); const f = (a, b, y) => [c.p + c.dir[0] * a + c.dir[1] * b, c.q + c.dir[1] * a - c.dir[0] * b, y]; line([f(-c.hl, -c.hw, c.y1 * 0.72), f(c.hl, -c.hw, c.y1 * 0.6), f(c.hl, c.hw, c.y1 * 0.6), f(-c.hl, c.hw, c.y1 * 0.72), f(-c.hl, -c.hw, c.y1 * 0.72)], 0.8, 0.5, 0.9, null, 46); line([f(-c.hl * 0.4, 0, c.y1), f(c.hl * 0.2, 0, c.y1)], 0.7, 0.5, 0.8, null, 46); }
  for (const b of things.boxes) if (planD(b.p, b.q) < 40) { of('box:' + b.p.toFixed(2) + ':' + b.q.toFixed(2)); for (let k = 0; k < 3; k++) feather(b.p, b.q, 0.5 + k * 0.38, 0.5, 0.7); }
  for (const b of things.hydrants) if (planD(b.p, b.q) < 40) { of('hydrant:' + b.p.toFixed(2) + ':' + b.q.toFixed(2)); for (let k = 0; k < 2; k++) feather(b.p, b.q, 0.45 + k * 0.3, 0.5, 0.65); }
  note('things');
  await handBack();
  // the landmarks: the spire, the water tower's rail, legs and cap, the courthouse's cornices and dome, the bandstand
  // (round seven, C3) THE LONGEST FEATHERS, 1.2 to 3 m, stream from the spire, the water tower and the square's oak
  great = 2; of('church');
  for (const ln of churchStrings()) line(ln, 0.8, 1.2, 2.6, null, 400);
  great = 0;
  line([[K.CHURCH[0], 144, 11.6], [K.CHURCH[0], 120, 11.6]], 0.9, 0.5, 1.0, null, 400);
  great = 2; of('tower');
  for (const ln of towerString()) line(ln, 0.8, 1.5, 3.0, null, 400);
  line(ring(K.TOWER[0], K.TOWER[1], 32 * K.TS, 5.8 * K.TS, 24), 0.9, 1.4, 2.8, null, 400);
  line(ring(K.TOWER[0], K.TOWER[1], 24.5 * K.TS, 5.6 * K.TS, 24), 1.3, 1.2, 2.4, null, 400);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + 0.3; line([[K.TOWER[0] + Math.cos(a) * 6.6 * K.TS, K.TOWER[1] - Math.sin(a) * 6.6 * K.TS, 1], [K.TOWER[0] + Math.cos(a) * 4.9 * K.TS, K.TOWER[1] - Math.sin(a) * 4.9 * K.TS, 24 * K.TS]], 1.5, 1.2, 2.4, null, 400); }
  if (yieldFn) await yieldFn();
  {
    const sk = oakSkeleton(), w = wind(OAK.p, OAK.q); of('oak');
    for (const sg of sk.segs) { const o = Math.max(sg[2], sg[3]) * 0.8; line([[sg[0][0] + w[0] * o, sg[0][1] + w[1] * o, sg[0][2]], [sg[1][0] + w[0] * o, sg[1][1] + w[1] * o, sg[1][2]]], sg[4] === 0 ? 0.9 : sg[4] === 1 ? 1.7 : 3.4, sg[4] === 2 ? 0.8 : 1.4, sg[4] === 2 ? 1.8 : 3.0, null, 400); }
    for (const cl of sk.clumps) feather(cl[0] + r.range(-1, 1) * cl[3] * 0.7, cl[1] + r.range(-1, 1) * cl[3] * 0.7, cl[2] + r.range(-0.6, 0.8) * cl[3], 0.9, 2.2);
  }
  great = 0;
  if (yieldFn) await yieldFn();
  of('courthouse');
  for (const ln of courthouseStrings()) line(ln, 0.55, 0.4, 0.8, null, 400);
  for (const [a, b] of [[-3.6, -3.6], [3.6, -3.6], [3.6, 3.6], [-3.6, 3.6]]) line([[K.COURT[0] + a, K.COURT[1] + b, 16.5], [K.COURT[0] + a, K.COURT[1] + b, 25]], 0.6, 0.4, 0.8, null, 400);
  of('bandstand');
  line(ring(K.COURT[0], 337, 3.95, 5, 16), 0.3, 0.5, 1.0, null, 400);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832; line([[K.COURT[0] + Math.cos(a) * 4.1, 337 - Math.sin(a) * 4.1, 1.2], [K.COURT[0] + Math.cos(a) * 4.1, 337 - Math.sin(a) * 4.1, 3.9]], 0.45, 0.4, 0.8, null, 400); }
  note('all');
  return new Float32Array(out);
}

// ---------------------------------------------------------------------------------------------- the signal, fallen leaves, yard things
// THE CROSSING'S HANGING LANTERN (round seven, E3; it was a signal box on two thin wires): A LANTERN HANGS OVER THE
// MIDDLE OF THE CROSSING (0, 80) ON ONE STOUT CABLE SLUNG BETWEEN TWO WOUND CORNER POSTS (the south-west and the
// north-east: masts 8.2 m tall, wound with bulbs to 5.2 m), plainly held; the other two corners carry shorter posts.
// The tent's four strings run from the four posts up to the lantern's cap. Its amber lamp burns steadily. It hangs
// SIGNAL.y0 to SIGNAL.y1 up: both lines pass under it at the streets' height, with 3 m and more of clear air.
export const SIGNAL = { p: CROSS1[0], q: CROSS1[1], y0: 6.5, y1: 7.5, post: 9.2, h: 8.2 };   // (round eight, E1: the corner posts behind the walks, 9.2 m from both centre lines)
export function signalBodies() {
  const S = SIGNAL, out = [{ a: [S.p, S.q, S.y0 + 0.2], b: [S.p, S.q, S.y1 - 0.2], r: 0.42 }];
  {
    // (round eight, E1: THE SPAN CABLE IS GONE: from the bright street it was a taut dark wire 6 m over the road, close before the lens.
    // The lantern hangs where the tent's four strings meet; the four corner posts are alike, 6.1 m)
    for (const sx of [-1, 1]) for (const sq of [-1, 1]) out.push({ a: [S.p + sx * S.post, S.q + sq * S.post, 0], b: [S.p + sx * S.post, S.q + sq * S.post, 6.1], r: 0.1 });
  }
  return out;
}
export function buildSignal(g) {
  const S = SIGNAL, bodies = signalBodies();
  g.frame(0, 0, 0, null).kind(KIND.SMOOTH).color('#2c3a34');
  // (round eight, E1: the cable is a thin dark line against the night, not a pale wire near the lens)
  for (let k = 1; k < bodies.length; k++) { const b = bodies[k], post = b.r > 0.05; if (post) g.kind(KIND.SMOOTH).color('#2c3a34'); else g.kind(KIND.BARK).color('#0e1014'); g.tube([b.a[0], b.a[2], -b.a[1]], [b.b[0], b.b[2], -b.b[1]], post ? b.r : 0.028, post ? b.r * 0.8 : 0.028, post ? 6 : 3); }
  g.kind(KIND.SMOOTH);
  // the lantern: a hanger from the cable, a wide cap, a glass body (amber: lit on the living side, dark glass on the dead), a foot
  g.color('#3a3320'); g.tube([S.p, S.y1 - 0.06, -S.q], [S.p, S.y1 + 0.02, -S.q], 0.05, 0.05, 4); g.tube([S.p, S.y0 + 0.74, -S.q], [S.p, S.y1 - 0.06, -S.q], 0.46, 0.06, 8); g.tube([S.p, S.y0, -S.q], [S.p, S.y0 + 0.12, -S.q], 0.1, 0.26, 8);
  g.kind(KIND.PANE).color(AMBER, 0.9); g.tube([S.p, S.y0 + 0.12, -S.q], [S.p, S.y0 + 0.74, -S.q], 0.24, 0.34, 8);
}
// height of the ground at a plan place (road crown, kerb, lawn, walk)
export const groundY = (p, q) => { const B = K.BLOCK, m = (v) => Math.abs(((v % B) + 1.5 * B) % B - B / 2), a = m(p), b = m(q), h = K.ROAD / 2, w0 = h + K.VERGE; return a < h ? 0.08 * (1 - a / h) : b < h ? 0.08 * (1 - b / h) : (a >= w0 && a <= WALK_OUT) || (b >= w0 && b <= WALK_OUT) ? K.KERB + 0.02 : K.KERB; };
// a raked heap of leaves: a low dome (0.62 rad tall at most) of brown with loose leaves of the three colours lying on it
function leafHeap(g, r, p, q, rad) {
  const y0 = K.KERB, prof = [[1, 0], [0.86, 0.2], [0.6, 0.42], [0.3, 0.56], [0.04, 0.62]];
  g.frame(0, 0, 0, null).kind(KIND.LAWN, 1);
  // (round eight: each band's faces carry their own tilt, so that under the snow the heap is a soft white mound lit from above and no dark crescent on the lawn)
  const ring = (k, s) => { const an = (s / 9) * 6.2832, rr = prof[k][0] * rad; return [p + Math.cos(an) * rr, y0 + prof[k][1] * rad, -(q + Math.sin(an) * rr)]; };
  for (let k = 0; k + 1 < prof.length; k++) { g.color(k % 2 ? '#7a4a1c' : '#6a3c18', 0, 0.9); for (let s = 0; s < 9; s++) g.quad(ring(k, s), ring(k, s + 1), ring(k + 1, s + 1), ring(k + 1, s)); }
  for (let s = 0; s < 9; s++) g.tri(ring(4, s), ring(4, s + 1), [p, y0 + 0.625 * rad, -q]);
  for (let k = 0; k < 46; k++) {
    const a = r() * 6.283, f = Math.sqrt(r()) * 1.12, rr = f * rad, hgt = f >= 1 ? 0 : lerp(0.62, 0, Math.pow(f, 1.6)) * rad, x = p + Math.cos(a) * rr, z = q + Math.sin(a) * rr, y = y0 + hgt + 0.035;
    const yaw = r() * 6.283, size = r.range(0.08, 0.14), c = Math.cos(yaw) * size, sn = Math.sin(yaw) * size, w2 = r.range(0.45, 0.7);
    g.kind(KIND.LITTER, 1).color(LEAFC[Math.floor(r() * 3)], 0, r.range(0.6, 1.1));
    g.quad([x - c, y, -(z - sn)], [x + sn * w2, y + 0.02, -(z + c * w2)], [x + c, y, -(z + sn)], [x - sn * w2, y - 0.01, -(z - c * w2)]);
  }
}
// THE RAKED HEAPS OF THE HOME STREET'S VERGE, dealt here once (the litter builds them, the barrows stand by them):
// one before each lot's front along the home street, from the entry to the cross street of the first thin place: an
// even pitch of one lot's length (K.LOT), each shifted along the street by up to a quarter of a lot either way; on
// the east or the west verge by a draw, on the verge's middle line; 0.7 to 1.1 m in radius. A heap that would not
// keep the clear air + 0.4 m is not raked there. [{ k, p, q, rad, side }]
export function dealHeaps(seed) {
  const out = [], off = K.ROAD / 2 + K.VERGE / 2, lots = Math.round((K.BLOCK - 2 * WALK_OUT) / K.LOT);
  for (let j = 0, k = 0; j < K.THIN1[1] / K.BLOCK; j++) for (let n = 0; n < lots; n++, k++) {
    const rr = lotRng(seed, 'heap:' + k), side = rr() < 0.5 ? -1 : 1, q = j * K.BLOCK + WALK_OUT + (n + 0.5) * K.LOT + rr.range(-K.LOT / 4, K.LOT / 4), rad = rr.range(0.7, 1.1), p = side * off;
    if (boxClear({ p, q, dir: [0, 1], hl: rad, hw: rad, y0: 0, y1: 0.6 }) < K.CLEAR + 0.4) continue;
    out.push({ k, p, q, rad, side });
  }
  return out;
}
// is a round patch (a heap) wholly on grass: on a verge between kerb and walk, or on a lawn inside the walks
const onGrass = (p, q, rad) => [p, q].every((v) => { const d = Math.abs(((v % K.BLOCK) + 1.5 * K.BLOCK) % K.BLOCK - K.BLOCK / 2), k = K.ROAD / 2; return d >= WALK_OUT + rad || (d >= k + rad && d <= k + K.VERGE - rad); });
// FALLEN LEAVES along the home street and the cross street (the same in the plan for both sides: wet leaves on the
// bright side, frozen white on the dark), thickest along the kerbs; and the raked heaps of the verge (dealHeaps).
// THEIR REACH IS BY PLACES: along the home street from the entry to the far walk of the cross street of the first
// thin place; along that cross street from the thin place's plane to the home street's far walk; as many to a metre
// of the one street as of the other. Across a street (LITTER): 46 in 100 lie in the gutter, within a third of the
// half road of the kerb and thicker toward it; 16 in 100 on the verge between kerb and walk; the rest on the roadway.
const LITTER = { gutter: 0.46, verge: 0.16, band: K.ROAD / 6, lip: 0.05 };
export async function buildLitter(g, seed, n = 4200, pick = null, yieldFn = null) {
  // g: one Geo (pick: whether a leaf is kept), or a LIST of Geos (pick: the number of the lot a leaf lies in, -1: none)
  const r = lotRng(seed, 'litter'), many = Array.isArray(g), all = many ? g : [g], lot = (p, q) => many ? g[pick(p, q)] : (!pick || pick(p, q)) ? g : null;
  // (the two reaches in metres: the home street's, the cross street's; the kerb's distance from a street's middle)
  const HOME = K.THIN1[1] + WALK_OUT, CROSS = WALK_OUT - K.THIN1[0], kerb = K.ROAD / 2;
  for (const x of all) x.frame(0, 0, 0, null);
  for (let k = 0; k < n; k++) {
    if (yieldFn && k % 2500 === 2499) await yieldFn();   // (the stream is this function's own: nothing else draws from it meanwhile)
    const home = r() < HOME / (HOME + CROSS), t = r(), u = r(), side = r() < 0.5 ? -1 : 1, v = r(), yaw = r() * 6.283, size = r.range(0.07, 0.13), ci = Math.floor(r() * 3), gain = r.range(0.55, 1.1), w2 = r.range(0.45, 0.7);
    const lat = side * (u < LITTER.gutter ? kerb - LITTER.lip - v * v * LITTER.band : u < LITTER.gutter + LITTER.verge ? kerb + LITTER.lip + v * (K.VERGE - 2 * LITTER.lip) : v * (kerb - 2 * LITTER.lip));
    const p = home ? lat : lerp(K.THIN1[0], WALK_OUT, t), q = home ? lerp(0, HOME, t) : K.THIN1[1] + lat;
    const G = lot(p, q); if (!G) continue;
    const y = groundY(p, q) + 0.012, c = Math.cos(yaw) * size, sn = Math.sin(yaw) * size;
    G.kind(KIND.LITTER, 1).color(LEAFC[ci], 0, gain);
    G.quad([p - c, y, -(q - sn)], [p + sn * w2, y, -(q + c * w2)], [p + c, y, -(q + sn)], [p - sn * w2, y, -(q - c * w2)]);
  }
  const flat = all.map((x) => x.nv);   // (the bake takes these as cards)
  // (each heap's loose leaves from a stream of its own)
  for (const h of dealHeaps(seed)) { const G = lot(h.p, h.q); if (G) leafHeap(G, lotRng(seed, 'heap-leaves:' + h.k), h.p, h.q, h.rad); }
  return many ? flat : flat[0];
}
// THE CORNER LAWN the bright route's turn crosses, all at fixed places of the plan: a low dark hedge that cuts the
// corner off (the sight triangle of a corner lot; it begins north of the corner house's drive; it carries no string:
// bulbs on a dark hedge on a dark lawn read as lamps lying on the grass); raked heaps of leaves; a path of stepping
// stones from the cross street's walk past the lit tree to the house's side. Bodies: hedge boxes
// { p, q, dir, hl, hw, y0, y1 } and heaps [p, q, rad]; the count reads these.
// (corner-local: a metres west of the home street's centre line, b metres south of the cross street's: CL)
const CL = (a, b) => [-a, K.THIN1[1] - b];
export function dealCorner(seed) {
  const r = lotRng(seed, 'corner'), line = [CL(9.8, 23.8), CL(9.8, 19.7), CL(19.7, 9.8), CL(24.4, 9.8)], line2 = [CL(26.6, 9.8), CL(31.5, 9.8)];
  const hedge = [];
  for (const L of [line, line2]) for (let k = 0; k + 1 < L.length; k++) {
    const a = L[k], b = L[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 1.1)), dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    for (let i = 0; i < n; i++) hedge.push({ p: lerp(a[0], b[0], (i + 0.5) / n), q: lerp(a[1], b[1], (i + 0.5) / n), dir, hl: len / n / 2 + 0.12, hw: 0.33 + r.range(-0.04, 0.05), y0: 0, y1: K.KERB + 0.86 + r.range(-0.06, 0.08) });
  }
  const heaps = [];
  // THREE RAKED HEAPS ALONG THE INSIDE OF THE BRIGHT TURN: at the quarter, the half and the three quarters of the
  // turn's quarter circle, each shifted along the arc by a draw of up to a tenth of a quarter either way; a heap's
  // edge stands the clear air + 0.4 m (as every heap) and 0.3 m more inside the line; a heap lies wholly on grass (a
  // verge or the lawn: onGrass), else it is not raked there
  for (let ci = 0; ci < 3; ci++) {
    const rad = r.range(0.6, 0.75), a = (ci + 1 + r.range(-0.1, 0.1)) * Math.PI / 8, rad0 = LINE.BR - (K.CLEAR + 0.4 + 0.3 + rad), hp = -LINE.BR + rad0 * Math.cos(a), hq = K.THIN1[1] - LINE.BR + rad0 * Math.sin(a);
    if (onGrass(hp, hq, rad)) heaps.push([hp, hq, rad, ci]);
  }
  heaps.push([...CL(6.1, 6.6), 0.7, Math.floor(r() * 3)]);
  const stones = [];
  for (let k = 0; k < 20; k++) { const f = k / 19, c = CL(lerp(25.5, 21.2, f), lerp(9.4, 25.8, f)); stones.push([c[0] + (k % 2 ? 0.14 : -0.14) + r.range(-0.05, 0.05), c[1], r() * 0.6]); }
  return { hedge, heaps, stones, rake: [CORNER_TREE[0] - 2.2, CORNER_TREE[1] + 1.6] };
}
export function buildCorner(g, seed) {
  const C = dealCorner(seed), r = lotRng(seed, 'corner-leaves');
  for (const b of C.hedge) { g.frame(b.p, b.q, 0, b.dir).kind(KIND.LAWN, 1).color('#2c5230'); g.box(-b.hw, K.KERB, -b.hl, b.hw, b.y1, b.hl, 'b'); }
  g.frame(0, 0, 0, null);
  for (const h of C.heaps) leafHeap(g, r, h[0], h[1], h[2]);
  // stepping stones
  g.kind(KIND.WALK).color('#8a8478');
  for (const st of C.stones) { const c = Math.cos(st[2]) * 0.3, sn = Math.sin(st[2]) * 0.3, y = K.KERB + 0.03, w2 = 0.7; g.quad([st[0] - c, y, -(st[1] - sn)], [st[0] + sn * w2, y, -(st[1] + c * w2)], [st[0] + c, y, -(st[1] + sn)], [st[0] - sn * w2, y, -(st[1] - c * w2)]); }
  // fallen leaves on the lawn: under the lit tree and along the hedge's foot
  for (let k = 0; k < 900; k++) {
    const tree = r() < 0.45, a = r() * 6.283, rad = Math.sqrt(r()) * 4.2, hb = C.hedge[Math.floor(r() * C.hedge.length)], off = r.range(-1.6, 1.6), al = r.range(-0.6, 0.6);
    const p = tree ? CORNER_TREE[0] + Math.cos(a) * rad : hb.p + hb.dir[0] * al - hb.dir[1] * off, q = tree ? CORNER_TREE[1] + Math.sin(a) * rad : hb.q + hb.dir[1] * al + hb.dir[0] * off;
    const yaw = r() * 6.283, size = r.range(0.07, 0.13), c = Math.cos(yaw) * size, sn = Math.sin(yaw) * size, w2 = r.range(0.45, 0.7), y = K.KERB + 0.014, ci = Math.floor(r() * 3), gain = r.range(0.55, 1.1);
    if (!tree && Math.abs(off) < hb.hw + 0.05) continue;
    if (Math.abs(p) < WALK_OUT + 0.1 || q > K.THIN1[1] - WALK_OUT - 0.1) continue;                // the lawn only (inside the two walks)
    g.kind(KIND.LITTER, 1).color(LEAFC[ci], 0, gain);
    g.quad([p - c, y, -(q - sn)], [p + sn * w2, y, -(q + c * w2)], [p + c, y, -(q + sn)], [p - sn * w2, y, -(q - c * w2)]);
  }
  // and blown out of the lawn across the two walks and the verge where they meet, outside the hedge (under the line)
  for (let k = 0; k < 1800; k++) {
    const a = r.range(4.7, 36), b = r.range(4.7, 28), [p, q] = CL(a, b), yaw = r() * 6.283, size = r.range(0.07, 0.13), w2 = r.range(0.45, 0.7), ci = Math.floor(r() * 3), gain = r.range(0.55, 1.1);
    if (!(b < 9.25 || a < 9.3 || (a + b < 28.7 && a < 19.7))) continue;   // (on the two walks and the verge, and in the corner the hedge cuts off)
    const y = groundY(p, q) + 0.014, c = Math.cos(yaw) * size, sn = Math.sin(yaw) * size;
    g.kind(KIND.LITTER, 1).color(LEAFC[ci], 0, gain);
    g.quad([p - c, y, -(q - sn)], [p + sn * w2, y, -(q + c * w2)], [p + c, y, -(q + sn)], [p - sn * w2, y, -(q - c * w2)]);
  }
  // a rake left leaning by the tree: a handle and a head
  g.kind(KIND.SMOOTH).color('#8a6a3a'); g.tube([C.rake[0], K.KERB, -C.rake[1]], [C.rake[0] + 0.5, 1.55, -C.rake[1] + 0.2], 0.018, 0.018, 4);
  g.color('#3a3c40'); g.box(C.rake[0] - 0.22, K.KERB, -C.rake[1] - 0.03, C.rake[0] + 0.22, K.KERB + 0.07, -C.rake[1] + 0.03, '');
}
// THE FIRST CROSSING'S FOUR CORNERS (round four), all at fixed places of the plan: each corner post of the signal is a
// lamp post (a lantern 5.7 m up) wound with a spiral of bulbs; in each corner yard a low hedge along the walks (one
// leg only where the house's own picket fence runs: the string then lies along the fence's top), wound with a string;
// two raked heaps of leaves. (The lit tree of each corner yard is dealt with the trees.) Corner-local: a metres from
// the home street's centre line, b from the cross street's.
export const CROSS_CORNERS = [[1, -1], [-1, -1], [1, 1], [-1, 1]];   // [side of p, side of q] of the crossing's middle
export function dealCross(seed) {
  const hedge = [], strings = [], heaps = [], spirals = [], lanterns = [], S = SIGNAL;
  for (const [sx, sq] of CROSS_CORNERS) {
    const r = lotRng(seed, 'cross:' + sx + ':' + sq), P2 = (a, b) => [sx * a, S.q + sq * b], [i, j] = blockOf(...P2(WALK_OUT, WALK_OUT));   // (the block this corner belongs to)
    const h = dealBlock(seed, i, j).find((x) => x.cross), fence = h ? hasFence(seed, h) : false;
    const legs = [[P2(9.75, 9.75), P2(14.6, 9.75)]]; if (!fence) legs.push([P2(9.75, 10.5), P2(9.75, 15.2)]);
    for (const [a, b] of legs) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 1.1)), dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], run = [];
      for (let k = 0; k < n; k++) hedge.push({ p: lerp(a[0], b[0], (k + 0.5) / n), q: lerp(a[1], b[1], (k + 0.5) / n), dir, hl: len / n / 2 + 0.12, hw: 0.33 + r.range(-0.04, 0.05), y0: 0, y1: K.KERB + 0.86 + r.range(-0.06, 0.08) });
      for (let s = 0.3; s < len - 0.2; s += 0.6) { const ph = s * 1.1, lat = 0.1 * Math.sin(ph), y = K.KERB + 0.97 + 0.05 * Math.cos(ph * 1.7); run.push([a[0] + dir[0] * s - dir[1] * lat, a[1] + dir[1] * s + dir[0] * lat, y]); }   // (round seven, E1: along the hedge's top, one easy line)
      strings.push({ pts: run, mix: (i + j + 2) % 4 });
    }
    if (fence) { const run = []; for (let s = 0; s <= 6.4; s += 0.32) run.push([sx * 9.25, S.q + sq * (9.6 + s), 1.2 + 0.07 * Math.sin(s * 5.0)]); strings.push({ pts: run, mix: (i + j + 2) % 4 }); }
    heaps.push([...P2(10.5, 17.0), r.range(0.6, 0.75)], [...P2(11.6, 19.2), r.range(0.55, 0.7)]);
    // the corner post: a spiral of bulbs from 0.7 m to 5.2 m, a lantern at 5.7 m
    const pp = [S.p + sx * S.post, S.q + sq * S.post], sp = [];
    for (let k = 0; k <= 108; k++) { const f = k / 108, an = f * 9 * 6.2832; sp.push([pp[0] + Math.cos(an) * 0.15, pp[1] + Math.sin(an) * 0.15, 0.7 + 4.5 * f]); }
    spirals.push({ pts: sp, mix: [1, 3, 2, 0][(i + 1) * 2 + j] });
    lanterns.push([pp[0], pp[1], 5.7]);
  }
  return { hedge, strings, heaps, spirals, lanterns };
}
export function buildCross(g, seed) {
  const C = dealCross(seed), r = lotRng(seed, 'cross-leaves');
  for (const b of C.hedge) { g.frame(b.p, b.q, 0, b.dir).kind(KIND.LAWN, 1).color('#2c5230'); g.box(-b.hw, K.KERB, -b.hl, b.hw, b.y1, b.hl, 'b'); }
  g.frame(0, 0, 0, null);
  for (const h of C.heaps) leafHeap(g, r, h[0], h[1], h[2]);
  // the lanterns on the corner posts: a four-paned lantern under a cap
  for (const l of C.lanterns) {
    g.kind(KIND.SMOOTH).color('#2e3a36'); g.tube([l[0], l[2] + 0.28, -l[1]], [l[0], l[2] + 0.58, -l[1]], 0.3, 0.03, 4, true); g.tube([l[0], l[2] - 0.34, -l[1]], [l[0], l[2] - 0.26, -l[1]], 0.2, 0.2, 4, true);
    g.kind(KIND.PANE, 0.55).color(AMBER, 0.9); g.tube([l[0], l[2] - 0.26, -l[1]], [l[0], l[2] + 0.28, -l[1]], 0.16, 0.25, 4);
  }
}
export const fenceBox = (h) => { const c = housePt(h, 0, 6.75); return { p: c[0], q: c[1], dir: h.face, hl: 0.1, hw: 7.5, y0: 0, y1: 1.15 }; };
// a house's yard dice, read in this one place: pumpkins by the steps and how many, a picket fence, a porch swing and
// its side
const yardDeal = (seed, h) => { const r = lotRng(seed, 'yardthings:' + h.id); return { pump: r() < 0.5, np: 1 + Math.floor(r() * 2.4), fence: r() < 0.28, swing: r() < 0.3, sw: r() < 0.5 ? -1 : 1 }; };
// a dealt fence stands if it keeps the clear air and 0.4 m from both lines, and if no point of it lies within the
// bright turn's radius and a walk's width of the turn's centre (round eight, E2: the turning line sweeps round those
// yards, and a fence there would be passed end-on as a fragment)
const turnSweeps = (b) => { const cp = -LINE.BR, cq = K.THIN1[1] - LINE.BR, dp = cp - b.p, dq = cq - b.q, a = dp * b.dir[0] + dq * b.dir[1], c = dp * b.dir[1] - dq * b.dir[0]; return Math.hypot(Math.max(Math.abs(a) - b.hl, 0), Math.max(Math.abs(c) - b.hw, 0)) < LINE.BR + 2 * K.WALK; };
export const hasFence = (seed, h) => h.kind !== 'store' && yardDeal(seed, h).fence && !turnSweeps(fenceBox(h)) && boxClear(fenceBox(h)) >= K.CLEAR + 0.4;
// things about the near houses: pumpkins by the porch steps, a picket fence along some front yards (the porch swing
// is a mover: buildSwing)
export function buildYard(g, seed, h) {
  const { pump, np, sw } = yardDeal(seed, h), d = houseDims(h);
  if (h.kind === 'store') return;
  g.frame(h.fp, h.fq, 0, h.face);
  if (pump && d.porchD > 0) for (let k = 0; k < np; k++) {
    const u = -sw * (d.hw - 0.7 - k * 0.5), w = d.porchD - 0.35 - (k % 2) * 0.3, rad = 0.15 + 0.05 * ((k * 7) % 3) / 2, y = d.floor + 0.02;
    g.kind(KIND.SMOOTH).color('#d8701c'); g.tube([u, y, w], [u, y + rad * 0.75, w], rad * 0.55, rad, 6); g.tube([u, y + rad * 0.75, w], [u, y + rad * 1.45, w], rad, rad * 0.3, 6, true);
    g.color('#3a4a22'); g.tube([u, y + rad * 1.45, w], [u + 0.02, y + rad * 1.75, w], 0.02, 0.015, 3);
  }
  if (hasFence(seed, h)) {
    // pickets cut by the shader; two faces; a gap for the path to the door
    const w = 6.75, top = K.KERB + 0.95;
    g.kind(KIND.FENCE).color(TRIM, 0.24);
    for (const [u0, u1] of [[-7.4, -0.9], [0.9, 7.4]]) { g.quad([u0, K.KERB, w], [u1, K.KERB, w], [u1, top, w], [u0, top, w]); g.quad([u1, K.KERB, w], [u0, K.KERB, w], [u0, top, w], [u1, top, w]); }
  }
  g.frame(0, 0, 0, null);
}

// THE PORCH SWING (it sways): on the houses the yard's dice give one, built into the movers' Geo: a seat and a back on two chains from the porch's ceiling, swaying about its hooks
export function buildSwing(g, seed, h, list) {
  const { swing, sw } = yardDeal(seed, h), d = houseDims(h);
  if (h.kind === 'store' || !swing || !(d.porchD > 2) || h.kind === 'ell') return;
  const u = sw * (d.hw - 1.5), w = d.porchD * 0.5, y = d.floor + 0.48, n0 = g.nv;
  g.frame(h.fp, h.fq, 0, h.face);
  g.kind(KIND.SMOOTH).color(TRIM); g.box(u - 0.7, y, w - 0.22, u + 0.7, y + 0.05, w + 0.22, ''); g.box(u - 0.7, y + 0.05, w - 0.22, u + 0.7, y + 0.5, w - 0.17, 'b');
  g.color('#22252a'); for (const e of [-0.68, 0.68]) g.tube([u + e, y + 0.3, w], [u + e, d.porchY - 0.05, w], 0.012, 0.012, 3);
  g.frame(0, 0, 0, null);
  const c = housePt(h, u, w), c1 = housePt(h, u + 1, w), ph = lotRng(seed, 'swing:' + h.id)();
  list.push([n0, g.nv, c[0], d.porchY - 0.05, -c[1], c1[0] - c[0], 0, -(c1[1] - c[1]), 0, 0.12 + 0.08 * ph, 2.2, ph * 6.283]);
}
// A WEATHERVANE (round seven, F: it turns) on the ridge of about one house in five (not a store; a roof with a ridge):
// a rod 1.9 m tall with a ball and two cross arms (no letters), and over them a white-painted arrow 1.9 m long with a broad tail
// that points into the standing wind and turns to and fro. It stands only where its top keeps 4.2 m from both routes.
export function vaneOf(seed, h) {
  if (h.kind === 'store') return null;
  const r = lotRng(seed, 'vane:' + h.id), dealt = r() < 0.22, ph = r() * 6.283, d = houseDims(h), wv = d.roof === 'front' ? -0.7 : d.roof === 'side' ? -h.dp * 0.45 : null;
  if (!dealt || wv === null) return null;
  const c = housePt(h, 0, wv), R = routes(), y1 = d.ridge + 1.9;
  if (Math.min(trackDist(R.bright, c[0], c[1], y1), trackDist(R.dark, c[0], c[1], y1)) < K.CLEAR + 1.6) return null;
  return { p: c[0], q: c[1], y0: d.ridge - 0.05, y1, ph };
}
export function buildVane(g, v, list) {
  const E = K.WIND, wx = v.p - E[0], wq = v.q - E[1], wl = Math.hypot(wx, wq) || 1, dx = wx / wl, dz = -wq / wl, x = v.p, z = -v.q, yA = v.y0 + 1.62;
  g.frame(0, 0, 0, null).kind(KIND.SMOOTH).color('#2a2c30');
  g.tube([x, v.y0, z], [x, v.y1, z], 0.03, 0.02, 4);
  g.color(TRIM); g.tube([x, v.y0 + 0.6, z], [x, v.y0 + 0.8, z], 0.1, 0.1, 5, true);
  for (const [ax, az] of [[1, 0], [0, 1]]) g.tube([x - ax * 0.5, v.y0 + 1.12, z - az * 0.5], [x + ax * 0.5, v.y0 + 1.12, z + az * 0.5], 0.02, 0.02, 3);
  const n0 = g.nv;
  g.tube([x - dx * 0.75, yA, z - dz * 0.75], [x + dx * 0.75, yA, z + dz * 0.75], 0.024, 0.024, 3);
  g.tube([x + dx * 0.7, yA, z + dz * 0.7], [x + dx * 1.15, yA, z + dz * 1.15], 0.13, 0.005, 4);
  const a = [x - dx * 0.62, yA + 0.03, z - dz * 0.62], b = [x - dx * 1.2, yA + 0.3, z - dz * 1.2], c = [x - dx * 1.2, yA - 0.3, z - dz * 1.2], e = [x - dx * 0.62, yA - 0.03, z - dz * 0.62];
  g.quad(a, b, c, e); g.quad(e, c, b, a);
  list.push([n0, g.nv, x, yA, z, 0, 1, 0, 1, 0.7, 0.9, v.ph]);
}
// THE RIME ON A LINE (round seven, C3): along a wire or a string of bulbs (a plan polyline of [p, q, y]) the rime stands
// as a comb of needles 0.5 to 0.9 m long, all streaming the one way (away from the far point the standing wind blows
// toward, a little upward; where the line itself runs along the wind, up and out from it). One card to `step` metres of
// line: [a, b, c, d, variant], a and b on the line, c and d the tips. A card whose tips would come within the clear
// air of either route is left out. (Round seven's first trial hung single feathers on the lines: at a distance they
// read as birds on a wire; the comb reads as frost.) The count reads these cards' tips.
export function combOf(pts, step = 1.5, margin = 0.15) {
  const R = routes(), E = K.WIND, out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(1, Math.round(len / step));
    if (len < 0.2) continue;
    const tx = (B[0] - A[0]) / len, tq = (B[1] - A[1]) / len, ty = (B[2] - A[2]) / len;
    for (let k = 0; k < n; k++) {
      const a = [lerp(A[0], B[0], k / n), lerp(A[1], B[1], k / n), lerp(A[2], B[2], k / n)], b = [lerp(A[0], B[0], (k + 1) / n), lerp(A[1], B[1], (k + 1) / n), lerp(A[2], B[2], (k + 1) / n)];
      const mp = (a[0] + b[0]) / 2, mq = (a[1] + b[1]) / 2, wl = Math.hypot(mp - E[0], mq - E[1]) || 1;
      let sx = (mp - E[0]) / wl, sq = (mq - E[1]) / wl, sy = 0.24;
      const al = sx * tx + sq * tq + sy * ty; sx -= al * tx * 0.9; sq -= al * tq * 0.9; sy += 0.12 - al * ty * 0.9;
      const sl = Math.hypot(sx, sq, sy) || 1, h0 = Math.sin(mp * 37.17 + mq * 23.3) * 2531.3, h = h0 - Math.floor(h0), L = 0.5 + 0.4 * h;
      sx *= L / sl; sq *= L / sl; sy *= L / sl;
      const c = [b[0] + sx, b[1] + sq, b[2] + sy], d = [a[0] + sx, a[1] + sq, a[2] + sy];
      if (routeNear(mp, mq) < 16 && Math.min(trackDist(R.bright, c[0], c[1], c[2]), trackDist(R.dark, c[0], c[1], c[2]), trackDist(R.bright, d[0], d[1], d[2]), trackDist(R.dark, d[0], d[1], d[2])) < K.CLEAR + margin) continue;
      out.push([a, b, c, d, Math.floor(h * 6.99)]);
    }
  }
  return out;
}
const drawComb = (g, pts, step, margin = 0.15) => {
  const sh0 = g.sh; g.frame(0, 0, 0, null).kind(KIND.LACE).shade(0.85);
  for (const [a, b, c, d, v] of combOf(pts, step, margin)) { g.color('#ffffff', (6 + v) / 255); g.quad([a[0], a[2], -a[1]], [b[0], b[2], -b[1]], [c[0], c[2], -c[1]], [d[0], d[2], -d[1]]); }
  g.sh = sh0;
};
// the combs of the strings over the streets, into the movers' Geo (they stand still; the dead look's alone, as all lace)
export function buildCombs(g, strings, keep) {
  for (const st of strings) { const m = st.pts[st.pts.length >> 1]; if (keep(m[0], m[1]) && routeNear(m[0], m[1]) < 60) drawComb(g, st.pts, 1.5); }
}
// THE WIRES between the poles (round seven, F: they sway): each span's three wires, into the movers' Geo
export function buildWires(g, pw, keep, list) {
  g.frame(0, 0, 0, null).kind(KIND.SMOOTH).color('#191b20');
  for (const w of pw.wires) {
    const m = w[w.length >> 1]; if (!keep(m[0], m[1])) continue;
    const n0 = g.nv, a = w[0], b = w[w.length - 1];
    for (let i = 0; i + 1 < w.length; i++) g.tube([w[i][0], w[i][2], -w[i][1]], [w[i + 1][0], w[i + 1][2], -w[i + 1][1]], 0.03, 0.03, 3);
    if (routeNear(m[0], m[1]) < 45) { drawComb(g, w, 2.5, 0.4); g.kind(KIND.SMOOTH).color('#191b20'); }   // (the wire's comb of rime sways with it)
    list.push([n0, g.nv, a[0], a[2], -a[1], b[0], b[2], -b[1], 2, 0, 0, 0]);
  }
}

// ---------------------------------------------------------------------------------------------- ground and roads
// an up-facing grid over plan p0..p1, q0..q1 with height y(p, q), nu by nv cells
function gridUp(g, p0, q0, p1, q1, yf, nu, nv) {
  for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) {
    const pa = lerp(p0, p1, a / nu), pb = lerp(p0, p1, (a + 1) / nu), qa = lerp(q0, q1, b / nv), qb = lerp(q0, q1, (b + 1) / nv);
    g.quad([pa, yf(pa, qa), -qa], [pb, yf(pb, qa), -qa], [pb, yf(pb, qb), -qb], [pa, yf(pa, qb), -qb]);
  }
}
// One 80 m cell of the plan: lawn, sidewalks, kerbs into g; its four half roads into road (the wet road near the
// routes) or, when road is null, into g as plain dark bands. exists false: a ploughed field with no street.
export function buildCellGround(g, road, i, j, exists, near, mainN, mainS, fine = true) {
  const B = K.BLOCK, p0 = i * B, q0 = j * B, p1 = p0 + B, q1 = q0 + B, h = K.ROAD / 2, n = near ? 14 : 1;
  g.frame(0, 0, 0, null);
  if (!exists) { g.kind(KIND.FIELD).color('#2a241c'); gridUp(g, p0, q0, p1, q1, () => 0, 1, 1); return; }
  const ky = K.KERB;
  g.kind(KIND.LAWN).color('#2e4a2a'); gridUp(g, p0 + h, q0 + h, p1 - h, q1 - h, () => ky, n, n);
  g.kind(KIND.WALK).color('#6e6c66');
  const s1 = WALK_OUT, s0 = s1 - K.WALK, m = near ? 16 : 1, wy = () => ky + 0.02;   // (the walk: its inner and outer edges from a street's centre line)
  gridUp(g, p0 + s0, q0 + s0, p0 + s1, q1 - s0, wy, 1, m); gridUp(g, p1 - s1, q0 + s0, p1 - s0, q1 - s0, wy, 1, m);
  gridUp(g, p0 + s1, q0 + s0, p1 - s1, q0 + s1, wy, m, 1); gridUp(g, p0 + s1, q1 - s1, p1 - s1, q1 - s0, wy, m, 1);
  if (mainN) gridUp(g, p0 + h, q1 - MAIN.front, p1 - h, q1 - h, wy, m, 2);   // (Main Street's walks reach from the kerb to the store fronts)
  if (mainS) gridUp(g, p0 + h, q0 + h, p1 - h, q0 + MAIN.front, wy, m, 2);
  // kerb faces toward the four roads
  g.color('#7a7872');
  g.quad([p0 + h, 0, -(q1 - h)], [p0 + h, 0, -(q0 + h)], [p0 + h, ky, -(q0 + h)], [p0 + h, ky, -(q1 - h)]);
  g.quad([p1 - h, 0, -(q0 + h)], [p1 - h, 0, -(q1 - h)], [p1 - h, ky, -(q1 - h)], [p1 - h, ky, -(q0 + h)]);
  g.quad([p0 + h, 0, -(q0 + h)], [p1 - h, 0, -(q0 + h)], [p1 - h, ky, -(q0 + h)], [p0 + h, ky, -(q0 + h)]);
  g.quad([p1 - h, 0, -(q1 - h)], [p0 + h, 0, -(q1 - h)], [p0 + h, ky, -(q1 - h)], [p1 - h, ky, -(q1 - h)]);
  const R = road || g, na = road && fine ? 3 : 1, nb = road ? (fine ? 40 : 4) : 1, crown = (dc) => 0.08 * (1 - dc / h);   // fine: the wet road takes its baked light at these points (the crown is a straight fall: the same shape either way)
  if (!road) g.kind(KIND.ROAD).color('#15161a');
  else R.frame(0, 0, 0, null).kind(KIND.WALK).color('#0c0d10');
  gridUp(R, p0, q0, p0 + h, q1, (p) => crown(p - p0), na, nb); gridUp(R, p1 - h, q0, p1, q1, (p) => crown(p1 - p), na, nb);
  gridUp(R, p0 + h, q0, p1 - h, q0 + h, (p, q) => crown(q - q0), nb, na); gridUp(R, p0 + h, q1 - h, p1 - h, q1, (p, q) => crown(q1 - q), nb, na);
  // (round eight) where a side strip's crowned end meets the corner square's fall there is a step of up to 8 cm: closed
  // with a small upright face (the floor far under the roadway showed through it as dark dashes across a crossing)
  // (as a low wedge 0.7 m long, lit as the ground is)
  if (road) for (const [p, qe, qi, s] of [[p0 + h, q0, q0 + h, -1], [p0 + h, q1, q1 - h, -1], [p1 - h, q0, q0 + h, 1], [p1 - h, q1, q1 - h, 1]]) { const A = [p, 0.0, -qi], B = [p, 0.085, -qe], C = [p + s * 0.7, 0.025, -qe], D = [p + s * 0.7, 0.025, -qi]; R.quad(A, B, C, D); R.quad(D, C, B, A); }
}

// ---------------------------------------------------------------------------------------------- materials
// One tileable noise texture for every shader (r: soft fbm, g: fine grain, b: cells, a: a second fbm). Built in rows
// so that the caller can hand the page back between them.
export async function makeNoiseTex(seed, yieldFn) {
  const N = 256, data = new Uint8Array(N * N * 4), r = makeRng(hashSeed('noise:' + seed));
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
  const L = [lat(8), lat(16), lat(32), lat(64), lat(128), lat(16), lat(32), lat(64)];
  // (each lattice's cell, next cell and eased step along one axis, for every texel of a row: worked out once)
  const I0 = {}, I1 = {}, SS = {};
  for (const n of [8, 16, 32, 64, 128]) { const a = I0[n] = new Uint16Array(N), b = I1[n] = new Uint16Array(N), s = SS[n] = new Float64Array(N); for (let x = 0; x < N; x++) { const fx = x * n / N, x0 = Math.floor(fx), tx = fx - x0; a[x] = x0 % n; b[x] = (x0 + 1) % n; s[x] = tx * tx * (3 - 2 * tx); } }
  const samp = (A, n, x, y) => {
    const X0 = I0[n], X1 = I1[n], S = SS[n], sx = S[x], sy = S[y], ya = X0[y] * n, yb = X1[y] * n;
    const a = A[ya + X0[x]], b = A[ya + X1[x]], c = A[yb + X0[x]], d = A[yb + X1[x]];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const cells = []; for (let i = 0; i < 90; i++) cells.push([r() * N, r() * N]);
  // the cells by 32 px buckets: a texel asks only the nine about it. (What lies outside them is 32 px off and more, and
  // the blue channel is full at 18.3 px, so the texture is the same to the byte.)
  const bk = []; for (let i = 0; i < 64; i++) bk.push([]);
  for (const c of cells) bk[(Math.floor(c[1] / 32) & 7) * 8 + (Math.floor(c[0] / 32) & 7)].push(c);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      const s64 = samp(L[3], 64, x, y);
      data[o] = 255 * (samp(L[0], 8, x, y) * 0.5 + samp(L[1], 16, x, y) * 0.27 + samp(L[2], 32, x, y) * 0.15 + s64 * 0.08);
      data[o + 1] = 255 * (samp(L[4], 128, x, y) * 0.6 + s64 * 0.4);
      let best = 1e9; const bx = x >> 5, by = y >> 5;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const B = bk[((by + j) & 7) * 8 + ((bx + i) & 7)]; for (let k = 0; k < B.length; k++) { const c = B[k]; let dx = Math.abs(c[0] - x), dy = Math.abs(c[1] - y); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const dd = dx * dx + dy * dy; if (dd < best) best = dd; } }
      data[o + 2] = Math.min(255, Math.sqrt(best) * 14);
      data[o + 3] = 255 * (samp(L[5], 16, x, y) * 0.55 + samp(L[6], 32, x, y) * 0.3 + samp(L[7], 64, x, y) * 0.15);
    }
    if (yieldFn && y % 32 === 31) await yieldFn();   // (a hand-back each 32 rows: about a hundredth of a second of work)
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
// uniforms every material shares; the world writes them at every update
export function makeShared(noiseTex) {
  return {
    uTime: { value: 0 }, uPhase: { value: 0 }, uChase: { value: 0 }, uNoise: { value: noiseTex },
    uFogB: { value: new THREE.Color('#141c38') }, uFogD: { value: new THREE.Color('#6276a6') },   // (round six) the dark side's far air: the moonlit haze over snow, paler than the sky's foot
    uMoon: { value: new THREE.Vector3(0.3, 0.6, -0.74).normalize() }, uSnow: { value: 0 }, uH: { value: 450 },
    // the leaves (NL of them): (x, z, nx, nz), (waist, top, foot, spill) and the fan of light before each (half width
    // at the foot, widening a metre, strength, the leaf's waist). Fixed at the build: nothing writes them afterwards.
    uLfA: { value: LEAVES.map((l) => { const w = leafWorld(l); return new THREE.Vector4(w.x, w.z, w.nx, w.nz); }) },
    uLfB: { value: LEAVES.map((l) => new THREE.Vector4(l.waist, l.top, l.foot, l.spill)) },
    uLfC: { value: LEAVES.map((l) => new THREE.Vector4(l.fan[0], l.fan[1], l.fan[2], l.waist)) },
  };
}
export const GLSL_COMMON = /* glsl */`
uniform float uTime; uniform float uPhase; uniform float uChase; uniform sampler2D uNoise;
uniform vec3 uFogB; uniform vec3 uFogD;
uniform vec3 uMoon; uniform float uSnow;
uniform vec4 uLfA[${NL}]; uniform vec4 uLfB[${NL}]; uniform vec4 uLfC[${NL}];
// THE MOON OF THE DARK SIDE IS ITS KEY LIGHT (round six): low in the west of the dark plan (world +z), 18 degrees up,
// 8 degrees south of Main Street's axis (world +x); cool blue-white. MOONC: its light on what faces it; GOLD: a lamp's
// light on snow. (uEye: the far point the standing wind blows toward: the rime grows on what faces away from it.)
const vec3 KEY = vec3(0.1324, 0.3090, 0.9418);
const vec3 MOONC = vec3(0.60, 0.77, 1.26);
const vec3 GOLD = vec3(1.0, 0.60, 0.22);
// THE PARTED OPENING OF A THIN PLACE: 1 inside the leaf, at h = (metres along its plane from its middle, height);
// open = (waist, top, foot); at: the leaf's foot in the world. The same leaf the curtain's two edges draw. A leaf
// breathes, a tenth of its width each 5 s, EACH WITH A PHASE FROM ITS OWN PLACE (leafPh): no two swell in step.
float leafPh(vec2 at){ return dot(at, ${LEAF_PH}); }
float leafOf(vec2 h, vec3 open, vec2 at){
  float breathe = 1.0 + ${BREATHE.toFixed(2)} * sin(uTime * 6.2832 / 5.0 + leafPh(at));
  float ty = clamp((h.y - open.z) / max(open.y - open.z, 0.1), 0.0, 1.0);
  float leaf = pow(clamp(sin(3.14159 * pow(ty, 0.8)), 0.0, 1.0), 0.75);
  float hwid = 0.5 * open.x * breathe * leaf;
  return (1.0 - smoothstep(-0.03, 0.0, abs(h.x) - hwid)) * step(open.z, h.y) * step(h.y, open.y);
}
// THE LAW OF THE LEAVES (round seven). Every fragment of both copies and of both skies shows THE LOOK OF THE SIDE THE
// EYE STANDS ON (living while the eye stands east of the plane x -80, dead while it stands west of it), TURNED TO THE
// OTHER LOOK where the sight line from the eye to it passes through the outline of a leaf standing between them.
// leafCross: how many leaves' outlines the sight line from the eye to wp passes through (each by its own fixed plane
// and outline; a sight line through two leaves shows the eye's own side's look again). deadAt: 1 where wp is seen
// dead, 0 where it is seen alive. No clock but the leaf's own breathing, no metres flown, no fade, no seed; a leaf's
// outline is the same for every eye, wherever it stands.
float leafCross(vec3 eye, vec3 wp){
  float c = 0.0;
  // (round eight, room: the bright copy's leaves stand east of the plane x -80, the last of them on it, and the dark
  // copy's west of it: a sight line that stays on one side of the plane can pass only through that side's leaves)
  bool ew = eye.x < -80.0, ww = wp.x < -80.0;
  int i0 = ew && ww ? ${NB} : 0, i1 = !ew && !ww ? ${NB} : ${NL};
  for (int i = i0; i < i1; i++){
    vec4 A = uLfA[i];
    float de = dot(eye.xz - A.xy, A.zw), dw = dot(wp.xz - A.xy, A.zw);
    if (de * dw >= 0.0) continue;
    vec3 h = eye + (wp - eye) * (de / (de - dw)), B = uLfB[i].xyz;
    float a = dot(h.xz - A.xy, vec2(-A.w, A.z));
    if (abs(a) > 0.56 * B.x || h.y < B.z || h.y > B.y) continue;   // (round eight: outside the leaf's own box: its outline is not asked)
    c += step(0.5, leafOf(vec2(a, h.y), B, A.xy));
  }
  return c;
}
float deadAt(vec3 eye, vec3 wp){ float c = leafCross(eye, wp); return abs(step(eye.x, -80.0) - (c - 2.0 * floor(c * 0.5))); }
// A LEAF'S OWN GLASS (round eight, the cure): NOTHING SEEN THROUGH A LEAF IS RED. Where the living look is seen by an
// eye that stands on the dead side (from there it is seen through a leaf and nowhere else), a colour whose red is its
// greatest part is turned toward gold: its green is raised until it stands a share k of the way from its blue to its
// red. The floor k is 0.3 for a strong light and rises as the light sinks (0.34 at a tenth, 0.47 at a fortieth: the
// engine's own last pass, which cools every shadow, draws a dark colour back toward red), so that the screen shows
// no hue under some 20 degrees at any strength; lift raises it (a bulb's and a pool's light, laid over what lies
// behind it, takes 0.5). Its red and its depth of colour stay; only the hue turns. Rose turns with it; violet and
// blue are not touched. For every leaf, every eye and every seed.
vec3 noRed(vec3 c, float lift){
  float m = min(c.g, c.b), ch = c.r - m;
  if (c.r <= max(c.g, c.b) || ch < 1e-5) return c;
  float h = (c.g - c.b) / ch, k = min(0.30 + lift + 0.0042 / max(c.r, 1e-4), 1.0);
  h = mix(h, max(h, k), smoothstep(-1.0, -0.55, h));
  c.g = m + max(h, 0.0) * ch; c.b = m + max(-h, 0.0) * ch;
  return c;
}
// THE LIVING SIDE'S LIGHT SPILLS OUT OF EVERY LEAF (round seven, B5; ROUND EIGHT, C3: A BROAD FAN that reaches 20 to
// 60 m by the leaf's size, and from the last leaf A LONG CARPET down the middle of Main Street), as a fixed light at
// fixed places: before the foot of each leaf a fan on the ground, toward the line, with long bars of light between
// shadows (a fixed pattern by the bearing from the leaf's foot), and light on what stands near and is turned to the
// leaf (walls, trunks, rime). West of the plane it is WARM and lies on the dead look; east of it, it is COLD AND PALE
// and lies on the living look. It reads the place alone: it does not grow, swing or warm as the eye nears.
vec3 spillO(vec3 wp, vec3 n, float dk, float omni){
  float west = step(wp.x, -80.0), acc = 0.0;
  if (abs(dk - west) > 0.5) return vec3(0.0);
  // (room: east of the plane only the bright copy's leaves spill; west of it the dark copy's and the leaf on the plane)
  int i0 = west > 0.5 ? ${NB - 1} : 0, i1 = west > 0.5 ? ${NL} : ${NB};
  for (int i = i0; i < i1; i++){
    vec4 A = uLfA[i], B = uLfB[i], C = uLfC[i];
    vec2 r = wp.xz - A.xy;
    float L = abs(B.w), s = dot(r, A.zw);
    if (B.w < 0.0) s = abs(s);
    if (s < 0.0 || s > L) continue;
    float t = abs(dot(r, vec2(-A.w, A.z))), wid = C.x + s * C.y, widW = wid * 1.6 + 5.0;
    if (t > widW) continue;
    float k = 1.0 - s / L, e = min(t / wid, 1.0), eW = t / widW;
    float fall = pow(k, 0.5) * smoothstep(0.0, 1.2, s);
    // the bars: by the bearing from the leaf's foot, five or so across the fan, their edges a little uneven
    float bear = dot(r, vec2(-A.w, A.z)) / (s + 0.3 * C.w + 1.5);
    float bars = smoothstep(0.30, 0.66, 0.5 + 0.5 * sin(bear * 11.0 + float(i) * 2.1 + 2.6 * textureLod(uNoise, vec2(bear * 0.31 + float(i) * 0.173, 0.37 + float(i) * 0.11), 0.0).r));
    vec3 toL = normalize(vec3(-r.x, B.y * 0.3 - wp.y, -r.y));
    float up = smoothstep(0.35, 0.8, n.y);
    // (round eight, C3: warm on the walls, trunks and rime that face the leaf: a twig's lace takes it from every side)
    acc += C.z * fall * (up * (1.0 - e * e) * (1.0 - e * e) * (0.62 + 0.38 * bars) + (1.0 - up) * (1.0 - eW * eW) * mix(max(dot(n, toL), 0.0), 0.75, omni) * exp(-max(wp.y, 0.0) / (0.6 * B.y + 2.0)));
  }
  return min(acc, 0.95) * mix(vec3(0.50, 0.62, 0.90), vec3(1.25, 0.66, 0.22), west);
}
vec3 spill(vec3 wp, vec3 n, float dk){ return spillO(wp, n, dk, 0.0); }
// (round eight, C4, E5) THE HEARTH: what a leaf's warm fan comes from. On the living look of the dead town's copy (it
// is seen through a leaf only) the ground, the walls and the crowns for some metres behind a leaf's plane stand in
// warm lamplight, strongest at the leaf: a house front behind a door leaf glows like a lit hall, the tower's foot and
// the square behind the great leaves lie in amber. By the place alone.
vec3 hearth(vec3 wp, vec3 n){
  if (wp.x > -80.0) return vec3(0.0);
  float acc = 0.0;
  for (int i = ${NB}; i < ${NL}; i++){
    vec4 A = uLfA[i], B = uLfB[i], C = uLfC[i];
    if (B.w <= 0.0) continue;
    vec2 r = wp.xz - A.xy;
    float s = -dot(r, A.zw), L = 0.3 * B.w + 7.0;
    if (s < -3.0 || s > L) continue;
    float t = abs(dot(r, vec2(-A.w, A.z))), wid = 1.5 * C.x + 2.5 + 0.5 * max(s, 0.0);
    if (t > wid) continue;
    float e = t / wid, k = 1.0 - max(s, 0.0) / L;
    acc += C.z * k * (1.0 - e * e) * mix(0.8, 1.0, smoothstep(0.35, 0.8, n.y)) * exp(-max(wp.y, 0.0) / (0.6 * B.y + 3.0));
  }
  return min(acc, 0.9) * vec3(1.25, 0.66, 0.22);
}
// THE NORTHERN LIGHTS LIGHT THE SNOW (round eight, C1): how brightly the ribbons stand over a place of the plan, 0 to 1:
// broad bands that drift slowly over the town on the world's clock (under a brighter ribbon the snow is greener)
float auroraOver(vec2 xz){
  float a = texture2D(uNoise, xz * 0.0019 + vec2(uTime * 0.0042, uTime * 0.0017)).r, b = texture2D(uNoise, xz * 0.0047 - vec2(uTime * 0.0031, 0.0)).g;
  return smoothstep(0.34, 0.66, a * 0.7 + b * 0.3);
}
// ... and as dark glass mirrors them (round eight, B4): the band a pane holds, by the bearing be its mirror looks
// along (radians east of north: the dead sky's own arc, from 72 degrees west of north round to the low ribbon over
// the east) and by v, 0 at the band's foot to 1 at its top: green below, violet above, in soft upright folds that
// drift as the sky's do
vec3 auroraBand(float be, float v){
  float arc = smoothstep(-1.5, -1.15, be) * (1.0 - smoothstep(2.1, 2.45, be));
  float fold = texture2D(uNoise, vec2(be * 0.9 + uTime * 0.006, 0.37)).g, rays = texture2D(uNoise, vec2(be * 3.3 + uTime * 0.0075, 0.13)).g;
  v -= 0.22 * (fold - 0.5);
  float prof = smoothstep(0.0, 0.14, v) * exp(-max(v, 0.0) * 2.1);
  return mix(vec3(0.205, 0.888, 0.434), vec3(0.40, 0.20, 0.84), smoothstep(0.1, 0.62, v)) * prof * (0.45 + 0.55 * smoothstep(0.38, 0.66, rays)) * arc;
}
// THE WATER TOWER'S MOON SHADOW (round eight, D1): 1 where the ray from wp to the moon (key: the unit vector toward it)
// meets the tower (tow: its axis in the world and its scale): the legs' cage as three bars and the riser, the bowl,
// the tank, the cap. It lies on the ground, the roofs and the crowns alike, 140 m long.
float towerShade(vec3 wp, vec3 key, vec3 tow){
  vec2 r = wp.xz - tow.xy, m = normalize(key.xz);
  float s = -dot(r, m);
  if (s < 1.0 || s > 160.0) return 0.0;
  float t = abs(dot(r, vec2(-m.y, m.x))) / tow.z, hy = (wp.y + s * key.y / length(key.xz)) / tow.z, soft = 0.25 + s * 0.012;
  if (hy > 38.2 || t > 7.5) return 0.0;
  float tank = hy > 24.2 ? (hy < 32.0 ? 5.5 : 5.8 * (38.0 - hy) / 6.0) : (hy > 20.6 ? mix(0.9, 5.5, (hy - 20.6) / 3.6) : 0.9);
  float body = 1.0 - smoothstep(tank - soft, tank + soft, t);
  float lr = mix(6.6, 4.9, clamp(hy / 24.0, 0.0, 1.0)), legs = step(hy, 24.5) * max(1.0 - smoothstep(0.25, 0.25 + soft, abs(t - lr * 0.87)), 0.6 * (1.0 - smoothstep(0.3, 0.3 + soft, abs(t - lr * 0.3))));
  return max(body, legs) * smoothstep(1.0, 4.0, s);
}
// A HANGING WIRE SWAYS (round seven, F): metres its lowest point moves across its span, at the world place w, on the
// world's clock (a slow swing with a shorter one over it, running across the town). A wire's own points and the rime
// feathers that hang from it read the same sway, each by its share of the span's sag.
float wireSway(vec3 w){ return 0.2 * (sin(uTime * 0.83 + 0.07 * (w.x + w.z)) + 0.5 * sin(uTime * 1.9 + 0.11 * (w.x - w.z))); }
// THE WAVE: seconds since the last front passed a bulb whose plan distance is d (36 m/s, one front each 3.5 s)
float waveSince(float d){ return mod(uTime + uPhase + 350.0 - d / 36.0, 3.5); }
float waveAmp(float d){ float k = clamp(1.0 - waveSince(d) / 1.2, 0.0, 1.0); return 0.333 + 0.667 * k * k; }
float waveHot(float d){ float k = clamp(1.0 - waveSince(d) / 0.45, 0.0, 1.0); return k * k; }
// THE BAND (round six: THE TOWN IS LIT AT REST AND FLARES IN A BAND): behind every front the dark side's lights burn
// full for 0.972 s (35 m of the wave's way), sinking over a further 1.111 s (40 m more): 1 inside a band, 0 between
// bands, where every light rests (a window at 0.45, a lamp at half). The same law, clock and d. (A ghost bulb keeps
// its own clock: see the bulbs' own law.)
float waveBand(float d){ float s = waveSince(d); return max(1.0 - smoothstep(0.972, 2.083, s), smoothstep(3.44, 3.5, s)); }
// NEAR A THIN PLACE THE LIVING SIDE LEAKS THROUGH (round five), by the dark plan's place (p, q): 1 within 70 m of
// either thin place flown through (the dark plan's origin and the ring's place, K.RING), none by 150 m
float thinNear(vec2 pq){ return 1.0 - smoothstep(70.0, 150.0, min(length(pq), length(pq - vec2(${K.RING[0].toFixed(1)}, ${K.RING[1].toFixed(1)})))); }
// the band as a LIGHT of the dark side takes it (a ghost, a pane, a lamp's light on the snow, a pool): the wave's band,
// and near a thin place never under a half: there every light rests at about 0.7 of its full strength
float bandAt(float d, vec2 pq){ return max(waveBand(d), 0.5 * thinNear(pq)); }
// the dark side's far air: clear and thin; toward the moon it is a little paler
vec3 fogDark(vec3 dir){
  float toM = max(dot(normalize(dir.xz + vec2(1e-5)), normalize(KEY.xz)), 0.0);
  return uFogD * (1.0 + 0.5 * pow(toM, 6.0) * exp(-max(dir.y, 0.0) * 5.0));
}
// dk: how far the point is the dark side's (1) or the living side's (0)
vec3 fogOf2(vec3 col, vec3 wp, vec3 eye, float dk){
  float dist = length(wp - eye);
  float low = exp(-max(min(wp.y, eye.y), 0.0) / 14.0);
  float dens = mix(0.0013, 0.00042, dk) * (1.0 + mix(1.2, 0.5, dk) * low);   // (round six) the dark side's air is thin and clear to the horizon
  float f = 1.0 - exp(-dist * dens);
  return mix(col, mix(uFogB, fogDark((wp - eye) / max(dist, 1e-3)), dk), clamp(f, 0.0, 1.0));
}
`;
const SURF_VERT = /* glsl */`
attribute vec3 aN; attribute vec4 aC; attribute vec4 aL; attribute vec4 aT;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec4 vL; varying vec4 vT; varying vec2 vP;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * aN); vC = aC; vL = aL; vT = aT; vP = position.xz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// THE MOVERS (round seven, F): the few things of the town that move on the world's clock, one mesh a copy, drawn with
// the town's own surface. Each point carries its thing's pivot, axis and swing: a PORCH SWING sways about its hooks
// and a WEATHERVANE turns to and fro about its rod while their place is seen ALIVE (by the law of the leaves, per
// thing: seen dead they hang frozen at rest); A WIRE between two poles sways across its span in either look.
const SURF_MOVE_VERT = /* glsl */`
attribute vec3 aN; attribute vec4 aC; attribute vec4 aL; attribute vec4 aT;
attribute vec3 aPiv; attribute vec4 aAx; attribute vec3 aSw;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec4 vL; varying vec4 vT; varying vec2 vP;
${GLSL_COMMON}
void main(){
  vec3 lp = position, ln = aN;
  if (aAx.w > 1.5) lp += aAx.xyz * aSw.x * wireSway((modelMatrix * vec4(position, 1.0)).xyz);
  else if (aSw.x > 0.0) {
    float live = 1.0 - deadAt(cameraPosition, (modelMatrix * vec4(aPiv, 1.0)).xyz);
    float ang = aAx.w < 0.5 ? aSw.x * sin(uTime * aSw.y + aSw.z) : aSw.x * (sin(uTime * aSw.y + aSw.z) + 0.6 * sin(uTime * aSw.y * 0.37 + aSw.z * 2.3)) + 0.07 * sin(uTime * 3.1 + aSw.z);
    ang *= live;
    vec3 k = aAx.xyz, v = position - aPiv; float c = cos(ang), s = sin(ang);
    lp = aPiv + v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
    ln = aN * c + cross(k, aN) * s + k * dot(k, aN) * (1.0 - c);
  }
  vec4 w = modelMatrix * vec4(lp, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * ln); vC = aC; vL = aL; vT = aT; vP = lp.xz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// THREE PATTERNS OF THE SURFACES, EACH BY ITS OWN LAW, AND EACH LAW'S MEAN COUNTED HERE AT LOAD (r8d, B): a clapboard
// wall's lines, a brick wall's courses and a snowy roof's wind ridges. Each is too fine to draw where one fragment
// of the picture reaches over a good part of a course; there it fades, by that fragment's own reach (fwidth), TO ITS
// OWN MEAN, so that a wall or a roof has one mean tone whatever the size of the picture. THIS IS THE ALLOWED USE OF
// A FRAGMENT'S REACH: it chooses between a pattern and that pattern's mean, never a tone, a size or a light. The
// laws' measures are named once, here; the shader's lines below are written from them and the means are counted from
// them (the sum over the middle points of a fine grid over one period): no mean is typed.
// LAP: courses to a metre of a wall's height; face: the share of a course's half that is the board's plain face;
// soft: the share over which its line comes in. BRICK: a course's height and a brick's length (m); bed, head: for
// the lying joint and the standing one, [the share that is plain face, the share over which the joint comes in].
// RIDGE: the wave's two levels between which a ridge's crest rises.
export const LAP = { per: 3.3, face: 0.66, soft: 0.3 };
export const BRICK = { course: 0.28, long: 0.62, bed: [0.78, 0.16], head: [0.86, 0.1] };
export const RIDGE = { lo: 0.25, hi: 0.75 };
// each law over one period (f, g: the place within a course, a brick's length or a ridge's wave, 0 to 1)
const lapLaw = (f) => 1 - smoothstep(0, LAP.soft, Math.abs(f - 0.5) * 2 - LAP.face);
const brickLaw = (f, g) => Math.max(1 - smoothstep(0, BRICK.bed[1], Math.abs(f - 0.5) * 2 - BRICK.bed[0]), 1 - smoothstep(0, BRICK.head[1], Math.abs(g - 0.5) * 2 - BRICK.head[0]));
const ridgeLaw = (f) => smoothstep(RIDGE.lo, RIDGE.hi, 0.5 + 0.5 * Math.sin(f * 2 * Math.PI));
const meanOf = (law, n) => { let sum = 0; for (let a = 0; a < n; a++) sum += law((a + 0.5) / n); return sum / n; };
// (grids of 400 points, and of 128 by 128 for the brick: each sum stands within a millionth of a finer grid's)
export const LAP_MEAN = meanOf(lapLaw, 400), RIDGE_MEAN = meanOf(ridgeLaw, 400), BRICK_MEAN = meanOf((f) => meanOf((g) => brickLaw(f, g), 128), 128);
// a measure written into a shader's line
const glf = (v) => v.toFixed(6);
const SURF_FRAG = /* glsl */`
precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec4 vL; varying vec4 vT; varying vec2 vP;
uniform float uDark; uniform float uRoad; uniform float uOnly; uniform vec3 uKey; uniform vec2 uWind; uniform vec2 uLift; uniform vec3 uTow;
${GLSL_COMMON}
void main(){
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float kind = floor(vT.w * 255.0 / 16.0 + 0.5);
  vec3 alb = vC.rgb * vC.rgb;
  float shade = 0.35 + 0.65 * vT.z;
  vec3 eye = cameraPosition, V = normalize(eye - vW);
  float dist = length(eye - vW);
  // THE LAW OF THE LEAVES (round seven): dk: this fragment is seen DEAD (1) or ALIVE (0), on either copy alike: by the
  // side the eye stands on, turned where the sight line passes through a leaf's outline. (uDark only names the copy.)
  float dk = deadAt(eye, vW);
  // the rime's lace is the dead look's alone, and a whole mesh of ice with it (uOnly 2); a crown of leaves (uOnly 1) is
  // the living look's alone
  if ((dk < 0.5 && (kind > 14.5 || uOnly > 1.5)) || (dk > 0.5 && uOnly > 0.5 && uOnly < 1.5)) discard;
  // (round eight, B2) an open shop front's glass (the pane class 0.1) is not there where it is seen alive: the eye looks into the shop
  if (dk < 0.5 && kind > 1.5 && kind < 2.5 && vT.z < 0.2) discard;
  float laceR = 1.0;   // (round eight, C5) how far out along its fan a fragment of lace lies
  // (round seven, E2; r8d, B) how coarsely this fragment samples a wall's height (the change of that height from one
  // fragment to the next): where a course is sampled too coarsely its lines fade to their own mean before they can beat
  float fwY = fwidth(vW.y);
  float d = abs(vP.x) + abs(vP.y);
  vec4 nz = texture2D(uNoise, vW.xz * 0.11 + vW.y * 0.07);
  vec4 nzBig = texture2D(uNoise, vW.xz * 0.012);
  float isPane = step(1.5, kind) * step(kind, 2.5), isRoof = step(0.5, kind) * step(kind, 1.5), isLawn = step(2.5, kind) * step(kind, 3.5);
  float isWall = step(kind, 0.5), isField = step(9.5, kind) * step(kind, 10.5);
  if (kind > 11.5 && kind < 12.5) {
    // a picket fence: slats with pointed tops and two rails (vC.a * 255 pickets across the panel)
    float px = fract(vT.x * vC.a * 255.0), tip = 1.0 - abs(px - 0.31) * 0.42;
    float rail = step(abs(vT.y - 0.3), 0.045) + step(abs(vT.y - 0.72), 0.045);
    if ((px > 0.62 || vT.y > tip) && rail < 0.5) discard;
  } else if (kind > 10.5 && kind < 11.5) {
    // a spray of leaves: the card is cut into round leaves near the eye, and is one soft-edged spray far off
    // (round eight, E5: the great oak's sprays are near three times the size (the alpha slot over a half marks them):
    // they are cut into leaves from three times as far, so that down Main Street its crown is leaves, not shards)
    float cell = texture2D(uNoise, vT.xy * 0.31 + vC.a * 7.5).b;
    float rim = max(abs(vT.x - 0.5), abs(vT.y - 0.5)) * 2.0;
    if (cell + rim * rim * 0.4 > mix(0.5, 1.7, smoothstep(20.0, 46.0, dist * mix(1.0, 0.33, step(0.505, vC.a))))) discard;
  } else if (kind > 14.5 && vC.a > 0.02 && vC.a < 0.05) {
    // A COMB OF RIME ON A LINE (round seven, C3; ROUND EIGHT, C5: FINE NEEDLES, NOT SAW TEETH): thirty-eight slim
    // needles to a card, each of its own length (many short, few long), each leaning a little its own way, one in seven
    // missing, tapering from the line (vT.y 0) to its tip; thicker to the eye far off
    float fx = vT.x * 38.0, ni = floor(fx), nh = fract(sin((ni + vC.a * 255.0 * 17.0) * 47.31) * 15731.7), nh2 = fract(nh * 57.3);
    float nlen = 0.10 + 0.66 * nh * nh * nh, nw = abs(fract(fx) - 0.5 - (nh2 - 0.5) * 0.5 * vT.y / nlen);
    if (nh2 < 0.14 || vT.y > nlen || nw > (0.05 + 0.17 * (1.0 - vT.y / nlen)) + min(dist, 150.0) * 0.0026) discard;
    laceR = 0.9;
  } else if (kind > 14.5 && vC.a > 0.05) {
    // LACE: a fan of fine twigs from a branch's end (three orders of them), thicker to the eye far off
    vec2 lq = vec2(vT.x - 0.5, vT.y);
    float lr = length(lq), la = atan(lq.x, lq.y);
    float wob = texture2D(uNoise, vT.xy * 0.9 + vC.a * 7.0).r - 0.5;
    float a1 = la * 2.2 + wob * 0.5 + vC.a * 9.0, a2 = la * 5.1 + wob * 1.1 + vC.a * 5.0, a3 = la * 11.3 + wob * 2.0;
    float th = 0.0035 + min(dist, 150.0) * 0.00042;
    float keepL = step(abs(fract(a1) - 0.5) / 2.2 * lr, th * 1.3) + step(abs(fract(a2) - 0.5) / 5.1 * lr, th) * step(0.3, lr) + step(abs(fract(a3) - 0.5) / 11.3 * lr, th * 0.8) * step(0.55, lr);
    if (keepL < 0.5 || lr > 0.97 - 0.4 * abs(wob)) discard;
    laceR = lr;
  }
  // surface patterns: clapboard lines, shingle courses, lawn mottle, furrows
  // (round seven, E2: NO WALL BEATS AT ANY DISTANCE: broad courses of 0.3 m and a low contrast of their lines.)
  // (r8d, B: THE ALLOWED USE OF A FRAGMENT'S REACH) where a course is sampled by fewer than four fragments its lines
  // fade TO THE PATTERN'S OWN COUNTED MEAN (LAP_MEAN, counted at load from the law above this shader), not to no
  // pattern: the faded wall has the drawn wall's mean tone, seen alive or dead (the dead look reads lap below),
  // whatever the size of the picture. (The lines' going between 18 and 60 m is by true distance and is not this.)
  float lapFade = 1.0 - smoothstep(0.07, 0.22, fwY * ${glf(LAP.per)});
  float lap = isWall * mix(${glf(LAP_MEAN)}, 1.0 - smoothstep(0.0, ${glf(LAP.soft)}, abs(fract(vW.y * ${glf(LAP.per)}) - 0.5) * 2.0 - ${glf(LAP.face)}), lapFade) * smoothstep(60.0, 18.0, dist);
  alb *= 1.0 - 0.13 * lap;
  // brick and stone: courses with staggered joints (the mortar a shade paler; on the dark side it holds the frost)
  float isBrick = step(5.5, kind) * step(kind, 6.5) + 0.6 * step(8.5, kind) * step(kind, 9.5);
  // (r8d, B: the allowed use of a fragment's reach) where a course is sampled by fewer than four fragments the
  // courses fade TO THEIR OWN COUNTED MEAN (BRICK_MEAN), not to no pattern: the faded brick wall has the drawn one's
  // mean tone, and so have its rime and its hoar on the dead side, which read this same value below
  float crs = vW.y / ${glf(BRICK.course)}, along = (abs(n.x) > abs(n.z) ? vW.z : vW.x) / ${glf(BRICK.long)} + 0.5 * floor(crs);
  float brickFade = 1.0 - smoothstep(0.07, 0.22, fwY / ${glf(BRICK.course)});
  float mortar = mix(${glf(BRICK_MEAN)}, max(1.0 - smoothstep(0.0, ${glf(BRICK.bed[1])}, abs(fract(crs) - 0.5) * 2.0 - ${glf(BRICK.bed[0])}), 1.0 - smoothstep(0.0, ${glf(BRICK.head[1])}, abs(fract(along) - 0.5) * 2.0 - ${glf(BRICK.head[0])})), brickFade) * isBrick * smoothstep(70.0, 22.0, dist) * step(abs(n.y), 0.5);
  alb = mix(alb, alb * 1.5 + 0.03, mortar * 0.6) * mix(1.0, 0.8 + 0.4 * nz.g, isBrick);
  alb *= mix(1.0, 0.72 + 0.5 * nz.r, isRoof + isLawn * 0.8 + isField);
  alb *= mix(1.0, 0.75 + 0.5 * nzBig.a, isLawn + isField);
  vec3 col;
  float alpha = 1.0;
  vec3 bulbs = vL.rgb * vL.rgb;
  if (dk < 0.5) {
    // THE BRIGHT SIDE: night fill, moon, baked sodium lamps, the bulbs' colour times the wave, the thin place
    float hemi = 0.5 + 0.5 * n.y;
    vec3 light = mix(vec3(0.016, 0.022, 0.045), vec3(0.05, 0.07, 0.14), hemi) * shade;
    light += vec3(0.16, 0.19, 0.27) * max(dot(n, uMoon), 0.0) * shade;
    light += (vec3(0.085, 0.105, 0.15) * isLawn + vec3(0.030, 0.040, 0.075) * step(6.5, kind) * step(kind, 7.5)) * smoothstep(0.5, 0.9, n.y);   // round four: the sky's own light on grass and walk (never near black)
    light += vec3(1.0, 0.58, 0.24) * vL.a * vL.a * 3.2;
    { vec3 bl = bulbs * (waveAmp(d) * 3.4 + waveHot(d) * 1.3) * mix(1.0, 0.45, isRoof); light += bl / (1.0 + 0.9 * max(bl.r, max(bl.g, bl.b))); }   // (round six: eased at the top: no wall under the strings is blown white)
    light += spill(vW, n, 0.0);
    light += hearth(vW, n) * 0.85;
    // the first snow lies whole on the roofs and thin on the lawns: the grass shows through it in patches
    float cover = mix(0.55 + 0.45 * nz.a, smoothstep(0.40, 0.56, nz.a * 0.42 + nzBig.g * 0.26 + texture2D(uNoise, vW.xz * 0.83).r * 0.2 + texture2D(uNoise, vW.xz * 3.7).g * 0.12), isLawn);
    alb = mix(alb, vec3(0.62, 0.66, 0.72), uSnow * (isRoof + isLawn) * smoothstep(0.3, 0.8, n.y) * cover);
    col = alb * light;
    if (uRoad > 0.5 || (kind > 13.5 && kind < 14.5)) {
      // the wet road: dark gloss (round six: opaque; nothing is mirrored in it but the night sky in its kerb puddles)
      // ROUND FIVE (E2): CRISP, NEVER A SMEAR. Wet reaches and drier patches meet along clear edges; shallow puddles
      // lie along the kerbs (flat dark mirrors with their own outline); thin sealed cracks wander over the crown; the
      // stone's grain catches the lights as fine glints near the lens
      vec2 mmR = abs(mod(vP + 40.0, 80.0) - 40.0); float latR = min(mmR.x, mmR.y);
      float wetN = nzBig.r * 0.5 + nz.a * 0.3 + texture2D(uNoise, vW.xz * 0.47 + 0.11).r * 0.2;
      float wet = smoothstep(0.455, 0.515, wetN);
      float pud = smoothstep(0.585, 0.61, texture2D(uNoise, vW.xz * 0.21 + 0.3).a * 0.62 + nzBig.g * 0.22 + smoothstep(2.4, 4.3, latR) * 0.2) * step(latR, 4.44);
      float crk = (1.0 - smoothstep(0.003, 0.011, abs(texture2D(uNoise, vW.xz * 0.16 + 0.53).r - 0.5))) * smoothstep(34.0, 7.0, dist) * (1.0 - pud);
      wet = max(wet, pud);
      float fres = pow(clamp(1.0 - max(dot(V, n), 0.0), 0.0, 1.0), 3.0);
      // a real wet street: dark, with a fine sharp grain of stone that catches the lights as small glints
      float fine = texture2D(uNoise, vW.xz * 2.3).g, finer = texture2D(uNoise, vW.xz * 9.1 + 0.37).g;
      float grainA = clamp(0.55 + 0.6 * (fine - 0.5) + 0.9 * (finer - 0.5), 0.15, 1.4);
      vec3 asph = vec3(0.050, 0.053, 0.063) * grainA * mix(0.95, 0.60, wet) * (1.0 - 0.55 * crk) * (1.0 - 0.6 * pud);
      float mid = texture2D(uNoise, vW.xz * 1.3 + 0.7).g;
      float glint = smoothstep(0.66, 0.8, finer) * (0.4 + 0.6 * fine) + smoothstep(0.78, 0.84, mid) * smoothstep(40.0, 4.0, dist) * (0.5 + 0.5 * wet) * 1.4;
      col = asph * light + vec3(0.020, 0.028, 0.056) * fres * (0.6 + 0.4 * wet) + (bulbs * waveAmp(d) + vec3(1.0, 0.58, 0.24) * vL.a * vL.a * 0.8) * (fres * 0.3 + glint * 0.55);
      // ROUND THREE: the strings' light lies on the wet road as SOFT POOLS OF COLOUR under each string (no upright
      // streak, no mirrored arc): the baked colour of the bulbs overhead, held to the 3 to 4 m under them, swelling
      // as a front passes
      col += spill(vW, n, 0.0) * (0.10 + 0.3 * fres) * (0.55 + 0.45 * wet);   // and a leaf's pale light, as a pool before it
      float pm = max(bulbs.r, max(bulbs.g, bulbs.b));
      col += bulbs * (0.5 + 0.5 * smoothstep(0.01, 0.06, pm)) * (0.3 + 0.6 * (waveAmp(d) - 0.333)) * (0.55 + 0.45 * wet) * 1.0;   // (half as strong as round three's: at 4.2 and a swell of 1.5 a front turned 15 m of road into a pale gold floor)
      // (round six) NOTHING IS MIRRORED IN THE ROAD: it is opaque; only its small kerb puddles hold the night sky, each with a crisp outline
      col *= 1.0 - 0.5 * (0.3 + 0.62 * fres) * (0.3 + 0.7 * wet) * (1.0 - pud);
      col += vec3(0.016, 0.024, 0.052) * pud * (0.5 + 1.5 * fres);
      // ROUND FOUR: THE ROAD IS NEVER NEAR BLACK. Between the pools the wet road holds the sheen of the sky, and the
      // moon lays a path of glints along it
      col += vec3(0.0075, 0.0105, 0.021) * (0.55 + 0.45 * wet) * (0.7 + 0.6 * grainA);
      float mg = pow(max(dot(reflect(-V, normalize(n + vec3(fine - 0.5, 0.0, finer - 0.5) * 0.16)), uMoon), 0.0), 90.0);
      col += vec3(0.42, 0.46, 0.56) * mg * (0.2 + 0.8 * smoothstep(0.5, 0.78, finer)) * (0.35 + 0.65 * wet);
      // LEAVES IN DRIFTS along the kerbs and scattered over the crown (painted in the fallen leaves' own three colours;
      // the loose leaves of the litter lie among them)
      { vec2 mmB = abs(mod(vP + 40.0, 80.0) - 40.0); float latB = min(mmB.x, mmB.y);
        // (round six) each fleck is a leaf's size (a hand across), so that near the lens one leaf can be told from the
        // next; deep drifts along the kerbs, and bands of them blown across the roadway
        float f1 = texture2D(uNoise, vW.xz * 0.115 + 0.17).g, f2 = texture2D(uNoise, vW.zx * 0.19 + 0.41).g, f3 = texture2D(uNoise, vW.xz * 0.9 + 0.6).a;
        float bandL = smoothstep(0.58, 0.72, texture2D(uNoise, vec2((vW.x + vW.z) * 0.033, (vW.x - vW.z) * 0.006 + 0.35)).r);
        float thick = min(smoothstep(2.2, 4.2, latB + (nz.r - 0.5) * 1.5 + (nzBig.a - 0.5) * 1.2) * 0.9 + smoothstep(0.56, 0.72, nzBig.g * 0.6 + f3 * 0.4) * 0.4 + bandL * 0.55, 1.25);
        float fleck = smoothstep(0.80 - 0.42 * thick, 0.86 - 0.42 * thick, f1 * 0.55 + f2 * 0.45) * smoothstep(110.0, 40.0, dist);
        float fc = texture2D(uNoise, vW.zx * 0.115 + 0.67).g;   // one colour to a leaf
        vec3 leafC = fc < 0.42 ? vec3(0.50, 0.17, 0.04) : fc < 0.56 ? vec3(0.56, 0.36, 0.07) : fc < 0.7 ? vec3(0.34, 0.09, 0.03) : vec3(0.30, 0.17, 0.07);
        col = mix(col, leafC * (0.7 + 0.6 * f2) * (light * 0.85 + vec3(0.02, 0.026, 0.045)), fleck * 0.92); }
      // (round seven: NO SEAM ON THE GROUND AT THE PLANE: the frost's edge, its fan and its tongues are gone: the road
      // is wet where it is seen alive and packed snow where it is seen dead, by the law alone)
      alpha = 1.0;
    }

    float isSmooth = step(4.5, kind) * step(kind, 5.5);
    if (isSmooth > 0.5) {
      // paint and metal: a lit edge where it turns from the eye, and the lights' colours lying on what looks up
      float fr = pow(clamp(1.0 - max(dot(V, n), 0.0), 0.0, 1.0), 2.5);
      col += (bulbs * waveAmp(d) * 3.2 + vec3(1.0, 0.58, 0.24) * vL.a * vL.a * 2.2 + vec3(0.04, 0.055, 0.11)) * (fr * 0.7 + 0.4 * smoothstep(0.55, 0.95, n.y));
    }
    if (isPane > 0.5) {
      float blind = 0.55 + 0.45 * smoothstep(0.55, 0.62, vT.y) + 0.25 * sin(vT.x * 40.0) * 0.0;
      float glow = vC.a * (0.7 + 0.3 * nz.g);
      vec3 lit = alb * glow * 5.5 * mix(1.0, 0.62, blind) ;
      vec3 glass = vec3(0.012, 0.016, 0.03) + vec3(0.05, 0.06, 0.10) * pow(clamp(1.0 - max(dot(V, n), 0.0), 0.0, 1.0), 2.0);
      col = mix(glass + bulbs * waveAmp(d) * 0.6, lit, step(0.02, vC.a));
      // (round eight, B2) a face of a lit room behind an open shop front (the class 0.3): flat, by its own glow
      if (vT.z > 0.25 && vT.z < 0.35) col = alb * (0.08 + 2.3 * vC.a) * (0.88 + 0.12 * nz.g);
    }
    // (round eight, D1) THE WATER TOWER, ALIVE, IS PAINTED AND LIT: floods at its foot throw a warm light up its legs
    // and under its tank, strongest on the tank's lower courses (uLift.x marks the tower's own material)
    if (uLift.x > 0.5 && isPane < 0.5) col += alb * vec3(1.0, 0.74, 0.44) * (0.5 + 0.5 * smoothstep(0.0, 0.5, vW.y / max(uTow.z, 0.1) / 30.0)) * (0.55 + 0.45 * smoothstep(-0.9, 0.3, -n.y)) * 1.5;
  } else {
    // THE DEAD LOOK (round six; round seven: DEAD, by the law, on either copy): THE SAME TOWN FROZEN UNDER A CLEAR NIGHT. Colour is gone from every surface; rime on
    // what faces the standing wind and on what looks up; snow on the ground. THE MOON IS THE KEY LIGHT (low in the west
    // by south, cool blue-white): what looks toward it is lit, what is turned from it stands in the sky's clear deep
    // blue (never black, never grey). No tint lies on any surface: only LIGHTS are warm, and the snow close under them.
    float grey = dot(alb, vec3(0.3, 0.5, 0.2));
    float isBark = step(3.5, kind) * step(kind, 4.5), lace = step(14.5, kind);
    vec3 base = mix(vec3(0.040, 0.052, 0.086), vec3(0.165, 0.200, 0.290), smoothstep(0.05, 0.55, grey)) * (1.0 - 0.6 * isBark) * (1.0 - 0.72 * lace);   // walls from deep to mid blue-grey by their own paint's value (each building its own: no row is one navy block); bark dark where no rime sits
    base *= 1.0 + 0.7 * isBrick * smoothstep(0.2, 0.45, grey);   // (round eight, B4: a buff or a limestone front stands a clear step paler than a red one beside it: no row is one navy)
    // the standing wind blows toward a far point in the west (uEye): rime grows on what faces AWAY from it, and on what looks up
    vec2 wd = normalize(vW.xz - uWind + vec2(1e-3));
    float facing = dot(n, normalize(vec3(wd.x, 0.45, wd.y)));
    float rime = smoothstep(0.02, 0.7, facing + (nz.r - 0.5) * 0.5 + (nzBig.r - 0.5) * 0.3);
    // on a wall the wind drives the rime on in long streaks and leaves the courses and the boards showing through it:
    // no wall is one flat white
    float wallish = clamp(isWall + isBrick, 0.0, 1.0) * step(abs(n.y), 0.5);
    float streak = texture2D(uNoise, vec2((abs(n.x) > abs(n.z) ? vW.z : vW.x) * 0.043 + vW.y * 0.011, vW.y * 0.31)).r;
    rime = mix(rime, rime * (0.07 + 0.25 * streak) * (1.0 - 0.34 * isBrick * (1.0 - mortar) * smoothstep(70.0, 22.0, dist)) * (1.0 - 0.2 * lap), wallish);
    rime *= 1.0 - 0.4 * isBrick * step(abs(n.y), 0.5) * (1.0 - mortar);   // round four: brick shows through its rime (a store's wall is no plain white sheet); the courses hold the frost
    float hoar = (0.06 + 0.12 * nz.g + 0.3 * mortar + 0.24 * step(8.5, kind) * step(kind, 9.5)) * (1.0 - isPane);   // thin hoar frost on the lee sides too (round six: a wall stays dark under it, a trunk's lee side stays dark)
    rime = max(rime, hoar);
    // no wall is a near-black block (round three): every clapboard is edged white with rime along its lower lip
    float lipN = smoothstep(60.0, 18.0, dist) * lapFade, lip = isWall * step(abs(n.y), 0.5) * mix(0.12, 0.07 + smoothstep(0.0, 0.2, abs(fract(vW.y * 3.3) - 0.5) * 2.0 - 0.78) * (0.34 + 0.16 * nz.g), lipN);   // (round seven, E2: broad courses, a low contrast, gone where a course is sampled by fewer than four fragments)
    rime = max(rime, lip);
    // THE GROUND LIES UNDER SNOW (round six): lawns, verges and fields whole and pale, the walks trodden
    float isWalk = step(6.5, kind) * step(kind, 7.5) * smoothstep(0.5, 0.9, n.y);
    rime = max(rime, (isLawn * mix(0.16, 1.0, smoothstep(0.25, 0.65, n.y)) + isField + step(12.5, kind)) * (0.68 + 0.26 * nz.g));   // (round eight, C2: a hedge's sides are a dark body under its white top)
    rime = max(rime, isWalk * (0.52 + 0.3 * nz.g));
    // (round eight: a kerb's face is under snow too: seen dead no kerb is a dark line across the white)
    rime = max(rime, step(6.5, kind) * step(kind, 7.5) * (1.0 - smoothstep(0.16, 0.3, vW.y)) * (0.6 + 0.2 * nz.g));
    // ROOFS (round five): no blank pale roof. The pitch turned from the wind carries the white crust in wind ridges; the
    // lee pitch is bare dark shingle under streaks of thin hoar
    float hoarR = texture2D(uNoise, vec2(dot(vW.xz, vec2(-wd.y, wd.x)) * 0.9, vW.y * 0.23 + dot(vW.xz, wd) * 0.05)).r;
    rime = max(rime, isRoof * smoothstep(0.2, 0.6, n.y) * (0.56 + 0.2 * nz.g + 0.2 * smoothstep(0.5, 0.72, hoarR)));   // (round six) snow lies on every pitch
    // (round eight, C5: NO TREE IS A FLAT WHITE CUT-OUT) the twigs' lace is DARK WOOD at its heart, where it leaves the
    // bough, and white with rime out along its tips; a comb's needles and the ice are white whole
    rime = max(rime, lace * mix(0.10, 0.96, smoothstep(0.26, 0.70, laceR + (nz.g - 0.5) * 0.2)));
    // (round eight, B4, C5) SNOW LIES ON EVERY LEDGE: a cornice's top, a sill, a pier's head, a bough's upper side
    rime = max(rime, smoothstep(0.55, 0.9, n.y) * (0.80 + 0.12 * nz.g) * (1.0 - isPane) * (1.0 - lace));
    rime = max(rime, step(4.5, kind) * step(kind, 5.5) * (0.24 + 0.62 * smoothstep(0.2, 0.8, n.y) + 0.2 * nz.g));   // (round eight, C2: white on top, its sides darker)   // paint and metal (casings, posts, rails, cars): furred, white on top
    rime = max(rime, uLift.x * (1.0 - isPane) * (1.0 - 0.9 * isBark) * (0.85 + 0.15 * nz.g));   // (round eight, D1: its legs, braces and seams stay DARK iron)   // (round seven) a thing furred all over with long rime (the water tower): white from every side
    // (round seven, E2: no roof beats; r8d, B: the allowed use of a fragment's reach) a roof's wind ridges fade TO THEIR
    // OWN COUNTED MEAN (RIDGE_MEAN) where one is sampled by fewer than four fragments: the faded roof has the drawn
    // roof's mean tone
    float rph = dot(vW.xz, vec2(-wd.y, wd.x)) * 7.3 + vW.y * 2.0;
    float ridge = isField * 0.6 * smoothstep(160.0, 40.0, dist) * (0.5 + 0.5 * sin(dot(vW.xz, vec2(-wd.y, wd.x)) * 3.1 + nz.a * 6.0)) + isRoof * 0.7 * mix(${glf(RIDGE_MEAN)}, smoothstep(${glf(RIDGE.lo)}, ${glf(RIDGE.hi)}, 0.5 + 0.5 * sin(rph + nz.a * 5.0)), 1.0 - smoothstep(0.5, 1.5, fwidth(rph)));
    vec3 rimeCol = mix(vec3(0.30, 0.38, 0.54), vec3(0.86, 0.91, 0.98), 0.55 + 0.45 * shade) * (1.0 - 0.2 * ridge);
    vec3 albD = mix(base, rimeCol, clamp(rime, 0.0, 1.0));
    // (round seven) the fallen leaves' heaps lie under the snow as low drifts; none lies on a roadway's snow
    { vec2 mmL = abs(mod(vP + 40.0, 80.0) - 40.0); if (kind > 12.5 && kind < 13.5 && min(mmL.x, mmL.y) < 4.3) discard; }
    float ndv = clamp(dot(V, n), 0.0, 1.0), ndk = dot(n, uKey);
    float hemi = mix(0.5 + 0.5 * n.y, 0.9, lace);                              // the twigs' lace takes the sky's light from every side (its shade slot: how far its clump is turned to the moon)
    // THE SKY'S FILL: a clear deep blue from above (snow in shade is deep clear blue)
    vec3 light = vec3(0.027, 0.044, 0.108) * (0.45 + 0.55 * hemi) * mix(shade, 0.55 + 0.45 * shade, lace);   // (round seven, C7: the shade is a deeper blue)
    // the moonlit snow all round throws its light back up onto every wall and under every eave (shade is deep blue, never black)
    light += vec3(0.032, 0.048, 0.100) * (1.0 - smoothstep(-0.2, 0.9, n.y)) * (1.0 - lace) * shade;
    // THE MOON, the key light, wrapped a little: the level snow (18 degrees under its light) is pale blue-white; a
    // crown's clumps turned to the moon are bright, the far side of the crown stays in the sky's blue
    float upK = smoothstep(0.2, 0.7, n.y);   // (an upright wall takes the moon plainly: turned from it, it stands in the sky's blue)
    // (round eight, C2: A FULL RANGE EVERYWHERE ON THE DEAD SIDE: the wrap is plain, so a pitch turned to the moon is near white,
    // the level snow a clear mid blue, a pitch or a drift's side turned from it deep blue)
    float kd = mix(mix(clamp((ndk + 0.06) / 1.06, 0.0, 1.0), clamp((ndk + 0.3) / 1.3, 0.0, 1.0), upK) * shade, 0.02 + 0.80 * smoothstep(0.25, 0.95, vT.z), lace);
    kd = max(kd, 0.26 * isLawn * (1.0 - lace) * smoothstep(0.2, 0.5, n.y) * shade);   // (a snowed heap's or a bank's side turned from the moon is a mid blue: no dark crescent lies on the snow)
    // (round eight, D1) THE WATER TOWER'S LONG MOON SHADOW lies across ground, roofs and crowns
    kd *= 1.0 - 0.93 * towerShade(vW, uKey, uTow);
    light += MOONC * kd * 1.22;
    // (round seven, C6) in the shade the snow takes a faint green and violet from the northern lights
    // ROUND EIGHT (C1): THE NORTHERN LIGHTS LIGHT THE SNOW. What is turned to the sky takes a clear breath of their
    // green, brighter under a brighter ribbon, moving on the world's clock; what is upright and turned from the moon
    // stands in a deep violet-blue
    { float aur = auroraOver(vW.xz), upA = smoothstep(0.2, 0.75, n.y);
      light += vec3(0.022, 0.118, 0.060) * (0.25 + 0.75 * aur) * upA * mix(1.0, 0.3, lace) * (0.5 + 0.5 * shade) * (0.12 + 0.88 * clamp(kd * 2.0, 0.0, 1.0));
      light += vec3(0.040, 0.014, 0.085) * (1.0 - upA) * (1.0 - clamp(kd * 2.0, 0.0, 1.0)) * (1.0 - lace) * shade; }
    // flying into the moon: what looks up carries a bright rim where the eye looks toward it (the snow's own path of
    // light on a street, a roof's pitch seen along its fall, a cornice's and a drift's top)
    float sheen = pow(1.0 - ndv, 3.0) * smoothstep(0.15, 0.9, dot(-V, uKey)) * smoothstep(0.15, 0.6, n.y) * clamp(rime * 1.4, 0.0, 1.0) * (1.0 - lace);
    light += MOONC * sheen * 0.35;
    // THE GHOSTS ARE THE DEAD SIDE'S ONLY OWN LIGHT (round seven, C2): no lamp burns, no window glows, no warm wash
    // lies anywhere. The bulbs' baked light lies on the rime and snow within about 3 m of them as a breath of cold
    // white at rest, stronger for the third of a second in which the wave's front passes (the cure of round eight, B2:
    // none of the living bulb's colour is in it)
    float since = waveSince(d), wk = clamp(1.0 - since / 0.333, 0.0, 1.0);
    float upF = smoothstep(0.35, 0.7, n.y) * (1.0 - isRoof);
    bulbs *= mix(1.0, smoothstep(0.5, 0.92, vC.a), isRoof * step(0.004, vC.a));   // a dyed eave: the colour keeps to the roof's edge
    bulbs = mix(bulbs, min(bulbs * 0.22, vec3(0.11)), isBark);   // round four: a wound trunk stays a rimed trunk with separate bulbs on it
    bulbs *= smoothstep(mix(0.10, 0.085, upF), mix(0.24, 0.21, upF), max(bulbs.r, max(bulbs.g, bulbs.b)));   // (the bake reaches 8 m: the colour is held to about 3 m of its bulbs)
    vec3 pale = vec3(dot(bulbs, vec3(0.34))) * vec3(0.86, 0.93, 1.0);   // (the cure of round eight, B2: cold white: none of the living bulb's colour lies on the rime, at rest or under a front)
    light += pale * (0.035 + mix(0.6, 1.0, upF) * wk * wk) * mix(1.0, 0.55, lace);
    // (round eight, C3: A BROAD FAN OF AMBER: where a leaf's light lies, the moon's blue gives way to it: the snow there
    // is amber and gold, not white)
    // (a kerb's snowed face is no wall: across the street from a leaf it took a breath of the amber and lay as a thin
    // dull red line along the white road; it keeps the moon's light alone)
    { vec3 sp = spillO(vW, n, 1.0, lace) * (1.0 - step(6.5, kind) * step(kind, 7.5) * (1.0 - smoothstep(0.16, 0.3, vW.y)) * (1.0 - smoothstep(0.35, 0.8, n.y)));
      float sw = clamp(sp.r, 0.0, 1.0); light = light * (1.0 - 0.86 * sw) + sp * 1.3; }
    light *= uLift.y;
    col = albD * light;
    // glints on the rime and the snow near the eye
    // (round seven, F) the frost's glints come and go on the world's clock: crystals flashing in the moon
    float gl = step(0.985, texture2D(uNoise, vW.xz * 1.9 + vW.y * 1.3 + V.xz * 0.35 + uTime * 0.012).g) * rime * smoothstep(30.0, 6.0, dist);
    col += vec3(0.9, 0.95, 1.0) * gl * 1.1;
    if (isPane > 0.5) {
      // glass grown with frost ferns from the corners inward
      // (round eight, C2: WINDOWS ARE DARK AGAINST THE WHITE: the ferns keep nearer the casing; B4: A SHOP'S GLASS (the
      // open front's class 0.1, the display's 0.65) is dark and all but clear of them; E3: A CAR'S GLASS (class 0.4) is
      // clear of them whole: under its pillows of snow a car shows a crisp band of dark glass all round, never a white
      // slab with a dark blot in it)
      float carG = step(0.35, vT.z) * step(vT.z, 0.45), shopG = step(vT.z, 0.2) + step(0.6, vT.z) * step(vT.z, 0.7) + carG;
      float edge = max(abs(vT.x - 0.5), abs(vT.y - 0.5)) * 2.0;
      float grow = smoothstep(mix(0.36, 0.66, shopG), mix(0.98, 1.08, shopG), edge * 0.72 + abs(vT.x - 0.5) * abs(vT.y - 0.5) * 2.6 + (nz.r - 0.5) * 0.3 + (nz.g - 0.5) * 0.12);
      vec4 fz = texture2D(uNoise, vec2(vW.x + vW.z, vW.y) * 0.83 + 0.21);
      float vein = max(1.0 - smoothstep(0.0, 0.09, abs(fz.r - 0.5)), 1.0 - smoothstep(0.0, 0.06, abs(fz.b - 0.45)));
      float fern = clamp(grow * (0.38 + 0.62 * vein) + smoothstep(0.7, 1.0, grow), 0.0, 1.0) * (1.0 - carG);
      // (round seven, C1) NO WINDOW IS LIT ON THE DEAD SIDE AT REST: dark glass with a faint glint of the moon; as the
      // wave's front passes, every pane that is lit on the living side answers with ONE COLD FLICKER
      float flick = smoothstep(0.0, 0.04, since) * (1.0 - smoothstep(0.07, 0.30, since)) * step(0.5, vT.z);
      vec3 glass = vec3(0.012, 0.020, 0.050) + vec3(0.015, 0.024, 0.06) * smoothstep(0.25, 0.85, vT.y) + (vec3(0.04, 0.06, 0.12) + MOONC * 0.30 * max(ndk, 0.0)) * pow(1.0 - ndv, 2.0);
      // (round eight, B4) DARK GLASS FAINTLY MIRRORS THE NORTHERN LIGHTS: the band stands in each pane by the bearing its
      // mirror looks along (a pane turned to the north holds it; one turned to the south holds none)
      { vec3 rr = reflect(-V, n); glass += auroraBand(atan(-rr.z, -rr.x), 0.04 + 0.92 * vT.y) * mix(0.16, 0.40, shopG) * (0.55 + 0.45 * pow(1.0 - ndv, 2.0)); }
      vec3 ghost = vec3(0.26, 0.36, 0.60) * flick * (0.5 + 0.5 * nz.g);
      col = mix(glass + ghost, rimeCol * light * 0.85 + ghost * 0.4, fern);
    }
    float isIce = max(uRoad, step(13.5, kind) * step(kind, 14.5));
    if (isIce > 0.5) {
      // THE ROADS ARE PACKED SNOW (round six): pale, with two pairs of darker tyre tracks, low drift ridges across,
      // drifts at the kerbs, sparkle near the lens. NOTHING IS MIRRORED in it: no bulb, no lamp, no ring, no sky. What
      // lies on it is laid over it: the long blue shadows, the lamps' gold pools, the strings' pools of colour
      vec2 mm = abs(mod(vP + 40.0, 80.0) - 40.0);
      float lat = min(mm.x, mm.y);
      float fine = texture2D(uNoise, vW.xz * 1.7).g;
      // ROUND EIGHT (B4: NO BARE STRIPED ROAD): THE RUTS WANDER. Each wheel line strays up to a metre from its lane, on
      // its own slow course; a rut is deep in one reach and snowed over in the next; the drifts reach in from the kerbs
      // in long tongues
      vec4 wn = texture2D(uNoise, vW.xz * 0.0137 + 0.31), wn2 = texture2D(uNoise, vW.zx * 0.0291 + 0.67);
      float wobA = (wn.r - 0.5) * 2.1 + (wn2.a - 0.5) * 0.8 + (nz.a - 0.5) * 0.12, wobB = (wn.a - 0.5) * 2.1 + (wn2.r - 0.5) * 0.8 + (nz.a - 0.5) * 0.12;
      // (a wheel runs 1.35 and 3.05 m from a street's centre line, either side; at a crossing both streets' tracks lie)
      float tx = max(1.0 - smoothstep(0.13, 0.38, abs(mm.x + wobA - 1.35)), 1.0 - smoothstep(0.13, 0.38, abs(mm.x + wobB - 3.05))) * step(mm.x, 4.5);
      float ty = max(1.0 - smoothstep(0.13, 0.38, abs(mm.y + wobA - 1.35)), 1.0 - smoothstep(0.13, 0.38, abs(mm.y + wobB - 3.05))) * step(mm.y, 4.5);
      float track = max(tx, ty) * (0.75 + 0.25 * nz.g) * mix(0.22, 1.0, smoothstep(0.36, 0.56, texture2D(uNoise, vW.zx * 0.023 + 0.19).a));
      float drift = smoothstep(3.55, 4.3, lat + (nz.r - 0.5) * 0.9 + (fine - 0.5) * 0.3 + max(texture2D(uNoise, vW.xz * 0.017 + 0.5).a - 0.42, 0.0) * 5.0);
      // low ridges the wind has laid across the roadway
      float rdg = texture2D(uNoise, vec2(dot(vW.xz, vec2(-wd.y, wd.x)) * 0.045, dot(vW.xz, wd) * 0.33)).a;
      float rid = smoothstep(0.50, 0.66, rdg) * (1.0 - track);
      vec3 snowR = rimeCol * (0.74 + 0.10 * fine + 0.14 * rid) * (1.0 - 0.42 * track);   // (round seven, C7: the ruts cut deeper)
      snowR = mix(snowR, rimeCol * (0.92 + 0.08 * fine), drift);
      vec3 lightR = light * (1.0 + 0.10 * (rid - 0.4) * (1.0 - drift));
      // the packed tracks are glazed: they hold a little of the moon's path
      lightR += MOONC * track * sheen * 0.35;
      col = snowR * lightR + vec3(0.9, 0.95, 1.0) * gl * 1.1 * (0.6 + 0.4 * drift);
      alpha = 1.0;
    }
  }
  col = fogOf2(col, vW, eye, dk);
  // (the cure of round eight, A1) nothing seen through a leaf is red: a crown stands in copper and gold, a red wall in brown and amber
  if (dk < 0.5 && eye.x <= -80.0) col = noRed(col, kind > 10.5 && kind < 11.5 ? 0.06 : 0.0);
  gl_FragColor = vec4(col, alpha);
}`;
// the surface material of one copy (dark 0 or 1); road: the wet road or the black ice, drawn in the transparent pass
export function makeSurface(shared, dark, road = false, doubleSide = false, only = false) {
  return new THREE.ShaderMaterial({
    // (round seven) uKey: the unit vector toward the dead look's moon, uWind: the point its standing wind blows toward, each in the copy's own lie of the plan
    uniforms: { ...shared, uDark: { value: dark ? 1 : 0 }, uRoad: { value: road ? 1 : 0 }, uOnly: { value: only === 2 ? 2 : only ? 1 : 0 },
      uTow: { value: dark ? new THREE.Vector3(...darkW(K.TOWER[0], K.TOWER[1]), K.TS) : new THREE.Vector3(K.TOWER[0], -K.TOWER[1], K.TS) }, uLift: { value: new THREE.Vector2(0, 1) }, uKey: { value: dark ? new THREE.Vector3(0.1324, 0.3090, 0.9418) : new THREE.Vector3(-0.9418, 0.3090, 0.1324) }, uWind: { value: dark ? new THREE.Vector2(...windWorld()) : new THREE.Vector2(K.WIND[0], -K.WIND[1]) } },
    vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    transparent: road, depthWrite: true,
  });
}

export function makeMover(shared, dark) { const m = makeSurface(shared, dark, false, true); m.vertexShader = SURF_MOVE_VERT; return m; }
// the movers' geometry: the Geo's own, and for each point its thing's pivot, axis and swing. list: rows
// [first point, end, pivot x y z, axis x y z, mode, amplitude, rate, phase] (mode 0 a swing, 1 a vane; mode 2 a wire's
// span from the 'pivot' to the 'axis' point: each point gets its share of the sag and the level direction it sways along)
export function moverGeometry(g, list) {
  const geo = g.toGeometry(), n = g.nv, P = geo.attributes.position.array, piv = new Float32Array(n * 3), ax = new Float32Array(n * 4), sw = new Float32Array(n * 3);
  for (const m of list) for (let i = m[0]; i < m[1]; i++) {
    if (m[8] === 2) {
      const dx = m[5] - m[2], dz = m[7] - m[4], t = clamp(((P[i * 3] - m[2]) * dx + (P[i * 3 + 2] - m[4]) * dz) / (dx * dx + dz * dz), 0, 1), ns = Math.abs(dx) < Math.abs(dz);
      ax[i * 4] = ns ? 1 : 0; ax[i * 4 + 2] = ns ? 0 : 1; ax[i * 4 + 3] = 2; sw[i * 3] = 4 * t * (1 - t);
    } else {
      const l = Math.hypot(m[5], m[6], m[7]) || 1;
      piv[i * 3] = m[2]; piv[i * 3 + 1] = m[3]; piv[i * 3 + 2] = m[4];
      ax[i * 4] = m[5] / l; ax[i * 4 + 1] = m[6] / l; ax[i * 4 + 2] = m[7] / l; ax[i * 4 + 3] = m[8]; sw[i * 3] = m[9]; sw[i * 3 + 1] = m[10]; sw[i * 3 + 2] = m[11];
    }
  }
  geo.setAttribute('aPiv', new THREE.BufferAttribute(piv, 3)); geo.setAttribute('aAx', new THREE.BufferAttribute(ax, 4)); geo.setAttribute('aSw', new THREE.BufferAttribute(sw, 3));
  return geo;
}

// ---------------------------------------------------------------------------------------------- bulbs and their ghosts
// One instanced quad for each bulb: [p, y, -q] in the build axes, its colour, its plan distance d and its place in
// the string. The same instances serve the bright copy (the bulb) and the dark copy (its ghost). A bulb whose plan
// place lies beyond its copy's side of the plane is not drawn there. (Round six: no light has an image in any road.)
export function makeDabGeometry(all, pick = null) {
  const bulbs = pick ? all.filter(pick) : all, n = bulbs.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const P = new Float32Array(n * 3), C = new Uint8Array(n * 4), D = new Float32Array(n * 2);
  let x0 = 1e9, x1 = -1e9, y1 = 0, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < n; i++) {
    const b = bulbs[i]; P[i * 3] = b[0]; P[i * 3 + 1] = b[2]; P[i * 3 + 2] = -b[1];
    _c.set(typeof b[3] === 'string' ? b[3] : BULBS[b[3]]); C[i * 4] = Math.round(Math.sqrt(_c.r) * 255); C[i * 4 + 1] = Math.round(Math.sqrt(_c.g) * 255); C[i * 4 + 2] = Math.round(Math.sqrt(_c.b) * 255); C[i * 4 + 3] = b[6] === 2 ? 128 : b[6] ? 255 : 0;   // 255: it hangs (and sways); 128: a window's or a lamp's light (on the dark side it rests warm, at about a half)
    D[i * 2] = b[4]; D[i * 2 + 1] = b[5];
    x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[0]); y1 = Math.max(y1, b[2]); z0 = Math.min(z0, -b[1]); z1 = Math.max(z1, -b[1]);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(C, 4, true)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(D, 2));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 * 2 + 12, z1 - z0) / 2 + 4);
  return g;
}
const DAB_VERT = /* glsl */`
attribute vec3 aP; attribute vec4 aB; attribute vec2 aD;
uniform float uDark; uniform float uH; uniform float uSize; uniform float uSteady; uniform float uGain; uniform float uMoth; uniform float uAll; uniform float uCap; uniform float uDim; uniform float uLo; uniform float uLive;
varying vec2 vUv; varying vec3 vCol; varying float vAmp; varying float vHot; varying float vFog; varying float vFront; varying float vK; varying float vDk; varying float vOff; varying float vFar; varying float vLit;
${GLSL_COMMON}
void main(){
  vec3 lp = aP;
  float hung = step(0.9, aB.a);
  // strings sway a hand's breadth; the hanging ones (aB.a) most
  lp.x += sin(uTime * 0.9 + aD.x * 0.17) * 0.05 * hung; lp.z += cos(uTime * 0.7 + aD.x * 0.13) * 0.04 * hung;
  if (uMoth > 0.5) {
    // moths about a lamp: each on its own small restless orbit (aD.x its reach, aD.y its seed)
    float w = 1.6 + fract(aD.y * 0.37) * 2.6, ph = aD.y * 6.1;
    lp += vec3(cos(uTime * w + ph) + 0.4 * sin(uTime * w * 2.3 + ph), 0.45 * sin(uTime * w * 1.7 + ph * 2.0) - 0.3, sin(uTime * w + ph) + 0.4 * cos(uTime * w * 1.9 + ph)) * aD.x;
  }
  float keep = max(uAll, uDark > 0.5 ? step(0.0, -aP.z) : step(-80.0, aP.x));
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  // THE LAW OF THE LEAVES (round seven), for each light by its own place: seen alive it is the bulb, seen dead its
  // ghost. A lamp's, a window's or a moth's light (uLive, or the flag 128) is the living look's alone: seen dead it is
  // not drawn (no lamp burns and no window glows on the dead side)
  float dkk = deadAt(cameraPosition, wp.xyz);
  vDk = dkk; vOff = step(0.25, aB.a) * step(aB.a, 0.75);
  keep *= 1.0 - dkk * max(uLive, vOff);
  vec4 mv = viewMatrix * wp;
  float since = waveSince(aD.x), k = clamp(1.0 - since / 1.2, 0.0, 1.0), amp = 0.333 + 0.667 * k * k;
  // (the chase: every third bulb a little brighter, stepping along the string each 0.4 s; where its round of
  // three steps stands is the seed's: uChase, 0 to 1.2 s, from a stream of its own)
  float chase = step(mod(aD.y - floor((uTime + uChase) / 0.4), 3.0), 0.5);
  amp *= 1.0 + 0.22 * chase;
  amp = mix(amp, 1.0, max(uSteady, vOff * 0.8));
  float hk = clamp(1.0 - since / 0.45, 0.0, 1.0);
  vAmp = amp * uGain; vHot = hk * hk * (1.0 - uSteady);
  // (round seven) a ghost flares for the third of a second in which the wave's front passes it: vFront
  { float fl = clamp(1.0 - since / 0.333, 0.0, 1.0); vFront = fl * fl * (1.0 - uSteady); } vK = k * k * (1.0 - uSteady);
  // THE GHOST BULBS BLINK ON THE WORLD'S CLOCK (round eight, the cure, B1), by each bulb's own dice (its plan distance
  // and its number on its string) and by no place: EACH AT ITS OWN SLOW RATE (a round of 5 to 13 s, of which it stands
  // dark for a part: a few for half of it, most for a tenth: at any moment about four in five are lit), going out and
  // coming on in a seventh of a second; and SHORT RUNS ALONG A STRING: in a stretch of 24 bulbs, one round of 3.4 s in
  // three, a brightness starts at a dealt bulb, runs ten bulbs a second along the string and dies within eleven bulbs.
  // vLit: 0 dark .. 1 lit at rest .. 2 at a run's head
  vLit = 1.0;
  if (dkk > 0.5) {
    float g1 = fract(sin(aD.x * 3.171 + aD.y * 7.913) * 8431.57), g2 = fract(sin(aD.x * 5.417 + aD.y * 2.339 + 1.7) * 6217.93), g3 = fract(g1 * 37.7 + g2 * 11.3);
    float T = mix(5.0, 13.0, g1), x = fract(uTime / T + g2), dsh = mix(0.07, 0.5, g3 * g3), e = 0.14 / T;
    vLit = 1.0 - (smoothstep(0.0, e, x) - smoothstep(dsh, dsh + e, x));
    vec2 cl = floor(aP.xz / 16.0); float ic = floor(aD.y / 24.0), ch = fract(sin(cl.x * 3.917 + cl.y * 7.133 + ic * 1.931) * 5273.19);
    float ep = uTime / 3.4 + ch, e0 = floor(ep), rh = fract(sin((e0 + ch * 57.0) * 2.713) * 7919.31), i = aD.y - ic * 24.0 - fract(rh * 29.7) * 13.0;
    // how far this bulb stands from the running light's head, in bulbs of its width (it goes negative: its square
    // is written as a product, never as a pow of a negative base)
    float runAt = (i - (ep - e0) * 34.0) / 1.4;
    float run = step(rh, 0.3) * step(0.0, i) * (1.0 - smoothstep(5.0, 11.0, i)) * exp(-runAt * runAt);
    vLit = max(vLit, run) + run;
  }
  float s = (dkk > 0.5 ? 0.19 * (0.8 + 0.35 * amp) : 0.26 * (0.8 + 0.45 * amp)) * uSize;   // a ghost's disc is 0.34 to 0.44 m across: neighbours 0.45 m apart on a string stand apart
  float dist = length(mv.xyz);
  // THE ONE DECLARED EXCEPTION OF THIS WORLD, AND THE ONLY PLACE WHERE THE LENS'S ANGLE AND THE PICTURE'S HEIGHT ARE
  // READ (the brief's: "no bulb or ghost larger than about 14 px on a 640 px still, each fading inside 8 m of the
  // lens", "a floor of about 1.6 px"): a dab of light keeps a floor and a cap counted in pixels (px, unit) and thins
  // away inside 8 m of the lens. THE LEAD ALLOWS IT FOR EVERY DAB OF LIGHT THIS SHADER DRAWS (r8d, F4), not for the
  // strings' bulbs and their ghosts alone: the street lamps' heads and their ghosts, the porch lanterns, the far
  // houses' window glows, the far lamps and the moths are dabs too, and each keeps the same floor and cap.
  // WHAT ELSE READS THE PICTURE'S SIZE (r8d, B2; the earlier words here, that nothing else does, were wrong): a
  // FRAGMENT'S REACH (fwidth: how much of the world one fragment of the picture covers) is read in the surfaces'
  // shader, where a clapboard wall's lines, its rime's lip, a brick wall's courses and a roof's wind ridges fade to
  // their own means, and in the leaf's, where an edge finer than one fragment is drawn as the same light spread
  // over that fragment. That is the allowed use of a fragment's reach: it chooses between a pattern and that
  // pattern's own mean and changes no mean tone, no size and no light. Nothing else in either file reads the lens's
  // angle or the picture's size, and nothing else thins by nearness to the eye but the medium's law (a leaf's light
  // and the dust thin inside 0.6 to 2.5 m). (Fine detail does grow plainer with true distance: haze, the levels of
  // detail, lines too fine to draw.)
  float px = max(-mv.z, 0.1) * 2.0 / max(projectionMatrix[1][1] * uH, 1.0);   // metres to one pixel, at the dab's depth
  float unit = px * uH / 360.0;                                                // metres to one 360th of the picture's height
  // never under a clear point (a ghost: 2.6 such units across), never over uCap of them in radius
  float lo = dkk > 0.5 ? uLo * unit : 1.25 * px;
  float s2 = min(max(s, lo), max(uCap * unit, lo));
  if (dkk < 0.5) vAmp *= clamp((s * s) / (s2 * s2), 0.12, 1.0);   // drawn larger it is fainter; held smaller it is never brighter
  vFar = smoothstep(30.0, 110.0, dist);
  // and it thins away inside 8 m of the lens (by place): no bulb or ghost passes the lens as a blob
  vAmp *= dkk > 0.5 ? smoothstep(3.0, 8.0, dist) : smoothstep(1.5, 8.0, dist);
  if (dkk > 0.5) vHot = smoothstep(40.0, 150.0, dist);   // a ghost far off (seen from the air) is held a clear point
  vec2 c = position.xy;
  vUv = c;
  mv.xy += c * s2 * keep;
  vCol = aB.rgb * aB.rgb;
  if (dkk < 0.5 && cameraPosition.x <= -80.0) vCol = noRed(vCol, 0.2);   // (A1: a red bulb seen through a leaf is an amber one)
  vFog = exp(-dist * 0.0013) * uDim;
  gl_Position = projectionMatrix * mv;
}`;
const DAB_FRAG = /* glsl */`
precision highp float;
uniform float uDark; uniform float uSoft;
varying vec2 vUv; varying vec3 vCol; varying float vAmp; varying float vHot; varying float vFog; varying float vFront; varying float vK; varying float vDk; varying float vOff; varying float vFar; varying float vLit;
void main(){
  float r2 = dot(vUv, vUv);
  vec3 col;
  if (vDk < 0.5) {
    float core = smoothstep(0.20, 0.05, r2) * (1.0 - uSoft), halo = exp(-r2 * 4.5) * (1.0 - smoothstep(0.7, 1.0, r2)) * (1.0 + 1.6 * uSoft);
    vec3 hot = mix(vCol, vec3(1.0, 0.97, 0.9), (0.25 + 0.6 * vHot) * (1.0 - 0.9 * vFar));   // (round six) far off a bulb keeps its own colour: no white blot where the street ends
    col = (hot * core * mix(4.2, 2.3, vFar) + vCol * halo * 0.9) * vAmp;
  } else {
    // THE GHOST (round seven; the cure of round eight, B: THE GHOST BULBS CARRY THE DEAD SIDE): the dead bulb's ghost
    // is A LIT BULB OF COLD WHITE with the least blue, plainly seen at rest on every rimed string from the street's
    // length and from the air; most are lit and some stand dark, each blinking at its own slow rate, with short runs
    // along a string (vLit). It is NEVER WARM, NEVER COLOURED, NEVER RED: none of the living bulb's colour is in it, at
    // rest or as the wave's front passes (then it flares whiter for a third of a second).
    vec3 c = mix(vec3(0.86, 0.93, 1.0), vec3(0.94, 0.97, 1.0), max(vFront, clamp(vLit - 1.0, 0.0, 1.0)));
    float disc = exp(-r2 * 3.4) * (1.0 - smoothstep(0.6, 1.0, r2));
    // (vHot: far off, 40 to 150 m, a ghost is drawn as a clear point larger than its bulb: there its heart is the whole
    // point, a fine point of white, and its soft disc is a quarter as strong: a far string is a fine row of points,
    // and where many strings stand one behind another they are never a blaze)
    float heart = exp(-r2 * mix(22.0, 7.0, vHot)) * (1.0 - uSoft);
    float lvl = max(max(0.62 * min(vLit, 1.0), 0.05), max(vFront, 0.85 * clamp(vLit - 1.0, 0.0, 1.0)));
    col = c * (disc * mix(0.55, 1.25, vFront) * mix(1.0, 0.27, vHot) + heart * (2.2 + 0.8 * vFront) * mix(1.0, 0.6, vHot)) * lvl * min(vAmp * 3.0, 1.0);
  }
  gl_FragColor = vec4(col * vFog, 1.0);
}`;
export function makeDabMaterial(shared, dark, size = 1, steady = false, cap = 7) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uDark: { value: dark ? 1 : 0 }, uSize: { value: size }, uSteady: { value: steady ? 1 : 0 }, uGain: { value: 1 }, uMoth: { value: 0 }, uAll: { value: 0 }, uCap: { value: cap }, uDim: { value: 1 }, uLo: { value: 1.05 }, uSoft: { value: 0 }, uLive: { value: steady ? 1 : 0 } },
    vertexShader: DAB_VERT, fragmentShader: DAB_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// ---------------------------------------------------------------------------------------------- pools of light on the ground
// A POOL (round three): the light of one lamp, window or string lying on the ground below it: a flat soft patch, round
// (a lamp's) or a soft square (below a window), instanced; light only (added to what lies under it). A pool is
// [p, q, y, colour, d, half width, half depth, dir p, dir q, kind]. KINDS (round six): 0 a lamp's round pool; 1 a
// window's patch (inside a band only); 2 a far house's patch; 3 a far lamp's round pool (on the bright side: a steady
// lamp's); 4 a shop window's panel; 5 the patch of a window that glows at rest. ON THE DARK SIDE a lamp's pool rests
// at half strength and half its width (about 8 m across) and is full and twice as wide inside a band; a rest-lit
// window's patch rests at 0.45, a shop's panel at 0.75; on the bright side a pool is its own colour, swelling with
// the wave.
export function makePoolGeometry(list) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]), 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
  const P = new Float32Array(n * 3), C = new Uint8Array(n * 4), D = new Float32Array(n * 4), E = new Float32Array(n);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < n; i++) {
    const b = list[i]; P[i * 3] = b[0]; P[i * 3 + 1] = b[2]; P[i * 3 + 2] = -b[1];
    _c.set(typeof b[3] === 'string' ? b[3] : BULBS[b[3]]); C[i * 4] = Math.round(Math.sqrt(_c.r) * 255); C[i * 4 + 1] = Math.round(Math.sqrt(_c.g) * 255); C[i * 4 + 2] = Math.round(Math.sqrt(_c.b) * 255); C[i * 4 + 3] = Math.round((b[9] || 0) * 51);   // the kind, 0 to 5
    D[i * 4] = b[5]; D[i * 4 + 1] = b[6]; D[i * 4 + 2] = b[7]; D[i * 4 + 3] = -b[8]; E[i] = b[4];
    x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[0]); z0 = Math.min(z0, -b[1]); z1 = Math.max(z1, -b[1]);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(C, 4, true)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(D, 4)); g.setAttribute('aE', new THREE.InstancedBufferAttribute(E, 1));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2 || 0, 0, (z0 + z1) / 2 || 0), (Math.hypot(x1 - x0, z1 - z0) / 2 || 0) + 30);
  return g;
}
const POOL_VERT = /* glsl */`
attribute vec3 aP; attribute vec4 aB; attribute vec4 aD; attribute float aE;
uniform float uDark; uniform float uGain;
varying vec2 vUv; varying vec3 vCol; varying float vSq; varying float vFog; varying float vBand; varying float vK; varying vec3 vWp; varying vec2 vPl;
${GLSL_COMMON}
void main(){
  // across: along the wall (or any way, for a round pool); deep: out from the wall, along (aD.z, aD.w)
  vec3 deep = vec3(aD.z, 0.0, aD.w), across = vec3(-aD.w, 0.0, aD.z);
  vec3 lp = aP + across * position.x * aD.x + deep * position.z * aD.y;
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vec4 mv = viewMatrix * wp;
  float since = waveSince(aE), k = clamp(1.0 - since / 1.2, 0.0, 1.0);
  vBand = bandAt(aE, vec2(aP.x, -aP.z)); vK = k * k;
  vUv = position.xz; vCol = aB.rgb * aB.rgb; vSq = aB.a;
  // (a pool is light lying on the ground, a shade the moon's shadow on the snow: neither is a medium and neither
  // reads how near the eye is; only the far air dims them)
  vFog = exp(-length(mv.xyz) * 0.0013) * uGain;
  // (round seven) vWp: the fragment's place, for the law of the leaves; vPl: the dark plan's place
  vWp = wp.xyz;
  vPl = vec2(-160.0 - wp.z, -80.0 - wp.x);
  gl_Position = projectionMatrix * mv;
}`;
const POOL_FRAG = /* glsl */`
precision highp float;
uniform float uDark;
varying vec2 vUv; varying vec3 vCol; varying float vSq; varying float vFog; varying float vBand; varying float vK; varying vec3 vWp; varying vec2 vPl;
${GLSL_COMMON}
void main(){
  // (round seven) A POOL OF LIGHT IS THE LIVING LOOK'S ALONE, on either copy, by the law of the leaves, per fragment:
  // seen dead, the ground under a lamp or a window is dark snow
  if (deadAt(cameraPosition, vWp) > 0.5) discard;
  float kind = floor(vSq * 5.0 + 0.5), r2 = dot(vUv, vUv);
  float sqr = step(0.5, kind) * step(kind, 2.5) + step(3.5, kind), farP = step(1.5, kind) * step(kind, 3.5);
  float sq = (1.0 - smoothstep(0.3, 1.0, abs(vUv.x))) * (1.0 - smoothstep(0.1, 1.0, abs(vUv.y))) * (0.55 + 0.45 * (1.0 - vUv.y));
  float round = exp(-r2 * mix(3.2, 1.7, farP)) * (1.0 - smoothstep(0.55, 1.0, r2));
  // a lamp's pool is steady, and DAPPLED by the leaf shadows of the crown it shines through (the bright copy's kind 3;
  // the dark copy's kinds 0 and 3); a string's pool (the bright copy's kind 0) swells with the wave
  float lampy = step(2.5, kind) * step(kind, 3.5) + uDark * step(kind, 0.5);
  float dap = mix(1.0, 0.22 + 0.78 * smoothstep(0.40, 0.60, texture2D(uNoise, vPl * 0.21).b * 0.55 + texture2D(uNoise, vPl * 0.47 + 0.3).r * 0.45), lampy);
  float lvl = uDark > 0.5 ? (kind < 0.5 ? 0.16 : kind < 1.5 ? 0.12 : kind < 2.5 ? 0.5 : kind < 3.5 ? 0.6 : kind < 4.5 ? 0.3 : 0.12) : mix(0.2 + 0.5 * vK, 0.34, step(2.5, kind));
  gl_FragColor = vec4((cameraPosition.x <= -80.0 ? noRed(vCol, 0.2) : vCol) * lvl * mix(round, sq, sqr) * dap * vFog, 1.0);   // (A1: no red pool through a leaf)
}`;
// THE MOON'S SHADOWS on the dark side's snow (round six): the same flat patches, drawn as deep clear blue shade
// instead of light. A shade is a pool row whose d slot holds its strength: a house's is a soft-ended bar that runs
// from its foot away from the moon (east by north, three times its height), a tree's a long soft oval. They lie on
// lawns, walks and the snow roads alike (across the first dark street, toward the lens on Main Street); not drawn on
// the living side.
const SHADE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vSq; varying float vFog; varying float vBand; varying float vK; varying vec3 vWp; varying vec2 vPl;
${GLSL_COMMON}
void main(){
  if (deadAt(cameraPosition, vWp) < 0.5) discard;   // (round seven) the moon's shadows are the dead look's alone
  // (round eight, C2: LONG, CLEAR SHADOWS: a bar's sides are crisp and it keeps its strength to four fifths of its
  // length; a crown's shadow is dappled: boughs and gaps)
  float bar = (1.0 - smoothstep(0.80, 1.0, abs(vUv.x))) * (1.0 - smoothstep(0.72, 1.0, vUv.y)) * smoothstep(-1.0, -0.94, vUv.y);
  float r2 = dot(vUv, vUv), oval = (1.0 - smoothstep(0.40, 1.0, r2)) * (0.55 + 0.45 * smoothstep(0.36, 0.58, texture2D(uNoise, vWp.xz * 0.27).r));
  gl_FragColor = vec4(vec3(0.020, 0.036, 0.100), mix(oval, bar, step(0.5, vSq)) * vFog * vBand);
}`;
export function makeShadeMaterial(shared) {
  // vFog carries the strength: the vertex shader's uGain is the whole mesh's, the wave's slots are not read
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uDark: { value: 1 }, uGain: { value: 0.95 } }, vertexShader: POOL_VERT.replace('waveSince(aE)', '0.0').replace('bandAt(aE, vec2(aP.x, -aP.z))', 'aE'), fragmentShader: SHADE_FRAG,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, side: THREE.DoubleSide,
  });
}
// a body's shadow as a shade row: (p, q) the middle of its foot, hw and hl its half sizes across and along `face`
// (a unit plan vector), H its height; sun: [dp, dq, cot] the plan way the shadows fall and metres of shadow to a metre of height
export function shadeOf(p, q, hw, hl, face, H, sun, strength = 1, round = 0) {
  const al = Math.abs(face[0] * sun[0] + face[1] * sun[1]), ac = Math.abs(face[0] * sun[1] - face[1] * sun[0]), L = H * sun[2];
  const across = hw * al + hl * ac, along = hw * ac + hl * al, hz = (L + 2 * along) / 2;
  return [p + sun[0] * (hz - along), q + sun[1] * (hz - along), K.KERB + 0.05, 0, strength, across, hz, sun[0], sun[1], round ? 0 : 5];
}
export function makePoolMaterial(shared, dark, gain = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uDark: { value: dark ? 1 : 0 }, uGain: { value: gain } }, vertexShader: POOL_VERT, fragmentShader: POOL_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------------------------------------- falling leaves
// LEAVES THAT FALL FROM THE TREES (bright side; a medium): each leaf belongs to one column under one tree's crown and
// falls from the crown to the ground for ever on the world clock, fluttering and drifting at most 1.95 m from its
// column (0.35 + 1.32 m one way, 0.3 + 0.66 m the other). A column stands only where it keeps 8.25 m in plan from the
// bright route's line (and no more than 24 m, where a leaf still shows as a leaf), so that NO LEAF COMES WITHIN 6 m
// OF THE LENS at any moment: a clear tube round the line. Returns Float32Array, 7 numbers a leaf:
// p, y0 (where it leaves the crown), -q, phase, speed (m/s), size (m), colour index.
export function dealLeafFall(seed, n, cols, dark = false) {
  // cols: the clumps [p, q, y, r] of the standing leaf trees whose leaves fall (the world gathers them as it builds
  // the trees, so that no skeleton is made twice: the bright copy's crowns within a block's length of the bright
  // line, the dark copy's about the leaves the dark line passes close by)
  const R = routes(), T = dark ? R.dark : R.bright, r = lotRng(seed, dark ? 'leaf-columns-dark' : 'leaf-columns'), lineD = (p, q) => { let best = 1e18; for (let m = 0; m < T.length; m += 3) { const dx = T[m][0] - p, dq = T[m][1] - q, d = dx * dx + dq * dq; if (d < best) best = d; } return Math.sqrt(best); };   // every third metre of the line: 0.14 m coarse at 8 m, kept by the margin below
  const far = dark ? 90 : 24;   // (round seven) on the dark copy the fall is seen through great leaves from far off
  cols = cols.filter((c) => { const d = lineD(c[0], c[1]); return d > 2 && d < far + 6; });   // only crowns that reach the band
  const out = [];
  for (let k = 0, tries = 0; out.length < n * 7 && tries < n * 8 && cols.length; tries++, k++) {
    const c = cols[Math.floor(r() * cols.length)], a = r() * 6.283, rad = Math.sqrt(r()) * (0.95 * c[3] + 0.4), p = c[0] + Math.cos(a) * rad, q = c[1] + Math.sin(a) * rad, y0 = c[2] - 0.2;
    const ph = r(), sp = r.range(0.75, 1.35), size = r.range(0.09, 0.15) * (dark ? 1.6 : 1), ci = Math.floor(r() * 3);
    if (y0 < 2.5 || (!dark && p < -77.5)) continue;
    const best = lineD(p, q);
    if (best < 8.25 || best > far) continue;   // beyond 24 m a leaf is a speck: the fall is kept where it shows as leaves
    out.push(p, y0, -q, ph, sp, size, ci);
  }
  return new Float32Array(out);
}
const LEAF_VERT = /* glsl */`
attribute vec3 aP; attribute vec4 aR; attribute vec3 aC;
varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying float vFace; varying float vD;
${GLSL_COMMON}
void main(){
  float T = aP.y / max(aR.y, 0.05);            // seconds from the crown to the ground
  float tau = mod(uTime + aR.x * T, T), ph = aR.x * 39.7;
  float dr = min(tau, 22.0);                   // it drifts 1.3 m at most on its way down (a fall lasts 22 s at most)
  vec3 c = vec3(aP.x + 0.35 * sin(tau * 1.9 + ph) + 0.06 * dr, aP.y - aR.y * tau + 0.05, aP.z + 0.3 * cos(tau * 1.5 + ph * 1.7) + 0.03 * dr);
  // it tumbles: its two axes turn as it falls
  float a1 = tau * (2.2 + fract(ph) * 2.0) + ph, a2 = tau * 1.3 + ph * 2.0;
  vec3 e1 = normalize(vec3(cos(a1), 0.5 * sin(a2), sin(a1)));
  vec3 e2 = normalize(cross(e1, vec3(sin(a2) * 0.7, 1.0, cos(a2) * 0.7)));
  float grow = smoothstep(0.0, 0.5, tau) * smoothstep(0.0, 0.3, T - tau);
  vec3 cw = (modelMatrix * vec4(c, 1.0)).xyz;
  vec3 wp = cw + (e1 * position.x + e2 * position.y * 0.66) * aR.z * grow;
  vUv = position.xy; vCol = aC; vW = wp; vFace = abs(normalize(cross(e1, e2)).y); vD = abs(aP.x) + abs(aP.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  // (round seven) a falling leaf is the living look's alone: where it is seen dead it is not drawn (nothing falls there)
  if (deadAt(cameraPosition, cw) > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const LEAF_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying float vFace; varying float vD;
${GLSL_COMMON}
void main(){
  // a small leaf: a pointed blade with shallow lobes and a stalk
  float w = (1.0 - vUv.x * vUv.x) * (0.72 + 0.28 * cos(vUv.x * 8.5)) * step(-0.82, vUv.x);
  float stalk = step(vUv.x, -0.8) * step(abs(vUv.y), 0.09);
  if (abs(vUv.y) > w && stalk < 0.5) discard;
  vec3 light = vec3(0.09, 0.11, 0.18) + vec3(1.0, 0.74, 0.44) * (0.38 + 0.6 * vFace) * (0.6 + 0.6 * waveAmp(vD));
  vec3 col = vCol * light * (0.8 + 0.2 * step(abs(vUv.y), 0.06));
  col = fogOf2(col, vW, cameraPosition, 0.0);
  if (cameraPosition.x <= -80.0) col = noRed(col, 0.06);   // (A1: no red leaf falls behind a leaf)
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeLeafFall(shared, data) {
  const g = new THREE.InstancedBufferGeometry(), n = data.length / 7, Pp = new Float32Array(n * 3), Rr = new Float32Array(n * 4), C = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  for (let i = 0; i < n; i++) {
    const o = i * 7; Pp[i * 3] = data[o]; Pp[i * 3 + 1] = data[o + 1]; Pp[i * 3 + 2] = data[o + 2]; Rr[i * 4] = data[o + 3]; Rr[i * 4 + 1] = data[o + 4]; Rr[i * 4 + 2] = data[o + 5]; Rr[i * 4 + 3] = 0;
    _c.set(LEAFC[data[o + 6]]); C[i * 3] = _c.r * 1.5; C[i * 3 + 1] = _c.g * 1.5; C[i * 3 + 2] = _c.b * 1.5;
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(Pp, 3)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(Rr, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 3));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...shared }, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------- diamond dust
// THE DEAD AIR (a medium): NOTHING FALLS. It holds DIAMOND DUST (the real thing of clear hard frost: tiny crystals
// that hang in still air and flash): motes that hang, breathe a hand's breadth up and down, ride slowly along the
// standing wind, and FLASH as a face of each comes round to the moon; none sinks, none is a streak.
// EVERY MOTE HAS A PLACE OF THE WORLD, dealt by a rule of the plan (makeDust): the dust hangs in the air the dead
// line passes through: a tube about the dark line, within DUST.reach of it in the plan and within DUST.band of its
// height. ITS DENSITY IS THE MEASURE (r8d, C; the lead's): ONE MOTE TO EACH DUST.air CUBIC METRES OF THE TUBE'S AIR.
// The count to a metre of the line (DUST.per) is not typed: it follows from the tube's own cross-section, 2 reach
// broad and 2 band high. Each is drawn at its own size wherever it hangs; nothing of it reads the eye but
// THE MEDIUM'S LAW: it thins by true distance inside 0.6 to 2.5 m of the eye. BY THE LAW OF THE LEAVES a mote is
// drawn only where its own place is seen dead.
export const DUST = { reach: 12, band: 6, air: 50, ride: 24, get per() { return (2 * this.reach) * (2 * this.band) / this.air; } };
const DUST_VERT = /* glsl */`
attribute vec3 aP; attribute vec4 aR;
uniform float uGain; uniform vec4 uDrift;
varying vec2 vUv; varying vec3 vCol;
${GLSL_COMMON}
void main(){
  // its ride on the standing wind (uDrift.xyz: the wind's way; uDrift.w: the seconds a ride of DUST.ride metres
  // takes at the wind's pace): from one end to the other and round again on the world's clock, each at its own pace
  // and phase, faded out at the two ends of its ride
  float f = fract(uTime * (0.5 + aR.x) / uDrift.w + aR.y);
  vec3 p = aP + uDrift.xyz * (f - 0.5);
  p.y += 0.10 * sin(uTime * (0.21 + 0.3 * aR.y) + aR.w * 40.0);
  p.x += 0.08 * sin(uTime * (0.17 + 0.2 * aR.w) + aR.x * 31.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = length(mv.xyz);
  // it flashes each time a face comes round to the moon: long faint, then a short bright glint (a mote is lit a
  // fifteenth of the time: the air holds a scatter of glints, never a fall of flakes); as it flashes it is twice its size
  float turn = pow(max(sin(uTime * (0.9 + 2.2 * aR.w) + aR.x * 80.0), 0.0), 40.0);
  mv.xy += position.xy * aR.z * (1.0 + turn) * step(0.05, p.y);
  vec3 light = vec3(0.006, 0.010, 0.024) + MOONC * (0.006 + 2.4 * turn);   // a mote is next to nothing until it flashes
  float a = smoothstep(0.0, 0.04, f) * (1.0 - smoothstep(0.96, 1.0, f)) * uGain;
  // THE MEDIUM'S LAW, by true distance, and nothing wider
  a *= smoothstep(0.6, 2.5, dist);
  a *= deadAt(cameraPosition, p);
  vCol = light * a; vUv = position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec3 vCol;
void main(){ float r2 = dot(vUv, vUv); gl_FragColor = vec4(vCol * exp(-r2 * 2.6) * (1.0 - smoothstep(0.6, 1.0, r2)), 1.0); }`;
// n motes from the given stream, each [a metre of the dark line, a place beside it, a height about the line's]; none
// east of the plane (the dust is the dead town's) and none under 0.3 m. size: [least, most] metres across. The
// wind: 0.1 m a second toward the west of the dark plan.
export function makeDust(shared, rng, n, size = [0.014, 0.034]) {
  const g = new THREE.InstancedBufferGeometry(), Pp = new Float32Array(n * 3), Rr = new Float32Array(n * 4), T = routes().dark;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  for (let i = 0; i < n; i++) {
    const t = T[Math.min(T.length - 1, Math.floor(rng() * T.length))], w = darkW(t[0] + (rng() * 2 - 1) * DUST.reach, Math.max(0.5, t[1] + (rng() * 2 - 1) * DUST.reach));
    Pp[i * 3] = w[0]; Pp[i * 3 + 1] = Math.max(0.3, t[2] + (rng() * 2 - 1) * DUST.band); Pp[i * 3 + 2] = w[1];
    Rr[i * 4] = rng(); Rr[i * 4 + 1] = rng(); Rr[i * 4 + 2] = (size[0] + (size[1] - size[0]) * rng()) * 0.5; Rr[i * 4 + 3] = rng();
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(Pp, 3)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(Rr, 4));
  g.instanceCount = n;
  const wind = new THREE.Vector3(0.012, 0.004, 0.1), pace = wind.length(); wind.multiplyScalar(DUST.ride / pace);
  const mat = new THREE.ShaderMaterial({ uniforms: { ...shared, uGain: { value: 1 }, uDrift: { value: new THREE.Vector4(wind.x, wind.y, wind.z, DUST.ride / pace) } }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 6;
  return mesh;
}

// ---------------------------------------------------------------------------------------------- chimney smoke
// CHIMNEY SMOKE (round seven, F; a medium; the kit's columns could not keep the law): from each chimney on the list
// [p, y, q] ten soft puffs rise for ever on the world clock, each 14 s from the pot to 10 m over it, growing from 0.5
// to 3 m across, leaning one way on the light air, lit warm from below at the pot and blue-grey by the night above.
// THE LIVING LOOK'S ALONE, by the law of the leaves PER FRAGMENT: seen through a leaf a column is cut at the leaf's
// outline; where its place is seen dead there is none (no fire burns on the dead side).
const SMOKE_VERT = /* glsl */`
attribute vec3 aP; attribute vec2 aR;
varying vec2 vUv; varying vec3 vW; varying float vT; varying float vS;
${GLSL_COMMON}
void main(){
  float t = fract(uTime / 14.0 + aR.x), s = aR.y;
  vec3 lp = aP + vec3(0.6 * t + 4.2 * t * t + 0.35 * sin(t * 9.0 + s * 40.0), 0.3 + 10.0 * t - 1.6 * t * t, 0.25 * t + 1.5 * t * t + 0.3 * cos(t * 7.0 + s * 31.0));
  vec4 mv = viewMatrix * modelMatrix * vec4(lp, 1.0);
  float size = 0.56 + 2.4 * t;
  mv.xy += position.xy * size;
  vW = (inverse(viewMatrix) * mv).xyz; vUv = position.xy; vT = t; vS = s;
  gl_Position = projectionMatrix * mv;
}`;
const SMOKE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec3 vW; varying float vT; varying float vS;
${GLSL_COMMON}
void main(){
  if (deadAt(cameraPosition, vW) > 0.5) discard;
  float r2 = dot(vUv, vUv);
  // (a puff is no disc: its rim is broken by two sizes of billow, and it thins evenly from its middle outward)
  vec2 q = vUv * 0.5 + vec2(vS * 7.0, vT * 0.9 + vS * 3.0);
  float n = texture2D(uNoise, q).r, n2 = texture2D(uNoise, q * 2.7 + 0.37).g;
  float rr = r2 * (0.55 + 0.8 * n + 0.7 * n2);
  float a = pow(max(1.0 - rr, 0.0), 1.6) * smoothstep(0.0, 0.05, vT) * pow(clamp(1.0 - vT, 0.0, 1.0), 1.1) * 0.7;
  // pale grey in the moon and the town's own glow (the night sky behind it is far darker), warm from below at the pot
  vec3 col = vec3(0.150, 0.165, 0.215) * (0.7 + 0.6 * n) * (0.7 + 0.5 * vUv.y) + vec3(0.34, 0.19, 0.08) * pow(clamp(1.0 - vT, 0.0, 1.0), 4.0) * (0.6 - 0.4 * vUv.y);
  col = fogOf2(col, vW, cameraPosition, 0.0);
  if (cameraPosition.x <= -80.0) col = noRed(col, 0.0);
  gl_FragColor = vec4(col, a);
}`;
export function makeSmoke(shared, list, NP = 16) {
  const n = list.length * NP, g = new THREE.InstancedBufferGeometry(), P = new Float32Array(n * 3), Rr = new Float32Array(n * 2);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < list.length; i++) for (let k = 0; k < NP; k++) {
    const o = i * NP + k, c = list[i], h = Math.abs(Math.sin(c[0] * 12.37 + c[2] * 7.13)) % 1;
    P[o * 3] = c[0]; P[o * 3 + 1] = c[1]; P[o * 3 + 2] = -c[2]; Rr[o * 2] = (k + h) / NP; Rr[o * 2 + 1] = (h * 17 + k * 0.37) % 1;
    x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); z0 = Math.min(z0, -c[2]); z1 = Math.max(z1, -c[2]);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(Rr, 2));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2 || 0, 10, (z0 + z1) / 2 || 0), (Math.hypot(x1 - x0, z1 - z0) / 2 || 0) + 30);
  const mat = new THREE.ShaderMaterial({ uniforms: { ...shared }, vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, mat); mesh.matrixAutoUpdate = false; mesh.renderOrder = 3.5;
  return mesh;
}

// ---------------------------------------------------------------------------------------------- the rime's feathers: drawing
// One flat card, instanced, cut by the shader into A FROND OF RIME (round seven; it was a blade of a spine and three
// teeth, which at 1 to 3 m read as a white bird): a fine spine with many slim barbs on both sides, swept toward the
// tip, broadest near its foot and running to a point; far off the barbs close into one slim leaf of frost. It catches
// the moon's light on the face turned to it, takes a breath of the ghosts' cold white as a front passes, and glints near the eye.
const RIME_VERT = /* glsl */`
attribute vec3 aP; attribute vec3 aW; attribute vec4 aR;
varying vec3 vW; varying vec3 vN; varying float vX; varying float vY; varying vec3 vTint; varying float vSeed;
${GLSL_COMMON}
void main(){
  float len = length(aW);
  vec3 W = aW / max(len, 1e-4);
  vec3 up = abs(W.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 A0 = normalize(cross(W, up)), B0 = cross(W, A0);
  float cr = cos(aR.x), sr = sin(aR.x);
  vec3 A = A0 * cr + B0 * sr;
  vec3 lp = aP + (W * position.x + A * position.y) * len;
  vec4 w = modelMatrix * vec4(lp, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * cross(W, A)); vX = position.x; vY = position.y; vSeed = aR.w;
  float wk = clamp(1.0 - waveSince(aR.y) / 1.2, 0.0, 1.0);
  float ti = aR.z;
  vec3 tc = ti < -0.5 ? vec3(0.0) : ti < 0.5 ? vec3(0.76, 0.04, 0.03) : ti < 1.5 ? vec3(0.03, 0.42, 0.07) : ti < 2.5 ? vec3(0.03, 0.16, 0.74) : ti < 3.5 ? vec3(1.0, 0.44, 0.012) : ti < 4.5 ? vec3(1.0, 0.16, 0.43) : vec3(0.9, 0.87, 0.74);
  float fl = clamp(1.0 - waveSince(aR.y) / 0.333, 0.0, 1.0);
  vTint = vec3(dot(tc, vec3(0.34))) * vec3(0.86, 0.93, 1.0) * (0.07 + 1.1 * fl * fl);   // (round seven) a feather by a dead bulb holds a breath of its ghost's light, more as the front passes (the cure of round eight, B2: cold white, none of the bulb's colour)
  gl_Position = projectionMatrix * viewMatrix * w;
  // (round seven) the rime is the dead look's alone: a feather whose own place is seen alive is not drawn
  if (deadAt(cameraPosition, (modelMatrix * vec4(aP, 1.0)).xyz) < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const RIME_FRAG = /* glsl */`
precision highp float;
varying vec3 vW; varying vec3 vN; varying float vX; varying float vY; varying vec3 vTint; varying float vSeed;
uniform vec3 uKey;
${GLSL_COMMON}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 eye = cameraPosition, V = normalize(eye - vW);
  float dist = length(eye - vW);
  // the frond's cut: ay 0 on the spine, 1 at the card's edge
  float ay = abs(vY) / 0.19, env = pow(clamp(1.0 - vX, 0.0, 1.0), 0.6) * (0.22 + 0.78 * smoothstep(0.0, 0.14, vX));
  float barb = step(fract((vX - ay * 0.34) * 13.0 + vSeed * 7.0), 0.40 + min(dist, 120.0) * 0.005);
  if (ay > env || (barb < 0.5 && ay > 0.10 + min(dist, 150.0) * 0.003)) discard;
  vec3 ice = mix(vec3(0.50, 0.62, 0.82), vec3(0.93, 0.97, 1.0), 0.4 + 0.6 * smoothstep(-0.3, 0.6, n.y)) * (0.8 + 0.2 * vX);
  // a blade of ice in open air: the sky's deep blue from all round, and the moon's cool white through and on it
  vec3 light = vec3(0.045, 0.080, 0.215) * (0.62 + 0.38 * n.y);
  light += MOONC * (0.16 + 0.84 * abs(dot(n, uKey))) * 0.8;
  { vec3 sp = spillO(vW, n, 1.0, 1.0); float sw = clamp(sp.r, 0.0, 1.0); light = light * (1.0 - 0.86 * sw) + sp * 1.3; }   // (round eight, C3: the rime that faces a leaf is warm)
  light += vTint;
  vec3 col = ice * light;
  float gl = step(0.9, fract(vSeed * 91.7 + dot(V, vec3(3.1, 1.7, 2.3)) * 2.0)) * step(0.72, fract(vX * 7.0 + vSeed * 13.0 + dot(V, vec3(5.3, 2.9, 4.1)))) * smoothstep(34.0, 6.0, dist);
  col += vec3(0.9, 0.95, 1.0) * gl * 1.4;
  col = fogOf2(col, vW, eye, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeRimeMaterial(shared, dark = true) {
  return new THREE.ShaderMaterial({ uniforms: { ...shared, uKey: { value: dark ? new THREE.Vector3(0.1324, 0.3090, 0.9418) : new THREE.Vector3(-0.9418, 0.3090, 0.1324) } }, vertexShader: RIME_VERT, fragmentShader: RIME_FRAG, side: THREE.DoubleSide });
}
// data: ten numbers a feather (see dealRime); pick(p, q, sd): which feathers this mesh holds (sd >= 2: the great
// things' own feathers)
export function makeRimeGeometry(data, pick) {
  const g = new THREE.InstancedBufferGeometry(), n0 = data.length / 10, P = [], W = [], Rr = [];
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -0.19, 0, 1, -0.19, 0, 1, 0.19, 0, 0, 0.19, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = 0;
  for (let i = 0; i < n0; i++) {
    const o = i * 10; if (!pick(data[o], -data[o + 2], data[o + 9])) continue;
    P.push(data[o], data[o + 1], data[o + 2]); W.push(data[o + 3], data[o + 4], data[o + 5]); Rr.push(data[o + 6], data[o + 7], data[o + 8], data[o + 9]);
    x0 = Math.min(x0, data[o]); x1 = Math.max(x1, data[o]); z0 = Math.min(z0, data[o + 2]); z1 = Math.max(z1, data[o + 2]); y1 = Math.max(y1, data[o + 1]);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 3)); g.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(W), 3)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(new Float32Array(Rr), 4));
  g.instanceCount = P.length / 3;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2 || 0, y1 / 2, (z0 + z1) / 2 || 0), Math.hypot(x1 - x0, y1, z1 - z0) / 2 + 3 || 1);
  return g;
}

// ---------------------------------------------------------------------------------------------- the dark side's clear night
// ROUND SIX. A dome about the eye. THE SKY IS CLEAR: deep ultramarine overhead, paler toward the horizon, THICK WITH
// STARS (three layers of points, each star a fixed angle of sky across), a faint band
// of the Milky Way across the top, a few long low bars of cloud near the horizon with silver edges (none overhead,
// none before the moon). THE MOON stands low in the west: 18 degrees up, 8 degrees south of Main Street's axis, as
// large as the bright side's (3 degrees of radius), whole, with a soft glow of two moon-widths about it (no ring, no
// shaft). Under the sky's foot: the far snowfields' own colour and a far line of bare woods on the horizon. Beyond the
// second thin place's parted opening the living side's night shows instead (the kit's sky, behind this dome).
// THE NORTHERN LIGHTS: three long FOLDED RIBBONS low from the north-east round by the north to the west-north-west,
// each a strip in the sky's own angles (its bearing doubles back on itself: the folds), made of fine upright rays that
// are brightest at the foot and fade upward, green at the foot to blue-violet at the top; the folds drift slowly
// east, the rays shimmer, the stars show through (light is added, thinly). Every 3.5 s, on the wave's own clock, a
// soft brightening runs once along each ribbon.
const NIGHT_LIB = /* glsl */`
// the bearing of a direction: 0 north (the dark plan's north is world -x), growing toward the east (world -z)
float bearingOf(vec3 dir){ return atan(-dir.z, -dir.x); }
// THE LOW BARS OF CLOUD: a few long thin bars near the horizon (2 to 4 degrees up, each 40 to 55 degrees long, under a
// degree thick, thinner toward its ends), none near the moon: 1 inside a bar; edge: its moonlit upper lip
float barsAt(vec3 dir, out float edge){
  float el = dir.y, b0 = bearingOf(dir), be = b0 + uTime * 0.0006;
  float dm = abs(mod(b0 - bearingOf(KEY) + 3.14159, 6.28318) - 3.14159);
  float keep = smoothstep(0.45, 0.85, dm);
  float wob = (texture2D(uNoise, vec2(be * 0.35, 0.37)).r - 0.5) * 0.010 + (texture2D(uNoise, vec2(be * 1.9, 0.81)).a - 0.5) * 0.003;
  float d0 = 0.0, d1 = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float bc = -1.05 + fi * 0.85, ec = 0.040 + 0.028 * fract(fi * 0.618 + 0.2), hl = 0.36 + 0.14 * fract(fi * 0.38 + 0.5), th = 0.0080 + 0.0050 * fract(fi * 0.71);
    float db = abs(mod(be - bc + 3.14159, 6.28318) - 3.14159) / hl, taper = 1.0 - db * db;
    if (taper > 0.0) {
      float t = th * (0.3 + 0.7 * taper), fade = smoothstep(0.0, 0.3, taper);
      d0 = max(d0, (1.0 - smoothstep(0.5, 1.0, abs(el - ec - wob) / t)) * fade);
      d1 = max(d1, (1.0 - smoothstep(0.5, 1.0, abs(el + 0.0035 - ec - wob) / t)) * fade);
    }
  }
  d0 *= keep; d1 *= keep;
  edge = clamp(d0 - d1, 0.0, 1.0);
  return d0;
}
`;
const NIGHT_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const NIGHT_FRAG = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform float uOpacity;
${GLSL_COMMON}
${NIGHT_LIB}
// ANGLES OF THE SKY, in radians, the same for every eye: STAR_R, a star's disc (its radius, a little more for a
// bright one); SOFT, the softness of the moon's limb and of the far land's edge against the sky.
const float STAR_R = 0.0012;
const float SOFT = 0.0025;
float sh1(vec2 p){ return fract(sin(dot(p, vec2(91.7, 233.3))) * 28461.37); }
vec2 sh2(vec2 p){ return fract(sin(vec2(dot(p, vec2(91.7, 233.3)), dot(p, vec2(173.9, 57.1)))) * 28461.37); }
// one layer of stars on the sky's map (uv: the sky laid flat about the zenith; ang: radians of sky to one unit of the
// map here): n cells to a unit, one star at most to a cell; keep: the share of cells that hold one; tw: the cell's number
float starLayer(vec2 uv, float n, float keep, float ang, float seed, out float tw){
  vec2 g = uv * n, c = floor(g), f = g - c;
  float h = sh1(c + seed), mag = sh1(c * 1.31 + seed + 7.0);
  vec2 o = 0.2 + 0.6 * sh2(c + seed * 1.7);
  // (NOTHING FALLS in this air, so no star may read as a flake: most are faint fine points, a few are bright, none
  // is a round white dot: a star's light falls off with the fifth power of its dice, its disc is STAR_R of sky, and
  // its light stays under the engine's bloom)
  float dd = length(f - o) / n * ang, r = STAR_R * (0.9 + 0.4 * mag * mag);
  tw = h;
  return step(h, keep) * (0.02 + 0.98 * mag * mag * mag * mag * mag) * exp(-dd * dd / (r * r));
}
void main(){
  vec3 dir = normalize(vDir);
  // beyond the second thin place's parted opening the living side's night shows
  if (deadAt(cameraPosition, cameraPosition + dir * 4000.0) < 0.5) discard;   // (round seven) the dead sky stands only where the ray is seen dead: behind it, the living night
  float up = max(dir.y, 0.0), cm = dot(dir, KEY);
  // deep ultramarine overhead (#0a1230), paler toward the horizon (#24365e); the moon's side of the sky a little paler
  vec3 col = mix(vec3(0.0030, 0.0060, 0.0296), vec3(0.0176, 0.0369, 0.1119), pow(clamp(1.0 - up, 0.0, 1.0), 3.2));
  col += vec3(0.010, 0.017, 0.040) * pow(max(cm, 0.0), 5.0);
  col = mix(col, vec3(0.030, 0.056, 0.150), 0.55 * exp(-up * 16.0));
  // THE MILKY WAY: a faint band across the top, from the east-north-east over to the west-south-west, clouded, with a dark lane
  float mwB = dot(dir, vec3(0.883, -0.342, -0.321));
  float mwAl = atan(dot(dir, vec3(-0.342, 0.0, -0.940)), dot(dir, vec3(0.3215, 0.9398, -0.117)));
  vec4 mwN = texture2D(uNoise, vec2(mwAl * 0.42 + 0.3, mwB * 1.6 + 0.5));
  float mwWide = exp(-mwB * mwB / 0.05), mwCore = exp(-mwB * mwB / 0.010);
  float lane = smoothstep(0.50, 0.62, mwN.a) * exp(-(mwB - 0.02) * (mwB - 0.02) / 0.003);
  float moonWash = smoothstep(0.80, 0.97, cm);
  float mw = (0.35 * mwWide + 0.65 * mwCore * (0.35 + 1.1 * mwN.r)) * (1.0 - 0.55 * lane) * smoothstep(0.03, 0.35, dir.y) * (1.0 - moonWash);
  col += vec3(0.020, 0.026, 0.045) * mw;
  // THE STARS: thick and fine
  vec2 uv = dir.xz / (1.0 + up);
  float ang = 1.0 + up, dens = ang * ang * 0.25 * (1.0 + 1.3 * mw);
  float tw1, tw2, tw3;
  float s1 = starLayer(uv, 46.0, 0.55 * dens, ang, 3.0, tw1);
  float s2 = starLayer(uv, 104.0, 0.60 * dens, ang, 11.0, tw2);
  float s3 = starLayer(uv, 230.0, 0.70 * dens, ang, 23.0, tw3);
  float twk = 0.82 + 0.18 * sin(uTime * (2.0 + 4.0 * tw1) + tw1 * 50.0);
  vec3 stars = mix(vec3(0.80, 0.88, 1.0), vec3(1.0, 0.93, 0.84), step(0.82, tw2)) * (s1 * 1.05 * twk + s2 * 0.6 + s3 * 0.32);
  // (round seven) low in the sky, where the northern lights stand, the stars are a third as bright (the thick air near
  // the horizon and the curtains' own light dim them): white points against the curtains read as flakes
  col += min(stars, vec3(0.7)) * smoothstep(0.004, 0.06, dir.y) * (0.3 + 0.7 * smoothstep(0.30, 0.75, dir.y)) * (1.0 - 0.92 * smoothstep(0.90, 0.985, cm));
  // a few long low bars of cloud: dark against the sky's foot, their upper lips silver toward the moon
  float edge; float bar = barsAt(dir, edge);
  float toMoon = dot(normalize(dir.xz + vec2(1e-5)), normalize(KEY.xz)) * 0.5 + 0.5;
  col = mix(col, vec3(0.052, 0.078, 0.160), bar * 0.85) + vec3(0.26, 0.32, 0.46) * edge * (0.35 + 0.65 * toMoon * toMoon);
  // THE MOON: a whole pale disc with its grey seas, a soft glow of two moon-widths about it; no ring
  float dM = acos(clamp(cm, -1.0, 1.0)), R = 0.0524;
  float disc = 1.0 - smoothstep(R - SOFT, R + SOFT, dM);
  vec3 mx = normalize(cross(vec3(0.0, 1.0, 0.0), KEY)), my = cross(KEY, mx);
  vec2 mp = vec2(dot(dir, mx), dot(dir, my)) / R;
  float seas = smoothstep(0.42, 0.64, texture2D(uNoise, mp * 0.09 + vec2(0.31, 0.62)).r);
  vec3 moonC = vec3(0.855, 0.888, 1.0) * (1.0 - 0.2 * dot(mp, mp)) * (1.0 - 0.2 * seas) * 0.98;
  float gx = max(dM - R, 0.0) / (R * 4.0);
  col += vec3(0.26, 0.34, 0.56) * (0.42 * exp(-gx * gx * 9.0) + 0.16 * exp(-gx * 3.2)) * (1.0 - disc);
  col = mix(col, moonC, disc);
  // THE SKY'S FOOT (round seven, C7): THE HORIZON IS UNEVEN, NEVER A STRAIGHT LINE. Beyond the fields' own edge (2.6 km
  // out) far snowfields ROLL in low swells (a fifth of a degree to a degree up, each in its own light and shade), and
  // on their backs stand wood lots: dark, ragged, with gaps between them
  float be = bearingOf(dir);
  float roll = 0.0035 + 0.0130 * texture2D(uNoise, vec2(be * 0.31, 0.19)).r + 0.0060 * texture2D(uNoise, vec2(be * 1.13, 0.67)).b;
  float lot = smoothstep(0.42, 0.58, texture2D(uNoise, vec2(be * 0.83, 0.53)).a);
  float wh = roll + (0.0012 + 0.0060 * texture2D(uNoise, vec2(be * 2.9, 0.37)).r + 0.0026 * texture2D(uNoise, vec2(be * 17.0, 0.71)).g) * lot;
  vec3 haze = fogDark(dir);
  vec3 hill = mix(haze, vec3(0.19, 0.25, 0.42), 0.17) * (0.74 + 0.6 * texture2D(uNoise, vec2(be * 0.57 + 0.2, dir.y * 7.0 + 0.4)).g);
  col = mix(col, mix(vec3(0.008, 0.013, 0.034), haze, 0.4), 1.0 - smoothstep(wh - SOFT, wh + SOFT, dir.y));
  col = mix(col, hill, 1.0 - smoothstep(roll - SOFT, roll + SOFT, dir.y));
  gl_FragColor = vec4(col, 1.0);
}`;
const AUR_VERT = /* glsl */`
uniform vec3 uSeed;
varying vec3 vDir; varying vec3 vS; varying float vF;   // vS: s along the ribbon, v from its foot to its top, the ribbon's number; vF: how nearly edge-on the ribbon is seen here
${GLSL_COMMON}
void main(){
  float s = position.x, v = position.y, k = position.z;
  // each ribbon's stretch of the arc (bearings in radians east of north), its foot's height, its folds
  // (round seven: a fourth ribbon stands over the east, lower: the dead sky that the bright street's side leaves show)
  float b0 = k < 0.5 ? 0.82 : k < 1.5 ? 0.30 : k < 2.5 ? -0.50 : 2.30, b1 = k < 0.5 ? -0.42 : k < 1.5 ? -1.22 : k < 2.5 ? -1.26 : 0.86;
  float e0 = k < 0.5 ? 0.165 : k < 1.5 ? 0.195 : k < 2.5 ? 0.150 : 0.175, folds = k < 0.5 ? 2.4 : k < 1.5 ? 2.9 : k < 2.5 ? 1.6 : 2.2;
  float ph = 6.2832 * folds * s + (k < 0.5 ? uSeed.x : k < 1.5 ? uSeed.y : k < 2.5 ? uSeed.z : uSeed.x + 2.1) + uTime * 0.045;   // (the folds drift east)
  // (round seven) THE RIBBON NEVER DOUBLES BACK ON ITSELF IN BEARING (where it did, the layers of a fold ended at a
  // straight upright edge and the curtain read as panels): it swings to and fro as it goes and is brighter where it
  // runs along the line of sight (its light there is seen edge-on) and fainter where it runs across it
  float D = abs(b1 - b0), w2 = 6.2832 * folds;
  float amp = 0.55 * D / w2 * (0.75 + 0.25 * sin(ph * 0.37 + 1.3)), c2 = 0.2 * D / (2.3 * w2);
  float be = mix(b0, b1, s) + amp * sin(ph) + c2 * sin(ph * 2.3 + 0.7);
  float dbe = (b1 - b0) + (amp * cos(ph) + c2 * 2.3 * cos(ph * 2.3 + 0.7)) * w2;
  vF = clamp(0.62 * D / max(abs(dbe), 1e-3), 0.45, 2.2);
  float foot = e0 + 0.020 * cos(ph) + 0.012 * sin(6.2832 * s * 0.8 + k);   // the feet stand 8 to 12 degrees up
  float el = foot + v * (k < 2.5 ? 0.62 : 0.50);                            // (round seven, C6) THE CURTAINS REACH 45 DEGREES UP over the north and west
  vec3 dir = vec3(-cos(be) * cos(el), sin(el), -sin(be) * cos(el));
  vDir = dir; vS = vec3(s, v, k);
  vec4 p = projectionMatrix * viewMatrix * vec4(dir * 90.0 + cameraPosition, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const AUR_FRAG = /* glsl */`
precision highp float;
uniform float uGain;
varying vec3 vDir; varying vec3 vS; varying float vF;
${GLSL_COMMON}
${NIGHT_LIB}
void main(){
  vec3 dir = normalize(vDir);
  if (deadAt(cameraPosition, cameraPosition + dir * 4000.0) < 0.5) discard;   // (round seven) the dead sky stands only where the ray is seen dead: behind it, the living night
  float s = vS.x, v = vS.y, k = vS.z;
  // FINE UPRIGHT RAYS: thin bright lines along the ribbon, each of its own length, in bundles; they shimmer
  float x = s * 4.3 + k * 0.37, shim = uTime * 0.0075;
  float g1 = texture2D(uNoise, vec2(x + shim, 0.13 + k * 0.21)).g, g2 = texture2D(uNoise, vec2(x * 0.53 - shim * 0.6 + 0.37, 0.71 + k * 0.17)).g;
  float bundle = texture2D(uNoise, vec2(s * 0.42 + k * 0.37 + uTime * 0.0012, 0.47 + k * 0.29)).r;
  float ray = smoothstep(0.43, 0.68, g1 * 0.7 + g2 * 0.3);
  float len = clamp(0.22 + 1.0 * texture2D(uNoise, vec2(s * 0.37 + k * 0.4, 0.9 - k * 0.2)).a + 0.30 * (g1 - 0.5), 0.2, 1.0);
  // (round seven) THE LOWER BORDER IS SOFT AND FOLDED, a band of light and not a row of points: the rays stand up out of it
  float prof = smoothstep(0.0, 0.11, v) * (1.0 - smoothstep(0.3 * len, len, v)) * exp(-v / len * 1.9);
  float body = mix(0.72, 0.22 + 0.78 * ray, smoothstep(0.03, 0.26, v)) * mix(0.8, 0.40 + 0.60 * smoothstep(0.30, 0.62, bundle), smoothstep(0.03, 0.26, v));
  // every 3.5 s, on the wave's own clock, a soft brightening runs once along the ribbon
  float run = mod(uTime + uPhase, 3.5) / 3.5, pz = (s - (run * 1.3 - 0.15)) / 0.11;
  float ends = smoothstep(0.0, 0.07, s) * (1.0 - smoothstep(0.92, 1.0, s));
  float a = prof * body * ends * vF * (1.0 + 0.9 * exp(-pz * pz)) * uGain;
  // green at the foot (#7df2b0) to blue-violet at the top (#8a7cf0); no red
  vec3 colA = mix(mix(vec3(0.205, 0.888, 0.434), vec3(0.40, 0.20, 0.84), smoothstep(0.06, 0.46, v / len)), vec3(0.254, 0.202, 0.871), smoothstep(0.46, 0.92, v / len));   // (green, violet, blue-violet: no red)
  // the bars of cloud stand before them; the horizon's haze takes what is lowest
  float e; float bar = barsAt(dir, e);
  a *= (1.0 - 0.9 * bar) * smoothstep(0.02, 0.10, dir.y);
  gl_FragColor = vec4(colA * a, 1.0);
}`;
export function makeNight(shared, rng) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpacity: { value: 1 } },
    vertexShader: NIGHT_VERT, fragmentShader: NIGHT_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: true,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 16), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -0.9;
  // the northern lights: four ribbons, each a strip 150 steps long and 4 high in its own (s, v)
  const NS = 150, NV = 4, NR = 4, A = new Float32Array(NR * (NS + 1) * (NV + 1) * 3), idx = [];
  for (let k = 0, o = 0; k < NR; k++) {
    const base = k * (NS + 1) * (NV + 1);
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= NV; j++) { A[o++] = i / NS; A[o++] = j / NV; A[o++] = k; }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) { const a = base + i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(A, 3)); ag.setIndex(idx);
  ag.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const amat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uGain: { value: 0.19 }, uSeed: { value: new THREE.Vector3(rng() * 6.2832, rng() * 6.2832, rng() * 6.2832) } },
    vertexShader: AUR_VERT, fragmentShader: AUR_FRAG, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const aurora = new THREE.Mesh(ag, amat); aurora.frustumCulled = false; aurora.renderOrder = -0.8;
  return { object: mesh, aurora, material: mat, uniforms: mat.uniforms, auroraUniforms: amat.uniforms };
}

// ---------------------------------------------------------------------------------------------- the thin places
// A THIN PLACE IS THE LEAF ALONE (round six): two bright smooth edges bowed apart that meet at the foot and at the
// top, breathing; motes of light rise along them; a soft glow lies close about the edges and is nothing by 1.5 m.
// NO THREAD, no curtain, no line, grid, pane or patch of haze: the sheet that carries it is no wider than the leaf and
// its glow, and holds no light at its own rim. Light, a medium: it thins within 2.5 m of the eye.
// waist, top, foot: the opening.
const CURT_VERT = /* glsl */`
varying vec2 vM; varying vec3 vW; varying float vPh;
void main(){
  vM = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
  // the phase of the leaf's breathing, from its foot's own place in the world (the law's leafPh: the same)
  vPh = dot((modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz, ${LEAF_PH});
}`;
const CURT_FRAG = /* glsl */`
precision highp float;
varying vec2 vM; varying vec3 vW; varying float vPh;
uniform vec4 uOpen; uniform float uGain; uniform float uGlow;
${GLSL_COMMON}
float hash1(float x){ return fract(sin(x * 61.37) * 19463.71); }   // (round seven: constants of our own, as sh1 and sh2 have)
void main(){
  float x = vM.x, y = vM.y;
  float breathe = 1.0 + ${BREATHE.toFixed(2)} * sin(uTime * 6.2832 / 5.0 + vPh);
  float ty = clamp((y - uOpen.z) / max(uOpen.y - uOpen.z, 0.1), 0.0, 1.0);
  float leaf = pow(clamp(sin(3.14159 * pow(ty, 0.8)), 0.0, 1.0), 0.75);
  float hwid = 0.5 * uOpen.x * breathe * leaf * step(y, uOpen.y) + 0.02;
  // a great leaf's edges and glow are as much greater as the leaf (sc: its height over 15 m); far off, an edge finer
  // than one fragment is drawn as its own light spread over that fragment (no more light, no beat)
  float sc = uOpen.w, pw = fwidth(x) * 0.9;
  float ax = (abs(x) - hwid) / sc, aa = abs(ax);
  // the two edges: a smooth bright line, and the soft glow close about it (stronger outside the leaf), nothing by 1.5 m
  float lw = 0.012 + pw * pw / (sc * sc);
  float line = exp(-ax * ax / lw) * 1.7 * sqrt(0.012 / lw);
  float glow = exp(-aa / 0.42) * mix(0.09, 0.26, step(0.0, ax)) * (1.0 - smoothstep(0.7, 1.5, aa));
  float ends = smoothstep(uOpen.y + 1.4 * sc, uOpen.y + 0.1, y) * smoothstep(uOpen.z - 0.2, uOpen.z + 0.8 * sc, y);
  // motes of light rising along the edges
  float my = y * 1.6 / sc - uTime * 0.9; x /= sc;
  float mote = step(0.86, hash1(floor(my) + floor(x * 3.0) * 13.0)) * exp(-abs(ax - 0.25) / 0.3) * smoothstep(0.35, 0.0, abs(fract(my) - 0.5)) * smoothstep(0.3, 0.0, abs(fract(x * 3.0) - 0.5)) * step(0.0, ax) * (1.0 - smoothstep(0.8, 1.5, aa));
  // (a door-sized leaf's rim is the fine line alone, with a breath of glow)
  float a = (line + (glow + mote * 1.5) * uGlow) * ends * uGain;
  // THE MEDIUM'S LAW (the brief's: light, a medium, thins within 2.5 m of the eye): by true distance, 0.6 to 2.5 m
  float dist = length(vW - cameraPosition);
  a *= smoothstep(0.6, 2.5, dist);
  vec3 col = vec3(0.87, 0.92, 1.0) * a;
  col *= exp(-dist * 0.0012);
  gl_FragColor = vec4(col, 1.0);
}`;
export function makeCurtain(shared, o) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpen: { value: new THREE.Vector4(o.waist, o.top, o.foot, o.fine ? o.top / 15 : Math.max(1, o.top / 15)) }, uGain: { value: o.gain ?? 1 }, uGlow: { value: o.fine ? 0.3 : 1 } },
    vertexShader: CURT_VERT, fragmentShader: CURT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const sc = o.fine ? o.top / 15 : Math.max(1, o.top / 15), w = o.waist * 1.1 + 3.4 * sc, h = o.top + 1.7 * sc, geo = new THREE.PlaneGeometry(w, h, 1, 1); geo.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 5;
  return { object: mesh, material: mat, uniforms: mat.uniforms };
}

// ---------------------------------------------------------------------------------------------- baked light
// THE WAVE'S LIGHT LIES ON THE PLACE: every vertex near a string takes the summed colour of the bulbs about it (the
// surface shader multiplies it by the wave at the vertex's own plan distance), and the sodium lamps' and porch lamps'
// light. Bulbs are gathered in 3 m cells; lamps are few.
// (the cells' ground: the near town's blocks, span(), and three cells more on every side: beyond the bake's reach)
export function makeBulbGrid() {
  const cell = 3, S = span(), M = 3 * cell, P0 = S.i0 * K.BLOCK - M, Q0 = S.j0 * K.BLOCK - M, W = Math.ceil(((S.i1 + 1 - S.i0) * K.BLOCK + 2 * M) / cell), H = Math.ceil(((S.j1 + 1 - S.j0) * K.BLOCK + 2 * M) / cell), data = new Float32Array(W * H * 7), col = BULBS.map((h) => { _c.set(h); return [_c.r, _c.g, _c.b]; });
  return {
    cell, P0, Q0, W, H, data,
    add(b) {
      const ci = Math.floor((b[0] - P0) / cell), cj = Math.floor((b[1] - Q0) / cell); if (ci < 0 || cj < 0 || ci >= W || cj >= H) return;
      const o = (cj * W + ci) * 7, c = col[b[3]];
      data[o] += b[0]; data[o + 1] += b[1]; data[o + 2] += b[2]; data[o + 3] += c[0]; data[o + 4] += c[1]; data[o + 5] += c[2]; data[o + 6]++;
    },
    // turn the sums into each cell's mean place, once every bulb is in
    close() {
      for (let o = 0; o < data.length; o += 7) if (data[o + 6] > 0) { data[o] /= data[o + 6]; data[o + 1] /= data[o + 6]; data[o + 2] /= data[o + 6]; }
      // any[cell]: whether a bulb lies in the five-by-five cells about it (the bake passes over the rest)
      const any = this.any = new Uint8Array(W * H);
      for (let cj = 0; cj < H; cj++) for (let ci = 0; ci < W; ci++) if (data[(cj * W + ci) * 7 + 6] > 0) for (let b = Math.max(0, cj - 2); b <= Math.min(H - 1, cj + 2); b++) for (let a = Math.max(0, ci - 2); a <= Math.min(W - 1, ci + 2); a++) any[b * W + a] = 1;
    },
  };
}
// lamps: [p, q, y, strength, reach2, spot]; from, to: the vertex range of g to bake; reach: the cells of bulbs taken
// about a vertex (2: five by five, 7 m; 1: three by three, where only the dark copy draws the mesh, round five)
// step 4: the range holds four-cornered cards only; each takes its first corner's light whole (round four)
export function bakeLight(g, from, to, grid, lamps, step = 1, reach = 2) {
  const cell = grid.cell, pos = g.pos, nor = g.nor, lit = g.lit, D = grid.data, W = grid.W, H = grid.H, nl = lamps.length;
  // the lamps by 8 m cells (kept on the list): a cell holds every lamp whose reach touches it
  let lg = lamps._cells;
  if (!lg) {
    lg = new Map(); Object.defineProperty(lamps, '_cells', { value: lg });
    for (let k = 0; k < nl; k++) { const L = lamps[k], rr = Math.sqrt(L[4] * 6) + 0.01; for (let a = Math.floor((L[0] - rr) / 8); a <= Math.floor((L[0] + rr) / 8); a++) for (let b = Math.floor((L[1] - rr) / 8); b <= Math.floor((L[1] + rr) / 8); b++) { const key = a * 4096 + b; let l = lg.get(key); if (!l) lg.set(key, l = []); l.push(k); } }
  }
  // the Geo's own runs of cards (g.cards): each card takes its first corner's light whole
  const cards = step === 1 && g.cards ? g.cards : null; let ck = 0, hereKey = NaN, here = null;
  if (cards) while (ck < cards.length && cards[ck + 1] <= from) ck += 2;
  for (let i = from, st = step; i < to; i += st) {
    if (cards) { while (ck < cards.length && cards[ck + 1] <= i) ck += 2; st = ck < cards.length && i >= cards[ck] && ((i - cards[ck]) & 3) === 0 ? Math.min(4, cards[ck + 1] - i) : 1; }
    const p = pos[i * 3], y = pos[i * 3 + 1], q = -pos[i * 3 + 2], nx = nor[i * 4] / 127, ny = nor[i * 4 + 1] / 127, nq = -nor[i * 4 + 2] / 127;
    let r = 0, gg = 0, b = 0, a = 0;
    const ci = Math.floor((p - grid.P0) / cell), cj = Math.floor((q - grid.Q0) / cell);
    if (ci >= -2 && cj >= -2 && ci < W + 2 && cj < H + 2 && (ci < 0 || cj < 0 || ci >= W || cj >= H || grid.any[cj * W + ci])) {
      const i0 = Math.max(0, ci - reach), i1 = Math.min(W - 1, ci + reach), j0 = Math.max(0, cj - reach), j1 = Math.min(H - 1, cj + reach);
      for (let cjj = j0; cjj <= j1; cjj++) for (let cii = i0; cii <= i1; cii++) {
        const o = (cjj * W + cii) * 7; if (D[o + 6] === 0) continue;
        const lx = D[o] - p, lq = D[o + 1] - q, ly = D[o + 2] - y, d2 = lx * lx + lq * lq + ly * ly; if (d2 > 64) continue;
        const dl = Math.sqrt(d2) + 1e-3, w = Math.max(0.3, (nx * lx + nq * lq + ny * ly) / dl) / (d2 + 2.5) * (1 - d2 / 64);
        r += D[o + 3] * w; gg += D[o + 4] * w; b += D[o + 5] * w;
      }
    }
    const lk = Math.floor(p / 8) * 4096 + Math.floor(q / 8); if (lk !== hereKey) { hereKey = lk; here = lg.get(lk); }
    const nh = here ? here.length : 0;
    for (let k = 0; k < nh; k++) {
      const L = lamps[here[k]], lx = L[0] - p, lq = L[1] - q; if (lx * lx + lq * lq > L[4] * 6) continue;
      const ly = L[2] - y, d2 = lx * lx + lq * lq + ly * ly;
      const dl = Math.sqrt(d2) + 1e-3, down = ly / dl, sp = L[5] ? clamp((down - 0.3) / 0.45, 0, 1) : 1;
      a += L[3] * Math.max(0.25, (nx * lx + nq * lq + ny * ly) / dl) * sp * sp * (3 - 2 * sp) / (1 + d2 / L[4]);
    }
    lit[i * 4] = Math.max(lit[i * 4], Math.min(255, Math.round(Math.sqrt(r * 0.22) * 255))); lit[i * 4 + 1] = Math.max(lit[i * 4 + 1], Math.min(255, Math.round(Math.sqrt(gg * 0.22) * 255)));
    lit[i * 4 + 2] = Math.max(lit[i * 4 + 2], Math.min(255, Math.round(Math.sqrt(b * 0.22) * 255))); lit[i * 4 + 3] = Math.min(255, Math.round(Math.sqrt(a) * 255));
    for (let k = 1; k < st && i + k < to; k++) { const o = (i + k) * 4; lit[o] = Math.max(lit[o], lit[i * 4]); lit[o + 1] = Math.max(lit[o + 1], lit[i * 4 + 1]); lit[o + 2] = Math.max(lit[o + 2], lit[i * 4 + 2]); lit[o + 3] = lit[i * 4 + 3]; }
  }
}
// every house's roof takes ONE colour of its own string (picked by the house), so that from the air the fronts cross
// the town as bands of coloured light; the bake keeps whichever is stronger at a vertex
// ROUND THREE: a far house (its block is not baked) takes its own string's colours along its EAVES only: the roof's
// eave corners are dyed (each corner the next colour of its mix), the ridge is left bare, so the roof is edged in
// colour and the colour runs out up the pitch. [from, to): the house's vertices; eave: the height of its eave line.
export function tintEaves(g, from, to, mix, eave, k = 0.5) {
  // each colour at one strength (its greatest channel k); the eave vertices are flagged in the colour's fourth slot,
  // so that the shader holds the dye to the lowest third of the pitch
  const M = MIXES[mix], cols = M.map((ci) => { _c.set(BULBS[ci]); const m = Math.max(_c.r, _c.g, _c.b), f = (v) => Math.min(255, Math.round(Math.sqrt(v / m * k) * 255)); return [f(_c.r), f(_c.g), f(_c.b)]; });
  for (let i = from, c = 0; i < to; i++) {
    if ((g.tex[i * 4 + 3] >> 4) !== KIND.ROOF || g.nor[i * 4 + 1] < 20 || g.pos[i * 3 + 1] > eave + 0.45) continue;
    const col = cols[(c++ >> 1) % cols.length]; g.lit[i * 4] = col[0]; g.lit[i * 4 + 1] = col[1]; g.lit[i * 4 + 2] = col[2]; g.col[i * 4 + 3] = 255;
  }
}

// ---------------------------------------------------------------------------------------------- the hero alone
// One strung house of the bright street, its tree and a parted curtain of light across the road beside it; the wave
// runs through the bulbs. Front toward +Z (the street lies in front of the house).
export async function buildHero(ctx, opts = {}) {
  // (standing alone with no world's seed, the hero is dealt from its names alone)
  const seed = (ctx && ctx.seed) ?? EVERY_SEED, yieldFn = ctx && ctx.yield ? ctx.yield : async () => {}, object = new THREE.Group();
  const noise = await makeNoiseTex(seed, yieldFn), U = makeShared(noise);
  const g = new Geo(16384), leaf = new Geo(4096), bulbs = [], grid = makeBulbGrid();
  const h = { id: 'hero', seed, i: 0, j: 0, side: 'S', k: 0, kind: opts.kind || 'gable', paint: 0, roof: 0, w: 9.4, dp: 11, ridge: 8.8, fp: 0, fq: 6, face: [0, -1], strung: true, mix: 0, litSeed: 0.37, drive: false, extra: 0.3, extra2: 0.6 };
  g.frame(0, 0, 0, null).kind(KIND.LAWN).color('#2e4a2a'); gridUp(g, -18, -5.5, 18, 22, () => K.KERB, 8, 6);
  g.kind(KIND.WALK).color('#6e6c66'); gridUp(g, -18, -3.5, 18, -2, () => K.KERB + 0.02, 6, 1);
  g.color('#7a7872'); g.quad([-18, 0, 5.5], [18, 0, 5.5], [18, K.KERB, 5.5], [-18, K.KERB, 5.5]);
  g.color('#0c0d10'); gridUp(g, -18, -14.5, 18, -5.5, (p, q) => 0.08 * (1 - Math.abs(q + 10) / 4.5), 8, 4);
  buildHouse(g, h, 0, null); buildYard(g, seed, h);
  for (const ln of houseStrings(h, false)) bulbsAlong(ln.map((x) => { const w = housePt(h, x[0], x[2]); return [w[0], w[1], x[1]]; }), 0.4, h.mix, 0, bulbs);
  await yieldFn();
  const t = { id: 'hero-tree', kind: 'maple', p: -9.5, q: -4.2, H: 14, tr: 0.36, street: true }, sk = treeSkeleton(seed, t);
  buildTree(g, seed, t, sk, 0); buildLeaves(leaf, seed, t, sk, 0);
  const top = sk.segs[0][1], n0 = bulbs.length;
  bulbsAlong(hang([t.p, t.q, top[2] + 1.2], [4, -15.6, 6.6], 4.9), 0.45, 0, 0, bulbs); for (let i = n0; i < bulbs.length; i++) bulbs[i][6] = 1;
  g.kind(KIND.SMOOTH).color('#2c3a34'); g.tube([4, 0, 15.6], [4, 6.85, 15.6], 0.09, 0.07, 4);
  { const sp = [], hh = top[2] - 0.2; for (let k = 0; k <= 60; k++) { const f = k / 60, a = f * (hh / 1.15) * 6.2832; sp.push([lerp(t.p, top[0], f) + Math.cos(a) * (t.tr + 0.07), lerp(t.q, top[1], f) + Math.sin(a) * (t.tr + 0.07), 0.5 + (hh - 0.5) * f]); } bulbsAlong(sp, 0.4, 3, 0, bulbs); }
  await yieldFn();
  for (const b of bulbs) grid.add(b); grid.close();
  for (const gg of [g, leaf]) for (let a = 0; a < gg.nv; a += 3000) { bakeLight(gg, a, Math.min(gg.nv, a + 3000), grid, [[-3, -4.4, 8, 0.9, 55, 1]]); await yieldFn(); }
  object.add(new THREE.Mesh(g.toGeometry(), makeSurface(U, false)), new THREE.Mesh(leaf.toGeometry(), makeSurface(U, false, false, true)));
  const dab = new THREE.Mesh(makeDabGeometry(bulbs), makeDabMaterial(U, false)); dab.renderOrder = 4; dab.frustumCulled = false; object.add(dab);
  const curtain = makeCurtain(U, { waist: 2.2, top: 9.6, foot: 0.2, gain: 1 });
  curtain.object.position.set(11, 0, 10); curtain.object.rotation.y = Math.PI / 2; object.add(curtain.object);
  const size = new THREE.Vector2();
  return {
    object, radius: 11, height: 13, center: new THREE.Vector3(0, 4.5, 0), anchors: { curtain: new THREE.Vector3(11, 5, 10) },
    update(dt, time) { U.uTime.value = time; if (ctx && ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uH.value = size.y; } },
    dispose() { noise.dispose(); }, ground: true, groundY: 0,
  };
}
