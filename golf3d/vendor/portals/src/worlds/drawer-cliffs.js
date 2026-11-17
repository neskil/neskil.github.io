// THE DRAWER CLIFFS: a golden-afternoon river canyon whose walls are polished chests of drawers
// three hundred metres high. Drawers slide out carrying meadows and pools that pour as waterfalls
// until the drawer slides shut and the fall is cut off in mid-air. The canyon is closed by the
// Tallboy (src/parts/drawer-cliffs.js), whose nine open drawers we climb like a stair to a keyhole.
//
// Layout (world space = the Tallboy's own space: its front faces +Z, river at y 0):
//   leg one   230 m straight, heading 35 degrees right of -Z, canyon 130 m wide;
//   the bend  35 degrees left, radius 180 m;
//   leg two   straight down -Z from z 660 to the Tallboy's bottom drawer, canyon 110 m wide;
//   the climb one turn of a helix round the Tallboy's left flank: out over the open sea west of the canyon, where
//   more chests of drawers stand in the shallow water with drawers out and falls into the sea; back over the
//   canyon 220 m up; across the right wall's top past the candle on the fifth chest; then over the top lip, low
//   across the top pool past the stag and the last 60 m straight into the keyhole plate that hangs in the dark hall.
// Seeded looks: timber (walnut and brass, satinwood and silver, bog oak and boxwood knobs), hour (golden afternoon,
//   amber evening, morning after rain), what the drawers hold (summer meadows with deer, apple orchards with goats
//   and falling petals, heather with geese). Rare event: every drawer on the run-in shuts in a wave coming toward
//   us, the falls are cut together and hang as dropping columns, then the drawers reopen one by one.
// The sun is on the left all the way (115 degrees left of the last heading), so the right wall is
// raked with light, the left wall is in warm shade, and the low chests on the left let slabs of
// sun across the river. Shade is analytic: up to 12 boxes ray-tested in the shaders (uBoxA/uBoxB).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, Geo, PGeo, addAnimal, addTree, pl, FS_HEAD, WOOD_FS, BRASS_FS, FALL_FS, PROP_VS, PROP_FS } from '../parts/drawer-cliffs.js';

const D2R = Math.PI / 180;
// ---- plan ----
const BEND = 35 * D2R, RB = 180, ZB = 660;                         // bend angle, radius, z where leg two begins
const H0 = [Math.sin(BEND), -Math.cos(BEND)];                      // leg-one heading (x, z)
const R0 = [Math.cos(BEND), Math.sin(BEND)];                       // leg-one right
const ARC0 = [-RB + RB * Math.cos(BEND), ZB + RB * Math.sin(BEND)]; // where the bend begins
const P0 = [ARC0[0] - 230 * H0[0], ARC0[1] - 230 * H0[1]];         // the entry point
const leg1 = (s, across, y = 0) => [P0[0] + H0[0] * s + R0[0] * across, y, P0[1] + H0[1] * s + R0[1] * across];
const YAW1L = Math.atan2(R0[0], R0[1]), YAW1R = Math.atan2(-R0[0], -R0[1]);   // yaw that turns local +Z toward the canyon
const ease = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
const ramp = (u, a, b) => ease((u - a) / (b - a));
const knots = (m, K) => { if (m <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (m < K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * (m - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); const a = K[K.length - 2], b = K[K.length - 1]; return b[1] + (b[1] - a[1]) * (m - b[0]) / (b[0] - a[0]); };      // straight lines through [metres, value]
// the helix up the Tallboy: centre x, centre z, radius. From its westernmost point on it is a plain helix: [degrees turned, height]
const HELIX = [-55, 317, 80], HELIX_W = 22;
const HELIX_Y = [[180, 164.7], [210, 187.5], [240, 211.5], [270, 237], [300, 262], [330, 284], [360, 298.5]];
// the candle on the last dresser of the right wall (x, z) and that dresser's top: twelve tiers of an 82 m front
const CANDLE = [99, 302], DRESSER_TOP = 16 + 12 * 30 * ((82 - 12) / 110) + 20;
// the ribbon of big key-swifts that crosses the run-in: out of the right wall, low over the river, up and away over the last low chest
const RIBBON = [[86, 35, 286], [70, 36, 290], [45, 38, 293], [20, 40, 297], [-5, 42, 299], [-30, 50, 296], [-55, 72, 280], [-75, 112, 250]];
// THE ROUTE. Leg one, the bend and leg two up the river to the stair's foot; then one left-hand turn that never turns back:
//   the pass   from the foot a straight climb, then an arc of radius 48 m that comes tangent to a line parallel to the third drawer's bow front,
//              8.6 m outside the plane of its left handle's bail and level with it: the flight passes that handle with the front on its right;
//   the sweep  a quarter of an ellipse out over the open sea to the helix's westernmost point;
//   the helix  half a turn more, back over the canyon and the right wall's top, onto the Tallboy's centre line at the height of the keyhole;
//   the top    level over the stair of meadows, low across the top pool past the stag, the last 60 m straight and rising 16 degrees into the plate.
// handle: the centre of that handle's bail as the Tallboy stands when the flight reaches it (the drawer breathes a metre or so).
function routePoints(seat, pitch, handle) {
  const pts = [], at = {};
  for (const [s, y, ac] of [[0, 20, 0], [30, 22, -1.5], [60, 26, -4.5], [95, 29.5, -6], [130, 24.5, -3.5], [165, 20, -1], [200, 19.5, 0], [230, 20, 0]]) pts.push(leg1(s, ac, y));
  for (const f of [0.25, 0.5, 0.75, 1]) { const a = BEND * (1 - f); pts.push([-RB + RB * Math.cos(a), 20, ZB + RB * Math.sin(a)]); }
  pts.push([0, 19, 580], [0.5, 17, 510], [4.5, 15.5, 460], [12, 15, 415], [19.5, 16, 375], [23.6, 18.5, 344]);
  const F = [25, 24, 317]; at.foot = pts.length; pts.push(F);
  {
    const R = 48, hp = 88 * D2R, Q1 = [handle.x + 6, handle.y - 0.4, handle.z + 9.3], C = [Q1[0] - R * Math.cos(hp), Q1[2] + R * Math.sin(hp)];
    const on = (h) => [C[0] + R * Math.cos(h), C[1] - R * Math.sin(h)];
    let h0 = 0; for (let k = 0; k < 40; k++) { const q = on(h0); h0 = Math.atan2(F[0] - q[0], F[2] - q[1]); }      // where the straight climb from the foot touches the arc
    const p0 = on(h0), run = Math.hypot(F[0] - p0[0], F[2] - p0[1]), tot = run + R * (hp - h0), yAt = (s) => F[1] + (Q1[1] - F[1]) * Math.pow(clamp(s / tot, 0, 1), 0.92);
    for (const f of [0.36, 0.72]) pts.push([F[0] + (p0[0] - F[0]) * f, yAt(run * f), F[2] + (p0[1] - F[2]) * f]);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) { const h = h0 + (hp - h0) * f, q = on(h); if (f === 1) at.pass = pts.length; pts.push([q[0], yAt(run + R * (h - h0)), q[1]]); }
    const Q2 = [Q1[0] - Math.sin(hp) * 17, handle.y + 3.4, Q1[2] - Math.cos(hp) * 17]; pts.push(Q2);
    const Wp = [HELIX[0] - HELIX_W + HELIX[2] * Math.cos(Math.PI), HELIX_Y[0][1], HELIX[1]], ax = Q2[0] - Wp[0], az = Wp[2] - Q2[2];
    for (const f of [0.15, 0.3, 0.45, 0.6, 0.74, 0.87]) { const th = f * Math.PI / 2; pts.push([Q2[0] - ax * Math.sin(th), Q2[1] + (Wp[1] - Q2[1]) * Math.pow(f, 1.05), Wp[2] - az * Math.cos(th)]); }
  }
  for (const [deg, y] of HELIX_Y) { const a = deg * D2R, cx = HELIX[0] - HELIX_W * (1 - smoothstep(190, 262, deg)); at[deg === 180 ? 'west' : deg === 360 ? 'top' : 'h' + deg] = pts.length; pts.push([cx + HELIX[2] * Math.cos(a), y, HELIX[1] - HELIX[2] * Math.sin(a)]); }
  pts.push([25, 299.3, 272], [21, 300, 228], [13, 299.5, 185]); at.lip = pts.length; pts.push([5.5, 297, 130], [1.5, 294, 96], [0, 291.2, 76]);
  pts.push([0, seat.y - 60 * Math.sin(pitch), seat.z + 60 * Math.cos(pitch)], [0, seat.y - 30 * Math.sin(pitch), seat.z + 30 * Math.cos(pitch)], [seat.x, seat.y, seat.z]);
  pts.at = at;
  return pts;
}
// The places of the route in metres flown: foot (the stair's foot), pass (abeam of the handle), west (the helix's westernmost point), h210 .. h330
// (degrees of the helix), top (the helix ends on the centre line), lip (the Tallboy's top lip), end. Everything timed on the climb is written against these.
function placesOf(path, pts, handle) {
  const n = pts.length, div = path.curve.arcLengthDivisions, len = path.curve.getLengths(div), PL = { end: path.length };
  for (const k in pts.at) { const f = (pts.at[k] / (n - 1)) * div, i = Math.min(div - 1, Math.floor(f)); PL[k] = len[i] + (len[i + 1] - len[i]) * (f - i); }
  const P = new THREE.Vector3(); let best = 1e9;      // abeam of the handle: the metre at which the flight is nearest it
  for (let m = PL.foot; m < PL.west; m += 0.5) { path.posAtDist(m, P); const d = P.distanceToSquared(handle); if (d < best) { best = d; PL.pass = m; } }
  return PL;
}
// THE GAZE. Along the river: keys [metres flown, yaw offset in degrees (+ = left), share of the pitch taken over, pitch in degrees] against the direction of travel.
// On the climb and at the top lip the keys are written against the places of the route: [place, metres past it, ...].
const GAZE_RIVER = [   // leg one (0 to 230 m: drawer A beside us from 14 m, drawer B overhead from 118 to 194 m), the bend (230 to 340 m), leg two (340 m on)
  [0, 0, 0, 0], [18, 0, 0, 0], [78, -8, 1, -2], [96, -8, 1, -2], [128, 4, 1, 2], [160, 8, 1, 3], [215, 8, 1, 3], [320, 6, 1, 5], [394, -7, 1, 13],
  [470, 4, 1, 8], [537, 19, 1, 9], [600, 15, 1, 8], [640, 14, 1, 9]];
const GAZE_LIP = [['lip', -29, 0, 1, -4],
  ['end', -60, 0, 0, 0], ['end', 200, 0, 0, 0]];      // the gaze is let go in one stretch, its share 0 at the route's own knot 60 m before the portal's seat
// Round the climb the gaze is written as absolute headings: [place, metres past it, yaw deg (0 = down -Z toward the Tallboy, + = left, running on past 360), pitch deg].
// One pan to the left that never turns back: up the stair from its foot; onto the third drawer's bow front, where it slows while the handle goes by on the right; out over the
// open sea and its chests, the sun kept above the frame; down the whole canyon from above it; across the right wall's top, slower again while the candle crosses; the stair's top.
const GAZE_CLIMB = [['foot', -47, 6, 9], ['foot', 13, 12, 12], ['pass', -98, 34, 12], ['pass', -58, 50, 9], ['pass', -28, 55, 5], ['pass', 0, 57, 3], ['pass', 40, 61, 1],
  ['west', -80, 96, 0], ['west', 0, 136, -2], ['h210', 0, 162, -7], ['h240', 0, 190.5, -12], ['h270', 0, 217.5, -13], ['h300', 0, 243, -11], ['h330', 0, 268, -6], ['top', 0, 291, 0],
  ['top', 30, 304, -2], ['top', 60, 320, -4], ['top', 105, 344, -4], ['top', 150, 364.5, -4], ['lip', 19, 365, -4]];
function gazeKeys(PL) {
  const m = (k) => PL[k[0]] + k[1];
  return { keys: GAZE_RIVER.concat(GAZE_LIP.map((k) => [m(k), k[2], k[3], k[4]])), abs: GAZE_CLIMB.map((k) => [m(k), k[2], k[3]]) };
}
function absAt(ABS, d, col) {       // a smooth curve through the climb's keys (cubic Hermite, tangents from the neighbouring keys)
  const n = ABS.length; let i = 0; while (i < n - 2 && d > ABS[i + 1][0]) i++;
  const a = ABS[i], b = ABS[i + 1], h = b[0] - a[0], t = clamp((d - a[0]) / h, 0, 1), sl = (b[col] - a[col]) / h;
  const ma = i > 0 ? 0.5 * (sl + (a[col] - ABS[i - 1][col]) / (a[0] - ABS[i - 1][0])) : sl, mb = i < n - 2 ? 0.5 * (sl + (ABS[i + 2][col] - b[col]) / (ABS[i + 2][0] - b[0])) : sl;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a[col] + (t3 - 2 * t2 + t) * h * ma + (-2 * t3 + 3 * t2) * b[col] + (t3 - t2) * h * mb;
}
// One point of interest that lasts the whole flight. It returns the point which, blended by the engine at `weight`,
// leaves the camera looking along the wanted direction; with the steady camera (a third of the weight) the view
// simply stays nearer the direction of travel.
// The sun is never in frame (the lead's limit): it stands 115 degrees left of the Tallboy's heading, and the frame is 47 degrees to either side. Over the stretch in which
// the pan passes within 54 degrees of the sun's bearing on the way in and 52 on the way out (found from the keys themselves, not written in metres), the gaze is held low
// enough that the disc stays above the top of the frame (its elevation less 36 degrees: 31 of half field and five of margin). It eases down to that at 0.4 degrees a metre
// before the stretch and up from it at 0.15 after, so the lower the hour's sun, the earlier and the lower the look.
const SUN_YAW = 115, SUN_IN = 0.4, SUN_OUT = 0.15;
function makeDirector(path, keys, ABS, weight, sunElev) {
  const L = path.length, P = new THREE.Vector3(), Aq = new THREE.Vector3(), D = new THREE.Vector3(), G = new THREE.Vector3(), out = new THREE.Vector3();
  const A0 = ABS[0][0], A1 = ABS[ABS.length - 1][0]; let SUN_A = A0, SUN_B = A1;
  for (let d = A1; d >= A0; d -= 1) if (absAt(ABS, d, 1) >= SUN_YAW - 54) SUN_A = d;
  for (let d = A0; d <= A1; d += 1) if (absAt(ABS, d, 1) <= SUN_YAW + 52) SUN_B = d;
  return (time, u) => {
    const d = u * L; path.posAtDist(d, P); path.posAtDist(d + 40, Aq); D.subVectors(Aq, P).normalize();
    let i = 0; while (i < keys.length - 2 && d > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], t = ease((d - a[0]) / Math.max(1e-6, b[0] - a[0]));
    const yawH = Math.atan2(-D.x, -D.z), wA = smoothstep(A0, A0 + 60, d) * (1 - smoothstep(A1 - 60, A1, d));
    let off = lerp(a[1], b[1], t), share = lerp(a[2], b[2], t), pd = lerp(a[3], b[3], t);
    if (wA > 0) { let oa = absAt(ABS, d, 1) - yawH / D2R; oa -= 360 * Math.round(oa / 360); off = lerp(off, oa, wA); share = lerp(share, 1, wA); pd = lerp(pd, absAt(ABS, d, 2), wA); }
    if (sunElev !== undefined) { const T = sunElev - 36 + (d < SUN_A ? SUN_IN * (SUN_A - d) : d > SUN_B ? SUN_OUT * (d - SUN_B) : 0), h = clamp(0.5 + 0.5 * (T - pd) / 4, 0, 1); pd = lerp(T, pd, h) - 4 * h * (1 - h); }
    const yaw = yawH + off * D2R, pit = lerp(Math.asin(clamp(D.y, -1, 1)), pd * D2R, share);
    G.set(-Math.sin(yaw) * Math.cos(pit), Math.sin(pit), -Math.cos(yaw) * Math.cos(pit));
    const w = weight * bell(u, 0, 1, 0.02) * smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
    if (w < 0.02) return out.copy(P).addScaledVector(G, 100);
    const c = G.dot(D), k = 1 - w, lam = k * c + Math.sqrt(Math.max(w * w - k * k * (1 - c * c), 0));
    G.multiplyScalar(lam).addScaledVector(D, -k).normalize();
    return out.copy(P).addScaledVector(G, 100);
  };
}

// THE SEA CHESTS. Beyond the walls the furniture stands alone in a wide shallow sea. Everything in the sea is laid out from one place of the world: the foot of
// the Tallboy's cascade, where the river ends (HARBOUR; the piece's own anchors.cascadeFoot). One rule for all fourteen: each stands with its drawers toward it.
// The nine of the western sea stand where they did: [x, z, width, height, columns]. The five of the eastern sea are laid out round it at even bearings (30 degrees
// east of the Tallboy's heading, then every 22 degrees), each at its own distance (420 to 520 m), width and height from a hash of its number (one table, the same
// on every visit). A chest within 400 m of it has two drawers out, within 600 m one, beyond that none.
const HARBOUR = [0, 227];
const hsea = (k, j) => { const v = Math.sin(k * 91.7 + j * 47.3 + 5.1) * 43758.5453; return v - Math.floor(v); };
// the right wall's second leg, from z 749 down the river: [width, height] of its six chests (the last is the dresser the candle stands on)
const RIGHT2 = [[88, 300], [84, 236], [90, 272], [84, 252], [86, 256], [82, 262]], RIGHT2_Z = 749;
const TOP_OUT = (zc) => zc > 330 && zc < 560;      // the chests of that leg whose top drawer comes out (by the chest's middle along the wall): the third, fourth and fifth
const SEA_WEST = [[-150, 30, 144, 204, 1], [-331, 458, 120, 240, 1], [-466, 285, 130, 272, 1], [-345, 96, 130, 284, 1], [-576, 396, 150, 330, 1], [-377, 663, 130, 214, 1], [-330, -230, 170, 344, 1], [-602, 127, 160, 300, 2], [-520, 820, 160, 262, 1]];
function seaChests() {
  const list = [], ax = HARBOUR[0], az = HARBOUR[1];
  const add = (x, z, w, H, cols) => { const k = list.length, s = (w - 6 * (cols + 1)) / (cols * 110), n = Math.max(1, Math.round((H - 36) / (30 * s))), r = Math.hypot(x - ax, z - az);
    list.push({ k, x, z, W: w, H, cols, s, n, r, yaw: Math.atan2(ax - x, az - z), top: 16 + n * 30 * s + 20, out: r < 400 ? 2 : r < 600 ? 1 : 0 }); };
  for (const [x, z, w, H, cols] of SEA_WEST) add(x, z, w, H, cols);
  for (let j = 0; j < 5; j++) { const k = SEA_WEST.length + j, b = (-30 - 22 * j) * D2R, r = 420 + 100 * hsea(k, 1); add(ax - r * Math.sin(b), az - r * Math.cos(b), 130 + 30 * hsea(k, 2), 214 + 110 * hsea(k, 3), 1); }
  return list;
}
// the great key lies beside the candle on the same dresser top (x, z of its bow)
const KEY = [72, 292];

// ---- seeded looks ----
const TIMBERS = [
  { name: 'walnut', pal: ['#3B2417', '#8A5A32', '#D9A662', '#F2E3C4'], brass: '#E2B84C', knob: 0, saw: '#E0C594', shade: 1.8 },
  { name: 'satinwood', pal: ['#8A6B3C', '#CFAE72', '#EBD49A', '#F6ECD2'], brass: '#C4CCD2', knob: 0, saw: '#EAD7A6', fill: 0.72, bounce: '#B9853E', shade: 0.8 },
  { name: 'bog oak', pal: ['#2B1F18', '#5C4433', '#B4966A', '#E8D9B8'], brass: '#D8BE86', knob: 1, saw: '#CDB58A', fill: 1.8, shade: 1.8 },
];
const HOURS = [
  { name: 'golden afternoon', elev: 24, sun: '#FFD9A0', sunI: 1, sky: '#9DB9C6', zen: '#9DB9C6', hor: '#F2E3C4', mid: '#F0CFA6', fog: '#EFD3A4', fogD: 0.00062, mist: 0, wet: 0, exposure: 1.0, tint: '#fff4e2', shadow: '#1a0f08' },
  { name: 'amber evening', elev: 11, sun: '#FFB45E', sunI: 1.15, sky: '#8E9FC0', zen: '#7C92BA', hor: '#F6CE94', mid: '#EDB383', fog: '#E9B880', fogD: 0.0008, mist: 0, wet: 0, exposure: 1.24, tint: '#ffeed6', shadow: '#1c1020', fill: 1.4 },
  { name: 'morning after rain', elev: 27, sun: '#FFE4B8', sunI: 1, sky: '#A9C6D8', zen: '#86B4D6', hor: '#EDF0E6', mid: '#D2E2E6', fog: '#DCE6E2', fogD: 0.00085, mist: 1, wet: 1, exposure: 0.98, tint: '#f6fbff', shadow: '#0c1620' },
];
const HOLDS = [
  { name: 'summer meadows', green: '#5E8F5A', gold: '#D9A662', herd: 'deer', petals: 0, geese: 0 },
  { name: 'apple orchards', green: '#6C9A58', gold: '#F1D9D2', herd: 'goat', petals: 1, geese: 0 },
  { name: 'heather and tarns', green: '#6F6A4E', gold: '#9C5E8C', herd: 'deer', petals: 0, geese: 1 },
];

const STEPS = [];   // each section below pushes: async (W) => void, run in order by build()

export default {
  id: 'drawer-cliffs',
  name: 'The Drawer Cliffs',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, q = ctx.quality || { detail: 1 };
    const detail = clamp(q.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const timber = TIMBERS[rng.int(0, 2)], hold = HOLDS[rng.int(0, 2)];
    let hi = rng.int(0, 2);
    if (vary.hour === 'dawn') hi = 2; else if (vary.hour === 'golden') hi = hi === 2 ? 0 : hi; else if (vary.hour === 'day') hi = hi === 1 ? 0 : hi;
    const hour = HOURS[hi], rare = !!vary.rare;
    const elev = hour.elev * D2R, az = 115 * D2R;
    const SUN = new THREE.Vector3(-Math.sin(az) * Math.cos(elev), Math.sin(elev), -Math.cos(az) * Math.cos(elev)).normalize();
    const palette = [...timber.pal, hold.green, '#4FB7C4', timber.brass];
    const scene = new THREE.Scene();
    const time = { value: 0 };

    const sky = makeSky({ rng, preset: 'goldenHour', sunDirection: SUN, zenith: hour.zen, mid: hour.mid, horizon: hour.hor, ground: '#8A6A44',
      sunColor: hour.sun, sunSize: 1.6, sunIntensity: 9, sunGlow: 0.5, scatter: 0.35, scatterColor: hour.sun,
      clouds: { coverage: hi === 2 ? 0.46 : 0.34, softness: 0.3, scale: 1.5, stretch: 0.35, wind: [0.012, 0.002], lit: hi === 1 ? '#ffd9a8' : '#fff1d8', shade: hi === 1 ? '#a58aa0' : '#9aa6b8', haze: 0.3 },
      clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5 } });
    scene.add(sky.object);
    await ctx.yield();      // (the sky is one call into the kit: it stands in a step of its own)
    scene.fog = new THREE.FogExp2(new THREE.Color(hour.fog), hour.fogD);

    // The light, by one rule for every hour: the shade's fill is 0.72 of the timber's (1.3 times that on a face that looks at the sun from a drawer's shadow), the sky
    // light 1.1 of the hour's, and the wood's haze is warmed toward butter by how cool the hour's fog is (its blue over its red: none for the amber evening, 0.4 for the
    // golden afternoon, 0.75 for the morning's grey mist, which also takes three tenths less of a far chest).
    const fogCool = parseInt(hour.fog.slice(5, 7), 16) / parseInt(hour.fog.slice(1, 3), 16), SHADE_K = 0.72, SKY_COOL = 1.1;
    // key-swifts of the world: the moths that wheel round the candle flame; residents round the top of every chest that stands in the sea within 600 m of the harbour and round the great key
    // (opts.flocks: [x, y, z, count, radius lo, radius hi, size, and how much the piece's own generator may add to the height, the count, the outer radius and the size])
    const flocks = seaChests().filter((c) => c.r < 600).map((c) => [c.x - Math.sin(c.yaw) * 35, c.top + 26, c.z - Math.cos(c.yaw) * 35, c.r < 400 ? 6 : 4, 24, 52, 0.28, 14, c.r < 400 ? 5 : 3, 30, 0.07]);
    flocks.push([KEY[0], DRESSER_TOP + 7, KEY[1], 34, 7, 21, 0.15]);      // the small keys that pour round the great key
    // and round the top of every chest of the right wall's second leg whose top drawer stands out with a meadow (TOP_OUT): a wheel of residents
    // some 45 m over the top (never nearer it than 17 m: they are birds in the sky, not things on the veneer), kept within 40 m of the chest's middle
    { let z = RIGHT2_Z; RIGHT2.forEach(([w, H], j) => { if (TOP_OUT(z - w / 2)) flocks.push([90, H + 40, z - w / 2, 12, 16, 40, 0.34, 10, 6, 0, 0.08]); z -= w; }); }
    const hero = await buildHero(ctx, { palette, detail, sunDir: SUN, sunColor: hour.sun, skyColor: hour.sky, bounceColor: timber.bounce || timber.pal[2], fill: timber.shade * SHADE_K, fillSun: timber.shade * SHADE_K * 1.3,
      hazeWarm: clamp(2.92 * (fogCool - 0.549), 0, 0.75), hazeK: 1 - 0.3 * clamp((fogCool - 0.75) / 0.25, 0, 1), ribbon: RIBBON, moths: [CANDLE[0], DRESSER_TOP + 46, CANDLE[1], 115], flocks });
    hero.uniforms.uSunCol.value.multiplyScalar(hour.sunI);
    { const k = (hour.fill || 1) * (timber.fill || 1); hero.uniforms.uSky.value.multiplyScalar(k * SKY_COOL); hero.uniforms.uBounce.value.multiplyScalar(0.5 + 0.5 * k); }
    scene.add(hero.object);
    await ctx.yield();

    // ---- the flight ----
    // Leg one, the bend and leg two run up the river; at the foot of the Tallboy the route becomes one slow left-hand turn (routePoints): past the left handle of
    // the third drawer, out over the open sea, back over the canyon 220 m up, and round onto the centre line at the height of the keyhole.
    const A = hero.anchors, DUR = 50;
    // the handle the flight passes: the left one of the third drawer. The drawer breathes a metre or so on its own period, so the line is laid where the handle will be
    // standing when the flight comes abeam of it (second pass: the first finds where that is). That drawer breathes by the place of the flight (u times the flight's
    // fifty seconds: update, breatheBy), not by the world's clock, so the pass is the same at whatever the clock stands when a visit begins
    const HANDLE = A.handles.find((h) => h.drawer === 2 && h.side < 0).position.clone(); let path, PL, pts;
    for (let k = 0, dz = 0; k < 2; k++) {
      const hp = HANDLE.clone(); hp.z += dz; pts = routePoints(A.portalSeat.position, A.portalSeat.pitch, hp); path = makePath(pts); PL = placesOf(path, pts, hp);
      dz = hero.drawerOffset(2, DUR * PL.pass / path.length);
      await ctx.yield();
    }
    const uAt = (d) => d / path.length, gaze = gazeKeys(PL);      // events are keyed to metres flown and to the route's places, so they stay put if the route changes length

    // the route as points every 3 m of its length: what the margins in metres round it are measured against (a fall, a shaft of light)
    const route = []; { const P = new THREE.Vector3(); for (let m = 0; m <= path.length; m += 3) { path.posAtDist(m, P); route.push([P.x, P.y, P.z]); } }
    // shared state handed to every section
    const W = { ctx, rng, scene, hero, A, path, PL, uAt, DUR, time, sky, SUN, timber, hour, hold, hi, rare, detail, density, palette, route,
      U: hero.uniforms, updaters: [], disposers: [], boxes: [], state: {} };
    // each thing added since the world first shipped (the right wall's second leg, the panelled backs, the chests in the sea with their falls, meadows, washing,
    // shavings and boats) deals from a stream of its own made from the world's seed and its name, which draws from no parent
    W.own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    await ctx.yield();
    for (const step of STEPS) { await step(W); await ctx.yield(); }
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      // a little slower along the river and on the last approach, a little quicker round the helix (far scenery)
      pace: (u) => 0.9 + 0.24 * smoothstep(0.42, 0.52, u) * (1 - smoothstep(0.78, 0.88, u)) - 0.06 * smoothstep(0.86, 0.92, u),
      title: 'The Drawer Cliffs',
      camera: { fov: 62, near: 0.4, far: 2600, lookAhead: 40, sway: 0.2, bank: 0 },   // no roll anywhere (the lead's limit on the helix; it was 1.5 degrees at most)
      pois: [{ at: makeDirector(path, gaze.keys, gaze.abs, 0.6, hour.elev), from: 0, to: 1, fade: 0.02, weight: 0.6 }],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#FFF3D0', glow: 0.9, revealDistance: 420 },
      post: { exposure: hour.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.06, contrast: 1.05, tint: hour.tint, shadowTint: hour.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      style: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        const m = u * path.length;
        // the key-swift stream, by the places of the route: it bursts from the second drawer's keyhole as the flight comes onto the arc toward the handle, pours across
        // the foot of the third drawer's front ahead of the flight and is round the stair's corner before the flight is abeam of the handle; it climbs the stair's
        // flank while the flight is out over the sea, and from the canyon's look-back on it crosses the top meadow, its head at the plate 32 m past the top lip
        const kl = knots(m, [[PL.pass - 110, 0], [PL.pass - 10, 0.49], [PL.h270 - 20, 0.66], [PL.lip + 32, 1], [PL.lip + 102, 1.13]]);
        hero.setProgress(0.485 + kl / 2.41);
        hero.uniforms.uRib.value = (m - 575) / 150;            // the ribbon across the run-in
        hero.breatheBy(2, u * DUR);
        hero.update(dt, t, camera);
        sky.update(dt, t, camera);
        for (const f of W.updaters) f(dt, t, camera, u);
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); for (const f of W.disposers) f(); },
    };
  },
};

// =====================================================================================================
// CABINET-WORK. Every lesser cabinet is written into one world-space mesh. A vertex that belongs to a
// drawer carries aSl (its slide vector, world space, metres at full stroke) and aDrw (its channel);
// the vertex shader adds aSl * uSlide[channel], so front, tray, handles, meadow and fall move as one.
// =====================================================================================================
const NCYC = 40, NCH = 60, CUT_G = 3;      // channels 0..39: the canyon's drawers (scripted and cyclic); 40..59: the sea chests' drawers and the right wall's top drawers, one channel each, each on its own cycle
class WGeo extends Geo {
  constructor() { super(); this.sl = []; this.fn = []; this.px = 0; this.pz = 0; this.cy = 1; this.sy = 0; this.amp = 0; this.ch = 0; this.nofn = 0; }
  frame(x, z, yaw) { this.px = x; this.pz = z; this.cy = Math.cos(yaw); this.sy = Math.sin(yaw); this.amp = 0; this.ch = 0; }
  slide(amp, ch) { this.amp = amp; this.ch = ch; }
  toWorld(p) { return [this.px + p[0] * this.cy + p[2] * this.sy, p[1], this.pz - p[0] * this.sy + p[2] * this.cy]; }
  v(p, n, uv, m) {
    this.sl.push(this.sy * this.amp, 0, this.cy * this.amp); if (this.nofn) this.fn.push(0, 0); else this.fn.push(this.sy, this.cy);
    return super.v(this.toWorld(p), [n[0] * this.cy + n[2] * this.sy, n[1], -n[0] * this.sy + n[2] * this.cy], uv, m, this.ch);
  }
  build() {
    const g = super.build();
    g.setAttribute('aSl', new THREE.Float32BufferAttribute(this.sl, 3)); g.setAttribute('aFn', new THREE.Float32BufferAttribute(this.fn, 2));
    return g;
  }
}
const SLIDE_VS = /* glsl */`
attribute float aDrw; attribute vec3 aSl; attribute vec2 aFn; attribute vec2 aUv; attribute vec4 aMat;
uniform float uSlide[${NCH}]; uniform float uTime; uniform vec3 uSun;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vMat; varying vec3 vSunL;
#include <fog_pars_vertex>
void main() {
  vUv = aUv; vMat = aMat; vP = position;
  vSunL = vec3(uSun.x * aFn.y - uSun.z * aFn.x, uSun.y, uSun.x * aFn.x + uSun.z * aFn.y);   // sun in this front's own space (handle shadows)
  vec3 p = position + aSl * uSlide[int(clamp(aDrw + 0.5, 0., ${NCH - 1}.))];
  #ifdef BAIL
  if (aMat.x > 1.5 && aMat.x < 2.5) {                 // a bail hangs from its posts and swings a few degrees
    float ph = aMat.y * 6.2831, a = 0.07 * sin(uTime * 0.9 + ph) + 0.04 * sin(uTime * 2.3 + ph * 1.7);
    p.xz += aFn * a * (aUv.x - position.y);
  }
  #endif
  vN = normalize(normal + vec3(0., 1e-6, 0.)); vW = p;
  vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRONT_XS = [-55, -54.5, -50.6, -49.4, -30, -10, -4.6, -3.6, 0, 3.6, 4.6, 10, 30, 49.4, 50.6, 54.5, 55];
const FRONT_XS_LO = [-55, -54.5, -50.6, -49.4, -25, 0, 25, 49.4, 50.6, 54.5, 55];
const FRONT_PROF = [[-3, 0], [-0.5, 0], [0, 0.5], [0, 4.4], [0.9, 5.6], [0.9, 20.4], [0, 21.6], [0, 25.5], [-0.5, 26], [-3, 26], [-3, 24.6]];
const FOOT = [[4.6, 0], [6.9, 2.0], [7.0, 3.4], [5.3, 6.1], [5.3, 6.5], [6.0, 6.8], [6.0, 7.4], [5.1, 7.9], [6.5, 8.5], [6.5, 9]];
const STICK = [[0, 0.05], [12.5, 0.05], [13.6, 0.5], [14.2, 2.2], [13.5, 2.7], [12.2, 1.7], [4.2, 1.5], [3.2, 2.4], [2.5, 4.6], [4.4, 6.2], [4.4, 7.4], [2.5, 8.8], [2.0, 13.5], [3.7, 15.6], [3.7, 17.2], [2.6, 18.6], [3.3, 21.6], [4.6, 22.8], [4.6, 24], [3.1, 24.1], [2.6, 22.6]];
const PLINTH = [[0, 7], [0.7, 7], [1.1, 6.3], [1.1, 5.5], [2.3, 4.3], [2.3, 3.5], [3.5, 2.5], [3.7, 0.7], [3.2, 0], [-2, 0]];
const CORNICE = [[0, 0], [1.3, 0], [1.3, 1.3], [2.5, 2.5], [2.5, 4.3], [4.1, 5.5], [4.1, 7.5], [5.8, 8.9], [5.8, 11.4], [5.2, 12], [-4, 12]];

// One drawer in design units (front 110 x 26, bow 5) scaled by s, its bottom-left tier corner at local (xc, yb).
// o: { amp, ch, tray (m of tray behind the front), notch (pool notch in the lip), seed }
function rawDrawer(G, B, rng, xc, yb, s, o) {
  const bow = (x) => 5 * (1 - (x / 55) * (x / 55)), out = 3.2, seed = o.seed;
  G.slide(o.amp, o.ch); B.slide(o.amp, o.ch);
  const XS = o.notch ? FRONT_XS : FRONT_XS_LO;
  const place = (t, a, b) => {
    const x = pl(XS, t), ex = 55 - Math.abs(x);
    let aa = a > 0 ? a * clamp((ex - 4.4) / 1.2, 0, 1) : a;
    if (a >= -0.5) aa -= Math.max(0, 0.5 - ex);
    let y = b; if (o.notch && b > 25.4) y -= 1.5 * (1 - smoothstep(3.6, 4.6, Math.abs(x)));
    return [xc + x * s, yb + y * s, (out + bow(x) + aa) * s];
  };
  if (!o.trayOnly) G.sweep(FRONT_PROF, XS.length - 1, place, [1, seed, 0, 0], 0, { uv: (t, a, b) => [pl(XS, t), b], chamfer: 0.9 });
  const L = o.tray || 0, yt = yb + 26 * s;
  for (const sx of [-1, 1]) {
    const xe = xc + sx * 55 * s, xo = xc + sx * 54.5 * s, xi = xc + sx * 52.5 * s, so = rng();
    const cap = [[xe, yb, out * s], [xe, yb, (out - 3) * s], [xe, yt, (out - 3) * s], [xe, yt, out * s]], cuv = [[0, 0], [3, 0], [3, 26], [0, 26]];
    if (!o.trayOnly) G.quad(...(sx > 0 ? cap : [cap[1], cap[0], cap[3], cap[2]]), sx > 0 ? cuv : [cuv[1], cuv[0], cuv[3], cuv[2]], [5, seed, 0.5, 0], 0);
    if (L > 0) {                                                     // the oak side with its dovetails, top edge, inner face
      const z0 = (out - 3) * s, z1 = z0 - L, lu = L / s;
      const a = [xo, yb, z0], b = [xo, yb, z1], c = [xo, yt, z1], d = [xo, yt, z0], uvs = [[0, 0], [lu, 0], [lu, 26], [0, 26]];
      G.quad(...(sx > 0 ? [a, b, c, d] : [b, a, d, c]), sx > 0 ? uvs : [uvs[1], uvs[0], uvs[3], uvs[2]], [2, so, 0, 0], 0);
      const e = [xi, yt, z0], f = [xi, yt, z1];
      G.quad(...(sx > 0 ? [d, c, f, e] : [c, d, e, f]), [[8, 0], [lu + 8, 0], [lu + 8, 2], [8, 2]], [2, so, 0.35, 0], 0);
      const g = [xi, yt - 1.6 * s, z0], h = [xi, yt - 1.6 * s, z1];
      G.quad(...(sx > 0 ? [h, g, e, f] : [g, h, f, e]), [[8, 3], [lu + 8, 3], [lu + 8, 4.6], [8, 4.6]], [2, so, 0, 0.3], 0);
    }
  }
  if (L > 0) {                                                       // bottom boards, two runners and the back
    const z0 = (out - 0.5) * s, z1 = (out - 3) * s - L, x0 = xc - 54.5 * s, x1 = xc + 54.5 * s, sb = rng();
    const ub = (z1 - z0) / s;      // board x = metres back from the lip (0 at the lip, falling inward); edge 0.1 marks boards that carry runners
    G.quad([x0, yb, z1], [x1, yb, z1], [x1, yb, z0], [x0, yb, z0], [[ub, -54.5], [ub, 54.5], [0, 54.5], [0, -54.5]], [6, sb, 0.1, 0.25], 0);
    for (const rx of [-30, 30]) {      // a runner is a rail: its faces carry (metres back from the lip, place round its section: 0 the middle of its underside, 2.2 the arris, 3.8 where a side meets the boards)
      const xa = xc + (rx - 2.2) * s, xb = xc + (rx + 2.2) * s, ya = yb - 1.6 * s, zb = z0 - 2 * s, mr = [6, rng(), 0.3, 0.3];
      const ue = Math.floor(ub / 9) * 9;      // the back end takes a place between two pegs, so no peg is drawn across it
      G.quad([xb, ya, z1], [xa, ya, z1], [xa, yb, z1], [xb, yb, z1], [[ue, 2.2], [ue, -2.2], [ue, -2.2], [ue, 2.2]], mr, 0);
      G.quad([xb, ya, zb], [xb, ya, z1], [xb, yb, z1], [xb, yb, zb], [[-2, 2.2], [ub, 2.2], [ub, 3.8], [-2, 3.8]], mr, 0);
      G.quad([xa, ya, z1], [xa, ya, zb], [xa, yb, zb], [xa, yb, z1], [[ub, -2.2], [-2, -2.2], [-2, -3.8], [ub, -3.8]], mr, 0);
      G.quad([xa, ya, z1], [xb, ya, z1], [xb, ya, zb], [xa, ya, zb], [[ub, -2.2], [ub, 2.2], [-2, 2.2], [-2, -2.2]], mr, 0);
      G.quad([xa, ya, zb], [xb, ya, zb], [xb, yb, zb], [xa, yb, zb], [[-2, -2.2], [-2, 2.2], [-2, 2.2], [-2, -2.2]], mr, 0);      // its front end, which live leaves open
    }
    G.box(x0, x1, yb, yt - 1.2 * s, z1, z1 + 0.01, [2, rng(), 0, 0.2], 0, 'z');
  }
  if (o.trayOnly) { G.slide(0, 0); return; }
  // two handles and an escutcheon
  const hy = yb + 13.5 * s;
  if (o.knob) for (const hx of [-30, 30]) latheZ(B, [[2.2, 0], [1.3, 0.5], [1.1, 2.2], [2.6, 3.4], [3.0, 4.6], [2.2, 5.6], [0, 6]], 8, xc + hx * s, hy, (out + bow(hx) + 0.9) * s, s, [0, rng(), 0, 0]);
  else for (const hx of [-30, 30]) {
    const hz = (out + bow(hx) + 0.9) * s, X = xc + hx * s;
    for (const px of [-5, 5]) latheZ(B, [[3.0, 0], [2.4, 0.7], [0.8, 1.1], [0.8, 5.8]], 5, X + px * s, hy, hz + (bow(hx + px) - bow(hx)) * s, s, [0, 0, 0, 0]);
    const half = [[-5, 0], [-6.1, -1.6], [-4.3, -4.0], [0, -5.15]], ptsB = half.concat(half.slice(0, -1).reverse().map((q) => [-q[0], q[1]]));
    const ph = rng(), nb = ptsB.length - 1, rs = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]];
    B.sweep(rs, nb, (t, a, b) => { const f = t * nb, i = Math.min(nb - 1, Math.floor(f)), k = f - i, P = [lerp(ptsB[i][0], ptsB[i + 1][0], k), lerp(ptsB[i][1], ptsB[i + 1][1], k)];
      const r = 0.55 + 0.3 * (1 - Math.abs(t - 0.5) * 2), tx = ptsB[Math.min(nb, i + 1)][0] - ptsB[i][0], ty = ptsB[Math.min(nb, i + 1)][1] - ptsB[i][1], tl = Math.hypot(tx, ty) || 1;
      return [X + (P[0] - (ty / tl) * a * r) * s, hy + (P[1] + (tx / tl) * a * r) * s, hz + (4.65 + b * r) * s]; }, [2, ph, 0, 0], 0, { edge: 0, uv: () => [hy, 0] });
  }
  latheZ(B, [[1.9, 0], [1.75, 0.45], [0, 0.56]], 7, xc + 13 * s, yb + 17.5 * s, (out + bow(13) + 0.9) * s, s, [3, 0, 0, 0], 1.3);
  G.slide(0, 0); B.slide(0, 0);
}
// Fronts, end caps and brass are made once as templates in design units and stamped onto every drawer (the sweeps
// are the dear part of the build); only a tray's sides and bottom are built per drawer.
async function drawerTemplates(knob, brk) {      // (three templates, a pause after each: none is long, together they held the page)
  const mkT = (notch) => { const G0 = new WGeo(), B0 = new WGeo(); rawDrawer(G0, B0, () => 0.5, 0, 0, 1, { amp: 0, ch: 0, tray: 0, notch, seed: 0, knob }); return { G0, B0 }; };
  const lite = { G0: new WGeo(), B0: new WGeo() }; liteDrawer(lite.G0, lite.B0, knob); await brk();
  const plain = mkT(false); await brk(); const notch = mkT(true);
  return { plain, notch, lite };
}
// The same drawer for the cabinets that stand out in the sea, seen from a hundred metres and more: the bowed, fielded
// front with its joinery (drawn by the wood shader from the same board coordinates), two bail handles and a keyhole,
// in a quarter of the triangles.
function liteDrawer(G, B, knob) {
  const bow = (x) => 5 * (1 - (x / 55) * (x / 55)), out = 3.2, XS = [-55, -50.6, -49.4, -19, 19, 49.4, 50.6, 55];
  const prof = [[-3, 0], [0, 0], [0, 4.4], [0.9, 5.6], [0.9, 20.4], [0, 21.6], [0, 26], [-3, 26]];
  G.sweep(prof, XS.length - 1, (t, a, b) => { const x = pl(XS, t), ex = 55 - Math.abs(x); return [x, b, out + bow(x) + (a > 0 ? a * clamp((ex - 4.4) / 1.2, 0, 1) : a)]; },
    [1, 0, 0, 0], 0, { uv: (t, a, b) => [pl(XS, t), b], chamfer: 0.9 });
  for (const sx of [-1, 1]) { const xe = sx * 55, cap = [[xe, 0, out], [xe, 0, out - 3], [xe, 26, out - 3], [xe, 26, out]], cuv = [[0, 0], [3, 0], [3, 26], [0, 26]];
    G.quad(...(sx > 0 ? cap : [cap[1], cap[0], cap[3], cap[2]]), sx > 0 ? cuv : [cuv[1], cuv[0], cuv[3], cuv[2]], [5, 0, 0.5, 0], 0); }
  const hy = 13.5, tri = [[1, 0], [-0.5, 0.87], [-0.5, -0.87], [1, 0]], ptsB = [[-5, 0], [-6.1, -1.9], [-3.6, -4.4], [0, -5.15], [3.6, -4.4], [6.1, -1.9], [5, 0]], nb = ptsB.length - 1;
  for (const hx of [-30, 30]) {
    const hz = out + bow(hx) + 0.9;
    if (knob) { latheZ(B, [[2.2, 0], [1.1, 2.2], [3.0, 4.6], [0, 6]], 5, hx, hy, hz, 1, [0, 0.5, 0, 0]); continue; }
    for (const px of [-5, 5]) latheZ(B, [[2.8, 0], [0.9, 1.1], [0.9, 5.8]], 4, hx + px, hy, hz + bow(hx + px) - bow(hx), 1, [0, 0, 0, 0]);
    B.sweep(tri, nb, (t, a, b) => { const f = t * nb, i = Math.min(nb - 1, Math.floor(f)), k = f - i, P = [lerp(ptsB[i][0], ptsB[i + 1][0], k), lerp(ptsB[i][1], ptsB[i + 1][1], k)];
      const r = 0.7 + 0.35 * (1 - Math.abs(t - 0.5) * 2), tx = ptsB[i + 1][0] - ptsB[i][0], ty = ptsB[i + 1][1] - ptsB[i][1], tl = Math.hypot(tx, ty) || 1;
      return [hx + P[0] - (ty / tl) * a * r, hy + P[1] + (tx / tl) * a * r, hz + 4.65 + b * r]; }, [2, 0.5, 0, 0], 0, { edge: 0, uv: () => [hy, 0] });
  }
  latheZ(B, [[1.9, 0], [1.75, 0.45], [0, 0.56]], 6, 13, 17.5, out + bow(13) + 0.9, 1, [3, 0, 0, 0], 1.3);
}
function stamp(dst, src, xc, yb, s, seed, ph, brass) {
  const base = dst.c, P = src.p, Nn = src.n, UV = src.uv, M = src.m;
  for (let i = 0; i < src.c; i++) {
    const k = M[i * 4], bail = brass && k > 1.5 && k < 2.5;
    dst.v([xc + P[i * 3] * s, yb + P[i * 3 + 1] * s, P[i * 3 + 2] * s], [Nn[i * 3], Nn[i * 3 + 1], Nn[i * 3 + 2]], bail ? [yb + UV[i * 2] * s, 0] : [UV[i * 2], UV[i * 2 + 1]],
      [k, brass ? (bail ? ph : M[i * 4 + 1]) : seed, M[i * 4 + 2], M[i * 4 + 3]]);
  }
  for (let j = 0; j < src.idx.length; j++) dst.idx.push(base + src.idx[j]);
}
function addDrawer(G, B, rng, xc, yb, s, o, T) {
  const t = o.lite ? T.lite : o.notch ? T.notch : T.plain;
  G.slide(o.amp, o.ch); B.slide(o.amp, o.ch);
  stamp(G, t.G0, xc, yb, s, o.seed, 0, false); stamp(B, t.B0, xc, yb, s, 0, rng(), true);
  G.slide(0, 0); B.slide(0, 0);
  if (o.tray > 0) rawDrawer(G, B, rng, xc, yb, s, { ...o, trayOnly: true });
}
function latheZ(B, prof, seg, cx, cy, cz, s, m, sy = 1) {
  B.sweep(prof, seg, (t, r, z) => { const a = t * Math.PI * 2; return [cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s * sy, cz + z * s]; }, m, 0,
    { edge: 0, uv: (t, r) => [Math.cos(t * Math.PI * 2) * r, Math.sin(t * Math.PI * 2) * r * sy] });
}

// A whole cabinet. c: { x, z, yaw, W, D, cols, n (tiers), s (drawer scale), lid (low chest with a meadow on top),
// far (skyline only: no feet, columns, dentils or handles), plan(tier, col) -> { amp, ch, tray, notch } | null }
// Returns what later sections need: tiers, top, the drawers that pour.
async function addCabinet(G, B, rng, c, brk, T, rb) {
  const { W, D, cols, n, s } = c, hw = W / 2, base = c.lid ? 7 : 16, sd = () => rng();
  const tierH = 30 * s, hall = base + n * tierH, top = hall + (c.lid ? 7 : 20), gap = (W - cols * 110 * s) / (cols + 1);
  const sb = () => (rb || rng)();      // the panelled back's timber, from the backs' own generator
  G.frame(c.x, c.z, c.yaw); B.frame(c.x, c.z, c.yaw);
  if (!c.lid) for (const fx of [-hw + 10, hw - 10]) for (const fz of [-9, -D + 9]) G.lathe(FOOT, c.far ? 5 : 10, fx, 0, fz, [0, sd(), 0, 0], 0, { occ: (p) => (p[1] > 8 ? 0.6 : p[1] < 1.2 ? 0.45 : 0) });
  await brk(); G.frame(c.x, c.z, c.yaw); B.frame(c.x, c.z, c.yaw);
  const py = base - 7, s1 = sd();
  G.sweep(PLINTH, 1, (t, a, b) => [lerp(-hw - a, hw + a, t), py + b, a], [0, s1, 0, 0], 0, { len: W });
  for (const sx of [-1, 1]) G.sweep(PLINTH, 1, (t, a, b) => [sx * (hw + a), py + b, lerp(a, -D, t)], [0, sd(), 0, 0], 0, { len: D });
  if (!c.lid) G.box(-hw, hw, py, py + 0.01, -D, 0, [0, s1, 0, 0.8], 0, 'y');
  await brk(); G.frame(c.x, c.z, c.yaw); B.frame(c.x, c.z, c.yaw);
  // flanks (frame and panel), back, stiles, rails, the dark behind the drawers
  for (const sx of [-1, 1]) {
    const x = sx * hw, f = sx > 0 ? 'X' : 'x';
    G.box(sx > 0 ? x - 1 : x, sx > 0 ? x : x + 1, base, hall, -D, 0, [5, sd(), 0, 0], 0, f);
    {
      const xo = sx > 0 ? [x, x + 0.9] : [x - 0.9, x];
      for (const [z0, z1] of [[-D, -D + 8], [-10, -0.5]]) G.box(xo[0], xo[1], base, hall, z0, z1, [5, sd(), 0, 0], 0, f + 'zZ');
      const nb = Math.max(2, Math.round((hall - base) / 90) + 1);
      for (let k = 0; k < nb; k++) { const y = lerp(base, hall - 8, k / (nb - 1)); G.box(xo[0], xo[1], y, y + 8, -D + 8, -10, [0, sd(), 0, 0], 0, f + 'yY'); }
    }
  }
  G.box(-hw, hw, base, hall, -D, -D + 0.01, [5, sd(), 0, 0.15], 0, 'z');
  {  // a framed and panelled back: stiles, muntins and rails standing proud of the panels, a shadow under each rail
    const nm = Math.max(2, Math.round(W / 50)), nr = Math.max(2, Math.round((hall - base) / 70) + 1), fm = [0, sb(), 0, 0];
    for (let k = 0; k <= nm; k++) { const x = lerp(-hw, hw - 7, k / nm); G.box(x, x + 7, base, hall, -D - 1.1, -D, [5, sb(), 0, 0], 0, 'zxX'); }
    for (let k = 0; k < nr; k++) { const y = lerp(base, hall - 7, k / (nr - 1)); G.box(-hw, hw, y, y + 7, -D - 0.9, -D, fm, 0, 'zyY'); if (k > 0) G.box(-hw + 7, hw - 7, y - 2.2, y, -D - 0.05, -D, [3, 0, 0, 1], 0, 'z'); }
  }
  for (let k = 0; k <= cols; k++) { const x0 = -hw + k * (gap + 110 * s); G.box(x0, x0 + gap, base, hall, -1, 0, [5, sd(), 0, k > 0 && k < cols ? 0.1 : 0.25], 0, 'Z'); }
  G.box(-hw + gap, hw - gap, base, hall, -2.6, -2.59, [3, 0, 0, 1], 0, 'Z');
  for (let i = 0; i <= n; i++) { const y = base + tierH * i; if (i < n) G.box(-hw + gap, hw - gap, y, y + 4 * s, -1.5, -0.4, [0, sd(), 0, 0.7], 0, 'Z'); }
  if (!c.lid) for (const sx of [-1, 1]) {
    const h = hall - base, col = [[4.6, 0], [4.6, 3], [3.6, 4.2], [3.3, h * 0.5], [3.6, h - 4.2], [4.6, h - 3], [4.6, h]];
    G.lathe(col, c.far ? 5 : 8, sx * (hw - 1.5), base, -1.5, [5, sd(), 0, 0], 0, { along: false, len: 1 });
  }
  await brk();
  G.frame(c.x, c.z, c.yaw); B.frame(c.x, c.z, c.yaw);
  // frieze and cornice (a low chest gets a shallow lid moulding with a meadow inside its rim)
  const fr = c.lid ? 2 : 8, cs = c.lid ? 5 / 12 : 1, cy = hall + fr;
  G.box(-hw, hw, hall, cy, -D, 0.6, [0, sd(), 0, 0], 0, 'xXZz');
  G.sweep(CORNICE, 1, (t, a, b) => [lerp(-hw - a * cs, hw + a * cs, t), cy + b * cs, 0.6 + a * cs], [0, sd(), 0, 0], 0, { len: W });
  for (const sx of [-1, 1]) G.sweep(CORNICE, 1, (t, a, b) => [sx * (hw + a * cs), cy + b * cs, lerp(0.6 + a * cs, -D, t)], [0, sd(), 0, 0], 0, { len: D });
  if (!c.lid) {          // the top is veneered like a drawer front laid flat: burr field, cross-banding, an inlay string
    const sT = sd(); G.nofn = 1;
    G.quad([-hw - 4, top + 0.09, -3], [hw + 4, top + 0.09, -3], [hw + 4, top + 0.09, -D], [-hw - 4, top + 0.09, -D], [[-55, 0], [55, 0], [55, 26], [-55, 26]], [1, sT, 0, 0], 0); G.nofn = 0;
  }
  else G.sweep([[0, 0], [0, -1.2], [-1.2, -1.2]], 1, (t, a, b) => [lerp(-hw + 1.5 - a, hw - 1.5 + a, t), top + b, -1.5 + a], [0, sd(), 0.4, 0.3], 0, { len: W, flip: true });
  if (!c.lid) { const dm = [0, sd(), 0.25, 0], st = c.far ? 10 : 4; for (let x = -hw + 2; x <= hw - 3.9; x += st) G.box(x, x + st / 2, hall + 5.6, hall + 8, 0.6, 2.4, dm, 0, 'xXyZ'); }
  // drawers
  const out = { c, top, hall, base, tierH, pours: [] };
  for (let i = 0; i < n; i++) for (let k = 0; k < cols; k++) {
    await brk(); G.frame(c.x, c.z, c.yaw); B.frame(c.x, c.z, c.yaw);
    const xc = -hw + gap + 55 * s + k * (gap + 110 * s), yb = base + tierH * i + 4 * s;
    const p = (c.plan && c.plan(i, k)) || { amp: 0, ch: 0, tray: 0 };
    addDrawer(G, B, rng, xc, yb, s, { amp: p.amp, ch: p.ch, tray: p.tray, notch: p.notch, seed: sd(), knob: c.knob, lite: c.far && !(p.amp > 0) }, T);
    if (p.notch) out.pours.push({ ...p, c, xc, yb, s, lip: yb + 26 * s, world: (lx, y, lz) => { G.frame(c.x, c.z, c.yaw); return G.toWorld([lx, y, lz]); } });
  }
  return out;
}

// ---- where every cabinet stands ----
STEPS.push(async (W) => {
  const { rng, timber } = W, R0 = rng.fork ? rng.fork('cabinets') : rng, R2 = W.own('right2'), RS = W.own('sea-chests'), RB = W.own('backs');
  let G = new WGeo(), B = new WGeo(); const cabs = [], tasks = [], parts = [];
  const CH = { A: 1, B: 2, C: 3 }, T = await drawerTemplates(timber.knob, () => W.ctx.yield()), MARGIN = 10;
  await W.ctx.yield();
  let nextCh = 4;
  const chans = W.state.chans = [];                                  // per channel: { kind, period, phase, pos (world xz), frac }
  for (let i = 0; i < NCH; i++) chans.push({ kind: 'still', frac: 0, vel: 0 });
  // THE WAVE'S STRETCH (leg two): a cyclic channel belongs to the rare day's wave when the chest it was first dealt to stands here
  const inWave = W.state.inWave = (x, z) => z < 770 && x > -200 && x < 140;
  // When the channels run out, a later drawer rides on an earlier one's channel (one draw). On the day of the wave a drawer that
  // stands OUTSIDE the wave's stretch does not ride on a wave chest's channel (it would follow the wave from wherever it stands):
  // of the channels whose own chest stands outside too it takes the one that so far carries the fewest drawers of its own chest
  // (so they do not slide as one), the next in order after the one it drew where several carry as few; where no such channel is
  // left it takes channel 0, which never moves, and keeps still that day. No draw is added or moved; other days are untouched
  // (rid only counts, for each channel, how many drawers of each chest ride on it).
  const cyc = (R, x, z, lo = 16, hi = 26) => { let ch = nextCh < NCYC ? nextCh++ : R.int(4, NCYC - 1); const key = x + ',' + z, n = NCYC - 4;
    if (chans[ch].kind === 'still') chans[ch] = { kind: 'cyc', period: R.range(lo, hi) * 2.2, phase: R(), x, z, frac: 0, vel: 0, rid: {} };
    else if (W.rare && inWave(chans[ch].x, chans[ch].z) && !inWave(x, z)) { let to = 0, best = 1e9;
      for (let k = 1; k < n; k++) { const c2 = 4 + (ch - 4 + k) % n, c = chans[c2]; if (c.kind === 'cyc' && !inWave(c.x, c.z) && (c.rid[key] || 0) < best) { best = c.rid[key] || 0; to = c2; } }
      ch = to; }
    if (ch) chans[ch].rid[key] = (chans[ch].rid[key] || 0) + 1;
    return ch; };
  // a drawer of a chest in the sea, or a top drawer of the right wall: its own channel and its own cycle (period and phase from its chest's generator)
  let nextSea = NCYC;
  const seaCh = (R, top) => { const ch = Math.min(nextSea++, NCH - 1); chans[ch] = { kind: top ? 'top' : 'sea', period: R.range(16, 26) * 2.2, phase: R(), frac: top ? 0 : 0.4, vel: 0 }; return ch; };
  // R: the generator the chest is dealt from (the canyon's own; the right wall's second leg and the sea chests have theirs)
  const mk = async (x, z, yaw, Wd, o, R = R0) => {
    const cols = o.cols || 1, s = (Wd - (o.stile || 6) * (cols + 1)) / (cols * 110), n = o.n || Math.max(1, Math.round((o.H - 36) / (30 * s)));
    const pourTier = o.quiet ? -9 : o.pour === undefined ? R.int(Math.floor(n * 0.3), Math.max(1, Math.floor(n * 0.75))) : o.pour, pourCol = o.quiet ? -9 : o.pourCol === undefined ? R.int(0, cols - 1) : o.pourCol;
    const pour2 = o.pour2 ? Math.max(0, pourTier - Math.max(2, Math.round(n * 0.25))) : -1;       // a second, shorter drawer pours lower down
    const c = { x, z, yaw, W: Wd, D: o.D || 70, cols, n, s, lid: !!o.lid, far: !!o.far, knob: timber.knob, r: Math.hypot(x - HARBOUR[0], z - HARBOUR[1]),
      plan: (i, k) => {
        if (o.plan) { const p = o.plan(i, k); if (p) return p; }
        if (o.sea) for (const q of o.sea) if (q[0] === i && q[1] === k) return { amp: q[2], ch: seaCh(R, false), tray: q[2] + 8, notch: true, sea: true };
        if (o.topOut && i === n - 1 && k === 0) return { amp: o.topOut, ch: seaCh(R, true), tray: o.topOut + 8, notch: true, sea: true, top: true };
        if (o.far || o.quiet) return null;
        return planCanyon(i, k);
      } };
    // THE MARGIN ROUND THE ROUTE. A drawer that pours on its own cycle may stand at any stroke when the flight comes by, so its reach is no more than keeps the
    // middle of its fall MARGIN metres (in plan, at the route's own height) from every point of the route: the fall's half width where the flight meets it (3 m)
    // and the 7 m the designers' limit sets as the nearest the flight comes to a thing. One that cannot come 3 m out by that rule does not pour. (The fall leaves
    // the lip 7.6 s + 0.6 m out from the front and is thrown 2.5 m and six hundredths of its height further by the time it lands: the falls' section builds it so.)
    const clearReach = (i, k, amp) => {
      const gap = (Wd - cols * 110 * s) / (cols + 1), xc = -Wd / 2 + gap + 55 * s + k * (gap + 110 * s), y0 = (o.lid ? 7 : 16) + 30 * s * i + 4 * s + 26 * s - 1.35 * s, Hf = y0 - 0.1, cy = Math.cos(yaw), sy = Math.sin(yaw);
      let lim = amp;
      for (const q of W.route) { if (q[1] > y0) continue; const dx = q[0] - x, dz = q[2] - z, a = dx * cy - dz * sy - xc; if (Math.abs(a) >= MARGIN) continue;
        lim = Math.min(lim, dx * sy + dz * cy - 7.6 * s - 0.6 - (2.5 + Hf * 0.06) * Math.sqrt(clamp((y0 - q[1]) / Hf, 0, 1)) - Math.sqrt(MARGIN * MARGIN - a * a)); }
      return lim;
    };
    const planCanyon = (i, k) => {
        if (i === pour2 && k === pourCol) { const deal = R.range(12, 16), amp = clearReach(i, k, deal); if (amp >= 3) return { amp, ch: cyc(R, x, z), tray: deal + 8, notch: true, light: true }; }
        if (i === pourTier && k === pourCol && !o.noPour) { const deal = R.range(o.ampLo || 22, o.ampHi || 34), amp = clearReach(i, k, deal); if (amp >= 3) return { amp, ch: cyc(R, x, z), tray: deal + 8, notch: true }; }
        if (R() < 0.3 && Math.abs(i - pourTier) !== 1) { const amp = R.range(2, 7); return { amp, ch: cyc(R, x, z, 9, 16), tray: amp + 3 }; }
        return null;
    };
    const info = await addCabinet(G, B, R, c, () => W.ctx.yield(), T, RB); cabs.push(info); return info;
  };
  // right wall, leg one (tall, sunlit): four cabinets; the second carries drawer A, the third drawer B
  const r1 = (s0, s1, o) => tasks.push(() => { const p = leg1((s0 + s1) / 2, 65); return mk(p[0], p[2], YAW1R, s1 - s0, o); });
  r1(-74, 18, { H: 262, ampLo: 28, ampHi: 40 });
  r1(18, 112, { H: 236, cols: 2, noPour: true, plan: (i, k) => (i === 0 ? { amp: 50.2, ch: CH.A, tray: 57, notch: true, scripted: 'A' } : i === 1 ? { amp: 0, ch: 0, tray: 0 } : null) });
  r1(112, 200, { H: 244, pour: 5, plan: (i, k) => (i === 1 ? { amp: 84, ch: CH.B, tray: 92, notch: true, scripted: 'B' } : i === 0 || i === 2 ? { amp: 0, ch: 0, tray: 0 } : null) });
  r1(200, 291, { H: 280, ampLo: 24, ampHi: 32 });
  // right wall, leg two. topOut: the top drawer of the third, fourth and fifth chests comes out (metres) with a meadow and a fall: all three by one rule (they
  // stand shut and dry while the flight is in the canyon under them, and work on their own cycles once it has left the river for the stair). The leg is dealt from
  // a generator of its own (R2)
  let z = RIGHT2_Z; for (const [w, H] of RIGHT2) { const zc = z - w / 2, lo = z < 420; tasks.push(async () => { const info = await mk(55, zc, -Math.PI / 2, w, { H: H + R2.range(-8, 8), n: zc < 300 ? 12 : zc < 380 ? 11 : 0, pour2: !lo, ampLo: lo ? 9 : 24, ampHi: lo ? 14 : 32, topOut: TOP_OUT(zc) ? (zc < 400 ? 36 : 30) : 0 }, R2); if (zc < 300) W.state.dresser = info; }); z -= w; }
  // left wall, leg one: the chest-on-chest in shade, then the Long Chest with a meadow on its lid
  const l1 = (key, s0, s1, o) => tasks.push(async () => { const p = leg1((s0 + s1) / 2, -65); W.state[key] = await mk(p[0], p[2], YAW1L, s1 - s0, o); });
  l1('chestOnChest', -48, 78, { cols: 2, H: 252, pour: 4 });
  l1('longChest', 80, 262, { cols: 3, n: 1, lid: true, noPour: true, stile: 4 });
  // left wall, leg two: low chests that let the sun across the river, then one tall neighbour of the Tallboy
  W.state.lows = [];
  const low = (...a) => tasks.push(async () => { W.state.lows.push(await mk(...a)); });
    low(-55, 622, Math.PI / 2, 118, { cols: 2, n: 3, lid: true, pour: 2, pourCol: 0 });
    low(-55, 500, Math.PI / 2, 116, { cols: 2, n: 3, lid: true, pour: 2, pourCol: 1, ampLo: 16, ampHi: 22 });
    // drawer C, the cut fall: the top drawer of the third chest, 54 m up, out 30 m over the river
    low(-55, 386, Math.PI / 2, 104, { cols: 2, n: 4, lid: true, noPour: true, plan: (i, k) => (i === 3 && k === 0 ? { amp: 30, ch: CH.C, tray: 38, notch: true, scripted: 'C' } : i === 3 || (i === 2 && k === 0) ? { amp: 0, ch: 0, tray: 0 } : null) });
    // the last chest before the Tallboy is low too (80 m): the helix swings out over its lid
    low(-55, 283, Math.PI / 2, 92, { cols: 1, n: 3, lid: true, noPour: true });
  // the sea chests (seaChests, above): each is dressed on all four faces (fronts, flanks and back framed and panelled, feet, columns, cornice, a veneered top);
  // the two nearest the axis are built like the canyon's own, the rest in the lighter cut. Which tiers stand out, how far, their cycles and all the timber are dealt
  // from the sea chests' own generator (RS)
  W.state.sea = [];
  for (const c of seaChests()) { if (!(c.out || W.detail > 0.7)) continue;
    tasks.push(async () => { const t1 = Math.min(c.n - 2, Math.floor(c.n * RS.range(0.5, 0.8))), sea = [];
      for (let j = 0; j < c.out; j++) sea.push([Math.max(1, t1 - j * Math.max(2, Math.round(c.n * 0.3))), 0, RS.range(26, 38)]);
      const info = await mk(c.x, c.z, c.yaw, c.W, { H: c.H, cols: c.cols, far: c.r >= 320, quiet: true, sea, stile: 6 }, RS); info.sea = c; W.state.sea.push(info); }); }
  // left on top of the last dresser of the right wall, where the climb comes round to it: a brass chamber-stick at the middle of the top
  // (its candle is made with the ducks and the boat) and a great key lying beside it
  tasks.push(async () => {
    const y0 = W.state.dresser.top, m0 = [0, 0, 0, 0];
    B.frame(CANDLE[0], CANDLE[1], 0); B.lathe(STICK, 20, 0, y0, 0, m0, 0, { edge: 0 });
    await W.ctx.yield();
    B.frame(KEY[0], KEY[1], 2.6); const ky = y0 + 1.3;
    latheZ(B, [[1.25, 0], [1.25, 1], [1.9, 1.4], [1.9, 2.4], [1.25, 2.8], [1.25, 29], [0, 29.6]], 10, 0, ky, 6.2, 1, m0);
    B.sweep([[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]], 18, (t, a, b) => { const th = t * Math.PI * 2, r = 5.2 + a * 1.25; return [Math.sin(th) * r, ky + b * 1.25, Math.cos(th) * r]; }, m0, 0, { edge: 0 });
    B.box(1, 6.5, ky - 0.55, ky + 0.55, 24, 26.2, m0, 0); B.box(1, 5.2, ky - 0.55, ky + 0.55, 27, 29, m0, 0);
    W.state.candle = [CANDLE[0], y0 + 24, CANDLE[1]];
  });
  W.state.cabs = cabs; W.state.CH = CH;

  // materials: the hero's own wood and brass shaders, compiled with the canyon shade and our slide vertex shader
  const slide = { value: new Array(NCH).fill(0) };
  const boxA = { value: [] }, boxB = { value: [] }; for (let i = 0; i < 12; i++) { boxA.value.push(new THREE.Vector4(0, 0, 1, 0)); boxB.value.push(new THREE.Vector4(1, 1, 0, 0)); }
  W.shade = { uBoxA: boxA, uBoxB: boxB, uGap: { value: [new THREE.Vector4(-55, 561, 9, 1), new THREE.Vector4(-55, 440, 8, 1), new THREE.Vector4(-55, 331.5, 7, 1)] }, uCandle: { value: new THREE.Vector4(CANDLE[0], CANDLE[1], DRESSER_TOP, 1) } }; W.slide = slide;
  const hu = W.hero.object.children[0].material.uniforms;            // the Tallboy's wood material: borrow its timber colours
  W.mat = (vs, fs, own = {}, extra = {}, defs = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...W.U, ...W.shade, uSlide: slide, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, defines: { CANYON: 1, ...defs }, ...extra });
  const wood = W.mat(SLIDE_VS, WOOD_FS, { uWoodA: hu.uWoodA, uWoodB: hu.uWoodB, uWoodC: hu.uWoodC, uCream: hu.uCream, uOak: hu.uOak }, { side: THREE.DoubleSide });
  const brass = W.mat(SLIDE_VS, BRASS_FS, { uBrass: { value: new THREE.Color(timber.brass) } }, { side: THREE.DoubleSide }, { BAIL: 1 });
  // build cabinet by cabinet, handing frames back, and flush the geometry to its own mesh every few cabinets
  const flush = async () => {
    for (const [g, m] of [[G, wood], [B, brass]]) { if (!g.c) continue; const geo = g.build(); await W.ctx.yield(); const mesh = new THREE.Mesh(geo, m); mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 400), 2500); mesh.frustumCulled = false; W.scene.add(mesh); await W.ctx.yield(); }
    G = new WGeo(); B = new WGeo();
  };
  let done = 0;
  for (const t of tasks) { await t(); await W.ctx.yield(); if (G.c > 8000 || ++done % 2 === 0) await flush(); }
  await flush();
  W.state.pours = cabs.flatMap((c) => c.pours);
});

// ---- canyon shade: which cabinets throw shadow (the sun-side wall), written into the 12 shade boxes ----
STEPS.push(async (W) => {
  const st = W.state, list = [st.chestOnChest, st.longChest, ...st.lows];
  list.forEach((info, i) => {
    const c = info.c, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    W.shade.uBoxA.value[i].set(c.x - sy * c.D / 2, c.z - cy * c.D / 2, cy, -sy);
    W.shade.uBoxB.value[i].set(c.W / 2 + 2, c.D / 2 + 1, info.top - (c.lid ? 1.5 : 0), 0);
  });
  st.nStaticBoxes = list.length;
  // a moving drawer as a shade box: slot, the pour record, live stroke fraction
  st.drawerBox = (slot, p, frac) => {
    const c = p.c, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), len = p.amp * frac + 3;
    const w = p.world(p.xc, 0, len / 2);
    W.shade.uBoxA.value[slot].set(w[0], w[2], cy, -sy);
    W.shade.uBoxB.value[slot].set(55 * p.s, len / 2, p.lip - 1, p.yb);
  };
});

// ---- the river: one shader plane. Analytic sky, the two walls mirrored as bands of colour, sun glitter,
// lily pads and their flowers drawn along both banks, ripple rings where falls land, the canyon shade ----
const CANYON_GLSL = /* glsl */`
// canyon coordinates of a world point: x = metres right of the centre line, y = half width there, z = 1 on leg one .. 0 on leg two
vec3 canyonAt(vec2 p) {
  float t = smoothstep(${(ZB + 10).toFixed(1)}, ${(ZB + 120).toFixed(1)}, p.y - 0.25 * p.x);
  vec2 rel = p - vec2(${P0[0].toFixed(3)}, ${P0[1].toFixed(3)});
  float a1 = dot(rel, vec2(${R0[0].toFixed(5)}, ${R0[1].toFixed(5)}));
  return vec3(mix(p.x, a1, t), mix(55., 65., t), t);
}
vec2 flowAt(float t) { return normalize(mix(vec2(0., 1.), vec2(${(-H0[0]).toFixed(5)}, ${(-H0[1]).toFixed(5)}), t)); }
`;
const RIVER_VS = /* glsl */`
varying vec3 vW; varying vec3 vP; varying vec3 vN;
#include <fog_pars_vertex>
void main() { vP = position; vN = vec3(0., 1., 0.); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIVER_FS = FS_HEAD + CANYON_GLSL + /* glsl */`
uniform vec3 uWater; uniform vec3 uWallLit; uniform vec3 uWallShade; uniform vec3 uGreen; uniform vec3 uCream; uniform vec3 uSaw;
uniform vec4 uRing[6]; uniform float uMist; uniform float uPads; uniform vec4 uFootA[8]; uniform vec4 uFootB[8];
void main() {
  vec2 p = vW.xz; vec3 cc = canyonAt(p); float across = cc.x, hw = cc.y, edge = hw - abs(across);
  vec2 fl = flowAt(cc.z), fr = vec2(fl.y, -fl.x);
  vec2 q = vec2(dot(p, fr), dot(p, fl) - uTime * 2.2);              // river space, sliding downstream
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)); float dist = length(cameraPosition - vW);
  float far = smoothstep(60., 420., dist);
  // ripples: long glassy swells drawn out along the flow plus a finer chop that dies with distance
  vec2 g = vec2(fbm(q * vec2(0.22, 0.07)) - fbm(q * vec2(0.22, 0.07) + vec2(0.9, 0.)), fbm(q * vec2(0.22, 0.07)) - fbm(q * vec2(0.22, 0.07) + vec2(0., 0.9)));
  vec2 q2 = q * 1.3 + vec2(0., uTime * 0.7);
  g += 0.35 * (1. - far) * vec2(vnoise(q2) - vnoise(q2 + vec2(0.6, 0.)), vnoise(q2) - vnoise(q2 + vec2(0., 0.6)));
  float ring = 0.;
  for (int i = 0; i < 6; i++) {
    vec4 R = uRing[i]; float d = length(p - R.xy), w = d * 0.9 - uTime * 3.2;
    ring += R.w * sin(w * 2.2) * exp(-d * 0.09) * smoothstep(0., 3., d) * (1. - smoothstep(R.z * 0.6, R.z, d));
  }
  vec2 toP = p - cameraPosition.xz;
  vec2 gw = (g.x * fr + g.y * fl) * mix(0.22, 0.07, far) + toP / max(length(toP), 1e-3) * ring * 0.05 * (1. - far);
  vec3 N = normalize(vec3(gw.x, 1., gw.y));
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.02;
  // what the mirror sees: sky, or one of the walls (right lit, left in shade)
  float ra = dot(R.xz, fr) , side = ra > 0. ? 1. : -1.;
  float dW = (hw - side * across) / max(abs(ra), 0.02), hY = R.y * dW;
  float wallH = side > 0. ? 250. : mix(48., 150., cc.z * smoothstep(0.55, 0.9, cc.z));
  float hit = (1. - smoothstep(wallH * 0.5, wallH * 1.02, hY)) * step(0., edge) * (1. - smoothstep(6., 40., hw - side * across)) * 0.85;
  float band = 0.75 + 0.25 * sin(hY * 0.33 + 6. * fbm(q * 0.05));     // a memory of the drawer tiers
  vec3 wallC = side > 0. ? uWallLit * band : uWallShade * (0.8 + 0.2 * band);
  vec3 refl = mix(skyAt(R) * mix(vec3(1.), uWater * 1.5, 0.3), wallC, hit);
  float shade = canyonShade(vW + vec3(0., 0.3, 0.));
  float nv = max(dot(N, V), 0.), fres = 0.04 + 0.96 * pow(clamp(1. - nv, 1e-4, 1.), 5.);
  float depth = smoothstep(0., 16., edge);
  // beyond the walls the furniture stands in a wide shallow sea: turquoise channels between pale sawdust bars
  float plaza = (1. - smoothstep(205., 232., p.y)) * step(edge, 0.);        // open water round the foot of the Tallboy
  float sea = max(smoothstep(62., 110., -edge), plaza), bars = mix(smoothstep(0.26, 0.46, fbm(p * 0.0052 + 3.7) * 0.75 + 0.25 * fbm(p * 0.021)), 1., plaza);
  depth = max(depth, sea * bars);
  vec3 body = mix(uSaw * 0.42, uWater * vec3(0.34, 0.5, 0.5), depth) * (uSunCol * 0.46 * shade + uSky * 0.33 + uBounce * 0.1);
  body = mix(body, uWater * vec3(0.22, 0.52, 0.58) * (uSunCol * 0.42 * shade + uSky * 0.5), sea * bars * (0.45 + 0.4 * smoothstep(0.4, 0.75, fbm(p * 0.009 + 11.))));
  float open = max(smoothstep(62., 110., -edge), plaza * smoothstep(60., 95., abs(p.x))), mir = 0.;
  for (int i = 0; i < 8; i++) {                       // the chests that stand out in the sea stain it: a walnut tint by distance to their plinths, soft-edged, nothing mirrored
    vec4 fa = uFootA[i], fb = uFootB[i]; vec2 ax = fa.zw, az = vec2(-fa.w, fa.z), rel = p - fa.xy;
    vec2 lq = vec2(dot(rel, ax), dot(rel, az));
    float dF = length(max(abs(lq) - fb.xy, 0.)) + 10. * (fbm(p * 0.05 + float(i) * 3.1) - 0.5);
    mir = max(mir, (1. - smoothstep(0., 60., dF)) * fb.w * open);
  }
  body = mix(body, mix(uWallLit * 1.15, mix(uWallLit, uWallShade, 0.55), mir) * (0.7 + 0.3 * shade), 0.82 * smoothstep(0., 0.7, mir));      // lighter walnut at its edge, red-brown against the plinth
  vec3 col = mix(body, refl, clamp(fres * 0.8 + 0.05, 0., mix(0.66, 0.22, sea)));
  // wind on the open sea: slow cat's-paws, darker and brighter patches that travel
  col *= mix(1., 0.8 + 0.48 * smoothstep(0.42, 0.7, fbm(p * vec2(0.016, 0.036) + vec2(uTime * 0.26, uTime * 0.1))), open);
  col *= mix(1., 0.92 + 0.16 * smoothstep(0.3, 0.7, fbm(p * vec2(0.05, 0.11) + vec2(uTime * 0.9, uTime * 0.4))), open);   // cat's-paws racing over the open water
  col += uSunCol * 0.04 * open * smoothstep(0.62, 0.9, vnoise(p * vec2(0.5, 1.1) + vec2(uTime * 2.3, -uTime * 1.7)) * (0.6 + 0.8 * fbm(p * 0.03 + uTime * 0.2)));
  vec3 L = normalize(uSun), Hh = normalize(L + V + vec3(0., 1e-4, 0.));
  float sp = pow(clamp(dot(N, Hh), 1e-4, 1.), 180.);
  // the sun on the water is gold streaks lying toward it, never a white mirror of the disc
  float gn = vnoise(p * vec2(0.07, 0.55) + vec2(uTime * 0.5, uTime * 0.3)) * 0.6 + vnoise(p * vec2(0.19, 1.5) - vec2(uTime * 0.7, 0.)) * 0.4;
  float glit = min(sp * 1.6, 0.5) * (0.2 + 0.8 * smoothstep(0.42, 0.72, gn)) * (0.5 + 0.5 * fbm(p * 0.02 + 7.));
  col += uSunCol * (vec3(1., 0.8, 0.46) * glit + (0.11 - 0.06 * open) * smoothstep(0.5, 0.9, fbm(q * vec2(0.5, 0.12))) + 0.035 - 0.015 * open) * shade;      // on the open sea the pale streaks are fewer: the water stays turquoise between the gold ones
  // lily pads in rafts along both banks
  vec2 lp = p / 2.3 + 0.12 * vec2(sin(uTime * 0.4 + p.y * 0.2), cos(uTime * 0.33 + p.x * 0.2)) / 2.3;
  float raft = smoothstep(0.42, 0.62, fbm(p * 0.045 + 3.)) * (1. - smoothstep(9., 26., edge)) * smoothstep(1.5, 4., edge) * uPads * (1. - smoothstep(260., 420., dist));
  // the sea is the river widened: rafts of pads lie against the sea chests' feet and drift on the open water under the helix
  raft = max(raft, open * uPads * (1. - smoothstep(380., 620., dist)) * max(smoothstep(0.52, 0.66, fbm(p * 0.016 + 13.)) * smoothstep(0.3, 0.6, fbm(p * 0.06 + 3.)), smoothstep(0.12, 0.4, mir) * (1. - smoothstep(0.86, 0.99, mir)) * smoothstep(0.4, 0.6, fbm(p * 0.045 + 3.))));
  if (raft > 0.01) {
    vec2 ci = floor(lp), cf = fract(lp); float best = 9., rr = 0., hsh = 0.; vec2 bo = vec2(0.);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 gg = vec2(float(x), float(y)); vec2 h = h22(ci + gg); vec2 o = gg + 0.2 + 0.6 * h - cf; float d = length(o);
      if (d < best) { best = d; bo = o; hsh = h.x; rr = 0.22 + 0.2 * h.y; }
    }
    float keep = step(1. - raft, fract(hsh * 7.3));
    float ang = satan(bo.y, bo.x) + hsh * 20., notch = smoothstep(0.1, 0.22, abs(sin(ang * 0.5)));
    float aa = 0.02 + dist * 0.0006, pad = (1. - smoothstep(rr - aa, rr + aa, best)) * mix(1., notch, smoothstep(0.03, 0.08, best)) * keep;
    vec3 pc = uGreen * mix(vec3(0.5, 0.75, 0.3), vec3(0.85, 1.0, 0.5), fract(hsh * 3.1)) * (1. - 0.3 * smoothstep(rr * 0.5, rr, best)) * (0.9 + 0.2 * sin(ang * 9.));
    pc = pc * (uSunCol * 0.62 * shade + uSky * 0.5 + uBounce * 0.2);
    float fl2 = (1. - smoothstep(0.07, 0.1 + aa, length(bo - vec2(0.05, 0.02)))) * step(0.72, fract(hsh * 13.7)) * keep;
    pc = mix(pc, uCream * (uSunCol * 0.7 * shade + uSky * 0.6), fl2);
    col = mix(col, pc, pad);
  }
  // sawdust afloat against the banks, foam rings
  float film = (1. - smoothstep(1., 7., edge + 3. * fbm(p * 0.2))) * (0.5 + 0.5 * fbm(q * 0.6)) * mix(1., 0.75 * (1. - bars), sea);
  col = mix(col, uSaw * (uSunCol * 0.5 * shade + uSky * 0.5) * 0.8, clamp(film, 0., 1.) * 0.8);
  col += vec3(0.8, 0.9, 0.9) * max(ring, 0.) * 0.3 * (uSunCol * 0.4 * shade + uSky * 0.5);
  col = mix(col, uHorizon * 1.02, uMist * smoothstep(40., 260., dist) * 0.35 * (1. - 0.75 * sea));
  gl_FragColor = vec4(col, 1.);
  #ifdef USE_FOG
  float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);      // the open sea keeps a horizon: the haze takes it more slowly
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogF * mix(1., 0.6, sea));
  #endif
}`;
STEPS.push(async (W) => {
  const { timber, hour, hold } = W, hu = W.hero.object.children[0].material.uniforms;
  const lit = hu.uWoodB.value.clone().multiply(W.U.uSunCol.value).multiplyScalar(0.62), shd = hu.uWoodA.value.clone().multiplyScalar(0.55).add(new THREE.Color(timber.pal[2]).multiplyScalar(0.03));
  const rings = []; for (let i = 0; i < 6; i++) rings.push(new THREE.Vector4(0, 0, 1, 0));
  const footA = [], footB = [], outs = W.state.cabs.filter((i) => Math.abs(i.c.x) > 130 || i.c.z < 60).sort((a, b) => Math.hypot(a.c.x + 140, a.c.z - 300) - Math.hypot(b.c.x + 140, b.c.z - 300));
  for (let i = 0; i < 8; i++) { const o = outs[i], c = o && o.c;
    if (c) { const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw); footA.push(new THREE.Vector4(c.x - c.D / 2 * sy, c.z - c.D / 2 * cy, cy, -sy)); footB.push(new THREE.Vector4(c.W / 2, c.D / 2, o.top, 1)); }
    else { footA.push(new THREE.Vector4(0, 0, 1, 0)); footB.push(new THREE.Vector4(1, 1, 1, 0)); } }
  const mat = W.mat(RIVER_VS, RIVER_FS, { uWater: { value: new THREE.Color(W.palette[5]) }, uWallLit: { value: lit }, uWallShade: { value: shd }, uGreen: { value: new THREE.Color('#5E8F5A') },
    uCream: { value: new THREE.Color(timber.pal[3]) }, uSaw: { value: new THREE.Color(timber.saw) }, uRing: { value: rings }, uMist: { value: hour.mist }, uPads: { value: 1 }, uFootA: { value: footA }, uFootB: { value: footB } });
  const geo = new THREE.PlaneGeometry(5200, 5200, 1, 1).rotateX(-Math.PI / 2);
  const river = new THREE.Mesh(geo, mat); river.position.set(0, 0, 400); river.frustumCulled = false; W.scene.add(river);
  W.state.rings = rings; W.state.riverMat = mat;
  const cf = W.A.cascadeFoot; rings[0].set(cf.x, cf.z, 90, 1);
});

// ---- drawers in motion. Every channel has a stroke fraction (0 shut .. 1 out) and, if it pours, a fall state:
// head = metres the first water has fallen since the pool began to spill, cut = metres the severed top has
// dropped since the drawer started home (0 = uncut), wide = 0..1 trickle to full. Cyclic channels run on time,
// scripted ones (A beside us, B overhead, C the cut fall, and the rare wave) on the flight's u. ----
STEPS.push(async (W) => {
  const st = W.state, chans = st.chans, CH = st.CH, L = W.path.length, SPD = L / W.DUR;   // SPD: metres flown per second on average
  const head = { value: new Array(NCH).fill(0) }, cut = { value: new Array(NCH).fill(0) }, wide = { value: new Array(NCH).fill(0) }, fslide = { value: new Array(NCH).fill(0) };
  W.fall = { uHead: head, uCut: cut, uWide: wide, uFSlide: fslide };
  chans[CH.A] = { kind: 'scr', frac: 0 }; chans[CH.B] = { kind: 'scr', frac: 0 }; chans[CH.C] = { kind: 'scr', frac: 1 };
  // the rare event: as we come round the bend a wave of closing drawers runs up leg two toward us (the far ones
  // first, so their severed columns have dropped furthest), then the drawers reopen one by one
  const R = W.rng.fork ? W.rng.fork('wave') : W.rng;
  for (const c of chans) if (c.kind === 'cyc') { c.rareOn = W.rare && st.inWave(c.x, c.z); c.mShut = 157 + clamp((c.z - 230) / 470, 0, 1.1) * 110; c.mOpen = 430 + R() * 200; }
  // seconds since the spill began, seconds since the cut (<= 0: uncut). The severed top drops at 3 t^2 (a little
  // slower than free fall, so the column hangs long enough to be read), the head of a new fall at 4.9 t^2.
  const setFall = (i, tOn, tCut, lead) => {
    head.value[i] = tOn > 0 ? 4.9 * tOn * tOn : 0; cut.value[i] = tCut > 0 ? CUT_G * tCut * tCut : 0;
    wide.value[i] = tOn > 0 ? (0.25 + 0.75 * ease(tOn / 3)) * (1 - 0.45 * ease((lead + 2.5) / 2.5)) : 0;
    fslide.value[i] = tCut > 0 ? 1 : chans[i].frac;
  };
  st.fracOf = (ch) => chans[ch].frac;
  const MC = W.rare ? 432 : 440;                        // metres flown when drawer C starts home and its fall is cut
  st.MC = MC;
  W.updaters.push((dt, t, cam, u) => {
    const m = u * L;
    for (let i = 0; i < NCH; i++) {
      const c = chans[i];
      if (c.kind === 'sea' || c.kind === 'top') {      // a sea chest's drawer works between part open and full out on its own cycle, pouring all the while; a top drawer of the
        // right wall does the same, but stands shut and dry while the flight is on the river below it (a 240 m fall would drop on the flight line) and comes out over the
        // hundred metres after the flight has left the river at the stair's foot
        const p = (t / c.period + c.phase) % 1, tri = 1 - Math.abs(2 * p - 1), open = c.kind === 'top' ? ramp(m, W.PL.foot, W.PL.foot + 100) : 1;
        c.frac = open * (0.4 + 0.6 * ease((tri - 0.3) / 0.4)); setFall(i, c.kind === 'top' ? (m - W.PL.foot - 60) / SPD : 20, 0, -9); W.slide.value[i] = c.frac; continue; }
      if (c.kind !== 'cyc') continue;
      // on the day of the wave the wall chests of leg two stand full out and pour from the visit's first frame: there is no
      // hand-over from their own cycle on the way in (it stood at 120 m of flight and showed as a jump in one frame)
      if (c.rareOn && m < 760) {
        c.frac = m < c.mOpen ? 1 - ramp(m, c.mShut, c.mShut + 90) : ramp(m, c.mOpen, c.mOpen + 90);
        if (m < c.mOpen + 70) setFall(i, 20, (m - c.mShut) / SPD, (m - c.mShut) / SPD); else setFall(i, (m - c.mOpen - 70) / SPD, 0, -9);
        wide.value[i] *= 1 + 1.5 * (1 - ramp(m, 690, 760));          // on the day of the wave every drawer pours in spate
        W.slide.value[i] = c.frac; continue;
      }
      const p = (t / c.period + c.phase) % 1, tri = 1 - Math.abs(2 * p - 1);
      c.frac = ease((tri - 0.3) / 0.4);
      setFall(i, (p - 0.36) * c.period, (p - 0.65) * c.period, (p - 0.65) * c.period);
      W.slide.value[i] = c.frac;
    }
    const A = chans[CH.A], B = chans[CH.B], C = chans[CH.C];
    A.frac = 0.12 + 0.88 * ramp(m, 14, 90); B.frac = 0.06 + 0.94 * ramp(m, 16, 112);
    setFall(CH.A, (m - 55) / SPD, 0, -9); setFall(CH.B, (m - 60) / SPD, 0, -9);
    C.frac = m < 760 ? 1 - ramp(m, MC, MC + 130) : ramp(m, 800, 1000);
    if (m < 780) setFall(CH.C, 30, (m - MC - 4) / SPD, (m - MC) / SPD); else setFall(CH.C, (m - 960) / SPD, 0, -9);
    W.slide.value[CH.A] = A.frac; W.slide.value[CH.B] = B.frac; W.slide.value[CH.C] = C.frac;
    // the moving drawers that matter throw shadows too
    const sp = st.scripted; if (sp) { st.drawerBox(st.nStaticBoxes, sp.B, B.frac); st.drawerBox(st.nStaticBoxes + 1, sp.C, C.frac); st.drawerBox(st.nStaticBoxes + 2, sp.A, A.frac); }
  });
  st.scripted = {}; for (const p of st.pours) if (p.scripted) st.scripted[p.scripted] = p;
});

// ---- falls: every pouring drawer gets a pair of crossed ribbons from its notch to the river, a foam ring and
// standing mist at the foot. The hero's fall shader draws them; ours adds the flat cut and the falling head. ----
const FALL2_VS = /* glsl */`
attribute float aDrw; attribute vec3 aSl; attribute vec2 aUv; attribute vec4 aMat; attribute float aDrop;
uniform float uSlide[${NCH}]; uniform float uFSlide[${NCH}]; uniform float uHead[${NCH}]; uniform float uCut[${NCH}]; uniform float uWide[${NCH}]; uniform float uTime;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vMat; varying vec3 vCut;
#include <fog_pars_vertex>
void main() {
  int ch = int(clamp(aDrw + 0.5, 0., ${NCH - 1}.));
  vUv = aUv; vMat = aMat; vP = position; vN = vec3(0., 0., 1.);
  float H = aMat.x, hd = uHead[ch], ct = uCut[ch], wd = uWide[ch];
  vec3 p = position + aSl * uFSlide[ch];
  vec3 side = normalize(vec3(aSl.z, 0., -aSl.x) + vec3(1e-5, 0., 0.));
  float v = aUv.y;
  if (aMat.w < 0.5) {                                   // the ribbon: narrows to a trickle, wavers as it falls
    p -= side * aDrop * (1. - wd);
    p += side * (aMat.z > 5. ? 1.6 : 0.35) * sin(uTime * 1.7 + v * 9. + aMat.z * 6.) * v * v;
    vCut = vec3(v * v * H, ct, hd);
  } else {                                              // foot: foam ring and mist live only while water is landing
    float on = step(H, hd) * (1. - smoothstep(H, H + 12., ct)) * (0.4 + 0.6 * wd);
    float burst = smoothstep(H - 8., H, ct) * (1. - smoothstep(H, H + 14., ct));
    vMat = vec4(aMat.y * (on + 1.2 * burst), 0., aMat.z, aMat.w); vCut = vec3(1., 0., 100.);
    p.y += burst * 3. * step(aMat.w, 1.5);
  }
  vW = p;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  if (aMat.w > 0.5 && aMat.w < 1.5) mvPosition.xy += aUv * aDrop * (1. + 0.15 * sin(uTime * 0.8 + aMat.z * 20.));   // mist puffs face the eye
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FALL2_FS = FALL_FS.replace('void main() {', 'varying vec3 vCut;\nvoid main() {')
  .replace('gl_FragColor = vec4(col, clamp(a, 0., 1.));', `
  float capT = vCut.y > 0.01 ? (1. - smoothstep(0., 2.5, vCut.x - vCut.y)) : 0., capH = 1. - smoothstep(0., 3., vCut.z - vCut.x);
  a = mix(a, min(1., a * 1.5 + 0.55 * (1. - min(abs(vUv.x), 1.))), max(capT, capH * 0.6));
  col = mix(col, vec3(0.9, 0.96, 0.95) * (uSunCol * 0.4 + uSky * 0.5), max(capT, capH) * 0.7);
  a *= step(vCut.y, vCut.x) * step(vCut.x, vCut.z);
  gl_FragColor = vec4(col, clamp(a, 0., 1.));`);
STEPS.push(async (W) => {
  const st = W.state, R0f = W.rng.fork ? W.rng.fork('falls') : W.rng, RSf = W.own('sea-falls');      // the falls of the sea drawers and the wall's top drawers are dealt from a stream of their own
  const pos = [], uv = [], mm = [], dd = [], sl = [], dr = [], idx = []; let c = 0;
  for (const p of st.pours) {
    const R = p.sea ? RSf : R0f;
    const cab = p.c, cy = Math.cos(cab.yaw), sy = Math.sin(cab.yaw), s = p.s, big = p.scripted ? 1.35 : 1;
    // a fall into the sea is seen whole from far off: a column whose edges fray into strands and spray as it drops, no two of one width
    const sea = p.sea && !p.top ? 1 : 0, hv = sea ? R() : 0, hw = sea ? R() : 0;
    const y0 = p.lip - 1.35 * s, H = y0 - 0.1, z0 = (3.2 + 5 - 0.6) * s, seed = R() + sea * 10, wHalf0 = p.scripted === 'C' ? 4.3 : sea ? 2.7 + 1.6 * hv : 3.4 * Math.max(s, 0.55) * big, reach = 2.5 + H * 0.06, flare = sea ? (2.2 + 2.6 * hw) * Math.min(1, 0.45 + H / 220) : 0;      // a sea fall is a column 5 to 9 m wide, wider at the foot only by its fraying
    const push = (lx, y, lz, u, v, m, drop) => { const w = p.world(lx, y, lz); pos.push(w[0], w[1], w[2]); uv.push(u, v); mm.push(...m); dd.push(p.ch); sl.push(sy * p.amp, 0, cy * p.amp); dr.push(drop); c++; };
    for (let layer = 0; layer < 2; layer++) {
      const lite = sea && cab.r >= 400, nu = lite ? 4 : 6, nv = lite ? 12 : 18, base = c;      // (a sea fall 400 m and more from the harbour is cut in fewer pieces)
      for (let r = 0; r <= nv; r++) for (let k = 0; k <= nu; k++) {
        const v = r / nv, xn = (k / nu) * 2 - 1, wH = (wHalf0 * (1 - 0.2 * smoothstep(0, 0.25, v)) + (sea ? flare * Math.pow(v, 1.5) : 1.8 * v * v)) * (layer ? 0.8 : 1);
        push(p.xc + xn * wH, y0 + 0.25 * (1 - smoothstep(0, 0.04, v)) - H * v * v, z0 + 0.6 + reach * v + (1 - xn * xn) * 0.5 + layer * (0.45 + 0.5 * v), xn, v, [H, layer, seed, 0], xn * wH * 0.75);
      }
      for (let r = 0; r < nv; r++) for (let k = 0; k < nu; k++) { const a = base + r * (nu + 1) + k, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const zf = z0 + 0.6 + reach + 0.6;
    { const b = c, r = (sea ? 12 + 5 * hw : 11) * big; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) push(p.xc + u * r, 0.14, zf + v * r, u, v, [H, sea ? 0.85 : 0.7, R(), 2], 0); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    for (let k = 0; k < 5; k++) { const ms = sea ? 1.4 + 0.6 * hw : 1, b = c, r = R.range(3, 5.5) * big * ms, cx = p.xc + R.range(-3, 3) * ms, yy = R.range(1.5, 5) * (sea ? 2 : 1), zz = zf + R.range(-1.5, 2) * ms;
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) push(cx, yy, zz, u, v, [H, sea ? 0.3 : 0.2, R(), 1], r); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    p.foot = p.world(p.xc, 0, zf); p.fallH = H;
    await W.ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(mm, 4));
  g.setAttribute('aDrw', new THREE.Float32BufferAttribute(dd, 1)); g.setAttribute('aSl', new THREE.Float32BufferAttribute(sl, 3)); g.setAttribute('aDrop', new THREE.Float32BufferAttribute(dr, 1)); g.setIndex(idx);
  const mat = W.mat(FALL2_VS, FALL2_FS, { uWater: { value: new THREE.Color(W.palette[5]) }, uCream: { value: new THREE.Color(W.timber.pal[3]) }, ...W.fall }, { side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; W.scene.add(mesh);
  // ripple rings on the river follow the falls nearest the camera
  const tmp = st.pours.map((p) => ({ p, d: 0 }));
  const camP = new THREE.Vector3();
  W.updaters.push((dt, t, cam) => {
    cam.getWorldPosition(camP);
    for (const e of tmp) { const f = e.p.foot, k = st.fracOf(e.p.ch) * e.p.amp, cab = e.p.c; e.x = f[0] + Math.sin(cab.yaw) * k; e.z = f[2] + Math.cos(cab.yaw) * k;
      const on = W.fall.uHead.value[e.p.ch] >= e.p.fallH && W.fall.uCut.value[e.p.ch] < e.p.fallH + 10; e.d = on ? Math.hypot(e.x - camP.x, e.z - camP.z) : 1e9; }
    tmp.sort((a, b) => a.d - b.d);
    for (let i = 1; i < 6; i++) { const e = tmp[i - 1]; if (e && e.d < 1e8) st.rings[i].set(e.x, e.z, 70, 0.8); else st.rings[i].w = 0; }
  });
});

// ---- what the drawers hold: a meadow floor with a pool in every pouring drawer and on every low chest's lid,
// tufts and flowers, trailing grass over the lips, apple trees, and the grazing herd (the hero's own animals) ----
const MEADOW_FS = FS_HEAD + /* glsl */`
uniform vec3 uGreen; uniform vec3 uGold; uniform vec3 uWater; uniform vec3 uCream;
varying vec2 vUv; varying vec4 vMat;                     // vUv = metres (across, back from the lip); vMat = pool (z, rx, rz, 0)
void main() {
  vec2 b = vUv; float fw = max(fwidth(b.x), fwidth(b.y));
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  float ptc = fbm(b * 0.11 + 7.), fine = vnoise(b * vec2(2.6, 7.)) * (1. - smoothstep(0.1, 0.5, fw));
  vec3 alb = mix(uGreen * 0.55, mix(uGreen, uGold, 0.4) * 0.95, smoothstep(0.3, 0.75, ptc)) * (0.78 + 0.4 * fine + 0.2 * fbm(b * 0.6));
  vec2 fc = b * 1.1; float fd = cell(fc), fh = h21(floor(fc) + 3.);
  float dot1 = (1. - smoothstep(0.1, 0.16 + fw, fd)) * step(0.45, fbm(b * 0.07 + fh)) * (1. - smoothstep(0.25, 0.7, fw));
  alb = mix(alb, fh < 0.5 ? uCream * 0.8 : (fh < 0.8 ? vec3(0.7, 0.5, 0.06) : mix(vec3(0.14, 0.22, 0.6), uGold, 0.3)), dot1);
  float sh = canyonShade(vW + vec3(0., 0.4, 0.));
  vec3 col = alb * (uSunCol * 0.62 * sh * max(L.y + 0.25, 0.3) * 1.5 + ambientAt(vec3(0., 1., 0.)));
  if (vMat.y > 0.5) {
    float d = (length(vec2(b.x / vMat.y, (b.y - vMat.x) / max(vMat.z, 0.5))) - 1.) * min(vMat.y, vMat.z);
    d = min(d, max(abs(b.x) - 2.2, b.y - vMat.x));
    col *= 1. - 0.45 * (1. - smoothstep(0., 1.6, d));
    vec2 rp = b * 0.9 + vec2(0., uTime * 0.25); vec3 Nw = normalize(vec3(vnoise(rp) - vnoise(rp + vec2(0.5, 0.)), 6., vnoise(rp) - vnoise(rp + vec2(0., 0.5))));
    vec3 wc = mix(uWater * 0.3 * (uSunCol * 0.4 * sh + uSky * 0.5), skyAt(reflect(-V, Nw)), 0.25 + 0.6 * pow(clamp(1. - V.y, 1e-4, 1.), 3.));
    wc += uSunCol * sh * pow(clamp(dot(Nw, normalize(L + V + vec3(0., 1e-4, 0.))), 1e-4, 1.), 220.) * 2.;
    col = mix(col, wc, smoothstep(0., 0.15 + fw, -d));
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const TUFT2_VS = /* glsl */`
attribute vec2 uv2; attribute vec3 iPos; attribute vec4 iDat; attribute vec3 iSl; attribute float iCh;
uniform float uSlide[${NCH}]; uniform float uTime;
varying vec2 vT; varying vec3 vW; varying vec4 vD;
#include <fog_pars_vertex>
void main() {
  float w = iDat.x, h = iDat.y, yaw = iDat.z + position.z * 1.5708, c = cos(yaw), s = sin(yaw);
  vec3 p = iPos + iSl * uSlide[int(clamp(iCh + 0.5, 0., ${NCH - 1}.))];
  float v = uv2.y, sway = (0.16 * sin(uTime * 1.3 + iPos.x * 0.21 + iPos.z * 0.17) + 0.08 * sin(uTime * 2.9 + iDat.w * 30.)) * v * v * abs(h);
  p += vec3(c * position.x * w, v * h, s * position.x * w) + vec3(0.8, 0., 0.5) * sway;
  if (h < 0.) p.xz += normalize(iSl.xz + vec2(1e-4, 0.)) * 0.5 * v;      // trailing grass hangs a little proud of the front
  vT = uv2; vW = p; vD = iDat;
  vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TUFT2_FS = FS_HEAD + /* glsl */`
uniform vec3 uGreen; uniform vec3 uGold; uniform vec3 uCream;
varying vec2 vT; varying vec4 vD;
void main() {
  float u = vT.x, v = vT.y, seed = vD.w, hang = step(vD.y, 0.);
  float n = 7. + floor(seed * 5.), bl = fract(u * n + seed * 3.), id = floor(u * n + seed * 3.), hgt = 0.55 + 0.45 * h21(vec2(id, seed * 91.));
  float lean = (h21(vec2(id + 4., seed * 17.)) - 0.5) * 0.9 * v;
  float a = step(abs(bl - 0.5 + lean) * 2., (1. - v / hgt) * 0.9) * step(v, hgt);
  float fl = step(0.72, h21(vec2(id, seed * 5.))) * (1. - hang), fy = hgt * 0.92;
  float flower = fl * (1. - smoothstep(0.16, 0.24, length(vec2((bl - 0.5 + lean) * 0.9, (v - fy) * 2.4))));
  if (max(a, flower) < 0.5) discard;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  vec3 g = mix(uGreen * 0.45, mix(uGreen, uGold, 0.2 + 0.4 * h21(vec2(id, 2.))) * 0.9, v / hgt);
  g = mix(g, uGreen * vec3(0.5, 0.74, 0.38) * (0.7 + 0.3 * v), hang * 0.85);
  float fk = fract(seed * 23.7); vec3 fc = fk < 0.5 ? uCream * 0.7 : (fk < 0.8 ? vec3(0.66, 0.46, 0.05) : mix(vec3(0.13, 0.2, 0.55), uGold, 0.35));
  vec3 alb = mix(g, fc, flower);
  float back = pow(clamp(dot(-V, L) * 0.5 + 0.5, 1e-4, 1.), 2.), sh = canyonShade(vW + vec3(0., 0.5, 0.));
  gl_FragColor = vec4(alb * (uSunCol * sh * (0.5 + 0.5 * back) * mix(0.4 + 0.6 * v, 1., flower) + uSky * 0.45 + uBounce * 0.3), 1.);
  #include <fog_fragment>
}`;
const PROP2_VS = PROP_VS.replace('void main() {', `attribute vec3 aSl; uniform float uSlide[${NCH}];\nvoid main() {`).replace('p.z += drwOff();', `p += aSl * uSlide[int(clamp(aDrw + 0.5, 0., ${NCH - 1}.))];`);
const PROP2_FS = PROP_FS.replace('uSunCol * (wrap + 0.35 * back)', 'uSunCol * canyonShade(vW + vec3(0., 0.5, 0.)) * (wrap + 0.35 * back)');
STEPS.push(async (W) => {
  const st = W.state, hold = W.hold, R0m = W.rng.fork ? W.rng.fork('meadows') : W.rng, RSm = W.own('sea-meadows'), RSw = W.own('sea-washing'), dq = W.detail * W.density;
  let R = R0m;      // the sea drawers and the wall's top drawers are dressed from a generator of their own (RSm), the washing from another (RSw)
  const own = { uGreen: { value: new THREE.Color(hold.green) }, uGold: { value: new THREE.Color(hold.gold) }, uWater: { value: new THREE.Color(W.palette[5]) }, uCream: { value: new THREE.Color(W.timber.pal[3]) } };
  const M = new WGeo(), P = new PGeo(), psl = [];
  const iPos = [], iDat = [], iSl = [], iCh = [];
  const tuft = (w3, wd, h, sv, ch) => { iPos.push(w3[0], w3[1], w3[2]); iDat.push(wd, h, R.range(0, 3.14), R()); iSl.push(sv[0], 0, sv[2]); iCh.push(ch); };
  const prop = (sv, ch, fn) => { const k0 = P.k; fn(ch); for (let k = k0; k < P.k; k++) psl.push(sv[0], 0, sv[2]); };
  const herd = (kind) => (kind === 'goat' ? 'goat' : 'deer');
  // pouring drawers
  for (const p of st.pours) {
    R = p.sea ? RSm : R0m;
    const c = p.c, s = p.s, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), sv = [sy * p.amp, 0, cy * p.amp], hw = 52.5 * s, y = p.lip - Math.max(0.7, s), L = p.tray - 1;
    M.frame(c.x, c.z, c.yaw); M.slide(p.amp, p.ch);
    const z0 = 0.4 * s + 5 * s, z1 = 0.2 * s - L, pool = [Math.min(9, L * 0.3), 11 * Math.max(s, 0.5), Math.min(5, L * 0.18), 0];
    M.quad([p.xc - hw, y, z0], [p.xc + hw, y, z0], [p.xc + hw, y, z1], [p.xc - hw, y, z1], [[-hw, z0 - 5.4 * s - z0], [hw, z0 - 5.4 * s - z0], [hw, z0 - z1], [-hw, z0 - z1]], pool, 0);
    const at = (lx, back) => p.world(p.xc + lx, y, 0.2 * s + 5 * s * (1 - (lx / (55 * s)) ** 2) - back);
    const near = p.scripted === 'A', far = p.light || p.sea; P.lod = near ? 0 : far ? 2 : 1;
    const nT = Math.round((near ? 1100 : p.scripted ? 260 : p.sea ? (p.top || c.r < 400 ? 8 : 0) : far ? 45 : 90) * dq);
    for (let k = 0; k < nT; k++) {
      const lx = R.range(-hw + 0.5, hw - 0.5), back = (near ? 4.5 : 0.6) + (near ? L - 6 : Math.min(L - 2, 14)) * R() ** 1.4;
      if (Math.hypot(lx / pool[1], (back - pool[0]) / pool[2]) < 1.15 || (Math.abs(lx) < 3 && back < pool[0])) continue;
      const reed = Math.hypot(lx / pool[1], (back - pool[0]) / pool[2]) < 1.5;
      tuft(at(lx, back), reed ? R.range(1, 1.6) : R.range(1.8, 3.2), reed ? R.range(1.8, 2.8) : R.range(0.7, 1.4), sv, p.ch);
    }
    const nF = Math.round((p.scripted ? 40 : p.sea ? (p.top || c.r < 400 ? 3 : 0) : far ? 12 : 22) * Math.max(0.6, W.detail));
    for (let k = 0; k < nF; k++) { let lx = R.range(-hw, hw); if (Math.abs(lx) < 5 * s + 1) lx = Math.sign(lx || 1) * R.range(5 * s + 1, hw);
      const w3 = p.world(p.xc + lx, p.lip - 0.2, (3.2 + 5 * (1 - (lx / (55 * s)) ** 2)) * s + 0.25); tuft(w3, R.range(2.5, 5.5), -R.range(1.8, 4.6) * Math.max(s, 0.6), sv, p.ch); }
    if (p.sea) {
      // a drawer that stands out over the sea or from the wall's top is seen from hundreds of metres: it carries its own scale. One old apple tree at one end of its
      // lip (at the size live's own call for a drawer's tree gives: no size argument) and, where a deer can still be read (the wall's top drawers and the chests within 400 m of the
      // harbour), two of the herd grazing along the lip at the other end; beyond that the tree alone is the giver
      const side = R() < 0.5 ? -1 : 1, w3 = at(side * R.range(0.5, 0.8) * hw, R.range(5, 9));
      prop(sv, p.ch, (ch) => addTree(P, R, [w3[0], w3[1] - 0.1, w3[2]], ch));
      for (let k = 0; k < (p.top || p.c.r < 400 ? 2 : 0); k++) { const w5 = at(-side * (0.3 + 0.25 * k + 0.1 * R()) * hw, R.range(2, 6)); prop(sv, p.ch, (ch) => addAnimal(P, R, w5, R.range(0, 6.28), ch, herd(hold.herd))); }
      await W.ctx.yield(); continue;
    }
    // one or two old apple trees and a few of the herd near the lip
    const nt = near ? 3 : p.light ? 1 : R.int(1, 2), kind = herd(hold.herd);
    for (let k = 0; k < nt; k++) { const lx = (k % 2 ? -1 : 1) * R.range(0.45, 0.85) * hw, w3 = at(lx, near ? R.range(16, 40) : R.range(5, 12)); prop(sv, p.ch, (ch) => addTree(P, R, [w3[0], w3[1] - 0.1, w3[2]], ch)); }
    const na = near || p.light ? 0 : R.int(2, 3), gx = R.range(0.3, 0.7) * hw * (R() < 0.5 ? -1 : 1);
    for (let k = 0; k < na; k++) { const w3 = at(gx + R.range(-6, 6), R.range(2, 7)); prop(sv, p.ch, (ch) => addAnimal(P, R, w3, R.range(0, 6.28), ch, kind)); }
    if (near) {                                       // drawer A: three of the herd grazing at the lip, right beside the flight
      const along = [-0.4, -0.16, 0.12, 0.38];
      along.forEach((f, k) => { const w3 = at(f * 2 * hw, 1.6 + (k % 2) * 2.2); prop(sv, p.ch, (ch) => addAnimal(P, R, w3, c.yaw + 1.2 + R.range(-0.8, 0.8), ch, k === 1 ? 'stag' : kind)); });
      st.aMeadow = at(0, 6);
    }
    await W.ctx.yield();
  }
  await W.ctx.yield();
  // washing between the two handles of a shut drawer, on the sea chests near enough for it to be read (within 420 m of the axis; which tier, and every cloth, from the washing's own generator)
  for (const info of st.sea) { const sc = info.sea, c = info.c; if (sc.r > 420) continue;
    const taken = info.pours.map((q) => Math.round((q.yb - info.base) / info.tierH)), bow = (x) => 5 * (1 - (x / 55) * (x / 55));
    let tier = 1 + RSw.int(0, Math.max(1, Math.floor(c.n * 0.4)) - 1); while (taken.includes(tier)) tier++;
    const s = c.s, yb = info.base + info.tierH * tier + 4 * s, A = [-25 * s, yb + 13.8 * s, (3.2 + bow(25) + 6.6) * s], B = [25 * s, A[1], A[2]], seg = 24, sag = (f) => -3.2 * s * 4 * f * (1 - f);
    const pt = (f) => [lerp(A[0], B[0], f), A[1] + sag(f), A[2]], line = [0.75, 0.7, 0.6], cols = [[0.75, 0.72, 0.66], [0.6, 0.08, 0.06], [0.75, 0.72, 0.66], [0.14, 0.24, 0.5], [0.72, 0.6, 0.3], [0.75, 0.72, 0.66], [0.55, 0.2, 0.3]];
    prop([0, 0, 0], 0, () => { P.lod = 2; P.at([c.x, 0, c.z], c.yaw, 1, 0); P.piv = [0, 0, 0]; P.anim = [0, 0, 0];
      for (let k = 0; k < seg; k++) P.tube(pt(k / seg), pt((k + 1) / seg), 0.07, 0.07, line, line, 3);
      for (let f = RSw.range(0.06, 0.11); f < 0.92;) { const w = RSw.range(1.2, 3.6), h = RSw.range(1.4, 3), col = cols[RSw.int(0, cols.length - 1)], p0 = pt(f), p1 = pt(f + w / (50 * s)), ph = RSw();
        P.anim = [0, ph, 0]; const a = P.v(p0, [0, 0, 1], col), b = P.v(p1, [0, 0, 1], col);
        P.anim = [4, ph, 0.07]; const m1 = P.v([p0[0], p0[1] - h * 0.5, p0[2]], [0, 0.2, 1], col), m2 = P.v([p1[0], p1[1] - h * 0.5, p1[2]], [0, 0.2, 1], col);
        P.anim = [4, ph, 0.16]; const e = P.v([p0[0] + 0.05, p0[1] - h, p0[2]], [0, 0.3, 1], col.map((v) => v * 0.8)), d = P.v([p1[0] - 0.05, p1[1] - h, p1[2]], [0, 0.3, 1], col.map((v) => v * 0.8));
        P.idx.push(a, m1, b, b, m1, m2, m1, e, m2, m2, e, d); f += w / (50 * s) + RSw.range(0.012, 0.042); } });
    info.washing = { tier, y: A[1] }; }
  R = R0m;
  await W.ctx.yield();
  // lids of the low chests: a meadow inside the rim, trees and the herd along the canyon edge, grass trailing over
  for (const info of [st.longChest, ...st.lows]) {
    const c = info.c, hw = c.W / 2 - 2, y = info.top - 0.7; P.lod = 1;
    M.frame(c.x, c.z, c.yaw); M.slide(0, 0);
    M.quad([-hw, y, -1.6], [hw, y, -1.6], [hw, y, -c.D + 2], [-hw, y, -c.D + 2], [[-hw, 0], [hw, 0], [hw, c.D - 3.6], [-hw, c.D - 3.6]], [c.D * 0.5, hw * 0.3, 9, 0], 0);
    const at = (lx, back) => { M.frame(c.x, c.z, c.yaw); return M.toWorld([lx, y, -1.6 - back]); };
    const nT = Math.round(c.W * 1.2 * dq), nt = Math.round(c.W / 24), na = Math.round(c.W / 40) + 1;
    for (let k = 0; k < nT; k++) tuft(at(R.range(-hw, hw), 0.5 + 12 * R() ** 1.5), R.range(1.8, 3.2), R.range(0.8, 1.6), [0, 0, 0], 0);
    for (let k = 0; k < c.W * 0.45 * Math.max(0.6, W.detail); k++) { M.frame(c.x, c.z, c.yaw); tuft(M.toWorld([R.range(-hw, hw), info.top - 0.1, 0.2 + 5 / 12 * 5.8]), R.range(2.5, 5), -R.range(1.5, 3.6), [Math.sin(c.yaw) * 1e-3, 0, Math.cos(c.yaw) * 1e-3], 0); }
    await W.ctx.yield();
    for (let k = 0; k < nt; k++) { const w3 = at(lerp(-hw + 6, hw - 6, (k + R.range(0.2, 0.8)) / nt), R.range(4, 16)); prop([0, 0, 0], 0, (ch) => addTree(P, R, w3, ch, 1.5)); }
    for (let k = 0; k < na; k++) { const cx = R.range(-hw + 8, hw - 8); for (let j = 0; j < 2; j++) { const w3 = at(cx + R.range(-5, 5), R.range(1.2, 5)); prop([0, 0, 0], 0, (ch) => addAnimal(P, R, w3, R.range(0, 6.28), ch, herd(hold.herd))); } }
    await W.ctx.yield();
  }
  const mm = new THREE.Mesh(M.build(), W.mat(SLIDE_VS, MEADOW_FS, own, { side: THREE.DoubleSide })); mm.frustumCulled = false; W.scene.add(mm);
  await W.ctx.yield();
  const pg = P.build(); pg.setAttribute('aSl', new THREE.Float32BufferAttribute(psl, 3));
  await W.ctx.yield();
  const pm = new THREE.Mesh(pg, W.mat(PROP2_VS, PROP2_FS, {}, { side: THREE.DoubleSide })); pm.frustumCulled = false; W.scene.add(pm);
  await W.ctx.yield();
  const tg = new THREE.InstancedBufferGeometry(), tp = [], tuv = [], tidx = []; let tc = 0;
  for (let qd = 0; qd < 2; qd++) { for (let r = 0; r <= 2; r++) { tp.push(-0.5, 0, qd, 0.5, 0, qd); tuv.push(0, r / 2, 1, r / 2); } for (let r = 0; r < 2; r++) { const a = tc + r * 2; tidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } tc += 6; }
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('uv2', new THREE.Float32BufferAttribute(tuv, 2)); tg.setIndex(tidx);
  tg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3)); tg.setAttribute('iDat', new THREE.InstancedBufferAttribute(new Float32Array(iDat), 4));
  tg.setAttribute('iSl', new THREE.InstancedBufferAttribute(new Float32Array(iSl), 3)); tg.setAttribute('iCh', new THREE.InstancedBufferAttribute(new Float32Array(iCh), 1)); tg.instanceCount = iCh.length;
  const tm = new THREE.Mesh(tg, W.mat(TUFT2_VS, TUFT2_FS, own, { side: THREE.DoubleSide })); tm.frustumCulled = false; W.scene.add(tm);
});

// ---- the banks: sawdust drifted against the plinths, plane shavings curled on it and afloat on the current ----
const BANK_FS = FS_HEAD + /* glsl */`
uniform vec3 uSaw; varying vec2 vUv;
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), L = normalize(uSun);
  vec2 b = vW.xz; float fw = fwidth(b.x) + fwidth(b.y);
  float rip = sin(vUv.y * 5. + 3. * fbm(b * 0.12)) * 0.5 + 0.5, fine = vnoise(b * 9.) * (1. - smoothstep(0.05, 0.4, fw));
  vec3 alb = uSaw * 0.74 * (0.8 + 0.12 * rip + 0.18 * fine + 0.14 * fbm(b * 0.6));
  alb = mix(alb, uSaw * vec3(0.5, 0.42, 0.34), (1. - smoothstep(0.1, 0.7, vW.y)) * 0.75);            // damp at the waterline
  alb *= 1. - 0.35 * smoothstep(0.75, 0.95, vnoise(b * 0.9 + 9.));                              // chips and curls of darker wood
  float sh = canyonShade(vW + N * 0.4);
  vec3 col = alb * (uSunCol * max(dot(N, L), 0.) * sh + ambientAt(N) * 1.05);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const BANK_VS = /* glsl */`
attribute vec2 aUv; varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vUv;
#include <fog_pars_vertex>
void main() { vP = position; vW = position; vN = normal; vUv = aUv; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAVE_VS = /* glsl */`
attribute vec3 iPos; attribute vec4 iDat; attribute vec3 iFlow;       // iDat = scale, yaw, seed, afloat; iFlow = flow dir xz, range
uniform float uTime;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
  float sc = iDat.x, afl = iDat.w, seed = iDat.z, yaw = iDat.y + afl * uTime * (0.08 + 0.12 * seed);
  float c = cos(yaw), s = sin(yaw);
  vec3 p = position * sc, n = normal; p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z); n.xz = vec2(c * n.x + s * n.z, -s * n.x + c * n.z);
  float trav = mod(uTime * (1.4 + seed) + seed * iFlow.z, iFlow.z) - 0.5 * iFlow.z, fade = afl * (1. - smoothstep(0.38, 0.5, abs(trav) / max(iFlow.z, 1.)));
  vec3 o = iPos + afl * vec3(iFlow.x, 0., iFlow.y) * trav;
  o.y += afl * (0.12 * sin(uTime * 1.1 + seed * 40.) - 0.5 * sc * 0.45 - (1. - fade) * 3.);
  p += o; vP = position; vUv = uv; vW = p; vN = normalize(n + vec3(0., 1e-5, 0.));
  vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAVE_FS = FS_HEAD + /* glsl */`
uniform vec3 uSaw; varying vec2 vUv;
void main() {
  if (vW.y < 0.02) discard;
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), L = normalize(uSun);
  if (dot(N, V) < 0.) N = -N;
  float grain = 0.5 + 0.5 * sin(vUv.x * 60. + 6. * vnoise(vUv * vec2(3., 40.)));
  vec3 alb = mix(uSaw * 0.9, uSaw * vec3(0.8, 0.62, 0.42), 0.35 * grain + 0.3 * smoothstep(0.6, 1., vUv.y));
  float sh = canyonShade(vW + vec3(0., 0.6, 0.)), nl = dot(N, L);
  vec3 col = alb * (uSunCol * sh * (max(nl, 0.) * 0.9 + 0.3 * max(-nl, 0.)) + ambientAt(N));                 // thin wood glows when backlit
  col += uSunCol * sh * 0.25 * pow(clamp(dot(N, normalize(L + V + vec3(0., 1e-4, 0.))), 1e-4, 1.), 30.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
STEPS.push(async (W) => {
  const R = W.rng.fork ? W.rng.fork('banks') : W.rng, RSs = W.own('sea-shavings'), nz = W.ctx.noise, saw = { uSaw: { value: new THREE.Color(W.timber.saw) } };
  const lines = [   // start, end (world xz), inward normal, wall setback
    [leg1(-74, 65), leg1(291, 65), [-R0[0], -R0[1]]], [leg1(-48, -65), leg1(262, -65), [R0[0], R0[1]]],
    [[55, 0, 749], [55, 0, 236], [-1, 0]], [[-55, 0, 681], [-55, 0, 237], [1, 0]],
  ];
  const pos = [], nrm = [], uv = [], idx = []; let c = 0; const rest = [];
  const hAt = (x, z, t) => Math.pow(1 - t, 1.5) * (2.3 + 2.4 * nz.fbm2(x * 0.03, z * 0.03, 3)) - 0.25 * t;
  for (const [a, b, n] of lines) {
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]), ns = Math.ceil(len / 3.5), na = 5, base = c;
    for (let i = 0; i <= ns; i++) {
      const f = i / ns, x0 = lerp(a[0], b[0], f), z0 = lerp(a[2], b[2], f), w = 9 + 7 * nz.fbm2(x0 * 0.02 + 5, z0 * 0.02, 3) + 3 * Math.sin(f * len * 0.07);
      for (let k = 0; k <= na; k++) {
        const t = k / na, d = -3.5 + (w + 3.5) * t, x = x0 + n[0] * d, z = z0 + n[1] * d, y = hAt(x, z, t), e = 0.6;
        const dx = hAt(x + e, z, t) - hAt(x - e, z, t), slope = -1.5 * Math.pow(1 - t, 0.5) * 3 / (w + 3.5);
        const nn = new THREE.Vector3(-n[0] * slope - dx * 0.4, 1, -n[1] * slope).normalize();
        pos.push(x, y, z); nrm.push(nn.x, nn.y, nn.z); uv.push(f * len, d); c++;
        if (k > 0 && k < na - 1 && R() < 0.05 * W.detail) rest.push([x, y, z]);
      }
    }
    for (let i = 0; i < ns; i++) for (let k = 0; k < na; k++) { const p0 = base + i * (na + 1) + k, p1 = p0 + na + 1; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
    await W.ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const bank = new THREE.Mesh(g, W.mat(BANK_VS, BANK_FS, saw, { side: THREE.DoubleSide })); bank.frustumCulled = false; W.scene.add(bank);
  // one curled shaving: a strip wound into a loose spiral
  const sp = [], sn = [], su = [], si = [], NS = 22;
  for (let i = 0; i <= NS; i++) { const f = i / NS, a = f * 7.6, r = 0.2 + 0.32 * f, x0 = f * 0.5;
    for (const e of [0, 1]) { sp.push(x0 + (e ? 0.3 : -0.3), r * Math.sin(a) + 0.5, r * Math.cos(a)); sn.push(0, Math.sin(a), Math.cos(a)); su.push(f, e); } }
  for (let i = 0; i < NS; i++) { const a = i * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(sn, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(si);
  const iPos = [], iDat = [], iFlow = [];
  for (const q of rest) { iPos.push(q[0], q[1] - 0.25, q[2]); iDat.push(R.range(2.2, 5), R.range(0, 6.28), R(), 0); iFlow.push(0, 1, 1); }
  const nFloat = Math.round(110 * W.detail * W.density);
  for (let k = 0; k < nFloat; k++) {                       // afloat: strewn along the flight, turning like little boats
    const u = R.range(0, W.uAt(716)), q = W.path.pointAt(u), t = W.path.tangentAt(u), side = R() < 0.5 ? -1 : 1, off = side * R.range(7, 38);
    const fl = u < W.uAt(288) ? [-H0[0], -H0[1]] : [0, 1];
    iPos.push(q.x - t.z * off, 0, q.z + t.x * off); iDat.push(R.range(1.8, 4), R.range(0, 6.28), R(), 1); iFlow.push(fl[0], fl[1], R.range(50, 90));
  }
  // the sea is the river widened: big shavings adrift on the open water all round the harbour (they come down the river and out of its mouth), thickest near it
  // and thinning outward to 400 m (a density
  // on the water: bearing and distance dealt from the sea shavings' own generator), none within 45 m of a chest's plinth, none on the river
  // between the walls (it has its own) nor against the Tallboy; each drifts to and fro down the wind
  { const ax = HARBOUR[0], az = HARBOUR[1], want = Math.round(48 * W.detail); let n = 0;
    for (let k = 0; k < 600 && n < want; k++) {
      const b = RSs.range(0, 6.2832), r = 60 + 340 * Math.pow(RSs(), 0.8), x = ax - r * Math.sin(b), z = az - r * Math.cos(b);
      if ((Math.abs(x) < 62 && z > 225) || (Math.abs(x) < 110 && z < 245 && z > -110)) continue;
      if (W.state.cabs.some((i) => Math.hypot(i.c.x - Math.sin(i.c.yaw) * i.c.D / 2 - x, i.c.z - Math.cos(i.c.yaw) * i.c.D / 2 - z) < i.c.W * 0.5 + 45)) continue;
      iPos.push(x, 0, z); iDat.push(RSs.range(4.5, 7.5), RSs.range(0, 6.28), RSs(), 1); iFlow.push(0.5, 0.866, RSs.range(60, 90)); n++;
    } }
  sg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3)); sg.setAttribute('iDat', new THREE.InstancedBufferAttribute(new Float32Array(iDat), 4));
  sg.setAttribute('iFlow', new THREE.InstancedBufferAttribute(new Float32Array(iFlow), 3)); sg.instanceCount = iDat.length / 4;
  const sm = new THREE.Mesh(sg, W.mat(SHAVE_VS, SHAVE_FS, saw, { side: THREE.DoubleSide })); sm.frustumCulled = false; W.scene.add(sm);
});

// ---- life on and over the water: wood ducks, the red rowing boat, dragonflies, a ribbon of key-swifts,
// geese over the heather drawers, sunlit dust, petals, shafts of light through the gaps in the left wall ----
STEPS.push(async (W) => {
  const { rng, path, hour, hold, timber, time, scene } = W, R = rng.fork ? rng.fork('life') : rng, RSb = W.own('sea-boats'), dq = W.detail;
  // ducks: little rafts beside the flight; each paddles on its own channel and the raft under drawer B scatters
  const P = new PGeo(), psl = [], duckSlide = { value: new Array(NCH).fill(0) }, ducks = [];
  const duck = (o, heading, ch) => {
    const k0 = P.k, drake = R() < 0.6, body = drake ? [0.3, 0.16, 0.08] : [0.3, 0.24, 0.17], flank = drake ? [0.62, 0.5, 0.3] : [0.36, 0.3, 0.22], headC = drake ? [0.03, 0.16, 0.1] : [0.26, 0.22, 0.18];
    P.at(o, heading, 4.2, ch); P.piv = [0, 0.2, 0.2]; P.anim = [0, 0, 0];
    P.ball([0, 0.1, 0], [0.13, 0.11, 0.26], body, flank, 6, 4); P.ball([0, 0.16, -0.24], [0.06, 0.05, 0.1], [0.08, 0.07, 0.06], null, 5, 3);
    P.anim = [1, R(), 0.35]; P.tube([0, 0.16, 0.16], [0, 0.3, 0.22], 0.05, 0.04, body, headC, 5); P.ball([0, 0.34, 0.24], [0.055, 0.055, 0.075], headC, drake ? [0.6, 0.58, 0.5] : null, 6, 4);
    P.tube([0, 0.33, 0.3], [0, 0.32, 0.37], 0.022, 0.012, [0.7, 0.2, 0.08], null, 4);
    const dir = [Math.sin(heading), 0, Math.cos(heading)]; for (let k = k0; k < P.k; k++) psl.push(dir[0], 0, dir[2]);
  };
  let ch = 0;
  for (const [m0, n, scatter] of [[40, 4, 0], [87, 3, 0], [152, 5, 1], [196, 5, 0], [262, 3, 0], [312, 3, 0], [381, 3, 0], [462, 3, 0], [542, 3, 0], [612, 3, 0], [668, 3, 0]]) {
    const u0 = W.uAt(m0), q = path.pointAt(u0), t = path.tangentAt(u0), side = R() < 0.5 ? -1 : 1, base = R.range(0, 6.28);
    for (let k = 0; k < n && ch < NCYC; k++) {
      const off = side * R.range(6, 11.5), al = R.range(-7, 7), h = scatter ? Math.atan2(-t.z * side, t.x * side) + R.range(-0.7, 0.7) : base + R.range(-0.5, 0.5);
      duck([q.x - t.z * off + t.x * al, 0.02, q.z + t.x * off + t.z * al], h, ch); ducks.push({ ch, scatter, u0, ph: R(), sp: R.range(0.25, 0.5) }); ch++;
    }
  }
  await W.ctx.yield();
  const dg = P.build(); dg.setAttribute('aSl', new THREE.Float32BufferAttribute(psl, 3));
  await W.ctx.yield();
  const dm = new THREE.Mesh(dg, W.mat(PROP2_VS, PROP2_FS, { uSlide: duckSlide }, { side: THREE.DoubleSide })); dm.frustumCulled = false; scene.add(dm);
  // the red rowing boat, moored where the cascade's ripples reach it
  const Bt = new PGeo(), red = [0.5, 0.05, 0.03], redD = [0.22, 0.03, 0.02], wood = [0.5, 0.36, 0.2];
  Bt.at([0, 0, 0], 0, 1, 0); Bt.piv = [0, 0, 0]; Bt.anim = [0, 0, 0];
  { const NSt = 9, prof = [[1, 0.62], [0.92, 0.3], [0.62, 0.04], [0, -0.06]], rows = [];
    for (let i = 0; i <= NSt; i++) { const f = i / NSt, z = (f - 0.5) * 4.6, w = 0.86 * Math.pow(Math.sin(Math.PI * clamp(f * 0.86 + 0.07, 0, 1)), 0.55), sheer = 0.22 * (2 * f - 1) ** 2, row = [];
      for (let sgn = -1; sgn <= 1; sgn += 2) for (let k = 0; k < prof.length; k++) { const kk = sgn < 0 ? k : prof.length - 1 - k; if (sgn > 0 && kk === prof.length - 1) continue;
        const x = sgn * prof[kk][0] * w, y = prof[kk][1] + sheer * (prof[kk][1] > 0.2 ? 1 : 0.3); row.push(Bt.v([x, y, z], [sgn * 0.8, -0.4 + prof[kk][1], 0], prof[kk][1] > 0.5 ? [0.75, 0.7, 0.6] : (k % 2 ? red : redD))); }
      rows.push(row); }
    for (let i = 0; i < NSt; i++) for (let k = 0; k < rows[i].length - 1; k++) Bt.idx.push(rows[i][k], rows[i + 1][k], rows[i][k + 1], rows[i][k + 1], rows[i + 1][k], rows[i + 1][k + 1]);
    for (const z of [-1.1, 0.2, 1.3]) Bt.tube([-0.72, 0.42, z], [0.72, 0.42, z], 0.11, 0.11, wood, wood, 4);
    for (const sx of [-1, 1]) { Bt.tube([sx * 0.3, 0.5, 0.3], [sx * 1.9, 0.62, -0.9], 0.035, 0.03, wood, wood, 4); Bt.ball([sx * 2.05, 0.63, -1.02], [0.09, 0.02, 0.3], wood, null, 5, 3); } }
  const boat = new THREE.Mesh(Bt.build(), W.mat(PROP_VS, PROP2_FS, {}, { side: THREE.DoubleSide })); boat.frustumCulled = false; boat.scale.setScalar(2.3);
  boat.position.set(-7, 0.12, 262); boat.rotation.y = 1.0; scene.add(boat);
  // every sea chest within 400 m of the harbour has a red boat moored at a front foot and a ladder up from it to the plinth's
  // top (the brief's traces of people, for scale)
  const boats = [boat], Ld = new PGeo(), lwood = [0.5, 0.36, 0.2];
  for (const info of W.state.sea.filter((i) => i.sea.r < 400).sort((a, b) => a.sea.r - b.sea.r)) {
    const c = info.c, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), sd = RSb() < 0.5 ? -1 : 1, lx = sd * (c.W / 2 - 26), wl = (x, y, z) => [c.x + x * cy + z * sy, y, c.z - x * sy + z * cy];
    const b2 = new THREE.Mesh(boat.geometry, boat.material); b2.frustumCulled = false; b2.scale.setScalar(2.3); const bp = wl(lx + sd * 5, 0.12, 9.5); b2.position.set(bp[0], bp[1], bp[2]); b2.rotation.y = c.yaw + 1.3 + RSb(); b2.userData.ph = RSb() * 6.2832; scene.add(b2); boats.push(b2);
    Ld.at(wl(lx, 0, 0), c.yaw, 1, 0); Ld.piv = [0, 0, 0]; Ld.anim = [0, 0, 0];
    const foot = [0, 0.5, 8], top = [0, 16.6, 4.2];      // 16.5 m of ladder, water to plinth top
    for (const e of [-0.45, 0.45]) Ld.tube([e, foot[1], foot[2]], [e, top[1], top[2]], 0.1, 0.09, lwood, lwood, 4);
    for (let k = 1; k < 27; k++) { const f = k / 27.5; Ld.tube([-0.45, lerp(foot[1], top[1], f), lerp(foot[2], top[2], f)], [0.45, lerp(foot[1], top[1], f), lerp(foot[2], top[2], f)], 0.05, 0.05, lwood, lwood, 3); }
    info.boat = bp; info.ladder = wl(lx, 8.5, 6);
  }
  { const lm = new THREE.Mesh(Ld.build(), boat.material); lm.frustumCulled = false; scene.add(lm); }
  await W.ctx.yield();
  // the candle in the chamber-stick, which stands on the dresser's bare veneered top: beeswax, runs of wax, a wick and its flame
  const Cn = new PGeo(), cd = W.state.candle, wax = [0.8, 0.7, 0.5], wax2 = [0.62, 0.5, 0.32], blk = [0.05, 0.04, 0.03];
  Cn.at(cd, 0, 1, 0); Cn.piv = [0, 0, 0]; Cn.anim = [0, 0, 0];
  Cn.tube([0, -1.4, 0], [0, 21, 0], 2.45, 2.3, wax2, wax, 14); Cn.ball([0, 21, 0], [2.3, 0.5, 2.3], wax, null, 12, 3);
  for (let k = 0; k < 6; k++) { const a = R.range(0, 6.28), len = R.range(2.5, 9), ca = Math.cos(a), sa = Math.sin(a);
    Cn.tube([ca * 2.2, 21.1, sa * 2.2], [ca * 2.5, 21 - len, sa * 2.5], 0.4, 0.26, wax, wax, 5); Cn.ball([ca * 2.52, 21 - len, sa * 2.52], [0.36, 0.5, 0.36], wax, null, 5, 3); }
  Cn.tube([0, 21, 0], [0.15, 22.7, 0], 0.16, 0.1, blk, blk, 4);
  Cn.ball([0.1, 24.3, 0], [0.7, 1.9, 0.7], [0.89, 0.77, 0.55], [0.89, 0.77, 0.55], 8, 5);
  const cg = Cn.build(); cg.setAttribute('aSl', new THREE.Float32BufferAttribute(new Float32Array(Cn.k * 3), 3));
  const cm = new THREE.Mesh(cg, W.mat(PROP2_VS, PROP2_FS, {}, { side: THREE.DoubleSide })); cm.frustumCulled = false; scene.add(cm);
  await W.ctx.yield();
  // kit creatures and air
  const light = { sunDir: W.SUN, sunColor: hour.sun, sunIntensity: 2.4, sky: hour.sky, skyIntensity: 0.9, ground: timber.pal[2], groundIntensity: 0.45 };
  const fauna = F.makeFauna(scene, { light });
  fauna.add(F.makeDragonflies({ rng: R, count: Math.round(26 * dq), size: 2.6, path, uFrom: 0.0, uTo: 0.6, clear: 3, spread: 8, lift: [-9, -2.5] }));
  await W.ctx.yield();
  if (hold.geese) fauna.add(F.makeFlock({ rng: R, species: 'geese', count: 15, size: 1.6, cross: { path, u: 0.36, lead: 70, angle: 35, side: 1, height: 26, span: 520, rise: 40, duration: 44 } }));
  await W.ctx.yield();
  const set = fx.fxGroup(); scene.add(set.object);
  const dust = fx.makeParticles({ rng: R, preset: 'dust', time, count: Math.round(1500 * dq), box: [70, 44, 70], size: [0.05, 0.14], colors: ['#ffe9b8', '#ffd28a', '#fff6dc'], intensity: 1.5 }); set.add(dust);
  // in the hall the dust hangs only where the slab of sun comes in at the mouth
  set.add(fx.makeParticles({ rng: R, preset: 'dust', time, follow: false, center: [29, 297, -9.5], box: [44, 17, 15], count: Math.round(150 * dq), size: [0.16, 0.36], colors: ['#E2B84C', '#D9A662'], intensity: 1.3 }));
  // the candle flame, and the brass above the keyhole plate catching the sun from the far end of the canyon
  const hxz = Math.hypot(W.SUN.x, W.SUN.z) || 1;
  const flame = fx.makeGlow({ time, position: [cd[0] + 0.1, cd[1] + 24.4, cd[2]], size: 6, color: '#F2E3C4', intensity: 0.34, halo: 0, core: 0.7, flicker: 0 }); set.add(flame);      // a small steady flame, plain cream: no halo, no flicker, under the bloom
  { const sx = W.SUN.x / hxz, sz = W.SUN.z / hxz, ky = W.state.dresser.top + 2.7;      // the brass carries the light: three small steady glints, on the pan's rim, the socket's rim and the great key's bow, on their sunward sides
    set.add(fx.makeGlows({ time, positions: [[cd[0] + sx * 13.9, cd[1] - 21.3, cd[2] + sz * 13.9], [cd[0] + sx * 4.6, cd[1] + 0.15, cd[2] + sz * 4.6], [KEY[0] + sx * 5.8, ky, KEY[1] + sz * 5.8]], sizes: [1, 0.7, 1], size: 8, color: '#E2B84C', intensity: 1.5, spikes: 0.5, halo: 0.2, core: 0.6, flicker: 0, minAngle: 0.006 })); }
  const GL = new THREE.Vector3(-9.7, 314, 4.0), glint = fx.makeGlow({ time, position: GL, size: 8, color: '#E2B84C', intensity: 0, spikes: 0.5, halo: 0.2, core: 0.6, flicker: 0, minAngle: 0.008, fogAmount: 0.3 }); set.add(glint);      // the plate's left bevel bright with sun: a small steady brass glint
  await W.ctx.yield();
  if (hold.petals) set.add(fx.makeParticles({ rng: R, preset: 'petals', time, count: Math.round(800 * dq), box: [70, 40, 70], colors: ['#fff1ee', '#ffd9e0', '#fff8f2'], lightDir: W.SUN }));
  await W.ctx.yield();
  // light through the gaps between the low chests: shafts leaning down-sun inside each sheet of sun (W.shade.uGap)
  // A bundle stands at a quarter and at three quarters of the river's width along its sheet; one whose foot would be within 30 m (in plan) of where a drawer's fall
  // comes down, or whose axis would pass within 30 m of the route, is moved along its sheet toward the gap until it is clear (a rule of the place, the same for
  // every sheet, every fall and every metre of the route: a shaft is a thing seen across the canyon, never one the flight goes through).
  const down = [-W.SUN.x, -W.SUN.y, -W.SUN.z], hx = Math.hypot(W.SUN.x, W.SUN.z) || 1, shafts = [];
  const axisDist = (q, ox, oy, oz) => { const vx = q[0] - ox, vy = q[1] - oy, vz = q[2] - oz, tp = clamp(vx * down[0] + vy * down[1] + vz * down[2], 0, 170); return Math.hypot(vx - down[0] * tp, vy - down[1] * tp, vz - down[2] * tp); };
  const feet = W.state.pours.map((p) => [p.foot[0] + Math.sin(p.c.yaw) * p.amp, p.foot[2] + Math.cos(p.c.yaw) * p.amp]);
  for (const g of W.shade.uGap.value) for (const k0 of [0.25, 0.75]) {            // two bundles a sheet: over the near bank and over mid-river
    let px = 0, pz = 0, ok = false, kk = k0;      // (a bundle that ends where its sheet's other bundle stands is not made twice; one on the shaded wall's side of mid-river is the fainter)
    for (let k = k0; k > 0.05 && !ok; k -= 0.05) { kk = k; const run = k * 110 / Math.max(-W.SUN.x / hx, 0.3); px = g.x - (W.SUN.x / hx) * run; pz = g.y - (W.SUN.z / hx) * run; ok = !feet.some((f) => Math.hypot(f[0] - px, f[1] - pz) < 30) && !W.route.some((q) => axisDist(q, px + W.SUN.x * 150, 2 + W.SUN.y * 150, pz + W.SUN.z * 150) < 30); }
    if (ok && !shafts.some((q) => Math.hypot(q[0] - px - W.SUN.x * 150, q[2] - pz - W.SUN.z * 150) < 2 * g.z)) shafts.push([px + W.SUN.x * 150, 2 + W.SUN.y * 150, pz + W.SUN.z * 150, g.z, kk < 0.5 ? 0.6 : 1]);
  }
  const rays = [], RAYS = 0.5;      // the shafts' strength, the same at every hour
  for (const pos of shafts) { await W.ctx.yield(); rays.push(fx.makeGodRays({ rng: R, time, position: [pos[0], pos[1], pos[2]], direction: down, radius: pos[3] * 0.95, count: Math.round(5 * Math.max(0.7, dq)), length: 170, width: [3, 6.5], color: hour.sun, intensity: RAYS, falloff: 1.1 })); set.add(rays[rays.length - 1]); }
  W.updaters.push((dt, t, cam, u) => {
    for (const d of ducks) { const sc = d.scatter ? 16 * ease((u - d.u0 + 0.012) / 0.02) : 0; duckSlide.value[d.ch] = ((t * d.sp + d.ph * 30) % 30) - 15 + sc; }
    boat.position.y = 0.12 + 0.06 * Math.sin(t * 1.3); boat.rotation.z = 0.05 * Math.sin(t * 0.9); boat.rotation.x = 0.03 * Math.sin(t * 1.4 + 1);
    for (let i = 1; i < boats.length; i++) { const b = boats[i], ph = b.userData.ph; b.position.y = 0.12 + 0.06 * Math.sin(t * 1.3 + ph); b.rotation.z = 0.05 * Math.sin(t * 0.9 + ph); b.rotation.x = 0.03 * Math.sin(t * 1.4 + 1 + ph); }
    const m = u * path.length;
    dust.setOpacity(1 - smoothstep(1330, 1420, m));
    // the plate's glint is steady in time; it eases as the flight comes down the top meadow from the helix's end to the plate (metres flown)
    glint.uniforms.uIntensity.value = 1.6 * (1 - 0.55 * ramp(m, W.PL.top, W.PL.end));
    // the shafts belong to the river: they thin out as the flight leaves it, from the stair's foot to the handle (metres flown); the bundle against the shaded
    // wall is the fainter, so the wall stays dark between the slabs
    const rk = RAYS * (1 - ramp(m, W.PL.foot, W.PL.pass));
    for (let i = 0; i < rays.length; i++) rays[i].uniforms.uIntensity.value = rk * shafts[i][4];
    fauna.update(dt, t, cam, u); set.update(dt, t, cam);
  });
});

// for the route probes under shots/drawer-cliffs: the route and its gaze as the world flies them
export const _route = { routePoints, placesOf, gazeKeys, makeDirector };
