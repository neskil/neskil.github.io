// CHECKERBOARD APPROACH: the hero set piece. Kowloon in the 1990s as an airliner on the old harbour approach
// sees it: a carpet of 12 to 16 storey tenement slabs whose roofs are a second city (forests of fishbone TV
// aerials, water tanks, tin shacks, laundry, bamboo scaffolding, unlit neon frames), a walled-city mass, a 100 m
// hill with a 100 m orange and white checkerboard standing in a shaft of storm light, towers flanking the last
// kilometre, and a 3.3 km runway on a promontory running out into the harbour.
// NOTE: no brief existed when this was sculpted (only the concept note), so the coordinates below ARE the
// layout; the world should be built round them.
//
// FRAME (local metres). Origin = runway threshold bar, on the runway surface. +Y up. +Z = the landing heading
// (the "front": the final approach flies toward +Z and the runway runs from z = -70 to z = 3300). Facing +Z,
// the apron and terminal are to the left (+X), the open harbour to the right (-X). City street level and the
// runway deck are y = 0; the harbour surface belongs to the world: put water at y = -4 (anchors.waterY).
// The city fills z < -330 (and the waterfront strip x < -150, z < -95). The approach (round five): enter at
// (-605, 158, -2012) heading (0.731, 0, 0.682), the checkerboard 550 m ahead and a little to the right; after 480 m,
// from (-254, 124, -1685), a 47 degree right turn of radius 800 m about (-800, -1100) is flown ROUND the hill, which
// stands inside the turn (the board's centre is 128 m from the line and faces the incoming aircraft), over a floodlit
// playground with a running track (dead ahead through the middle of the turn, low roofs before it) and past the walled city, to roll out at (0, 84, -1100); then the 3.8 degree final
// down the avenue x = 0 to the threshold. Hill centre (-240, -1457), summit 100 m; the board is 100 m square (round nine).
// The last third: a wide-body holds short of the runway at the threshold with two more queued on the taxiway, a lit
// pier, a control tower and a hangar stand on the promontory, and across a typhoon shelter (x 215..400, z > 470) the
// blocks and towers of the far shore flank the runway. The wet runway mirrors its lamps and the portal (uPortal).
// Round seven: the undershoot (z -322..-44, between the fence on the boulevard and the blast pad) is PAVED. The runway's
// stopway (|x| < 38, asphalt in slabs, yellow chevrons) runs back to the fence under the approach lights, with amber edge
// lights every 15 m; a strip of grass either side (|x| 38..50); beyond it an apron on each side: left (x 50..215) the
// taxiway carried back to the fence with two wide-bodies waiting on it, two more nose-in at a cargo shed (x 222..262),
// masts at x 148; right (x -150..-50, z < -100) two wide-bodies nose toward the runway, masts at x -140. Service roads
// (x 56..63.5 and x -134..-127) and the perimeter road carry traffic. The wet pavement mirrors every lamp, and the
// world's gate exactly: two rings of 54 and 111.6 m radius round the portal's 20 m disc, centred 21 m over the
// threshold in the plane z = 2.5 (FRAG_AIRFIELD, "the gate itself"): keep those numbers in step with the world's gate.
// Round eight: the checkerboard is a built thing: a concrete kerb with a lamp every ten metres round it, three berms across it, four 20 m floodlight masts before its
// foot whose fans of light stand in the wet air after dark (one small additive mesh), lamps down the paths from its lower corners; after dark it is floodlit by the
// kerb's lamps (round eleven: evenly, edge to edge, in a light whiter than the street's sodium, with a warm pool under each lamp: HOURS.boardL) and throws its orange on the ground round it. Two aircraft move, both the same small mesh (a wide-body built at the
// origin) with its lamps in a mesh of their own: one taxis up the taxiway behind the one that holds short (placed from the eye's z in update(), no clock), one climbs
// out over the avenue toward the approach and passes over our left wing where the approach rolls out of the bank (setLook({ u }): its place is a function of progress along the route, see placeFly). +5 draw calls.
// Round nine: the board is 100 m square in six squares a side (it reads from the far end of the approach). A landmark stands in the avenue: the BEACON TOWER, on the block
// x 12..72, z -496..-462 (round fourteen: the block generates no tenements; every block of the grid has streams of its own): a 14 m podium, a shaft 30 m square to 116 m, a tier 23 m
// square to 173.5 m that is a crown of tall lit windows between stone piers (round eleven: the hill's is the one checkerboard; five storeys of 11.5 m), a third tier to 206 m, a lit lantern to 220 m, a 24 m obstacle mast
// (red lamps to 246 m). It is washed amber from each setback after dark, a band of brighter light climbs it every twelve seconds, and two beams turn from the lantern
// (one additive mesh, +1 draw call; facade kind 10). Round it (within 470 m) the windows are no even speckle: buildings have their own share of lit rooms and their own
// lamp, whole floors are dark, a few are lit from end to end, one bay in eleven is a stair; a dozen large cold neon frames hang on the neighbouring towers.
// anchors.beaconTower = { position, height, lamp }. The approach passes its near face 29 m to the left at 48 m up (abeam at u 0.79).
//
// Round fourteen (a clean-up): nothing is generated and taken back, drawn and dropped, or burnt. Every block of the street grid draws from streams of its own (the
// seed and the block's place in the grid: walls, roof life, signs), so the three landmark blocks generate no tenements; a roof that is a yard, a garden or a works
// roof generates none of the ordinary roof life and draws from a stream of its own (the seed and the roof's corner); a sign's place is tested before anything is
// drawn for it; the hill's far bushes and the squatters' huts test their place before they draw their dress, each hut from a stream of its own. The huts are built
// things (two tin shades, a pitched overhanging roof, a door, a shutter, lean-tos and drums). anchors.fenceZ is the airfield's fence.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, dispose, setProgress, setLook, ground, groundY }
// opts:
//   palette  array of hex: [0] wet concrete, [1..4] faded plaster (mint, pink, cream, blue), [5] checker orange,
//            [6] checker white, [7] hill scrub, [8] roof red-brown, [9] tin / tank blue-grey
//   hour     'storm' (default: late afternoon between squalls) | 'golden' | 'dusk' | 'night' | 'dawn'
//            sets lit-window share, neon, the sun shafts and the reflected sky colour
//   wet      0..1 (default 0.8) puddles and sheen on roofs, streets and runway
//   neon     0..1 override: the rooftop and street neon frames lit (0 = bare unlit frames)
//   shaft    0..2 override: strength of the storm-light pools and beams (0 removes them)
//   sunDir   [x,y,z] direction TO the sun used by the pools and beams (default anchors.sunDir)
//   density  0.7..1.3 rooftop clutter and laundry (default ctx.vary.density)
// setProgress(u)  optional. The wash that rips laundry off the lines and puts the pigeons up follows the camera
//   passed to update() by default (stateless: it is a function of where the aircraft is along the approach, so
//   it always coincides with the pass). setProgress(u) instead places the aircraft at fraction u of
//   anchors.flyThrough; setProgress(null) returns to the camera.
// setLook({ lit, neon, wet, shaft, strobe, flash, portal })  uniform-only changes, safe every frame (flash 0..1: lightning lifting the sky fill; portal: a THREE.Color,
//   the light the portal lays on the wet threshold).
// anchors (local space):
//   portalSeat   { position [0, 21, 0], facing [0, 0, -1], radius 20 }: the 40 m portal stands on the threshold
//                between the green threshold bar ends, runway and harbour beyond it.
//   flyThrough   eleven points entry -> seat, at least 30 m above every roof and 60 m from the towers.
//   flyLine(n)   the same line sampled densely ([x, y, z] * n) for makePath.
//   viewpoints   scudBreak, hillAhead, turnApex, rollOut, avenueGate, shortFinal (camera positions), each with
//                `look`.
//   hill         { summit, board (centre of the checkerboard), boardNormal, base radius, heading (the hill's own axis), boardHalf, boardAlong }
//   turn         { centre, radius, from, to }     runway { start, threshold, end, width }
//   strobes      the lead-in line the running strobes follow     sunDir   suggested direction to the sun
//   harbour      water regions for ferries and junks: boxes { min, max } clear of land     waterY, extent
// SIZE: detailed roofs within 300 m of the approach, full tenements to 600 m, plain slabs beyond to the edge of
// the land (x -1700..1300, z -2910..-95); `radius` (620) and `center` are only the hint for the set-piece
// viewer (the city core); anchors.extent has the true bounds.
// COST: 145k to 165k triangles by seed (hard caps keep the solids under 147k; the traffic adds about 17k), 12 draw
// calls, no lights, no textures, about 250 ms of build with a yield every block column. The returned `stats` has the
// per-mesh triangle counts.
// TRAFFIC: painted in the ground shader everywhere (cbLane), except on the last avenue (x = 0, z -1090..-372) and the
// boulevard (z = -348, |x| < 420), the closest things the approach passes: there about 450 instanced saloons, light
// buses, double-deck buses and trams with volume run in the vertex shader, each with an additive pool of lamp light
// on the wet road (stats.vehicles).
// AFTER DARK (hour dusk | night): the storm-light pools and beams go out and pool 0 becomes the floodlighting of the
// checkerboard (six lamps along its foot), so the board keeps its orange at every hour. By day a cloud shadow
// (HOURS.shade) drifts over the carpet with the wind. HOURS.hz is the horizon colour that standing water, wet roofs,
// streets and the wet runway mirror at a grazing angle (the afterglow at dusk, peach at dawn); grass keeps the plain sky sheen.
// PER SEED: plaster mix of the district, how much washing is out, how thick the aerials, shacks and neon frames
// are, which blocks are towers or old low tong lau, scrub colour of the hill, parked aircraft and their fins.
// VIEWER AID (only when opts.debug, a { get(key) } object, is passed; no URL is read): heroView=tour makes the set-piece viewer visit five subjects
// (u 0.05 hill from the approach, 0.25 roofs under the turn, 0.45 walled city, 0.62 the final, 0.8 threshold),
// heroU=0..1 stages the wash, heroHour=golden|dusk|night|dawn picks the hour.
// LIGHT: wants a dim, cool storm key (directional about 0.8 to 1.4, from anchors.sunDir) and a grey hemisphere;
// the piece adds its own HDR sun pools (the checkerboard's shaft and two that drift) as emissive, plus lit
// windows, strobes and runway lights. Under a full clear sun, pass shaft: 0.3 or it will clip.
import * as THREE from 'three';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const WATER_Y = -4;
const TURN_C = [-800, -1100], TURN_R = 800, TURN_A0 = -47 * D2R;
const H0 = [Math.sin(47 * D2R), Math.cos(47 * D2R)];                 // heading before the turn (x, z)
const ARC_S = [TURN_C[0] + TURN_R * Math.cos(TURN_A0), TURN_C[1] + TURN_R * Math.sin(TURN_A0)];
// Round five: the long straight-in is cut to 480 m and the hill stands INSIDE the turn, 105 m from the line, so the bank is flown round it: the board faces the
// incoming aircraft, grows from the first second and passes close on the right as the turn begins. HH is the hill's own heading (the way the board looks, reversed).
const L_IN = 480, Y_IN = 158, Y_ARC = 124, Y_OUT = 84;
// (round sixteen) Two measures of the place that more than one thing reads. BANK: the world measures our bank from the route's headings BANK.half metres behind and ahead of
// the eye, and our wing is out of the frame where that measure is under BANK.off of a full bank. LOWQ: the low quarter at the hill's foot, in metres out from the hill's centre
// along the hill's own axis (nothing stands between the approach and the board there).
const BANK = { half: 30, off: 0.4 }, LOWQ = [90, 300];
const ENTRY = [ARC_S[0] - H0[0] * L_IN, ARC_S[1] - H0[1] * L_IN];
const BOARD_AT = [TURN_C[0] + 672 * Math.cos(-38.5 * D2R), TURN_C[1] + 672 * Math.sin(-38.5 * D2R)];      // the board's centre in plan
const HH = (() => { const ax = ENTRY[0] + H0[0] * 150, az = ENTRY[1] + H0[1] * 150, dx = BOARD_AT[0] - ax, dz = BOARD_AT[1] - az, l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
const HILL_C = [BOARD_AT[0] + HH[0] * 70, BOARD_AT[1] + HH[1] * 70];
const SEAT_Y = 21, SEAT_R = 20, GLIDE = (Y_OUT - SEAT_Y) / 1100;      // round seven: a 40 m portal standing on the threshold, its foot a metre over the bar
const inDrop = (t) => t * (1.75 - 0.75 * t);                          // the descent out of the scud: steep at first (the roofs come up fast), easing into the turn
const PLAY = [-8, -1319];
// The roofs under the approach: a roof whose middle lies within SKIM metres of the approach line's ground track (the first straight, the turn's arc, the final down the
// avenue as far as the airfield's fence) carries a string of bare bulbs, and the solids' shader lays their light on it after dark (cbRoute is the same measure in GLSL).
const FENCE_Z = -328, SKIM = 100;
function routeDist(x, z) {
  const ex = x - ENTRY[0], ez = z - ENTRY[1], s = Math.min(L_IN, Math.max(0, ex * H0[0] + ez * H0[1])), d1 = Math.hypot(ex - H0[0] * s, ez - H0[1] * s);
  const cx = x - TURN_C[0], cz = z - TURN_C[1], an = Math.min(0, Math.max(TURN_A0, Math.atan2(cz, cx))), d2 = Math.hypot(cx - Math.cos(an) * TURN_R, cz - Math.sin(an) * TURN_R);
  const d3 = Math.hypot(x, z - Math.min(FENCE_Z, Math.max(-1100, z)));
  return Math.min(d1, d2, d3);
}
// Round nine: the beacon tower, the subject of the middle of the flight. It stands on the block x 12..72, z -496..-462 beside the last avenue (the block
// generates no tenements of its own): 228 m to the lamp on its mast, uplit amber stone in tiers, the middle tier
// a crown of tall lit windows (round eleven: it was painted in the board's squares; there is one checkerboard only now), a lit lantern, and two beams that turn through the wet air.
const LM = [44, -479], LM_ROW = 2, LM_LAMP_Y = 213, LM_MAST = 40;                                           // the beacon tower's block, its row and the height of its lantern lamp
// street grid shared by the generator and the ground shader
const AVE = 12, PITCH_X = 76, BLOCK_X = 60, ROW0 = -366, PITCH_Z = 48, BLOCK_Z = 34;
const DEFAULT_PALETTE = ['#a9a498', '#8fae9c', '#c59a8c', '#cdbd8e', '#8ea6b8', '#e9500f', '#efe9da', '#40583a', '#7a4636', '#6f8794'];

// the approach line sampled densely: [x, y, z]
function flyLine(n = 64) {
  const pts = [], L1 = L_IN, L2 = TURN_R * -TURN_A0, L3 = 1100, L = L1 + L2 + L3;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * L;
    if (s < L1) { const t = s / L1; pts.push([ENTRY[0] + H0[0] * s, Y_IN - (Y_IN - Y_ARC) * inDrop(t), ENTRY[1] + H0[1] * s]); }
    else if (s < L1 + L2) { const t = (s - L1) / L2, a = TURN_A0 * (1 - t); pts.push([TURN_C[0] + TURN_R * Math.cos(a), Y_ARC - (Y_ARC - Y_OUT) * t, TURN_C[1] + TURN_R * Math.sin(a)]); }
    else { const z = -1100 + (s - L1 - L2); pts.push([0, SEAT_Y - GLIDE * z, z]); }
  }
  return pts;
}
const FLY = flyLine(72);
// nearest point of the approach line in plan: lateral distance d, altitude y, tangent (tx, tz), side (+ = left of travel)
function nearFly(x, z) {
  let bd = 1e18, by = 0, btx = 0, btz = 1, bs = 0, bside = 0;
  for (let i = 0; i < FLY.length - 1; i++) {
    const a = FLY[i], b = FLY[i + 1], ex = b[0] - a[0], ez = b[2] - a[2], l2 = ex * ex + ez * ez;
    let t = ((x - a[0]) * ex + (z - a[2]) * ez) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = a[0] + ex * t, pz = a[2] + ez * t, d = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (d < bd) { bd = d; by = a[1] + (b[1] - a[1]) * t; const l = Math.sqrt(l2); btx = ex / l; btz = ez / l; bs = i + t; bside = (x - px) * btz - (z - pz) * btx; }
  }
  return { d: Math.sqrt(bd), y: by, tx: btx, tz: btz, s: bs / (FLY.length - 1), side: bside };
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- the hill: height above street level at local (x, z) ----------
const BOARD = { a: 70, h: 55, slope: 0.97, half: 50 };               // round nine: 100 m square (was 84) in six squares by six (was eight): it reads from the scud               // centre along the approach axis, height, tan(tilt), half size
// The village round the board, in the hill's own (a, b): a column of houses up each side of the board on the bare ground between its apron and the hill's trees, a row
// along the crest above its head, a lamp-lit stepped lane before their doors (laneB: its distance from the board's axis; a0..a1: its run up the slope; headA: the lane
// along the crest, for |b| < headB), a lamp every `step` metres. The hill's ground shader and the solids' shader lay the lamps' light along the same lines.
const VILLAGE = { laneB: 69.5, houseB: 74.6, treeB: 66.6, a0: 17, a1: 106, headA: 17, headB: 72, headRowA: 11, step: 9.5 };
function hillAB(x, z) { const dx = x - HILL_C[0], dz = z - HILL_C[1]; return [-(dx * HH[0] + dz * HH[1]), dx * HH[1] - dz * HH[0]]; }
function hillXZ(a, b) { return [HILL_C[0] - a * HH[0] + b * HH[1], HILL_C[1] - a * HH[1] - b * HH[0]]; }
function makeHillFn(noise) {
  const ca = Math.cos(Math.atan(BOARD.slope)) * BOARD.half;           // half extent of the board along a
  return (x, z) => {
    const [a, b] = hillAB(x, z);
    if (a > 190 || a < -170 || Math.abs(b) > 240) return 0;
    const ea = a / 150, eb = b / 215;
    const r = Math.hypot(ea, eb);
    let h = 0;
    if (r < 1) {
      const t = 1 - r, s = t * t * (3 - 2 * t);
      h = 100 * s * (1 + 0.2 * noise.fbm2(x / 110, z / 110, 3) * (1 - s)) + 10 * noise.n2(x / 38, z / 38) * t * (1 - s);
      h *= 1 - sstep(-1368, -1334, z);            // the hill ends at the street in front of the walled city
    }
    const hp = BOARD.h - (a - BOARD.a) * BOARD.slope;
    const w = sstep(BOARD.a - ca - 14, BOARD.a - ca, a) * (1 - sstep(BOARD.a + ca, BOARD.a + ca + 14, a)) * sstep(-BOARD.half - 12, -BOARD.half, b) * (1 - sstep(BOARD.half, BOARD.half + 12, b));
    return Math.max(0, h + (hp - h) * w);
  };
}

// ---------- geometry builders (indexed quads into typed arrays) ----------
class Geo {
  constructor(maxQuads) {
    const n = maxQuads * 4; this.max = n;
    this.p = new Float32Array(n * 3); this.n = new Float32Array(n * 3); this.c = new Float32Array(n * 3);
    this.f = new Float32Array(n * 4); this.g = new Float32Array(n * 2); this.i = new Uint32Array(maxQuads * 6);
    this.nv = 0; this.ni = 0; this.vOff = 0;
  }
  get full() { return this.nv + 64 > this.max; }
  v(x, y, z, nx, ny, nz, c, f0, f1, f2, f3, g0, g1) {
    const k = this.nv, k3 = k * 3, k4 = k * 4, k2 = k * 2;
    this.p[k3] = x; this.p[k3 + 1] = y; this.p[k3 + 2] = z; this.n[k3] = nx; this.n[k3 + 1] = ny; this.n[k3 + 2] = nz;
    this.c[k3] = c.r; this.c[k3 + 1] = c.g; this.c[k3 + 2] = c.b;
    this.f[k4] = f0; this.f[k4 + 1] = f1; this.f[k4 + 2] = f2; this.f[k4 + 3] = f3; this.g[k2] = g0; this.g[k2 + 1] = g1;
    return this.nv++;
  }
  q(a) { const i = this.i, k = this.ni; i[k] = a; i[k + 1] = a + 1; i[k + 2] = a + 2; i[k + 3] = a; i[k + 4] = a + 2; i[k + 5] = a + 3; this.ni += 6; }
  t(a, b, c) { const i = this.i, k = this.ni; i[k] = a; i[k + 1] = b; i[k + 2] = c; this.ni += 3; }
  // vertical wall from (ax, az) to (bx, bz), outward normal to the right of a -> b seen from above... (n given)
  wall(ax, az, bx, bz, y0, y1a, y1b, nx, nz, c, seed, kind, u0, H) {
    if (this.full) return;
    const l = Math.hypot(bx - ax, bz - az);
    const o = this.vOff, a = this.v(ax, y0, az, nx, 0, nz, c, u0, o, seed, kind, l, H + o);
    this.v(bx, y0, bz, nx, 0, nz, c, u0 + l, o, seed, kind, l, H + o);
    this.v(bx, y1b, bz, nx, 0, nz, c, u0 + l, o + y1b - y0, seed, kind, l, H + o);
    this.v(ax, y1a, az, nx, 0, nz, c, u0, o + y1a - y0, seed, kind, l, H + o);
    this.q(a);
  }
  // axis-aligned box without a bottom; the top may pitch by dy toward +X. Wall kind wk, top kind tk.
  box(x0, x1, z0, z1, y0, y1, c, ct, seed, wk = 2, tk = 2, dy = 0) {
    if (this.full) return;
    const H = y1 - y0 + dy, u = seed * 97;
    this.wall(x0, z1, x1, z1, y0, y1, y1 + dy, 0, 1, c, seed, wk, u, H);
    this.wall(x1, z1, x1, z0, y0, y1 + dy, y1 + dy, 1, 0, c, seed, wk, u + 31, H);
    this.wall(x1, z0, x0, z0, y0, y1 + dy, y1, 0, -1, c, seed, wk, u + 57, H);
    this.wall(x0, z0, x0, z1, y0, y1, y1, -1, 0, c, seed, wk, u + 83, H);
    const hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, nl = Math.hypot(dy, x1 - x0), nx = -dy / nl, ny = (x1 - x0) / nl;
    const a = this.v(x0, y1, z1, nx, ny, 0, ct, -hx, hz, seed, tk, hx, hz);
    this.v(x1, y1 + dy, z1, nx, ny, 0, ct, hx, hz, seed, tk, hx, hz);
    this.v(x1, y1 + dy, z0, nx, ny, 0, ct, hx, -hz, seed, tk, hx, hz);
    this.v(x0, y1, z0, nx, ny, 0, ct, -hx, -hz, seed, tk, hx, hz);
    this.q(a);
  }
  // six-sided tank
  tank(cx, cz, r, y0, y1, c, ct, seed) {
    if (this.full) return;
    const a0 = seed * 5;
    for (let i = 0; i < 6; i++) {
      const a = a0 + (i / 6) * TAU, b = a0 + ((i + 1) / 6) * TAU, m = (a + b) / 2;
      this.wall(cx + Math.sin(a) * r, cz + Math.cos(a) * r, cx + Math.sin(b) * r, cz + Math.cos(b) * r, y0, y1, y1, Math.sin(m), Math.cos(m), c, seed, 2, i, y1 - y0);
    }
    const P = (i) => [cx + Math.sin(a0 + (i / 6) * TAU) * r, cz + Math.cos(a0 + (i / 6) * TAU) * r];
    for (let h = 0; h < 2; h++) {
      const o = h * 3, A = P(o), B = P(o + 1), C = P(o + 2), D = P(o + 3);
      const a = this.v(A[0], y1, A[1], 0, 1, 0, ct, 0, 0, seed, 2, 1, 1);
      this.v(B[0], y1, B[1], 0, 1, 0, ct, 0, 0, seed, 2, 1, 1); this.v(C[0], y1, C[1], 0, 1, 0, ct, 0, 0, seed, 2, 1, 1); this.v(D[0], y1, D[1], 0, 1, 0, ct, 0, 0, seed, 2, 1, 1);
      this.q(a);
    }
  }
  // free quad (a, b, c, d counter-clockwise from outside) of plain kind
  quad(A, B, C, D, c, kind = 2, seed = 0, c2 = c) {
    if (this.full) return;
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const a = this.v(A[0], A[1], A[2], nx, ny, nz, c, 0, 0, seed, kind, 1, 1);
    this.v(B[0], B[1], B[2], nx, ny, nz, c, 1, 0, seed, kind, 1, 1); this.v(C[0], C[1], C[2], nx, ny, nz, c2, 1, 1, seed, kind, 1, 1); this.v(D[0], D[1], D[2], nx, ny, nz, c2, 0, 1, seed, kind, 1, 1);
    this.q(a);
  }
  build() {
    const g = new THREE.BufferGeometry(), nv = this.nv;
    g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.n.slice(0, nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.c.slice(0, nv * 3), 3));
    g.setAttribute('aF', new THREE.BufferAttribute(this.f.slice(0, nv * 4), 4));
    g.setAttribute('aG', new THREE.BufferAttribute(this.g.slice(0, nv * 2), 2));
    g.setIndex(new THREE.BufferAttribute(this.i.slice(0, this.ni), 1));
    return g;
  }
}
// free-form attribute bag for the card, cloth, light and bird meshes: quads of 4 vertices
class Bag {
  constructor(maxQuads, spec) {
    this.max = maxQuads; this.nq = 0; this.spec = spec; this.a = {};
    for (const k in spec) this.a[k] = new Float32Array(maxQuads * 4 * spec[k]);
  }
  get full() { return this.nq >= this.max; }
  // vals: { name: [v0.., v1.., v2.., v3..] } flat per corner
  put(k, corner, ...v) { const s = this.spec[k], o = (this.nq * 4 + corner) * s, a = this.a[k]; for (let i = 0; i < s; i++) a[o + i] = v[i]; }
  all(k, ...v) { for (let c = 0; c < 4; c++) this.put(k, c, ...v); }
  next() { this.nq++; }
  build() {
    const g = new THREE.BufferGeometry(), nq = this.nq, idx = new Uint32Array(nq * 6);
    for (const k in this.spec) g.setAttribute(k, new THREE.BufferAttribute(this.a[k].slice(0, nq * 4 * this.spec[k]), this.spec[k]));
    for (let i = 0; i < nq; i++) { const a = i * 4, o = i * 6; idx[o] = a; idx[o + 1] = a + 1; idx[o + 2] = a + 2; idx[o + 3] = a; idx[o + 4] = a + 2; idx[o + 5] = a + 3; }
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
}

// ---------- shaders ----------
const GLSL_COMMON = /* glsl */`
uniform float uTime, uLit, uLitGain, uWet, uNeon, uHead, uDark, uPudR, uShade, uFarE, uNearE, uRoofK, uGrey, uBandPh;
uniform vec3 uSky, uHz, uPoolCol, uSunDir, uFill, uPortal;
uniform vec4 uPool[3];
uniform vec4 uHill;
varying vec3 vP; varying vec3 vN0;
float cbH11(float p){ p = fract(p*.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float cbH21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float cbVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(cbH21(i), cbH21(i + vec2(1., 0.)), f.x), mix(cbH21(i + vec2(0., 1.)), cbH21(i + vec2(1., 1.)), f.x), f.y); }
float cbBox(vec2 p, vec2 a, vec2 b, vec2 fw){ fw = max(fw, vec2(1e-4)); vec2 s = smoothstep(a - fw, a + fw, p)*(1. - smoothstep(b - fw, b + fw, p)); return s.x*s.y; }
float cbPool1(vec2 p, vec4 k){ vec2 d = (p - k.xy)/max(k.z, 1.); float q = dot(d, d); return k.w*exp(-q*q*1.3); }
float cbPool(vec2 p){ return cbPool1(p, uPool[0]) + cbPool1(p, uPool[1]) + cbPool1(p, uPool[2]); }
// cloud shadow drifting over the city with the wind: 1 in the open, down to 1 - uShade under the scud
// metres from the approach line's ground track: the first straight, the turn's arc, the final down the avenue as far as the airfield's fence (routeDist in the part)
uniform vec4 uWake, uLand;
// The landing lamps of the aircraft we ride in (uWake: where it is; uLand: its heading in plan, the tangent of its bank, 1). They are fixed to the airframe and aimed
// ahead and down; their pool lies where their axis meets whatever stands under it: further ahead and wider the higher the aircraft is over that surface, thrown to the
// outside of a banked turn, gone above eighty metres. One law for the whole flight, called by every surface it falls on, the airfield too (FRAG_AIRFIELD); it rides with the eye.
float cbLand(vec3 P) {
  float lh = clamp(uWake.y - P.y, 4., 200.), lsec = sqrt(1. + uLand.z*uLand.z);
  vec2 lq = P.xz - uWake.xz;
  float lal = dot(lq, uLand.xy) - (3.2*lh*lsec + 30.), lac = dot(lq, vec2(uLand.y, -uLand.x)) - lh*uLand.z;
  float lsz = 1.6*lh + 25., lsx = 0.9*lh + 13.;
  return exp(-lac*lac/(lsx*lsx) - lal*lal/(lsz*lsz))*(1. - smoothstep(34., 80., lh))*step(P.y, uWake.y - 4.)*uLand.w;
}
float cbRoute(vec2 p){
  vec2 e = p - vec2(${ENTRY[0].toFixed(2)}, ${ENTRY[1].toFixed(2)}), h = vec2(${H0[0].toFixed(5)}, ${H0[1].toFixed(5)});
  float d1 = length(e - h*clamp(dot(e, h), 0., ${L_IN.toFixed(1)}));
  vec2 c = p - vec2(${TURN_C[0].toFixed(1)}, ${TURN_C[1].toFixed(1)});
  float an = clamp(atan(c.y, c.x + (abs(c.x) + abs(c.y) < 1e-3 ? 1. : 0.)), ${TURN_A0.toFixed(5)}, 0.);
  float d2 = length(c - vec2(cos(an), sin(an))*${TURN_R.toFixed(1)});
  float d3 = length(p - vec2(0., clamp(p.y, -1100., ${FENCE_Z.toFixed(1)})));
  return min(d1, min(d2, d3));
}
float cbShade(vec2 p){ float n = cbVn(p*0.0031 - uTime*vec2(0.08, 0.104))*0.65 + cbVn(p*0.0083 - uTime*vec2(0.124, 0.088) + 4.7)*0.35; return 1. - uShade*smoothstep(0.42, 0.6, n); }          // round six: the squall's broken cloud runs before the wind at 25 m/s, and its shadows sweep the roofs
`;
const VERT_DECL = 'attribute vec4 aF; attribute vec2 aG; varying vec3 vP; varying vec3 vN0; varying vec4 vF; varying vec2 vG;';
const VERT_MAIN = 'vP = position; vN0 = normal; vF = aF; vG = aG;';

// tenements, roofs and every solid thing: kind 0 wall, 1 roof, 2 plain, 3 caged balcony stack, 4 foliage, 5 smooth paint
const FRAG_FACADE = /* glsl */`
vec3 cbAlb = diffuseColor.rgb; float cbRough = 0.86; vec3 cbEmi = vec3(0.);
float cbKind = vF.w, cbSeed = vF.z;
float cbFres = pow(1. - clamp(abs(dot(normalize(vViewPosition), normalize(vNormal))), 0., 1.), 4.);
vec2 cbPx = fwidth(vP.xz) + fwidth(vP.yy);
float cbPix = max(max(cbPx.x, cbPx.y), 1e-3);
// round thirteen: light is capped at its source by its distance from the eye: a lit wall within 70 m burns at two fifths of its far strength (a tower passed close
// washed a third of the frame white under bloom), full from 260 m
float cbNearK = mix(0.42, 1., smoothstep(70., 260., length(vViewPosition)));
// round nine: round the beacon tower the lit rooms thin out and gather into dark floors and lit bands, so that the eye rests on the tower
float cbZone = 1. - smoothstep(190., 470., length(vP.xz - vec2(${LM[0].toFixed(1)}, ${LM[1].toFixed(1)})));
if (cbKind < 0.5) {
  float bay = 2.9 + fract(cbSeed*7.31)*0.9;
  vec2 g = vec2(vF.x/bay, (vF.y - 4.6)/3.0);
  vec2 fw = vec2(cbPix/bay, cbPix/3.0);
  float lod = 1. - smoothstep(0.2, 0.55, max(fw.x, fw.y));
  vec2 id = floor(g), f = fract(g);
  float hc = cbH21(id + cbSeed*71.3), hcol = cbH11(id.x*3.7 + cbSeed*311.);
  float streak = cbVn(vec2(vF.x*1.1 + cbSeed*50., vF.y*0.22));
  float mott = cbVn(vF.xy*0.23 + cbSeed*9.);
  vec3 wall = cbAlb*(0.74 + 0.3*mott)*(1. - (0.06 + 0.14*(1. - smoothstep(0.25, 1.2, cbPix)))*smoothstep(0.5, 0.9, streak));
  wall *= 0.52 + 0.48*smoothstep(0., 34., vF.y);
  wall = mix(wall, wall*vec3(0.5, 0.58, 0.46), 0.5*smoothstep(vG.y - 6., vG.y, vF.y)*cbVn(vec2(vF.x*0.4, cbSeed*30.)));
  if (vF.y > 4.6) {
    float cage = step(hcol, 0.3)*step(0.45, fract(cbSeed*3.7));
    vec2 wa = mix(vec2(0.2, 0.36), vec2(0.06, 0.08), cage), wb = mix(vec2(0.8, 0.86), vec2(0.94, 0.9), cage);
    float win = cbBox(f, wa, wb, fw);
    // round nine: not an even speckle. Every building has its own share of lit rooms and its own lamp; some floors are dark from end to end, a few are lit from end
    // to end in one colour (the white tubes of a workshop, the red and gold of a restaurant), and one bay in eleven is the stair, lit all the way up.
    // Round eleven: the rooms are lit in GROUPS, not one by one (the even speckle read as noise from the avenue and from the scud alike). A building keeps its own share
    // of lit rooms (sB), but spends it by the floor and by the flat: about a quarter of its floors are dark from end to end but for a stray room, a tenth to a quarter are
    // lit from end to end, and on the floors between a flat of three to five bays (in half the buildings two storeys of it) is lit or dark as one. The mean is the same.
    float fh = cbH11(id.y*7.31 + cbSeed*517.3), fh2 = cbH11(id.y*3.17 + cbSeed*211.7);
    float sB = uLit*(0.3 + 1.4*fract(cbSeed*13.7))*(1. - 0.45*cbZone);
    float tallK = step(60., vG.y);          // round thirteen: on a tower (over 60 m) a flat is five to eight bays by two or three storeys, a third of the floors are dark and no stray room is dark in a lit flat: seen from the avenue its lights stand in blocks, not in a speckle
    float dF = 0.26 + 0.1*cbZone + 0.08*tallK, bF = min(0.07 + 0.18*sB + 0.04*tallK, 0.55*sB);
    float darkF = step(fh, dF), bandF = step(1. - bF, fh);
    float stair = step(mod(id.x + floor(cbSeed*89.), 11.), 0.5);
    float nrun = mix(3. + floor(3.*fract(cbSeed*57.3)), 5. + floor(4.*fract(cbSeed*57.3)), tallK), vrun = 1. + step(0.5, fract(cbSeed*23.9)) + 2.*tallK;
    vec2 apt = vec2(floor((id.x + floor(fract(cbSeed*7.7)*5.))/nrun), floor(id.y/vrun));
    float hrun = cbH21(apt*1.7 + cbSeed*71.3);
    float p0 = clamp((sB*1.12 - 0.03*dF - 0.97*bF)/max(1. - dF - bF, 0.2), 0.04, 0.92);
    float litB0 = sB;
    float pRun = mix(mix(p0, 0.97, bandF), 0.03, darkF);
    float lit = mix(step(hrun, pRun)*step((0.1 - 0.08*bandF)*(1. - tallK), hc), step(hc, uLit*1.7 + 0.06), stair);          // one room in ten of a lit flat is dark; the stair is lit all the way up
    float lodC = 1. - smoothstep(0.45, 1.1, max(fw.x, fw.y));
    // the lamps behind the glass: tungsten amber for most, cream, a few fluorescent mint and a few rose shades, the odd television blue
    float hq = cbH21(id*1.3 + cbSeed*17.);
    float bq9 = fract(cbSeed*29.3), own = bq9 < 0.5 ? 0.25 : bq9 < 0.78 ? 0.6 : bq9 < 0.92 ? 0.85 : 0.95;
    hq = mix(own, hq, step(0.86, cbH21(apt*1.9 + cbSeed*3.1))*(1. - bandF));          // six flats in seven burn the building's own lamp (round eleven: by the flat, not by the room; a lit floor is all one lamp)
    vec3 litc = hq < 0.5 ? vec3(1.0, 0.58, 0.24) : hq < 0.76 ? vec3(1.0, 0.8, 0.5) : hq < 0.9 ? vec3(0.56, 0.95, 0.78) : vec3(1.0, 0.5, 0.52);
    litc = mix(litc, vec3(0.74, 0.87, 1.0)*0.9, 0.85*step(0.76, fract(cbSeed*41.7)));          // round eleven: one building in four is lit by cold white tubes from top to bottom: warm blocks and cool blocks
    litc = mix(litc, vec3(0.35, 0.55, 1.0), step(0.95, cbH21(apt + 3.3)));
    litc = mix(litc, fh2 > 0.9 ? vec3(0.9, 0.36, 0.23) : vec3(0.6, 0.74, 0.8), step(0.62, fh2)*bandF*(1. - stair));
    litc *= 1. - 0.22*bandF*(1. - stair);
    litc = mix(litc, vec3(0.66, 0.9, 0.82)*0.45, stair);
    // after dark a fifth of the lit rooms have a television on: their light wavers, a little bluer, two to five times a second (their mean stays where it was)
    float tvn = cbVn(vec2(uTime*(2. + 3.*cbH21(id + 9.1)), hc*91. + cbSeed*13.));
    litc = mix(litc, mix(litc, vec3(0.5, 0.66, 1.0), 0.4)*(0.45 + 1.1*tvn), step(0.8, cbH21(id*2.7 + cbSeed*23.))*uDark);
    vec3 glass = mix(vec3(0.04, 0.05, 0.06), uSky, 0.1 + 0.7*cbFres);
    vec2 wq = (f - wa)/(wb - wa);
    vec2 m = abs(fract(wq*mix(vec2(3., 2.), vec2(7., 5.), cage)) - 0.5);
    float pane = 1. - smoothstep(0.36, 0.46, max(m.x, m.y));
    float blind = step(0.3 + 0.7*cbH21(id*2.1 + cbSeed), wq.y);
    // the room behind the glass: the ceiling lit, a curtain drawn part of the way across, things standing on the sill
    float hw2 = cbH21(id*3.7 + cbSeed*5.1);
    float cur = step(0.45, hw2)*step(abs(wq.x - step(0.72, hw2)), 0.18 + 0.3*fract(hw2*7.3));
    vec3 curt = vec3(0.86, 0.66, 0.5) + 0.3*cos(6.2832*(fract(hw2*3.1) + vec3(0., 0.33, 0.67)));          // lit from behind, a curtain glows in its own colour
    float sill = step(wq.y, 0.07 + 0.2*cbVn(vec2(wq.x*5. + id.x*3.3, id.y*1.7 + cbSeed*9.)));
    vec3 inner = litc*mix(1.0, 0.4, blind)*(0.76 + 0.48*wq.y)*mix(vec3(1.), curt, cur*lod)*(1. - 0.6*sill*lod)*uNearE;
    vec3 wcol = mix(wall*0.4, glass, pane);
    vec3 junk = mix(vec3(0.22), 0.3 + 0.3*cos(6.2832*(cbH21(floor(wq*vec2(3., 4.)) + id) + vec3(0., 0.33, 0.67))), 0.4);
    wcol = mix(wcol, junk, cage*pane*step(0.5, cbH21(floor(wq*vec2(3., 4.)) + id*1.7))*0.75);
    float ac = (1. - cage)*step(0.42, cbH21(id + 7.7 + cbSeed))*cbBox(f, vec2(0.5, 0.1), vec2(0.8, 0.3), fw);
    float drip = (1. - cage)*step(0.42, cbH21(vec2(id.x, id.y + 1.) + 7.7 + cbSeed))*cbBox(f, vec2(0.58, -0.1), vec2(0.72, 1.1), fw)*f.y;
    vec3 det = wall*(1. + 0.18*(1. - smoothstep(0.02, 0.07, f.y)));
    det *= 1. - 0.3*drip;
    det *= 1. - 0.3*cbBox(f, vec2(wa.x, wa.y - 0.14), vec2(wb.x, wa.y), fw);
    det = mix(det, wcol, win);
    det = mix(det, vec3(0.5, 0.52, 0.5)*(0.5 + 1.6*f.y), ac);
    vec3 avg = mix(wall*0.97, glass*0.8 + wall*0.2, 0.3);
    // round thirteen: too far for a window, a wall is not one flat tone even so: ribbons of glazing a floor and a half deep while they are two pixels, and panels five
    // bays by three floors, each its own shade, until those too are under a pixel (the towers behind the airfield read as buildings, not as beige boxes)
    float farP = cbH21(floor(vec2(g.x/5., g.y/3.)) + cbSeed*31.);
    avg *= 1. - 0.2*step(0.5, fract(g.y/3.))*(1. - smoothstep(0.75, 1.5, fw.y));
    avg *= mix(1., 0.84 + 0.32*farP, 1. - smoothstep(1.3, 2.8, fw.y));
    cbAlb = mix(avg, det, lod);
    float fwm = max(fw.x, fw.y);
    // round fourteen: on a tower, while a bay is under about six pixels wide, a lit flat is one ribbon of light the height of its windows (bay after bay with no pier
    // between, no cage bars or mullions): from the roll-out the nearest towers carry bands of lit floors, not a lattice of dots
    float bigP = tallK*(1. - smoothstep(4., 8., 1./max(fw.x, 1e-3)));
    float winE = mix(win, cbBox(f, vec2(-0.2, wa.y), vec2(1.2, wb.y), fw), bigP), paneE = mix(mix(0.3, pane, lod), 0.5, bigP);
    float lodF = 1. - smoothstep(0.6, 1.7, fwm);
    float wmask = mix(1., winE, 1. - smoothstep(0.6, 1.4, fwm));
    vec3 avgE = vec3(1.0, 0.72, 0.42)*litB0*(0.95 - 0.3*cbZone)*uFarE*(0.5 + cbVn(vec2(g.x*0.31, g.y*0.57) + cbSeed*40.));          // too far for a floor to be a row of pixels: the building's mean
    avgE *= mix(1., 0.38 + 1.2*step(0.42, cbH21(floor(vec2(g.x/4., g.y/2.)) + cbSeed*17.)), 1. - smoothstep(1.6, 3.2, fw.y));          // round thirteen: and after dark its glow is spent by the flat: lit blocks and dark ones, not one even wash
    vec3 farE = mix(avgE, litc*lit*mix(0.62, 1., max(bandF, stair))*wmask*0.4, lodF);
    cbEmi += uLitGain*mix(farE, inner*lit*winE*paneE, lodC)*cbNearK;
    cbRough = mix(0.86, 0.2, win*pane*lod*(1. - cage));
  } else {
    float sw = bay*1.5;
    vec2 sf = vec2(fract(vF.x/sw), vF.y/4.6); float sid = floor(vF.x/sw);
    float open = cbBox(sf, vec2(0.06, -0.1), vec2(0.94, 0.68), vec2(cbPix/sw, cbPix/4.6));
    float sh = cbH11(sid*5.3 + cbSeed*201.);
    vec3 awn = 0.4 + 0.3*cos(6.2832*(sh + vec3(0., 0.35, 0.6)));
    awn *= 0.75 + 0.25*step(0.5, fract(vF.x*1.6));
    cbAlb = mix(mix(wall*0.8, awn, step(0.68, sf.y)*step(sf.y, 0.9)), vec3(0.05), open);
    cbEmi += open*mix(vec3(1.0, 0.7, 0.38), vec3(0.75, 1.0, 0.9), step(0.5, sh))*(0.25 + 0.75*step(sh, 0.35 + uLit))*uLitGain*0.5*(0.4 + 0.6*sf.y);
  }
} else if (cbKind < 1.5) {
  vec2 q = vF.xy; float e = min(vG.x - abs(q.x), vG.y - abs(q.y));
  float par = 1. - smoothstep(0.3, 0.3 + cbPix + 0.05, e);
  float sh = smoothstep(0.4, 1.8, e);
  vec3 r = cbAlb*(0.72 + 0.34*cbVn(q*0.35 + cbSeed*40.));
  r = mix(r, vec3(dot(r, vec3(0.3, 0.6, 0.1))), 0.5*uGrey);          // under the squall the painted roofs go toward wet grey
  vec2 pc = floor(q/(2.6 + 3.*fract(cbSeed*5.)) + cbSeed*9.);
  r *= 0.82 + 0.34*cbH21(pc + cbSeed*3.);
  r = mix(r, r*vec3(0.5, 0.64, 0.42), 0.55*smoothstep(0.6, 0.8, cbVn(q*0.13 + cbSeed*7.)));
  float rl = 1. - smoothstep(0.3, 1.2, cbPix);
  r *= 1. + (cbH21(floor(q/0.5 + cbSeed*3.)) - 0.5)*0.22*(1. - smoothstep(0.07, 0.3, cbPix));          // paving slabs, half a metre each, once the wheels are low enough to see them
  r *= 1. - 0.1*rl*step(0.5, fract((fract(cbSeed*3.) < 0.5 ? q.x : q.y)/1.2));
  vec2 vc = floor(q/2.4 + cbSeed*5.), vf = fract(q/2.4 + cbSeed*5.);
  r = mix(r, vec3(0.05), rl*step(0.9, cbH21(vc + cbSeed*13.))*cbBox(vf, vec2(0.35), vec2(0.62), vec2(cbPix/2.4)));
  r *= 1. - 0.45*rl*(1. - smoothstep(0.06, 0.12, abs(fract((q.x + q.y*0.3)/7.3 + cbSeed) - 0.5)*7.3))*step(0.4, fract(cbSeed*17.));
  float pd = smoothstep(0.78 - 0.16*uWet, 0.85 - 0.16*uWet, cbVn(q*0.5 + cbSeed*77.))*sh;
  r = mix(r, r*0.55, pd);
  cbRough = mix(0.82 - 0.36*uWet, uPudR, pd);
  cbEmi += (uSky*0.06 + uHz*0.9*cbFres)*pd*0.6 + uSky*cbFres*0.5*uWet;
  r *= 1. - 0.35*(1. - smoothstep(0.45, 0.95, e))*step(0.45, e);
  // what lies about on a roof: a tarpaulin weighted down at its corners, a pipe run from the tank room to the parapet
  // (the tarpaulin's place is also where things are laid out to dry on mats, or where somebody keeps a row of planters)
  float tv = fract(cbSeed*61.);
  vec2 tc = (vec2(cbH11(cbSeed*91.7), cbH11(cbSeed*57.3)) - 0.5)*vG*1.1;
  vec2 th = vec2(1.6 + 1.8*fract(cbSeed*29.), 1.2 + 1.2*fract(cbSeed*43.))*(tv < 0.4 ? 1. : 1.5);
  vec2 tl = q - tc;
  float tarp = cbBox(tl, -th, th, vec2(cbPix))*step(0.4, fract(cbSeed*19.))*step(th.x + 1.5, vG.x)*step(th.y + 1.5, vG.y);
  vec3 tcol;
  if (tv < 0.4) {
    tcol = tv < 0.2 ? vec3(0.07, 0.2, 0.5) : tv < 0.32 ? vec3(0.42, 0.44, 0.4) : vec3(0.45, 0.3, 0.08);
    tcol *= 0.8 + 0.25*sin(tl.x*5. + sin(tl.y*3.)*1.5)*rl;
  } else if (tv < 0.72) {
    vec2 cid = floor(tl/0.9), cf = fract(tl/0.9);
    float sq = cbBox(cf, vec2(0.12), vec2(0.88), vec2(cbPix/0.9))*step(0.25, cbH21(cid*1.7 + cbSeed));
    vec3 dc = 0.36 + 0.3*cos(6.2832*(cbH21(cid + cbSeed*7.)*0.3 + 0.03 + vec3(0., 0.18, 0.42)));
    tcol = mix(r*0.9, dc, sq);
  } else {
    float row = fract(tl.y/1.1);
    tcol = mix(vec3(0.16, 0.12, 0.09), vec3(0.06, 0.14, 0.05)*(0.7 + 0.6*cbVn(tl*3.)), smoothstep(0.25, 0.32, row)*(1. - smoothstep(0.78, 0.85, row)));
  }
  tcol = mix(tcol, vec3(dot(tcol, vec3(0.3, 0.6, 0.1))), 0.6*uGrey);          // under the squall the tarpaulins and mats lose their colour: the board's orange is the one saturated thing
  r = mix(r, tcol, tarp*0.9);
  // the parapet on the sun's side lays its shadow across the roof (by day)
  vec2 sxz = uSunDir.xz; float shl = clamp(1.1*length(sxz)/max(uSunDir.y, 0.15), 0., 5.)/max(length(sxz), 1e-3);
  float wxs = shl*abs(sxz.x) + 0.02, wzs = shl*abs(sxz.y) + 0.02;
  float dxs = vG.x - q.x*(sxz.x < 0. ? -1. : 1.), dzs = vG.y - q.y*(sxz.y < 0. ? -1. : 1.);
  float psh = max(1. - smoothstep(wxs*0.7, wxs, dxs - 0.3), 1. - smoothstep(wzs*0.7, wzs, dzs - 0.3));
  r *= 1. - 0.34*psh*(1. - uDark)*(1. - par);
  float py = (fract(cbSeed*23.) - 0.5)*vG.y*1.3;
  float pipe = (1. - smoothstep(0.09, 0.09 + cbPix, abs(q.y - py)))*step(0.4, fract(cbSeed*37.))*(1. - smoothstep(0.25, 0.8, cbPix))*(1. - tarp);
  r = mix(r, vec3(0.3, 0.17, 0.1), pipe*0.85);
  r *= 1. - 0.3*rl*(1. - tarp)*(1. - smoothstep(0.0, 0.3, abs(q.y - py - 0.22)));
  r *= uRoofK;
  // the roofs under the approach line after dark: a string of bare bulbs runs down the middle of each (the part hangs the bulbs: roofStrings), a pool of warm light
  // lies under every bulb and a softer wash between them, and the standing water mirrors the colours of the street's neon
  { float dk = uDark*step(vP.y, 58.)*(1. - smoothstep(${(SKIM - 3).toFixed(1)}, ${(SKIM + 3).toFixed(1)}, cbRoute(vP.xz - q)))*step(11., vP.y)*step(4.4, min(vG.x, vG.y));
    if (dk > 0.001) {
      float lx = vG.x >= vG.y ? q.x : q.y, sx = vG.x >= vG.y ? q.y : q.x, hl = max(vG.x, vG.y), hs = min(vG.x, vG.y);
      float nb = max(2., floor(hl/3.5 + 0.5)), sp = 2.*hl/nb, da = (fract((lx + hl)/sp) - 0.5)*sp;
      float pool = exp(-(da*da + sx*sx)/16.), wash = exp(-sx*sx/(0.5*hs*hs + 4.));
      // (a deck is lit in its own colour, a little deeper than by day, and held well under white: a soft knee from 0.26, never over 0.45, whatever its skin)
      vec3 dl = (mix(vec3(dot(r, vec3(0.3, 0.6, 0.1))), r, 1.45) + 0.02)*vec3(1.0, 0.8, 0.56)*(3.2*pool + 0.9*wash)*(0.75 + 0.5*fract(cbSeed*9.7));
      float dm = max(max(dl.r, dl.g), max(dl.b, 1e-4)), dn = dm > 0.26 ? 0.26 + 0.19*(1. - exp(-(dm - 0.26)/0.19)) : dm;
      cbEmi += max(dl, vec3(0.))*(dn/dm)*dk*(1. - par);
      cbEmi += (0.5 + 0.5*cos(6.2832*(fract(cbSeed*7.9) + vec3(0., 0.33, 0.67))))*pd*0.09*dk*uNeon;
    } }
  cbAlb = mix(r*(0.68 + 0.32*sh), diffuseColor.rgb*0.9 + 0.1, par);
} else if (cbKind < 2.5) {
  cbAlb = mix(cbAlb, vec3(dot(cbAlb, vec3(0.3, 0.6, 0.1))), 0.72*uGrey);
  float n = cbVn(vP.xz*0.9 + vP.y*1.7);
  cbAlb *= 0.72 + 0.4*n; cbAlb = mix(cbAlb, vec3(0.3, 0.16, 0.09), 0.35*smoothstep(0.62, 0.9, cbVn(vP.xz*0.4 + cbSeed*60.)));
  float up2 = step(0.5, abs(vN0.y));
  float rib = sin((up2 > 0.5 ? vP.z : vP.x + vP.z)*17.)*(1. - smoothstep(0.06, 0.22, cbPix));
  cbAlb *= 1. + 0.16*rib;
  cbAlb *= mix(0.62 + 0.38*smoothstep(0., 1.1, vF.y), 1., up2);        // walls darken toward their foot: every shack and tank stands on its roof
  cbRough = 0.55;
} else if (cbKind < 3.5) {
  vec2 g = vec2(vF.x/0.7, vF.y/3.0); vec2 f = fract(g); vec2 id = floor(g);
  float lod = 1. - smoothstep(0.25, 0.7, cbPix/0.7);
  float bars = max(1. - smoothstep(0.08, 0.16, abs(f.x - 0.5)), 1. - smoothstep(0.03, 0.08, min(f.y, abs(f.y - 0.5))));
  float fl = floor(g.y);
  vec3 inside = 0.1 + 0.1*cos(6.2832*(cbH21(vec2(id.x*0.5, fl) + cbSeed*31.) + vec3(0., 0.33, 0.67)))*step(0.4, cbH21(id + cbSeed));
  // lit flat by flat (two bays wide), dimmer by day and once the bars drop below a pixel; the floor slabs stay readable long after the bars have gone
  float lit = step(cbH21(vec2(floor(id.x*0.25), fl) + cbSeed*91.), uLit*1.2);
  float flod = 1. - smoothstep(0.35, 1.0, cbPix/3.0);
  float slab = (1. - smoothstep(0.04, 0.12, min(f.y, 1. - f.y)))*flod;
  float fk = cbH21(vec2(floor(id.x*0.25), fl)*1.7 + cbSeed*17.);
  vec3 cagec = fk < 0.5 ? vec3(1.0, 0.6, 0.27) : fk < 0.76 ? vec3(1.0, 0.78, 0.48) : fk < 0.9 ? vec3(0.56, 0.95, 0.78) : vec3(1.0, 0.5, 0.52);
  cagec *= (0.55 + 0.45*fract(fk*7.3))*mix(1., 0.6 + 0.7*f.y, flod);
  // far away the cage is what it averages to close up (two fifths bars, the rest the dark of the balcony), flat by flat a little different: a shadowed column, not a strip of bare plaster
  vec3 cfar = mix(vec3(0.07), cbAlb, 0.3)*(1. - 0.45*slab)*(0.7 + 0.6*cbH21(vec2(floor(id.x*0.25), fl)*1.3 + cbSeed*47.));
  cbAlb = mix(cfar, mix(max(inside, vec3(0.03)), cbAlb*0.75, bars), lod);
  cbEmi += (lit + 0.07*uDark*(1. - lit))*(1. - bars*lod)*(1. - 0.85*slab)*cagec*uLitGain*mix(0.45, 0.58, uDark)*mix(mix(0.3, 1., lod), 1., uDark)*(0.45 + 0.55*uDark)*(1. - 0.4*cbZone)*cbNearK;          // by day a far stack is a shadowed column; after dark the lit balconies carry as far as the windows do, and their bloom is half the glow of the city
} else if (cbKind < 4.5) {
  cbAlb *= 0.7 + 0.7*cbVn(vP.xz*0.7 + vP.y*0.9); cbRough = 0.9; cbEmi += cbAlb*(uSky*0.3 + vec3(0.42, 0.34, 0.26)*uDark);          // after dark foliage takes the glow of the streets: a dark green mass, not a black one
} else if (cbKind < 5.5) {
  cbAlb *= 0.9 + 0.15*cbVn(vP.xz*0.5); cbRough = 0.32;
  cbAlb = mix(cbAlb, vec3(dot(cbAlb, vec3(0.3, 0.6, 0.1))), 0.65*uGrey);          // round nine: under the squall the fins and trim go toward grey too: the board's orange is the one saturated colour
  cbEmi += uSky*cbFres*0.25 + cbAlb*vec3(1.0, 0.8, 0.56)*(0.05 + 0.45*uDark)*step(-325., vP.z);          // on the airfield: under the apron floodlights
} else if (cbKind < 6.5) {
  // obstacle paint: the vertex colour in bands with white (round eleven: bands, not checks: there is one checkerboard only, the hill's)
  float ck = mod(floor(vF.y/0.75 + 0.001), 2.);
  float ckl = 1. - smoothstep(0.35, 1.1, cbPix/0.75);
  cbAlb = mix(mix(cbAlb, vec3(0.78, 0.76, 0.7), 0.5), mix(cbAlb, vec3(0.78, 0.76, 0.7), ck), ckl)*(0.8 + 0.25*cbVn(vP.xz*0.9 + vP.y));
  cbRough = 0.5; cbEmi += cbAlb*vec3(1.0, 0.85, 0.65)*0.4*uDark;          // obstacle paint is floodlit after dark
} else if (cbKind < 7.5) {
  // a market tarpaulin: a quarter of them the red, white and blue striped canvas in broad bands, the rest one faded colour; each sags between its poles
  float st = fract(vF.x/2.6 + cbSeed*7.), tk = fract(cbSeed*3.7);
  vec3 rwb = st < 0.34 ? vec3(0.4, 0.09, 0.08) : st < 0.5 ? vec3(0.55, 0.54, 0.5) : st < 0.84 ? vec3(0.09, 0.15, 0.36) : vec3(0.55, 0.54, 0.5);
  float stl = 1. - smoothstep(0.3, 1.0, cbPix/2.6);
  vec3 plain = tk < 0.3 ? vec3(0.1, 0.24, 0.2) : tk < 0.5 ? vec3(0.3, 0.26, 0.17) : tk < 0.64 ? vec3(0.12, 0.18, 0.32) : vec3(0.34, 0.33, 0.3);
  cbAlb = mix(mix(cbAlb, plain, 0.7), mix(vec3(0.36, 0.25, 0.3), rwb, stl), step(0.76, tk));
  vec2 tq = vF.xy/max(vG, vec2(0.5));
  cbAlb *= (0.74 + 0.26*cbVn(vP.xz*1.3))*(0.8 + 0.16*dot(tq, tq))*(1. + 0.1*sin(vF.y*9.)*(1. - smoothstep(0.05, 0.2, cbPix)));
  cbRough = 0.45;
} else if (cbKind < 8.5) {
  // a park on a block the hill took (cbSeed in thirds): a football pitch, hard courts, or a garden with paths and a pond; some are floodlit after dark
  vec2 q = vF.xy, hh = vG; float ty = cbSeed*3., sub = fract(cbSeed*37.);
  float e = min(hh.x - abs(q.x), hh.y - abs(q.y));
  float lw = max(0.16, 0.7*cbPix), lf = 1. - smoothstep(1.2, 3., cbPix);
  float n = cbVn(vP.xz*0.19), nfi = cbVn(vP.xz*2.3)*(1. - smoothstep(0.1, 0.6, cbPix));
  vec3 turf = vec3(0.075, 0.132, 0.06)*(0.78 + 0.4*n)*(0.9 + 0.3*nfi);
  vec3 c = turf; float lines = 0., glowK = 0.;
  if (ty < 1.) {
    vec2 ph = hh - vec2(5., 4.5);
    float inp = cbBox(q, -ph, ph, vec2(cbPix));
    c = turf*(0.86 + 0.26*step(0.5, fract(q.x/5.5)))*mix(0.8, 1.15, inp);
    float dr = max(abs(q.x) - ph.x, abs(q.y) - ph.y);
    lines = 1. - smoothstep(lw, lw + cbPix, abs(dr));
    lines = max(lines, (1. - smoothstep(lw, lw + cbPix, abs(q.x)))*step(dr, 0.));
    lines = max(lines, 1. - smoothstep(lw, lw + cbPix, abs(length(q) - 5.)));
    float db = max(abs(abs(q.x) - (ph.x - 4.5)) - 4.5, abs(q.y) - min(9., ph.y - 2.));
    lines = max(lines, (1. - smoothstep(lw, lw + cbPix, abs(db)))*step(dr, 0.));
    c = mix(c, vec3(0.3, 0.2, 0.12), 0.5*smoothstep(0.55, 0.8, cbVn(vP.xz*0.33 + 3.))*inp*exp(-abs(q.y)*0.2));
    glowK = step(0.5, sub)*inp;
  } else if (ty < 2.) {
    float cw = hh.x*2./3.; float cx = (fract((q.x + hh.x)/cw) - 0.5)*cw;
    vec2 ch = vec2(min(cw*0.5 - 3., 6.5), min(hh.y - 4., 12.5)); vec2 cq = vec2(cx, q.y);
    float dr = max(abs(cq.x) - ch.x, abs(cq.y) - ch.y);
    float inc = 1. - smoothstep(0., cbPix, dr);
    vec3 surf = fract(sub*2.) < 0.5 ? vec3(0.36, 0.13, 0.08) : vec3(0.08, 0.2, 0.3);
    c = mix(vec3(0.07, 0.2, 0.12)*(0.8 + 0.3*n), surf*(0.8 + 0.3*n), inc);
    lines = 1. - smoothstep(lw, lw + cbPix, abs(dr));
    lines = max(lines, (1. - smoothstep(lw, lw + cbPix, abs(cq.y)))*step(abs(cq.x), ch.x + 0.9));
    lines = max(lines, (1. - smoothstep(lw, lw + cbPix, abs(abs(cq.y) - ch.y*0.52)))*inc);
    lines = max(lines, (1. - smoothstep(lw, lw + cbPix, abs(cq.x)))*step(abs(cq.y), ch.y*0.52));
    glowK = step(0.5, sub)*step(dr, 2.);
  } else {
    // three gardens: crossed paths round a pond, an oval walk with the pond to one side, planted beds between paved walks
    float k = hh.y/max(hh.x, 1.), gv = fract(sub*3.), rr = length(q), pathm = 0.;
    vec3 lawn = turf*(0.9 + 0.3*smoothstep(0.4, 0.7, cbVn(vP.xz*0.07 + 9.)));
    if (gv < 0.34) {
      float pd2 = min(abs(q.x*k - q.y), abs(q.x*k + q.y))*0.8;
      pathm = max(1. - smoothstep(1.1, 1.1 + cbPix, pd2), 1. - smoothstep(0.9, 0.9 + cbPix, abs(rr - 8.)));
    } else if (gv < 0.67) {
      vec2 oh = max(hh - vec2(8., 7.), vec2(4.)); float ov = length(q/oh);
      pathm = max(1. - smoothstep(1.0, 1.0 + cbPix, abs(ov - 1.)*min(oh.x, oh.y)), (1. - smoothstep(0.8, 0.8 + cbPix, abs(q.x)))*step(ov, 1.));
      rr = length(q - vec2(oh.x*0.5, 0.));
    } else {
      vec2 cs = vec2(9.5, 7.6); vec2 bq2 = abs(fract(q/cs + 0.5) - 0.5)*cs; vec2 bid = floor(q/cs + 0.5);
      float bed = (1. - smoothstep(0., cbPix + 0.05, max(bq2.x - 3.6, bq2.y - 2.7)))*step(3.2, e);
      vec3 flw = mix(vec3(0.3, 0.2, 0.16), 0.3 + 0.24*cos(6.2832*(cbH21(bid + cbSeed*9.) + vec3(0., 0.33, 0.67))), 0.6);
      lawn = mix(lawn, mix(lawn*0.75, flw, smoothstep(0.55, 0.8, cbVn(vP.xz*1.9))*0.7), bed);
      pathm = 1. - bed; rr = 99.;
    }
    c = mix(lawn, vec3(0.3, 0.27, 0.22)*(0.8 + 0.3*n), pathm);
    float pond = 1. - smoothstep(4.2, 4.2 + cbPix, rr);
    c = mix(c, vec3(0.03, 0.045, 0.05), pond);
    cbRough = mix(0.9, 0.08, pond); cbEmi += pond*(uSky*0.05 + uHz*0.7*cbFres);
    c = mix(c, vec3(0.34, 0.33, 0.3), 1. - smoothstep(0.35, 0.35 + cbPix, abs(rr - 4.6)));
  }
  c = mix(c, vec3(0.62, 0.62, 0.58), lines*lf*0.85);
  float hedge = smoothstep(0.9, 1.2, e)*(1. - smoothstep(2.0, 2.4, e));
  c = mix(c, vec3(0.035, 0.08, 0.035)*(0.7 + 0.6*cbVn(vP.xz*1.1)), hedge);
  c = mix(vec3(0.3, 0.29, 0.27)*(0.8 + 0.25*cbH21(floor(vP.xz/1.2))), c, smoothstep(0.75, 0.9, e));
  cbAlb = c;
  cbEmi += c*vec3(0.95, 1.0, 0.86)*uDark*glowK*1.5*(1. - hedge)*(1. - 0.5*step(8., vP.y));          // round thirteen: a yard on a roof is lit by four small lamps, not by a stadium's: half
} else if (cbKind > 10.5) {
  // a small house's wall (kind 11): painted plaster, a window to every bay of every storey, most of them lit after dark (a few by day), a dark base course.
  // vF.x runs along the wall, vF.y up from its floor, vG = (the wall's length, its height)
  float nbh = max(floor(vG.x/1.9 + 0.5), 1.), bwh = max(vG.x, 0.1)/nbh, nsh = max(floor(vG.y/2.6 + 0.5), 1.), shh = max(vG.y, 0.5)/nsh;
  vec2 wq = vec2(fract(vF.x/bwh), fract(vF.y/shh)), wid = vec2(floor(vF.x/bwh), floor(vF.y/shh));
  float lodH = 1. - smoothstep(0.3, 1.0, cbPix/bwh);
  float win = cbBox(wq, vec2(0.24, 0.34), vec2(0.76, 0.8), vec2(cbPix/bwh, cbPix/shh));
  float hw = cbH21(wid + cbSeed*31.);
  float litW = mix(0.55, step(hw, 0.12 + 0.6*uDark + uLit), lodH);
  float bars = smoothstep(0.03, 0.07, abs(wq.x - 0.5))*smoothstep(0.02, 0.05, abs(wq.y - 0.57));
  vec3 wallC = diffuseColor.rgb*(0.8 + 0.3*cbVn(vec2(vF.x*0.9 + cbSeed*17., vF.y*0.6)))*(0.75 + 0.25*smoothstep(0., 0.5, vF.y));
  // the roof's overhang lays a band of shadow along the wall's head; one bay of the ground storey is a door, darker than the wall, in a frame, a worn step under it
  wallC *= 1. - 0.5*smoothstep(vG.y - 0.75, vG.y - 0.2, vF.y);
  float dbay = floor(fract(cbSeed*13.7)*nbh), isD = (1. - step(0.5, wid.y))*(1. - step(0.5, abs(wid.x - dbay)));
  float door = isD*cbBox(wq, vec2(0.2, -0.2), vec2(0.8, 0.84), vec2(cbPix/bwh, cbPix/shh));
  float dfrm = door*(1. - cbBox(wq, vec2(0.27, -0.2), vec2(0.73, 0.79), vec2(cbPix/bwh, cbPix/shh)));
  win *= 1. - isD;
  cbAlb = mix(wallC, vec3(0.04, 0.045, 0.05), win*lodH);
  cbAlb = mix(cbAlb, mix(vec3(0.085, 0.06, 0.045) + 0.07*(0.5 + 0.5*cos(6.2832*(fract(cbSeed*5.3) + vec3(0., 0.3, 0.6)))), wallC*0.45, dfrm), door*mix(0.6, 1., lodH));
  vec3 lampH = mix(vec3(1.0, 0.6, 0.27), vec3(1.0, 0.8, 0.52), fract(hw*7.3));
  cbEmi += lampH*litW*mix(0.22, win*(0.4 + 0.6*bars), lodH)*(0.12 + 1.5*uDark)*uLitGain*0.34*(1. - isD*(1. - lodH));
  cbRough = 0.85;
} else if (cbKind > 9.5) {
  // round nine: the beacon tower (kind 10). vF.x runs along the face from its corner, vF.y is the height, vG = (the face's length, the height of the tier's foot),
  // the seed says which tier: 0.1 uplit stone with piers and slot windows, 0.5 the crown of tall lit windows (it was painted in the board's squares until round eleven), 0.9 the lantern.
  float tx = vF.x, ty = vF.y, tl = max(vG.x, 1.), hgt = max(vF.y - vG.y, 0.);
  float nb = max(floor(tl/3.4 + 0.5), 1.), bw = tl/nb, bx = fract(tx/bw), by = fract(hgt/3.8);
  float lodT = 1. - smoothstep(0.22, 0.8, cbPix/bw);
  vec3 stone = vec3(0.6, 0.41, 0.22)*(0.76 + 0.3*cbVn(vec2(tx*0.33 + cbSeed*40., ty*0.06)))*(0.9 + 0.2*cbVn(vec2(tx*1.9, ty*1.4))*lodT);
  stone *= 1. - 0.3*smoothstep(0.55, 0.85, cbVn(vec2(tx*0.9 + 3., ty*0.045)))*(0.5 + 0.5*lodT);          // rain has run down it
  float pier = smoothstep(0.26, 0.33, abs(bx - 0.5));
  float slot = cbBox(vec2(bx, by), vec2(0.3, 0.16), vec2(0.7, 0.88), vec2(cbPix/bw, cbPix/3.8));
  float sfl = floor(hgt/3.8), sgrp = cbH11(floor(sfl/4.)*3.3 + 1.7);          // round eleven: its storeys are lit four at a time (offices in use, offices dark), no even grid
  float slotLit = step(cbH21(vec2(floor(tx/bw), sfl) + cbSeed*7.), mix(0.04, 0.04 + 1.6*uLit, step(0.42, sgrp)));
  float recess = step(mod(floor(tx/bw) + 2., 5.), 0.5);                         // one bay in five is set back: a dark groove up the face
  // round thirteen: the passing wall is a building. Every eighth storey is a plant floor (louvres, no windows, a string course over it and its shadow under it), the
  // storeys between are offices lit by the suite (two to four bays, lit or dark as one, a few with blinds half down), pipes run up the grooves
  float fz8 = hgt/30.4 + 0.07, mech = step(fract(fz8), 0.125), crs = step(0.125, fract(fz8))*step(fract(fz8), 0.14);
  float louvre = 0.55 + 0.45*step(0.5, fract(hgt/0.42));
  float suite = cbH21(vec2(floor((floor(tx/bw) + floor(sfl*1.7))/3.), sfl) + cbSeed*19.);
  slotLit = max(slotLit*step(0.3, suite), step(0.82, suite)*uDark)*(1. - mech);
  slot *= 1. - mech;
  { float solid = step(0.255, cbSeed)*step(cbSeed, 0.295); slot *= 1. - solid; slotLit *= 1. - solid; recess *= 1. - solid; mech *= 1. - solid; }
  float blindT = step(0.55 + 0.4*cbH21(vec2(floor(tx/bw), sfl)*1.3 + 2.2), by);
  vec3 body = mix(stone*0.8, stone*(0.82 + 0.3*pier), lodT)*(1. - 0.4*recess*(0.4 + 0.6*lodT));
  body = mix(body, vec3(0.03, 0.034, 0.04), slot*lodT);
  body = mix(body, stone*0.5*louvre, mech*mix(0.6, 1., lodT));
  body = mix(body, stone*1.28, crs);
  body *= 1. - 0.3*smoothstep(0.14, 0.141, fract(fz8))*(1. - smoothstep(0.14, 0.2, fract(fz8)));
  float pipeT = recess*(1. - smoothstep(0.1, 0.16, abs(bx - 0.5)))*lodT;
  body = mix(body, vec3(0.2, 0.17, 0.14)*(0.8 + 0.4*step(0.5, fract(hgt/5.7))), pipeT*0.85);
  float up = 0.32 + 1.2*exp(-hgt/30.);                                    // lamps on the setback below wash each tier from its foot
  float swp = (fract(ty/205. - uTime*0.085 - uBandPh) - 0.5)*205./11.;              // a band of brighter light climbs the tower, eleven metres deep, once in twelve seconds
  float band = exp(-swp*swp);
  float flank = 1. - 0.42*step(0.62, fract(cbSeed*25.));                 // seeds 0.11, 0.51, 0.91: the faces along the avenue
  up *= flank;
  vec3 wash = vec3(1.0, 0.58, 0.25)*up*(1. + 1.2*band)*mix(0.55, 1., smoothstep(90., 320., length(vViewPosition)));          // round thirteen: close up the wash is at half strength: lit stone, no orange slab
  if (cbSeed < 0.3) {
    cbAlb = body;
    if (cbSeed > 0.15 && cbSeed < 0.25) {
      // the lift shaft (seed 0.2): a glass shaft up the tower's flank, cool white inside, floor lines, mullions, and a lit car that rides it
      float gx = abs(fract(tx/1.1) - 0.5), flr = fract(ty/3.8);
      float carY = 17. + 94.*(0.5 - 0.5*cos(uTime*0.23 + 6.2832*uBandPh)), car = (1. - smoothstep(1.6, 2.2, abs(ty - carY)));
      vec3 glassL = vec3(0.56, 0.74, 0.86)*(0.1 + 0.26*uDark)*(0.7 + 0.3*step(0.12, flr))*(0.6 + 0.4*smoothstep(0.05, 0.12, gx));
      cbAlb = mix(vec3(0.05, 0.06, 0.07), vec3(0.2, 0.2, 0.21), 1. - smoothstep(0.03, 0.08, min(gx, min(flr, 1. - flr)*3.8)));
      cbEmi += (glassL + car*vec3(1.0, 0.86, 0.6)*(0.25 + 0.6*uDark))*cbNearK*1.3;
    } else {
    cbEmi += slot*slotLit*lodT*vec3(1.0, 0.82, 0.55)*uLitGain*0.3*mix(1., 0.35, blindT) + slotLit*(1. - lodT)*vec3(1.0, 0.8, 0.5)*uLitGain*0.03;
    cbEmi += step(0.875, cbH11(floor(hgt/3.8)*1.7 + 3.1))*mix(1., slot, lodT)*vec3(1.0, 0.8, 0.5)*uLitGain*0.3*uDark*(1. - step(0.255, cbSeed)*step(cbSeed, 0.295));          // one floor in eight is lit from end to end: bands of light up the shaft, no even grid in the close pass
    cbEmi += cbAlb*wash*(0.1 + 1.25*uDark);
    }
  } else if (cbSeed < 0.7) {
    // round eleven (ONE checkerboard, the hill's): the middle tier is the tower's own. A crown of tall lit windows between stone piers: five storeys 11.5 m high, each a
    // band of warm amber and orange light behind glass with a dark spandrel under it, every storey its own lamp, the tier's corners solid stone. As large as the paint
    // was, in the same place, and brighter after dark; by day the glass is dark and the stone takes the sky (no glow in the afternoon looks).
    float nbay = max(floor(tl/2.3 + 0.5), 1.), bwid = tl/nbay, wx = fract(tx/bwid), fl = hgt/11.5, wy = fract(fl), fid = floor(fl), bid = floor(tx/bwid);
    float lodW = 1. - smoothstep(0.25, 0.9, cbPix/bwid);
    float inner = step(0.5, bid)*step(bid, nbay - 1.5);                                      // the corner bays are stone
    float glassM = cbBox(vec2(wx, wy), vec2(0.17, 0.13), vec2(0.83, 0.9), vec2(cbPix/bwid, cbPix/11.5))*inner;
    float trans = smoothstep(0.03, 0.07, abs(fract(wy*3. + 0.2) - 0.5));                      // two transoms across each tall window
    vec3 lampC = mix(vec3(1.0, 0.48, 0.15), vec3(1.0, 0.66, 0.3), cbH11(fid*5.1 + 2.3));        // amber and orange, storey by storey
    float roomK = (0.76 + 0.24*cbH11(fid*3.7 + 1.3))*(0.78 + 0.36*cbH21(vec2(bid, fid) + 4.4))*(0.66 + 0.34*wy);
    roomK *= mix(0.14, 1., step(0.24, cbH21(vec2(floor((bid + fid)*0.5), fid) + 9.7)));          // round thirteen: a quarter of its halls are dark, two bays at a time: a crown with rooms, no even grid
    vec3 glassE = lampC*roomK*mix(0.75, trans, lodW);
    vec3 farW = lampC*0.6*step(0.13, wy)*step(wy, 0.9)*inner;                                  // too far for a bay: the storey is one band of light
    cbAlb = mix(mix(stone*0.8, stone*(0.86 + 0.3*pier), lodT), vec3(0.045, 0.05, 0.055), glassM*lodW);
    cbEmi += mix(farW, glassE*glassM*0.8, lodW)*(0.05 + 1.5*uDark)*(1. + 0.35*band)*cbNearK;          // round thirteen: 2.3 -> 1.5 and the band's lift 0.5 -> 0.35: the crown glows, it does not bloom into a gold column
    cbEmi += cbAlb*wash*(0.1 + 1.25*uDark);
  } else {
    float mull = smoothstep(0.05, 0.11, abs(fract(tx/2.25) - 0.5))*smoothstep(0.04, 0.1, abs(fract(hgt/6.) - 0.5));
    cbAlb = mix(vec3(0.16, 0.13, 0.09), vec3(0.07, 0.06, 0.05), mull);
    cbEmi += vec3(1.0, 0.7, 0.34)*mull*(0.2 + 0.62*uDark)*(0.8 + 0.2*sin(uTime*2.3))*(0.6 + 0.4*smoothstep(0., 0.5, fract(hgt/6.)));          // round thirteen: 2.4 -> 0.62: the lantern's glass stays under the bloom's threshold (its lamp is the glow)
  }
  cbRough = 0.7;
} else {
  // the open front of a market stall: goods piled on the counter, a dark back, a valance under the tarpaulin; most are lit by a bare bulb
  float fy = vF.y/max(vG.y, 0.5);
  vec2 gid = floor(vec2(vF.x/0.45, vF.y/0.35));
  float gh = cbH21(gid + cbSeed*13.), gh2 = cbH21(gid*1.9 + cbSeed*5.);
  vec3 goods = (gh < 0.5 ? vec3(0.34, 0.2, 0.08) : gh < 0.8 ? vec3(0.2, 0.3, 0.1) : gh < 0.93 ? vec3(0.42, 0.3, 0.07) : vec3(0.4, 0.1, 0.06))*(0.7 + 0.6*gh2);
  float shelf = step(fy, 0.55)*(1. - 0.5*smoothstep(0.3, 1.0, cbPix));
  vec3 fr = mix(vec3(0.04, 0.04, 0.045), goods*(0.6 + 0.4*cbVn(vF.xy*3.)), shelf);
  float val = step(0.86, fy);
  float on = step(fract(cbSeed*5.3), 0.45 + uLit + 0.3*uDark);
  cbEmi += (fr + 0.03)*vec3(1.0, 0.75, 0.45)*on*(0.45 + 1.9*uDark)*(1. - val)*(0.5 + 0.5*fy);
  cbAlb = mix(fr, diffuseColor.rgb*0.6, val);
  cbRough = 0.8;
}
cbEmi += cbAlb*uSky*0.5;
{ // round thirteen: what stands beside the squatters' lane on the hill takes its lamps' light, as the slope under it does (the lane's line in the hill's own coordinates)
  vec2 dpl = vP.xz - uHill.xy; vec2 abl = vec2(-(dpl.x*uHill.z + dpl.y*uHill.w), dpl.x*uHill.w - dpl.y*uHill.z);
  float lndl = abs(abl.y - (78. + 22.*sin(abl.x*0.021 + 1.0)));
  cbEmi += cbAlb*vec3(1.0, 0.66, 0.36)*exp(-lndl*lndl/420.)*step(-146., abl.x)*step(abl.x, 46.)*step(3., vP.y)*(0.08 + 1.5*uDark); }
{ // and what stands beside the lanes of the village round the board takes their lamps' light (the lanes' lines in the hill's own coordinates: VILLAGE)
  vec2 dpv = vP.xz - uHill.xy; vec2 abv = vec2(-(dpv.x*uHill.z + dpv.y*uHill.w), dpv.x*uHill.w - dpv.y*uHill.z);
  float vl = min(abs(abs(abv.y) - ${VILLAGE.laneB.toFixed(1)}) + 40.*(1. - step(${VILLAGE.a0.toFixed(1)}, abv.x)*step(abv.x, ${VILLAGE.a1.toFixed(1)})), abs(abv.x - ${VILLAGE.headA.toFixed(1)}) + 40.*step(${VILLAGE.headB.toFixed(1)}, abs(abv.y)));
  cbEmi += cbAlb*vec3(1.0, 0.66, 0.36)*exp(-vl*vl/60.)*step(3., vP.y)*(0.06 + 1.3*uDark)*(1. - 0.6*step(10.5, cbKind));
  // what stands on a roof under the approach line (tin rooms, tanks, planters: the plain and the planted kinds, off the hill) stands in the light of that roof's bulbs after dark
  if ((cbKind > 1.5 && cbKind < 2.5 || cbKind > 3.5 && cbKind < 4.5) && vP.y > 11.) cbEmi += cbAlb*vec3(1.0, 0.8, 0.56)*0.6*uDark*(1. - smoothstep(${(SKIM - 6).toFixed(1)}, ${(SKIM + 2).toFixed(1)}, cbRoute(vP.xz)))*step(1., length(abv/vec2(150., 215.))); }
cbEmi += cbAlb*uPoolCol*cbPool(vP.xz)*(0.22 + 0.78*max(dot(normalize(vN0), uSunDir), 0.));
cbEmi += (cbAlb + 0.012)*vec3(1.0, 0.95, 0.84)*cbLand(vP)*step(0.5, normalize(vN0).y)*(0.2 + 1.3*uDark)*1.7;          // our landing lamps on the roofs and whatever lies open to the sky on them
diffuseColor.rgb = cbAlb*cbShade(vP.xz);
`;

const FRAG_STREET_FN = /* glsl */`
vec3 cbStreet(float ac, float al, float hw, float pix){
  float n = cbVn(vec2(ac, al)*0.35);
  vec3 asph = vec3(0.05, 0.053, 0.058)*(0.7 + 0.6*n);
  float pave = smoothstep(hw - 2.9, hw - 2.6, abs(ac));
  vec3 c = mix(asph, vec3(0.2, 0.19, 0.175)*(0.75 + 0.35*cbH21(floor(vec2(ac, al)/0.9))), pave);
  float fade = 1. - smoothstep(0.25, 0.9, pix);
  float dash = step(fract(al/9.), 0.4)*(1. - smoothstep(0.12, 0.12 + pix, abs(ac)));
  c = mix(c, vec3(0.55), dash*(1. - pave)*fade);
  float kerb = 1. - smoothstep(0.1, 0.1 + pix, abs(abs(ac) - (hw - 2.75)));
  c = mix(c, vec3(0.5, 0.42, 0.12), kerb*fade*0.7);
  return c;
}
vec4 cbLane(float ac, float al, float lane, float dirn, float spd, float dens, float L, vec2 half2, float pix, out vec3 emi){
  float s = al*dirn/L - uTime*spd/L + cbH11(lane*7.13)*37.;
  float i = floor(s), f = fract(s);
  float on = step(cbH11(i*1.37 + lane*19.1), dens);
  float y = (f - 0.5)*L;
  float body = cbBox(vec2(ac, y), -half2, half2, vec2(pix*0.7))*on;
  float hk = cbH11(i*3.1 + lane*5.7);
  vec3 col = hk < 0.42 ? vec3(0.62, 0.05, 0.04) : hk < 0.62 ? vec3(0.66) : hk < 0.8 ? vec3(0.08, 0.09, 0.1) : vec3(0.72, 0.68, 0.48);
  vec3 top = hk < 0.42 ? vec3(0.6, 0.62, 0.64) : hk > 0.8 ? vec3(0.08, 0.36, 0.18) : col*0.55;
  col = mix(col, top, cbBox(vec2(ac, y), vec2(-half2.x*0.75, -half2.y*0.6), vec2(half2.x*0.75, half2.y*0.35), vec2(pix*0.7)));
  float yh = y - half2.y - 1.3, yt = y + half2.y;
  emi = on*sign(spd)*(vec3(1.0, 0.9, 0.7)*exp(-(yh*yh*1.2 + ac*ac*2.5))*0.6*(1. + 1.5*uDark) + vec3(1.0, 0.04, 0.02)*exp(-(yt*yt*3. + ac*ac*1.1))*1.6);
  return vec4(col, body);
}
`;
// city ground: streets on the shared grid, kerbs, crossings, traffic that moves, trams on the boulevard, wet sheen
const FRAG_GROUND = /* glsl */`
vec2 p = vP.xz; vec2 pxv = fwidth(p); float pix = max(max(pxv.x, pxv.y), 1e-3);
vec3 cbAlb; float cbRough = 0.9; vec3 cbEmi = vec3(0.);
float cbFres = pow(1. - clamp(abs(dot(normalize(vViewPosition), normalize(vNormal))), 0., 1.), 4.);
float ax = abs(p.x) - 12.; float lx = mod(max(ax, 0.), 76.); float sgn = p.x < 0. ? -1. : 1.;
float inX = step(0., ax)*step(lx, 60.);
float zs = -366. - p.y; float lz = mod(max(zs, 0.), 48.);
float zw = p.y + 330.; float lzw = mod(max(zw, 0.), 48.);
float wf = step(p.x, -150.)*step(0., zw);
float inZ = mix(step(0., zs)*step(lz, 34.), step(14., lzw)*step(zw, 144.), wf);
float boul = step(zs, 0.)*step(-36., zs);
float quay = wf*step(144., zw);
float ac, al, hw, lid;
if (boul > 0.5) { ac = p.y + 348.; al = p.x; hw = 18.; lid = 500.; }
else if (inX < 0.5) { ac = ax < 0. ? p.x : (lx - 68.)*sgn; al = p.y; hw = ax < 0. ? 12. : 8.; lid = (ax < 0. ? 0. : floor(ax/76.) + 1.)*sgn*3.1; }
else { ac = wf > 0.5 ? lzw - 7. : lz - 41.; al = p.x; hw = 7.; lid = 100. + (wf > 0.5 ? 60. + floor(zw/48.) : floor(zs/48.)); }
float street = max(boul, 1. - inX*inZ)*(1. - quay);
vec3 road = cbStreet(ac, al, hw, pix);
float lodc = 1. - smoothstep(0.45, 1.5, pix);
lodc *= 1. - max(boul*(1. - smoothstep(404., 420., abs(p.x))), (1. - boul)*(1. - inX)*step(abs(p.x), 12.)*smoothstep(-1096., -1080., p.y));
float s1 = ac > 0. ? 1. : -1.; float aa = abs(ac);
float big = step(10., hw), isB = boul, ns = (1. - boul)*(1. - inX);
vec3 e1, e2, e3, e4; vec2 car = vec2(0.95, 2.2);
float spd = mix(mix(3.5, 12., ns), 14., isB);
vec4 l1 = cbLane(aa - mix(2.1, 5.0, isB), al, lid + s1*0.37, s1, spd, mix(0.35, 0.55, ns), 8.5, car, pix, e1);
vec4 l2 = cbLane(aa - mix(5.6, 8.4, isB), al, lid + s1*0.61, s1, spd*0.8*big, 0.5*big + 0.75*(1. - big), 8.5, car, pix, e2);
vec4 l3 = cbLane(aa - 11.8, al, lid + s1*0.83, s1, 11., 0.5*isB, 8.5, car, pix, e3);
vec4 l4 = cbLane(aa - 1.6, al, lid + s1*0.19, s1, 8., 0.4*isB, 64., vec2(1.15, 5.4), pix, e4);
l4.rgb = mix(vec3(0.05, 0.24, 0.12), vec3(0.6, 0.58, 0.45), step(0.6, abs(aa - 1.6)));
road = mix(road, l1.rgb, l1.a*lodc); road = mix(road, l2.rgb, l2.a*lodc); road = mix(road, l3.rgb, l3.a*lodc); road = mix(road, l4.rgb, l4.a*lodc);
cbEmi += (e1 + e2*big + e3 + e4*0.6)*lodc*uHead*street;
// crossings at the block corners, shop light spilling on the wet road
float edge = hw - aa; float n9 = cbVn(p*1.7);
cbEmi += street*vec3(1.0, 0.6, 0.28)*exp(-edge*0.4)*(0.3 + 0.7*cbVn(vec2(al*0.2, lid)))*(0.1 + uLit)*uLitGain*0.2;
vec3 pave = vec3(0.17, 0.165, 0.155)*(0.75 + 0.35*cbVn(p*0.5));
pave = mix(pave, vec3(0.2, 0.2, 0.19)*(0.7 + 0.4*cbH21(floor(p/6.))), quay);
// the tram's rails down the middle of the boulevard, crossings where the last avenue meets it
float gfade = 1. - smoothstep(0.3, 1.0, pix);
float rail = (1. - smoothstep(0.05, 0.05 + pix, abs(abs(aa - 1.6) - 0.72)))*boul*gfade;
road = mix(road, vec3(0.34, 0.35, 0.36), rail*0.8*(1. - max(l4.a, l1.a)*lodc));
float zb = boul*step(abs(abs(p.x) - 15.5), 2.2)*step(aa, 14.8)*step(0.5, fract(ac/1.3));
zb = max(zb, ns*step(ax, 0.)*step(abs(p.y + 369.5), 1.8)*step(abs(p.x), 8.8)*step(0.5, fract(p.x/1.3)));
road = mix(road, vec3(0.5, 0.5, 0.47)*(0.75 + 0.25*n9), zb*gfade*0.8);
// sodium lamps along the boulevard and the last avenue: pools of orange on the wet road, faint by day
float lzA = (fract((p.y + 1080.)/36. + 0.5) - 0.5)*36., lxB = (fract((p.x + 405.)/30. + 0.5) - 0.5)*30.;
float sodA = exp(-(lzA*lzA + (abs(p.x) - 8.)*(abs(p.x) - 8.))*0.016)*ns*step(ax, 0.)*smoothstep(-1110., -1085., p.y);
float sodB = exp(-(lxB*lxB + (aa - 14.)*(aa - 14.))*0.016)*boul*step(abs(p.x), 420.)*step(13., abs(p.x));
cbEmi += vec3(1.0, 0.58, 0.2)*(sodA + sodB)*(0.015 + 0.2*uDark)*(0.5 + 0.5*uWet)*street;
cbAlb = mix(pave, road, street);
// the playground inside the turn
vec2 pk = (p - vec2(${PLAY[0].toFixed(1)}, ${PLAY[1].toFixed(1)}))/vec2(68., 41.);
float inPk = cbBox(pk, vec2(-1.), vec2(1.), pxv/vec2(68., 41.));
float od = length(pk*vec2(1., 0.92));
vec2 pm = pk*vec2(68., 41.); float plw = max(0.35, 0.8*pix);
vec3 pitch = vec3(0.06, 0.17, 0.06)*(0.82 + 0.3*step(0.5, fract(pm.x/7.)))*(0.85 + 0.3*cbVn(p*0.6));
vec2 fh = vec2(42., 24.);
float fdr = max(abs(pm.x) - fh.x, abs(pm.y) - fh.y);
float fl = 1. - smoothstep(plw, plw + pix, abs(fdr));
fl = max(fl, (1. - smoothstep(plw, plw + pix, abs(pm.x)))*step(fdr, 0.));
fl = max(fl, 1. - smoothstep(plw, plw + pix, abs(length(pm) - 7.)));
fl = max(fl, (1. - smoothstep(plw, plw + pix, abs(max(abs(abs(pm.x) - (fh.x - 7.)) - 7., abs(pm.y) - 14.))))*step(fdr, 0.));
pitch = mix(pitch, vec3(0.6, 0.62, 0.56), fl*(1. - smoothstep(1.5, 4., pix)));
float lanes = 0.8 + 0.2*step(0.5, fract(od*41./1.25));
pitch = mix(pitch, vec3(0.4, 0.15, 0.09)*lanes, smoothstep(0.7, 0.72, od)*(1. - smoothstep(0.92, 0.94, od)));
pitch = mix(pitch, vec3(0.2, 0.2, 0.19)*(0.7 + 0.3*step(0.5, fract(od*41./2.2))), smoothstep(0.94, 0.96, od));
cbAlb = mix(cbAlb, pitch, inPk); street *= 1. - inPk; cbEmi *= 1. - inPk;
cbEmi += pitch*vec3(0.85, 1.0, 0.8)*inPk*uDark*(0.35 + 0.4*exp(-od*od*1.2));           // floodlit after dark
float wetm = (0.25 + 0.75*street)*(0.5 + 0.5*cbVn(p*0.11))*uWet;
cbRough = mix(0.92, max(0.16, uPudR + 0.05), wetm);
cbEmi += wetm*(uSky*0.02 + uHz*0.6*cbFres);
cbEmi += cbAlb*uPoolCol*cbPool(p)*mix(0.7, 0.3, street);
cbEmi += (cbAlb + 0.012)*vec3(1.0, 0.95, 0.84)*cbLand(vP)*(0.2 + 1.3*uDark)*0.9;          // our landing lamps on the streets
diffuseColor.rgb = cbAlb*cbShade(p);
`;
// runway, taxiway, apron and grass: all markings are bars and chevrons, no numerals
const FRAG_AIRFIELD = /* glsl */`
vec2 p = vP.xz; vec2 pxv = fwidth(p); float pix = max(max(pxv.x, pxv.y), 1e-3);
vec3 cbAlb; float cbRough = 0.9; vec3 cbEmi = vec3(0.);
float cbFres = pow(1. - clamp(abs(dot(normalize(vViewPosition), normalize(vNormal))), 0., 1.), 4.);
float axx = abs(p.x); vec2 fw2 = vec2(pix);
float n1 = cbVn(p*0.22), n2 = cbVn(p*0.031);
float n3 = cbVn(p*0.008 + 3.7);
float gustw = smoothstep(0.4, 0.85, cbVn(p*0.03 - uTime*vec2(0.28, 0.36)));     // gusts combing the wet grass
// the undershoot is mown in bands that run with the approach; the rest of the field keeps its diagonal cut
float under = (1. - smoothstep(118., 126., axx))*(1. - smoothstep(-74., -66., p.y));
float mow = smoothstep(0.5 - pix/9., 0.5 + pix/9., abs(fract(p.x/18.) - 0.5)*2.);
float mow2 = smoothstep(0.5 - pix/12., 0.5 + pix/12., abs(fract(p.y/24.) - 0.5)*2.);          // and crossed once the other way: bands 12 m wide that pass under the wheels
float cut = mix(0.93 + 0.1*step(0.5, fract((p.y + p.x*0.5)/16.)), (0.86 + 0.22*mow)*(0.93 + 0.14*mow2), under);
vec3 grass = mix(vec3(0.095, 0.125, 0.065), vec3(0.15, 0.145, 0.075), smoothstep(0.35, 0.8, n3)*0.7 + 0.2*n1)*(0.85 + 0.2*n2)*cut*(0.86 + 0.3*gustw);
float bladeK = 1. - smoothstep(0.08, 0.7, pix);                                 // blades and tussocks near the wheels
float blade = cbVn(p*vec2(6., 1.5)), tuft = cbVn(p*0.9 + 31.);
grass *= mix(1., (0.62 + 0.76*blade)*(0.78 + 0.44*smoothstep(0.3, 0.75, tuft)), bladeK);
grass = mix(grass, vec3(0.2, 0.17, 0.085)*(0.7 + 0.5*blade), 0.35*smoothstep(0.62, 0.8, cbVn(p*0.37 + 5.))*(0.4 + 0.6*bladeK));
vec3 conc = vec3(0.3, 0.29, 0.27)*(0.72 + 0.3*cbH21(floor(p/7.5)))*(0.85 + 0.2*n1);
vec2 jt = abs(fract(p/7.5) - 0.5)*7.5;
conc *= 1. - 0.45*(1. - smoothstep(0.06, 0.06 + pix, 3.75 - max(jt.x, jt.y)))*(1. - smoothstep(0.3, 1.2, pix));
vec3 asph = vec3(0.075, 0.078, 0.084)*(0.7 + 0.5*n1)*(0.85 + 0.3*n2);
// round seven: the undershoot is paved. The runway's stopway runs back to the fence under the approach lights, with an apron either side of it (parked wide-bodies,
// floodlight masts, service roads) and a strip of grass between: wet pavement that carries every lamp, the gate's rings and the portal as reflections.
float usZ = step(-322., p.y)*step(p.y, -44.);
float rw = step(axx, 30.5)*step(-322., p.y)*step(p.y, 3300.);
float sho = step(axx, 38.)*step(-322., p.y)*step(p.y, 3310.);
float taxi = step(abs(p.x - 110.), 15.)*step(-322., p.y);
float apU = min(step(50., p.x) + step(p.x, -50.)*step(p.y, -100.), 1.)*usZ;
float srv = min(step(abs(p.x - 59.75), 3.6) + step(abs(p.x + 130.75), 3.6)*step(p.y, -100.), 1.)*usZ;
float link = step(30., p.x)*step(p.x, 125.)*(step(abs(p.y - 30.), 14.) + step(abs(p.y - 900.), 14.) + step(abs(p.y - 1900.), 14.) + step(abs(p.y - 3240.), 14.));
// the perimeter road inside the fence, a gravel track beside the approach lights, two concrete drains that run in toward the threshold
float peri = step(abs(p.y + 318.), 4.)*step(-150., p.x);
float track = (1. - smoothstep(1.0, 1.0 + pix, abs(p.x - 8.5)))*step(-314., p.y)*step(p.y, -70.);
float drain = 0., lips = 0.;
float apron = max(max(step(215., p.x), step(190., p.x)*step(p.y, 470.)), apU);
float rim = max(step(202., p.x), step(p.x, -52.))*step(-40., p.y);
cbAlb = grass;
cbAlb = mix(cbAlb, conc*0.8, max(rim, apron));
cbAlb = mix(cbAlb, asph*1.25, max(taxi, min(link, 1.)));
cbAlb = mix(cbAlb, asph*1.45, srv*(1. - taxi));
cbAlb = mix(cbAlb, vec3(0.5, 0.5, 0.47), srv*(1. - taxi)*(1. - smoothstep(0.1, 0.1 + pix, abs(abs(abs(p.x - (p.x > 0. ? 59.75 : -130.75)) - 1.75) - 1.6)))*(1. - smoothstep(0.5, 2.2, pix))*0.7);
cbAlb = mix(cbAlb, asph*1.3, peri);
cbAlb = mix(cbAlb, vec3(0.6, 0.47, 0.08), peri*(1. - smoothstep(0.12, 0.12 + pix, abs(abs(p.y + 318.) - 3.5)))*(1. - smoothstep(0.5, 2.2, pix))*0.8);
cbAlb = mix(cbAlb, vec3(0.19, 0.18, 0.15)*(0.7 + 0.5*cbH21(floor(p/0.35))*bladeK + 0.25*(1. - bladeK)), track*(1. - peri)*0.85);
cbAlb = mix(cbAlb, conc*0.95, lips*(1. - peri));
cbAlb = mix(cbAlb, vec3(0.035, 0.04, 0.042), drain*(1. - peri));
cbAlb = mix(cbAlb, asph*1.5, sho);
float fade = 1. - smoothstep(0.5, 2.2, pix);
// rubber and wear
float rub = (1. - smoothstep(4., 15., axx))*smoothstep(60., 220., p.y)*(1. - smoothstep(700., 1100., p.y));
vec3 rwc = asph*(1. - 0.45*rub*(0.6 + 0.4*cbVn(vec2(p.x*2.2, p.y*0.02))));
float stopK = 1. - smoothstep(-74., -66., p.y);                                 // the stopway: older, paler asphalt in slabs, tar lines between them
vec2 sj = abs(fract(vec2(p.x/12.66 + 0.5, p.y/22.)) - 0.5)*vec2(12.66, 22.);
rwc = mix(rwc, vec3(0.115, 0.118, 0.125)*(0.72 + 0.4*n1)*(0.85 + 0.3*n2)*(0.9 + 0.2*cbH21(floor(vec2(p.x/12.66 + 0.5, p.y/22.)))), stopK);
rwc *= 1. - 0.4*stopK*(1. - smoothstep(0.1, 0.1 + pix, min(sj.x, sj.y)))*(1. - smoothstep(0.4, 1.6, pix));
float mk = 0.;
mk = max(mk, 1. - smoothstep(0.45, 0.45 + pix, abs(axx - 28.6)));
mk = max(mk, (1. - smoothstep(0.45, 0.45 + pix, axx))*step(fract((p.y - 70.)/50.), 0.6)*step(70., p.y));
mk = max(mk, cbBox(vec2(fract((axx - 2.)/3.6), p.y), vec2(0.12, 6.), vec2(0.62, 36.), vec2(pix/3.6, pix))*step(2., axx)*step(axx, 27.));
float tz = floor((p.y - 127.5)/150.); float tl = p.y - 127.5 - tz*150.;
float tn = step(0., tz)*step(tz, 5.5);
float bars = cbBox(vec2(fract((axx - 9.)/3.), tl), vec2(0.1, 0.), vec2(0.62, 22.5), vec2(pix/3., pix))*step(9., axx)*step(axx, 9. + 3.*max(1., 3. - floor(tz*0.5)));
mk = max(mk, bars*tn*(1. - step(1.5, tz)*step(tz, 2.5)));
mk = max(mk, cbBox(vec2(axx, p.y), vec2(9., 400.), vec2(19., 445.), fw2));
float worn = 0.55 + 0.45*cbVn(p*vec2(1.3, 0.25));
rwc = mix(rwc, vec3(0.62, 0.61, 0.57)*worn, mk*fade*(1. - 0.5*rub));
float chev = step(p.y, -4.)*(1. - smoothstep(0.5, 0.5 + pix, abs(fract((p.y - axx*0.9)/16.) - 0.5)*16.));
rwc = mix(rwc, vec3(0.6, 0.47, 0.08)*worn, chev*fade);
rwc = mix(rwc, vec3(0.62, 0.61, 0.57), (1. - smoothstep(1.5, 1.5 + pix, abs(p.y - 2.)))*fade);
cbAlb = mix(cbAlb, rwc, rw);
float ty = (1. - smoothstep(0.25, 0.25 + pix, abs(p.x - 110.)))*taxi + (1. - smoothstep(0.25, 0.25 + pix, abs(mod(p.y + 250., 85.) - 42.5)))*step(215., p.x)*step(p.x, 400.)*step(p.y, 300.);
ty += (1. - smoothstep(0.25, 0.25 + pix, abs(mod(p.y + 300., 100.) - 50.)))*step(-128., p.x)*step(p.x, -52.)*usZ*step(p.y, -100.);
ty += (1. - smoothstep(0.25, 0.25 + pix, min(abs(p.y + 130.), abs(p.y + 245.))))*step(126., p.x)*step(p.x, 214.);
cbAlb = mix(cbAlb, vec3(0.6, 0.47, 0.08), min(ty, 1.)*fade*(1. - rw));
cbAlb = mix(cbAlb, vec3(0.5, 0.09, 0.05), (1. - smoothstep(0.3, 0.3 + pix, abs(axx - 51.5)))*usZ*apU*fade*0.8);
float hard = max(max(max(rw, sho), max(peri, max(track, lips))), max(max(taxi, min(link, 1.)), max(apron, rim)));
float pud = smoothstep(0.66, 0.8, cbVn(p*0.09 + 11.3)*0.55 + 0.3*cbVn(p*0.45) + 0.15*mix(0.5, cbVn(p*2.1), bladeK))*mix(0.8, 0.55 + 0.45*cbVn(p*3.1), bladeK)*(1. - hard)*uWet;     // standing water on the grass
cbAlb = mix(cbAlb, vec3(0.045, 0.05, 0.05), pud*0.75);
float film = 0.25 + 0.75*smoothstep(0.2, 0.8, cbVn(p*0.07)*0.6 + cbVn(p*vec2(0.21, 0.035) + 7.)*0.4);      // the wet film on concrete and asphalt lies in patches and wind streaks
float wetm = max(max(hard*film*uWet*(1. - 0.5*uDark), pud), drain*(1. - peri));
cbRough = mix(0.92, max(0.14, uPudR + 0.05), wetm);
cbEmi += wetm*(uSky*0.02 + uHz*mix(0.7, 0.5, pud)*cbFres) + (uSky + uFill*1.6)*(1. - hard)*(1. - pud)*(0.03 + 0.3*cbFres)*uWet*(0.6 + 0.6*gustw);
float lzr = mod(p.y + 30., 60.) - 30., lxr = axx - 31.5, lzc = mod(p.y + 15., 30.) - 15.;
float gE = exp(-(lxr*lxr + lzr*lzr)*0.04)*step(-1., p.y)*step(p.y, 3301.);
float gC = exp(-(p.x*p.x + lzc*lzc)*0.1)*step(15., p.y)*step(p.y, 3290.);
float gT = exp(-(p.y + 1.)*(p.y + 1.)*0.05)*step(8.5, axx)*step(axx, 43.);
cbEmi += (0.3 + 0.7*wetm)*(vec3(1.0, 0.9, 0.74)*(gE*0.28 + gC*0.12) + vec3(0.08, 1.0, 0.3)*gT*0.2);
// round five: the wet runway mirrors its lights. Every lamp lays a streak toward the eye, and the portal on the threshold a long one.
vec2 eyeV = cameraPosition.xz - p; vec2 eDir = eyeV/max(length(eyeV), 1.);
float fwdK = smoothstep(0.05, 0.3, -eDir.y);
float slp = eDir.x/max(-eDir.y, 0.25);
float spE = p.y < 1185. ? 30. : 60.;
float tE = spE - mod(p.y, spE), tC = 30. - mod(p.y, 30.);
float fE = smoothstep(0., 2., tE)*exp(-tE/11.), fC = smoothstep(0., 2., tC)*exp(-tC/11.);
float wE = 0.5 + pix*1.5 + 0.035*tE, wC = 0.45 + pix*1.5 + 0.03*tC;
float dR = p.x - 31.5 - tE*slp, dL = p.x + 31.5 - tE*slp, dC = p.x - tC*slp;
float sE = (exp(-dR*dR/(wE*wE)) + exp(-dL*dL/(wE*wE)))*fE*step(-28., p.y)*step(p.y, 3300.);
float sC = exp(-dC*dC/(wC*wC))*fC*step(1., p.y)*step(p.y, 3290.);
float dT1 = dC - 10.5, dT2 = dC + 10.5;
float sT = (exp(-dT1*dT1/(3.2 + wC*wC)) + exp(-dT2*dT2/(3.2 + wC*wC)))*fC*step(31., p.y)*step(p.y, 900.);
float tG = -1. - p.y; float xG = abs(p.x - tG*slp);
float sG = smoothstep(0., 1.5, tG)*exp(-max(tG, 0.)/9.)*step(8.5, xG)*step(xG, 43.)*(0.7 + 0.3*cos(xG*2.094));
float tP = -p.y; float dP = p.x - tP*slp;
float sP = exp(-dP*dP/(150. + 0.03*tP*tP))*smoothstep(0., 8., tP)*exp(-max(tP, 0.)/110.);
float wetS = clamp(hard*(0.3 + 0.7*film)*uWet + pud, 0., 1.)*(0.8 + 0.2*sin(p.y*2.7 + uTime*2.3 + p.x*1.3));
cbEmi += fwdK*wetS*(0.3 + 0.7*uDark)*(vec3(1.0, 0.9, 0.74)*(sE*1.25 + sC*0.7 + sT*0.6) + vec3(0.08, 1.0, 0.3)*sG*0.6) + fwdK*wetS*uPortal*sP*mix(0.28, 0.2, uDark);
// round seven: the approach lights' bars and the stopway's amber edge lights lay their streaks on the wet stopway too
float tB = mod(-60. - p.y, 33.), tA = 15. - mod(p.y + 315., 15.);
float fB = smoothstep(0., 2., tB)*exp(-tB/9.)*step(-345., p.y)*step(p.y, -60.);
float fA = smoothstep(0., 1.5, tA)*exp(-tA/7.)*step(-330., p.y)*step(p.y, -15.);
float dB = p.x - tB*slp, dAR = p.x - 31.5 - tA*slp, dAL = p.x + 31.5 - tA*slp;
float sB = exp(-dB*dB/(20. + wC*wC))*fB;
float sA = (exp(-dAR*dAR/(wE*wE)) + exp(-dAL*dAL/(wE*wE)))*fA;
cbEmi += fwdK*wetS*(0.3 + 0.7*uDark)*(vec3(1.0, 0.8, 0.52)*sB*0.8 + vec3(1.0, 0.6, 0.18)*sA*1.1);
// and the gate itself: the two rings of lit rain and the portal's disc, mirrored in the film of water on the pavement. The eye's ray is carried on through the ground to the
// gate's plane (z = 2.5) and read there at its mirrored height; wind on the film stretches the picture toward the eye, as a wet road does.
float gzd = max(2.5 - p.y, 0.);
float gt = (2.5 - cameraPosition.z)/max(p.y - cameraPosition.z, 0.5);
float gx = cameraPosition.x + (p.x - cameraPosition.x)*gt;
float gy = max(cameraPosition.y, 0.)*(gt - 1.)*(0.8 + 0.4*cbVn(p*vec2(1.9, 0.31) + vec2(0., uTime*0.35)));
float grr = length(vec2(gx, gy - 21.));
float gw = 5. + 0.03*gzd;
float gd1 = grr - 54., gd2 = grr - 111.6;
float gmir = (exp(-gd1*gd1/(gw*gw))*0.6 + exp(-gd2*gd2/(2.*gw*gw))*0.3 + exp(-gd1*gd1/(60.*gw))*0.1 + (1. - smoothstep(17., 22. + 0.04*gzd, grr))*0.36)
  *step(p.y, 2.4)*step(cameraPosition.z + 0.5, p.y)*smoothstep(0., 5., gy);
gmir *= 0.55 + 0.45*cbVn(p*vec2(0.9, 0.16) + vec2(0., uTime*0.3));          // broken by the film's own patches: the chevrons and the bars' streaks stay readable through it
cbEmi += wetS*uPortal*gmir*(0.4 + 0.6*uDark)*smoothstep(0.02, 0.2, -eDir.y);
// the floodlights of the apron and the pier lay pools of sodium light on the concrete; every bar of the approach lights lights the grass round its feet
float lzM = mod(p.y - 95., 110.) - 55., lzN = mod(p.y + 315., 110.) - 55.;
float pM = exp(-((p.x - 142.)*(p.x - 142.) + lzM*lzM)/1700.)*step(95., p.y)*step(p.y, 975.) + exp(-((p.x - 412.)*(p.x - 412.) + lzN*lzN)/1700.)*step(-315., p.y)*step(p.y, 345.);
float lzU = mod(p.y + 347.5, 95.) - 47.5, lzV = mod(p.y + 350., 100.) - 50.;                 // the masts of the two aprons beside the stopway
pM += (exp(-((p.x - 148.)*(p.x - 148.) + lzU*lzU)/1500.) + exp(-((p.x + 140.)*(p.x + 140.) + lzV*lzV)/1500.))*step(-345., p.y)*step(p.y, -55.) + 0.8*exp(-((p.x + 72.)*(p.x + 72.) + (p.y + 78.5)*(p.y + 78.5))/420.);
float lzB = mod(-43.5 - p.y, 33.) - 16.5;
float pB = exp(-(p.x*p.x*0.5 + lzB*lzB)/70.)*step(p.y, -44.)*step(-341., p.y) + exp(-(p.y + 291.)*(p.y + 291.)/60.)*(1. - smoothstep(20., 30., axx))
  + exp(-(p.y + 225.)*(p.y + 225.)/60.)*(1. - smoothstep(16., 25., axx)) + exp(-(p.y + 159.)*(p.y + 159.)/60.)*(1. - smoothstep(12., 21., axx)) + exp(-(p.y + 93.)*(p.y + 93.)/60.)*(1. - smoothstep(8., 16., axx));
pB += 0.5*exp(-(axx - 31.5)*(axx - 31.5)/14.)*step(-322., p.y)*step(p.y, -8.)*(0.6 + 0.4*cos(6.2832*(p.y + 315.)/15.));          // the pools of the stopway's edge lights
cbEmi += cbAlb*vec3(1.0, 0.74, 0.42)*pM*(0.15 + 1.9*uDark) + (cbAlb + pud*0.07)*vec3(1.0, 0.8, 0.52)*pB*(0.25 + 2.4*uDark);
// and all of them together a corridor of lit grass through the dark field, seen from the boulevard on
float pC = exp(-p.x*p.x/2200.)*smoothstep(-345., -300., p.y)*(1. - smoothstep(-60., -20., p.y));
cbEmi += (cbAlb + pud*0.05)*vec3(1.0, 0.8, 0.52)*pC*(0.04 + 0.5*uDark);
// the far shore across the typhoon shelter: wet asphalt yards under sodium light
float shoreK = step(385., p.x)*step(400., p.y);
cbAlb = mix(cbAlb, asph*1.4, shoreK*0.85);
cbEmi += shoreK*vec3(1.0, 0.58, 0.2)*(0.01 + 0.1*uDark)*smoothstep(0.45, 0.8, cbVn(p*0.045 + 2.));
cbEmi += cbAlb*(uSky*0.4 + uFill)*(1. + 0.45*uDark*(1. - hard));               // the sky fill the city takes, and under a low sun the glow of the horizon as well: the field is not a black floor
// the running strobes of the lead-in gantries on the stopway (one every 33 m from the fence to 60 m short of the bar): each flash lays its light on the wet pavement
// under its gantry for the moment it burns, so a pulse of light runs down the stopway toward the threshold with the lamps themselves, on their own rhythm
// (uChain.x: how many strobes the whole chain has; the lamp shader's own timing)
{ float gi = clamp(floor((-60. - p.y)/33. + 0.5), 0., 8.), gz = -60. - gi*33.;
  float gf = fract(uTime*0.8 - 0.9*(1. - gi/max(uChain.x - 1., 1.)));
  float gb = smoothstep(0., 0.05, gf)*(1. - smoothstep(0.05, 0.3, gf));
  cbEmi += (cbAlb + 0.01 + pud*0.06)*vec3(0.82, 0.9, 1.0)*gb*uStrobe*exp(-p.x*p.x/110. - (p.y - gz)*(p.y - gz)/70.)*step(-345., p.y)*1.5; }
// round six: the landing lights. A long pool of white light runs ahead of the aircraft over the undershoot and the threshold, nearer and brighter as it comes down.
// The pool is cbLand's, the law the roofs, the streets and the slope call, at the airfield's own level: one law from the first roof to the threshold.
float land = cbLand(vec3(p.x, 0., p.y));
cbEmi += (cbAlb + 0.012 + pud*0.09)*vec3(1.0, 0.95, 0.84)*land*(0.2 + 1.3*uDark)*(1. - 0.45*hard);          // standing water glints in them; on the wet pavement the pool is dimmer and the lamps' own reflections carry the picture
cbEmi += cbAlb*uPoolCol*cbPool(p)*0.75;
diffuseColor.rgb = cbAlb*cbShade(p);
`;
const FRAG_HILL_DECL = 'uniform vec3 uBoard; uniform vec3 uScrub, uChkA, uChkB, uBoardK, uBoardL, uBSun; uniform float uFlood; uniform vec4 uCreep[12];';          // uBoardK (by day): the share of the shaft's light the paint takes, the paint's albedo, the orange squares' own glow; uBoardL (after dark): the light of the board's own floodlamps on the paint
const FRAG_HILL = /* glsl */`
vec2 p = vP.xz; float cbRough = 0.95; vec3 cbEmi = vec3(0.);
float sl = clamp(normalize(vN0).y, 0., 1.);
vec2 dp = p - uHill.xy;
vec2 ab = vec2(-(dp.x*uHill.z + dp.y*uHill.w), dp.x*uHill.w - dp.y*uHill.z);
float n1 = cbVn(p*0.045), n2 = cbVn(p*0.21 + 7.), n3 = cbVn(p*1.3), n4 = cbVn(p*1.9 + 3.1), n5 = cbVn(p*5.3);
vec2 hfw = fwidth(p); float hpx = max(hfw.x, hfw.y);
float fine = 1. - smoothstep(0.1, 0.9, hpx);
vec3 scrub = mix(uScrub*0.75, uScrub*1.25 + vec3(0.03, 0.045, 0.), n1*0.55 + n2*0.45)*(0.68 + 0.42*n2)*(0.75 + 0.4*n3);
scrub *= mix(1., 0.6 + 1.6*n4*n5, fine);
scrub *= 0.8 + 0.42*smoothstep(0.3, 0.75, cbVn(p*0.8 + 17.));
vec3 dry = vec3(0.25, 0.225, 0.12)*(0.7 + 0.4*n2)*mix(1., 0.7 + 0.6*n5, fine);
vec3 rock = vec3(0.31, 0.29, 0.27)*(0.55 + 0.55*n2)*(0.75 + 0.35*cbVn(vec2(p.x*0.3 + vP.y*0.4, vP.y*0.9)))*(1. - 0.55*uDark);          // round nine: after dark the bare rock of the skirt was the palest thing under the turn (a grey blob in the corner of the frame)
vec3 cbAlb = mix(scrub, dry, smoothstep(0.55, 0.8, n1*0.45 + n2*0.4 + n3*0.25));
cbAlb = mix(cbAlb, uScrub*0.5*(0.55 + 0.9*n3), 0.55*smoothstep(0.34, 0.8, cbVn(p*0.17 + 3.))*smoothstep(0.55, 0.8, sl));          // thicket in soft drifts (the dark patches had outlines)
cbAlb = mix(rock, cbAlb, smoothstep(0.7, 0.86, sl + 0.14*n2));
float crag = smoothstep(0.62, 0.9, cbVn(p*0.55 + 5.))*smoothstep(0.45, 0.7, cbVn(p*0.085 + 9.));      // boulders, in clusters, each a metre or two
cbAlb = mix(cbAlb, mix(rock, cbAlb*1.3, 0.55)*(0.62 + 0.5*n5*fine), 0.42*crag);          // stones in the colour of the ground they lie on, no pale core with a dark rim (it read as camouflage paint)
cbAlb = mix(vec3(0.2, 0.2, 0.19)*(0.7 + 0.4*n3)*(1. - 0.5*uDark), cbAlb, smoothstep(0.4, 5., vP.y + 2.*n2));
cbAlb *= mix(1., 0.72 + 0.56*cbVn(p*1.9)*cbVn(p*7.3 + 3.) + 0.22*smoothstep(0.86, 0.93, cbVn(p*6.5 + 9.)), 1. - smoothstep(0.05, 0.5, hpx));          // round eight: grain, stones and litter that come in close up: the nearest ground of the flight is not the smoothest
vec2 bq = vec2(ab.y/uBoard.y, (ab.x - uBoard.x)/uBoard.z);
vec2 bfw = max(fwidth(bq), vec2(1e-4));
float inb = cbBox(bq, vec2(-1.), vec2(1.), bfw);
vec2 cg = (bq + 1.)*3.; vec2 cell = floor(cg), cf = fract(cg);
float chk = mod(cell.x + cell.y, 2.);
vec2 ee = smoothstep(vec2(0.), bfw*1.6, cf)*(1. - smoothstep(vec2(1.) - bfw*1.6, vec2(1.), cf));          // crisp squares (the edge was four pixels of blend)
// THE PAINT. The orange is a pigment, not a signal lamp: under a low warm sun it keeps its yellow (warmL: how far the day's light, uPoolCol, leans to red). Every
// square was painted on its own day: some are fresh, some chalked and faded (sqOld), some dirtier than their neighbours (sqB); the whites are bone, never paper, and
// greyer where they are old. Everything about the paint is the board's own, in the board's coordinates: nothing here reads where the eye stands.
float warmL = clamp(1.4 - 2.*uPoolCol.g/max(uPoolCol.r, 1e-3), 0., 1.)*(1. - uFlood);
vec3 chkO = uChkA + vec3(0., uChkA.r*0.34*warmL, 0.); chkO *= mix(1., 0.9*dot(uChkA, vec3(0.3, 0.6, 0.1))/max(dot(chkO, vec3(0.3, 0.6, 0.1)), 1e-3), warmL);
float sqm = ee.x*ee.y, sqB = cbH21(cell*1.7 + 11.3), sqOld = smoothstep(0.45, 0.95, cbH21(cell + 3.7));
vec3 pO = mix(chkO, chkO*vec3(0.9, 1.1, 1.12), sqOld)*(0.86 + 0.2*sqB);
vec3 pW = uChkB*mix(vec3(0.97, 0.97, 0.96), vec3(0.78, 0.79, 0.79), sqOld)*(0.88 + 0.16*sqB);
vec3 paint = mix(mix(pO, pW, 0.4), mix(pO, pW, chk), sqm);
paint *= mix(uBoardK.y, 1., uFlood);
// round six: the board close up. It is painted on concrete panels 5.25 m square (two to a painted square), their joints dark; rain has streaked the paint down the slope and it has flaked off in chips.
vec2 bm = bq*uBoard.y; float bpx = max(bfw.x, bfw.y)*uBoard.y;
float bfine = 1. - smoothstep(0.12, 0.7, bpx);
float bpn = uBoard.y/9.; vec2 jq = abs(fract(bm/bpn + 0.5) - 0.5)*bpn;          // panels three to a painted square
float joint = (1. - smoothstep(0.05, 0.05 + bpx, min(jq.x, jq.y)))*(1. - smoothstep(0.25, 1.1, bpx));
float wear = cbVn(p*0.6)*0.55 + cbVn(vec2(bm.x*1.3, bm.y*0.1))*0.5;
float streak = cbVn(vec2(bm.x*2.6, bm.y*0.09 + 3.));
float chip = smoothstep(0.62, 0.7, cbVn(bm*2.3 + 11.)*0.6 + cbVn(bm*6.1)*0.4)*bfine;
float bmid = 1. - smoothstep(0.5, 2.2, bpx);          // round thirteen: seams, streaks and wear carry to the middle distance (they stopped at 0.7 m a pixel: from the run-in the board was a flat floor)
paint *= (0.92 + 0.1*wear)*(1. - 0.1*smoothstep(0.5, 0.8, streak)*bfine);
float runs = smoothstep(0.52, 0.86, cbVn(vec2(bm.x*0.85 + 1.7, bm.y*0.035 + 4.)))*(0.55 + 0.45*cbVn(vec2(bm.x*3.1, bm.y*0.12)));          // rain has run down the slope from the berms and the head wall
paint *= 1. - 0.13*runs*bmid;          // round eleven: the rain's streaks are a close-up detail only (from the approach they read as a smeared board)
// The broad weathering, at the scale of the squares. Three berms cross the board (bz: 0 at the head wall, 4 at the foot, a berm at 1, 2 and 3) and the rain that
// collects on each runs on down the paint below it: a band of grime right under every berm and under the head wall, and grey tears two or three metres wide that
// reach ten to twenty metres down the slope from it; each of the four terraces between them has weathered at its own rate. A third of the squares have flaked back
// to grey concrete along their lower edge, where the water stands longest. (bbig: these are metres wide and stay until a pixel is wider than they are.)
float bz = (bq.y + 1.)*2., bterr = floor(clamp(bz, 0., 3.99));
float below = fract(clamp(bz, 0., 3.99))*uBoard.y*0.5;
float bbig = 1. - smoothstep(1.2, 3.5, bpx);
float rcol = cbVn(vec2(bm.x*0.42 + bterr*7.3, 2.1)), rcol2 = cbVn(vec2(bm.x*1.15 + bterr*3.1, 9.4));
float tears = smoothstep(0.5, 0.78, rcol*0.65 + rcol2*0.35)*exp(-below/(5. + 14.*rcol));
tears = max(tears, 0.55*exp(-below/2.4));
paint = mix(paint, paint*vec3(0.58, 0.6, 0.6) + vec3(0.02), 0.62*tears*bbig*(1. - 0.4*uFlood));
paint *= 0.9 + 0.17*cbH11(bterr*5.7 + 2.3);
{ float flk = step(0.62, cbH21(cell*2.3 + 7.1)), fdep = 0.07 + 0.2*cbH21(cell*3.1 + 2.), few = max(0.025, bfw.y*4.5);
  float fedge = cf.y + 0.16*(cbVn(bm*0.4 + 31.) - 0.5) + 0.07*(cbVn(bm*1.6 + 3.) - 0.5);
  float flake = flk*smoothstep(1. - fdep - few, 1. - fdep + few, fedge)*smoothstep(0.3, 0.5, cbVn(bm*0.8 + 5.) + 0.5*smoothstep(1. - fdep*0.5, 1., fedge))*bbig;
  paint = mix(paint, vec3(0.3, 0.29, 0.27)*(0.8 + 0.35*cbVn(bm*1.3 + 2.)), 0.85*flake); }
// round seven: it is a painted hillside, not a sign. Damp stands in it in big patches, soot and moss creep in from its upper edge and its sides, and the white has weathered to bone.
float damp = cbVn(bm*0.075 + 5.)*0.6 + cbVn(bm*0.21 + 9.)*0.4;
paint *= 0.94 + 0.08*smoothstep(0.25, 0.75, damp);          // bright fresh paint: no grey in the squares
paint = mix(paint, paint*vec3(0.62, 0.66, 0.52), 0.42*smoothstep(0.8, 1.02, max(abs(bq.x), 0.06 - bq.y*0.94) + 0.22*(damp - 0.5)));
{ float dcor = length((1. - abs(bq))*uBoard.y);          // the four corners, where the kerb's gutters meet, are stained
  paint = mix(paint, paint*vec3(0.5, 0.52, 0.42), 0.62*exp(-dcor/11.)*(0.55 + 0.45*cbVn(bm*0.3 + 21.))); }
paint = mix(paint, vec3(0.33, 0.31, 0.29), max(smoothstep(0.92, 1.0, wear)*0.2, chip*0.3)*bfine);
paint *= 1. - 0.22*joint;
// round thirteen: the cast panels are seen from the run-in too: every panel a little lighter or darker than its neighbour (weathered at its own rate), the pour seams
// between them a dark line half a metre wide once it is a line at all (mean kept: no grey veil from far off)
vec2 pid = floor(bm/bpn + 0.5);
paint *= 1. + (cbH21(pid*1.37 + 5.1) - 0.5)*0.13*bmid;
float seam = (1. - smoothstep(0.1, 0.1 + max(bpx, 0.12), min(jq.x, jq.y)))*bmid;
paint *= 1. - 0.2*seam*(1. - smoothstep(0.25, 1.1, bpx)*0.5);
// two maintenance ladders are bolted up the board (b = +-0.64): rails and rungs close up, a thin dark line from the approach
float ldx = abs(abs(bq.x) - 0.64)*uBoard.y;
float lrail = (1. - smoothstep(0.07, 0.07 + bpx, abs(ldx - 0.28)));
float lrung = (1. - smoothstep(0.05, 0.05 + bpx, abs(fract(bm.y/0.45) - 0.5)*0.45))*step(ldx, 0.28)*(1. - smoothstep(0.08, 0.3, bpx));
float ladder = max(lrail, lrung)*(1. - smoothstep(0.3, 1.5, bpx)*0.7);
paint = mix(paint, vec3(0.2, 0.2, 0.21), ladder*0.85);
paint *= 1. - 0.25*(1. - smoothstep(0., 0.5, ldx - 0.3))*step(0.3, ldx)*bfine;          // each lays a shadow beside it
{ float lfy = fract(bm.y/6.25)*6.25;          // each ladder is bolted to the slab every 6.25 m, and every fixing weeps rust down the paint below it
  float rust = exp(-lfy/2.6)*(1. - smoothstep(0.25, 0.55 + 0.14*lfy, ldx))*(0.6 + 0.4*cbVn(vec2(bm.x*4., bm.y*0.3)));
  rust = max(rust, 0.3*(1. - smoothstep(0.3, 1.1, ldx)));
  paint = mix(paint, paint*vec3(0.62, 0.36, 0.2) + vec3(0.05, 0.02, 0.), 0.75*rust*(1. - smoothstep(1.5, 5., bpx))); }
float sur = cbBox(bq, vec2(-1.3), vec2(1.3), bfw*2.);
// the apron round it: cast slabs with their joints, rain streaks running down the slope
vec2 aj = abs(fract(bm/4.2 + 0.5) - 0.5)*4.2;
float ajl = (1. - smoothstep(0.06, 0.06 + bpx, min(aj.x, aj.y)))*(1. - smoothstep(0.25, 1.1, bpx));
vec3 apr = vec3(0.36, 0.35, 0.33)*(0.62 + 0.4*n2)*(0.82 + 0.28*cbH21(floor(bm/4.2)))*(1. - 0.3*ajl);
apr *= 1. - 0.24*smoothstep(0.5, 0.8, cbVn(vec2(bm.x*1.9 + 7., bm.y*0.11)));
// the apron's drains: an open channel crosses it two metres below the foot kerb, where the board's water is caught (a dark slot with a pale worn lip), and where each
// berm's gutter comes through the side wall a damp streak runs on down the apron below the outlet
{ float drn = abs(bq.y - 1.058)*uBoard.y, dlod = 1. - smoothstep(1.2, 4., bpx);
  apr = mix(apr, vec3(0.07, 0.07, 0.075), (1. - smoothstep(0.32, 0.32 + bpx, drn))*step(abs(bq.x), 1.22)*dlod);
  apr *= 1. + 0.3*(1. - smoothstep(0.4, 1.3, drn))*step(0.32 + bpx, drn)*step(abs(bq.x), 1.22)*dlod;
  float osx = abs(abs(bq.x) - 1.075)*uBoard.y;
  apr *= 1. - 0.42*exp(-below/8.)*(1. - smoothstep(0.5, 1.5 + 0.1*below, osx))*step(1., bz)*step(bz, 4.)*(1. - smoothstep(2., 6., bpx)); }
float fd = max(1. - bq.y, 0.)*uBoard.y;
// round eight: four masts stand before its foot (b = -45, -15, 15, 45) and throw fans of light up the slope (after round eleven a faint trace on the paint, no more).
float fanW = 0.5 + 0.5*cos(6.2832*(ab.y/uBoard.y*1.4 + 1.5));
// round eleven: the board is floodlit by its own lamps on the kerb wall, one every twelve metres down both sides, along its head and along its foot: the paint is lit
// evenly from edge to edge (it was hot along its foot and went to a dim grey at its head) and each lamp lays a warm pool on the paint's rim, the apron and the wall
float dSide = abs(1. - abs(bq.x))*uBoard.y, dHead = abs(bq.y + 1.)*uBoard.y, dFoot = abs(1. - bq.y)*uBoard.y;
float pSide = exp(-dSide/8.)*(0.55 + 0.45*cos(6.2832*(bq.y + 1.)*4.));
float pHead = exp(-dHead/8.)*(0.55 + 0.45*cos(6.2832*(bq.x + 1.)*4.));
float pFoot = exp(-dFoot/10.)*(0.55 + 0.45*cos(6.2832*(bq.x + 0.8333)*4.2));
float pools = min(pSide + pHead + pFoot, 1.3);
// AFTER DARK LIGHT FALLS ACROSS THE PAINT from the lamps that stand round it, and lies on the paint only. Eight floodlamps on low posts along the foot (footL): a
// scallop of light over each, widening and merging up the slope, half of it gone 20 m up; nine lamps on the kerb wall down each side (sideL) and seven along the
// head (headL), each a smaller scallop reaching ten or twelve metres in; the gantry on the four masts before the foot washes the lower middle (mastL). The foot is
// the brightest of it, the middle and the head stand in what is left: still the brightest surface on the hill. Near a lamp the light is the lamp's own warm colour,
// further off it is the whiter mix of all of them (bWarm).
float lxF = (fract((bq.x + 0.8333)*4.2 + 0.5) - 0.5)*uBoard.y/4.2, wF = 2.6 + 0.42*fd, scF = exp(-lxF*lxF/(wF*wF));
float footL = mix(scF, 0.62, 1. - exp(-fd/16.))/(1. + pow(max(fd, 1e-3)/20., 1.7))*(1. - 0.5*smoothstep(0.86, 1.02, abs(bq.x)));
float lyS = (fract((bq.y + 1.)*4. + 0.5) - 0.5)*uBoard.y*0.25, wS = 2.4 + 0.5*dSide, scS = exp(-lyS*lyS/(wS*wS));
float sideL = mix(scS, 0.6, 1. - exp(-dSide/12.))/(1. + pow(max(dSide, 1e-3)/11., 1.8));
float lxH = (fract((bq.x + 1.)*4. + 0.5) - 0.5)*uBoard.y*0.25, wH = 2.4 + 0.5*dHead, scH = exp(-lxH*lxH/(wH*wH));
float headL = mix(scH, 0.6, 1. - exp(-dHead/12.))/(1. + pow(max(dHead, 1e-3)/10., 1.8));
float mastL = (0.6 + 0.4*fanW)*exp(-(fd - 26.)*(fd - 26.)/1150.);
float bL = 0.58 + 1.75*footL + 1.0*sideL + 1.15*headL + 0.55*mastL;
float bWarm = clamp(scF*exp(-fd/7.) + scS*exp(-dSide/6.) + scH*exp(-dHead/6.), 0., 1.);
float flood = mix(0.5 + 1.3*pools, bL, inb);
flood = mix(1., flood, uFlood*sur);
// three berms cross it, 25 m apart up the slope (drain channels with a kerb 0.8 m high). After dark each kerb's rise catches the foot lamps and throws a band of
// shadow seven metres up the slope behind it; by day its shadow lies where the look's sun puts it (uBSun: the sun in the board's own axes: across, down the slope,
// along the normal), the kerb's top takes the sky and its face is in shade
float bsd = (fract(bz + 0.5) - 0.5)*uBoard.y*0.5;
float bOnZ = step(0.5, bz)*step(bz, 3.5)*inb, bOn = bOnZ*(1. - smoothstep(1.2, 3.5, bpx));
float lipW = max(1.0, 1.3*bpx);
float bLip = smoothstep(-bpx, 0., bsd)*(1. - smoothstep(lipW, lipW + bpx, bsd))*bOnZ*(1. - 0.55*smoothstep(1.2, 3.5, bpx));
float shLen = mix(clamp(0.8*abs(uBSun.y)/max(uBSun.z, 0.12), 0.5, 9.), 7., uFlood);
float sdd = mix(uBSun.y >= 0. ? 1. : 0., 1., uFlood) > 0.5 ? -bsd : bsd - 1.;          // metres into the shadow, on the side of the kerb away from the light
float bSh = smoothstep(-max(bpx, 0.1), 0., sdd)*(1. - smoothstep(shLen*0.3, shLen, sdd))*bOnZ*(1. - smoothstep(1.5, 4., bpx));
paint = mix(paint, vec3(0.4, 0.39, 0.36)*(0.8 + 0.3*cbH21(floor(vec2(bm.x/3.5, bz + 0.5)))), bLip*0.75);
paint *= (1. - 0.3*bSh*(1. - uFlood))*(1. - 0.4*bLip*(1. - uFlood));
flood *= (1. + 0.7*bLip*inb)*(1. - 0.5*bSh*inb);
// by day the kerb wall on the sun's side lays its shadow along that edge of the paint, the trees of the margin throw their dark over the edges (it moves as they
// do), a line of damp shade lies at the foot of every wall, the cast slabs have settled unevenly and take the light a little differently, and the squall's broken
// cloud shadow stays off the paint as it always did: the shaft of storm light stands on it (bDay: all of the day's shaping of the light on the paint)
float kwS = 1.5*abs(uBSun.x)/max(uBSun.z, 0.12), dSun = (uBSun.x >= 0. ? 1. - bq.x : 1. + bq.x)*uBoard.y;
float kSh = 1. - smoothstep(kwS*0.6, kwS + 0.3 + bpx, dSun);
float dEdge = min(dSide, dHead);
float tsh = smoothstep(0.4, 0.7, cbVn(bm*0.2 + 13.))*(0.75 + 0.25*cbVn(bm*0.9 + uTime*vec2(0.21, 0.13)))*exp(-dEdge/6.)*(bq.x*uBSun.x > 0. || dHead < dSide ? 1. : 0.4);
float bDay = (1. - 0.42*kSh)*(1. - 0.4*tsh)*(1. + 0.16*(cbVn(bm*0.055 + 3.) - 0.5) + 0.07*(cbH21(floor(bm/bpn + 0.5)*2.1 + 1.3) - 0.5)*bmid);
paint *= 1. - 0.3*exp(-min(dEdge, dFoot)/0.9)*bfine;
// where the board's bank is steep it is a retaining wall of concrete blocks in courses (drawn in height and along the wall, so nothing smears down the slope)
float steepK = 1. - smoothstep(0.5, 0.82, sl);
vec2 wq = vec2((abs(bq.x) > abs(bq.y) ? ab.x : ab.y)/4.5, vP.y/2.4);
vec3 wallc = vec3(0.33, 0.32, 0.3)*(0.7 + 0.3*cbH21(floor(wq)))*(1. - 0.32*step(0.9, fract(wq.y)))*(1. - 0.22*step(0.93, fract(wq.x + 0.5*floor(wq.y))));
// rock flecks a metre or two across, and the paths worn down the slope from the board's lower corners
float fleck = smoothstep(0.7, 0.8, cbVn(p*0.7 + 23.))*(1. - smoothstep(0.3, 1.6, hpx));
cbAlb = mix(cbAlb, mix(rock, cbAlb, 0.5)*1.25*(0.75 + 0.5*n5*fine), 0.3*fleck*smoothstep(8., 16., vP.y));
float cpl = abs(abs(ab.y) - uBoard.y*1.16 - 6.*sin(ab.x*0.06) - max(ab.x - uBoard.x, 0.)*0.22);
float cpath = (1. - smoothstep(1.1, 1.1 + hpx, cpl))*step(uBoard.x - uBoard.z, ab.x)*(1. - smoothstep(1.6, 5., hpx));          // worn pale by feet, a little over two metres wide
cbAlb = mix(cbAlb, vec3(0.43, 0.38, 0.28)*(0.75 + 0.4*n3), cpath*0.85);
cbAlb = mix(cbAlb, mix(apr, wallc, steepK), sur);
cbAlb = mix(cbAlb, paint, inb);
// scrub and creeper come over the kerb at places along the sides and the head (uCreep: where each has its root on the kerb, in the board's own coordinates, and how
// many metres it reaches; the world stands shrubs on the kerb at the same places): ragged mats of leaves on the paint, the apron and the wall's foot
float creep = 0.;
{ float cnz = cbVn(bm*0.33 + 40.) - 0.5, cnz2 = cbVn(bm*1.4 + 7.) - 0.5;
  for (int i = 0; i < 12; i++) { vec4 cs = uCreep[i]; float cr = max(cs.z, 1.), cdm = length((bq - cs.xy)*uBoard.y) + cr*(1.1*cnz + 0.5*cnz2); creep = max(creep, (1. - smoothstep(cr*0.6, cr, cdm))*step(0.5, cs.z)); }
  creep *= cbBox(bq, vec2(-1.25), vec2(1.25), bfw*2.);
  cbAlb = mix(cbAlb, uScrub*(0.45 + 0.7*cbVn(bm*2.6 + 3.))*(0.7 + 0.6*cbVn(bm*7.)), creep*0.92); }
float gloss = smoothstep(0.3, 0.75, damp)*(1. - 0.6*chip)*(1. - creep);          // round thirteen: wet paint: where damp stands in it the board is glossy, and the sky's light slides over it as the eye moves
cbRough = mix(0.95, mix(0.62, 0.3, gloss), inb);
float swp = sin(bq.x*1.9 + bq.y*0.7 - uTime*0.9 + 1.3*sin(uTime*0.11));
float trl = abs(ab.y - 26. - 46.*sin(ab.x*0.013 + 0.6) - 9.*sin(ab.x*0.071));
float trail = (1. - smoothstep(0.9, 0.9 + hpx, trl))*step(ab.x, -18.)*step(-140., ab.x)*(1. - smoothstep(0.6, 2.4, hpx))*(1. - sur);
cbAlb = mix(cbAlb, vec3(0.3, 0.25, 0.17)*(0.75 + 0.4*n3), trail*0.85);
// round thirteen: the squatters' lane along the flank the turn looks down on (the part's laneB): trodden earth three metres wide, a lamp every thirteen metres
float lnd = abs(ab.y - (78. + 22.*sin(ab.x*0.021 + 1.0)));
float lnk = step(-141., ab.x)*step(ab.x, 41.)*(1. - sur);
cbAlb = mix(cbAlb, vec3(0.34, 0.28, 0.2)*(0.75 + 0.4*n3), (1. - smoothstep(1.5, 1.5 + hpx, lnd))*lnk*(1. - smoothstep(1.5, 5., hpx))*0.85);
cbEmi += cbAlb*vec3(1.0, 0.62, 0.3)*exp(-lnd*lnd/200.)*lnk*(0.6 + 0.4*cos(6.2832*ab.x/13.))*(0.06 + 2.6*uDark);
// the village round the board (the part's VILLAGE): a stepped lane climbs each side of the board beyond its margin of trees, winding from landing to landing, and a
// lane runs along its head; a lamp stands at every landing (nine and a half metres apart on the sides, twelve along the head) and lays its pool on the steps
float vza = 2.6*(abs(fract(ab.x/19.) - 0.5)*4. - 1.);
float vls = abs(abs(ab.y) - ${VILLAGE.laneB.toFixed(1)} - vza) + 40.*(1. - step(${VILLAGE.a0.toFixed(1)}, ab.x)*step(ab.x, ${VILLAGE.a1.toFixed(1)}));
float vlh = abs(ab.x - ${VILLAGE.headA.toFixed(1)}) + 40.*step(${VILLAGE.headB.toFixed(1)}, abs(ab.y));
float vld = min(vls, vlh);
float vstep = step(0.78, fract((vls < vlh ? ab.x : ab.y)/0.9))*(1. - smoothstep(0.1, 0.5, hpx));
cbAlb = mix(cbAlb, vec3(0.37, 0.33, 0.27)*(0.75 + 0.4*n3)*(1. - 0.4*vstep), (1. - smoothstep(1.0, 1.0 + hpx, vld))*(1. - smoothstep(1.5, 5., hpx))*(1. - sur)*0.9);
cbEmi += cbAlb*vec3(1.0, 0.63, 0.31)*(exp(-vls*vls/70.)*(0.5 + 0.5*cos(6.2832*(ab.x - 22.)/${VILLAGE.step.toFixed(1)})) + exp(-vlh*vlh/70.)*(0.5 + 0.5*cos(6.2832*ab.y/12.)))*(0.06 + 3.0*uDark)*(1. - 0.7*sur);
cbEmi += cbAlb*(uSky*0.55 + uDark*vec3(0.125, 0.1, 0.095))*(1. + 0.3*(1. - smoothstep(110., 260., length(vViewPosition)))*(1. - uDark));          // by day the slope under the close pass takes a third more of the sky's fill
cbEmi += cbAlb*uDark*vec3(0.25, 0.34, 0.54)*(1. - smoothstep(110., 330., length(vViewPosition)))*(1. - inb);          // round thirteen: after dark the slope within 300 m of the eye stands in our own lights and the moon's: a hillside, not a black mass
// after dark the floodlit board throws its orange onto the slope round it
vec2 bod = max(abs(vec2(ab.y, (ab.x - uBoard.x)*uBoard.y/uBoard.z)) - uBoard.y, 0.);
cbEmi += cbAlb*vec3(1.0, 0.46, 0.15)*uFlood*(1. - inb)*exp(-length(bod)/30.)*2.6*(1. - 0.55*sur);          // (round eleven: less of it on the apron and the wall, which have the lamps' own pools: they were a flat pink)
// seen from the scud, a kilometre and a half of wet air lies in front of the board: the shaft that stands on it keeps its orange alive
cbEmi += inb*chkO*(1. - mix(0.4, chk, sqm))*(uBoardK.z + 0.06*(1. - warmL))*(1. - uFlood)*bDay*(1. - creep);          // by day the orange squares glow a little of themselves (the white ones do not: no glare, no wash of white over the orange)
cbEmi += cbAlb*uPoolCol*cbPool(p)*mix(0.22 + 0.78*max(dot(normalize(vN0), uSunDir), 0.), 1., uFlood)*(1. - (1. - 0.4*uBoardK.x)*inb*(1. - uFlood))*mix(flood, (1. + 0.16*swp*swp*swp*inb)*mix(1., bDay, inb), 1. - uFlood)*mix(1., 0.4*(1. - inb), uFlood);
// round thirteen: the sheen. At a grazing angle the wet paint mirrors the sky at the horizon (the afterglow, the moonlit haze, the storm's pale edge), strongest where damp
// stands; a reflection, so it moves as the eye does (never a mirror: no image in it). Its level and its curve of angle are the same at every distance.
// And the floodlights (after dark) or the shaft of storm light (by day) sweep slowly over the board: a band of brighter light crossing it.
float bFres = pow(1. - clamp(abs(dot(normalize(vViewPosition), normalize(vNormal))), 0., 1.), 3.);
cbEmi += inb*(uHz*0.55 + uSky*0.25)*bFres*(0.35 + 0.65*gloss);
flood *= 1. + 0.12*swp*swp*swp*inb;
cbEmi += cbAlb*mix(uBoardL, uBoardL*vec3(1.14, 0.88, 0.6), 0.75*bWarm)*mix(vec3(1.22, 0.84, 0.55), vec3(1.), mix(0.4, chk, sqm))*flood*inb*uFlood;          // (in the lamps' light the orange burns a little hotter than the white beside it)          // round eleven: after dark the paint stands in the light of its own lamps (whiter than the street's sodium, so the orange stays orange and the white stays white), held under the bloom's threshold: no glare bleaches the squares          // round eight: after dark the board is a deep orange (two thirds of the light it had: brighter, the tone map bleaches it to salmon) and the apron round it is in half-light
cbEmi += cbAlb*vec3(1.0, 0.6, 0.28)*pools*0.5*sur*(1. - inb)*uFlood;          // and each kerb lamp's pool is warm on the apron and the wall
cbEmi += (cbAlb + 0.012)*vec3(1.0, 0.95, 0.84)*cbLand(vP)*(0.2 + 1.3*uDark)*0.8;          // our landing lamps on the slope
diffuseColor.rgb = cbAlb*mix(mix(1., cbShade(p), 0.75), mix(bDay, 1., uFlood), inb);
`;

const FRAG_HILL_FOG = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  { float bm0 = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b), kn = 0.6, top = 0.8;          // round thirteen: a soft knee on the paint: full brightness up to 0.6, never over 0.8 (the lowest bloom threshold of the looks is 0.86)
    float bm1 = bm0 > kn ? kn + (top - kn)*(1. - exp(-(bm0 - kn)/(top - kn))) : bm0;
    gl_FragColor.rgb *= mix(1., bm1/max(bm0, 1e-4), inb); }
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor*(1. - 0.4*inb));
#endif
`;

// alpha cards: type 0 fishbone aerials, 1 bamboo scaffold with netting, 2 neon frame on legs, 3 neon frame cantilevered, 4 lamp mast
const CARD_VDECL = 'uniform float uTime; attribute vec2 aUv; attribute vec4 aT; attribute vec3 aCc; varying vec2 vUvm; varying vec4 vT; varying vec3 vCc; varying vec3 vP; varying vec3 vN0;';
// round thirteen: a figure (type 6) paces to and fro: its card slides along (normal.x, normal.y - 1, normal.z), five metres either way at full pace
const CARD_VMAIN = 'vUvm = aUv; vT = aT; vCc = aCc; if (aT.x > 5.5) transformed += vec3(normal.x, normal.y - 1., normal.z)*(sin(uTime*0.3 + aT.y*37.)*5.); vP = transformed; vN0 = normal;';
const FRAG_CARD_FN = /* glsl */`
varying vec2 vUvm; varying vec4 vT; varying vec3 vCc;
float cbLn(float d, float lw, float pix){ return 1. - smoothstep(lw, lw + pix, abs(d)); }
float cbYagi(vec2 q, float yb, float sd, float lw, float pix){
  float bl = 0.85 + 0.5*fract(sd*7.), ox = (fract(sd*3.3) - 0.5)*0.5, x = q.x - ox, dy = q.y - yb;
  float inb = step(abs(x), bl);
  float el = mix(0.42, 0.18, clamp((x + bl)/(2.*bl), 0., 1.));
  float ex = (fract(x/0.42 + 0.5) - 0.5)*0.42;
  return inb*max(cbLn(dy, lw, pix), cbLn(ex, lw, pix)*step(abs(dy), el));
}
`;
const FRAG_CARD = /* glsl */`
vec2 q = vUvm; float cw = vT.z, ch = vT.w, ty = vT.x, sd = vT.y;
vec2 pxv = fwidth(q); float pix = max(max(pxv.x, pxv.y), 1e-3);
float lw = max(0.022, 0.5*pix); float a = 0.; vec3 col = vec3(0.15, 0.155, 0.17); vec3 cbEmi = vec3(0.); float far = 0., fs = 0.3;
if (ty < 0.5) {
  a = cbLn(q.x, lw, pix);
  a = max(a, cbYagi(q, ch*0.94, sd, lw, pix));
  a = max(a, cbYagi(q, ch*(0.7 + 0.1*fract(sd*13.)), sd + 0.37, lw, pix)*step(0.25, fract(sd*5.)));
  a = max(a, cbYagi(q, ch*(0.48 + 0.1*fract(sd*29.)), sd + 0.71, lw, pix)*step(0.6, fract(sd*11.)));
  a = max(a, cbLn(abs(q.x) - (ch*0.6 - q.y)*0.3, lw*0.5, pix)*step(q.y, ch*0.6)*step(0.72, fract(sd*3.)));
  far = 0.1*step(abs(q.x), 1.2)*step(ch*0.45, q.y) + 0.3*step(abs(q.x), pix*0.5);
} else if (ty < 1.5) {
  vec2 gq = vec2(q.x + cw*0.5, q.y);
  a = max(cbLn((fract(gq.x/1.4) - 0.5)*1.4, lw, pix), cbLn((fract(gq.y/1.75) - 0.5)*1.75, lw, pix));
  a = max(a, cbLn((fract((gq.x*1.25 + gq.y)/7.) - 0.5)*4.2, lw, pix));
  col = vec3(0.2, 0.17, 0.11)*(0.6 + 0.5*cbH21(floor(gq/vec2(1.4, 1.75))));
  float net = step(0.12, cbVn(gq*0.07 + sd*20.));
  float poles = a*(1. - smoothstep(0.2, 0.7, pix));
  vec3 nc = mix(vec3(0.2, 0.42, 0.32), vec3(0.4, 0.48, 0.58), step(0.7, fract(sd*9.)))*(0.62 + 0.38*cbVn(gq*vec2(0.5, 0.12)))*(0.85 + 0.15*sin(gq.x*1.05 + sd*40. + 0.6*sin(gq.y*0.21)));
  // round thirteen: a wrapped face is not one green slab. The net hangs in drops 5.6 m wide, each its own shade (new, sun-bleached, one in five a faded tarpaulin
  // blue-grey); one drop in four stops short of the top and the frame shows over it; a darker line every 10.5 m is a working platform
  float drop = cbH21(vec2(floor(gq.x/5.6), sd*91.));
  nc *= 0.62 + 0.7*drop;
  nc = mix(nc, vec3(0.34, 0.4, 0.44)*(0.7 + 0.5*drop), step(0.8, fract(drop*7.3)));
  nc *= 1. - 0.3*step(0.86, fract(gq.y/10.5));
  net *= step(gq.y, ch*(1. - step(0.75, fract(drop*5.1))*(0.08 + 0.3*fract(drop*11.3))));
  // where the net is torn away only the poles are left: once they are thinner than a pixel the hole lets the wall behind through (widened to stay visible they closed it into a brown disc)
  nc = mix(nc, vec3(dot(nc, vec3(0.3, 0.6, 0.1))), 0.6*uGrey);          // under the squall the nets go the way of the roofs: the board's orange is the one saturated colour
  col = mix(col, nc, net*(1. - poles*0.6)); a = max(a*0.5*(1. - smoothstep(0.16, 0.5, pix)), net);          // small holes, quiet poles: a torn net, not a stain
  // after dark the flats behind glow through the net, bay by bay
  vec2 wg = gq/vec2(2.9, 3.), wf = fract(wg);
  float wl = step(0.6, cbH21(floor(wg) + sd*31.))*smoothstep(0.0, 0.3, wf.x)*(1. - smoothstep(0.7, 1.0, wf.x))*smoothstep(0.04, 0.36, wf.y)*(1. - smoothstep(0.62, 0.96, wf.y));
  cbEmi += net*uDark*mix(vec3(1., 0.68, 0.36), vec3(0.62, 0.95, 0.82), step(0.84, cbH21(floor(wg)*1.7 + sd*13.)))*0.075*uLitGain*wl;
  far = max(0.06, net); fs = 0.9;
} else if (ty < 3.5) {
  float leg = ty < 2.5 ? 0.3 : 0.;
  vec2 pp = vec2(q.x + cw*0.5, q.y - ch*leg), ps = vec2(cw, ch*(1. - leg));
  float border = min(min(pp.x, ps.x - pp.x), min(pp.y, ps.y - pp.y));
  float inside = step(0., border);
  float grid = min(abs(fract(pp.x/1.3) - 0.5)*1.3, abs(fract(pp.y/1.3) - 0.5)*1.3);
  a = inside*max(cbLn(grid, lw*0.5, pix), cbLn(border, lw*1.6, pix));
  float hs = min(ps.x, ps.y)*0.5; vec2 c = (pp - ps*0.5)/hs; float pn = pix/hs; float tw = max(0.05, 1.3*pn);          // round thirteen: tubes never thinner than a pixel and a third (0.9: far signs broke into dots)
  float shp = fract(sd*7.7);
  float d1 = abs(max(abs(c.x)*hs*2./ps.x*1.25, abs(c.y)) - 0.72);
  float d2 = abs(abs(c.x)*0.75 + abs(c.y) - 0.7)*0.75;
  // round thirteen: no figure that can be read as a letter: the wave of one and a half periods is a band of seven or more small peaks, the double wave three bars
  float d3 = max(abs(c.y - 0.15*sin(c.x*21. + sd*20.)), abs(c.x) - 0.6);
  float d5 = max(min(abs(c.y), abs(abs(c.y) - 0.36)), abs(c.x) - 0.6);
  float d4 = abs(length(c*vec2(0.72, 1.)) - 0.5);
  // round fourteen: a board under about a dozen pixels high carries one plain figure (the ring, the diamond): the band of small peaks and the three bars broke into
  // rows of dashes there, which read as lines of writing
  { float small = smoothstep(0.1, 0.17, pn); d3 = mix(d3, d4, small); d5 = mix(d5, d2, small); }
  float dt = shp < 0.3 ? min(d1, d2) : shp < 0.55 ? min(d1, d5) : shp < 0.8 ? min(d4, d1) : min(d1, d3);
  float tube = inside*(1. - smoothstep(tw, tw + pn, dt));
  col = mix(col, mix(vec3(0.2, 0.19, 0.18), vCc*0.22 + 0.1, uNeon), tube); a = max(a, tube);          // unlit tubes are grey glass, not a dim copy of their colour
  // round thirteen: capped at its source by distance from the eye (a sign at arm's length bloomed over the frame's edge), and the board behind the tubes takes a little
  // of their light, so that from far off a sign is a small coloured shape, not a dot
  float nearN = mix(0.4, 1., smoothstep(60., 240., length(vViewPosition)));
  cbEmi = vCc*uNeon*(tube*5. + inside*0.13*(1. - tube))*nearN*(0.86 + 0.14*sin(uTime*(9. + 20.*fract(sd*3.1)) + sd*90.));
  float lg = step(q.y, ch*leg)*step(abs(q.x), cw*0.32);
  a = max(a, lg*max(cbLn(abs(q.x) - cw*0.3, lw*1.3, pix), cbLn((fract((q.y + abs(q.x))/1.6) - 0.5)*1.1, lw, pix)));
  col = mix(col, vec3(0.26, 0.26, 0.28), 0.6); far = mix(0.1, 0.35, uNeon*step(0.02, vCc.r + vCc.g + vCc.b))*inside + mix(0.3, 0.8, uNeon)*tube; fs = 0.32;
} else if (ty < 4.5) {
  a = max(cbLn(q.x, lw*1.6, pix), cbLn(q.y - ch + 0.25, lw*1.4, pix));
  a = max(a, cbLn(abs(q.x) - (ch - 0.25 - q.y)*0.9, lw, pix)*step(ch - 2., q.y));
  col = mix(vec3(0.5), vec3(0.45, 0.1, 0.06), step(0.5, fract(q.y/3.))); far = a; fs = 2.;
} else if (ty < 5.5) {
  // the airfield fence: posts, a top rail, chain link that thins to a haze, three strands of wire leaning out above
  float gx = q.x + cw*0.5;
  float post = cbLn((fract(gx/3.) - 0.5)*3., lw*1.5, pix);
  float rails = max(cbLn(q.y - (ch - 0.55), lw*1.2, pix), cbLn(q.y - 0.12, lw*1.2, pix));
  a = max(max(post, rails), 0.24*step(q.y, ch - 0.55));          // the chain link itself is never wider than a pixel from the air: a quarter coverage, dithered below
  col = vec3(0.32, 0.34, 0.35); far = a; fs = 0.04;
} else {
  // round thirteen: a figure. Head, body in its own colour, two legs that scissor while it walks (no walk, no scissor: length(vN0.xz) is its pace)
  vec2 fq = q/max(ch, 0.5); float pf = pix/max(ch, 0.5), mv = min(length(vN0.xz)*2., 1.);
  float swing = 0.12*sin(uTime*(5. + 2.*fract(sd*5.3)) + sd*40.)*mv;
  float lt = clamp((0.47 - fq.y)/0.47, 0., 1.);
  float dHead = length(fq - vec2(0.015*mv, 0.9)) - 0.078;
  float dBody = max(abs(fq.x) - (0.085 + 0.035*smoothstep(0.6, 0.8, fq.y)), abs(fq.y - 0.645) - 0.185);
  float dLeg = max(min(abs(fq.x - swing*lt - 0.04), abs(fq.x + swing*lt + 0.04)) - 0.04, max(fq.y - 0.47, -fq.y));
  float dArm = max(abs(fq.x + swing*0.9*clamp((0.8 - fq.y)/0.3, 0., 1.)) - 0.03, abs(fq.y - 0.63) - 0.17) ;
  a = 1. - smoothstep(0., pf, min(min(dHead, dBody), min(dLeg, dArm)));
  col = dHead < min(dBody, dLeg) ? vec3(0.5, 0.36, 0.27) : dLeg < dBody ? vCc*0.3 + 0.03 : vCc;
  col *= 2.;                                           // (the card's colour is halved below)
  cbEmi += col*(0.1 + 0.5*uDark)*vec3(1.0, 0.8, 0.58);          // people stand where lamps are
  far = 0.6*step(abs(fq.x), 0.2)*step(fq.y, 0.98); fs = 0.3;
}
float lk = smoothstep(fs*0.6, fs*1.7, pix);
a = mix(a, far, lk);
a = mix(a, step(cbH21(gl_FragCoord.xy), a), lk);
diffuseColor.rgb = col*0.5; diffuseColor.a = a;
cbEmi += col*(uPoolCol*cbPool(vP.xz)*0.7 + uSky*1.1 + vec3(0.22, 0.2, 0.19)*uDark);
`;

// laundry: hangs and flaps in the wind; the wash of the aircraft whips it and tears the marked pieces loose
const CLOTH_VDECL = 'attribute vec3 aC; attribute vec4 aL; attribute vec4 aD; uniform float uTime; uniform vec4 uWake; varying vec3 vP; varying vec3 vN0;';
const CLOTH_VMAIN = /* glsl */`
{
  float cw = aL.y;
  vec2 dw = uWake.xz - aC.xz; float cs = dot(dw, aD.xy); vec2 l2 = dw - aD.xy*cs;
  float reach = exp(-dot(l2, l2)/(120.*120.))*uWake.w;
  float gust = reach*smoothstep(-280., -60., cs)*(1. - smoothstep(150., 800., cs));
  float ph = aL.x*6.2832 + uTime*(2.2 + 2.*aL.w + 5.*gust);
  float sway = sin(ph + position.y*1.7)*(0.2 + 0.45*gust)*cw + cw*(0.3 + 0.9*gust);
  transformed.xz += aD.zw*sway;
  transformed.y += cw*(0.1 + 0.55*gust)*(0.5 + 0.5*sin(ph*1.3));
  float tt = (cs + 150. + 60.*aL.w)/75.;
  float loose = aL.z*step(0., tt)*step(0.3, reach);
  vec3 rel = transformed - aC;
  float ang = tt*(4. + 5.*aL.w);
  float ca = cos(ang), sa = sin(ang);
  vec3 side = vec3(aD.z, 0., aD.w);
  float rs = dot(rel, side), ry = rel.y;
  vec3 tum = rel + side*((rs*ca - ry*sa) - rs) + vec3(0., (rs*sa + ry*ca) - ry, 0.);
  float tc = max(tt, 0.);
  vec3 fly = vec3(aD.x, 0., aD.y)*(34.*(1. - exp(-tc*0.8))) + side*(9.*sin(aL.x*40.)*tc) + vec3(0., 30.*(1. - exp(-tc*0.7)) - 1.6*tc*tc*0.5 + 2.*sin(tc*3. + aL.x*9.), 0.);
  transformed = mix(transformed, aC + tum*(1. - smoothstep(6., 9., tc)) + fly, loose);
  vP = transformed; vN0 = normal;
}
`;

const HOURS = {
  // fill: the glow of the horizon the open airfield takes under a low sun [colour, strength]; farE: the averaged window light of walls too far away to show a bay;
  // near: gain of the windows close enough to show their panes; roof: roof albedo. Both stay at 1 after dark, and farE at its default 0.1: the third round lowered them
  // (and widened the single-window range to 2.6 px a bay) and the night city went from a warm glow to cream-and-black static on dark walls.
  storm: { lit: 0.1, gain: 1.8, neon: 0, board: [1, 0.86, 0.1], shaft: 1, pool: '#ffd9a8', poolI: 2.2, sky: '#8d98a3', hz: '#98a3aa', head: 0.3, strobe: 1, shade: 0.6, drift: 1.5, grey: 1 },
  golden: { lit: 0.3, gain: 2.8, neon: 0, shaft: 1.15, pool: '#ffb86e', poolI: 2.6, sky: '#b9a48e', hz: '#d6ab80', head: 0.6, strobe: 1, shade: 0.46, fill: ['#d6ab80', 0.16] },
  dawn: { lit: 0.24, gain: 2.6, neon: 0, shaft: 0.8, pool: '#ffb690', poolI: 2.3, sky: '#8f9cbe', hz: '#dcaa9a', head: 0.7, strobe: 1, shade: 0.3, fill: ['#dcaa9a', 0.36] },
  // after sunset nothing falls from the sky: pool 0 becomes the floodlighting of the checkerboard (dark: 1), the drifting pools and the beams go out
  // (gain 3.0 / 3.2 with the full near gain and bloom is the luminous city of the second round: lower than that and the windows stop blooming and the walls go black)
  dusk: { lit: 0.42, gain: 3.0, neon: 1, boardL: [0.62, 0.58, 0.5], shaft: 0.8, pool: '#ffb070', poolI: 1.6, sky: '#3b4763', hz: '#b5633f', head: 1.6, strobe: 1.3, dark: 1, pudR: 0.3, fill: ['#b5633f', 0.55] },
  night: { lit: 0.44, gain: 3.2, neon: 1, boardL: [0.7, 0.66, 0.57], shaft: 0.8, pool: '#ffd0a0', poolI: 1.3, sky: '#10182a', hz: '#171f36', head: 2, strobe: 1.5, dark: 1, pudR: 0.45, fill: ['#2c3656', 0.7] },
};
const NEON = ['#ff2a55', '#19e0b0', '#ffb020', '#3aa0ff', '#ff5ad0', '#e8f04a', '#ff5a20'];
const LAUNDRY = ['#e9e6dc', '#e9e6dc', '#dcdad2', '#9db7d6', '#d98a8a', '#c8433a', '#e0c35a', '#2f3f63', '#7fae9a', '#f0f0ee'];
const TIN = ['#7a4a35', '#7d9a86', '#5f7f95', '#8d9296', '#b9ae8f', '#4a4d50', '#8a5a40', '#6d7f6a'];
const TANKS = ['#9aa0a2', '#6f8794', '#8a4a3a', '#bdb9ae', '#7e8a80'];
const ROOFS = ['#77756f', '#7a4636', '#4f6b55', '#8a8f92', '#3c3c3f', '#6d675c'];

export async function buildHero(ctx, opts = {}) {
  const rng0 = ctx.rng;
  const R = { city: rng0.fork('city'), roof: rng0.fork('roof'), hill: rng0.fork('hill'), air: rng0.fork('air'), life: rng0.fork('life'), look: rng0.fork('look') };
  // the parks, the market, the street lamps and the airfield's furniture draw from a stream of their own, so the city is the same city it was before they came
  const RX = ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('cb-polish:' + (ctx.seed ?? 0))) : rng0.fork('polish');
  const hash2 = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const ownRng = (name) => (ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed(name + ':' + (ctx.seed ?? 0))) : rng0.fork(name));          // round thirteen: every new thing draws from a stream of its own
  // round fourteen: nothing in the city is generated and taken back, and nothing is drawn and then dropped. Every block of the street grid draws from three streams of
  // its own made from the world's seed and the block's place in the grid (its walls and slabs, its roof life, its signs), so a block that is given to a landmark simply
  // draws nothing and no block's deal depends on another's. R.city and R.roof (the forks above) are the walled city's. A roof that is a place of its own (a yard, a
  // garden, a works roof) and the people on the others draw from a stream made from the seed and the roof's own corner.
  const WALLED = { city: R.city, roof: R.roof, sign: ownRng('cb-sign:walled') };
  const blockStreams = (name) => { R.city = ownRng('cb-city:' + name); R.roof = ownRng('cb-roof:' + name); R.sign = ownRng('cb-sign:' + name); };
  const placeRng = (name, x, z) => ownRng(name + ':' + Math.round(x * 10) + ':' + Math.round(z * 10));
  const noise = ctx.noise, Y = () => ctx.yield();
  const detail = ctx.quality?.detail ?? 1;
  const density = Math.min(1.3, Math.max(0.6, opts.density ?? ctx.vary?.density ?? 1));
  const pal = DEFAULT_PALETTE.map((c, i) => new THREE.Color(opts.palette?.[i] ?? c));
  const dbg = opts.debug || null;          // viewer aid only: a Map-like { get(k) } of heroView / heroU / heroHour; the world never passes it
  const hk = HOURS[opts.hour] ? opts.hour : HOURS[dbg?.get('heroHour')] ? dbg.get('heroHour') : 'storm', HR = HOURS[hk];
  const look = { lit: HR.lit, neon: opts.neon ?? HR.neon, wet: opts.wet ?? 0.8, shaft: opts.shaft ?? HR.shaft, strobe: HR.strobe };
  const sunDir = new THREE.Vector3(...(opts.sunDir || [-0.80, 0.42, -0.42])).normalize();
  const poolBase = new THREE.Color(HR.pool).multiplyScalar(HR.poolI);
  const col = (h) => new THREE.Color(h);
  const tin = TIN.map(col), tanks = TANKS.map(col), roofs = ROOFS.map(col), laundry = LAUNDRY.map(col), neons = NEON.map(col);
  roofs[1] = pal[8].clone(); tin[2] = pal[9].clone(); tanks[1] = pal[9].clone();

  const U = {
    uTime: { value: 0 }, uLit: { value: look.lit }, uLitGain: { value: HR.gain }, uWet: { value: look.wet }, uNeon: { value: look.neon }, uHead: { value: HR.head },
    uFarE: { value: HR.farE ?? 0.1 }, uNearE: { value: HR.near ?? 1 }, uRoofK: { value: HR.roof ?? 1 }, uFill: { value: new THREE.Color(HR.fill ? HR.fill[0] : '#000000').multiplyScalar(HR.fill ? HR.fill[1] : 0) },
    uDark: { value: HR.dark || 0 }, uFlood: { value: HR.dark || 0 }, uPudR: { value: HR.pudR ?? 0.05 }, uShade: { value: HR.shade || 0 }, uGrey: { value: HR.grey || 0 }, uBoardK: { value: new THREE.Vector3(...(HR.board || [1, 1, 0.1])) }, uBoardL: { value: new THREE.Color(...(HR.boardL || [0, 0, 0])) }, uBeam: { value: HR.dark ? 0 : 1 },
    uSky: { value: new THREE.Color(HR.sky) }, uHz: { value: new THREE.Color(HR.hz || HR.sky) }, uPoolCol: { value: poolBase.clone().multiplyScalar(look.shaft) }, uSunDir: { value: sunDir },
    uPool: { value: [new THREE.Vector4(0, 0, 150, 1), new THREE.Vector4(0, 0, 200, 0.7), new THREE.Vector4(0, 0, 240, 0.6)] },
    uChain: { value: new THREE.Vector2(30, 0) }, uWake: { value: new THREE.Vector4(0, 0, 0, 1) }, uLand: { value: new THREE.Vector4(0, 1, 0, 1) },
    uHill: { value: new THREE.Vector4(HILL_C[0], HILL_C[1], HH[0], HH[1]) },
    uBoard: { value: new THREE.Vector3(BOARD.a, BOARD.half, Math.cos(Math.atan(BOARD.slope)) * BOARD.half) },
    // the look's sun in the board's own axes (across it toward +b, down its slope, along its normal): where the kerbs' and the berms' shadows lie on the paint by day
    uBSun: { value: (() => { const T = Math.atan(BOARD.slope), cT = Math.cos(T), sT = Math.sin(T), sa = -(sunDir.x * HH[0] + sunDir.z * HH[1]); return new THREE.Vector3(sunDir.x * HH[1] - sunDir.z * HH[0], sa * cT - sunDir.y * sT, sa * sT + sunDir.y * cT); })() },
    uCreep: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, 0)) },          // where scrub and creeper come over the board's kerb: [b / half, along / half, metres of reach, 0], filled below
    uScrub: { value: pal[7].clone().lerp(new THREE.Color('#6a6a2c'), R.look.range(0, 0.45)) }, uChkA: { value: pal[5] }, uChkB: { value: pal[6] },
    uBandPh: { value: ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('cb-band:' + (ctx.seed ?? 0)))() : 0.41 },          // round thirteen: where the band of light that climbs the beacon tower stands when the world starts: a draw of its own
    uStrobe: { value: look.strobe }, uLamp: { value: 1 }, uPortal: { value: new THREE.Color(0.75, 0.86, 1) }, uRes: { value: new THREE.Vector2(1280, 720) },
  };
  await Y();
  const patch = (mat, key, o) => {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + o.vdecl).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + o.vmain);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_COMMON + (o.fdecl || ''))
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + o.fcol)
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp(cbRough, 0.04, 1.0);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += cbEmi;')
        // a mirror-smooth pane or puddle catching a low sun at a grazing angle can return hundreds of times white in one pixel: cap it
        // (12 is above every lamp, window and pool here, and low enough that a one-pixel glint does not flicker under bloom)
        .replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, vec3(12.));\n#include <opaque_fragment>');
      if (o.fog) sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', o.fog);
    };
    mat.customProgramCacheKey = () => 'cb-approach-' + key;
    return mat;
  };
  const PLAIN_V = 'varying vec3 vP; varying vec3 vN0;', PLAIN_M = 'vP = position; vN0 = normal;';
  const mFacade = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), 'facade', { vdecl: VERT_DECL, vmain: VERT_MAIN, fdecl: 'varying vec4 vF; varying vec2 vG;', fcol: FRAG_FACADE });
  const mGround = patch(new THREE.MeshStandardMaterial({ roughness: 0.9 }), 'ground', { vdecl: PLAIN_V, vmain: PLAIN_M, fdecl: FRAG_STREET_FN, fcol: FRAG_GROUND });
  const mField = patch(new THREE.MeshStandardMaterial({ roughness: 0.9 }), 'field', { vdecl: PLAIN_V, vmain: PLAIN_M, fdecl: 'uniform vec2 uChain; uniform float uStrobe;', fcol: FRAG_AIRFIELD });
  await Y();
  const mHill = patch(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'hill', { vdecl: PLAIN_V, vmain: PLAIN_M, fdecl: FRAG_HILL_DECL, fcol: FRAG_HILL, fog: FRAG_HILL_FOG });
  const mCard = patch(new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.4, alphaToCoverage: true }), 'card', { vdecl: CARD_VDECL, vmain: CARD_VMAIN, fdecl: FRAG_CARD_FN, fcol: FRAG_CARD });
  const mCloth = patch(new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true }), 'cloth', { vdecl: CLOTH_VDECL, vmain: CLOTH_VMAIN, fcol: `vec3 cbEmi = diffuseColor.rgb*(uPoolCol*cbPool(vP.xz)*0.8 + uSky*0.6 + vec3(1.0, 0.8, 0.56)*0.5*uDark*step(11., vP.y)*(1. - smoothstep(${(SKIM - 6).toFixed(1)}, ${(SKIM + 2).toFixed(1)}, cbRoute(vP.xz))) + vec3(1.0, 0.95, 0.84)*cbLand(vP)*(0.2 + 1.3*uDark)*0.8);` });          // (washing on a roof under the approach line hangs in the light of that roof's bulbs)

  await Y();
  const hillH = makeHillFn(noise);
  const XQ = 7600, XC = 2300, XL = 2500;          // room above the old caps (quads of solids, cards, cloth) for the roofs under the approach and the village: the caps are lifted where those are built, so nothing older is squeezed or let through
  const G = new Geo(63400 + XQ); G.max -= XQ * 4;            // 52000 before the parks, the market, the street lamps and the airfield's huts (about 2500 quads between them)
  const cards = new Bag(Math.round(8500 * Math.max(0.6, detail)) + 1540 + XC, { position: 3, normal: 3, aUv: 2, aT: 4, aCc: 3 });
  const cloth = new Bag(Math.round(8000 * Math.max(0.6, detail)) + 2600 + XL, { position: 3, normal: 3, aC: 3, aL: 4, aD: 4, color: 3 });
  cards.max -= XC; cloth.max -= XL;
  const slabTops = [];         // every slab's top roof: [x0, x1, z0, z1, height, kind of roof, the block's place on the approach, walled city]
  const lamps = [];            // [x, y, z, r, g, b, size, type, phase, minPx]
  const pathRoofs = [], anchorsStrobes = [], boardMasts = [], terraceHuts = [], creeperPts = [];
  const laneB = (a) => 78 + 22 * Math.sin(a * 0.021 + 1.0);          // round thirteen: the squatters' lane on the hill's flank, in the hill's own (a, b); the hill's ground shader draws the same line
  const flockSites = [];       // rooftops near the turn and the final where pigeons live
  const WIND = [0.6, 0.8];
  const BLACK = new THREE.Color(0, 0, 0);

  // one alpha card standing at (x, y, z), width w along (dx, dz), height h
  const card = (x, y, z, dx, dz, w, h, type, seed, cc) => {
    if (cards.full) return;
    const hx = dx * w * 0.5, hz = dz * w * 0.5, c = cc || BLACK;
    cards.put('position', 0, x - hx, y, z - hz); cards.put('position', 1, x + hx, y, z + hz); cards.put('position', 2, x + hx, y + h, z + hz); cards.put('position', 3, x - hx, y + h, z - hz);
    cards.put('aUv', 0, -w / 2, 0); cards.put('aUv', 1, w / 2, 0); cards.put('aUv', 2, w / 2, h); cards.put('aUv', 3, -w / 2, h);
    cards.all('normal', 0, 1, 0); cards.all('aT', type, seed, w, h); cards.all('aCc', c.r, c.g, c.b); cards.next();
  };
  // round thirteen: a figure 1.1 m wide standing at (x, y, z), walking to and fro along (dx, dz) (pace 0..1 = up to five metres either way; slope = rise per metre along it)
  const figure = (x, y, z, dx, dz, seed, cc, hgt = 1.75, pace = 1, slope = 0) => {
    if (cards.full) return;
    const l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
    card(x, y, z, ux, uz, 1.1, hgt, 6, seed, cc);
    const o = (cards.nq - 1) * 12, n = cards.a.normal;
    for (let c = 0; c < 4; c++) { n[o + c * 3] = ux * pace; n[o + c * 3 + 1] = 1 + slope * pace; n[o + c * 3 + 2] = uz * pace; }
  };
  // one piece of washing hanging from (x, y, z), width w along (dx, dz), drop h
  const washing = (x, y, z, dx, dz, w, h, tx, tz, loose, r, halves = 2) => {
    if (cloth.full) return;
    let nx = -dz, nz = dx; if (nx * WIND[0] + nz * WIND[1] < 0) { nx = -nx; nz = -nz; }
    const c = r.pick(laundry), ph = r(), sd = r(), hx = dx * w * 0.5, hz = dz * w * 0.5, v = 0.62 + 0.25 * r();
    for (let half = 0; half < halves; half++) {
      const ya = y - h / halves * half, yb = ya - h / halves, wa = half / halves, wb = wa + 1 / halves;
      cloth.put('position', 0, x - hx, ya, z - hz); cloth.put('position', 1, x + hx, ya, z + hz); cloth.put('position', 2, x + hx, yb, z + hz); cloth.put('position', 3, x - hx, yb, z - hz);
      cloth.put('aL', 0, ph, wa, loose, sd); cloth.put('aL', 1, ph, wa, loose, sd); cloth.put('aL', 2, ph, wb, loose, sd); cloth.put('aL', 3, ph, wb, loose, sd);
      cloth.all('normal', nx * 0.5, 0.86, nz * 0.5); cloth.all('aC', x, y, z); cloth.all('aD', tx, tz, nx, nz); cloth.all('color', c.r * v, c.g * v, c.b * v); cloth.next();
    }
  };

  await Y();
  // ---------- round nine: the beacon tower ----------
  // Built first (the solids' buffer has hard caps, and the landmark is the last thing that may be dropped). It draws from no random stream.
  const towersBuilt = [];
  {
    const stoneC = new THREE.Color('#9a6c3c'), capC = new THREE.Color('#3a332c');
    const tier = (hw, hd, y0, y1, part) => {
      const x0 = LM[0] - hw, x1 = LM[0] + hw, z0 = LM[1] - hd, z1 = LM[1] + hd;
      G.vOff = y0;
      G.wall(x0, z1, x1, z1, y0, y1, y1, 0, 1, stoneC, part, 10, 0, 0); G.wall(x1, z1, x1, z0, y0, y1, y1, 1, 0, stoneC, part + 0.01, 10, 0, 0);          // the faces that look across the avenue carry a seed 0.01 higher: the shader washes them less (a lit front and a flank)
      G.wall(x1, z0, x0, z0, y0, y1, y1, 0, -1, stoneC, part, 10, 0, 0); G.wall(x0, z0, x0, z1, y0, y1, y1, -1, 0, stoneC, part + 0.01, 10, 0, 0);
      G.vOff = 0;
      G.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], capC, 2, 0.3);
      return [x0, x1, z0, z1];
    };
    // uplights at the corners and the middle of each face of a setback: the glow of the lamps that wash the tier above
    const uplights = (hw, hd, y, size) => { for (const [fx, fz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [1, 0], [0, 1], [-1, 0]]) lamps.push([LM[0] + fx * (hw + 1.2), y + 1.2, LM[1] + fz * (hd + 1.2), 1, 0.66, 0.3, size, 3, (fx + 2) * 0.13 + (fz + 2) * 0.29, 1.9]); };
    tier(22, 16, 0, 14, 0.1);                       // the podium fills the block
    tier(15, 15, 14, 116, 0.1); uplights(15, 15, 14, 1.6);
    tier(11.5, 11.5, 116, 173.5, 0.5); uplights(11.5, 11.5, 116, 1.4);          // the crown: five storeys of tall lit windows
    tier(7.5, 7.5, 173.5, 206, 0.1); uplights(7.5, 7.5, 173.5, 1.2);
    tier(5, 5, 206, 220, 0.9);                      // the lantern
    tier(6.3, 6.3, 220, 222, 0.1);
    // round thirteen: the passing wall is a building, and the top has a shape. Corner buttresses up the shaft, a cornice under every setback, turrets and finials on the
    // setbacks' corners (a stepped crown against the sky), stacks of caged balconies on the faces that look over the avenue, a glass lift shaft with a lit car that rides
    // it (facade kind 10, seed 0.21), a railed gallery round the lantern. Solid stone is seed 0.26 (0.27 on the avenue's flanks). No random draw.
    const stoneBox = (x0, x1, z0, z1, y0, y1) => {
      G.vOff = y0;
      G.wall(x0, z1, x1, z1, y0, y1, y1, 0, 1, stoneC, 0.26, 10, 0, 0); G.wall(x1, z1, x1, z0, y0, y1, y1, 1, 0, stoneC, 0.27, 10, 0, 0);
      G.wall(x1, z0, x0, z0, y0, y1, y1, 0, -1, stoneC, 0.26, 10, 0, 0); G.wall(x0, z0, x0, z1, y0, y1, y1, -1, 0, stoneC, 0.27, 10, 0, 0);
      G.vOff = 0;
      G.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], capC, 2, 0.3);
    };
    const redLamp = (x, y, z, ph) => lamps.push([x, y, z, 1, 0.07, 0.03, 0.9, 2, ph, 1.6]);
    for (const [fx, fz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = LM[0] + fx * 15, cz = LM[1] + fz * 15;
      stoneBox(cx - 2.6, cx + 2.6, cz - 2.6, cz + 2.6, 0, 121);                                          // the buttress, and its head a turret over the first setback
      const dx = LM[0] + fx * 9.8, dz = LM[1] + fz * 9.8; stoneBox(dx - 1.7, dx + 1.7, dz - 1.7, dz + 1.7, 173.5, 180.5);
      const ex = LM[0] + fx * 6.5, ez = LM[1] + fz * 6.5; stoneBox(ex - 1.0, ex + 1.0, ez - 1.0, ez + 1.0, 206, 211); redLamp(ex, 211.8, ez, 0.2 + fx * 0.17 + fz * 0.31);
    }
    for (const [hw, y] of [[15, 116], [11.5, 173.5], [7.5, 206]]) stoneBox(LM[0] - hw - 1.1, LM[0] + hw + 1.1, LM[1] - hw - 1.1, LM[1] + hw + 1.1, y - 1.6, y);          // the cornices
    { const bc = stoneC.clone().multiplyScalar(0.8), bt = stoneC.clone().multiplyScalar(0.5), xa = LM[0] - 15, za = LM[1] - 15;
      for (const o of [-8.4, 3.0]) {
        G.box(xa - 1.15, xa, LM[1] + o, LM[1] + o + 5.6, 17.6, 110.6, bc, bt, 0.37 + o * 0.01, 3, 2);          // on the avenue's face
        G.box(LM[0] + o, LM[0] + o + 5.6, za - 1.15, za, 17.6, 110.6, bc, bt, 0.61 + o * 0.01, 3, 2);          // on the face that looks up the avenue
      }
      // the lift shaft, on the avenue's face beside the corner that looks up the avenue
      const lx0 = xa - 1.5, lz0 = LM[1] - 11.6, lz1 = lz0 + 4.4;
      G.vOff = 14;
      G.wall(lx0, lz0, lx0, lz1, 14, 114.4, 114.4, -1, 0, stoneC, 0.21, 10, 0, 0); G.wall(xa, lz0, lx0, lz0, 14, 114.4, 114.4, 0, -1, stoneC, 0.21, 10, 0, 0); G.wall(lx0, lz1, xa, lz1, 14, 114.4, 114.4, 0, 1, stoneC, 0.21, 10, 0, 0);
      G.vOff = 0;
      G.quad([lx0, 114.4, lz1], [xa, 114.4, lz1], [xa, 114.4, lz0], [lx0, 114.4, lz0], capC, 2, 0.3); }
    for (const [dx, dz] of [[1, 0], [0, 1]]) for (const s of [-1, 1]) card(LM[0] + (dx ? 0 : s * 7.4), 206, LM[1] + (dz ? 0 : s * 7.4), dx, dz, 14.8, 1.5, 5, 0.5);          // the gallery's rail
    // the mast: two crossed lattice cards in obstacle bands, red lamps up it, the beacon's own glow in the lantern
    card(LM[0], 222, LM[1], 1, 0, 5.5, LM_MAST, 4, 0.43); card(LM[0], 222, LM[1], 0, 1, 5.5, LM_MAST, 4, 0.47);
    lamps.push([LM[0], 222.6 + LM_MAST, LM[1], 1, 0.07, 0.03, 2.8, 2, 0.1, 3.2], [LM[0], 222 + LM_MAST * 0.5, LM[1], 1, 0.07, 0.03, 1.7, 2, 0.6, 2.2]);
    for (const [fx, fz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lamps.push([LM[0] + fx * 11.5, 174.7, LM[1] + fz * 11.5, 1, 0.07, 0.03, 1.2, 2, 0.3 + fx * 0.1 + fz * 0.2, 1.9], [LM[0] + fx * 15, 117.2, LM[1] + fz * 15, 1, 0.07, 0.03, 1.2, 2, 0.8 + fx * 0.1 - fz * 0.2, 1.9]);
    lamps.push([LM[0], LM_LAMP_Y, LM[1], 1, 0.76, 0.4, 6.5, 3, 0.37, 5]);
  }
  await Y();
  // ---------- the tenement carpet ----------
  const wts = [1.2, R.look.range(0.3, 1.6), R.look.range(0.3, 1.6), R.look.range(0.3, 1.6), R.look.range(0.3, 1.4)];
  const wsum = wts.reduce((a, b) => a + b, 0);
  const plaster = (r) => {
    let t = r() * wsum, i = 0; while (i < 4 && t > wts[i]) { t -= wts[i]; i++; }
    const c = pal[i].clone().lerp(pal[0], r.range(0.05, 0.55)); const v = r.range(0.9, 1.3);
    c.r *= v; c.g *= v; c.b *= v; return c;
  };
  const washDay = R.look.range(0.6, 1.15), aerialK = R.look.range(0.75, 1.3), shackK = R.look.range(0.6, 1.4), neonK = R.look.range(0.6, 1.5);
  const S_TURN = nearFly(TURN_C[0] + TURN_R * Math.cos(TURN_A0 * 0.75), TURN_C[1] + TURN_R * Math.sin(TURN_A0 * 0.75)).s, S_FIN = nearFly(0, -620).s;
  const S_ARC0 = nearFly(ARC_S[0], ARC_S[1]).s;            // where the first straight ends and the turn begins
  const S_BOARD = nearFly(BOARD_AT[0], BOARD_AT[1]).s;      // where the board is abeam: the pigeons live on the roofs past the hill

  // round thirteen: in the quarter the turn is flown over (south of z -1100) the neon is gathered into streets: every third cross street and every other avenue (which
  // ones: a stream of their own), and the avenue the final runs down. A sign elsewhere in that quarter stands three times in ten; the faces on a neon street carry
  // more and larger ones, and frames stand along its roof edges. Seen from the turn the signs draw lines of light between dark blocks. No lettering, as everywhere.
  const neonR = ownRng('cb-neon'), NEON_ROW = neonR.int(0, 2), NEON_COL = neonR.int(0, 1);
  const onNeonStreet = (x, z) => {          // 0: none; 1: a cross street (it runs east and west); 2: an avenue
    const jz = (ROW0 - BLOCK_Z - 7 - z) / PITCH_Z, j = Math.round(jz);
    if (Math.abs(jz - j) * PITCH_Z < 12.5 && ((j % 3) + 3) % 3 === NEON_ROW) return 1;
    const ax = Math.abs(x); if (ax < 14) return 2;
    const kx = (ax - (AVE + BLOCK_X + 8)) / PITCH_X, k = Math.round(kx);
    return Math.abs(kx - k) * PITCH_X < 10.5 && (k & 1) === NEON_COL ? 2 : 0;
  };
  const neonKeep = (x, z) => z > -1100 || onNeonStreet(x, z) > 0 || hash2(x * 0.71 + 3.3, z * 0.37 + 9.1) < 0.3;
  // (round fourteen: neonKeep is asked about the PLACE a sign would hang, the roof's edge or the street face, before anything is drawn for it; signs draw from R.sign)
  // roof life for one slab: clo 0..1 is how close the approach passes
  const dressRoof = (x0, x1, z0, z1, H, clo, nf, wc) => {
    const r = R.roof, w = x1 - x0, d = z1 - z0, k = clo * density;
    if (w < 5 || d < 5) return;
    const rx = (m) => r.range(x0 + m, x1 - m), rz = (m) => r.range(z0 + m, z1 - m);
    let topY = H;
    if (r.chance(0.85)) {
      const bw = Math.min(w - 2, r.range(3, 4.6)), bd = Math.min(d - 2, r.range(4, 6.5)), bx = r.range(x0 + 0.8, x1 - 0.8 - bw), bz = r.chance(0.5) ? z0 + 0.8 : z1 - 0.8 - bd, bh = r.range(2.6, 3.6);
      const bc = pal[0].clone().multiplyScalar(r.range(0.55, 0.95));
      G.box(bx, bx + bw, bz, bz + bd, H, H + bh, bc, r.pick(roofs), r(), 2, 2);
      topY = H + bh;
      if (r.chance(0.4)) G.tank(bx + bw / 2, bz + bd / 2, Math.min(bw, bd) * 0.4, topY, topY + r.range(1.4, 2.2), r.pick(tanks), tanks[0], r());
    }
    const nt = Math.round(r.range(0, 1.8) * k + (wc ? 0.3 : 0));
    for (let i = 0; i < nt; i++) { const tr = r.range(0.9, 1.6), tx = rx(2), tz = rz(2), ty = H + (r.chance(0.5) ? 0.9 : 0); G.tank(tx, tz, tr, ty, ty + r.range(1.6, 2.6), r.pick(tanks), r.pick(tanks), r()); }
    const village = r.chance(0.18) ? 2.6 : 1;
    const ns = Math.round(r.range(0, 3.4) * k * shackK * village);
    for (let i = 0; i < ns; i++) {
      const sw = r.range(2.6, 6), sd = r.range(2.4, 4.6), sx = r.range(x0 + 0.6, Math.max(x0 + 0.7, x1 - 0.6 - sw)), sz = r.range(z0 + 0.6, Math.max(z0 + 0.7, z1 - 0.6 - sd));
      const c = r.pick(tin).clone().multiplyScalar(r.range(0.7, 1.15)), ct = r.pick(tin).clone().multiplyScalar(r.range(0.7, 1.2));
      G.box(sx, Math.min(x1 - 0.3, sx + sw), sz, Math.min(z1 - 0.3, sz + sd), H, H + r.range(2.1, 2.8), c, ct, r(), 2, 2, r.range(-0.6, 0.6));
    }
    if (r.chance(0.3 * k)) { const gx = rx(3), gz = rz(3); G.box(gx - r.range(1, 3), gx + r.range(1, 3), gz - 0.8, gz + 0.8, H, H + r.range(0.7, 1.6), pal[7].clone().multiplyScalar(r.range(0.7, 1.4)), pal[7].clone().multiplyScalar(r.range(0.9, 1.6)), r(), 4, 4); }
    const na = Math.round(r.range(2, 9) * (0.25 + 0.75 * clo) * density * aerialK * detail * (wc ? 1.5 : 1) * Math.min(1.6, w * d / 500));
    for (let i = 0; i < na; i++) { const a = r.int(0, 3) * 0.785 + r.range(-0.2, 0.2), ah = r.range(3.2, 7.5); card(rx(0.8), r.chance(0.2) ? topY : H, rz(0.8), Math.cos(a), Math.sin(a), 2.8, ah, 0, r()); }
    if (clo > 0.15 && r.chance(0.45 * k * washDay)) {
      const nl = r.int(1, 2);
      for (let l = 0; l < nl; l++) {
        const alongX = w > d ? r.chance(0.7) : r.chance(0.3), len = Math.min((alongX ? w : d) - 2.5, r.range(5, 11)), lx = rx(alongX ? len / 2 + 1 : 1.5), lz = rz(alongX ? 1.5 : len / 2 + 1), n = Math.max(2, Math.floor(len / 1.45));
        const inWash = nf.d < 170 && nf.s > S_TURN && nf.s < S_FIN;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n - 0.5, sag = 0.35 * (1 - 4 * t * t);
          washing(lx + (alongX ? t * len : 0), H + 2.25 - sag, lz + (alongX ? 0 : t * len), alongX ? 1 : 0, alongX ? 0 : 1, r.range(0.6, 1.05), r.range(0.7, 1.5), nf.tx, nf.tz, inWash && r.chance(0.4) ? 1 : 0, r);
        }
      }
    }
    // A frame on the roof's edge. Where it may stand is decided first, from the place alone: not on a roof within 50 m of the approach line where the line is less than
    // 40 m over the tallest frame's top (10.5 m: the obstacle rules of any airfield), and in the quarter under the turn only on an edge that neonKeep allows.
    if (w > 9 && !(nf.d < 50 && nf.y - (H + 10.5) < 40)) {
      const sx = (x0 + x1) / 2, edges = [z0 + 0.7, z1 - 0.7].filter((ez) => neonKeep(sx, ez)), s = R.sign;
      if (edges.length && s.chance(0.075 * neonK * (0.4 + clo))) {
        const fw = Math.min(w - 1.5, s.range(8, 16)), fh = s.range(6.5, 10.5), onZ = s.pick(edges);
        // round eleven: a roof sign that stands as high as the approach passes, close beside it, faces the lens flat-on at arm's length and blooms red over the frame's edge:
        // it burns at two fifths (a rule in space: by its height against the line's and its distance from it)
        const sgk = 1 - 0.6 * sstep(nf.y - 30, nf.y - 5, H + fh) * (1 - sstep(110, 260, nf.d)), sgSeed = s();
        card(sx, H, onZ, 1, 0, fw, fh, 2, sgSeed, s.pick(neons).clone().multiplyScalar(sgk));
      }
    }
  };
  // what hangs off the street faces of a slab close to the approach: caged balcony stacks, washing on poles,
  // neon frames reaching over the street, now and then a face wrapped in bamboo scaffolding
  const facadeLife = (x0, x1, z0, z1, H, c, clo, nf, xFace) => {
    const r = R.roof, s = R.sign, w = x1 - x0, storeys = Math.floor((H - 4.6) / 3), mx = (x0 + x1) / 2;
    if (storeys < 3 || w < 8) return;
    const cs = c.clone().multiplyScalar(0.82), ct = c.clone().multiplyScalar(0.55);
    for (let f = 0; f < 2; f++) {
      const zf = f ? z1 : z0, out = f ? 1 : -1;
      const nb = r.int(0, 1);
      for (let i = 0; i < nb; i++) { const sw = r.pick([2.8, 3.5, 5.6]), sx = r.range(x0 + 0.6, x1 - 0.6 - sw), top = 4.6 + 3 * (storeys - r.int(0, 2)); G.box(sx, sx + sw, Math.min(zf, zf + out * 1.1), Math.max(zf, zf + out * 1.1), 4.6, top, cs, ct, r(), 3, 2); }
      const np = Math.round(r.range(0, 2) * clo * density * washDay);
      for (let i = 0; i < np; i++) {
        const px = r.range(x0 + 1, x1 - 1), py = 4.6 + 3 * r.int(1, storeys - 1) + 1.1, n = 2;
        for (let j = 0; j < n; j++) washing(px, py, zf + out * (0.8 + j * 0.95), 0, 1, 0.85, r.range(0.7, 1.3), nf.tx, nf.tz, 0, r, 1);
      }
      if (neonKeep(mx, zf + out * 3) && s.chance(0.3 * neonK * clo)) { const fw = s.range(4, 6.5), px = s.range(x0 + 1, x1 - 1), py = s.range(7, Math.min(H - 5, 26)), fh = s.range(2.4, 4.2), sd = s(); card(px, py, zf + out * (fw / 2 + 0.3), 0, 1, fw, fh, 3, sd, s.pick(neons)); }
      if (zf < -1100 && onNeonStreet(mx, zf + out * 3) === 1) {          // a neon street: two to four more, larger, at every height
        const n = 2 + Math.floor(s() * 3);
        for (let i = 0; i < n; i++) { const fw = s.range(4.5, 8), fh = s.range(2.6, 5.4), px = s.range(x0 + 1, x1 - 1), py = s.range(6, Math.max(7, Math.min(H - 4, 34))), sd = s(), cc = s.pick(neons); card(px, py, zf + out * (fw / 2 + 0.3), 0, 1, fw, fh, 3, sd, cc); }
      }
      if (r.chance(0.035)) card((x0 + x1) / 2, 0, zf + out * 1.4, 1, 0, w + 1.5, H + 1.8, 1, r());
    }
    if (xFace) {
      const xf = xFace > 0 ? x1 : x0, out = xFace, d = z1 - z0;
      if (neonKeep(xf + out * 4, (z0 + z1) / 2)) {
        const nn = s.int(1, 3);
        for (let i = 0; i < nn; i++) { const fw = s.range(5, 8.5), py = s.range(7, Math.min(H - 5, 30)), pz = s.range(z0 + 1, z1 - 1), fh = s.range(2.6, 4.6), sd = s(); card(xf + out * (fw / 2 + 0.3), py, pz, 1, 0, fw, fh, 3, sd, s.pick(neons)); }
      }
      if (z1 < -1100 && onNeonStreet(xf + out * 4, (z0 + z1) / 2) === 2) {
        const n = 2 + Math.floor(s() * 3);
        for (let i = 0; i < n; i++) { const fw = s.range(5, 8.5), fh = s.range(2.8, 5.6), pz = s.range(z0 + 1, z1 - 1), py = s.range(6, Math.max(7, Math.min(H - 4, 34))), sd = s(), cc = s.pick(neons); card(xf + out * (fw / 2 + 0.3), py, pz, 1, 0, fw, fh, 3, sd, cc); }
      }
      const nb = r.int(1, 3);
      for (let i = 0; i < nb; i++) { const sw = r.pick([2.8, 3.5, 5.6]), sz = r.range(z0 + 0.6, z1 - 0.6 - sw); G.box(Math.min(xf, xf + out * 1.1), Math.max(xf, xf + out * 1.1), sz, sz + sw, 4.6, 4.6 + 3 * (storeys - r.int(0, 2)), cs, ct, r(), 3, 2); }
      const np = Math.round(r.range(0, 3.4) * clo * density * washDay);
      for (let i = 0; i < np; i++) {
        const pz = r.range(z0 + 1, z1 - 1), py = 4.6 + 3 * r.int(1, storeys - 1) + 1.1, n = 2;
        for (let j = 0; j < n; j++) washing(xf + out * (0.8 + j * 0.95), py, pz, 1, 0, 0.85, r.range(0.7, 1.3), nf.tx, nf.tz, 0, r, 1);
      }
      if (r.chance(0.05)) card(xf + out * 1.4, 0, (z0 + z1) / 2, 0, 1, d + 1.5, H + 1.8, 1, r());
    }
  };
  // round thirteen: roofs that differ. Of the roofs the approach looks down on, about one in three is a place of its own (which: a hash of where it stands; what stands
  // on it: a stream made from the seed and the roof's own corner; round fourteen: the ordinary roof life is not generated on such a roof at all): a caged school yard or ball court under floodlights with children on it, a roof garden with
  // planters, lamps and people, or a works roof: a row of tanks on a frame, a cage, a forest of aerials and three lines of washing. People stand on other roofs too.
  const parkSeed = (type, lit, h2) => { let seed = 0; for (let i = 0; i < 60; i++) { seed = Math.fround((type + 0.08 + 0.84 * ((h2 * 7.13 + i * 0.137) % 1)) / 3); const sub = Math.fround(seed * 37) % 1; if (lit ? sub > 0.56 && sub < 0.94 : sub > 0.06 && sub < 0.44) break; } return seed; };
  const roofKind = (x0, x1, z0, z1, H, clo, nf, o) => {
    if (o.wc || clo < 0.3 || x1 - x0 < 13 || z1 - z0 < 13 || H > nf.y - 8 || H < 12) return 0;
    const h = hash2(Math.round(x0) * 0.37 + 11.3, Math.round(z0) * 0.53 + 4.1);
    return h < 0.15 ? 1 : h < 0.32 ? 2 : h < 0.55 ? 3 : 0;
  };
  const roofPeople = (x0, x1, z0, z1, y, n, child, r) => {
    for (let i = 0; i < n; i++) {
      const px = r.range(x0, x1), pz = r.range(z0, z1), ang = r.range(0, 6.2832), sd = r(), cc = r.pick(laundry).clone().multiplyScalar(r.range(0.65, 1)), walk = r.chance(child ? 0.85 : 0.5), hg = child ? r.range(1.15, 1.45) : r.range(1.6, 1.8);
      const reach = Math.max(0, Math.min(px - x0, x1 - px, pz - z0, z1 - pz) - 0.6);          // it never walks off its roof
      figure(px, y, pz, Math.cos(ang), Math.sin(ang), sd, cc, hg, walk ? Math.min(child ? 0.6 : 0.4, reach / 5) : 0);
    }
  };
  const specialRoof = (kind, x0, x1, z0, z1, H, nf, r) => {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, m = 1.1, h2 = r(), hc = pal[0].clone().multiplyScalar(r.range(0.55, 0.9));
    // the stair head every one of them has, in a corner
    const sx = r.chance(0.5) ? x0 + 0.5 : x1 - 3.9, sz = r.chance(0.5) ? z0 + 0.5 : z1 - 4.9;
    G.box(sx, sx + 3.4, sz, sz + 4.4, H, H + 3.1, hc, r.pick(roofs), r(), 2, 2);
    lamps.push([sx + 1.7, H + 2.5, sz + (sz < cz ? 4.7 : -0.3), 1, 0.74, 0.42, 0.6, 3, h2, 1.4]);
    if (kind === 1) {
      const type = w - 2 * m > 32 ? 1 : w - 2 * m > 16 && d - 2 * m > 14 ? 0 : 1, seed = parkSeed(type, true, h2), y = H + 0.3;
      G.box(x0 + m, x1 - m, z0 + m, z1 - m, H, y, kerbC, turfC, seed, 2, 8);
      card(cx, y, z0 + m, 1, 0, w - 2 * m, 4.2, 5, 0.3); card(cx, y, z1 - m, 1, 0, w - 2 * m, 4.2, 5, 0.3); card(x0 + m, y, cz, 0, 1, d - 2 * m, 4.2, 5, 0.3); card(x1 - m, y, cz, 0, 1, d - 2 * m, 4.2, 5, 0.3);
      for (const [mx, mz] of [[x0 + m, z0 + m], [x1 - m, z0 + m], [x0 + m, z1 - m], [x1 - m, z1 - m]]) { card(mx, y, mz, 0.7, 0.7, 1.3, 7.5, 4, 0.2 + 0.6 * h2); lamps.push([mx, y + 7.8, mz, 0.92, 0.97, 1, 1.25, 3, h2 + mx * 0.01, 1.9]); }
      roofPeople(x0 + m + 1.5, x1 - m - 1.5, z0 + m + 1.5, z1 - m - 1.5, y, 5 + Math.floor(r() * 6), true, r);
    } else if (kind === 2) {
      const seed = parkSeed(2, false, h2), y = H + 0.3, n = 5 + Math.floor(r() * 5);
      G.box(x0 + m, x1 - m, z0 + m, z1 - m, H, y, kerbC, turfC, seed, 2, 8);
      for (let i = 0; i < n; i++) {          // planters round the edge, three small trees among them
        const t = i / n * 6.2832 + r.range(-0.3, 0.3), px = cx + Math.cos(t) * (w / 2 - m - 2.2), pz = cz + Math.sin(t) * (d / 2 - m - 2.2), tree = i % 3 === 0, s = tree ? r.range(1.5, 2.3) : r.range(0.9, 1.9), hgt = tree ? r.range(3.2, 5) : r.range(0.9, 1.7);
        const g = pal[7].clone().multiplyScalar(r.range(0.55, 1.0));
        G.box(px - s, px + s, pz - s * 0.8, pz + s * 0.8, tree ? y + 1.2 : y, y + hgt, g, g.clone().multiplyScalar(1.15), r(), 4, 4);
        if (tree) G.box(px - 0.2, px + 0.2, pz - 0.2, pz + 0.2, y, y + 1.3, hc, hc, 0.4, 2, 2);
      }
      for (let i = 0; i < 3; i++) { const px = cx + (i - 1) * (w / 2 - m - 3) * 0.8, pz = cz + r.range(-0.3, 0.3) * d; G.box(px - 0.1, px + 0.1, pz - 0.1, pz + 0.1, y, y + 2.7, hc, hc, 0.5, 5, 5); lamps.push([px, y + 2.9, pz, 1, 0.8, 0.5, 0.7, 3, h2 + i * 0.3, 1.5]); }
      roofPeople(x0 + m + 2, x1 - m - 2, z0 + m + 2, z1 - m - 2, y, 2 + Math.floor(r() * 3), false, r);
    } else {
      const alongX = w > d, len = (alongX ? w : d) - 5, n = Math.max(3, Math.min(6, Math.floor(len / 4.2))), off = r.range(-0.22, 0.22) * (alongX ? d : w), fc = tin[4].clone().multiplyScalar(0.7);
      const fx0 = alongX ? cx - len / 2 : cx + off - 1.9, fx1 = alongX ? cx + len / 2 : cx + off + 1.9, fz0 = alongX ? cz + off - 1.9 : cz - len / 2, fz1 = alongX ? cz + off + 1.9 : cz + len / 2;
      G.box(fx0, fx1, fz0, fz1, H, H + 1.3, fc, fc, r(), 3, 2);
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5, tx = alongX ? cx + t * len : cx + off, tz = alongX ? cz + off : cz + t * len; G.tank(tx, tz, r.range(1.3, 1.75), H + 1.3, H + 1.3 + r.range(2, 3), r.pick(tanks), r.pick(tanks), r()); }
      const gx = r.range(x0 + 1, x1 - 6.5), gz = off > 0 ? z0 + 0.8 : z1 - 5;
      if (alongX) G.box(gx, gx + 5.5, gz, gz + 4.2, H, H + 2.8, hc, r.pick(tin), r(), 3, 2);
      const na = Math.round((12 + r() * 12) * Math.max(0.6, detail));
      for (let i = 0; i < na; i++) { const a = r.int(0, 3) * 0.785 + r.range(-0.2, 0.2); card(r.range(x0 + 0.8, x1 - 0.8), H, r.range(z0 + 0.8, z1 - 0.8), Math.cos(a), Math.sin(a), 3.2, r.range(5.5, 12.5), 0, r()); }
      const inWash = nf.d < 170 && nf.s > S_TURN && nf.s < S_FIN;
      for (let l = 0; l < 3; l++) {
        const ll = Math.min(len, r.range(7, 12)), o2 = (l - 1) * 2.2 - off * 0.9, nn = Math.max(3, Math.floor(ll / 1.4));
        for (let i = 0; i < nn; i++) { const t = (i + 0.5) / nn - 0.5, sag = 0.35 * (1 - 4 * t * t); washing(alongX ? cx + t * ll : cx + o2, H + 2.3 - sag, alongX ? cz + o2 : cz + t * ll, alongX ? 1 : 0, alongX ? 0 : 1, r.range(0.6, 1.05), r.range(0.7, 1.5), nf.tx, nf.tz, inWash && r.chance(0.4) ? 1 : 0, r); }
      }
      roofPeople(x0 + 2, x1 - 2, z0 + 2, z1 - 2, H, 1 + Math.floor(r() * 2), false, r);
    }
  };
  const addSlab = (x0, x1, z0, z1, H, nf, o = {}) => {
    const r = R.city, seed = r(), c = o.col || plaster(r), rc = r.pick(roofs).clone().multiplyScalar(r.range(0.7, 1.1));
    const clo = Math.max(1 - sstep(90, 300, nf.d), o.wc ? 0.5 : 0);
    const stepRoll = r(), stepD = r.range(2, 3.6), stepN = r.int(1, 3);
    let zr0 = z0, zr1 = z1, Hm = H;
    if (clo > 0.2 && !o.wc && !o.col && H > 30 && stepRoll < 0.45 && z1 - z0 > 18) {      // upper storeys stepped back from the street
      Hm = H - 3 * stepN; if (stepRoll < 0.3) zr0 = z0 + stepD; if (stepRoll > 0.12) zr1 = z1 - stepD;
      G.box(x0, x1, z0, z1, 0, Hm, c, rc, seed, 0, 1);
      G.vOff = Hm; G.box(x0, x1, zr0, zr1, Hm, H, c, rc, seed, 0, 1); G.vOff = 0;
    } else G.box(x0, x1, z0, z1, 0, H, c, rc, seed, 0, 1);
    if (nf.d < 85 && H > 12 && !o.wc) pathRoofs.push([(x0 + x1) / 2, H, (zr0 + zr1) / 2]);
    const rk = roofKind(x0, x1, zr0, zr1, H, clo, nf, o);
    slabTops.push([x0, x1, zr0, zr1, H, rk, nf, o.wc ? 1 : 0]);
    if (rk) specialRoof(rk, x0, x1, zr0, zr1, H, nf, placeRng('cb-roof-own', x0, zr0));          // a place of its own: nothing of the ordinary roof life is generated here
    else if (clo > 0.02) {
      dressRoof(x0, x1, zr0, zr1, H, clo, nf, o.wc);
      if (clo > 0.35 && !o.wc && H < nf.y - 8 && x1 - x0 > 9 && hash2(x0 * 0.91 + 2.7, z0 * 0.63 + 8.2) < 0.4) { const pr = placeRng('cb-roof-folk', x0, zr0); roofPeople(x0 + 1.5, x1 - 1.5, zr0 + 1.5, zr1 - 1.5, H, 1 + Math.floor(pr() * 2.4), false, pr); }
    }
    if (clo > 0.1 && !o.wc && z1 < -1100 && x1 - x0 > 9) for (const [zs, onZ] of [[z0 - 5, zr0 + 0.7], [z1 + 5, zr1 - 0.7]]) {          // frames along the roof edges of a neon street
      if (onNeonStreet((x0 + x1) / 2, zs) !== 1) continue;
      const s = R.sign;
      if (s() < 0.55) { const fw = Math.min(x1 - x0 - 1.5, s.range(9, 17)), fh = s.range(6.5, 10.5), sd = s(), cc = s.pick(neons); card((x0 + x1) / 2, H, onZ, 1, 0, fw, fh, 2, sd, cc.clone().multiplyScalar(1 - 0.6 * sstep(nf.y - 30, nf.y - 5, H + fh) * (1 - sstep(110, 260, nf.d)))); }
    }
    if (clo > 0.45 && !o.wc) facadeLife(x0, x1, z0, z1, Hm, c, clo, nf, o.xFace || 0);
    if (clo > 0.5 && nf.s > S_BOARD && nf.d > 30 && nf.d < 170 && nf.side < 0 && H > 20) flockSites.push([(x0 + x1) / 2, H, (z0 + z1) / 2, nf.tx, nf.tz, nf.s]);
  };
  const tower = (cx, cz, w, d, H, nf) => {
    const r = R.city, c = plaster(r).lerp(pal[0], 0.3);
    addSlab(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, H, nf, { col: c });
    towersBuilt.push([cx, cz, w, d, H]);
    const pw = w * r.range(0.3, 0.5), pd = d * r.range(0.3, 0.5), ph = r.range(4, 8);
    G.box(cx - pw / 2, cx + pw / 2, cz - pd / 2, cz + pd / 2, H, H + ph, c.clone().multiplyScalar(0.7), roofs[4], r(), 2, 2);
    // round eleven: an obstruction lamp is sized by how far it stands from the approach line (in space: across and up): a small lamp within 150 m, the full glow that
    // carries across the city from 420 m. The big one bloomed red over an eighth of the frame as the approach rolled out of the bank past the tower it stands on.
    const ly = H + ph + 1.2, lk = sstep(150, 420, Math.hypot(nf.d, ly - nf.y));
    lamps.push([cx, ly, cz, 1, 0.07, 0.03, 0.45 + 1.05 * lk, 2, r(), 1.2 + lk]);
  };
  const S_E = nearFly(0, -1100).s;
  cards.max -= 40;          // forty cards are kept back for the large signs round the beacon tower
  // a block the hill took becomes a park on a low plinth: a football pitch, hard courts or a garden, some floodlit after dark
  const parks = [], kerbC = new THREE.Color('#6b6860'), turfC = new THREE.Color('#2c4a24');
  const parkBlock = (bx0, bx1, bz0, bz1) => {
    const hs = [hillH(bx0, bz0), hillH(bx1, bz0), hillH(bx0, bz1), hillH(bx1, bz1), hillH((bx0 + bx1) / 2, (bz0 + bz1) / 2)];
    const lo = Math.min(...hs), hi = Math.max(...hs);
    if (lo > 0.4 || G.full) return;
    const h1 = hash2(bx0, bz0), h2 = hash2(bz0, bx0 + 7);
    const type = hi > 1.5 ? 2 : h1 < 0.4 ? 0 : h1 < 0.68 ? 1 : 2, lit = type < 2 && h2 < 0.62;
    // the shader reads the kind from the seed's third and the floodlights from fract(seed*37): find a seed that says both
    let seed = 0;
    for (let i = 0; i < 60; i++) { seed = Math.fround((type + 0.08 + 0.84 * ((h2 * 7.13 + i * 0.137) % 1)) / 3); const sub = Math.fround(seed * 37) % 1; if (lit ? sub > 0.56 && sub < 0.94 : sub > 0.06 && sub < 0.44) break; }
    const x0 = bx0 + 1.5, x1 = bx1 - 1.5, z0 = bz0 + 1.5, z1 = bz1 - 1.5;
    G.box(x0, x1, z0, z1, 0, 0.45, kerbC, turfC, seed, 2, 8);
    parks.push([x0, x1, z0, z1, type, lit ? 1 : 0]);
    if (lit) for (const [mx, mz] of [[x0 + 2.2, z0 + 2.2], [x1 - 2.2, z0 + 2.2], [x0 + 2.2, z1 - 2.2], [x1 - 2.2, z1 - 2.2]]) {
      card(mx, 0.45, mz, 0.7, 0.7, 1.8, 15, 4, 0.2 + 0.6 * h1);
      lamps.push([mx, 15.8, mz, 0.92, 0.97, 1, 1.9, 3, h2 + mx * 0.01, 2.3]);
    }
  };
  const inWalled = (x, z) => x > -306 && x < -82 && z > -1318 && z < -1176;
  const inPark = (x, z) => x > PLAY[0] - 72 && x < PLAY[0] + 72 && z > PLAY[1] - 45 && z < PLAY[1] + 45;
  const block = (bx0, bx1, bz0, bz1, side) => {
    const r = R.city, cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, nf = nearFly(cx, cz);
    const far = r() > 1 - sstep(430, 620, nf.d);
    const n = r.int(2, 4), cuts = [0]; for (let i = 1; i < n; i++) cuts.push(r.range(0.12, 0.88)); cuts.push(1); cuts.sort((a, b) => a - b);
    const towerRoll = r(), th = r(), lowRoll = r();
    if (inWalled(cx, cz) || inPark(cx, cz)) return;
    if (hillH(cx, cz) > 1.2 || hillH(bx0, bz0) > 2.5 || hillH(bx1, bz0) > 2.5 || hillH(bx0, bz1) > 2.5 || hillH(bx1, bz1) > 2.5) { parkBlock(bx0, bx1, bz0, bz1); return; }
    if (far) {      // beyond the camera's reach: one plain slab per block, no roof life
      if (lowRoll > 0.08) G.box(bx0 + cuts[1] * 5, bx1 - 4 * towerRoll, bz0 + 3 * th, bz1 - 1, 0, th > 0.94 ? 60 + 40 * towerRoll : 4.6 + 3 * Math.round(7 + 8 * towerRoll * towerRoll + 3 * th), plaster(r), r.pick(roofs), towerRoll, 0, 1);
      return;
    }
    const fin = nf.s > S_E;
    let lim = 999; if (nf.d < 64) lim = nf.y - 30; else if (nf.d < 140 && !fin) lim = nf.y - 46;
    const hab = hillAB(cx, cz), front = hab[0] > LOWQ[0] && hab[0] < LOWQ[1] && Math.abs(hab[1]) < 90;          // the low quarter at the hill's foot: nothing stands between the approach and the board
    if (front) lim = Math.min(lim, 20 + (hab[0] - 90) * 0.16);
    const pkFront = Math.abs(cx - PLAY[0]) < 100 && cz < PLAY[1] - 45 && cz > PLAY[1] - 150;          // low roofs on the approach side of the playground, so the turn looks down into it
    if (pkFront) lim = Math.min(lim, 17);
    // the blocks under the first straight, out of the scud (within SKIM metres of its ground track, to both hands): the tallest slabs the
    // carpet has, fourteen to sixteen storeys, wherever the ground's own limits allow them (the low quarter before the board and the playground's forecourt keep theirs)
    const skim = !fin && nf.s < S_ARC0 && nf.d < SKIM;
    const corridor = fin && nf.d >= 64 && nf.d < 150 && cz > -1090 && cz < -380;
    const second = fin && nf.d >= 150 && nf.d < 230 && cz > -1090 && cz < -380;
    if (!front && !pkFront && towerRoll < (corridor ? 0.66 : second ? 0.3 : nf.d > 150 ? 0.06 : 0)) {
      const H = corridor || second ? Math.min(122, Math.max(72, nf.y + 16 + th * 46)) : 62 + th * 40;
      const tw = 22 + th * 8, off = (bx1 - bx0 - tw) * (towerRoll * 7 % 1);
      tower(bx0 + tw / 2 + off, cz, tw, 26, H, nf);
      const lx0 = off > 30 ? bx0 : bx0 + tw + off + 4, lx1 = off > 30 ? bx0 + off - 4 : bx1;
      if (lx1 - lx0 > 10) addSlab(lx0, lx1, bz0 + 2, bz1 - 2, 4.6 + 3 * r.int(2, 5), nf);
      return;
    }
    for (let i = 0; i < n; i++) {
      let x0 = bx0 + (bx1 - bx0) * cuts[i], x1 = bx0 + (bx1 - bx0) * cuts[i + 1];
      const gap = r.chance(0.3) ? r.range(1.5, 3) : 0, st = lowRoll < 0.14 ? r.int(4, 8) : r.int(11, 15), s0 = r.range(0, 3.5), s1 = r.range(0, 3.5);
      x1 -= gap;
      if (x1 - x0 < 7) continue;
      const storeys = Math.min(skim ? Math.max(st, 16 - st % 3) : st, Math.floor((lim - 4.6) / 3));
      if (storeys < 1) continue;
      const first = i === 0, last = i === n - 1;
      addSlab(x0, x1, bz0 + s0, bz1 - s1, 4.6 + 3 * storeys, nf, { xFace: first ? -1 : last ? 1 : 0 });
    }
  };
  const stackTops = [];
  const craneBlock = (bx0, bx1, bz0, bz1) => {
    const r = ownRng('cb-crane'), cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, H = 92, hw = 13, c = plaster(r).lerp(pal[0], 0.4), conc = pal[0].clone().multiplyScalar(0.6), net = new THREE.Color('#2f6a4a');
    G.box(bx0 + 1, bx1 - 1, bz0 + 1, bz1 - 1, 0, 7.6, conc, roofs[3], 0.47, 0, 1);          // the site's podium
    G.vOff = 7.6; G.box(cx - hw, cx + hw, cz - hw, cz + hw, 7.6, 62, c, conc, 0.37, 0, 1);          // the floors that are let already
    G.vOff = 62; G.box(cx - hw + 0.5, cx + hw - 0.5, cz - hw + 0.5, cz + hw - 0.5, 62, H, conc, conc, 0.61, 3, 2); G.vOff = 0;          // the bare frame above them
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) card(cx + dz * (hw + 1.3), 7.6, cz + dx * (hw + 1.3), dx, dz, 2 * hw + 2.6, H - 3.6, 1, r(), net);          // bamboo and net round all four faces
    G.box(cx + hw + 1.4, cx + hw + 4.6, cz - 2, cz + 2, 0, H + 4, tin[1].clone().multiplyScalar(0.8), tin[1], 0.3, 3, 2);          // the hoist up the outer face
    // the crane: a lattice mast off the roof, a jib and its counter-jib, a cab, a hook block hanging
    const mx = cx - 5, mz = cz + 4, top = H + 27, ja = r.range(2.2, 2.9), jx = Math.cos(ja), jz = Math.sin(ja), yel = new THREE.Color('#c9a227');
    card(mx, H, mz, 1, 0, 2.6, 27, 4, 0.31); card(mx, H, mz, 0, 1, 2.6, 27, 4, 0.31);
    card(mx + jx * 15, top, mz + jz * 15, jx, jz, 56, 2.3, 5, 0.6); card(mx + jx * 4, top + 2.3, mz + jz * 4, jx, jz, 30, 5.5, 5, 0.6);          // (the tie frame over the mast head)
    G.box(mx - 1.2, mx + 1.2, mz - 1.2, mz + 1.2, top - 3.4, top - 0.8, yel, yel, 0.5, 5, 2);
    G.box(mx - jx * 12 - 1.6, mx - jx * 12 + 1.6, mz - jz * 12 - 1.6, mz - jz * 12 + 1.6, top - 1.6, top + 0.4, conc, conc, 0.5, 2, 2);          // the counterweight
    const hx = mx + jx * 31, hz = mz + jz * 31;
    G.box(hx - 0.09, hx + 0.09, hz - 0.09, hz + 0.09, top - 19, top, conc, conc, 0.5, 5, 5); G.box(hx - 1.3, hx + 1.3, hz - 0.9, hz + 0.9, top - 21, top - 19, yel, tin[2], 0.5, 2, 2);
    lamps.push([mx + jx * 43, top + 2.8, mz + jz * 43, 1, 0.07, 0.03, 1.2, 2, 0.2, 1.9], [mx, top + 8.4, mz, 1, 0.07, 0.03, 1.3, 2, 0.7, 2.0], [mx - jx * 13, top + 2.8, mz - jz * 13, 1, 0.07, 0.03, 0.9, 2, 0.45, 1.6]);
    for (let i = 1; i <= 4; i++) lamps.push([mx + jx * i * 9.5, top - 0.4, mz + jz * i * 9.5, 1, 0.9, 0.7, 0.75, 3, i * 0.23, 1.4]);
    for (let f = 0; f < 5; f++) for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const roll = r(), ph = r(); if (roll < 0.6) lamps.push([cx + dx * (hw - 1), 64.5 + f * 6, cz + dz * (hw - 1), 1, 0.92, 0.75, 0.8, 3, ph, 1.5]); }          // work lamps on the open floors
    for (let i = 0; i < 4; i++) { const px = r.range(cx - hw + 2, cx + hw - 2), pz = r.range(cz - hw + 2, cz + hw - 2), a = r.range(0, 6.2832), sd = r(); figure(px, H, pz, Math.cos(a), Math.sin(a), sd, yel, 1.75, 0.3); }
  };
  const stacksBlock = (bx0, bx1, bz0, bz1) => {
    const r = ownRng('cb-stacks'), cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, brick = pal[8].clone().multiplyScalar(0.8), conc = pal[0].clone().multiplyScalar(0.7), red = new THREE.Color('#a3301c'), white = new THREE.Color('#d8d2c4');
    G.box(bx0 + 2, bx1 - 2, bz0 + 3, bz1 - 3, 0, 23, brick, roofs[3], 0.63, 0, 1);          // the turbine hall, a monitor along its ridge, coolers on its roof
    G.box(bx0 + 8, bx1 - 8, cz - 4, cz + 4, 23, 27, brick.clone().multiplyScalar(0.85), roofs[0], 0.21, 2, 1);
    for (let i = 0; i < 4; i++) G.tank(bx0 + 9 + i * 14, bz0 + 7.5, 2.4, 23, 26 + r.range(0, 1.5), tanks[1], tanks[0], r());
    for (const sx of [-13, 13]) {
      const x = cx + sx, z = cz + 6.5, ph = r();
      G.tank(x, z, 4.7, 0, 32, conc, conc, 0.07); G.tank(x, z, 4.1, 32, 54, conc.clone().multiplyScalar(1.08), conc, 0.07);
      for (let i = 0; i < 4; i++) G.tank(x, z, 3.6 - i * 0.1, 54 + i * 6, 60 + i * 6, i & 1 ? white : red, i === 3 ? new THREE.Color('#1c1a18') : conc, 0.07);          // the top third in red and white bands, as the obstacle rules ask
      G.tank(x, z, 5.4, 53.2, 54, conc, tin[2], 0.07);          // a platform ring
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + ph * 6; lamps.push([x + Math.cos(a) * 3.7, 78.6, z + Math.sin(a) * 3.7, 1, 0.07, 0.03, 1.2, 2, ph + i * 0.33, 1.9], [x + Math.cos(a) * 5.3, 55, z + Math.sin(a) * 5.3, 1, 0.07, 0.03, 0.8, 2, ph + 0.5 + i * 0.33, 1.4]); }
      for (let i = 0; i < 6; i++) lamps.push([x + 4.9, 6 + i * 8, z, 1, 0.86, 0.66, 0.7, 3, ph + i * 0.17, 1.5]);          // the ladder's lamps up the shaft, a ring of work lamps on the platform
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + ph * 3; lamps.push([x + Math.cos(a) * 5.5, 55.6, z + Math.sin(a) * 5.5, 1, 0.9, 0.72, 0.8, 3, ph + i * 0.11, 1.6]); }
      stackTops.push([x, 78, z]);
    }
    for (let x = bx0 + 6; x <= bx1 - 6; x += 12) lamps.push([x, 21.5, bz1 - 2.4, 1, 0.78, 0.46, 1.0, 3, x * 0.03, 1.6], [x, 21.5, bz0 + 2.4, 1, 0.78, 0.46, 1.0, 3, x * 0.03 + 0.4, 1.6]);
  };
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < (side > 0 ? 17 : 22); k++) {
      const a = AVE + k * PITCH_X, bx0 = side > 0 ? a : -(a + BLOCK_X), bx1 = bx0 + BLOCK_X;
      for (let j = 0; j < 53; j++) {
        const bz1 = ROW0 - j * PITCH_Z;
        // round thirteen: two more blocks are given to landmarks of the turn, one either side of the line (places in the street grid): outside it, as the bank begins to
        // ease, a tower under construction in bamboo and green net with a crane on its roof; inside it, where the turn rolls out, a power station's twin banded stacks
        const crane = side > 0 && k === 0 && j === 23, stacks = side < 0 && k === 1 && j === 16;
        // round fourteen: a block given to a landmark (the beacon tower's, the crane's, the power station's) generates no tenements at all: every block has streams of its own
        if (crane) craneBlock(bx0, bx1, bz1 - BLOCK_Z, bz1); else if (stacks) stacksBlock(bx0, bx1, bz1 - BLOCK_Z, bz1);
        else if (!(side > 0 && k === 0 && j === LM_ROW)) { blockStreams(side + ':' + k + ':' + j); block(bx0, bx1, bz1 - BLOCK_Z, bz1, side); }
        if (j & 1) await Y();
      }
      if (side < 0 && k >= 2) for (let j = 0; j < 3; j++) { blockStreams('shore:' + k + ':' + j); block(bx0, bx1, -316 + j * PITCH_Z, -282 + j * PITCH_Z, side); }
      await Y();
    }
  }
  // the walled city: a single mass of jammed towers with no streets, thick with aerials
  {
    R.city = WALLED.city; R.roof = WALLED.roof; R.sign = WALLED.sign;
    const r = R.city, nfw = nearFly(-194, -1247);
    for (let ix = 0; ix < 16; ix++) {
      for (let iz = 0; iz < 10; iz++) {
        const x0 = -300 + ix * 13.25 + r.range(-1.5, 1.5), z0 = -1312 + iz * 13 + r.range(-1.5, 1.5), w = r.range(10, 14.5), d = r.range(10, 14);
        const st = r.chance(0.1) ? r.int(6, 9) : r.int(10, 14);
        const c = plaster(r).lerp(pal[0], 0.55).multiplyScalar(r.range(0.6, 0.95));
        addSlab(x0, x0 + w, z0, z0 + d, 4.6 + 3 * st + r.range(0, 2), nfw, { col: c, wc: true });
      }
      if (ix % 4 === 3) await Y();
    }
  }
  await Y();
  // round nine: a few large neon frames on the towers round the beacon tower, on the faces that look up the avenue toward the approach (no lettering: a frame and a figure
  // of tubes, as everywhere), in the cold colours: the tower's amber is the one warm thing among them. From a stream of their own.
  cards.max += 40;
  {
    const cold = [neons[1], neons[3], neons[4], neons[0], neons[3], neons[1]];
    let n = 0;
    for (const t of towersBuilt) {
      const d = Math.hypot(t[0] - LM[0], t[1] - LM[1]);
      if (d > 430 || d < 40 || n >= 14) continue;          // the place decides before anything is drawn
      const r = placeRng('cb-tower-sign', t[0], t[1]);          // (round sixteen: each tower's sign from a stream of its own, named from its place: all are dealt anew once)
      if (r() > 0.75) continue;
      const w = r.range(8, 12), h = r.range(13, 20), yk = r.range(0.34, 0.62), off = r.range(-0.2, 0.2), sd = r(), cc = r.pick(cold);
      card(t[0] + off * t[2], Math.min(t[4] - h - 3, t[4] * yk), t[1] - t[3] / 2 - 0.5, 1, 0, w, h, 3, sd, cc); n++;
      if (Math.abs(t[0]) < 170) { const fx = t[0] > 0 ? -1 : 1; card(t[0] + fx * (t[2] / 2 + 0.5), Math.min(t[4] - h - 3, t[4] * (1 - yk)), t[1] + off * t[3], 0, 1, w * 0.8, h, 3, sd + 0.31, r.pick(cold)); n++; }
    }
  }
  await Y();
  // the street market on the two lots under the last seconds of the final, where the approach is too low for a building: rows of stalls under tarpaulins, bare bulbs after dark
  {
    const r = RX;
    for (const sd of [-1, 1]) for (let row = 0; row < 6; row++) {
      const z0 = -397.6 + row * 5.3;
      for (let i = 0; i < 16; i++) {
        const x0 = 13.2 + i * 3.6, w = r.range(2.9, 3.4), h = r.range(2.2, 2.7), gap = r.chance(0.14), cc = r.pick(tin).clone().multiplyScalar(r.range(0.5, 0.8)), ct = r.pick(laundry).clone().multiplyScalar(r.range(0.45, 0.8)), sdd = r(), dy = r.range(-0.45, 0.45), bulb = r.chance(0.42);
        if (gap) continue;
        const xa = sd > 0 ? x0 : -(x0 + w);
        G.box(xa, xa + w, z0, z0 + 2.7, 0, h, cc, ct, sdd, 9, 7, dy);
        if (bulb) lamps.push([xa + w / 2, h + 0.6, z0 + (row % 2 ? -0.6 : 3.3), 1, 0.74, 0.4, 0.55, 3, sdd, 1.3]);
      }
    }
    // sodium lamps on posts along the boulevard and the last avenue (the ground shader lays their light on the road)
    const postC = new THREE.Color('#4a5054');
    const streetLamp = (x, z, ax, az) => { G.box(x - 0.14, x + 0.14, z - 0.14, z + 0.14, 0, 9, postC, postC, 0.5, 5, 5); lamps.push([x + ax, 9.2, z + az, 1, 0.62, 0.24, 1.15, 3, hash2(x, z), 1.6]); };
    for (let x = -405; x <= 405; x += 30) if (Math.abs(x) > 20) { streetLamp(x, -364.4, 0, 1.6); streetLamp(x, -331.6, 0, -1.6); }
    for (let z = -1080; z <= -384; z += 36) { streetLamp(-9.9, z, 1.4, 0); streetLamp(9.9, z, -1.4, 0); }
  }
  await Y();

  // ---------- the hill ----------
  const hillGeo = await (async () => {
    const na = 46, nb = 60, a0 = -170, a1 = 190, b0 = -235, b1 = 235, pos = new Float32Array((na + 1) * (nb + 1) * 3), hs = new Float32Array((na + 1) * (nb + 1)), idx = [];
    for (let i = 0; i <= na; i++) for (let j = 0; j <= nb; j++) {
      const a = a0 + (a1 - a0) * i / na, b = b0 + (b1 - b0) * j / nb, [x, z] = hillXZ(a, b), h = hillH(x, z), k = i * (nb + 1) + j;
      pos[k * 3] = x; pos[k * 3 + 1] = h > 0.02 ? h : -0.6; pos[k * 3 + 2] = z; hs[k] = h;
      if (j === nb && i % 12 === 11) await Y();
    }
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
      const k = i * (nb + 1) + j, k2 = k + nb + 1;
      if (hs[k] + hs[k + 1] + hs[k2] + hs[k2 + 1] < 0.05) continue;
      idx.push(k, k + 1, k2 + 1, k, k2 + 1, k2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); await Y(); g.setIndex(idx); await Y(); g.computeVertexNormals();
    return g;
  })();
  await Y();
  const summit = (() => { let best = [0, 0, 0]; for (let a = -40; a <= 40; a += 8) for (let b = -40; b <= 40; b += 8) { const [x, z] = hillXZ(a, b), h = hillH(x, z); if (h > best[1]) best = [x, h, z]; } return best; })();
  {
    const r = R.hill, ca = U.uBoard.value.z;
    const nTrees = Math.round(300 * Math.max(0.6, detail));
    for (let i = 0; i < nTrees; i++) {
      const a = r.range(-160, 160), b = r.range(-225, 225), [x, z] = hillXZ(a, b), h = hillH(x, z);
      if (h < 3 || (Math.abs(a - BOARD.a) < ca + 16 && Math.abs(b) < BOARD.half + 14)) continue;
      const sl = Math.hypot(hillH(x + 4, z) - hillH(x - 4, z), hillH(x, z + 4) - hillH(x, z - 4)) / 8;
      if (sl > 0.8 || G.full) continue;
      // round eleven: none of these eight-sided bushes within 300 m of the approach line. Seen from above on the close pass each was a flat green triangle beside the eye
      // by day and a black square on the slope after dark; the kit's oaks, ferns and grass have that ground. (Round fourteen: the place decides first; a bush that is
      // not built draws nothing.)
      if (nearFly(x, z).d < 300) continue;
      const rb = ownRng('cb-bush:' + i);          // (round sixteen: a bush's dress from a stream of its own slot, so the hill's stream gives places only: bushes and what follows them there are dealt anew once)
      const cr = rb.range(2.6, 5.5), sq = rb.range(0.7, 1.1), ph = rb();
      const g = pal[7].clone().lerp(new THREE.Color('#1f3a1c'), rb.range(0, 0.7)).multiplyScalar(rb.range(0.7, 1.5));
      const y = h + cr * sq * 0.6, v0 = G.nv, dk = g.clone().multiplyScalar(0.55);
      G.v(x, y + cr * sq, z, 0, 1, 0, g, 0, 0, ph, 4, 1, 1); G.v(x, y - cr * sq, z, 0, -1, 0, dk, 0, 0, ph, 4, 1, 1);
      for (let q = 0; q < 4; q++) { const an = ph * 6 + q * Math.PI / 2, sx = Math.sin(an), cz = Math.cos(an), rr = cr * rb.range(0.8, 1.25); G.v(x + sx * rr, y + rb.range(-0.3, 0.3) * cr, z + cz * rr, sx, 0.2, cz, q % 2 ? g : dk, 0, 0, ph, 4, 1, 1); }
      for (let q = 0; q < 4; q++) { const p = v0 + 2 + q, n = v0 + 2 + (q + 1) % 4; G.t(v0, p, n); G.t(v0 + 1, n, p); }
    }
    // six floodlamps on low posts along the foot of the board: its light after dark
    for (let i = 0; i < 8; i++) { const [fx, fz] = hillXZ(BOARD.a + ca + 5, (-35 + i * 10) * BOARD.half / 42); lamps.push([fx, hillH(fx, fz) + 2.2, fz, 1, 0.8, 0.52, 1.2, 3, i * 0.17, 1.6]); card(fx, hillH(fx, fz) - 0.2, fz, HH[1], -HH[0], 1.5, 2.6, 4, 0.31 + i * 0.07); }
    for (let i = 0; i < 3; i++) { const [tx, tz] = hillXZ(BOARD.a - ca - 5.5, (-30 + i * 30) * BOARD.half / 42); card(tx, hillH(tx, tz) - 0.1, tz, HH[1], -HH[0], 30 * BOARD.half / 42, 2.6, 5, 0.5); }          // a fence along the head of the board
    // round eight: the board as a built thing. A concrete kerb stands round it (a wall down both sides and along its head, a low one along its foot) with a lamp every ten
    // metres along it; four floodlight masts stand before its foot, a string of lamps runs down the path from each lower corner to the street. From a stream of no one's: no draw.
    {
      const conc = pal[0].clone().multiplyScalar(0.9), concD = conc.clone().multiplyScalar(0.6), aT = BOARD.a - ca, aF = BOARD.a + ca, hb = BOARD.half;
      const bp = (a, b, lift) => { const [x, z] = hillXZ(a, b); return [x, BOARD.h - (a - BOARD.a) * BOARD.slope + lift, z]; };
      const gq = (A, B, C, D, c, c2) => { const uy = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]); if (uy >= 0) G.quad(A, B, C, D, c, 2, 0.4, c2 || c); else G.quad(A, D, C, B, c, 2, 0.4, c2 || c); };      // faces up
      const wallq = (A, B, drop, c) => { G.quad([A[0], A[1] - drop, A[2]], [B[0], B[1] - drop, B[2]], B, A, concD, 2, 0.4, c); G.quad([B[0], B[1] - drop, B[2]], [A[0], A[1] - drop, A[2]], A, B, concD, 2, 0.4, c); };      // both faces
      for (const sd of [-1, 1]) {
        const i0 = bp(aT - 1.5, sd * (hb + 0.2), 1.5), i1 = bp(aF + 1.5, sd * (hb + 0.2), 1.5), o0 = bp(aT - 1.5, sd * (hb + 1.7), 1.5), o1 = bp(aF + 1.5, sd * (hb + 1.7), 1.5);
        gq(i0, i1, o1, o0, conc); wallq(i0, i1, 1.7, conc); wallq(o0, o1, 4.5, conc);
        for (let i = 0; i <= 8; i++) { const q = bp(aT + (aF - aT) * i / 8, sd * (hb + 0.95), 2.3); lamps.push([q[0], q[1], q[2], 1, 0.74, 0.42, 0.8, 3, i * 0.13 + sd, 1.7]); }
        for (let a = aF + 14; a < 176; a += 13) { const b = sd * (hb * 1.16 + 6 * Math.sin(a * 0.06) + Math.max(a - BOARD.a, 0) * 0.22), [x, z] = hillXZ(a, b), h = hillH(x, z); if (h > 1.5) lamps.push([x, h + 2.4, z, 1, 0.7, 0.36, 0.7, 3, a * 0.07, 1.5]); }
      }
      { const i0 = bp(aT, -hb - 1.7, 1.5), i1 = bp(aT, hb + 1.7, 1.5), o0 = bp(aT - 1.5, -hb - 1.7, 1.5), o1 = bp(aT - 1.5, hb + 1.7, 1.5);
        gq(i0, i1, o1, o0, conc); wallq(i0, i1, 1.7, conc); wallq(o0, o1, 3.5, conc);
        for (let i = 1; i < 8; i++) { const q = bp(aT - 0.75, -hb + 2 * hb * i / 8, 2.3); lamps.push([q[0], q[1], q[2], 1, 0.74, 0.42, 0.8, 3, i * 0.11, 1.7]); }
        const f0 = bp(aF + 0.2, -hb - 1.7, 0.7), f1 = bp(aF + 0.2, hb + 1.7, 0.7), g0 = bp(aF + 1.5, -hb - 1.7, 0.7), g1 = bp(aF + 1.5, hb + 1.7, 0.7);
        gq(f0, f1, g1, g0, conc); wallq(f0, f1, 0.9, conc); wallq(g0, g1, 2.5, conc); }
      for (const b of [-45, -15, 15, 45].map((v) => v * BOARD.half / 42)) {
        const [mx, mz] = hillXZ(aF + 10, b), my = hillH(mx, mz);
        card(mx, my - 0.3, mz, HH[1], -HH[0], 3.6, 20.3, 4, 0.37 + b * 0.003);
        for (const o of [-1.2, 1.2]) lamps.push([mx + HH[1] * o, my + 20.2, mz - HH[0] * o, 1, 0.84, 0.56, 2.5, 3, b * 0.01 + o, 3.0]);
        boardMasts.push([mx, my + 20, mz, b]);
      }
    }
    // Scrub and creeper come over the kerb where the hill's growth has reached it: at the middle of the gap between two of the kerb's lamps (never under a lamp), down
    // both sides and along the head, eleven of the twenty-three gaps by a stream of their own. The hill's ground shader lays each mat of leaves on the paint and the
    // apron (uCreep); creeperPts is where a shrub stands on the kerb's top or at the wall's foot for it (the world plants them: anchors.hill.creepers).
    {
      const r = ownRng('cb-board-creeper'), hb = BOARD.half, gaps = [];
      for (let i = 0; i < 8; i++) { gaps.push([-1, -1 + (i + 0.5) * 0.25, 0], [1, -1 + (i + 0.5) * 0.25, 0]); if (i > 0) gaps.push([-1 + i * 0.25 + 0.125, -1, 1]); }
      r.shuffle(gaps);
      for (let k = 0; k < 11; k++) {
        const [qx, qy, head] = gaps[k], reach = r.range(3.6, 8.2);
        U.uCreep.value[k].set(qx, qy, reach, 0);
        { const t = r.range(-0.2, 0.2) * reach, out = r.range(0.7, 1.3), s = r.range(0.9, 1.25) * (0.75 + reach / 10);          // a shrub on the kerb's top at the root
          const a = BOARD.a + qy * ca + (head ? -out : t * Math.cos(Math.atan(BOARD.slope))), b = qx * hb + (head ? t : Math.sign(qx) * out), [x, z] = hillXZ(a, b);
          creeperPts.push([x, BOARD.h - (a - BOARD.a) * BOARD.slope + 1.5, z, s]); }
        if (reach > 6.4) { const tI = r.range(-0.3, 0.3) * reach, aI = BOARD.a + qy * ca + (head ? 2.2 : tI * 0.7), bI = qx * hb + (head ? tI : -Math.sign(qx) * 2.4), [xI, zI] = hillXZ(aI, bI);          // and, where the mat is a wide one, another that has rooted in a joint of the paint just inside the wall
          creeperPts.push([xI, BOARD.h - (aI - BOARD.a) * BOARD.slope, zI, r.range(0.7, 1.0)]); }
      }
    }
    // round thirteen: the board is a worked thing. A lattice gantry joins the four masts before its foot, a row of floodlights along it; a maintenance crew stands and
    // walks on the apron under it and along the kerb's foot; their hut stands beside the outer mast.
    {
      const r = ownRng('cb-board-crew'), tx = HH[1], tz = -HH[0];
      for (let i = 0; i < boardMasts.length - 1; i++) {
        const A = boardMasts[i], B = boardMasts[i + 1], len = Math.hypot(B[0] - A[0], B[2] - A[2]), y = Math.min(A[1], B[1]) - 3.4;
        card((A[0] + B[0]) / 2, y, (A[2] + B[2]) / 2, tx, tz, len, 2.4, 5, 0.5);
        for (let k = 1; k <= 4; k++) { const t = k / 5; lamps.push([A[0] + (B[0] - A[0]) * t, y - 0.3, A[2] + (B[2] - A[2]) * t, 1, 0.86, 0.6, 1.25, 3, i * 0.31 + k * 0.17, 2.0]); }
      }
      const aF = BOARD.a + ca;
      for (let i = 0; i < 9; i++) {
        const a = aF + r.range(3.2, 8.5), b = r.range(-0.92, 0.92) * BOARD.half, sd = r(), cc = r.pick(laundry).clone().multiplyScalar(r.range(0.7, 1)), pace = r.chance(0.6) ? r.range(0.35, 0.8) : 0, [x, z] = hillXZ(a, b), h = hillH(x, z);
        const sl = (hillH(x + tx * 3, z + tz * 3) - hillH(x - tx * 3, z - tz * 3)) / 6;
        figure(x, h, z, tx, tz, sd, cc, 1.75, Math.abs(sl) < 0.12 ? pace : 0, sl);
      }
      const [hx, hz] = hillXZ(aF + 12.5, BOARD.half * 1.22), hy = hillH(hx, hz);
      G.box(hx - 2.6, hx + 2.6, hz - 1.9, hz + 1.9, hy - 0.8, hy + 2.7, tin[3].clone().multiplyScalar(0.8), tin[5], 0.43, 2, 2, 0.4);
      lamps.push([hx, hy + 3.2, hz, 1, 0.78, 0.46, 0.8, 3, 0.6, 1.6]);
    }
    // round thirteen: the squatters' terraces. On the flank the turn looks down on (hill b 45 to 115), tin huts stand on ledges either side of a lane that follows the slope
    // (laneB, and the hill's ground shader draws the lane and its lamps' pools): half of them an open front lit by a bare bulb after dark, washing on lines beside them
    // (the wash of the aircraft takes it), a lamp on a pole every thirteen metres, people walking the lane. From a stream of its own.
    {
      // round fourteen: each hut is a built thing and draws from a stream of its own (the seed and its slot beside the lane): where it stands is drawn and tested first,
      // and only a hut that is built draws its dress. Tin walls in two shades (the upper half patched in another sheet), a mono-pitch tin roof in a third that overhangs
      // half a metre and falls toward the downhill side, the open lit front downhill, a door and a shutter on another wall, one in three with a lean-to and a water drum.
      const TERR = [[1, 6.5, 0.9], [-1, 6.5, 0.82], [1, 15.5, 0.6], [-1, 15.5, 0.5], [1, 24.5, 0.3]], doorC = new THREE.Color(0.07, 0.055, 0.045);
      let ia = 0;
      for (let a0 = -138; a0 <= 38; a0 += 6.5, ia++) {
        for (let k = 0; k < TERR.length; k++) {
          const [side, off, p] = TERR[k], r = ownRng('cb-hut:' + ia + ':' + k);
          if (r() > p * Math.min(1.15, density)) continue;
          const w = r.range(3.6, 6.2), d = r.range(3.2, 4.8), ja = r.range(-1.5, 1.5), jb = r.range(-1.2, 1.2);
          const a = a0 + ja, [x, z] = hillXZ(a, laneB(a) + side * (off + jb));
          const hs = [hillH(x - w / 2, z - d / 2), hillH(x + w / 2, z - d / 2), hillH(x - w / 2, z + d / 2), hillH(x + w / 2, z + d / 2)], lo = Math.min(...hs), hi = Math.max(...hs);
          if (lo < 4 || hi > 84 || hi - lo > 5.5 || G.full) continue;
          if (terraceHuts.some((q) => Math.abs(q[0] - x) < (q[2] + w) / 2 + 0.7 && Math.abs(q[1] - z) < (q[3] + d) / 2 + 0.7)) continue;
          const foot = [x, z, w, d]; terraceHuts.push(foot);
          const h = r.range(2.1, 2.7), c = r.pick(tin).clone().multiplyScalar(r.range(0.6, 1)), c2 = r.pick(tin).clone().multiplyScalar(r.range(0.55, 0.95)), ct = r.pick(tin).clone().multiplyScalar(r.range(0.6, 1.1));
          const sd = r(), litR = r(), washR = r(), pitch = r.range(0.17, 0.25), extraR = r(), doorT = r.range(0.12, 0.3);
          const gx = hillH(x + 2, z) - hillH(x - 2, z), gz = hillH(x, z + 2) - hillH(x, z - 2), gl = Math.hypot(gx, gz) || 1;
          const alongX = Math.abs(gx) > Math.abs(gz), sdn = alongX ? (gx > 0 ? -1 : 1) : (gz > 0 ? -1 : 1);          // the axis the slope runs along, and which way is downhill on it
          const hm = (lo + hi) / 2, x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, yMid = hm + h * 0.5, yLo = hm + h, yHi = yLo + pitch * (alongX ? w : d);          // the hut is dug into the slope: its floor at the mean of its corners
          const top = (xc, zc) => { const t = alongX ? (xc - x0) / w : (zc - z0) / d; return sdn > 0 ? yHi + (yLo - yHi) * t : yLo + (yHi - yLo) * t; };
          G.box(x0, x1, z0, z1, lo - 0.5, yMid, c, c, sd, 2, 2);
          { const e = 0.06, X0 = x0 - e, X1 = x1 + e, Z0 = z0 - e, Z1 = z1 + e, u = sd * 53, H2 = yHi - yMid;          // the patched upper half, a hand's breadth proud, cut to the roof's fall
            G.vOff = 1.2;
            G.wall(X0, Z1, X1, Z1, yMid, top(x0, z1), top(x1, z1), 0, 1, c2, sd, 2, u, H2); G.wall(X1, Z1, X1, Z0, yMid, top(x1, z1), top(x1, z0), 1, 0, c2, sd, 2, u + 31, H2);
            G.wall(X1, Z0, X0, Z0, yMid, top(x1, z0), top(x0, z0), 0, -1, c2, sd, 2, u + 57, H2); G.wall(X0, Z0, X0, Z1, yMid, top(x0, z0), top(x0, z1), -1, 0, c2, sd, 2, u + 83, H2);
            G.vOff = 0; }
          { const o = 0.5, t = (xc, zc) => top(xc, zc) + 0.05; G.quad([x0 - o, t(x0 - o, z1 + o), z1 + o], [x1 + o, t(x1 + o, z1 + o), z1 + o], [x1 + o, t(x1 + o, z0 - o), z0 - o], [x0 - o, t(x0 - o, z0 - o), z0 - o], ct, 2, sd + 0.2); }          // the roof
          // a panel standing 0.13 m proud of one wall (the wall whose outward normal is sg along x, or along z): from fraction t0 to t1 of its length, from ya to yb
          const panel = (onX, sg, t0, t1, ya, yb, col, kind, sdd, hgt) => {
            if (onX) { const xw = x + sg * (w / 2 + 0.13), za = z0 + d * t0, zb = z0 + d * t1; if (sg > 0) G.wall(xw, zb, xw, za, ya, yb, yb, 1, 0, col, sdd, kind, sdd * 97, hgt); else G.wall(xw, za, xw, zb, ya, yb, yb, -1, 0, col, sdd, kind, sdd * 97, hgt); return [xw, (za + zb) / 2]; }
            const zw = z + sg * (d / 2 + 0.13), xa = x0 + w * t0, xb = x0 + w * t1; if (sg > 0) G.wall(xa, zw, xb, zw, ya, yb, yb, 0, 1, col, sdd, kind, sdd * 97, hgt); else G.wall(xb, zw, xa, zw, ya, yb, yb, 0, -1, col, sdd, kind, sdd * 97, hgt); return [(xa + xb) / 2, zw];
          };
          const fr = panel(alongX, sdn, 0.06, 0.94, hm - 0.1, hm + h - 0.25, ct, 9, sd, h);          // the open front, in the middle of the downhill wall
          if (litR < 0.75) lamps.push([fr[0] + (fr[0] - x) * 0.15, hm + h * 0.82, fr[1] + (fr[1] - z) * 0.15, 1, 0.72, 0.38, 0.85, 3, sd, 1.8]);
          // the door and a shutter on the wall that looks at the lane (or, where that is the front, on the wall to its side)
          const lx = -side * HH[1], lz = side * HH[0], laneX = Math.abs(lx) > Math.abs(lz), lsg = laneX ? Math.sign(lx) || 1 : Math.sign(lz) || 1, same = laneX === alongX && lsg === sdn;
          const uphill = laneX === alongX && lsg === -sdn;          // (never on the wall that is dug into the slope)
          const dOnX = same || uphill ? !alongX : laneX, dsg = same || uphill ? 1 : lsg, dlen = dOnX ? d : w;
          panel(dOnX, dsg, doorT, doorT + 0.95 / dlen, hm - 0.1, hm + 1.85, doorC, 2, sd + 0.3, 2);
          panel(dOnX, dsg, 0.62, 0.62 + 1.0 / dlen, hm + 0.95, hm + 1.75, ct.clone().multiplyScalar(0.75), 2, sd + 0.5, 1);
          if (extraR < 0.34) {          // a lean-to beside the hut on the same contour, and a water drum at its corner
            const lw = Math.min((alongX ? w : d) - 0.6, 3), ly = hm + h * 0.62, lc = c2.clone().multiplyScalar(0.85);
            if (alongX) { G.box(x - lw / 2, x + lw / 2, z1, z1 + 1.8, lo - 0.5, ly, lc, ct, sd + 0.4, 2, 2, 0.3 * sdn * -1); foot[1] = z + 0.9; foot[3] = d + 1.8; const tx = x + lw / 2 + 0.75, tz = z1 + 0.6, ty = hillH(tx, tz); G.tank(tx, tz, 0.45, ty - 0.3, ty + 0.9, tanks[1], tanks[0], sd); }
            else { G.box(x1, x1 + 1.8, z - lw / 2, z + lw / 2, lo - 0.5, ly, lc, ct, sd + 0.4, 2, 2, -0.35); foot[0] = x + 0.9; foot[2] = w + 1.8; const tx = x1 + 0.6, tz = z + lw / 2 + 0.75, ty = hillH(tx, tz); G.tank(tx, tz, 0.45, ty - 0.3, ty + 0.9, tanks[1], tanks[0], sd); }
          }
          if (washR < 0.45) {          // a line of washing along the contour beside the hut
            const cx2 = -gz / gl, cz2 = gx / gl, nf = nearFly(x, z), n = 4 + Math.floor(washR * 9), ox = x - gx / gl * (alongX ? w / 2 + 1.6 : 0), oz = z - gz / gl * (alongX ? 0 : d / 2 + 1.6);
            for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; washing(ox + cx2 * t * n * 1.1, hillH(ox + cx2 * t * n * 1.1, oz + cz2 * t * n * 1.1) + 2.2 - 0.3 * (1 - 4 * t * t), oz + cz2 * t * n * 1.1, cx2, cz2, r.range(0.6, 1.0), r.range(0.7, 1.3), nf.tx, nf.tz, nf.d < 170 && r.chance(0.35) ? 1 : 0, r); }
          }
        }
      }
      const laneT = (a) => { const k = 22 * 0.021 * Math.cos(a * 0.021 + 1.0), tx = -HH[0] + k * HH[1], tz = -HH[1] - k * HH[0], l = Math.hypot(tx, tz); return [tx / l, tz / l]; };
      for (let a = -130; a <= 39; a += 13) { const [x, z] = hillXZ(a, laneB(a) + 2.4), h = hillH(x, z), t = laneT(a); if (h < 3) continue; card(x, h - 0.1, z, t[0], t[1], 1.3, 3.5, 4, 0.33 + a * 0.003); lamps.push([x, h + 3.5, z, 1, 0.7, 0.36, 0.8, 3, a * 0.07, 1.7]); }
      const r = ownRng('cb-lane-folk');
      for (let i = 0; i < 26; i++) {
        const a = r.range(-132, 36), jb = r.range(-0.9, 0.9), [x, z] = hillXZ(a, laneB(a) + jb), h = hillH(x, z), t = laneT(a);
        if (h < 3) continue;          // the place decides before the walker is drawn
        const sd = r(), cc = r.pick(laundry).clone().multiplyScalar(r.range(0.6, 1)), pace = r.chance(0.72) ? r.range(0.3, 0.7) : 0, small = r.chance(0.2);
        const sl = (hillH(x + t[0] * 3, z + t[1] * 3) - hillH(x - t[0] * 3, z - t[1] * 3)) / 6;
        figure(x, h, z, t[0], t[1], sd, cc, small ? 1.25 : 1.72, pace, sl);
      }
    }
    // a hut and a mast with a red lamp on the summit
    G.box(summit[0] - 3, summit[0] + 3, summit[2] - 2.5, summit[2] + 2.5, summit[1] - 1.5, summit[1] + 2.8, pal[6].clone().multiplyScalar(0.7), roofs[4], 0.3, 2, 2);
    card(summit[0] + 5, summit[1] - 0.5, summit[2], H0[1], -H0[0], 4, 17, 4, 0.4);
    lamps.push([summit[0] + 5, summit[1] + 17, summit[2], 1, 0.07, 0.03, 1.8, 2, 0.2, 2.5]);
  }
  await Y();

  // ---------- airfield: promontory, sea walls, terminal, parked jets, lights ----------
  const moverGeo = new Geo(200), moverLamps = [], MOVER_K = 0.86;
  const flatGeo = (pts) => { const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1]))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g; };
  const cityGround = flatGeo([[-1700, -2910], [1300, -2910], [1300, -330], [-150, -330], [-150, -95], [-1700, -95]]);
  const fieldGround = flatGeo([[-150, -330], [1300, -330], [1300, 1500], [400, 1500], [400, 430], [360, 380], [300, 380], [215, 470], [215, 3340], [-62, 3340], [-62, -40], [-110, -95], [-150, -95]]);
  {
    const r = R.air, shore = [[-1700, -95], [-110, -95], [-62, -40], [-62, 3340], [215, 3340], [215, 470], [300, 380], [360, 380], [400, 430], [400, 1500], [1300, 1500]];
    const rock = new THREE.Color('#5c5a55'), wetRock = new THREE.Color('#25282a');
    for (let s = 0; s < shore.length - 1; s++) {
      const A = shore[s], B = shore[s + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(len / 30)), tx = (B[0] - A[0]) / len, tz = (B[1] - A[1]) / len, ox = -tz, oz = tx;
      let pj = [r.range(-1, 1), r.range(-1.2, 1.2)];
      for (let i = 0; i < n; i++) {
        const j = [r.range(-1, 1), r.range(-1.2, 1.2)], a = i / n, b = (i + 1) / n;
        const ax = A[0] + (B[0] - A[0]) * a, az = A[1] + (B[1] - A[1]) * a, bx = A[0] + (B[0] - A[0]) * b, bz = A[1] + (B[1] - A[1]) * b;
        const c = rock.clone().multiplyScalar(r.range(0.7, 1.15));
        const Ta = [ax + ox * 1.4, -0.35, az + oz * 1.4], Tb = [bx + ox * 1.4, -0.35, bz + oz * 1.4];
        const Ba = [ax + ox * (9 + pj[1]), -7.5, az + oz * (9 + pj[1])], Bb = [bx + ox * (9 + j[1]), -7.5, bz + oz * (9 + j[1])];
        G.quad(Ta, Tb, [bx, 0.02, bz], [ax, 0.02, az], c, 2, i * 0.37);
        G.quad(Ba, Bb, Tb, Ta, wetRock, 2, i * 0.37, c);
        pj = j;
      }
    }
    // terminal, piers, control tower, hangars
    const conc = pal[0].clone().multiplyScalar(0.95), nfT = nearFly(450, 0);
    G.box(428, 474, -300, 330, 0, 13.6, conc, roofs[3], 0.37, 0, 1);
    G.box(436, 466, -120, 140, 13.6, 19.6, conc.clone().multiplyScalar(0.9), roofs[0], 0.71, 0, 1);
    for (let i = 0; i < 3; i++) G.box(396, 428, -214 + i * 170, -202 + i * 170, 3, 8.5, conc, roofs[3], 0.2 + i * 0.1, 3, 2);
    G.box(520, 530, -262, -252, 0, 34, conc.clone().multiplyScalar(0.85), roofs[4], 0.5, 2, 2);
    G.box(517, 533, -265, -249, 34, 38.5, new THREE.Color('#1c2428'), roofs[3], 0.5, 5, 2);
    lamps.push([525, 41, -257, 1, 0.07, 0.03, 1.6, 2, 0.6, 2.2]);
    for (let i = 0; i < 3; i++) { const hz = -250 + i * 190; G.box(610, 720, hz, hz + 150, 0, 20, r.pick(tin).clone().multiplyScalar(0.9), r.pick(tin), r(), 2, 2, r.range(3, 6)); }
    for (let i = 0; i < 6; i++) { const mz = -260 + i * 110; card(412, 0, mz, 0, 1, 6, 28, 4, r()); lamps.push([412, 28.3, mz, 1, 0.72, 0.38, 1.7, 0, r(), 2.2]); }
    // parked wide-bodies, nose-in: fuselage rings, swept wings, fin in a plain colour (no markings)
    let TG = G, TL = lamps;          // where jet() and jetLights() write: the city's own solids and lamps, or (round eight) a small mesh of its own for an aircraft that moves
    const oq = (A, B, C, D, c, rx, ry, rz) => {
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
      const d = (uy * vz - uz * vy) * rx + (uz * vx - ux * vz) * ry + (ux * vy - uy * vx) * rz;
      if (d >= 0) TG.quad(A, B, C, D, c, 5, 0.5); else TG.quad(A, D, C, B, c, 5, 0.5);
    };
    const jet = (px, pz, hx, hz, k, fin) => {      // nose at (px, pz) pointing along (hx, hz)
      const white = new THREE.Color('#d9dad6'), belly = new THREE.Color('#8f959a'), dark = new THREE.Color('#3c4146');
      const P = (s, y, l) => [px - hx * s * k - hz * l * k, y * k, pz - hz * s * k + hx * l * k];
      const st = [[0, 0.35, 4.4], [2.5, 2.1, 4.9], [8, 3.15, 5.3], [46, 3.15, 5.3], [57, 1.7, 6.1], [64, 0.45, 6.9]];
      for (let i = 0; i < st.length - 1; i++) for (let q = 0; q < 8; q++) {
        const a0 = (q + 0.5) / 8 * TAU, a1 = (q + 1.5) / 8 * TAU, am = (a0 + a1) / 2, A = st[i], B = st[i + 1];
        const c = Math.cos(am) < -0.3 ? belly : Math.abs(Math.cos(am)) < 0.3 && i > 0 && i < 4 ? fin : white;
        oq(P(A[0], A[2] + A[1] * Math.cos(a0), A[1] * Math.sin(a0)), P(B[0], B[2] + B[1] * Math.cos(a0), B[1] * Math.sin(a0)), P(B[0], B[2] + B[1] * Math.cos(a1), B[1] * Math.sin(a1)), P(A[0], A[2] + A[1] * Math.cos(a1), A[1] * Math.sin(a1)), c, -hz * Math.sin(am), Math.cos(am), hx * Math.sin(am));
      }
      for (let sd = -1; sd <= 1; sd += 2) {
        const w = [P(21, 4.3, sd * 3), P(34, 4.3, sd * 3), P(46, 6.2, sd * 29.5), P(42, 6.2, sd * 29.5)];
        oq(w[0], w[1], w[2], w[3], white, 0, 1, 0); oq(...w.map((p) => [p[0], p[1] - 0.5 * k, p[2]]), belly, 0, -1, 0);
        const t = [P(55, 6.6, sd * 1.5), P(61.5, 6.6, sd * 1.5), P(64.5, 7.6, sd * 11), P(62, 7.6, sd * 11)];
        oq(t[0], t[1], t[2], t[3], white, 0, 1, 0); oq(...t.map((p) => [p[0], p[1] - 0.3 * k, p[2]]), belly, 0, -1, 0);
        const f = [P(52, 8.2, sd * 0.25), P(61, 8.2, sd * 0.25), P(65.5, 19, sd * 0.25), P(60.5, 19, sd * 0.25)];
        oq(f[0], f[1], f[2], f[3], fin, -hz * sd, 0, hx * sd);
        for (let e = 0; e < 2; e++) {
          const es = 25 + e * 9, el = sd * (10.5 + e * 9.5), c0 = P(es, 0, el), c1 = P(es + 5, 0, el);
          const ex0 = Math.min(c0[0], c1[0]) - 1.2 * k * Math.abs(hz), ex1 = Math.max(c0[0], c1[0]) + 1.2 * k * Math.abs(hz), ez0 = Math.min(c0[2], c1[2]) - 1.2 * k * Math.abs(hx), ez1 = Math.max(c0[2], c1[2]) + 1.2 * k * Math.abs(hx);
          TG.box(ex0, ex1, ez0, ez1, 1.7 * k, 4.1 * k, belly, dark, 0.5, 5, 5);
          oq([ex0, 1.7 * k, ez0], [ex1, 1.7 * k, ez0], [ex1, 1.7 * k, ez1], [ex0, 1.7 * k, ez1], belly, 0, -1, 0);          // round eleven: a nacelle has an underside (the freighter is seen from below as it goes over)
        }
      }
    };
    // the undershoot: the fence along the boulevard, huts in obstacle paint beside the approach lights, a windsock, blue edge lights round the blast pad, the glide path lights
    for (let x = -150; x < 420; x += 30) card(x + 15, 0, -328, 1, 0, 30, 2.9, 5, 0.5);
    const obs = pal[5].clone().multiplyScalar(0.9);
    // (round seven: the undershoot is paved, so the huts beside the approach lights are gone; one stands on the grass strip by the windsock)
    G.box(41, 46.5, -246, -241, 0, 3.2, obs, roofs[3], 0.6, 6, 2); card(43.7, 3.2, -243.5, 1, 0, 2.4, 9, 4, 0.8); lamps.push([43.7, 12.4, -243.5, 1, 0.07, 0.03, 1.4, 2, 0.35, 2.2]);
    for (let z = -66; z <= -6; z += 12) for (const sx of [-1, 1]) lamps.push([sx * 39.6, 0.35, z, 0.1, 0.32, 1, 0.55, 0, z * 0.05, 1.4]);
    for (let i = 0; i < 4; i++) lamps.push([44 + i * 3, 0.7, 318, 1, i < 2 ? 0.92 : 0.1, i < 2 ? 0.8 : 0.06, 1.0, 0, i * 0.2, 1.9]);
    const sock = (mx, my, mz) => {        // five bands of cloth streaming from a mast: the laundry's shader swings it, and the wash of the aircraft kicks it as we pass
      const wx = WIND[0], wz = WIND[1], px = -wz, pz = wx, nf = nearFly(mx, mz), n = 5, L = 4.6, ph = RX();
      const orange = new THREE.Color('#d8581a'), white = new THREE.Color('#d9d5c8');
      card(mx, 0, mz, px, pz, 1.4, my + 0.5, 4, 0.9);
      for (let i = 0; i < n && !cloth.full; i++) {
        const t0 = i / n, t1 = (i + 1) / n, r0 = 0.6 - 0.32 * t0, r1 = 0.6 - 0.32 * t1, c = i % 2 ? white : orange;
        const A = [mx + wx * L * t0, my - 0.3 * t0, mz + wz * L * t0], B = [mx + wx * L * t1, my - 0.3 * t1, mz + wz * L * t1];
        for (let k = 0; k < 2; k++) {
          const ox = k ? px : 0, oy = k ? 0 : 1, oz = k ? pz : 0;
          cloth.put('position', 0, A[0] - ox * r0, A[1] + oy * r0, A[2] - oz * r0); cloth.put('position', 1, A[0] + ox * r0, A[1] - oy * r0, A[2] + oz * r0);
          cloth.put('position', 2, B[0] + ox * r1, B[1] - oy * r1, B[2] + oz * r1); cloth.put('position', 3, B[0] - ox * r1, B[1] + oy * r1, B[2] - oz * r1);
          cloth.put('aL', 0, ph - t0 * 0.12, t0 * 2.6, 0, 0.5); cloth.put('aL', 1, ph - t0 * 0.12, t0 * 2.6, 0, 0.5); cloth.put('aL', 2, ph - t1 * 0.12, t1 * 2.6, 0, 0.5); cloth.put('aL', 3, ph - t1 * 0.12, t1 * 2.6, 0, 0.5);
          cloth.all('normal', 0.3 * px, 0.9, 0.3 * pz); cloth.all('aC', mx, my, mz); cloth.all('aD', nf.tx, nf.tz, px, pz); cloth.all('color', c.r, c.g, c.b); cloth.next();
        }
      }
    };
    sock(47, 8.4, -118); sock(150, 8.4, 700); sock(-58, 8.4, -62);
    const fins = ['#1f4d3a', '#9a2222', '#1f3a70', '#c7a23a', '#5a2a6a', '#d0d0cc'].map(col);
    for (let i = 0; i < 6; i++) { const fc = r.pick(fins), sc = r.range(0.72, 1); if (r.chance(0.78)) jet(392 - r.range(0, 6), -207.5 + i * 85, 1, 0, sc, fc); }
    if (r.chance(0.7)) jet(110, r.range(500, 1500), 0, -1, 0.9, r.pick(fins));       // one taxiing out
    // ---- round five: the last third. A wide-body holds short of the runway beside the threshold with two more queued behind it on the taxiway, a lit pier and the
    // control tower stand on the promontory, and across the typhoon shelter the factory blocks and towers of the far shore flank the runway. All from a stream of its own.
    const RS = ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('cb-shore:' + (ctx.seed ?? 0))) : rng0.fork('shore');
    const jetLights = (px, pz, hx, hz, k) => {
      const P = (s2, y, l) => [px - hx * s2 * k - hz * l * k, y * k, pz - hz * s2 * k + hx * l * k];
      const push = (q, c, size, type, ph, minPx) => TL.push([q[0], q[1], q[2], c[0], c[1], c[2], size, type, ph, minPx]);
      push(P(30, 9.2, 0), [1, 0.07, 0.03], 1.5, 2, RS(), 2.2); push(P(30, 1.6, 0), [1, 0.07, 0.03], 1.2, 2, RS(), 1.8);       // beacons above and below
      push(P(44, 6.6, 29.5), [1, 0.1, 0.06], 0.7, 0, 0.3, 1.5); push(P(44, 6.6, -29.5), [0.1, 1, 0.3], 0.7, 0, 0.6, 1.5); push(P(65, 9, 0), [1, 1, 1], 0.6, 0, 0.9, 1.4);
      push(P(7.5, 1.9, 0), [1, 0.93, 0.8], 1.5, 0, 0.1, 2.2); push(P(22, 4.0, 3.4), [1, 0.93, 0.8], 1.1, 0, 0.4, 1.8); push(P(22, 4.0, -3.4), [1, 0.93, 0.8], 1.1, 0, 0.7, 1.8);       // taxi and turn-off lights
      for (let i = 0; i < 20; i++) if (i % 7 !== 6) for (const sd of [-1, 1]) push(P(9 + i * 2.1, 5.75, sd * 3.2), [1, 0.82, 0.55], 0.26, 3, i * 0.13, 0.9);          // the cabin windows
      push(P(60, 16, 0.5), [1, 0.9, 0.7], 0.5, 3, 0.2, 1.2); push(P(60, 16, -0.5), [1, 0.9, 0.7], 0.5, 3, 0.5, 1.2);          // the lit fin
    };
    jet(47, 30, -1, 0, 1, RS.pick(fins)); jetLights(47, 30, -1, 0, 1);
    for (let i = 0; i < 2; i++) { const nz = 128 + i * 92, sc = RS.range(0.84, 0.95); jet(110, nz, 0, -1, sc, RS.pick(fins)); jetLights(110, nz, 0, -1, sc); }
    await Y();
    // the pier and the tower
    const glass = new THREE.Color('#31404a');
    G.box(152, 200, 112, 470, 0, 15.5, conc, roofs[3], 0.43, 0, 1); G.box(158, 196, 180, 262, 15.5, 27, conc.clone().multiplyScalar(0.92), roofs[0], 0.77, 0, 1); G.box(158, 196, 372, 432, 15.5, 23, conc.clone().multiplyScalar(0.92), roofs[0], 0.27, 0, 1);
    G.box(180, 190, 488, 498, 0, 46, conc.clone().multiplyScalar(0.85), roofs[4], 0.5, 2, 2); G.box(176, 194, 484, 502, 46, 51.5, glass, roofs[3], 0.5, 5, 2);
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) lamps.push([185 + sd * 9.3, 48.8, 486 + i * 4.6, 0.75, 1, 0.86, 0.7, 3, i * 0.21, 1.4]);
    lamps.push([185, 55, 493, 1, 0.07, 0.03, 1.6, 2, 0.15, 2.2]);
    G.box(142, 205, 560, 730, 0, 31, tin[3].clone().multiplyScalar(0.8), tin[5], 0.61, 2, 2, 5);          // the maintenance hangar, its eaves floodlit
    for (let z = 572; z <= 720; z += 18.5) lamps.push([140.5, 29.5, z, 1, 0.78, 0.46, 1.5, 3, z * 0.017, 2.0]);
    for (let i = 0; i < 8; i++) { const mz = 150 + i * 110; card(142, 0, mz, 0, 1, 6, 28, 4, RS()); lamps.push([142, 28.3, mz, 1, 0.72, 0.38, 1.7, 0, RS(), 2.2]); }
    // the stands of the playground under the turn, a row of lamps along each roof
    for (const sd of [-1, 1]) { const z0 = PLAY[1] + sd * 41.5; G.box(PLAY[0] - 52, PLAY[0] + 52, Math.min(z0, z0 + sd * 5), Math.max(z0, z0 + sd * 5), 0, 6.5, conc.clone().multiplyScalar(0.7), roofs[3], 0.31, 2, 2); for (let x = -48; x <= 48; x += 12) lamps.push([PLAY[0] + x, 7.4, z0, 0.92, 0.97, 1, 0.9, 3, x * 0.02, 1.5]); }
    // the far shore: godowns and factory blocks along the water, towers behind them
    const shoreBlocks = [];
    for (let ix = 0; ix < 8; ix++) for (let iz = 0; iz < 10; iz++) {
      const x0 = 414 + ix * 100 + RS.range(0, 14), z0 = 446 + iz * 104 + RS.range(0, 12), w = RS.range(58, 78), d = RS.range(52, 84), roll = RS(), th = RS(), c = plaster(RS), rc = RS.pick(roofs), sd = RS();
      if (roll < 0.1) continue;
      const tall = roll > (ix === 0 ? 0.7 : 0.5), H = tall ? 76 + th * 74 : 22 + 3 * Math.round(th * 9);
      shoreBlocks.push(tall ? [x0, x0 + (24 + th * 10), z0, z0 + 28, H, 1] : [x0, x0 + w, z0, z0 + d, H, 0]);
      if (tall) { const tw = 24 + th * 10; G.box(x0, x0 + tw, z0, z0 + 28, 0, H, c.lerp(pal[0], 0.3), rc, sd, 0, 1); lamps.push([x0 + tw / 2, H + 1.5, z0 + 14, 1, 0.07, 0.03, 1.5, 2, sd, 2.2]); G.box(x0 + tw + 5, x0 + w + 12, z0, z0 + d * 0.8, 0, 16 + 3 * Math.round(th * 4), plaster(RS), rc, sd * 0.7 + 0.1, 0, 1); }
      else G.box(x0, x0 + w, z0, z0 + d, 0, H, c, rc, sd, 0, 1);
    }
    for (let z = 440; z <= 1490; z += 35) lamps.push([404, 8.5, z, 1, 0.62, 0.24, 1.2, 3, z * 0.031, 1.6]);          // the sodium lamps of the shore road
    // round thirteen: the far shore's roofs carry what roofs carry: lift heads and plant rooms, tanks, a mast on the towers, a chimney on one factory block in three
    // (a red lamp on each), a row of lamps under the eaves of the blocks that face the airfield. From a stream of its own.
    {
      const r = ownRng('cb-shore-roofs');
      for (const [x0, x1, z0, z1, H, tall] of shoreBlocks) {
        const n = tall ? 2 : 2 + Math.floor(r() * 3), w = x1 - x0, d = z1 - z0, hc = pal[0].clone().multiplyScalar(r.range(0.5, 0.85));
        for (let i = 0; i < n; i++) {
          const bw = r.range(0.14, 0.34) * w, bd = r.range(0.16, 0.4) * d, bx = r.range(x0 + 1, x1 - 1 - bw), bz = r.range(z0 + 1, z1 - 1 - bd), bh = r.range(3, tall ? 9 : 6.5), sd = r(), rc = r.pick(roofs);
          G.box(bx, bx + bw, bz, bz + bd, H, H + bh, hc.clone().multiplyScalar(0.8 + 0.4 * sd), rc, sd, 2, 1);
          if (r.chance(0.5)) G.tank(bx + bw / 2, bz + bd / 2, Math.min(bw, bd) * 0.3, H + bh, H + bh + r.range(1.6, 3), r.pick(tanks), tanks[0], r());
        }
        const roll = r(), mh = r.range(12, 24), cxr = r.range(x0 + 4, x1 - 4), czr = r.range(z0 + 4, z1 - 4), ph = r();
        if (tall) { card(cxr, H, czr, 0.7, 0.7, 2.2, mh, 4, 0.2 + 0.6 * ph); card(cxr, H, czr, -0.7, 0.7, 2.2, mh, 4, 0.2 + 0.6 * ph); lamps.push([cxr, H + mh + 0.6, czr, 1, 0.07, 0.03, 1.1, 2, ph, 1.8]); }
        else if (roll < 0.34) { G.tank(cxr, czr, 1.9, H, H + mh + 6, hc, hc, ph); lamps.push([cxr, H + mh + 7, czr, 1, 0.07, 0.03, 1.2, 2, ph, 1.9]); }
        if (x0 < 520) for (let z = z0 + 3; z < z1 - 2; z += 9) lamps.push([x0 - 0.6, Math.min(H - 1, 14 + 9 * ph), z, 1, 0.8, 0.5, 1.0, 3, z * 0.013 + ph, 1.5]);
      }
    }
    // floodlights at the corners of the playground under the turn
    for (const [mx, mz] of [[-64, -37], [64, -37], [-64, 37], [64, 37]]) { card(PLAY[0] + mx, 0.2, PLAY[1] + mz, 0.7, 0.7, 1.8, 17, 4, 0.37); lamps.push([PLAY[0] + mx, 17.8, PLAY[1] + mz, 0.92, 0.97, 1, 2.0, 3, mx * 0.01 + mz * 0.003, 2.3]); }
    await Y();
    // ---- round seven: the final is flown over a working airfield. Two wide-bodies wait nose to tail on the taxiway left of the stopway and two more stand nose-in at a cargo
    // shed behind them; two stand on the smaller apron on the harbour side, their noses toward the runway; floodlight masts stand over both aprons (the ground shader
    // lays their pools). Every aircraft carries its beacons, cabin windows and a lit fin. Drawn last from the far shore's stream: nothing older moves.
    for (const [px, pz, hx, hz, k] of [[110, -62, 0, 1, 0.92], [110, -170, 0, 1, 0.86], [214, -130, 1, 0, 0.8], [214, -245, 1, 0, 0.8], [-57, -150, 1, 0, 0.84], [-57, -250, 1, 0, 0.84]]) {
      // round eight: the second aircraft on the taxiway is not parked. It is built at the origin into a mesh of its own (the same draws from the far shore's stream, in the
      // same order) and update() rolls it up the taxiway behind the first while we fly the final; the same mesh, drawn a second time, is the freighter that climbs out over us.
      if (px === 110 && pz === -170) {
        TG = moverGeo; TL = moverLamps; jet(0, 0, 0, 1, k, RS.pick(fins)); jetLights(0, 0, 0, 1, k);
        // seen from below and from in front as it climbs over us: the engines get a floor, a dark intake and a nozzle, the wings and the tailplane their leading and trailing edges
        const belly = new THREE.Color('#8f959a'), dk = new THREE.Color('#15171a'), wh = new THREE.Color('#d9dad6');
        for (const sd of [-1, 1]) {
          for (let e = 0; e < 2; e++) {
            const x0 = (-sd * (10.5 + e * 9.5) - 1.2) * k, x1 = x0 + 2.4 * k, z1 = -(25 + e * 9) * k, z0 = z1 - 5 * k, y0 = 1.7 * k, y1 = 4.1 * k;
            oq([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], belly, 0, -1, 0);
            oq([x0 + 0.3 * k, y0 + 0.3 * k, z1 + 0.03], [x1 - 0.3 * k, y0 + 0.3 * k, z1 + 0.03], [x1 - 0.3 * k, y1 - 0.3 * k, z1 + 0.03], [x0 + 0.3 * k, y1 - 0.3 * k, z1 + 0.03], dk, 0, 0, 1);
            oq([x0 + 0.5 * k, y0 + 0.5 * k, z0 - 0.03], [x1 - 0.5 * k, y0 + 0.5 * k, z0 - 0.03], [x1 - 0.5 * k, y1 - 0.5 * k, z0 - 0.03], [x0 + 0.5 * k, y1 - 0.5 * k, z0 - 0.03], dk, 0, 0, -1);
          }
          const W = (s2, y, l) => [-sd * l * k, y * k, -s2 * k];
          oq(W(21, 4.3, 3), W(42, 6.2, 29.5), W(42, 5.7, 29.5), W(21, 3.8, 3), wh, 0, 0, 1); oq(W(34, 4.3, 3), W(46, 6.2, 29.5), W(46, 5.7, 29.5), W(34, 3.8, 3), belly, 0, 0, -1);
          oq(W(42, 6.2, 29.5), W(46, 6.2, 29.5), W(46, 5.7, 29.5), W(42, 5.7, 29.5), wh, -sd, 0, 0);
          oq(W(55, 6.6, 1.5), W(62, 7.6, 11), W(62, 7.3, 11), W(55, 6.3, 1.5), wh, 0, 0, 1); oq(W(61.5, 6.6, 1.5), W(64.5, 7.6, 11), W(64.5, 7.3, 11), W(61.5, 6.3, 1.5), belly, 0, 0, -1);
        }
        TG = G; TL = lamps;
      }
      else { jet(px, pz, hx, hz, k, RS.pick(fins)); jetLights(px, pz, hx, hz, k); }
      await Y();
    }
    G.box(222, 262, -312, -84, 0, 14, conc, roofs[3], 0.53, 0, 1); G.box(228, 256, -250, -150, 14, 19, conc.clone().multiplyScalar(0.9), roofs[0], 0.21, 0, 1);
    for (let z = -304; z <= -92; z += 17.6) lamps.push([221.2, 12.6, z, 1, 0.78, 0.46, 1.4, 3, z * 0.017, 1.9]);
    for (const z of [-300, -205, -110]) { card(148, 0, z, 0, 1, 6, 28, 4, 0.41 - z * 0.001); lamps.push([148, 28.3, z, 1, 0.72, 0.38, 1.7, 0, 0.3 - z * 0.003, 2.2]); }
    G.box(-84, -76, -82, -75, 0, 3.4, obs, roofs[3], 0.6, 6, 2); card(-80, 3.4, -78.5, 1, 0, 2.4, 9, 4, 0.8); lamps.push([-80, 12.6, -78.5, 1, 0.07, 0.03, 1.4, 2, 0.75, 2.2]); lamps.push([-75.6, 3.0, -78.5, 1, 0.78, 0.46, 1.2, 3, 0.4, 1.8]);          // the glide-path hut on the grass by the threshold
    for (const z of [-300, -200, -100]) { card(-140, 0, z, 0, 1, 6, 28, 4, 0.47 - z * 0.001); lamps.push([-140, 28.3, z, 1, 0.72, 0.38, 1.7, 0, 0.6 - z * 0.003, 2.2]); }
  }
  await Y();
  {
    // the ramp at work: at each aircraft parked on the two aprons beside the stopway a tug stands at the nose, a loader and a train of carts under the hold, a van
    // by the wing, their amber beacons turning; crew walk between them. From a stream of its own (the aircraft's nose, the way it points, its size: the list above).
    const rr = ownRng('cb-ramp'), yel = new THREE.Color('#c9a227'), wht = new THREE.Color('#d8d6cc'), dk = new THREE.Color('#2a2d30'), amber = [1, 0.5, 0.06];
    for (const [px, pz, hx, hz, k] of [[214, -130, 1, 0, 0.8], [214, -245, 1, 0, 0.8], [-57, -150, 1, 0, 0.84], [-57, -250, 1, 0, 0.84]]) {
      const P = (s2, l) => [px - hx * s2 * k - hz * l * k, pz - hz * s2 * k + hx * l * k], sd = rr.chance(0.5) ? 1 : -1;
      const unit = (s2, l, w, d, h, c, ct) => { const [x, z] = P(s2, l); G.box(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, h, c, ct, rr(), 5, 2); lamps.push([x, h + 0.5, z, ...amber, 1.3, 2, rr(), 2.5]); return [x, z]; };
      unit(-7, 0, 4.2, 2.6, 1.9, yel, dk);                                                        // the tug at the nose
      unit(20, sd * 7.5, 7.5, 2.8, 2.6, wht, wht);                                               // the loader at the forward hold, its deck raised
      unit(47, sd * 8, 6.2, 2.6, 3.1, wht, yel);                                                 // a van at the aft door
      for (let i = 0; i < 4; i++) { const [x, z] = P(22 + i * 3.6, sd * 13); G.box(x - 1.5, x + 1.5, z - 1.0, z + 1.0, 0.3, 1.7, i % 2 ? yel : dk, rr.pick(laundry), rr(), 5, 2); }          // the carts
      for (let i = 0; i < 4; i++) { const [x, z] = P(rr.range(-4, 50), sd * rr.range(5, 15)), a = rr.range(0, 6.2832), fs = rr(); figure(x, 0, z, Math.cos(a), Math.sin(a), fs, yel, 1.75, rr.chance(0.6) ? 0.4 : 0); }
    }
  }
  await Y();
  // runway, taxiway and approach lighting; the strobes run from the turn down to the threshold
  {
    const W = [1, 0.92, 0.78], AMB = [1, 0.62, 0.2];
    for (let z = 0; z <= 3300; z += 60) for (let sd = -1; sd <= 1; sd += 2) lamps.push([sd * 31.5, 0.6, z, ...(z > 2700 ? AMB : W), 1.1, 0, z * 0.013, 2.1]);
    for (let z = 30; z < 3300; z += 30) lamps.push([0, 0.25, z, ...W, 0.6, 0, z * 0.017, 1.5]);
    for (let x = -42; x <= 42; x += 3) if (Math.abs(x) > 8.5) lamps.push([x, 0.5, -1, 0.1, 1, 0.32, Math.abs(x) > 30 ? 1.2 : 0.9, 0, x * 0.1, 1.8]);
    for (let x = -30; x <= 30; x += 6) lamps.push([x, 0.5, 3302, 1, 0.05, 0.03, 1, 0, x * 0.1, 1.8]);
    for (let z = 0; z <= 1900; z += 60) for (let sd = -1; sd <= 1; sd += 2) lamps.push([110 + sd * 15.5, 0.4, z, 0.08, 0.25, 1, 0.5, 0, z * 0.02, 1.2]);
    // round five: the rows a wet night runway is made of. Edge lights every 30 m over the first 1.2 km, the touchdown zone's barrettes, the taxiway's blue edges closed up,
    // green centre lights and a red stop bar on the link where the wide-body holds, blue lights along the sea wall on the harbour side.
    for (let z = 30; z <= 1170; z += 60) for (let sd = -1; sd <= 1; sd += 2) lamps.push([sd * 31.5, 0.6, z, ...W, 1.0, 0, z * 0.013, 2.0]);
    for (let z = 60; z <= 900; z += 30) for (let sd = -1; sd <= 1; sd += 2) for (let i = 0; i < 3; i++) lamps.push([sd * (9 + i * 1.5), 0.2, z, ...W, 0.42, 0, z * 0.011 + i, 1.1]);
    for (let z = 30; z <= 1170; z += 60) for (let sd = -1; sd <= 1; sd += 2) lamps.push([110 + sd * 15.5, 0.4, z, 0.08, 0.25, 1, 0.5, 0, z * 0.02, 1.2]);
    for (let x = 40; x <= 94; x += 9) lamps.push([x, 0.25, 30, 0.1, 1, 0.3, 0.45, 0, x * 0.07, 1.2]);
    for (let z = 17; z <= 43; z += 3.25) lamps.push([40.5, 0.3, z, 1, 0.06, 0.03, 0.55, 0, z * 0.09, 1.3]);
    for (let z = -30; z <= 330; z += 15) lamps.push([-58.5, 0.5, z, 0.1, 0.3, 1, 0.6, 0, z * 0.027, 1.5]);
    const chain = [];
    for (let z = -60; z >= -324; z -= 33) {
      const h = 1.5 + (-z - 60) * 0.025;
      for (let x = -4.5; x <= 4.5; x += 1.5) lamps.push([x, h, z, 1, 0.82, 0.54, 0.95, 0, x * 0.2 + z, 1.5]);
      card(0, 0, z, 1, 0, 9, h + 0.25, 4, 0.3);
      chain.push([0, h + 0.7, z]);
    }
    for (let x = -21; x <= 21; x += 3) lamps.push([x, 8.2, -291, 0.86, 0.68, 0.42, 0.5, 0, x * 0.2, 1.0]);          // round fourteen: smaller lamps on the widest bar: fifteen points of light on a gantry (after dark they ran together into one white bar across the stopway)
    for (let x = -13.5; x <= 13.5; x += 3) if (Math.abs(x) > 5) lamps.push([x, 4.0, -159, 0.86, 0.68, 0.42, 0.8, 0, x * 0.2, 1.4]);          // the inner crossbar
    for (let z = -60; z >= -258; z -= 33) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) lamps.push([sd * (9.5 + i * 1.5), 1.2 + (-z - 60) * 0.02, z, 1, 0.07, 0.04, 0.6, 0, z * 0.03 + i, 1.35]);          // red side rows over the last 270 m
    card(0, 0, -291.3, 1, 0, 44, 8.4, 4, 0.6);
    // round seven: two more crossbars (the bars narrow toward the threshold, as a Calvert system's do), amber edge lights down both sides of the stopway every 15 m,
    // the taxiway's blue edges and green centre lights carried back to the fence, blue lights along the aprons' edges
    for (const [z, half] of [[-93, 7.5], [-225, 16.5]]) { const h = 1.5 + (-z - 60) * 0.025; for (let x = -half; x <= half; x += 3) if (Math.abs(x) > 5) lamps.push([x, h, z, 0.86, 0.68, 0.42, 0.8, 0, x * 0.2, 1.4]); card(0, 0, z - 0.3, 1, 0, half * 2 + 2, h + 0.2, 4, 0.6); }
    for (let z = -315; z <= -15; z += 15) for (const sd of [-1, 1]) lamps.push([sd * 31.5, 0.5, z, 1, 0.6, 0.18, 0.85, 0, z * 0.013, 1.7]);
    for (let z = -310; z <= -40; z += 30) for (const sd of [-1, 1]) lamps.push([110 + sd * 15.5, 0.4, z, 0.08, 0.25, 1, 0.5, 0, z * 0.02, 1.2]);
    for (let z = -310; z <= -10; z += 15) lamps.push([110, 0.25, z, 0.1, 1, 0.3, 0.45, 0, z * 0.07, 1.2]);
    for (let z = -310; z <= -56; z += 23) { lamps.push([51.5, 0.4, z, 0.08, 0.25, 1, 0.5, 0, z * 0.02, 1.2]); if (z < -104) lamps.push([-51.5, 0.4, z, 0.08, 0.25, 1, 0.5, 0, z * 0.02 + 0.5, 1.2]); }
    for (let z = -390; z >= -1100; z -= 47.5) {
      for (let x = -2.5; x <= 2.5; x += 2.5) lamps.push([x, 9.4, z, 1, 0.8, 0.52, 0.8, 0, x * 0.2 + z, 1.1]);
      card(0, 0, z, 1, 0, 6, 9.6, 4, 0.5);
      chain.push([0, 10.2, z]);
    }
    // through the turn the strobes stand on rooftop gantries
    const roofAt = (x, z) => { let best = null, bd = 60 * 60; for (const s of pathRoofs) { const d = (s[0] - x) * (s[0] - x) + (s[2] - z) * (s[2] - z); if (d < bd) { bd = d; best = s; } } return best; };
    const L1 = 1000, L2 = TURN_R * -TURN_A0;
    for (let s = L2 - 30; s > -260; s -= 48) {
      let x, z;
      if (s >= 0) { const a = TURN_A0 * (1 - s / L2); x = TURN_C[0] + TURN_R * Math.cos(a); z = TURN_C[1] + TURN_R * Math.sin(a); } else { x = ARC_S[0] + H0[0] * s; z = ARC_S[1] + H0[1] * s; }
      const rf = roofAt(x, z); if (!rf) continue;
      card(rf[0], rf[1], rf[2], H0[1], -H0[0], 5, 6.5, 4, 0.7);
      chain.push([rf[0], rf[1] + 7.1, rf[2]]);
    }
    chain.forEach((c, i) => lamps.push([c[0], c[1], c[2], 0.82, 0.9, 1, 2.2, 1, 0.9 * (1 - i / (chain.length - 1)), 2.4]));
    U.uChain.value.x = chain.length;          // the airfield's ground shader lays each stopway strobe's flash on the pavement under it
    anchorsStrobes.push(...chain.reverse().map((c) => [c[0], c[1], c[2]]));
  }
  await Y();

  // ---------- the roofs under the approach, and the village round the board ----------
  // Everything from here to the pigeons stands on what was built above and draws from streams of its own (the seed and the thing's name or place); the room kept
  // back in the buffers is opened for it here.
  G.max += XQ * 4; cards.max += XC; cloth.max += XL;
  const villageTrees = [];
  {
    // THE ROOFS. Along the ground track of the approach (routeDist: the first straight, the turn, the final as far as the airfield's fence) the roofs are lived on
    // after dark. Every slab top of three to sixteen storeys whose centre lies within SKIM metres of the track has a string of bare bulbs down its length between two
    // posts (the roof's shader lays their pools on the deck by the same measure and the same spacing). An ordinary roof inside that band is a second city: tin rooms along one parapet with a lit window wall toward the deck and a bulb
    // over the door, a tank on a frame, a forest of aerials on the rooms, a line of washing, people, now and then bamboo and net round a room going up. Not in the
    // low quarter before the board, where nothing new stands between the approach and the paint.
    const doorC = new THREE.Color(0.07, 0.055, 0.045), frameC = tin[5].clone().multiplyScalar(0.8);
    let done = 0;
    for (const T of slabTops) {
      const [x0, x1, z0, z1, H, rk, nf, wc] = T, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (H < 12 || H > 58 || Math.min(hx, hz) < 4.4 || routeDist(cx, cz) >= SKIM) continue;          // (above 58 m it is a tower's roof: its plant room stands where the string would hang)
      const alongX = hx >= hz, hl = alongX ? hx : hz, hs = alongX ? hz : hx, lx = alongX ? 1 : 0, lz = alongX ? 0 : 1;
      const at = (l, s) => [cx + lx * l + lz * s, cz + lz * l + lx * s];          // a point on the roof: l along its length, s across it, from its centre
      const nb = Math.max(2, Math.floor(hl / 3.5 + 0.5)), sp = 2 * hl / nb, ph0 = hash2(x0 * 0.13, z0 * 0.29);
      if (rk !== 1) {          // (a caged yard has its own four lamps)
        for (let i = 0; i < nb; i++) { const [px, pz] = at(-hl + (i + 0.5) * sp, 0); lamps.push([px, H + 3.0, pz, 1, 0.82, 0.56, 0.5, 3, ph0 + i * 0.37, 1.25]); }
        for (const e of [-1, 1]) { const [px, pz] = at(e * (hl - 0.7), 0); card(px, H, pz, lz, lx, 0.5, 3.1, 4, 0.3 + 0.4 * ph0); }
      }
      const hab = hillAB(cx, cz), front = hab[0] > LOWQ[0] && hab[0] < LOWQ[1] && Math.abs(hab[1]) < 90;
      // No lit deck stands empty. An ordinary deck of the band that gets no rooms (it is narrow, or lies in the low quarter before the board) and every deck twelve
      // metres wide or more has a second thing down its middle, in the open strip beside the string of bulbs (a fifth of the deck's half width off it; where
      // there are rooms, on the side away from them): a second line of washing, a long planted trough, or a pigeon loft with a bulb over its door; in the low
      // quarter only the trough (knee high: nothing new stands between the approach and the paint). Each is a few quads: the roofs are many. From a stream of its
      // own (the seed and the roof's corner).
      const second = (open) => {
        const r2 = placeRng('cb-deck2', x0, z0), sd2 = open || (r2.chance(0.5) ? 1 : -1), off2 = sd2 * hs * 0.21, k2 = front ? 0.5 : r2(), len2 = Math.min(2 * hl - 4, 5 + 6 * r2());
        if (k2 < 0.42) {          // washing
          const nn = Math.max(3, Math.min(5, Math.floor(len2 / 1.6))), lw = nn * 1.6;
          for (let i = 0; i < nn; i++) { const t = (i + 0.5) / nn - 0.5, [px, pz] = at(t * lw, off2); washing(px, H + 2.25 - 0.3 * (1 - 4 * t * t), pz, lx, lz, r2.range(0.8, 1.3), r2.range(0.8, 1.5), nf.tx, nf.tz, 0, r2, 1); }
          for (const e of [-1, 1]) { const [px, pz] = at(e * (lw / 2 + 0.3), off2); card(px, H, pz, lz, lx, 0.4, 2.5, 4, 0.5); }
        } else if (k2 < 0.8) {          // a long trough of earth, planted
          const [px, pz] = at(r2.range(-0.15, 0.15) * hl, off2), hh = len2 / 2, hlx = lx ? hh : 0.5, hlz = lx ? 0.5 : hh, g = pal[7].clone().multiplyScalar(r2.range(0.6, 1.1));
          G.box(px - hlx, px + hlx, pz - hlz, pz + hlz, H, H + r2.range(0.7, 1.3), new THREE.Color(0.16, 0.11, 0.08), g, r2(), 2, 4);
        } else {          // a pigeon loft: a tin box, a bulb over its door
          const lc2 = r2.range(-0.3, 0.3) * hl, [tx, tz] = at(lc2, off2), c2 = r2.pick(tin).clone().multiplyScalar(r2.range(0.6, 1)), ct2 = r2.pick(tin).clone().multiplyScalar(r2.range(0.6, 1.05)), ws = r2.range(1.4, 2.0), ds = Math.min(r2.range(0.8, 1.0), hs * 0.16);
          G.box(tx - (lx ? ws : ds), tx + (lx ? ws : ds), tz - (lx ? ds : ws), tz + (lx ? ds : ws), H, H + 2.3, c2, ct2, r2(), 2, 2, 0.2);
          const [bx, bz] = at(lc2, off2 - sd2 * (ds + 0.3)); lamps.push([bx, H + 2.1, bz, 1, 0.74, 0.4, 0.6, 3, r2(), 1.4]);
        }
      };
      if (rk === 0 && !wc && (front || hs < 5.5) && !G.full) second(0);
      if (rk !== 0 || wc || front || hs < 5.5 || G.full) continue;
      const r = placeRng('cb-skim', x0, z0);
      const side = r.chance(0.5) ? 1 : -1, n = Math.max(1, Math.min(2 + Math.floor(r() * 2.4), Math.floor(2 * hl / 4.4))), slot = 2 * hl / n, inWash = nf.d < 170 && nf.s > S_TURN && nf.s < S_FIN;
      let tallest = H, tallAt = 0;
      for (let i = 0; i < n; i++) {
        // a room: three tin walls and, toward the deck, a wall with a window and a door; a flat tin roof a hand's breadth over the walls
        const w = r.range(3.0, Math.max(3.1, Math.min(5.8, slot - 0.9))), dd = r.range(2.6, Math.min(3.8, hs - 1.6)), two = r.chance(0.28), h = two ? r.range(4.9, 5.5) : r.range(2.3, 2.9);
        const lc = -hl + (i + 0.5) * slot + r.range(-0.2, 0.2) * (slot - w - 0.6), sc = side * (hs - 0.55 - dd / 2), sd = r(), lit = r(), c = r.pick(tin).clone().multiplyScalar(r.range(0.6, 1.05)), ct = r.pick(tin).clone().multiplyScalar(r.range(0.6, 1.1)), cw = plaster(r).multiplyScalar(0.8);
        const P = (sl, ss) => at(lc + sl * w / 2, sc + ss * dd / 2), y1 = H + h;
        // the four walls, each from a to b with its outward normal on the right hand: toward the deck (-side across), the two ends, the parapet side
        const wallOf = (A, B, nl, ns, col, kind) => G.wall(A[0], A[1], B[0], B[1], H, y1, y1, lx * nl + lz * ns, lz * nl + lx * ns, col, sd, kind, kind === 11 ? 0 : sd * 97, h);
        const q00 = P(-1, -1), q10 = P(1, -1), q11 = P(1, 1), q01 = P(-1, 1);
        // seen from above with x to the right and z toward the reader, a wall runs with its outward normal on its right: for the roof's own axes that is one turn or
        // the other as the roof lies along x or along z, so each wall is given its two ends in the order that suits
        const run = (A, B, nl, ns, col, kind) => { const ox = lx * nl + lz * ns, oz = lz * nl + lx * ns, dxw = B[0] - A[0], dzw = B[1] - A[1]; if (-dzw * ox + dxw * oz > 0) wallOf(A, B, nl, ns, col, kind); else wallOf(B, A, nl, ns, col, kind); };
        run(q00, q10, 0, -1, side > 0 ? cw : c, side > 0 ? 11 : 2); run(q01, q11, 0, 1, side > 0 ? c : cw, side > 0 ? 2 : 11);
        run(q00, q01, -1, 0, c, 2); run(q10, q11, 1, 0, c, 2);
        { const o = 0.25, a = at(lc - w / 2 - o, sc - dd / 2 - o), b = at(lc + w / 2 + o, sc - dd / 2 - o), c2 = at(lc + w / 2 + o, sc + dd / 2 + o), d2 = at(lc - w / 2 - o, sc + dd / 2 + o);
          const up = (b[1] - a[1]) * (d2[0] - a[0]) - (b[0] - a[0]) * (d2[1] - a[1]) >= 0;
          if (up) G.quad([a[0], y1 + 0.05, a[1]], [b[0], y1 + 0.05, b[1]], [c2[0], y1 + 0.05, c2[1]], [d2[0], y1 + 0.05, d2[1]], ct, 2, sd + 0.2); else G.quad([a[0], y1 + 0.05, a[1]], [d2[0], y1 + 0.05, d2[1]], [c2[0], y1 + 0.05, c2[1]], [b[0], y1 + 0.05, b[1]], ct, 2, sd + 0.2); }
        if (lit < 0.8) { const [px, pz] = at(lc + w * 0.22, sc - side * (dd / 2 + 0.35)); lamps.push([px, H + Math.min(h, 2.9) * 0.86, pz, 1, 0.72, 0.38, 0.6, 3, sd, 1.4]); }
        if (y1 > tallest) { tallest = y1; tallAt = lc; }
        const na = 1 + Math.floor(r() * 3.2);          // aerials on the room
        for (let k = 0; k < na; k++) { const a = r.int(0, 3) * 0.785 + r.range(-0.2, 0.2), [px, pz] = at(lc + r.range(-0.4, 0.4) * w, sc + r.range(-0.35, 0.35) * dd); card(px, y1, pz, Math.cos(a), Math.sin(a), 3.0, r.range(4.5, 10.5), 0, r()); }
      }
      const tankR = r(), tankS = r(), tankH = r.range(1.9, 2.6), washR = r(), scafR = r(), folk = 1 + Math.floor(r() * 2.5);
      if (tankR < 0.62) {          // a tank on a frame at the far parapet's end
        const [tx, tz] = at((tankS < 0.5 ? -1 : 1) * (hl - 2.4), -side * (hs - 2.2));
        G.box(tx - 1.5, tx + 1.5, tz - 1.5, tz + 1.5, H, H + 2.1, frameC, frameC, tankS, 3, 2); G.tank(tx, tz, 1.35, H + 2.1, H + 2.1 + tankH, r.pick(tanks), tanks[0], tankS);
      }
      {          // a line of washing down the deck between the bulbs and the far parapet (the aircraft's wash takes some of it where it takes the rest of the quarter's)
        const len = Math.min(2 * hl - 3.5, 6 + 6 * washR), nn = Math.max(3, Math.floor(len / 1.45)), off = -side * hs * 0.42;
        for (let i = 0; i < nn; i++) { const t = (i + 0.5) / nn - 0.5, [px, pz] = at(t * len, off); washing(px, H + 2.3 - 0.35 * (1 - 4 * t * t), pz, lx, lz, r.range(0.6, 1.05), r.range(0.7, 1.5), nf.tx, nf.tz, inWash && r.chance(0.4) ? 1 : 0, r); }
        for (const e of [-1, 1]) { const [px, pz] = at(e * (len / 2 + 0.3), off); card(px, H, pz, lz, lx, 0.4, 2.5, 4, 0.5); }
      }
      if (scafR < 0.24 && tallest > H + 4) { const [px, pz] = at(tallAt, side * (hs - 0.55) - side * 4.1); card(px, H, pz, lx, lz, 7.5, tallest - H + 2.6, 1, scafR * 4); }          // bamboo and net before a two-storey room going up
      for (let i = 0; i < folk; i++) {
        const [px, pz] = at(r.range(-0.7, 0.7) * hl, -side * r.range(0.05, 0.3) * hs), sd = r(), cc = r.pick(laundry).clone().multiplyScalar(r.range(0.65, 1)), walk = r.chance(0.6);
        figure(px, H, pz, lx, lz, sd, cc, r.range(1.6, 1.8), walk ? Math.min(0.5, Math.max(0, hl - Math.abs((px - cx) * lx + (pz - cz) * lz) - 1) / 5) : 0);
      }
      if (hs >= 6 && !G.full) second(-side);
      if (++done % 12 === 0) await Y();
    }
  }
  await Y();
  {
    // THE VILLAGE ROUND THE BOARD (VILLAGE, in the hill's own a and b). Beyond the board's apron a margin of trees stands down both its sides and along its head
    // (the world plants them: anchors.hill.village.trees); beyond the trees a stepped lane climbs each side and another runs along the head, a lamp at every
    // landing; beyond the lanes small houses stand on terraces cut into the slope, one to a landing, each on a retaining wall with its windows toward the valley
    // and a bulb by its door. A shrine with its lamp stands where the head lane meets the board's axis. Each house draws from a stream of its own (the seed and
    // its slot); where one of the squatters' huts already stands, no house is built. Dark housings stand round the eight floodlamps at the board's foot.
    const V = VILLAGE, Ax = -HH[0], Az = -HH[1], Bx = HH[1], Bz = -HH[0], ca = Math.cos(Math.atan(BOARD.slope)) * BOARD.half;
    const wallC = pal[0].clone().multiplyScalar(0.62), roofC = [new THREE.Color('#6b3a2c'), new THREE.Color('#4f5658'), new THREE.Color('#5d6a52'), new THREE.Color('#7a4a35')];
    const house = (slot, a, b, dressed) => {
      const r = ownRng('cb-village:' + slot);
      const wb = r.range(2.5, 3.2), da = r.range(2.2, 2.7), two = r.chance(0.45), hgt = two ? 5.3 : 2.75, ja = r.range(-0.8, 0.8), sd = r(), c = plaster(r).multiplyScalar(0.6), ct = r.pick(roofC).clone().multiplyScalar(r.range(0.7, 1.05)), lit = r(), pitch = r.range(0.5, 0.9);
      const P = (sa, sb) => hillXZ(a + ja + sa * da, b + sb * wb), cxz = P(0, 0);
      if (terraceHuts.some((q) => Math.abs(q[0] - cxz[0]) < q[2] / 2 + 4.6 && Math.abs(q[1] - cxz[1]) < q[3] / 2 + 4.6) || G.full) return;
      const p00 = P(-1, -1), p01 = P(-1, 1), p10 = P(1, -1), p11 = P(1, 1), hs = [p00, p01, p10, p11].map((q) => hillH(q[0], q[1])), lo = Math.min(...hs), yF = Math.max(lo + 0.4, (hs[0] + hs[1]) / 2 - 0.5), y1 = yF + hgt;
      // (a wall runs from its first corner to its second with its outward normal on its right hand, seen from above: the front looks down the slope along +a)
      const wl = (A, B, nx, nz, y0, ya, yb, col, kind, hh) => G.wall(A[0], A[1], B[0], B[1], y0, ya, yb, nx, nz, col, sd, kind, kind === 11 ? 0 : sd * 97, hh);
      wl(p11, p10, Ax, Az, lo - 0.6, yF, yF, wallC, 2, 3); wl(p01, p11, Bx, Bz, lo - 0.6, yF, yF, wallC, 2, 3); wl(p10, p00, -Bx, -Bz, lo - 0.6, yF, yF, wallC, 2, 3);          // the retaining wall under it
      wl(p11, p10, Ax, Az, yF, y1, y1, c, 11, hgt); wl(p01, p11, Bx, Bz, yF, y1 + pitch, y1, c, 11, hgt); wl(p10, p00, -Bx, -Bz, yF, y1, y1 + pitch, c, 11, hgt); wl(p00, p01, -Ax, -Az, yF, y1 + pitch, y1 + pitch, c, 2, hgt);
      { const o = 0.45, e = (sa, sb) => { const q = hillXZ(a + ja + sa * (da + o), b + sb * (wb + o)); return [q[0], y1 + 0.06 + pitch * (1 - sa) / 2 * (1 + o / da), q[1]]; };          // the roof falls toward the valley and overhangs
        const A = e(-1, -1), B = e(1, -1), C = e(1, 1), D = e(-1, 1), up = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]) >= 0;
        if (up) G.quad(A, B, C, D, ct, 2, sd + 0.2); else G.quad(A, D, C, B, ct, 2, sd + 0.2); }
      if (lit < 0.85) { const q = hillXZ(a + ja + da + 0.45, b + (sd - 0.5) * wb); lamps.push([q[0], yF + 2.0, q[1], 1, 0.72, 0.38, 1.25, 3, sd, 2.3]); }
      if (two && lit > 0.2) { const q = hillXZ(a + ja + da + 0.3, b - (sd - 0.5) * wb); lamps.push([q[0], yF + 4.3, q[1], 1, 0.8, 0.5, 0.8, 3, sd + 0.4, 1.7]); }
      // The house's dress, from a stream of its own made after the house's (the seed and its slot). Its roof is no one sheet: a second sheet of tin in another shade
      // is lapped over part of it, or a tarpaulin is weighted down across a leak. On every second terrace (dressed: the
      // caller counts the slots) a water drum stands by the door or a line of washing hangs between two poles before the front wall.
      const rd = ownRng('cb-village-dress:' + slot), tarp = rd.chance(0.45), pc = tarp ? new THREE.Color(rd.pick(['#2b5a94', '#3d6e58', '#8c8f88', '#a9652c', '#34495e'])).multiplyScalar(rd.range(0.7, 1)) : rd.pick(tin).clone().multiplyScalar(rd.range(0.55, 1.05));
      { const o = 0.45, sa0 = rd.range(-1, 0.1), sa1 = Math.min(1, sa0 + rd.range(0.7, 1.4)), sb0 = rd.range(-1, 0), sb1 = Math.min(1, sb0 + rd.range(0.8, 1.5));
        const e = (sa, sb, up) => { const q = hillXZ(a + ja + sa * (da + o), b + sb * (wb + o)); return [q[0], y1 + up + pitch * (1 - sa) / 2 * (1 + o / da), q[1]]; };
        const patch = (s0, s1, t0, t1, up, col, seed) => { const A = e(s0, t0, up), B = e(s1, t0, up), C = e(s1, t1, up), D = e(s0, t1, up), ok = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]) >= 0; if (ok) G.quad(A, B, C, D, col, 2, seed); else G.quad(A, D, C, B, col, 2, seed); };
        patch(sa0, sa1, sb0, sb1, 0.11, pc, sd + 0.55); }
      if (dressed) {
        if (rd.chance(0.5)) { const q = hillXZ(a + ja + da + 0.75, b + (rd.chance(0.5) ? 1 : -1) * wb * 0.75), hq = hillH(q[0], q[1]); G.tank(q[0], q[1], 0.42, hq - 0.3, hq + 0.95, rd.pick(tanks), tanks[0], rd()); }
        else {
          const aw = a + ja + da + 1.5, p0 = hillXZ(aw, b - wb - 0.3), p1 = hillXZ(aw, b + wb + 0.3), yw = Math.max(hillH(p0[0], p0[1]), hillH(p1[0], p1[1])) + 2.2, nn = 3 + Math.floor(rd() * 2.5);
          for (const p of [p0, p1]) card(p[0], hillH(p[0], p[1]) - 0.1, p[1], Ax, Az, 0.4, yw - hillH(p[0], p[1]) + 0.3, 4, 0.5);
          for (let i = 0; i < nn; i++) { const t = (i + 0.5) / nn; washing(p0[0] + (p1[0] - p0[0]) * t, yw - 0.25 * (1 - (2 * t - 1) * (2 * t - 1)), p0[1] + (p1[1] - p0[1]) * t, Bx, Bz, rd.range(0.7, 1.1), rd.range(0.7, 1.3), HH[0], HH[1], 0, rd, 1); }
        }
      }
    };
    const lampPost = (a, b, ph) => { const [x, z] = hillXZ(a, b), h = hillH(x, z); card(x, h - 0.1, z, Bx, Bz, 1.3, 3.5, 4, 0.33 + ph * 0.2); lamps.push([x, h + 3.5, z, 1, 0.7, 0.36, 0.85, 3, ph, 1.8]); };
    for (const sgn of [-1, 1]) {
      for (let i = 0; 30 + i * V.step <= V.a1 - 8; i++) {
        const a = 30 + i * V.step;
        house((sgn > 0 ? 'r' : 'l') + i, a, sgn * V.houseB, i % 2 === 1);
        const [tx, tz] = hillXZ(a + V.step / 2, sgn * V.treeB); villageTrees.push([tx, tz, 0.62 + 0.2 * hash2(tx * 0.3, tz * 0.7)]);
      }
      for (let i = 0; 22 + i * V.step <= V.a1; i++) { const a = 22 + i * V.step; lampPost(a, sgn * (V.laneB + 1.7 + 2.6 * (Math.abs(((a / 19) % 1) - 0.5) * 4 - 1)), i * 0.31 + sgn); }
      { const [tx, tz] = hillXZ(V.headA + 6.5, sgn * (V.treeB - 1)); villageTrees.push([tx, tz, 0.7]); }          // the corner of the margin, where the side row meets the head row
    }
    for (let k = -2; k <= 2; k++) {          // along the head: houses 26 m apart above the lane, trees between them below it, a lamp every twelve metres
      if (k !== 0) house('h' + k, V.headRowA - 1, k * 26 + (k > 0 ? -6 : 6), Math.abs(k) === 1);
      for (const o of [-13, 13]) { if (Math.abs(k * 26 + o) < 8) continue; const [tx, tz] = hillXZ(V.headA + 4.2, k * 26 + o); if (!villageTrees.some((q) => Math.hypot(q[0] - tx, q[1] - tz) < 5)) villageTrees.push([tx, tz, 0.55 + 0.2 * hash2(tx * 0.3, tz * 0.7)]); }
    }
    for (let b = -60; b <= 60; b += 12) lampPost(V.headA - 1.6, b, b * 0.07 + 0.2);
    {          // the shrine: a red box under a roof on the board's axis above its head, its lamp and two small ones at its door
      const [sx, sz] = hillXZ(V.headA + 2.6, 0), sy = hillH(sx, sz), red = new THREE.Color('#a3301c'), gold = new THREE.Color('#c9a227');
      G.box(sx - 1.3, sx + 1.3, sz - 1.1, sz + 1.1, sy - 0.8, sy + 2.3, red, red, 0.31, 5, 5); G.box(sx - 1.9, sx + 1.9, sz - 1.7, sz + 1.7, sy + 2.3, sy + 2.75, gold, wallC, 0.33, 5, 2);
      lamps.push([sx + Ax * 1.6, sy + 1.6, sz + Az * 1.6, 1, 0.3, 0.12, 1.5, 3, 0.4, 2.4], [sx + Ax * 1.5 + Bx * 1.2, sy + 0.7, sz + Az * 1.5 + Bz * 1.2, 1, 0.66, 0.3, 0.5, 3, 0.1, 1.3], [sx + Ax * 1.5 - Bx * 1.2, sy + 0.7, sz + Az * 1.5 - Bz * 1.2, 1, 0.66, 0.3, 0.5, 3, 0.7, 1.3]);
    }
    const dark = new THREE.Color(0.035, 0.036, 0.04);
    for (let i = 0; i < 8; i++) { const [fx, fz] = hillXZ(BOARD.a + ca + 5, (-35 + i * 10) * BOARD.half / 42), fy = hillH(fx, fz); G.box(fx - 0.55, fx + 0.55, fz - 0.4, fz + 0.4, fy + 1.45, fy + 2.05, dark, dark, 0.5, 5, 5); }          // the floodlamps' housings on their posts
  }
  await Y();

  // ---------- pigeons: flocks living on the roofs under the turn and the final ----------
  const birds = new Bag(Math.round(520 * Math.max(0.6, detail)) * 3, { position: 3, aHome: 3, aB: 4, aD: 4 });
  // a bird is three quads (x across, z along its heading): two tapered wings swept back from the shoulder and a narrow body, head forward
  const BIRD_Q = [[[-0.07, 0.26], [-1, -0.04], [-0.9, -0.2], [-0.07, -0.16]], [[0.07, 0.26], [1, -0.04], [0.9, -0.2], [0.07, -0.16]], [[0, 0.44], [-0.1, 0.1], [0, -0.38], [0.1, 0.1]]];
  {
    const r = R.life;
    flockSites.sort((a, b) => a[5] - b[5]);
    const nSites = Math.min(flockSites.length, 18), sites = [];
    for (let i = 0; i < nSites; i++) sites.push(flockSites[Math.floor((i + r()) / nSites * flockSites.length)]);
    sites.push([-194, 44, -1247, 0.2, 0.98, 0], [summit[0], summit[1] + 4, summit[2], 0.6, 0.8, 0]);
    for (const s of sites) {
      const n = r.int(16, 30), fr = r.range(8, 20);
      for (let i = 0; i < n && birds.nq + 3 <= birds.max; i++) {
        const ph = r(), sd = r(), perched = r.chance(0.45) ? 1 : 0, sz = r.range(0.7, 1.0), b1 = fr * r.range(0.6, 1.3), b2 = r.range(3, 15);
        for (const Q of BIRD_Q) {
          for (let c = 0; c < 4; c++) birds.put('position', c, Q[c][0], 0, Q[c][1]);
          birds.all('aHome', s[0], s[1] + 0.6, s[2]); birds.all('aB', ph, b1, b2, sd); birds.all('aD', s[3], s[4], perched, sz); birds.next();
        }
      }
    }
  }
  await Y();
  // ---------- traffic with volume: the last avenue and the boulevard, the closest things the approach passes ----------
  // Unit vehicles (x across, y up, +z the way they travel), one instance each; the vertex shader moves them along
  // their lane, wraps them at its end and shrinks them into the road there. Vertex mark aM: 0 fixed colour, 1 body
  // colour, 2 headlamp, 3 tail lamp, 4 roof colour, 5 glass (lit from inside after dark).
  const vehicleGeo = (deck, F) => {
    const P = [], N = [], C = [], M = [], I = [];
    const quad = (a, b, c, d, n, col, m) => { const o = P.length / 3; for (const q of [a, b, c, d]) { P.push(q[0], q[1], q[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); M.push(m); } I.push(o, o + 1, o + 2, o, o + 2, o + 3); };
    const band = (y0, y1, x, z0, z1, col, m) => {
      quad([-x, y0, z1], [x, y0, z1], [x, y1, z1], [-x, y1, z1], [0, 0, 1], col, m); quad([x, y0, z0], [-x, y0, z0], [-x, y1, z0], [x, y1, z0], [0, 0, -1], col, m);
      quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], [1, 0, 0], col, m); quad([-x, y0, z0], [-x, y0, z1], [-x, y1, z1], [-x, y1, z0], [-1, 0, 0], col, m);
    };
    const top = (y, x, z0, z1, col, m) => quad([-x, y, z1], [x, y, z1], [x, y, z0], [-x, y, z0], [0, 1, 0], col, m);
    const W = [1, 1, 1], DK = [0.03, 0.032, 0.035], GL = [0.06, 0.08, 0.09], LP = [0.45, 0.45, 0.45];
    const lampsAt = (y0, y1) => {
      for (const sx of [-1, 1]) {
        quad([sx * 0.36 - 0.1, y0, 0.504], [sx * 0.36 + 0.1, y0, 0.504], [sx * 0.36 + 0.1, y1, 0.504], [sx * 0.36 - 0.1, y1, 0.504], [0, 0, 1], LP, 2);
        quad([sx * 0.36 + 0.1, y0, -0.504], [sx * 0.36 - 0.1, y0, -0.504], [sx * 0.36 - 0.1, y1, -0.504], [sx * 0.36 + 0.1, y1, -0.504], [0, 0, -1], LP, 3);
      }
    };
    if (!deck) {       // a saloon: sills, body, glasshouse, roof
      band(0, 0.16, 0.46, -0.46, 0.46, DK, 0); band(0.16, 0.6, 0.5, -0.5, 0.5, W, 1); top(0.6, 0.5, -0.5, 0.5, W, 1);
      band(0.6, 0.96, 0.43, -0.3, 0.2, GL, 5); top(0.96, 0.43, -0.3, 0.2, W, 4); lampsAt(0.36, 0.52);
    } else {           // a double-decker, bus or tram: skirt, two rows of windows, roof
      band(0, 0.07, 0.46, -0.47, 0.47, DK, 0); band(0.07, 0.25, 0.5, -0.5, 0.5, W, 1); band(0.25, 0.43, 0.49, -0.495, 0.495, GL, 5); band(0.43, 0.57, 0.5, -0.5, 0.5, W, 4);
      band(0.57, 0.83, 0.49, -0.495, 0.495, GL, 5); band(0.83, 1, 0.5, -0.5, 0.5, W, 1); top(1, 0.5, -0.5, 0.5, W, 4); lampsAt(0.1, 0.18);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 1)); g.setIndex(I);
    g.setAttribute('aO', new THREE.InstancedBufferAttribute(new Float32Array(F.O), 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(F.V), 4));
    g.setAttribute('aSz', new THREE.InstancedBufferAttribute(new Float32Array(F.S), 3)); g.setAttribute('aCa', new THREE.InstancedBufferAttribute(new Float32Array(F.A), 3));
    g.setAttribute('aCb', new THREE.InstancedBufferAttribute(new Float32Array(F.B), 3)); g.instanceCount = F.n;
    return { geo: g, triangles: (I.length / 3) * F.n };
  };
  const fleets = [{ O: [], V: [], S: [], A: [], B: [], n: 0 }, { O: [], V: [], S: [], A: [], B: [], n: 0 }];
  {
    const r = R.life.fork('traffic'), busy = Math.min(1.25, density) * Math.max(0.6, detail);
    const C3 = (h, v = 1) => { const c = new THREE.Color(h); return [c.r * v, c.g * v, c.b * v]; };
    const TAXI = C3('#a8160f'), SILVER = C3('#b9bdc0'), CREAM = C3('#d8cda4'), GREEN = C3('#1f5a34'), TRAM = C3('#1c4a2c'), BUSR = C3('#b3261e'), BUSB = C3('#27508a');
    const PAINTS = ['#c9ccce', '#e6e4dc', '#2a2d33', '#1d2f55', '#7d1a1a', '#8a8f92', '#3f5a48', '#b59a52'];
    const put = (F, ox, oz, dx, dz, at, speed, len, lit, w, h, l, a, b) => { F.O.push(ox, oz, dx, dz); F.V.push(at, speed, len, lit); F.S.push(w, h, l); F.A.push(a[0], a[1], a[2]); F.B.push(b[0], b[1], b[2]); F.n++; };
    // one lane: origin, unit direction, length, speed, share of slots taken, whether buses use it
    const lane = (ox, oz, dx, dz, len, speed, share, buses) => {
      const n = Math.floor(len / 8.5);
      for (let i = 0; i < n; i++) {
        const roll = r(), kind = r(), tint = r.range(0.75, 1.1), jit = r.range(0, 1.6), paint = r.pick(PAINTS);
        if (roll > share * busy) continue;
        const at = i * 8.5 + jit;
        if (buses && kind < 0.13 && i < n - 1) { put(fleets[1], ox, oz, dx, dz, at + 3, speed, len, 1, 2.5, 4.4, 10.4, kind < 0.07 ? BUSR : BUSB, CREAM); i++; }
        else if (kind < 0.5) put(fleets[0], ox, oz, dx, dz, at, speed, len, 0, 1.75, 1.45, 4.5, TAXI, SILVER);
        else if (kind < 0.62) put(fleets[0], ox, oz, dx, dz, at, speed, len, 0.5, 2.0, 2.35, 5.6, CREAM, GREEN);                // a public light bus
        else { const c = C3(paint, tint); put(fleets[0], ox, oz, dx, dz, at, speed, len, 0, 1.8, 1.5, 4.4, c, [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]); }
      }
    };
    const AZ0 = -1090, AZ1 = -372, AL = AZ1 - AZ0, BX = 420, BL = BX * 2, BZ = -348;
    lane(2.1, AZ0, 0, 1, AL, 12, 0.55, false); lane(5.6, AZ0, 0, 1, AL, 9.6, 0.5, true); lane(-2.1, AZ1, 0, -1, AL, 12, 0.55, false); lane(-5.6, AZ1, 0, -1, AL, 9.6, 0.5, true);
    for (const [ac, sp, sh, bus] of [[5, 14, 0.4, false], [8.4, 11.2, 0.5, true], [11.8, 11, 0.5, true]]) { lane(-BX, BZ + ac, 1, 0, BL, sp, sh, bus); lane(BX, BZ - ac, -1, 0, BL, sp, sh, bus); }
    for (let sd = -1; sd <= 1; sd += 2) for (let i = 0; i < 13; i++) {            // the double-deck trams down the middle of the boulevard
      const roll = r(), jit = r.range(0, 20);
      if (roll < 0.5) put(fleets[1], -BX * sd, BZ + 1.6 * sd, sd, 0, i * 64 + jit, 8, BL, 1, 2.1, 4.5, 9.4, TRAM, CREAM);
    }
    // round seven: the airfield's own traffic, drawn after everything older: the service roads of the two aprons beside the stopway and the perimeter road inside the fence
    lane(58, -320, 0, 1, 274, 7, 0.36, false); lane(61.5, -46, 0, -1, 274, 7, 0.36, false);
    lane(-129, -320, 0, 1, 218, 6, 0.36, false); lane(-132.5, -102, 0, -1, 218, 6, 0.36, false);
    lane(-150, -316.3, 1, 0, 570, 10, 0.3, false); lane(420, -319.7, -1, 0, 570, 10, 0.3, false);
    // the airfield's service vehicles: tugs and vans in yellow and white with an amber beacon turning on the roof, in the gaps of the traffic on the two apron roads
    // and the perimeter road (same lanes, same speeds: each keeps its gap). From a stream of their own; a service vehicle is marked by lit >= 2 (the fraction is
    // its beacon's phase), which the vehicle's shader and the road-light sheet read.
    { const sv = ownRng('cb-service'), YEL = C3('#c9a227'), WHT = C3('#d8d6cc'), F = fleets[0];
      const service = (ox, oz, dx, dz, len, speed, n) => {
        const taken = [];
        for (let k = 0; k < F.n; k++) if (F.O[k * 4] === ox && F.O[k * 4 + 1] === oz && F.O[k * 4 + 2] === dx && F.O[k * 4 + 3] === dz) taken.push(F.V[k * 4]);
        for (let i = 0; i < n; i++) {
          const at = (i + 0.1 + 0.8 * sv()) / n * len, van = sv() < 0.5, ph = sv();
          if (taken.some((t) => Math.abs(t - at) < 7 || Math.abs(Math.abs(t - at) - len) < 7)) continue;          // the lane decides: no gap, no vehicle
          taken.push(at); put(F, ox, oz, dx, dz, at, speed, len, 2 + 0.9 * ph, van ? 2.0 : 1.7, van ? 2.2 : 1.5, van ? 5.4 : 3.6, van ? WHT : YEL, YEL);
        }
      };
      service(58, -320, 0, 1, 274, 7, 7); service(61.5, -46, 0, -1, 274, 7, 7); service(-129, -320, 0, 1, 218, 6, 6); service(-132.5, -102, 0, -1, 218, 6, 6);
      service(-150, -316.3, 1, 0, 570, 10, 12); service(420, -319.7, -1, 0, 570, 10, 12); }
  }
  const VEH_VDECL = 'attribute vec4 aO; attribute vec4 aV; attribute vec3 aSz; attribute vec3 aCa; attribute vec3 aCb; attribute float aM; uniform float uTime, uHead, uDark; varying vec3 vP; varying vec3 vN0; varying vec3 vVE; varying vec2 vWn;';
  const VEH_VMAIN = /* glsl */`
{
  float cbS = mod(aV.x + uTime*aV.y, aV.z);
  float cbK = smoothstep(0., 9., cbS)*(1. - smoothstep(aV.z - 9., aV.z, cbS));
  vec3 q = position*aSz*cbK;
  vec2 dr = aO.zw, sd = vec2(dr.y, -dr.x);
  float al = cbS + q.z;
  transformed = vec3(aO.x + dr.x*al + sd.x*q.x, q.y + 0.03, aO.y + dr.y*al + sd.y*q.x);
  vec3 nr = vec3(dr.x*normal.z + sd.x*normal.x, normal.y, dr.y*normal.z + sd.y*normal.x);
  vNormal = normalize(normalMatrix*nr);
  vColor.rgb = (aM > 0.5 && aM < 1.5 ? aCa : aM > 3.5 && aM < 4.5 ? aCb : color)*0.8;
  vVE = aM > 1.5 && aM < 2.5 ? vec3(1.0, 0.9, 0.68)*(0.4 + 2.4*uHead) : aM > 2.5 && aM < 3.5 ? vec3(1.0, 0.05, 0.02)*(0.4 + 1.6*uHead) : aM > 4.5 ? vec3(1.0, 0.7, 0.38)*(0.6*uDark*min(aV.w, 1.)) : vec3(0.);
  if (aV.w > 1.5 && aM > 3.5 && aM < 4.5) { float cbB = 0.5 + 0.5*sin(uTime*5.2 + aV.w*40.); vVE = vec3(1.0, 0.5, 0.04)*(0.5 + 2.6*cbB*cbB*cbB); }          // a service vehicle's beacon: its roof bar pulses amber, once in a little over a second
  vWn = vec2(abs(normal.z) > 0.5 ? position.x*aSz.x : position.z*aSz.z, aM > 4.5 ? 1. : 0.);
  vP = transformed; vN0 = nr;
}
`;
  const mVehicle = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }), 'vehicle', { vdecl: VEH_VDECL, vmain: VEH_VMAIN, fdecl: 'varying vec3 vVE; varying vec2 vWn;',
    fcol: 'vec3 cbAlb = diffuseColor.rgb; float cbPil = mix(1., smoothstep(0.07, 0.13, abs(fract(vWn.x/1.3) - 0.5)), vWn.y); float cbRough = mix(0.38, 0.12, vWn.y*cbPil); cbAlb = mix(vec3(0.16), cbAlb, cbPil); vec3 cbEmi = vVE*cbPil + cbAlb*uSky*0.5 + cbAlb*uPoolCol*cbPool(vP.xz)*0.6; diffuseColor.rgb = cbAlb*cbShade(vP.xz);' });
  // the light the lamps throw on the wet road: one additive sheet ahead of every vehicle and a red one behind it (and a third: the amber light a service vehicle's beacon lays on the road round it)
  const poolGeo = (() => {
    const g = new THREE.InstancedBufferGeometry(), P = [], Q = [], I = [], cat = (k, n) => new THREE.InstancedBufferAttribute(new Float32Array(fleets[0][k].concat(fleets[1][k])), n);
    for (let kind = 0; kind < 3; kind++) { const o = kind * 4; P.push(kind, 0, 0, kind, 0, 0, kind, 0, 0, kind, 0, 0); Q.push(-1, 0, 1, 0, 1, 1, -1, 1); I.push(o, o + 1, o + 2, o, o + 2, o + 3); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
    g.setAttribute('aO', cat('O', 4)); g.setAttribute('aV', cat('V', 4)); g.setAttribute('aSz', cat('S', 3)); g.instanceCount = fleets[0].n + fleets[1].n;
    return g;
  })();
  const vehicles = fleets.map((F, i) => vehicleGeo(i === 1, F));
  await Y();
  const FOGF = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float cbFog = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float cbFog = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    float cbFog = 0.0;
  #endif`;
  const POOLF = 'uniform vec4 uPool[3]; float cbPool1(vec2 p, vec4 k){ vec2 d = (p - k.xy)/max(k.z, 1.); float q = dot(d, d); return k.w*exp(-q*q*1.3); } float cbPool(vec2 p){ return cbPool1(p, uPool[0]) + cbPool1(p, uPool[1]) + cbPool1(p, uPool[2]); }';
  const shaderMat = (o) => { const m = new THREE.ShaderMaterial({ ...o, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]) }); Object.assign(m.uniforms, U); return m; };
  const mRoadLight = shaderMat({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
    vertexShader: /* glsl */`
      attribute vec4 aO; attribute vec4 aV; attribute vec3 aSz; attribute vec2 aQ; uniform float uTime;
      varying vec2 vQ; varying vec3 vK;
      #include <fog_pars_vertex>
      void main(){
        float cbS = mod(aV.x + uTime*aV.y, aV.z);
        float kind = position.x, hl = aSz.z*0.5;
        float k01 = min(kind, 1.), cbB = 0.5 + 0.5*sin(uTime*5.2 + aV.w*40.);
        vec2 q = vec2(aQ.x*mix(2.6, 1.5, k01), mix(mix(hl - 0.5, hl + 13., aQ.y), mix(0.3 - hl, -hl - 3.4, aQ.y), k01));
        if (kind > 1.5) q = vec2(aQ.x, aQ.y*2. - 1.)*6.5*step(1.5, aV.w);
        vec2 dr = aO.zw, sd = vec2(dr.y, -dr.x);
        float al = cbS + q.y;
        vQ = aQ; vK = vec3(kind, smoothstep(0., 9., cbS)*(1. - smoothstep(aV.z - 9., aV.z, cbS)), 0.3 + 0.7*cbB*cbB*cbB);
        vec4 mvPosition = modelViewMatrix*vec4(aO.x + dr.x*al + sd.x*q.x, 0.1, aO.y + dr.y*al + sd.y*q.x, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uHead; varying vec2 vQ; varying vec3 vK;
      #include <fog_pars_fragment>
      void main(){
        float x = vQ.x, t = vQ.y, w = 0.26 + 0.6*t;
        float head = exp(-x*x/(w*w))*smoothstep(0., 0.07, t)*(1. - t)*(1. - t);
        float tail = exp(-x*x*3.)*smoothstep(0., 0.12, t)*(1. - t)*(1. - t);
        vec3 c = vK.x < 0.5 ? vec3(1.0, 0.86, 0.6)*head*0.42 : vec3(1.0, 0.06, 0.03)*tail*0.3;
        c *= 1. - smoothstep(0.7, 1., abs(x));
        if (vK.x > 1.5) { float r2 = x*x + (2.*t - 1.)*(2.*t - 1.); c = vec3(1.0, 0.5, 0.06)*exp(-r2*3.2)*(1. - smoothstep(0.7, 1., r2))*0.8*vK.z; }
        ${FOGF}
        gl_FragColor = vec4(c*uHead*vK.y*(1. - 0.85*cbFog), 1.);
      }`,
  });
  const mBird = shaderMat({
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aHome; attribute vec4 aB; attribute vec4 aD; uniform float uTime; uniform vec4 uWake;
      varying float vSeed; varying float vWing; varying float vHead; varying vec3 vP;
      #include <fog_pars_vertex>
      void main(){
        vec2 dw = uWake.xz - aHome.xz; float cs = dot(dw, aD.xy); vec2 l2 = dw - aD.xy*cs;
        float reach = exp(-dot(l2, l2)/(180.*180.))*uWake.w;
        float tt = (cs + 240. + 70.*aB.w)/75.;
        float up = smoothstep(0., 0.5 + aB.w, tt)*(1. - smoothstep(9., 15., tt))*reach;
        float perched = aD.z*(1. - smoothstep(0., 0.15, up));
        float dirn = aB.w > 0.5 ? 1. : -1.;
        float ang = aB.x*6.2832 + (uTime*(0.3 + 0.35*aB.w) + clamp(tt, 0., 12.)*1.2*reach)*dirn;
        float rad = aB.y*(1. + 1.7*up)*(1. - 0.78*perched);
        float fl = 1. - perched;
        vec3 c = aHome + vec3(cos(ang)*rad, aB.z*fl + up*(8. + 12.*aB.w) + sin(ang*2.3 + aB.x*40.)*1.8*fl, sin(ang)*rad);
        vec2 hd = vec2(-sin(ang), cos(ang))*dirn; vec2 sd = vec2(hd.y, -hd.x);
        float flap = sin(uTime*(9. + 7.*up + 4.*aB.w) + aB.x*50.)*fl;
        vec3 lp = position*aD.w*0.85;
        vec3 wp = c + vec3(sd.x*lp.x + hd.x*lp.z, abs(lp.x)*(flap*0.75 + 0.12), sd.y*lp.x + hd.y*lp.z);
        vSeed = aB.x; vWing = abs(position.x); vHead = position.z; vP = wp;
        vec4 mvPosition = modelViewMatrix*vec4(wp, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky, uPoolCol; varying float vSeed; varying float vWing; varying float vHead; varying vec3 vP;
      ${POOLF}
      #include <fog_pars_fragment>
      void main(){
        vec3 base = mix(vec3(0.13, 0.14, 0.16), vec3(0.62), step(0.6, fract(vSeed*7.3)))*(1. - 0.35*vWing);
        base *= 1. - 0.5*smoothstep(0.18, 0.4, vHead)*(1. - smoothstep(0.08, 0.2, vWing));          // the head end of the body is darker
        gl_FragColor = vec4(base*(uSky*1.6 + 0.2) + base*uPoolCol*cbPool(vP.xz)*0.8, 1.);
        #include <fog_fragment>
      }`,
  });
  // lamps: camera-facing glows that never shrink below a pixel or two; type 0 steady, 1 running strobe, 2 red beacon
  const lampBag = new Bag(lamps.length, { position: 3, aCorner: 2, aCol: 3, aS: 4 });
  for (const l of lamps) {
    lampBag.all('position', l[0], l[1], l[2]); lampBag.all('aCol', l[3], l[4], l[5]); lampBag.all('aS', l[6], l[7], l[8], l[9]);
    lampBag.put('aCorner', 0, -1, -1); lampBag.put('aCorner', 1, 1, -1); lampBag.put('aCorner', 2, 1, 1); lampBag.put('aCorner', 3, -1, 1); lampBag.next();
  }
  const mLamp = shaderMat({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec2 aCorner; attribute vec3 aCol; attribute vec4 aS; uniform float uTime, uStrobe, uLamp, uDark; uniform vec2 uRes;
      varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
        float size = aS.x*2.4;
        float px = size*projectionMatrix[1][1]*uRes.y*0.5/max(-mvPosition.z, 0.1);
        float capK = min(1., 0.028*uRes.y/max(px, 1e-3)); size *= capK; px *= capK;          // a lamp close to the eye stays a lamp: never a disc wider than a fifteenth of the frame
        float k = max(1., aS.w*2.4/max(px, 1e-3));
        float I = max(1./(k*k), 0.04);
        float b = 0.9 + 0.1*sin(uTime*7. + aS.z*40.);
        if (aS.y > 0.5 && aS.y < 1.5) { float f = fract(uTime*0.8 - aS.z); b = (smoothstep(0., 0.05, f)*(1. - smoothstep(0.05, 0.3, f))*1.7 + 0.05)*uStrobe; }
        else if (aS.y > 2.5) { b *= 0.15 + 0.85*uDark; }
        else if (aS.y > 1.5) { b = 0.55 + 0.45*sin(uTime*2.1 + aS.z*6.2832); }
        else { b *= uLamp; }
        vCol = aCol*b*I*(0.3 + 0.7*capK); vC = aCorner;
        mvPosition.xy += aCorner*size*k;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying vec3 vCol;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vC, vC);
        float I = exp(-r2*8.)*0.4 + exp(-r2*45.)*4.;
        I *= 1. - smoothstep(0.7, 1., r2);
        ${FOGF}
        gl_FragColor = vec4(vCol*I*(1. - 0.85*cbFog), 1.);
      }`,
  });
  // the shafts of storm light standing on the pools
  const shaftGeo = (() => {
    const nr = 28, nl = 6, pos = [], bm = [], idx = [];
    for (let b = 0; b < 3; b++) {
      const o = pos.length / 3;
      for (let j = 0; j <= nl; j++) for (let i = 0; i <= nr; i++) { const a = (i / nr) * TAU; pos.push(Math.cos(a), j / nl, Math.sin(a)); bm.push(b); }
      for (let j = 0; j < nl; j++) for (let i = 0; i < nr; i++) { const k = o + j * (nr + 1) + i; idx.push(k, k + nr + 1, k + 1, k + 1, k + nr + 1, k + nr + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBeam', new THREE.Float32BufferAttribute(bm, 1)); g.setIndex(idx);
    return g;
  })();
  const mShaft = shaderMat({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aBeam; uniform vec4 uPool[3]; uniform vec3 uSunDir;
      varying vec3 vNv; varying vec3 vVv; varying float vT; varying float vI; varying vec2 vA; varying float vBm;
      #include <fog_pars_vertex>
      void main(){
        vec4 k = aBeam < 0.5 ? uPool[0] : aBeam < 1.5 ? uPool[1] : uPool[2];
        float y0 = aBeam < 0.5 ? 30. : 0.;
        float t = position.y; vec3 rd = vec3(position.x, 0., position.z);
        vec3 lp = vec3(k.x, y0, k.y) + uSunDir*(t*700.) + rd*k.z*(0.55 + 0.8*t);
        vec4 mvPosition = modelViewMatrix*vec4(lp, 1.);
        // the cone's own normal (it flares from 0.55 to 1.35 of the pool over 700 m): at the true silhouette the beam fades to nothing
        vec3 dT = uSunDir*700. + rd*(k.z*0.8); vec3 dA = vec3(-position.z, 0., position.x);
        vNv = normalMatrix*normalize(cross(dA, dT)); vVv = -mvPosition.xyz; vT = t; vI = k.w; vA = position.xz; vBm = step(0.5, aBeam);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPoolCol; uniform float uTime, uBeam; varying vec3 vNv; varying vec3 vVv; varying float vT; varying float vI; varying vec2 vA; varying float vBm;
      #include <fog_pars_fragment>
      void main(){
        float f = abs(dot(vNv/max(length(vNv), 1e-5), vVv/max(length(vVv), 1e-5)));
        float st = 0.72 + 0.28*sin(vA.x*7. + vA.y*11. + sin(vA.y*5. + uTime*0.06)*2.);
        float I = smoothstep(0.0, 0.55, f)*f*pow(max(1. - vT, 0.), 1.3)*smoothstep(0., 0.14, vT)*vI*st;
        I *= mix(1., smoothstep(150., 500., length(vVv)), vBm);          // the two drifting beams thin out near the eye: we never look through a wall of light from close by
        ${FOGF}
        gl_FragColor = vec4(uPoolCol*I*0.15*uBeam*(1. - 0.6*cbFog), 1.);
      }`,
  });
  await Y();
  // round eight: the floodlights' beams in the wet air, after dark: from each mast before the board's foot a fan of light reaching fifty metres up the slope, rain falling through it
  const beamGeo = (() => {
    const P = [], Q = [], I = [], ca = U.uBoard.value.z, tilt = Math.cos(Math.atan(BOARD.slope));
    for (const m of boardMasts) {
      for (const [reach, half] of [[52, 13], [30, 20]]) {
        const a = BOARD.a + ca - reach * tilt, o = P.length / 3;
        P.push(m[0], m[1], m[2]);
        for (const sd of [-1, 1]) { const [x, z] = hillXZ(a, m[3] + sd * half); P.push(x, BOARD.h - (a - BOARD.a) * BOARD.slope + 0.6, z); }
        Q.push(0, 0, 1, -1, 1, 1); I.push(o, o + 1, o + 2);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
    return g;
  })();
  const mBeam = shaderMat({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aQ; varying vec2 vQ;
      #include <fog_pars_vertex>
      void main(){
        vQ = aQ;
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFlood; varying vec2 vQ;
      #include <fog_pars_fragment>
      void main(){
        float t = clamp(vQ.x, 0., 1.), x = vQ.y/max(vQ.x, 1e-3);
        float I = pow(1. - t, 1.3)*smoothstep(0.0, 0.05, t)*(1. - smoothstep(0.2, 1., abs(x)));
        I *= 0.72 + 0.28*sin(t*46. + x*7. + uTime*5.) * sin(x*23. + t*9. - uTime*1.7);
        ${FOGF}
        gl_FragColor = vec4(vec3(1.0, 0.74, 0.44)*I*0.85*uFlood*(1. - 0.6*cbFog), 1.);
      }`,
  });
  // round nine: the beacon's two beams, turning once in twelve seconds through the wet air: each a pair of crossed sheets that widen with distance, brightest when they
  // point along the line of sight. One additive mesh, moved in its vertex shader (position = beam, sheet); a tenth of their strength by day.
  const lmBeamGeo = (() => {
    const P = [], Q = [], I = [], n = 6;
    for (let b = 0; b < 2; b++) for (let sh = 0; sh < 2; sh++) {
      const o = P.length / 3;
      for (let i = 0; i <= n; i++) { P.push(b, sh, 0, b, sh, 0); Q.push(i / n, -1, i / n, 1); if (i < n) { const a = o + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
    return g;
  })();
  const lmPh = (ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('cb-beam:' + (ctx.seed ?? 0)))() : 0.37) * 6.2832;          // where the beams point when the world starts: a draw of their own
  const mLmBeam = shaderMat({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aQ; uniform float uTime; varying vec2 vQ; varying float vK;
      #include <fog_pars_vertex>
      void main(){
        float ang = uTime*0.52 + ${lmPh.toFixed(3)} + position.x*3.14159265;
        vec3 dir = vec3(sin(ang)*0.9985, -0.055, cos(ang)*0.9985);
        vec3 side = position.y < 0.5 ? vec3(dir.z, 0., -dir.x) : vec3(0., 1., 0.);
        vec3 lp = vec3(${LM[0].toFixed(1)}, ${LM_LAMP_Y.toFixed(1)}, ${LM[1].toFixed(1)}) + dir*(5. + aQ.x*600.) + side*(aQ.y*(4.5 + aQ.x*34.));
        vec4 wp = modelMatrix*vec4(lp, 1.);
        vec3 te = cameraPosition - wp.xyz; te /= max(length(te), 1e-3);
        float al = abs(dot(te, dir)); al *= al;
        // each beam is two crossed sheets of lit air; a sheet seen on its edge is a hair line, not light, so each shows by as much as it faces the eye
        float fc = smoothstep(0.05, 0.4, abs(dot(te, position.y < 0.5 ? vec3(0., 1., 0.) : vec3(dir.z, 0., -dir.x)/0.9985)));
        vK = 0.45*mix(fc, 1., al) + 1.5*al*al; vQ = aQ;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uDark; varying vec2 vQ; varying float vK;
      #include <fog_pars_fragment>
      void main(){
        float t = clamp(vQ.x, 0., 1.), x = vQ.y;
        // a beam is lit air, and lit air is brightest at its lamp: a short soft flare at the lantern that fades along the beam's own length (a third of its
        // strength 11 m out, a tenth at 23 m, nothing to see beyond 50 m) with a broad core, never a line: wherever any of it shows it hangs on the lantern that throws it
        float I = min(3.0*exp(-t*60.)*(exp(-x*x*3.2) + 0.8*exp(-x*x*12.)), 3.4)*smoothstep(0., 0.006, t)*(1. - t);
        I *= 0.86 + 0.14*sin(t*70. - uTime*4. + x*3.);
        ${FOGF}
        gl_FragColor = vec4(vec3(1.0, 0.8, 0.5)*I*vK*(0.1 + 0.9*uDark)*0.5*(1. - 0.6*cbFog), 1.);
      }`,
  });

  // ---------- assemble ----------
  const object = new THREE.Group(); object.name = 'checkerboard-approach';
  const big = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5000);
  const add = (geo, mat, order = 0) => { geo.boundingSphere = big; const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false; object.add(m); return m; };
  add(cityGround, mGround); add(fieldGround, mField); add(hillGeo, mHill);
  await Y();
  // G.build() without the copies: the attributes are views of G's own arrays, which nothing writes to after this point (five copies of 2 to 4 MB and the index were
  // steps of 10 to 135 ms here: fresh memory by the megabyte in the middle of the build), still with a yield after each
  const solidGeo = new THREE.BufferGeometry();
  for (const [name, arr, size] of [['position', G.p, 3], ['normal', G.n, 3], ['color', G.c, 3], ['aF', G.f, 4], ['aG', G.g, 2]]) { solidGeo.setAttribute(name, new THREE.BufferAttribute(arr.subarray(0, G.nv * size), size)); await Y(); }
  solidGeo.setIndex(new THREE.BufferAttribute(G.i.subarray(0, G.ni), 1));
  const solids = add(solidGeo, mFacade);
  await Y();
  add(cards.build(), mCard); await Y(); add(cloth.build(), mCloth);
  await Y();
  add(birds.build(), mBird); add(shaftGeo, mShaft, 3); add(beamGeo, mBeam, 3); add(lmBeamGeo, mLmBeam, 3); add(lampBag.build(), mLamp, 4);
  for (const v of vehicles) add(v.geo, mVehicle);
  add(poolGeo, mRoadLight, 2);
  await Y();
  // round eight: the two aircraft that move. One geometry (a wide-body built at the origin, nose toward +Z) drawn twice: taxiing up behind the one that holds short, and
  // climbing out over the city toward us (the freighter of the night look's title). Each has its lamps in a mesh of its own, moved with it; the freighter's has its
  // landing lights burning in the wing roots and a strobe on each tip.
  const lampGeoOf = (list) => { const b = new Bag(list.length, { position: 3, aCorner: 2, aCol: 3, aS: 4 });
    for (const l of list) { b.all('position', l[0], l[1], l[2]); b.all('aCol', l[3], l[4], l[5]); b.all('aS', l[6], l[7], l[8], l[9]); b.put('aCorner', 0, -1, -1); b.put('aCorner', 1, 1, -1); b.put('aCorner', 2, 1, 1); b.put('aCorner', 3, -1, 1); b.next(); }
    return b.build(); };
  const moverSolid = moverGeo.build(), MK = MOVER_K;
  const flyLamps = moverLamps.concat([[4.2 * MK, 3.9 * MK, -20.5 * MK, 1, 0.96, 0.86, 3.4, 0, 0.2, 3.2], [-4.2 * MK, 3.9 * MK, -20.5 * MK, 1, 0.96, 0.86, 3.4, 0, 0.6, 3.2], [0, 2.0 * MK, -6.5 * MK, 1, 0.96, 0.86, 2.2, 0, 0.4, 2.6],
    [29.5 * MK, 6.4 * MK, -45 * MK, 1, 1, 1, 1.5, 1, 0.1, 2.2], [-29.5 * MK, 6.4 * MK, -45 * MK, 1, 1, 1, 1.5, 1, 0.1, 2.2]]);
  const taxiJet = add(moverSolid, mFacade), taxiJetLamps = add(lampGeoOf(moverLamps), mLamp, 4);
  await Y();
  const flyJet = add(moverSolid, mFacade), flyJetLamps = add(lampGeoOf(flyLamps), mLamp, 4);
  // a third: the departure. It stands lined up down the runway while we fly the run-in, is released as we begin our turn and rolls while we come round it, lifts
  // off as we roll out onto the final and climbs out in a turn over the harbour as we come to the threshold: its place is a function of how far the eye has come
  // north from the place the turn begins (placeDep), no clock. Every length in it is a place: it waits where the runway's close edge lights end (the first 1.2 km),
  // its wheels leave the runway at the runway's middle, and they leave it when the eye is at the end of the turn's arc (TURN_C's z); between the two it gathers
  // speed evenly from rest, and from there it keeps the speed it left with. Its nose comes up over two of its own lengths either side of that place.
  const depJet = add(moverSolid, mFacade), depJetLamps = add(lampGeoOf(moverLamps.concat(flyLamps.slice(-2))), mLamp, 4);
  const mvM = new THREE.Matrix4(), mvX = new THREE.Vector3(), mvY = new THREE.Vector3(), mvZ = new THREE.Vector3(), mvP = new THREE.Vector3(), mvS = new THREE.Vector3(1.25, 1.25, 1.25);
  // the taxiing aircraft: its nose from z -262 (tail just inside the fence) to its place 49 m behind the first, as the eye comes down the final (a function of where the eye is: no clock)
  const placeTaxi = (camZ) => { const t = Math.min(1, Math.max(0, (camZ + 900) / 900)); mvM.makeTranslation(110, 0, -262 + 92 * t); taxiJet.matrix.copy(mvM); taxiJetLamps.matrix.copy(mvM); taxiJet.matrixWorldNeedsUpdate = true; taxiJetLamps.matrixWorldNeedsUpdate = true; };
  // the freighter: off the runway beyond the threshold in the opening seconds, climbing out over the avenue toward the approach.
  // Round eleven: its crossing is tied to the ROUTE and it flies the whole of it as an aircraft does. It keeps one track in the world (FLY_X, FLY_Y: functions of its own
  // z: 30 m right of the runway's line over the field, round the beacon tower's right side, then across the avenue to pass 22 m left of our line; 56 m up over the
  // fence and from there a steady five-degree climb) and one speed, 1.35 times ours, the opposite way, before and after the pass; and the two aircraft are abeam where
  // our approach rolls out of its bank: the end of the arc, FLY_U_OUT, from the approach line's own lengths. So it is a light beside the ring from the middle of the
  // bank, comes up the avenue head-on, lamps burning, whole in the frame until its nose is about a hundred metres ahead, and goes out through the top of the frame
  // over our left wing, 38 m above the eye (lower, it was a flat grey belly at point-blank range for half a second).
  // Round sixteen: the two are abeam one freighter's length past the place where our own wing has left the frame, not at the roll-out point (there they were one pale
  // tangle for half a second). The wing is gone where the bank's measure falls under BANK.off: BANK.half * (1 - 2 * BANK.off) metres past the end of the arc (6 m); the
  // freighter's length is its mesh's own, nose to tail, at the size it is drawn (about 69 m). No number here is typed for the pass itself.
  moverSolid.computeBoundingBox();
  const FLY_PASS = BANK.half * (1 - 2 * BANK.off) + (moverSolid.boundingBox.max.z - moverSolid.boundingBox.min.z) * mvS.z, FLY_LEN = L_IN + TURN_R * -TURN_A0 + 1100, FLY_U_OUT = (L_IN + TURN_R * -TURN_A0 + FLY_PASS) / FLY_LEN, FLY_Z_OUT = -1100 + FLY_PASS, FLY_VR = 1.35;
  // round thirteen: it stays right of the runway's line, of the avenue and of the beacon tower for the whole crossing (it used to cross the avenue in front of the tower and go out
  // through the frame's top left corner) and passes 9 m right of our line, 57 m above the eye (a six and a half degree climb from the fence): out through the middle of the top edge
  const FLY_X = (z) => -30 - 20 * sstep(-200, -500, z) + 30 * sstep(-760, -1030, z);          // round thirteen: it climbs out 50 m right of the runway's line (it was 30: its wings lay across the beacon tower's silhouette as it came up the avenue; further right its wingtip would be among the corridor's towers) and passes 20 m right of our line
  const FLY_Y = (z) => 9 + 47 * sstep(399, -366, z) + Math.max(0, -366 - z) * 0.116;
  const placeFly = (u) => {
    const z = FLY_Z_OUT - FLY_VR * FLY_LEN * (u - FLY_U_OUT);
    mvP.set(FLY_X(z), FLY_Y(z), z);
    mvZ.set(FLY_X(z - 4) - FLY_X(z + 4), FLY_Y(z - 4) - FLY_Y(z + 4) + 0.5, -8).normalize();          // along its track, the nose a few degrees above the line it climbs
    mvY.set(0.05, 1, 0); mvX.crossVectors(mvY, mvZ).normalize(); mvY.crossVectors(mvZ, mvX);
    mvM.makeBasis(mvX, mvY, mvZ).scale(mvS); mvM.setPosition(mvP);
    flyJet.matrix.copy(mvM); flyJetLamps.matrix.copy(mvM); flyJet.matrixWorldNeedsUpdate = true; flyJetLamps.matrixWorldNeedsUpdate = true;
  };
  const DEP_Z0 = 1200, DEP_OFF = 3300 / 2, DEP_T = (TURN_C[1] - ARC_S[1]) / -ARC_S[1], DEP_LEN = (moverSolid.boundingBox.max.z - moverSolid.boundingBox.min.z) * mvS.z;          // where it waits (the end of the close edge lights), where its wheels leave the runway (half the runway's 3300 m), the share of the eye's way north at which they leave it (the end of the arc), its own length as drawn
  const placeDep = (camZ) => {
    const t = Math.min(1, Math.max(0, (camZ - ARC_S[1]) / -ARC_S[1])), q = t / DEP_T, z = DEP_Z0 + (DEP_OFF - DEP_Z0) * (q < 1 ? q * q : 2 * q - 1), a = Math.max(0, z - DEP_OFF), rot = sstep(DEP_OFF - 2 * DEP_LEN, DEP_OFF + 2 * DEP_LEN, z);
    mvP.set(-0.00042 * a * a, 0.125 * a * sstep(0, 260, a), z);
    mvZ.set(-0.00084 * a, 0.02 + 0.2 * rot, 1).normalize();          // along its track, the nose lifting as it rotates
    mvY.set(-0.25 * sstep(200, 700, a), 1, 0); mvX.crossVectors(mvY, mvZ).normalize(); mvY.crossVectors(mvZ, mvX);          // banked into its turn
    mvM.makeBasis(mvX, mvY, mvZ).scale(mvS); mvM.setPosition(mvP);
    depJet.matrix.copy(mvM); depJetLamps.matrix.copy(mvM); depJet.matrixWorldNeedsUpdate = true; depJetLamps.matrixWorldNeedsUpdate = true;
  };
  placeTaxi(-2000); placeFly(0); placeDep(-2000);

  const boardXZ = hillXZ(BOARD.a, 0), bn = new THREE.Vector3(-HH[0] * BOARD.slope, 1, -HH[1] * BOARD.slope).normalize();
  const arcAt = (f, y) => [TURN_C[0] + TURN_R * Math.cos(TURN_A0 * (1 - f)), y, TURN_C[1] + TURN_R * Math.sin(TURN_A0 * (1 - f))];
  const yArc = (f) => Y_ARC - (Y_ARC - Y_OUT) * f;
  const flyThrough = [[ENTRY[0], Y_IN, ENTRY[1]], [ARC_S[0] - H0[0] * 220, Y_IN - (Y_IN - Y_ARC) * inDrop(1 - 220 / L_IN), ARC_S[1] - H0[1] * 220], [ARC_S[0], Y_ARC, ARC_S[1]], arcAt(0.25, yArc(0.25)), arcAt(0.5, yArc(0.5)), arcAt(0.75, yArc(0.75)), [0, Y_OUT, -1100],
    [0, SEAT_Y + GLIDE * 700, -700], [0, SEAT_Y + GLIDE * 350, -350], [0, SEAT_Y + GLIDE * 110, -110], [0, SEAT_Y, 0]];
  const board = [boardXZ[0], BOARD.h, boardXZ[1]];
  const anchors = {
    portalSeat: { position: [0, SEAT_Y, 0], facing: [0, 0, -1], radius: SEAT_R },
    flyThrough, flyLine: (n = 64) => flyLine(n),
    viewpoints: {
      scudBreak: { position: flyThrough[0], look: board }, hillAhead: { position: flyThrough[2], look: board },
      turnApex: { position: flyThrough[5], look: [-194, 40, -1247] }, rollOut: { position: flyThrough[6], look: [0, 10, -200] },
      avenueGate: { position: flyThrough[7], look: [0, SEAT_Y, 0] }, shortFinal: { position: flyThrough[9], look: [0, SEAT_Y, 400] },
    },
    bank: BANK,          // round sixteen: the bank's measure (see BANK), read by the world
    hill: { summit, board, boardNormal: [bn.x, bn.y, bn.z], centre: [HILL_C[0], 0, HILL_C[1]], radius: 220, heightAt: hillH, heading: [HH[0], HH[1]], boardHalf: BOARD.half, lowQuarter: LOWQ, boardAlong: [BOARD.a, Math.cos(Math.atan(BOARD.slope)) * BOARD.half],
      // round thirteen: laneDist(x, z) = metres from the squatters' lane on the flank (1e9 away from it), huts = [x, z, w, d] of every hut on the terraces: nothing is planted on either
      laneDist: (x, z) => { const [a, b] = hillAB(x, z); return a > -146 && a < 46 ? Math.abs(b - laneB(a)) : 1e9; }, huts: terraceHuts ,
      // the village round the board: where its margin of trees stands, [x, z, size 0..1] (the world plants them)
      village: { trees: villageTrees },
      // where scrub comes over the board's kerb: [x, y, z, size] of each shrub (the world plants them)
      creepers: creeperPts },
    stacks: stackTops,          // round thirteen: the tops of the power station's two stacks (the world stands their steam on them)
    turn: { centre: [TURN_C[0], TURN_C[1]], radius: TURN_R, from: flyThrough[2], to: flyThrough[6], degrees: 47 },
    runway: { start: [0, 0, -70], threshold: [0, 0, 0], end: [0, 0, 3300], width: 61, taxiwayX: 110 },
    fenceZ: -328,          // the airfield's fence along the boulevard (round fourteen: the world measures the landing lights' rain from it)
    strobes: anchorsStrobes, sunDir: [sunDir.x, sunDir.y, sunDir.z], waterY: WATER_Y,
    harbour: [{ min: [-1800, -40], max: [-120, 3000] }, { min: [240, 500], max: [385, 1480] }, { min: [240, 1560], max: [1500, 3000] }, { min: [-1800, 3400], max: [1500, 5000] }],
    walledCity: { min: [-300, -1312], max: [-88, -1182], height: 48 }, playground: [PLAY[0], 0, PLAY[1]],
    beaconTower: { position: [LM[0], 0, LM[1]], height: 222 + LM_MAST, lamp: [LM[0], LM_LAMP_Y, LM[1]] },          // round nine: the landmark of the final, 44 m left of the avenue's centre line
    parks, parkY: 0.45,                  // [x0, x1, z0, z1, kind 0 pitch | 1 courts | 2 garden, floodlit]: the blocks round the hill's foot; trees belong in the gardens
    market: { min: [-72, -400], max: [72, -366] },
    fieldFill: [U.uSky.value.r * 0.4 + U.uFill.value.r, U.uSky.value.g * 0.4 + U.uFill.value.g, U.uSky.value.b * 0.4 + U.uFill.value.b],      // the light the airfield's grass shader adds to its own albedo: anything planted on it wants the same
    extent: { min: [-1700, -8, -2910], max: [1300, 125, 3340], carpet: 'within about 600 m of flyThrough, z < -366' },
    wind: [WIND[0], 0, WIND[1]], speed: 75,
  };

  // viewer aid only: ?heroView=hill|roofs|final|runway|turn re-centres the set-piece viewer, heroU=0..1 stages the wash
  let view = null, progress = null;
  if (dbg) { view = dbg.get('heroView'); if (dbg.get('heroU') != null) progress = +dbg.get('heroU'); }
  const VIEWS = {
    hill: { c: [board[0], 50, board[2]], r: 150, h: 130 }, roofs: { c: [-70, 48, -1330], r: 62, h: 70 }, turn: { c: [-120, 45, -1290], r: 140, h: 190 },
    final: { c: [0, 30, -600], r: 150, h: 300 }, runway: { c: [40, 6, 40], r: 110, h: 110 },
  };
  const TOUR = [[board[0] - 300, board[2] - 280, 2.52], [-70, -1330, 0], [-194, -1247, 0], [0, -600, -0.26], [0, 60, 0]];   // subject x, z, yaw
  const V = view === 'tour' ? { c: [0, 50, 0], r: 90, h: 80 } : VIEWS[view] || { c: [-60, 40, -1150], r: 620, h: 300 };

  const tmp = new THREE.Vector3(), res = new THREE.Vector2(), ph1 = R.look.range(0, 6), ph2 = R.look.range(0, 6);
  const POOL_DRIFT = HR.dark ? 0 : (HR.drift || 1), DRIFT_R = HR.drift ? 1.25 : 1, POOL_R = HR.dark ? 112 : 160, skyBase = U.uSky.value.clone();
  const setLook = (o = {}) => {
    if (o.lit != null) U.uLit.value = o.lit;
    if (o.neon != null) U.uNeon.value = o.neon;
    if (o.wet != null) U.uWet.value = o.wet;
    if (o.shaft != null) U.uPoolCol.value.copy(poolBase).multiplyScalar(o.shaft);
    if (o.strobe != null) U.uStrobe.value = o.strobe;
    if (o.portal != null) U.uPortal.value.copy(o.portal);            // a THREE.Color, linear: the light the portal lays on the wet threshold
    if (o.heading) U.uLand.value.set(o.heading[0], o.heading[1], o.bank || 0, 1);          // the airframe's heading in plan and the tangent of its bank: where its landing lamps point
    if (o.u != null) placeFly(o.u);                                  // progress along the approach: where the freighter climbing out is (keyed to u, not to the clock)
    if (o.flash != null) U.uSky.value.setRGB(skyBase.r + 0.1 * o.flash, skyBase.g + 0.13 * o.flash, skyBase.b + 0.22 * o.flash);      // lightning: 0..1, eased by the caller
  };
  const wakeAt = (u) => {
    const f = Math.min(1, Math.max(0, u)) * (FLY.length - 1), i = Math.min(FLY.length - 2, Math.floor(f)), t = f - i, a = FLY[i], b = FLY[i + 1];
    U.uWake.value.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1);
  };
  return {
    object, radius: V.r, height: V.h, center: new THREE.Vector3(V.c[0], V.c[1], V.c[2]), anchors,
    ground: true, groundY: WATER_Y,
    setProgress(u) { progress = u == null ? null : u; },
    setLook,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (view === 'tour' && camera) {
        tmp.setFromMatrixPosition(camera.matrixWorld); const az = Math.atan2(tmp.x, tmp.z), a = az < -0.6 ? az + TAU : az;
        const T = TOUR[a < 0.45 ? 0 : a < 1.5 ? 1 : a < 2.45 ? 2 : a < 3.3 ? 3 : 4], cy = Math.cos(T[2]), sy = Math.sin(T[2]);
        object.rotation.y = T[2]; object.position.set(-(T[0] * cy + T[1] * sy), 0, -(-T[0] * sy + T[1] * cy)); object.updateMatrixWorld(true);
      }
      const P = U.uPool.value;
      P[0].set(board[0] - HH[0] * 6, board[2] - HH[1] * 6, POOL_R, 0.92 + 0.08 * Math.sin(time * 0.23) * POOL_DRIFT);
      P[1].set(-90 + 120 * Math.sin(time * 0.11 + ph1), -860 + 170 * Math.cos(time * 0.083 + ph1), 190 * DRIFT_R, (0.5 + 0.12 * Math.sin(time * 0.17 + ph1)) * POOL_DRIFT);
      P[2].set(390 + 110 * Math.sin(time * 0.09 + ph2), 60 + 200 * Math.sin(time * 0.064 + ph2 * 2), 235 * DRIFT_R, (0.45 + 0.1 * Math.sin(time * 0.13 + ph2)) * POOL_DRIFT);
      if (progress != null) wakeAt(progress);
      else if (camera) { tmp.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(tmp); U.uWake.value.set(tmp.x, tmp.y, tmp.z, 1); }
      placeTaxi(U.uWake.value.z); placeDep(U.uWake.value.z);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(res); U.uRes.value.copy(res); }
    },
    dispose() {},
    stats: { solids: G.ni / 3, cards: cards.nq * 2, cloth: cloth.nq * 2, birds: birds.nq * 2, lamps: lamps.length * 2, hill: hillGeo.index.count / 3, slabsNearPath: pathRoofs.length, parks: parks.length, quads: G.nv / 4, quadsMax: G.max / 4, cardsMax: cards.max, clothMax: cloth.max, huts: terraceHuts.length, vehicles: fleets[0].n + fleets[1].n, vehicleTriangles: vehicles[0].triangles + vehicles[1].triangles },
  };
}
