// THE SHAFT AND ITS ONE STAIR: hero set piece for "town-round-one-stair" (television worlds crew; the series is named
// only in the world file's head). Every form here is our own count and plan, built from the brief's words.
// BROUGHT IN: nothing. All code in this file is written anew for this world.
//
// FRAME: metres; y is height above the shaft floor (y 0); the shaft's axis is x = 0, z = 0; +x east, +z south.
// Bearings are compass degrees from the axis (0 north = -z, 90 east = +x, 180 south, 270 west); r is distance from the axis.
// SCALE: about twice life size (a door 4 m, a house front 7.5 m wide and about 10 m high).
// SECTIONS: BELL y 0..28 (the machine hall, r 60); BORE y 28..126 (wall r 52, 24 ribs): the water ring (y 28..50, a
// canal on the ledge), the works (two ring floors at y 50 and 62, 24 arched bays each, fronts at r 39) and the home
// streets (four ring floors at y 74, 87, 100, 113: each a floor 2 m thick on corbels with a parapet at r 39, an open
// street 5.5 m wide and house fronts at r 44.5: 34, 32, 35 and 33 of them on the four streets, no two streets alike);
// BOWL y 126..166 (five farm terraces stepping back 4 m every 8 m);
// DRUM AND LID y 166..198 (sixteen raked vanes, sixteen open bays, a ribbed dome). Ground outside at y 164.
// THE ELEVEN PIERS OF THE BELL, in metres: at bearings 0, 30, 60 ... 300; none at 330, where the gallery's mouth is
// (the ledge there rides one arched beam from the pier at 300 to the pier at 0). Each pier is 4.4 m wide; its foot
// stands on the hall floor from r 53.8 to r 58; its head meets the ledge's underside (y 26.5) from r 38.9 to r 44.5.
// The flown lane passes the pier at 300 at 9.6 m, and no pier nearer than 9.4 m (counted by geometry).
// THE BRIDGES stand on the place's own helix of bridges (see bridgeBearing): open steel trusses, one to each works
// floor, to the first home street and to the market's street (the third), the canal's due north, the head bridge due west.
// LIGHT IS WRITTEN BY PLACE in the material: ONE SHADE COLOUR, the same at every height, on everything no lamp
// reaches; and NAMED LAMPS, each lighting only what stands within its reach, by distance: the hall's six furnace
// mouths and pier lamps, the quay's lamp groups, each works bay's own fire, arc or lamp, the streets' soffit and door
// lamps and the light of their lit windows, the farms' violet bars and riser lamps, the stair's landing lamps, the
// dusk through the lid's bays. No colour goes by height and no lamp's light is cut at a level: a floor stands between a
// lamp and what lies beyond it only where the floor is. A thin haze of the shade's own colour stands in the bore's air.
// Every lamp is a caged fitting on a bracket, a beam or a post. There is NO SHADOW PASS in this world (no shadow light,
// no caster, no receiver): shade is where no lamp reaches, so what is drawn once is the renderer's whole count.
// NOTHING FLASHES: a fire breathes once in 2.4 to 4.2 s by an eighth, a lamp or a window once in 6 to 11 s, each on
// its own dealt phase; sparks are small particles sized in metres.
// WHAT READS THE LENS: the air between eye and thing; a sheen; the media's turning to face the eye and their thinning
// within 0.6 to 2.5 m of it by true distance; the gold of dust seen toward the band. Nothing else.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';

export const D2R = Math.PI / 180, TAU = Math.PI * 2;
export const K = {
  BELL_R: 60, BELL_TOP: 28, BORE_R: 52, FRONT_R: 39, LEDGE_R: 35, BORE_TOP: 126, SILL_Y: 166, SILL_R: 59, GROUND: 164,
  VANE_R0: 62, VANE_R1: 74, VANE_TOP: 182, EAVE_R: 76, EAVE_TOP: 190, CROWN: 198, BOWL_R1: 40, TANGENT_R: 40,
  MAST_R: 5, TREAD_R: 13, TURN: 24, SLAB: 1.5,
  WORKS: [50, 62], HOMES: [74, 87, 100, 113], TERRACES: [126, 134, 142, 150, 158], HOUSE_R: 44.5,
  LANE_R: 30, SLOPE: Math.tan(34 * D2R), FOOT: 60, START: [-30, 9, -110],
  GALLERY_X: -30, GALLERY_Z0: -130,
  // OUTSIDE: the lids stand in rows running east and west, 220 m apart, each row 54 m west of the row south of it (the
  // place's own grid: declared here, not fitted). The lane between our row and the next row north is z = -110.
  ROW: 220, SHIFT: 54, LANE_Z: -110, SWING_R: 52, SWING_EASE: 20, RUN: 156,
  // OUR LID STANDS ON A ROUND PLINTH OF ITS OWN: a concrete apron at y 164 out to r 80 (PAD_R), a battered wall that
  // falls 32 m to the plain at r 92 (FOOT_R); the plain lies at y 132. So the lids round us stand lower than ours and
  // their tops are seen from our eave, and no slope of bare ground stands by the line.
  PAD_R: 80, FOOT_R: 92, HILL_FALL: 32, HOLD: 50,
  // LIGHT WELLS: in every lane, midway between a lid and the lid north-east of it in the next row, a small glazed lid
  // 28 m across stands over a lesser shaft (on the lane's middle line, 220 m apart)
  WELL_R: 14, WELL_UP: 5, WELL_NEAR: 340,
  // THE RING the line ends in: 7 m in radius, its foot 4 m over the plain
  RING_R: 7, RING_FOOT: 4,
};
// heights that follow from places: the plain lies HILL_FALL under the pad; the line leaves the bowl 4 m over the sill
// (0.3 m over the cisterns' tops); it ends at the ring's middle
K.PLAIN = K.GROUND - K.HILL_FALL; K.OUT_Y = K.SILL_Y + 4; K.END_Y = K.PLAIN + K.RING_FOOT + K.RING_R;
// WHERE THE BOWL'S CIRCLE MEETS THE LEAVING STRAIGHT the line un-curves over 24 m (its curvature falling evenly from
// 1 / BOWL_R1 to none), so no jolt stands there either: the circle ends 17.2 degrees of bearing before due east, and the
// straight runs due north along x = TANGENT_R (the bowl's last radius and a little: 40.6 m), the line the vanes are raked by.
const EXIT = (() => {
  const Ls = 24, R = K.BOWL_R1, thE = (Ls / 2 / R) / D2R, ds = 0.01, tab = [];
  let b = (90 + thE) * D2R, x = R * Math.sin(b), z = -R * Math.cos(b);
  for (let q = 0; q <= Ls + 1e-9; q += ds) { tab.push([x, z]); const m = q + ds / 2; b -= (1 - m / Ls) / R * ds; x -= Math.cos(b) * ds; z -= Math.sin(b) * ds; }
  return { Ls, ds, tab, thE, x1: x, z1: z };
})();
K.TANGENT_R = EXIT.x1;
// the leaving curve from the bowl's end: un-curving, then due north straight through the middle of its bay, one eased quarter
// turn to the left (curvature rising over SWING_EASE metres to 1 / SWING_R, held, falling again), then due west down
// the lane between rows. It keeps OUT_Y for HOLD metres beyond our eave (the lids round us are seen from above), then
// comes down the rise into the lane and runs its last 60 m level, 11 m over the plain, between two files of lids.
const LEAVE = (() => {
  const A = K.SWING_EASE, kMax = 1 / K.SWING_R, len = Math.PI / 2 / kMax + A, ds = 0.05, turn = [[0, 0]];
  let x = 0, z = 0, phi = 0;
  for (let q = 0; q < len - 1e-9; q += ds) { const m = q + ds / 2; phi += kMax * Math.min(1, m / A, (len - m) / A) * ds; x -= Math.sin(phi) * ds; z -= Math.cos(phi) * ds; turn.push([x, z]); }
  const T = -z, z0 = K.LANE_Z + T;
  const pre = EXIT.Ls + (EXIT.z1 - z0), eave = EXIT.Ls + EXIT.z1 + Math.sqrt(K.EAVE_R ** 2 - K.TANGENT_R ** 2);
  return { turn, ds, len, z0, pre, total: pre + len + K.RUN, endX: K.TANGENT_R + x - K.RUN, eave, hold: eave + K.HOLD };
})();
K.END = [LEAVE.endX, K.END_Y, K.LANE_Z];
// THE OPEN LAND TO THE WEST: beyond 150 m west of the line's end, within 25 degrees to either side of the lane's
// bearing, no lid and no light well stands: the lids at either hand of the line's end are the last on that bearing, and
// past them lie the wind ridges, the one bare hill and, against the sun, the dead city
export const OPEN_WEST = { FROM: 150, TAN: Math.tan(25 * D2R) };
export const openWest = (x, z) => { const dx = K.END[0] - x; return dx > OPEN_WEST.FROM && Math.abs(z - K.LANE_Z) < dx * OPEN_WEST.TAN; };
// THE SUN stands low in the west, in the gap between the cloud deck and the land's edge: its disc 3 degrees across, its
// middle 5 degrees over the level, 8 degrees to one side of the lane's own bearing (the side on which the bare hill
// lies: side is +1 south, -1 north). It is the sky's own body and stands still. ONE LIGHT RULE FOR THE WHOLE LAND: a
// face turned to the sun is warm and bright, a face turned from it cool and dark, tops catch a little of the sky; the
// sun's light is taken to fall 12 degrees steep (its glow in the air stands over its disc), and every body's shadow is
// laid on the ground at the disc's own height: a thing 9 m tall throws 103 m.
export const SUN = { EL: 5 * D2R, OFF: 8 * D2R, TAN: Math.tan(5 * D2R), R: 1.5 * D2R };
export const sunDir = (side) => [-Math.cos(SUN.OFF) * Math.cos(SUN.EL), Math.sin(SUN.EL), side * Math.sin(SUN.OFF) * Math.cos(SUN.EL)];
// THE LAND RISES TO THE WEST in one long flank, 70 m in 2.1 km, beginning 300 m west of our axis
export const FLANK_H = 70;
// THE OTHER LIDS' FORMS, for the shadows they throw (the world builds them to these): each 76 m in radius; its eave's
// height, its crown's height and its crown's radius, by kind
export const LID_R = 76, LID_FORM = [[26, 38.4, 34], [15, 24.2, 34], [24, 57, 8]];
// the way that crosses each lane by its light well runs from a lid to the lid north-east of it in the next row
export const WAY_DIR = (() => { const x = K.ROW - K.SHIFT, z = -K.ROW, l = Math.hypot(x, z); return [x / l, z / l]; })();
// THE WIND RIDGES OF THE LAND: long ridges of blown sand lying across the wind, 38 m from crest to crest (their lines
// wander and they rise and die along their length), each with a long windward back and a short steep lee, and small
// ridges 13 m apart riding on them. IN THE LANES (within 45 m of a lane's middle line) they stand 1.7 m at most; between
// the rows and on the open land up to 3 m. NONE stands against a lid, a light well, our plinth, the hill or the way
// out's seat, and none on the beds of the service ways (along each row's axis; across each lane by its light well;
// along the lane's middle to the way out). The same rule is stated here for the ground's points and in the shader for
// its light, so the two agree.
export const RIDGE = { L: 38, L2: 13, LOW: 1.5, HIGH: 2.6, LEE: 0.72, SMALL: 0.16 };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ridgeProfile = (u) => { const f = u - Math.floor(u); return f < RIDGE.LEE ? 0.5 - 0.5 * Math.cos(Math.PI * f / RIDGE.LEE) : 0.5 + 0.5 * Math.cos(Math.PI * (f - RIDGE.LEE) / (1 - RIDGE.LEE)); };
// (wd: the wind's unit direction; ph: the four phases the 'ridges' stream deals)
export function ridgeField(x, z, wd, ph) {
  const al = x * wd[0] + z * wd[1], ac = -x * wd[1] + z * wd[0];
  const u = al / RIDGE.L + 0.35 * Math.sin(ac * 0.021 + ph[0]) + 0.2 * Math.sin(ac * 0.047 + al * 0.013 + ph[1]);
  const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(ac * 0.013 + ph[2]) * Math.sin(al * 0.009 + ph[3]));
  const u2 = al / RIDGE.L2 + 0.5 * Math.sin(ac * 0.05 + ph[1] * 1.7) + 0.3 * Math.sin(ac * 0.11 + ph[0] * 2.3);
  return a * ridgeProfile(u) + RIDGE.SMALL * ridgeProfile(u2);
}
// (hill: the bare hill's place and half lengths)
export function ridgeAmp(x, z, hill) {
  const zl = z - K.LANE_Z, laneD = Math.abs(zl - K.ROW * Math.floor(zl / K.ROW + 0.5));
  let amp = RIDGE.LOW + (RIDGE.HIGH - RIDGE.LOW) * sstep(45, 75, laneD);
  const n = Math.floor(-z / K.ROW + 0.5), i = Math.floor((x + K.SHIFT * n) / K.ROW + 0.5), lx = K.ROW * i - K.SHIFT * n, lz = -K.ROW * n;
  if (!openWest(lx, lz)) amp *= sstep(LID_R + 2, LID_R + 26, Math.hypot(x - lx, z - lz)) * sstep(5, 16, 0.5 * K.ROW - laneD);
  const wn = Math.floor((-z - 0.5 * K.ROW) / K.ROW + 0.5), wi = Math.floor((x + K.SHIFT * wn - 0.5 * (K.ROW - K.SHIFT)) / K.ROW + 0.5), wx = K.ROW * wi - K.SHIFT * wn + 0.5 * (K.ROW - K.SHIFT), wz = -K.ROW * wn - 0.5 * K.ROW;
  if (!openWest(wx, wz)) amp *= sstep(K.WELL_R + 2, K.WELL_R + 20, Math.hypot(x - wx, z - wz)) * sstep(5, 16, Math.abs((x - wx) * WAY_DIR[1] - (z - wz) * WAY_DIR[0]));
  amp *= sstep(K.FOOT_R + 2, K.FOOT_R + 30, Math.hypot(x, z)) * sstep(20, 34, Math.hypot(x - K.END[0], z - K.LANE_Z));
  amp *= 1 - (1 - sstep(5, 16, Math.abs(z - K.LANE_Z))) * sstep(K.END[0] - 30, K.END[0] - 20, x) * (1 - sstep(K.END[0] + 62, K.END[0] + 72, x));
  amp *= sstep(0.9, 1.3, Math.max(Math.abs(x - hill.x) / hill.hx, Math.abs(z - hill.z) / hill.hz));
  return amp;
}
// a point of the leaving curve at d metres from the bowl's end: [x, y, z]
export function leaveAt(d) {
  let x, z;
  if (d <= EXIT.Ls) { const f = Math.max(0, d) / EXIT.ds, i = Math.min(EXIT.tab.length - 2, Math.floor(f)), a = EXIT.tab[i], b = EXIT.tab[i + 1]; x = lerp(a[0], b[0], f - i); z = lerp(a[1], b[1], f - i); }
  else if (d <= LEAVE.pre) { x = K.TANGENT_R; z = EXIT.z1 - (d - EXIT.Ls); }
  else if (d < LEAVE.pre + LEAVE.len) { const f = (d - LEAVE.pre) / LEAVE.ds, i = Math.min(LEAVE.turn.length - 2, Math.floor(f)), a = LEAVE.turn[i], b = LEAVE.turn[i + 1]; x = K.TANGENT_R + lerp(a[0], b[0], f - i); z = LEAVE.z0 + lerp(a[1], b[1], f - i); }
  else { x = K.END[0] + (LEAVE.total - d); z = K.LANE_Z; }
  const t = clamp((d - LEAVE.hold) / (LEAVE.total - 60 - LEAVE.hold), 0, 1);
  return [x, K.OUT_Y - (K.OUT_Y - K.END_Y) * t * t * (3 - 2 * t), z];
}
export const LEAVE_LEN = LEAVE.total;
// a point at bearing b (degrees) and radius r
export const bx = (b, r) => r * Math.sin(b * D2R), bz = (b, r) => -r * Math.cos(b * D2R);
export const bearingOf = (x, z) => { const b = Math.atan2(x, -z) / D2R; return b < 0 ? b + 360 : b; };
// the terrace lip's radius at a height of the bowl (a ramp between the lips, for a look that slides)
export const lipR = (y) => K.FRONT_R + 4 * clamp((y - K.BORE_TOP) / 8, 0, 5);

// ---------------------------------------------------------------- the flown lane, by the turn th (degrees) since the helix's start
// th 0 at (-30, 9, 0), bearing 270; the bearing falls as th rises (anticlockwise seen from above). Returns [x, y, z, r].
const TH_FOOT = (K.FOOT / K.LANE_R) / D2R;
const Y_FOOT = K.START[1] + K.FOOT * K.SLOPE * 0.5;
const TH_BORE = TH_FOOT + (K.BORE_TOP - Y_FOOT) / (K.LANE_R * K.SLOPE * D2R);
const TH_END = 540 - EXIT.thE;
const bowlR = (th) => { const f = clamp((th - TH_BORE) / (TH_END - TH_BORE), 0, 1); return K.LANE_R + (K.BOWL_R1 - K.LANE_R) * f * f * (3 - 2 * f); };
// the bowl's height: 34 degrees held, then eased level; the ease's start is found so that the lane is level at OUT_Y where it leaves
function bowlTable() {
  const N = 600, rise = (thE) => {
    const ys = [K.BORE_TOP]; let y = K.BORE_TOP;
    for (let i = 0; i < N; i++) {
      const a = TH_BORE + (TH_END - TH_BORE) * i / N, b = TH_BORE + (TH_END - TH_BORE) * (i + 1) / N, m = (a + b) / 2;
      const dr = bowlR(b) - bowlR(a), ds = Math.hypot(bowlR(m) * (b - a) * D2R, dr);
      const e = clamp((m - thE) / (TH_END - thE), 0, 1);
      y += ds * K.SLOPE * (1 - e * e * (3 - 2 * e)); ys.push(y);
    }
    return ys;
  };
  let lo = TH_BORE, hi = TH_END - 5;
  for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (rise(mid)[N] > K.OUT_Y) hi = mid; else lo = mid; }
  return { ys: rise((lo + hi) / 2), N, thE: (lo + hi) / 2 };
}
const BOWL = bowlTable();
// WHERE THE GALLERY'S STRAIGHT MEETS THE CIRCLE the line swings in over JOIN metres (its curvature rising evenly from
// none to 1 / LANE_R), so no jolt stands at the join; for that the straight drifts JOIN^2 / (24 LANE_R) = 0.56 m west of
// the gallery's axis over its 100 m, and the circle keeps its radius about the shaft's axis.
const JOIN = (() => {
  const Ls = 20, R = K.LANE_R, ds = 0.01, tab = []; let x = 0, z = 0, phi = 0;
  for (let q = 0; q <= Ls + 1e-9; q += ds) { tab.push([x, z]); const m = q + ds / 2; phi += (m / Ls) / R * ds; x += Math.sin(phi) * ds; z += Math.cos(phi) * ds; }
  const cx = x + R * Math.cos(phi), cz = z - R * Math.sin(phi);
  return { Ls, ds, tab, cx, cz, th: (Ls / 2 / R) / D2R, x0: -cx, drift: -cx + R };
})();
export function laneAt(th) {
  if (th < JOIN.th) { const q = th * D2R * K.LANE_R + JOIN.Ls / 2, t = JOIN.tab[clamp(Math.round(q / JOIN.ds), 0, JOIN.tab.length - 1)];
    const u = Math.max(0, th) / TH_FOOT; return [t[0] - JOIN.cx, K.START[1] + K.FOOT * K.SLOPE * (u * u * u - 0.5 * u * u * u * u), t[1] - JOIN.cz, K.LANE_R]; }
  let r = K.LANE_R, y;
  if (th <= TH_FOOT) { const t = Math.max(0, th) / TH_FOOT; y = K.START[1] + K.FOOT * K.SLOPE * (t * t * t - 0.5 * t * t * t * t); }
  else if (th <= TH_BORE) y = Y_FOOT + (th - TH_FOOT) * D2R * K.LANE_R * K.SLOPE;
  else { const f = clamp((th - TH_BORE) / (TH_END - TH_BORE), 0, 1) * BOWL.N, i = Math.min(BOWL.N - 1, Math.floor(f)); y = lerp(BOWL.ys[i], BOWL.ys[i + 1], f - i); r = bowlR(th); }
  const b = 270 - th;
  return [bx(b, r), y, bz(b, r), r];
}
// the turn at which the lane on the bore's helix stands at height y (the lane rule the bridges stand by)
export const laneTurnAtY = (y) => TH_FOOT + (y - Y_FOOT) / (K.LANE_R * K.SLOPE * D2R);
export const LANE = { TH_FOOT, TH_BORE, TH_END, Y_FOOT, TH_EASE: BOWL.thE };

// the route's knots, about every 4.7 m all the way (a close, even spacing keeps the curve's turning even); and the
// route's named places as places among the knots (a knot's own number, with the part of the way to the next)
export function routeKnots() {
  // (THE LINE BEGINS in the engine gallery under its second crown lamp, 20 m from the north end wall: three pairs of
  // generator niches and the gallery's mouth lie ahead of it)
  const pts = [], zJ = -JOIN.Ls / 2, nG = Math.round((zJ - K.START[2]) / 4.7);
  for (let k = 0; k < nG; k++) pts.push([K.START[0] + (JOIN.x0 - K.START[0]) * k / nG, K.START[1], K.START[2] + (zJ - K.START[2]) * k / nG]);
  // the join, the helix and the bowl: knots at even metres of the lane itself, its first and last points exact
  const th0 = -JOIN.th, fine = [[th0, 0]]; let acc = 0, prev = laneAt(th0);
  const NF = Math.round((TH_END - th0) / 0.1);
  for (let i = 1; i <= NF; i++) { const th = th0 + (TH_END - th0) * i / NF, p = laneAt(th); acc += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]); fine.push([th, acc]); prev = p; }
  const n = Math.round(acc / 4.7); let j = 0;
  for (let k = 0; k < n; k++) {
    const want = acc * k / n; while (fine[j + 1][1] < want) j++;
    pts.push(laneAt(fine[j][0] + (fine[j + 1][0] - fine[j][0]) * (want - fine[j][1]) / Math.max(1e-9, fine[j + 1][1] - fine[j][1])).slice(0, 3));
  }
  const nl = Math.round(LEAVE.total / 4.7);
  for (let k = 0; k <= nl; k++) pts.push(leaveAt(LEAVE.total * k / nl));
  // a turn of the lane and a metre of the leaving line, as places among the knots
  const atTurn = (th) => { const f = (th - th0) / (TH_END - th0) * NF, i = Math.min(NF - 1, Math.floor(f)); return nG + lerp(fine[i][1], fine[i + 1][1], f - i) / acc * n; };
  const atLeave = (d) => nG + n + d / LEAVE.total * nl;
  const marks = { helix: atTurn(0), foot: atTurn(TH_FOOT), bowl: atTurn(TH_BORE), letGo: atTurn(TH_END - 55), leave: atTurn(TH_END), eave: atLeave(LEAVE.eave), hold: atLeave(LEAVE.hold) };
  return { pts, marks };
}
// the route with its places in metres: where the helix begins, where the foot's ease ends, where the bowl begins, where
// the look lets go (the bowl's last 55 degrees of bearing) and where the line leaves the bowl
export function makeRoute(knots = routeKnots()) {
  const { pts, marks } = knots, path = makePath(pts), L = path.length;
  // a named place's metre of route, read from the curve's own table of arc lengths (the knots stand at even parts of it)
  const tab = path.curve.getLengths(), div = tab.length - 1, m = { end: L };
  for (const k in marks) { const f = marks[k] / (pts.length - 1) * div, i = Math.min(div - 1, Math.floor(f)); m[k] = lerp(tab[i], tab[i + 1], f - i); }
  return { path, pts, m };
}

// ---------------------------------------------------------------- merged-mesh builder
// vertex: position, normal, colour (linear albedo or lamp colour), aux = [glow, kind, sway, phase]
// kind 0 concrete (board marks, stains), 1 painted steel and plain things, 2 leaf and cloth (lit from both sides), 3 water sheet
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const NOAUX = [0, 0, 0, 0];
export class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; this.a = []; this.i = []; this.m = null; }
  // an optional transform (Matrix4) applied to every point and normal that follows
  setMatrix(m) { this.m = m; }
  vert(x, y, z, nx, ny, nz, col, aux) {
    if (this.m) { const e = this.m.elements; const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz; x = X; y = Y; z = Z; nx = NX; ny = NY; nz = NZ; }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.a.push(aux[0], aux[1], aux[2], aux[3]);
    return this.p.length / 3 - 1;
  }
  // a flat quad a, b, c, d (counter-clockwise seen from its front); cols may be one colour or four
  quad(a, b, c, d, col, aux = NOAUX, cols = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, cols ? cols[0] : col, aux), i1 = this.vert(b[0], b[1], b[2], nx, ny, nz, cols ? cols[1] : col, aux);
    const i2 = this.vert(c[0], c[1], c[2], nx, ny, nz, cols ? cols[2] : col, aux), i3 = this.vert(d[0], d[1], d[2], nx, ny, nz, cols ? cols[3] : col, aux);
    this.i.push(i0, i1, i2, i0, i2, i3);
  }
  tri(a, b, c, col, aux = NOAUX) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, col, aux), i1 = this.vert(b[0], b[1], b[2], nx, ny, nz, col, aux), i2 = this.vert(c[0], c[1], c[2], nx, ny, nz, col, aux);
    this.i.push(i0, i1, i2);
  }
  // a box of half sizes hx, hy, hz about (cx, cy, cz), turned by yaw about the vertical
  box(cx, cy, cz, hx, hy, hz, yaw, col, aux = NOAUX) {
    const c = Math.cos(yaw), s = Math.sin(yaw), P = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    this.quad(v[1], v[0], v[3], v[2], col, aux); this.quad(v[4], v[5], v[6], v[7], col, aux);
    this.quad(v[0], v[4], v[7], v[3], col, aux); this.quad(v[5], v[1], v[2], v[6], col, aux);
    this.quad(v[3], v[7], v[6], v[2], col, aux); this.quad(v[0], v[1], v[5], v[4], col, aux);
  }
  // a block between bearings b0 < b1 (degrees), radii r0 < r1 and heights y0 < y1, in segs straight pieces; faces by letters:
  // t top, u underside, i inner (faces the axis), o outer, e ends
  sector(b0, b1, r0, r1, y0, y1, col, aux = NOAUX, segs = 1, faces = 'tuioe') {
    for (let k = 0; k < segs; k++) {
      const a = b0 + (b1 - b0) * k / segs, b = b0 + (b1 - b0) * (k + 1) / segs;
      const A0 = [bx(a, r0), bz(a, r0)], A1 = [bx(a, r1), bz(a, r1)], B0 = [bx(b, r0), bz(b, r0)], B1 = [bx(b, r1), bz(b, r1)];
      if (faces.includes('t')) this.quad([A0[0], y1, A0[1]], [B0[0], y1, B0[1]], [B1[0], y1, B1[1]], [A1[0], y1, A1[1]], col, aux);
      if (faces.includes('u')) this.quad([A0[0], y0, A0[1]], [A1[0], y0, A1[1]], [B1[0], y0, B1[1]], [B0[0], y0, B0[1]], col, aux);
      if (faces.includes('i')) this.quad([A0[0], y0, A0[1]], [B0[0], y0, B0[1]], [B0[0], y1, B0[1]], [A0[0], y1, A0[1]], col, aux);
      if (faces.includes('o')) this.quad([A1[0], y0, A1[1]], [A1[0], y1, A1[1]], [B1[0], y1, B1[1]], [B1[0], y0, B1[1]], col, aux);
      if (faces.includes('e') && k === 0) this.quad([A0[0], y0, A0[1]], [A0[0], y1, A0[1]], [A1[0], y1, A1[1]], [A1[0], y0, A1[1]], col, aux);
      if (faces.includes('e') && k === segs - 1) this.quad([B0[0], y0, B0[1]], [B1[0], y0, B1[1]], [B1[0], y1, B1[1]], [B0[0], y1, B0[1]], col, aux);
    }
  }
  // an upright cylinder (or cone: r1 at the top) with caps; sides flat-shaded when few
  cyl(cx, y0, cz, r0, y1, r1, sides, col, aux = NOAUX, caps = 'tb') {
    for (let k = 0; k < sides; k++) {
      const a = k / sides * TAU, b = (k + 1) / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      this.quad([cx + ca * r0, y0, cz + sa * r0], [cx + ca * r1, y1, cz + sa * r1], [cx + cb * r1, y1, cz + sb * r1], [cx + cb * r0, y0, cz + sb * r0], col, aux);
      if (caps.includes('t') && r1 > 0) this.tri([cx, y1, cz], [cx + cb * r1, y1, cz + sb * r1], [cx + ca * r1, y1, cz + sa * r1], col, aux);
      if (caps.includes('b') && r0 > 0) this.tri([cx, y0, cz], [cx + ca * r0, y0, cz + sa * r0], [cx + cb * r0, y0, cz + sb * r0], col, aux);
    }
  }
  get triangles() { return this.i.length / 3; }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute('aux', new THREE.BufferAttribute(new Float32Array(this.a), 4));
    g.setIndex(new THREE.BufferAttribute(this.p.length / 3 > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    // (nothing here is culled by its bounds: every mesh of this world is always drawn, so no pass over the points is spent on them)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 100, 0), 1e5);
    return g;
  }
}

// ---------------------------------------------------------------- the light, written by place
// Every lamp term below reads only where the surface stands (its height band, its radius, its bearing): each storey's
// colour of lamp, the lamps under each soffit, the furnaces, the water, the racks, the dusk in the bays. uEye is read
// for the air between eye and thing and for a sheen, as light does.
const gl3 = (hex, k = 1) => { const c = lin(hex); return `vec3(${(c[0] * k).toFixed(4)},${(c[1] * k).toFixed(4)},${(c[2] * k).toFixed(4)})`; };
export const MOUTH_B = 330, STAIR_B0 = MOUTH_B, MARKET_Y = K.HOMES[2];
export const ST = { FLAT: 9, W: 3.2, CUT_W: 1, JUT: 16.4, COLLAR: 15.2, MARKET: 19, LAMP_R: 12.4, LAMP_UP: 3.3 };
const C30 = Math.cos(30 * D2R);
ST.S = (ST.FLAT / 2 - ST.CUT_W) / C30;        // a flight's half run along its flat (4.04 m)
ST.CUT = ST.FLAT * C30 + ST.S / 2;            // the corner face's distance from the axis (9.82 m)
ST.OUT = ST.FLAT + ST.W;                      // the flights' outer edge, from the axis (12.2 m)
export const SERVED_Y = [K.BELL_TOP, K.WORKS[0], K.WORKS[1], K.HOMES[0], MARKET_Y, K.SILL_Y];
export const STAIR_SPANS = SERVED_Y.map((top, i) => ({ y0: i ? SERVED_Y[i - 1] : 0, top, n: Math.ceil((top - (i ? SERVED_Y[i - 1] : 0)) / 4) }));
export const STAIR_Y = (() => { const Y = [0]; for (const s of STAIR_SPANS) for (let q = 1; q <= s.n; q++) Y.push(s.y0 + (s.top - s.y0) * q / s.n); return Y; })();
// THE HOME STREETS' COUNTS: the four streets hold unequal numbers of fronts (34, 32, 35 and 33 from the lowest up, 134
// in all), each street's fronts at an even pitch round it; so the gaps between two fronts (narrow alleys through to the
// bore's wall) differ from street to street.
// the three water wheels' bearings round the canal, and the lock's two gates
export const WHEEL_B = [70, 150, 235], GATE_B = [312, 324];
// THE CANAL'S REACHES: the water between one wheel (which stands 9 degrees to each side of its bearing, and 2 more are
// kept) and the next wheel or lock gate (3 degrees kept). One barge to a berth; a reach of more than 60 degrees of
// water is parted in two berths with 2 degrees between them, a shorter reach is one berth: seven berths in all.
export const BERTHS = (() => { const stops = [...WHEEL_B.map((b) => [b - 11, b + 11]), [GATE_B[0] - 3, GATE_B[1] + 3]].sort((a, b) => a[0] - b[0]), out = [];
  stops.forEach((st, i) => { const a = st[1], b = stops[(i + 1) % stops.length][0] + (i === stops.length - 1 ? 360 : 0), two = b - a > 60;
    if (two) { out.push([a, (a + b) / 2 - 1]); out.push([(a + b) / 2 + 1, b]); } else out.push([a, b]); });
  return out; })();
export const HOUSE_N = [34, 32, 35, 33], HOUSE_BASE = HOUSE_N.map((n, i) => HOUSE_N.slice(0, i).reduce((a, b) => a + b, 0)), HOUSE_ALL = HOUSE_N.reduce((a, b) => a + b, 0);
// the landings' heights for the light: a landing's height by its number, and the number by a height
const GL_STAIR = `const float STAIR_B = ${STAIR_B0.toFixed(1)}, STAIR_R = ${ST.LAMP_R.toFixed(2)}, STAIR_UP = ${ST.LAMP_UP.toFixed(2)}, STAIR_N = ${(STAIR_Y.length - 1).toFixed(1)};
float stairY(float j){ return ${(() => { let j0 = 0; return STAIR_SPANS.map((q) => { const t = `clamp(j - ${j0.toFixed(1)}, 0., ${q.n.toFixed(1)}) * ${((q.top - q.y0) / q.n).toFixed(5)}`; j0 += q.n; return t; }).join(' + '); })()}; }
float stairJ(float y){ return ${STAIR_SPANS.map((q) => `clamp((y - ${q.y0.toFixed(1)}) / ${((q.top - q.y0) / q.n).toFixed(5)}, 0., ${q.n.toFixed(1)})`).join(' + ')}; }`;
export const FLOOR_Y = [0, K.BELL_TOP, ...K.WORKS, ...K.HOMES, ...K.TERRACES, K.SILL_Y, K.VANE_TOP];
export const GL_PLACE = /* glsl */`
// how far a height stands over the floor next below it (x) and under the floor next above it (y)
vec2 footHang(float y){ vec2 fh = vec2(99.); float d;
${FLOOR_Y.map((f) => `  d = y - ${f.toFixed(1)}; if (d > -0.05) fh.x = min(fh.x, d); else fh.y = min(fh.y, -d);`).join('\n')}
  return fh; }
uniform float uTime, uRain, uVane; uniform vec2 uStain; uniform vec3 uEye, uBand, uRing, uRingCol, uWind, uSun; uniform vec4 uLand, uRidge, uHill, uTree, uTower[20]; uniform vec4 uFurn[6]; uniform vec4 uQuay[6]; uniform vec4 uBay[12]; uniform vec4 uLit[${Math.ceil(HOUSE_ALL / 4)}]; uniform vec4 uDoor[${Math.ceil(HOUSE_ALL / 4)}];
const vec3 WHEEL_B = vec3(${WHEEL_B.map((b) => b.toFixed(1)).join(', ')});
const float D2R = 0.017453293, SILL_Y = ${K.SILL_Y.toFixed(1)}, RISE_R0 = ${K.PAD_R.toFixed(1)}, ROW = ${K.ROW.toFixed(1)}, SHIFT = ${K.SHIFT.toFixed(1)}, WELL_R = ${K.WELL_R.toFixed(1)}, WELL_NEAR = ${K.WELL_NEAR.toFixed(1)};
// the place's own grid: the nearest lid's middle to a point of the land, and the nearest light well's
vec2 lidAt(vec2 q){ float n = floor(-q.y / ROW + 0.5), i = floor((q.x + SHIFT * n) / ROW + 0.5); return vec2(ROW * i - SHIFT * n, -ROW * n); }
vec2 wellAt(vec2 q){ float n = floor((-q.y - 0.5 * ROW) / ROW + 0.5), i = floor((q.x + SHIFT * n - 0.5 * (ROW - SHIFT)) / ROW + 0.5); return vec2(ROW * i - SHIFT * n + 0.5 * (ROW - SHIFT), -ROW * n - 0.5 * ROW); }
// (the open land to the west of the line's end, where no lid stands)
bool openWest(vec2 c){ float dx = ${K.END[0].toFixed(2)} - c.x; return dx > ${OPEN_WEST.FROM.toFixed(1)} && abs(c.y - (${K.LANE_Z.toFixed(1)})) < dx * ${OPEN_WEST.TAN.toFixed(5)}; }
// THE LAND'S OWN RULES, as the world states them for its points: the flank the land rises in to the west; the wind
// ridges; the kind of lid at a place of the grid (uLand: the swells' two phases, the flank's, the deal of kinds)
const float PLAIN = ${K.PLAIN.toFixed(1)}, TAN_SUN = ${SUN.TAN.toFixed(5)}, LID_R = ${LID_R.toFixed(1)}, FOOT_R = ${K.FOOT_R.toFixed(1)}, LANE_Z = ${K.LANE_Z.toFixed(1)}, END_X = ${K.END[0].toFixed(2)};
float flankY(vec2 q){ float t = clamp((-300. + 70. * sin(q.y * 0.0009 + uLand.z) - q.x) / 2100., 0., 1.); return ${FLANK_H.toFixed(1)} * t * t * (3. - 2. * t); }
float ridgeProfile(float u){ float f = fract(u); return f < ${RIDGE.LEE.toFixed(2)} ? 0.5 - 0.5 * cos(3.14159265 * f / ${RIDGE.LEE.toFixed(2)}) : 0.5 + 0.5 * cos(3.14159265 * (f - ${RIDGE.LEE.toFixed(2)}) / ${(1 - RIDGE.LEE).toFixed(2)}); }
float ridgeField(vec2 q, vec2 wd){
  float al = dot(q, wd), ac = dot(q, vec2(-wd.y, wd.x));
  float u = al / ${RIDGE.L.toFixed(1)} + 0.35 * sin(ac * 0.021 + uRidge.x) + 0.2 * sin(ac * 0.047 + al * 0.013 + uRidge.y);
  float a = 0.45 + 0.55 * (0.5 + 0.5 * sin(ac * 0.013 + uRidge.z) * sin(al * 0.009 + uRidge.w));
  float u2 = al / ${RIDGE.L2.toFixed(1)} + 0.5 * sin(ac * 0.05 + uRidge.y * 1.7) + 0.3 * sin(ac * 0.11 + uRidge.x * 2.3);
  return a * ridgeProfile(u) + ${RIDGE.SMALL.toFixed(2)} * ridgeProfile(u2); }
float ridgeAmp(vec2 q){
  float zl = q.y - LANE_Z, laneD = abs(zl - ROW * floor(zl / ROW + 0.5));
  float amp = mix(${RIDGE.LOW.toFixed(2)}, ${RIDGE.HIGH.toFixed(2)}, smoothstep(45., 75., laneD));
  vec2 lm = lidAt(q); if (!openWest(lm)) amp *= smoothstep(LID_R + 2., LID_R + 26., length(q - lm)) * smoothstep(5., 16., 0.5 * ROW - laneD);
  vec2 wc = wellAt(q), wv = q - wc; if (!openWest(wc)) amp *= smoothstep(WELL_R + 2., WELL_R + 20., length(wv)) * smoothstep(5., 16., abs(wv.x * ${WAY_DIR[1].toFixed(5)} - wv.y * ${WAY_DIR[0].toFixed(5)}));
  amp *= smoothstep(FOOT_R + 2., FOOT_R + 30., length(q)) * smoothstep(20., 34., length(q - vec2(END_X, LANE_Z)));
  amp *= 1. - (1. - smoothstep(5., 16., abs(q.y - LANE_Z))) * smoothstep(END_X - 30., END_X - 20., q.x) * (1. - smoothstep(END_X + 62., END_X + 72., q.x));
  amp *= smoothstep(0.9, 1.3, max(abs(q.x - uHill.x) / uHill.z, abs(q.y - uHill.y) / uHill.w));
  return amp; }
float lidKind(vec2 c){ float n = floor(-c.y / ROW + 0.5), i = floor((c.x + SHIFT * n) / ROW + 0.5), m = mod(i + n, 3.); return m < 0.5 ? 0. : ((m < 1.5) == (uLand.w > 0.5) ? 2. : 1.); }
// EVERY BODY THROWS A LONG SHADOW STRAIGHT AWAY FROM THE SUN, laid on the ground by rule from its place and height. A
// round body (radius R up to the height H0, narrowing to Rt at its top H1) darkens a strip as wide as itself and
// H1 / TAN_SUN long; the strip's edge is the softer the farther it falls (the sun is 3 degrees across), and a thin
// body's shadow fades out where that softness passes its width. d: from the body's foot to the place; aw: the unit way
// from the sun. 1 in full shadow.
float bodyShade(vec2 d, float R, float Rt, float H0, float H1, vec2 aw){
  float L = H1 / TAN_SUN, s = clamp(dot(d, aw), 0., L), rr = mix(R, Rt, smoothstep(H0 / H1, 1., s / L)), soft = 0.6 + 0.03 * s;
  return (1. - smoothstep(-soft, soft, length(d - aw * s) - rr)) * min(1., rr / (0.6 * soft)); }
// the shadows of the lids (three along the sun's way; ours with its plinth), the light wells, the bare hill and its
// tree, the way out's seat and the dead city's towers at a place of the land (self: a body standing within that many
// metres of a lid's or a well's wall takes no shadow from it)
float landShade(vec2 q, float self){
  vec2 aw = -normalize(uSun.xz); float sh = 0., fq = flankY(q);
  for (int k = 0; k < 3; k++) { vec2 c = lidAt(q - aw * (float(k) * ROW)), d = q - c; if (openWest(c) || length(d) < self * (LID_R + 8.)) continue;
    if (dot(c, c) < 1.) sh = max(sh, bodyShade(d, 86., 30., ${(K.EAVE_TOP - K.PLAIN).toFixed(1)}, ${(K.CROWN - K.PLAIN).toFixed(1)}, aw));
    else { float kd = lidKind(c); vec3 f = kd < 0.5 ? vec3(${LID_FORM[0].map((v) => v.toFixed(1)).join(', ')}) : kd < 1.5 ? vec3(${LID_FORM[1].map((v) => v.toFixed(1)).join(', ')}) : vec3(${LID_FORM[2].map((v) => v.toFixed(1)).join(', ')}); sh = max(sh, bodyShade(d, LID_R, f.z, f.x, f.y, aw)); } }
  for (int k = 0; k < 2; k++) { vec2 c = wellAt(q - aw * (float(k) * 60.)), d = q - c; if (openWest(c) || length(d) < self * (WELL_R + 4.) || length(c) > 700.) continue; sh = max(sh, bodyShade(d, WELL_R, 4., 2.4, ${(K.WELL_UP + 1).toFixed(1)}, aw)); }
  sh = max(sh, bodyShade(q - uHill.xy, 0.62 * uHill.w, 2., 0.3 * uTree.w, uTree.w, aw));
  sh = max(sh, bodyShade(q - uTree.xy, 0.9, 3.2, 0.45 * uTree.z, uTree.z, aw));
  sh = max(sh, bodyShade(q - vec2(END_X, LANE_Z), 10.5, 9., 3.9, 7.2, aw));
  // the raised ways across the lanes (a lid, the light well, the lid beyond): each leg's low shadow lies beside it,
  // 12.6 m long (the ground takes it; the ways themselves and what stands by them do not)
  if (self < 0.5) { vec2 wc = wellAt(q), wv = q - wc, WD = vec2(${WAY_DIR[0].toFixed(5)}, ${WAY_DIR[1].toFixed(5)}); float al = dot(wv, WD), ac = wv.x * WD.y - wv.y * WD.x, re = 12.6 * (aw.x * WD.y - aw.y * WD.x);
    vec2 lc = wc + WD * (137.8 * sign(al));
    if (!openWest(wc) && length(wc) <= 700. && !openWest(lc) && length(lc) < 620. && abs(al) > 14.5 && abs(al) < (dot(lc, lc) < 1. ? 44.3 : 60.2))
      sh = max(sh, 0.85 * (1. - smoothstep(-0.3, 0.6, max(min(re, 0.) - 1.6 - ac, ac - 1.6 - max(re, 0.))))); }
  if (q.x < 80.) for (int i = 0; i < 20; i++) { vec4 t = uTower[i]; vec2 d = q - t.xy; float s = dot(d, aw); if (t.w < 1. || s < 0.) continue;
    float L = (t.w + flankY(t.xy) - fq) / TAN_SUN, soft = 0.6 + 0.03 * s;
    sh = max(sh, 0.8 * (1. - smoothstep(-soft, soft, abs(d.x * aw.y - d.y * aw.x) - t.z)) * min(1., t.z / (0.6 * soft)) * (1. - smoothstep(0.75 * L, L, s))); }
  return sh; }
const vec3 LAMP = vec3(1.0, 0.78, 0.50), HEAT = vec3(1.0, 0.46, 0.14), VIOLET = vec3(0.62, 0.20, 1.0), DUSK = vec3(0.50, 0.58, 0.80);
const vec3 ARC = vec3(0.74, 0.86, 1.0), WINDOW = vec3(1.0, 0.80, 0.52), LAMP_SUN = vec3(1.0, 0.50, 0.17);
float rOf(vec3 p){ return length(p.xz); }
// 1 inside the shaft and its lid, 0 on the land: mixed across the vanes' depth (r 62 to 76); the buried hall and its gallery are inside
float insideAt(vec3 p){ return max(1. - smoothstep(62., 76., rOf(p)), 1. - smoothstep(60., 100., p.y)); }
vec3 polar(float bDeg, float r, float y){ float b = bDeg * D2R; return vec3(r * sin(b), y, -r * cos(b)); }
// ONE NAMED LAMP at q seen from p. Concrete takes colour from lamps only, by distance: its full light within about a
// fifth of its reach R (4 m of 20), falling fast beyond, gone at R. wrap: how much reaches a face turned away.
float lampAt(vec3 p, vec3 n, vec3 q, float R, float wrap){
  vec3 L = q - p; float d2 = dot(L, L), d = sqrt(d2), a = clamp(1. - d2 / (R * R), 0., 1.), h = 0.275 * R;
  return (wrap + (1. - wrap) * max(dot(n, L / (d + 0.01)), 0.)) * a * a / (1. + d2 * d / (h * h * h));
}
float lampAt(vec3 p, vec3 n, vec3 q, float R){ return lampAt(p, n, q, R, 0.3); }
// the nearest bearing of a lattice of lamps: one every st degrees, counted on from the first
float nearB(float bd, float first, float st){ return first + st * floor((bd - first) / st + 0.5); }
// THE SHADE: concrete with no lamp near shows this ONE colour, the same at every height (never black, never by storey).
// It is what the eye keeps of the town's glow; it follows nothing. A darker paint keeps a little of its own hue in it.
const vec3 SHADE = vec3(0.082, 0.094, 0.130);
// OUTSIDE the shade is the dusk's own: what stands turned from the band and from the sky, and what stands behind a
// lid's bays, shows this deep slate and never black
const vec3 SHADE_OUT = vec3(0.046, 0.050, 0.066);
vec3 shadeOf(vec3 alb){ float l = dot(alb, vec3(0.3, 0.5, 0.2)); return SHADE * pow(clamp(l / 0.48, 0.03, 1.5), 0.4) * mix(vec3(1.), alb / max(l, 0.01), 0.3); }
// THE NAMED LAMPS, storey by storey. Each storey is told by its own lamps; between them the concrete stands in the shade.
// No lattice closes a ring of light: lamps stand far enough apart for shade to show between their pools.
${GL_STAIR}
// A FLOOR STANDS BETWEEN a lamp and a thing wherever the thing lies outside that floor's open well (beyond radius
// front). over: the lamp hangs over floor f (what lies under the slab stands in its shadow); under: it hangs under it.
// No lamp's light is cut by a level anywhere else: every lamp lights what its reach covers, by distance alone.
float over(float y, float r, float f, float front){ return 1. - (1. - smoothstep(f - 1.5, f - 0.2, y)) * smoothstep(front - 1.5, front, r); }
float under(float y, float r, float f, float front){ return 1. - smoothstep(f - 1.3, f, y) * smoothstep(front - 1.5, front, r); }
// the quay lamps' light on a place: six groups (three standards to a group), dark water and dark wall between the groups
float quayAt(vec3 p, vec3 n, float bd){ float s = 0.;
  for (int i = 0; i < 6; i++) { float db = mod(bd - uQuay[i].x + 540., 360.) - 180.; s += lampAt(p, n, polar(uQuay[i].x + clamp(db, -7., 7.), 43.2, 33.6), 20.); }
  return s; }
// A FIRE'S BREATH: once in 2.4 to 4.2 s on its own phase w (0 to 1), never by more than an eighth
float fireBreath(float w){ return 0.88 + 0.12 * sin(uTime * 6.2832 / (2.4 + 1.8 * fract(w * 7.13)) + w * 40.); }
vec3 lampsInside(vec3 p, vec3 n){
  float r = rOf(p), y = p.y, bd = mod(atan(p.x, -p.z) / D2R + 360., 360.); vec3 col = vec3(0.);
  // the stair's own lamps: a caged lamp over every landing, one corner on round the tower with each flight
  if (r < 27.) { float j = floor(stairJ(y - STAIR_UP) + 0.5);
    for (int i = -2; i <= 2; i++) { float jj = j + float(i); if (jj < -0.5 || jj > STAIR_N + 0.5) continue; col += LAMP * 1.5 * lampAt(p, n, polar(STAIR_B + 60. * jj, STAIR_R, stairY(jj) + STAIR_UP), 14.); } }
  // THE HALL, under the canal's ledge (floor 28, open inside r 35): two caged lamps on each of the eleven piers (none in
  // the gallery's mouth), lamps along the gallery's crown
  float uL = under(y, r, 28., 35.);
  if (y < 40.) { float kb = nearB(bd, 0., 30.);
    if (abs(kb - 330.) > 1.) col += uL * LAMP * (2.0 * lampAt(p, n, polar(kb, 47., 9.), 22.) + 1.7 * lampAt(p, n, polar(kb, 41.2, 20.), 20.));
    col += uL * LAMP * 1.9 * lampAt(p, n, vec3(-30., 19.2, clamp(nearB(p.z, -130., 20.), -130., -70.)), 22.);
    // a caged lamp on every buttress along both walls of the gallery, and two great lamps hung under the ledge just
    // inside its mouth, over the flywheels: the hall's end of the gallery is the brightest place in it
    col += uL * LAMP * 2.2 * lampAt(p, n, vec3(-30. + 14.3 * sign(p.x + 30.), 6.4, clamp(nearB(p.z, -110., 20.), -110., p.x < -30. ? -50. : -70.)), 15.);
    col += uL * LAMP * 3.6 * (lampAt(p, n, vec3(-30., 15., -42.), 34.) + lampAt(p, n, vec3(-30., 15., -30.), 34.)); }
  // six furnace mouths in the bell wall, burning or in embers by the deal, each breathing slowly on its own phase: their
  // glow carries far across the hall and up the open well, so every pier and machine takes orange on the furnace side
  // and stands in shade on the other
  if (y < 76.) { float w = uL * under(y, r, 50., 39.);
    for (int i = 0; i < 6; i++) { float b = uFurn[i].w; float fl = fireBreath(uFurn[i].y);
      col += w * HEAT * uFurn[i].x * fl * 3.0 * lampAt(p, n, vec3(55.2 * sin(b), 3.4, -55.2 * cos(b)), 72., 0.06); } }
  // THE WATER RING: the quay lamps light the quay and the water at their feet; and their light, thrown back by the
  // moving water, ripples on the soffit over the canal, most where the falls churn it
  if (y > 13. && y < 54.) { float w = over(y, r, 28., 35.) * under(y, r, 50., 39.);
    col += w * LAMP * 2.1 * quayAt(p, n, bd);
    // the lamps on the wall behind each wheel: a row of five, 28 degrees long, 10 m over the quay
    for (int i = 0; i < 3; i++) col += w * LAMP * 3.0 * lampAt(p, n, polar(WHEEL_B[i] + clamp(mod(bd - WHEEL_B[i] + 540., 360.) - 180., -14., 14.), 50.9, 38.5), 22., 0.3);
    if (n.y < -0.3 && r > 33.) { float fallK = 0.; for (int i = 0; i < 3; i++) fallK = max(fallK, 1. - smoothstep(4., 16., abs(mod(bd - WHEEL_B[i] + 540., 360.) - 180.)));
      float rip = pow(1. - abs(vnoise(vec3(p.xz * 0.8, uTime * 0.45)) - vnoise(vec3(p.xz * 0.8 + 7., 3. - uTime * 0.45))), 9.);
      col += w * LAMP * (-n.y) * rip * (0.7 + 0.9 * fallK) * quayAt(vec3(p.x, 28.4, p.z), vec3(0., 1., 0.), bd); } }
  // THE WORKS: each bay is lit from INSIDE by its trade (a forge's or a foundry's fire, a hammer's or a shaft's arc
  // light, a dyer's or a store's one lamp), so a bay's inside glows and its rim and the wall between stay dark; and
  // one caged lamp on every third pier, staggered between the two rings
  for (int q = 0; q < 2; q++) { float ring = float(q), f = 50. + 12. * ring; if (y < f - 9.5 || y > f + 21.) continue;
    float w = over(y, r, f, 39.) * under(y, r, f + 12., 39.), kk = clamp(floor(bd / 15.), 0., 23.);
    int id = q * 24 + int(kk); float tr = uBay[id / 4][id - 4 * (id / 4)];
    if (tr > -0.5) { float t = floor(tr), ph = fract(tr) * 6.283;
      vec3 c = t < 0.5 || (t > 2.5 && t < 3.5) ? HEAT * 3.2 * fireBreath(fract(tr)) : (t < 2.5 ? ARC * (2.2 + 0.16 * sin(uTime * 1.3 + ph)) : LAMP * (t < 4.5 ? 1.7 : 1.0));
      col += w * c * lampAt(p, n, polar(kk * 15. + 7.5, 45.2, f + 5.6), 15., 0.04); }
    col += w * LAMP * 1.3 * lampAt(p, n, polar(nearB(bd, 30. * ring, 45.), 38.5, f + 6.6), 13.); }
  // THE HOME STREETS: a soffit lamp on every second rib line (staggered from street to street); by the door of each
  // house that keeps one lit, its bracket lamp; and the light of each house's lit windows thrown on the street and the parapet
  for (int q = 0; q < 4; q++) { float ring = float(q), f = 74. + 13. * ring; if (y < f - 10. || y > f + 27.5) continue;
    float w = over(y, r, f, 39.) * under(y, r, f + 13., 39.);
    float hn = ${HOUSE_N.map((n, i) => (i < 3 ? `q == ${i} ? ${n}. : ` : `${n}.`)).join('')}; int hb = ${HOUSE_BASE.map((n, i) => (i < 3 ? `q == ${i} ? ${n} : ` : `${n}`)).join('')}; float pitch = 360. / hn, hi = clamp(floor(bd / pitch), 0., hn - 1.);
    col += w * LAMP * 1.4 * lampAt(p, n, polar(nearB(bd, 15. * mod(ring, 2.), 30.), 41.6, f + 10.2), 17.);
    for (int e = 0; e < 2; e++) { float h2 = e == 0 ? hi : mod(hi + (fract(bd / pitch) > 0.5 ? 1. : hn - 1.), hn), bc = (h2 + 0.5) * pitch;
      int id = hb + int(h2); float v = uLit[id / 4][id - 4 * (id / 4)], lit = fract(v), door = step(0.5, v), lx = uDoor[id / 4][id - 4 * (id / 4)];
      col += w * WINDOW * 1.9 * lit * lampAt(p, n, polar(bc, 43.7, f + 4.8), 14., 0.2);
      col += w * LAMP * 1.5 * door * lampAt(p, n, polar(bc, 43.9, f + 4.3) + vec3(cos(bc * D2R), 0., sin(bc * D2R)) * lx, 11.); } }
  // THE FARM TERRACES: violet lamp bars, straight, 9 m long, in every second bay between rib lines and staggered from
  // terrace to terrace; an amber lamp on the riser in every second of the bays between, so that one bay in four stands
  // in the shade on every terrace (staggered from terrace to terrace) and at no height does light close round the well
  for (int q = 0; q < 5; q++) { float k = float(q), f = 126. + 8. * k; if (abs(y - f - 5.) > 16.) continue;
    float w = over(y, r, f, 39. + 4. * k), rl = 41. + 4. * k, ph = 7.5 + 15. * mod(k, 2.);
    float cb = nearB(bd, ph, 30.), arc = clamp((bd - cb) * D2R * rl, -4.5, 4.5);
    col += w * VIOLET * 2.0 * lampAt(p, n, polar(cb + arc / (D2R * rl), rl, f + 5.), 10.);
    col += w * LAMP * 1.4 * lampAt(p, n, polar(nearB(bd, ph + 15., 60.), 42.5 + 4. * k, f + 4.6), 15.); }
  // THE GREAT LANTERN (twelve hanging shafts of glass in a ring 19 m from the axis, a shaft every 30 degrees): its
  // sunset light lies on the stair and on what stands within 24 m of a shaft
  if (y > 118. && r < 46.) col += LAMP_SUN * 1.5 * lampAt(p, n, polar(nearB(bd, 15., 30.), 19., clamp(y, 140., 178.)), 24., 0.25);
  // THE ROOF LIGHTS between the lid's ribs (45 to 57 m from the axis): the sky's last light falls straight down
  // through each, a pool to a roof light, on what faces up under it
  if (y > 148.) col += over(y, r, 166., 59.) * LAMP_SUN * 0.9 * max(n.y, 0.) * smoothstep(42., 47., r) * (1. - smoothstep(55., 61., r)) * (0.5 - 0.5 * cos(bd * D2R * 32.)) * smoothstep(148., 156., y);
  // the sill under the lid: a caged lamp on the inner end of each of the sixteen vanes
  if (y > 154.) col += over(y, r, 166., 59.) * LAMP * 1.4 * lampAt(p, n, polar(nearB(bd, uVane, 22.5), 61.3, 170.6), 16.);
  // the lid is lit by the dusk that comes in through its open bays, on what faces outward or upward near them
  if (y > 150.) { vec3 o = vec3(p.x, 0., p.z) / max(r, 0.01);
    col += DUSK * 0.62 * (0.25 + 0.75 * max(dot(n, normalize(o + vec3(0., 0.35, 0.))), 0.)) * smoothstep(34., 64., r) * smoothstep(150., 168., y);
    // and through the bays of the lid's west side the band's last light comes in low, on what faces it there
    col += uBand * 0.9 * pow(max(dot(n, normalize(vec3(-1., 0.22, 0.))), 0.), 1.5) * smoothstep(0.15, 0.75, -o.x) * smoothstep(50., 64., r) * smoothstep(160., 168., y); }
  return col;
}
// the cloud deck's far edge lets the sun through unevenly: its light on land and lids brightens and dims in patches
// some 180 m across that slide on the wind (22 m a second times the dealt cloud), their edges soft over 60 to 90 m
float cloudShade(vec3 p){ return mix(0.72, 1.06, smoothstep(0.42, 0.58, vnoise((p.xz + uWind.xz * uTime) * 0.0055))); }
// the sun's own colour: the band's, deepened toward red
vec3 sunCol(){ return mix(uBand, vec3(1.0, 0.42, 0.14), 0.55); }
// THE ONE LIGHT RULE OF THE LAND. A face turned to the sun is warm and bright (the sun's light is taken to fall 12
// degrees steep); a face turned from it is cool and dark; tops catch a little of the sky; what is seen at a low angle
// with the sun beyond it shines (the sun's glance along roofs, rims and crests). sunK: 1 in the sun, 0 in a shadow.
// (open: 1 under the open sky; 0 for what stands under a lid's eave, behind its bays, where the sun never shines)
vec3 lightOutside(vec3 p, vec3 n, vec3 v, float open, float sunK){
  float cs = cloudShade(p);
  vec3 sc = sunCol() * 3.0, L = normalize(vec3(uSun.x, 0.21, uSun.z));
  vec3 col = vec3(0.15, 0.18, 0.33) * (0.55 + 0.45 * max(n.y, 0.)) * mix(0.5, 1., open);
  col += sc * max(dot(n, L), 0.) * sunK * cs * open;
  float gl = pow(max(dot(reflect(-v, n), normalize(uSun + vec3(0., 0.06, 0.))), 0.), 12.) * pow(1. - max(dot(v, n), 0.), 2.);
  col += sc * 1.5 * gl * (0.25 + 0.75 * sunK) * open;
  vec3 R = uRing - p; float d2 = dot(R, R);
  col += uRingCol * (0.3 + 0.7 * max(dot(n, R * inversesqrt(d2 + 0.01)), 0.)) * 90. / (90. + d2);
  return col;
}
// the air between eye and thing: inside a thin haze of the shade's own colour (one colour at every height). OUTSIDE a
// thin bright haze lies low over the land (thickest within some 50 m of the ground): it glows gold where the eye looks
// toward the sun and stands dusky violet elsewhere, so the far rows of lids fade into glowing air
vec3 airMix(vec3 col, vec3 p, float inK){
  vec3 d = p - uEye; float dist = length(d); vec3 dir = d / max(dist, 0.001);
  vec3 airIn = SHADE * 1.05;
  float toSun = pow(max(dot(dir, normalize(vec3(uSun.x, 0., uSun.z))), 0.), 4.);
  vec3 airOut = mix(vec3(0.085, 0.090, 0.145), sunCol() * vec3(0.80, 0.66, 0.50), toSun);
  float low = exp(-max(p.y - PLAIN - flankY(p.xz), 0.) / 50.);
  // inside: nothing at the lens, a third at most far across the well, so the far side and the storeys above and below stand back
  float fo = 1. - exp(-dist * (0.00009 + 0.00030 * low)), fi = 0.34 * (1. - exp(-dist / 70.));
  return mix(col, mix(airOut, airIn, inK), clamp(mix(fo, fi, inK), 0., 1.));
}
`;

export const FURNACE_B = [100, 110, 130, 140, 157, 165];
// the six groups of quay lamps of the water ring, by bearing: the canal bridge, the three wheels, the south lift, the lock
export const QUAY_B = [4, 70, 150, 200, 235, 318];
// the uniforms every material of the world shares (one object each, so one write a frame serves all)
export function makeShared() {
  return {
    uTime: { value: 0 }, uRain: { value: 0 }, uEye: { value: new THREE.Vector3() }, uBand: { value: new THREE.Vector3(1, 0.7, 0.4) },
    uRing: { value: new THREE.Vector3(K.END[0], K.END[1], K.END[2]) }, uRingCol: { value: new THREE.Vector3(0.6, 0.8, 1) },
    uFurn: { value: FURNACE_B.map((b) => new THREE.Vector4(1, 2, 0, b * D2R)) }, uQuay: { value: QUAY_B.map((b) => new THREE.Vector4(b, 0, 0, 0)) },
    // the works' 48 bays (each: its trade and a phase; -1 where a lift's slot stands) and the homes' houses (each: the share of its windows lit, +1 where its door lamp burns; and where its door lamp stands along its front)
    uBay: { value: Array.from({ length: 12 }, () => new THREE.Vector4(-1, -1, -1, -1)) }, uLit: { value: Array.from({ length: Math.ceil(HOUSE_ALL / 4) }, () => new THREE.Vector4(0, 0, 0, 0)) }, uDoor: { value: Array.from({ length: Math.ceil(HOUSE_ALL / 4) }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uWind: { value: new THREE.Vector3(-9, 0, 0) }, uVane: { value: 0 }, uStain: { value: new THREE.Vector2() }, uExpo: { value: 1 },
    // the land's light and form: the way to the sun; the swells' and the flank's phases and the deal of lid kinds; the wind
    // ridges' four phases; the bare hill (x, z, half lengths); its tree (x, z, its top's and the hill's height over the
    // plain); the dead city's towers (x, z, half width, height)
    uSun: { value: new THREE.Vector3(...sunDir(1)) }, uLand: { value: new THREE.Vector4() }, uRidge: { value: new THREE.Vector4() }, uHill: { value: new THREE.Vector4(-1e5, 0, 40, 18) }, uTree: { value: new THREE.Vector4(-1e5, 0, 20, 12) },
    uTower: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, 0, 0, 0)) },
  };
}
const TOWN_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aux;
uniform float uTime;
varying vec3 vW, vN, vC; varying vec4 vA;
void main(){
  vec4 wp = vec4(position, 1.); vec3 nn = normal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp; nn = mat3(instanceMatrix) * nn;
  #endif
  wp = modelMatrix * wp; nn = mat3(modelMatrix) * nn;
  // cloth and leaves stir on the world's clock: aux.z metres of reach, aux.w its own phase
  float sw = step(1.5, aux.y) * step(aux.y, 2.5) * aux.z * (sin(uTime * 1.5 + aux.w * 6.283 + wp.y * 0.4) * 0.7 + sin(uTime * 2.3 + aux.w * 17. + wp.x * 0.3) * 0.3);
  float rr = max(length(wp.xz), 0.01);
  wp.xyz += vec3(wp.x / rr, 0., wp.z / rr) * sw;
  vW = wp.xyz; vN = nn; vC = color; vA = aux;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const TOWN_FRAG = /* glsl */`
precision highp float;
${GLSL_HASH}
${GLSL_VALUE_NOISE}
${GL_PLACE}
uniform float uExpo;
varying vec3 vW, vN, vC; varying vec4 vA;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); vec3 v = normalize(uEye - vW + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) n = -n;
  float kind = vA.y, wa = 1., sunK = 1.; vec3 alb = vC;
  float r = rOf(vW), ang = atan(vW.x, -vW.z), inK = insideAt(vW);
  if (kind < 0.5) {
    // worn concrete: board marks from the forms, joints, a century of water stains, pale patches
    float up = abs(n.y);
    float bm = smoothstep(0.86, 1., fract(vW.y * 1.6)) * (1. - step(0.5, up));
    vec2 pv = abs(fract(vW.xz * 0.25) - 0.5);
    float joint = mix(smoothstep(0.96, 1., fract(vW.y * 0.25)), smoothstep(0.485, 0.5, max(pv.x, pv.y)) * 0.6, step(0.5, up));
    // (a place along an upright face: by bearing on the round walls and the fronts; on a face that stands across the
    // round, a vane's or a pier's flank, by metres along the face itself, so its stains hang side by side as they do
    // on the walls)
    vec2 nh = n.xz / max(length(n.xz), 0.01), rh = vW.xz / max(r, 0.01);
    float hc = mix(dot(vW.xz, vec2(-nh.y, nh.x)), ang * r, smoothstep(0.45, 0.9, abs(dot(nh, rh))));
    float streak = mix(vnoise(vec2(hc * 0.5, vW.y * 0.045) + uStain), vnoise(vW.xz * 0.13 + uStain), step(0.5, up));
    float blot = vnoise(vec3(vW.xz * 0.11, vW.y * 0.11));
    float fine = vnoise(vec3(vW * 1.9));
    alb *= (1. - 0.10 * bm - 0.16 * joint) * mix(0.68, 1.06, smoothstep(0.25, 0.7, streak)) * (0.86 + 0.2 * blot) * (0.94 + 0.12 * fine);
    alb = mix(alb, alb * vec3(0.80, 0.86, 0.78), smoothstep(0.62, 0.8, vnoise(vec2(hc * 0.2, vW.y * 0.2))) * 0.6 * (1. - up));
    // THE LID'S SOFFIT (the underside of its roof and eave, seen on leaving): the marks of its forms ring by ring 0.6 m
    // apart, a panel joint every 5.6 degrees, and fine grain; its broad stains are fainter than a wall's
    if (n.y < -0.5 && vW.y > 176. && r < RISE_R0) { float ringm = smoothstep(0.88, 1., fract(r * 1.6)), pj = smoothstep(0.94, 1., abs(fract(ang * 10.186) - 0.5) * 2.);
      alb = vC * (1. - 0.12 * ringm - 0.2 * pj) * (0.9 + 0.12 * blot) * (0.9 + 0.2 * fine) * (0.93 + 0.14 * vnoise(vW.xz * 0.9)); }
    // AGE BY PLACE, on every upright face: a darker foot where a wall meets a floor (to about 1.5 m, ragged), and the
    // stains that hang under every floor's edge, sill and eave (dark streaks by bearing, strongest just under the edge,
    // gone 7 m below it)
    // (our own shaft's floors: the walls of the other lids on the land know nothing of them)
    if (up < 0.5 && r < RISE_R0) { vec2 fh = footHang(vW.y); float foot = fh.x, hang = fh.y;
      float st = vnoise(vec2(hc * 0.9, 3.)), st2 = vnoise(vec2(hc * 0.23, 11.));
      alb *= 1. - 0.30 * (1. - smoothstep(0.15, 0.9 + 1.2 * st2, foot));
      alb *= 1. - 0.34 * smoothstep(0.38, 0.7, st) * (1. - smoothstep(1.2, 8.5, hang)) * (0.55 + 0.45 * st2); }
    // THE SILL UNDER THE LID is washed by the rain the wind drives in through the bays: dark trails run from the
    // vanes' feet outward to the eave, each about a metre wide, widening as they go
    else if (up >= 0.5 && abs(vW.y - SILL_Y) < 0.5 && r > 58. && r < RISE_R0) alb *= 1. - 0.36 * smoothstep(0.40, 0.70, vnoise(vec2(ang * 34., r * 0.06))) * smoothstep(58., 68., r);
  } else if (kind > 6.5) {
    // FOAM where falling water strikes: white, churning on the world's clock, ragged toward its rim
    // (soft: toward its rim the white thins into the dark water it lies on; nothing is cut out of it, so it never speckles)
    float churn = vnoise(vec3(vW.xz * 1.1, uTime * 1.5)) * 0.6 + vnoise(vec3(vW.xz * 2.7 + 5., uTime * 2.3)) * 0.4, edge = mix(0.05, 0.80, vA.z);
    alb = mix(vec3(0.05, 0.09, 0.095), vec3(0.93, 0.96, 0.96) * (0.74 + 0.26 * churn), smoothstep(edge - 0.2, edge + 0.22, churn));
  } else if (kind > 5.5) {
    // a lid's kerb: plain weathered concrete
    alb *= 0.9 + 0.2 * vnoise(vW.xz * 0.3);
  } else if (kind > 4.5) {
    // still canal water: dark; it shows only glints of the lamps that stand near
    alb = vec3(0.05, 0.09, 0.095);
  } else if (kind > 3.5) {
    // THE GROUND TAKES THE LIGHT. Its relief is the land's own (the wind ridges, by the rule the world lays its points
    // to): lit backs and crests, shadowed lees, and each ridge's own shadow thrown away from the sun; hardpan with
    // hairline cracks in the flats between the ridges, pale blown sand on them and in the drifts piled against the
    // lids' windward walls; fine grit near the eye; a stone's flank is bare rock. EVERY PATTERN IS DRAWN ONLY WHERE A
    // PIXEL IS FINE ENOUGH TO CARRY IT (its own footprint in metres), so far ground stands smooth and never bands.
    // The mouth of a light well near our own lid is a hole in the ground (the shaft under its glass).
    vec2 wc = wellAt(vW.xz); if (length(vW.xz - wc) < WELL_R - 1.4 && length(wc) < WELL_NEAR) discard;
    float fw = max(length(dFdx(vW.xz)), length(dFdy(vW.xz))), farK = 1. - smoothstep(12., 40., fw);
    vec2 wd = normalize(uWind.xz + vec2(1e-4, 0.)); float al = dot(vW.xz, wd), ac = dot(vW.xz, vec2(-wd.y, wd.x));
    float rk = 1. - smoothstep(4., 12., fw), amp = ridgeAmp(vW.xz), hr = 0., shR = 0.; vec2 gr = vec2(0.);
    if (rk > 0.002 && amp > 0.01) {
      float h0 = ridgeField(vW.xz, wd); hr = amp * h0;
      gr = rk * amp * vec2(ridgeField(vW.xz + vec2(0.6, 0.), wd) - h0, ridgeField(vW.xz + vec2(0., 0.6), wd) - h0) / 0.6;
      vec2 sh = normalize(uSun.xz); float oc = -1.;
      for (int k = 0; k < 5; k++) { float sd = 3. + 2.2 * float(k * k); oc = max(oc, amp * (ridgeField(vW.xz + sh * sd, wd) - h0) - sd * TAN_SUN); }
      shR = smoothstep(-0.05, 0.3, oc) * rk; }
    // (a drift or the hill carries its slope in its own points; the ridges' slope is added by rule)
    float drift = vA.z;
    if (n.y > 0.5) n = normalize(vec3(n.x / n.y - gr.x, 1., n.z / n.y - gr.y));
    float big = mix(0.5, vnoise(vW.xz * 0.021 + 3.), farK), mid = mix(0.5, vnoise(vW.xz * 0.13) * 0.6 + vnoise(vW.xz * 0.37 + 5.) * 0.4, 1. - smoothstep(1.5, 5., fw)), fine = mix(0.5, vnoise(vW.xz * 1.3), 1. - smoothstep(0.25, 0.8, fw));
    // small ripples on the sand, a stride apart, their lines wandering (never a ruled pattern)
    float rpl = (vnoise(vec2(al * 0.8 + 2.2 * vnoise(vW.xz * 0.09), ac * 0.11)) - 0.5) * (1. - smoothstep(0.12, 0.5, fw));
    // hardpan: cells some 0.8 m across, hairline cracks between them
    vec2 g = vW.xz * 1.25, ip = floor(g), fp = fract(g); float d1 = 9., d2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); float d = length(o + hash22(ip + o) - fp); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    float crack = (1. - smoothstep(0.015, 0.05 + fw * 1.2, d2 - d1)) * (1. - smoothstep(0.2, 0.6, fw));
    float grit = (hash12(floor(vW.xz * 38.)) - 0.5) * (1. - smoothstep(0.012, 0.04, fw));
    float sandK = max(drift, mix(0.35, smoothstep(0.1, 0.55, hr), rk) * (0.75 + 0.25 * big));
    vec3 sand = alb * vec3(1.20, 1.10, 0.98) * (0.84 + 0.26 * big) * (0.93 + 0.14 * mid) * (0.95 + 0.10 * fine) * (1. + 0.22 * rpl + 0.14 * grit);
    vec3 hard = alb * vec3(0.80, 0.76, 0.74) * (0.88 + 0.20 * mid) * (1. - 0.34 * crack) * (1. + 0.10 * grit);
    alb = mix(hard, sand, sandK);
    // a stone's flank: bare rock, by its own place in three dimensions
    float steep = (1. - smoothstep(0.55, 0.8, n.y)) * (1. - drift);
    alb = mix(alb, vC * 0.62 * (0.75 + 0.5 * vnoise(vW * 2.3)) * (0.9 + 0.2 * vnoise(vW * 9.)), steep);
    alb *= 1. - 0.3 * uRain;
    sunK = (1. - landShade(vW.xz, 0.)) * (1. - shR);
  } else if (kind > 2.5) {
    // FALLING WATER IS A BODY OF WATER, SEEN THROUGH: a broad curtain or rope with soft edges. It is thick and white
    // where it leaves its lip; its brightness streams DOWNWARD in fine uneven threads (noise drawn out twenty to one
    // along the fall, in three sizes, each sliding down at its own speed on the world's clock: never even stripes,
    // never slanted bands); from some 8 m down it opens, its edges wander and it breaks into white spray (wholly by
    // 40 m: two thirds down the long falls). Its threads keep their size in metres and travel down at 12 m a second.
    float w0 = vA.x, xl = vA.z, drop = vA.w, yy = vW.y + uTime * 12., broke = smoothstep(8., 40., drop), lip = 1. - smoothstep(0.2, 1.8, drop);
    float th = vnoise(vec2(xl * 8. + 3., yy * 0.2)) * 0.42 + vnoise(vec2(xl * 21. + 11., (yy + uTime * 3.5) * 0.45)) * 0.33 + vnoise(vec2(xl * 2.7 + 5., (yy - uTime * 2.) * 0.07)) * 0.25;
    // (how far this place lies from the fall's middle: 0 at its core, 1 at its edge; the edge wanders more as it breaks)
    float side = abs(xl) / max(w0, 0.05) + (vnoise(vec2(yy * 0.13, xl * 0.4 + 3.)) - 0.5) * (0.2 + 0.7 * broke);
    float body = 1. - smoothstep(0.5, 1.02, side), core = 1. - smoothstep(0., 0.7, side);
    float whole = mix(0.45, 0.86, core) * (0.30 + 0.9 * th), spray = smoothstep(0.30, 0.72, th + 0.22 * core) * 0.62;
    wa = body * max(mix(whole, spray, broke), lip * 0.96);
    if (wa < 0.02) discard;
    // (white at the lip, along its threads and where it breaks; grey-green in the troughs between threads)
    alb = mix(vec3(0.22, 0.38, 0.42), vec3(0.93, 0.97, 0.97), clamp(smoothstep(0.34, 0.78, th) * 0.85 + 0.45 * broke + lip, 0., 1.));
  }
  if (kind > 1.5 && kind < 2.5) {
    // leaves: clumps of light and dark, by the leaf's own place
    float gk = step(alb.r * 1.12, alb.g) * step(alb.b * 1.12, alb.g);
    alb *= mix(1., 0.38 + 0.56 * smoothstep(0.25, 0.75, vnoise(vW * 1.7)) * (0.6 + 0.4 * vnoise(vW * 5.3)), gk);
  }
  // OUTSIDE, our own lid's concrete is weathered to the slate of every other lid on the land
  // (the paler the concrete, the more the weather has taken from it: every lid's concrete comes to one slate)
  if (kind < 0.5) alb *= mix(vec3(0.50, 0.54, 0.62) * pow(min(1., 0.27 / max(dot(vC, vec3(0.3, 0.5, 0.2)), 0.05)), 0.6), vec3(1.), inK);
  // INSIDE: the one shade colour, and on it the light of the named lamps near this place. OUTSIDE: the land's own light.
  // (plain concrete whose third aux is 1 stands under a lid's eave, behind its bays)
  float open = kind < 0.5 ? 1. - vA.z : 1.;
  // (what stands low on the land, within some 9 m of it, lies in the shadows the land's bodies throw)
  if (inK < 0.99 && (kind < 3.5 || kind > 4.5)) { float low = 1. - smoothstep(3., 9., vW.y - PLAIN - flankY(vW.xz)); if (low > 0.) sunK = 1. - low * landShade(vW.xz, 1.); }
  vec3 lamps = lampsInside(vW, n), sky = lightOutside(vW, n, v, open, sunK), shade = shadeOf(alb);
  if (kind > 1.5 && kind < 2.5) { lamps = mix(lamps, lampsInside(vW, -n), 0.45); sky = mix(sky, lightOutside(vW, -n, v, 1., sunK), 0.45); }
  // falling water takes the colour of the lamps near it and stays pale in the shade (the white of breaking water)
  // falling water and foam take the colour of the lamps near them, from either side, by distance
  if ((kind > 2.5 && kind < 3.5) || kind > 6.5) { lamps = 0.5 * (lamps + lampsInside(vW, -n)) + vec3(0.02); shade = SHADE * 2.3; sky = sky * 0.6 + vec3(0.2); }
  // still water: dark, with glints of the lamps that stand over it sliding on its skin
  if (kind > 4.5 && kind < 5.5) { lamps *= 0.25 + 2.4 * smoothstep(0.52, 0.85, vnoise(vec3(vW.xz * 0.8, uTime * 0.6))); shade *= 0.8; }
  // a lid's kerb (the thin strip along its eave): bright on the band's side, slate on the other
  if (kind > 5.5 && kind < 6.5) sky += sunCol() * 3.0 * pow(max(dot(n, normalize(vec3(uSun.x, 0.25, uSun.z))), 0.), 1.5);
  // the ground in the sun is warm on its whole face (sand throws the low light about); in a shadow it keeps the sky's blue
  if (kind > 3.5 && kind < 4.5) sky += sunCol() * 0.55 * sunK * cloudShade(vW);
  vec3 col = mix(alb * sky + SHADE_OUT, alb * lamps + shade, inK);
  // wet glints and worn steel: a small sheen of the lamps near this place
  float sh = pow(clamp(dot(reflect(-v, n), normalize(vec3(-vW.x, 30., -vW.z))), 0., 1.), 18.);
  col += lamps * sh * (kind > 0.5 && kind < 1.5 ? 0.30 : 0.06) * inK;
  // lamps and windows breathe on the world's clock, each on its own phase, once in 6 to 11 s; a FIRE (third aux 1: a
  // furnace mouth, a fire door, a forge, embers, a ladle's metal) breathes once in 2.4 to 4.2 s, by fireBreath, the
  // same rule its thrown light keeps
  float br = 1.;
  if (vA.w > 0. && kind > 0.5 && kind < 1.5) br = vA.z > 1.5 ? smoothstep(0.35, 0.75, sin(uTime * (1.5 + 0.9 * fract(vA.w * 5.31)) + vA.w * 40.)) : vA.z > 0.5 ? fireBreath(vA.w) : 0.82 + 0.18 * sin(uTime * (0.57 + 0.48 * fract(vA.w * 7.13)) + vA.w * 40.);
  // (falling water's first aux is its head's half width, not a glow)
  col += vC * ((kind > 2.5 && kind < 3.5) ? 0. : vA.x) * br;
  col = airMix(col, vW, inK) * uExpo;
  // (only falling water's own material blends: wa is its stream's thickness there; every other thing is solid)
#ifdef SEEN_THROUGH
  gl_FragColor = vec4(col, wa);
#else
  gl_FragColor = vec4(col, 1.);
#endif
}`;
// one family of materials: opaque, or two-sided for cloth and leaves, or seen through for falling water (its quads
// carry both faces themselves; it writes no depth and is drawn after the solid things and before the media)
export function makeTownMaterial(shared, opts = {}) {
  if (opts.water) return new THREE.ShaderMaterial({ uniforms: shared, vertexShader: TOWN_VERT, fragmentShader: TOWN_FRAG, side: THREE.FrontSide, defines: { SEEN_THROUGH: 1 }, transparent: true, depthWrite: false });
  return new THREE.ShaderMaterial({ uniforms: shared, vertexShader: TOWN_VERT, fragmentShader: TOWN_FRAG, side: opts.double ? THREE.DoubleSide : THREE.FrontSide });
}

// ---------------------------------------------------------------- colours of the place
export const COL = {
  conc: lin('#c2b9a8'), stain: lin('#8d8678'), teal: lin('#2f6f6a'), rust: lin('#8a4a2c'), tread: lin('#b3ab99'), dark: lin('#4a4a52'),
  amber: lin('#ffc46a'), furnace: lin('#ff8a2a'), ember: lin('#c2301c'), foam: lin('#eaf6f4'), deep: lin('#1f6f78'),
  heat: lin('#ffd9a0'), spark: lin('#ff9a3c'), honey: lin('#ffd08a'), peach: lin('#ffb38a'), slate: lin('#7d8c84'),
  violet: lin('#c05cff'), rose: lin('#ff5ab4'), leaf: lin('#4fae4a'), leafDeep: lin('#2f7a3c'), grain: lin('#d9b340'), silver: lin('#a9b8cc'),
  wood: lin('#8a6a48'), soil: lin('#4a3a2c'), steel: lin('#285a56'), iron: lin('#3a3d44'),
};
const STEEL = [0, 1, 0, 0];
export const P3 = (b, r, y) => [bx(b, r), y, bz(b, r)];
// a flat quad whose front is turned away from a point inside the body it belongs to
Acc.prototype.quadOut = function (a, b, c, d, inside, col, aux = NOAUX) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * (a[0] - inside[0]) + ny * (a[1] - inside[1]) + nz * (a[2] - inside[2]) >= 0) this.quad(a, b, c, d, col, aux); else this.quad(a, d, c, b, col, aux);
};
Acc.prototype.triOut = function (a, b, c, inside, col, aux = NOAUX) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * (a[0] - inside[0]) + ny * (a[1] - inside[1]) + nz * (a[2] - inside[2]) >= 0) this.tri(a, b, c, col, aux); else this.tri(a, c, b, col, aux);
};
// a quad whose four corners each carry their own aux, seen from both sides (falling water, foam)
Acc.prototype.quadAux = function (a, b, c, d, col, auxes) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for (const sg of [1, -1]) { const q = [a, b, c, d].map((p, k) => this.vert(p[0], p[1], p[2], nx * sg, ny * sg, nz * sg, col, auxes[k]));
    if (sg > 0) this.i.push(q[0], q[1], q[2], q[0], q[2], q[3]); else this.i.push(q[0], q[2], q[1], q[0], q[3], q[2]); }
};
// a straight bar from a to b, hw wide and hh high to each side of its line (steel sections, rails, legs, brackets)
Acc.prototype.beam = function (a, b, hw, hh, col, aux = STEEL, ends = false) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, t = [dx / L, dy / L, dz / L];
  let sx = t[2], sz = -t[0]; const sl = Math.hypot(sx, sz); if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
  let ux = -sz * t[1], uy = sz * t[0] - sx * t[2], uz = sx * t[1]; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
  const C = (p, i, j) => [p[0] + i * sx * hw + j * ux * hh, p[1] + j * uy * hh, p[2] + i * sz * hw + j * uz * hh];
  const v = [C(a, -1, -1), C(a, 1, -1), C(a, 1, 1), C(a, -1, 1), C(b, -1, -1), C(b, 1, -1), C(b, 1, 1), C(b, -1, 1)], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  this.quadOut(v[0], v[1], v[5], v[4], m, col, aux); this.quadOut(v[1], v[2], v[6], v[5], m, col, aux);
  this.quadOut(v[2], v[3], v[7], v[6], m, col, aux); this.quadOut(v[3], v[0], v[4], v[7], m, col, aux);
  if (ends) { this.quadOut(v[0], v[1], v[2], v[3], m, col, aux); this.quadOut(v[4], v[5], v[6], v[7], m, col, aux); }
};
// the gallery's vault: its height over the floor at a distance d from its axis (walls 10 m, then an arch to a crown of 20 m)
export const vaultY = (d) => (Math.abs(d) >= 20 ? 0 : 10 + 10 * Math.sqrt(1 - (d / 20) * (d / 20)));
// the two goods lifts' bearings and the notch each slab front carries for a cage
// THE TWO GOODS LIFTS' bearings: each is the middle of its slot (the slot is the 6 degrees of floor edge and parapet
// left out for it at every floor, 4.2 m wide at the edge; the cage is 3 m wide)
export const LIFT_B = [36, 201];
const notched = (b) => LIFT_B.some((l) => Math.abs(((b - l + 540) % 360) - 180) < 3);
// a ring floor's thickness: the works' floors 1.5 m, the home streets' floors and the bowl's first lip 2 m
export const slabOf = (F) => (F >= 74 ? 2 : K.SLAB);
function ringSlab(A, F, r0, r1, col, faces = 'tui') {
  for (let k = 0; k < 120; k++) { const a = k * 3, n = notched(a + 1.5); A.sector(a, a + 3, n ? r0 + 1.4 : r0, r1, F - slabOf(F), F, col, NOAUX, 1, faces + (n !== notched(a - 1.5) || n !== notched(a + 4.5) ? 'e' : '')); }
}
// THE ELEVEN PIERS OF THE BELL, in metres: bearings 0, 30, ... 300 (none at 330, where the gallery's mouth is: the ledge
// there rides one arched beam from the pier at 300 to the pier at 0). Each is 4.4 m wide; its foot stands on the hall
// floor from r 53.8 to r 58, its head meets the ledge's underside (y 26.5) from r 38.9 to r 44.5.
export const PIER_B = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
// THE SHELL: floor, bell, gallery, piers, ledge, bore wall and ribs, ring floors on corbels, bowl terraces, sill, drum floor
// THE FOUR FLYWHEEL PITS: each 3.4 m wide, 8.8 m long and 1.7 m deep, under its wheel (the wheel's rim runs 0.7 m over the pit's floor).
// THE GREAT WHEELS are 11.2 m across on axles 4.6 m over the floor, their near faces 9 m from the gallery's line on either
// side: their crowns stand 10.2 m over the floor, so the hall is seen over them from the gallery. NOTHING OVERLAPS A GREAT
// WHEEL: no weight or block stands on its rim, and no pale thing on or before it.
export const FLY = { R: 5.6, Y: 4.6 };
export const PITS = [-36, -14].flatMap((z) => [-1, 1].map((sx) => [K.GALLERY_X + sx * 10.2, z])), PIT = { HW: 1.7, HL: 4.4, DEEP: 1.7 };
// (part 0: the hall's floor, the bell, the gallery, the piers and the ledge; part 1: the bore's wall and the works' floors;
// part 2: the four home streets' floors and the bowl's first lip; part 3: the bowl's terraces and the sill)
export function buildShell(A, part = -1) {
  const c = COL.conc, c2 = mix3(COL.conc, COL.stain, 0.35), c3 = mix3(COL.conc, COL.stain, 0.7), yL = K.BELL_TOP - K.SLAB;
  if (part < 0 || part === 0) buildBell(A, c, c2, c3, yL);
  for (let q = 1; q < 4; q++) if (part < 0 || part === q) buildBore(A, c, c2, c3, q);
}
function buildBell(A, c, c2, c3, yL) {
  // the hall's round floor and the gallery's floor are ONE slab, and the four flywheel pits are cut out of it: its
  // outline runs round the bell from the gallery's east edge by east, south and west to its west edge, then round the gallery
  { const R = K.BELL_R, xa = K.GALLERY_X - 22, xb = K.GALLERY_X + 22, ba = bearingOf(xb, -Math.sqrt(R * R - xb * xb)), arc = (bearingOf(xa, -Math.sqrt(R * R - xa * xa)) - ba + 360) % 360, ring = [];
    for (let k = 0; k <= 96; k++) { const b = ba + arc * k / 96; ring.push(new THREE.Vector2(bx(b, R), bz(b, R))); }
    ring.push(new THREE.Vector2(xa, K.GALLERY_Z0), new THREE.Vector2(xb, K.GALLERY_Z0));
    const holes = PITS.map(([x, z]) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => new THREE.Vector2(x + i * PIT.HW, z + j * PIT.HL))), pts = ring.concat(...holes);
    for (const t of THREE.ShapeUtils.triangulateShape(ring, holes)) { const a = pts[t[0]], b = pts[t[1]], c = pts[t[2]], turn = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (turn < 0) A.tri([a.x, 0, a.y], [b.x, 0, b.y], [c.x, 0, c.y], c2); else A.tri([a.x, 0, a.y], [c.x, 0, c.y], [b.x, 0, b.y], c2); } }
  // bell wall, open at the gallery's mouth (the wall there stands only above the vault's line)
  for (let k = 0; k < 96; k++) {
    const a = k * 3.75, b = a + 3.75, xa = bx(a, K.BELL_R), xb = bx(b, K.BELL_R), za = bz(a, K.BELL_R), zb = bz(b, K.BELL_R);
    const ya = za < 0 ? vaultY(xa - K.GALLERY_X) : 0, yb = zb < 0 ? vaultY(xb - K.GALLERY_X) : 0;
    A.quad([xa, ya, za], [xb, yb, zb], [xb, K.BELL_TOP, zb], [xa, K.BELL_TOP, za], c);
  }
  // the gallery: a barrel vault 40 m wide from its north end into the bell wall, and its north end wall
  // (each strip of the vault ends where it meets the bell's round wall, so no gap stands beside the mouth)
  const zs = [K.GALLERY_Z0, -110, -90, -70, 0], zEnd = (x) => -Math.sqrt(Math.max(0, K.BELL_R * K.BELL_R - x * x)) + 0.05;
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < 14; i++) {
    const prof = (t) => [20 * Math.cos(Math.PI * (1 - t)), 10 + 10 * Math.sin(Math.PI * t)];
    const P = (i2) => (i2 === 0 ? [-20, 0] : i2 === 1 ? [-20, 10] : i2 === 13 ? [20, 10] : i2 === 14 ? [20, 0] : prof((i2 - 1) / 12));
    const p = P(i), q = P(i + 1), xp = K.GALLERY_X + p[0], xq = K.GALLERY_X + q[0], last = j === zs.length - 2;
    A.quad([xp, p[1], zs[j]], [xq, q[1], zs[j]], [xq, q[1], last ? zEnd(xq) : zs[j + 1]], [xp, p[1], last ? zEnd(xp) : zs[j + 1]], c);
  }
  A.quad([-50, 0, K.GALLERY_Z0], [-10, 0, K.GALLERY_Z0], [-10, 20, K.GALLERY_Z0], [-50, 20, K.GALLERY_Z0], c2);
  for (const b of PIER_B) {
    const w = 2.2, Pn = (r, y, s) => [bx(b, r) + Math.cos(b * D2R) * s * w, y, bz(b, r) + Math.sin(b * D2R) * s * w], mid = P3(b, 49, 13);
    A.quadOut(Pn(53.8, 0, -1), Pn(53.8, 0, 1), Pn(38.9, yL, 1), Pn(38.9, yL, -1), mid, c);
    A.quadOut(Pn(58, 0, 1), Pn(58, 0, -1), Pn(44.5, yL, -1), Pn(44.5, yL, 1), mid, c2);
    A.quadOut(Pn(53.8, 0, 1), Pn(58, 0, 1), Pn(44.5, yL, 1), Pn(38.9, yL, 1), mid, c);
    A.quadOut(Pn(58, 0, -1), Pn(53.8, 0, -1), Pn(38.9, yL, -1), Pn(44.5, yL, -1), mid, c);
  }
  // the arched beam over the gallery's mouth, from the pier at 300 to the pier at 0: 3.6 m wide, 4.5 m deep at its ends, 1 m at its crown
  for (let k = 0; k < 12; k++) { const t = (k + 0.5) / 12; A.sector(300 + k * 5, 305 + k * 5, 38.9, 42.5, yL - 4.5 + 14 * t * (1 - t), yL, c, NOAUX, 1, 'uio'); }
  // the ledge over the hall (the canal's ledge and the bell's roof): r 35 to the bell wall; its lip is cut down at the spillway
  A.sector(0, 360, K.LEDGE_R, K.BELL_R, yL, K.BELL_TOP, c, NOAUX, 96, 'ui');
  A.sector(196, 524, K.LEDGE_R, 36, yL, K.BELL_TOP + 0.9, c, NOAUX, 82, 'tioe');
  A.sector(0, 360, 36, 42, yL, K.BELL_TOP - 0.2, c3, NOAUX, 48, 't');
  A.sector(0, 360, 42, K.BORE_R, yL, K.BELL_TOP + 0.4, c, NOAUX, 96, 'ti');
}
function buildBore(A, c, c2, c3, q) {
  if (q === 1) {
  // the bore wall and its 24 ribs
  A.sector(0, 360, K.BORE_R, K.BORE_R + 1, K.BELL_TOP, K.BORE_TOP, c2, NOAUX, 48, 'i');
  for (let k = 0; k < 24; k++) A.sector(k * 15 - 1.2, k * 15 + 1.2, K.BORE_R - 1.3, K.BORE_R, K.BELL_TOP, K.BORE_TOP, c, NOAUX, 1, 'ie');
  // ring floors: the works' two, then the four home streets and the bowl's first lip, each a thick slab rooted in the wall
  for (const F of K.WORKS) ringSlab(A, F, K.FRONT_R, K.BORE_R, c);
  }
  if (q === 2) for (const F of K.HOMES.concat([K.BORE_TOP])) {
    ringSlab(A, F, K.FRONT_R, K.BORE_R, mix3(c2, COL.slate, 0.4), F === K.BORE_TOP ? 'ui' : 'tui');
    // corbels 3 m deep on the 24 rib lines carry the floor's edge
    const ys = F - 2;
    for (let k = 0; k < 24; k++) { const b = k * 15;
      const w = 0.5, Q = (r, y, s) => [bx(b, r) + Math.cos(b * D2R) * s * w, y, bz(b, r) + Math.sin(b * D2R) * s * w], mid = P3(b, 42, ys - 1);
      A.quadOut(Q(39.3, ys, 1), Q(44.4, ys, 1), Q(44.4, ys - 3.2, 1), Q(39.3, ys - 0.7, 1), mid, c);
      A.quadOut(Q(39.3, ys, -1), Q(44.4, ys, -1), Q(44.4, ys - 3.2, -1), Q(39.3, ys - 0.7, -1), mid, c);
      A.quadOut(Q(39.3, ys - 0.7, -1), Q(39.3, ys - 0.7, 1), Q(44.4, ys - 3.2, 1), Q(44.4, ys - 3.2, -1), mid, c3);
      A.quadOut(Q(39.3, ys, -1), Q(39.3, ys, 1), Q(39.3, ys - 0.7, 1), Q(39.3, ys - 0.7, -1), mid, c);
    }
    // the street's parapet on the floor's edge, open at the lifts
    if (F !== K.BORE_TOP) for (let k = 0; k < 120; k++) { const a = k * 3; if (!notched(a + 1.5)) A.sector(a, a + 3, K.FRONT_R, K.FRONT_R + 0.45, F, F + 1.15, c, NOAUX, 1, 'tio'); }
  }
  if (q !== 3) return;
  // the bowl: five terraces stepping back 4 m every 8 m, then the sill
  for (let k = 0; k < 5; k++) {
    const y = K.TERRACES[k], r = K.FRONT_R + 4 * k;
    A.sector(0, 360, r, r + 4, y - 1, y, c2, NOAUX, 72, 't');
    A.sector(0, 360, r + 4, r + 5, y, y + 8, c3, NOAUX, 72, 'i');
    A.sector(0, 360, r, r + 0.5, y - (k > 0 ? 0 : 2), y + 0.7, c, NOAUX, 72, 'tio');
  }
  A.sector(0, 360, K.SILL_R, K.EAVE_R, K.SILL_Y - 1, K.SILL_Y, c, NOAUX, 96, 't');
  A.sector(0, 360, K.EAVE_R - 1, K.EAVE_R, K.GROUND - 3, K.SILL_Y, c, NOAUX, 96, 'o');
}

// ---------------------------------------------------------------- the one great stair
// IN PLAN THE STAIR IS A HEXAGON, never a ring. A six-sided concrete TOWER stands on the shaft's axis from the hall's
// floor to the lid: its flats 9 m from the axis, its six corners cut to faces 2 m wide. Along each flat runs ONE STRAIGHT
// FLIGHT, 3.2 m wide and 8.1 m long from corner face to corner face: sixteen steps with dark risers and pale worn
// middles, on a straight slab of its own. At each corner a LEVEL LANDING juts out as a platform of its own, 5.2 m wide
// and out to 16.4 m from the axis, on a concrete corbel that springs from the tower's corner face; in that face, at
// every landing, stands an arched doorway lit warm from within, and a caged lamp hangs over the landing from a bracket
// above the door. So the stair's edge is a broken line of straight runs and jutting platforms, its soffit a set of
// separate straight slabs stepping round the tower, and the tower's flats stand bare between flight and flight (a turn
// rises about 24 m; a flight with its rail covers 5 m of a flat's height). Rails are thin dark-teal steel.
// It winds clockwise as it climbs (against the flown line). ITS FOOT is the corner on the bearing of the gallery's
// mouth (330): the first flight starts there, from the hall's floor.
// LANDING HEIGHTS: the stair lands level on each served floor (the canal's ledge, both works floors, the first and the
// third home street, the sill). Between two served floors the flights are as many as the height over 4 m, rounded up,
// and share that height equally: 7, 6, 3, 3, 7 and 17 flights, 43 in all, each rising between 3.67 and 4 m.
// a point by a bearing's own frame: rad out along the bearing, tan across it (toward greater bearings)
export const HX = (b, rad, tan, y) => { const s = Math.sin(b * D2R), c = Math.cos(b * D2R); return [s * rad + c * tan, y, -c * rad + s * tan]; };
export const yawRadial = (b) => Math.PI - b * D2R;
// THE BRIDGES stand on the place's own helix of bridges: one to each served floor, its bearing falling 2.8333 degrees
// for every metre of floor above y 50 (one turn in 127.1 m), from bearing 119 at the first works floor. Served: both
// works floors and every second home street; the canal's bridge lies due north and the head bridge due west.
export const bridgeBearing = (F) => (((119 - 2.8333 * (F - 50)) % 360) + 360) % 360;
export function bridgeList() {
  const out = [{ F: K.BELL_TOP, b: 0, r1: K.LEDGE_R }];
  for (const F of [K.WORKS[0], K.WORKS[1], K.HOMES[0], MARKET_Y]) out.push({ F, b: bridgeBearing(F), r1: K.FRONT_R });
  out.push({ F: K.SILL_Y, b: 270, r1: K.SILL_R });
  return out;
}
const gapAt = (b, at, half) => Math.abs(((b - at + 540) % 360) - 180) < half;
// how far a six-sided deck of the given flat distance reaches from the axis on a bearing
export const hexEdge = (b, flat) => flat / Math.cos((((b - STAIR_B0) % 60 + 60) % 60 - 30) * D2R);
// a steel rail along a straight edge from p to q (posts no more than 2.4 m apart)
function railRun(A, p, q) {
  const L = Math.hypot(q[0] - p[0], q[2] - p[2]), n = Math.max(1, Math.ceil(L / 2.4)), at = (t, up) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t) + up, lerp(p[2], q[2], t)];
  A.beam(at(0, 1.25), at(1, 1.25), 0.07, 0.07, COL.steel); A.beam(at(0, 0.65), at(1, 0.65), 0.04, 0.04, COL.steel);
  for (let k = 0; k <= n; k++) A.beam(at(k / n, 0), at(k / n, 1.25), 0.06, 0.06, COL.steel);
}
// THE TOWER: twelve faces (six flats, six corner faces), from the hall's floor to the lid
function buildTower(A, c) {
  for (let k = 0; k < 6; k++) { const b = STAIR_B0 + 60 * k, in0 = [0, 90, 0];
    A.quadOut(HX(b, ST.CUT, -ST.CUT_W, 0), HX(b, ST.CUT, ST.CUT_W, 0), HX(b, ST.CUT, ST.CUT_W, K.EAVE_TOP), HX(b, ST.CUT, -ST.CUT_W, K.EAVE_TOP), in0, mul(c, 0.94));
    A.quadOut(HX(b, ST.CUT, ST.CUT_W, 0), HX(b + 60, ST.CUT, -ST.CUT_W, 0), HX(b + 60, ST.CUT, -ST.CUT_W, K.EAVE_TOP), HX(b, ST.CUT, ST.CUT_W, K.EAVE_TOP), in0, c); }
}
// ONE FLIGHT along the tower's flat i: sixteen steps on a straight slab, its outer side stepped, its rail on the outer edge
function buildFlight(A, S, i, c, st) {
  const th = STAIR_B0 + 60 * i + 30, y0 = STAIR_Y[i], y1 = STAIR_Y[i + 1], n = 16, g = 2 * ST.S / n, h = (y1 - y0) / n, F = (s, r, y) => HX(th, r, s, y);
  // each flight's walked strip is worn paler or left darker by the stair's own stream
  const worn = mix3(st, COL.tread, 0.45 + 0.55 * S.wear[i % S.wear.length]), riser = mul(st, 0.42), r0 = ST.FLAT, r3 = ST.OUT, ra = r0 + 0.8, rb = r3 - 0.8;
  const under = (s) => y0 + (s + ST.S) / (2 * ST.S) * (y1 - y0) - 0.55;
  for (let j = 0; j < n; j++) { const s0 = -ST.S + j * g, s1 = s0 + g, yt = y0 + (j + 1) * h, below = F(s0 + g / 2, 10.6, yt - 6);
    A.quadOut(F(s0, r0, yt - h), F(s0, r3, yt - h), F(s0, r3, yt), F(s0, r0, yt), F(s1 + 1, 10.6, yt), riser);
    A.quadOut(F(s0, r0, yt), F(s0, ra, yt), F(s1, ra, yt), F(s1, r0, yt), below, st); A.quadOut(F(s0, ra, yt), F(s0, rb, yt), F(s1, rb, yt), F(s1, ra, yt), below, worn);
    A.quadOut(F(s0, rb, yt), F(s0, r3, yt), F(s1, r3, yt), F(s1, rb, yt), below, st);
    A.quadOut(F(s0, r3, under(s0)), F(s1, r3, under(s1)), F(s1, r3, yt), F(s0, r3, yt), [0, yt, 0], c); }
  A.quadOut(F(-ST.S, r0, y0 - 0.55), F(-ST.S, r3, y0 - 0.55), F(ST.S, r3, y1 - 0.55), F(ST.S, r0, y1 - 0.55), F(0, 10.6, y1 + 6), mul(c, 0.85));
  railRun(A, F(-ST.S, r3 - 0.12, y0), F(ST.S, r3 - 0.12, y1));
}
// ONE LANDING at corner j: a level platform between the two flights' ends that juts out past them on its corbel; the
// arched doorway in the tower's corner face, lit warm from within; the caged lamp over the landing on its bracket.
// Where the landing lies on a served floor its platform runs into that floor's deck (which carries the rail).
function buildLanding(A, S, j, c, st) {
  const b = STAIR_B0 + 60 * j, y = j ? STAIR_Y[j] : 0.12, P = (rad, tan, yy) => HX(b, rad, tan, yy), served = bridgeList().find((s) => Math.abs(s.F - STAIR_Y[j]) < 0.01);
  const ox = ST.CUT + ST.W * C30, ow = ST.CUT_W + ST.W / 2, worn = mix3(st, COL.tread, 0.45 + 0.55 * S.wear[(j + 43) % S.wear.length]), up = [0, y + 50, 0], dn = P(12, 0, y - 50), ax = [0, y, 0];
  const tip = served ? hexEdge(b, served.F === MARKET_Y ? ST.MARKET : ST.COLLAR) - 0.3 : ST.JUT, deep = served && served.F === MARKET_Y ? 5 : j ? 3.2 : 0;
  A.quadOut(P(ST.CUT, -ST.CUT_W, y), P(ox, -ow, y), P(ox, ow, y), P(ST.CUT, ST.CUT_W, y), dn, worn);
  if (!served) {
    A.quadOut(P(ox, -ow, y), P(ST.JUT, -ow, y), P(ST.JUT, ow, y), P(ox, ow, y), dn, st);
    if (j) { A.quadOut(P(ST.CUT, -ST.CUT_W, y - 0.5), P(ox, -ow, y - 0.5), P(ox, ow, y - 0.5), P(ST.CUT, ST.CUT_W, y - 0.5), up, mul(c, 0.85)); A.quadOut(P(ox, -ow, y - 0.5), P(ST.JUT, -ow, y - 0.5), P(ST.JUT, ow, y - 0.5), P(ox, ow, y - 0.5), up, mul(c, 0.85)); }
    const lo = j ? y - 0.5 : 0;
    A.quadOut(P(ox, -ow, lo), P(ST.JUT, -ow, lo), P(ST.JUT, -ow, y), P(ox, -ow, y), ax, c); A.quadOut(P(ox, ow, lo), P(ST.JUT, ow, lo), P(ST.JUT, ow, y), P(ox, ow, y), ax, c);
    A.quadOut(P(ST.JUT, -ow, lo), P(ST.JUT, ow, lo), P(ST.JUT, ow, y), P(ST.JUT, -ow, y), ax, c);
    railRun(A, P(ox, -ow + 0.1, y), P(ST.JUT - 0.1, -ow + 0.1, y)); railRun(A, P(ST.JUT - 0.1, -ow + 0.1, y), P(ST.JUT - 0.1, ow - 0.1, y)); railRun(A, P(ST.JUT - 0.1, ow - 0.1, y), P(ox, ow - 0.1, y));
  } else A.triOut(P(ox, -ow, y), P(ST.OUT / C30, 0, y), P(ox, ow, y), dn, st);
  // the corbel: a concrete bracket from the corner face, deep at the tower and thin at its tip
  if (deep) { const m = P(12, 0, y - 1.6), y0 = y - (served ? (served.F === MARKET_Y ? 0.8 : 0.6) : 0.5);
    for (const w of [-0.45, 0.45]) A.quadOut(P(ST.CUT, w, y0), P(tip, w, y0), P(tip, w, y0 - 0.5), P(ST.CUT, w, y0 - deep), m, c);
    A.quadOut(P(ST.CUT, -0.45, y0 - deep), P(ST.CUT, 0.45, y0 - deep), P(tip, 0.45, y0 - 0.5), P(tip, -0.45, y0 - 0.5), m, st); }
  // the doorway: a dark arched reveal, and within it the warm light of the tower's inside
  const D = (tan, yy, out) => P(ST.CUT + out, tan, yy), hole = [0.03, 0.032, 0.04], warm = [0.95, 0.62, 0.3], gl = [1.25, 1, 0, S.doorPh[j % S.doorPh.length]];
  A.quadOut(D(-0.9, y, 0.03), D(0.9, y, 0.03), D(0.9, y + 2.5, 0.03), D(-0.9, y + 2.5, 0.03), ax, hole, STEEL); A.quadOut(D(-0.9, y + 2.5, 0.03), D(0.9, y + 2.5, 0.03), D(0.5, y + 3.25, 0.03), D(-0.5, y + 3.25, 0.03), ax, hole, STEEL);
  A.quadOut(D(-0.62, y, 0.06), D(0.62, y, 0.06), D(0.62, y + 2.35, 0.06), D(-0.62, y + 2.35, 0.06), ax, warm, gl); A.quadOut(D(-0.62, y + 2.35, 0.06), D(0.62, y + 2.35, 0.06), D(0.3, y + 2.95, 0.06), D(-0.3, y + 2.95, 0.06), ax, warm, gl);
  // the lamp over the landing
  A.beam(P(ST.CUT, 0, y + ST.LAMP_UP + 0.5), P(ST.LAMP_R, 0, y + ST.LAMP_UP + 0.5), 0.07, 0.07, COL.iron); cagedLamp(A, P(ST.LAMP_R, 0, y + ST.LAMP_UP), 0.36, 3.2, lph(S));
}
// THE DECK OF A SERVED FLOOR: a level six-sided gallery round the stair outside its flights, from which that floor's
// bridge leaves. It is carried on corbels from the tower's corner faces: its own landing's, and one at every other
// corner where the landing below leaves 4.8 m and more of headroom (a corbel's depth is what is left over that).
function buildDeck(A, S, s, c, st) {
  const market = s.F === MARKET_Y, flat = market ? ST.MARKET : ST.COLLAR, th = market ? 0.8 : 0.6, head = s.F === K.SILL_Y, y = s.F, dn = [0, y - 50, 0], up = [0, y + 50, 0];
  for (let k = 0; k < 6; k++) { const b0 = STAIR_B0 + 60 * k, b1 = b0 + 60, C = (b, f, yy) => HX(b, f / C30, 0, yy);
    A.quadOut(C(b0, ST.OUT, y), C(b1, ST.OUT, y), C(b1, flat, y), C(b0, flat, y), dn, c); A.quadOut(C(b0, ST.OUT, y - th), C(b1, ST.OUT, y - th), C(b1, flat, y - th), C(b0, flat, y - th), up, mul(c, 0.85));
    A.quadOut(C(b0, flat, y - th), C(b1, flat, y - th), C(b1, flat, y), C(b0, flat, y), [0, y, 0], c); A.quadOut(C(b0, ST.OUT, y - th), C(b1, ST.OUT, y - th), C(b1, ST.OUT, y), C(b0, ST.OUT, y), HX(b0 + 30, 14, 0, y), st);
    // the head: the sill's own platform closes over the flights, all but the last flight's own flat
    if (head && k !== (STAIR_Y.length - 2) % 6) { A.quadOut(HX(b0, ST.CUT, ST.CUT_W, y), HX(b1, ST.CUT, -ST.CUT_W, y), C(b1, ST.OUT, y), C(b0, ST.OUT, y), dn, c); A.quadOut(HX(b0, ST.CUT, ST.CUT_W, y - th), HX(b1, ST.CUT, -ST.CUT_W, y - th), C(b1, ST.OUT, y - th), C(b0, ST.OUT, y - th), up, mul(c, 0.85)); }
    // the rail along this side, open where the bridge lands
    const mid = b0 + 30, L = (flat - 0.1) * Math.tan(30 * D2R), d = ((s.b - mid + 540) % 360) - 180, sb = Math.abs(d) <= 30 ? (flat - 0.1) * Math.tan(d * D2R) : 1e9, E = (t) => HX(mid, flat - 0.1, t, y);
    if (sb > 1e8) railRun(A, E(-L), E(L)); else { if (sb - 1.7 > -L + 0.3) railRun(A, E(-L), E(sb - 1.7)); if (sb + 1.7 < L - 0.3) railRun(A, E(sb + 1.7), E(L)); }
    // the corbel at this corner (the deck's own landing has brought its own)
    let below = -1; for (let j = k; j < STAIR_Y.length; j += 6) if (STAIR_Y[j] <= y + 0.01) below = STAIR_Y[j];
    const room = y - below, deep = Math.min(market ? 5 : 3.2, room - 4.8), tip = flat / C30 - 0.3, m = HX(b0, 13, 0, y - 1.6);
    if (room > 0.01 && deep >= 0.8) { for (const w of [-0.45, 0.45]) A.quadOut(HX(b0, ST.CUT, w, y - th), HX(b0, tip, w, y - th), HX(b0, tip, w, y - th - 0.5), HX(b0, ST.CUT, w, y - th - deep), m, c);
      A.quadOut(HX(b0, ST.CUT, -0.45, y - th - deep), HX(b0, ST.CUT, 0.45, y - th - deep), HX(b0, tip, 0.45, y - th - 0.5), HX(b0, tip, -0.45, y - th - 0.5), m, st); }
  }
  buildBridge(A, S, s, hexEdge(s.b, flat) - 0.25);
}
// built in parts so that the page can breathe between them: 0 the tower, 1 and 2 the flights (lower, upper), 3 and 4 the
// landings (lower, upper), 5 the served floors' decks and their bridges; -1 all at once
export function buildStair(A, S, phase = -1) {
  const c = mix3(COL.conc, COL.stain, 0.45), st = mix3(COL.conc, COL.stain, 0.85), nf = STAIR_Y.length - 1, half = Math.ceil(nf / 2);
  if (phase <= 0) buildTower(A, c);
  if (phase < 0 || phase === 1) for (let i = 0; i < half; i++) buildFlight(A, S, i, c, st);
  if (phase < 0 || phase === 2) for (let i = half; i < nf; i++) buildFlight(A, S, i, c, st);
  if (phase < 0 || phase === 3) for (let j = 0; j <= half; j++) buildLanding(A, S, j, c, st);
  if (phase < 0 || phase === 4) for (let j = half + 1; j <= nf; j++) buildLanding(A, S, j, c, st);
  if (phase < 0 || phase === 5) for (const s of bridgeList()) buildDeck(A, S, s, c, st);
}
// ONE BRIDGE: an open riveted bowstring truss of dark steel, 3 m wide, a thin deck (soffit 0.6 m under the floor), a
// bow rising 4.4 m over mid span on each side, caged lamps on its rails, nothing hung beneath
function buildBridge(A, S, s, r0) {
  const b = s.b, r1 = s.r1, n = r1 - r0 > 30 ? 12 : 8, y = s.F, side = [Math.cos(b * D2R), 0, Math.sin(b * D2R)];
  const at = (t, sg, yy) => { const r = lerp(r0, r1, t); return [bx(b, r) + side[0] * sg * 1.5, yy, bz(b, r) + side[2] * sg * 1.5]; };
  A.quad(at(0, -1, y), at(1, -1, y), at(1, 1, y), at(0, 1, y), mix3(COL.steel, COL.rust, 0.35), STEEL);
  A.quad(at(0, -1, y - 0.6), at(0, 1, y - 0.6), at(1, 1, y - 0.6), at(1, -1, y - 0.6), COL.iron, STEEL);
  for (const sg of [-1, 1]) {
    const bow = (k) => at(k / n, sg, y + 1.2 + 3.2 * 4 * (k / n) * (1 - k / n));
    A.beam(at(0, sg, y - 0.3), at(1, sg, y - 0.3), 0.12, 0.3, COL.steel);
    for (let k = 0; k < n; k++) {
      A.beam(bow(k), bow(k + 1), 0.14, 0.14, COL.steel);
      A.beam(at(k / n, sg, y), bow(k), 0.08, 0.08, COL.steel);
      if (k % 2 === 0) A.beam(at(k / n, sg, y), bow(k + 1), 0.06, 0.06, COL.steel); else A.beam(bow(k), at((k + 1) / n, sg, y), 0.06, 0.06, COL.steel);
    }
    A.beam(at(1, sg, y), bow(n), 0.08, 0.08, COL.steel);
    A.beam(at(0, sg, y + 1.2), at(1, sg, y + 1.2), 0.05, 0.05, COL.steel);
    for (const t of [0.25, 0.75]) cagedLamp(A, at(t, sg, y + 1.75), 0.26, 2.6, lph(S));
  }
}
// THE LIFTS' STANDING PARTS: two guide rails behind each cage from the works' lower floor to a head beam 2 m over the
// cage's highest roof, the head beam and its sheave
export function buildLifts(A) {
  for (const b of LIFT_B) { const X = frontFrame(b, 38.5), top = K.HOMES[3] + 6.6;
    for (const e of [-1.72, 1.72]) A.beam(X(e, K.WORKS[0], 1.7), X(e, top, 1.7), 0.08, 0.08, COL.steel);
    A.beam(X(-1.8, top, 1.7), X(1.8, top, 1.7), 0.12, 0.16, COL.steel); const c = X(0, top - 0.5, 1.2); A.box(c[0], c[1], c[2], 0.5, 0.5, 0.18, yawRadial(b), COL.iron, STEEL); }
}
// the next lamp's own phase, from the 'lamps' stream's deal
const lph = (S) => S.lampPh[S.lampI++ % S.lampPh.length];
// EVERY LAMP IS A CAGED FITTING bolted to a beam, a bracket or a post: a glowing glass in a dark iron cage and cap
export function cagedLamp(A, p, s = 0.3, g = 3, ph = 0) {
  A.box(p[0], p[1], p[2], s, s * 1.15, s, 0, COL.amber, [g, 1, 0, ph]);
  A.box(p[0], p[1] + s * 1.3, p[2], s * 1.25, s * 0.18, s * 1.25, 0, COL.iron, STEEL);
  A.box(p[0], p[1] - s * 1.25, p[2], s * 1.1, s * 0.1, s * 1.1, 0, COL.iron, STEEL);
}

export function vaneList() {
  const R = K.TANGENT_R, s = Math.sqrt(68 * 68 - R * R);
  let lo = 0, hi = 22.5;
  for (let k = 0; k < 40; k++) { const d1 = (lo + hi) / 2, d2 = 22.5 - d1; const f = (s * Math.sin(d1 * D2R) - R * (1 - Math.cos(d1 * D2R))) - (s * Math.sin(d2 * D2R) + R * (1 - Math.cos(d2 * D2R))); if (f > 0) hi = d1; else lo = d1; }
  const first = 90 - (lo + hi) / 2, out = [];
  for (let j = 0; j < 16; j++) {
    const ph = first + j * 22.5, T = [bx(ph, R), bz(ph, R)], d = [-Math.cos(ph * D2R), -Math.sin(ph * D2R)];
    const s0 = Math.sqrt(K.VANE_R0 ** 2 - R * R), s1 = Math.sqrt(K.VANE_R1 ** 2 - R * R);
    out.push({ ph, nose: [T[0] + d[0] * s0, T[1] + d[1] * s0], tail: [T[0] + d[0] * s1, T[1] + d[1] * s1], d, n: [Math.sin(ph * D2R), -Math.cos(ph * D2R)] });
  }
  return out;
}
export function buildLid(A, S) {
  const c = COL.conc, c2 = mix3(COL.conc, COL.stain, 0.4);
  // THE LID IS CARRIED: a ring beam 3.2 m deep runs under the eave band, and every vane is thickened into a stout pier
  // at both its ends (2 m thick at its inner end, 2.1 m at its outer), from the sill to the beam: sixteen piers round
  // the rim and sixteen round the bowl
  A.sector(0, 360, 71.6, K.EAVE_R - 0.05, K.VANE_TOP - 3.2, K.VANE_TOP, c2, NOAUX, 64, 'uio');
  for (const v of vaneList()) { const at = (e) => [lerp(v.nose[0], v.tail[0], e), lerp(v.nose[1], v.tail[1], e)], y0 = K.SILL_Y, y1 = K.VANE_TOP;
    const P = (e, w, y) => [e[0] + v.n[0] * w, y, e[1] + v.n[1] * w];
    for (const [e0, e1, hw] of [[0, 0.17, 1.0], [0.8, 1, 1.05]]) { const a = at(e0), b = at(e1);
      A.quad(P(a, hw, y0), P(b, hw, y0), P(b, hw, y1), P(a, hw, y1), c); A.quad(P(b, -hw, y0), P(a, -hw, y0), P(a, -hw, y1), P(b, -hw, y1), c);
      A.quad(P(a, -hw, y0), P(a, hw, y0), P(a, hw, y1), P(a, -hw, y1), c2); A.quad(P(b, hw, y0), P(b, -hw, y0), P(b, -hw, y1), P(b, hw, y1), c2); } }
  // THE ROOF LIGHTS: a ring of glass stands on the shell 64 m from the axis, 64 upright panes 2.9 m high between dark
  // posts under a concrete cap; violet over the arc the 'glass' stream deals (the terraces' lamps under it), warm over
  // the rest; steady, breathing slowly on the lid's own dealt phase
  if (S && S.glass) { const R = 64, ya = 192.3, yb = 195.2, post = mul(COL.iron, 0.8);
    for (let k = 0; k < 64; k++) { const a = k * 5.625, b = a + 5.625, a1 = a + 0.4, b1 = b - 0.4, off = Math.abs(((a + 2.8 - S.glass.turn + 540) % 360) - 180);
      const col = off < 180 * S.glass.violet ? COL.violet : COL.honey, Q = (bb, r, y) => [bx(bb, r), y, bz(bb, r)];
      A.quad(Q(a1, R, ya), Q(a1, R, yb), Q(b1, R, yb), Q(b1, R, ya), col, glow(1.5, S.glass.ph));
      A.quad(Q(b1, R + 0.12, ya), Q(b1, R + 0.12, yb + 0.3), Q(b + 0.4, R + 0.12, yb + 0.3), Q(b + 0.4, R + 0.12, ya), post, STEEL);
      A.quad(Q(a, R + 0.4, yb), Q(a, R + 0.4, yb + 0.5), Q(b, R + 0.4, yb + 0.5), Q(b, R + 0.4, yb), c2);
      A.quad(Q(a, R + 0.4, yb + 0.5), Q(a, 58.5, 193.5), Q(b, 58.5, 193.5), Q(b, R + 0.4, yb + 0.5), c); } }
  for (const v of vaneList()) {
    // a vane: slim at its nose (0.5 m to each side), 0.8 m at its tail
    const P = (e, w, y) => [e[0] + v.n[0] * w, y, e[1] + v.n[1] * w];
    const y0 = K.SILL_Y, y1 = K.VANE_TOP;
    A.quad(P(v.nose, 0.5, y0), P(v.tail, 0.8, y0), P(v.tail, 0.8, y1), P(v.nose, 0.5, y1), c);
    A.quad(P(v.tail, -0.8, y0), P(v.nose, -0.5, y0), P(v.nose, -0.5, y1), P(v.tail, -0.8, y1), c);
    A.quad(P(v.nose, -0.5, y0), P(v.nose, 0.5, y0), P(v.nose, 0.5, y1), P(v.nose, -0.5, y1), c2);
    A.quad(P(v.tail, 0.8, y0), P(v.tail, -0.8, y0), P(v.tail, -0.8, y1), P(v.tail, 0.8, y1), c2);
  }
  // the eave band on the vanes, the dome's shell and its 32 ribs from the mast's hub
  A.sector(0, 360, K.VANE_R0 - 1, K.EAVE_R, K.VANE_TOP, K.EAVE_TOP, c, NOAUX, 64, 'uio');
  const N = 64, rings = [[K.EAVE_R, K.EAVE_TOP], [60, 193.2], [42, 195.8], [22, 197.4], [6, K.CROWN]];
  // THE UNDERSIDE IS A WHEEL: thirty-two ribs run out from the hub over the stair's head, and BETWEEN EVERY TWO RIBS,
  // 45 to 57 m from the axis, A ROOF LIGHT stands open to the sky through the shell's whole depth (the sky and the
  // cloud are seen through it from the bowl): a curb round it, two glazing bars across it and one along it
  const shellY = (r) => 193.2 + (195.8 - 193.2) * (60 - r) / 18, Q3 = (b, r, y) => [bx(b, r), y, bz(b, r)], bar = mul(COL.iron, 0.8);
  for (let k = 0; k < 32; k++) { const b0 = k * 11.25, e = 0.75, a = b0 + e, b = b0 + 11.25 - e;
    for (const dy of [0, -1.6]) { const up = dy === 0, strip = (ba, bb, ra, rb) => { const p = [Q3(ba, ra, shellY(ra) + dy), Q3(ba, rb, shellY(rb) + dy), Q3(bb, rb, shellY(rb) + dy), Q3(bb, ra, shellY(ra) + dy)]; if (up) A.quad(p[0], p[1], p[2], p[3], c); else A.quad(p[0], p[3], p[2], p[1], c2); };
      strip(b0, b0 + 11.25, 60, 57); strip(b0, b0 + 11.25, 45, 42); strip(b0 - e, b0 + e, 57, 45); }
    const mid = Q3(b0 + 5.625, 51, shellY(51) - 0.8), wall = (pa, pb) => A.quadOut(Q3(pa[0], pa[1], shellY(pa[1]) - 1.6), Q3(pb[0], pb[1], shellY(pb[1]) - 1.6), Q3(pb[0], pb[1], shellY(pb[1])), Q3(pa[0], pa[1], shellY(pa[1])), [2 * Q3(pa[0], pa[1], 0)[0] - mid[0] + (Q3(pb[0], pb[1], 0)[0] - Q3(pa[0], pa[1], 0)[0]), mid[1], 2 * Q3(pa[0], pa[1], 0)[2] - mid[2] + (Q3(pb[0], pb[1], 0)[2] - Q3(pa[0], pa[1], 0)[2])], c2);
    wall([a, 57], [b, 57]); wall([a, 45], [b, 45]); wall([a, 45], [a, 57]); wall([b, 45], [b, 57]);
    for (const rb of [49, 53]) A.beam(Q3(a, rb, shellY(rb) - 0.5), Q3(b, rb, shellY(rb) - 0.5), 0.07, 0.1, bar); A.beam(Q3(b0 + 5.625, 45, shellY(45) - 0.5), Q3(b0 + 5.625, 57, shellY(57) - 0.5), 0.07, 0.1, bar); }
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < N; k++) { if (j === 1) continue;
    const a = k * 360 / N, b = a + 360 / N, [r0, y0] = rings[j], [r1, y1] = rings[j + 1];
    A.quad([bx(a, r0), y0, bz(a, r0)], [bx(a, r1), y1, bz(a, r1)], [bx(b, r1), y1, bz(b, r1)], [bx(b, r0), y0, bz(b, r0)], c);
    const d = 1.6, q0 = j === 0 ? [K.VANE_R0 - 1, K.EAVE_TOP - 0.4] : [r0, y0 - d], q1 = [r1, y1 - d];
    A.quad([bx(a, q0[0]), q0[1], bz(a, q0[0])], [bx(b, q0[0]), q0[1], bz(b, q0[0])], [bx(b, q1[0]), q1[1], bz(b, q1[0])], [bx(a, q1[0]), q1[1], bz(a, q1[0])], c2);
  }
  A.cyl(0, K.EAVE_TOP, 0, 8, K.CROWN - 1.4, 8, 12, c, NOAUX, 'b');
  for (let k = 0; k < 32; k++) {
    const b = k * 11.25, w = 0.5, t = [Math.cos(b * D2R) * w, Math.sin(b * D2R) * w];
    const pr = [[8, 195.9], [22, 195.6], [42, 194], [60, 191.4]];
    for (let j = 0; j < pr.length - 1; j++) {
      const [r0, y0] = pr[j], [r1, y1] = pr[j + 1], h = 1.5;
      const Q = (r, y, s) => [bx(b, r) + t[0] * s, y, bz(b, r) + t[1] * s];
      A.quad(Q(r0, y0 - h, 1), Q(r0, y0 - h, -1), Q(r1, y1 - h, -1), Q(r1, y1 - h, 1), c);
      A.quad(Q(r0, y0 - h, 1), Q(r1, y1 - h, 1), Q(r1, y1, 1), Q(r0, y0, 1), c);
      A.quad(Q(r0, y0 - h, -1), Q(r0, y0, -1), Q(r1, y1, -1), Q(r1, y1 - h, -1), c);
    }
  }
}


// ---------------------------------------------------------------- what the seed deals inside the shaft
// Each on a named stream of its own made from the world's seed (none draws from another), taken in this order: 'stair'
// (the wear of each flight's treads), 'shaft' (where the concrete's stains lie), 'hall' (furnaces burning or in embers,
// the engines' phases), 'steam' (the jets' schedule), 'water', 'works' (each bay's trade and phase), 'homes', 'stalls',
// 'farm', 'lid', 'lamps' (every lamp's breathing phase). The plan, the storeys and the route are the same on every seed.
export const stream = (name, seed) => makeRng(hashSeed(name + ':' + seed));
const PAINT = ['#c4575f', '#3e8f86', '#c9962e', '#5b79b8'].map(lin);
const CLOTH = ['#b5382e', '#d9a21c', '#2f5fa8'].map(lin);
// the dyers' colours (madder, weld, indigo, walnut, woad): a dye works hangs lengths of ONE of them, never colours side by side
const DYE = ['#a2452f', '#c29a3a', '#34507f', '#7a5a3c', '#4a7868'].map(lin);
// EVERY ROW OF PLAIN COLOURED BANDS that stand side by side is written down here as it is built, so that it can be counted:
// nowhere do three neighbours of like width carry three different colours (cloth lines, awnings, stall cloths, loads).
const noteBands = (S, where, bands) => { if (S && S.bands) S.bands.push({ where, bands }); };
// lime wash on the house fronts: two creams, a stone grey and two green slates (the home rings' shade is carried by paint)
const PLASTER = ['#d6cbb6', '#a3b3a6', '#c9c6ba', '#d9c7b0', '#8fa399'].map(lin);
const LAMP_COUNT = 521;
export function dealTown(seed, density = 1) {
  const S = {};
  { const g = stream('stair', seed); S.wear = []; for (let i = 0; i < 90; i++) S.wear.push(g.range(0, 1)); S.doorPh = []; for (let i = 0; i < STAIR_Y.length; i++) S.doorPh.push(g.range(0.05, 1)); }
  { const g = stream('shaft', seed); S.stain = [g.range(0, 60), g.range(0, 60)]; }
  { const g = stream('hall', seed);
    // at least four of the six furnaces burn; the rest lie in embers
    S.furn = FURNACE_B.map(() => ({ on: g.chance(0.72), ph: g.range(0.02, 1) }));
    for (const f of S.furn) { if (S.furn.filter((q) => q.on).length >= 4) break; f.on = true; }
    S.fly = [0, 1, 2, 3].map((i) => ({ ph: g.range(0, TAU), period: i < 2 ? 6 : 9 }));
    S.beam = [g.range(0, TAU), g.range(0, TAU)]; S.genPh = GEN_AT.map(() => g.range(0, TAU)); S.trenchPh = TRENCH_B.map(() => g.range(0.05, 1));
    S.fireDoor = []; for (let i = 0; i < 9; i++) S.fireDoor.push(g.range(0.05, 1)); S.fireI = 0; }
  { const g = stream('steam', seed); S.steam = []; for (let i = 0; i < 10; i++) S.steam.push({ period: g.range(7, 15), ph: g.range(0, 1), k: g.range(0, 1) }); }
  { const g = stream('water', seed);
    S.barges = BERTHS.map(() => ({ len: g.range(9, 12), load: g.int(2, 5), tint: g.range(0, 1), moored: g.chance(0.3), at: g.range(-1, 1), period: g.range(90, 160), ph: g.range(0, TAU) }));
    S.wheel = WHEEL_B.map((b) => ({ b, ph: g.range(0, TAU) }));
    S.stacks = []; for (let i = 0; i < 16; i++) S.stacks.push({ b: g.range(0, 360), r: g.range(45.5, 49.5), n: g.int(1, 4), tint: g.range(0, 1) }); }
  { const g = stream('works', seed);
    S.trade = []; S.bayPh = []; S.workTint = [];
    for (let i = 0; i < 48; i++) { S.trade.push(g.int(0, 5)); S.bayPh.push(g.range(0, 1)); S.workTint.push(g.range(0, 1)); }
    S.cranePh = g.range(0, 1); S.liftPh = [g.range(0, 1), g.range(0, 1)];
    S.hammer = []; for (let i = 0; i < 48; i++) S.hammer.push({ period: g.range(3.2, 4.6), ladle: g.range(34, 50) }); }
  { const g = stream('homes', seed);
    S.houses = [];
    for (let ring = 0; ring < 4; ring++) { let last = -1, first = -1;
      for (let at = 0; at < HOUSE_N[ring]; at++) {
        // four kits; no two neighbours alike round a street (the last differs from the first too)
        let kit = g.int(0, 3); while (kit === last || (at === HOUSE_N[ring] - 1 && kit === first)) kit = (kit + 1) % 4;
        if (at === 0) first = kit; last = kit;
        const lit = []; for (let w = 0; w < 6; w++) lit.push(g.chance(0.34));
        S.houses.push({ kit, wall: g.int(0, 4), door: g.int(0, 3), shut: g.int(0, 3), lit, lampOn: g.chance(0.45), h: g.range(8.8, 10.3), awn: g.chance(0.4), awnCol: g.int(0, 2), wash: g.chance(0.42 * density), cloth: [g.int(0, 2), g.int(0, 2), g.int(0, 2)],
          box: g.chance(0.6), tub: g.chance(0.34), ph: g.range(0, 1), doorAt: g.range(-0.22, 0.22), steps: g.int(1, 3), fan: g.chance(0.5), smoke: g.chance(0.3), smokePh: g.range(0, 1), tree: [g.range(0, 1), g.range(0, 1), g.range(0, 1)] });
      } } }
  // the dyers: one dye to each PAIR of neighbouring bays (so no three bays in a row show three dyes), and each line's lengths
  { const g = stream('dye', seed); S.dye = []; S.dyeLen = []; for (let i = 0; i < 24; i++) S.dye.push(g.int(0, 4)); for (let i = 0; i < 48; i++) S.dyeLen.push(g.range(0, 1)); }
  S.bands = [];
  { const g = stream('stalls', seed); S.stalls = []; for (let i = 0; i < 10; i++) S.stalls.push({ a: g.int(0, 2), b: g.int(0, 3), ph: g.range(0, 1), on: g.chance(0.85) }); }
  { const g = stream('farm', seed);
    S.crops = []; for (let k = 0; k < 5; k++) { const arcs = []; for (let a = 0; a < 24; a++) arcs.push(g.int(0, 3)); S.crops.push(arcs); }
    S.cropPh = g.range(0, 1); S.mist = []; for (let k = 0; k < 10; k++) S.mist.push({ b: k < 5 ? g.range(0, 360) : (S.mist[k - 5].b + g.range(60, 300)) % 360, ph: g.range(0, 1) }); }
  { const g = stream('lid', seed); S.fan = [0, 1, 2, 3, 4, 5].map(() => g.range(0, TAU)); S.drip = g.range(0, 1); S.drips = []; for (let i = 0; i < 16; i++) S.drips.push([g.range(0, 1), g.range(0, 1)]); S.treePh = []; for (let i = 0; i < 6; i++) S.treePh.push([g.range(0, 1), g.range(0, 1), g.range(0, 1), g.range(0, 1)]); }
  // THE DRUMS OF GREENS: one to a terrace, each in a bay of its terrace dealt by the 'drums' stream among the bays of
  // that terrace in which no spray boom's mast stands (a terrace has two booms, so 22 bays or more are free)
  { const g = stream('drums', seed); S.drumAt = K.TERRACES.map((y, k) => { const free = []; for (let j = 0; j < 24; j++) if (!S.mist.some((m, i) => i % 5 === k && Math.floor(m.b / 15) === j)) free.push(j);
    return { k, j: free[g.int(0, free.length - 1)], ph: g.range(0, TAU) }; }); }
  // each vane's wear: where its steel strap girds it, the rust that has run from the strap, one patch of newer concrete
  { const g = stream('vanes', seed); S.vaneWear = []; for (let i = 0; i < 16; i++) { const w = { strap: g.range(8.5, 12.5), rust: [], patch: [g.range(0.12, 0.6), g.range(1.2, 6), g.range(1.6, 3), g.range(1, 2.2), g.chance(0.5) ? 1 : -1, g.range(0.8, 0.92)] };
    for (let q = 0; q < 7; q++) w.rust.push([g.range(0.06, 0.94), g.chance(0.5) ? 1 : -1, g.range(1.2, 3.8), g.range(0.1, 0.26)]); S.vaneWear.push(w); } }
  // the gallery's cable ducts: how worn each iron cover plate is
  { const g = stream('gallery', seed); S.duct = []; for (let i = 0; i < 80; i++) S.duct.push(g.range(0.8, 1.3));
    // and each generator's exhaust: how long a puff lives, its phase, its strength, its drift along the gallery
    S.exh = GEN_AT.map(() => ({ life: g.range(1.9, 2.8), ph: g.range(0, 1), k: g.range(0.7, 1), drift: g.range(-0.3, 0.3) }));
    // (the gallery's wall lamps and the two great lamps inside the mouth, each its breathing phase; the steam leaks on the vault's pipes; the warm haze under the ledge)
    S.wallLamp = []; for (let i = 0; i < 9; i++) S.wallLamp.push(g.range(0.05, 1)); S.leak = [0, 1, 2, 3].map(() => ({ ph: g.range(0, 1), life: g.range(2.6, 3.8) }));
    S.haze = [0, 1, 2, 3, 4].map(() => ({ x: g.range(-9, 9), y: g.range(17, 21), z: g.range(-46, -27), ph: g.range(0, 1), life: g.range(9, 12) })); }
  // the hall's floor: each drain grating's stain (how far it has spread, how dark) and where the two flanges sit on
  // each pier line's pipe run
  { const g = stream('floor', seed); S.grate = []; for (let i = 0; i < 12; i++) S.grate.push({ stain: g.range(1.2, 2.4), tone: g.range(0.4, 0.56) });
    S.flange = PIPE_OUT.map(() => [g.range(40, 44.5), g.range(46, 51.5)]); }
  // EVERY LAMP BREATHES ON A PHASE OF ITS OWN: the 'lamps' stream deals a phase for each fitting, taken in the order the fittings are bolted on
  // (521 caged lamps stand in the shaft, the same on every visit: one dealt phase to each, taken in the order they are built)
  { const g = stream('lamps', seed); S.lampPh = []; for (let i = 0; i < LAMP_COUNT; i++) S.lampPh.push(g.range(0.05, 1)); S.lampI = 0; }
  // 'glass': our own lid's roof lights (where its violet arc lies, how wide it is, its breathing phase)
  { const g = stream('glass', seed); S.glass = { turn: g.range(0, 360), violet: g.range(0.3, 0.7), ph: g.range(0.05, 1) }; }
  // 'bays': what grows and what stands in each bay of the farm terraces. NO BAY REPEATS ITS NEIGHBOUR: a bay under a
  // grow-light rack stands between two bays without one; a bay's planting (cane, leafy rows, vines on frames, low
  // greens) is never its neighbour's; a rack is never as long as the next rack round, nor a bay's fitting (a potting
  // shed, tanks, a seed store, a stair to the next ring, an orchard) the same as the next fitted bay's.
  { const g = stream('bays', seed); S.bays = [];
    for (let k = 0; k < 5; k++) { const row = [];
      for (let j = 0; j < 24; j++) row.push({ crop: g.int(0, 3), feat: g.int(0, 4), len: g.int(0, 2), bloom: g.chance(0.45), tint: g.int(0, 3), ph: g.range(0.05, 1), h: g.range(0, 1) });
      for (let j = 0; j < 24; j++) { const b = row[j], prev = row[(j + 23) % 24], next = row[(j + 1) % 24], p2 = row[(j + 22) % 24], n2 = row[(j + 2) % 24];
        while (b.crop === prev.crop || (j === 23 && b.crop === next.crop)) b.crop = (b.crop + 1) % 4;
        while (b.feat === p2.feat || (j >= 22 && b.feat === n2.feat)) b.feat = (b.feat + 1) % 5;
        while (b.len === p2.len || (j >= 22 && b.len === n2.len)) b.len = (b.len + 1) % 3; }
      S.bays.push(row); } }
  // 'wheels': the phase of each of the fifteen lamps on the wall behind the three water wheels
  { const g = stream('wheels', seed); S.wheelLamp = []; for (let i = 0; i < 15; i++) S.wheelLamp.push(g.range(0.05, 1)); }
  // 'lantern': the breathing phase of each of the twelve glass shafts of the great lantern, and its motes
  { const g = stream('lantern', seed); S.lantern = { ph: [], motes: [] }; for (let i = 0; i < 12; i++) S.lantern.ph.push(g.range(0.05, 1));
    for (let i = 0; i < 140; i++) S.lantern.motes.push({ b: g.range(0, 360), r: g.range(16.2, 21.8), y: g.range(134, 188), vy: g.range(-0.22, 0.12), dr: g.range(-0.12, 0.12), life: g.range(7, 13), ph: g.range(0, 1) }); }
  return S;
}
export { PAINT, CLOTH, PLASTER, DYE };

// ---------------------------------------------------------------- dress: what stands in each storey
const glow = (g, ph = 0) => [g, 1, 0, ph];
// a fire's face: it breathes by the fires' rule on its own phase (0 to 1, never 0)
const fire = (g, ph) => [g, 1, 1, ph];
// a works bay's own phase as its fire and its light read it
const bayW = (S, id) => 0.02 + 0.96 * S.bayPh[id];
const STILL = [0, 5, 0, 0], leafAux = (sway, ph) => [0, 2, sway, ph];
// a frame on a front: x metres along the front (toward rising bearing), y height, d metres deeper into the ring (away from the axis)
function frontFrame(bc, r) {
  const T = [Math.cos(bc * D2R), Math.sin(bc * D2R)], N = [Math.sin(bc * D2R), -Math.cos(bc * D2R)], C = [bx(bc, r), bz(bc, r)];
  return (x, y, d = 0) => [C[0] + T[0] * x + N[0] * d, y, C[1] + T[1] * x + N[1] * d];
}
// a flat panel on a front, facing the axis; and a box in a front's frame
const face = (A, X, x0, x1, y0, y1, d, col, aux = NOAUX) => A.quad(X(x0, y0, d), X(x1, y0, d), X(x1, y1, d), X(x0, y1, d), col, aux);
function blk(A, X, bc, x0, x1, y0, y1, d0, d1, col, aux = NOAUX) { const m = X((x0 + x1) / 2, (y0 + y1) / 2, (d0 + d1) / 2); A.box(m[0], m[1], m[2], (x1 - x0) / 2, (y1 - y0) / 2, (d1 - d0) / 2, yawRadial(bc), col, aux); }
// a drum lying on its side: centre c, axis ax (level, unit), radius R, length L
function drumH(A, c, ax, R, L, sides, col, aux = STEEL, capCol = null) {
  const sd = [-ax[2], 0, ax[0]], P = (k, e) => { const a = k / sides * TAU, co = Math.cos(a) * R, si = Math.sin(a) * R; return [c[0] + ax[0] * e * L / 2 + sd[0] * si, c[1] + co, c[2] + ax[2] * e * L / 2 + sd[2] * si]; };
  for (let k = 0; k < sides; k++) {
    A.quadOut(P(k, -1), P(k + 1, -1), P(k + 1, 1), P(k, 1), c, col, aux);
    for (const e of [-1, 1]) { const q = [c[0] + ax[0] * e * L / 2, c[1], c[2] + ax[2] * e * L / 2]; const a = P(k, e), b = P(k + 1, e); A.triOut(q, a, b, c, capCol || col, aux); }
  }
}
export function buildHall(A, S) {
  const iron = COL.iron, teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55), cst = mix3(COL.conc, COL.stain, 0.6);
  // six furnace mouths in the bell wall: hooded slots 6 m wide and 2.5 m high behind iron grates (burning or in embers by the deal)
  FURNACE_B.forEach((b, i) => {
    const X = frontFrame(b, 59.7), f = S.furn[i];
    face(A, X, -3, 3, 2, 4.5, 0, f.on ? COL.furnace : COL.ember, fire(f.on ? 2.4 : 0.55, f.ph));
    for (let k = 0; k <= 8; k++) blk(A, X, b, -3 + k * 0.75 - 0.07, -3 + k * 0.75 + 0.07, 1.9, 4.6, -0.35, -0.2, iron, STEEL);
    // (the hearth and the jambs are brick)
    blk(A, X, b, -3.3, 3.3, 1.2, 1.9, -1.5, 0, BRICK); for (const e of [-1, 1]) blk(A, X, b, e * 3.42 - 0.34, e * 3.42 + 0.34, 1.9, 4.6, -0.55, 0, BRICK);
    blk(A, X, b, -3.7, 3.7, 4.6, 5.5, -1.9, 0, iron, STEEL);
    blk(A, X, b, -1.2, 1.2, 5.5, K.BELL_TOP - K.SLAB, -1.3, 0, rusty, STEEL);
  });
  // three copper boilers lying between the furnaces, four trunk pipes 3 m across up the bell wall, gone to verdigris
  for (const b of [105, 135, 161]) { const c = P3(b, 48.5, 3.4), ax = [Math.cos(b * D2R), 0, Math.sin(b * D2R)];
    drumH(A, c, ax, 2.3, 13, 12, COPPER, STEEL, rusty); for (const e of [-4.5, 0, 4.5]) drumH(A, [c[0] + ax[0] * e, c[1], c[2] + ax[2] * e], ax, 2.42, 0.5, 12, rusty);
    for (const e of [-4, 4]) A.box(c[0] + ax[0] * e, 0.6, c[2] + ax[2] * e, 0.5, 0.6, 2, yawRadial(b), cst); }
  for (const b of [75, 195, 225, 255]) { const p = P3(b, 57.6, 0); A.cyl(p[0], 0, p[2], 1.5, K.BELL_TOP - K.SLAB, 1.5, 10, VERDIGRIS, STEEL, ''); for (const y of [6, 13, 20]) A.cyl(p[0], y, p[2], 1.68, y + 0.5, 1.68, 10, rusty, STEEL, 'tb'); }
  // the flywheels' pits and bearing blocks (the wheels themselves turn: see the movers)
  for (const [x, z] of PITS) { const w = PIT.HW, l = PIT.HL, d = -PIT.DEEP, dk = mul(cst, 0.55), mid = [x, d / 2, z];
    A.quad([x - w, d, z - l], [x - w, d, z + l], [x + w, d, z + l], [x + w, d, z - l], mul(cst, 0.4));
    A.quadOut([x - w, d, z - l], [x + w, d, z - l], [x + w, 0, z - l], [x - w, 0, z - l], [x, d / 2, z - 2 * l], dk); A.quadOut([x - w, d, z + l], [x + w, d, z + l], [x + w, 0, z + l], [x - w, 0, z + l], [x, d / 2, z + 2 * l], dk);
    A.quadOut([x - w, d, z - l], [x - w, d, z + l], [x - w, 0, z + l], [x - w, 0, z - l], [x - 2 * w, d / 2, z], dk); A.quadOut([x + w, d, z - l], [x + w, d, z + l], [x + w, 0, z + l], [x + w, 0, z - l], [x + 2 * w, d / 2, z], dk);
    void mid;
    // the bearing blocks stand at the pit's two edges; the axle runs through the wheel's hub from block to block
    // (on the side away from the gallery's line a concrete block; on the line's side a slim dark steel trestle, so that no pale block stands before a wheel)
    { const sd = Math.sign(x - K.GALLERY_X), xo = x + sd * 2.4, xi = x - sd * 2.4, hb = (FLY.Y - 0.25) / 2; A.box(xo, hb, z, 0.5, hb, 1.5, 0, cst); A.box(xo, FLY.Y + 0.2, z, 0.62, 0.45, 0.9, 0, iron, STEEL);
      for (const e of [-1.5, 1.5]) A.beam([xi, 0, z + e], [xi, FLY.Y - 0.2, z], 0.13, 0.13, iron); A.box(xi, FLY.Y, z, 0.3, 0.4, 0.55, 0, iron, STEEL); }
    drumH(A, [x, FLY.Y, z], [1, 0, 0], 0.3, 6, 8, iron, STEEL); }
  // the two beam engines' standing parts east of the stair's foot: a tall trestle, a cylinder at one end, a crank block at the other
  ENGINE_B.forEach((b) => { const T = [Math.cos(b * D2R), 0, Math.sin(b * D2R)], c = P3(b, 26, 0), Q = (e, y) => [c[0] + T[0] * e, y, c[2] + T[2] * e];
    for (const e of [-2.2, 2.2]) for (const w of [-1, 1]) { const o = P3(b, 26 + w * 1.4, 0); A.beam([o[0] + T[0] * e, 0, o[2] + T[2] * e], [o[0], 12.6, o[2]], 0.28, 0.28, teal); }
    const q = Q(-8.6, 0); A.cyl(q[0], 0, q[2], 1.7, 7.5, 1.7, 10, rusty, STEEL, 't'); const k = Q(8.6, 1.6); A.box(k[0], 1.6, k[2], 1.6, 1.6, 1.3, yawRadial(b), cst); });
  // THE GENERATOR DRUMS' NICHES (the drums themselves turn: see the movers): a buttress 1.6 m wide stands 5 m out from
  // the gallery's wall midway between drums and beyond the last, a lintel of brick-red painted concrete spans from buttress to buttress over each
  // drum; in each niche a low bed, and a pedestal at each end of the drum up to its axle
  for (const sx of [-1, 1]) { const zz = GEN_AT.filter((g) => Math.sign(g[0] - K.GALLERY_X) === sx).map((g) => g[1]), xm = K.GALLERY_X + sx * 17.5;
    for (const z of [...zz.map((q) => q - 10), Math.max(...zz) + 10]) A.box(xm, 4.4, z, 2.5, 4.4, 0.8, 0, cst);
    for (const z of zz) A.box(xm, 8.4, z, 2.5, 0.4, 9.2, 0, BRICK); }
  for (const g of GEN_AT) { A.box(g[0], 0.25, g[1], 2, 0.25, 4.4, 0, cst); for (const e of [-4.75, 4.75]) { A.box(g[0], 1.75, g[1] + e, 0.9, 1.75, 0.3, 0, cst); A.box(g[0], 3.55, g[1] + e, 0.5, 0.35, 0.36, 0, iron, STEEL); } }
  // the sump under the spillway: a kerbed basin of dark water
  A.sector(166, 194, 31.5, 47, 0, 0.55, COL.deep, STILL, 8, 't'); A.sector(165, 195, 30.8, 31.5, 0, 0.9, cst, NOAUX, 8, 'tio');
  // lamps: two on every pier, on steel brackets; four along the gallery's crown
  PIER_B.forEach((b, i) => { for (const [r, y, rw] of [[47, 9, 48.6], [41.2, 20, 42.6]]) { A.beam(P3(b, rw, y + 0.5), P3(b, r, y + 0.5), 0.08, 0.08, iron); cagedLamp(A, P3(b, r, y), 0.42, 3.2, lph(S)); } });
  for (let z = -130; z <= -70; z += 20) { A.beam([-30, 20, z], [-30, 19.7, z], 0.1, 0.1, iron); cagedLamp(A, [-30, 19.2, z], 0.45, 3.2, lph(S)); }
  // THE GALLERY'S WALL LAMPS: a caged lamp on a bracket on the face of every buttress along both walls (at z -110, -90
  // and -70, and at -50 on the west wall, which runs farther), 6.4 m over the floor, each breathing on its dealt phase
  { let q = 0; for (const sx of [-1, 1]) for (const z of sx < 0 ? [-110, -90, -70, -50] : [-110, -90, -70]) { const xf = K.GALLERY_X + sx * 15, xl = K.GALLERY_X + sx * 14.3;
    A.beam([xf, 7.05, z], [xl, 7.05, z], 0.06, 0.06, iron); A.box(xf - sx * 0.05, 6.6, z, 0.05, 0.75, 0.3, 0, iron, STEEL); cagedLamp(A, [xl, 6.4, z], 0.4, 3.2, S.wallLamp[q++]); } }
  // TWO GREAT LAMPS hang under the ledge just inside the gallery's mouth, on the line's own axis 6 m over it, each
  // under a wide steel shade on a rod from the slab
  [-42, -30].forEach((z, i) => { A.beam([-30, K.BELL_TOP - K.SLAB, z], [-30, 16.4, z], 0.07, 0.07, iron); A.cyl(-30, 15.6, z, 1.7, 16.4, 0.25, 12, iron, STEEL, 'b'); cagedLamp(A, [-30, 15, z], 0.8, 3.6, S.wallLamp[7 + i]); });
  // THE VAULT'S RIBS: a dark stained concrete arch rib 1 m wide and 1 m deep over each drum (z -120, -100, -80, -60), from lintel
  // to lintel (the crown lamps hang midway between ribs)
  for (const [z, w, dp] of [[-120, 0.5, 0.5], [-100, 0.5, 0.5], [-80, 0.5, 0.5], [-60, 0.5, 0.5]]) { const pr = (t) => [K.GALLERY_X + (20 - dp) * Math.cos(Math.PI * (1 - t)), 10 + (10 - dp) * Math.sin(Math.PI * t), z], cr = mix3(COL.conc, COL.stain, 0.8);
    for (let i = 0; i < 12; i++) A.beam(pr(i / 12), pr((i + 1) / 12), w, dp, cr, NOAUX);
    for (const sx of [-1, 1]) A.box(K.GALLERY_X + sx * (20 - dp), 9.5, z, dp, 0.7, w, 0, cr); }
  // PIPES UNDER THE VAULT: two runs to each side of the crown, 9 and 13.5 m from the axis, hung 1.2 m under the vault (under the ribs) on
  // strap hangers every 10 m, flanged every 20 m, from the north end wall to the mouth, where each turns up into the vault
  for (const sx of [-1, 1]) for (const [d, r, c] of [[9, 0.24, rusty], [13.5, 0.32, VERDIGRIS]]) { const x = K.GALLERY_X + sx * d, y = vaultY(d) - 1.2 - r, z1 = -Math.sqrt(K.BELL_R * K.BELL_R - x * x) - 1.2, z0 = K.GALLERY_Z0;
    drumH(A, [x, y, (z0 + z1) / 2], [0, 0, 1], r, z1 - z0, 8, c, STEEL); A.beam([x, y, z1], [x, vaultY(d), z1], r, r, c);
    for (let z = -125; z < z1 - 1; z += 10) A.beam([x, y + r, z], [x, vaultY(d), z], 0.04, 0.12, iron);
    for (let z = -115; z < z1 - 1; z += 20) drumH(A, [x, y, z], [0, 0, 1], r + 0.09, 0.22, 8, iron, STEEL); }
  // THE GALLERY'S FLOOR: a cable duct under iron cover plates runs along each side, 10 m from the gallery's axis, from
  // the north end to a junction box short of the mouth; a cross duct runs in to it from every drum's bed. So between
  // the track on the axis and the walls no stretch of floor wider than 11.4 m lies bare (8.6 m from track to duct). Each plate's wear (how pale it is worn and how far rusted)
  // is dealt ('gallery').
  for (const sx of [-1, 1]) { const x = K.GALLERY_X + sx * 10; let q = sx < 0 ? 0 : 40;
    for (let z = -128; z < -48.5; z += 2) { const d = S.duct[q++], c = mix3(mul(iron, 1.5 * d), COL.rust, (d - 0.8) * 0.9); A.quad([x - 0.5, 0.03, z + 0.04], [x - 0.5, 0.03, z + 1.96], [x + 0.5, 0.03, z + 1.96], [x + 0.5, 0.03, z + 0.04], c, STEEL); }
    A.quad([x - 0.62, 0.02, -128.1], [x - 0.62, 0.02, -47.9], [x + 0.62, 0.02, -47.9], [x + 0.62, 0.02, -128.1], cst);
    A.box(x, 0.45, -47.2, 0.7, 0.45, 0.6, 0, iron, STEEL); A.beam([x, 0.9, -47.2], [x, 2.6, -47.2], 0.07, 0.07, iron); }
  // each generator's EXHAUST STACK: a pipe from its north bearing out to a stack that stands clear in front of the
  // niche's hood and ends in a cowl 10 m over the floor, where its steam puffs (the hero's media)
  for (const g of GEN_AT) { const e = EXH_AT(g), rusty2 = mix3(COL.steel, COL.rust, 0.55);
    A.beam([g[0], 3.55, e[2]], [e[0], 3.55, e[2]], 0.15, 0.15, rusty2); A.beam([e[0], 0, e[2]], [e[0], 9.7, e[2]], 0.2, 0.2, rusty2); A.box(e[0], 0.2, e[2], 0.45, 0.2, 0.45, 0, cst);
    for (const y of [3.55, 7]) A.box(e[0], y, e[2], 0.27, 0.07, 0.27, 0, iron, STEEL); A.box(e[0], 9.85, e[2], 0.3, 0.15, 0.3, 0, iron, STEEL); }
  for (const g of GEN_AT) { const sx = Math.sign(g[0] - K.GALLERY_X), x0 = K.GALLERY_X + sx * 10.5, x1 = g[0] - sx * 2; A.quad([Math.min(x0, x1), 0.03, g[1] - 0.3], [Math.min(x0, x1), 0.03, g[1] + 0.3], [Math.max(x0, x1), 0.03, g[1] + 0.3], [Math.max(x0, x1), 0.03, g[1] - 0.3], mul(iron, 1.1), STEEL); }
}
// THE GENERATOR DRUMS lie in niches at an even pitch of 20 m along the gallery's two walls (z -120, -100, -80 ... for
// as far as each wall runs clear of the bell: the west wall to z -60, the east wall to z -80), 17 m to each hand
// of the gallery's axis, a drum in each, turning
// (where a generator's exhaust stack ends: 2.5 m toward the gallery's axis from the drum's own axis, at its north bearing)
export const EXH_AT = (g) => [g[0] - Math.sign(g[0] - K.GALLERY_X) * 2.5, 10.1, g[1] - 4.75];
export const GEN_AT = [-1, 1].flatMap((sx) => [-120, -100, -80, -60, -40].filter((z) => Math.hypot(K.GALLERY_X + sx * 20, z + 9) > K.BELL_R + 1).map((z) => [K.GALLERY_X + sx * 17, z]));
// THE TWO BEAM ENGINES stand before the piers at bearings 60 and 120 (the piers on either side of the first two furnace
// bays, whose boilers feed them), 26 m from the axis, each with its beam along the tangent
export const ENGINE_B = [60, 120];
// THE HALL'S FLOOR AND WALL BAYS, BY RULE (within 40 m of the flown line no stretch of floor wider than 12 m lies bare):
//  a RAIL LOOP for the ash tubs round the stair's foot, 23 m from the axis (open for 30 degrees where the east
//  flywheel's pit lies across its line), with a track out along the gallery's axis to its north end by way of a turntable;
//  a GRATED TRENCH on the middle bearing of every bay but the one the gallery's track runs out through (315), from
//  31 m out to 50 m; in the sump's two bays (165, 195) it is the basin's overflow and runs from its far edge, 47.5 m
//  out, to 55 m; in the bay of 285 it begins 45 m out, clear of the west flywheel's pit: an iron grating over a flue, embers glowing under the gratings that run to
//  the furnace bays, a pipe under the others;
//  a PIPE RUN on every pier line from the pier's foot in to a valve chest by the rail loop: two pipes on sleeper
//  blocks, a flange on each at a dealt place ('floor'). On the two lines where a beam engine stands it is the
//  engine's one steam main, from the pier's foot to the engine. On the line of 270 the run stops 35 m out, short of
//  the turntable; on the line of 180 it ends in the sump (the intake); the line of 300 carries none (the flywheels'
//  pits lie across it);
//  a FLOOR GRATING over a drain pit on the middle bearing of every bay, 16 m from the axis (between the stair's
//  foot and the rail loop), with the dark stain of what has run to it ('floor');
//  and EVERY WALL BAY between two piers holds something: furnace mouths behind their grates (bays 90 to 180), a pipe
//  gallery joined to the bay's trunk pipe with a lamp niche and a hatch (the bays of the four trunk pipes), or a bank
//  of three boiler fronts with rungs up to a hatch (the other bays).
export const TRENCH_B = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => 15 + 30 * k).filter((b) => b !== 315);
// (how far out a bay's trench begins and ends)
export const trenchR = (b) => (Math.abs(b - 180) < 16 ? [47.5, 55] : b === 285 ? [45, 50] : [31, 50]);
const TRUNK_B = [75, 195, 225, 255], HOT_BAYS = [105, 135, 165], COPPER = lin('#b0733c'), BRICK = lin('#8e3b2c'), VERDIGRIS = lin('#4f8f7c');
// (the pier lines whose pipe run reaches the pier's foot: all but the sump's line and the pits' line)
export const PIPE_OUT = PIER_B.filter((b) => b !== 180 && b !== 300);
export function buildHallFloor(A, S) {
  const iron = COL.iron, teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55), cst = mix3(COL.conc, COL.stain, 0.6), sleeper = mul(COL.wood, 0.5);
  // the rail loop and the gallery's track
  // (the loop is open between bearings 285 and 315, where the east flywheel's pit lies across its line: a buffer stop at each end)
  for (const a of [285, 315]) { const c = P3(a, 23, 0.4); A.box(c[0], 0.4, c[2], 0.8, 0.4, 0.14, yawRadial(a) + Math.PI / 2, sleeper); }
  const rail = lin('#c4c8d0');   // (worn bright: the lamps' pools show on the rails)
  for (let k = 0; k < 48; k++) { const a = k * 7.5, b = a + 7.5; if (a >= 285 && b <= 315) continue; for (const r of [22.6, 23.4]) A.beam(P3(a, r, 0.09), P3(b, r, 0.09), 0.05, 0.07, rail);
    for (const e of [1.9, 5.6]) A.quad(HX(a + e, 22.25, -0.11, 0.03), HX(a + e, 23.75, -0.11, 0.03), HX(a + e, 23.75, 0.11, 0.03), HX(a + e, 22.25, 0.11, 0.03), sleeper); }
  for (const e of [-0.4, 0.4]) { A.beam([K.GALLERY_X + e, 0.09, K.GALLERY_Z0 + 2], [K.GALLERY_X + e, 0.09, -7.2], 0.06, 0.07, rail); A.beam([K.GALLERY_X + e, 0.09, -4], [-22.8 + e * 0.2, 0.09, -3.04 + e], 0.05, 0.07, rail); }
  for (let z = K.GALLERY_Z0 + 3; z < -8; z += 1.5) A.quad([K.GALLERY_X - 0.75, 0.03, z - 0.11], [K.GALLERY_X - 0.75, 0.03, z + 0.11], [K.GALLERY_X + 0.75, 0.03, z + 0.11], [K.GALLERY_X + 0.75, 0.03, z - 0.11], sleeper);
  A.cyl(K.GALLERY_X, 0, -4, 3.2, 0.14, 3.2, 16, mul(iron, 1.15), STEEL, 't');
  // the grated trenches
  TRENCH_B.forEach((b, i) => { const hot = HOT_BAYS.includes(b), [r0, r1] = trenchR(b), w = 0.8;
    A.quad(HX(b, r0, -w, 0.04), HX(b, r0, w, 0.04), HX(b, r1, w, 0.04), HX(b, r1, -w, 0.04), hot ? COL.ember : [0.03, 0.032, 0.04], hot ? fire(0.9, S.trenchPh[i]) : STEEL);
    if (!hot) A.beam(HX(b, r0 + 0.3, 0.25, 0.1), HX(b, r1 - 0.3, 0.25, 0.1), 0.22, 0.1, rusty);
    for (const e of [-w - 0.1, w + 0.1]) A.beam(HX(b, r0, e, 0.12), HX(b, r1, e, 0.12), 0.1, 0.12, cst, NOAUX);
    for (let r = r0 + 0.3; r < r1; r += 0.6) A.quad(HX(b, r - 0.07, -w, 0.24), HX(b, r - 0.07, w, 0.24), HX(b, r + 0.07, w, 0.24), HX(b, r + 0.07, -w, 0.24), iron, STEEL); });
  // the pipe runs on the pier lines
  for (const b of PIER_B) { if (b === 300) continue;
    const eng = ENGINE_B.includes(b), r0 = eng ? 30 : b === 270 ? 35 : 27.5, r1 = b === 180 ? 38.7 : 53.4, fl = S.flange[PIPE_OUT.indexOf(b)] || [];
    for (const e of eng ? [0] : [-0.5, 0.5]) { A.beam(HX(b, r0, e, 0.5), HX(b, r1, e, 0.5), 0.26, 0.26, e < 0 ? teal : rusty);
      fl.forEach((r, q) => { const c = HX(b, r + (e > 0 ? 0.9 : 0), e, 0.5); A.box(c[0], 0.5, c[2], 0.38, 0.38, 0.09, yawRadial(b), q ? iron : cst, STEEL); }); }
    for (let r = Math.ceil(r0) + 1.5; r < r1; r += 4) A.box(bx(b, r), 0.14, bz(b, r), eng ? 0.55 : 1, 0.14, 0.3, yawRadial(b), cst);
    if (eng || b === 270) continue;
    const c = P3(b, 26.7, 0.7); A.box(c[0], 0.7, c[2], 0.9, 0.7, 0.7, yawRadial(b), teal, STEEL); A.cyl(c[0], 1.4, c[2], 0.5, 1.5, 0.5, 8, rusty, STEEL, 't'); }
  // the floor gratings round the stair's foot: a frame, seven bars over the dark of the pit, and the stain round it
  S.grate.forEach((gq, k) => { const b = 15 + 30 * k, c = P3(b, 16, 0);
    A.cyl(c[0], 0.012, c[2], gq.stain, 0.014, gq.stain * 0.86, 8, mul(COL.stain, gq.tone), NOAUX, 't');
    A.box(c[0], 0.02, c[2], 0.8, 0.02, 0.8, yawRadial(b), [0.03, 0.032, 0.04], STEEL);
    for (const e of [-0.8, 0.8]) { A.beam(HX(b, 16 + e, -0.8, 0.06), HX(b, 16 + e, 0.8, 0.06), 0.05, 0.04, iron); A.beam(HX(b, 15.2, e, 0.06), HX(b, 16.8, e, 0.06), 0.05, 0.04, iron); }
    for (let q = -3; q <= 3; q++) A.beam(HX(b, 16 + q * 0.2, -0.76, 0.07), HX(b, 16 + q * 0.2, 0.76, 0.07), 0.035, 0.03, iron); });
  // the wall bays
  for (let k = 0; k < 10; k++) { const mid = 15 + 30 * k, X = frontFrame(mid, 59.5);
    if (mid > 90 && mid < 180) continue;
    if (TRUNK_B.includes(mid)) {
      // a pipe gallery: two runs across the bay on brackets, joined to the trunk pipe; a lamp niche; a hatch
      for (const [y, R, col] of [[6.5, 0.45, teal], [11.5, 0.3, rusty]]) { A.beam(X(-11, y, -1.3), X(11, y, -1.3), R, R, col); for (const e of [-10, -5, 5, 10]) { A.beam(X(e, y - R, -1.3), X(e, y - R - 0.6, 0), 0.08, 0.08, iron); A.quad(X(e - 0.12, y - R - 3.4, -0.03), X(e + 0.12, y - R - 3.4, -0.03), X(e + 0.1, y - R - 0.6, -0.03), X(e - 0.1, y - R - 0.6, -0.03), mix3(COL.rust, COL.stain, 0.5)); } }
      A.cyl(X(-6.5, 6.5, -1.95)[0], 6.2, X(-6.5, 6.5, -1.95)[2], 0.55, 6.8, 0.55, 8, rusty, STEEL, 'tb');
      face(A, X, 5.2, 7.2, 0, 3.4, -0.04, [0.03, 0.032, 0.04], STEEL); face(A, X, 5.45, 6.95, 0, 3.1, -0.07, mul(COL.conc, 0.5)); cagedLamp(A, X(6.2, 2.5, -0.5), 0.3, 2.2, lph(S));
      blk(A, X, mid, -7.6, -5.9, 0, 2.3, -0.16, 0, rusty, STEEL); blk(A, X, mid, -7.8, -5.7, 2.3, 2.5, -0.24, 0, iron, STEEL);
    } else {
      // a bank of three boiler fronts under a steam drum, each with its fire door; iron rungs up to a hatch
      for (const e of [-5.2, 0, 5.2]) { blk(A, X, mid, e - 2, e + 2, 0, 5.4, -1.4, 0, e ? rusty : teal, STEEL); face(A, X, e - 0.55, e + 0.55, 1.1, 1.9, -1.43, COL.ember, fire(0.55, S.fireDoor[S.fireI++ % S.fireDoor.length]));
        blk(A, X, mid, e - 0.75, e + 0.75, 0.9, 1.1, -1.6, -1.4, iron, STEEL); A.beam(X(e + 1.3, 5.4, -0.7), X(e + 1.3, 7.4, -0.7), 0.12, 0.12, teal); }
      drumH(A, X(0, 8.4, -1.2), [Math.cos(mid * D2R), 0, Math.sin(mid * D2R)], 1.25, 14.5, 10, teal, STEEL, rusty);
      for (const e of [-9.6, -9]) A.beam(X(e, 0, -0.12), X(e, 19, -0.12), 0.035, 0.035, iron); for (let y = 0.5; y < 19; y += 0.5) A.quad(X(-9.6, y - 0.03, -0.14), X(-9, y - 0.03, -0.14), X(-9, y + 0.03, -0.14), X(-9.6, y + 0.03, -0.14), iron, STEEL);
      blk(A, X, mid, -10.1, -8.5, 19, 21.2, -0.14, 0, rusty, STEEL);
    } }
}
export function buildWaterRing(A, S, rare) {
  const iron = COL.iron, teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55);
  // the ring canal: still dark water between its lip and the quay
  A.sector(0, 360, 36, 42, 28, 28.35, COL.deep, STILL, 72, 't');
  // THE SPILLWAY at bearing 180: the canal brims over a concrete weir 17 m long that stands 0.7 m out from the ledge;
  // eight splitters on its crest part the water, which falls clear as a curtain of strands into the sump, 27 m below
  { const R0 = 34.3, half = 8.6, n = 14, prof = [[35.7, 28.34], [34.95, 28.3], [34.6, 28.05], [34.38, 27.3], [R0, 26], [R0, 0.6]], cst = mix3(COL.conc, COL.stain, 0.6);
    A.sector(165.5, 194.5, 34.62, 35.7, 26.5, 28.22, cst, NOAUX, 8, 'uie'); A.sector(165.5, 194.5, 35.0, 36.05, 28, 28.34, COL.deep, STILL, 8, 't');
    for (let k = -4; k < 4; k++) { const b = 180 + (k * 2.2 + 1.1) / (34.7 * D2R); A.sector(b - 0.28, b + 0.28, 34.42, 35.1, 27.9, 28.95, mul(cst, 0.8), NOAUX, 1, 'tioe'); }
    let drop = 0;
    for (let j = 0; j < prof.length - 1; j++) { const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], d0 = drop; drop += Math.hypot(r1 - r0, y1 - y0);
      for (let k = 0; k < n; k++) { const x0 = -half + 2 * half * k / n, x1 = x0 + 2 * half / n, b0 = 180 + x0 / (R0 * D2R), b1 = 180 + x1 / (R0 * D2R);
        (A.water || A).quadAux(P3(b0, r0, y0), P3(b1, r0, y0), P3(b1, r1, y1), P3(b0, r1, y1), COL.foam, [[half, 3, x0, d0], [half, 3, x1, d0], [half, 3, x1, drop], [half, 3, x0, drop]]); } }
    // white foam where the curtain strikes the sump's water, ragged toward its rim
    for (let k = 0; k < n; k++) { const b0 = 164.5 + 31 * k / n, b1 = 164.5 + 31 * (k + 1) / n, e0 = k === 0 ? 1 : 0, e1 = k === n - 1 ? 1 : 0;
      for (const [ra, rb, za, zb] of [[32.2, R0, 1, 0], [R0, 37, 0, 1]]) A.quadAux(P3(b0, ra, 0.6), P3(b0, rb, 0.6), P3(b1, rb, 0.6), P3(b1, ra, 0.6), COL.foam, [[0, 7, Math.max(za, e0), 0], [0, 7, Math.max(zb, e0), 0], [0, 7, Math.max(zb, e1), 0], [0, 7, Math.max(za, e1), 0]]); } }
  // THREE FALLS: each runs out along a riveted steel spout that stands 1.8 m out from the bowl's lip, leaves its end
  // 2.1 m wide (2.5 m on a rare visit), and drops clear 84 m onto a steel apron over its wheel's crown, where it breaks
  // in white foam; the wheel's foot churns the canal white
  S.wheel.forEach((w, wi) => { const w0 = rare ? 1.5 : 1.3, xc = 0.6, X = frontFrame(w.b, 38.5), prof = [[1.4, 125.62], [-1.3, 125.6], [-1.6, 125.45], [-1.85, 124.95], [-1.97, 123.9], [-2, 41.32]];
    let drop = -2.7;
    for (let j = 0; j < prof.length - 1; j++) { const [d0, y0] = prof[j], [d1, y1] = prof[j + 1], q0 = Math.max(drop, 0); drop += Math.hypot(d1 - d0, y1 - y0); const q1 = Math.max(drop, 0);
      if (j === 0) { A.quad(X(xc - w0, y0, d1), X(xc + w0, y0, d1), X(xc + w0, y0, d0), X(xc - w0, y0, d0), COL.deep, STILL); continue; }
      (A.water || A).quadAux(X(xc - w0, y0, d0), X(xc + w0, y0, d0), X(xc + w0, y1, d1), X(xc - w0, y1, d1), COL.foam, [[w0, 3, -w0, q0], [w0, 3, w0, q0], [w0, 3, w0, q1], [w0, 3, -w0, q1]]); }
    blk(A, X, w.b, xc - w0 - 0.25, xc + w0 + 0.25, 124.9, 125.2, -1.3, 1.4, rusty, STEEL); for (const e of [xc - w0 - 0.25, xc + w0 + 0.25]) blk(A, X, w.b, e - 0.1, e + 0.1, 125.2, 126.3, -1.3, 1.4, teal, STEEL);
    for (const d of [-1.2, 0]) blk(A, X, w.b, xc - w0 - 0.4, xc + w0 + 0.4, 124.6, 124.9, d - 0.08, d + 0.08, teal, STEEL);
    // THE FALL'S SOURCE IS SEEN: the lowest terrace's drain, a rusty pipe 2.4 m across, lies in the spout's cradle from
    // the bed behind it and ends over the spout's lip; the water runs out of the lower half of its dark mouth
    { const Nn = [Math.sin(w.b * D2R), 0, -Math.cos(w.b * D2R)]; drumH(A, X(xc, 126.15, 0.97), Nn, 1.2, 4.66, 12, rusty, STEEL, [0.02, 0.025, 0.03]);
      for (const d of [-1.0, 1.2]) drumH(A, X(xc, 126.15, d), Nn, 1.3, 0.28, 12, teal, STEEL); }
    // THE FALL LANDS IN A TROUGH: a riveted steel trough over the wheel's crown (walled on three sides, open at the end
    // where it pours onto the wheel's falling side), carried on A PLAIN STRONG FRAME: four stout posts, two on the
    // canal's lip and two on the quay, each on a foot plate that is seen, a beam under the trough from post to post, a
    // tie along each side (none crosses the wheel)
    blk(A, X, w.b, -2.6, 3.8, 41.0, 41.2, -3.2, 1.7, rusty, STEEL);
    blk(A, X, w.b, -2.6, 3.8, 41.2, 42.1, -3.2, -3.05, rusty, STEEL); blk(A, X, w.b, -2.6, 3.8, 41.2, 42.1, 1.55, 1.7, rusty, STEEL); blk(A, X, w.b, -2.6, -2.45, 41.2, 42.1, -3.05, 1.55, rusty, STEEL);
    for (const d of [-3.28, 1.78]) blk(A, X, w.b, -2.7, 3.9, 42.1, 42.22, d - 0.1, d + 0.1, teal, STEEL);
    (A.water || A).quadAux(X(3.8, 41.3, -1.2), X(3.8, 41.3, 0.4), X(4.05, 38.9, 0.4), X(4.05, 38.9, -1.2), COL.foam, [[0.8, 3, -0.8, 0], [0.8, 3, 0.8, 0], [0.8, 3, 0.8, 2.4], [0.8, 3, -0.8, 2.4]]);
    for (const e of [-2.4, 3.6]) { for (const [d, yf] of [[-2.85, 28.6], [3.75, 28.4]]) { A.beam(X(e, yf, d), X(e, 41.0, d), 0.17, 0.17, teal); const f = X(e, yf + 0.07, d); A.box(f[0], f[1], f[2], 0.42, 0.07, 0.42, yawRadial(w.b), iron, STEEL); }
      A.beam(X(e, 40.84, -3.0), X(e, 40.84, 3.9), 0.14, 0.15, teal); }
    for (const d of [-2.85, 3.75]) A.beam(X(-2.4, 37.9, d), X(3.6, 37.9, d), 0.1, 0.1, teal);
    // THE WALL BEHIND THE WHEEL IS LIT: five caged lamps on brackets on the bore's wall, 7 degrees apart, 10 m over the quay (their
    // light is the water ring's named light on that wall; each lamp's phase from the 'wheels' stream)
    for (let q = -2; q <= 2; q++) { A.beam(P3(w.b + q * 7, 51.9, 39.0), P3(w.b + q * 7, 50.9, 39.0), 0.07, 0.07, iron); cagedLamp(A, P3(w.b + q * 7, 50.9, 38.5), 0.42, 3.2, S.wheelLamp[wi * 5 + q + 2]); }
    // foam: on the apron where the fall strikes it, and on the canal at the wheel's foot (its middle white, its rim ragged)
    for (const [cx, cd, y, hx, hd] of [[xc, -1.9, 41.33, 2.3, 1], [0, 0.5, 28.38, 3.6, 2.4]]) for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU, c = X(cx, y, cd);
      A.quadAux(c, X(cx + Math.cos(a0) * hx, y, cd + Math.sin(a0) * hd), X(cx + Math.cos(a1) * hx, y, cd + Math.sin(a1) * hd), c, COL.foam, [[0, 7, 0, 0], [0, 7, 1, 0], [0, 7, 1, 0], [0, 7, 0, 0]]); }
    // the wheel's trestles: from the canal's lip and from the quay up to its axle, which runs through the hub from trestle to trestle
    for (const [r0, r1] of [[35.6, 36.85], [42.5, 41.15]]) for (const e of [-2, 2]) A.beam([bx(w.b, r0) + Math.cos(w.b * D2R) * e, 28.6, bz(w.b, r0) + Math.sin(w.b * D2R) * e], P3(w.b, r1, 34.4), 0.26, 0.26, teal);
    drumH(A, P3(w.b, 39, 34.4), [Math.sin(w.b * D2R), 0, -Math.cos(w.b * D2R)], 0.25, 4.6, 8, iron, STEEL); });
  // the lock: two gates across the canal with their balance beams, and a derrick on the quay beside it
  for (const b of [312, 324]) { const X = frontFrame(b, 39); blk(A, X, b, -0.25, 0.25, 27.9, 30.4, -3, 3, mix3(COL.wood, COL.iron, 0.4), STEEL); A.beam(X(0, 30.6, -3.4), X(0, 30.6, 6.5), 0.22, 0.22, COL.wood); }
  { const b = 300, base = P3(b, 45.5, 28.4), top = P3(b, 45.5, 39), tip = P3(b + 4, 39.6, 37.6);
    A.beam(base, top, 0.3, 0.3, teal); A.beam(top, tip, 0.2, 0.2, teal); A.beam([base[0], 31, base[2]], tip, 0.14, 0.14, teal); A.beam(tip, [tip[0], 33.4, tip[2]], 0.04, 0.04, iron); A.box(tip[0], 32.4, tip[2], 1, 1, 1, yawRadial(b), COL.wood); }
  // a steel rail on the canal's lip, painted ochre (open at the spillway), crates on the quay
  for (let k = 0; k < 36; k++) { const a = k * 10, b = a + 10; if (a >= 160 && b <= 200) continue;
    A.beam(P3(a, 35.5, 30.1), P3(b, 35.5, 30.1), 0.06, 0.06, PAINT[2]); A.beam(P3(a, 35.5, 28.9), P3(a, 35.5, 30.1), 0.06, 0.06, PAINT[2]); }
  for (const s of S.stacks) { if (QUAY_B.some((q) => gapAt(s.b, q, 9))) continue; const col = mix3(COL.wood, COL.rust, s.tint * 0.5);
    for (let k = 0; k < s.n; k++) { const p = P3(s.b + (k % 2) * 2.4, s.r, 28.4 + 0.8 + Math.floor(k / 2) * 1.6); A.box(p[0], p[1], p[2], 0.85, 0.8, 0.85, yawRadial(s.b), col); } }
  // QUAY LAMPS: six groups of three standards (the canal bridge, the three wheels, the south lift, the lock); dark water between
  QUAY_B.forEach((q, i) => { for (const e of [-7, 0, 7]) { const p = P3(q + e, 43.2, 28.4); A.beam(p, [p[0], 33.2, p[2]], 0.09, 0.09, iron); cagedLamp(A, [p[0], 33.6, p[2]], 0.4, 3.2, lph(S)); } });
}
// THE BORE'S WALL OVER THE QUAY (from the quay at y 28.4 to the works' soffit, 20 m high, all round): between its 24
// ribs it carries, by rule: a pipe run and a cable run right round on brackets at the ribs (rust has run down the wall
// under every bracket); the mark of an old floor (a broken ledge with a row of empty beam pockets under it); and in
// each bay, in turn round the wall, an iron hatch at the quay with rungs over it, a drain mouth with the stain of what
// has run from it, or an arched lamp niche.
export function buildWallDress(A, S) {
  const iron = COL.iron, teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55), cst = mix3(COL.conc, COL.stain, 0.6), dark = [0.03, 0.032, 0.04], R = K.BORE_R, y0 = K.BELL_TOP + 0.4;
  for (let k = 0; k < 48; k++) { const a = k * 7.5, b = a + 7.5; A.beam(P3(a, 50.25, 37.2), P3(b, 50.25, 37.2), 0.26, 0.26, k % 6 < 3 ? teal : rusty); A.beam(P3(a, 50.45, 44.6), P3(b, 50.45, 44.6), 0.2, 0.07, iron); }
  for (let k = 0; k < 24; k++) { const rib = k * 15, mid = rib + 7.5, X = frontFrame(mid, R - 0.02);
    for (const y of [36.85, 44.45]) A.beam(P3(rib, 50.7, y), P3(rib, 50.2, y), 0.3, 0.06, iron);
    A.quad(HX(rib, 50.68, -0.16, 30.5), HX(rib, 50.68, 0.16, 30.5), HX(rib, 50.68, 0.13, 36.8), HX(rib, 50.68, -0.13, 36.8), mix3(COL.rust, COL.stain, 0.45));
    // the old floor's mark
    blk(A, X, mid, -5.2, 5.2, 40.2, 40.45, -0.16, 0, cst); for (const e of [-4, -1.4, 1.4, 4]) face(A, X, e - 0.25, e + 0.25, 39.4, 39.95, -0.01, dark, STEEL);
    if (k % 3 === 0) { blk(A, X, mid, -0.9, 0.9, y0, y0 + 2.4, -0.14, 0, rusty, STEEL); blk(A, X, mid, -1.05, 1.05, y0 + 2.4, y0 + 2.62, -0.22, 0, iron, STEEL);
      for (let y = y0 + 3.2; y < 36.4; y += 0.5) A.quad(X(-0.3, y - 0.03, -0.12), X(0.3, y - 0.03, -0.12), X(0.3, y + 0.03, -0.12), X(-0.3, y + 0.03, -0.12), iron, STEEL); }
    else if (k % 3 === 1) { blk(A, X, mid, -0.55, 0.55, 41.4, 42.3, -0.3, 0, cst); face(A, X, -0.38, 0.38, 41.52, 42.18, -0.31, dark, STEEL);
      A.quad(X(-0.75, y0, -0.012), X(0.75, y0, -0.012), X(0.42, 41.4, -0.012), X(-0.42, 41.4, -0.012), mul(COL.stain, 0.5)); }
    else { face(A, X, -1, 1, y0 + 1.6, y0 + 4, -0.012, dark, STEEL); face(A, X, -0.6, 0.6, y0 + 4, y0 + 4.6, -0.012, dark, STEEL); face(A, X, -0.8, 0.8, y0 + 1.6, y0 + 4, -0.03, mul(COL.conc, 0.42));
      blk(A, X, mid, -1.2, 1.2, y0 + 1.4, y0 + 1.6, -0.25, 0, cst); cagedLamp(A, X(0, y0 + 3.2, -0.45), 0.3, 2.4, lph(S)); }
  }
}
// THE WORKS: two rings of 24 arched bays between the rib lines. Each arch reads by its dark concrete rim and by the lit
// machines inside it; no arch carries a lit outline. A caged lamp on a bracket at every pier, one deep in every bay.
export function buildWorks(A, S, only = -1) {
  const c = COL.conc, cst = mix3(COL.conc, COL.stain, 0.6), rim = mul(COL.stain, 0.42), iron = COL.iron, teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55);
  K.WORKS.forEach((F, ring) => {
    if (only >= 0 && ring !== only) return;
    const top = F + (ring === 0 ? 10.5 : 10), ys = F + 5.2, RA = 3.7;
    for (let k = 0; k < 24; k++) {
      const bc = k * 15 + 7.5, X = frontFrame(bc, K.FRONT_R + 0.05), id = ring * 24 + k, trade = S.trade[id], ph = S.bayPh[id], inn = X(0, F + 4, 4);
      if (notched(bc - 4) || notched(bc + 4)) { face(A, X, -5.1, 5.1, F, top, 1.5, cst); continue; }
      // the front wall with its arched opening, the dark rim round the opening, the reveal
      face(A, X, -5.1, -RA, F, top, 0, c); face(A, X, RA, 5.1, F, top, 0, c);
      face(A, X, -RA - 0.5, -RA, F, ys, -0.2, rim); face(A, X, RA, RA + 0.5, F, ys, -0.2, rim);
      A.quadOut(X(-RA, F, -0.2), X(-RA, ys, -0.2), X(-RA, ys, 0.9), X(-RA, F, 0.9), X(-RA - 1, F + 2, 0.4), rim); A.quadOut(X(RA, F, -0.2), X(RA, ys, -0.2), X(RA, ys, 0.9), X(RA, F, 0.9), X(RA + 1, F + 2, 0.4), rim);
      for (let j = 0; j < 8; j++) { const t0 = Math.PI * j / 8, t1 = Math.PI * (j + 1) / 8, P = (t, R, d) => X(R * Math.cos(t), ys + R * Math.sin(t), d);
        A.quadOut(P(t0, RA, 0), P(t1, RA, 0), X(RA * Math.cos(t1), top, 0), X(RA * Math.cos(t0), top, 0), inn, c);
        A.quadOut(P(t0, RA, -0.2), P(t1, RA, -0.2), P(t1, RA + 0.5, -0.2), P(t0, RA + 0.5, -0.2), inn, rim);
        A.quadOut(P(t0, RA, -0.2), P(t1, RA, -0.2), P(t1, RA, 0.9), P(t0, RA, 0.9), X(0, top + 3, 0.4), rim); }
      // the room behind: its two side walls (the back is the shaft's wall)
      A.quadOut(X(-5.1, F, 0.9), X(-5.1, top, 0.9), X(-5.6, top, 12.6), X(-5.6, F, 12.6), X(-9, F + 4, 6), cst); A.quadOut(X(5.1, F, 0.9), X(5.1, top, 0.9), X(5.6, top, 12.6), X(5.6, F, 12.6), X(9, F + 4, 6), cst);
      // a steel rail across the mouth, a lamp on the pier's bracket, a lamp bolted under a beam deep in the bay
      A.beam(X(-RA, F + 1.15, -0.05), X(RA, F + 1.15, -0.05), 0.06, 0.06, teal); A.beam(X(-RA, F + 0.6, -0.05), X(RA, F + 0.6, -0.05), 0.04, 0.04, teal);
      if ((k * 15 - 30 * ring + 360) % 45 === 0) { A.beam(P3(k * 15, K.FRONT_R, F + 7.1), P3(k * 15, 38.5, F + 7.1), 0.07, 0.07, iron); cagedLamp(A, P3(k * 15, 38.5, F + 6.6), 0.34, 3, lph(S)); }
      A.beam(X(-5.2, F + 9.1, 7.4), X(5.2, F + 9.1, 7.4), 0.16, 0.22, teal); cagedLamp(A, X(trade === 3 ? 2.7 : trade === 2 ? -1.1 : 0, F + 8.4, 7.45), 0.3, 2.6, lph(S));
      const B = (x0, x1, y0, y1, d0, d1, col, aux = NOAUX) => blk(A, X, bc, x0, x1, F + y0, F + y1, d0, d1, col, aux);
      if (trade === 0) { // a forge: hearth, the fire in its slot, an iron hood and flue, an anvil
        B(-1.6, 1.6, 0, 1.7, 8.2, 10.8, cst); face(A, X, -1.1, 1.1, F + 0.5, F + 1.35, 8.18, COL.furnace, fire(2.2, bayW(S, id)));
        B(-2, 2, 3.2, 4.6, 7.6, 10.9, iron, STEEL); B(-0.7, 0.7, 4.6, top - F, 8.8, 10.4, rusty, STEEL); B(-0.5, 0.5, 0, 1, 4.6, 5.6, iron, STEEL);
      } else if (trade === 1) { // a drop hammer: two columns, a head, the tup, the anvil block
        for (const e of [-1.3, 1.3]) A.beam(X(e, F, 6), X(e, F + 7.4, 6), 0.28, 0.28, teal);
        B(-1.8, 1.8, 7.4, 8.3, 5.4, 6.6, teal, STEEL); B(-1.1, 1.1, 0, 1.2, 5.3, 6.7, cst);
      } else if (trade === 2) { // a line shaft with belt wheels over two benches
        for (const e of [-4.9, 4.9]) A.beam(X(e, F + 7.6, 5.5), X(e, F + 9.1, 7.2), 0.1, 0.1, iron);
        for (const [e, R] of [[-2.6, 1.3], [0.4, 1.7], [3, 1.1]]) A.beam(X(e, F + 7.52 - R, 5.52), X(e, F + 1.4, 6.6), 0.16, 0.03, COL.wood);
        B(-3.6, -1.2, 0, 1.3, 6, 7.6, COL.wood); B(1, 3.6, 0, 1.3, 6, 7.6, COL.wood);
      } else if (trade === 3) { // a foundry: a ladle on its rail, glowing, and moulds on the floor
        A.beam(X(-0.2, F + 8.95, 1.2), X(-0.2, F + 8.95, 12), 0.14, 0.2, teal);
        for (const e of [-2.6, 1.8, 3.2]) { B(e - 0.5, e + 0.5, 0, 0.5, 4.4, 5.6, cst); face(A, X, e - 0.3, e + 0.3, F + 0.52, F + 0.53, 5, COL.ember, fire(0.9, bayW(S, id))); }
      } else if (trade === 4) { // a dye works: vats, and long cloths hung to dry in the bay's mouth
        // (the bay's ONE dye is in both vats and on every length; lengths unequal, 1.5 m wide with 0.9 m of air between)
        const dye = DYE[S.dye[id >> 1]], row = [];
        for (const [e, dk] of [[-2.2, 1], [1.9, 0.62]]) { const v = X(e, F, 6.5); A.cyl(v[0], F, v[2], 1.5, F + 1.5, 1.5, 10, COL.wood, NOAUX, ''); A.cyl(v[0], F + 1.4, v[2], 1.4, F + 1.42, 1.4, 10, mul(dye, dk), STEEL, 't'); }
        A.beam(X(-3.5, F + 8.6, 1.6), X(3.5, F + 8.6, 1.6), 0.06, 0.06, iron);
        for (let q = 0; q < 3; q++) { const x0 = -3.15 + q * 2.4, len = [7.3, 4.9, 6.1][(q + id) % 3] + 0.5 * S.dyeLen[id] * (1 - 0.35 * q);
          A.quad(X(x0, F + 8.6 - len, 1.6), X(x0 + 1.5, F + 8.6 - len, 1.6), X(x0 + 1.5, F + 8.6, 1.6), X(x0, F + 8.6, 1.6), dye, leafAux(0.22, ph + q * 0.3)); row.push({ w: 1.5, col: dye }); }
        noteBands(S, 'dye line, works bay ' + id, row);
      } else { // a store: crates and barrels
        for (let q = 0; q < 5; q++) B(-3.4 + q * 1.5, -2.1 + q * 1.5, (q % 2) * 1.3, 1.3 + (q % 2) * 1.3, 5 + (q % 3), 6.3 + (q % 3), mix3(COL.wood, COL.rust, S.workTint[id] * 0.5));
        const v = X(2.6, F, 9); A.cyl(v[0], F, v[2], 0.8, F + 1.8, 0.8, 8, rusty, STEEL, 't');
      }
    }
    // the dyers' bays that stand side by side on this ring, written down as one row (each bay one dye; pairs of bays share)
    { let row = []; for (let k = 0; k <= 24; k++) { const id = ring * 24 + k, dyer = k < 24 && S.trade[id] === 4 && !(notched(k * 15 + 3.5) || notched(k * 15 + 11.5));
        if (dyer) row.push({ w: 7.4, col: DYE[S.dye[id >> 1]] }); else { if (row.length) noteBands(S, 'dyers side by side, works ring ' + ring, row); row = []; } } }
  });
}
// THE HOME STREETS: four rings 13 m apart. On each thick floor: a parapet at the edge, an open street 5.5 m wide, then
// 34, 32, 35 and 33 house fronts (no two streets alike) 7.5 m wide and about 10 m high standing free under the soffit (four kits: gabled, flat with a
// balcony, bay-fronted, stepped; no two neighbours alike). Steps, tubs, plain cloths on lines and lamps stand in the
// street. About one window in three is lit; the colour is carried by paint.
// a wall panel on a front's plane d with openings cut in it: the wall is laid in level bands between the openings' sills and heads
function holedWall(A, X, x0, x1, y0, y1, d, holes, colAt) {
  const ys = [...new Set([y0, y1, ...holes.flatMap((h) => [h.y0, h.y1])].filter((y) => y >= y0 && y <= y1))].sort((a, b) => a - b);
  for (let q = 0; q < ys.length - 1; q++) { const ya = ys[q], yb = ys[q + 1], ym = (ya + yb) / 2, cut = holes.filter((h) => h.y0 < ym && h.y1 > ym).sort((a, b) => a.x0 - b.x0); let x = x0;
    for (const h of cut) { if (h.x0 > x + 1e-3) face(A, X, x, h.x0, ya, yb, d, colAt(ym)); x = Math.max(x, h.x1); }
    if (x1 > x + 1e-3) face(A, X, x, x1, ya, yb, d, colAt(ym)); }
}
// a ledge standing proud of a front (a sill, a lintel, a cornice): its face, its top and its underside
function ledge(A, X, x0, x1, y0, y1, d0, d1, col) {
  face(A, X, x0, x1, y0, y1, d0, col); const m = X((x0 + x1) / 2, (y0 + y1) / 2, (d0 + d1) / 2);
  A.quadOut(X(x0, y1, d0), X(x1, y1, d0), X(x1, y1, d1), X(x0, y1, d1), m, col); A.quadOut(X(x0, y0, d0), X(x1, y0, d0), X(x1, y0, d1), X(x0, y0, d1), m, mul(col, 0.7));
}
// AN OPENING SITS BACK 0.32 m IN ITS REVEAL: the jambs, the head and the sill's bed; a lintel over it and a sill under it stand proud of the wall
const REVEAL = 0.32;
function reveal(A, X, h, d, stone, sill = true) {
  const c = mul(stone, 0.78), xm = (h.x0 + h.x1) / 2, ym = (h.y0 + h.y1) / 2, D = REVEAL;
  A.quadOut(X(h.x0, h.y0, d), X(h.x0, h.y1, d), X(h.x0, h.y1, d + D), X(h.x0, h.y0, d + D), X(h.x0 - 1, ym, d), c);
  A.quadOut(X(h.x1, h.y0, d), X(h.x1, h.y1, d), X(h.x1, h.y1, d + D), X(h.x1, h.y0, d + D), X(h.x1 + 1, ym, d), c);
  A.quadOut(X(h.x0, h.y1, d), X(h.x1, h.y1, d), X(h.x1, h.y1, d + D), X(h.x0, h.y1, d + D), X(xm, h.y1 + 1, d), mul(c, 0.8));
  A.quadOut(X(h.x0, h.y0, d), X(h.x1, h.y0, d), X(h.x1, h.y0, d + D), X(h.x0, h.y0, d + D), X(xm, h.y0 - 1, d), stone);
  ledge(A, X, h.x0 - 0.18, h.x1 + 0.18, h.y1, h.y1 + 0.24, d - 0.09, d, stone);
  if (sill) ledge(A, X, h.x0 - 0.12, h.x1 + 0.12, h.y0 - 0.16, h.y0, d - 0.16, d, stone);
}
// a mass of leaves: a low round ball of six sides (never a cone)
function leafBall(A, c, r, col, aux, squash = 0.86) {
  const n = 6, lat = [-0.5, 0.42], P = (k, s, tw) => { const a = (k + tw) / n * TAU, q = Math.sqrt(1 - s * s) * r; return [c[0] + Math.cos(a) * q, c[1] + s * r * squash, c[2] + Math.sin(a) * q]; }, top = [c[0], c[1] + r * squash, c[2]], bot = [c[0], c[1] - r * squash, c[2]];
  for (let k = 0; k < n; k++) { A.triOut(bot, P(k, lat[0], 0), P(k + 1, lat[0], 0), c, mul(col, 0.72), aux); A.quadOut(P(k, lat[0], 0), P(k + 1, lat[0], 0), P(k + 1, lat[1], 0.5), P(k, lat[1], 0.5), c, col, aux); A.triOut(P(k, lat[1], 0.5), P(k + 1, lat[1], 0.5), top, c, mul(col, 1.12), aux); }
}
// A SMALL FRUIT TREE IN A TUB: a short trunk and a round crown of four leaf masses, under 4 m from the floor to its top
function tubTree(A, Sf, t, y, sway, ph, k = [0.5, 0.5, 0.5]) {
  A.cyl(t[0], y, t[2], 0.75, y + 0.9, 0.85, 8, mix3(COL.rust, COL.stain, 0.3), NOAUX, 't'); A.beam([t[0], y + 0.9, t[2]], [t[0], y + 2.5, t[2]], 0.09, 0.09, COL.wood, NOAUX);
  const a = k[0] * TAU, R = 0.8 + 0.12 * k[1];
  leafBall(Sf, [t[0], y + 2.75, t[2]], R + 0.1, COL.leafDeep, leafAux(sway, ph));
  for (let q = 0; q < 3; q++) { const b = a + q * TAU / 3; leafBall(Sf, [t[0] + Math.cos(b) * 0.62, y + 2.55 + 0.22 * ((q + Math.round(k[2] * 2)) % 3), t[2] + Math.sin(b) * 0.62], R * 0.78, q % 2 ? COL.leaf : mix3(COL.leaf, COL.leafDeep, 0.5), leafAux(sway * 1.3, ph + q * 0.17)); }
}
const ROOF = ['#7a4a38', '#5c6470', '#6f5a48'].map(lin), LINEN = [[0.80, 0.78, 0.72], [0.72, 0.76, 0.80], [0.82, 0.74, 0.62]];
// (only: one ring of the four; lot: 0, 1 or 2 for a third of the ring's fronts, -1 all)
export function buildHomes(A, S, detail = 1, only = -1, lot = -1) {
  const Sf = A.soft || A, cst = mix3(COL.conc, COL.stain, 0.6), glass = [0.05, 0.06, 0.085], iron = COL.iron, W = 3.75;
  K.HOMES.forEach((F, ring) => {
    if (only >= 0 && ring !== only) return;
    const N = HOUSE_N[ring];
    for (let i = lot < 0 ? 0 : Math.ceil(N * lot / 3); i < (lot < 0 ? N : Math.ceil(N * (lot + 1) / 3)); i++) {
      const id = HOUSE_BASE[ring] + i, h = S.houses[id], bc = (i + 0.5) * 360 / N, X = frontFrame(bc, K.HOUSE_R), wall = PLASTER[h.wall], kit = h.kit, roof = ROOF[(h.wall + kit) % 3], inn = X(0, F + 4, 4);
      const top = F + (kit === 0 || kit === 3 ? 9.7 + (h.h - 8.8) * 0.4 : h.h), eave = kit === 0 ? top - 2.3 : kit === 3 ? top - 2.4 : top - 0.5;
      // EACH FRONT SHOWS ITS WEAR: a stained foot, and a paler band under the eave where the rain never runs
      const wearAt = (y) => mul(wall, y < F + 0.9 ? 0.64 : y < F + 1.7 ? 0.86 : y > eave - 1 ? 1.1 : 1);
      const dx = kit === 2 ? (h.doorAt > 0 ? 2.55 : -2.55) : h.doorAt * 5, sill = 0.3 * h.steps, holes = [], wins = [];
      // the openings: the door (a painted leaf under a fanlight), the windows of both floors
      holes.push({ x0: dx - 0.95, x1: dx + 0.95, y0: F + sill, y1: F + sill + 4, door: true });
      const win = (x, y0, y1, w, lit, shut, d = 0) => { const o = { x0: x - w, x1: x + w, y0: F + y0, y1: F + y1, lit, shut, d }; (d ? wins : holes).push(o); };
      for (const e of [-1, 1]) { const gx = dx + e * 2.5; if (Math.abs(gx) < W - 0.9 && kit !== 2) win(gx, 1.7, 3.9, 0.7, h.lit[e > 0 ? 0 : 1], false); }
      if (kit !== 2) for (let q = 0; q < 3; q++) win(-2.3 + q * 2.3, 5.3, 7.2, 0.62, h.lit[2 + q], true);
      else for (const e of [-0.85, 0.85]) { win(e, 1.8, 3.9, 0.6, h.lit[e > 0 ? 2 : 3], false, -1.1); win(e, 5.2, 7.1, 0.6, h.lit[e > 0 ? 4 : 5], false, -1.1); }
      holedWall(A, X, -W, W, F, eave, 0, kit === 2 ? [holes[0], { x0: -1.75, x1: 1.75, y0: F + 0.9, y1: F + 7.6 }] : holes, wearAt);
      A.quadOut(X(-W, F, 0), X(-W, eave, 0), X(-W - 0.6, eave, 7.4), X(-W - 0.6, F, 7.4), inn, mul(wall, 0.8)); A.quadOut(X(W, F, 0), X(W, eave, 0), X(W + 0.6, eave, 7.4), X(W + 0.6, F, 7.4), inn, mul(wall, 0.8));
      // the bay of a bay-fronted house: it stands 1.1 m out, with its own windows and its own little roof
      if (kit === 2) { holedWall(A, X, -1.75, 1.75, F + 0.9, F + 7.6, -1.1, wins, wearAt);
        for (const e of [-1.75, 1.75]) A.quadOut(X(e, F + 0.9, -1.1), X(e, F + 7.6, -1.1), X(e, F + 7.6, 0), X(e, F + 0.9, 0), X(0, F + 4, -0.5), mul(wall, 0.82));
        A.quadOut(X(-1.75, F + 0.9, -1.1), X(1.75, F + 0.9, -1.1), X(1.75, F + 0.9, 0), X(-1.75, F + 0.9, 0), X(0, F + 4, -0.5), mul(wall, 0.6)); ledge(A, X, -2.05, 2.05, F + 7.6, F + 7.9, -1.5, 0, roof); }
      // glass, leaf and reveal of every opening; shutters stand off the wall on their hinges
      for (const o of [...holes, ...wins]) { const d = o.d || 0; reveal(A, X, o, d, cst, !o.door);
        if (o.door) { face(A, X, o.x0, o.x1, o.y0, o.y0 + 3.2, d + REVEAL, PAINT[h.door], STEEL); face(A, X, o.x0, o.x1, o.y0 + 3.2, o.y0 + 3.32, d + REVEAL - 0.05, mul(cst, 0.8));
          face(A, X, o.x0, o.x1, o.y0 + 3.32, o.y1, d + REVEAL, h.fan ? COL.honey : glass, h.fan ? glow(1.5, h.ph * 0.9 + 0.03) : STEEL); continue; }
        const xm = (o.x0 + o.x1) / 2;
        face(A, X, o.x0, o.x1, o.y0, o.y1, d + REVEAL, o.lit ? ((i + Math.round(xm)) % 3 === 0 ? COL.peach : COL.honey) : glass, o.lit ? glow(1.8, h.ph * 0.9 + 0.05 + 0.01 * xm) : STEEL);
        face(A, X, xm - 0.035, xm + 0.035, o.y0, o.y1, d + REVEAL - 0.03, mul(cst, 0.5));
        if (o.shut) { for (const e of [-1, 1]) { const xh = e < 0 ? o.x0 - 0.04 : o.x1 + 0.04, a = X(xh, o.y0, d - 0.05), b = X(xh + e * 0.5, o.y0, d - 0.24), c = X(xh + e * 0.5, o.y1, d - 0.24), q = X(xh, o.y1, d - 0.05);
            A.quadOut(a, b, c, q, X(xh, o.y0, d + 1), PAINT[h.shut], STEEL); A.quadOut(a, b, c, q, X(xh + e, o.y0, d - 1), mul(PAINT[h.shut], 0.6), STEEL); }
          if (h.box && detail > 0.7) blk(Sf, X, bc, o.x0, o.x1, o.y0 - 0.02, o.y0 + 0.32, d - 0.56, d - 0.2, (i + Math.round(xm)) % 2 ? COL.leaf : mix3(COL.leaf, COL.rose, 0.45), leafAux(0.03, h.ph)); } }
      // ROOFS: eaves and gables overhang half a metre, each with its fascia and the underside of its overhang
      const slopes = (ye, yr) => { const sl = (yr - ye) / W; for (const e of [-1, 1]) { const xe = e * (W + 0.5), y0 = ye - 0.5 * sl;
          A.quadOut(X(xe, y0, -0.5), X(0, yr + 0.08, -0.5), X(0, yr + 0.08, 7.4), X(xe, y0, 7.4), X(0, F, 3), roof, STEEL);
          A.quadOut(X(xe, y0, -0.5), X(0, yr + 0.08, -0.5), X(0, yr - 0.14, -0.5), X(xe, y0 - 0.22, -0.5), X(0, F, 3), mul(roof, 0.8), STEEL);
          A.quadOut(X(xe, y0 - 0.22, -0.5), X(0, yr - 0.14, -0.5), X(0, yr - 0.14, 0), X(xe, y0 - 0.22, 0), X(0, top + 5, -0.2), mul(roof, 0.5), STEEL); } };
      if (kit === 0) { const hw = (y) => W * (1 - (y - eave) / (top - eave)), a = eave + 0.35, b = eave + 1.35, o = { x0: -0.5, x1: 0.5, y0: a, y1: b };
        // the gable, with a small attic window set back in it
        A.quad(X(-W, eave, 0), X(W, eave, 0), X(hw(a), a, 0), X(-hw(a), a, 0), mul(wall, 1.1)); A.quad(X(-hw(a), a, 0), X(-0.5, a, 0), X(-0.5, b, 0), X(-hw(b), b, 0), mul(wall, 1.1));
        A.quad(X(0.5, a, 0), X(hw(a), a, 0), X(hw(b), b, 0), X(0.5, b, 0), mul(wall, 1.1)); A.tri(X(-hw(b), b, 0), X(hw(b), b, 0), X(0, top, 0), mul(wall, 1.1));
        reveal(A, X, o, 0, cst, true); face(A, X, -0.5, 0.5, a, b, REVEAL, h.lit[5] ? COL.honey : glass, h.lit[5] ? glow(1.8, h.ph * 0.9 + 0.05) : STEEL); slopes(eave, top); }
      else if (kit === 3) { for (let t = 0; t < 3; t++) { const x1 = W - 1.05 * (t + 1); face(A, X, -x1, x1, eave + 0.8 * t, eave + 0.8 * (t + 1), 0, mul(wall, 1.1)); ledge(A, X, -x1 - 0.12, x1 + 0.12, eave + 0.8 * (t + 1) - 0.14, eave + 0.8 * (t + 1), -0.14, 0.3, cst); }
        ledge(A, X, -W - 0.5, W + 0.5, eave - 0.2, eave, -0.5, 0, cst); slopes(eave, top - 0.4); }
      else { ledge(A, X, -W - 0.5, W + 0.5, eave, top, -0.5, 0, mul(wall, 0.84)); A.quadOut(X(-W - 0.5, top, -0.5), X(W + 0.5, top, -0.5), X(W + 0.6, top, 7.4), X(-W - 0.6, top, 7.4), X(0, F, 3), roof, STEEL); }
      // the door's steps; ITS LAMP stands by the door, on a bracket on the door's inner side
      for (let s = 0; s < h.steps; s++) blk(A, X, bc, dx - 1.3, dx + 1.3, F + 0.3 * s, F + 0.3 * (s + 1), -0.45 * (h.steps - s), 0, cst);
      const lx = doorLampX(h, kit); A.beam(X(lx, F + 4.75, 0), X(lx, F + 4.75, -0.6), 0.05, 0.05, iron); cagedLamp(A, X(lx, F + 4.3, -0.6), 0.24, h.lampOn ? 2.8 : 0.12, lph(S));
      // a brick chimney stack on the roof of each house that keeps a stove lit, with its pot
      if (h.smoke) { const cx = chimneyX(h), ct = chimneyTop(h, F); blk(A, X, bc, cx - 0.36, cx + 0.36, eave - 0.3, ct, 1, 1.7, mix3(COL.rust, COL.stain, 0.45)); blk(A, X, bc, cx - 0.2, cx + 0.2, ct, ct + 0.3, 1.15, 1.55, COL.iron, STEEL); }
      // a balcony on its brackets, with a steel rail
      if (kit === 1) { ledge(A, X, -2.3, 2.3, F + 4.55, F + 4.8, -1.3, 0, cst); for (const e of [-2.3, 2.3]) A.quadOut(X(e, F + 4.55, -1.3), X(e, F + 4.8, -1.3), X(e, F + 4.8, 0), X(e, F + 4.55, 0), X(0, F + 4.7, -0.6), cst);
        A.beam(X(-2.3, F + 5.9, -1.25), X(2.3, F + 5.9, -1.25), 0.05, 0.05, iron); for (const e of [-2.3, 0, 2.3]) A.beam(X(e, F + 4.8, -1.25), X(e, F + 5.9, -1.25), 0.05, 0.05, iron); }
      // an awning of plain cloth over the door
      if (h.awn) { noteBands(S, 'awning, house ' + id, [{ w: 3.2, col: CLOTH[h.awnCol] }]);
        Sf.quadOut(X(dx - 1.6, F + sill + 4.6, -0.1), X(dx + 1.6, F + sill + 4.6, -0.1), X(dx + 1.6, F + sill + 3.8, -1.9), X(dx - 1.6, F + sill + 3.8, -1.9), X(dx, F, -1), CLOTH[h.awnCol], leafAux(0.05, h.ph)); }
      // a tub with a small fruit tree in the street (none within 5 degrees of a goods lift's bearing: the cage passes there)
      if (h.tub && detail > 0.7) { const tt = X(dx > 0 ? -2.5 : 2.5, F, -3.3), tb = bearingOf(tt[0], tt[2]); if (!LIFT_B.some((l) => Math.abs(((tb - l + 540) % 360) - 180) < 5)) tubTree(A, Sf, tt, F, 0.09, h.ph, h.tree); }
      // washing: plain rectangles of cloth on a line between two posts; each swings at its hem (0.38 m) and hangs still at the line
      if (h.wash && detail > 0.5) { for (const e of [-3.1, 3.1]) A.beam(X(e, F, -1.7), X(e, F + 5.3, -1.7), 0.06, 0.06, iron); A.beam(X(-3.1, F + 5.25, -1.7), X(3.1, F + 5.25, -1.7), 0.025, 0.025, iron);
        // (ONE linen to a line; three plain lengths of unequal width and drop with 0.8 m of air between)
        { const lin1 = LINEN[h.cloth[0]], row = []; let x0 = -2.7;
          for (let q = 0; q < 3; q++) { const wq = [1.3, 0.95, 1.5][(q + i) % 3], drop = [1.9, 1.25, 1.6][(q + h.cloth[1]) % 3] + 0.12 * h.cloth[2];
            { const hem = leafAux(0.38, h.ph + q * 0.21), top = leafAux(0.03, h.ph + q * 0.21); Sf.quadAux(X(x0, F + 5.2 - drop, -1.7), X(x0 + wq, F + 5.2 - drop, -1.7), X(x0 + wq, F + 5.2, -1.7), X(x0, F + 5.2, -1.7), lin1, [hem, hem, top, top]); } row.push({ w: wq, col: lin1 }); x0 += wq + 0.8; }
          noteBands(S, 'washing line, house ' + id, row); } }
    }
    // a caged lamp bolted under the soffit on every second rib line over the street, staggered from street to street
    for (let k = ring % 2; k < 24; k += 2) { A.beam(P3(k * 15, 41.6, F + 11), P3(k * 15, 41.6, F + 10.55), 0.06, 0.06, iron); cagedLamp(A, P3(k * 15, 41.6, F + 10.2), 0.3, 2.8, lph(S)); }
  });
}
// a house's chimney: where it stands along the front, and how high its pot is (clear of its roof, under the street's soffit)
export const chimneyX = (h) => (h.doorAt > 0 ? -2.2 : 2.2);
export const chimneyTop = (h, F) => F + (h.kit === 0 || h.kit === 3 ? 9.7 + (h.h - 8.8) * 0.4 : h.h + 0.9);
// where a house's door lamp stands along its front: 1.35 m from the door's middle, on the side toward the front's middle
export const doorLampX = (h, kit = h.kit) => { const dx = kit === 2 ? (h.doorAt > 0 ? 2.55 : -2.55) : h.doorAt * 5; return dx + (dx > 0 ? -1.35 : 1.35); };
// the market landing's stalls: a counter, four posts and a striped awning of plain cloth each (none at the bridge)
export function buildMarket(A, S) {
  const Sf = A.soft || A, y = MARKET_Y, bb = bridgeBearing(MARKET_Y);
  S.stalls.forEach((s, i) => { const b = 18 + i * 36; if (!s.on || gapAt(b, bb, 14)) return; const X = frontFrame(b, 16.3);
    blk(A, X, b, -1.4, 1.4, y, y + 1.05, -0.5, 0.5, COL.wood); for (const ex of [-1.5, 1.5]) for (const ed of [-1.2, 1.2]) A.beam(X(ex, y, ed), X(ex, y + (ed < 0 ? 3.1 : 2.5), ed), 0.05, 0.05, COL.iron);
    noteBands(S, 'market stall cloth', [0, 1, 2, 3, 4, 5].map((q) => ({ w: 0.55, col: q % 2 ? LINEN[0] : CLOTH[s.a] })));
    for (let q = 0; q < 6; q++) { const x0 = -1.65 + q * 0.55; Sf.quad(X(x0, y + 3.15, -1.35), X(x0 + 0.55, y + 3.15, -1.35), X(x0 + 0.55, y + 2.5, 1.35), X(x0, y + 2.5, 1.35), q % 2 ? LINEN[0] : CLOTH[s.a], leafAux(0.04, s.ph)); }
    blk(A, X, b, -1.1, -0.2, y + 1.05, y + 1.45, -0.3, 0.3, PAINT[s.b]); blk(A, X, b, 0.2, 1, y + 1.05, y + 1.35, -0.3, 0.3, mix3(COL.grain, COL.rust, 0.3)); });
  // caged lamps under the market's deck: one bolted to each corner's corbel, one under the rim at the middle of each side
  for (let k = 0; k < 6; k++) { cagedLamp(A, HX(STAIR_B0 + 60 * k, 17.5, 0.75, y - 1.7), 0.26, 2.6, lph(S)); cagedLamp(A, HX(STAIR_B0 + 60 * k + 30, ST.MARKET - 0.8, 0, y - 1.15), 0.26, 2.6, lph(S)); }
}
// THE FARM BOWL: five ring fields on the terraces. Plants stand only in beds, rows, trays and tubs. On every riser:
// vines on taut wires in steel frames (their hem cut level), and a ribbed spill chute of water on each rib line.
// LAMP RACKS are straight violet bars 9 m long on two steel legs rooted in their terrace, one in every second bay
// between rib lines and staggered from terrace to terrace; an amber caged lamp on the riser in every second of the
// bays between (one bay in four stands in the shade).
// THE FARM'S PLANTS ARE PLANTS: each stands by itself in its row, its place, size and lean by rule from its bay's own
// deal (the 'bays' stream), in the soft mesh (seen from both sides, swaying on the bay's phase).
const plantHash = (bay, i) => { const v = Math.sin((i + 1) * 12.9898 + bay.h * 78.233) * 43758.5453; return v - Math.floor(v); };
const FLOWER = [[0.95, 0.78, 0.25], [0.92, 0.9, 0.86], [0.85, 0.3, 0.4], [0.75, 0.5, 0.9]], CANE = [0.36, 0.5, 0.2], REDLEAF = [0.36, 0.1, 0.17];
// tall cane: two rows of stalks 2.5 to 3.4 m high, three long blades to a stalk, a pale tassel where the bay is in flower
function plantCane(Sf, Xm, y, xa, xb, bay, ph) { let i = 0;
  for (const d of [-0.62, 0.62]) for (let x = xa + 0.4 + (d > 0 ? 0.6 : 0); x <= xb - 0.3; x += 1.25) { i++; const h = 2.5 + 0.9 * plantHash(bay, i), lx = (plantHash(bay, i + 50) - 0.5) * 0.5, ld = (plantHash(bay, i + 90) - 0.5) * 0.3, aux = leafAux(0.1, ph + i * 0.07);
    Sf.quad(Xm(x - 0.045, y + 0.35, d), Xm(x + 0.045, y + 0.35, d), Xm(x + lx + 0.03, y + h, d + ld), Xm(x + lx - 0.03, y + h, d + ld), CANE, aux);
    for (let q = 0; q < 3; q++) { const f = 0.42 + 0.2 * q, sx = (q + i) % 2 ? 1 : -1, x0 = x + lx * f, y0 = y + 0.35 + (h - 0.35) * f, len = 0.75 + 0.35 * plantHash(bay, i * 3 + q);
      Sf.tri(Xm(x0, y0, d + ld * f), Xm(x0, y0 + 0.17, d + ld * f), Xm(x0 + sx * len, y0 + 0.25 - 0.18 * q, d + ld * f + (plantHash(bay, i + q) - 0.5) * 0.6), (q + i) % 3 ? COL.leaf : COL.leafDeep, aux); }
    if (bay.bloom) Sf.quad(Xm(x + lx - 0.07, y + h - 0.05, d + ld), Xm(x + lx + 0.07, y + h - 0.05, d + ld), Xm(x + lx + 0.05, y + h + 0.45, d + ld), Xm(x + lx - 0.05, y + h + 0.45, d + ld), [0.85, 0.7, 0.35], aux); } }
// leafy rows: two rows of heads, each three broad leaves fanned from its heart; green, or red-stemmed by the bay's tint
function plantLeafy(Sf, Xm, y, xa, xb, bay, ph) { let i = 0; const c0 = bay.tint % 2 ? REDLEAF : COL.leafDeep;
  for (const d of [-0.6, 0.6]) for (let x = xa + 0.45; x <= xb - 0.3; x += 0.95) { i++; const s = 0.5 + 0.25 * plantHash(bay, i), a0 = plantHash(bay, i + 40) * 3.14, col = mix3(c0, COL.leaf, plantHash(bay, i + 70) * 0.7), aux = leafAux(0.04, ph + i * 0.05);
    for (let q = 0; q < 3; q++) { const a = a0 + q * 1.047, cx = Math.cos(a) * s * 0.55, cd = Math.sin(a) * s * 0.55;
      Sf.quad(Xm(x - cx, y + 0.33, d - cd), Xm(x + cx, y + 0.33, d + cd), Xm(x + cx * 1.5, y + 0.35 + s * 1.1, d + cd * 1.5), Xm(x - cx * 1.5, y + 0.35 + s * 1.1, d - cd * 1.5), mul(col, 0.85 + 0.15 * q), aux); } } }
// vines on a frame: posts and two wires along the bed, leaves hung on them one by one, red or orange fruit under the leaves where the bay bears
function plantVines(A, Sf, Xm, y, xa, xb, bay, ph) { const n = Math.max(2, Math.round((xb - xa) / 2.4)), fr = bay.tint % 2 ? [0.85, 0.16, 0.12] : [0.82, 0.29, 0.02];
  for (let q = 0; q <= n; q++) { const x = xa + 0.3 + (xb - xa - 0.6) * q / n; A.beam(Xm(x, y + 0.3, 0), Xm(x, y + 2.9, 0), 0.05, 0.05, COL.wood, NOAUX); }
  for (const yy of [1.3, 2.85]) A.beam(Xm(xa + 0.3, y + yy, 0), Xm(xb - 0.3, y + yy, 0), 0.025, 0.025, COL.iron);
  let i = 0; for (let x = xa + 0.5; x <= xb - 0.5; x += 0.42) { i++; const hy = y + 0.75 + 2.0 * plantHash(bay, i), dd = (plantHash(bay, i + 30) - 0.5) * 0.5, s = 0.3 + 0.2 * plantHash(bay, i + 60), t = (plantHash(bay, i + 80) - 0.5) * 0.6, aux = leafAux(0.08, ph + i * 0.06);
    Sf.quad(Xm(x - s, hy - s * 0.8, dd - t * 0.3), Xm(x + s, hy - s * 0.8 + t * 0.4, dd + t * 0.3), Xm(x + s * 0.9, hy + s * 0.8, dd + t), Xm(x - s * 0.9, hy + s * 0.8 - t * 0.4, dd - t), i % 3 ? COL.leaf : COL.leafDeep, aux);
    if (bay.bloom && i % 2 === 0) { const fy = hy - s - 0.15, fd = dd + (i % 4 ? 0.22 : -0.22); Sf.quad(Xm(x - 0.11, fy, fd), Xm(x, fy - 0.13, fd), Xm(x + 0.11, fy, fd), Xm(x, fy + 0.13, fd), fr, STEEL); } } }
// low greens: three rows of small heads, a flower over every third where the bay is in flower
function plantGreens(Sf, Xm, y, xa, xb, bay, ph) { let i = 0; const fc = FLOWER[bay.tint];
  for (const d of [-0.85, 0, 0.85]) for (let x = xa + 0.4 + (d === 0 ? 0.5 : 0); x <= xb - 0.3; x += 1.0) { i++; const s = 0.3 + 0.14 * plantHash(bay, i), a = plantHash(bay, i + 20) * 1.57, cx = Math.cos(a) * s, cd = Math.sin(a) * s, col = mix3(COL.leaf, COL.grain, 0.25 * plantHash(bay, i + 5)), aux = leafAux(0.03, ph + i * 0.04);
    Sf.quad(Xm(x - cx, y + 0.33, d - cd), Xm(x + cx, y + 0.33, d + cd), Xm(x + cx * 1.3, y + 0.36 + s, d + cd * 1.3), Xm(x - cx * 1.3, y + 0.36 + s, d - cd * 1.3), col, aux);
    Sf.quad(Xm(x + cd, y + 0.33, d - cx), Xm(x - cd, y + 0.33, d + cx), Xm(x - cd * 1.3, y + 0.36 + s, d + cx * 1.3), Xm(x + cd * 1.3, y + 0.36 + s, d - cx * 1.3), mul(col, 0.85), aux);
    if (bay.bloom && i % 3 === 0) Sf.tri(Xm(x - 0.09, y + 0.4 + s, d), Xm(x + 0.09, y + 0.4 + s, d), Xm(x, y + 0.6 + s, d), fc, STEEL); } }
// vines hang over the edge of the terrace above (or of the sill), down the riser: seven strands to a bay, of unequal length
function hangVines(Sf, X, y, fw, bay, ph) {
  for (let q = 0; q < 7; q++) { const x = clamp((plantHash(bay, q + 200) * 2 - 1) * (fw - 1.0) * (q < 4 ? 0.4 : 1) + (q < 4 ? (bay.h - 0.5) * fw : 0), -(fw - 0.9), fw - 0.9), len = 1.4 + 3.4 * plantHash(bay, q + 210) ** 1.5, w = 0.22 + 0.2 * plantHash(bay, q + 220), dd = -0.12 - 0.22 * plantHash(bay, q + 230), aux = leafAux(0.14, ph + q * 0.13), col = q % 3 ? COL.leafDeep : COL.leaf;
    Sf.quad(X(x - w, y + 8.05, dd), X(x + w, y + 8.05, dd), X(x + w * 0.8, y + 8 - len * 0.7, dd - 0.06), X(x - w * 0.8, y + 8 - len * 0.7, dd - 0.06), col, aux);
    Sf.tri(X(x - w * 0.8, y + 8 - len * 0.7, dd - 0.06), X(x + w * 0.8, y + 8 - len * 0.7, dd - 0.06), X(x + (plantHash(bay, q + 240) - 0.5) * 0.3, y + 8 - len, dd - 0.1), mul(col, 0.85), aux); } }
// THE FARM TERRACES. On each ring: a bed of soil along its whole length; A WATER CHANNEL brimming along the riser's
// foot, fed by a run of water down the riser on every rib line (it comes from the ring above: a raised flume crosses
// that ring's bed from its own channel to its edge on every rib line, so the water goes ring to ring to the canal);
// vines hang over the edge of the ring above. EVERY SECOND BAY stands under a grow-light rack (a violet bar 9, 6.6 or
// 4.6 m long, the long ones double), the bays between carry A FITTING at their end (a potting shed with a bench and
// pots, two tanks, a seed store with painted shutters, a steel stair up to the next ring, or an orchard of two fruit
// trees), each with a warm lamp. The bed's planting is the bay's own (cane, leafy rows, vines on a frame, low
// greens). No bay repeats its neighbour (see the 'bays' stream).
export function buildFarm(A, S, detail = 1, only = -1) {
  const Sf = A.soft || A, teal = COL.steel, iron = COL.iron, orange = lin('#e8902a'), conc = mix3(COL.conc, COL.stain, 0.35), verd = lin('#4f8f7c'), galv = lin('#8a9298'), terra = lin('#a8563a');
  for (let k = 0; k < 5; k++) {
    if (only >= 0 && k !== only) continue;
    const y = K.TERRACES[k], r = K.FRONT_R + 4 * k, rr = r + 4;
    A.sector(0, 360, r + 0.7, r + 3.4, y, y + 0.35, COL.soil, NOAUX, 72, 'tio');
    A.sector(0, 360, r + 3.45, r + 3.98, y, y + 0.5, conc, NOAUX, 72, 'ti'); A.sector(0, 360, r + 3.56, r + 3.86, y + 0.5, y + 0.512, COL.deep, STILL, 72, 't');
    for (let j = 0; j < 24; j++) {
      const bc = j * 15 + 7.5, bay = S.bays[k][j], X = frontFrame(bc, rr - 0.02), Xm = frontFrame(bc, r + 2.05), Wb = (r + 2) * 7.5 * D2R - 1.3, ph = (S.cropPh + j * 0.137 + k * 0.31) % 1, rack = (j - k) % 2 === 0;
      // a run of water down the riser on every rib line, between two steel guides, into an iron trough at the riser's
      // foot (none under the head bridge, which lands on the sill over the top terrace's riser due west); and this
      // ring's own flume on the same line, from its channel across the bed to its edge
      if (!(k === 4 && j * 15 === 270)) { const C = frontFrame(j * 15, rr - 0.02), t = C(0, y, -0.3); (A.water || A).quadAux(C(-0.7, y + 8, -0.1), C(0.7, y + 8, -0.1), C(0.7, y + 0.3, -0.1), C(-0.7, y + 0.3, -0.1), COL.foam, [[0.7, 3, -0.7, 0], [0.7, 3, 0.7, 0], [0.7, 3, 0.7, 7.7], [0.7, 3, -0.7, 7.7]]); for (const e of [-0.78, 0.78]) A.beam(C(e, y + 0.2, -0.16), C(e, y + 8, -0.16), 0.07, 0.12, teal);
        A.box(t[0], y + 0.15, t[2], 0.95, 0.15, 0.3, yawRadial(j * 15), iron, STEEL); }
      { const C = frontFrame(j * 15, r + 2.05); blk(A, C, j * 15, -0.3, 0.3, y + 0.2, y + 0.5, -1.36, 1.42, conc); A.quadOut(C(-0.17, y + 0.512, -1.36), C(0.17, y + 0.512, -1.36), C(0.17, y + 0.512, 1.5), C(-0.17, y + 0.512, 1.5), C(0, y, 0), COL.deep, STILL); }
      const fw = rr * 7.5 * D2R - 1.7;
      hangVines(Sf, X, y, fw, bay, ph);
      // the grow-light rack (its lamp's light is the terrace's named violet lamp, 5 m over the bed); or the amber lamp on the riser
      if (rack) { const c = Xm(0, y + 5, 0), L = [4.5, 3.3, 2.3][bay.len];
        for (const d of (bay.len === 0 ? [-0.45, 0.45] : [0])) { const q = Xm(0, y + 5, d); A.box(q[0], q[1], q[2], L, 0.12, 0.2, yawRadial(bc), COL.violet, glow(3.0, 0)); }
        A.box(c[0], c[1] + 0.2, c[2], L + 0.1, 0.06, bay.len === 0 ? 0.8 : 0.42, yawRadial(bc), iron, STEEL);
        for (const e of [-L, L]) A.beam(Xm(e, y + 0.3, 0), Xm(e, y + 5.2, 0), 0.08, 0.08, teal);
      } else if ((j - k % 2) % 4 === 1) { A.beam(P3(bc, rr, y + 5.1), P3(bc, rr - 0.5, y + 5.1), 0.06, 0.06, iron); cagedLamp(A, P3(bc, rr - 0.5, y + 4.6), 0.3, 2.8, lph(S)); }
      if (S.drumAt.some((d) => d.k === k && d.j === j)) { for (const e of [-3.2, 3.2]) for (const d of [-0.9, 0.9]) A.beam(Xm(e, y + 0.3, d), Xm(e, y + 2.3, 0), 0.08, 0.08, teal); continue; }
      // THE BAY'S FITTING, at its end (the bed's planting takes the rest of the bay)
      let xa = -Wb; const x0 = -Wb + 0.1;
      if (!rack) { xa = -Wb + 4.4;
        if (bay.feat === 0) { // a potting shed against the riser: boarded walls, a roof with an eave, a door, a lamp over it, a bench with pots
          blk(A, X, bc, x0, x0 + 3.4, y + 0.3, y + 2.5, -1.75, -0.03, mix3(COL.wood, COL.stain, 0.3)); blk(A, X, bc, x0 - 0.2, x0 + 3.6, y + 2.5, y + 2.62, -2.05, 0, ROOF[bay.tint % 3]);
          blk(A, X, bc, x0 + 1.2, x0 + 2.1, y + 0.36, y + 2.1, -1.81, -1.75, COL.dark); cagedLamp(A, X(x0 + 1.65, y + 2.3, -1.98), 0.15, 2.6, bay.ph);
          blk(A, X, bc, x0 + 2.35, x0 + 3.3, y + 0.92, y + 1.0, -2.45, -1.8, COL.wood); for (let q = 0; q < 3; q++) blk(A, X, bc, x0 + 2.45 + q * 0.3, x0 + 2.63 + q * 0.3, y + 1.0, y + 1.16 + 0.05 * q, -2.3, -2.1, terra);
        } else if (bay.feat === 1) { // two tanks on legs, one verdigris copper and one galvanised, each hooped
          [verd, galv].forEach((col, q) => { const c = X(x0 + 0.95 + q * 1.9, y, -1.05); A.cyl(c[0], y + 0.9, c[2], 0.8, y + 3.0 - 0.3 * q, 0.8, 8, col, STEEL, 'b'); A.cyl(c[0], y + 3.0 - 0.3 * q, c[2], 0.8, y + 3.4 - 0.3 * q, 0.2, 8, mul(col, 0.85), STEEL, '');
            A.cyl(c[0], y + 1.9, c[2], 0.85, y + 2.0, 0.85, 8, iron, STEEL, ''); for (let e = 0; e < 3; e++) { const a = e * 2.094 + q; A.beam([c[0] + Math.cos(a) * 0.6, y + 0.3, c[2] + Math.sin(a) * 0.6], [c[0] + Math.cos(a) * 0.6, y + 0.95, c[2] + Math.sin(a) * 0.6], 0.05, 0.05, iron); } });
        } else if (bay.feat === 2) { // a seed store: a painted front against the riser, three shutters of another paint, a lamp
          const pc = PAINT[bay.tint], sc = PAINT[(bay.tint + 2) % 4];
          blk(A, X, bc, x0, x0 + 3.7, y + 0.3, y + 3.0, -0.5, -0.03, mix3(pc, COL.conc, 0.35)); blk(A, X, bc, x0 - 0.15, x0 + 3.85, y + 3.0, y + 3.14, -0.75, 0, conc);
          for (let q = 0; q < 3; q++) { const xs = x0 + 0.35 + q * 1.15; blk(A, X, bc, xs, xs + 0.85, y + 1.0, y + 2.5, -0.56, -0.5, sc); for (const yy of [1.5, 2.0]) blk(A, X, bc, xs + 0.06, xs + 0.79, y + yy, y + yy + 0.05, -0.6, -0.56, mul(sc, 0.5)); }
          cagedLamp(A, X(x0 + 1.85, y + 2.72, -0.78), 0.15, 2.6, bay.ph);
        } else if (bay.feat === 3) { // a steel stair up the riser to the next ring: two strings, twelve treads, a rail
          const run = 6.2; xa = -Wb + 0.2; for (const dd of [-0.95, -0.12]) A.beam(X(x0, y + 0.3, dd), X(x0 + run, y + 8, dd), 0.05, 0.12, teal);
          for (let q = 1; q < 13; q++) { const t = q / 13; blk(A, X, bc, x0 + run * t - 0.14, x0 + run * t + 0.14, y + 0.27 + 7.7 * t, y + 0.3 + 7.7 * t, -0.93, -0.14, iron, STEEL); }
          A.beam(X(x0, y + 1.3, -0.95), X(x0 + run, y + 9, -0.95), 0.03, 0.03, teal);
        } else { // an orchard: two small fruit trees (the whole bay is theirs)
          xa = Wb + 1;
          for (const e of [-Wb * 0.5, Wb * 0.5]) { const t = Xm(e, y, 0), a = j * 0.61 + k + e; A.beam([t[0], y + 0.3, t[2]], [t[0], y + 2.3, t[2]], 0.12, 0.12, COL.wood, NOAUX);
            leafBall(Sf, [t[0], y + 2.75, t[2]], 1.2, COL.leafDeep, leafAux(0.07, ph));
            for (let q = 0; q < 3; q++) { const b = a + q * TAU / 3; leafBall(Sf, [t[0] + Math.cos(b) * 0.7, y + 2.5 + 0.2 * ((q + j) % 3), t[2] + Math.sin(b) * 0.7], 0.9, q % 2 ? COL.leaf : mix3(COL.leaf, COL.leafDeep, 0.5), leafAux(0.09, ph + q * 0.17)); }
            if (detail > 0.7) for (let q = 0; q < 3; q++) A.box(t[0] + 1.5 * Math.cos(q * 2.1 + j), y + 2.45 + 0.3 * q, t[2] + 1.5 * Math.sin(q * 2.1 + j), 0.14, 0.14, 0.14, 0, orange, STEEL); } }
      }
      if (xa < Wb - 1.5) { if (bay.crop === 0) plantCane(Sf, Xm, y, xa, Wb, bay, ph); else if (bay.crop === 1) plantLeafy(Sf, Xm, y, xa, Wb, bay, ph); else if (bay.crop === 2) plantVines(A, Sf, Xm, y, xa, Wb, bay, ph); else plantGreens(Sf, Xm, y, xa, Wb, bay, ph); }
    }
  }
  // the spray booms' masts, 6 m high, two to a terrace and 60 degrees or more apart round it: the arm on each swings
  // over the crops, the trees and the lamp bars (see the movers; their mist is a medium, see the hero)
  if (only <= 0) S.mist.forEach((m, i) => { const k = i % 5, y = K.TERRACES[k], X = frontFrame(m.b, K.FRONT_R + 4 * k + 1.2); A.beam(X(0, y + 0.3, 0), X(0, y + 6.05, 0), 0.09, 0.09, iron); A.box(X(0, y, 0)[0], y + 0.42, X(0, y, 0)[2], 0.3, 0.12, 0.3, 0, iron, STEEL); });
}
// UNDER THE LID: a cistern and a caged lamp at the inner end of every vane; the vanes' own wear; and on the stair's
// head six small fruit trees in tubs, one to each of its sides.
// THE CISTERNS: a riveted grey steel tank on four legs at the inner end of every vane (its foot 1.2 m over the sill, its
// domed top 3.7 m over it), hooped at its seams; each drips from its drain cock onto a dark wet patch of the sill.
export const CISTERN = { R: 60.5, RAD: 1.3, LEG: 1.2, TOP: 3.7 };
export function buildLidDress(A, S) {
  const Sf = A.soft || A, tank = lin('#868c94'), seam = lin('#5d636b');
  for (const v of vaneList()) { const b = bearingOf(v.nose[0], v.nose[1]), p = P3(b, CISTERN.R, K.SILL_Y), y0 = K.SILL_Y + CISTERN.LEG;
    A.cyl(p[0], y0, p[2], CISTERN.RAD, y0 + 2.2, CISTERN.RAD, 10, tank, STEEL, 'b'); A.cyl(p[0], y0 + 2.2, p[2], CISTERN.RAD, K.SILL_Y + CISTERN.TOP, 0.25, 10, mul(tank, 0.86), STEEL, 't');
    for (const yy of [0.05, 1.05, 2.05]) A.cyl(p[0], y0 + yy, p[2], CISTERN.RAD + 0.06, y0 + yy + 0.13, CISTERN.RAD + 0.06, 10, seam, STEEL, 'tb');
    for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + 0.6, f = [p[0] + Math.cos(a) * 1.05, p[2] + Math.sin(a) * 1.05]; A.beam([f[0] * 1 + (f[0] - p[0]) * 0.25, K.SILL_Y, f[1] + (f[1] - p[2]) * 0.25], [f[0], y0 + 0.3, f[1]], 0.07, 0.07, seam); }
    A.beam([p[0], y0, p[2]], [p[0], y0 - 0.3, p[2]], 0.05, 0.05, seam); A.cyl(p[0], K.SILL_Y + 0.012, p[2], 0.7, K.SILL_Y + 0.014, 0.7, 8, mul(COL.stain, 0.42), NOAUX, 't');
    A.beam(P3(b, 61.95, 171.1), P3(b, 61.3, 171.1), 0.06, 0.06, COL.iron); cagedLamp(A, P3(b, 61.3, 170.6), 0.3, 3, lph(S)); }
  // THE VANES' WEAR (each by the 'vanes' stream): a steel strap girds every vane 8.5 to 12.5 m over the sill, and rust
  // has run down the concrete from it in thin streaks; one patch of newer concrete on a flank; the eave's rain pipe
  // comes down the vane's outer end on three brackets to a dark wet patch; a wet gutter runs along the foot of each flank.
  vaneList().forEach((v, i) => { const w = S.vaneWear[i], rust = mix3(COL.rust, COL.stain, 0.45), wet = mul(COL.stain, 0.42), ys = K.SILL_Y + w.strap;
    const d = [v.tail[0] - v.nose[0], v.tail[1] - v.nose[1]], dl = Math.hypot(d[0], d[1]), q = [v.tail[0] + d[0] / dl * 0.16, v.tail[1] + d[1] / dl * 0.16];
    // a point on a flank: e along the vane from its inner end (0) to its outer end (1), side, height, metres proud of the flank
    const F = (e, side, y, off) => { const hw = 0.5 + 0.3 * e + off; return [lerp(v.nose[0], v.tail[0], e) + v.n[0] * side * hw, y, lerp(v.nose[1], v.tail[1], e) + v.n[1] * side * hw]; }, mid = (e, y) => [lerp(v.nose[0], v.tail[0], e), y, lerp(v.nose[1], v.tail[1], e)];
    for (const sd of [1, -1]) { A.beam(F(-0.004, sd, ys, 0.02), F(1.004, sd, ys, 0.02), 0.04, 0.14, COL.iron);
      A.quadOut(F(0.04, sd, K.SILL_Y + 0.012, 0.08), F(1, sd, K.SILL_Y + 0.012, 0.08), F(1, sd, K.SILL_Y + 0.012, 0.42), F(0.04, sd, K.SILL_Y + 0.012, 0.42), mid(0.5, K.SILL_Y - 5), wet); }
    for (const e of [-0.004, 1.004]) A.beam(F(e, 1, ys, 0.02), F(e, -1, ys, 0.02), 0.04, 0.14, COL.iron);
    for (const [e, sd, len, wd] of w.rust) { const e1 = e + wd / dl, y1 = ys - 0.14; A.quadOut(F(e, sd, y1, 0.012), F(e1, sd, y1, 0.012), F(e1, sd, y1 - len * 0.6, 0.012), F(e, sd, y1 - len, 0.012), mid(e, y1 - 1), rust); }
    { const [e, y, pw, ph, sd, tone] = w.patch, e1 = e + pw / dl, ya = K.SILL_Y + y; A.quadOut(F(e, sd, ya, 0.01), F(e1, sd, ya, 0.01), F(e1, sd, ya + ph, 0.01), F(e, sd, ya + ph, 0.01), mid(e, ya + 1), mul(COL.conc, tone)); }
    A.beam([q[0], K.SILL_Y + 0.25, q[1]], [q[0], K.VANE_TOP, q[1]], 0.09, 0.09, COL.iron);
    for (const yy of [2.2, 7.6, 13]) A.box(q[0], K.SILL_Y + yy, q[1], 0.16, 0.06, 0.16, 0, COL.dark, STEEL);
    A.cyl(q[0] + d[0] / dl * 0.3, K.SILL_Y + 0.012, q[1] + d[1] / dl * 0.3, 0.6, K.SILL_Y + 0.014, 0.6, 8, wet, NOAUX, 't'); });
  // six small fruit trees in tubs on the stair's head, one at the middle of each of its six sides
  for (let i = 0; i < 6; i++) tubTree(A, Sf, P3(STAIR_B0 + 30 + 60 * i, 13.7, K.SILL_Y), K.SILL_Y, 0.07, S.treePh[i][0], S.treePh[i].slice(1));
}
// THE GREAT LANTERN: the farm's one great thing. Twelve shafts of glass hang in a ring 19 m from the axis, round the
// stair (a shaft every 30 degrees; the head bridge passes between two of them), each on a rod from the lid's ribs:
// six-sided, 1.6 m across, their feet at three heights in turn (136, 142 and 148 m), their heads at 178 m. The last
// light of the sky comes down them from the lid: each burns sunset orange, brightest at its head and paler toward its
// foot, breathing slowly on its own phase (the 'lantern' stream). Two hoops of steel join them (at 160 and 178 m),
// each hung with tilted mirror plates between the shafts; motes drift in their light (a medium, see the hero). The
// line climbs round them 10 m and more away, from the first farm ring to the lid.
export const LANTERN = { R: 19, FIRST: 15, TOP: 178, FEET: [136, 142, 148] };
export function buildLantern(A, S) {
  // (the glass itself is dark amber: its glow carries the colour, so its own light never bleaches it)
  const sun = [0.5, 0.235, 0.075], iron = COL.iron, mirror = lin('#b9c2c8');
  for (let i = 0; i < 12; i++) { const b = LANTERN.FIRST + 30 * i, c = P3(b, LANTERN.R, 0), y0 = LANTERN.FEET[i % 3], y1 = LANTERN.TOP, ph = S.lantern.ph[i], n = 5;
    for (let q = 0; q < n; q++) { const ya = y0 + (y1 - y0) * q / n, yb = y0 + (y1 - y0) * (q + 1) / n; A.cyl(c[0], ya + 0.12, c[2], 0.8, yb - 0.12, 0.8, 6, sun, glow(1.2 + 0.35 * q, ph), ''); A.cyl(c[0], yb - 0.12, c[2], 0.9, yb + 0.12, 0.9, 6, iron, STEEL, ''); }
    A.cyl(c[0], y0 - 0.9, c[2], 0.05, y0 + 0.12, 0.8, 6, mul(sun, 0.8), glow(1.1, ph), ''); A.cyl(c[0], y1 + 0.12, c[2], 0.9, y1 + 0.9, 0.12, 6, iron, STEEL, '');
    A.beam([c[0], y1 + 0.9, c[2]], [c[0], 196.3, c[2]], 0.05, 0.05, iron);
    // the hoops' pieces from this shaft to the next, and a tilted mirror plate half way along each
    for (const [yh, tilt] of [[160, 0.5], [178, -0.5]]) { if (yh < y0 + 1 && yh < LANTERN.FEET[(i + 1) % 3] + 1) continue; const p0 = P3(b + 2.6, LANTERN.R, yh), p1 = P3(b + 27.4, LANTERN.R, yh), m = P3(b + 15, LANTERN.R * Math.cos(15 * D2R), yh);
      A.beam(p0, p1, 0.07, 0.1, iron); const t = [Math.cos((b + 15) * D2R), Math.sin((b + 15) * D2R)], o = [Math.sin((b + 15) * D2R), -Math.cos((b + 15) * D2R)];
      const M = (e, h) => [m[0] + t[0] * e + o[0] * h * tilt, yh - 0.12 - h, m[2] + t[1] * e + o[1] * h * tilt];
      A.quadAux(M(-1.7, 0), M(1.7, 0), M(1.7, 1.5), M(-1.7, 1.5), mirror, [[0.25, 1, 0, ph], [0.25, 1, 0, ph], [0.05, 1, 0, ph], [0.05, 1, 0, ph]]); }
  }
}
// (the stair's own lamps hang over its landings: see buildLanding)
export function buildLamps(A, S) {
  // the works' crane rail: a curved steel rail under the first home street's corbels, from bearing 250 round by north to 20
  for (let a = 250; a < 380; a += 5) { A.beam(P3(a, 36.5, 71.4), P3(a + 5, 36.5, 71.4), 0.14, 0.2, COL.steel); if (a % 15 === 0) A.beam(P3(a, 39.2, 71.8), P3(a, 36.5, 71.6), 0.1, 0.12, COL.steel); }
}

function wheelGeo(R, rimIn, halfW, spokes, col, hubR = 1.1, paddles = 0, weight = null) {
  const A = new Acc();
  A.sector(0, 360, rimIn, R, -halfW, halfW, col, STEEL, 28, 'tuio');
  for (let k = 0; k < spokes; k++) { const b = k * 360 / spokes; A.sector(b - 2.2, b + 2.2, hubR * 0.8, rimIn + 0.1, -halfW * 0.35, halfW * 0.35, weight ? mix3(col, weight, 0.6) : mul(col, 0.85), STEEL, 1, 'tue'); }
  A.cyl(0, -halfW * 1.25, 0, hubR, halfW * 1.25, hubR, 10, mul(col, 0.7), STEEL, 'tb');
  for (let k = 0; k < paddles; k++) { const b = k * 360 / paddles; A.sector(b - 0.6, b + 0.6, R - 0.5, R + 0.3, -halfW, halfW, mul(col, 0.8), STEEL, 1, 'tuioe'); }
  return A;
}
// ring capsules of a wheel's rim for the clear-air count: centre c, axis unit vector ax, radius R, tube radius t
function rimCourse(c, ax, R, t, n = 20) {
  const a = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = [a[1] * ax[2] - a[2] * ax[1], a[2] * ax[0] - a[0] * ax[2], a[0] * ax[1] - a[1] * ax[0]], ul = Math.hypot(...u); u[0] /= ul; u[1] /= ul; u[2] /= ul;
  const v = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]], out = [];
  const P = (k) => { const q = k / n * TAU; return [c[0] + R * (u[0] * Math.cos(q) + v[0] * Math.sin(q)), c[1] + R * (u[1] * Math.cos(q) + v[1] * Math.sin(q)), c[2] + R * (u[2] * Math.cos(q) + v[2] * Math.sin(q))]; };
  for (let k = 0; k < n; k++) { const p = P(k), q = P(k + 1); out.push([p[0], p[1], p[2], q[0], q[1], q[2], t]); if (k % 2 === 0) out.push([c[0], c[1], c[2], p[0], p[1], p[2], t]); }
  return out;
}
export async function buildMovers(S, mat, pause = async () => {}) {
  const group = new THREE.Group(), courses = [], ticks = [];
  const add = (acc, name) => { const m = new THREE.Mesh(acc.toGeometry(), mat); m.name = name; m.frustumCulled = false; group.add(m); return m; };
  // four flywheels 11.2 m across in pits, axles at y 4.6, in pairs facing each other across the gallery's line, near faces 9 m from it
  const iron = lin('#8a5a48');
  [[-1, -36, 0], [1, -36, 1], [-1, -14, 2], [1, -14, 3]].forEach(([side, z, i]) => {
    const A = wheelGeo(FLY.R, FLY.R - 1.1, 1.2, 8, iron, 1.2, 0, lin('#3f434c')), m = add(A, 'flywheel'), x = K.GALLERY_X + side * 10.2;
    m.geometry.rotateZ(Math.PI / 2); m.position.set(x, FLY.Y, z);
    const w = TAU / S.fly[i].period * side;
    ticks.push((t) => { m.rotation.x = S.fly[i].ph + t * w; });
    courses.push({ name: 'flywheel', capsules: rimCourse([x, FLY.Y, z], [1, 0, 0], FLY.R - 0.55, 1.6) });
  });
  await pause();
  // three overshot wheels 12 m across in the canal, each under its fall, one turn in 14 s
  for (const w of S.wheel) {
    const A = wheelGeo(6, 5.2, 1.5, 8, mix3(COL.steel, COL.rust, 0.5), 0.9, 16), m = add(A, 'water wheel'), g = new THREE.Group();
    m.geometry.rotateZ(Math.PI / 2); group.remove(m); g.add(m); group.add(g);
    g.position.set(bx(w.b, 39), K.BELL_TOP + 6.4, bz(w.b, 39)); g.rotation.y = Math.PI / 2 - w.b * D2R;
    ticks.push((t) => { m.rotation.x = w.ph + t * TAU / 14; });
    courses.push({ name: 'water wheel', capsules: rimCourse([bx(w.b, 39), K.BELL_TOP + 6.4, bz(w.b, 39)], [Math.sin(w.b * D2R), 0, -Math.cos(w.b * D2R)], 6, 1.9) });
  }
  // six fans 18 m across under the dome, one turn in 8 s
  for (let k = 0; k < 6; k++) {
    const A = new Acc(), b = 30 + k * 60, c = [bx(b, 38), 186.5, bz(b, 38)], steel = mix3(COL.steel, COL.silver, 0.4);
    for (let j = 0; j < 5; j++) { const a = j * 72; A.quad([bx(a - 9, 1.2), 0.5, bz(a - 9, 1.2)], [bx(a - 14, 9), 0.9, bz(a - 14, 9)], [bx(a + 14, 9), -0.5, bz(a + 14, 9)], [bx(a + 9, 1.2), -0.3, bz(a + 9, 1.2)], steel, STEEL); A.quad([bx(a - 9, 1.2), 0.45, bz(a - 9, 1.2)], [bx(a + 9, 1.2), -0.35, bz(a + 9, 1.2)], [bx(a + 14, 9), -0.55, bz(a + 14, 9)], [bx(a - 14, 9), 0.85, bz(a - 14, 9)], mul(steel, 0.8), STEEL); }
    A.cyl(0, -0.8, 0, 1.4, 5.5, 0.5, 10, mul(steel, 0.7), STEEL, 'b');
    const m = add(A, 'fan'); m.position.set(c[0], c[1], c[2]);
    ticks.push((t) => { m.rotation.y = S.fan[k] + t * TAU / 8; });
    courses.push({ name: 'fan', capsules: rimCourse(c, [0, 1, 0], 8.6, 1.3) });
  }
  await pause();
  // two goods lifts on guide rails in slots of the floors' edges: from the works' lower floor (y 50) to the top home
  // street (y 113) and back in 70 s and 90 s. EACH CAGE IS AN OPEN CAGE OF BARS, 3 m square and 3.8 m high: a floor
  // plate and a roof plate, four corner posts, a waist rail with upright bars below it and a cross brace above it on
  // three sides (the side toward the floors is its open doorway), a lamp under its roof and that lamp's pool on its
  // floor, two crates, guide shoes back to the two rails, and a crosshead over its roof from which its cable runs up
  // to the head sheave (the cable is a mover of its own: it shortens as the cage climbs)
  LIFT_B.forEach((b, i) => {
    const A = new Acc(), col = mix3(COL.steel, COL.rust, 0.3), yaw = yawRadial(b), T = [Math.cos(b * D2R), Math.sin(b * D2R)], N = [Math.sin(b * D2R), -Math.cos(b * D2R)], ph = lph(S);
    const P = (u, y, v) => [T[0] * u + N[0] * v, y, T[1] * u + N[1] * v];
    A.box(0, 0.08, 0, 1.5, 0.08, 1.5, yaw, col, STEEL); A.box(0, 3.72, 0, 1.5, 0.08, 1.5, yaw, col, STEEL);
    for (const u of [-1.42, 1.42]) for (const v of [-1.42, 1.42]) A.beam(P(u, 0.16, v), P(u, 3.64, v), 0.07, 0.07, col);
    for (const [a, c] of [[[-1.42, -1.42], [1.42, -1.42]], [[-1.42, -1.42], [-1.42, 1.42]], [[1.42, -1.42], [1.42, 1.42]]]) { const L = (t, y) => P(a[0] + (c[0] - a[0]) * t, y, a[1] + (c[1] - a[1]) * t);
      A.beam(L(0, 1.25), L(1, 1.25), 0.05, 0.05, col); for (let k = 1; k < 6; k++) A.beam(L(k / 6, 0.16), L(k / 6, 1.25), 0.025, 0.025, COL.iron);
      A.beam(L(0, 1.25), L(1, 3.64), 0.035, 0.035, COL.iron); A.beam(L(1, 1.25), L(0, 3.64), 0.035, 0.035, COL.iron); }
    A.beam(P(-1.42, 3.0, 1.42), P(1.42, 3.0, 1.42), 0.05, 0.05, col);
    { const l = P(0, 3.3, 0); A.box(l[0], l[1], l[2], 0.26, 0.24, 0.26, yaw, COL.amber, glow(2.6, ph)); A.quadOut(P(-1.2, 0.17, -1.2), P(-1.2, 0.17, 1.2), P(1.2, 0.17, 1.2), P(1.2, 0.17, -1.2), [0, -1, 0], COL.amber, glow(0.2, ph)); }
    for (const [u, v, h] of [[-0.7, -0.5, 0.45], [0.55, 0.3, 0.6]]) { const c = P(u, 0.16 + h, v); A.box(c[0], c[1], c[2], h, h, h, yaw + 0.3 * u, COL.wood); }
    for (const u of [-1.6, 1.6]) for (const y of [0.5, 3.4]) { const c = P(u, y, 1.58); A.box(c[0], c[1], c[2], 0.16, 0.14, 0.16, yaw, COL.iron, STEEL); }
    A.beam(P(-1.3, 3.94, 1.2), P(1.3, 3.94, 1.2), 0.09, 0.14, col);
    const m = add(A, 'lift cage'), x = bx(b, 38.5), z = bz(b, 38.5), period = i ? 90 : 70, y0 = K.WORKS[0] + 0.4, y1 = K.HOMES[3] + 0.4, head = K.HOMES[3] + 6.1;
    const C = new Acc(), h = P(-0.5, 0, 1.2); C.beam([0, 0, 0], [0, 1, 0], 0.03, 0.03, COL.iron); const cable = add(C, 'lift cable');
    ticks.push((t) => { const y = y0 + (y1 - y0) * (0.5 - 0.5 * Math.cos((t / period + S.liftPh[i]) * TAU)); m.position.set(x, y, z); cable.position.set(x + h[0], y + 4.08, z + h[2]); cable.scale.y = head - (y + 4.08); });
    courses.push({ name: 'lift cage', capsules: [[x, y0 + 2.2, z, x, y1 + 2.2, z, 2.3]] });
  });
  // SEVEN FLAT BARGES of crates, one to a berth: each keeps to its own berth of its own reach, drifting slowly to and
  // fro along it on its own period and phase, or lies moored at one end; none comes to a wheel or a gate
  S.barges.forEach((g, i) => { const A = new Acc(), hull = lin('#5a4634'), [b0, b1] = BERTHS[i], hw = g.len / 39 / D2R / 2, mid = (b0 + b1) / 2, amp = Math.max(0, (b1 - b0) / 2 - hw - 1);
    A.sector(-hw, hw, 37.3, 40.7, K.BELL_TOP + 0.1, K.BELL_TOP + 1.0, hull, NOAUX, 3, 'tioe');
    const col = mix3(lin('#a8834e'), CLOTH[Math.min(2, Math.floor(g.tint * 3))], 0.35 * g.tint);
    for (let c = 0; c < g.load; c++) { const cb = -hw + (c + 0.7) * (2 * hw / (g.load + 0.4)); A.box(bx(cb, 39), K.BELL_TOP + 1.8, bz(cb, 39), 0.9, 0.8, 0.9, yawRadial(cb), col, NOAUX); }
    noteBands(S, 'barge load', Array.from({ length: g.load }, () => ({ w: 1.8, col })));
    const m = add(A, 'barge'), at = (t) => mid + amp * (g.moored ? Math.sign(g.at || 1) : Math.sin(g.ph + t * TAU / g.period));
    ticks.push((t) => { m.rotation.y = -at(t) * D2R; });
    const arc = [], lo = mid - amp - hw, hi = mid + amp + hw, n = Math.max(1, Math.ceil((hi - lo) / 6));
    for (let k = 0; k < n; k++) { const a = lo + (hi - lo) * k / n, b = lo + (hi - lo) * (k + 1) / n; arc.push([bx(a, 39), K.BELL_TOP + 1.4, bz(a, 39), bx(b, 39), K.BELL_TOP + 1.4, bz(b, 39), 2.3]); }
    courses.push({ name: 'barge', capsules: g.moored ? [[bx(at(0) - hw, 39), K.BELL_TOP + 1.4, bz(at(0) - hw, 39), bx(at(0) + hw, 39), K.BELL_TOP + 1.4, bz(at(0) + hw, 39), 2.3]] : arc }); });
  await pause();
  // THE GENERATOR DRUMS in the gallery's niches: each turns on its bed once in 6 s (ribs and painted end plates show the turning)
  GEN_AT.forEach((q, i) => { const A = new Acc(), teal = COL.steel, rusty = mix3(COL.steel, COL.rust, 0.55);
    drumH(A, [0, 0, 0], [0, 0, 1], 2.6, 8, 12, teal, STEEL, rusty); for (const e of [-3, 0, 3]) drumH(A, [0, 0, e], [0, 0, 1], 2.72, 0.5, 12, rusty);
    // (THE TURNING IS SEEN: every second of its twelve staves is a segment of bare worn copper standing a little proud
    // of the teal shell between the hoops; four bars along its length and four painted spokes on each end plate)
    for (let k = 0; k < 12; k += 2) { const P = (j, e) => { const a = j / 12 * TAU; return [Math.sin(a) * 2.66, Math.cos(a) * 2.66, e]; };
      for (const [e0, e1] of [[-3.9, -3.3], [-2.7, -0.3], [0.3, 2.7], [3.3, 3.9]]) A.quadOut(P(k, e0), P(k + 1, e0), P(k + 1, e1), P(k, e1), [0, 0, 0], COPPER, STEEL); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, sx = Math.sin(a), cy = Math.cos(a); A.beam([sx * 2.74, cy * 2.74, -3.6], [sx * 2.74, cy * 2.74, 3.6], 0.14, 0.14, COL.iron, STEEL, true);
      for (const e of [-4.06, 4.06]) A.beam([sx * 0.3, cy * 0.3, e], [sx * 2.4, cy * 2.4, e], 0.12, 0.12, k % 2 ? COL.amber : COL.iron, STEEL, true); }
    const m = add(A, 'generator drum'); m.position.set(q[0], 3.5, q[1]);
    ticks.push((t) => { m.rotation.z = S.genPh[i] + t * TAU / 6; });
    courses.push({ name: 'generator drum', capsules: [[q[0], 3.5, q[1] - 4, q[0], 3.5, q[1] + 4, 3]] }); });
  // IN THE WORKS' BAYS: each drop hammer's tup climbs between its columns and drops on the anvil (once in 3.2 to 4.6 s);
  // each line shaft turns its three belt wheels once in 4 s; each foundry's ladle travels out and back along its rail
  K.WORKS.forEach((F, ring) => { for (let k = 0; k < 24; k++) { const id = ring * 24 + k, tr = S.trade[id], bc = k * 15 + 7.5, X = frontFrame(bc, K.FRONT_R + 0.05), h = S.hammer[id];
    if (notched(bc - 4) || notched(bc + 4) || tr < 1 || tr > 3) continue;
    const A = new Acc(), g = new THREE.Group(); g.rotation.y = -bc * D2R;
    if (tr === 1) { A.box(0, 0, 0, 0.9, 0.8, 0.5, 0, COL.iron, STEEL); A.box(0, 1.1, 0, 0.25, 0.4, 0.25, 0, mix3(COL.steel, COL.rust, 0.4), STEEL);
      const m = add(A, 'hammer tup'), c = X(0, F, 6); group.remove(m); g.add(m); group.add(g); g.position.set(c[0], 0, c[2]);
      // (it climbs through two thirds of its period, hangs a moment, and falls in a tenth of it)
      ticks.push((t) => { const u = (t / h.period + S.bayPh[id]) % 1, up = u < 0.66 ? smoothstep(0, 0.66, u) : u < 0.8 ? 1 : u < 0.9 ? 1 - ((u - 0.8) / 0.1) ** 2 : 0; m.position.y = F + 2 + 3.6 * up; });
      courses.push({ name: 'hammer tup', capsules: [[c[0], F + 2, c[2], c[0], F + 6.4, c[2], 1.4]] }); }
    else if (tr === 2) { const rusty = mix3(COL.steel, COL.rust, 0.55);
      drumH(A, [0, 0, 0], [1, 0, 0], 0.22, 9.4, 6, COL.iron);
      for (const [e, R] of [[-2.6, 1.3], [0.4, 1.7], [3, 1.1]]) { drumH(A, [e, 0, 0], [1, 0, 0], R, 0.36, 10, rusty, STEEL, COL.steel); A.box(e - 0.2, 0, 0, 0.03, R * 0.92, 0.1, 0, COL.amber, STEEL); A.box(e + 0.2, 0, 0, 0.03, 0.1, R * 0.92, 0, COL.amber, STEEL); }
      const m = add(A, 'belt wheels'), c = X(0, F + 7.6, 5.5); group.remove(m); g.add(m); group.add(g); g.position.set(c[0], c[1], c[2]);
      ticks.push((t) => { m.rotation.x = S.bayPh[id] * TAU + t * TAU / 4; });
      const T = [Math.cos(bc * D2R) * 4.6, Math.sin(bc * D2R) * 4.6]; courses.push({ name: 'belt wheels', capsules: [[c[0] - T[0], c[1], c[2] - T[1], c[0] + T[0], c[1], c[2] + T[1], 1.9]] }); }
    else { A.cyl(0, 0, 0, 1.1, 1.7, 1.3, 8, COL.iron, STEEL, ''); A.cyl(0, 1.55, 0, 1.2, 1.6, 1.2, 8, COL.furnace, fire(2.4, bayW(S, id)), 't'); A.beam([0, 1.7, 0], [0, 5.26, 0], 0.06, 0.06, COL.iron); A.box(0, 5.38, 0, 0.3, 0.12, 0.5, 0, COL.steel, STEEL);
      const m = add(A, 'ladle'), N = [Math.sin(bc * D2R), -Math.cos(bc * D2R)], c = X(-0.2, F + 3.2, 0);
      ticks.push((t) => { const d = 6.4 + 3.4 * Math.sin(S.bayPh[id] * TAU + t * TAU / h.ladle); m.position.set(c[0] + N[0] * d, F + 3.2, c[2] + N[1] * d); });
      courses.push({ name: 'ladle', capsules: [[c[0] + N[0] * 3, F + 4.5, c[2] + N[1] * 3, c[0] + N[0] * 9.8, F + 4.5, c[2] + N[1] * 9.8, 1.6]] }); } } });
  await pause();
  // THE SPRAY BOOMS on the terraces: each boom's arm swings 35 degrees to each side on its mast, once in 18 s
  S.mist.forEach((mi, i) => { const k = i % 5, y = K.TERRACES[k], A = new Acc(), c = P3(mi.b, K.FRONT_R + 4 * k + 1.2, y + 6.2);
    A.beam([-3, 0, 0], [3, 0, 0], 0.07, 0.07, COL.steel); for (const e of [-2.6, -1.3, 1.3, 2.6]) A.beam([e, 0, 0], [e, -0.35, 0], 0.03, 0.03, COL.iron); A.box(0, 0.1, 0, 0.22, 0.16, 0.22, 0, COL.iron, STEEL);
    const m = add(A, 'boom arm'); m.position.set(c[0], c[1], c[2]);
    ticks.push((t) => { m.rotation.y = -mi.b * D2R + 35 * D2R * Math.sin(mi.ph * TAU + t * TAU / 18); });
    courses.push({ name: 'boom arm', capsules: [[c[0], c[1], c[2], c[0], c[1], c[2], 3.2]] }); });
  // two beam engines before the piers at 60 and 120: each beam 20 m long rocks on its trestle once in 5 s
  ENGINE_B.forEach((b, i) => {
    const A = new Acc(), g = new THREE.Group(), c = P3(b, 26, 12.9);
    A.box(0, 0, 0, 10, 0.7, 0.45, 0, mix3(COL.steel, COL.rust, 0.3), STEEL); A.box(0, 0, 0, 0.9, 1, 0.7, 0, COL.iron, STEEL);
    for (const e of [-9.2, 9.2]) A.box(e, -0.2, 0, 0.5, 0.9, 0.6, 0, COL.iron, STEEL);
    const m = add(A, 'beam engine'); group.remove(m); g.add(m); group.add(g); g.position.set(c[0], c[1], c[2]); g.rotation.y = -b * D2R;
    ticks.push((t) => { m.rotation.z = 0.2 * Math.sin(S.beam[i] + t * TAU / 5); });
    const T = [Math.cos(b * D2R) * 10, Math.sin(b * D2R) * 10];
    courses.push({ name: 'beam engine', capsules: [[c[0] - T[0], c[1], c[2] - T[1], c[0] + T[0], c[1], c[2] + T[1], 3]] });
  });
  await pause();
  // the works' crane: a trolley on the curved rail (r 36.5, y 71.4) carrying a crate on a cable, from bearing 250 round by north to 20 and back in 120 s
  { const A = new Acc(), p = P3(0, 36.5, 0);
    A.box(p[0], 70.78, p[2], 1.1, 0.3, 0.8, yawRadial(0), COL.steel, STEEL); A.beam([p[0], 70.5, p[2]], [p[0], 68.6, p[2]], 0.05, 0.05, COL.iron);
    // (its load: a slatted crate in a rope sling, the ropes running from the hook down both sides and under it)
    A.box(p[0], 66.4, p[2], 1.1, 1.1, 1.1, 0, mul(COL.wood, 0.55)); for (const y of [65.5, 66.1, 66.7, 67.3]) A.box(p[0], y, p[2], 1.2, 0.22, 1.2, 0, COL.wood);
    for (const e of [-1, 1]) for (const f of [-1, 1]) { A.beam([p[0], 68.6, p[2]], [p[0] + e * 1.24, 67.5, p[2] + f * 0.7], 0.03, 0.03, COL.grain, NOAUX); A.beam([p[0] + e * 1.24, 67.5, p[2] + f * 0.7], [p[0] + e * 1.24, 65.25, p[2] + f * 0.7], 0.03, 0.03, COL.grain, NOAUX); }
    for (const f of [-1, 1]) A.beam([p[0] - 1.24, 65.25, p[2] + f * 0.7], [p[0] + 1.24, 65.25, p[2] + f * 0.7], 0.03, 0.03, COL.grain, NOAUX);
    const m = add(A, 'crane'); ticks.push((t) => { m.rotation.y = -(250 + 130 * (0.5 - 0.5 * Math.cos((t / 120 + S.cranePh) * TAU))) * D2R; });
    const arc = []; for (let a = 250; a < 380; a += 5) arc.push([bx(a, 36.5), 68.4, bz(a, 36.5), bx(a + 5, 36.5), 68.4, bz(a + 5, 36.5), 3.3]);
    courses.push({ name: 'crane', capsules: arc }); }
  // five drums of greens, one on each terrace in the bay its deal gave it, each turning once in 30 s on its trestles
  S.drumAt.forEach((d, i) => {
    const A = new Acc(), g = new THREE.Group(), bc = d.j * 15 + 7.5, c = P3(bc, K.FRONT_R + 4 * d.k + 2.05, K.TERRACES[d.k] + 2.3), R = 1.5, L = 6, n = 10;
    for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, P = (a, e) => [e * L / 2, Math.cos(a) * R, Math.sin(a) * R];
      A.quadOut(P(a0, -1), P(a1, -1), P(a1, 1), P(a0, 1), [0, 0, 0], k % 2 ? COL.leaf : COL.leafDeep, STEEL);
      for (const e of [-1, 1]) A.triOut([e * L / 2, 0, 0], P(a0, e), P(a1, e), [0, 0, 0], COL.steel, STEEL); }
    const m = add(A, 'drum of greens'); group.remove(m); g.add(m); group.add(g); g.position.set(c[0], c[1], c[2]); g.rotation.y = -bc * D2R;
    ticks.push((t) => { m.rotation.x = d.ph + t * TAU / 30; });
    const T = [Math.cos(bc * D2R) * 3, Math.sin(bc * D2R) * 3];
    courses.push({ name: 'drum of greens', capsules: [[c[0] - T[0], c[1], c[2] - T[1], c[0] + T[0], c[1], c[2] + T[1], 1.9]] });
  });
  return { group, courses, update(t) { for (const f of ticks) f(t); } };
}

// ---------------------------------------------------------------- media: steam, spray, mist, dust, sparks
// Small soft sheets, each on a course of its own in the world (a place, a drift, a life on the world's clock), that turn
// about their own place to face the eye. They are media, flown through or past: near the eye they thin with the true
// distance, with no step. list: { p, size [w, h], vel [x, y, z] metres a second, life seconds, ph, col, a, grow }
const WISP_VERT = /* glsl */`
attribute vec3 iPos, iVel, iCol; attribute vec4 iPar; attribute vec2 iAl;
uniform float uTime, uCrisp; uniform vec3 uEye, uSun;
varying vec2 vUv; varying vec3 vCol, vW; varying float vAl, vSeed, vGold, vSide;
void main(){
  float age = fract(uTime / max(iPar.z, 0.01) + iPar.w);
  // (a plume leans more with the wind the higher it has risen, and starts whole at its stack's mouth)
  float lean = uCrisp > 2.5 ? pow(age, 1.6) : age;
  vec3 c = iPos + vec3(iVel.x * lean, iVel.y * age, iVel.z * lean) * iPar.z;
  float g = 1. + iAl.y * age;
  vec3 toEye = uEye - c; float dist = length(toEye);
  vec3 right = normalize(vec3(toEye.z, 0., -toEye.x) + vec3(1e-4, 0., 0.));
  vec3 wp = c + right * position.x * iPar.x * g + vec3(0., 1., 0.) * position.y * iPar.y * g;
  // dust and steam take the sun's gold only where the eye looks through them toward the sun; and a plume shows which
  // of its sides is turned to the sun
  vec3 e = normalize(wp - uEye), sh = normalize(vec3(uSun.x, 0., uSun.z)); vGold = pow(max(dot(e, sh), 0.), 3.); vSide = clamp(dot(right, sh) * 2.5, -1., 1.);
  vUv = position.xy + 0.5; vCol = iCol; vSeed = iPar.w * 37.;
  vAl = iAl.x * (uCrisp > 2.5 ? smoothstep(0., 0.03, age) * (1. - smoothstep(0.25, 1., age)) : smoothstep(0., 0.18, age) * (1. - smoothstep(0.55, 1., age))); vW = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const WISP_FRAG = /* glsl */`
precision highp float;
${GLSL_HASH}
${GLSL_VALUE_NOISE}
uniform float uTime, uCrisp, uNear; uniform vec3 uBand, uEye;
varying vec2 vUv; varying vec3 vCol, vW; varying float vAl, vSeed, vGold, vSide;
void main(){
  vec2 q = vUv - 0.5; float rad = length(q);
  // A MEDIUM THINS ONLY AT THE LENS ITSELF: within 0.6 to 2.5 m of the eye, by this fragment's own distance
  // (uNear is 1 for a medium, 0 for drips and sparks: those are bodies, kept off the line by place, and never thin)
  float nearK = mix(1., smoothstep(0.6, 2.5, length(vW - uEye)), uNear);
  if (uCrisp > 1.5 && uCrisp < 2.5) {
    // a low veil of blown dust: thickest at the ground, torn along its length as it runs, soft at its top and both ends
    float nz = vnoise(vec2(vUv.x * 5. - uTime * 0.35 + vSeed, vUv.y * 1.5 + vSeed * 1.7)) * 0.6 + vnoise(vec2(vUv.x * 13. - uTime * 0.6, vUv.y * 3. + vSeed)) * 0.4;
    float body = (1. - smoothstep(0.08, 1., vUv.y)) * smoothstep(0., 0.06, vUv.y) * smoothstep(0., 0.22, vUv.x) * (1. - smoothstep(0.78, 1., vUv.x));
    // (slate where the sun stands behind the eye, gold and brighter where the sun stands behind the dust)
    gl_FragColor = vec4(mix(vCol, uBand * vec3(1.5, 1.25, 0.95), vGold), clamp(vAl * nearK * body * smoothstep(0.28, 0.72, nz) * (0.7 + 0.5 * vGold), 0., 1.)); return;
  }
  float n = vnoise(vec2(vUv.x * 3. + vSeed, vUv.y * 3. - uTime * 0.22 + vSeed)) * 0.6 + vnoise(vUv * 7.5 + vec2(vSeed * 1.7, -uTime * 0.4)) * 0.4;
  float fall = 1. - smoothstep(0.12, 0.5, rad);
  float soft = fall * smoothstep(0.22, 0.8, n + fall * 0.4);
  float crisp = 1. - smoothstep(0.15, 0.5, rad);
  if (uCrisp > 2.5) {
    // A PLUME ON THE LAND: the side of each puff turned to the sun is warm, the other cool and dark; with the sun
    // behind it its rim burns
    float lit = smoothstep(-0.3, 0.3, (vUv.x - 0.5) * vSide) * (1. - 0.6 * vGold);
    vec3 pc = mix(vCol * 0.55, uBand * vec3(1.25, 1.05, 0.85), lit) + uBand * 1.3 * vGold * smoothstep(0.2, 0.45, rad);
    gl_FragColor = vec4(pc, clamp(vAl * nearK * soft, 0., 1.)); return; }
  gl_FragColor = vec4(vCol, clamp(vAl * nearK * mix(soft, crisp, uCrisp), 0., 1.));
}`;
export function makeWisps(shared, list, opts = {}) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const iPos = new Float32Array(n * 3), iVel = new Float32Array(n * 3), iCol = new Float32Array(n * 3), iPar = new Float32Array(n * 4), iAl = new Float32Array(n * 2);
  let reach = 0;
  list.forEach((w, i) => {
    iPos.set(w.p, i * 3); iVel.set(w.vel || [0, 0, 0], i * 3); iCol.set(w.col, i * 3);
    iPar.set([w.size[0], w.size[1], w.life || 6, w.ph || 0], i * 4); iAl.set([w.a ?? 0.5, w.grow || 0], i * 2);
    const v = w.vel || [0, 0, 0]; reach = Math.max(reach, Math.hypot(v[0], v[1], v[2]) * (w.life || 6) + Math.max(w.size[0], w.size[1]) * (1 + (w.grow || 0)) * 0.5);
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iVel', new THREE.InstancedBufferAttribute(iVel, 3));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(iPar, 4));
  g.setAttribute('iAl', new THREE.InstancedBufferAttribute(iAl, 2));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 100, 0), 1e5);
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: shared.uTime, uEye: shared.uEye, uBand: shared.uBand, uSun: shared.uSun, uCrisp: { value: opts.plume ? 3 : opts.veil ? 2 : opts.crisp ? 1 : 0 }, uNear: { value: opts.body ? 0 : 1 } }, vertexShader: WISP_VERT, fragmentShader: WISP_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.userData.kind = 'medium'; mesh.userData.reach = reach; mesh.renderOrder = opts.order ?? 5; mesh.name = opts.name || 'wisps';
  return mesh;
}

// ---------------------------------------------------------------- the hero: the whole shaft and its lid
export async function buildHero(ctx, opts = {}) {
  const seed = ctx.seed ?? 1, S = opts.deal || dealTown(seed, opts.density ?? 1), shared = opts.shared || makeShared(), detail = opts.detail ?? 1, rare = !!opts.rare, density = opts.density ?? 1;
  const mat = makeTownMaterial(shared), matSoft = makeTownMaterial(shared, { double: true }), matWater = makeTownMaterial(shared, { water: true }), object = new THREE.Group(), soft = new Acc(), water = new Acc();
  const mesh = (A, name, m = mat) => { const me = new THREE.Mesh(A.toGeometry(), m); me.name = name; me.frustumCulled = false; object.add(me); return me; };
  const acc = () => { const A = new Acc(); A.soft = soft; A.water = water; return A; };
  { const A = acc(); for (let q = 0; q < 4; q++) { buildShell(A, q); await ctx.yield(); } mesh(A, 'shell: bell, bore, bowl, sill'); }
  await ctx.yield();
  { const A = acc(); for (let q = 0; q < 6; q++) { buildStair(A, S, q); await ctx.yield(); } buildLamps(A, S); buildMarket(A, S); await ctx.yield(); mesh(A, 'the stair, landings, bridges and market'); }
  await ctx.yield();
  { const A = acc(); buildLid(A, S); await ctx.yield(); buildLidDress(A, S); await ctx.yield(); buildLantern(A, S); mesh(A, 'the lid: vanes, eave, dome, ribs, cisterns, the great lantern'); }
  await ctx.yield();
  { const A = acc(); buildHall(A, S); await ctx.yield(); buildHallFloor(A, S); await ctx.yield(); buildWaterRing(A, S, rare); await ctx.yield(); buildWallDress(A, S); await ctx.yield(); mesh(A, 'hall and water ring'); }
  await ctx.yield();
  { const A = acc(); buildWorks(A, S, 0); await ctx.yield(); buildWorks(A, S, 1); buildLifts(A); await ctx.yield(); mesh(A, 'workshop rings'); }
  await ctx.yield();
  for (let pair = 0; pair < 2; pair++) { const A = acc(); for (let q = 0; q < 6; q++) { buildHomes(A, S, detail, pair * 2 + (q / 3 | 0), q % 3); await ctx.yield(); } mesh(A, 'home streets'); await ctx.yield(); }
  await ctx.yield();
  { const A = acc(); for (let q = 0; q < 5; q++) { buildFarm(A, S, detail, q); await ctx.yield(); } mesh(A, 'farm bowl'); }
  await ctx.yield();
  mesh(soft, 'cloth and leaves', matSoft); mesh(water, 'falling water', matWater).renderOrder = 4;
  await ctx.yield();
  const movers = await buildMovers(S, mat, () => ctx.yield()); object.add(movers.group);
  await ctx.yield();
  S.furn.forEach((f, i) => shared.uFurn.value[i].set(f.on ? 1 : 0.22, f.ph, 0, FURNACE_B[i] * D2R));
  for (let id = 0; id < 48; id++) { const k = id % 24, slot = notched(k * 15 + 3.5) || notched(k * 15 + 11.5); shared.uBay.value[id >> 2].setComponent(id & 3, slot ? -1 : S.trade[id] + 0.02 + 0.96 * S.bayPh[id]); }
  S.houses.forEach((h, id) => { shared.uLit.value[id >> 2].setComponent(id & 3, (h.lampOn ? 1 : 0) + 0.98 * h.lit.filter(Boolean).length / h.lit.length); shared.uDoor.value[id >> 2].setComponent(id & 3, doorLampX(h)); });
  { const v = vaneList()[0]; shared.uVane.value = bearingOf(v.nose[0], v.nose[1]) % 22.5; shared.uStain.value.set(S.stain[0], S.stain[1]); }
  // MEDIA (flown past, never bodies): steam from the boilers, the engines and the furnace flues on the dealt schedule; spray
  // where the falls and the spillway break; mist by the spray booms; sparks in the forges, the hammers and the foundries
  // Every phase, life and drift of spray, mist and sparks is dealt by the 'spray' stream, in the order the things are named here.
  const soft2 = [], sparks = [], drops = [], gsp = stream('spray', seed), sp = (a, b) => gsp.range(a, b);
  const steamAt = [...[105, 135, 161].map((b) => P3(b, 48.5, 5.9)), ...ENGINE_B.map((b) => { const c = P3(b, 26, 7.6); return [c[0] - Math.cos(b * D2R) * 8.6, 7.6, c[2] - Math.sin(b * D2R) * 8.6]; }), ...FURNACE_B.slice(0, 5).map((b) => P3(b, 57, 8.5))];
  // STEAM JETS from the hall's grated trenches: one to a trench at a dealt place along it (8 m and more from the flown
  // line), a short hard puff that rises 6 m and thins, again and again on its own dealt time and phase
  TRENCH_B.forEach((b) => { const R = trenchR(b), u = sp(0, 1), p = P3(b, R[0] > 31 ? R[0] + 0.5 + u * (R[1] - R[0] - 1) : 38.5 + 9.5 * u, 0.3), life = sp(1.7, 2.6), ph = sp(0, 1);
    for (let q = 0; q < 3; q++) soft2.push({ p, size: [0.7, 1.1], vel: [sp(-0.3, 0.3), sp(2.4, 3.4), sp(-0.3, 0.3)], life, ph: ph + q * 0.33, col: [0.78, 0.78, 0.8], a: 0.3, grow: 2.2 }); });
  // THE GENERATORS' EXHAUSTS: at each stack's cowl a puff rises 3 to 4.5 m and thins under the vault, again and again
  // on its own dealt life and phase ('gallery'); 14 m and more from the flown line
  GEN_AT.forEach((g, i) => { const e = S.exh[i], p = EXH_AT(g);
    for (let q = 0; q < 3; q++) soft2.push({ p, size: [1.3, 1.5], vel: [0.12 * (q - 1), 1.2 + 0.4 * e.k, e.drift], life: e.life, ph: e.ph + q * 0.33, col: [0.8, 0.79, 0.78], a: 0.4 * e.k, grow: 2.4 }); });
  // STEAM IN THE GALLERY: a leak at a flange of each inner pipe under the vault (four, by place: the flanges at z -95 and
  // -55 on the west run, -75 and -115 on the east), a thin jet that blows down and inward and thins, on its dealt life and
  // phase ('gallery'); 7 m and more from the flown line
  [[-39, -95], [-21, -75], [-39, -55], [-21, -115]].forEach(([x, z], i) => { const e = S.leak[i], sx = Math.sign(x - K.GALLERY_X);
    for (let q = 0; q < 3; q++) soft2.push({ p: [x, vaultY(9) - 1.8, z], size: [0.8, 0.8], vel: [-sx * 0.5, -0.9, 0.25 * (q - 1)], life: e.life, ph: e.ph + q * 0.33, col: [0.8, 0.79, 0.78], a: 0.36, grow: 3 }); });
  // THE WARM HAZE INSIDE THE MOUTH: steam that hangs under the ledge round the two great lamps and is lit by them
  // (it gives light: its sheets add to what is seen through them)
  const haze = S.haze.map((h) => ({ p: [K.GALLERY_X + h.x, h.y - 2, h.z], size: [16, 10], vel: [0.12, 0.1, 0.25], life: h.life, ph: h.ph, col: [0.62, 0.36, 0.15], a: 0.26, grow: 0.4 }));
  // (a plume's dealt strength is its thickness and its spread)
  steamAt.forEach((p, i) => { const s = S.steam[i]; for (let q = 0; q < 3; q++) soft2.push({ p: [p[0], p[1] + q * 0.6, p[2]], size: [2.4 + q * 0.7, 3 + q * 0.6], vel: [0.25 * Math.sin(i * 2.1 + q), 0.75 + 0.2 * q, 0.25 * Math.cos(i * 1.7 + q)], life: s.period, ph: s.ph + q * 0.035, col: [0.74, 0.71, 0.68], a: 0.2 + 0.24 * s.k, grow: 1.2 + 0.8 * s.k }); });
  // where a fall strikes its apron: spray thrown outward and up, and a mist that drifts off into the well; white churn at the wheel's foot
  for (const w of S.wheel) { const X = frontFrame(w.b, 38.5), T = [Math.cos(w.b * D2R), Math.sin(w.b * D2R)], N = [Math.sin(w.b * D2R), -Math.cos(w.b * D2R)];
    // (no cloud hangs over the wheel: the 'spray' stream's draws for the mist that hung there are still made and left
    // unused, so every later deal stands)
    // (ROUND FOUR: nor any spray over the trough the fall lands in; those eighty draws are made and left unused too)
    for (let q = 0; q < 80; q++) sp(0, 1);
    for (let q = 0; q < 4; q++) for (let d = 0; d < 11; d++) sp(0, 1);
    for (let q = 0; q < 4; q++) soft2.push({ p: X(sp(-2.4, 2.4), 28.9, sp(-0.6, 1.4)), size: [sp(1.6, 2.6), sp(1, 1.6)], vel: [T[0] * sp(-0.8, 0.8), sp(0.5, 1.3), T[1] * sp(-0.8, 0.8)], life: sp(1.4, 2.3), ph: sp(0, 1), col: [0.86, 0.9, 0.9], a: 0.3, grow: 1.1 }); }
  // where the spillway's curtain strikes the sump: spray thrown up and outward along its foot, and a mist that drifts across the hall floor
  for (let q = 0; q < 14; q++) { const b = sp(166, 194), out = sp(-1.6, 1.6); soft2.push({ p: P3(b, 34.3 + sp(-0.5, 0.5), 1.1), size: [sp(2.4, 3.6), sp(2, 3)], vel: [Math.sin(b * D2R) * out, sp(1.4, 3), -Math.cos(b * D2R) * out], life: sp(1.5, 2.6), ph: sp(0, 1), col: [0.86, 0.9, 0.92], a: 0.36, grow: 1.3 }); }
  for (let q = 0; q < 6; q++) { const b = sp(167, 193), inw = sp(0.25, 0.6); soft2.push({ p: P3(b, 33.5, 2 + sp(0, 2.5)), size: [sp(7, 10), sp(4, 6)], vel: [-Math.sin(b * D2R) * inw, sp(0.15, 0.35), Math.cos(b * D2R) * inw], life: sp(9, 12), ph: sp(0, 1), col: [0.78, 0.82, 0.86], a: 0.12, grow: 0.7 }); }
  S.mist.forEach((m, i) => { const k = i % 5, T = [Math.cos(m.b * D2R), Math.sin(m.b * D2R)]; for (let q = 0; q < 4; q++) { const p = P3(m.b + (q - 1.5) * 1.6, K.FRONT_R + 4 * k + 1.2, K.TERRACES[k] + 5.3); soft2.push({ p, size: [4.4, 2.6], vel: [T[0] * 0.5, -0.12, T[1] * 0.5], life: 9, ph: m.ph + q * 0.25, col: [0.82, 0.8, 0.9], a: 0.2 * density, grow: 0.6 }); } });
  // THE CISTERNS DRIP: two drops at a time fall from each tank's drain cock to the sill, each on its own dealt phase
  vaneList().forEach((v, i) => { const b = bearingOf(v.nose[0], v.nose[1]), p = P3(b, CISTERN.R, K.SILL_Y + CISTERN.LEG - 0.3);
    for (let q = 0; q < 2; q++) drops.push({ p, size: [0.09, 0.3], vel: [0, -1.05, 0], life: 0.8, ph: S.drip + S.drips[i][q], col: [0.62, 0.7, 0.8], a: 0.7, grow: 0 }); });
  // steam from the chimneys of the houses that keep a stove lit: it rises a little, cools and drifts out from under the soffit into the well
  K.HOMES.forEach((F, ring) => { for (let i = 0; i < HOUSE_N[ring]; i++) { const h = S.houses[HOUSE_BASE[ring] + i]; if (!h.smoke) continue; const bc = (i + 0.5) * 360 / HOUSE_N[ring], p = frontFrame(bc, K.HOUSE_R)(chimneyX(h), chimneyTop(h, F) + 0.3, 1.35), N = [Math.sin(bc * D2R), -Math.cos(bc * D2R)];
    for (let q = 0; q < 3; q++) soft2.push({ p, size: [1.1, 1.3], vel: [-N[0] * sp(0.4, 0.7), sp(0.3, 0.5), -N[1] * sp(0.4, 0.7)], life: sp(4.5, 7), ph: h.smokePh + q * 0.33, col: [0.74, 0.72, 0.7], a: 0.36, grow: 2.2 }); } });
  K.WORKS.forEach((F, ring) => { for (let k = 0; k < 24; k++) { const id = ring * 24 + k, tr = S.trade[id]; if (tr !== 0 && tr !== 1 && tr !== 3) continue; const bc = k * 15 + 7.5, d = tr === 0 ? 8 : 6, p = P3(bc, K.FRONT_R + d, F + (tr === 1 ? 1.4 : 1.5)), T = [Math.cos(bc * D2R), Math.sin(bc * D2R)];
    for (let q = 0; q < 6; q++) { const sx = sp(-1.6, 1.6); sparks.push({ p, size: [0.16, 0.16], vel: [T[0] * sx - Math.sin(bc * D2R) * 1.2, sp(1.6, 3.6), T[1] * sx + Math.cos(bc * D2R) * 1.2], life: sp(0.9, 1.7), ph: S.bayPh[id] + q * 0.163, col: [2.4, 1.1, 0.3], a: 0.9, grow: 0 }); } } });
  // MOTES IN THE LANTERN'S LIGHT: dust that drifts slowly down among the twelve shafts and shines in their glow
  const motes = S.lantern.motes.map((m) => ({ p: P3(m.b, m.r, m.y), size: [0.16, 0.16], vel: [Math.sin(m.b * D2R) * m.dr, m.vy, -Math.cos(m.b * D2R) * m.dr], life: m.life, ph: m.ph, col: [1.5, 0.8, 0.3], a: 0.85, grow: 0 }));
  const media = [makeWisps(shared, motes, { name: 'motes in the lantern\'s light', additive: true, crisp: true, order: 6 }), makeWisps(shared, soft2, { name: 'steam, spray and mist' }), makeWisps(shared, haze, { name: 'warm haze inside the mouth', additive: true }), makeWisps(shared, sparks, { name: 'sparks', additive: true, crisp: true, order: 6, body: true }), makeWisps(shared, drops, { name: 'drips', crisp: true, body: true })];
  for (const m of media) object.add(m);
  return {
    object, radius: 76, height: K.CROWN, center: new THREE.Vector3(0, 100, 0), anchors: {}, shared, deal: S, courses: movers.courses, material: mat, softMaterial: matSoft,
    update(dt, time) { movers.update(time); },
    dispose() {}, ground: false,
  };
}

