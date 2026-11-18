// half-coloured-regatta
//
// A seaside regatta in a colouring book, half coloured in. White paper, one printed black line, eight felt-tips.
// THE HERO: in a round lagoon beside the course one motor launch never races. It turns for ever in one circle, on fire,
// knocking down the same three marks, which stand up again behind it; each mark it takes gives a plus and a tally
// stroke and sends a rosette to the pile of rosettes in the lagoon's middle, on which a cup sits and hops. The race goes
// by without it: a fleet of dinghies out of a shed, up the lane, round the far mark and away past the way out, a
// lifebuoy standing in the sea.
//
// THE UNIT is the metre. +Z is the way of the flight at its start; the viewer's left is +X; the sea lies at y 0.
//
// THE LAWS
//   BY THE PLACE'S OWN CLOCK, the same with no visitor: the launch on its circle (LAG.lap seconds a lap) and its bob; its
//   fire (the look wavers each flame and scribbles it over); its smoke (eight puffs left behind it along the circle,
//   rising and growing); the marks falling as its stem reaches them, pushed under while it runs over them, and
//   standing half a lap later; for each mark taken the points sign that rises over it and the rosette that flies to
//   the pile; the pile taking each rosette on top and sinking by its height, and the cup's hop; the wake's newest
//   coat behind the boat; every boat of the fleet along
//   its own course at FSPEED metres a second (blank at the shed, coloured within the first three tenths of its course,
//   its spinnaker past the far mark); the sea's printed lines sliding; flags and bunting; the balloons' bob and slow
//   turn; and on the circle the gaze, which goes with the launch.
//   BY PLACE, the metres of route FLOWN (uS): the colouring of what stands still outside the lagoon. A cell of a hut,
//   the bunting, the pier, a parasol, a thing afloat, a channel cone begins LEAD metres of route before the place of
//   the route nearest it and is done SPAN metres later (the cap falls with its distance from the route); the far mark
//   likewise; the lighthouse from 900 m sooner, over 500 m; the sun between 90 and 610 m flown. The sand is coloured in
//   strokes along the route whose tips lie LEAD metres ahead of the eye; the sea likewise, its tips at GAIN_SEA times the
//   metres flown and LEAD_SEA more, so the sea's colouring runs on ahead: done as far as the way out by three tenths
//   of the flight and as far as the hills by somewhat over four tenths (the look holds the law). The height of the
//   gaze on the circle is the route's own height at that place.
//   AT EVERY METRE: the launch, the marks, the pile and the cup, the wake, the lagoon, its bar of sand and the rowing
//   boats on it, the three dinghies knocked flat, the felt-tips, the boat shed, the balloons, the hills, the
//   lighthouse's lantern and the lifebuoy are coloured; the way out is open.
//   Nothing reads the metres still to fly, a typed time, a share of the flight or a seed's event.
//
// WHAT READS THE EYE, named here (section 153): the look's footprint filters (named at its head); and in update the
// smoke's puffs and the points signs, each a single sheet, are turned about the upright to face the eye, as a paper
// cut-out is held up to a reader. Only that turn reads the eye: where they are, how big and when is the clock's alone.
//
// WHAT A SEED DEALS: the things on the beach, on the bar and on the water and their pens, the clouds, the balloons,
// the hills' outline, each boat's place in the fleet and its pens, and the hand's scribble in a cell. A deal says
// what stands, never when a thing begins. The engine's density (0.7 to 1.3) and detail (0.6 to 1) set the number of boats: 59 to 182.
//
// CLEAR AIR BY PLACE, at the build: no balloon within 70 m and 2.2 of its own radius of any point of the route; nothing
// afloat within 44 m of the route in the plan (the lookers' boats 56 m, the things on the bar 40 m); the lagoon's
// boats stand 47 m and more inside our circle; the lane's edge is 37 m to our left; the launch's circle lies 115 m
// inside ours.
//
// ONE TEXTURE, of numbers: the route's field (made here in steps, freed in dispose). No light, no fog, no timer; nothing
// is made in update.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeBook, PAPER, PENS, PEN, KIND, MODE, BOLD, THIN, frame, box, drum, disc, dinghy, spinnaker } from '../parts/half-coloured-regatta.js';

const TAU = Math.PI * 2, ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const LAG = { x: 0, z: 1000, wake: 150, lap: 16, bar0: 318, bar1: 368 }, ORBIT = 265, FIN = [-380, 44, 1460], SHORE = -250;
const TOWER = { h: 10, H: 100, r: 22, n: 11 }, FLY = 0.3, M0 = 0.6, A0 = TAU * 2.25, AHEAD = 0.055;   // AHEAD: the launch's stem reaches a mark this share of a lap before its middle (52 m of 942)
const LEAD = 400, SPAN = 150, LEAD_SEA = 900, GAIN_SEA = 2.6, FSPEED = 17;
const IN = [[230, 150, -720], [246, 146, -600], [266, 140, -480], [290, 132, -360], [318, 118, -230], [348, 98, -100], [378, 72, 20], [400, 46, 130], [413, 28, 240], [418, 21, 350], [418, 20, 470], [418, 20, 590], [418, 20, 710], [416, 20, 820], [408, 20, 900]];

// THE COURSE: in high over the huts with the lagoon ahead; over the pier's foot on the beach and down to the left of
// the pier (40 m off it 157 m out from its foot, 100 m off its end) to
// 20 m up beside the fleet's lane (the lane's edge is 37 m to our left; a hull is 7 m to either side of its own middle and
// sways 3 m); across the bar of sand; once round the lagoon outside the launch's circle, the pile to the right, 20 m
// up at first, 92 m over the far side, 42 m at the end; away over the bar to the lifebuoy.
function layCourse() {
  const P = (f) => [LAG.x + ORBIT * Math.cos(f), LAG.z + ORBIT * Math.sin(f)], T = (f) => [-Math.sin(f), Math.cos(f)];
  const touch = (x, z, out, f0, f1) => { let best = f0, bv = 1e9;
    for (let f = f0; f <= f1; f += 0.0005) { const p = P(f), t = T(f), dx = out ? x - p[0] : p[0] - x, dz = out ? z - p[1] : p[1] - z, cr = Math.abs(dx * t[1] - dz * t[0]) / Math.hypot(dx, dz); if (dx * t[0] + dz * t[1] > 0 && cr < bv) { bv = cr; best = f; } }
    return best; };
  const E = IN[IN.length - 1], fIn = touch(E[0], E[2], false, -1, 1.6), fOut = touch(FIN[0], FIN[2], true, TAU, TAU + 2), pts = IN.map((p) => p.slice());
  const pi = P(fIn), nIn = Math.max(2, Math.round(Math.hypot(pi[0] - E[0], pi[1] - E[2]) / 130));
  for (let k = 1; k < nIn; k++) { const t = k / nIn; pts.push([E[0] + (pi[0] - E[0]) * t, E[1] - (E[1] - 20) * ss(0.28, 1, t), E[2] + (pi[1] - E[2]) * t]); }
  const turn = fOut - fIn, nO = Math.round(turn / (TAU / 20)), hO = (t) => 20 + 72 * ss(0.3, 0.55, t) * (1 - ss(0.68, 0.95, t)) + 22 * ss(0.8, 1, t);
  const iIn = pts.length; for (let k = 0; k <= nO; k++) { const t = k / nO, p = P(fIn + turn * t); pts.push([p[0], hO(t), p[1]]); }
  const iOut = pts.length - 1, po = P(fOut), dOut = Math.hypot(FIN[0] - po[0], FIN[2] - po[1]), nX = Math.max(3, Math.round(dOut / 140));
  for (let k = 1; k <= nX; k++) { const t = k / nX; pts.push([po[0] + (FIN[0] - po[0]) * t, 42 + (FIN[1] - 42) * ss(0.3, 1, t), po[1] + (FIN[2] - po[1]) * t]); }
  const hx = (FIN[0] - po[0]) / dOut, hz = (FIN[2] - po[1]) / dOut;
  // the bar's mouth: where the way in crosses the middle of the bar's breadth
  let tm = 0.5; for (let t = 0; t <= 1; t += 0.002) if (Math.hypot(E[0] + (pi[0] - E[0]) * t - LAG.x, E[2] + (pi[1] - E[2]) * t - LAG.z) < (LAG.bar0 + LAG.bar1) / 2) { tm = t; break; }
  return { pts, pIn: pts[iIn], pOut: pts[iOut], h: [hx, hz], left: [hz, -hx], mouth: Math.atan2(E[0] + (pi[0] - E[0]) * tm - LAG.x, E[2] + (pi[1] - E[2]) * tm - LAG.z) };
}

// a beach hut: striped gable walls, plain sides, a striped roof
function hut(sh, T, w, h, d, pa, pb, fill, seed = 0, open = false) {      // open: no gable wall toward +z (a boat shed)
  const x = w / 2, z = d / 2, rh = h * 0.5, ev = 1.5 * rh / x, n = 4, gy = (xx) => h + rh * (1 - Math.abs(xx) / x);
  for (const sg of open ? [-1] : [1, -1]) for (let k = 0; k < n; k++) { const x0 = -x + (k / n) * w, x1 = -x + ((k + 1) / n) * w, zz = sg * z;
    sh.quad(T(x0, 0, zz), T(x1, 0, zz), T(x1, gy(x1), zz), T(x0, gy(x0), zz), { pen: k % 2 ? pb : pa, dir: Math.PI / 2, fill, coats: sg < 0 ? 2 : 1, edge: [k ? THIN : BOLD, k === n - 1 ? BOLD : THIN, BOLD, BOLD], seed: seed + k * 0.11 + (sg > 0 ? 0 : 0.5) }); }
  sh.quad(T(x, 0, z), T(x, 0, -z), T(x, h, -z), T(x, h, z), { pen: pa, coats: 2, dir: Math.PI / 2, fill, edge: [BOLD, BOLD, BOLD, THIN], seed: seed + 0.3 });
  sh.quad(T(-x, 0, -z), T(-x, 0, z), T(-x, h, z), T(-x, h, -z), { pen: pa, dir: Math.PI / 2, fill, edge: [BOLD, BOLD, BOLD, THIN], seed: seed + 0.7 });
  for (const sg of [1, -1]) for (let k = 0; k < 3; k++) { const z0 = -z - 1.5 + (k / 3) * (d + 3), z1 = -z - 1.5 + ((k + 1) / 3) * (d + 3);
    sh.quad(T(sg * (x + 1.5), h - ev, z0), T(sg * (x + 1.5), h - ev, z1), T(0, h + rh, z1), T(0, h + rh, z0), { pen: k % 2 ? pa : pb, dir: Math.PI / 2, fill, coats: sg > 0 ? 2 : 1, edge: [k ? THIN : BOLD, k === 2 ? BOLD : THIN, BOLD, BOLD], seed: seed + 0.2 * k + sg * 0.05 + 0.1 }); }
}
// a parasol: a pole and a striped cone
function parasol(sh, T, r, h, pa, pb, fill, seed) {
  box(sh, T, 0.9, h - 4, 0.9, { pens: [0, 0, 0, 0, 0], edge: [THIN, THIN, 0, 0], top: false });
  drum(sh, T, 8, [[h - 5, h, r, 0.4, (k) => (k % 2 ? pa : pb), fill]], { rib: THIN, hoop: BOLD, seed, dir: Math.PI / 2 });
}
// a racing mark: a striped can, a cone, a flag
function markShape(sh, T, fill, pa = PEN.scarlet, pb = PEN.lemon) {
  drum(sh, T, 10, [[0, 9, 7, 7, pa, fill], [9, 18, 7, 7, 0, fill], [18, 27, 7, 7, pa, fill], [27, 36, 7, 0.6, pb, fill]], { rib: 0, hoop: BOLD, seed: 0.2 });
  sh.quad(T(-0.9, 36, 0), T(0.9, 36, 0), T(0.9, 49, 0), T(-0.9, 49, 0), { pen: 0, edge: [THIN, THIN, 0, THIN] });
  sh.quad(T(0.4, 41, 0), T(11, 41, 0), T(11, 49, 0), T(0.4, 49, 0), { pen: PEN.orange, kind: KIND.flag, fill, edge: [BOLD, BOLD, BOLD, BOLD], seed: 0.4 });
}
// things on the water: a striped raft, a small flag buoy, a rowing boat under a parasol
function lilo(sh, T, pa, fill, seed) { for (let k = 0; k < 4; k++) sh.quad(T(-3.6, 0, -8 + k * 4), T(3.6, 0, -8 + k * 4), T(3.6, 0, -4 + k * 4), T(-3.6, 0, -4 + k * 4), { pen: k % 2 ? 0 : pa, dir: 0, fill, edge: [BOLD, BOLD, k ? THIN : BOLD, k === 3 ? BOLD : THIN], seed: seed + k * 0.1 }); }
function flagBuoy(sh, T, pa, fill, seed) {
  drum(sh, T, 6, [[0, 8, 3, 0.4, pa, fill]], { rib: 0, hoop: BOLD, seed }); sh.quad(T(-0.3, 8, 0), T(0.3, 8, 0), T(0.3, 17, 0), T(-0.3, 17, 0), { pen: 0, edge: [THIN, THIN, 0, 0] });
  sh.quad(T(0.3, 13, 0), T(5.4, 13, 0), T(5.4, 17, 0), T(0.3, 17, 0), { pen: PEN.lemon, kind: KIND.flag, fill, edge: [BOLD, BOLD, BOLD, BOLD], seed });
}
function rowboat(sh, T, pa, pb, fill, seed) {
  const bl = [-3.6, 0, -7], tl = [-4.6, 3.2, -7.6], bb = [0, 0, 8], tb = [0, 3.6, 9.6], br = [3.6, 0, -7], tr = [4.6, 3.2, -7.6], q = (a, b, c, d, coats, e) => sh.quad(T(...a), T(...b), T(...c), T(...d), { pen: pa, dir: 0, fill, coats, edge: e, seed });
  q(bb, bl, tl, tb, 1, [0, BOLD, BOLD, BOLD]); q(br, bb, tb, tr, 2, [BOLD, 0, BOLD, BOLD]); q(bl, br, tr, tl, 2, [BOLD, BOLD, BOLD, BOLD]);
  box(sh, T, 0.5, 9, 0.5, { pens: [0, 0, 0, 0, 0], edge: [THIN, THIN, 0, 0], top: false }); drum(sh, T, 8, [[7.5, 11, 6.5, 0.3, (k) => (k % 2 ? pb : PEN.lemon), fill]], { rib: THIN, hoop: BOLD, seed, dir: Math.PI / 2 });
}
// a balloon in gores of two pens, its neck at the frame's origin, a basket under it
function balloon(sh, T, R, pa, pb, fill, seed) {
  const prof = [[0, 0.24], [0.5, 0.74], [1.1, 1], [1.6, 0.86], [1.95, 0.42], [2.1, 0.03]], bands = [];
  for (let k = 0; k < prof.length - 1; k++) bands.push([prof[k][0] * R, prof[k + 1][0] * R, prof[k][1] * R, prof[k + 1][1] * R, (g) => (g % 2 ? pa : pb), fill]);
  drum(sh, T, 12, bands, { rib: BOLD, hoop: 0, seed, dir: Math.PI / 2 });
  box(sh, (x, y, z) => T(x, y - 0.5 * R, z), 0.3 * R, 0.24 * R, 0.3 * R, { pens: [PEN.orange, PEN.orange, PEN.orange, PEN.orange, 0], fill, edge: [BOLD, BOLD, BOLD, BOLD] });
  for (let q = 0; q < 2; q++) { const P = q ? (a, b) => T(0, b, a) : (a, b) => T(a, b, 0);      // its ropes: two crossed sheets from the neck to the basket
    sh.quad(P(-0.15 * R, -0.26 * R), P(0.15 * R, -0.26 * R), P(0.24 * R, 0), P(-0.24 * R, 0), { pen: 0, edge: [THIN, THIN, 0, 0] }); }
}
// one of the eight felt-tips, standing nib down in the sand, its cap on
function feltTip(sh, T, pen) {
  const F = [0, 1, 1, MODE.full]; drum(sh, T, 10, [[0, 5, 0.7, 2.4, pen, F], [5, 9, 2.4, 4.4, 0, F], [9, 15, 4.4, 4.4, 0, F], [15, 31, 4.4, 4.4, pen, F], [31, 39, 4.4, 4.4, 0, F], [39, 52, 5, 5, pen, F]], { rib: 0, hoop: BOLD, seed: pen * 0.1 });
  disc(sh, T, 10, 52, 5, pen, { fill: F, spoke: 0, rim: 0, seed: 0.5 });
}
// a flame: a pair of crossed sheets; the look cuts three tongues in it, one inside the other, and scribbles them over by the clock
function fire(sh, x, y, z, w, h, seed) {
  for (let q = 0; q < 2; q++) { const a = q * Math.PI / 2 + seed * 5, cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2;
    sh.quad([x - cx, y, z - cz], [x + cx, y, z + cz], [x + cx, y + h, z + cz], [x - cx, y + h, z - cz], { pen: PEN.scarlet, kind: KIND.flame, dir: Math.PI / 2, fill: [(seed * 7.3 + q * 0.37) % 1, 0.55 + 0.3 * ((seed * 3.1 + q * 0.4) % 1), 1, MODE.clock], edge: [THIN * 1.8, 0, 0, 0], seed: (seed + q * 0.4) % 1 }); }
}
// THE LAUNCH, bow toward +z: a motor launch of two strakes with a raised bow, a wheelhouse under a lemon roof, a striped
// funnel, a pennant at the stern, a moustache of foam at the bow, and the fire it carries: on its after deck, on the
// wheelhouse roof and at the bow
function launch(sh) {
  const F = [0, 1, 1, MODE.full], bl = [-10, 0, -28], ml = [-12.5, 6, -29.5], tl = [-13.5, 12, -31], bb = [0, 0, 30], mb = [0, 8, 35], tb = [0, 18, 40], br = [10, 0, -28], mr = [12.5, 6, -29.5], tr = [13.5, 12, -31];
  sh.quad(bb, bl, ml, mb, { pen: PEN.violet, dir: 0, fill: F, edge: [0, BOLD, BOLD, THIN], seed: 0.1 }); sh.quad(mb, ml, tl, tb, { pen: PEN.pink, dir: 0, fill: F, edge: [0, BOLD, THIN, BOLD], seed: 0.2 });
  sh.quad(br, bb, mb, mr, { pen: PEN.violet, coats: 2, dir: 0, fill: F, edge: [BOLD, 0, BOLD, THIN], seed: 0.3 }); sh.quad(mr, mb, tb, tr, { pen: PEN.pink, coats: 2, dir: 0, fill: F, edge: [BOLD, 0, THIN, BOLD], seed: 0.4 });
  sh.quad(bl, br, mr, ml, { pen: PEN.violet, coats: 2, dir: 0, fill: F, edge: [BOLD, BOLD, BOLD, THIN], seed: 0.5 }); sh.quad(ml, mr, tr, tl, { pen: PEN.pink, coats: 2, dir: 0, fill: F, edge: [BOLD, BOLD, THIN, BOLD], seed: 0.6 });
  sh.quad(tl, tr, tb, tb, { pen: 0, edge: [0, 0, THIN, 0], size: [27, 71.3] });      // the deck: a triangle; the gunwales' lines are the sides' own
  // the wheelhouse, 8.6 wide: inside the hull, which at the house's fore end is 9.1 wide at the house's foot and 9.9 at the
  // gunwale; its foot is under the deck
  box(sh, frame(0, 12, 6), 8.6, 13, 16, { pens: [PEN.turquoise, PEN.green, PEN.green, PEN.green, 0], fill: F, seed: 0.15 });
  box(sh, frame(0, 25, 6), 15, 2.5, 19.4, { pens: [PEN.lemon, PEN.lemon, PEN.lemon, PEN.lemon, PEN.lemon], fill: F, seed: 0.25 });      // the roof: its after edge at z -3.7, 0.3 before the funnel's widest reach (a drum of radius 5 about z -9) however its ten sides are turned
  drum(sh, frame(0, 12, -9), 10, [[0, 20, 5, 5, PEN.scarlet, F], [20, 25, 5.4, 5.4, 0, F], [25, 30, 5.2, 5.2, PEN.violet, F]], { rib: 0, hoop: BOLD, seed: 0.33 });
  sh.quad([-0.4, 12, -30], [0.4, 12, -30], [0.4, 31, -30], [-0.4, 31, -30], { pen: 0, edge: [THIN, THIN, 0, 0] });
  sh.quad([0, 23, -30.4], [0, 23, -43], [0, 31, -43], [0, 31, -30.4], { pen: PEN.orange, kind: KIND.flag, fill: F, edge: [BOLD, BOLD, BOLD, BOLD], seed: 0.4 });
  for (const sg of [-1, 1]) sh.quad([0, 0, 33], [sg * 17, 0, 10], [sg * 20, 8, 6], [0, 7, 36], { pen: 0, edge: [BOLD, BOLD, BOLD, BOLD] });
  fire(sh, 0, 12, -22, 20, 34, 0.11); fire(sh, -7, 12, -15, 14, 24, 0.37); fire(sh, 7, 12, -27, 14, 22, 0.63); fire(sh, 0, 27.5, 6, 12, 18, 0.82); fire(sh, 0, 15, 26, 9, 14, 0.27);
  return sh;
}

export default {
  id: 'half-coloured-regatta',
  name: 'Half-Coloured Regatta',
  category: 'bizarre',
  weirdness: 0.75,
  media: ['air', 'open'],
  async build(ctx) {
    const core = ctx.core;
    const stream = (name) => core.makeRng(core.hashSeed('half-coloured-regatta:' + name + ':' + ctx.seed));
    const scene = new THREE.Scene(); scene.background = new THREE.Color(PAPER);
    const lay = layCourse(), path = makePath(lay.pts), L = path.length, book = makeBook({ stroke: 2.8 }), U = book.uniforms;
    const density = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1)), detail = Math.min(1, Math.max(0.6, Number(ctx.quality?.detail) || 1));
    const [hx, hz] = lay.h, [lx, lz] = lay.left;
    // the colouring of a cell that stands still, BY PLACE: from LEAD metres of route before the place of the route nearest it
    // (133 m of the circle are flown twice: a thing beside them takes the FIRST passing)
    const fillAt = (x, z, near = 200, far = 560) => { const n = path.nearestXZ(x, z); let s = n.u * L;
      for (let i = 0, i1 = Math.round(n.u * RM) - 40; i < i1; i++) if (Math.hypot(rx[i] - x, rz[i] - z) < n.dist + 2) { s = i / RM * L; break; }
      return [s - LEAD, SPAN, 1 - ss(near, far, n.dist), MODE.place]; };
    // ---- THE ROUTE'S FIELD, for the sea and the sand: at each place of the plan the metres of route nearest it and how far
    // to the left of the route it lies; beyond either end the route is taken to run on straight ----
    const RM = 1600, rx = new Float32Array(RM + 1), ry = new Float32Array(RM + 1), rz = new Float32Array(RM + 1), v3 = new THREE.Vector3(); let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (let i = 0; i <= RM; i++) { path.pointAt(i / RM, v3); rx[i] = v3.x; ry[i] = v3.y; rz[i] = v3.z; bx0 = Math.min(bx0, v3.x); bx1 = Math.max(bx1, v3.x); bz0 = Math.min(bz0, v3.z); bz1 = Math.max(bz1, v3.z); }
    // the metres of route at which the eye passes a point of the course: its first passing, or its last (the circle is met twice at one place)
    const sOf = (pt, last) => { let bd = 1e9, bi = 0; for (let i = 0; i <= RM; i++) bd = Math.min(bd, Math.hypot(rx[i] - pt[0], rz[i] - pt[2]));
      for (let i = 0; i <= RM; i++) if (Math.hypot(rx[i] - pt[0], rz[i] - pt[2]) < bd + 2) { bi = i; if (!last) break; } return bi / RM * L; };
    const sLane = sOf(IN[IN.length - 1], false), sIn = sOf(lay.pIn, false), sOut = sOf(lay.pOut, true);
    await ctx.yield();
    const BOX = { x0: bx0 - 1200, z0: bz0 - 1200, w: bx1 - bx0 + 2400, d: bz1 - bz0 + 2400, n: 320 }, half = THREE.DataUtils.toHalfFloat, field = new Uint16Array(BOX.n * BOX.n * 4);
    // (on the 133 m of the circle flown twice the field takes the FIRST passing wherever it lies no more than 6 m
    // farther off than the last, as fillAt does: one run of strokes there, not patches of two)
    let bd = 0, bs = 0, bl = 0;
    const seek = (x, z, ia, ib) => { bd = 1e18; for (let i = Math.max(0, ia); i < Math.min(RM, ib); i++) { const ex = rx[i + 1] - rx[i], ez = rz[i + 1] - rz[i], l2 = ex * ex + ez * ez || 1e-9, tr = ((x - rx[i]) * ex + (z - rz[i]) * ez) / l2;
      const tt = (i === 0 && tr < 0) || (i === RM - 1 && tr > 1) ? tr : Math.min(1, Math.max(0, tr)), qx = rx[i] + ex * tt, qz = rz[i] + ez * tt, d2 = (x - qx) * (x - qx) + (z - qz) * (z - qz);
      if (d2 < bd) { bd = d2; bs = (i + tt) / RM * L; bl = ((x - qx) * ez - (z - qz) * ex) / Math.sqrt(l2); } } };
    const iA = Math.round(sIn / L * RM) - 6, iB = iA + Math.round(150 / L * RM) + 12;
    for (let row = 0; row < BOX.n; row++) {
      for (let c = 0; c < BOX.n; c++) { const x = BOX.x0 + (c + 0.5) / BOX.n * BOX.w, z = BOX.z0 + (row + 0.5) / BOX.n * BOX.d, i0 = Math.round(path.nearestXZ(x, z).u * RM);
        seek(x, z, i0 - 8, i0 + 8);
        if (bs > sOut - 150 && bs < sOut + 1) { const d0 = bd, s0 = bs, l0 = bl; seek(x, z, iA, iB); if (Math.sqrt(bd) > Math.sqrt(d0) + 6) { bd = d0; bs = s0; bl = l0; } }
        const o = (row * BOX.n + c) * 4; field[o] = half(bs); field[o + 1] = half(bl); field[o + 2] = 0; field[o + 3] = half(1); }
      if (row % 8 === 7) await ctx.yield(); }
    const routeTex = new THREE.DataTexture(field, BOX.n, BOX.n, THREE.RGBAFormat, THREE.HalfFloatType); routeTex.magFilter = routeTex.minFilter = THREE.LinearFilter; routeTex.generateMipmaps = false; routeTex.colorSpace = THREE.NoColorSpace; routeTex.needsUpdate = true;
    U.uRoute.value = routeTex; U.uBox.value.set(BOX.x0, BOX.z0, 1 / BOX.w, 1 / BOX.d); U.uLead.value.set(LEAD_SEA, LEAD, GAIN_SEA); U.uRing.value.set(LAG.x, LAG.z, 0, LAG.bar0 + 2);

    // ---- the sea and the sand: great tiles, coloured in the plan by the route's field (see the look) ----
    const ground = book.sheet(), rg = stream('ground');
    for (let ix = -11; ix < 11; ix++) for (let iz = -1; iz < 14; iz++) { const x0 = ix * 650, z0 = SHORE - 1300 + iz * 650, land = z0 + 325 < SHORE;
      ground.quad([x0, 0, z0], [x0 + 650, 0, z0], [x0 + 650, 0, z0 + 650], [x0, 0, z0 + 650], { pen: land ? PEN.lemon : PEN.turquoise, kind: land ? KIND.ground : KIND.sea, edge: [0, 0, 0, land && Math.abs(z0 + 650 - SHORE) < 1 ? 0.9 : 0], seed: rg() }); }
    const groundMesh = book.mesh(ground, 'ground'); groundMesh.renderOrder = -2; scene.add(groundMesh);
    await ctx.yield();

    // ---- what stands still ----
    const st = book.sheet(), rs = stream('still'), PA = [PEN.scarlet, PEN.blue, PEN.green, PEN.orange, PEN.violet, PEN.pink, PEN.turquoise];
    for (let i = 0; i < 13; i++) { const x = -40 + 46 * i, z = SHORE - 112; hut(st, frame(x, 0.3, z), 26, 19, 26, PA[i % 7], i % 3 === 1 ? PEN.lemon : 0, fillAt(x, z), rs()); }
    hut(st, frame(606, 0.3, SHORE - 36), 62, 34, 70, PEN.blue, 0, [0, 1, 1, MODE.full], rs(), true);      // the boat shed the fleet comes out by: at the water's edge, open to the sea, coloured at every metre
    for (let i = 0; i < 88; i++) { const x = -58 + i * 6.9, y = 27 + 2.5 * Math.cos(i * TAU / 6.67), z = SHORE - 96;      // bunting before the huts
      // a pennant: a triangle that hangs by its top edge (its u0 side) and waves at its point (b and c, one point)
      st.quad([x + 5.4, y, z], [x + 2.7, y - 6.5, z], [x + 2.7, y - 6.5, z], [x, y, z], { pen: 1 + (i * 3) % 8, kind: KIND.flag, fill: fillAt(x, z), edge: [THIN, 0, 0, THIN], seed: rs(), size: [6.5, 4.99] }); }
    // the pier: the eye crosses its foot over the beach and draws off to its left (100 m off at its end); planks on legs,
    // and a kiosk on legs at its end
    { const px = 305, z0 = SHORE - 20, z1 = 190, w = 22, n = 22;
      for (let k = 0; k < n; k++) { const za = z0 + (k / n) * (z1 - z0), zb = z0 + ((k + 1) / n) * (z1 - z0), f = fillAt(px, (za + zb) / 2);
        st.quad([px - w / 2, 9, za], [px + w / 2, 9, za], [px + w / 2, 9, zb], [px - w / 2, 9, zb], { pen: k % 2 ? PEN.orange : PEN.lemon, dir: 0, fill: f, edge: [BOLD, BOLD, THIN, THIN], seed: rs() });
        if (k % 2 === 0) for (const sg of [-1, 1]) box(st, frame(px + sg * (w / 2 - 2), 0, za), 1.8, 9, 1.8, { pens: [0, 0, 0, 0, 0], edge: [THIN, THIN, 0, 0], top: false }); }
      const T = frame(px, 9, z1 + 24), f = fillAt(px, z1 + 24); disc(st, T, 8, 0.2, 27, PEN.orange, { fill: f, spoke: THIN, rim: BOLD, seed: 0.3 });
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; box(st, frame(px + 21 * Math.cos(a), 0, z1 + 24 + 21 * Math.sin(a)), 1.8, 9.2, 1.8, { pens: [0, 0, 0, 0, 0], edge: [THIN, THIN, 0, 0], top: false }); }
      drum(st, T, 8, [[0.2, 14, 19, 19, (k) => (k % 2 ? PEN.pink : 0), f], [14, 31, 24, 1, (k) => (k % 2 ? PEN.scarlet : PEN.lemon), f]], { rib: THIN, hoop: BOLD, seed: 0.4 });
      st.quad(T(-0.4, 31, 0), T(0.4, 31, 0), T(0.4, 43, 0), T(-0.4, 43, 0), { pen: 0, edge: [THIN, THIN, 0, 0] }); st.quad(T(0.4, 36, 0), T(10, 36, 0), T(10, 43, 0), T(0.4, 43, 0), { pen: PEN.green, kind: KIND.flag, fill: f, edge: [BOLD, BOLD, BOLD, BOLD], seed: 0.4 }); }
    // THE EIGHT FELT-TIPS, standing in the sand before the huts, coloured at every metre
    for (let k = 0; k < 8; k++) feltTip(st, frame(-30 + k * 66, 0.3, SHORE - 40 - (k % 2) * 14), k + 1);
    // the beach before the huts: parasols and striped towels
    // (two rows, one before the felt-tips and one behind them, 46 m from thing to thing: none stands in a felt-tip, in
    // the pier's foot or in another)
    for (let i = 0; i < 26; i++) { const col = i >> 1, row = i & 1, x = -45 + col * 46 + (rs() - 0.5) * 14, z = SHORE - (row ? 74 : 18) + (rs() - 0.5) * 8, pa = PA[Math.floor(rs() * 7)], f = fillAt(x, z), rot = rs() * 3, pb = rs() < 0.5 ? 0 : PEN.lemon, sd = rs();
      if (!row && Math.abs(x - 305) < 24) continue;
      if ((col + row) % 2) parasol(st, frame(x, 0.3, z, rot), 9, 14, pa, pb, f, sd);
      else { const T = frame(x, 0.6, z, rot); for (let k = 0; k < 4; k++) st.quad(T(-4, 0, -9 + k * 4.5), T(4, 0, -9 + k * 4.5), T(4, 0, -4.5 + k * 4.5), T(-4, 0, -4.5 + k * 4.5), { pen: k % 2 ? 0 : pa, dir: 0, fill: f, edge: [BOLD, BOLD, k ? THIN : BOLD, k === 3 ? BOLD : THIN], seed: (sd + k * 0.23) % 1 }); } }
    await ctx.yield();
    // the bar of sand round the lagoon, with a mouth where the course crosses it, and its parasols
    const NB = 44, inMouth = (a) => { let d = (a - lay.mouth) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return Math.abs(d) < 0.2; };
    for (let k = 0; k < NB; k++) { const a0 = (k / NB) * TAU, a1 = ((k + 1) / NB) * TAU, am = (a0 + a1) / 2; if (inMouth(am)) continue;
      const at = (a, r) => [LAG.x + r * Math.sin(a), 0.5, LAG.z + r * Math.cos(a)];
      st.quad(at(a0, LAG.bar0), at(a1, LAG.bar0), at(a1, LAG.bar1), at(a0, LAG.bar1), { pen: PEN.lemon, kind: KIND.ground, dir: 0.2, edge: [0, 0, 0.5, 0.9], seed: rs() }); }
    for (let k = 0; k < 38; k++) { const a = (k + 0.5) / 38 * TAU + (rs() - 0.5) * 0.1, r = 343 + (rs() - 0.5) * 22, x = LAG.x + r * Math.sin(a), z = LAG.z + r * Math.cos(a), pa = PA[Math.floor(rs() * 7)];
      if (inMouth(a) || path.nearestXZ(x, z).dist < 40) continue;
      if (k % 3 === 2) lilo(st, frame(x, 0.9, z, rs() * 3), pa, fillAt(x, z, 260, 620), rs()); else parasol(st, frame(x, 0.5, z, rs() * 3), 10, 15, pa, rs() < 0.5 ? 0 : PEN.lemon, fillAt(x, z, 260, 620), rs()); }
    // the wake: a ring coloured coat on coat, at every metre
    for (let k = 0; k < 72; k++) { const a0 = (k / 72) * TAU, a1 = ((k + 1) / 72) * TAU, at = (a, r) => [LAG.x + r * Math.sin(a), 0.35, LAG.z + r * Math.cos(a)];
      st.quad(at(a0, LAG.wake - 17), at(a1, LAG.wake - 17), at(a1, LAG.wake + 17), at(a0, LAG.wake + 17), { pen: PEN.blue, coats: 2, kind: KIND.ring, dir: 0, edge: [0, 0, THIN, THIN], seed: 0.37 }); }
    await ctx.yield();
    // the lifebuoy: the way out stands in it
    { const RI = 42.5, RO = 62, TH = 8.5, NS = 24, F = [0, 1, 1, MODE.full], at = (a, r, t) => [FIN[0] + r * Math.cos(a) * lx + t * hx, FIN[1] + r * Math.sin(a), FIN[2] + r * Math.cos(a) * lz + t * hz];
      for (let k = 0; k < NS; k++) { const a0 = (k / NS) * TAU + 0.13, a1 = ((k + 1) / NS) * TAU + 0.13, red = k % 6 < 2, pen = red ? PEN.scarlet : 0, e0 = k % 6 === 0 || k % 6 === 2 ? THIN : 0, e1 = k % 6 === 1 || k % 6 === 5 ? THIN : 0;
        for (const t of [-TH, TH]) st.quad(at(a0, RI, t), at(a1, RI, t), at(a1, RO, t), at(a0, RO, t), { pen, dir: Math.PI / 2, fill: F, edge: [e0, e1, BOLD, BOLD], seed: 0.1 + k * 0.03, coats: t > 0 ? 2 : 1 });
        st.quad(at(a0, RO, -TH), at(a1, RO, -TH), at(a1, RO, TH), at(a0, RO, TH), { pen, dir: Math.PI / 2, fill: F, coats: 2, edge: [e0, e1, 0, 0], seed: 0.4 + k * 0.03 });
        st.quad(at(a0, RI, -TH), at(a1, RI, -TH), at(a1, RI, TH), at(a0, RI, TH), { pen, dir: Math.PI / 2, fill: F, coats: 2, edge: [e0, e1, 0, 0], seed: 0.7 + k * 0.03 }); } }
    // the lighthouse to the right of the way out, coloured BY PLACE from 1300 m of route before the place nearest it (900 m
    // sooner than a small thing: it is the tallest thing there), its lantern at every metre; behind it green downs with
    // a gap where the fleet sails out, and violet hills behind them, coloured at every metre
    { const x = FIN[0] - 190 * lx + 40 * hx, z = FIN[2] - 190 * lz + 40 * hz, f0 = fillAt(x, z, 260, 700), f = [f0[0] - 900, 500, 1, MODE.place], T = frame(x, 0, z), bands = [[0, 12, 34, 28, 0, f]];
      for (let k = 0; k < 6; k++) bands.push([12 + k * 22, 34 + k * 22, 18 - k * 1.1, 18 - (k + 1) * 1.1, k % 2 ? PEN.lemon : PEN.scarlet, f]);
      bands.push([144, 148, 16, 16, 0, f], [148, 164, 8.5, 8.5, PEN.lemon, [0, 1, 1, MODE.full]], [164, 178, 11, 0.5, PEN.scarlet, f]); drum(st, T, 12, bands, { rib: 0, hoop: BOLD, seed: 0.6 });
      disc(st, T, 12, 12, 28, 0, { fill: f, spoke: 0, rim: 0, seed: 0.2 }); disc(st, T, 12, 144, 16, 0, { fill: f, spoke: 0, rim: 0, seed: 0.5 }); }      // the base's shoulder and the gallery's floor
    const rc = stream('cliffs');
    for (const [fwd, h0, h1, front] of [[900, 100, 190, 1], [1180, 200, 330, 0]]) { const ph = rc() * 6.3, hill = (l) => h0 + (h1 - h0) * (0.5 + 0.3 * Math.sin(l * 0.0031 + ph) + 0.2 * Math.sin(l * 0.0083 + ph * 2.3));
      const pt = (l) => { const f = fwd + 70 * Math.sin(l * 0.0041 + fwd); return [FIN[0] + l * lx + f * hx, FIN[2] + l * lz + f * hz]; };
      for (let lat = -2400; lat < 2400; lat += 60) { const p0 = pt(lat), p1 = pt(lat + 60), ha = hill(lat), hb = hill(lat + 60), sd = rc();
        if (front && lat + 60 > 30 && lat < 250) continue;
        st.quad([p0[0], 0, p0[1]], [p1[0], 0, p1[1]], [p1[0], hb, p1[1]], [p0[0], ha, p0[1]], { pen: front ? PEN.green : PEN.violet, dir: 0, fill: [0, 1, 1, MODE.full], edge: [0, 0, 0.9, 0.9], seed: sd, size: [60, 150] }); } }
    // the channel to the way out: cones on white floats, scarlet to the left and green to the right, 72 m to either side,
    // none on the bar of sand or in the lagoon
    const placed = [], free = (x, z, r) => !placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < r + q[2]);      // what floats outside the lagoon, each a place and a reach: none is laid on another
    for (let k = 1; k <= 9; k++) for (const sg of [1, -1]) { const x = FIN[0] - k * 62 * hx + sg * 72 * lx, z = FIN[2] - k * 62 * hz + sg * 72 * lz, f = fillAt(x, z);
      if (Math.hypot(x - LAG.x, z - LAG.z) < LAG.bar1 + 14) continue;
      drum(st, frame(x, 0, z), 8, [[0, 4, 6.5, 6.5, 0, f], [4, 21, 5.6, 0.5, sg > 0 ? PEN.scarlet : PEN.green, f]], { rib: 0, hoop: BOLD, seed: k * 0.1 }); placed.push([x, z, 8]); }
    // clouds: outlines on the blank sky
    const rk = stream('clouds');
    for (let i = 0; i < 22; i++) { const a = (i + rk() * 0.7) / 22 * TAU, r = 2500 + rk() * 700, y = 420 + rk() * 900, w = 470 + rk() * 300, h = w * 0.42, x = -100 + r * Math.sin(a), z = 1000 + r * Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a);
      st.quad([x - tx * w / 2, y, z - tz * w / 2], [x + tx * w / 2, y, z + tz * w / 2], [x + tx * w / 2, y + h, z + tz * w / 2], [x - tx * w / 2, y + h, z - tz * w / 2], { pen: 0, kind: KIND.cloud, edge: [3.2, 0, 0, 0], seed: rk() }); }
    // THE SKY is blank paper: outline clouds, a sun coloured BY PLACE between 90 and 610 m flown, and balloons
    { const sa = Math.atan2(hx, hz) + 0.45, RS = 5200, sp = [-100 + RS * Math.sin(sa), 1700, 1000 + RS * Math.cos(sa)], tx = Math.cos(sa), tz = -Math.sin(sa), w = 560;
      st.quad([sp[0] - tx * w, sp[1] - w, sp[2] - tz * w], [sp[0] + tx * w, sp[1] - w, sp[2] + tz * w], [sp[0] + tx * w, sp[1] + w, sp[2] + tz * w], [sp[0] - tx * w, sp[1] + w, sp[2] - tz * w], { pen: PEN.lemon, kind: KIND.sun, dir: 0.5, fill: [90, 520, 1, MODE.place], edge: [6, 0, 0, 0], seed: 0.3, size: [1120, 1120] }); }
    // BALLOONS: each a body by itself; CLEAR AIR BY PLACE at the build: none within 70 m of its own size of any point
    // of the route, none over the lagoon, none standing in the sheet of the downs or of the hills (within its own size
    // and 90 m of either line, unless it floats above the sheet's top); all are coloured at every metre
    const rb = stream('balloons'), balloons = [];
    for (let tries = 0; balloons.length < 30 && tries < 1500; tries++) { const far = balloons.length >= 15, a = rb() * TAU, rr = far ? 1300 + rb() * 1500 : 200 + rb() * 800, x = 100 + rr * Math.sin(a), z = 700 + rr * Math.cos(a), y = 90 + rb() * (far ? 520 : 240), R = (far ? 62 : 34) + rb() * 24;
      let ok = Math.hypot(x - LAG.x, z - LAG.z) > LAG.bar1 + 30 && !balloons.some((b) => Math.hypot(b.x - x, b.z - z) < 170);
      { const fw = (x - FIN[0]) * hx + (z - FIN[2]) * hz, low = y - 0.8 * R; if ((Math.abs(fw - 900) < R + 90 && low < 200) || (Math.abs(fw - 1180) < R + 90 && low < 345)) ok = false; }
      if (Math.hypot(x - (FIN[0] - 190 * lx + 40 * hx), z - (FIN[2] - 190 * lz + 40 * hz)) < R + 50 && y < 215) ok = false;      // not in or on the lighthouse (178 m tall)
      for (let k = 0; k <= RM && ok; k += 8) if (Math.hypot(rx[k] - x, ry[k] - (y + R), rz[k] - z) < 2.2 * R + 70) ok = false;
      if (!ok) continue;
      const sh = book.sheet(), pa = PA[Math.floor(rb() * 7)], pb = rb() < 0.5 ? PEN.lemon : 0; balloon(sh, frame(0, 0, 0), R, pa, pb, [0, 1, 1, MODE.full], rb());
      const m = book.mesh(sh, 'balloon'); m.position.set(x, y, z); scene.add(m); balloons.push({ m, x, y, z, ph: rb() * TAU }); }
    await ctx.yield();

    // ---- the fleet's own course: out of the shed, up the lane, round the far mark, past the way out, through the gap in
    // the downs (it lies 0 to 300 m to the left of the way out; the course goes through 140 m to the left) and round to
    // the left behind the downs, where it ends 430 m to the left of where it came through, out of sight ----
    const pass = [FIN[0] + 140 * lx, FIN[2] + 140 * lz];
    const fp = makePath([[606, 0, SHORE - 69], [600, 0, SHORE + 40], [560, 0, 20], [524, 0, 300], [523, 0, 650], [520, 0, 1000], [512, 0, 1250], [470, 0, 1420], [380, 0, 1510], [230, 0, 1572], [230 + (pass[0] - 230) * 0.33, 0, 1572 + (pass[1] - 1572) * 0.33], [230 + (pass[0] - 230) * 0.66, 0, 1572 + (pass[1] - 1572) * 0.66],
      [pass[0], 0, pass[1]], [pass[0] + 300 * hx, 0, pass[1] + 300 * hz], [pass[0] + 600 * hx, 0, pass[1] + 600 * hz], [pass[0] + 880 * hx, 0, pass[1] + 880 * hz],
      [pass[0] + 1010 * hx + 70 * lx, 0, pass[1] + 1010 * hz + 70 * lz], [pass[0] + 1040 * hx + 250 * lx, 0, pass[1] + 1040 * hz + 250 * lz], [pass[0] + 1040 * hx + 430 * lx, 0, pass[1] + 1040 * hz + 430 * lz]], { samples: 600 }), Lf = fp.length;
    const FT = 900, fx = new Float32Array(FT + 2), fz = new Float32Array(FT + 2), ftx = new Float32Array(FT + 2), ftz = new Float32Array(FT + 2);
    for (let i = 0; i <= FT + 1; i++) { const d = Math.min(1, i / FT) * Lf; fp.posAtDist(d, v3); fx[i] = v3.x; fz[i] = v3.z; fp.tangentAtDist(d, v3); const l = Math.hypot(v3.x, v3.z) || 1; ftx[i] = v3.x / l; ftz[i] = v3.z / l; }
    const wMark = fp.nearestXZ(430, 1468).u * Lf, laneW = (way) => (68 - 24 * ss(wMark - 320, wMark - 60, way)) * (0.27 + 0.73 * ss(72, 330, way));      // narrow in the shed (its walls 31 m to either side)
    { const i = Math.round(wMark / Lf * FT), x = fx[i] - ftz[i] * 82, z = fz[i] + ftx[i] * 82; markShape(st, frame(x, 0, z, 0, 1.25), fillAt(x, z, 400, 900), PEN.orange, PEN.violet); placed.push([x, z, 12]); }
    // bigger rowing boats under parasols, 62 to 92 m from the route, two to the right for one to the left: the lookers-on
    { const ro = stream('lookers');
      for (let s = 300, n = 0; s < L - 200; s += 45, n++) { const i = Math.round(s / L * RM), i1 = Math.min(RM, i + 1), ex = rx[i1] - rx[Math.max(0, i1 - 1)], ez = rz[i1] - rz[Math.max(0, i1 - 1)], el = Math.hypot(ex, ez) || 1;
        const lat = (n % 3 === 2 ? 1 : -1) * (62 + ro() * 30), x = rx[i] + lat * ez / el, z = rz[i] - lat * ex / el, rot = ro() * 6.3, pa = PA[Math.floor(ro() * 6)], pb = PA[Math.floor(ro() * 7)], sd = ro();
        if (z < SHORE + 40 || Math.hypot(x - LAG.x, z - LAG.z) < LAG.bar1 + 26 || path.nearestXZ(x, z).dist < 56 || fp.nearestXZ(x, z).dist < 110 || (Math.abs(x - 305) < 62 && z < 275) || !free(x, z, 22)) continue;
        rowboat(st, frame(x, 0.5, z, rot, 2.2), pa, pb, fillAt(x, z), sd); placed.push([x, z, 22]); } }
    // and SMALLER THINGS ON THE WATER beside the route (rafts, flag buoys, rowing boats), coloured BY PLACE as we come: none within
    // 44 m of the route in the plan, none in the fleet's lane, none on the sand
    const rw = stream('water'), afloat = (x, z) => { const T = frame(x, 0.5, z, rw() * 6.3, 1.5), f = fillAt(x, z), pa = PA[Math.floor(rw() * 7)], kd = rw();
      if (kd < 0.4) lilo(st, T, pa, f, rw()); else if (kd < 0.72) flagBuoy(st, T, pa, f, rw()); else rowboat(st, T, pa, PA[Math.floor(rw() * 7)], f, rw()); };
    for (let s = 280; s < L - 140; s += 25) { const i = Math.round(s / L * RM), i1 = Math.min(RM, i + 1), ex = rx[i1] - rx[Math.max(0, i1 - 1)], ez = rz[i1] - rz[Math.max(0, i1 - 1)], el = Math.hypot(ex, ez) || 1;
      const lat = (rw() < 0.5 ? -1 : 1) * (46 + rw() * 120), x = rx[i] + lat * ez / el, z = rz[i] - lat * ex / el, r = Math.hypot(x - LAG.x, z - LAG.z);
      if (z < SHORE + 25 || r < LAG.bar1 + 12 || path.nearestXZ(x, z).dist < 44 || fp.nearestXZ(x, z).dist < 100 || (Math.abs(x - 305) < 45 && z < 260) || !free(x, z, 15)) { rw(); rw(); rw(); rw(); continue; }
      afloat(x, z); placed.push([x, z, 15]); }
    // and in the lagoon, between the launch's circle and ours, a ring of rowing boats under parasols, coloured at every
    // metre like the lagoon itself: more lookers-on
    { const rl = stream('lagoon'); for (let k = 0; k < 14; k++) { const a = (k + rl() * 0.45) / 14 * TAU, r = 200 + rl() * 18, x = LAG.x + r * Math.sin(a), z = LAG.z + r * Math.cos(a);
        rowboat(st, frame(x, 0.5, z, rl() * 6.3, 1.8), PA[Math.floor(rl() * 6)], PA[Math.floor(rl() * 7)], [0, 1, 1, MODE.full], rl()); } }
    scene.add(book.mesh(st, 'still'));
    const nF = Math.round(140 * density * detail), rf = stream('fleet'), boats = [];
    for (let i = 0; i < nF; i++) boats.push({ w0: (i + rf() * 0.7) / nF * Lf, lat: (rf() * 2 - 1), perm: Math.floor(rf() * 8), ph: rf() * TAU });
    const fleet = book.fleet(dinghy(book.sheet()), nF, 'fleet'), spins = book.fleet(spinnaker(book.sheet()), nF, 'spinnakers'); scene.add(fleet.mesh, spins.mesh);
    // three dinghies it has knocked flat lie inside its circle, 78 m from the middle, clear of its foam (placed below, once)
    const flats = book.fleet(dinghy(book.sheet()), 3, 'flat'); scene.add(flats.mesh);
    await ctx.yield();

    // ---- the hero and its works ----
    const hero = book.mesh(launch(book.sheet()), 'launch'); hero.scale.setScalar(1.45); scene.add(hero);
    const marks = []; { const sh = book.sheet(); markShape(sh, frame(0, 0, 0), [0, 1, 1, MODE.full]); const g = sh.geometry();
      for (let k = 0; k < 3; k++) { const a = M0 + k * TAU / 3, m = new THREE.Mesh(g, book.plain); m.frustumCulled = false; m.name = 'mark'; m.position.set(LAG.x + LAG.wake * Math.sin(a), 0, LAG.z + LAG.wake * Math.cos(a)); m.scale.setScalar(1.3); scene.add(m); marks.push(m); } }
    const band = book.sheet(), FULL = [0, 1, 1, MODE.full], T0 = frame(0, 0, 0);
    drum(band, T0, 16, [[0, TOWER.h, TOWER.r, TOWER.r, 1, FULL]], { rib: 0, hoop: BOLD, seed: 0.3 }); disc(band, T0, 16, TOWER.h, TOWER.r, 1, { fill: FULL, spoke: 0, rim: 0, seed: 0.5 });
    const tower = book.fleet(band, TOWER.n, 'tower'); scene.add(tower.mesh);
    // the cup on top of the pile: it hops up for each rosette and comes down on it, and turns slowly
    const cupS = book.sheet(); drum(cupS, T0, 12, [[0, 3, 10, 10, PEN.lemon, FULL], [3, 12, 3.2, 3.2, PEN.lemon, FULL], [12, 34, 6, 16, PEN.lemon, FULL]], { rib: THIN, hoop: BOLD, seed: 0.7 }); disc(cupS, T0, 12, 33, 15.6, PEN.orange, { fill: FULL, spoke: 0, rim: 0, seed: 0.2 }); disc(cupS, T0, 12, 12, 6, PEN.lemon, { fill: FULL, spoke: 0, rim: 0, seed: 0.3 }); disc(cupS, T0, 12, 0.4, 10, PEN.lemon, { fill: FULL, spoke: 0, rim: 0, seed: 0.6 });      // lids: the rim's, the bowl's foot, the base's sole
    for (const sg of [-1, 1]) for (const [a, b, c, d] of [[[14, 30], [24, 30], [24, 27], [12.6, 27]], [[21, 27], [24, 27], [24, 19], [21, 19]], [[9, 19], [24, 19], [24, 16], [8, 16]]]) cupS.quad([sg * a[0], a[1], 0], [sg * b[0], b[1], 0], [sg * c[0], c[1], 0], [sg * d[0], d[1], 0], { pen: PEN.lemon, dir: 0, fill: FULL, edge: [THIN, THIN, THIN, THIN], seed: 0.5 });
    const cup = book.mesh(cupS, 'cup'); cup.scale.setScalar(1.5); scene.add(cup);
    const wobX = (q) => 5 * Math.sin(q * 2.4), wobZ = (q) => 5 * Math.cos(q * 1.7 + 1);
    // a rosette: a pleated disc on edge with two tails; it rises upright, lies down in the air and slides in on to the pile
    const ros = book.sheet(), TZ = (x, y, z) => [x, z, y]; drum(ros, TZ, 12, [[-1.6, 1.6, 12, 12, 1, FULL]], { rib: THIN, hoop: BOLD, seed: 0.2 });
    for (const zz of [1.6, -1.6]) { for (let k = 0; k < 12; k++) { const a0 = (k / 12) * TAU, a1 = ((k + 1) / 12) * TAU; ros.quad([12 * Math.cos(a0), 12 * Math.sin(a0), zz], [12 * Math.cos(a1), 12 * Math.sin(a1), zz], [5 * Math.cos(a1), 5 * Math.sin(a1), zz], [5 * Math.cos(a0), 5 * Math.sin(a0), zz], { pen: 1, dir: Math.PI / 2, fill: FULL, edge: [THIN, THIN, 0, BOLD], seed: 0.1 * k });
        ros.quad([5 * Math.cos(a0), 5 * Math.sin(a0), zz], [5 * Math.cos(a1), 5 * Math.sin(a1), zz], [0, 0, zz], [0, 0, zz], { pen: 3, dir: 0, fill: FULL, edge: [0, 0, 0, 0], seed: 0.3 }); } }
    for (const sg of [-1, 1]) ros.quad([sg * 1, -10, 0], [sg * 6, -10, 0], [sg * 10, -30, 0], [sg * 4, -30, 0], { pen: 1, dir: Math.PI / 2, fill: FULL, edge: [BOLD, BOLD, 0, BOLD], seed: 0.4 });
    const rosettes = book.fleet(ros, 3, 'rosettes'); scene.add(rosettes.mesh);
    // the points: a plus and one plain stroke of a tally, what a mark gives each time it is taken; one sheet, held facing the eye
    const plus = book.sheet(); { const arm = (x0, y0, x1, y1, e) => plus.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], { pen: PEN.lemon, dir: 0.6, fill: FULL, edge: e, seed: 0.2 });
      arm(-9.4, -2.4, -4.6, 2.4, [0, 0, 0, 0]); arm(-15, -2.4, -9.4, 2.4, [BOLD, 0, BOLD, BOLD]); arm(-4.6, -2.4, 1, 2.4, [0, BOLD, BOLD, BOLD]); arm(-9.4, 2.4, -4.6, 8, [BOLD, BOLD, 0, BOLD]); arm(-9.4, -8, -4.6, -2.4, [BOLD, BOLD, BOLD, 0]);
      arm(6, -8, 10.8, 8, [BOLD, BOLD, BOLD, BOLD]); }
    const pluses = book.fleet(plus, 3, 'pluses'); scene.add(pluses.mesh);
    const puff = book.sheet(); puff.quad([-11, -5, 0], [11, -5, 0], [11, 5, 0], [-11, 5, 0], { pen: 0, kind: KIND.cloud, edge: [0.4, 0, 0, 0] });
    const NP = 8, smoke = book.fleet(puff, NP, 'smoke'); scene.add(smoke.mesh);
    await ctx.yield();

    const W = TAU / LAG.lap, dummy = new THREE.Object3D(), axis = new THREE.Vector3(), topAt = new THREE.Vector3(LAG.x, TOWER.H + 2, LAG.z);
    const put = (f, i, a, b) => { dummy.updateMatrix(); f.mesh.setMatrixAt(i, dummy.matrix); f.inst.setXYZW(i, a, b, 0, 0); };
    for (let k = 0; k < 3; k++) { const a = M0 + (2 * k + 0.5) * TAU / 6 + (rf() - 0.5) * 0.3; dummy.position.set(LAG.x + 78 * Math.sin(a), 4, LAG.z + 78 * Math.cos(a)); dummy.rotation.set(0, a * 2.3 + rf() * 6, 1.72, 'YXZ'); dummy.scale.setScalar(1); put(flats, k, 1, Math.floor(rf() * 8)); }
    flats.mesh.instanceMatrix.needsUpdate = true; flats.inst.needsUpdate = true;
    const speed = (s) => 1.2 - 0.3 * ss(sLane - 500, sLane - 100, s) + 0.02 * ss(sIn, sIn + 200, s) + 0.25 * ss(sOut - 100, sOut + 250, s);
    const look0 = new THREE.Vector3(LAG.x, 70, LAG.z), lookV = new THREE.Vector3();
    // the gaze on the circle goes with the launch BY THE PLACE'S OWN CLOCK: a point 0.7 of the way from the pile to the launch,
    // 42 m up where the eye is high and up to 60 m where the eye is low (BY PLACE: the route's own height there)
    const eyeY = (u) => { const f = Math.min(RM - 0.001, Math.max(0, u * RM)), i = Math.floor(f); return ry[i] + (ry[i + 1] - ry[i]) * (f - i); };
    const look1 = (time, u) => { const a = A0 + time * W; return lookV.set(LAG.x + 0.7 * LAG.wake * Math.sin(a), 42 + 18 * (1 - ss(24, 70, eyeY(u))), LAG.z + 0.7 * LAG.wake * Math.cos(a)); };
    const live = [rosettes, pluses, tower, smoke, fleet, spins];
    return {
      scene, path, duration: 115, pace: (u) => speed(u * L),
      camera: { fov: 62, near: 0.5, far: 7800, lookAhead: 30, sway: 0.25, bank: 0 },
      // the gaze, BY PLACE: toward the lagoon on the way in; on the way round it, toward the launch and the pile (look1);
      // each comes and goes over a length of route (520 m, 650 m)
      pois: [{ at: look0, from: 0, to: (sIn - 250) / L, weight: 0.6, fade: 520 / L },
        { at: look1, from: (sIn - 520) / L, to: (sOut - 60) / L, weight: 0.88, fade: 650 / L, arc: true, steady: true }],
      portal: { shape: 'circle', radius: 42, color: PENS[6], frame: 0, glow: 0, halo: false, veil: PENS[6], revealDistance: 2 * L },
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      marks: { L, sLane, sIn, sOut, Lf, wMark, boats: nF, tiles: ground.count(), still: st.count(), box: BOX },
      update(dt, time, camera, u) {
        const a = A0 + time * W, turns = a / TAU, me = camera.matrixWorld.elements, ex = me[12], ez = me[14];
        U.uS.value = u * L; U.uTime.value = time; U.uRing.value.z = a % TAU;
        // the launch on its circle
        hero.position.set(LAG.x + LAG.wake * Math.sin(a), -4.4 + 0.8 * Math.sin(time * 2.1), LAG.z + LAG.wake * Math.cos(a));      // it sits in the water (its hull has no bottom): its heel lifts the outer stern corner 2.3 m and its bob and pitch 2 m more, so the corner's foot stays under the sea
        hero.rotation.set(0.03 * Math.sin(time * 1.7), a + Math.PI / 2, -0.16, 'YXZ');
        // the marks: down as its stem reaches them, under while it runs over them, afloat on their sides behind it, up again
        // half a lap later; each sends a rosette to the pile
        for (let k = 0; k < 3; k++) { const am = M0 + k * TAU / 3, since = turns + AHEAD - am / TAU, d = since - Math.floor(since), m = marks[k];
          const tilt = 1.5 * ss(0, 0.012, d) * (1 - ss(0.5, 0.55, d)) + (d > 0.55 ? 0.3 * Math.sin((d - 0.55) * 70) * Math.exp(-(d - 0.55) * 16) : 0);
          axis.set(-Math.sin(am), 0, -Math.cos(am)); m.quaternion.setFromAxisAngle(axis, tilt);
          m.position.y = -16 * ss(0.004, 0.02, d) * (1 - ss(0.172, 0.2, d));      // under the sea while the hull is over it (lying, it reaches 64 m on; the stern has passed all of it at 0.171 of a lap)
          // the rosette rises over the launch as it passes under (small at first: its tails stay above the fires), lies down,
          // and for the last 55 m slides in level under the lifted cup
          if (d < FLY) { const t = d / FLY, e = Math.pow(t, 1.6); dummy.position.set(m.position.x + (topAt.x - m.position.x) * e, 56 + (topAt.y - 56) * ss(0, 0.6, t) + 40 * Math.sin(Math.PI * Math.min(1, t / 0.75)), m.position.z + (topAt.z - m.position.z) * e);
            dummy.rotation.set(-Math.PI / 2 * ss(0.5, 0.75, t), time * 1.6 + k, 0, 'YXZ'); dummy.scale.setScalar(0.3 + 0.7 * ss(0.1, 0.4, t)); } else { dummy.position.copy(topAt); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.0001); }
          put(rosettes, k, 0, (((3 * Math.floor(since) + k) % 8) + 8) % 8);
          // the sign rises from over the launch's fires
          const tp = d / 0.2; dummy.position.set(m.position.x, 74 + 52 * Math.min(1, tp), m.position.z); dummy.rotation.set(0, Math.atan2(ex - m.position.x, ez - m.position.z), 0); dummy.scale.setScalar(tp < 1 ? Math.max(0.0001, 1.5 * ss(0, 0.12, tp) * (1 - ss(0.8, 1, tp))) : 0.0001); put(pluses, k, 0, 0); }
        // the pile takes each rosette on top and sinks by its height; each lies a little off the one under it
        const g = 3 * (turns + AHEAD - M0 / TAU) - 3 * FLY, G = Math.floor(g), hTop = TOWER.h * ss(0, 0.3, g - G);
        for (let j = 0; j < TOWER.n; j++) { dummy.position.set(LAG.x + wobX(G - j), TOWER.H - hTop - j * TOWER.h, LAG.z + wobZ(G - j)); dummy.rotation.set(0, (G - j) * 2.4, 0); dummy.scale.set(1, j ? 1 : Math.max(0.0005, hTop / TOWER.h), 1); put(tower, j, 0, (((G - j) % 8) + 8) % 8); }
        { const p = g - G, e = ss(0, 0.3, p), lift = Math.max(ss(0.78, 0.89, p), 1 - ss(0.02, 0.12, p));      // up before the rosette is under its foot, down on it after
          cup.position.set(LAG.x + wobX(G - 1) + (wobX(G) - wobX(G - 1)) * e, TOWER.H + 16 * lift, LAG.z + wobZ(G - 1) + (wobZ(G) - wobZ(G - 1)) * e); cup.rotation.y = time * 0.5; }
        // its smoke: outline puffs left along the circle behind it, rising and growing, each one sheet held facing the eye
        const PT = 0.8, fr = (time / PT) % 1;
        for (let j = 0; j < NP; j++) { const age = (j + fr) * PT, aj = a - 0.087 - age * W, r = LAG.wake - 2.5 * age, px = LAG.x + r * Math.sin(aj), pz = LAG.z + r * Math.cos(aj); dummy.position.set(px, 63 + 8 * age, pz);
          dummy.rotation.set(0, Math.atan2(ex - px, ez - pz), 0); dummy.scale.setScalar((0.8 + 0.2 * age) * Math.min(1, age / 0.4) * (j === NP - 1 ? 1 - fr : 1)); put(smoke, j, 0, 0); }
        for (const b of balloons) { b.m.position.y = b.y + 6 * Math.sin(time * 0.3 + b.ph); b.m.rotation.y = time * 0.04 + b.ph; }
        // the fleet
        for (let i = 0; i < nF; i++) { const b = boats[i], way = (b.w0 + time * FSPEED) % Lf, ft = way / Lf * FT, i0 = Math.floor(ft), f = ft - i0, tx = ftx[i0] + (ftx[i0 + 1] - ftx[i0]) * f, tz = ftz[i0] + (ftz[i0 + 1] - ftz[i0]) * f;
          const lat = b.lat * laneW(way) + 3 * Math.sin(time * 0.4 + b.ph), sc = (0.6 * ss(0, 45, way) + 0.4 * ss(72, 130, way)) * (1 - ss(Lf - 80, Lf - 8, way));      // under the shed's eaves a boat is six tenths grown; it goes to nothing behind the downs
          dummy.position.set(fx[i0] + (fx[i0 + 1] - fx[i0]) * f - tz * lat, 0.6 * Math.sin(time * 1.6 + b.ph), fz[i0] + (fz[i0 + 1] - fz[i0]) * f + tx * lat);
          dummy.rotation.set(0.025 * Math.sin(time * 1.9 + b.ph), Math.atan2(tx, tz), 0.09 + 0.04 * Math.sin(time * 1.1 + b.ph * 1.7), 'YXZ'); dummy.scale.setScalar(Math.max(0.0001, sc)); put(fleet, i, way / (0.3 * Lf), b.perm);
          dummy.scale.setScalar(Math.max(0.0001, sc * ss(wMark + 30, wMark + 90, way))); put(spins, i, (way - wMark - 30) / 220, b.perm); }
        for (const f of live) { f.mesh.instanceMatrix.needsUpdate = true; f.inst.needsUpdate = true; }
      },
      dispose() { routeTex.dispose(); },
    };
  },
};
