// THE HARBOUR OF ONE LAMP: a small stone harbour town in the afterglow, built at three times life. Every shutter is closed
// and one window high under the hill's crown is lit; its gold lies in one long reflection on the bay. We come in high over
// the water on the window's own axis, dive down the gold road to the swell, turn west along the quay's water, fly a loop
// round the moored fleet (the lugger beating near, the skerry's rock before the band), come back past the unlit beacon and
// from its bend RISE: west across the basin, round over the west shore, over the roofs of the west rows and the square's
// air where a fan of gold lies on the flags, and onto the axis to fly level at the open casements.
// THE WINDOW IS THE OPENING: nothing is built in it or before it (src/parts/harbour-of-one-lamp.js, its head).
// Compass: -Z north, +X east, +Y up, still water at y 0. The window's centre W is (0, 70, 0); the entry (0, 70, 450).
// THE SAME ON EVERY SEED (the join): the window, its house and surround, the lamp's light, the town (TWO FIXED STREAMS,
// never the seed: one number deals its layout, a stream of its own to each house its dress), the tower, the skerry, the
// open lane of water 14 m either side of x 0, the moon, the band's bearing, the route.
// THE SEED DEALS: the weather of the dusk (clear: high streaks of cloud; cloud: broken bars under them too; mist: sea mist
// in banks off the lane), a shade of the hour, the wind's side, the band's rose, the boats (how many, which kinds, where in
// their groups, hull colours), the lugger's sail and where she is on her oval, how many birds, which hearths smoke,
// shutter colours, what stands on the quay and hangs on the line; and (r5, order E, each by a named stream of its own, taken
// once) WASHING DAY: which ways between facing walls, which yards and which free walls carry a line and what hangs on it
// ('washing day:' + seed, buildWashing), and THE BIRDS NEAR OVER THE ROOFS: over which houses a pair or a trio wheels
// ('birds over the roofs:' + seed, buildLife: by the stream's one draw in four and nothing else). The hill's trees and
// hedges lean with the gust that passes them (no draw of theirs moved). AND (r5m1, each again by a named stream of its
// own, forked by name after every other and taken once) THE DRYING ROOFS: which wall of the upper street begins with a
// net, what hangs on each flank house's ridge line, and which roofs of the rows carry a line and what is on it ('drying
// roofs:' + seed, buildDrying); THE STREET HEARTHS: the plume of every stack of the upper street's flank houses ('street
// hearths:' + seed, buildLife). THE ONE WIND (r5m1): a gust travels down the wind (the part's gustAt: fronts 56 m long at
// 7 m a second, a flaw of 13 m at 5.5 on them); the turf and heath run paler under it (the ground's shader), trees,
// hedges, nets and cloths lean with it and recover, each by its own place. THE LAMP ON THE FLAGS (r5m1) is found in the
// stone's own shader at every point of the square, the landing and the treads, by the rays from the window and by place
// alone (its fall with distance and slope, the soft edge of the fan past the street's mouth, the well's shadow).
// THE LAMP'S PAINT is a law of place: paint on faces, baked once by rays from the window against the houses (never from
// the eye, never by metres flown).
// THE WORLD'S ONE LAW OF THE EYE, DECLARED: THE LAMP'S IMAGE ON THE BAY. The gold road on the water is the window's own
// image in the bay, as an image in water is by its nature: it lies where the water's mirror law puts it for the eye that
// draws (from under that eye toward the window, about its mirror point), AND IT IS SHOWN BY HOW MUCH OF THE WINDOW THAT
// SAME EYE SEES at that moment: straight lines from the eye to two dozen points spread over the window's opening, stopped
// by houses, parapet, tower and hill; the share of them that is clear is the road's strength. Wholly seen, the road is
// whole; hidden, no streak lies on the water. The eye is the camera that draws the sheet (asked where the sheet is drawn,
// so a view through an opening is right too). Nothing is eased, kept or remembered from one drawing to the next; no
// clock, no time step and no way flown is read; at one place every drawing is the same.
// THE PANES OF THE TOWN ARE MIRRORS OF THE SKY, by the true mirror law, a law of physics as the water's reflection is: the
// eye's ray is turned about the pane's own normal and the pane shows the sky's own colour in that direction (the dome's
// gradient, wash, halo, streaks and ember band), dimmed by the glass. No pane is lit from within.
// THE BAY MIRRORS THE TOWN (r5), by the same mirror law and no other: the eye's ray is turned about the water's own normal at
// the place (its ripple's slope, by place and the world clock) and the water shows what the turned ray meets of the town as
// it stands (the rows' washes and roofs, quay, mole, beacon, skerry, hulls, masts and the lugger's sails), under the dusk's
// own light, with no lamp in it. It asks nothing of the eye but where it is, as any mirror does; nothing is kept or eased.
// MEDIA (passed through, thinning near the lens): chimney smoke, sea mist. BODIES (kept off the line by place): everything else.
// One texture is made here (the bay's mirror keeps the rows' heights and colours by place in it; freed in dispose). No timer, no people, no letters, no numerals, no second light.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeMason, makeLight, stoneMaterial, bar, SURF, LAMP_BAKE, GOLD, HOUSE, WIN, PAL, KEY_DIR, linear, SKIN_GLSL, dryReach } from '../parts/harbour-of-one-lamp.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
// ---------------------------------------------------------------- the places (metres)
const W0 = [0, 70, 0];                      // the window's centre, in the plane of the wall's inner face
const ENTRY = [0, 70, 450];
const QUAY = { x0: -90, x1: 88, z0: 174, z1: 190, y: 4.5 };
const SQUARE = { x0: -30, x1: 16, z0: 77, z1: 112, y: 49, parapet: 52 };
const STREET = { z0: 8, z1: 77, y0: 55, y1: 49, hw: 5, eaveY: 67, eaveX: 3.5, ridgeY: 72.5, ridgeX: 12, depth: 14 };
const TOWER = { x: 52, z: 78, g: 46, half: 6, top: 82, vane: 86 };
const JETTY = { x0: -91.5, x1: -84.5, z0: 190, z1: 206, y: 4.5 };
const MOLE = { line: [[88, 190], [80, 225], [68, 262], [50, 298]], hw: 4, y: 5, parapet: 8 };
const BEACON = { x: 50, z: 298, h: 16, r: 2.5 };
const WELL = { x: 4, z: 97 };
// the lower town's middle as seen from the bay: on the axis halfway between the quay and the square, halfway up to the lamp
const TOWNMID = [0, (QUAY.y + W0[1]) / 2, (QUAY.z0 + SQUARE.z1) / 2];
const ARCH = { x: -67.9, z: 135.8, soffit: 16 };
const WASHING = { x: -56.2, z: 118.9, line: 17.5, hem: 14 };
const CROWN = { x: -30, z: -48, y: 85 };
// the sight plane: through the entry and the top of the square's south parapet; nothing on the strip |x| < 14 between the
// square and the quay's edge rises above it (it is the lowest line from the entry to anything the lamp lights)
const sightY = (z) => SQUARE.parapet + (z - SQUARE.z1) * (ENTRY[1] - SQUARE.parapet) / (ENTRY[2] - SQUARE.z1);
// ---------------------------------------------------------------- THE ROUTE (the kit's curve through these points)
// THE NET STAIR'S LINE (r1's own points, not one moved): from the quay's edge into the Net Stair, up it and over the square.
// It is no longer flown (r3): the stair and the square are built on it as they were, and the bend at the beacon is still
// laid backward from its first two points. THE LAST STRAIGHT is the brief's to the centimetre: five points on the line
// x 0, y 70; the last 60 m are on it, due north and level.
const STAIRLINE = [
  [-48.92, 11.12, 182.14], [-56.37, 12.66, 177.07], [-62.52, 15.47, 170.53], [-67, 19.72, 162.76], [-69.48, 24.06, 154.24], [-69.88, 28.33, 145.52],
  [-68.31, 32.51, 137.12], [-64.99, 36.59, 129.47], [-60.25, 40.57, 122.88], [-54.43, 44.43, 117.54], [-47.85, 48.21, 113.48],
  [-40.45, 52.13, 110.43], [-29.43, 57.79, 106.88], [-21.7, 61.53, 103.44], [-15.34, 64.31, 99.17], [-10.01, 66.48, 93.99], [-5.78, 68.08, 88.08],
  [-2.72, 69.17, 81.68], [-0.81, 69.8, 74.94], [0, 70, 68],
];
const LAST = [[0, 70, 68], [0, 70, 60], [0, 70, 40], [0, 70, 20], [0, 70, 0]];
// THE HEAD IS LAID BY RULE (r2, the lead's order C): every piece is a straight or an arc of a named radius between places of
// the world, and the points are set on those pieces (every 11 m on a bend):
//  1 THE ENTRY: (0, 70, 450) due north and level for 60 m (four points on the axis; a fifth 1.5 m on, so that the dive's
//    first bend begins after the sixtieth metre).
//  2 THE DIVE DOWN THE GOLD ROAD, in the axis's own plane: an arc of 48 m down to a pitch of 46 degrees, a straight, an arc
//    of 48 m out to level at 7 m over the water; then level, due north, to where the turn west begins.
//  3 THE TURN WEST: a quarter circle of 42 m, ending due west on THE RUN ALONG THE QUAY'S WATER at z 212 (22 m off the
//    quay's face), which goes on to x -66.
//  4 THE LOOP ROUND THE FLEET: a half circle to the left from the run's end (its radius, about 62 m, falls out of piece 5),
//    passing the jetty's tip and the west shore and coming back due east; then a slow arc of 140 m to the left.
//  5 THE TURN AT THE BEACON: a bend of 44 m to the left that the slow arc touches from inside, laid where its outer side
//    passes the beacon's skin at 13 m. Its place is still found from the straight that ran over the basin into the Net
//    Stair's first point on the stair's own heading (r2's diagonal, no longer flown): the bend stands where r2 laid it.
// 6 THE RISE OVER THE TOWN, laid by rule from the bend at the beacon to the last straight: the bend is flown on to a heading
//   a little short of west, a straight runs west over the basin, an arc of RISE.Rr to the right goes round over the west
//   shore and the west rows to due east (over the roofs of the row behind the quay's), a straight of RISE.lane, and an arc
//   of RISE.Rl to the left over the rows above and the square's air ends due north on the axis at
//   z RISE.join. Arc and straight are joined by ramps of curvature (RISE.ramp long). The bend's leaving heading and the
//   west straight's length fall out of where the last arc must end. THE HEIGHT: as r2 laid it to the beacon abeam, then one
//   slope (eased in over RISE.ease, falling out of the lengths) to the end of the right-hand arc, easing to level at 70 m
//   where the last straight begins.
// a house is crossed where the line's plan lies over its plan or within its eaves' reach of it
const REACH = 1.5;
const RISE = { Rr: 42, Rl: 50, ramp: 14, lane: 0, join: 94, ease: 30, step: 9, top: 68 };
function layRise(C2, Rm, a0, sweep0, nm, low, BE) {
  const R = RISE, hOf = (a) => -a, ds = 0.05;
  const walk = (hL, S1, each, mark0 = R.step) => {
    const hA = hL - R.ramp / (2 * Rm) + R.ramp / (2 * R.Rr), arc1 = (Math.PI / 2 - R.ramp / (2 * R.Rr) - hA) * R.Rr;
    const pieces = [[R.ramp, 1 / Rm, 0], [S1, 0, 0], [R.ramp, 0, -1 / R.Rr], [arc1, -1 / R.Rr, -1 / R.Rr], [R.ramp, -1 / R.Rr, 0], [R.lane, 0, 0],
      [R.ramp, 0, 1 / R.Rl], [(Math.PI / 2 - R.ramp / R.Rl) * R.Rl, 1 / R.Rl, 1 / R.Rl], [R.ramp, 1 / R.Rl, 0]];
    let x = C2[0] + Rm * Math.cos(hL), z = C2[1] + Rm * Math.sin(hL), h = hL, s = 0, mark = mark0, sLane = 0;
    pieces.forEach(([len, k0, k1], pi) => { const n = Math.max(1, Math.round(len / ds)), dd = len / n;
      for (let i = 0; i < n; i++) { const k = k0 + (k1 - k0) * (i + 0.5) / n; h -= k * dd / 2; x += Math.sin(h) * dd; z -= Math.cos(h) * dd; h -= k * dd / 2; s += dd;
        if (each && s >= mark - 1e-9) { each(x, z, s); mark += R.step; } }
      if (pi === 4) sLane = s; });
    return [x, z, s, sLane];
  };
  // the leaving heading and the west straight, solved (Newton, two unknowns) so the last arc ends on the axis at the join
  let hL = -80 * DEG, S1 = 40;
  for (let it = 0; it < 40; it++) { const e = walk(hL, S1), e1 = walk(hL + 1e-4, S1), e2 = walk(hL, S1 + 1e-3);
    const a11 = (e1[0] - e[0]) / 1e-4, a21 = (e1[1] - e[1]) / 1e-4, a12 = (e2[0] - e[0]) / 1e-3, a22 = (e2[1] - e[1]) / 1e-3, r1 = -e[0], r2 = R.join - e[1], det = a11 * a22 - a12 * a21;
    hL += (r1 * a22 - a12 * r2) / det; S1 += (a11 * r2 - a21 * r1) / det; if (Math.abs(r1) + Math.abs(r2) < 1e-8) break; }
  // the lengths the height needs: from the beacon abeam along the bend to its leaving, the laid pieces, the axis to the top
  const aB = Math.atan2(-(BE[1] - C2[1]), BE[0] - C2[0]), aL = -hL, e = walk(hL, S1), sBend = Rm * (aL - aB), total = sBend + e[2] + (R.join - R.top), sLane = sBend + e[3];
  const yB = low + 0.5 * Math.sin(Math.PI * (aB - a0) / sweep0);
  const slope = (70 - yB) / (R.ease / 2 + (sLane - R.ease) + (total - sLane) / 2);
  const rise = (s) => s <= 0 ? 0 : s < R.ease ? slope * s * s / (2 * R.ease) : s < sLane ? slope * (s - R.ease / 2)
    : slope * (sLane - R.ease / 2) + slope * ((s - sLane) / 2 + (total - sLane) / (2 * Math.PI) * Math.sin(Math.PI * (s - sLane) / (total - sLane)));
  const pts = [], da = sweep0 / nm; let aLast = a0;
  // the bend's own points go on at r2's step of angle until its leaving; the laid pieces' points follow at their own step,
  // counted from the bend's last point
  for (let i = 1; a0 + da * i < aL - 0.04; i++) { const a = a0 + da * i; aLast = a; pts.push([C2[0] + Rm * Math.cos(a), a <= aB ? low + 0.5 * Math.sin(Math.PI * (a - a0) / sweep0) : yB + rise(Rm * (a - aB)), C2[1] - Rm * Math.sin(a)]); }
  const plan = [], gap = Rm * (aL - aLast); walk(hL, S1, (x, z, s) => { if (e[2] - s > R.step * 0.45) plan.push([x, yB + rise(sBend + s), z]); }, gap < R.step * 0.7 ? R.step - gap : 2 * R.step - gap);
  pts.push(...plan, [0, yB + rise(sBend + e[2]), R.join]);
  const zMid = (R.join + R.top) / 2; pts.push([0, yB + rise(total - (zMid - R.top)), zMid]);
  // the places the rule made: where the bend is left, the right-hand arc's westmost place, where it is round (the lane)
  let west = [0, 0], lane = [0, 0]; walk(hL, S1, (x, z, s) => { if (x < west[0]) west = [x, z]; if (s <= e[3]) lane = [x, z]; }, 1);
  return { pts, hL, S1, slope, total, sLane, sBend, leave: [C2[0] + Rm * Math.cos(hL), C2[1] + Rm * Math.sin(hL)], west, lane };
}
const HEAD = { dive: 46, Rv: 48, low: 7, Rw: 42, runZ: 212, xa: -66, Rb: 140, Rm: 44, skin: 13, step: 11 };
function layRoute() {
  const P = HEAD, pts = [[0, 70, 450], [0, 70, 420], [0, 70, 393], [0, 70, 390], [0, 70, 388.5]], Q = STAIRLINE[0], BE = [BEACON.x, BEACON.z, BEACON.r];
  const push = (x, y, z) => pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100, Math.round(z * 100) / 100]);
  // 2 the dive
  const Z0 = 388.5, th = P.dive * DEG, dz = P.Rv * Math.sin(th), dy = P.Rv * (1 - Math.cos(th)), sl = (70 - P.low - 2 * dy) / Math.sin(th), n1 = Math.max(2, Math.round(P.Rv * th / P.step));
  for (let i = 1; i <= n1; i++) { const a = th * i / n1; push(0, 70 - P.Rv * (1 - Math.cos(a)), Z0 - P.Rv * Math.sin(a)); }
  const zs = Z0 - dz, ys = 70 - dy, ns = Math.max(1, Math.round(sl / (P.step * 1.6)));
  for (let i = 1; i <= ns; i++) push(0, ys - sl * Math.sin(th) * i / ns, zs - sl * Math.cos(th) * i / ns);
  const ze = zs - sl * Math.cos(th);
  for (let i = 1; i <= n1; i++) { const a = th * (1 - i / n1); push(0, P.low + P.Rv * (1 - Math.cos(a)), ze - dz + P.Rv * Math.sin(a)); }
  const zl = ze - dz, zt = P.runZ + P.Rw;
  if (zl - zt > 14) push(0, P.low, (zl + zt) / 2);
  // 3 the turn west and the run
  const nw = Math.round(P.Rw * Math.PI / 2 / P.step);
  for (let i = 0; i <= nw; i++) { const a = Math.PI / 2 * i / nw; push(-P.Rw + P.Rw * Math.cos(a), P.low, zt - P.Rw * Math.sin(a)); }
  // 5 found backward from the stair's line: r2's diagonal had that line's own heading; the bend lies on its left hand
  const T1 = STAIRLINE[1], hl = Math.hypot(T1[0] - Q[0], T1[2] - Q[2]), hx = (T1[0] - Q[0]) / hl, hz = (T1[2] - Q[2]) / hl, nx = hz, nz = -hx;
  const want = P.Rm + BE[2] + P.skin; let t = 0;
  for (let k = 0; k < 6000; k++) { if (Math.hypot(Q[0] - hx * t + nx * P.Rm - BE[0], Q[2] - hz * t + nz * P.Rm - BE[1]) <= want) break; t += 0.05; }
  const C2 = [Q[0] - hx * t + nx * P.Rm, Q[2] - hz * t + nz * P.Rm], X = [Q[0] - hx * t, Q[2] - hz * t];
  // 4 the loop and the slow arc
  const dxc = C2[0] - P.xa, need = P.Rb - P.Rm, zc1 = C2[1] - Math.sqrt(need * need - dxc * dxc), Rl = (zc1 + P.Rb - P.runZ) / 2;
  push((P.xa - P.Rw) / 2, P.low, P.runZ);
  const nl = Math.round(Rl * Math.PI / P.step); for (let i = 0; i <= nl; i++) { const b = Math.PI * i / nl; push(P.xa - Rl * Math.sin(b), P.low, P.runZ + Rl - Rl * Math.cos(b)); }
  const g = Math.asin(dxc / need), nb = Math.round(P.Rb * g / (P.step * 1.5)); for (let i = 1; i <= nb; i++) { const a = g * i / nb; push(P.xa + P.Rb * Math.sin(a), P.low, zc1 + P.Rb * Math.cos(a)); }
  // 5 the bend at the beacon (it lifts half a metre in passing; X is where r2's diagonal left it) and 6 the rise
  const a0 = Math.atan2(-(zc1 + P.Rb * Math.cos(g) - C2[1]), P.xa + P.Rb * Math.sin(g) - C2[0]), a1 = Math.atan2(-(X[1] - C2[1]), X[0] - C2[0]);
  let sweep = a1 - a0; while (sweep <= 0) sweep += TAU; const nm = Math.round(P.Rm * sweep / P.step);
  const rise = layRise(C2, P.Rm, a0, sweep, nm, P.low, BE); for (const q of rise.pts) push(q[0], q[1], q[2]);
  // the places the rule made, for what is moored, flown and counted by them
  return { pts: [...pts, ...LAST], lay: { level: [0, zl], west: [-P.Rw, P.runZ], run: [P.xa, P.runZ], loop: { x: P.xa, z: P.runZ + Rl, R: Rl }, back: [P.xa, P.runZ + 2 * Rl], slow: { x: P.xa, z: zc1, R: P.Rb }, bend: { x: C2[0], z: C2[1], R: P.Rm }, diag: X, rise } };
}
const LAID = layRoute(), ROUTE = LAID.pts, LAY = LAID.lay, RISEAT = LAY.rise;
// the Net Stair's two ends on its own line (its centre line is the curve through STAIRLINE between them) and its rise
const STAIR = { mouth: [-59.6, 174], top: [-29.9, 107.1], y0: QUAY.y, y1: SQUARE.y, hw: 5 };
// THE WASHES of the town's fronts (chalk white first, then the old washes: pale ochre, faded rose, sea green, dove grey,
// pale blue; all dulled, none as warm as the lamp) and its ROOFS (slate in three greys, old red-brown tile)
const WASHES = ['#DAD7CF', '#CCBD98', '#CBAAA2', '#A6BAAD', '#B3B4B8', '#A8B9CA'];
const ROOFS = [['#666A74', 0.84], ['#666A74', 1.0], ['#737781', 1.14], ['#8A5A48', 0.92]];
const EMBER = '#D9756A';
// where sea mist may lie (a visit of mist): seaward of the loop's far side to a bay's length past the entry, from the
// quay's breadth out to the bay's own on either hand
const MIST = { x0: QUAY.x1 - 18, x1: 520, z0: LAY.back[1] + LAY.loop.R, z1: ENTRY[2] + 310 };
const P = {
  ink: '#1B2A4A', slate: '#4A5E80', chalk: '#C9CED6', stone: '#8C8F8A', band: '#D9D08E', rose: '#C99A8E', tar: '#5E3F33',
  shutters: ['#6A5448', '#7C8B9A', '#939FAA', '#7E9A82', '#9A948A'], hulls: ['#3C3E46', '#48627F', '#4C6A56', '#5E4A44'], sails: ['#9A7A55', '#7E3F33', '#B9B6AA'],
};

export default {
  id: 'harbour-of-one-lamp',
  name: 'The Harbour of One Lamp',
  category: 'city',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    await ctx.yield();
    const scene = new THREE.Scene(), detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    // ---- the forks, all taken here in one fixed list before any loop draws
    const rng = ctx.rng;
    const rv = rng.fork('the dusk'), rSky = rng.fork('sky'), rSea = rng.fork('sea'), rBoats = rng.fork('boats'), rQuay = rng.fork('quay');
    const rBirds = rng.fork('birds'), rSmoke = rng.fork('smoke'), rPaint = rng.fork('shutter paint'), rWash = rng.fork('washing'), rMist = rng.fork('mist');
    // r2's new things, each on a stream of its own, forked after the ones above so that what r1 dealt is not shifted by them
    const rLugger = rng.fork('lugger'), rGulls = rng.fork('standing gulls'), rSeabirds = rng.fork('seabirds'), rLived = rng.fork('lived in'), rLeaves = rng.fork('vine leaves');
    // r3's new things, a stream of their own by name (no fork is taken for them: nothing dealt before is shifted)
    const rSkerry = ctx.core.makeRng(ctx.core.hashSeed('skerry and followers:' + ctx.seed));
    // the seabirds that STAND on the skerry's ledges: a stream of their own by name, so that how many ledges are taken on a
    // visit shifts no other thing's draws (the standing gulls' stream deals the mole, the beacon, the jetty and the ridges only)
    const rRoost = ctx.core.makeRng(ctx.core.hashSeed('skerry roost:' + ctx.seed));
    // the town's own generators, the same town on every seed. TWO FIXED STREAMS: THE LAYOUT (one fixed number, drawn only by
    // the loops that place houses: where a house stands, its width, depth, storeys, form and stacks) and THE DRESS (a stream
    // of its own to each house, named by the house's place in the order of building: its wash, roof, door, shutters), so
    // that a change to a door or a shutter never moves a wall
    const town = ctx.core.makeRng(64137), dressOf = (name) => ctx.core.makeRng(ctx.core.hashSeed('dress:' + name));
    // ---- what this visit is like (the mood, when the visit brings none, comes from a stream of its own: the weather, the
    // wind's side and the band's rose keep the first three draws of 'the dusk')
    const mood = vary.mood ?? ctx.core.makeRng(ctx.core.hashSeed('mood:' + ctx.seed))();
    const weather = ['clear', 'cloud', 'mist'][Math.min(2, Math.floor(((rv() + mood) % 1) * 3))];
    const windSide = rv.chance(0.5) ? 1 : -1;                         // the wind blows toward +X (from the west) or toward -X
    const hour = vary.hour || 'any', deep = hour === 'night' ? 0.88 : hour === 'any' ? 1 : 1.08, rose = rv.range(-1, 1);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const world = { scene, detail, weather, windSide, density, dressOf, updates: [] };

    // ---- the route
    const path = makePath(ROUTE), L = path.length;
    await ctx.yield();
    // metres along the route nearest (in plan) to a place of the world, searched at even half metres between two reaches
    const plan = new Float32Array((Math.floor(L / 0.5) + 1) * 2), q0 = new THREE.Vector3();
    for (let i = 0; i * 2 < plan.length; i++) { path.posAtDist(i * 0.5, q0); plan[i * 2] = q0.x; plan[i * 2 + 1] = q0.z; if (i % 20 === 19) await ctx.yield(); }
    const metresAt = (x, z, from = 0, to = L) => { let best = Infinity, bd = from;
      for (let i = Math.ceil(from / 0.5); i * 0.5 <= to && i * 2 < plan.length; i++) { const dd = (plan[i * 2] - x) ** 2 + (plan[i * 2 + 1] - z) ** 2; if (dd < best) { best = dd; bd = i * 0.5; } } return bd; };
    const M = {
      dive: 60,                                                     // the high straight ends: 60 m from the entry
      level: metresAt(0, LAY.level[1], 60, L * 0.4),                // the dive is out, level over the water on the axis
      west: metresAt(LAY.west[0], LAY.west[1], 60, L * 0.5),        // the turn west ends on the run along the quay's water
      run: metresAt(LAY.run[0], LAY.run[1], 60, L * 0.5),           // the run ends, the loop round the fleet begins
      jetty: metresAt(-88, JETTY.z1, 60, L * 0.5),                  // the west jetty's tip abeam
      back: metresAt(LAY.back[0], LAY.back[1], L * 0.3, L * 0.7),   // the loop is round: due east again, south of the fleet
      beacon: metresAt(BEACON.x, BEACON.z, L * 0.4, L * 0.8),       // the beacon abeam
      leave: metresAt(RISEAT.leave[0], RISEAT.leave[1], L * 0.5, L * 0.85),   // the bend at the beacon is left, heading west over the basin
      cross: metresAt(0, RISEAT.leave[1], L * 0.5, L * 0.85),       // the rise crosses the axis over the basin
      shore: metresAt(RISEAT.west[0], RISEAT.west[1], L * 0.6, L * 0.95),     // the right-hand arc's westmost place, over the west shore
      lane: metresAt(RISEAT.lane[0], RISEAT.lane[1], L * 0.7),      // the right-hand arc is round: due east over the west rows
      join: metresAt(0, RISE.join, L * 0.8),                        // the left-hand arc ends on the axis, over the square
      axis: metresAt(0, RISE.top, L * 0.8),                         // level at 70 m: the last straight
      trough: metresAt(0, STREET.z1, L * 0.8),                      // the upper street's trough is entered
    };
    world.path = path; world.M = M;
    // THE RISE'S RULE for what is dealt under it (B2): a house the line crosses stands, stacks and all, 8 m and more under
    // the lens; a house within 12 m of the line in plan stands 4 m and more under the lens. The cap is the greatest height a
    // house on a plan may have.
    { const rl = []; for (let d = Math.round(M.beacon); d <= M.trough; d++) { path.posAtDist(d, q0); rl.push([q0.x, q0.y, q0.z]); if (d % 40 === 39) await ctx.yield(); }
      world.riseLine = rl; world.riseOff = (fp) => { let b = Infinity; for (const p of rl) b = Math.min(b, planOff(fp, p[0], p[2])); return b; };
      world.riseCap = (fp) => { let cap = Infinity; for (const p of rl) { const off = planOff(fp, p[0], p[2]); if (off <= REACH) cap = Math.min(cap, p[1] - 8); else if (off < 12) cap = Math.min(cap, p[1] - 4); } return cap; }; }
    await ctx.yield();

    // ---- sky: THE AFTERGLOW. The sun stands 5 degrees under the sea's edge in the WEST-SOUTH-WEST (120 degrees west of
    // north). At the very horizon there its own glow is a low band of ember rose; over it the wash of the last light,
    // peach and straw, runs up through green gold and turquoise into slate and ink blue overhead, with the first stars and
    // the thin moon. HIGH CLOUD stands in the dome on every visit (the kit's own layers): long streaks that take the
    // afterglow from below, rose and coral toward the west, mauve to slate away from it, drifting on the world's clock;
    // a visit of cloud brings broken bars under them too. (The kit's layers lie evenly over the dome: toward the west
    // they are fuller in light, not in cover. Under the horizon line there is none: the entry's centre is the hill.)
    const tint = (hex, k) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
    const bandCol = new THREE.Color('#E4C692').lerp(new THREE.Color(rose > 0 ? '#E8B48C' : '#D9D08E'), Math.abs(rose) * 0.5);
    const sky = makeSky({
      rng: rSky, preset: 'blueHour', bake: true, bakeSize: 256, renderer: ctx.renderer,   // (the moon's tile: 256 dots across a disc that is never 60 dots wide on the screen)
      zenith: tint('#263255', deep), mid: tint('#4E6BA6', deep), horizon: tint('#8AA3C4', deep), ground: tint('#22304C', deep), horizonPow: 7, midPow: 1.4,
      scatterColor: bandCol, scatter: 1.5, scatterPow: 1.7, scatterHigh: 0.02, scatterFall: 5.2,
      sunElevation: -5, sunAzimuth: -120, sunIntensity: 0, sunGlow: 1.25, sunGlowTight: 0.12, sunColor: EMBER,
      stars: 0, milkyWay: 0, cloudLightColor: '#F2A488',
      clouds2: { coverage: weather === 'clear' ? 0.44 : 0.38, softness: 0.45, opacity: 0.6, lit: '#E0A093', shade: '#67688C', silver: 0.9, wind: [0.004 * windSide, 0.0015] },
      clouds: weather === 'cloud' ? { coverage: 0.34, softness: 0.34, scale: 0.42, stretch: 0.42, opacity: 0.9, detail: 0.5, lit: '#E59C86', shade: '#454B6C', silver: 1.4, absorb: 1.9, wind: [0.006 * windSide, 0.002] } : false,
      bodies: [{ elevation: 16, azimuth: -30, size: 0.6, phase: 0.07, phaseAngle: -60, color: '#E9EEF6', intensity: 1.6, dark: 0.02, glow: 0.12, glowColor: '#9FB6DA' }],
    });
    scene.add(sky.object);
    await ctx.yield();
    // THE WORLD'S OWN SKY OVER THE KIT'S DOME (the part's law of it, by bearing from the sunken sun; the panes mirror the
    // same law): THE BAND at the sea's rim, deep ember in a broad rose glow (the kit's dome fades its sun's halo out at the
    // horizon); THE CLOUD OF THE WEST, long bars and a few heaps lit from below, full toward the west south west and thin
    // and cool to the north and east, on every visit, drifting on the world's clock (the visit's own stream says how full,
    // how many heaps and where on its drift the cloud stands); THE FIRST STARS in the east only (none on a visit of cloud:
    // the kit's own bars would stand before them). It is laid on a far shell by direction from the eye that draws.
    // Headlands, skerry and sails stand dark before the band.
    { const rW = ctx.core.makeRng(ctx.core.hashSeed('cloud of the west:' + ctx.seed)), sd = sky.uniforms.uSunDir.value, fuller = weather === 'cloud' ? 0.08 : weather === 'mist' ? -0.04 : 0;
      const skin = { uDir: { value: new THREE.Vector2(sd.x, sd.z).normalize() }, uSkin: { value: new THREE.Vector4(rW.range(0.5, 0.58) + fuller, rW.range(0.22, 0.3) + fuller * 0.5, rW.range(0.7, 1), 0.011 * windSide) },
        uSkinT0: { value: rW.range(0, 900) }, uStar: { value: weather === 'cloud' ? 0 : weather === 'mist' ? 0.6 : 1 } };
      const bg = new THREE.SphereGeometry(2500, 48, 16, 0, TAU, 0, Math.PI / 2);
      const bm = new THREE.ShaderMaterial({ uniforms: { ...skin, uTime: null }, side: THREE.BackSide, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false, toneMapped: false,
        vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: /* glsl */`uniform vec2 uDir; uniform vec4 uSkin; uniform float uTime, uSkinT0, uStar; varying vec3 vW;
          ${SKIN_GLSL}
          void main(){ vec3 d = normalize(vW - cameraPosition); vec4 w = westSky(d, uDir, uTime + uSkinT0, uSkin);
            gl_FragColor = vec4(w.rgb + vec3(.8, .87, 1.) * (skStars(d, uDir, uTime) * uStar * (1. - w.a)), w.a); }` });
      const band = new THREE.Mesh(bg, bm); band.position.set(0, 0, 200); band.name = 'sky-skin'; band.renderOrder = -1; band.frustumCulled = false; scene.add(band); world.skin = skin; world.skinMat = bm; }
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color('#48608E').multiplyScalar(deep), 0.0016);
    world.sky = sky;

    // ---- the light law shared by every stone of the world (the part owns the shader)
    // THE KEY from the band is paler and pinker than the lamp (between straw and rose); what is turned from it stands in
    // the dome's blue fill, deeper than the key is bright: three hues wherever the town is seen (blue shade, rose light,
    // and the lamp's gold where it reaches)
    const light = makeLight(sky, EMBER, world.skin), keyCol = bandCol.clone().lerp(new THREE.Color('#E8A89C'), 0.6);
    light.uAmb.value = 1.28 * deep; light.uSky.value.set(...linear('#7E96C8')); light.uGround.value.set(...linear('#586284'));
    light.uKeyCol.value.set(keyCol.r, keyCol.g, keyCol.b).multiplyScalar(2.2);
    light.uWind.value.set(windSide, 0, 0.18);
    // (r5m1, M3: the lamp on the flags is a law of the stone's place in the stone's own shader; these are its places: the
    // window's centre where the baked law has it, the upper street's half width and mouth, the well's rim)
    light.uLampW.value.set(W0[0], W0[1], HOUSE.wall + 0.15); light.uPave.value.set(STREET.hw, STREET.z1, WIN.hw, 0); light.uWell.value.set(WELL.x, WELL.z, 2.3, 1.2);
    world.light = light;
    world.skinMat.uniforms.uTime = light.uTime;

    // ---- THE HERO: the tall house, its wall's inner face on z 0, its door sill at y 55
    const hero = await buildHero(ctx, { light });
    hero.object.position.set(0, STREET.y0, HOUSE.wall);
    scene.add(hero.object);
    world.hero = hero;
    await ctx.yield();

    world.rngs = { rBoats, rQuay, rBirds, rSmoke, rPaint, rWash, rMist, rLugger, rGulls, rSeabirds, rLived, rLeaves, rSkerry, rRoost };
    // THE NET STAIR'S OWN LINE: the kit's curve through the stair's points, its mouth and its top found on it by place
    { const sp = makePath(STAIRLINE), q = new THREE.Vector3(), find = (x, z) => { let best = Infinity, bd = 0; for (let d = 0; d <= sp.length; d += 0.5) { sp.posAtDist(d, q); const dd = (q.x - x) ** 2 + (q.z - z) ** 2; if (dd < best) { best = dd; bd = d; } } return bd; };
      world.stair = makeStair(sp, { mouth: find(STAIR.mouth[0], STAIR.mouth[1]), top: find(STAIR.top[0], STAIR.top[1]) }); }
    await buildLand(ctx, world, town);
    await ctx.yield();
    await buildSea(ctx, world, rSea);
    await ctx.yield();
    await buildBoats(ctx, world);
    await buildThings(ctx, world);
    await buildLived(ctx, world);
    await buildMoving(ctx, world);
    await buildDrying(ctx, world);
    await ctx.yield();
    await buildLife(ctx, world);
    await buildCountry(ctx, world);
    await buildGreens(ctx, world);
    await ctx.yield();
    await buildWashing(ctx, world);
    await ctx.yield();
    await buildFar(ctx, world);
    await ctx.yield();
    const counts = await countClear(ctx, world);
    await buildBayMirror(ctx, world);
    counts.bay = { patches: world.bay.patches, hulls: world.bay.hulls }; counts.lugLap = world.lugLap;
    counts.washingDay = world.washDay; counts.drying = world.drying; counts.streetSmoke = world.streetSmoke;
    counts.roofBirds = world.roofBirds; counts.treeClear = world.treeClear;
    await ctx.yield();

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    const u = (metres) => metres / L;
    // THE PACE, by places (metres along the route found from the places themselves): slower through the middle of the turn
    // west under the quay, past the jetty's tip and round the bend at the beacon abeam, a little slower round the west shore and over the roofs of the west rows, and
    // even from where the rise comes level on the axis: every window here is one of places
    const bump = (d, c, w) => Math.exp(-(((d - c) / w) ** 2));
    const pace = (uu) => { const d = uu * L;
      const p = 1.1 - 0.37 * bump(d, M.west - HEAD.Rw * Math.PI / 4, 55) - 0.14 * bump(d, M.jetty, 50) - 0.3 * bump(d, M.beacon, 55) - 0.12 * bump(d, M.shore, 60) - 0.14 * bump(d, M.lane, 45);
      return lerp(p, 1, smoothstep(M.axis - 10, M.axis + 20, d)); };
    // THE GAZE UP THE RISE rests on the town's axis at the height the lens has (a place of the town found from where the
    // flight is): the quay's back at 4.5 m, the square's middle at 49 m, the window at 70 m, and evenly between them. So
    // the eye looks level across at the tier it has reached, and at the rise's end it looks into the lamp's house.
    const TIERS = [[QUAY.y, QUAY.z0], [SQUARE.y, (SQUARE.z0 + SQUARE.z1) / 2], [W0[1], W0[2]]], lensAt = new THREE.Vector3(), levelAt = new THREE.Vector3();
    const levelWith = (time, uu) => { path.posAtDist(uu * L, lensAt); const y = clamp(lensAt.y, TIERS[0][0], TIERS[2][0]), k = y < TIERS[1][0] ? 0 : 1, a = TIERS[k], b = TIERS[k + 1];
      return levelAt.set(0, y, a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0])); };
    return {
      scene, path, duration: 50, pace, counts,
      // the gaze rests 24 m down the route (the bends are of 42 m and more: a longer reach looks back across them)
      camera: { fov: 62, near: 0.3, far: 3000, bank: 0.2, lookAhead: 24 },
      // THE OPENING IS THE WINDOW: exactly the join sheet's fields (JOIN 1 to 2), and nothing else
      portal: { shape: 'rect', width: 7, height: 9.2, frame: 0, veil: GOLD, revealDistance: 150, blendDistance: 25 },
      pois: [
        // from the entry down the dive the gaze rests on the lit window: on the axis it is dead ahead (no turn of the gaze at
        // all over the first 60 m); as the line dives it holds the town and the gold road in view, and it is let go
        // through the turn west, so that the run along the quay looks into the last light
        { at: W0, from: 0, to: u(M.west + 40), weight: 0.5, fade: 0.3 },
        // round the loop the gaze leans in toward the moored fleet it flies round (the loop's own middle, at the hulls' height):
        // masts against the last light, then against the open bay and the lugger, then against the mole
        { at: [LAY.loop.x, 8, LAY.loop.z], from: u(M.west + 15), to: u(M.back + 25), weight: 0.33, fade: 0.4 },
        // from the loop's far side round the bend at the beacon to the crossing of the axis: the town under its lamp and the
        // gold road on the water (the quay's middle, halfway up the town), in the half of the view the beacon does not
        // stand in
        { at: TOWNMID, from: u(M.back - 55), to: u(M.beacon + 40), weight: 0.5, fade: 0.35 },
        // from the beacon abeam the gaze is drawn to the town's axis at the lens's own height (see levelWith): tier by tier
        // up the rise, round the west shore and over the roofs, and at 70 m it is the window; the engine's own guard lets
        // it go over the last straight
        { at: levelWith, from: u(M.beacon - 20), to: 1, weight: 0.5, fade: 0.12 },
      ],
      post: { exposure: 1.25, bloom: { strength: 0.5, radius: 0.6, threshold: 0.9 }, grade: { shadowTint: '#0E1830', saturation: 1.05, vignette: 0.3 } },
      update(dt, time, camera, uu) {
        hero.update(dt, time, camera);
        sky.update(dt, time, camera);
        for (const f of world.updates) f(dt, time, camera, uu);
      },
      dispose() { sky.dispose(); world.bayRows.dispose(); },
    };
  },
};

// ================================================================ the ground: one law of height for hill, terraces, shore and sea bed
// The waterline is z as a function of x (land lies north of it): the west headland, the shingle slip, the rock foot west of
// the jetty, the quay's edge, and the east shore running out south-east beyond the lugger's water.
const COAST = [[-420, 600], [-330, 470], [-260, 380], [-204, 300], [-190, 262], [-178, 236], [-162, 214], [-142, 200], [-119, 200], [-117, 191], [-90, 190],
  [88, 190], [100, 192], [125, 196], [165, 205], [200, 225], [225, 260], [245, 310], [280, 380], [340, 470], [430, 600]];
// THE SKERRY off the west headland, the same on every visit: stacks of rock standing in the shallows off the headland's first
// reach beyond the bay's shoulder (the coast's line from COAST[3] to COAST[2]). To each: how far along the reach, metres out
// to sea from its waterline, height, girth at the water. (They stand 65 to 85 m from the loop's seaward side, on the band's bearing.)
// the chimney smoke's measures: puffs to a plume, the lean at a plume's head as a share of its height, clear air to the line in plan
const SMOKE = { n: 14, lean: 0.85, clear: 6 };
// THE DRYING LINES ON THE ROOFS (r5m1, M1), in metres: on a flank house of the upper street two poles stand on the ridge
// `inset` from its ends, `pole` high, the line `line` over the ridge; on a row's roof the poles stand `off` down the lee
// slope, the line `rowLine` over the ridge. No piece hangs within `clear` of the flown line at its full swing, within
// `plane` of the opening's plane, or nearer than `sight` to the sight of the tall house's front from the last `last` m
// of the line (the front is `front` either side of the axis; the widest sight at a depth z is front (1 - z / last)).
const DRYING = { pole: 6.4, line: 6.2, inset: 3.4, rowLine: 4.6, off: 1.6, rowInset: 2.6, clear: 6, plane: 8, sight: 0.25, last: 90, front: HOUSE.hw };
const isFlank = (h) => { const P = h.fp, hx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, hz = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4; return h.street && Math.abs(hx) < STREET.hw + STREET.depth && hz > STREET.z0 && hz < STREET.z1; };
// the heads of a flank house's two poles (no draw: the ridge's own ends)
const flankPoles = (h) => { const [p, q] = h.ridge, t = DRYING.inset / Math.hypot(q[0] - p[0], q[1] - p[1]); return [[lerp(p[0], q[0], t), h.rd + DRYING.pole, lerp(p[1], q[1], t)], [lerp(q[0], p[0], t), h.rd + DRYING.pole, lerp(q[1], p[1], t)]]; };
const SKERRY = [[0.06, 30, 32, 8], [0.2, 36, 22, 6], [0.3, 26, 27, 7]].map(([t, out, h, r]) => { const a = COAST[3], b = COAST[2], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  return { x: a[0] + dx * t + dz / l * out, z: a[1] + dz * t - dx / l * out, h, r }; });
const SLIP = { x0: -142, x1: -118, wet: 200, top: 186, rise: 3 };
// the rows of the town below the square: back and front of each band of houses and its ground level
const ROWS = [{ z0: 160, z1: 174, g: 4.5 }, { z0: 145, z1: 158, g: 16 }, { z0: 129, z1: 142, g: 28 }, { z0: 114, z1: 126, g: 40 }];
// THE NET STAIR's centre line is its own curve (STAIRLINE) from its mouth on the quay to its top in the square's west side
function makeStair(path, M) {
  const line = []; let sAcc = 0, prev = null; const q = new THREE.Vector3(), t = new THREE.Vector3();
  for (let d = M.mouth; d <= M.top + 1e-6; d += 0.5) { path.posAtDist(d, q); path.tangentAtDist(d, t); if (prev) sAcc += Math.hypot(q.x - prev[0], q.z - prev[1]); const tl = Math.hypot(t.x, t.z); line.push({ x: q.x, z: q.z, tx: t.x / tl, tz: t.z / tl, s: sAcc }); prev = [q.x, q.z]; }
  const SL = sAcc;
  const at = (sv) => { let i = 0; while (i < line.length - 2 && line[i + 1].s < sv) i++; const a = line[i], b = line[i + 1], f = clamp((sv - a.s) / Math.max(1e-6, b.s - a.s), 0, 1);
    const tx = a.tx + (b.tx - a.tx) * f, tz = a.tz + (b.tz - a.tz) * f, l = Math.hypot(tx, tz); return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, tx: tx / l, tz: tz / l, rx: -tz / l, rz: tx / l }; };
  const side = (c, k) => [c.x + c.rx * k, c.z + c.rz * k], stairY = (sv) => STAIR.y0 + (STAIR.y1 - STAIR.y0) * clamp(sv / SL, 0, 1);
  // the nearest place of the line to a plan point: how far, and how many metres up the stair
  const near = (x, z) => { let best = Infinity, bi = 0; for (let i = 0; i < line.length; i++) { const dd = (line[i].x - x) ** 2 + (line[i].z - z) ** 2; if (dd < best) { best = dd; bi = i; } } return { d: Math.sqrt(best), s: line[bi].s }; };
  return { line, at, side, stairY, SL, near };
}
function makeGround(noise, stair) {
  const coastZ = (x) => { let i = 0; while (i < COAST.length - 2 && x > COAST[i + 1][0]) i++; const a = COAST[i], b = COAST[i + 1], t = (x - a[0]) / (b[0] - a[0]); return { z: a[1] + (b[1] - a[1]) * t, k: (b[1] - a[1]) / (b[0] - a[0]) }; };
  // metres inland of the waterline (negative: out at sea)
  const inland = (x, z) => { let i = 0; while (i < COAST.length - 2 && x > COAST[i + 1][0]) i++; const a = COAST[i], b = COAST[i + 1], k = (b[1] - a[1]) / (b[0] - a[0]); return (a[1] + k * (x - a[0]) - z) / Math.sqrt(1 + Math.min(k * k, 9)); };
  // the town's ground along its axis: the quay's level, four terraces, the square, the upper street, the house's landing, the crown
  const steps = [[159.2, 4.5, 16], [143.6, 16, 28], [127.6, 28, 40], [112.6, 40, 49]];
  const axis = (z) => {
    let y = 4.5;
    if (z >= SQUARE.z0) for (const [zs, lo, hi] of steps) y += (hi - lo) * smoothstep(zs + 0.6, zs - 0.6, z);
    else if (z >= -13) y = 49 + 6 * clamp((SQUARE.z0 - z) / (SQUARE.z0 - STREET.z0), 0, 1);
    else y = 55 + 27 * smoothstep(-13, -52, z) - 0.1 * Math.max(0, -52 - z);
    return y - 0.7;
  };
  const eastOf = (z) => (z > 40 ? lerp(60, 92, clamp((z - 40) / 134, 0, 1)) : lerp(22, 60, clamp((z + 150) / 190, 0, 1)));
  const westOf = (z) => (z > 40 ? lerp(55, 92, clamp((z - 40) / 134, 0, 1)) : lerp(26, 55, clamp((z + 150) / 190, 0, 1)));
  const h = (x, z) => {
    const d = inland(x, z);
    if (d < 0) return Math.max(-10, -0.4 + 0.3 * d);
    // (inside the town's own bounds the ground is the town's alone: the wild shore is not worked out there)
    const out = Math.max(0, x - eastOf(z), -westOf(z) - x), wT = (1 - smoothstep(0, 55, out)) * (1 - smoothstep(190, 191, z));
    let y = Math.max(axis(z), z > 158 ? 3.8 : 0);
    if (wT < 1) {
      // the wild shore: a rock foot at the water, rising to 10 m within 20 m and on to the headlands' backs
      const n = noise.fbm2(x * 0.021 + 3.3, z * 0.021 - 1.7, 4), n2 = noise.fbm2(x * 0.07, z * 0.07 + 9, 3);
      let wild = 3 * smoothstep(0, 2.5, d) + 7 * smoothstep(3, 20, d) + 24 * smoothstep(20, 150, d) + (4 * n + 1.2 * n2) * smoothstep(2, 30, d) + Math.min(45, 0.14 * Math.max(0, d - 110)) * (0.75 + 0.5 * n);
      // the shingle slip: an even bank from its wet edge up to 3 m at z 186
      const inSlip = smoothstep(SLIP.x0 - 3, SLIP.x0 + 2, x) * (1 - smoothstep(SLIP.x1 - 2, SLIP.x1 + 3, x));
      const shingle = SLIP.rise * clamp((SLIP.wet - z) / (SLIP.wet - SLIP.top), 0, 1.6) + 0.15 * n2;
      wild = lerp(wild, shingle, inSlip * (1 - smoothstep(SLIP.top - 8, SLIP.top - 24, z)));
      y = lerp(wild, y, wT);
    }
    // the crown stands west of the axis under the pines
    y += 5 * Math.exp(-((x - CROWN.x) ** 2 + (z - CROWN.z) ** 2) / 1600) * smoothstep(0, -30, z);
    // the Net Stair is cut into the hill: the ground follows its steps (1.2 m under them) and eases back within 18 m
    if (x > -104 && x < -8 && z > 88 && z < 190) { const n = stair.near(x, z); y = lerp(y, stair.stairY(n.s) - 1.2, 1 - smoothstep(STAIR.hw + 4, STAIR.hw + 18, n.d)); }
    return y;
  };
  return { h, inland, coastZ, axis, eastOf, westOf };
}

// ================================================================ THE COUNTRY ROUND THE TOWN: fields, the same on every seed
// The land outside the town is parcelled: small garden plots within 80 m of the town's edge, fields of about 60 m beyond.
// Each parcel is the ground nearest one of a set of fixed sites (dealt by a fixed number); it has its own crop, and the
// boundary between two parcels carries a dry-stone wall, a hedge or nothing (buildCountry). Two roads leave the town.
const ROADS = [
  // the hill road: from the quay's east end up the east slope in two bends and away over the hill's back
  { w: 5.5, pts: [[93, 171], [112, 160], [138, 150], [160, 134], [162, 114], [144, 100], [120, 92], [104, 76], [112, 56], [136, 42], [164, 30], [186, 6], [190, -26], [172, -58], [140, -84], [104, -110]] },
  // the coast track: from the shingle slip west and up onto the west headland's back
  { w: 4.5, pts: [[-112, 181], [-124, 168], [-146, 160], [-172, 166], [-196, 184], [-222, 214], [-248, 254], [-282, 300], [-322, 356], [-370, 430]] },
];
function makeFields(fixed, G) {
  const sites = [], add = (x, z, plot) => sites.push({ x, z, plot, crop: Math.floor(fixed() * 5), tone: 0.82 + 0.36 * fixed(), fence: fixed() });
  for (let x = -450; x <= 450; x += 60) for (let z = -250; z <= 230; z += 60) add(x + (fixed() - 0.5) * 36, z + (fixed() - 0.5) * 36, false);
  for (let x = -195; x <= 195; x += 30) for (let z = -75; z <= 195; z += 30) { const px = x + (fixed() - 0.5) * 16, pz = z + (fixed() - 0.5) * 16, keep = fixed();
    const out = Math.max(0, px - G.eastOf(pz), -G.westOf(pz) - px); if (out > 6 && out < 80 && keep < 0.8) add(px, pz, true); }
  // the two nearest sites of a place: which parcel it lies in, and how far it is from the boundary to the next
  // (the sites are sorted into squares of 60 m; a place asks the five by five squares about its own: no site further off
  // than those can be its nearest or its second nearest)
  const SQ = 60, bins = new Map(), binOf = (x, z) => Math.floor(x / SQ) * 4096 + Math.floor(z / SQ);
  let binned = 0; const bin = () => { for (; binned < sites.length; binned++) { const k = binOf(sites[binned].x, sites[binned].z); if (!bins.has(k)) bins.set(k, []); bins.get(k).push(binned); } };
  const cellAt = (x, z) => { let d1 = Infinity, d2 = Infinity, i1 = -1, i2 = -1; bin();
    const bx = Math.floor(x / SQ), bz = Math.floor(z / SQ);
    for (let gx = bx - 2; gx <= bx + 2; gx++) for (let gz = bz - 2; gz <= bz + 2; gz++) { const L = bins.get(gx * 4096 + gz); if (!L) continue;
      for (let q = 0; q < L.length; q++) { const i = L[q], dx = sites[i].x - x, dz = sites[i].z - z, d = dx * dx + dz * dz; if (d < d1 || (d === d1 && i < i1)) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2 || (d === d2 && i < i2)) { d2 = d; i2 = i; } } }
    return { a: i1, b: i2, edge: (Math.sqrt(d2) - Math.sqrt(d1)) / 2 }; };
  // metres from a place to the nearest road's middle line
  const box = ROADS.map((r) => [Math.min(...r.pts.map((q) => q[0])) - 14, Math.max(...r.pts.map((q) => q[0])) + 14, Math.min(...r.pts.map((q) => q[1])) - 14, Math.max(...r.pts.map((q) => q[1])) + 14]);
  const roadAt = (x, z) => { let best = 99, w = 5; for (let k = 0; k < ROADS.length; k++) { const r = ROADS[k], bx = box[k]; if (x < bx[0] || x > bx[1] || z < bx[2] || z > bx[3]) continue; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], lx = b[0] - a[0], lz = b[1] - a[1];
      const t = clamp(((x - a[0]) * lx + (z - a[1]) * lz) / (lx * lx + lz * lz), 0, 1), d = Math.hypot(x - a[0] - lx * t, z - a[1] - lz * t); if (d < best) { best = d; w = r.w; } } } return { d: best, w }; };
  return { sites, cellAt, roadAt };
}
const CROPS = ['#73844F', '#A39A62', '#75604B', '#5B6848', '#8C985E'];

// ================================================================ the land (hill, shore, harbour works, town)
async function buildLand(ctx, world, town) {
  const noise = ctx.core.makeNoise(64137), G = makeGround(noise, world.stair), light = world.light;
  world.ground = G; world.noise = noise;
  await ctx.yield();
  const fields = makeFields(ctx.core.makeRng(64139), G), CROP = CROPS.map((c) => linear(c)), ROADC = linear('#A39C88'); world.fields = fields;
  await ctx.yield();
  // ---- the hill and the shore: one sheet of shared corners, fine under the town and coarse beyond it
  const lines = (a, b, fine0, fine1, f, c) => { const out = []; let v = a; while (v < b) { out.push(v); v += (v >= fine0 && v < fine1) ? f : c; } out.push(b); return out; };
  const xs = lines(-460, 460, -150, 150, 3, 14), zs = lines(-260, 520, -70, 216, 3, 14), NX = xs.length, NZ = zs.length;
  const ROCKC = linear('#55534E'), TURFC = linear('#4A5640'), HEATH = linear('#5A4C44'), SHINGLE = linear('#8D8A80');
  const hs = new Float32Array(NX * NZ);
  for (let i = 0; i < NX; i++) { for (let j = 0; j < NZ; j++) hs[i * NZ + j] = G.h(xs[i], zs[j]); await ctx.yield(); }
  const pos = new Float32Array(NX * NZ * 3), nor = new Float32Array(NX * NZ * 3), col = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2), ap = new Float32Array(NX * NZ * 4), idx = [];
  await ctx.yield();
  for (let i = 0; i < NX; i++) { await ctx.yield(); for (let j = 0; j < NZ; j++) { if ((j & 31) === 31) await ctx.yield();
    const k = i * NZ + j, x = xs[i], z = zs[j], y = hs[k], ia = Math.max(0, i - 1), ib = Math.min(NX - 1, i + 1), ja = Math.max(0, j - 1), jb = Math.min(NZ - 1, j + 1);
    const dx = (hs[ib * NZ + j] - hs[ia * NZ + j]) / (xs[ib] - xs[ia]), dz = (hs[i * NZ + jb] - hs[i * NZ + ja]) / (zs[jb] - zs[ja]), nl = Math.hypot(dx, 1, dz);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; nor[k * 3] = -dx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -dz / nl; uv[k * 2] = x; uv[k * 2 + 1] = z;
    const steep = Math.hypot(dx, dz), patch = noise.fbm2(x * 0.011 + 7, z * 0.011 - 3, 3) * 0.5 + 0.5;
    const turf = smoothstep(0.8, 0.3, steep) * smoothstep(5, 13, y), heath = turf * smoothstep(0.45, 0.7, patch);
    const inSlip = x > SLIP.x0 && x < SLIP.x1 && z > SLIP.top - 8 && z < SLIP.wet + 6;
    // parcels on the turf outside the town: each its own crop, a darker line where two meet; a pale road where one runs
    const outT = Math.max(0, x - G.eastOf(z), -G.westOf(z) - x), fld = turf * smoothstep(3, 14, outT) * smoothstep(0.62, 0.4, steep), cell = fld > 0.01 ? fields.cellAt(x, z) : null, site = cell ? fields.sites[cell.a] : null;
    const rd = fields.roadAt(x, z), road = smoothstep(rd.w * 0.5 + 2.5, rd.w * 0.5 - 0.5, rd.d) * smoothstep(1.5, 5, y);
    for (let c = 0; c < 3; c++) { let v = inSlip ? SHINGLE[c] : lerp(lerp(ROCKC[c], TURFC[c], turf), HEATH[c], heath) * (0.8 + 0.4 * patch);
      if (site) v = lerp(v, CROP[site.crop][c] * site.tone * (0.9 + 0.2 * patch), fld * 0.9) * (1 - 0.3 * fld * smoothstep(3, 0.5, cell.edge));
      col[k * 3 + c] = lerp(v, ROADC[c] * (0.9 + 0.2 * patch), inSlip ? 0 : road); }
    // (r5m1, M2: the ground's fourth number is its share of grass that the wind can lay over: turf, heath and crop outside
    // the town; none on rock, on a road, on the slip's shingle or on the town's own ground. The gust bands run by it.)
    ap[k * 4] = SURF.ROCK; ap[k * 4 + 1] = 0.5 + 0.5 * smoothstep(0, 1.6, y); ap[k * 4 + 2] = 0; ap[k * 4 + 3] = inSlip ? 0 : turf * (1 - road) * smoothstep(2, 12, outT);
  } }
  await ctx.yield();
  for (let i = 0; i < NX - 1; i++) { if ((i & 7) === 7) await ctx.yield(); for (let j = 0; j < NZ - 1; j++) {
    const a = i * NZ + j, b = a + NZ, c = b + 1, d = a + 1;
    if (Math.max(hs[a], hs[b], hs[c], hs[d]) < -6) continue;
    idx.push(a, d, c, a, c, b);
  } }
  await ctx.yield();
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tg.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); tg.setAttribute('aP', new THREE.BufferAttribute(ap, 4)); tg.setAttribute('aSh', new THREE.BufferAttribute(new Float32Array(NX * NZ), 1)); tg.setIndex(new THREE.Uint32BufferAttribute(idx, 1)); tg.computeBoundingSphere();
  await ctx.yield();
  const hill = new THREE.Mesh(tg, stoneMaterial(light)); hill.name = 'hill'; world.scene.add(hill);
  await ctx.yield();
  // the height of the sheet itself at a place (on its own triangles, so that what is stood on it meets it)
  // (which strip of the sheet a metre lies in is looked up in a table of whole metres, then stepped to the strip itself)
  const table = (arr) => { const t = new Uint16Array(Math.ceil(arr[arr.length - 1] - arr[0]) + 1); for (let m = 0, c = 0; m < t.length; m++) { while (c < arr.length - 2 && arr[c + 1] <= arr[0] + m) c++; t[m] = c; } return t; };
  const tX = table(xs), tZ = table(zs), x0 = xs[0], x1 = xs[NX - 1], z0 = zs[0], z1 = zs[NZ - 1];
  world.hillH = (x, z) => { if (x < x0) x = x0; else if (x > x1) x = x1; if (z < z0) z = z0; else if (z > z1) z = z1;
    let i = tX[(x - x0) | 0], j = tZ[(z - z0) | 0]; if (i < NX - 2 && xs[i + 1] <= x) i++; if (j < NZ - 2 && zs[j + 1] <= z) j++;
    const sx = (x - xs[i]) / (xs[i + 1] - xs[i]), tz = (z - zs[j]) / (zs[j + 1] - zs[j]);
    const ha = hs[i * NZ + j], hb = hs[(i + 1) * NZ + j], hc = hs[(i + 1) * NZ + j + 1], hd = hs[i * NZ + j + 1];
    return tz >= sx ? ha + (hc - hd) * sx + (hd - ha) * tz : ha + (hb - ha) * sx + (hc - hb) * tz; };
  world.stone = hill.material;
  await ctx.yield();
  await buildWorks(ctx, world, town);
  await buildTown(ctx, world, town);
}

// ================================================================ the sea and the lamp's reflection on it
async function buildSea(ctx, world, rSea) {
  // the water holds the sky: the kit's ocean lit from our dome, its body an ink blue under the sky's own fill
  // the depth of the water under the kit's own sample places, read from our ground law in small steps
  const DR = [-470, 150, 470, 640], DN = 128, depth = new Float32Array(DN * DN);
  for (let j = 0; j < DN; j++) { for (let i = 0; i < DN; i++) depth[j * DN + i] = -world.ground.h(DR[0] + (i + 0.5) / DN * (DR[2] - DR[0]), DR[1] + (j + 0.5) / DN * (DR[3] - DR[1])); await ctx.yield(); }
  const depthAt = (x, z) => depth[clamp(Math.floor((z - DR[1]) / (DR[3] - DR[1]) * DN), 0, DN - 1) * DN + clamp(Math.floor((x - DR[0]) / (DR[2] - DR[0]) * DN), 0, DN - 1)];
  await ctx.yield();
  const wl = Water.waterLight(world.sky); wl.ambient.set('#E0E0EA'); wl.sunColor.set('#E9A890').multiplyScalar(0.95);
  // the water's glints take the band itself (the bright sky 4 degrees over the sea's edge), not the sunken sun under it
  wl.sunDir.set(KEY_DIR[0], 0.07, KEY_DIR[2]).normalize();
  // THE WATER HOLDS THE AFTERGLOW: what the bay mirrors toward the west is the band and the lit cloud over it, rose and
  // gold, high up the sky as well as at its rim (the cloud of the west stands high); away from the west it mirrors the
  // dusk's blue violet. So the bay is rose and gold toward the west and blue violet elsewhere, by bearing.
  wl.scatterColor.set('#E7A78C'); wl.skyP.z = 1.35; wl.skyP.w = 4; wl.skyQ.x = 0.45; wl.skyQ.y = 2.4;
  const sea = Water.makeOcean({ rng: rSea, preset: 'calm', light: wl, height: 0.5, wavelength: 28, steepness: 0.5, spread: 0.5, speed: 1, radius: 2800, rings: 104, segments: 128, windAngle: -0.75, detail: 0.35, contrast: 0.7, deep: '#5a6486', foam: 0.0, glitter: 0.5,
    // the shore: the kit's shallows and swash, read from our own ground law (pale water and a white edge where it breaks)
    depthAt, depthRect: DR, depthRes: DN, shallowColor: '#5d7494', shoalDepth: 3.5, shoalWidth: 7 });
  sea.uniforms.uScatter.value.set('#48607f');
  world.scene.add(sea.object); world.sea = sea;
  await ctx.yield();
  world.updates.push((dt, time, camera) => sea.update(dt, time, camera));
  // THE LAMP ON THE BAY: one sheet over the water (the kit's water takes no term of ours), drawn by the water's mirror law.
  // For a place q of the water: the line from the eye's foot to the window's foot; along it the slope a ripple must have to
  // send the window to the eye (none at the mirror point, 70 / (h + 70) of the way from the window's foot); the water's own
  // slopes there (a law of place and the world clock) decide whether it glints. It lies only where it is seen on water:
  // quay, mole, jetty, hulls and shore hide it by standing in it.
  const RY = 0.5, g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uW: { value: new THREE.Vector3(W0[0], W0[1] - RY, W0[2]) }, uCol: { value: new THREE.Color(1, 0.47, 0.085) }, uPeak: { value: 2.0 }, uTime: world.light.uTime, uBreath: world.light.uBreath,
      uFog: { value: world.scene.fog.density }, uY: { value: RY }, uSeen: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uW, uCol; uniform float uPeak, uTime, uBreath, uFog, uY, uSeen; varying vec3 vW;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      // the water's height at a place (metres): the bay's own swell (28 m from crest to crest, running in from the sea on
      // the sea's own bearing at the pace such a swell has) and two ripples, moving on the world clock
      float wave(vec2 p){ return .55 * sin(dot(p, vec2(.1642, -.153)) - uTime * 1.484) + 1.5 * vn(p * .21 + vec2(uTime * .16, -uTime * .1)) + .42 * vn(p * .83 + vec2(-uTime * .3, uTime * .22)); }
      void main(){
        vec2 q = vW.xz, e = cameraPosition.xz, ew = uW.xz - e; float D = length(ew); vec2 dir = ew / max(D, 1.), nrm = vec2(-dir.y, dir.x);
        float along = dot(q - e, dir), lat = dot(q - e, nrm), a = D - along, h = max(cameraPosition.y - uY, 1.5);
        if (along < .3 || a < 1.) discard;
        float wd = 1.4 + 2. * clamp(a / D, 0., 1.);
        if (abs(lat) > wd * 3. + 4.) discard;
        float h0 = wave(q), sp = (wave(q + dir * .7) - h0) / .7, sq = (wave(q + nrm * .7) - h0) / .7;
        float need = tan(.5 * (atan(uW.y, a) - atan(h, along)));
        float gx = (need + sp * .55) / .085, cx = (lat + sq * 6.) / wd;     // squared by x times x: either may be under nought
        float glint = exp(-gx * gx);
        float cross = exp(-cx * cx);
        float dist = length(vW - cameraPosition), fog = exp(-pow(uFog * dist, 2.));
        float v = uPeak * uBreath * uSeen * glint * cross * fog * smoothstep(.3, 3., along);
        if (v < .004) discard;
        gl_FragColor = vec4(uCol * v, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  await ctx.yield(); buildSkerry(world); await ctx.yield(); buildSurf(world); await ctx.yield();
  const sheet = new THREE.Mesh(g, mat); sheet.name = 'the-lamp-on-the-bay'; sheet.scale.set(420, 1, 400); sheet.position.set(-40, RY, 330); sheet.renderOrder = 4;
  world.scene.add(sheet);
  // THE WORLD'S ONE LAW OF THE EYE (see the head): the road is shown by how much of the window the eye that draws this
  // sheet sees. The share is asked here, as the sheet is drawn, of the camera handed to that drawing (its place in the
  // world), and set for that drawing alone: nothing is kept, eased or carried over, no clock and no time step is read.
  const eye = new THREE.Vector3();
  sheet.onBeforeRender = (renderer, scene, camera) => { eye.setFromMatrixPosition(camera.matrixWorld); mat.uniforms.uSeen.value = world.lampLaw.sight(eye.x, eye.y, eye.z); };
}

// THE SURF: a soft broken line of white along every shore and every stone foot, lapping in and out on the world clock. Strips
// laid on the water along the waterline (wide on the wild shore, narrow under quay, jetty and mole); v runs from the land's
// edge (0) out to sea (1). Each stretch laps on its own phase; the white is broken by a slow noise. It lights nothing.
// THE SKERRY IS A ROCK OF THE HEADLAND'S OWN STONE. Each stack is a leaning pile of that rock in lifts between two
// LEDGES, ten uneven ribs round it (buttress and gully: its outline is the rock's, by a fixed noise of its own place), a
// broken head; its faces are flat facets, each with its own facing, so each takes the light of the place by the one light
// law: rose and straw on the facets turned to the afterglow, the dome's blue violet on those turned from it. Its stone is
// the headland's grey with ochre lichen above the spray; the ledges are pale with the birds' lime; round its foot runs
// the PALER TIDE LINE (barnacle and salt between the wet weed at the water and the dry rock), and low rocks stand off its
// feet in the surf. It takes no lamp. Seabirds stand on its ledges and lift about its heads (buildThings, buildLife).
function buildSkerry(world) {
  const m = makeMason(), ledges = [], roost = [], N = world.noise, NA = 10;
  const ROCK = linear('#8A867C'), OCHRE = linear('#A8935E'), WET = linear('#5A5E66'), TIDE = linear('#B0AA9A'), LIME = linear('#C9C5B8');
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  SKERRY.forEach((k, si) => { const lean = [Math.sin(si * 2.4 + 0.7) * 0.09, Math.cos(si * 1.9 + 0.3) * 0.09], h = k.h;
    // a rib's reach at bearing i (the same from foot to head: a buttress stands under a buttress) and a small play by level
    const rib = (i) => 1 + 0.24 * N.fbm2(k.x * 0.37 + i * 1.9, k.z * 0.29 - i * 0.7, 2), play = (i, lv) => 1 + 0.07 * N.fbm2(k.z * 0.11 + i * 2.3 + lv * 5.1, k.x * 0.13 - lv * 1.3, 2);
    const at = (i, y, f, lv) => { const a = (i % NA) / NA * TAU + 0.3 * si, rr = k.r * f * rib(i % NA) * play(i % NA, lv), yy = Math.max(y, 0);
      return [k.x + lean[0] * yy + Math.cos(a) * rr, y, k.z + lean[1] * yy + Math.sin(a) * rr]; };
    // a place on a level at a bearing: along the chord between the two ribs the bearing falls between
    const seat = (a, y, f, lv) => { const u = (((a % TAU) + TAU) % TAU) / TAU * NA, i = Math.floor(u), t = u - i, p = at(i, y, f, lv), q = at(i + 1, y, f, lv);
      return [p[0] + (q[0] - p[0]) * t, y, p[2] + (q[2] - p[2]) * t]; };
    // the lifts, foot to head: [height, girth as a share of the foot's, the level's name]; a ledge is two rings at one height
    const rings = [[-3, 1.14, 0], [0.5, 1.1, 1], [2.3, 1.02, 2], [0.2 * h, 0.95, 3], [0.42 * h, 0.87, 4], [0.42 * h, 0.7, 4], [0.61 * h, 0.64, 5], [0.78 * h, 0.58, 6], [0.78 * h, 0.43, 6], [0.91 * h, 0.35, 7], [h, 0.17, 8]];
    for (let j = 0; j < rings.length - 1; j++) { const [y0, f0, l0] = rings[j], [y1, f1, l1] = rings[j + 1], flat = y1 === y0;
      for (let i = 0; i < NA; i++) { const a = at(i, y0, f0, l0), b = at(i + 1, y0, f0, l0), c = at(i + 1, y1, f1, l1), d = at(i, y1, f1, l1);
        const lich = clamp(0.5 + 0.9 * N.fbm2(k.x + i * 3.1 + j * 1.7, k.z - i * 1.3 + j * 2.9, 2), 0, 1) * smoothstep(0.15 * h, 0.4 * h, y0), tone = 0.92 + 0.2 * (((i * 7 + j * 3 + si) % 5) / 4);
        const col = flat ? mix3(ROCK, LIME, y0 > 0.6 * h ? 0.75 : 0.45) : j === 0 ? WET : j === 1 ? TIDE : mix3(ROCK, OCHRE, 0.7 * lich);
        m.col(col, flat ? 1 : tone).set({ surf: SURF.ROCK, lamp: 0 });
        // (the foot of every lift stands in the corner of the ledge under it: a little shut in; its head is open)
        m.quad(b, a, d, c, { uv: [i * 4.1 + si * 9, y0], ao: flat ? 0.95 : [j > 1 ? 0.8 : 0.9, j > 1 ? 0.8 : 0.9, 1, 1] }); }
      if (flat) { const mid = (f0 + f1) / 2, lv = l0; ledges.push([k.x + lean[0] * y0, y0, k.z + lean[1] * y0, k.r * mid]); roost.push((a) => seat(a, y0, mid, lv)); } }
    // the broken head: the last ring closed to a splintered point a little off its middle
    { const [yt, ft, lt] = rings[rings.length - 1], tip = [k.x + lean[0] * h + 0.2 * k.r * Math.cos(si * 2.1), yt + 0.07 * h, k.z + lean[1] * h + 0.2 * k.r * Math.sin(si * 2.1)];
      for (let i = 0; i < NA; i++) { m.col(mix3(ROCK, LIME, 0.5), 0.9 + 0.2 * (i % 3) / 2).set({ surf: SURF.ROCK, lamp: 0 }); m.tri(at(i + 1, yt, ft, lt), at(i, yt, ft, lt), tip, { ao: [1, 1, 1] }); }
      ledges.push([tip[0], yt, tip[2], k.r * ft * 0.5]);
      roost.push((a) => { const p = seat(a, yt, ft, lt); return [(p[0] + tip[0]) / 2, (yt + tip[1]) / 2, (p[2] + tip[2]) / 2]; }); }
    // low rocks off its feet, where the swell breaks: four to a stack, by its own bearings
    for (let q = 0; q < 4; q++) { const a = q * 1.7 + si * 0.9 + 0.4, d = k.r * (1.55 + 0.5 * ((q * 3 + si) % 3) / 2), rr = 1.5 + 0.7 * ((q + si) % 3), x = k.x + Math.cos(a) * d, z = k.z + Math.sin(a) * d;
      m.col(WET, 1.1).set({ surf: SURF.ROCK, lamp: 0 }).post(x, z, -2, 0.5, rr * 1.25, rr, 6, { open: true, aoLow: 0.85 });
      m.col(TIDE, 0.95).post(x, z, 0.5, 1.3 + 0.5 * (q % 2), rr, rr * 0.5, 6, { aoLow: 0.8 }); }
  });
  const mesh = new THREE.Mesh(m.geometry(), world.stone); mesh.name = 'skerry'; world.scene.add(mesh); world.skerry = ledges; world.skerryRoost = roost;
}
function buildSurf(world) {
  const pos = [], uvs = [], idx = []; let run = 0;
  const strip = (a, b, wide, back) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, cnt = Math.max(1, Math.round(l / 4));
    for (let k = 0; k < cnt; k++) { const base = pos.length / 3;
      for (const t of [k / cnt, (k + 1) / cnt]) for (const v of [0, 1]) { const off = -back + (wide + back) * v; pos.push(a[0] + dx * t + nx * off, 0.3, a[1] + dz * t + nz * off); uvs.push(run + l * t, v); }
      idx.push(base, base + 1, base + 3, base, base + 3, base + 2); }
    run += l; };
  for (let i = 0; i < COAST.length - 1; i++) { const a = COAST[i], b = COAST[i + 1]; if (a[1] === QUAY.z1 && b[1] <= QUAY.z1 + 2 && a[0] >= QUAY.x0 && b[0] <= QUAY.x1 + 12) continue; strip(a, b, 8, 2.5); }
  strip([QUAY.x0, QUAY.z1 + 0.2], [QUAY.x1, QUAY.z1 + 0.2], 2.4, 0);
  const J = JETTY; strip([J.x0, J.z1], [J.x1, J.z1], 2.4, 0); strip([J.x1, J.z1], [J.x1, J.z0], 2.4, 0); strip([J.x0, J.z0], [J.x0, J.z1], 2.4, 0);
  const { cl, off } = world.mole;
  for (let i = 0; i < cl.length - 1; i++) { strip(off(cl[i], -MOLE.hw), off(cl[i + 1], -MOLE.hw), 2.4, 0); strip(off(cl[i + 1], MOLE.hw), off(cl[i], MOLE.hw), 3.2, 0); }
  // round each stack of the skerry, where the swell breaks on it
  for (const k of SKERRY) for (let i = 0; i < 8; i++) { const a0 = -i / 8 * TAU, a1 = -(i + 1) / 8 * TAU, rr = k.r * 1.12; strip([k.x + Math.cos(a0) * rr, k.z + Math.sin(a0) * rr], [k.x + Math.cos(a1) * rr, k.z + Math.sin(a1) * rr], 6, 0.6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: world.light.uTime, uCol: { value: new THREE.Color('#B4C2D8') }, uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } },
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uTime, uFogD; uniform vec3 uCol, uFogC; varying vec2 vUv; varying vec3 vW;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){ float v = clamp(vUv.y, 0., 1.), u = vUv.x;
        float lap = .5 + .5 * sin(uTime * .8 + 6.283 * vn(vec2(u * .045, 3.))), front = .3 + .5 * lap;
        float line = smoothstep(front + .16, front, v) * smoothstep(front - .5, front - .04, v);
        float broken = smoothstep(.3, .7, vn(vec2(u * .32, v * 2.5 - uTime * .12)) * .65 + .35 * vn(vec2(u * 1.3 + uTime * .05, v * 7.)));
        float a = (line * .85 + .3 * smoothstep(0., .25, v) * (1. - v)) * broken * smoothstep(1., .8, v);
        if (a < .01) discard;
        float dist = length(vW - cameraPosition); gl_FragColor = vec4(mix(uFogC, uCol, exp(-pow(uFogD * dist, 2.))), a * .9); }`,
    transparent: true, depthWrite: false });
  const surf = new THREE.Mesh(g, mat); surf.name = 'surf'; surf.renderOrder = 3; world.scene.add(surf);
}

// an upright wall between two plan points a to b ([x, z]); it faces to the right of a-to-b turned a quarter left: (-dz, dx)
function wall(m, a, b, y0, y1, o = {}) { return m.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], o); }
// a level floor over a plan quad a b c d (counter-clockwise seen from above: a to b east, a to d north)
function floor(m, a, b, c, d, y, o = {}) { return m.quad([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], o); }

// ================================================================ the harbour works: quay, jetty, mole, beacon
async function buildWorks(ctx, world, town) {
  const m = makeMason(), Q = QUAY, STONE = PAL.stone, wetLow = 0.45;
  m.set({ lamp: LAMP_BAKE });
  // ---- the quay: flags from the edge back under the front row, a stone face down into the water, a paler coping
  m.col(PAL.flags).set({ surf: SURF.FLAGS });
  floor(m, [Q.x0, Q.z1], [Q.x1, Q.z1], [Q.x1, 158.6], [Q.x0, 158.6], Q.y, { sub: 4, ao: 0.95 });
  m.col(STONE, 0.9).set({ surf: SURF.STONE });
  wall(m, [Q.x0, Q.z1], [Q.x1, Q.z1], -4, Q.y - 0.5, { ao: [wetLow, wetLow, 1, 1], uv: [0, 0] });
  wall(m, [Q.x0, 158.6], [Q.x0, Q.z1], -4, Q.y, { ao: [wetLow, wetLow, 1, 1] }); wall(m, [Q.x1, Q.z1], [Q.x1, 158.6], -4, Q.y, { ao: [wetLow, wetLow, 1, 1] });
  m.col(STONE, 1.12); wall(m, [Q.x0, Q.z1 + 0.15], [Q.x1, Q.z1 + 0.15], Q.y - 0.5, Q.y + 0.05, { uv: [7, 0] });
  floor(m, [Q.x0, Q.z1 + 0.15], [Q.x1, Q.z1 + 0.15], [Q.x1, Q.z1 - 1.2], [Q.x0, Q.z1 - 1.2], Q.y + 0.05, { uv: [3, 0] });
  // two flights of stone steps down into the water, lying along the quay's face (west of x -20 and east of x 40)
  for (const [x0, dir] of [[-20, -1], [40, 1]]) for (let i = 0; i < 11; i++) {
    const xa = x0 + dir * i * 0.95, xb = xa + dir * 0.95, y = Q.y - i * 0.5, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    m.col(STONE, 0.95 - 0.03 * i).set({ surf: SURF.STONE });
    m.box(lo, -4, Q.z1, hi, y, Q.z1 + 3, { no: 'nb', aoLow: wetLow, aoHigh: 0.55 + 0.45 * smoothstep(0, 1.5, y) });
  }
  // nine bollards along the edge
  for (let i = 0; i < 9; i++) {
    const x = Q.x0 + 9 + i * (Q.x1 - Q.x0 - 18) / 8;
    m.col(PAL.iron, 1.3).set({ surf: SURF.PLAIN }).post(x, Q.z1 - 1.5, Q.y, Q.y + 2.0, 0.52, 0.4, 8, { aoLow: 0.6 }); m.post(x, Q.z1 - 1.5, Q.y + 2.0, Q.y + 2.4, 0.62, 0.5, 8, {});
  }
  // ---- the west jetty: 7 m wide, from the quay's west end 16 m out
  const J = JETTY;
  m.col(PAL.flags, 0.95).set({ surf: SURF.FLAGS }); floor(m, [J.x0, J.z1], [J.x1, J.z1], [J.x1, J.z0], [J.x0, J.z0], J.y, {});
  m.col(STONE, 0.85).set({ surf: SURF.STONE });
  wall(m, [J.x0, J.z1], [J.x1, J.z1], -4, J.y, { ao: [wetLow, wetLow, 1, 1] }); wall(m, [J.x0, J.z0], [J.x0, J.z1], -4, J.y, { ao: [wetLow, wetLow, 1, 1] }); wall(m, [J.x1, J.z1], [J.x1, J.z0], -4, J.y, { ao: [wetLow, wetLow, 1, 1] });
  await ctx.yield();
  // ---- the mole: 8 m wide, curving from the quay's east end to its round head, a parapet on its sea side
  const curve = new THREE.CatmullRomCurve3(MOLE.line.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal'), NS = 22, cl = [];
  for (let i = 0; i <= NS; i++) { const q = curve.getPointAt(i / NS), t = curve.getTangentAt(i / NS); cl.push({ x: q.x, z: q.z, ex: t.z, ez: -t.x }); }
  const off = (c, k) => [c.x + c.ex * k, c.z + c.ez * k];
  for (let i = 0; i < NS; i++) {
    const a = cl[i], b = cl[i + 1], hw = MOLE.hw, uu = i * 5.3;
    m.col(PAL.flags, 0.92).set({ surf: SURF.FLAGS }); floor(m, off(b, -hw), off(b, hw - 1.2), off(a, hw - 1.2), off(a, -hw), MOLE.y, { uv: [0, uu] });
    m.col(STONE, 0.86).set({ surf: SURF.STONE });
    wall(m, off(a, -hw), off(b, -hw), -5, MOLE.y, { ao: [wetLow, wetLow, 1, 1], uv: [uu, 0] });
    wall(m, off(b, hw), off(a, hw), -5, MOLE.parapet, { ao: [wetLow, wetLow, 1, 1], uv: [uu, 0] });
    wall(m, off(a, hw - 1.2), off(b, hw - 1.2), MOLE.y, MOLE.parapet, { ao: [0.6, 0.6, 1, 1], uv: [uu, 3] });
    m.col(STONE, 1.05); floor(m, off(b, hw - 1.2), off(b, hw), off(a, hw), off(a, hw - 1.2), MOLE.parapet, { uv: [uu, 0] });
    // iron mooring rings on the inner face, one to each second length
    if (i % 2 === 1 && i < NS - 1) { const q = off(a, -hw - 0.12); m.col(PAL.iron).set({ surf: SURF.PLAIN }).box(q[0] - 0.25, MOLE.y - 1.7, q[1] - 0.25, q[0] + 0.25, MOLE.y - 0.9, q[1] + 0.25, {}); }
  }
  // the round head and THE BEACON on it: an unlit tapering stone tower with an open iron cage and a cold cresset; no flame
  const B = BEACON, y0 = MOLE.y, yT = y0 + B.h;
  m.col(STONE, 0.88).set({ surf: SURF.STONE }).post(B.x, B.z, -5, MOLE.y, 6.4, 6.4, 18, { aoLow: wetLow });
  m.col(STONE, 0.2).post(B.x, B.z, y0, y0 + 1.2, B.r + 0.9, B.r + 0.7, 14, { aoLow: 0.7 });   // the beacon is of dark stone
  m.post(B.x, B.z, y0 + 1.2, yT - 4.2, B.r, B.r * 0.74, 14, { aoLow: 0.8, aoHigh: 1 });
  m.col(STONE, 0.28).post(B.x, B.z, yT - 4.2, yT - 3.7, B.r * 0.74 + 0.55, B.r * 0.74 + 0.55, 14, {});
  m.col(PAL.iron, 1.2).set({ surf: SURF.PLAIN });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, cx = B.x + Math.cos(a) * 1.75, cz = B.z + Math.sin(a) * 1.75; bar(m, [cx, yT - 3.7, cz], [cx, yT - 0.9, cz], 0.09, {}); bar(m, [cx, yT - 0.9, cz], [B.x, yT, B.z], 0.07, {}); }
  for (const yy of [yT - 2.6, yT - 0.9]) for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU; bar(m, [B.x + Math.cos(a0) * 1.75, yy, B.z + Math.sin(a0) * 1.75], [B.x + Math.cos(a1) * 1.75, yy, B.z + Math.sin(a1) * 1.75], 0.07, {}); }
  m.post(B.x, B.z, yT - 3.7, yT - 3.0, 0.5, 1.15, 10, { open: true }); m.post(B.x, B.z, yT - 3.0, yT - 2.8, 1.15, 1.2, 10, {});
  world.works = m; world.mole = { cl, off };
}

// ================================================================ a house on a four-cornered plan
// fp: A front-left, B front-right, C back-right, D back-left in plan [x, z] (left and right as seen from the street before
// it). o: g the ground at the foot, wallTop the wall's head, ridge, ov the eave overhang, storeys, wallCol, shut (shutter
// albedo), stacks ['A' | 'B' ...] the gable ends that carry a chimney, sub (cut walls and roof for the lamp's bake), lamp.
// Returns what the world needs of it: its solid as planes (for the lamp's rays), its chimney tops, its highest point.
function house(m, fp, o, fixed) {
  const [A, B, C, D] = fp, g = o.g, wt = o.wallTop, rd = o.ridge, ov = o.ov ?? 0.9, vg = 0.5, lamp = o.lamp ?? LAMP_BAKE, sub = o.sub ?? 3.4;
  const fw = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / fw, uz = (B[1] - A[1]) / fw, nx = -uz, nz = ux;
  // THE ROOF'S FRAME (a rule of the form, o.form): the ridge runs along the front with the eaves over front and back; on a
  // house whose GABLE IS TURNED TO THE STREET the same roof lies on the plan turned a quarter (the eaves over the two
  // sides); a HIPPED roof slopes at its two ends too, its ridge shorter by the roof's own half span at each; a LEAN-TO
  // has one slope, from its front eave up to its back wall's head
  const gf = o.form === 'gable', hip = o.form === 'hip', mono = o.form === 'lean';
  const [Ra, Rb, Rc, Rd] = gf ? [B, C, D, A] : fp, rw = Math.hypot(Rb[0] - Ra[0], Rb[1] - Ra[1]), rux = (Rb[0] - Ra[0]) / rw, ruz = (Rb[1] - Ra[1]) / rw, rnx = -ruz, rnz = rux;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], RL = mono ? Rd : mid(Ra, Rd), RR = mono ? Rc : mid(Rb, Rc);
  const hd = Math.hypot(Rd[0] - Ra[0], Rd[1] - Ra[1]) / (mono ? 1 : 2), slope = (rd - wt) / hd, ey = wt - ov * slope, hipL = hip ? Math.min(hd, rw / 2 - 0.8) : 0, vge = hip ? ov : vg;
  // shade by place: under the eaves, at the foot, and (o.street) deeper down a stepped street than at its roofs
  const aoW = (y) => Math.min(1, 0.52 + 0.48 * (wt - y) / 2.4) * (0.72 + 0.28 * Math.min(1, (y - g) / 1.8)) * (o.street ? 0.66 + 0.34 * clamp((y - g) / (wt - g), 0, 1) : 1);
  const bands = (a, b, uv0) => { [[o.base ?? g - 2.5, g + 1.5], [g + 1.5, wt - 2.4], [wt - 2.4, wt]].forEach(([y0, y1], k) => {
    if (k === 0) m.col(PAL.stone, 0.78).set({ surf: SURF.STONE }); else m.col(o.wallCol).set({ surf: o.wallSurf ?? SURF.LIME });       // a plinth of bare stone
    wall(m, a, b, y0, y1, { sub, lamp, uv: [uv0, y0 - g], ao: [aoW(Math.max(g, y0)), aoW(Math.max(g, y0)), aoW(y1), aoW(y1)] }); }); };
  bands(A, B, A[0] * 0.7 + A[1]); bands(B, C, B[0] + 31); bands(C, D, C[0] + 57); bands(D, A, D[0] + 83);
  m.col(o.wallCol).set({ surf: o.wallSurf ?? SURF.LIME });
  if (mono) { m.tri([Rb[0], wt, Rb[1]], [Rc[0], wt, Rc[1]], [Rc[0], rd, Rc[1]], { ao: [0.72, 0.72, 0.6], lamp: [lamp, lamp, lamp] }); m.tri([Rd[0], wt, Rd[1]], [Ra[0], wt, Ra[1]], [Rd[0], rd, Rd[1]], { ao: [0.72, 0.72, 0.6], lamp: [lamp, lamp, lamp] });
    wall(m, Rc, Rd, wt, rd, { lamp, ao: 0.8 }); }
  else if (!hip) { m.tri([Rb[0], wt, Rb[1]], [Rc[0], wt, Rc[1]], [RR[0], rd, RR[1]], { ao: [0.72, 0.72, 0.6], lamp: [lamp, lamp, lamp] });
    m.tri([Rd[0], wt, Rd[1]], [Ra[0], wt, Ra[1]], [RL[0], rd, RL[1]], { ao: [0.72, 0.72, 0.6], lamp: [lamp, lamp, lamp] }); }
  // the roof: slate slopes with eave and verge overhang, a soffit under each eave
  const push = (p, kn, ku) => [p[0] + rnx * kn + rux * ku, p[1] + rnz * kn + ruz * ku];
  const eA = push(Ra, ov, -vge), eB = push(Rb, ov, vge), eC = push(Rc, -ov, vge), eD = push(Rd, -ov, -vge), rL = push(RL, 0, hip ? hipL : -vg), rR = push(RR, 0, hip ? -hipL : vg);
  m.col(o.roofCol ?? PAL.slate, o.roofK ?? 1).set({ surf: SURF.SLATE });
  m.quad([eA[0], ey, eA[1]], [eB[0], ey, eB[1]], [rR[0], rd, rR[1]], [rL[0], rd, rL[1]], { sub, lamp, uv: [Ra[0] * 1.3, 0] });
  if (!mono) m.quad([eC[0], ey, eC[1]], [eD[0], ey, eD[1]], [rL[0], rd, rL[1]], [rR[0], rd, rR[1]], { sub, lamp, uv: [Rc[0] * 1.3 + 9, 0] });
  if (hip) { m.tri([eB[0], ey, eB[1]], [eC[0], ey, eC[1]], [rR[0], rd, rR[1]], { lamp: [lamp, lamp, lamp] }); m.tri([eD[0], ey, eD[1]], [eA[0], ey, eA[1]], [rL[0], rd, rL[1]], { lamp: [lamp, lamp, lamp] }); }
  m.col(PAL.stone, 0.55).set({ surf: SURF.PLAIN });
  m.quad([eB[0], ey, eB[1]], [eA[0], ey, eA[1]], [Ra[0] - rux * vg, wt, Ra[1] - ruz * vg], [Rb[0] + rux * vg, wt, Rb[1] + ruz * vg], { ao: 0.5, lamp });
  if (!mono) m.quad([eD[0], ey, eD[1]], [eC[0], ey, eC[1]], [Rc[0] + rux * vg, wt, Rc[1] + ruz * vg], [Rd[0] - rux * vg, wt, Rd[1] - ruz * vg], { ao: 0.5, lamp });
  // a lead gutter under the front eave's edge and a downpipe from it to the wall and down the eave wall's end to the ground:
  // every house of two storeys and more alike (a rule of the roof, no draw)
  if ((o.storeys ?? 2) >= 2) { const gA = push(Ra, ov + 0.12, -vg), gB = push(Rb, ov + 0.12, vg), d0 = push(Ra, ov + 0.12, 0.7), d1 = push(Ra, 0.2, 0.7), gy = ey - 0.14;
    m.col(PAL.lead, 1.25).set({ surf: SURF.PLAIN }); bar(m, [gA[0], gy, gA[1]], [gB[0], gy, gB[1]], 0.17, { lamp, ao: 0.75 });
    bar(m, [d0[0], gy - 0.1, d0[1]], [d1[0], gy - 0.2 - ov * 0.8, d1[1]], 0.11, { lamp, ao: 0.7 }); bar(m, [d1[0], gy - 0.2 - ov * 0.8, d1[1]], [d1[0], g, d1[1]], 0.11, { lamp, ao: 0.8 }); }
  // ---- the front's dress: a door under a glazed fanlight, and at every bay of every storey a window in a stone surround:
  // two closed plank leaves under a top light of glass. EVERY THING THAT STANDS OFF THE WALL THROWS ITS SHADE ALONG THE WALL
  // AWAY FROM THE LAST LIGHT (paint on the wall, by the wall's own facing): a thing k metres proud of a wall whose normal
  // makes L.n with the light shades k (L.u / L.n) along it and k (L.y / L.n) down; walls turned from the light have none.
  const Ln = KEY_DIR[0] * nx + KEY_DIR[2] * nz, Lu = KEY_DIR[0] * ux + KEY_DIR[2] * uz, facesKey = Ln > 0.1;
  const shU = facesKey ? clamp(-Lu / Ln, -3, 3) : 0, shY = facesKey ? Math.min(0.6, KEY_DIR[1] / Ln) : 0, uv0 = A[0] * 0.7 + A[1], SH = 0.85;
  const nb = Math.max(2, Math.round(fw / 5.6)), bw = fw / nb, doorDraw = Math.floor(fixed() * nb), doorBay = o.outStair ? (o.outStair > 0 ? 0 : nb - 1) : doorDraw, loftBay = nb - 1 - doorBay, at = (u, k) => [A[0] + ux * u + nx * k, A[1] + uz * u + nz * k];
  const P3 = (u, y, k) => { const q = at(u, k); return [q[0], y, q[1]]; };
  const face = (u0, u1, y0, y1, k, o2 = {}) => m.quad(P3(u0, y0, k), P3(u1, y0, k), P3(u1, y1, k), P3(u0, y1, k), { lamp, ...o2 });
  // the wall's own stuff again, 2.5 cm proud of it, carrying the shade at its four corners
  const patch = (u0, u1, y0, y1, sh) => { const a0 = Math.max(0, u0), a1 = Math.min(fw, u1); if (a1 - a0 < 0.03 || y1 - y0 < 0.03) return;
    m.col(o.wallCol).set({ surf: o.wallSurf ?? SURF.LIME }); face(a0, a1, y0, y1, 0.025, { sh, uv: [uv0 + a0, y0 - g], ao: [aoW(y0), aoW(y0), aoW(y1), aoW(y1)] }); };
  const shade = (u0, u1, y0, y1, k) => { if (!facesKey) return; const du = 1.5 * k * shU, dy = 1.5 * k * shY;
    if (du > 0.03) patch(u1, u1 + du, y0, y1, [SH, 0, 0, SH]); else if (du < -0.03) patch(u0 + du, u0, y0, y1, [0, SH, SH, 0]);
    if (dy > 0.03) patch(u0 + Math.min(0, du), u1 + Math.max(0, du), y0 - dy, y0, [0, 0, SH, SH]); };
  // a slab standing k proud of the wall: its face and, as asked, its two cheeks (l, r), its top (t) and its underside (b)
  const slab = (u0, u1, y0, y1, k, col, surf, parts) => { m.col(col[0], col[1]).set({ surf });
    face(u0, u1, y0, y1, k, { ao: 0.95, uv: [u0 * 3.1 + A[0], y0] });
    const a0 = at(u0, 0), a1 = at(u0, k), b0 = at(u1, 0), b1 = at(u1, k);
    if (parts.includes('l')) wall(m, a0, a1, y0, y1, { lamp, ao: 0.8 });
    if (parts.includes('r')) wall(m, b1, b0, y0, y1, { lamp, ao: 0.8 });
    if (parts.includes('t')) m.quad([a1[0], y1, a1[1]], [b1[0], y1, b1[1]], [b0[0], y1, b0[1]], [a0[0], y1, a0[1]], { lamp, ao: 1 });
    if (parts.includes('b')) m.quad([a0[0], y0, a0[1]], [b0[0], y0, b0[1]], [b1[0], y0, b1[1]], [a1[0], y0, a1[1]], { lamp, ao: 0.5 }); };
  const STN = SURF.STONE;
  // THE DOOR: tarred planks in a stone surround under a glazed fanlight; a worn step; over some a slate hood on two brackets,
  // a hand thick, whose shade lies long on the wall beside it
  const doorInto = (uc, low) => {
    const D0 = uc - 1.5, D1 = uc + 1.5, dTop = g + (low ? 4.5 : 5.5), fTop = dTop + (low ? 0 : 1), dk = 1.3 + 0.4 * fixed(), hooded = fixed() < 0.6;
    m.col(PAL.tar, dk).set({ surf: SURF.WOOD }); face(D0, D1, g, dTop, 0.06, { ao: [0.7, 0.7, 0.92, 0.92], uv: [D0 * 3.1 + A[0], g] });
    m.col(PAL.iron, 1.2).set({ surf: SURF.PLAIN }); for (const hy of [g + 1.1, g + 4.3]) face(D0 + 0.08, D0 + 1.9, hy, hy + 0.15, 0.08, {});
    slab(D0 - 0.4, D0, g, fTop, 0.22, [PAL.stone, 1.0], STN, 'l'); slab(D1, D1 + 0.4, g, fTop, 0.22, [PAL.stone, 1.0], STN, 'r');
    if (!low) { slab(D0, D1, dTop, dTop + 0.16, 0.14, [PAL.tar, dk * 0.9], SURF.WOOD, '');
      m.col(PAL.glass).set({ surf: SURF.PANE }); face(D0, D1, dTop + 0.16, fTop, 0.05, { uv: [D0 + A[0] * 1.7, g] });
      m.col(PAL.tar, dk).set({ surf: SURF.PLAIN }); for (const f of [0.25, 0.5, 0.75]) face(D0 + 3 * f - 0.04, D0 + 3 * f + 0.04, dTop + 0.16, fTop, 0.08, {}); }
    slab(D0 - 0.55, D1 + 0.55, fTop, fTop + 0.6, 0.26, [PAL.stone, 0.95], STN, 'lrb');
    shade(D0 - 0.4, D1 + 0.4, g, fTop, 0.22); shade(D0 - 0.55, D1 + 0.55, fTop, fTop + 0.6, 0.26);
    if (hooded && !low) {
      const h0 = uc - 2.4, h1 = uc + 2.4, hk = 1.6, yb = g + 7.35, yf = yb + 0.24, yw = yb + 0.95;
      m.col(PAL.slate, 0.95).set({ surf: SURF.SLATE }); m.quad(P3(h0, yf, hk), P3(h1, yf, hk), P3(h1, yw, 0), P3(h0, yw, 0), { lamp, uv: [h0, 0] });
      m.col(PAL.oak, 0.8).set({ surf: SURF.WOOD }); face(h0, h1, yb, yf, hk, { ao: 0.95 });
      m.quad(P3(h0, yb, 0), P3(h0, yb, hk), P3(h0, yf, hk), P3(h0, yw, 0), { lamp, ao: 0.85 }); m.quad(P3(h1, yb, hk), P3(h1, yb, 0), P3(h1, yw, 0), P3(h1, yf, hk), { lamp, ao: 0.85 });
      m.col(PAL.oak, 0.6); m.quad(P3(h0, yb, 0), P3(h1, yb, 0), P3(h1, yb, hk), P3(h0, yb, hk), { lamp, ao: 0.5 });
      // two brackets under it, each a plank on edge
      for (const bu of [h0 + 0.4, h1 - 0.4]) { m.col(PAL.oak, 0.7);
        m.quad(P3(bu - 0.08, yb - 1.4, 0.03), P3(bu - 0.08, yb, 0.03), P3(bu - 0.08, yb, 1.3), P3(bu - 0.08, yb - 0.2, 1.3), { lamp, ao: 0.7 });
        m.quad(P3(bu + 0.08, yb - 0.2, 1.3), P3(bu + 0.08, yb, 1.3), P3(bu + 0.08, yb, 0.03), P3(bu + 0.08, yb - 1.4, 0.03), { lamp, ao: 0.7 });
        m.quad(P3(bu - 0.08, yb - 1.4, 0.03), P3(bu - 0.08, yb - 0.2, 1.3), P3(bu + 0.08, yb - 0.2, 1.3), P3(bu + 0.08, yb - 1.4, 0.03), { lamp, ao: 0.6 }); }
      shade(h0, h1, yb, yw, hk);
    }
    m.col(PAL.stone, 1.05).set({ surf: SURF.FLAGS }); const s0 = at(uc - 2.2, 0), s1 = at(uc + 2.2, 1.3);
    if (Math.abs(ux * uz) < 0.02) m.box(Math.min(s0[0], s1[0]), g - 0.4, Math.min(s0[1], s1[1]), Math.max(s0[0], s1[0]), g + 0.45, Math.max(s0[1], s1[1]), { no: 'b', lamp, aoLow: 0.7 });
  };
  // AN OUTSIDE STAIR (o.outStair, on a front that lies along the rows): a flight of stone steps up the front from beside the
  // door's end to a landing before a plank door on the first floor, solid under its treads
  const loftDoor = (uc, fy) => { const D0 = uc - 1.4, D1 = uc + 1.4, top = fy + 5.0, dirn = o.outStair > 0 ? -1 : 1, K = 2.2, NS = 12, rise = 9 / NS, tread = Math.min(1.05, (fw - 2 * bw) / NS + 0.25);
    m.col(PAL.tar, 1.45).set({ surf: SURF.WOOD }); face(D0, D1, fy, top, 0.06, { ao: [0.75, 0.75, 0.92, 0.92], uv: [D0 * 3.1 + A[0], fy] });
    slab(D0 - 0.4, D0, fy, top, 0.22, [PAL.stone, 1.0], STN, 'l'); slab(D1, D1 + 0.4, fy, top, 0.22, [PAL.stone, 1.0], STN, 'r'); slab(D0 - 0.55, D1 + 0.55, top, top + 0.6, 0.26, [PAL.stone, 0.95], STN, 'lrb');
    const block = (u0, u1, y1) => { const a = at(Math.min(u0, u1), 0), b = at(Math.max(u0, u1), K); m.box(Math.min(a[0], b[0]), g - 0.4, Math.min(a[1], b[1]), Math.max(a[0], b[0]), y1, Math.max(a[1], b[1]), { no: 'b', lamp, aoLow: 0.6, aoHigh: 0.95, uv: [u0 * 1.9, 0] }); };
    m.col(PAL.stone, 0.92).set({ surf: SURF.STONE }); block(uc - 2.1, uc + 2.1, fy);
    for (let i = 0; i < NS - 1; i++) { const u0 = uc + dirn * (2.1 + i * tread); m.col(PAL.stone, 0.86 + 0.1 * ((i * 5) % 3) / 3); block(u0, u0 + dirn * tread, fy - (i + 1) * rise); }
    shade(uc - 2.1, uc + 2.1, g, fy, K); };
  for (let st = 0; st < o.storeys; st++) for (let b = 0; b < nb; b++) {
    const uc = (b + 0.5) * bw, fy = g + st * 9;
    const room = wt - fy; if (room < 5.9) continue;
    if (st === 0 && b === doorBay && !o.noDoor) { doorInto(uc, room < 7.6); continue; }
    if (o.outStair && st === 1 && b === loftBay) { loftDoor(uc, fy); continue; }
    // a low storey (a net loft, a shed) has a low window
    const low = room < 8.2, ww = 2.7, wy = fy + (low ? 1.9 : 2.6), lh = low ? 2.4 : 3.6, top = wy + lh + (low ? 0.8 : 1.0), tone = 0.8 + 0.35 * fixed(), L0 = uc - ww / 2, L1 = uc + ww / 2;
    slab(L0 - 0.34, L0, wy, top, 0.2, [PAL.stone, 1.0], STN, 'l'); slab(L1, L1 + 0.34, wy, top, 0.2, [PAL.stone, 1.0], STN, 'r');
    slab(L0 - 0.5, L1 + 0.5, top, top + 0.55, 0.24, [PAL.stone, 0.95], STN, 'lrb');
    slab(L0 - 0.5, L1 + 0.5, wy - 0.45, wy, 0.38, [PAL.stone, 1.05], STN, 'lrt');
    // damp below the sill: the wall's own wash, darkest close under the stone and gone a metre and a half down
    { const y1 = wy - 0.45, y0 = y1 - 1.6; m.col(o.wallCol, 0.94).set({ surf: o.wallSurf ?? SURF.LIME }); face(L0 - 0.3, L1 + 0.3, y0, y1, 0.02, { uv: [uv0 + L0 - 0.3, y0 - g], ao: [aoW(y0), aoW(y0), 0.55 * aoW(y1), 0.55 * aoW(y1)] }); }
    // two closed plank leaves, each a little out of true, two iron straps to each; a rail over them
    for (const sd of [0, 1]) { const u0 = sd ? uc + 0.03 : L0, u1 = sd ? L1 : uc - 0.03, k = 0.09 + 0.07 * fixed();
      m.col(o.shut, tone * (0.9 + 0.2 * fixed())).set({ surf: SURF.WOOD }); face(u0, u1, wy, wy + lh, k, { ao: 0.92, uv: [u0 * 3.1 + A[0], wy] });
      m.col(PAL.iron, 1.2).set({ surf: SURF.PLAIN }); for (const hy of [wy + 0.55, wy + lh - 0.7]) face(u0 + 0.05, u1 - 0.05, hy, hy + 0.14, k + 0.02, {}); }
    slab(L0, L1, wy + lh, wy + lh + 0.16, 0.17, [o.shut, tone * 0.9], SURF.WOOD, '');
    // over the leaves a top light of old glass, three panes between two bars: it holds the sky it faces
    m.col(PAL.glass).set({ surf: SURF.PANE }); face(L0, L1, wy + lh + 0.16, top, 0.05, { uv: [L0 + A[0] * 1.7, wy] });
    m.col(o.shut, tone).set({ surf: SURF.PLAIN }); for (const f of [1 / 3, 2 / 3]) face(L0 + ww * f - 0.04, L0 + ww * f + 0.04, wy + lh + 0.16, top, 0.08, {});
    shade(L0 - 0.34, L1 + 0.34, wy, top, 0.2); shade(L0 - 0.5, L1 + 0.5, wy - 0.45, wy, 0.38); shade(L0 - 0.5, L1 + 0.5, top, top + 0.55, 0.24);
  }
  // DORMERS (o.dormers: 1 over every bay, 2 over every other) on a roof whose eave is over the front: a low upright light
  // standing in the slope, its cheeks of the wall's stuff, a pane, a flat lead top running back into the slates
  if (o.dormers && !gf && !hip && !mono) for (let b = 0; b < nb; b++) { if (o.dormers === 2 && b % 2) continue;
    const uc = (b + 0.5) * bw, d0 = 1.0, hh = 2.3, w2 = 1.25, y0 = wt + slope * d0, y1 = y0 + hh, d1 = d0 + (hh + 0.3) / slope;
    m.col(o.wallCol, 0.95).set({ surf: o.wallSurf ?? SURF.LIME }); face(uc - w2, uc + w2, y0, y1, -d0, { ao: [0.8, 0.8, 0.7, 0.7] });
    m.tri(P3(uc - w2, y0, -d0), P3(uc - w2, y1, -d0), P3(uc - w2, y1, -d1), { ao: [0.75, 0.75, 0.75], lamp: [lamp, lamp, lamp] }); m.tri(P3(uc + w2, y0, -d0), P3(uc + w2, y1, -d1), P3(uc + w2, y1, -d0), { ao: [0.75, 0.75, 0.75], lamp: [lamp, lamp, lamp] });
    m.col(PAL.glass).set({ surf: SURF.PANE }); face(uc - 0.8, uc + 0.8, y0 + 0.5, y1 - 0.35, -d0 + 0.05, { uv: [uc + A[0] * 1.7, y0] });
    m.col(o.shut, 0.9).set({ surf: SURF.PLAIN }); face(uc - 0.05, uc + 0.05, y0 + 0.5, y1 - 0.35, -d0 + 0.08, {});
    m.col(PAL.lead, 1.1).set({ surf: SURF.PLAIN }); m.quad(P3(uc - w2 - 0.2, y1, -d0 + 0.3), P3(uc + w2 + 0.2, y1, -d0 + 0.3), P3(uc + w2 + 0.2, y1 + 0.3, -d1), P3(uc - w2 - 0.2, y1 + 0.3, -d1), { lamp, ao: 0.95 }); }
  // each gable: a shuttered light under the ridge and one to each storey beside the middle, a chimney breast under its stack
  if (!mono) [[Rb, Rc, 'B'], [Rd, Ra, 'A']].forEach(([p0, p1, end]) => { const gl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), gx = (p1[0] - p0[0]) / gl, gz = (p1[1] - p0[1]) / gl, px = -gz, pz = gx, gp = (k, w) => [p0[0] + gx * k + px * w, p0[1] + gz * k + pz * w];
    // (one shuttered light to a storey a quarter along the gable; a gable of 11 m and more has a second, two thirds along)
    for (let st = 0; st < o.storeys; st++) for (const fr of gl >= 11 ? [0.24, 0.66] : [0.24]) { const wy = g + st * 9 + 2.8, a0 = gp(gl * fr, 0.07), a1 = gp(gl * fr + 2.2, 0.07), s0 = gp(gl * fr - 0.25, 0.25), s1 = gp(gl * fr + 2.45, 0.25); if (wy + 4 > wt || (gf && end === 'A')) continue;
      m.col(o.shut, 0.8 + 0.3 * fixed()).set({ surf: SURF.WOOD }); wall(m, a0, a1, wy, wy + 3.6, { lamp, ao: 0.9 });
      m.col(PAL.stone, 1.02).set({ surf: SURF.STONE }); wall(m, s0, s1, wy - 0.42, wy, { lamp }); }
    if ((o.stacks || []).includes(end) && !hip) { const b0 = gp(gl / 2 - 1.0, 0.45), b1 = gp(gl / 2 + 1.0, 0.45), c0 = gp(gl / 2 - 1.0, 0), c1 = gp(gl / 2 + 1.0, 0);
      m.col(o.wallCol, 0.92).set({ surf: o.wallSurf ?? SURF.LIME }); wall(m, b0, b1, o.base ?? g - 2.5, rd - 0.6, { lamp, ao: [0.75, 0.75, 1, 1], uv: [3, 0] }); wall(m, c0, b0, o.base ?? g - 2.5, rd - 0.6, { lamp, ao: 0.8 }); wall(m, b1, c1, o.base ?? g - 2.5, rd - 0.6, { lamp, ao: 0.8 }); } });
  if (!hip && !mono) for (const [p0, p1] of [[Rb, Rc], [Rd, Ra]]) { const gl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), gx = (p1[0] - p0[0]) / gl, gz = (p1[1] - p0[1]) / gl, px = -gz, pz = gx, cx = (p0[0] + p1[0]) / 2 + px * 0.07, cz = (p0[1] + p1[1]) / 2 + pz * 0.07, y0 = wt - 1.2;
    m.col(PAL.glass).set({ surf: SURF.PANE }); wall(m, [cx - gx * 0.9, cz - gz * 0.9], [cx + gx * 0.9, cz + gz * 0.9], y0, y0 + 2.6, { lamp, ao: 0.9, uv: [cx, y0] });
    m.col(o.shut, 0.9).set({ surf: SURF.PLAIN }); wall(m, [cx - gx * 0.05 + px * 0.03, cz - gz * 0.05 + pz * 0.03], [cx + gx * 0.05 + px * 0.03, cz + gz * 0.05 + pz * 0.03], y0, y0 + 2.6, { lamp }); wall(m, [cx - gx * 0.9 + px * 0.03, cz - gz * 0.9 + pz * 0.03], [cx + gx * 0.9 + px * 0.03, cz + gz * 0.9 + pz * 0.03], y0 + 1.25, y0 + 1.35, { lamp });
    m.col(PAL.stone, 1.0).set({ surf: SURF.STONE }); wall(m, [cx - gx * 1.2 + px * 0.1, cz - gz * 1.2 + pz * 0.1], [cx + gx * 1.2 + px * 0.1, cz + gz * 1.2 + pz * 0.1], y0 - 0.4, y0, { lamp }); }
  { const q = at(0.5, 0.22), e0 = at(-vg, ov), e1 = at(fw + vg, ov); m.col(PAL.stone, 0.7).set({ surf: SURF.PLAIN }); bar(m, [q[0], g, q[1]], [q[0], wt - 0.3, q[1]], 0.11, { lamp, ao: 0.85 });
    if (!gf) bar(m, [e0[0], ey - 0.05, e0[1]], [e1[0], ey - 0.05, e1[1]], 0.1, { lamp, ao: 0.8 }); }
  // ---- chimneys on the ridge at the named gable ends, two pots each
  const tops = [];
  for (const end of o.stacks || []) {
    const r = end === 'A' ? push(RL, 0, hipL + 0.95) : end === 'B' ? push(RR, 0, -hipL - 0.95) : push(mid(RL, RR), 0, 0), top = o.stackTop ?? rd + 3.5;
    m.col(o.wallCol, 0.8).set({ surf: SURF.STONE }).box(r[0] - 0.95, rd - 1.5, r[1] - 0.95, r[0] + 0.95, top - 0.9, r[1] + 0.95, { no: 'b', lamp, aoLow: 0.75 });
    m.col(PAL.stone, 0.7).set({ surf: SURF.PLAIN }).box(r[0] - 1.1, top - 0.9, r[1] - 1.1, r[0] + 1.1, top - 0.65, r[1] + 1.1, { lamp });
    m.col(PAL.pot).post(r[0] - 0.45 * rux, r[1] - 0.45 * ruz, top - 0.65, top, 0.3, 0.24, 6, { lamp }); m.post(r[0] + 0.45 * rux, r[1] + 0.45 * ruz, top - 0.65, top - 0.1, 0.3, 0.24, 6, { lamp });
    tops.push([r[0], top, r[1]]);
  }
  // ---- the solid, as planes n.p <= d, for the lamp's rays: four walls and the roof's slopes (a hipped roof's two ends too)
  const planes = [], pl = (a, b) => { const lx = b[0] - a[0], lz = b[1] - a[1], l = Math.hypot(lx, lz), px = -lz / l, pz = lx / l; planes.push([px, 0, pz, px * a[0] + pz * a[1]]); };
  pl(A, B); pl(B, C); pl(C, D); pl(D, A);
  const rn = Math.hypot(slope, 1); planes.push([rnx * slope / rn, 1 / rn, rnz * slope / rn, (rnx * Ra[0] + rnz * Ra[1]) * slope / rn + wt / rn]);
  if (!mono) planes.push([-rnx * slope / rn, 1 / rn, -rnz * slope / rn, -(rnx * Rd[0] + rnz * Rd[1]) * slope / rn + wt / rn]);
  if (hip) { const s2 = (rd - wt) / hipL, r2 = Math.hypot(s2, 1); planes.push([rux * s2 / r2, 1 / r2, ruz * s2 / r2, (rux * Rb[0] + ruz * Rb[1]) * s2 / r2 + wt / r2], [-rux * s2 / r2, 1 / r2, -ruz * s2 / r2, -(rux * Ra[0] + ruz * Ra[1]) * s2 / r2 + wt / r2]); }
  return { planes, tops, top: Math.max(rd, ...tops.map((t) => t[1])), fp, g, wt, rd, ridge: [rL, rR], street: !!o.street, form: o.form || 'plain' };
}

// plan distance from a point to a four-cornered plan (0 inside it), whichever way its corners run
function planOff(fp, x, z) {
  let ar = 0; for (let i = 0; i < 4; i++) { const a = fp[i], b = fp[(i + 1) % 4]; ar += a[0] * b[1] - b[0] * a[1]; }
  let inside = true, best = Infinity; const sg = ar < 0 ? -1 : 1;
  for (let i = 0; i < 4; i++) { const a = fp[i], b = fp[(i + 1) % 4], ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez;
    if (sg * ((x - a[0]) * ez - (z - a[1]) * ex) > 0) inside = false; const t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / l2, 0, 1); best = Math.min(best, Math.hypot(a[0] + ex * t - x, a[1] + ez * t - z)); }
  return inside ? 0 : best;
}
// the gap in plan between two four-cornered plans (by their corners)
function planGap(P1, P2) { let b = Infinity; for (const c of P1) b = Math.min(b, planOff(P2, c[0], c[1])); for (const c of P2) b = Math.min(b, planOff(P1, c[0], c[1])); return b; }
// two convex plan quads overlap (separating axes on both quads' edges; touching counts as apart)
function quadsOverlap(Pq, Qq) {
  for (const poly of [Pq, Qq]) for (let i = 0; i < 4; i++) {
    const a = poly[i], b = poly[(i + 1) % 4], ax = -(b[1] - a[1]), az = b[0] - a[0];
    let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
    for (const v of Pq) { const t = v[0] * ax + v[1] * az; p0 = Math.min(p0, t); p1 = Math.max(p1, t); }
    for (const v of Qq) { const t = v[0] * ax + v[1] * az; q0 = Math.min(q0, t); q1 = Math.max(q1, t); }
    if (p1 <= q0 + 1e-6 || q1 <= p0 + 1e-6) return false;
  }
  return true;
}

// ================================================================ the town
async function buildTown(ctx, world, town) {
  const { path, M, ground: G } = world, rPaint = world.rngs.rPaint, houses = [], stacks = [], taken = [];
  const low = makeMason(), up = makeMason(), outStairs = [];
  const shut = () => linear(rPaint.pick(P.shutters));
  // THE DRESS of a house, from its own stream (named by its place in the order of building): its wash, its tone, its roof.
  // About half the houses are chalk white, the rest wear an old wash; a house takes the next wash of the list when a
  // neighbour (a house within 3 m of it in plan) already wears the one it drew. Slate in three greys; one roof in six of
  // old red-brown tile. (o.wash names a wash outright; a wall of bare stone has none.)
  const add = (m, fp, o) => { const dr = world.dressOf(houses.length), k = dr(), v = dr(), rk = dr(), tile = dr() < 1 / 6;
    let wi = o.wash ?? (k < 0.5 ? 0 : 1 + Math.min(WASHES.length - 2, Math.floor((k - 0.5) * 2 * (WASHES.length - 1))));
    if (o.wash === undefined) { const worn = houses.filter((h) => planGap(h.fp, fp) < 3).map((h) => h.wash); for (let t = 0; t < WASHES.length && worn.includes(wi); t++) wi = (wi + 1) % WASHES.length; }
    const bare = o.wallSurf === SURF.STONE, wallCol = bare ? linear(PAL.stone, 0.92 + 0.26 * v) : linear(WASHES[wi], 0.86 + 0.16 * v), roof = ROOFS[tile && !o.slate ? 3 : Math.floor(rk * 3)];
    // (SLATE BY HOUSE: no two quarries cut alike and no two roofs have weathered alike; a slate roof takes a cast of its
    // own, blue, lilac or green grey, and its own depth of tone, from a stream of its own by the house's place in the
    // order of building. The roofs of the last straight, named slate outright, keep the one slate they have.)
    const sl = world.dressOf('slate ' + houses.length), cast = linear(sl.pick(['#666A74', '#5C6779', '#6E6A7A', '#65706E', '#727078'])), depth = 0.9 + 0.24 * sl();
    const slated = roof !== ROOFS[3] && !o.slate, base = linear(roof[0]), roofCol = slated ? [base[0] + (cast[0] - base[0]) * 0.75, base[1] + (cast[1] - base[1]) * 0.75, base[2] + (cast[2] - base[2]) * 0.75] : roof[0];
    const h = house(m, fp, { roofCol, roofK: roof[1] * (slated ? depth : 1), ...o, wallCol, shut: shut() }, dr); h.wash = bare ? -1 : wi; h.dress = { wall: wallCol, roof: (Array.isArray(roofCol) ? roofCol : linear(roofCol)).map((v) => v * roof[1] * (slated ? depth : 1)) }; houses.push(h); taken.push(fp); for (const t of h.tops) stacks.push(t); return h; };
  // ---- THE NET STAIR's steps (89 of half a metre) along the line laid in makeStair
  const { at, side, stairY, SL } = world.stair, NSTEP = Math.round((STAIR.y1 - STAIR.y0) / 0.5), rise = (STAIR.y1 - STAIR.y0) / NSTEP;
  low.set({ lamp: LAMP_BAKE });
  for (let i = 0; i < NSTEP; i++) {
    const c0 = at(i * SL / NSTEP), c1 = at((i + 1) * SL / NSTEP), y = STAIR.y0 + (i + 1) * rise, hw = STAIR.hw + 0.3;
    low.col(PAL.flags, 0.92 + 0.12 * ((i * 7) % 5) / 5).set({ surf: SURF.FLAGS });
    floor(low, side(c0, -hw), side(c0, hw), side(c1, hw), side(c1, -hw), y, { sub: 3.6, uv: [0, i * 1.7], ao: [0.62, 0.62, 0.8, 0.8] });
    low.col(PAL.stone, 0.8).set({ surf: SURF.STONE }); wall(low, side(c0, -hw), side(c0, hw), y - rise, y, { ao: 0.6, uv: [i * 3.3, 0] });
    if (i % 3 === 2) await ctx.yield();
  }
  await ctx.yield();
  // the houses that wall the stair, two storeys, eave edges 17 m above the steps and 3.5 m from its middle; on the west
  // side of its first 30 m a garden wall stands in their place (the cat's walk)
  const NH = Math.round(SL / 9.6), DEP = 9, EAVE = 17, OV = 1.5, RS = 0.65, garden = [];
  for (const sg of [1, -1]) for (let k = 0; k < NH; k++) {
    const s0 = k * SL / NH, s1 = (k + 1) * SL / NH, c0 = at(s0), c1 = at(s1), yMid = stairY((s0 + s1) / 2);
    if (sg < 0 && s1 <= 31) { garden.push([c0, c1, s0, s1]); taken.push([side(c0, -STAIR.hw), side(c1, -STAIR.hw), side(c1, -STAIR.hw - DEP), side(c0, -STAIR.hw - DEP)]); continue; }
    const f0 = side(c0, sg * STAIR.hw), f1 = side(c1, sg * STAIR.hw), b0 = side(c0, sg * (STAIR.hw + DEP)), b1 = side(c1, sg * (STAIR.hw + DEP));
    const fp = sg > 0 ? [f1, f0, b0, b1] : [f0, f1, b1, b0], wt = yMid + EAVE + OV * RS, base = Math.min(stairY(s0) - 2, G.h(b0[0], b0[1]) - 1, G.h(b1[0], b1[1]) - 1);
    await ctx.yield();
    add(low, fp, { g: stairY(s0) + 0.5, base, wallTop: wt, ridge: wt + RS * DEP / 2, ov: OV, storeys: 2, street: true, stacks: town() < 0.6 ? [town() < 0.5 ? 'A' : 'B'] : [], noDoor: town() < 0.4 });
  }
  world.garden = garden;
  // the stair's own floor is taken too (no row house may stand in it)
  for (let k = 0; k < NH; k++) { const c0 = at(k * SL / NH), c1 = at((k + 1) * SL / NH); taken.push([side(c0, -STAIR.hw), side(c0, STAIR.hw), side(c1, STAIR.hw), side(c1, -STAIR.hw)]); }
  await ctx.yield();
  // ---- THE HOUSES ON THE SIGHT STRIP, placed by numbers (the same on every seed): each row a pair, its stack on the outer gable
  const rowHouse = (m, x0, x1, row, wt, rd, stacksAt, storeys, stackTop, extra = {}) => add(m, [[x0, row.z1], [x1, row.z1], [x1, row.z0], [x0, row.z0]],
    { g: row.g, wallTop: wt, ridge: rd, storeys, stacks: stacksAt, stackTop, ov: 0.8, ...extra });
  const STRIP = [
    [[-22, -2, 22.5, 28, ['A'], 2, 31.5], [-2, 20, 31.5, 37, ['B'], 3, 40.5]],
    [[-20, 2, 43, 48.5, ['A'], 3, 52], [2, 21, 34, 39.5, ['B'], 2, 43]],
    [[-21, -1, 46, 51.5, ['A'], 2, 55], [-1, 20, 45, 50.5, ['B'], 2, 54]],
    [[-19, 0, 46.5, 50.5, [], 1, 0, { noDoor: false, wallSurf: SURF.STONE }], [0, 15, 46.5, 50.5, [], 1, 0, { wallSurf: SURF.STONE }]],
  ];
  for (let r = 0; r < ROWS.length; r++) {
    const row = ROWS[r], m = low;
    await ctx.yield();
    for (const [x0, x1, wt, rd, st, storeys, stackTop, extra] of STRIP[r]) rowHouse(m, x0, x1, row, wt, rd, st, storeys, stackTop || undefined, extra || {});
    // the rest of the row, dealt by the layout's number: outward from the pair to the town's edge, leaving the stair free.
    // To each house a width, a depth, a lift, STOREYS (two to four on the two lower rows, two or three above), a FORM (a
    // narrow house may turn its gable to the bay; some are hipped), dormers on some plain roofs, on the quay's row an
    // outside stair up some wide fronts, and its stacks. THE RISE'S RULE then takes storeys off, and at need the stacks,
    // until the house stands under its cap. Where a row's end leaves room, a lean-to stands against its last gable.
    const zm = (row.z0 + row.z1) / 2;
    for (const dir of [-1, 1]) {
      let x = dir < 0 ? STRIP[r][0][0] : STRIP[r][1][1], last = null; const lim = dir < 0 ? -(G.westOf(zm) - 3) : G.eastOf(zm) - 3;
      for (let guard = 0; guard < 60 && dir * (lim - x) > 9; guard++) {
        let w = Math.min(14 + 8 * town(), dir * (lim - x)), placed = false; const sDraw = town(), dep = row.z1 - row.z0 - 2 * town(), lift = town(), fDraw = town(), dDraw = town(), oDraw = town(), pick = town();
        const want = r < 2 ? (sDraw < 0.3 ? 2 : sDraw < 0.76 ? 3 : 4) : sDraw < 0.5 ? 2 : 3;
        for (; w >= 9; w -= 2.5) {
          const xa = dir < 0 ? x - w : x, xb = dir < 0 ? x : x + w, fp = [[xa, row.z1], [xb, row.z1], [xb, row.z1 - dep], [xa, row.z1 - dep]];
          if (taken.some((q) => quadsOverlap(fp, q))) continue;
          const form = fDraw < 0.24 && w <= 17 ? 'gable' : fDraw < 0.4 ? 'hip' : 'plain', roofH = form === 'gable' ? 0.72 * w / 2 : 5.5;
          const st0 = form === 'gable' ? (pick < 0.7 ? ['B'] : []) : pick < 0.4 ? [dir < 0 ? 'A' : 'B'] : pick < 0.75 ? ['A', 'B'] : [dir < 0 ? 'B' : 'A'];
          const cap = world.riseCap(fp), topOf = (n, stk) => row.g + 9 * n + lift + roofH + (stk ? 3.5 : 0); let storeys = want;
          while (storeys > 2 && topOf(storeys, st0.length) > cap) storeys--;
          const wt = row.g + 9 * storeys + lift, stair = r === 0 && form !== 'gable' && w >= 17 && oDraw < 0.3 ? -dir : 0;
          last = add(m, fp, { g: row.g, wallTop: wt, ridge: wt + roofH, storeys, form, ov: 0.8, stacks: topOf(storeys, st0.length) > cap ? [] : st0, dormers: form === 'plain' && dDraw < 0.4 ? (dDraw < 0.2 ? 1 : 2) : 0, outStair: stair });
          if (stair) outStairs.push([xa, xb, row.z1, stair]);
          x += dir * w; placed = true; break;
        }
        if (!placed) x += dir * 2.5;
        await ctx.yield();
      }
      // a lean-to against the row's last gable, where 5 m and more are left to the town's edge
      const room = dir * (lim - x) + 3;
      if (last && room >= 5 && planGap(last.fp, [[x, row.z1], [x + dir * 0.1, row.z1], [x + dir * 0.1, row.z0], [x, row.z0]]) < 0.2) { const lw = Math.min(room, 7.5), z1 = row.z1 - 1.5, z0 = z1 - 8;
        const fp = dir < 0 ? [[x - lw, z0], [x - lw, z1], [x, z1], [x, z0]] : [[x + lw, z1], [x + lw, z0], [x, z0], [x, z1]];
        if (!taken.some((q) => quadsOverlap(fp, q)) && row.g + 9.6 <= world.riseCap(fp)) add(m, fp, { g: row.g, wallTop: row.g + 6.2, ridge: row.g + 9.4, storeys: 1, form: 'lean', ov: 0.6, stacks: [], noDoor: false, wallSurf: SURF.STONE, slate: true }); }
    }
  }
  await ctx.yield();
  world.town = { houses, stacks, taken, low, up, add, shut, outStairs };
  await buildUpperTown(ctx, world, town);
}

// ================================================================ the upper town: square, well, upper street, flank houses, tower
async function buildUpperTown(ctx, world, town) {
  const { low, up, add, shut, taken } = world.town, G = world.ground, S = SQUARE, ST = STREET, B = LAMP_BAKE;
  // ---- THE SQUARE: flags, the south parapet over the net lofts' yard (its top is the sight plane's foot), the well
  // (r5m1, M3: the square's flags, the landing and the treads are PAVE: the lamp on them is found in the stone's shader at
  // every point of the stone, by the rays from the window; no paint is baked on them)
  up.col(PAL.flags).set({ surf: SURF.PAVE, lamp: B });
  floor(up, [S.x0, S.z1], [S.x1, S.z1], [S.x1, S.z0], [S.x0, S.z0], S.y, { sub: 1.5, lamp: 0, ao: 0.95 });
  up.col(PAL.stone, 0.92).set({ surf: SURF.STONE }).box(S.x0, 37, S.z1, S.x1, S.parapet - 0.3, S.z1 + 0.8, { no: 'b', lamp: B, sub: 1.5, aoLow: 0.7, aoHigh: 1 });
  up.col(PAL.stone, 1.08).box(S.x0, S.parapet - 0.3, S.z1 - 0.15, S.x1, S.parapet, S.z1 + 0.95, { lamp: B, sub: 1.5 });
  await ctx.yield();
  const wx = WELL.x, wz = WELL.z;
  up.col(PAL.stone, 0.95).set({ surf: SURF.STONE }).post(wx, wz, S.y, S.y + 1.2, 2.3, 2.2, 14, { lamp: B, aoLow: 0.7 });
  up.col(PAL.glass, 0.7).set({ surf: SURF.GLASS }).post(wx, wz, S.y + 1.2, S.y + 1.21, 1.75, 1.75, 14, { lamp: B });
  up.col(PAL.stone, 1.0).set({ surf: SURF.STONE }).post(wx, wz, S.y + 1.2, S.y + 1.75, 0.55, 0.5, 8, { lamp: B }); up.post(wx, wz, S.y + 1.75, S.y + 2.0, 0.7, 0.3, 8, { lamp: B });
  up.col(PAL.lead, 1.2).set({ surf: SURF.PLAIN }); bar(up, [wx, S.y + 1.62, wz + 0.4], [wx, S.y + 1.58, wz + 1.15], 0.09, { lamp: B });
  world.well = { x: wx, z: wz + 1.15, y0: S.y + 1.56, y1: S.y + 1.21 };
  // ---- THE UPPER STREET: the house's landing and 24 broad shallow steps down to the square, cut fine for the lamp's paint
  const NS = 24, rise = (ST.y0 - ST.y1) / NS, run = (ST.z1 - ST.z0) / NS, tread = (i) => ST.y0 - (i + 1) * rise;
  up.col(PAL.flags, 1.0).set({ surf: SURF.PAVE }); floor(up, [-19, ST.z0], [19, ST.z0], [19, HOUSE.wall], [-19, HOUSE.wall], ST.y0, { sub: 1.25, lamp: 0, ao: 0.9 });
  for (let i = 0; i < NS; i++) {
    const z0 = ST.z0 + i * run, y = tread(i);
    up.col(PAL.flags, 0.94 + 0.1 * ((i * 5) % 4) / 4).set({ surf: SURF.PAVE }); floor(up, [-ST.hw, z0 + run], [ST.hw, z0 + run], [ST.hw, z0], [-ST.hw, z0], y, { sub: 1.25, lamp: 0, uv: [0, i * 2.3], ao: [1, 1, 0.8, 0.8] });
    up.col(PAL.stone, 0.8).set({ surf: SURF.STONE }); wall(up, [-ST.hw, z0], [ST.hw, z0], y, y + rise, { lamp: B, ao: 0.7 });
  }
  await ctx.yield();
  world.street = { tread, run, NS, yAt: (z) => (z <= ST.z0 ? ST.y0 : z >= ST.z1 ? ST.y1 : tread(Math.min(NS - 1, Math.floor((z - ST.z0) / run)))) };
  // its flank houses, four a side: walls at x -5 and 5, the roof's plane as the brief has it (y 67 at x 3.5, ridges 72.5 at
  // x -12 and 12, stacks to 76) but the eaves' edges at x -4 and 4 (y 67.3): OUTSIDE the opening's outline (jambs at 3.5)
  // for every eye on the last straight
  const wt = ST.eaveY + 1.5 * (ST.ridgeY - ST.eaveY) / (ST.ridgeX - ST.eaveX), len = (ST.z1 - ST.z0) / 4;
  for (let k = 0; k < 4; k++) for (const sg of [-1, 1]) {
    const z0 = ST.z0 + k * len, z1 = z0 + len, x0 = sg * ST.hw, x1 = sg * (ST.hw + ST.depth), g = world.street.yAt(z1 - 0.1);
    const fp = sg < 0 ? [[x0, z1], [x0, z0], [x1, z0], [x1, z1]] : [[x0, z0], [x0, z1], [x1, z1], [x1, z0]];
    await ctx.yield();
    add(up, fp, { g, base: g - 3, wallTop: wt, ridge: ST.ridgeY, ov: 1.0, storeys: 2, street: true, wash: 0, slate: true, stacks: ['A', 'B'], stackTop: 76, sub: 1.5, lamp: B });
  }
  await ctx.yield();
  // ---- round the square: two houses on its west side, two on its east, one each side of the street's mouth
  const two = (g) => g + 18 + 0.6 + 0.8 * town();
  for (const [z0, z1] of [[77, 89.3], [89.3, 101.6]]) { const w = two(S.y); add(up, [[S.x0, z1], [S.x0, z0], [S.x0 - 14, z0], [S.x0 - 14, z1]], { g: S.y, wallTop: w, ridge: w + 4.6, storeys: 2, stacks: ['B'], lamp: B }); }
  for (const [z0, z1] of [[77, 94.5], [94.5, 112]]) { const w = two(S.y); add(up, [[S.x1, z0], [S.x1, z1], [S.x1 + 14, z1], [S.x1 + 14, z0]], { g: S.y, wallTop: w, ridge: w + 4.6, storeys: 2, stacks: ['A'], lamp: B }); }
  for (const [x0, x1, end] of [[-30, -19.2, 'A'], [19.2, 30, 'B']]) { const w = two(S.y) - 1; add(up, [[x0, 77], [x1, 77], [x1, 63], [x0, 63]], { g: S.y, wallTop: w, ridge: w + 4.4, storeys: 2, stacks: [end] }); }
  // ---- THE WATCH TOWER: 12 m square, a slate cap to 82; no clock, no light
  const T = TOWER, h = T.half;
  taken.push([[T.x - h, T.z + h], [T.x + h, T.z + h], [T.x + h, T.z - h], [T.x - h, T.z - h]]);
  up.col(PAL.stone, 0.96).set({ surf: SURF.STONE, lamp: B });
  up.box(T.x - h, T.g - 4, T.z - h, T.x + h, 74, T.z + h, { no: 'tb', aoLow: 0.75, aoHigh: 1 });
  up.col(PAL.stone, 1.08).box(T.x - h - 0.5, 74, T.z - h - 0.5, T.x + h + 0.5, 75, T.z + h + 0.5, { aoLow: 0.8 });
  up.col(PAL.stone, 0.96).box(T.x - h, 75, T.z - h, T.x + h, 77.4, T.z + h, { no: 'tb' });
  up.col(PAL.slate, 0.95).set({ surf: SURF.SLATE });
  { const e = h + 0.7, c = [[T.x - e, T.z + e], [T.x + e, T.z + e], [T.x + e, T.z - e], [T.x - e, T.z - e]];
    for (let i = 0; i < 4; i++) { const a = c[i], b2 = c[(i + 1) % 4]; up.tri([a[0], 77.4, a[1]], [b2[0], 77.4, b2[1]], [T.x, T.top, T.z], { ao: [0.8, 0.8, 1] }); } }
  for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) for (const yy of [56, 67]) {   // shuttered lights, one to a face and floor
    const cx = T.x + dx * (h + 0.06), cz = T.z + dz * (h + 0.06), ax = dz, az = -dx;
    up.col(shut(), 0.9).set({ surf: SURF.WOOD }); wall(up, [cx - ax * 0.9, cz - az * 0.9], [cx + ax * 0.9, cz + az * 0.9], yy, yy + 3.6, { ao: 0.9 });
  }
  up.col(PAL.iron, 1.2).set({ surf: SURF.PLAIN }); bar(up, [T.x, T.top - 0.3, T.z], [T.x, T.vane, T.z], 0.1, {});
  world.vanes = [{ at: [T.x, T.vane - 0.7, T.z], size: 2.2 }];
  await ctx.yield();
  await buildUpperRows(ctx, world, town);
}

async function buildUpperRows(ctx, world, town) {
  const { low, up, add, shut, taken, houses } = world.town, G = world.ground;
  // a row dealt outward from x by the layout's number: widths 14 to 22, two storeys, a form (a narrow house may turn its
  // gable to the bay, some are hipped, some plain roofs carry dormers), a stack on a gable
  const deal = async (z0, z1, g, x, dir, lim, maxStoreys) => {
    for (let guard = 0; guard < 40 && dir * (lim - x) > 9; guard++) {
      await ctx.yield();
      let w = Math.min(14 + 8 * town(), dir * (lim - x)), placed = false; const storeys = town() < 0.4 && maxStoreys > 2 ? 3 : 2, dep = z1 - z0 - 2 * town(), lift = town(), pick = town(), fDraw = town(), dDraw = town();
      for (; w >= 9; w -= 2.5) {
        const xa = dir < 0 ? x - w : x, xb = dir < 0 ? x : x + w, fp = [[xa, z1], [xb, z1], [xb, z1 - dep], [xa, z1 - dep]];
        if (taken.some((q) => quadsOverlap(fp, q))) continue;
        const wt = g + 9 * storeys + lift, form = fDraw < 0.24 && w <= 17 ? 'gable' : fDraw < 0.4 ? 'hip' : 'plain';
        add(up, fp, { g, wallTop: wt, ridge: wt + (form === 'gable' ? 0.72 * w / 2 : 5.5), storeys, form, ov: 0.8, dormers: form === 'plain' && dDraw < 0.4 ? (dDraw < 0.2 ? 1 : 2) : 0,
          stacks: form === 'gable' ? (pick < 0.7 ? ['B'] : []) : pick < 0.45 ? [dir < 0 ? 'A' : 'B'] : pick < 0.8 ? ['A', 'B'] : [] });
        x += dir * w; placed = true; break;
      }
      if (!placed) x += dir * 2.5;
    }
  };
  // three rows either side of the upper street behind its flank houses, and the tall house's neighbours at the street's head
  for (const [z0, z1] of [[44, 58], [26, 40], [8, 22]]) { const zm = (z0 + z1) / 2, g = world.street.yAt(z1);
    await deal(z0, z1, g, -19.6, -1, -(G.westOf(zm) - 3), 2); await deal(z0, z1, g, 19.6, 1, G.eastOf(zm) - 3, 2); }
  await deal(-13, 1, STREET.y0, -10.6, -1, -(G.westOf(-6) - 3), 2); await deal(-13, 1, STREET.y0, 10.6, 1, G.eastOf(-6) - 3, 2);
  await ctx.yield();
  // ---- THE SIGHT STRIP, checked: no roof or stack on x -14 to 14 between the square and the quay tops the plane from the
  // entry over the parapet (the numbers are fixed, so this holds on every seed or the build stops here)
  let margin = Infinity;
  for (const h of houses) { const xs = h.fp.map((q) => q[0]), zs = h.fp.map((q) => q[1]), z0 = Math.min(...zs);
    if (Math.max(...xs) > -14 && Math.min(...xs) < 14 && z0 >= SQUARE.z1 && z0 < QUAY.z1) margin = Math.min(margin, sightY(z0) - h.rd); }
  for (const t of world.town.stacks) if (Math.abs(t[0]) < 14 + 1.2 && t[2] >= SQUARE.z1 && t[2] < QUAY.z1) margin = Math.min(margin, sightY(t[2] - 1.2) - t[1]);
  if (margin < 0) throw new Error('harbour-of-one-lamp: a roof on the sight strip tops the sight plane by ' + (-margin).toFixed(2) + ' m');
  world.sightMargin = margin;
  // ---- THE LAMP'S PAINT, a law of place: every marked corner of the upper town takes what the window sends it
  const law = makeLampLaw(houses, world.hillH);
  // a mason's marked corners take the law, in small pieces: a hand-back after every few thousand rays cast
  world.bake = async (m, fn = law, key = law.key) => { for (let from = 0, n = m.count, mark = law.cast; from < n; from += 16) { m.bake(fn, from, Math.min(n, from + 16)); if (key) m.shade(key, from, Math.min(n, from + 16)); if (law.cast - mark > 60) { mark = law.cast; await ctx.yield(); } } };
  world.lampLaw = law;
  for (const [m, name] of [[low, 'lower-town'], [up, 'upper-town'], [world.works, 'harbour-works']]) if (m.count) { await ctx.yield(); await world.bake(m); await ctx.yield(); const geo = m.geometry(); await ctx.yield(); const mesh = new THREE.Mesh(geo, world.stone); mesh.name = name; world.scene.add(mesh); }
  await ctx.yield();
}

// THE LAMP'S LAW (place only): from six points across the window to a corner of the world. Strength by distance d from W:
// 1.2 out to 17 m, then 1.2 / (1 + ((d - 17) / 60)^2) (a half at 77 m, a quarter of a point at 130 m: THE LAMP REACHES);
// three quarters on upright faces; nothing outside a cone of 58 degrees about due south, nothing on faces turned away;
// and ONLY AS MUCH AS A STRAIGHT LINE TO THE WINDOW IS CLEAR: of every house (walls and roof slopes), of the watch tower,
// of the square's south parapet and of the hill's own sheet (terraces, the square's ground, the stair's cut).
function makeLampLaw(houses, hillH) {
  // (the six points stand in two uprights of three, the highest first: every stop stands on the ground, so what stops the
  // line to the highest of an upright stops the lines to the two under it, and they are not cast)
  const src = [], SZ = HOUSE.wall + 0.15; for (const sx of [-0.66, 0.66]) for (const fy of [0.83, 0.5, 0.17]) src.push([sx * WIN.hw, STREET.y0 + WIN.y0 + fy * (WIN.y1 - WIN.y0)]);
  const solids = houses.map((h) => { const cx = (h.fp[0][0] + h.fp[1][0] + h.fp[2][0] + h.fp[3][0]) / 4, cz = (h.fp[0][1] + h.fp[1][1] + h.fp[2][1] + h.fp[3][1]) / 4;
    const r = Math.max(...h.fp.map((q) => Math.hypot(q[0] - cx, q[1] - cz))) + 0.5; return { planes: h.planes, cx, cz, r, r2: r * r }; });
  const boxSolid = (x0, z0, x1, z1, top) => solids.push({ planes: [[-1, 0, 0, -x0], [1, 0, 0, x1], [0, 0, -1, -z0], [0, 0, 1, z1], [0, 1, 0, top]], cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, r: Math.hypot(x1 - x0, z1 - z0) / 2 + 0.5, r2: (Math.hypot(x1 - x0, z1 - z0) / 2 + 0.5) ** 2 });
  boxSolid(SQUARE.x0, SQUARE.z1, SQUARE.x1, SQUARE.z1 + 0.95, SQUARE.parapet);
  boxSolid(TOWER.x - TOWER.half, TOWER.z - TOWER.half, TOWER.x + TOWER.half, TOWER.z + TOWER.half, 77.4);
  // which solids a line can meet at all: lines to the window by their bearing from it (a fan of 2 degree leaves, each
  // with the solids that reach into it), lines toward the band by their offset across that line's own heading (6 m lanes)
  const NB = 90, fan = [], reach = WIN.hw + 0.1;
  for (let b = 0; b < NB; b++) { const pb = ((b + 0.5) / NB - 0.5) * Math.PI; fan.push(solids.filter((so) => { const dd = Math.hypot(so.cx, so.cz - SZ); if (dd <= so.r + reach) return true;
    let da = Math.abs(Math.atan2(so.cx, so.cz - SZ) - pb); if (da > Math.PI) da = TAU - da; return da <= Math.asin((so.r + reach) / dd) + Math.PI / NB * 0.55; })); }
  const fanOf = (px, pz) => { const dz = pz - SZ; if (dz < 0.3) return solids; const b = ((Math.atan2(px, dz) / Math.PI + 0.5) * NB) | 0; return fan[b < 0 ? 0 : b >= NB ? NB - 1 : b]; };
  const seenL = { s: null, hill: 1, j: 0 }, seenT = { s: null, hill: 0, j: 0 }, seenK = { s: null, hill: 2, j: 0 };
  // (the highest point of each upright against the hill: over the town, by the height a line to it must start above,
  // kept on the same 2 m net of places as the band's; beyond the net, stepped along the line)
  const six = (px, py, pz) => { let open = 0; const list = fanOf(px, pz);
    for (let i = 0; i < 6; i += 3) { const under = topUnder(i / 3, px, py, pz);
      if (under === 1 || blocked(px, py, pz, src[i][0], src[i][1], SZ, list, under === 0 ? seenT : seenL, 14, 9)) continue; open++;
      for (let k = i + 1; k < i + 3; k++) if (!blocked(px, py, pz, src[k][0], src[k][1], SZ, list, seenL, 14, 9)) open++; }
    return open / 6; };
  const law = (x, y, z, nx, ny, nz) => {
    const dx = x - W0[0], dy = y - W0[1], dz = z - SZ; if (dz < 0.3) return 0;
    const d = Math.hypot(dx, dy, dz), facing = -(nx * dx + ny * dy + nz * dz) / d; if (facing <= 0.02) return 0;
    const cone = smoothstep(c0, c1, dz / d); if (cone <= 0) return 0;
    // THE HONEST FACING (r3): level ground takes the lamp as it did (the fan on the square's flags, the stem down the steps);
    // a roof's slope and a wall take it by how squarely they face the window, so slate and wall that lie along its rays
    // keep the dusk's blue and only what is turned to it (a ridge tile, a reveal, a sill, a stack's face) wears the gold
    const far = Math.max(0, d - 17) / 60, turn = ny >= 0.98 ? smoothstep(0.0, 0.2, facing) : Math.min(1, facing * (ny > 0.7 ? 1 : 2.2));
    // (and by its fall: what is not level ground loses the lamp with the square of its distance, half gone at 26 m)
    const F = 1.2 / (ny >= 0.98 ? 1 + far * far : 1 + (d / 26) * (d / 26)) * (ny > 0.7 ? 1 : 0.75) * cone * turn;
    return F * six(x + nx * 0.06, y + ny * 0.06, z + nz * 0.06);
  };
  law.cast = 0;
  // the same for a place in the air (smoke, a bird): how many of the six lines are clear, as a share
  law.open = six;
  // THE EYE'S SIGHT OF THE WINDOW (asked by the world's one law of the eye, the lamp's image on the bay): from a place in
  // the air, the share of two dozen points spread over the window's opening (four across, six up) to which a straight
  // line is clear of every house, the parapet, the tower and the hill. Every line is cast whole each time it is asked;
  // nothing is kept from one asking to the next.
  const spread = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) spread.push([((i + 0.5) / 2 - 1) * WIN.hw, STREET.y0 + WIN.y0 + (j + 0.5) / 6 * (WIN.y1 - WIN.y0)]);
  law.sight = (px, py, pz) => { if (pz - SZ < 0.3) return 0;
    const list = fanOf(px, pz), fresh = { s: null, hill: 1, j: 0 }, cast0 = law.cast; let open = 0;
    for (let k = 0; k < spread.length; k++) { fresh.s = null; if (!blocked(px, py, pz, spread[k][0], spread[k][1], SZ, list, fresh, 14, 9)) open++; }
    law.cast = cast0; return open / spread.length; };
  // THE LAST LIGHT'S SHADE (place only): a corner that faces the band is in shade as far as straight lines toward the band
  // (three of them, across its breadth and height) are stopped by a house, the tower, the parapet or the hill within 230 m
  const KD = [[-12, 8], [0, 12], [12, 17]].map(([da, el]) => { const a = 120 * DEG + da * DEG, e = el * DEG; return [-Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; });
  const lanes = KD.map((k) => { const h = Math.hypot(k[0], k[2]), ax = k[2] / h, az = -k[0] / h, L = [];
    for (let i = 0; i < 512; i++) { const w = (i - 256 + 0.5) * 6; L.push(solids.filter((so) => Math.abs(so.cx * ax + so.cz * az - w) <= so.r + 3.05)); } return { ax, az, L }; });
  law.key = (x, y, z, nx, ny, nz) => { if (nx * KEY_DIR[0] + ny * KEY_DIR[1] + nz * KEY_DIR[2] <= 0.02) return 0;
    const px = x + nx * 0.08, py = y + ny * 0.08, pz = z + nz * 0.08;
    // (the two outer lines first; where they agree the middle one is taken to say the same and is not cast)
    const a = toBand(0, px, py, pz), c = toBand(2, px, py, pz); return a === c ? a : (a + c + toBand(1, px, py, pz)) / 3; };
  const toBand = (j, px, py, pz) => { const k = KD[j], ln = lanes[j], i = Math.floor((px * ln.ax + pz * ln.az) / 6) + 256; seenK.j = j;
    return blocked(px, py, pz, px + k[0] * 230, py + k[1] * 230, pz + k[2] * 230, ln.L[i < 0 ? 0 : i > 511 ? 511 : i], seenK, 0, 13) ? 1 : 0; };
  // is the line stopped inside this solid (a convex body: walls, roof slopes, a flat top)
  const inSolid = (so, px, py, pz, dx, dy, dz, eps) => { let tE = 0, tX = 1;
    for (let i = 0, P = so.planes, n = P.length; i < n; i++) { const pl = P[i], a = pl[0] * px + pl[1] * py + pl[2] * pz - pl[3], b = pl[0] * dx + pl[1] * dy + pl[2] * dz;
      if (Math.abs(b) < 1e-9) { if (a > 0) return false; continue; }
      const tt = -a / b; if (b < 0) { if (tt > tE) tE = tt; } else if (tt < tX) tX = tt;
      if (tE >= tX) return false; }
    return tX - tE > eps && tX > 2 * eps && tE < 1 - eps; };
  // the hill's own sheet, at every `step` m of the line (from 3 m off the face to `short` m before its far end)
  const underHill = (px, py, pz, dx, dy, dz, lh, short, step) => { for (let s = 3; s < lh - short; s += step) { const t = s / lh; if (py + dy * t < hillH(px + dx * t, pz + dz * t) - 0.35) return true; } return false; };
  // does the line pass over the round a solid stands in (seen from above)
  const touches = (so, px, pz, dx, dz, l2) => { let t = ((so.cx - px) * dx + (so.cz - pz) * dz) / l2; if (t < 0) t = 0; else if (t > 1) t = 1;
    const ex = px + dx * t - so.cx, ez = pz + dz * t - so.cz; return ex * ex + ez * ez <= so.r2; };
  // (the solid that stopped the last line of its kind is tried first: neighbours are mostly stopped by the same thing)
  const blocked = (px, py, pz, wx, wy, wz, list, seen, short, step) => {
    law.cast++;
    const dx = wx - px, dy = wy - py, dz = wz - pz, l2 = dx * dx + dz * dz, lh = Math.sqrt(l2), eps = 0.06 / Math.max(lh, 1), last = seen.s;
    if (last && touches(last, px, pz, dx, dz, l2) && inSolid(last, px, py, pz, dx, dy, dz, eps)) return true;
    if (seen.hill === 1 && underHill(px, py, pz, dx, dy, dz, lh, short, step)) return true;
    for (let i = 0, n = list.length; i < n; i++) { const so = list[i]; if (so === last || !touches(so, px, pz, dx, dz, l2)) continue;
      if (inSolid(so, px, py, pz, dx, dy, dz, eps)) { seen.s = so; return true; } }
    return seen.hill === 2 && overHill(seen.j, px, py, pz, dx, dy, dz, lh);
  };
  // the hill against a line toward the band: over the town the height a line of that heading must start above to clear
  // the hill is kept on a 2 m net of places (found for a place when first asked, by the same steps of 13 m); beyond it, stepped
  const HX = -220, HZ = 30, HNX = 221, HNZ = 121, rim = KD.map(() => new Float32Array(HNX * HNZ).fill(NaN));
  const rimAt = (T, k, ix, iz) => { const q = ix * HNZ + iz; let v = T[q];
    if (v !== v) { const x = HX + ix * 2, z = HZ + iz * 2; v = -1e9; for (let sd = 3; sd < 230; sd += 13) { const y = hillH(x + k[0] * sd, z + k[2] * sd) - 0.35 - k[1] * sd; if (y > v) v = y; } T[q] = v; }
    return v; };
  const rimL = [0, 3].map(() => new Float32Array(HNX * HNZ).fill(NaN));
  const rimLAt = (T, sc, ix, iz) => { const q = ix * HNZ + iz; let v = T[q];
    if (v !== v) { const x = HX + ix * 2, z = HZ + iz * 2, ex = sc[0] - x, ez = SZ - z, lh = Math.hypot(ex, ez); v = -1e9;
      for (let sd = 3; sd < lh - 14; sd += 9) { const t = sd / lh, y = (hillH(x + ex * t, z + ez * t) - 0.35 - sc[1] * t) / (1 - t); if (y > v) v = y; } T[q] = v; }
    return v; };
  // 1: the hill stops the line to upright u's highest point; 0: it does not; -1: outside the net (the line is stepped)
  const topUnder = (u, px, py, pz) => { const fx = (px - HX) / 2, fz = (pz - HZ) / 2, ix = Math.floor(fx), iz = Math.floor(fz);
    if (ix < 0 || iz < 0 || ix > HNX - 2 || iz > HNZ - 2) return -1;
    const T = rimL[u], sc = src[u * 3], sx = fx - ix, sz = fz - iz, a = rimLAt(T, sc, ix, iz), b = rimLAt(T, sc, ix + 1, iz), c = rimLAt(T, sc, ix, iz + 1), d = rimLAt(T, sc, ix + 1, iz + 1);
    return py < (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz ? 1 : 0; };
  const overHill = (j, px, py, pz, dx, dy, dz, lh) => { const fx = (px - HX) / 2, fz = (pz - HZ) / 2, ix = Math.floor(fx), iz = Math.floor(fz);
    if (ix < 0 || iz < 0 || ix > HNX - 2 || iz > HNZ - 2) return underHill(px, py, pz, dx, dy, dz, lh, 0, 13);
    const T = rim[j], k = KD[j], sx = fx - ix, sz = fz - iz, a = rimAt(T, k, ix, iz), b = rimAt(T, k, ix + 1, iz), c = rimAt(T, k, ix, iz + 1), d = rimAt(T, k, ix + 1, iz + 1);
    return py < (a + (b - a) * sx) * (1 - sz) + (c + (d - c) * sx) * sz; };
  const c0 = Math.cos(64 * DEG), c1 = Math.cos(52 * DEG);
  return law;
}

// ================================================================ the boats (own hulls, all dark; three kinds and the lugger)
// A hull in its own frame: +x the bow, y up from the waterline, z across. L long, B in the beam. Planked (the seams run fore and aft).
function hullInto(m, L, B, col, o = {}) {
  const N = 12, F = o.freeboard ?? 2.2, D = o.draught ?? 1.5, bul = o.bulwark ?? 0.7, st = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, tt = 0.12 + 0.88 * t, b = (B / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(tt, 0.75))), 0.6);
    const yd = F * (1 + (t > 0.5 ? 1.1 : 0.45) * (2 * t - 1) ** 2), rise = smoothstep(0.84, 1, t) ** 2, yk = lerp(-D, yd + bul, rise);
    st.push({ x: (t - 0.5) * L, b, yd, pts: [[yk, 0], [lerp(-0.55, yd + bul, rise), 0.7 * b], [lerp(0.45 * yd, yd + bul, rise), 0.96 * b], [yd + bul, b]] });
  }
  const dark = [col[0] * 0.7, col[1] * 0.7, col[2] * 0.7];
  for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) for (const sd of [1, -1]) {
    const A = st[sd > 0 ? i + 1 : i], Bq = st[sd > 0 ? i : i + 1];
    m.col(k < 1 ? dark : col, k === 2 ? 1 : 0.8).set({ surf: SURF.WOOD });
    m.quad([A.x, A.pts[k][0], sd * A.pts[k][1]], [A.x, A.pts[k + 1][0], sd * A.pts[k + 1][1]], [Bq.x, Bq.pts[k + 1][0], sd * Bq.pts[k + 1][1]], [Bq.x, Bq.pts[k][0], sd * Bq.pts[k][1]],
      { uv: [k * 2.1, A.x], ao: [0.55 + 0.2 * k, 0.75 + 0.12 * k, 0.75 + 0.12 * k, 0.55 + 0.2 * k] });
  }
  const s0 = st[0];                                           // the transom
  for (let k = 0; k < 3; k++) m.quad([s0.x, s0.pts[k][0], -s0.pts[k][1]], [s0.x, s0.pts[k][0], s0.pts[k][1]], [s0.x, s0.pts[k + 1][0], s0.pts[k + 1][1]], [s0.x, s0.pts[k + 1][0], -s0.pts[k + 1][1]], { ao: 0.8 });
  m.col(PAL.oak, 0.75).set({ surf: SURF.WOOD });               // the deck (or the bottom boards of an open boat), and the rail's inner face
  const dk = o.open ? -0.7 : 0;
  for (let i = 0; i < N; i++) { const a = st[i], b = st[i + 1], za = a.b * 0.93, zb = b.b * 0.93;
    m.quad([a.x, a.yd + dk, za], [b.x, b.yd + dk, zb], [b.x, b.yd + dk, -zb], [a.x, a.yd + dk, -za], { ao: o.open ? 0.5 : 0.8, uv: [a.x, 0] }); }
  m.col('#C8C2B0', 0.85).set({ surf: SURF.PLAIN });             // a pale painted strake under the rail: the gunwale's lit line
  for (let i = 0; i < N; i++) for (const sd of [1, -1]) { const A = st[sd > 0 ? i + 1 : i], Bq = st[sd > 0 ? i : i + 1], e = 0.06;
    m.quad([A.x, A.yd + 0.1, sd * (A.b + e)], [A.x, A.yd + 0.45, sd * (A.b + e)], [Bq.x, Bq.yd + 0.45, sd * (Bq.b + e)], [Bq.x, Bq.yd + 0.1, sd * (Bq.b + e)], {}); }
  return { deck: (x) => { const t = clamp(x / L + 0.5, 0, 1); return F * (1 + (t > 0.5 ? 1.1 : 0.45) * (2 * t - 1) ** 2) + dk; }, half: (x) => { const t = clamp(x / L + 0.5, 0, 1); return (B / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(0.12 + 0.88 * t, 0.75))), 0.6); } };
}
// a mast with its stays; a furled sail is a fat roll of cloth on a spar
function mastInto(m, x, y0, h, o = {}) {
  m.col(PAL.spar).set({ surf: SURF.PLAIN }); bar(m, [x, y0 - 0.5, 0], [x - h * 0.03, y0 + h, 0], 0.3 * (o.thick ?? 1), { r1: 0.14, ao: 0.9 });
  m.col(PAL.iron, 1.0);
  for (const [ex, ez] of o.stays || []) bar(m, [x - h * 0.03, y0 + h * 0.96, 0], [ex, o.rail ?? y0 + 0.6, ez], 0.05, {});
  return [x - h * 0.03, y0 + h, 0];
}
function furlInto(m, a, b, r, sail) {
  m.col(PAL.oak, 0.6).set({ surf: SURF.PLAIN }); bar(m, a, b, 0.16, {});
  const n = 5; m.col(sail, 0.85).set({ surf: SURF.CLOTH });
  for (let i = 0; i < n; i++) { const f0 = 0.06 + 0.88 * i / n, f1 = 0.06 + 0.88 * (i + 1) / n, pa = a.map((v, k) => v + (b[k] - v) * f0), pb = a.map((v, k) => v + (b[k] - v) * f1);
    bar(m, [pa[0], pa[1] - r * 0.7, pa[2]], [pb[0], pb[1] - r * 0.7, pb[2]], r * (0.8 + 0.25 * ((i * 3) % 2)), { ao: 0.85, uv: [i * 3.1, 0] }); }
}
// kind 0 the drifter (two masts, a wheelhouse), 1 the smack (one mast, a boom, a bowsprit), 2 the open boat; 3 the lugger under sail
function boatGeometry(kind, hullCol, sailCol, fixed) {
  const m = makeMason(); if (kind !== 3) m.set({ lamp: LAMP_BAKE });
  if (kind === 2) {
    const h = hullInto(m, 13, 4.6, hullCol, { open: true, freeboard: 1.5, bulwark: 0.4, draught: 0.8 });
    m.col(PAL.oak, 0.85).set({ surf: SURF.WOOD }); for (const x of [-3.4, -0.4, 2.6]) m.box(x - 0.45, h.deck(x) + 0.55, -h.half(x) * 0.93, x + 0.45, h.deck(x) + 0.75, h.half(x) * 0.93, { no: 'b' });
    mastInto(m, 1.2, h.deck(1.2), 11, { thick: 0.6, stays: [[6.2, 0], [-1.5, 2.0], [-1.5, -2.0]], rail: 2.0 });
    furlInto(m, [-4.5, 2.4, 0.5], [3.6, 2.9, 0.5], 0.42, sailCol);
    return { m, L: 13, B: 4.6, top: 13 };
  }
  const L = kind === 1 ? 22 : 25, B = kind === 1 ? 7 : 8, h = hullInto(m, L, B, hullCol, {}), tall = kind === 1 ? 27 : 30, mx = kind === 1 ? 2.5 : 3.5, y0 = h.deck(mx), sails = [];
  mastInto(m, mx, y0, tall, { stays: [[L / 2 - 0.4, 0], [mx - 4, h.half(mx - 4)], [mx - 4, -h.half(mx - 4)], [mx - 6.5, h.half(mx - 6.5)], [mx - 6.5, -h.half(mx - 6.5)]], rail: y0 + 0.8 });
  if (kind === 0 || kind === 3) {
    mastInto(m, -8.6, h.deck(-8.6), 19, { thick: 0.75, stays: [[-12.3, 0], [-5.5, h.half(-5.5)], [-5.5, -h.half(-5.5)]], rail: h.deck(-8.6) + 0.8 });
    m.col(PAL.chalk, 0.5).set({ surf: SURF.WOOD }).box(-6.6, h.deck(-5) - 0.1, -1.5, -3.2, h.deck(-5) + 3.1, 1.5, { no: 'b', aoLow: 0.7 });
    m.col(PAL.slate, 0.8).set({ surf: SURF.PLAIN }).box(-6.9, h.deck(-5) + 3.1, -1.8, -2.9, h.deck(-5) + 3.35, 1.8, {});
  } else {
    m.col(PAL.oak, 0.7).set({ surf: SURF.PLAIN }); bar(m, [L / 2 - 1.5, h.deck(L / 2 - 1.5) + 0.9, 0], [L / 2 + 6.5, h.deck(L / 2) + 1.9, 0], 0.2, { r1: 0.1 });
    m.col(PAL.iron); bar(m, [mx - tall * 0.03, y0 + tall * 0.8, 0], [L / 2 + 6.4, h.deck(L / 2) + 1.9, 0], 0.05, {});
  }
  if (kind !== 3) {
    if (kind === 0) furlInto(m, [mx - 9, y0 + 3.6, 0.9], [mx + 6.5, y0 + 5.2, 0.9], 0.75, sailCol);
    else furlInto(m, [mx - 13.5, y0 + 3.4, 0], [mx - 0.5, y0 + 3.0, 0], 0.7, sailCol);
    if (kind === 0) furlInto(m, [-12.6, h.deck(-9) + 3.2, 0], [-8.9, h.deck(-9) + 3.0, 0], 0.5, sailCol);
    // a heap of net forward and fish boxes aft of the mast
    m.col(PAL.rope, 0.55).set({ surf: SURF.NET }).post(mx + 4.5, 0, h.deck(mx + 4.5), h.deck(mx + 4.5) + 1.1, 1.9, 0.8, 7, { aoLow: 0.6 });
    m.col(PAL.oak, 0.9).set({ surf: SURF.WOOD }); for (let i = 0; i < 3; i++) m.box(mx - 3 + i * 0.2, h.deck(mx - 3) + i * 0.55, 1.0, mx - 1.2 + i * 0.2, h.deck(mx - 3) + 0.5 + i * 0.55, 2.3, { no: 'b' });
  } else {
    // THE LUGGER'S SAILS: a dipping lug on a slanting yard and a small mizzen; their bellies move in the wind (sway).
    // (r5) Each sail is a piece of its own, laid about its own mast (px), so that it can swing across as she goes about.
    const sail = (px, x0, x1, yb, yt0, yt1, bell) => { const m = makeMason(); x0 -= px; x1 -= px; sails.push({ m, at: px }); m.col(sailCol, 1).set({ surf: SURF.CLOTH });
      const q = (s2, t2) => [lerp(x0, x1, s2), lerp(yb, lerp(yt0, yt1, s2), t2), 0.25 + bell * Math.sin(Math.PI * s2) * Math.sin(Math.PI * (0.15 + 0.7 * t2))];
      const NU = 6, NV = 7;
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const s0 = i / NU, s1 = (i + 1) / NU, t0 = j / NV, t1 = (j + 1) / NV, sw = (s2, t2) => 0.55 * Math.sin(Math.PI * s2) * Math.sin(Math.PI * t2);
        m.quad(q(s0, t0), q(s1, t0), q(s1, t1), q(s0, t1), { uv: [s0 * (x1 - x0), t0 * 20], sway: [sw(s0, t0), sw(s1, t0), sw(s1, t1), sw(s0, t1)], ao: 0.95 }); }
      m.col(PAL.oak, 0.6).set({ surf: SURF.PLAIN }); bar(m, [x0, yt0, 0.25], [x1, yt1, 0.25], 0.2, {}); };
    sail(mx, mx - 7.5, mx + 9.5, y0 + 3.2, y0 + 20, y0 + 28.5, 1.6); sail(-8.6, -12.4, -6.6, h.deck(-9) + 3, h.deck(-9) + 13, h.deck(-9) + 17.5, 0.8);
  }
  return { m, L, B, top: y0 + tall, sails };
}

// The moored boats: three by the mole's inner face, three open boats on buoys east of the lane, and a group in the west of
// the basin, every hull of it north of the route with 12 m of clear water (the lead's limits). The lane 14 m either side of
// x 0 holds none. Each rocks at its mooring on the world clock. Beyond the mole one lugger beats round a long oval.
async function buildBoats(ctx, world) {
  const r = world.rngs.rBoats, mat = stoneMaterial(world.light, { side: THREE.DoubleSide }), boats = [], floats = makeMason();
  const want = Math.round(clamp(11 * world.density + r.range(-1.5, 1.5), 9, 14));
  const windYaw = world.windSide > 0 ? Math.PI : 0;                  // bows into the wind
  // a moored boat takes the lamp where it lies (the ray law at its mooring: mastheads and furled sails that stand in the cone)
  const put = async (kind, x, z, yaw, rr = r, sails = P.sails) => {
    const paint = linear(rr.pick(P.hulls), rr.range(0.8, 1.2)), cloth = linear(rr.pick(sails), 0.9), b = boatGeometry(kind, paint, cloth, rr), c = Math.cos(yaw), sn = Math.sin(yaw);
    await ctx.yield();
    if (kind !== 3) await world.bake(b.m, (lx, ly, lz, nx, ny, nz) => world.lampLaw(x + lx * c + lz * sn, ly, z - lx * sn + lz * c, nx * c + nz * sn, ny, -nx * sn + nz * c), null);
    await ctx.yield();
    const mesh = new THREE.Mesh(b.m.geometry(), mat); mesh.rotation.order = 'YXZ'; mesh.position.set(x, 0, z); mesh.rotation.y = yaw; mesh.name = 'boat';
    world.scene.add(mesh);
    const rig = (b.sails || []).map((sl) => { const sm = new THREE.Mesh(sl.m.geometry(), mat); sm.name = 'lugger-sail'; sm.position.x = sl.at; mesh.add(sm); return sm; });
    const o = { mesh, kind, x, z, yaw, L: b.L, B: b.B, top: b.top, paint, cloth, sails: rig, roll: rr.range(1.2, 3) * DEG, pitch: rr.range(0.5, 1.5) * DEG, tr: rr.range(5, 8), tp: rr.range(5, 8), ph: rr.range(0, TAU), heave: rr.range(0.06, 0.14) };
    boats.push(o); return o;
  };
  // THE MOORINGS ARE LAID FOR THE LINE BY ONE RULE (leadAmends 1, laid again for r2's line): a boat is moored only where its
  // whole hull and its masts stand 12 m and more from the flown line (measured here against every metre of it), where no
  // part of it lies in the lane of water on the axis (x -14 to 14 holds nothing: the gold road's lane, the entry's view)
  // and where the next hull is 4 m and more off. A place that fails is left empty.
  const line = []; { const q = new THREE.Vector3(); for (let d = 0; d <= world.path.length; d += 1) { world.path.posAtDist(d, q); line.push(q.x, q.y, q.z); if (d % 60 === 59) await ctx.yield(); } }
  const near = (x, y, z) => { let b = Infinity; for (let i = 0; i < line.length; i += 3) { const dx = line[i] - x, dy = line[i + 1] - y, dz = line[i + 2] - z, dd = dx * dx + dy * dy + dz * dz; if (dd < b) b = dd; } return Math.sqrt(b); };
  world.near = near; world.line = line;                             // the flown line's own samples, a metre apart (x, y, z)
  world.boatClear = (o) => { let b = Infinity; const c = Math.cos(o.yaw), sn = Math.sin(o.yaw), sway = o.top * Math.sin(3 * DEG) + 0.3;
    for (let i = 0; i <= 8; i++) for (const sd of [-1, 1]) { const lx = (i / 8 - 0.5) * (o.L + (o.kind === 1 ? 14 : 0)), lz = sd * o.B / 2, x = o.x + lx * c + lz * sn, z = o.z - lx * sn + lz * c; b = Math.min(b, near(x, 0, z), near(x, 3.5, z)); }
    for (const lx of o.kind === 2 ? [1.2] : o.kind === 1 ? [2.5] : [3.5, -8.6]) for (let y = 3; y <= o.top; y += 2) b = Math.min(b, near(o.x + lx * c, y, o.z - lx * sn) - sway);
    return b; };
  const DIMS = [[25, 8, 34], [22, 7, 31], [13, 4.6, 13]], LANE = 14;
  const free = (kind, x, z, yaw) => { const [L, B, top] = DIMS[kind], bs = kind === 1 ? 7 : 0, c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw)), ex = (L / 2 + bs) * c + B / 2 * sn, ez = (L / 2 + bs) * sn + B / 2 * c;
    if (Math.abs(x) - ex < LANE) return false;
    if (boats.some((o) => Math.abs(o.x - x) < o.ex + ex + 4 && Math.abs(o.z - z) < o.ez + ez + 3)) return false;
    return world.boatClear({ kind, x, z, yaw, L, B, top }) >= 12 ? { ex, ez } : false; };
  const moor = async (kind, x, z, yaw) => { await ctx.yield(); const f = free(kind, x, z, yaw); if (!f) return null; await ctx.yield(); const o = await put(kind, x, z, yaw); o.ex = f.ex; o.ez = f.ez; await ctx.yield(); return o; };
  // a mooring buoy: a tarred cask of dull red riding low, an iron ring-bolt standing on its head
  const buoy = (x, z) => { floats.col('#74463C', 0.9).set({ surf: SURF.WOOD }).post(x, z, -0.3, 0.8, 0.8, 0.62, 8, { aoLow: 0.5 }); floats.col(PAL.iron, 1.1).set({ surf: SURF.PLAIN }).post(x, z, 0.8, 1.45, 0.09, 0.09, 5, {}); };
  // by the mole: three berths at even steps along its inner face (a fifth of its length apart) from a start the seed
  // draws, the hull's side 2 to 3 m inside the face
  const { cl, off } = world.mole, berth0 = r.range(0.14, 0.26);
  for (let k = 0; k < 3; k++) {
    const c = cl[Math.round((berth0 + k * 0.2) * (cl.length - 1))];
    const kind = r.chance(0.6) ? 0 : 1, B = kind === 1 ? 7 : 8, at = off(c, -(MOLE.hw + r.range(2, 3) + B / 2)), turn = r.chance(0.5) ? Math.PI : 0;
    await moor(kind, at[0], at[1], Math.atan2(-c.ex, -c.ez) + turn);
  }
  // INSIDE THE BEND AT THE BEACON, on the hand the beacon is not: A TROT (boats made fast fore and aft between buoys, lying
  // north and south along the fairway's edge, not to the wind), in the strip of water between the lane and the line: a
  // tall-masted boat a little seaward of the mole's elbow and an open boat off each of its ends. The one mooring rule decides
  // which of the three places hold (12 m of clear water to the line, nothing in the lane, 4 m to the next hull).
  const NS = Math.PI / 2;
  { const kind = r.chance(0.5) ? 0 : 1, [L, B] = DIMS[kind], x = LANE + B / 2 + r.range(0.5, 2), z = MOLE.line[2][1] + r.range(4, 8), bs = kind === 1 ? 7 : 0, turn = r.chance(0.5) ? 0 : Math.PI, gap = r.range(5, 7);
    if (await moor(kind, x, z, NS + turn)) { buoy(x, z - L / 2 - bs - 3); buoy(x, z + L / 2 + bs + 3); }
    for (const k of [-1, 1]) { const zz = z + k * (L / 2 + bs + 3 + gap + 6.5); if (await moor(2, LANE + 2.3 + 1, zz, NS + turn)) buoy(LANE + 3.3, zz + k * 9.5); } }
  // open boats made fast along the quay's face, either side of the lane
  // (berths at even steps of 16 m along the face from a start the seed draws; the mooring rule keeps the lane empty)
  const quayBerths = []; for (let x = QUAY.x0 + 8 + r.range(0, 16); x < QUAY.x1 - 8; x += 16) quayBerths.push(x);
  for (const x of r.shuffle(quayBerths)) { const turn = r.chance(0.5) ? 0 : Math.PI; if (boats.length < want - 3) await moor(2, x, QUAY.z1 + 4.2, turn); }
  // THE FLEET lies on buoys in the water the line flies round (inside the loop, south of the run along the quay, north of
  // the slow arc), every hull within 40 m of the line: close under it, and never nearer than the rule allows; two places
  // in three are tried in the loop's west half, where masts and furled sails stand before the afterglow
  const lp = LAY.loop, sl = LAY.slow, inFleet = (x, z) => (x < lp.x ? Math.hypot(x - lp.x, z - lp.z) < lp.R : z > LAY.run[1] && z < sl.z + Math.sqrt(Math.max(0, sl.R * sl.R - (x - sl.x) * (x - sl.x))));
  for (let tries = 0; boats.length < want && tries < 400; tries++) {
    const kind = r.chance(0.3) ? 2 : r.chance(0.5) ? 0 : 1, L = DIMS[kind][0], x = r.range(lp.x - lp.R, tries % 3 ? lp.x : -LANE), z = r.range(lp.z - lp.R, lp.z + lp.R);
    if (tries % 6 === 5) await ctx.yield();
    if (!inFleet(x, z) || near(x, 5, z) > 40) continue;
    if (await moor(kind, x, z, windYaw)) buoy(x + Math.cos(windYaw) * (L / 2 + 3 + (kind === 1 ? 7 : 0)), z);
  }
  if (floats.count) { const fm = new THREE.Mesh(floats.geometry(), world.stone); fm.name = 'buoys'; world.scene.add(fm); }
  await ctx.yield();
  // THE LUGGER BEATS NEAR (r3): a narrow oval outside the loop round the fleet, on the bearing 30 degrees west of south from
  // the loop's middle (the open water between the skerry and the lane, before the afterglow as the loop looks out), its
  // long axis along the loop's own tangent there, its middle LUG.off beyond the line: so the line passes her hull at 35 to
  // 50 m and never under 30 (counted at build). Tan or red her sail. Her own fork.
  const rL = world.rngs.rLugger, LUG = { bearing: 30 * DEG, off: 50, a: 6, b: 42, pace: 2.2, sheet: 14 }, lr = lp.R + LUG.off, rd = [-Math.sin(LUG.bearing), Math.cos(LUG.bearing)];
  const OV = { x: lp.x + rd[0] * lr, z: lp.z + rd[1] * lr, a: LUG.a, b: LUG.b, ux: rd[0], uz: rd[1], vx: rd[1], vz: -rd[0] }; world.oval = OV;
  OV.at = (f) => [OV.x + OV.ux * OV.a * Math.cos(f) + OV.vx * OV.b * Math.sin(f), OV.z + OV.uz * OV.a * Math.cos(f) + OV.vz * OV.b * Math.sin(f)];
  const lug = await put(3, OV.x, OV.z, 0, rL, P.sails.slice(0, 2)), ph0 = rL.range(0, TAU), way = rL.chance(0.5) ? 1 : -1;
  boats.pop(); world.lugger = lug; world.boats = boats; world.lugAt = new THREE.Vector4(OV.x, 1, OV.z, 0); world.lugSail = new THREE.Vector2(1, 0);
  // HER PACE IS BY THE WAY SAILED (r5): the oval's own length against its angle, in a table (720 chords of it); she is as far
  // round the oval as she has sailed, so she runs its ends at the pace she runs its sides. She starts where the angle her
  // stream drew lies. HER HEADING is from the point of the oval half her own length astern of her middle to the point half
  // her length ahead (her stern and her stem both hold the beat; she lies as a chord of it): through each end her bow
  // comes round over the ten seconds she takes to sail her own length and the end's arc (30 degrees a second at most),
  // not in the instant the oval's tip turns.
  const NT = 720, arc = new Float32Array(NT + 1); { let pa = OV.at(0); for (let i = 1; i <= NT; i++) { const pb = OV.at(i / NT * TAU); arc[i] = arc[i - 1] + Math.hypot(pb[0] - pa[0], pb[1] - pa[1]); pa = pb; } }
  const lap = arc[NT], angleAt = (s) => { s = ((s % lap) + lap) % lap; let lo = 0, hi = NT; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (arc[md] <= s) lo = md; else hi = md; } return (lo + (s - arc[lo]) / (arc[hi] - arc[lo])) / NT * TAU; };
  const s0 = (() => { const g = ph0 / TAU * NT, i = Math.min(NT - 1, Math.floor(g)); return arc[i] + (arc[i + 1] - arc[i]) * (g - i); })(), reach = lug.L / 2;
  world.lugLap = { lap: Math.round(lap * 10) / 10, seconds: Math.round(lap / LUG.pace * 10) / 10, from: Math.round(s0 * 10) / 10, way };
  // HER WAKE: a broken line of pale rose on the water astern, along her own oval (the foam she leaves holds the afterglow):
  // 70 m of it, widening and thinning, its breaks sliding back along it
  const wg = new THREE.PlaneGeometry(1, 1, 28, 1), wake = new THREE.Mesh(wg, new THREE.ShaderMaterial({
    uniforms: { uF: { value: ph0 }, uO: { value: new THREE.Vector4(OV.x, OV.z, OV.a, OV.b) }, uU: { value: new THREE.Vector4(OV.ux, OV.uz, OV.vx, OV.vz) }, uSpan: { value: way * 70 }, uTime: world.light.uTime, uCol: { value: new THREE.Color('#E9B9AE') },
      uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } },
    vertexShader: /* glsl */`uniform float uF, uSpan; uniform vec4 uO, uU; varying vec2 vUv; varying vec3 vW;
      vec2 at(float f){ return uO.xy + uU.xy * uO.z * cos(f) + uU.zw * uO.w * sin(f); }
      // the angle of the oval a way of metres astern of her, stepped along the oval's own length (24 steps by the midpoint rule)
      float astern(float f, float way){ float h = way / 24.; for (int i = 0; i < 24; i++){ float fm = f - .5 * h / max(length(vec2(uO.z * sin(f), uO.w * cos(f))), .6);
        f -= h / max(length(vec2(uO.z * sin(fm), uO.w * cos(fm))), .6); } return f; }
      void main(){ float t = uv.x, f = astern(uF, uSpan * t); vec2 c = at(f), d = normalize(at(f + .01) - at(f - .01)), n = vec2(-d.y, d.x);
        vec2 q = c + n * (uv.y - .5) * (2.5 + 9. * t); vUv = uv; vW = vec3(q.x, .22, q.y); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: /* glsl */`uniform float uTime, uFogD; uniform vec3 uCol, uFogC; varying vec2 vUv; varying vec3 vW;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){ float t = vUv.x, v = abs(vUv.y - .5) * 2.;
        float broken = smoothstep(.42, .7, vn(vec2(vW.x * .45, vW.z * .45) + uTime * .05) * .6 + .4 * vn(vec2(vW.x * 1.6 - uTime * .2, vW.z * 1.6)));
        float a = smoothstep(0., .04, t) * (1. - t) * (1. - t) * mix(smoothstep(1., .3, v), smoothstep(.2, .8, v) * smoothstep(1., .85, v), smoothstep(.1, .5, t)) * broken;
        if (a < .01) discard; float dist = length(vW - cameraPosition); gl_FragColor = vec4(mix(uFogC, uCol, exp(-pow(uFogD * dist, 2.))), a * .85); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  wake.frustumCulled = false; wake.renderOrder = 3; wake.name = 'lugger-wake'; world.scene.add(wake);
  world.updates.push((dt, time) => {
    for (const o of boats) { o.mesh.rotation.x = o.roll * Math.sin(time * TAU / o.tr + o.ph); o.mesh.rotation.z = o.pitch * Math.sin(time * TAU / o.tp + o.ph * 1.7); o.mesh.position.y = o.heave * Math.sin(time * TAU / o.tp + o.ph); }
    // she makes 2.2 m a second by the way sailed round her oval; she heels away from the wind by how far her heading lies
    // across it (no jump where she goes about), and nods on the swell
    const s = s0 + way * LUG.pace * time, f = angleAt(s), at = OV.at(f), aft = OV.at(angleAt(s - way * reach)), fore = OV.at(angleAt(s + way * reach)), vx = fore[0] - aft[0], vz = fore[1] - aft[1], vl = Math.hypot(vx, vz) || 1;
    lug.mesh.position.set(at[0], 0.1 * Math.sin(time * 0.9), at[1]);
    lug.mesh.rotation.y = Math.atan2(-vz, vx); lug.mesh.rotation.x = 6 * DEG * world.windSide * vz / vl + 1.5 * DEG * Math.sin(time * 0.8 + 1); lug.mesh.rotation.z = 1.2 * DEG * Math.sin(time * 1.1);
    world.lugAt.set(at[0], vx / vl, at[1], vz / vl); wake.material.uniforms.uF.value = f;
    // HER SAILS SWING ACROSS as she goes about: each lies off to leeward about its own mast (LUG.sheet degrees), by which side
    // of her the wind stands; as her bow comes through the wind's line the sail comes amidships, its belly goes flat, and it
    // fills on the other side
    const wd = world.light.uWind.value, lee = clamp((vx * wd.z - vz * wd.x) / (vl * Math.hypot(wd.x, wd.z)) / 0.3, -1, 1), sw = lee * (1.5 - 0.5 * lee * lee);
    for (const sm of lug.sails) { sm.rotation.y = LUG.sheet * DEG * sw; sm.scale.z = (sw < 0 ? -1 : 1) * Math.max(Math.abs(sw), 0.1); }
    { const ph = LUG.sheet * DEG * sw, cs = Math.cos(ph), sn = Math.sin(ph); world.lugSail.set((cs * vx + sn * vz) / vl, (cs * vz - sn * vx) / vl); }      // the sails' own line on the water's plan (the bay's mirror reads it)
  });
}

// ================================================================ what stands on the quay, in the stair and on the shore
// Everything here is a BODY and keeps its distance from the flown line by its PLACE (4 m and more in plan on the quay,
// all of it under y 13). The seed deals what stands where; nothing is laid by the eye.
async function buildThings(ctx, world) {
  const r = world.rngs.rQuay, rW = world.rngs.rWash, m = makeMason(), Q = QUAY, { path, M, stair } = world, q3 = new THREE.Vector3();
  m.set({ lamp: LAMP_BAKE });
  // distance from a place on the quay's flags to the flown line (from the beacon abeam to the lane over the west rows, every metre)
  const line = []; for (let d = M.beacon, k = 0; d <= M.lane; d += 1, k++) { path.posAtDist(d, q3); line.push([q3.x, q3.y - QUAY.y, q3.z]); if (k % 60 === 59) await ctx.yield(); }
  const off = (x, z) => { let b = Infinity; for (const p of line) b = Math.min(b, (p[0] - x) ** 2 + p[1] * p[1] + (p[2] - z) ** 2); return Math.sqrt(b); };
  // (an outside stair on a quay front stands on the flags: its ground is taken)
  const spots = world.town.outStairs.flatMap(([xa, xb, z]) => { const o = []; for (let x = xa + 2; x < xb; x += 3.5) o.push([x, z + 1.1, 2.2]); return o; }), free = (x, z, rad) => off(x, z) >= 4 + rad && !spots.some((o) => Math.hypot(o[0] - x, o[1] - z) < o[2] + rad + 0.6);
  const place = (rad, x0, x1, z0, z1, rr = r) => { for (let t = 0; t < 30; t++) { const x = rr.range(x0, x1), z = rr.range(z0, z1); if (free(x, z, rad)) { spots.push([x, z, rad]); return [x, z]; } } return null; };
  world.placeOnQuay = place;
  const n = (k) => Math.max(1, Math.round(k * world.density));
  world.spots = spots;
  // upturned boats, keels up: four on the quay under the house fronts, two on the shingle slip
  const turned = (x, y, z, yaw, L) => { m.set({ M: new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationX(Math.PI)) });
    hullInto(m, L, L * 0.36, linear(r.pick(P.hulls), 0.9), { open: true, freeboard: 1.5, bulwark: 0.4, draught: 0.9 }); m.set({ M: null }); };
  for (let i = 0; i < 4; i++) { const L = r.range(12, 16), at = place(L / 2, Q.x0 + 12, Q.x1 - 12, Q.z0 + 3.5, Q.z0 + 7); if (at) turned(at[0], Q.y + 2.0, at[1], r.range(-0.2, 0.2) + (r.chance(0.5) ? Math.PI : 0), L); }
  await ctx.yield();
  turned(-126, 2 + 2.0, 192, 0.5, 13); turned(-136, 2.5 + 2.0, 190, -0.3, 14);
  await ctx.yield();
  // barrels in knots of two to four
  for (let i = 0; i < n(5); i++) { const at = place(2.4, Q.x0 + 4, Q.x1 - 4, Q.z0 + 1.5, Q.z1 - 2.5); if (!at) continue;
    for (let k = 0, kn = r.int(2, 4); k < kn; k++) { const a = k / kn * TAU + r.range(0, 1), bx = at[0] + Math.cos(a) * 1.25, bz = at[1] + Math.sin(a) * 1.25;
      m.col(PAL.oak, r.range(0.5, 0.75)).set({ surf: SURF.WOOD }).post(bx, bz, Q.y, Q.y + 1.35, 0.78, 0.95, 10, { open: true, aoLow: 0.6 }); m.post(bx, bz, Q.y + 1.35, Q.y + 2.7, 0.95, 0.78, 10, { aoHigh: 0.95 }); } }
  await ctx.yield();
  // lobster pots in stacks, on the quay and on the jetty
  const pots = (x, z, base) => { for (let k = 0, kn = r.int(2, 5); k < kn; k++) { const px = x + (k % 2) * 1.7 - 0.8 + r.range(-0.15, 0.15), py = base + Math.floor(k / 2) * 1.25;
    m.col(PAL.rope, 0.6).set({ surf: SURF.NET }).box(px - 0.75, py, z - 1.1, px + 0.75, py + 1.2, z + 1.1, { no: 'b', aoLow: 0.7 }); } };
  for (let i = 0; i < n(4); i++) { const at = place(2.2, Q.x0 + 4, Q.x1 - 4, Q.z0 + 1.5, Q.z1 - 2.5); if (at) pots(at[0], at[1], Q.y); }
  for (const z of [JETTY.z0 + 4, JETTY.z0 + 9.5]) pots(JETTY.x0 + 2.2, z, JETTY.y);
  // rope coils
  for (let i = 0; i < n(5); i++) { const at = place(1.4, Q.x0 + 4, Q.x1 - 4, Q.z0 + 1.5, Q.z1 - 2.2); if (at) { m.col(PAL.rope, 0.7).set({ surf: SURF.PLAIN }).post(at[0], at[1], Q.y, Q.y + 0.5, 1.25, 1.1, 10, { aoLow: 0.6 }); m.col(PAL.rope, 0.3).post(at[0], at[1], Q.y + 0.5, Q.y + 0.52, 0.5, 0.5, 8, {}); } }
  // nets hung to dry between two poles, stirring at their lower edge
  for (let i = 0; i < n(4); i++) { const at = place(4.5, Q.x0 + 8, Q.x1 - 8, Q.z0 + 2.5, Q.z0 + 8); if (!at) continue;
    const yaw = r.range(-0.5, 0.5), ex = Math.cos(yaw) * 3.8, ez = Math.sin(yaw) * 3.8, a = [at[0] - ex, at[1] - ez], b = [at[0] + ex, at[1] + ez], top = Q.y + r.range(6.5, 8);
    m.col(PAL.spar).set({ surf: SURF.PLAIN }); bar(m, [a[0], Q.y, a[1]], [a[0], top + 0.4, a[1]], 0.16, {}); bar(m, [b[0], Q.y, b[1]], [b[0], top + 0.4, b[1]], 0.16, {}); bar(m, [a[0], top, a[1]], [b[0], top, b[1]], 0.07, {});
    m.col(PAL.rope, 0.75).set({ surf: SURF.NET }).quad([a[0], Q.y + 1.4, a[1]], [b[0], Q.y + 1.4, b[1]], [b[0], top, b[1]], [a[0], top, a[1]], { sub: 2, sway: [0.35, 0.35, 0, 0], ao: 0.9 }); }
  await ctx.yield();
  // ---- in the Net Stair: the arch, the garden wall of its first 30 m (west side), the washing line
  const ns = stair.near(ARCH.x, ARCH.z).s, c = stair.at(ns), ys = stair.stairY(ns), pt = (u, y, w) => [c.x + c.rx * u + c.tx * w, y, c.z + c.rz * u + c.tz * w];
  const NA = 10, soff = (u) => ys + ARCH.soffit - 2.2 * (u / STAIR.hw) ** 2, crown = ys + ARCH.soffit, topY = crown + 2.6, T = 1.3;
  for (let i = 0; i < NA; i++) { const u0 = -STAIR.hw + i * 2 * STAIR.hw / NA, u1 = u0 + 2 * STAIR.hw / NA, y0 = soff(u0), y1 = soff(u1);
    const lo0 = crown - 2.2 * (u0 / STAIR.hw) ** 2, lo1 = crown - 2.2 * (u1 / STAIR.hw) ** 2;
    m.col(PAL.stone, 0.9).set({ surf: SURF.STONE });
    m.quad(pt(u0, lo0, T), pt(u1, lo1, T), pt(u1, lo1, -T), pt(u0, lo0, -T), { ao: 0.55 });                                  // the soffit
    m.quad(pt(u1, lo1, -T), pt(u0, lo0, -T), pt(u0, topY, -T), pt(u1, topY, -T), { ao: [0.7, 0.7, 1, 1], uv: [u0, 0] });     // the face we come to
    m.quad(pt(u0, lo0, T), pt(u1, lo1, T), pt(u1, topY, T), pt(u0, topY, T), { ao: [0.7, 0.7, 1, 1], uv: [u0, 0] });
    m.col(PAL.slate, 0.9).set({ surf: SURF.SLATE }); m.quad(pt(u0, topY, -T - 0.3), pt(u1, topY, -T - 0.3), pt(u1, topY, T + 0.3), pt(u0, topY, T + 0.3), {}); }
  world.arch = { s: ns, crown };
  for (const [c0, c1, s0] of world.garden) { const top = stair.stairY(s0) + 4.4, a = stair.side(c0, -STAIR.hw), b = stair.side(c1, -STAIR.hw), a2 = stair.side(c0, -STAIR.hw - 0.9), b2 = stair.side(c1, -STAIR.hw - 0.9);
    m.col(PAL.stone, 0.95).set({ surf: SURF.STONE }); wall(m, a, b, stair.stairY(s0) - 1.5, top, { ao: [0.6, 0.6, 1, 1], uv: [s0, 0] }); wall(m, b2, a2, stair.stairY(s0) - 3, top, { ao: [0.6, 0.6, 1, 1] });
    wall(m, a2, a, stair.stairY(s0) - 3, top, {}); wall(m, b, b2, stair.stairY(s0) - 3, top, {});
    m.col(PAL.stone, 1.1); m.quad([a[0], top, a[1]], [b[0], top, b[1]], [b2[0], top, b2[1]], [a2[0], top, a2[1]], {}); }
  // WASHING ACROSS THE STAIR: the one line the brief places (at its given place), 17.5 m above its steps, no hem lower than
  // 14 m above them. What hangs on it is the seed's.
  const sw = stair.near(WASHING.x, WASHING.z).s, cloths = ['#C9CED6', '#AEB8C6', '#8E9AAE', '#D8D4CC', '#6F7C92'];
  const lines = [sw]; world.washLines = lines;
  for (const sl of lines) {
    const cw = stair.at(sl), yw = stair.stairY(sl), wp = (u, y) => [cw.x + cw.rx * u, y, cw.z + cw.rz * u];
    m.col(PAL.rope, 0.8).set({ surf: SURF.PLAIN }); bar(m, wp(-STAIR.hw, yw + WASHING.line), wp(STAIR.hw, yw + WASHING.line), 0.05, {});
    for (let u = -STAIR.hw + 0.7; u < STAIR.hw - 1.2;) { const w = rW.range(1.1, 2.9), drop = Math.min(WASHING.line - WASHING.hem, rW.range(1.6, 3.5)), top = yw + WASHING.line - 0.05;
      if (rW.chance(0.85)) { m.col(rW.pick(cloths), rW.range(0.8, 1)).set({ surf: SURF.CLOTH }); m.quad(wp(u, top - drop), wp(u + w, top - drop), wp(u + w, top), wp(u, top), { sub: 0.8, sway: [0.3, 0.3, 0, 0], ao: 0.95 }); }
      u += w + rW.range(0.2, 0.7); }
  }
  // the gutter down the stair's middle: a thread of water over every tread and down every riser, glinting as it runs
  // (a runnel of wet, darker stone 0.8 m wide, and in its middle a thread of water 0.3 m wide whose streaks of sky slide down it)
  { const NSTEP = Math.round((STAIR.y1 - STAIR.y0) / 0.5), rise = (STAIR.y1 - STAIR.y0) / NSTEP;
    for (const [hw, lift, surf, col, k] of [[0.4, 0.02, SURF.FLAGS, PAL.flags, 0.62], [0.16, 0.035, SURF.RUN, PAL.glass, 0.9]]) { m.col(col, k).set({ surf });
      for (let i = 0; i < NSTEP; i++) { const c0 = stair.at(i * stair.SL / NSTEP), c1 = stair.at((i + 1) * stair.SL / NSTEP), y = STAIR.y0 + (i + 1) * rise, a = stair.side(c0, -hw), b = stair.side(c0, hw), c = stair.side(c1, hw), d = stair.side(c1, -hw);
        m.quad([a[0], y + lift, a[1]], [b[0], y + lift, b[1]], [c[0], y + lift, c[1]], [d[0], y + lift, d[1]], { uv: [0, i * 1.1], ao: 0.9 });
        m.quad([a[0], y - rise, a[1]], [b[0], y - rise, b[1]], [b[0] - c0.tx * (lift + 0.01), y + lift, b[1] - c0.tz * (lift + 0.01)], [a[0] - c0.tx * (lift + 0.01), y + lift, a[1] - c0.tz * (lift + 0.01)], { uv: [0, i * 1.1 + 0.6], ao: 0.9 }); } } }
  await ctx.yield();
  world.washing = { s: sw, hem: stair.stairY(sw) + WASHING.hem };
  await ctx.yield();
  // ---- standing gulls (1.2 m long), each placed by the stone it stands on: the mole's parapet, the beacon's rim, the
  // jetty's west edge, one ridge of the upper street 12 m east of the last straight. The seed says which stones are taken.
  const gull = (x, y, z, yaw) => { const fx = Math.cos(yaw), fz = Math.sin(yaw), P3 = (k, h) => [x + fx * k, y + h, z + fz * k];
    m.col(PAL.chalk, 0.95).set({ surf: SURF.PLAIN }); bar(m, P3(-0.5, 0.5), P3(0.28, 0.62), 0.2, { r1: 0.17, ao: 0.9 }); bar(m, P3(0.2, 0.6), P3(0.38, 0.95), 0.12, { r1: 0.1 });
    m.col(PAL.slate, 1.0); bar(m, P3(-0.75, 0.5), P3(0.1, 0.72), 0.16, { r1: 0.19, ao: 0.85 });
    m.col(PAL.rope, 0.9); bar(m, P3(0.4, 0.95), P3(0.62, 0.9), 0.04, {}); bar(m, P3(-0.05, 0), P3(-0.05, 0.42), 0.03, {}); };
  // (their own stream, r2: they are dealt after the quay's loops of unfixed count, and no longer ride on that stream)
  const gulls = [], rG = world.rngs.rGulls;
  world.mole.cl.forEach((c2, i) => { if (i > 2 && i < 21 && rG.chance(0.45)) { const at = world.mole.off(c2, MOLE.hw - 0.6); gulls.push([at[0], MOLE.parapet, at[1], rG.range(0, TAU)]); } });
  for (let i = 0; i < 3; i++) if (rG.chance(0.7)) { const a = rG.range(0, TAU); gulls.push([BEACON.x + Math.cos(a) * 2.2, MOLE.y + BEACON.h - 3.7, BEACON.z + Math.sin(a) * 2.2, a]); }
  for (let i = 0; i < 4; i++) if (rG.chance(0.7)) gulls.push([JETTY.x0 + 0.5, JETTY.y, JETTY.z0 + 3 + i * 3.2 + rG.range(-0.8, 0.8), rG.range(2.4, 3.9)]);
  // the ridge gull stands on the east ridge of the upper street at the middle of the street's own length (a rule of the ridge)
  gulls.push([STREET.ridgeX, STREET.ridgeY + 0.05, (STREET.z0 + STREET.z1) / 2, rG.range(0.8, 2.2)]);
  // on the skerry: seabirds on the ledges of its stacks, facing the wind (the seed says which ledges are taken; their own
  // stream, the skerry's roost, so the ridge gulls dealt after them from the standing gulls' stream do not hang on their count)
  { const rR = world.rngs.rRoost; world.skerry.forEach((ledge, li) => { for (let i = 0; i < 3; i++) if (rR.chance(0.6)) { const p = world.skerryRoost[li](rR.range(0, TAU)); gulls.push([p[0], p[1], p[2], world.windSide > 0 ? 0 : Math.PI]); } }); }
  for (const g of gulls) gull(g[0], g[1], g[2], g[3]);
  world.gulls = gulls;
  // ---- the cat on the garden wall (1.5 m long), 5.4 m west of the stair's middle; its tail stirs
  if (world.garden.length) { const [c0, , s0] = world.garden[Math.min(1, world.garden.length - 1)], at = stair.side(stair.at(s0 + 3), -STAIR.hw - 0.45), y = stair.stairY(s0) + 4.4, c2 = stair.at(s0 + 3), P3 = (k, h, w = 0) => [at[0] + c2.tx * k + c2.rx * w, y + h, at[1] + c2.tz * k + c2.rz * w];
    m.col('#4A4A52').set({ surf: SURF.PLAIN }); bar(m, P3(-0.55, 0.36), P3(0.3, 0.42), 0.26, { r1: 0.22, ao: 0.9 }); bar(m, P3(0.3, 0.42), P3(0.42, 0.9), 0.2, { r1: 0.17 });
    m.post(P3(0.5, 0)[0], P3(0.5, 0)[2], y + 0.86, y + 1.2, 0.19, 0.15, 6, {});
    for (const w of [-0.1, 0.1]) m.tri(P3(0.44, 1.18, w - 0.06), P3(0.56, 1.18, w + 0.06), P3(0.5, 1.42, w), {});
    m.quad(P3(-0.55, 0.3, -0.05), P3(-0.55, 0.3, 0.05), P3(-0.95, 0.95, 0.05), P3(-0.95, 0.95, -0.05), { sway: [0, 0, 0.1, 0.1] });
    world.cat = [at[0], y + 1.4, at[1]]; }
  // ---- the well's thread of water, taking the lamp where the lamp's law gives it
  { const w = world.well, lv = world.lampLaw(w.x, w.y0, w.z, 0, 0.3, -0.95); m.col(PAL.chalk, 0.7).set({ surf: SURF.GLASS }); bar(m, [w.x, w.y0, w.z], [w.x, w.y1, w.z + 0.12], 0.05, { lamp: lv, r1: 0.07 }); }
  await world.bake(m);
  const mesh = new THREE.Mesh(m.geometry(), stoneMaterial(world.light, { side: THREE.DoubleSide })); mesh.name = 'things'; world.scene.add(mesh); world.thingsMat = mesh.material;
  // ---- the tower's weather vane: an iron arrow that swings a few degrees about the wind's bearing, on the world clock
  const vm = makeMason(); vm.col(PAL.iron, 1.3).set({ surf: SURF.PLAIN }); bar(vm, [-1.3, 0, 0], [1.2, 0, 0], 0.06, {});
  vm.tri([1.2, 0.32, 0], [1.2, -0.32, 0], [1.8, 0, 0], {}); vm.quad([-1.3, -0.4, 0], [-0.7, -0.4, 0], [-0.7, 0.4, 0], [-1.5, 0.4, 0], {});
  const vane = new THREE.Mesh(vm.geometry(), mesh.material); vane.name = 'vane'; vane.position.set(TOWER.x, TOWER.vane - 0.5, TOWER.z); world.scene.add(vane);
  const bearing = Math.atan2(-0.18, -world.windSide);
  world.updates.push((dt, time) => { vane.rotation.y = bearing + 0.14 * Math.sin(time * 0.7) + 0.05 * Math.sin(time * 1.9 + 1); });
}

// ================================================================ THE TOWN LIVED IN (r2, the lead's order D): small things of use, each
// by a rule of the place it stands in, all dealt from one stream of their own ('lived in'). Every one is a BODY and keeps
// its distance from the flown line by its PLACE: on the quay by the quay's own rule (4 m and more in plan, all under y 13),
// in the stair against the walls (4 m and more from the stair's middle, where the line flies).
async function buildLived(ctx, world) {
  const r = world.rngs.rLived, m = makeMason(), Q = QUAY, { stair } = world, place = world.placeOnQuay; m.set({ lamp: LAMP_BAKE });
  // ---- on the quay: a handcart, its shafts on the flags, a crate on its bed
  { const at = place(2.6, Q.x0 + 10, Q.x1 - 10, Q.z0 + 3, Q.z1 - 4, r), yaw = r.range(0, TAU);
    if (at) { const base = new THREE.Matrix4().makeTranslation(at[0], Q.y, at[1]).multiply(new THREE.Matrix4().makeRotationY(yaw)); m.set({ M: base });
      m.col(PAL.oak, 0.8).set({ surf: SURF.WOOD }).box(-1.9, 1.5, -1.0, 1.9, 1.72, 1.0, { aoLow: 0.6 }); m.box(-1.9, 1.72, -1.0, 1.9, 2.3, -0.9, {}); m.box(-1.9, 1.72, 0.9, 1.9, 2.3, 1.0, {});
      // (its two wheels are discs on a level axle: drawn as short posts in a frame turned a quarter about x)
      m.set({ M: base.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)) }); m.col(PAL.oak, 0.55).set({ surf: SURF.WOOD });
      for (const z of [-1.18, 1.18]) m.post(0.2, -1.05, z - 0.08, z + 0.08, 1.05, 1.05, 12, {});
      m.set({ M: base }); m.col(PAL.oak, 0.65).set({ surf: SURF.PLAIN }); for (const z of [-0.8, 0.8]) bar(m, [1.9, 1.6, z], [4.6, 0.12, z], 0.09, {}); bar(m, [-1.7, 1.5, 0], [-1.7, 0, 0], 0.1, {});
      m.col(PAL.oak, 1.0).set({ surf: SURF.WOOD }).box(-1.2, 1.72, -0.7, 0.3, 2.6, 0.7, { no: 'b', aoLow: 0.7 }); m.set({ M: null }); } }
  await ctx.yield();
  // ---- a bench against the quay's house fronts, and one on the square's east side, facing the well
  const bench = (x, y, z, yaw) => { m.set({ M: new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(yaw)) });
    m.col(PAL.oak, 0.85).set({ surf: SURF.WOOD }).box(-2.4, 1.2, -0.55, 2.4, 1.38, 0.55, { aoLow: 0.6 }); m.box(-2.4, 1.38, -0.55, 2.4, 2.5, -0.43, {});
    m.col(PAL.stone, 0.9).set({ surf: SURF.STONE }); for (const x2 of [-1.9, 1.9]) m.box(x2 - 0.25, 0, -0.5, x2 + 0.25, 1.2, 0.5, { no: 'b', aoLow: 0.6 }); m.set({ M: null }); };
  { const at = place(2.6, Q.x0 + 10, Q.x1 - 10, Q.z0 + 1.0, Q.z0 + 1.6, r); if (at) bench(at[0], Q.y, at[1], 0); }
  bench(SQUARE.x1 - 1.3, SQUARE.y, WELL.z, -Math.PI / 2);
  await ctx.yield();
  // ---- mooring rings on the quay's face, one every 16 m from its west end: an iron staple and a ring hanging from it
  for (let x = Q.x0 + 9; x < Q.x1 - 4; x += 16) { const y = Q.y - 1.5, z = Q.z1 + 0.09; m.col(PAL.iron, 1.5).set({ surf: SURF.PLAIN });
    bar(m, [x - 0.2, y + 0.62, z - 0.05], [x + 0.2, y + 0.62, z - 0.05], 0.09, {});
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, a1 = (k + 1) / 8 * TAU; bar(m, [x + Math.cos(a0) * 0.55, y + Math.sin(a0) * 0.55, z], [x + Math.cos(a1) * 0.55, y + Math.sin(a1) * 0.55, z], 0.07, {}); } }
  await ctx.yield();
  // ---- in the Net Stair, against its walls (4.2 m from its middle), at the corners of its houses: a tub of herbs on a
  // tread (more often than not), a boot scraper beside it (sometimes); and outside the upper windows of seven houses in ten a
  // GALLERY: a rail on two brackets, 11.5 m above the steps and 3.9 m from the stair's middle, with a wash hung on it
  const NSTEP = Math.round((STAIR.y1 - STAIR.y0) / 0.5), rise = (STAIR.y1 - STAIR.y0) / NSTEP, run = stair.SL / NSTEP, NH = Math.round(stair.SL / 9.6), cloths = ['#C9CED6', '#AEB8C6', '#8E9AAE', '#D8D4CC', '#6F7C92'];
  const onTread = (sv) => { const i = clamp(Math.floor(sv / run), 0, NSTEP - 1); return { c: stair.at((i + 0.5) * run), y: STAIR.y0 + (i + 1) * rise }; };
  // (world.galleries: the hem corners of every hung cloth and net with the reach of their sway, and the rails' ends: the count reads the clear air to each)
  world.galleries = [];
  for (const sg of [1, -1]) for (let k = 1; k < NH; k++) {
    const s0 = k * stair.SL / NH, tub = r.chance(0.6), scraper = r.chance(0.35), gallery = r.chance(0.7), turn = r.range(0, TAU), nCloth = r.int(3, 5);
    const nw = r.range(3.4, 5.2), nd = r.range(4, 5.8), nAt = r.range(-1.2, 1.2);
    if (tub) { const t = onTread(s0 + sg * 0.9), p = stair.side(t.c, sg * (STAIR.hw - 0.8));
      m.col(PAL.oak, 0.7).set({ surf: SURF.WOOD }).post(p[0], p[1], t.y, t.y + 1.0, 0.5, 0.62, 9, { aoLow: 0.6 });
      m.col(PAL.vine, 0.55).set({ surf: SURF.LEAF, sway: 0.05 }).post(p[0], p[1], t.y + 0.95, t.y + 1.5, 0.58, 0.84, 7, { aoLow: 0.6, open: true }); m.post(p[0], p[1], t.y + 1.5, t.y + 2.2, 0.84, 0.3, 7, { aoLow: 0.85 }); m.set({ sway: 0 }); }
    if (scraper) { const t = onTread(s0 - sg * 1.3), c = t.c, p = stair.side(c, sg * (STAIR.hw - 0.5)); m.col(PAL.iron, 1.4).set({ surf: SURF.PLAIN });
      for (const w of [-0.45, 0.45]) bar(m, [p[0] + c.tx * w, t.y, p[1] + c.tz * w], [p[0] + c.tx * w, t.y + 0.55, p[1] + c.tz * w], 0.05, {});
      bar(m, [p[0] - c.tx * 0.45, t.y + 0.4, p[1] - c.tz * 0.45], [p[0] + c.tx * 0.45, t.y + 0.4, p[1] + c.tz * 0.45], 0.035, {}); }
    const sm = s0 + 0.5 * stair.SL / NH; if ((sg < 0 && sm < 31 + 5) || sm > stair.SL - 4) continue;
    const c = stair.at(sm), y = stair.stairY(sm) + 11.5, gp = (w, off, h) => { const q = stair.side(c, sg * (STAIR.hw - off)); return [q[0] + c.tx * w, y + h, q[1] + c.tz * w]; };
    // A NET HUNG TO DRY UNDER THE EAVE (the brief's net lofts) on every house of the stair that has no gallery: a spar on two
    // iron hooks 15.4 m above the steps and 0.55 m off the wall (4.45 m from the stair's middle), the net falling 4 to 5.8 m
    // from it, its foot rope stirring up to half a metre on the wind: never lower than 9.6 m over the steps at its middle
    if (!gallery) { const top = 3.9, w0 = nAt - nw / 2, w1 = nAt + nw / 2;
      m.col(PAL.iron, 1.3).set({ surf: SURF.PLAIN }); for (const w of [w0 + 0.3, w1 - 0.3]) bar(m, gp(w, 0, top + 0.5), gp(w, 0.55, top), 0.05, {});
      m.col(PAL.oak, 0.6).set({ surf: SURF.WOOD }); bar(m, gp(w0 - 0.4, 0.55, top), gp(w1 + 0.4, 0.55, top), 0.11, {});
      m.col(PAL.rope, 0.62).set({ surf: SURF.NET }); m.quad(gp(w0, 0.55, top - nd), gp(w1, 0.55, top - nd), gp(w1, 0.55, top - 0.1), gp(w0, 0.55, top - 0.1), { sub: 1.3, sway: [0.5, 0.5, 0.03, 0.03], ao: 0.9, uv: [turn, 0] });
      m.col(PAL.rope, 0.8).set({ surf: SURF.PLAIN, sway: 0.5 }); bar(m, gp(w0, 0.55, top - nd), gp(w1, 0.55, top - nd), 0.06, {}); m.set({ sway: 0 });
      for (const f of [0, 0.5, 1]) world.galleries.push([gp(lerp(w0, w1, f), 0.55, top - nd), 0.6]);
      continue; }
    m.col(PAL.iron, 1.3).set({ surf: SURF.PLAIN }); for (const w of [-2, 2]) { bar(m, gp(w, 0, 0), gp(w, 1.1, 0), 0.06, {}); bar(m, gp(w, 0, -0.9), gp(w, 0.8, 0), 0.045, {}); } bar(m, gp(-2.2, 1.1, 0), gp(2.2, 1.1, 0), 0.05, {});
    let w = -2.1; for (let i = 0; i < nCloth && w < 1.2; i++) { const cw = r.range(0.8, 1.4), drop = r.range(1.3, 2.6); m.col(r.pick(cloths), r.range(0.8, 1)).set({ surf: SURF.CLOTH });
      m.quad(gp(w, 1.1, -drop), gp(w + cw, 1.1, -drop), gp(w + cw, 1.1, -0.03), gp(w, 1.1, -0.03), { sub: 0.7, sway: [0.28, 0.28, 0, 0], ao: 0.95, uv: [w + turn, 0] });
      world.galleries.push([gp(w, 1.1, -drop), 0.35], [gp(w + cw, 1.1, -drop), 0.35]); w += cw + r.range(0.15, 0.4); }
    world.galleries.push([gp(-2.2, 1.1, 0), 0.1], [gp(2.2, 1.1, 0), 0.1]);
    if (k % 4 === 3) await ctx.yield();
  }
  await world.bake(m);
  const mesh = new THREE.Mesh(m.geometry(), world.thingsMat); mesh.name = 'lived-in'; world.scene.add(mesh);
  await ctx.yield();
}

// ================================================================ THINGS THAT MOVE (r2, order D), all on the world clock:
// GULLS ON RIDGES THAT LIFT AND SETTLE, and THE VINE'S LEAVES DRIFTING DOWN THE UPPER STREET (the brief's, bound by leadAmends 2).
async function buildMoving(ctx, world) {
  const rG = world.rngs.rGulls, rL = world.rngs.rLeaves, fogU = { uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } };
  // ---- ridge gulls. The rule: on the ridge of a house that walls a street (the Net Stair's houses, the upper street's) or
  // that stands within 30 m of the rise's line in plan (the roofs the rise flies over), at a place along the ridge the
  // stream deals, where the ridge with the gull's whole lift (3.5 m) stands 6 m and more from the
  // line. Each stands with folded wings and, once in a round of its own (9 to 17 s), lifts a few metres on beating wings,
  // hangs, and settles again where it stood.
  const perch = [];
  for (const h of world.town.houses) { const take = rG.chance(0.45), f = rG.range(0.2, 0.8), per = rG.range(9, 17), ph = rG.range(0, 1), yaw = rG.range(0, TAU), lift = rG.range(1.8, 3.2);
    if (!take || !(h.street || world.riseOff(h.fp) < 30)) continue; const x = lerp(h.ridge[0][0], h.ridge[1][0], f), z = lerp(h.ridge[0][1], h.ridge[1][1], f);
    if (Math.min(world.near(x, h.rd + 0.5, z), world.near(x, h.rd + 3.5, z)) < 6 + 1.5) continue;
    // (r5m1: a flank house of the upper street carries a drying line over its ridge: its gull stands on the head of the
    // nearer pole, over the line, and lifts from there; the same gull by the same draws)
    if (isFlank(h)) { const [pa, pb] = flankPoles(h), pp = Math.hypot(pa[0] - x, pa[2] - z) < Math.hypot(pb[0] - x, pb[2] - z) ? pa : pb; perch.push({ x: pp[0], y: pp[1] + 0.02, z: pp[2], yaw, per, ph, lift, house: h }); continue; }
    perch.push({ x, y: h.rd + 0.02, z, yaw, per, ph, lift, house: h }); }
  world.ridgeGulls = perch;
  if (perch.length) {
    // a gull in its own frame: +x forward, y up, z across; aK 0 body (white), 1 wing (grey, folds), 2 beak and feet
    const pos = [], kind = [], tri = (a, b, c, k) => { pos.push(...a, ...b, ...c); kind.push(k, k, k); };
    const nose = [0.55, 0.62, 0], tail = [-0.75, 0.5, 0], top = [0.05, 0.86, 0], belly = [0, 0.32, 0], L = [0, 0.56, 0.24], R = [0, 0.56, -0.24];
    for (const [a, b] of [[top, L], [L, belly], [belly, R], [R, top]]) { tri(nose, a, b, 0); tri(tail, b, a, 0); }
    const head = [0.62, 1.05, 0]; for (const [a, b] of [[[0.4, 0.78, 0.12], [0.4, 0.78, -0.12]], [[0.4, 0.78, -0.12], [0.3, 1.0, 0]], [[0.3, 1.0, 0], [0.4, 0.78, 0.12]]]) tri(head, a, b, 0);
    tri([0.62, 1.05, 0.05], [0.62, 1.05, -0.05], [0.92, 0.98, 0], 2); tri([0, 0.32, 0.06], [0, 0.32, -0.06], [0.02, 0, 0], 2);
    for (const sd of [1, -1]) { tri([0.3, 0.74, sd * 0.2], [-0.45, 0.7, sd * 0.2], [-0.15, 0.74, sd * 1.5], 1); tri([0.3, 0.74, sd * 0.2], [-0.15, 0.74, sd * 1.5], [0.12, 0.74, sd * 1.0], 1); }
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kind, 1));
    const ia = new Float32Array(perch.length * 4), ib = new Float32Array(perch.length * 4); perch.forEach((q, i) => { ia.set([q.x, q.y, q.z, q.yaw], i * 4); ib.set([q.per, q.ph, q.lift, 1.35], i * 4); });
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(ia, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(ib, 4)); g.instanceCount = perch.length;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 50, 100), 160);
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide,
      uniforms: { uTime: world.light.uTime, uSky: world.light.uSky, uAmb: world.light.uAmb, uKeyCol: world.light.uKeyCol, ...fogU },
      vertexShader: /* glsl */`
        attribute vec4 iA, iB; attribute float aK; uniform float uTime; varying float vK; varying vec3 vP;
        void main(){
          float cyc = fract(uTime / iB.x + iB.y), up = smoothstep(0., .07, cyc) * (1. - smoothstep(.22, .32, cyc));
          vec3 p = position;
          if (aK > .5 && aK < 1.5) { float sd = sign(p.z), out1 = abs(p.z) - .2, beat = sin(uTime * 8.5 + iB.y * 31.);
            p.z = sd * (.2 + out1 * mix(.1, 1., up)); p.y += out1 * (.6 * beat) * up - .1 * (1. - up) * out1; }
          float a = iA.w + .6 * sin(cyc * 19.) * up, c = cos(a), s = sin(a);
          vec3 w = iA.xyz + vec3(.7 * sin(cyc * 23.) * up, iB.z * up, .7 * cos(cyc * 23.) * up) + (vec3(c, 0., s) * p.x + vec3(0., 1., 0.) * p.y + vec3(-s, 0., c) * p.z) * iB.w;
          vK = aK; vP = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSky, uKeyCol, uFogC; uniform float uAmb, uFogD; varying float vK; varying vec3 vP;
        void main(){ vec3 alb = vK < .5 ? vec3(.86, .86, .84) : vK < 1.5 ? vec3(.46, .49, .55) : vec3(.6, .5, .32);
          vec3 col = alb * (uSky * uAmb * .62 + uKeyCol * .16); float dist = length(vP - cameraPosition);
          gl_FragColor = vec4(mix(uFogC, col, exp(-uFogD * uFogD * dist * dist)), 1.); }`,
    }));
    mesh.name = 'ridge-gulls'; world.scene.add(mesh);
  }
  await ctx.yield();
  // ---- the vine's leaves, let go below the sill and carried down the upper street's steps and out over the square's flags.
  // Each leaf's whole way is a law of place and the world clock: it leaves the vine's foot (x -8 to -5.6, under y 61.5),
  // goes down the street inside its walls (x -4.4 to 4.4 with its own swing), 0.3 to 2.6 m over the steps (the street's floor is 55 at its
  // head and 49 at its mouth: no leaf is ever above y 62, on either wind), and is gone 18 m out over the square.
  const NL = 110, lg = new THREE.InstancedBufferGeometry(), la = new Float32Array(NL * 4), lb = new Float32Array(NL * 4);
  lg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.3, 0.5, 0, -0.3, 0.5, 0, 0.3, -0.5, 0, -0.3, 0.5, 0, 0.3, -0.5, 0, 0.3], 3));
  for (let i = 0; i < NL; i++) { la.set([rL.range(-8, -5.6), rL.range(0.3, 2.6), rL.range(-3.1, 3.1), rL.range(0, 1)], i * 4); lb.set([rL.range(17, 30), rL.range(0, TAU), rL.range(0.3, 0.52), rL.range(0.7, 1.15)], i * 4); }
  lg.setAttribute('iA', new THREE.InstancedBufferAttribute(la, 4)); lg.setAttribute('iB', new THREE.InstancedBufferAttribute(lb, 4)); lg.instanceCount = NL;
  lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 54, 50), 60);
  const leaves = new THREE.Mesh(lg, new THREE.ShaderMaterial({ side: THREE.DoubleSide,
    uniforms: { uTime: world.light.uTime, uBreath: world.light.uBreath, uSky: world.light.uSky, uAmb: world.light.uAmb, uLampCol: world.light.uLampCol, uRun: { value: new THREE.Vector4(HOUSE.wall + 1.2, STREET.z1 + 18, STREET.y0, STREET.y1) }, uZ: { value: new THREE.Vector2(STREET.z0, STREET.z1) }, ...fogU },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; uniform float uTime; uniform vec4 uRun; uniform vec2 uZ; varying float vA, vTone; varying vec3 vP;
      void main(){
        float f = fract(uTime / iB.x + iA.w), z = mix(uRun.x, uRun.y, f), k = clamp((z - uZ.x) / (uZ.y - uZ.x), 0., 1.);
        float floorY = mix(uRun.z, uRun.w, k), inStreet = smoothstep(0., .1, f);
        float x = mix(iA.x, iA.z + 1.3 * sin(f * 31. + iB.y), inStreet);
        float y = floorY + mix(4.5, iA.y + .5 * sin(f * 47. + iB.y * 3.), inStreet);
        float a = uTime * (2.2 + iB.w) + iB.y, b = uTime * 1.7 + iB.y * 2.;
        // (a leaf grows from nothing where it is let go and dwindles to nothing where it is gone: none is seen to appear or vanish)
        vA = smoothstep(0., .03, f) * (1. - smoothstep(.9, 1., f));
        vec3 p = position * iB.z * vA; p.yz = vec2(p.y * cos(a) - p.z * sin(a), p.y * sin(a) + p.z * cos(a)); p.xy = vec2(p.x * cos(b) - p.y * sin(b), p.x * sin(b) + p.y * cos(b));
        vec3 w = vec3(x, y, z) + p; vTone = iB.w; vP = w;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky, uLampCol, uFogC; uniform float uAmb, uFogD, uBreath; varying float vA, vTone; varying vec3 vP;
      void main(){ if (vA < .02) discard; float d = length(vP - vec3(0., 70., 0.)), far = max(0., d - 17.) / 60.;
        vec3 alb = vec3(.32, .42, .24) * vTone, col = alb * uSky * uAmb * .7 + uLampCol * (.5 / (1. + far * far)) * uBreath * (.5 + alb.g);
        float dist = length(vP - cameraPosition); gl_FragColor = vec4(mix(uFogC, col, exp(-uFogD * uFogD * dist * dist)), 1.); }`,
  }));
  leaves.name = 'vine-leaves'; world.scene.add(leaves);
  await ctx.yield();
}

// ================================================================ THE COUNT (at build, on this seed's own layout): every kind of
// body against the flown line at every metre of it. A moored boat that would stand within 6 m of the line is not moored.
async function countClear(ctx, world) {
  const { path } = world, pts = [], q = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 1) { path.posAtDist(d, q); pts.push([q.x, q.y, q.z]); if (d % 60 === 59) await ctx.yield(); }
  const near = (x, y, z) => { let b = Infinity; for (const p of pts) { const dd = (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2; if (dd < b) b = dd; } return Math.sqrt(b); };
  const round = (v) => Math.round(v * 10) / 10, boatClear = world.boatClear;
  const out = { boats: Infinity, birds: Infinity, quayThings: Infinity, lugger: Infinity, gulls: Infinity };
  out.boatsPlaced = world.boats.length;
  { const keep = []; for (const o of world.boats) { await ctx.yield(); const c = boatClear(o); if (c < 6) { world.scene.remove(o.mesh); continue; } out.boats = Math.min(out.boats, c); keep.push(o); } world.boats = keep; }
  await ctx.yield();
  for (const b of world.birdRings) for (let i = 0; i < 16; i++) { if (i === 0) await ctx.yield(); const a = i / 16 * TAU, R = Math.abs(b.R); out.birds = Math.min(out.birds, near(b.c[0] + Math.cos(a) * R, b.c[1], b.c[2] + Math.sin(a) * R) - 1.2 - b.size * 0.6); }
  for (let i = 0; i < 48; i++) { const at = world.oval.at(i / 48 * TAU); for (const y of [0, 17, 34]) out.lugger = Math.min(out.lugger, near(at[0], y, at[1]) - 13); }
  await ctx.yield();
  for (const g of world.gulls) out.gulls = Math.min(out.gulls, near(g[0], g[1] + 0.6, g[2]) - 0.8);
  await ctx.yield();
  for (const sp of world.spots) { for (const p of pts) { const dh = Math.max(0, Math.sqrt((p[0] - sp[0]) * (p[0] - sp[0]) + (p[2] - sp[1]) * (p[2] - sp[1])) - sp[2]), dv = Math.max(0, p[1] - 13), dd = Math.sqrt(dh * dh + dv * dv); if (dd < out.quayThings) out.quayThings = dd; } await ctx.yield(); }
  await ctx.yield();
  if (world.cat) out.cat = round(near(world.cat[0], world.cat[1], world.cat[2]));
  out.ridgeGulls = Infinity; for (const q of world.ridgeGulls) out.ridgeGulls = Math.min(out.ridgeGulls, near(q.x, q.y + 0.5, q.z) - 1.5, near(q.x, q.y + q.lift, q.z) - 2.6); out.ridgeGulls = out.ridgeGulls === Infinity ? null : round(out.ridgeGulls);
  await ctx.yield();
  out.galleries = Infinity; { let k = 0; for (const [p, rad] of world.galleries) { out.galleries = Math.min(out.galleries, near(p[0], p[1], p[2]) - rad); if (++k % 40 === 39) await ctx.yield(); } } out.galleries = out.galleries === Infinity ? null : round(out.galleries);
  const st = world.stair, cw = st.at(world.washing.s), ca = st.at(world.arch.s);
  out.washingHem = round(near(cw.x, world.washing.hem, cw.z)); out.archSoffit = round(near(ca.x, world.arch.crown, ca.z));
  out.eaveEdge = round(Math.hypot(STREET.eaveX + 0.5, W0[1] - STREET.eaveY - 0.5 * (STREET.ridgeY - STREET.eaveY) / (STREET.ridgeX - STREET.eaveX))); out.sightMargin = round(world.sightMargin);
  for (const k of ['boats', 'birds', 'lugger', 'gulls', 'quayThings']) out[k] = round(out[k]);
  // THE RISE'S RULE, counted at every metre of the line from the beacon abeam to 12 m before the upper street's trough (whose
  // flank houses are the last straight's own walls): the lens over
  // what it crosses (a house's ridge and stacks with its eaves' reach, a moored mast) and aside in plan from every house
  // that stands higher than it
  { const hs = world.town.houses.map((h) => ({ fp: h.fp, top: h.top })), M = world.M;
    out.overRoofs = Infinity; out.asideHigher = Infinity; out.overMasts = Infinity;
    for (let d = Math.round(M.beacon); d <= M.trough - 12; d++) { const p = pts[d];
      for (const h of hs) { const off = planOff(h.fp, p[0], p[2]); if (off <= REACH) out.overRoofs = Math.min(out.overRoofs, p[1] - h.top); if (h.top > p[1]) out.asideHigher = Math.min(out.asideHigher, off); }
      for (const o of world.boats) if (Math.hypot(o.x - p[0], o.z - p[2]) < o.L / 2 + 2) out.overMasts = Math.min(out.overMasts, p[1] - o.top);
      if (d % 12 === 11) await ctx.yield(); }
    for (const k of ['overRoofs', 'asideHigher', 'overMasts']) out[k] = out[k] === Infinity ? null : round(out[k]); }
  await ctx.yield();
  out.rays = world.lampLaw.cast; out.stair = [round(st.SL), round(world.arch.s), ...world.washLines.map(round)];
  out.boatsMoored = world.boats.length; out.stacks = world.stackCount; out.smokes = world.smokes; out.smokeClear = world.smokeClear; out.weather = world.weather; out.windSide = world.windSide;
  await ctx.yield();
  let low = Infinity; for (let i = 0; i < pts.length; i++) { const p = pts[i]; low = Math.min(low, p[1] - Math.max(0.5, world.ground.h(p[0], p[2]))); if (i % 120 === 119) await ctx.yield(); } out.lensOverGround = round(low);
  return out;
}

// ================================================================ the life: smoke (a medium), birds on their rings (bodies, kept off the line by place)
async function buildLife(ctx, world) {
  const { rSmoke, rBirds } = world.rngs, hero = world.hero;
  world.stackCount = world.town.stacks.length + hero.anchors.chimneys.length;
  // ---- SMOKE (r5): SOFT SMOKE, A MEDIUM. A RULE OF THE HOUSE says who smokes: of the houses that carry a stack (the
  // tall house among them) two in five have a fire lit this evening, and a lit house smokes from ONE of its stacks
  // (the smoke's own stream, the fork 'smoke' of the head's list, which deals nothing else; every house takes the same
  // count of draws from it, lit or not, so nothing of the line can shift it). A PLUME is a string of soft round puffs (SMOKE.n of them) that leave the pot thin and
  // close, one behind the other, travel up the plume by the world clock, widen as they rise and lean down the world's
  // one wind (the same lean for every plume, stronger the higher: SMOKE.lean of the plume's height at its head), and
  // above the middle thin unevenly, so that two or three soft puffs roll on alone and are gone. A plume stands 10 to
  // 16 m (every house is taller than that). BY PLACE: a plume any part of whose body, at any sway, would lie within
  // SMOKE.clear metres of the flown line IN PLAN is not lit (so none is flown through, over or under, and none crosses
  // before the window); the least clear air of those lit is counted. Near the lens a puff thins as a medium (0.8 to
  // 2.5 m). Its tone is a dusk grey with a little lilac, a little warm on its side toward the last light; where it
  // stands in the lamp's cone above the roofs' shade it takes a little of the gold, never more than a warm grey.
  const NP = SMOKE.n, plumes = [], rH = rSmoke;
  { const wd = world.light.uWind.value, wl = Math.hypot(wd.x, wd.z) || 1, wx = wd.x / wl, wz = wd.z / wl, LN = world.line, FAR = 60;
    // (counted against every metre of the line that lies within FAR m of the pot in plan: a plume's whole body lies within
    // 22 m of its pot, so no other metre of the line can come within FAR - 26 m of it, which stands as the figure there)
    const homes = world.town.houses.filter((h) => h.tops.length).map((h) => h.tops);
    homes.push(hero.anchors.chimneys.map((c) => [c.x + hero.object.position.x, c.y + hero.object.position.y, c.z + hero.object.position.z]));
    let least = Infinity, leastPlan = Infinity, k = 0;
    for (const tops of homes) {
      const lit = rH.chance(0.4), t = tops[Math.floor(rH() * tops.length)], pl = { t, ph: rH(), H: rH.range(10, 16), r1: rH.range(2.8, 4), T: rH.range(8, 12), puffs: [] };
      for (let j = 0; j < NP; j++) pl.puffs.push([rH(), rH.range(0.15, 0.45) * (rH.chance(0.5) ? 1 : -1), rH()]);
      if (!lit) continue;
      // the plume's body at its two reaches of the wind's breath, a puff's greatest breadth and the plume's own wander about it
      const by = []; for (let i = 0; i < LN.length; i += 3) { const dx = LN[i] - t[0], dz = LN[i + 2] - t[2]; if (dx * dx + dz * dz < FAR * FAR) by.push(i); }
      let plan = FAR - 26, air = FAR - 26;
      for (let j = 0; j <= NP; j++) { const s = j / NP, up = pl.H * (1 - Math.pow(1 - s, 1.7)), wander = 0.25 * s + 0.9 * s * s, rad = (0.6 + (pl.r1 - 0.6) * Math.pow(s, 0.7)) * 1.18 * 1.4;
        for (const gust of [0.8, 1]) { const lee = pl.H * SMOKE.lean * Math.pow(s, 1.35) * gust, x = t[0] + wx * lee, z = t[2] + wz * lee;
          let p2 = Infinity, a2 = Infinity; for (const i of by) { const dx = LN[i] - x, dy = LN[i + 1] - t[1] - up, dz = LN[i + 2] - z, dd = dx * dx + dz * dz; if (dd < p2) p2 = dd; if (dd + dy * dy < a2) a2 = dd + dy * dy; }
          plan = Math.min(plan, Math.sqrt(p2) - rad - wander); air = Math.min(air, Math.sqrt(a2) - rad - wander - 0.5 * s * s); } }
      if (++k % 4 === 3) await ctx.yield();
      if (plan < SMOKE.clear) continue;
      leastPlan = Math.min(leastPlan, plan); least = Math.min(least, air); plumes.push(pl);
    }
    world.smokes = plumes.length; world.smokeClear = plumes.length ? [Math.round(least * 10) / 10, Math.round(leastPlan * 10) / 10] : null;
    // THE UPPER STREET'S OWN STACKS SMOKE (r5m1, the lead's ruling c): every stack of its flank houses carries the same
    // soft rolling smoke, each plume dealt from a stream of its own ('street hearths', forked by name; every stack takes
    // the same count of draws). A stack the house's own rule has lit above keeps that plume. BY PLACE a street stack is
    // not lit where it stands upwind of the axis within 20 m of the opening's plane, where any part of its body at any
    // sway would lie in the box about the line (nearer than 6 m aside in plan AND less than 6 m above it), or where it
    // would stand in the sight of the tall house's front from the last 90 m of the line. The least figures are counted.
    { const rS = ctx.core.makeRng(ctx.core.hashSeed('street hearths:' + ctx.seed)), D = DRYING, st = { stacks: 0, lit: 0, aside: Infinity, over: Infinity, sight: Infinity };
      for (const h of world.town.houses) { if (!isFlank(h)) continue;
        for (const t of h.tops) { const pl = { t, ph: rS(), H: rS.range(10, 16), r1: rS.range(2.8, 4), T: rS.range(8, 12), puffs: [] }; st.stacks++;
          for (let j = 0; j < NP; j++) pl.puffs.push([rS(), rS.range(0.15, 0.45) * (rS.chance(0.5) ? 1 : -1), rS()]);
          if (plumes.some((q) => q.t === t)) { st.lit++; continue; }
          if (t[0] * wx < 0 && t[2] < 20) continue;
          const by = []; for (let i = 0; i < LN.length; i += 3) { const dx = LN[i] - t[0], dz = LN[i + 2] - t[2]; if (dx * dx + dz * dz < FAR * FAR) by.push(i); }
          let ok = true, aside = Infinity, over = Infinity, sight = Infinity;
          for (let j = 0; j <= NP; j++) { const s = j / NP, up = pl.H * (1 - Math.pow(1 - s, 1.7)), wander = 0.25 * s + 0.9 * s * s, rad = (0.6 + (pl.r1 - 0.6) * Math.pow(s, 0.7)) * 1.18 * 1.4;
            for (const gust of [0.8, 1]) { const lee = pl.H * SMOKE.lean * Math.pow(s, 1.35) * gust, x = t[0] + wx * lee, z = t[2] + wz * lee, y = t[1] + up - rad - 0.5 * s * s;
              let p2 = Infinity, ly = W0[1]; for (const i of by) { const dx = LN[i] - x, dz = LN[i + 2] - z, dd = dx * dx + dz * dz; if (dd < p2) { p2 = dd; ly = LN[i + 1]; } }
              const plan = Math.sqrt(p2) - rad - wander; if (plan >= 6) aside = Math.min(aside, plan); else { over = Math.min(over, y - ly); if (y - ly < 6) ok = false; }
              if (z > 0 && z < D.last) { const fm = 1 - z / D.last; sight = Math.min(sight, Math.max(Math.abs(x) - rad - wander - D.front * fm, y - (W0[1] + (HOUSE.eaves - WIN.yc) * fm))); } } }
          if (!ok || sight < 0.5) continue;
          st.lit++; st.aside = Math.min(st.aside, aside); st.over = Math.min(st.over, over); st.sight = Math.min(st.sight, sight); plumes.push(pl); }
        await ctx.yield(); }
      for (const k of ['aside', 'over', 'sight']) st[k] = st[k] === Infinity ? null : Math.round(st[k] * 10) / 10;
      world.streetSmoke = st; } }
  const sg = new THREE.InstancedBufferGeometry(), nI = plumes.length * NP;
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
  const io = new Float32Array(nI * 4), ip = new Float32Array(nI * 4), ik = new Float32Array(nI * 4), clearY = new Float32Array(nI);
  // THE LAMP ON SMOKE, the same law of place: over each smoking stack the height is found (to a metre) above which a
  // straight line to the window is clear; the plume keeps the dusk under it and takes the lamp's gold over it
  for (let i = 0; i < plumes.length; i++) { const pl = plumes[i], t = pl.t; let y = 999;
    if (t[2] > HOUSE.wall + 1) for (let k = 0; k <= 17; k++) if (world.lampLaw.open(t[0], t[1] + k, t[2]) >= 0.5) { y = t[1] + k; break; }
    for (let j = 0; j < NP; j++) { const n = i * NP + j, pf = pl.puffs[j]; io.set([t[0], t[1], t[2], pl.ph], n * 4); ip.set([pl.H, SMOKE.lean, pl.r1, pl.T], n * 4); ik.set([j / NP, pf[0], pf[1], pf[2]], n * 4); clearY[n] = y; }
    if (i % 8 === 7) await ctx.yield(); }
  sg.setAttribute('iO', new THREE.InstancedBufferAttribute(io, 4)); sg.setAttribute('iP', new THREE.InstancedBufferAttribute(ip, 4)); sg.setAttribute('iK', new THREE.InstancedBufferAttribute(ik, 4));
  sg.setAttribute('iS', new THREE.InstancedBufferAttribute(clearY, 1)); sg.instanceCount = nI;
  sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 50, 90), 260);
  const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    uniforms: { uTime: world.light.uTime, uBreath: world.light.uBreath, uWind: world.light.uWind, uW: { value: new THREE.Vector3(W0[0], W0[1], HOUSE.wall) }, uCol: { value: new THREE.Color('#666884') }, uWarm: { value: new THREE.Color('#6A504C') }, uGold: { value: new THREE.Color(GOLD) }, uKeyDir: world.light.uKeyDir,
      uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } },
    vertexShader: /* glsl */`
      attribute vec4 iO, iP, iK; attribute float iS; uniform float uTime; uniform vec3 uWind;
      varying vec2 vUv; varying vec3 vP, vR, vU; varying vec4 vK;
      void main(){
        // a puff's age on its plume (0 at the pot, 1 where it is gone) by the world clock, the plume's period and phase;
        // its way up the plume goes slowly at the pot (the puffs stand close there) and faster where the wind has it
        float a = fract(uTime / iP.w + iK.x + iO.w), s = pow(clamp(a, 0., 1.), 1.8), ph = iO.w * 6.283;
        vec3 w = normalize(vec3(uWind.x, 0., uWind.z)), c = vec3(-w.z, 0., w.x);
        // it leaves the pot upward and lies over down the wind as it cools (the wind's slow breath is one for all plumes)
        float up = iP.x * (1. - pow(clamp(1. - s, 0., 1.), 1.7)), lee = iP.x * iP.y * pow(clamp(s, 0., 1.), 1.35) * (.9 + .1 * sin(uTime * .23));
        float wander = (.25 * s + .9 * s * s) * sin(s * 6. - uTime * .5 + ph);
        vec3 ctr = iO.xyz + vec3(0., up + .5 * s * s * cos(s * 5.3 - uTime * .43 + ph * 1.7), 0.) + w * lee + c * wander;
        float r = mix(.6, iP.z, pow(clamp(s, 0., 1.), .7)) * (.82 + .36 * iK.y);
        // (each puff keeps a little to one side of the plume's middle, by its own bearing: they do not stand in a file)
        float ang = iK.w * 6.283 + ph * 2.7; ctr += vec3(cos(ang), .6 * sin(ang * 2.3), sin(ang)) * (.4 * r * smoothstep(.05, .4, s));
        // a round puff turned about its own place to face the eye
        vec3 toEye = cameraPosition - ctr; toEye = toEye / max(length(toEye), 1e-3);
        vec3 right = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-4, 0., 0.)), upv = cross(toEye, right);
        vec3 p = ctr + (right * position.x + upv * position.y) * r;
        // thin and whole low down; above the middle the puffs thin unevenly (each by its own weight): two or three roll on alone
        float alone = mix(1., smoothstep(.3, .75, iK.y), smoothstep(.2, .55, s));
        vK = vec4(.7 * smoothstep(0., .05, a) * (1. - smoothstep(.55, 1., a)) * alone, uTime * iK.z + iK.w * 6.283, iK.w * 37. + iO.w * 11., iS);
        vUv = position.xy; vP = p; vR = right; vU = upv;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uBreath, uFogD; uniform vec3 uW, uCol, uWarm, uGold, uFogC, uKeyDir; varying vec2 vUv; varying vec3 vP, vR, vU; varying vec4 vK;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        vec2 uv = clamp(vUv, -1., 1.); float d2 = dot(uv, uv); if (d2 >= 1.) discard;
        // the puff rolls: its own pattern turns about its middle on the clock
        float cs = cos(vK.y), sn = sin(vK.y); vec2 q = vec2(uv.x * cs - uv.y * sn, uv.x * sn + uv.y * cs);
        float n = vn(q * 1.5 + vK.z) * .62 + .38 * vn(q * 3.4 - vK.z * 1.7);
        // soft to nothing at its rim, eaten softly from within: no edge anywhere
        float body = 1. - d2, soft = body * body * smoothstep(0., .5, body * .75 + n - .4);
        float dist = length(vP - cameraPosition), al = soft * vK.x * smoothstep(.8, 2.5, dist);
        if (al < .004) discard;
        vec3 d = vP - uW; float dl = length(d), cone = smoothstep(.44, .62, d.z / max(dl, 1e-3)) * step(.3, d.z);
        float far = max(0., dl - 17.) / 60., lamp = cone * .4 / (1. + far * far) * smoothstep(vK.w - 1., vK.w + 2.5, vP.y) * uBreath;
        // (a puff is a round body in the light of the place: its side turned to the last light is a little warm, the
        // rest keeps the dusk's lilac grey)
        vec3 nrm = normalize(vR * uv.x + vU * uv.y + cross(vR, vU) * sqrt(max(1. - d2, 0.)));
        float key = max(dot(nrm, uKeyDir), 0.);
        vec3 col = (uCol * (.84 + .3 * n) + uWarm * (key * (.3 + .4 * n))) / (1. + lamp) + uGold * lamp * (.3 + .2 * n);
        col = mix(uFogC, col, exp(-pow(uFogD * dist, 2.)));
        gl_FragColor = vec4(col, al);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  smoke.name = 'smoke'; smoke.renderOrder = 5; world.scene.add(smoke);
  await ctx.yield();
  // ---- BIRDS on rings of their own (a law of place and the world clock): each flies a level circle about its ring's centre.
  // The swifts' rings lie about the tower's cap, none wider than 12 m; the gulls wheel over this visit's own moored fleet
  // (about the middle of the hulls that lie inside the loop), 29 m and more above the water. ONE RULE FOR EVERY RING (as
  // hulls are moored by place): a ring any part of which would come within 2 m of the flown line is not flown.
  const birds = [], T = TOWER, fleet = world.boats.filter((o) => o.x < -14 && o.z > LAY.run[1]);
  const fc = fleet.length ? [fleet.reduce((a, o) => a + o.x, 0) / fleet.length, fleet.reduce((a, o) => a + o.z, 0) / fleet.length] : [LAY.loop.x, LAY.loop.z];
  const nSw = Math.round(clamp(40 * world.density + rBirds.range(-8, 8), 30, 50)), nGu = Math.round(clamp(9 * world.density + rBirds.range(-2, 2), 6, 12));
  for (let i = 0; i < nSw; i++) birds.push({ c: [T.x + rBirds.range(-3, 3), rBirds.range(T.top - 6, T.top + 9), T.z + rBirds.range(-3, 3)], R: rBirds.range(8.5, 12) * (rBirds.chance(0.5) ? 1 : -1), w: rBirds.range(1.3, 2.1), ph: rBirds.range(0, TAU), size: 1.5, flap: 9, tone: 0.12 });
  for (let i = 0; i < nGu; i++) birds.push({ c: [fc[0] + rBirds.range(-6, 6), rBirds.range(29, 37), fc[1] + rBirds.range(-5, 5)], R: rBirds.range(8, 17) * (rBirds.chance(0.5) ? 1 : -1), w: rBirds.range(0.35, 0.6), ph: rBirds.range(0, TAU), size: 4, flap: 2.2, tone: 0.8 });
  // SEABIRDS ABOUT THE BEACON (r2; their own stream): gulls wheeling round the unlit beacon's head, each on a level ring whose
  // centre lies within 1.5 m of the beacon's own and whose radius is 9 m or less, 13 m and more over the water: the line
  // passes the beacon's skin at 13 m and 7 m up, so every round of every bird stays 2 m and more from it (counted below)
  { const rS = world.rngs.rSeabirds, nS = Math.round(clamp(11 * world.density + rS.range(-2, 2), 8, 14));
    for (let i = 0; i < nS; i++) birds.push({ c: [BEACON.x + rS.range(-1.5, 1.5), rS.range(13, 27), BEACON.z + rS.range(-1.5, 1.5)], R: rS.range(4, 9) * (rS.chance(0.5) ? 1 : -1), w: rS.range(0.3, 0.55), ph: rS.range(0, TAU), size: 4, flap: 2.2, tone: 0.85 }); }
  // SEABIRDS OF THE SKERRY (r3; their own stream): they lift and wheel about the heads of its stacks
  { const rK = world.rngs.rSkerry; for (const [cx, y, cz, rr] of world.skerry) { const n = Math.round(rK.range(1.5, 3.5)); for (let i = 0; i < n; i++) birds.push({ c: [cx + rK.range(-2, 2), y + rK.range(2, 9), cz + rK.range(-2, 2)], R: (rr + rK.range(3, 8)) * (rK.chance(0.5) ? 1 : -1), w: rK.range(0.3, 0.55), ph: rK.range(0, TAU), size: 4, flap: 2.2, tone: 0.85 }); } }
  // the one rule: every ring is tried against the line at sixteen places round it, with its bird's own reach
  { const kept = []; let k = 0; for (const b of birds) { let clear = Infinity; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, R = Math.abs(b.R); clear = Math.min(clear, world.near(b.c[0] + Math.cos(a) * R, b.c[1], b.c[2] + Math.sin(a) * R) - 1.2 - b.size * 0.6); }
      if (clear >= 2) kept.push(b); if (++k % 8 === 7) await ctx.yield(); }
    birds.length = 0; birds.push(...kept); }
  world.birdRings = birds.slice();
  // GULLS THAT FOLLOW THE LUGGER (r3; the same stream as the skerry's): a few wheel over her wake, their rings' middle 20 m
  // astern of her wherever she is on her oval (which lies 44 m and more from the line: they are clear of it by her place)
  const nFollow = Math.round(world.rngs.rSkerry.range(3, 6));
  for (let i = 0; i < nFollow; i++) { const rK = world.rngs.rSkerry; birds.push({ c: [rK.range(-3, 3), rK.range(9, 22), rK.range(-3, 3)], R: rK.range(5, 11) * (rK.chance(0.5) ? 1 : -1), w: rK.range(0.4, 0.65), ph: rK.range(0, TAU), size: 4, flap: 2.2, tone: 0.85, follow: 1 }); }
  // THREE COMPANIES OF BIRDS, each dealt by a stream of its own. A company wheels as one: its birds fly level rings about
  // one middle at one turn of the clock (each ring's speed goes by its breadth), strung out along a part of the round, each
  // a little off the company's height. GULLS OVER THE MOLE, a loose flock about the mole's middle, no ring of it within 6 m
  // of the flown line; PIGEONS OVER THE SQUARE, close and quick, low over its flags and well under the line's rise; ROOKS
  // OVER THE CROWN'S PINES beyond the tall house, crossing the sky behind its roof. The one rule of the rings holds for each
  // bird of them (sixteen places round its ring against the line, with its own reach).
  { const company = (name, n, mid, o) => { const r = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)), turn = r.range(o.turn[0], o.turn[1]), way = r.chance(0.5) ? 1 : -1, ph0 = r.range(0, TAU);
      for (let i = 0; i < n; i++) { const R = r.range(o.R[0], o.R[1]), b = { c: [mid[0] + r.range(-o.wide, o.wide), mid[1] + r.range(-o.deep, o.deep), mid[2] + r.range(-o.wide, o.wide)], R: R * way, w: turn * R / 6, ph: ph0 + r.range(-o.strung, o.strung), size: o.size, flap: o.flap, tone: o.tone, wing: r.range(0, TAU) };
        let clear = Infinity; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; clear = Math.min(clear, world.near(b.c[0] + Math.cos(a) * R, b.c[1], b.c[2] + Math.sin(a) * R) - 1.2 - b.size * 0.6); }
        if (clear >= o.clear) { birds.push(b); world.birdRings.push(b); } } };
    const cl = MOLE.line, mm = [(cl[1][0] + cl[2][0]) / 2, (cl[1][1] + cl[2][1]) / 2];
    company('gulls over the mole', Math.round(14 * world.density), [mm[0], 24, mm[1]], { R: [9, 24], wide: 7, deep: 8, turn: [0.16, 0.24], strung: 1.5, size: 4, flap: 2.2, tone: 0.85, clear: 6 });
    await ctx.yield();
    company('pigeons over the square', Math.round(32 * world.density), [(SQUARE.x0 + SQUARE.x1) / 2, SQUARE.y + 8, (SQUARE.z0 + SQUARE.z1) / 2], { R: [8, 13], wide: 2, deep: 2.2, turn: [0.5, 0.7], strung: 0.5, size: 2, flap: 8, tone: 0.42, clear: 2 });
    await ctx.yield();
    company('rooks over the crown', Math.round(26 * world.density), [CROWN.x + 20, CROWN.y + 30, CROWN.z - 10], { R: [20, 44], wide: 7, deep: 6, turn: [0.14, 0.2], strung: 1.4, size: 3.2, flap: 4.5, tone: 0.1, clear: 2 }); }
  await ctx.yield();
  // BIRDS NEAR OVER THE ROOFS (r5, order E3), in twos and threes, dealt by a stream of their own ('birds over the roofs:' +
  // seed; nine draws a house and four a bird, taken or not). A RULE OF THE TOWN: over one house in four a pair or a trio
  // wheels as one company about a middle within 3 m of the house's own, 4.5 to 10 m over its highest stone, each bird on
  // a level ring 6.5 to 12 m wide: GULLS (4 m across the wings) over the rows by the water, ROOKS of the crown's pines
  // (3.2 m, as the crown's) over the houses above the square. THAT IS THE ONE RULE (r5m1, M4: r5 had a second, of place,
  // for every second house of each wall of the upper street; it is gone, and every company stands by the stream's one
  // draw in four). By place: the one rule of the rings (sixteen places round each against the flown line with the bird's
  // own reach, 2 m and more of clear air); no ring comes within 12 m of the window's axis in plan, so none crosses
  // before the opening, over the last straight or through the sight of the window from the bay (a ring over a flank
  // house of the upper street always would: none wheels there); and a ring that would pass through a drying line's
  // cloth at its full swing is flown higher, the bird's own reach and half a metre over the line.
  { const r = ctx.core.makeRng(ctx.core.hashSeed('birds over the roofs:' + ctx.seed)), out = { companies: 0, birds: 0, clear: Infinity }; let k = 0;
    for (const h of world.town.houses) { const take = r.chance(1 / 4), n = r.int(2, 3), turn = r.range(0.3, 0.5), way = r.chance(0.5) ? 1 : -1, ph0 = r.range(0, TAU), up = r.range(4.5, 10), ox = r.range(-3, 3), oz = r.range(-3, 3), spare = r();
      const P = h.fp, hx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, hz = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4;
      const cx = hx + ox, cz = hz + oz, gull = cz > SQUARE.z1, lift = up; let any = 0;
      for (let i = 0; i < 3; i++) { const R = r.range(6.5, 12), dy = r.range(-1.3, 1.3), strung = r.range(-0.5, 0.5), wing = r.range(0, TAU); if (!take || i >= n) continue;
        const b = { c: [cx, h.top + lift + dy, cz], R: R * way, w: turn * R / 6, ph: ph0 + strung + i * 0.9, size: gull ? 4 : 3.2, flap: gull ? 2.2 : 4.5, tone: gull ? 0.85 : 0.1, wing };
        // (the drying lines: a ring that would pass within the bird's reach and half a metre of a hung piece at its full swing is flown that much higher, over the line)
        { const reach = b.size * 0.6 + 0.5; for (const l of world.dryLines || []) { if (b.c[1] > l.a[1] + 1.2 + reach || b.c[1] < l.a[1] - l.drop - 1.2 - reach) continue;
            for (let q = 0; q < 32; q++) { const a = q / 32 * TAU, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, ex = l.b[0] - l.a[0], ez = l.b[2] - l.a[2], t = clamp(((x - l.a[0]) * ex + (z - l.a[2]) * ez) / (ex * ex + ez * ez), 0, 1);
              if (Math.hypot(x - l.a[0] - ex * t, z - l.a[2] - ez * t) < l.reach + reach) { b.c[1] = l.a[1] + 1.2 + reach + 0.01; out.overLines = (out.overLines || 0) + 1; break; } } } }
        let clear = Infinity, off = Infinity; for (let q = 0; q < 16; q++) { const a = q / 16 * TAU, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R; clear = Math.min(clear, world.near(x, b.c[1], z) - 1.2 - b.size * 0.6); off = Math.min(off, Math.abs(x)); }
        if (clear < 2 || off < 12) continue;
        birds.push(b); world.birdRings.push(b); out.birds++; out.clear = Math.min(out.clear, clear); any = 1; }
      out.companies += any; if (++k % 6 === 5) await ctx.yield(); }
    out.clear = out.clear === Infinity ? null : Math.round(out.clear * 10) / 10; world.roofBirds = out; }
  await ctx.yield();
  const bg = new THREE.InstancedBufferGeometry();
  // a bird in its own frame: +x forward, wings along z; unit span 1 (the instance's size scales it). aK: 0 body, 1 wing (flaps by |z|)
  const bp = [0.28, 0, 0, -0.3, 0, 0.05, -0.3, 0, -0.05, 0.28, 0, 0, -0.1, 0.05, 0, -0.3, 0, 0,
    0.1, 0, 0.03, -0.12, 0, 0.03, -0.2, 0, 0.5, 0.1, 0, 0.03, -0.2, 0, 0.5, -0.02, 0, 0.3,
    0.1, 0, -0.03, -0.2, 0, -0.5, -0.12, 0, -0.03, 0.1, 0, -0.03, -0.02, 0, -0.3, -0.2, 0, -0.5];
  bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  const ia = new Float32Array(birds.length * 4), ib = new Float32Array(birds.length * 4), ic = new Float32Array(birds.length * 4);
  birds.forEach((b, i) => { ia.set([b.c[0], b.c[1], b.c[2], b.R], i * 4); ib.set([b.w, b.ph, b.size, b.flap], i * 4); ic.set([b.tone, b.wing ?? rBirds.range(0, TAU), b.follow ? 1 : 0, 0], i * 4); });
  bg.setAttribute('iA', new THREE.InstancedBufferAttribute(ia, 4)); bg.setAttribute('iB', new THREE.InstancedBufferAttribute(ib, 4)); bg.setAttribute('iC', new THREE.InstancedBufferAttribute(ic, 4));
  bg.instanceCount = birds.length; bg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-40, 40, 220), 330);
  const flock = new THREE.Mesh(bg, new THREE.ShaderMaterial({
    uniforms: { uTime: world.light.uTime, uSky: world.light.uSky, uAmb: world.light.uAmb, uLug: { value: world.lugAt }, uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC; uniform float uTime; uniform vec4 uLug; varying float vTone; varying vec3 vP;
      void main(){
        float sgn = sign(iA.w), R = abs(iA.w), a = sgn * (uTime * iB.x * 6. / R + iB.y);
        vec3 c = iA.xyz + iC.z * vec3(uLug.x - 20. * uLug.y, 0., uLug.z - 20. * uLug.w) + vec3(cos(a) * R, 1.2 * sin(a * 2. + iC.y), sin(a) * R);
        vec3 fwd = sgn * vec3(-sin(a), 0., cos(a)), right = vec3(-fwd.z, 0., fwd.x);
        vec3 p = position; float wing = abs(p.z);
        float glide = smoothstep(-.2, .5, sin(uTime * .7 + iC.y * 3.)), fl = sin(uTime * iB.w + iC.y * 5.) * mix(1., .15, glide * step(iB.w, 5.));
        p.y += wing * (.55 * fl + .12) - .5 * wing * wing * fl;
        float bank = -sgn * .5;                                    // leaning into the turn
        p.yz = vec2(p.y * cos(bank) - p.z * sin(bank), p.y * sin(bank) + p.z * cos(bank));
        vec3 w = c + (fwd * p.x + vec3(0., 1., 0.) * p.y + right * p.z) * iB.z;
        vTone = iC.x; vP = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky, uFogC; uniform float uAmb, uFogD; varying float vTone; varying vec3 vP;
      void main(){ vec3 col = uSky * uAmb * vTone * .55; float dist = length(vP - cameraPosition); gl_FragColor = vec4(mix(uFogC, col, exp(-pow(uFogD * dist, 2.))), 1.); }`,
    side: THREE.DoubleSide,
  }));
  flock.name = 'birds'; world.scene.add(flock);
}

// ================================================================ THE COUNTRY, built: walls and hedges on the parcels' boundaries, sheds
// on the garden plots thinning out from the town, the two roads. All of it the same on every seed (a fixed number), all of
// it stood on the hill's own sheet, none of it within 10 m of the flown line in plan.
async function buildCountry(ctx, world) {
  const fixed = ctx.core.makeRng(64140), G = world.ground, F = world.fields, H = world.hillH, m = makeMason(), taken = world.town.taken, path = world.path;
  const outOf = (x, z) => Math.max(0, x - G.eastOf(z), -G.westOf(z) - x);
  const steepAt = (x, z) => Math.hypot(H(x + 2, z) - H(x - 2, z), H(x, z + 2) - H(x, z - 2)) / 4;
  const offLine = (x, z) => path.nearestXZ(x, z).dist;
  const mayStand = (x, z) => H(x, z) > 6 && outOf(x, z) > 5 && z > -120 && steepAt(x, z) < 0.6 && F.roadAt(x, z).d > 6 && offLine(x, z) > 10;
  const fineAt = (x, z) => Math.abs(x) < 150 && z > -70 && z < 216;
  // ---- one length of wall or hedge between two plan points, standing on the sheet
  const length = (p, q, hedge, uvx) => { const lx = q[0] - p[0], lz = q[1] - p[1], l = Math.hypot(lx, lz), ex = -lz / l, ez = lx / l, hw = hedge ? 1.2 : 0.45, hgt = hedge ? 3.4 : 2.3;
    const y0 = H(p[0], p[1]), y1 = H(q[0], q[1]), a = [p[0] + ex * hw, p[1] + ez * hw], b = [q[0] + ex * hw, q[1] + ez * hw], c = [q[0] - ex * hw, q[1] - ez * hw], d = [p[0] - ex * hw, p[1] - ez * hw];
    const t0 = y0 + hgt * (hedge ? 0.85 + 0.3 * fixed() : 1), t1 = y1 + hgt * (hedge ? 0.85 + 0.3 * fixed() : 1);
    if (hedge) m.col(PAL.vine, 0.62).set({ surf: SURF.LEAF }); else m.col(PAL.stone, 0.82).set({ surf: SURF.STONE });
    // (r5m1, M2: a hedge's head leans 0.4 m with the gust that passes it and recovers; its foot is rooted. A wall stands.)
    const hs = hedge ? 0.4 : 0;
    m.quad([c[0], y1 - 0.8, c[1]], [d[0], y0 - 0.8, d[1]], [d[0], t0, d[1]], [c[0], t1, c[1]], { uv: [uvx, 0], ao: [0.6, 0.6, 1, 1], sway: [0, 0, hs, hs] });
    m.quad([a[0], y0 - 0.8, a[1]], [b[0], y1 - 0.8, b[1]], [b[0], t1, b[1]], [a[0], t0, a[1]], { uv: [uvx + 3, 0], ao: [0.6, 0.6, 1, 1], sway: [0, 0, hs, hs] });
    if (!hedge) m.col(PAL.stone, 1.0);
    m.quad([a[0], t0, a[1]], [b[0], t1, b[1]], [c[0], t1, c[1]], [d[0], t0, d[1]], { uv: [uvx, 0], sway: hs }); };
  // ---- the parcels' boundaries: where two sites are each other's nearest pair at their midpoint, the boundary runs along
  // their bisector for as long as that holds; a draw says wall, hedge or nothing
  const S = F.sites; let n = 0;
  for (let i = 0; i < S.length; i++) { await ctx.yield(); for (let j = i + 1; j < S.length; j++) {
    const A = S[i], B = S[j], dx = B.x - A.x, dz = B.z - A.z, dl = Math.hypot(dx, dz); if (dl > 112) continue;
    const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, c = F.cellAt(mx, mz); if (!((c.a === i && c.b === j) || (c.a === j && c.b === i))) continue;
    const kind = fixed(), plot = A.plot || B.plot; if (kind > (plot ? 0.9 : 0.72)) continue;
    const hedge = kind > (plot ? 0.62 : 0.42), tx = -dz / dl, tz = dx / dl, ends = [0, 0];
    for (const sd of [0, 1]) for (let t = 2; t <= 56; t += 2) { const q = F.cellAt(mx + tx * t * (sd ? 1 : -1), mz + tz * t * (sd ? 1 : -1)); if (!((q.a === i && q.b === j) || (q.a === j && q.b === i))) break; ends[sd] = t; }
    const from = -ends[0], to = ends[1], step = fineAt(mx, mz) ? 3.5 : 7, cnt = Math.max(1, Math.round((to - from) / step)); if (to - from < 3) continue;
    for (let k = 0; k < cnt; k++) { const t0 = from + (to - from) * k / cnt, t1 = from + (to - from) * (k + 1) / cnt, p = [mx + tx * t0, mz + tz * t0], q = [mx + tx * t1, mz + tz * t1];
      if (mayStand((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) && mayStand(p[0], p[1]) && mayStand(q[0], q[1])) length(p, q, hedge, t0); }
    await ctx.yield();
  } }
  await ctx.yield();
  // ---- sheds on the garden plots: one-storey stone outbuildings under slate, fewer the further from the town
  const sheds = []; let asked = 0;
  for (const site of S) { if (++asked % 6 === 0) await ctx.yield(); if (!site.plot) continue; const keep = fixed(), w = 7 + 4 * fixed(), d = 5.5 + 2.5 * fixed(), yaw = (fixed() < 0.5 ? 0 : Math.PI / 2) + (fixed() - 0.5) * 0.5, lift = fixed(), lime = fixed();
    const out = outOf(site.x, site.z); if (keep > 0.95 - out / 90) continue;
    const cs = Math.cos(yaw), sn = Math.sin(yaw), cn = (u, v) => [site.x + u * cs - v * sn, site.z + u * sn + v * cs], fp = [cn(-w / 2, d / 2), cn(w / 2, d / 2), cn(w / 2, -d / 2), cn(-w / 2, -d / 2)];
    if (!fp.every((q) => mayStand(q[0], q[1])) || taken.some((q) => quadsOverlap(fp, q)) || sheds.some((q) => quadsOverlap(fp, q))) continue;
    const hsv = fp.map((q) => H(q[0], q[1])), g = Math.max(...hsv), wt = g + 6 + 0.8 * lift;
    house(m, fp, { g, base: Math.min(...hsv) - 1, lamp: 0, wallTop: wt, ridge: wt + 2.4, storeys: 1, ov: 0.6, wallCol: lime < 0.35 ? linear(PAL.chalk, 0.9) : linear(PAL.stone, 0.95 + 0.2 * lime), wallSurf: lime < 0.35 ? SURF.LIME : SURF.STONE, shut: linear(P.shutters[0]), stacks: [] }, world.dressOf('shed ' + sheds.length));
    sheds.push(fp); await ctx.yield(); }
  world.sheds = sheds;
  // ---- the two roads: a ribbon of beaten earth and stone on the sheet, a low kerb of stones along its downhill side
  for (const r of ROADS) { const curve = new THREE.CatmullRomCurve3(r.pts.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal'), len = curve.getLength(), cnt = Math.round(len / 3);
    let prev = null;
    for (let k = 0; k <= cnt; k++) { const q = curve.getPointAt(k / cnt), t = curve.getTangentAt(k / cnt), ex = -t.z, ez = t.x, hw = r.w / 2;
      const L = [q.x + ex * hw, q.z + ez * hw], R = [q.x - ex * hw, q.z - ez * hw], cur = { L, R, yl: H(L[0], L[1]) + 0.22, yr: H(R[0], R[1]) + 0.22, ok: H(q.x, q.z) > 2.5 };
      if (prev && prev.ok && cur.ok) { m.col('#A39C88', 0.95).set({ surf: SURF.FLAGS });
        m.quad([prev.L[0], prev.yl, prev.L[1]], [cur.L[0], cur.yl, cur.L[1]], [cur.R[0], cur.yr, cur.R[1]], [prev.R[0], prev.yr, prev.R[1]], { uv: [0, k * 3], ao: 0.95 }); }
      prev = cur; if (k % 40 === 39) await ctx.yield(); } }
  const mesh = new THREE.Mesh(m.geometry(), stoneMaterial(world.light)); mesh.name = 'country'; world.scene.add(mesh);
  world.countryTris = m.triangles;
}

// ================================================================ THE DRYING GROUNDS AND THE FLOCKS OF THE HILL, by place
// What a hill by a fishing town carries besides its walls and sheds, the same on every visit (a fixed number of its own),
// all of it stood on the hill's own sheet, none of it within 10 m of the flown line in plan:
// LINEN on a line between two poles in the garden plots (one line to a plot, beside its middle, inside its own bounds;
// the cloths stir in the one wind); NETS drying on racks of poles on the parcels of the west hill nearest the slip (the
// fishermen's ground); SHEEP on the grass parcels round the town, a small flock to a parcel, standing as they graze.
async function buildGreens(ctx, world) {
  const fixed = ctx.core.makeRng(64141), G = world.ground, F = world.fields, H = world.hillH, m = makeMason(), S = F.sites, path = world.path;
  const outOf = (x, z) => Math.max(0, x - G.eastOf(z), -G.westOf(z) - x);
  const steepAt = (x, z) => Math.hypot(H(x + 2, z) - H(x - 2, z), H(x, z + 2) - H(x, z - 2)) / 4;
  const mayStand = (x, z, i) => H(x, z) > 6 && outOf(x, z) > 5 && z > -120 && steepAt(x, z) < 0.6 && F.roadAt(x, z).d > 6 && path.nearestXZ(x, z).dist > 10 && (() => { const c = F.cellAt(x, z); return c.a === i && c.edge > 2; })();
  const blocked = (fp) => world.town.taken.some((q) => quadsOverlap(fp, q)) || world.sheds.some((q) => quadsOverlap(fp, q));
  const strip = (a, b, hw) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = -(b[1] - a[1]) / l * hw, ez = (b[0] - a[0]) / l * hw; return [[a[0] + ex, a[1] + ez], [b[0] + ex, b[1] + ez], [b[0] - ex, b[1] - ez], [a[0] - ex, a[1] - ez]]; };
  const pole = (x, z, h, r) => { m.col(PAL.spar, 0.9).set({ surf: SURF.WOOD, sway: 0 }).post(x, z, H(x, z) - 0.6, H(x, z) + h, r, r * 0.7, 5, { aoLow: 0.7 }); };
  const linens = ['#D8D4CC', '#C9CED6', '#D6CFC0', '#AEB8C6', '#C7B2AC', '#8E9AAE'];
  let lines = 0, racks = 0, sheep = 0;
  for (let i = 0; i < S.length; i++) { const site = S[i], ang = fixed() * TAU, dist = 9.5 + 3 * fixed(), len = 9 + 5 * fixed(), flock = fixed(), deal = ctx.core.makeRng(ctx.core.hashSeed('green:' + i));
    const cx = site.x + Math.cos(ang) * dist, cz = site.z + Math.sin(ang) * dist, dx = -Math.sin(ang), dz = Math.cos(ang), out = outOf(site.x, site.z);
    // ---- linen: the garden plots
    if (site.plot) { const a = [cx - dx * len / 2, cz - dz * len / 2], b = [cx + dx * len / 2, cz + dz * len / 2];
      if (!mayStand(a[0], a[1], i) || !mayStand(b[0], b[1], i) || !mayStand(cx, cz, i) || blocked(strip(a, b, 2))) continue;
      const ya = H(a[0], a[1]) + 5.2, yb = H(b[0], b[1]) + 5.2, at = (t, y) => [a[0] + (b[0] - a[0]) * t, ya + (yb - ya) * t + y, a[1] + (b[1] - a[1]) * t];
      pole(a[0], a[1], 5.4, 0.16); pole(b[0], b[1], 5.4, 0.16); m.col(PAL.rope, 0.8).set({ surf: SURF.PLAIN }); bar(m, at(0, 0), at(1, 0), 0.05, {});
      for (let u = 0.6; u < len - 1.6;) { const w = deal.range(1.3, 3), drop = deal.range(2, 3.5);
        if (deal.chance(0.8)) { m.col(deal.pick(linens), deal.range(0.85, 1)).set({ surf: SURF.CLOTH }); m.quad(at(u / len, -drop), at((u + w) / len, -drop), at((u + w) / len, -0.05), at(u / len, -0.05), { sub: 0.9, sway: [0.38, 0.38, 0, 0], ao: 0.95, uv: [u + i, 0] }); }
        u += w + deal.range(0.2, 0.7); }
      m.set({ sway: 0 }); lines++; if (lines % 4 === 3) await ctx.yield(); continue; }
    // ---- nets: the parcels of the west hill whose middles lie within 150 m of the slip's head
    const slip = Math.hypot(site.x - (SLIP.x0 + SLIP.x1) / 2, site.z - SLIP.top);
    if (site.x < -G.westOf(site.z) && slip < 150) { for (const side of [-1, 1]) { const ox = cx + Math.cos(ang) * 7 * side, oz = cz + Math.sin(ang) * 7 * side, n = 3 + Math.floor(deal() * 2), sp = 5.5;
        const pts = []; for (let k = 0; k < n; k++) pts.push([ox + dx * (k - (n - 1) / 2) * sp, oz + dz * (k - (n - 1) / 2) * sp]);
        if (!pts.every((q) => mayStand(q[0], q[1], i)) || blocked(strip(pts[0], pts[n - 1], 1.5))) continue;
        for (const q of pts) pole(q[0], q[1], 6.2, 0.14);
        for (let k = 0; k < n - 1; k++) { const p = pts[k], q = pts[k + 1], yp = H(p[0], p[1]), yq = H(q[0], q[1]), sag = deal.range(0.9, 1.8);
          m.col(PAL.rope, deal.range(0.6, 0.85)).set({ surf: SURF.NET }); m.quad([p[0], yp + sag, p[1]], [q[0], yq + sag, q[1]], [q[0], yq + 6, q[1]], [p[0], yp + 6, p[1]], { sub: 1.4, sway: [0.4, 0.4, 0.03, 0.03], ao: 0.9, uv: [k * sp + i, 0] }); }
        m.set({ sway: 0 }); racks++; } }
    // ---- sheep: the grass parcels within 260 m of the town's bounds (two in five of them), four to seven to a parcel
    if ((site.crop === 0 || site.crop === 3 || site.crop === 4) && out > 12 && out < 260 && flock < 0.4) { const n = 4 + Math.floor(deal() * 4);
      for (let k = 0; k < n; k++) { const a2 = deal.range(0, TAU), d2 = Math.sqrt(deal()) * 13, x = cx + Math.cos(a2) * d2, z = cz + Math.sin(a2) * d2, yaw = deal.range(0, TAU), big = deal.range(0.85, 1.15);
        if (!mayStand(x, z, i) || blocked(strip([x - 2, z], [x + 2, z], 2))) continue;
        const y = H(x, z), fx = Math.cos(yaw), fz = Math.sin(yaw), P3 = (k2, h) => [x + fx * k2 * big, y + h * big, z + fz * k2 * big];
        m.col(PAL.chalk, deal.range(0.72, 0.9)).set({ surf: SURF.PLAIN }); bar(m, P3(-1.2, 1.5), P3(1.0, 1.55), 0.85 * big, { r1: 0.75 * big, ao: 0.8 });
        m.col(PAL.spar, 0.55); bar(m, P3(1.1, 1.5), P3(1.75, deal.chance(0.6) ? 0.75 : 1.9), 0.36 * big, { r1: 0.26 * big }); bar(m, P3(-0.8, 0), P3(-0.8, 0.9), 0.14, {}); bar(m, P3(0.7, 0), P3(0.7, 0.9), 0.14, {});
        sheep++; } }
    if (i % 12 === 11) await ctx.yield(); }
  const mesh = new THREE.Mesh(m.geometry(), stoneMaterial(world.light, { side: THREE.DoubleSide })); mesh.name = 'drying grounds and flocks'; world.scene.add(mesh);
  world.greens = { lines, racks, sheep, tris: m.triangles };
}

// ================================================================ WASHING DAY IN THE TOWN (r5, order E2), by rules of the town
// Dealt by a stream of its own ('washing day:' + seed), taken once, after everything else of the town stands.
// THE LANES: where two houses face each other wall to wall over 5 m and more of their length across a way 3 to 11 m wide
// (the slots between the rows, the lanes of the upper town, the Net Stair between its two walls), a line may cross from
// wall to wall 1 m under the lower of the two wall heads, with sheets, shirts and blankets on it (3 times life: a sheet
// is 3 to 4.5 m wide), in white linen and in the old limewash colours of the two houses it joins. Three lanes in five
// carry one, and every way 7 m wide and more (the Net Stair); no two lines stand within 8 m of each other, none within
// 7.5 m of the stair's own old line or 4.5 m of its arch.
// THE YARDS: where a wall of a house 9 m and more long looks on open ground of the town (a strip from 2.5 to 10.5 m off
// it, free of every house, the stair and the square, on land that falls less than 2.5 m across it), that is a yard; every
// third yard has a line on two poles 7.2 m high, 6.5 m off the wall and along it.
// BY PLACE: none on the window's sight strip (14 m either side of the axis), none within 16 m of the tall house's wall
// plane, none in the square, the upper street or over the quay; a line any cloth of which, at the full reach of its sway,
// would come within 6 m of the flown line is not strung. The least clear air is counted (counts.washingDay.clear).
async function buildWashing(ctx, world) {
  const r = ctx.core.makeRng(ctx.core.hashSeed('washing day:' + ctx.seed)), m = makeMason(), hs = world.town.houses, G = world.ground, stair = world.stair, taken = world.town.taken;
  const linen = ['#D8D4CC', '#C9CED6', '#D6CFC0', '#DAD6CE', '#AEB8C6'], out = { lanes: 0, yards: 0, cloths: 0, clear: Infinity }, mids = [];
  const edges = hs.map((h) => { const P = h.fp, cx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, cz = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4;
    return P.map((p, a) => { const q = P[(a + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]), ex = (q[0] - p[0]) / l, ez = (q[1] - p[1]) / l, sg = (p[0] - cx) * ez - (p[1] - cz) * ex < 0 ? -1 : 1; return { p, ex, ez, l, nx: ez * sg, nz: -ex * sg }; }); });
  const offPlace = (x, z) => Math.abs(x) < 14 || z < 16 || z > QUAY.z0 - 2 || (x > SQUARE.x0 - 2 && x < SQUARE.x1 + 2 && z > SQUARE.z0 - 2 && z < SQUARE.z1 + 2);
  // one line from a to b (plan points) at the heights ya, yb: its cloths are dealt, tried against the flown line, then hung
  const hang = (a, b, ya, yb, maxDrop, cols) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), at = (t, y) => [a[0] + (b[0] - a[0]) * t, ya + (yb - ya) * t + y, a[1] + (b[1] - a[1]) * t], sheets = [];
    // (a cloth keeps off the wall its line is tied to by the reach of its own sway: the wind blows along the line there)
    const mg = 0.45 + 0.85 * Math.abs(b[0] - a[0]) / len;
    for (let u = mg; u < len - mg - 0.85;) { const w = Math.min(r.range(1.6, 4.5), len - mg - u), drop = Math.min(maxDrop, r.range(2.2, 4.2)) * (w < 2.4 ? 0.75 : 1), pick = r(), tone = r.range(0.86, 1), gap = r.range(0.25, 0.9), hung = r.chance(0.86);
      if (hung && w > 1.1) sheets.push([u, w, drop, pick, tone]); u += w + gap; }
    let clear = Infinity; for (const [u, w, drop] of sheets) { const sw = 0.2 * drop; for (const q of [at(u / len, -drop), at((u + w) / len, -drop)]) clear = Math.min(clear, world.near(q[0], q[1], q[2]) - 1.05 * sw - 0.1); clear = Math.min(clear, world.near(...at(u / len, 0)) - 0.1, world.near(...at((u + w) / len, 0)) - 0.1); }
    if (!sheets.length || clear < 6) return false;
    m.col(PAL.rope, 0.8).set({ surf: SURF.PLAIN, sway: 0 }); bar(m, at(0, 0), at(1, 0), 0.05, {});
    for (const [u, w, drop, pick, tone] of sheets) { const sw = 0.2 * drop; m.col(pick < 0.58 ? linear(linen[Math.floor(pick / 0.58 * linen.length)]) : cols[Math.floor((pick - 0.58) / 0.42 * cols.length)], tone).set({ surf: SURF.CLOTH });
      m.quad(at(u / len, -drop), at((u + w) / len, -drop), at((u + w) / len, -0.05), at(u / len, -0.05), { sub: 0.8, sway: [sw, sw, 0, 0], ao: 0.95, uv: [u + a[0], 0] }); out.cloths++; }
    m.set({ sway: 0 }); out.clear = Math.min(out.clear, clear); mids.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return true; };
  const apart = (x, z, d) => mids.every((q) => Math.hypot(q[0] - x, q[1] - z) >= d);
  const faded = (h) => h.dress.wall.map((v, k) => v * 0.8 + [0.5, 0.5, 0.52][k] * 0.2);
  // ---- the lanes
  for (let i = 0; i < hs.length; i++) { await ctx.yield(); for (let j = i + 1; j < hs.length; j++) { let found = null;
      for (const e of edges[i]) { if (found) break; for (const f of edges[j]) { if (Math.abs(e.ex * f.ez - e.ez * f.ex) > 0.2 || e.nx * f.nx + e.nz * f.nz > -0.9) continue;
          const gap = (f.p[0] - e.p[0]) * e.nx + (f.p[1] - e.p[1]) * e.nz; if (gap < 3 || gap > 11) continue;
          const t0 = (f.p[0] - e.p[0]) * e.ex + (f.p[1] - e.p[1]) * e.ez, t1 = t0 + f.l * (e.ex * f.ex + e.ez * f.ez), lo = Math.max(0, Math.min(t0, t1)), hi = Math.min(e.l, Math.max(t0, t1));
          if (hi - lo < 5) continue; found = { e, gap, mid: (lo + hi) / 2, span: hi - lo }; break; } }
      if (!found) continue;
      const { e, gap, span } = found, take = r.chance(0.6), mid = found.mid + (r() - 0.5) * Math.min(4, span - 5), a = [e.p[0] + e.ex * mid, e.p[1] + e.ez * mid], b = [a[0] + e.nx * gap, a[1] + e.nz * gap], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (!(take || gap >= 7) || offPlace(mx, mz) || offPlace(a[0], a[1]) || offPlace(b[0], b[1]) || !apart(mx, mz, 8)) continue;
      const sn = stair.near(mx, mz), onStair = sn.d < 2.5; if (onStair && (world.washLines.some((sl) => Math.abs(sl - sn.s) < 7.5) || Math.abs(world.arch.s - sn.s) < 4.5)) continue;
      const top = Math.min(hs[i].wt, hs[j].wt) - 1, floor = Math.max(hs[i].g, hs[j].g, onStair ? stair.stairY(sn.s) : -Infinity), maxDrop = Math.min(4.2, top - floor - 6.5); if (maxDrop < 2.2) continue;
      if (hang(a, b, top, top, maxDrop, [faded(hs[i]), faded(hs[j])])) out.lanes++; } }
  await ctx.yield();
  // ---- the yards
  { const yards = [], off = r.int(0, 1); let seen = 0;
    for (let i = 0; i < hs.length; i++) { if (i % 6 === 5) await ctx.yield(); for (const e of edges[i]) { if (e.l < 9) continue; const half = Math.min(e.l, 14) / 2, c = e.l / 2, pt = (t, o) => [e.p[0] + e.ex * t + e.nx * o, e.p[1] + e.ez * t + e.nz * o];
        const fp = [pt(c - half, 2.5), pt(c + half, 2.5), pt(c + half, 12.5), pt(c - half, 12.5)], hts = [...fp, pt(c, 7)].map((q) => G.h(q[0], q[1]));
        if (fp.some((q) => offPlace(q[0], q[1]) || stair.near(q[0], q[1]).d < STAIR.hw + 2) || Math.min(...hts) < 6 || Math.abs(hts[4] - hs[i].g) > 12) continue;
        if (taken.some((q) => quadsOverlap(fp, q)) || (world.sheds || []).some((q) => quadsOverlap(fp, q)) || yards.some((q) => quadsOverlap(fp, q))) continue;
        // the line lies as the ground lets it: along the wall 6.5 m off it, or straight out from the wall's middle (3 to 12 m off it), whichever stands more level
        const ways = [[pt(c - half + 1, 6.5), pt(c + half - 1, 6.5)], [pt(c, 3), pt(c, 12)]].map(([a, b]) => ({ a, b, ga: G.h(a[0], a[1]), gb: G.h(b[0], b[1]) })).sort((p, q) => Math.abs(p.ga - p.gb) - Math.abs(q.ga - q.gb)), { a, b, ga, gb } = ways[0];
        if (Math.abs(ga - gb) > 3.5) continue;
        yards.push(fp); if ((seen++ + off) % 2) continue;
        if (!apart((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 9)) continue;
        if (hang(a, b, ga + 7, gb + 7, 4.2, [faded(hs[i])])) { out.yards++; for (const [q, g0] of [[a, ga], [b, gb]]) m.col(PAL.spar, 0.9).set({ surf: SURF.WOOD, sway: 0 }).post(q[0], q[1], g0 - 0.6, g0 + 7.2, 0.2, 0.14, 5, { aoLow: 0.7 }); } } }
    out.yardsFound = yards.length; }
  await ctx.yield();
  // ---- ALONG THE WALLS: a side or back wall of a house, 7 m and more long, that looks on open air (no house, stair or
  // garden within 6 m of it) may carry a line on two iron brackets 1.3 m off the wall and 2.2 m under its head, with the
  // wash of the house on it: one such wall in three. A cloth's hem keeps 2.5 m and more over the ground under it.
  { let kk = 0; out.walls = 0;
    for (let i = 0; i < hs.length; i++) { if (i % 6 === 5) await ctx.yield(); for (let ei = 1; ei < 4; ei++) { const e = edges[i][ei], take = r.chance(1 / 3), other = hs[r.int(0, hs.length - 1)]; if (e.l < 7) continue;
        const pt = (t, o) => [e.p[0] + e.ex * t + e.nx * o, e.p[1] + e.ez * t + e.nz * o], fp = [pt(0.8, 0.4), pt(e.l - 0.8, 0.4), pt(e.l - 0.8, 6), pt(0.8, 6)];
        if (!take || fp.some((q) => offPlace(q[0], q[1]) || stair.near(q[0], q[1]).d < STAIR.hw + 1) || taken.some((q) => q !== hs[i].fp && quadsOverlap(fp, q)) || (world.sheds || []).some((q) => quadsOverlap(fp, q))) continue;
        const a = pt(1.2, 1.3), b = pt(e.l - 1.2, 1.3), mid = pt(e.l / 2, 1.3), y = hs[i].wt - 2.2, floor = Math.max(G.h(a[0], a[1]), G.h(b[0], b[1]), G.h(mid[0], mid[1])), maxDrop = Math.min(4.2, y - floor - 2.5);
        if (maxDrop < 2.2 || !apart(mid[0], mid[1], 8)) continue;
        if (hang(a, b, y, y, maxDrop, [faded(other), faded(hs[i])])) { out.walls++; m.col(PAL.iron, 1.3).set({ surf: SURF.PLAIN, sway: 0 }); for (const t of [1.2, e.l - 1.2]) { const w0 = pt(t, 0), w1 = pt(t, 1.3); bar(m, [w0[0], y, w0[1]], [w1[0], y, w1[1]], 0.06, {}); bar(m, [w0[0], y - 1, w0[1]], [w1[0], y, w1[1]], 0.045, {}); } }
        if (++kk % 8 === 7) await ctx.yield(); } } }
  await ctx.yield();
  out.clear = out.clear === Infinity ? null : Math.round(out.clear * 10) / 10; world.washDay = out;
  if (!m.count) return;
  await world.bake(m); await ctx.yield();
  const geo = m.geometry(); await ctx.yield();
  const mesh = new THREE.Mesh(geo, world.thingsMat); mesh.name = 'washing-day'; world.scene.add(mesh);
  await ctx.yield();
}

// ================================================================ THE TOWN DRIES ITS NETS AND LINEN ON ITS ROOFS (r5m1, M1)
// A rule of the whole town, on a stream of its own ('drying roofs', forked by name after every other; every house takes
// the same count of draws from it, hung or not). (i) EVERY FLANK HOUSE OF THE UPPER STREET carries two poles on its
// ridge and a line between their heads ALONG the street: on every second house of each wall a tanned net in one long
// swag (6 to 10 m), on the others linen (sheets and shirts); which wall begins with a net is the stream's. (ii) IN THE
// ROWS ONE HOUSE IN FOUR, counted along the rows as they stand (the stream gives where the count begins): the line goes
// to the first roof at or after each fourth house that can carry one at all (a ridge of 10.2 m and more, not a lean-to,
// no gull's perch on it, the air clear): two poles on its roof's lee slope and a line along its ridge, linen or a net.
// A piece HANGS ONLY WHERE THE AIR IS CLEAR, counted at its full swing (the part's dryReach: its drop swung 0.62 of a
// radian down the wind, and its folds): DRYING.clear from the flown line, DRYING.plane from the opening's plane, aside
// of the sight of the tall house's whole front from the last 90 m of the line, 2 m off every chimney, and over its
// own roof; a roof where a gull has its perch carries no line (the flank houses' gulls stand on the poles' heads).
// THEY MOVE IN THE STONE'S OWN SHADER (the part: SURF.DRY, SURF.SWAG), by place and the world clock; the face turned to
// the window takes the lamp's paint by the baked law of place, as a wall does. Nothing here is a light.
async function buildDrying(ctx, world) {
  const r = ctx.core.makeRng(ctx.core.hashSeed('drying roofs:' + ctx.seed)), m = makeMason(), hs = world.town.houses, D = DRYING, B = LAMP_BAKE;
  const wd = world.light.uWind.value, wl = Math.hypot(wd.x, wd.z) || 1, wx = wd.x / wl, wz = wd.z / wl;
  const linen = ['#D8D4CC', '#C9CED6', '#D6CFC0', '#DAD6CE', '#AEB8C6'], NETDROP = 3.4, TAN = linear('#6A4E3C');
  const out = { houses: hs.length, flank: 0, able: 0, roofs: 0, nets: 0, sheets: 0, shirts: 0, clear: Infinity, sight: Infinity, plane: Infinity, why: [0, 0, 0, 0, 0] };
  const faded = (h) => h.dress.wall.map((v, k) => v * 0.8 + [0.5, 0.5, 0.52][k] * 0.2), pots = world.town.stacks, gulls = world.ridgeGulls || [], lines = [];
  world.dryLines = lines;
  // one line between two heads a and b ([x, y, z], level): its pieces ({ u, w, drop, loose, kind, col, tone }) are tried by place, then hung
  const hangOn = (h, a, b, pieces, tryOnly) => {
    // (every piece's face is turned to the window's side: the lamp's paint lies on the face its rays reach)
    if (-(b[2] - a[2]) * (W0[0] - (a[0] + b[0]) / 2) + (b[0] - a[0]) * (HOUSE.wall - (a[2] + b[2]) / 2) < 0) { const t = a; a = b; b = t; for (const p of pieces) p.u = Math.hypot(b[0] - a[0], b[2] - a[2]) - p.u - p.w; }
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]), nx = Math.abs(b[2] - a[2]) / len, nz = Math.abs(b[0] - a[0]) / len, at = (u, dy) => [a[0] + (b[0] - a[0]) * u / len, a[1] + dy, a[2] + (b[2] - a[2]) * u / len];
    let hung = 0;
    for (const p of pieces) { if (p.u < 0.4 || p.u + p.w > len - 0.4) continue;
      const reach = dryReach(p.drop, p.loose), mid = at(p.u + p.w / 2, 0); let clear = Infinity, sight = Infinity, plane = Infinity, strip = false;
      for (const u of [p.u, p.u + p.w / 2, p.u + p.w]) for (const dy of [0, -p.drop]) { const q = at(u, dy), rr = dy ? reach : 0.1;
        // (nothing in the sight strip of the square: x -14 to 14 from the square to the quay's outer edge)
        if (Math.abs(q[0]) - rr * nx < 14 && q[2] > SQUARE.z0 && q[2] < QUAY.z1) strip = true;
        clear = Math.min(clear, world.near(q[0], q[1], q[2]) - rr); plane = Math.min(plane, Math.abs(q[2]) - rr * nz);
        if (q[2] > 0 && q[2] < D.last) sight = Math.min(sight, Math.abs(q[0]) - rr * nx - D.front * (1 - q[2] / D.last)); }
      if (clear < D.clear || plane < D.plane || sight < D.sight || strip) continue;
      // (off every chimney: a piece's nearest edge 2 m and more from a stack's middle, and no stack abeam of it within its swing)
      if (pots.some((t) => { const tx = t[0] - mid[0], tz = t[2] - mid[2], al = Math.max(0, Math.abs(tx * (b[0] - a[0]) + tz * (b[2] - a[2])) / len - p.w / 2), ac = Math.abs(tx * (b[2] - a[2]) - tz * (b[0] - a[0])) / len; return Math.hypot(al, ac) < 2 || (al < 1 && ac < reach + 1); })) continue;
      hung++; if (tryOnly) continue;
      lines.push({ a: at(p.u, 0), b: at(p.u + p.w, 0), drop: p.drop, reach });
      out.clear = Math.min(out.clear, clear); out.sight = Math.min(out.sight, sight); out.plane = Math.min(out.plane, plane);
      const q4 = (u0, d0, u1, d1, u2, d2, u3, d3) => m.quad(at(u0, -d0), at(u1, -d1), at(u2, -d2), at(u3, -d3), { sub: 0.8, sway: p.loose, lamp: B, ao: 0.95, uv: [p.kind === 'net' ? 0 : u0 + a[0] + a[2], -d0] });
      if (p.kind === 'net') { m.col(TAN, p.tone).set({ surf: SURF.SWAG }); q4(p.u, p.drop, p.u + p.w, p.drop, p.u + p.w, 0, p.u, 0); out.nets++; }
      else if (p.kind === 'shirt') { m.col(p.col, p.tone).set({ surf: SURF.DRY }); const u = p.u;
        q4(u + 0.55, p.drop, u + 2.55, p.drop, u + 2.55, 0.05, u + 0.55, 0.05); q4(u + 0.02, 1.8, u + 0.62, 1.95, u + 0.58, 0.1, u, 0.35); q4(u + 2.48, 1.95, u + 3.08, 1.8, u + 3.1, 0.35, u + 2.52, 0.1); out.shirts++; }
      else { m.col(p.col, p.tone).set({ surf: SURF.DRY }); q4(p.u, p.drop, p.u + p.w, p.drop, p.u + p.w, 0.05, p.u, 0.05); out.sheets++; } }
    if (hung && !tryOnly) { m.col(PAL.rope, 0.8).set({ surf: SURF.PLAIN, sway: 0 }); bar(m, at(0, 0), at(len, 0), 0.05, { lamp: 0 }); }
    return hung; };
  // a pole from its foot to its head, two struts along the line's own way footing it
  const pole = (x, z, y0, y1, ex, ez) => { m.col(PAL.spar, 0.9).set({ surf: SURF.WOOD, sway: 0 }).post(x, z, y0 - 0.4, y1, 0.17, 0.11, 5, { aoLow: 0.7, lamp: B });
    for (const sd of [-1, 1]) bar(m, [x + ex * 1.3 * sd, y0 - 0.1, z + ez * 1.3 * sd], [x, y0 + 0.45 * (y1 - y0), z], 0.07, { lamp: B }); };
  // the linen of one line: up to four pieces along it from its first end, by the house's own lot
  const linenOf = (h, lot, len, d0, d1) => { const ps = []; let u = 0.5;
    for (const [kd, w, dr, pick, tone, gap] of lot) { const shirt = kd < 0.28, ww = shirt ? 3.1 : w, col = pick < 0.6 ? linear(linen[Math.floor(pick / 0.6 * linen.length)]) : faded(h);
      if (u + ww <= len - 0.5) { ps.push({ u, w: ww, drop: shirt ? 2.9 : d0 + (d1 - d0) * dr, loose: 1, kind: shirt ? 'shirt' : 'sheet', col, tone }); u += ww + gap; } }
    return ps; };
  const first = r.int(0, 1), slen = (STREET.z1 - STREET.z0) / 4; let due = r.int(0, 3) / 4;
  for (let i = 0; i < hs.length; i++) { const h = hs[i], netDraw = r.chance(0.4), nLen = r.range(6, 10), nAt = r(), nTone = r.range(0.85, 1.1), lot = [];
    for (let k = 0; k < 4; k++) lot.push([r(), r.range(4.2, 6.2), r(), r(), r.range(0.86, 1), r.range(0.4, 0.9)]);
    if (i % 5 === 4) await ctx.yield();
    const [p, q] = h.ridge, l = Math.hypot(q[0] - p[0], q[1] - p[1]), ex = (q[0] - p[0]) / l, ez = (q[1] - p[1]) / l;
    if (isFlank(h)) { const [pa, pb] = flankPoles(h), y = h.rd + D.line, len = Math.hypot(pb[0] - pa[0], pb[2] - pa[2]), hz = (p[1] + q[1]) / 2;
      const net = (Math.floor((hz - STREET.z0) / slen) + (p[0] > 0 ? 1 : 0) + first) % 2 === 0, nl = Math.min(nLen, len - 1);
      const pieces = net ? [{ u: 0.5 + nAt * (len - 1 - nl), w: nl, drop: NETDROP, loose: 0.6, kind: 'net', tone: nTone }] : linenOf(h, lot, len, 3.2, 4.0);
      pole(pa[0], pa[2], h.rd, pa[1], ex, ez); pole(pb[0], pb[2], h.rd, pb[1], ex, ez);
      if (hangOn(h, [pa[0], y, pa[2]], [pb[0], y, pb[2]], pieces)) out.flank++; continue; }
    // (one house in four: every house of the rows adds a quarter to what is due; the line goes to the first roof that can carry one)
    due += 0.25;
    if (h.form === 'lean') { out.why[0]++; continue; } if (l < 2 * D.rowInset + 5) { out.why[1]++; continue; } if (gulls.some((g) => g.house === h)) { out.why[2]++; continue; }
    // the lee slope: the side of the ridge the wind blows toward; the poles stand DRYING.off down it, on the slates
    const sgn = (-ez * wx + ex * wz) > 0 ? 1 : -1, nx = -ez * sgn, nz = ex * sgn, len = l - 2 * D.rowInset, y = h.rd + D.rowLine;
    const roof = h.planes.filter((P) => P[1] > 0.05).sort((P, Q) => (Q[0] * nx + Q[2] * nz) - (P[0] * nx + P[2] * nz))[0]; if (!roof) continue;
    const foot = (x, z) => Math.min(h.rd, (roof[3] - roof[0] * x - roof[2] * z) / roof[1]);
    const a = [p[0] + ex * D.rowInset + nx * D.off, y, p[1] + ez * D.rowInset + nz * D.off], b = [q[0] - ex * D.rowInset + nx * D.off, y, q[1] - ez * D.rowInset + nz * D.off];
    // (the piece at its full swing lies over the house's own roof)
    if (planOff(h.fp, (a[0] + b[0]) / 2 + nx * 2.8, (a[2] + b[2]) / 2 + nz * 2.8) > 0.9) { out.why[3]++; continue; }
    const nl = Math.min(nLen, len - 1), pieces = netDraw && nl >= 5 ? [{ u: 0.5 + nAt * (len - 1 - nl), w: nl, drop: NETDROP, loose: 0.6, kind: 'net', tone: nTone }] : linenOf(h, lot, len, 2.6, 3.6);
    // (a roof whose every piece fails its place is passed over: it is not counted among the able)
    if (!hangOn(h, a, b, pieces, due < 1)) { out.why[4]++; continue; }
    out.able++; if (due >= 1) { due -= 1; out.roofs++; for (const e of [a, b]) pole(e[0], e[2], foot(e[0], e[2]), y + 0.2, ex, ez); }
  }
  for (const k of ['clear', 'sight', 'plane']) out[k] = out[k] === Infinity ? null : Math.round(out[k] * 10) / 10;
  world.drying = out;
  if (!m.count) return;
  await ctx.yield(); await world.bake(m); await ctx.yield();
  const geo = m.geometry(); await ctx.yield();
  const mesh = new THREE.Mesh(geo, world.thingsMat); mesh.name = 'drying-roofs'; world.scene.add(mesh);
  await ctx.yield();
}

// ================================================================ the far land, the trees, the weather of the dusk
async function buildFar(ctx, world) {
  const fixed = ctx.core.makeRng(64138), noise = world.noise, G = world.ground, m = makeMason();
  // two layers of far ridge, the same on every seed: walls of blue rock round the north, falling to nothing as the two
  // headlands run out south-east and south-west; the open sea lies between them
  for (const [R, hi, lo, k] of [[720, 125, 40, 0.9], [1180, 190, 85, 0.75]]) {
    const N = 96, span = 250 * DEG, at = (i) => { const a = -span / 2 + span * i / N, t = Math.abs(a) / (span / 2);
      const h = (lo + (hi - lo) * (0.5 + 0.5 * noise.fbm2(Math.cos(a) * 2.2 + R * 0.01, Math.sin(a) * 2.2, 4))) * (1 - smoothstep(0.55, 1, t)) ** 1.5;
      return [Math.sin(a) * R, h, 100 - Math.cos(a) * R]; };
    m.col('#4A5348', k).set({ surf: SURF.ROCK });
    for (let i = 0; i < N; i++) { const a = at(i), b = at(i + 1); m.quad([b[0], -2, b[2]], [a[0], -2, a[2]], [a[0], a[1], a[2]], [b[0], b[1], b[2]], { uv: [i * 30, 0], ao: [0.6, 0.6, 1, 1] }); }
  }
  await ctx.yield();
  // THE PINES on the crown, wind-bent, to y 92; and dark thorn and pine scattered over the hill's shoulders outside the town
  let treeClear = Infinity;
  const tree = (x, z, h, lean) => { const y = G.h(x, z) - 0.3, top = [x + lean[0] * h * 0.35, y + h * 0.62, z + lean[1] * h * 0.35];
    // (r5m1, M2: THE WHOLE CROWN LEANS with the gust that passes the tree and recovers behind it: the stem's head and the
    // lowest tier 8 in 100 of the tree's height at the full gust, the middle 11, the highest 14; the foot is rooted)
    m.col(PAL.spar, 0.7).set({ surf: SURF.PLAIN, sway: 0 }); bar(m, [x, y, z], top, 0.22 + h * 0.02, { r1: 0.12, sway: [0, 0, h * 0.08, h * 0.08] });
    for (let k = 0; k < 3; k++) { const cx = top[0] + lean[0] * h * (0.12 + 0.2 * k), cz = top[2] + lean[1] * h * (0.12 + 0.2 * k), cy = top[1] + h * (0.28 - 0.1 * k), rr = h * (0.3 - 0.05 * k), sw = h * (0.14 - 0.03 * k);
      treeClear = Math.min(treeClear, world.near(cx, cy, cz) - rr - sw * 1.05);
      m.col(PAL.vine, 0.5 + 0.2 * fixed()).set({ surf: SURF.LEAF, sway: sw }).post(cx, cz, cy - h * 0.07, cy + h * 0.1, rr, rr * 0.35, 7, { aoLow: 0.55, aoHigh: 1 });
      m.post(cx, cz, cy - h * 0.1, cy - h * 0.07, rr * 0.5, rr, 7, { open: true, aoLow: 0.45, aoHigh: 0.55 }); } };
  for (let i = 0; i < 11; i++) { const a = fixed() * TAU, rr = 4 + 15 * Math.sqrt(fixed()), x = CROWN.x + Math.cos(a) * rr, z = CROWN.z + Math.sin(a) * rr * 0.7, h = Math.min(8.5 + 3 * fixed(), 92.5 - G.h(x, z) - 0.6); tree(x, z, h, [0.8, 0.25]); if (i % 3 === 2) await ctx.yield(); }
  for (let i = 0, n = 0; i < 900 && n < 150; i++) { if (i % 6 === 5) await ctx.yield(); const x = -330 + 660 * fixed(), z = -200 + 440 * fixed(), y = G.h(x, z);
    const out = Math.max(0, x - G.eastOf(z), -G.westOf(z) - x); if (out < 12 || y < 9 || noise.fbm2(x * 0.011 + 7, z * 0.011 - 3, 3) < -0.05) continue;
    tree(x, z, 5 + 5 * fixed(), [0.6 + 0.3 * fixed(), 0.2]); n++; if (n % 3 === 2) await ctx.yield(); }
  await ctx.yield();
  m.set({ sway: 0 }); world.treeClear = Math.round(treeClear * 10) / 10;
  const mesh = new THREE.Mesh(m.geometry(), stoneMaterial(world.light, { side: THREE.DoubleSide })); mesh.name = 'far-land-and-trees'; world.scene.add(mesh);
  await ctx.yield();
  // ---- THE WEATHER (the seed's): cloud stands in the dome (the kit's layers, see the sky); mist is sea mist in banks either
  // side of the lane
  if (world.weather === 'mist') {
    // sea mist: banks of soft puffs under y 14, outside the mouth (from the loop's seaward side out past the entry, MIST),
    // either side of the quay's own breadth, nothing over the lane;
    // a medium (it thins within 3 m of the eye). The seed deals where the banks lie; they drift on the world clock.
    const rM = world.rngs.rMist, NP = 70, mg = new THREE.InstancedBufferGeometry(), io = new Float32Array(NP * 4), ip = new Float32Array(NP * 4);
    mg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); mg.setIndex([0, 1, 2, 0, 2, 3]);
    for (let i = 0; i < NP; i++) { const sd = i % 2 ? 1 : -1; io.set([sd * rM.range(MIST.x0, MIST.x1), rM.range(0.5, 3), rM.range(MIST.z0, MIST.z1), rM.range(0, 50)], i * 4); ip.set([rM.range(45, 110), rM.range(8, 11), rM.range(0.6, 1), 0], i * 4); }
    mg.setAttribute('iO', new THREE.InstancedBufferAttribute(io, 4)); mg.setAttribute('iP', new THREE.InstancedBufferAttribute(ip, 4)); mg.instanceCount = NP;
    mg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 520), 760);
    const mm = new THREE.ShaderMaterial({ uniforms: { uTime: world.light.uTime, uCol: { value: new THREE.Color('#AEBFDC') }, uSide: { value: world.windSide } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec4 iO, iP; uniform float uTime, uSide; varying vec2 vUv; varying vec3 vW; varying float vPh, vA;
        // a bank drifts 60 m down the wind and begins again: it is nothing at both ends of that run (no bank is seen to jump)
        void main(){ vec3 c = iO.xyz; float run = mod(uTime * .35 + iO.w * 9., 60.); c.x += uSide * run - uSide * 30.;
          vec3 side = normalize(cross(vec3(0., 1., 0.), cameraPosition - c));
          vec3 w = c + side * position.x * iP.x + vec3(0., position.y * iP.y, 0.);
          vUv = position.xy; vW = w; vPh = iO.w; vA = iP.z * smoothstep(0., 9., run) * (1. - smoothstep(51., 60., run)); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
      fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vW; varying float vPh, vA;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main(){ float n = vn(vec2(vUv.x * 2.3 + vPh, vUv.y * 1.7 + uTime * .02)) * .6 + vn(vec2(vUv.x * 6. - vPh, vUv.y * 4.)) * .4;
          float a = (1. - vUv.x * vUv.x) * smoothstep(0., .25, vUv.y) * smoothstep(1., .35, vUv.y + .35 * (n - .5)) * (.45 + .55 * n);
          a *= smoothstep(40., 95., abs(vW.x)) * smoothstep(.8, 3., length(vW - cameraPosition)) * .6 * vA;
          if (a < .004) discard; gl_FragColor = vec4(uCol * (.75 + .3 * vUv.y), a); }` });
    const mist = new THREE.Mesh(mg, mm); mist.name = 'sea-mist'; mist.renderOrder = 6; world.scene.add(mist);
  }
}

// ================================================================ THE TOWN STANDS IN THE WATER (r5)
// ONE SHEET over the bay, under the surf and the gold road, drawn BY THE MIRROR LAW that any water keeps: for a place of the
// water the eye's ray is turned about the water's own normal there (its ripple's slope, a law of place and the world clock)
// and what that turned ray meets is what the water shows, dimmed. What it can meet is THE TOWN AS IT STANDS, kept cheaply:
// the quay's face, the jetty and the mole as upright faces on their own lines; the beacon and the skerry's stacks as round
// bodies; every moored hull as its own box with its masts, the lugger with her sails; and THE HOUSE ROWS AS UPRIGHT BANDS on
// the rows' own front lines (z of ROWS), each band holding by place along the quay (one texel a metre) the wall's head, the
// ridge, the wash and the roof's colour of the house that stands there (the gable's own triangle on a gabled house, the
// hip's slope on a hipped one); behind them one band for the houses above the rows and one for the hill's own skyline.
// The image is strongest at the foot of the thing mirrored and goes out with the way the turned ray has run (BAY.reach).
// NOTHING IN IT IS LIT: it shows washes, slate and stone under the dusk's own light as they stand, no lamp, no pane.
// THE WATER IS NOT ONE TEXTURE (the same sheet): by place in the bay, WIND PATCHES (a finer, steeper, darker ripple, the
// mirror broken) and CALM SLICKS (the ripple laid, the sky's own blue and the afterglow's rose held smooth by bearing),
// long along the wind and drifting down it at BAY.drift metres a second on the world clock; their places from the
// water's own stream by name ('wind on the bay' and the seed), taken once. Round every moored hull soft rings lap outward.
const BAY = { x0: -160, x1: 160, n: 320, zs: [ROWS[0].z1, ROWS[1].z1, ROWS[2].z1, ROWS[3].z1, 100, 60], top: 128, reach: 170, drift: 0.35, cell: 46, dim: 0.75 };
async function buildBayMirror(ctx, world) {
  const N = BAY.n, NL = BAY.zs.length, data = new Uint8Array(N * NL * 2 * 4), G = world.ground, L = world.light;
  // the dusk's own light on a face turned to the bay (the stone shader's ambient at the horizon and the last light's share on
  // such a face), dimmed by the mirror; no lamp is in it
  const fill = [0, 1, 2].map((k) => (0.5 * (L.uGround.value.getComponent(k) + L.uSky.value.getComponent(k)) * L.uAmb.value * 0.9 + L.uKeyCol.value.getComponent(k) * Math.max(0, KEY_DIR[2]) * 0.8) * BAY.dim);
  const enc = (c, k) => Math.round(255 * Math.sqrt(clamp(c[k] * fill[k], 0, 1))), hgt = (y) => Math.round(255 * clamp(y / BAY.top, 0, 1));
  // one metre of one band: the head of the wall and the ridge there, the wall's colour and the roof's (the tallest thing wins)
  const set = (l, i, wt, rd, wall, roof) => { if (i < 0 || i >= N) return; const a = (l * 2 * N + i) * 4, b = a + N * 4; if (hgt(rd) <= data[b + 3]) return;
    for (let k = 0; k < 3; k++) { data[a + k] = enc(wall, k); data[b + k] = enc(roof, k); } data[a + 3] = hgt(wt); data[b + 3] = hgt(rd); };
  const stone = linear(PAL.stone, 0.85), turf = linear(PAL.turf, 0.9), ix = (x) => Math.round((x - BAY.x0) / (BAY.x1 - BAY.x0) * N - 0.5);
  // the hill's own skyline by place along the quay (the highest ground behind the rows), and the terraces the rows stand on
  for (let i = 0; i < N; i++) { const x = BAY.x0 + (i + 0.5) / N * (BAY.x1 - BAY.x0); let top = 0;
    for (let z = -60; z <= 112; z += 6) top = Math.max(top, world.hillH(x, z));
    set(NL - 1, i, top, top, turf, turf);
    ROWS.forEach((row, r) => { if (r > 0 && x > -G.westOf(row.z1) && x < G.eastOf(row.z1)) set(r, i, row.g, row.g, stone, stone); });
    if (i % 40 === 39) await ctx.yield(); }
  // the houses: a row house in its own row's band, every other house in the band behind the rows
  let k = 0;
  for (const h of world.town.houses) { const xs = h.fp.map((p) => p[0]), zf = Math.max(...h.fp.map((p) => p[1])), xa = Math.min(...xs), xb = Math.max(...xs), w = xb - xa, xc = (xa + xb) / 2;
    let l = ROWS.findIndex((row) => Math.abs(row.z1 - zf) < 2); if (l < 0) l = NL - 2;
    const dep = zf - Math.min(...h.fp.map((p) => p[1])), hipL = Math.max(0.5, Math.min(dep / 2, w / 2 - 0.8));
    for (let i = ix(xa); i <= ix(xb); i++) { const x = BAY.x0 + (i + 0.5) / N * (BAY.x1 - BAY.x0), e = Math.min(x - xa, xb - x); if (e < 0) continue;
      if (h.form === 'gable') { const y = h.wt + (h.rd - h.wt) * clamp(1 - Math.abs(x - xc) / (w / 2), 0, 1); set(l, i, y, y, h.dress.wall, h.dress.wall); }
      else set(l, i, h.wt, h.form === 'hip' ? h.wt + (h.rd - h.wt) * clamp(e / hipL, 0, 1) : h.rd, h.dress.wall, h.dress.roof); }
    if (++k % 12 === 11) await ctx.yield(); }
  // the tower and the tall house under the hill's crown stand in the band behind the rows too (unlit walls: the lamp's own
  // image is the gold road, drawn by its own sheet)
  for (let i = ix(TOWER.x - TOWER.half); i <= ix(TOWER.x + TOWER.half); i++) set(NL - 2, i, TOWER.top, TOWER.top, stone, stone);
  { const hy = world.hero.object.position.y, chalk = linear(PAL.chalk, 0.9), slate = linear(PAL.slate, 0.9); for (let i = ix(-HOUSE.hw); i <= ix(HOUSE.hw); i++) set(NL - 2, i, hy + HOUSE.eaves, hy + HOUSE.ridge, chalk, slate); }
  const tex = new THREE.DataTexture(data, N, NL * 2, THREE.RGBAFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  world.bayRows = tex;
  await ctx.yield();
  // the upright faces: the quay's face, the jetty's three, the mole's two sides in four chords each (x, z, x, z; the face's head)
  const segs = [[QUAY.x0, QUAY.z1, QUAY.x1, QUAY.z1, QUAY.y], [JETTY.x0, JETTY.z0, JETTY.x0, JETTY.z1, JETTY.y], [JETTY.x0, JETTY.z1, JETTY.x1, JETTY.z1, JETTY.y], [JETTY.x1, JETTY.z1, JETTY.x1, JETTY.z0, JETTY.y]];
  { const { cl, off } = world.mole; for (const [d, y] of [[-MOLE.hw, MOLE.y], [MOLE.hw, MOLE.parapet]]) for (let j = 0; j < 4; j++) {
      const a = off(cl[Math.round(j / 4 * (cl.length - 1))], d), b = off(cl[Math.round((j + 1) / 4 * (cl.length - 1))], d); segs.push([a[0], a[1], b[0], b[1], y]); } }
  // the round bodies: the beacon (dark stone) and the skerry's stacks (x, z, radius, head)
  const rounds = [[BEACON.x, BEACON.z, BEACON.r, MOLE.y + BEACON.h - 4]]; for (const [x, y, z, r] of world.skerry) if (rounds.length < 8) rounds.push([x, z, r * 2, y]);
  return finishBayMirror(ctx, world, tex, fill, segs, rounds);
}
const BAY_FRAG = /* glsl */`
  uniform sampler2D uRows, uDepthTex; uniform vec4 uBand, uDepthRect, uSeg[12], uRound[8], uBoat[16], uBoatD[16], uBoatE[16], uLug, uPatch;
  uniform float uRowZ[6], uSegH[12], uTime, uFogD, uY, uReach, uDrift; uniform vec3 uWind, uFogC, uStone, uDark, uRock, uSpar, uSail, uHor, uMid, uRose, uDeep; uniform vec2 uWest, uLugS;
  varying vec3 vW; varying vec2 vUv;
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  float cr(vec2 a, vec2 b){ return a.x * b.y - a.y * b.x; }
  // one small wave's share of the water's slope: its bearing d, its length from crest to crest, its steepness; it runs at
  // the pace a wave of that length has on deep water and is left out where a picture's grain is coarser than the wave
  // (what is left out is kept as LOST steepness: the mirror's image is smeared by it along the turned ray's rise)
  float lost;
  vec2 wv(vec2 p, vec2 d, float len, float steep, float bend, float foot){ float k = 6.2832 / len, f = smoothstep(len * .25, len * .7, foot); lost += steep * f;
    return d * (steep * (1. - f) * cos(dot(p, d) * k - uTime * sqrt(9.81 * k) + bend)); }
  vec2 ripple(vec2 p, float foot){ lost = 0.; float b = vn(p * .11 + vec2(uTime * .05, -uTime * .04)) * 9.;
    return wv(p, vec2(.731, -.682), 9., .03, b, foot) + wv(p, vec2(.966, .259), 4.3, .04, b * 1.3, foot) + wv(p, vec2(.342, -.94), 2.3, .045, b * 1.7, foot)
      + wv(p, vec2(.94, -.342), 1.2, .045, b * 2.3, foot) + wv(p, vec2(.5, .866), .62, .04, b * 3.1, foot); }
  void main(){
    vec2 q = vW.xz; vec3 ev = vW - cameraPosition; float dist = length(ev); vec3 v = ev / max(dist, .01);
    float fx = length(dFdx(q)), fy = length(dFdy(q)), foot = max(fx, fy), thin = max(.17, .7 * min(fx, fy));      // the picture's grain on the water here, taken before any way out
    if (v.y > -.003) discard;
    vec2 duv = (q - uDepthRect.xy) * uDepthRect.zw; float inside = step(0., min(min(duv.x, duv.y), min(1. - duv.x, 1. - duv.y)));
    float wet = mix(1., smoothstep(.15, 1.3, textureLod(uDepthTex, clamp(duv, 0., 1.), 0.).r), inside);
    float edge = smoothstep(0., .1, min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y)));
    if (wet * edge < .004) discard;
    // THE PATCHES by place, long along the wind, drifting down it on the world clock
    vec2 wd = normalize(uWind.xz), wp = vec2(-wd.y, wd.x), pq = q - wd * (uDrift * uTime) + uPatch.xy, pl = vec2(dot(pq, wd) * .32, dot(pq, wp)) * uPatch.z;
    float P = .62 * vn(pl) + .38 * vn(pl * 2.3 + 7.1) + uPatch.w, gust = smoothstep(.56, .68, P), slick = 1. - smoothstep(.33, .45, P);
    float rough = 1. + .9 * gust - .8 * slick; vec2 s = ripple(q, foot) * rough; float smear = lost * rough;
    vec3 n = normalize(vec3(-s.x, 1., -s.y)), r = reflect(v, n); r.y = max(r.y, .004);
    vec2 rh = r.xz; float rl = max(length(rh), 1e-4), tB = 1e9, tM = 1e9, cM = 0., ring = 0.; vec3 cB = vec3(0.);
    // the upright faces of quay, jetty and mole
    for (int i = 0; i < 12; i++){ vec2 a = uSeg[i].xy, e = uSeg[i].zw - a, d = a - q; float den = cr(rh, e); if (abs(den) < 1e-5) continue;
      float t = cr(d, e) / den, u = cr(d, rh) / den; if (t > .05 && t < tB && u >= 0. && u <= 1. && uY + t * r.y < uSegH[i]) { tB = t; cB = uStone; } }
    // the round bodies: the beacon, the skerry's stacks
    for (int i = 0; i < 8; i++){ vec4 c = uRound[i]; if (c.z <= 0.) continue; vec2 d = c.xy - q; float tm = dot(d, rh) / (rl * rl), h2 = c.z * c.z - (dot(d, d) - tm * tm * rl * rl);
      if (h2 > 0.) { float t = tm - sqrt(h2) / rl, head = c.w * (i == 0 ? 1. : 1. - .8 * sqrt(max(1. - h2 / (c.z * c.z), 0.)));       // a stack narrows to its head
        if (t > .05 && t < tB && uY + t * r.y < head) { tB = t; cB = i == 0 ? uDark : uRock; } } }
    // the hulls (a box each on its own keel), their masts, the rings that lap out from them
    for (int i = 0; i < 16; i++){ vec4 b = uBoat[i], D = uBoatD[i], E = uBoatE[i]; if (D.x <= 0.) continue; vec2 d = q - b.xy;
      vec2 o = vec2(d.x * b.z - d.y * b.w, d.x * b.w + d.y * b.z), dr = vec2(rh.x * b.z - rh.y * b.w, rh.x * b.w + rh.y * b.z);
      float out2 = length(max(abs(o) - D.xy, 0.));
      if (out2 > 60. + D.w * 4.) continue;
      ring += smoothstep(0., .5, out2) * (1. - smoothstep(.5, 6., out2)) * (.5 + .5 * sin(6.2832 * (out2 / 1.4 - uTime / 3.4) + float(i) * 1.7));
      vec2 sd = mix(vec2(1e-5), dr, step(vec2(1e-5), abs(dr))), t1 = (-D.xy - o) / sd, t2 = (D.xy - o) / sd;
      float tn = max(min(t1.x, t2.x), min(t1.y, t2.y)), tf = min(max(t1.x, t2.x), max(t1.y, t2.y));
      if (tf > tn && tn > .05 && tn < tB && uY + tn * r.y < (D.x > 8. ? 2.7 : 1.9)) { tB = tn; cB = E.rgb; }
      for (int k = 0; k < 2; k++){ float mx = k == 0 ? D.z : E.w, top = k == 0 ? D.w : 21.; if (mx > 90.) continue; vec2 m = vec2(mx, 0.) - o; float tm = dot(m, dr) / (rl * rl), off = abs(cr(m, dr)) / rl, y = uY + tm * r.y;
        if (tm > .05 && tm < tM && off < thin && y < top && y > 1.5) { tM = tm; cM = .17 / thin; } } }
    // the lugger's two sails, upright, each on its own line through its own mast
    { vec2 hd = vec2(uLug.y, uLug.w); float den = cr(rh, uLugS); if (abs(den) > 1e-5) for (int k = 0; k < 2; k++){ vec2 d = uLug.xz + hd * (k == 0 ? 3.5 : -8.6) - q; float t = cr(d, uLugS) / den, sa = cr(d, rh) / den, y = uY + t * r.y;
        if (t > .05 && t < tB && (k == 0 ? (sa > -7.5 && sa < 9.5 && y > 5.2 && y < 22. + .5 * (sa + 7.5)) : (sa > -3.8 && sa < 2. && y > 5. && y < 15. + .78 * (sa + 3.8)))) { tB = t; cB = uSail; } } }
    // the rows' bands, the nearest first: a wall under its head, a roof under its ridge
    // (a band's head is soft by the smear; a nearer band lies over a farther one, and all of them over what stands behind)
    float rowA = 0., rowT = 1e9; vec3 rowC = vec3(0.);
    // (every band is asked, in a loop of six with no way out of it, its texels read at their own size: no picture's grain is in it)
    if (r.z < -1e-4) for (int l = 0; l < 6; l++){ float t = (uRowZ[l] - q.y) / r.z, x = q.x + t * r.x, y = uY + t * r.y, u = (x - uBand.x) * uBand.y;
      float open = step(t, tB) * (l < 5 ? step(0., u) * step(u, 1.) : 1.); u = clamp(u, .002, .998);
      vec4 wa = textureLod(uRows, vec2(u, (float(l) * 2. + .5) / uBand.w), 0.), ro = textureLod(uRows, vec2(u, (float(l) * 2. + 1.5) / uBand.w), 0.);
      float bl = max(t * 1.2 * smear, .06), cv = open * (1. - smoothstep(-bl, bl, y - ro.a * uBand.z)) * step(.002, ro.a) * (1. - rowA);
      rowC += cv * mix(wa.rgb * wa.rgb, ro.rgb * ro.rgb, smoothstep(-bl, bl, y - wa.a * uBand.z)); rowA += cv; if (cv > .01) rowT = min(rowT, t); }
    float seen = 1.;
    if (rowA > .01) { if (tB < 1e8) cB = rowC + (1. - rowA) * cB; else { cB = rowC / rowA; seen = rowA; } tB = rowT; }
    if (tM < tB) { if (tB < 1e8) cB = mix(cB, uSpar, cM); else { cB = uSpar; seen = cM; } tB = tM; }
    // how strongly the water mirrors: most at a grazing look, and less the farther the turned ray has run to its thing
    float graze = mix(.92, .4, smoothstep(.05, .75, -v.y)), aH = step(tB, 1e8) * seen * graze * (1. - smoothstep(uReach * .15, uReach, tB * rl)) * .92;
    // a slick holds the sky by the turned ray's bearing (the afterglow's rose toward the west, the dusk's blue elsewhere); a
    // wind patch is the deep water's own tone under a fine ripple
    vec3 sky = mix(uHor, uMid, smoothstep(0., .45, r.y)); sky = mix(sky, uRose, .8 * pow(max(dot(rh / rl, uWest), 0.), 2.) * (1. - smoothstep(.12, .6, r.y)));
    float fine = vn(vec2(dot(q, wd) * .7, dot(q, wp) * 2.6) + vec2(uTime * .7, 0.)) * (1. - smoothstep(.3, 1.5, foot));
    float aS = slick * .5 * graze, aG = gust * (.15 + .17 * fine), aR = .2 * clamp(ring, 0., 1.) * graze, a = clamp(aS + aG + aR, 0., 1.);
    vec3 col = (sky * (aS + aR) + uDeep * aG) / max(aS + aG + aR, 1e-4);
    float A = aH + a * (1. - aH); col = (cB * aH + col * a * (1. - aH)) / max(A, 1e-4); A *= wet * edge;
    if (A < .004) discard;
    gl_FragColor = vec4(mix(uFogC, col, exp(-pow(uFogD * dist, 2.))), A);
  }`;
// the mirror's sheet: its uniforms, its law, its place. (A function of its own so that no build step runs long.)
async function finishBayMirror(ctx, world, tex, fill, segs, rounds) {
  const L = world.light, sea = world.sea, V4 = (a, b, c, d) => new THREE.Vector4(a, b, c, d), tone = (c, k = 1) => new THREE.Vector3(c[0] * fill[0] * k, c[1] * fill[1] * k, c[2] * fill[2] * k);
  // THE WATER'S OWN STREAM, by name, taken once: where the patches lie (two measures), how broad they are, how much of the
  // bay the wind holds on this visit
  const rW = ctx.core.makeRng(ctx.core.hashSeed('wind on the bay:' + ctx.seed)), patch = V4(rW.range(0, 900), rW.range(0, 900), 1 / (BAY.cell * rW.range(0.85, 1.2)), rW.range(-0.05, 0.05));
  const boats = world.boats.slice(0, 15), NB = boats.length, uBoat = [], uBoatD = [], uBoatE = [];
  for (let i = 0; i < 16; i++) { const o = i < NB ? boats[i] : i === NB ? world.lugger : null;
    uBoat.push(o ? V4(o.x, o.z, Math.cos(o.yaw), Math.sin(o.yaw)) : V4(0, 0, 1, 0));
    uBoatD.push(o ? V4(o.L * 0.46, o.B * 0.42, o.kind === 2 ? 1.2 : o.kind === 1 ? 2.5 : 3.5, o.top) : V4(0, 0, 0, 0));
    uBoatE.push(o ? V4(o.paint[0] * fill[0], o.paint[1] * fill[1], o.paint[2] * fill[2], o.kind === 0 || o.kind === 3 ? -8.6 : 99) : V4(0, 0, 0, 99)); }
  while (segs.length < 12) segs.push([0, 0, 0, 0, -1]); while (rounds.length < 8) rounds.push([0, 0, 0, 0]);
  // the sheet lies over the water the line flies and what stands in it (the line's own samples, the skerry, the lugger's beat)
  let xa = QUAY.x0, xb = QUAY.x1, zb = QUAY.z1; { const LN = world.line; for (let i = 0; i < LN.length; i += 24) if (LN[i + 2] > QUAY.z1) { xa = Math.min(xa, LN[i]); xb = Math.max(xb, LN[i]); zb = Math.max(zb, LN[i + 2]); } }
  for (const [x, , z] of world.skerry) { xa = Math.min(xa, x); xb = Math.max(xb, x); zb = Math.max(zb, z); }
  xa -= 90; xb += 90; zb += 60;
  const wl = sea.light || null, g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uRows: { value: tex }, uBand: { value: V4(BAY.x0, 1 / (BAY.x1 - BAY.x0), BAY.top, BAY.zs.length * 2) }, uRowZ: { value: BAY.zs.slice() },
      uSeg: { value: segs.map((s) => V4(s[0], s[1], s[2], s[3])) }, uSegH: { value: segs.map((s) => s[4]) }, uRound: { value: rounds.map((s) => V4(...s)) },
      uBoat: { value: uBoat }, uBoatD: { value: uBoatD }, uBoatE: { value: uBoatE }, uLug: { value: world.lugAt }, uLugS: { value: world.lugSail }, uSail: { value: tone(world.lugger.cloth, 1.05) },
      uStone: { value: tone(linear(PAL.stone, 0.85)) }, uDark: { value: tone(linear(PAL.stone, 0.24)) }, uRock: { value: tone(linear(PAL.rock, 0.5)) }, uSpar: { value: tone(linear(PAL.spar, 0.9)) },
      uHor: { value: sea.uniforms.uHorizon.value }, uMid: { value: sea.uniforms.uMid.value }, uRose: { value: sea.uniforms.uScatterCol.value }, uDeep: { value: new THREE.Color('#27325A') },
      uWest: { value: new THREE.Vector2(KEY_DIR[0], KEY_DIR[2]).normalize() }, uPatch: { value: patch }, uWind: L.uWind, uTime: L.uTime, uY: { value: 0.5 }, uReach: { value: BAY.reach }, uDrift: { value: BAY.drift },
      uDepthTex: sea.uniforms.uDepthTex, uDepthRect: sea.uniforms.uDepthRect, uFogC: { value: world.scene.fog.color }, uFogD: { value: world.scene.fog.density } },
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: BAY_FRAG, transparent: true, depthWrite: false,
  });
  mat.bayRows = tex;                                                 // the texture is a plain property of its material too
  const sheet = new THREE.Mesh(g, mat); sheet.name = 'the-town-in-the-water'; sheet.scale.set(xb - xa, 1, zb - (QUAY.z1 - 6)); sheet.position.set((xa + xb) / 2, 0.5, (zb + QUAY.z1 - 6) / 2); sheet.renderOrder = 2;
  world.scene.add(sheet);
  // the lugger's hull moves: her place and heading as she sails (the same Vector4 her wake reads)
  const lugB = uBoat[NB];
  world.updates.push(() => { const a = world.lugAt; lugB.set(a.x, a.z, a.y, -a.w); });
  world.bay = { sheet, patches: [Math.round(patch.x), Math.round(patch.y), Math.round(1 / patch.z)], hulls: NB + 1 };
  await ctx.yield();
}
