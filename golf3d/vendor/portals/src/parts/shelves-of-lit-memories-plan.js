// SHELVES OF LIT MEMORIES: the plan. Typed places in metres (x east, y up, z south; the flight goes south). Pure data and pure
// functions with no imports, so that a count in node reads the same places the world builds from.
// (The route's builder keeps this file and says every change of a shared number.)
// PLACED TO BE SEEN WELL FROM THE WAY, typed, the same on every seed: tube F, beside the dive; the far-west island, over the whole
// stretch from the wheel to the ring.
//
// THE PLAIN OF LONG-TERM MEMORY lies at y 0: tall curving SHELF WALLS in folds like the folds of a brain, lanes between them.
// THE CHASM (the dump) is a round pit in the plain: its rim at y 0, its walls sheer, its depth lost in dark haze.
export const CHASM = { x: 0, z: 900, r: 520 };
// THE TOWER (headquarters) stands in the chasm's middle on a slim stem out of the depths: a rounded pod, its foot at `y0`, its
// crown at `y1`, `r` its greatest radius; one great band of window faces NORTH (toward the flight), from `win0` to `win1` up.
export const TOWER = { x: 0, z: 900, y0: 44, y1: 176, r: 68, win0: 78, win1: 136, collar: 84 };      // `collar`: the radius of the ring terrace at its foot
// THE RING stands free on its own round platform on a slim stem of its own, north of the tower, before its window
export const PLAT = { x: 0, z: 760, r: 17, deck: 65 };      // the deck lies half a metre under the ring's foot
export const RING = { x: PLAT.x, y: PLAT.deck + 14.5, z: PLAT.z, r: 14 };      // its middle 79.5 m up
// THE ISLANDS on their stems (each: its middle, its top's height, its radius). The first is passed close.
export const ISLES = [
  { name: 'funfair', x: 62, z: 600, y: 45, r: 68 },
  { name: 'rink', x: -235, z: 690, y: 38, r: 75 },
  { name: 'house', x: 250, z: 820, y: 50, r: 70 },
  { name: 'far-west', x: -250, z: 1090, y: 44, r: 72 },      // far-west is placed to be seen well from the way, over the whole stretch from the wheel to the ring, typed, the same on every seed
  { name: 'far-east', x: 290, z: 1090, y: 40, r: 70 },
];
// THE GREAT WHEEL on the funfair island's west edge: its disc stands in the plane x = WHEEL.x (it faces west and east), its
// axle along x; the flight passes its west face about 40 m off, at the axle's height.
export const WHEEL = { x: 8, y: 81, z: 600, r: 30 };

// THE FOLDS BY THE ROUTE. The route's own lane follows THE SPINE (a smooth curve through these points, in plan); the shelf
// walls beside it are the spine's offsets: walls LANE.wall thick, lanes LANE.lane wide, so a wall's middle lies
// (k + 0.5) * LANE.pitch to either side of the spine for k = 0, 1, 2 ... The lane ends at the chasm's rim (THE MOUTH).
// (the spine is the curve x = -48 cos(pi (z - 381) / 270), sampled every 67.5 m: bends of 154 m radius at the least, heading due south at the mouth)
export const SPINE = [[42.6, -470], [48, -429], [33.9, -361.5], [0, -294], [-33.9, -226.5], [-48, -159], [-33.9, -91.5], [0, -24], [33.9, 43.5], [48, 111], [33.9, 178.5], [0, 246], [-33.9, 313.5], [-48, 381], [-43.2, 420]];
export const LANE = { pitch: 25, wall: 7, lane: 18, wallH: 38, shelves: 12, shelf0: 2.5, shelfDy: 3, orbR: 1.0, orbDs: 2.6 };
// a place on the spine: t from 0 to SPINE.length - 1 (a Catmull-Rom curve through the points); returns [x, z, tx, tz] with the
// unit tangent (tx, tz). The unit normal to the LEFT hand of the direction of flight is (tz, -tx); to the right hand (-tz, tx).
export function spineAt(t) {
  const n = SPINE.length - 1, tt = Math.min(Math.max(t, 0), n), i = Math.min(Math.floor(tt), n - 1), u = tt - i;
  const P = (j) => SPINE[Math.min(Math.max(j, 0), n)], p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
  const c = (a, b, cc, d) => 0.5 * (2 * b + (cc - a) * u + (2 * a - 5 * b + 4 * cc - d) * u * u + (3 * b - a - 3 * cc + d) * u * u * u);
  const dc = (a, b, cc, d) => 0.5 * ((cc - a) + 2 * (2 * a - 5 * b + 4 * cc - d) * u + 3 * (3 * b - a - 3 * cc + d) * u * u);
  const x = c(p0[0], p1[0], p2[0], p3[0]), z = c(p0[1], p1[1], p2[1], p3[1]);
  let tx = dc(p0[0], p1[0], p2[0], p3[0]), tz = dc(p0[1], p1[1], p2[1], p3[1]); const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  return [x, z, tx, tz];
}
export const rimZ = (x) => CHASM.z - Math.sqrt(Math.max(CHASM.r * CHASM.r - (x - CHASM.x) * (x - CHASM.x), 0));      // the chasm's north rim at x (the plain lies north of it)

// THE ROUTE (laid by rule from the spine; the kit's path runs through its points): in high over the folds from the north, the
// islands and the tower far ahead; a dive that swings in onto the route's own lane; low along the lane through its bends; a climb
// out of the lane along its middle; out over the chasm at the lane's mouth; up past the funfair island's great wheel (on the left
// hand, 40 m off its face); then straight and level to the ring before the tower's window.
//  THE ENTRY stands SWING metres east of the spine's place at t ROUTE_T0 (over the fifth wall east of the lane), HIGH up.
//  INTO is the spine's place where the lane's true balls begin (z INTO_Z): there the line comes down to the wall tops' height, on
//  the lane's middle. THE SWING IN, a smooth step, is gone by that place (tube A lies on the wall top west of the spine there).
//  THE DIVE is straight from the entry to INTO: its slope is what those two places give.
//  From INTO the line carries the dive's own slope on down between the walls and flares out softly to the lane's height (LOW
//  over the floor). LEVEL is the place where the line is 4 m over the lane's height.
//  THE CLIMB OUT OF THE LANE, along its middle, begins at the border between the blue district and the gold district with red and
//  green (the spine's z CLIMB0) and tops out, OVER_Y up, at the border where the violet district begins (z CLIMB1). A small second
//  rise over the chasm ends level at the ring's height 16 m past abeam the wheel.
//  The line: a point at every half step of the spine from the entry to the mouth and one more at INTO; then one cubic in plan over
//  the chasm from the mouth to abeam the wheel; then the last straight to the ring.
export const MOUTH = [-48, 63, 384];          // out over the chasm's rim (the line crosses it 63 m up, 21 m over the trains' track)
export const ABEAM = [-32, 80, 600];          // the great wheel's axle is due east (the line passes 1 m under this height)
const ROUTE_T0 = 1.5, ROUTE_T1 = 13;          // the stretch of the spine the route flies (t of spineAt): from the entry to the mouth
const HIGH = 124, LOW = 14.5, FLARE = 6;      // the entry's height; the height in the lane; the flare's softness (m)
const SWING = 110;                            // the line enters this far east of the spine
const INTO_Z = -215;                          // the spine's z where the lane's true balls begin
const CLIMB0 = 40, CLIMB1 = 230, OVER_Y = 62; // the climb out of the lane: between these z of the spine (two borders of districts), to this height
const RISE0 = 340, RISE1 = 616;               // the second, small rise from there to the ring's height, between these z (a smooth step)
const sstep = (a, b, z) => { const s = Math.min(Math.max((z - a) / (b - a), 0), 1); return s * s * (3 - 2 * s); };
const r2 = (v) => Math.round(v * 100) / 100;
const riseAt = (z) => (OVER_Y - LOW) * sstep(CLIMB0, CLIMB1, z) + (RING.y - OVER_Y) * sstep(RISE0, RISE1, z);
const T_INTO = (() => { let lo = ROUTE_T0, hi = ROUTE_T1; for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (spineAt(m)[1] < INTO_Z) lo = m; else hi = m; } return (lo + hi) / 2; })();      // the spine's t at INTO
const flareAt = (h) => FLARE * Math.log(Math.exp(h / FLARE) - 1);      // the flare's own measure at a height h over the lane's height
function layRoute() {
  const ts = []; for (let i = 0; i <= (ROUTE_T1 - ROUTE_T0) * 2; i++) ts.push(ROUTE_T0 + i / 2); ts.push(T_INTO); ts.sort((p, q) => p - q);
  const sp = ts.map((t) => spineAt(t)), ds = [0]; for (let i = 1; i < sp.length; i++) ds.push(ds[i - 1] + Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]));      // metres along the spine in plan from the entry
  const iInto = ts.indexOf(T_INTO), xs = sp.map((s, i) => s[0] + SWING * (1 - sstep(0, ds[iInto], ds[i]))), ls = [0];
  for (let i = 1; i < sp.length; i++) ls.push(ls[i - 1] + Math.hypot(xs[i] - xs[i - 1], sp[i][1] - sp[i - 1][1]));      // metres along the laid line in plan
  const lInto = ls[iInto], s0 = flareAt(LANE.wallH - LOW), k = (HIGH - LANE.wallH) / lInto;
  const out = sp.map((s, i) => [r2(xs[i]), r2((ls[i] <= lInto ? HIGH - (HIGH - LANE.wallH) * ls[i] / lInto : LOW + FLARE * Math.log(1 + Math.exp((s0 - k * (ls[i] - lInto)) / FLARE))) + riseAt(s[1])), r2(s[1])]);
  // over the chasm: from the mouth (heading as the spine does there) to abeam the wheel (heading as the last straight does), one cubic in plan
  const e = spineAt(ROUTE_T1), z0 = e[1], z1 = ABEAM[2], h = z1 - z0, m0 = e[2] / e[3], m1 = (RING.x - ABEAM[0]) / (RING.z - ABEAM[2]);
  for (const z of [408, 435, 462, 489, 516, 544, 572, 600]) {
    const s = (z - z0) / h, s2 = s * s, s3 = s2 * s;
    out.push([r2(e[0] * (2 * s3 - 3 * s2 + 1) + ABEAM[0] * (3 * s2 - 2 * s3) + h * (m0 * (s3 - 2 * s2 + s) + m1 * (s3 - s2))), r2(LOW + riseAt(z)), z]);
  }
  for (const z of [640, 680, 720]) out.push([r2(ABEAM[0] + m1 * (z - z1)), r2(LOW + riseAt(z)), z]);      // the last straight (160 m), level from RISE1
  out.push([RING.x, RING.y, RING.z]);
  return out;
}
export const ROUTE = layRoute();
export const ENTRY = ROUTE[0];
// level in the lane from here: the dive is flaring out (the place where the laid line comes within 4 m of the lane's height)
export const LEVEL = (() => { for (let i = 1; i < ROUTE.length; i++) { const a = ROUTE[i - 1], b = ROUTE[i], h = LOW + 4; if (a[1] > h && b[1] <= h) { const k = (a[1] - h) / (a[1] - b[1]); return [r2(a[0] + (b[0] - a[0]) * k), h, r2(a[2] + (b[2] - a[2]) * k)]; } } return ROUTE[0]; })();
// the climb out of the lane begins here (the place on the laid line at z CLIMB0)
export const CLIMB = (() => { for (let i = 1; i < ROUTE.length; i++) { const a = ROUTE[i - 1], b = ROUTE[i]; if (a[2] < CLIMB0 && b[2] >= CLIMB0) { const k = (CLIMB0 - a[2]) / (b[2] - a[2]); return [r2(a[0] + (b[0] - a[0]) * k), r2(a[1] + (b[1] - a[1]) * k), CLIMB0]; } } return MOUTH; })();
// over the wall tops again from here: out of the lane (the place where the laid line rises through the walls' height)
export const OVER = (() => { let inLane = false; for (let i = 1; i < ROUTE.length; i++) { const a = ROUTE[i - 1], b = ROUTE[i]; if (b[1] < LANE.wallH) inLane = true; if (inLane && a[1] < LANE.wallH && b[1] >= LANE.wallH) { const k = (LANE.wallH - a[1]) / (b[1] - a[1]); return [r2(a[0] + (b[0] - a[0]) * k), LANE.wallH, r2(a[2] + (b[2] - a[2]) * k)]; } } return MOUTH; })();
// under the wall tops from here: in the lane (the spine's place where the lane's true balls begin, at the wall tops' height)
export const INTO = (() => { const s = spineAt(T_INTO); return [r2(s[0]), LANE.wallH, r2(s[1])]; })();

// THE ORBS' COLOURS (shared by the shelves, the tubes and the chasm's sinking orbs): mostly gold; runs of the other four; a few grey
export const ORB = { gold: 0xffc94a, blue: 0x4a9dff, red: 0xff5548, green: 0x6fdc6a, violet: 0xb07aff, grey: 0x8a8a98 };
export const ORB_SHARE = { gold: 0.52, blue: 0.14, red: 0.10, green: 0.10, violet: 0.10, grey: 0.04 };
// HOW THE PARTS MEET (one function each, called by the world file in build(); each returns { object, update, dispose }):
//   src/parts/shelves-of-lit-memories-shelves.js : export async function buildShelves(ctx, shared)
//   src/parts/shelves-of-lit-memories-isles.js   : export async function buildIsles(ctx, shared)
//   src/parts/shelves-of-lit-memories-ride.js    : export async function buildRide(ctx, shared)
// `shared` is made by the world file: { uTime: { value: 0 } (seconds of the world's clock, set every frame), mist: 0 or 1 }.
// object: a THREE.Group to add to the scene; update(t, dt, camera): called every frame (may be absent); dispose(): frees what the part made.

// ---------------- THE RIDE'S TYPED COURSES (the route's builder; read by the part -ride and by the counts in node) ----------------
// a place beside the spine: `off` metres to the LEFT hand of the flight (negative: to the right hand, the west side at the mouth), `y` up
export const beside = (t, off, y) => { const s = spineAt(t); return [s[0] + s[3] * off, y, s[1] - s[2] * off]; };
// a smooth curve through way points (a cubic through each span, slopes weighed by the chords), sampled densely, then laid out again
// as `n` points EVENLY spaced along it: the course is the plain Catmull-Rom curve through those (courseAt), the same sum on the page's
// processor and in a vertex shader, so that what runs along a course by the clock runs evenly.
export function evenCourse(way, n, closed = false) {
  const N = way.length, W = (i) => (closed ? way[((i % N) + N) % N] : way[Math.min(Math.max(i, 0), N - 1)]);
  const chord = (i) => Math.max(Math.hypot(W(i + 1)[0] - W(i)[0], W(i + 1)[1] - W(i)[1], W(i + 1)[2] - W(i)[2]), 1e-3);
  const slope = (i) => { const h0 = chord(i - 1), h1 = chord(i), a = W(i - 1), b = W(i), c = W(i + 1);
    if (!closed && i === 0) return [0, 1, 2].map((k) => (c[k] - b[k]) / h1);
    if (!closed && i === N - 1) return [0, 1, 2].map((k) => (b[k] - a[k]) / h0);
    return [0, 1, 2].map((k) => ((c[k] - b[k]) / h1 * h0 + (b[k] - a[k]) / h0 * h1) / (h0 + h1)); };
  const dense = [], spans = closed ? N : N - 1;
  for (let i = 0; i < spans; i++) { const h = chord(i), a = W(i), b = W(i + 1), ma = slope(i), mb = slope(closed ? (i + 1) % N : i + 1);
    for (let j = 0; j < 24; j++) { const s = j / 24, s2 = s * s, s3 = s2 * s;
      dense.push([0, 1, 2].map((k) => a[k] * (2 * s3 - 3 * s2 + 1) + b[k] * (3 * s2 - 2 * s3) + h * (ma[k] * (s3 - 2 * s2 + s) + mb[k] * (s3 - s2)))); } }
  dense.push(closed ? dense[0].slice() : way[N - 1].slice());
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1], dense[i][2] - dense[i - 1][2]));
  const L = cum[cum.length - 1], out = [], m = closed ? n : n - 1; let j = 0;
  for (let i = 0; i < n; i++) { const d = L * i / m; while (j < dense.length - 2 && cum[j + 1] < d) j++;
    const f = (d - cum[j]) / Math.max(cum[j + 1] - cum[j], 1e-6); out.push([0, 1, 2].map((k) => dense[j][k] + (dense[j + 1][k] - dense[j][k]) * f)); }
  return { points: out, length: L, closed };
}
// a place on a course: t from 0 to n - 1 (open) or 0 to n (closed, wrapping); returns [x, y, z, tx, ty, tz] (the tangent is not of unit length)
export function courseAt(c, t) {
  const P = c.points, n = P.length, tt = c.closed ? ((t % n) + n) % n : Math.min(Math.max(t, 0), n - 1.0001), i = Math.floor(tt), u = tt - i;
  const Q = (k) => (c.closed ? P[((k % n) + n) % n] : P[Math.min(Math.max(k, 0), n - 1)]), p0 = Q(i - 1), p1 = Q(i), p2 = Q(i + 1), p3 = Q(i + 2), out = [0, 0, 0, 0, 0, 0];
  for (let k = 0; k < 3; k++) { const b = p2[k] - p0[k], cc = 2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k], d = 3 * p1[k] - p0[k] - 3 * p2[k] + p3[k];
    out[k] = 0.5 * (2 * p1[k] + b * u + cc * u * u + d * u * u * u); out[k + 3] = 0.5 * (b + 2 * cc * u + 3 * d * u * u); }
  return out;
}
// THE GLASS TUBES (six: A to E, and F, told at its own way below), each from the shelves to the tower's crown (way points listed from the shelves' end): `r` the glass's
// radius (an orb of 1 m radius runs inside), `top` the height of a tube's middle where it lies along a wall's top. A rises out of the top of the wall on the right
// hand of the route's lane (12.5 m west of the spine) at spine t 3.3, lies along that wall's top to t 7.75, swings across the lane
// 46 m up between t 8.1 and t 9.5 (the lane's first bend), runs on south-south-east over the walls' tops to the rim at (140, 399)
// and arcs up over the chasm to the crown. B comes off the top of the fifth wall west of the lane (112.5 m west of the spine, the
// outermost true wall) and arcs up from the rim at (-160, 405). C, D and E go out east, south-south-east and west and come down
// into the far plain 222 m beyond the rim. All five keep clear of the islands.
export const TUBE = { r: 1.9, top: LANE.wallH + 2.4 };
const ARC = [[420, 100], [320, 141], [220, 172], [130, 190], [70, 193.5], [32, 188.5], [12, 180], [3, TOWER.y1 - 4]];      // a tube's arc over the chasm: metres out from the tower's middle, metres up
const out = (az, d, y) => [TOWER.x + Math.sin(az) * d, y, TOWER.z - Math.cos(az) * d];      // az: radians east of north, seen from the tower
const arcWay = (az) => ARC.map(([d, y]) => out(az, d, y));
const farWay = (az) => [out(az, 742, -4), out(az, 722, 1.5), out(az, 692, 7.5), out(az, 652, 17.5), out(az, 608, 30), out(az, 564, 43.5), out(az, 520, 57), ...arcWay(az)];      // down into the far plain, whose folds are drawn on level ground
const A_RIM = [140, 57, rimZ(140)], B_RIM = [-160, 57, rimZ(-160)], F_AZ = -1.2 * Math.PI / 180;      // F_AZ: tube F comes to the crown from 1.2 degrees west of north
// tube F's places by the dive: the dive is the route's first leg, from the entry to INTO
const F_SIDE = 15, F_Y = (HIGH + LANE.wallH) / 2;      // metres beside the flown line in plan; the height the flown line has midway down the dive
const DIVE_LEG = (() => { const pts = [ROUTE[0]], cum = [0]; for (let i = 1; i < ROUTE.length && ROUTE[i - 1][2] < INTO[2]; i++) { pts.push(ROUTE[i]); cum.push(cum[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][2] - ROUTE[i - 1][2])); } return { pts, cum }; })();
// a place beside the dive: at the share q of the dive's metres in plan, `side` metres to the left hand of the line, `y` up
const besideDive = (q, side, y) => { const { pts, cum } = DIVE_LEG, dd = q * cum[cum.length - 1]; let i = 1; while (i < pts.length - 1 && cum[i] < dd) i++;
  const a = pts[i - 1], b = pts[i], f = (dd - cum[i - 1]) / (cum[i] - cum[i - 1]), tx = b[0] - a[0], tz = b[2] - a[2], h = Math.hypot(tx, tz);
  return [a[0] + tx * f + (tz / h) * side, y, a[2] + tz * f - (tx / h) * side]; };
const between = (a, b, f, fy) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * fy, a[2] + (b[2] - a[2]) * f];
const F_FOOT = beside(1.5, 112.5, LANE.wallH), F_RUN = [0.3, 0.36, 0.42, 0.5, 0.575].map((q) => besideDive(q, F_SIDE, F_Y));      // where it comes out of the wall top; its level run
const TUBE_WAYS = [
  [beside(3.3, -12.5, 25), beside(3.5, -12.5, 34.5), beside(3.75, -12.5, 39.9), beside(4.05, -12.5, TUBE.top), beside(4.6, -12.5, TUBE.top), beside(5.2, -12.5, TUBE.top),
    beside(5.8, -12.5, TUBE.top), beside(6.4, -12.5, TUBE.top), beside(7, -12.5, TUBE.top), beside(7.45, -12.5, TUBE.top), beside(7.75, -12.5, TUBE.top),
    beside(8.1, -10.5, 42), beside(8.45, -3, 45), beside(8.8, 6.5, 46), beside(9.15, 17, 46), beside(9.5, 31, 46),
    [86, 46.3, 198], [100, 47, 246], [116, 48.5, 296], [130, 51.5, 346], A_RIM, ...arcWay(Math.atan2(A_RIM[0] - TOWER.x, TOWER.z - A_RIM[2]))],
  [beside(10.5, -112.5, 25), beside(10.7, -112.5, 34.5), beside(10.95, -112.5, 39.9), beside(11.25, -112.5, TUBE.top), beside(11.7, -112.5, TUBE.top), beside(12.15, -112.5, TUBE.top),
    beside(12.6, -112.5, 42.2), [-159, 48, 370], B_RIM, ...arcWay(Math.atan2(B_RIM[0] - TOWER.x, TOWER.z - B_RIM[2]))],
  farWay(97 * Math.PI / 180), farWay(150 * Math.PI / 180), farWay(-82 * Math.PI / 180),
  // F: placed to be seen well from the way, typed, beside the dive, the same on every seed. It rises out of the top of the fifth
  // wall east of the lane (the wall under the entry), climbs to F_Y (the height the flown line has midway down the dive, so the
  // line passes it halfway down), runs level there F_SIDE metres beside the flown line on its left hand (its places computed from
  // the dive's own line), then leaves it and arcs on high over the plain (206 m up at the most) to the crown from due north,
  // between A and B.
  [beside(1.36, 112.5, 26), F_FOOT, between(F_FOOT, F_RUN[0], 0.4, 0.36), between(F_FOOT, F_RUN[0], 0.75, 0.78), ...F_RUN, besideDive(0.66, F_SIDE + 7, F_Y + 6), besideDive(0.78, F_SIDE + 21, F_Y + 17),
    [40, 144, -140], [40, 170, -40], [38, 190, 80], [30, 201, 220], [16, 206, 360],
    ...[[420, 206], [320, 204.5], [220, 201], [130, 196.5], [70, 193.5], [32, 188.5], [12, 180], [3, TOWER.y1 - 4]].map(([d, y]) => out(F_AZ, d, y))],
];
export const TUBES = TUBE_WAYS.map((w, i) => evenCourse(w, [44, 30, 28, 28, 28, 64][i]));
// THE TRAINS' TRACK: one closed loop, floating; listed the way the trains run. From over the chasm's edge west of the lane's mouth
// (42 m up) east across the mouth 17 m beyond the walls' ends (the flown line passes 21 m over it), round the funfair island's
// north side 30 m off its edge, down the island's east side, round the south half of the tower's ring terrace (8 m outside the
// collar, 1.5 m over the tower's foot: a round of 92 m radius, 45.5 m up), and back north past the rink island's east edge. `gauge`: between the rails' middles.
export const RAIL = { gauge: 2.4, speed: 16 };
const TERRACE = TOWER.collar + 8, TERRACE_Y = TOWER.y0 + 1.5;      // the track's round about the tower: 8 m outside the collar, 1.5 m over the foot
const TRACK_WAY = [
  [-124, 42, 416], [-92, 42, 402], [-50, 42, 398], [-8, 43.5, 412], [30, 45.5, 446], [68, 47.5, 482], [112, 49, 512], [152, 50.5, 562], [174, 52, 626], [176, 52.5, 700],
  [162, 50.5, 770], [134, 48, 832], [108, 46.2, 872], [TERRACE, TERRACE_Y, 900], [TERRACE * 0.7071, TERRACE_Y, 900 + TERRACE * 0.7071], [0, TERRACE_Y, 900 + TERRACE],
  [-TERRACE * 0.7071, TERRACE_Y, 900 + TERRACE * 0.7071], [-TERRACE, TERRACE_Y, 900], [-108, 45.6, 870],
  [-130, 45.8, 824], [-146, 46, 766], [-151, 45.6, 700], [-152, 45, 632], [-153, 44, 562], [-150, 43, 494], [-143, 42.2, 448]];
export const TRACK = evenCourse(TRACK_WAY, 56, true);
