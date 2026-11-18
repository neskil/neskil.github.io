// OLD LIGHT ARRIVING, shared: the layout in metres, the height of the land, the lights every shader shares.
// Frame: flight heads -Z, +X to the right, water at y 0. Everything here is the UNMIRRORED layout; the mirrored world turns the
// whole world group left for right, so nothing in this file knows about it.
import * as THREE from 'three';
import { clamp, smoothstep } from '../kit/core.js';

export const DEG = Math.PI / 180;
// the new star: 14 degrees right of the entry heading, 12 degrees up. The bowl is set to face it and the last heading flies at it.
export const STAR_AZ = 14, STAR_EL = 12;
export const skyDir = (el, az, out = new THREE.Vector3()) => out.set(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
export const STAR_DIR = skyDir(STAR_EL, STAR_AZ);
export const TAN_EL = Math.tan(STAR_EL * DEG);
export const TOWN_SOFT = 14;      // metres over the town's crest in which the star's light comes in: the height of the crowns that stand along it, through whose tops it comes by degrees (the shade law, below)

// ---- places
export const QUAY_Z = -280;                 // the quay line: the outer bank of the bend, at the bluff's foot
export const CREST_Z = -430;                // the bluff's crest line
export const NORTH_Z = -470;                // where the bluff's north face meets the basin
// THE RIDGE (the bluff's crest, west to east): a long uneven ridge of four swells of unlike height and breadth with low places between
// them, none a matched pair. [x of the head, metres over the ridge's own level, half breadth]: a low swell in the far west; west of the
// road's crossing a broad low swell; east of it the HIGH HEAD, narrow, steep and wooded, 27 m higher and little more than half as
// broad; a last low one in the east. THE HIGH HEAD STANDS ON THE STAR'S SIDE: the new star is 12 degrees up on a bearing 14 degrees
// east of the road's, so from the river it stands behind this head and the river road lies in the head's own shade from it.
export const RIDGE = [[-260, 10, 70], [-165, 17, 80], [100, 44, 50], [330, 10, 60]], RIDGE_Y = 68;
// THE BENCH: where the road crosses, the high head's west foot is a level shelf of lawn (BENCH.y high, from BENCH.x0 to BENCH.x1 along
// the ridge, BENCH.d deep from the crest line south); a grove and two long low halls stand on it. East of it the head rises at once
// (over BENCH.out metres, steepest at its foot); west of it the ridge falls (over BENCH.in metres) to THE LOW PLACE: an open dip
// (LOW: its middle, its depth under the ridge's level, its half breadth) that carries no wood and no roof.
export const BENCH = { x0: -46, x1: 60, y: 66, d: 16, in: 22, out: 44 }, LOW = [-86, 13, 30];
export const benchK = (x) => { const t = clamp((x - BENCH.x1) / BENCH.out, 0, 1); return smoothstep(BENCH.x0 - BENCH.in, BENCH.x0, x) * (1 - t * (2 - t)); };
export const SADDLE = [40, BENCH.y, -430], KNOLL_L = [RIDGE[1][0], RIDGE_Y + RIDGE[1][1], -440], KNOLL_R = [RIDGE[2][0], RIDGE_Y + RIDGE[2][1], -435];      // (where the road crosses; the two heads beside the crossing)
export const LANE = 120;                    // half the width of the lower river
// the river below and above the lower river, where the fleet under way comes from and goes to. Down-river the river comes round a bend
// out of an arm that lies east behind the right bank (its corner at z = ZB); up-river the reach runs on west as a cut to the corner at
// x = -XK, where the boats turn south into the mooring pool behind the left bank's upland (its head at z = ZE).
export const RIVER = { ZB: 300, ARMW: 240, ARM: 160, XK: 480, POOLW: 130, CUTN: -175, ZE: 110 };
export const BOWL = { c: [132, -796], foot: 190, rim: 140, yRim: 36, walk: 128, yWalk: 34.15, top: 128, low: 40, yLow: 7.7, rise: 1.15, tread: 4, tiers: 22,
  pool: 34, yPool: 7.3, yStage: 8.5, notch: 30, arch: 139.5 };      // (arch: where the arch stands along the axis: the one source of that number)
// The notch's sides are the open stage side of a theatre: beside the 60 m stage the tiers and the rim are cut down in STEPS, six level
// terraces each 6 m wide and 3.4 m above the last, so that from the stage the walls stand no higher than a storey and the bowl opens to
// either hand. STEPS.top(l): the highest the hill may stand at lateral distance l from the axis, on the star's side of the middle.
export const STEPS = { n: 6, w: 6, rise: 3.4, y0: 11.9,
  top: (l) => { const a = Math.abs(l); if (a < BOWL.notch) return BOWL.yStage; const j = Math.floor((a - BOWL.notch) / 6); return j >= 6 ? 1e9 : 11.9 + 3.4 * j; },
  // the least lateral distance at which ground of height y may stand
  lmin: (y) => (y <= 11.9 + 1e-6 ? BOWL.notch : BOWL.notch + 6 * Math.min(6, Math.ceil((y - 11.9) / 3.4 - 1e-6))) };
// THE DECLARED CLEARANCES that more than one part reads (each kind of thing has ONE; the others stand in the country part beside the
// things they hold off). PEOPLE_KEEP: from the road's line to any person's own place: no one is passed so near that a figure in
// outline would have to be a face. SHRUB_KEEP: for a shrub or small tree of the bowl's outer slope, plus its own size, asked at its
// top (seven in ten of them are shrubs 0.9 to 2 m tall; three in ten are small trees 5.7 to 10.4 m tall, lower than the country's
// trees of 9 to 14 m, whose own clearance is TREE_KEEP).
export const PEOPLE_KEEP = 28.5, SHRUB_KEEP = 8;
export const AXIS = [Math.sin(STAR_AZ * DEG), -Math.cos(STAR_AZ * DEG)];      // on the map, from the bowl's centre toward the star
// THE SHADE'S FAR EDGE (the shade law, below: its script form townLit and its shader form olaTownLit are the same, number for
// number). From the crest to the quay line the town stands among the crest's own crowns and the law is the plain one. Over the water
// beyond, the farther a place lies from the crest the wider its soft part: by SHADE.g metres of height for every metre the star's
// ray has run past the quay line (t0); and the crest's outline is taken with its woods (crestWood, olaCrestWood), by degrees over
// the first SHADE.ramp metres past that line.
export const SHADE = { t0: (QUAY_Z - CREST_Z) / -AXIS[1], g: 0.2, ramp: 150 };
// a point of the bowl's own frame (lateral l to the right of the axis seen from the near side, a along the axis toward the star) on the map
export const bowlXZ = (l, a) => [BOWL.c[0] + AXIS[0] * a - AXIS[1] * l, BOWL.c[1] + AXIS[1] * a + AXIS[0] * l];
export const bowlLA = (x, z) => { const dx = x - BOWL.c[0], dz = z - BOWL.c[1]; return [-AXIS[1] * dx + AXIS[0] * dz, AXIS[0] * dx + AXIS[1] * dz]; };

// ---- water and land
const segD = (x, z, ax, az, bx, bz) => { const ux = bx - ax, uz = bz - az, t = clamp(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz), 0, 1); return Math.hypot(x - ax - ux * t, z - az - uz * t); };
const TURN = [[-330, -160], [-440, -200], [-500, -300], [-500, -480]];      // the river's middle line as it goes round the bluff's west tip
export const southShore = (x) => NORTH_Z - 5 * Math.sin(x * 0.011 + 0.4);      // the basin's near shore
export const northShore = (x) => -1000 + 26 * Math.sin(x * 0.0031 + 0.7) + 12 * Math.sin(x * 0.0083 + 2.1);      // the basin's far bank
// metres to the shore of the SOUTH country's waters: negative on the water, positive on land
export function waterD(x, z) {
  const V = RIVER;
  const lane = Math.max(Math.abs(x) - LANE, QUAY_Z - z, z - (V.ZB + V.ARMW));              // the lower river, down to the bend below the entry
  const arm = Math.max(V.ZB - z, z - (V.ZB + V.ARMW), -LANE - x);                          // the arm it comes out of, lying east
  const cut = Math.max(z + 40, V.CUTN - z, x + 330, -(V.XK + V.POOLW) - x);                // the reach running on west
  const pool = Math.max(x + V.XK, -(V.XK + V.POOLW) - x, V.CUTN - z, z - (V.ZE + 40));     // the mooring pool at its end
  const reach = Math.max(x - LANE, z + 40, QUAY_Z - z, -330 - x);                        // the reach under the bluff, running west
  let turn = 1e9; for (let i = 0; i < TURN.length - 1; i++) turn = Math.min(turn, segD(x, z, TURN[i][0], TURN[i][1], TURN[i + 1][0], TURN[i + 1][1]));
  return Math.min(lane, arm, cut, pool, reach, turn - LANE, z - southShore(x));      // (plain minima: the quay and the banks stand exactly on their lines, and the terraces turn square corners)
}
export function crestH(x) {
  const env = smoothstep(-300, -190, x) * (1 - 0.42 * smoothstep(380, 540, x));
  let c = RIDGE_Y * env - LOW[1] * Math.exp(-(((x - LOW[0]) / LOW[2]) ** 2)); for (const [x0, h, w] of RIDGE) c += h * Math.exp(-(((x - x0) / w) ** 2));
  return c + (BENCH.y - c) * benchK(x);
}
// THE CREST'S WOODS in its outline as the far water finds it (crestWood, and olaCrestWood for a shader: the shade law's stand-in for
// the dealt crowns): metres over or under the even fringe of crowns the law counts everywhere (whose middle stands TOWN_SOFT / 2 =
// 7 m over the crest's ground). Two long unlike swells along the whole ridge, 4.5 and 3 m, which together run from 7.5 m under the
// even fringe to 7.5 m over it; and at the low place the fringe's own middle, those 7 m, is taken off (between WOOD_GAP[0] =
// LOW[0] - 0.72 LOW[2] and WOOD_GAP[1], 10 m short of the bench; by degrees over 6 m outside either end). WHAT THE OUTLINE IS INSIDE
// THE GAP: the bare ground with the two swells alone, which are not taken off there. So it is NOT bare ground all through the gap:
// it runs from 3.0 m under the bare ground at the gap's west end (x -107.6) to 7.4 m over it at x -86.7, where both swells crest
// together (the low place's own middle is x -86: there the swells give the 7 m back), down to 1.5 m under the bare ground at x -65
// and level with it at the gap's east end. A rule of the place, not the dealt crowns one by one.
export const WOOD_GAP = [LOW[0] - LOW[2] * 0.72, BENCH.x0 - 10];
export const crestWood = (x) => 4.5 * Math.sin(x * 0.071 + 1.3) + 3 * Math.sin(x * 0.173 + 4.1) - TOWN_SOFT * 0.5 * smoothstep(WOOD_GAP[0] - 6, WOOD_GAP[0], x) * (1 - smoothstep(WOOD_GAP[1], WOOD_GAP[1] + 6, x));
// the crest's heights for a shader, written from the same numbers: olaCrest(x); and its woods: olaCrestWood(x)
export const CREST_GLSL = /* glsl */`
float olaCrestWood(float x){ return 4.5*sin(x*.071 + 1.3) + 3.*sin(x*.173 + 4.1) - ${TOWN_SOFT * 0.5}.*smoothstep(${(WOOD_GAP[0] - 6).toFixed(1)}, ${WOOD_GAP[0].toFixed(1)}, x)*(1. - smoothstep(${WOOD_GAP[1].toFixed(1)}, ${(WOOD_GAP[1] + 6).toFixed(1)}, x)); }
float olaCrestG(float d){ return exp(-min(d*d, 40.)); }
float olaCrest(float x){ float c = ${RIDGE_Y}. * smoothstep(-300., -190., x) * (1. - .42*smoothstep(380., 540., x)) - ${LOW[1]}. * olaCrestG((x - (${LOW[0]}.))/${LOW[2]}.);
${RIDGE.map(([x0, h, w]) => `  c += ${h}. * olaCrestG((x - (${x0}.))/${w}.);`).join('\n')}
  float t = clamp((x - (${BENCH.x1}.))/${BENCH.out}., 0., 1.);
  return mix(c, ${BENCH.y}., smoothstep(${BENCH.x0 - BENCH.in}., ${BENCH.x0}., x) * (1. - t*(2. - t))); }`;
export const TOWN_LIT_GLSL = CREST_GLSL + /* glsl */`
float olaTownLit(vec3 p){ float d = p.z - (${CREST_Z}.); if (d <= 0.) return 1.; float t = d / ${(-AXIS[1]).toFixed(5)};
  float far = max(t - ${SHADE.t0.toFixed(3)}, 0.), hs = ${TOWN_SOFT * 0.5}. + ${(SHADE.g * 0.5).toFixed(4)}*far, xc = p.x + ${AXIS[0].toFixed(5)}*t;
  return smoothstep(${TOWN_SOFT * 0.5}. - hs, ${TOWN_SOFT * 0.5}. + hs, p.y + t*${TAN_EL.toFixed(5)} - olaCrest(xc) - min(far/${SHADE.ramp}., 1.)*olaCrestWood(xc)); }`;
const terr = (g) => {      // garden terraces: four of 6 m from the quay's level, then 9 m steps
  const b = g - 1.6; if (b <= 0) return g;
  if (b < 24) { const k = Math.floor(b / 6), f = b / 6 - k; return 1.6 + 6 * (k + smoothstep(0.72, 1, f)); }
  const q = (b - 24) / 9, k = Math.floor(q), f = q - k; return 25.6 + 9 * (k + smoothstep(0.72, 1, f));
};
// the heights (of the smooth form) at which each terrace wall begins and ends: the land's mesh puts its rows exactly there
export const TERRACE_ROWS = (() => { const r = [1.6]; for (let k = 0; k < 4; k++) r.push(1.6 + 6 * k + 4.32, 1.6 + 6 * (k + 1)); for (let j = 0; j < 5; j++) r.push(25.6 + 9 * j + 6.48, 25.6 + 9 * (j + 1)); r.push(76, 82, 89, 97, 105, 113); return r; })();
// the smooth form of the south country (banks, plateau, bluff) before it is cut into terraces
export function southG(x, z, d) {
  let g = 1.6 + clamp((d - 8) * 0.3, 0, 24);      // four terraces of 6 m in 88 m of bank, then the upland
  g += 2.6 * Math.sin(x * 0.013 + 1.1) * Math.sin(z * 0.011 + 0.5) * smoothstep(108, 190, d);
  const c = crestH(x), sh = southShore(x);
  // (south of the crest the hill rises evenly from behind the quay to the crest line; on the bench it has come to its full height
  // BENCH.d metres before the crest line, so the bench is level from front to back)
  const rise = QUAY_Z - 10 - CREST_Z, p = z >= CREST_Z ? clamp((QUAY_Z - 10 - z) / (rise - BENCH.d * benchK(x)), 0, 1) : 1 - (1 - clamp((z - sh) / (CREST_Z - sh), 0, 1)) ** 1.7;
  const b = c * p;
  return b > g ? b + 0.25 * (g - b) * Math.exp(-(b - g) * 0.2) : g + 0.25 * (b - g) * Math.exp(-(g - b) * 0.2);
}
// terraced south of the crest only, and only up to the saddle's height: the north face is one wooded slope and the knolls are smooth wooded heads
export const terraceK = (z, g) => smoothstep(CREST_Z + 2, CREST_Z + 14, z) * (1 - smoothstep(56, 68, g));
// THE BLUFF'S PLOTS. The bluff's south face was terraced plot by plot, each garden at its own levels: along the hill it is divided into
// plots 46 to 88 m wide, and in each the whole flight of terraces stands PLOT.o metres higher or lower than the form's own steps
// (neighbours on opposite sides, 2.6 to 6.4 m apart), with a ramp PLOT_RAMP metres wide between two plots. So no terrace edge runs the
// width of the hill at one level. The quay and the first tread behind it are one level for the whole town (the shift begins in the
// first wall), and the banks' terraces, which run along the river, are not shifted. The land is not dealt: the table is fixed.
export const PLOT_RAMP = 8;
const PLOT = (() => { const e = [], o = [], h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  for (let x = -338, i = 0; x < 500; i++) { e.push(x); o.push((i % 2 ? 1 : -1) * (1.3 + 1.9 * h(i))); x += 46 + 42 * h(i + 50); }
  return { e, o }; })();
export const PLOT_EDGES = PLOT.e;
// the plot's shift at x, and how steeply it changes there (0 on a plot, 1 in the middle of a ramp)
export function plotW(x) { const e = PLOT.e, o = PLOT.o; let i = 0; while (i < e.length - 1 && x > (e[i] + e[i + 1]) / 2) i++;      // i: the nearest edge
  if (i === 0) return [o[0], 0]; const t = clamp((x - e[i]) / PLOT_RAMP + 0.5, 0, 1), s = t * t * (3 - 2 * t);
  return [o[i - 1] + (o[i] - o[i - 1]) * s, 4 * t * (1 - t)]; }
// A place's TERRACE COORDINATE t, and its plot's shift W. In a plot shifted by W every tread above the first wall stands W lower than
// the form's own steps (t = g + W there); the first wall rises from the town's one quay level to the plot's first tread (6 - W metres),
// with the same batter as every other wall; below it t runs from the quay level to the wall's foot. Treads and walls are read from t
// exactly as from the form's height in an unshifted country (walls where the fraction of a step is over 0.72). The shift comes in
// over the 14 m behind the quay line, where the ground is the quay's one level whatever it is.
export function terrT(x, z, g) {
  const W = plotW(x)[0] * smoothstep(0, 14, QUAY_Z - z), gb = 7.6 - W, ga = gb - 1.68 * (6 - W) / 6;
  return [g >= gb ? g + W : g <= 1.6 ? g : g <= ga ? 1.6 + (g - 1.6) * 4.32 / (ga - 1.6) : 5.92 + 1.68 * (g - ga) / (gb - ga), W];
}
// ---- THE WAY UP THE TOWN. No stair runs broad and straight from the quay to the crest. The way goes up in three FLIGHTS of steps,
// each at its own place along the hill and each narrower than the last; between two flights it follows a terrace's own gravel walk
// (as every garden walk of the town does); above the last flight it parts into two narrow garden PATHS over the top lawn, one east
// along the bench's front to the halls, one west up to the crest's walk in the low place. Laid by the
// land alone: a flight runs from one terrace's walk to a higher one's (its ends are found on the land's own terrace coordinate).
// flights: [{ x, z0 (foot), z1 (head), hw (half width) }]; paths: lists of map points; pathW: a path's half width.
// THE CREST'S THREE LONG HALLS stand in a row on the bench, from beside the road's crossing (the last of them under it) to the high
// head's foot, a little out of line with one another and overlapping end to end (map places of their middles; each is the long hall
// of the town's four kinds of house, its door to the river)
export const HALLS = [[BENCH.x1 - 59, CREST_Z + 7.5], [BENCH.x1 - 37, CREST_Z + 6], [BENCH.x1 - 15, CREST_Z + 8.5]];
// THE BACK STAIR: from behind the halls on the crest down the north face to the basin's landing (its middle line on the map)
export const BACK_STAIR = { x: SADDLE[0], amp: 7, k: 0.021, hw: 2.2 };
export const backStairX = (z) => BACK_STAIR.x + BACK_STAIR.amp * Math.sin((z - CREST_Z) * BACK_STAIR.k);
const zAtT = (x, tWant) => { let z0 = QUAY_Z - 9, z1 = CREST_Z + 3; const tAt = (z) => { const d = waterD(x, z); return d > 0 ? terrT(x, z, southG(x, z, d))[0] : 0; };
  for (let i = 0; i < 22; i++) { const zm = (z0 + z1) / 2; if (tAt(zm) < tWant) z0 = zm; else z1 = zm; } return z1; };
export const WAY = (() => {
  const flights = [[46, 0, 14.2, 2.2], [-16, 14.2, 35.5, 1.7], [-66, 35.5, 44.6, 1.3]].map(([x, t0, t1, hw]) => ({ x, z0: t0 ? zAtT(x, t0) : QUAY_Z - 7, z1: zAtT(x, t1), hw }));
  const top = [flights[2].x, flights[2].z1], zB = CREST_Z + BENCH.d + 0.6;      // (zB: along the bench's front edge, before the halls)
  return { flights, pathW: 0.8, paths: [[top, [-56, top[1] - 10], [-44, zB + 1], [HALLS[0][0] - 14, zB]], [top, [-74, top[1] - 14], [-80, CREST_Z + 2]]] };
})();
const WAY_SEGS = [...WAY.flights.map((f) => [f.x, f.z0, f.x, f.z1]), ...WAY.paths.flatMap((q) => q.slice(1).map((b, i) => [q[i][0], q[i][1], b[0], b[1]]))];
// metres from a map point to the way's middle line (flights and paths)
export const wayD = (x, z) => { let d = 1e9; for (const g of WAY_SEGS) d = Math.min(d, segD(x, z, g[0], g[1], g[2], g[3])); return d; };
const gf = (v) => (Math.round(v * 100) / 100).toFixed(2);
// the way's own bounds on the map, [x0, x1, z0, z1]: every flight and path with its half width and its soft edge. (The ground's
// shader asks the way only inside them; they come from the way, so wherever the way is laid it is drawn.)
export const WAY_BOX = (() => { const m = Math.max(...WAY.flights.map((f) => f.hw + 0.45), WAY.pathW + 0.3) + 0.5, b = [1e9, -1e9, 1e9, -1e9];
  for (const g of WAY_SEGS) { b[0] = Math.min(b[0], g[0], g[2]); b[1] = Math.max(b[1], g[0], g[2]); b[2] = Math.min(b[2], g[1], g[3]); b[3] = Math.max(b[3], g[1], g[3]); }
  return [b[0] - m, b[1] + m, b[2] - m, b[3] + m]; })();
// (after LIGHT_GLSL) p: a map point. Returns (how much of it is a flight's steps, how much a garden path).
export const WAY_GLSL = /* glsl */`
float olaSeg(vec2 p, vec2 a, vec2 b){ vec2 u = b - a; float t = clamp(dot(p - a, u)/max(dot(u, u), 1e-4), 0., 1.); return length(p - a - u*t); }
vec2 olaWay(vec2 p){ float f = 0., g = 1e3;
${WAY.flights.map((q) => `  f = max(f, (1. - smoothstep(${gf(q.hw - 0.45)}, ${gf(q.hw + 0.45)}, abs(p.x - (${gf(q.x)})))) * step(${gf(q.z1)}, p.y) * step(p.y, ${gf(q.z0)}));`).join('\n')}
${WAY.paths.flatMap((q) => q.slice(1).map((b, i) => `  g = min(g, olaSeg(p, vec2(${gf(q[i][0])}, ${gf(q[i][1])}), vec2(${gf(b[0])}, ${gf(b[1])})));`)).join('\n')}
  return vec2(f, 1. - smoothstep(${gf(WAY.pathW - 0.3)}, ${gf(WAY.pathW + 0.3)}, g)); }`;
export function southH(x, z) {
  const d = waterD(x, z); if (d <= 0) return Math.max(-3, d * 1.5);
  const g = southG(x, z, d), [t, W] = terrT(x, z, g), k = terraceK(z, g);
  const th = t <= 1.6 ? t : t >= 7.6 ? terr(t) - W : 1.6 + (terr(t) - 1.6) * (6 - W) / 6, h = g + (th - g) * k;
  return d < 1.5 ? h * d / 1.5 : h;
}
// the hill's outer slope: turf from the rim's crest down into the water, with two level terrace paths round it (each 3 m wide, a low
// wall above and below) and a waterline that wanders a few metres in and out (th: the bearing round the hill, from the star's)
export const PATHS = [157, 170.5];
export const footR = (th) => BOWL.foot + 3.2 * Math.sin(5 * th + 1) + 2 * Math.sin(13 * th + 2.2) + 1.2 * Math.sin(29 * th + 0.5);
export const MOUTH_R = BOWL.foot - BOWL.yStage / BOWL.yRim * (BOWL.foot - BOWL.rim);      // where the slope is as high as the stage
export function slopeY(r, th) {
  const B = BOWL, lin = (q) => B.yRim * (B.foot - q) / (B.foot - B.rim);
  if (r >= MOUTH_R) { const rf = footR(th); return B.yStage * (rf - r) / (rf - MOUTH_R); }
  for (const t of PATHS) if (Math.abs(r - t) <= 1.5) return lin(t);
  return lin(r);
}
// the bowl's hill, by the brief's own section: foot 190 in the water, crest 140 at 36, rim walk, 22 tiers, paved ring, pool; the notch a flat stage
export function hillH(x, z) {
  const B = BOWL, dx = x - B.c[0], dz = z - B.c[1], r = Math.hypot(dx, dz);
  const l = -AXIS[1] * dx + AXIS[0] * dz, a = AXIS[0] * dx + AXIS[1] * dz;
  const outer = r >= B.rim ? Math.max(-3, slopeY(r, Math.atan2(l, a))) : -1;
  let h;
  if (r >= B.rim) h = outer;
  else if (r >= B.rim - 2) h = B.yWalk + (B.yRim - B.yWalk) * (r - (B.rim - 2)) / 2;
  else if (r >= B.top) h = B.yWalk;
  else if (r >= B.low) h = B.yLow + B.rise * (Math.floor((r - B.low) / B.tread) + 1);
  else if (r >= B.pool) h = B.yLow;
  else h = B.yPool;
  if (a > 0 && Math.abs(l) < B.notch && r >= B.pool) h = Math.min(h, r < B.rim ? B.yStage : Math.max(outer, Math.min(B.yStage, 3 + 5.5 * clamp((235 - r) / 50, 0, 1))));
  else if (a > 0 && r >= B.pool) h = Math.min(h, STEPS.top(l));      // the stepped sides of the notch
  return h;
}
// the far country: a level plain behind the basin's far bank, and the low neck that joins the hill to it behind the notch
const NECK = [bowlXZ(0, 150), bowlXZ(0, 290)];
export function plainD(x, z) { return Math.max(northShore(x) - z, 74 - segD(x, z, NECK[0][0], NECK[0][1], NECK[1][0], NECK[1][1])); }
export function plainH(x, z) {
  const d = plainD(x, z); if (d <= 0) return Math.max(-3, d * 0.5);
  const dx = x - BOWL.c[0], dz = z - BOWL.c[1], r = Math.hypot(dx, dz);
  return Math.min(d * 0.25, 3 + 5.5 * clamp((235 - r) / 50, 0, 1));
}
// the height of whatever ground or still water lies at a map point (the river and basin are 0)
export function groundH(x, z) {
  const r = Math.hypot(x - BOWL.c[0], z - BOWL.c[1]);
  if (r < BOWL.foot + 4) return Math.max(0, hillH(x, z), z < -900 ? plainH(x, z) : -3);
  return Math.max(0, z < -700 ? plainH(x, z) : southH(x, z));
}
// THE TOWN'S HILL'S SHADE from the star, at a point south of the crest: the point's ray to the star is carried to the crest line and
// asked against the crest's own height there; the star's light comes in over TOWN_SOFT metres above the crest's ground (the height of
// the crowns that stand along it). North of the crest the town's hill shades nothing. Nothing in it but the land and the star's
// fixed place. ONE LAW IN TWO TONGUES: townLit, the script's, for what the build lays and bakes (a craft at anchor, a person, a
// tree's crown, a bank; and a watcher's second shadow is drawn or not by it), and olaTownLit (after the crest's shader form), for
// everything lit frame by frame at its own place (the water, the mist, the down, the smoke, the birds, the fliers, the pennants, a
// craft under way). They are the same number for number, so a baked thing and the water under it read one law at one place: plain
// from the crest to the quay line; past it the shade's edge is the ridge's outline WITH ITS WOODS and is wider and softer the
// farther the place lies from the crest (SHADE, above: the soft part widens evenly about its own middle).
export function townLit(x, y, z) {
  const d = z - CREST_Z; if (d <= 0) return 1; const t = d / -AXIS[1];
  const far = Math.max(t - SHADE.t0, 0), hs = TOWN_SOFT * 0.5 + SHADE.g * 0.5 * far, xc = x + AXIS[0] * t;
  return smoothstep(TOWN_SOFT * 0.5 - hs, TOWN_SOFT * 0.5 + hs, y + t * TAN_EL - crestH(xc) - Math.min(far / SHADE.ramp, 1) * crestWood(xc));
}
// THE TWO TONGUES ASKED AGAINST EACH OTHER (the world's build calls it and fails on it): the shader's form, transcribed here line
// for line from the text above with the numbers as that text prints them, against townLit, at 400 points of the river and its
// banks: a grid by place of 20 by 10 from the quay line to past the entry, each at a hull's height (3.6 m over the water) and 1 m
// over the ground or water there. Returns the greatest difference.
export function townLitTwin() {
  const num = (v, n) => Number(v.toFixed(n)), mix = (a, b, k) => a + (b - a) * k, G = (d) => Math.exp(-Math.min(d * d, 40));
  const wood = (x) => 4.5 * Math.sin(x * 0.071 + 1.3) + 3 * Math.sin(x * 0.173 + 4.1) - TOWN_SOFT * 0.5 * smoothstep(num(WOOD_GAP[0] - 6, 1), num(WOOD_GAP[0], 1), x) * (1 - smoothstep(num(WOOD_GAP[1], 1), num(WOOD_GAP[1] + 6, 1), x));
  const crest = (x) => { let c = RIDGE_Y * smoothstep(-300, -190, x) * (1 - 0.42 * smoothstep(380, 540, x)) - LOW[1] * G((x - LOW[0]) / LOW[2]); for (const [x0, h, w] of RIDGE) c += h * G((x - x0) / w);
    const t = clamp((x - BENCH.x1) / BENCH.out, 0, 1); return mix(c, BENCH.y, smoothstep(BENCH.x0 - BENCH.in, BENCH.x0, x) * (1 - t * (2 - t))); };
  const shader = (x, y, z) => { const d = z - CREST_Z; if (d <= 0) return 1; const t = d / num(-AXIS[1], 5);
    const far = Math.max(t - num(SHADE.t0, 3), 0), hs = TOWN_SOFT * 0.5 + num(SHADE.g * 0.5, 4) * far, xc = x + num(AXIS[0], 5) * t;
    return smoothstep(TOWN_SOFT * 0.5 - hs, TOWN_SOFT * 0.5 + hs, y + t * num(TAN_EL, 5) - crest(xc) - Math.min(far / SHADE.ramp, 1) * wood(xc)); };
  let worst = 0;
  for (let i = 0; i < 20; i++) for (let j = 0; j < 10; j++) { const x = -342 + 36 * i, z = QUAY_Z + 10 + 35 * j;
    for (const y of [3.6, groundH(x, z) + 1]) worst = Math.max(worst, Math.abs(shader(x, y, z) - townLit(x, y, z))); }
  return worst;
}
// is a point at height y above (x, z) in the star's light? The town's hill's shade (above), and a march toward the star over the
// nearer ground. Returns 0 (shaded) .. 1 (lit), soft over 2 m. (For a point south of the quay line the march goes as far as that
// line and no farther: beyond it stands the town's hill, whose shade is the law's own answer, and it is not asked a second time
// with a hard edge; so a thing baked on the river and the water drawn under it read the one law.)
export function starLit(x, y, z, far = 520) {
  let lit = townLit(x, y, z); if (lit <= 0) return 0; const sx = STAR_DIR.x, sz = STAR_DIR.z, n = Math.hypot(sx, sz);
  for (let t = 5; t < far; t += 5 + t * 0.06) {
    const px = x + sx / n * t, pz = z + sz / n * t; if (z > QUAY_Z && pz <= QUAY_Z) break;
    const c = y + t * TAN_EL - groundH(px, pz);
    if (c < 2) { lit = Math.min(lit, clamp(c / 2, 0, 1)); if (lit <= 0) return 0; }
  }
  return lit;
}

// ---- THE NEW STAR STANDS. It is in the sky at ONE strength from the first frame to the last: never born, never growing, never fading;
// nothing in the world reads the flight or the clock to light it. Everything that takes its light (the glare, the glitter and the
// silver on water and snow, the second shadows, the afterglow's level under it) is constant with it. Where it is SEEN and where its
// light FALLS is the land's affair alone: it stands 12 degrees up beyond the town's hill, so the river road and the town's river
// side lie in the hill's own shade from it (the shade law below, starLit, and its shader form olaTownLit), and over the saddle the
// road comes out of that shade into the starlit basin.
export const STAR_K = 0.8;      // (of the full strength the four lights are written for: tuned on the whole flight)

// ---- the lights every shader of the world shares (one object each: the build sets them once, by setLights; update() writes the clock alone, uTime)
export function makeLightUniforms() {
  return {
    uHemiSky: { value: new THREE.Color() }, uHemiGround: { value: new THREE.Color() },
    uGlowDir: { value: new THREE.Vector3(0, 0.1, 1) }, uGlowCol: { value: new THREE.Color() },
    uBandDir: { value: new THREE.Vector3(0, 1, 0) }, uBandCol: { value: new THREE.Color() },
    uStarDir: { value: STAR_DIR.clone() }, uStarCol: { value: new THREE.Color() }, uStar: { value: 0 },
    uFogCol: { value: new THREE.Color('#1A2444') }, uFogDen: { value: 0.00042 }, uTime: { value: 0 }, uSnow: { value: 0 }, uMX: { value: 1 },
    uLampMap: { value: new THREE.DataTexture(new Uint8Array(4), 2, 2, THREE.RedFormat, THREE.UnsignedByteType) }, uLampBox: { value: new THREE.Vector4(0, 0, 1, 1) },
  };
}
// ---- THE LAMPS' LIGHT ON THE GROUND. Every lamp post, brazier and lit doorway lays its pool of light into ONE map of the country
// (1 m cells); the ground itself (the land, the quays, the terraces, the bowl's hill) reads its light from the map. So a pool lies on
// whatever ground is under it, runs over a terrace's edge and down its wall as light does, and never hangs in the air as a shape.
// stamp(x, z, r, k, h, foot, wide): a flame of strength k, h metres over the ground at map point (x, z), lighting out to r metres; foot
// false: a light with no body over its own foot (a lit doorway's light on its yard, a globe held in the hand); wide false: a small
// light that adds nothing to the town's wide warmth (a held globe).
export function makeLampMap(LU, box = { x0: -330, z0: -1000, w: 880, h: 1120 }) {
  const { x0, z0, w, h } = box, acc = new Float32Array(w * h);
  LU.uLampBox.value.set(x0, z0, 1 / w, 1 / h);
  return {
    // (the square law, the flame's own foot dark; and round every pool a wide faint warmth, the light that many lamps together lay on
    // a town's walls and terraces: out to WIDE metres, WARM of a pool's own strength at its middle. Both numbers are the whole country's.)
    stamp(x, z, r, k = 1, hgt = 0, foot = true, wide = true) { const soft = 2.6 + 1.6 * hgt * hgt, end = 1 / (1 + r * r / soft), WIDE = 30, WARM = 0.085, R = wide ? Math.max(r, WIDE) : r, R2 = R * R, r2 = r * r, W2 = WIDE * WIDE;
      for (let j = Math.max(0, Math.floor(z - R - z0)); j <= Math.min(h - 1, Math.ceil(z + R - z0)); j++) for (let i = Math.max(0, Math.floor(x - R - x0)); i <= Math.min(w - 1, Math.ceil(x + R - x0)); i++) {
        const dx = i + 0.5 + x0 - x, dz = j + 0.5 + z0 - z, d2 = dx * dx + dz * dz; if (d2 > R2) continue; const d = Math.sqrt(d2); let a = 0;
        if (d2 < r2) { const t = foot ? Math.min(Math.max((d - 0.25) / 0.65, 0), 1) : 1; a = Math.max(1 / (1 + d2 / soft) - end, 0) * t * t * (3 - 2 * t); }      // the pool: the square law, the flame's own foot dark
        if (wide && d2 < W2) { const t = d / WIDE, u = 1 - t * t * (3 - 2 * t); a += WARM * u * u; }                                                        // the wide faint warmth
        if (a > 0) acc[j * w + i] += a * k; } },
    async finish(pause = async () => {}) { const data = new Uint8Array(w * h);
      for (let j = 0; j < h; j++) { if (j % 128 === 127) await pause(); for (let i = j * w, e = i + w; i < e; i++) data[i] = Math.round(255 * Math.sqrt(Math.min(acc[i] / 2, 1))); }
      const t = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; LU.uLampMap.value = t; return t; },
  };
}
// (after LIGHT_GLSL, in a fragment shader) p: a map point; alb: the ground's own colour there. The pools breathe with their flames.
export const LAMPMAP_GLSL = /* glsl */`
uniform sampler2D uLampMap; uniform vec4 uLampBox;
vec3 olaLamps(vec2 p, vec3 alb){ vec2 uv = (p - uLampBox.xy) * uLampBox.zw; float v = texture2D(uLampMap, clamp(uv, 0., 1.)).r;
  float inside = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.), breath = .7 + .42*olaNoise(p*.13 + uTime*vec2(1.9, 1.4)) + .06*sin(uTime*5.3 + 40.*olaNoise(p*.21));      // (flames gutter: their light on the ground is never quite still)
  return vec3(1., .44, .095) * (v*v*2. * inside * breath * (.4 + 1.5*dot(alb, vec3(.333)))); }
`;
// THE FAR SIDE'S ONE LAW, for the sky, the river's mirror and the pool's. It is far land in its own daylight, seen by direction alone:
// e = degrees up within the band's plane (0 ahead, 90 overhead, 180 astern), off = degrees off that plane, el = degrees over the horizon.
// Its width always grows downward, and gently (0.4 of a degree across overhead, 0.8 at 30 degrees up, 1.6 at 10, 2.3 at the
// horizon: 0.4 / sqrt(sin^2 e + 0.03)): it never opens into a cone, a tent or a base.
// It is a RIBBON: one even brightness across its width, its two edges soft (a little crisper high up), never a line that is brightest
// along its middle (which reads as a streak that tapers wherever it dims). Its daylit part is ONE even brightness from twenty-two
// degrees up over the top of the sky; below that it is land going away from us through more and more air: its light FALLS AWAY
// DOWNWARD over those twenty-two degrees to BAND_FOOT of itself at the horizon, by equal shares for equal steps of an EASED measure of
// the height (a smoothstep: slow where it leaves the even brightness, so there is no corner there, quickest about eleven degrees up,
// slow again at the horizon; not equal shares for equal degrees). There is no level at which it ends, so no stump, while
// its width only ever grows, and it goes into the horizon's haze still to be seen. It never stops upward and never comes to a point.
// One stretch of it is in daylight (all of it ahead at the early hour; from about twelve degrees up at the late one, where day gives
// way to night along SIXTEEN degrees of it, never at a line across it); the rest is its night side, BAND_GHOST as bright, blue-grey,
// at the same width: a ghost of itself that the eye can follow down to the horizon's haze behind whatever stands before it. At its
// foot there is no flare, tent, cone or base: only a LOW LEVEL GLOW, the far daylight in the horizon's haze, which depends on the
// height over the horizon alone (gone by five degrees up) and lies along the horizon to either side of the band's foot, well under
// the new star. In its LOWEST TWELVE DEGREES (olaBandLow) its two edges are at their softest, and the night side's light too falls a
// little toward the horizon (to 0.6 of BAND_GHOST: day side and night side come down to the same light there): low in the sky it is
// a faint thing of the haze. Nothing here has a time term.
export const BAND_FOOT = 0.12, BAND_GHOST = 0.2;
export const BAND_GLSL = /* glsl */`
float olaBandHW(float e){ float s = sin(clamp(e, 0., 180.)*.0174533); return .2 / sqrt(s*s + .03); }                // half width in degrees
float olaBandAxis(float e, float lit){ float t = smoothstep(0., 22., clamp(min(e, 180. - e), 0., 90.));      // its light (lit: the share of it in daylight there)
  return .3 * mix(${BAND_GHOST} * (.6 + .4*t), pow(${BAND_FOOT}, 1. - t), lit); }
float olaBandLow(float e){ return 1. - smoothstep(0., 12., clamp(min(e, 180. - e), 0., 90.)); }      // 1 at the horizon, 0 from twelve degrees up: its lowest degrees
float olaBandProf(float x, float high, float low){ float soft = mix(.6, .3, high) + .35*low; return 1. - smoothstep(1. - soft, 1. + soft, abs(x)); }      // across it: x in half widths (its edges softest in its lowest degrees)
float olaBandLit(float e, float late){ float lo = mix(-30., 12., late), hi = mix(96., 121., late);      // the stretch in daylight; the part overhead is lit at every hour
  return smoothstep(lo-7., lo+9., e) * (1.-smoothstep(hi-6., hi+6., e)); }
float olaBandGlow(float off, float el, float late){ float t = max(el, 0.)/3.2;
  return .15 * mix(1., .3, late) * exp(-t*t) * smoothstep(-2., .3, el) * (1. - smoothstep(16., 42., abs(off))); }
`;
export const LIGHT_GLSL = /* glsl */`
uniform vec3 uHemiSky, uHemiGround, uGlowDir, uGlowCol, uBandDir, uBandCol, uStarDir, uStarCol, uFogCol;
uniform float uStar, uFogDen, uTime, uSnow, uMX;
vec3 olaW(vec3 w){ return vec3(w.x*uMX, w.y, w.z); }      // a world point or direction in the unmirrored frame every rule is written in
vec3 olaLight(vec3 n, float lit){
  return mix(uHemiGround, uHemiSky, n.y*.5+.5) + uGlowCol*max(dot(n,uGlowDir),0.) + uBandCol*max(dot(n,uBandDir),0.) + uStarCol*lit*max(dot(n,uStarDir),0.);
}
vec3 olaFog(vec3 c, float d){ float f = 1.-exp(-d*d*uFogDen*uFogDen); return mix(c, uFogCol, clamp(f,0.,1.)); }
// THE ONE LAW OF THE LEAST PIXEL, for every light that is a round body of true size (a lamp's flame, a held globe, a float's globe and
// the flame in it, a flier's lamp): where its radius is under three quarters of a pixel it is drawn at three quarters of a pixel and its
// light is cut by the square of the ratio, which is exactly the area added. So a light never gains by distance, and nothing switches.
// size: its true radius, metres; px: metres under one pixel where it stands. Returns (the radius drawn, the share of its light kept).
vec2 olaLeast(float size, float px){ float rad = max(size, .75*px), k = size/rad; return vec2(rad, k*k); }
float olaHash(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float olaNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(olaHash(i), olaHash(i+vec2(1.,0.)), f.x), mix(olaHash(i+vec2(0.,1.)), olaHash(i+vec2(1.,1.)), f.x), f.y); }
// the light of a point as bright as this one shivers on pale ground: faint long ripples of light and shade slide over it with the air
// (the bands seen before a total eclipse). p: a map point. Returns the star's light there, about 0.75 to 1.25 of its mean.
float olaBands(vec2 p){ vec2 q = vec2(p.x*.9 + p.y*.44, -p.x*.44 + p.y*.9); q = q*vec2(.5, .11) + uTime*vec2(1.4, .11);      // (they run across the ground at about three metres a second)
  return 1. + .55*(olaNoise(q) + .5*olaNoise(q*2.3 + 7.) - .75); }
`;
export const lin = (hex) => new THREE.Color(hex);
