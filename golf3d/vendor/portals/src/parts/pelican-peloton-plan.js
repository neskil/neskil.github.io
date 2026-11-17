// pelican-peloton: THE PLAN. Pure numbers and functions, no import at all: the same in the page and in plain node.
// Every number of the design that two files need lives here once (design/ab/pelican-peloton.design.json; the build
// plan's section 2.1). Places are in metres of the world or of the road's own measure: station s along the centre
// line, side n (port positive), height h over the road. Nothing here reads a clock, a lens, a seed or a picture;
// a dealer takes its stream as an argument. Changes against the design's figures: design/ab/pelican-peloton.plan-changes.md.
// Hour 0, the freeze: every count of tools/ab/pp-count.mjs holds on seeds 1 to 60 against the kit's real path. From here
// the numbers above the dealers do not move without the lead's word; the sea part's later dealers and mirrors (the
// gliders' seven lines, the kept divers, the clear cloud lanes, the bank as built) live in pelican-peloton-plan-sea.js.
// THE SECOND FREEZE (the lead's rulings after P1 and on the way out; every change is written out, old and new and why,
// in the plan-changes paper under SECOND FREEZE): the true box heights; the drifter's bird rises before it goes to port;
// the race's sprint begins on the point, so the last stretch is not empty; the way out is first drawn with 204 m left;
// the land ends in a rounded headland; the ribbon ends at the opening's plane. FROZEN TWICE
// (At the gate four comments were re-worded and ONE number changed, SEA.STEP 40 to 16: how often the sea birds' deal hands
// back in the page, which deals no die and moves no place: plan-changes items 40 and 41.)

export const PP = {
  K0: 0.6, K1: 0.76, D_K0: 540, D_K1: 600,          // the race's share of our speed, and the metres flown between which it rises (THE SPRINT)
  TURN_D: [860, 875, 905, 920],                      // the leader turns its head to us: in between the first two (metres flown), held, back between the last two (it is 21 to 8 m ahead)
  SURGE: 0.6, SURGE_LEN: 12, WEAVE: 0.35, WEAVE_LEN: 20,   // m: a rider's come and go along the road; the lane's sway by station
  SCALE: 2.5, LEADER: 3.25,                          // riders' size over life
  LANES: [1.0, 4.2, 7.4, 10.6], STAR_N: -7.8,        // n of lanes 1..4 (port of the centre line) and of the starboard file
  LENS_N: -3.4, LENS_H: 3.0,                         // the lens's lane and height over the road
  ROAD_N0: -9.8, ROAD_N1: 13.5,                      // the road's edges to s 790
  TAPER_S0: 790, TAPER_S1: 870, RIB_N0: -7.0, RIB_N1: 7.0,   // the ribbon narrows evenly between these stations to these edges
  CLIFF_N: 17, SEA_Y: 0,
  ROAD_Y0: 30, FALL: 0.05, S_FALL: [0, 40, 440, 480], ROAD_Y1: 8,    // level to s 0; slope eased to -FALL over s 0..40; held to 440; eased level by 480
  S_BRINK: 670, S_GRADE: 710, GRADE_DEG: 8,          // from the brink the slope is eased up to tan(8 deg) by s 710 and held
  S_BACK: -340, S_END: 1000, S_LEAVE: 290, S_MEET: 520, S_OUT: 1000,   // the ribbon ends AT the opening's plane (S_END = S_OUT)
  SUN_R: 7.5, SUN_EL: 8, HALO_R: 11,                 // degrees; no rays
  PORTAL_R: 24, DRAW_WITHIN: 204, DRAW_IN: 8, REVEAL: 70,
  LINE_RIDER: 0.065, LINE_SHARE: 0.015, LINE_MAX: 0.8, LINE_PT: [2.2, 4.0], INK_FULL: 0.2, INK_NONE: 0.08,   // the one line
  KNOT_S0: -16, KNOT_STEP: 16.5, KNOTS: 64,          // the road as the pack's shader reads it (s -16 to 1023.5)
  BEAM_PERIOD: 13,
};

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// THE ROAD'S TABLE: from s -340, [length, curvature], left positive. The straight, the long bend (r 400), the bend onto
// the harbour wall (r 75, 52 deg), the wall's curve out round the harbour (r 50, 112 deg, to the right), the far limb,
// the landing (r 40, 60 deg), the point, its last left bend (r 150, 18 deg), the last straight.
// THE FAR LIMB is 8.1 m (the design's scratch model had 7.2): the one number the design says is trimmed until the
// lens's straight over the harbour meets the road again in the open lane (meetMiss 0.03 m on the real table).
export const ARCS = [[480, 0], [160, 1 / 400], [75 * 52 * D2R, 1 / 75], [50 * 112 * D2R, -1 / 50], [8.1, 0],
                     [40 * 60 * D2R, 1 / 40], [70, 0], [150 * 18 * D2R, 1 / 150], [600, 0]];

// ---------- the road ----------
const ROAD_DS = 0.5, ROAD_S1 = 1040;   // the table's step and its last station (the knots reach s 1023.5)
function rawTurn(s) {                  // the table's own heading at station s with no easing: the exact sum of its arcs (radians)
  let a = PP.S_BACK, psi = 0;
  for (let i = 0; i < ARCS.length; i++) { const l = Math.min(ARCS[i][0], s - a); if (l <= 0) break; psi += l * ARCS[i][1]; a += ARCS[i][0]; }
  return psi;
}
// the heading the road is laid with: the curvature is the mean of seven readings 4 m apart (24 m in all), so every bend
// eases in and out; its integral is the mean of the seven headings, in closed form (no error of stepping)
function easedTurn(s) { let p = 0; for (let j = -3; j <= 3; j++) p += rawTurn(s + 4 * j); return p / 7; }

// the closed form of the road's height: [y, slope] at station s
function roadYS(s) {
  const F = PP.FALL, [a0, a1, a2, a3] = PP.S_FALL, g = Math.tan(PP.GRADE_DEG * D2R), b0 = PP.S_BRINK, b1 = PP.S_GRADE;
  if (s <= a0) return [PP.ROAD_Y0, 0];
  const yA = PP.ROAD_Y0 - F * (a1 - a0) / 2;                        // y at the end of the first easing
  if (s <= a1) { const t = s - a0; return [PP.ROAD_Y0 - F * t * t / (2 * (a1 - a0)), -F * t / (a1 - a0)]; }
  if (s <= a2) return [yA - F * (s - a1), -F];
  const yB = yA - F * (a2 - a1);
  if (s <= a3) { const t = s - a2, w = a3 - a2; return [yB - F * (t - t * t / (2 * w)), -F * (1 - t / w)]; }
  const yC = yB - F * (a3 - a2) / 2;                                // = ROAD_Y1 (8) by the PP numbers
  if (s <= b0) return [yC, 0];
  if (s <= b1) { const t = s - b0; return [yC + g * t * t / (2 * (b1 - b0)), g * t / (b1 - b0)]; }
  return [yC + g * (b1 - b0) / 2 + g * (s - b1), g];
}

export function layRoad() {
  const n = Math.round((ROAD_S1 - PP.S_BACK) / ROAD_DS), X = new Float64Array(n + 1), Z = new Float64Array(n + 1), P = new Float64Array(n + 1);
  // integrate from s 0 (at [0, 0], heading 0) both ways; behind it the table is straight, so the back is laid in closed form
  const i0 = Math.round(-PP.S_BACK / ROAD_DS);
  for (let i = 0; i <= i0; i++) { X[i] = 0; Z[i] = PP.S_BACK + i * ROAD_DS; P[i] = 0; }
  // (the easing reaches 12 m back from the first bend at s 140, so the heading is exactly 0 up to s 128)
  for (let i = i0; i < n; i++) {
    const s = PP.S_BACK + i * ROAD_DS, pa = P[i], pm = easedTurn(s + ROAD_DS / 2), pb = easedTurn(s + ROAD_DS);
    P[i + 1] = pb;
    X[i + 1] = X[i] + (Math.sin(pa) + 4 * Math.sin(pm) + Math.sin(pb)) * ROAD_DS / 6;
    Z[i + 1] = Z[i] + (Math.cos(pa) + 4 * Math.cos(pm) + Math.cos(pb)) * ROAD_DS / 6;
  }
  const road = { n, X, Z, P };
  // the centre line at station s: { x, z, psi, tx, tz } (psi in radians, left of +Z positive); straight beyond both ends
  road.at = (s, o = {}) => {
    const f = clamp((s - PP.S_BACK) / ROAD_DS, 0, n), i = Math.min(n - 1, Math.floor(f)), t = f - i;
    let x = lerp(X[i], X[i + 1], t), z = lerp(Z[i], Z[i + 1], t);
    const psi = lerp(P[i], P[i + 1], t), tx = Math.sin(psi), tz = Math.cos(psi);
    const over = s < PP.S_BACK ? s - PP.S_BACK : s > ROAD_S1 ? s - ROAD_S1 : 0;
    if (over) { x += tx * over; z += tz * over; }
    o.x = x; o.z = z; o.psi = psi; o.tx = tx; o.tz = tz; return o;
  };
  road.y = (s) => roadYS(s)[0];
  road.slope = (s) => roadYS(s)[1];
  // the road's two edges at s: full width to TAPER_S0, the ribbon's taper to TAPER_S1, 14 m from there
  road.edges = (s) => { const t = clamp((s - PP.TAPER_S0) / (PP.TAPER_S1 - PP.TAPER_S0), 0, 1); return [lerp(PP.ROAD_N0, PP.RIB_N0, t), lerp(PP.ROAD_N1, PP.RIB_N1, t)]; };
  const _a = {};
  // a place of the road's measure in the world: n to port of the centre line, h over the road's own surface there
  road.point = (s, nn, h, out = [0, 0, 0]) => { road.at(s, _a); out[0] = _a.x + Math.cos(_a.psi) * nn; out[1] = roadYS(s)[0] + h; out[2] = _a.z - Math.sin(_a.psi) * nn; return out; };
  // the nearest station to (x, z) inside [sLo, sHi]: every 8 m, then every 0.5 m about the best, then every 0.05 m; bounded
  // (the tightest bend is 40 m in radius, so the best of the 8 m readings lies within 8 m of the true nearest station)
  road.stationOf = (x, z, sLo = PP.S_BACK, sHi = PP.S_END) => {
    let best = Infinity, bs = sLo;
    const tryS = (s) => { road.at(s, _a); const dx = x - _a.x, dz = z - _a.z, d = dx * dx + dz * dz; if (d < best) { best = d; bs = s; } };
    for (let s = sLo; s <= sHi; s += 8) tryS(s);
    tryS(sHi);
    let c = bs; for (let s = Math.max(sLo, c - 8); s <= Math.min(sHi, c + 8); s += 0.5) tryS(s);
    c = bs; for (let s = Math.max(sLo, c - 0.5); s <= Math.min(sHi, c + 0.5); s += 0.05) tryS(s);
    road.at(bs, _a);
    return { s: bs, n: (x - _a.x) * Math.cos(_a.psi) - (z - _a.z) * Math.sin(_a.psi) };
  };
  // THE KNOTS the pack's shader reads: (x, z, tx, tz) at s = KNOT_S0 + i * KNOT_STEP, as 32-bit floats (what a uniform holds)
  const K = road.knots = new Float32Array(PP.KNOTS * 4);
  for (let i = 0; i < PP.KNOTS; i++) { road.at(PP.KNOT_S0 + i * PP.KNOT_STEP, _a); K[i * 4] = _a.x; K[i * 4 + 1] = _a.z; K[i * 4 + 2] = _a.tx; K[i * 4 + 3] = _a.tz; }
  // THE MIRROR of the shader's own road law: a cubic Hermite of the knots (the place and its own heading from the
  // curve's derivative), n to port, h over the closed-form height. out = [x, y, z]; out.psi is the heading used
  road.hermite = (s, nn, h, out = [0, 0, 0]) => {
    const f = (s - PP.KNOT_S0) / PP.KNOT_STEP, i = clamp(Math.floor(f), 0, PP.KNOTS - 2), t = f - i, L = PP.KNOT_STEP, j = i * 4;
    const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    const d00 = 6 * t2 - 6 * t, d10 = 3 * t2 - 4 * t + 1, d01 = -d00, d11 = 3 * t2 - 2 * t;
    const x = h00 * K[j] + h10 * L * K[j + 2] + h01 * K[j + 4] + h11 * L * K[j + 6];
    const z = h00 * K[j + 1] + h10 * L * K[j + 3] + h01 * K[j + 5] + h11 * L * K[j + 7];
    let dx = d00 * K[j] + d10 * L * K[j + 2] + d01 * K[j + 4] + d11 * L * K[j + 6];
    let dz = d00 * K[j + 1] + d10 * L * K[j + 3] + d01 * K[j + 5] + d11 * L * K[j + 7];
    const dl = Math.max(Math.hypot(dx, dz), 1e-4); dx /= dl; dz /= dl;
    out[0] = x + dz * nn; out[1] = roadYS(s)[0] + h; out[2] = z - dx * nn; out.psi = Math.atan2(dx, dz);
    return out;
  };
  road.sunAzimuth = road.at(900).psi;                               // the last straight's heading: the sun stands on it
  return road;
}

// ---------- the route ----------
// THE RULES of the 30 waypoints. On the road: [station, side]; the height is LENS_H over the road at that station.
// 0..7 the cliff road in the open lane to THE LEAVING POINT (S_LEAVE); 12..18 the point from THE MEETING POINT
// (S_MEET); 19..25 the swing out beside the road in the air and back; 25..29 the last straight in the open lane.
const WP_ROAD_A = [[0], [50], [100], [140], [180], [220], [260], [PP.S_LEAVE]];
const WP_ROAD_B = [[PP.S_MEET], [545], [570], [590], [610], [630], [650],
                   [675, -5.6], [700, -10.4], [725, -13.0], [750, -11.6], [775, -7.2], [800, -4.1], [820],
                   [860], [910], [955], [PP.S_OUT]];
// 8..11: over the harbour, [metres along the straight from the leaving point, y]: down from the road's height + 3.0 at the
// leaving point to 3.2 m over the level of the wall's deck (y 8), and held there
const WP_CHORD = [[40, 17.4], [80, 14.0], [120, 11.8], [160, 11.2]];

// the straight the lens holds from the leaving point: its start (the lens's place there) and the road's own heading there
export function chord(road) {
  const a = road.at(PP.S_LEAVE), p = road.point(PP.S_LEAVE, PP.LENS_N, PP.LENS_H);
  return { x: p[0], y: p[1], z: p[2], psi: a.psi, tx: a.tx, tz: a.tz };
}
// a place in the harbour's own measure: metres ALONG that straight from the leaving point and ACROSS it (port positive)
export function chordPoint(road, along, across) {
  const c = chord(road);
  return [c.x + c.tx * along + c.tz * across, c.z + c.tz * along - c.tx * across];
}
export function routePoints(road) {
  const pts = [];
  for (const w of WP_ROAD_A) pts.push(road.point(w[0], w[1] ?? PP.LENS_N, PP.LENS_H));
  for (const w of WP_CHORD) { const q = chordPoint(road, w[0], 0); pts.push([q[0], w[1], q[1]]); }
  for (const w of WP_ROAD_B) pts.push(road.point(w[0], w[1] ?? PP.LENS_N, PP.LENS_H));
  return pts;
}
// the metres by which the meeting point (S_MEET, LENS_N) lies off that straight (port positive), and how far along it.
// Under 0.3 m, or the far limb's length ARCS[4][0] is trimmed until it is
export function meetMiss(road, full = false) {
  const c = chord(road), m = road.point(PP.S_MEET, PP.LENS_N, PP.LENS_H), dx = m[0] - c.x, dz = m[2] - c.z;
  const across = dx * c.tz - dz * c.tx, along = dx * c.tx + dz * c.tz;
  return full ? { across, along, turn: road.at(PP.S_MEET).psi - c.psi } : Math.abs(across);
}

// THE FLIGHT'S PACE as the design types it, by PLACES: slow beside the race, fast off the cliff and over the first half of
// the harbour, slowing as the far limb comes up. The world's pace(u) is paceOf(u * path.length); the engine scales it to DURATION
export const FLIGHT = { DURATION: 50, PACE0: 0.86, UP: 0.34, UP_D: [290, 350], DOWN: 0.28, DOWN_D: [400, 460] };
export function paceOf(d) { return FLIGHT.PACE0 + FLIGHT.UP * sstep(FLIGHT.UP_D[0], FLIGHT.UP_D[1], d) - FLIGHT.DOWN * sstep(FLIGHT.DOWN_D[0], FLIGHT.DOWN_D[1], d); }

// ---------- the pack law ----------
// F(d): the race's own metres for d metres flown: K0 a metre to D_K0; the share rises evenly (a smoothstep) to K1 by D_K1
// and is K1 from there to the end. ONE function for all riders. The second freeze re-typed its three last numbers
// (K1 0.85 -> 0.76, D_K0 690 -> 540, D_K1 790 -> 600), the form unchanged: the sprint begins on the point and is gentler,
// so the last riders of generation four are passed on the ribbon (the last at d 842) and THE LEADER rides ahead of the
// lens and to port all the way up the last straight (36 m ahead at d 800, 23 m at d 850, 13 m at d 900) and is abeam at
// d 951.5; when the flight ends its box's front is 1.5 m short of the opening's plane (the count proves each figure).
export function packF(d) {
  const w = PP.D_K1 - PP.D_K0, t = clamp((d - PP.D_K0) / w, 0, 1);
  return PP.K0 * d + (PP.K1 - PP.K0) * w * (t * t * t - t * t * t * t / 2) + (PP.K1 - PP.K0) * Math.max(d - PP.D_K1, 0);
}

// THE 96 PLACES OF THE PACK, the same on every seed: { id, band, o, lane, lo, slider, drift }. o is the offset in metres,
// lane 1..4 (0 is the starboard file), lo the light build, slider a rider turned 70 degrees toward starboard, drift one of
// the three lane 1 places the drifter may take. Laid by the design's packLaw, band by band from the back of the race.
export const laneN = (lane) => (lane === 0 ? PP.STAR_N : PP.LANES[lane - 1]);
export const SLOTS = (() => {
  const S = [], add = (band, o, lane, x = {}) => S.push({ id: S.length, band, o, lane, lo: !!x.lo, slider: !!x.slider, drift: !!x.drift });
  // THE HOPELESS, port lanes, 21: eight ranks 8 m apart. Ranks at o 10, 34, 58: one slider in lane 2, lanes 1 and 3 empty
  // beside it, one rider in lane 4 at o + 1.5. The other five: lane 1 at o, lane 2 at o + 1.5, and by turns lane 3 at o
  // (ranks at 18, 50, 66) or lane 4 at o + 1.5 (ranks at 26, 42). The drifter's three places are lane 1 at o 26, 42, 50.
  for (let k = 0; k < 8; k++) {
    const o = 10 + 8 * k;
    if (k % 3 === 0) { add('hopeless', o, 2, { slider: true }); add('hopeless', o + 1.5, 4); continue; }
    add('hopeless', o, 1, { drift: o === 26 || o === 42 || o === 50 });
    add('hopeless', o + 1.5, 2);
    if (o === 26 || o === 42) add('hopeless', o + 1.5, 4); else add('hopeless', o, 3);
  }
  // THE STARBOARD FILE, 4 (hopeless kinds): none at an offset over 62
  for (const o of [14, 30, 46, 62]) add('star', o, 0);
  // THE GUESTS, 6, two and two
  for (const [o, lane] of [[74, 1], [75.5, 3], [82, 2], [83.5, 4], [90, 1], [91.5, 3]]) add('guest', o, lane);
  // GENERATIONS ONE AND TWO, 8 each: two ranks; lane 1 at o, lanes 2 and 3 at o + 1.5, lane 4 at o + 3; lanes 3 and 4 light
  for (const [band, o0] of [['g1', 98], ['g1', 106], ['g2', 114], ['g2', 122]]) {
    add(band, o0, 1); add(band, o0 + 1.5, 2); add(band, o0 + 1.5, 3, { lo: true }); add(band, o0 + 3, 4, { lo: true });
  }
  // THE BULK, 26, lanes 1 and 2: 13 ranks 7.5 m apart from o 130, lane 2 at o + 3.25; the first 12 generation two's kind
  for (let k = 0; k < 13; k++) { const band = k < 6 ? 'bulk2' : 'bulk3', o = 130 + 7.5 * k; add(band, o, 1); add(band, o + 3.25, 2); }
  // GENERATION THREE, 12: six ranks 8 m apart from o 228, lane 2 at o + 4
  for (let k = 0; k < 6; k++) { add('g3', 228 + 8 * k, 1); add('g3', 232 + 8 * k, 2); }
  // GENERATION FOUR, 10: five ranks 9 m apart from o 280, lane 2 at o + 4.5
  for (let k = 0; k < 5; k++) { add('g4', 280 + 9 * k, 1); add('g4', 284.5 + 9 * k, 2); }
  // THE LEADER: lane 2, alone, 25.8 m ahead of the last of generation four. (Its offset was trimmed at the first freeze
  // to bring it abeam at d 897 under the first sprint; under the second freeze's sprint the same offset is abeam at d 951.5)
  add('leader', 346.3, 2);
  return S;
})();

// ---------- kinds and their boxes ----------
// The hopeless kinds by the design's numbers ('h1' .. 'h14'). h1, h8 and h9 are always the three sliders, in that order
// from the back; h7 is the drifter. The design's number 4 is NO KIND: the second reader struck it (line 4 of
// design/ab/pelican-peloton.kinds-ruling.md); it has no name, no box and no model, and the other kinds ride in its places.
// GONE: kinds a count may leave out of a deal (none stands in it).
export const HOPELESS = { h1: 'two circles and a triangle', h2: 'the hoverer', h3: 'pedals in the air',
  h5: 'backwards', h6: 'one side', h7: 'the drifter', h8: 'the five-wheeler', h9: 'square wheels', h10: 'three wings',
  h11: 'the big bird', h12: 'the wheel ahead', h13: 'the blank card', h14: 'sun spokes' };
export const SLIDER_KINDS = ['h1', 'h8', 'h9'];
export const GONE = [];
export const GUESTS = ['flamingo', 'frog', 'turtle', 'ostrich', 'opossum', 'giraffe'];
export const COLOURS = ['red', 'teal', 'yellow'];
// the colours a kind's vehicle may take (the kinds ruling: the big bird never teal; the frog's skates, the turtle's
// penny-farthing and the ostrich's car teal or yellow; the leader's bicycle red)
const COLOURS_OF = { h11: ['red', 'yellow'], frog: ['teal', 'yellow'], turtle: ['teal', 'yellow'], ostrich: ['teal', 'yellow'], leader: ['red'] };
export const coloursOf = (kind) => COLOURS_OF[kind] || COLOURS;

// kindBox(kind) -> [halfAlong, halfAcross, height] in metres at the rider's own size: the kind's WHOLE swept box about its
// place on the road (the origin under the cranks is the box's middle), its glitch or trick included. It is the contract
// the rider's builder models inside, and the box every count uses. Surge and weave are NOT in it (the counts add them).
//   a rider: 4.6 m long and 1.9 m wide, with 0.3 m and 0.25 m to spare          -> 2.6, 1.2
//   a slider: that box turned 70 degrees toward starboard                        -> 2.05 along, 2.9 across
//   h3 and h12 (cranks ahead of the frame; a front wheel ahead of its fork): 5.6 m in all, laid about the box's middle
//   h13 the blank card: 4 m wide and 3 m tall across the lane with its line; it rides LANE 4 only (see dealPack)
//   a guest: at most 4.6 m long and 2.2 m wide, with 0.15 m to spare either side -> 2.6, 1.25
//   the leader: 6.0 m long, at 3.25 times life                                   -> 3.4, 1.5
// HEIGHTS are the true ones (the second freeze): the leader stands on its pedals 7.0 m tall; a generation-four rider
// standing on the climb in a top hat is 5.9 m.
const BOX = {
  h1: [2.05, 2.9, 7.0], h8: [2.05, 2.9, 7.0], h9: [2.05, 2.9, 7.0],
  h2: [2.6, 1.2, 7.0], h3: [2.8, 1.2, 7.0], h5: [2.6, 1.2, 7.0], h6: [2.6, 1.2, 7.0], h7: [2.6, 1.2, 7.0],
  h10: [2.6, 1.2, 7.0], h11: [2.6, 1.2, 7.0], h12: [2.8, 1.2, 7.0], h13: [0.5, 2.1, 3.6], h14: [2.6, 1.2, 7.0],
  flamingo: [2.6, 1.25, 6.6], frog: [2.6, 1.25, 6.6], turtle: [2.6, 1.25, 6.6], ostrich: [2.6, 1.25, 6.6], opossum: [2.6, 1.25, 6.6], giraffe: [2.6, 1.25, 6.6],
  g1: [2.6, 1.2, 5.6], g2: [2.6, 1.2, 5.6], bulk2: [2.6, 1.2, 5.6], bulk3: [2.6, 1.2, 5.6], g3: [2.6, 1.2, 5.6], g4: [2.6, 1.2, 5.9],
  leader: [3.4, 1.5, 7.0],
};
export function kindBox(kind) { return BOX[kind] || BOX.g3; }
// the drifter's bird, risen: the same plan box as its rider, carried up and to port by drifterLift. DRIFT_RISE (the second
// freeze): it rises that many metres STRAIGHT UP before it starts to port, so it never passes close over the rider beside
// it; DRIFT_PORT is re-typed so that it still ends 7 m to port (0.0633 x (155 - 4 / 0.09) = 7.0)
export const DRIFT_UP = 0.09, DRIFT_PORT = 0.0633, DRIFT_RUN = 155, DRIFT_AHEAD = 20, DRIFT_RISE = 4;

// ---------- the deal ----------
// a number of two or more digits made only of 0, 1, 5 and 8 reads as a word: never dealt
export const wordLike = (k) => k >= 10 && /^[0158]+$/.test(String(k));
const WINKS = [16, 25, 148];                          // always among the dealt numbers (bare facts; no name beside any)
const NEVER_NUM = [69];                               // kept off a bib for what it reads as
// n bib numbers of 2..199: none word-like, none twice, the three winks among them; one shuffle, no rejection
export function dealNumbers(rng, n) {
  const pool = [];
  for (let k = 2; k <= 199; k++) if (!wordLike(k) && !WINKS.includes(k) && !NEVER_NUM.includes(k)) pool.push(k);
  rng.shuffle(pool);
  const out = pool.slice(0, Math.max(0, n - WINKS.length)).concat(WINKS.slice(0, Math.min(n, WINKS.length)));
  rng.shuffle(out);
  // the three winks never stand in rising order along the race (the ruling): where the shuffle left them so, the first two change places
  const at = WINKS.map((w) => out.indexOf(w));
  if (at[0] >= 0 && at[1] >= 0 && at[2] >= 0 && at[0] < at[1] && at[1] < at[2]) { out[at[0]] = WINKS[1]; out[at[1]] = WINKS[0]; }
  return out;
}
const DRESS = ['none', 'tophat', 'cap', 'neckerchief', 'helmet'];
const DRESS_TEAL = ['none', 'tophat', 'cap', 'helmet'];   // a red neckerchief never rides a teal bicycle (the ruling)
const ownOf = (id) => { const x = (id + 1) * 0.6180339887; return x - Math.floor(x); };   // a rider's own number: typed by its place, the same on every seed

// dealPack(slots, rngs) -> rows. rngs = { hopeless, guests, dress, livery }: the world's own streams. Every draw is taken
// in a fixed order whatever was drawn before; nothing is tried twice. opts.gone: hopeless kinds that do not ride.
export function dealPack(slots, rngs, opts = {}) {
  const gone = opts.gone || GONE;
  const rows = slots.map((s) => ({ id: s.id, band: s.band, kind: s.band, o: s.o, lane: s.lane, n: laneN(s.lane), lo: s.lo, slider: s.slider, drift: false,
    size: s.band === 'leader' ? PP.LEADER : PP.SCALE, own: ownOf(s.id), livery: 'red', dress: 'none', basket: false, bib: 0, bibSide: false, head: '', box: null }));
  dealHopeless(rows, slots, rngs.hopeless, gone);
  // the six guests over their six places; then which three of generation one's four full builds are the duck, the goose and the stork
  const gk = rngs.guests.shuffle(GUESTS.slice()); let gi = 0;
  const heads = rngs.guests.shuffle(['duck', 'goose', 'stork', '']); let hi = 0;
  for (const r of rows) { if (r.band === 'guest') r.kind = gk[gi++]; if (r.band === 'g1' && !r.lo) r.head = heads[hi++]; }
  dealLivery(rows, rngs.livery);
  dealDress(rows, rngs.dress);
  for (const r of rows) r.box = kindBox(r.kind);
  return rows;
}

// the 25 hopeless places (21 in the port lanes, 4 in the starboard file): three sliders fixed, the drifter to one of its three
// places, the blank card twice and only in lane 4 (it is 4.2 m wide: beside a lane 1, 2 or 3 rider it would stand in that
// rider's box, and in lane 1 it would stand 2 m from the lens), the other kinds shuffled over the rest, each twice and
// three of them three times
function dealHopeless(rows, slots, rng, gone) {
  const hop = rows.filter((r) => r.band === 'hopeless' || r.band === 'star');
  for (const r of hop) r.kind = '';
  hop.filter((r) => r.slider).forEach((r, i) => { r.kind = SLIDER_KINDS[i]; });
  const dp = rng.int(0, 2), dr = hop.filter((r) => slots[r.id].drift);
  if (!gone.includes('h7')) { dr[dp].kind = 'h7'; dr[dp].drift = true; }
  const l4 = rng.shuffle(hop.filter((r) => r.band === 'hopeless' && r.lane === 4 && !r.slider));
  if (!gone.includes('h13')) { l4[0].kind = 'h13'; l4[1].kind = 'h13'; }
  // nine places are shuffled and eight kinds stand in them: the third place is EMPTY (the design's struck number 4) and is
  // dropped after the shuffle, so the die is thrown as often as before and every seed's deal is what it was
  const order = rng.shuffle(['h2', 'h3', '', 'h5', 'h6', 'h10', 'h11', 'h12', 'h14']).filter((k) => k && !gone.includes(k));
  const rest = hop.filter((r) => !r.kind), list = rest.map((_, i) => order[i % order.length]);
  rng.shuffle(list);
  rest.forEach((r, i) => { r.kind = list[i]; });
  // three of them wear a bib with one digit lying on its side
  const cand = rng.shuffle(hop.filter((r) => !r.slider && r.kind !== 'h13' && r.kind !== 'h7'));
  for (let i = 0; i < 3; i++) { const d = rng.int(2, 9); if (cand[i]) { cand[i].bib = d; cand[i].bibSide = true; } }
}
// every bicycle one flat primary. The hopeless: a kind that rides twice or three times rides in another colour each time.
// The bands of pelicans: by rider, and one band in three all of one colour. Then the race numbers of the bibs.
function dealLivery(rows, rng) {
  const seen = {};
  const perm = {}; for (let k = 1; k <= 14; k++) perm['h' + k] = rng.shuffle(COLOURS.slice());
  for (const r of rows) {
    if (r.band !== 'hopeless' && r.band !== 'star') continue;
    const ok = coloursOf(r.kind), pf = perm[r.kind].filter((c) => ok.includes(c)), c = seen[r.kind] || 0;
    r.livery = pf[c % pf.length]; seen[r.kind] = c + 1;
  }
  for (const band of ['guest', 'g1', 'g2', 'bulk2', 'bulk3', 'g3', 'g4']) {
    const one = rng.chance(1 / 3) && band !== 'guest', bc = rng();
    for (const r of rows) { if (r.band !== band) continue; const x = rng(), ok = coloursOf(r.kind); r.livery = ok[Math.min(ok.length - 1, Math.floor((one ? bc : x) * ok.length))]; }
  }
  const bibbed = rows.filter((r) => r.band === 'bulk3' || r.band === 'g3' || r.band === 'g4');
  const nums = dealNumbers(rng, bibbed.length);
  bibbed.forEach((r, i) => { r.bib = nums[i]; });
  for (const r of rows) if (r.band === 'leader') { r.livery = 'red'; r.bib = 1; }
}
// one extra a rider and no more (the ruling): a fish basket on three to five riders of generation four and nothing else on
// them; on the others of generations three and four and of the bulk's last 14 one of none, top hat, cap, neckerchief, helmet
function dealDress(rows, rng) {
  const nb = rng.int(3, 5), g4 = rng.shuffle(rows.filter((r) => r.band === 'g4'));
  for (let i = 0; i < nb; i++) g4[i].basket = true;
  for (const r of rows) {
    if (r.band === 'leader') { r.basket = true; continue; }
    if (r.band !== 'bulk3' && r.band !== 'g3' && r.band !== 'g4') continue;
    const x = rng(), list = r.livery === 'teal' ? DRESS_TEAL : DRESS;
    r.dress = r.basket ? 'none' : list[Math.min(list.length - 1, Math.floor(x * list.length))];
  }
}

// ---------- the pack keeps to itself ----------
// packCheck(rows) -> [] or the pairs whose boxes meet at ANY metre flown. All riders share F(d), so two riders' distance
// along the road is the difference of their offsets, less both surges at their worst (a slider has none). Along: 1.0 m of
// road between the boxes; where they are nearer than that along the road they are abreast and keep 0.5 m across, the
// lanes' own sway counted (two riders r metres apart along the road sway apart by at most 2 WEAVE sin(r / (2 WEAVE_LEN))).
export const PACK_ALONG = 1.0, PACK_ABREAST = 0.5;
export function packGap(a, b) {
  const ba = a.box || kindBox(a.kind), bb = b.box || kindBox(b.kind);
  const surge = (a.slider ? 0 : PP.SURGE) + (b.slider ? 0 : PP.SURGE), dOff = Math.abs(a.o - b.o);
  const along = dOff - ba[0] - bb[0] - surge;
  const reach = Math.min(dOff + surge, ba[0] + bb[0] + PACK_ALONG);          // the furthest apart they can be and still be abreast
  const sway = 2 * PP.WEAVE * Math.sin(Math.min(reach / (2 * PP.WEAVE_LEN), Math.PI / 2));
  const across = Math.abs(laneN(a.lane) - laneN(b.lane)) - ba[1] - bb[1] - sway;
  return { along, across };
}
export function packCheck(rows) {
  const bad = [];
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const g = packGap(rows[i], rows[j]);
    if (g.along < PACK_ALONG - 1e-9 && g.across < PACK_ABREAST - 1e-9) bad.push({ a: rows[i].id, b: rows[j].id, along: g.along, across: g.across });
  }
  return bad;
}

// ---------- where a rider is (THE MIRROR of the pack's vertex law, PACK_MOVE) ----------
// s = o + F(d) + surge; n = lane + WEAVE sin(s / WEAVE_LEN); the place by the road's Hermite (the shader's own road)
export function riderPlace(row, d, road, out = {}) {
  const F = packF(d), surge = row.slider ? 0 : PP.SURGE * Math.sin(F / PP.SURGE_LEN + 6.2831853 * row.own);
  const s = row.o + F + surge, n = laneN(row.lane) + PP.WEAVE * Math.sin(s / PP.WEAVE_LEN);
  const p = road.hermite(s, n, 0, _rp);
  out.s = s; out.n = n; out.x = p[0]; out.y = p[1]; out.z = p[2]; out.psi = p.psi; out.slope = road.slope(s);
  return out;
}
const _rp = [0, 0, 0];
// the drifter's bird: from the metre at which its rider is DRIFT_AHEAD m ahead of the lens's own station on the cliff road
// (d0 = (o - 20) / (1 - K0)) it rises 0.09 m for every metre flown, for 155 m (14 m up); once it is DRIFT_RISE m up (44.4 m
// flown after d0) it also slides 0.0633 m to port for every metre flown (7 m to port at the end), and stays there. A law
// of the metres flown; it only ever moves away from the lens's lane. In the shader: t = clamp(uD - d0, 0, DRIFT_RUN);
// up = DRIFT_UP t; port = DRIFT_PORT max(t - DRIFT_RISE / DRIFT_UP, 0)
export function drifterLift(row, d) {
  const d0 = (row.o - DRIFT_AHEAD) / (1 - PP.K0), t = clamp(d - d0, 0, DRIFT_RUN);
  return { up: DRIFT_UP * t, port: DRIFT_PORT * Math.max(t - DRIFT_RISE / DRIFT_UP, 0), d0 };
}

// ---------- the harbour ----------
// Places in the harbour are typed in its own measure: metres ALONG the lens's straight from the leaving point and ACROSS
// it (port positive); chordPoint turns them into the world. Six boats stand close beside the line, three to each hand by
// turns, 13 to 15 m from it; two further off to starboard.
export const BOATS = [[72, -14], [90, 14], [112, 15], [128, -14], [140, 13], [150, -15], [118, -40], [152, -28]];
export const STACK = [104, -13.5];                    // the roost stack: 30 m tall, 11 m across at the water
export const BOAT_R = 3.5, BOAT_H = 12, STACK_R = 5.5, STACK_H = 30;   // a boat's half length and its sail's height; the stack's foot radius and height
export const SHORE = { S0: 303, S1: 500, BULGE: 62, N: 24 };   // the cove's shore: from the wall's root to the landing, bulging to starboard of the line
// the shore's line: ONE ARC OF A CIRCLE in the harbour's measure from (S0, ROAD_N0) round to (S1, ROAD_N0), whose point
// abeam of the middle of its two ends lies BULGE m to starboard of the line
export function shoreArc(road) {
  if (road._shore) return road._shore;
  const c = chord(road), toCh = (p) => { const dx = p[0] - c.x, dz = p[2] - c.z; return [dx * c.tx + dz * c.tz, dx * c.tz - dz * c.tx]; };
  const a = toCh(road.point(SHORE.S0, PP.ROAD_N0, 0)), b = toCh(road.point(SHORE.S1, PP.ROAD_N0, 0)), m = [(a[0] + b[0]) / 2, -SHORE.BULGE];
  // the circle through a, m and b
  const D = 2 * (a[0] * (m[1] - b[1]) + m[0] * (b[1] - a[1]) + b[0] * (a[1] - m[1]));
  const qa = a[0] * a[0] + a[1] * a[1], qm = m[0] * m[0] + m[1] * m[1], qb = b[0] * b[0] + b[1] * b[1];
  const ox = (qa * (m[1] - b[1]) + qm * (b[1] - a[1]) + qb * (a[1] - m[1])) / D, oz = (qa * (b[0] - m[0]) + qm * (a[0] - b[0]) + qb * (m[0] - a[0])) / D;
  const R = Math.hypot(a[0] - ox, a[1] - oz), t0 = Math.atan2(a[1] - oz, a[0] - ox), tm = Math.atan2(m[1] - oz, m[0] - ox);
  let t1 = Math.atan2(b[1] - oz, b[0] - ox);
  const wrap = (t) => { let w = t - t0; while (w > Math.PI) w -= 2 * Math.PI; while (w < -Math.PI) w += 2 * Math.PI; return w; };
  let sweep = wrap(t1); const sm = wrap(tm);
  if (sm * sweep < 0 || Math.abs(sm) > Math.abs(sweep)) sweep += sweep > 0 ? -2 * Math.PI : 2 * Math.PI;   // the arc that passes through m
  const out = [];
  for (let i = 0; i <= SHORE.N; i++) { const t = t0 + sweep * i / SHORE.N; out.push(chordPoint(road, ox + R * Math.cos(t), oz + R * Math.sin(t))); }
  road._shoreR = R;
  return (road._shore = out);
}
// the harbour's water as a closed line: the wall's starboard face from the root to the landing, then the shore back
function harbourRing(road) {
  if (road._ring) return road._ring;
  const face = []; for (let s = SHORE.S0; s <= SHORE.S1 + 1e-6; s += 3.94) { const p = road.point(Math.min(s, SHORE.S1), PP.ROAD_N0, 0); face.push([p[0], p[2]]); }
  const shore = shoreArc(road), ring = face.concat(shore.slice().reverse());
  return (road._ring = { face, shore, ring });
}
function segDist(px, pz, a, b) {
  const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 > 0 ? clamp(((px - a[0]) * vx + (pz - a[1]) * vz) / l2, 0, 1) : 0;
  return Math.hypot(px - a[0] - vx * t, pz - a[1] - vz * t);
}
export function lineDist(line, x, z) { let m = Infinity; for (let i = 0; i + 1 < line.length; i++) m = Math.min(m, segDist(x, z, line[i], line[i + 1])); return m; }
function inside(ring, x, z) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > z) !== (b[1] > z) && x < a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])) c = !c; }
  return c;
}
// where the land ends on the port hand, by station: the beach's sea edge beside the cliff road, the wall's own face, the
// point's low cliff with its foot; eased between them at the wall's root and at the landing
export const LAND = { BEACH_N: 36, POINT_N: 21, ROOT: [300, 330], LANDING: [500, 515], WALL_OFF: 1, SHORE_FOOT: 2, NOSE: 20, CLEAR: 3 };
function portEdge(s) {
  if (s <= LAND.ROOT[0]) return LAND.BEACH_N;
  if (s <= LAND.ROOT[1]) return lerp(LAND.BEACH_N, PP.ROAD_N1, (s - LAND.ROOT[0]) / (LAND.ROOT[1] - LAND.ROOT[0]));
  if (s <= LAND.LANDING[0]) return PP.ROAD_N1;
  if (s <= LAND.LANDING[1]) return lerp(PP.ROAD_N1, LAND.POINT_N, (s - LAND.LANDING[0]) / (LAND.LANDING[1] - LAND.LANDING[0]));
  return LAND.POINT_N;
}
// THE LAND'S END (the second freeze): the land does not end square at the brink. Beyond it the ground runs on, under the
// rising ribbon, as A ROUNDED CLIFF HEADLAND, typed in the road's own measure as the station landEnd(n) at which the land
// ends on the side n:
//   n from POINT_N to HEAD.NC   a quarter of an ellipse from the point's port cliff at the brink round to THE NOSE'S TIP,
//                               LAND.NOSE m beyond the brink at n HEAD.NC (under the road's starboard half)
//   n from NC to NC - DEEP      a wide quarter of an ellipse sweeping BACK to starboard from the tip: the mainland's cape,
//                               HEAD.BACK m back by n NC - DEEP
//   landward of that            the line runs on at that station (beyond the far rank of hills; nothing stands there)
// The headland's top is the point's own level (ROAD_Y1); whoever builds the land body cuts it along this line with a
// cliff face to the sea, and keeps its top out of the road's own skin for the first metres past the brink (the road's
// skin is 2 cm over that level 3 m past the brink and 0.7 m over it at the tip).
export const HEAD = { NC: -12, DEEP: 440, BACK: 150, N: 40 };
export function landEnd(n) {
  if (n >= HEAD.NC) { const t = Math.min(1, (n - HEAD.NC) / (LAND.POINT_N - HEAD.NC)); return PP.S_BRINK + LAND.NOSE * Math.sqrt(1 - t * t); }
  const t = Math.min(1, (HEAD.NC - n) / HEAD.DEEP);
  return PP.S_BRINK + LAND.NOSE - HEAD.BACK * (1 - Math.sqrt(1 - t * t));
}
// the headland's line in the world, [[x, z], ...] from the port cliff at the brink round the nose and back along the cape
// (HEAD.N spans a quarter, even in the ellipse's own angle), for the land's builder and for the tests of place
export function headland(road) {
  if (road._head) return road._head;
  const out = [], put = (n) => { const p = road.point(landEnd(n), n, 0); out.push([p[0], p[2]]); };
  for (let i = 0; i <= HEAD.N; i++) put(HEAD.NC + (LAND.POINT_N - HEAD.NC) * Math.cos(i / HEAD.N * Math.PI / 2));
  for (let i = 1; i <= HEAD.N; i++) put(HEAD.NC - HEAD.DEEP * Math.sin(i / HEAD.N * Math.PI / 2));
  return (road._head = out);
}
// isWater(road, x, z, r): true where a disc of radius r lies wholly on the sea, by place: inside the harbour 1 m and more
// from the wall's face and clear of the shore's beach; or on the open sea to port of beach, wall and point; or beyond the
// land's end, 1 m and more off the headland's line and never under the road in the air; and 3 m clear of the stack and
// of every boat.
// more: other boats' places in the world, [[x, z], ...] (the rare visit's three)
export function isWater(road, x, z, r = 0, more = null) {
  const st = chordPoint(road, STACK[0], STACK[1]);
  if (Math.hypot(x - st[0], z - st[1]) < STACK_R + LAND.CLEAR + r) return false;
  for (const b of BOATS) { const p = chordPoint(road, b[0], b[1]); if (Math.hypot(x - p[0], z - p[1]) < BOAT_R + LAND.CLEAR + r) return false; }
  if (more) for (const p of more) if (Math.hypot(x - p[0], z - p[1]) < BOAT_R + LAND.CLEAR + r) return false;
  const H = harbourRing(road);
  if (inside(H.ring, x, z)) return lineDist(H.face, x, z) >= LAND.WALL_OFF + r && lineDist(H.shore, x, z) >= LAND.SHORE_FOOT + r;
  const at = road.stationOf(x, z, PP.S_BACK, PP.S_END), e = road.edges(at.s);
  if (at.s <= PP.S_BACK + 0.1) return false;                       // behind the road's first station nothing is promised
  const off = LAND.WALL_OFF + r;
  if (at.s > PP.S_BRINK || at.n < HEAD.NC) {                       // beyond the brink, or to starboard of the nose's tip: the land's end rules
    if (at.n <= LAND.POINT_N && at.s <= landEnd(at.n)) return false;                         // on the headland
    if (at.s > PP.S_BRINK && at.n >= e[0] - off && at.n <= e[1] + off) return false;         // never under the road in the air
    return lineDist(headland(road), x, z) >= off;
  }
  return at.n >= portEdge(at.s) + off;
}

// what lies at a place, by the same lines: 'harbour' (its water, the boats' and the stack's feet included), 'road' (cliff
// road, wall, point or ribbon), 'sea' (open water, the sea under and beside the road in the air too), 'shore' (verge, cliff
// and beach to port of the road) or 'land' (everything to starboard of the road that is not the harbour)
export function placeKind(road, x, z) {
  if (inside(harbourRing(road).ring, x, z)) return 'harbour';
  const at = road.stationOf(x, z, PP.S_BACK, PP.S_END), e = road.edges(at.s);
  if (at.n >= e[0] && at.n <= e[1]) return 'road';
  const onHead = at.n <= LAND.POINT_N && at.s <= landEnd(at.n);     // short of the land's end on its side
  if (at.s > PP.S_BRINK) return !onHead ? 'sea' : at.n > e[1] ? 'shore' : 'land';
  if (at.n > e[1]) return at.n >= portEdge(at.s) ? 'sea' : 'shore';
  return onHead ? 'land' : 'sea';
}

// ---------- the flown line, for every mirror ----------
// track: the flown line sampled every 0.25 m as [[x, z, y, d], ...], the entry axis back to s -340 first (d under 0).
// trackNear -> { dist (metres in plan to the ground track), d, y, i }: coarse every 10 m, then fine about the three best
export function trackNear(track, x, z) {
  const C = 40, best = [[Infinity, 0], [Infinity, 0], [Infinity, 0]];
  for (let i = 0; i < track.length; i += C) {
    const dx = track[i][0] - x, dz = track[i][1] - z, v = dx * dx + dz * dz;
    if (v < best[2][0]) { best[2] = [v, i]; best.sort((a, b) => a[0] - b[0]); }
  }
  let m = Infinity, mi = 0;
  for (const b of best) for (let i = Math.max(0, b[1] - C); i <= Math.min(track.length - 1, b[1] + C); i++) {
    const dx = track[i][0] - x, dz = track[i][1] - z, v = dx * dx + dz * dz; if (v < m) { m = v; mi = i; }
  }
  return { dist: Math.sqrt(m), d: track[mi][3], y: track[mi][2], i: mi };
}
export function clearToTrack(track, x, z) { return trackNear(track, x, z).dist; }
// the lens's own place at d metres flown, read from the track: [x, y, z] (d under 0: on the entry axis)
export function lensAt(track, d, out = [0, 0, 0]) {
  const d0 = track[0][3], step = track[1][3] - track[0][3], f = clamp((d - d0) / step, 0, track.length - 1), i = Math.min(track.length - 2, Math.floor(f)), t = f - i;
  out[0] = lerp(track[i][0], track[i + 1][0], t); out[1] = lerp(track[i][2], track[i + 1][2], t); out[2] = lerp(track[i][1], track[i + 1][1], t);
  return out;
}

// ---------- THE NINE of the harbour (declared pacing two: each a typed function of the metres flown and of nothing else) ----------
// All nine circle ONE ring over the harbour in single file (10 m radius, 24 m over the water, its middle RING_OFF m to
// starboard of the line abeam of the place the lens reaches at RING_D) and peel off it one after another.
// di: the metres flown at which the lens passes the bird's strike place; side: the hand of its strike point and of the
// place it comes up (+1 port, -1 starboard); hand: the hand of its tip point. With q = d - (di - AHEAD):
//   q under -110        on the ring: once round for every 2 pi RING_RUN metres flown
//   q -110 .. -30       it leaves the ring at its outer edge flying back toward the lens, swings round (the last five
//                       cross the line ahead of the lens) and comes to its TIP POINT flying with the lens: TIP_SIDE m to
//                       its hand, TIP_UP m over the lens's height, TIP_AHEAD m ahead of where the lens then is
//   q -30 .. 0          it tips, folds and stoops ahead to the STRIKE POINT on the water, SIDE m to its side of the line,
//                       which it enters when the lens is AHEAD m short of that place
//   q 0 .. 70           under the sea's own surface, to where it comes up
//   q 70 on             up like a cork, CORK m to its side of the line, astern of the lens, and sits
export const NINE_LAW = { AHEAD: 35, RING_D: 352, RING_HAND: -1, RING_R: 10, RING_Y: 24, RING_OFF: 26, Q_GLIDE: -110, Q_TIP: -30, Q_UP: 70, RING_RUN: 14,
  TIP_SIDE: 7, TIP_UP: 3, TIP_AHEAD: 14, SIDE: 5, CORK: 9, ARM: 19, DEEP: 3, SPAN: 2.8, FOLDED: 0.9, SPLASH_R: 5, SIT_R: 1.7, GAP: 6 };
// THE TABLE. The strikes fall where the six near boats and the stack leave 3 m of air round a splash of 5 m radius; the
// first four birds tip on the starboard hand, the last five on the port hand (a stoop down the starboard hand from there
// on would pass the roost stack with no air to spare)
export const NINE = [
  { di: 373, side: -1, hand: -1 }, { di: 381, side: -1, hand: -1 }, { di: 390, side: 1, hand: -1 },
  { di: 397, side: 1, hand: -1 }, { di: 408, side: -1, hand: 1 }, { di: 417, side: 1, hand: 1 },
  { di: 428, side: -1, hand: 1 }, { di: 435, side: -1, hand: 1 }, { di: 442, side: 1, hand: 1 },
];
const dirAt = (track, d) => { const a = lensAt(track, d - 0.5), b = lensAt(track, d + 0.5), l = Math.max(Math.hypot(b[0] - a[0], b[2] - a[2]), 1e-6); return [(b[0] - a[0]) / l, (b[2] - a[2]) / l]; };
// a place beside the line: the lens's own place at d, moved `port` metres to port; -> [x, z, the lens's y there, tx, tz]
function beside(track, d, port) { const p = lensAt(track, d), t = dirAt(track, d); return [p[0] + t[1] * port, p[2] - t[0] * port, p[1], t[0], t[1]]; }
// the typed points of bird i's course in the world (what the shader's law takes as numbers)
export function nineCourse(i, track, spec = NINE[i]) {
  const W = NINE_LAW, di = spec.di, tipD = di - W.AHEAD + W.Q_TIP + W.TIP_AHEAD;                 // the lens's metres at the tip point's place
  const S = beside(track, di, spec.side * W.SIDE), T = beside(track, tipD, spec.hand * W.TIP_SIDE);
  const C = beside(track, spec.ringD ?? W.RING_D, W.RING_HAND * W.RING_OFF), K = beside(track, di, spec.side * W.CORK);
  const tipY = lensAt(track, di - W.AHEAD + W.Q_TIP)[1] + W.TIP_UP;
  const out = [C[0] + W.RING_HAND * W.RING_R * C[4], C[1] - W.RING_HAND * W.RING_R * C[3]];       // the ring's outer point
  return { di, side: spec.side, hand: spec.hand, ring: { x: C[0], z: C[1], tx: C[3], tz: C[4] }, tipY,
    glide: [out, [out[0] - W.ARM * C[3], out[1] - W.ARM * C[4]], [T[0] - W.ARM * T[3], T[1] - W.ARM * T[4]], [T[0], T[1]]],
    tip: [T[0], T[1]], strike: [S[0], S[1]], cork: [K[0], K[1]] };
}
// ninePlace(i, d, track, out) -> out = [x, y, z], out.span = the half span it shows there (wings spread, or folded)
export function ninePlace(i, d, track, out = [0, 0, 0], course = null) {
  const W = NINE_LAW, c = course || nineCourse(i, track), q = d - (c.di - W.AHEAD);
  if (q < W.Q_GLIDE) {                                             // the ring: once round for every 2 pi RING_RUN metres flown
    const a = Math.PI / 2 + (q - W.Q_GLIDE) / W.RING_RUN, co = Math.cos(a) * W.RING_R, si = Math.sin(a) * W.RING_R * W.RING_HAND;
    out[0] = c.ring.x + co * c.ring.tx + si * c.ring.tz; out[1] = W.RING_Y; out[2] = c.ring.z + co * c.ring.tz - si * c.ring.tx; out.span = W.SPAN;
  } else if (q < W.Q_TIP) {                                        // the glide: one cubic through the four typed points
    const e = (q - W.Q_GLIDE) / (W.Q_TIP - W.Q_GLIDE), m = 1 - e, g = c.glide;
    const b0 = m * m * m, b1 = 3 * m * m * e, b2 = 3 * m * e * e, b3 = e * e * e;
    out[0] = b0 * g[0][0] + b1 * g[1][0] + b2 * g[2][0] + b3 * g[3][0]; out[2] = b0 * g[0][1] + b1 * g[1][1] + b2 * g[2][1] + b3 * g[3][1];
    out[1] = lerp(W.RING_Y, c.tipY, e * e * (3 - 2 * e)); out.span = W.SPAN;
  } else if (q < 0) {                                              // the stoop: on from the glide's own speed, falling faster and faster
    const t = (q - W.Q_TIP) / -W.Q_TIP, run = Math.max(Math.hypot(c.strike[0] - c.tip[0], c.strike[1] - c.tip[1]), 1e-6);
    const a = clamp(3 * W.ARM / (W.Q_TIP - W.Q_GLIDE) * -W.Q_TIP / run, 0, 1), g = a * t + (1 - a) * t * t;
    out[0] = lerp(c.tip[0], c.strike[0], g); out[2] = lerp(c.tip[1], c.strike[1], g); out[1] = c.tipY * (1 - t * t);
    out.span = lerp(W.SPAN, W.FOLDED, clamp(t * 2, 0, 1));
  } else if (q < W.Q_UP) {                                         // under the surface, to the place it comes up
    const t = q / W.Q_UP, g = t * t * (3 - 2 * t);
    out[0] = lerp(c.strike[0], c.cork[0], g); out[2] = lerp(c.strike[1], c.cork[1], g);
    out[1] = -W.DEEP * sstep(0, 3, q) * (1 - sstep(W.Q_UP - 6, W.Q_UP, q)); out.span = W.FOLDED;
  } else {                                                         // up like a cork, and sits
    const u = q - W.Q_UP;
    out[0] = c.cork[0]; out[2] = c.cork[1]; out[1] = 0.3 + 0.9 * Math.exp(-u / 6) * Math.sin(u / 2.2) - 0.3 * Math.exp(-u / 4); out.span = W.FOLDED;
  }
  return out;
}
// nineReach(i, track) -> { air, d }: the least metres from the bird (its place less its half span) to the lens's own place,
// over every quarter metre flown: THE MIRROR the count proves the 6 m with
export function nineReach(i, track, course = null) {
  const c = course || nineCourse(i, track), p = [0, 0, 0], l = [0, 0, 0]; let air = Infinity, at = 0;
  for (let d = 0; d <= track[track.length - 1][3]; d += 0.25) {
    ninePlace(i, d, track, p, c); lensAt(track, d, l);
    const v = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]) - p.span; if (v < air) { air = v; at = d; }
  }
  return { air, d: at };
}

// ---------- the dealers of places (each takes its own stream; every candidate's dice first, then the tests) ----------
// the engine's own deal of the visit's hints, copied (src/core/engine.js): the same two draws in the same order
export function varyOf(seed, hashSeed, makeRng) {
  const v = makeRng(hashSeed(seed + ':vary')), rare = v.chance(0.125), density = v.range(0.7, 1.3);
  return { rare, density };
}

// TREES: clumps of 2 to 5 on the land body, in three sizes (and a few cones). Trunks at n -15 and beyond; stations
// s -340 .. 300 and 515 .. 660 only (none on the wall or the ribbon); behind the entry (s under 0) none within 18 m of
// the entry axis, its crown counted; none in the harbour or on its shore; none within 14 m of the lighthouse's foot.
export const TREES = { ROW_N: -15, DEEP: 8, JIT_S: 7, JIT_N: 4, S_A: [-340, 300], S_B: [515, 660], SIZES: [6, 9, 9, 14], CONE: 0.12, ENTRY: 18, LIGHT: [590, -26], LIGHT_R: 14, MEAN: 150, LO: 110, HI: 190, TRIES: 4 };
export const crownR = (size) => size * 0.25;          // a tree's ball: a quarter of its height in radius
function treeStands(road, lp, s, n, size) {                        // -> its place on the ground, or null
  const T = TREES, r = crownR(size), inA = s >= T.S_A[0] && s <= T.S_A[1], inB = s >= T.S_B[0] && s <= T.S_B[1];
  if (!(inA || inB) || n > T.ROW_N) return null;
  if (s < 0 && n > PP.LENS_N - T.ENTRY - r) return null;
  const p = road.point(s, n, 0);
  if (Math.hypot(p[0] - lp[0], p[2] - lp[2]) < T.LIGHT_R + r) return null;
  if (placeKind(road, p[0], p[2]) !== 'land' || lineDist(shoreArc(road), p[0], p[2]) < 6 + r) return null;
  return p;
}
// -> [{ s, n, size, cone, x, y, z }], .leftOut. Each clump's dice first, then each tree's; a tree left out is dealt again
// in its clump (four goes), and a clump whose middle cannot stand is dealt again (four goes).
export function dealTrees(rng, density, road) {
  const T = TREES, want = clamp(Math.round(T.MEAN * density), T.LO, T.HI), out = [], lenA = T.S_A[1] - T.S_A[0], lenB = T.S_B[1] - T.S_B[0];
  const lp = road.point(T.LIGHT[0], T.LIGHT[1], 0); let leftOut = 0;
  for (let made = 0; made < want;) {
    const k = Math.min(rng.int(2, 5), want - made); let s0 = 0, n0 = 0, mid = false;
    for (let go = 0; go < T.TRIES && !mid; go++) {
      const inB = rng() < lenB / (lenA + lenB), u = rng(), deep = rng();
      s0 = inB ? lerp(T.S_B[0] + T.JIT_S, T.S_B[1] - T.JIT_S, u) : lerp(T.S_A[0] + T.JIT_S, T.S_A[1] - T.JIT_S, u);
      n0 = (s0 < T.JIT_S ? PP.LENS_N - T.ENTRY - crownR(14) : T.ROW_N) - T.JIT_N - T.DEEP * deep;   // behind the entry the row stands back
      mid = !!treeStands(road, lp, s0, n0, 9);
    }
    for (let j = 0; j < k; j++) {
      let stood = false;
      for (let go = 0; go < T.TRIES && !stood; go++) {
        const s = s0 + rng.range(-T.JIT_S, T.JIT_S), n = n0 + rng.range(-T.JIT_N, T.JIT_N), size = T.SIZES[rng.int(0, 3)], cone = rng() < T.CONE;
        const p = mid ? treeStands(road, lp, s, n, size) : null;
        if (p) { out.push({ s, n, size, cone, x: p[0], y: road.y(clamp(s, PP.S_BACK, PP.S_BRINK)), z: p[2] }); stood = true; }
      }
      if (!stood) leftOut++;
    }
    made += k;
  }
  out.leftOut = leftOut;
  return out;
}

// HILLS: 14 to 20 ellipsoids on the land body in three ranks, 60 to 220 m long and 18 to 60 m high, each lying along the
// coast's own heading at its station of the guide. rank 0 is the near rank (its nearest skin never nearer than n -34), rank 1 the second,
// rank 2 the far one. A hill stands where its whole foot is land, 10 m and more inland of the cove's shore.
// -> [{ x, y, z, rx (half length), ry (height), rz (half depth), yaw, rank, houses, stripes, crest, s (the guide's station), n }], .leftOut
export const HILLS = { SKIN_N: -34, RANK_N: [0, 120, 250], G: [-340, 640], SHORE: 10, BACK_G: 20, BACK: 12, TRIES: 6 };   // behind the entry the near skin stands 12 m further off (the trees' row stands back there)
// THE COAST'S GUIDE for things of the land: g runs along the road to the leaving point, then along the lens's straight
// over the harbour (so the land behind the cove has stations of its own), then along the road again from the meeting
// point; n is the side as on the road, and behind the cove it is measured from the shore instead of from the line.
// -> { x, z, y (the land's height there), psi, tx, tz }
export function coast(road, g, n) {
  const run = meetMiss(road, true).along;
  if (g <= PP.S_LEAVE || g >= PP.S_LEAVE + run) {
    const s = g <= PP.S_LEAVE ? g : g - PP.S_LEAVE - run + PP.S_MEET, a = road.at(s), p = road.point(s, n, 0);   // (the second freeze: the first typed g - run + S_MEET, which put every hill of the point out at sea)
    return { x: p[0], z: p[2], y: road.y(clamp(s, PP.S_BACK, PP.S_BRINK)), psi: a.psi, tx: a.tx, tz: a.tz };
  }
  const c = chord(road), al = g - PP.S_LEAVE, sh = shoreArc(road); let deep = 0;
  for (let i = 0; i + 1 < sh.length; i++) {                        // how far the shore lies to starboard of the line abeam of this place
    const a0 = (sh[i][0] - c.x) * c.tx + (sh[i][1] - c.z) * c.tz, a1 = (sh[i + 1][0] - c.x) * c.tx + (sh[i + 1][1] - c.z) * c.tz;
    if ((a0 - al) * (a1 - al) > 0 || a0 === a1) continue;
    const t = (al - a0) / (a1 - a0), x = lerp(sh[i][0], sh[i + 1][0], t), z = lerp(sh[i][1], sh[i + 1][1], t);
    deep = Math.max(deep, -((x - c.x) * c.tz - (z - c.z) * c.tx));
  }
  const q = chordPoint(road, al, n - PP.LENS_N - Math.max(0, deep + PP.ROAD_N0 - PP.LENS_N));
  return { x: q[0], z: q[1], y: lerp(road.y(PP.S_LEAVE), road.y(PP.S_MEET), al / run), psi: c.psi, tx: c.tx, tz: c.tz };
}
function hillStands(road, shore, a, rx, rz) {                     // the foot's rim, twelve places round it: all land, off the shore, off the road
  for (let i = 0; i < 12; i++) {
    const t = i / 12 * 6.2831853, ex = Math.cos(t) * rx, ez = Math.sin(t) * rz;   // along the coast's heading, and across it
    const x = a.x + a.tx * ex + a.tz * ez, z = a.z + a.tz * ex - a.tx * ez;
    if (placeKind(road, x, z) !== 'land' || lineDist(shore, x, z) < HILLS.SHORE) return false;
    if (road.stationOf(x, z, PP.S_BACK, PP.S_BRINK).n > HILLS.SKIN_N) return false;
  }
  return true;
}
export function dealHills(rng, road) {
  const H = HILLS, count = rng.int(14, 20), per = [Math.ceil(count * 0.4), Math.ceil(count * 0.33), 0]; per[2] = count - per[0] - per[1];
  const out = [], shore = shoreArc(road); let leftOut = 0;
  for (let rank = 0; rank < 3; rank++) for (let k = 0; k < per[rank]; k++) {
    let stood = false;
    for (let go = 0; go < H.TRIES && !stood; go++) {                // a hill's dice first, then the tests; one left out is dealt again, six goes at most
      const u = go === 0 ? (k + rng()) / per[rank] : rng(), rx = rng.range(30, 110), ry = rng.range(18, 60) * (rank === 0 ? 0.8 : 1), rz = rng.range(22, 55), gap = rng.range(0, 40);
      const nh = rank === 0 ? rng.int(0, 2) : 0, stripes = rng.int(2, 3), crest = rng() < 0.6;
      const g = lerp(H.G[0] + rx, H.G[1] - rx, u);                  // its whole length inside the guide
      const n = H.SKIN_N - (g - rx < H.BACK_G ? H.BACK : 0) - H.RANK_N[rank] - gap - rz, a = coast(road, g, n);
      if (!hillStands(road, shore, a, rx, rz)) continue;
      out.push({ x: a.x, y: a.y, z: a.z, rx, ry, rz, yaw: a.psi, rank, houses: nh, stripes, crest, s: g, n }); stood = true;
    }
    if (!stood) leftOut++;
  }
  const houses = rng.int(6, 10);                                   // the near rank's houses, six to ten in all
  // share the houses over the near rank's hills that stand (the first ones take one more until the number is met)
  const near = out.filter((h) => h.rank === 0); let have = near.reduce((m, h) => m + h.houses, 0);
  for (let i = 0; near.length && have < houses && i < 40; i++, have++) near[i % near.length].houses++;
  for (let i = 0; near.length && have > 10 && i < 40; i++) { const h = near[i % near.length]; if (h.houses > 0) { h.houses--; have--; } }
  out.leftOut = leftOut;
  return out;
}

// ---------- THE SEA BIRDS (stream 'seabirds'; the rare run's from 'rare') ----------
// The divers and the sitters are dealt here (dice first, then the tests, eight goes a bird, the ones that find no place
// counted). The gliders' seven lines are TYPED, not dealt: pelican-peloton-plan-sea.js (gliderLines); `courses` stays empty.
export const SEA = {
  DIVERS: 110, DENS: [0.85, 1.2], TRIES: 8, CLEAR: 26,             // ambient divers: count by density; 26 m in plan from the track
  S: [-200, 690], N: [44, 270],                                    // where a strike may fall, in the road's measure (the open sea to port)
  RING_R: [8, 12], RING_Y: [30, 55], RUN: [12, 22], CORK: [8, 12], PER: [8, 13.5], SPLASH_R: 3, STEP: 16,
  SITTERS: 30, SIT_CLEAR: 12, SIT_HARBOUR: 0.5, SIT_ALONG: [45, 165], SIT_ACROSS: [-58, 42], SIT_S: [150, 640], SIT_N: [42, 95], SIT_R: 1.1, SIT_NINE: 8, SIT_DIVER: 6,   // sitters: 12 m from the track; 8 m from the nine's strikes and corks
  HALF_SPAN: 2.8, GLIDERS: 54, LINES: 7, LINE_GAP: 5, PLAN: 11, UNDER: 6, ENTRY: 20,
};
const segDist3 = (p, a, b) => {                                    // least metres from a point to a stroke, in space
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], L = ux * ux + uy * uy + uz * uz;
  const t = L > 0 ? clamp(((p[0] - a[0]) * ux + (p[1] - a[1]) * uy + (p[2] - a[2]) * uz) / L, 0, 1) : 0;
  return Math.hypot(p[0] - a[0] - ux * t, p[1] - a[1] - uy * t, p[2] - a[2] - uz * t);
};
// MIRROR of a diver's whole cycle IN PLAN: its ring (the circle's edge), the run-in from the ring to the strike, the
// strike, the cork and the climbing run back all lie inside the triangle ring middle, strike, cork grown by the ring's
// radius; the least metres from that to the whole track (the entry axis is the track's first part). -> { plan, d }
export function diverReach(row, track) {
  const first = trackNear(track, row.strike[0], row.strike[1]); let m = first.dist + 1e-6, at = first.d;   // the strike is a place of the triangle: the least is no more than this
  const far = Math.max(Math.hypot(row.ring[0] - row.strike[0], row.ring[1] - row.strike[1]), Math.hypot(row.cork[0] - row.strike[0], row.cork[1] - row.strike[1]));
  for (let i = 0; i < track.length; i += 2) {
    const x = track[i][0], z = track[i][1];
    if (Math.hypot(x - row.strike[0], z - row.strike[1]) - far >= m) continue;   // no place of the triangle can be nearer than the least so far
    const v = Math.min(segDist(x, z, row.ring, row.strike), segDist(x, z, row.strike, row.cork), segDist(x, z, row.cork, row.ring));
    if (v < m) { m = v; at = track[i][3]; }
  }
  return { plan: m - row.ringR, d: at };
}
function dealDiver(rng, road, S) {                                  // one go: every die, then the row (no test here)
  const s = rng.range(S.S[0], S.S[1]), n = rng.range(S.N[0], S.N[1]), b = rng.range(0, 6.2831853), run = rng.range(S.RUN[0], S.RUN[1]);
  const ringR = rng.range(S.RING_R[0], S.RING_R[1]), ringY = rng.range(S.RING_Y[0], S.RING_Y[1]), cb = b + rng.range(1.2, 5.0), cr = rng.range(S.CORK[0], S.CORK[1]);
  const per = rng.range(S.PER[0], S.PER[1]), phase = rng(), hand = rng() < 0.5 ? 1 : -1, p = road.point(s, n, 0);
  return { strike: [p[0], p[2]], ring: [p[0] + Math.cos(b) * run, p[2] + Math.sin(b) * run], ringR, ringY,
    cork: [p[0] + Math.cos(cb) * cr, p[2] + Math.sin(cb) * cr], per, phase, hand, s, n };
}
function diverStands(row, road, track, S, more) {
  if (diverReach(row, track).plan < S.CLEAR) return false;
  if (placeKind(road, row.strike[0], row.strike[1]) !== 'sea' || placeKind(road, row.cork[0], row.cork[1]) !== 'sea') return false;
  return isWater(road, row.strike[0], row.strike[1], S.SPLASH_R, more) && isWater(road, row.cork[0], row.cork[1], S.SIT_R, more);
}
// MIRROR of a glider line: course = { pts: [[x, y, z] x 8] }, a closed loop blended as a uniform cubic B-spline (the
// shader's own law: no corner). Every phase at once: the loop is read at 64 places a span against the whole track.
// -> { plan (least metres in plan, half a wingspan taken off), air (least metres in space to the lens's own places, half a
//      wingspan taken off), d (where the least air is), len (the loop's length) }
export function coursePoint(course, u, out = [0, 0, 0]) {
  const P = course.pts, n = P.length, f = (((u % 1) + 1) % 1) * n, i = Math.floor(f), t = f - i, t2 = t * t, t3 = t2 * t;
  const w0 = (1 - 3 * t + 3 * t2 - t3) / 6, w1 = (4 - 6 * t2 + 3 * t3) / 6, w2 = (1 + 3 * t + 3 * t2 - 3 * t3) / 6, w3 = t3 / 6;
  const a = P[i % n], b = P[(i + 1) % n], c = P[(i + 2) % n], e = P[(i + 3) % n];
  for (let k = 0; k < 3; k++) out[k] = w0 * a[k] + w1 * b[k] + w2 * c[k] + w3 * e[k];
  return out;
}
export function courseReach(course, track) {
  const N = course.pts.length * 64, q = [0, 0, 0], last = [0, 0, 0]; let plan = Infinity, air = Infinity, at = 0, len = 0;
  for (let j = 0; j <= N; j++) {
    coursePoint(course, j / N, q);
    if (j > 0) len += Math.hypot(q[0] - last[0], q[1] - last[1], q[2] - last[2]);
    last[0] = q[0]; last[1] = q[1]; last[2] = q[2];
    if (j === N) break;
    const near = trackNear(track, q[0], q[2]); plan = Math.min(plan, near.dist);
    for (let i = Math.max(0, near.i - 160); i < Math.min(track.length, near.i + 161); i += 2) {
      const v = Math.hypot(q[0] - track[i][0], q[2] - track[i][1], q[1] - track[i][2]);
      if (v < air) { air = v; at = track[i][3]; }
    }
  }
  return { plan: plan - SEA.HALF_SPAN, air: air - SEA.HALF_SPAN, d: at, len };
}
// vary: { density }. -> { courses, divers, sitters, leftOut: { divers, sitters, courses } }. The stream's order is divers,
// then sitters, then the gliders' lines, so the first two deals do not move when the lines are written.
// A diver's row: { strike [x, z], ring [x, z], ringR, ringY, cork [x, z], per, phase, hand, s, n }; a sitter's: { x, z, turn, phase }.
export function dealSeaBirds(rng, vary, road, track) { return drain(seaBirdSteps(rng, vary, road, track)); }
// THE SAME DEAL IN STEPS for the page: a generator that hands back every 16 goes (so no build step is long; 40 until the gate) and returns
// the deal at its end:  const g = seaBirdSteps(...); let r; while (!(r = g.next()).done) await pause(); use(r.value)
const drain = (g) => { let r = g.next(); while (!r.done) r = g.next(); return r.value; };
export function* seaBirdSteps(rng, vary, road, track) {
  const S = SEA, divers = [], sitters = [], courses = [], leftOut = { divers: 0, sitters: 0, courses: 0 }; let goes = 0;
  const want = Math.round(S.DIVERS * clamp(vary.density, S.DENS[0], S.DENS[1]));
  for (let k = 0; k < want; k++) {
    let row = null;
    for (let go = 0; go < S.TRIES && !row; go++) { const r = dealDiver(rng, road, S); if (diverStands(r, road, track, S, null)) row = r; if (++goes % S.STEP === 0) yield goes; }
    if (row) divers.push(row); else leftOut.divers++;
  }
  const nine = NINE.map((b, i) => nineCourse(i, track));
  for (let k = 0; k < S.SITTERS; k++) {
    let row = null;
    for (let go = 0; go < S.TRIES && !row; go++) {
      const inH = rng() < S.SIT_HARBOUR, u = rng(), v = rng(), turn = rng.range(0, 6.2831853), phase = rng(), p = [0, 0, 0];
      if (inH) { const q = chordPoint(road, lerp(S.SIT_ALONG[0], S.SIT_ALONG[1], u), lerp(S.SIT_ACROSS[0], S.SIT_ACROSS[1], v)); p[0] = q[0]; p[2] = q[1]; }
      else road.point(lerp(S.SIT_S[0], S.SIT_S[1], u), lerp(S.SIT_N[0], S.SIT_N[1], v), 0, p);   // the open sea under the cliff road, outside the wall and off the point
      if (clearToTrack(track, p[0], p[2]) < S.SIT_CLEAR || !isWater(road, p[0], p[2], S.SIT_R)) continue;
      let ok = true;
      for (const c of nine) for (const q of [c.strike, c.cork]) if (Math.hypot(p[0] - q[0], p[2] - q[1]) < S.SIT_NINE) ok = false;
      for (const d of divers) if (Math.hypot(p[0] - d.strike[0], p[2] - d.strike[1]) < S.SIT_DIVER || Math.hypot(p[0] - d.cork[0], p[2] - d.cork[1]) < S.SIT_DIVER / 2) ok = false;
      if (ok) row = { x: p[0], z: p[2], turn, phase };
    }
    if (k % 10 === 9) yield goes;
    if (row) sitters.push(row); else leftOut.sitters++;
  }
  // the gliders' seven lines are typed in pelican-peloton-plan-sea.js and take no dice: `courses` is handed back empty
  return { courses, divers, sitters, leftOut };
}
// THE RARE VISIT (stream 'rare', dealt on every visit so the usual deal never moves): the shoal patch typed at
// (s 420, n +80), 70 m across; three more boats standing off beyond it; 90 more divers whose strikes fall on the patch.
// usual: the visit's usual deal of dealSeaBirds (the boats stand clear of its divers' strikes and corks and of its sitters;
// the usual deal itself is never changed by the run). In steps for the page as rareSteps, every 30 goes.
// -> { shoal: { x, z, r }, boats: [[x, z] x 3 at the most], divers: [rows as dealSeaBirds'], leftOut: { boats, divers } }
export const RARE = { S: 420, N: 80, R: 35, DIVERS: 90, BOATS: 3, OFF: [22, 50], SPREAD: 70, APART: 14, STEP: 30, BOAT_TRIES: 24 };
export function dealRare(rng, road, track, usual) { return drain(rareSteps(rng, road, track, usual)); }
export function* rareSteps(rng, road, track, usual) {
  const R = RARE, S = SEA, c = road.point(R.S, R.N, 0), boats = [], divers = [], leftOut = { boats: 0, divers: 0 }, keep = BOAT_R + LAND.CLEAR; let goes = 0;
  for (let k = 0; k < R.BOATS; k++) {
    let at = null;
    for (let go = 0; go < R.BOAT_TRIES && !at; go++) {
      const s = R.S + rng.range(-R.SPREAD, R.SPREAD), n = R.N + R.R + rng.range(R.OFF[0], R.OFF[1]), p = road.point(s, n, 0);
      if (placeKind(road, p[0], p[2]) !== 'sea' || !isWater(road, p[0], p[2], BOAT_R) || clearToTrack(track, p[0], p[2]) < S.CLEAR) continue;
      if (Math.hypot(p[0] - c[0], p[2] - c[2]) < R.R + keep) continue;
      let ok = boats.every((b) => Math.hypot(p[0] - b[0], p[2] - b[1]) >= R.APART);
      for (const d of usual.divers) if (Math.hypot(p[0] - d.strike[0], p[2] - d.strike[1]) < keep + S.SPLASH_R || Math.hypot(p[0] - d.cork[0], p[2] - d.cork[1]) < keep + S.SIT_R) ok = false;
      for (const b of usual.sitters) if (Math.hypot(p[0] - b.x, p[2] - b.z) < keep + S.SIT_R) ok = false;
      if (ok) at = [p[0], p[2]];
    }
    if (at) boats.push(at); else leftOut.boats++;
  }
  yield goes;
  for (let k = 0; k < R.DIVERS; k++) {
    let row = null;
    for (let go = 0; go < S.TRIES && !row; go++) {
      const r = dealDiver(rng, road, S), a = rng.range(0, 6.2831853), q = R.R * Math.sqrt(rng());   // the same dice as any diver, then its place on the patch
      const dx = c[0] + Math.cos(a) * q - r.strike[0], dz = c[2] + Math.sin(a) * q - r.strike[1];
      for (const v of [r.strike, r.ring, r.cork]) { v[0] += dx; v[1] += dz; }
      const st = road.stationOf(r.strike[0], r.strike[1], PP.S_BACK, PP.S_END); r.s = st.s; r.n = st.n;
      if (diverStands(r, road, track, S, boats)) row = r;
      if (++goes % R.STEP === 0) yield goes;
    }
    if (row) divers.push(row); else leftOut.divers++;
  }
  return { shoal: { x: c[0], z: c[2], r: R.R }, boats, divers, leftOut };
}
// ---------- THE CLOUDS (stream 'clouds') ----------
// The deal the sea part draws from (the sea plan file adds each lane's clear window). A drifting cloud rides its own lane from a to b (2,600 m, along the coast);
// its circles keep their places about the cloud's middle (along the lane, and up). lane.y is the middle's height, set so
// that the lowest edge of the lowest circle is the dealt 80 to 150 m. The bank is typed in the road's measure.
export const CLOUDS = { MEAN: 30, LO: 24, HI: 36, LEN: 2600, EDGE: [80, 150], R: [14, 45], N: [3, 6], SKEW: 0.25, X: [-1500, 1500], Z: [-200, 1000],
  CLEAR: 25, TRIES: 8, SPEED: 1.2, GROW: 200,
  BANK_S: [830, 1000], BANK_N: 40, BANK_ROW: 16, BANK_UNDER: 8, BANK_R: [10, 14], BANK_DROP: 8, UNDER_N: [-4, 3, -2, 5, -5, 2, -3, 4] };
// MIRROR: the least metres of air between the lens (the whole track, the entry axis too) and any circle of the cloud at
// ANY place along its lane, each circle counted as a ball at its full size. -> { air, d }
export function cloudReach(lane, track) {
  const ux = (lane.b[0] - lane.a[0]) / CLOUDS.LEN, uz = (lane.b[2] - lane.a[2]) / CLOUDS.LEN, p = [0, 0, 0], a = [0, 0, 0], b = [0, 0, 0];
  let air = Infinity, at = 0;
  for (const c of lane.circles) {
    a[0] = lane.a[0] + ux * c.along; a[1] = lane.y + c.up; a[2] = lane.a[2] + uz * c.along;
    b[0] = lane.b[0] + ux * c.along; b[1] = lane.y + c.up; b[2] = lane.b[2] + uz * c.along;
    for (let i = 0; i < track.length; i += 4) {
      if (a[1] - track[i][2] - c.r >= air) continue;               // its height over the lens alone is no less than the least so far
      p[0] = track[i][0]; p[1] = track[i][2]; p[2] = track[i][1];
      const v = segDist3(p, a, b) - c.r;
      if (v < air) { air = v; at = track[i][3]; }
    }
  }
  return { air, d: at };
}
// road: the plan's road (the bank is typed on it; a fourth argument the build plan's signature did not name).
// -> { lanes: [{ a [x, y, z], b [x, y, z], y, circles: [{ along, up, r }], phase, edge }], bank: [{ x, y, z, r, s, n, own }], leftOut }
export function dealClouds(rng, density, track, road) { return drain(cloudSteps(rng, density, track, road)); }
export function* cloudSteps(rng, density, track, road) {             // the same deal in steps for the page: hands back every 10 lanes
  const C = CLOUDS, want = clamp(Math.round(C.MEAN * density), C.LO, C.HI), lanes = []; let leftOut = 0;
  for (let k = 0; k < want; k++) {
    if (k % 10 === 9) yield k;
    let lane = null;
    for (let go = 0; go < C.TRIES && !lane; go++) {
      const mx = rng.range(C.X[0], C.X[1]), mz = rng.range(C.Z[0], C.Z[1]), skew = rng.range(-C.SKEW, C.SKEW), way = rng() < 0.5 ? 1 : -1;
      const edge = rng.range(C.EDGE[0], C.EDGE[1]), phase = rng(), n = rng.int(C.N[0], C.N[1]), circles = []; let low = Infinity, along = 0;
      for (let j = 0; j < n; j++) {
        const r = rng.range(C.R[0], C.R[1]) * (j === 0 || j === n - 1 ? 0.7 : 1), up = rng.range(-0.25, 0.35) * r;
        if (j > 0) along += (circles[j - 1].r + r) * rng.range(0.55, 0.8);
        circles.push({ along, up, r }); low = Math.min(low, up - r);
      }
      for (const c of circles) c.along -= along / 2;
      const tx = Math.sin(skew) * way, tz = Math.cos(skew) * way, h = C.LEN / 2, y = edge - low;
      const cand = { a: [mx - tx * h, y, mz - tz * h], b: [mx + tx * h, y, mz + tz * h], y, circles, phase, edge };
      if (cloudReach(cand, track).air >= C.CLEAR) lane = cand;
    }
    if (lane) lanes.push(lane); else leftOut++;
  }
  const bank = [], span = C.BANK_S[1] - C.BANK_S[0], fr = (v) => v - Math.floor(v);
  const put = (s, n, r, own) => { const p = road.point(s, n, 0); bank.push({ x: p[0], y: road.y(s) - C.BANK_DROP - r, z: p[2], r, s, n, own }); };
  for (let row = 0; row < 2; row++) for (let i = 0; i < C.BANK_ROW; i++)
    put(C.BANK_S[0] + span * i / (C.BANK_ROW - 1), (row ? 1 : -1) * C.BANK_N, lerp(C.BANK_R[0], C.BANK_R[1], fr(i * 0.618 + row * 0.37)), fr(i * 0.317 + row * 0.5));
  for (let i = 0; i < C.BANK_UNDER; i++)
    put(C.BANK_S[0] + 10 + (span - 20) * i / (C.BANK_UNDER - 1), C.UNDER_N[i], lerp(C.BANK_R[0], C.BANK_R[1], fr(i * 0.618 + 0.2)), fr(i * 0.317 + 0.25));
  return { lanes, bank, leftOut };
}
