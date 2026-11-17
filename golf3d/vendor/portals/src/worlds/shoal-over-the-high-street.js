// The Shoal over the High Street: a sunny painted market town (painted fronts of British and Irish market towns,
// gabled timber fronts of Scandinavian streets) with a cobbled square at its heart, a broad fountain playing in the
// square's middle, cafe tables under parasols round it; over the town banded cleaner shrimp as long as airships swim
// through dry blue air and groom it, under a low warm sun that lays every roof's, every cloud's and every animal's
// shadow long across the streets; a herd of giraffes is loose in the high street and round the fountain, and
// ladybirds as big as carts walk the clock tower's walls. The flight is down the street and up into the shoal: down the high street under
// the eaves to the house on its head (a great animal comes against the line low over the roofs, its shadow on the
// road before it), round a corner under the house that grew, along a second street to the small house, round a
// second corner and up a third street into THE SQUARE, low among the parasols; there it climbs a turn and a quarter
// about the fountain's own upright THROUGH the slow wheel of the shoal, the square under the eye all the way up;
// turns out over the roofs round the clock tower's face; swings onto the axis of the square's west street and comes
// down over that street to the ring, which stands low over the street's far roofs with the shoal streaming into it.
// Three houses of the terraces came out wrong: one on its head, one nine floors tall and one window wide, one at two
// fifths the size.
//
// THIS FILE is the town, land, sky, light, bunting, where every animal is and how it moves, the route, gaze and ring.
// The animal itself is src/parts/shoal-over-the-high-street.js (makeShrimps), posed from here at every update: the
// wheel and the three that hover by the world's clock; the streets' animals and the stream into the ring by the
// metres the lens has flown. The giraffes and the ladybirds are in the same part (makeGiraffes, makeLadybirds),
// posed from here too: the high street's herd by the metres flown, the square's herd and the ladybirds by the clock.
//
// BEHIND THE ENTRY: the world sets no camera.nearThrough. The high street's terraces, roadway and pavements run on
// 34 m behind the entry and the far town lies beyond; nothing stands across the entry's axis there: no bunting, no
// tree, no animal (the high street's great one is ahead of the lens when it enters); the fronts run beside the axis
// 7 m off.
// THE RING stands from the first metre (no portal.drawWithin: nothing of it is switched) at the end of the last way,
// low over the roofs of the square's west street at that street's far end, RING_FAR from the nearest place of the
// low run, its face square to the last way (portal.tilt). portal.revealDistance is the last way's length.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import { makeShrimps, prepareShrimps, prepareBeasts, makeGiraffes, makeLadybirds } from '../parts/shoal-over-the-high-street.js';

const SURF = S.SURF, TAU = Math.PI * 2;
// the skin that casts the animals' shadows
const SHADE_SKIN = 'shadow';
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// smootherstep: the street's bends have no kink in their curvature
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

// paints of the real streets named in the brief, one to a house
const PAINTS = ['#f2c9c4', '#f6e3a1', '#bfe0d8', '#c9d8f0', '#f4b98a', '#e8eef0', '#d9c4e6', '#c5e3b5', '#e87a6a', '#3f6f9f'].map(lin);
const DOORS = ['#c0392b', '#1f4e79', '#2e7d5b', '#f1c40f', '#6c3483'].map(lin);
// the second street's painted timber (Scandinavian reds, ochres, whites and greys) and the third street's brick
const TIMBER = ['#a63a2c', '#d9a441', '#f1ece0', '#8fa9bd', '#7f9a66', '#c9573f', '#e9cf8a', '#5f7f93', '#b8443a', '#f4e3bd'].map(lin);
const BRICK = ['#a8553f', '#b9825a', '#93503f', '#c6a47c', '#9c6248', '#b56a4c', '#8a4a3c', '#c4936c', '#a35a44', '#bd8a66'].map(lin);
const AWNINGS = ['#c23a30', '#2e7d5b', '#243f7a'].map(lin);
const FLOWERS = ['#e0342c', '#f06aa0', '#f4c21a', '#8a4fc0', '#f4f0e6', '#ff7a2a'].map(lin);
// curtains drawn back in the upper windows, and the lamp-lit wall of a room seen through a pane in a shaded front
const CURTAINS = ['#f4ecd8', '#edd0c6', '#d3dfec', '#ece2b0'].map(lin), ROOM = lin('#ffc875');
const BUNT = ['#e0342c', '#f4c21a', '#2f8f4f', '#2f6fd0', '#f06aa0', '#f4f0e6', '#ff7a2a', '#7a3fb0'];
const SLATE = lin('#8b939d'), PANTILE = lin('#b5533c'), COPPER = lin('#6fa59a'), TRIM = lin('#f1eee6'), IRON = lin('#23272b');
// EARTH: the turned earth of the upturned house's yard, a dry garden soil: light enough to keep its colour in that
// house's own shade, where it always lies (the sun stands behind the house), as every shade of the town does.
const LAWN = lin('#79b454'), EARTH = lin('#a8845c');
const PASTEL = ['#f7c6cf', '#fbe3a8', '#bfe6d6', '#c6dcf5', '#f9cfa8', '#e2cff2', '#d4ecb8', '#fde2e4', '#bfe9ee', '#fff1c9'].map(lin), COBBLE = lin('#e6dac4');
const PAVING = lin('#c4b396'), SETTS = lin('#b3a898'), SETTS2 = lin('#b8907a'), SETTS3 = lin('#c7c2b4'), KERB = lin('#efe9dd'), LEAF = lin('#4f9440'), POT = lin('#b86a45');

// THE PLACE in world metres. The entry is at (0, 6.5, 0) heading north (world -z); s is metres north of the entry.
// HALF: from a street's centre line to its fronts (14 m between fronts).
const HALF = 7;
// The high street runs from the town hall (34 m behind the entry) to its corner with the second street, where its
// centre line has come X_END east of the entry's.
const S_END = 230, S_BACK = -34, X_END = 8;
// The second street runs east from that corner (its centre line HALF beyond the high street's last fronts); the third
// runs north from the second's far end. ST2 and ST3 are their lengths between centre lines; CH is the splay of the two
// corner blocks the line turns round.
const Z2 = -(S_END + HALF), ST2 = 128, ST3 = 118, X3 = X_END + ST2, CH = 12;
// THE SQUARE: SQ either way from the fountain's upright. The third street's centre line is a tangent of the circle
// of R_IN about that upright: the street comes into the square's south side, and the line flies up it into the
// square and begins its climbing turn where it is due east of the fountain.
const R_IN = 26, SQ = 40, BX = X3 - R_IN, BZ = Z2 - ST3;
const MKT = { x0: BX - SQ, x1: BX + SQ, z0: BZ + SQ, z1: BZ - SQ };
// THE CLOCK TOWER stands in the square's west side, TOWER_N north of the square's middle, its shaft TOWER_BACK behind
// the fronts' line and TOWER_H to its eaves; the line turns about it at RHO.
const TOWER_N = 28, TOWER_BACK = 7, TOWER_H = 30, TX = BX - SQ - TOWER_BACK, TZ = BZ - TOWER_N, RHO = 30;
// THE RING stands on the axis of the square's west street (the fountain's own east-west line), RING_FAR from the
// high street's corner with the second street: that corner is the nearest place of the low run (the streets, the
// square's crossing and the climb's first rounds) to it, so the low run never comes nearer the ring than RING_FAR.
// Its height is a sum made in build: the roofs' top, the least air over them and half a great one's depth.
const RING_FAR = 150, RING_R = 9, RING_AT = [X_END - Math.sqrt(RING_FAR * RING_FAR - ST3 * ST3), BZ];
// the roofs' top (the highest chimney pot), the least air an animal keeps over it, the shoal's great sizes
const ROOF_TOP = 16.2, ROOF_AIR = 1, GREAT_K = [1, 0.9, 0.8];
// how far the gaze turns to the fountain on the climb
const FOUNT_LOOK = 0.7, WAYIN_LOOK = 0.6;

// The high street's centre line: straight for the first 75 m (the house on its head closes that straight), a swing to
// the west, then back east to its corner.
const BEND0 = 75, BEND1 = 135;
// W1's yard: a gap in the east terrace where the street bends away, and the upturned house's own front in it
const YARD = 23, W1_WIDE = 7.6, W1_BACK = 6, W1_IN = 17;
function makeStreet(swing) {
  const cx = (s) => -swing * sst(BEND0, BEND1, s) + (swing + X_END) * sst(BEND1, S_END, s);
  const dirAt = (s) => { const dx = (cx(s + 0.5) - cx(s - 0.5)), l = Math.hypot(dx, 1); return { x: cx(s), z: -s, tx: dx / l, tz: -1 / l }; };
  // a point o metres to the east (the right hand, going north) of the centre line at s
  const at = (s, o) => { const f = dirAt(s); return [f.x - f.tz * o, f.z + f.tx * o]; };
  return { cx, dirAt, at };
}

// THE ROUTE'S RULES (numbers of the place).
// 1 THE HIGH STREET at 6.5 m (first-floor sills; nothing is strung across this street), level: down its middle
//   toward THE HOUSE ON ITS HEAD, which closes the first straight; from the four fronts before that house's yard it
//   keeps SIDE_OFF to the left of the street's middle (the far side from the yard and its animal) and stays there.
//   In every street the line flies on the side that is the outside of the corner it is coming to.
// 2 A right turn of TURN radius round the splayed corner into THE SECOND STREET, THE HOUSE THAT GREW (which closes the
//   high street's vista) passing on the left; east along the second street, crossing in its second half from its left
//   side to its right; a left turn of TURN round the second splayed corner, THE SMALL HOUSE (which closes the second
//   street's vista) passing on the right.
// 3 North up THE THIRD STREET, back to its middle over the first half of the way to its mouth on the square; over
//   its last DIP metres the line comes down from the sills to Y_SQ, a little over the parasols.
// 4 ACROSS THE SQUARE at Y_SQ, straight on from the street's mouth to the place due east of the fountain; then THE
//   CLIMB: a rising turn about the fountain's upright, anticlockwise seen from above, through TURNS rounds; its
//   radius opens from R_IN to R_TOP and its height goes from Y_SQ to Y_TOP, both eased over the whole turn. The
//   wheel's animals turn the other way.
// 5 THE TURN OUT ROUND THE CLOCK TOWER: where the climb ends (due north of the fountain) the line flies straight on
//   west along its own tangent to the place due north of the tower (R_TOP is TOWER_N and RHO together), then a
//   quarter round the tower at RHO, anticlockwise, coming down to Y_TOWER by the tower's west side, heading south.
// 6 THE LAST WAY: the axis of the square's west street lies TOWER_N south of the tower, so a quarter turn to the
//   right of TOWER_N radius brings the line onto that axis heading west; it comes down the axis, over the west
//   street between its two rows of roofs, to the ring at the ring's height.
// PACE metres a second is the flight's usual pace; it is slower in the square and on the last way (pace(u), below).
const PACE = 12.9, FOV = 62;
const TURN = 34, SIDE_OFF = 1.2, Y_STREET = 6.5, Y_SQ = 4.6, DIP = 36;
const TURNS = 1.25, R_TOP = TOWER_N + RHO, Y_TOP = 44, Y_TOWER = 36;
function routePoints(street, sYard, ringY) {
  const pts = [], ease = (t) => t * t * (3 - 2 * t);
  const yard0 = sYard - W1_IN;
  const off = (s) => -SIDE_OFF * sst(yard0 - 4 * HALF, yard0, s);
  // the first corner: the arc of TURN that leaves the high street's line as a tangent and comes onto the second
  // street's line (SIDE_OFF to the left of its middle) as a tangent; sA is where on the high street it begins
  const cenA = (s) => { const f = street.dirAt(s), p = street.at(s, off(s)); return [p[0] - f.tz * TURN, p[1] + f.tx * TURN, f]; };
  let sA = BEND1;
  while (sA < S_END && cenA(sA)[1] > Z2 - SIDE_OFF + TURN) sA += 0.25;
  const CA = cenA(sA), hA = Math.atan2(CA[2].tx, -CA[2].tz);
  for (let i = 0; i <= 22; i++) { const s = sA * i / 22, q = street.at(s, off(s)); pts.push([q[0], Y_STREET, q[1]]); }
  // h is the heading, east of north
  for (let i = 1; i <= 8; i++) { const h = lerp(hA, Math.PI / 2, i / 8); pts.push([CA[0] - TURN * Math.cos(h), Y_STREET, CA[1] - TURN * Math.sin(h)]); }
  // the second street: from the first arc's end to the second arc's first knot, the cross-over in its second half
  const xA1 = CA[0], zA1 = CA[1] - TURN, xB0 = X3 + SIDE_OFF - TURN, zR2 = Z2 + SIDE_OFF;
  for (let i = 1; i <= 10; i++) { const x = lerp(xA1, xB0, i / 10); pts.push([x, Y_STREET, lerp(zA1, zR2, sst((xA1 + xB0) / 2, xB0, x))]); }
  const CB = [xB0, zR2 - TURN];
  for (let i = 1; i <= 9; i++) { const h = lerp(Math.PI / 2, 0, i / 9); pts.push([CB[0] + TURN * Math.cos(h), Y_STREET, CB[1] + TURN * Math.sin(h)]); }
  // the third street: from the second corner to its mouth on the square, back to its middle over the first half,
  // coming down to Y_SQ over the last DIP metres
  const zB1 = CB[1], zMouth = BZ + SQ;
  const yLow = (z) => Y_STREET - (Y_STREET - Y_SQ) * ease(clamp((zMouth + DIP - z) / DIP, 0, 1));
  for (let i = 1; i <= 8; i++) { const z = lerp(zB1, zMouth, i / 8); pts.push([X3 + SIDE_OFF * (1 - sst(zB1, (zB1 + zMouth) / 2, z)), yLow(z), z]); }
  // across the square to the place due east of the fountain
  for (let i = 1; i <= 4; i++) pts.push([X3, Y_SQ, lerp(zMouth, BZ, i / 4)]);
  // the climb's turn: ph is the angle about the upright from due east, anticlockwise seen from above; its radius at
  // ph, and its own metres to each of its knots
  const phEnd = TURNS * TAU, KNOTS = Math.round(TURNS * 40), rAt = (ph) => R_IN + (R_TOP - R_IN) * ease(ph / phEnd), run = [0];
  for (let i = 1; i <= KNOTS * 8; i++) {
    const p0 = phEnd * (i - 1) / (KNOTS * 8), p1 = phEnd * i / (KNOTS * 8), r0 = rAt(p0), r1 = rAt(p1);
    run.push(run[i - 1] + Math.hypot(r1 - r0, (r0 + r1) / 2 * (p1 - p0)));
  }
  const turnLen = run[KNOTS * 8];
  for (let i = 1; i <= KNOTS; i++) { const ph = phEnd * i / KNOTS, r = rAt(ph); pts.push([BX + r * Math.cos(ph), Y_SQ + (Y_TOP - Y_SQ) * ease(run[i * 8] / turnLen), BZ - r * Math.sin(ph)]); }
  // the turn out round the clock tower. g is the angle about the tower from due north, anticlockwise seen from above:
  // the line is at (TX - RHO sin g, TZ - RHO cos g) heading (-cos g, sin g), and leaves that circle at the tower's
  // west side (leave). Then the quarter to the right about the place TOWER_N west of there, onto the west street's
  // axis (onAxis), and the axis to the ring.
  const top = pts[pts.length - 1], west = top[0] - TX, quarter = Math.PI / 2;
  const leave = [TX - RHO, TZ], onAxis = [TX - RHO - TOWER_N, BZ], straight = onAxis[0] - RING_AT[0];
  const out1 = west + RHO * quarter, out2 = TOWER_N * quarter + straight;
  // the line's height d metres past the climb's end: down to Y_TOWER by the tower's west side, then down to the ring
  const down = (d) => d < out1 ? Y_TOP - (Y_TOP - Y_TOWER) * ease(d / out1) : Y_TOWER - (Y_TOWER - ringY) * ease((d - out1) / out2);
  for (let i = 1; i <= 3; i++) pts.push([top[0] - west * i / 3, down(west * i / 3), top[2]]);
  for (let i = 1; i <= 8; i++) { const g = quarter * i / 8; pts.push([TX - RHO * Math.sin(g), down(west + RHO * g), TZ - RHO * Math.cos(g)]); }
  // h: how far the line has turned to the right, from due south
  for (let i = 1; i <= 8; i++) { const h = quarter * i / 8; pts.push([onAxis[0] + TOWER_N * Math.cos(h), down(out1 + TOWER_N * h), TZ + TOWER_N * Math.sin(h)]); }
  for (let i = 1; i <= 5; i++) { const t = i / 5; pts.push([onAxis[0] - straight * t, down(out1 + TOWER_N * quarter + straight * t), BZ]); }
  return { pts, sA, xA1, xB0, zB1, zMouth, off, top: [top[0], top[2]], leave, onAxis, end: [RING_AT[0], ringY, RING_AT[1]] };
}

// ---------------------------------------------------------------- a house of the terrace, in its own axes
// Front on +Z at z = d / 2, width along X, base at y = 0. Party walls are plain. r is the house's own stream.
// Where the builder carries a second one (b.detail), the house's trim (pots, cornice, door, baskets, flower boxes) is
// written there: a mesh that casts no shadow, so the shadow light draws only the shell, the stack and the awning.
// o: { w, d, floors, fh, paint, roof, door, awning, gableFront, rich (1 near, 0 far), cols, seed }
function houseInto(b, r, o) {
  const { w, d, floors, paint } = o, gf = 3.4, fh = o.fh ?? 3.0, eave = gf + (floors - 1) * fh, zf = d / 2;
  const rise = o.rise ?? (o.gableFront ? Math.min(3.8, w * 0.46) : Math.min(3.4, d * 0.3));
  const cols = o.cols ?? Math.max(1, Math.round(w / 2.7)), seed = o.seed ?? r(), rich = o.rich ?? 1;
  const doorC = o.door, sideC = mul(paint, 0.93), bd = b.detail || b;
  // ground floor: a shopfront with big panes, a door in a strong colour, pilasters and a blank painted fascia
  // (o.shop false: a dwelling, its ground floor windowed like the floors above)
  const shopCols = Math.max(1, Math.round(w / 3.4)), shop = o.shop !== false;
  if (shop) { b.col(mul(paint, 0.82), 0.86, 1).surf(SURF.SHOP, seed, 1.5); b.wall(-w / 2, zf, w / 2, zf, 0, gf, { cellW: w / shopCols, cellH: gf }); }
  else { b.col(paint, 0.94, 1).surf(SURF.WINDOW, (seed + 0.19) % 1, 1); b.wall(-w / 2, zf, w / 2, zf, 0, gf, { cellW: w / cols, cols, rows: 1 }); }
  // upper floors, one window to a cell; a gable front is boarded in the Scandinavian way
  b.col(paint, 0.94, 1).surf(SURF.WINDOW, (seed + 0.37) % 1, 1);
  b.wall(-w / 2, zf, w / 2, zf, gf, eave, { cellW: w / cols, cols, rows: floors - 1 });
  b.surf(SURF.WINDOW, (seed + 0.61) % 1, 1);
  b.wall(w / 2, -zf, -w / 2, -zf, 0, eave, { cellW: w / cols, cols, rows: floors });
  // the end walls (seen where a terrace ends at a corner): the same paint, windows two to a floor
  const sc = Math.max(1, Math.round(zf / 1.9));
  b.col(sideC, 0.94, 1).surf(SURF.WINDOW, (seed + 0.83) % 1, 1);
  b.wall(w / 2, zf, w / 2, -zf, 0, eave, { cellW: 2 * zf / sc, cols: sc, rows: floors }); b.wall(-w / 2, -zf, -w / 2, zf, 0, eave, { cellW: 2 * zf / sc, cols: sc, rows: floors });
  // roof: ridge along the street, or a gable to the street
  b.col(o.roof, 1, 1).surf(o.tiles ? SURF.TILES : SURF.PLAIN, 0, 1);
  b.gable(-w / 2, -zf, w / 2, zf, eave, rise, { alongX: !o.gableFront, overhang: o.gableFront ? 0.3 : 0.28, wallColor: o.gableFront ? paint : sideC, wallStyle: o.gableFront ? SURF.PLANKS : SURF.PLAIN });
  // painted boards on the roof's edges and under its overhang, so that no edge of a roof is an unlit strip: an eave
  // board and soffit to the street, or bargeboards up both slopes of a gable front
  b.col(TRIM, 0.92, 1).surf(SURF.PLAIN);
  if (!o.gableFront) {
    const ov = 0.28, eY = eave - rise * ov / zf, xe = w / 2 + ov, zF = zf + ov;
    b.quad([-xe, eY - 0.3, zF + 0.012], [xe, eY - 0.3, zF + 0.012], [xe, eY + 0.03, zF + 0.012], [-xe, eY + 0.03, zF + 0.012]);
    b.shade(0.8, 0.9); b.quad([xe, eY - 0.165, zF], [-xe, eY - 0.165, zF], [-xe, eave - 0.165, zf], [xe, eave - 0.165, zf]); b.shade(0.92, 1);
  } else {
    const ov = 0.3, xe = w / 2 + ov, eY = eave - rise * ov / (w / 2), top = eave + rise, zF = zf + ov, z = zF + 0.012;
    b.quad([0, top - 0.3, z], [xe, eY - 0.3, z], [xe, eY + 0.03, z], [0, top + 0.03, z]);
    b.quad([-xe, eY - 0.3, z], [0, top - 0.3, z], [0, top + 0.03, z], [-xe, eY + 0.03, z]);
    b.shade(0.8, 0.9);
    b.quad([0, top - 0.165, zf], [xe, eY - 0.165, zf], [xe, eY - 0.165, zF], [0, top - 0.165, zF]);
    b.quad([-xe, eY - 0.165, zf], [0, top - 0.165, zf], [0, top - 0.165, zF], [-xe, eY - 0.165, zF]);
    b.shade(0.92, 1);
  }
  // a chimney stack on the ridge at the party wall, with pots
  const stX = o.gableFront ? 0 : -w / 2 + 0.75, stZ = o.gableFront ? (o.stackFront ? zf * 0.62 : -zf * 0.45) : 0, stY = eave + rise - 0.5, stH = 1.7;
  b.col(mul(paint, 0.74), 0.85, 1).surf(SURF.MASONRY, 0, 0.6); b.cbox(stX, stY, stZ, 1.3, stH, 0.72, { m: 1 });
  b.col(TRIM, 0.8, 0.9).surf(SURF.PLAIN); b.cbox(stX, stY + stH, stZ, 1.44, 0.12, 0.86);
  const pots = rich ? 3 : 2;
  for (let i = 0; i < pots; i++) { bd.col(POT, 0.8, 1); bd.cyl(stX + (i - (pots - 1) / 2) * 0.42, stY + stH + 0.12, stZ, 0.15, 0.12, 0.55, 5, { cap: false }); }
  // cornice under the eave and a string course over the shop
  bd.col(TRIM, 0.86, 1).surf(SURF.PLAIN);
  if (!o.gableFront) bd.box(-w / 2, eave - 0.3, zf, w / 2, eave - 0.04, zf + 0.2, { bottom: true });
  bd.box(-w / 2, gf - 0.1, zf, w / 2, gf + 0.08, zf + 0.24, { bottom: true });
  if (shop) {
    for (const sx of [-1, 1]) bd.box(sx > 0 ? w / 2 - 0.24 : -w / 2, 0, zf, sx > 0 ? w / 2 : -w / 2 + 0.24, gf - 0.1, zf + 0.12, { top: false });
    bd.col(mul(doorC, 0.85), 0.95, 1); bd.box(-w / 2 + 0.24, gf - 0.66, zf, w / 2 - 0.24, gf - 0.1, zf + 0.15, { bottom: true });
  }
  bd.col(mul(paint, 0.55), 0.9, 1).surf(SURF.MASONRY, 0, 1); bd.box(-w / 2, 0, zf, w / 2, 0.42, zf + 0.07, { m: 1 });
  // a rainwater pipe down the front at the party wall, a hopper at its head
  if (rich && !o.gableFront) { const px = -(o.doorSide ?? 1) * (w / 2 - 0.1); bd.col(IRON, 0.9, 1).surf(SURF.PLAIN); bd.box(px - 0.05, 0.42, zf, px + 0.05, eave - 0.48, zf + 0.1, { bottom: false }); bd.box(px - 0.14, eave - 0.52, zf, px + 0.14, eave - 0.3, zf + 0.2, {}); }
  // the door and its step
  const dx = (o.doorSide ?? 1) * (w / 2 - 0.95);
  bd.col(TRIM, 0.9, 1).surf(SURF.PLAIN); bd.box(dx - 0.62, 0, zf, dx + 0.62, 2.5, zf + 0.1, { top: true });
  bd.col(doorC, 0.8, 1); bd.box(dx - 0.5, 0.16, zf + 0.1, dx + 0.5, 2.3, zf + 0.15);
  bd.col(KERB, 0.9, 1).surf(SURF.MASONRY, 0, 1); bd.box(dx - 0.75, 0, zf, dx + 0.75, 0.16, zf + 0.5, { m: 1 });
  if (rich && shop && !o.noAwning) {
    // the awning: striped canvas on two iron stays
    const ay = gf - 0.72, out = 1.35, drop = 0.6, n = Math.max(3, Math.round(w / 0.5)), x0 = -w / 2 + 0.2, x1 = w / 2 - 0.2;
    b.col(o.awning, 0.95, 1).surf(SURF.STRIPES, 0, 1);
    b.quad([x0, ay - drop, zf + out], [x1, ay - drop, zf + out], [x1, ay, zf + 0.16], [x0, ay, zf + 0.16], [0, 0, n, 1]);
    b.quad([x0, ay - drop - 0.3, zf + out], [x1, ay - drop - 0.3, zf + out], [x1, ay - drop, zf + out], [x0, ay - drop, zf + out], [0, 0, n, 1]);
    b.shade(0.55, 0.66); b.quad([x1, ay - drop - 0.02, zf + out], [x0, ay - drop - 0.02, zf + out], [x0, ay - 0.02, zf + 0.16], [x1, ay - 0.02, zf + 0.16], [0, 0, n, 1]);
    bd.col(IRON, 1, 1).surf(SURF.PLAIN); for (const x of [x0, x1]) bd.beam([x, ay - drop - 0.1, zf + out - 0.02], [x, ay - drop - 0.8, zf + 0.12], 0.05, 0.05);
  }
  if (rich) {
    // a hanging basket on its bracket at the house's party wall, at one height all down the street
    for (const sx of [1]) {
      const hx = sx * (w / 2 - 0.12), hy = gf + 0.95;
      bd.col(TRIM, 0.9, 1).surf(SURF.PLAIN); bd.beam([hx, hy + 0.62, zf], [hx, hy + 0.62, zf + 0.86], 0.11, 0.11); bd.beam([hx, hy + 0.05, zf], [hx, hy + 0.58, zf + 0.6], 0.08, 0.08);
      bd.col(IRON, 1, 1); bd.beam([hx, hy + 0.6, zf + 0.72], [hx, hy + 0.2, zf + 0.72], 0.07, 0.07);
      bd.col(LEAF, 0.7, 1.05); bd.sphere(hx, hy - 0.08, zf + 0.72, 0.42, 6, 4);
      bd.col(FLOWERS[(o.flower + (sx > 0 ? 1 : 0)) % FLOWERS.length], 0.9, 1.1); bd.sphere(hx, hy + 0.1, zf + 0.72, 0.36, 6, 3);
    }
  }
  // flower boxes on the upper sills: every window of the first floor, most of the others
  for (let f = o.groundBox ? 0 : 1; f < floors; f++) for (let c = 0; c < cols; c++) {
    if (f > 1 && !o.allBoxes && ((c + f + o.flower) % 3 === 0)) continue;
    const x = f === 0 ? -(o.doorSide ?? 1) * 0.55 : -w / 2 + (c + 0.5) * w / cols, y = f === 0 ? 1.12 : gf + (f - 1) * fh + fh * 0.16, bw = Math.min(1.5, w / cols * 0.62);
    bd.col(TRIM, 0.8, 0.95).surf(SURF.PLAIN); bd.box(x - bw / 2, y - 0.26, zf, x + bw / 2, y, zf + 0.3, { bottom: true });
    bd.col(FLOWERS[(o.flower + c + f) % FLOWERS.length], 0.7, 1.12); bd.box(x - bw / 2 + 0.05, y, zf + 0.04, x + bw / 2 - 0.05, y + 0.3, zf + 0.33, { bottom: false });
  }
  // the panes of the upper windows (the kit's opening is the middle 52% of a cell's width and 60% of its height):
  // curtains drawn back at either side of most, white glazing bars, and where the front stands in shade (o.shaded)
  // a lamp-lit room here and there
  const fl = o.flower || 0;
  if (rich) for (let f = shop ? 1 : 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const cw = w / cols, cx = -w / 2 + (c + 0.5) * cw, y0 = f ? gf + (f - 1) * fh : 0, ch = f ? fh : gf, x0 = cx - 0.26 * cw, x1 = cx + 0.26 * cw, ya = y0 + 0.2 * ch, yb = y0 + 0.8 * ch, die = (c * 7 + f * 3 + fl) % 8;
    if (!f && Math.abs(cx - (o.doorSide ?? 1) * (w / 2 - 0.95)) < 0.62 + 0.26 * cw) continue;
    if (o.shaded && die % 4 === 1) { bd.col(ROOM, 1.3, 1.45).surf(SURF.PLAIN); bd.quad([x0, ya, zf + 0.03], [x1, ya, zf + 0.03], [x1, yb, zf + 0.03], [x0, yb, zf + 0.03]); }
    if (die !== 0) {
      const cu = (x1 - x0) * 0.27; bd.col(CURTAINS[(fl + c + 2 * f) % CURTAINS.length], 0.82, 1).surf(SURF.PLAIN);
      for (const [a, e] of [[x0, x0 + cu], [x1 - cu, x1]]) bd.quad([a, ya, zf + 0.045], [e, ya, zf + 0.045], [e, yb, zf + 0.045], [a, yb, zf + 0.045]);
    }
    const ym = ya + (yb - ya) * 0.52;
    bd.col(TRIM, 0.94, 1).surf(SURF.PLAIN);
    bd.quad([cx - 0.035, ya, zf + 0.06], [cx + 0.035, ya, zf + 0.06], [cx + 0.035, yb, zf + 0.06], [cx - 0.035, yb, zf + 0.06]);
    bd.quad([x0, ym - 0.035, zf + 0.06], [x1, ym - 0.035, zf + 0.06], [x1, ym + 0.035, zf + 0.06], [x0, ym + 0.035, zf + 0.06]);
  }
  return { eave, top: eave + rise, stack: [stX, stY + stH + 0.6, stZ] };
}

// a far house: walls with windows and a roof, nothing more
function farHouseInto(b, w, d, eave, rise, paint, roof, alongX, seed) {
  b.col(paint, 0.86, 1).surf(SURF.WINDOW, seed, 1);
  b.box(-w / 2, 0, -d / 2, w / 2, eave, d / 2, { cellW: 2.8, cellH: 3.1, top: false });
  b.col(roof, 1, 1).surf(SURF.PLAIN); b.gable(-w / 2, -d / 2, w / 2, d / 2, eave, rise, { alongX, overhang: 0.25, wallColor: paint });
  b.col(mul(paint, 0.7), 0.9, 1); b.cbox(alongX ? -w / 2 + 0.7 : 0, eave + rise - 0.4, alongX ? 0 : -d * 0.25, 1.1, 1.5, 0.7);
}

// ---------------------------------------------------------------- laying fronts
// A house whose front runs from A to B ([x, z]) with the street on the right hand of A -> B. fn(w) writes it in its
// own axes. xf is an optional further matrix in the house's axes (the house on its head, the small house).
const _m4 = new THREE.Matrix4();
function placeFront(b, A, B, depth, setback, fn, xf) {
  const tx = B[0] - A[0], tz = B[1] - A[1], w = Math.hypot(tx, tz), ux = tx / w, uz = tz / w, nx = -uz, nz = ux;
  const cx = (A[0] + B[0]) / 2 - nx * (depth / 2 + setback), cz = (A[1] + B[1]) / 2 - nz * (depth / 2 + setback);
  const bd = b.detail, ry = Math.atan2(-uz, ux);
  b.tr(cx, 0, cz, ry, 1); if (bd) bd.tr(cx, 0, cz, ry, 1);
  if (xf) { b.push(xf); if (bd) bd.push(xf); }
  const out = fn(w);
  if (xf) { b.pop(); if (bd) bd.pop(); }
  b.pop(); if (bd) bd.pop();
  return { w, cx, cz, nx, nz, ux, uz, out };
}
// what a house is, dealt from its terrace's stream: every die is drawn whether or not it is used
function dealHouse(r, prevPaint) {
  let pi = r.int(0, PAINTS.length - 1); if (pi === prevPaint) pi = (pi + 1 + r.int(0, PAINTS.length - 3)) % PAINTS.length;
  const gableFront = r.chance(0.25), floors = r.chance(0.7) ? 3 : 2, slate = r.chance(0.8);
  return {
    pi, paint: mul(PAINTS[pi], 0.9), gableFront, floors, roof: mul(slate ? SLATE : PANTILE, r.range(0.9, 1.08)), door: r.pick(DOORS), awning: r.pick(AWNINGS),
    flower: r.int(0, 5), doorSide: r.chance(0.5) ? 1 : -1, fh: r.range(2.92, 3.12), d: r.range(9.2, 10.8), setback: r.range(0, 0.22), seed: r(), wide: r.range(5.6, 7.9),
  };
}
// A straight terrace from P0 along (ux, uz) for len metres, the street on the right hand. slots: fixed houses by
// distance along the run, [{ at, w, make(b, w, A, B) }]. Returns the houses laid.
function layTerrace(b, r, P0, ux, uz, len, o, houses) {
  const plan = []; let prevPaint = -1, at = 0;
  const fill = (from, to) => {
    let a = from;
    while (a < to - 0.01) {
      const h = dealHouse(r, prevPaint); prevPaint = h.pi;
      let w = Math.min(h.wide, to - a); if (to - a - w < 4.2) w = to - a;
      plan.push([a, w, h]); a += w;
    }
  };
  for (const q of (o.slots || [])) { fill(at, q.at); const h = dealHouse(r, prevPaint); prevPaint = h.pi; h.slot = q; plan.push([q.at, q.w, h]); at = q.at + q.w; }
  fill(at, len);
  for (let i = 0; i < plan.length; i++) {
    const [a, w, h] = plan[i], A = [P0[0] + ux * a, P0[1] + uz * a], B = [P0[0] + ux * (a + w), P0[1] + uz * (a + w)];
    // o.b2: the run's second half is written into another mesh
    const bb = o.b2 && a + w / 2 >= len / 2 ? o.b2 : b;
    if (h.slot) { h.slot.make(bb, h, A, B); continue; }
    // far down a side street the houses are the far town's plain kind
    const rec = o.plain && o.plain(a, w) ? placeFront(bb, A, B, h.d, 0.1, (ww) => farHouseInto(bb, ww, h.d, 3.4 + (h.floors - 1) * h.fh, 2.9, h.paint, h.roof, true, h.seed))
      : placeFront(bb, A, B, h.d, h.setback + (i % 2) * 0.12, (ww) => houseInto(bb, r, Object.assign({}, h, o.style ? o.style(h) : null, { w: ww, rich: o.rich ?? 1, shaded: o.shaded ? o.shaded(A, B) : false })));
    houses.push(Object.assign(rec, { h, A, B, kind: o.kind, side: o.side || 0 }));
  }
}
// ball tree in a square planter (static geometry; the leaves' stir is in the shadow-free bunting shader's wind only)
function ballTreeInto(b, x, z, k) {
  b.col(KERB, 0.85, 1).surf(SURF.MASONRY, 0, 1); b.cbox(x, 0, z, 1.1, 0.55, 1.1, { m: 1 });
  b.col([0.16, 0.2, 0.1], 1, 1).surf(SURF.PLAIN); b.cbox(x, 0.5, z, 0.95, 0.08, 0.95);
  b.col([0.3, 0.22, 0.15], 0.8, 1); b.cyl(x, 0.55, z, 0.09, 0.07, 1.5, 6, { cap: false });
  b.col(mul(LEAF, 0.86 + 0.2 * k), 0.62, 1.08); b.sphere(x, 2.72, z, 0.92, 8, 5);
}
// a market barrow under a striped canopy: a flat bed on two wheels with heaps of fruit and flowers, four posts, a ridged canvas
function barrowInto(b, x, z, ry, awn, k) {
  b.tr(x, 0, z, ry, 1);
  b.col([0.2, 0.2, 0.22], 0.9, 1).surf(SURF.PLAIN);
  for (const sz of [-0.72, 0.72]) { b.cbox(-0.5, 0.02, sz, 0.78, 0.78, 0.07); b.cbox(-0.5, 0.2, sz, 1.05, 0.42, 0.07); }
  b.col([0.45, 0.3, 0.17], 0.85, 1); b.cbox(0, 0.72, 0, 2.5, 0.2, 1.3, { top: true }); b.cbox(1.05, 0, 0, 0.1, 0.72, 1.0);
  for (let i = 0; i < 4; i++) { b.col(FLOWERS[(i + Math.floor(k * 7)) % FLOWERS.length], 0.9, 1.05); b.cbox(-0.93 + i * 0.62, 0.92, 0, 0.54, 0.2 + 0.1 * ((i * 3 + Math.floor(k * 5)) % 3), 1.06, { top: true }); }
  b.col(TRIM, 0.9, 1);
  for (const sx of [-1.18, 1.18]) for (const sz of [-0.6, 0.6]) b.beam([sx, 0.9, sz], [sx, 2.32, sz], 0.06, 0.06);
  b.col(awn, 0.95, 1).surf(SURF.STRIPES, 0, 1);
  for (const sz of [-1, 1]) {
    b.quad([-1.45, 2.3, sz * 0.95], [1.45, 2.3, sz * 0.95], [1.45, 2.78, 0], [-1.45, 2.78, 0], [0, 0, 6, 1]);
    b.quad([1.45, 2.28, sz * 0.95], [-1.45, 2.28, sz * 0.95], [-1.45, 2.76, 0], [1.45, 2.76, 0], [0, 0, 6, 1]);
    b.quad([-1.45, 2.06, sz * 0.95], [1.45, 2.06, sz * 0.95], [1.45, 2.3, sz * 0.95], [-1.45, 2.3, sz * 0.95], [0, 0, 6, 1]);
    b.quad([1.45, 2.06, sz * 0.95], [-1.45, 2.06, sz * 0.95], [-1.45, 2.3, sz * 0.95], [1.45, 2.3, sz * 0.95], [0, 0, 6, 1]);
  }
  b.pop();
}
// a half barrel of flowers
function tubInto(b, x, z, k) {
  b.col([0.42, 0.28, 0.16], 0.85, 1).surf(SURF.PLANKS, 0, 1); b.cyl(x, 0, z, 0.62, 0.52, 0.62, 7, { cap: false });
  b.col(mul(LEAF, 1.1), 0.7, 1.05).surf(SURF.PLAIN); b.cyl(x, 0.6, z, 0.66, 0.6, 0.16, 7);
  b.col(FLOWERS[Math.floor(k * FLOWERS.length) % FLOWERS.length], 0.9, 1.08); b.cyl(x, 0.74, z, 0.5, 0.3, 0.22, 7);
}
// A FLOWER BED, wherever one lies: a low mound of leaves inside an edge (a stone kerb, or a clipped green border),
// mottled with clumps of bloom in three of the town's flower colours set over it on a turning pattern. len by wid
// on the ground, turned by ry; k (0..1) picks the colours and turns the pattern.
function moundInto(b, x, z, ry, len, wid, k, stone) {
  b.tr(x, 0, z, ry, 1);
  const y0 = stone ? 0.42 : 0.3, a = len / 2 - 0.22, c = wid / 2 - 0.22, h = Math.min(0.62, 0.34 * wid);
  if (stone) { b.col(KERB, 0.85, 1).surf(SURF.MASONRY, 0, 1); b.cbox(0, 0, 0, len, y0, wid, { m: 1 }); }
  else { b.col(mul(LEAF, 0.7), 0.8, 1).surf(SURF.PLAIN); b.cbox(0, 0, 0, len, y0, wid); }
  b.push(new THREE.Matrix4().makeScale(a, h, c).setPosition(0, y0 - 0.05, 0));
  b.col(mul(LEAF, 1.02), 0.78, 1.08).surf(SURF.PLAIN); b.lathe(0, 0, 0, [[1, 0], [0.93, 0.33], [0.72, 0.68], [0.4, 0.91], [0.02, 1]], 10, { smooth: true });
  b.pop();
  const n = Math.max(6, Math.round(len * wid * 1.15)), c0 = Math.floor(k * FLOWERS.length);
  for (let i = 0; i < n; i++) {
    const rr = Math.sqrt((i + 0.5) / n) * 0.84, an = i * 2.39996 + k * TAU, bloom = 0.17 + 0.05 * ((i * 5) % 3);
    b.col(FLOWERS[(c0 + ((i * 7) % 3) * 2) % FLOWERS.length], 0.86, 1.14);
    b.sphere(Math.cos(an) * rr * a, y0 - 0.05 + h * Math.sqrt(1 - rr * rr), Math.sin(an) * rr * c, bloom * Math.min(1.5, 0.6 + 0.4 * wid), 5, 3);
  }
  b.pop();
}
// a long low planter for a road's middle: a flower bed in a stone kerb, a small clipped ball at each end
function planterInto(b, x, z, ry, len, k) {
  moundInto(b, x, z, ry, len - 2.2, 1.3, k, true);
  b.tr(x, 0, z, ry, 1);
  for (const s of [-1, 1]) {
    b.col(KERB, 0.85, 1).surf(SURF.MASONRY, 0, 1); b.cbox(s * (len / 2 - 0.55), 0, 0, 1.1, 0.42, 1.3, { m: 1 });
    b.col(mul(LEAF, 0.9), 0.62, 1.08).surf(SURF.PLAIN); b.sphere(s * (len / 2 - 0.55), 1.0, 0, 0.5, 7, 5);
  }
  b.pop();
}
// a farm cart standing in a road: a flat bed on four wheels with a shaft, loaded with sacks, two churns and a crate of flowers
const SACK = lin('#d9c59a'), CHURN = lin('#c9ccd2');
function cartInto(b, x, z, ry, k) {
  b.tr(x, 0, z, ry, 1);
  b.col([0.2, 0.2, 0.22], 0.9, 1).surf(SURF.PLAIN);
  for (const sx of [-1.05, 1.05]) for (const sz of [-0.8, 0.8]) b.cbox(sx, 0.02, sz, 0.9, 0.9, 0.08);
  b.col(DOORS[Math.floor(k * DOORS.length) % DOORS.length], 0.8, 1); b.cbox(0, 0.62, 0, 3.2, 0.16, 1.5, { top: true });
  for (const sz of [-0.71, 0.71]) b.cbox(0, 0.78, sz, 3.2, 0.42, 0.07);
  b.col([0.45, 0.3, 0.17], 0.85, 1); b.beam([1.6, 0.66, 0], [3.3, 0.5, 0], 0.09, 0.09);
  b.col(SACK, 0.85, 1); b.cbox(-0.9, 0.78, 0.1, 0.9, 0.5, 0.8, { top: true }); b.cbox(-0.75, 1.28, 0.05, 0.8, 0.42, 0.7, { top: true });
  b.col(CHURN, 0.8, 1.05); for (const sz of [-0.3, 0.3]) b.cyl(0.25, 0.78, sz, 0.24, 0.2, 0.62, 7);
  b.col(FLOWERS[(2 + Math.floor(k * 6)) % FLOWERS.length], 0.9, 1.05); b.cbox(1.05, 0.78, 0, 0.8, 0.36, 1.0, { top: true });
  b.pop();
}
// THE FOUNTAIN: a broad round basin, a stem with two bowls one over the other, a finial. Its water plays on the
// clock (the drops are a mesh of their own, made in build).
const WATER = lin('#86cdea'), STONE = lin('#e9e1d0'), FOUNT_R = 6.5, BOWL_R = 2.6, BOWL_Y = 3.25, FOUNT_TOP = 6.2;
function fountainInto(b, x, z) {
  b.tr(x, 0, z, 0, 1);
  b.col(STONE, 0.82, 1).surf(SURF.MASONRY, 0, 1);
  b.lathe(0, 0, 0, [[FOUNT_R + 0.55, 0], [FOUNT_R + 0.55, 0.78], [FOUNT_R + 0.25, 0.98], [FOUNT_R - 0.3, 0.98], [FOUNT_R - 0.3, 0.3]], 24);
  b.lathe(0, 0, 0, [[1.6, 0.3], [0.95, 1.3], [0.55, 2.3], [0.5, 2.7], [BOWL_R + 0.1, 3.0], [BOWL_R + 0.2, BOWL_Y], [BOWL_R - 0.1, BOWL_Y]], 14);
  b.lathe(0, BOWL_Y - 0.1, 0, [[0.45, 0], [0.3, 1.2], [1.25, 1.5], [1.32, 1.72], [1.12, 1.72]], 12);
  b.lathe(0, 4.8, 0, [[0.24, 0], [0.16, 0.75], [0.32, 0.92], [0.05, FOUNT_TOP - 4.8]], 8);
  b.col(WATER, 0.9, 1.12).surf(SURF.PLAIN);
  b.disc(0, 0.66, 0, FOUNT_R - 0.3, 24); b.disc(0, BOWL_Y - 0.06, 0, BOWL_R - 0.1, 14); b.disc(0, 4.82, 0, 1.12, 12);
  b.pop();
}
// a cafe table under a parasol with three chairs. b takes what casts a shadow (the pole and the canopy), t the rest.
const PARASOLS = ['#f4a9b8', '#f6d470', '#8fd3bd', '#9cc3ee', '#f5b27a', '#c9a9e6'].map(lin), PARASOL_TOP = 2.95;
function cafeInto(b, t, x, z, ry, tint, k) {
  b.tr(x, 0, z, ry, 1);
  b.col(TRIM, 0.9, 1).surf(SURF.PLAIN); b.cyl(0, 0, 0, 0.05, 0.05, PARASOL_TOP - 0.05, 5, { cap: false });
  b.col(tint, 0.95, 1.05).surf(SURF.STRIPES, 0, 1); b.cyl(0, 2.3, 0, 1.6, 0.05, PARASOL_TOP - 2.3, 10, { cap: false });
  b.pop();
  t.tr(x, 0, z, ry, 1);
  t.col(TRIM, 0.9, 1).surf(SURF.PLAIN); t.cyl(0, 0.7, 0, 0.52, 0.52, 0.05, 8); t.cyl(0, 0, 0, 0.24, 0.07, 0.7, 6, { cap: false });
  for (let i = 0; i < 3; i++) {
    const a = TAU * (i + k) / 3;
    t.tr(Math.sin(a) * 0.98, 0, Math.cos(a) * 0.98, a, 1);
    t.col(mul(tint, 0.85), 0.9, 1); t.cbox(0, 0.4, 0, 0.42, 0.06, 0.42); t.cbox(0, 0.46, 0.19, 0.42, 0.44, 0.05);
    t.col(TRIM, 0.85, 1); t.cbox(0, 0, 0, 0.34, 0.4, 0.34, { top: false });
    t.pop();
  }
  t.pop();
}
// THE CLOCK TOWER: a square stone shaft of TOWER_W to its eaves at TOWER_H, a string course, a pale round face with a
// dark rim and two hands (no marks) high on each side, a copper cap. hr, mn: the hands' angles.
const TOWER_W = 7, FACE_UP = 4.6, FACE_R = 2.3;
function towerInto(b, x, z, hr, mn) {
  b.tr(x, 0, z, 0, 1);
  b.col(lin('#eadfc6'), 0.85, 1).surf(SURF.MASONRY, 0, 1); b.cbox(0, 0, 0, TOWER_W, TOWER_H, TOWER_W, { m: 1 });
  b.col(TRIM, 0.9, 1).surf(SURF.PLAIN); b.cbox(0, TOWER_H - 2 * FACE_UP, 0, TOWER_W + 0.5, 0.45, TOWER_W + 0.5); b.cbox(0, TOWER_H, 0, TOWER_W + 0.9, 0.6, TOWER_W + 0.9);
  const fy = TOWER_H - FACE_UP, zf = TOWER_W / 2;
  for (let s = 0; s < 4; s++) {
    b.tr(0, 0, 0, s * Math.PI / 2, 1);
    for (const [r, zz, c] of [[FACE_R + 0.28, 0.05, IRON], [FACE_R, 0.09, lin('#fbf6e6')]]) {
      b.col(c, 1, 1).surf(SURF.PLAIN);
      for (let i = 0; i < 16; i++) { const a0 = TAU * i / 16, a1 = TAU * (i + 1) / 16; b.tri([0, fy, zf + zz], [Math.cos(a0) * r, fy + Math.sin(a0) * r, zf + zz], [Math.cos(a1) * r, fy + Math.sin(a1) * r, zf + zz]); }
    }
    b.col(IRON, 1, 1);
    b.beam([0, fy, zf + 0.16], [Math.sin(hr) * FACE_R * 0.55, fy + Math.cos(hr) * FACE_R * 0.55, zf + 0.16], 0.24, 0.06);
    b.beam([0, fy, zf + 0.2], [Math.sin(mn) * FACE_R * 0.86, fy + Math.cos(mn) * FACE_R * 0.86, zf + 0.2], 0.16, 0.06);
    b.pop();
  }
  b.tr(0, TOWER_H + 0.6, 0, Math.PI / 4, 1);
  b.col(COPPER, 0.78, 1.05).surf(SURF.PLAIN); b.lathe(0, 0, 0, [[TOWER_W * 0.76, 0], [TOWER_W * 0.42, 3.2], [0.7, 6.2], [0.14, 7.4]], 4, { facet: true });
  b.col(lin('#d9b24a'), 0.8, 1.1); b.sphere(0, 7.6, 0, 0.3, 8, 5);
  b.pop(); b.pop();
  return { top: TOWER_H + 8.5, face: fy };
}
// THE DESSERT SHOPS' SIGNS, hung over the door on an iron bracket: a great cone with two scoops, or a great cup with
// three and a wafer. (x, y, z): the bracket's foot on the wall; (nx, nz): out from the wall. c1, c2: the scoops.
const WAFER = lin('#d9a45c'), SCOOPS = ['#f6a6bd', '#fbf0d0', '#9bdcc0', '#c79a6b', '#f8d568', '#d7b4f0'].map(lin), CHERRY = lin('#d8262c');
function dessertSignInto(b, x, y, z, nx, nz, cup, c1, c2) {
  const px = x + nx * 1.25, pz = z + nz * 1.25;
  b.col(IRON, 1, 1).surf(SURF.PLAIN); b.beam([x, y + 2.4, z], [px, y + 2.4, pz], 0.08, 0.08); b.beam([px, y + 2.4, pz], [px, y + 2.05, pz], 0.05, 0.05);
  if (cup) {
    b.col(lin('#eef4fb'), 0.85, 1.05); b.cyl(px, y, pz, 0.34, 0.1, 0.12, 8); b.cyl(px, y + 0.1, pz, 0.08, 0.08, 0.34, 6, { cap: false }); b.cyl(px, y + 0.44, pz, 0.34, 0.78, 0.62, 10, { cap: false });
    b.col(c1, 0.9, 1.05); b.sphere(px - 0.3, y + 1.16, pz, 0.42, 8, 5); b.col(c2, 0.9, 1.05); b.sphere(px + 0.3, y + 1.16, pz, 0.42, 8, 5);
    b.col(SCOOPS[1], 0.9, 1.05); b.sphere(px, y + 1.52, pz, 0.42, 8, 5);
    b.col(WAFER, 0.9, 1); b.beam([px + 0.25, y + 1.5, pz], [px + 0.62, y + 2.15, pz], 0.3, 0.05);
    b.col(CHERRY, 0.9, 1.1); b.sphere(px, y + 2.0, pz, 0.14, 6, 4);
  } else {
    b.col(WAFER, 0.9, 1).surf(SURF.TILES, 0, 1); b.cyl(px, y - 0.55, pz, 0.04, 0.5, 1.5, 9, { cap: false });
    b.surf(SURF.PLAIN); b.col(c1, 0.9, 1.05); b.sphere(px, y + 1.12, pz, 0.56, 9, 6); b.col(c2, 0.9, 1.05); b.sphere(px, y + 1.78, pz, 0.44, 8, 5);
    b.col(CHERRY, 0.9, 1.1); b.sphere(px, y + 2.22, pz, 0.13, 6, 4);
  }
}

// ---------------------------------------------------------------- bunting: strings of pennants that flutter on the clock
// strings: [{ a: [x, y, z], b: [x, y, z], sag, tint }]. One mesh, one call; every pennant is a triangle whose tip swings.
const BUNT_LEN = 0.78, BUNT_W = 0.62;
const buntPoint = (st, t, out) => { out[0] = lerp(st.a[0], st.b[0], t); out[1] = lerp(st.a[1], st.b[1], t) - st.sag * 4 * t * (1 - t); out[2] = lerp(st.a[2], st.b[2], t); return out; };
function makeBunting(strings, uniforms) {
  const pos = [], col = [], sway = [], ph = [], cols = BUNT.map(lin), p = [0, 0, 0], q = [0, 0, 0];
  for (const st of strings) {
    const span = Math.hypot(st.b[0] - st.a[0], st.b[1] - st.a[1], st.b[2] - st.a[2]), n = Math.max(2, Math.floor(span / (BUNT_W + 0.05)));
    const hx = (st.b[0] - st.a[0]) / span, hz = (st.b[2] - st.a[2]) / span;
    for (let i = 0; i < n; i++) {
      buntPoint(st, (i + 0.04) / n, p); buntPoint(st, (i + 0.96) / n, q);
      const c = cols[(i + st.tint) % cols.length], f = (i * 0.618 + st.tint * 0.37) % 1;
      pos.push(p[0], p[1], p[2], q[0], q[1], q[2], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - BUNT_LEN, (p[2] + q[2]) / 2);
      for (let k = 0; k < 3; k++) { col.push(c[0], c[1], c[2]); ph.push(f); }
      sway.push(0, 0, 0, 0, 0, 0, -hz * 0.3 + hx * 0.08, 0.06, hx * 0.3 + hz * 0.08);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 3)); g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
  const material = new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide, fog: true, vertexColors: true,
    vertexShader: `uniform float uTime; attribute vec3 aSway; attribute float aPhase; varying vec3 vCol; varying float vTip;
      #include <fog_pars_vertex>
      void main() {
        float w = sin(uTime * 3.1 + aPhase * 6.2832) * 0.7 + sin(uTime * 5.3 + aPhase * 17.0) * 0.3;
        vec3 p = position + aSway * w;
        vCol = color; vTip = step(0.001, dot(aSway, aSway));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uBuntLight; varying vec3 vCol; varying float vTip;
      #include <fog_pars_fragment>
      void main() {
        vec3 c = vCol * uBuntLight * (0.86 + 0.14 * (1.0 - clamp(vTip, 0.0, 1.0)));
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.castShadow = true; mesh.frustumCulled = false; mesh.name = 'bunting';
  return mesh;
}

// ---------------------------------------------------------------- the land: gardens, the far town's streets, hedged fields, green hills
// One painter draws the same lists at two scales: a fine painting under the town and a coarse one out to the hills.
// the land's middle is the town's: the corner where the high street meets the second street
const LAND_C = [X_END, Z2], TC = LAND_C;
// the town's own plate of land (the fine painting) is a square this wide about that middle; the coarse painting lies beyond
const TOWN_PLATE = 1100;
// a garden's own green (its lawn), and how high and wide its clipped hedge stands
const LAWNS = ['#93c672', '#8abf6a', '#9ccb79', '#86ba66', '#a3cf82', '#90c36e'], HEDGE_H = 1.7, HEDGE_W = 0.9, SHADE_TILES = 8;
async function paintLand(canvas, extent, L, yieldFn) {
  // (the canvas is asked for as one that is read often: it is then drawn at once in the page's own memory, so its
  // painting is this build's own work in its own steps and nothing of it is left to be drawn later all at once)
  const g = canvas.getContext('2d', { willReadFrequently: true }), N = canvas.width, k = N / extent, X = (x) => (x - LAND_C[0]) * k + N / 2, Z = (z) => (z - LAND_C[1]) * k + N / 2;
  g.fillStyle = '#79ad5c'; g.fillRect(0, 0, N, N);
  let ops = 0; const tick = async () => { if (++ops % 80 === 0) await yieldFn(); };
  const seen = (x, z, r) => X(x + r) > 0 && X(x - r) < N && Z(z + r) > 0 && Z(z - r) < N;
  // hedged fields: each its own green or gold, some in crop rows, a dark hedge round each
  for (const f of L.fields) {
    if (X(f.x + f.w) < 0 || X(f.x) > N || Z(f.z + f.d) < 0 || Z(f.z) > N) continue;
    g.fillStyle = f.c; g.fillRect(X(f.x), Z(f.z), f.w * k + 1, f.d * k + 1);
    if (f.rows && k > 0.3) {
      g.strokeStyle = 'rgba(40,70,30,0.22)'; g.lineWidth = Math.max(1, 2.2 * k); g.beginPath();
      for (let t = 6; t < (f.rows > 0 ? f.w : f.d); t += 9) { if (f.rows > 0) { g.moveTo(X(f.x + t), Z(f.z)); g.lineTo(X(f.x + t), Z(f.z + f.d)); } else { g.moveTo(X(f.x), Z(f.z + t)); g.lineTo(X(f.x + f.w), Z(f.z + t)); } }
      g.stroke();
    }
    g.strokeStyle = '#3f6b38'; g.lineWidth = Math.max(1.7, 5.5 * k); g.strokeRect(X(f.x), Z(f.z), f.w * k, f.d * k);
    await tick();
  }
  // woods: dark rounds in clumps, lit on the sun's side
  for (const w of L.woods) {
    if (!seen(w[0], w[1], w[2])) continue;
    g.fillStyle = '#35602f'; g.beginPath(); g.arc(X(w[0]), Z(w[1]), w[2] * k, 0, 6.3); g.fill();
    g.fillStyle = '#477a3c'; g.beginPath(); g.arc(X(w[0]) - w[2] * k * 0.22, Z(w[1]) + w[2] * k * 0.22, w[2] * k * 0.62, 0, 6.3); g.fill();
    await tick();
  }
  // the town's own ground: lawns and gardens inside the town's edge
  g.fillStyle = '#84b964';
  g.beginPath(); for (let i = 0; i <= 48; i++) { const a = Math.PI * 2 * i / 48, r = L.edge[i % 48]; g.lineTo(X(L.centre[0] + Math.cos(a) * r), Z(L.centre[1] + Math.sin(a) * r)); } g.fill();
  // gardens: a clipped hedge round each plot, its own green of lawn, a pale path through it
  if (k > 0.8) for (const p of L.plots) {
    const x = X(p.x), z = Z(p.z), w = p.w * k, d = p.d * k;
    g.fillStyle = LAWNS[p.bed]; g.fillRect(x, z, w, d);
    g.fillStyle = '#e6dcc4'; if (p.turn) g.fillRect(x, z + d * 0.46, w, d * 0.1); else g.fillRect(x + w * 0.46, z, w * 0.1, d);
    g.strokeStyle = '#3f7a3a'; g.lineWidth = Math.max(1.5, HEDGE_W * k); g.strokeRect(x, z, w, d);
    await tick();
  }
  // the shade under each garden tree: a dark round with a lit side
  if (k > 0.8) for (const t of L.shrubs) {
    g.fillStyle = '#4a8540'; g.beginPath(); g.arc(X(t[0]), Z(t[1]), t[2] * k, 0, 6.3); g.fill();
    g.fillStyle = '#64a04f'; g.beginPath(); g.arc(X(t[0]) - t[2] * k * 0.25, Z(t[1]) + t[2] * k * 0.25, t[2] * k * 0.6, 0, 6.3); g.fill();
    await tick();
  }
  // lanes out to the hills, then the town's streets
  g.lineCap = 'round'; g.strokeStyle = '#e2d8c2';
  for (const ln of L.lanes) { g.lineWidth = Math.max(2, 8 * k); g.beginPath(); ln.forEach((q, i) => (i ? g.lineTo(X(q[0]), Z(q[1])) : g.moveTo(X(q[0]), Z(q[1])))); g.stroke(); await tick(); }
  for (const st of L.streets) {
    if (!seen((st[0] + st[2]) / 2, (st[1] + st[3]) / 2, 120)) continue;
    g.strokeStyle = '#d6ccb9'; g.lineWidth = Math.max(1.5, st[4] * k); g.beginPath(); g.moveTo(X(st[0]), Z(st[1])); g.lineTo(X(st[2]), Z(st[3])); g.stroke();
    await tick();
  }
  // the green: its lawn inside a clipped hedge (no street of the far town runs on into it), its pale middle path
  // and the round paths about what stands on it, the shade under each of its great trees
  if (k > 0.8) for (const q of L.greens) {
    const x = X(q.x), z = Z(q.z), w = q.w * k, d = q.d * k;
    g.fillStyle = LAWNS[q.bed]; g.fillRect(x, z, w, d);
    g.fillStyle = '#e6dcc4'; g.fillRect(x, z + d / 2 - q.path * k / 2, w, q.path * k);
    g.strokeStyle = '#e6dcc4'; g.lineWidth = q.path * k;
    for (const r of q.rings) { g.beginPath(); g.arc(X(r[0]), Z(r[1]), r[2] * k, 0, 6.3); g.stroke(); }
    g.strokeStyle = '#3f7a3a'; g.lineWidth = Math.max(1.5, HEDGE_W * k); g.strokeRect(x, z, w, d);
    for (const t of q.trees) {
      g.fillStyle = '#4a8540'; g.beginPath(); g.arc(X(t[0]), Z(t[1]), t[2] * k, 0, 6.3); g.fill();
      g.fillStyle = '#64a04f'; g.beginPath(); g.arc(X(t[0]) - t[2] * k * 0.25, Z(t[1]) + t[2] * k * 0.25, t[2] * k * 0.6, 0, 6.3); g.fill();
    }
    await tick();
  }
  // LONG SHADOWS of what the shadow light does not draw (the far town's houses, the garden hedges and trees cast
  // none of their own): L.shade is where a thing's top throws its shadow, in metres for each metre of its height.
  // Within each of SHADE_TILES squares of the canvas each way (squares of whole dots: no dot lies in two of them)
  // they are one path, every part of it running the same way round, filled once: so where two fall together the
  // ground is no darker.
  if (k > 0.8 && L.shade) {
    const sx = L.shade[0] * k, sz = L.shade[1] * k, long = Math.hypot(1, L.shade[0], L.shade[1]), turn = Math.atan2(sz, sx), parts = [];
    // a part of the path: its corners in order (turned to run the way a rect runs) and the box it lies in
    const part = (q) => {
      let a = 0, x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      if (a < 0) q.reverse();
      parts.push({ x0, z0, x1, z1, q });
    };
    const rect = (x, z, w, d) => part([[x, z], [x + w, z], [x + w, z + d], [x, z + d]]);
    for (const p of L.plots.concat(L.greens)) {
      const x = X(p.x), z = Z(p.z), w = p.w * k, d = p.d * k, ox = sx * HEDGE_H, oz = sz * HEDGE_H;
      rect(x, oz > 0 ? z : z + d + oz, w, Math.abs(oz)); rect(ox > 0 ? x : x + w + ox, z, Math.abs(ox), d);
    }
    await yieldFn();
    // a tree: its crown's middle is 1.59 of the painted round's radius up, the crown 0.85 of it across
    for (const t of L.shrubs.concat(...L.greens.map((q) => q.trees))) {
      const fx = X(t[0]), fz = Z(t[1]), cx = fx + sx * 1.59 * t[2], cz = fz + sz * 1.59 * t[2];
      const hw = Math.max(1, 0.22 * t[2] * k) / 2, l = Math.hypot(cx - fx, cz - fz) || 1, nx = -(cz - fz) / l * hw, nz = (cx - fx) / l * hw;
      part([[fx + nx, fz + nz], [cx + nx, cz + nz], [cx - nx, cz - nz], [fx - nx, fz - nz]]);
      const rx = 0.85 * t[2] * k * long, ry = 0.85 * t[2] * k;
      parts.push({ x0: cx - rx, z0: cz - rx, x1: cx + rx, z1: cz + rx, round: [cx, cz, rx, ry] });
    }
    await yieldFn();
    // a house: [middle x, z, along x, z, half width, half depth, height]; its plan swept along its shadow
    for (const c of L.casts) {
      if (!seen(c[0], c[1], 60)) continue;
      const o = [sx * c[6], sz * c[6]], q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, e]) => [X(c[0] + c[2] * c[4] * a - c[3] * c[5] * e), Z(c[1] + c[3] * c[4] * a + c[2] * c[5] * e)]);
      // an edge leads when the shadow's way points out of it
      const lead = (a, e) => (e[1] - a[1]) * o[0] - (e[0] - a[0]) * o[1] > 0, hull = [];
      for (let i = 0; i < 4; i++) {
        const p1 = q[i], l0 = lead(q[(i + 3) % 4], p1), l1 = lead(p1, q[(i + 1) % 4]);
        if (l0 && !l1) hull.push([p1[0] + o[0], p1[1] + o[1]], [p1[0], p1[1]]);
        else if (!l0 && l1) hull.push([p1[0], p1[1]], [p1[0] + o[0], p1[1] + o[1]]);
        else hull.push([p1[0] + (l0 ? o[0] : 0), p1[1] + (l0 ? o[1] : 0)]);
      }
      part(hull);
    }
    await yieldFn();
    g.fillStyle = '#14304e'; g.globalAlpha = 0.42;
    const T = Math.ceil(N / SHADE_TILES);
    for (let tz = 0; tz < SHADE_TILES; tz++) for (let tx = 0; tx < SHADE_TILES; tx++) {
      const x0 = tx * T, z0 = tz * T;
      g.save(); g.beginPath(); g.rect(x0, z0, T, T); g.clip(); g.beginPath();
      for (const p of parts) {
        if (p.x1 < x0 || p.x0 > x0 + T || p.z1 < z0 || p.z0 > z0 + T) continue;
        if (p.round) { const [cx, cz, rx, ry] = p.round; g.moveTo(cx + Math.cos(turn) * rx, cz + Math.sin(turn) * rx); g.ellipse(cx, cz, rx, ry, turn, 0, 6.2832); g.closePath(); }
        else { g.moveTo(p.q[0][0], p.q[0][1]); for (let i = 1; i < p.q.length; i++) g.lineTo(p.q[i][0], p.q[i][1]); g.closePath(); }
      }
      g.fill(); g.restore();
      await yieldFn();
    }
    g.globalAlpha = 1;
  }
  // farms: a pale yard, a long roof and a barn
  for (const f of L.farms) {
    if (!seen(f[0], f[1], 40)) continue;
    g.fillStyle = '#d9cfb8'; g.fillRect(X(f[0] - 22), Z(f[1] - 16), 44 * k, 32 * k);
    g.fillStyle = f[2] ? '#a8503a' : '#59636f'; g.fillRect(X(f[0] - 16), Z(f[1] - 11), 24 * k, 9 * k);
    g.fillStyle = '#f1ede2'; g.fillRect(X(f[0] - 16), Z(f[1] - 2), 24 * k, 2.2 * k);
    g.fillStyle = '#8a4a36'; g.fillRect(X(f[0] + 2), Z(f[1] + 3), 15 * k, 10 * k);
  }
}

export default {
  id: 'shoal-over-the-high-street',
  name: 'The Shoal over the High Street',
  category: 'screen',
  placeKind: 'city',
  screen: 'The Good Place',
  screenYear: '2016',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.6,
  async build(ctx) {
    const scene = new THREE.Scene();
    // THE STREAMS, one list, each from the world's seed and a name (none draws from another)
    const mk = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const rLook = mk('look'), rEast = mk('fronts-east'), rWest = mk('fronts-west'), rMkt = mk('market'), rSide = mk('side-streets');
    const rFar = mk('far-town'), rBunt = mk('bunting'), rShoal = mk('shoal'), rLand = mk('land'), rSky = mk('sky');
    const rLanes = mk('wheel-rings'), rRare = mk('rare-visit'), rStalls = mk('stalls'), rGroom = mk('tenders'), rYard = mk('yard'), rMid = mk('road-middles');
    const rTower = mk('clock-tower'), rFount = mk('fountain'), rCloud = mk('clouds'), rHill = mk('hill-clouds'), rRibbon = mk('ribbon'), rGreen = mk('green');
    const rSt2 = mk('fronts-second'), rSt3 = mk('fronts-third'), rFile = mk('street-file'), rGard = mk('gardens'), rHerd = mk('giraffes'), rBugs = mk('ladybirds');
    const rWestSt = mk('west-street'), rFloor = mk('street-floors'), rAhead = mk('giraffes-ahead'), rArm = mk('west-arm');
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const tU = { value: 0 };

    // ------------------------------------------------------------ the look: a clear morning, the sun low at three heights
    // LONG SHADOWS: the sun stands so low that a thing's shadow lies SHADOW times its height long; three such
    // lengths are dealt, so the hours differ in the sun's height only. ITS BEARING follows from its height: the one
    // bearing that lays the shadow of the high street's great one, when it swims over the middle of the street's
    // swing, back down the middle of the street's first straight. So the sun stands ahead of the entry, a little to
    // the left of the high street's own bearing: long shadows lie down the streets toward the entry, the fronts on
    // one side are warm and those on the other in blue shade, and what swims over a street throws its shadow on the
    // street ahead of itself.
    const SHADOW = [2.6, 2.8, 3];
    // A CLEAR MORNING. The sky: deep blue overhead (SKY_TOP), paler and warmer down at the horizon (SKY_LOW). THE
    // SUN'S LIGHT is a clear morning gold (SUN_GOLD); what lies in shade is lit by the sky's own cool blue. THE
    // HAZE lies thin and bright on the land (SKY_AIR its colour, HAZE how fast it thickens): at a street's length,
    // 230 m, it pales a thing by a fiftieth; the fields a kilometre off by a third, the hills beyond by three
    // quarters and more. A pane mirrors the clear blue above the haze (PANE_SKY).
    const SKY_TOP = '#1c62c4', SKY_LOW = '#e9e2d2', SKY_AIR = '#dde4e8', SUN_C = '#ffb468', SUN_GOLD = '#ffe4bc', HAZE = 0.00062, PANE_SKY = '#7fb3e8';
    const hourDraw = rLook.int(0, 2), hourAsked = { dawn: 0, day: 1, golden: 2 }[vary.hour];
    const shadow = SHADOW[hourAsked ?? hourDraw], swing = rLook.range(17, 20), slant = rLook.range(0, 1);
    // THE ANIMAL'S MEASURES (the sun's bearing and the ring's height need them)
    const shrimpKit = await prepareShrimps(ctx, ['near', 'far', SHADE_SKIN]);
    const bs = shrimpKit.near.bounds.swim, bh = shrimpKit.near.bounds.hover;
    // THE RING'S HEIGHT is the ring's own measure over the roofs: the height at which the least of the great ones
    // could pass whole through its middle with ROOF_AIR between its lowest part and the highest chimney pots. The
    // ring is a door for the great ones too, though none goes through it on this flight.
    const leastGreat = GREAT_K[GREAT_K.length - 1], RING_Y = ROOF_TOP + ROOF_AIR + (bs.down + bs.up) / 2 * leastGreat;
    await ctx.yield();
    // the street-file stream's dice in one list: the great one's phase, the three small ones', the great one's size
    const fileDice = [rFile(), rFile(), rFile(), rFile(), rFile()];
    // THE GREAT ONE OF THE HIGH STREET: its size a draw from the shoal's great sizes; it swims with its lowest part
    // ROOF_AIR over the highest chimney pots (the wheel's own rule over roofs)
    const FILE_K = GREAT_K[Math.floor(fileDice[4] * GREAT_K.length) % GREAT_K.length], FILE_Y = ROOF_TOP + ROOF_AIR + Math.max(bs.down, bs.feelerDown) * FILE_K;
    const street = makeStreet(swing);
    const S_SWING = (BEND0 + BEND1) / 2, sunEl = Math.atan(1 / shadow), sunAz = Math.asin(clamp(street.cx(S_SWING) / (FILE_Y * shadow), -1, 1));
    const sky = makeSky({
      rng: rSky, preset: 'day', zenith: SKY_TOP, horizon: SKY_LOW, ground: '#8fb09a', sunElevation: sunEl * 360 / TAU, sunAzimuth: sunAz * 360 / TAU, sunColor: SUN_C, lightColor: SUN_GOLD,
      clouds: false, clouds2: false, scatter: 0.18, sunGlow: 0.8,
    });
    scene.add(sky.object);
    // the shadow light stands SUN_OUT up its own ray, far enough that the high clouds are before it for every place it lights
    const SUN_OUT = 900;
    // THE SHADE KEEPS ITS COLOUR: two lights fill it. THE SKY: the hemisphere's light from above, at the kit's own
    // full measure. THE TOWN'S BOUNCE, the hemisphere's light from below: what the town's sunlit floor throws back,
    // the sun as it falls on level ground and the sky's light together, times the paving's own colour, BOUNCE of
    // it (the same bounce, by the same rule, as the animals' part works out for itself). So a wall in full shade
    // stands in half the sky's light and half the bounce, and paving in shadow in the sky's light alone: blue grey.
    // SUN_K is the sun's own strength, of the kit's: with it a wall square to the sun stands about five times as
    // bright as the same wall in full shade.
    const SUN_K = 1.48, BOUNCE = 0.8;
    const rig = makeLightRig(sky, { shadow: true, shadowSize: 2048, shadowRange: 170, distance: SUN_OUT, intensity: SUN_K, ambient: 1 });
    rig.sun.shadow.bias *= 500 / SUN_OUT;
    {
      const s = rig.sun.color, h = rig.hemi.color, down = rig.sun.intensity * Math.max(0, sky.lightDirection.y) / rig.hemi.intensity;
      rig.hemi.groundColor.setRGB((s.r * down + h.r) * PAVING[0] * BOUNCE, (s.g * down + h.g) * PAVING[1] * BOUNCE, (s.b * down + h.b) * PAVING[2] * BOUNCE);
    }
    scene.add(rig.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(SKY_AIR), HAZE);
    // the panes are a clear blue-grey that takes the sky (the kit's own glass is near black by day)
    const mats = S.makeMaterials({ night: 0, streetY: 0, glass: '#4d6f93', reflect: 1.7 });
    // a front from A to B (the street on the right hand) stands in shade when the sun is behind it
    const shadedFront = (A, B) => -(B[1] - A[1]) * sky.sunDirection.x + (B[0] - A[0]) * sky.sunDirection.z < 0;
    mats.setSky({ top: SKY_TOP, horizon: PANE_SKY, sun: SUN_C, sunDir: [sky.sunDirection.x, sky.sunDirection.y, sky.sunDirection.z] });
    await ctx.yield();

    // ------------------------------------------------------------ the route
    // where THE HOUSE ON ITS HEAD stands: its front square to the straight street it closes, centred a little to one
    // side of that straight's axis, in a walled yard where the east terrace bends away to the west
    const w1x = lerp(-0.6, 1.0, slant);
    let sYard = BEND0 + 8;
    while (sYard < BEND1 - 6 && street.at(sYard, HALF)[0] > w1x - W1_WIDE / 2) sYard += 0.25;
    const route = routePoints(street, sYard, RING_Y), path = makePath(route.pts);
    // THE RING GIVES LIGHT: a lamp of the ring's own colour at its middle, RING_GLOW strong, falling off with the
    // square of the distance and gone at GLOW_FAR: its glow lies on the roofs and on the street under the ring
    const RING_C = '#ffe7a6', RING_GLOW = 800, GLOW_FAR = 70;
    {
      const lamp = new THREE.PointLight(RING_C, RING_GLOW, GLOW_FAR, 2);
      lamp.position.set(route.end[0], route.end[1], route.end[2]); scene.add(lamp);
    }
    const L = path.length;
    // ------------------------------------------------------------ the route's line every 2 m, for every test of clear air made in build
    const lineN = Math.ceil(L / 2), line = new Float32Array((lineN + 1) * 3), _v = new THREE.Vector3();
    for (let i = 0; i <= lineN; i++) { path.posAtDist(Math.min(L, i * 2), _v); line[i * 3] = _v.x; line[i * 3 + 1] = _v.y; line[i * 3 + 2] = _v.z; }
    // distance from a point to the route's line (segments between the 2 m marks), optionally only marks i0..i1
    const lineDist = (x, y, z, i0 = 0, i1 = lineN) => {
      let best = Infinity;
      for (let i = i0; i < i1; i++) {
        const ax = line[i * 3], ay = line[i * 3 + 1], az = line[i * 3 + 2], dx = line[i * 3 + 3] - ax, dy = line[i * 3 + 4] - ay, dz = line[i * 3 + 5] - az;
        const t = clamp(((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
        const ex = ax + dx * t - x, ey = ay + dy * t - y, ez = az + dz * t - z, d2 = ex * ex + ey * ey + ez * ez;
        if (d2 < best) best = d2;
      }
      return Math.sqrt(best);
    };
    const CLEAR = 2.6, TREE_AIR = 3;
    // PLACES OF THE ROUTE in metres along it, read off the line itself: where the first corner's arc begins and ends,
    // where the second corner's arc begins and ends, the third street's mouth on the square, the climbing turn's
    // first metre (due east of the fountain), the climb's end, where the last way begins (the tower's west side) and
    // where it comes onto the west street's axis
    let iA0 = 0, iA1 = 0, iB0 = 0, iB1 = 0, iMouth = 0, iRound = 0;
    for (let i = 0; i <= lineN; i++) {
      const x = line[i * 3], z = line[i * 3 + 2];
      if (!iA0 && z <= -route.sA) iA0 = i;
      if (iA0 && !iA1 && x >= route.xA1) iA1 = i;
      if (iA1 && !iB0 && x >= route.xB0) iB0 = i;
      if (iB0 && !iB1 && z <= route.zB1) iB1 = i;
      if (iB1 && !iMouth && z <= route.zMouth) iMouth = i;
      if (iMouth && !iRound && z <= BZ) iRound = i;
    }
    // the line's mark nearest a place, from mark i0 on
    const markNear = (x, z, i0) => { let b0 = i0, bd = Infinity; for (let i = i0; i <= lineN; i++) { const d = Math.hypot(line[i * 3] - x, line[i * 3 + 2] - z); if (d < bd) { bd = d; b0 = i; } } return b0; };
    const iTop = markNear(route.top[0], route.top[1], iRound + Math.round(TAU * R_IN / 2)), iLeave = markNear(route.leave[0], route.leave[1], iTop), iAxis = markNear(route.onAxis[0], route.onAxis[1], iLeave);
    const mA0 = iA0 * 2, mA1 = iA1 * 2, mB0 = iB0 * 2, mB1 = iB1 * 2, mMouth = iMouth * 2, mRound = iRound * 2, mTop = iTop * 2, mLeave = iLeave * 2, mAxis = iAxis * 2, LAST = L - mLeave;

    // ------------------------------------------------------------ where the house on its head stands
    const sMid = sYard, wrongAt = [sYard - W1_IN, null];
    await ctx.yield();
    const houses = [], solids = [];
    const addMesh = (b, name, shadows = true) => {
      if (!b.triangles) return null;
      const m = new THREE.Mesh(b.toGeometry(), mats.facades); m.name = name; m.castShadow = shadows; m.receiveShadow = true; scene.add(m);
      if (b.detail && b.detail.triangles) { const t = new THREE.Mesh(b.detail.toGeometry(), mats.facades); t.name = name + '-trim'; t.castShadow = false; t.receiveShadow = true; scene.add(t); }
      return m;
    };
    // a builder for fronts: its shell, and its trim in a second builder
    const frontsBuilder = () => { const b = S.makeBuilder(8192); b.detail = S.makeBuilder(8192); return b; };

    // ------------------------------------------------------------ the high street's two terraces, with the house on its head (east); the east one ends at the corner's splay, the west one at the corner with the second street's west arm
    const layStreetSide = async (halves, r, side, sEnd, wrongS, wrongKind) => {
      let s = S_BACK, prevPaint = -1, iW = -1; const cuts = [s], deals = [];
      while (s < sEnd - 0.01) {
        const h = dealHouse(r, prevPaint); prevPaint = h.pi; let w = h.wide;
        if (wrongS != null && iW < 0 && s >= wrongS - 3.2) { h.wrong = wrongKind; iW = deals.length; w = YARD; }
        if (sEnd - s - w < 4.5) w = sEnd - s;
        s += w; cuts.push(s); deals.push(h);
      }
      // the wrong house's slot begins exactly at wrongS: the houses before it and after it are let out or taken in a little
      if (iW >= 0) {
        const c0 = cuts[iW], f0 = (wrongS - S_BACK) / (c0 - S_BACK), f1 = (sEnd - wrongS) / (sEnd - c0);
        for (let i = 0; i < cuts.length; i++) cuts[i] = i <= iW ? S_BACK + (cuts[i] - S_BACK) * f0 : wrongS + (cuts[i] - c0) * f1;
      }
      for (let i = 0; i < deals.length; i++) {
        const h = deals[i], P = street.at(cuts[i], side * HALF), Q = street.at(cuts[i + 1], side * HALF), A = side > 0 ? Q : P, B = side > 0 ? P : Q;
        const sMid = (cuts[i] + cuts[i + 1]) / 2, b = halves[sMid < (S_BACK + sEnd) / 2 ? 0 : 1];
        let rec;
        if (h.wrong === 'head') {
          // W1 THE HOUSE ON ITS HEAD: a house of the terrace, three floors, its eaves to the street like its neighbours,
          // turned over: its tiled roof pressed half a metre into the lawn of a walled yard with the turf broken round
          // it, its door and step at the top, its flower boxes hanging the wrong way. Its front is square to the
          // straight street it closes.
          const o = Object.assign({}, h, { gableFront: false, floors: 3, rich: 1, allBoxes: true, roof: mul(PANTILE, 1.3), tiles: true, rise: 3.3 });
          const Pw = street.at(cuts[i] + W1_IN, HALF), zF = Pw[1] - W1_BACK, Aw = [Pw[0], zF], Bw = [Pw[0] + W1_WIDE, zF];
          const dW = Math.min(h.d, 7), riseW = o.rise, H = 3.4 + 2 * (o.fh ?? 3.0) + riseW;
          const xf = new THREE.Matrix4().makeRotationZ(Math.PI).setPosition(0, H - 0.5, 0);
          rec = placeFront(b, Aw, Bw, dW, 0.05, (w) => houseInto(b, r, Object.assign(o, { w })), xf);
          rec.wrong = 'head'; rec.height = H; rec.front = [(Aw[0] + Bw[0]) / 2, zF]; rec.A2 = Aw; rec.B2 = Bw;
          // the yard: white walls with slate copings along the terrace's line either side of its open mouth, down its
          // east side and beside the house; a lawn from the pavement to the house and under it; two tubs
          const pS = street.at(cuts[i], HALF), pN = street.at(cuts[i + 1], HALF);
          let sE = cuts[i]; while (sE < cuts[i] + W1_IN && street.at(sE, HALF)[0] > Bw[0]) sE += 0.5;
          const pE = street.at(sE, HALF);
          const yardWall = (p, q) => {
            if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.3) return;
            b.col(TRIM, 0.95, 1).surf(SURF.PLAIN); b.beam([p[0], 1.1, p[1]], [q[0], 1.1, q[1]], 0.34, 2.2);
            b.col(SLATE, 1, 1).surf(SURF.PLAIN); b.beam([p[0], 2.28, p[1]], [q[0], 2.28, q[1]], 0.5, 0.16);
          };
          yardWall(pS, pE); yardWall(pE, [Bw[0] + 0.4, zF - 1]); yardWall(Pw, pN); yardWall([Aw[0] - 0.4, zF - 1], Pw);
          b.col(LAWN, 1, 1).surf(SURF.PLAIN);
          b.quad([Pw[0], 0.07, Pw[1]], [pE[0], 0.07, pE[1]], [Bw[0] + 0.4, 0.07, zF - dW], [Aw[0] - 0.4, 0.07, zF - dW]);
          // the broken turf: the roof's slope meets the lawn a little in front of the ridge; earth thrown up along that
          // line and round the gable ends, some of it with its grass on. The dice are drawn for every clod.
          const zG = zF - dW / 2 + 0.5 * (dW / 2) / riseW;
          for (let c = 0; c < 16; c++) {
            const u = rYard(), v = rYard(), t = rYard(), end = c >= 12 ? (c % 2 ? 1 : -1) : 0;
            const cx = end ? (end > 0 ? Bw[0] + 0.5 + v * 0.8 : Aw[0] - 0.5 - v * 0.8) : lerp(Aw[0] - 0.6, Bw[0] + 0.6, (c + u) / 12);
            const cz = end ? lerp(zF - dW + 0.5, zF - 0.5, u) : zG + 0.5 + v * 1.5, cw = 0.5 + t * 0.7, ch = 0.22 + ((u * 7) % 1) * 0.3;
            b.col(EARTH, 0.85, 1).surf(SURF.PLAIN); b.cbox(cx, 0.05, cz, cw, ch, cw * 0.8);
            if (t > 0.45) { b.col(LAWN, 0.9, 1); b.cbox(cx + 0.05, 0.05 + ch, cz, cw * 0.8, 0.07, cw * 0.62); }
          }
          tubInto(b, Bw[0] - 0.9, zF + 5.5, 0.3); tubInto(b, Bw[0] - 0.9, zF + 9.5, 0.7);
        } else rec = placeFront(b, A, B, h.d, h.setback + (i % 2) * 0.12, (w) => houseInto(b, r, Object.assign({}, h, { w, rich: 1, shaded: shadedFront(A, B) })));
        houses.push(Object.assign(rec, { h, A: rec.A2 || A, B: rec.B2 || B, side, s: sMid, kind: 'street' }));
        if (i % 6 === 5) await ctx.yield();
      }
    };
    const bE = [frontsBuilder(), frontsBuilder()], bW = [frontsBuilder(), frontsBuilder()];
    await layStreetSide(bE, rEast, 1, S_END - CH, wrongAt[0], 'head');
    await ctx.yield();
    await layStreetSide(bW, rWest, -1, S_END, wrongAt[1], null);
    await ctx.yield();
    for (const q of [0, 1]) { addMesh(bE[q], 'fronts-east-' + q); await ctx.yield(); addMesh(bW[q], 'fronts-west-' + q); await ctx.yield(); }
    const W1 = houses.find((q) => q.wrong === 'head');

    // ------------------------------------------------------------ the second and third streets: their terraces, the two splayed corners, the two wrong houses that close the vistas
    // each street's fronts are two meshes, a half of its length each, and each mesh's trim is a third and fourth that cast no shadow
    const bS2 = [frontsBuilder(), frontsBuilder()], bS3 = [frontsBuilder(), frontsBuilder()], bM = frontsBuilder(), bSide = S.makeBuilder(8192);
    const T = (b, r, x, z, ux, uz, len, o) => layTerrace(b, r, [x, z], ux, uz, len, Object.assign({ shaded: shadedFront }, o), houses);
    // W2 THE HOUSE THAT GREW stands in the second street's north terrace on the high street's own centre line: one
    // window wide, nine floors, nine flower boxes one above another, its own little roof and chimney
    const W2 = { x: X_END, z: Z2 - HALF, w: 4, d: 6, floors: 9, fh: 3.1 };
    const growSlot = {
      at: HALF - 2, w: 4,
      make: (b, h, A, B) => {
        const o = Object.assign({}, h, { w: 4, d: W2.d, floors: 9, fh: W2.fh, cols: 1, rise: 2.3, gableFront: false, allBoxes: true, rich: 1, groundBox: true });
        const rec = placeFront(b, A, B, W2.d, 0.3, () => houseInto(b, rSt2, o));
        W2.top = rec.out.top; W2.eave = rec.out.eave; W2.stack = rec.out.stack; W2.paint = h.pi;
        houses.push(Object.assign(rec, { h, A, B, kind: 'grew', wrong: 'grew' }));
      },
    };
    // W3 THE SMALL HOUSE stands in the third street's east terrace on the second street's own centre line: a whole
    // house at two fifths the size in a slot two fifths as wide
    const SMALL_W = 2.8;
    const smallSlot = {
      at: ST3 - SQ - SMALL_W / 2, w: SMALL_W,
      make: (b, h, A, B) => {
        const xf = new THREE.Matrix4().makeScale(0.4, 0.4, 0.4);
        const rec = placeFront(b, A, B, h.d * 0.4, 0.05, (w) => houseInto(b, rSt3, Object.assign({}, h, { w: w / 0.4, floors: 3, rich: 1, allBoxes: true })), xf);
        rec.height = 0.4 * rec.out.top;
        houses.push(Object.assign(rec, { h, A, B, kind: 'small', wrong: 'small' }));
      },
    };
    const fill = (b, r, cx, cz) => { b.tr(cx, 0, cz, 0, 1); farHouseInto(b, 10, 10, 9.2, 2.6, mul(PAINTS[r.int(0, 9)], 0.9), SLATE, true, r()); b.pop(); };
    // the second street: its north terrace from the first corner's outer angle to the second corner's splay, its south
    // terrace from the second corner's outer angle back to the first corner's splay; the splay across the first corner
    // EACH STREET IS OF ITS OWN KIND. The high street: painted shopfronts under striped awnings, a street market down
    // its roadway. The second street: painted timber dwellings, every one a gable to the street, two floors under
    // red pantiles, no shop; planters down its roadway. The third street: brick town houses of three floors, their
    // ridges along the street under slate, shops under striped awnings as the high street's; carts standing in its roadway.
    const styleSt2 = (h) => ({ gableFront: true, floors: 2, paint: mul(TIMBER[h.pi], 0.95), roof: mul(PANTILE, 0.92 + 0.14 * h.seed), shop: false });
    const styleSt3 = (h) => ({ gableFront: false, floors: 3, paint: mul(BRICK[h.pi], 0.95), roof: mul(SLATE, 0.9 + 0.16 * h.seed) });
    T(bS2[0], rSt2, X_END - HALF, Z2 - HALF, 1, 0, X3 - HALF - CH - (X_END - HALF), { kind: 'st2', side: -1, slots: [growSlot], b2: bS2[1], style: styleSt2 });
    await ctx.yield();
    T(bS2[1], rSt2, X3 + HALF, Z2 + HALF, -1, 0, X3 + HALF - (X_END + HALF + CH), { kind: 'st2', side: 1, b2: bS2[0], style: styleSt2 });
    await ctx.yield();
    const pA = street.at(S_END - CH, HALF), qA = [X_END + HALF + CH, Z2 + HALF], lA = Math.hypot(pA[0] - qA[0], pA[1] - qA[1]);
    T(bS2[0], rSt2, qA[0], qA[1], (pA[0] - qA[0]) / lA, (pA[1] - qA[1]) / lA, lA, { kind: 'splay' });
    for (const q of [0, 1]) { addMesh(bS2[q], 'fronts-second-' + q); await ctx.yield(); }
    // THE SECOND STREET'S WEST ARM: beyond the high street's corner the second street runs on west, lined for ARM
    // metres (its south row begins ARM_BACK west of the corner, behind the high street's west terrace), and on
    // from there as a street of the far town to the town's edge. The high street's herd leaves the town by it.
    const ARM = 90, ARM_BACK = 11, armX0 = X_END - HALF - ARM, bArm = frontsBuilder();
    T(bArm, rArm, armX0, Z2 - HALF, 1, 0, ARM, { kind: 'arm', rich: 0, side: -1, plain: (a, w) => a + w < ARM - 46 });
    await ctx.yield();
    T(bArm, rArm, X_END - HALF - ARM_BACK, Z2 + HALF, -1, 0, ARM - ARM_BACK, { kind: 'arm', rich: 0, side: 1, plain: (a) => a > 46 });
    await ctx.yield();
    addMesh(bArm, 'west-arm'); await ctx.yield();
    // the third street: its east terrace (with the small house) from the square's south side down to the second
    // corner's outer angle, its west terrace from the second corner's splay up to the square; the splay
    T(bS3[1], rSt3, X3 + HALF, MKT.z0, 0, 1, ST3 - SQ + HALF, { kind: 'st3', side: 1, slots: [smallSlot], b2: bS3[0], style: styleSt3 });
    await ctx.yield();
    T(bS3[0], rSt3, X3 - HALF, Z2 - HALF - CH, 0, -1, Z2 - HALF - CH - MKT.z0, { kind: 'st3', side: -1, b2: bS3[1], style: styleSt3 });
    await ctx.yield();
    T(bS3[0], rSt3, X3 - HALF - CH, Z2 - HALF, Math.SQRT1_2, -Math.SQRT1_2, CH * Math.SQRT2, { kind: 'splay' });
    fill(bS3[0], rSt3, X3 + HALF + 5, Z2 + HALF + 5);
    for (const q of [0, 1]) { addMesh(bS3[q], 'fronts-third-' + q); await ctx.yield(); }
    const W3 = houses.find((q) => q.wrong === 'small');

    // ------------------------------------------------------------ THE SQUARE: four sides of pastel shop fronts, the fountain, the clock tower; its streets
    // Its fronts are the town's own three-floor shop fronts in ice-cream paints. The third street comes in by the
    // south side (its terraces run up to the square's line; the south side's own fronts begin SQ_BACK behind that
    // street's west terrace), and three more streets leave the square: east and west by the middles of those sides,
    // north by the north side.
    const SQ_BACK = 11;
    const styleSq = (h) => ({ floors: 3, gableFront: false, paint: mul(PASTEL[h.pi], 0.97), roof: mul(h.pi % 3 ? SLATE : PANTILE, 0.92 + 0.14 * h.seed) });
    const sq = (x, z, ux, uz, len) => T(bM, rMkt, x, z, ux, uz, len, { kind: 'market', style: styleSq });
    sq(MKT.x0, MKT.z1, 1, 0, BX + 5 - MKT.x0); sq(BX + 19, MKT.z1, 1, 0, MKT.x1 - BX - 19);
    await ctx.yield();
    sq(X3 - HALF - SQ_BACK, MKT.z0, -1, 0, X3 - HALF - SQ_BACK - MKT.x0);
    await ctx.yield();
    sq(MKT.x0, MKT.z0, 0, -1, SQ - HALF); sq(MKT.x0, BZ - HALF, 0, -1, SQ - HALF);
    await ctx.yield();
    sq(MKT.x1, MKT.z1, 0, 1, SQ - HALF); sq(MKT.x1, BZ + HALF, 0, 1, SQ - HALF);
    await ctx.yield();
    // the corners behind the fronts are filled so that no gap shows
    for (const [cx, cz] of [[MKT.x1 + 5, MKT.z1 - 5], [MKT.x0 - 5, MKT.z1 - 5], [MKT.x0 - 5, MKT.z0 + 5]]) fill(bM, rMkt, cx, cz);
    fountainInto(bM, BX, BZ);
    const tower = towerInto(bM, TX, TZ, rTower.range(0, TAU), rTower.range(0, TAU));
    addMesh(bM, 'market'); await ctx.yield();
    // THE FOUNTAIN PLAYS: drops along JETS arcs from the lower bowl's rim out into the basin, and a plume up from
    // the finial into the top bowl; each drop's phase and each arc's rate are from the fountain's own stream, and
    // the world's clock places them
    const JETS = 12, PER = 12, PLUME = 18, dropN = JETS * PER + PLUME, dropPh = new Float32Array(dropN), dropRate = new Float32Array(JETS + 1);
    for (let i = 0; i < dropN; i++) dropPh[i] = rFount();
    for (let j = 0; j <= JETS; j++) dropRate[j] = rFount.range(0.55, 0.75);
    const drops = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: '#eef8ff', roughness: 0.35, metalness: 0, emissive: '#7fb4d2', emissiveIntensity: 0.3 }), dropN);
    drops.name = 'fountain-drops'; drops.frustumCulled = false; scene.add(drops);
    const _dm = new THREE.Matrix4();
    const playFountain = (time) => {
      for (let i = 0; i < dropN; i++) {
        const j = i < JETS * PER ? i % JETS : JETS, t = (time * dropRate[j] + dropPh[i]) % 1, a = j < JETS ? TAU * j / JETS : TAU * dropPh[i] * 7;
        const r = j < JETS ? lerp(BOWL_R, FOUNT_R - 1.4, t) : 0.9 * t, y = j < JETS ? BOWL_Y + 1.5 * t - (BOWL_Y + 0.8) * t * t : FOUNT_TOP + 2.2 * t - 3.4 * t * t;
        drops.setMatrixAt(i, _dm.makeTranslation(BX + Math.sin(a) * r, y, BZ + Math.cos(a) * r));
      }
      drops.instanceMatrix.needsUpdate = true;
    };
    playFountain(0);
    // the square's three other streets. East and north are each lined for SIDE metres. THE WEST STREET, which the
    // last way comes down over, is lined on to WEST_ON beyond the ring's place; its two rows are a mesh of their
    // own that casts its shadows, dealt from their own stream.
    const SIDE = 120, WEST_ON = SIDE / 2, WEST = MKT.x0 - 10 - RING_AT[0] + WEST_ON, bWest = frontsBuilder();
    T(bSide, rSide, MKT.x1 + 10, BZ - HALF, 1, 0, SIDE, { kind: 'side', rich: 0, plain: (a) => a > 46 }); T(bSide, rSide, MKT.x1 + 10 + SIDE, BZ + HALF, -1, 0, SIDE, { kind: 'side', rich: 0, plain: (a, w) => a + w < SIDE - 46 });
    await ctx.yield();
    T(bSide, rSide, BX + 5, MKT.z1 - 10, 0, -1, SIDE, { kind: 'side', rich: 0, plain: (a) => a > 46 }); T(bSide, rSide, BX + 19, MKT.z1 - 10 - SIDE, 0, 1, SIDE, { kind: 'side', rich: 0, plain: (a, w) => a + w < SIDE - 46 });
    await ctx.yield();
    T(bWest, rWestSt, MKT.x0 - 10 - WEST, BZ - HALF, 1, 0, WEST, { kind: 'west', rich: 0, side: -1, plain: (a, w) => a + w < WEST - 46 });
    await ctx.yield();
    T(bWest, rWestSt, MKT.x0 - 10, BZ + HALF, -1, 0, WEST, { kind: 'west', rich: 0, side: 1, plain: (a) => a > 46 });
    await ctx.yield();
    addMesh(bSide, 'side-streets', false); await ctx.yield();
    addMesh(bWest, 'west-street'); await ctx.yield();

    // ------------------------------------------------------------ the floor: roadway setts, raised pavements, the market place's paving
    const bF = S.makeBuilder(4096);
    const ribbon = (o0, o1, y, c, lit, sA, sB) => {
      bF.col(c, 1, 1).surf(SURF.MASONRY, 0, lit);
      for (let s = sA; s < sB - 0.01; s += 5) {
        const s1 = Math.min(sB, s + 5), a = street.at(s, o0), bb = street.at(s, o1), c1 = street.at(s1, o1), d1 = street.at(s1, o0);
        bF.quad([a[0], y, a[1]], [bb[0], y, bb[1]], [c1[0], y, c1[1]], [d1[0], y, d1[1]], [o0 * 0.5, s * 0.5, o1 * 0.5, s1 * 0.5]);
      }
    };
    const S_W = S_END, S_E = S_END - CH;
    ribbon(-3.5, 3.5, 0.02, SETTS, 0.45, S_BACK - 4, S_END);
    ribbon(3.5, 7.4, 0.16, PAVING, 0.9, S_BACK - 4, S_E); ribbon(-7.4, -3.5, 0.16, PAVING, 0.9, S_BACK - 4, S_W);
    ribbon(3.42, 3.62, 0.18, KERB, 2, S_BACK - 4, S_E); ribbon(-3.62, -3.42, 0.18, KERB, 2, S_BACK - 4, S_W);
    // the second and third streets: roadway setts between raised pavements with pale kerbs; paving in the two splays.
    // flat: a level rectangle from its south-west corner round by the east
    const flat = (xa, za, xb, zb, y, c, lit) => {
      const xw = Math.min(xa, xb), xe = Math.max(xa, xb), zs = Math.max(za, zb), zn = Math.min(za, zb);
      bF.col(c, 1, 1).surf(SURF.MASONRY, 0, lit); bF.quad([xw, y, zs], [xe, y, zs], [xe, y, zn], [xw, y, zn], [0, 0, (xe - xw) * 0.5, (zs - zn) * 0.5]);
    };
    const zN = Z2 - HALF, zS = Z2 + HALF, xW = X3 - HALF, xE = X3 + HALF, zTop = MKT.z0;
    flat(X_END - 3.5, zS, xE, zN, 0.02, SETTS2, 0.45); flat(xW, zN, xE, zTop, 0.02, SETTS3, 0.45);
    // the west arm's floor: the second street's own setts, pavements and kerbs carried on west
    flat(armX0 - 6, Z2 + 3.5, X_END - 3.5, Z2 - 3.5, 0.02, SETTS2, 0.45);
    for (const sd of [-1, 1]) { flat(armX0 - 6, Z2 + sd * 3.5, X_END - 3.5, Z2 + sd * HALF, 0.16, PAVING, 0.9); flat(armX0 - 6, Z2 + sd * 3.42, X_END - 3.5, Z2 + sd * 3.62, 0.18, KERB, 2); }
    flat(X_END - 3.5, zN + 3.5, xW - CH, zN - 0.4, 0.16, PAVING, 0.9); flat(X_END + HALF + CH, zS - 3.5, xE + 0.4, zS + 0.4, 0.16, PAVING, 0.9);
    flat(X_END - 3.5, zN + 3.42, xW - CH, zN + 3.62, 0.18, KERB, 2); flat(X_END + HALF + CH, zS - 3.62, xE - 3.5, zS - 3.42, 0.18, KERB, 2);
    // the third street's pavements run up to the square
    for (const [za, zb] of [[zS - 3.5, zTop]]) {
      flat(xE - 3.5, za, xE + 0.4, zb, 0.16, PAVING, 0.9); flat(xE - 3.62, za, xE - 3.42, zb, 0.18, KERB, 2);
      flat(xW - 0.4, Math.min(za, zN - CH), xW + 3.5, zb, 0.16, PAVING, 0.9); flat(xW + 3.42, Math.min(za, zN - CH), xW + 3.62, zb, 0.18, KERB, 2);
    }
    const pE = street.at(S_E, 7.4), pK = street.at(S_E, 3.5);
    // the roadway widens into each splayed corner: setts from the kerb's end to the splay's paving
    bF.col(SETTS, 1, 1).surf(SURF.MASONRY, 0, 0.45);
    bF.tri([pK[0], 0.02, pK[1]], [X_END + HALF + CH, 0.02, zS], [pK[0], 0.02, zS], null, null, null, [0, 0], [(X_END + HALF + CH - pK[0]) * 0.5, (pK[1] - zS) * 0.5], [0, (pK[1] - zS) * 0.5]);
    bF.tri([xW - CH, 0.02, zN], [xW, 0.02, zN], [xW, 0.02, zN - CH], null, null, null, [0, 0], [CH * 0.5, 0], [CH * 0.5, CH * 0.5]);
    bF.col(PAVING, 1, 1).surf(SURF.MASONRY, 0, 0.9);
    bF.quad([pE[0], 0.16, pE[1]], [X_END + HALF + CH, 0.16, zS + 0.4], [X_END + HALF + CH, 0.16, zS - 3.5], [pK[0], 0.16, pK[1]], [0, 0, 6, 6]);
    bF.quad([xW - CH, 0.16, zN + 3.5], [xW + 3.5, 0.16, zN - CH], [xW - 0.4, 0.16, zN - CH], [xW - CH, 0.16, zN - 0.4], [0, 0, 6, 6]);
    // THE SQUARE'S COBBLES: pale paving, a border and a grid of darker bands square to the sides, and round the
    // fountain eight rings of setts, dark and pale turn about, out to the ring of tables
    bF.col(PAVING, 1, 1).surf(SURF.MASONRY, 0, 0.9);
    bF.quad([MKT.x0 - 0.5, 0.05, MKT.z0 + 0.5], [MKT.x1 + 0.5, 0.05, MKT.z0 + 0.5], [MKT.x1 + 0.5, 0.05, MKT.z1 - 0.5], [MKT.x0 - 0.5, 0.05, MKT.z1 - 0.5], [0, 0, SQ, SQ]);
    bF.col(SETTS, 1, 1).surf(SURF.MASONRY, 0, 0.45);
    const mw = 2 * SQ, strip = (xa, za, xb, zb) => bF.quad([xa, 0.06, za], [xb, 0.06, za], [xb, 0.06, zb], [xa, 0.06, zb], [0, 0, Math.abs(xb - xa) * 0.5, Math.abs(zb - za) * 0.5]);
    for (let i = 0; i <= 10; i++) { const x = MKT.x0 + 1.2 + (mw - 2.4) * i / 10, w = i % 10 === 0 ? 0.7 : 0.3; strip(x - w, MKT.z0 - 1.2, x + w, MKT.z1 + 1.2); }
    for (let i = 0; i <= 10; i++) { const z = MKT.z0 - 1.2 - (mw - 2.4) * i / 10, w = i % 10 === 0 ? 0.7 : 0.3; strip(MKT.x0 + 1.2, z + w, MKT.x1 - 1.2, z - w); }
    const RINGS = 8, RING_W = 2.6;
    for (let q = 0; q < RINGS; q++) {
      const ri = FOUNT_R + 0.5 + q * RING_W, ro = ri + RING_W;
      bF.col(q % 2 ? COBBLE : SETTS, 1, 1).surf(SURF.MASONRY, 0, q % 2 ? 0.7 : 0.45);
      for (let i = 0; i < 40; i++) {
        const a0 = TAU * i / 40, a1 = TAU * (i + 1) / 40;
        bF.quad([BX + Math.sin(a0) * ri, 0.07, BZ + Math.cos(a0) * ri], [BX + Math.sin(a0) * ro, 0.07, BZ + Math.cos(a0) * ro], [BX + Math.sin(a1) * ro, 0.07, BZ + Math.cos(a1) * ro], [BX + Math.sin(a1) * ri, 0.07, BZ + Math.cos(a1) * ri], [i * 1.5, 0, (i + 1) * 1.5, RING_W * 0.5]);
      }
    }
    bF.col(SETTS, 1, 1).surf(SURF.MASONRY, 0, 0.45);
    flat(MKT.x1, BZ + 6.5, MKT.x1 + 130, BZ - 6.5, 0.03, SETTS, 0.45);
    // the west street's own floor: roadway setts between raised pavements with pale kerbs, like the flown streets
    const xWest = MKT.x0 - 10 - WEST - 6;
    flat(xWest, BZ + 3.5, MKT.x0, BZ - 3.5, 0.03, SETTS2, 0.45);
    for (const sd of [-1, 1]) { flat(xWest, BZ + sd * 3.5, MKT.x0, BZ + sd * 7.4, 0.16, PAVING, 0.9); flat(xWest, BZ + sd * 3.42, MKT.x0, BZ + sd * 3.62, 0.18, KERB, 2); }
    bF.col(SETTS, 1, 1).surf(SURF.MASONRY, 0, 0.45);
    flat(BX + 5.5, MKT.z1, BX + 18.5, MKT.z1 - 130, 0.03, SETTS, 0.45);
    addMesh(bF, 'floor', false); await ctx.yield();

    // ------------------------------------------------------------ the far town: simpler roofs along more streets, thinning outward; then gardens, fields and hills
    // the inner block's gardens: x from, to; z from, to
    const GARDEN_BACK = 14, INNER = [X_END + 22, X3 - HALF - GARDEN_BACK, MKT.z0 + SQ_BACK + 3, Z2 - HALF - GARDEN_BACK];
    const inDetail = (x, z, pad) => {
      const sN = -z;
      if (sN > S_BACK - 30 && sN < S_W + 16 && Math.abs(x - street.cx(clamp(sN, S_BACK, S_END))) < 22 + pad) return true;
      if (Math.abs(z - Z2) < 22 + pad && x > armX0 - 6 - pad && x < X3 + 22 + pad) return true;
      // the arm's own line on to the town's edge: no house of the far town stands in it
      if (Math.abs(z - Z2) < 9 + pad && x < X_END) return true;
      if (Math.abs(x - X3) < 22 + pad && z < Z2 + 22 + pad && z > MKT.z0 - pad) return true;
      if (x > MKT.x0 - 12 - pad && x < MKT.x1 + 12 + pad && z < MKT.z0 + 12 + pad && z > MKT.z1 - 12 - pad) return true;
      if (Math.abs(z - BZ) < 19 + pad && x > xWest - 4 - pad && x < BX + 170 + pad) return true;
      if (x > INNER[0] - pad && x < X3 && z > MKT.z0 && z < Z2) return true;
      return Math.abs(x - BX - 12) < 19 + pad && z < MKT.z1 && z > MKT.z1 - 135 - pad;
    };
    // THE TOWN'S RIM: the town is whole to its edge. Every row of the grid stands whose middle is within TOWN_R of
    // the town's middle (TOWN_OUT, one block, beyond the entry, the furthest of the route's places from it) and none
    // beyond; the gardens end GARDEN_IN inside that; the town's own ground ends in a belt of trees a little outside
    // it, and beyond the belt lie the hedged fields, lanes and copses.
    const TOWN_OUT = 60, TOWN_R = Math.hypot(TC[0], TC[1]) + TOWN_OUT, GARDEN_IN = 30, BELT = 240;
    // THE GREEN: the town's park, between the two streets that run west out of the old town (the square's west
    // street and the second street's arm), from the arm's end westward for GREEN_LONG. Its sides are those streets'
    // own measures (the west street's rows end 19 from its axis; the road out of the arm is kept clear 9 from its
    // axis and a house's 6 more). Its three thirds from the arm's end: the bandstand's lawn, the pond with its bridge
    // (the green's middle path crosses the pond's waist by it), and the far lawn at the head of the green, left to
    // the great trees and the middle path. Great trees stand along both long sides. No house, garden or street of
    // the far town lies in it, and nothing that reads as a place of worship stands on it or anywhere in the world.
    const GREEN_LONG = 132, GREEN_PATH = 2.6, GREEN = [armX0 - 6 - GREEN_LONG, armX0 - 6, BZ + 19, Z2 - 15];
    const inGreen = (x, z, pad) => x > GREEN[0] - pad && x < GREEN[1] + pad && z > GREEN[2] - pad && z < GREEN[3] + pad;
    const gridLines = (c) => { const out = []; for (let v = c - 470 + rFar.range(0, 30); v < c + 470; v += rFar.range(60, 76)) out.push(v); return out; };
    const gxs = gridLines(TC[0]), gzs = gridLines(TC[1]), farStreets = [], bFar = [0, 1, 2, 3].map(() => S.makeBuilder(8192));
    let farCount = 0;
    // what throws a painted shadow on the land (the far town's houses cast none in the shadow light)
    const casts = [];
    const farRow = (b, ax, az, ux, uz, len) => {
      let a = 9;
      while (a < len - 15) {
        const w = rFar.range(6, 8.2), d = rFar.range(8, 9.6), tall = rFar.chance(0.42), rise = rFar.range(2.5, 3.2), pi = rFar.int(0, PAINTS.length - 1), slate = rFar.chance(0.8), gap = rFar.chance(0.1), sd = rFar();
        const A = [ax + ux * a, az + uz * a], B = [ax + ux * (a + w), az + uz * (a + w)];
        if (!gap && !inDetail((A[0] + B[0]) / 2 + uz * 5, (A[1] + B[1]) / 2 - ux * 5, 6) && !inGreen((A[0] + B[0]) / 2 + uz * 5, (A[1] + B[1]) / 2 - ux * 5, 6)) {
          const rec = placeFront(b, A, B, d, 0, (ww) => farHouseInto(b, ww, d, tall ? 9 : 6.2, rise, mul(PAINTS[pi], 0.9), slate ? SLATE : PANTILE, true, sd));
          casts.push([rec.cx, rec.cz, rec.ux, rec.uz, rec.w / 2, d / 2, (tall ? 9 : 6.2) + rise * 0.6]); farCount++;
        }
        a += w;
      }
    };
    const farSeg = (x0s, z0s, x1s, z1s) => {
      const mx = (x0s + x1s) / 2, mz = (z0s + z1s) / 2, r = Math.hypot(mx - TC[0], mz - TC[1]);
      if (r > TOWN_R || inDetail(mx, mz, 0)) return;
      farStreets.push([x0s, z0s, x1s, z1s, 9]);
      const len = Math.hypot(x1s - x0s, z1s - z0s), ux = (x1s - x0s) / len, uz = (z1s - z0s) / len, b = bFar[(mx > TC[0] ? 1 : 0) + (mz > TC[1] ? 2 : 0)];
      // the street on the right hand of each row: one row walks out, the other walks back
      farRow(b, x0s + uz * 5.2, z0s - ux * 5.2, ux, uz, len); farRow(b, x1s - uz * 5.2, z1s + ux * 5.2, -ux, -uz, len);
    };
    for (let i = 0; i < gxs.length; i++) { for (let j = 0; j + 1 < gzs.length; j++) farSeg(gxs[i], gzs[j + 1], gxs[i], gzs[j]); await ctx.yield(); }
    for (let j = 0; j < gzs.length; j++) { for (let i = 0; i + 1 < gxs.length; i++) farSeg(gxs[i], gzs[j], gxs[i + 1], gzs[j]); await ctx.yield(); }
    for (let q = 0; q < 4; q++) { addMesh(bFar[q], 'far-town-' + q, false); await ctx.yield(); }
    // the land's lists: hedged fields, the town's edge, lanes to the hills, streets, shrubs
    for (const q of houses) if (q.kind === 'side') casts.push([q.cx, q.cz, q.ux, q.uz, q.w / 2, q.h.d / 2, 3.4 + (q.h.floors - 1) * q.h.fh + 1.8]);
    const land = { centre: TC, fields: [], edge: [], lanes: [], streets: farStreets.slice(), shrubs: [], woods: [], farms: [], plots: [], greens: [], casts, shade: [-Math.sin(sunAz) * shadow, Math.cos(sunAz) * shadow] };
    const FIELDS = ['#6fae4e', '#8cc063', '#5d9a4a', '#a3c865', '#7db658', '#d9c76a', '#e3d58a', '#69a84f', '#c9b45e', '#93bd5c', '#b08a5a', '#78b060'];
    for (let x = -2900; x < 2900;) { const w = rLand.range(110, 190); for (let z = -2900; z < 2900;) { const d = rLand.range(90, 170); land.fields.push({ x: LAND_C[0] + x, z: LAND_C[1] + z, w, d, c: FIELDS[rLand.int(0, FIELDS.length - 1)], rows: rLand.chance(0.45) ? (rLand.chance(0.5) ? 1 : -1) : 0 }); z += d; } x += w; }
    for (let i = 0; i < 48; i++) land.edge.push(TOWN_R + 26 + 14 * ctx.noise.n2(Math.cos(i * TAU / 48) * 1.7 + 9.1, Math.sin(i * TAU / 48) * 1.7 + 3.3));
    for (let i = 0; i < 6; i++) { const a = TAU * (i + rLand.range(0.1, 0.9)) / 6, ln = []; for (let r = 300; r < 2700; r += 150) { const w = a + 0.12 * Math.sin(r * 0.004 + i * 2.1); ln.push([TC[0] + Math.cos(w) * r, TC[1] + Math.sin(w) * r]); } land.lanes.push(ln); }
    for (let sS = S_BACK; sS < S_END; sS += 6) land.streets.push([street.cx(sS), -sS, street.cx(sS + 6), -(sS + 6), 14]);
    land.streets.push([MKT.x0, BZ, MKT.x1, BZ, 2 * SQ], [MKT.x1, BZ, MKT.x1 + 140, BZ, 14], [xWest - 4, BZ, MKT.x0, BZ, 14], [BX + 12, MKT.z1, BX + 12, MKT.z1 - 135, 14]);
    land.streets.push([X_END, Z2, X3, Z2, 14], [X3, Z2, X3, MKT.z0, 14], [armX0, Z2, X_END, Z2, 14], [TC[0] - TOWN_R - 40, Z2, armX0, Z2, 10]);
    // woods in clumps beyond the town's edge, thicker on the hills; a few farms along the lanes
    for (let i = 0; i < 46; i++) {
      const a = rLand.range(0, TAU), r = rLand.range(560, 2600), cxw = TC[0] + Math.cos(a) * r, czw = TC[1] + Math.sin(a) * r, n = rLand.int(5, 14), sp = rLand.range(40, 110);
      for (let q = 0; q < n; q++) land.woods.push([cxw + rLand.range(-sp, sp), czw + rLand.range(-sp, sp) * 0.7, rLand.range(16, 34)]);
    }
    for (const ln of land.lanes) for (let q = 2; q < ln.length; q += rLand.int(2, 4)) land.farms.push([ln[q][0] + rLand.range(30, 60) * (rLand.chance(0.5) ? 1 : -1), ln[q][1] + rLand.range(-20, 20), rLand.chance(0.5) ? 1 : 0]);
    // GARDENS: every block of the far town's grid keeps plots in its middle, behind the rows' backs: a clipped hedge
    // round each, its own green of lawn, a pale path, and in the inner town a small clipped tree. Within HIGH_NEAR of
    // the route's high part (the climb, the turn round the tower, the last way) the hedges stand and every plot
    // has its tree. No plot has a bed: the flower beds of the town are the square's and the roads' own mounds.
    const PLOT = 13, BACKS = 17, TREES_WITHIN = 330, HIGH_NEAR = 130, bG = S.makeBuilder(4096);
    // the belt of trees round the town's edge: BELT dark rounds painted on the land just outside the town's own
    // ground, and on every third of them a tree standing
    for (let i = 0; i < BELT; i++) {
      const a = TAU * i / BELT, e = land.edge[Math.floor(i * 48 / BELT) % 48], r = e + rLand.range(0, 14), ts = rLand.range(1.5, 2.6), tk = rLand(), x = TC[0] + Math.cos(a) * r, z = TC[1] + Math.sin(a) * r;
      land.woods.push([x, z, 3.1 * ts]);
      if (i % 3) continue;
      bG.col([0.3, 0.22, 0.15], 0.8, 1).surf(SURF.PLAIN); bG.cyl(x, 0, z, 0.2 * ts, 0.15 * ts, 2 * ts, 5, { cap: false });
      bG.col(mul(LEAF, 0.7 + 0.2 * tk), 0.62, 1.08); bG.sphere(x, 3.6 * ts, z, 2.4 * ts, 6, 3);
    }
    let gardenTrees = 0;
    // one plot: its dice are drawn whether or not it is laid; an inner plot (of a block the flown streets enclose)
    // is always laid. A plot's standing hedges are its north and west ones (its neighbours give the others), and
    // its block's last row and column close the block (east, south).
    const hedge = (xa, za, xb, zb) => bG.box(xa - HEDGE_W / 2, 0, za - HEDGE_W / 2, xb + HEDGE_W / 2, HEDGE_H, zb + HEDGE_W / 2, { bottom: false });
    const gardenPlot = (px, pz, w, d, inner, east, south) => {
      const bed = rGard.int(0, LAWNS.length - 1), turn = rGard.chance(0.5), tree = rGard.chance(0.5), tx = rGard.range(0.28, 0.72), tz = rGard.range(0.28, 0.72), ts = rGard.range(0.8, 1.2), tk = rGard();
      const mx = px + w / 2, mz = pz + d / 2, r = Math.hypot(mx - TC[0], mz - TC[1]);
      if (!inner && (r > TOWN_R - GARDEN_IN || inDetail(mx, mz, 9) || inGreen(mx, mz, 9))) return;
      land.plots.push({ x: px, z: pz, w, d, bed, turn });
      const near = lineDist(mx, 0, mz, iRound, lineN) < HIGH_NEAR;
      if (near) {
        bG.col(mul(LEAF, 0.6), 0.74, 1.1).surf(SURF.PLAIN);
        hedge(px, pz, px + w, pz); hedge(px, pz, px, pz + d);
        if (east) hedge(px + w, pz, px + w, pz + d);
        if (south) hedge(px, pz + d, px + w, pz + d);
      }
      if (!(tree || near) || r > TREES_WITHIN) return;
      const x = px + w * tx, z = pz + d * tz;
      land.shrubs.push([x, z, 1.7 * ts]);
      bG.col([0.3, 0.22, 0.15], 0.8, 1).surf(SURF.PLAIN); bG.cyl(x, 0, z, 0.13 * ts, 0.1 * ts, 1.7 * ts, 5, { cap: false });
      bG.col(mul(LEAF, 0.82 + 0.24 * tk), 0.62, 1.08); bG.sphere(x, 2.7 * ts, z, 1.45 * ts, 6, 3);
      gardenTrees++;
    };
    const gardenBlock = (x0, x1, z0, z1, inner) => {
      const nx = Math.floor((x1 - x0) / PLOT), nz = Math.floor((z1 - z0) / PLOT);
      for (let a = 0; a < nx; a++) for (let c = 0; c < nz; c++) { const w = (x1 - x0) / nx, d = (z1 - z0) / nz; gardenPlot(x0 + a * w, z0 + c * d, w, d, inner, a === nx - 1, c === nz - 1); }
    };
    for (let i = 0; i + 1 < gxs.length; i++) {
      for (let j = 0; j + 1 < gzs.length; j++) gardenBlock(gxs[i] + BACKS, gxs[i + 1] - BACKS, gzs[j] + BACKS, gzs[j + 1] - BACKS, false);
      await ctx.yield();
    }
    // THE INNER BLOCK (between the second street's north row, the third street's west row and the square's south
    // row) is all gardens behind the rows' backs, GARDEN_BACK behind each row's front line
    gardenBlock(INNER[0], INNER[1], INNER[2], INNER[3], true);
    await ctx.yield();
    addMesh(bG, 'garden-trees', false);
    // ------------------------------------------------------------ the green: hedge, great trees, bandstand, pond and bridge
    {
      const bP = S.makeBuilder(4096), zM = (GREEN[2] + GREEN[3]) / 2, half = (GREEN[3] - GREEN[2]) / 2, third = GREEN_LONG / 3;
      // a place on the green's middle line: so many metres west of its east end (the arm's end)
      const gx = (a) => GREEN[1] - a;
      const green = { x: GREEN[0], z: GREEN[2], w: GREEN_LONG, d: 2 * half, bed: rGreen.int(0, LAWNS.length - 1), path: GREEN_PATH, rings: [], trees: [] }, roofDie = rGreen();
      land.greens.push(green);
      // its clipped hedge: the two long sides whole, each end open where the middle path comes in
      bP.col(mul(LEAF, 0.6), 0.74, 1.1).surf(SURF.PLAIN);
      for (const z of [GREEN[2], GREEN[3]]) bP.box(GREEN[0] - HEDGE_W / 2, 0, z - HEDGE_W / 2, GREEN[1] + HEDGE_W / 2, HEDGE_H, z + HEDGE_W / 2, { bottom: false });
      for (const x of [GREEN[0], GREEN[1]]) for (const s of [-1, 1]) bP.box(x - HEDGE_W / 2, 0, zM + s * (s > 0 ? GREEN_PATH : half), x + HEDGE_W / 2, HEDGE_H, zM + s * (s > 0 ? half : GREEN_PATH), { bottom: false });
      // GREAT TREES along both long sides, a crown and a half apart, each of its own size and a little off its place:
      // a garden tree's own build GREAT[0] to GREAT[1] times over (its crown 10 to 13 m across), with a second heap
      const GREAT = [3.4, 4.4], GREAT_GAP = 16.5, GREAT_IN = 8, GREAT_PLAY = 2;
      for (const side of [-1, 1]) for (let a = GREAT_GAP / 2; a < GREEN_LONG; a += GREAT_GAP) {
        const ts = lerp(GREAT[0], GREAT[1], rGreen()), x = gx(a + rGreen.range(-GREAT_PLAY, GREAT_PLAY)), z = zM + side * (half - GREAT_IN), tk = rGreen(), la = rGreen.range(0, TAU);
        green.trees.push([x, z, 1.7 * ts]);
        bP.col([0.3, 0.22, 0.15], 0.8, 1).surf(SURF.PLAIN); bP.cyl(x, 0, z, 0.16 * ts, 0.11 * ts, 1.9 * ts, 6, { cap: false });
        bP.col(mul(LEAF, 0.8 + 0.22 * tk), 0.62, 1.08); bP.sphere(x, 2.7 * ts, z, 1.45 * ts, 9, 5); bP.sphere(x + Math.cos(la) * 0.75 * ts, 3.25 * ts, z + Math.sin(la) * 0.75 * ts, ts, 8, 4);
      }
      // THE BANDSTAND in the middle of the first third: a stone floor, eight white posts, a pointed roof (copper
      // green or tiled, by the green's own die) and a ball on its point; a round path about it
      const BAND_R = 4.2, BAND_FLOOR = 0.8, BAND_POST = 3, BAND_ROOF = 2.1, bx = gx(third / 2);
      bP.col(STONE, 0.82, 1).surf(SURF.MASONRY, 0, 1); bP.cyl(bx, 0, zM, BAND_R + 0.3, BAND_R, BAND_FLOOR, 8);
      bP.col(TRIM, 0.9, 1).surf(SURF.PLAIN);
      for (let i = 0; i < 8; i++) { const a = TAU * (i + 0.5) / 8; bP.cyl(bx + Math.cos(a) * (BAND_R - 0.35), BAND_FLOOR, zM + Math.sin(a) * (BAND_R - 0.35), 0.1, 0.1, BAND_POST, 5, { cap: false }); }
      bP.col(roofDie < 0.5 ? COPPER : PANTILE, 1, 1); bP.lathe(bx, BAND_FLOOR + BAND_POST, zM, [[BAND_R + 0.5, 0], [BAND_R * 0.5, 0.9], [0.3, BAND_ROOF]], 8);
      bP.col(TRIM, 0.9, 1); bP.sphere(bx, BAND_FLOOR + BAND_POST + BAND_ROOF + 0.2, zM, 0.32, 6, 4);
      green.rings.push([bx, zM, BAND_R + 3]);
      casts.push([bx, zM, 1, 0, BAND_R * 0.8, BAND_R * 0.8, BAND_FLOOR + BAND_POST + BAND_ROOF / 2]);
      // THE POND in the middle of the second third: two round basins side by side across the middle path, run
      // together at a waist, a pale stone edge round them
      const POND_R = 11, POND_APART = 0.7, px = gx(1.5 * third);
      bP.col(KERB, 0.9, 1).surf(SURF.PLAIN); for (const s of [-1, 1]) bP.disc(px, 0.07, zM + s * POND_APART * POND_R, POND_R + 0.7, 20);
      bP.col(WATER, 0.9, 1.12); for (const s of [-1, 1]) bP.disc(px, 0.14, zM + s * POND_APART * POND_R, POND_R, 20);
      // THE BRIDGE carries the middle path over the waist: an arched stone deck with a parapet on each hand, from
      // bank to bank (the waist's own width and BRIDGE_BANK on each bank)
      const BRIDGE_BANK = 1.5, SPAN = 2 * (Math.sqrt(1 - POND_APART * POND_APART) * POND_R + BRIDGE_BANK), BRIDGE_RISE = 2.2, DECK = 0.5, PARAPET = 0.9, BRIDGE_N = 8;
      const deckY = (t) => 0.05 + BRIDGE_RISE * 4 * t * (1 - t);
      bP.col(STONE, 0.82, 1).surf(SURF.MASONRY, 0, 1);
      for (let i = 0; i < BRIDGE_N; i++) {
        const t0 = i / BRIDGE_N, t1 = (i + 1) / BRIDGE_N, x0 = px + SPAN * (t0 - 0.5), x1 = px + SPAN * (t1 - 0.5), y0 = deckY(t0), y1 = deckY(t1), z0 = zM - GREEN_PATH / 2, z1 = zM + GREEN_PATH / 2;
        bP.quad([x0, y0, z1], [x1, y1, z1], [x1, y1, z0], [x0, y0, z0]);
        // each parapet with the deck's edge under it, its outer face and its inner one
        bP.quad([x0, y0 - DECK, z1], [x1, y1 - DECK, z1], [x1, y1 + PARAPET, z1], [x0, y0 + PARAPET, z1]); bP.quad([x1, y1, z1], [x0, y0, z1], [x0, y0 + PARAPET, z1], [x1, y1 + PARAPET, z1]);
        bP.quad([x1, y1 - DECK, z0], [x0, y0 - DECK, z0], [x0, y0 + PARAPET, z0], [x1, y1 + PARAPET, z0]); bP.quad([x0, y0, z0], [x1, y1, z0], [x1, y1 + PARAPET, z0], [x0, y0 + PARAPET, z0]);
      }
      // THE LAST THIRD, at the head of the green, is left to the lawn, the middle path and the great trees (no
      // building stands there; the green's dice are drawn as before)
      addMesh(bP, 'the-green', false);
      await ctx.yield();
    }
    await ctx.yield();
    let landTex = [], landOuter = null;
    if (typeof document !== 'undefined') {
      const mkCanvas = () => { const c = document.createElement('canvas'); c.width = c.height = 2048; return c; };
      const texOf = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
      const cIn = mkCanvas(), cOut = mkCanvas();
      await paintLand(cIn, TOWN_PLATE, land, ctx.yield); await ctx.yield(); await paintLand(cOut, 5600, land, ctx.yield); await ctx.yield();
      landTex = [texOf(cIn), texOf(cOut)];
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(TOWN_PLATE, TOWN_PLATE, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: landTex[0], roughness: 1, metalness: 0 }));
      inner.position.set(LAND_C[0], -0.02, LAND_C[1]); inner.receiveShadow = true; inner.name = 'land-town'; scene.add(inner);
      const gOut = new THREE.PlaneGeometry(5600, 5600, 56, 56).rotateX(-Math.PI / 2), pa = gOut.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i) + LAND_C[0], z = pa.getZ(i) + LAND_C[1], r = Math.hypot(x - TC[0], z - TC[1]);
        pa.setY(i, r < 560 ? -0.8 : -0.8 + smoothstep(560, 1250, r) * 26 + smoothstep(900, 2400, r) * 210 * Math.pow(0.5 + 0.5 * ctx.noise.fbm2(x * 0.00075 + 5.3, z * 0.00075 + 1.7, 3), 1.6));
      }
      gOut.computeVertexNormals(); await ctx.yield();
      const outer = new THREE.Mesh(gOut, new THREE.MeshStandardMaterial({ map: landTex[1], roughness: 1, metalness: 0 }));
      outer.position.set(LAND_C[0], 0, LAND_C[1]); outer.name = 'land-hills'; scene.add(outer); landOuter = outer;
    }
    await ctx.yield();


    // ------------------------------------------------------------ clipped ball trees in a strict row down each pavement, and round the market place
    const bT = S.makeBuilder(4096), bTm = S.makeBuilder(4096), bP = S.makeBuilder(2048), trees = [];
    for (let s = 4.5; s < S_E - 4; s += 9) for (const side of [-1, 1]) { const p = street.at(s, side * 4.55); trees.push([p[0], p[1]]); }
    // the third street's pavements carry the same row north of its splayed corner; the west street's and the west
    // arm's a tree every TREE_FAR on either side, the two sides out of step
    const TREE_FAR = 18;
    for (let z = Z2 - HALF - CH - 6; z > MKT.z0 + 4; z -= 9) for (const side of [-1, 1]) trees.push([X3 + side * 4.55, z]);
    for (let x = MKT.x0 - 14, n = 0; x > xWest + 10; x -= TREE_FAR / 2, n++) trees.push([x, BZ + (n % 2 ? 4.55 : -4.55)]);
    for (let x = X_END - HALF - 8, n = 0; x > armX0 + 4; x -= TREE_FAR / 2, n++) trees.push([x, Z2 + (n % 2 ? 4.55 : -4.55)]);
    let treesLaid = 0;
    for (let i = 0; i < trees.length; i++) {
      const [x, z] = trees[i];
      if (lineDist(x, 2.7, z) < TREE_AIR + 0.92 + 1) continue;
      ballTreeInto(bT, x, z, (i * 0.618) % 1); treesLaid++;
    }
    await ctx.yield();
    // THE ROADS' MIDDLES are never bare. Down the middle of each flown roadway, every MID_STEP metres, by the street's
    // kind: in the high street a market barrow under its canopy, then two half barrels of flowers, turn about; in the
    // second street a long planter, then a half barrel; in the third street (and on along it beyond the crossing) a
    // farm cart, then a half barrel. Nothing of them comes within CLEAR + 0.6 of the route's line (a barrow's
    // canopy is 2.8 m high under a line at 6.5 m); what would is left out. Every die is drawn first.
    const MID_STEP = 9, WEST_STEP = 12, mids = [];
    for (let s = 12; s < S_E - 8; s += MID_STEP) { const p = street.at(s, 0), q = street.at(s + 1, 0); mids.push(['high', p[0], p[1], Math.atan2(-(q[1] - p[1]), q[0] - p[0])]); }
    for (let x = X_END + 16; x < X3 - 12; x += MID_STEP) mids.push(['second', x, Z2, 0]);
    for (let z = Z2 - 14; z > MKT.z0 - 4; z -= MID_STEP) mids.push(['third', X3, z, Math.PI / 2]);
    // the west street, under the last way: a cart, then a half barrel, every WEST_STEP metres
    for (let x = MKT.x0 - 16; x > xWest + 12; x -= WEST_STEP) mids.push(['west', x, BZ, 0]);
    const midDice = mids.map(() => [rMid(), rMid()]);
    let midsLaid = 0;
    for (let i = 0; i < mids.length; i++) {
      const [kind, x, z, ry] = mids[i], [k1, k2] = midDice[i], big = i % 2 === 0, top = !big ? 1 : kind === 'high' ? 2.8 : 1.75;
      if (lineDist(x, top, z) < CLEAR + 0.6) continue;
      midsLaid++;
      if (!big) { tubInto(bT, x, z, k1); if (kind === 'high') tubInto(bT, x + 1.5 * Math.cos(ry), z - 1.5 * Math.sin(ry), k2); }
      else if (kind === 'high') barrowInto(bT, x, z, ry, AWNINGS[Math.floor(k2 * AWNINGS.length) % AWNINGS.length], k1);
      else if (kind === 'second') planterInto(bT, x, z, ry, 5.2, k1);
      else cartInto(bT, x, z, ry + (k2 - 0.5) * 0.5, k1);
      if (i % 8 === 7) await ctx.yield();
    }
    // BOTH HANDS OF THE LOW LINE carry something: on the second street's two pavements a half barrel of flowers
    // every MID_STEP metres, half a step from the roadway's own things; on each splayed corner's paving a market
    // barrow between two half barrels. Nothing of them comes within CLEAR + 0.6 of the route's line. Every die
    // (the street floors' own stream) is drawn first.
    const sides = [];
    for (let x = X_END + 16 + MID_STEP / 2; x < X3 - 12; x += MID_STEP) {
      if (x < X3 - HALF - CH - 2) sides.push(['tub', x, Z2 - 5.2, 0]);
      if (x > X_END + HALF + CH + 2) sides.push(['tub', x, Z2 + 5.2, 0]);
    }
    for (const [A, B] of [[qA, pA], [[X3 - HALF - CH, Z2 - HALF], [X3 - HALF, Z2 - HALF - CH]]]) {
      const l = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / l, uz = (B[1] - A[1]) / l, mx = (A[0] + B[0]) / 2 - uz * 2.6, mz = (A[1] + B[1]) / 2 + ux * 2.6;
      sides.push(['barrow', mx, mz, Math.atan2(-uz, ux)], ['tub', mx + ux * 3.3, mz + uz * 3.3, 0], ['tub', mx - ux * 3.3, mz - uz * 3.3, 0]);
    }
    const sideDice = sides.map(() => [rFloor(), rFloor()]);
    for (let i = 0; i < sides.length; i++) {
      const [kind, x, z, ry] = sides[i], [k1, k2] = sideDice[i];
      if (lineDist(x, kind === 'tub' ? 1 : 2.8, z) < CLEAR + 0.6) continue;
      if (kind === 'tub') tubInto(bT, x, z, k1); else barrowInto(bT, x, z, ry, AWNINGS[Math.floor(k2 * AWNINGS.length) % AWNINGS.length], k1);
    }
    // THE SQUARE'S TABLES: two rings of cafe tables under parasols round the fountain, the line's own first round
    // between them (the inner at TABLES_R, the outer as far outside the line's round as the inner is inside it),
    // and beyond the outer ring a table in the middle of every square of the paving's own grid; none in a street's
    // mouth, none whose parasol comes within CAFE_AIR of the route's line: so the line crosses the square through
    // the tables. Eight flower beds in stone kerbs stand round the basin, and three clipped trees in each corner.
    // Every die is drawn first.
    const TABLES_R = 20.5, TABLES_N = 16, CAFE_AIR = 3.2, BEDS_R = 10.6, cafes = [], bTq = S.makeBuilder(4096);
    const TABLES_R2 = 2 * R_IN - TABLES_R, TABLES_N2 = Math.round(TABLES_N * TABLES_R2 / TABLES_R), GRID = 10, cell = (2 * SQ - 2.4) / GRID;
    for (let i = 0; i < TABLES_N; i++) { const a = TAU * (i + 0.5) / TABLES_N; cafes.push([BX + Math.sin(a) * TABLES_R, BZ + Math.cos(a) * TABLES_R, a]); }
    for (let i = 0; i < TABLES_N2; i++) { const a = TAU * (i + 0.5) / TABLES_N2; cafes.push([BX + Math.sin(a) * TABLES_R2, BZ + Math.cos(a) * TABLES_R2, a]); }
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      const x = MKT.x0 + 1.2 + (i + 0.5) * cell, z = MKT.z0 - 1.2 - (j + 0.5) * cell;
      if (Math.hypot(x - BX, z - BZ) > TABLES_R2 + cell / 2) cafes.push([x, z, Math.atan2(x - BX, z - BZ)]);
    }
    const cafeDice = cafes.map(() => [rStalls(), rStalls()]);
    // the mouths of the three side streets are kept free; the flown street's own mouth is not one of them (there the
    // tables stand on both hands of the line, as far off it as CAFE_AIR asks)
    const inMouth = (x, z) => (Math.abs(z - BZ) < HALF + 1.5 && Math.abs(x - BX) > SQ - 12) || (Math.abs(x - BX - 12) < HALF + 1.5 && z < BZ - SQ + 12);
    let cafesLaid = 0;
    for (let i = 0; i < cafes.length; i++) {
      const [x, z, ry] = cafes[i];
      if (inMouth(x, z)) continue;
      // no bare paving under the line's way: where a table is left out for its parasol's air, a tub of flowers stands
      // in the table's own place (a tub is low: the line goes over it with all its own air), by the table's own die
      if (lineDist(x, PARASOL_TOP, z) < CAFE_AIR + 1.6) { tubInto(bTm, x, z, cafeDice[i][1]); continue; }
      cafeInto(bTm, bTq, x, z, ry, PARASOLS[Math.floor(cafeDice[i][0] * PARASOLS.length) % PARASOLS.length], cafeDice[i][1]); cafesLaid++;
      if (i % 8 === 7) await ctx.yield();
    }
    for (let i = 0; i < 8; i++) { const a = TAU * i / 8; moundInto(bTq, BX + Math.sin(a) * BEDS_R, BZ + Math.cos(a) * BEDS_R, a, 5.6, 2, (i * 0.618) % 1, true); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [u, v] of [[4.5, 4.5], [10, 4.5], [4.5, 10]]) {
      const x = BX + sx * (SQ - u), z = BZ + sz * (SQ - v);
      if (!inMouth(x, z) && lineDist(x, 2.7, z) > TREE_AIR + 1.92) ballTreeInto(bTm, x, z, (u + v + sx + 2 * sz) * 0.0618 % 1);
    }
    // THE DESSERT SHOPS: every third front of the square carries a great cone or a great cup over its door, turn about
    const sqFronts = houses.filter((q) => q.kind === 'market');
    for (let i = 1; i < sqFronts.length; i += 3) {
      const hs = sqFronts[i];
      dessertSignInto(bTm, (hs.A[0] + hs.B[0]) / 2, 3.9, (hs.A[1] + hs.B[1]) / 2, hs.nx, hs.nz, i % 2 === 0, SCOOPS[hs.h.flower % SCOOPS.length], SCOOPS[(hs.h.flower + 2) % SCOOPS.length]);
    }
    await ctx.yield();

    // ------------------------------------------------------------ bunting: along the shop fascias of the high street and the third street (nothing is strung across a street the line looks up from at a great animal), zigzag from eave to eave across the second street, and along the square's fronts
    const ANCHOR_Y = 11.9, strings = [];
    const anchorOf = (hs) => {
      // a three-floor front carries a short white pole on its eave; a two-floor house gives its chimney stack
      if (hs.out.eave > 9) return { p: [(hs.A[0] + hs.B[0]) / 2 - hs.nx * 0.25, ANCHOR_Y, (hs.A[1] + hs.B[1]) / 2 - hs.nz * 0.25], pole: hs.out.eave };
      const st = hs.out.stack; return { p: [hs.cx + hs.ux * st[0] + hs.nx * st[2], st[1] + 0.3, hs.cz + hs.uz * st[0] + hs.nz * st[2]], pole: 0 };
    };
    const plain = houses.filter((q) => !q.wrong);
    const nearestHouse = (list, key, v) => { let b0 = null, bd = Infinity; for (const q of list) { const dd = Math.abs(key(q) - v); if (dd < bd) { bd = dd; b0 = q; } } return b0; };
    const poles = new Map();
    const anchorAt = (hs) => { if (!poles.has(hs)) poles.set(hs, anchorOf(hs)); return poles.get(hs); };
    // one string every 6.5 m of a street, from the nearest house of one side to the nearest of the other (key: a
    // house's place along its street)
    const zig = (kind, key, v0, v1) => {
      const sides = { 1: plain.filter((q) => q.kind === kind && q.side > 0), '-1': plain.filter((q) => q.kind === kind && q.side < 0) };
      let prevA = null, n = 0;
      for (let v = v0; v < v1; v += 6.5, n++) {
        const hs = nearestHouse(sides[n % 2 ? 1 : -1], key, v), a = anchorAt(hs), tint = rBunt.int(0, 7);
        if (prevA && prevA !== a) strings.push({ a: prevA.p, b: a.p, sag: 0.9, tint, kind });
        prevA = a;
      }
    };
    zig('st2', (q) => q.cx, X_END + HALF + CH + 4, X3 - HALF - CH - 4);
    // one string along each front of the high street and the third street, a hand out from the wall at the string
    // course over the shop
    const FASCIA_Y = 3.62, FASCIA_OUT = 0.34;
    for (const hs of plain) {
      const tint = rBunt.int(0, 7);
      if (hs.kind !== 'street' && hs.kind !== 'st3' && hs.kind !== 'market') continue;
      strings.push({ a: [hs.A[0] + hs.nx * FASCIA_OUT, FASCIA_Y, hs.A[1] + hs.nz * FASCIA_OUT], b: [hs.B[0] + hs.nx * FASCIA_OUT, FASCIA_Y, hs.B[1] + hs.nz * FASCIA_OUT], sag: 0.22, tint, kind: 'along' });
    }
    // every die is drawn above; now each string is kept only if its whole sag, pennants and flutter stay clear of the route's line
    const keeps = (st) => {
      const p = [0, 0, 0];
      for (let i = 0; i <= 24; i++) { buntPoint(st, i / 24, p); if (Math.min(lineDist(p[0], p[1], p[2]), lineDist(p[0], p[1] - BUNT_LEN, p[2])) < CLEAR + BUNT_W * 0.5 + 0.42) return false; }
      return true;
    };
    const kept = [];
    for (let i = 0; i < strings.length; i++) { if (keeps(strings[i])) kept.push(strings[i]); if (i % 12 === 11) await ctx.yield(); }
    for (const a of poles.values()) if (a.pole) { bP.col(TRIM, 0.9, 1).surf(SURF.PLAIN); bP.cyl(a.p[0], a.pole - 0.2, a.p[2], 0.06, 0.045, ANCHOR_Y - a.pole + 0.25, 5, { cap: false }); bP.col(lin('#d9b24a'), 1, 1); bP.sphere(a.p[0], ANCHOR_Y + 0.12, a.p[2], 0.13, 6, 4); }
    addMesh(bT, 'street-trees'); await ctx.yield(); addMesh(bTm, 'market-things'); await ctx.yield(); addMesh(bTq, 'square-trim', false); await ctx.yield(); addMesh(bP, 'poles', false); await ctx.yield();
    const buntU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBuntLight: { value: new THREE.Color(1, 1, 1) } }]);
    buntU.uTime = tU;
    const bunting = makeBunting(kept, buntU); scene.add(bunting);
    await ctx.yield();

    // ------------------------------------------------------------ THE SHOAL: where every animal is and how it moves, by the world's clock or by the metres the lens has flown
    const light = {
      sun: sky.lightDirection.clone(), sunColor: rig.sun.color.clone().multiplyScalar(rig.sun.intensity),
      skyColor: rig.hemi.color.clone().multiplyScalar(rig.hemi.intensity), groundColor: rig.hemi.groundColor.clone().multiplyScalar(rig.hemi.intensity),
    };
    const density = clamp(vary.density ?? 1, 0.7, 1.3), dn = (density - 0.7) / 0.6;
    const FINE = 2;
    // the fine skin: the FINE animals nearest to the eye wear it (it casts nothing: every shadow is SHADE's, below)
    const near = makeShrimps(ctx, Object.assign({ count: FINE, length: 46, detail: 'near', seedKey: 'near', prepared: shrimpKit, castShadow: false }, light));
    await ctx.yield();
    const bank = 0.1;
    // the route's line about an upright: the radius of every 2 m mark
    const radiiAbout = (cx, cz) => { const r = new Float32Array(lineN + 1); for (let i = 0; i <= lineN; i++) r[i] = Math.hypot(line[i * 3] - cx, line[i * 3 + 2] - cz); return r; };
    const lineR = radiiAbout(BX, BZ);
    // ------------------------------------------------------------ the three that hover and groom (hover 1), each tending one of the wrong houses
    const YAX = new THREE.Vector3(0, 1, 0), XAX = new THREE.Vector3(1, 0, 0), ZAX = new THREE.Vector3(0, 0, 1);
    const hov = [];
    // an animal whose nose tip is at `nose`, its tail toward the level bearing (tx, tz), pitched nose-down by `pitch`
    // (o.ahead: `nose` is instead a point on its middle line that many metres behind the nose tip, where the walking legs are)
    const hoverer = (at, tx, tz, pitch, o) => {
      const l = Math.hypot(tx, tz), hx = -tx / l, hz = -tz / l, cp = Math.cos(pitch), sp = Math.sin(pitch), ah = o.ahead || 0, k = o.k || 1;
      const nose = [at[0] + ah * hx * cp, at[1] - ah * sp, at[2] + ah * hz * cp];
      const q = new THREE.Quaternion().setFromAxisAngle(YAX, Math.atan2(hx, hz)).multiply(new THREE.Quaternion().setFromAxisAngle(XAX, pitch));
      const base = new THREE.Vector3(nose[0] - 23 * k * hx * cp, nose[1] + 23 * k * sp, nose[2] - 23 * k * hz * cp);
      const h = Object.assign({ base, q, ax: new THREE.Vector3(hx * cp, -sp, hz * cp), p1: rShoal() * TAU, p2: rShoal() * TAU, phase: rShoal(), drift: 0.55 }, o);
      hov.push(h); return h;
    };
    // 1 THE ANIMAL AT THE HOUSE ON ITS HEAD: a small one of the shoal (two fifths of the 46 m) in the yard at window
    //   height, its head down at the upturned house's east corner, its walking legs at the front, its short feelers
    //   across the front toward the pots in the paving, its body rising to the east over the yard wall and the gardens.
    //   Every part of it is behind the terrace's line: 9 m and more from the route's line across the street.
    const SA_K = 0.42, saPitch = 0.38, streetY = 4.2;
    const sa = hoverer([W1.B2[0] + 0.2, streetY, W1.front[1] + 1.7], Math.cos(0.12), -Math.sin(0.12), saPitch, { drape: [(streetY + 23 * SA_K * Math.sin(saPitch) - 0.6) / SA_K, 0], tends: 'W1', drift: 0.15, k: SA_K });
    // 2 the tender of THE SMALL HOUSE: a small one like the first, level over the two neighbours' roofs, its head over
    //   the little house's slot, its long feelers hanging into the slot to the little roof and trailing back through
    //   it, its tail away from the street
    const W3_BACK = 3;
    const w3x = (W3.A[0] + W3.B[0]) / 2, w3z = (W3.A[1] + W3.B[1]) / 2, y3 = ROOF_TOP + bh.down * SA_K + 1;
    hoverer([w3x - W3.nx * W3_BACK, y3, w3z - W3.nz * W3_BACK], -W3.nx, -W3.nz, 0, { drape: [(y3 - W3.height - 0.6) / SA_K, Math.PI], tends: 'W3', drift: 0.15, k: SA_K });
    // 3 the tender of THE HOUSE THAT GREW: a small one, head down at 35 degrees at its top floor, its walking legs at
    //   the top flower box, its body rising along the terrace to the east (the terrace's own bearing with a seeded few
    //   degrees), its long feelers hanging free down the fronts to the west of the tall house
    const gw = rGroom.range(-0.1, 0.1);
    hoverer([W2.x + 0.6, W2.eave + 0.4, W2.z + 1.9], Math.cos(gw), Math.sin(gw), 0.61, { drape: [0, 0], tends: 'W2', ahead: 10 * SA_K, drift: 0.15, k: SA_K });
    // each hoverer's long feelers as posed, over the whole clock (two lines of [x, y, z, r]), for the count of clear air
    for (const h of hov) { near.setPose(0, h.base, h.q, h.k || 1, h.phase, 1); near.setDrape(0, h.drape[0], h.drape[1]); h.lines = near.feelerLines(0); await ctx.yield(); }
    // what stands in the wheel's air: each hovering animal as a box of radius and height about the upright (its middle
    // line, drift and all, with its widest reach round it), and the tall house; the roofs' chimney pots below
    const obstacles = hov.map((h) => {
      let r0 = Infinity, r1 = 0, y0 = Infinity, y1 = -Infinity; const k = h.k || 1, side = Math.max(bh.halfWidth, bh.down * Math.abs(h.ax.y)) * k + h.drift + 0.8;
      for (let i = -8; i <= 8; i++) {
        const t = i * bh.halfLength * k / 8, x = h.base.x + h.ax.x * t, y = h.base.y + h.ax.y * t, z = h.base.z + h.ax.z * t, r = Math.hypot(x - BX, z - BZ);
        r0 = Math.min(r0, r - side); r1 = Math.max(r1, r + side); y0 = Math.min(y0, y - bh.down * k - h.drift - 0.8); y1 = Math.max(y1, y + bh.up * k + h.drift + 0.8);
      }
      return [r0, r1, y0, y1];
    });
    const w2r = Math.hypot(W2.x - BX, W2.z - 3 - BZ); obstacles.push([w2r - 7, w2r + 7, 0, W2.top + 3]);
    // the clock tower, to two metres over its finial
    const towerR = Math.hypot(TX - BX, TZ - BZ); obstacles.push([towerR - TOWER_W * 0.75, towerR + TOWER_W * 0.75, 0, tower.top + 2]);
    // ------------------------------------------------------------ THE WHEEL
    // Every animal of the wheel swims a ring of its own about the fountain's upright: the ring's radius and height,
    // the animal's size, its place on the ring, and its own set of the head (a yaw off the ring's tangent), pitch
    // and roll are all from the lane's dice. A lane is the few animals that share one rate of turning; their rings
    // lie within a few metres of the lane's own. The wheel's lanes all turn one way, against the climb's own
    // turning: every one the line meets comes against it. (Of the stream into the ring the right hand turns with
    // the climb and the left hand against it, each hand on rings of its own.)
    // AN ANIMAL'S REACH, as balls in its own axes at size 1: the corners of the two boxes that hold body and legs
    // (the fore part down to the legs' reach, the tail part down to its lowest beat); and
    // with the feelers, the long ones' lines on both sides and the short ones' drum (narrow at its root: the four
    // short feelers leave the head within a metre of its axis and part as they go).
    const BODY_BALLS = [], FEEL_BALLS = [], fl = near.bounds.feeler;
    for (const x of [-bs.halfWidth, bs.halfWidth]) for (const [z0, z1, dn] of [[bs.aftZ, bs.front, bs.downFore], [-bs.back, bs.aftZ, bs.downAft]]) for (const y of [-dn, bs.up]) for (const z of [z0, z1]) BODY_BALLS.push([x, y, z, 0]);
    for (const p of fl.each.swim.line) for (const s of [-1, 1]) FEEL_BALLS.push([p[0] * s, p[1], p[2], p[3]]);
    for (let i = 0; i <= 4; i++) { const sd = fl.short.swim, r0 = fl.short.root, t = sd.length * i / 4; FEEL_BALLS.push([r0[0] + sd.dir[0] * t, r0[1] + sd.dir[1] * t, r0[2] + sd.dir[2] * t, sd.spread * (0.35 + 0.65 * i / 4)]); }
    const ALL_BALLS = BODY_BALLS.concat(FEEL_BALLS), _bv = new THREE.Vector3(), _bq = new THREE.Quaternion();
    // the ring an animal sweeps, as a box of radius and height about its upright, good for every clock time:
    // [least radius, greatest radius, lowest, highest]
    const sweepOf = (a, feelers) => {
      const bx = [Infinity, 0, Infinity, -Infinity], sg = a.w < 0 ? -1 : 1;
      _bq.setFromAxisAngle(YAX, a.yaw).multiply(a.q0);
      for (const b of feelers ? ALL_BALLS : BODY_BALLS) {
        _bv.set(b[0], b[1], b[2]).multiplyScalar(a.k).applyQuaternion(_bq);
        const rho = b[3] * a.k, out = a.R + sg * _bv.x;
        bx[0] = Math.min(bx[0], out - rho); bx[1] = Math.max(bx[1], Math.hypot(out, _bv.z) + rho); bx[2] = Math.min(bx[2], a.H + _bv.y - rho); bx[3] = Math.max(bx[3], a.H + _bv.y + rho);
      }
      return bx;
    };
    // the least distance from the route's line (its radii about the box's upright) to a box of radius and height
    const boxGap = (bx, radii = lineR, i0 = 0, i1 = lineN) => {
      let best = Infinity;
      for (let i = i0; i <= i1; i++) { const d = Math.hypot(Math.max(bx[0] - radii[i], 0, radii[i] - bx[1]), Math.max(bx[2] - line[i * 3 + 1], 0, line[i * 3 + 1] - bx[3])); if (d < best) best = d; }
      return best;
    };
    // BODY_AIR: clear air kept between the route's line and a wheel animal's body and legs; FEEL_AIR: and its feelers;
    // LANE_AIR: between one lane's whole reach and another's; LEAST_APART: metres of ring to each animal of a lane
    const BODY_AIR = 9, FEEL_AIR = 8.2, LANE_AIR = 1.5, LEAST_APART = 90;
    // how far an animal's own set differs from its lane's: yaw, pitch and roll (radians), ring radius and height (metres at size 1)
    // (the set of an animal's head off its ring's tangent, its pitch and its roll: these for a great one, more for a
    // smaller one in the measure of its smallness, SET_MOST radians at the most)
    const YAW_OFF = 0.12, PITCH_OFF = 0.08, ROLL_OFF = 0.2, SET_MOST = 0.35, RING_OFF = 2, HIGH_OFF = 1.5;
    const OMEGA = TAU / rShoal.range(118, 136), DRIFT_A = rShoal.range(0.38, 0.48), DRIFT_B = rShoal.range(0.27, 0.35), lanes = [], wheel = [];
    // the lanes' dice: a fixed number, drawn whether or not they are used; lane j reads its own block
    const LANE_DICE = 96, LANES_MOST = 16, laneDice = new Float32Array(LANE_DICE * LANES_MOST);
    for (let i = 0; i < laneDice.length; i++) laneDice[i] = rLanes();
    // a lane: n animals about the upright (cx, cz) near radius R and height H, of sizes near k, turning at about w
    const makeLane = (kind, j, cx, cz, R, H, k, w, o = {}) => {
      const d = (i) => laneDice[j * LANE_DICE + i], apart = Math.max(46 * k * lerp(2.2, 2.8, d(0)), LEAST_APART) * lerp(1.1, 0.95, dn);
      const n = clamp(Math.floor(TAU * R / apart), o.least || 2, o.most || 5), rate = w * lerp(0.8, 1.25, d(1));
      const lane = { kind, j, cx, cz, R, H, k, n, w: rate, list: [], box: [Infinity, 0, Infinity, -Infinity], body: [Infinity, 0, Infinity, -Infinity], radii: cx === BX && cz === BZ ? lineR : radiiAbout(cx, cz) };
      for (let q = 0; q < n; q++) {
        const e = (i) => d(6 + q * 9 + i);
        const a = {
          kind, cx, cz, R: R + RING_OFF * k * (2 * e(0) - 1), H: H + HIGH_OFF * k * (2 * e(1) - 1), k: k * lerp(0.86, 1.14, e(2)), w: rate, phi: TAU * (d(2) + (q + 0.6 * (e(3) - 0.5)) / n), phase: e(4), yaw: Math.min(SET_MOST, YAW_OFF / k) * (2 * e(5) - 1),
          q0: new THREE.Quaternion().setFromAxisAngle(XAX, Math.min(SET_MOST, PITCH_OFF / k) * (2 * e(6) - 1)).multiply(new THREE.Quaternion().setFromAxisAngle(ZAX, (rate < 0 ? -bank : bank) + ROLL_OFF * (2 * e(7) - 1))),
        };
        const bf = sweepOf(a, true), bb = sweepOf(a, false);
        for (const [to, from] of [[lane.box, bf], [lane.body, bb]]) { to[0] = Math.min(to[0], from[0]); to[1] = Math.max(to[1], from[1]); to[2] = Math.min(to[2], from[2]); to[3] = Math.max(to[3], from[3]); }
        lane.list.push(a);
      }
      return lane;
    };
    // A lane fits when its lowest reach is a metre over the roofs' chimney pots; its bodies keep BODY_AIR from the
    // route's line and its feelers FEEL_AIR; and its whole reach is LANE_AIR clear of every hovering animal, of the
    // tall house and of every lane laid before it. (A lane about an upright of its own is weighed against the others
    // by its heights and by the nearest and the furthest its ring comes to the fountain's upright.)
    const apartBoxes = (a, b, air) => a[1] + air < b[0] || a[0] - air > b[1] || a[3] + air < b[2] || a[2] - air > b[3];
    const aboutHub = (ln) => {
      if (ln.cx === BX && ln.cz === BZ) return ln.box;
      const dC = Math.hypot(ln.cx - BX, ln.cz - BZ), hw = (ln.box[1] - ln.box[0]) / 2, R = (ln.box[0] + ln.box[1]) / 2;
      return [Math.abs(dC - R) - hw, dC + R + hw, ln.box[2], ln.box[3]];
    };
    // two lanes are apart when their heights are, or their rings are in plan: about one upright by their radii; one
    // of them about the fountain's upright by the nearest and furthest the other comes to it; about two uprights
    // of their own by the distance between those
    const lanesApart = (a, b) => {
      if ((a.cx === BX && a.cz === BZ) || (b.cx === BX && b.cz === BZ)) return apartBoxes(aboutHub(a), aboutHub(b), LANE_AIR);
      if (a.cx === b.cx && a.cz === b.cz) return apartBoxes(a.box, b.box, LANE_AIR);
      return a.box[3] + LANE_AIR < b.box[2] || a.box[2] - LANE_AIR > b.box[3] || Math.hypot(a.cx - b.cx, a.cz - b.cz) > a.box[1] + b.box[1] + LANE_AIR;
    };
    // WHOLE: no wheel animal's body comes nearer the line than WHOLE of its own length (it is whole before the lens
    // when it is nearest), unless its whole reach passes OVER_AIR and more over or under the line there.
    // A lane that swims inside the square's own air (its whole reach SQUARE_AIR inside the fronts' line) keeps its
    // lowest reach SQUARE_FLOOR up (over the parasols and whatever walks the cobbles), not over the roofs.
    const WHOLE = 0.65, OVER_AIR = 8, SQUARE_FLOOR = 6.5, SQUARE_AIR = 3;
    const wholeGap = (ln) => {
      let best = Infinity; const bx = ln.body, radii = ln.radii;
      for (let i = 0; i <= lineN; i++) {
        const y = line[i * 3 + 1];
        if (bx[2] - y >= OVER_AIR || y - bx[3] >= OVER_AIR) continue;
        const d = Math.hypot(Math.max(bx[0] - radii[i], 0, radii[i] - bx[1]), Math.max(bx[2] - y, 0, y - bx[3]));
        if (d < best) best = d;
      }
      return best;
    };
    const laneFits = (ln) => {
      const inSquare = ln.cx === BX && ln.cz === BZ && ln.box[1] < SQ - SQUARE_AIR;
      if (ln.box[2] < (inSquare ? SQUARE_FLOOR : ROOF_TOP + ROOF_AIR) || ln.box[0] < 4) return false;
      ln.gapBody = boxGap(ln.body, ln.radii); ln.gap = boxGap(ln.box, ln.radii);
      if (ln.gapBody < BODY_AIR || ln.gap < FEEL_AIR || wholeGap(ln) < WHOLE * 46 * ln.k) return false;
      const hb = aboutHub(ln);
      for (const ob of obstacles) if (!apartBoxes(hb, ob, LANE_AIR)) return false;
      for (const other of lanes) if (!lanesApart(ln, other)) return false;
      return true;
    };
    const keepLane = (ln) => { lanes.push(ln); for (const a of ln.list) wheel.push(a); return ln; };
    // THE WHEEL'S LANES, all about the fountain's upright, turning against the climb. Far off there are only great
    // ones, and few: the small swim low inside the square, the middle-sized over the square inside the climb's
    // turns, the great high and wide.
    const E = route.end, rEnd = Math.hypot(E[0] - BX, E[2] - BZ), TRIES = 24, RING_LEAST = 1.3;
    const dC = (j, i) => laneDice[j * LANE_DICE + i];
    // a lane tried from (R0, H0), moved by (stepR, stepH) at a time (and at each such place `rises` times up by
    // `rise`) until it fits; left out if it never does
    const layFrom = (kind, j, k, R0, H0, stepR, stepH, o, rises = 1, rise = 0) => {
      for (let t = 0; t < TRIES; t++) for (let h = 0; h < rises; h++) { const ln = makeLane(kind, j, BX, BZ, Math.max(R0 + stepR * t, RING_LEAST * 46 * k), H0 + stepH * t + rise * h, k, OMEGA, o); if (laneFits(ln)) return keepLane(ln); }
      return null;
    };
    // THE STREAM INTO THE RING: THE RIBBON of RIBBON_N small ones (RIBBON_K), which FLANKS the last way: half of
    // them on each hand of the line and none on the line's own axis. Each swims a ring of its own about the
    // fountain's upright, leaves it where its heading is its hand's own, swims straight to its own place in the
    // ring's face and through it. The right hand's rings turn WITH the climb and lie outside the innermost ring
    // that clears the clock tower (the tower's outermost corner, LANE_AIR and the animal's own half reach), so
    // their straights lie beside the last way and go through the ring's face nearly square to it. THE LEFT HAND
    // HAS RINGS OF ITS OWN, swum the other way round, on the other side of the west street's axis: its innermost
    // lies beyond the right hand's outermost lane by the two animals' whole reach and LANE_AIR, as the wheel's
    // lanes are kept from one another, so no ring of one hand lies within reach of a ring of the other and no two
    // animals of the stream ever meet; its straights are the tangents from its own rings to its own places in the
    // ring's face (a little steeper to the face than the right hand's). ON ITS RINGS A HAND TURNS AS ONE about the
    // upright, as a wheel's lane does: one rate of turning for its six (the rate that gives the lane midway
    // between its two arcs STREAM_PACE), so the six keep their places beside one another from the entry to the
    // ring and none of them passes another. Each animal is placed by
    // the metres the lens has flown, at STREAM_PACE of the lens's pace: a little slower than the lens, which
    // gains on it all the way.
    // A LANE'S PLACE IN THE RING'S FACE: on RIBBON_ARCS arcs about the ring's middle, on the lane's own hand,
    // RIBBON_ROWS lanes to an arc. The inner arc stands RIBBON_CLEAR of the largest small one's own widths (its
    // body and legs) and the play from the line's axis, and further out by a play at a time until every one of its
    // lanes keeps the crew's CLEAR from the route's line by its whole reach, by the rule's own ends (faceAir); the
    // outer arc is the widest the ring lets an animal through whole (the
    // rim less the legs' depth, the animal's greatest reach from its lane). An arc's lanes fan RIBBON_FAN up and
    // down from the level of the ring's middle, the lowest no lower than keeps ROOF_AIR over the chimney pots (and
    // the highest as far above the ring's middle as that is below it); its own dice shift each RIBBON_PLAY within
    // its lane. So the ring's opening stands clear before the eye all the way down, and each animal is seen from
    // its side, beside the eye. Each goes through the face when the lens has RIBBON_IN metres left to fly (its own
    // dice): it has crossed before the lens by then, further ahead of it than its own length.
    // WHEN AN ANIMAL IS WHOLLY BEHIND THE RING'S FACE it is drawn at no size: its rearmost corner is then GONE_AIR
    // behind the face (its back reach along its way, and its half width times the slant of its way to the face).
    // The lens is on the west street's axis by then and the ring's own disc is before the animal.
    const STREAM_PACE = 0.8, GONE_AIR = 0.5, RIBBON_N = 12, RIBBON_ARCS = 2, RIBBON_ROWS = 3, RIBBON_K = [0.12, 0.15], RIBBON_IN = [9, 14], RIBBON_PLAY = 0.1, RIBBON_CLEAR = 3, RIBBON_FAN = 40 * TAU / 360;
    const ribbonDice = []; for (let i = 0; i < RIBBON_N * 5; i++) ribbonDice.push(rRibbon());
    const stream = [], towerOut = towerR + TOWER_W * Math.SQRT1_2 + LANE_AIR;
    // the first great lane's place: a street's width beyond the furthest the line goes from the fountain's upright
    // on its turn round the tower
    const GREAT_R = towerR + RHO + 2 * HALF, axisR = towerOut + bs.feelerHalfWidth * RIBBON_K[1] + RIBBON_PLAY;
    {
      // a hand's heading on its straights: from the hand's own innermost ring (base) to the ring's middle; every
      // lane of the hand lies outside that one. The right hand's base is the innermost ring that clears the tower
      // (axisR); the left hand's lies beyond the right hand's outermost lane by two whole reaches and LANE_AIR.
      const bE = Math.atan2(-(E[2] - BZ), E[0] - BX);
      const family = (base) => {
        const al = Math.acos(base / rEnd), ahead = (b) => (E[0] - BX - base * Math.cos(b)) * -Math.sin(b) + (E[2] - BZ + base * Math.sin(b)) * -Math.cos(b);
        const bT = ahead(bE - al) > 0 ? bE - al : bE + al, hx = -Math.sin(bT), hz = -Math.cos(bT);
        return { base, bT, hx, hz, slant: Math.abs(hz / hx) };
      };
      const wide = 2 * bs.halfWidth * RIBBON_K[1], low = RING_Y - (ROOF_TOP + ROOF_AIR + bs.down * RIBBON_K[1] + RIBBON_PLAY);
      const arc1 = RING_R - bs.down * RIBBON_K[1] - RIBBON_PLAY;
      const hands = { 1: family(axisR), [-1]: family(axisR + arc1 + RIBBON_PLAY + 2 * bs.feelerHalfWidth * RIBBON_K[1] + LANE_AIR) };
      const fanOf = (rho, row) => Math.min(RIBBON_FAN, Math.asin(Math.min(1, low / rho))) * lerp(-1, 1, row / (RIBBON_ROWS - 1));
      // THE LINE'S AIR IN THE RING'S FACE, by the rule's own ends (the largest small one, the play against it): the
      // least distance from the ring's middle, where the route's line ends, to the whole reach of any lane of an
      // arc rho out: the lane's own distance square to its way, less the animal's reach toward the line (its body
      // and legs: their half width, and the legs' depth or the back's height; its feelers: their half width, and
      // their own depth or height)
      const faceAir = (rho) => {
        let least = Infinity;
        for (const hand of [1, -1]) for (let row = 0; row < RIBBON_ROWS; row++) {
          const f = fanOf(rho, row), o = (rho * Math.cos(f) - RIBBON_PLAY) * Math.abs(hands[hand].hx), v = Math.abs(rho * Math.sin(f)) - RIBBON_PLAY;
          for (const [w, d] of [[bs.halfWidth, f > 0 ? bs.down : bs.up], [bs.feelerHalfWidth, f > 0 ? bs.feelerDown : bs.feelerUp]]) least = Math.min(least, Math.hypot(Math.max(0, o - w * RIBBON_K[1]), Math.max(0, v - d * RIBBON_K[1])));
        }
        return least;
      };
      let arc0 = RIBBON_CLEAR * wide + 2 * RIBBON_PLAY;
      while (faceAir(arc0) < CLEAR) arc0 += RIBBON_PLAY;
      // an animal on the hand `hand` (1 the right, -1 the left) whose lane meets the ring's face `off` out on that
      // hand from the ring's middle and H high: its ring's radius, where the ring lets it go, and how far it then
      // swims to the face's plane (the plane through the ring's middle, square to the west street's axis); (ax, az)
      // is its own place in the face
      const add = (hand, off, H, k, enter, phase) => {
        const { base, bT, hx, hz, slant } = hands[hand];
        const R = base + off * Math.abs(hx), tx = BX + R * Math.cos(bT), tz = BZ - R * Math.sin(bT), tan = (E[0] - tx) / hx;
        stream.push({ kind: 'stream', R, turn: base + (arc0 + arc1) / 2 * Math.abs(hx), H, k, bT, tan, hand, hx, hz: hand * hz, ax: E[0], az: BZ + hand * (tz + hz * tan - BZ), enter, gone: (bs.back + bs.halfWidth * slant) * k + GONE_AIR, phase, w: -hand * OMEGA, yaw: 0, q0: new THREE.Quaternion() });
      };
      for (let q = 0; q < RIBBON_N; q++) {
        const d = (i) => ribbonDice[q * 5 + i], hand = q % 2 ? -1 : 1, arc = Math.floor(q / 2) % RIBBON_ARCS, row = Math.floor(q / (2 * RIBBON_ARCS)) % RIBBON_ROWS;
        const rho = lerp(arc0, arc1, arc / (RIBBON_ARCS - 1)), fan = fanOf(rho, row);
        // the two hands of one arc and row go through the face IN TURN, half the head starts' span apart (the
        // right hand's by its own die, the left hand's that much on, round the span), so that the feelers of the
        // two never meet where their ways draw together behind the ring's face
        const span = RIBBON_IN[1] - RIBBON_IN[0], first = span * ribbonDice[(q - q % 2) * 5 + 3], enter = RIBBON_IN[0] + (hand > 0 ? first : (first + span / 2) % span);
        add(hand, rho * Math.cos(fan) + RIBBON_PLAY * (2 * d(0) - 1), RING_Y + rho * Math.sin(fan) + RIBBON_PLAY * (2 * d(1) - 1), lerp(RIBBON_K[0], RIBBON_K[1], d(2)), enter, d(4));
      }
      // THE STREAM'S OWN AIR, kept from the wheel's lanes: one box about the upright that holds every stream animal's
      // own ring (its whole reach, from its own radius, height and size) and its straight out to the ring's place
      const box = [Infinity, 0, Infinity, -Infinity];
      for (const an of stream) { const bx = sweepOf(an, true); box[0] = Math.min(box[0], bx[0]); box[1] = Math.max(box[1], rEnd + bx[1] - an.R); box[2] = Math.min(box[2], bx[2]); box[3] = Math.max(box[3], bx[3]); }
      lanes.push({ kind: 'stream', cx: BX, cz: BZ, R: axisR, H: RING_Y, k: RIBBON_K[1], n: stream.length, w: -OMEGA, list: [], box, body: box, radii: lineR, rule: { arc0, arc1, air: faceAir(arc0), base: [hands[1].base, hands[-1].base], slant: [hands[1].slant, hands[-1].slant] } });
    }
    await ctx.yield();
    // THE GREAT ONES: two lanes, the first GREAT_R out and GREAT_UP[0] high, the second GREAT_STEP further out and
    // GREAT_UP[1] high (each moved out 2 m at a time, and at each place up GREAT_RISE at a time, until it fits),
    // three to a lane
    const GREAT_UP = [[50, 54], [58, 64]], GREAT_STEP = 22, GREAT_RISE = 2;
    for (let q = 0; q < 2; q++) {
      const j = 7 + q;
      layFrom('great', j, GREAT_K[Math.floor(dC(j, 4) * 3) % 3], GREAT_R + q * GREAT_STEP + lerp(-6, 6, dC(j, 3)), lerp(GREAT_UP[q][0], GREAT_UP[q][1], dC(j, 5)), 2, 0, { least: 3, most: 3 }, 4, GREAT_RISE);
      await ctx.yield();
    }
    // THE SMALL ONES OF THE SQUARE: two lanes inside the square, over the eaves, the second outside and above the
    // first (each moved up SQUARE_STEP at a time until it fits), three to a lane
    const SQUARE_K = [[0.29, 0.33], [0.34, 0.4]], SQUARE_UP = [16.5, 20], SQUARE_STEP = 1.5;
    for (let q = 0; q < 2; q++) {
      const k = lerp(SQUARE_K[q][0], SQUARE_K[q][1], dC(q, 3));
      layFrom('square', q, k, RING_LEAST * 46 * k + lerp(0.5, 2.5, dC(q, 4)), SQUARE_UP[q] + 1.5 * dC(q, 5), 0, SQUARE_STEP, { least: 3, most: 3 });
      await ctx.yield();
    }
    // THE MIDDLE ONES: one lane over the square inside the climb's turns, tried from MIDDLE_UP upward
    const MIDDLE_K = [0.46, 0.54], MIDDLE_UP = 30;
    { const k = lerp(MIDDLE_K[0], MIDDLE_K[1], dC(2, 3)); layFrom('middle', 2, k, RING_LEAST * 46 * k + lerp(0.5, 2.5, dC(2, 4)), MIDDLE_UP + 4 * dC(2, 5), 0, 2, { least: 3, most: 3 }); }
    await ctx.yield();
    // the rare visit: one very small animal, 6 m long, swimming with the wheel on the ring nearest the route's line
    // that fits. Its dice are its own stream's, drawn whether or not the visit is dealt.
    const rareDice = []; for (let i = 0; i < 80; i++) rareDice.push({ R: rRare.range(10, 60), H: rRare.range(8, 46) });
    if (vary.rare) {
      let best = null, tried = 0;
      for (const c of rareDice) { const ln = makeLane('rare', 12, BX, BZ, c.R, c.H, 6 / 46, OMEGA, { least: 1, most: 1 }); if (laneFits(ln) && (!best || ln.gap < best.gap)) best = ln; if (++tried % 16 === 0) await ctx.yield(); }
      if (best) keepLane(best);
    }

    // FAIR-WEATHER CLOUDS: small flat-bottomed heaps from their own stream, in two shapes. Each drifts on the clock
    // with the one wind (its speed and bearing from the same stream) along a way of its own: it is born at nothing
    // at the way's upwind end, grows, swims the way at its full size, melts to nothing at the downwind end and is
    // born again upwind, so nothing of it is ever switched. THE HIGH ONES swim over the whole town at two heights,
    // the lower of them CLOUD_AIR over the highest animal's reach. THE LOW ONES (every third) hang at the great
    // ones' own heights and only outside the wheel: a low one's whole way passes the fountain's upright CLOUD_AIR
    // and more beyond the outermost lane's reach. So an animal passes before the high clouds and behind the low
    // ones. They cast their shadows on roofs and gardens; their bases keep a little of the sky's own light. (Into the
    // shadow light's own pass each is drawn as CLOUD-SHADE, the same heap of lobes more coarsely made, which is
    // drawn nowhere else: so the heaps themselves are drawn once.)
    // THE HILLS' CLOUDS (their own stream): HILL_CLOUDS larger heaps of the same two shapes, out over the fields and
    // toward the hills, on the side of the country the west street looks out on (within HILL_ARC of its bearing),
    // drifting with the same wind in the same way. Each one's SHADOW lies on the land where the sun's ray through
    // the cloud's middle meets it: a soft round, HILL_ROUND[1] of the cloud's lobe across and HILL_ROUND[0] of it
    // along the sun's fall (a low sun draws a heap's height out long), of the colour and strength of the long
    // shadows painted on the land; the outer land's own material lays it on, so it lies on rising ground as on
    // level. A hill cloud's way is laid by its shadow: the shadow's whole way stays beyond the corners of the
    // town's own plate, so no such shadow ever lies where houses stand.
    const CLOUDS = 22, HEAPS = 2, CLOUD_AIR = 6, CLOUD_STEP = 44, CLOUD_OUT = 800, CLOUD_BORN = 0.16, CLOUD_LIFE = [260, 420], LOBE = 9, CLOUD_BASE = '#8ea0bf';
    // IN LAYERS (HILL_LAYERS: how many, the lobe's size from and to, the height from and to). The lowest layer is
    // laid as above, by where its shadows fall. The two higher layers are great heaps that stand over the hills the
    // west street looks out on: each is laid by its own place, within HILL_VIEW of that bearing from the town's
    // middle, no nearer than keeps its shadow's whole way (its reach, its drift and the sun's sideways fall) west
    // of the town's plate, and up to HILL_SPAN further out; its shadow lies on the land down the sun's way from it.
    // The clouds stand above the haze: it does not pale them.
    const HILL_LAYERS = [[7, 4, 6.5, 170, 240], [6, 7, 10, 330, 420], [5, 10, 14, 520, 640]], HILL_CLOUDS = HILL_LAYERS.reduce((n, l) => n + l[0], 0);
    const HILL_ARC = 1.2, HILL_FAR = 600, HILL_VIEW = 0.7, HILL_SPAN = 900, HILL_ROUND = [3.7, 2.2], LAND_SHADE = [lin('#14304e'), 0.42];
    const windV = rCloud.range(1.2, 2), windA = rCloud.range(0, TAU), WX = Math.cos(windA), WZ = Math.sin(windA);
    const wheelOut = lanes.reduce((m, ln) => ln.kind === 'stream' ? m : Math.max(m, aboutHub(ln)[1]), 0), wheelTop = lanes.reduce((m, ln) => Math.max(m, ln.box[3]), 0);
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color(CLOUD_BASE), fog: false });
    const cloudShadeMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
    // one heap, its middle lobe 1 across: a lobe on either hand, a smaller one beyond each, and one before; and the
    // same lobes once more, coarsely, for the shadow light
    const heap = () => {
      const b = S.makeBuilder(1024), c = S.makeBuilder(512);
      b.col([1, 1, 1], 1, 1).surf(SURF.PLAIN); c.col([1, 1, 1], 1, 1).surf(SURF.PLAIN);
      for (let q = 0; q < 6; q++) {
        const d0 = rCloud(), d1 = rCloud(), d2 = rCloud(), d3 = rCloud(), hand = q % 2 ? 1 : -1, ring = Math.ceil(q / 2);
        const r = q === 0 ? 1 : q === 5 ? lerp(0.6, 0.75, d0) : ring === 1 ? lerp(0.66, 0.84, d0) : lerp(0.42, 0.58, d0);
        const x = q === 0 ? 0 : q === 5 ? lerp(-0.6, 0.6, d1) : hand * (ring === 1 ? lerp(0.95, 1.25, d1) : lerp(1.8, 2.2, d1));
        const z = q === 0 ? 0 : q === 5 ? lerp(0.6, 0.8, d2) : lerp(-0.35, 0.35, d2), h = r * lerp(0.95, 1.2, d3);
        b.lathe(x, 0, z, [[0.72 * r, 0], [0.98 * r, 0.2 * h], [0.94 * r, 0.5 * h], [0.7 * r, 0.8 * h], [0.05 * r, h]], 8, { smooth: true });
        b.disc(x, 0, z, 0.72 * r, 8, false);
        c.lathe(x, 0, z, [[0.72 * r, 0], [0.98 * r, 0.35 * h], [0.05 * r, h]], 8);
      }
      return [b.toGeometry(), c.toGeometry()];
    };
    const cloudMesh = [], cloudShade = [], cloudList = [], hillAt = [];
    for (let g = 0; g < HEAPS; g++) {
      const own = Math.ceil((CLOUDS - g) / HEAPS), geo = heap();
      const m = new THREE.InstancedMesh(geo[0], cloudMat, own + Math.ceil((HILL_CLOUDS - g) / HEAPS));
      m.name = 'clouds-' + g; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; scene.add(m); cloudMesh.push(m);
      const sh = new THREE.InstancedMesh(geo[1], cloudShadeMat, own);
      sh.name = 'clouds-shade-' + g; sh.castShadow = true; sh.receiveShadow = false; sh.frustumCulled = false;
      sh.onBeforeShadow = () => { sh.count = own; }; sh.onBeforeRender = () => { sh.count = 0; };
      scene.add(sh); cloudShade.push(sh);
    }
    for (let i = 0; i < CLOUDS; i++) {
      const low = i % 3 === 2, T = rCloud.range(CLOUD_LIFE[0], CLOUD_LIFE[1]), ph = rCloud(), u1 = rCloud(), u2 = rCloud(), u3 = rCloud(), u4 = rCloud();
      const s = LOBE * rCloud.range(0.8, 1.5), flat = rCloud.range(0.8, 1.05), deep = rCloud.range(0.75, 1.1), yaw = rCloud.range(0, TAU);
      let x, y, z;
      if (low) {
        // its way lies `out` from the upright on one hand of the wind; 2.9 of its middle lobe is its own furthest reach
        const out = wheelOut + CLOUD_AIR + 2.9 * s + 260 * u1, hand = u2 < 0.5 ? -1 : 1, along = (2 * u3 - 1) * 300;
        x = BX - hand * WZ * out + WX * along; z = BZ + hand * WX * out + WZ * along; y = lerp(GREAT_UP[0][0], GREAT_UP[1][1], u4);
      } else {
        const a = TAU * u1, r = CLOUD_OUT * u2;
        x = TC[0] + Math.cos(a) * r; z = TC[1] + Math.sin(a) * r; y = wheelTop + CLOUD_AIR + (i % 2) * CLOUD_STEP + 4 * (u3 + u4);
      }
      cloudList.push({ m: cloudMesh[i % HEAPS], shade: cloudShade[i % HEAPS], i: Math.floor(i / HEAPS), x, y, z, T, ph, len: windV * T, sx: s, sy: s * flat, sz: s * deep, q: new THREE.Quaternion().setFromAxisAngle(YAX, yaw) });
    }
    // the sun's fall: how far along the ground a shadow lies from its caster, for each metre of the caster's height
    const fallX = sky.lightDirection.x / sky.lightDirection.y, fallZ = sky.lightDirection.z / sky.lightDirection.y;
    for (let i = 0, n = 0; n < HILL_LAYERS.length; n++) for (let j = 0; j < HILL_LAYERS[n][0]; j++, i++) {
      const lay = HILL_LAYERS[n];
      const T = rHill.range(CLOUD_LIFE[0], CLOUD_LIFE[1]), ph = rHill(), u1 = rHill(), u2 = rHill(), u3 = rHill(), s = LOBE * rHill.range(lay[1], lay[2]), flat = rHill.range(0.8, 1.05), deep = rHill.range(0.75, 1.1), yaw = rHill.range(0, TAU);
      const len = windV * T, y = lerp(lay[3], lay[4], u3), reach = HILL_ROUND[0] * s + len / 2;
      // the lowest layer: the shadow's middle place, beyond the plate's corner by the shadow's own reach and half its
      // way, HILL_FAR at the most further; the cloud stands up the sun's way from it. The higher layers: the cloud's
      // own middle place
      const a = Math.PI + (n ? HILL_VIEW : HILL_ARC) * (2 * u1 - 1);
      const r = n ? (TOWN_PLATE / 2 + reach + Math.abs(fallX) * y) / Math.cos(HILL_VIEW) + HILL_SPAN * u2 : TOWN_PLATE * Math.SQRT1_2 + reach + HILL_FAR * u2;
      const at = new THREE.Vector4();
      hillAt.push(at);
      cloudList.push({ m: cloudMesh[i % HEAPS], shade: null, hill: at, i: Math.ceil((CLOUDS - i % HEAPS) / HEAPS) + Math.floor(i / HEAPS), x: TC[0] + Math.cos(a) * r + (n ? 0 : fallX * y), y, z: TC[1] + Math.sin(a) * r + (n ? 0 : fallZ * y), T, ph, len, sx: s, sy: s * flat, sz: s * deep, q: new THREE.Quaternion().setFromAxisAngle(YAX, yaw) });
    }
    if (landOuter) {
      const fall = Math.hypot(fallX, fallZ), hillU = { uHillCloud: { value: hillAt }, uHillFall: { value: new THREE.Vector4(fallX, fallZ, fallX / fall, fallZ / fall) }, uHillRound: { value: new THREE.Vector2(HILL_ROUND[0], HILL_ROUND[1]) }, uLandShade: { value: new THREE.Vector4(LAND_SHADE[0][0], LAND_SHADE[0][1], LAND_SHADE[0][2], LAND_SHADE[1]) } };
      landOuter.material.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, hillU);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLandPos;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vLandPos; uniform vec4 uHillCloud[${HILL_CLOUDS}]; uniform vec4 uHillFall, uLandShade; uniform vec2 uHillRound;`).replace('#include <map_fragment>', `#include <map_fragment>
{
  float under = 0.0;
  for (int i = 0; i < ${HILL_CLOUDS}; i++) {
    vec4 c = uHillCloud[i];
    vec2 p = vLandPos.xz - c.xz + uHillFall.xy * (c.y - vLandPos.y);
    float w = max(c.w, 0.001), q = length(vec2(dot(p, uHillFall.zw) / (uHillRound.x * w), dot(p, vec2(-uHillFall.w, uHillFall.z)) / (uHillRound.y * w)));
    under = max(under, 1.0 - smoothstep(0.45, 1.0, q));
  }
  diffuseColor.rgb = mix(diffuseColor.rgb, uLandShade.rgb, uLandShade.a * under);
}`);
      };
      landOuter.material.customProgramCacheKey = () => 'shoal-land-hills';
    }
    const _cp = new THREE.Vector3(), _cs = new THREE.Vector3(), _cm = new THREE.Matrix4();
    const playClouds = (time) => {
      for (const c of cloudList) {
        const tau = (time / c.T + c.ph) % 1, g = smoothstep(0, CLOUD_BORN, tau) * (1 - smoothstep(1 - CLOUD_BORN, 1, tau)), d = (tau - 0.5) * c.len;
        _cm.compose(_cp.set(c.x + WX * d, c.y, c.z + WZ * d), c.q, _cs.set(c.sx * g, c.sy * g, c.sz * g));
        c.m.setMatrixAt(c.i, _cm);
        if (c.shade) c.shade.setMatrixAt(c.i, _cm);
        // a hill cloud's middle (half its height up) and its lobe as it stands now, for its shadow on the land
        if (c.hill) c.hill.set(_cp.x, c.y + 0.5 * c.sy * g, _cp.z, c.sx * g);
      }
      for (const m of cloudMesh) m.instanceMatrix.needsUpdate = true;
      for (const m of cloudShade) m.instanceMatrix.needsUpdate = true;
    };
    playClouds(0);
    await ctx.yield();
    // THE STREETS' ANIMALS, all placed by the metres the lens has flown, all swimming against the line.
    // THE GREAT ONE OF THE HIGH STREET (its size and height FILE_K, FILE_Y at the head of build, with the sun) swims
    // the high street over the roadway, its lowest part ROOF_AIR over the highest chimney pots. It comes on at
    // FILE_PACE of the lens's pace and passes over the lens over the middle of the street's swing (S_SWING). Its
    // own track is the line's track at street level with the bends eased (the mean of the line's track over
    // FILE_EASE either way): it is over the street's own floor all its way, so from the street nothing of the town
    // stands before it. Nothing is strung across the high street: that street's bunting runs along its fronts.
    // THE SMALL ONES: the flight through the streets is in four stretches (the high street to the yard of the house
    // on its head; from the yard to the first corner; the second street's straight; the third street from the second
    // corner to its mouth). One small one to each stretch after the first, over the street's middle, its lowest part
    // OVER_AIR over the line's own height: it passes whole over the lens. It is at its stretch's middle when the lens
    // enters the stretch and comes on at SMALL_PACE of the lens's pace, so the two pass in the stretch's first half;
    // it comes to rest a street's half width short of the stretch's near end.
    const FILE_UP = FILE_Y - Y_STREET, FILE_PACE = 0.1, FILE_EASE = 4 * Math.round(1.5 * TURN / 4), SMALL_K = 0.36, SMALL_Y = Y_STREET + OVER_AIR + Math.max(bs.down, bs.feelerDown) * SMALL_K, SMALL_PACE = 0.35, SETTLE = 6;
    let iBend = 0; while (iBend < lineN && line[iBend * 3 + 2] > -S_SWING) iBend++;
    const mBend = iBend * 2;
    const file = [{ kind: 'file', a0: (1 + FILE_PACE) * mBend, k: FILE_K, phase: fileDice[0] }];
    const stretches = [[0, sMid], [sMid, mA0], [mA1, mB0], [mB1, mMouth]];
    const smalls = stretches.slice(1).map(([m0, m1], i) => {
      const hi = (m0 + m1) / 2;
      return { kind: 'small', b0: hi + SMALL_PACE * m0, lo: m0 + HALF + bs.halfLength * SMALL_K, hi, side: i < 2 ? 1 : -1, k: SMALL_K, phase: fileDice[1 + i] };
    });
    const _ta = new THREE.Vector3(), _tb = new THREE.Vector3(), _tm = new THREE.Vector3();
    // the line's own track at street level, by the route's metres
    const trackAt = (a, out) => {
      if (a <= 0) return out.set(line[0], Y_STREET, line[2] - a);
      if (a >= mMouth) return out.set(line[iMouth * 3], Y_STREET, line[iMouth * 3 + 2] - (a - mMouth));
      const i = Math.min(lineN - 1, Math.floor(a / 2)), f = a / 2 - i;
      return out.set(lerp(line[i * 3], line[i * 3 + 3], f), Y_STREET, lerp(line[i * 3 + 2], line[i * 3 + 5], f));
    };
    // the great one's own track: the line's track with its bends eased
    const fileAt = (a, out) => {
      let x = 0, z = 0, n = 0;
      for (let d = -FILE_EASE; d <= FILE_EASE; d += 4) { trackAt(a + d, _tm); x += _tm.x; z += _tm.z; n++; }
      return out.set(x / n, Y_STREET + FILE_UP, z / n);
    };
    // x held between lo and hi, eased over SETTLE at either end
    const settle = (x, lo, hi) => {
      const a = x - lo, b = hi - x;
      return a < SETTLE ? lo + (a <= -SETTLE ? 0 : (a + SETTLE) * (a + SETTLE) / (4 * SETTLE)) : b < SETTLE ? hi - (b <= -SETTLE ? 0 : (b + SETTLE) * (b + SETTLE) / (4 * SETTLE)) : x;
    };
    // where a street animal is when the lens has flown m metres, heading against the line
    const streetPose = (a, m, pos, quat) => {
      const at = a.kind === 'file' ? a.a0 - FILE_PACE * m : settle(a.b0 - SMALL_PACE * m, a.lo, a.hi), track = a.kind === 'file' ? fileAt : trackAt;
      track(at + 4, _ta); track(at - 4, _tb); track(at, pos);
      const dx = _tb.x - _ta.x, dz = _tb.z - _ta.z, l = Math.hypot(dx, dz) || 1;
      if (a.kind !== 'file') { pos.x += a.side * SIDE_OFF * dz / l; pos.z -= a.side * SIDE_OFF * dx / l; pos.y = SMALL_Y; }
      quat.setFromAxisAngle(YAX, Math.atan2(dx, dz));
      return at;
    };
    // ------------------------------------------------------------ THE GIRAFFES (the beasts' part): a herd loose in the town
    // THE HIGH STREET'S HERD IS A FILE ON THE STREET, BY ITS OWN MEASURES, cantering up the roadway's east lane the
    // same way as the flight (HERD_OFF east of the street's middle: between the barrows down the middle and the
    // pavement's trees, the far side from the line, the nearest to the middle at which the tallest grown one keeps
    // CLEAR of the line). At the visitor's entry its last animal stands FILE_SPAN of its own body lengths north of
    // the entry (it has just gone by), and each next animal FILE_SPAN of its own body lengths before the one behind
    // it: ONE span for both (a giraffe at a canter throws its long legs a length fore and aft and swings its neck:
    // it keeps a length and a half and more to the one before it, and a file strings out to some two and a half);
    // each number from the herd's own stream. Each canters up its lane AHEAD_PACE of a metre for every metre flown,
    // so the route's line overtakes them one after another. THE GROWN ONES are those the line has overtaken by a
    // full-grown giraffe's length and more where it leaves the street; it passes each beside it, the lane's width off.
    // AHEAD_N: the file is eight, a small herd's worth (giraffes go in loose herds of some ten to twenty: with the
    // three young that come against the line the street holds eleven, and the square six more).
    // AHEAD_PACE: at the high street's own pace (HIGH_PACE of the usual 12.9 m a second) 0.8 of a metre for every
    // metre flown is 8.8 m a second, a giraffe's steady canter (it gallops at 14 and more).
    // THE YOUNG are the rest, the file's foremost: each is low enough to pass CLEAR under the line's own height
    // (YOUNG_MOST of the full size), wherever the line may cross its way. At the street's end the file swings left
    // into the second street's west arm and canters away down it and out of the town, while the line turns right.
    // THE YOUNG THAT COME AGAINST THE LENS: YOUNG_N of them canter down the roadway's west lane toward the entry at
    // YOUNG_PACE of the lens's pace, placed by the metres flown: at the flight's first metre the first is
    // YOUNG_FIRST up the street and each other a gap from the herd's own stream behind the one before; each slows
    // to a stand in the street's tail behind the entry, one behind the other.
    // THE SQUARE'S HERD canters round the fountain on the cobbles, between the flower beds and the tables' ring, by
    // the world's clock, against the climb: one speed for the herd, each animal its own radius, size and start.
    await prepareBeasts(ctx);
    const YOUNG_N = 3, AHEAD_N = 8, ROUND_N = 6, AHEAD_PACE = 0.8, FILE_SPAN = [1.5, 2.5], YOUNG_PACE = 0.38, YOUNG_FIRST = 40, YOUNG_GAP = [22, 34];
    const HERD_SIZE = [0.84, 0.92], YOUNG_SIZE = 0.58, HERD_STAND = 7, ROUND_V = [6.2, 8.2], ROUND_ARC = 0.8, ROUND_AIR = 1.4, GROUND = 0.07, ARM_TURN = HALF + 2;
    const herd = makeGiraffes(ctx, Object.assign({ count: YOUNG_N + AHEAD_N + ROUND_N, seedKey: 'herd', castShadow: true }, light)), gb = herd.bounds;
    scene.add(herd.object);
    const herdDice = []; for (let i = 0; i < (YOUNG_N + ROUND_N) * 3 + 1; i++) herdDice.push(rHerd());
    const aheadDice = []; for (let i = 0; i < AHEAD_N * 3; i++) aheadDice.push(rAhead());
    const HERD_OFF = gb.halfWidth * HERD_SIZE[1] + Math.sqrt(Math.max(0, CLEAR * CLEAR - Math.pow(Y_STREET - gb.height * HERD_SIZE[1], 2))) + 0.2;
    const YOUNG_MOST = (Y_STREET - CLEAR - 0.1) / gb.height;
    // how far the route's line gains on the file within the street: the street's own length from the entry to the
    // first corner's first metre, less what the file makes while the line flies there
    const gain = -line[iA0 * 3 + 2] - AHEAD_PACE * mA0;
    const youngList = [], aheadList = [], roundList = [];
    for (let i = 0, up = YOUNG_FIRST; i < YOUNG_N; i++) {
      const d = (q) => herdDice[i * 3 + q];
      if (i) up += lerp(YOUNG_GAP[0], YOUNG_GAP[1], d(1));
      youngList.push({ s0: up, stop: S_BACK + 4 + i * HERD_STAND, size: lerp(YOUNG_SIZE, YOUNG_MOST, d(0)), ph: d(2) });
    }
    // the file from its last animal forward, in metres north of the entry at the visitor's entry: an animal is laid
    // as a grown one if the line then leaves it a full-grown length and more behind within the street, else as a
    // young one by its young length
    for (let i = 0, at = 0; i < AHEAD_N; i++) {
      const d = (q) => aheadDice[i * 3 + q], n = lerp(FILE_SPAN[0], FILE_SPAN[1], d(1));
      const grown = lerp(HERD_SIZE[0], HERD_SIZE[1], d(0)), size = at + n * gb.length * grown + gb.length < gain ? grown : lerp(YOUNG_SIZE, YOUNG_MOST, d(0));
      at += n * gb.length * size;
      aheadList.push({ s0: at, size, ph: d(2) });
    }
    // the free ring of cobbles: from the beds' outermost corner to the parasols' inner edge, ROUND_AIR off each
    const roundIn = Math.hypot(BEDS_R + 1, 2.8) + ROUND_AIR + gb.halfWidth, roundOut = TABLES_R - 1.6 - ROUND_AIR - gb.halfWidth;
    const roundW = lerp(ROUND_V[0], ROUND_V[1], herdDice[(YOUNG_N + ROUND_N) * 3]) * 2 / (roundIn + roundOut);
    for (let i = 0; i < ROUND_N; i++) {
      const d = (q) => herdDice[(YOUNG_N + i) * 3 + q];
      roundList.push({ R: lerp(roundIn, roundOut, d(1)), a0: TAU * ROUND_ARC * (i + 0.5 * d(2)) / ROUND_N, size: lerp(HERD_SIZE[0], 1.05, d(0)), ph: d(2) });
    }
    // the herd's own way by its metres north of the entry: up the east lane, the left turn of ARM_TURN, the west arm
    const armS = -(Z2 + ARM_TURN), armX = street.at(armS, HERD_OFF)[0], armTurn = ARM_TURN * Math.PI / 2;
    const aheadWay = (d, out) => {
      if (d <= armS) { const f = street.dirAt(d), p = street.at(d, HERD_OFF); out.x = p[0]; out.z = p[1]; out.yaw = Math.atan2(-f.tx, -f.tz); }
      else if (d <= armS + armTurn) { const a = (d - armS) / ARM_TURN; out.x = armX - ARM_TURN + ARM_TURN * Math.cos(a); out.z = Z2 + ARM_TURN - ARM_TURN * Math.sin(a); out.yaw = a; }
      else { out.x = armX - ARM_TURN - (d - armS - armTurn); out.z = Z2; out.yaw = Math.PI / 2; }
    };
    // where every giraffe is: the high street's by the metres flown, the square's by the clock
    const herdAt = (i, m, time, out) => {
      if (i < YOUNG_N) {
        const g = youngList[i], at = settle(g.s0 - YOUNG_PACE * m, g.stop, Infinity), f = street.dirAt(at), p = street.at(at, -HERD_OFF);
        out.x = p[0]; out.z = p[1]; out.yaw = Math.atan2(f.tx, f.tz); out.phase = g.ph + (g.s0 - at) / (gb.stride * g.size); out.size = g.size;
      } else if (i < YOUNG_N + AHEAD_N) {
        const g = aheadList[i - YOUNG_N], d = g.s0 + AHEAD_PACE * m;
        aheadWay(d, out); out.phase = g.ph + (d - g.s0) / (gb.stride * g.size); out.size = g.size;
      } else {
        const g = roundList[i - YOUNG_N - AHEAD_N], th = g.a0 - roundW * time;
        out.x = BX + Math.sin(th) * g.R; out.z = BZ + Math.cos(th) * g.R; out.yaw = Math.atan2(Math.cos(th), -Math.sin(th)); out.phase = g.ph + g.R * roundW * time / (gb.stride * g.size); out.size = g.size;
      }
      out.y = GROUND;
      return out;
    };
    const _g = { x: 0, y: 0, z: 0, yaw: 0, phase: 0, size: 1 }, HERD_ALL = YOUNG_N + AHEAD_N + ROUND_N;
    const poseHerd = (time, m) => {
      for (let i = 0; i < HERD_ALL; i++) { herdAt(i, m, time, _g); herd.setPose(i, _g.x, _g.y, _g.z, _g.yaw, _g.phase, _g.size); }
      herd.commit();
    };
    poseHerd(0, 0);
    await ctx.yield();
    // THE LADYBIRDS (the beasts' part), each as big as a cart: three on the clock tower's shaft, each walking a round
    // of its own on one wall (north, east, west: the walls the square and the line look at) by the world's clock,
    // the round's top BUG_AIR under the shaft's string course; its speed, its way round and its start from the
    // ladybirds' own stream.
    const BUGS = 3, BUG_SIZE = 0.75, BUG_ROUND = 1.6, BUG_V = [0.6, 1.1], BUG_AIR = 0.4, BUG_WALLS = [[0, -1], [1, 0], [-1, 0]];
    const bugs = makeLadybirds(ctx, Object.assign({ count: BUGS, seedKey: 'bugs', castShadow: true }, light)), lb = bugs.bounds;
    scene.add(bugs.object);
    const BUG_Y = TOWER_H - 2 * FACE_UP - BUG_AIR - BUG_ROUND - lb.halfWidth * BUG_SIZE;
    const bugList = BUG_WALLS.map(([nx, nz]) => ({ nx, nz, v: rBugs.range(BUG_V[0], BUG_V[1]) * (rBugs.chance(0.5) ? 1 : -1), a0: rBugs.range(0, TAU), ph: rBugs() }));
    const _bp = [0, 0, 0], _bn = [0, 0, 0], _bd = [0, 0, 0];
    const poseBugs = (time) => {
      for (let i = 0; i < BUGS; i++) {
        const g = bugList[i], a = g.a0 + g.v * time / BUG_ROUND, c = Math.cos(a) * BUG_ROUND, s = Math.sin(a) * BUG_ROUND, w = g.v < 0 ? -1 : 1;
        // the wall's own level direction is (nz, 0, -nx); the round lies in the wall's plane
        _bp[0] = TX + g.nx * TOWER_W / 2 + g.nz * c; _bp[1] = BUG_Y + s; _bp[2] = TZ + g.nz * TOWER_W / 2 - g.nx * c;
        _bn[0] = g.nx; _bn[1] = 0; _bn[2] = g.nz;
        _bd[0] = -g.nz * s * w; _bd[1] = c * w; _bd[2] = g.nx * s * w;
        bugs.setPose(i, _bp, _bn, _bd, g.ph + Math.abs(g.v) * time / (lb.stride * BUG_SIZE), BUG_SIZE);
      }
      bugs.commit();
    };
    poseBugs(0);
    await ctx.yield();
    // THE SKINS. Every animal has its own place in the plain skin. The FINE nearest to the eye, by distance over
    // size, wear the fine skin for now; their plain places are drawn at no size meanwhile. SHADE holds every animal
    // once more, in the same pose, in the lightest skin: it is drawn only into the shadow light's own pass, so every
    // animal casts its shadow and SHADE itself is never seen. (The ribbon's small ones, the last RIBBON_N of the
    // list, are not in SHADE: they cast no shadow.)
    const swimmers = wheel.concat(file, smalls, stream), animals = hov.map((h) => Object.assign(h, { kind: 'hover' })).concat(swimmers), nA = animals.length, nShade = nA - RIBBON_N;
    const far = makeShrimps(ctx, Object.assign({ count: nA, length: 46, detail: 'far', seedKey: 'far', prepared: shrimpKit, castShadow: false }, light));
    await ctx.yield();
    const shade = makeShrimps(ctx, Object.assign({ count: nShade, length: 46, detail: SHADE_SKIN, seedKey: 'far', prepared: shrimpKit }, light));
    shade.material.colorWrite = false; shade.material.depthWrite = false; shade.mesh.name = 'shrimps-shade';
    const shadeGeo = shade.mesh.geometry;
    shade.mesh.onBeforeShadow = () => { shadeGeo.instanceCount = nShade; };
    shade.mesh.onBeforeRender = () => { shadeGeo.instanceCount = 0; };
    for (let i = 0; i < nA; i++) { const a = animals[i]; a.pi = i; if (a.kind === 'hover') { far.setDrape(i, a.drape[0], a.drape[1]); if (i < nShade) shade.setDrape(i, a.drape[0], a.drape[1]); } }
    scene.add(near.object, far.object, shade.object);
    await ctx.yield();

    const _eye = new THREE.Vector3();
    const hoverPos = (h, time, out) => out.copy(h.base).addScaledVector(h.ax, h.drift * Math.sin(time * DRIFT_A + h.p1)).addScaledVector(YAX, 0.3 * h.drift * Math.sin(time * DRIFT_B + h.p2));
    // a stream animal's own way yet to swim to the ring's face when the lens has flown m metres, and where that puts it
    const streamLeft = (a, m) => STREAM_PACE * (L - m - a.enter);
    const streamPose = (a, m, pos, quat) => {
      const s = streamLeft(a, m);
      if (s <= a.tan) { pos.set(a.ax - a.hx * s, a.H, a.az - a.hz * s); quat.setFromAxisAngle(YAX, Math.atan2(a.hx, a.hz)); }
      else { const b = a.bT - (s - a.tan) / a.turn; pos.set(BX + a.R * Math.cos(b), a.H, BZ - a.hand * a.R * Math.sin(b)); quat.setFromAxisAngle(YAX, Math.atan2(-Math.sin(b), -a.hand * Math.cos(b))); }
    };
    // where an animal is and how it is set: a pure function of the world's clock (the wheel, the three that hover)
    // or of the metres the lens has flown (the streets' animals, the stream into the ring)
    const poseOf = (a, time, m, pos, quat) => {
      if (a.kind === 'hover') { hoverPos(a, time, pos); quat.copy(a.q); }
      else if (a.kind === 'file' || a.kind === 'small') streetPose(a, m, pos, quat);
      else if (a.kind === 'stream') streamPose(a, m, pos, quat);
      else { const th = a.phi + a.w * time; pos.set(a.cx - a.R * Math.cos(th), a.H, a.cz - a.R * Math.sin(th)); quat.setFromAxisAngle(YAX, (a.w < 0 ? -th : Math.PI - th) + a.yaw).multiply(a.q0); }
    };
    const d2 = new Float32Array(nA), size = new Float32Array(nA), slot = new Int8Array(nA), _pp = [], _pq = [];
    for (let i = 0; i < nA; i++) { _pp.push(new THREE.Vector3()); _pq.push(new THREE.Quaternion()); }
    // the eye only decides which of them wear the fine skin
    const poseShoal = (time, eye, m) => {
      for (let i = 0; i < nA; i++) { const a = animals[i], k = a.k || 1; poseOf(a, time, m, _pp[i], _pq[i]); size[i] = a.kind === 'stream' && streamLeft(a, m) < -a.gone ? 0 : k; d2[i] = size[i] ? _pp[i].distanceToSquared(eye) / (k * k) : Infinity; slot[i] = -1; }
      for (let n = 0; n < FINE && n < nA; n++) { let b0 = -1; for (let i = 0; i < nA; i++) if (slot[i] < 0 && (b0 < 0 || d2[i] < d2[b0])) b0 = i; slot[b0] = n; }
      for (let i = 0; i < nA; i++) {
        const a = animals[i], k = size[i], hv = a.kind === 'hover' ? 1 : 0, n = slot[i];
        if (n >= 0) { near.setPose(n, _pp[i], _pq[i], k, a.phase, hv); near.setDrape(n, hv ? a.drape[0] : 0, hv ? a.drape[1] : 0); near.setVariety(n, far.variety(i)); }
        far.setPose(i, _pp[i], _pq[i], n >= 0 ? 0 : k, a.phase, hv); if (i < nShade) shade.setPose(i, _pp[i], _pq[i], k, a.phase, hv);
      }
      near.commit(); far.commit(); shade.commit();
    };
    poseShoal(0, _eye.set(0, 6.5, 0), 0);

    // ------------------------------------------------------------ gaze: each look is at an anchor that a place of the town gives, and runs from one place of the route to another
    const um = (m) => clamp(m / L, 0, 1), _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3(), _g4 = new THREE.Vector3(), _g5 = new THREE.Vector3(), _g6 = new THREE.Vector3(), _g7 = new THREE.Vector3(), _g8 = new THREE.Vector3();
    // one rule for the looks at the wrong houses: the gaze turns half the way from the heading to the anchor, eased in
    // over the first half of its stretch and out over the second
    const look = (at, m0, m1) => ({ at, from: um(m0), to: um(m1), weight: 0.5, fade: 0.5, arc: true });
    const pois = [
      // THE HOUSE ON ITS HEAD, the east corner of its front at half its height, where the animal works: from the entry
      // to the yard's place
      look(() => _g1.set(W1.B2[0], W1.height * 0.5, W1.B2[1]), 0, sMid),
      // THE HOUSE THAT GREW, the middle of its front: from the yard's place to the end of the first corner
      look(() => _g2.set(W2.x, W2.eave * 0.5, W2.z), sMid, mA1),
      // THE SMALL HOUSE, the middle of its front: from the end of the first corner to the end of the second
      look(() => _g4.set(w3x, W3.height * 0.5, w3z), mA1, mB1),
      // THE WAY INTO THE SQUARE (the fountain's lower bowl): from the place where the line begins to come down to the
      // square, to the foot of the climb about the fountain, the gaze turns WAYIN_LOOK of the way to the fountain,
      // eased in over the first half of that stretch (the coming down: it is whole about the third street's mouth)
      // and out over the second, where the fountain's own long look below has grown to take the gaze over. So from
      // the mouth on the square's life lies before the eye and not the east row's fronts; the two looks' weights
      // together stay under one.
      { at: () => _g8.set(BX, BOWL_Y, BZ), from: um(mMouth - DIP), to: um(mRound), weight: WAYIN_LOOK, fade: 0.5, arc: true },
      // THE FOUNTAIN, its lower bowl: from the place where the line begins to come down to the square, to the climb's
      // end, the gaze turns FOUNT_LOOK of the way to it (the square lies under the eye for the whole climb), eased in
      // and out over a fifth of that stretch
      { at: () => _g5.set(BX, BOWL_Y, BZ), from: um(mMouth - DIP), to: um(mTop), weight: FOUNT_LOOK, fade: 0.2, arc: true },
      // THE CLOCK TOWER, its shaft at its face's height: from the climb's last eighth to the last way's first metre
      look(() => _g6.set(TX, tower.face, TZ), mTop - (mTop - mRound) / 8, mLeave),
      // THE RING, its middle: from the climb's end (where the line begins to come down to it) to the ring itself the
      // gaze turns the whole way to it, eased in over the way to the last way's first metre, so that the gaze is
      // whole on the ring as the line leaves the tower. WHY THERE (the look's first form was whole a place later, at
      // the west street's axis's first metre): the last way begins at the tower's west side, and the eye turns to
      // its goal as the way to it begins. The town is one plan on every seed, so this place, as every place of the
      // route, lies at one share of the flight on every seed. ITS FAR END IS THE RING ITSELF: the engine lets a look
      // go as evenly as it took it up (one share for both ends), so the letting go begins as many metres before the
      // ring as the easing in is long: a few metres (3 to 7) before the line is on the west street's axis, where
      // the heading is already within a few degrees of the ring's bearing; from the axis on the axis itself points
      // at the ring's middle. So the letting go turns the gaze very little, and on the axis nothing.
      { at: () => _g7.set(E[0], E[1], E[2]), from: um(mTop), to: 1, weight: 1, fade: (mLeave - mTop) / (L - mTop), arc: true },
    ];
    // THE PACE by the route's metres: HIGH_PACE of the usual pace down the high street (a slower look at
    // the street: the design's own choice), eased up to the
    // usual pace round the first corner; the usual pace in the second and third streets; SQ_PACE of it across the
    // square and round the climb's first quarter (eased down over the third street's last DIP metres, eased up
    // again over the climb's second quarter); from the climb's end (through the two quarter turns and down the
    // last way's turn) it eases down to RING_PACE by the place where the line comes onto the west street's axis, and holds
    // down the axis to the ring.
    const HIGH_PACE = 0.85, SQ_PACE = 0.62, RING_PACE = 0.5, climbQ = (mTop - mRound) / 4;
    const paceAt = (m) => 1 - (1 - HIGH_PACE) * (1 - smoothstep(mA0, mA1, m)) - (1 - SQ_PACE) * smoothstep(mMouth - DIP, mMouth, m) * (1 - smoothstep(mRound + climbQ, mRound + 2 * climbQ, m)) - (1 - RING_PACE) * smoothstep(mTop, mAxis, m);
    let secs = 0; for (let i = 0; i < lineN; i++) secs += Math.min(2, L - i * 2) / (PACE * paceAt(i * 2 + 1));

    if (ctx.renderer && sky.prewarm) await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: Math.round(secs), pace: (u) => paceAt(clamp(u, 0, 1) * L),
      camera: { fov: FOV, near: 0.3, far: 4200, lookAhead: 26, sway: 0.5, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: RING_R, color: RING_C, glow: 1.1, tilt: true, revealDistance: LAST },
      post: {
        exposure: 0.98, bloom: { strength: 0.22, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.06, tint: '#ffecd0', shadowTint: '#222b38', vignette: 0.22, grain: 0.012, aberration: 0 },
      },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); mats.update(dt, time);
        camera.getWorldPosition(_eye);
        poseShoal(time, _eye, clamp(u || 0, 0, 1) * L);
        playFountain(time); playClouds(time); poseHerd(time, clamp(u || 0, 0, 1) * L); herd.update(dt, time); poseBugs(time); bugs.update(dt, time);
        near.update(dt, time); far.update(dt, time); shade.update(dt, time);
      },
      dispose() {
        near.dispose(); far.dispose(); shade.dispose(); herd.dispose(); bugs.dispose(); cloudMat.dispose(); cloudShadeMat.dispose(); if (sky.dispose) sky.dispose();
        for (const t of landTex) t.dispose();
      },
      // the layout as built, for the count of clear air (scratchpad/shoal-over-the-high-street/count.mjs reads it in node)
      survey: { line, lineN, L, BX, BZ, houses, farCount, obstacles, strings: kept, stringsDropped: strings.length - kept.length, trees: treesLaid, wheel, lanes, hov, file, smalls, swimmers, animals, streetPose, poseOf, sweepOf, balls: { body: BODY_BALLS, feel: FEEL_BALLS }, air: { body: BODY_AIR, feel: FEEL_AIR }, bounds: near.bounds, W1, W2, W3, streetY, sMid, places: { sMid, mBend, mA0, mA1, mB0, mB1, mMouth, mRound, mTop, mLeave, mAxis }, herd: { n: HERD_ALL, street: YOUNG_N + AHEAD_N, at: herdAt, bounds: gb }, stream, streamPose, streamLeft, tower: { x: TX, z: TZ, top: tower.top, face: tower.face }, ring: { r: RING_R, last: LAST }, end: route.end, hoverPos, near, far, shade, OMEGA },
    };
  },
};
