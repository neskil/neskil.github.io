// The Garden Upside Down: the inside of a ball of water at morning. A whole meadow hangs head down from the vault and
// the floor is a cloudscape lit from beneath by a sun that stands under it. We come in level between the two, climb
// to just under the lowest flower heads (they hang like lamps, the grass like green rain behind them, the low sun's
// shafts between the stems) and fly level there, past a brook that runs along the ceiling over a hanging knoll and
// round to the far side of the meadow; from there one long fall out over the open, among towers of cloud, the
// hanging garden a ceiling above and the cloud sea below; fly straight at one elm
// that hangs crown down like a chandelier (the hero part, src/parts/garden-upside-down.js), pass close under its
// crown, and go out along a road of bees and a river of pollen to one gold grain of pollen as tall as a house,
// afloat in deep sky with the low sun beyond it. THE GRAIN'S ONE ROUND MOUTH IS THE EXIT OPENING: nothing is built
// in it or before it; the engine draws there whatever world comes next.
//
// AXES (labels for this world only). -Z is ahead at the entry, +X to the right, +Y up for the eye; the eye is upright
// from first to last, it is the garden that hangs. One ball of water, radius 250 about the origin; the rim is the
// level circle y 18; above it the vault (the meadow's turf, yg in the part: it rolls and hangs in hillocks), below
// it the floor of sky. THE AIR IS CLEAR: the ball's skin is painted nowhere; under the rim it is sky.
//
// THE JOIN IS THE SAME ON EVERY SEED: the vault and its roll, the knoll, the hillocks and their far trees, the
// hanging grass (every blade), the long stalks over the entry, the long hangers of the sky stretch, the rim's hedge,
// vines, ferns, roots and flower strings, the brook's course and stones, the elm and its leaf-falls, the grain, the
// shafts' places, the great blooms, the greater heaps of cloud, the towers with their shoulders and the far rows, the sun's direction (a rule of the last
// straight) and the whole route are plain measures or are dealt from streams with fixed names.
// The visit's seed deals only what stands off the join: the flowers' kinds and places, the lane's kinds, the
// drifting deck of cloud, the hour's colour, bees, their road's start and the swarm, butterflies, birds and their strings,
// motes, petals, the stream of pollen, the shafts' strengths and sways, the rare shower.
// This world reads neither the world before it nor any series.
//
// EVERYTHING GOES BY THE WORLD CLOCK OR STANDS: the tremble and the shudder, the brook, the beads, bees,
// butterflies, birds, cloud, shafts and their pools of light, motes. Nothing begins, turns or ends because the
// visitor comes; light, haze and colour differ only by where a thing stands (under the turf, inside the crown, in
// a shaft, out over the open floor, by the grain).
// THE GAZE AND THE PACE. There is NO declared pacing and NO companion. THE LOOKS AIM AT NAMED PLACES OF THE WORLD
// that stand where they stand (the elm's middle, first from far off and then on the long fall; the grain's
// middle); no aim is reckoned from where the lens is, from its angle or from any
// share of what it shows. Every look's window runs from a place to a place of the line; every weight is a row of
// a table or the outcome of a law of angle between the line's heading and the place. The pace has two eases, each
// centred on a place (the top, the trunk's line).
//
// BODIES (kept off the flown line by place, 2.0 m of clear air and more on every seed): blades,
// stalks, flower heads, the rim's vines and strings, the brook's stones and beads, the elm's wood and leaf masses
// (with its swing), the far trees, bees (the road's by the road's own law), butterflies (by their boxes of wander),
// birds (by their whole courses), the cloud heaps and towers, the grain, the grains of the stream of pollen (by
// their whole loops), the parachute seeds, the leaves and the petals that fall up (by their whole columns; none
// thins toward the eye).
// MEDIA: the gold motes and the grain's dust thin to nothing only within 2.5 m of the lens (by true distance), and
// their columns are kept off the line by place besides; the river's motes keep their size in metres and the river
// its air from the line; the shafts and the rare rain's veils are kept off the line by place and never ask where
// the eye is.
// THE SIGHTS OF THE MOUTH: from THE VIEW (PLACE.view, the metre at which the gaze begins to go to the grain: the
// grain's look opens there) to the crossing nothing that is dealt here stands on a straight line from the flown
// line to the mouth's centre (makeFan); the road of bees lies under those sights and outside the tube of radius 9
// round the last straight.
//
// BEHIND THE ENTRY: the skin stands 80 m behind the entry point; for 60 m back along the level axis and 15 m to
// either side there is only water light (nothing hangs below y 24, no long stalk behind the entry, no cloud top over
// y -62, no creature's course within 20 m of the axis). camera.nearThrough is not set.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, buildGrain, gardenShared, moteMesh, swayAt, yg, lin, GARDEN, RELIEF } from '../parts/garden-upside-down.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const FIXED = 'garden-upside-down:the join';
// ------------------------------------------------------------------ the route (metres)
// THE WHOLE LINE IS LAID BY RULE in plan, as straights and rounds that meet without a corner; its heights are the sum
// of a slope that eases between values at named places of the plan. No place of it is a typed point but the entry's
// own (the join), the brief's fourth point on the axis and the mouth's (the join).
//   THE ENTRY: 60 m straight and level down the entry's axis, and on along the axis to the brief's own fourth point
//   (z 95), which holds the first 60 m exactly straight through the kit's curve.
//   UNDER THE HANGING FLOWERS. THE CLIMB: a left round of CLIMB.r1 leaves the axis there and is flown until the
//   straight that leaves it passes under the brook where it crosses the knoll's lowest turf (BROOK.course[BROOK.flank]);
//   THE LANE is that straight (it begins at THE KNEE). The slope eases up along the round, is CLIMB.slope degrees
//   (the gaze's bound on pitch, LOOK.tilt, less three for the looks) and eases out over CLIMB.easeOut metres: from
//   there on the line is level, CLIMB.under metres under the floor of law (a), the height to which the lowest
//   flower heads hang: UNDER THE HEADS, never among the blades. It is level so to THE TOP, the place under that
//   point of the brook, and on.
//   THE GREAT VIEW. THE FALL: at the top ONE LEFT ROUND of FALL.r begins and is flown, out over the open,
//   until the straight that leaves it points at THE AIM: the place under the elm's crown that stands abreast of the
//   trunk's line, OUT.aim metres from it on the side of the mouth's axis. The round is level, still under the heads,
//   past THE LEAVING (FALL.leave degrees round: where the knoll and the brook are left behind) as far as THE FAR
//   SIDE: the place of the round that stands farthest from the elm's trunk line, with the whole hanging garden
//   across the round from it. From there the slope eases down over FALL.ease metres, holds, and eases out over the
//   last FALL.out metres before the aim. THE VIEW is where the round ends and the straight at the elm begins.
//   THE ELM: that straight, still falling, and the round under the crown (PLACE.crown) to the aim (PLACE.trunk),
//   where the line comes level AT THE MOUTH'S OWN HEIGHT; it stays at that height to the mouth.
//   THE POLLEN ROAD: at the aim a left round of OUT.r, flown until the straight that leaves it and one right round of
//   OUT.last come onto the mouth's axis OUT.before metres before THE LAST STRAIGHT (the join: 60 m, level, on the
//   axis of the mouth).
const BROOK = {
  course: [[-213, 130], [-150, 60], [-105, 10], [-72, -12], [-59, -27], [-53, -52], [-38, -74], [-10, -106], [32, -152], [78, -205], [99, -229]],
  riffles: [[-95, 3], [-85, -3], [-75, -10]], deep: 1.5, bank: 14, flank: 4, glow: 11,
};
const ENTRY = { x: 0, y: 0, z: 170, level: 60, axisTo: 95 };
const CLIMB = { r1: 64, under: 7, slope: 12, easeOut: 24, step: 11 };
const FALL = { r: 64, leave: 40, ease: 40, out: 40, step: 12 };
const OUT = { r: 60, last: 55, aim: 16, before: 5, step: 12 };
// places of the world the laws are written from
const MOUTH = { x: GARDEN.GRAIN.x, y: GARDEN.GRAIN.y, z: GARDEN.GRAIN.z + GARDEN.GRAIN.body, straight: 60, tube: 9, before: 3 };
async function layLine(pause) {
  const E = GARDEN.ELM, O = OUT, nrm = (f) => [Math.sin(f), -Math.cos(f)], wrap = (a) => ((a % TAU) + TAU) % TAU, r2 = (v) => Math.round(v * 100) / 100;
  // a left round from place p with heading f (the heading's angle in the plan, from +x toward +z): its centre stands R
  // metres to the left hand; and a straight
  const left = (p, f, R, len) => { const c = [p[0] + R * nrm(f)[0], p[1] + R * nrm(f)[1]]; return { len, c, f1: f - len / R, at: (s) => { const n = nrm(f - s / R); return [c[0] - R * n[0], c[1] - R * n[1]]; } }; };
  const line = (p, f, len) => ({ len, f1: f, at: (s) => [p[0] + Math.cos(f) * s, p[1] + Math.sin(f) * s] });
  const end = (q) => q.at(q.len), far = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  // the heading on which a left round about the centre c is left for the straight that passes through the place q
  const leaveFor = (c, R, q) => Math.atan2(q[1] - c[1], q[0] - c[0]) - Math.asin(R / far(c, q));
  // the climb and the lane, to the top
  const p0 = [ENTRY.x, ENTRY.axisTo], f0 = -Math.PI / 2, K = BROOK.course[BROOK.flank];
  const fK = leaveFor(left(p0, f0, CLIMB.r1, 1).c, CLIMB.r1, K), climb = left(p0, f0, CLIMB.r1, CLIMB.r1 * wrap(f0 - fK)), lane = line(end(climb), fK, far(end(climb), K));
  await pause();
  // the way out, laid back from the mouth: the last straight begins OUT.before metres before the join's 60 m; the
  // last round (right, OUT.last) ends there; THE ROUND UNDER THE CROWN (left, OUT.r) touches it and is the round
  // whose place abreast of the trunk's line (heading as the mouth's axis) stands OUT.aim metres from that line
  const fAxis = -Math.PI / 2, zF = MOUTH.z + MOUTH.straight + O.before, cL = [MOUTH.x + O.last, zF];
  const back = Math.acos(clamp((cL[0] + O.r - (E.x - O.aim)) / (O.last + O.r), -1, 1)), c5 = [cL[0] - (O.last + O.r) * Math.cos(back), cL[1] + (O.last + O.r) * Math.sin(back)];
  // the fall: one left round from the top, flown until the straight that leaves it touches the round under the crown
  // (two rounds turned the same way); its first FALL.leave degrees are the top's
  const c2 = left(K, fK, FALL.r, 1).c, fT = Math.atan2(c5[1] - c2[1], c5[0] - c2[0]) + Math.asin((O.r - FALL.r) / far(c2, c5)), turn = wrap(fK - fT), lv = FALL.leave * DEG;
  // (THE FAR SIDE: the place of that round that stands farthest from the elm's trunk line, straight across the
  // round's middle from it; the round is laid in two pieces that meet there)
  const fFar = Math.atan2(E.x - c2[0], -(E.z - c2[1])), sFar = FALL.r * wrap(fK - lv - fFar);
  const top = left(K, fK, FALL.r, FALL.r * lv), fall = left(end(top), fK - lv, FALL.r, sFar), fall2 = left(end(fall), fK - lv - sFar / FALL.r, FALL.r, FALL.r * (turn - lv) - sFar), q5 = [c5[0] - O.r * nrm(fT)[0], c5[1] - O.r * nrm(fT)[1]];
  const view = line(end(fall2), fT, far(end(fall2), q5)), crown = left(q5, fT, O.r, O.r * wrap(fT - fAxis)), under = left(end(crown), fAxis, O.r, O.r * back);
  const lastArc = { len: O.last * back, at: (s) => { const g = fAxis - back + s / O.last; return [cL[0] + O.last * Math.sin(g), cL[1] - O.last * Math.cos(g)]; } };
  await pause();
  // the pieces in order; a piece's first point is a control point of the line, so the named places are points of it
  const pieces = [['climb', climb, CLIMB.step], ['knee', lane, CLIMB.step], ['top', top, FALL.step], ['leaving', fall, FALL.step], ['far', fall2, FALL.step], ['view', view, FALL.step], ['crown', crown, O.step], ['trunk', under, O.step], ['lastArc', lastArc, O.step]];
  const at = {}; let total = 0; for (const [name, p] of pieces) { at[name] = total; total += p.len; }
  // heights. A ramp is the metres gained on a slope that eases from nothing to one over `a` metres (its first s metres)
  const ramp = (s, a) => { const t = clamp(s, 0, a); return t * t * t / (a * a) - t * t * t * t / (2 * a * a * a) + Math.max(s - a, 0); };
  const yTop = LANE.floor - CLIMB.under, yUnder = MOUTH.y;
  // the climb: eased in along the round, whole at CLIMB.slope, eased out over CLIMB.easeOut metres; it ends (THE
  // LEVEL) where that brings the line to its level under the flower heads
  const gUp = Math.tan(CLIMB.slope * DEG), sLevel = Math.min((yTop - ENTRY.y) / gUp + at.knee / 2 + CLIMB.easeOut / 2, at.top);
  const up = (s) => ramp(Math.min(s, sLevel), at.knee) - ramp(Math.max(Math.min(s, sLevel) - (sLevel - CLIMB.easeOut), 0), CLIMB.easeOut);
  // the fall: eased in from the far side, eased out over its last metres, to the aim under the crown
  const down = (s) => { const t = clamp(s, at.far, at.trunk) - at.far, L2 = at.trunk - at.far; return ramp(t, FALL.ease) - ramp(Math.max(t - (L2 - FALL.out), 0), FALL.out); }, gDown = (yTop - yUnder) / down(at.trunk);
  const yAt = (s) => ENTRY.y + (yTop - ENTRY.y) * up(s) / up(sLevel) - gDown * down(s);
  const pts = [], places = {};
  for (const [name, p, step] of pieces) {
    const n = Math.max(1, Math.round(p.len / step));
    for (let i = 0; i < n; i++) { const s = p.len * i / n, q = p.at(s), pt = [r2(q[0]), r2(yAt(at[name] + s)), r2(q[1])]; if (i === 0) places[name] = pt; if (p.len >= 3) pts.push(pt); }
  }
  // the last straight: its second point stands 4 m after its first, so that from there on every piece of the line
  // lies between points of the axis alone and is straight to the hundredth of a millimetre
  pts.push([MOUTH.x, MOUTH.y, r2(zF)]);
  for (let z = zF - 4; z > MOUTH.z + 1; z -= 20) pts.push([MOUTH.x, MOUTH.y, r2(z)]);
  pts.push([MOUTH.x, MOUTH.y, MOUTH.z]);
  return { pts, places, at, total, zF, fallMid: c2, slopes: [Math.atan(gUp) / DEG, Math.atan(gDown) / DEG], turn: turn / DEG, back: back / DEG, lens: pieces.map(([name, p]) => [name, p.len]) };
}
// THE LINE IS LAID IN THE BUILD'S FIRST STEPS, not while the module is read (reading it must not hold the page):
// layRoute lays it in steps and writes it once; every later build finds it laid. It is the same line on every seed and every
// visit: nothing in it is dealt. ROUTE is the line's control points. PLACE: places of the route that the laws, the
// looks and the pace are written from (each is a point of the line itself): the knee (where the lane begins), the
// top (under the brook on the knoll), the leaving (where the fall begins), the view (where the fall ends and the
// straight at the elm begins), the trunk (the aim under the crown), the way out, the last round.
export const ROUTE = [], PLACE = {}, LINE_LAID = {};
export async function layRoute(ctx) {
  if (ROUTE.length) return;
  const pause = async () => { if (ctx) await ctx.yield(); };
  const Ld = await layLine(pause);
  // (another build may have laid it while this one paused: it is the same line, and it is written once)
  if (ROUTE.length) return;
  ROUTE.push([ENTRY.x, ENTRY.y, ENTRY.z], [ENTRY.x, ENTRY.y, ENTRY.z - ENTRY.level / 2], [ENTRY.x, ENTRY.y, ENTRY.z - ENTRY.level], ...Ld.pts);
  Object.assign(LINE_LAID, Ld); Object.assign(PLACE, Ld.places);
}
// the film's seconds; the looks' table; the depths of the pace's two eases.
// LOOK.side and LOOK.tilt are the two bounds of the law of angle (degrees): no look turns the gaze further than
// `side` off the line's level heading (BUILDER.md's bound of about 75 for the gaze, less 15 for the steady camera,
// whose gaze rests further down the line in a round), nor further than `tilt` off the level (the crew's bound on the
// gaze's pitch). first, rain, elm and grain are the greatest weights of the four looks (the line keeps a share of
// the gaze: the far first sight two fifths of it, the elm across the round a fifth, the grain a tenth; the rain's
// look keeps three fifths for the line: it lets go where the round begins to fall and the elm's look swells, and
// there the gaze has the least turn to spare).
const LENS = 62;
const FILM = 44, LOOK = { side: 60, tilt: 15, first: 0.6, rain: 0.4, elm: 0.8, grain: 0.9 }, PACE = { top: 0.3, crown: 0.25 };
// how far ahead along the line the camera's own gaze rests (metres)
const LOOK_AHEAD = 24;
// the lane, the cloud and the shower: measures of the laws below
// (LANE.broad and LANE.clear: NOTHING BROADER THAN `broad` METRES STANDS WITHIN `clear` METRES OF THE LINE, in space,
// but the lane's own named great blooms, which hang whole beside it: a head that would is not hung there, a
// blade of grass that would is no broader than `broad`)
const LANE = { near: 9, over: 6, far: 16, under: 4, floor: 24, longFrom: 170, longTo: 95, side: 30, heads: 16, broad: 2, clear: 10 };
const CLOUD = { top: -62, low: -170 };
// whether a place of the plan stands in or over a greater heap (its margin counted): no dealt thing stands there
export const overHeap = (moored, x, z, rad = 0) => moored.some((h) => Math.hypot(x - h.c[0], z - h.c[2]) < h.half + rad);
// THE SHOWER'S GROUNDS, by a rule of the place (the same on every seed): places of a ring SHOWER.ring metres from the
// ball's middle are asked at every SHOWER.step degrees; a ground stands outside the entry's sights (more than
// SHOWER.sights degrees off the axis from the entry's first place) and keeps the column's radius and SHOWER.air
// from every place of the line; the two that stand farthest from the line and SHOWER.apart from each other are the
// grounds. So the rain is never over the line and the line never passes through it.
const SHOWER = { r: 45, ring: 165, step: 15, sights: 40, air: 60, apart: 80 };
export function showerGrounds(near) {
  const cand = [], out = [];
  for (let a = 0; a < 360; a += SHOWER.step) {
    const x = SHOWER.ring * Math.cos(a * DEG), z = SHOWER.ring * Math.sin(a * DEG), bear = Math.abs(Math.atan2(x - ENTRY.x, ENTRY.z - z)) / DEG;
    let off = 1e9; for (let i = 0; i <= near.n; i++) off = Math.min(off, Math.hypot(near.xs[i] - x, near.zs[i] - z));
    if (bear > SHOWER.sights && off >= SHOWER.r + SHOWER.air) cand.push({ x, z, off });
  }
  cand.sort((p, q) => q.off - p.off);
  for (const c of cand) if (out.length < 2 && out.every((o) => Math.hypot(o.x - c.x, o.z - c.z) >= SHOWER.apart)) out.push(c);
  return out.map((c) => [c.x, c.z]);
}

// ------------------------------------------------------------------ the lane: law (a) and law (b) of the place, and THE NAVE
// The lowest height any hanging thing may reach over (x, z): y 24 everywhere; within 9 m of the route's line (level)
// 6 m over the route there; from 9 to 16 m the route's height less 4 m. Stamped from the route at every metre into a
// grid of 2 m cells with the cell's own half diagonal added to both distances, so it is never less than the law.
// THE NAVE is the law of the GRASS (blades, not heads): within NAVE.side metres of the line no blade's tip hangs lower
// than NAVE.over metres over the line, on the whole line; so the grass is a nave over the way and never a slot.
// THE WINDOWS: from the knee of the climb to the top the line's metres are shared out into piers and windows
// by turns, a window NAVE.bay piers long, as many windows as brings a window's length nearest NAVE.window metres. In a window, on the side
// of the open (to the right of the line: the side of the elm, the sun and the sky), from the nave's edge out to
// NAVE.deep metres the grass is a glade of short turf fringe, no blade longer than NAVE.fringe.
const NAVE = { side: 16, over: 10, deep: 70, fringe: 3, bay: 3, window: 50, broad: 25 };
export function naveBays(d0, d1) {
  const long = (k) => (d1 - d0) * NAVE.bay / (k * NAVE.bay + k + 1); let n = 1; for (let k = 2; k < 8; k++) if (Math.abs(long(k) - NAVE.window) < Math.abs(long(n) - NAVE.window)) n = k;
  const pier = (d1 - d0) / (n * NAVE.bay + n + 1), out = [];
  for (let k = 0; k < n; k++) out.push([d0 + pier * (1 + k * (NAVE.bay + 1)), d0 + pier * (1 + k * (NAVE.bay + 1) + NAVE.bay)]);
  return out;
}
export async function makeLane(path, ctx, near) {
  const N = 260, cell = 2, half = N * cell / 2, lim = new Float32Array(N * N).fill(LANE.floor), nave = new Float32Array(N * N).fill(LANE.floor), win = new Uint8Array(N * N), pad = 1.5;
  const p = new THREE.Vector3(), t = new THREE.Vector3(), reach = Math.ceil((LANE.far + pad) / cell), deep = Math.ceil((NAVE.deep + pad) / cell);
  await ctx.yield();
  const bays = naveBays(near.metre(PLACE.knee), near.metre(PLACE.top));
  for (let d = 0; d <= path.length; d += 1) {
    await ctx.yield();
    path.posAtDist(d, p);
    const ci = Math.floor((p.x + half) / cell), cj = Math.floor((p.z + half) / cell);
    for (let j = cj - reach; j <= cj + reach; j++) for (let i = ci - reach; i <= ci + reach; i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const dd = Math.hypot((i + 0.5) * cell - half - p.x, (j + 0.5) * cell - half - p.z), k = j * N + i;
      if (dd < LANE.near + pad) lim[k] = Math.max(lim[k], p.y + LANE.over); else if (dd < LANE.far + pad) lim[k] = Math.max(lim[k], p.y - LANE.under);
      if (dd < NAVE.side + pad) nave[k] = Math.max(nave[k], p.y + NAVE.over);
    }
    if (!bays.some((w) => d >= w[0] && d <= w[1])) continue;
    // a window: the cells abreast of this metre on the side of the open, from the nave's edge to its depth
    path.tangentAtDist(d, t); const hl = Math.hypot(t.x, t.z) || 1, rx = -t.z / hl, rz = t.x / hl;
    for (let j = cj - deep; j <= cj + deep; j++) for (let i = ci - deep; i <= ci + deep; i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const vx = (i + 0.5) * cell - half - p.x, vz = (j + 0.5) * cell - half - p.z, side = vx * rx + vz * rz, fore = vx * t.x / hl + vz * t.z / hl;
      if (side > NAVE.side && side < NAVE.deep && Math.abs(fore) < 1.6) win[j * N + i] = 1;
    }
  }
  const cellOf = (x, z) => { const i = Math.floor((x + half) / cell), j = Math.floor((z + half) / cell); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
  const round = (grid, x, z, rad) => {
    const at = (qx, qz) => { const k = cellOf(qx, qz); return k < 0 ? LANE.floor : grid[k]; }; let m = at(x, z);
    if (rad > 0) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m = Math.max(m, at(x + Math.cos(a) * rad, z + Math.sin(a) * rad), at(x + Math.cos(a) * rad * 0.5, z + Math.sin(a) * rad * 0.5)); }
    return m;
  };
  // the limit for a thing of a given half width: the highest limit under any part of it
  const lane = (x, z, rad = 0) => round(lim, x, z, rad);
  // the same for a blade of grass (the nave's law as well), and whether a place lies in a window's glade
  lane.grass = (x, z, rad = 0) => Math.max(round(lim, x, z, rad), round(nave, x, z, rad));
  lane.window = (x, z) => { const k = cellOf(x, z); return k >= 0 && win[k] === 1; };
  lane.bays = bays;
  return lane;
}
// the route's line, level: the least level distance from (x, z) to it and the route's height there (nearest in the plan).
// The line passes over itself west of the elm: a caller that means one pass gives the stretch of metres to search.
export function makeNear(path) {
  const n = Math.ceil(path.length / 2), xs = new Float32Array(n + 1), ys = new Float32Array(n + 1), zs = new Float32Array(n + 1), p = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { path.posAtDist(i / n * path.length, p); xs[i] = p.x; ys[i] = p.y; zs[i] = p.z; }
  const level = (x, z, d0 = 0, d1 = path.length) => {
    let b = 1e9, k = 0;
    for (let i = Math.max(0, Math.floor(d0 / path.length * n)); i <= Math.min(n, Math.ceil(d1 / path.length * n)); i++) { const d = (xs[i] - x) ** 2 + (zs[i] - z) ** 2; if (d < b) { b = d; k = i; } }
    return { dist: Math.sqrt(b), y: ys[k], d: k / n * path.length };
  };
  const space = (x, y, z) => { let b = 1e9; for (let i = 0; i <= n; i++) { const d = (xs[i] - x) ** 2 + (ys[i] - y) ** 2 + (zs[i] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  // the metre of a place that is a point of the line itself (nearest in space, so the two passes are never confused)
  const metre = (q) => { let b = 1e9, k = 0; for (let i = 0; i <= n; i++) { const d = (xs[i] - q[0]) ** 2 + (ys[i] - q[1]) ** 2 + (zs[i] - q[2]) ** 2; if (d < b) { b = d; k = i; } } return k / n * path.length; };
  // the least distance from the line to an upright stretch (x, y0..y1, z): a column, a stalk, a plumb course
  const plumb = (x, y0, y1, z) => { let b = 1e9; for (let i = 0; i <= n; i++) { const dy = Math.max(y0 - ys[i], ys[i] - y1, 0), d = (xs[i] - x) ** 2 + dy * dy + (zs[i] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  // whether a place is further than `far` metres from every place of the line (asked of every 8th metre of it, with
  // the 4 m between taken off: for the choice of far forms only)
  const beyond = (x, y, z, far) => { const f2 = (far + 4) * (far + 4); for (let i = 0; i <= n; i += 4) if ((xs[i] - x) ** 2 + (ys[i] - y) ** 2 + (zs[i] - z) ** 2 < f2) return false; return true; };
  return { level, space, metre, plumb, beyond, n, xs, ys, zs };
}
// ------------------------------------------------------------------ the brook's course on the ceiling (the same on every seed)
export function makeBrook() {
  const curve = new THREE.CatmullRomCurve3(BROOK.course.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curve.getLength(), n = Math.ceil(L / 2), pts = [], p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    curve.getPointAt(i / n, p); curve.getTangentAt(i / n, t); const s = i / n * L;
    pts.push({ x: p.x, z: p.z, tx: t.x, tz: t.z, s, w: 9 + 1.3 * Math.sin(s * 0.023 + 1.1) + 0.7 * Math.sin(s * 0.061 + 4.2) });
  }
  // the nearest place of the centreline to (x, z): distance, metres along, width there, which side (+1 right of the flow)
  const near = (x, z) => {
    let b = 1e9, k = 0; for (let i = 0; i <= n; i++) { const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2; if (d < b) { b = d; k = i; } }
    const q = pts[k]; return { d: Math.sqrt(b), s: q.s, w: q.w, side: Math.sign((x - q.x) * -q.tz + (z - q.z) * q.tx) || 1, k };
  };
  return { pts, L, near };
}
const knollDeep = (x, z) => GARDEN.KNOLL.deep * Math.exp(-((x - GARDEN.KNOLL.x) ** 2 + (z - GARDEN.KNOLL.z) ** 2) / GARDEN.KNOLL.s2);
// how far a place stands off the elm's trunk line, measured so that the crown's own outline in the plan (60 m across
// the entry's axis, 85 m along it) is at crownR: a margin asked of it is never less than that margin in metres
const offElm = (x, z) => Math.hypot(x - GARDEN.ELM.x, (z - GARDEN.ELM.z - GARDEN.ELM.crownDz) * GARDEN.ELM.crownR / GARDEN.ELM.crownZ);
// the root's flare and its buttress roots on the turf: no blade or stalk is rooted within ROOTS.keep metres of the trunk's line
const ROOTS = { keep: 19 }, rootOff = (x, z) => Math.hypot(x - GARDEN.ELM.x, z - GARDEN.ELM.z);

// ------------------------------------------------------------------ law (e): THE LONG HANGERS OF THE SKY STRETCH
// Where, after the leaving, the line runs between HANG.over[0] and HANG.over[1] metres under law (a)'s floor (on the
// fall's round, out over the open), long blades and long-stalked heads hang beside it down to
// the floor and a few metres over it: the meadow is the roof over the sky there, 8 to 20 m over the line. Law (a)
// and the lane's law hold for them as for every hanging thing; none hangs into the elm's crown. The stretch is what
// the height rule finds after the leaving (the first run of the line that holds it); the hangers stand along it and
// HANG.lead metres beyond it at either end alike.
const HANG = { over: [4, 20], side: 28, tip: [0, 7], blades: 150, heads: 100, lead: 14, bow: [0.02, 0.07] };
export function skyStretch(P) {
  const p = new THREE.Vector3(), L = P.path.length; let a = -1, b = -1;
  for (let d = P.near.metre(PLACE.leaving); d <= L; d += 1) {
    P.path.posAtDist(d, p); const under = LANE.floor - p.y, holds = under >= HANG.over[0] && under <= HANG.over[1];
    if (holds) { if (a < 0) a = d; b = d; } else if (a >= 0) break;
  }
  return [a, b];
}
// THE STRETCH UNDER THE HEADS: the first run of the whole line that lies within HANG.over[1] metres under the floor
// of law (a) (from the climb, through the lane and the top, into the fall): [first metre, last metre]
const GREAT = { every: 42, size: [2.3, 2.9], off: [16, 28], over: 5, ahead: 50 };
export function underStretch(P) {
  const p = new THREE.Vector3(), L = P.path.length; let a = -1, b = -1;
  for (let d = 0; d <= L; d += 1) {
    P.path.posAtDist(d, p); const under = LANE.floor - p.y;
    if (under <= HANG.over[1]) { if (a < 0) a = d; b = d; } else if (a >= 0) break;
  }
  return [a, b];
}
// a place beside the sky stretch drawn from a stream: [x, z] or null where the elm's crown is
function hangPlace(P, rng, st, p, t) {
  const d = lerp(st[0] - HANG.lead, st[1] + HANG.lead, rng()), off = rng.sign() * rng.range(2.5, HANG.side);
  P.path.posAtDist(d, p); P.path.tangentAtDist(d, t); const l = Math.hypot(t.x, t.z) || 1, x = p.x - t.z / l * off, z = p.z + t.x / l * off;
  return offElm(x, z) < GARDEN.ELM.crownR + 4 ? null : [x, z];
}
// ------------------------------------------------------------------ THE HANGING GRASS (a fixed stream: the same on every seed)
// THE GRASS IS BLADES IN TUSSOCKS (round four). Every place that is dealt is the root of one tussock: TUFT.near blades
// (TUFT.far in the far form) from one root, each with a width, a length of its own (TUFT.len of the tussock's
// length), A BEND along its whole length (it leaves the root leaning out, each blade its own way round, and comes
// to hang plumb: bow, the metres its tip stands out) and a curled tip. Between the tussocks the turf shows.
// rows: [x, top, z, length, width, yaw, curl length, curl angle, tone, phase, tier, bow, the bow's yaw]
// tier, chosen here AT BUILD FROM THE FIXED LINE, never from the eye: 0 the blade's lower part is within GRASS_MID
// metres of some place of the line (in space): the fine form; 1 within GRASS_FAR: the middle form; 2 beyond: the
// coarse form (GRASS_KEEP of those tussocks stand, their blades GRASS_WIDE times as broad). A blade whose root stands
// within NAVE.broad metres of the line (level) is a broad leaf of grass, 1.5 to 2.6 m wide.
const GRASS_MID = 30, GRASS_FAR = 75, GRASS_KEEP = 0.6, GRASS_WIDE = 1.9, TUFT = { near: 4, far: 3, len: [0.45, 1], bow: [0.05, 0.16], root: 0.7 };
export async function dealGrass(P, detail, ctx) {
  const rng = makeRng(hashSeed(FIXED + ':grass')), out = [];
  const one = (x, z) => {
    const u = [rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng()];
    if (x * x + z * z > 246 * 246 || rootOff(x, z) < ROOTS.keep) return;
    const top = yg(x, z), b = P.brook.near(x, z), broad = P.near.level(x, z).dist < NAVE.broad;
    const width = broad ? lerp(1.5, 2.6, u[1]) : lerp(0.7, 1.5, u[1]);
    if (b.d < b.w / 2 + 0.8) return;
    let len = lerp(15, 40, Math.pow(u[0], 0.8));
    // (c) bank grass on the knoll within 14 m of the brook
    if (b.d < BROOK.bank && knollDeep(x, z) > 8) len = lerp(3, 8, u[0]);
    // a window's glade: short turf fringe
    if (P.lane.window(x, z)) len = Math.min(len, lerp(1.6, NAVE.fringe, u[0]));
    // (a), (b) and the nave: nothing below y 24, the lane, the nave; the blades' swing and bow are counted into the width
    // WHERE THE FLOOR OF LAW (a) CUTS A TUSSOCK (toward the rim) it ends at a height of its own, half way and more
    // down to the floor: the rim's lower outline is uneven
    { const lim = P.lane.grass(x, z, width / 2 + 2.5 + len * TUFT.bow[1]), room = top - lim; if (len > room) len = room * (lim <= LANE.floor + 0.01 ? lerp(0.5, 1, u[4]) : 1); }
    if (len < 1.5) return;
    const beyond = (far) => P.near.beyond(x, top - len * 0.7, z, far), tier = beyond(GRASS_FAR) ? 2 : beyond(GRASS_MID) ? 1 : 0;
    if (tier === 2 && u[7] > GRASS_KEEP) return;
    const n = tier === 2 ? TUFT.far : TUFT.near, turn = u[6] * TAU;
    // (a blade that hangs within LANE.clear metres of the line, its breadth and bow counted, is no broader than LANE.broad)
    const most = P.near.plumb(x, top - len, top, z) - 1.3 - len * TUFT.bow[1] < LANE.clear ? LANE.broad : 99;
    // the tussock's blades (each from the tussock's own numbers: the stream deals one tussock per place)
    for (let k = 0; k < n; k++) {
      const h = (j) => { const v = Math.sin((u[2] + k * 0.618 + j * 0.37) * 91.7 + u[5] * 47.3) * 43758.5453; return v - Math.floor(v); };
      const l = Math.max(len * (k === 0 ? 1 : lerp(TUFT.len[0], TUFT.len[1], h(0))), 1.5), w = Math.min(width * (k === 0 ? 1 : lerp(0.6, 1, h(1))) * (tier === 2 ? GRASS_WIDE : 1), most);
      const ba = turn + (k + 0.6 * (h(2) - 0.5)) / n * TAU, ro = TUFT.root * h(3);
      out.push([x + Math.cos(ba) * ro, top + 0.6, z + Math.sin(ba) * ro, l, w, u[2] * TAU + k * 2.1, Math.min(lerp(1, 3, u[3]) * (broad ? 1.5 : 1), l * 0.4), lerp(1.4, 3.6, h(4)), 0.5 * (u[5] + h(5)), u[6] * TAU + k, tier, l * lerp(TUFT.bow[0], TUFT.bow[1], h(6)), ba, 1 - smoothstep(0, BROOK.glow, b.d - b.w / 2), b.s]);
    }
  };
  // all over the vault, evenly
  const n1 = Math.round(4300 * detail);
  for (let i = 0; i < n1; i++) { const r = Math.sqrt(rng()) * 246, a = rng() * TAU; one(Math.cos(a) * r, Math.sin(a) * r); if (i % 8 === 7) await ctx.yield(); }
  // and thicker beside the route from the end of the entry straight to the leaving, where the meadow is near
  const n2 = Math.round(760 * detail), d0 = ENTRY.level, d1 = P.near.metre(PLACE.leaving), p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < n2; i++) {
    const d = lerp(d0, d1, rng()), off = rng.range(-46, 46); P.path.posAtDist(d, p); P.path.tangentAtDist(d, t);
    const l = Math.hypot(t.x, t.z) || 1; one(p.x - t.z / l * off, p.z + t.x / l * off);
    if (i % 8 === 7) await ctx.yield();
  }
  // (e) the long blades of the sky stretch (a fixed stream of their own): tips between the floor and 7 m over it
  const sky = makeRng(hashSeed(FIXED + ':sky hangers:blades')), st = skyStretch(P);
  for (let i = 0; i < HANG.blades; i++) {
    const q = hangPlace(P, sky, st, p, t), u = [sky(), sky(), sky(), sky(), sky(), sky()];
    if (!q) continue;
    const top = yg(q[0], q[1]), width = lerp(1.5, 2.6, u[1]), bowK = lerp(HANG.bow[0], HANG.bow[1], u[3]);
    // (the bow is counted into the blade's width for the lane, at the longest the blade could be)
    const len = Math.min(top - LANE.floor - lerp(HANG.tip[0], HANG.tip[1], u[0]), top - P.lane.grass(q[0], q[1], width / 2 + 2.5 + (top - LANE.floor) * bowK));
    out.push([q[0], top + 0.6, q[1], len, P.near.plumb(q[0], top - len, top, q[1]) - 1.3 - len * bowK < LANE.clear ? Math.min(width, LANE.broad) : width, u[2] * TAU, lerp(2, 4.5, u[3]), lerp(1.6, 3.4, u[4]), 0.55 + 0.45 * u[5], sky() * TAU, 0, len * bowK, u[4] * TAU]);
    if (i % 8 === 7) await ctx.yield();
  }
  return out;
}

// ------------------------------------------------------------------ THE FLOWERS, heads down like lamps
// kinds: 0 buttercup, 1 clover, 2 ox-eye daisy, 3 harebell (in threes), 4 seed head. R: half width, D: depth under the
// stalk's end (metres at size 1).
export const HEADS = [{ R: 1.6, D: 1.5 }, { R: 2.25, D: 4.4 }, { R: 2.75, D: 1.3 }, { R: 2.3, D: 3.7 }, { R: 1.3, D: 4.2 }];
const HEAD_SWAY = 0.5, RIM_HEADS = { n: 11, along: [6, 40], off: [9, 46] };
// rows: { x, top, z, len (stalk, root to the head's neck), kind, size, yaw, ph, col: [r,g,b], near: the head's metres from the line (in space) }
export async function dealFlowers(P, rSeed, dominant, count, ctx, rLane, rRest = rSeed) {
  const out = [], fixed = makeRng(hashSeed(FIXED + ':long stalks'));
  const tint = (rng, kind) => {
    if (kind === 0) return lin(rng.pick(['#F2B63A', '#F5C13C', '#EDA92E']));
    if (kind === 1) return lin(rng.pick(['#E86A8E', '#E86A8E', '#F4F1E4', '#DE7FA0']));
    if (kind === 2) return lin(rng.pick(['#F4F1E4', '#FFFFFF', '#EEF0E6']));
    if (kind === 3) return lin(rng.pick(['#7C7BE0', '#8A80E6', '#6E78D8']));
    return lin(rng.pick(['#D9CFA0', '#C9C48E', '#E2D8B0']));
  };
  // a head whose lowest point is at yLow: its stalk runs from the turf to its neck
  const put = (rng, x, z, kind, size, yLow, far, great = false) => {
    const top = yg(x, z), H = HEADS[kind], floor = P.lane(x, z, H.R * size + HEAD_SWAY), low = Math.max(yLow, floor), len = top - (low + H.D * size);
    if (len < 8 || rootOff(x, z) < ROOTS.keep || P.brook.near(x, z).d < 7) return false;
    if (!great && 2 * H.R * size > LANE.broad && P.near.space(x, low + H.D * size * 0.5, z) - Math.max(H.R, H.D * 0.5) * size < LANE.clear) return false;
    out.push({ x, top: top + 0.6, z, len: len + 0.6, kind, size, yaw: rng() * TAU, ph: rng() * TAU, col: tint(rng, kind), near: P.near.space(x, low + H.D * size * 0.5, z), far });
    return true;
  };
  // (d) THE LONG STALKS over the entry straight (the fixed stream): heads between y 24 and y 46, none behind the entry
  for (let i = 0; i < 62; i++) {
    const z = fixed.range(LANE.longTo, LANE.longFrom - 4), x = fixed.range(-LANE.side, LANE.side), kind = fixed.pick([0, 0, 1, 2, 2, 3, 4, 4]);
    put(fixed, x, z, kind, fixed.range(0.9, 1.15), fixed.range(LANE.floor, 46 - HEADS[kind].D), false);
    if (i % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  // (e) THE LONG-STALKED HEADS OF THE SKY STRETCH (a fixed stream of their own): clover, daisy, harebell and seed heads
  // whose lowest point is between the floor and 6 m over it; the first three clovers stand together for a bee
  const sky = makeRng(hashSeed(FIXED + ':sky hangers:heads')), st = skyStretch(P), p0 = new THREE.Vector3(), t0 = new THREE.Vector3();
  let knot = null;
  for (let i = 0, tries = 0; i < HANG.heads && tries < 400; tries++) {
    if (tries % 12 === 11) await ctx.yield();
    let q = hangPlace(P, sky, st, p0, t0); const kind = i < 3 ? 1 : sky.pick([1, 1, 2, 2, 2, 3, 4, 4, 4]), size = sky.range(0.95, 1.2), low = LANE.floor + sky.range(0, 6);
    if (!q) continue;
    // the bee's knot: the second and third clover stand 5 to 8 m from the first; the knot keeps 12 m (level) from the line
    if (i === 0 && P.near.level(q[0], q[1]).dist < 12) continue;
    if (i > 0 && i < 3) { const a = sky() * TAU, r = sky.range(5, 8); q = [knot[0] + Math.cos(a) * r, knot[1] + Math.sin(a) * r]; if (P.near.level(q[0], q[1]).dist < 12 || offElm(q[0], q[1]) < GARDEN.ELM.crownR + 4) continue; }
    if (!put(sky, q[0], q[1], kind, size, low, false)) continue;
    const f = out[out.length - 1]; f.sky = true; if (i === 0) knot = q; if (i < 3) f.skyBee = true;
    i++;
  }
  await ctx.yield();
  // (f) THE RIM'S LONG HEADS over the mouth (a fixed stream of their own, 'rim heads'): a few great heads on long stalks
  // hanging from the turf by the rim down to law (a)'s floor and a few metres over it, either side of the last
  // straight produced, from RIM_HEADS.along[0] to RIM_HEADS.along[1] metres beyond the line's end and RIM_HEADS.off[0]
  // to RIM_HEADS.off[1] metres (level) to its side: the last of the meadow over the way into the grain (they are 60 m
  // and more over the line by law (a))
  const rim = makeRng(hashSeed(FIXED + ':rim heads')), dL = P.path.length;
  P.path.posAtDist(dL, p0); P.path.tangentAtDist(dL, t0);
  for (let i = 0, tries = 0, l = Math.hypot(t0.x, t0.z) || 1; i < RIM_HEADS.n && tries < 300; tries++) {
    if (tries % 12 === 11) await ctx.yield();
    const along = rim.range(RIM_HEADS.along[0], RIM_HEADS.along[1]), off = rim.sign() * rim.range(RIM_HEADS.off[0], RIM_HEADS.off[1]), kind = rim.pick([0, 1, 2, 2, 4]), size = rim.range(1.3, 1.6);
    const x = p0.x + t0.x / l * along - t0.z / l * off, z = p0.z + t0.z / l * along + t0.x / l * off, low = LANE.floor + rim.range(0, 5);
    if (Math.hypot(x, z) > GARDEN.RIM_R - 7 || out.some((f) => f.rim && Math.hypot(f.x - x, f.z - z) < 7)) continue;
    if (put(rim, x, z, kind, size, low, false)) { out[out.length - 1].rim = true; i++; }
  }
  await ctx.yield();
  // (g) THE GREAT BLOOMS (a fixed stream of their own, 'great blooms'): where the line runs under the flower heads
  // (underStretch: within HANG.over[1] metres of the floor of law (a), from the climb to the fall) one great bloom
  // hangs every GREAT.every metres of the way, by turns to either hand from a drawn first hand, GREAT.size times
  // a common head, its near edge GREAT.off metres and more to the side (beyond the lane of law (b)), its lowest
  // point on the floor of law (a) or a few metres over it: each is seen whole from far down the line and passes
  // overhead to the side. Its stalk is as many times thicker as the bloom is greater.
  const great = makeRng(hashSeed(FIXED + ':great blooms')), us = underStretch(P), hand0 = great.sign();
  for (let i = 0, d = us[0] + GREAT.every * great.range(0.3, 0.7); d < us[1]; i++, d += GREAT.every) {
    const kind = great.pick([3, 1, 2, 0, 3]), size = great.range(GREAT.size[0], GREAT.size[1]), H = HEADS[kind], more = great.range(0, GREAT.off[1] - GREAT.off[0]), low = LANE.floor + great.range(0, GREAT.over);
    const off = (i % 2 ? -hand0 : hand0) * (GREAT.off[0] + H.R * size + HEAD_SWAY + more);
    P.path.posAtDist(d, p0); P.path.tangentAtDist(d, t0); const l = Math.hypot(t0.x, t0.z) || 1, x = p0.x - t0.z / l * off, z = p0.z + t0.x / l * off;
    if (offElm(x, z) < GARDEN.ELM.crownR + 4 + H.R * size) continue;
    if (put(great, x, z, kind, size, low, false, true)) out[out.length - 1].great = true;
    if (i % 4 === 3) await ctx.yield();
  }
  // and ONE STANDS AHEAD OF THE LANE: on the lane's own straight produced, GREAT.ahead metres past the top (where
  // the line turns away under the knoll), the greatest of them, of a kind that reads whole from the side (bells or a
  // clover's ball): it stands in the middle of the way down the whole lane and the line turns off under it
  {
    const k = PLACE.knee, q = PLACE.top, l = Math.hypot(q[0] - k[0], q[2] - k[2]) || 1, kind = great.pick([3, 1, 3]), low = LANE.floor + great.range(0, GREAT.over);
    if (put(great, q[0] + (q[0] - k[0]) / l * GREAT.ahead, q[2] + (q[2] - k[2]) / l * GREAT.ahead, kind, GREAT.size[1], low, false, true)) out[out.length - 1].great = true;
  }
  await ctx.yield();
  // THE LANE from z 95 to the leaving (the visit's stream): heads beside the line whose lowest point hangs between
  // the floor of law (a) and LANE.heads metres over it (the line runs UNDER them: no head hangs at the eye's
  // height); the nearest stand with their near edge 9 m to the side. THE KINDS ARE DEALT ALONG ITS WHOLE LENGTH (the stream
  // 'lane kinds'): fourteen buttercups at even steps of the lane's heads from a drawn first one; the bee's three
  // clovers are three neighbouring right-hand heads from a drawn place in the lane's middle half
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  const dA = P.near.level(0, LANE.longTo).d, dB = P.near.metre(PLACE.leaving), nLane = rSeed.int(62, 78);
  const cup0 = rLane() * nLane / 14, bee0 = 2 * rLane.int(Math.floor(nLane / 8), Math.floor(nLane * 3 / 8) - 3) + 1;
  for (let i = 0; i < nLane; i++) {
    if (i % 12 === 11) await ctx.yield();
    const bee = i === bee0 || i === bee0 + 2 || i === bee0 + 4, cup = Math.floor((i + 1 + cup0) * 14 / nLane) > Math.floor((i + cup0) * 14 / nLane);
    const kind = bee ? 1 : cup ? 0 : (rSeed.chance(0.5) ? dominant : rSeed.pick([0, 1, 2, 3, 3, 4])), size = rSeed.range(0.9, 1.15), H = HEADS[kind];
    const d = lerp(dA, dB, (i + rSeed()) / nLane), side = i % 2 ? 1 : -1, off = side * (LANE.near + H.R * size + HEAD_SWAY + 0.3 + Math.pow(rSeed(), 1.7) * (LANE.side - LANE.near - 3));
    P.path.posAtDist(d, p); P.path.tangentAtDist(d, t); const l = Math.hypot(t.x, t.z) || 1;
    if (put(rSeed, p.x - t.z / l * off, p.z + t.x / l * off, kind, size, LANE.floor + rSeed.range(0, LANE.heads), false) && bee) out[out.length - 1].bee = true;
  }
  // THE REST of the meadow (a stream of its own, 'meadow heads'): stalks 26 to 56 m long, all over the vault
  for (let i = 0; i < count; i++) {
    if (i % 12 === 0) await ctx.yield();
    const r = Math.sqrt(rRest()) * 240, a = rRest() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, kind = rRest.chance(0.5) ? dominant : rRest.pick([0, 1, 2, 3, 4, 4]);
    const size = rRest.range(0.85, 1.2), len = rRest.range(26, 56);
    put(rRest, x, z, kind, size, yg(x, z) - len - HEADS[kind].D * size, true);
  }
  return out;
}
// ------------------------------------------------------------------ flower head shapes: the neck at the origin, the face DOWN
// aPart: 0 petal (the head's own colour), 1 the gold heart, 2 green
function shapeMaker() {
  const A = { pos: [], part: [], idx: [] };
  const grid = (nu, nv, fn, part) => {
    const base = A.pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); A.pos.push(p[0], p[1], p[2]); A.part.push(part); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + nu + 1; A.idx.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  const done = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A.part, 1));
    g.setIndex(A.idx); g.computeVertexNormals();
    return g;
  };
  return { grid, done };
}
const ring = (r, a, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
function headGeometry(kind, full, far = false) {
  const S = shapeMaker(), H = HEADS[kind];
  if (far) {
    // the far form: the head's own outline: a cup or a disc that opens downward (three bells for the harebell), a
    // ball for the clover, a spindle for the seed head
    if (kind === 3) for (let b = 0; b < 3; b++) { const a = b / 3 * TAU + 0.4, ox = Math.cos(a) * 1.25, oz = Math.sin(a) * 1.25, oy = -0.9 - 0.35 * b; S.grid(3, 1, (u, v) => { const q = ring(0.15 + 0.6 * v, u * TAU, 0); return [ox + q[0], oy - 2.6 * v, oz + q[2]]; }, 0); }
    else if (kind === 1) { const cy = -H.R - 0.5; S.grid(5, 3, (u, v) => { const th = v * Math.PI, q = ring(Math.sin(th) * H.R * 0.93, u * TAU, 0); return [q[0], cy + Math.cos(th) * H.R * 0.97, q[2]]; }, 0); }
    else if (kind === 4) S.grid(4, 3, (u, v) => ring(H.R * 0.42 * Math.sin(Math.PI * Math.pow(v, 0.8)) + 0.03, u * TAU, -H.D * v), 0);
    else S.grid(5, 1, (u, v) => ring(H.R * (0.12 + 0.8 * v), u * TAU, -H.D * (0.1 + 0.75 * v)), 0);
  } else if (kind === 0) {
    // buttercup: five broad petals making a cup that opens downward, a boss of stamens in it
    const n = full ? 4 : 1;
    for (let k = 0; k < 5; k++) {
      const a0 = k / 5 * TAU;
      S.grid(n, full ? 3 : 2, (u, v) => { const w = 0.72 * Math.sin(Math.PI * Math.pow(v, 0.6) * 0.95 + 0.1), r = H.R * (0.1 + 0.9 * Math.sin(v * 1.35)); return ring(r, a0 + (u - 0.5) * w * 1.25, -H.D * (0.12 + 0.88 * (1 - Math.cos(v * 1.45)) / 0.88) - 0.05 * Math.abs(u - 0.5)); }, 0);
    }
    S.grid(full ? 7 : 4, full ? 2 : 1, (u, v) => ring(H.R * 0.32 * Math.sin(v * 1.5 + 0.02), u * TAU, -0.25 - 0.5 * (1 - Math.cos(v * 1.5))), 1);
  } else if (kind === 1) {
    // clover: a ball of florets
    const cy = -H.R - 0.5, nu = full ? 10 : 7, nv = full ? 6 : 4;
    S.grid(nu, nv, (u, v) => { const th = v * Math.PI, bump = 1 + 0.07 * Math.sin(u * TAU * 6) * Math.sin(v * 19), p = ring(Math.sin(th) * H.R * 0.93 * bump, u * TAU, 0); return [p[0], cy + Math.cos(th) * H.R * 0.97 * bump, p[2]]; }, 0);
    if (full) for (let k = 0; k < 64; k++) {
      const y = 1 - (k + 0.5) / 64 * 2, r = Math.sqrt(1 - y * y), a = k * 2.39996, d = [r * Math.cos(a), y, r * Math.sin(a)];
      S.grid(2, 1, (u, v) => { const b = (u - 0.5) * 0.34, q = H.R * (0.9 + (0.13 + 0.05 * Math.sin(k * 1.7)) * v); return [d[0] * q - d[2] * b * (1 - v) * H.R, cy + d[1] * q + b * 0.2 * (1 - v), d[2] * q + d[0] * b * (1 - v) * H.R]; }, 0);
    }
    S.grid(4, 1, (u, v) => ring(0.16 + 0.5 * v, u * TAU, -0.55 * v), 2);
  } else if (kind === 2) {
    // ox-eye daisy: white rays round a gold eye, the face turned down. A full ray has a body: it is keeled along
    // its middle (the two halves fold from the rib) and its tip curls back toward the stalk
    const n = full ? 21 : 10;
    for (let k = 0; k < n; k++) {
      const a0 = (k + 0.3 * Math.sin(k * 7.1)) / n * TAU, w = full ? 0.105 : 0.2, curl = 0.25 + 0.2 * Math.sin(k * 5.3);
      S.grid(full ? 2 : 1, full ? 3 : 1, (u, v) => ring(H.R * (0.26 + 0.74 * v - (full ? 0.1 * curl * v * v * v : 0)), a0 + (u - 0.5) * w * (1 + 0.6 * Math.sin(v * Math.PI)) * 2 / (0.6 + v),
        -0.35 - 0.45 * v * v + 0.12 * Math.sin(k * 3.3) + (full ? 0.09 * (1 - Math.abs(u - 0.5) * 2) * Math.sin(v * Math.PI) + curl * 0.9 * Math.pow(v, 4) : 0)), 0);
    }
    S.grid(full ? 9 : 5, full ? 2 : 1, (u, v) => ring(H.R * 0.3 * Math.sin(v * 1.5 + 0.02), u * TAU, -0.3 - 0.55 * (1 - Math.cos(v * 1.5))), 1);
    S.grid(full ? 9 : 5, 1, (u, v) => ring(0.14 + H.R * 0.3 * v, u * TAU, -0.28 * v), 2);
  } else if (kind === 3) {
    // harebell: three bells on bent pedicels, each opening downward with five lobes
    for (let b = 0; b < 3; b++) {
      const a = b / 3 * TAU + 0.4, ox = Math.cos(a) * 1.25, oz = Math.sin(a) * 1.25, oy = -0.9 - 0.35 * b, L = 2.6;
      S.grid(full ? 10 : 5, full ? 4 : 2, (u, v) => { const r = (0.2 + 0.72 * Math.pow(v, 0.7) + 0.28 * v * v * v * (1 + (full ? 0.5 * Math.cos(u * TAU * 5) : 0))) * 0.72, p = ring(r, u * TAU, 0); return [ox + p[0], oy - L * v, oz + p[2]]; }, 0);
      S.grid(2, 1, (u, v) => { const q = ring(0.07, u * TAU, 0); return [ox * v + q[0], oy * v * v, oz * v + q[2]]; }, 2);
    }
  } else {
    // a seed head: a pale spindle with awns
    S.grid(full ? 7 : 4, full ? 4 : 2, (u, v) => ring(H.R * 0.42 * Math.sin(Math.PI * Math.pow(v, 0.8)) + 0.03, u * TAU, -H.D * v), 0);
    if (full) for (let k = 0; k < 10; k++) { const a = k * 2.39996, y0 = -H.D * (0.15 + 0.7 * k / 10); S.grid(1, 1, (u, v) => ring(H.R * (0.2 + 0.8 * v), a + (u - 0.5) * 0.09 / (0.3 + v), y0 - 1.1 * v), 0); }
  }
  return S.done();
}
// ------------------------------------------------------------------ instanced meshes of the hanging country
// an instanced geometry from a base and per-instance rows, with a sphere round all of its instances
function instanced(base, attrs, count, lo, hi) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].a, attrs[k].n));
  g.instanceCount = count;
  const c = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2);
  g.boundingSphere = new THREE.Sphere(c, Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 8);
  return g;
}
const boundsOf = (rows, get) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const r of rows) { const b = get(r); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], b[k]); hi[k] = Math.max(hi[k], b[k + 3]); } } return [lo, hi]; };
// the sway of a flower head on its long stalk (metres): the tremble and the shudder, small (heads nod, they do not swing)
const HEAD_OFF = /* glsl */`
vec3 headOff(vec2 sw) { return vec3(.8, 0., .6) * sw.x * .3 + vec3(-1., 0., .15) * sw.y * .2; }
`;
export const headOffAt = (sw) => [0.8 * sw[0] * 0.3 - sw[1] * 0.2, 0, 0.6 * sw[0] * 0.3 + 0.15 * sw[1] * 0.2];
// THE MEADOW'S OWN PATTERN, BY PLACE (the plan's x and z alone; the same law paints the turf and the far grass):
// DRIFTS OF FLOWER COLOUR some ten to forty metres across (harebell blue, daisy white, clover rose, buttercup
// yellow: each where a slow field of its own stands high), DARKER HOLLOWS AND PALER RISES (a broader field), and MOWN
// PATHS (a pale band where the broadest field crosses its middle: winding ways a few metres wide). meadowAt gives
// the drift's colour and how much of it; meadowLie gives the ground's shade and, in y, how much of a path.
const MEADOW_GLSL = /* glsl */`
vec4 meadowAt(vec2 q) {
  float b = smoothstep(.56, .66, texture2D(uNoise, q * .0061).r), w = smoothstep(.6, .7, texture2D(uNoise, q * .0083 + .37).g);
  float r = smoothstep(.57, .67, texture2D(uNoise, q.yx * .0071 + .11).r), y = smoothstep(.6, .7, texture2D(uNoise, q.yx * .0097 + .71).g);
  vec3 c = vec3(.2, .22, .78); float a = b;
  c = mix(c, vec3(.9, .88, .76), w); a = max(a, w);
  c = mix(c, vec3(.82, .2, .36), r); a = max(a, r);
  c = mix(c, vec3(.9, .55, .06), y); a = max(a, y);
  return vec4(c, a);
}
vec2 meadowLie(vec2 q) {
  float lie = texture2D(uNoise, q * .0029 + .53).r, way = texture2D(uNoise, q * .0017 + .23).g;
  return vec2(mix(.62, 1.3, smoothstep(.3, .7, lie)), 1. - smoothstep(.004, .014, abs(way - .5)));
}`;
const GRASS_VERT = /* glsl */`
attribute vec4 iRoot, iShape, iTone; attribute vec2 iBrook;
varying vec3 vN, vBl, vWd; varying vec2 vBrook;
void main() {
  vBrook = iBrook;
  // a blade hangs from its root, bent along its whole length (it leaves the root leaning out and comes to hang
  // plumb), and curls at the tip. position.y: 0 to 1 along the part before the curl, 1 to 2 along the curl
  float q = position.y, L = iRoot.w, cl = iShape.z, sA = L - cl;
  float s = q <= 1. ? q * sA : sA + cl * (q - 1.);
  float th = max(s - sA, 0.) / max(cl, .01) * iShape.w, rc = cl / max(iShape.w, .1), f = s / max(L, .01), g = 1. - clamp(f, 0., 1.);
  vec2 hd = vec2(cos(iShape.y), sin(iShape.y)), bd = vec2(cos(iTone.w), sin(iTone.w));
  vec3 c = iRoot.xyz + vec3(0., -min(s, sA), 0.) + rc * (vec3(hd.x, 0., hd.y) * (1. - cos(th)) - vec3(0., sin(th), 0.));
  c.xz += bd * iTone.z * (1. - g * g);
  vec3 tang = normalize(vec3(hd.x * sin(th), -cos(th), hd.y * sin(th)) + vec3(bd.x, 0., bd.y) * (iTone.z * 2. * g / max(L, .01))), wd = vec3(-hd.y, 0., hd.x);
  // a leaf of grass turns a little about its own length as it hangs (a quarter turn at the most, each by its own tone)
  float tw = (iTone.x - .5) * 2.4 * f; wd = normalize(wd * cos(tw) + cross(tang, wd) * sin(tw));
  vec2 sw = gSway(iRoot.xz, iTone.y);
  c.xz += vec2(.8, .6) * sw.x * (.5 + iTone.x) * f * f + vec2(-1., .15) * sin(sw.y * uShud.y) * s;
  float w = iShape.x * (1. - pow(clamp(f, 0., 1.), 2.5)) * (.6 + .4 * smoothstep(0., .2, f));
  vec3 p = c + wd * position.x * w;
  vN = cross(tang, wd); vWd = wd; vBl = vec3(position.x, f, iTone.x);
  vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const GRASS_FRAG = MEADOW_GLSL + /* glsl */`
uniform vec3 uGlass, uDeep, uYoung; uniform float uFar; varying vec3 vN, vBl, vWd; varying vec2 vBrook;
void main() {
  // a leaf of grass is folded along its midrib: its two halves face a little apart, so one takes the sun and one the shade
  vec3 N = normalize(normalize(vN) + normalize(vWd) * sign(vBl.x) * .5); if (!gl_FrontFacing) N = -N;
  float ax = abs(vBl.x), rib = 1. - .3 * (1. - smoothstep(.0, .09, ax)), veins = .94 + .06 * sin(vBl.x * 90.);
  // (uFar: how far off this form of the grass stands, 0 beside the line, 1 the far meadow. THE FAR MEADOW IS PAINTED
  // BY PLACE, not blade by blade: a far blade has the tone of its place, not one of its own)
  vec3 alb = mix(uDeep, uGlass, smoothstep(0., .6, vBl.y) * (.5 + .5 * mix(vBl.z, .5, uFar)));
  alb = mix(alb, uYoung, smoothstep(.62, 1., vBl.y) * .55 * (1. - .6 * uFar)) * mix(rib * veins, 1., uFar);
  // the leaf is thinnest at its edges: there the light through it is strongest (a burning edge against the sun)
  alb = mix(alb, uYoung, smoothstep(.36, .5, ax) * .5 * (1. - uFar));
  // THE MEADOW'S PATTERN lies in the far grass: the flowers of a drift colour the lower half of its blades, a
  // hollow's grass is darker, a rise's paler, a mown path's grass is pale and has no flowers
  { vec4 dr = meadowAt(vWp.xz); vec2 lie = meadowLie(vWp.xz); float low = smoothstep(.1, .6, vBl.y);
    alb = mix(alb, mix(alb, vec3(.62, .8, .4), .6), lie.y * uFar);
    alb = mix(alb, dr.rgb, dr.a * low * (1. - lie.y) * .85 * uFar) * mix(1., lie.x, uFar); }
  vec3 c = gShade(alb, normalize(mix(N, vec3(0., -1., 0.), uFar * .6)), .75 + .25 * smoothstep(.3, .5, ax), mix(.28, 1., smoothstep(0., .65, vBl.y)), 1.);
  // THE BROOK'S LIGHT ON ITS FRINGE (vBrook: how near the water's edge this blade's root stands, and the metres down
  // the course there): the grass along the hanging brook shines with the water's light, a bright winding ribbon
  // across the ceiling, and the low sun's glints run down it with the stream (the world clock)
  { float run = vBrook.y * .21 - uTime * .9, gl = pow(max(sin(run) * .6 + sin(run * 2.7 + 1.3) * .4, 0.), 3.);
    c += (vec3(.5, .78, .74) * .45 + uSunCol * vec3(.3, .26, .16) * gl) * vBrook.x * (.35 + .65 * smoothstep(.2, .9, vBl.y)); }
  gl_FragColor = vec4(gFog(c), 1.);
}`;
// the blades in sectors round the ball's axis (eight meshes, each with a bound of its own)
async function grassMeshes(shared, rows, sectors, ctx) {
  // the blade's form: a ribbon through its nodes (0 the root, 1 where the curl begins, 4 the tip); the coarse form
  // of the far blades has the root, the curl's beginning and the tip only
  const ribbon = (nodes) => {
    const g = new THREE.BufferGeometry(), pos = [], idx = [];
    for (const j of nodes) pos.push(-0.5, j, 0, 0.5, j, 0);
    for (let j = 0; j < nodes.length - 1; j++) idx.push(j * 2, j * 2 + 1, j * 2 + 2, j * 2 + 1, j * 2 + 3, j * 2 + 2);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    return g;
  };
  // the fine form has three nodes before the curl and two on it; the middle form the root, the curl's beginning and
  // the tip; the coarse form the root and the tip
  const forms = [ribbon([0, 0.35, 0.7, 1, 1.5, 2]), ribbon([0, 1, 2]), ribbon([0, 2])], names = ['hanging grass ', 'middle grass ', 'far grass '];
  // (one material to a form: the fine form beside the line is painted blade by blade, the far form by place, the middle between)
  const mats = [0, 0.5, 1].map((far) => new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uGlass: { value: new THREE.Color('#3FA64A') }, uDeep: { value: new THREE.Color('#1E5A3A') }, uYoung: { value: new THREE.Color('#B9EE7C') }, uFar: { value: far } },
    vertexShader: shared.GV + GRASS_VERT, fragmentShader: shared.GF + GRASS_FRAG, side: THREE.DoubleSide }));
  const bins = []; for (let k = 0; k < sectors * 3; k++) bins.push([]);
  await ctx.yield();
  for (let i = 0; i < rows.length; i++) { const r = rows[i]; bins[Math.floor(((Math.atan2(r[2], r[0]) / TAU + 1) % 1) * sectors) % sectors + (r[10] || 0) * sectors].push(r); if (i % 256 === 255) await ctx.yield(); }
  const out = [];
  await ctx.yield();
  for (let k = 0; k < sectors * 3; k++) {
    const bin = bins[k], base = forms[Math.floor(k / sectors)];
    if (!bin.length) continue;
    const n = bin.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 4), e = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const r = bin[i]; a.set([r[0], r[1], r[2], r[3]], i * 4); b.set([r[4], r[5], r[6], r[7]], i * 4); c.set([r[8], r[9], r[11] || 0, r[12] || 0], i * 4); e.set([r[13] || 0, r[14] || 0], i * 2); if (i % 96 === 95) await ctx.yield(); }
    await ctx.yield();
    const [lo, hi] = boundsOf(bin, (r) => [r[0] - (r[11] || 0), r[1] - r[3], r[2] - (r[11] || 0), r[0] + (r[11] || 0), r[1], r[2] + (r[11] || 0)]);
    await ctx.yield();
    const m = new THREE.Mesh(instanced(base, { iRoot: { a, n: 4 }, iShape: { a: b, n: 4 }, iTone: { a: c, n: 4 }, iBrook: { a: e, n: 2 } }, n, lo, hi), mats[Math.floor(k / sectors)]);
    m.name = names[Math.floor(k / sectors)] + k % sectors; out.push(m);
    await ctx.yield();
  }
  return out;
}
const STALK_VERT = /* glsl */`
attribute vec4 iRoot; attribute vec2 iPh; varying vec3 vN; varying float vF;
void main() {
  // a three-sided stalk, STALK metres through (a great bloom's thicker: iPh.y), from the turf to the head's neck; it
  // stands as it is built
  vec3 c = iRoot.xyz - vec3(0., iRoot.w * position.y, 0.) + headOff(gSway(iRoot.xz, iPh.x)) * position.y;
  vec3 p = c + vec3(position.x, 0., position.z) * iPh.y;
  vN = normalize(vec3(position.x, 0., position.z)); vF = position.y;
  vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const STALK_FRAG = /* glsl */`
uniform vec3 uStalk, uStalkTop; varying vec3 vN; varying float vF;
void main() { gl_FragColor = vec4(gFog(gShade(mix(uStalkTop, uStalk, smoothstep(.3, .75, vF)), normalize(vN), .5, mix(.4, 1., vF), .6)), 1.); }`;
const HEAD_VERT = /* glsl */`
attribute vec4 iPos, iRot; attribute vec3 iCol; attribute float aPart;
varying vec3 vN, vCol, vL; varying float vPart;
void main() {
  vec2 sw = gSway(iPos.xz, iRot.y); vL = position;
  float cy = cos(iRot.x), sy = sin(iRot.x), nod = sw.x * .05 + sw.y * .2, cn = cos(nod), sn = sin(nod);
  vec3 p = position * iPos.w, n = normal;
  p.xz = mat2(cy, -sy, sy, cy) * p.xz; n.xz = mat2(cy, -sy, sy, cy) * n.xz;
  p.xy = mat2(cn, -sn, sn, cn) * p.xy; n.xy = mat2(cn, -sn, sn, cn) * n.xy;
  p += iPos.xyz + headOff(sw);
  vN = n; vCol = iCol; vPart = aPart;
  vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const HEAD_FRAG = /* glsl */`
uniform vec3 uHeart, uGreen; uniform float uGloss, uKind; uniform vec2 uBall; varying vec3 vN, vCol, vL; varying float vPart;
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vPart < .5 ? vCol * .8 : (vPart < 1.5 ? uHeart : uGreen);
  // THE CLOVER IS A BALL OF FLORETS and THE SEED HEAD A SPINDLE OF SEEDS IN ROWS, by the place on the head (its own
  // measure, the same in every form): each floret dark at its root and pale at its tip, the rows set half a floret
  // off one another; a green calyx where the stalk comes in
  if (vPart < .5 && uKind > .5 && (uKind < 1.5 || uKind > 3.5)) {
    float h = clamp((-vL.y - uBall.x) / uBall.y, 0., 1.), a = atan(vL.z, vL.x) / 6.2832 + .5;
    float rows = h * (uKind < 1.5 ? 10. : 9.), row = floor(rows), f = fract(rows), n = floor(4. + 13. * sin(3.1416 * clamp((row + .5) / (uKind < 1.5 ? 10. : 9.), 0., 1.)));
    float cell = fract(a * n + row * .5), fd = length(vec2(cell - .5, (f - .58) * .9)), fl = 1. - smoothstep(.2, .5, fd);
    alb = mix(alb * .55, mix(alb, vec3(1.), .25 * smoothstep(.35, .0, fd)), fl);
    alb = mix(uGreen, alb, smoothstep(.04, .16, h));
  }
  vec3 c = gShade(alb, N, vPart < .5 ? .7 : .2, 1., 1.);
  // A HAREBELL'S WALL IS THIN: the light that fills the bell from below shows through it, so its outer side, turned
  // up into the green dusk, still has the bell's own colour
  if (vPart < .5 && uKind > 2.5 && uKind < 3.5) c = max(c, gShade(alb, -N, .7, 1., 1.) * .85);
  vec3 V = normalize(cameraPosition - vWp);
  c += uSunCol * uGloss * pow(max(dot(N, normalize(uSun + V)), 0.), 30.) * step(vPart, .5);
  gl_FragColor = vec4(gFog(c), 1.);
}`;
// stalks and heads: one stalk mesh; every kind of head in a full form within 40 m of the route, a coarse form further
// off and a far form for the furthest (chosen at build from the fixed line: the head's level distance from it; the
// great blooms first, then the nearest of a kind take the full form while HEAD_BUDGET triangles last, the next the coarse form while HEAD_COARSE
// last, the rest the far form: so no kind, whichever the visit makes the commonest, costs more than the two budgets)
// (EVERY HEAD HANGS BY A STEM PLAIN TO SEE: a stalk is STALK metres through, a ninth of a clover's ball and more of
// every other head, a great bloom's as many times thicker as the bloom is greater; green where it leaves the turf,
// it darkens down its length to a dark cord of its own colour, darker and browner than any blade of the grass it
// hangs out of, so it reads down to the head)
const HEAD_BUDGET = 8500, HEAD_COARSE = 7000, STALK = 0.5;
function* flowerMeshes(shared, rows, fullWithin) {
  const n = rows.length, a = new Float32Array(n * 4), ph = new Float32Array(n * 2);
  rows.forEach((r, i) => { a.set([r.x, r.top, r.z, r.len], i * 4); ph[i * 2] = r.ph; ph[i * 2 + 1] = STALK * (r.great ? r.size : 1); });
  const quad = new THREE.BufferGeometry(), c3 = [0.5, 0, -0.25, 0.433, -0.25, -0.433];
  quad.setAttribute('position', new THREE.Float32BufferAttribute([c3[0], 0, c3[1], c3[2], 0, c3[3], c3[4], 0, c3[5], c3[0], 1, c3[1], c3[2], 1, c3[3], c3[4], 1, c3[5]], 3));
  quad.setIndex([0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 2, 5, 0, 0, 5, 3]);
  const [slo, shi] = boundsOf(rows, (r) => [r.x, r.top - r.len, r.z, r.x, r.top, r.z]);
  const stalks = new THREE.Mesh(instanced(quad, { iRoot: { a, n: 4 }, iPh: { a: ph, n: 2 } }, n, slo, shi), new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uStalk: { value: new THREE.Color('#3A4A1F') }, uStalkTop: { value: new THREE.Color('#4E8A3A') } }, vertexShader: shared.GV + HEAD_OFF + STALK_VERT, fragmentShader: shared.GF + STALK_FRAG, side: THREE.DoubleSide }));
  stalks.name = 'flower stalks'; yield stalks;
  const mat = (gloss, kind) => new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uHeart: { value: new THREE.Color('#E8A21E') }, uGreen: { value: new THREE.Color('#3E8A3A') }, uGloss: { value: gloss }, uKind: { value: kind }, uBall: { value: new THREE.Vector2(kind === 1 ? 0.5 : 0, kind === 1 ? HEADS[1].R * 1.94 : HEADS[kind].D) } },
    vertexShader: shared.GV + HEAD_OFF + HEAD_VERT, fragmentShader: shared.GF + HEAD_FRAG, side: THREE.DoubleSide });
  const mats = [mat(0.9, 0), mat(0, 1), mat(0.15, 2), mat(0.3, 3), mat(0, 4)];
  // the full form goes to the heads of a kind that stand nearest the line, within fullWithin metres of it, as many
  // as HEAD_BUDGET triangles allow for the kind (by place: the line is fixed; the eye is never asked)
  for (let kind = 0; kind < HEADS.length; kind++) {
    const fullGeo = headGeometry(kind, true), cap = Math.floor(HEAD_BUDGET / (fullGeo.index.count / 3)), coarseGeo = headGeometry(kind, false), cap2 = Math.floor(HEAD_COARSE / (coarseGeo.index.count / 3)); fullGeo.dispose(); coarseGeo.dispose();
    let nFull = 0;
    rows.filter((r) => r.kind === kind).sort((p, q) => (q.great ? 1 : 0) - (p.great ? 1 : 0) || p.near - q.near).forEach((r, i) => { r.form = (r.near < fullWithin || r.great) && i < cap ? 0 : i - nFull < cap2 ? 1 : 2; if (r.form === 0) nFull++; });
    yield null;
  }
  for (let kind = 0; kind < HEADS.length; kind++) for (const form of [0, 1, 2]) {
    const full = form === 0, set = rows.filter((r) => r.kind === kind && r.form === form);
    if (!set.length) continue;
    const m = set.length, p = new Float32Array(m * 4), q = new Float32Array(m * 4), c = new Float32Array(m * 3);
    set.forEach((r, i) => { p.set([r.x, r.top - r.len, r.z, r.size], i * 4); q.set([r.yaw, r.ph, 0, 0], i * 4); c.set(r.col, i * 3); });
    const [lo, hi] = boundsOf(set, (r) => { const e = HEADS[kind].R * r.size + 1, dn = HEADS[kind].D * r.size + 2; return [r.x - e, r.top - r.len - dn, r.z - e, r.x + e, r.top - r.len, r.z + e]; });
    const mesh = new THREE.Mesh(instanced(headGeometry(kind, full, form === 2), { iPos: { a: p, n: 4 }, iRot: { a: q, n: 4 }, iCol: { a: c, n: 3 } }, m, lo, hi), mats[kind]);
    mesh.name = 'heads ' + kind + [' full', ' coarse', ' far'][form]; yield mesh;
  }
}
// ------------------------------------------------------------------ THE SKY BELOW and THE VAULT
// THE AIR IS CLEAR (round five): the drop's skin is painted nowhere. The ball under the rim is SKY: a deep blue
// straight down that pales a little toward the level, as any sky does toward its horizon, and warms toward the low
// sun. In it, by direction and by the place on the ball alone, with no triangle: THE SUN (a white gold disc with its
// glare) and THE FAR FLOOR OF CLOUD, soft heaps far below with a lit side and a shade side by the sun's direction,
// standing still, gone well under the level. No film, no band, no net, no line, no grain: where the ball meets the
// vault it has the very colour of the haze every far thing fades into. Nothing is seen outside the drop but sky
// colour and the sun.
const SKIN_VERT = /* glsl */`
varying vec3 vWp;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// THE SUN'S SPOKES, a row drawn once from the world's fixed stream: [bearing about the sun (turns of the whole round,
// one spoke somewhere in each equal share of it), half width (turns), brightness, the rate and phase of its sway].
// spokeAt is the shader's own law, for the count of their share: how bright the spokes stand on a bearing at a clock.
const SPOKE = { n: 14, wide: [0.006, 0.026], bright: [0.45, 1], rate: [0.6, 1.4], sway: 0.3 };
export function dealSpokes() {
  const rng = makeRng(hashSeed(FIXED + ':sun spokes')), rows = [];
  for (let i = 0; i < SPOKE.n; i++) rows.push(new THREE.Vector4((i + rng.range(0.15, 0.85)) / SPOKE.n, rng.range(SPOKE.wide[0], SPOKE.wide[1]), rng.range(SPOKE.bright[0], SPOKE.bright[1]), rng.range(SPOKE.rate[0], SPOKE.rate[1])));
  return rows;
}
export function spokeAt(rows, az, time) {
  let sp = 0;
  for (const s of rows) {
    const d = Math.abs(((az - s.x + 0.5) % 1 + 1) % 1 - 0.5), w = s.y * (1 + SPOKE.sway * Math.sin(time * s.w * 0.23 + s.w * 3));
    sp = Math.max(sp, s.z * (1 + SPOKE.sway * Math.sin(time * s.w * 0.31 + s.w * 7)) * (1 - smoothstep(0.35, 1, d / w)));
  }
  return sp;
}
const SKIN_FRAG = () => BOW_GLSL + /* glsl */`
#define SPOKES ${SPOKE.n}
#define SPOKE_SWAY ${SPOKE.sway.toFixed(2)}
uniform vec3 uDeepSky, uPaleSky, uZenith, uDeckLit, uDeckShade, uDeckRim; uniform vec4 uSpoke[SPOKES];
float deckAt(vec2 q) { return texture2D(uNoise, q * .0037).r * .6 + texture2D(uNoise, q * .0101 + .37).g * .4; }
void main() {
  vec3 v = vWp - cameraPosition; vec3 dir = v / max(length(v), 1e-3);
  float tow = clamp(dot(dir, uSun), 0., 1.);
  // THE SKY deepens BY PLACE down the ball: a clear blue under the level, azure, a strong deep blue straight below
  float h1 = 1. - smoothstep(-46., 20., vWp.y), h2 = 1. - smoothstep(-250., -90., vWp.y);
  vec3 c = mix(mix(uPaleSky, uDeepSky, h1 * (2. - h1)), uZenith, h2 * .85);
  // at the level the sky has the pale haze every far thing of the land fades into (the same law, the same colour):
  // a soft pale horizon over the level only; under the level the sky is blue at once
  { float hz = smoothstep(-5., 18., vWp.y); c = mix(c, gHaze(dir, 20.), hz * hz * .3); }
  // THE FAR FLOOR OF CLOUD: soft heaps far below, laid on the ball by its own measure (metres along it from the
  // lowest point, so the heaps are round wherever they lie and draw together toward the level); lit on the side
  // toward the sun, blue-violet on the other, each with a warm edge; it thins upward and is gone 45 m under the level
  float R = length(vWp), arc = acos(clamp(-vWp.y / R, -1., 1.)) * R;
  vec2 q = vWp.xz / max(length(vWp.xz), 1e-3) * arc, sunH = normalize(uSun.xz);
  float n = deckAt(q), nSun = deckAt(q + sunH * 14.);
  // (round six: THE DEEPEST DECK IS HAZE: broad soft fields with no edge, bluer and paler than any heap over them)
  float rise = smoothstep(-130., -45., vWp.y), reach = 1. - smoothstep(-80., -45., vWp.y);
  float cover = smoothstep(.34 + rise * .08, .72 + rise * .06, n) * reach;
  float lit = smoothstep(-.03, .07, n - nSun);
  vec3 deck = mix(uDeckShade * (.85 + .25 * smoothstep(.5, .74, n)), uDeckLit, lit * .7);
  c = mix(c, deck, cover * .72);
  c += uDeckRim * cover * (1. - cover) * tow * tow * .3;
  // THE SUN, seen in the sky: a white gold disc two degrees across, four with its glare, and a soft warm breath
  float sd = clamp(dot(dir, uSun), 0., 1.), s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
  float disc = smoothstep(.99982, .9999, sd), glare = pow(sd, 1800.) * 1.5 + s64 * s64 * s64 * s64 * .1 + s64 * .05 + s8 * .035;
  // THE SKY DEEPENS FROM BLUE TOWARD GOLD NEAR THE SUN (round six): a broad warm field about the sun's place, amber
  // in its middle; and the sun's own core is gold, never white
  c = mix(c, vec3(1., .7, .34) * .85, s2 * s2 * s2 * .5);
  c = mix(c, vec3(.98, .58, .16), s8 * s8 * .6);
  // THE SUN'S SPOKES: long rays stand in the sky round the sun's place, as its light comes past the heaps before
  // it: broad and narrow by turns round the sun. THEIR PATTERN IS FIXED BY BEARING about the sun's own direction
  // (the row uSpoke, drawn once: dealSpokes); the world clock only sways each spoke's width and brightness about
  // its own mean, so their share of the sky is the same at every clock. Strongest five to forty degrees from the sun
  vec3 a1 = normalize(cross(uSun, vec3(0., 1., 0.))), a2 = cross(uSun, a1);
  float az = atan(dot(dir, a2), dot(dir, a1)) / 6.2832, sp = 0.;
  for (int i = 0; i < SPOKES; i++) {
    vec4 s = uSpoke[i]; float d = abs(fract(az - s.x + .5) - .5);
    sp = max(sp, s.z * (1. + SPOKE_SWAY * sin(uTime * s.w * .31 + s.w * 7.)) * (1. - smoothstep(.35, 1., d / (s.y * (1. + SPOKE_SWAY * sin(uTime * s.w * .23 + s.w * 3.))))));
  }
  c += vec3(1., .72, .36) * sp * s8 * (1. - s64 * s64) * .32;
  c += vec3(.5, .26, .03) * disc + uSunCol * vec3(1., .6, .22) * glare * .25;
  // THE BOW, opposite the sun (bowAt): over clear blue it is hardly there; the far floor of cloud shows it faintly
  c += bowAt(dir) * (.045 + .16 * cover);
  gl_FragColor = vec4(c, 1.);
}`;
// the vault: the turf's face, a cap over the whole rim, seen from underneath
async function vaultGeometry(ctx) {
  const NR = 48, NA = 112, pos = [], nor = [], idx = [], rng = makeRng(hashSeed(FIXED + ':turf'));
  const ph = [rng() * TAU, rng() * TAU, rng() * TAU];
  const h = (x, z) => yg(x, z) + 0.3 * (Math.sin(x * 0.21 + ph[0]) * Math.sin(z * 0.17 + ph[1]) + Math.sin((x + z) * 0.093 + ph[2]));
  for (let j = 0; j <= NR; j++) {
    const r = GARDEN.RIM_R * Math.sin(j / NR * Math.PI / 2);
    await ctx.yield();
    for (let i = 0; i <= NA; i++) {
      const a = i / NA * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, e = 0.5;
      pos.push(x, h(x, z), z);
      const gx = (h(x + e, z) - h(x - e, z)) / (2 * e), gz = (h(x, z + e) - h(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz);
      nor.push(gx / l, -1 / l, gz / l);
    }
  }
  await ctx.yield();
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
const TURF_VERT = /* glsl */`
varying vec3 vN;
void main() { vN = normal; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const TURF_FRAG = MEADOW_GLSL + /* glsl */`
uniform vec3 uTurfA, uTurfB, uEarth; varying vec3 vN;
void main() {
  vec3 N = normalize(vN);
  float n = texture2D(uNoise, vWp.xz * .017).r, m = texture2D(uNoise, vWp.xz * .09).g, fine = texture2D(uNoise, vWp.xz * .43).b;
  // deep green turf, moss, bare earth and roots between; short grass as a fine grain
  vec3 alb = mix(uTurfA, uTurfB, smoothstep(.3, .7, n));
  alb = mix(alb, uEarth, smoothstep(.6, .78, m) * .7) * mix(.7, 1.2, fine);
  // THE MEADOW'S PATTERN on the turf's own face: the drifts' colour among the short grass, hollows and rises, mown paths
  { vec4 dr = meadowAt(vWp.xz); vec2 lie = meadowLie(vWp.xz);
    alb = mix(alb, vec3(.5, .68, .3), lie.y * .7); alb = mix(alb, dr.rgb, dr.a * (1. - lie.y) * .6) * lie.x; }
  // the hanging grass stands before the turf and takes most of the sun: flecks of it get through
  float fleck = smoothstep(.55, .8, texture2D(uNoise, vWp.xz * .06 + .3).r);
  // THE LIP OF THE VAULT, by place: the last ten metres to the rim are moss and wet earth with roots running down
  // them (upright streaks in the rim's own measure, round and down); the rim's mist lies over it (gFog), so the
  // vault ends in living ground going into mist: no dark strip, no cut edge
  float lip = smoothstep(238., 247., length(vWp.xz)), az = atan(vWp.z, vWp.x);
  float root = texture2D(uNoise, vec2(az * 31., vWp.y * .011)).r * .6 + texture2D(uNoise, vec2(az * 97., vWp.y * .023 + .4)).g * .4;
  alb = mix(alb, mix(uTurfB, uEarth * 1.2, smoothstep(.42, .62, root)), lip * .8);
  // THE LIGHT COMES UP THROUGH THE MEADOW (round six): the turf takes the green light that the lit blades under it
  // throw back, so its darkest part is a deep green, never black
  vec3 c = gShade(alb, N, 0., mix(.16 + .3 * fleck, .7, lip), 0.) + alb * vec3(.55, .95, .5) * (.3 + .25 * fleck);
  gl_FragColor = vec4(gFog(c), 1.);
}`;
// ------------------------------------------------------------------ THE BROOK on the ceiling
// stones in the water (the fixed stream): rows [x, y of the water's face, z, radius, how far it stands down, yaw]
export function dealStones(P) {
  const rng = makeRng(hashSeed(FIXED + ':stones')), out = [], B = P.brook;
  // the knoll's reach of the brook: from where it comes onto the knoll to where it leaves it
  const sA = B.near(BROOK.course[3][0], BROOK.course[3][1]).s, sB = B.near(BROOK.course[7][0], BROOK.course[7][1]).s;
  for (let i = 0; i < 46; i++) {
    // more of them over the knoll, where the line runs under the water
    const u = rng(), s = i < 20 ? lerp(sA, sB, u) : lerp(30, B.L - 30, u), q = B.pts[Math.min(B.pts.length - 1, Math.round(s / 2))];
    const off = rng.range(-0.36, 0.36) * q.w, rad = rng.range(1.5, 3.3), down = rng.range(1.2, 3), yaw = rng() * TAU;
    const x = q.x - q.tz * off, z = q.z + q.tx * off, face = yg(x, z) - BROOK.deep;
    if (out.some((o) => Math.hypot(o[0] - x, o[2] - z) < o[3] + rad + 1.5)) continue;
    // lane law (b) binds the stones: none lower than its limit
    const low = Math.max(face - down, P.lane(x, z, rad * 1.3));
    if (face - low < 0.4) continue;
    out.push([x, face, z, rad, face - low, yaw]);
  }
  return out;
}
// the beads: at the three riffles they let go, hang 3 to 9 m under the face and fall back UP; at the stones small ones
// hang 1 to 3 m. Each has a place of its own (a plumb line): rows [x, face, z, reach, period, phase, radius]
export function dealBeads(P, rng, stones) {
  const out = [];
  const put = (x, z, reach, rad) => {
    const face = yg(x, z) - BROOK.deep * 0.8, r = Math.min(reach, face - rad - P.lane(x, z, rad + 0.3));
    if (r > 0.6) out.push([x, face, z, r, rng.range(3.2, 6.5), rng(), rad]);
  };
  for (const [rx, rz] of BROOK.riffles) for (let k = 0; k < 9; k++) { const a = rng() * TAU, d = Math.sqrt(rng()) * 3.6; put(rx + Math.cos(a) * d, rz + Math.sin(a) * d, rng.range(3, 9), rng.range(0.35, 0.7)); }
  for (const s of stones) { const a = rng() * TAU; put(s[0] + Math.cos(a) * (s[3] + 0.5), s[2] + Math.sin(a) * (s[3] + 0.5), rng.range(1, 3), rng.range(0.22, 0.4)); }
  return out;
}
// reeds and cress at the banks (the fixed stream), in the blades' own rows; no reed within 9 m of the line
export async function dealBanks(P, ctx) {
  const rng = makeRng(hashSeed(FIXED + ':banks')), out = [], B = P.brook;
  for (let i = 0; i < 620; i++) {
    if (ctx && i % 12 === 11) await ctx.yield();
    const q = B.pts[rng.int(8, B.pts.length - 9)], side = rng.sign(), reed = rng.chance(0.42), off = side * (q.w / 2 + (reed ? rng.range(0.6, 3.2) : rng.range(-0.5, 0.9)));
    const x = q.x - q.tz * off, z = q.z + q.tx * off, top = yg(x, z), u = [rng(), rng(), rng(), rng(), rng()];
    if (reed && P.near.level(x, z).dist < LANE.near + 1) continue;
    const width = reed ? lerp(0.35, 0.6, u[0]) : lerp(1.1, 2.0, u[0]), len = Math.min(reed ? lerp(6, 12, u[1]) : lerp(1.2, 2.8, u[1]), top - P.lane(x, z, width / 2 + 1.5));
    if (len < 0.9) continue;
    out.push([x, top + 0.4, z, len, width, u[2] * TAU, Math.min(reed ? 0.8 : 0.9, len * 0.4), reed ? lerp(0.5, 1.2, u[3]) : lerp(1.5, 2.8, u[3]), reed ? 0.25 : 0.95, u[4] * TAU]);
  }
  return out;
}
// the water: one ribbon along the course, clinging to the turf, its free face looking down
async function brookGeometry(P, stones, ctx) {
  const B = P.brook, NC = 6, pos = [], uv = [], rif = [], idx = [];
  for (let i = 0; i < B.pts.length; i++) {
    const q = B.pts[i];
    if (i % 4 === 3) await ctx.yield();
    for (let c = 0; c <= NC; c++) {
      const v = c / NC * 2 - 1, off = v * q.w / 2, x = q.x - q.tz * off, z = q.z + q.tx * off;
      pos.push(x, yg(x, z) + 0.5 - (BROOK.deep + 0.5) * Math.pow(1 - v * v * v * v, 0.6), z); uv.push(off, q.s);
      let f = 0;
      for (let k = 0; k < BROOK.riffles.length; k++) { const dx = x - BROOK.riffles[k][0], dz = z - BROOK.riffles[k][1], d2 = dx * dx + dz * dz; if (d2 < 340) f = Math.max(f, Math.exp(-d2 / 34)); }
      for (let k = 0; k < stones.length; k++) {
        const s = stones[k], dx = x - s[0], dz = z - s[2], d2 = dx * dx + dz * dz, reach = s[3] * 0.8 + 4;
        if (d2 < reach * reach) { const e = Math.max(Math.sqrt(d2) - s[3] * 0.8, 0); f = Math.max(f, 0.9 * Math.exp(-e * e / 1.6)); }
      }
      rif.push(f);
    }
    if (i > 0) for (let c = 0; c < NC; c++) { const a = (i - 1) * (NC + 1) + c, b = a + NC + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aRif', new THREE.Float32BufferAttribute(rif, 1)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const BROOK_VERT = /* glsl */`
attribute float aRif; varying vec2 vUv; varying float vRif; varying vec3 vN;
void main() { vUv = uv; vRif = aRif; vN = normal; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const BROOK_FRAG = /* glsl */`
uniform vec3 uBedA, uBedB, uWeed, uWater, uMirror, uGlass; uniform vec4 uShud; varying vec2 vUv; varying float vRif; varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vWp), N = normalize(vN); if (dot(N, V) < 0.) N = -N;
  // ripples that keep their size in metres and travel down the course at 4 m a second
  float run = vUv.y - uTime * 4.;
  float r1 = texture2D(uNoise, vec2(vUv.x * .11, run * .075)).r, r2 = texture2D(uNoise, vec2(vUv.x * .31 + .4, run * .21)).g;
  // when the shudder passes, the brook slops: a long swell runs down it and its ripples steepen
  float tl = mod(uTime + uShud.x, 14.) - (250. - vWp.x) * .01, slop = smoothstep(0., 1., tl) * (1. - smoothstep(1.4, 4.6, tl));
  float h = r1 * .6 + r2 * .4 + slop * .5 * sin(vUv.y * .7 - uTime * 5.);
  vec3 dpx = dFdx(vWp), dpy = dFdy(vWp); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1v = cross(dpy, N), r2v = cross(N, dpx); float det = dot(dpx, r1v);
  // the ripples fade by THEIR OWN WIDTH AS DRAWN (the metres of water one drawn point spans), never by how
  // far the eye is
  float fine = 1. - smoothstep(.3, 1.4, fwidth(vUv.x) + fwidth(vUv.y));
  vec3 Nr = normalize(abs(det) * N - .55 * (1. + slop) * fine * sign(det) * (hx * r1v + hy * r2v));
  // SEEN FROM BENEATH THE BROOK IS A RIBBON OF GLASS WITH THE LIGHT IN IT (the low sun comes up through the water):
  // the brightest thing of the turf, clear blue green, the nets of light crawling in it; the cobbles of the bed, bent
  // by the ripples, the cress along the banks and the weed streaming down the middle are the DARK SHAPES INSIDE THE
  // BRIGHTNESS (never a grey strip: the glass keeps its own colour, the dark keeps its own depth).
  vec3 sunT = uSunCol / max(uSunCol.r, 1e-3);
  vec2 bq = vec2(vUv.x, vUv.y) * .13 + (h - .5) * .16;
  float peb = texture2D(uNoise, bq).a, weed = texture2D(uNoise, vec2(vUv.x * .33, vUv.y * .028 - uTime * .05)).r;
  vec3 bed = mix(uBedA, uBedB, smoothstep(.12, .62, peb)) * (.55 + .6 * smoothstep(.0, .3, peb));
  float cress = smoothstep(2., 4.2, abs(vUv.x) + (texture2D(uNoise, vUv * .09).g - .5) * 2.4);
  bed = mix(bed, uWeed, max(smoothstep(.56, .7, weed) * .8, cress * .85));
  float net = gNet(vWp + vec3(0., 1.5, 0.)), mid = 1. - smoothstep(0., 4.2, abs(vUv.x));
  vec3 c = bed * (uFill * .7 + sunT * (.2 + .95 * net));
  float shape = max((1. - smoothstep(.1, .34, peb)) * .8, max(smoothstep(.56, .7, weed) * .7, cress * .8));
  c = mix(uGlass * (.8 + .75 * net) + uWater * .25 * mid, c * .7, shape);
  // THE SUN IN IT: the water is lit from its far end; where the sight runs toward the sun it glows green-gold
  float tow = clamp(dot(-V, uSun), 0., 1.);
  c += sunT * vec3(.5, .78, .42) * tow * tow * (.16 + .2 * mid);
  // FLOW LINES: long threads of light that run down the course with the water
  float flow = texture2D(uNoise, vec2(vUv.x * .7, run * .03)).b * .6 + texture2D(uNoise, vec2(vUv.x * 1.9 + .3, run * .05)).b * .4;
  c += vec3(.7, .9, .95) * smoothstep(.56, .8, flow) * .3 * (1. - shape);
  // the free face mirrors the sky below where the sight line grazes it
  float fr = pow(clamp(1. - dot(Nr, V), 0., 1.), 3.5);
  c = mix(c, uMirror, fr * .45);
  // THE LINE OF GLINTS: the low sun's own mirror on the water's skin, broken by the ripples into sparks that run
  // down the course toward the sun
  float glint = pow(max(dot(Nr, normalize(uSun + V)), 0.), 90.), spark = pow(max(dot(Nr, normalize(uSun + V)), 0.), 16.) * smoothstep(.6, .8, r2) * fine;
  c += sunT * (glint * 2.2 + spark * .7);
  // white water where it breaks: at the riffles and round the stones
  float foam = smoothstep(.5, .82, r2 * .75 + vRif * .8 - .12) * smoothstep(.12, .5, vRif);
  c = mix(c, vec3(.9, .94, .97) * (.75 + .25 * r1), foam);
  gl_FragColor = vec4(gFog(c), 1.);
}`;
// a lumpy ball (stones, cloud billows): the unit ball pushed in and out by a few slow waves
function lumpGeometry(detail, seed, amount) {
  const ico = new THREE.IcosahedronGeometry(1, detail), q = ico.attributes.position, rng = makeRng(hashSeed(FIXED + ':lump' + seed));
  const w = []; for (let i = 0; i < 5; i++) w.push([rng.range(1.5, 4.5), rng.range(1.5, 4.5), rng.range(1.5, 4.5), rng() * TAU]);
  // the ball's corners once each (the kit's ball repeats them per face), so the skin is one smooth sheet
  const seen = new Map(), pos = [], nor = [], idx = [];
  for (let i = 0; i < q.count; i++) {
    const x = q.getX(i), y = q.getY(i), z = q.getZ(i), key = Math.round(x * 4096) + ',' + Math.round(y * 4096) + ',' + Math.round(z * 4096);
    let at = seen.get(key);
    if (at === undefined) {
      let sum = 0, gx = 0, gy = 0, gz = 0;
      for (const k of w) { const a = x * k[0] + y * k[1] + z * k[2] + k[3], c = Math.cos(a) * amount * 0.4; sum += Math.sin(a); gx += c * k[0]; gy += c * k[1]; gz += c * k[2]; }
      const r = 1 + amount * sum / 5 * 2, gp = gx * x + gy * y + gz * z;
      const nx = x * r - (gx - gp * x), ny = y * r - (gy - gp * y), nz = z * r - (gz - gp * z), nl = Math.hypot(nx, ny, nz);
      at = pos.length / 3; seen.set(key, at); pos.push(x * r, y * r, z * r); nor.push(nx / nl, ny / nl, nz / nl);
    }
    idx.push(at);
  }
  ico.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
const STONE_VERT = /* glsl */`
varying vec3 vN, vLp;
void main() {
  vec4 wp = instanceMatrix * vec4(position, 1.); vLp = position; vN = normalize(mat3(instanceMatrix) * normal);
  vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STONE_FRAG = /* glsl */`
uniform vec3 uRockA, uRockB, uMossC; varying vec3 vN, vLp;
void main() {
  vec3 N = normalize(vN), w = abs(N); w /= (w.x + w.y + w.z);
  float n = texture2D(uNoise, vWp.yz * .16).r * w.x + texture2D(uNoise, vWp.zx * .16).r * w.y + texture2D(uNoise, vWp.xy * .16).r * w.z;
  vec3 alb = mix(uRockA, uRockB, smoothstep(.3, .7, n));
  // moss toward the turf; a wet boulder with its own form where it stands out of the water (darker than the water's
  // brightness, never a black hole in it), a small warm gleam of the low sun and a thin rim where the light comes
  // round it from behind
  alb = mix(alb, uMossC, smoothstep(.1, .7, N.y) * .7) * mix(.6, 1., smoothstep(-.9, .2, -vLp.y));
  vec3 V = normalize(cameraPosition - vWp), sunT = uSunCol / max(uSunCol.r, 1e-3);
  float gleam = pow(max(dot(N, normalize(uSun + V)), 0.), 40.), rim = pow(clamp(1. - dot(N, V), 0., 1.), 3.) * max(dot(-V, uSun), 0.);
  gl_FragColor = vec4(gFog(gShade(alb, N, 0., 1., 1.) + sunT * vec3(1., .8, .55) * (gleam * .22 + rim * .3)), 1.);
}`;
function stoneMesh(shared, stones) {
  const mesh = new THREE.InstancedMesh(lumpGeometry(2, 'stone', 0.14), new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uRockA: { value: new THREE.Color('#34322F') }, uRockB: { value: new THREE.Color('#6C6860') }, uMossC: { value: new THREE.Color('#3F6B2A') } },
    vertexShader: shared.GV + STONE_VERT, fragmentShader: shared.GF + STONE_FRAG }), stones.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  stones.forEach((s, i) => { const h = 0.5 * (s[4] + 1.2) / 1.3; mesh.setMatrixAt(i, M.compose(V.set(s[0], s[1] - s[4] + h * 1.3, s[2]), Q.setFromAxisAngle(Y, s[5]), S.set(s[3], h, s[3] * 0.85))); });
  mesh.name = 'brook stones';
  return mesh;
}
// ------------------------------------------------------------------ THE HEDGE round the rim (the same on every seed)
// bramble and dog rose as a dark fringe where the turf comes down to the rim: leaf masses hung from the turf in a band
// 10 to 18 m deep, none lower than RIM.hedge metres over y 24 (the vines, fronds and roots of the rim trail below
// them to law (a)'s floor); it is 40 m and more from the line everywhere
// rows: [x, y, z, radius, yaw, squash]
export function dealHedge() {
  const rng = makeRng(hashSeed(FIXED + ':hedge')), out = [];
  for (let a = 0; a < TAU;) {
    const deep = rng.range(10, 18), n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const r = GARDEN.RIM_R - 3.5 - (k + rng.range(0.2, 0.8)) / n * deep, a2 = a + rng.range(-0.012, 0.012), x = Math.cos(a2) * r, z = Math.sin(a2) * r;
      const floor = LANE.floor + RIM.hedge, top = yg(x, z), rad = Math.min(rng.range(4.5, 8), (top + 2 - floor) / 1.75), sq = rng.range(0.7, 0.95);
      if (rad < 2) continue;
      out.push([x, Math.max(top - rad * sq * 0.55, floor + rad * sq * 1.2), z, rad, rng() * TAU, sq]);
    }
    a += rng.range(7, 11) / GARDEN.RIM_R;
  }
  return out;
}
const HEDGE_VERT = /* glsl */`
varying vec3 vN, vLp;
void main() {
  vec3 n0 = normalize(position);
  vec4 wp = instanceMatrix * vec4(position, 1.);
  vN = normalize(mat3(instanceMatrix) * n0); vLp = wp.xyz; vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const HEDGE_FRAG = /* glsl */`
uniform vec3 uLeafA, uLeafB, uRose; varying vec3 vN, vLp;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWp), w = abs(N); w /= (w.x + w.y + w.z);
  vec4 t = texture2D(uNoise, vLp.zy * .09) * w.x + texture2D(uNoise, vLp.xz * .09) * w.y + texture2D(uNoise, vLp.xy * .09) * w.z;
  // a ragged outline of sprays
  if (dot(N, V) < (t.r * .7 + t.b * .3 - .3) * .7) discard;
  vec3 alb = mix(uLeafA, uLeafB, smoothstep(.3, .75, t.g));
  // the dog roses: small pale heads here and there among the leaves
  alb = mix(alb, uRose, smoothstep(.8, .9, t.a) * step(.55, t.r));
  vec3 Nb = normalize(N + (t.rgb - .5) * .8);
  gl_FragColor = vec4(gFog(gShade(alb, Nb, .5, mix(.6, 1., smoothstep(.25, .7, t.r)), .6)), 1.);
}`;
// (a mass within HEDGE_NEAR metres of the line is a finer ball, one beyond it a coarser one: by place, the line is fixed)
const HEDGE_NEAR = 110;
function hedgeMesh(shared, rows, fine) {
  const mesh = new THREE.InstancedMesh(lumpGeometry(fine ? 1 : 0, 'hedge', 0.1), new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uLeafA: { value: new THREE.Color('#2A6E3C') }, uLeafB: { value: new THREE.Color('#58A640') }, uRose: { value: new THREE.Color('#F0B8C6').multiplyScalar(0.7) } },
    vertexShader: shared.GV + HEDGE_VERT, fragmentShader: shared.GF + HEDGE_FRAG }), rows.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  rows.forEach((h, i) => mesh.setMatrixAt(i, M.compose(V.set(h[0], h[1], h[2]), Q.setFromAxisAngle(Y, h[4]), S.set(h[3], h[3] * h[5], h[3]))));
  mesh.name = fine ? 'the rim hedge' : 'the far rim hedge'; mesh.frustumCulled = false;
  return mesh;
}
// ------------------------------------------------------------------ THE FAR TREES (round five: the land goes on)
// THE HANGING HILLOCKS OF THE ROLL CARRY TREES: from the lowest turf of each hillock (RELIEF.hills, the roll's own
// stream) that hangs FAR.deep metres and more, one small tree hangs crown down: a trunk FAR.trunk times the
// hillock's depth, a little bent; a crown of flat leaf masses in three tiers with air between, FAR.crown times
// the hillock's width across, a limb to each tier. Its lowest spray stands FAR.over metres and more over law (a)'s floor: so every far
// tree stands WITHIN the hanging green as the entry sees it, and only the elm hangs against the sky (the join).
// Every place of a far tree keeps FAR.off metres and more from every place of the line (in space); a
// hillock whose tree could not is left bare. Their forms are dealt from the fixed stream 'far trees' (the same on
// every seed). They stand far: small with distance, paler and bluer in the land's haze.
// rows: { root: [x, y, z], fork: [x, y, z], limbs: [[x, y, z] x3], masses: [[x, y, z, radius, yaw, squash], ...] }
const FAR = { off: 28, deep: 16, trunk: [1.5, 2.1], crown: [0.42, 0.52], over: 3, wood: [1.9, 1.1, 0.4], unlike: [0.55, 1.25], heights: 2.4 };
export function dealFarTrees(near) {
  const rng = makeRng(hashSeed(FIXED + ':far trees')), out = [];
  for (const [hx, hz, deep, wide] of RELIEF.hills) {
    const u = [rng(), rng(), rng()], top = yg(hx, hz);
    if (deep < FAR.deep) continue;
    const R = wide * lerp(FAR.crown[0], FAR.crown[1], u[0]), low = LANE.floor + FAR.over, trunk = Math.min(deep * lerp(FAR.trunk[0], FAR.trunk[1], u[1]), top - low - R * 1.2);
    if (trunk < 12) continue;
    const lean = u[2] * TAU, fork = [hx + Math.cos(lean) * trunk * 0.08, top - trunk, hz + Math.sin(lean) * trunk * 0.08], crownDeep = Math.min(R * 1.6, fork[1] - low), masses = [], limbs = [];
    // THREE TIERS like the elm's own: the upper the broadest, the lowest the smallest; each a ring of rounded
    // leaf masses round the trunk's line produced, with air between the tiers; a limb to each tier's ring
    const a0 = rng() * TAU, tiers = [[0.2, 1, 6], [0.55, 0.74, 5], [0.88, 0.42, 3]];
    for (const [down, wideK, n] of tiers) {
      const y = fork[1] - crownDeep * down, ring = R * wideK * 0.56;
      // (THE LEAF MASSES ARE ROUNDED AND OF UNLIKE SIZE, as the elm's: each a golden share's turn larger or smaller than
      // its neighbour, FAR.unlike of the common size, at a height of its own within FAR.heights of the crown's depth)
      for (let k = 0; k < n; k++) { const a = a0 + down * 9 + (k + rng.range(-0.25, 0.25)) / n * TAU, rad = R * wideK * rng.range(0.38, 0.48) * lerp(FAR.unlike[0], FAR.unlike[1], (k * 0.618 + down * 3.1) % 1); masses.push([fork[0] + Math.cos(a) * ring, Math.max(y + rng.range(-0.06, 0.06) * crownDeep * FAR.heights, low + rad * 0.9), fork[2] + Math.sin(a) * ring, rad, rng() * TAU, Math.min(rng.range(0.72, 0.9) * 1.12, 1)]); }
      limbs.push([fork[0] + Math.cos(a0 + down * 9) * ring, y, fork[2] + Math.sin(a0 + down * 9) * ring]);
    }
    limbs.push([fork[0], fork[1] - crownDeep * 0.9, fork[2]]);
    if (near.plumb(hx, low, top, hz) < FAR.off + R * 1.2) continue;
    out.push({ root: [hx, top + 0.6, hz], fork, limbs, masses, wide: R });
  }
  return out;
}
const FARWOOD_VERT = /* glsl */`
varying vec3 vN;
void main() { vN = normal; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const FARWOOD_FRAG = /* glsl */`
uniform vec3 uBark; varying vec3 vN;
void main() { gl_FragColor = vec4(gFog(gShade(uBark, normalize(vN), 0., .8, 1.)), 1.); }`;
async function farTreeMeshes(shared, trees, ctx) {
  // the leaf masses (the hedge's own leafy skin, no roses) and the wood: six-sided tapering limbs
  const rows = []; for (const t of trees) for (const m of t.masses) rows.push(m);
  await ctx.yield();
  const leaves = hedgeMesh(shared, rows, true); await ctx.yield(); leaves.name = 'far trees: leaves'; leaves.material.uniforms.uLeafA = { value: new THREE.Color('#14481A') }; leaves.material.uniforms.uLeafB = { value: new THREE.Color('#2C7A2A') }; leaves.material.uniforms.uRose = { value: new THREE.Color('#2C7A2A') };
  const pos = [], nor = [], idx = [], A = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3(), s = new THREE.Vector3(), t2 = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
  const limb = (a, b, ra, rb) => {
    A.fromArray(a); B.fromArray(b); d.subVectors(B, A).normalize(); s.crossVectors(d, Math.abs(d.x) < 0.8 ? X : Z).normalize(); t2.crossVectors(d, s);
    const base = pos.length / 3;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { const an = i / 6 * TAU, nx = s.x * Math.cos(an) + t2.x * Math.sin(an), ny = s.y * Math.cos(an) + t2.y * Math.sin(an), nz = s.z * Math.cos(an) + t2.z * Math.sin(an), P0 = j ? B : A, r = j ? rb : ra; pos.push(P0.x + nx * r, P0.y + ny * r, P0.z + nz * r); nor.push(nx, ny, nz); }
    for (let i = 0; i < 6; i++) { const i1 = (i + 1) % 6; idx.push(base + i, base + 6 + i, base + i1, base + i1, base + 6 + i, base + 6 + i1); }
  };
  for (const t of trees) { limb(t.root, t.fork, FAR.wood[0], FAR.wood[1]); for (const l of t.limbs) limb(t.fork, l, FAR.wood[1] * 0.8, FAR.wood[2]); }
  await ctx.yield();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const wood = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared.U, uBark: { value: new THREE.Color('#5A4634') } }, vertexShader: shared.GV + FARWOOD_VERT, fragmentShader: shared.GF + FARWOOD_FRAG }));
  wood.name = 'far trees: wood';
  return [leaves, wood];
}
// ------------------------------------------------------------------ THE RIM IS LIVING GROUND (round four; the same on every seed)
// Round the whole rim, from the overhanging turf of its last 40 m: TRAILING VINES 10 to 40 m long with leaves by
// turns to either hand, that sway; HANGING FERNS, three to five fronds from one root that bow out and hang; ROOTS
// hanging out of the turf's edge, brown and bare. Each ends at a height of its own (RIM.gap metres and less over the
// floor of law (a), or over the lane's limit where the line is near), so the rim's lower outline is uneven all
// round and nothing of it hangs below y 24: NO LAND BELOW THE RIM. A vine's whole swing and wave are counted into
// the room it asks of the lane's law.
// FLOWER STRINGS (round five; a fixed stream of their own, 'flower strings'): strings of small blossoms, white, rose
// and harebell blue, that hang out of the thinning grass from RIM.strIn metres inside the rim, RIM.strLen metres
// long, lit through; the same laws of room as the vines.
// rows: [x, top, z, length, yaw, phase, leaf (metres; 0 a bare root), kind (0 vine, 1 frond, 2 root, 3 flower string), bow, fine (1 or 0), tone]
const RIM = { vines: 430, in: [8, 40], len: [10, 40], gap: 8, ferns: 150, fernIn: [4, 30], roots: 170, rootIn: [1.5, 9], reach: 6, fine: 95, hedge: 8, strings: 260, strIn: [5, 62], strLen: [8, 30] };
export async function dealRim(P, ctx) {
  let rng = makeRng(hashSeed(FIXED + ':rim')); const out = [];
  const hang = (a, inn, want, leaf, kind, bow, yaw) => {
    const r = GARDEN.RIM_R - inn, x = Math.cos(a) * r, z = Math.sin(a) * r, top = yg(x, z);
    const len = Math.min(want, top - P.lane(x, z, RIM.reach + bow) - rng.range(0, RIM.gap));
    if (len < (kind === 2 ? 2.5 : 5)) return;
    out.push([x, top + 0.4, z, len, yaw, rng() * TAU, leaf, kind, bow, P.near.beyond(x, top - len * 0.6, z, RIM.fine) ? 0 : 1]);
  };
  for (let i = 0; i < RIM.vines; i++) { hang((i + rng.range(-0.45, 0.45)) / RIM.vines * TAU, rng.range(RIM.in[0], RIM.in[1]), lerp(RIM.len[0], RIM.len[1], Math.pow(rng(), 1.4)), rng.range(3.4, 5.4), 0, rng.range(0.4, 1.4), rng() * TAU); if (i % 10 === 9) await ctx.yield(); }
  for (let i = 0; i < RIM.ferns; i++) {
    const a = (i + rng.range(-0.45, 0.45)) / RIM.ferns * TAU, inn = rng.range(RIM.fernIn[0], RIM.fernIn[1]), n = rng.int(3, 5), want = rng.range(7, 14), turn = rng() * TAU;
    for (let k = 0; k < n; k++) hang(a, inn, want * rng.range(0.6, 1), rng.range(2.2, 3.2), 1, want * rng.range(0.25, 0.45), turn + (k + rng.range(-0.3, 0.3)) / n * TAU);
    if (i % 3 === 2) await ctx.yield();
  }
  for (let i = 0; i < RIM.roots; i++) { hang((i + rng.range(-0.45, 0.45)) / RIM.roots * TAU, rng.range(RIM.rootIn[0], RIM.rootIn[1]), rng.range(3, 11), 0, 2, rng.range(0.3, 1.6), rng() * TAU); if (i % 10 === 9) await ctx.yield(); }
  const rs = makeRng(hashSeed(FIXED + ':flower strings'));
  for (let i = 0; i < RIM.strings; i++) {
    const n0 = out.length; rng = rs;
    hang((i + rs.range(-0.45, 0.45)) / RIM.strings * TAU, rs.range(RIM.strIn[0], RIM.strIn[1]), rs.range(RIM.strLen[0], RIM.strLen[1]), rs.range(1.5, 2.4), 3, rs.range(0.2, 0.9), rs() * TAU);
    const tone = rs(); if (out.length > n0) out[n0].push(tone);
    if (i % 10 === 9) await ctx.yield();
  }
  return out;
}
// THE HANGING STRINGS (a fixed stream of their own, 'hanging strings'; the same on every seed): on the far side of the
// round, where the eye looks out over the cloud sea, STRINGS.n long flower strings hang from the meadow far down into
// the blue. They are the one thing of the meadow that hangs below the floor of law (a): named, few, and off the
// line. One hangs in every equal share of the way from the leaving to the place of the line nearest the rain, on
// the round's outer hand, STRINGS.off metres (drawn) from the line or as far as the turf reaches; its GREAT BLOOM (a
// clover's ball or a harebell's bells by turns, STRINGS.size times a common head) hangs STRINGS.under metres (drawn)
// under the line's own height there, never lower than the entry's level (the cloud sea's tops lie DECK.entry
// metres and more under that), and its string is no longer than STRINGS.len[1] and no shorter than STRINGS.len[0].
// A string is a stalk with three strings of blossom twined about it; it sways slowly with the meadow. None stands
// within STRINGS.air metres of any place of the line (its bloom's breadth and swing counted), on a sight of the
// mouth, by the last straight, or within the entry's sights (SHOWER.sights degrees of the axis from its first place).
// It returns the blooms (rows as the flowers' rows) and the strings of blossom (rows as the rim's rows).
const STRINGS = { n: 5, off: [22, 60], len: [25, 60], size: [2, 2.6], under: [4, 16], air: 8, turf: 14 };
export function dealStrings(P, rain) {
  const rng = makeRng(hashSeed(FIXED + ':hanging strings')), heads = [], vines = [], p = new THREE.Vector3(), c = LINE_LAID.fallMid;
  const d0 = P.near.metre(PLACE.leaving), d1 = P.near.level(rain.x, rain.z).d;
  for (let k = 0; k < STRINGS.n; k++) {
    const d = d0 + (k + rng.range(0.25, 0.75)) * (d1 - d0) / STRINGS.n, kind = k % 2 ? 3 : 1, size = rng.range(STRINGS.size[0], STRINGS.size[1]), under = rng.range(STRINGS.under[0], STRINGS.under[1]);
    const yaw = rng() * TAU, ph = rng() * TAU, tone = rng(), H = HEADS[kind], reach = H.R * size + HEAD_SWAY;
    let off = rng.range(STRINGS.off[0], STRINGS.off[1]);
    P.path.posAtDist(d, p);
    const ox = p.x - c[0], oz = p.z - c[1], ol = Math.hypot(ox, oz) || 1;
    while (off > STRINGS.off[0] && Math.hypot(p.x + ox / ol * off, p.z + oz / ol * off) > GARDEN.RIM_R - STRINGS.turf) off -= 1;
    const x = p.x + ox / ol * off, z = p.z + oz / ol * off, top = yg(x, z), low = Math.max(p.y - under, ENTRY.y), len = Math.min(top - low - H.D * size, STRINGS.len[1]), y0 = top - len - H.D * size;
    if (len < STRINGS.len[0] || Math.hypot(x, z) > GARDEN.RIM_R - STRINGS.turf) continue;
    if (P.near.plumb(x, y0, top, z) < STRINGS.air + reach || P.fan.on([x, y0, z], [x, top, z], reach) || segSeg([x, y0, z], [x, top, z], LAST[0], LAST[1]) < MOUTH.tube + reach) continue;
    if (Math.abs(Math.atan2(x - ENTRY.x, ENTRY.z - z)) < SHOWER.sights * DEG) continue;
    heads.push({ x, top: top + 0.6, z, len: len + 0.6, kind, size, yaw, ph, col: lin(kind === 1 ? '#E86A8E' : '#7C7BE0'), near: P.near.space(x, y0 + H.D * size * 0.5, z), great: true, string: true });
    for (let j = 0; j < 3; j++) { const a = yaw + j * TAU / 3; vines.push([x + Math.cos(a) * 0.4, top + 0.4, z + Math.sin(a) * 0.4, len * (1 - 0.14 * j), a, ph + j * 2.1, 2.6 + 0.4 * j, 3, 0.5 + 0.3 * j, 1, (tone + j * 0.37) % 1]); }
  }
  return { heads, vines };
}
const RIM_VERT = /* glsl */`
attribute vec4 iRoot, iShape; attribute vec2 iKind; attribute vec3 aPart;
varying vec3 vN; varying vec4 vV; varying float vTone;
void main() {
  // position.y: 0 (root) to 1 (tip) along the stem; aPart: x 0 the stem, 1 a leaf; y the leaf's side (-1, 1); z how
  // far out along the leaf (0 at the stem, 1 at its point). The stem hangs plumb with a slow wave in it and a bow
  // out from the root (a frond); the whole sways with the meadow, more toward the tip
  float t = position.y, L = iRoot.w, leaf = iShape.z, kind = iKind.x, bow = iKind.y, g = 1. - t;
  vec2 hd = vec2(cos(iShape.x), sin(iShape.x)), sw = gSway(iRoot.xz, iShape.y);
  vec3 c = iRoot.xyz + vec3(0., -t * L, 0.);
  c.xz += hd * bow * (1. - g * g) + vec2(-hd.y, hd.x) * sin(t * L * .22 + iShape.y) * .9 * t * step(kind, .5);
  c.xz += vec2(.8, .6) * sw.x * (1.2 + .6 * sin(iShape.y)) * t * t + vec2(-1., .15) * sin(sw.y * uShud.y) * t * L * .6;
  vec3 wd = vec3(-hd.y, 0., hd.x), p;
  if (aPart.x < .5) { p = c + wd * position.x * mix(1.3, .45, t) * (kind > 2.5 ? .4 : kind > 1.5 ? 1.5 : 1.); vN = vec3(hd.x, 0., hd.y); }
  else {
    // a leaf: to one hand of the stem, drooping; a frond's leaflets stand closer to the stem's own line
    float a = aPart.y * mix(1.25, .75, step(.5, kind)) + iShape.x * 3.;
    vec3 od = vec3(cos(a), -.55 - .25 * aPart.z, sin(a));
    p = c + od * aPart.z * leaf * (1. - .5 * t * step(.5, kind)) + vec3(0., -1., 0.) * position.x * leaf * .34 * (1. - abs(aPart.z - .45) * 1.6);
    vN = normalize(cross(od, vec3(0., 1., 0.)) + vec3(0., .4, 0.));
  }
  vV = vec4(aPart.x, aPart.z, t, kind); vTone = iShape.w;
  vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const RIM_FRAG = /* glsl */`
uniform vec3 uVineA, uVineB, uRootC; varying vec3 vN; varying vec4 vV; varying float vTone;
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float f = texture2D(uNoise, vWp.xy * .11 + vWp.z * .07).g;
  vec3 alb = vV.w > 1.5 ? uRootC * (.7 + .6 * f) : mix(uVineA, uVineB, vV.x * (.35 + .65 * vV.y) * (.6 + .8 * f));
  // a flower string: its blossoms white, rose or harebell blue (the string's own tone), paler toward their points
  if (vV.w > 2.5) alb = mix(uVineB, mix(vTone < .4 ? vec3(.9, .88, .8) : (vTone < .72 ? vec3(.82, .3, .45) : vec3(.42, .42, .85)), vec3(1.), vV.y * .35), vV.x);
  gl_FragColor = vec4(gFog(gShade(alb, N, vV.x * (vV.w > 2.5 ? .9 : .7), mix(.45, 1., vV.z), .5)), 1.);
}`;
function rimMesh(shared, rows, fine) {
  // the form: a stem ribbon of `seg` pieces and `leaves` leaves by turns to either hand, each a kite of two triangles
  const seg = fine ? 8 : 3, leaves = fine ? 8 : 4, pos = [], part = [], idx = [];
  for (let j = 0; j <= seg; j++) { pos.push(-0.5, j / seg, 0, 0.5, j / seg, 0); part.push(0, 0, 0, 0, 0, 0); }
  for (let j = 0; j < seg; j++) idx.push(j * 2, j * 2 + 1, j * 2 + 2, j * 2 + 1, j * 2 + 3, j * 2 + 2);
  for (let k = 0; k < leaves; k++) {
    const t = (k + 0.7) / (leaves + 0.2), side = k % 2 ? 1 : -1, b = pos.length / 3;
    pos.push(0, t, 0, -1, t, 0, 1, t, 0, 0, t, 0); part.push(1, side, 0, 1, side, 0.45, 1, side, 0.45, 1, side, 1);
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 3)); base.setIndex(idx);
  const n = rows.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 2);
  rows.forEach((r, i) => { a.set([r[0], r[1], r[2], r[3]], i * 4); b.set([r[4], r[5], r[6], r[10] || 0], i * 4); c.set([r[7], r[8]], i * 2); });
  const [lo, hi] = boundsOf(rows, (r) => [r[0] - 6, r[1] - r[3] - 3, r[2] - 6, r[0] + 6, r[1], r[2] + 6]);
  const mesh = new THREE.Mesh(instanced(base, { iRoot: { a, n: 4 }, iShape: { a: b, n: 4 }, iKind: { a: c, n: 2 } }, n, lo, hi), new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uVineA: { value: new THREE.Color('#2C5A2A') }, uVineB: { value: new THREE.Color('#6FB046') }, uRootC: { value: new THREE.Color('#6A4E36') } },
    vertexShader: shared.GV + RIM_VERT, fragmentShader: shared.GF + RIM_FRAG, side: THREE.DoubleSide }));
  mesh.name = fine ? 'the rim: vines, ferns, roots' : 'the far rim: vines, ferns, roots'; mesh.frustumCulled = false;
  return mesh;
}
const BEAD_VERT = /* glsl */`
attribute vec4 iA; attribute vec3 iB; varying vec3 vN;
void main() {
  // a bead lets go of the water's face, hangs under it and falls back UP into it: one plumb line, on the world clock
  float k = fract(uTime / iB.x + iB.y), hang = smoothstep(0., .32, k) * (1. - smoothstep(.6, .96, k));
  float going = smoothstep(0., .16, k) * (1. - smoothstep(.16, .32, k)) + smoothstep(.6, .78, k) * (1. - smoothstep(.78, .96, k));
  vec3 p = position * iB.z * smoothstep(0., .06, k) * (1. - smoothstep(.95, 1., k)); p.y *= 1. + .9 * going;
  p += vec3(iA.x, iA.y - iA.w * hang, iA.z);
  vN = normal; vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const BEAD_FRAG = /* glsl */`
uniform vec3 uBead; varying vec3 vN;
void main() {
  // plain bright water: the sky's light on it, a rim and a glint; it holds no picture of anything
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWp);
  float fr = pow(clamp(1. - dot(N, V), 0., 1.), 2.5);
  vec3 c = uBead * (.55 + .45 * max(dot(N, uSun), 0.)) + vec3(1.) * fr * .6 + uSunCol * pow(max(dot(N, normalize(uSun + V)), 0.), 50.) * 1.4;
  gl_FragColor = vec4(gFog(c), 1.);
}`;
function beadMesh(shared, beads) {
  const n = beads.length, a = new Float32Array(n * 4), b = new Float32Array(n * 3);
  beads.forEach((r, i) => { a.set([r[0], r[1], r[2], r[3]], i * 4); b.set([r[4], r[5], r[6]], i * 3); });
  const [lo, hi] = boundsOf(beads, (r) => [r[0], r[1] - r[3] - 1, r[2], r[0], r[1], r[2]]);
  const base = new THREE.SphereGeometry(1, 8, 5); base.deleteAttribute('uv');
  const mesh = new THREE.Mesh(instanced(base, { iA: { a, n: 4 }, iB: { a: b, n: 3 } }, n, lo, hi), new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uBead: { value: new THREE.Color('#CFEAFB') } }, vertexShader: shared.GV + BEAD_VERT, fragmentShader: shared.GF + BEAD_FRAG }));
  mesh.name = 'brook beads';
  return mesh;
}
// the rings on the water's face: where a bead lets go, and where it falls back in, a ring spreads and dies (one flat
// card per bead, lying in the face, on the bead's own clock)
const RING_VERT = /* glsl */`
attribute vec4 iA; attribute vec3 iB; varying vec2 vQ; varying float vK;
void main() { vQ = position.xz; vK = fract(uTime / iB.x + iB.y); vec3 p = vec3(iA.x, iA.y - .06, iA.z) + position * iB.z * 6.; vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`;
const RING_FRAG = /* glsl */`
varying vec2 vQ; varying float vK;
void main() {
  float r = length(vQ), a = clamp(vK / .35, 0., 1.), b = clamp(fract(vK + .07) / .35, 0., 1.);
  float ring = (1. - smoothstep(0., .09, abs(r - a * .92))) * (1. - a) + (1. - smoothstep(0., .09, abs(r - b * .92))) * (1. - b);
  if (ring < .01) discard;
  gl_FragColor = vec4(vec3(.85, .95, 1.) * ring * .55, 1.);
}`;
function ringMesh(shared, beads) {
  const n = beads.length, a = new Float32Array(n * 4), b = new Float32Array(n * 3);
  beads.forEach((r, i) => { a.set([r[0], r[1], r[2], r[3]], i * 4); b.set([r[4], r[5], r[6]], i * 3); });
  const [lo, hi] = boundsOf(beads, (r) => [r[0] - 5, r[1] - 1, r[2] - 5, r[0] + 5, r[1], r[2] + 5]);
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); base.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(instanced(base, { iA: { a, n: 4 }, iB: { a: b, n: 3 } }, n, lo, hi), new THREE.ShaderMaterial({
    uniforms: { ...shared.U }, vertexShader: shared.GV + RING_VERT, fragmentShader: shared.GF + RING_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.name = 'rings on the brook'; mesh.renderOrder = 3;
  return mesh;
}
// ------------------------------------------------------------------ THE CLOUDSCAPE under us (round four): three depths
// FAR: the deck in the skin's own law (SKIN_FRAG). MIDDLE: THE BROKEN DECK (the visit's stream): rounded heaps wider
// than tall with their tops at three depths (DECK.tops), about half the floor between them, gaps of deep blue; it
// drifts round the ball's upright axis, once in 600 s, and its lobes billow on the world clock. NEAR: THE GREATER
// HEAPS (the fixed stream 'greater heaps': the same on every seed; they stand and only billow), twelve of them, their
// tops 35 to 94 m under the level, every one wider than tall (its depth DECK.tall of its width). THE LAWS OF PLACE:
//   THE ENTRY'S SIGHTS (entryCeil): no cloud top stands higher than DECK.entry metres under any straight sight from
//   the entry's axis (its whole stretch, from DECK.back metres behind the entry point to the level entry's end)
//   through the lowest spray of the elm's crown: the elm hangs against the lower sky from every place of the axis.
//   THE LINE'S AIR: a greater heap's top lies DECK.air metres and more under every place of the line that passes
//   over it or within DECK.air metres of its outline.
//   THE BANDS: every greater heap's flat bottom lies at DECK.floor or higher, every top of the deck at DECK.tops[0]
//   or lower; the strings of birds fly in the band between (BIRDS).
//   THE SKIN: a heap's flat bottom lies no lower than where the skin still holds its width with DECK.skin metres.
// THE GREATER HEAPS BY NAME: THE TWO FLANKERS, abreast of the first place of the last straight, one to each
//   hand, their outlines DECK.flank.rim metres from the line and their tops DECK.flank.under metres under it (the
//   line passes between their burning rims); THE SUN'S HEAP, on the sun's own level bearing from the trunk's line, as far
//   beyond the trunk as the skin leaves room; THE GRAIN'S HEAP, under
//   the last straight, its top DECK.grain.under metres under the mouth's axis (the grain's gold light lies on it);
//   and SIX at even shares of a ring of DECK.ring.r metres about the upright axis and THREE on an inner ring, lower
//   (sizes and tops from the fixed stream; a place within half a width of a heap that stands already is left out).
// rows: { c: [x, y of the base, z], half, top, base, deep, moored, kind }
const DECK = { soft: [0.95, 0.6], wisp: [0.75, 0.9], tops: [-172, -190, -208], cover: 0.2, half: [26, 40], tall: 0.55, floor: -128, skin: 3, air: 15, fineTo: 45, entry: 6, back: 60,
  flank: { rim: 31, half: 46, under: 3 }, sun: { half: 50, under: 10 }, grain: { half: 40, under: 27 }, ring: { n: 6, r: 118, half: [36, 48], top: [-88, -28] }, inner: { n: 3, r: 52, half: [30, 40], top: [-104, -72] } };
export function entryCeil(x, z) {
  const E = GARDEN.ELM, kz = E.z + E.crownDz; let m = 0;
  for (let ze = ENTRY.z + DECK.back; ze >= ENTRY.z - ENTRY.level; ze -= 10) m = Math.min(m, E.crownLow * Math.hypot(x - ENTRY.x, z - ze) / Math.hypot(E.x - ENTRY.x, kz - ze));
  return m - DECK.entry;
}
// a greater heap at a place of the plan: its top is the asked one or lower, by the laws above
function greaterHeap(near, x, z, half, top, kind, more) {
  if (!(more && more.free)) top = Math.min(top, entryCeil(x, z));
  for (let i = 0; i <= near.n; i++) if (Math.hypot(near.xs[i] - x, near.zs[i] - z) < half + DECK.air) top = Math.min(top, near.ys[i] - DECK.air);
  const r = Math.hypot(x, z) + half + DECK.skin, own = top - DECK.tall * 2 * half, base = Math.max(more && more.foot !== undefined ? Math.min(own, more.foot) : own, DECK.floor, r < GARDEN.R ? -Math.sqrt(GARDEN.R * GARDEN.R - r * r) : 0);
  // (the form by the fixed line: a greater heap whose outline stands further than DECK.fineTo from every place of the
  // line is built of the coarser billows)
  let air = 1e9; for (let i = 0; i <= near.n; i++) air = Math.min(air, Math.hypot(near.xs[i] - x, Math.max(0, near.ys[i] - top), near.zs[i] - z) - half);
  return { c: [x, base, z], half, top, base, deep: top - base, moored: true, kind: kind === 'greater' && air > DECK.fineTo ? 'near' : kind, ...more };
}
export async function dealGreater(path, near, fan, ctx = null) {
  const pause = async () => { if (ctx) await ctx.yield(); };
  const out = [], rng = makeRng(hashSeed(FIXED + ':greater heaps')), E = GARDEN.ELM, p = new THREE.Vector3(), t = new THREE.Vector3();
  // the two flankers
  const dMid = path.length - MOUTH.straight; path.posAtDist(dMid, p); path.tangentAtDist(dMid, t);
  const hl = Math.hypot(t.x, t.z) || 1, off = DECK.flank.rim + DECK.flank.half;
  for (const s of [-1, 1]) { out.push(greaterHeap(near, p.x - t.z / hl * off * s, p.z + t.x / hl * off * s, DECK.flank.half, p.y - DECK.flank.under, 'flank')); await pause(); }
  // the sun's heap: on the sun's own level bearing from the trunk's line (the light the crown burns in comes from
  // there), at the furthest place inside the skin
  { const sl = Math.hypot(GARDEN.SUN[0], GARDEN.SUN[2]), dx = GARDEN.SUN[0] / sl, dz = GARDEN.SUN[2] / sl, h = DECK.sun.half; let far = 60;
    while (Math.hypot(E.x + dx * (far + 5), E.z + dz * (far + 5)) + h + DECK.skin < Math.sqrt(GARDEN.R * GARDEN.R - DECK.floor * DECK.floor)) far += 5;
    out.push(greaterHeap(near, E.x + dx * far, E.z + dz * far, h, E.crownLow - DECK.sun.under, 'greater')); }
  await pause();
  // the grain's heap: under the last straight's middle
  out.push(greaterHeap(near, MOUTH.x, MOUTH.z + MOUTH.straight / 2, DECK.grain.half, MOUTH.y - DECK.grain.under, 'greater', { gold: true }));
  // six at even shares of the ring; one that would stand within its own half width of a named heap's outline is left out
  // (and three on an inner ring, lower: the middle of the floor; a ring's heaps keep off every heap that stands already)
  // (the towers stand before the rings are shared out: a ring's heap keeps off a tower as off a named heap)
  await pause();
  // (the rain's heap stands before the towers are dealt: no tower stands half in it)
  const rain = rainHeap(near), towers = await dealTowers(path, near, out.concat([rain]), fan, pause);
  for (const ring of [DECK.ring, DECK.inner]) {
    const a0 = rng() * TAU, named = out.concat(towers);
    for (let k = 0; k < ring.n; k++) {
      const a = a0 + (k + rng.range(-0.2, 0.2)) / ring.n * TAU, half = rng.range(ring.half[0], ring.half[1]), top = rng.range(ring.top[0], ring.top[1]);
      const x = Math.cos(a) * ring.r, z = Math.sin(a) * ring.r;
      if (named.some((h) => Math.hypot(x - h.c[0], z - h.c[2]) < h.half + half * 0.5)) continue;
      out.push(greaterHeap(near, x, z, half, top, 'greater'));
      await pause();
    }
  }
  return { greater: out, towers, shoulders: await dealShoulders(near, towers, fan, pause), farSide: [rain].concat(await dealFarSide(path, near, towers, rain, fan, pause)) };
}
// THE TOWERS (a fixed stream of their own, 'towers'; the same on every seed). A RULE OF THE LINE: from the leaving to
// the last straight's first metre, in every TOWER.every metres of way, a tower of cloud stands on either hand at a
// drawn metre of that share, its axis between TOWER.off[0] and TOWER.off[1] metres (drawn) to the side of the line
// there, level; TOWER.half wide (drawn); it is taller than wide (TOWER.tall half widths) and its head rises to
// within TOWER.under metres (drawn) of the line's own height there, or as high as these laws leave it:
// THE ENTRY'S SIGHTS hold for a tower that stands ahead of the entry's first place and within TOWER.sights metres of
// the entry's axis produced (four fifths of the ball's radius: what stands farther out stands in the outer fifth,
// by the skin; the join: the cloud stands below the level and the elm hangs against clear sky); no
// tower's outline comes within DECK.air metres of any place of the line, level, unless its head is DECK.air
// metres under the line there; none stands under the elm's crown, on a sight of the mouth, by the last straight or
// half in a greater heap (it may stand over one that lies wholly under its foot, or on one whose dome holds its foot).
const TOWER = { every: 40, off: [40, 105], half: [13, 20], under: [-4, 12], tall: 3.3, sights: 200, low: 4, least: 9, sunk: 4 };
// THE ENTRY'S SIGHTS FOR A TALL CLOUD (the towers' law, asked alike of every tall cloud that is dealt): entrySees: the
// place stands ahead of the entry's first place and within TOWER.sights metres of the entry's axis produced;
// entryTop: the height its head keeps under there
const entrySees = (x, z) => z < ENTRY.z && Math.abs(x - ENTRY.x) < TOWER.sights;
function entryTop(x, z, half) {
  const E = GARDEN.ELM, kx = E.x - ENTRY.x, kz = ENTRY.z - (E.z + E.crownDz), wide = Math.atan2(E.crownZ + half, Math.hypot(kx, kz)) + TOWER.low * DEG;
  const past = Math.hypot(x - ENTRY.x, z - ENTRY.z) > Math.hypot(kx, kz) + E.crownZ && Math.abs(Math.atan2(x - ENTRY.x, ENTRY.z - z) - Math.atan2(kx, kz)) > wide;
  return past ? ENTRY.y - Math.tan(TOWER.low * DEG) * Math.hypot(x - ENTRY.x, z - ENTRY.z) : entryCeil(x, z);
}
async function dealTowers(path, near, moored, fan, pause) {
  const rng = makeRng(hashSeed(FIXED + ':towers')), out = [], p = new THREE.Vector3(), t = new THREE.Vector3(), E = GARDEN.ELM;
  const reachAt = (y) => Math.sqrt(Math.max(GARDEN.R * GARDEN.R - y * y, 0));
  const stand = (x, z, half, top) => {
    // THE ENTRY'S SIGHTS: a tower ahead of the entry's first place and within TOWER.sights metres of the entry's
    // axis produced keeps its head under the sight through the crown's lowest spray, as every
    // cloud does; only beyond the elm's own distance and off the crown's bearings (its own width counted) may it
    // rise higher: to TOWER.low degrees under the entry's level as every such place sees it
    const seen = entrySees(x, z);
    if (seen) top = Math.min(top, entryTop(x, z, half));
    for (let i = 0; i <= near.n; i++) if (Math.hypot(near.xs[i] - x, near.zs[i] - z) < half + DECK.air) top = Math.min(top, near.ys[i] - DECK.air);
    // as wide as the skin leaves it at its own head; its foot no deeper than the skin leaves that width
    const r = Math.hypot(x, z); half = Math.min(half, reachAt(top) - DECK.skin - r);
    if (half < TOWER.least) return false; if (offElm(x, z) < E.crownR + half + 6) return false;
    let base = Math.max(top - TOWER.tall * half, DECK.floor, -reachAt(r + half + DECK.skin));
    // a tower may stand over a heap that lies wholly under its foot, or ON a heap whose dome holds its whole foot
    // (its foot TOWER.sunk metres in the heap's head); never half in one
    for (const h of moored.concat(out)) {
      const off = Math.hypot(x - h.c[0], z - h.c[2]);
      if (off >= h.half + half || h.top <= base + 3) continue;
      if (off > h.half * 0.66 - half * 0.5) return false;
      base = Math.max(base, h.top - TOWER.sunk);
    }
    if (top - base < 1.6 * half) return false;
    if (fan.off([x, base, z], [x, top, z]) < half + FAN.clear + FAN.between) return false;
    if (Math.abs(x - MOUTH.x) < half + MOUTH.tube + DECK.air && z < MOUTH.z + MOUTH.straight + half && top > MOUTH.y - MOUTH.tube - DECK.air) return false;
    out.push({ c: [x, base, z], half, top, base, deep: top - base, moored: true, kind: 'tower', free: !seen }); return true;
  };
  const d0 = near.metre(PLACE.leaving), d1 = path.length - MOUTH.straight, n = Math.floor((d1 - d0) / TOWER.every);
  for (let k = 0; k < n; k++) for (const hand of [1, -1]) {
    const d = d0 + (k + rng.range(0.2, 0.8)) * TOWER.every, off = rng.range(TOWER.off[0], TOWER.off[1]), half = rng.range(TOWER.half[0], TOWER.half[1]), under = rng.range(TOWER.under[0], TOWER.under[1]);
    path.posAtDist(d, p); path.tangentAtDist(d, t); const hl = Math.hypot(t.x, t.z) || 1;
    stand(p.x - t.z / hl * off * hand, p.z + t.x / hl * off * hand, half, p.y - under);
    await pause();
  }
  return out;
}
// THE SHOULDERS (a fixed stream of their own, 'towers:shoulders'; the same on every seed): NO TOWER STANDS ALONE. About
// every tower's foot stand SHOULDER.n lower heaps, wider than tall, at even shares of the round from a drawn first
// bearing, their middles SHOULDER.off tower half widths from its axis, SHOULDER.half of its half width wide, their
// tops SHOULDER.top of the way from the tower's foot to its head, their feet on the tower's own foot (one flat base
// under the whole heap, as a cumulus has): so wide and so near that they close round the tower's foot into ONE BROAD
// HEAP, and the tower rises out of a heap of the floor. The
// laws of every greater heap hold for a shoulder (the line's air, the bands, the skin; the entry's sights as they
// hold for its own tower: a tower's shoulders stand under the ceiling that tower stands under), and
// those of a tower (not under the elm's crown, not on a sight of the mouth, not by the last straight).
const SHOULDER = { n: 4, off: [0.5, 0.9], half: [1, 1.35], top: [0.3, 0.6] };
async function dealShoulders(near, towers, fan, pause) {
  const rng = makeRng(hashSeed(FIXED + ':towers:shoulders')), out = [], E = GARDEN.ELM;
  for (const T of towers) {
    const a0 = rng() * TAU;
    for (let k = 0; k < SHOULDER.n; k++) {
      const a = a0 + (k + rng.range(-0.25, 0.25)) / SHOULDER.n * TAU, off = T.half * rng.range(SHOULDER.off[0], SHOULDER.off[1]), half = T.half * rng.range(SHOULDER.half[0], SHOULDER.half[1]);
      const x = T.c[0] + Math.cos(a) * off, z = T.c[2] + Math.sin(a) * off, h = greaterHeap(near, x, z, half, T.base + T.deep * rng.range(SHOULDER.top[0], SHOULDER.top[1]), 'shoulder', { free: T.free, foot: T.base });
      if (h.deep < half * 0.3 || offElm(x, z) < E.crownR + half + 6) continue;
      if (fan.off([x, h.base, z], [x, h.top, z]) < half + FAN.clear + FAN.between) continue;
      if (Math.abs(x - MOUTH.x) < half + MOUTH.tube + DECK.air && z < MOUTH.z + MOUTH.straight + half && h.top > MOUTH.y - MOUTH.tube - DECK.air) continue;
      out.push(h);
    }
    await pause();
  }
  return out;
}
// THE FAR SIDE OF THE ROUND (fixed streams of their own, 'far side' and 'far side:form'; the same on every seed).
// THE RAIN'S PLACE: on the level bearing away from the sun from the middle of the fall's round (the round's own side
// away from the sun lies on that bearing), as far out as the skin leaves room for the rain's whole heap. THE RAIN'S
// HEAP stands there, FARSIDE.rain.half wide, its head FARSIDE.rain.under metres under the far side's line: the
// curtain stands tall between its head and the meadow and is seen over the nearer heaps. No tower stands half in it.
// THE CLOUD SEA: from the leaving to the place of the line that stands nearest the rain, in every FARSIDE.every
// metres of way, a heap stands on the round's outer hand at a drawn metre of that share, its middle FARSIDE.off
// metres (drawn) outside the line there or as far as the skin leaves room for it, FARSIDE.half wide (drawn), wider
// than tall, its top FARSIDE.under metres (drawn) under the line there, or as low as these laws leave it: DECK.entry
// metres under the entry's level wherever it stands (from the entry all cloud lies under the level); THE ENTRY'S
// SIGHTS in full, as a tower keeps them, for a heap any part of which stands within SHOWER.sights degrees of the
// entry's axis as the entry's first place sees it (a heap further round stands beside the entry's eye); the
// line's air, the bands and the skin as every greater heap; none under the elm's crown, on a sight of the mouth or
// by the last straight; none whose middle stands in a tower or in the rain's heap (that is the heap there).
const FARSIDE = { every: 30, off: [36, 62], half: [20, 30], under: [10, 25], least: 0.5, rain: { half: 50, under: 34, broad: 40, thick: 14 } };
export function rainPlace() {
  const c = LINE_LAID.fallMid, sl = Math.hypot(GARDEN.SUN[0], GARDEN.SUN[2]), ax = -GARDEN.SUN[0] / sl, az = -GARDEN.SUN[2] / sl, R = FARSIDE.rain;
  const top = PLACE.far[1] - R.under, base = top - DECK.tall * 2 * R.half, reach = Math.sqrt(GARDEN.R * GARDEN.R - base * base) - R.half - DECK.skin;
  let out = 0; while (Math.hypot(c[0] + ax * (out + 1), c[1] + az * (out + 1)) < reach) out += 1;
  return { x: c[0] + ax * out, z: c[1] + az * out, top, out, ax, az };
}
const rainHeap = (near) => { const at = rainPlace(); return greaterHeap(near, at.x, at.z, FARSIDE.rain.half, at.top, 'rain', { free: true }); };
async function dealFarSide(path, near, towers, rain, fan, pause) {
  const rng = makeRng(hashSeed(FIXED + ':far side')), out = [], p = new THREE.Vector3(), E = GARDEN.ELM, c = LINE_LAID.fallMid;
  const d0 = near.metre(PLACE.leaving), d1 = near.level(rain.c[0], rain.c[2]).d, n = Math.floor((d1 - d0) / FARSIDE.every);
  for (let k = 0; k < n; k++) {
    const d = d0 + (k + rng.range(0.2, 0.8)) * FARSIDE.every, half = rng.range(FARSIDE.half[0], FARSIDE.half[1]), under = rng.range(FARSIDE.under[0], FARSIDE.under[1]);
    let off = rng.range(FARSIDE.off[0], FARSIDE.off[1]);
    await pause();
    path.posAtDist(d, p);
    // the outer hand: straight away from the round's middle, level; drawn in until the skin holds the whole heap
    const ox = p.x - c[0], oz = p.z - c[1], ol = Math.hypot(ox, oz) || 1, own = Math.min(p.y - under, ENTRY.y - DECK.entry) - DECK.tall * 2 * half;
    while (off > 0 && Math.hypot(p.x + ox / ol * off, p.z + oz / ol * off) + half + DECK.skin > Math.sqrt(Math.max(GARDEN.R * GARDEN.R - own * own, 0))) off -= 1;
    const x = p.x + ox / ol * off, z = p.z + oz / ol * off;
    const far = Math.hypot(x - ENTRY.x, z - ENTRY.z), inSights = Math.abs(Math.atan2(x - ENTRY.x, ENTRY.z - z)) - Math.asin(Math.min(half / far, 1)) < SHOWER.sights * DEG;
    let top = Math.min(p.y - under, ENTRY.y - DECK.entry); if (inSights) top = Math.min(top, entryTop(x, z, half));
    if (offElm(x, z) < E.crownR + half + 6 || towers.concat([rain]).some((T) => Math.hypot(x - T.c[0], z - T.c[2]) < T.half)) continue;
    const h = greaterHeap(near, x, z, half, top, 'farside', { free: true });
    if (h.deep < half * FARSIDE.least || fan.off([x, h.base, z], [x, h.top, z]) < half + FAN.clear + FAN.between) continue;
    if (Math.abs(x - MOUTH.x) < half + MOUTH.tube + DECK.air && z < MOUTH.z + MOUTH.straight + half && h.top > MOUTH.y - MOUTH.tube - DECK.air) continue;
    out.push(h);
  }
  return out;
}
// THE BROKEN DECK (the visit's stream): at each of the three depths, heaps at even shares of the round with drawn
// distances from the axis, as many as cover DECK.cover of that depth's floor inside the skin (a fuller deck in the
// heavier mood); RARE: two rain heaps that do not drift, moored over the shower's grounds (showerGrounds), their
// measures drawn from the shower's own stream (the deck is the same deck with and without the shower)
export function dealDeck(rng, fuller, rare, rShower, grounds) {
  const heaps = [];
  DECK.tops.forEach((top, k) => {
    const reach = Math.sqrt(GARDEN.R * GARDEN.R - (top - 22) * (top - 22)) - DECK.skin, mean = (DECK.half[0] + DECK.half[1]) / 2;
    const n = Math.max(3, Math.round((fuller ? 1.25 : 1) * DECK.cover * reach * reach / (mean * mean))), a0 = rng() * TAU;
    for (let i = 0; i < n; i++) {
      const half = Math.min(rng.range(DECK.half[0], DECK.half[1]), reach * 0.45), a = a0 + (i + rng.range(-0.3, 0.3)) / n * TAU + k * 0.7, r = (reach - half) * Math.sqrt(rng.range(0.04, 1));
      const deep = half * rng.range(0.5, 0.66);
      heaps.push({ c: [Math.cos(a) * r, top - deep, Math.sin(a) * r], half, top, base: top - deep, deep, moored: false, kind: 'deck' });
    }
  });
  if (rare) for (const [gx, gz] of grounds) { const half = rShower.range(30, 42), top = CLOUD.top - rShower.range(0, 4), base = top - rShower.range(36, 46); heaps.push({ c: [gx, base, gz], half, top, base, deep: top - base, moored: true, kind: 'near' }); }
  return heaps;
}
// THE FAR ROWS (the fixed stream 'far rows'): small flat heaps in three rows near the horizon, ALL ROUND the ball at
// even shares of each row (the entry's sights hold for them as for every cloud)
export function dealFarRows() {
  const rng = makeRng(hashSeed(FIXED + ':far rows')), out = [];
  for (let row = 0; row < 3; row++) {
    const r = 176 + row * 19, n = 9 + row * 2, a0 = rng() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i + rng.range(-0.3, 0.3)) / n * TAU, half = rng.range(9, 15) - row, deep = rng.range(7, 11), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const top = Math.min(CLOUD.top - 4 - row * 9 - rng.range(0, 5), entryCeil(x, z));
      out.push({ c: [x, top - deep, z], half, top, base: top - deep, deep, moored: true, kind: 'row' });
    }
  }
  return out;
}
// THE FORM OF A HEAP, right way up in the sky under us (round five: ROUNDED ALL ROUND, no flat bottom): ONE BROAD
// DOME, a lens of cloud whose under side is as round as its top; a ring of foot billows round its skirt that rest on
// the heap's base; LOBES that stand out of the dome's upper skin like the heads of a cauliflower, and buds on the
// lobes. A TOWER is a heap taller than wide: domes stacked from the base to the top, each narrower than the one
// under it and a little aside of it, each with its own lobes; its head is a cauliflower. Nothing of a heap stands
// over its top, under its base or outside its half width (the curls counted in).
// kinds: tower (the towers that rise near the line), flank and greater (the greater heaps), near (the rare shower's
// heaps), deck (the drifting deck), row (the far small rows). rows: the form's detail for the dome, how many foot
// billows, lobes and buds to a lobe, and the detail of each
// (round six: every billow's rim thins out into the air by the cloud's own law, CLOUD_FRAG, so its outline is never
// drawn by its corners: the forms are coarser than round five's and the heaps are drawn twice, body and rim. A form
// of detail 0 is a small puff: its rim begins further in. shoulder: the lower heaps about a tower's foot.)
const HEAP_FORM = {
  tower: { main: 1, foot: 4, dFoot: 1, lobes: 4, dLobe: 1, dTop: 0, buds: 0, dBud: 0 },
  flank: { main: 2, foot: 6, dFoot: 1, lobes: 9, dLobe: 1, dTop: 1, buds: 2, dBud: 0 },
  greater: { main: 2, foot: 5, dFoot: 1, lobes: 8, dLobe: 1, dTop: 1, buds: 2, dBud: 0 },
  near: { main: 2, foot: 5, dFoot: 1, lobes: 7, dLobe: 1, dTop: 1, buds: 1, dBud: 0 },
  farside: { main: 2, foot: 5, dFoot: 1, lobes: 9, dLobe: 1, dTop: 1, buds: 1, dBud: 0 },
  rain: { main: 3, foot: 6, dFoot: 1, lobes: 11, dLobe: 2, dTop: 1, buds: 1, dBud: 0 },
  shoulder: { main: 1, foot: 0, dFoot: 0, lobes: 4, dLobe: 1, dTop: 0, buds: 0, dBud: 0 },
  deck: { main: 1, foot: 4, dFoot: 0, lobes: 5, dLobe: 1, dTop: 0, buds: 0, dBud: 0 },
  row: { main: 1, foot: 0, dFoot: 0, lobes: 1, dLobe: 1, dTop: 1, buds: 0, dBud: 0 },
};
// how far a billow's curled skin may stand out from its own ball (a share of its radius: CLOUD_VERT's law), and how
// far apart a tower's puffs stand up its axis (a share of its half width)
const CURL = 0.3;
// the law of clouds: the measures of a dome's billows and of a tower's storeys (heapBalls)
// (a billow less than BILLOW.wisp of its dome is a wisp: the smallest form, all rim, no body of its own)
const BILLOW = { wisp: 0.3, first: [0.56, 0.66], fall: [0.78, 0.9], crown: [6, 16], flank: [34, 96], round: 2.39996 };
const TOWER_FORM = { storey: 0.36, levels: 9, narrow: [0.86, 1], flat: 0.7, step: [0.42, 0.62], core: 0.8, part: [0.6, 0.44, 0.3], out: [0.55, 0.7, 0.82], rim: 1, trail: 3, lean: [0.03, 0.1], least: 0.55, most: 0.86 };
// the bearing the garden's air moves on (the meadow's tremble travels the same way: gSway): the towers lean down it
const WIND = [0.8, 0.6];
export function heapBalls(h, rng) {
  const F = HEAP_FORM[h.kind] || HEAP_FORM.deck, deep = h.top - h.base, out = [];
  // every billow keeps inside the heap's half width, under its top and over its base, its curls counted in
  const add = (x, y, z, rad, sy, det) => {
    const off = Math.hypot(x - h.c[0], z - h.c[2]), room = h.half - off;
    if (room < rad * (1 + CURL)) { if (room < h.half * 0.1) return null; rad = room / (1 + CURL); }
    sy = Math.min(sy, deep / (2 * rad) - CURL); if (sy < 0.12) { rad = deep / (2 * (0.12 + CURL)); sy = 0.12; }
    const B = { x, y: clamp(y, h.base + rad * (sy + CURL), h.top - rad * (sy + CURL)), z, rad, sy, det };
    out.push(B); return B;
  };
  // THE LAW OF CLOUDS for the billows on a dome (every heap of the world): ONE CROWN BILLOW stands a little aside of
  // the dome's top, broad and flattened, sunk deep in the dome; every billow after it is SMALLER than the one before
  // (BILLOW.fall of it, drawn) and stands FURTHER DOWN the dome's flank and a golden share of the round further on:
  // so sizes run three to one and more, the small ones crowd the rim, no two of like size stand side by side at
  // one height, and nothing round stands alone on a top. A billow's buds are smaller again and hang on its outer flank.
  const lobesOn = (D, n, a0, first = BILLOW.first) => {
    let rad = D.rad * rng.range(first[0], first[1]);
    for (let k = 0; k < n; k++) {
      const crown = k === 0, a = a0 + k * BILLOW.round + rng.range(-0.35, 0.35), tilt = (crown ? rng.range(BILLOW.crown[0], BILLOW.crown[1]) : lerp(BILLOW.flank[0], BILLOW.flank[1], k / Math.max(n - 1, 1)) + rng.range(-7, 7)) * DEG, sunk = crown ? 0.62 : 0.84;
      const dx = Math.sin(tilt) * Math.cos(a), dy = Math.cos(tilt), dz = Math.sin(tilt) * Math.sin(a);
      const Lb = add(D.x + dx * D.rad * sunk, D.y + dy * D.rad * D.sy * sunk, D.z + dz * D.rad * sunk, rad, crown ? rng.range(0.66, 0.8) : rng.range(0.74, 0.95), rad > D.rad * 0.43 ? F.dLobe : rad > D.rad * BILLOW.wisp ? F.dTop : 0);
      rad *= rng.range(BILLOW.fall[0], BILLOW.fall[1]);
      if (!Lb) continue;
      for (let b = 0; b < F.buds; b++) {
        const ba = a + rng.range(-1.2, 1.2), bt = Math.max(tilt, 0.6) + rng.range(0.1, 0.7), br = Lb.rad * rng.range(0.28, 0.4) * (b ? 0.7 : 1);
        add(Lb.x + Math.sin(bt) * Math.cos(ba) * Lb.rad * 0.85, Lb.y + Math.cos(bt) * Lb.rad * Lb.sy * 0.85, Lb.z + Math.sin(bt) * Math.sin(ba) * Lb.rad * 0.85, br, 0.9, F.dBud);
      }
    }
  };
  if (h.kind === 'tower') {
    // A TOWER IS A HEAP THAT HAS GROWN UP, BY THE SAME LAW. It is a PILE OF BILLOWS, never a column of single balls:
    // at every level a body on the axis and, standing out of it, THREE billows of unlike size (TOWER_FORM.part of the
    // level's breadth), the greatest a golden share of the round further on than at the level under it, so the
    // outline swells now to one side, now to another. EVERY LEVEL IS NARROWER THAN THE ONE UNDER IT by an uneven share
    // (TOWER_FORM.narrow, drawn: now a tuck, now hardly any; never broader: nothing is broader than what carries
    // it) and stands less than its own breadth over it (TOWER_FORM.step: no neck); the axis leans down the wind a
    // little more with every level; small puffs crowd every level's rim. THE TOP IS SHEARED: the last level's body
    // and its three billows are flattened (less than TOWER_FORM.flat as tall as wide) under one flat line and drawn
    // out down the wind into wisps. So no single round thing stands on a tower's top or on a neck, and no two of
    // like size stand side by side there, whatever is drawn: a top is always a flat body, three unlike flattened
    // billows out of it and their wisps.
    const T = TOWER_FORM, nar = [], steps = []; let n = clamp(Math.round(deep / (h.half * T.storey)), 3, T.levels);
    for (let k = 0; k < n; k++) { nar.push(k ? rng.range(T.narrow[0], T.narrow[1]) : 1); steps.push(rng.range(T.step[0], T.step[1])); }
    // the levels' breadths: the first as broad as the foot allows, each next the drawn share of the one under it, all
    // scaled by one measure so that the pile is as tall as the tower (asked by halving)
    const radii = (r0) => { const r = [r0]; for (let k = 1; k < n; k++) r.push(r[k - 1] * nar[k]); return r; };
    const tall = (r) => { let y = r[0] * T.core * (0.9 + CURL); for (let k = 1; k < n; k++) y += r[k - 1] * steps[k - 1]; return y + r[n - 1] * T.core * (T.flat + CURL); };
    // (A TOWER IS NEVER A THIN STEM ON A BROAD FOOT: its first level is at least TOWER_FORM.least of its half width;
    // a tower too low for all its levels at that breadth has fewer levels: a low tower is a broad heap)
    while (n > 2 && tall(radii(T.least * h.half)) > deep) n--;
    let lo = T.least * h.half, hi = T.most * h.half; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (tall(radii(mid)) < deep) lo = mid; else hi = mid; }
    const r = radii(lo), wl = Math.hypot(WIND[0], WIND[1]), wx = WIND[0] / wl, wz = WIND[1] / wl, a0 = rng() * TAU;
    let x = h.c[0], z = h.c[2], y = h.base + r[0] * T.core * (0.9 + CURL);
    for (let k = 0; k < n; k++) {
      const last = k === n - 1, R = r[k]; let big = null;
      if (!add(x, last ? h.top : y, z, R * T.core, last ? rng.range(T.flat * 0.8, T.flat) : rng.range(0.8, 0.95), F.main)) break;
      // (a level lower than the shoulders' least reach stands inside them: only its body is built; its billows are drawn all the same)
      const inside = !last && y - h.base < deep * SHOULDER.top[0], keep = out.length;
      T.part.forEach((share, i) => {
        const a = a0 + k * BILLOW.round + i * TAU / T.part.length + rng.range(-0.4, 0.4), off = R * T.out[i], rad = R * share * rng.range(0.9, 1.08);
        const B = add(x + Math.cos(a) * off, last ? h.top : y + R * rng.range(-0.25, 0.25), z + Math.sin(a) * off, rad, last ? rng.range(T.flat * 0.8, T.flat) : rng.range(0.78, 0.95), i ? F.dTop : F.dLobe);
        if (!i) big = B;
      });
      for (let i = 0; i < T.rim; i++) { const a = rng() * TAU, rad = R * rng.range(0.16, 0.24); add(x + Math.cos(a) * R * 0.95, (last ? h.top : y) + rng.range(-0.3, 0.3) * R, z + Math.sin(a) * R * 0.95, rad, 0.85, 0); }
      if (inside) out.length = keep;
      if (last && big) {
        // the wisps the top is drawn out into, down the wind: each smaller and flatter than the last
        let tx = big.x, tz = big.z, tr = big.rad;
        for (let i = 0; i < T.trail; i++) { tx += wx * tr * 0.7; tz += wz * tr * 0.7; tr *= rng.range(0.66, 0.8); if (!add(tx, h.top, tz, tr, rng.range(0.55, 0.65), 0)) break; }
      }
      const lean = R * rng.range(T.lean[0], T.lean[1]), wob = rng.range(-0.6, 0.6);
      x += (wx * Math.cos(wob) - wz * Math.sin(wob)) * lean; z += (wz * Math.cos(wob) + wx * Math.sin(wob)) * lean; y += R * steps[k];
    }
    for (let i = 0; i < F.foot; i++) { const a = (i + rng.range(-0.3, 0.3)) / F.foot * TAU, rad = h.half * rng.range(0.3, 0.44); add(h.c[0] + Math.cos(a) * h.half * 0.45, h.base, h.c[2] + Math.sin(a) * h.half * 0.45, rad, rng.range(0.6, 0.8), F.dFoot); }
    return out;
  }
  // the dome: a lens between the heap's base and its top
  const D = add(h.c[0], (h.top + h.base) / 2, h.c[2], h.half * 0.66, 1.05, F.main);
  for (let k = 0; k < F.foot; k++) {
    const a = (k + rng.range(-0.3, 0.3)) / F.foot * TAU, rad = h.half * rng.range(0.34, 0.42);
    add(h.c[0] + Math.cos(a) * h.half * 0.56, h.base, h.c[2] + Math.sin(a) * h.half * 0.56, rad, rng.range(0.6, 0.8), F.dFoot);
  }
  if (D) lobesOn(D, F.lobes, rng() * TAU);
  return out;
}
async function cloudGeometry(heaps, rng, ctx) {
  const forms = [], balls = [];
  for (let d = 0; d < 4; d++) { forms.push(lumpGeometry(d, 'cloud' + d, 0.05)); await ctx.yield(); }
  let nv = 0, ni = 0;
  for (const h of heaps) {
    for (const B of heapBalls(h, rng)) { const g = forms[B.det]; balls.push({ g, h, ...B }); nv += g.attributes.position.count; ni += g.index.count; }
    await ctx.yield();
  }
  await ctx.yield();
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), ctr = new Float32Array(nv * 4), hp = new Float32Array(nv * 4), tone = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  await ctx.yield();
  let v = 0, e = 0;
  for (let b = 0; b < balls.length; b++) {
    const B = balls[b], p = B.g.attributes.position.array, ix = B.g.index.array, n = p.length / 3;
    for (let i = 0; i < ix.length; i++) idx[e++] = v + ix[i];
    for (let i = 0; i < n; i++, v++) {
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], nl = Math.hypot(x, y / B.sy, z);
      pos[v * 3] = B.x + x * B.rad; pos[v * 3 + 1] = B.y + y * B.rad * B.sy; pos[v * 3 + 2] = B.z + z * B.rad;
      nor[v * 3] = x / nl; nor[v * 3 + 1] = y / B.sy / nl; nor[v * 3 + 2] = z / nl;
      ctr[v * 4] = B.x; ctr[v * 4 + 1] = B.y; ctr[v * 4 + 2] = B.z; ctr[v * 4 + 3] = B.rad;
      hp[v * 4] = B.h.c[0]; hp[v * 4 + 1] = B.h.top; hp[v * 4 + 2] = B.h.c[2]; hp[v * 4 + 3] = B.h.half; tone[v * 2] = (B.h.gold ? 1 : 0) + B.det * 0.1; tone[v * 2 + 1] = B.h.base;
    }
    await ctx.yield();
  }
  for (const f of forms) f.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aC', new THREE.BufferAttribute(ctr, 4));
  g.setAttribute('aHeap', new THREE.BufferAttribute(hp, 4)); g.setAttribute('aGold', new THREE.BufferAttribute(tone, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -100, 0), 300);
  return g;
}
const CLOUD_VERT = /* glsl */`
uniform sampler2D uNoise;
attribute vec4 aC, aHeap; attribute vec2 aGold; varying vec3 vN, vLp, vBw, vHr; varying vec4 vHeap, vOwn; varying float vGold, vCurl, vRim;
void main() {
  // the curls: every billow's skin is raised into round heads and sunk into creases by the cloud's own grain (fixed
  // in the cloud; broad heads, so the skin stays round), and boils slowly on the world clock; a billow never rises
  // over its heap's top nor sinks under its base
  vec2 q = position.xz + position.y * vec2(.61, .47);
  float cell = texture2D(uNoise, q * .0068).a, c2 = texture2D(uNoise, q.yx * .0083 + .31).g;
  float curl = (cell - .45) * .3 + (c2 - .5) * .2;
  vec3 p = position + normal * aC.w * (curl + .02 * sin(uTime * .23 + position.x * .19 + position.z * .13) + .015 * sin(uTime * .31 + position.y * .37 + aC.x));
  p.y = clamp(p.y, aGold.y, aHeap.y);
  // (aGold.x: one for the grain's heap, and a tenth for every step of the billow's form: a coarser form's rim begins further in)
  float gold = step(.95, aGold.x), det = (aGold.x - gold) * 10.;
  vLp = p; vBw = mat3(modelMatrix) * normal; vHeap = aHeap; vOwn = aC; vGold = gold; vCurl = curl; vRim = mix(.5, .16, clamp(det / 2., 0., 1.));
  // (NO BALL READS AS A BALL: a billow's light is asked mostly of its HEAP'S own round at that place, so two billows
  // that meet have one tone where they meet; the heads that model the heap are the cloud's own grain, CLOUD_FRAG)
  vec3 hr = normalize((position - vec3(aHeap.x, (aGold.y + aHeap.y) * .5, aHeap.z)) * vec3(1., .6, 1.));
  vHr = mat3(modelMatrix) * hr;
  vN = normalize(mat3(modelMatrix) * mix(normal, hr, mix(.8, .62, clamp(det / 2., 0., 1.))));
  vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CAST = 24;
// a billow's own ragged rim (CLOUD_FRAG): how many of the grain's heads lie across a billow, and how deep they eat
const RAG = { heads: 0.3, deep: 0.5 };
const CLOUD_FRAG = () => BOW_GLSL + /* glsl */`
#define RAG_HEADS ${RAG.heads.toFixed(3)}
#define RAG_DEEP ${RAG.deep.toFixed(3)}
uniform vec3 uLit, uPeach, uShade, uHollow, uGoldLit, uRim, uRose, uFarTone; uniform vec4 uGrainAt, uCast[${CAST}]; uniform vec2 uCastB[${CAST}]; uniform vec2 uSoft;
varying vec3 vN, vLp, vBw, vHr; varying vec4 vHeap, vOwn; varying float vGold, vCurl, vRim;
// THE LONG SHADE OF THE HEAPS: the low sun's light comes up through the floor at its own slope; a place is in a
// heap's shade where the straight line from it toward the sun passes through that heap (its round in the plan, from
// its base to its top; a heap never shades itself here, nor one that stands in it: a tower and its shoulders are one). uCast: x, z, half width,
// top; uCastB: base, 1 where a heap stands. The shade thins out with the metres the light has come since.
float castAt(vec3 P) {
  vec2 sh = normalize(uSun.xz); float fall = uSun.y / max(length(uSun.xz), 1e-3), s = 0.;
  for (int i = 0; i < ${CAST}; i++) {
    vec4 h = uCast[i]; vec2 d = h.xy - P.xz; float along = dot(d, sh), y = P.y + along * fall;
    float within = (1. - smoothstep(h.z * .5, h.z * .95, abs(d.x * sh.y - d.y * sh.x))) * smoothstep(uCastB[i].x - 6., uCastB[i].x + 4., y) * (1. - smoothstep(h.w - h.z * .45, h.w + 1., y));
    s = max(s, within * uCastB[i].y * step(h.z + vHeap.w * .6, distance(h.xy, vHeap.xz)) * smoothstep(h.z * .2, h.z * 1.1, along) * (1. - smoothstep(h.z * 5., h.z * 10., along)));
  }
  return s;
}
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWp), w = abs(N); w /= (w.x + w.y + w.z);
  // A BILLOW'S RIM THINS OUT INTO THE AIR (round six): the cloud is thick where the sight goes in through a billow's
  // middle and thin where it only grazes it, so its shade falls off toward its rim by the angle between its skin
  // and the sight line; a slow grain of the cloud's own (fixed in it, drifting a little on the world clock) eats
  // the rim in further here and lets it stand out there, in wisps. The body of a heap is drawn solid and its rims
  // over it, thin; a small far heap is rim only: a wisp.
  float graze = clamp(dot(normalize(vBw), V), 0., 1.);
  float wisp = texture2D(uNoise, vLp.xz * .012 + vLp.y * vec2(.0071, .0113) + uTime * .0011).r, wisp2 = texture2D(uNoise, vLp.zy * .031 + vLp.x * vec2(.017, .009)).g;
  // (the grain never lets a rim stand out so far that the billow's own outline is drawn: a rim begins no nearer
  // its outline than three quarters of its own measure)
  // (EVERY BILLOW IS RAGGED BY ITS OWN MEASURE: a grain a few heads across the billow itself, fixed in it, eats its
  // rim in and lets it out, so a small billow far off has as broken an outline as a great one near: none is a ball)
  vec3 own = (vLp - vOwn.xyz) / max(vOwn.w, 1.);
  vec3 wb = abs(normalize(vBw)); wb /= (wb.x + wb.y + wb.z); vec2 at = vOwn.xz * .013;
  float rag = texture2D(uNoise, own.yz * RAG_HEADS + at).b * wb.x + texture2D(uNoise, own.zx * RAG_HEADS + at).b * wb.y + texture2D(uNoise, own.xy * RAG_HEADS + at).b * wb.z;
  float lo = max(vRim + (wisp - .4) * .5 + (wisp2 - .5) * .24 + (rag - .5) * RAG_DEEP, vRim * .75), a = smoothstep(lo, lo + uSoft.y, graze);
  // (the smallest puffs are wisps: the grain eats them through, so none stands as a disc of its own)
  a *= mix(1., smoothstep(.22, .62, wisp + wisp2 * .45) * .9, step(.45, vRim));
#if PASS == 0
  if (a < .995) discard;
#elif PASS == 1
  if (a >= .995 || a < .004) discard;
#else
  a *= uSoft.x * smoothstep(.2, .6, wisp + wisp2 * .5); if (a < .004) discard;
#endif
  // the cloud's own grain, soft: small heads on the heads (it bends the light a little; it cuts nothing away)
  float n = texture2D(uNoise, vLp.yz * .011).g * w.x + texture2D(uNoise, vLp.zx * .011).g * w.y + texture2D(uNoise, vLp.xy * .011).g * w.z;
  float cellA = texture2D(uNoise, vLp.yz * .019).a * w.x + texture2D(uNoise, vLp.zx * .019).a * w.y + texture2D(uNoise, vLp.xy * .019).a * w.z;
  // (and its billows: broad heads, by the cloud's own measure, that turn the skin toward and away from the light)
  float big = texture2D(uNoise, vLp.yz * .0043 + .21).r * w.x + texture2D(uNoise, vLp.zx * .0043 + .21).r * w.y + texture2D(uNoise, vLp.xy * .0043 + .21).r * w.z;
  float big2 = texture2D(uNoise, vLp.yz * .0051 + .63).b * w.x + texture2D(uNoise, vLp.zx * .0051 + .63).b * w.y + texture2D(uNoise, vLp.xy * .0051 + .63).b * w.z;
  vec3 Nb = normalize(N + (vec3(n, cellA, n * cellA * 2.) - .5) * .6 + (vec3(big, big2, 1. - big) - .5) * 1.5);
  // THREE TONES FROM THE LOW SUN: the side a billow turns to the sun and its under parts are warm (peach where the
  // light only grazes it, cream where it falls full); the side turned away is a cool blue grey; the hollows between
  // billows a deeper blue. A heap that stands toward the sun lays its long shade over what stands behind it.
  float nl = dot(Nb, uSun), under = smoothstep(.1, .85, -Nb.y), shd = castAt(vWp);
  float lit = max(smoothstep(-.3, .75, nl), under * .75) * (1. - .85 * shd);
  float crease = 1. - smoothstep(-.1, .05, vCurl), inward = 1. - smoothstep(-.35, .45, dot(normalize(vBw), normalize(vHr)));
  float hollow = clamp(crease * .55 + inward * .3 + (1. - smoothstep(.1, .5, cellA)) * .25 + (1. - smoothstep(.25, .55, big)) * .45, 0., 1.);
  vec3 shade = mix(uShade, uHollow, hollow) * (1. + .4 * smoothstep(-.1, .9, N.y));
  shade = mix(shade, uHollow * .92, shd * .55);
  vec3 warm = mix(uPeach, mix(uLit, uGoldLit, vGold), smoothstep(.2, .8, lit));
  vec3 c = mix(shade, warm, lit * (1. - .62 * hollow));
  c = mix(c, mix(uLit, uRose, .5), under * lit * .4);
  // THE GRAIN'S GOLD LIGHT lies on what stands near it (by place: the grain's own place and reach)
  { vec3 g = vWp - uGrainAt.xyz; float pool = exp(-dot(g, g) / (uGrainAt.w * uGrainAt.w)) * smoothstep(-.4, .6, dot(N, -normalize(g))); c += uGoldLit * pool * .6; }
  // THE BURNING RIM: where the sun stands behind the heap as the eye sees it, the outline of every billow burns
  // cream and gold (a soft broad edge, widest on the heap's own outer billows); elsewhere a billow's edge takes a
  // little of the sky's light and is only paler
  // (the rim is the HEAP'S outline, where its own round turns from the eye: a puff in front of its heap has none)
  // (and it is asked of the heap's own round far more than of the billow's: the small billows that crowd a heap's rim
  // burn together as one soft edge, none as a ring of its own)
  float edge = 1. - clamp(dot(normalize(vHr), V), 0., 1.), rim = pow(1. - clamp(dot(normalize(mix(N, normalize(vHr), .75)), V), 0., 1.), 2.5) * edge, against = max(dot(-V, uSun), 0.), a2 = against * against;
  float thin = smoothstep(.45, 1., distance(vLp.xz, vHeap.xz) / max(vHeap.w, 1.));
  // (against the low sun itself the edge is orange: the light has come the long way through the cloud)
  c += mix(uRim, vec3(1.25, .74, .3), a2 * a2 * a2) * rim * a2 * a2 * (1.5 + 1.3 * thin) + uRim * thin * a2 * .12 * (1. - lit);
  // the line the low sun draws round every billow, where its skin turns from the shade to the light: soft and warm
  float burn = smoothstep(-.3, -.05, nl) * (1. - smoothstep(.0, .4, nl));
  c += mix(uPeach, uGoldLit, .35) * burn * .36 * (1. - .6 * hollow) * (1. - shd);
  // THE FAR DEPTH: the lower a deck lies the bluer and hazier it is (by its own height: the air under the floor)
  c = mix(c, uFarTone, smoothstep(-135., -215., vWp.y) * .5);
  // THE BOW lies on the cloud that stands on its bearing (bowAt: the sight's direction alone): the lit cloud takes
  // its colours, the cloud in shade less
  { vec3 bow = bowAt(-V); float bw = max(bow.r, max(bow.g, bow.b)), k = .1 + .2 * lit; c = c * (1. - bw * k * .7) + bow * k * .9; }
#if PASS == 0
  gl_FragColor = vec4(gFog(c), 1.);
#else
  gl_FragColor = vec4(gFog(c), a);
#endif
}`;
// the heaps whose long shade lies on the cloud (castAt): CAST places, filled once the moored heaps are dealt
const castUniforms = () => ({ uCast: { value: Array.from({ length: CAST }, () => new THREE.Vector4(0, 0, 1, -999)) }, uCastB: { value: Array.from({ length: CAST }, () => new THREE.Vector2(0, 0)) } });
function setCast(cast, heaps) {
  // (the tallest first: where more heaps stand than places, the lowest are left out)
  heaps.slice().sort((a, b) => b.deep - a.deep).slice(0, CAST).forEach((h, i) => { cast.uCast.value[i].set(h.c[0], h.c[2], h.half, h.top); cast.uCastB.value[i].set(h.base, 1); });
}
// A CLOUD IS DRAWN TWICE FROM ONE FORM: its body solid (where a billow is thick to the sight), then its rims, thin,
// over everything solid. soft: a far deck or row is drawn once, rim and body thin alike (under the near rims):
// [its greatest thickness to the sight, how far in from its outline it thickens]; the cloud's grain eats it into wisps.
async function cloudMeshes(shared, heaps, rng, name, ctx, gold, cast, soft = null) {
  const col = (hex, k) => ({ value: new THREE.Color(hex).multiplyScalar(k) }), geo = await cloudGeometry(heaps, rng, ctx);
  const uniforms = { ...shared.U, ...cast, uLit: col(gold ? '#FFE6B8' : '#FFEFD2', 0.98), uPeach: col(gold ? '#FFC090' : '#FFD0A8', 0.88), uShade: col('#A6C0E4', 0.62), uHollow: col('#5F74BC', 0.42), uGoldLit: col('#FFD27A', 1.0),
    uRim: col(gold ? '#FFCB78' : '#FFDC9C', 1.2), uRose: col('#FFC0A8', 0.95), uFarTone: col('#5E86D2', 0.62), uSoft: { value: new THREE.Vector2(soft ? soft[0] : 1, soft ? soft[1] : 0.45) },
    uGrainAt: { value: new THREE.Vector4(GARDEN.GRAIN.x, GARDEN.GRAIN.y, GARDEN.GRAIN.z, 60) } };
  const pass = (k, label, order) => {
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, defines: { PASS: k }, vertexShader: shared.GV + CLOUD_VERT, fragmentShader: shared.GF + CLOUD_FRAG(), transparent: k > 0, depthWrite: k === 0 }));
    mesh.name = name + label; mesh.renderOrder = order; return mesh;
  };
  return soft ? [pass(2, '', 1)] : [pass(0, '', 0), pass(1, ': rims', 2)];
}
// ------------------------------------------------------------------ THE RAYS (a medium): broad shafts along the sun's direction
// the least distance between two straight stretches a0..a1 and b0..b1 (exact; either may be a single point)
export function segSeg(a0, a1, b0, b1) {
  const ux = a1[0] - a0[0], uy = a1[1] - a0[1], uz = a1[2] - a0[2], vx = b1[0] - b0[0], vy = b1[1] - b0[1], vz = b1[2] - b0[2], wx = a0[0] - b0[0], wy = a0[1] - b0[1], wz = a0[2] - b0[2];
  const a = ux * ux + uy * uy + uz * uz, b = ux * vx + uy * vy + uz * vz, c = vx * vx + vy * vy + vz * vz, d = ux * wx + uy * wy + uz * wz, e = vx * wx + vy * wy + vz * wz, D = a * c - b * b;
  let sc, tc;
  if (c < 1e-12) { tc = 0; sc = a < 1e-12 ? 0 : clamp(-d / a, 0, 1); }
  else if (a < 1e-12) { sc = 0; tc = clamp(e / c, 0, 1); }
  else {
    sc = D < 1e-9 ? 0 : clamp((b * e - c * d) / D, 0, 1);
    tc = (b * sc + e) / c;
    if (tc < 0) { tc = 0; sc = clamp(-d / a, 0, 1); } else if (tc > 1) { tc = 1; sc = clamp((b - d) / a, 0, 1); }
  }
  return Math.hypot(wx + sc * ux - tc * vx, wy + sc * uy - tc * vy, wz + sc * uz - tc * vz);
}
// THE SIGHTS OF THE MOUTH: from every 2 m of the line, from THE VIEW (PLACE.view, the metre at which the gaze begins
// to go to the grain: the grain's look opens there) to the crossing, the straight line to the mouth's centre.
// Together they are a fan.
// Nothing that this world deals may stand on it: FAN.clear metres and more from every sight, its own size and swing
// counted in, and one metre more for the 2 m between neighbouring eyes. By place, from the line and the mouth alone.
const FAN = { step: 2, clear: 2.5, between: 1 };
export function makeFan(path, dFrom) {
  const eyes = [], p = new THREE.Vector3(), M = [MOUTH.x, MOUTH.y, MOUTH.z];
  for (let d = dFrom; d < path.length - 0.5; d += FAN.step) { path.posAtDist(d, p); eyes.push([p.x, p.y, p.z]); }
  // the least distance from the straight stretch a..b (or the point a) to any sight
  const off = (a, b = a) => { let m = 1e9; for (let i = 0; i < eyes.length; i++) { const q = segSeg(a, b, eyes[i], M); if (q < m) m = q; } return m; };
  // the box round the whole fan: a stretch that is further from it than its reach and the margin is not asked further
  const lo = [M[0], M[1], M[2]], hi = [M[0], M[1], M[2]];
  for (const e of eyes) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], e[k]); hi[k] = Math.max(hi[k], e[k]); }
  // true where a thing of the given reach round the stretch a..b stands on the fan
  const on = (a, b, reach = 0) => {
    const m = FAN.clear + FAN.between + reach;
    for (let k = 0; k < 3; k++) if (Math.max(a[k], b[k]) < lo[k] - m || Math.min(a[k], b[k]) > hi[k] + m) return false;
    return off(a, b) < m;
  };
  return { eyes, off, on, from: dFrom };
}
// the last straight into the mouth, with the 3 m before its plane (the line the tube is drawn round)
const LAST = [[MOUTH.x, MOUTH.y, MOUTH.z + MOUTH.straight], [MOUTH.x, MOUTH.y, MOUTH.z - 1]];
// rows: { foot, top, rad, k (strength), amp (sweep, radians), period, ph, half }. BY PLACE every shaft, with its radius
// and its whole sweep, keeps RAYS.clear metres from every place of the line and stands off the fan of the mouth's
// sights and the tube round the last straight; none passes through a moored heap of cloud (the light comes up
// through the gaps). So the lens is never in a shaft and no shaft thins toward the eye.
//   broad: how many broad shafts stand; rads: their half widths, the broadest that its place allows; tries: how many
//   places of the vault are asked, in an even order; vault: the round of the vault they are asked on; apart: the
//   least distance between two shafts' axes; tube: the join's tube round the last straight; crownAir: the air a
//   broad shaft leaves round the elm's crown (the sun's heap stands between the elm and the sun: no shaft comes
//   through the crown); under: how far under the rim a shaft's foot stands on the skin
const SHAFT = { every: 24, off: 17, rad: 3.2, radFan: 5, apart: 14, least: 60, over: 3, fan: [38, 70], fanN: 7, crown: 0.5, crownN: 5, kLane: 4.5, kFan: 5, showLane: [2, 30], showFan: [-80, -50] };
const RAYS = { show: [-45, 25], clear: 2.5, grainRad: 42, under: 20, broad: 8, rads: [23, 18, 14], amp: 0.45, tries: 400, vault: 205, apart: 62, tube: 9, crownAir: 6 };
export async function dealRays(P, rng, strength, moored, ctx, rThin = makeRng(hashSeed(FIXED + ':shafts'))) {
  const S = GARDEN.SUN, out = [], N = P.near, E = GARDEN.ELM, G = GARDEN.GRAIN;
  const make = (m, rad, amp, half) => {
    // through the point m along the sun's direction: down to the skin, up to the vault
    const bq = m[0] * S[0] + m[1] * S[1] + m[2] * S[2], cq = m[0] * m[0] + m[1] * m[1] + m[2] * m[2] - 247 * 247;
    const tDown = -bq + Math.sqrt(bq * bq - cq), foot = [m[0] + S[0] * tDown, m[1] + S[1] * tDown, m[2] + S[2] * tDown];
    let len = tDown + 40, vault = false; while (len < 520) { const q = [foot[0] - S[0] * len, foot[1] - S[1] * len, foot[2] - S[2] * len]; vault = q[1] > yg(q[0], q[2]) - 4; if (vault || q[0] * q[0] + q[2] * q[2] > 240 * 240) break; len += 6; }
    const top = [foot[0] - S[0] * len, foot[1] - S[1] * len, foot[2] - S[2] * len], reach = rad + Math.sin(amp) * len;
    return { foot, top, len, rad, amp, half, reach, vault };
  };
  // its air from the line, the fan and the last straight (asked only of a shaft whose light can come in at all)
  const air = (ray) => {
    let line = 1e9; const q = [0, 0, 0], { foot, top, reach } = ray;
    for (let i = 0; i <= N.n; i++) { q[0] = N.xs[i]; q[1] = N.ys[i]; q[2] = N.zs[i]; line = Math.min(line, segSeg(foot, top, q, q)); }
    ray.clearLine = line - reach; ray.clearFan = P.fan.off(foot, top) - reach; ray.clearLast = segSeg(foot, top, LAST[0], LAST[1]) - reach;
    return ray;
  };
  // THE SHAFTS, each by a rule of the place (the same on every seed), all leaning at the low sun's slant:
  //   THE GRAIN'S SHAFT: its axis passes through the grain's middle; it does not sway; only its far half from the
  //   mouth is drawn (rayMesh), so that no part of it stands in or before the mouth or on a sight;
  //   THE BROAD SHAFTS FROM THE DECK'S GAPS: places of the vault are asked in an even order (each new one falls in
  //   the widest space the earlier ones left); a shaft stands at the first RAYS.broad of them whose light can come
  //   in under the rim (its foot on the skin RAYS.under metres and more under the rim: the sun stands low, its light
  //   comes in under the living ground) and up to that place of the vault: past every greater heap with DECK.air to spare, clear of the
  //   line, the fan and the tube, clear of the elm's crown, and RAYS.apart from every shaft before it. It is as
  //   broad as its place allows.
  // The visit's stream draws only their strengths, periods and phases, a fixed number of draws after the places stand.
  // (a tower's shoulders are not asked: each lies lower than its tower's head and within a width of it, and the tower is asked)
  const pastHeaps = (ray, air) => !moored.some((h) => h.kind !== 'shoulder' && segSeg(ray.foot, ray.top, [h.c[0], h.top, h.c[2]], [h.c[0], h.top - h.deep, h.c[2]]) < h.half + ray.rad + air);
  const ok = (ray) => ray.clearLine >= RAYS.clear && ray.clearFan >= FAN.clear + FAN.between && ray.clearLast >= RAYS.tube;
  await ctx.yield();
  const own = air(make([G.x, G.y, G.z], RAYS.grainRad, 0, true)); own.k = 3.2; out.push(own);
  await ctx.yield();
  const crown = [E.x, (E.crownTop + E.crownLow) / 2, E.z + E.crownDz], crownR = Math.max(E.crownR, E.crownZ), broad = [];
  for (let i = 0; i < RAYS.tries && broad.length < RAYS.broad; i++) {
    // the even order: the two plastic shares of the count (each new place in the widest space left)
    const r = RAYS.vault * Math.sqrt((0.5 + i * 0.7548776662) % 1), a = TAU * ((0.5 + i * 0.5698402910) % 1), x = r * Math.cos(a), z = r * Math.sin(a);
    for (const rad of RAYS.rads) {
      const ray = make([x, yg(x, z) - 8, z], rad, RAYS.amp * DEG, false);
      if (!ray.vault || ray.foot[1] > GARDEN.RIM_Y - RAYS.under || !ok(air(ray)) || !pastHeaps(ray, DECK.air)) continue;
      if (segSeg(ray.foot, ray.top, crown, crown) < crownR + ray.reach + RAYS.crownAir) continue;
      if (out.some((o) => segSeg(ray.foot, ray.top, o.foot, o.top) < RAYS.apart)) continue;
      ray.k = 1.9; out.push(ray); broad.push(ray); break;
    }
    await ctx.yield();
  }
  for (const ray of out) { ray.k *= strength * rng.range(0.75, 1); ray.period = rng.range(24, 44); ray.ph = rng() * TAU; }
  // THE THIN SHAFTS (round six), each by a rule of the place (the same on every seed; their strengths, periods and
  // phases from a stream of their own, 'shafts'). A thin shaft keeps the line's air, the fan and the tube as every
  // shaft does; its light comes in under the rim (RAYS.under); and NO PART OF IT THAT SHOWS LIES IN A MOORED HEAP:
  // where its line passes through heaps on its way up, its light comes on only over the last of them (it stands
  // out over the cloud's top, as the light comes over it).
  //   BETWEEN THE STEMS: where the line runs under the flower heads (underStretch) a shaft stands at every
  //   SHAFT.every metres of way on the right hand (the side of the sun), and on the left where the line's air
  //   allows, its axis through the place SHAFT.off metres to the side at the floor of law (a): light that comes up
  //   through the meadow, plain to see among the stalks;
  //   THE FAN BEFORE THE GRAIN: shafts through the places of two rounds about the first place of the last straight,
  //   square to the sun's direction (SHAFT.fan metres out, at even shares): as the last third flies toward the sun
  //   they stand out from behind the grain like the spokes of a wheel, over the cloud tops;
  //   THROUGH THE ELM'S CROWN: shafts through places of a round about the crown's middle (SHAFT.crown of its width,
  //   at even shares): they come up through the gaps of the crown.
  // show: the heights between which a shaft's light comes on (the fan's from the cloud tops up)
  const thin = [];
  // the greatest height at which a shaft's line lies in a moored heap (asked at every 5 m of it), or null
  const lastHeap = (ray) => {
    let top = null;
    for (let d = 0; d <= ray.len; d += 5) {
      const f = d / ray.len, x = lerp(ray.foot[0], ray.top[0], f), y = lerp(ray.foot[1], ray.top[1], f), z = lerp(ray.foot[2], ray.top[2], f);
      if (moored.some((h) => Math.hypot(x - h.c[0], z - h.c[2]) < h.half + ray.rad && y < h.top + 2 && y > h.base - 2)) top = y;
    }
    return top;
  };
  const put = (m, rad, show, k) => {
    const ray = make(m, rad, RAYS.amp * DEG, false);
    if (ray.foot[1] > GARDEN.RIM_Y - RAYS.under || ray.len < SHAFT.least || !ok(air(ray)) || thin.some((o) => segSeg(ray.foot, ray.top, o.foot, o.top) < SHAFT.apart)) return false;
    const over = lastHeap(ray); ray.k = k; ray.thin = true; ray.m = m; ray.show = over === null || over + SHAFT.over < show[0] ? show : [over + SHAFT.over, over + SHAFT.over + show[1] - show[0]]; thin.push(ray); return true;
  };
  const us = underStretch(P), p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let d = us[0] + SHAFT.every / 2; d < us[1]; d += SHAFT.every) {
    P.path.posAtDist(d, p); P.path.tangentAtDist(d, t); const hl = Math.hypot(t.x, t.z) || 1;
    for (const hand of [1, -1]) { if (put([p.x - t.z / hl * SHAFT.off * hand, LANE.floor, p.z + t.x / hl * SHAFT.off * hand], SHAFT.rad, SHAFT.showLane, SHAFT.kLane)) { thin[thin.length - 1].lane = hand; thin[thin.length - 1].metre = d; } await ctx.yield(); }
  }
  {
    const Sv = new THREE.Vector3(S[0], S[1], S[2]), e1 = new THREE.Vector3().crossVectors(Sv, new THREE.Vector3(1, 0, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(Sv, e1).normalize();
    const round = async (c, r, n, a0, rad, show, k) => { for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, cx = Math.cos(a) * r, sx = Math.sin(a) * r; put([c[0] + e1.x * cx + e2.x * sx, c[1] + e1.y * cx + e2.y * sx, c[2] + e1.z * cx + e2.z * sx], rad, show, k); await ctx.yield(); } };
    for (let j = 0; j < SHAFT.fan.length; j++) await round(LAST[0], SHAFT.fan[j], SHAFT.fanN, j * Math.PI / SHAFT.fanN, SHAFT.radFan, SHAFT.showFan, SHAFT.kFan);
    await ctx.yield();
    await round(crown, E.crownR * SHAFT.crown, SHAFT.crownN, 0, SHAFT.rad, SHAFT.showFan, SHAFT.kFan);
  }
  for (const ray of thin) { ray.k *= strength * rThin.range(0.75, 1); ray.period = rThin.range(24, 44); ray.ph = rThin() * TAU; out.push(ray); }
  return out;
}
// the pools of light on the vault: the shared shading is told where the shafts stand (their feet, widths, sweeps)
function setPools(shared, rays) {
  const U = shared.U, list = rays.filter((r) => !r.half && !r.thin).slice(0, U.uPool.value.length);
  list.forEach((r, i) => { U.uPool.value[i].set(r.foot[0], r.foot[1], r.foot[2], r.rad); U.uPoolSw.value[i].set(r.amp, r.period, r.ph, 1); });
}
const RAY_VERT = /* glsl */`
uniform vec3 uSun; attribute vec3 aFoot; attribute vec4 aRay, aSw; varying vec3 vN; varying vec4 vRay; varying vec2 vShow;
void main() {
  // each shaft sways a few degrees to and fro about its foot on the world clock
  float ang = aSw.x * sin(uTime * 6.2831853 / aSw.y + aRay.w), c = cos(ang), s = sin(ang);
  vec3 ax = normalize(cross(uSun, vec3(0., 1., 0.))), d = position - aFoot;
  vec3 p = aFoot + d * c + cross(ax, d) * s + ax * dot(ax, d) * (1. - c);
  vN = normal; vRay = aRay; vShow = aSw.zw; vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const RAY_FRAG = /* glsl */`
uniform vec3 uRay; varying vec3 vN; varying vec4 vRay; varying vec2 vShow;
void main() {
  vec3 V = cameraPosition - vWp; float dist = length(V);
  // A SHAFT IS SOFT AND WIDE, NEVER A BAND: its light is strongest along its middle and falls away to nothing well
  // inside its outline; it comes on slowly from its foot and is gone before its head; and BY PLACE it shows in the
  // haze under the hanging land: under the level it thins into the clear sky (the height of the place alone)
  float edge = pow(abs(dot(normalize(vN), V / max(dist, 1e-3))), 4.);
  float streak = .9 + .1 * sin(vRay.y * 18.849556 + vRay.w * 3. + uTime * .05);
  float ends = smoothstep(0., .3, vRay.x) * (1. - smoothstep(.6, 1., vRay.x)) * smoothstep(vShow.x, vShow.y, vWp.y);
  // kept off the line by place: the lens is never in it, so nothing here asks how far the eye is
  gl_FragColor = vec4(uRay * (vRay.z * edge * streak * ends * .5), 1.);
}`;
async function rayMesh(shared, rays, color, ctx) {
  const pos = [], nor = [], foot = [], ray = [], sw = [], idx = [], S = new THREE.Vector3().fromArray(GARDEN.SUN);
  const e1 = new THREE.Vector3().crossVectors(S, new THREE.Vector3(1, 0, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(S, e1).normalize();
  // the side of a shaft's wall that is toward the mouth's side of the grain (across the sun's direction)
  const m0 = new THREE.Vector3(0, 0, 1).addScaledVector(S, -S.z).normalize();
  for (const r of rays) {
    // (a thin shaft's wall has fewer staves and rings; show: the heights between which its light comes on)
    const base = pos.length / 3, wall = [], within = [], NA = r.thin ? 10 : 24, NL = r.thin ? 6 : 12, show = r.show || RAYS.show;
    // a ring of the wall that is not wholly inside the skin has no light, and the light grows from the first ring
    // that is (so no shaft is seen cut by the skin)
    for (let j = 0; j <= NL; j++) {
      const t = j / NL, rad = r.rad * (0.8 + 0.2 * t) + 2; let ok = true;
      for (let i = 0; i < NA && ok; i++) { const a = i / NA * TAU, x = lerp(r.foot[0], r.top[0], t) + (e1.x * Math.cos(a) + e2.x * Math.sin(a)) * rad, y = lerp(r.foot[1], r.top[1], t) + (e1.y * Math.cos(a) + e2.y * Math.sin(a)) * rad, z = lerp(r.foot[2], r.top[2], t) + (e1.z * Math.cos(a) + e2.z * Math.sin(a)) * rad; ok = x * x + y * y + z * z < 244 * 244; }
      within.push(ok);
    }
    for (let j = 0; j <= NL; j++) for (let i = 0; i <= NA; i++) {
      const a = i / NA * TAU, t = j / NL, nx = e1.x * Math.cos(a) + e2.x * Math.sin(a), ny = e1.y * Math.cos(a) + e2.y * Math.sin(a), nz = e1.z * Math.cos(a) + e2.z * Math.sin(a);
      const rad = r.rad * (0.8 + 0.2 * t);
      // a half shaft is its far wall only: nothing on the mouth's side, growing to full strength round the back
      const hw = r.half ? smoothstep(0.05, 0.7, -(nx * m0.x + ny * m0.y + nz * m0.z)) : 1, w = hw * (within[j] && within[Math.max(0, j - 1)] && (j === NL || within[j + 1] || t > 0.5) ? 1 : 0);
      if (j === 0) wall.push(hw);
      pos.push(lerp(r.foot[0], r.top[0], t) + nx * rad, lerp(r.foot[1], r.top[1], t) + ny * rad, lerp(r.foot[2], r.top[2], t) + nz * rad);
      nor.push(nx, ny, nz); foot.push(r.foot[0], r.foot[1], r.foot[2]); ray.push(t, i / NA, r.k * w, r.ph); sw.push(r.amp, r.period, show[0], show[1]);
    }
    for (let j = 0; j < NL; j++) for (let i = 0; i < NA; i++) { if (wall[i] === 0 && wall[i + 1] === 0) continue; const a = base + j * (NA + 1) + i, b = a + NA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFoot', new THREE.Float32BufferAttribute(foot, 3)); g.setAttribute('aRay', new THREE.Float32BufferAttribute(ray, 4)); g.setAttribute('aSw', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 300);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared.U, uRay: { value: new THREE.Color(color) } }, vertexShader: shared.GV + RAY_VERT, fragmentShader: shared.GF + RAY_FRAG,
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.name = 'the rays'; mesh.renderOrder = 5;
  return mesh;
}
// ------------------------------------------------------------------ POLLEN AND SEEDS drifting UP (a medium)
// Each mote has a column of its own in the world, beside the route's line. ITS SOURCE IS THE HANGING MEADOW: a column
// begins no lower than MOTE.under metres under the lowest height a hanging thing may reach (law (a)), among the
// heads and blades it comes from, and rises to the turf; there is none in the open sky under the level.
// BY PLACE no column stands within the tube
// round the last straight (nor the 3 m before the mouth's plane), in the grain, in the elm's crown or in the turf.
const MOTE = { sway: 0.6, body: 2, keep: 6, under: 4 };
export async function dealMotes(P, rng, count, ctx) {
  const out = [], p = new THREE.Vector3(), G = GARDEN.GRAIN, N = P.near;
  for (let i = 0; i < count; i++) {
    if (i % 12 === 11) await ctx.yield();
    const d = rng() * P.path.length, a = rng() * TAU, r = Math.sqrt(rng()) * 48, span = rng.range(18, 40), dy = rng.range(-28, 16), seedKind = rng.chance(0.14);
    const rise = rng.range(1, 3), ph = rng(), size = seedKind ? rng.range(0.45, 0.8) : rng.range(0.1, 0.26);
    P.path.posAtDist(d, p); const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    if (Math.abs(x - MOUTH.x) < MOUTH.tube + 1.5 && z < MOUTH.z + MOUTH.straight + 4) continue;
    if (Math.hypot(x - G.x, z - G.z) < G.body + G.spine + 1.5 || offElm(x, z) < GARDEN.ELM.crownR + 2 || x * x + z * z > 225 * 225 || overHeap(P.moored, x, z, 3)) continue;
    const y0 = Math.max(p.y + dy, LANE.floor - MOTE.under), y1 = Math.min(y0 + span, yg(x, z) - 3);
    if (y1 - y0 < 8) continue;
    // not on a sight of the mouth: the whole column, its sway (0.6 m) and its size counted in
    if (P.fan.on([x, y0, z], [x, y1, z], MOTE.sway + size)) continue;
    // BY PLACE every column keeps MOTE.keep metres, its size and its sway from every place of the line, so that no
    // mote is ever a pale disc before the lens (a parachute seed is a body: 2 m and its size are its law; it keeps
    // the same greater distance)
    if (N.plumb(x, y0, y1, z) < (seedKind ? Math.max(MOTE.body, MOTE.keep) : MOTE.keep) + size + MOTE.sway) continue;
    out.push([x, y0, z, rise, ph, size, y1 - y0, seedKind ? 1 : 0]);
  }
  return out;
}
// the elm's leaves that let go singly and fall UP past the trunk to the turf (a fixed stream: the tree's own). BODIES
// (round four): each column keeps MOTE.body metres and its size and sway from every place of the line and stands
// off the fan of the mouth's sights; no leaf thins toward the eye
export function dealLeavesUp(P) {
  const rng = makeRng(hashSeed(FIXED + ':leaves falling up')), E = GARDEN.ELM, out = [];
  for (let i = 0; i < 30; i++) {
    const a = rng() * TAU, r = rng.range(4, 19), y0 = rng.range(E.crownTop - 22, E.crownTop + 4), x = E.x + Math.cos(a) * r, z = E.z + Math.sin(a) * r;
    const rise = rng.range(2.4, 4.6), ph = rng(), size = rng.range(0.8, 1.15), span = yg(x, z) - 2 - y0;
    if (P.near.plumb(x, y0, y0 + span, z) < MOTE.body + size + MOTE.sway || P.fan.on([x, y0, z], [x, y0 + span, z], size + MOTE.sway)) continue;
    out.push([x, y0, z, rise, ph, size, span, 0]);
  }
  return out;
}
// THE LEAF-FALL OF THE FLANK (a fixed stream of its own): leaves that let go of the crown's outer side and drift UP
// beside it to the turf; BODIES: each column keeps 2 m and its size and sway from every place of the line
export function dealLeafFall(P) {
  const rng = makeRng(hashSeed(FIXED + ':leaf-fall of the flank')), E = GARDEN.ELM, out = [];
  for (let i = 0; i < 16; i++) {
    const a = rng() * TAU, r = rng.range(2, 8), y0 = rng.range(E.crownLow + 4, E.crownTop - 10), x = E.x + Math.cos(a) * (E.crownR + r), z = E.z + E.crownDz + Math.sin(a) * (E.crownZ + r), size = rng.range(0.8, 1.15), rise = rng.range(2.2, 4), ph = rng();
    const span = yg(x, z) - 2 - y0;
    if (P.near.plumb(x, y0, y0 + span, z) < MOTE.body + size + MOTE.sway || P.fan.on([x, y0, z], [x, y0 + span, z], size + MOTE.sway)) continue;
    out.push([x, y0, z, rise, ph, size, span, 0]);
  }
  return out;
}
// PETALS FALLING UP (the visit's stream 'petals'): from the long-stalked heads of the sky stretch to the turf, slowly
// turning; BODIES: each column keeps 2 m and its size and sway from every place of the line and stands off the fan
// (law (e)'s heads have no seed heads' petals)
export function dealPetals(P, flowers, rng) {
  const out = [];
  for (const f of flowers) if (f.sky && f.kind !== 4) for (let k = 0; k < 3; k++) {
    const a = rng() * TAU, r = rng.range(0.5, 2.5), x = f.x + Math.cos(a) * r, z = f.z + Math.sin(a) * r, y0 = f.top - f.len - rng.range(0, 2), size = rng.range(0.3, 0.5), rise = rng.range(0.9, 1.8), ph = rng();
    const span = yg(x, z) - 3 - y0;
    if (span < 10 || P.near.plumb(x, y0, y0 + span, z) < MOTE.body + size + MOTE.sway || P.fan.on([x, y0, z], [x, y0 + span, z], size + MOTE.sway)) continue;
    out.push([x, y0, z, rise, ph, size, span, 0]);
  }
  return out;
}
// ------------------------------------------------------------------ THE RIVER OF POLLEN in the grain's country
// From the grain a drift of pollen streams away and up to the roof: A RIBBON 15 to 25 m wide and over 200 m long.
// ITS MIDDLE IS LAID BY PLACE: it leaves the grain's west flank and runs back BESIDE THE MOUTH'S AXIS, RIVER.side
// metres to the west of it (the side away from every sight of the line to the mouth: the line comes round to its
// last straight from the east) and RIVER.over metres over it, rising RIVER.rise metres more with every metre back,
// for RIVER.run metres; then it leaves the axis on the bearing straight away from the elm's trunk line and climbs to
// the roof at RIVER.climb (the upper course, a rule of the place). So the last straight flies ALONG it: the river runs ahead on the left hand
// to the grain. ITS WIDTH IS BOUND BY PLACE at every 2 m of its length: the whole cross-section (a mote's size and
// wander counted in) keeps RIVER.air metres from every place of the line (so it never enters the tube of the last
// 60 m), stands off the fan of the mouth's sights, outside the entry's sights to the grain and the elm (but for its
// root: the first RIVER.root metres from the grain's middle are the grain's own, like its spines and its dust), and
// clear of the elm's crown; where a law binds, the ribbon narrows. In it: thousands of gold motes of unlike size
// moving along it from the grain to the roof on the world clock (a medium), and the bodied grains (small gold
// balls with spines, a tenth of the great grain's size and smaller, each turning in a place of its own).
const RIVER = { side: 30, over: 8, rise: 0.1, run: 96, root: 34, climb: 0.95, step: 22, under: 8, half: 10, thick: 3, air: 9, wander: 0.6, size: [0.25, 1.1], puff: [2.5, 6], puffs: 0.07, N: 32 };
const POLLEN = { clear: 2, bee: 6, great: 1.8 };
export async function makeRiver(P, ctx) {
  const G = GARDEN.GRAIN, E = GARDEN.ELM, L = P.path.length, p = new THREE.Vector3(), ax = new THREE.Vector3(), ctl = [];
  // beside the mouth's axis produced back from the line's end: its west is the left hand of the heading there
  P.path.posAtDist(L, p); P.path.tangentAtDist(L, ax); const al = Math.hypot(ax.x, ax.z) || 1, wx = ax.z / al, wz = -ax.x / al;
  // (its first place: the grain's flank on the river's side, at the spines' tips, RIVER.over metres over the grain's middle)
  ctl.push(new THREE.Vector3(G.x + wx * (G.body + 2 * G.spine), G.y + RIVER.over, G.z + wz * (G.body + 2 * G.spine)));
  for (let back = 22; back <= RIVER.run; back += (RIVER.run - 22) / 4) ctl.push(new THREE.Vector3(p.x - ax.x / al * back + wx * RIVER.side, p.y + RIVER.over + RIVER.rise * back, p.z - ax.z / al * back + wz * RIVER.side));
  // THE UPPER COURSE, by a rule of the place (round four): from the end of the run the river leaves the axis ON THE
  // BEARING STRAIGHT AWAY FROM THE ELM'S TRUNK LINE (it flows from the grain away from the tree, out over the far
  // meadow) and climbs RIVER.climb metres for every level metre, a place every RIVER.step metres, until it stands
  // RIVER.under metres under the turf
  { const e = ctl[ctl.length - 1], bx = e.x - E.x, bz = e.z - E.z, bl = Math.hypot(bx, bz) || 1;
    for (let d = RIVER.step; d < 400; d += RIVER.step) {
      const x = e.x + bx / bl * d, z = e.z + bz / bl * d, y = e.y + RIVER.climb * d, roof = yg(x, z) - RIVER.under;
      if (y >= roof || x * x + z * z > GARDEN.RIM_R * GARDEN.RIM_R) { let lo = d - RIVER.step, hi = d; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (e.y + RIVER.climb * m >= yg(e.x + bx / bl * m, e.z + bz / bl * m) - RIVER.under) hi = m; else lo = m; } ctl.push(new THREE.Vector3(e.x + bx / bl * lo, e.y + RIVER.climb * lo, e.z + bz / bl * lo)); break; }
      ctl.push(new THREE.Vector3(x, y, z));
    } }
  await ctx.yield();
  const curve = new THREE.CatmullRomCurve3(ctl, false, 'centripetal'), len = curve.getLength(), pts = [], t = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), q = [0, 0, 0];
  const frame = (s) => { curve.getPointAt(s, p); curve.getTangentAt(s, t); side.crossVectors(t, Y).normalize(); up.crossVectors(side, t); };
  // whether a place of the ribbon is lawful for a thing of a given reach
  const lawful = (x, y, z, reach) => P.near.space(x, y, z) >= RIVER.air + reach && !P.fan.on([x, y, z], [x, y, z], reach) && (Math.hypot(x - G.x, y - G.y, z - G.z) < RIVER.root || !keptOut(x, y, z, reach))
    && !(y < E.crownTop + 4 && y > E.crownLow - 4 && offElm(x, z) < E.crownR + 2 + reach) && Math.hypot(x - G.x, y - G.y, z - G.z) > G.body + G.spine + 1 + reach && yg(x, z) - y > 6;
  const reach = RIVER.size[1] + RIVER.wander, halfAt = (s) => {
    frame(s); let w = RIVER.half * (0.55 + 0.45 * smoothstep(0, 0.12, s)) * (1 - 0.35 * smoothstep(0.8, 1, s));
    for (let k = 0; k < 14; k++) {
      let ok = true;
      for (const u of [-1, 0, 1]) for (const v of [-1, 1]) { const x = p.x + side.x * u * w + up.x * v * RIVER.thick, y = p.y + side.y * u * w + up.y * v * RIVER.thick, z = p.z + side.z * u * w + up.z * v * RIVER.thick; if (!lawful(x, y, z, reach)) ok = false; }
      if (ok) return w; w *= 0.8;
    }
    return 0;
  };
  // the ribbon's middle at RIVER.N even steps, each with the least lawful half width of its neighbourhood
  const fine = Math.ceil(len / 2), ws = [];
  for (let i = 0; i <= fine; i++) { ws.push(halfAt(i / fine)); if (i % 2 === 1) await ctx.yield(); }
  await ctx.yield();
  for (let i = 0; i < RIVER.N; i++) {
    const s = i / (RIVER.N - 1), k0 = Math.floor(Math.max(0, s - 1 / (RIVER.N - 1)) * fine), k1 = Math.ceil(Math.min(1, s + 1 / (RIVER.N - 1)) * fine); let w = 1e9;
    for (let k = k0; k <= k1; k++) w = Math.min(w, ws[k]);
    curve.getPointAt(s, p); pts.push([p.x, p.y, p.z, w]);
  }
  // a place of the ribbon as the shader lays it: straight between the even steps
  const at = (s, u, v, out) => {
    const f = clamp(s, 0, 0.9999) * (RIVER.N - 1), i = Math.floor(f), k = f - i, a = pts[i], b = pts[i + 1];
    t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); side.crossVectors(t, Y).normalize(); up.crossVectors(side, t);
    const w = lerp(a[3], b[3], k);
    out[0] = lerp(a[0], b[0], k) + side.x * u * w + up.x * v * RIVER.thick; out[1] = lerp(a[1], b[1], k) + side.y * u * w + up.y * v * RIVER.thick; out[2] = lerp(a[2], b[2], k) + side.z * u * w + up.z * v * RIVER.thick;
    return out;
  };
  return { pts, len, at, lawful, q };
}
// THE BODIED GRAINS of the river (rows: { c, size, loop, reach, ph, rate, tilt, side }): each in a place of its own in
// the ribbon, thickest near the grain; side: which side of the ribbon's middle it stands on
export async function dealPollen(P, rng, count, ctx) {
  const out = [], R = P.river, c0 = [0, 0, 0];
  for (let tries = 0; out.length < count && tries < count * 14; tries++) {
    if (ctx && tries % 6 === 5) await ctx.yield();
    const s = 0.02 + 0.6 * Math.pow(rng(), 1.7), ang = rng() * TAU, rad = Math.sqrt(rng()) * 0.8, u = Math.cos(ang) * rad, v = Math.sin(ang) * rad, size = GARDEN.GRAIN.body * rng.range(0.035, 0.1), loop = rng.range(0.3, 0.8);
    const c = R.at(s, u, v, c0).slice(), reach = size * 1.3 + loop * 1.2, ph = rng() * TAU, rate = rng.range(0.12, 0.3) * rng.sign(), tilt = rng() * TAU;
    if (!R.lawful(c[0], c[1], c[2], reach)) continue;
    if (out.some((o) => Math.hypot(o.c[0] - c[0], o.c[1] - c[1], o.c[2] - c[2]) < o.reach + reach + 0.5)) continue;
    out.push({ c, size, loop, reach, ph, rate, tilt, side: u < 0 ? -1 : 1 });
  }
  return out;
}
// THE MOTES OF THE RIVER (a medium; the visit's stream draws each mote's place across the ribbon, its size, its pace
// and where on the ribbon it is at clock zero): each moves along the ribbon from the grain to the roof on the world
// clock and begins again, fading in and out at the ends; its size is in metres at every distance; the low sun lights
// each from the side (a small ball with a gold side and an amber side) and they wink in turn.
const RIVER_VERT = /* glsl */`
#define RN ${RIVER.N}
uniform vec4 uRiver[RN]; uniform float uThick; uniform vec3 uSun; attribute vec4 iA, iB; varying vec2 vQ; varying vec3 vSunV; varying float vFade, vWink, vPuff;
void main() {
  float s = fract(iA.x + uTime * iA.y), f = s * float(RN - 1), fi = min(floor(f), float(RN - 2)), k = f - fi; int i = int(fi);
  vec4 a = uRiver[i], b = uRiver[i + 1];
  vec3 tang = normalize(b.xyz - a.xyz), side = normalize(cross(tang, vec3(0., 1., 0.))), up2 = cross(side, tang);
  float wob = uTime * .3 + iA.w;
  vec3 c = mix(a.xyz, b.xyz, k) + side * (iB.x * mix(a.w, b.w, k) + ${RIVER.wander.toFixed(2)} * .8 * sin(wob)) + up2 * (iB.y * uThick + ${RIVER.wander.toFixed(2)} * .6 * cos(wob * 1.3));
  // a mote keeps its size in metres at every distance (what must read from far is built in the world: the puffs
  // of fine dust and the strings of bodied grains)
  vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * iA.z;
  vPuff = iB.w;
  vQ = position.xy; vSunV = (viewMatrix * vec4(uSun, 0.)).xyz; vFade = smoothstep(0., .03, s) * (1. - smoothstep(.86, 1., s)) * step(.5, mix(a.w, b.w, k));
  vWink = .75 + .25 * sin(uTime * (1.3 + iB.z * 2.) + iA.w * 7.);
  vWp = c; gl_Position = projectionMatrix * mv;
}`;
const RIVER_FRAG = /* glsl */`
uniform vec3 uGold, uAmber; varying vec2 vQ; varying vec3 vSunV; varying float vFade, vWink, vPuff;
void main() {
  float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
  // a puff of the finest dust: a soft gold glow, brighter on the sun's side
  if (vPuff > .5) { float e = 1. - r2; gl_FragColor = vec4(gFog(uGold * (.7 + .5 * clamp(dot(vQ, normalize(vSunV.xy + 1e-4)), -1., 1.))), e * e * .085 * vFade); return; }
  vec3 n = vec3(vQ, sqrt(1. - r2));
  float lit = smoothstep(-.25, .7, dot(n, normalize(vSunV)));
  vec3 c = mix(uAmber, uGold * 1.3 * vWink, lit) + uGold * .8 * pow(max(dot(n, normalize(normalize(vSunV) + vec3(0., 0., 1.))), 0.), 24.);
  gl_FragColor = vec4(gFog(c), (1. - smoothstep(.55, 1., r2)) * vFade);
}`;
async function riverMesh(shared, river, count, rng, ctx) {
  const g = new THREE.InstancedBufferGeometry(), a = new Float32Array(count * 4), b = new Float32Array(count * 4);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  for (let i = 0; i < count; i++) {
    // most motes are small, a few are great; the great ones go more slowly
    // (one in fourteen is a puff of the finest dust, RIVER.puff metres in radius, that goes with the rest)
    const ang = rng() * TAU, rad = Math.sqrt(rng()), big = Math.pow(rng(), 3.6), puff = rng() < RIVER.puffs, size = puff ? lerp(RIVER.puff[0], RIVER.puff[1], rng()) : lerp(RIVER.size[0], RIVER.size[1], big) / 2, pace = (puff ? 3 : lerp(6, 2.6, big)) * rng.range(0.8, 1.2) / river.len;
    a.set([rng(), pace, size, rng() * TAU], i * 4); b.set([Math.cos(ang) * rad * (puff ? 0.6 : 1), Math.sin(ang) * rad * (puff ? 0.4 : 1), rng(), puff ? 1 : 0], i * 4);
    if (i % 256 === 255) await ctx.yield();
  }
  await ctx.yield();
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = count;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const q of river.pts) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], q[k]); hi[k] = Math.max(hi[k], q[k]); }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + RIVER.half + 4);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uRiver: { value: river.pts.map((q) => new THREE.Vector4(q[0], q[1], q[2], q[3])) }, uThick: { value: RIVER.thick }, uGold: { value: new THREE.Color('#FFC83A').multiplyScalar(1.12) }, uAmber: { value: new THREE.Color('#9A5E12') } },
    vertexShader: shared.GV + RIVER_VERT, fragmentShader: shared.GF + RIVER_FRAG, transparent: true, depthWrite: false }));
  mesh.name = 'the river of pollen'; mesh.renderOrder = 3;
  return mesh;
}
// THE GREAT BEES OF THE RIVER (POLLEN.great times a meadow bee): each works three grains that stand near one another
// ON ONE SIDE of the ribbon's middle (its own side); those grains only turn (no loop), so the bee's seats are still.
// Its whole course, its own size counted in, keeps POLLEN.bee metres from the line and stands off the fan.
export async function dealPollenBees(P, rng, pollen, count, ctx) {
  const out = [], tmp = [0, 0, 0, 0, 0];
  for (let tries = 0; out.length < count && tries < 60; tries++) {
    if (ctx && tries) await ctx.yield();
    const g0 = rng.pick(pollen), near = pollen.filter((g) => g !== g0 && !g.seat && g.side === g0.side && Math.hypot(g.c[0] - g0.c[0], g.c[1] - g0.c[1], g.c[2] - g0.c[2]) < 22);
    if (g0.seat || near.length < 2) continue;
    const three = [g0, near[0], near[near.length - 1]], seats = three.map((g) => ({ x: g.c[0], y: g.c[1], z: g.c[2], r: g.size * 1.05 + 0.45, ph: 0 }));
    const bee = { seats, a0: seats.map(() => rng() * TAU), turn: rng.range(2.4, 4.2) * rng.sign(), T: rng.range(22, 30), ph: rng() * 100, col: lin(rng.pick(['#3A2A1C', '#4A3420', '#33261C'])), still: true, size: POLLEN.great, side: g0.side };
    let m = 1e9, bad = false;
    const half = BEE.half * POLLEN.great + 0.6;
    for (let k = 0; k < BEE.legs && !bad; k++) for (let i = 0; i < 60; i++) { const q = beeLeg(bee, k, i / 60, tmp); if (keptOut(q[0], q[1], q[2], half) || P.fan.on(q, q, half)) { bad = true; break; } m = Math.min(m, P.near.space(q[0], q[1], q[2])); }
    bee.clear = m - half;
    if (bad || bee.clear < POLLEN.bee) continue;
    for (const g of three) { g.seat = true; g.loop = 0; }
    out.push(bee);
  }
  return out;
}
const POLLEN_VERT = /* glsl */`
attribute vec4 iC, iP; attribute float aPart; varying vec3 vN; varying float vPart;
vec3 turn(vec3 v, float ca, float sa, float ct, float st) { vec3 q = vec3(v.x * ca + v.z * sa, v.y, -v.x * sa + v.z * ca); return vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct); }
void main() {
  // each grain turns slowly about an axis of its own and goes round a small loop of its own, on the world clock
  float ang = uTime * iP.z + iP.x, ca = cos(ang), sa = sin(ang), ct = cos(iP.w), st = sin(iP.w);
  vec3 c = iC.xyz + iP.y * vec3(cos(uTime * .17 + iP.x), .6 * sin(uTime * .13 + iP.x * 2.), sin(uTime * .17 + iP.x));
  vec3 p = c + turn(position, ca, sa, ct, st) * iC.w;
  vN = turn(normal, ca, sa, ct, st); vPart = aPart; vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const POLLEN_FRAG = /* glsl */`
uniform vec3 uGold, uAmber, uPale; varying vec3 vN; varying float vPart;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWp);
  vec3 c = gShade(mix(uGold, uPale, vPart * .8), N, 0., 1., .6) * .7;
  c += uAmber * (.66 - .34 * dot(N, uSun));
  c += uPale * (vPart * .35 + (.12 + .7 * vPart) * pow(max(1. - abs(dot(N, V)), 0.), 2.));
  gl_FragColor = vec4(gFog(c), 1.);
}`;
function pollenMesh(shared, rows) {
  const ball = lumpGeometry(1, 'pollen', 0.03), bp = ball.attributes.position, bn = ball.attributes.normal, pos = Array.from(bp.array), nor = Array.from(bn.array), part = new Array(bp.count).fill(0), idx = Array.from(ball.index.array);
  // fourteen small spines, spread evenly over the ball
  for (let k = 0; k < 14; k++) {
    const y = 1 - (k + 0.5) / 14 * 2, r = Math.sqrt(1 - y * y), a = k * 2.39996, d = [r * Math.cos(a), y, r * Math.sin(a)], e1 = new THREE.Vector3(-d[2], 0, d[0]).normalize(), e2 = new THREE.Vector3().crossVectors(new THREE.Vector3(...d), e1), base = pos.length / 3;
    for (let j = 0; j < 3; j++) { const b = j / 3 * TAU, sx = e1.x * Math.cos(b) + e2.x * Math.sin(b), sy = e1.y * Math.cos(b) + e2.y * Math.sin(b), sz = e1.z * Math.cos(b) + e2.z * Math.sin(b); pos.push(d[0] * 0.96 + sx * 0.11, d[1] * 0.96 + sy * 0.11, d[2] * 0.96 + sz * 0.11); nor.push(sx * 0.8 + d[0] * 0.6, sy * 0.8 + d[1] * 0.6, sz * 0.8 + d[2] * 0.6); part.push(0.25); }
    pos.push(d[0] * 1.3, d[1] * 1.3, d[2] * 1.3); nor.push(d[0], d[1], d[2]); part.push(1);
    idx.push(base, base + 1, base + 3, base + 1, base + 2, base + 3, base + 2, base, base + 3);
  }
  ball.dispose();
  const g = new THREE.InstancedBufferGeometry(), n = rows.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
  rows.forEach((r, i) => { a.set([r.c[0], r.c[1], r.c[2], r.size], i * 4); b.set([r.ph, r.loop, r.rate, r.tilt], i * 4); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], r.c[k]); hi[k] = Math.max(hi[k], r.c[k]); } });
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iP', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 6);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared.U, uGold: { value: new THREE.Color('#E9B32A') }, uAmber: { value: new THREE.Color('#8A5A14').multiplyScalar(0.9) }, uPale: { value: new THREE.Color('#FFE9A6') } },
    vertexShader: shared.GV + POLLEN_VERT, fragmentShader: shared.GF + POLLEN_FRAG }));
  mesh.name = 'the stream of pollen';
  return mesh;
}
// ------------------------------------------------------------------ CREATURES: birds, bees, butterflies (all head down)
// One small shape each, head toward +Z, back toward +Y in its own frame; the world turns every one of them over so
// its feet are toward the turf. aPart: 0 the creature's own colour, 1 dark, 2 banded, 3 wing. aWing: 0 body, else the
// distance from the hinge (signed by side) of a wing vertex.
function creatureGeometry(kind) {
  const pos = [], part = [], wing = [], idx = [];
  const spindle = (z0, z1, r, ry, sides, rings, pt, cy = 0, cx = 0) => {
    const base = pos.length / 3;
    for (let j = 0; j <= rings; j++) for (let i = 0; i <= sides; i++) {
      const t = j / rings, a = i / sides * TAU, rr = r * Math.pow(Math.sin(Math.PI * clamp(t * 0.96 + 0.02, 0, 1)), 0.7);
      pos.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * ry, lerp(z0, z1, t)); part.push(pt); wing.push(0);
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) { const a = base + j * (sides + 1) + i, b = a + sides + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  };
  // a wing: a fan of points (x out from the hinge, z along the body), mirrored
  const wingOf = (pts, span, pt) => {
    for (const s of [1, -1]) {
      const base = pos.length / 3;
      for (const [x, z] of pts) { pos.push(s * x * span, 0.02, z); part.push(pt); wing.push(s * Math.max(x, 0.001)); }
      for (let i = 1; i < pts.length - 1; i++) idx.push(base, base + i, base + i + 1);
    }
  };
  if (kind === 'bird') {
    spindle(-0.42, 0.5, 0.2, 0.9, 6, 4, 0); spindle(0.36, 0.66, 0.13, 1, 5, 2, 1);
    wingOf([[0, 0.22], [0.55, 0.3], [1, 0.02], [0.6, -0.2], [0, -0.12]], 1.1, 0);
    // the tail
    const b = pos.length / 3; pos.push(0, 0.03, -0.38, 0.17, 0.03, -0.85, -0.17, 0.03, -0.85); part.push(1, 1, 1); wing.push(0, 0, 0); idx.push(b, b + 1, b + 2);
  } else if (kind === 'bee' || kind === 'laden') {
    // (a laden bee carries a basket of pollen on each hind leg: part 4, gold)
    if (kind === 'laden') for (const sx of [-1, 1]) spindle(-0.75, -0.2, 0.25, 1, 5, 2, 4, 0.34, sx * 0.5);
    spindle(-1.3, -0.1, 0.52, 0.95, 8, 5, 2); spindle(-0.2, 0.75, 0.42, 1, 7, 3, 1); spindle(0.62, 1.2, 0.3, 0.95, 6, 2, 1);
    wingOf([[0, 0.45], [0.6, 0.5], [1, 0.1], [0.75, -0.35], [0, 0.1]], 1.5, 3);
  } else {
    spindle(-0.9, 0.9, 0.12, 1, 5, 3, 1);
    wingOf([[0, 0.5], [0.5, 1.15], [0.95, 1.0], [1, 0.35], [0.6, 0.02], [0, 0]], 2.0, 0);
    wingOf([[0, 0], [0.55, -0.05], [0.8, -0.5], [0.5, -1.0], [0.15, -0.8], [0, -0.3]], 2.0, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const CREATURE_VERT = /* glsl */`
attribute float aPart, aWing; attribute vec3 iCol; attribute vec4 iFlap;
varying vec3 vN, vCol, vLp; varying float vPart;
void main() {
  vec3 p = position, n = normal;
  float fr = abs(aWing);
  if (fr > 0.) {
    // the wing beats about the body's long line (iFlap: beats a second times two pi, phase, reach, how far folded)
    float ang = mix(iFlap.z * sin(uTime * iFlap.x + iFlap.y) + .12, -1.2, iFlap.w), c = cos(ang), s = sin(ang);
    p.x *= mix(1., .45, iFlap.w); p = vec3(p.x * c, p.y + abs(p.x) * s, p.z - abs(p.x) * .5 * iFlap.w);
    n = normalize(vec3(-sign(aWing) * s, c, 0.));
  }
  vLp = position; vPart = aPart; vCol = iCol;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n); vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CREATURE_FRAG = /* glsl */`
uniform vec3 uBandC; varying vec3 vN, vCol, vLp; varying float vPart;
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vCol; float thin = 0.;
  if (vPart > .5 && vPart < 1.5) alb = vCol * .22;
  else if (vPart > 1.5 && vPart < 2.5) alb = mix(vCol * .2, uBandC, smoothstep(.35, .65, fract(vLp.z * 2.2 + .2)));
  else if (vPart > 3.5) alb = vec3(1., .7, .14);
  else if (vPart > 2.5) { alb = vec3(.75, .82, .85); thin = .9; }
  else if (vLp.y < -.02) alb = mix(vCol, vec3(.8, .78, .7), .6);
  vec3 c = gShade(alb, N, max(thin, .25), 1., 1.);
  // AGAINST THE LOW SUN every flying thing has a rim of light of its own, and the gold it carries burns
  vec3 V = normalize(cameraPosition - vWp); float ag = max(dot(-V, uSun), 0.), rim = pow(1. - abs(dot(N, V)), 2.) * (.25 + 1.6 * ag * ag);
  c += vec3(1.3, .9, .38) * rim * .7 + (vPart > 3.5 ? vec3(1.2, .72, .12) * .9 : vec3(0.));
  gl_FragColor = vec4(gFog(c), 1.);
}`;
function creatureMesh(shared, kind, count, name) {
  const g = creatureGeometry(kind);
  const col = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3), flap = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  g.setAttribute('iCol', col); g.setAttribute('iFlap', flap);
  const mesh = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared.U, uBandC: { value: new THREE.Color('#CDBB8C') } },
    vertexShader: shared.GV + CREATURE_VERT, fragmentShader: shared.GF + CREATURE_FRAG, side: THREE.DoubleSide }), count);
  mesh.name = name; mesh.frustumCulled = false;
  return { mesh, col, flap };
}
// a creature's attitude: heading along dir, its back toward `back` (the world's down for all that fly here)
const _cx = new THREE.Vector3(), _cy = new THREE.Vector3(), _cz = new THREE.Vector3(), _cm = new THREE.Matrix4(), _cs = new THREE.Vector3();
function attitude(out, px, py, pz, dx, dy, dz, bx, by, bz, size) {
  _cz.set(dx, dy, dz); if (_cz.lengthSq() < 1e-8) _cz.set(0, 0, 1); _cz.normalize();
  _cy.set(bx, by, bz).addScaledVector(_cz, -(_cz.x * bx + _cz.y * by + _cz.z * bz)); if (_cy.lengthSq() < 1e-8) _cy.set(1, 0, 0).addScaledVector(_cz, -_cz.x); _cy.normalize();
  _cx.crossVectors(_cy, _cz);
  _cm.makeBasis(_cx, _cy, _cz).scale(_cs.set(size, size, size)).setPosition(px, py, pz);
  return out.copy(_cm);
}
// keep-outs by place that bind every creature's whole course: 20 m from the entry axis from z 250 to z 110; the cones
// of sight from the entry to the elm's crown and to the grain; the tube of radius MOUTH.tube round the last straight
// (from its beginning to beyond the mouth)
const SIGHT = [{ k: [GARDEN.ELM.x, (GARDEN.ELM.crownTop + GARDEN.ELM.crownLow) / 2, GARDEN.ELM.z + GARDEN.ELM.crownDz], r: GARDEN.ELM.crownR + 3 }, { k: [GARDEN.GRAIN.x, GARDEN.GRAIN.y, GARDEN.GRAIN.z], r: GARDEN.GRAIN.body + GARDEN.GRAIN.spine }];
export function keptOut(x, y, z, rad) {
  if (z > ENTRY.z - ENTRY.level && z < GARDEN.R && Math.hypot(x, y - ENTRY.y) < 20 + rad) return true;
  if (z < MOUTH.z + MOUTH.straight + rad && Math.hypot(x - MOUTH.x, y - MOUTH.y) < MOUTH.tube + rad) return true;
  for (const s of SIGHT) {
    const ax = s.k[0] - ENTRY.x, ay = s.k[1] - ENTRY.y, az = s.k[2] - ENTRY.z, L2 = ax * ax + ay * ay + az * az;
    const t = clamp(((x - ENTRY.x) * ax + (y - ENTRY.y) * ay + (z - ENTRY.z) * az) / L2, 0, 1.1);
    if (Math.hypot(x - ENTRY.x - ax * t, y - ENTRY.y - ay * t, z - ENTRY.z - az * t) < s.r * t + rad + 3) return true;
  }
  return false;
}
// ---- THE ROAD OF BEES (round four; a thing of its own with a stream of its own, 'road of bees'): from the elm's
// crown to the grain a road of laden bees, head down, gold baskets on their hind legs, flies BESIDE THE LINE ON ITS
// RIGHT HAND, on the world clock. BY PLACE: the road is the line's own curve from the trunk's place on, set off to
// the right by ROAD.off metres (it wanders between the two in a slow wave ROAD.wave metres long); its first place
// is lifted to the crown's lowest sprays (the bees come down out of the crown over ROAD.down metres of way) and its
// last is the grain's right flank at the spines' tips. IT LIES UNDER THE SIGHTS OF THE MOUTH: ROAD.under metres
// under the line's own height (the sights lie level with the line) as far as ROAD.before metres before the mouth's
// plane, where every sight has drawn in to the axis; from there it comes up to the grain's flank (it keeps 8 m
// from every sight of the mouth). A bee is ROAD.long metres long. The bees stand at EVEN SHARES of the road, one to every
// ROAD.gap metres, from one drawn start; each weaves ROAD.weave metres about the road at a drawn pace. So the least
// air between a bee's body and the line is ROAD.off[0] less the weave and the body's half (10 m and more);
// the last straight's tube (MOUTH.tube) is never entered. A bee is small at both ends (it comes out of the leaves
// and goes in among the spines over ROAD.ends metres).
const ROAD = { long: 2.6, off: [12, 22], under: 8, before: 16, wave: 110, down: 36, step: 9, gap: 8, speed: 8, weave: 0.7, ends: 5 };
export function makeRoad(path, near) {
  const E = GARDEN.ELM, G = GARDEN.GRAIN, p = new THREE.Vector3(), t = new THREE.Vector3(), pts = [];
  const d0 = near.metre(PLACE.trunk), d1 = path.length - ROAD.before, mid = (ROAD.off[0] + ROAD.off[1]) / 2, amp = (ROAD.off[1] - ROAD.off[0]) / 2;
  for (let d = d0; d <= d1; d += ROAD.step) {
    path.posAtDist(d, p); path.tangentAtDist(d, t);
    const hl = Math.hypot(t.x, t.z) || 1, off = mid - amp * Math.cos((d - d0) / ROAD.wave * TAU), lift = 1 - smoothstep(0, ROAD.down, d - d0);
    pts.push([p.x - t.z / hl * off, lerp(p.y - ROAD.under, E.crownLow, lift), p.z + t.x / hl * off]);
  }
  pts.push([G.x + G.body + G.spine, G.y, G.z]);
  return makePath(pts);
}
// a bee of the road at a clock: where it is and how great (rows: [share of the road, weave pace, weave phase])
export function roadBeeAt(road, row, time, out) {
  const s = ((row[0] + time * ROAD.speed / road.length) % 1) * road.length, w = ROAD.weave * Math.sin(time * row[1] + row[2]);
  road.posAtDist(s, _rp); road.tangentAtDist(s, _rt);
  const hl = Math.hypot(_rt.x, _rt.z) || 1;
  out[0] = _rp.x - _rt.z / hl * w; out[1] = _rp.y + ROAD.weave * 0.6 * Math.sin(time * row[1] * 1.3 + row[2] * 2); out[2] = _rp.z + _rt.x / hl * w;
  out[3] = ROAD.long / BEE_LONG * smoothstep(0, ROAD.ends, s) * (1 - smoothstep(road.length - ROAD.ends, road.length, s));
  out[4] = _rt.x; out[5] = _rt.y; out[6] = _rt.z;
  return out;
}
const _rp = new THREE.Vector3(), _rt = new THREE.Vector3();
// ---- THE SWARM (round six; the visit's stream 'swarm'): A SWARM OF BEES IN A SHAFT OF LIGHT. A rule of the place: of
// the shafts that stand between the stems on the right hand of the line (the side of the sun), the one laid nearest
// the top (the place) holds a swarm: SWARM.n small bees (SWARM.size of a flower bee) that mill round the shaft's own
// axis, SWARM.under metres under the floor of law (a) (so under every hanging head, in the open light), each on a
// round of its own, SWARM.ring metres from the axis (inside the shaft's radius with its own half length), rising and
// sinking SWARM.along metres along the axis, at a drawn pace, on the world clock. The shaft stands SHAFT.off metres
// to the side of the line and the swarm's middle lies further along the shaft's slant: its nearest bee keeps 19 m
// of air from the line.
const SWARM = { n: 22, size: 0.7, ring: [0.6, 2.2], along: 5, under: 3, pace: [0.7, 1.5] };
export function dealSwarm(P, rays, rng) {
  const top = P.near.metre(PLACE.top), shaft = rays.filter((r) => r.lane === 1).sort((a, b) => Math.abs(a.metre - top) - Math.abs(b.metre - top))[0];
  if (!shaft) return null;
  const S = GARDEN.SUN, t = SWARM.under / -S[1], c = [shaft.m[0] + S[0] * t, shaft.m[1] + S[1] * t, shaft.m[2] + S[2] * t];
  const ax = new THREE.Vector3(-S[0], -S[1], -S[2]), e1 = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(1, 0, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1).normalize(), bees = [];
  for (let i = 0; i < SWARM.n; i++) bees.push({ r: rng.range(SWARM.ring[0], SWARM.ring[1]), w: rng.range(SWARM.pace[0], SWARM.pace[1]) * rng.sign(), ph: rng() * TAU, up: rng.range(0.3, 1) * SWARM.along, w2: rng.range(0.2, 0.45), ph2: rng() * TAU, wing: rng() * TAU, col: lin(rng.pick(['#3A2A1C', '#4A3420', '#33261C'])) });
  return { c, ax: ax.toArray(), e1: e1.toArray(), e2: e2.toArray(), bees, shaft };
}
// a bee of the swarm at a clock: its place on its own round about the shaft's axis
export function swarmAt(sw, b, time, out) {
  const a = time * b.w + b.ph, r = b.r * (0.85 + 0.15 * Math.sin(time * b.w2 * 2.3 + b.ph2)), h = b.up * Math.sin(time * b.w2 + b.ph2);
  for (let k = 0; k < 3; k++) out[k] = sw.c[k] + sw.ax[k] * h + (sw.e1[k] * Math.cos(a) + sw.e2[k] * Math.sin(a)) * r;
  return out;
}
// (the bee's form is 2.5 of its own measures long, head to tail)
const BEE_LONG = 2.5;
// ---- BEES: each works three flowers of its own, on the world clock: it settles, crawls round the head, lifts off,
// hangs, and goes to the next. Its whole course, with its own size, stays 8 m and more from the line.
// shares of one leg of the bee's own round: it has settled by 'settle', crawls until 'crawl', has lifted by 'lift', then flies
const BEE = { size: 1, half: 1.4, legs: 3, settle: 0.1, crawl: 0.72, lift: 0.8 };
const beeSeat = (f) => { const H = HEADS[f.kind]; return { x: f.x, y: f.top - f.len - H.D * f.size * 0.7, z: f.z, r: H.R * f.size * 0.85 + 0.45, ph: f.ph }; };
// the bee's place at a share tau (0..1) of the leg on seat k: [x, y, z, on (1 on the flower, 0 in the air), which seat's sway]
function beeLeg(bee, k, tau, out) {
  const s0 = bee.seats[k], s1 = bee.seats[(k + 1) % BEE.legs], a0 = bee.a0[k], a1 = a0 + bee.turn, b0 = bee.a0[(k + 1) % BEE.legs];
  const on = (s, a, lift) => [s.x + Math.cos(a) * (s.r + lift * 1.3), s.y - lift * 2.1, s.z + Math.sin(a) * (s.r + lift * 1.3)];
  let p, air = 0, mix = 0;
  if (tau < BEE.settle) { const s = smoothstep(0, BEE.settle, tau); p = on(s0, a0, 1 - s); air = 1 - s; }
  else if (tau < BEE.crawl) p = on(s0, lerp(a0, a1, (tau - BEE.settle) / (BEE.crawl - BEE.settle)), 0);
  else if (tau < BEE.lift) { const s = smoothstep(BEE.crawl, BEE.lift, tau); p = on(s0, a1, s); air = s; }
  else { const s = smoothstep(BEE.lift, 1, tau), A = on(s0, a1, 1), B = on(s1, b0, 1); p = [lerp(A[0], B[0], s), lerp(A[1], B[1], s) - Math.sin(s * Math.PI) * 1.2, lerp(A[2], B[2], s)]; air = 1; mix = s; }
  out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; out[3] = air; out[4] = mix;
  return out;
}
export function beeAt(bee, time, shudPhase, out) {
  const c = ((time + bee.ph) / bee.T) % 1 * BEE.legs, k = Math.floor(c) % BEE.legs, q = beeLeg(bee, k, c - Math.floor(c), out);
  // it rides the flower's own sway while it is on it, and passes from one flower's sway to the next's in the air
  if (bee.still) return q;
  const sA = bee.seats[k], sB = bee.seats[(k + 1) % BEE.legs];
  const oA = headOffAt(swayAt(sA.x, sA.z, sA.ph, time, shudPhase)), oB = headOffAt(swayAt(sB.x, sB.z, sB.ph, time, shudPhase));
  q[0] += lerp(oA[0], oB[0], q[4]); q[2] += lerp(oA[2], oB[2], q[4]);
  return q;
}
export async function dealBees(P, rng, flowers, count, ctx, rSky = rng) {
  const out = [], tmp = [0, 0, 0, 0, 0];
  const clearOf = (bee) => {
    let m = 1e9;
    for (let k = 0; k < BEE.legs; k++) for (let i = 0; i < 60; i++) { const q = beeLeg(bee, k, i / 60, tmp); if (keptOut(q[0], q[1], q[2], BEE.half + 0.6) || P.fan.on(q, q, BEE.half + 0.6)) return -1; m = Math.min(m, P.near.space(q[0], q[1], q[2])); }
    return m - BEE.half - 0.6;
  };
  const make = (heads, r = rng) => ({ seats: heads.map(beeSeat), a0: heads.map(() => r() * TAU), turn: r.range(2.4, 4.2) * r.sign(), T: r.range(26, 36), ph: r() * 100, col: lin(r.pick(['#3A2A1C', '#4A3420', '#33261C'])) });
  // the bee by the lane: always on the three clovers that the lane keeps to the right of the line
  const lane = flowers.filter((f) => f.bee);
  if (lane.length === BEE.legs) { const b = make(lane); b.clear = clearOf(b); if (b.clear >= 8) { b.lane = true; out.push(b); } }
  // the bee of the sky stretch (a stream of its own, 'sky bee'): always on the three clovers of the long hangers' knot
  const knot = flowers.filter((f) => f.skyBee);
  if (knot.length === BEE.legs) { const b = make(knot, rSky); b.clear = clearOf(b); if (b.clear >= 8) { b.sky = true; out.push(b); } }
  const cands = flowers.filter((f) => !f.bee && !f.skyBee && !f.rim && f.kind <= 1 && f.near < 90 && f.near > 12);
  for (let tries = 0; out.length < count && tries < 400 && cands.length > 3; tries++) {
    await ctx.yield();
    const h0 = rng.pick(cands), nearBy = cands.filter((f) => f !== h0 && Math.hypot(f.x - h0.x, f.z - h0.z) < 30 && Math.abs((f.top - f.len) - (h0.top - h0.len)) < 16);
    if (nearBy.length < 2 || out.some((b) => b.seats.some((s) => Math.hypot(s.x - h0.x, s.z - h0.z) < 34))) continue;
    const b = make([h0, nearBy[0], nearBy[nearBy.length - 1]]); b.clear = clearOf(b);
    if (b.clear >= 8) out.push(b);
  }
  return out;
}
// ---- BUTTERFLIES: loose pairs, each pair wandering inside a box of its own that keeps 8 m from the line
// rows: { c, h (the box's half sizes, the wings' reach counted in), w, ph, col, clear }
const FLY = { wing: 2.1 };
export async function dealFlies(P, rng, pairs, ctx) {
  const out = [], p = new THREE.Vector3(), t = new THREE.Vector3(), N = P.near;
  for (let tries = 0; out.length < pairs && tries < 600; tries++) {
    if (tries % 2 === 1) await ctx.yield();
    const d = rng.range(6, P.path.length - 30), side = rng.sign(), h = [rng.range(6, 10), rng.range(3, 5.5), rng.range(6, 10)], off = side * rng.range(10 + h[0], 36), dy = rng.range(-9, 7);
    const w = [rng.range(0.25, 0.5), rng.range(0.4, 0.8), rng.range(0.25, 0.5)], ph = [rng() * TAU, rng() * TAU, rng() * TAU], col = lin(rng.pick(['#F4F1E4', '#E4E98A', '#7CA0E8']));
    P.path.posAtDist(d, p); P.path.tangentAtDist(d, t); const l = Math.hypot(t.x, t.z) || 1;
    const c = [p.x - t.z / l * off, Math.min(p.y + dy, 20 - h[1]), p.z + t.x / l * off];
    if (c[1] - h[1] < CLOUD.top + 5 || offElm(c[0], c[2]) < GARDEN.ELM.crownR + 4 + Math.max(h[0], h[2]) || Math.hypot(c[0], c[2]) > 205 || overHeap(P.moored, c[0], c[2], Math.max(h[0], h[2]) + 3)) continue;
    if (Math.hypot(c[0] - GARDEN.GRAIN.x, c[1] - GARDEN.GRAIN.y, c[2] - GARDEN.GRAIN.z) < 32 + h[0]) continue;
    if (keptOut(c[0], c[1], c[2], Math.hypot(h[0], h[1], h[2]))) continue;
    if (out.some((o) => Math.hypot(o.c[0] - c[0], o.c[1] - c[1], o.c[2] - c[2]) < 40)) continue;
    if (P.fan.on(c, c, Math.hypot(h[0], h[1], h[2]))) continue;
    // the box against the whole line: the least distance from any place of the line to the box
    let clear = 1e9;
    for (let i = 0; i <= N.n; i++) clear = Math.min(clear, Math.hypot(Math.max(Math.abs(N.xs[i] - c[0]) - h[0], 0), Math.max(Math.abs(N.ys[i] - c[1]) - h[1], 0), Math.max(Math.abs(N.zs[i] - c[2]) - h[2], 0)));
    if (clear < 8) continue;
    out.push({ c, h, w, ph, col, clear });
  }
  return out;
}
export function flyAt(row, which, time, out) {
  const lag = which * 1.1;
  for (let k = 0; k < 3; k++) out[k] = row.c[k] + (row.h[k] - FLY.wing) * Math.sin(time * row.w[k] + row.ph[k] - lag * (0.8 + 0.3 * k)) * (which ? 0.82 : 1);
  return out;
}
// ---- THE STRINGS OF BIRDS below, AT THREE UNLIKE DEPTHS: each string flies a closed course round the ball's upright
// axis, head down, wings beating, on the world clock, OVER THE CLOUDSCAPE AS GEESE FLY OVER HILLS. A course's height
// is a law of its own places (birdCourse, laid once at build for every degree of the round):
//   at rest it lies BIRDS.rings[k].share of the way down from the line's lowest place less DECK.air to the greater
//   heaps' floor (three unlike depths, all under every place of the line);
//   over a greater heap it climbs to BIRDS.over metres over that heap's top and comes down again beyond its outline
//   (full over the heap's own width, back at rest BIRDS.slope widths out), so no string flies through a cloud;
//   near the line it never comes nearer than BIRDS.under metres under the line's places within BIRDS.keep level
//   metres of it (a heap under the line stands DECK.air under it, so the two laws never ask for the same air).
//   NO COURSE PASSES UNDER THE LAST STRAIGHT: the three radii lie inside the place where it begins (the nearest
//   wing tip keeps 11 m from its axis), so the tube round it is never entered.
// ON EACH COURSE AS MANY STRINGS AT EVEN SHARES OF THE ROUND as leave no gap between two strings longer than
// BIRDS.apart metres (so that one is under any side of the sky at every entry clock), from one drawn start,
// each course its own way round at its own pace. rows of BIRDS.rings: r (the course's radius), share, size, gap
// (metres between two birds of a string). ring.of[i]: bird i's course, its string, its place in the string.
export const BIRDS = { apart: 200, over: 6, slope: 2.4, under: 8, keep: 20, steps: 360, rings: [{ r: 121, share: 0.1, size: 2.4, gap: 8.5 }, { r: 136, share: 0.3, size: 1.6, gap: 5.5 }, { r: 85, share: 0.5, size: 3, gap: 11 }] };
export const birdStrings = (k) => Math.ceil(TAU * BIRDS.rings[k].r / BIRDS.apart);
export async function birdCourse(k, near, moored, ctx) {
  const C = BIRDS.rings[k], ys = new Float32Array(BIRDS.steps + 1);
  let low = 1e9; for (let i = 0; i <= near.n; i++) low = Math.min(low, near.ys[i]);
  const rest = lerp(low - DECK.air, DECK.floor, C.share), far = BIRDS.keep * 2.5;
  for (let j = 0; j <= BIRDS.steps; j++) {
    if (ctx && j % 8 === 7) await ctx.yield();
    const th = j / BIRDS.steps * TAU, x = Math.cos(th) * C.r, z = Math.sin(th) * C.r;
    let y = rest, cap = 1e9;
    for (const h of moored) y = Math.max(y, lerp(rest, h.top + BIRDS.over, 1 - smoothstep(h.half, h.half * BIRDS.slope, Math.hypot(x - h.c[0], z - h.c[2]))));
    // (a place of the line further off than the cap's whole ease leaves the cap far over every course: it is not asked)
    for (let i = 0; i <= near.n; i++) {
      const dx = x - near.xs[i], dz = z - near.zs[i]; if (dx * dx + dz * dz >= far * far) continue;
      cap = Math.min(cap, near.ys[i] - BIRDS.under + 400 * smoothstep(BIRDS.keep, far, Math.hypot(dx, dz)));
    }
    ys[j] = Math.min(y, cap);
  }
  return ys;
}
export function ringBirdAt(ring, i, time, out) {
  const [k, st, m] = ring.of[i], C = BIRDS.rings[k], th = ring.th0[k] + st / birdStrings(k) * TAU + ring.dir[k] * (time * ring.speed[k] - m * C.gap) / C.r, j = ring.jit[i];
  const f = ((th / TAU) % 1 + 1) % 1 * BIRDS.steps, j0 = Math.floor(f), ys = ring.course[k];
  out[0] = Math.cos(th) * (C.r + j[0]); out[2] = Math.sin(th) * (C.r + j[0]);
  out[1] = lerp(ys[j0], ys[Math.min(j0 + 1, BIRDS.steps)], f - j0) + 0.5 * j[1];
  return out;
}
// ------------------------------------------------------------------ THE BOW (a law of the sky's directions)
// Opposite the sun stands a rainbow: a ring of colour BOW.at degrees from the point straight opposite the sun, red
// outermost, BOW.wide degrees broad with soft edges, and a fainter second ring BOW.second degrees out with its colours
// the other way round. bowAt gives its colour for a sight's direction alone: nothing in it asks where the eye stands
// or how it looks. What shows it is what stands on that bearing: rain most, lit cloud less, clear blue hardly.
// The point opposite the sun stands as high over the level as the sun stands under it, so the ring's lowest place
// (its crown, hanging under the meadow) stands BOW.at less that height under the level: bowCrown, degrees.
const BOW = { at: 42, wide: 4.4, second: 51.5, faint: 0.3 };
export const bowCrown = () => BOW.at - Math.asin(-GARDEN.SUN[1]) / DEG;
const BOW_GLSL = /* glsl */`
vec3 bowHue(float t) { return clamp(abs(mod((1. - t) * .8 * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.); }
vec3 bowAt(vec3 dir) {
  float ang = acos(clamp(dot(dir, -uSun), -1., 1.)) * 57.29578;
  float t = (ang - ${(BOW.at - BOW.wide / 2).toFixed(2)}) / ${BOW.wide.toFixed(2)}, t2 = (${(BOW.second + BOW.wide * 0.6).toFixed(2)} - ang) / ${(BOW.wide * 1.2).toFixed(2)};
  vec3 c = bowHue(clamp(t, 0., 1.)) * smoothstep(-.3, .22, t) * (1. - smoothstep(.78, 1.3, t));
  return c + bowHue(clamp(t2, 0., 1.)) * smoothstep(-.3, .25, t2) * (1. - smoothstep(.75, 1.3, t2)) * ${BOW.faint.toFixed(2)};
}`;
// ------------------------------------------------------------------ THE GARDEN'S RAIN (a medium; on every visit)
// One broad sunlit curtain of rain that RISES from the head of its own heap (the far side's rain heap) to the hanging
// meadow: FARSIDE.rain.broad to either hand across the sun's bearing, FARSIDE.rain.thick before and behind. In it,
// from a fixed stream of its own ('the rain'): SHEETS of fine rain (broad upright veils that stand; only their grain
// climbs), long bright STREAKS and short DROPS that climb from the heap's head to the turf, slow, and MIST where the
// rain meets the turf. Every part is upright or round and turns only about its own upright to show its face; none
// thins toward the eye; the whole stands where rainPlace puts it, by the line's air far from the line.
// rows: [x, y of the foot, z, kind (0 streak, 1 drop, 2 sheet, 3 mist)], [breadth, length, phase, metres a second],
// the climb's span, its strength (the rain thins by place toward the curtain's two ends: it has no upright edge)
const RAIN = { streaks: 1000, drops: 700, sheets: 12, mist: 14, spray: 9, speed: [5, 9], long: [7, 18], wide: [0.2, 0.36], foot: 0.5, turf: 2 };
export function dealRain(heap) {
  // (the rain's foot stands half way down in its heap: the heap's own billows hide where it begins)
  const rng = makeRng(hashSeed(FIXED + ':the rain')), at = rainPlace(), F = FARSIDE.rain, rows = [], y0 = heap.top - heap.deep * RAIN.foot;
  // a place of the curtain: across the sun's bearing and along it, thinner toward its two ends
  const spot = () => { const u = rng.range(-1, 1), v = rng.range(-1, 1) * Math.sqrt(1 - u * u * 0.8), a = u * F.broad, b = v * F.thick; return [at.x - at.az * a + at.ax * b, at.z + at.ax * a + at.az * b, u]; };
  const thin = (u) => Math.pow(1 - u * u, 0.7);
  for (let i = 0; i < RAIN.streaks + RAIN.drops; i++) {
    const [x, z, u] = spot(), drop = i >= RAIN.streaks, span = yg(x, z) - RAIN.turf - y0;
    rows.push([x, y0, z, drop ? 1 : 0, rng.range(RAIN.wide[0], RAIN.wide[1]) * (drop ? 1.5 : 1), drop ? rng.range(0.7, 1.6) : rng.range(RAIN.long[0], RAIN.long[1]), rng(), rng.range(RAIN.speed[0], RAIN.speed[1]), span, thin(u)]);
  }
  for (let i = 0; i < RAIN.sheets; i++) {
    const u = (i + rng.range(0.2, 0.8)) / RAIN.sheets * 2 - 1, b = rng.range(-0.7, 0.7) * F.thick, x = at.x - at.az * u * F.broad * 0.85 + at.ax * b, z = at.z + at.ax * u * F.broad * 0.85 + at.az * b, span = yg(x, z) - y0;
    rows.push([x, y0, z, 2, rng.range(13, 21) * (1 - 0.3 * u * u), span, rng(), rng.range(RAIN.speed[0], RAIN.speed[1]), span, thin(u)]);
  }
  // mist where the rain meets the turf, and a spray where it leaves its heap's head
  for (let i = 0; i < RAIN.mist + RAIN.spray; i++) {
    const [x, z, u] = spot(), r = rng.range(11, 19) * (1 - 0.3 * u * u), low = i >= RAIN.mist;
    rows.push([x, low ? heap.top + r * rng.range(-0.3, 0.2) : yg(x, z) - r * 0.55, z, 3, r, r * (low ? 0.6 : 1), rng(), rng.range(0.03, 0.08), 0, thin(u) * (low ? 0.7 : 1)]);
  }
  return rows;
}
const RAIN_VERT = /* glsl */`
attribute vec4 iA, iB; attribute vec2 iC; varying vec2 vQ; varying vec4 vR; varying float vK;
void main() {
  // how far up its climb a streak or a drop is (the world clock); a sheet and a mist puff stand
  float kind = iA.w, k = fract(iB.z + uTime * iB.w / max(iC.x, 1.));
  vec3 p = iA.xyz, to = cameraPosition - iA.xyz, right = normalize(vec3(to.z, 0., -to.x) + 1e-5);
  if (kind < 1.5) p += vec3(0., k * iC.x + (position.y - .5) * iB.y, 0.) + right * position.x * iB.x * .5;
  else if (kind < 2.5) p += vec3(0., position.y * iB.y, 0.) + right * position.x * iB.x;
  else p += vec3(sin(uTime * iB.w + iB.z * 40.) * 2.5, (position.y - .5) * iB.y * 1.3, cos(uTime * iB.w * .8 + iB.z * 23.) * 2.5) + right * position.x * iB.x;
  vQ = position.xy; vR = vec4(kind, k, iB.z, position.x * iB.x); vK = iC.y;
  vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RAIN_FRAG = BOW_GLSL + /* glsl */`
varying vec2 vQ; varying vec4 vR; varying float vK;
void main() {
  vec3 dir = normalize(vWp - cameraPosition), bow = bowAt(dir); float bw = max(bow.r, max(bow.g, bow.b));
  float kind = vR.x, ax = 1. - abs(vQ.x), a, ends = smoothstep(0., .05, vR.y) * (1. - smoothstep(.9, 1., vR.y));
  // the rain is lit by the low sun: white gold against the blue
  vec3 c = mix(vec3(.84, .92, 1.), uSunCol * .3 + vec3(.55, .5, .42), .5);
  if (kind < .5) {
    // a long streak: bright at its head (it climbs), thinning down its tail
    a = smoothstep(0., .7, ax) * smoothstep(0., .5, vQ.y) * (1. - smoothstep(.9, 1., vQ.y)) * .8 * ends;
  } else if (kind < 1.5) {
    a = (1. - smoothstep(.25, 1., length(vec2(vQ.x, (vQ.y - .5) * 2.)))) * .9 * ends; c *= 1.15;
  } else if (kind < 2.5) {
    // a sheet of fine rain: soft toward its two edges, its grain climbing; it stands in its heap's head and goes
    // into the mist at the turf
    float st = texture2D(uNoise, vec2(vR.w * .013 + vR.z * 3., (vWp.y - uTime * 7.) * .0017)).b, st2 = texture2D(uNoise, vec2(vR.w * .031 + vR.z * 5., (vWp.y - uTime * 5.) * .0031 + .4)).b;
    a = (.045 + .16 * smoothstep(.4, .8, st * .6 + st2 * .4)) * ax * ax * (3. - 2. * ax) * smoothstep(0., .14, vQ.y) * (1. - smoothstep(.94, 1., vQ.y));
    a *= 1. + 2.2 * bw;
  } else {
    float d = length(vec2(vQ.x, (vQ.y - .5) * 2.)); a = 1. - smoothstep(.15, 1., d); a *= a * .3;
    c = mix(c, vec3(.9, .95, 1.), .5);
  }
  // THE BOW stands strongest in the rain
  c = mix(c, bow * 1.1 + .1, min(bw, 1.) * (kind > 2.5 ? .45 : .85));
  gl_FragColor = vec4(c, a * vK);
}`;
function rainMesh(shared, rows) {
  const n = rows.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 2);
  rows.forEach((r, i) => { a.set(r.slice(0, 4), i * 4); b.set(r.slice(4, 8), i * 4); c.set(r.slice(8, 10), i * 2); });
  const [lo, hi] = boundsOf(rows, (r) => [r[0] - 35, r[1], r[2] - 35, r[0] + 35, r[1] + Math.max(r[8], r[5]), r[2] + 35]);
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); base.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(instanced(base, { iA: { a, n: 4 }, iB: { a: b, n: 4 }, iC: { a: c, n: 2 } }, n, lo, hi), new THREE.ShaderMaterial({
    uniforms: { ...shared.U }, vertexShader: shared.GV + RAIN_VERT, fragmentShader: shared.GF + RAIN_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  mesh.name = "the garden's rain"; mesh.renderOrder = 4;
  return mesh;
}
// ------------------------------------------------------------------ RARE: the shower that rises (a medium)
// From each moored rain heap a veil of fine rain goes UP to the meadow: an upright column that stands still inside its
// ground's circle; only the streaks move in it. A pale bow of colour stands in it on the side away from the sun.
const VEIL_VERT = /* glsl */`
attribute vec3 aVeil; varying vec3 vN, vVeil;
void main() { vN = normal; vVeil = aVeil; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const VEIL_FRAG = /* glsl */`
varying vec3 vN, vVeil;
void main() {
  vec3 V = cameraPosition - vWp; float dist = length(V); vec3 N = normalize(vN);
  // streaks of rain going up, slanting a little inside the column
  float st = texture2D(uNoise, vec2(vVeil.x * 9. + vVeil.y * .5, vVeil.y * 1.6 - uTime * .22)).b;
  // the column thins toward its own outline as a round body of rain does, OVER THE OUTER HALF OF ITS WIDTH AS THE
  // EYE SEES IT (how far across the column this place of its wall lies: 0 on its middle line, 1 on its outline), so
  // that the column has no upright edge; a power of the wall's slant would fade only its last few metres.
  // The fall is squared because the tone curve brings faint white up: a fall that is even in light reads as a
  // step against deep blue, a squared one reads as even
  float tk = abs(dot(N.xz, normalize(V.xz + 1e-4))), across = sqrt(max(1. - tk * tk, 0.));
  float thick = 1. - smoothstep(.1, 1., across); thick *= thick;
  float a = (.05 + .2 * smoothstep(.45, .8, st)) * thick;
  a *= smoothstep(0., .08, vVeil.y) * (1. - smoothstep(.9, 1., vVeil.y));
  // the bow: bands of pale colour across the column's far side from the sun; it is in the rain, so it thins with
  // the rain toward the column's outline (no crisp upright edge on the bow's side either)
  float away = smoothstep(.2, .9, dot(N.xz, -normalize(uSun.xz))), hgt = (vVeil.y - .32) * 9.;
  vec3 bow = clamp(vec3(1. - abs(hgt - .2) * 3., 1. - abs(hgt - .5) * 3., 1. - abs(hgt - .8) * 3.), 0., 1.) * away * .5 * thick;
  gl_FragColor = vec4(mix(vec3(.82, .9, .97), vec3(1.), .3) + bow, a + (bow.r + bow.g + bow.b) * .06);
}`;
function veilMesh(shared, rainHeaps) {
  const pos = [], nor = [], veil = [], idx = [], NA = 28, NL = 5;
  for (const h of rainHeaps) {
    const base = pos.length / 3, y0 = h.top - 6, y1 = yg(h.c[0], h.c[2]) - 3, rad = Math.min(h.half, SHOWER.r - 2);
    for (let j = 0; j <= NL; j++) for (let i = 0; i <= NA; i++) { const a = i / NA * TAU; pos.push(h.c[0] + Math.cos(a) * rad, lerp(y0, y1, j / NL), h.c[2] + Math.sin(a) * rad); nor.push(Math.cos(a), 0, Math.sin(a)); veil.push(i / NA, j / NL, 0); }
    for (let j = 0; j < NL; j++) for (let i = 0; i < NA; i++) { const a = base + j * (NA + 1) + i, b = a + NA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aVeil', new THREE.Float32BufferAttribute(veil, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared.U }, vertexShader: shared.GV + VEIL_VERT, fragmentShader: shared.GF + VEIL_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  mesh.name = 'the rising rain'; mesh.renderOrder = 4;
  return mesh;
}
export default {
  id: 'garden-upside-down',
  name: 'The Garden Upside Down',
  category: 'bizarre',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = ctx.quality && ctx.quality.detail ? ctx.quality.detail : 1, vary = ctx.vary || {};
    // ---- the streams of the visit, all taken here in one fixed list, each made from the world's seed and a name
    const stream = (name) => makeRng(hashSeed('garden-upside-down:' + name + ':' + ctx.seed));
    const rVary = stream('vary'), rFlowers = stream('flowers'), rCloud = stream('cloud'), rBees = stream('bees'), rFlies = stream('butterflies');
    const rBirds = stream('birds'), rMotes = stream('motes'), rRays = stream('rays'), rBeads = stream('beads'), rShower = stream('shower'), rWings = stream('bee wings');
    // the streams of round two, each for one new thing, after the old ones (which deal as they did)
    const rLane = stream('lane kinds'), rStrings = stream('strings'), rPerched = stream('perched'), rWagtail = stream('wagtail'), rPetals = stream('petals'), rPollen = stream('pollen stream'), rPollenBees = stream('pollen bees');
    // the streams of round three, each for one new thing
    const rRiver = stream('river motes'), rRing = stream('ring'), rDrop = stream('dropping bird');
    // ---- what this visit is like (the garden is always at morning: an asked-for night is read as any hour)
    const hourDraw = rVary(), moodDraw = rVary();
    const gold = vary.hour === 'dawn' || vary.hour === 'golden' ? true : vary.hour === 'day' ? false : hourDraw < 0.5;
    const fuller = (typeof vary.mood === 'number' ? vary.mood : moodDraw) > 0.5;
    const density = clamp(typeof vary.density === 'number' ? vary.density : 1, 0.7, 1.3), rare = !!vary.rare;
    const dominant = rVary.int(0, 3), shudK = rVary(), shudPhase = rVary() * 14;
    const shared = await gardenShared(ctx, {
      sun: gold ? '#FFD890' : '#FFF4DC', sunK: gold ? 4.4 : 4.6, haze: gold ? '#86B8EA' : '#7DB6F0', hazeSun: gold ? '#FFDFA0' : '#FFEEC4',
      shudPhase, shudBlade: lerp(3, 5, shudK) * DEG, shudElm: lerp(0.7, 1.2, shudK) * DEG,
    });
    const U = shared.U;
    await ctx.yield();

    // ---- the route, and the laws written from its line
    await layRoute(ctx);
    await ctx.yield();
    // (the kit's path stands alone in its piece of the build: a hand-back before it and after it)
    const path = makePath(ROUTE);
    await ctx.yield();
    const near0 = makeNear(path);
    await ctx.yield();
    const P = { path, near: near0, lane: await makeLane(path, ctx, near0) };
    await ctx.yield();
    P.brook = makeBrook();
    await ctx.yield();
    // (the fan of clear sights to the mouth begins at THE VIEW, the metre at which the gaze begins to go to the
    // grain: a sight is kept clear for every metre of the grain's look)
    P.fan = makeFan(path, P.near.metre(PLACE.view));
    await ctx.yield();

    // ---- THE SKIN (the floor of sky) and THE VAULT (the turf)
    const skinBall = new THREE.SphereGeometry(GARDEN.R, 64, 40);
    await ctx.yield();
    const skin = new THREE.Mesh(skinBall, new THREE.ShaderMaterial({
      uniforms: { ...U, uDeepSky: { value: new THREE.Color(gold ? '#3C86E0' : '#2F7BE0').multiplyScalar(0.7) }, uPaleSky: { value: new THREE.Color(gold ? '#7FB4EE' : '#74B2F2').multiplyScalar(0.74) },
        uZenith: { value: new THREE.Color(gold ? '#2462CE' : '#1D58D0').multiplyScalar(0.6) },
        uDeckLit: { value: new THREE.Color(gold ? '#FFE6BE' : '#FFF3DC').multiplyScalar(0.74) }, uDeckShade: { value: new THREE.Color('#6F84C8').multiplyScalar(0.6) },
        uDeckRim: { value: new THREE.Color(gold ? '#FFD890' : '#FFEFC8') }, uSpoke: { value: dealSpokes() } },
      vertexShader: SKIN_VERT, fragmentShader: shared.GF + SKIN_FRAG(), side: THREE.BackSide }));
    skin.name = 'the skin'; scene.add(skin);
    await ctx.yield();
    const vault = new THREE.Mesh(await vaultGeometry(ctx), new THREE.ShaderMaterial({
      uniforms: { ...U, uTurfA: { value: new THREE.Color('#1E5A3A') }, uTurfB: { value: new THREE.Color('#2F6B2E') }, uEarth: { value: new THREE.Color('#4A3A26') } },
      vertexShader: shared.GV + TURF_VERT, fragmentShader: shared.GF + TURF_FRAG, side: THREE.DoubleSide }));
    vault.name = 'the vault'; scene.add(vault);
    scene.background = new THREE.Color('#CFEAFB');
    await ctx.yield();

    // ---- THE HANGING GRASS
    const grass = await dealGrass(P, detail, ctx);
    await ctx.yield();
    const banks = await dealBanks(P, ctx);
    await ctx.yield();
    const blades = grass.concat(banks);
    await ctx.yield();
    for (const m of await grassMeshes(shared, blades, 6, ctx)) scene.add(m);
    await ctx.yield();

    { const far = dealFarTrees(P.near); await ctx.yield(); if (far.length) for (const m of await farTreeMeshes(shared, far, ctx)) scene.add(m); P.farTrees = far; }
    await ctx.yield();
    {
      const rows = dealHedge(), by = (h) => P.near.space(h[0], h[1], h[2]) < HEDGE_NEAR; await ctx.yield();
      const nearHedge = rows.filter(by); await ctx.yield();
      scene.add(hedgeMesh(shared, nearHedge, true)); await ctx.yield();
      const farHedge = rows.filter((h) => !by(h)); await ctx.yield();
      scene.add(hedgeMesh(shared, farHedge, false));
    }
    await ctx.yield();
    // (the hanging strings of the far side: their strings of blossom are drawn with the rim's, their blooms with the flowers)
    P.strings = dealStrings(P, rainPlace());
    await ctx.yield();
    { const rows = (await dealRim(P, ctx)).concat(P.strings.vines); for (const fine of [1, 0]) { const set = rows.filter((r) => r[9] === fine); await ctx.yield(); if (set.length) scene.add(rimMesh(shared, set, !!fine)); } }
    await ctx.yield();
    // ---- THE FLOWERS
    const nHeads = Math.round(clamp(900 * density, 700, 1100) * (0.7 + 0.3 * detail));
    const flowers = await dealFlowers(P, rFlowers, dominant, nHeads, ctx, rLane, stream('meadow heads'));
    await ctx.yield();
    for (const m of flowerMeshes(shared, flowers.concat(P.strings.heads), 40)) { if (m) scene.add(m); await ctx.yield(); }

    // ---- THE ELM (the hero part), hung by its root from the turf
    const E = GARDEN.ELM;
    const hero = await buildHero(ctx, { shared, mossDir: [BROOK.course[6][0] - E.x, BROOK.course[6][1] - E.z] });
    hero.object.position.set(E.x, E.y, E.z); scene.add(hero.object);
    await ctx.yield();

    // ---- THE GRAIN, afloat and still, its mouth facing back along the line
    const G = GARDEN.GRAIN;
    const grain = await buildGrain(ctx, { shared, onSight: (x, y0, y1, z, size) => P.fan.on([G.x + x, G.y + y0, G.z + z], [G.x + x, G.y + y1, G.z + z], size + MOTE.sway) });
    grain.object.position.set(G.x, G.y, G.z); scene.add(grain.object);
    await ctx.yield();
    // ---- THE BROOK on the ceiling: water, stones, beads
    const stones = dealStones(P), beads = dealBeads(P, rBeads, stones);
    await ctx.yield();
    const colU = (hex, k = 1) => ({ value: new THREE.Color(hex).multiplyScalar(k) });
    const brookGeo = await brookGeometry(P, stones, ctx);
    await ctx.yield();
    const brook = new THREE.Mesh(brookGeo, new THREE.ShaderMaterial({
      uniforms: { ...U, uBedA: colU('#3F3828'), uBedB: colU('#8E8468'), uWeed: colU('#2A6E36'), uWater: colU('#1FA08E', 0.6), uMirror: colU('#3F7FD6', 0.62), uGlass: colU('#8FE6DC', 0.95) },
      vertexShader: shared.GV + BROOK_VERT, fragmentShader: shared.GF + BROOK_FRAG, side: THREE.DoubleSide }));
    brook.name = 'the brook'; scene.add(brook);
    await ctx.yield();
    scene.add(stoneMesh(shared, stones));
    await ctx.yield();
    if (beads.length) { scene.add(beadMesh(shared, beads)); scene.add(ringMesh(shared, beads)); }
    await ctx.yield();

    // ---- THE CLOUDSCAPE below: the deck drifts in one group that turns round the ball's axis; rain heaps moored
    const grounds = showerGrounds(P.near);
    await ctx.yield();
    const heaps = dealDeck(rCloud, fuller, rare, rShower, grounds), cloudGroup = new THREE.Group(), cast = castUniforms();
    await ctx.yield();
    // (the deck lies deep under the floor: a far, soft, bluer depth)
    cloudGroup.add(...await cloudMeshes(shared, heaps.filter((h) => !h.moored), rCloud, 'the deck of cloud', ctx, gold, cast, DECK.soft)); scene.add(cloudGroup);
    await ctx.yield();
    const rainHeaps = heaps.filter((h) => h.moored);
    if (rainHeaps.length) { scene.add(...await cloudMeshes(shared, rainHeaps, rShower, 'rain heaps', ctx, gold, cast)); scene.add(veilMesh(shared, rainHeaps)); }
    await ctx.yield();
    // the greater heaps, the towers with their shoulders and the far rows: the fixed streams' own forms (the same on every seed)
    const { greater, towers, shoulders, farSide } = await dealGreater(path, P.near, P.fan, ctx);
    await ctx.yield();
    const moored = greater.concat(towers, shoulders, farSide), farRows = dealFarRows(); P.moored = moored; P.towers = towers;
    await ctx.yield();
    setCast(cast, moored.concat(rainHeaps));
    await ctx.yield();
    scene.add(...await cloudMeshes(shared, greater, makeRng(hashSeed(FIXED + ':greater heaps:form')), 'the greater heaps', ctx, gold, cast));
    await ctx.yield();
    scene.add(...await cloudMeshes(shared, towers.concat(shoulders), makeRng(hashSeed(FIXED + ':towers:form')), 'the towers', ctx, gold, cast));
    await ctx.yield();
    scene.add(...await cloudMeshes(shared, farSide, makeRng(hashSeed(FIXED + ':far side:form')), 'the far side of cloud', ctx, gold, cast));
    await ctx.yield();
    // THE GARDEN'S RAIN, on every visit: it climbs from the rain heap's head (the far side's first heap) to the turf
    const rainRows = dealRain(farSide[0]);
    await ctx.yield();
    scene.add(rainMesh(shared, rainRows));
    await ctx.yield();
    scene.add(...await cloudMeshes(shared, farRows, makeRng(hashSeed(FIXED + ':far rows:form')), 'far rows of cloud', ctx, gold, cast, DECK.wisp));
    await ctx.yield();

    // ---- THE RAYS and THE MOTES (media)
    const rays = await dealRays(P, rRays, gold ? 0.15 : 0.1, moored.concat(rainHeaps), ctx, stream('shafts'));
    setPools(shared, rays);
    await ctx.yield();
    scene.add(await rayMesh(shared, rays, gold ? '#FFCB78' : '#FFE6B0', ctx));
    await ctx.yield();
    const motes = await dealMotes(P, rMotes, Math.round(1700 * detail * density), ctx);
    await ctx.yield();
    if (motes.length) { const mm = moteMesh(shared, motes, { glow: 1.6 }); mm.name = 'pollen and seeds'; scene.add(mm); }
    await ctx.yield();
    const leafRows = dealLeavesUp(P);
    await ctx.yield();
    const fallRows = dealLeafFall(P);
    await ctx.yield();
    const leavesUp = moteMesh(shared, leafRows.concat(fallRows), { color: '#8FCB52', glow: 0.85, leaf: true, body: true }); leavesUp.name = 'leaves falling up'; scene.add(leavesUp);
    await ctx.yield();
    const petals = dealPetals(P, flowers, rPetals);
    await ctx.yield();
    if (petals.length) { const pm = moteMesh(shared, petals, { color: '#F8E4EC', glow: 1.0, leaf: true, body: true }); pm.name = 'petals falling up'; scene.add(pm); }
    await ctx.yield();

    // ---- LIFE: bees, butterflies, the birds of the elm, the string below, the wagtail
    const share = (density - 0.7) / 0.6, tmpA = [0, 0, 0, 0, 0], tmpB = [0, 0, 0, 0, 0], tmpR = [0, 0, 0, 0, 0, 0, 0], M4 = new THREE.Matrix4();
    const bees = await dealBees(P, rBees, flowers, Math.round(lerp(4, 10, share)), ctx, stream('sky bee'));
    await ctx.yield();
    // the stream of pollen in the grain's country, and the bees that work among its grains
    P.river = await makeRiver(P, ctx);
    await ctx.yield();
    const pollen = await dealPollen(P, rPollen, Math.round(lerp(40, 54, share)), ctx);
    await ctx.yield();
    for (const b of await dealPollenBees(P, rPollenBees, pollen, rPollenBees.int(5, 6), ctx)) bees.push(b);
    await ctx.yield();
    if (pollen.length) scene.add(pollenMesh(shared, pollen));
    await ctx.yield();
    scene.add(await riverMesh(shared, P.river, Math.round(5200 * (0.7 + 0.3 * detail)), rRiver, ctx));
    await ctx.yield();
    const beeM = creatureMesh(shared, 'bee', Math.max(1, bees.length), 'bees'); beeM.mesh.count = bees.length; scene.add(beeM.mesh);
    await ctx.yield();
    bees.forEach((b, i) => { beeM.col.setXYZ(i, b.col[0], b.col[1], b.col[2]); beeM.flap.setXYZW(i, 55, rWings() * TAU, 0.8, 0); });
    // the road of bees: as many as stand one to every ROAD.gap metres, at even shares from one drawn start
    const road = makeRoad(path, P.near);
    await ctx.yield();
    const rRoad = stream('road of bees'), roadStart = rRoad(), roadBees = [];
    for (let i = 0, n = Math.ceil(road.length / ROAD.gap); i < n; i++) roadBees.push([(roadStart + i / n) % 1, rRoad.range(1.1, 1.9), rRoad() * TAU]);
    const roadM = creatureMesh(shared, 'laden', roadBees.length, 'the road of bees'); scene.add(roadM.mesh);
    await ctx.yield();
    const swarm = dealSwarm(P, rays, stream('swarm')), swarmM = creatureMesh(shared, 'bee', SWARM.n, 'the swarm'); swarmM.mesh.count = swarm ? SWARM.n : 0; scene.add(swarmM.mesh);
    if (swarm) swarm.bees.forEach((b, i) => { swarmM.col.setXYZ(i, b.col[0], b.col[1], b.col[2]); swarmM.flap.setXYZW(i, 55, b.wing, 0.8, 0); });
    roadBees.forEach((b, i) => { const c = lin(rRoad.pick(['#3A2A1C', '#4A3420', '#33261C'])); roadM.col.setXYZ(i, c[0], c[1], c[2]); roadM.flap.setXYZW(i, 55, rRoad() * TAU, 0.8, 0); });
    await ctx.yield();
    const flies = await dealFlies(P, rFlies, Math.round(lerp(3, 8, share)), ctx);
    await ctx.yield();
    const flyM = creatureMesh(shared, 'butterfly', Math.max(1, flies.length * 2), 'butterflies'); flyM.mesh.count = flies.length * 2; scene.add(flyM.mesh);
    flies.forEach((f, i) => { for (const w of [0, 1]) { flyM.col.setXYZ(i * 2 + w, f.col[0], f.col[1], f.col[2]); flyM.flap.setXYZW(i * 2 + w, rFlies.range(8, 11), rFlies() * TAU, 1.0, 0); } });
    const perches = hero.anchors.perches, nPerch = Math.min(perches.length, clamp(Math.round(lerp(10, 14, share)), 10, 12));
    const perchM = creatureMesh(shared, 'bird', Math.max(1, nPerch), 'birds of the elm'); perchM.mesh.count = nPerch; hero.object.add(perchM.mesh);
    const birdTones = ['#4A5A6A', '#6A5A48', '#3E4A58', '#5C6470'];
    for (let i = 0; i < nPerch; i++) { const c = lin(rBirds.pick(birdTones)); perchM.col.setXYZ(i, c[0], c[1], c[2]); perchM.flap.setXYZW(i, 17, rBirds() * TAU, 0.95, 1); }
    // (which bird drops in round n: the visit's own stream by name, kept for the round it belongs to)
    const dropSpur = (n) => { if (drop.n !== n) { drop.n = n; drop.spur = hashSeed('garden-upside-down:dropping bird:' + n + ':' + ctx.seed) % Math.max(1, nPerch); } return drop.spur; };
    const drop = { T: rDrop.range(9, 13), ph: rDrop() * 50, fly: 6.5, dir: rDrop.sign(), r: 8, y: hero.anchors.lowest.y - 2.6 };
    await ctx.yield();
    const nRing = Math.round(lerp(5, 9, share));
    const ring = { th0: [], dir: [], speed: [], jit: [] };
    for (let k = 0; k < 3; k++) { ring.th0.push(rRing() * TAU); ring.dir.push(rRing.sign()); ring.speed.push(rRing.range(13, 16)); }
    // (every string of a course has the same number of birds: the visit's count shared among that course's strings, three at least)
    ring.of = []; ring.course = [];
    for (let k = 0; k < 3; k++) { await ctx.yield(); ring.course.push(await birdCourse(k, P.near, moored.concat(rainHeaps), ctx)); }
    await ctx.yield();
    for (let k = 0; k < 3; k++) for (let st = 0, n = birdStrings(k), per = Math.max(3, Math.round(nRing * 2 / n)); st < n; st++) for (let m = 0; m < per; m++) ring.of.push([k, st, m]);
    const nString = ring.of.length;
    for (let i = 0; i < nString; i++) ring.jit.push([rStrings.range(-1.6, 1.6), rStrings.range(-1, 1)]);
    const ringM = creatureMesh(shared, 'bird', nString + 1, 'the strings of birds'); scene.add(ringM.mesh);
    for (let i = 0; i <= nString; i++) { const c = lin(i === nString ? '#5A6068' : rStrings.pick(birdTones)); ringM.col.setXYZ(i, c[0], c[1], c[2]); ringM.flap.setXYZW(i, rStrings.range(14, 17), rStrings() * TAU, 0.9, i === nString ? 1 : 0); }
    // the perched birds' shuffle and nod, and the wagtail's round, begin at drawn phases of their own
    const perchPh = []; for (let i = 0; i < nPerch; i++) perchPh.push([rPerched() * TAU, rPerched() * TAU]);
    const wagPh = rWagtail() * TAU, wagBob = rWagtail() * TAU;
    // the wagtail walks head down under a stone of the knoll's reach that has room over the lane's limit
    const wagAt = BROOK.course[5], wagStone = stones.filter((s) => s[1] - s[4] - 0.7 >= P.lane(s[0], s[2], 1.4)).sort((a, b) => Math.hypot(a[0] - wagAt[0], a[2] - wagAt[1]) - Math.hypot(b[0] - wagAt[0], b[2] - wagAt[1]))[0];
    if (!wagStone) ringM.mesh.count = nString;
    await ctx.yield();
    // ---- THE GAZE: looks one after another. EVERY AIM IS A NAMED PLACE OF THE WORLD that stands where it stands (the
    // middle of the elm's crown, the grain's middle): no aim is reckoned from where the lens is, and none from the
    // lens's angle. EVERY WINDOW RUNS FROM A PLACE TO A PLACE of the line (the metre of a named point of the line,
    // or the first metre at which a law of two places holds). Every weight is a row of the table LOOK or the
    // outcome of the law of angle. ONE LAW FOR EVERY RISE AND FALL: a look swells and lets go over the metres
    // between two named places of ITS OWN (the swell, said where the look is made), or over half its window where
    // that is less; a look that hands over to no other swells and lets go over half its window. None
    // before the level entry's end; none on the last straight. EVERY LOOK IS NEAR THE LEVEL (LOOK.tilt): none
    // pulls the gaze up into the blades or down to the sun.
    const L = path.length, N = P.near, eye = new THREE.Vector3(), tan = new THREE.Vector3(), pois = [];
    // the first metre between two metres at which a test of the line's place and heading holds (every metre is asked)
    const firstMetre = (d0, d1, test) => { for (let d = d0; d <= d1; d += 1) { path.posAtDist(d, eye); path.tangentAtDist(d, tan); if (test(eye, tan)) return d; } return d1; };
    // how far a level bearing (vx, vz) stands off the line's level heading (radians)
    const offHeading = (t, vx, vz) => Math.acos(clamp((vx * t.x + vz * t.z) / ((Math.hypot(vx, vz) || 1) * (Math.hypot(t.x, t.z) || 1)), -1, 1));
    const fadeOf = (d0, d1, swell = (d1 - d0) / 2) => Math.min(0.5, swell / Math.max(d1 - d0, 1));
    const look = (at, d0, d1, weight, more, swell) => pois.push({ at, from: d0 / L, to: d1 / L, weight, fade: fadeOf(d0, d1, swell), ...more });
    // THE LAW OF ANGLE for a weight: the greatest weight for which a look at a place, alone, leaves the gaze no more
    // than LOOK.side degrees off the line's own level heading and no more than LOOK.tilt degrees off the level at
    // any metre of its window
    const weightFor = async (aim, d0, d1, swell) => {
      const a = new THREE.Vector3(), base = new THREE.Vector3(), to = new THREE.Vector3(), ax = new THREE.Vector3(), g = new THREE.Vector3(), fade = fadeOf(d0, d1, swell);
      const holds = (w) => {
        for (let d = d0; d <= d1; d += 2) {
          path.posAtDist(d, eye); path.tangentAtDist(d, tan); path.posAtDist(Math.min(d + LOOK_AHEAD, L), a);
          base.subVectors(a, eye).normalize(); to.subVectors(aim, eye).normalize();
          const ang = Math.acos(clamp(base.dot(to), -1, 1)); ax.crossVectors(base, to).normalize();
          g.copy(base).applyAxisAngle(ax, ang * w * bell(d, d0, d1, fade));
          if (offHeading(tan, g.x, g.z) > LOOK.side * DEG || Math.abs(Math.asin(clamp(g.y, -1, 1))) > LOOK.tilt * DEG) return false;
        }
        return true;
      };
      // (the halving is done in steps: a hand-back before each asking of the window)
      let lo = 0, hi = 1; for (let k = 0; k < 14; k++) { await ctx.yield(); const mid = (lo + hi) / 2; if (holds(mid)) lo = mid; else hi = mid; }
      return lo;
    };
    await ctx.yield();
    const dKnee = N.metre(PLACE.knee), dTop = N.metre(PLACE.top), dLeaving = N.metre(PLACE.leaving), dView = N.metre(PLACE.view), dCrown = N.metre(PLACE.crown), dTrunk = N.metre(PLACE.trunk), dLast = L - MOUTH.straight;
    await ctx.yield();
    // the middle of the elm's crown (half way from its top to its lowest spray, on the crown's own middle line)
    const crownMid = new THREE.Vector3(E.x, (E.crownTop + E.crownLow) / 2, E.z + E.crownDz), crownOff = (q, t) => offHeading(t, crownMid.x - q.x, crownMid.z - q.z);
    // (1) THE FIRST SIGHT OF THE ELM, far off under the flower heads: the crown's middle, from the level entry's end
    // until, in the lane, it stands more than LOOK.side degrees off the heading
    const dFirst1 = firstMetre(dKnee, dTop, (q, t) => crownOff(q, t) > LOOK.side * DEG);
    await ctx.yield();
    look(crownMid, ENTRY.level, dFirst1, Math.min(LOOK.first, await weightFor(crownMid, ENTRY.level, dFirst1)), { arc: true });
    await ctx.yield();
    // (2) THE WHOLE HANGING GARDEN AND THE ELM IN ITS MIDDLE: the crown's middle again, from the far side (where the
    // fall begins and the garden stands across the round) to the place where the round under the crown begins
    // (its swell is the metres from the far side to the view: the gaze goes over to the elm as the round comes about)
    const dElm0 = N.metre(PLACE.far), swellElm = dView - dElm0;
    // THE RAIN UNDER THE BOW, on the far side of the round: THE RAIN'S ROOT (the middle of the rain heap's head, where
    // the curtain stands on its cloud and the bow's crown hangs over it): out and down over the cloud sea. Its window
    // is the stretch of the round on which the root stands before the eye, between two places of the line that the
    // line and the root alone give: WHERE THE RAIN COMES ROUND (the first metre after the leaving at which the root
    // stands less than LOOK.side degrees off the heading) and WHERE THE RAIN GOES BY (the first metre after it at
    // which the root stands further off again). It hands over to no other: it swells and lets go over half its window.
    const rainRoot = new THREE.Vector3(farSide[0].c[0], farSide[0].top, farSide[0].c[2]), rainOff = (q, t) => offHeading(t, rainRoot.x - q.x, rainRoot.z - q.z);
    const dRain0 = firstMetre(dLeaving, dView, (q, t) => rainOff(q, t) < LOOK.side * DEG);
    await ctx.yield();
    const dRain1 = firstMetre(dRain0 + 1, dView, (q, t) => rainOff(q, t) > LOOK.side * DEG);
    await ctx.yield();
    look(rainRoot, dRain0, dRain1, Math.min(LOOK.rain, await weightFor(rainRoot, dRain0, dRain1)), { steady: true, arc: true });
    await ctx.yield();
    look(crownMid, dElm0, dCrown, Math.min(LOOK.elm, await weightFor(crownMid, dElm0, dCrown, swellElm)), { steady: true, arc: true }, swellElm);
    await ctx.yield();
    // (3) THE GRAIN: its middle, from the view to the last straight's first metre (its swell is the metres from the
    // view to the crown, the straight at the elm: it swells as the elm's look lets go, one hand-over)
    const grainMid = new THREE.Vector3(G.x, G.y, G.z), swellGrain = dCrown - dView;
    look(grainMid, dView, dLast, Math.min(LOOK.grain, await weightFor(grainMid, dView, dLast, swellGrain)), { steady: true, arc: true }, swellGrain);
    await ctx.yield();
    // ---- THE PACE: slower under the brook at the top and under the crown; 1 elsewhere. Each ease is centred on its
    // place and is as wide as the stretch it eases (the top's level round; the round under the crown).
    const wTop = dLeaving - dTop, wCrown = dTrunk - dCrown;
    const pace = (u) => 1 - PACE.top * Math.exp(-(((u * L - (dTop + dLeaving) / 2) / wTop) ** 2)) - PACE.crown * Math.exp(-(((u * L - dTrunk) / wCrown) ** 2));

    const place = (mesh, i, m) => mesh.setMatrixAt(i, m);
    const flyerAt = (i, s, out) => {
      // off the spur, a loop under the crown round the trunk's line, and back to the same spur
      const p = perches[i], a0 = Math.atan2(p.at.z, p.at.x), w = smoothstep(0, 0.2, s) * (1 - smoothstep(0.8, 1, s)), a = a0 + drop.dir * TAU * s;
      out[0] = lerp(p.at.x, Math.cos(a) * drop.r, w); out[1] = lerp(p.at.y - 0.24, drop.y + 0.6 * Math.sin(2 * TAU * s), w); out[2] = lerp(p.at.z, Math.sin(a) * drop.r, w);
      return out;
    };
    return {
      scene, path, duration: FILM, pace,
      ride: 'none', companion: 'none',
      camera: { fov: LENS, near: 0.3, far: 900, lookAhead: LOOK_AHEAD, sway: 1, bank: 0.25 },
      pois,
      // THE JOIN (exit of this world, as the series' join sheet has it): the grain's mouth is the opening
      portal: { shape: 'circle', radius: 7, frame: 0, veil: '#8A5A18', revealDistance: 150, blendDistance: 25 },
      post: { exposure: 1.0, bloom: { strength: 0.4, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.08, contrast: 1.03, vignette: 0.18, grain: 0.012, aberration: 0 } },
      update(dt, time, camera, u) {
        U.uTime.value = time;
        // the elm swings from its root in the shudder (the same law as every hanging thing, at the elm's own place)
        hero.swing(U.uShud.value.z * swayAt(E.x, E.z, 0, time, shudPhase)[1]);
        hero.update(dt, time); grain.update(dt, time);
        cloudGroup.rotation.y = time * TAU / 600;
        // bees: on their flowers, or in the air between them
        for (let i = 0; i < bees.length; i++) {
          const b = bees[i], a = beeAt(b, time, shudPhase, tmpA), c = beeAt(b, time + 0.05, shudPhase, tmpB), k = Math.floor(((time + b.ph) / b.T) % 1 * 3) % 3, s = b.seats[k];
          const on = 1 - a[3], ox = (a[0] - s.x) * on, oz = (a[2] - s.z) * on;
          place(beeM.mesh, i, attitude(M4, a[0], a[1], a[2], c[0] - a[0], c[1] - a[1] + 1e-4, c[2] - a[2] + 1e-4, ox, -1, oz, b.size || 1));
        }
        beeM.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < roadBees.length; i++) { const a = roadBeeAt(road, roadBees[i], time, tmpR); place(roadM.mesh, i, attitude(M4, a[0], a[1], a[2], a[4], a[5], a[6], 0, -1, 0, a[3])); }
        roadM.mesh.instanceMatrix.needsUpdate = true;
        if (swarm) { for (let i = 0; i < SWARM.n; i++) { const b = swarm.bees[i], a = swarmAt(swarm, b, time, tmpA), c = swarmAt(swarm, b, time + 0.05, tmpB); place(swarmM.mesh, i, attitude(M4, a[0], a[1], a[2], c[0] - a[0], c[1] - a[1], c[2] - a[2], 0, -1, 0, SWARM.size)); } swarmM.mesh.instanceMatrix.needsUpdate = true; }
        for (let i = 0; i < flies.length; i++) for (let w = 0; w < 2; w++) {
          const a = flyAt(flies[i], w, time, tmpA), c = flyAt(flies[i], w, time + 0.05, tmpB);
          place(flyM.mesh, i * 2 + w, attitude(M4, a[0], a[1], a[2], c[0] - a[0], (c[1] - a[1]) * 0.4, c[2] - a[2], 0, -1, 0, 1));
        }
        flyM.mesh.instanceMatrix.needsUpdate = true;
        // the birds of the elm: head down on their spurs, shuffling; every drop.T seconds one drops off and loops
        const cyc = Math.floor((time + drop.ph) / drop.T), tau = time + drop.ph - cyc * drop.T, flyer = tau < drop.fly ? dropSpur(cyc) : -1;
        for (let i = 0; i < nPerch; i++) {
          const p = perches[i];
          if (i === flyer) {
            const s = tau / drop.fly, a = flyerAt(i, s, tmpA), c = flyerAt(i, Math.min(1, s + 0.012), tmpB), air = smoothstep(0, 0.07, s) * (1 - smoothstep(0.93, 1, s));
            place(perchM.mesh, i, attitude(M4, a[0], a[1], a[2], lerp(p.dir.x, c[0] - a[0], air), (c[1] - a[1]) * air, lerp(p.dir.z, c[2] - a[2], air), 0, -1, 0, 1));
            perchM.flap.setW(i, 1 - air);
          } else {
            const sh = 0.2 * Math.sin(time * 0.6 + perchPh[i][0]), nodd = 0.16 * Math.sin(time * 2.3 + perchPh[i][1]);
            place(perchM.mesh, i, attitude(M4, p.at.x + p.dir.x * sh, p.at.y - 0.24, p.at.z + p.dir.z * sh, p.dir.x, nodd, p.dir.z, 0, -1, 0, 1));
            perchM.flap.setW(i, 1);
          }
        }
        perchM.mesh.instanceMatrix.needsUpdate = true; perchM.flap.needsUpdate = true;
        for (let i = 0; i < nString; i++) {
          const a = ringBirdAt(ring, i, time, tmpA), c = ringBirdAt(ring, i, time + 0.05, tmpB);
          place(ringM.mesh, i, attitude(M4, a[0], a[1], a[2], c[0] - a[0], c[1] - a[1], c[2] - a[2], 0, -1, 0, BIRDS.rings[ring.of[i][0]].size));
        }
        if (wagStone) {
          const wa = time * 0.45 + wagPh, wx = wagStone[0] + Math.cos(wa) * 0.7, wz = wagStone[2] + Math.sin(wa) * 0.7;
          place(ringM.mesh, nString, attitude(M4, wx, wagStone[1] - wagStone[4] - 0.26, wz, -Math.sin(wa), 0.22 * Math.sin(time * 5.2 + wagBob), Math.cos(wa), 0, -1, 0, 1));
        }
        ringM.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose() { hero.dispose(); grain.dispose(); shared.dispose(); },
    };
  },
};
