// The Car That Must Back Up: the hero set piece and the style kit of the world.
// CUT PAPER ON A LIGHT TABLE AT THE BLUE HOUR (design/sb/newworld5/cbu-law.md is the law of this world).
//
// WHAT THIS FILE HOLDS, IN THE ORDER A READER NEEDS IT
//  1. THE PLAN'S NUMBERS, typed once from design/sb/newworld5/cbu-plan.json (the block below). Nothing else in
//     this file or in the world file types them again: import them from here.
//  2. PLAIN EXPORTS for a counting script (no browser, no renderer; this file's top level builds nothing):
//     curveY(x), curveDy(x), cbuRun(...) (the plan's own short code), runTable(), RUN_EVENTS(),
//     carAt(tRun), timeOfCar(k, t), beaconLit(k, t), lineZ(k), sweptTop(x), ROUTE_POINTS; the steam's and the
//     headlamp patch's rules (STEAM, steamOn(c), steamPuff(c, time, k, j), PUFF_CUT, plumeOn(c), LAMP, lampReach(c))
//     and the station's (STATION, shedMouthBack(k), shedMouthX(k)).
//  3. makeStyle(ctx, opts): the palette, the ONE unlit paper material family, the geometry helpers
//     and the makers of everything that stands on a line. The world builds all 190 lines with it.
//  4. buildHero(ctx, opts): a stretch of the valley (opts.lines sheets, a little over one wavelength of the
//     wave) with everything a line has, on its own piece of the light table.
//
// THE RUN IS ON THE CLOCK ALONE (law 3, 4). cbuRun integrates s'' = F dir - g sin(slope) ONCE into a table of
// place against time (621 rows, one every 0.1 s, never stretched). Car k stands at the table's place at
// timeOfCar(k, t) = (t - k P) mod T, linear between rows, on the tangent of the curve at its middle; from the
// table's last row (62 s) to T the line has no car. t is the time given to update(); nothing reads u or the lens.
// P = -3.05 s: a car one line further down-valley is 3.05 s LATER in its run, so one whole run is laid out along
// 20.98 lines (167.87 m) of valley and travels up-valley at 2.623 m/s as a wave. The step's sign is the crew
// lead's ruling (at a positive step the cars read as scatter); its size is the plan's, from the path and the
// pace alone (the straight try falls inside the opening and the last swing inside the rim leg at every clock).
//
// THE LIGHT BELONGS TO THE PAPER BY PLACE (law 7). There is no lamp and no shading: every vertex carries one
// flat ink. Which ink a face gets: a sheet's face that looks up-valley is mix(paper, paperFar, f), its face that
// looks down-valley the darker pair at the same f, where f is the sheet's place in the valley's run of inks,
// k / 189, in the paper of the sheet's stock (the sheets stand in runs of 6 to 20 of one stock, by the sheet's
// number alone: RUNS, with the five stocks said beside it); the lowest 10 m of every face over the light table and
// the 8 m above are two warmer bands built as strips of their own; the cut top edge is the sheet's own up-valley
// ink taken part of the way to the paper's pale core, 0.36 of the way on the first sheet falling evenly to 0.16
// on the last (by the sheet's number alone); the rail and its teeth are the sheet's down-valley ink taken 0.22 of
// the way to the dark ink, the same on every sheet; under the far hall's roof an edge is taken 0.55 of the way to
// the dark ink; things are the dark ink; windows, lamp discs, beacon discs, the patch under a car, the
// headlamp's patch ahead of it and the station's panes, lining and floor are warm paper that is there or not there
// by place and by the run's own time.
//
// THE WAY OUT is the engine's own portal (radius 9 m) at the route's last point (WAY_OUT), 17 m over the plain
// among the cars at rest. portal.drawWithin and portal.drawIn are NOT set, nor is revealDistance: the far ridge
// itself hides the way out from every place of the flight until the lens is over the crest's height (the plan's
// reason, route.portal). Neither file builds a light of any kind or a ring or double of the portal.
//
// SIZE AND COST of buildHero at its defaults (24 lines): about 45,900 triangles and 14 draw calls; radius 130 m
// (the ridge and the trough; the plateau and the far country run on beyond it), height 124 m from the light table
// to the crest. One line of the world costs about 750 triangles of sheet and rail (about 144 of them the rail's
// teeth; the things cut into some sheets counted in), up to 277 of the station's span, buffer with its lamp and
// crest things, then pines and what stands on the upland behind the rim (field strips, hedges, lane, lamps,
// buildings), 266 of car, 108 of its steam, its two patches and its piece under the station's roof, and about 97 of the
// far hall's span.
//
// opts of buildHero: palette (the brief's seven hex strings), detail (0.6 to 1: thins pines and the rack's
//   teeth), style (the world's one makeStyle instance), lines (how many sheets, default 24), k0 (the number
//   of the first sheet, default 83; it sets the inks and the cars' place in the wave), table (false: no
//   piece of light table), hall (false: no piece of the far hall), rest (false: no cars at rest), xMax (where
//   the far country is cut off, default 700), sky (true or a radius: adds the built sky about the piece).
// The piece's local frame is the world's own, moved along z only: local x and y are the world's x and y
// (x 0 is half way up the far ridge, y 0 the bottom), local z 0 is the middle of the stretch; +z is down-valley.
// anchors (local): crest, bottom, rimEnd, farFoot (points on the middle line); viewpoints.fromFoot,
//   .fromRim, .beside (eye and look pairs like the flight's three sights of the ridge); flyThrough (the
//   plan's route moved so that its crossing of the crest lies over the piece's middle; over the lines by the
//   plan's room); portalSeat (the plan's way out in the same frame: position and facing).
// update(dt, time, camera): poses cars, the patch under each, the headlamps' patches, the steam, the cars' pieces
// under the station's roof, the far hall's vents' plumes and the beacons by time alone; the camera is not read.

import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------
// THE PLAN'S NUMBERS (design/sb/newworld5/cbu-plan.json; plan v5e keeps every number typed here as plan v4 gave it). Metres, seconds.
// Axes: +x from the near flank across to the far ridge, +z down-valley, y up.
export const S = 150;            // m, curve.S
export const A = 50;             // m, curve.A
export const G = 9.81;           // m/s2, run.g
export const F = 1.317;          // m/s2, run.F: the one fixed thrust
export const START = -15;        // m of x from the bottom, run.start (the car rolls out of its shed there)
export const T = 64;             // s, run.T: the period of every car
export const TABLE_END = 62;     // s, run.table.lastRowIsAtS: after it the line has no car until T
export const P = -3.05;          // s, wave.P: the step of the wave from one line to the next
export const D = 8;              // m, sheets.spacing: sheet k stands in the plane z = k D
export const N = 190;            // sheets.count, k = 0 (the up-valley end) to 189
export const THICK = 1.2;        // m, sheets.thickness
export const VB = 27.5;          // m/s, run.brake.Vb: the rack's holding speed on the far side
export const CAR = { L: 20, W: 3.4, H: 4.8, plume: 3.5 };            // m, car.box and car.plume
export const HALL = { x0: 240, x1: 290, y1: 9, under: 8.4, z0: -4, z1: 1516 };   // m, farHall.box
export const SHED = { x: -93.54, halfL: 14, h: 7, halfW: 3 };        // m, sheets.otherThings.shed
export const CREST_BOX = { before: 4, beyond: 9, h: 12.6, halfW: 3 };   // m, sheets.otherThings.crestThings
export const RIM_PLATEAU_H = 14; // m over the rim's end height, sheets.otherThings.rimPlateau
export const BEACON = { litAt: 51.95, stays: 6 };                    // s of the run, beacon
export const X_RIM = -180;       // m, curve.rimEnd.x (y 72.126): the buffer
export const X_BOTTOM = -Math.PI * S / 6;   // m, -78.54 (y 0)
export const X_CREST = Math.PI * S / 6;     // m, +78.54 (y 100)
export const X_FAR_FOOT = Math.PI * S / 2;  // m, 235.62 (y 0); the line is level beyond it
// farCountry.carsAtRest and farCountry.theWayOutsGround: where a row may stand (x0 to x1), the rows by the last
// stretch (on lines near.lines every row begins at x0 and holds near.least cars or more), and the bare ground
// under the way out (on lines bare.lines no part of a car between bare.x[0] and bare.x[1]); nose to nose 21.6 m
export const REST = { x0: 296, x1: 880, pitch: 21.6, near: { lines: [116, 138], least: 8 }, bare: { lines: [130, 132], x: [337.7, 361.7] } };
export const ROOM = { clear: 3.0 };          // m, the clear air the route keeps (car.roomOverTheRails.rule)
export const PART_CHECK = { rows: 621, tolS: 0.01,                  // run.partCheck
  stalls: [7.672, 16.027, 25.412, 36.328], bottoms: { 1: 11.056, 3: 29.873, 4: 41.615 },
  crest: 51.95, beyond: 53.21, held: 56.301, inside: 61.464 };
// route.controlPoints (54 points for makePath; 1224.58 m): points 0 to 35 carry legs a to d, points 36 to 53
// leg e (over the crest, down the far flank, low over the plain). The pace's knots and the three looks are the
// world file's to type from the same plan.
export const ROUTE_POINTS = [[-80, 15.02, 300], [-79.44, 15.01, 328], [-77.76, 15.01, 356], [-74.96, 15.13, 384],
  [-71.04, 15.56, 412], [-66, 16.56, 440], [-69.51, 19.31, 468.33], [-86.78, 32.71, 496.67], [-115.5, 54.66, 525],
  [-144.22, 76.01, 553.33], [-161.49, 88.05, 581.67], [-165, 90, 610], [-165, 90, 649], [-165, 90, 688.01],
  [-165, 90, 727.01], [-165, 90, 766.01], [-163.56, 88.83, 782.95], [-159.26, 82.34, 799.39],
  [-152.25, 69.94, 814.87], [-142.72, 55.47, 828.94], [-130.94, 41.22, 841.19], [-117.25, 29.68, 851.27],
  [-102.06, 23.02, 858.89], [-85.83, 20.97, 863.96], [-69.39, 21.44, 868.36], [-52.95, 25.42, 872.77],
  [-36.52, 34.1, 877.17], [-20.08, 47.48, 881.57], [-3.64, 64.04, 885.98], [12.79, 81.47, 890.38],
  [29.23, 97.61, 894.79], [45.67, 110.62, 899.19], [62.1, 119.06, 903.6], [78.54, 122, 908], [90.61, 122, 911.24],
  [102.69, 122, 914.47], [116.487, 121.138, 918.168], [130.286, 116.404, 921.865], [144.085, 107.505, 925.563],
  [157.884, 97.339, 929.26], [171.683, 87.169, 932.958], [185.482, 77, 936.655], [199.281, 66.831, 940.352],
  [213.079, 56.661, 944.05], [226.875, 46.492, 947.759], [240.542, 36.327, 951.907], [253.641, 27.006, 957.573],
  [265.618, 20.514, 965.33], [276.38, 17.508, 974.714], [286.541, 17, 984.755], [295.026, 17, 993.24],
  [313.241, 17, 1011.455], [331.456, 17, 1029.67], [349.671, 17, 1047.885]];
// route.wayOut: the way out stands at the route's last point (read from the list above, typed nowhere else);
// the route crosses the crest at its thirty-fourth point (x is the crest's there)
export const WAY_OUT = { place: ROUTE_POINTS[ROUTE_POINTS.length - 1], radius: 9, crestCrossedAtZ: ROUTE_POINTS[33][2] };

// FROM THE LAW'S TEXT AND THE BRIEF (the plan file does not carry these; law 1, 7 a, 7 b):
export const TABLE_Y = -24;      // m: the light table lies 24 m under the bottom
export const FOOT = { low: 10, high: 8 };    // m: the two warm bands at the foot of every face
export const X_STEPS = -520, X_PLATEAU = -330, X_END = 900;   // m: where a sheet begins, its plateau, its end

// ---------------------------------------------------------------------------------------------------------
// THE CURVE. y(x) = A (1 + sin(3 x / S)) from the rim's end on; level at y 0 beyond the far foot.
export function curveY(x) { return x >= X_FAR_FOOT ? 0 : A * (1 + Math.sin(3 * x / S)); }
export function curveDy(x) { return x >= X_FAR_FOOT ? 0 : (3 * A / S) * Math.cos(3 * x / S); }
export function lineZ(k) { return k * D; }

// THE RUN: the plan's short code (run.code), typed as it stands; the one change is that its loop can be
// run in slices (advance(steps)) so that a build can hand frames back between them. Same arithmetic, same rows.
export function makeRunStepper(S_ = S, A_ = A, F_ = F, start = START, g = G, Vb = VB, L = CAR.L, hallX0 = HALL.x0, tEnd = TABLE_END) {
  const XB = -Math.PI * S_ / 6, XC = -XB, XF = Math.PI * S_ / 2, dt = 0.0005, per = 200;
  const yOf = (x) => (x >= XF ? 0 : A_ * (1 + Math.sin(3 * x / S_))), yp = (x) => (x >= XF ? 0 : (3 * A_ / S_) * Math.cos(3 * x / S_));
  const arc = (x) => { const a = XB, m = Math.max(2, 2 * Math.ceil(Math.abs(x - a) / 0.004)), h = (x - a) / m; let sum = 0;
    for (let i = 0; i <= m; i++) { const p = yp(a + i * h); sum += Math.sqrt(1 + p * p) * (i === 0 || i === m ? 1 : i % 2 ? 4 : 2); } return sum * h / 3; };
  let x = XB + start, v = 0, dir = 1, n = 0, s = arc(x), held = false;
  const sHold = arc(XC) + L / 2, ev = { stalls: [], bottoms: [], crest: null, beyond: null, held: null, inside: null };
  const f = (x, v) => { const p = yp(x), q = Math.sqrt(1 + p * p); return [v / q, held ? 0 : dir * F_ - g * p / q]; };
  const step = (h) => { const k1 = f(x, v), k2 = f(x + 0.5 * h * k1[0], v + 0.5 * h * k1[1]), k3 = f(x + 0.5 * h * k2[0], v + 0.5 * h * k2[1]), k4 = f(x + h * k3[0], v + h * k3[1]);
    return [x + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), v + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), h / 6 * (v + 2 * (v + 0.5 * h * k1[1]) + 2 * (v + 0.5 * h * k2[1]) + (v + h * k3[1]))]; };
  const r3 = (q) => Math.round(q * 1000) / 1000, rows = [[0, r3(s), r3(x), r3(yOf(x)), 0]];
  const end = Math.round(tEnd / dt);
  function advance(steps) {
    const stop = Math.min(end, n + steps);
    while (n < stop) {
      const r = step(dt), t = n * dt;
      if (n > 0 && r[1] * dir < 0) { let lo = 0, hi = dt; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (step(m)[1] * dir < 0) hi = m; else lo = m; }
        const a = step(lo); x = a[0]; s += a[2]; v = 0; ev.stalls.push(t + lo); dir = -dir; const b = step(dt - lo); x = b[0]; v = b[1]; s += b[2]; }
      else {
        if ((x - XB) * (r[0] - XB) < 0) ev.bottoms.push(t + dt * (XB - x) / (r[0] - x));
        if (ev.crest == null && x < XC && r[0] >= XC) ev.crest = t + dt * (XC - x) / (r[0] - x);
        x = r[0]; v = r[1]; s += r[2];
        if (ev.beyond == null && s >= sHold) ev.beyond = t + dt;
        if (!held && s >= sHold && v >= Vb) { held = true; v = Vb; ev.held = t + dt; }
      }
      n++;
      if (n % per === 0) rows.push([Math.round(n * dt * 10) / 10, r3(s), r3(x), r3(yOf(x)), r3(v)]);
      if (ev.inside == null && x - L / 2 >= hallX0) ev.inside = n * dt;
    }
    return n >= end;
  }
  // rows: [t s, place along the track m (0 at the bottom, + toward the far ridge), x m, y m, speed m/s].
  return { advance, rows, ev };
}
export function cbuRun(...args) { const r = makeRunStepper(...args); r.advance(Infinity); return { rows: r.rows, ev: r.ev }; }

// THE TABLE, made once and kept (a counting script calls runTable(); a build fills the same store in slices
// through prepareRun(yield), so that no step of it holds the page).
let RUN = null;
export function runTable() { if (!RUN) RUN = cbuRun(); return RUN.rows; }
export function RUN_EVENTS() { runTable(); return RUN.ev; }
export async function prepareRun(yieldFn) {
  if (RUN) return RUN;
  const st = makeRunStepper();
  if (yieldFn) await yieldFn();
  while (!st.advance(6000)) if (yieldFn) await yieldFn();
  RUN = { rows: st.rows, ev: st.ev };
  return RUN;
}
// The build's check of its own table against the plan's event times (run.partCheck), to 0.01 s.
export function checkRun() {
  const rows = runTable(), ev = RUN.ev, c = PART_CHECK, bad = [];
  const near = (name, got, want) => { if (!(Math.abs(got - want) <= c.tolS)) bad.push(name + ' ' + got + ' for ' + want); };
  if (rows.length !== c.rows) bad.push('rows ' + rows.length);
  c.stalls.forEach((w, i) => near('stall ' + i, ev.stalls[i], w));
  for (const i in c.bottoms) near('bottom ' + i, ev.bottoms[i], c.bottoms[i]);
  near('crest', ev.crest, c.crest); near('beyond', ev.beyond, c.beyond); near('held', ev.held, c.held); near('inside', ev.inside, c.inside);
  return { ok: bad.length === 0, rows: rows.length, stalls: ev.stalls.length, bottoms: ev.bottoms.length, bad };
}

// WHERE A CAR IS. tRun is the time within its own run, 0 to T. Linear between the table's rows.
// Returns x, y (on the curve), slope (dy/dx there), s (track metres from the bottom), v (m/s, + toward the far
// ridge) and inSight (false from the table's last row to T: the car is inside the far hall and is not drawn).
export function carAt(tRun, out = {}) {
  const rows = runTable(), last = rows.length - 1;
  if (!(tRun >= 0 && tRun <= TABLE_END)) {
    const r = rows[last]; out.x = r[2]; out.y = 0; out.slope = 0; out.s = r[1]; out.v = 0; out.inSight = false; return out;
  }
  const q = tRun * 10, i = Math.min(last - 1, Math.floor(q)), f = q - i, a = rows[i], b = rows[i + 1];
  out.x = a[2] + (b[2] - a[2]) * f; out.s = a[1] + (b[1] - a[1]) * f; out.v = a[4] + (b[4] - a[4]) * f;
  out.y = curveY(out.x); out.slope = curveDy(out.x); out.inSight = true;
  return out;
}
// THE WAVE'S RULE: the run time of the car of line k at the clock t.
export function timeOfCar(k, t) { const m = (t - k * P) % T; return m < 0 ? m + T : m; }
// The beacon of line k is lit from the instant its car's middle passes the crest, for 6 s of the run's time.
export function beaconLit(k, t) { const r = timeOfCar(k, t); return r >= BEACON.litAt && r < BEACON.litAt + BEACON.stays; }
// THE STEAM THAT TRAILS (on the run's clock alone, by the car's place and its speed's sign). While the engine
// drives a car UP a slope (its speed times the slope there is over zero) STEAM.puffs flat scalloped puffs stream
// from the funnel BACK along the line behind the car, in the sheet's own plane, each turned to the slope where
// it stands. How much steam there is (steamOn, 0 to 1) is the speed times the slope over STEAM.full, so that it
// folds away at a stall and stands whole STEAM.full m/s of climb later. A puff's age f runs 0 to 1, STEAM.rounds
// times a second, each puff a step behind the last and each line a step of its own. A puff of age f stands
// f times the trail's length behind the funnel, measured along the track; the trail is STEAM.back[0] m and
// STEAM.back[1] m more for every m/s, never over STEAM.back[2] m as set out in three steps of the track (under
// 30 m as measured on the curve). Its middle stands STEAM.foot m over the
// line of the cars' roofs and rises to STEAM.lift[0] m more at a crawl, STEAM.lift[1] m more at STEAM.atSpeed
// m/s and over: tall and close at a crawl, long and low at speed. Its size is STEAM.size times
// (0.55 + 1.05 f)(1 - f^3) times steamOn: small at the funnel, widest half way, thinning to nothing; a puff's
// cut is at most 2 STEAM.rx wide and 2 STEAM.ry high at size 1. EVERY PUFF STAYS UNDER sweptTop: its middle is
// never set higher than CAR.plume less STEAM.slack less its own half height (turned to the slope) over the
// roofs' line. No puff is shown where a station's span covers the line (the steam stays under the roof), nor
// behind the rim's end or beyond the far foot.
export const STEAM = { puffs: 6, full: 0.25, rounds: 0.55, back: [3, 1.1, 29], foot: 0.35, lift: [2.3, 0.8], atSpeed: 26, size: 1.45, rx: 0.95, ry: 0.7, slack: 0.15, step: 0.37 };
export function steamOn(c) { return c.inSight ? Math.min(1, Math.max(0, c.v * c.slope / STEAM.full)) : 0; }
// A plume stands over a car while its engine drives it up a slope (kept for the scripts that ask it).
export function plumeOn(c) { return steamOn(c) > 0; }
// A PUFF'S CUT at size 1 (m, in the sheet's plane; x along the line): a shallow foot and three scallops over it,
// set out from the middle of its foot; no corner stands further out than STEAM.rx or higher than STEAM.ry.
export const PUFF_CUT = [[0, -0.5], [0.85, -0.38], [0.95, -0.08], [0.8, 0.22], [0.5, 0.24], [0.45, 0.5], [0.05, 0.7],
  [-0.38, 0.56], [-0.5, 0.24], [-0.8, 0.22], [-0.95, -0.08], [-0.85, -0.38]];
// the widest a puff is cut (m): the size law's greatest value over a puff's age, times the cut's width
export function steamWidest() { let m = 0; for (let f = 0; f <= 1; f += 0.002) m = Math.max(m, (0.55 + 1.05 * f) * (1 - f * f * f));
  return Math.round(2 * STEAM.rx * STEAM.size * m * 100) / 100; }
// where the funnel's top stands in the car's frame (along the car, over the rail)
export const FUNNEL = [5.05, CAR.H];
// Puff j of the car of line k at the clock `time`; c is what carAt returned for that car. Writes into out:
// x, y (the puff's middle), size (0: not shown), cs, sn (the slope it is turned to). Plain arithmetic: a
// counting script calls the same function the world's pose() calls.
export function steamPuff(c, time, k, j, out = {}) {
  const Z = STEAM, g = steamOn(c); out.size = 0; out.x = c.x; out.y = c.y; out.cs = 1; out.sn = 0;
  if (!(g > 0)) return out;
  const f = (((time * Z.rounds + j / Z.puffs + k * Z.step) % 1) + 1) % 1, sp = Math.abs(c.v), dir = c.v > 0 ? 1 : -1;
  const q0 = Math.sqrt(1 + c.slope * c.slope), d = f * Math.min(Z.back[2], Z.back[0] + Z.back[1] * sp) / 3;
  let x = c.x + (FUNNEL[0] - FUNNEL[1] * c.slope) / q0;
  for (let i = 0; i < 3; i++) { const p_ = curveDy(x); x -= dir * d / Math.sqrt(1 + p_ * p_); }
  const size = g * Z.size * (0.55 + 1.05 * f) * (1 - f * f * f), half = Z.rx * size;
  if (x - half < X_RIM || x + half > X_FAR_FOOT) return out;
  if (x + half > SHED.x - SHED.halfL && x - half < shedMouthX(k)) return out;
  const p = curveDy(x), q = Math.sqrt(1 + p * p), lift = Z.lift[0] + (Z.lift[1] - Z.lift[0]) * Math.min(1, sp / Z.atSpeed);
  out.x = x; out.y = curveY(x) + CAR.H * q + Math.min(Z.foot + lift * f, CAR.plume - Z.slack - q * Z.ry * size);
  out.size = size; out.cs = 1 / q; out.sn = p / q;
  return out;
}
// THE HEADLAMP'S PATCH (on the run's clock alone): a long tapered patch of the lamp's ink lying flat on the
// sheet's cut edge AHEAD of the car in the direction it travels, from the car's leading end. Its length
// (lampReach, signed like the speed) is LAMP.len[0] m at a crawl growing evenly to LAMP.len[1] m at LAMP.atSpeed
// m/s and over, times the fold: the speed over LAMP.fold m/s, at most 1, so that the patch is gone at the instant
// of a stall and grows again on the other side as the car rolls back. It lies LAMP.up m over the edge and hangs
// down either face as a skirt LAMP.skirt[0] m deep at the car tapering to LAMP.skirt[1] m, LAMP.proud m proud
// at its lower edge; its last length runs to a point. It ends at the rim's end and at the far hall's mouth.
export const LAMP = { len: [6, 30], atSpeed: 26, fold: 1.5, skirt: [2.4, 0.25], up: 0.11, proud: 0.3, spans: 3 };
export function lampReach(c) { if (!c.inSight) return 0; const sp = Math.abs(c.v);
  return (c.v > 0 ? 1 : -1) * Math.min(1, sp / LAMP.fold) * (LAMP.len[0] + (LAMP.len[1] - LAMP.len[0]) * Math.min(1, sp / LAMP.atSpeed)); }
// The highest a car and its plume can reach straight over the rail at x (car.roomOverTheRails.rule without the
// clear air): the box H along the normal, seen straight up, plus the plume.
export function sweptTop(x) { const p = curveDy(x); return curveY(x) + CAR.H * Math.sqrt(1 + p * p) + CAR.plume; }

// ---------------------------------------------------------------------------------------------------------
// THE STYLE KIT.
// makeStyle(ctx, opts) returns
//   palette      linear THREE.Colors: paper, paperFar (a sheet's up-valley face, first and last sheet), paperBack,
//                paperBackFar (its down-valley face), deep, light (the light table), foot, foot2 (the two warm
//                bands), core (the cut edge), ink (cars, rail, staffs, ribs), roof, thing (pines, walls), window, lamp,
//                patch, red (pennants), beacon, puff, star, and sky: [[degrees up, ink] ...] toward the
//                afterglow, skyBack (the horizon band opposite), ranges[3]
//   edition      'ultramarine' | 'plum' | 'teal' (opts.edition, or drawn once from the seed)
//   paper        THE material of the world: unlit, opaque, two-sided; colour = the vertex attribute `ink`.
//   pennantMat   the same with the pennant's ripple (vertex shader, uTime, a phase to each instance)
//   birdMat      the same with a wing beat (attribute `wing`: 0 at the body, 1 at a wing tip, which beats between 0.5 m under and 1.2 m over the body)
//   uniforms     { uTime }, driven by update(dt, time, camera) (the camera is not read)
//   batch()      a small builder of flat inked faces: quad, tri, fan, box, count, geometry()
//   sheetInks(k) the two flat inks of sheet k        profile(k)  its cut top edge as [x, y] points
//   buildSheets(k0, k1, o)   async: the merged geometry of sheets k0 to k1 - 1 in world coordinates with the
//                rail, the station's span (STATION), buffer with its lamp, crest bracket, staff, beacon house, pines, plateau buildings
//                and the upland behind the near rim (UPLAND: field strips, hedges, lane, lamps, tall things)
//   carGeometry(rest)   the car (266 triangles), or the plain car at rest (26) for the far country;
//   restCarGeometry()   the heavy car at rest (200) for the rows by the last stretch
//   makeLines(k0, n)    everything on lines k0 to k0 + n - 1 that the clock moves: { group, pose(time) }
//   hallGeometry(z0, z1) (the far hall's lantern roof of paper panes, mouth and walls), hallPlumes(z0, z1) (its vents' plumes:
//                { mesh, pose(time) }), cutThing(b, entry, z) (one landmark cut into a sheet's face: CUTS),
//   tableGeometry(x0, x1, z0, z1), restRow(k), restCars(k0, n) (a group of the two cuts),
//   birdGeometry(upright), pennantGeometry(),
//   skyGeometry({ center, radius, stars, even, high, large, fill, moon: { bearing, up } }): the built sky's bands, pin holes and
//                (rare) moon as one geometry of the same paper, about the centre and at the radius its caller gives
//                (it has none of its own); clouds and far ranges are the world's to cut with batch()
// HOW THE STYLE'S RULES ARE KEPT WITH IT: flat inks only (no lights, no fog, no texture: the fragment shader
// writes the ink); a face never lies in another's plane (bands share edges; relief stands 0.04 m and more
// proud); nothing reads the lens; nothing glows (every ink is at most 1).
// How far a sheet's cut edge stands from its up-valley ink toward the paper's pale core: a share that falls
// evenly, sheet by sheet, from EDGE_CORE[0] on the first sheet to EDGE_CORE[1] on the last (by the sheet's number
// alone), so that the edges of the sheets toward the valley's far end are fine quiet lines. RAIL_INK: how far the
// rail and its teeth stand from the sheet's down-valley ink toward the dark ink (the same share on every sheet):
// the rack is one clear step deeper than the face it lies over, a dark line on the pale band of its edge.
// RUNS OF STOCK: the sheets are cut from five stocks of paper, and they stand in runs of 6 to 20 sheets of one
// stock, by the sheet's number alone (RUNS: [how many sheets, which stock], from the first sheet on; 190 in all).
// Stock 0 is the edition's own paper as the valley's run of inks gives it; 1 the same taken STOCK of the way to
// the deep sky's ink; 2 the same taken STOCK of the way to the paper's pale core; 3 and 4 are the papers of the
// two other editions (of ultramarine, plum and teal, the two that the edition is not, in that order) at the same
// place in the valley's run. Both faces of a sheet, its cut edge and its rail follow its stock. So a flank is
// broad bands of paper running up the slope, and no two neighbouring runs are of one stock.
const EDGE_CORE = [0.36, 0.16], RAIL_INK = 0.22, STOCK = 0.24;
const RUNS = [[14, 0], [10, 1], [12, 2], [7, 0], [6, 3], [6, 2], [6, 1], [11, 0], [7, 4], [6, 2], [6, 0], [6, 3], [6, 1], [7, 2], [8, 4], [9, 0],
  [7, 3], [12, 1], [14, 0], [10, 4], [20, 2]];
const TOOTH = { pitch: 7, half: 0.62, reach: 1.05, hand: 0.1 };   // m: a tooth every 7 m of track, 1.24 m wide at the rail, its point 1.05 m off the sheet's middle; cut up to 0.1 m off
const EDGE_IN_HALL = 0.55;
// THE STATION HALL (m; heights over the line's own edge). The shed of every line is one span of a long
// station hall that runs down the valley's floor: paper lit from behind, opaque flat inks, nothing seen through.
//   THE ROOF of a span: two slopes of warm paper panes from the eave (STATION.eave) to the lantern's foot
//   (STATION.ridge, STATION.lantern m to either side of the line); the slope that looks up-valley is the window
//   ink, the one that looks down-valley that ink taken STATION.shade of the way to the warm foot's; dark ribs
//   cross both slopes every STATION.bay m of the line (counted from the span's upper end, so that they stand in
//   rows across the valley), one dark purlin runs along each slope and a dark gutter strip along each eave;
//   along the ridge a LANTERN: a strip of the light table's pale ink STATION.lanternUp m over the ridge on two
//   dark cheeks. Ribs, purlin and gutter stand STATION.proud m proud of the panes.
//   GRANDER BAYS: on every STATION.grandEvery-th line (from line STATION.grandAt on) the lantern stands
//   STATION.grandUp m higher and a TRANSEPT crosses the span's middle: a gable STATION.transept m to either side
//   of the middle on each wall, as high as the raised lantern, with one lit round and two paned roof pieces.
//   THE MOUTHS: the span's end toward the bottom stands STATION.back[i] m short of the plan's box end, i being the
//   line's place in a cycle of runs (STATION.runs: so many lines to a run, one after the other, again and again),
//   so that the ends step in and out by runs and never stand in one plane; the upper end stands at the box's end.
//   WHY THE STEP IS THERE: the route comes into the valley over the bottom's rails, almost exactly over the box's
//   end toward the bottom (x SHED.x + SHED.halfL), looking along the valley. Ends standing in one plane are seen
//   edge on from there as one straight edge from the valley's vanishing point down to the frame's lower edge, the
//   picture cut in two (the ends stood so before this rule, and three strangers of three named it). Stepped by
//   the line's number alone, the ends are a row of mouths one behind the other; the rule reads no lens and no clock.
//   Both ends are gables with an arched opening (STATION.arch: half width, springing, haunch [off the middle,
//   height], crown). INSIDE, the walls of the span's two end lengths are lined and the span is floored STATION.sill m under the edge, in warm
//   inks, so that an opening shows the hall's light and a car rolls out of a lit hall.
//   THE APRON: a strip of pale paper lying on the sheet's cut edge from the mouth to STATION.apron.beyond m beyond
//   the box's end, STATION.apron.up m over the edge and hanging STATION.apron.skirt m down either face.
// The whole span stands inside the plan's box SHED (no higher than SHED.h, no longer than the box; its walls
// stand STATION.relief m inside SHED.halfW and their lit windows that much proud of them, so no wider); only the
// apron, which lies flat on the edge, runs beyond it.
export const STATION = { eave: 5.0, ridge: 6.05, lantern: 0.7, lanternUp: 0.5, sill: -1.6, bay: 3.5, rib: 0.28, purlin: [0.47, 0.57], gutter: 0.2,
  proud: 0.07, relief: 0.12, shade: 0.45, runs: [4, 3, 5, 3, 4, 6], back: [0, 9, 3, 9, 0, 6], grandEvery: 9, grandAt: 4, grandUp: 0.4, transept: 2.6,
  arch: { half: 2.4, spring: 3.9, haunch: [1.5, 5.0], crown: 5.5 }, apron: { beyond: 2.5, skirt: 1.1, up: 0.03, proud: 0.12 } };
// how far short of the box's end the mouth of line k stands (m), and the x of that mouth
export function shedMouthBack(k) { const R = STATION.runs, all = R.reduce((a, c) => a + c, 0); let j = ((k % all) + all) % all;
  for (let i = 0; i < R.length; i++) { if (j < R[i]) return STATION.back[i]; j -= R[i]; } return 0; }
export function shedMouthX(k) { return SHED.x + SHED.halfL - shedMouthBack(k); }
// THE WORLD'S OWN SCATTER NUMBER: a number from 0 to 1 by two keys, the fraction of a scaled sine (a common form).
// Its three constants are this world's own, typed here once. Everything the cut paper deals by a number takes it
// from here: a knot of a band's freehand cut, a let-in piece, a vent and a carriage piece of the far hall, and how
// many cars rest on a line. It reads the keys alone: no seed, no clock, no place of the eye.
const OWN = { a: 61.93, b: 147.39, s: 25013.71 };
const own01 = (a, b = 0) => { const t = Math.sin(a * OWN.a + b * OWN.b) * OWN.s; return t - Math.floor(t); };
// THE BACK RIDGE of the rim plateau (m): on every sheet the cut edge stands RIDGE.low to RIDGE.high m high from
// the plateau's last riser (x -330.6) to a knot between x RIDGE.x[1] and 3 m beyond it, with one knot between
// (about RIDGE.x[0]), and falls from there to the plateau at a foot between the two x of RIDGE.foot. RIDGE.high
// stands under the plan's 14 m over the rim's end height. What it is for is said at the world file's head.
export const RIDGE = { x: [-317, -306], low: 84.6, high: 85.9, foot: [-292, -281] };
// THE UPLAND BEHIND THE NEAR RIM (m; x of the valley), by the sheet's number and these typed places alone:
//   FIELD STRIPS: between each two neighbouring x of UPLAND.strips runs one strip of fields along the valley; a
//   strip is cut into fields UPLAND.runs sheets long (its first field begins UPLAND.lead sheets early), and a field
//   is a piece of paper of one of the five stocks, never its neighbour's in the strip, taken UPLAND.shade of the
//   way to the deep sky's ink, pasted on the sheets' up-valley faces flush with the cut edge, UPLAND.deep m deep
//   and UPLAND.proud m proud, its two ends UPLAND.inset[0] to UPLAND.inset[1] m inside the strip's bounds;
//   HEDGES: along the bounds between strips, in runs of UPLAND.hedge.run sheets (UPLAND.hedge.share of the runs
//   have one), a small pine UPLAND.hedge.tall m tall on a sheet's edge, one behind another down the valley;
//   THE LANE along the rim between the two x of UPLAND.lane, a pasted piece of the sheet's ink taken
//   UPLAND.laneCore of the way to the paper's core; between the lane and the buffer stops THE YARD (the two x of
//   UPLAND.yard), a pasted piece of the sheet's down-valley ink taken UPLAND.yardDeep of the way to the deep
//   sky's ink, so that the buffers' lamps stand over dark ground; on every UPLAND.lamp.every-th sheet a LAMP beside the lane at
//   UPLAND.lamp.x: a post UPLAND.lamp.post m tall with a flat disc of the lamp ink, UPLAND.lamp.r m in radius,
//   under a small dark hood (the same lamp, smaller, stands on every buffer stop: BUFFER_LAMP);
//   TALL THINGS OF THE LINE, each on every `every`-th sheet from sheet `at` on, at its x: a signal MAST (two
//   braced legs, a plain round plate with a lamp disc; no arm), a WATER TOWER with a lit band, a signal CABIN
//   (a lit room on a dark foot) and a long STAGE with lit doors. Nothing stands over the plan's 14 m.
const UPLAND = { strips: [-300, -281, -263, -246, -229, -210], runs: [9, 7, 11, 8, 10], lead: [0, 3, 5, 1, 6],
  inset: [0.6, 2], deep: 9, proud: 0.2, shade: 0.26, yard: [-199.8, -185.4], yardDeep: 0.3,
  hedge: { run: 12, share: 0.6, tall: [4.6, 6.6] }, lane: [-208, -201.5], laneCore: 0.55,
  lamp: { x: -209.6, every: 3, post: 5.7, r: 0.8 },
  mast: { every: 17, at: 6, x: -216.5, tall: 12.6 }, tower: { every: 23, at: 11, x: -222.5 },
  cabin: { every: 13, at: 4, x: -237.5 }, stage: { every: 19, at: 8, x: -256 } };
const BUFFER_LAMP = { post: 1.4, r: 0.7 };   // m: the post's height over the buffer's block, the disc's radius
const FOOT_HAND = 0.9;   // m: how far a knot of the upper warm band's freehand cut stands off the level
const PATCH = { share: 0.4, wide: [11, 19], deep: [6.5, 11], hang: 1.3, proud: 0.2 };   // a let-in piece: on this share of the sheets; m wide, m deep, m under the cut edge, m proud of the face
// THINGS CUT INTO THE SHEETS (CUTS): landmarks let into the faces of chosen sheets, each at a typed place: the
// sheets it stands on (first and last number), the stretch of the curve it follows (x from, x to, m; none
// reaches under a shed) and the faces it shows on ('up': the face that looks up-valley; 'both': cut through).
// Every piece lies in the sheet's own face, CUT.proud m proud of it, its highest corner CUT.hang m and more
// under the cut edge: it stands no higher than the edge and covers nothing that rides on it. Three kinds:
//   arcade: A VIADUCT'S ARCADE, a row of tall arches in the light table's ink, one every ARCADE.pitch m of x,
//           each ARCADE.wide m wide and ARCADE.tall m tall under its crown, stepping with the slope; the same
//           arches on every sheet of the landmark, so that they stand one behind the other along the valley;
//   rounds: A ROW OF ROUND WINDOWS in the window ink, ROUNDS.r m in radius, one every ROUNDS.pitch m of x; where
//           the entry says rows: 2, a second row ROUNDS.row m under the first, half a pitch along;
//   halt:   A HALT, a long low front of the dark ink following the line, HALT.deep m deep, in cells HALT.cell m
//           long, a lit window in every cell (a lit window band) and a trim strip along its top and its foot.
// WHERE THEY STAND, by place: on the far ridge's lower flank beside the flight's opening, sheet after sheet from
// 44 to 59, an arcade, a halt a little way up the flank and two rows of rounds; two rows of rounds high on the near
// flank where the flight climbs it; an arcade low, a halt half way up and rounds high on the far ridge across from the rim leg, and an
// arcade further down-valley; an arcade on the near flank under the dive; rounds (cut through) and an arcade
// (cut through) on the far ridge to either side of the line on which the flight climbs it.
const CUT = { proud: 0.32, hang: 1.3 };
const ARCADE = { pitch: 6.2, wide: 4.1, tall: 12.5, spring: 1.9 }, ROUNDS = { pitch: 6.5, r: 2.1, row: 5.6 }, HALT = { deep: 5.6, cell: 3, win: [0.7, 2.3, 1.3, 2.9] };   // m; win: a window's two x and two depths in its cell
const CUTS = [
  { kind: 'arcade', k: [44, 51], x: [-56, 30], faces: 'up' }, { kind: 'halt', k: [52, 53], x: [-44, -8], faces: 'up' },
  { kind: 'rounds', k: [54, 59], x: [-64, 40], faces: 'up', rows: 2 }, { kind: 'rounds', k: [62, 67], x: [-172, -116], faces: 'up', rows: 2 },
  { kind: 'arcade', k: [84, 90], x: [-48, 12], faces: 'up' }, { kind: 'halt', k: [94, 95], x: [-5, 31], faces: 'up' },
  { kind: 'rounds', k: [98, 103], x: [22, 74], faces: 'up' }, { kind: 'arcade', k: [99, 104], x: [-172, -114], faces: 'up' },
  { kind: 'rounds', k: [105, 109], x: [-62, 62], faces: 'both' }, { kind: 'arcade', k: [112, 118], x: [-64, 66], faces: 'both' },
  { kind: 'arcade', k: [124, 130], x: [0, 60], faces: 'up' },
];
const HEX = {
  paper: '#3F5AA6', paperFar: '#9FB2E0', paperBack: '#2B3F80', paperBackFar: '#7F93CC', deep: '#1B2A5C',
  light: '#FFE2A6', foot: '#EFA66A', foot2: '#B98AA6', core: '#E8ECF8', ink: '#161B33', roof: '#2A3157',
  thing: '#1F2A52', window: '#FFD27A', lamp: '#FFE9B0', patch: '#FFD9A0', red: '#E8503A', beacon: '#FFF1C2',
  puff: '#C9D2EE', star: '#F4F1E4', skyBack: '#33407A',
};
const SKY = [[3, '#FCE3B0'], [7, '#F6B77A'], [12, '#E08A8C'], [19, '#A9659A'], [30, '#5A4E9A'], [50, '#2E3F86'], [90, '#1B2A5C']];
const RANGES = ['#55689F', '#7C8DBF', '#A6B3D6'];
const EDITIONS = {
  ultramarine: {},
  plum: { paper: '#5A3F86', paperFar: '#B9A2DA', paperBack: '#3E2A66', paperBackFar: '#9A84C4', foot: '#F0A070', foot2: '#C088A8',
    sky: { 0: '#FBE0A8', 1: '#F6B98C', 2: '#EE8FA0' } },
  teal: { paper: '#1F5A6E', paperFar: '#8FC1C4', paperBack: '#16424F', paperBackFar: '#6FA5AA', foot: '#EDB06A', foot2: '#9FB09A',
    sky: { 0: '#F6EDB4', 1: '#F4B27A' } },
};

const VERT = /* glsl */`
attribute vec3 ink;
varying vec3 vInk;
uniform float uTime;
#ifdef RIPPLE
attribute float aPhase;
#endif
#ifdef WING
attribute float wing;
attribute float aPhase;
#endif
void main() {
  vInk = ink;
  vec3 p = position;
  #ifdef RIPPLE
  // a pennant: its hoist stands at local x 0; the cloth runs along +x and ripples more toward its tails
  float w = clamp(p.x / 7.0, 0.0, 1.0);
  float ph = uTime * 2.3 + aPhase - p.x * 1.15;
  p.z += w * (0.5 * sin(ph) + 0.2 * sin(ph * 1.7 + 1.3));
  p.y += w * 0.18 * sin(ph * 0.8 + 0.6);
  #endif
  #ifdef WING
  p.y += wing * (0.35 + 0.85 * sin(uTime * 5.2 + aPhase));
  #endif
  #ifdef USE_INSTANCING
  p = (instanceMatrix * vec4(p, 1.0)).xyz;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = /* glsl */`
varying vec3 vInk;
void main() { gl_FragColor = vec4(vInk, 1.0); }`;

// A builder of flat inked faces. Points are [x, y, z]; an ink is a THREE.Color. Every face has its own
// corners, so an ink never runs into its neighbour's.
function makeBatch() {
  const pos = [], col = [], idx = [];
  const v = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
  const b = {
    tri(a, b_, c, ink) { const i = v(a, ink); v(b_, ink); v(c, ink); idx.push(i, i + 1, i + 2); return b; },
    quad(a, b_, c, d, ink) { const i = v(a, ink); v(b_, ink); v(c, ink); v(d, ink); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); return b; },
    // a convex outline as a fan about its first point
    fan(pts, ink) { const i = v(pts[0], ink); for (let j = 1; j < pts.length; j++) v(pts[j], ink); for (let j = 1; j < pts.length - 1; j++) idx.push(i, i + j, i + j + 1); return b; },
    // a box between two corners; inks: sides, top (optional), ends (optional); open: skip the two x ends
    box(x0, y0, z0, x1, y1, z1, side, top = side, end = side, open = false) {
      b.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], side);
      b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], side);
      b.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], top);
      if (!open) { b.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], end); b.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], end); }
      return b;
    },
    count() { return idx.length / 3; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('ink', new THREE.BufferAttribute(new Float32Array(col), 3));
      g.setIndex(pos.length / 3 > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
  };
  return b;
}

// One flat piece of a sheet's face, given by its outline [x, y] (counter-clockwise, in the plane z = zf), cut into
// triangles that use the outline's own corners and no others: a corner is cut off wherever the triangle it makes
// with its two neighbours lies inside the outline and holds no other corner, until three are left. Should no
// such corner be found (an outline with corners in one line), what is left is laid as a fan about its first corner.
function cutSpan(b, poly, zf, ink) {
  const idx = poly.map((_, i) => i), P = (i) => [poly[i][0], poly[i][1], zf];
  const cross = (o, p, q) => (poly[p][0] - poly[o][0]) * (poly[q][1] - poly[o][1]) - (poly[p][1] - poly[o][1]) * (poly[q][0] - poly[o][0]);
  let guard = poly.length * poly.length;
  while (idx.length > 3 && guard-- > 0) {
    let cut = -1;
    for (let j = 0; j < idx.length && cut < 0; j++) {
      const o = idx[(j + idx.length - 1) % idx.length], p = idx[j], q = idx[(j + 1) % idx.length];
      if (cross(o, p, q) <= 1e-7) continue;
      let free = true;
      for (const r of idx) { if (r === o || r === p || r === q) continue;
        if (cross(o, p, r) > -1e-9 && cross(p, q, r) > -1e-9 && cross(q, o, r) > -1e-9) { free = false; break; } }
      if (free) cut = j;
    }
    if (cut < 0) break;
    const n = idx.length; b.tri(P(idx[(cut + n - 1) % n]), P(idx[cut]), P(idx[(cut + 1) % n]), ink); idx.splice(cut, 1);
  }
  for (let j = 1; j < idx.length - 1; j++) b.tri(P(idx[0]), P(idx[j]), P(idx[j + 1]), ink);
}

export function makeStyle(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cbu-style') : ctx.rng;
  const noise = ctx.noise;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  const C = (h) => new THREE.Color(h);
  // the brief's seven: sheet near, sheet far, deep sky, light table, warm foot, dark ink, the one red
  const seven = opts.palette || [HEX.paper, HEX.paperFar, HEX.deep, HEX.light, HEX.foot, HEX.ink, HEX.red];
  const hex = { ...HEX, paper: seven[0], paperFar: seven[1], deep: seven[2], light: seven[3], foot: seven[4], ink: seven[5], red: seven[6] };
  const pick = rng();   // one draw, always made, so that later draws do not depend on opts.edition
  const edition = opts.edition || (ctx.vary && ctx.vary.edition) || (pick < 0.46 ? 'ultramarine' : pick < 0.73 ? 'plum' : 'teal');
  const ed = EDITIONS[edition] || {};
  for (const key in ed) if (key !== 'sky') hex[key] = ed[key];
  const palette = {};
  for (const key in hex) palette[key] = C(hex[key]);
  palette.sky = SKY.map(([deg, h], i) => [deg, C((ed.sky && ed.sky[i]) || (i === 6 ? hex.deep : h))]);
  palette.ranges = RANGES.map(C);
  const uniforms = { uTime: { value: 0 } };
  const mat = (defines) => new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, defines, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const paper = mat({}), pennantMat = mat({ RIPPLE: 1 }), birdMat = mat({ WING: 1 });
  const lerpInk = (a, b, f) => a.clone().lerp(b, f);
  // the stock of sheet k (RUNS), and the four inks of the edition's own paper and of the two other papers
  const stockOf = (k) => { let a = 0; for (const [len, stock] of RUNS) { a += len; if (k < a) return stock; } return 0; };
  const others = Object.keys(EDITIONS).filter((e) => e !== edition), FACES = ['paper', 'paperFar', 'paperBack', 'paperBackFar'];
  const family = [palette, ...others.map((e) => { const o = {}; for (const key of FACES) o[key] = C((EDITIONS[e] && EDITIONS[e][key]) || HEX[key]); return o; })];
  const sheetInks = (k, st = stockOf(k)) => { const f = Math.min(1, Math.max(0, k / (N - 1))), fam = family[st === 3 ? 1 : st === 4 ? 2 : 0];
    const up = lerpInk(fam.paper, fam.paperFar, f), down = lerpInk(fam.paperBack, fam.paperBackFar, f);
    if (st === 1) { up.lerp(palette.deep, STOCK); down.lerp(palette.deep, STOCK); } else if (st === 2) { up.lerp(palette.core, STOCK); down.lerp(palette.core, STOCK); }
    const edge = lerpInk(up, palette.core, EDGE_CORE[0] + (EDGE_CORE[1] - EDGE_CORE[0]) * Math.min(1, Math.max(0, k / (N - 1))));
    return { up, down, edge, rail: lerpInk(down, palette.ink, RAIL_INK) }; };
  const style = { palette, edition, detail, paper, pennantMat, birdMat, uniforms, batch: makeBatch, sheetInks, stockOf,
    update(dt, time) { uniforms.uTime.value = time; } };
  addSheetMakers(style, rng, noise);
  style.setYield(ctx.yield ? () => ctx.yield() : null);
  addCarMakers(style, rng);
  return style;
}

// The curve's sample places from the rim's end to the far foot: closer where it bends, so that the built
// edge stays within 0.15 m of the true curve (chord sag c^2 / 8R), 4 to 14 m of track apart.
let CURVE_XS = null;
function curveXs() {
  if (CURVE_XS) return CURVE_XS;
  const xs = []; let x = X_RIM;
  while (x < X_FAR_FOOT - 1.5) {
    xs.push(x);
    const p = curveDy(x), q = Math.sqrt(1 + p * p), bend = Math.abs(A * 9 / (S * S) * Math.sin(3 * x / S)) / (q * q * q);
    const chord = Math.min(14, Math.max(4, Math.sqrt(0.72 / Math.max(bend, 1e-5))));
    x += chord / q;
  }
  xs.push(X_FAR_FOOT);
  return (CURVE_XS = xs);
}

// The height of a sheet's BUILT edge at x between the rim's end and the far foot: straight from one of the
// curve's sample places to the next (what lies flat on an edge is set out from this, not from the true curve).
function edgeY(x) {
  const xs = curveXs(); let i = 0, j = xs.length - 1;
  if (x <= xs[0]) return curveY(xs[0]); if (x >= xs[j]) return curveY(x);
  while (j - i > 1) { const m = (i + j) >> 1; if (xs[m] <= x) i = m; else j = m; }
  const y0 = curveY(xs[i]), y1 = curveY(xs[j]);
  return y0 + (y1 - y0) * (x - xs[i]) / (xs[j] - xs[i]);
}

function addSheetMakers(style, rng, noise) {
  const pal = style.palette, RIM_Y = curveY(X_RIM);
  const fork = (label) => (rng.fork ? rng.fork(label) : rng);
  // the height of the plateau's cut hills over the rim's end height at x on sheet k: ridges that wander
  // from sheet to sheet, so that the layers read as country and not as copies
  const hillAt = (x, k) => Math.max(0, noise.n2(x * 0.021 + k * 0.06, k * 0.23 + 3.7)) * 9.5 * Math.min(1, (-195 - x) / 20);

  const ridgeY = (i, k) => RIDGE.low + (RIDGE.high - RIDGE.low) * own01(200 + i, k);

  // THE CUT TOP EDGE OF SHEET k as [x, y] points from X_STEPS to xMax, and where the curve's part begins.
  style.profile = (k, xMax = X_END) => {
    const pts = [];
    // the steps beyond the plateau: four treads climbing from y 30, each riser a slightly slanted cut
    let y = 30 + noise.n2(k * 0.4, 1.3) * 2.5, x = X_STEPS;
    for (let j = 0; j < 4; j++) {
      const xr = j === 3 ? X_PLATEAU - 1 : X_STEPS + (j + 1) * 47.5 + noise.n2(j * 3.1 + 0.5, k * 0.33) * 13;
      const top = j === 3 ? ridgeY(0, k) : 30 + (j + 1) * 10.4 + noise.n2(j * 1.7 + 9, k * 0.29) * 3;
      for (let xx = x; xx < xr - 3; xx += 15 + 6 * noise.n2(xx * 0.11, k * 1.7)) {
        pts.push([xx, y + (xx > x ? Math.max(0, noise.n2(xx * 0.05 + k * 0.08, k * 0.21 + 20)) * 4.5 : 0)]);
      }
      pts.push([xr - 0.6, y]); y = top; pts.push([xr + 0.4, y]); x = xr + 0.4;
    }
    // THE BACK RIDGE (RIDGE): the plateau's last cut hills, the upland's horizon. From the last riser on, the
    // edge stands between RIDGE.low and RIDGE.high m (each knot its own height by the sheet's number) as far as
    // the knot about RIDGE.x[1], then falls to the plateau at a foot between RIDGE.foot[0] and RIDGE.foot[1]
    const xf = RIDGE.foot[0] + (RIDGE.foot[1] - RIDGE.foot[0]) * own01(203, k);
    pts.push([RIDGE.x[0] + 3 * (own01(204, k) - 0.5), ridgeY(1, k)], [RIDGE.x[1] + 3 * own01(205, k), ridgeY(2, k)], [xf, RIM_Y + hillAt(xf, k)]);
    // the rim plateau: small cut hills, facet by facet; level for the last 15 m before the rim's end
    for (let xx = X_PLATEAU + 9; xx < -197; xx += 12 + 5 * noise.n2(xx * 0.13, k * 1.9 + 4)) {
      if (xx > xf + 4) pts.push([xx, RIM_Y + hillAt(xx, k)]);
    }
    pts.push([-195, RIM_Y]);
    const curve0 = pts.length;
    for (const cx of curveXs()) pts.push([cx, curveY(cx)]);
    // the level edge of the far country, with a corner where it runs in under the far hall's roof and one at the hall's far wall
    if (xMax > HALL.x1 + 1) pts.push([HALL.x0 + 0.3, 0], [HALL.x1, 0]);
    pts.push([Math.max(xMax, X_FAR_FOOT + 1), 0]);
    return { pts, curve0, curve1: curve0 + curveXs().length - 1, hillAt: (xx) => hillAt(xx, k) };
  };

  // THE SHEETS k0 to k1 - 1 as one geometry in world coordinates (z = k D), with what stands on each.
  // Ask for at most 24 sheets in one call (the last step, which packs the arrays, grows with their number).
  // o: xMax (where the far country's level edge is cut off; default X_END), teeth (the pitch of the rail's
  // teeth in metres, 0 for none; default TOOTH.pitch / detail), things (false: bare sheets), zShift (added to z).
  style.buildSheets = async (k0, k1, o = {}) => {
    const b = makeBatch(), xMax = o.xMax ?? X_END, pitch = o.teeth ?? TOOTH.pitch / style.detail, zShift = o.zShift ?? 0;
    const yA = TABLE_Y, yB = TABLE_Y + FOOT.low, yC = yB + FOOT.high, h = THICK / 2;
    for (let k = k0; k < k1; k++) {
      const r = fork('sheet' + k), z = lineZ(k) + zShift, inks = style.sheetInks(k), pr = style.profile(k, xMax), pts = pr.pts;
      const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
      const edge = inks.edge, railInk = inks.rail, edgeIn = edge.clone().lerp(pal.ink, EDGE_IN_HALL);
      // the cutter's hand: on the up-valley face the upper warm band's top is cut freehand, in straight cuts from
      // knot to knot (a knot at every seventh point of the edge and at both ends), each knot up to FOOT_HAND m over
      // or under the level; the band and the face above share every corner along the cut. The down-valley face's
      // band is cut level.
      const hv = (a) => own01(a, k);   // this sheet's own numbers: the second key is the line's number
      const cutY = new Array(pts.length), last = pts.length - 1;
      for (let i = 0, a = 0; a < last;) {
        const c = Math.min(last, a + 7), ya = yC + (hv(40 + a) - 0.5) * 2 * FOOT_HAND, yc = yC + (hv(40 + c) - 0.5) * 2 * FOOT_HAND;
        for (i = a; i <= c; i++) cutY[i] = ya + (yc - ya) * (pts[i][0] - pts[a][0]) / Math.max(1e-6, pts[c][0] - pts[a][0]);
        a = c;
      }
      // each face is laid span by span between the cut's knots: the upper warm band as one four-cornered piece, and
      // the face above it as one flat piece whose corners are the span's points of the top edge and its two knots
      // (cutSpan); neighbouring pieces share whole edges, so no corner of one lies on another's side
      for (const [zf, ink] of [[z - h, inks.up], [z + h, inks.down]]) {
        b.quad([x0, yA, zf], [x1, yA, zf], [x1, yB, zf], [x0, yB, zf], pal.foot);
        for (let a = 0; a < last; a += 7) {
          const c = Math.min(last, a + 7), ya = zf < z ? cutY[a] : yC, yc = zf < z ? cutY[c] : yC;
          b.quad([pts[a][0], yB, zf], [pts[c][0], yB, zf], [pts[c][0], yc, zf], [pts[a][0], ya, zf], pal.foot2);
          const poly = [[pts[a][0], ya], [pts[c][0], yc]];
          for (let i = c; i >= a; i--) poly.push(pts[i]);
          cutSpan(b, poly, zf, ink);
        }
      }
      // the cut edge: the paper's pale core, along the whole top and at both ends
      // (under the far hall's roof the edge is the same ink taken EDGE_IN_HALL of the way to the dark ink: it stands in the dark)
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1], mid = (p[0] + q[0]) / 2;
        b.quad([p[0], p[1], z - h], [q[0], q[1], z - h], [q[0], q[1], z + h], [p[0], p[1], z + h], mid > HALL.x0 && mid < HALL.x1 ? edgeIn : edge);
      }
      b.quad([x0, yA, z - h], [x0, pts[0][1], z - h], [x0, pts[0][1], z + h], [x0, yA, z + h], edge);
      b.quad([x1, yA, z - h], [x1, 0, z - h], [x1, 0, z + h], [x1, yA, z + h], edge);
      // the cutter's hand: now and then a sheet's foot is patched with a second piece of paper
      if (r.chance(0.16)) {
        const px = r.range(-300, Math.min(200, x1 - 30)), pw = r.range(9, 22), ph = r.range(4, 8.5), zp = z - h - 0.15, t = r.range(-0.6, 0.6);
        b.quad([px, yA, zp], [px + pw, yA, zp], [px + pw + t, yA + ph, zp], [px + t, yA + ph + r.range(-0.5, 0.5), zp], pal.foot.clone().lerp(pal.light, 0.4));
      }
      // THE THINGS CUT INTO THIS SHEET (CUTS), where it has any; and on two sheets in five of the others a second
      // piece of paper is let into the up-valley face under the cut edge of the
      // curve's part: a piece of the sheet's own down-valley ink, PATCH.proud m proud of the face, cut by hand with
      // six crooked sides (each corner a fixed draw by the sheet's number; one upper corner well off true), its
      // upper corners PATCH.hang m and more under the edge and following it
      const cuts = CUTS.filter((c) => k >= c.k[0] && k <= c.k[1]);
      for (const c of cuts) style.cutThing(b, c, z);
      if (hv(1) < PATCH.share && !cuts.length) {
        const px = -168 + hv(2) * 318, pw = PATCH.wide[0] + (PATCH.wide[1] - PATCH.wide[0]) * hv(3), pd = PATCH.deep[0] + (PATCH.deep[1] - PATCH.deep[0]) * hv(4), zp = z - h - PATCH.proud;
        const C6 = [[0, 0.1 * hv(5)], [0.52 + 0.1 * hv(6), 0.06 * hv(7)], [1, 0.16 + 0.2 * hv(8)], [0.94 - 0.14 * hv(9), 0.78 + 0.14 * hv(10)], [0.42 + 0.16 * hv(11), 1], [0.05 + 0.1 * hv(12), 0.8 + 0.12 * hv(13)]];
        const at = ([u, w]) => { const x = px + pw * u; return [x, curveY(x) - PATCH.hang - pd * w, zp]; };
        const mid = at([0.5, 0.5]), cs = C6.map(at);
        for (let j = 0; j < 6; j++) b.tri(mid, cs[j], cs[(j + 1) % 6], inks.down);
      }
      // THE RACK LINE: one toothed rail on the cut edge from the buffer to the far hall's far wall, 0.16 m over
      // the paper; its teeth are triangles of the same ink to either side, their points over the paper's edge,
      // cut by hand: each a little wider or narrower, longer or shorter and off its place (a fixed draw by its
      // place and the sheet's number)
      const rail = [], railEnd = Math.min(HALL.x1 - 1, x1), up = 0.16;
      for (let i = pr.curve0; i <= pr.curve1; i++) rail.push(pts[i][0]);
      if (railEnd > X_FAR_FOOT) rail.push(railEnd);
      for (let i = 0; i < rail.length - 1; i++) {
        const a = rail[i], c = rail[i + 1], ya = curveY(a) + up, yc = curveY(c) + up;
        b.quad([a, ya, z - 0.2], [c, yc, z - 0.2], [c, yc, z + 0.2], [a, ya, z + 0.2], railInk);
      }
      if (pitch > 0) {
        for (let xx = X_RIM + 1; xx < X_FAR_FOOT - 1;) {
          const p = curveDy(xx), q = Math.sqrt(1 + p * p), cut = noise.n2(xx * 0.83, k * 3.1 + 7), dx = (TOOTH.half + TOOTH.hand * cut) / q;
          const ya = curveY(xx - dx) + up, yc = curveY(xx + dx) + up, ym = curveY(xx) + up, reach = TOOTH.reach + TOOTH.hand * noise.n2(xx * 0.61 + 40, k * 2.3);
          b.tri([xx - dx, ya, z - 0.2], [xx + dx, yc, z - 0.2], [xx, ym, z - reach], railInk);
          b.tri([xx - dx, ya, z + 0.2], [xx + dx, yc, z + 0.2], [xx, ym, z + reach], railInk);
          xx += pitch * (1 + 0.12 * cut) / q;
        }
      }
      if (o.things !== false) { style.lineThings(b, k, z, r); style.plateauThings(b, k, z, r, pr); style.uplandThings(b, k, z, pr); }
      await ctx_yield();
    }
    await ctx_yield();
    return b.geometry();
  };
  // ONE THING CUT INTO A SHEET (see CUTS): c is its entry, z the sheet's middle.
  style.cutThing = (b, c, z) => {
    const h = THICK / 2 + CUT.proud, zs = c.faces === 'both' ? [z - h, z + h] : [z - h];
    // the highest a piece that spans x0 to x1 may stand: CUT.hang under the lower of the edge's two ends
    const under = (x0, x1) => Math.min(curveY(x0), curveY(x1)) - CUT.hang;
    for (const zf of zs) {
      if (c.kind === 'arcade') {
        const A_ = ARCADE, w = A_.wide / 2;
        for (let x = c.x[0] + A_.pitch / 2; x < c.x[1]; x += A_.pitch) {
          const top = under(x - w, x + w), sp = top - A_.spring, ft = top - A_.tall;
          b.fan([[x - w, ft, zf], [x + w, ft, zf], [x + w, sp, zf], [x + w * 0.6, top - 0.35, zf], [x, top, zf], [x - w * 0.6, top - 0.35, zf], [x - w, sp, zf]], pal.light);
        }
      } else if (c.kind === 'rounds') {
        const r = ROUNDS.r;
        for (let x = c.x[0] + ROUNDS.pitch / 2; x < c.x[1]; x += ROUNDS.pitch) {
          for (let row = 0; row < (c.rows || 1); row++) {
            const xc = x + row * ROUNDS.pitch / 2, cy = under(xc - r, xc + r) - r - row * ROUNDS.row, pts = [];
            for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; pts.push([xc + r * Math.cos(a), cy + r * Math.sin(a), zf]); }
            b.fan(pts, pal.window);
          }
        }
      } else {
        const H_ = HALT, trim = pal.roof.clone().lerp(pal.core, 0.35), zw = zf + (zf < z ? -0.1 : 0.1);
        for (let x = c.x[0]; x < c.x[1] - 0.01; x += H_.cell) {
          const x1 = x + H_.cell, y0 = curveY(x) - CUT.hang - 0.6, y1 = curveY(x1) - CUT.hang - 0.6, at = (u, d, zz) => [x + u, y0 + (y1 - y0) * u / H_.cell - d, zz];
          b.quad(at(0, H_.deep, zf), at(H_.cell, H_.deep, zf), at(H_.cell, 0, zf), at(0, 0, zf), pal.thing);
          b.quad(at(H_.win[0], H_.win[3], zw), at(H_.win[1], H_.win[3], zw), at(H_.win[1], H_.win[2], zw), at(H_.win[0], H_.win[2], zw), pal.window);
          b.quad(at(0, 0.5, zw), at(H_.cell, 0.5, zw), at(H_.cell, 0, zw), at(0, 0, zw), trim);
          b.quad(at(0, H_.deep, zw), at(H_.cell, H_.deep, zw), at(H_.cell, H_.deep - 0.4, zw), at(0, H_.deep - 0.4, zw), trim);
        }
      }
    }
  };
  let ctx_yield = async () => {};
  style.setYield = (fn) => { ctx_yield = fn || (async () => {}); };

  // WHAT STANDS ON EVERY LINE AND DOES NOT MOVE: the station's span over the line at the bottom, the buffer at the
  // rim's end, and at the crest two small brackets of paper beside the line, one with the staff (toward +z),
  // one with the beacon's post and lamp house (toward -z). All inside the plan's boxes.
  // A LAMP of the line: a dark post from (x, y0) to y1, a flat disc of the lamp ink of radius rad standing 0.2 m
  // proud of the post toward up-valley and toward down-valley, and a small dark hood over it; steady.
  const cutLamp = (b, x, y0, y1, z, rad) => {
    const { ink, lamp } = pal, cy = y1 + rad * 0.55;
    b.box(x - 0.15, y0, z - 0.15, x + 0.15, y1 + rad * 1.5, z + 0.15, ink);
    for (const zz of [z - 0.2, z + 0.2]) { const ring = []; for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; ring.push([x + Math.cos(a) * rad, cy + Math.sin(a) * rad, zz]); } b.fan(ring, lamp); }
    b.tri([x - rad * 1.35, cy + rad * 1.02, z], [x + rad * 1.35, cy + rad * 1.02, z], [x, cy + rad * 1.9, z], ink);
  };
  style.lineThings = (b, k, z, r) => {
    const { thing, roof, ink, core, window: win } = pal, trim = roof.clone().lerp(core, 0.35);
    // THE STATION'S SPAN over this line (STATION, where every figure and rule is said)
    const G = STATION, w = SHED.halfW - G.relief, xa = SHED.x - SHED.halfL, xm = shedMouthX(k), n = 3, grand = k % G.grandEvery === G.grandAt;
    const paneA = win, paneB = win.clone().lerp(pal.foot, G.shade), liner = pal.foot.clone().lerp(win, 0.5), floor = pal.patch, top = G.ridge + G.lanternUp + (grand ? G.grandUp : 0);
    const X = [], Y = []; for (let i = 0; i <= n; i++) { X.push(xa + (xm - xa) * i / n); Y.push(curveY(X[i])); }
    // the span's own ground line: straight from node to node (every piece of the span is set out from it)
    const yAt = (x) => { const i = Math.min(n - 1, Math.max(0, Math.floor((x - xa) / (xm - xa) * n))); return Y[i] + (Y[i + 1] - Y[i]) * (x - X[i]) / (X[i + 1] - X[i]); };
    // a point of a slope: t 0 at the eave, 1 at the lantern's foot; up: m over the pane
    const S3 = (x, sg, t, up = 0) => [x, yAt(x) + G.eave + (G.ridge - G.eave) * t + up, z + sg * (w + (G.lantern - w) * t)];
    for (let i = 0; i < n; i++) {
      const x0 = X[i], x1 = X[i + 1], y0 = Y[i], y1 = Y[i + 1];
      for (const sg of [-1, 1]) {
        const zw = z + sg * w, zi = z + sg * (w - 0.1), zl = z + sg * G.lantern;
        b.quad([x0, y0 + G.sill, zw], [x1, y1 + G.sill, zw], [x1, y1 + G.eave, zw], [x0, y0 + G.eave, zw], thing);          // the wall
        if (i !== 1) b.quad([x0, y0 + G.sill, zi], [x1, y1 + G.sill, zi], [x1, y1 + G.eave - 0.1, zi], [x0, y0 + G.eave - 0.1, zi], liner);   // its warm lining, in the two end lengths
        b.quad(S3(x0, sg, 0), S3(x1, sg, 0), S3(x1, sg, 1), S3(x0, sg, 1), sg < 0 ? paneA : paneB);                               // the panes
        b.quad(S3(x0, sg, 0, G.proud), S3(x1, sg, 0, G.proud), S3(x1, sg, G.gutter, G.proud), S3(x0, sg, G.gutter, G.proud), ink);   // the gutter strip
        b.quad(S3(x0, sg, G.purlin[0], G.proud), S3(x1, sg, G.purlin[0], G.proud), S3(x1, sg, G.purlin[1], G.proud), S3(x0, sg, G.purlin[1], G.proud), ink);   // the purlin
        b.quad([x0, y0 + G.ridge, zl], [x1, y1 + G.ridge, zl], [x1, y1 + top, zl], [x0, y0 + top, zl], roof);                 // the lantern's cheek
        // the wall that looks up-valley carries a lit window band, a long window to each of its three lengths;
        // the other wall one small lit window in its middle length; all standing G.relief m proud
        if (sg < 0 || i === 1) {
          const u0 = x0 + (sg < 0 ? 0.6 : 1.6), u1 = sg < 0 ? x1 - 0.6 : u0 + 1.7, zq = zw + sg * G.relief;
          b.quad([u0, yAt(u0) + 2.3, zq], [u1, yAt(u1) + 2.3, zq], [u1, yAt(u1) + 3.9, zq], [u0, yAt(u0) + 3.9, zq], win);
        }
      }
      b.quad([x0, y0 + top, z - G.lantern], [x1, y1 + top, z - G.lantern], [x1, y1 + top, z + G.lantern], [x0, y0 + top, z + G.lantern], pal.light);   // the lantern's strip
      b.quad([x0, y0 + G.sill + 0.05, z - w + 0.1], [x1, y1 + G.sill + 0.05, z - w + 0.1], [x1, y1 + G.sill + 0.05, z + w - 0.1], [x0, y0 + G.sill + 0.05, z + w - 0.1], floor);   // the floor
    }
    // the ribs: one at either end and one every G.bay m between, across both slopes
    const ribs = [[xa, xa + G.rib], [xm - G.rib, xm]];
    for (let x = xa + G.bay; x < xm - G.bay * 0.4; x += G.bay) ribs.push([x - G.rib / 2, x + G.rib / 2]);
    for (const [r0, r1] of ribs) for (const sg of [-1, 1]) b.quad(S3(r0, sg, 0, G.proud), S3(r1, sg, 0, G.proud), S3(r1, sg, 1, G.proud), S3(r0, sg, 1, G.proud), ink);
    // the two gabled ends, each with its arched opening, and the lantern's ends
    for (const xe of [xa, xm]) {
      const ye = yAt(xe), A_ = G.arch, E = (zz, yy) => [xe, ye + yy, z + zz];
      for (const sg of [-1, 1]) {
        b.quad(E(sg * w, G.sill), E(sg * A_.half, G.sill), E(sg * A_.half, A_.spring), E(sg * w, A_.spring), thing);
        b.quad(E(sg * w, A_.spring), E(sg * A_.half, A_.spring), E(sg * A_.haunch[0], A_.haunch[1]), E(sg * w, G.eave), thing);
        b.quad(E(sg * w, G.eave), E(sg * A_.haunch[0], A_.haunch[1]), E(0, A_.crown), E(sg * G.lantern, G.ridge), thing);
        b.tri(E(0, A_.crown), E(0, G.ridge), E(sg * G.lantern, G.ridge), thing);
      }
      b.quad(E(-G.lantern, G.ridge), E(G.lantern, G.ridge), E(G.lantern, top), E(-G.lantern, top), roof);
    }
    if (grand) {   // the transept of a grander bay: a gable on each wall over the span's middle, a lit round in it, two paned pieces behind it
      const xc = (xa + xm) / 2, tw = G.transept, yc = yAt(xc);
      for (const sg of [-1, 1]) {
        const zw = z + sg * w, zl = z + sg * G.lantern, f0 = [xc - tw, yAt(xc - tw) + G.eave, zw], f1 = [xc + tw, yAt(xc + tw) + G.eave, zw], pk = [xc, yc + top, zw];
        b.tri(f0, f1, pk, thing);
        const ring = []; for (let i = 0; i < 6; i++) { const a_ = (i + 0.5) * Math.PI / 3; ring.push([xc + 0.55 * Math.cos(a_), yc + G.eave + 0.75 + 0.55 * Math.sin(a_), zw + sg * G.relief]); }
        b.fan(ring, win);
        b.tri(f0, pk, [xc, yc + top, zl], paneB); b.tri(f1, pk, [xc, yc + top, zl], pal.light);
      }
    }
    // the apron before the mouth, on the sheet's own built edge (edgeY), from corner to corner of that edge
    const AP = G.apron, xe2 = SHED.x + SHED.halfL + AP.beyond, apron = core.clone().lerp(pal.light, 0.5), hh = THICK / 2, ax = [xm];
    for (const cx of curveXs()) if (cx > xm + 0.3 && cx < xe2 - 0.3) ax.push(cx);
    ax.push(xe2);
    for (let i = 0; i < ax.length - 1; i++) {
      const x0 = ax[i], x1 = ax[i + 1], y0 = edgeY(x0), y1 = edgeY(x1);
      b.quad([x0, y0 + AP.up, z - hh], [x1, y1 + AP.up, z - hh], [x1, y1 + AP.up, z + hh], [x0, y0 + AP.up, z + hh], apron);
      for (const sg of [-1, 1]) b.quad([x0, y0 + AP.up, z + sg * hh], [x1, y1 + AP.up, z + sg * hh], [x1, y1 - AP.skirt, z + sg * (hh + AP.proud)], [x0, y0 - AP.skirt, z + sg * (hh + AP.proud)], apron);
    }
    // the buffer stop at the rim's end: a dark block astride the edge on a raked foot, with one cross beam of the
    // trim tint (the roof's ink taken 0.35 of the way to the paper's core) toward the line, as wide as the block, and a lamp on a short post
    const by = curveY(X_RIM);
    b.box(X_RIM - 2.4, by - 1.0, z - 1.5, X_RIM - 0.8, by + 2.6, z + 1.5, ink, roof, ink);
    b.box(X_RIM - 0.8, by + 1.25, z - 1.5, X_RIM - 0.4, by + 1.95, z + 1.5, trim, trim, trim);
    for (const sgn of [-1, 1]) b.tri([X_RIM - 2.4, by - 1.0, z + sgn * 1.5], [X_RIM - 2.4, by + 2.6, z + sgn * 1.5], [X_RIM - 4.6, by - 1.0, z + sgn * 1.5], ink);
    // and its lamp (BUFFER_LAMP), on the block's middle: the rim's end reads as a string of lamps down the valley
    cutLamp(b, X_RIM - 1.6, by + 2.6, by + 2.6 + BUFFER_LAMP.post, z, BUFFER_LAMP.r);
    // the crest: the staff's bracket and staff
    const xs = X_CREST + 1.2, ys = curveY(xs), h = THICK / 2;
    b.tri([xs, ys - 0.15, z + h], [xs, ys - 0.15, z + 2.95], [xs, ys - 2.7, z + h], thing);
    b.quad([xs - 0.55, ys - 0.15, z + h], [xs + 0.55, ys - 0.15, z + h], [xs + 0.55, ys - 0.15, z + 2.95], [xs - 0.55, ys - 0.15, z + 2.95], thing);
    b.box(xs - 0.13, ys - 0.15, z + 2.07, xs + 0.13, ys + 12.45, z + 2.33, ink);
    // the beacon's bracket, post and lamp house (its two discs are the clock's: makeLines)
    const xb = X_CREST - 2.6, yb = curveY(xb);
    b.tri([xb, yb - 0.15, z - h], [xb, yb - 0.15, z - 2.95], [xb, yb - 2.7, z - h], thing);
    b.quad([xb - 0.55, yb - 0.15, z - h], [xb + 0.55, yb - 0.15, z - h], [xb + 0.55, yb - 0.15, z - 2.95], [xb - 0.55, yb - 0.15, z - 2.95], thing);
    b.box(xb - 0.16, yb - 0.15, z - 2.26, xb + 0.16, yb + 6.0, z - 1.94, ink);
    b.box(xb - 0.5, yb + 5.5, z - 2.5, xb + 0.5, yb + 6.0, z - 1.7, ink);
    b.box(xb - 0.9, yb + 6.0, z - 2.98, xb + 0.9, yb + 8.5, z - 0.72, thing, roof, thing);
    const cap = [[xb - 1.25, yb + 8.5, z - 3.0], [xb + 1.25, yb + 8.5, z - 3.0], [xb + 1.25, yb + 8.5, z - 0.7], [xb - 1.25, yb + 8.5, z - 0.7]], tip = [xb, yb + 9.5, z - 1.85];
    for (let i = 0; i < 4; i++) b.tri(cap[i], cap[(i + 1) % 4], tip, i % 2 ? roof : roof.clone().lerp(ink, 0.4));
    b.quad(cap[0], cap[1], cap[2], cap[3], ink);
  };
  // where a beacon's two discs and a pennant's hoist stand on a line (the same figures as lineThings)
  style.crestPlaces = () => { const xb = X_CREST - 2.6, xs = X_CREST + 1.2;
    return { disc: [xb, curveY(xb) + 7.25, -1.85], discOff: 1.02, discR: 1.1, hoist: [xs + 0.13, curveY(xs) + 10.9, 2.2] }; };

  // PINES AND THE LINE'S SMALL BUILDINGS on the steps and the rim plateau (x under -197): flat shapes of one
  // dark ink standing in the sheet's own plane; with their ground nothing stands over y 86 (a pine that would
  // is cut shorter, and one left under 5 m is not planted: so none stands on the back ridge).
  const groundAt = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i][0] && x <= pts[i + 1][0]) {
    const p = pts[i], q = pts[i + 1], f = (x - p[0]) / Math.max(1e-6, q[0] - p[0]); return [p[1] + (q[1] - p[1]) * f, Math.abs(q[1] - p[1]) / Math.max(1e-6, q[0] - p[0])]; } return [0, 9]; };
  const TOP = curveY(X_RIM) + RIM_PLATEAU_H - 0.3;
  style.pineShare = style.pineShare ?? (rng() < 0.5 ? 0.5 : 1);    // an edition has few pines or many
  style.plateauThings = (b, k, z, r, pr) => {
    const { thing, window: win } = pal, pts = pr.pts;
    const stands = Math.round(r.range(0.6, 2.6) * style.pineShare * style.detail);
    for (let s = 0; s < stands; s++) {
      let x = r.range(X_STEPS + 8, -212); const count = r.int(3, 9);
      for (let i = 0; i < count; i++) {
        x += r.range(2.6, 6.5); if (x > -199) break;
        const [gy, steep] = groundAt(pts, x), hgt = Math.min(r.range(5, 12), TOP - gy), lean = r.range(-0.07, 0.07) + (r.chance(0.12) ? r.range(-0.2, 0.2) : 0);
        if (hgt < 5 || steep > 0.8) continue;
        const wd = hgt * r.range(0.2, 0.26), P3 = (dx, dy) => [x + dx + lean * dy, gy + dy - 0.1, z];
        b.quad(P3(-0.22, 0), P3(0.22, 0), P3(0.22, hgt * 0.3), P3(-0.22, hgt * 0.3), thing);
        b.tri(P3(-wd, hgt * 0.2), P3(wd, hgt * 0.2), P3(0, hgt * 0.62), thing);
        b.tri(P3(-wd * 0.78, hgt * 0.45), P3(wd * 0.78, hgt * 0.45), P3(0, hgt * 0.84), thing);
        b.tri(P3(-wd * 0.55, hgt * 0.68), P3(wd * 0.55, hgt * 0.68), P3(0, hgt), thing);
      }
    }
    const pick = r(), bx = r.range(-318, -222), [gy, steep] = groundAt(pts, bx), room = TOP - gy;
    if (steep > 0.25 || pick > 0.3) return;
    const Q = (dx, dy) => [bx + dx, gy + dy - 0.1, z];
    if (pick < 0.13 && room > 10.6) {          // a water tower: a tank with a low cap on two braced legs
      b.quad(Q(-1.9, 0), Q(-1.55, 0), Q(-1.25, 6.2), Q(-1.6, 6.2), thing); b.quad(Q(1.55, 0), Q(1.9, 0), Q(1.6, 6.2), Q(1.25, 6.2), thing);
      b.quad(Q(-1.7, 2.6), Q(1.5, 4.3), Q(1.5, 4.6), Q(-1.7, 2.9), thing);
      b.quad(Q(-2.5, 6.2), Q(2.5, 6.2), Q(2.5, 9.3), Q(-2.5, 9.3), thing); b.tri(Q(-2.8, 9.3), Q(2.8, 9.3), Q(0, 10.5), thing);
    } else if (pick >= 0.13 && room > 6.2) {   // a row of three workers' houses, a lit window in each
      for (let i = 0; i < 3; i++) {
        const o = i * 5.2;
        b.quad(Q(o, 0), Q(o + 4.8, 0), Q(o + 4.8, 3.5), Q(o, 3.5), thing); b.tri(Q(o - 0.3, 3.5), Q(o + 5.1, 3.5), Q(o + 2.4, 5.7), thing);
        b.quad(Q(o + 3.6, 5.0), Q(o + 4.1, 5.0), Q(o + 4.1, 6.1), Q(o + 3.6, 6.1), thing);
        if (r.chance(0.75)) for (const zz of [-0.14, 0.14]) {
          const u = o + 1.2 + (i % 2) * 1.3; b.quad([bx + u, gy + 1.5, z + zz], [bx + u + 1.0, gy + 1.5, z + zz], [bx + u + 1.0, gy + 2.6, z + zz], [bx + u, gy + 2.6, z + zz], win);
        }
      }
    }
  };

  // THE UPLAND BEHIND THE NEAR RIM on sheet k (UPLAND, where every figure and rule is said): its field strips,
  // hedges, lane, lane lamp and tall things. Everything by the sheet's number; no draw from the seed.
  const fieldStock = (j, q) => { const pick = (qq) => Math.floor(own01(qq, 300 + j) * 5) % 5, a = pick(q); return a === pick(q - 1) ? (a + 1 + (q & 1)) % 5 : a; };
  style.uplandThings = (b, k, z, pr) => {
    const U = UPLAND, pts = pr.pts, { thing, ink, window: win, lamp } = pal, own = style.sheetInks(k), zp = z - THICK / 2 - U.proud;
    // one pasted piece from xa to xb: its top follows the cut edge, its foot is level U.deep m under its lowest top
    const paste = (xa, xb, tint) => {
      const xs = [xa]; for (const p of pts) if (p[0] > xa + 0.3 && p[0] < xb - 0.3) xs.push(p[0]); xs.push(xb);
      const ys = xs.map((x) => groundAt(pts, x)[0]), foot = Math.min(...ys) - U.deep;
      for (let i = 0; i < xs.length - 1; i++) b.quad([xs[i], foot, zp], [xs[i + 1], foot, zp], [xs[i + 1], ys[i + 1], zp], [xs[i], ys[i], zp], tint);
    };
    for (let j = 0; j < U.strips.length - 1; j++) {
      const q = Math.floor((k + U.lead[j]) / U.runs[j]), st = fieldStock(j, q), spare = U.inset[1] - U.inset[0];
      paste(U.strips[j] + U.inset[0] + spare * own01(q, 320 + j), U.strips[j + 1] - U.inset[0] - spare * own01(q, 340 + j), style.sheetInks(k, st).up.lerp(pal.deep, U.shade));
      // the hedge along this strip's upper bound
      if (j > 0 && own01(Math.floor((k + 5 * j) / U.hedge.run), 360 + j) < U.hedge.share && own01(k, 380 + j) < (0.5 + 0.5 * Math.min(1, style.pineShare)) * style.detail) {
        const x = U.strips[j] + (own01(k, 440 + j) - 0.5) * 1.6, gy = groundAt(pts, x)[0], hgt = Math.min(U.hedge.tall[0] + (U.hedge.tall[1] - U.hedge.tall[0]) * own01(k, 400 + j), TOP - gy);
        const lean = (own01(k, 420 + j) - 0.5) * 0.12, wd = hgt * 0.24, P3 = (dx, dy) => [x + dx + lean * dy, gy + dy - 0.1, z];
        if (hgt > 3) { b.quad(P3(-0.2, 0), P3(0.2, 0), P3(0.2, hgt * 0.3), P3(-0.2, hgt * 0.3), thing); b.tri(P3(-wd, hgt * 0.2), P3(wd, hgt * 0.2), P3(0, hgt * 0.66), thing); b.tri(P3(-wd * 0.7, hgt * 0.5), P3(wd * 0.7, hgt * 0.5), P3(0, hgt), thing); }
      }
    }
    paste(U.lane[0], U.lane[1], own.up.clone().lerp(pal.core, U.laneCore));
    paste(U.yard[0], U.yard[1], own.down.clone().lerp(pal.deep, U.yardDeep));
    if (k % U.lamp.every === 1) { const gy = groundAt(pts, U.lamp.x)[0]; cutLamp(b, U.lamp.x, gy - 0.1, gy + U.lamp.post, z, U.lamp.r); }
    const on = (t) => k % t.every === t.at % t.every && k >= t.at, G = (t) => groundAt(pts, t.x)[0] - 0.1;
    const warm = (x0, y0, x1, y1) => { for (const zz of [z - 0.14, z + 0.14]) b.quad([x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz], win); };
    if (on(U.mast)) {   // a signal mast: two legs that lean together, three cross bars, a round plate with a lamp disc
      const x = U.mast.x, g = G(U.mast), top = Math.min(U.mast.tall, TOP - g - 1.4), Q = (dx, dy) => [x + dx, g + dy, z];
      b.quad(Q(-1.1, 0), Q(-0.8, 0), Q(-0.1, top), Q(-0.3, top), ink); b.quad(Q(0.8, 0), Q(1.1, 0), Q(0.3, top), Q(0.1, top), ink);
      for (const f of [0.22, 0.48, 0.74]) b.quad(Q(-1.0 + 0.8 * f, top * f), Q(1.0 - 0.8 * f, top * f), Q(1.0 - 0.8 * f, top * f + 0.28), Q(-1.0 + 0.8 * f, top * f + 0.28), ink);
      const ring = (rad, zz) => { const o = []; for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; o.push([x + Math.cos(a) * rad, g + top + Math.sin(a) * rad, zz]); } return o; };
      b.fan(ring(1.35, z), ink); b.fan(ring(0.7, z - 0.14), lamp); b.fan(ring(0.7, z + 0.14), lamp);
    }
    if (on(U.tower)) {   // a water tower: a broad tank with a lit band and a low cap on two braced legs
      const x = U.tower.x, g = G(U.tower), Q = (dx, dy) => [x + dx, g + dy, z];
      b.quad(Q(-2.6, 0), Q(-2.1, 0), Q(-1.7, 7.2), Q(-2.2, 7.2), thing); b.quad(Q(2.1, 0), Q(2.6, 0), Q(2.2, 7.2), Q(1.7, 7.2), thing);
      b.quad(Q(-2.3, 2.6), Q(2.1, 5.2), Q(2.1, 5.6), Q(-2.3, 3.0), thing); b.quad(Q(-2.1, 5.2), Q(2.3, 2.6), Q(2.3, 3.0), Q(-2.1, 5.6), thing);
      b.quad(Q(-3.4, 7.2), Q(3.4, 7.2), Q(3.4, 11.0), Q(-3.4, 11.0), thing); b.tri(Q(-3.8, 11.0), Q(3.8, 11.0), Q(0, 12.5), ink);
      warm(x - 2.6, g + 8.6, x + 2.6, g + 9.3);
    }
    if (on(U.cabin)) {   // a signal cabin: a lit room with a hipped roof on a dark foot, steps at its side
      const x = U.cabin.x, g = G(U.cabin), Q = (dx, dy) => [x + dx, g + dy, z];
      b.quad(Q(-2.2, 0), Q(2.2, 0), Q(2.2, 3.4), Q(-2.2, 3.4), ink); b.quad(Q(-3.0, 3.4), Q(3.0, 3.4), Q(3.0, 6.6), Q(-3.0, 6.6), thing);
      b.quad(Q(-3.6, 6.6), Q(3.6, 6.6), Q(2.2, 8.4), Q(-2.2, 8.4), ink); b.quad(Q(2.2, 0), Q(4.6, 0), Q(3.0, 3.4), Q(2.6, 3.4), thing);
      for (let i = 0; i < 4; i++) warm(x - 2.6 + i * 1.35, g + 4.2, x - 1.55 + i * 1.35, g + 5.9);
    }
    if (on(U.stage)) {   // a long low stage of the line: a shallow roof over three lit doors and a chimney
      const x = U.stage.x, g = G(U.stage), Q = (dx, dy) => [x + dx, g + dy, z];
      b.quad(Q(-7, 0), Q(7, 0), Q(7, 4.2), Q(-7, 4.2), thing); b.quad(Q(-7.6, 4.2), Q(7.6, 4.2), Q(6.2, 5.6), Q(-6.2, 5.6), ink);
      b.quad(Q(4.4, 5.6), Q(5.3, 5.6), Q(5.3, 8.8), Q(4.4, 8.8), thing);
      for (let i = 0; i < 3; i++) { const u = x - 5.4 + i * 4.1; warm(u, g + 0.3, u + 2.6, g + 2.7); for (const zz of [z - 0.14, z + 0.14]) b.tri([u, g + 2.7, zz], [u + 2.6, g + 2.7, zz], [u + 1.3, g + 3.6, zz], win); }
    }
  };

  // THE FAR HALL between z0 and z1: one long hall across the lines, inside the plan's box (HALL): A STATION HALL'S
  // LANTERN ROOF OF CUT PAPER LIT FROM BEHIND. To every line one SPAN of paper panes 8 m wide, running the hall's 50 m
  // along the line: over the line itself a RAISED LANTERN, a level strip of pale panes HALLROOF.lantern m to either
  // side of the line at the box's top, on two dark cheeks HALLROOF.cheek m high; from the cheeks' feet a slope of
  // warm panes falls to either side to a dark GUTTER between two lines, HALLROOF.fall m under the cheeks' feet (so
  // within the car's width of a line the roof stands over the plan's 8.4 m everywhere). Opaque flat inks only:
  // the lantern's panes are the light table's ink, the slope that looks up-valley the window ink, the slope that
  // looks down-valley that ink taken HALLROOF.shade of the way to the warm foot's; HALLROOF.ribs dark ribs cross each
  // slope, HALLROOF.proud m proud of it. UNDER THE ROOF STAND CARRIAGES: on a line up to two flat darker warm
  // pieces, each a carriage's length and width with its roof's raised middle and ribs in a deeper ink, let into the lantern's strip at places of their own (fixed
  // draws by the line's number): nothing is seen through and nothing is lit. On one gutter in HALLROOF.ventEvery
  // (by its number) stands a small dark VENT; its plume is the clock's (hallPlumes) and stays under the box's top.
  // THE MOUTH toward the ridge is open under the spans' ends and DARK inside: a dark back wall and, between the
  // lines, a dark floor level with the sheets' edges, so that the lines' own edges and rails are seen running in;
  // over it the spans' ends show as a zigzag fascia of the trim tint (the roof's ink taken 0.35 of the way to the paper's core); between every two lines a post
  // stands in the mouth under the gutter with one small lit plate. The far wall is closed, with a row of small
  // lit windows.
  const HALLROOF = { lantern: 1.9, cheek: 0.5, fall: 1.6, gutter: 0.3, ribs: 7, rib: 0.4, proud: 0.06, shade: 0.45, fascia: 0.55,   // m (ribs: a count; shade: a share)
    car: [[243.5, 3], [265.6, 2.6]], carShare: 0.72, carProud: 0.03, carRibs: 7,   // a carriage piece: its near end's x and how far it may stand beyond that, m; the share of lines that have each
    ventEvery: 4, vent: [0.9, 0.9], ventX: [250, 276],                 // a vent: m square and high; where along the hall it may stand
    puffs: 3, drift: 5.5, lift: 0.5, speed: 0.22, size: 0.62, post: 0.4 };   // a plume: puffs, m drifted along +x, m risen, rounds a second, a puff's scale; post: a post's half width, m
  const hallHash = (a) => own01(a, 0.37);   // the far hall's own numbers: a second key no sheet has
  // the vent of the gutter on the up-valley side of the span numbered `key`, or null: [x, y of its top]
  const ventAt = (key) => (((key % HALLROOF.ventEvery) + HALLROOF.ventEvery) % HALLROOF.ventEvery !== 1 ? null
    : [HALLROOF.ventX[0] + (HALLROOF.ventX[1] - HALLROOF.ventX[0]) * hallHash(key * 17 + 5.5), HALL.y1 - HALLROOF.cheek - HALLROOF.fall + HALLROOF.vent[1]]);
  style.hallGeometry = (z0 = HALL.z0, z1 = HALL.z1) => {
    const b = makeBatch(), { thing, roof, ink, window: win, core, light, foot } = pal, H = HALL, G = HALLROOF;
    const trim = roof.clone().lerp(core, 0.35), paneA = win, paneB = win.clone().lerp(foot, G.shade), carInk = foot.clone().lerp(ink, 0.5), carDeep = foot.clone().lerp(ink, 0.72);
    const yT = H.y1, yC = yT - G.cheek, yG = yC - G.fall, xa = H.x0, xb = H.x1;
    const bays = Math.max(1, Math.round((z1 - z0) / D)), dz = (z1 - z0) / bays;
    for (let j = 0; j < bays; j++) {
      const za = z0 + j * dz, zb = za + dz, zc = (za + zb) / 2, key = Math.round(zc / D), hw = dz / 2 - G.gutter;
      // the lantern's strip of pale panes, its two cheeks, and the carriages under it
      b.quad([xa, yT, zc - G.lantern], [xb, yT, zc - G.lantern], [xb, yT, zc + G.lantern], [xa, yT, zc + G.lantern], light);
      for (const sg of [-1, 1]) b.quad([xa, yC, zc + sg * G.lantern], [xb, yC, zc + sg * G.lantern], [xb, yT, zc + sg * G.lantern], [xa, yT, zc + sg * G.lantern], roof);
      G.car.forEach(([cx, play], q) => {
        if (hallHash(key * 13 + q * 7.5 + 4.5) >= G.carShare) return;
        const c0 = cx + play * hallHash(key * 3 + q * 11.5), c1 = c0 + CAR.L, w = CAR.W / 2, y = yT + G.carProud;
        b.fan([[c0, y, zc], [c0 + 1.1, y, zc - w], [c1 - 1.1, y, zc - w], [c1, y, zc], [c1 - 1.1, y, zc + w], [c0 + 1.1, y, zc + w]], carInk);
        // its roof as the panes show it: a raised middle and G.carRibs ribs across, in a deeper ink, a step prouder
        b.quad([c0 + 1.6, y + G.carProud, zc - 0.5], [c1 - 1.6, y + G.carProud, zc - 0.5], [c1 - 1.6, y + G.carProud, zc + 0.5], [c0 + 1.6, y + G.carProud, zc + 0.5], carDeep);
        for (let i = 0; i < G.carRibs; i++) { const x = c0 + 1.9 + (CAR.L - 3.8) * i / (G.carRibs - 1);
          b.quad([x - 0.17, y + G.carProud, zc - w], [x + 0.17, y + G.carProud, zc - w], [x + 0.17, y + G.carProud, zc + w], [x - 0.17, y + G.carProud, zc + w], carDeep); }
      });
      // the two slopes of warm panes with their ribs, and over the mouth the span's end as a fascia
      for (const sg of [-1, 1]) {
        const zt = zc + sg * G.lantern, zg = zc + sg * hw, pane = sg < 0 ? paneA : paneB;
        b.quad([xa, yG, zg], [xb, yG, zg], [xb, yC, zt], [xa, yC, zt], pane);
        for (let i = 1; i <= G.ribs; i++) {
          const x = xa + (xb - xa) * i / (G.ribs + 1), p = G.proud;
          b.quad([x - G.rib / 2, yG + p, zg], [x + G.rib / 2, yG + p, zg], [x + G.rib / 2, yC + p, zt], [x - G.rib / 2, yC + p, zt], ink);
        }
        b.quad([xa, yG - G.fascia, zg], [xa, yG, zg], [xa, yC, zt], [xa, yC - G.fascia, zt], trim);
      }
      b.quad([xa, yC - G.fascia, zc - G.lantern], [xa, yC - G.fascia, zc + G.lantern], [xa, yT, zc + G.lantern], [xa, yT, zc - G.lantern], trim);
      // the gutter on the bay's first side (between two lines), and its vent where it has one
      b.quad([xa, yG, Math.max(z0, za - G.gutter)], [xb, yG, Math.max(z0, za - G.gutter)], [xb, yG, za + G.gutter], [xa, yG, za + G.gutter], ink);
      const vent = ventAt(key);
      if (vent && j > 0) b.box(vent[0] - G.vent[0] / 2, yG, za - G.gutter, vent[0] + G.vent[0] / 2, vent[1], za + G.gutter, ink, roof, ink);
      // the floor between two lines, level with the sheets' edges, from sheet to sheet
      b.quad([xa + 0.3, 0, Math.max(z0, za + THICK / 2 - dz / 2)], [xb - 0.4, 0, Math.max(z0, za + THICK / 2 - dz / 2)], [xb - 0.4, 0, za + dz / 2 - THICK / 2], [xa + 0.3, 0, za + dz / 2 - THICK / 2], ink);
      // the post in the mouth on the bay's first side (between two lines), with its lit plate
      const p0 = za - G.post, p1 = za + G.post, front = (y0, y1, c) => b.quad([xa, y0, p0], [xa, y0, p1], [xa, y1, p1], [xa, y1, p0], c);
      front(0, 4.9, trim); front(4.9, 5.7, win); front(5.7, yG, trim);
      for (const pz of [p0, p1]) b.quad([xa, 0, pz], [xa + 0.7, 0, pz], [xa + 0.7, yG, pz], [xa, yG, pz], thing);
      // the far wall's piece under this span: closed to the roof's own outline
      b.fan([[xb, yG, zc - hw], [xb, yG, zc + hw], [xb, yC, zc + G.lantern], [xb, yT, zc + G.lantern], [xb, yT, zc - G.lantern], [xb, yC, zc - G.lantern]], thing);
    }
    b.quad([xa, yG, z1 - G.gutter], [xb, yG, z1 - G.gutter], [xb, yG, z1], [xa, yG, z1], ink);
    b.quad([xa + 0.3, 0, z1 - dz / 2 + THICK / 2], [xb - 0.4, 0, z1 - dz / 2 + THICK / 2], [xb - 0.4, 0, z1], [xa + 0.3, 0, z1], ink);
    b.quad([xb - 0.4, 0, z0], [xb - 0.4, yG, z0], [xb - 0.4, yG, z1], [xb - 0.4, 0, z1], ink);   // the back wall inside, up to the gutters
    b.quad([xb, 0, z0], [xb, yG, z0], [xb, yG, z1], [xb, 0, z1], thing);                                   // the far wall up to the gutters
    for (const ze of [z0, z1]) b.quad([xa, 0, ze], [xb, 0, ze], [xb, yG, ze], [xa, yG, ze], thing);        // the hall's two end walls
    for (let zz = Math.ceil((z0 + 1) / D) * D - D / 2; zz < z1 - 1; zz += D) {
      if (zz < z0 + 1) continue;
      b.quad([xb + 0.12, 3.6, zz - 0.9], [xb + 0.12, 3.6, zz + 0.9], [xb + 0.12, 4.8, zz + 0.9], [xb + 0.12, 4.8, zz - 0.9], win);
    }
    return b.geometry();
  };
  // THE VENTS' PLUMES between z0 and z1, on the clock alone: over every vent HALLROOF.puffs flat puffs of the plume's
  // ink, each drifting HALLROOF.drift m along the gutter toward +x (the pennants' wind) and rising HALLROOF.lift m while
  // it thins to nothing, again and again, HALLROOF.speed rounds a second, each vent a step of its own behind the
  // next. A puff's top stays under the box's top. { mesh, pose(time) }; pose writes matrices only.
  style.hallPlumes = (z0 = HALL.z0, z1 = HALL.z1) => {
    const G = HALLROOF, vents = [];
    const bays = Math.max(1, Math.round((z1 - z0) / D)), dz = (z1 - z0) / bays;
    for (let j = 1; j < bays; j++) { const za = z0 + j * dz, key = Math.round((za + dz / 2) / D), v = ventAt(key); if (v) vents.push([[v[0], v[1], za], key]); }
    const n = Math.max(1, vents.length * G.puffs), mesh = new THREE.InstancedMesh(style.puffGeometry(), style.paper, n), arr = mesh.instanceMatrix.array;
    mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); arr.fill(0);
    const pose = (time) => {
      for (let i = 0; i < vents.length; i++) for (let q = 0; q < G.puffs; q++) {
        const [v, key] = vents[i], f = (time * G.speed + q / G.puffs + key * 0.37) % 1, sz = G.size * (1 - 0.75 * f), o = (i * G.puffs + q) * 16;
        arr[o] = sz; arr[o + 5] = sz; arr[o + 10] = 1; arr[o + 12] = v[0] + G.drift * f; arr[o + 13] = Math.min(HALL.y1 - 0.85 * sz, v[1] + 0.4 + G.lift * f); arr[o + 14] = v[2]; arr[o + 15] = 1;
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    pose(0);
    return { mesh, pose, vents: vents.length };
  };
  // THE SKY, BUILT: a shell of flat bands about the constant centre o.center, o.radius m out (never carried with the lens). Toward the
  // afterglow (within 25 degrees of +x) the bands are level and stand as palette.sky gives them (degrees up);
  // from there the four warm bands and the violet taper to nothing by 80 degrees of bearing, as long cut strips
  // do, while a slate band rises under them from the horizon to 8 degrees and the blue's top comes down from
  // 50 to 25 degrees. Every band keeps one flat ink all the way round. PIN HOLES: o.stars small flat discs
  // (0.12 to 0.25 degrees across) above 22 degrees and above the violet, densest toward -x.
  style.skyGeometry = (o = {}) => {
    const b = makeBatch(), c = o.center, R = o.radius, SEG = 48, sky = pal.sky, rad = Math.PI / 180;
    const at = (bear, el, r = R) => [c[0] + r * Math.cos(el * rad) * Math.cos(bear * rad), c[1] + r * Math.sin(el * rad), c[2] + r * Math.cos(el * rad) * Math.sin(bear * rad)];
    const off = (bear) => Math.abs(((bear + 540) % 360) - 180);
    const wOf = (bear) => { const d = off(bear); return d <= 25 ? 1 : d >= 80 ? 0 : Math.cos((d - 25) / 55 * 90 * rad); };
    // the upper boundaries of the eight bands at a bearing: slate, the four warm ones, violet, blue, deep
    const tops = (bear) => { const w = wOf(bear), t0 = 8 * (1 - w);
      return [t0, t0 + sky[0][0] * w, t0 + sky[1][0] * w, t0 + sky[2][0] * w, t0 + sky[3][0] * w, t0 + sky[4][0] * w, sky[5][0] * w + 25 * (1 - w), 90]; };
    const inks = [pal.skyBack, sky[0][1], sky[1][1], sky[2][1], sky[3][1], sky[4][1], sky[5][1], sky[6][1]];
    // how many rings each band is laid in: the same all the way round (its tallest place decides), so that two
    // neighbouring segments share every corner along their common edge and no seam opens between them
    const rings = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let s = 0; s <= SEG; s++) { const t = tops(s * 360 / SEG); for (let i = 0; i < 8; i++) rings[i] = Math.max(rings[i], 1, Math.ceil((t[i] - (i ? t[i - 1] : 0)) / 8)); }
    for (let s = 0; s < SEG; s++) {
      const b0 = s * 360 / SEG, b1 = (s + 1) * 360 / SEG, t0 = tops(b0), t1 = tops(b1);
      b.quad(at(b0, -9), at(b1, -9), at(b1, 0), at(b0, 0), pal.light);
      for (let i = 0; i < 8; i++) {
        const lo0 = i ? t0[i - 1] : 0, lo1 = i ? t1[i - 1] : 0;
        if (t0[i] - lo0 < 0.01 && t1[i] - lo1 < 0.01) continue;
        // a band is laid in rings at most 8 degrees tall, so that the shell stays within a hair of its sphere
        // and the pin holes, which stand 0.5% inside it, are never behind a facet
        const m = rings[i];
        for (let j = 0; j < m; j++) {
          const f0 = j / m, f1 = (j + 1) / m, a0 = lo0 + (t0[i] - lo0) * f0, a1 = lo1 + (t1[i] - lo1) * f0, c0 = lo0 + (t0[i] - lo0) * f1, c1 = lo1 + (t1[i] - lo1) * f1;
          if (i === 7 && j === m - 1) b.tri(at(b0, a0), at(b1, a1), at(0, 90), inks[i]); else b.quad(at(b0, a0), at(b1, a1), at(b1, c1), at(b0, c0), inks[i]);
        }
      }
    }
    const stars = o.stars ?? 420, r = rng.fork ? rng.fork('cbu-stars') : rng;
    // o.even: the share of pin holes spread evenly round the sky (the rest gather toward -x); o.high: heights spread
    // evenly over the sky's area above 22 degrees (otherwise they gather low); o.large: sizes lean to the upper end;
    // o.fill: go on drawing places until `stars` pin holes stand (at most four tries for each)
    const s22 = Math.sin(22 * rad);
    for (let n = 0, tries = 0; n < stars && tries < stars * 4; tries++) {
      const bear = (o.even && r() < o.even) ? r() * 360 : 180 + (r() + r() + r() - 1.5) * 150;
      const el = o.high ? Math.asin(Math.min(1, s22 + (0.995 - s22) * r())) / rad : 22 + 66 * r() * r(), size = o.large ? 0.125 - 0.065 * r() * r() : r.range(0.06, 0.125);
      if (el < tops(bear)[5] + 2) { if (!o.fill) n++; continue; }
      n++;
      const pts = []; for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; pts.push(at(bear + size * Math.cos(a) / Math.max(0.2, Math.cos(el * rad)), el + size * Math.sin(a), R * 0.995)); }
      b.fan(pts, pal.star);
    }
    if (o.moon) {   // the rare edition: a thin flat crescent 2.2 degrees across with one flat ring, o.moon.up degrees up at
      // the bearing o.moon.bearing (degrees from +x toward +z)
      const mb = o.moon.bearing, me = o.moon.up, M2 = (dx, dy, rr) => at(mb + dx / Math.cos(me * rad), me + dy, R * rr), ringInk = pal.deep.clone().lerp(pal.star, 0.45);
      for (let j = 0; j < 28; j++) {
        const a0 = j / 28 * Math.PI * 2, a1 = (j + 1) / 28 * Math.PI * 2;
        b.quad(M2(1.7 * Math.cos(a0), 1.7 * Math.sin(a0), 0.993), M2(1.7 * Math.cos(a1), 1.7 * Math.sin(a1), 0.993), M2(1.92 * Math.cos(a1), 1.92 * Math.sin(a1), 0.993), M2(1.92 * Math.cos(a0), 1.92 * Math.sin(a0), 0.993), ringInk);
      }
      const horn = 100 * rad, turn = -0.6, rin = (a) => 1.1 - 0.42 * Math.cos(a / horn * Math.PI / 2);
      for (let j = 0; j < 14; j++) {
        const a0 = -horn + j / 14 * 2 * horn, a1 = -horn + (j + 1) / 14 * 2 * horn;
        b.quad(M2(1.1 * Math.cos(turn + a0), 1.1 * Math.sin(turn + a0), 0.99), M2(1.1 * Math.cos(turn + a1), 1.1 * Math.sin(turn + a1), 0.99),
          M2(rin(a1) * Math.cos(turn + a1), rin(a1) * Math.sin(turn + a1), 0.99), M2(rin(a0) * Math.cos(turn + a0), rin(a0) * Math.sin(turn + a0), 0.99), pal.star);
      }
    }
    return b.geometry();
  };
  // A piece of THE LIGHT TABLE: one level sheet of lit paper at y -24.
  style.tableGeometry = (x0, x1, z0, z1) => makeBatch().quad([x0, TABLE_Y, z0], [x1, TABLE_Y, z0], [x1, TABLE_Y, z1], [x0, TABLE_Y, z1], pal.light).geometry();
}

function addCarMakers(style, rng) {
  const pal = style.palette;
  // THE CAR, in its own frame: x along the line (20 m, -10 to 10), y up from the curve under its middle
  // (4.8 m over the rail), z across (3.4 m, astride the sheet). Dark paper of two flat tones (sides, roof),
  // sixteen lit windows a side, each 0.05 m proud of its side, a pinion housing low
  // amidships and a bogie plate toward each end hanging beside the sheet, buffers, a short funnel, and one
  // flat lamp disc at each end. rest = true gives the plain car of the far country's rows: sides with one lit
  // band, the roof and the two lamp discs, its ends left open (the rows stand nose to tail).
  style.carGeometry = (rest = false) => {
    const b = makeBatch(), { ink, roof, window: win, lamp } = pal, hw = CAR.W / 2, xe = 9.3, side = ink.clone().lerp(roof, 0.25);
    const y0 = 0.25, y1 = 2.05, y2 = 3.05, y3 = 3.9, yr = 4.45, zr = 1.0;
    for (const sg of [-1, 1]) {
      const z = sg * hw;
      if (rest) {
        b.quad([-xe, -0.7, z], [xe, -0.7, z], [xe, y1, z], [-xe, y1, z], side);
        b.quad([-xe, y2, z], [xe, y2, z], [xe, y3, z], [-xe, y3, z], side);
      } else b.quad([-xe, y0, z], [xe, y0, z], [xe, y3, z], [-xe, y3, z], side);
      b.quad([-xe, y3, z], [xe, y3, z], [xe, yr, sg * zr], [-xe, yr, sg * zr], roof);
      if (rest) { b.quad([-xe, y1, z], [xe, y1, z], [xe, y2, z], [-xe, y2, z], win); continue; }
      // the window row: sixteen windows of 0.72 m, 1.1 m apart, each 0.05 m proud of the side
      for (let i = 0; i < 16; i++) { const w0 = -8.8 + i * 1.1 + 0.19, w1 = w0 + 0.72, zw = sg * (hw + 0.05); b.quad([w0, y1, zw], [w1, y1, zw], [w1, y2, zw], [w0, y2, zw], win); }
      // what hangs beside the sheet: the pinion housing amidships and a bogie plate toward each end
      b.quad([-2.6, y0, z], [2.6, y0, z], [1.9, -1.55, z], [-1.9, -1.55, z], ink);
      for (const e of [-1, 1]) b.quad([e * 4.4, y0, z], [e * 8.4, y0, z], [e * 7.9, -0.85, z], [e * 4.9, -0.85, z], ink);
    }
    b.quad([-xe, yr, -zr], [xe, yr, -zr], [xe, yr, zr], [-xe, yr, zr], roof.clone().lerp(ink, 0.3));
    for (const e of [-1, 1]) {
      const x = e * xe;
      if (!rest) b.fan([[x, y0, -hw], [x, y0, hw], [x, y3, hw], [x, yr, zr], [x, yr, -zr], [x, y3, -hw]], ink);
      const disc = [], n = rest ? 6 : 12, xd = x + e * 0.12;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; disc.push([xd, 2.55 + 0.65 * Math.sin(a), 0.65 * Math.cos(a)]); }
      b.fan(disc, lamp);
      if (rest) continue;
      for (const sg of [-1, 1]) {   // a buffer: two sides, a top and its outer face
        const xa = Math.min(x, x + e * 0.7), xb = Math.max(x, x + e * 0.7), za = sg * 1.05 - 0.36, zb = sg * 1.05 + 0.36;
        b.quad([xa, 0.7, za], [xb, 0.7, za], [xb, 1.4, za], [xa, 1.4, za], ink); b.quad([xa, 0.7, zb], [xb, 0.7, zb], [xb, 1.4, zb], [xa, 1.4, zb], ink);
        b.quad([xa, 1.4, za], [xb, 1.4, za], [xb, 1.4, zb], [xa, 1.4, zb], roof); b.quad([x + e * 0.7, 0.7, za], [x + e * 0.7, 0.7, zb], [x + e * 0.7, 1.4, zb], [x + e * 0.7, 1.4, za], roof);
      }
    }
    if (!rest) {
      // THE ROOF'S RELIEF, each piece 0.04 m and more proud of what carries it: eight ribs of the dark ink across
      // both slopes and the top; between them a raised middle in the roof's lighter tone with dark cheeks; on it
      // the short funnel on a collar, the dome, and two hatches; a dark gutter strip along either eave.
      const top = roof.clone().lerp(ink, 0.3), lift = 0.05, ym = yr + 0.2;
      for (let i = 0; i < 8; i++) {
        const x0 = -8.75 + i * 2.5 - 0.16, x1 = x0 + 0.32;
        b.quad([x0, yr + lift, -zr], [x1, yr + lift, -zr], [x1, yr + lift, zr], [x0, yr + lift, zr], ink);
        for (const sg of [-1, 1]) b.quad([x0, y3 + lift, sg * (hw + 0.04)], [x1, y3 + lift, sg * (hw + 0.04)], [x1, yr + lift, sg * zr], [x0, yr + lift, sg * zr], ink);
      }
      for (const [xa, xb] of [[-8.4, -6.5], [-5.9, -4.0], [-3.4, -1.5], [-0.9, 1.0], [1.6, 3.5], [4.1, 6.0], [6.6, 8.4]]) {
        b.box(xa, yr, -0.55, xb, ym, 0.55, ink, roof, ink, true);
      }
      for (const sg of [-1, 1]) b.quad([-xe, y3 + 0.02, sg * (hw + 0.06)], [xe, y3 + 0.02, sg * (hw + 0.06)], [xe, y3 + 0.3, sg * (hw - 0.3)], [-xe, y3 + 0.3, sg * (hw - 0.3)], ink);
      b.quad([4.55, ym + 0.07, -0.62], [5.55, ym + 0.07, -0.62], [5.55, ym + 0.07, 0.62], [4.55, ym + 0.07, 0.62], top);   // the funnel's collar, a flat plate
      b.box(4.7, ym + 0.07, -0.42, 5.4, CAR.H, 0.42, ink, ink, ink);      // the short funnel
      b.box(-3.25, ym, -0.5, -1.65, CAR.H - 0.12, 0.5, top, top, top);    // the dome
      for (const xh of [-7.45, 2.55]) b.quad([xh - 0.5, ym + lift, -0.36], [xh + 0.5, ym + lift, -0.36], [xh + 0.5, ym + lift, 0.36], [xh - 0.5, ym + lift, 0.36], top);
    }
    return b.geometry();
  };

  // A PENNANT: plain, two-tailed, 7 m by 3 m, its hoist at x 0, flying along +x in the plane z 0 (pennantMat
  // ripples it). A PUFF of the plume: a flat scalloped shape in the same plane. A BEACON'S DISC: a flat
  // disc facing along x.
  style.pennantGeometry = () => {
    const b = makeBatch(), top = (x) => 1.5 - 0.055 * x, cut = (x) => Math.max(0, (x - 4.4) / 2.6) * 0.8;
    for (let i = 0; i < 7; i++) {
      const a = i, c = i + 1;
      b.quad([a, cut(a), 0], [c, cut(c), 0], [c, top(c), 0], [a, top(a), 0], pal.red);
      b.quad([a, -cut(a), 0], [c, -cut(c), 0], [c, -top(c), 0], [a, -top(a), 0], pal.red);
    }
    return b.geometry();
  };
  style.puffGeometry = () => makeBatch().fan(PUFF_CUT.map(([x, y]) => [x, y, 0]), pal.puff).geometry();
  style.discGeometry = (radius = 1.1) => {
    const pts = [], n = 10;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([0, radius * Math.sin(a), radius * Math.cos(a)]); }
    return makeBatch().fan(pts, pal.beacon).geometry();
  };
  // A BIRD is one flat cut of the dark ink, 3.2 m from tip to tip, with a strip of the plume's pale ink along each
  // arm of wing (the bird's second ink, as a cloud has its underside); it flies along its local x. There are two
  // cuts. LEVEL (the default), for flocks that are passed under: the cut lies level, a body with a forked tail
  // and two swept arms of wing along z, the pale strip along the trailing edge. UPRIGHT, for flocks that are
  // followed from behind: the cut stands square to the flight (in the plane x 0), a body and two arms of wing,
  // the pale strip along the lower edge. The attribute `wing` is 0 at the body, 0.45 at a wing's elbow and 1 at
  // its tip; birdMat lifts and drops the wing by it.
  style.birdGeometry = (upright = false) => {
    const b = makeBatch(), ink = pal.ink, pale = pal.puff, wing = [];
    // a point of the cut: (a, c) are its two flat coordinates, c along the wings; w is its share of the beat
    const P = upright ? (a, c, w) => { wing.push(w); return [0, a, c]; } : (a, c, w) => { wing.push(w); return [a, 0, c]; };
    if (upright) {
      b.fan([P(-0.55, 0, 0), P(-0.16, 0.3, 0), P(0.26, 0.3, 0), P(0.5, 0, 0), P(0.26, -0.3, 0), P(-0.16, -0.3, 0)], ink);
      for (const sg of [-1, 1]) {
        b.quad(P(-0.02, sg * 0.2, 0), P(0.22, sg * 0.85, 0.45), P(0.9, sg * 0.9, 0.45), P(0.5, sg * 0.2, 0), ink);
        b.tri(P(0.22, sg * 0.85, 0.45), P(0.1, sg * 1.6, 1), P(0.9, sg * 0.9, 0.45), ink);
        b.quad(P(-0.3, sg * 0.2, 0), P(-0.02, sg * 0.83, 0.45), P(0.22, sg * 0.85, 0.45), P(-0.02, sg * 0.2, 0), pale);
        b.tri(P(-0.02, sg * 0.83, 0.45), P(0.1, sg * 1.6, 1), P(0.22, sg * 0.85, 0.45), pale);
      }
    } else {
      b.fan([P(0.85, 0, 0), P(0.4, 0.24, 0), P(-0.4, 0.2, 0), P(-1.05, 0.5, 0), P(-0.85, 0, 0), P(-1.05, -0.5, 0), P(-0.4, -0.2, 0), P(0.4, -0.24, 0)], ink);
      for (const sg of [-1, 1]) {
        b.quad(P(0.4, sg * 0.24, 0), P(0.68, sg * 0.85, 0.45), P(0.1, sg * 0.85, 0.45), P(-0.18, sg * 0.21, 0), ink);
        b.tri(P(0.68, sg * 0.85, 0.45), P(-0.4, sg * 1.6, 1), P(0.1, sg * 0.85, 0.45), ink);
        b.quad(P(-0.18, sg * 0.21, 0), P(0.1, sg * 0.85, 0.45), P(-0.14, sg * 0.85, 0.45), P(-0.4, sg * 0.2, 0), pale);
        b.tri(P(0.1, sg * 0.85, 0.45), P(-0.4, sg * 1.6, 1), P(-0.14, sg * 0.85, 0.45), pale);
      }
    }
    const g = b.geometry();
    g.setAttribute('wing', new THREE.BufferAttribute(new Float32Array(wing), 1));
    return g;
  };

  // EVERYTHING ON LINES k0 TO k0 + n - 1 THAT THE CLOCK MOVES: the cars, the warm patch each lays on the
  // cut edge under itself, the headlamp's patch ahead of it (LAMP), its steam (STEAM), its piece under the
  // station's roof, the beacons' discs and the pennants. pose(time) sets them all from
  // the time alone: the car of line k from carAt(timeOfCar(k, time)); a thing that is not there is scaled to
  // nothing. Everything is made here; pose() writes matrices and positions only. o.zShift is added to z.
  style.makeLines = (k0, n, o = {}) => {
    const zShift = o.zShift ?? 0, group = new THREE.Group(), PUFFS = STEAM.puffs;
    const inst = (geo, mat, count) => { const m = new THREE.InstancedMesh(geo, mat, count); m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); return m; };
    const cars = inst(style.carGeometry(false), style.paper, n);
    const puffs = inst(style.puffGeometry(), style.paper, n * PUFFS);
    const cp = style.crestPlaces(), discs = inst(style.discGeometry(cp.discR), style.paper, n * 2);
    const pgeo = style.pennantGeometry(), phase = new Float32Array(n), pennants = inst(pgeo, style.pennantMat, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      phase[i] = rng.range(0, 6.283);
      pennants.setMatrixAt(i, m4.makeTranslation(cp.hoist[0], cp.hoist[1], lineZ(k0 + i) + zShift + cp.hoist[2]));
    }
    pgeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    // the patches: to each line a strip of 4 spans along 24 m of the edge under the car, over the top of the
    // paper (0.08 m up) and 1.5 m down either face (leaning out to 0.25 m proud at its lower edge)
    const ST = 5, ppos = new Float32Array(n * ST * 4 * 3), pink = new Float32Array(n * ST * 4 * 3), pidx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < ST; j++) for (let c = 0; c < 4; c++) {
      const v = (i * ST + j) * 4 + c; pink[v * 3] = pal.patch.r; pink[v * 3 + 1] = pal.patch.g; pink[v * 3 + 2] = pal.patch.b;
      if (j < ST - 1 && c < 3) pidx.push(v, v + 4, v + 5, v, v + 5, v + 1);
    }
    const patchGeo = new THREE.BufferGeometry(), patchPos = new THREE.BufferAttribute(ppos, 3); patchPos.setUsage(THREE.DynamicDrawUsage);
    patchGeo.setAttribute('position', patchPos); patchGeo.setAttribute('ink', new THREE.BufferAttribute(pink, 3)); patchGeo.setIndex(pidx);
    const patches = new THREE.Mesh(patchGeo, style.paper); patches.frustumCulled = false; group.add(patches);
    const PZ = [-0.85, -0.61, 0.61, 0.85], PY = [-1.5, 0.08, 0.08, -1.5], c = {}, pf = {};
    // the headlamps' patches (LAMP): to each line a strip of LAMP.spans lengths ahead of the car, the same section
    // as the patch under it, its skirt tapering and its last corners drawn together to a point on the edge
    const LS = LAMP.spans + 1, lpos = new Float32Array(n * LS * 4 * 3), link = new Float32Array(n * LS * 4 * 3), lidx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < LS; j++) for (let e = 0; e < 4; e++) {
      const v = (i * LS + j) * 4 + e; link[v * 3] = pal.lamp.r; link[v * 3 + 1] = pal.lamp.g; link[v * 3 + 2] = pal.lamp.b;
      if (j < LS - 1 && e < 3) lidx.push(v, v + 4, v + 5, v, v + 5, v + 1);
    }
    const lampGeo = new THREE.BufferGeometry(), lampPos = new THREE.BufferAttribute(lpos, 3); lampPos.setUsage(THREE.DynamicDrawUsage);
    lampGeo.setAttribute('position', lampPos); lampGeo.setAttribute('ink', new THREE.BufferAttribute(link, 3)); lampGeo.setIndex(lidx);
    const lamps = new THREE.Mesh(lampGeo, style.paper); lamps.frustumCulled = false; group.add(lamps);
    const hT = THICK / 2 + 0.01;
    // THE CAR UNDER THE ROOF: while any length of a car stands under its station's span, that length shows on the
    // lantern's strip as a flat piece of a darker warm ink (the foot's ink taken half way to the dark ink), UNDER.half
    // m to either side of the line and UNDER.up m over the strip: nothing is seen through; the piece is the car's
    // own length, clipped to the span, set out on the span's own three lengths.
    const UNDER = { half: 0.52, up: 0.04 }, SN = 4, upos = new Float32Array(n * SN * 2 * 3), uink = new Float32Array(n * SN * 2 * 3), uidx = [], under = pal.foot.clone().lerp(pal.ink, 0.5);
    const spanTop = new Float32Array(n), spanX1 = new Float32Array(n), spanXa = SHED.x - SHED.halfL;
    for (let i = 0; i < n; i++) {
      spanX1[i] = shedMouthX(k0 + i); spanTop[i] = STATION.ridge + STATION.lanternUp + ((k0 + i) % STATION.grandEvery === STATION.grandAt ? STATION.grandUp : 0);
      for (let j = 0; j < SN; j++) for (let e = 0; e < 2; e++) { const v = (i * SN + j) * 2 + e; uink[v * 3] = under.r; uink[v * 3 + 1] = under.g; uink[v * 3 + 2] = under.b;
        if (j < SN - 1 && e === 0) uidx.push(v, v + 2, v + 3, v, v + 3, v + 1); }
    }
    const underGeo = new THREE.BufferGeometry(), underPos = new THREE.BufferAttribute(upos, 3); underPos.setUsage(THREE.DynamicDrawUsage);
    underGeo.setAttribute('position', underPos); underGeo.setAttribute('ink', new THREE.BufferAttribute(uink, 3)); underGeo.setIndex(uidx);
    const unders = new THREE.Mesh(underGeo, style.paper); unders.frustumCulled = false; group.add(unders);
    const put = (arr, o16, a, b_, d, e, sz, x, y, z) => { arr[o16] = a; arr[o16 + 1] = b_; arr[o16 + 2] = 0; arr[o16 + 3] = 0; arr[o16 + 4] = d; arr[o16 + 5] = e; arr[o16 + 6] = 0; arr[o16 + 7] = 0;
      arr[o16 + 8] = 0; arr[o16 + 9] = 0; arr[o16 + 10] = sz; arr[o16 + 11] = 0; arr[o16 + 12] = x; arr[o16 + 13] = y; arr[o16 + 14] = z; arr[o16 + 15] = 1; };
    const pose = (time) => {
      const ca = cars.instanceMatrix.array, pa = puffs.instanceMatrix.array, da = discs.instanceMatrix.array;
      for (let i = 0; i < n; i++) {
        const k = k0 + i, z = lineZ(k) + zShift, tr = timeOfCar(k, time); carAt(tr, c);
        const p = c.slope, q = Math.sqrt(1 + p * p), cs = 1 / q, sn = p / q;
        if (c.inSight) put(ca, i * 16, cs, sn, -sn, cs, 1, c.x, c.y, z); else put(ca, i * 16, 0, 0, 0, 0, 0, HALL.x1 - 6, 2, z);
        for (let j = 0; j < ST; j++) {
          const x = c.inSight ? Math.max(X_RIM, c.x + (j - 2) * 6 * cs) : HALL.x1 - 6, y = c.inSight ? curveY(x) : 0.1;
          for (let e = 0; e < 4; e++) { const o3 = ((i * ST + j) * 4 + e) * 3; ppos[o3] = x; ppos[o3 + 1] = y + (c.inSight ? PY[e] : 0); ppos[o3 + 2] = z + (c.inSight ? PZ[e] : 0); }
        }
        // the car under the roof: the span's four nodes, each drawn in to the car's own length
        const u0 = Math.max(spanXa, c.x - CAR.L / 2 * cs), u1 = c.inSight ? Math.min(spanX1[i], c.x + CAR.L / 2 * cs) : -1e9, seg = (spanX1[i] - spanXa) / (SN - 1);
        for (let j = 0; j < SN; j++) {
          const xu = u1 > u0 ? Math.min(u1, Math.max(u0, spanXa + seg * j)) : spanXa, jn = Math.min(SN - 2, Math.max(0, Math.floor((xu - spanXa) / seg)));
          const ya = curveY(spanXa + seg * jn), yb = curveY(spanXa + seg * (jn + 1)), yu = ya + (yb - ya) * (xu - spanXa - seg * jn) / seg + spanTop[i] + UNDER.up;
          for (let e = 0; e < 2; e++) { const o3 = ((i * SN + j) * 2 + e) * 3; upos[o3] = xu; upos[o3 + 1] = yu; upos[o3 + 2] = z + (u1 > u0 ? (e ? UNDER.half : -UNDER.half) : 0); }
        }
        // the headlamp's patch ahead of the car, station by station along the track from its leading end
        const reach = lampReach(c), dirL = reach > 0 ? 1 : -1, stepL = Math.abs(reach) / LAMP.spans;
        let lx = c.inSight ? c.x + dirL * CAR.L / 2 * cs : HALL.x1 - 6;
        for (let j = 0; j < LS; j++) {
          const xl = Math.min(HALL.x0 + 0.3, Math.max(X_RIM, lx)), yl = c.inSight ? edgeY(xl) : 0.1, f = j / LAMP.spans;
          const sk = reach !== 0 ? LAMP.skirt[0] + (LAMP.skirt[1] - LAMP.skirt[0]) * f : 0, tip = j === LS - 1 || reach === 0;
          for (let e = 0; e < 4; e++) { const o3 = ((i * LS + j) * 4 + e) * 3, outer = e === 0 || e === 3, sgz = e < 2 ? -1 : 1;
            lpos[o3] = xl; lpos[o3 + 1] = yl + (tip ? LAMP.up : outer ? -sk : LAMP.up); lpos[o3 + 2] = z + (tip ? 0 : sgz * (outer ? hT + LAMP.proud : hT)); }
          const pl = curveDy(xl); lx += dirL * stepL / Math.sqrt(1 + pl * pl);
        }
        // the steam (STEAM): each puff where steamPuff sets it, turned to the slope there
        for (let j = 0; j < PUFFS; j++) {
          steamPuff(c, time, k, j, pf);
          put(pa, (i * PUFFS + j) * 16, pf.cs * pf.size, pf.sn * pf.size, -pf.sn * pf.size, pf.cs * pf.size, pf.size > 0 ? 1 : 0, pf.x, pf.y, z);
        }
        const lit = tr >= BEACON.litAt && tr < BEACON.litAt + BEACON.stays ? 1 : 0;
        put(da, i * 32, lit, 0, 0, lit, lit, cp.disc[0] - cp.discOff, cp.disc[1], z + cp.disc[2]);
        put(da, i * 32 + 16, lit, 0, 0, lit, lit, cp.disc[0] + cp.discOff, cp.disc[1], z + cp.disc[2]);
      }
      cars.instanceMatrix.needsUpdate = true; puffs.instanceMatrix.needsUpdate = true; discs.instanceMatrix.needsUpdate = true; patchPos.needsUpdate = true; lampPos.needsUpdate = true; underPos.needsUpdate = true;
    };
    pose(0);
    return { group, cars, puffs, discs, pennants, patches, lamps, unders, pose };
  };

  // THE HEAVY CAR AT REST, for the rows by the last stretch, which are passed close: the car of the lines in the
  // same frame and inks, not moving: sides with the sixteen lit windows (each 0.1 m proud of its band), the
  // housing and bogie plates hanging beside the sheet, the roof with its raised middle, eight ribs down either
  // slope, the short funnel and the dome, a lamp disc and two buffers at each end.
  style.restCarGeometry = () => {
    const b = makeBatch(), { ink, roof, window: win, lamp } = pal, hw = CAR.W / 2, xe = 9.3, side = ink.clone().lerp(roof, 0.25), top = roof.clone().lerp(ink, 0.3);
    const y0 = 0.25, y1 = 2.05, y2 = 3.05, y3 = 3.9, yr = 4.45, zr = 1.0, ym = yr + 0.2;
    for (const sg of [-1, 1]) {
      const z = sg * hw, zw = sg * (hw + 0.1);
      b.quad([-xe, y0, z], [xe, y0, z], [xe, y3, z], [-xe, y3, z], side);
      b.quad([-xe, y3, z], [xe, y3, z], [xe, yr, sg * zr], [-xe, yr, sg * zr], roof);
      for (let i = 0; i < 16; i++) { const w0 = -8.8 + i * 1.1 + 0.19, w1 = w0 + 0.72; b.quad([w0, y1, zw], [w1, y1, zw], [w1, y2, zw], [w0, y2, zw], win); }
      b.quad([-2.6, y0, z], [2.6, y0, z], [1.9, -1.55, z], [-1.9, -1.55, z], ink);
      for (const e of [-1, 1]) b.quad([e * 4.4, y0, z], [e * 8.4, y0, z], [e * 7.9, -0.85, z], [e * 4.9, -0.85, z], ink);
      for (let i = 0; i < 8; i++) { const x0 = -8.75 + i * 2.5 - 0.16, x1 = x0 + 0.32;
        b.quad([x0, y3 + 0.05, sg * (hw + 0.04)], [x1, y3 + 0.05, sg * (hw + 0.04)], [x1, yr + 0.05, sg * zr], [x0, yr + 0.05, sg * zr], ink); }
    }
    b.quad([-xe, yr, -zr], [xe, yr, -zr], [xe, yr, zr], [-xe, yr, zr], top);
    b.box(-8.4, yr, -0.55, 8.4, ym, 0.55, ink, roof, ink);
    b.box(4.7, ym, -0.42, 5.4, CAR.H, 0.42, ink, ink, ink);
    b.box(-3.25, ym, -0.5, -1.65, CAR.H - 0.12, 0.5, top, top, top);
    for (const e of [-1, 1]) {
      const x = e * xe, disc = [], xd = x + e * 0.12;
      b.fan([[x, y0, -hw], [x, y0, hw], [x, y3, hw], [x, yr, zr], [x, yr, -zr], [x, y3, -hw]], ink);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; disc.push([xd, 2.55 + 0.65 * Math.sin(a), 0.65 * Math.cos(a)]); }
      b.fan(disc, lamp);
      for (const sg of [-1, 1]) { const xa = Math.min(x, x + e * 0.7), xb = Math.max(x, x + e * 0.7), za = sg * 1.05 - 0.36, zb = sg * 1.05 + 0.36;
        b.quad([xa, 0.7, za], [xb, 0.7, za], [xb, 1.4, za], [xa, 1.4, za], ink); b.quad([xa, 0.7, zb], [xb, 0.7, zb], [xb, 1.4, zb], [xa, 1.4, zb], ink);
        b.quad([xa, 1.4, za], [xb, 1.4, za], [xb, 1.4, zb], [xa, 1.4, zb], roof); b.quad([x + e * 0.7, 0.7, za], [x + e * 0.7, 0.7, zb], [x + e * 0.7, 1.4, zb], [x + e * 0.7, 1.4, za], roof); }
    }
    return b.geometry();
  };

  // THE CARS THAT GOT OVER on lines k0 to k0 + n - 1: at rest nose to tail on the lines' own edges beyond the
  // far hall, between 5 and 17 to a line by the line's number alone (restCount). Where a line's row begins between
  // REST.x0 and the plain's end is by the line's number too (restStart): two slow swells from line to line, so that
  // the rows lie over the whole plain to REST.x1 in drifts. BY THE LAST STRETCH (lines REST.near.lines) every row
  // begins at REST.x0 and holds REST.near.least cars or more. THE WAY OUT'S GROUND IS BARE: on lines REST.bare.lines
  // a place of the row where any part of a car would lie between REST.bare.x[0] and REST.bare.x[1] is left empty
  // (the row goes on beyond it). restRow(k) gives the places (x of each car's near end).
  // TWO CUTS, by place: the first REST.near.least places of a row by the last stretch (from the hall to x
  // 468.8, where the rows are passed close) hold the heavy car at rest (restCarGeometry); every other car at
  // rest is the plain cut (carGeometry(true)).
  style.restCount = (k) => 5 + Math.floor(12.99 * (0.5 * (0.5 + 0.5 * Math.sin(k * 0.23 + 1.1)) + 0.5 * own01(k, 0.5)));
  style.restStart = (k) => REST.x0 + Math.max(0, REST.x1 - REST.x0 - style.restCount(k) * REST.pitch) * (0.5 + 0.32 * Math.sin(k * 2 * Math.PI / 21) + 0.18 * Math.sin(k * 0.113 + 2.0));
  style.restRow = (k) => {
    const near = k >= REST.near.lines[0] && k <= REST.near.lines[1], bare = k >= REST.bare.lines[0] && k <= REST.bare.lines[1];
    const want = near ? Math.max(REST.near.least, style.restCount(k)) : style.restCount(k), x0 = near ? REST.x0 : style.restStart(k), row = [];
    for (let j = 0; row.length < want && x0 + j * REST.pitch + CAR.L <= REST.x1; j++) {
      const x = x0 + j * REST.pitch;
      if (bare && x + CAR.L > REST.bare.x[0] && x < REST.bare.x[1]) continue;
      row.push({ x, heavy: near && j < REST.near.least });
    }
    return row;
  };
  style.restCars = (k0, n, o = {}) => {
    const rows = []; let plain = 0, heavy = 0;
    for (let i = 0; i < n; i++) { const row = style.restRow(k0 + i); rows.push(row); for (const c of row) if (c.heavy) heavy++; else plain++; }
    const group = new THREE.Group(), m4 = new THREE.Matrix4();
    const meshes = [new THREE.InstancedMesh(style.carGeometry(true), style.paper, Math.max(1, plain)), new THREE.InstancedMesh(style.restCarGeometry(), style.paper, Math.max(1, heavy))], at = [0, 0];
    for (let i = 0; i < n; i++) for (const c of rows[i]) { const w = c.heavy ? 1 : 0;
      meshes[w].setMatrixAt(at[w]++, m4.makeTranslation(c.x + CAR.L / 2, 0, lineZ(k0 + i) + (o.zShift ?? 0))); }
    meshes[0].count = plain; meshes[1].count = heavy;
    for (const m of meshes) { m.frustumCulled = false; group.add(m); }
    group.userData = { plain, heavy };
    return group;
  };
}

// ---------------------------------------------------------------------------------------------------------
// THE HERO: a stretch of the valley, the far ridge with its cars.
export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts);
  const lines = Math.max(2, Math.round(opts.lines ?? 24)), k0 = opts.k0 ?? 83;
  const zShift = -(k0 + (lines - 1) / 2) * D, half = lines * D / 2;
  const object = new THREE.Group();
  await prepareRun(() => ctx.yield());
  const runCheck = checkRun();
  await ctx.yield();
  for (let k = k0; k < k0 + lines; k += 12) {   // the sheets, twelve to a mesh
    object.add(new THREE.Mesh(await style.buildSheets(k, Math.min(k + 12, k0 + lines), { zShift, xMax: opts.xMax ?? 700 }), style.paper));
    await ctx.yield();
  }
  await ctx.yield();
  const plumes = opts.hall !== false ? style.hallPlumes(-half, half) : null;   // the far hall's piece and its vents' plumes
  if (plumes) { object.add(new THREE.Mesh(style.hallGeometry(-half, half), style.paper)); object.add(plumes.mesh); }
  if (opts.table !== false) object.add(new THREE.Mesh(style.tableGeometry(X_STEPS - 400, (opts.xMax ?? 700) + 400, -half - 400, half + 400), style.paper));
  await ctx.yield();
  const moving = style.makeLines(k0, lines, { zShift });
  object.add(moving.group);
  await ctx.yield();
  if (opts.rest !== false) object.add(style.restCars(k0, lines, { zShift }));
  if (opts.sky) { await ctx.yield(); const sky = new THREE.Mesh(style.skyGeometry({ center: [0, 0, 0], radius: opts.sky === true ? 2800 : opts.sky }), style.paper); sky.frustumCulled = false; object.add(sky); }
  // the way out faces back along the route's last stretch (toward the route's last point but one)
  const V = (x, y, z) => new THREE.Vector3(x, y, z), zr = -WAY_OUT.crestCrossedAtZ, before = ROUTE_POINTS[ROUTE_POINTS.length - 2];
  const anchors = {
    crest: V(X_CREST, 2 * A, 0), bottom: V(X_BOTTOM, 0, 0), rimEnd: V(X_RIM, curveY(X_RIM), 0), farFoot: V(X_FAR_FOOT, 0, 0),
    viewpoints: {
      fromFoot: { eye: V(-72, 15, -half * 0.8), look: V(X_CREST, 80, half * 0.6) },
      fromRim: { eye: V(-165, 90, -half - 30), look: V(30, 35, half * 0.5) },
      beside: { eye: V(-10, 66, -half * 0.3), look: V(X_CREST, 98, half * 0.3) },
    },
    flyThrough: ROUTE_POINTS.map((p) => V(p[0], p[1], p[2] + zr)),
    portalSeat: { position: V(WAY_OUT.place[0], WAY_OUT.place[1], WAY_OUT.place[2] + zr), facing: V(before[0] - WAY_OUT.place[0], before[1] - WAY_OUT.place[1], before[2] - WAY_OUT.place[2]).normalize(), radius: WAY_OUT.radius },
  };
  return {
    object, radius: 130, height: 124, center: V(10, 45, 0), anchors, style, moving,
    info: { runCheck, lines, k0, edition: style.edition },
    update(dt, time) { style.update(dt, time); moving.pose(time); if (plumes) plumes.pose(time); },
    dispose() {},
    ground: false, groundY: TABLE_Y,
  };
}
