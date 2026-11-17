// PATIO OF THREE THOUSAND POTS hero set piece: THE HERO WALL and THE SUN'S EDGE that comes down it.
//
// WHAT IT IS
//   The west wall of the last patio: 140 m long, 140 m high (10 times life), brush-marked whitewash
//   over a cobalt dado, hung with about 1,000 clay pots in iron rings 3 m off the lime, 30 rows by
//   35 columns, every one jittered, leaning, sized and planted differently (zonal geranium mounds,
//   trailing gitanillas, a fern, a cutting, bare soil). Six grilled windows with green shutters (two
//   swing), a balcony with a cane chair, blue-and-white plates, a ladder, the watering cane left
//   leaning at the south end (swinging), a bell cage with two canaries on a bracket, and a gecko.
//   The hero is the LINE: the shadow of the east roof. Nothing here uses three.js lights. Every
//   material evaluates one GLSL function, patioSun(p), that tests a point against the east eave
//   (scalloped by tile ends at 2 m pitch, notched by one chimney, penumbra widening with distance)
//   and the south wing, so the edge crosses lime, pot, leaf, petal and falling drop consistently:
//   lime jumps from blue-white to white, cobalt to enamel, dusky rose to scarlet with a lit rim on
//   every leaf, pot shadows stretch from 1 to 4 m, wet streaks shrink upward, and 120 chains of
//   overflow drops flash link by link just ahead of the line: in a band 1 to 11 m under the line the
//   drops and the wet streaks on the lime throw silver sparks (each at least two pixels across).
//   The planting is lush only within about 20 m of the close pass. Elsewhere the pots are smaller,
//   the mounds tighter, a few patches are bare and up to nine long trailing masses (12 to 22 m)
//   break the rows, so that from across the patio the wall reads as white lime with points of
//   scarlet and cobalt above the line and one quiet blue below it (shaded leaf and bloom sink
//   toward the wall's blue with distance; far sunlit petals are held a deeper red).
//
// SPACE (hero-local; origin = foot of the wall at its middle, +Y up, front = +Z)
//   The lime face is the plane z = 0, x -70..70, y 0..140. The patio lies on +Z (0..100).
//   World placement in the brief: object.position.set(-50, 0, 0); object.rotation.y = Math.PI / 2;
//   then local (x, y, z) = world (z_world * -1, y, x_world + 50), i.e. local +X is NORTH, local -X is
//   SOUTH (the cane end), local +Z is EAST. radius ~76, height ~152 (eave tiles and chimney).
//   Solid envelope: everything stays inside z <= 7 (pots and plants reach z ~ 6.5, the balcony 6,
//   the cage hangs at z 3.5) except the eave (z <= 4.6 at y >= 138) and the cane (z <= 8 at x < -60).
//
// OPTS
//   palette   7 hex strings in the brief's order: [lime, shade blue, cobalt, scarlet, leaf green,
//             terracotta, sky blue]
//   look      'may' (default) | 'dawn' (apricot edge whitening as it falls, the clock starting at 9 degrees,
//             coral/salmon/white bloom, a third raw terracotta) | 'moon' (silver on indigo, white
//             bloom glows a little) | 'shower' (as may, wetter and glossier everywhere)
//   birds     'canary' | 'goldfinch' (default by seed);  tool: 'cane' | 'can' (default by seed)
//   altitude  [a0, a1] degrees at u 0 and u 1, overriding the look's (the key table is kept from u 0.44 to 0.66)
//   demo      false to stop the self-running sun clock used when setProgress is never called
//
// API (besides the contract fields)
//   setProgress(u)   call every frame with the path u. Sets the sun altitude a(u) (brief's key table),
//                    edge height, bounce, drying and the gecko's run. Pure function of u.
//   setCloud(k)      0..1 multiplier on the sun (for the 'shower' look's racing clouds; ease it).
//   sun              live values for the world's own materials: { altitude (deg), edgeY (m on the wall),
//                    dir (hero-local Vector3), color (Color, linear), sky (Color), bounce (Color) }
//   uniforms         the shared uniform objects (uSunDir, uSunTan, uSunCol, uSkyCol, uBounce, uTime ...)
//   glsl             the shared GLSL chunk (hash, noise, patioSun(heroLocalPoint), patioLight(...)) so
//                    the room's materials can use the SAME edge. Spread `uniforms` into the material and
//                    pass hero-local points (uHeroInv * modelMatrix * position).
//   altitude(u)      the sun's altitude in degrees for this look.
//
// ANCHORS (hero-local)
//   flyThrough   the brief's path from the arch to the portal, >= 6.5 m clear of every solid
//   closePass    [start, end] of the pass beside the pots (pots 9 m to the camera's right)
//   cage, gecko  where the canary cage hangs and where the gecko starts its run
//   lamp, lampHook  the lantern's flame and the tip of its bracket; uniforms.uHLamp.value.w lights it (0 by day)
//   edgeAt(u, x, out)  point on the wall at the line's height (aim the 'edge' poi here); no allocation: it writes
//                into out, or into one shared vector that the next call overwrites
//   portalSeat   { position, facing } for the 14 m portal above the north-west eave corner
//   viewpoints   reveal (whole wall, 90 m out), turn, close (the row at eye level), exit
//   toWorld(v)   helper: hero-local Vector3 -> world (through object.matrixWorld)
//
// COST   about 125k triangles, 12 draw calls, no lights, one 35x30 RGBA8 texture, build ~150 ms.
// LIGHT  it lights itself: sun colour * patioSun + blue sky ambient + bounce, all uniforms. It wants a
//        deep blue sky, thin blue fog (scene.fog is honoured), bloom about 0.3 at threshold 1.0.
//        Sunlit lime peaks near 0.93 linear; drops and wet glints are the only things above 1.
//
// VIEWER ONLY  the set-piece viewer never calls setProgress, so the clock demo runs.
// PARTS  parts = { cageGeometry, birdGeometry, material, birdSpots } lets the world hang more cages (the
//        fittings material also draws InstancedMesh).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PALETTE = ['#F3EFE4', '#A9BCD8', '#1F47A6', '#D4221E', '#3E7A38', '#B5653A', '#2E62C4'];
const WALL_W = 140, WALL_H = 140, HALF = 70, PATIO_D = 100;
const COLS = 35, ROWS = 30, PITCH_X = 4, PITCH_Y = 4.5, ROW0 = 5, COL0 = -68, POT_Z = 3;
const SUN_SIDE = 0.174 / 0.985;

// The sun's clock: altitude in degrees against path u (monotone cubic through the brief's keys).
// Geared: a high, slow sun over the first two patios (their facing walls blaze from the first frame), then the edge
// stands at mid-wall when the hero wall is first seen whole and slides in plain view through the reveal and the held
// turn: 64 m at u 0.43, 51 at 0.50, 41 at 0.56, 33 (eye level) at 0.62, 13 at 0.87, 7 at 1.
const A_KEYS = [[0, 30], [0.25, 32], [0.43, 37.2], [0.5, 41.7], [0.56, 44.7], [0.62, 47.0], [0.65, 47.9], [0.87, 51.7], [1, 53]];
function monotone(keys) {
  const n = keys.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (u) => {
    const x = clamp(u, 0, 1);
    let i = 0;
    while (i < n - 2 && x > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], t = (x - keys[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

// Looks: sun colour (low and high), sky ambient, bloom colour shares [scarlet, coral, white, pink],
// pot paint shares [cobalt, terracotta, white], altitude remap, wetness.
const LOOKS = {
  may: { sunLo: '#FFF4DC', sunHi: '#FFF4DC', sunI: 1.3, skyI: 0.44, bloom: [0.72, 0.14, 0.09, 0.05], paint: [0.78, 0.14, 0.08], a0: 30, a1: 53, wet: 1, glow: 0 },
  dawn: { sunLo: '#FF9E58', sunHi: '#FFDCC4', sunI: 1.32, skyI: 0.40, bloom: [0.12, 0.52, 0.30, 0.06], paint: [0.58, 0.34, 0.08], a0: 9, a1: 53, wet: 1, glow: 0, whiten: 0.62 },
  moon: { sunLo: '#CBD8FF', sunHi: '#D6E0FF', sunI: 0.95, skyI: 0.2, bloom: [0.10, 0.08, 0.76, 0.06], paint: [0.78, 0.14, 0.08], a0: 30, a1: 53, wet: 1, glow: 0.05 },
  shower: { sunLo: '#FFF4DC', sunHi: '#FFF4DC', sunI: 1.3, skyI: 0.48, bloom: [0.72, 0.14, 0.09, 0.05], paint: [0.78, 0.14, 0.08], a0: 30, a1: 53, wet: 1.8, glow: 0 },
};

// Shared GLSL: hashes, value noise, the roof's shadow and the light model. Points are hero-local.
const GLSL_COMMON = /* glsl */`
uniform mat4 uHeroInv;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce;
uniform float uSunTan, uSunSide, uEaveH, uPatioD, uChimX, uChimH, uTime, uEdgeY, uWet, uGlow;
uniform vec4 uHLamp; uniform vec3 uHLampCol;                 // the brass lantern on the wall (hero-local; w = how bright)
float h11(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.13 + 7.1) + 0.2 * vnoise(p * 4.37 + 3.7); }
// height of the east roof's shadow-casting line where a sun ray through eave position xe leaves the patio
float eaveLine(float xe){
  float sc = abs(sin(xe * 1.5707963));                       // tile ends, 2 m pitch
  float ch = smoothstep(5.0, 4.2, abs(xe - uChimX));          // one chimney, 8.4 m wide
  float cap = smoothstep(6.2, 5.6, abs(xe - uChimX)) * 0.12;
  return uEaveH + (sc - 0.55) * 1.3 + ch * uChimH + cap * uChimH;
}
// 1 in the sun, 0 in the roof's shadow
float patioSun(vec3 p){
  float dz = max(uPatioD - p.z, 0.);
  float xe = p.x - dz * uSunSide;
  float pen = 0.2 + dz * 0.006;
  float e = smoothstep(-pen, pen, p.y + dz * uSunTan - eaveLine(xe));
  // the south wing (local x = -70): the ray reaches it after ds metres of z
  float ds = max(p.x + 70., 0.) / max(uSunSide, 1e-3);
  float pen2 = 0.3 + ds * 0.01;
  float s = smoothstep(-pen2, pen2, p.y + ds * uSunTan - uEaveH - 1.5 * sin(p.x * 0.9 + 1.3));
  s = mix(s, 1., step(dz, ds));
  return e * s;
}
// a soft shoulder so no ordinary surface clips or washes in the bloom (drops and glints are added after it)
vec3 patioTone(vec3 c, float top){ return min(c, top - 0.2 + 0.2 * (1. - exp(-max(c - (top - 0.2), 0.) * 4.))); }
// diffuse light: sun (wrapped), blue sky from above, warm bounce from the patio (+z)
vec3 patioLamp(vec3 p, vec3 n){
  vec3 dl = uHLamp.xyz - p; float d2 = dot(dl, dl);
  return uHLampCol * (uHLamp.w * max(dot(n, dl) / sqrt(d2 + 1e-3) + 0.35, 0.) / (1. + d2 * 0.007));
}
vec3 patioLight(vec3 p, vec3 n, float sun, float wrap){
  float ndl = max((dot(n, uSunDir) + wrap) / (1. + wrap), 0.);
  vec3 amb = uSkyCol * (0.66 + 0.34 * n.y) + uBounce * (0.55 + 0.45 * n.z);
  return uSunCol * (ndl * sun) + amb + patioLamp(p, n);
}
`;

// ---------------------------------------------------------------------------------------------
// LAYOUT: which cell holds what. Pure data, all random draws happen here in a fixed order.
// ---------------------------------------------------------------------------------------------
const CLOSE_LINE = [[27, 20], [11, 26], [-13, 32], [-38, 42], [-52, 50], [-58, 55]];   // the path beside the wall (x, y)
function distToLine(x, y) {
  let best = 1e9;
  for (let i = 0; i < CLOSE_LINE.length - 1; i++) {
    const a = CLOSE_LINE[i], b = CLOSE_LINE[i + 1], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t));
  }
  return best;
}

function layoutWall(rng, look) {
  const L = LOOKS[look];
  const taken = new Uint8Array(COLS * ROWS);
  const take = (c, r) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) taken[r * COLS + c] = 1; };
  const free = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !taken[r * COLS + c];
  const cellX = (c) => COL0 + c * PITCH_X, cellY = (r) => ROW0 + r * PITCH_Y;

  // the cage and the gecko's coat of bare lime (fixed by the brief)
  const cage = { x: -24, y: 34, z: 3.6 };
  take(11, 6); take(11, 7); take(12, 6); take(12, 5);
  // the brass lantern hangs on a bracket in a gap of its own (lit only by moon)
  const lamp = { x: 8, y: 26.6, z: 4.2 };
  take(19, 4); take(19, 5); take(19, 6);
  // balcony (10 times life: a 16 m ledge and a 19 m door): four cells wide, five rows high
  const bc = rng.int(15, 29), br = rng.int(8, 20);
  const balcony = { x: cellX(bc) + PITCH_X * 1.5, y: cellY(br) - 1.6, c: bc, r: br };
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) take(bc + i, br + j);
  // six small windows (5 by 7 m with their shutters): three cells by two rows each, spread up the wall
  const windows = [];
  const bands = [[2, 4], [6, 9], [11, 14], [15, 18], [20, 23], [25, 27]];
  for (let i = 0; i < 6; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const c = rng.int(2, COLS - 3), r = rng.int(bands[i][0], bands[i][1]);
      let ok = true;
      for (let a = -1; a <= 1; a++) for (let b2 = 0; b2 <= 1; b2++) if (!free(c + a, r + b2)) ok = false;
      if (!ok || windows.some((w) => Math.abs(w.c - c) < 6)) continue;
      for (let a = -1; a <= 1; a++) for (let b2 = 0; b2 <= 1; b2++) take(c + a, r + b2);
      windows.push({ c, r, x: cellX(c), y: cellY(r) + PITCH_Y * 0.5, w: rng.range(4.6, 5.2), h: rng.range(6.4, 7.2), swing: i === 1 || i === 4, open: rng.range(0.3, 1.0), seed: rng() });
      break;
    }
  }
  // ladder (30 m): leans in a gap one column wide and six rows high
  let lc = rng.int(21, 32);
  const colFree = (c) => { for (let r = 0; r < 6; r++) if (!free(c, r)) return false; return true; };
  for (let k = 0; k < 12 && !colFree(lc); k++) lc = 21 + ((lc - 21 + 5) % 12);
  for (let r = 0; r < 6; r++) take(lc, r);
  const ladder = { x: cellX(lc), top: 29 };
  // the watering cane at the south end leans in its own gap
  for (let r = 0; r < 6; r++) take(0, r);
  const cane = { x: -68, len: 28 };
  // blue-and-white plates hang where a pot might have
  const plates = [];
  for (let i = 0; i < 6; i++) {
    for (let tries = 0; tries < 20; tries++) {
      const c = rng.int(1, COLS - 2), r = rng.int(2, ROWS - 2);
      if (!free(c, r)) continue;
      take(c, r);
      plates.push({ x: cellX(c) + rng.range(-0.4, 0.4), y: cellY(r) + rng.range(-0.3, 0.3), r: rng.range(1.0, 1.45), seed: rng() });
      break;
    }
  }
  // chimney notch on the east eave
  const chimX = rng.range(-24, -6), chimH = rng.range(8, 11);   // its notch lands 18 m north of it, where the reveal looks

  // Away from the close pass the planting thins, so that from across the patio the lime shows between the pots:
  // smaller pots and tighter mounds, a few bare patches, and a handful of long trailing masses that break the rows.
  const xr = rng.fork('thin');
  const patches = [];
  for (let i = 0; i < 10; i++) patches.push([xr.range(1, COLS - 2), xr.range(2, ROWS - 2), xr.range(1.3, 2.7), xr.range(0.8, 1.7)]);
  const bare = (c, r) => { let k = 0; for (const [pc, pr, rx, ry] of patches) k = Math.max(k, 1 - Math.hypot((c - pc) / rx, (r - pr) / ry)); return k; };
  const cascadeAt = new Map();
  for (let i = 0; i < 9; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const c = xr.int(2, COLS - 3), r = xr.int(6, 18), x = cellX(c), y = cellY(r), len = Math.min(xr.range(12, 22), y - 11);
      const rows = Math.ceil((len + 1.5) / PITCH_Y);
      if (len < 9 || distToLine(x, y) < 25 || distToLine(x, y - len * 0.5) < 25 || distToLine(x, y - len) < 23) continue;
      let ok = free(c, r);
      for (let j = 1; j <= rows; j++) if (!free(c, r - j)) ok = false;
      for (const k of cascadeAt.values()) if (Math.abs(k.c - c) < 4 && Math.abs(k.r - r) < 8) ok = false;
      if (!ok) continue;
      for (let j = 1; j <= rows; j++) take(c, r - j);
      cascadeAt.set(r * COLS + c, { c, r, len, seed: xr() });
      break;
    }
  }

  const pots = [];
  const tex = new Uint8Array(COLS * ROWS * 4);
  const pick4 = (w, x) => (x < w[0] ? 0 : x < w[0] + w[1] ? 1 : x < w[0] + w[1] + w[2] ? 2 : 3);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // draw the same number of randoms for every cell so a gap never shifts its neighbours
      const q = [rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng()];
      if (taken[r * COLS + c]) continue;
      const casc = cascadeAt.get(r * COLS + c);
      const lush = 1 - smoothstep(10, 24, distToLine(cellX(c), cellY(r)));
      if (!casc && lush < 0.5 && r > 0 && (bare(c, r) > 0.1 || (q[9] * 57.31) % 1 < 0.07)) continue;   // bare lime
      const jx = casc ? 0 : (q[0] - 0.5) * 2.2, jy = casc ? 0 : (q[1] - 0.5) * 1.5;
      const size = casc ? 3.0 + 0.4 * q[2] : 1.4 + 2.0 * Math.pow(q[2], lerp(1.7, 0.8, lush));
      let kind = q[3] < 0.70 ? 0 : q[3] < 0.90 ? 1 : q[3] < 0.93 ? 2 : q[3] < 0.96 ? 3 : q[3] < 0.985 ? 4 : 5;
      if (r === 0 && kind === 1) kind = 0;                          // nothing trails onto the floor
      if (casc) kind = 1;
      const paintX = q[4];
      const paint = paintX < L.paint[0] ? 0 : paintX < L.paint[0] + L.paint[1] ? 1 : 2;
      const colour = pick4(L.bloom, q[5]);
      const bloom = kind === 0 ? 0.15 + 0.85 * q[6] : kind === 1 ? 0.35 + 0.65 * q[6] : 0;
      const spread = (kind === 0 ? lerp(0.78, 1.15, q[7]) : kind === 2 ? 0.95 : kind === 3 ? 0.55 : kind === 4 ? 0.3 : 0.0) * lerp(0.78, 1, lush);
      const trail = casc ? 9 : kind === 1 ? lerp(4, 9, q[8]) : 0;
      const x = cellX(c) + jx, y = cellY(r) + jy;
      const p = { c, r, x, y, size, kind, paint, colour, bloom, spread, trail, seed: q[9], leanX: (q[10] - 0.5) * 0.28, leanZ: (q[11] - 0.5) * 0.28, near: !casc && distToLine(x, y) < 15 && y < 64, cascade: casc ? casc.len : 0 };
      pots.push(p);
      const o = (r * COLS + c) * 4;
      tex[o] = Math.round(clamp(jx / 2.4 + 0.5, 0, 1) * 255);
      tex[o + 1] = Math.round(clamp(jy / 1.6 + 0.5, 0, 1) * 255);
      tex[o + 2] = Math.round(clamp((size - 1.4) / 2.0, 0, 1) * 255);
      const a = kind === 1 ? 0.55 + 0.45 * (trail - 4) / 5 : kind === 5 ? 0.03 : 0.08 + 0.36 * clamp(spread / 1.15, 0, 1);
      tex[o + 3] = Math.max(4, Math.round(a * 255));
    }
  }
  // 120 overflow chains: runs of pots straight down a column from where the watering started
  const at = new Map(); pots.forEach((p) => at.set(p.r * COLS + p.c, p));
  const chains = [];
  for (let tries = 0; tries < 600 && chains.length < 120; tries++) {
    const c = rng.int(0, COLS - 1), top = tries % 3 === 2 ? rng.int(4, ROWS - 1) : rng.int(8, 17), len = rng.int(3, 9);
    const run = [];
    for (let r = top; r >= Math.max(0, top - len); r--) { const p = at.get(r * COLS + c); if (!p) break; run.push(p); }
    if (run.length >= 3) chains.push({ run, seed: rng(), side: rng.chance(0.5) ? 1 : -1 });
  }
  return { pots, tex, windows, balcony, ladder, cane, plates, cage, lamp, chimX, chimH, chains };
}

// ---------------------------------------------------------------------------------------------
// THE LIME: one plane whose shader knows the pot lattice (shadow, contact shade, wet streak).
// ---------------------------------------------------------------------------------------------
const WALL_VERT = /* glsl */`
uniform mat4 uHeroInv;
varying vec3 vHp, vV;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vHp = (uHeroInv * wp).xyz;
  vV = mat3(uHeroInv) * (cameraPosition - wp.xyz);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
${GLSL_COMMON}
uniform sampler2D uPots;
uniform vec3 uLime, uCobalt;
varying vec3 vHp, vV;
#include <fog_pars_fragment>
float brush(vec2 p){
  float a = vnoise(vec2(p.x * 0.33 + p.y * 0.07, p.y * 2.7));
  float b = vnoise(vec2(p.x * 2.3 + 3.1, p.y * 0.38 - p.x * 0.06));
  return mix(a, b, smoothstep(0.35, 0.65, vnoise(p * 0.11 + 9.3)));
}
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * t); }
void main(){
  vec2 p = vHp.xy;
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4);
  float dist = length(vV);
  float lod = smoothstep(150., 30., dist);
  // brush relief and uneven coats
  float h0 = brush(p), hx = brush(p + vec2(0.14, 0.)), hy = brush(p + vec2(0., 0.14));
  float lod2 = smoothstep(70., 12., dist);
  vec3 n = normalize(vec3((h0 - hx) * 2.4 * lod, (h0 - hy) * 2.4 * lod, 1.));
  float coat = fbm3(p * 0.045 + 3.3);
  float stain = fbm3(vec2(p.x * 0.55, p.y * 0.045));
  vec3 alb = uLime * (0.79 + 0.08 * coat + 0.06 * (h0 - 0.5) * lod + 0.05 * (vnoise(p * 8.) - 0.5) * lod2);
  // old coats flaked away in places: a crisp-edged shallower, greyer layer
  float fl = fbm3(p * 0.33 + 41.);
  float flake = smoothstep(0.615, 0.635, fl) * lod;
  alb *= 1. - 0.07 * flake + 0.05 * (smoothstep(0.60, 0.615, fl) - smoothstep(0.615, 0.63, fl)) * lod;
  alb *= 1. - 0.13 * smoothstep(0.5, 0.85, stain) * smoothstep(92., 139., p.y);        // weather under the eave
  alb = mix(alb, alb * vec3(0.93, 0.97, 0.90), 0.5 * smoothstep(0.55, 0.9, coat) * smoothstep(40., 0., p.y));   // damp green low down
  // hairline cracks: sparse voronoi borders
  vec2 cp = p / 7.5, ic = floor(cp), fc = fract(cp);
  float f1 = 9., f2 = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    float d = length(g + h22(ic + g) - fc);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  float crack = (1. - smoothstep(0., 0.035 + fw * 1.3, (f2 - f1) * 3.75)) * smoothstep(0.42, 0.6, vnoise(p * 0.06 + 20.)) * clamp(0.07 / fw, 0., 1.);
  alb *= 1. - 0.6 * crack;
  // cobalt dado
  float yb = 8.3 + 0.3 * (vnoise(vec2(p.x * 0.35, 1.7)) - 0.5);
  float band = 1. - smoothstep(yb - 0.05 - fw, yb + 0.05 + fw, p.y);
  vec3 dado = uCobalt * (0.8 + 0.5 * coat + 0.25 * (h0 - 0.5));
  dado = mix(dado, uCobalt * 0.55, smoothstep(0.5, 0.2, abs(p.y - (yb - 0.55))) * 0.7);                 // darker stripe under the top
  dado = mix(dado, uLime * 0.7, smoothstep(0.72, 0.9, vnoise(p * vec2(1.3, 0.9) + 5.)) * smoothstep(4., 0., p.y) * 0.8);   // scuffed at the foot
  alb = mix(alb, dado, band);
  // the pots in front of this point
  vec2 shift = ${POT_Z.toFixed(1)} * vec2(uSunSide, -uSunTan);
  float ci = floor((p.x + 70.) / 4.), cj = floor((p.y - 2.75) / 4.5);
  float shade = 0., ao = 0., wet = 0., rose = 0., rust = 0., drip = 0.;
  float farK = smoothstep(45., 95., dist);
  for (int dj = 0; dj <= 2; dj++) for (int di = -1; di <= 1; di++) {
    vec2 cell = vec2(ci + float(di), cj + float(dj));
    if (cell.x < 0. || cell.x > 34.5 || cell.y < 0. || cell.y > 29.5) continue;
    vec4 t = textureLod(uPots, (cell + 0.5) / vec2(35., 30.), 0.);
    if (t.a < 0.008) continue;
    vec2 c = vec2(-68. + cell.x * 4. + (t.r - 0.5) * 2.4, 5. + cell.y * 4.5 + (t.g - 0.5) * 1.6);
    float s = 1.4 + 2. * t.b;
    float trail = step(0.5, t.a);
    float spread = (1. - trail) * clamp((t.a - 0.08) / 0.36, 0., 1.) * 1.15;
    float tl = trail * (4. + 5. * (t.a - 0.55) / 0.45);
    float pr = s * (0.25 + 0.5 * spread);
    vec2 q = p - c;
    float rr = s * 0.5 + 1.0 + spread * 1.5;
    vec2 qa = (q - vec2(0., s * 0.2)) * vec2(1., 0.85);
    ao = max(ao, exp(-dot(qa, qa) / (rr * rr)));
    vec2 qs = q - shift;
    float wob = (vnoise(qs * 1.6 + cell * 7.3) - 0.5);
    float sh = 1. - smoothstep(0.86, 1.1, length(qs / vec2(s * 0.52, s * 0.5)));
    float dM = length((qs - vec2(0., s * 0.45 + pr * 0.3)) / vec2(pr, pr * 0.8)) + wob * 0.4;
    sh = max(sh, (1. - smoothstep(0.78, 1.08, dM)) * step(0.02, spread));
    float along = clamp((s * 0.4 - qs.y) / max(tl + s * 0.4, 0.1), 0., 1.);
    float dT = sdSeg(qs, vec2(0., s * 0.4), vec2(0., -tl)) / (s * 0.62 * (1. - 0.45 * along)) + wob * 0.5;
    sh = max(sh, (1. - smoothstep(0.78, 1.08, dT)) * trail);
    sh = max(sh, (1. - smoothstep(0.09, 0.15 + fw, sdSeg(p, c, c + shift))) * 0.8);
    shade = max(shade, sh);
    float wetK = uWet * (1. - 0.88 * smoothstep(2., 36., c.y - uEdgeY));
    float wlen = (1.5 + 5.5 * h21(cell + 3.)) * wetK;
    float wx = abs(q.x + (vnoise(vec2(p.y * 0.55, cell.x * 3.1 + cell.y)) - 0.5) * 0.8) / (s * (0.16 + 0.12 * vnoise(vec2(p.y * 1.3, cell.x))));
    float wy = (-s * 0.25 - q.y) / max(wlen + s * 0.25, 0.05);
    wet = max(wet, (1. - smoothstep(0.6, 1.05, wx + wy * 0.55)) * step(0., wy) * (1. - smoothstep(0.7, 1., wy)) * min(wetK, 1.));
    rust = max(rust, exp(-abs(q.x + 0.05 * sin(p.y * 3.)) / 0.1) * smoothstep(-2.6 - 2. * h21(cell), 0.1, q.y - 0.2 * s) * step(q.y, 0.3 * s));
    drip = max(drip, (1. - smoothstep(0.5, 1., abs(q.x) / max(0.5, fw * 1.6))) * step(q.y, -0.2 * s));          // the line the overflow runs down
    vec2 qr = q - vec2(0., s * 0.6);
    rose = max(rose, exp(-dot(qr, qr) / (pr * pr * 3.5 + 0.5)) * spread);
  }
  float sun = patioSun(vHp);
  float lit = sun * (1. - shade * mix(0.93, 0.74, farK));
  alb *= mix(vec3(1.), vec3(0.50, 0.55, 0.63), wet * (1. - band * 0.5) * (1. - 0.4 * farK));
  alb = mix(alb, alb * vec3(0.78, 0.55, 0.38), rust * 0.5 * lod);
  vec3 light = patioLight(vHp, n, lit, 0.9);
  light *= 1. + dot(n.xy, uSunDir.xy) * 0.22 * lit + n.y * 0.2 * (1. - lit);     // brush relief raked by the sun, lit from the sky in shade
  light *= 1. - 0.36 * ao * (1. - 0.55 * lit) * (1. - 0.3 * farK);
  vec3 col = alb * light;
  col += alb * uSunCol * vec3(0.95, 0.22, 0.16) * (rose * sun * 0.1);
  col += alb * uSunCol * (sun * (1. - sun) * 0.25);                               // a warm breath in the penumbra
  vec3 v = normalize(vV + vec3(0., 0., 1e-4));
  vec3 hv = normalize(uSunDir + v + vec3(0., 1e-4, 0.));
  float sp = pow(max(dot(n, hv), 0.), 36.);
  float glint = step(0.93, vnoise(p * 9. + floor(uTime * 3.) * 1.7)) * lod;
  col = patioTone(col, 0.99);                                                    // sunlit lime sits just under clipping
  col += uSunCol * (wet * lit * (sp * 1.4 + glint * 0.5)) + uSkyCol * (wet * 0.25 * (1. - abs(v.z)));
  // the glitter that runs ahead of the red: under the line the running water catches the first light, a band of
  // sparks on every wet streak and drip line. Each spark is a cell at least two pixels across, so it holds at 90 m.
  float under = smoothstep(uEdgeY - 11.5, uEdgeY - 6., p.y) * (1. - smoothstep(uEdgeY - 1.2, uEdgeY + 0.6, p.y));
  float gs = exp2(floor(log2(max(fw * 2.4, 0.2))));
  vec2 gc = floor(p / gs), gf = fract(p / gs) - 0.5;
  float gh = h21(gc + floor(uTime * 5. + h21(gc + 11.) * 5.) * 7.13);
  float spark = step(0.74, gh) * (1. - smoothstep(0.2, 0.5, length(gf))) * (0.5 + 0.5 * h21(gc + 5.));
  col += uSunCol * (spark * under * max(wet, drip) * (1. - band) * 2.2);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function makeWall(U, layout, pal) {
  const tex = new THREE.DataTexture(layout.tex, COLS, ROWS, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(WALL_W, WALL_H, 10, 10); geo.translate(0, WALL_H / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U, uPots: { value: tex }, uLime: { value: pal.lime }, uCobalt: { value: pal.cobalt } },
    vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'lime';
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// POTS: a lathe with rolled rim, soil, iron ring and arm; instanced by attributes (not matrices)
// so every shader can find the hero-local point it needs for patioSun.
// ---------------------------------------------------------------------------------------------
function potGeometry(segs, near) {
  const pos = [], nor = [], part = [], arm = [], idx = [];
  const push = (x, y, z, nx, ny, nz, m, a = 0) => { pos.push(x, y, z); nor.push(nx, ny, nz); part.push(m, y); arm.push(a); return pos.length / 3 - 1; };
  // profile (radius, height) from the foot up and over the rim to the soil; unit = rim diameter
  const prof = near
    ? [[0.29, -0.45], [0.315, -0.415], [0.455, 0.315], [0.505, 0.335], [0.532, 0.375], [0.528, 0.435], [0.495, 0.462], [0.44, 0.40]]
    : [[0.30, -0.45], [0.455, 0.32], [0.53, 0.39], [0.47, 0.46]];
  const ring = (r, y, nx, ny, m) => {
    const first = pos.length / 3;
    for (let i = 0; i < segs; i++) { const a = (i / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); push(c * r, y, s * r, c * nx, ny, s * nx, m); }
    return first;
  };
  const band = (a, b) => { for (let i = 0; i < segs; i++) { const j = (i + 1) % segs; idx.push(a + i, b + i, a + j, a + j, b + i, b + j); } };
  // smooth normals from the profile's tangents
  const rings = [];
  for (let k = 0; k < prof.length; k++) {
    const p0 = prof[Math.max(0, k - 1)], p1 = prof[Math.min(prof.length - 1, k + 1)];
    let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    rings.push(ring(prof[k][0], prof[k][1], ty, -tx, 0));
  }
  for (let k = 0; k < rings.length - 1; k++) band(rings[k], rings[k + 1]);
  // foot and soil caps as polygon fans without a centre vertex
  const foot = ring(prof[0][0], prof[0][1], 0, -1, 0);
  for (let i = 1; i < segs - 1; i++) idx.push(foot, foot + i, foot + i + 1);
  const last = prof[prof.length - 1];
  const soil = ring(last[0], last[1], 0, 1, 1);
  for (let i = 1; i < segs - 1; i++) idx.push(soil, soil + i + 1, soil + i);
  // iron: a hoop under the rim (near only), an arm back to the wall, a wall plate
  if (near) {
    const a = ring(0.475, 0.262, 1, 0, 2), b = ring(0.475, 0.318, 1, 0, 2);
    band(a, b);
  }
  const hw = near ? 0.035 : 0.05, y0 = 0.29, sides = near ? 4 : 3;
  const base = pos.length / 3;
  for (let e = 0; e < 2; e++) for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    push(c * hw, y0 + s * hw, -0.46, c, s, 0, 2, e);
  }
  for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; idx.push(base + i, base + j, base + sides + i, base + j, base + sides + j, base + sides + i); }
  if (near) {
    const pb = pos.length / 3, w = 0.11;
    push(-w, y0 - w * 1.6, -0.46, 0, 0, 1, 2, 0.985); push(w, y0 - w * 1.6, -0.46, 0, 0, 1, 2, 0.985);
    push(w, y0 + w * 1.6, -0.46, 0, 0, 1, 2, 0.985); push(-w, y0 + w * 1.6, -0.46, 0, 0, 1, 2, 0.985);
    idx.push(pb, pb + 1, pb + 2, pb, pb + 2, pb + 3);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2));
  g.setAttribute('aArm', new THREE.Float32BufferAttribute(arm, 1));
  g.setIndex(idx);
  return g;
}

const POT_VERT = /* glsl */`
uniform mat4 uHeroInv;
attribute vec2 aPart; attribute float aArm; attribute vec3 aPos; attribute vec4 aSL; attribute vec4 aPaint;
varying vec3 vHp, vV, vN, vL; varying vec2 vPart; varying vec4 vPaint; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float s = aSL.x;
  vec3 lp = position, ln = normal;
  if (aPart.x < 1.5) {
    float cx = cos(aSL.y), sx = sin(aSL.y), cz = cos(aSL.z), sz = sin(aSL.z);
    lp.y += 0.45; ln = vec3(ln.x, ln.y * cx - ln.z * sx, ln.y * sx + ln.z * cx); lp = vec3(lp.x, lp.y * cx - lp.z * sx, lp.y * sx + lp.z * cx);
    ln = vec3(ln.x * cz - ln.y * sz, ln.x * sz + ln.y * cz, ln.z); lp = vec3(lp.x * cz - lp.y * sz, lp.x * sz + lp.y * cz, lp.z);
    lp.y -= 0.45; lp *= s;
  } else {
    lp.xy *= s; lp.z = mix(lp.z * s, -aPos.z, aArm);
  }
  vL = position; vPart = aPart; vPaint = aPaint; vSeed = aSL.w;
  vec4 wp = modelMatrix * vec4(aPos + lp, 1.);
  vHp = (uHeroInv * wp).xyz;
  vN = ln;
  vV = mat3(uHeroInv) * (cameraPosition - wp.xyz);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const POT_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uTerra, uCobalt;
varying vec3 vHp, vV, vN, vL; varying vec2 vPart; varying vec4 vPaint; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV + vec3(0., 0., 1e-4));
  float sun = patioSun(vHp);
  float y = vL.y, ang = atan(vL.z, vL.x + 1e-5);
  vec2 sp = vec2(ang * 2.2, y * 5.) + vSeed * 37.;
  float n1 = vnoise(sp * 1.7), n2 = vnoise(sp * 5.3 + 11.), n3 = vnoise(sp * 13. + 5.);
  vec3 alb; float gloss = vPaint.a;
  if (vPart.x < 0.5) {
    vec3 terra = uTerra * (0.8 + 0.35 * n1);
    alb = vPaint.rgb * (0.86 + 0.2 * n1 + 0.08 * n2);
    // a hand-painted line on the white pots, a paler brush ring on some blue ones
    float line = smoothstep(0.035, 0.02, abs(y - 0.12 - 0.02 * sin(ang * 6. + vSeed * 20.)));
    line = max(line, smoothstep(0.03, 0.018, abs(y + 0.2)));
    line = max(line, smoothstep(0.075, 0.06, length(vec2(fract(ang * 1.9099 + vSeed) - 0.5, (y + 0.04) * 3.2))) * step(0.5, fract(vSeed * 3.3)));
    alb = mix(alb, uCobalt * 0.9, line * step(1.5, gloss) * 0.9);
    // chipped rim and knocks: raw clay shows through
    float chip = smoothstep(0.68, 0.74, n2 * 0.8 + 0.34 * smoothstep(0.31, 0.46, y) + 0.12 * n3 - 0.1);
    chip = max(chip, smoothstep(0.84, 0.87, n3 * 0.5 + n2 * 0.5 + 0.06));
    float raw = max(chip, step(0.5, 1. - min(gloss, 1.)));      // raw terracotta pots have no paint at all
    alb = mix(alb, terra, raw);
    alb = mix(alb, terra * 0.85, smoothstep(0.445, 0.46, y) * step(length(vL.xz), 0.497));   // unpainted inside the rim
    // lime bloom creeping up from the foot, wet foot under it
    float bloom = smoothstep(0.6, 0.95, n1 * 0.5 + n2 * 0.2 + smoothstep(0.05, -0.45, y) * 0.62);
    alb = mix(alb, vec3(0.80, 0.79, 0.75), bloom * 0.6);
    float wetF = smoothstep(-0.2 + 0.2 * n1, -0.4, y) * min(uWet, 1.) * (1. - 0.7 * smoothstep(5., 40., vHp.y - uEdgeY));
    alb *= mix(1., 0.55, wetF);
    gloss = min(gloss, 1.) * (1. - raw) * (1. - bloom * 0.7) + wetF * 0.8;
    alb *= 0.82 + 0.18 * smoothstep(-0.45, 0.3, y);                // grounded: darker toward the foot
  } else if (vPart.x < 1.5) {
    alb = vec3(0.10, 0.065, 0.045) * (0.6 + 0.8 * n3); gloss = 0.15 * min(uWet, 1.);
  } else {
    alb = vec3(0.035, 0.038, 0.046) * (0.7 + 0.6 * n2); gloss = 0.3;
  }
  vec3 light = patioLight(vHp, n, sun, 0.12);
  light *= 0.72 + 0.28 * smoothstep(-1., 0.3, n.z);                // the side toward the wall sits in its own shade
  vec3 col = patioTone(alb * light, 1.0);
  vec3 hv = normalize(uSunDir + v + vec3(0., 1e-4, 0.));
  float ndh = max(dot(n, hv), 0.);
  float fr = 1. - max(dot(n, v), 0.); fr = fr * fr * fr;
  col += uSunCol * (gloss * sun * (pow(ndh, 48.) * 1.1 + pow(ndh, 8.) * 0.08));
  col += uSkyCol * (gloss * (0.10 + 0.9 * fr) * 0.55 * (0.5 + 0.5 * n.y));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function makePots(U, list, pal, look, near) {
  const g = potGeometry(near ? 10 : 6, near);
  const n = list.length;
  const aPos = new Float32Array(n * 3), aSL = new Float32Array(n * 4), aPaint = new Float32Array(n * 4);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const p = list[i];
    aPos.set([p.x, p.y, POT_Z], i * 3);
    aSL.set([p.size, p.leanX, p.leanZ, p.seed], i * 4);
    const h = (p.seed * 7.31) % 1;
    if (p.paint === 0) col.copy(pal.cobalt).offsetHSL((h - 0.5) * 0.035, 0, (h - 0.5) * 0.07);
    else if (p.paint === 1) col.copy(pal.terra).offsetHSL((h - 0.5) * 0.02, 0, (h - 0.5) * 0.08);
    else col.setRGB(0.80, 0.80, 0.76);
    aPaint.set([col.r, col.g, col.b, p.paint === 0 ? 1 : p.paint === 1 ? 0 : 2], i * 4);
  }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aSL', new THREE.InstancedBufferAttribute(aSL, 4));
  g.setAttribute('aPaint', new THREE.InstancedBufferAttribute(aPaint, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 70, 3), 105);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U, uTerra: { value: pal.terra }, uCobalt: { value: pal.cobalt } },
    vertexShader: POT_VERT, fragmentShader: POT_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = near ? 'pots-near' : 'pots-far';
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// PLANTS: leaf-cluster cards and umbel cards on a dome (zonal geranium), with a second layout
// (hanging strands) blended in per instance for the trailing gitanillas.
// position = mound layout (unit mound radius); aCtrB + aOffB = trailing layout (x,z in pot sizes,
// y in strand lengths; the corner offset is kept apart so cards are not stretched).
// ---------------------------------------------------------------------------------------------
function plantGeometry(rng, near) {
  const pos = [], ctrA = [], ctrB = [], offB = [], nor = [], uv = [], card = [], idx = [];
  const A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), T = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const basis = (n, roll, size, out) => {
    T.crossVectors(Math.abs(n.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : UP, n).normalize(); B.crossVectors(n, T);
    const c = Math.cos(roll) * size * 0.5, s = Math.sin(roll) * size * 0.5;
    out[0].copy(T).multiplyScalar(c).addScaledVector(B, s); out[1].copy(B).multiplyScalar(c).addScaledVector(T, -s);
  };
  const ea = [new THREE.Vector3(), new THREE.Vector3()], eb = [new THREE.Vector3(), new THREE.Vector3()];
  const NB = new THREE.Vector3();
  // one card: mound centre/normal/size and trail centre/size
  const addCard = (type, ord, seed, cA, nA, sizeA, cB, nB, sizeB, lift) => {
    const roll = rng.range(-0.5, 0.5);
    basis(nA, roll, sizeA, ea); basis(nB, roll * 2, sizeB, eb);
    const base = pos.length / 3;
    for (let k = 0; k < 4; k++) {
      const sx = k === 0 || k === 3 ? -1 : 1, sy = k < 2 ? -1 : 1;
      pos.push(cA.x + ea[0].x * sx + ea[1].x * sy, cA.y + ea[0].y * sx + ea[1].y * sy, cA.z + ea[0].z * sx + ea[1].z * sy);
      ctrA.push(cA.x, cA.y, cA.z); ctrB.push(cB.x, cB.y, cB.z);
      offB.push(eb[0].x * sx + eb[1].x * sy, eb[0].y * sx + eb[1].y * sy, eb[0].z * sx + eb[1].z * sy);
      nor.push(nA.x, nA.y, nA.z); uv.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); card.push(type, ord, seed, lift);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // strands for the trailing layout
  const nStr = near ? 6 : 3, strands = [];
  for (let i = 0; i < nStr; i++) {
    const a = lerp(0.25, Math.PI - 0.25, (i + rng.range(0.2, 0.8)) / nStr);
    strands.push({ x: Math.cos(a) * 0.5, z: Math.sin(a) * 0.42, drift: rng.range(-0.25, 0.25), len: rng.range(0.55, 1.0), ph: rng() });
  }
  const strandPoint = (st, t, out) => out.set(st.x * (1 + 0.25 * t) + st.drift * t, 0.02 - t * st.len, st.z + 0.12 + 0.22 * Math.sin(t * 5 + st.ph * 6));
  const dirOnDome = (out) => {
    for (let k = 0; k < 8; k++) {
      const th = rng() * Math.PI * 2, ph = rng.range(0.1, 1.85);
      out.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (out.z > -0.55) break;
    }
    return out;
  };
  const D = new THREE.Vector3(), C = new THREE.Vector3(), CB = new THREE.Vector3();
  // leaves
  const nLeaf = near ? 44 : 7;
  for (let i = 0; i < nLeaf; i++) {
    dirOnDome(D);
    const rad = near ? rng.range(0.58, 0.9) : rng.range(0.4, 0.62);
    C.set(D.x * rad, D.y * rad * 0.8 + 0.12, D.z * rad);
    N.set(D.x, D.y + 0.35, D.z + 0.25).normalize();
    const st = strands[i % nStr], t = ((Math.floor(i / nStr) + rng.range(0.1, 0.9)) / Math.ceil(nLeaf / nStr));
    strandPoint(st, t, CB); CB.x += rng.range(-0.12, 0.12);
    NB.set(rng.range(-0.4, 0.4), rng.range(-0.1, 0.5), 1).normalize();
    addCard(0, i / nLeaf, rng(), C, N, near ? rng.range(0.72, 0.98) : rng.range(1.05, 1.3), CB, NB, near ? rng.range(0.62, 0.85) : rng.range(0.95, 1.25), clamp(C.y + 0.4, 0, 1.4));
  }
  // umbels, held out beyond the leaves; ord decides which appear at a given bloom amount
  const nUmb = near ? 14 : 6;
  const order = []; for (let i = 0; i < nUmb; i++) order.push((i + 0.5) / nUmb);
  for (let i = 0; i < nUmb; i++) {
    for (let k = 0; k < 8; k++) {
      const th = rng() * Math.PI * 2, ph = rng.range(0.05, 1.35);
      D.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (D.z > -0.2) break;
    }
    const rad = near ? rng.range(1.0, 1.2) : rng.range(0.85, 1.05);
    C.set(D.x * rad, D.y * rad * 0.85 + 0.14, D.z * rad);
    N.set(D.x, D.y + 0.15, D.z + 0.7).normalize();
    const st = strands[i % nStr]; strandPoint(st, rng.range(0.08, 0.98), CB); CB.z += 0.16; CB.x += rng.range(-0.15, 0.15);
    NB.set(rng.range(-0.25, 0.25), rng.range(0.0, 0.35), 1).normalize();
    const seed = rng();
    addCard(1, order[i], seed, C, N, near ? rng.range(0.6, 0.76) : rng.range(0.78, 0.98), CB, NB, near ? rng.range(0.56, 0.7) : rng.range(0.8, 1.0), clamp(C.y + 0.5, 0, 1.6));
    if (near) {
      // stalk: a thin ribbon from inside the mound to the umbel (collapses in the trailing layout)
      const base = pos.length / 3, w = 0.022;
      A.copy(C).multiplyScalar(0.45); T.set(-D.z, 0, D.x).normalize().multiplyScalar(w);
      const pts = [[A.x - T.x, A.y, A.z - T.z], [A.x + T.x, A.y, A.z + T.z], [C.x + T.x, C.y, C.z + T.z], [C.x - T.x, C.y, C.z - T.z]];
      for (let k = 0; k < 4; k++) { pos.push(...pts[k]); ctrA.push(...pts[k]); ctrB.push(CB.x, CB.y, CB.z); offB.push(0, 0, 0); nor.push(D.x, D.y, D.z); uv.push(k === 0 || k === 3 ? 0 : 1, k < 2 ? 0 : 1); card.push(2, order[i], seed, k < 2 ? 0.3 : 1); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  // a dark heart so nobody sees through the mound
  const segs = near ? 7 : 5, cb = pos.length / 3;
  pos.push(0, 0.62, 0.05); ctrA.push(0, 0.62, 0.05); ctrB.push(0, 0, 0); offB.push(0, 0.3, 0.05); nor.push(0, 1, 0.3); uv.push(0.5, 0.5); card.push(3, 0, 0.5, 0.6);
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.push(c * 0.66, -0.02, s * 0.66); ctrA.push(c * 0.66, -0.02, s * 0.66); ctrB.push(0, 0, 0); offB.push(c * 0.45, -0.02, s * 0.45); nor.push(c, 0.3, s); uv.push(0.5, 0.5); card.push(3, 0, 0.5, 0.1);
    idx.push(cb, cb + 1 + ((i + 1) % segs), cb + 1 + i);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCtrA', new THREE.Float32BufferAttribute(ctrA, 3));
  g.setAttribute('aCtrB', new THREE.Float32BufferAttribute(ctrB, 3));
  g.setAttribute('aOffB', new THREE.Float32BufferAttribute(offB, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 4));
  g.setIndex(idx);
  return g;
}

// A long trailing mass (a gitanilla years old): the same attributes as a plant in its trailing layout, but forty
// leaf cards, a dozen heads and a dark backing draped from the pot back to the lime and 12 to 22 m down it.
// x and z are in pot sizes, y in lengths of the trail.
function cascadeGeometry(rng) {
  const pos = [], ctrA = [], ctrB = [], offB = [], nor = [], uv = [], card = [], idx = [];
  const zAt = (t) => lerp(0.22, -0.74, smoothstep(0.0, 0.3, t));          // over the rim, then back against the wall
  const wAt = (t) => 0.12 + 1.02 * Math.sin(Math.min(1, t * 3.2 + 0.25) * Math.PI / 2) * (1 - 0.62 * t * t);
  const quad = (type, ord, seed, cx, cy, cz, e, roll, lift) => {
    const base = pos.length / 3, c = Math.cos(roll) * e * 0.5, s = Math.sin(roll) * e * 0.5;
    for (let k = 0; k < 4; k++) {
      const sx = k === 0 || k === 3 ? -1 : 1, sy = k < 2 ? -1 : 1, ox = c * sx - s * sy, oy = s * sx + c * sy;
      pos.push(cx + ox, cy + oy, cz); ctrA.push(cx, cy, cz); ctrB.push(cx, cy, cz); offB.push(ox, oy, 0.1 * sx * sy);
      nor.push(0, 0.25, 0.97); uv.push(sx * 0.5 + 0.5, sy * 0.5 + 0.5); card.push(type, ord, seed, lift);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // the backing: a tapering strip nobody sees through
  const N = 8, b0 = pos.length / 3;
  for (let i = 0; i <= N; i++) {
    const t = i / N, w = wAt(t) * 0.62;
    for (const sx of [-1, 1]) {
      pos.push(sx * w, -t, zAt(t) - 0.05); ctrA.push(sx * w, -t, 0); ctrB.push(sx * w, 0.02 - t, zAt(t) - 0.06); offB.push(0, 0, 0);
      nor.push(0, 0.25, 0.97); uv.push(0.5, 0.5); card.push(3, 0, 0.5, 0.5);
    }
    if (i < N) { const a = b0 + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  for (let i = 0; i < 44; i++) {
    const t = (i + rng.range(0.1, 0.9)) / 44, w = wAt(t);
    quad(0, i / 44, rng(), rng.range(-1, 1) * w, 0.03 - t, zAt(t) + rng.range(0.0, 0.14), rng.range(0.85, 1.2) * (1 - 0.25 * t), rng.range(-0.6, 0.6), 0.6);
  }
  for (let i = 0; i < 14; i++) {
    const t = rng.range(0.03, 0.97), w = wAt(t);
    quad(1, (i + 0.5) / 14, rng(), rng.range(-1, 1) * w * 0.9, 0.03 - t, zAt(t) + 0.2, rng.range(0.4, 0.52), 0, 0.8);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCtrA', new THREE.Float32BufferAttribute(ctrA, 3));
  g.setAttribute('aCtrB', new THREE.Float32BufferAttribute(ctrB, 3));
  g.setAttribute('aOffB', new THREE.Float32BufferAttribute(offB, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 4));
  g.setIndex(idx);
  return g;
}

const PLANT_VERT = /* glsl */`
uniform mat4 uHeroInv; uniform float uTime;
attribute vec3 aCtrA, aCtrB, aOffB; attribute vec4 aCard; attribute vec3 aPos; attribute vec4 aPl, aCol, aLeaf;
varying vec3 vHp, vN, vV; varying vec2 vUv; varying vec4 vCard, vCol, vLeaf;
#include <fog_pars_vertex>
void main(){
  float s = aPl.x, kind = aPl.y, RL = aPl.z, seed = aPl.w, type = aCard.x;
  float show = (type > 0.5 && type < 2.5) ? step(aCard.y, aCol.a) : 1.;
  // every mound is turned and mirrored its own way
  float ang = (fract(seed * 13.7) - 0.5) * 1.3, ca = cos(ang), sa = sin(ang), mir = seed > 0.5 ? 1. : -1.;
  vec3 pm = vec3(position.x * mir, position.y, position.z), nm = vec3(normal.x * mir, normal.y, normal.z);
  float sq = 0.8 + 0.4 * fract(seed * 5.3);
  pm = vec3(pm.x * ca + pm.z * sa, pm.y * sq, -pm.x * sa + pm.z * ca) * RL;
  vec3 cm = vec3(aCtrA.x * mir, aCtrA.y, aCtrA.z);
  cm = vec3(cm.x * ca + cm.z * sa, cm.y * sq, -cm.x * sa + cm.z * ca) * RL;
  cm.z = max(cm.z, -${(POT_Z - 0.8).toFixed(1)});
  nm = vec3(nm.x * ca + nm.z * sa, nm.y, -nm.x * sa + nm.z * ca);
  pm.z = max(pm.z, -${(POT_Z - 0.4).toFixed(1)});                                  // never through the wall
  vec3 pt = vec3(aCtrB.x * mir, aCtrB.y, aCtrB.z) * vec3(s, RL, s) + vec3(aOffB.x * mir, aOffB.y, aOffB.z) * s;
  pt.z = max(pt.z, -${(POT_Z - 0.35).toFixed(2)});
  vec3 lp = mix(pm, pt, kind);
  vec3 nrm = mix(nm, vec3(0., 0.25, 0.97), kind);
  if (type > 0.5 && type < 1.5) {
    // umbels are domes: turn the card to the camera about its centre
    vec3 ctr = mix(cm, vec3(aCtrB.x * mir, aCtrB.y, aCtrB.z) * vec3(s, RL, s), kind);
    float size = mix(length(position - aCtrA) * RL, length(aOffB) * s, kind) * 1.414;
    vec3 camL = (uHeroInv * vec4(cameraPosition, 1.)).xyz;
    vec3 toCam = camL - (aPos + vec3(0., s * 0.4, 0.) + ctr);
    vec3 rt = normalize(cross(vec3(0., 1., 0.), toCam) + vec3(1e-4, 0., 0.));
    vec3 upv = normalize(cross(toCam, rt) + vec3(0., 1e-4, 0.));
    lp = ctr + (rt * (uv.x - 0.5) + upv * (uv.y - 0.5)) * size;
    nrm = normalize(toCam + vec3(0., 1e-3, 0.)) * 0.5 + vec3(0., 0.5, 0.4);
  }
  float t = uTime;
  vec3 sw = vec3(sin(t * 1.1 + seed * 40. + position.y * 2.), 0.3 * sin(t * 1.7 + seed * 9. + position.x * 3.), cos(t * 0.9 + seed * 23.)) * (0.03 * RL * aCard.w * (1. - kind));
  float hang = clamp(-aCtrB.y, 0., 1.);
  sw += vec3(sin(t * 0.8 + seed * 31. + aCtrB.x * 5.), 0., 0.4 * cos(t * 0.7 + seed * 11.)) * (0.2 * s * hang * hang * kind);
  vec3 local = aPos + vec3(0., s * 0.4, 0.) + (lp + sw) * show;
  vec4 wp = modelMatrix * vec4(local, 1.);
  vHp = (uHeroInv * wp).xyz;
  vN = nrm;
  vV = mat3(uHeroInv) * (cameraPosition - wp.xyz);
  vUv = uv;
  float ao = mix(mix(0.45, 1., smoothstep(0.3, 1.0, length(position))), 0.9, kind);
  vCard = vec4(type, aCard.z + seed, ao, kind); vCol = aCol; vLeaf = aLeaf;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PLANT_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec3 vHp, vN, vV; varying vec2 vUv; varying vec4 vCard, vCol, vLeaf;
#include <fog_pars_fragment>
void main(){
  float type = vCard.x, seed = vCard.y;
  vec2 uv = vUv;
  float fwS = fwidth(uv.x) + fwidth(uv.y);
  float lodf = smoothstep(0.03, 0.15, fwS);
  float sun = patioSun(vHp);
  float farK = smoothstep(45., 95., length(vV));               // across the patio the planting is simplified
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 nl = normalize(n + vec3(0., 0.55, 0.45));
  vec3 lampL = patioLamp(vHp, nl);
  vec3 base = (patioLight(vHp, nl, sun, 0.6) + uSkyCol * 0.45) * vCard.z;
  vec3 col;
  if (type < 0.5) {
    float hit = 0., bd = 0., bm = 0., bh = 0., bt = 0.; vec2 bq = vec2(0.);
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 hc = h22(vec2(fi * 7.3 + seed * 91., seed * 37. + fi * 3.1));
      float a = fi * 1.5708 + seed * 6.283 + (hc.x - 0.5) * 0.7;
      vec2 c = vec2(0.5) + vec2(cos(a), sin(a)) * (i < 4 ? 0.215 : 0.0);
      float ri = 0.2 + 0.075 * hc.y;
      vec2 q = uv - c;
      float d = length(q) / ri, th = atan(q.y, q.x + 1e-5) + hc.x * 6.283;
      float edge = 1. - 0.085 * (1. - lodf) * cos(th * 9.) - 0.5 * (1. - 0.6 * lodf) * smoothstep(0.5, 0., abs(sin(th * 0.5)));
      float m = d / max(edge, 0.05);
      if (m < 1.) { hit = 1.; bd = d; bm = m; bh = hc.y; bt = th; bq = q / ri; }
    }
    if (hit < 0.5) discard;
    float near = 1. - lodf;
    vec3 g = vLeaf.rgb * (0.9 + 0.7 * bh) * (0.78 + 0.22 * bd);
    // seven veins from the stalk, a crisp horseshoe band, a cupped blade: only where the leaf is large on screen
    float vein = smoothstep(0.16, 0.03, abs(sin(bt * 3.5))) * smoothstep(0.08, 0.4, bd) * (1. - 0.6 * smoothstep(0.7, 1., bd));
    g *= 1. + 0.42 * vein * near;
    g = mix(g, g * vec3(0.55, 0.36, 0.30), smoothstep(0.15, 0.06, abs(bd - 0.52)) * vLeaf.a * 0.8 * near);   // the horseshoe
    g *= 1. - 0.3 * near * smoothstep(0.25, 0.0, bd);                                   // the dimple where the stalk joins
    g *= 1. + 0.22 * near * (bq.y - bq.x) * 0.7;
    float rim = smoothstep(0.7, 1.0, bm);
    g *= 1. - 0.3 * near * smoothstep(0.9, 1.0, bm) * (1. - sun);                        // a dark lip in shade, a lit one in sun
    col = g * base + g * uSunCol * (sun * (0.08 + 0.75 * rim * (1. - 0.7 * lodf))) * vec3(1.1, 1.1, 0.5) + uSkyCol * (0.07 * (1. - 0.6 * sun)) * (0.6 + 0.4 * bd);
  } else if (type < 1.5) {
    vec2 q = uv - 0.5;
    float mask = 0., sh = 1., tone = 0.5;
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      float hh = h11(fi * 3.7 + seed * 53.);
      float a = fi * 0.7854 + seed * 6.;
      vec2 e = q - vec2(cos(a), sin(a)) * (i == 0 ? 0. : 0.25 * (0.8 + 0.35 * hh));
      float d = length(e) / 0.165, th = atan(e.y, e.x + 1e-5) + fi * 1.3;
      float pet = 0.7 + 0.3 * abs(cos(th * 2.5));
      // five petals round a dark throat, each creased down its middle and paler at its lip
      if (d < pet) { mask = 1.; sh = (0.42 + 0.58 * smoothstep(0.04, 0.5, d)) * (0.88 + 0.12 * cos(th * 5.)) * (1. + 0.16 * smoothstep(0.72, 1., d / pet)); tone = hh; }
    }
    float rr = length(q) / 0.42;
    mask = mix(mask, step(rr, 1.), lodf);
    if (mask < 0.5) discard;
    // far away a head is a shaded dome, never a flat disc: lit from above, darker at its rim and heart, mottled
    float dome = (0.6 + 0.5 * smoothstep(-0.3, 0.3, q.y)) * (1. - 0.32 * rr * rr) * (0.82 + 0.36 * vnoise(q * 11. + seed * 17.));
    float white = smoothstep(0.35, 0.6, vCol.g);
    // far away coral and scarlet are one red (a coral head in the sun reads as an orange dot), and a head only a few
    // pixels across fades toward the plant's mean so the wall does not speckle
    vec3 hue = mix(vCol.rgb, vec3(vCol.r * 0.92, vCol.g * 0.4, vCol.b * 0.6), farK * (1. - white));
    vec3 pc = hue * mix(sh * (0.8 + 0.4 * tone), mix(dome, 0.82, 0.5 * farK), lodf);
    // petals are kept under the tone map's shoulder, so in the sun they are scarlet, not orange
    vec3 pl = uSunCol * (sun * mix(0.62, 0.9, white) * mix(1., 0.62 + 0.3 * white, farK)) + uSkyCol * 0.95 + uBounce + lampL;
    col = pc * pl * vCard.z + uSkyCol * (0.07 * (1. - sun)) * (0.5 + pc) + pc * (uGlow * (0.3 + 3. * white) * (0.15 + 0.85 * sun));
    col = mix(col, vLeaf.rgb * base * 1.1 + col * 0.35, 0.45 * smoothstep(0.25, 0.7, fwS) * (1. - white));
  } else if (type < 2.5) {
    col = vec3(0.16, 0.24, 0.08) * base;
  } else {
    col = vLeaf.rgb * 0.45 * base;
  }
  // in the shade, seen from across the patio, leaf and bloom sink toward the blue of the wall: the lower half goes quiet
  float quiet = mix(0.35, 1., farK) * (1. - sun) * (1. - min(uGlow * 12., 0.7));
  float lum = dot(col, vec3(0.3, 0.5, 0.2));
  col = mix(col, lum * vec3(0.62, 0.84, 1.3), 0.58 * quiet) * (1. - 0.22 * quiet);
  gl_FragColor = vec4(patioTone(col, 1.08), 1.);
  #include <fog_fragment>
}`;

function makePlants(U, list, pal, g, name) {
  const n = list.length;
  const aPos = new Float32Array(n * 3), aPl = new Float32Array(n * 4), aCol = new Float32Array(n * 4), aLeaf = new Float32Array(n * 4);
  const blooms = [pal.scarlet, new THREE.Color('#EE6A4C'), new THREE.Color('#D4D0C6'), new THREE.Color('#D0307C')];
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const p = list[i], h = (p.seed * 3.77) % 1, h2 = (p.seed * 9.13) % 1;
    aPos.set([p.x, p.y, POT_Z], i * 3);
    const trail = p.kind === 1;
    aPl.set([p.size, trail ? 1 : 0, p.cascade ? p.cascade : trail ? p.trail : p.size * (0.25 + 0.5 * p.spread), p.seed], i * 4);
    col.copy(blooms[p.colour]).offsetHSL((h - 0.5) * 0.03, 0, (h2 - 0.5) * 0.06);
    aCol.set([col.r, col.g, col.b, p.bloom], i * 4);
    col.copy(pal.leaf);
    if (p.kind === 2) col.offsetHSL(-0.02, 0.1, 0.07); else if (p.kind === 3) col.offsetHSL(-0.04, 0.15, 0.1); else col.offsetHSL((h2 - 0.5) * 0.05, 0, (h - 0.5) * 0.08);
    aLeaf.set([col.r, col.g, col.b, p.kind === 0 ? 0.5 + 0.5 * h : trail ? 0.15 : 0], i * 4);
  }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aPl', new THREE.InstancedBufferAttribute(aPl, 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 4));
  g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aLeaf, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 70, 3), 110);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U },
    vertexShader: PLANT_VERT, fragmentShader: PLANT_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = name;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// WATER: the morning's watering still overflowing pot to pot. Each drop is a camera-facing quad on
// a closed-form fall (y = y0 - h f^2); a splash crown sits on the rim it lands on.
// ---------------------------------------------------------------------------------------------
const DROP_VERT = /* glsl */`
uniform mat4 uHeroInv; uniform float uTime, uEdgeY, uSunTan;
attribute vec3 aA; attribute vec4 aB; attribute float aKind;
varying vec2 vUv; varying vec3 vHp; varying vec4 vInfo; varying float vBand;
#include <fog_pars_vertex>
void main(){
  float h = max(aB.y, 0.3), T = sqrt(2. * h / 9.8) * 1.15;
  float ph = uTime / T + aB.z;
  float f = fract(ph);
  vec3 c; vec2 size; float life = 1.;
  if (aKind < 0.5) {
    float ff = min(f * 1.15, 1.);
    c = aA + vec3(aB.x * ff, -h * ff * ff, 0.);
    size = vec2(0.15, 0.2 + 0.34 * ff);
    life = smoothstep(0., 0.06, f) * (1. - smoothstep(0.84, 0.87, f));
  } else {
    float k = fract(ph * aB.w);                       // one crown for each drop that lands
    c = aA + vec3(0., 0.18 + 0.5 * k, 0.);
    size = vec2(0.4 + 1.1 * k, 0.25 + 0.5 * k);
    life = (1. - k) * (1. - k);
    f = k;
  }
  vec4 wc = modelMatrix * vec4(c, 1.);
  vec3 toCam = cameraPosition - wc.xyz;
  float dist = length(toCam);
  vec3 right = normalize(cross(vec3(0., 1., 0.), toCam) + vec3(1e-4, 0., 0.));
  // the band just under the line on the lime, where each chain flashes link by link as the edge passes down it
  float ride = smoothstep(uEdgeY - 10.5, uEdgeY - 5., c.y) * (1. - smoothstep(uEdgeY + 0.5, uEdgeY + 3.5, c.y));
  vBand = ride;
  float wide = max(size.x, dist * (0.0062 + 0.0045 * ride));
  float tall = max(size.y, dist * (0.0075 + 0.005 * ride));
  vec3 wpos = wc.xyz + right * (position.x * wide) + vec3(0., position.y * tall, 0.);
  vHp = (uHeroInv * wc).xyz;
  vUv = position.xy * 2.;
  vInfo = vec4(aKind, life * min(1., size.x / wide * 1.6 + ride), f, fract(aB.z * 17.3 + floor(ph) * 0.37));
  vec4 mvPosition = viewMatrix * vec4(wpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DROP_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec2 vUv; varying vec3 vHp; varying vec4 vInfo; varying float vBand;
#include <fog_pars_fragment>
void main(){
  float r = length(vUv), a;
  if (vInfo.x < 0.5) {
    // a teardrop: round below, drawn out above
    float w = mix(1., 0.35, smoothstep(-0.3, 1., vUv.y));
    a = 1. - smoothstep(0.55, 1., length(vec2(vUv.x / w, vUv.y)));
  } else {
    // a crown: the upper arc of a widening ring
    float ring = 1. - smoothstep(0.0, 0.22, abs(length(vec2(vUv.x, vUv.y * 1.3 + 0.35)) - 0.72));
    a = ring * smoothstep(-0.5, 0.1, vUv.y) * (0.6 + 0.4 * step(0.5, fract(atan(vUv.y + 0.4, vUv.x + 1e-5) * 3.5)));
  }
  a *= vInfo.y;
  if (a < 0.01) discard;
  float sun = patioSun(vHp);
  float ride = exp(-max(vHp.y - (uEdgeY - 3.5 * uSunTan), 0.) / 7.);      // brightest just above the line
  float tw = 0.55 + 0.45 * step(0.45, fract(vInfo.w * 7. + uTime * 1.7));
  vec3 col = uSkyCol * 1.5 + vec3(0.10, 0.11, 0.13) + uBounce;
  col += uSunCol * (sun * tw * (1.8 + 5.5 * ride));
  float flash = vBand * step(0.42, fract(vInfo.w * 13. + uTime * 2.3));       // silver sparks under the line
  col += uSunCol * (flash * 3.2);
  gl_FragColor = vec4(col, a * max(0.55 + 0.45 * sun, flash));
  #include <fog_fragment>
}`;

function makeDrops(U, layout, rng, detail) {
  const A = [], B = [], K = [];
  for (const ch of layout.chains) {
    const per = Math.max(2, Math.round((3 + (ch.seed * 3) % 2) * detail));
    for (let i = 0; i < ch.run.length - 1; i++) {
      const a = ch.run[i], b = ch.run[i + 1];
      const side = (i % 2 ? -1 : 1) * ch.side;
      const x0 = a.x + side * a.size * 0.16, y0 = a.y - a.size * 0.45, z0 = POT_Z + a.size * 0.3;
      const land = b.y + b.size * 0.42 + (b.kind === 5 ? 0 : 0.5);
      const h = Math.max(0.6, y0 - land), dx = (b.x - x0) * 0.35 + rng.range(-0.15, 0.15);
      const ph = rng();
      for (let k = 0; k < per; k++) { A.push(x0, y0, z0); B.push(dx, h, ph + k / per, rng()); K.push(0); }
      A.push(x0 + dx, y0 - h, z0 + 0.1); B.push(0, h, ph - 0.87, per); K.push(1);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
  g.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array(K), 1));
  g.instanceCount = K.length;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 70, 3), 110);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U },
    vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'drops'; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// FITTINGS: everything else is vertex-coloured geometry under one material. aMat picks the
// surface (0 lime, 1 gloss paint, 2 iron, 3 roof tile, 4 wood and cane, 5 painted plate,
// 6 feather, 7 dark room behind a window, 8 gecko skin); aPivot + aSw swing a part in the vertex
// shader (axis 1 = about Y through the pivot, 2 = about Z; amplitude; phase).
// ---------------------------------------------------------------------------------------------
const FIT_VERT = /* glsl */`
uniform mat4 uHeroInv; uniform float uTime;
attribute vec3 color; attribute float aMat; attribute vec3 aPivot, aSw;
varying vec3 vHp, vN, vV, vL, vCol; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
void main(){
  vec3 lp = position, ln = normal;
  if (aSw.x > 0.5) {
    float ang = aSw.y * sin(uTime * (0.7 + 0.5 * fract(aSw.z * 3.7)) + aSw.z * 6.283);
    ang += 0.35 * aSw.y * sin(uTime * 2.3 + aSw.z * 11.);
    float c = cos(ang), s = sin(ang);
    vec3 q = lp - aPivot;
    if (aSw.x < 1.5) { q = vec3(q.x * c + q.z * s, q.y, -q.x * s + q.z * c); ln = vec3(ln.x * c + ln.z * s, ln.y, -ln.x * s + ln.z * c); }
    else { q = vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z); ln = vec3(ln.x * c - ln.y * s, ln.x * s + ln.y * c, ln.z); }
    lp = aPivot + q;
  }
  #ifdef USE_INSTANCING
    vec4 wp = modelMatrix * (instanceMatrix * vec4(lp, 1.));
    ln = mat3(instanceMatrix) * ln;
  #else
    vec4 wp = modelMatrix * vec4(lp, 1.);
  #endif
  vHp = (uHeroInv * wp).xyz;
  vN = mat3(uHeroInv) * (mat3(modelMatrix) * ln);
  vV = mat3(uHeroInv) * (cameraPosition - wp.xyz);
  vL = position; vCol = color; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FIT_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uCobalt;
varying vec3 vHp, vN, vV, vL, vCol; varying vec2 vUv; varying float vMat;
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV + vec3(0., 0., 1e-4));
  float sun = patioSun(vHp);
  vec3 alb = vCol; float gloss = 0., wrap = 0.2;
  float n1 = vnoise(vL.xy * 1.3 + vL.z * 0.7), n2 = vnoise(vL.xy * 5.1 + vL.zx * 3.3 + 4.), n3 = vnoise(vec2(vL.x + vL.z, vL.y) * 17.);
  if (vMat < 0.5) { alb *= 0.9 + 0.12 * n1 + 0.06 * n2; wrap = 0.7; }
  else if (vMat < 1.5) { alb *= 0.8 + 0.3 * n2 + 0.1 * n3; alb = mix(alb, alb * 0.6 + 0.08, smoothstep(0.7, 0.85, n3 * 0.6 + n1 * 0.4)); gloss = 0.28; }
  else if (vMat < 2.5) { alb *= 0.7 + 0.6 * n2; alb = mix(alb, vec3(0.16, 0.07, 0.03), smoothstep(0.72, 0.9, n1) * 0.5); gloss = 0.35; }
  else if (vMat < 3.5) {
    float lich = smoothstep(0.55, 0.8, vnoise(vL.xz * 0.9 + 2.) * 0.6 + n2 * 0.4);
    alb *= 0.75 + 0.4 * n1 + 0.15 * n3; alb = mix(alb, vec3(0.42, 0.40, 0.30), lich * 0.45);
    alb *= 0.75 + 0.25 * smoothstep(0.0, 0.25, abs(fract(vUv.y * 9.) - 0.5));                  // the lap of each tile
    wrap = 0.35;
  }
  else if (vMat < 4.5) { float gr = vnoise(vec2(vUv.x * 40., vUv.y * 3.) + vL.x); alb *= 0.72 + 0.4 * gr + 0.15 * n3; alb *= 0.8 + 0.2 * smoothstep(0.02, 0.06, abs(fract(vUv.y * 6. + 0.5) - 0.5)); gloss = 0.12; }
  else if (vMat < 5.5) {
    float r = length(vUv), th = atan(vUv.y, vUv.x + 1e-5);
    float k = fract(vCol.r * 5.);                                                           // each plate its own pattern
    float pet = cos(th * floor(5. + k * 6.)) * 0.5 + 0.5;
    float blue = smoothstep(0.03, 0.0, abs(r - 0.9) - 0.035) + smoothstep(0.02, 0., abs(r - 0.6) - 0.012)
      + step(r, 0.56) * step(0.28, r) * smoothstep(0.55, 0.75, pet + 0.25 * sin(r * 30.)) + step(r, 0.2) * step(0.5, fract(th * 1.2732 + k));
    alb = mix(vec3(0.80, 0.80, 0.77), uCobalt * 1.15, clamp(blue, 0., 1.)) * (0.9 + 0.15 * n2);
    gloss = 1.;
  }
  else if (vMat < 6.5) { alb *= 0.85 + 0.3 * n3; wrap = 0.6; }
  else if (vMat < 7.5) { alb *= 0.35 + 0.65 * smoothstep(0.2, 1., vUv.y); wrap = 1.; sun *= 0.15; }
  else { float sp = smoothstep(0.55, 0.75, vnoise(vL.xy * 9.)); alb *= 0.8 + 0.3 * n3; alb = mix(alb, alb * 0.55, sp); wrap = 0.4; }
  vec3 col = patioTone(alb * patioLight(vHp, n, sun, wrap), 1.0);
  vec3 hv = normalize(uSunDir + v + vec3(0., 1e-4, 0.));
  float ndh = max(dot(n, hv), 0.), fr = 1. - max(dot(n, v), 0.);
  col += uSunCol * (gloss * sun * (pow(ndh, 40.) * 0.9 + pow(ndh, 6.) * 0.06)) + uSkyCol * (gloss * fr * fr * 0.4);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function fitBuilder() {
  const parts = [];
  const e = new THREE.Euler(), m = new THREE.Matrix4();
  const add = (g, color, mat, o = {}) => {
    if (o.rot) { m.makeRotationFromEuler(e.set(o.rot[0], o.rot[1], o.rot[2])); g.applyMatrix4(m); }
    if (o.at) g.translate(o.at[0], o.at[1], o.at[2]);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3), mt = new Float32Array(n).fill(mat), pv = new Float32Array(n * 3), sw = new Float32Array(n * 3);
    const c = color.isColor ? [color.r, color.g, color.b] : color;
    for (let i = 0; i < n; i++) {
      col.set(c, i * 3);
      if (o.sw) { pv.set(o.pivot, i * 3); sw.set(o.sw, i * 3); }
    }
    if (o.shade) {                                           // darken toward one end (baked grounding)
      const p = g.attributes.position;
      for (let i = 0; i < n; i++) { const k = o.shade(p.getX(i), p.getY(i), p.getZ(i)); col[i * 3] *= k; col[i * 3 + 1] *= k; col[i * 3 + 2] *= k; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aMat', new THREE.BufferAttribute(mt, 1));
    g.setAttribute('aPivot', new THREE.BufferAttribute(pv, 3));
    g.setAttribute('aSw', new THREE.BufferAttribute(sw, 3));
    parts.push(g);
    return g;
  };
  const box = (w, h, d, at, color, mat, o = {}) => add(new THREE.BoxGeometry(w, h, d), color, mat, { ...o, at });
  const cyl = (r0, r1, h, segs, at, color, mat, o = {}) => add(new THREE.CylinderGeometry(r1, r0, h, segs, o.hs || 1, !!o.open), color, mat, { ...o, at });
  // a rod between two points (square or round section)
  const rod = (a, b, r, color, mat, o = {}) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length();
    const g = new THREE.CylinderGeometry(o.r1 ?? r, r, len, o.segs || 4, 1, false);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    return add(g, color, mat, { ...o, rot: null, at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] });
  };
  const build = () => {
    const g = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    return g;
  };
  return { add, box, cyl, rod, build };
}

function buildArchitecture(F, layout, pal, rng) {
  const lime = pal.lime.clone().multiplyScalar(0.8), limeHi = pal.lime.clone().multiplyScalar(0.86);
  const green = new THREE.Color('#2C6A3C'), greenDk = new THREE.Color('#215231');
  const iron = new THREE.Color(0.04, 0.045, 0.055), woodDk = new THREE.Color('#4A3524'), wood = new THREE.Color('#7A5A38');
  const tile = pal.terra.clone().multiplyScalar(0.72);
  // the wall's body behind the lime, and its ends
  F.box(WALL_W, WALL_H, 6, [0, WALL_H / 2, -3.06], lime, 0);
  // eave: soffit boards, rafter tails, a slab and seventy runs of half-round tiles
  const th = Math.atan2(5.6, 10.6), slopeLen = 12.2;
  F.box(WALL_W + 0.8, 0.45, 11, [0, 139.72, -0.9], woodDk, 4);
  for (let i = 0; i < 35; i++) F.box(0.55, 0.7, 4.3, [COL0 + i * 4 + 2, 139.25, 2.25], woodDk, 4, { shade: (x, y, z) => 0.7 + 0.3 * (z / 4.4) });
  F.box(WALL_W + 1.2, 0.3, slopeLen, [0, 143.25, -0.7], tile.clone().multiplyScalar(0.4), 3, { rot: [th, 0, 0] });
  for (let i = 0; i < 70; i++) {
    const k = rng.range(0.72, 1.12), pale = rng.chance(0.12) ? 0.25 : 0;
    const c = tile.clone().multiplyScalar(k).lerp(new THREE.Color(0.55, 0.5, 0.42), pale);
    const g = new THREE.CylinderGeometry(0.6, 0.8, slopeLen + rng.range(0, 0.5), 6, 1, true, -Math.PI / 2, Math.PI);
    F.add(g, c, 3, { rot: [th - Math.PI / 2, 0, 0], at: [-69 + i * 2 + rng.range(-0.08, 0.08), 143.55, -0.75] });
  }
  F.add(new THREE.CylinderGeometry(0.95, 0.95, WALL_W + 1.2, 7, 1, true, 0, Math.PI), tile.clone().multiplyScalar(0.9), 3, { rot: [0, 0, Math.PI / 2], at: [0, 146.2, -6.2] });
  // a white chimney on this roof for the skyline
  const cx = rng.range(-50, 50);
  F.box(4.6, 6.4, 4.6, [cx, 147.6, -2.6], limeHi, 0, { shade: (x, y) => 0.8 + 0.2 * smoothstep(144.5, 148, y) });
  F.box(5.6, 0.5, 5.6, [cx, 151.0, -2.6], lime, 0);
  F.box(3.9, 0.25, 5.2, [cx - 1.3, 152.1, -2.6], tile, 3, { rot: [0, 0, 0.62] });
  F.box(3.9, 0.25, 5.2, [cx + 1.3, 152.1, -2.6], tile.clone().multiplyScalar(0.85), 3, { rot: [0, 0, -0.62] });

  // windows: dark room, moulded surround, sill, basket grille, two shutter leaves
  for (const w of layout.windows) {
    const { x, y, w: ww, h: hh } = w;
    F.box(ww, hh, 0.1, [x, y, 0.06], new THREE.Color(0.07, 0.08, 0.12), 7);
    const t = 0.55, d = 0.5;
    F.box(ww + 2 * t, t, d, [x, y + hh / 2 + t / 2, d / 2], limeHi, 0);
    F.box(ww + 2 * t, t * 0.5, d * 1.5, [x, y + hh / 2 + t * 1.2, d * 0.75], limeHi, 0);            // a little drip mould
    F.box(t, hh, d, [x - ww / 2 - t / 2, y, d / 2], limeHi, 0);
    F.box(t, hh, d, [x + ww / 2 + t / 2, y, d / 2], limeHi, 0);
    F.box(ww + 2.6, 0.5, 1.3, [x, y - hh / 2 - 0.25, 0.65], limeHi, 0);
    F.box(ww + 1.8, 0.35, 0.9, [x, y - hh / 2 - 0.65, 0.45], lime, 0);
    // grille
    const gz = 1.05, x0 = x - ww / 2 - 0.1, x1 = x + ww / 2 + 0.1, y0 = y - hh / 2 + 0.1, y1 = y + hh / 2 - 0.1;
    for (let i = 0; i <= 5; i++) { const gx = lerp(x0, x1, i / 5); F.rod([gx, y0 - 0.2, gz], [gx, y1 + 0.5, gz], 0.085, iron, 2, { r1: 0.05 }); }
    for (let j = 0; j < 4; j++) { const gy = lerp(y0, y1, j / 3); F.rod([x0 - 0.15, gy, gz], [x1 + 0.15, gy, gz], 0.075, iron, 2); }
    for (const sx of [x0, x1]) for (const sy of [y0, y1]) F.rod([sx, sy, 0.05], [sx, sy, gz], 0.075, iron, 2);
    // shutters hinged on the surround's outer edge, folded back toward the wall
    const lw = ww / 2 + 0.2;
    for (const side of [-1, 1]) {
      const hx = x + side * (ww / 2 + t + 0.1), hz = 0.75;
      const swings = w.swing && side > 0;
      const ang = side * Math.PI * (swings ? 0.66 : 0.52 + 0.4 * w.open + (side > 0 ? 0.03 : 0));
      const o = swings ? { sw: [1, 0.2, w.seed], pivot: [hx, y, hz] } : {};
      const leaf = (bw, bh, bd, ox, oy, col) => {
        const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(-side * (lw / 2 + ox), oy, 0); g.rotateY(ang); g.translate(hx, y, hz);
        F.add(g, col, 1, o);
      };
      leaf(lw, hh + 0.5, 0.16, 0, 0, green);
      leaf(lw * 0.7, hh * 0.38, 0.24, 0, hh * 0.225, greenDk);
      leaf(lw * 0.7, hh * 0.38, 0.24, 0, -hh * 0.225, greenDk);
    }
  }

  // balcony: slab on corbels, door with open green leaves, iron rail, a cane chair
  const b = layout.balcony, bx = b.x, by = b.y, bw = 14.5, bd = 5.2;
  F.box(bw, 0.8, bd, [bx, by - 0.4, bd / 2], limeHi, 0, { shade: (x, y) => (y < by - 0.5 ? 0.75 : 1) });
  F.box(bw + 0.5, 0.35, bd + 0.25, [bx, by + 0.05, bd / 2 + 0.1], lime, 0);
  for (const k of [-0.42, -0.14, 0.14, 0.42]) {
    F.box(0.9, 2.6, 3.4, [bx + k * bw, by - 1.9, 1.5], lime, 0, { rot: [0.5, 0, 0], shade: (x, y) => 0.7 + 0.3 * smoothstep(by - 3.5, by - 0.8, y) });
  }
  const dw = 8.4, dh = 18.5;
  F.box(dw, dh, 0.1, [bx, by + dh / 2, 0.06], new THREE.Color(0.06, 0.07, 0.10), 7);
  F.box(dw + 1.6, 0.8, 0.6, [bx, by + dh + 0.4, 0.3], limeHi, 0);
  F.box(0.8, dh, 0.6, [bx - dw / 2 - 0.4, by + dh / 2, 0.3], limeHi, 0);
  F.box(0.8, dh, 0.6, [bx + dw / 2 + 0.4, by + dh / 2, 0.3], limeHi, 0);
  for (const side of [-1, 1]) {
    const hx = bx + side * (dw / 2 + 0.9), hz = 0.8, ang = side * 2.75, lw = dw / 2;
    for (const [w2, h2, d2, oy, col] of [[lw, dh, 0.2, 0, green], [lw * 0.68, dh * 0.26, 0.3, dh * 0.3, greenDk], [lw * 0.68, dh * 0.26, 0.3, 0, greenDk], [lw * 0.68, dh * 0.26, 0.3, -dh * 0.3, greenDk]]) {
      const g = new THREE.BoxGeometry(w2, h2, d2); g.translate(-side * lw / 2, oy, 0); g.rotateY(ang); g.translate(hx, by + dh / 2, hz);
      F.add(g, col, 1);
    }
  }
  // rail 10 m high: balusters with a knuckle, top and bottom bars, on three sides
  const rz = bd - 0.25, rx0 = bx - bw / 2 + 0.3, rx1 = bx + bw / 2 - 0.3, rt = by + 9.6;
  const bal = (px, pz) => { F.rod([px, by + 0.2, pz], [px, rt, pz], 0.11, iron, 2, { r1: 0.08 }); F.box(0.42, 0.42, 0.42, [px, by + 5.2, pz], iron, 2, { rot: [0, 0.785, 0.785] }); };
  for (let i = 0; i <= 12; i++) bal(lerp(rx0, rx1, i / 12), rz);
  for (let i = 1; i <= 3; i++) { bal(rx0, lerp(rz, 0.3, i / 3.4)); bal(rx1, lerp(rz, 0.3, i / 3.4)); }
  for (const yy of [by + 0.9, rt - 0.9, rt]) {
    const r = yy === rt ? 0.2 : 0.1;
    F.rod([rx0, yy, rz], [rx1, yy, rz], r, iron, 2); F.rod([rx0, yy, rz], [rx0, yy, 0.1], r, iron, 2); F.rod([rx1, yy, rz], [rx1, yy, 0.1], r, iron, 2);
  }
  // the cane chair, turned a little toward the patio
  {
    const cane = new THREE.Color('#C7A45C'), rush = new THREE.Color('#B9995A');
    const cxh = bx - bw * 0.26, czh = 2.4, ry = 0.35;
    const pb = (w2, h2, d2, x2, y2, z2, col, mat) => { const g = new THREE.BoxGeometry(w2, h2, d2); g.translate(x2, y2, z2); g.rotateY(ry); g.translate(cxh, by + 0.25, czh); F.add(g, col, mat); };
    pb(4.3, 0.35, 4.0, 0, 4.5, 0, rush, 4);
    for (const sx of [-1, 1]) { pb(0.36, 4.5, 0.36, sx * 1.95, 2.25, 1.8, cane, 4); pb(0.36, 9.4, 0.36, sx * 1.95, 4.7, -1.8, cane, 4); pb(0.24, 0.24, 3.6, sx * 1.95, 1.6, 0, cane, 4); }
    pb(3.9, 0.24, 0.24, 0, 1.9, 1.8, cane, 4);
    for (const yy of [6.2, 7.5, 8.9]) pb(3.9, 0.7, 0.2, 0, yy, -1.8, cane, 4);
  }
}

function buildProps(F, layout, pal, rng, tool) {
  const iron = new THREE.Color(0.04, 0.045, 0.055), wood = new THREE.Color('#8A6A44'), cane = new THREE.Color('#C9A65E');
  // plates: a shallow dish with a foot ring; the pattern is painted in the shader from uv
  for (const pl of layout.plates) {
    const g = new THREE.CylinderGeometry(pl.r, pl.r * 0.55, 0.3, 16, 1, false);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / pl.r, p.getZ(i) / pl.r);
    F.add(g, [pl.seed, 0.8, 0.8], 5, { rot: [Math.PI / 2, 0, pl.seed * 6], at: [pl.x, pl.y, 0.2] });
    F.rod([pl.x, pl.y + pl.r * 0.95, 0.08], [pl.x, pl.y + pl.r * 1.25, 0.08], 0.07, iron, 2);
  }
  // ladder: two rails and rungs, leaning from the pebbles to the lime
  {
    const lx = layout.ladder.x, top = layout.ladder.top, fz = 6.6, tz = 0.45, hw = 1.9;
    for (const sx of [-1, 1]) F.rod([lx + sx * hw, 0, fz], [lx + sx * hw * 0.92, top, tz], 0.3, wood, 4, { r1: 0.26, shade: (x, y) => 0.75 + 0.25 * smoothstep(0, 6, y) });
    for (let i = 1; i <= 9; i++) { const t = i / 10, y = top * t, z = lerp(fz, tz, t), w = hw * lerp(1, 0.92, t); F.rod([lx - w, y, z], [lx + w, y, z], 0.17, wood.clone().multiplyScalar(0.9), 4, { segs: 5 }); }
  }
  // the watering tool at the south end
  const cx = layout.cane.x;
  if (tool === 'cane') {
    // 28 m of cane in three slightly bent lengths with node rings, a tin can lashed to the tip; it swings about its foot
    const foot = [cx, 0, 7.6], tip = [cx + 1.6, 27.2, 0.9], sw = { sw: [2, 0.012, 0.37], pivot: foot };
    const P = (t, bend) => [lerp(foot[0], tip[0], t) + bend, lerp(foot[1], tip[1], t), lerp(foot[2], tip[2], t) + bend * 0.5];
    const pts = [P(0, 0), P(0.34, 0.25), P(0.67, 0.3), P(1, 0)];
    for (let i = 0; i < 3; i++) F.rod(pts[i], pts[i + 1], 0.2 - i * 0.03, cane, 4, { segs: 6, r1: 0.17 - i * 0.03, ...sw });
    for (let i = 1; i <= 9; i++) { const q = P(i / 10, 0.3 * Math.sin(i / 10 * Math.PI)); F.cyl(0.24, 0.24, 0.14, 6, q, cane.clone().multiplyScalar(0.7), 4, { rot: [-0.24, 0, -0.06], ...sw }); }
    const tin = new THREE.Color(0.42, 0.44, 0.46), cy = tip[1] - 1.2;
    const sw2 = { sw: [2, 0.012, 0.37], pivot: foot };
    F.cyl(0.62, 0.72, 1.7, 10, [tip[0] + 0.75, cy, tip[2] + 0.2], tin, 1, { open: true, ...sw2 });
    F.cyl(0.62, 0.62, 0.08, 10, [tip[0] + 0.75, cy - 0.8, tip[2] + 0.2], tin.clone().multiplyScalar(0.7), 1, sw2);
    for (const dy of [-0.5, 0.2]) F.cyl(0.78, 0.78, 0.16, 8, [tip[0] + 0.4, cy + dy, tip[2] + 0.2], new THREE.Color('#8C7448'), 4, { open: true, ...sw2 });   // lashing
  } else {
    // a long-spouted can left standing on the pebbles
    const tin = new THREE.Color(0.40, 0.43, 0.46), bx = cx + 1.5, bz = 4.2;
    F.cyl(2.0, 1.7, 5.0, 12, [bx, 2.5, bz], tin, 1, { shade: (x, y) => 0.7 + 0.3 * smoothstep(0, 2.5, y) });
    F.cyl(1.72, 1.72, 0.2, 12, [bx, 5.05, bz], tin.clone().multiplyScalar(0.6), 1);
    F.rod([bx + 1.4, 1.2, bz], [bx + 7.2, 6.4, bz + 0.6], 0.45, tin, 1, { segs: 7, r1: 0.2 });
    F.cyl(0.25, 0.75, 0.9, 8, [bx + 7.5, 6.7, bz + 0.63], tin, 1, { rot: [0, 0, -0.84] });
    F.rod([bx + 1.2, 3.6, bz], [bx + 3.6, 4.2, bz + 0.25], 0.12, tin, 1);
    const hg = new THREE.TorusGeometry(1.7, 0.16, 5, 10, Math.PI); F.add(hg, tin, 1, { rot: [0, 0, 0], at: [bx, 5.0, bz] });
    const hg2 = new THREE.TorusGeometry(1.5, 0.16, 5, 8, Math.PI); F.add(hg2, tin, 1, { rot: [0, 0, Math.PI / 2], at: [bx - 1.7, 2.8, bz] });
  }
  // the cage's bracket: a bar out from the lime, a scroll under it and a hook
  const c = layout.cage, by = c.y + 4.6;
  F.box(0.9, 1.6, 0.12, [c.x, by - 0.2, 0.08], iron, 2);
  F.rod([c.x, by, 0.1], [c.x, by, c.z + 0.7], 0.13, iron, 2);
  F.rod([c.x, by - 1.9, 0.1], [c.x, by - 0.15, c.z - 0.9], 0.1, iron, 2);
  const sg = new THREE.TorusGeometry(0.42, 0.07, 4, 10, Math.PI * 1.6); F.add(sg, iron, 2, { rot: [0, Math.PI / 2, 0.4], at: [c.x, by - 0.5, c.z + 0.4] });
  F.rod([c.x, by, c.z], [c.x, by - 0.95, c.z], 0.07, iron, 2);
  // the lantern's bracket: the world hangs the lantern from its tip
  const l = layout.lamp, ly = l.y + 6.6;
  F.box(1.0, 2.2, 0.14, [l.x, ly - 0.5, 0.09], iron, 2);
  F.rod([l.x, ly, 0.1], [l.x, ly, l.z + 0.5], 0.15, iron, 2);
  F.rod([l.x, ly - 2.6, 0.1], [l.x, ly - 0.2, l.z - 0.8], 0.11, iron, 2);
  F.add(new THREE.TorusGeometry(0.55, 0.08, 4, 10, Math.PI * 1.6), iron, 2, { rot: [0, Math.PI / 2, 0.4], at: [l.x, ly - 0.7, l.z * 0.5] });
}

// the bell cage (its own mesh so it can turn on its hook); origin at the hook, hanging down 5 m
function cageGeometry() {
  const F = fitBuilder(), iron = new THREE.Color(0.05, 0.055, 0.065), brass = new THREE.Color(0.55, 0.40, 0.14);
  const R = 1.7, H = 5.0, ribs = 14;
  const prof2 = (t) => { const k = t < 0.42 ? Math.sin((t / 0.42) * Math.PI / 2) : 1; return [R * k, -0.55 - (H - 1.0) * t]; };
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), N = 7, pos = [], nor = [], idx = [], uv = [];
    const w = 0.065;
    for (let k = 0; k <= N; k++) {
      const [r, y] = prof2(k / N);
      pos.push(ca * r - sa * w, y, sa * r + ca * w, ca * r + sa * w, y, sa * r - ca * w); nor.push(ca, 0.2, sa, ca, 0.2, sa); uv.push(0, k / N, 1, k / N);
      if (k < N) { const b = k * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    F.add(g, iron, 2);
  }
  for (const [t, hh] of [[0.42, 0.16], [0.7, 0.12], [1, 0.22]]) { const [r, y] = prof2(t); F.cyl(r + 0.02, r + 0.02, hh, 16, [0, y, 0], iron, 2, { open: true }); }
  F.cyl(R * 0.98, R * 0.98, 0.14, 16, [0, -H + 0.38, 0], new THREE.Color(0.30, 0.25, 0.16), 4);      // floor tray
  F.cyl(R + 0.12, R * 0.9, 0.3, 16, [0, -H + 0.2, 0], iron, 2);
  F.cyl(0.16, 0.05, 0.6, 6, [0, -0.3, 0], brass, 1); F.add(new THREE.TorusGeometry(0.24, 0.05, 4, 10), brass, 1, { at: [0, 0.05, 0] });
  F.rod([-R * 0.92, -2.6, 0.25], [R * 0.92, -2.6, 0.25], 0.07, new THREE.Color('#9A7A4A'), 4, { segs: 5 });   // perches
  F.rod([0.2, -3.7, -R * 0.9], [0.2, -3.7, R * 0.9], 0.07, new THREE.Color('#9A7A4A'), 4, { segs: 5 });
  F.cyl(0.3, 0.36, 0.4, 8, [R * 0.78, -3.4, -0.7], new THREE.Color(0.75, 0.76, 0.72), 1);              // seed cup
  return F.build();
}

// a canary or goldfinch, 1.3 m long, beak toward +x, feet at the origin
function birdGeometry(kind) {
  const F = fitBuilder();
  const gold = kind === 'goldfinch';
  const body = new THREE.Color(gold ? '#C6A070' : '#F0B018'), wing = new THREE.Color(gold ? '#17171A' : '#D99A10'), bar = new THREE.Color('#F2C21E');
  const face = new THREE.Color(gold ? '#C4241A' : '#F4BC24'), beak = new THREE.Color('#E8C9A0'), dark = new THREE.Color(0.02, 0.02, 0.02);
  const sph = (r, sx, sy, sz, at, col, o = {}) => { const g = new THREE.SphereGeometry(r, o.ws || 8, o.hs || 6); g.scale(sx, sy, sz); return F.add(g, col, 6, { ...o, at }); };
  sph(0.34, 1.45, 1.0, 0.95, [-0.02, 0.47, 0], body, { rot: [0, 0, 0.32], shade: (x, y) => 0.8 + 0.2 * smoothstep(-0.3, 0.2, y) });
  sph(0.215, 1.05, 1.0, 0.95, [0.4, 0.78, 0], face, { ws: 7, hs: 5 });
  if (gold) sph(0.2, 0.7, 0.6, 1.0, [0.3, 0.9, 0], dark, { ws: 6, hs: 4 });
  F.cyl(0.075, 0.0, 0.24, 5, [0.68, 0.76, 0], beak, 6, { rot: [0, 0, -Math.PI / 2] });
  for (const sz of [-1, 1]) {
    F.box(0.05, 0.05, 0.03, [0.5, 0.83, sz * 0.185], dark, 2);
    sph(0.3, 1.35, 0.72, 0.22, [-0.14, 0.52, sz * 0.3], wing, { rot: [0, sz * 0.1, 0.42], ws: 7, hs: 4 });
    F.box(0.3, 0.07, 0.03, [-0.2, 0.5, sz * 0.375], bar, 6, { rot: [0, 0, 0.42] });
    F.rod([0.02, 0.24, sz * 0.1], [0.06, 0.0, sz * 0.12], 0.025, beak, 6, { segs: 4 });
    F.box(0.2, 0.035, 0.09, [0.1, 0.0, sz * 0.12], beak, 6);
  }
  F.box(0.62, 0.05, 0.22, [-0.66, 0.3, 0], wing, 6, { rot: [0, 0, 0.36] });
  F.box(0.2, 0.04, 0.26, [-0.92, 0.2, 0], gold ? dark : bar, 6, { rot: [0, 0, 0.36] });
  return F.build();
}

// the gecko, 1.6 m long, flat on the plane z = 0 with its head toward +x; the tail curls in the shader
function geckoGeometry() {
  const F = fitBuilder();
  const skin = new THREE.Color(0.34, 0.35, 0.27), pale = new THREE.Color(0.42, 0.42, 0.34), dark = new THREE.Color(0.03, 0.03, 0.02);
  const sph = (r, sx, sy, sz, at, col, o = {}) => { const g = new THREE.SphereGeometry(r, o.ws || 8, o.hs || 5); g.scale(sx, sy, sz); return F.add(g, col, 8, { ...o, at }); };
  sph(0.2, 2.1, 0.72, 0.5, [0, 0, 0.09], skin);
  sph(0.15, 1.25, 0.95, 0.55, [0.5, 0, 0.1], pale, { ws: 7 });
  sph(0.1, 1.3, 0.75, 0.6, [0.66, 0, 0.09], pale, { ws: 6, hs: 4 });
  for (const sy of [-1, 1]) {
    F.box(0.06, 0.06, 0.05, [0.56, sy * 0.115, 0.16], dark, 2);
    for (const [bx, dir] of [[0.27, 1], [-0.3, -1]]) {
      const k = [bx + dir * 0.06, sy * 0.3, 0.1], f = [bx + dir * 0.25, sy * 0.44, 0.03];
      F.rod([bx, sy * 0.1, 0.09], k, 0.05, skin, 8, { segs: 5, r1: 0.04 });
      F.rod(k, f, 0.04, skin, 8, { segs: 5, r1: 0.03 });
      for (let t = -2; t <= 2; t++) { const a = Math.atan2(sy * 0.14, dir * 0.19) + t * 0.42; F.rod(f, [f[0] + Math.cos(a) * 0.12, f[1] + Math.sin(a) * 0.12, 0.02], 0.022, pale, 8, { segs: 3, r1: 0.03 }); }
    }
  }
  const pivot = [-0.38, 0, 0.07];
  for (let i = 0; i < 7; i++) {
    const x0 = -0.36 - i * 0.115, r0 = 0.1 * (1 - i / 7.6), r1 = 0.1 * (1 - (i + 1) / 7.6);
    F.rod([x0, 0, 0.07], [x0 - 0.125, 0, 0.065], r0, i % 2 ? skin : pale, 8, { segs: 6, r1, sw: [2, 0.09 + i * 0.14, 0.2], pivot });
  }
  return F.build();
}

// ---------------------------------------------------------------------------------------------
// ASSEMBLY
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('patio-of-pots-hero');
  const detail = ctx.quality?.detail ?? 1;
  const look = LOOKS[opts.look] ? opts.look : 'may';
  const L = LOOKS[look];
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const pal = { lime: P[0], shade: P[1], cobalt: P[2], scarlet: P[3], leaf: P[4], terra: P[5], sky: P[6] };
  const birds = opts.birds || (rng.chance(0.5) ? 'canary' : 'goldfinch');
  const tool = opts.tool || (rng.chance(0.6) ? 'cane' : 'can');

  const baseAlt = monotone(A_KEYS);
  const aRange = Array.isArray(opts.altitude) ? opts.altitude : [L.a0, L.a1];
  // a look may start lower (first light) or end elsewhere; every look shares the table through the reveal and the pass
  const altitude = (u) => baseAlt(u) + (aRange[0] - 30) * (1 - smoothstep(0, 0.44, u)) + (aRange[1] - 53) * smoothstep(0.66, 1, u);
  const edgeOf = (u) => WALL_H - PATIO_D * Math.tan(altitude(u) * Math.PI / 180);

  const layout = layoutWall(rng, look);
  const sunLo = new THREE.Color(L.sunLo), sunHi = new THREE.Color(L.sunHi);
  const skyBase = look === 'moon' ? new THREE.Color(0.30, 0.38, 1.0) : new THREE.Color(pal.shade.r / 0.92, pal.shade.g / 0.84, pal.shade.b / 0.66);
  const U = {
    uHeroInv: { value: new THREE.Matrix4() },
    uSunDir: { value: new THREE.Vector3(0, 0.5, 0.85) }, uSunCol: { value: new THREE.Color(1, 1, 1) },
    uSkyCol: { value: skyBase.clone().multiplyScalar(L.skyI) }, uBounce: { value: new THREE.Color(0, 0, 0) },
    uSunTan: { value: 0.3 }, uSunSide: { value: SUN_SIDE }, uEaveH: { value: WALL_H }, uPatioD: { value: PATIO_D },
    uChimX: { value: layout.chimX }, uChimH: { value: layout.chimH }, uTime: { value: 0 }, uEdgeY: { value: 100 },
    uWet: { value: L.wet }, uGlow: { value: L.glow },
    uHLamp: { value: new THREE.Vector4(layout.lamp.x, layout.lamp.y, layout.lamp.z, 0) }, uHLampCol: { value: new THREE.Color(1.0, 0.56, 0.2) },
  };
  const object = new THREE.Group(); object.name = 'patio-of-pots-hero';
  await ctx.yield();

  object.add(makeWall(U, layout, pal));
  await ctx.yield();
  const nearPots = layout.pots.filter((p) => p.near), farPots = layout.pots.filter((p) => !p.near);
  object.add(makePots(U, nearPots, pal, look, true));
  await ctx.yield();
  object.add(makePots(U, farPots, pal, look, false));
  await ctx.yield();
  const prng = rng.fork('plants');
  object.add(makePlants(U, nearPots.filter((p) => p.kind !== 5), pal, plantGeometry(prng, true), 'plants-near'));
  await ctx.yield();
  object.add(makePlants(U, farPots.filter((p) => p.kind !== 5 && !p.cascade), pal, plantGeometry(prng, false), 'plants-far'));
  await ctx.yield();
  const cascades = farPots.filter((p) => p.cascade);
  if (cascades.length) object.add(makePlants(U, cascades, pal, cascadeGeometry(rng.fork('cascade')), 'cascades'));
  await ctx.yield();
  object.add(makeDrops(U, layout, rng.fork('drops'), detail));
  await ctx.yield();

  const fitMat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...U, uCobalt: { value: pal.cobalt } },
    vertexShader: FIT_VERT, fragmentShader: FIT_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const F = fitBuilder(), frng = rng.fork('fittings');
  buildArchitecture(F, layout, pal, frng);
  await ctx.yield();
  buildProps(F, layout, pal, frng, tool);
  const fit = new THREE.Mesh(F.build(), fitMat); fit.name = 'fittings'; fit.frustumCulled = false;
  object.add(fit);
  await ctx.yield();

  // the cage on its hook, two birds inside it, the gecko on the lime
  const cage = new THREE.Mesh(cageGeometry(), fitMat); cage.name = 'cage';
  cage.position.set(layout.cage.x, layout.cage.y + 3.6, layout.cage.z);
  object.add(cage);
  const birdGeo = birdGeometry(birds);
  const birdMeshes = [0, 1].map((i) => { const m = new THREE.Mesh(birdGeo, fitMat); m.name = 'bird' + i; cage.add(m); return m; });
  const spots = [[[-0.75, -2.6, 0.25], [0.2, -3.7, 0.7], [0.85, -2.6, 0.25]], [[0.2, -3.7, -0.75], [0.6, -2.6, 0.25], [-0.5, -4.5, -0.3]]];
  const birdPh = [rng(), rng()];
  const gecko = new THREE.Mesh(geckoGeometry(), fitMat); gecko.name = 'gecko';
  const gE = clamp(edgeOf(0.63), 12, 120);
  const gA = new THREE.Vector3(-19.4, gE - 1.3, 0.02), gB = new THREE.Vector3(-21.6, gE + 2.1, 0.02);
  const gAng = Math.atan2(gB.y - gA.y, gB.x - gA.x);
  gecko.position.copy(gA); gecko.rotation.z = gAng;
  object.add(gecko);
  await ctx.yield();

  // ---- the sun's clock ----
  const sun = { altitude: 14, edgeY: 115, dir: U.uSunDir.value, color: U.uSunCol.value, sky: U.uSkyCol.value, bounce: U.uBounce.value };
  let progress = -1, cloud = 1, driven = false;
  const warm = new THREE.Color(1.0, 0.92, 0.80), tmpC = new THREE.Color();
  function applySun(u) {
    const aDeg = altitude(u), a = aDeg * Math.PI / 180, c = Math.cos(a);
    U.uSunDir.value.set(-0.174 * c, Math.sin(a), 0.985 * c).normalize();
    U.uSunTan.value = Math.tan(a);
    const E = WALL_H - PATIO_D * Math.tan(a);
    U.uEdgeY.value = E;
    tmpC.copy(sunLo).lerp(sunHi, smoothstep(6, 30, aDeg) * (L.whiten ?? 1));
    U.uSunCol.value.copy(tmpC).multiplyScalar(L.sunI * cloud * smoothstep(0.5, 6, aDeg));
    const lit = clamp((WALL_H - E) / WALL_H, 0, 1);
    U.uBounce.value.copy(warm).multiply(tmpC).multiplyScalar(0.085 * lit * L.sunI * cloud);
    sun.altitude = aDeg; sun.edgeY = E;
  }
  function setProgress(u) { driven = true; progress = clamp(u, 0, 1); applySun(progress); }
  function setCloud(k) { cloud = clamp(k, 0, 1); if (progress >= 0) applySun(progress); }
  const demo = opts.demo !== false;
  applySun(0.5); progress = 0.5;

  const inv = new THREE.Matrix4();
  function update(dt, time) {
    object.updateWorldMatrix(true, false);
    U.uHeroInv.value.copy(inv.copy(object.matrixWorld).invert());
    U.uTime.value = time;
    if (!driven) {
      const u = demo ? 0.42 + 0.26 * ((time / 24) % 1) : 0.5;
      progress = u; applySun(u);
    }
    // cage turns on its hook and swings a little
    cage.rotation.y = 0.9 * Math.sin(time * 0.31) + 0.25 * Math.sin(time * 0.83 + 1);
    cage.rotation.z = 0.035 * Math.sin(time * 1.3); cage.rotation.x = 0.03 * Math.sin(time * 1.1 + 2);
    // birds hop perch to perch: a pure function of time
    for (let i = 0; i < 2; i++) {
      const per = 2.3 + i * 0.9, ph = time / per + birdPh[i], k = Math.floor(ph), f = ph - k, s = spots[i];
      const a = s[((k % 3) + 3) % 3], b = s[(((k + 1) % 3) + 3) % 3], t = smoothstep(0.82, 1, f), m = birdMeshes[i];
      m.position.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * 0.55 + 0.03 * Math.abs(Math.sin(time * 9 + i)), lerp(a[2], b[2], t));
      const face = Math.sin(k * 12.9898 + i * 4.1) * 43758.5453, turn = (face - Math.floor(face)) * 6.283;
      const look2 = Math.floor(f * 4) * 0.5;                                    // quick head-and-body turns between hops
      m.rotation.set(0, turn + look2 + t * 1.2, 0.12 * Math.sin(time * 5 + i * 2) - 0.25 * Math.sin(t * Math.PI));
    }
    // gecko: stop and go from the shade into the sun between u 0.615 and 0.66
    const g = clamp((progress - 0.615) / 0.045, 0, 1);
    const go = (smoothstep(0.0, 0.22, g) + smoothstep(0.38, 0.6, g) + smoothstep(0.78, 1.0, g)) / 3;
    const moving = Math.sin(clamp(g, 0, 1) * Math.PI * 3) ** 2 * (g > 0 && g < 1 ? 1 : 0);
    gecko.position.lerpVectors(gA, gB, go);
    gecko.rotation.z = gAng + 0.2 * Math.sin(time * 17) * moving + 0.05 * Math.sin(time * 0.7);
  }
  update(0, 0);

  // ---- anchors (hero-local) ----
  const V = (x, y, z) => new THREE.Vector3(x, y, z), edgeTmp = V(0, 0, 0);
  const flyThrough = [V(30, 14, 90), V(27, 20, 58), V(11, 26, 29), V(-13, 32, 14), V(-38, 42, 14), V(-52, 50, 30), V(-50, 55, 50), V(-36, 58, 64), V(-15.5, 63, 67.5), V(4, 73, 64), V(19.5, 86, 53), V(34.7, 117, 37.8), V(49.9, 147.5, 22.6)];
  const anchors = {
    flyThrough,
    closePass: [V(-13, 32, 14), V(-38, 42, 14)],
    cage: cage.position.clone().add(V(0, -2.6, 0)),
    gecko: gA.clone(),
    lamp: V(layout.lamp.x, layout.lamp.y, layout.lamp.z), lampHook: V(layout.lamp.x, layout.lamp.y + 6.6, layout.lamp.z),
    edgeAt: (u, x = 0, out = edgeTmp) => out.set(x, clamp(edgeOf(u), 0, WALL_H), 0),     // writes into out (or one shared vector)
    portalSeat: { position: V(49.9, 147.5, 22.6), facing: V(-15.2, -30.5, 15.2).normalize() },
    viewpoints: { reveal: V(30, 15, 86), turn: V(11, 26, 29), close: V(-24, 36, 14), exit: V(19.5, 86, 53) },
    toWorld: (v) => v.clone().applyMatrix4(object.matrixWorld),
  };
  return {
    object, radius: 76, height: 152, center: V(0, 70, 0), anchors,
    parts: { cageGeometry: cage.geometry, birdGeometry: birdGeo, material: fitMat, birdSpots: spots },
    update, dispose() {}, ground: true, groundY: 0,
    setProgress, setCloud, altitude, sun, uniforms: U, glsl: GLSL_COMMON,
    info: { look, birds, tool, pots: layout.pots.length, near: nearPots.length, chains: layout.chains.length },
  };
}
