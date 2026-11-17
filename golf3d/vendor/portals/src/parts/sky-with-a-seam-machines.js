// SKY WITH A SEAM: THE WEATHER MACHINES over the bay. The sky of this place is a painted shell and its weather is
// made by machines: from the town they pass for weather, from below and from the side they are plainly machines.
//   CLOUD BOARDS  flat cut-out clouds 0.4 m thick, painted on the side toward the town; behind, a stage flat's back:
//                 pale ply and a framing of fresh timber. WHICH CARRY A RIG (a rule of the place): the LOW boards
//                 of the mobile, which the way passes close under, each hang on TWO STOUT ROPES (GEAR.rope m) from
//                 a short trolley beam close over it (blocks, a winch; THE HANGING GEAR below); a HIGH board
//                 (never within WALLLEG.way m of the route) carries none: a painted board and its back.
//                 EVERYTHING THAT IS BUILT DRAWS AT EVERY METRE, the same from every eye: no rope, wire or piece
//                 of gear falls, fades or changes tone by metres from the eye. What thins a line is the
//                 thin-member law alone (a member thinner than 1.5 px is drawn 1.5 px wide and carries THE COVER
//                 IT TRULY HAS, its own width over the width drawn, whole: no floor under it, for rope, wire,
//                 pipe, rail, hose and rod alike; a rope far across the bay is a faint line that comes up as
//                 we near it) and the scene's haze.
//                 What is built is settled by PLACE at the build: HAIR WIRES run plumb up to the dome only from
//                 the beam of a low board whose middle hangs within GEAR.wires m, level, of its own station on
//                 the flown line. Each board creeps
//                 sideways and back by the clock (a bounded sine of its own phase). The high boards' shadows on
//                 the painted sky are this part's own soft layer (makeShades), each the shape of its board; a
//                 board throws one only where the wall behind it is near enough (its shadow falling within the
//                 second file's SHADE.far m of it): some boards of every seed do, 2 to 8 of them on the proof's
//                 seeds (the proof prints the count). THE LOW BOARDS' SHADE ON THE WATER is a shadow on a mirror
//                 by the hero's own law (the second file's lowShade): the lamp's part off the water's body light
//                 alone, where a board stands between the lamp and the water; the light passes under a board,
//                 so none lies under it, and no dark coat lies on the sea. THE LOW BOARDS' IMAGES in the sea are
//                 drawn whole: rope, wire and gear at a board's own strength at every height over the water.
//   THE RAIN RIG  A MADE MACHINE: a square rack with a deep rim plate, girders, a plated walkway with a handrail,
//                 rows of plated spray bars with brass nozzle heads, valve chests with red handwheels and a header
//                 tank (its bodies solid at every distance), hung by its four corners on FOUR-PART FALLS of stout
//                 dark rope (GEAR.stout m thick; GEAR.fall: a double block on each lug, four parts plumb up to the
//                 dome: the purchase a real rig of that weight carries); the RAIN CLOUD, a grey cloud board on
//                 its town side, hangs on four more such falls from irons at its top; hoses and four stay rods
//                 with turnbuckles tie the rack to the cloud's back. Every rope of the eight falls carries its
//                 true cover (the thin-member law above): far across the bay a fall's four parts together make
//                 one faint line, which comes up to four plain dark ropes as we near. Under the rack a
//                 PATCH OF RAIN with a soft rim (a body in the world's own metres and seconds, the second file's
//                 RAINFALL: drops 4 mm wide at one pace of fall, drawn out to short streaks aslant in many layers;
//                 where a pixel has outgrown them a layer shows their own mean, so far off the rain is a veil in
//                 shafts of thick and thin; all of it thinning to none over the rim's last metres), fine spray on the water, the sea under it a dulled mirror with rings, and the
//                 rainbow in it. WHERE IT STANDS: the world names a place (its PLACES.rain); the rig's STATION is
//                 the place of the flown line nearest it (it falls on the curve from the run north onto the bay
//                 line), its square stands along and across the line's own heading there, and ITS NEAR EDGE STANDS
//                 25 m, LEVEL, FROM THE FLOWN LINE AT EVERY PHASE (RAIN.edge: 25.5 m to port of the line at its
//                 station; the proof counts 25.0 m least from the line as flown, never under RAIN.clear). THE BOW
//                 stands whole in it over some 40 m of route at the least (in LOW SUN, the rig at the near end of
//                 its creep and the lamp at an end of its swing) and over some 120 m at the most: the proof
//                 prints the metres for each look, told and not tested (the rain stands where its rule puts it);
//                 what it tests is that the bow stands whole somewhere on the line in both looks at every phase.
//   THE PADDLES   a bank of hinged steel flaps in a sill at the wall's foot WHERE THE LINE COMES ALONGSIDE THE WALL:
//                 from PADDLE.early flaps before the wall leg's first bearing to past its last, rocking one after
//                 another. A flap stands within 150 m of the line from some 110 m before the mark C (on the bay
//                 line, as it nears the wall), through the turn and the whole wall leg (never over 45 m off there),
//                 to some 150 m past the mark E (the proof counts and prints the two metres).
// (the rain, its bow, the sea's patch and the paddles are made in sky-with-a-seam-machines-b.js with this file's tools)
//
// THE LAWS are plain functions of the route and the clock, exported for the proof (tools/film/sky-machines-proof.mjs):
// every body the clock moves is a bounded loop, counted against the flown line over every phase.
// THE LAMP: whatever follows the lamp-sun by the running clock reads THE BUILT SKY'S OWN lamp, at its dealt phase:
// the shaders through sky.shadow.uLamp (the boards' key light, the bow in the rain, the shadows on the painted sky),
// the rain's look through sky.lampAt(time). What is fixed at the build keeps the undealt law lampPlace at clock 0,
// the middle of the lamp's swing: the deal's sight lines to the rain, the painter's light on the boards, the proof
// (which counts the bow with the lamp at its swing's two ends too).
//
// PLACED TO BE SEEN FROM THE WAY (typed, the same on every seed): THE LOOK BOARD, board 0, hangs LOOK.side m to
// starboard of the bay line abeam of the metre LOOK.before m before the bay line's end, LOOK.y m up, LOOK.wide m
// wide, its painted face turned to the town's quay front as every high board's is; it carries no gear. (So the run
// north has its painted face off the starboard bow; from the bay line, north of it, its edge and then its back.)
// The other boards are dealt by the seed from a stream of their own ('cloud-boards'): each on a bearing round the
// dome's middle by its own die, in the rank near the wall or the rank far from it, wherever the rules leave room.
//
// WHERE THE HIGH BOARDS MAY HANG (rules of the place, in metres from the route, the same on every seed; THE WALL
// LEG'S RULE below): none within WALLLEG.clear m, level, of the route on its leg along the wall (from its turn at
// the wall, the metre route.C where the bay line ends, to the metre route.E where it leaves the wall); none within
// WALLLEG.way m, level, of the route off that leg (before it, and on its way out and round to the opening). Over
// the line and close beside it hang only the mobile's low boards. So the high boards hang over the open bay off
// the line (east and south-east of the town's land, over the bay's middle, along the west wall), none by the wall leg.
// THE RAIN's near edge stands 25 m from the line (RAIN.edge, as said above; never across it).
//
// WHAT DETAIL THINS (opts.detail, the world's ctx.quality.detail; a lighter build is any detail under 0.9; no law,
// place or count of boards changes with it, so the proof holds at every detail): the battens on a high board's
// back stand 11 m apart for 7.5; the rain rig's rack has 5 rows of spray bars with 10 nozzles each for 8 rows of 14; the
// rain leaves out four of its twelve streak layers each way (RAIN_THIN; the eight left carry the whole rain between
// them, each its share: the second file's RAINFALL) and the finest rings on the sea under it;
// the paddles' foam layer is cut in 96 columns along the bank for 160. Nothing else is thinned.
//
// THE PART'S DRAWS: NINE, or ten on a deal whose low boards shade the water. All the boards, the rig, the rails
// and the low boards stand in one pool of vertices and are drawn by coat (poolGeos): the bodies (every solid, the
// gear's steel among them); the thin members; the low boards' images. Then the rain's mist with its bow, its streaks and its patch on the sea;
// the paddles and their foam; the boards' shadows on the painted sky; the low boards' shade on the water. No coat
// is drawn twice (each is a ShaderMaterial, which three draws in one pass), and no two draws stand under one coat
// at one order. Every mesh is drawn at every place of the route (their vertices are set by the clock in the
// shader, so none is left to the engine's culling).
// What this part never holds: nothing lettered, no figure, no three.js light (lamps would glow by emissive).
import * as THREE from 'three';
import { makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { SHELL, SWELL, BOAT, LAMP, LAMP_LIGHT, PAINTS, GLSL_SHADOW, bearingOf, lampPlace, layRoute } from './sky-with-a-seam.js';
import { TOWN } from './sky-with-a-seam-town.js';
import { makeRain, makePaddles, makeMobile, makeShades } from './sky-with-a-seam-machines-b.js';

const RAD = Math.PI / 180, TAU = Math.PI * 2;
// the shell's height over a place of the bay
export const shellTop = (x, z) => Math.sqrt(Math.max(SHELL.R * SHELL.R - x * x - z * z, 0));
// THE WAY'S OWN MARKS that the world's build line does not hand in are read from the hero part's own layRoute (the
// world lays its path from the same call): E, the metre where the line leaves the wall, and the wall leg's two
// bearings (wallStart, wallEnd). Nothing here is a typed copy of a mark or a heading.
const WAY = layRoute();
// ---- THE ROUTE'S AXES. route: { path, length, C (the metre where the bay line ends), beta (the bay line's
// heading, degrees), rain (the world's PLACES.rain: the middle of the rain's square of sea at the middle of its creep) }
export function bayAxes(route) {
  const b = route.beta * RAD, dir = new THREE.Vector3(Math.sin(b), 0, -Math.cos(b)), port = new THREE.Vector3(dir.z, 0, -dir.x);
  return { dir, port, at: (s, out = new THREE.Vector3()) => route.path.pointAt(clamp(s / route.length, 0, 1), out) };
}
// the rain rig's own axes (a homed route's): along its square (the flown line's heading at its station), and to port
export function rigAxes(route) {
  const b = route.axis * RAD, dir = new THREE.Vector3(Math.sin(b), 0, -Math.cos(b)), port = new THREE.Vector3(dir.z, 0, -dir.x);
  return { dir, port };
}

// ---- THE RAIN RIG'S LAW: a square RAIN.side on a side. ITS STATION is the place of the flown line nearest the
// world's own place for the rain (between the marks B and C); its sides stand along and across the line's own
// heading there (route.axis), and it creeps along that heading and back by the clock, RAIN.travel m either way.
// THE WAY PASSES BESIDE THE RAIN: the square's near edge stands RAIN.edge m to port of the line at its station
// (never under RAIN.clear, never across it): where the line runs straight or curves away to starboard there, that
// edge keeps the one distance at every phase. The falling rain stands that near the way, and its bow in it.
// grey: the rain cloud, a grey board RAIN.grey.before m from the rig's middle toward the middle of the town's quay
// front, its face turned to it. seek, find: the steps, metres of line, by which the station is found.
export const RAIN = { side: 64, height: 85, travel: 10, period: 96, clear: 24, edge: 25.5, seek: 4, find: 0.25, grey: { wide: 104, before: 46, y: 79 } };
// THE RIG'S HOME. The world says where the rain stands (its PLACES.rain); this part sets its station, its heading
// and how far from the line it stands. Returns the route with rain at the rig's home, station (the metre of the
// line), axis (the square's heading, degrees) and E (the metre where the line leaves the wall).
export function homeRoute(route) {
  const F = bayAxes(route), w = route.rain, p = new THREE.Vector3(), t = new THREE.Vector3(), off = RAIN.edge + RAIN.side / 2; let m = 1e18, st = route.B;
  const seek = (from, to, step) => { for (let s = from; s <= to; s += step) { F.at(s, p); const q = (p.x - w.x) ** 2 + (p.z - w.z) ** 2; if (q < m) { m = q; st = s; } } };
  seek(route.B, route.C, RAIN.seek); seek(Math.max(st - RAIN.seek, route.B), Math.min(st + RAIN.seek, route.C), RAIN.find);      // (coarse, then fine about the nearest)
  F.at(st, p); route.path.tangentAt(clamp(st / route.length, 0, 1), t); const l = Math.hypot(t.x, t.z) || 1, hx = t.x / l, hz = t.z / l;
  return { ...route, E: route.E != null ? route.E : WAY.marks.E, world: w.clone(), station: st, axis: bearingOf(hx, hz), rain: new THREE.Vector3(p.x + hz * off, 0, p.z - hx * off) };
}
// (phase: where in its creep the rig stands at the clock's nought: one die of the part's own stream 'rain-rig',
// drawn once at the build and kept on the route as route.phase; the laws count every phase)
export const rainShift = (time, phase = 0) => RAIN.travel * Math.sin((time * TAU) / RAIN.period + phase);
export function rainCentre(route, time, out = new THREE.Vector3()) {
  const b = route.axis * RAD, k = rainShift(time, route.phase || 0);
  return out.set(route.rain.x + Math.sin(b) * k, 0, route.rain.z - Math.cos(b) * k);
}
// metres in plan from a place to the rain's square (0 inside), the square's middle being at shift k along its own heading
export function rainDistance(route, x, z, k) {
  const b = route.axis * RAD, dx = x - route.rain.x, dz = z - route.rain.z, a = dx * Math.sin(b) - dz * Math.cos(b) - k, l = dx * Math.cos(b) + dz * Math.sin(b), h = RAIN.side / 2;
  return Math.hypot(Math.max(Math.abs(a) - h, 0), Math.max(Math.abs(l) - h, 0));
}

// ---- THE BOW'S LAW. A rainbow is seen BOW.angle degrees from the line that runs from the lamp-sun through the eye,
// wherever rain stands on that ray. Its leg on one hand (side 1 or -1) is the rays from BOW.low to BOW.high degrees
// over the level; the bow STANDS WHOLE in the rain when every one of them passes through BOW.deep of the square's
// side of rain or more. lamp, eye: places; k: the rig's shift along its own heading. Returns { whole, side, length
// (metres of rain on the ray BOW.aim degrees up), aim (the middle of that ray's way through the rain, or null) }.
export const BOW = { angle: 42, low: 0.5, high: 18, deep: 0.3, aim: 9 };
const _b = { A: new THREE.Vector3(), U: new THREE.Vector3(), W: new THREE.Vector3(), D: new THREE.Vector3(), ray: new THREE.Vector3(), aim: new THREE.Vector3(), out: { whole: false, side: 0, length: 0, aim: null } };
export function bowInRain(route, lamp, eye, k = 0) {                 // (the answer is one object, written anew at each call)
  const b = route.axis * RAD, sb = Math.sin(b), cb = Math.cos(b), h = RAIN.side / 2, ca = Math.cos(BOW.angle * RAD), sa = Math.sin(BOW.angle * RAD);
  const A = _b.A.subVectors(eye, lamp).normalize(), U = _b.U.set(A.z, 0, -A.x).normalize(), W = _b.W.crossVectors(A, U), D = _b.D, up = W.y < 0 ? -1 : 1;
  const ea = (eye.x - route.rain.x) * sb - (eye.z - route.rain.z) * cb - k, el = (eye.x - route.rain.x) * cb + (eye.z - route.rain.z) * sb, out = _b.out;
  let t0 = 0, t1 = 0;
  const slab = (e, v, lo, hi) => { if (Math.abs(v) < 1e-9) { if (e < lo || e > hi) t1 = -1; return; } const a = (lo - e) / v, c = (hi - e) / v; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); };
  const through = (d) => { t0 = 0; t1 = 1e9; slab(ea, d.x * sb - d.z * cb, -h, h); slab(eye.y, d.y, 0, RAIN.height); slab(el, d.x * cb + d.z * sb, -h, h); return Math.max(t1 - t0, 0); };
  out.whole = false; out.side = 0; out.length = 0; out.aim = null;
  for (const side of [1, -1]) {
    let whole = true, n = 0, near = 1e9, len = 0, mid = 0;
    for (let ph = 0; ph <= Math.PI / 2; ph += 0.008) {
      D.copy(A).multiplyScalar(ca).addScaledVector(U, sa * Math.cos(ph) * side).addScaledVector(W, sa * Math.sin(ph) * up);
      const deg = Math.asin(clamp(D.y, -1, 1)) / RAD; if (deg < BOW.low || deg > BOW.high) continue;
      const l = through(D); n++; if (l < BOW.deep * RAIN.side) whole = false;
      if (Math.abs(deg - BOW.aim) < near) { near = Math.abs(deg - BOW.aim); len = l; mid = (t0 + t1) / 2; _b.ray.copy(D); }
    }
    if (n && (len > out.length || (whole && !out.whole))) { out.whole = whole; out.side = side; out.length = len; out.aim = len > 0 ? _b.aim.copy(eye).addScaledVector(_b.ray, mid) : null; }
  }
  return out;
}

// ---- THE PADDLES' LAW: flaps side by side along the wall's foot WHERE THE LINE COMES ALONGSIDE THE WALL: the bank
// begins PADDLE.early flaps before the wall leg's first bearing (along the turn that brings the line alongside)
// and runs on past the wall leg's last bearing by the flap that stands across it (PADDLE.from, PADDLE.count: worked
// from the hero's layRoute, its wallStart and wallEnd). Each is
// hinged on a sill under the water PADDLE.inset m inside the painted face, leaning toward the bay and back about
// its hinge. THEY ROCK TO THE BAY'S OWN SWELL (the hero's SWELL: one straight-crested wave): each flap leans by the
// swell's phase at its own place, a quarter turn behind the crest it sends out, so along the curved bank they rock
// one after another, a wave of rocking running along the bank from the flap nearest the swell's own bearing.
export const PADDLE = { early: 4, wide: 16.2, tall: 6, gap: 0.5, inset: 4.4, hingeY: -4.0, thick: 0.36, mean: 4 * RAD, swing: 11 * RAD, lead: -Math.PI / 2 };
PADDLE.pitch = (PADDLE.wide + PADDLE.gap) / (SHELL.R - PADDLE.inset) / RAD;              // degrees of bearing from flap to flap
PADDLE.from = WAY.wallStart - PADDLE.early * PADDLE.pitch; PADDLE.count = PADDLE.early + Math.ceil((WAY.wallEnd - WAY.wallStart) / PADDLE.pitch);
PADDLE.k = TAU / SWELL.length; PADDLE.w = Math.sqrt(9.81 * PADDLE.k); PADDLE.period = TAU / PADDLE.w;
export const paddleBearing = (i) => PADDLE.from + (i + 0.5) * PADDLE.pitch;
// the swell's phase at flap i's hinge (radians; the clock's part is taken off by paddleLean)
export const paddlePhase = (i) => -PADDLE.k * (SHELL.R - PADDLE.inset) * Math.cos((paddleBearing(i) - SWELL.from) * RAD);
export const paddleLean = (i, time) => PADDLE.mean + PADDLE.swing * Math.sin(paddlePhase(i) - PADDLE.w * time + PADDLE.lead);
// a point of flap i: x m along its hinge, y m up the flap from the hinge, z m off its middle plane toward the bay
export function paddlePoint(i, x, y, z, time, out = new THREE.Vector3()) {
  const b = paddleBearing(i) * RAD, a = paddleLean(i, time), rx = Math.sin(b), rz = -Math.cos(b), r = SHELL.R - PADDLE.inset;
  const up = y * Math.cos(a) - z * Math.sin(a), inw = y * Math.sin(a) + z * Math.cos(a);          // up, and toward the bay's middle
  return out.set(rx * (r - inw) + Math.cos(b) * x, PADDLE.hingeY + up, rz * (r - inw) + Math.sin(b) * x);
}

// ---- THE QUAY FRONT'S RULE. From the harbour (leg A: the route's first route.B metres) the houses of the quay
// stand to starboard; no board's lines may cross them. The measures are THE TOWN'S OWN (its TOWN, read here, in the
// axes of the route's first metre: a to starboard, b along): the house fronts stand TOWN.frontA m off, from
// b = TOWN.south to TOWN.mouth. The eyes are every place of the flown line kept at WALLLEG.step m. A board's
// line (a rope, the wire over it: an upright in plan a point) is seen ACROSS THE QUAY FRONT from an eye of leg A
// when its bearing from that eye lies on the starboard hand between the bearing of the quay's far end (less
// QUAY.margin degrees) and abeam. No line seen so may stand nearer the eye than QUAY.far m: what shows over the
// roofs from the harbour is far off, a hair line in the haze, and nothing hangs before the houses.
export const QUAY = { far: 150, margin: 2, slack: 1 };      // (slack: metres more the deals keep, for the places of a creep between the five they test)
// returns the measure for this route: (x, z) -> the least metres from an eye of leg A to that place seen across the quay front (1e9: never seen so)
export function quaySighter(route) {
  const p = new THREE.Vector3(), t = new THREE.Vector3(); route.path.pointAt(0, p); route.path.tangentAt(0, t);
  const l = Math.hypot(t.x, t.z) || 1, fx = t.x / l, fz = t.z / l, x0 = p.x, z0 = p.z, eyes = [];
  for (let s = 0; s <= route.B; s += WALLLEG.step) { route.path.pointAt(s / route.length, p); const dx = p.x - x0, dz = p.z - z0; eyes.push([-dx * fz + dz * fx, dx * fx + dz * fz]); }      // (a, b) of the eye
  return (x, z) => { const a = -(x - x0) * fz + (z - z0) * fx, b = (x - x0) * fx + (z - z0) * fz; let least = 1e9;
    for (const [ea, eb] of eyes) { const da = a - ea, db = b - eb; if (da <= 0 || db <= 0 || eb >= TOWN.mouth) continue;
      if (Math.atan2(da, db) >= Math.atan2(TOWN.frontA - ea, TOWN.mouth - eb) - QUAY.margin * RAD) least = Math.min(least, Math.hypot(da, db)); }
    return least; };
}

// the middle of the town's quay front in the world, from the town's own measures (every high board's painted face
// is turned to it)
export function quayMiddle(route) {
  const p = new THREE.Vector3(), t = new THREE.Vector3(); route.path.pointAt(0, p); route.path.tangentAt(0, t);
  const l = Math.hypot(t.x, t.z) || 1, fx = t.x / l, fz = t.z / l, b = (TOWN.south + TOWN.mouth) / 2;
  return [p.x + b * fx - TOWN.frontA * fz, p.z + b * fz + TOWN.frontA * fx];
}

// ---- THE WALL LEG'S RULE (a rule of the place). From its turn at the wall (the metre route.C, where the bay line
// ends) to where it leaves the wall (the metre route.E) the line runs along the painted wall. NO HIGH BOARD HANGS
// WITHIN WALLLEG.clear m, LEVEL, OF THE ROUTE ON THAT LEG (its whole width over its whole creep; the rig's grey
// board and the look board too): beside that leg hang only the mobile's low boards, and no high board's back
// stands between the line and the wall.
// OFF THAT LEG (the harbour, the run north, the curve and the bay line: the metres 0 to route.C; and the line's
// way out from the wall, round and down to the opening: the metres route.E to its end) no high board hangs within
// WALLLEG.way m, level, of the route: over the line and close beside it hang only the mobile's low boards.
export const WALLLEG = { clear: 120, way: 90, step: 2, slack: 1.5 };
// returns the measure for this route: (a plan segment [x0, z0, x1, z1]) -> its least level metres from that leg
// (off: from the route off it, the metres 0 to route.C and route.E to the end)
export function wallLeg(route, off = false) {
  const p = new THREE.Vector3(), pts = [], runs = off ? [[0, route.C], [route.E, route.length]] : [[route.C, route.E]];
  for (const [s0, s1] of runs) for (let s = s0; ; s += WALLLEG.step) { route.path.pointAt(Math.min(s, s1) / route.length, p); pts.push(p.x, p.z); if (s >= s1) break; }
  return (e) => { const dx = e[2] - e[0], dz = e[3] - e[1], l2 = dx * dx + dz * dz || 1; let m = 1e18;
    for (let i = 0; i < pts.length; i += 2) { const t = clamp(((pts[i] - e[0]) * dx + (pts[i + 1] - e[1]) * dz) / l2, 0, 1), ax = pts[i] - e[0] - dx * t, az = pts[i + 1] - e[1] - dz * t; m = Math.min(m, ax * ax + az * az); }
    return Math.sqrt(m); };
}

// ---- THE CLOUD BOARDS' LAW. A board is a flat cut-out in its own plane: u across (in half widths hw), v up (in half
// heights hh = hw * aspect; these are the units of the wall's own shade law, which stays the hero's: a soft lump
// 1.84 hw wide about the board's middle). ITS SHAPE IS A CUMULUS: round heaps stood along a flat base, shoulders
// on them and a head or two on the shoulders, dealt from the board's own seed (no two alike); the outline is the
// heaps' own arcs, cut crisp, and the paint is laid by the same heaps (so every heap of the outline is a painted one).
export const BOARD = { least: 14, most: 17, thick: 0.4, near: [80, 150], far: [170, 250],
  wide: [60, 140], y: [110, 240], apart: 6, rig: 30, arc: 15, heaps: 12, hang: 0.42, clear: 60, tries: 120 };
export const LOOK = { side: 150, before: 90, y: 112, wide: 96 };
// the heaps of one cloud, [x, y, r] in half widths from the board's middle (y up; its flat base at -0.4 * aspect)
function dealHeaps(s, aspect) {
  const r = makeRng(hashSeed('cloud-shape:' + s)), H = 1.3 * aspect, base = -0.4 * aspect, heaps = [];
  const rb = H * lerp(0.36, 0.46, r()), nb = clamp(Math.round((1.84 - 2 * rb) / (1.25 * rb)) + 1, 3, 6), tx = lerp(-0.42, 0.42, r());
  for (let i = 0; i < nb; i++) { const end = i === 0 || i === nb - 1, rad = rb * (end ? lerp(0.58, 0.82, r()) : lerp(0.86, 1.16, r()));
    heaps.push([lerp(-0.92 + rb * 0.8, 0.92 - rb * 0.8, i / (nb - 1)) + (r() - 0.5) * rb * 0.3, base + rad * lerp(0.3, 0.55, r()), rad]); }
  const ns = clamp(nb - 2, 2, 4), rs = H * lerp(0.27, 0.35, r()), xs = [];                              // the shoulders, highest by the tower
  for (let j = 0; j < ns; j++) { const x = clamp(tx + (j - (ns - 1) / 2) * rs * lerp(1.05, 1.4, r()), -0.92 + rb + rs * 0.5, 0.92 - rb - rs * 0.5), rad = rs * lerp(0.85, 1.12, r());
    xs.push(x); heaps.push([x, base + H * (lerp(0.5, 0.58, r()) - 0.2 * Math.min(Math.abs(x - tx), 0.5)), rad]); }
  const x0 = Math.min(...xs), x1 = Math.max(...xs), nh = r() < 0.65 ? 2 : 1;                           // the heads
  heaps.push([clamp(tx + (r() - 0.5) * rs * 0.5, x0, x1), base + H * lerp(0.7, 0.78, r()), H * lerp(0.2, 0.27, r())]);
  if (nh > 1) heaps.push([clamp(tx + (r() < 0.5 ? -1 : 1) * rs * lerp(0.9, 1.5, r()), x0, x1), base + H * lerp(0.6, 0.68, r()), H * lerp(0.16, 0.22, r())]);
  // a few small puffs stood on the outline's top (the heaped look of a cumulus head)
  const topOf = (x) => { let t = base; for (const [cx, cy, rr] of heaps) { const d = rr * rr - (x - cx) * (x - cx); if (d >= 0) t = Math.max(t, cy + Math.sqrt(d)); } return t; };
  for (let n = heaps.length, j = 0; j < 3; j++) { const x = lerp(-0.7, 0.7, r()), rad = H * lerp(0.11, 0.16, r()), sink = lerp(0.1, 0.5, r()); if (n + j < BOARD.heaps) heaps.push([x, topOf(x) - rad * sink, rad]); }
  // set true: the heaps' whole width is the shade law's 1.84 about the middle (the base stays where it is)
  let uL = 9, uR = -9; for (const h of heaps) { uL = Math.min(uL, h[0] - h[2]); uR = Math.max(uR, h[0] + h[2]); }
  const k = 1.84 / (uR - uL), mid = (uL + uR) / 2;
  return { base, heaps: heaps.map((h) => [(h[0] - mid) * k, Math.min(base + (h[1] - base) * k, base + H * 1.04 - h[2] * k), h[2] * k]) };      // (no heap over the cloud's own height)
}
// the outline by columns: u (non-uniform: every cusp between two heaps is a column, and every heap's arc is cut in
// steps of BOARD.arc degrees), top and bot in half heights; heaps as dealt (in half widths)
export function boardOutline(s, aspect = 0.5) {
  const { base, heaps } = dealHeaps(s, aspect), e = 6e-4;
  const topAt = (x) => { let t = -9, id = -1; for (let i = 0; i < heaps.length; i++) { const [cx, cy, r] = heaps[i], d = r * r - (x - cx) * (x - cx); if (d >= 0 && cy + Math.sqrt(d) > t) { t = cy + Math.sqrt(d); id = i; } } return [t, id]; };
  const botAt = (x) => { let b = 9; for (const [cx, cy, r] of heaps) { const d = r * r - (x - cx) * (x - cx); if (d >= 0) b = Math.min(b, cy - Math.sqrt(d)); } return b > 8 ? base : Math.max(b, base); };
  const uL = -0.92 + e, uR = 0.92 - e, xs = [uL, uR], N = 640, step = BOARD.arc * RAD;
  let xa = uL, ia = topAt(uL)[1];
  const run = (x0, x1, id) => { if (id < 0) return; const [cx, , r] = heaps[id], a0 = Math.acos(clamp((x0 - cx) / r, -1, 1)), a1 = Math.acos(clamp((x1 - cx) / r, -1, 1)), m = Math.ceil((a0 - a1) / step);
    for (let j = 1; j < m; j++) xs.push(cx + r * Math.cos(a0 + (a1 - a0) * j / m)); };
  for (let k = 1; k <= N; k++) {
    const x = lerp(uL, uR, k / N), id = topAt(x)[1];
    if (id === ia && k < N) continue;
    let lo = lerp(uL, uR, (k - 1) / N), hi = x;                                  // the cusp between the two heaps
    if (id !== ia) for (let q = 0; q < 22; q++) { const m = (lo + hi) / 2; if (topAt(m)[1] === ia) lo = m; else hi = m; }
    run(xa, hi, ia); if (id !== ia) xs.push(hi); xa = hi; ia = id;
  }
  for (const [cx, cy, r] of heaps) { const d = r * r - (cy - base) * (cy - base); if (d > 0) xs.push(cx - Math.sqrt(d), cx + Math.sqrt(d)); }   // where a heap's under side meets the base
  xs.sort((a, b) => a - b);
  const u = [], top = [], bot = []; let vMax = -9;
  for (const x of xs) { if (x < uL || x > uR || (u.length && x - u[u.length - 1] < 2e-3 && x < uR)) continue;
    const b = botAt(x), t = Math.max(topAt(x)[0], b); u.push(x); top.push(t / aspect); bot.push(b / aspect); vMax = Math.max(vMax, t / aspect); }
  return { n: u.length - 1, u, top, bot, uL, uR, vMax, vMin: base / aspect, heaps, aspect };
}
// a board's record: its home place (the middle of its creep), facing (a bearing, degrees: the painted side looks that
// way), half sizes in the shade law's units, the seed of its outline, and its creep (amp m, period s, phase)
function boardRecord(x, y, z, face, wide, aspect, s, amp, period, phase, light = false) {      // (light: its outline is cut later, when it has found its place)
  const o = light ? { uL: -0.92 + 6e-4, uR: 0.92 - 6e-4, vMin: -0.4, vMax: 1 } : boardOutline(s, aspect), hw = wide / (o.uR - o.uL), f = face * RAD;
  return { x, y, z, face, hw, hh: hw * aspect, s, amp, period, phase, ex: [Math.cos(f), Math.sin(f)], o, slot: 0, grey: false };
}
// where a board stands at a clock: its home plus its creep along its own plane
export const boardShift = (b, time) => b.amp * Math.sin((time * TAU) / b.period + b.phase);
export function boardCentre(b, time, out = new THREE.Vector3()) { const k = boardShift(b, time); return out.set(b.x + b.ex[0] * k, b.y, b.z + b.ex[1] * k); }
// the plan of what a board sweeps: its two ends at the two ends of its creep (and its rail's)
const reach = (b) => Math.max(b.o.uR, -b.o.uL) * b.hw + (b.grey ? 0 : b.amp) + 5;
export const ends = (b, dx = 0, dz = 0, more = 0) => { const r = reach(b) + more; return [b.x + dx - b.ex[0] * r, b.z + dz - b.ex[1] * r, b.x + dx + b.ex[0] * r, b.z + dz + b.ex[1] * r]; };
export function segDist(a, b) {                                             // metres between two plan segments [x0, z0, x1, z1]
  const ps = (px, pz, s) => { const dx = s[2] - s[0], dz = s[3] - s[1], t = clamp(((px - s[0]) * dx + (pz - s[1]) * dz) / Math.max(dx * dx + dz * dz, 1e-9), 0, 1); return Math.hypot(px - s[0] - dx * t, pz - s[1] - dz * t); };
  const side = (s, px, pz) => (s[2] - s[0]) * (pz - s[1]) - (s[3] - s[1]) * (px - s[0]);
  if (side(a, b[0], b[1]) * side(a, b[2], b[3]) < 0 && side(b, a[0], a[1]) * side(b, a[2], a[3]) < 0) return 0;
  return Math.min(ps(a[0], a[1], b), ps(a[2], a[3], b), ps(b[0], b[1], a), ps(b[2], b[3], a));
}
// THE RIG'S GREY BOARD: on the rig's town side (toward the middle of the quay front, its face turned to it), its
// base under the pipes' level; it rides with the rig
export function greyBoard(route) {
  const G = RAIN.grey, town = quayMiddle(route), face = bearingOf(town[0] - route.rain.x, town[1] - route.rain.z), f = face * RAD;
  const b = boardRecord(route.rain.x + Math.sin(f) * G.before, G.y, route.rain.z - Math.cos(f) * G.before, face, G.wide, 0.5, 0.37, 0, 1, 0);
  b.grey = true; return b;
}
// THE DEAL: board 0 is the look board (typed); the rest by the seed's own stream: each by its own die on a bearing
// round the dome's middle, alternately in the rank near the wall (BOARD.near m inside it) and the rank far from
// it (BOARD.far), drawn whole before it is tested; one that breaks a rule of the place (the wall leg's, the way's,
// the quay front's, the rig's, another board's lines, the shell's headroom) is refused (most BOARD.tries
// candidates a board; one that finds no room is left out). SO THE HIGH BOARDS HANG WHERE THE WAY LEAVES ROOM: over
// the open bay off the line, none by the wall leg. Returns the white boards; the grey one is the rig's.
export function dealBoards(seed, route) { const it = highDeal(seed, route); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// (a deal hands back to the build after every DEAL_REST candidates and after every SIGHT_REST places of the line:
// rests only, at which no die is drawn and nothing is tested, so no seed's deal depends on them)
const DEAL_REST = 4, SIGHT_REST = 3;
export function* highDeal(seed, route) {                             // (the deal in steps, a board at a step)
  const rng = makeRng(hashSeed('cloud-boards:' + seed)), F = bayAxes(route), out = [], grey = greyBoard(route);
  yield out;
  const town = quayMiddle(route), toTown = (x, z) => bearingOf(town[0] - x, town[1] - z), quay = quaySighter(route), leg = wallLeg(route), way = wallLeg(route, true), far = WALLLEG.clear + WALLLEG.slack;
  const lines = (b) => [-1, 1].map((sd) => [-1, -0.5, 0, 0.5, 1].map((q) => q * b.amp).map((k) => quay(b.x + b.ex[0] * (sd * BOARD.hang * b.hw + k), b.z + b.ex[1] * (sd * BOARD.hang * b.hw + k)))).flat();      // its two lines over its creep, against the quay front
  { const p = F.at(route.C - LOOK.before).addScaledVector(F.port, -LOOK.side);
    out.push(boardRecord(p.x, LOOK.y, p.z, toTown(p.x, p.z), LOOK.wide, 0.5, rng(), 9, 110, rng() * TAU)); }
  yield out;
  const n = BOARD.least + Math.floor(rng() * (BOARD.most - BOARD.least + 1)), half = RAIN.side / 2, bb = route.axis * RAD;
  const greyAt = [-1, -0.5, 0, 0.5, 1].map((k) => ends(grey, Math.sin(bb) * RAIN.travel * k, -Math.cos(bb) * RAIN.travel * k));
  for (let i = 1; i < n; i++) {
    const rank = i % 2 ? BOARD.near : BOARD.far;
    for (let tries = 0; tries < BOARD.tries; tries++) {
      if (tries && tries % DEAL_REST === 0) yield out;                                                // (the build rests: no die is drawn here)
      const d = []; for (let k = 0; k < 10; k++) d.push(rng());                                       // every die of this candidate, before any test
      // its place by the dice: a bearing round the dome's middle, a distance inside the wall in its rank
      const bearing = d[0] * 360, r = SHELL.R - lerp(rank[0], rank[1], d[1]), x = Math.sin(bearing * RAD) * r, z = -Math.cos(bearing * RAD) * r;
      const b = boardRecord(x, 0, z, toTown(x, z) + (d[4] - 0.5) * 12, lerp(BOARD.wide[0], Math.max(BOARD.wide[1] - tries, 80), d[2]), lerp(0.42, 0.6, d[3]), d[8], lerp(8, 16, d[5]), lerp(70, 130, d[6]), d[7] * TAU, true), e = ends(b);
      if (leg(e) < far || way(e) < WALLLEG.way + WALLLEG.slack) continue;                             // (too near the wall leg, or too near the way off it)
      const yMax = Math.min(BOARD.y[1], Math.min(shellTop(e[0], e[1]), shellTop(e[2], e[3])) - 14 - b.o.vMax * b.hh);
      if (yMax < BOARD.y[0]) continue;                                                                // no headroom under the shell there
      b.y = lerp(BOARD.y[0], yMax, d[9]);
      let ok = true;
      for (let q = 0; q <= 24 && ok; q++) { const px = lerp(e[0], e[2], q / 24), pz = lerp(e[1], e[3], q / 24), dx = px - route.rain.x, dz = pz - route.rain.z;
        const a = dx * Math.sin(bb) - dz * Math.cos(bb), l = dx * Math.cos(bb) + dz * Math.sin(bb);
        if (Math.hypot(Math.max(Math.abs(a) - half - RAIN.travel, 0), Math.max(Math.abs(l) - half, 0)) < BOARD.rig) ok = false; }   // clear of the rig, its cables and its rain
      for (const g of greyAt) if (ok && segDist(e, g) < BOARD.apart) ok = false;
      for (const o of out) if (ok && segDist(e, ends(o)) < BOARD.apart) ok = false;                   // no board in another's lines
      if (ok && Math.min(...lines(b)) < QUAY.far + QUAY.slack) ok = false;                                         // no line across the quay front
      if (ok) { b.o = boardOutline(b.s, b.hh / b.hw); out.push(b); break; }
    }
    yield out;
  }
  out.forEach((b, i) => { b.slot = i; }); grey.slot = out.length;
  return { boards: out, grey };
}

// ---- THE MOBILE OVER THE BAY: LOW.least to LOW.most LOW cloud boards along THE MOBILE'S STRETCH, which runs from
// the route's mark bayTurn (where the run north begins to curve onto the bay line) to its mark D (where the turn
// at the wall ends and the wall leg begins): lowStretch. Their
// flat bases stand 8 to 30 m over the water, each on two ropes from a travelling beam GEAR.low m up.
// We sail between them. THE TYPED RULES OF THEIR PLACES (the proof counts every one):
//   - the stretch is LOW.near equal parts and each part has its NEAR thing: a NEAR board, its skin LOW.skin m from
//     the flown line (never under LOW.clear); or the RAIN, in the parts abeam of its square (over its creep), where
//     a near board hangs too only if a berth stands free of the rain, its cloud, its sight lines and the skerries.
//     The rest are MIDDLE boards, LOW.mid m out, one to each equal part too, so that others stand behind the near
//     one at every metre;
//   - THE STRIDE: no near thing stands more than LOW.stride parts on from the near thing before it (the first
//     counted from the stretch's own start; the rain's column is a near thing too: it stands along the line from
//     its square's near end to its far end, and the stride runs to the one and on from the other), none within
//     LOW.apart m along the line of the one before (the planes' own clearance: two never stand at one place of
//     the line), and the last stands in the last LOW.last of the last part (a near thing ahead to the stretch's
//     end); a near one whose own part is out of that reach is dealt within half a part short of the reach, later
//     a whole part, never off the stretch;
//   - ITS HAND, tested for each candidate by itself: by the board's own die; but a near board abeam of the rain's
//     square (over its creep) hangs on the hand away from it, to starboard; and a board whose own far end, hung to
//     port (its distance out, half its width, its creep), would stand within LOW.wall m, level, of the painted
//     wall AS DRAWN at the height of its top hangs to starboard. THE WALL'S MARGIN (LOW.wall): no low board's
//     sweep stands nearer the painted wall than that on either hand (the dome curves in and down over that last
//     water, to the beams' own height hard by the wall: the mobile hangs in the open bay, clear of the paint);
//   - each is turned to the route as it comes (its painted face looks back along the line toward the town);
//   - none stands in the rain's square or within LOW.rig m of it, none between the flown line and the rain while the
//     bow stands in it (LOW.sight m clear of every sight line to its square from every place of the 2 m line
//     before the square's near end where the bow stands whole);
//   - no board within LOW.apart m of another's plane (in plan, over the whole of both creeps), no cable within
//     LOW.cable m of a high board's plane or rail, none in the rig's; none over a skerry of the bay (keep: the
//     bay's own things, handed in by the world; LOW.rock m clear of each skerry's round).
// Each creeps along its own plane and back by the clock (b.amp m either way). Dealt from a stream of their own.
export const LOW = { least: 10, most: 14, near: 6, stride: 1.5, last: 2 / 3, wall: 40, skin: [22, 28], clear: 20, mid: [55, 150], midClear: 45, wideNear: [25, 55], wideMid: [42, 90],
  baseNear: [8, 16], baseMid: [11, 30], rig: 18, sight: 9, apart: 9, cable: 4, back: [100, 170], lamp: 50, rock: 5, hangs: [0.42, 0.6, 0.24, 0.76], beyond: 2, tries: 140 };
// THE MOBILE'S STRETCH for a route: its two ends (marks of the route), one part of it, and the stride in metres
export const lowStretch = (route) => { const s0 = route.bayTurn, s1 = route.D, each = (s1 - s0) / LOW.near; return { s0, s1, each, ahead: LOW.stride * each }; };
// where a board's cable on the hand sd takes it, as a part of its half width (a low board's: the first of LOW.hangs that stands clear)
export const hangOf = (b, sd) => (b.hang ? b.hang[sd < 0 ? 0 : 1] : BOARD.hang);
export function dealLow(seed, route, high, grey, keep) { const it = lowDeal(seed, route, high, grey, keep); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the places a low board keeps clear of, from the bay's own list of things: its skerries, each a round-ended bar in
// plan (seg: its long axis; r: its half breadth and LOW.rock m more)
export const keepOuts = (things) => (Array.isArray(things) ? things : []).filter((t) => t && t.kind === 'skerry' && isFinite(t.x) && isFinite(t.z)).map((t) => {
  const ra = (t.spec && t.spec.ra) || 12, rb = (t.spec && t.spec.rb) || 12, f = ((t.bearing || 0) + (rb >= ra ? 0 : 90)) * RAD, h = Math.abs(rb - ra), dx = Math.sin(f) * h, dz = -Math.cos(f) * h;
  return { seg: [t.x - dx, t.z - dz, t.x + dx, t.z + dz], r: Math.min(ra, rb) + LOW.rock }; });
// (the deal in steps, a board at a step: the build rests between them)
export function* lowDeal(seed, route, high = [], grey = null, keep = []) {
  const rng = makeRng(hashSeed('low-clouds:' + seed)), F = bayAxes(route), out = [], n = LOW.least + Math.floor(rng() * (LOW.most - LOW.least + 1));
  const { s0, s1, each, ahead } = lowStretch(route), P = new THREE.Vector3(), Q = new THREE.Vector3(), bb = route.axis * RAD, half = RAIN.side / 2, quay = quaySighter(route);
  const lampB = (LAMP.looks[0].bearing + LAMP.looks[1].bearing) / 2 * RAD, lampX = Math.sin(lampB) * LAMP.R, lampZ = -Math.cos(lampB) * LAMP.R;       // the lamp-sun's home (both looks' middle)
  const line = []; for (let s = 0; s <= route.length; s += WALLLEG.step) { F.at(s, P); line.push([P.x, P.z, s]); if (line.length % 60 === 0) yield out; }               // the flown line, every place of the 2 m line
  // metres from the eye's place (on the line, BOAT.eye up) to a board's lowest skin: its base line at its height, over its whole creep
  const skin = (b, st) => { const e = ends(b, 0, 0, -5), dx = e[2] - e[0], dz = e[3] - e[1], l2 = dx * dx + dz * dz, dy = b.y + b.o.vMin * b.hh - BOAT.eye; let m = 1e18;
    for (let i = 0; i < line.length; i++) { const p = line[i];
      let t = ((p[0] - e[0]) * dx + (p[1] - e[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ax = p[0] - e[0] - dx * t, az = p[1] - e[1] - dz * t, q = ax * ax + az * az; if (q < m) m = q; }
    return Math.sqrt(m + dy * dy); };
  const greyAt = grey ? [-1, 0, 1].map((k) => ends(grey, Math.sin(bb) * RAIN.travel * k, -Math.cos(bb) * RAIN.travel * k)) : [];
  // the sight lines to the rain: from every place of the 2 m line where THE BOW STANDS WHOLE in the rain (the part's
  // own bowInRain: in either look, the lamp by the undealt law at clock 0, the middle of its swing (a place fixed at
  // the deal, the same for every build), the rig at its creep's two ends or its middle), up to the
  // square's near end at the creep's nearer end; each to the square's middle and to either hand of it
  const sights = [], lamps = [0, 1].map((k) => lampPlace(k, 0, new THREE.Vector3())); let rests = 0; {
    for (const p of line) { if (p[2] > route.station - half - RAIN.travel) continue;                    // (the line's metres before the square's near end)
      if (++rests % SIGHT_REST === 0) yield out;                                                        // (the build rests)
      F.at(p[2], P); if (!lamps.some((L) => [-1, 0, 1].some((k) => bowInRain(route, L, P, k * RAIN.travel).whole))) continue;
      const dx = route.rain.x - p[0], dz = route.rain.z - p[1], l = Math.hypot(dx, dz);
      for (const k of [-0.45, 0, 0.45]) sights.push([p[0], p[1], route.rain.x - dz / l * k * RAIN.side, route.rain.z + dx / l * k * RAIN.side]); } }
  // (the rain's column is a near thing too: it stands along the line from its square's near end, at the creep's
  // farther end, to its far end, at the creep's nearer end; the stride runs to its near end and on from its far end)
  let rainMid = 0, last = s0; { let m = 1e18; for (const p of line) { const q = (p[0] - route.rain.x) ** 2 + (p[1] - route.rain.z) ** 2; if (q < m) { m = q; rainMid = p[2]; } } }
  const rainStart = rainMid - half + RAIN.travel, rainEnd = rainMid + half - RAIN.travel, abeam = (st) => Math.abs(st - rainMid) <= half + RAIN.travel;      // (the line's metres abeam of the square over its creep)
  // level metres from a board's sweep in plan (e: its two ends over its creep) to the painted wall AS DRAWN at the height of its top
  const wallGap = (b, e) => { const top = b.y + b.o.vMax * b.hh; return Math.sqrt(Math.max(SHELL.R * SHELL.R - top * top, 0)) - Math.max(Math.hypot(e[0], e[1]), Math.hypot(e[2], e[3])); };
  const place = function* (i, near, stretch, of, from, to) {
    for (let tries = 0; tries < (near ? LOW.tries : 60); tries++) {
      if (tries && tries % DEAL_REST === 0) yield out;                                                   // (the build rests: no die is drawn here)
      const d = []; for (let k = 0; k < 12; k++) d.push(rng());                                          // every die of this candidate, before any test
      const late = near && tries >= 12;                                                                   // (a near one whose own berth is taken, by the rain, its cloud or a skerry: on along its part, then anywhere about it, and narrow)
      let st = from != null ? lerp(from, to, d[0]) : clamp(lerp(s0, s1, (stretch + (late ? tries < 40 ? lerp(0.7, 1.05, d[0]) : lerp(-0.15, 1.15, d[0]) : lerp(0.3, 0.7, d[0]))) / of), s0, s1);      // (never off the stretch)
      // (a near one whose part lies out of the reach of the near thing before it, the parts between having no free
      // berth: within half a part short of that reach, later a whole part; never off the stretch)
      if (near) { const reach = Math.min(last < rainEnd && rainStart - last <= ahead ? rainEnd + ahead : last + ahead, s1), first = stretch === LOW.near - 1 ? Math.max(last + LOW.apart, s1 - LOW.last * each) : last + LOW.apart;
        if ((st <= last + LOW.apart || st > reach) && first < reach) st = lerp(Math.max(first, reach - each * (tries < 40 ? 0.5 : 1)), reach, d[0]); }
      // (a near one: never more than the stride on from the near thing before it, the last of them in the last LOW.last of the last part)
      if (near && (st <= last || (last < rainEnd && st > rainEnd ? Math.max(rainStart - last, st - rainEnd) : st - last) > ahead || (stretch === LOW.near - 1 && st < s1 - LOW.last * each))) continue;
      F.at(st, P); F.at(st + 1, Q); const tx = Q.x - P.x, tz = Q.z - P.z, tl = Math.hypot(tx, tz) || 1;
      const wide = near ? lerp(LOW.wideNear[0], late ? lerp(LOW.wideNear[0], LOW.wideNear[1], 0.4) : LOW.wideNear[1], d[2]) : lerp(LOW.wideMid[0], LOW.wideMid[1], d[2]), aspect = near ? lerp(0.56, 0.8, d[3]) : lerp(0.48, 0.7, d[3]);
      F.at(st - lerp(LOW.back[0], LOW.back[1], d[5]), Q);                                                // the place on the line it is turned to
      // this candidate hung on a hand (1: to port): the board, its skin's metres from the eye's place, its sweep in plan
      const hang = (side) => { const px = tz / tl * side, pz = -tx / tl * side, lat0 = near ? 30 + wide / 2 : lerp(LOW.mid[0], LOW.mid[1], d[4]) + wide * 0.3;
        // (never more than LOW.lamp degrees off the lamp-sun's own bearing from it: its painted face is a sunlit one)
        const toLamp = bearingOf(lampX - (P.x + px * lat0), lampZ - (P.z + pz * lat0)), turn = ((bearingOf(Q.x - (P.x + px * lat0), Q.z - (P.z + pz * lat0)) + (d[6] - 0.5) * 16 - toLamp + 540) % 360) - 180;
        const b = boardRecord(P.x + px * lat0, 0, P.z + pz * lat0, toLamp + clamp(turn, -LOW.lamp, LOW.lamp), wide, aspect, d[7], lerp(2, 5, d[8]), lerp(30, 70, d[9]), d[10] * TAU, true);
        // (its base no higher than lets its top stand under GEAR.top m, its beam no higher than GEAR.low[1] m)
        b.y = Math.max(LOW.baseNear[0], Math.min(near ? lerp(LOW.baseNear[0], LOW.baseNear[1], d[11]) : lerp(LOW.baseMid[0], LOW.baseMid[1], d[11]), GEAR.top - (b.o.vMax - b.o.vMin) * b.hh)) - b.o.vMin * b.hh;
        if (near) { const goal = lerp(LOW.skin[0] + 1, LOW.skin[1] - 1, d[4]); let lo = 4, hi = 130;                     // out from the line until its skin stands at its distance
          for (let q = 0; q < 10; q++) { const m = (lo + hi) / 2; b.x = P.x + px * m; b.z = P.z + pz * m; if (skin(b, st) < goal) lo = m; else hi = m; }
          b.x = P.x + px * hi; b.z = P.z + pz * hi; }
        return { b, sk: skin(b, st), e: ends(b), side }; };
      // ITS HAND, tested for this very candidate: the die's hand (starboard abeam of the rain's square); and starboard
      // where, hung to port, its own far end (its distance out, half its width, its creep) would stand in the wall's margin
      let h = hang(near && abeam(st) ? -1 : d[1] < 0.5 ? 1 : -1); if (h.side > 0 && wallGap(h.b, h.e) < LOW.wall) h = hang(-1);
      const { b, sk, e, side } = h; let ok = near ? sk >= LOW.skin[0] && sk <= LOW.skin[1] : sk >= LOW.midClear;
      if (ok && wallGap(b, e) < LOW.wall) ok = false;                                                    // (the wall's margin holds on either hand)
      for (let q = 0; q <= 12 && ok; q++) { const x = lerp(e[0], e[2], q / 12), z = lerp(e[1], e[3], q / 12);
        for (const k of [-1, 0, 1]) if (rainDistance(route, x, z, k * RAIN.travel) < LOW.rig) ok = false; }
      for (const g of sights) if (ok && segDist(e, g) < LOW.sight) ok = false;
      for (const g of greyAt) if (ok && segDist(e, g) < LOW.apart) ok = false;
      for (const o of out) if (ok && segDist(e, ends(o)) < LOW.apart) ok = false;
      for (const t of keep) if (ok && segDist(e, t.seg) < t.r) ok = false;                                // not over a skerry
      b.hang = [0, 0];
      for (const sd of [-1, 1]) { if (!ok) break; let got = 0;                                            // a cable's foot over its creep: the first of the typed places that stands clear
        for (const h of LOW.hangs) { const cx = b.x + b.ex[0] * sd * h * b.hw, cz = b.z + b.ex[1] * sd * h * b.hw, c = [cx - b.ex[0] * b.amp, cz - b.ex[1] * b.amp, cx + b.ex[0] * b.amp, cz + b.ex[1] * b.amp];
          let free = rainDistance(route, cx, cz, 0) >= RAIN.travel + 14;
          for (const o of high) if (free && segDist(c, ends(o)) < LOW.cable) free = false;
          for (const g of greyAt) if (free && segDist(c, g) < LOW.cable) free = false;
          if (free) { got = h; break; } }
        if (got) b.hang[sd < 0 ? 0 : 1] = got; else ok = false;
        if (ok) for (const q of [-1, -0.5, 0, 0.5, 1]) if (quay(b.x + b.ex[0] * (sd * got * b.hw + q * b.amp), b.z + b.ex[1] * (sd * got * b.hw + q * b.amp)) < QUAY.far + QUAY.slack) ok = false; }      // no line across the quay front
      if (ok) { b.o = boardOutline(b.s, aspect); b.low = true; b.near = near; b.station = st; b.side = side; b.skin = sk; b.wired = Math.hypot(b.x - P.x, b.z - P.z) <= GEAR.wires; out.push(b); if (near) last = st; return; }
    }
  };
  for (let i = 0; i < LOW.near; i++) { yield* place(i, true, i, LOW.near); yield out; }
  for (let i = LOW.near; i < n; i++) { yield* place(i, false, i - LOW.near, n - LOW.near); yield out; }
  for (let i = 0; out.length < LOW.least && i < 12; i++) { yield* place(i, false, (i * 3 + 1) % LOW.near, LOW.near); yield out; }      // (never fewer than the least)
  // (and LOW.beyond of them or more past the bay line's end, so that boards stand ahead to the last of leg C)
  for (let i = 0; i < 4 && out.length < LOW.most && out.filter((b) => b.station > route.C).length < LOW.beyond; i++) { yield* place(i, false, 0, 1, route.C + LOW.apart, s1); yield out; }
  out.sort((a, b) => b.station - a.station);                                                             // (the farthest along first: their images are laid in this order)
  out.forEach((b, i) => { b.slot = NHIGH + i; });
  return out;
}

// ---- THE MACHINES' ONE MATERIAL: timber, ply, steel and the scene painter's cloud, lit by the dome's fill and by
// the lamp-sun from its own place (and shaded by our boat as the wall is). A vertex belongs to a SLOT (a board's
// or the rig's place at this clock: uSlot) or to none (slot -1: it stands still). A thin round member carries its
// axis (aAxis: the middle of its section, w = radius) and is never drawn under 1.5 pixels wide.
// THE LOW BOARDS' IMAGES IN THE GLASS SEA are the low boards' own triangles drawn once more (MIRROR): every vertex is set where
// the eye's ray to its image under the water meets the water (a hand over the still sea), so the image lies ON the
// water in depth and whatever stands before it hides it; its paint is the board's own, mixed into the tank's deep
// by the angle as the sea mixes its mirror of the painted sky.
export const NSLOT = 32, NHIGH = 18;                                 // the wall takes the shade of the first NHIGH
const fl = (v) => { const s = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
// (mh21 is the kit's own hash12, of src/kit/fx.js, "Hash without Sine": no sine in it; the kit's head names its
// author and licence. mvn is the common value noise: four hashed corners and a cubic fade.)
export const GLSL_VN = /* glsl */`
float mh21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float mvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mh21(i), mh21(i + vec2(1., 0.)), f.x), mix(mh21(i + vec2(0., 1.)), mh21(i + vec2(1., 1.)), f.x), f.y); }
`;
// the hanging gear's measures (THE HANGING GEAR, below): rope: a board's rope, stout; stout: the rain rig's and the
// rain cloud's ropes, stouter and dark; hair: a hair wire's thickness; wires: A RULE OF THE PLACE, fixed at the build
// and the same from every eye: hair wires run up from the beam only of a low board whose middle hangs within
// GEAR.wires m, level, of its own station on the flown line. THE PIXEL LAW OF EVERY THIN MEMBER (rope, hair wire,
// and the rain rig's pipes, rails, hoses and rods) is one: drawn no narrower than 1.5 px, it carries the cover it
// truly has (its width over the width drawn); there is no floor. No rope, wire or gear is thinned or toned by
// metres from the eye: the pixel's true cover and the scene's haze alone.
// fall: THE RAIN RIG'S FALLS. What reads far off is the BODY, never the pixel law: each of the rig's eight hanging
// points is A FOUR-PART FALL of the stout rope, the purchase a real rig of that weight carries (a double block at
// the dome, out of sight, and a double block on the lug or iron; each of the two sheaves carries two parts):
// sheave: the sheaves' diameter (the two parts of one sheave stand this far apart); pin: the two sheaves' distance
// on their pin. Four parts are 1.6 m of rope in a band 1 to 1.9 m wide where one rope was 0.4 m.
export const GEAR = { rope: 0.3, stout: 0.4, hair: 0.06, wires: 60, over: 8, low: [40, 66], top: 58, end: 2.2, fall: { sheave: 1.4, pin: 0.6 } };
// where a fall's four parts stand about its middle line: [metres across the sheaves, metres along their pin]
export const fallParts = () => [-1, 1].flatMap((a) => [-1, 1].map((l) => [a * GEAR.fall.sheave / 2, l * GEAR.fall.pin / 2]));
// how far a fall's outermost part reaches from its middle line (the rope's own half thickness counted)
export const fallReach = () => Math.hypot(GEAR.fall.sheave, GEAR.fall.pin) / 2 + GEAR.stout / 2;
const MACH_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aAxis, aPaint; attribute vec2 aInfo;       // aInfo: slot, kind; aPaint: m across, m up, 0..1 up the board, seed
uniform vec3 uSlot[${NSLOT}]; uniform float uPix;
varying vec3 vCol, vN, vW; varying vec4 vPaint; varying float vKind, vCover, vSlot;
#include <fog_pars_vertex>
void main(){
  vCover = 2.; vec3 base = vec3(0.); if (aInfo.x > -.5) base = uSlot[int(aInfo.x + .5)];      // (a body: whole; a thin member says its cover below, 1 at the most, and is told from a body by it)
  vec3 p = position, eye = cameraPosition;
#ifdef MIRROR
  eye.y = -eye.y;                                                               // an image is seen as from the eye's own image under the water
#endif
  if (aAxis.w > 0.) { float dist = length(eye - (base + aAxis.xyz));
    // (a member thinner than 1.5 px is drawn 1.5 px wide and carries THE COVER IT TRULY HAS, its own width over the
    // width drawn, whole: rope, hair wire, pipe, rail, hose and rod alike; no floor under it and no share of it)
    float want = max(aAxis.w, .75 * uPix * dist / projectionMatrix[1][1]); p = aAxis.xyz + (position - aAxis.xyz) * (want / aAxis.w); vCover = aAxis.w / want; }
  vec4 wp = vec4(base + p, 1.); vW = wp.xyz; vN = normal; vCol = aCol; vPaint = aPaint; vKind = aInfo.y; vSlot = aInfo.x;
#ifdef MIRROR
  float k = clamp((cameraPosition.y - .25) / max(cameraPosition.y + wp.y, 1e-3), 1e-3, 1.);
  vec4 mvPosition = viewMatrix * vec4(cameraPosition + (vec3(wp.x, -wp.y, wp.z) - cameraPosition) * k, 1.);
  gl_Position = (projectionMatrix * mvPosition) / k;                            // (the same place on the water, weighed as the image's own depth: the paint is laid true)
#else
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#endif
  #include <fog_vertex>
}`;
// A BOARD'S NUMBERS ride in a half-float texture, two rows to a board: the number as a half float holds it, and under
// it what the half float lost of it (so the sum is the number itself to a hundredth of a millimetre). texelFetch
// is an explicit-level fetch (level 0, by whole texel: no derivative is taken), so it may stand in a loop or a branch.
export const GLSL_HEAP = /* glsl */`
vec4 heapAt(int i, int row){ return texelFetch(uHeaps, ivec2(i, 2 * row), 0) + texelFetch(uHeaps, ivec2(i, 2 * row + 1), 0); }`;
const MACH_FRAG = /* glsl */`
uniform vec3 uLampCol, uFillCol, uCloudLit, uCloudShade, uBounce, uBack, uHaze, uDeep; uniform float uKey, uFill, uBlush, uSeaTime; uniform sampler2D uHeaps;
varying vec3 vCol, vN, vW; varying vec4 vPaint; varying float vKind, vCover, vSlot;
${GLSL_HEAP}
${GLSL_VN}
${GLSL_SHADOW}
#include <fog_pars_fragment>
// a line of half width w, d m from its middle, under a pixel fw m wide: where the pixel outgrows it, it is drawn a
// pixel wide and carries its width over the width drawn, so that across it the line lays its true cover, 2 w, whole
// at every footprint
float mln(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }
// THE PAINT OF A CLOUD BOARD, as the wall's own clouds are painted (the hero's cumulus law, here in metres): the
// board's heaps (uHeaps: a row to a board; its first place holds how many, the lamp's side, the base's height and
// the cloud's height; its second the way its painted face looks; then each heap's middle and radius) melt into one another, each lit from the lamp-sun's side
// and from above, soft creases between them, the flat base in shade. Returns the paint's light, 0 shade .. 1 lit.
float cloudLight(vec4 q, float fw){
  int row = int(vSlot + .5); vec4 m = heapAt(0, row); int n = int(m.x + .5);
  vec2 nz = vec2(mvn(q.xy / 14. + q.w * 17.) * .57 + mvn(q.xy / 6.6 + 3.) * .29 + mvn(q.xy / 3.2 + 7.) * .14, mvn(q.xy / 47. + q.w * 5.) * .6 + mvn(q.xy / 21. + 1.7) * .4);
  vec2 p = q.xy + (nz.yx - .5) * m.w * vec2(.2, .12);
  float f1 = -1., f2 = -1., ws = 1e-4; vec2 nb = vec2(0., 1e-4);
  for (int j = 0; j < ${BOARD.heaps}; j++){ if (j >= n) break; vec4 h = heapAt(j + 2, row);
    vec2 d = (p - h.xy) / max(h.z, 1e-3); float f = 1. - length(d), w = exp(min(f, 1.) * 7.); nb += d * w; ws += w;
    if (f > f1) { f2 = f1; f1 = f; } else if (f > f2) f2 = f; }
  vec2 nn = nb / ws; nn /= max(length(nn), .35);                       // (a heap's broad face is flat to the light)
  float lit = .56 + .44 * dot(nn, normalize(vec2(m.y * .8, .62)));
  lit -= .12 * (1. - smoothstep(0., .3, f1 - f2)) * smoothstep(.1, .5, f1);          // the soft creases between the heaps
  lit *= .38 + .62 * smoothstep(-.02, .5, (q.y - m.z) / max(m.w, 1e-3));                         // the shadowed base
  lit += (nz.x - .5) * .3;
  // the brush: strokes a metre wide laid slanting (seen near)
  float bc = mvn(vec2(q.x / 3.4 + q.y * .35 + q.w * 30., q.y / .95 - q.x * .08)) * .6 + mvn(vec2(q.x / 1.3 + 7., q.y / .42 + q.w * 11.)) * .4;
  return clamp(lit + (bc - .5) * .16 * (1. - smoothstep(.3, 1.3, fw)), 0., 1.); }
vec3 cloudPaint(vec4 q, float fw, float grey){
  float lit = cloudLight(q, fw), t = smoothstep(.16, .86, lit);
  vec3 cc = mix(uCloudShade, uCloudLit, t);
  cc = mix(cc, cc * vec3(1.06, .9, .82), uBlush * (1. - lit) * .8) + uBlush * vec3(.1, .02, -.02) * lit;
  // the rig's rain cloud: a soft grey, its base darker
  vec3 gg = mix(uCloudShade * vec3(.4, .43, .5), mix(uCloudShade, uCloudLit, .55) * vec3(.74, .77, .83), t);
  return mix(cc, gg, grey); }
void main(){
  vec3 n = normalize(vN + 1e-5), L = uLamp - vW; float ld = max(length(L), 1.); L /= ld;
  float fw = max(length(fwidth(vW)), 1e-3), ndl = max(dot(n, L), 0.);
  vec3 col = vCol; float key = uKey * ndl, fill = .86 + .14 * n.y, sea = 1.;
  if ((vKind > .5 && vKind < 1.5) || (vKind > 2.5 && vKind < 3.5)) {            // the painted side takes the light as the wall's paint does
    col = cloudPaint(vPaint, fw, step(2.5, vKind)); key = uKey * .8 * smoothstep(0., .22, ndl); fill = 1.; sea = 0.; }
  else if (vKind > 1.5 && vKind < 2.5) {
    // bare ply: sheets 2.44 by 1.22 m, each course set half a sheet along, each sheet its own shade, a hairline between
    vec2 s = vec2(vPaint.x / 2.44 + .5 * mod(floor(vPaint.y / 1.22), 2.), vPaint.y / 1.22), f = fract(s);
    float d = min(min(f.x, 1. - f.x) * 2.44, min(f.y, 1. - f.y) * 1.22), near = 1. - smoothstep(.15, 1.1, fw);
    col *= 1. + (mh21(floor(s) + vPaint.w * 91.) - .5) * .22 * near;                 // (each sheet's shade: as often light as dark, its mean is the bare ply)
    // THE HAIRLINE ENDS AT ITS OWN MEAN, not at bare ply: a dark line .04 m wide along every joint, one every 2.44 m
    // across and one every 1.22 m up, covers .04 / 2.44 + .04 / 1.22 = .0492 of the face (so .0148 darker at its
    // strength .3); where the pixel outgrows the sheets the footprint's ramp lets the line go to that
    col *= 1. - .3 * mix(.0492, mln(d, .02, fw), near);
    col *= 1. + (mvn(vec2(vPaint.x / .5, vPaint.y / .06)) - .5) * .12 * (1. - smoothstep(.02, .2, fw));      // (the grain: about its mean)
  }
  key *= 1. - boatShade(vW, min(fw, 2.));
  // the dome's fill, the sea's light from below and from the far side, the lamp's key. A BOARD'S BACK IS A STAGE
  // FLAT'S: its ply, its fresh timber and its ropes are pale things that catch the sea's light and the lit far wall's
  // (uBack: with the fill it brings a face turned from the lamp to its own colour, never under a mid tone)
  float pale = step(1.5, vKind) * step(vKind, 2.5) + step(3.5, vKind) * step(vKind, 5.5);
  vec3 lit = uFillCol * uFill * fill + mix(uBounce, uBack, pale) * sea * (.6 - .4 * dot(n, L) - .35 * n.y) + uLampCol * key;
  vec3 c = col * lit; float a = clamp(vCover, 0., 1.);
  // a hair wire over a beam: pale steel, lit by the dome and the lamp; its whole length draws, by its pixel's cover
  if (vKind > 5.5 && vKind < 6.5) c = mix(uHaze, vec3(1.), .3) * (uFillCol * uFill + uLampCol * uKey * .7);
  // EVERY ROPE, WIRE AND PIECE OF GEAR THAT IS BUILT DRAWS AT EVERY METRE, the same from every eye: nothing here
  // falls or changes tone by metres from the eye. The thin-member law (a line at least 1.5 px wide, its cover as
  // alpha) and the scene's own haze are all that thin a line.
  // A THIN MEMBER IS ROUND AND IS DRAWN BY ITS NEAR HALF ALONE, every one of them (rope, hair wire, the gear's thin
  // steel, the rain rig's pipes, nozzles, handrail, hoses and stay rods): the half of its skin whose stated normal,
  // which every tube states pointing out from its axis, is turned to the eye. So its cover is laid once, and where
  // it is resolved its lit side is the one seen. (A thin member is told by vCover, 1 at the most; a body carries 2.)
#ifndef MIRROR
  if (vCover < 1.5 && dot(n, cameraPosition - vW) < 0.) discard;
#endif
#ifdef MIRROR
  // the image: mixed into the tank's deep by the angle (as the sea mixes its mirror of the sky), broken a little by
  // the ripples at the water's own place
  vec3 im = vec3(vW.x, -vW.y, vW.z), V = normalize(im - cameraPosition);
  float fr = .09 + .91 * pow(max(1. - clamp(-V.y, 0., 1.), 1e-4), 3.), kk = cameraPosition.y / max(cameraPosition.y + vW.y, 1e-3);
  vec2 wx = cameraPosition.xz + (im.xz - cameraPosition.xz) * kk; float fww = max(length(fwidth(wx)), 1e-3);
  float rp = mvn(wx * .55 + uSeaTime * vec2(.1, .16)) * .55 + mvn(wx * 1.9 - uSeaTime * vec2(.27, .12)) * .45;
  c = mix(uDeep * (uFillCol * uFill + uLampCol * uKey * .25), c, fr);
  // (the ripples break an image a little; where a pixel holds many ripples they are let go to THEIR OWN MEAN, .5: the
  // two noises are as often over a half as under it, so the step from .3 to .7 averages a half; counted, 0.499)
  // THE IMAGE IS DRAWN WHOLE: a rope's, a wire's and the gear's image carry the same strength as a board's at every
  // height over the water (a thin member by its true cover, as in the air): no share of it, no fade by height
  a *= .96 - .2 * mix(smoothstep(.3, .7, rp), .5, smoothstep(.5, 2.5, fww));
  // what the mirror shows of a board: its painted face from before it, its back and framing from behind it, and of
  // either only what looks toward the eye's image (the image is laid in one coat, so this is its hiding)
  vec4 m2 = heapAt(1, int(vSlot + .5)); vec3 E2 = vec3(cameraPosition.x, -cameraPosition.y, cameraPosition.z) - vW;
  float front = dot(vec3(m2.x, 0., m2.y), E2), painted = 1. - sea;
  bool line = (vKind > 3.5 && vKind < 4.5) || (vKind > 5.5 && vKind < 6.5), gear = vKind > 6.5;
  // (ropes, wires and the gear over a board's top show from both its sides)
  if (vW.y < 0. || dot(vN, E2) < 0. || (painted > .5 ? front < 0. : (front > 0. && ((!line && !gear) || (line && vPaint.w > .5))))) discard;
#endif
  if (a < .0039) discard;                                                            // (under one level in 255: nothing is laid, so nothing is let go)
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;

// the builder of the machines' geometry: indexed, every face with its own stated normal (nothing is flipped by the
// eye). slot: the place it rides (-1: none); kind: 0 plain colour, 1 painted cloud, 2 bare ply, 3 the grey cloud,
// 4 a rope, 5 the timber of a board's framing, 6 a hair wire, 7 the steel of the hanging gear (plain colour),
// 8 the rain rig's hardware (plain colour).
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.A = []; this.I = []; this.Q = []; this.X = []; this.col = new THREE.Color('#888888'); this.slot = -1; this.kind = 0; this.count = 0; this.thin = null; }
  color(hex, m = 1) { this.col.set(hex).multiplyScalar(m); return this; }
  vert(p, n, ax, q) {
    this.P.push(p.x, p.y, p.z); this.N.push(n.x, n.y, n.z); this.C.push(this.col.r, this.col.g, this.col.b); this.I.push(this.slot, this.kind);
    if (ax) this.A.push(ax[0].x, ax[0].y, ax[0].z, ax[1]); else this.A.push(0, 0, 0, 0);
    if (q) this.Q.push(q[0], q[1], q[2], q[3]); else this.Q.push(0, 0, 0, 0);
    return this.count++;
  }
  // a flat quad a, b, c, d under one normal; q: the four corners' paint, or none
  quad(a, b, c, d, n, q) { const i = this.vert(a, n, null, q && q[0]); this.vert(b, n, null, q && q[1]); this.vert(c, n, null, q && q[2]); this.vert(d, n, null, q && q[3]);
    this.X.push(i, i + 1, i + 2, i, i + 2, i + 3); return this; }
  // a box about c with half sizes along the unit axes ex, ey, ez; skip: faces left out, e.g. '-z+x'
  box(c, ex, ey, ez, hx, hy, hz, skip = '') {
    const v = (i, j, k) => c.clone().addScaledVector(ex, i * hx).addScaledVector(ey, j * hy).addScaledVector(ez, k * hz), neg = (a) => a.clone().negate();
    if (!skip.includes('+x')) this.quad(v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1), ex);
    if (!skip.includes('-x')) this.quad(v(-1, -1, -1), v(-1, 1, -1), v(-1, 1, 1), v(-1, -1, 1), neg(ex));
    if (!skip.includes('+y')) this.quad(v(-1, 1, -1), v(1, 1, -1), v(1, 1, 1), v(-1, 1, 1), ey);
    if (!skip.includes('-y')) this.quad(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), neg(ey));
    if (!skip.includes('+z')) this.quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), ez);
    if (!skip.includes('-z')) this.quad(v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1), neg(ez));
    return this;
  }
  // a round member from a to b, radius r, n sides, smooth; thin = true keeps it 1.5 px wide at any distance, drawn
  // by the part of the pixel it covers (it goes to this builder's companion for thin members, when it has one);
  // flag 1: a rope's run down the back of its board (the board's image hides it from before)
  tube(a, b, r, n = 6, thin = false, flag = 0) {
    if (thin && this.thin) { const t = this.thin; t.slot = this.slot; t.kind = this.kind === 4 || this.kind === 6 || this.kind === 7 ? this.kind : 0; t.col.copy(this.col); t.tube(a, b, r, n, true, flag); return this; }
    const d = new THREE.Vector3().subVectors(b, a), u = Math.abs(d.y) > 0.9 * d.length() ? V3(1, 0, 0) : V3(0, 1, 0);
    const e1 = new THREE.Vector3().crossVectors(u, d).normalize(), e2 = new THREE.Vector3().crossVectors(d, e1).normalize(), i0 = this.count;
    for (let i = 0; i <= n; i++) { const an = (i / n) * TAU, nr = e1.clone().multiplyScalar(Math.cos(an)).addScaledVector(e2, Math.sin(an));
      this.vert(a.clone().addScaledVector(nr, r), nr, thin && [a, r], [0, 0, 0, flag]); this.vert(b.clone().addScaledVector(nr, r), nr, thin && [b, r], [0, d.length(), 1, flag]); }      // (paint: metres along it, and its flag)
    for (let i = 0; i < n; i++) { const k = i0 + i * 2; this.X.push(k, k + 2, k + 3, k, k + 3, k + 1); }
    return this;
  }
  // a disc about c facing along ax (unit), radius r
  disc(c, ax, r, n = 10) {
    const u = Math.abs(ax.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0), e1 = new THREE.Vector3().crossVectors(u, ax).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1), i0 = this.vert(c, ax);
    for (let i = 0; i <= n; i++) { const an = (i / n) * TAU; this.vert(c.clone().addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r), ax); }
    for (let i = 0; i < n; i++) this.X.push(i0, i0 + 1 + i, i0 + 2 + i);
    return this;
  }
  get triangles() { return this.X.length / 3; }
  // this builder's triangles in two lists: all but the steel; and the steel of the hanging gear and the rain rig's
  // hardware (kinds 7 and 8). Both are solids under the body's coat (no thin member is among them: every thin tube
  // goes to the builder's thin companion); the two lists only keep the order in which the image's coat lays them
  split() { const X = this.X, I = this.I, plain = [], steel = [];
    for (let i = 0; i < X.length; i += 3) (I[X[i] * 2 + 1] > 6.5 ? steel : plain).push(X[i], X[i + 1], X[i + 2]);
    return [plain, steel]; }
}
// THE MACHINES' DRAWS ARE JOINED BY COAT, NOT BY BOARD OR BY BUILDER (poolGeos). Every vertex of the high boards,
// the rig, the rails, the low boards and all their thin members stands in ONE POOL of attributes (the slots move
// them, uSlot, so one pool serves them all), and a draw is a list of the pool's triangles under one coat:
//   bodies: every builder's bodies and steel, all solids (the body's coat: it hides and is hidden by depth);
//   thin:   every builder's thin members (the thin coat);
//   image:  the low boards' own bodies, then their steel, then their own thin members (the image's coat).
// THREE DRAWS where ten were. Inside each list the builders stand in the order they were drawn in when each was
// a mesh of its own (the low boards; the high boards and the rig; the rails), so what is laid over what is as it
// was. geos: [low, low.thin, moving, moving.thin, still, still.thin]. The build rests between attributes.
export async function poolGeos(ctx, geos) {
  const first = [], attrs = []; let total = 0; for (const g of geos) { first.push(total); total += g.count; }
  for (const [name, key, n] of [['position', 'P', 3], ['normal', 'N', 3], ['aCol', 'C', 3], ['aAxis', 'A', 4], ['aInfo', 'I', 2], ['aPaint', 'Q', 4]]) {
    const a = new Float32Array(total * n); geos.forEach((g, i) => a.set(g[key], first[i] * n)); attrs.push([name, new THREE.BufferAttribute(a, n)]); await ctx.yield(); }
  const lists = []; for (const g of geos) { lists.push(g.split()); await ctx.yield(); }
  const lay = (parts) => { let n = 0, k = 0; for (const [i, j] of parts) n += lists[i][j].length; const out = new Uint32Array(n);
    for (const [i, j] of parts) { const l = lists[i][j], o = first[i]; for (let q = 0; q < l.length; q++) out[k++] = l[q] + o; } return out; };
  const geom = (index) => { const g = new THREE.BufferGeometry(); for (const [name, a] of attrs) g.setAttribute(name, a);
    g.setIndex(new THREE.BufferAttribute(index, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 40); return g; };
  const bodies = geom(lay([[0, 0], [2, 0], [4, 0], [0, 1], [2, 1], [4, 1]]));
  await ctx.yield();
  return { bodies, thin: geom(lay([[1, 0], [1, 1], [3, 0], [3, 1], [5, 0], [5, 1]])), image: geom(lay([[0, 0], [0, 1], [1, 0], [1, 1]])) };
}
// the part's coats (one set of uniforms): the bodies' (every solid: boards, timber, the gear's steel, the rig's
// hardware), the thin members' (blended by the pixel's cover) and the images'.
// sky: what the hero's makeSky gave (the lamp's place and our boat's are its own two uniform objects)
export function machineMaterials(look, sky, sea) {
  const P = PAINTS[look], LL = LAMP_LIGHT[look], c = (h, m = 1) => ({ value: new THREE.Color(h).multiplyScalar(m) }), SU = (sea && sea.uniforms) || {};
  // the boards' heaps: a row to a slot (metres from the board's middle): [count, lamp's side, base, height], then the heaps
  const HW = BOARD.heaps + 2, heaps = new THREE.DataTexture(new Uint16Array(HW * NSLOT * 8), HW, NSLOT * 2, THREE.RGBAFormat, THREE.HalfFloatType);
  heaps.magFilter = heaps.minFilter = THREE.NearestFilter; heaps.generateMipmaps = false; heaps.needsUpdate = true;
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLamp: sky.shadow.uLamp, uBoat: sky.shadow.uBoat, uPix: { value: 2 / 720 },      // (uPix: two over the drawing buffer's height, set at every update from the renderer's own size; this first value serves only until then)
    uSlot: { value: Array.from({ length: NSLOT }, () => new THREE.Vector3()) }, uHeaps: { value: heaps },
    uSeaTime: SU.uTime || { value: 0 }, uDeep: SU.uDeep || c(look ? '#1c3048' : '#0a3550'),
    uLampCol: { value: new THREE.Color().setRGB(lerp(1, LL.color[0], 0.5), lerp(1, LL.color[1], 0.5), lerp(1, LL.color[2], 0.5)) }, uFillCol: c(P.fill),
    uCloudLit: c(P.cloudLit), uCloudShade: c(P.cloudShade), uBounce: c(P.haze, 0.34), uBack: c(P.cloudLit, 0.72), uHaze: c(P.haze), uKey: { value: LL.key }, uFill: { value: LL.fill }, uBlush: { value: P.blush } };
  const base = { vertexShader: MACH_VERT, fragmentShader: MACH_FRAG, fog: true, side: THREE.DoubleSide, uniforms };
  const body = new THREE.ShaderMaterial(base), thin = new THREE.ShaderMaterial({ ...base, transparent: true, depthWrite: false });
  const image = new THREE.ShaderMaterial({ ...base, defines: { MIRROR: 1 }, transparent: true, depthWrite: false });
  // says a board's heaps to the paint (its row is its slot)
  const half = THREE.DataUtils.toHalfFloat, whole = THREE.DataUtils.fromHalfFloat;
  const paint = (b, lamp) => { const d = heaps.image.data, f = b.face * RAD, dx = lamp.x - b.x, dz = lamp.z - b.z, l = Math.hypot(dx, dz) || 1;
    const put = (vals, at) => vals.forEach((v, k) => { const o = (b.slot * 2 * HW + at) * 4 + k, h = half(v); d[o] = h; d[o + HW * 4] = half(v - whole(h)); });      // (the row under: what the half float lost)
    put([b.o.heaps.length, clamp((dx * b.ex[0] + dz * b.ex[1]) / l * 2.5, -1, 1), b.o.vMin * b.hh, (b.o.vMax - b.o.vMin) * b.hh], 0);
    put([Math.sin(f), -Math.cos(f), 0, 0], 1); b.o.heaps.forEach((h, j) => put([h[0] * b.hw, h[1] * b.hw, h[2] * b.hw, 0], j + 2)); heaps.needsUpdate = true; };
  // (every coat here is a ShaderMaterial: three r170 draws a see-through two-sided ShaderMaterial in ONE pass, its
  // forceSinglePass being true from the constructor; no coat of this part is drawn twice)
  return { body, thin, image, uniforms, heaps, paint };
}

// ---- THE HANGING GEAR: what one sees a LOW cloud board hang by (a high board carries none; its law keeps a
// beam's place GEAR.over m over its top for the deal's tests). Over the board a short TROLLEY BEAM (an I-beam with
// yellow stops, GEAR.low[0] to GEAR.low[1] m over the
// water), under it a PULLEY BLOCK on its trolley over each of the board's TWO ROPES (GEAR.rope m thick, pale hemp,
// round: the lamp-sun lights one side), each rope running down the board's back to a shackle on a spreader bar at
// the framing's foot; and over each block of the beam of a board that hangs within GEAR.wires m, level, of the
// flown line, one HAIR WIRE (GEAR.hair m) plumb up to the dome. Beam, blocks, ropes and wires ride with the board
// and draw at every metre; a line thinner than a pixel is thinned by its pixel's cover alone (the head).
export const beamY = (b) => (b.low ? clamp(b.y + b.o.vMax * b.hh + 7, GEAR.low[0], GEAR.low[1]) : b.y + b.o.vMax * b.hh + GEAR.over);
const TIMBER = '#f8efd9', PLY = '#e4d2b3', STEELD = '#2b2f36', STEEL = '#6f7882', BEAM = '#9aa4ae', STOP = '#f4d24a', HEMP = '#a88f62', HAIR = '#dfe6ea', TAR = '#3a342c';
// one I-beam from a to b (its web upright; nz: level, across it), a yellow stop at either end
export function gearBeam(G, a, b, up, nz) {
  const ax = new THREE.Vector3().subVectors(b, a), l = ax.length(), c = a.clone().add(b).multiplyScalar(0.5); ax.normalize();
  G.kind = 7; G.color(BEAM); for (const s of [-1, 1]) G.box(c.clone().addScaledVector(up, s * 0.42), ax, up, nz, l / 2, 0.05, 0.3, '+x-x');
  G.color(BEAM, 0.78); G.box(c, ax, up, nz, l / 2, 0.37, 0.05, '+y-y+x-x');
  G.color(STOP); for (const e of [a, b]) G.box(e, ax, up, nz, 0.14, 0.62, 0.36);
  G.kind = 0;
}
// one rope's gear under a beam whose middle line stands at the height top over the rope's foot (foot: where the
// shackle sits; ax: along the beam): the shackle, THE ROPE, the block (a sheave between two yellow cheeks) on its
// trolley, and the hair wire on up to the height wire (0: none). back: the metres of the rope's foot that run down
// the back of a board (a flown flat's line runs down its back to a hanging iron at its foot; 0: none)
export function gearRope(G, foot, top, ax, up, nz, wire = 0, back = 0) {
  const p = (x, y, d = 0) => foot.clone().addScaledVector(ax, x).addScaledVector(up, y).addScaledVector(nz, d), H = top - foot.y, sy = H - 1.9;      // (y: metres over the foot; sy: the sheave's middle)
  G.kind = back ? 0 : 7; G.color(STEEL);                                                                 // the shackle: a bow over its pin
  for (const s of [-1, 1]) G.box(p(s * 0.22, 0.36), ax, up, nz, 0.05, 0.36, 0.05, '+y-y'); G.box(p(0, 0.76), ax, up, nz, 0.27, 0.05, 0.05, '-y');
  G.kind = 7; G.color('#c3c8ce'); G.tube(p(0, sy, -0.1), p(0, sy, 0.1), 0.52, 8); G.disc(p(0, sy, 0.1), nz, 0.52, 8); G.disc(p(0, sy, -0.1), nz.clone().negate(), 0.52, 8);      // the sheave
  G.color(STOP, 0.95); for (const s of [-1, 1]) G.box(p(0, sy + 0.35, s * 0.17), ax, up, nz, 0.36, 0.95, 0.035, s > 0 ? '-z' : '+z');      // the block's two cheeks
  G.color(STEELD, 1.3); G.box(p(0, H - 0.62), ax, up, nz, 0.55, 0.17, 0.4, '+y');                        // the trolley under the beam's lower flange
  G.color(HEMP); G.kind = 4;                                                                             // THE ROPE
  if (back > 1) G.tube(p(0, 0.78), p(0, back), GEAR.rope / 2, 6, true, 1);
  G.tube(p(0, Math.max(back, 0.78)), p(0, sy - 0.5), GEAR.rope / 2, 6, true);
  if (wire > H + 2) { G.color(HAIR); G.kind = 6; G.tube(p(0, H + 0.5), p(0, wire), GEAR.hair / 2, 4, true); }     // the hair wire, on up to the dome
  G.kind = 0;
}

// ---- ONE CLOUD BOARD into the geometry G (in its slot's own axes: metres from the board's middle), with its hanging
// gear. opts: { detail, low (a low board of the mobile: its battens closer, a winch on its beam), part (1: its
// faces and edge only; 2: its framing, and a high board's or the rain cloud's irons and ropes; 3: a low board's
// gear alone; none: all of it: the build rests between the parts) }
export function buildBoard(G, S, b, opts = {}) {
  const o = b.o, f = b.face * RAD, ex = V3(b.ex[0], 0, b.ex[1]), up = V3(0, 1, 0), nf = V3(Math.sin(f), 0, -Math.cos(f)), nb = nf.clone().negate();
  const T = BOARD.thick / 2, P = (u, v, d) => V3(0, 0, 0).addScaledVector(ex, u * b.hw).addScaledVector(up, v * b.hh).addScaledVector(nf, d);
  const q = (u, v) => [u * b.hw, v * b.hh, (v - o.vMin) / (o.vMax - o.vMin), b.s];
  G.slot = b.slot;
  if (opts.part == null || opts.part === 1) for (let i = 0; i < o.n; i++) {
    const u0 = o.u[i], u1 = o.u[i + 1], qs = [q(u0, o.bot[i]), q(u1, o.bot[i + 1]), q(u1, o.top[i + 1]), q(u0, o.top[i])];
    G.kind = b.grey ? 3 : 1; G.color('#ffffff');                                                  // the painted side, toward the town
    G.quad(P(u0, o.bot[i], T), P(u1, o.bot[i + 1], T), P(u1, o.top[i + 1], T), P(u0, o.top[i], T), nf, qs);
    G.kind = 2; G.color(PLY);                                                                     // the back: bare ply
    G.quad(P(u0, o.bot[i], -T), P(u1, o.bot[i + 1], -T), P(u1, o.top[i + 1], -T), P(u0, o.top[i], -T), nb, qs);
    // the cut edge, top and bottom: PAINTED ROUND FROM THE FACE (the face's own paint at that place, lit as the face
    // is), so a board's edge, thinner than a pixel from the line, never shows as a dashed pale line under the cloud
    G.kind = b.grey ? 3 : 1; G.color('#ffffff');
    for (const e of [o.top, o.bot]) G.quad(P(u0, e[i], T), P(u1, e[i + 1], T), P(u1, e[i + 1], -T), P(u0, e[i], -T), nf, [q(u0, e[i]), q(u1, e[i + 1]), q(u1, e[i + 1]), q(u0, e[i])]);
  }
  // the outline at a place across the board (metres): [bottom, top] in metres
  const span = (x) => { const u = x / b.hw; let i = 0; while (i < o.n - 1 && o.u[i + 1] < u) i++;
    const t = clamp((u - o.u[i]) / Math.max(o.u[i + 1] - o.u[i], 1e-6), 0, 1); return [lerp(o.bot[i], o.bot[i + 1], t) * b.hh, lerp(o.top[i], o.top[i + 1], t) * b.hh]; };
  if (opts.part === 1) return 0;                                             // (its two faces and its edge only: the build rests before the rest)
  // THE BACK IS A STAGE FLAT'S: a framing of fresh timber proud of the ply: upright battens, rails between them, a
  // brace in every bay of the lowest tier and in every third bay above, leaning one way and the other by turns
  const low = !!opts.low, sp = low ? clamp((o.uR - o.uL) * b.hw / 7, 3.6, 7.5) : (opts.detail < 0.9 ? 11 : 7.5), proud = 0.34, zc = -T - proud / 2, nx = Math.floor((o.uR - o.uL) * b.hw / sp), x0 = (o.uL + o.uR) / 2 * b.hw - nx * sp / 2, cols = [];
  const at = (x, y, d = 0) => V3(0, 0, 0).addScaledVector(ex, x).addScaledVector(up, y).addScaledVector(nf, d);
  if (opts.part !== 3) {                                                     // (part 3: a low board's gear alone, its framing being built)
  G.kind = 5; G.color(TIMBER);
  for (let j = 0; j <= nx; j++) { const x = x0 + j * sp, [lo, hi] = span(x); cols.push([x, lo, hi]);
    if (hi - lo > 2.5) G.box(at(x, (lo + hi) / 2, zc), ex, up, nb, 0.32, (hi - lo) / 2 - 0.2, proud / 2, '-z+y-y'); }
  const y0 = o.vMin * b.hh + 0.6, tiers = Math.floor((o.vMax - o.vMin) * b.hh / sp);
  for (let k = 0; k <= tiers; k++) { const y = y0 + k * sp; let from = -1;
    for (let j = 0; j <= nx + 1; j++) { const inside = j <= nx && cols[j][1] < y - 0.2 && cols[j][2] > y + 0.5;
      if (inside && from < 0) from = j;
      if (!inside && from >= 0) { if (j - 1 > from) { const xa = cols[from][0], xb = cols[j - 1][0];
          G.box(at((xa + xb) / 2, y, zc + 0.03), ex, up, nb, (xb - xa) / 2, 0.26, proud / 2 - 0.03, '-z+x-x'); } from = -1; } } }
  G.color(TIMBER, 0.93);
  for (let k = 0; k < Math.max(tiers, 1); k++) for (let j = 0; j < nx; j++) { if (k > 0 && (j + k) % 3) continue;
    const [xa, la, ha] = cols[j], [xb, lb, hb] = cols[j + 1], ya = Math.max(la, lb, y0 + k * sp), yb = Math.min(y0 + (k + 1) * sp, hb - 0.4, ha - 0.4);
    if (yb - ya < 2) continue; const flip = (j + k) % 2 ? -1 : 1, dx = xb - xa, dy = (yb - ya) * flip, l = Math.hypot(dx, dy), ax = at(dx / l, dy / l), ay = at(-dy / l, dx / l);
    G.box(at((xa + xb) / 2, (ya + yb) / 2, zc + 0.06), ax, ay, nb, l / 2, 0.2, proud / 2 - 0.06, '-z+x-x'); }
  }
  if (opts.part === 2 && low) return 0;                                      // (a low board's gear is its part 3: the build rests before it)
  // THE HANGING GEAR, as a flat is flown: the trolley beam over the board, plumb over the framing on its back; under
  // it each rope's block; each ROPE runs down the board's back to its shackle on a spreader bar bolted across the
  // framing's foot, held to the board's top by a hanger (so the two ropes lie on the board's back down to its foot,
  // and show before it only over its top)
  const by = beamY(b) - b.y, xs = [-1, 1].map((sd) => sd * hangOf(b, sd) * b.hw), d0 = -T - proud - 0.16;
  // WHICH BOARDS CARRY IT (a rule of the place): the LOW boards of the mobile, which the way passes close under,
  // carry the whole gear (beam, blocks and winch solid at every distance; the ropes by the thin-member law). A HIGH board (never within WALLLEG.way m of the route) carries
  // none: it is a painted board and its back. THE RAIN CLOUD (the grey board) hangs on FOUR FOUR-PART FALLS of stout
  // dark rope (GEAR.fall) from irons at its top, plumb up to the dome (opts.roof: the dome's least height over a
  // place of the rig's creep).
  if (b.grey) { for (const f of [-1, -1 / 3, 1 / 3, 1]) { const x = f * hangOf(b, f) * b.hw, hi = span(x)[1];
    G.kind = 7; G.color(STEELD); G.box(at(x, hi - 0.3, d0 + 0.08), ex, up, nf, 0.34, 0.4, 0.26);
    G.box(at(x, hi + 0.75, d0), ex, up, nf, GEAR.fall.sheave / 2 + 0.25, 0.65, GEAR.fall.pin / 2 + 0.3);      // the fall's lower block: a double block on the iron
    G.kind = 4; G.color(TAR);                                                                            // its four parts, each plumb up to the dome over its own place
    for (const [da, dl] of fallParts()) G.tube(at(x + da, hi + 1.4, d0 + dl), at(x + da, opts.roof(b.x + b.ex[0] * (x + da) + nf.x * (d0 + dl), b.z + b.ex[1] * (x + da) + nf.z * (d0 + dl)) - b.y, d0 + dl), GEAR.stout / 2, 6, true); }
    G.kind = 0; return by + b.y; }
  if (!low) return by + b.y;
  gearBeam(G, at(xs[0] - GEAR.end, by, d0), at(xs[1] + GEAR.end, by, d0), up, nf);
  for (const x of xs) { const [lo, hi] = span(x), yb = lo + 1.0;
    G.kind = 7; G.color(STEEL); G.box(at(x, yb - 0.12, d0 + 0.05), ex, up, nf, 1.5, 0.12, 0.1);         // the spreader bar across the framing's foot
    G.box(at(x, hi - 0.25, d0 + 0.08), ex, up, nf, 0.24, 0.3, 0.22);                                     // the hanger at the board's top
    // (the wire stops short of the shell over the whole of the board's creep)
    const wire = Math.min(shellTop(b.x + b.ex[0] * (x - b.amp), b.z + b.ex[1] * (x - b.amp)), shellTop(b.x + b.ex[0] * (x + b.amp), b.z + b.ex[1] * (x + b.amp))) - 0.6 - b.y;
    gearRope(G, at(x, yb, d0), by, ex, up, nf, b.wired ? wire - yb : 0, hi - yb); }      // (a hair wire plumb up to the dome, only over a board within GEAR.wires m of the line: the deal's b.wired)
  if (low || b.grey) {                                                                                   // the winch between the blocks, a rope from it to each sheave
    const xm = (xs[0] + xs[1]) / 2, wy = by - 0.98;
    G.kind = 7; G.color('#6f7a86'); G.tube(at(xm - 0.8, wy, d0), at(xm + 0.8, wy, d0), 0.42, 8); G.disc(at(xm - 0.8, wy, d0), ex.clone().negate(), 0.55, 8); G.disc(at(xm + 0.8, wy, d0), ex, 0.55, 8);
    G.color(STEELD, 1.3); G.box(at(xm, wy, d0 - 0.75), ex, up, nf, 0.5, 0.36, 0.34);
    G.color(HEMP); G.kind = 4; for (const x of xs) G.tube(at(xm + Math.sign(x - xm) * 0.6, wy + 0.42, d0), at(x - Math.sign(x - xm) * 0.3, by - 1.42, d0), GEAR.rope / 2, 6, true);
    G.kind = 0; }
  G.kind = 0;
  return by + b.y;
}

// ---- THE BUILD (the world calls this one function). opts: { look, path, length, B (the metre where our stern is
// clear of the harbour mouth), bayTurn (where the run north begins to curve), C (where the bay line ends and the
// turn at the wall begins), D (where the wall leg begins), beta (the bay line's heading), rain (the world's
// PLACES.rain), keep (the bay's things, to stand clear of), sky (the hero's makeSky), sea (its makeSea) }. The mark
// E (where the line leaves the wall) and the wall leg's bearings are read from the hero's layRoute (WAY, above).
// Returns { object, update(dt, time, camera), dispose(), boards, grey, triangles, lookBoard(time, out),
// lookRain(time, out) }: the two looks' targets are worked out from the clock inside these two functions.
export async function makeMachines(ctx, opts) {
  const route = homeRoute({ path: opts.path, length: opts.length, B: opts.B, bayTurn: opts.bayTurn, C: opts.C, D: opts.D, beta: opts.beta, rain: opts.rain.clone().setY(0) }), look = opts.look, sky = opts.sky;
  const detail = opts.detail || (ctx.quality && ctx.quality.detail) || 1, object = new THREE.Group(); object.name = 'weather-machines';
  route.phase = makeRng(hashSeed('rain-rig:' + ctx.seed))() * TAU;                 // (the rig's place in its creep at the clock's nought: its own die)
  const dealt = highDeal(ctx.seed, route); let step = dealt.next(); while (!step.done) { await ctx.yield(); step = dealt.next(); }
  const { boards, grey } = step.value;
  await ctx.yield();
  const deal = lowDeal(ctx.seed, route, boards, grey, keepOuts(opts.keep)); step = deal.next(); while (!step.done) { await ctx.yield(); step = deal.next(); }
  const low = step.value, all = boards.concat([grey], low);
  const mats = machineMaterials(look, sky, opts.sea), mat = mats.body, G = new Geo(), S = new Geo(); G.thin = new Geo(); S.thin = new Geo();
  await ctx.yield();
  for (const b of boards) for (const part of [1, 2]) { buildBoard(G, S, b, { detail, part }); await ctx.yield(); }
  const T = { Geo, V3, GLSL_VN, GLSL_HEAP, fl, NSLOT, BOARD, RAIN, PADDLE, GEAR, fallParts, rainShift, rainCentre, paddleBearing, paddlePhase, shellTop, buildBoard, gearBeam, gearRope, bayAxes, rigAxes, TAR };
  const rain = await makeRain(ctx, T, { route, grey, G, S, look, sky, sea: opts.sea, detail });
  await ctx.yield();
  const paddles = await makePaddles(ctx, T, { S, look, sky, sea: opts.sea, detail });
  await ctx.yield();
  const mobile = await makeMobile(ctx, T, { low, mats, look, detail, sky, sea: opts.sea, lamp: lampPlace(look, 0) });      // (the shade on the water is baked for the lamp at the middle of its swing)
  await ctx.yield();
  // THE DRAWS, joined by coat (poolGeos): the bodies (the steel among them), the thin members, the low boards'
  // images (laid after every shade on the water, the bay's and ours, so that no shade takes light off an image)
  const pool = await poolGeos(ctx, [mobile.G, mobile.G.thin, G, G.thin, S, S.thin]);
  const bodies = new THREE.Mesh(pool.bodies, mats.body), thin = new THREE.Mesh(pool.thin, mats.thin), images = new THREE.Mesh(pool.image, mats.image);
  bodies.name = 'boards-rig-and-rails'; thin.name = 'ropes-and-wires'; images.name = 'low-boards-images'; thin.renderOrder = 2; images.renderOrder = 1.3;
  for (const m of [bodies, thin, images]) m.frustumCulled = false;
  for (const m of rain.objects.concat(paddles.objects, mobile.objects)) object.add(m); object.add(bodies, thin, images);
  // THE BOARDS' SHADOWS ON THE PAINTED SKY are this part's own layer (makeShades: each the true shape of its board,
  // soft and light). The hero's own lump of shade stays off: its slots are handed their places and no board (w = 0).
  const shades = makeShades(ctx, T, { boards, mats }); for (const m of shades.objects) object.add(m);
  const A = sky.uniforms.uBoardA.value, B = sky.uniforms.uBoardB.value, slots = mats.uniforms.uSlot.value, v = new THREE.Vector3(), size = new THREE.Vector2();
  for (let i = 0; i < B.length; i++) B[i].set(0, 1, 0, 0);
  for (const b of all) { if (b.slot < B.length) B[b.slot].set(b.face * RAD, b.hh, b.s, 0); mats.paint(b, lampPlace(look, 0, v)); }      // (the painter's light is laid once, at the build: the undealt lamp law at clock 0, the middle of its swing)
  const bb = route.axis * RAD, place = (time) => {
    for (const b of boards) { boardCentre(b, time, v); slots[b.slot].copy(v); A[b.slot].set(v.x, v.y, v.z, b.hw); }
    for (const b of low) boardCentre(b, time, slots[b.slot]);
    const k = rainShift(time, route.phase); v.set(grey.x + Math.sin(bb) * k, grey.y, grey.z - Math.cos(bb) * k); slots[grey.slot].copy(v); A[grey.slot].set(v.x, v.y, v.z, grey.hw);
  };
  place(0);
  const lookB = new THREE.Vector3(), lookR = new THREE.Vector3(), eyeV = new THREE.Vector3(), lampV = new THREE.Vector3();
  return { object, boards, grey, low, material: mat, rain, paddles, mobile, shades, triangles: G.triangles + S.triangles + G.thin.triangles + S.thin.triangles + rain.triangles + paddles.triangles + mobile.triangles + shades.triangles,
    lookBoard: (time) => boardCentre(boards[0], time, lookB),
    // THE RAIN's look: the rain's middle, drawn toward the place in the rain where the bow stands for this eye (u: the route's place)
    lookRain: (time, u) => { rainCentre(route, time, lookR).setY(RAIN.height * 0.32); if (u == null) return lookR;
      route.path.pointAt(clamp(u, 0, 1), eyeV); const r = bowInRain(route, sky.lampAt ? sky.lampAt(time, lampV) : lampPlace(look, time, lampV), eyeV, rainShift(time, route.phase));      // (the path is the eye's own way; the lamp is THE BUILT SKY'S OWN at this clock, sky.lampAt: its creep at its dealt phase; a sky without one, the proof's stand-in, has the undealt law)
      return r.aim ? lookR.lerp(r.aim, 0.7 * smoothstep(2, 24, r.length)) : lookR; },
    update(dt, time, camera) {
      place(time);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); mats.uniforms.uPix.value = 2 / Math.max(size.y, 1); }
      rain.update(dt, time, camera); paddles.update(dt, time, camera);
    },
    dispose() { mats.heaps.dispose(); },                      // (all else that this part makes hangs from its object)
  };
}

