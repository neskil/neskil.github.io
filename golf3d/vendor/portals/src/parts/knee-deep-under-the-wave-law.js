// KNEE-DEEP UNDER THE WAVE: the one law of the place, the route, the wave's course and the hole (film worlds D; the
// lead's file). Every part reads its places and its timing from here, so that the sea, the wave, the sky and the
// craft agree. Plain numbers and pure functions only: no three.js, no random draw, no clock.
// Metres; y up; the calm sea's surface is y = 0 and the sand lies at y = -SEA.depth.
// +x is EAST, -x is WEST, -z is NORTH, +z is SOUTH. The lens flies due north along x = 0, toward the hole.
// Everything SCRIPTED is a function of s = METRES FLOWN on the route, measured along the route's knots
// (s = u * ROUTE_LENGTH; the world hands s to every part's update). Nothing here reads the camera or the clock.
//
// A DECLARED PACING (said here, at the law's head): the wave's place is a function of the metres flown. For every
// metre of ground the lens covers, the wave covers PLAN.far metres toward it while it is far off; between the
// ground metres PLAN.slowFrom and PLAN.slowTo it slows, as a wave does that feels the bottom, to PLAN.face metres
// (its foot passes under the lens at PLAN.footAt, a little past half way through that slowing), and to PLAN.behind once the lens is over its
// crest. The lens's own height is the wave's water under it plus a clearance, so the route and the wave can
// never part company.

const DEG = Math.PI / 180;
const S = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };          // the smooth step
// a value eased from knot to knot (a smooth step on each span; held at the ends): never overshoots
function eased(K, s, k = 1) {
  const n = K.length;
  if (s <= K[0][0]) return K[0][k];
  if (s >= K[n - 1][0]) return K[n - 1][k];
  let i = 0; while (s > K[i + 1][0]) i++;
  return K[i][k] + (K[i + 1][k] - K[i][k]) * S((s - K[i][0]) / (K[i + 1][0] - K[i][0]));
}
// a table read at x by straight lines between its entries (the table's xs rise)
function read(X, Y, x) {
  const n = X.length;
  if (x <= X[0]) return Y[0];
  if (x >= X[n - 1]) return Y[n - 1];
  let a = 0, b = n - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (X[m] <= x) a = m; else b = m; }
  return Y[a] + (Y[b] - Y[a]) * (x - X[a]) / (X[b] - X[a]);
}

// the flight's length in seconds (the world's duration)
export const FLIGHT_SECONDS = 58;

// ---- THE SEA: knee-deep to every horizon (half a metre of clear water over pale rippled sand)
export const SEA = { depth: 0.5, thin: 0.08 };    // thin: the share of that depth left at the wave's foot (seaDepth below)

// ---- THE HOLE: the black hole that is this world's only sun. It stands due north, low, and does not move.
// All its measures are ANGLES in degrees, as seen from anywhere in the place (it is very far away).
//   elevation   of its centre above the level horizon
//   shadow      the radius of the disc of perfect dark
//   ring        the radius of the thin bright ring that wraps the dark (the light that grazes the hole)
//   archTop     the outer radius, straight up, of the arch of light bent over the top
//   archBottom  the outer radius, straight down, of the fainter arch bent under it
//   band        half the length of the band of fire that crosses in front of the lower half of the dark
//   bandInner   the band's inner radius (the gap between the ring and the band's bright inner edge)
//   tilt        how far the band's plane is tipped toward the eye (the band's thickness is its length times sin tilt)
// The hole's light comes from elevation lightLow to lightHigh (the lower arch's foot to the upper arch's top).
export const HOLE = { azimuth: 0, elevation: 14, shadow: 6.2, ring: 6.5, archTop: 9.4, archBottom: 8.2, band: 22, bandInner: 8.4, tilt: 6,
  lightLow: 5, lightHigh: 23.4,
  grow: 2.6 };                           // past the crest the hole grows to this many times its angular measure (holeGrow below)
const EL = HOLE.elevation * DEG;
export const HOLE_DIR = [0, Math.sin(EL), -Math.cos(EL)];          // the unit vector toward the hole's centre

// ---- THE WAVE: one swell that reaches from one end of the horizon to the other and runs SOUTH, toward the lens.
// Its crest line runs east-west. xi is a place ON the wave: metres SOUTH of the crest line (xi > 0 is the steep
// face the lens meets; xi < 0 is the long back). The foot of the face is xi = WAVE.face; the back ends at
// xi = -WAVE.back. A part may add swells and chop of its own of at most WAVE.swell metres either way.
//   apron   metres south of the foot over which churned white water lies on the bared bed
//   draw    metres south of the foot over which the sea is drawn thin and the sand is bared in ridges
//   stream  metres south of the foot over which the water is seen to run north toward the wave
//   next    metres from this crest to the crest of the NEXT wave north of it (the second range under the hole,
//           seen once the lens is over the crest: it stands about as far off as the first wave does at the entry)
export const WAVE = { height: 400, face: 600, back: 1000, cap: 24, swell: 6, halfWidth: 12000, apron: 60, draw: 420, stream: 950, next: 5500 };
// THE CREST IS UNEVEN along its length, like a range of peaks and saddles. The wave's whole height at x (metres
// east of the route) is its height in the route's plane times crestLift(x):
//   crestLift(x) = 1 + (1 - exp(-x * x / (2 * CREST.saddle * CREST.saddle))) * sum over CREST.terms [a, w, p] of a * (0.5 + 0.5 * sin(2 * PI * x / w + p))
// It is exactly 1 at x = 0 and level there, and never under 1: THE ROUTE CROSSES THROUGH A SADDLE (within 40 m of
// the route's plane the wave stands under 1% higher than waveHeight says), and the peaks either side stand up to a
// fifth higher. waveHeight and waveSlope below are the wave in the route's plane (x = 0); a part that draws the
// wave away from that plane multiplies its heights and slopes by crestLift(x).
export const CREST = { saddle: 120, terms: [[0.11, 3100, 1.3], [0.07, 1170, 4.1], [0.035, 430, 2.2]] };
export function crestLift(x) {
  let n = 0; for (const [a, w, p] of CREST.terms) n += a * (0.5 + 0.5 * Math.sin(2 * Math.PI * x / w + p));
  return 1 + (1 - Math.exp(-x * x / (2 * CREST.saddle * CREST.saddle))) * n;
}
// THE FACE IS HOLLOW: it steepens all the way up (height as the square of the way from the foot to the crest) and
// only its last tenth rounds over into the crest (WAVE.cap sets how small that cap is), so that from anywhere on
// the face the crest and its lip stand in view above. The back is a long smooth fall.
const hollow = (q, n) => (q * q - (2 / n) * Math.pow(q, n)) / (1 - 2 / n);            // 0 at the foot (q 0), 1 at the crest (q 1), level there
const hollowSlope = (q, n) => (2 * q - 2 * Math.pow(q, n - 1)) / (1 - 2 / n);
// the height of the wave's water above the calm sea at xi
export function waveHeight(xi) {
  if (xi >= WAVE.face || xi <= -WAVE.back) return 0;
  if (xi >= 0) return WAVE.height * hollow(1 - xi / WAVE.face, WAVE.cap);
  return WAVE.height * 0.5 * (1 + Math.cos(Math.PI * xi / WAVE.back));
}
// its slope: metres of height per metre of xi (negative on the face, where the water falls away toward the south)
export function waveSlope(xi) {
  if (xi >= WAVE.face || xi <= -WAVE.back) return 0;
  if (xi >= 0) return -WAVE.height / WAVE.face * hollowSlope(1 - xi / WAVE.face, WAVE.cap);
  return -WAVE.height * 0.5 * Math.PI / WAVE.back * Math.sin(Math.PI * xi / WAVE.back);
}
// the depth of the sea in front of the wave at xi (xi >= WAVE.face): knee-deep far off, a thin sheet at the foot
export function seaDepth(xi) { return SEA.depth * (SEA.thin + (1 - SEA.thin) * S((xi - WAVE.face) / WAVE.draw)); }
// how hard the water runs north toward the wave at xi: 0 far off, 1 at the foot
export function seaStream(xi) { return 1 - S((xi - WAVE.face) / WAVE.stream); }

// ---- THE PLAN OF THE FLIGHT, by the lens's GROUND METRES north of where it enters (g). The lens is at z = -g.
const PLAN = {
  entryHeight: 46, entryRun: 210,        // it comes in 46 m up and is down at the skim's height after 210 m of ground
  skim: 5,                               // the skim's height over the water
  footAt: 955,                           // the ground metres at which the wave's foot is under the lens
  far: 3.6, slowFrom: 840, slowTo: 1040, face: 0.8, behind: 0.2,    // the wave's ground metres per metre of the lens's ground
  faceClear: 22, crestClear: 26,         // the lens's least height over the wave's water on the face, and at the crest
  capPath: 10,                           // the route rounds over the crest in a wider cap than the water's own (WAVE.cap), so
                                         // it stands further off the upper face (up to some 50 m) and comes close again at the crest
  // after the crest: ground metres past it, the route's pitch there in degrees (a dive down the back, a pull-up,
  // then 330 m of ground rising straight at the hole's own elevation, into the ring)
  over: [[0, 0], [170, -30], [400, -30], [640, HOLE.elevation], [970, HOLE.elevation]],
};
// tables on an even grid of ground metres: the crest's metres ahead of the lens (D), the lens's height (Y) and the
// metres flown along the fine curve
const STEP = 0.5;
const W_APPROACH = [[0, PLAN.far], [PLAN.slowFrom, PLAN.far], [PLAN.slowTo, PLAN.face]];
// the ground metres at which the crest is under the lens: the foot is under it at PLAN.footAt, and from there the
// lens and the wave together close the face's whole width
let G_CREST = PLAN.footAt;
for (let closed = 0; closed < WAVE.face; G_CREST += STEP) closed += STEP * (1 + eased(W_APPROACH, G_CREST + STEP / 2));
const G_END = G_CREST + PLAN.over[PLAN.over.length - 1][0];
const W_KNOTS = [...W_APPROACH, [G_CREST, PLAN.face], [G_CREST + 200, PLAN.behind]];
const NG = Math.round(G_END / STEP);
const TG = new Float64Array(NG + 1), TD = new Float64Array(NG + 1), TY = new Float64Array(NG + 1), TA = new Float64Array(NG + 1);
{
  const cum = new Float64Array(NG + 1);
  for (let i = 1; i <= NG; i++) cum[i] = cum[i - 1] + STEP * (1 + eased(W_KNOTS, (i - 0.5) * STEP));
  const d0 = cum[Math.round(G_CREST / STEP)];                       // the crest's metres ahead of the lens at the entry
  const clear = (xi) => PLAN.skim + (PLAN.faceClear - PLAN.skim) * S((WAVE.face + 80 - xi) / 280) + (PLAN.crestClear - PLAN.faceClear) * S((200 - xi) / 160);
  let yOver = 0;
  for (let i = 0; i <= NG; i++) {
    const g = i * STEP; TG[i] = g; TD[i] = d0 - cum[i];
    const over = TD[i] < WAVE.face ? WAVE.height * hollow(1 - Math.max(TD[i], 0) / WAVE.face, PLAN.capPath) : 0;
    if (g <= G_CREST) { TY[i] = over + clear(TD[i]) + (PLAN.entryHeight - PLAN.skim) * (1 - S(g / PLAN.entryRun)); yOver = TY[i]; }
    else { yOver += STEP * Math.tan(eased(PLAN.over, g - STEP / 2 - G_CREST) * DEG); TY[i] = yOver; }
    if (i) TA[i] = TA[i - 1] + Math.hypot(STEP, TY[i] - TY[i - 1]);
  }
}

// ---- THE ROUTE (the lens's path), [x, y, z]: knots at one even step along the curve of the plan. The last four
// stand in one line (the straight rise into the ring); the first leave level.
const KNOTS = Math.round(TA[NG] / 38);
export const ROUTE = Array.from({ length: KNOTS + 1 }, (_, i) => {
  const g = i === KNOTS ? G_END : read(TA, TG, TA[NG] * i / KNOTS);
  return [0, read(TG, TY, g), -g];
});
// the metres flown at each knot, measured along the knots, and the route's length
const KS = ROUTE.map(() => 0);
for (let i = 1; i <= KNOTS; i++) KS[i] = KS[i - 1] + Math.hypot(ROUTE[i][1] - ROUTE[i - 1][1], ROUTE[i][2] - ROUTE[i - 1][2]);
export const ROUTE_LENGTH = KS[KNOTS];
const KG = ROUTE.map((k) => -k[2]), KY = ROUTE.map((k) => k[1]);
// the lens's ground metres north of the entry, and its height, at s metres flown
export function groundOf(s) { return read(KS, KG, s); }
export function heightOf(s) { return read(KS, KY, s); }
// the metres flown at which the lens has covered g metres of ground
export function flownAt(g) { return read(KG, KS, g); }

// ---- THE WAVE'S PLACE by metres flown
// the crest line's metres of ground AHEAD of the lens (north of it); negative once the lens is over the crest
export function crestAhead(s) { return read(TG, TD, groundOf(s)); }
// the world z of the crest line; a point at world z stands at xi = z - crestZ(s) on the wave
export function crestZ(s) { const g = groundOf(s); return -(g + read(TG, TD, g)); }
export function nextCrestZ(s) { return crestZ(s) - WAVE.next; }

// ---- THE WAY OVER THE WAVE. In the wave's own frame the laid line is ONE FIXED CURVE (the wave's place is a
// function of the metres flown): wayHeight(xi) is the height of the line where it stands xi metres south of the crest
// line (xi < 0: north of it, over the back); the kit's curve through the route's knots runs within some 3 m of it.
// WHERE THAT LINE PASSES THROUGH A SHEET OF MIST OR SPRAY, THE SHEET IS THIN BY PLACE: clear within WAY.clear metres
// of the line, whole again from WAY.whole metres off it. A rule of the place, the same for every eye, seed and pace
// (the owner's ruling of 9 November: the thin place is a property of the place, not of the eye). The thinning by the
// eye itself stays inside the kit's near range (WAY.eye, metres).
// WAY.table: the line's heights from WAY.from to WAY.to (metres south of the crest line) in steps of WAY.step, for a
// shader's own copy of wayHeight (written out from here at build, never typed).
export function wayHeight(xi) {
  if (xi >= TD[0]) return TY[0];
  if (xi <= TD[NG]) return TY[NG];
  let a = 0, b = NG;
  while (b - a > 1) { const m = (a + b) >> 1; if (TD[m] >= xi) a = m; else b = m; }
  return TY[a] + (TY[b] - TY[a]) * (TD[a] - xi) / (TD[a] - TD[b]);
}
export const WAY = { clear: 6, whole: 28, eye: [0.6, 2.5], from: 780, to: -300, step: 10, table: [] };
for (let xi = WAY.from; xi >= WAY.to; xi -= WAY.step) WAY.table.push(wayHeight(xi));

// ---- WHAT STANDS ON THE SEA (world places; the wave reaches them long after the lens has passed them)
//   panels   a few floating hull panels and one amber beacon: the middle of their scatter, and its size across (east-west)
//            and along (north-south). clear: no edge of any of them lies nearer the route's plane than this many metres.
//   craft    the landing craft standing on its legs in the water, right of the route; nose is the level direction its
//            nose points (x, z): north and a little west
//   seenFrom the metres of the route before a thing is abeam from which the lens turns its look to it
export const PLACES = {
  panels: { x: -22, z: -250, across: 20, along: 36, clear: 11.6, seenFrom: 150 },
  craft: { x: 24, z: -430, nose: [-0.5, -0.866], length: 16, seenFrom: 190 },
};

// ---- THE STAGES of the flight, in metres flown (s). A part that opens, closes or times a thing takes it from here.
//   low        the lens is down at the skim's height
//   panels     the lens is abeam of the floating panels;   craft: abeam of the standing craft (the lens is at z = -g)
//   touch      the wave's crest, seen from the lens, reaches the foot of the hole's lower arch
//   half       it reaches the hole's centre;   swallowed: it stands over the top of the upper arch (the hole is gone)
//   foot       the wave's foot is under the lens;   crest: the crest is under the lens
//   rise       seen from the lens the crest sinks below the top of the upper arch again (the hole begins to rise over it)
//   dive       past the crest the route has tipped over to its steepest and dives down the back
//   pull       the dive down the back ends and the pull-up begins;   straight: the last straight rise to the ring begins
const crestElevation = (s) => Math.atan2(WAVE.height - heightOf(s), crestAhead(s)) / DEG;
function firstS(test, from = 0) { for (let s = from; s < ROUTE_LENGTH; s += 0.25) if (test(s)) return s; return ROUTE_LENGTH; }
const S_FOOT = flownAt(PLAN.footAt), S_CREST = flownAt(G_CREST);
export const STAGE = {
  low: flownAt(PLAN.entryRun),
  panels: flownAt(-PLACES.panels.z), craft: flownAt(-PLACES.craft.z),
  touch: firstS((s) => crestElevation(s) >= HOLE.elevation - HOLE.archBottom),
  half: firstS((s) => crestElevation(s) >= HOLE.elevation),
  swallowed: firstS((s) => crestElevation(s) >= HOLE.lightHigh),
  foot: S_FOOT, crest: S_CREST,
  rise: firstS((s) => crestElevation(s) <= HOLE.lightHigh, S_FOOT + 0.5 * (S_CREST - S_FOOT)),
  dive: flownAt(G_CREST + PLAN.over[1][0]),
  pull: flownAt(G_CREST + PLAN.over[2][0]), straight: flownAt(G_CREST + PLAN.over[3][0]),
};

// ---- THE HOLE GROWS past the crest: A DECLARED, SCRIPTED CHANGE by the metres flown (the flight is drawn toward the
// hole). holeGrow(s) multiplies every angular measure of the hole about its centre (its elevation stays): 1 until the
// lens is over the crest, HOLE.grow where the route ends in the ring; it grows all the way. The sky, and through it
// every mirror, draws the hole so grown; the stages above are all told before the crest, at its first measure.
export function holeGrow(s) { return 1 + (HOLE.grow - 1) * S((s - STAGE.crest) / (ROUTE_LENGTH - STAGE.crest)); }

// ---- THE RING (the way out) hangs in clear air high over the wave's back; the route's last 330 m of ground rise
// straight into it at the hole's own elevation, so that from the last straight the ring stands in the middle of
// the hole's disc of dark.
export const RING = { x: 0, y: ROUTE[KNOTS][1], z: ROUTE[KNOTS][2], radius: 30 };
// The wave runs over the ring's place long before the lens comes to it. The ring is left undrawn until its place is
// deep inside the wave's body (40 m of water over its top): RING_DRAWN is the metres flown at which that is so, and
// the world sets portal.drawWithin to the route's length from there on. It then stands whole when the lens comes
// over the crest.
export const RING_DRAWN = firstS((s) => waveHeight(RING.z - crestZ(s)) > RING.y + RING.radius + 40);

// ---- THE CRAFT'S COURSE (scripted by metres flown; its own course in the world, never the lens's). A DECLARED
// PACING: THE CRAFT GOES BEFORE THE VISITOR. It stands until the lens is abeam of it and a few metres on (LEAD.lift),
// lifts off behind the lens, overtakes it LEAD.side metres off on its right, and flies before it low over the sea to
// the wave (LEAD.sea metres ahead when the wave stands half over the hole, LEAD.wall when the hole is swallowed,
// LEAD.foot when the foot is under the lens), climbs the face ahead of the lens (LEAD.join ahead a fifth of the way
// up the climb, LEAD.mid at a little over half), is over the crest while the lens is still LEAD.over metres of
// ground short of it, crosses before the hole and goes away north-east, climbing. Its place is a station worked
// from where the lens is ON THE ROUTE (never from where the lens looks): the lens may turn away from it.
// From its lift-off its place is told ON THE WAVE: [s, x, xi, metres above the water under it, a height it never
// flies under]; between the rows a smooth curve. The first rows are its own run from its stand (LEAD.run: metres
// flown since the lift-off, and the metres it has then run north).
const COURSE_LEAD = { lift: 5, up: 12, run: [[20, 5], [60, 40]], abeam: 100, side: 26, out: 140, outAhead: 38, sea: 68, wall: 75, foot: 65, join: 45, mid: 85, over: 115 };
const C_LIFT = STAGE.craft + COURSE_LEAD.lift, C_JOIN = S_FOOT + 0.2 * (S_CREST - S_FOOT), C_MID = S_FOOT + 0.55 * (S_CREST - S_FOOT);
const C_OVER = firstS((s) => crestAhead(s) <= COURSE_LEAD.over, C_MID);
const C_AWAY = S_CREST + 0.15 * (ROUTE_LENGTH - S_CREST);
const standing = (s, ran) => PLACES.craft.z - ran - crestZ(s);          // xi of a point ran metres north of its stand
const leading = (s, ahead) => crestAhead(s) - ahead;                    // xi of a point ahead metres north of the lens
const COURSE = [
  [C_LIFT, PLACES.craft.x, standing(C_LIFT, 0), 0, 0],
  ...COURSE_LEAD.run.map(([flown, ran], i) => [C_LIFT + flown, PLACES.craft.x + 0.5 * (i + 1), standing(C_LIFT + flown, ran), 1.5 + 2.5 * i, 0]),
  [C_LIFT + COURSE_LEAD.abeam, COURSE_LEAD.side, leading(C_LIFT + COURSE_LEAD.abeam, 0), 6, 0],
  [C_LIFT + COURSE_LEAD.out, COURSE_LEAD.side - 1, leading(C_LIFT + COURSE_LEAD.out, COURSE_LEAD.outAhead), 8, 0],
  [STAGE.half, 20, leading(STAGE.half, COURSE_LEAD.sea), 11, 0],
  [STAGE.swallowed, 17, leading(STAGE.swallowed, COURSE_LEAD.wall), 14, 0],
  [S_FOOT, 16, leading(S_FOOT, COURSE_LEAD.foot), 14, 0],
  [C_JOIN, 15, leading(C_JOIN, COURSE_LEAD.join), 14, 0],
  [C_MID, 14, leading(C_MID, COURSE_LEAD.mid), 18, 0],
  [C_OVER, 10, 0, 22, WAVE.height + 22],
  [C_AWAY, 40, -430, 60, WAVE.height + 60],
  [ROUTE_LENGTH, 900, -2000, 60, WAVE.height + 170],
];
// a smooth curve through a table's rows (column k), read at s: each span a cubic that keeps the slope of the rows
// either side of a row (the ends keep their span's own slope)
function through(K, s, k) {
  const n = K.length;
  if (s <= K[0][0]) return K[0][k];
  if (s >= K[n - 1][0]) return K[n - 1][k];
  let i = 0; while (s > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], t = (s - K[i][0]) / h;
  const slope = (j) => (j <= 0 ? (K[1][k] - K[0][k]) / (K[1][0] - K[0][0]) : j >= n - 1 ? (K[n - 1][k] - K[n - 2][k]) / (K[n - 1][0] - K[n - 2][0])
    : (K[j + 1][k] - K[j - 1][k]) / (K[j + 1][0] - K[j - 1][0]));
  const m0 = slope(i) * h, m1 = slope(i + 1) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * K[i + 1][k] + (t3 - t2) * m1;
}
// the craft at s: its place [x, y, z] (y is the height of its lowest point: 0 while it stands in the water) and
// flying (0 while it stands, 1 once it is off the water: its two flames burn)
export function craft(s) {
  if (s <= C_LIFT) return { x: PLACES.craft.x, y: 0, z: PLACES.craft.z, flying: 0 };
  const xi = through(COURSE, s, 2);
  const y = Math.max(waveHeight(xi) + Math.max(0, through(COURSE, s, 3)), s > C_OVER ? through(COURSE, s, 4) : 0);
  return { x: through(COURSE, s, 1), y, z: crestZ(s) + xi, flying: S((s - C_LIFT) / COURSE_LEAD.up) };
}
// lift: it leaves the water;   up: its flames burn fully (COURSE_LEAD.up metres flown later);   the rest as told above
export const CRAFT_STAGE = { lift: C_LIFT, up: C_LIFT + COURSE_LEAD.up, join: C_JOIN, mid: C_MID, over: C_OVER, away: C_AWAY };

// ---- THE HOLE'S LIGHT behind the wave: the share of it that reaches a point at height y and world z at s metres
// flown (1: all of it; 0: the wave stands before the whole hole). North of the crest line nothing stands before it.
export function holeShare(y, z, s) {
  const xi = z - crestZ(s);
  if (xi <= 0) return 1;
  const el = Math.atan2(WAVE.height - y, xi) / DEG;
  return 1 - S((el - HOLE.lightLow) / (HOLE.lightHigh - HOLE.lightLow));
}

// ---- THE FLIGHT'S PACE (shape only; the engine scales it to FLIGHT_SECONDS): unhurried over the calm sea, quicker
// up the face and down the back, unhurried again into the ring. A pure function of u; its keys are places of the
// flight (the stages above as shares of the route), none is a typed share: unhurried until the hole is swallowed,
// at its quickest from three tenths of the way up the face until the pull-up begins, eased by the last straight.
const PACE = [[0, 0.8], [STAGE.swallowed / ROUTE_LENGTH, 0.78], [(STAGE.foot + 0.3 * (STAGE.crest - STAGE.foot)) / ROUTE_LENGTH, 1.2],
  [STAGE.pull / ROUTE_LENGTH, 1.2], [STAGE.straight / ROUTE_LENGTH, 1], [1, 1]];
export function pace(u) { return eased(PACE, u); }
