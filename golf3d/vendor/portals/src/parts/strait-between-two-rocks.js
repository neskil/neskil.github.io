// The pool under the low rock, and what stands in it and over it (hero of strait-between-two-rocks).
//
// Everything here is a pure function of the world clock. THE POOL'S ROUND of 26 s (drawn down, open, closing, thrown up, falling and seething) runs on the clock plus ONE PHASE DEALT BY THE SEED
// (setClock), and all that follows the round's own age runs with it. THE SWELL'S TRAINS AND THE SURF AND WASH AT THE ROCKS' FEET run on the bare clock with typed phases, the same on every seed.
// Nothing reads the visitor.
// Axes of the world: the long straight of the way lies toward -Z (called south here); +X is its right hand (called east); the sea at rest is y = 0.
// The hero's own origin is the pool's centre PC on the sea; its open side is toward -X (the strait).
import * as THREE from 'three';
import * as flora from '../kit/flora.js';

// THE BAKE'S CUT BY THE LINE, behind this ONE constant: true = no march toward the sun is made from a place whose face is turned from every place of the line (bakeGrid's o.eyes);
// false = every place of every skin is marched.
const BAKE_CUT_BY_LINE = false;
// EACH OF THREE STONES CAN BE TAKEN OUT OF THE WORLD BY ONE CONSTANT (the owner's bound: a stone that reads as a figure, a face or a mouth comes out): set true, the stone is not there (no skin,
// no body in any law of the place: no shadow, no foam about a foot, no air counted to it); everything else stands, the fallen blocks about R1's foot too (they are laid by its plan).
// STONE_R1_OUT: the body R1 of the mountain (to the right of the gully as she comes in). STONE_TAIL6_OUT: the gate's tall slab TAIL[6]. Both stand (false).
// STONE_TAIL7_OUT = true: THE SMALL ROCK BEFORE THE GATE IS OUT OF THE WORLD: the low ledge to starboard just past the tree end (TAIL[7]: plan (6.8, -322.0), 3.2 m high, 12.5 m to starboard of
// the line at its metre 326, the nearest stone to the way there): the dark gaps and lit uprights under its top are too like a row of teeth. It has no skin (so no wet band, no weed), is no
// body in the tail's law (no shade from it in its neighbours' bake, no air counted to it), and is not in the sea's distance to the tail (no foam about a foot that is not there). Its row stays in
// TAIL, unread, so every other slab keeps its number, its form and its place.
export const STONE_R1_OUT = false, STONE_TAIL6_OUT = false, STONE_TAIL7_OUT = true;
export const PC = [42, -262];                    // the pool's centre on the sea (world x, z): 52 m to starboard of the long straight (x = -10), which crosses the funnel's outer slope
export const ROUND = 26;                         // seconds of one round on the world clock
export const BURST = 17.3;                       // the second of the round at which the dome bursts
export const SUN = [-0.652, 0.225, -0.724];      // toward the sun: 13 degrees high, 42 degrees to port of the long straight's bow: over the channel between the mountain's south end and the low rock's tree end, the one bearing ahead on which the pool lies in the sun (by a count in node)
const SUN_HL = Math.hypot(SUN[0], SUN[2]);
export const SUN_H = [SUN[0] / SUN_HL, SUN[2] / SUN_HL];     // toward the sun on the sea (unit)
// CAN A SUN MARCH MEET A BODY AT ALL? A body's law begins with a bound of its own: a height band and a round about its (leaning) axis, outside which it answers no. A march is one straight
// line from a place toward the sun, lim metres long; where that whole line stays outside the bound the body is not asked at any step of it: the same answer, by far fewer asks (a ledge's or a slab's march
// asked every body of its group at every step). B: [axis x, axis z, lean x, lean z, round squared, highest, lowest] (one or more such bands a body); a hair is given to every edge, so rounding can only keep a body in.
const marchMeets1 = (B, x, y, z, lim) => { const sx = SUN[0], sy = SUN[1], sz = SUN[2]; if (!(sy > 0)) return true; if (y > B[5]) return false; let t0 = 0, t1 = (B[5] - y) / sy + 1e-6; if (lim < t1) t1 = lim;
  if (y < B[6]) { t0 = (B[6] - y) / sy - 1e-6; if (t0 > t1) return false; if (t0 < 0) t0 = 0; }
  const qx = x - B[0] - B[2] * y, qz = z - B[1] - B[3] * y, vx = sx - B[2] * sy, vz = sz - B[3] * sy, vv = vx * vx + vz * vz; let t = vv > 0 ? -(qx * vx + qz * vz) / vv : 0; if (t < t0) t = t0; else if (t > t1) t = t1;
  const ax = qx + vx * t, az = qz + vz * t; return ax * ax + az * az <= B[4] * 1.000001 + 1e-6; };
const marchMeets = (Bs, x, y, z, lim) => { for (let i = 0; i < Bs.length; i++) if (marchMeets1(Bs[i], x, y, z, lim)) return true; return false; };
export const SH_A = [-SUN_H[0], -SUN_H[1]], SH_P = [SUN_H[1], -SUN_H[0]], SH_T = SUN[1] / SUN_HL;     // the shadows' axis on the sea (down-sun), the axis square to it, and the sun's slope (a shadow's metres of fall for a metre along)
const g3 = (v) => v.toFixed(4);
export const ROCK_C = [-72, -190];               // the high rock's foot centre: 72 m before the pool's centre along the line, so the line passes under its wall before the pool opens (the world sets its x so that the wall stands 35 m from the line)
export const ROCK_TOP = 214, ROCK_NECK = 150;    // its highest tooth (inside the cloud, never seen); the height up to which each buttress keeps its hollow profile (inside the cloud's collar; above it each closes to its own tooth)
const TAU = Math.PI * 2;
// THE HIGH ROCK'S PLAN (the same on every seed; the seed deals only its cracks, scars and ledges): A MOUNTAIN'S HORN
// standing out of the sea. At the sea it is 96 m long across the strait (44 m of it toward the line, 52 m away) and 51 m
// through (23 m toward the entry, 28 m behind), 105 by 59 m with its aprons; no axis of mirror. FOUR BUTTRESSES between
// FOUR GULLIES. A gully: its bearing at the sea (degrees from the south round by the east), its depth and half width in
// metres, how it leans with height (radians a metre: 5 to 10 degrees of lean on the face, no two alike, no two parallel)
// and the phase of its deepening. A buttress (from its gully round to the next): the share c of its plan it keeps far
// up, the height L over which it draws in, and its tooth's height. Its profile c + (1 - c) exp(-y / L) is HOLLOW at
// every height (broad at the sea, steepening upward, never bowed outward); the four draw in to 0.46 to 0.57 of the plan
// at 140 m, and end as separate teeth 46 m apart in height, inside the cloud.
export const CRAG = { Ae: 44, Aw: 52, Bs: 23, Bn: 28, p: 2.3, apron: 5.5,
  clefts: [[-58, 10, 5, -0.0026, 0.4], [-10, 4, 3.2, 0.0025, 2.6], [50, 16, 7.5, 0.0036, -1.43], [152, 12, 6, -0.003, 4.4]],
  but: [[0.40, 62, 176], [0.54, 48, 214], [0.43, 78, 198], [0.47, 58, 168]] };
const D2R_ = Math.PI / 180;
// THE LOW ROCK'S TAIL IS THE GATE. The line's last 128 m are laid to port and AT THE SUN (the world file: a bend to port by the sun's own bearing, 42.0 degrees, from the metre 292 to 354.3, then a
// last straight of 66.0 m on which the sun stands over the bow and over the way out). THIRTEEN STANDING SLABS, laid from metres ALONG that last straight (a, from its first metre; the way out is
// at a = 66.0) and ASIDE of it (s, to starboard):
//   FOUR ARE PASSED: rows 0 and 1 to starboard (a -12 and 0, s 27 and 42: they go by as the look comes forward from the fig), row 2 to port (a 34, s -21), row 3 THE TALLEST OF THE FOUR to starboard
//     (a 28, s 24; 21 m high: the gate's one side look goes up its lit rim). Their long ways lie near the line's, their broad faces turned to the line and the sun;
//   NINE STAND BEYOND THE WAY OUT and are never passed, their broad faces turned toward the oncoming eye: rows 4 and 5 flank it (a 98 and 100, s -34 and 34; 24 and 19 m high), rows 6 and 8 behind and
//     outside them (a 134 and 126, s -68 and 62; 30 and 27 m), rows 9 to 13 farther (a 160 to 250, s -170 to 100; 14 to 30 m): the gate grows taller and fuller as the way nears.
// THE ROW IS LAID BY HAND (said in the open here and in the world's head): each slab is a typed place, turn and height, laid so that it stands whole as seen from the way along the last straight,
// its broad face to the oncoming eye. Unlike in height, breadth, lean and turn; each ONE STANDING BODY BY mkSlab's LAW below. Each row: its place (x, z), its measure, its height, a mark that is not
// read, the bearing its broad face is turned to (degrees), and its lean (metres aside for a metre of height, x and z). Row 7 (the small rock before the gate) stays in the list, unread
// (STONE_TAIL7_OUT): the owner's bound. Typed places in the world, for the whole stretch and every seed: nothing of it reads a still, a seed or the lens.
export const TAIL = [[-3.7, -358.0, 5.5, 9.5, 0, 112, -0.04, 0.04], [-0.6, -377.0, 6, 12, 0, 100, 0.03, 0.05], [-70.2, -360.1, 5.5, 12.5, 0, 152, 0.06, 0.02], [-32.7, -385.7, 7, 21, 0, 114, -0.04, -0.02], [-122.7, -399.0, 7, 24, 0, 60, -0.03, -0.05], [-73.5, -445.9, 7.5, 19, 0, 25, 0.05, -0.04], [-172.0, -403.0, 8, 30, 0, 70, 0.04, -0.05], [6.8, -322.0, 3.5, 3.2, 0], [-70.1, -484.0, 8.5, 27, 0, 15, -0.05, 0.03], [-253.4, -418.5, 10, 26, 0, 55, 0.03, -0.04], [-72.0, -528.0, 9, 18, 0, 30, -0.04, -0.03], [-325.5, -420.9, 10, 22, 0, 40, 0.05, 0.03], [-111.4, -586.7, 10, 30, 0, 10, -0.03, 0.05], [-121.1, -510.7, 8, 14, 0, 50, -0.05, 0.04]];
const TAIL_ON = (i) => !(STONE_TAIL6_OUT && i === 6) && !(STONE_TAIL7_OUT && i === 7);
const TAIL_FAR = (i) => i >= 9 && i <= 13;     // the five far stacks beyond the way out (100 m and more from every place of the line): a coarser skin
// a slab's long and short half measures at the sea (by its plan: its broad faces stand half its measure from its axis, its ends 1.2 measures)
const tailLS = (t) => t[5] === undefined ? [0.8 * t[2], 0.8 * t[2]] : [1.2 * t[2] + 1.2, 0.62 * t[2] + 1.2];
export function tailH() { return -5; }
// a slab's half breadth across the sun's own axis (its shadow's breadth on the sea): by its long and short half measures and the bearing of its length
const tailAcross = (t) => { const [L, S] = tailLS(t), A = ((t[5] ?? 0) + 90) * Math.PI / 180, sl = Math.hypot(SUN[0], SUN[2]), c = Math.abs(Math.sin(A) * SUN[0] + Math.cos(A) * SUN[2]) / sl; return 0.92 * Math.hypot(L * Math.sqrt(Math.max(1 - c * c, 0)), S * c); };
// THE HORN'S END IS THE LOW ROCK'S OWN CLIFF CARRIED
// ROUND THE RIDGE'S END: where the ridge ends toward the line it ends as a bluff with the same face as the cliff over the pool (the same beds stepping back, the same flutes and ledges by the same
// noise, three clefts through it, its foot going down under the sea in the same rough steps), its top falling toward the south, and on its north-west shoulder (toward the line and the pool) A SHELF
// half way up, where the fig stands (see makeLowRock). Its middle on the sea, its half length (north to south) and half breadth, its height. The low rock's smooth nose ends inside it (TOPS).
export const HORN = { c: [30.5, -318.5], L: 15.5, S: 11, az: 0, top: 21 };
// the surf's distance to a slab of the tail: round its own long plan (as a ledge's), never a round ring off its sides; and, for the sea's mirror, each slab's place, breadth across the look and height
const GLSL_TAIL = 'float tailD(vec2 p){ float d = 60.; vec2 q; float e;\n' + TAIL.map((t, i) => { if (!TAIL_ON(i)) return ''; const [L, S] = tailLS(t), A = (t[5] ?? 0) * Math.PI / 180, tx = Math.cos(A), tz = -Math.sin(A), nx = Math.sin(A), nz = Math.cos(A);
  return '  q = p - vec2(' + t[0].toFixed(1) + ', ' + t[1].toFixed(1) + '); q = vec2((q.x * ' + tx.toFixed(3) + ' + q.y * ' + tz.toFixed(3) + ') / ' + L.toFixed(1) + ', (q.x * ' + nx.toFixed(3) + ' + q.y * ' + nz.toFixed(3) + ') / ' + S.toFixed(1) + '); e = dot(q, q); d = min(d, (sqrt(e) - 1.) * mix(' + S.toFixed(1) + ', ' + L.toFixed(1) + ', q.x * q.x / max(e, 1e-4)));\n'; }).join('')
  + '  q = p - vec2(' + HORN.c[0].toFixed(1) + ', ' + HORN.c[1].toFixed(1) + '); q = vec2(q.y / ' + HORN.L.toFixed(1) + ', q.x / ' + HORN.S.toFixed(1) + '); e = dot(q, q); d = min(d, (sqrt(e) - 1.) * mix(' + HORN.S.toFixed(1) + ', ' + HORN.L.toFixed(1) + ', q.x * q.x / max(e, 1e-4)));\n'     /* the horn's bluff: the same surf at its foot */
  + '  return d; }\n'
  + 'vec2 tailMirror(vec3 P, vec3 R){ float rl = max(length(R.xz), 1e-4), el = R.y / rl, m = 0., lit = 0., al, pp, dd, k; vec2 dir = R.xz / rl, q;\n' + TAIL.map((t, i) => { if (!TAIL_ON(i)) return ''; const w = 0.9 * t[2];
  return '  q = vec2(' + t[0].toFixed(1) + ', ' + t[1].toFixed(1) + ') - P.xz; al = dot(q, dir); pp = abs(q.x * dir.y - q.y * dir.x); dd = max(al - ' + (0.5 * t[2]).toFixed(1) + ', 1.); k = (1. - smoothstep(' + (0.55 * w).toFixed(1) + ', ' + (1.05 * w).toFixed(1) + ', pp)) * step(0., al) * (1. - smoothstep(' + (0.72 * t[3]).toFixed(1) + ' / dd, ' + (1.0 * t[3]).toFixed(1) + ' / dd, el)) * smoothstep(.3, 2.5, dd); if (k > m) { m = k; lit = smoothstep(-.15, .45, dot(-q / max(length(q), 1.), SUNH)); }\n'; }).join('') + '  return vec2(m, lit); }\n';
export const WASH_LOW = -0.6, WASH_TOP = 2.9;     // the wash's levels (the stone shader's awash term)
const sgnPi = (x) => (((x + Math.PI) % TAU) + TAU) % TAU - Math.PI;
function cragPlan(b) { const s = Math.sin(b), c = Math.cos(b); return Math.pow(Math.pow(Math.abs(s) / (s > 0 ? CRAG.Ae : CRAG.Aw), CRAG.p) + Math.pow(Math.abs(c) / (c > 0 ? CRAG.Bs : CRAG.Bn), CRAG.p), -1 / CRAG.p) * (1 + 0.06 * Math.sin(b + 0.8) + 0.04 * Math.sin(3 * b + 2)); }
// the mean of the four profiles (the shadow's law reads it): 1 at the sea, 0.5 at 140 m, closing inside the cloud
export function cragK(y) { const yy = clamp(y, 0, ROCK_TOP); return (0.46 + 0.54 * Math.exp(-Math.min(yy, ROCK_NECK) / 62)) * (yy < ROCK_NECK ? 1 : Math.max(1 - (yy - ROCK_NECK) / 45, 0)); }
// a gully's bearing at a height: it leans, and wanders a metre or two
export function cleftAt(i, y) { const g = CRAG.clefts[i]; return g[0] * D2R_ + g[3] * y + 0.04 * (Math.sin(y * 0.045 + g[0]) - Math.sin(g[0])); }
const butK = (i, y) => { const [c, L, top] = CRAG.but[i]; return y < ROCK_NECK ? c + (1 - c) * Math.exp(-y / L) : (c + (1 - c) * Math.exp(-ROCK_NECK / L)) * Math.max((top - y) / (top - ROCK_NECK), 0); };
// the apron: the stone spreads at the sea (spurs and fallen blocks under the faces), by bearing; hollow like the rest
export const apronAt = (b, y) => CRAG.apron * (0.55 + 0.45 * Math.sin(2 * b + 1)) * Math.exp(-Math.max(y, 0) / 8);
// how deep gully i is cut at a bearing and a height (metres; nought outside it)
export function gullyCut(i, b, y) { const yy = clamp(y, 0, ROCK_TOP), g = CRAG.clefts[i], d = Math.abs(sgnPi(b - cleftAt(i, yy))) * cragPlan(b) / g[2]; return d < 1 ? g[1] * (0.78 + 0.22 * Math.sin(yy * 0.05 + g[4])) * Math.pow(1 - d, 0.8) : 0; }
// the faces are slabs that meet on sharp edges: two families of edges that lean opposite ways as they rise (metres)
export const areteAt = (b, y) => 2.2 * (Math.abs(Math.sin(2.5 * (b - 0.004 * y) + 0.7)) - 0.64) + 1.4 * (Math.abs(Math.sin(4.1 * (b + 0.0055 * y) + 2.1)) - 0.64);
// the high rock's radius at a bearing and a height: the plan, its gullies, each buttress's own hollow profile, the apron
// (the world adds the cave, the roof, the ramp, the cracks, the ledges)
export function rockFaces(b, y = 0) { const yy = clamp(y, 0, ROCK_TOP), r0 = cragPlan(b), n = CRAG.clefts.length; let cutD = 0, lo = 0, dlo = 1e9, dhi = 1e9;
  for (let i = 0; i < n; i++) { const g = CRAG.clefts[i], a = sgnPi(b - cleftAt(i, yy)), d = Math.abs(a) * r0 / g[2]; if (d < 1) cutD = Math.max(cutD, g[1] * (0.78 + 0.22 * Math.sin(yy * 0.05 + g[4])) * Math.pow(1 - d, 0.8));
    const fwd = a < 0 ? a + TAU : a; if (fwd < dlo) { dlo = fwd; lo = i; } if (TAU - fwd < dhi) dhi = TAU - fwd; }
  // this bearing stands in buttress lo (from gully lo round to the next); at a gully two profiles meet half and half
  const f = butK(lo, yy), k = f + 0.5 * (1 - sst(0, 0.2, dlo)) * (butK((lo + n - 1) % n, yy) - f) + 0.5 * (1 - sst(0, 0.2, dhi)) * (butK((lo + 1) % n, yy) - f);
  return (r0 - cutD) * k + apronAt(b, yy) + areteAt(b, yy) * (0.5 + 0.5 * k); }
const GLSL_ROCKFOOT = `float rockFootR(float rb){ float s = sin(rb), c = cos(rb);
  float r0 = pow(pow(abs(s) / (s > 0. ? ${CRAG.Ae.toFixed(1)} : ${CRAG.Aw.toFixed(1)}), ${CRAG.p.toFixed(2)}) + pow(abs(c) / (c > 0. ? ${CRAG.Bs.toFixed(1)} : ${CRAG.Bn.toFixed(1)}), ${CRAG.p.toFixed(2)}), ${(-1 / CRAG.p).toFixed(5)}) * (1. + .06 * sin(rb + .8) + .04 * sin(3. * rb + 2.));
  float cutD = 0., d;
` + CRAG.clefts.map(([deg, dep, hw, , ph]) => `  d = abs(mod(rb - ${(deg * D2R_).toFixed(4)} + 3.14159265, 6.2831853) - 3.14159265) * r0 / ${hw.toFixed(1)}; cutD = max(cutD, ${(dep * (0.78 + 0.22 * Math.sin(ph))).toFixed(2)} * pow(max(1. - d, 0.), .8));`).join('\n') + `
  return r0 - cutD + ${CRAG.apron.toFixed(2)} * (.55 + .45 * sin(2. * rb + 1.)) + 2.2 * (abs(sin(2.5 * rb + .7)) - .64) + 1.4 * (abs(sin(4.1 * rb + 2.1)) - .64); }
`;
export const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- THE HIGH ROCK IS ONE MOUNTAIN: ONE body, G1, goes up into the cloud; every
// other body stands AGAINST it: G2 its shoulder (94 m), W the gully's back wall between them (94), R1 (84), R2 (48), S (40), R3 (34). Each is an
// irregular prism of five or six FLAT faces about its own leaning axis; EVERY FACE LEANS IN (8 to 15 degrees, each its own: f.b); the offsets are
// STEPS (3 to 7 m deep over 4 m of height, at heights of the face's own). The three great lesser bodies (G2, W, R1) lean in 6 to 8 degrees only (the
// broad shoulders, no blade; W's cleft face keeps its 8.5). NO LESSER BODY ENDS IN A POINT (plain: true): each is parted on a
// sloping bed and that bed is its top; the cloud stands before every top over about 75 m. The feet are joined by low fallen blocks (BLOCKS) and
// by each face's own apron of scree. All of it is PLAN: the same on every seed. Azimuths are from +Z toward +X.
const hsh = (a, b) => { const q = Math.sin(a * 127.1 + b * 311.7 + 1.3) * 43758.5453; return q - Math.floor(q); };
// THE HASH OF A LATTICE PLACE, TAKEN ONCE: hashGrid(sd, x0, z0, hw, hh) answers hsh(ix + 57 * iz, sd) for whole ix, iz: from a table over the
// lattice places within hw, hh of (x0, z0) (made when first asked, each place filled when first asked), and by the hash itself outside it: the same number to the last bit, wherever it is asked.
const hashGrid = (sd, x0, z0, hw, hh) => { const W = 2 * hw + 1, Hh = 2 * hh + 1, X0 = Math.floor(x0) - hw, Z0 = Math.floor(z0) - hh; let T = null;
  return (ix, iz) => { const i = ix - X0, j = iz - Z0; if (i >= 0 && i < W && j >= 0 && j < Hh) { if (!T) T = new Float64Array(W * Hh).fill(NaN); const q = i + W * j; let v = T[q]; if (v !== v) { v = hsh(ix + 57 * iz, sd); if (v === v) T[q] = v; } return v; } return hsh(ix + 57 * iz, sd); }; };
const n2dOf = (x, z, G) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz), a = G(ix, iz), b = G(ix + 1, iz), c = G(ix, iz + 1), e = G(ix + 1, iz + 1); return a + (b - a) * sx + (c - a) * sz + (a - b - c + e) * sx * sz; };     // the two makers' lattice noise (smooth between four hashes of whole places: ix + 57 * iz), its four hashes from a hashGrid
const D2R17 = Math.PI / 180;
export const TOWERS = [
  { name: 'G1', c: [-86, -196], top: 180, lean: [-0.050, 0.020], sl: 0.30, ap: 4.5, slab: 0, sd: 0.5, f: [[35, 22, 0.150], [108, 36, 0.141], [160, 40, 0.146], [212, 40, 0.143], [268, 46, 0.141], [320, 34, 0.144]] },
  { name: 'G2', c: [-149, -159], top: 98, plain: true, lean: [-0.026, -0.155], sl: -0.26, ap: 3.5, sd: 0.5, f: [[24, 24, 0.105], [95, 24, 0.100], [150, 24, 0.102], [205, 25, 0.106], [262, 26, 0.110], [318, 23, 0.113]] },     // the shoulder: left of the gully, leaning back against the wall
  { name: 'W', c: [-123, -184.4], top: 104, plain: true, lean: [0.050, -0.030], sl: 0.30, ap: 2, cave: 0, f: [[28, 24, 0.150], [100, 42, 0.102], [160, 26, 0.133], [215, 26, 0.140], [270, 34, 0.105], [330, 30, 0.140]] },     // the gully's back wall (its front face, with the cave); its flanks are buried in G1 and G2
  { name: 'R2', steps: true, c: [-70, -271], top: 48, plain: true, lean: [-0.040, 0.060], sl: 0.35, ap: 4, f: [[15, 16], [88, 18], [165, 20], [235, 19], [300, 20]] },
  { name: 'R1', out: STONE_R1_OUT, steps: true, c: [-67, -240], top: 84, plain: true, lean: [-0.020, 0.060], sl: -0.36, ap: 3, sd: 0.5, f: [[20, 24, 0.105], [88, 20, 0.110], [150, 20, 0.100], [215, 22, 0.102], [285, 24, 0.115]] },
  { name: 'S', c: [-165.5, -155], top: 40, plain: true, lean: [0.060, -0.050], sl: 0.30, ap: 2.5, f: [[30, 18], [105, 18], [170, 19], [245, 17], [310, 17]] },
  { name: 'R3', steps: true, c: [-74, -306], top: 34, plain: true, lean: [0.050, 0.110], sl: -0.30, ap: 3, f: [[35, 19], [100, 18], [170, 19], [250, 18], [320, 19]] },
];
const SLAB_Y1 = 86;
// the great slab: G1's face toward the entry: one leaning face (8.5 degrees) that narrows upward, crossed by one slanting ledge (a step 3.5 m deep), one corner fallen at its foot
export const SLAB = { tower: 0, face: 0, y0: 6, y1: SLAB_Y1, mid: [-86 + (22 - 0.150 * 45) * Math.sin(35 * D2R17) - 0.050 * 45, 45, -196 + (22 - 0.150 * 45) * Math.cos(35 * D2R17) + 0.020 * 45] };
// THE CLEFT : no cave and no closed dark slit. In the gully's back wall (W's front face) an OPEN GULLY runs from the
// ledge at 70 m down to the foot and forks at 30 m (the law is in mkTower's off(); it narrows to nothing at 60 m: nothing of it stands between 60 and 70 m). CAVE keeps the named place: its middle at 52.5 m (mid) and the
// face's normal (n); y0, y1, half, deep and dip are not read by the form.
export const CAVE = (() => { const t0 = -1, y0 = 50, y1 = 56, ym = 52.5, W = TOWERS[2], f = W.f[0], A = f[0] * D2R17, n = [Math.sin(A), Math.cos(A)], a = f[1] - f[2] * ym;
  return { tower: 2, face: 0, t0, y0, y1, half: 15, deep: 12, dip: 0.34, n, mid: [W.c[0] + W.lean[0] * ym + a * n[0] + t0 * Math.cos(A), ym, W.c[1] + W.lean[1] * ym + a * n[1] - t0 * Math.sin(A)] }; })();
// THE BEDS : the whole mountain is ONE BEDDED STONE: beds 5 to 23 m thick, dipping 15 degrees one way
// through every body, each bed weathered back by its own depth (to 1.3 m), and broken at joints: upright breaks 15 to 40 m apart
// across which the beds are thrown 3 m and more. A law of the place (the stone's own metres); the stone's shader draws the same.
// THE DIP IS SEEN FROM THE ENTRY: 20 degrees, down along the entry faces' own strike; beds 8 to 34 m thick (a few long lines, no grid); each bed weathered
// back by its own depth (to 2.2 m: the proud beds stand out over the weathered ones). NO UPRIGHT JOINT: two or three great SLANTING breaks cross the
// whole mountain (dipping 48 degrees, 60 to 120 m apart), across which the beds are thrown 3.1 m. A law of the stone's own metres; the shader computes the same.
const BED_T = 0.364, BED_U = [0.82, -0.57];
const bedHb = (id) => { const q = id * 0.6180339 + 0.31; return q - Math.floor(q); };     // a bed's own number
const BED_TAB = (() => { const n = 2800, a = new Float32Array(n); for (let i = 0; i < n; i++) { const bw = -300 + i * 0.25, s = bw / 13 + 0.3 * Math.sin(bw * 0.075) + 0.06 * Math.sin(bw * 0.23 + 2), id = Math.floor(s), fr = s - id, h0 = bedHb(id - 1), h1 = bedHb(id); a[i] = 2.2 * (h0 * h0 + (h1 * h1 - h0 * h0) * sst(0, 0.12, fr)); } return a; })();
const JNT_TAB = (() => { const n = 1600, a = new Float32Array(n); for (let i = 0; i < n; i++) { const u = -400 + i * 0.5; a[i] = 3.1 * Math.floor((Math.sin(u * 0.035 + 0.6) + 0.5 * Math.sin(u * 0.013 + 2)) * 1.2); } return a; })();
const bedSet = (x, y, z) => { const bw = y - BED_T * (BED_U[0] * x + BED_U[1] * z) + JNT_TAB[Math.min(1599, Math.max(0, Math.round((0.82 * x - 0.57 * z + 0.9 * y + 400) * 2)))]; return BED_TAB[Math.min(2799, Math.max(0, Math.round((bw + 300) * 4)))]; };
// THE GREAT SLAB'S BEDS ARE NO FINER THAN ITS SKIN: the skin's rows stand 2 m apart, and a riser or a joint's throw finer than that (0.9 m) falls between two rows and makes rows of upright
// one-column teeth along each bed. The slab takes the same beds and the same joints by a law of its own: each riser 3.2 m high, each joint's throw taken up over ten metres and more along the
// face, read between the table's places
const BED_TAB_S = (() => { const n = 2800, a = new Float32Array(n); for (let i = 0; i < n; i++) { const bw = -300 + i * 0.25, s = bw / 13 + 0.3 * Math.sin(bw * 0.075) + 0.06 * Math.sin(bw * 0.23 + 2), id = Math.floor(s), fr = s - id, h0 = bedHb(id - 1), h1 = bedHb(id); a[i] = 2.2 * (h0 * h0 + (h1 * h1 - h0 * h0) * sst(0, 0.42, fr)); } return a; })();
const JNT_TAB_S = (() => { const n = 1600, a = new Float32Array(n); for (let i = 0; i < n; i++) { const u = -400 + i * 0.5, v = (Math.sin(u * 0.035 + 0.6) + 0.5 * Math.sin(u * 0.013 + 2)) * 1.2, fl = Math.floor(v); a[i] = 3.1 * (fl + sst(0.25, 0.75, v - fl)); } return a; })();
const BED_TAB_N = (() => { const n = 2800, a = new Float32Array(n); for (let i = 0; i < n; i++) { const bw = -300 + i * 0.25, s = bw / 13 + 0.3 * Math.sin(bw * 0.075) + 0.06 * Math.sin(bw * 0.23 + 2), id = Math.floor(s), fr = s - id, h0 = bedHb(id - 1), h1 = bedHb(id); a[i] = 2.2 * (h0 * h0 + (h1 * h1 - h0 * h0) * sst(0, 0.27, fr)); } return a; })();
// every other face of the mountain's seven bodies likewise (their beds 13 m thick: each riser 3.5 m high, the joints' throw taken up along the face): the same beds, the same depths, no teeth; the low ledges and the fallen blocks keep the sharp law
const bedBody = (x, y, z) => { const bw = y - BED_T * (BED_U[0] * x + BED_U[1] * z) + JNT_TAB_S[Math.min(1599, Math.max(0, Math.round((0.82 * x - 0.57 * z + 0.9 * y + 400) * 2)))]; return BED_TAB_N[Math.min(2799, Math.max(0, Math.round((bw + 300) * 4)))]; };
const tabAt = (T, n, q) => { if (q <= 0) return T[0]; if (q >= n - 1) return T[n - 1]; const i = Math.floor(q), fr = q - i; return T[i] + (T[i + 1] - T[i]) * fr; };
const bedSlab = (x, y, z) => tabAt(BED_TAB_S, 2800, (y - BED_T * (BED_U[0] * x + BED_U[1] * z) + tabAt(JNT_TAB_S, 1600, (0.82 * x - 0.57 * z + 0.9 * y + 400) * 2) + 300) * 4);
const tallBeds = (x, y, z, k) => { const u = TALL_U[0] * x + TALL_U[1] * z, w = TALL_U[1] * x - TALL_U[0] * z; return bedSet(5 * (BED_U[0] * u + BED_U[1] * w), 5 * y * BED_T / 0.364 + 17 * (k % 7), 5 * (BED_U[1] * u - BED_U[0] * w)); };     // a tall ledge's beds: 2.6 m thick, dipping its own way
const QJ = new Int32Array(12), QT = new Float64Array(12), QD = new Float64Array(12), QV = new Float64Array(12);     // the wall law's scratch
const BLOCK_DIP = {}, KNEE_U = 1.15, TALL_U = [0.34, -0.94], TALL_S = 0.5;     // the tail's tall ledges: the way their beds rise (toward the way out) and their steepest dip (27 degrees)
let METER = 0;     // the build's work meter: see the meter's paragraph by gridGeometry
let METER_ASKS = 0;
const STEP_US = 14000;     // a piece of the build's work, in thousandths of a millisecond of counted work: see the meter's paragraph by gridGeometry
const SLICE_US = 6000;     // the engine's own slice: an ask within it is answered at once and hands nothing back
export function tick(ctx, cost) { if ((METER += cost) < STEP_US || METER - cost < SLICE_US) return null; METER = cost; METER_ASKS++; return ctx.yield(); }     // asked BEFORE work of this cost: the work belongs to the piece that follows (no ask inside the engine's own slice: it would hand nothing back)
export function tock(ctx, cost) { if ((METER += cost) < STEP_US) return null; METER = 0; METER_ASKS++; return ctx.yield(); }     // asked AFTER work of this cost
export function first(ctx) { METER = 0; return ctx.yield(); }     // the build's first ask, before any work: the page's task that read the files (some 11 ms) is not joined to the build's first piece, and every build counts its pieces from nought
export const meterAsks = () => METER_ASKS;     // how often the meter has asked (for the builder's count in node)
function mkTower(k, d) {
  // THE BROKEN HEAD: no buttress and no shoulder ends in one peak over two sloping shoulders. Each body under the
  // cloud is parted on a bed a fifth of its height under its top (a rough plane dipping with the beds), and on that bed stand three or
  // four points of unequal height at unequal places, each steep (its sides 60 to 70 degrees), standing half way and more out from the axis, the highest only a quarter over the next: a broken ridge. The great peak alone goes into the cloud.
  const head = !d.block && d.top < 120; let hd = head ? Math.max(8, 0.2 * d.top) : 0, yc = d.top - hd, topE = d.top;
  const BT = d.block ? d.top * (0.55 + 0.3 * hsh(k, 151)) : 0;     // the one height every face of a fallen block goes in to: no level cut at its top
  if (d.block) BLOCK_DIP[k] = Math.min(0.24, d.f.reduce((m, q) => Math.max(m, -(Math.sin(q[0] * Math.PI / 180) * BED_U[0] + Math.cos(q[0] * Math.PI / 180) * BED_U[1])), -1) - 0.02);     // which of a block's faces are turned down the dip: every one within 76 degrees of it, and always the one most turned to it
  // A LESSER BODY STANDS CROOKED: from its foot to its head its whole section is shifted 1.2 to 1.7 m to one hand and then another every six metres of its height or so (a broken
  // line of its own, by the body's number: no draw of the seed), so neither of its sides is one straight line. Not the great body (its slab is one face) nor the cleft's body (the cleft keeps its place).
  let bend = null, bendMax = 0, ycCh = 1e9;
  if (head && d.plain && !d.low && d.cave === undefined) { const yv = d.top - Math.max(8, 0.2 * d.top), nb = Math.max(3, Math.round(yv / 5)), by = new Float64Array(nb + 1), bx = new Float64Array(nb + 1), bz = new Float64Array(nb + 1); let be = hsh(k, 401) * 2 * Math.PI;
    for (let i = 1; i <= nb; i++) { by[i] = i === nb ? yv : yv * (i + 0.4 * (hsh(k, i + 410) - 0.5)) / nb; const s = i === 1 ? 0.4 : 0.6 + 0.3 * hsh(k, i + 430);     /* the bends are small (0.6 to 0.9 m): one bedded rock, no stack of lumps */ be += Math.PI + 1.5 * (hsh(k, i + 420) - 0.5); bx[i] = 0.35 * bx[i - 1] + s * Math.sin(be); bz[i] = 0.35 * bz[i - 1] + s * Math.cos(be); bendMax = Math.max(bendMax, Math.hypot(bx[i], bz[i])); }
    bend = { n: nb, y: by, x: bx, z: bz }; }
  const F = d.f.map(([az, a0, bb], j) => {
    const A = az * Math.PI / 180, st = [], slab = d.slab === j, cave = d.cave === j;
    // the steps one sees in the outline: 3 to 7 m deep, each over 4 m of height, at heights of the face's own (unequal on the two sides)
    if (!d.block && !slab) { let y = cave ? 70 : 20 + 36 * hsh(k * 7 + j, 1); for (let i = 0; y < (d.top < 120 ? 0.55 * d.top : d.top - 12); i++) { st.push([y, 3 + (d.sd ?? 4) * hsh(k * 13 + j * 3, i + 2)]); y += 32 + 26 * hsh(k * 5 + j * 11, i + 7); } }
    // one gully a face on the great bodies: it runs down across the beds, slanting, 6 to 10 m broad and 2.5 to 4.5 m deep, dying out at the sea
    const gu = (!d.block && !slab && !cave && d.top >= 40) ? [a0 * (hsh(k * 19 + j, 81) - 0.5), (hsh(k * 23 + j, 83) > 0.5 ? 1 : -1) * (0.1 + 0.15 * hsh(k * 29 + j, 85)), 3 + 2 * hsh(k * 31 + j, 87), 2.5 + 2 * hsh(k * 37 + j, 89)] : null;
    // NO SIDE IS ONE STRAIGHT LINE FOR MORE THAN A THIRD OF ITS HEIGHT: every face of the mountain's bodies but the great slab and the cleft's is broken at five knees of its own
    // (at unequal heights between its foot and its head, or the cloud; all but level along the face): at one the face steps back 1.1 to 2 m by a sloping shelf (a third of that stretch high), over the next
    // stretch it comes out again, all but plumb (never more than 3.5 degrees over), and so on: never proud of the face's own plane. What the shelves take from the body's breadth its lean gives back (kb), so
    // each body keeps its size. Counted on the outline (the builder's count: no side within half a metre of one straight line for a third of its height).
    let ky = null, kv = null, ks = null, kmax = 0, kb = 0;
    if (!d.block && !d.low && !slab && !cave) { const NK = 6, yv = Math.min(d.top - (d.top < 120 ? Math.max(8, 0.2 * d.top) : 0), 78), bq = bb ?? 0.145 + 0.115 * hsh(k * 17 + 5, j + 3); ky = new Float64Array(NK + 1); kv = new Float64Array(NK + 1); ks = new Uint8Array(NK + 1);
      let up = hsh(k * 43 + j, 301) > 0.5;
      for (let i = 1; i <= NK; i++) { ky[i] = i === NK ? yv : yv * (i + 0.5 * (hsh(k * 41 + j, i + 300) - 0.5)) / NK; const dy = ky[i] - ky[i - 1];
        if (up) { kv[i] = kv[i - 1] + KNEE_U * (1.1 + 0.9 * hsh(k * 47 + j, i + 310)); ks[i - 1] = 1; } else kv[i] = Math.max(0, kv[i - 1] - dy * (bq + 0.06)); up = !up; if (kv[i] > kmax) kmax = kv[i]; }
      kb = Math.min(bq - 0.03, 0.8 * kv[NK] / yv); }
    const rec = 0.01 + kmax + (kv ? 2.2 : 0) + bendMax + st.reduce((m, q) => m + q[1], 0) + (gu ? gu[3] : 0) + (!d.block && !slab ? 3.2 : 0) + (slab ? 13.5 : d.block ? 1.0 : 2.2) + (cave ? 8 : 0);     // the most this face is ever cut back from its plane
    return { j, gu, rec, ky, kv, ks, nx: Math.sin(A), nz: Math.cos(A), tx: Math.cos(A), tz: -Math.sin(A), a0, b: d.block ? 0 : (bb ?? 0.145 + 0.115 * hsh(k * 17 + 5, j + 3)) - kb, st, slab, cave, sl: d.sl * (j % 2 ? -1 : 1) * (0.7 + 0.6 * hsh(k + 3, j + 20)),
      // A FALLEN BLOCK IS A SLANTING BEDDED SLAB, no round-topped lump: its faces turned down the beds' dip close as its top bed (from a fifth of its height at that edge up across the
      // whole block, 12 to 45 degrees by its own breadth and height), the others stand steep and lean (46 to 65 degrees); its top is where that bed ends (found below: no level cut)
      T: d.block ? BT : d.top + (j === k % d.f.length ? 0 : 3 * hsh(k * 3 + 1, j + 40)),
      g: d.block ? a0 / (BT * (-(Math.sin(A) * BED_U[0] + Math.cos(A) * BED_U[1]) > BLOCK_DIP[k] ? 0.9 + 0.1 * hsh(k * 3 + 2, j + 50) : 0.72 + 0.28 * hsh(k * 3 + 2, j + 50))) : (d.g0 ?? 0.45) + (d.g1 ?? 0.85) * hsh(k * 3 + 2, j + 50), ap: (d.ap ?? 0) * (0.4 + 1.2 * hsh(k + 60, j)) };
  });
  // a face's offset from the tower's leaning axis at a height and a place along the face
  let EXY = NaN, EXV = 0;     // the apron's exponential at the height last asked (the same value, made once for the faces asked at one height)
  const off = (f, y, t) => { METER += 0.17; const yy = y - f.sl * t; if (y < 20 && y !== EXY) { EXY = y; EXV = Math.exp(-Math.max(y, 0) / 4.5); } let a = f.a0 - f.b * Math.max(y, 0) + (y < 20 ? f.ap * EXV : 0);
    for (let i = 0; i < f.st.length; i++) { const q = f.st[i]; if (yy <= q[0]) break; a -= yy - q[0] >= 4 ? q[1] : q[1] * sst(0, 4, yy - q[0]); }
    if (f.kv && y > ycCh - 4) { const u = Math.min(1, (y - ycCh + 4) / 4); a -= 2.2 * u * u; }     // a lesser body's wall lies back over its last 4 m under its head (2.2 m, more and more): no corner where the wall ends
    if (bend && y > 0) { const by = bend.y, n = bend.n; if (y >= by[n]) a += f.nx * bend.x[n] + f.nz * bend.z[n]; else { let i = 0; while (y > by[i + 1]) i++; const fr = (y - by[i]) / (by[i + 1] - by[i]); a += f.nx * (bend.x[i] + (bend.x[i + 1] - bend.x[i]) * fr) + f.nz * (bend.z[i] + (bend.z[i + 1] - bend.z[i]) * fr); } }     // the body's bend
    if (f.kv && y > 0) { const ky = f.ky, yk = y - 0.07 * f.sl * t; if (yk >= ky[6]) a -= f.kv[6]; else if (yk > 0) { let i = 0; while (yk > ky[i + 1]) i++; const fr = (yk - ky[i]) / (ky[i + 1] - ky[i]); a -= f.kv[i] + (f.kv[i + 1] - f.kv[i]) * (f.ks[i] ? (fr >= 0.35 ? 1 : sst(0, 0.35, fr)) : fr); } }     // the face's knees
    if (f.gu && y > 3) { const u1 = (t - f.gu[0] - f.gu[1] * y) / f.gu[2], g1 = 1 / (1 + u1 * u1); a -= f.gu[3] * (y < 14 ? sst(3, 14, y) : 1) * g1 * g1; }
    if (!d.block && !f.slab && y > 4) a -= 1.6 * (y < 14 ? sst(4, 14, y) : 1) * (1 + Math.sin(0.085 * t + 0.045 * y + 1.7 * f.j + k) * Math.sin(0.06 * y - 0.03 * t + f.j));     // NO FACE IS A CUT SLAB: every face but the great slab is hollowed by its own slow swell (0 to 3.2 m, 70 to 100 m long), never proud of its plane, so its arrises wander; nothing of it under 4 m (the feet keep their plane)
    if (f.slab) { const ed = sst(-29.5 + 0.108 * y, -20.5 + 0.108 * y, t);     // NO DARK NOTCH ON THE SLAB'S EDGE: toward its arris with the next face (9 m of it) the slab's ledge and beds die out, so the arris is one wandering line and no bed's end stands on it as a dark notch
      a -= 3.5 * ed * sst(-1.2, 4.2, y - (52 + 0.25 * t));     // the one slanting ledge: a step with its own shadow (its riser 5.4 m high: broader than the skin's rows, so no teeth stand along it)
      const hc = 26 * sst(-8, -22, t); if (y < hc) a -= 5 * (1 - sst(hc - 4, hc, y));     // the corner fallen at its foot, toward the gully
      if (y < SLAB_Y1 + 2) a -= Math.max(0, 1 - (t / 27) * (t / 27)) * (1 - sst(SLAB_Y1 - 8, SLAB_Y1 + 2, y));
      // THE GREAT SLAB SHOWS ITS BEDS: the mountain's own beds cross it, thinner here (7 to 8 m each: ten and more between its foot and the cloud), each weathered back by its own depth
      // (to 1.8 m), each riser 3.2 m high (the skin's rows are 2 m apart), and the joints throw them aslant; NO SCAR (see below); A TALUS at its foot (a fan 12 m high where the plate fell)
      a -= 0.8 * ed * bedSlab(d.c[0] + d.lean[0] * y + f.nx * f.a0 + f.tx * t, y * 1.7, d.c[1] + d.lean[1] * y + f.nz * f.a0 + f.tz * t);
      // NO SCAR IS CUT IN THE SLAB: under the sun's own direction (which grazes this face at 24 degrees) a hollow where a plate came away is a dark closed shape with one bright edge. The slab
      // keeps its beds and its talus
      if (y < 12) a += 7 * (1 - Math.max(y, 0) / 12) * (1 - sst(7, 17, Math.abs(t - 9))); }
    else if (d.block) a -= 0.45 * bedSet(d.c[0] + f.nx * f.a0 + f.tx * t, y * 4, d.c[1] + f.nz * f.a0 + f.tz * t);     // a fallen block keeps its beds (3 m each, weathered back to a metre): no block is a plain folded prism
    else if (d.low) a -= (d.tall ? 0.3 * tallBeds(d.lean[0] * y + f.nx * f.a0 + f.tx * t, y, d.lean[1] * y + f.nz * f.a0 + f.tz * t, k) : 0.5 * bedSet(d.c[0] + d.lean[0] * y + f.nx * f.a0 + f.tx * t, y * 5, d.c[1] + d.lean[1] * y + f.nz * f.a0 + f.tz * t)) + (d.tall ? 0.16 : 0.45) /* a tall ledge's faces are its BEDS (each weathered back 0.3 m, proud ones between: no deeper, so no top bed is a cap over a dark slot) and no pleats: its swell is slight */ * (1 + Math.sin(t * 9 / f.a0 + 0.45 * y + 1.7 * f.j + k) * Math.sin(t * 3.7 / f.a0 - 0.3 * y + f.j));     /* the swell is two slanting waves of unlike length (no egg-box, no row of arches); A TALL LEDGE'S BEDS DIP AS THE MOUNTAIN'S (20 degrees, 2.6 m thick, broken at slanting joints: no level ruled lines round it) */     /* A LOW LEDGE'S FACES ARE BROKEN: beds 2.6 m thick (each weathered back to a metre) and a swell of its own along each face (a third of the face long): no face is one flat plane */
    else a -= bedBody(d.c[0] + d.lean[0] * y + f.nx * f.a0 + f.tx * t, y, d.c[1] + d.lean[1] * y + f.nz * f.a0 + f.tz * t);     // the beds, each weathered back by its own depth (a low ledge keeps the sharp beds: on a body 2 to 9 m high the broad riser would leave no bed at all; the mountain's bodies take the law their skin can show)
    if (f.cave) { const u = t - CAVE.t0, au = Math.abs(u);
      // NO CLOSED DARK SLIT ANYWHERE: THE CLEFT IS AN OPEN GULLY. It runs from 60 m up, under the cloud's foot, down to the foot, and FORKS at 30 m: two branches go down to the scree, one to
      // either hand. V-cut, open along its whole length and at its head: its floor takes the sun, one wall its own shade. Nothing in it. Its middle at 52.5 m is the named place (CAVE.mid).
      // THE GULLY NARROWS TO NOTHING: from 22 m up it grows shallower and narrower and is gone at 60 m (no tall dark slot between parallel lips, no cap over it); its middle wanders a metre or two
      // to either hand (no ruled sides)
      if (y > 2 && y < 60) { const yy = y, K = 1 - sst(22, 60, y), c0 = 0.12 * (yy - 52.5) + (1.2 * Math.sin(yy * 0.37 + 1) + 0.7 * Math.sin(yy * 0.83)) * sst(30, 40, y), dn = Math.max(0, 30 - yy), w = (3.2 + 1.4 * Math.sin(yy * 0.11) + 0.03 * yy) * (0.45 + 0.55 * K), dp = 8 * sst(2, 16, y) * K;
        const g1 = Math.max(0, 1 - Math.abs((u - c0 - 0.42 * dn) / w)), g2 = Math.max(0, 1 - Math.abs((u - c0 + 0.28 * dn) / w)) * (dn > 0 ? 0.8 : 1); a -= dp * Math.max(g1, g2); }
      if (y < 18 && au < 17) a += 12 * (1 - Math.max(y, 0) / 18) * (1 - sst(9, 17, au)); }     // the scree fan at the gully's foot
    if (head) return a; const cl = (f.T - y) * f.g; return cl < a ? cl : a; };
  // the wall's distance from the axis along a bearing at a height (the nearest face on that side; the place along the face is found, not guessed)
  const wallR = (b, y) => { const ux = Math.sin(b), uz = Math.cos(b); let r = 1e9;
    let n = 0; for (let j = 0; j < F.length; j++) { const f = F[j], dn = f.nx * ux + f.nz * uz; if (dn < 0.05) continue; const tu = (f.tx * ux + f.tz * uz) / dn, q = off(f, y, f.a0 * tu) / dn; QJ[n] = j; QT[n] = tu; QD[n] = dn; QV[n] = q; if (q < r) r = q; n++; }
    let best = 1e9; const lim = 1.6 * r + 2; for (let i = 0; i < n; i++) { if (QV[i] > lim) continue; const f = F[QJ[i]]; let q = off(f, y, QV[i] * QD[i] * QT[i]); q = off(f, y, q * QT[i]) / QD[i]; if (q < best) best = q; }
    return best < 1e9 ? best : r; };
  if (d.block) { let yT = 2.1 * d.top; const mr = (y) => { let m = 0; for (let i = 0; i < 12; i++) m = Math.max(m, wallR(i * Math.PI / 6, y)); return m; }; while (yT > 0.5 && mr(yT) < 0.25) yT -= 0.15; topE = yT + 0.15; }     // a block's top is where its top bed ends against its steep faces
  // the parting is where the body still has breadth: the highest height (a fifth under its plan top or lower) at which its narrowest wall
  // stands 5 m and more from its axis; the points are no higher than 1.8 times its mean breadth there; the body's top is the highest point
  if (head && d.low) { hd = d.tall ? 0.2 * d.top : Math.max(1.2, 0.35 * d.top); yc = d.top - hd; }
  else if (head) { const least = (y) => { let m = 1e9; for (let i = 0; i < 24; i++) m = Math.min(m, wallR(i * Math.PI / 12, y)); return m; };
    const lim = Math.min(5, 0.4 * d.f.reduce((m, q) => m + q[1], 0) / d.f.length), meanR = (y) => { let m = 0; for (let i = 0; i < 24; i++) m += Math.max(wallR(i * Math.PI / 12, y), 0) / 24; return m; }; while (yc > 0.35 * d.top && (least(yc) < 0.5 * lim || meanR(yc) < 1.3 * lim)) yc -= 2;     // breadth enough for a ridge: its narrowest wall 2.5 m out and its mean 6.5 m
    let mean = 0; for (let i = 0; i < 24; i++) mean += Math.max(wallR(i * Math.PI / 12, yc), 0) / 24; hd = Math.min(hd, d.plain ? Math.max(4, 0.72 * mean) : Math.max(5, 1.8 * mean));     /* a lesser body's ridge stands no higher over its wall than seven tenths of the wall's mean breadth there: no blade, no point */ topE = yc + hd; if (d.plain && !d.low) ycCh = yc; }
  // NO TOP IS A FLAT BED SEEN AS A FLAT LINE, AND NO HEAD STEPS: a lesser body of the mountain ends as A RIDGE THAT FALLS FROM ONE END TO THE OTHER: from the wall's top the head rises by a round
  // shoulder (no corner) to its highest near one end and falls all the way to the wall's top at the other, leaning to one side: no flat top, no level stretch, no square corner, no upright riser
  // (a riser near a top is a dark upright line). A low ledge's or a stack's head is its slanting bed (the beds' own dip), with no steps.
  const ridge = head && d.plain && !d.low, RGA = hsh(k, 91) * 2 * Math.PI, RGX = Math.sin(RGA), RGZ = Math.cos(RGA);
  let RGR = 1;     // the head's half breadth along the ridge's bearing
  // A LESSER BODY'S HEAD IS A BROKEN PEAK, no smooth dome: across a slanting
  // line of its own (35 to 60 degrees off its ridge, toward its low end) the head stands a fifth to three tenths lower, going down to it by a slope four tenths of the head's breadth long: one sunk shoulder (no dome, no upright slot, no level tread; by the count no corner under 110 degrees)
  const RBA = RGA + (hsh(k, 94) > 0.5 ? 1 : -1) * (0.6 + 0.45 * hsh(k, 96)), RBX = Math.sin(RBA), RBZ = Math.cos(RBA), RBO = 0.22 + 0.2 * hsh(k, 97), RBD = 0.19 + 0.12 * hsh(k, 98);
  let LU = 0, LS = BED_T;     // a tall ledge's bed: where its high end lies along the dip, and its slope
  const TSP = [0, 0, 0], TSD = [0, 0, 0];     // a tall ledge's three steps: how far down-dip from the high end, and how high
  let LSQ = 1;     // a low ledge's bed over the sea is pressed down by this share, so that its highest place is its plan top (see htop)
  const RSP = [0, 0, 0], RSD = [0, 0, 0]; let RSU = 0, RSS = 0, RSC = 3.3;     // a re-bedded body's top bed: its three steps (how far down-dip from the high end, and how high), where its high end lies along the dip, and its slope between the steps
  const RGK = -0.1 + 0.4 * hsh(k, 92), RGC = 0.7 * (hsh(k, 93) - 0.5);     // the ridge's knee (where along it) and its crest line (how far off the middle)
  const HK = [1, 0.8, 0.62, 0.47], RIM = new Float64Array(24);     // the points' heights over the bed, as shares of the highest: no single dominant point; the wall's distance round the head's foot
  const PK = [], hx0 = d.c[0] + d.lean[0] * yc, hz0 = d.c[1] + d.lean[1] * yc; let yl = d.top;
  if (head) { const n = d.plain ? 0 : 3 + Math.floor(2 * hsh(k, 61)), hi = n ? k % n : 0, low = !!d.low; let rm = 0;
    for (let i = 0; i < n; i++) { const be = (i + 0.6 * hsh(k * 3 + i, 63)) * 2 * Math.PI / n, rr = (0.5 + 0.3 * hsh(k * 5 + i, 65)) * Math.max(wallR(be, yc), 1); PK.push([rr * Math.sin(be), rr * Math.cos(be), yc + hd * HK[(i + n - hi) % n], low ? (d.top >= 6 ? 0.7 + 0.6 * hsh(k * 11 + i, 69) : 0.5 + 0.4 * hsh(k * 11 + i, 69)) : 1.4 + 0.8 * hsh(k * 11 + i, 69)]); }     // a low ledge's lumps are blunt (27 to 52 degrees)
    for (let i = 0; i < 24; i++) RIM[i] = Math.max(wallR(i * Math.PI / 12, yc), 0.5);
    if (d.tall) { let u0 = 1e9, u1 = -1e9; for (let i = 0; i < 24; i++) { const u = RIM[i] * (TALL_U[0] * Math.sin(i * Math.PI / 12) + TALL_U[1] * Math.cos(i * Math.PI / 12)); if (u < u0) u0 = u; if (u > u1) u1 = u; } LU = u1; LS = Math.min(TALL_S, 0.6 * d.top / Math.max(1, u1 - u0)); const L = u1 - u0, sh = [0.42, 0.33, 0.25], o = k % 3; TSP[0] = (0.46 + 0.1 * hsh(k, 131)) * L; TSP[1] = TSP[0] + (0.14 + 0.06 * hsh(k, 132)) * L; TSP[2] = TSP[1] + (0.12 + 0.05 * hsh(k, 133)) * L;     /* the steps lie in the bed's lower half: its upper half is one slanting plane from the high end (no step near it: no nub, no knob at the high end) */ for (let q = 0; q < 3; q++) TSD[q] = sh[(q + o) % 3] * 0.3 * LS * L; }     /* seven tenths of the fall is the bed's own slope, three tenths its three steps (no tall first step) */
    for (let i = 0; i < 24; i++) rm = Math.max(rm, wallR(i * Math.PI / 12, yc)); RGR = Math.max(rm, 1); yl = ridge ? yc - 0.2 * hd - 1 : yc - 0.3 * hd - BED_T * rm - 1.7; if (d.tall) yl = Math.min(yl, 0.4 * d.top - 2.6);
    if (d.steps) { let u0 = 1e9, u1 = -1e9; for (let i = 0; i < 24; i++) { const u = RIM[i] * (BED_U[0] * Math.sin(i * Math.PI / 12) + BED_U[1] * Math.cos(i * Math.PI / 12)); if (u < u0) u0 = u; if (u > u1) u1 = u; }
      const L = u1 - u0, FT = Math.min(0.75 * L, 0.34 * d.top), sh = [0.42, 0.33, 0.25], o = k % 3; RSU = u0; RSS = 0.75 * FT / L; RSC = Math.min(1, 0.05 * L);     /* three quarters of the fall is the bed's own slope, a quarter its three steps; the high end's corner is broken off by a metre at most */ RSP[0] = (0.46 + 0.1 * hsh(k, 121)) * L; RSP[1] = RSP[0] + (0.14 + 0.06 * hsh(k, 122)) * L; RSP[2] = RSP[1] + (0.12 + 0.05 * hsh(k, 123)) * L;     /* the steps lie in the bed's lower half: its upper half is one slanting plane from the high end (no knob there) */
      for (let q = 0; q < 3; q++) RSD[q] = sh[(q + o) % 3] * 0.25 * FT; yl = Math.min(yl, topE - FT - 3.4); } }
  const lowBed = head && d.low && !d.tall;
  // the head's top at a place (metres from the axis at the head's foot): the rough bed it parted on and the unequal points left standing on it
  const htop = (qx, qz) => { METER += 0.06;
    if (ridge) { const rq = Math.hypot(qx, qz); let an = Math.atan2(qx, qz) * 3.819718634; if (an < 0) an += 24; const i0 = Math.floor(an) % 24, fr = an - Math.floor(an), rho = rq / (RIM[i0] + (RIM[(i0 + 1) % 24] - RIM[i0]) * fr), rr = rho * rho;
      const sa = Math.max(-1, Math.min(1, (qx * RGX + qz * RGZ) / RGR)), sc = Math.max(-1, Math.min(1, (qx * RGZ - qz * RGX) / RGR));
      // THE RIGHT-HAND BODIES (R1, and R2 and R3 of the same outline beside the line) ARE BEDDED TO THEIR TOPS (the owner's gate: no hooded figure, no head and shoulders): no head stands on a
      // level wall top and no cap lies over it. The body's top is ONE SLANTING BROKEN EDGE OF ITS BEDS that
      // cuts the wall itself: highest at its END against the mountain (the plan top), going down toward the line by a slope and THREE UNEQUAL STEPS (slanting risers 2.4 m broad, wandering across the bed) to a low end a
      // half of the body's breadth or more under the high one (by count R1 14.3 m, R2 11.3 m, R3 13.0 m), tilted a little to one hand: NO DOME, NO NECK, NO PAIR OF LIKE SHOULDERS, no level rim, no leaning side over the wall
      if (d.steps) { const u = BED_U[0] * qx + BED_U[1] * qz, w = BED_U[1] * qx - BED_U[0] * qz, sdn = u - RSU;     /* THE HIGH END IS THE ONE AGAINST THE MOUNTAIN: the bed goes down toward the line, so from the line the body is a stepped ramp leaning on the mass behind it, no head over a body */     /* no leaning side over a level wall top (no cap on a column): over its foot the body's wall goes straight up to the bed, so the body's top edge IS the bed's slanting stepped edge all the way round */
        const e1 = RSP[0] + 0.2 * w + 0.5 * Math.sin(w * 0.5 + k), e2 = RSP[1] - 0.15 * w + 0.5 * Math.sin(w * 0.4 + 2 * k), e3 = RSP[2] + 0.11 * w + 0.5 * Math.sin(w * 0.45 + 3 * k);
        const h = topE - 0.3 - RSS * sdn - RSD[0] * sst(e1 - 1.2, e1 + 1.2, sdn) - RSD[1] * sst(e2 - 1.2, e2 + 1.2, sdn) - RSD[2] * sst(e3 - 1.2, e3 + 1.2, sdn) - 0.05 * (w + RGR) + 0.15 * Math.sin(qx * 0.9 + k) * Math.sin(qz * 0.7 + 2 * k);
        const ch = topE - RSC + sdn; return ch < h ? ch : h; }     // its high end's corner is broken off slanting (a metre at most)
      if (rho >= 1) return yc + 0.5 + 3 * (rq / rho - rq);     // beyond the wall's top the head's side leans in as every head's (72 degrees)
      const nt = (sa - RGK - 0.25) * 6, fall = (1 - 0.3 * (sa + 1) - 0.25 * Math.max(0, sa - RGK)) * (1 - 0.16 / (1 + nt * nt)), lean = 1 - (sc > RGC ? 0.75 : 0.35) * Math.abs(sc - RGC);     // the crest falls from the high end (then steeper beyond its one knee, with one shallow saddle past it: a broken ridge); across, the head leans: one slope twice as steep as the other about a crest line off its middle
      const bs = (qx * RBX + qz * RBZ) / RGR - RBO, brk = 1 - RBD * (bs <= -0.4 ? 0 : bs >= 0.4 ? 1 : sst(-0.4, 0.4, bs));
      return yc + 0.5 + (1.05 * hd * fall * lean * brk + 0.04 * hd * Math.sin(qx * 0.9 + k) * Math.sin(qz * 0.7 + 2 * k)) * (1 - rr * Math.sqrt(Math.sqrt(rr))); }     // round at the wall's top all the way round (1 - rho^2.5): the wall goes over into the head by a broad shoulder, never by a corner
    // A LOW LEDGE'S BED STANDS NO HIGHER THAN ITS PLAN TOP (no tent: no level wall with a roof rising inside it): what of its bed stands over the sea (over 0.9 m) is pressed down by one share
    // (LSQ) so that its highest place is its plan top; where it goes under the sea it keeps its own slope (the ledge's plan over the sea, its place and its air are its plan's). The head's leaning
    // side over the wall's top is a metre or two at the high end: no roof
    let h = yc - 0.3 * hd + BED_T * (BED_U[0] * qx + BED_U[1] * qz) + (d.low ? 0.4 : 1.2) * Math.sin(qx * 0.9 + k) * Math.sin(qz * 0.7 + 2 * k);
    // A TALL LEDGE OF THE TAIL IS ONE SLANTING BEDDED SLAB: its top is one bed that goes down from its plan top at the high end along the
    // dip of its own stone (it rises toward the way out, 27 degrees at most, its low end at four tenths of its height and more), broken in unequal benches (0.45 m each, 4 to 12 m apart, their risers wandering):
    // no smooth humps, no level top; from the line its outline is a wedge, high at one end
    // A TALL LEDGE'S TOP IS ONE SLANTING BROKEN EDGE OF ITS BEDS (the owner's gate: no draped figure, no rounded crest that could be a head),
    // HIGHEST AT ONE END: from its up-dip end the bed goes down the other way by a gentle slope and THREE UNEQUAL STEPS (each a slanting riser 0.6 m broad, wandering across the bed; their places and
    // heights the ledge's own): no dome, no neck, no pair of like shoulders, no round shoulder where the bed meets the leaning side (an edge)
    if (d.tall) { const u = TALL_U[0] * qx + TALL_U[1] * qz, w = TALL_U[1] * qx - TALL_U[0] * qz, sdn = LU - u;
      const e1 = TSP[0] + 0.22 * w + 0.3 * Math.sin(w * 0.8 + k), e2 = TSP[1] - 0.16 * w + 0.3 * Math.sin(w * 0.6 + 2 * k), e3 = TSP[2] + 0.12 * w + 0.3 * Math.sin(w * 0.7 + 3 * k);
      h = d.top - 0.7 - 0.7 * LS * sdn - TSD[0] * sst(e1 - 0.3, e1 + 0.3, sdn) - TSD[1] * sst(e2 - 0.3, e2 + 0.3, sdn) - TSD[2] * sst(e3 - 0.3, e3 + 0.3, sdn) + 0.12 * Math.sin(qx * 0.9 + k) * Math.sin(qz * 0.7 + 2 * k); }
    // A LEDGE'S TOP IS BROKEN BEDS, AND NO BLACK STRIP TRAILS FROM IT: its slanting top goes up in unequal benches (a third of a metre each, 2 to 6 m apart),
    // and its low end does not thin away into the sea as a wet wedge: where the bed comes down to 0.9 m over the still water it breaks off by a steep little face (80 degrees) that goes under
    if (d.low && !d.tall) { const u = BED_U[0] * qx + BED_U[1] * qz, w = BED_U[1] * qx - BED_U[0] * qz, v = (Math.sin(u * 0.45 + 1.7 * k) + 0.5 * Math.sin(u * 0.17 + 0.3 * w + 2.3 * k)) * 1.3, fl = Math.floor(v); h += 0.35 * (fl + sst(0.3, 0.7, v - fl)); if (h < 0.9) h -= 6 * (0.9 - h);
      // A LOW LEDGE IS BROKEN ROCK, NO BAR: what of it stands over the sea goes up and down
      // along and across its bed in unequal humps and saddles (5 to 11 m apart, a saddle down to four tenths of the hump beside it): no level top line; its plan over the sea, its place and its air are its plan's
      else { const lp = 0.5 + 0.5 * Math.sin(u * 0.62 + 1.3 * k + 1.2 * Math.sin(w * 0.45 + 0.7 * k)) * Math.sin(w * 0.38 + 2.1 * k + 0.9 * Math.sin(u * 0.29 + k)); h = 0.9 + LSQ * (h - 0.9) * (0.4 + 0.6 * lp); } }     // unequal benches (a third of a metre each, 2 to 6 m apart, their risers wandering: no even treads, no stair)
    for (let i = 0; i < PK.length; i++) { const p = PK[i], v = p[2] - p[3] * Math.hypot(qx - p[0], qz - p[1]); if (v > h) h = v; }
    // the head's own sides lean in (72 degrees) from the wall at its foot: a point near the wall is not cut plumb
    const rq = Math.hypot(qx, qz); if (rq > 0.5) { let an = Math.atan2(qx, qz) * 3.819718634; if (an < 0) an += 24; const i0 = Math.floor(an) % 24, fr = an - Math.floor(an), lim = yc + 0.5 + 3 * (RIM[i0] + (RIM[(i0 + 1) % 24] - RIM[i0]) * fr - rq);
      if (lim < h) h = lim; }     // no round shoulder on a tall ledge: its bed and its leaning side meet by an edge (no round shoulder that could be a head)
    return h; };
  if (lowBed) { let m = -1e9; for (let i = 0; i < 24; i++) for (let q = 1; q > 0.05; q -= 0.19) { const v = htop(q * RIM[i] * Math.sin(i * Math.PI / 12), q * RIM[i] * Math.cos(i * Math.PI / 12)); if (v > m) m = v; } LSQ = Math.min(1, (d.top - 0.95) / Math.max(0.1, m - 0.9)); }
  const radius = (b, y) => { if (!head || y <= yl) return wallR(b, y); const yw = Math.min(y, yc), r = wallR(b, yw); if (r <= 0) return r; const ux = Math.sin(b), uz = Math.cos(b), ox = d.lean[0] * (yw - yc), oz = d.lean[1] * (yw - yc);
    for (let s = 1; s > 0.04; s -= 0.08) if (htop(ox + s * r * ux, oz + s * r * uz) > y) return s * r; return 0.02; };
  // a vertex of the head's skin: s = 1 on the wall where the head's top meets it, s toward 0 at the axis
  const capVertex = (b, s, p) => { METER += 6; const ux = Math.sin(b), uz = Math.cos(b); let y = yc, qx = 0, qz = 0;
    for (let i = 0; i < 6; i++) { const yw = Math.min(y, yc), r = Math.max(wallR(b, yw), 0.05); qx = d.lean[0] * (yw - yc) + r * ux; qz = d.lean[1] * (yw - yc) + r * uz; y = Math.min(d.low ? yc + 0.5 : topE, Math.max(yl, htop(qx, qz))); }     /* a ledge's wall ends where its head's leaning side begins (half a metre over the head's foot) and no higher: a wall standing inside the head's round would go up to the bed as a thin spike */
    qx *= s; qz *= s; p[0] = hx0 + qx; p[1] = s === 1 ? y : htop(qx, qz); p[2] = hz0 + qz; };
  let R = 0; for (let i = 0; i < 90; i++) R = Math.max(R, radius(i * Math.PI / 45, 0)); R += 2.5 + bendMax;     /* 90 bearings: a prism's corner between two of them is nearer than this by less than a hundredth; the bound keeps its 2.5 m */ const R2 = R * R, cx = d.c[0], cz = d.c[1], lx = d.lean[0], lz = d.lean[1], top = topE;
  const inside = (x, y, z) => { if (y >= top || y < -10) return false; const yw = head && y > yc ? yc : y, qx = x - cx - lx * yw, qz = z - cz - lz * yw; if (qx * qx + qz * qz > R2) return false; METER += 0.3;
    if (head && y > yl && y >= htop(x - hx0, z - hz0)) return false;
    // the same answer with far fewer calls of the face's law: a face's offset is never more than its plane with its apron (and the scree fan), and never less
    // than that less its whole recess (rec: its steps, gully, swell, beds or slab's cuts, the cleft); only between the two is the law itself asked
    const ym = yw > 0 ? yw : 0, ex = yw < 20 ? Math.exp(-ym / 4.5) : 0;
    for (let j = 0; j < F.length; j++) { const f = F[j], dq = f.nx * qx + f.nz * qz, base = f.a0 - f.b * ym + (yw < 20 ? f.ap * ex : 0);
      if (dq > base + bendMax + (f.cave && yw < 18 ? 12 : f.slab && yw < 12 ? 7 : 0)) return false;
      if (dq <= base - f.rec && (head || dq <= (f.T - yw) * f.g)) continue;
      if (dq > off(f, yw, f.tx * qx + f.tz * qz)) return false; } return true; };
  // its reach to either side of the sun's shadow axis (low and at seven tenths of its height), for its shadow on the sea
  const half = (y) => { let w = 0; for (let i = 0; i < 45; i++) { const b = i * Math.PI / 22.5, r = Math.max(radius(b, y), 0); w = Math.max(w, Math.abs(r * (Math.sin(b) * SH_P[0] + Math.cos(b) * SH_P[1]))); } return w; };
  const w0 = half(8), w1 = half(0.7 * top);
  return { ...d, top: topE, planTop: d.top, k, F, off, radius, inside, bound: head ? [[cx, cz, lx, lz, R2, Math.min(top, yc), -10], [cx + lx * yc, cz + lz * yc, 0, 0, R2, top, yc]] : [[cx, cz, lx, lz, R2, top, -10]] /* its inside's own first bound, for marchMeets: under its head's foot about the leaning axis, over it about the axis's place there */, R, w0, wk: 1 - w1 / w0, lp: lx * SH_P[0] + lz * SH_P[1], head: head ? { yl, yc, vertex: capVertex, top: htop, points: PK } : null };
}
export let MASSIF = null;     // the bodies are made in prepareBodies (the build's first step), with an ask after each: the module's own evaluation makes none
// the fallen blocks and fangs awash about every foot and in the gaps between the bodies: low leaning prisms of the same law
export let BLOCKS = null;
const makeBlocks = () => { const out = [];
  const put = (x, z, r, top, i) => { if (x + 1.15 * r > -43.5 || x - 1.15 * r < -186 || z + 1.15 * r > -126) return; /* none nearer the line than the walls; none beyond the mountain's own foot to port or toward the entry */ for (const t of MASSIF) if (t.inside(x, 1, z) && t.inside(x, Math.min(top + 2, 12), z)) return;
    const n = 5 + Math.floor(3 * hsh(i, 9)) /* NO FALLEN BLOCK IS SQUARED (the owner's gate: no cut steps, no landing): five to seven unequal faces (a four-faced one is a square), and NO LEVEL TOP: every face of a block goes in to ONE height of its own block (see BT in mkTower), the down-dip faces as one slanting bed from the foot, the others from two tenths to six tenths of the way up: a broken slanting block, no level cut at its top */, a0 = hsh(i, 11) * 360, f = []; for (let j = 0; j < n; j++) { const A = a0 + (j + 0.7 * hsh(i * 3 + j, 13)) * 360 / n, cd = -(Math.sin(A * Math.PI / 180) * BED_U[0] + Math.cos(A * Math.PI / 180) * BED_U[1]); f.push([A, r * (0.65 + 0.5 * hsh(i * 5 + j, 17)) * (0.6 + 0.4 * cd)]); }     /* A TILTED BROKEN SLAB, NO PYRAMID, NO BOX: a block's faces turned up the dip stand a fifth as far from its axis as those turned down it, so its highest place is a corner at its up-dip edge and its top is one slanting bed that goes down the dip to the sea; its sides lean in from the foot (no upright wall under a roof) */
    out.push(() => mkTower(100 + i, { name: 'b' + i, c: [x, z], top, lean: [0.5 * (hsh(i, 21) - 0.5), 0.5 * (hsh(i, 23) - 0.5)], sl: 0, ap: 0, block: true, g0: 1.1, g1: 1.6, f }));     /* dealt here, made one by one in prepareBodies (the same blocks in the same order) */     /* low broken blocks, none stands as a point; their faces' closing is the tilted slab's law in mkTower (BT) */ };
  let i = 0;
  for (const t of MASSIF) { const n = Math.round(t.R / 7); for (let q = 0; q < n; q++, i++) { const b = (q + hsh(i, 1)) * 2 * Math.PI / n, fang = false, r = fang ? 2 + 2.5 * hsh(i, 3) : 3 + 6 * hsh(i, 3), d = Math.max(t.radius(b, 0), 2) + (hsh(i, 7) * 8 - 2.5);
    put(t.c[0] + d * Math.sin(b), t.c[1] + d * Math.cos(b), r, fang ? 6 + 8 * hsh(i, 2) : 1.2 + 4.3 * hsh(i, 2) * hsh(i, 2), i); } }
  // the scree between feet: larger low blocks along the lines that join neighbouring bodies
  for (const [a, b] of [[0, 4], [4, 3], [3, 6], [0, 2], [2, 1], [1, 5], [0, 1]]) for (let q = 1; q <= 2; q++, i++) { const A = MASSIF[a].c, B = MASSIF[b].c, s = q / 4 + 0.12 * (hsh(i, 31) - 0.5);
    put(A[0] + (B[0] - A[0]) * s + 9 * (hsh(i, 33) - 0.5), A[1] + (B[1] - A[1]) * s + 9 * (hsh(i, 35) - 0.5), 4 + 7 * hsh(i, 37), 1.5 + 5 * hsh(i, 39) * hsh(i, 39), i); }
  // the slab's fallen corner lies at its foot: one great block
  { const A = 35 * D2R17; put(-86 + 22 * Math.sin(A) - 19 * Math.cos(A) + 7 * Math.sin(A), -196 + 22 * Math.cos(A) + 19 * Math.sin(A) + 7 * Math.cos(A), 7.5, 9, i++); }
  return out; };
// THE SKERRIES BESIDE THE WAY IN AND THE SPUR: LOW LEDGES of the mountain's own stone, each longer than it is high (mkSkerry below), as high as its plan. Given as places [x, z, height, breadth];
// by the count of the line (the row's number first; she comes in from the east-north-east down the lane of light and passes BETWEEN them):
//   10, 11, 13, 3, 12 THE FIVE WET RAMPS TO STARBOARD OF THE WAY IN (SHOAL_RAMPS): each a ledge whose top is ONE BEDDING PLANE rising with the beds' dip (SHOAL_DIP) to a broken scarp at its high end, long
//      along the dip; abeam at the line's metres 66, 91, 126, 127 and 149; 3 to 4.6 m high; their stone nearest the lens 18.2, 13.1, 28.4, 12.7 and 13.5 m; the least air to her whole breadth 13.5, 8.3,
//      23.8, 7.9 and 8.5 m;
//   0, 1, 2 THREE LOW HUMPS TO PORT OF IT, AWASH (2.2 to 2.4 m: lower than the eye): their stone nearest the lens 14.5, 13.6 and 39.1 m; the least air to her whole breadth 9.7, 7.8 and 32.5 m;
//   4, 5, 6, 7, 9 THE SPUR: five ledges from beside the way in back to the mountain's foot (45 m and more from her; rows 4 and 5 are 5 m high: humps of the one law, no stepped stack, see makeFang);
//   8 ONE FAR TO PORT, WEST OF THE MOUNTAIN'S SOUTH BODY (-112, -322): more than 60 m from the line.
// THE LEDGES ARE LAID BY HAND (said in the open here and in the world's head): each is a typed place, height and breadth, laid so that they are seen well from the way in, for its whole stretch and
// every seed; one of them (row 8) stood at (-104, -352), where, as the way turns onto the sun (about the metre 343, the look dead ahead), it bore 47 degrees to port of the bow, 80 m off: on the very rim of what the look ahead holds, a low bar half within it; it was moved 30 m north to (-112, -322), where through that turn it bears 67 degrees and more to port, wholly aside of the look ahead. Typed with them: the beds' one dip (SHOAL_DIP: the ramps' tops lean toward the way and catch the low sky) and which
// ledges are ramps (SHOAL_RAMPS). Nothing is placed for a still, a seed or the lens: places in the world.
export const FANG_AT = [[25.2, -85.8, 2.2, 8], [10.0, -105.4, 2.3, 6.5], [-18.5, -100.0, 2.4, 6], [27.0, -145.9, 4.6, 9], [-22.6, -87.4, 5, 7], [-40, -103, 5, 11], [-66, -118, 7, 12], [-93, -121.5, 4, 13], [-112, -322, 4, 7], [-124, -131, 5, 12], [68.3, -100.6, 3.5, 7], [47.9, -116.3, 3.3, 6.5], [15.7, -158.6, 3.0, 6], [47.4, -139.4, 3.2, 6]];
// ---- A LOW LEDGE IS DIPPING BEDS WORN DOWN BY THE SEA (no blocky log, no ruled side, no stair, no grid). The shoal's and the
// spur's low ledges are each one worn hump of the bedded stone (an outline of its own, bitten and roughened; humps and saddles along it; its skirt going under the sea all round), and the beds show in
// it as they do in such stone: each harder bed stands out as A SLANTING WET RAMP (its own upper face, rising with the dip) that ends up-dip in a low broken scarp (the bed's broken edge, 0.3 to 1.1 m,
// steep but not plumb), and the scarps wander across the ledge as the hump's own shape cuts the beds: no level line, no ruled side, no step square to another. One law (the body's own number: no draw
// of the seed, nothing of the lens) answers the skin, the shade and the counts.
//   d: c (its middle on the sea), top (its highest place), L and S (half length, half breadth), az (its length's bearing), dipAz and dip (the bearing the beds rise toward, their slope), T (a bed's thickness, least and most)
function mkSkerry(k, d) {
  const AZ = d.az * D2R17, DA = d.dipAz * D2R17, ux = Math.sin(DA), uz = Math.cos(DA), dp = d.dip, cx = d.c[0], cz = d.c[1], NB = 720;
  const E = (a) => { const c = Math.cos(a - AZ), s = Math.sin(a - AZ); return 1 / Math.sqrt(c * c / (d.L * d.L) + s * s / (d.S * d.S)); };
  const per = Math.PI * (3 * (d.L + d.S) - Math.sqrt((3 * d.L + d.S) * (d.L + 3 * d.S))), mPh = per / TAU, wrap = (a) => a - TAU * Math.round(a / TAU);
  const ring = (ph, n, sd) => { let q = ph / TAU * n; q -= Math.floor(q / n) * n; const i0 = Math.floor(q), fr = q - i0, s = fr * fr * (3 - 2 * fr); return hsh(i0 % n, sd) + (hsh((i0 + 1) % n, sd) - hsh(i0 % n, sd)) * s - 0.5; };
  const n1 = Math.max(4, Math.round(per / 6)), n2 = Math.max(9, Math.round(per / 2.2)), bites = []; for (let j = 0; j < 3; j++) bites.push([TAU * (j + 0.8 * hsh(k * 41 + j, 663)) / 3, (1.5 + 2.5 * hsh(k * 43 + j, 665)) / mPh, 0.14 + 0.2 * hsh(k * 47 + j, 667)]);
  const OUT = new Float32Array(NB); for (let q = 0; q < NB; q++) { const b = q * TAU / NB, ph = Math.atan2(d.L * Math.sin(b - AZ), d.S * Math.cos(b - AZ)); let r = E(b) * (1 + 0.3 * ring(ph, n1, k * 53 + 671) + 0.12 * ring(ph, n2, k * 59 + 673));
    for (const bt of bites) { const u = Math.abs(wrap(ph - bt[0])) / bt[1]; if (u < 1) r *= 1 - bt[2] * (1 - u * u); } OUT[q] = r; }
  const Rout = (b) => { let q = b * NB / TAU; q -= Math.floor(q / NB) * NB; const q0 = Math.floor(q), fr = q - q0; return OUT[q0 % NB] + (OUT[(q0 + 1) % NB] - OUT[q0 % NB]) * fr; };
  let R = 0; for (let q = 0; q < NB; q++) R = Math.max(R, OUT[q]); R += 0.5; const R2 = R * R;
  // the beds' levels in the stone (a height in the stone's own stack: the height less the dip's rise), of unequal thickness
  const BL = [-12]; for (let n = 0; BL[n] < 16; n++) { const h = hsh(k * 3 + n, 681); BL.push(BL[n] + d.T[0] + (d.T[1] - d.T[0]) * h * h); }
  const terr = (s) => { let n = 0; while (BL[n + 1] <= s) n++; const T = BL[n + 1] - BL[n], fr = (s - BL[n]) / T; return BL[n] + T * (fr <= 0.78 ? 0 : sst(0.78, 1, fr)); };     // a bed worn back to the one under it, its broken edge standing over the last fifth of its thickness
  // the joints: two sets of breaks across the ledge (one all but along the beds' strike, one aslant to it), 4 to 8 m apart, wandering, some open as a cleft half a metre deep and more, some closed
  const JA = [DA + 1.75 + 0.3 * (hsh(k, 691) - 0.5), DA + 0.45 + 0.4 * (hsh(k, 693) - 0.5)], JS = [5.5 + 2.5 * hsh(k, 695), 4.5 + 2.5 * hsh(k, 697)];
  const hwOf = (sc) => Math.ceil(sc * R) + 3, G699 = hashGrid(699, k + 4.5, 1.6, hwOf(0.21) + 6, hwOf(0.21) + 3), G683 = hashGrid(683, 3.1 * k, 1.7 * k, hwOf(0.16), hwOf(0.16)), G685 = hashGrid(685, 5.3 * k, 2.9 * k, hwOf(0.4), hwOf(0.4)), G684 = hashGrid(684, 2.3 * k, 6.1 * k, hwOf(0.27), hwOf(0.27)), G687 = hashGrid(687, 7.7 * k, 4.1 * k, hwOf(0.55), hwOf(0.55)), G689 = hashGrid(689, 0, 0, hwOf(2.3), hwOf(2.3)), CJ = [hsh(k, 701), hsh(k, 702)];     // the ledge's lattice hashes, each taken once
  const cleft = (qx, qz) => { let g = 0; for (let j = 0; j < 2; j++) { const t = (qx * Math.sin(JA[j]) + qz * Math.cos(JA[j]) + 1.6 * (n2dOf(qx * 0.21 + 9.1 * j + k, qz * 0.21 + 3.3 * j, G699) - 0.5)) / JS[j] + CJ[j], c = Math.floor(t), dist = Math.abs(t - c - 0.5) * JS[j], h = hsh(c + 31 * j, k + 703);
      if (dist < 0.6 && h > 0.25) { const v = (0.25 + 0.75 * h) * (d.cleft ?? 0.9) * (1 - dist / 0.6); if (v > g) g = v; } } return g; };
  let KF = 1, uHi = 0; if (d.ramp) for (let q = 0; q < NB; q += 4) { const b = q * TAU / NB, r = 0.9 * OUT[q]; uHi = Math.max(uHi, r * (Math.sin(b) * ux + Math.cos(b) * uz)); }     // a ramp's highest reach up the dip (nine tenths of its outline)
  const yAt = (qx, qz, rho) => { METER += 0.7; const lump = 0.6 * n2dOf(qx * 0.16 + 3.1 * k, qz * 0.16 + 1.7 * k, G683) + 0.4 * n2dOf(qx * 0.4 + 5.3 * k, qz * 0.4 + 2.9 * k, G685), rdg = 1 - Math.abs(2 * n2dOf(qx * 0.27 + 2.3 * k, qz * 0.27 + 6.1 * k, G684) - 1);
    const u = qx * ux + qz * uz, H = d.top * (0.3 + 0.75 * lump + 0.3 * rdg * rdg), r2 = rho * rho; let e = H * (1 - r2 * r2) - 4.2 * sst(0.86, 1, rho);
    if (d.ramp) e = Math.min(1.7 * d.top * (1 - r2 * r2) - 4.2 * sst(0.86, 1, rho), d.top + dp * (u - uHi) + d.top * (0.5 * (lump - 0.5) + 0.3 * (rdg - 0.5)));     // A WET RAMP: the ledge's top is one bedding plane (and the bed or two its humps cut into), rising with the dip from the sea at its low end to its broken high end
    if (e < -2.5) return e;
    const wob = 0.3 * (n2dOf(qx * 0.55 + 7.7 * k, qz * 0.55 + 4.1 * k, G687) - 0.5), y = dp * u + wob + terr(e - dp * u - wob) - cleft(qx, qz) + 0.05 * (n2dOf(qx * 2.3, qz * 2.3, G689) - 0.5), v = e < -1 ? e + (y - e) * sst(-2.5, -1, e) : y;
    return v > 0 ? v * KF : v; };
  const yOf = (qx, qz) => { const r2 = qx * qx + qz * qz; if (r2 > R2) return -1e9; const r = Math.sqrt(r2), ro = Rout(Math.atan2(qx, qz)); return r >= ro ? -1e9 : yAt(qx, qz, r / ro); };
  { let m = 0.1; for (let b = 0; b < 48; b++) for (let f = 0.05; f < 0.95; f += 0.06) { const bb = b * TAU / 48, r = f * Rout(bb), v = yAt(r * Math.sin(bb), r * Math.cos(bb), f); if (v > m) m = v; } KF = d.top / m; }     // its highest place is its plan's top
  const inside = (x, y, z) => y <= d.top && y > -10 && y <= yOf(x - cx, z - cz);
  const radius = (b, y) => { const sb = Math.sin(b), cb = Math.cos(b), ro = Rout(b); for (let p = ro - 0.05; p > 0.1; p -= 0.15) if (yAt(p * sb, p * cb, p / ro) >= y) return p; return 0.02; };     // its outermost stone at a height along a bearing (asked from its rim inward)
  // its skin: a net of its own over its whole plan (a third of a metre to half a metre fine), drawn in to its outline, its rim under the sea all round
  const nc = Math.min(72, Math.max(32, Math.round(2 * d.L / (d.col ?? 0.34)))), nr = Math.min(32, Math.max(14, Math.round(2 * d.S / (d.col ?? 0.34))));
  const at = (i, j, p) => { const a = -1 + 2 * i / nc, c = -1 + 2 * j / nr, dx = a * Math.sqrt(1 - c * c / 2), dy = c * Math.sqrt(1 - a * a / 2), rho = Math.min(1, Math.hypot(dx, dy)), b = AZ + Math.atan2(d.S * dy, d.L * dx), r = rho * Rout(b), qx = r * Math.sin(b), qz = r * Math.cos(b);
    p[0] = cx + qx; p[1] = yAt(qx, qz, rho); p[2] = cz + qz; };
  return { ...d, k, flags: true, net: true, low: true, top: d.top, planTop: d.top, R: R + 1, lean: [0, 0], radius, inside, head: null, skin: { nc, nr, at } };
}
// ---- A SLAB OF THE GATE IS NO PLAIN TILTED BLOCK WITH FLAT FACES AND NO PILE OF PLATES: A SLAB OF THE
// GATE IS ONE STANDING BODY OF THE BEDDED STONE, by one smooth law round its own leaning axis: a plan of its own (a long oval, a little squared, roughened and bitten: no two alike), going in as it
// goes up (a quarter or so by its top), its beds dipping across it (the stone's one dip), each bed's edge a small break all round and on stretches of its own A LEDGE that dies out to either hand,
// upright flutes and two or three leaning clefts through every bed, each bed's face a little off the one under it; ITS TOP IS BROKEN IN UNEQUAL LEVELS: highest at one end, going down toward the other
// by as many breaks as its top's own length holds (none to three: no more than leave its levels 3.5 m long on the whole; each break 0.35 to 0.8 of a level's length high), their lines wandering across it, each level's own
// upper face slanting with the dip, and one shoulder broken down (a break and a slope to that hand's brink). IT RISES OUT OF THE SEA on an apron of broken stone on stretches of its foot, and
// NO THIN UPRIGHT STANDS ON IT (the breaks are laid over the top's own length and breadth; by count). No face is one plane, no edge is level,
// no corner is square. A law of the body's own number (no draw of the seed, nothing of the lens); the one law answers the skin, the shade and the counts.
//   d: c (its axis on the sea), top (its highest place), L and S (half length, half breadth at the sea), az (its length's bearing), dipAz and dip (the bearing the beds rise toward, their slope),
//   th (a bed's thickness, least and most), lean (metres aside for a metre of height)
function mkSlab(k, d) {
  const AZ = d.az * D2R17, DA = d.dipAz * D2R17, dux = Math.sin(DA), duz = Math.cos(DA), dp = d.dip, cx = d.c[0], cz = d.c[1], L = d.L, S = d.S, H = d.top, lx = d.lean[0], lz = d.lean[1], NB = 720;
  const sq = 1.72 + 0.4 * hsh(k, 641), taper = 0.24 + 0.14 * hsh(k, 643), saz = Math.sin(AZ), caz = Math.cos(AZ);
  const per = Math.PI * (3 * (L + S) - Math.sqrt((3 * L + S) * (L + 3 * S))), mPh = per / TAU, wrap = (a) => a - TAU * Math.round(a / TAU);
  const ring = (ph, n, sd) => { let q = ph / TAU * n; q -= Math.floor(q / n) * n; const i0 = Math.floor(q), fr = q - i0, e = fr * fr * (3 - 2 * fr); return hsh(i0 % n, sd) + (hsh((i0 + 1) % n, sd) - hsh(i0 % n, sd)) * e - 0.5; };
  // THE SAME RING FROM A TABLE: a ring's hashes are of whole numbers (0 to n - 1) and its own number, asked again at every place of the skin and every step of the bake; they are
  // taken once into a table and the same arithmetic is done on them in the same order (the same numbers to the last bit; a place outside the table, which rounding could give, asks the hash itself)
  const ringT = (n, sd) => { const T = new Float64Array(n); for (let i = 0; i < n; i++) T[i] = hsh(i, sd); return { T, n, sd }; };
  const ringOf = (R, ph) => { const n = R.n; let q = ph / TAU * n; q -= Math.floor(q / n) * n; const i0 = Math.floor(q), fr = q - i0, e = fr * fr * (3 - 2 * fr), ia = i0 % n, ib = (i0 + 1) % n, a = ia >= 0 ? R.T[ia] : hsh(ia, R.sd), b = ib >= 0 ? R.T[ib] : hsh(ib, R.sd); return a + (b - a) * e - 0.5; };
  const phOf = (b) => Math.atan2(L * Math.sin(b - AZ), S * Math.cos(b - AZ));
  const n1 = Math.max(4, Math.round(per / 7)), n2 = Math.max(9, Math.round(per / 2.6)), n3 = Math.max(14, Math.round(per / 1.1)), nL = Math.max(3, Math.round(per / 8));
  const bites = []; for (let j = 0; j < 3; j++) bites.push([TAU * (j + 0.7 * hsh(k * 41 + j, 663)) / 3, (1.6 + 2.2 * hsh(k * 43 + j, 665)) / mPh, 0.14 + 0.2 * hsh(k * 47 + j, 667)]);
  const OUT = new Float32Array(NB); let R = 0;
  for (let q = 0; q < NB; q++) { const b = q * TAU / NB, ph = phOf(b), c = Math.abs(Math.cos(b - AZ)), e = Math.abs(Math.sin(b - AZ)); let r = Math.pow(Math.pow(c / L, sq) + Math.pow(e / S, sq), -1 / sq) * (1 + 0.24 * ring(ph, n1, k * 53 + 671) + 0.11 * ring(ph, n2, k * 59 + 673));
    for (const bt of bites) { const u = Math.abs(wrap(ph - bt[0])) / bt[1]; if (u < 1) r *= 1 - bt[2] * (1 - u * u); } OUT[q] = r; if (r > R) R = r; }
  R += 5.8; const R2 = R * R;
  const Rout = (b) => { let q = b * NB / TAU; q -= Math.floor(q / NB) * NB; const q0 = Math.floor(q), fr = q - q0; return OUT[q0 % NB] + (OUT[(q0 + 1) % NB] - OUT[q0 % NB]) * fr; };
  // the beds' levels in the stone (a height in the stone's own stack: the height less the dip's rise at the face), of unequal thickness
  const BL = [-9]; for (let n = 0; BL[n] < H + 9; n++) { const h = hsh(k * 3 + n, 681); BL.push(BL[n] + d.th[0] + (d.th[1] - d.th[0]) * h * h); }
  const bedOf = (w) => { let n = 0; while (n < BL.length - 2 && BL[n + 1] <= w) n++; return n; };
  const SBR = BL.map((y, n) => ringT(nL, k * 67 + n * 17 + 679)), SBH = BL.map((y, n) => hsh(k * 61 + n, 677));     // each bed's own ring and ledge, taken once
  const stepBack = (ph, w, ro) => { let e = 0; for (let n = 1; n < BL.length; n++) { const y = BL[n]; if (y < 0.9) continue; if (y > w + 0.25) break; const v = ringOf(SBR[n], ph) + 0.5;
    e += (0.1 + (d.ledge ?? 1) * (0.08 + 0.2 * SBH[n]) * ro * sst(0.5, 0.82, v)) * sst(y - 0.22, y + 0.22, w); } const m = 0.42 * ro; return m * (1 - Math.exp(-e / m)); };
  // IT RISES OUT OF THE SEA: on stretches of its foot (its own) an apron of fallen and broken stone goes out 0.3 to 3 m at the water, rough (a noise of its own, a metre across), dying out 1 to 3 m up; under the sea it widens
  const nA = Math.max(4, Math.round(per / 6)), APR1 = ringT(nA, k * 83 + 731), APR2 = ringT(nA, k * 89 + 733), G739 = hashGrid(739, 3.1 * k, 1.7 * k + 2, Math.ceil(0.4 * per) + 3, 5), G725 = hashGrid(725, 3.1 * k, 1.7 * k + 0.08 * H, 4, Math.ceil(0.08 * H) + 4), G727 = hashGrid(727, 7.3 * k, 5.9 + 0.08 * H, 4, Math.ceil(0.08 * H) + 4), apr = (ph, y) => { if (y >= 3.25) return 0; const ya = 1.0 + 2.2 * (ringOf(APR2, ph) + 0.5), q = Math.max(1 - Math.max(y, 0) / ya, 0); if (q === 0) return 0;     /* over its apron's greatest height (never over 3.2 m) and wherever its own height is passed the product is nought: nothing more is asked */ const v = ringOf(APR1, ph) + 0.5; return (0.3 + 2.7 * sst(0.42, 0.75, v)) * Math.pow(q, 1.4) * (0.5 + 1.0 * n2dOf(ph * mPh * 0.8 + 3.1 * k, Math.max(y, 0) * 1.2 + 1.7 * k, G739)); };
  const face0 = (b, y) => { METER += 0.5; const ro = Rout(b); if (y <= 0) return ro + Math.min(2.2, -0.3 * y) + apr(phOf(b), 0); const ph = phOf(b), sw = 1 + 0.17 * sst(0.5, 3, y) * (n2dOf(1.5 * Math.cos(ph) + 3.1 * k, y * 0.16 + 1.7 * k, G725) + n2dOf(1.5 * Math.sin(ph) + 7.3 * k, y * 0.16 + 5.9, G727) - 1);     // it swells and draws in as it goes up, on each hand in its own way: no side is one straight line
    return Math.max(0.3 * ro, ro * sw * (1 - taper * Math.pow(Math.min(y / H, 1.2), 1.3)) - stepBack(ph, y - 0.8 * dp * ro * Math.cos(b - DA), ro)) + apr(ph, y); };     // the smooth law (bake, counts): its face's distance from its leaning axis along a bearing at a height
  const NJ = 2 + Math.floor(1.99 * hsh(k, 651)), joints = []; for (let j = 0; j < NJ; j++) joints.push([TAU * (j + 0.8 * hsh(k * 3 + j, 653)) / NJ, (0.45 + 0.5 * hsh(k * 5 + j, 655)) / mPh, 0.5 + 0.9 * hsh(k * 7 + j, 657), 0.07 * (hsh(k * 9 + j, 659) - 0.5) / mPh]);
  const FR2 = ringT(n2, k * 71 + 691), FR3 = ringT(n3, k * 73 + 693), FRB = BL.map((y, n) => ringT(n2, k * 79 + n * 29 + 695));     // the flutes' two rings and each bed's own, taken once
  const faceR = (b, y) => { const r0 = face0(b, y); if (y < -2) return r0; const ph = phOf(b), ro = Rout(b), n = bedOf(y - 0.8 * dp * ro * Math.cos(b - DA)), up = sst(-2, 1, y);     // the skin's law: the flutes, each bed's own face, the clefts
    let v = (d.flute ?? 1) * (0.5 * ringOf(FR2, ph + 0.012 * y) + 0.22 * ringOf(FR3, ph - 0.02 * y)) + 0.28 * ringOf(FRB[n], ph);
    for (const jt of joints) { const u = Math.abs(wrap(ph - jt[0] - jt[3] * y)) / jt[1]; if (u < 1) v -= jt[2] * (1 - u); }
    return Math.max(0.2 * ro, r0 + up * v); };
  // its top: the place's height (in the measure of its own leaning axis)
  // THE TOP'S OWN MEASURES: by its top the body has drawn in to a half or less of its plan at the sea, so the breaks' lines are laid over the TOP's own half length and half breadth (its face's
  // reach along and across at 0.85 of its height), and it has no more breaks than its length holds at 3.5 m and more a level: no level is a strip along the brink, none a horn (laid over the plan at
  // the sea, a line would fall on the top's own end and the highest level would be a thin upright on the brink: the owner's gate, no figure)
  let aLo = 1e9, aHi = -1e9, cLo = 1e9, cHi = -1e9; for (let q = 0; q < 96; q++) { const b = q * TAU / 96, r = face0(b, 0.85 * H), a = r * Math.cos(b - AZ), c = r * Math.sin(b - AZ); aLo = Math.min(aLo, a); aHi = Math.max(aHi, a); cLo = Math.min(cLo, c); cHi = Math.max(cHi, c); }
  const LT = Math.max(1.5, 0.5 * (aHi - aLo)), aM = 0.5 * (aHi + aLo), SW = Math.max(1, 0.5 * (cHi - cLo)), cM = 0.5 * (cHi + cLo);
  const hs = d.high ?? (hsh(k, 701) < 0.5 ? -1 : 1), NS = Math.max(0, Math.min(2 + Math.floor(1.99 * hsh(k, 703)), Math.floor(2 * LT / 3.5) - 1)), ST = [], dpT = d.dipTop ?? dp; { let w = 0; for (let i = 0; i < NS; i++) { const e = d.drop != null ? 0.6 + 0.8 * hsh(k * 13 + i, 707) : (0.35 + 0.45 * hsh(k * 13 + i, 707)) * 2 * LT / (NS + 1); ST.push([0.28 + 0.62 * (i + 0.15 + 0.6 * hsh(k * 11 + i, 705)) / (NS + 0.1), e]);     /* the first break lies a third to a half of its length from its high end: its highest level is a block of its own breadth, never a horn on the end's brink (no thin upright there) */ w += e; } if (d.drop != null) { const D = d.drop * H; for (const e of ST) e[1] *= D / w; } }     // a break is 0.35 to 0.8 of a level's own length high (no level stands up as a tower on a small top)
  // its steps' lines lie aslant of its breadth (each slab's own slant), and ONE SHOULDER IS BROKEN DOWN: on one hand of
  // its length (its own) the top lies lower by a sixth to a third of its height from a wandering line a part of the way across: seen from either end its skyline is a high side and a low shoulder
  const sr = 0.9 * (hsh(k, 721) - 0.5), cs = hsh(k, 715) < 0.5 ? -1 : 1, ct = 0.05 + 0.4 * hsh(k, 717), cd = Math.min((0.16 + 0.17 * hsh(k, 719)) * H, 1.3 * (1 - ct) * SW);     // no deeper than 1.3 times the shoulder's own breadth
  let Y0 = H;
  const hwT = (sc) => Math.ceil(sc * R) + 3, G711 = hashGrid(711, k, 0, hwT(0.3), hwT(0.3)), G713 = hashGrid(713, 0, k, hwT(0.9), hwT(0.9)), G723 = hashGrid(723, 7, k, hwT(0.35), hwT(0.35));     // the top's lattice hashes, each taken once
  const ytop = (qx, qz) => { const al = (qx * saz + qz * caz - aM) / LT, ac = (qx * caz - qz * saz - cM) / SW, t = 0.5 - 0.5 * hs * (al + sr * ac) + 0.1 * (n2dOf(qx * 0.3 + k, qz * 0.3, G711) - 0.5); let y = Y0 + dpT * (qx * dux + qz * duz) + 0.3 * (n2dOf(qx * 0.9, qz * 0.9 + k, G713) - 0.5); for (const e of ST) y -= e[1] * sst(e[0] - 0.035, e[0] + 0.035, t);
    const cv = cs * ac + 0.25 * (n2dOf(qx * 0.35 + 7, qz * 0.35 + k, G723) - 0.5); return y - cd * (0.45 * sst(ct - 0.07, ct + 0.07, cv) + 0.55 * sst(ct, 1, cv)); };     // a break of under half its depth at the line, the rest a slope down to that hand's brink: the high side is a ridge with a slope beside it, never a blade over a bench
  const brink = (b, fn) => { const ux = Math.sin(b), uz = Math.cos(b); let T = 0.8 * H, r = 1; for (let i = 0; i < 6; i++) { r = fn(b, T); T = 0.5 * (T + Math.min(H, ytop(r * ux, r * uz))); } r = fn(b, T); return [r, ytop(r * ux, r * uz)]; };     // where its face meets its top along a bearing
  { let m = -1e9; for (let i = 0; i < 96; i++) { const b = i * TAU / 96, [r] = brink(b, faceR); for (let f = 0.1; f < 1.01; f += 0.1) { const v = ytop(f * r * Math.sin(b), f * r * Math.cos(b)); if (v > m) m = v; } } Y0 += H - m; }     // its highest place is its plan's top
  // THE SAME ANSWER BY LESS WORK: before the dear laws are asked, 'no' is answered from two bounds that those laws can never exceed, so no answer changes (the gate's bake asked the
  // whole law at every step of every march within 5.8 m of the body's widest round). outer: the face at a bearing is never farther out than its outline there swollen by all the law can add
  // (the swell 0.17 of it; the flutes and the bed's own face 0.36 * flute + 0.14, which the clefts only take from; the apron 4.5 m under 3.2 m of height and none above; 2.2 m more under the sea;
  // the step-backs only take from it). over: the top is never higher than its own plane at the place plus half its noise (the breaks and the shoulder only take from it).
  const V_MAX = 0.36 * Math.abs(d.flute ?? 1) + 0.14 + 0.01, outer2 = (b, y) => { const r = 1.17 * Rout(b) + V_MAX + (y < 3.2 ? 4.5 : 0) + (y <= 0 ? 2.2 : 0); return r * r; }, over = (qx, qz) => Y0 + dpT * (qx * dux + qz * duz) + 0.151;
  const inside = (x, y, z) => { if (y > H + 0.4 || y < -8) return false; const qx = x - cx - lx * y, qz = z - cz - lz * y, r2 = qx * qx + qz * qz; if (r2 > R2 || y > over(qx, qz)) return false; const b = Math.atan2(qx, qz); if (r2 > outer2(b, y)) return false; const r = face0(b, y); return r2 <= r * r && !(y > ytop(qx, qz)); };
  const insideSkin = (x, y, z) => { if (y > H + 0.4 || y < -8) return false; const qx = x - cx - lx * y, qz = z - cz - lz * y, r2 = qx * qx + qz * qz; if (r2 > R2 || y > over(qx, qz)) return false; const b = Math.atan2(qx, qz); if (r2 > outer2(b, y)) return false; const r = faceR(b, y); return r2 <= r * r && !(y > ytop(qx, qz)); };     // by the skin's own law (the shade)
  const topY = (x, z) => { let y = H; for (let i = 0; i < 4; i++) y = ytop(x - cx - lx * y, z - cz - lz * y); return inside(x, y - 0.05, z) ? y : -1e9; };     // its upper face at a place
  const radius = (b, y) => { const ux = Math.sin(b), uz = Math.cos(b); let r = 0.02; for (let p = 0.15; p < R + 2; p += 0.15) if (inside(cx + p * ux, y, cz + p * uz)) r = p; return r; };     // its outermost stone at a height along a bearing from its foot's middle
  // its skin: columns evenly along its outline; rows from its skirt under the sea up its face to its brink (each column's own), then its top in to its axis
  const nc = Math.min(96, Math.max(48, Math.round(per / (d.col ?? 0.42) / 4) * 4)), nF = Math.min(40, Math.max(16, Math.round((H + 1) / (d.row ?? 0.45)))) + 2, CAP = [0.84, 0.66, 0.46, 0.27, 0.11, 0.002], nr = nF + CAP.length, BR = new Float32Array(2 * nc).fill(NaN);
  const at = (i, j, p) => { const ph = TAU * i / nc, b = AZ + Math.atan2(S * Math.sin(ph), L * Math.cos(ph)), ux = Math.sin(b), uz = Math.cos(b); METER += 0.4;
    if (!(BR[2 * i] === BR[2 * i])) { const e = brink(b, faceR); BR[2 * i] = e[0]; BR[2 * i + 1] = e[1]; }
    const rT = BR[2 * i], T = BR[2 * i + 1]; let r, y;
    if (j === 0) { y = -7; r = faceR(b, y); } else if (j === 1) { y = -2.2; r = faceR(b, y); } else if (j < nF) { y = -0.5 + (T + 0.5) * (j - 2) / (nF - 2); r = faceR(b, y); } else if (j === nF) { y = T; r = rT; }
    else { r = CAP[j - nF - 1] * rT; y = ytop(r * ux, r * uz); }
    p[0] = cx + lx * y + r * ux; p[1] = y; p[2] = cz + lz * y + r * uz; };
  return { ...d, k, flags: true, low: true, top: H, planTop: H, R: R + Math.hypot(lx, lz) * H, lean: [0, 0], axis: [lx, lz], radius, inside, insideSkin, bound: [[cx, cz, lx, lz, R2, H + 0.4, -8]] /* its inside's own first bound, for marchMeets */, topY, head: null, skin: { nc, nr, at } };
}
// a ledge's or a slab's own skin (ox, oz: the frame the skin is wanted in)
export async function flagsGeometry(ctx, t, ox = 0, oz = 0, cost = 0.5) { return gridGeometry(ctx, t.skin.nc, t.skin.nr, (i, j, p) => { t.skin.at(i, j, p); p[0] -= ox; p[2] -= oz; }, !t.net, true, cost); }
export let FANGS = null;
// every ledge is one body of dipping beds by mkSkerry, as long and as broad as its plan, all of ONE DIP: SHOAL_DIP, the bearing the beds rise toward (95 degrees:
// toward the east, a little south of it by the world's compass: away from the way in, so a ledge's wet top leans TOWARD the way and catches the low sky) and their slope (0.2). SHOAL_RAMPS: the ledges
// whose top is one bedding plane (mkSkerry's d.ramp), each long along the dip; the others are worn humps, long across it. No ledge keeps the tower's law (stack is false for every row: by the tower's law a ledge is a blunt
// stack of squared stepped blocks).
export const SHOAL_DIP = [95, 0.2];
const SHOAL_RAMPS = [3, 10, 11, 12, 13];
const makeFang = ([x, z, top, a], i) => { const stack = false;     // (see above: no stack)
  return mkSkerry(300 + i, { name: 'ledge' + i, c: [x, z], top, L: stack ? a * (1.05 + 0.15 * hsh(i, 631)) : a * (1.2 + 0.2 * hsh(i, 631)), S: stack ? a * (0.7 + 0.12 * hsh(i, 633)) : a * (0.5 + 0.12 * hsh(i, 633)), az: (SHOAL_RAMPS.includes(i) ? SHOAL_DIP[0] : 18.5) + 24 * (hsh(i, 635) - 0.5), dipAz: SHOAL_DIP[0], dip: SHOAL_DIP[1], ramp: SHOAL_RAMPS.includes(i), T: stack ? [0.7, 2.4] : top > 3 ? [0.5, 1.5] : [0.3, 1.0] }); };
export function fangsInside(x, y, z) { if (y > 40 || y < -10 || x < -125 || x > 78 || z > -28 || z < -412) return false;
  for (let k = 0; k < FANGS.length; k++) { const b = FANGS[k], dx = x - b.c[0], dz = z - b.c[1]; if (dx * dx + dz * dz < b.R * b.R && b.inside(x, y, z)) return true; } return false; }
// the march's own lists (see marchMeets): rockAim sets aside, for one march, the mountain's bodies and the ledges its line cannot meet (a ledge by the round fangsInside itself asks first);
// the two laws below then answer as massifInside and fangsInside do, asking only the bodies kept
let FANG_FOR = null, FANG_B = null, FANG_N = 0, MAS_N = 0; const FANG_C = new Int32Array(64), MAS_C = new Int32Array(64);
export function rockAim(x, y, z, lim) { if (FANG_FOR !== FANGS) { FANG_FOR = FANGS; FANG_B = FANGS.map((b) => [b.c[0], b.c[1], 0, 0, b.R * b.R, 40, -10]); }
  FANG_N = 0; for (let k = 0; k < FANGS.length; k++) if (marchMeets1(FANG_B[k], x, y, z, lim)) FANG_C[FANG_N++] = k;
  MAS_N = 0; for (let k = 0; k < MASSIF.length; k++) { const t = MASSIF[k]; if (!t.out && (!t.bound || marchMeets(t.bound, x, y, z, lim))) MAS_C[MAS_N++] = k; } }
export function fangsInsideAimed(x, y, z) { if (FANG_N === 0 || y > 40 || y < -10 || x < -125 || x > 78 || z > -28 || z < -412) return false;
  for (let q = 0; q < FANG_N; q++) { const b = FANGS[FANG_C[q]], dx = x - b.c[0], dz = z - b.c[1]; if (dx * dx + dz * dz < b.R * b.R && b.inside(x, y, z)) return true; } return false; }
export function massifInsideAimed(x, y, z) { if (x > MB.x1 || x < MB.x0 || z > MB.z1 || z < MB.z0 || y > 208 || y < -10) return false;
  for (let q = 0; q < MAS_N; q++) if (MASSIF[MAS_C[q]].inside(x, y, z)) return true;
  if (y < 15) for (let k = 0; k < BLOCKS.length; k++) { const b = BLOCKS[k], dx = x - b.c[0], dz = z - b.c[1]; if (dx * dx + dz * dz < 400 && b.inside(x, y, z)) return true; }
  return false; }
// the surf's distance to a ledge: each is long along the line's bearing, so its surf lies round its own long plan (half length and half breadth measured from the built body at the sea), never in a round ring off its sides
let GLSL_FANG = '';
const mkFangGLSL = () => 'float fangD(vec2 p){ float d = 60.; vec2 q; float e;\n' + FANGS.map((b) => { const A0 = b.az ?? 18.5, ax = Math.sin(A0 * D2R17), az = Math.cos(A0 * D2R17); let l0 = 1e9, l1 = -1e9, s0 = 1e9, s1 = -1e9;     // by each ledge's own length's bearing, at the sea: the oval that holds its whole waterline (36 bearings of its own law)
  for (let i = 0; i < 36; i++) { const be = i * TAU / 36, r = b.radius(be, 0.25), l = r * (Math.sin(be) * ax + Math.cos(be) * az), sd = r * (Math.sin(be) * az - Math.cos(be) * ax); if (l < l0) l0 = l; if (l > l1) l1 = l; if (sd < s0) s0 = sd; if (sd > s1) s1 = sd; }
  const Lh = Math.max(2, 0.5 * (l1 - l0)), Sh = Math.max(1.5, 0.5 * (s1 - s0)), oL = 0.5 * (l1 + l0), oS = 0.5 * (s1 + s0);     // its plan's own middle: a ledge reaches farther to one end and one side than to the other
  return '  q = p - vec2(' + (b.c[0] + ax * oL + az * oS).toFixed(1) + ', ' + (b.c[1] + az * oL - ax * oS).toFixed(1) + '); q = vec2((q.x * ' + ax.toFixed(3) + ' + q.y * ' + az.toFixed(3) + ') / ' + Lh.toFixed(1) + ', (q.x * ' + az.toFixed(3) + ' - q.y * ' + ax.toFixed(3) + ') / ' + Sh.toFixed(1) + '); e = dot(q, q); d = min(d, (sqrt(e) - 1.) * mix(' + Sh.toFixed(1) + ', ' + Lh.toFixed(1) + ', q.x * q.x / max(e, 1e-4)));'; }).join('\n') + '\n  return d; }\n';
export const MASSIF_C = [-100, -208];     // the massif's middle on the sea (for the noise of its mist and surf by bearing)
const MB = { x0: -205, x1: -36, z0: -356, z1: -95 };
// a place from which a march toward the sun can meet no more stone: beyond the mountain's own box on the sun's side (the sun stands toward -x and +z, so a march only goes
// that way) and over every ledge's top (the ledges are the only stone outside the box)
const LEDGE_TOP = 1.3 * Math.max(...FANG_AT.map((f) => f[2])) + 3;
export const massifPast = (x, y, z) => ((SUN[0] < 0 ? x < MB.x0 : x > MB.x1) || (SUN[2] > 0 ? z > MB.z1 : z < MB.z0)) && y > LEDGE_TOP;     // by the sun's own side of the box
export function massifInside(x, y, z) { if (x > MB.x1 || x < MB.x0 || z > MB.z1 || z < MB.z0 || y > 208 || y < -10) return false;
  for (let k = 0; k < MASSIF.length; k++) if (!MASSIF[k].out && MASSIF[k].inside(x, y, z)) return true;
  if (y < 15) for (let k = 0; k < BLOCKS.length; k++) { const b = BLOCKS[k], dx = x - b.c[0], dz = z - b.c[1]; if (dx * dx + dz * dz < 400 && b.inside(x, y, z)) return true; }
  return false; }
// the massif's long shadow at a place (the sea's own law, in JS, for the ship by her place): each tower's own
export function massifShade(x, y, z) { let sh = 0;
  for (const t of MASSIF) { if (t.out) continue; const qx = x - t.c[0], qz = z - t.c[1], along = qx * SH_A[0] + qz * SH_A[1], perp = qx * SH_P[0] + qz * SH_P[1], yy = y + along * SH_T, soft = 1.5 + 0.012 * Math.max(along, 0);
    const v = sst(-soft, soft, t.w0 * (1 - t.wk * clamp(yy / (0.7 * t.top), 0, 1.3)) - Math.abs(perp - t.lp * yy)) * sst(-12, 14, along) * (1 - sst(t.top - 8, t.top + 2, yy)); if (v > sh) sh = v; }
  return 1 - sh; }
let GLSL_MASSIF = '';
// THE MOUNTAIN'S DOUBLE IN THE SEA: how much of the ray the sea gives back from a place (R, by the water's own slope there) meets one of the mountain's bodies: each body by its own
// foot centre, its lean, its mean reach low and at seven tenths of its height, and its top (the plan's own numbers, written out). A standing law of the place; the sea's shader reads it with the ray it mirrors.
const mkMirrorGLSL = () => 'float massifMirror(vec3 P, vec3 R){ float rl = max(length(R.xz), 1e-4), el = R.y / rl, m = 0., al, pp, dd, hh, ww; vec2 dir = R.xz / rl, q;\n'
  + '  dir = normalize(dir + .14 * (vec2(vn(P.xz * .19), vn(P.xz * .19 + 7.3)) - .5));\n'     /* no double's edge is a straight upright band: the ray's bearing wanders with the place */
  + MASSIF.filter((t) => !t.out).map((t) => { const mean = (y) => { let a = 0; for (let i = 0; i < 24; i++) a += Math.max(t.radius(i * Math.PI / 12, y), 0); return a / 24; }, r0 = mean(8), r1 = mean(0.7 * t.top);
    return `  q = vec2(${t.c[0].toFixed(1)}, ${t.c[1].toFixed(1)}) - P.xz; al = dot(q, dir); pp = abs(q.x * dir.y - q.y * dir.x); dd = max(al - sqrt(max(${(r0 * r0).toFixed(1)} - pp * pp, 0.)), 0.); hh = P.y + dd * el; pp = abs((q.x + ${t.lean[0].toFixed(4)} * hh) * dir.y - (q.y + ${t.lean[1].toFixed(4)} * hh) * dir.x); ww = ${r0.toFixed(2)} * (1. - ${(1 - r1 / r0).toFixed(4)} * clamp(hh / ${(0.7 * t.top).toFixed(1)}, 0., 1.3));
  m = max(m, step(0., al) * (1. - smoothstep(ww * .62, ww * 1.1, pp)) * (1. - smoothstep(${(Math.min(t.top, 100) - 8).toFixed(1)}, ${(Math.min(t.top, 100) + 4).toFixed(1)}, hh)));`; }).join('\n')
  + `\n  q = vec2(${MASSIF_C[0].toFixed(1)}, ${MASSIF_C[1].toFixed(1)}) - P.xz; al = dot(q, dir); pp = abs(q.x * dir.y - q.y * dir.x); dd = max(al - sqrt(max(6400. - pp * pp, 0.)), 0.); hh = P.y + dd * el;\n  m = max(m, step(0., al) * (1. - smoothstep(58., 84., pp)) * (1. - smoothstep(22., 40., hh)));`     /* (FOUR) the mountain is one mass at its foot: under 30 m no sky stands between its bodies' doubles */
  + '\n  return m; }\n';
const mkMassifGLSL = () => 'float massifD(vec2 p){ vec2 q = p - vec2(' + MASSIF_C[0].toFixed(1) + ', ' + MASSIF_C[1].toFixed(1) + '); if (dot(q, q) > 170. * 170.) return 60.; float d = 60.;\n'
  + MASSIF.filter((t) => !t.out).map((t) => '  q = p - vec2(' + t.c[0].toFixed(1) + ', ' + t.c[1].toFixed(1) + '); d = min(d, ' + t.F.reduce((e, f) => { const x = 'dot(q, vec2(' + f.nx.toFixed(4) + ', ' + f.nz.toFixed(4) + ')) - ' + t.off(f, 0.5, 0).toFixed(2); return e ? 'max(' + e + ', ' + x + ')' : x; }, '') + ');').join('\n') + '\n'
  + BLOCKS.map((b) => '  d = min(d, length(p - vec2(' + b.c[0].toFixed(1) + ', ' + b.c[1].toFixed(1) + ')) - ' + (0.8 * (b.R - 2.5)).toFixed(1) + ');').join('\n') + '\n  return d; }\n';

function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

// ---- the round: every driver of the pool as a function of the round's own second (0..26) -------------------------------
export function roundAt(tau) {
  const open = tau < 8 ? sst(0, 8, tau) : tau < 12 ? 1 : 1 - sst(12, 15, tau);
  const dome = sst(14.4, BURST, tau) * (1 - 0.92 * sst(BURST, 19.8, tau)) * (1 - sst(20, 25, tau));
  const age = (tau - BURST + ROUND) % ROUND;                       // seconds since the last burst
  const ringR = 22 + 8.5 * age;
  const ringA = sst(22, 40, ringR) * (1 - sst(110, 215, ringR)) * Math.sqrt(40 / Math.max(ringR, 40));
  const seethe = sst(0, 1.5, age) * (1 - sst(4, 9.5, age));        // the white seething disc after the burst
  const closing = sst(12, 13.2, tau) * (1 - sst(14.6, 15.6, tau)); // the ring of white racing inward
  // what the boil throws: how high its front has climbed (20 m at the most: there is no column) and how thick it stands
  // (the weight of its shadow, of the wet on the low rock and of the low haze); it sinks and thins by 10 s after the burst
  const colTop = 20 * (1 - Math.exp(-age / 1.3)) * (1 - 0.8 * sst(5.5, 10, age)), colS = sst(0, 0.6, age) * Math.exp(-Math.max(age - 3.5, 0) / 2.4) * (1 - sst(7, 10.5, age));
  const haze = 0.03 + 0.05 * (1 - open) + 0.12 * colS;
  return { open, dome, age, ringR, ringA, seethe, closing, colTop, colS, haze };
}

// ---- the swell: three trains from the west, heaped and shortened in the narrows ------------------------------------------
const K1 = TAU / 72, W1 = TAU / 6.8, K2 = TAU / 41, W2 = TAU / 5.13, K3 = TAU / 23, W3 = TAU / 3.84;
export const NAR0 = -200, NARL = 135;                   // the narrows' heap: from z = -200 to -335, fullest at the pool's latitude
export function narrows(z) { const s = clamp(NAR0 - z, 0, NARL); return [0.5 - 0.5 * Math.cos(TAU * s / NARL), 0.5 * (s - NARL / TAU * Math.sin(TAU * s / NARL))]; }
// ONE LOW SEA: in the two rocks' lee the
// swell is low everywhere, LOW of what the trains would carry in the open, the same at every place, and the pool's ring
// swell with it; the sea's violence is the pool's, the rocks' feet's and the ledges'. Counted against the ship's foredeck
// (planks 0.92 m over her water, her heave and pitch taken against her).
export const LOW = 0.16;
// THE SEA IS LEVEL AT THE LOW ROCK'S FOOT: from 7.5 m before the rock's skin (its own plan about the pool: the inner face rc0, its thickness, its two ends) the funnel's dip and
// the swell's lumps have ended: the water there lies still at one height (LEVEL_H under the open sea's level), on the pool's side and round both ends; the funnel's wall comes up to that
// height over the 13 m before it; under the rock's own body (from 10 m behind its face) the sea goes back to the funnel's own law, which is all but level behind the rock. A law of the place (the rock's plan), the same in the shader. 0: the sea's own law; 1: level.
const LEVEL_H = -1.4;
function levelAt(dx, dz, r) {
  if (r < 10 || r > 66) return 0;
  const la = Math.atan2(dz, dx), rc = 42 + 2.2 * Math.sin(2.1 * la + 1) + 1.2 * Math.sin(5.3 * la), out = rc + 10;
  return sst(rc - 21, rc - 7.5, r) * (1 - sst(out, out + 8, r)) * sst(-2.5246, -2.1746, la) * (1 - sst(1.5812, 1.9312, la));
}
// THE STANDING LIP: on the side where the strait's water comes into the bowl (bearings 95 to 205 degrees about the throat: the west and the strait's side, toward the mountain and the entry) the
// sea stands up in a low ridge along the rim (0.75 m at the most, 2.4 m to either side of its crest, 1.2 m outside the rim's own wandering line) before it falls in: a standing form of the place, the same in the shader.
// Nothing of it beyond 46 m from the throat (the line passes at 52).
function lipAt(dx, dz, r) { if (r < 30 || r > 47) return 0; const la = Math.atan2(dz, dx), ua = la < -1.2 ? la + TAU : la, e = (r - (38.2 + 2.2 * Math.sin(2 * la + 1.3) + 1.4 * Math.sin(5 * la - 0.6))) / 2.4;
  return 0.75 * Math.exp(-e * e) * sst(1.55, 1.95, ua) * (1 - sst(3.45, 3.85, ua)) * (0.75 + 0.25 * Math.sin(7 * la + 2)) * (1 - sst(44, 47, r)); }
function swellAt(x, z, t) {
  const [w, wi] = narrows(z), dx = x - PC[0], dz = z - PC[1], r = Math.hypot(dx, dz);
  const lee = (0.15 + 0.85 * sst(30, FUN.R, r)) * (1 - levelAt(dx, dz, r));
  const th = K1 * (-z + 0.5 * wi) - W1 * t, a1 = 0.7 * (1 + 0.86 * w * (1 - sst(60, 150, x)));
  return LOW * lee * (a1 * (Math.sin(th) - 0.1 * Math.cos(2 * th)) + 0.25 * Math.sin(K2 * (0.208 * x - 0.978 * z) - W2 * t + 1.3) + 0.1 * Math.sin(K3 * (-0.326 * x - 0.946 * z) - W3 * t + 4.1));
}
// THE POOL IS A STANDING FUNNEL IN THE SEA, at every hour: a vortex's own profile about the pool's centre,
//   F(r) = FUN_K (1 - (r / R)^2)^2 / (r^2 + c^2)   for r < R (R = 96 m: the funnel's rim; c = 24 m),
// gentle far out and steepening inward (the 1 / r^2 of a free vortex, made finite at the middle by c and brought to
// nought with no step at the rim), FUN_K set so that the sea lies FUN.deep (2.5 m) under its level where the flown
// line is nearest (FUN.at = 42 m from the centre). In its middle THE THROAT: a shaft 9 to 18 m across (sst 4.5 to 9 m
// of radius), FUN.shaft (8 m) deeper than the funnel's foot between the draws (23.5 m under the sea) and FUN.suck
// (14 m) deeper again at the suck's deepest (37.5 m: under the black sand, which is then seen in it). WHEN SHE BOILS
// the water wells up IN THE THROAT (seven tenths of the depth there, with heads of 2 to 4 m working on it) and spreads
// over the funnel's lower third (to 30 m); the funnel stays a funnel. Nothing of the round moves the sea beyond 30 m
// from the centre but the low ring swell.
export const FUN = { R: 96, c: 24, at: PC[0], deep: 2.5, shaft: 8, suck: 14 };
const FUN_K = FUN.deep * (FUN.at * FUN.at + FUN.c * FUN.c) / Math.pow(1 - (FUN.at / FUN.R) ** 2, 2);
export function funnelAt(r) { if (r >= FUN.R) return 0; const w = 1 - (r / FUN.R) ** 2; return FUN_K * w * w / (r * r + FUN.c * FUN.c); }
// THE THROAT IS NO ROUND PIPE: the shaft's breadth wanders by its bearing (two lobes and three: its lip 5.7 to 11.8 m from the middle), so the floor it bares is an uneven patch
// of ground, never a disc. A standing form of the place (the shader's poolH is the same law).
export const throatR = (dx, dz, r) => { if (r < 0.01) return r; const la = Math.atan2(dz, dx); return r * (1 + 0.22 * Math.sin(2 * la + 1) + 0.13 * Math.sin(3 * la - 2)); };
function poolAt(x, z, t, R) {
  const dx = x - PC[0], dz = z - PC[1], r = Math.hypot(dx, dz);
  let h = LOW * R.ringA * Math.exp(-(((r - R.ringR) / 9) ** 2));
  const L = levelAt(dx, dz, r);
  if (r >= FUN.R) return h + (LEVEL_H - h) * L;
  const th = 1 - sst(4.5, 9, throatR(dx, dz, r)), F = funnelAt(r), well = 1 - sst(12, 30, r);
  h -= F + th * (FUN.shaft + FUN.suck * R.open) - lipAt(dx, dz, r);
  if (well > 0) h += R.dome * well * (0.7 * (F + th * FUN.shaft) + 0.8 * (Math.sin(dx * 0.19 + t * 0.55) * Math.sin(dz * 0.16 - t * 0.45) + 0.6 * Math.sin(dx * 0.11 - dz * 0.26 + t * 0.7)));
  return h + (LEVEL_H - h) * L;
}
// the sea's height at a place and a round second (tau) and a world second (t): the law the shader draws by
export function seaHeight(x, z, t, tau) { return swellAt(x, z, t) + poolAt(x, z, t, roundAt(tau)); }

// ---- the same in GLSL -------------------------------------------------------------------------------------------------------
export const GLSL_SEA = /* glsl */`
uniform float uTime, uOpen, uDome, uRingR, uRingA, uAge, uSeethe, uClosing, uCloseR;
const vec2 PC = vec2(${PC[0].toFixed(1)}, ${PC[1].toFixed(1)});
const vec3 SUN = vec3(${g3(SUN[0])}, ${g3(SUN[1])}, ${g3(SUN[2])});
const vec2 SUNH = vec2(${g3(SUN_H[0])}, ${g3(SUN_H[1])}), SHA = vec2(${g3(SH_A[0])}, ${g3(SH_A[1])}), SHP = vec2(${g3(SH_P[0])}, ${g3(SH_P[1])}); const float SHT = ${g3(SH_T)};     // the sun on the sea, the shadows' axis, the axis square to it, the sun's slope
float pw2(float x){ return x * x; }
vec2 narrows(float z){ float s = clamp(-200. - z, 0., 135.); return vec2(.5 - .5 * cos(6.2831853 * s / 135.), .5 * (s - 21.4859 * sin(6.2831853 * s / 135.))); }
const float LOW = ${LOW.toFixed(3)};     // one low sea (see LOW)
// THE BEARING ABOUT THE THROAT (la) IS ASKED ONCE AT A PLACE: the level at the low rock's foot, the standing lip and the throat's lobes all read the same bearing, which each
// law took for itself (four times at a place, twelve in the sea's vertex shader). The same laws and the same numbers: the L forms take the bearing, the old names ask it once and call them
float levelL(float la, float r){     // the sea level at the low rock's foot (see levelAt)
  if (r < 10. || r > 66.) return 0.;
  float rc = 42. + 2.2 * sin(2.1 * la + 1.) + 1.2 * sin(5.3 * la), outR = rc + 10.;
  return smoothstep(rc - 21., rc - 7.5, r) * (1. - smoothstep(outR, outR + 8., r)) * smoothstep(-2.5246, -2.1746, la) * (1. - smoothstep(1.5812, 1.9312, la));
}
float levelK(vec2 d, float r){ return levelL(atan(d.y, d.x), r); }
float lipL(float la, float r){     // the standing lip (see lipAt)
  if (r < 30. || r > 47.) return 0.;
  float ua = la < -1.2 ? la + 6.2831853 : la, e = (r - (38.2 + 2.2 * sin(2. * la + 1.3) + 1.4 * sin(5. * la - .6))) / 2.4;
  return .75 * exp(-e * e) * smoothstep(1.55, 1.95, ua) * (1. - smoothstep(3.45, 3.85, ua)) * (.75 + .25 * sin(7. * la + 2.)) * (1. - smoothstep(44., 47., r));
}
float swellL(vec2 p, float r, float lev){     // the swell where the level at the low rock's foot is lev (r: the distance from the throat)
  vec2 nw = narrows(p.y);
  float lee = (.15 + .85 * smoothstep(30., ${FUN.R.toFixed(1)}, r)) * (1. - lev);
  float th = 0.0872665 * (-p.y + .5 * nw.y) - 0.9239978 * uTime, a1 = .7 * (1. + .86 * nw.x * (1. - smoothstep(60., 150., p.x)));
  return LOW * lee * (a1 * (sin(th) - .1 * cos(2. * th)) + .25 * sin(0.1532484 * (.208 * p.x - .978 * p.y) - 1.2247925 * uTime + 1.3) + .1 * sin(0.2731820 * (-.326 * p.x - .946 * p.y) - 1.6362462 * uTime + 4.1));
}
float swellH(vec2 p){ vec2 d = p - PC; float r = length(d); return swellL(p, r, levelK(d, r)); }
float funnelD(float r){ float w = max(1. - pw2(r / ${FUN.R.toFixed(1)}), 0.); return ${FUN_K.toFixed(2)} * w * w / (r * r + ${(FUN.c * FUN.c).toFixed(1)}); }     // the standing funnel (see FUN)
// x: height; y: how deep in the funnel this place is (0 at the rim, 1 from 14 m under the sea down)
vec2 poolL(vec2 d, float r, float la, float lev){
  float h = LOW * uRingA * exp(-pw2((r - uRingR) / 9.)), fun = 0.;
  if (r < ${FUN.R.toFixed(1)}) {
    float tla = r > .01 ? la : 0., th = 1. - smoothstep(4.5, 9., r * (1. + .22 * sin(2. * tla + 1.) + .13 * sin(3. * tla - 2.))), F = funnelD(r), well = 1. - smoothstep(12., 30., r);     // the throat is no round pipe (see throatR)
    h -= F + th * (${FUN.shaft.toFixed(1)} + ${FUN.suck.toFixed(1)} * uOpen) - lipL(la, r);
    h += uDome * well * (.7 * (F + th * ${FUN.shaft.toFixed(1)}) + .8 * (sin(d.x * .19 + uTime * .55) * sin(d.y * .16 - uTime * .45) + .6 * sin(d.x * .11 - d.y * .26 + uTime * .7)));
    fun = clamp((F + th * ${FUN.shaft.toFixed(1)}) / 14., 0., 1.);
  }
  h = mix(h, ${LEVEL_H.toFixed(1)}, lev);
  return vec2(h, fun);
}
vec2 poolH(vec2 p){ vec2 d = p - PC; float r = length(d), la = atan(d.y, d.x); return poolL(d, r, la, levelL(la, r)); }
// the whole sea at a place, the bearing asked once: x its height, y how deep in the funnel, z the swell alone
vec3 seaAll(vec2 p){ vec2 d = p - PC; float r = length(d), la = atan(d.y, d.x), lev = levelL(la, r), sw = swellL(p, r, lev); vec2 ph = poolL(d, r, la, lev); return vec3(sw + ph.x, ph.y, sw); }
float seaH(vec2 p){ return seaAll(p).x; }
`;

// ---- the sky by direction : THE LOW SUN STANDS IN IT, 13 degrees up on its own bearing (the part's SUN): a soft disc in a glow of the air about it, gold on the sea's rim
// under it going up through rose into the zenith's blue; opposite it the earth's own shadow, a slate band under a rose one. The bank of cloud on the sea's rim and the bars of high cloud take that sun: toward it
// they are seen from their shaded side with their heads' edges alight, away from it their heads are rose and gold. All by direction alone.
// THE SKY AWAY FROM THE SUN IS A DEEP EVENING
// BLUE WITH FORM IN IT: the zenith's blue is lifted (uZen: deep, but its red and green are not nought), the sky square to the sun goes up into it as slowly as the far sky
// does (skyPlain), and the level sheet's small heaped clouds stand on the half of the sky away from the sun too (skyBase: fewer there, their heads toward the sun rose). The sea gives back this sky.
export const GLSL_SKY = /* glsl */`
uniform vec3 uZen, uEast, uRose, uGold, uPale, uSkyLow, uSide;
const vec3 SKSUN = vec3(${g3(SUN[0])}, ${g3(SUN[1])}, ${g3(SUN[2])}); const vec2 SKSUNH = vec2(${g3(SUN_H[0])}, ${g3(SUN_H[1])});
float skh(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float skn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(skh(i), skh(i + vec2(1., 0.)), f.x), mix(skh(i + vec2(0., 1.)), skh(i + vec2(1., 1.)), f.x), f.y); }
float skf(vec2 p){ return .55 * skn(p) + .3 * skn(p * 2.1 + 7.) + .15 * skn(p * 4.3 + 3.); }
float skb(vec2 p){ return .6 * abs(2. * skn(p) - 1.) + .28 * abs(2. * skn(p * 2.3 + 7.) - 1.) + .12 * abs(2. * skn(p * 5.1 + 3.) - 1.); }     // billows: round heads, creases between
vec3 skyPlain(vec3 d){     // the sky's own colour by direction with no cloud and no sun in it
  float t = clamp(d.y, 0., 1.), hz = max(length(d.xz), 1e-4), sunSide = dot(d.xz / hz, SKSUNH);
  vec3 e = mix(uEast, uRose, smoothstep(.03, .105, t)); e = mix(e, uSkyLow, smoothstep(.1, .34, t)); e = mix(e, uZen, smoothstep(.25, .8, t));
  vec3 w = mix(uGold, mix(uPale, uRose, .4), smoothstep(0., .26, t)); w = mix(w, uZen, smoothstep(.14, .62, t));     // the sun's side goes up through rose into the zenith's blue (no pale field)
  vec3 s = mix(mix(uSide, uRose, .35 * (1. - smoothstep(.03, .2, t))), uZen, smoothstep(.16, .85, t));     // the sky square to the sun goes up into the zenith's blue as slowly as the far sky does
  return mix(mix(s, e, smoothstep(-.05, .8, -sunSide)), w, smoothstep(.0, .85, sunSide)); }
// the air's glow about the sun (no disc): a tight warm heart, a broad gold field, a faint rose reach; by the angle from the sun alone
vec3 sunAir(vec3 d){ float cs = max(dot(d, SKSUN), 0.), c2 = cs * cs, c8 = c2 * c2 * c2 * c2; return vec3(1., .64, .32) * (.55 * pow(c8, 9.) + .2 * c8) + vec3(.8, .36, .26) * .09 * c2; }
// the disc: soft-edged, a degree and a third across its heart, never a hard white round
vec3 sunDisc(vec3 d){ float cs = dot(d, SKSUN); return vec3(1., .8, .52) * (1.25 * smoothstep(.99935, .99988, cs) + .7 * pow(max(cs, 0.), 900.)); }
vec3 skyBase(vec3 d){
  float t = clamp(d.y, 0., 1.), hz = max(length(d.xz), 1e-4);
  float sunSide = dot(d.xz / hz, SKSUNH), cs = max(dot(d, SKSUN), 0.);                    // 1 toward the sun's bearing, -1 the antisolar
  vec3 c = skyPlain(d) + sunAir(d);
  // bars of high cloud with body on the sun's half of the sky: their under sides rose and gold from the low sun, brightest near it, their backs slate (by bearing and height alone)
  // they lie on one level sheet high over the sea (the look's own direction carried up to that sheet: flecks overhead, long thin bars toward the rim, as a level field of cloud
  // is seen), soft at every edge; a bar's shaded part is the sky's own colour a little deepened, never slate
  // THEY HAVE FORM AND ARE FEWER: small heaped clouds on the level sheet, each with an outline of its own billows (a body's edge is
  // crisp: its thickness crosses over within a fiftieth of the field's range), about as broad as high in the picture (the sheet is carried less far out toward the rim, and nothing of it is
  // drawn under 12 degrees), of small cover; lit so (the edge toward the sun alight, the heart in its own soft shade, the under side rose and gold)
  vec2 sp = d.xz / (t + .55); float ws = smoothstep(-.4, .3, sunSide);
  float bl = skb(sp * 5.2 + 5.), bl2 = skb(sp * 12.3 + 2.), den = skf(sp * 2.3 + vec2(3., 1.)) + .22 * (bl - .5) + .09 * (bl2 - .5), denS = skf((sp + SKSUNH * .09) * 2.3 + vec2(3., 1.)) + .22 * (skb((sp + SKSUNH * .09) * 5.2 + 5.) - .5);
  float cv = smoothstep(.565 + .022 * (1. - ws), .6 + .022 * (1. - ws), den) * smoothstep(.2, .34, t) * (1. - smoothstep(.46, .6, t));     // on the far half too: fewer there (the body's edge stands higher in the field), their lit heads rose and a fifth dimmer     // a body with an edge of its own billows: no soft blot; the sheet's clouds stand between 12 and 35 degrees up: none overhead (a small heaped cloud overhead is seen from under as a flat bar)
  float sunEdge = smoothstep(-.01, .07, den - denS);     // where the cloud thins toward the sun's bearing: its lit edge; its heart and its far side in its own soft shade
  c = mix(c, mix(mix(c, uSide * 1.05, .42), mix(uRose, uGold, .12 + .28 * ws) * (.62 + .36 * bl + .3 * bl2) * (.8 + .2 * ws) * (1. + 1.1 * cs * cs * cs), clamp(.75 * sunEdge + .7 * smoothstep(.3, .8, .6 * bl + .4 * bl2), 0., 1.)), .86 * cv);
  return c;
}
// THE BANK: one great bank of cloud standing on the sea's rim, three shelves one before another (the hindmost the highest). Away from the sun its heads take the rose and gold and its feet are the dusk's
// slate; toward the sun it is lower (the disc stands clear over it), seen from its shaded side, its heads' edges alight. A thing of the sky, by bearing alone.
// Returned as light already weighed by its cover (rgb) and the cover (a).
vec4 skyBank(vec3 d){
  float hz = max(length(d.xz), 1e-4), az = atan(d.x, -d.z), el = d.y / hz, ad = az + .1, win = 1. - (ad > 0. ? smoothstep(.7, 1.3, ad) : smoothstep(1.7, 2.5, -ad));     // it reaches round behind the high rock
  float nearSun = smoothstep(.5, .96, dot(d.xz / hz, SKSUNH));
  vec4 o = vec4(0.);
  if (win > 0. && el < .36) {
    for (int k = 0; k < 3; k++) { float fk = float(k);
      float top = (.25 - .08 * fk) * (.42 + 1.25 * skb(vec2(az * (3. + 2. * fk) + 11. * fk, fk * 3.))) * win * (1. - .62 * nearSun);
      // THE BANK'S HEADS HAVE FORM: a shelf's outline is ROUND HEADS WITH CREASES BETWEEN (billows as broad as they are high in the picture: one measure for bearing
      // and height, two sizes), crisp against the sky (no smear: nothing in it is drawn out along the rim); its
      // inside is the same billows, lit and shaded alike. Where the bank ends (to either hand of its reach) its outline comes down to the sea's rim: no torn-off shreds hang in the sky beside it
      vec2 bq = vec2(az, el) * (8. + 3. * fk) + vec2(5. * fk, 2. * fk); float bil = skb(bq), bil2 = skb(bq * 2.4 + 4.);
      float rag = .07 * (bil - .5) + .03 * (bil2 - .5), tk = top * smoothstep(.02, .1, top);
      float m = .93 * (1. - smoothstep(-.008, .008, el - tk - rag * smoothstep(0., .08, tk)));
      float h = clamp((el - rag) / max(top, .01), 0., 1.);
      float puff = .55 * skb(bq * .7 + 3.) + .45 * bil2;
      vec3 lit = mix(uRose, uGold, .25 + .5 * puff) * (.7 + .45 * puff);
      vec3 shd = mix(uEast * .8, uSide * .95, .6 * puff) * (1. - .2 * fk);
      vec3 body = mix(shd, lit, smoothstep(.3, .95, h) * smoothstep(.25, .7, puff) * (1. - .3 * fk) * (1. - .8 * nearSun));
      body += vec3(1., .66, .34) * nearSun * (1.2 * smoothstep(.72, 1., h) * (.35 + .65 * puff) + .25);     // toward the sun: its heads' edges alight, its body in the sun's own haze
      o = vec4(o.rgb * (1. - m) + body * m, 1. - (1. - o.a) * (1. - m));
    }
  }
  return o;
}
// THE SUN'S RAYS in the air: broad soft shafts standing out from the sun, 4 to 40 degrees from it, a dozen of unequal breadth and strength round it (a noise of the
// bearing about the sun's own direction, whole round: no seam). They are the sky's, by direction alone: wherever the sun stands behind the mountain or the bank, they come out round its shoulders.
float sunRays(vec3 d){ float cs = dot(d, SKSUN); if (cs < .7) return 0.;
  vec3 e1 = normalize(cross(SKSUN, vec3(0., 1., 0.))), e2 = cross(e1, SKSUN); vec2 u = vec2(dot(d, e1), dot(d, e2)); float ul = max(length(u), 1e-4); u /= ul;
  float r = .62 * skn(u * 3.1 + 11.) + .38 * skn(u * 7.3 + 3.);
  return smoothstep(.44, .78, r) * smoothstep(.07, .22, ul) * (1. - smoothstep(.3, .66, ul)); }
vec3 skyCol(vec3 d){ vec4 b = skyBank(d); return skyBase(d) * (1. - b.a) + b.rgb + sunDisc(d) * (1. - .9 * b.a) + vec3(1., .7, .4) * (.17 * sunRays(d) * (1. - .6 * b.a)); }
`;
export const GLSL_FOG = /* glsl */`
uniform vec3 uFogCol; uniform float uFogDen;
vec3 fogged(vec3 c, float dist){ float f = 1. - exp(-pw2(uFogDen * dist)); return mix(c, uFogCol, f); }
`;
// ---- the high rock's shadow on a place of the world: its outline as the sun sees it, laid down the shadow's axis ----------
// uRockS: xz the foot's centre, then the outline's reach to the left and to the right of the shadow's axis at 10 m
export let GLSL_SHADOW = '';
const mkShadowGLSL = () => /* glsl */`
uniform vec4 uRockS;     // x, z of the foot's centre; the outline's reach to either side of the shadow's axis (left, right)
float rockShade(vec3 P){
  float sh = 0., along, perp, y, soft; vec2 q;
${MASSIF.filter((t) => !t.out).map((t) => `  q = P.xz - vec2(${t.c[0].toFixed(1)}, ${t.c[1].toFixed(1)}); along = dot(q, SHA); perp = dot(q, SHP); y = P.y + along * SHT; soft = 1.5 + .012 * max(along, 0.);
  sh = max(sh, smoothstep(-soft, soft, ${t.w0.toFixed(2)} * (1. - ${t.wk.toFixed(4)} * clamp(y / ${(0.7 * t.top).toFixed(1)}, 0., 1.3)) - abs(perp - ${t.lp.toFixed(5)} * y)) * smoothstep(-12., 14., along) * (1. - smoothstep(${(t.top - 8).toFixed(1)}, ${(t.top + 2).toFixed(1)}, y)));`).join('\n')}
  // (no roof of cloud is built, so no shadow of one lies far out)
  // THE GATE'S SLABS THROW THEIR LONG SHADOWS on the sea (each by its own place, breadth and height, down the sun's own axis)
${TAIL.map((t, i) => TAIL_ON(i) && t[5] !== undefined ? `  q = P.xz - vec2(${t[0].toFixed(1)}, ${t[1].toFixed(1)}); along = dot(q, SHA); perp = dot(q, SHP); y = P.y + along * SHT; soft = .8 + .02 * max(along, 0.);
  sh = max(sh, .92 * smoothstep(-soft, soft, ${tailAcross(t).toFixed(2)} * (1. - .45 * clamp(y / ${t[3].toFixed(1)}, 0., 1.)) - abs(perp - ${(t[6] * SH_P[0] + t[7] * SH_P[1]).toFixed(4)} * y)) * smoothstep(-2., 3., along) * (1. - smoothstep(${(t[3] - 3).toFixed(1)}, ${(t[3] + .5).toFixed(1)}, y)));` : '').join('\n')}
  return 1. - sh;
}
// the thrown spray's soft shadow, laid down the same axis from the pool; it moves with the round
uniform float uColTop, uColS;
float columnShade(vec3 P){
  vec2 q = P.xz - vec2(${PC[0].toFixed(1)}, ${PC[1].toFixed(1)});
  float along = dot(q, SHA), perp = dot(q, SHP);
  float y = P.y + along * SHT;
  float wid = 20. + 8. * clamp(y / max(uColTop, 1.), 0., 1.);
  float sh = (1. - smoothstep(wid - 9., wid + 9., abs(perp))) * smoothstep(-14., 12., along) * (1. - smoothstep(uColTop - 14., uColTop + 4., y));
  return 1. - .62 * clamp(uColS * 1.4, 0., 1.) * sh;
}
`;
// THE BODIES ARE MADE IN THE BUILD, NOT WHEN THE MODULE IS READ: the mountain's seven bodies, its fallen blocks, the ledges and the three laws written from them (the shadow, the
// surf's distances) would be one stretch of 60 to 150 ms in which nothing could be asked. prepareBodies makes them once, an ask after every body; the world's build
// calls it before anything else. The plan is one plan and every number is the plan's.
let BODIES_READY = false;
export async function prepareBodies(ctx0) { if (BODIES_READY) return; const ctx = ctx0 && ctx0.yield ? ctx0 : { yield: () => null };     // every body is asked for by the meter, before it is made (what its laws do not count themselves)
  const TOWER_US = [5100, 5300, 3000, 3900, 3100, 2000, 4100];     // what each body's making costs beyond what its laws count (measured in node, a cold build; the first of a kind runs cold)
  const ms = []; for (let k = 0; k < TOWERS.length; k++) { await tick(ctx, TOWER_US[k] ?? 3500); ms.push(mkTower(k, TOWERS[k])); } MASSIF = ms;
  { const bs = []; for (const b of makeBlocks()) { await tick(ctx, bs.length === 0 ? 4100 : bs.length === 1 ? 2500 : bs.length < 13 ? 1100 : 300); bs.push(b()); } BLOCKS = bs; }     // the blocks one by one
  const fs = []; for (let i = 0; i < FANG_AT.length; i++) { await tick(ctx, i === 0 ? 7900 : i === 1 ? 6000 : i === 2 ? 3200 : 1800); fs.push(makeFang(FANG_AT[i], i)); } FANGS = fs;
  await tick(ctx, 3000); GLSL_FANG = mkFangGLSL(); await tick(ctx, 3000); GLSL_MASSIF = mkMassifGLSL() + mkMirrorGLSL(); GLSL_SHADOW = mkShadowGLSL(); BODIES_READY = true; await tick(ctx, 3000); }
export const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p){ return .5 * vn(p) + .3 * vn(p * 2.03 + 7.1) + .2 * vn(p * 4.11 + 3.7); }
float pn(vec2 p, float per){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float i0 = mod(i.x, per), i1 = mod(i.x + 1., per);     // a noise that closes on itself after per cells of its first measure (round a centre: no seam)
  return mix(mix(h21(vec2(i0, i.y)), h21(vec2(i1, i.y)), f.x), mix(h21(vec2(i0, i.y + 1.)), h21(vec2(i1, i.y + 1.)), f.x), f.y); }
`;

// ---- the uniforms every material of the place shares (one object; update() writes the clock's values into it) -----------
export function makeShared(mood = 0.5) {
  const c = (h) => new THREE.Color(h), v = (x) => ({ value: x });
  const sunCol = c('#ffa656').lerp(c('#ff9a46'), mood);
  return {
    uTime: v(0), uOpen: v(0), uDome: v(0), uRingR: v(0), uRingA: v(0), uAge: v(0), uSeethe: v(0), uClosing: v(0), uCloseR: v(35), uWetPulse: v(0), uColTop: v(1), uColS: v(0), uHaze: v(0.1), uSmokeT: v(0),
    // the down-sun sky of the last half hour: the earth's own shadow a slate-violet band on the eastern horizon, the rose
    // band over it, deep blue above going darker to the zenith; gold only in the west, behind us
    uZen: v(c('#2b3768')), uEast: v(c('#463a5a')), uRose: v(c('#b9807c')), uGold: v(c('#f3b060')), uPale: v(c('#c2a48e')), uSkyLow: v(c('#343f62')), uSide: v(c('#434c72')),
    uFogCol: v(c('#3d3859')), uFogDen: v(0.0007), uSunCol: v(sunCol), uRockS: v(new THREE.Vector4(ROCK_C[0], ROCK_C[1], 80, 80)),
    uDeep: v(c('#0b2734')), uBlackGreen: v(c('#0a1c20')), uGlass: v(c('#1f5263')), uFoamSun: v(c('#f1d6bd')), uFoamShade: v(c('#5b5c9e')),
    uHemiSky: v(c('#5a69bd')), uHemiGround: v(c('#34376a')), uBounce: v(c('#d08a48')),
  };
}
// write the clock into the shared uniforms: time is the world clock, phase the seed's deal (seconds into the round at clock 0)
export function setClock(U, time, phase) {
  const tau = ((time + phase) % ROUND + ROUND) % ROUND, R = roundAt(tau);
  U.uTime.value = time; U.uOpen.value = R.open; U.uDome.value = R.dome; U.uRingR.value = R.ringR; U.uRingA.value = R.ringA;
  U.uAge.value = R.age; U.uSeethe.value = R.seethe; U.uClosing.value = R.closing; U.uCloseR.value = 50 * (1 - sst(12, 15, tau));
  U.uWetPulse.value = sst(4, 7, R.age) * (1 - sst(9, 24, R.age));
  U.uColTop.value = R.colTop; U.uColS.value = R.colS; U.uHaze.value = R.haze;
  U.uSmokeT.value = (((time + phase - BURST) % (2 * ROUND)) + 2 * ROUND) % (2 * ROUND);
  return R;
}

// ---- the sea: polar rings about the pool's centre, one shader for the pool and the open sea ------------------------------
export function seaGeometry(radii, segs = 192) {
  const n = radii.length, pos = new Float32Array(n * segs * 3), idx = new Uint32Array((n - 1) * segs * 6);
  for (let i = 0, k = 0; i < n; i++) for (let j = 0; j < segs; j++, k += 3) { const a = TAU * j / segs; pos[k] = radii[i] * Math.cos(a); pos[k + 2] = radii[i] * Math.sin(a); }
  for (let i = 0, k = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) { const a = i * segs + j, b = i * segs + (j + 1) % segs, c = a + segs, d = b + segs; idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radii[n - 1] + 20);
  return g;
}
export function makeSeaMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: GLSL_SEA + /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec2 vFun;
      void main(){
        vec2 p = (modelMatrix * vec4(position, 1.)).xz;
        vec3 s0 = seaAll(p); vec2 ph = vec2(s0.x - s0.z, s0.y); float sw = s0.z, h = s0.x, e = .8;
        float hx = seaH(p + vec2(e, 0.)), hz = seaH(p + vec2(0., e));
        vN = vec3(h - hx, e, h - hz); vFun = vec2(ph.y, sw);
        vW = vec3(p.x, h, p.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: GLSL_SEA + GLSL_SKY + GLSL_FOG + GLSL_SHADOW + GLSL_NOISE + GLSL_MASSIF + GLSL_FANG + GLSL_TAIL + /* glsl */`
      uniform vec3 uDeep, uBlackGreen, uGlass, uFoamSun, uFoamShade, uSunCol;
      varying vec3 vW; varying vec3 vN; varying vec2 vFun;
      // the gold of a front-lit rock thrown on the sea toward us: how much of the ray the sea gives back (by its own slope
      // at this place) meets a rock that stands at c with half width rad and height H. A standing law of the place.
      float rockMirror(vec3 P, vec3 R, vec2 c, float rad, float H){
        vec2 q = c - P.xz; float rl = max(length(R.xz), 1e-4); vec2 dir = R.xz / rl;
        float along = dot(q, dir), perp = abs(q.x * dir.y - q.y * dir.x);
        float dd = along - sqrt(max(rad * rad - perp * perp, 0.));
        float top = (H - P.y) / max(dd, 4.), el = R.y / rl;
        return (1. - smoothstep(rad * .5, rad * 1.1, perp)) * step(0., along) * (1. - smoothstep(top * .6, top, el)) * smoothstep(2., 14., dd);     // the rock's shape in the mirror; its light is asked beside it
      }
      // FOAM DRAWN OUT ALONG THE FLOW : a field of streaks six times as long as broad and more, laid along the
      // spiral on which the pool's water runs in (its bearing about the throat, wound by the logarithm of its distance, turning on the
      // world clock; sh: down the throat's wall the same streaks slant with the depth). Two charts of the bearing, each used away
      // from its own seam. It reads the water's own place and the clock, nothing else.
      float flowS(float t1, float lr, float A, float B, float k, float sh){     // t1: the bearing about the throat
        float c = 2.6 * lr - uTime * .05 + sh, t2 = t1 > 0. ? t1 - 3.14159265 : t1 + 3.14159265;     // the same bearing on the chart whose seam lies opposite
        return mix(vn(vec2((t1 + c) * A, lr * B + k)), vn(vec2((t2 + c) * A + 31., lr * B + k + 7.)), smoothstep(.9, 2.2, abs(t1)));
      }
      // ONE TRAIN OF WIND WAVES: crests of its own length square to its own way, sharp-crested and broad in the trough (the cube of a half sine), bent by a noise of the place
      // so that no crest is a ruled line, running on the world clock. xy: the water's slope it gives; z: its height from 0 (trough) to 1 (crest).
      vec3 wtrain(vec2 p, vec2 dir, float k, float w, float ph){
        // THE SHORT TRAINS ARE CHOP, NOT COMBED LINES: a train under 3 m from crest to crest (by its own length: chop) has its
        // crests bent twice (a second, finer bend of its own) and standing only about one of its own lengths along (longer, each short train seen end on near the eye is a fan of long parallel
        // streaks); the long trains keep their long crests
        float chop = smoothstep(1.6, 4.4, k), th = k * dot(p, dir) - w * uTime + ph + 2.6 * vn(p * k * .13 + ph) + chop * 2.4 * vn(p * k * .34 + ph * 1.7 + 5.); float sn = .5 + .5 * sin(th);
        float env = .12 + .88 * smoothstep(.34, .7, vn(vec2(dot(p, dir) * mix(.05, .09, chop), dot(p, vec2(-dir.y, dir.x)) * mix(.11, .27, chop)) * k + ph * 2.7 + 11.));     // short-crested: a crest stands a few of its own lengths along and dies (no train of ruled parallel lines to the sea's rim)
        return vec3(dir * (1.5 * sn * sn * cos(th) * k * env), sn * sn * sn * env); }
      void main(){
        vec3 N = normalize(vN);
        vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
        vec2 d = vW.xz - PC; float r = length(d); vec2 dn = d / max(r, 1.); float rla = atan(d.y, d.x);     // the bearing about the throat, asked once
        // THE POOL IS ONE THING AT EVERY DISTANCE: nothing of it is drawn, coloured or left out by how far off the eye stands. What differs with distance is FINENESS ALONE, by the water's own place
        // and a pixel's footprint there: fpx is the metres of water one pixel covers at this place (under a grazing look, many metres along the look). Where a pixel is broader than the fine white
        // water (the wall's streaks, the tongues, the shaft's threads, the lip's strands, the tear of the rim's foam), each goes to ITS OWN MEAN at its place (the means counted from these very
        // noises): whole under 1.5 m to a pixel, its mean from 6 m. Nothing is put on the water and nothing is taken off it.
        float fpx = length(fwidth(vW.xz)), fineK = 1. - smoothstep(1.5, 6., fpx);
        float sh = -min(vW.y, 0.) * .125 * (1. - smoothstep(10., 22., r));     // down the throat's wall every pattern of the water slants with the depth (the water's own height at its place): never upright
        vec2 wq = vW.xz + vec2(-dn.y, dn.x) * sh * 12.;
        // far off, where the rings of the mesh are wide, the swell's slope is taken from its own law at this place
        // THE LENS'S DISTANCE is read in this shader for the view vector (optics: Fresnel, the mirrors, the fog) and for
        // filters of fine detail against shimmer, each going to its own mean and never to nought: the far slope (farN),
        // the ripple (rip) and the facets' three scales (k1, k2, k3, with the sun's lobe widened by what they take out).
        float farN = smoothstep(120., 260., dist) * smoothstep(80., 110., r);
        if (farN > 0.) {      // far off the mesh's wide rings give way to the sea's own slope over one metre: the swell AND the pool's ring swell (out there the pool's height is the ring alone), so no form of the place loses its light
          vec2 px = vW.xz + vec2(1., 0.), pz = vW.xz + vec2(0., 1.);
          float rpx = length(px - PC), rpz = length(pz - PC), s0 = swellL(vW.xz, r, 0.) + LOW * uRingA * exp(-pw2((r - uRingR) / 9.)), sx = swellL(px, rpx, 0.) + LOW * uRingA * exp(-pw2((rpx - uRingR) / 9.)), sz = swellL(pz, rpz, 0.) + LOW * uRingA * exp(-pw2((rpz - uRingR) / 9.));     // (out here, 80 m and more from the throat, the level at the low rock's foot is nought)
          N = normalize(mix(N, normalize(vec3(s0 - sx, 1., s0 - sz)), farN)); }
        vec3 Nsw = N;
        float rip = 1. - smoothstep(30., 220., dist);
        vec2 q = wq * .5 + vec2(0., uTime * .3);
        float vq0 = vn(q); N = normalize(N + rip * .045 * vec3(vq0 - vn(q + vec2(.7, 0.)), 0., vq0 - vn(q + vec2(0., .7))));
        // the race's tail: slack glassy boils 10 to 20 m across in the southern mouth, south of z -318 (whole by -345) and 13 m and more to either hand of x 0 (whole by 22 m): typed places in the world
        float bv = vn(vW.xz * .058 + vec2(3., uTime * .012)), tail = (1. - smoothstep(-345., -318., vW.z)) * smoothstep(13., 22., abs(vW.x));     // by place alone
        float boil = smoothstep(.6, .68, bv) * tail, boilRim = smoothstep(.5, .6, bv) * (1. - smoothstep(.6, .72, bv)) * tail;
        N = normalize(mix(N, vec3(0., 1., 0.), .8 * boil));
        // THE WATER NEAR THE EYE IS WATER: five trains of wind waves (9, 5.2, 2.9, 1.3 and 0.6 m from crest to crest, each on a bearing of its own about the wind's), in the
        // water's own slope: the sea gives back the sky BROKEN (a crest's near face the high blue, its far face the bright rim of the sky), with the rocks' doubles broken in it. Each train goes to its mean
        // where a picture cannot hold it (by the lens's distance: a filter against shimmer, as the facets below); in the funnel's running water and on the glassy boils they lie down.
        float wk1 = 1. - smoothstep(70., 200., dist), wk2 = 1. - smoothstep(50., 140., dist), wk3 = 1. - smoothstep(34., 96., dist), wk4 = 1. - smoothstep(24., 70., dist), wk5 = 1. - smoothstep(14., 44., dist);
        vec3 wv1 = wtrain(wq, vec2(-.469, -.883), .698, 2.6, 0.), wv2 = wtrain(wq, vec2(.052, -.999), 1.208, 3.4, 2.1), wv3 = wtrain(wq, vec2(-.743, -.669), 2.167, 4.6, 4.4), wv4 = wtrain(wq, vec2(.766, -.643), 4.833, 6.9, 1.3), wv5 = wtrain(wq, vec2(-.966, -.259), 10.47, 10.1, 3.7);
        float wcalm = (1. - .85 * smoothstep(.02, .3, vFun.x)) * (1. - .8 * boil) * (.35 + .65 * smoothstep(20., 60., r));
        vec2 wsl = (.105 * wk1 * wv1.xy + .060 * wk2 * wv2.xy + .046 * wk3 * wv3.xy + .03 * wk4 * wv4.xy + .014 * wk5 * wv5.xy) * wcalm;     /* the three short trains stand half again to two and a half times as steep: near the eye every crest has a near and a far face */
        float whh = (.34 * wk1 * wv1.z + .27 * wk2 * wv2.z + .2 * wk3 * wv3.z + .12 * wk4 * wv4.z + .07 * wk5 * wv5.z), wkk = .34 * wk1 + .27 * wk2 + .2 * wk3 + .12 * wk4 + .07 * wk5;     // the waves' height (0 trough to 1 crest) and how much of them a picture holds here
        N = normalize(N + vec3(wsl.x, 0., wsl.y));
        float ndv = max(dot(N, V), 0.);
        float F = .02 + .98 * pow(clamp(1. - ndv, 0., 1.), 3.6);                           // a ruffled sea: more of the sky at the middle angles
        vec3 R0 = reflect(-V, N); R0.y = abs(R0.y) + .004;
        vec3 R = R0; R.y += .025;
        // the sea gives back the sky it looks at: the rose and slate of the east toward the horizon, deep blue nearer the bow
        // the sea gives back the sky's own colour and the glow about the sun, NOT the bank's and the bars' fine forms: those are drawn by bearing, and a ruffled sea that mirrored
        // them is striped with rays fanning from under the lens (each bearing of the sky a stripe on the water). A dusk of the bank's own slate lies in the mirror low toward the sea's rim, by bearing broadly.
        vec3 Rn = normalize(R); float bankLow = (1. - smoothstep(.04, .2, Rn.y)) * smoothstep(-.2, .5, dot(normalize(Rn.xz + 1e-4), vec2(.1, -1.))) * (1. - smoothstep(.4, .95, dot(normalize(Rn.xz + 1e-4), SUNH)));
        vec3 sky = mix(skyPlain(Rn) + sunAir(Rn), uSide * .95, .45 * bankLow) * mix(vec3(.6, 1.05, .92), vec3(1.), smoothstep(.2, .75, F));                 // ink blue-green: the sea keeps the sky's red to itself
        // THE ROCKS' BROKEN DOUBLES: where the ray the sea gives back meets the mountain the sea shows the mountain's own shaded stone (dark blue-violet), not the sky behind it; where
        // it meets the low rock, that rock's stone: gold where the face the place sees is turned to the sun, the dusk's blue where it is turned away. Broken by the waves' own slope (the ray is the water's).
        // EVERY DOUBLE IS BROKEN ACROSS BY THE WAVES: each wave line along the look (0.6 m of water) gives back a place of the stone some metres to one side or the
        // other (a noise drawn out along the crests, moving on the world clock), so a double's upright edge is a ragged run of dashes near the eye and a soft edge far off: no straight upright band of
        // sky stands between two bodies' doubles
        vec2 mdq = vW.xz - cameraPosition.xz + vec2(1e-4, 0.); float mdl = length(mdq); vec2 mdv = mdq / mdl; float mjz = vn(vec2(mdl * 1.7 - uTime * .5, atan(mdv.x, -mdv.y) * 11.)) - .5; vec3 mPerp = vec3(mdv.y, 0., -mdv.x) * mjz;     // (by the water's distance along the look and its bearing from the eye: a reflection is the eye's own)
        { float mm = massifMirror(vW + mPerp * 9., Rn); sky = mix(sky, vec3(.030, .037, .078), .93 * mm);
          vec2 lq = vec2(PC.x + 56., -280.) - vW.xz; float lm = rockMirror(vW, Rn, vec2(PC.x + 56., -280.), 60., 34.), ll = smoothstep(-.1, .5, dot(-lq / max(length(lq), 1.), SUNH));
          sky = mix(sky, mix(vec3(.034, .038, .078), vec3(.62, .28, .11), ll), .85 * lm * (1. - smoothstep(.3, .7, vFun.x)));
          vec2 tm = tailMirror(vW + mPerp * 3., Rn); sky = mix(sky, mix(vec3(.034, .038, .078), vec3(.55, .27, .12), tm.y), .88 * tm.x); }     // each slab of the gate has its broken double at its foot. (NO LIGHT OF THE WAY OUT LIES IN THE WATER: the sea gives back the sky and the stone alone)
        float sv = rockShade(vW) * columnShade(vW);
        float nearSide = .5 - .5 * dn.x;                                    // 1 on the strait's side of the pool, 0 under the cliff
        float fz = vFun.x, collar = .92 * smoothstep(.0, .32, fz);     // the funnel: the sea's own colour, darkening by its depth to black-green at the throat, at every hour
        float dishK = 1. - smoothstep(40., 110., r);     // the funnel: smooth dark running water
        sv *= mix(1., smoothstep(-.02, .22, dot(Nsw, SUN)), smoothstep(.25, .7, fz));     // THE HOLE HAS DEPTH: deep in the funnel the wall that is turned from the low sun lies in its own shadow (by the water's slope at the place)
        // depth of colour: deep blue-green in the open, darkening by the funnel's depth to black-green; the same sea a shade lighter where the water is thin
        float crest = smoothstep(.85, 1.75, vFun.y);
        vec3 body = mix(uDeep * 2.5, uGlass * .5, .8 * collar);     // THE BOWL IS THE SEA'S OWN WATER: dark blue-green glass from the open sea over the rim and down; no black-green, no black
        body = mix(body, uGlass * .55, .5 * crest);
        float lip = .2 * exp(-pw2((r - 30.) / 12.));     // green where the water thins over the lip, where the funnel steepens
        float wall = 0.;
        float graze = .45 * collar * nearSide * pow(clamp(1. - ndv, 0., 1.), 2.5) * (1. - smoothstep(52., 66., r));   // the shoulder that rolls over out of sight
        float thin = clamp(max(max(lip, wall), max(graze, .1 * uDome * (1. - smoothstep(8., 27., r)))), 0., 1.);
        body = mix(body, uGlass * (.36 + .36 * sv), .9 * thin);     // the thin water over the lip is the sea's own blue-green, a shade lighter: no turquoise
        float farLight = collar * smoothstep(.1, .5, dot(Nsw, SUN)) * (1. - smoothstep(.22, .5, fz)); body = mix(body, uGlass * .7, .22 * farLight);     /* NO PALE PATCH IN THE THROAT: the low light lies on the funnel's upper slope only; down the throat the far wall is the sea's own dark, streaked by the turning foam alone */     // the funnel's wall takes the low light on its slope: lighter on the wall turned to the sun (the far wall, from the strait); it reads the water's own slope and the sun
        body *= 1. - .5 * smoothstep(.5, 1., fz + .3 * uOpen * (1. - smoothstep(6., 12., r)));            // darkest in the throat, and still dark blue-green water there: one looks down a funnel, at no black disc
        vec3 col = mix(body * (.74 + .26 * sv), mix(sky, vec3(dot(sky, vec3(.3, .5, .2))) * vec3(.6, .76, 1.), .85 * dishK) * mix(1., .72, dishK) * (.94 + .06 * sv), max(F, .15 + .2 * farLight) * (1. - .75 * thin) * (1. - .45 * dishK));     // on the funnel's running water the sea keeps its own colour: it gives back less of the pale east (it read as mist or wet sand)   // the rock's shadow takes the sun out of the water, not the sky off it
        // THE WATER'S FACETS, plain optics. The water's own normal in three scales (about 6 m, 1.5 m and 0.4 m across), each
        // going flat (its mean) where it is finer than a picture can hold. A facet that mirrors the low sun to the eye is a
        // fleck of gold: dense in the one path under the sun, thinning to both hands. A facet that mirrors a sun-lit rock
        // takes that rock's gold, by the water's own shine at that angle. Everywhere else the sea takes the sky.
        float k1 = 1. - smoothstep(150., 600., dist), k2 = 1. - smoothstep(40., 160., dist), k3 = 1. - smoothstep(10., 45., dist);
        vec2 fs1 = vec2(vn(wq * .17 + vec2(uTime * .10, 0.)), vn(wq * .17 + vec2(31., uTime * .08))) - .5;
        vec2 fs2 = vec2(vn(wq * .67 + vec2(uTime * .30, 7.)), vn(wq * .67 + vec2(47., -uTime * .25))) - .5;
        vec2 fs3 = vec2(vn(wq * 2.5 + vec2(-uTime * .70, 13.)), vn(wq * 2.5 + vec2(71., uTime * .60))) - .5;
        vec2 fsl = .2 * k1 * fs1 + .45 * k2 * fs2 + .6 * k3 * fs3;
        vec3 Nf = normalize(N + vec3(fsl.x, 0., fsl.y));
        float lost = 1. - (.2 * k1 + .3 * k2 + .5 * k3);                     // how much of the facets the filter has taken out
        vec3 Rf = reflect(-V, Nf); Rf.y = abs(Rf.y) + .004; Rf = normalize(Rf);
        float Ff = .02 + .98 * pow(1. - clamp(dot(V, Nf), 0., 1.), 5.);
        // the sun's flecks; far off, where the facets are filtered away, the lobe is as much wider and fainter (the flecks' mean)
        float glit = pow(max(dot(Rf, SUN), 0.), mix(1400., 90., lost)) * mix(1., .065, lost) * sv;
        float keep = (1. - .8 * thin) * (1. - .85 * collar) * (1. - .8 * dishK);
        col = mix(col, vec3(1., .62, .2), clamp(3. * glit, 0., 1.) * keep);
        // the sun-lit rocks in the facets
        // (the rocks' doubles are in the sky the sea gives back, above)     // the orange rock's own gold; the dark crag's double is dark (it throws no gold)     // only where the facet shines: near the bow the steep water keeps its own colour and the gold is flecks; far off, at the grazing, it draws together
        // dark troughs: the hollows of the two longer scales keep less of the sky
        col *= .78 + .36 * mix(.6, smoothstep(.02, .5, whh / max(wkk, .05)), wkk * wcalm);     /* the troughs of the wind waves themselves are the dark, their crests the light (no blotch of noise with no wave under it) */     // on the funnel's near slope the troughs' blotches go to their mean: smooth slick water there
        // the surge's lace at the high rock's foot, rising and draining with the main swell
        vec2 rq = vW.xz - uRockS.xy; float rb = atan(rq.x, rq.y);
        float laceD = min(massifD(vW.xz), fangD(vW.xz));     // the surf sucks round every fang too
        // THE POOL'S FOAM IS FIVE OPEN SPIRAL ARMS: one field from the open sea over the rim into the
        // bowl. An arm winds in toward the throat ever more openly (12 degrees off the circle at 200 m, 17 at the rim, 28 on the wall), so each is plainly
        // curved and bends toward the pool. Each is drawn only on stretches of about a third of the way round, with open water between (no ring closes
        // anywhere, no two lie as a pair). Each is a bundle of thin torn strands (0.3 to 1.5 m broad, unequal, of broken length, every edge soft), 10 m
        // broad at the rim where it is heaped, thinning to a few long streaks on the wall; nothing within 12 m of the throat. The arms turn as one on the
        // world clock (0.005 rad/s); their strands and flecks ride in along them by the clock, faster the nearer the throat (17.5 / r metres a second
        // inward). Where an arm comes over the rim the water breaks: white boiling patches at its root, by the clock. It reads the water's own place and
        // the clock, nothing else.
        // THE WALL'S COLOUR STEPS DOWN BY ITS DEPTH: the sea's teal over the rim, blue from 2.5 to 8 m under the sea's level, blue-black from 8 to 18 m; the low light on the far
        // wall's upper slope is untouched by it (it lies above the first step)
        float dpt = -min(vW.y, 0.);
        // INSIDE THE BOWL THE SPIRAL WINDS TIGHTER: from 44 m in, the arms' own winding grows (gLw), so an arm that crosses the rim goes round the wall a turn and more before the throat
        float lr = log(max(r, 5.)), r2 = r * r, gLw = max(log(44. / max(r, 5.)), 0.), gK = 1.6 + 3.4 * r2 / (r2 + 4356.) + .52 * pow(gLw, .3) * step(1e-4, gLw), gG = 1.6 * lr + 1.7 * log(r2 + 4356.) - .4 * pow(gLw, 1.3);     /* NO RINGS: the spiral stays open down the wall: from the rim to where the froth dies a line winds less than half a turn */
        float gph = ((rla > 0. ? rla - 3.14159265 : rla + 3.14159265) + gG - uTime * .005 + sh) * .7957747, gid = mod(floor(gph), 5.), gw = 1.2566371 * r / sqrt(1. + gK * gK), gc = (fract(gph) - .5) * gw;
        // THE POOL IS BROKEN WATER, NO EYE AND NO RECORD. The dark comes on BY RAGGED DEGREES (the depth the colour reads wanders 2.5 m either way along the spiral: no oval with a clean
        // edge). The foam on the wall is TONGUES OF FROTH DRAWN DOWN A SLOPE: one field along the open spiral, unequal (half a metre to three and more broad), clotted, with gaps, riding down by the clock, each
        // thinning to streaks and dying at a depth of its own (the broad ones go deepest; none under 21 m); no two neighbours run alike for a quarter turn (the field changes down the wall as it changes round it);
        // no thin even line anywhere. The same field goes out over the rim onto the near slope as broad soft streaks bent with the turn (to 80 m).
        float gtn = .6 * vn(vW.xz * .7 + vec2(uTime * .05, 2.)) + .4 * vn(vW.xz * 2.3 - vec2(1., uTime * .08)), gtorn = .25 + .75 * smoothstep(.36, .62, gtn), gclot = smoothstep(.5, .66, gtn);     // one noise of the place tears the foam and clots it
        float dptR = dpt + (8. * (pn(vec2(gph * 1.6 + 9., lr * 2.5 + 2.), 8.) - .5) + 3. * (gtn - .5)) * smoothstep(1., 5., dpt);     // the dark's edge wanders 5 m either way in depth (less, and from above the dark is one round disc)
        col = mix(col, vec3(.030, .062, .115) * (.75 + .5 * sv), .8 * smoothstep(2.5, 8., dptR)); col = mix(col, vec3(.017, .036, .070) * (.8 + .4 * sv), .9 * smoothstep(7., 13., dptR)); col = mix(col, vec3(.0055, .011, .022) * (.8 + .4 * sv), .94 * smoothstep(11., 19., dpt));     /* DEPTH IS SEEN: THE WALL'S WATER DARKENS BY DEGREES ALL THE WAY DOWN: blue at 5 m, dark blue at 10, all but black from 19 m, by its own depth under the sea */     // the deep wall is dark blue water, never black (no blue-black lens in a white ring)
        col *= 1. + .55 * fineK * smoothstep(1.5, 6., dpt) * (1. - .65 * smoothstep(8., 17., dpt)) * (pn(vec2(gph * 6. + 1., lr * 14. - uTime * .03), 30.) - .5);     // THE WALLS ARE BROKEN WATER, no poured glass: torn light and dark streaks drawn out along the flow (thin across it), riding down by the clock: no smooth sheet
        float gcw = gc + 2.4 * (vn(vW.xz * .13 + 5.) - .5) * smoothstep(30., 90., r);
        float gon = smoothstep(10., 16., r) * (1. - smoothstep(92., 128., r));     /* far out an arm fades by its distance from the throat: nothing of an arm beyond 128 m of it */
        float flow = .6 * flowS(rla, lr, 9., 5., 3., sh) + .4 * flowS(rla, lr, 24., 12., 11., sh), fstr = smoothstep(.36, .68, flow + .22 * (vn(wq * 1.7 + vec2(uTime * .1, 3.)) - .5)), frim = .5 + .5 * smoothstep(28., 62., r);     // (the streaks of the round's own white water only: the dome, the disc)
        col *= 1. + .14 * (1. - smoothstep(40., 100., r)) * smoothstep(12., 30., r) * (flow - .5);     // the near slope is smooth slick water in broad soft streaks bent with the turn
        float tT = .55 * pn(vec2(gph * 3.2 + 3., lr * 2.2 + 1.), 16.) + .45 * pn(vec2(gph * 7. + 5., lr * 4.5 - uTime * .012), 35.);
        float tth = .57 + .2 * smoothstep(3., 19., dptR) + .12 * smoothstep(40., 75., r);
        float tride = smoothstep(.3, .52, .6 * pn(vec2(gph * 9., lr * 11. + uTime * .22), 45.) + .4 * vn(vW.xz * .9 + vec2(2., uTime * .1)));     // gaps and clots that ride down the tongue by the clock
        float tongue = mix(.2295 * exp(-26. * pw2(tth - .387)), smoothstep(tth, tth + .09, tT) * (.3 + .7 * tride) * gtorn, fineK) * smoothstep(10., 14., r) * (1. - smoothstep(13., 21., dptR)) * (1. - smoothstep(56., 80., r)) * (1. - smoothstep(38., 44., r));     /* A TONGUE ENDS BY 51 m FROM THE THROAT: no tongue's outer end rides out past the line itself (it passes 52 m from the throat) to lie under the lens as a pale bar */
        float dthin = smoothstep(9., 16., dpt), deepF = smoothstep(6.5, 10., dpt) * (1. - smoothstep(10., 17.5, dpt)) * mix(.196 - .122 * dthin, smoothstep(.6 + .14 * dthin, .74 + .14 * dthin, pn(vec2(gph * 4. + 7., lr * 30. - uTime * .04), 20.)) * (.55 + .45 * smoothstep(.3, .6, pn(vec2(gph * 8. + 2., lr * 6. + uTime * .1), 40.))), fineK);     /* the froth down the shaft is LONG THREADS DRAWN ROUND WITH THE FLOW (thin across it, a quarter of a turn long), no clots with holes */     // WHERE THE WATER GOES DOWN IT SEETHES: torn froth on the shaft's wall from 7 m down, to where the wall meets the bared ground (clots and gaps of the place's own noise, riding by the clock): no dark disc at the middle
        // THE ARMS FAR OUT ARE NO ROAD: beyond the near slope an arm is a bent train of torn foam: pieces a few metres to a dozen long with open water between (a noise of the water's own place), clots in
        // them, every edge soft; it thins from 92 m out and is gone by 128; NONE ENDS AT A ROCK'S FOOT: within 26 m of any stone's foot (the mountain's, a ledge's, the tail's) no arm is drawn
        float gbw = 1. + vn(vec2(gid * 3.7 + 1., lr * 7.)), gpiece = smoothstep(.47, .62, vn(vW.xz * .16 + vec2(4., uTime * .008)));     // an arm's pieces are short (3 to 7 m) and fainter: flecks along the flow, no band
        float garm = (1. - smoothstep(gbw * .5, gbw * 1.3, abs(gcw))) * gpiece * (.35 + .65 * gclot) * (.5 + .5 * gtorn) * gon * smoothstep(52., 72., r) * (1. - .6 * smoothstep(90., 160., r)) * smoothstep(8., 26., min(laceD, tailD(vW.xz)));
        // THE RIM: on the side where the strait's water comes in (the standing lip, see lipAt) WHITE WATER BREAKS OVER THE LIP AND FALLS IN: a torn white band from 2.5 m outside the crest to 3 to 11 m down the
        // inner slope (ragged, by a noise of the place), its water boiling and running inward by the clock. Elsewhere the rim stays torn and gapped; every edge of it soft (white meets dark by a torn soft edge)
        float rimR = 37. + 2.2 * sin(2. * rla + 1.3) + 1.4 * sin(5. * rla - .6), rimB = .5 + 2.6 * smoothstep(.3, .75, vn(dn * 3.3 + vec2(7., uTime * .02)));
        float lua = rla < -1.2 ? rla + 6.2831853 : rla, lipSec = smoothstep(1.55, 1.95, lua) * (1. - smoothstep(3.45, 3.85, lua)), lipIn = rimR + 1.2 - r;
        // THE LIP'S WHITE WATER IS TORN FOAM: whole in clots on the
        // standing crest, then torn into strands with dark water between (crisp torn edges: a threshold that rises away from the crest, outward over 2.5 m and down the inner slope over 3 to 11 m), drawn a little
        // longer along the water's run in than across it and riding in with it by the clock. Its three noises are laid ROUND THE THROAT (cells 1.2 by 2.6 m, 0.5 by 1.25 m and 0.2 by 0.55 m; noises of the
        // place pushed outward by the clock along each bearing would turn into a comb of thin radial streaks). It comes in unequal runs with thin places between: no one white band half round the bowl
        float lipZ = smoothstep(-2., -.2, lipIn + 1.2 * (gtn - .5)) * (1. - smoothstep(3., 11., lipIn + 5. * (vn(vW.xz * .22 + vec2(1., uTime * .1)) - .5)));
        float lpa = rla + 3.14159265 + 1.6 * lr, lipN = .34 * pn(vec2(lpa * 31.83, r * .38 + uTime * .95), 200.) + .36 * pn(vec2(lpa * 76.39, r * .8 + uTime * 1.25), 480.) + .3 * pn(vec2(lpa * 191., r * 1.8 + uTime * 1.7), 1200.);
        float lipF = vn(vW.xz * 6.1 + vec2(uTime * .5, 9.)); lipN = mix(.4 * gtn + .34 * vn(vW.xz * 2.9 + vec2(uTime * .3, 5.)) + .26 * lipF, lipN, smoothstep(-.5, 2.5, lipIn));     // outside the crest the foam's edge is the place's own noise (no strand points out against the water that comes in); the strands begin at the crest and go in and round with the turn
        float lipRun = .22 + .78 * smoothstep(.34, .56, vn(vec2(lua * 2.6 + 3., uTime * .012)));     // the lip's white water comes in unequal runs with thin places between, slowly changing on the world clock
        float lipW = lipSec * lipRun * mix(.046 + lipZ * (.144 + lipZ * (1.175 - .641 * lipZ)), smoothstep(.66 - .36 * lipZ, .76 - .32 * lipZ, lipN + .1 * (gtn - .5)) * (.72 + .28 * lipF), fineK) * (.5 + .5 * lipZ) * smoothstep(0., .12, lipZ);     // thick where it is whole, thin and grey on its strands: no flat white
        float rim = (1. - smoothstep(rimB * .3, rimB * 1.3, abs(r - rimR + 1.4 * (gtn - .5)))) * smoothstep(.4, .56, vn(dn * 2.1 + vec2(13., -uTime * .015))) * (.35 + .65 * mix(.654, gtorn, fineK)) * (1. - lipSec);
        vec3 foam = mix(mix(uFoamShade, vec3(.3, .31, .5), .5), uFoamSun, clamp(.3 + 2.2 * dot(N, SUN), 0., 1.) * sv) * .66;     // foam in the mountain's shade is pale too (a lilac grey): no dark stripe where an arm lies in shadow
        col = mix(col, max(foam, col * 1.12 + .004), clamp(.3 * garm * (.3 + .7 * smoothstep(.36, .6, vn(vW.xz * 1.9 + vec2(uTime * .2, 4.)))) + .12 * boilRim, 0., 1.));     /* an arm is faint and broken into flecks: no dashes, no wake */
        col = mix(col, foam * 1.15, clamp(.85 * rim + .9 * tongue + .95 * lipW + .6 * deepF, 0., 1.));
        // white only where it breaks: the white wave, the closing ring, the dome's skin and the seething disc, each marbled
        // with veins of open water in large slow forms
        float m = flow, m2 = vn(vW.xz * .07 - dn * uTime * .2 + 5.);     // (nothing of the round's white is drawn beyond 34 m of the throat, where the flow's own streaks marble it)
        float ring = uClosing * exp(-pw2((r - uCloseR) / 6.)) * (1. - smoothstep(22., 30., r)) * (.2 + .8 * smoothstep(.42, .62, vn(vW.xz * .11 + vec2(3., uTime * .05))));     // the closing water's white in torn patches: no closed ring
        float disc = max(uSeethe, .6 * uClosing) * (1. - smoothstep(14., 30., r)) * (.3 + .7 * smoothstep(.36, .6, vn(vW.xz * .25 + vec2(uTime * .3, 8.))));     // the cauldron: seething white while it closes and after the burst
        // the cauldron's skin: broken white on the heads that burst (cells that boil and move), dark troughs between, and
        // foam torn off it running outward in rays
        float cell = fb(vW.xz * .3 + vec2(uTime * .55, -uTime * .45)), cell2 = vn(vW.xz * .9 - vec2(uTime * .9, uTime * .6));
        float domeW = uDome * (1. - smoothstep(10., 29., r)) * (.1 + .75 * smoothstep(.45, .7, cell * .75 + cell2 * .25)) * (.45 + .55 * fstr);     // green-white water with broken foam on it, not white heaps
        float torn = uDome * smoothstep(10., 18., r) * (1. - smoothstep(24., 34., r)) * smoothstep(.5, .78, flow);     // torn along the flow: no rays, no tongues
        float white = clamp(max(ring * 1.2, max(disc * 1.1 * (1. - .6 * uDome), max(domeW, .8 * torn))) * (.4 + 1.1 * m) * (.65 + .6 * m2) - .16, 0., 1.);     // (no frothy band round the rim, no lace round the high rock's foot, no wash on the tail)
        col *= 1. - .3 * uDome * (1. - smoothstep(12., 30., r)) * (1. - smoothstep(.3, .52, cell * .75 + cell2 * .25));     // the troughs between the heads are dark water
        float shaftK = 1. - uOpen * (1. - smoothstep(7., 14., r));     // while the throat is open no white is drawn down its wall: the throat is dark water
        float pitK = mix(.35, 1., smoothstep(8., 24., r));     /* NOTHING PALE DOWN THE THROAT AT ANY SECOND OF THE ROUND: within 24 m of it the round's own white is thin torn streaks on dark water */
        col = mix(col, foam, smoothstep(.0, .45, white) * (.1 + .9 * fstr) * frim * shaftK * pitK);     // drawn out along the flow: no blots
        // the swell breaks white against the crag's foot and falls back: a band of broken water that comes and goes with the swell
        { float pulse = .5 + .5 * sin(0.0872665 * -vW.z - 0.9239978 * uTime + 1.2), reach = 1.2 + 4.5 * pulse * (.35 + .65 * smoothstep(-.7, .5, cos(rb)));     // the swell comes from the west: it breaks hardest on the faces turned to it
          float brk = .55 * vn(vW.xz * .45 + vec2(uTime * .35, -uTime * .2)) + .45 * vn(vW.xz * 1.7 - vec2(0., uTime * .5));     // the broken water's own pattern at every foot (one noise of the place and the clock)
          float sf = (1. - smoothstep(.2, reach, laceD)) * step(-3., laceD) * (.3 + .7 * pulse) * smoothstep(.42, .62, brk) * (.25 + .75 * smoothstep(.35, .6, vn(vec2(rb * 6., uTime * .06 + 2.))));     // broken surf in patches on the sea's own swell: no ring
          // WHITE WATER AT THE MOUNTAIN'S FOOT: a band of broken water 4 to 10 m broad all along the great wall's foot (the swell's own pulse; broadest on the faces turned to the
          // swell), torn by the same noise of the place and the clock, thinning outward: the mountain stands in a worked sea
          { float mD = massifD(vW.xz), mreach = 4. + 6. * pulse * (.5 + .5 * smoothstep(-.7, .5, cos(rb)));
            sf = max(sf, (1. - smoothstep(.6, mreach, mD)) * step(-3., mD) * (.5 + .5 * pulse) * smoothstep(.3, .58, brk + .25 * (1. - smoothstep(0., 2.5, mD)))); }
          float fpat = smoothstep(.4, .58, vn(vW.xz * .23 + vec2(3., uTime * .05)));     // FOAM ONLY AS BROKEN WHITE WHERE THE SWELL MEETS A FOOT: on stretches of a foot (4 m and more, with open dark water between), 1 to 3 m out: no pale band round a ledge
          // THE SURF AT A LEDGE IS TORN LACE: whole only against the stone, then thinner and thinner strands (a warped noise of the place drawn out along the swell's run,
          // riding with it by the clock), nothing beyond 4 to 9 m with the swell's pulse; its white is uneven (thick where it is whole, thin on the strands): never a pale sheet with holes in it
          float fgD = fangD(vW.xz), fz = clamp(1. - fgD / (4. + 5. * pulse), 0., 1.) * step(-2.5, fgD); vec2 fq = vW.xz + vec2(0., uTime * .35) + 1.3 * (vec2(vn(vW.xz * .37 + 3.), vn(vW.xz * .37 + 11.)) - .5);
          float lace = fb(vec2(fq.x * 1.25, fq.y * .8)), fine = vn(vW.xz * 5.3 + vec2(uTime * .6, 0.)), sfF = smoothstep(.64 - .5 * fz, .8 - .42 * fz, lace + .18 * (fine - .5)) * (.55 + .45 * pulse) * smoothstep(0., .15, fz) * max(fpat, .6);
          vec3 foamF = max(foam, vec3(.44, .48, .66));     // white water at a foot is pale in the stone's own shade too (the sky's light on it)
          col = mix(col, foamF * mix(1., .8 + .34 * fine, step(sf, sfF)), .85 * max(sf, sfF));
          // the same swell breaks on the tail's skerries and along the low rock's foot where the pool's water meets it
          float td = tailD(vW.xz); float tgp = smoothstep(.3, .5, vn(vW.xz * .19 + vec2(5., uTime * .03))), trc = .8 + (2.4 + 6. * pulse) * tgp * (.35 + .65 * vn(vW.xz * .47 + vec2(uTime * .1, 9.)));     /* the white water at a slab's foot stands in STRETCHES of the foot (5 m and more, by a noise of the place), 2 to 9 m out with the swell and torn; between them the dark water meets the stone */
          float ts = tgp * (1. - smoothstep(.2, trc, td)) * step(-3., td) * (.6 + .4 * pulse) * smoothstep(.2, .5, brk + .45 * (1. - smoothstep(0., 3., td))) * (.55 + .45 * smoothstep(.34, .62, vn(vW.xz * 3.1 + vec2(uTime * .45, 1.))));     // white surf at every slab's foot, 2 to 5 m out with the swell, torn; densest against the stone     // soft foam at a tail ledge's foot: no hard white bar, no dashes
          float la = rla, lrD = r - (42. + 2.2 * sin(2.1 * la + 1.) + 1.2 * sin(5.3 * la));
          float lw = (1. - smoothstep(.5, 4.5, lrD)) * smoothstep(-9., -3., lrD) * smoothstep(-2.03, -1.7, la) * (1. - smoothstep(1.1, 1.43, la)) * smoothstep(.3, .78, brk) * (.55 + .45 * pulse);     /* soft foam at the low rock's foot: no hard white flecks */     // BROKEN WATER UNDER THE CLIFF ONLY: a band 6 to 9 m broad at the cliff's foot, boiling in patches by the clock. It has an inner bound: no white stripes over the far half of the bowl     // the dish's white under the cliff: streaks along the flow, denser toward the rim
          col = mix(col, foamF * 1.15, clamp(.92 * ts, 0., 1.)); col = mix(col, foamF * 1.15, clamp(.8 * lw * shaftK, 0., 1.)); }     // (the low rock's foot lace is kept off the open throat's far wall while the throat is open)
        // the heaved mound and the seething disc after it: white water boiling, bright on the slopes turned to the sun
        col = mix(col, mix(uFoamShade, vec3(1., .88, .72), clamp(.35 + 2.2 * dot(N, SUN), 0., 1.) * sv), .8 * clamp(max(disc, domeW * .9) * (.45 + 1.1 * m) - .1, 0., 1.) * smoothstep(.42, .6, flow) * shaftK * pitK);     // the dome and the disc are the same streaks drawn out round them: no whole pale ellipse at any second of the round
        col *= mix(.4, 1., smoothstep(-15., -4., vW.y));     // the water down the throat is dark by its depth under the sea's level: nothing pale at the pit's bottom
        gl_FragColor = vec4(fogged(col, dist), 1.);
      }`,
  });
}

// ---- stone: one lit material for both rocks and the low rock's tail. Sun visibility and occlusion are baked per vertex (aBake.x, .y);
// aBake.z is wetness by place. Grain is in world metres on three planes, so nothing is stretched up a 240 m wall.
export function makeStoneMaterial(U, o = {}) {
  // THE GULLIES WHERE TWO BODIES OF THE MOUNTAIN MEET (from the plan: between each pair's leaning axes at 55 m, parted by their own breadths there): a place and the
  // bearing from one body to the other; the bank's vapour hangs down each (the stone's shader below)
  const GUL = [['G1', 'R1'], ['G1', 'W'], ['W', 'G2']].map(([a, b]) => { const A = MASSIF && MASSIF.find((t) => t.name === a && !t.out), B = MASSIF && MASSIF.find((t) => t.name === b && !t.out); if (!A || !B) return null;
    const y = 55, ax = A.c[0] + A.lean[0] * y, az = A.c[1] + A.lean[1] * y, bx = B.c[0] + B.lean[0] * y, bz = B.c[1] + B.lean[1] * y, D = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / D, dz = (bz - az) / D, be = Math.atan2(dx, dz);
    const ra = Math.max(A.radius(be, y), 1), rb = Math.max(B.radius(be + Math.PI, y), 1), q = D * ra / (ra + rb); return [ax + dx * q, az + dz * q, dx, dz]; }).filter((g) => g);
  const GLSL_GUL = GUL.map((g) => `gq = vW.xz - vec2(${g[0].toFixed(1)}, ${g[1].toFixed(1)}); gul = max(gul, (1. - smoothstep(2.5, 8. + 6. * mn2, abs(dot(gq, vec2(${g[2].toFixed(4)}, ${g[3].toFixed(4)}))))) * (1. - smoothstep(24., 40., abs(dot(gq, vec2(${(-g[3]).toFixed(4)}, ${g[2].toFixed(4)}))))));`).join(' ');
  const uni = { ...U, uStone: { value: new THREE.Color(o.stone || '#a8763c') }, uWeed: { value: new THREE.Color('#1d2026') }, uBarn: { value: new THREE.Color('#8d8068') },
    uCaveA: { value: new THREE.Vector3(...(o.caveA || [999, 999, 999])) }, uCaveW: { value: new THREE.Vector3(...(o.caveW || [1, 1, 1])) },
    uRough: { value: o.rough ?? 0.35 }, uColumn: { value: o.column ?? 0 }, uWall: { value: o.wall ?? 0 }, uWeedTop: { value: o.weedTop ?? 2.5 }, uBarnK: { value: o.barn ?? 1 }, uAwash: { value: o.awash ?? 0 }, uFlat: { value: o.flat ?? 0 }, uBeds: { value: o.beds ?? 0 }, uBand: { value: o.band ?? 1 }, uGate: { value: o.gate ?? 0 }, uLift: { value: o.lift ?? 0 }, uBedT: { value: o.bedT ?? 1 }, uDip: { value: new THREE.Vector3(...(o.dip || [0.34, -0.94, 0.3])) } };     // uDip: the way its beds rise on the sea (unit) and their slope
  return new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: /* glsl */`
      attribute vec3 aBake; varying vec3 vW; varying vec3 vN; varying vec3 vBake;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; vBake = aBake; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_SEA + GLSL_SKY + GLSL_FOG + GLSL_SHADOW + GLSL_NOISE + /* glsl */`
      uniform vec3 uStone, uWeed, uBarn, uSunCol, uHemiSky, uHemiGround, uBounce; uniform float uRough, uColumn, uWall, uWetPulse, uWeedTop, uBarnK, uAwash, uFlat, uBeds, uBand, uLift, uBedT, uGate; uniform vec3 uDip;
      const float WASH_LOW = ${WASH_LOW.toFixed(2)}, WASH_TOP = ${WASH_TOP.toFixed(2)}; uniform vec3 uCaveA, uCaveW, uFoamSun, uFoamShade;
      varying vec3 vW; varying vec3 vN; varying vec3 vBake;
      void main(){
        vec3 N = normalize(vN); float nLen = length(vN);     // a ledge of the shoal or the spur gives its normals at half length: its skin takes its smooth slope (flat facets would make folded card of it); the mountain's faces keep their own
        vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
        // a ledge's top and its undercut take the face's own slope, so their edges are crisp; the pipes stay smooth
        vec3 Ng = cross(dFdx(vW), dFdy(vW)); float lg = length(Ng);
        if (lg > 1e-9) { Ng /= lg; if (dot(Ng, N) < 0.) Ng = -Ng;
          if (uFlat > 1.5) { float hl = length(N.xz); N = hl > 1e-3 ? normalize(vec3(N.xz / hl * sqrt(max(1. - Ng.y * Ng.y, 0.)), Ng.y)) : Ng; }     /* a slab of stacked beds: each face's own steepness (a bed's upper face and its broken edge meet by a crisp line), its bearing round the slab the skin's smooth one (no upright ribs) */
          else N = normalize(mix(N, Ng, max(uWall * .65 * (.12 + .88 * smoothstep(.52, .6, nLen)), uFlat * mix(1., smoothstep(.2, .6, Ng.y), step(.01, uLift))))); }     /* a ledge of the shoal takes each facet's own slope on its benches only: on its steep skirt the long thin facets would be a saw of lit and dark triangles at the water */     /* the mountain's faces take two thirds of each facet's own slope: the thin facets across a swelling face make no woven grain; the arrises stand */
        if (uLift > 0.) { vec3 pl = vW * 1.1; N = normalize(N + .34 * uLift * (vec3(vn(pl.yz), vn(pl.zx + 7.), vn(pl.xy + 13.)) - .5) + .14 * uLift * (vec3(vn(pl.yz * 3.7), vn(pl.zx * 3.7 + 3.), vn(pl.xy * 3.7 + 5.)) - .5)); }     /* the shoal's ledges are rough stone: their smooth skin's slope is broken by the stone's own grain (a metre and a quarter across) */
        if (uWall > .5) { vec3 pn = vW * .3; N = normalize(N + .16 * (vec3(vn(pn.yz), vn(pn.zx + 7.), vn(pn.xy + 13.)) - .5) + .03 * (vec3(vn(pn.yz * 4.1), vn(pn.zx * 4.1 + 3.), vn(pn.xy * 4.1 + 5.)) - .5)); }     /* the fine grain in the slope is faint */     // the stone's grain: rough rock, not satin (its own metres)     // THE MASSIF IS FLAT FACES: each plane takes its own slope, so its arrises are sharp
        // secondary runnels down the high wall, three to five metres apart, in the normal
        vec2 rq = vW.xz - uRockS.xy; float rb = atan(rq.x, rq.y);
        // (no runnels in the normal: the massif's faces are planes)
        vec3 aN = abs(N); aN /= (aN.x + aN.y + aN.z);
        float g = fb(vW.xz * .45) * aN.y + fb(vW.xy * vec2(.45, .2)) * aN.z + fb(vW.zy * vec2(.45, .2)) * aN.x;
        float g2 = vn(vW.xz * 2.3) * aN.y + vn(vW.xy * 2.3) * aN.z + vn(vW.zy * 2.3) * aN.x;
        // NO DRAWN SEAM: no dark seam is drawn across the low rock (a
        // line a metre and a half broad every 22 m of the stone's height, dipping six degrees: one line across the whole rock, 7 to 11 m up, would be a wire or a seam). Its beds are its own ledges, in its skin.
        float seam = 0., wallWet = 0.;
        // THE HIGH ROCK'S FINE CROSS GRAIN IS A FAINT MOTTLE (no woven cloth, no bark): its fine noise a quarter, its
        // drawn-out grain three tenths (the rest a broad soft shade 15 m and more across); the broad wavy beds and the cracks stand
        float gW = mix(g, .5 + .8 * (vn(vec2(.07 * vW.x + .05 * vW.z, vW.y * .06) + 3.) - .5), .7 * uWall);
        vec3 alb = uStone * (.74 + .46 * gW + (.12 + uRough * .3) * (1. - .75 * uWall) * (g2 - .5)) * (1. - (.34 - .16 * uWall) * seam);
        // THE TAIL'S LEDGES SHOW THEIR BEDS (no smooth draped skin): a soft dark parting every two metres or so, dipping as the
        // ledge's own top (it rises toward the way out), wandering, each bed a faint shade of its own: layered stone, no cloth
        if (uBeds > 0.) { float tu = uDip.x * vW.x + uDip.y * vW.z, tbw = vW.y - uDip.z * tu + .7 * uBedT * vn(vec2(tu * .22, vW.y * .3 + 5.)), tbs = tbw / (2.1 * uBedT) + .25 * sin(tbw * .9 + .3 * tu) + 1.5 * uLift * vn(vec2(tbw * .55 + 3., tu * .05));     /* the shoal's flags are of unequal thickness (0.3 to 1.3 m) */
          if (uLift > 0.) { float cs = .317 * vW.x + .948 * vW.z; alb *= 1. - .6 * uLift * (1. - smoothstep(0., .045, abs(vn(vec2(cs * .31 + 2., floor(tbs + .5) * .37 + .2 * tbs)) - .5))); }     /* the shoal's flags are broken across: wandering cracks that step from bed to bed (no straight joint, nothing square) */
          float pbr = uLift > 0. ? smoothstep(.3, .62, vn(vec2(tu * .3 + floor(tbs) * 7.13, vW.y * .9 + (uDip.y * vW.x - uDip.x * vW.z) * .27))) : 1.;     /* a parting is no ruled line: it is broken along its length (3 m and more of it, then none) */
          alb *= (.9 - .14 * uLift + (.2 + .3 * uLift) * fract(sin(floor(tbs + .5) * 12.9898) * 43758.5453)) * (1. - (.34 + .4 * uLift) * pbr * uBeds * (1. - smoothstep(.0, .1 + .08 * uLift, abs(fract(tbs) - .5))));
          if (uLift > 0.) N = normalize(N + vec3(0., .5 * uLift * pbr * (smoothstep(.5, .62, fract(tbs)) - smoothstep(.38, .5, fract(tbs))) * (1. - smoothstep(.0, .14, abs(fract(tbs) - .5))), 0.)); }     /* the shoal's flags read as beds: each its own tone (a quarter either way), its parting darker, and a step of the face's slope at each parting (the upper flag's edge takes less of the sky, the lower one's top more) */     /* the shoal's low ledges are thin flags (uBedT: beds 0.6 m apart), their partings darker: layered stone in the mountain's shade */
        // stains running down the polished wall: dark wet streaks two or three metres wide, from a seam or a ledge downward
        // (no stains, no dots, no cracks drawn on the massif: nothing on its stone is dotted, beaded or white)
        // the high rock's slabs are not one tone: each great face its own shade of the same dark stone, and long dark cracks that run with its lean
        if (uWall > .5) { alb *= .8 + .36 * fb(vW.xz * .045 + vW.y * .027);
          // NO GRID ON ANY FACE: the part's own beds (BED_T, BED_U: dipping 20 degrees; 8 to 34 m thick, unequal), thrown 3 m at a few slanting faults 30 to 45 m apart, so
          // each bed line is long, slanting and of broken length. One soft dark parting between two beds, broken along its length; each bed a faint shade of its own. NO JOINT IS DRAWN: no upright line, nothing
          // square to the beds. It reads the stone's own metres, nothing else.
          float ju = .82 * vW.x - .57 * vW.z + .9 * vW.y, jf = (sin(ju * .035 + .6) + .5 * sin(ju * .013 + 2.)) * 1.2;
          float bw = vW.y - .364 * (.82 * vW.x - .57 * vW.z) + 3.1 * (floor(jf) + smoothstep(.25, .75, fract(jf))) /* the joints' throw taken up along the face, as the skin's own beds are */, bs = bw / 13. + .3 * sin(bw * .075) + .06 * sin(bw * .23 + 2.), bfr = fract(bs), bdv = .0769 + .0225 * cos(bw * .075) + .0138 * cos(bw * .23 + 2.);
          float part = (1. - smoothstep(.1, 1.1, min(bfr, 1. - bfr) / bdv)) * .5;     // one soft unbroken line between two beds: it is not broken into a row of dark notches
          alb *= (.93 + .14 * fract(sin(floor(bs) * 12.9898) * 43758.5453)) * (1. - mix(.4, .5, smoothstep(0., .25, max(dot(N, SUN), 0.) * vBake.x)) * part);
          // THE GREAT FACES HAVE FORM NEAR THE EYE: inside each great bed THIN BEDS of unequal thickness (2 to 11 m: one to five units of 1.5 to 3.5 m, see below; the same dip, thrown a third as far at
          // the same faults: by the whole throw they waved across a great face as the grain of wood), each a tone of its own, its upper edge in the shade of the bed over it and its lower part turned a little to the sky (a stepped face: depth and shadow), a thin dark parting broken
          // along its length, one bed in five weathered back and darker; and DARK WET STREAKS down the face from the partings (two to four metres broad, of unequal length, by a noise of the place). THE THIN BEDS are
          // filtered to its own mean where a thin bed is under two pixels (a pixel's footprint: no shimmer far off, crisp near) and, on top of it, go out with the eye's own distance to the stone (70 to 190 m: from far the mountain keeps its great beds alone); THE WET STREAKS go out with the eye's distance alone (60 to 170 m: no footprint term stands under them); in some great beds they are all but absent (massive stone, by a noise of the height). No upright joint, nothing square to the beds, nothing white.
          { float bw0 = vW.y - .364 * (.82 * vW.x - .57 * vW.z) + 1.1 * (floor(jf) + smoothstep(.25, .75, fract(jf))), sb = bw0 / 2.3 + 1.3 * vn(vec2(bw0 * .05, 1.)) + .3 * vn(vec2(ju * .04, bw0 * .1)), fwS = fwidth(sb), dw = (1. - smoothstep(.08, .3, fwS)) * (1. - smoothstep(70., 190., dist)) * (.3 + .7 * smoothstep(.3, .5, vn(vec2(bw * .021 + 7., ju * .005)))), sf = fract(sb), sid = floor(sb), sh2 = fract(sin(sid * 37.71 + 2.) * 24634.63);
            // A PARTING STANDS ONLY AT SOME LEVELS (a run of equal thin beds is a wall of courses) (its own number: a little over half of them), so the beds are one to five units thick
            // (2 to 11 m), and where none stands the stone goes through without a line, a step or a change of tone
            float pB = step(.46, fract(sin(sid * 91.17) * 43758.5453)), pA = step(.46, fract(sin((sid + 1.) * 91.17) * 43758.5453));
            float sline = (pB * (1. - smoothstep(0., .035 + fwS, sf)) + pA * (1. - smoothstep(0., .035 + fwS, 1. - sf))) * smoothstep(.28, .55, vn(vec2(ju * .08 + sid * 7.13, sid * 1.7)));
            alb *= mix(1., (.9 + .2 * vn(vec2(sb * .37, 3.))) * (1. - .2 * pA * smoothstep(.5, 1., sf)) * (1. + .1 * pB * (1. - smoothstep(0., .45, sf))) * (1. - .16 * pA * pB * step(.7, sh2)), dw) * (1. - .42 * sline * dw);
            N = normalize(N + vec3(0., (.21 * pB * (1. - smoothstep(0., .5, sf)) - .29 * pA * smoothstep(.4, 1., sf)) * dw, 0.));
            float stk = smoothstep(.5, .82, .7 * vn(vW.xz * .3 + 3.) + .3 * vn(vW.xz * .9)) * smoothstep(.35, .7, vn(vec2(dot(vW.xz, vec2(.2, .13)), vW.y * .04 + 5.))) * (.25 + .75 * smoothstep(.2, .7, 1. - N.y)) * (1. - smoothstep(60., 170., dist));
            alb *= 1. - .17 * stk; wallWet = .5 * stk; } }     /* the mountain's faces toward the line stand in shade: a parting is a fifth darker than its bed there, so its beds are seen in the shaded wall */     /* ON A FACE THE SUN IS ON the parting between two beds is a quarter darker than the bed at its middle: the slab's bed lines are these and the ramps' own tone. It reads the stone's own slope to the sun and its baked light */     // matt stone, a little unequal in tone by place (large and soft)
        // (no pale veins on the high rock: thin pale lines on a dark face are like writing, and nothing here is lettered)
        // the tide band: weed black to the old waterline, a pale barnacle line over it
        float yb = vW.y + .5 * (g2 - .5) * (1. - .8 * uColumn);
        vec2 pw = vW.xz - PC; float pfw = degrees(atan(pw.y, pw.x));
        if (uColumn > .5) yb += 3.2 * (vn(vec2(pfw * .09 + 2., 7.)) - .5) + .5 * (vn(vec2(pfw * .5, 3.)) - .5);     /* NO ROW OF FLAMES: the fringe's upper edge wanders slowly (8 m and more along the rock for a rise): one long soft line, no upright licks of lit stone in the dark */     /* the low rock's dark fringe ends upward in a soft uneven line: no saw (its edge is 2.4 m soft) */     // the wet foot of unequal height: it wanders 2.8 m up and down along the rock    // the low rock's tide band wanders along the rock: no ruled edge
        float weed = 1. - smoothstep(uWeedTop - .5 - 1.2 * uColumn, uWeedTop + .4 + 1.2 * uColumn, yb);
        if (uWall > .5) weed *= .65 * (1. - .85 * smoothstep(.25, .7, N.y));     // the weed hangs on a rock's sides: its washed top is bare wet stone
        // THE LOW ROCK'S FOOT IS BROKEN: its weed stands in TUFTS (patches of the foot, by a noise of the
        // bearing about the pool and the height: bare wet stone between them), pale; the stone's wetness is a GRADIENT (darkest at the water, drying out over five metres, its upper edge uneven);
        // and white water stands higher and in more stretches on its waterline (below)
        if (uColumn > .5) weed *= .92 * mix(.18, 1., smoothstep(.34, .62, .6 * vn(vec2(pfw * .31 + 9., vW.y * .22)) + .4 * vn(vec2(pfw * 1.1, vW.y * .6 + 3.))));
        float barn = smoothstep(uWeedTop - .2, uWeedTop + .3, yb) * (1. - smoothstep(uWeedTop + 1.1 + uColumn, uWeedTop + 1.9 + uColumn, yb));
        alb = mix(alb, uBarn * 1.15, (.55 + .2 * uColumn) * barn * uBarnK); alb = mix(alb, mix(uWeed * 1.25, vec3(.1, .092, .05), .7 * uColumn), weed);     // the low rock's fringe is weed-brown and olive
        if (uColumn > .5) {                                             // dark red-brown weed hanging in bands from the old waterline and from each step's lip
          float hang = 0.;
          for (int k = 0; k < 4; k++) {                                 // each band hangs from a lip of its own height and to its own length, in tufts
            float fk = float(k), ln = vn(vec2(pfw * .21 + 13. * fk, 2.)), lipY = .5 - 3.7 * fk + 2.4 * (ln - .5), len = .5 + 3.4 * vn(vec2(pfw * .8 + 7. * fk, 5.)) * smoothstep(.25, .6, 1. - ln);     /* the tufts' gaps read the lip's own noise */
            float dn = lipY - vW.y; hang = max(hang, step(0., dn) * (1. - smoothstep(len * .55, len, dn + .5 * vn(vec2(pfw * 6., fk)))));
          }
          alb = mix(alb, vec3(.07, .05, .024) * (.6 + .9 * g2), .3 * hang * (.4 + .6 * smoothstep(-9., -3., vW.y)));     // the tufts thin out downward
          float grn = smoothstep(-24., -18., pfw) * (1. - smoothstep(-2., 4., pfw)) * smoothstep(4., 8., vW.y) * smoothstep(.36, .58, .6 * vn(vW.xz * .22 + 3.) + .4 * vn(vW.xz * .9));
          alb = mix(alb, vec3(.07, .105, .045), .7 * grn);     // green on the slumped slope, in patches (the stone's own bearing about the pool and height)
        }
        float wet = clamp(max(max(vBake.z, wallWet), max(weed * (1. - .35 * uColumn), uColumn * .9 * (1. - smoothstep(-2.5, 3.2, yb + 1.6 * (vn(vec2(pfw * .7, 2.)) - .5))))), 0., 1.);    // the bared foot: the rock's own stone, wet and darker
        alb *= mix(1., .58 + .06 * uWall, wet);
        float sunV = vBake.x * mix(1., columnShade(vW), uColumn), ao = vBake.y;
        float ndl = max(dot(N, SUN), 0.);
        // THE SHADED STONE CARRIES FORM: out of the sun a face takes the sky it is turned to. The sky's cool light from above (its upper faces lighter, its under sides
        // darker); the warm glow of the sun's half of the sky on every face that leans toward that bearing, the dusk's blue on the faces turned from it; and the lit sea's warm light from
        // below on the stone's lowest forty metres (the strait beyond the mountain's shadow lies in the sun: by the face's own slope toward it and its height). By the stone's own slope and place alone.
        float skyUp = smoothstep(-.55, .75, N.y);
        vec3 hemi = mix(uHemiGround * .62, uHemiSky * 1.22, skyUp) * 1.1;
        hemi += (vec3(.50, .27, .15) * pow(max(dot(N, vec3(SUNH.x * .93, .36, SUNH.y * .93)), 0.), 1.5) + vec3(.07, .10, .22) * max(dot(N, vec3(-SUNH.x * .96, .28, -SUNH.y * .96)), 0.)) * (.35 + .65 * max(uWall, .8 * uLift));
        float bn = max(dot(N, vec3(.74, -.52, -.42)), 0.) * (1. + 1.6 * uWall * (1. - smoothstep(4., 44., vW.y)));
        vec3 light = uSunCol * 3.4 * ndl * sunV + hemi * ao * (1.25 + 1.2 * uWall) + uBounce * bn * .2 * ao;     // (not read below: the colour is made from its parts)
        // the stone is gold in the sun by its own colour; out of the sun it gives back the dusk's sky, blue-violet, as a
        // paler stone would (the shaded sides and every cast shadow read cold against the lit faces)
        vec3 albS = mix(alb, vec3(dot(alb, vec3(.35, .5, .15))) * vec3(1.3, 1.2, 1.4), .7);
        vec3 col = alb * (uSunCol * 3.4 * ndl * sunV + uBounce * bn * (.2 + .5 * uWall) * ao) + mix(mix(albS, alb, .35 * max(uWall, uLift)) * .85, alb, smoothstep(.0, .22, ndl * sunV)) * hemi * ao * (1. + 2.1 * max(uWall, uLift)) * (1. + .4 * uWall * (1. - smoothstep(3., 12., vW.y)));     /* low stone by the sea takes the sea's and the sky's light in its shade: a near ledge is stone, not a black mass */     // the crag's shaded faces take the sky's cool light: form reads in shade
        // THE SHOAL'S STONE IS THE MOUNTAIN'S STONE: out of the sun its shade takes the stone's own colour
        // as the mountain's does and is drawn half way to a cool grey-blue three tenths lighter than itself (it stands at the mountain's shade's own lightness, no more saturated than it)
        if (uLift > 0.) col = mix(col, vec3(dot(col, vec3(.3, .5, .2))) * vec3(.93, .98, 1.1) * 1.3, .5 * (1. - smoothstep(.0, .22, ndl * sunV)));
        // THE GATE'S STONE STANDS AGAINST THE LOW SUN: its faces toward the line are turned from the sun, so their light is the
        // sky's and the sea's, by each face's own slope and bearing: a dusk mauve from above (a bed's upper face lighter than the face under it: the beds read in the shade), the sun's own warm sky on what
        // leans toward its bearing, the dusk's blue only on what is turned from it, the lit sea's warm light from below on the lowest stone; AN EDGE SEEN AGAINST THE SUN IS ALIGHT (a face all but edge on
        // to the eye, turned toward the sun: by the eye's angle to the face and to the sun); and THE AIR TOWARD THE SUN IS BRIGHT: with distance the stone goes over into the sky's own colour on that
        // bearing (a far stack is a pale shape in the sun's haze, a near one dark and whole). By the stone's slope and place and the eye's own place: nothing of a still or a seed.
        if (uGate > 0.) { float lumG = dot(alb, vec3(.35, .5, .15)), toS = dot(N.xz, SUNH), up = smoothstep(-.2, .85, N.y);
          vec3 albG = mix(alb, vec3(lumG) * vec3(1.14, .98, 1.), .5);
          vec3 hemiG = mix(vec3(.085, .07, .085), vec3(.30, .245, .31), up) * (.75 + .25 * smoothstep(-1., .2, toS)) + vec3(.5, .27, .14) * pow(max(dot(N, vec3(SUNH.x * .93, .36, SUNH.y * .93)), 0.), 1.5) + vec3(.035, .05, .11) * max(-toS, 0.) * (.4 + .6 * up);
          hemiG += vec3(.30, .17, .08) * max(-N.y + .35, 0.) * (1. - smoothstep(1., 9., vW.y)) * smoothstep(-.3, .6, toS);     // the lit sea under the sun, from below
          float nv = max(dot(N, V), 0.), agS = max(dot(-V, SUN), 0.), rimG = pow(clamp(1. - nv, 0., 1.), 3.) * smoothstep(.25, .95, agS) * smoothstep(-.1, .45, toS) * (.55 + .9 * g2);
          // AGAINST THE SUN THE GATE'S STONE IS DARK AND CRISP: where the eye looks toward the sun (within 40 degrees of it, wholly within 14) a shaded
          // face shows 0.55 of the sky's light it takes (the eye is filled by the sun: by the eye's angle to the sun alone); an edge is alight only where its face is turned toward the sun's bearing (no pale
          // upright streak inside a stack's outline on a joint seen edge on)
          col = alb * uSunCol * 3.4 * ndl * sunV + mix(albG, alb, smoothstep(.0, .22, ndl * sunV)) * hemiG * (.3 + .7 * ao) * 2.3 * mix(1., .55, smoothstep(.766, .97, agS));
          col += uSunCol * (.55 + 1.1 * up) * rimG * (.35 + .65 * ao) * mix(vec3(lumG) * 1.6 + .08, vec3(1.), .25); }
        // WHERE THE STONE MEETS THE SEA (the mountain, its blocks, the ledges, the tail): A WET BAND of unequal height (1 to 4 m, by a noise of the place), darker than the dry stone, its
        // upper edge soft and uneven: no clean hard line. No white is drawn on their stone (the foam about a foot is the sea's own soft surf). THE LOW ROCK'S WATERLINE lies under broken foam that comes and goes with the swell's pulse (below)
        float bandK = 0.;
        if (uColumn < .5) { float fbr = vn(vec2(vW.x * .31 + vW.z * .23, 3.)), fbr2 = vn(vec2(vW.x * 1.3 - vW.z * 1.1, 7.));
          float wetTop = uBand * mix(1.1 + 2.4 * fbr + .8 * fbr2, 2.4 + 2.8 * vn(vec2(vW.x * .083 + vW.z * .061, 3.)) + .5 * fbr, uWall), wsoft = (.7 + .6 * uWall) * max(uBand, .55); bandK = 1. - smoothstep(wetTop - wsoft * (1. + 1.6 * uGate), wetTop + wsoft * (1. + .6 * uGate), vW.y); col *= mix(.5 + .16 * uGate + .22 * uLift, 1., 1. - bandK);     // on the great wall the band stands 2.4 to 5.7 m, its upper edge a slow soft line (a finer noise makes a row of dark points of it)
          }     // no white is drawn on a ledge's foot: the stone keeps its dark wet band alone; the foam about a foot is the sea's own soft surf
        else { float dy = vW.y - seaH(vW.xz), fpL = .5 + .5 * sin(0.0872665 * -vW.z - 0.9239978 * uTime + 1.2);     // the low rock's own waterline, where the level water, the funnel's wall and the rock meet, lies under broken foam (the sea's own height at the place, the swell's pulse): no ruled line
          float fK = (1. - smoothstep(.2, .6 + 1.3 * fpL * (.4 + .6 * vn(vec2(pfw * .8, 6.))), dy)) * smoothstep(-.5, -.1, dy) * smoothstep(.3, .55, vn(vec2(pfw * .25, uTime * .12))) * (.45 + .55 * vn(vec2(vW.x * 1.1 + vW.z * .8, vW.y * 1.5 + uTime * .8)));
          col = mix(col, max(mix(uFoamShade, uFoamSun, sunV) * .72, vec3(.4, .43, .6)), .8 * fK); }
        if (uAwash > .5) {                                              // a stone set awash (uAwash): each crest of the swell that passes sheets white over it and drains off (world clock). NO STONE OF THIS WORLD IS SET AWASH: this does not run
          float ap = .5 + .5 * sin(0.0872665 * -vW.z - 0.9239978 * uTime + .6), lvl = WASH_LOW + (WASH_TOP - WASH_LOW) * ap;
          float sheet = (1. - smoothstep(lvl - 2.2, lvl, vW.y)) * (.5 + .5 * vn(vec2(vW.x * .7 + vW.z * .3, vW.y * .6 + uTime * 1.6)));
          float drain = (1. - smoothstep(lvl, lvl + 2.2, vW.y)) * (1. - smoothstep(WASH_TOP - .4, WASH_TOP, vW.y)) * (1. - ap) * smoothstep(.45, .75, vn(vec2((vW.x + vW.z) * 1.3, vW.y * .25 + uTime * 2.2)));
          col = mix(col, mix(vec3(.7, .73, 1.), vec3(1., .9, .74) * 1.1, sunV), clamp(.95 * sheet + .85 * drain, 0., 1.));
        }
        // wet stone: the sun's long highlight on lit ribs, a cold sheen from the sky in shade
        vec3 R = reflect(-V, N);
        float F = .03 + .97 * pow(clamp(1. - dot(N, V), 0., 1.), 5.);
        vec3 Rs = R; Rs.y = abs(Rs.y);
        vec3 skyR = skyPlain(normalize(Rs + vec3(0., .2, 0.)));
        col += wet * (.35 + .65 * ao) * (F * .42 * skyR + uSunCol * 2.2 * sunV * pow(max(dot(R, SUN), 0.), 18.) * .5 * (1. - .8 * uRough));
        col += bandK * (.035 + .6 * F) * (skyR + sunAir(normalize(Rs + vec3(0., .2, 0.)))) * (.45 + .55 * ao);     // the wet band at the sea gives back the sky: a sheen low down on every foot
        if (uWall > .5) col += wet * smoothstep(.3, .8, N.y) * skyR * .14;     // a wet top gives back the sky's light (the stone's own slope and wetness)
        if (uLift > 0.) { vec3 Rg = normalize(Rs + vec3(0., .12, 0.)); col += uLift * smoothstep(.5, .9, N.y) * (.07 + .93 * pow(clamp(1. - dot(N, V), 0., 1.), 3.)) * mix(vec3(dot(skyPlain(Rg), vec3(.3, .5, .2))) * vec3(.95, 1., 1.08), skyPlain(Rg), .45) * (.5 + .5 * ao) * (.55 + .45 * wet) * .26 + uLift * smoothstep(.5, .9, N.y) * (.07 + .93 * pow(clamp(1. - dot(N, V), 0., 1.), 3.)) * (sunAir(Rg) + mix(uRose, uGold, .4) * .3 * (1. - smoothstep(.0, .4, Rg.y))) * (.5 + .5 * ao) * (.55 + .45 * wet) * .5; }     /* a wet stone, no polished sheet: the mirror gives back a quarter of the sky's own colour, and that half way to grey; the sun's glow and the lit bank on the rim stand at a half */     // THE SHOAL'S WET RAMPS GIVE BACK THE LOW SKY: a bed's upper face is a wet mirror at the eye's low angle (the sky's own colour on the bearing it mirrors, the sun's glow, the lit bank on the rim); by the stone's own slope and the eye's angle to it
        if (uBeds > 0.) col += smoothstep(.45, .85, N.y) * (.05 + .55 * F) * (skyR + sunAir(normalize(Rs + vec3(0., .2, 0.)))) * (.45 + .55 * ao) * (.4 + .6 * wet);     // A BED'S WET UPPER FACE GIVES BACK THE LOW SKY: a sheen on every bench and top, brightest toward the sun's half of the sky (the stone's own slope, the eye's own angle to it: a mirror's law)
        // the polished wall: a broad sheen of the low sun on its smooth faces, which walks across them as the eye passes
        // (no broad sheen on the massif: it is matt stone, not satin)
        // the low rock's foot: bared and streaming while the pool is open, white water pouring from its sea caves; closed,
        // the caves breathe white with the swell
        if (uColumn > .5) {
          float pf = pfw;     // the bearing about the pool (asked once, above)
          vec3 cd = abs(vec3(pf) - uCaveA) * .75 / uCaveW;
          float cav = 1. - smoothstep(.45, 1.1, min(min(cd.x, cd.y), cd.z));
          // (no white sheet hangs off the bared foot and none stands in the cave mouths: no curtain
          // in a doorway, no pale slab in an opening; the foam where the pool meets the foot is the sea's own)
          float low = 1. - smoothstep(-.5, 2., vW.y);
          col *= 1. - .2 * cav * low;     // a cave's mouth is a little darker at the water
          float mistB = uOpen * (1. - smoothstep(-15.5, -10., vW.y)) * (.4 + .6 * vn(vec2(pf * .4 + uTime * .12, vW.y * .3)));
          col = mix(col, mix(uFoamShade, uFoamSun, .45) * .8, .7 * mistB);
          // THE POOL'S LIGHT ON THE ROCK: the funnel's white water and its lit teal lie in the sun before the rock's inner wall, and give their light back to every face
          // turned to the pool, most low down (by the face's own slope toward the throat and its height); and THE SUN RAKES THE ROCK'S TOPS: an upper face in the sun takes more of it than its low
          // angle gives a smooth stone (the rough top's ribs stand up into the light). By place and slope alone.
          vec2 tp = PC - vW.xz; float tl = max(length(tp), 1.); float pk = max(dot(N.xz, tp / tl), 0.) * (1. - smoothstep(6., 40., vW.y)) * (1. - smoothstep(60., 95., tl)) * columnShade(vec3(PC.x, 0., PC.y));
          col += alb * (vec3(.62, .50, .34) * .95 + vec3(.10, .30, .28) * .45) * pk * (.6 + .4 * ao);     /* the pool's water and its white lie in the sun at every second: their light on the faces turned to it is strong, to 40 m up */
          col += alb * uSunCol * 3.4 * .16 * smoothstep(.35, .85, N.y) * sunV;
        }
        // the high rock is black sea-stone: wet basalt gives back the sky more than the sun's own colour, so its lit faces
        // stay dark grey with a warm edge on the sunward shoulder, never brown (a property of the stone, the same from anywhere)
        if (uWall > .5) col = mix(col, vec3(dot(col, vec3(.3, .55, .15))) * vec3(.94, .98, 1.06), .3);     // a dark grey-brown stone of the low rock's family: warm in the sun, cold in shade
        // THE MOUNTAIN'S HEAD IS IN THE CLOUD AND IS NOT DRAWN THERE: from 64 to 86 m up (a torn foot
        // that drifts on the world's clock) the stone goes over into the cloud's own slate across some 15 m of height, and above that it is not drawn at all (its skin is left out by height,
        // torn by the stone's own bearing and height), so what stands there is the cloud that wraps the rock: no point is seen from any place, no pale band and no dark cap stands where it ends.
        // By height alone. (Stone drawn above the cloud's foot is a pale column against the dark cloud behind it.)
        if (uWall > .5) { float mn = fb(vec2(rb * 2.2 + 3., vW.y * .028 - uTime * .008)), mn2 = vn(vec2(rb * 7. + 1., vW.y * .07 - uTime * .01)), m0 = 64. + 14. * mn + 8. * mn2;
          float mistS = max(smoothstep(m0, m0 + 22., vW.y), .4 * smoothstep(70., 100., vW.y) * smoothstep(.52, .78, vn(vec2(rb * 3. - uTime * .012, vW.y * .05 + uTime * .006))));
          if (mistS + .12 * (vn(vec2(rb * 5., vW.y * .06)) - .5) > .8) discard;     // the skin's end is one soft slow line inside the cloud (no fringe of fine upright shreds)
          // the bank's body is this same dark slate (the world's puffs), so the stone going over into it is lost in it; and TONGUES OF VAPOUR HANG DOWN THE GULLIES: at
          // the gullies between the bodies (GUL above, from the plan), never on an open face (no pale upright streaks on the faces)
          float gul = 0.; vec2 gq; ${GLSL_GUL}
          float wisp = .78 * gul * smoothstep(m0 - 44., m0 - 12., vW.y) * (.4 + .6 * vn(vec2(rb * 9., vW.y * .09 - uTime * .012)));     // in the gullies where two bodies meet the vapour lies 30 to 40 m lower, thinning downward, drifting
          col = mix(col, vec3(.062, .068, .102) * (.85 + .3 * mn), max(smoothstep(0., .7, mistS), wisp)); }
        if (uGate > 0.) { vec3 hd = normalize(vec3(-V.x, .05 + .5 * max(-V.y, 0.), -V.z)); float agH = max(dot(hd, SKSUN), 0.); vec3 hzc = skyPlain(hd); col = mix(col, mix(hzc, vec3(dot(hzc, vec3(.3, .5, .2))), .3) * .78, (1. - exp(-dist / 1800.)) * (.3 + .7 * agH * agH)); }     /* the haze comes on over 1800 m: the stacks beyond the way out, 150 to 450 m off, stay dark and whole */     // the sun's haze between the eye and the gate's stone
        gl_FragColor = vec4(fogged(col, dist), 1.);
      }`,
  });
}
// THE BUILD'S ASKS, BY COUNTED WORK: every stretch of the build adds what it costs (in thousandths of a millisecond, measured on this world in node and in the
// page, a cold build; no clock is read) to one meter, and the engine is asked (ctx.yield) when the meter has run STEP_US, 14 ms of counted work. Why 14: every real hand-back waits for the page's next frame (16.7 ms), so
// the build's time is its pieces times a frame whatever their work, and a piece is made nearly a frame long. EVERY ask of the build goes through this meter, the plain asks between the loops too, each with its
// own measured cost: about 112 pieces, 12 to 13 ms in the middle and 21 to 31 at the longest (tried in the page at 13, 14, 15 and 16 ms: at 14 the build is shorter than at 13 and its longest piece is as long). tick() is asked BEFORE work of its cost (that work
// stands in the piece that follows) and tock() AFTER it (a march's steps are known when it is done; the kit's and the ship's own asks come after their work); each returns the engine's promise when it asks and nothing
// otherwise; first() is the build's first ask, before any work. The costs are typed where they are asked, by the body where the bodies differ (code run for the first time runs two to four times slower: the first tower,
// the first slab, the first ledge, the great body: TOWER_US, SLAB_US and the callers' costs say them): measured numbers of work, which place nothing and change nothing built. The dear laws themselves (a tower face's
// offset, the low rock's cliff and top) add their own cost to the meter where they are called, so a loop that calls them needs to add only its own small cost. (The meter, tick, tock and first stand at the module's head.)
// a swept or gridded surface: cols x rows points from at(i, j) -> [x, y, z], indexed, smooth normals; wrap closes the columns; cost: what one place costs (see tick)
export async function gridGeometry(ctx, cols, rows, at, wrap = false, flip = false, cost = 5) {
  const nc = wrap ? cols : cols + 1, pos = new Float32Array(nc * (rows + 1) * 3), idx = new Uint32Array(cols * rows * 6), p = [0, 0, 0];
  for (let j = 0, k = 0; j <= rows; j++) {
    for (let i = 0; i < nc; i++, k += 3) { const w = tick(ctx, cost); if (w) await w; at(i, j, p); pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2]; }     // the meter is asked at every place and answers nothing until a piece's work is counted (by count: the gate allows no clock in a world's files)
  }
  await tick(ctx, 20);
  for (let j = 0, k = 0; j < rows; j++) { const w = tick(ctx, 0.02 * cols); if (w) await w; for (let i = 0; i < cols; i++) { const a = j * nc + i, b = j * nc + (i + 1) % nc, c = a + nc, d = b + nc;
    if (flip) { idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; } else { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; } } }
  await tick(ctx, 78);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---- the low rock: a crescent ridge round the pool's east and south sides, in polar measure about the pool's centre -------
// f is the bearing about PC in degrees: 0 toward +X (south), -90 toward -Z (east), +90 toward +Z (west).
const TOPS = [[-116, -5], [-108, -5], [-101, 9], [-95, 19], [-88, 23], [-70, 29], [-45, 35], [-22, 33], [0, 30], [25, 22], [45, 16], [56, 8], [65, 4], [72, 1], [82, -5]];
export function makeLowRock(noise, rng) {
  const topT = (f) => { if (f <= TOPS[0][0]) return TOPS[0][1]; for (let i = 1; i < TOPS.length; i++) if (f <= TOPS[i][0]) return TOPS[i - 1][1] + (TOPS[i][1] - TOPS[i - 1][1]) * sst(TOPS[i - 1][0], TOPS[i][0], f); return TOPS[TOPS.length - 1][1]; };
  // THE LOW ROCK IS THREE OR FOUR UNLIKE STRETCHES AND ITS WEST END IS BROKEN DOWN: from the east horn (with the fig) a FLUTED FACE (bearings -95 to -22
  // about the pool), then a SLUMPED SLOPE lying back at 53 degrees with green on it and the crest sagged 6 m (-20 to 2), then a LEDGED SLOPE going back in steps of 3.2 m a bed (5 to 34), then a
  // CUT BAY 7 m deep, its crest 4 m lower (38 to 54), and THE WEST END (from 44 on) broken into blocks 2 m and more, its top line stepped unequally down to the water: no smooth rounded lobe.
  // The top line is broken in steps of unequal length (5 to 9 m) and height (to 2.2 m) along the whole rock but the horn. By place; none of it nearer the line than the rock's plan.
  const offHorn = (f) => sst(-100, -88, f);
  const wS2 = (f) => sst(-24, -17, f) * (1 - sst(-1, 5, f)), wS3 = (f) => sst(3, 9, f) * (1 - sst(30, 37, f)), wS4 = (f) => sst(37, 41, f) * (1 - sst(50, 55, f)), wEnd = (f) => sst(44, 56, f);
  const stepN = (f) => noise.n2(Math.floor((f + 10 * noise.n2(f * 0.05, 8.8)) / 17) * 3.7, 6.1) * offHorn(f) * (1 - sst(76, 82, f));     // THE CREST'S NOTCHES ARE FEWER AND UNEQUAL: a step every 9 to 25 degrees of the rock's bearing (no row of teeth)
  const top0t = (f, t) => { METER += 0.6; return t - 6 * wS2(f) * sst(0, 12, t) - 4 * wS4(f) * sst(0, 10, t) + 2.2 * stepN(f) * sst(2, 10, t); }, top0 = (f) => top0t(f, topT(f));     // nothing made twice: the top's own height is taken once
  const ends = (f) => sst(-112, -100, f) * (1 - sst(76, 82, f));
  const top = (f) => top0(f) + (1.6 * noise.n2(f * 0.09, 3.1) + 0.9 * noise.n2(f * 0.31, 7.7)) * ends(f);
  const rc0 = (f) => { const a = f * Math.PI / 180; return 42 + 2.2 * Math.sin(2.1 * a + 1) + 1.2 * Math.sin(5.3 * a); };
  // TWO SEA CAVES, far apart and unlike, never a pair: in the middle of the face a high narrow crack, 44 m from it along
  // the face a low wide arch at the water (the seed deals a little of each)
  const caves = [{ f: -40 + rng.range(-4, 4), hw: rng.range(4.2, 5.2), h: rng.range(2.6, 3.2) },     /* NO DARK DOORWAY IN THE ROCK: each sea cave is a low wave-cut hollow, far broader than it is high: no tall dark slot at the foot */ { f: 20 + rng.range(-4, 4), hw: rng.range(6.2, 7.2), h: rng.range(3.2, 3.8) }];
  const caveM = (f, y) => { let m = 0; for (const c of caves) { const dx = Math.abs(f - c.f) * 0.75; if (dx < c.hw && y > -6 && y < c.h) { const yy = Math.max(y, 0) / c.h, w = c.hw * Math.sqrt(Math.max(1 - yy * yy, 0)); m = Math.max(m, 1 - sst(0.7, 1, dx / Math.max(w, 0.01))); } } return m; };
  // the beds: the cliff steps back 1.3 m at each; its face is RIBBED IN GEOMETRY: ribs and gullies 3 to 8 m apart that run
  // up the face from the sea to the crest, leaning a little (no blocks, no squared holes, none in rows)
  const BEDS = [3.5, 9, 14.5, 20.5, 26, 31];
  const terr = (y) => { let t = 0; for (const b of BEDS) t += sst(b - 0.35, b + 0.35, y); return t; };
  const below = (y) => (y >= 0 ? 0 : 1.4 * sst(2.6, 3.4, -y) + 1.6 * sst(6.6, 7.4, -y) + 1.5 * sst(10.4, 11.2, -y));     // under the old waterline the foot goes down in three rough steps toward the pit
  // THE FLUTES ARE UNEQUAL AND BROKEN: their depth is its own along the face (some stretches deep-fluted, some nearly smooth slab); their breadth is drawn out and
  // drawn in along the face; above each of two ledges (at 9 and 20.5 m, each on its own stretches of the face, and a third at 14.5 m on a part of it) the flutes do not stand over the flutes below;
  // one slab has fallen: a smooth scar 7 m broad above 12 m, and the slab leaning at the cliff's foot under it. None of it on the east horn (the fig's brink is whole). By place.
  const ledgeK = (f, y) => offHorn(f) * (1.1 * sst(-0.2, 0.3, noise.n2(f * 0.06, 5.3)) * sst(8.65, 9.35, y) + (y > 20.15 ? 1.3 * sst(-0.3, 0.2, noise.n2(f * 0.05, 9.1)) * sst(20.15, 20.85, y) : 0) + (y > 14.15 ? 0.9 * sst(0.0, 0.4, noise.n2(f * 0.08, 2.9)) * sst(14.15, 14.85, y) : 0));     // a ledge's noise is not asked under its own height (its term is exactly nought there: the same sum)
  const scarW = (f, y) => (1 - sst(4, 5.5, Math.abs(f + 34))) * sst(11, 12.5, y);
  const slabF = (f, y) => 2.2 * (1 - sst(3, 4.5, Math.abs(f + 31))) * (1 - sst(0, 9, y)) * sst(-3, 0, y);
  const fluteK = (f, y) => (0.2 + 0.95 * sst(-0.25, 0.35, noise.n2(f * 0.045, 1.7)) * offHorn(f) + 0.8 * (1 - offHorn(f))) * (1 - 0.9 * scarW(f, y)) * (1 - 0.85 * wS2(f)) * (1 - 0.7 * wS3(f)) * (1 - 0.5 * wEnd(f));
  const fShift = (f, y) => offHorn(f) * (y > 20.5 ? 7.3 : y > 9 ? 3.1 : 0) + 7 * noise.n2(f * 0.03, 4.4) * offHorn(f);
  const rcS = (f, y) => { METER += 0.7; const te = terr(y); return rc0(f) + 1.3 * te - below(y) + (y > 8.65 ? ledgeK(f, y) : 0) + 2.6 * scarW(f, y) - slabF(f, y) + 0.75 * Math.max(0, y - 1.5) * wS2(f) + 1.9 * te * wS3(f) + 7 * wS4(f) * sst(-4, 0, y); };                                       // the smooth law (bake, counts)
  const rc = (f, y) => { const fl = f + 0.22 * y + fShift(f, y);
    return rcS(f, y) + ((2.4 * noise.n2(fl * 0.13, 3.3) + 1.1 * noise.n2(fl * 0.3, 8.1)) * fluteK(f, y)     /* the flutes are few and their finer set shallow */ + 0.6 * noise.n2(fl * 1.1, y * 0.06)) * sst(-3, 2, y) + 1.2 * noise.n2(Math.floor(f / 4.3) * 5.1, Math.floor(-y / 3.9) * 2.3) * (1 - sst(-3, 2, y)) + 0.5 * noise.n2(f * 0.9, y * 0.5) + 4.5 * caveM(f, y) /* NO SINGLE DARK HOLLOW: each sea cave is a shallow wave-cut notch (4.5 m deep), half in shade */ + 1.6 * Math.abs(noise.n2(Math.floor(f / 2.9) * 5.1, Math.floor(y / 2.6) * 2.3)) * wEnd(f) * sst(-3, 1, y); };
  const thick = (f) => { const a = f * Math.PI / 180; return 10 + (28 + 6 * Math.sin(1.7 * a + 0.5)) * sst(-116, -98, f) * (1 - sst(52, 82, f)); };
  const backY = (T, t) => T - 1.5 + (-7 - T + 1.5) * (0.4 * Math.pow(t, 0.8) + 0.6 * (Math.floor(t * 5) + sst(0.55, 1, t * 5 % 1)) / 5);     // the back goes down in five beds (their treads sloping, their risers steeper)
  const surf = (f, s, out) => {
    const T = top(f), th = thick(f); let r, y;
    if (s <= 0.6) { y = -18 + (T + 18) * Math.pow(s / 0.6, 0.85); r = rc(f, y); }
    else if (s <= 0.72) { const t = (s - 0.6) / 0.12; r = rc(f, T) + 0.3 * th * t; y = T - 1.5 * t * t + 0.8 * noise.n2(f * 0.4, t * 3) * Math.sin(t * Math.PI); }
    else { const t = (s - 0.72) / 0.28; r = rc(f, T) + th * (0.3 + 0.7 * t); y = backY(T, t) + (1.6 * noise.n2(f * 0.2, 3.3) + 1.0 * noise.n2(f * 0.47, 8.1)) * Math.sin(t * Math.PI); }     // the face's own ribs run over the crest and down the back
    const a = f * Math.PI / 180; out[0] = r * Math.cos(a); out[1] = y; out[2] = r * Math.sin(a); return out;
  };
  const inside = (x, y, z) => {
    if (y > 37.4 || y < -18 || x * x + z * z < 1296 || x * x + z * z > 22500) return false;     // the cheap answers first: over its highest top, under its foot, inside the bowl; beyond the farthest its law can reach (its face's every term at its most, 104.4 m, and its greatest thickness, 44 m: under 150 m)
    const r = Math.hypot(x, z), f = Math.atan2(z, x) * 180 / Math.PI; if (f < -116 || f > 82) return false;
    const tT = topT(f); if (y > tT + 2.45) return false;     // the same answer sooner: the top is never higher than its plain line by more than its steps (2.2 m times the noise, which stays under 1; the sags only take from it)
    const T = top0t(f, tT); if (y > T) return false; const r0 = rcS(f, y) + 9 * caveM(f, y);
    if (r < r0) return false; const rT = rcS(f, T), th = thick(f); if (r <= rT) return true;     // before the face nothing more is asked
    if (r <= rT + 0.3 * th) { const t = (r - rT) / (0.3 * th); return y < T - 1.5 * t * t; }
    const t = (r - rT - 0.3 * th) / (0.7 * th); if (t >= 1) return false; return y < backY(T, t);
  };
  // ---- THE HORN'S END (HORN): a bluff about its own middle, in the same measure as the rest (local to PC). b: a bearing about its middle (0 north, toward the
  // pool; -90 degrees west, toward the line); its seam lies east, inside the ridge. Its plan is an oval, roughened; its cliff steps back a metre at each of the rock's beds and leans back a little, is
  // fluted by the same noise as the cliff over the pool (the flutes not standing over one another above the ledges at 9 and 14.5 m), has a ledge on stretches at each of those two heights, and is cut by
  // three clefts that lean; its top falls from north to south (21 to 14 m) with a broken line; ON ITS NORTH-WEST SHOULDER A SHELF: over some 80 degrees of its round the cliff ends 9.5 m lower (11 m over
  // the sea) and the top stands back behind it by a steep broken face: the fig's ledge, a brink toward the line and the pool. The same law answers the skin, the shade and the counts.
  const HC = [HORN.c[0] - PC[0], HORN.c[1] - PC[1]], HL = HORN.L, HS = HORN.S, HARC = 0.5 * (HL + HS), SH_A = 0.66, SH_W = 0.74;
  const hArc = (b) => { let a = b + Math.PI / 2; a -= TAU * Math.round(a / TAU); return a * HARC; };     // metres along its outline from its western end (north positive)
  const hR0 = (b) => { const c = Math.cos(b), q = Math.sin(b), sa = hArc(b); return (1 + 0.1 * noise.n2(sa * 0.06, 11.3) + 0.05 * noise.n2(sa * 0.17, 4.7)) / Math.sqrt(c * c / (HL * HL) + q * q / (HS * HS)); };
  const hTup = (b) => { const sa = hArc(b); return HORN.top - 6.5 * sst(0.25, 0.95, -Math.cos(b)) + 1.3 * noise.n2(sa * 0.1, 3.1) + 0.8 * noise.n2(sa * 0.3, 7.7); };
  const hShelf = (b) => 1 - sst(0.55, 1, Math.abs(hArc(b) / HARC - SH_A) / SH_W);
  const hT = (b) => hTup(b) - 9.5 * hShelf(b) + 0.9 * (sst(-0.08, 0.08, noise.n2(hArc(b) * 0.4, 1.1)) - 0.5);     // (its brink is broken: it stands a metre higher or lower by stretches of three or four metres)
  const hLedge = (sa, y) => 1.1 * sst(-0.2, 0.3, noise.n2(sa * 0.05, 5.3)) * sst(8.65, 9.35, y) + 1.2 * sst(-0.3, 0.2, noise.n2(sa * 0.045, 9.1)) * sst(14.15, 14.85, y);
  const hFaceS = (b, y) => { METER += 0.6; return hR0(b) - 1.0 * terr(y) - 0.05 * Math.max(y, 0) + below(y) - hLedge(hArc(b), y); };                                              // the smooth law (bake, counts)
  const HJ = [0, 1, 2].map((j) => [-17 + 15 * j + 4 * noise.n2(j * 3.7, 2.2), 1.0 + 0.4 * Math.abs(noise.n2(j * 5.1, 6.6)), 1.5 + 0.9 * Math.abs(noise.n2(j * 2.3, 8.8)), 0.14 * (j - 1)]);     // the clefts: where along the outline, how broad, how deep, how they lean
  const HB = [1.7, 5.3, 7.2, 10.8, 12.6, 16.2, 18.4];     // the thinner beds' breaks between the rock's great ones
  const hCut = (b, y) => { const sa = hArc(b), sf = sa + 0.22 * y + (y > 14.5 ? 5.3 : y > 9 ? 2.6 : 0), yw = y + 0.8 * noise.n2(sa * 0.05, 6.1) + 0.25 * noise.n2(sa * 0.21, 9.4); let cl = 0, st = 0, nb = 0;     // the skin's law: every bed's edge a small break (the lines wander a little), every bed's face a little off the one under it, the flutes, the clefts
    for (const j of HJ) { const u = Math.abs(sa - j[0] - j[3] * y) / j[1]; if (u < 1) cl = Math.max(cl, j[2] * (1 - u)); }
    for (const e of HB) { const q = sst(e - 0.15, e + 0.15, yw); st += 0.26 * q; if (q > 0.5) nb++; } for (const e of BEDS) if (yw > e) nb += 9;
    return (st + (1.9 * noise.n2(sf * 0.13, 3.3) + 0.9 * noise.n2(sf * 0.3, 8.1)) * 0.5 + 0.3 * noise.n2(sa * 0.17 + 13.7 * nb, 2.2 + 1.3 * nb) + 0.4 * noise.n2(sf * 1.1, y * 0.06) + cl) * sst(-3, 2, y); };
  const hRc = (b, y) => hFaceS(b, y) - hCut(b, y);
  const hCap = (b, rn) => { const T = hT(b), e = T + (hTup(b) - T) * (1 - sst(0.56, 0.7, rn)); return HORN.top - 1 + (e - HORN.top + 1) * sst(0, 0.55, rn); };     // its top at a place (rn: the share of the way out from its middle to the cliff's upper edge): the shelf, the steep face behind it, the top
  const hSurf = (u, sq, out) => { const ph = Math.PI / 2 + TAU * u, b = Math.atan2(HS * Math.sin(ph), HL * Math.cos(ph)), T = hT(b); let r, y;
    if (sq <= 0.6) { y = sq < 0.06 ? -18 + 16.5 * sq / 0.06 : -1.5 + (T + 1.5) * (sq - 0.06) / 0.54; r = hRc(b, y); }     // six rows under the sea, the rest up its face
    else { const t = (sq - 0.6) / 0.4, rn = 1 - 0.998 * t; r = rn * hRc(b, T); y = hCap(b, rn) + 0.3 * noise.n2(r * Math.sin(b) * 0.45, r * Math.cos(b) * 0.45) * sst(0, 0.12, t); }
    out[0] = HC[0] + r * Math.sin(b); out[1] = y; out[2] = HC[1] + r * Math.cos(b); return out; };
  const hIn = (fn) => (x, y, z) => { if (y > HORN.top + 3 || y < -18) return false; const qx = x - HC[0], qz = z - HC[1], r = Math.hypot(qx, qz); if (r > HL + 6) return false; const b = Math.atan2(qx, qz), T = hT(b);
    if (r > fn(b, Math.min(y, T))) return false; return y <= T || y <= hCap(b, Math.min(1, r / Math.max(fn(b, T), 0.1))); };
  // THE SKIN'S LAW, THE SAME ANSWER BY LESS WORK: what the breaks, flutes and clefts take from the smooth face lies between two bounds (never less than -2.35 m: the flutes' and the fine noise's
  // whole swing, the noise under 1; never more than the seven breaks, the deepest cleft and that swing), so 'outside' and 'inside the face' are answered from the smooth face alone wherever the place is beyond them
  const H_LO = -2.35, H_HI = 7 * 0.26 + 0.01 + HJ.reduce((m, j) => Math.max(m, j[2]), 0) + 2.35;
  const hInsideSkin = (x, y, z) => { if (y > HORN.top + 3 || y < -18) return false; const qx = x - HC[0], qz = z - HC[1], r = Math.hypot(qx, qz); if (r > HL + 6) return false; const b = Math.atan2(qx, qz), T = hT(b), ym = Math.min(y, T), fs = hFaceS(b, ym);
    if (r > fs - H_LO) return false; if (r > fs - H_HI && r > fs - hCut(b, ym)) return false; return y <= T || y <= hCap(b, Math.min(1, r / Math.max(hRc(b, T), 0.1))); };
  const hInside = hIn(hFaceS);     // by the smooth law (the counts: never smaller than the skin by more than its flutes), by the skin's own (the shade)
  const hTopSkin = (x, z) => { const qx = x - HC[0], qz = z - HC[1], r = Math.hypot(qx, qz), b = Math.atan2(qx, qz), T = hT(b), rT = hRc(b, T); return r <= rT ? hCap(b, r / Math.max(rT, 0.1)) : -1e9; };     // the skin's upper face at a place (none beyond its brink)
  const hTopY = (x, z) => { const qx = x - HC[0], qz = z - HC[1], r = Math.hypot(qx, qz); if (r > HL + 6) return -1e9; const b = Math.atan2(qx, qz), T = hT(b), rT = hFaceS(b, T); if (r <= rT) return hCap(b, r / Math.max(rT, 0.1));
    for (let y = T - 0.25; y > -6; y -= 0.25) if (hFaceS(b, y) >= r) return y; return -1e9; };     // its upper face at a place
  return { top, top0, rc, rcS, rc0, thick, surf, inside, caveM, caves, terr, F0: -116, F1: 82, horn: { surf: hSurf, inside: hInside, insideSkin: hInsideSkin, topY: hTopY, topSkin: hTopSkin, face: hRc, T: hT, c: HC } };
}
// the sand under the pool (local to PC): bare black sand over the pit's far half, up to the cliff's foot
const FLOOR_Y = -16.6;     // THE FLOOR: 16.6 m under the sea: a small dark ground at the wall's foot, a hollow, no rib standing up (deep: no shallow dish with a stone in it)
export function floorY(x, z) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x), fw = sst(-0.5, 0.2, Math.cos(a + 0.35));
  const shelf = -27 + 3.5 * clamp((r - 20) / 23, 0, 1);            // dark sand 27 m down at the far wall's foot, rising a little under the water to the cliff's foot
  // banks and hollows of mud a metre or two high, so that where the bed shows it shows broken and to one side
  const mud = (1.7 * Math.sin(x * 0.33 + 1) * Math.sin(z * 0.27 + 2) + 1.0 * Math.sin(x * 0.7 - z * 0.55)) * (1 - sst(26, 40, r));
  const deep = -34 + (shelf + 34) * fw + mud, core = 1 - sst(8.5, 15, r); if (core <= 0) return deep;
  // THE BOTTOM LAID BARE IS GROUND: at the funnel's foot the floor stands 16.6 m under the sea's level (the water's wall comes down to it 7 to 8 m from the middle: it is bare at every
  // hour but while the pool boils), dark sand and mud in low banks, with THREE LOW RIBS OF ROCK across it (1.5, 1.1 and 0.9 m high, unequal, none through the middle): plainly ground, no hole, no disc
  const u1 = 0.62 * x + 0.78 * z, v1 = 0.78 * x - 0.62 * z, u2 = -0.34 * x + 0.94 * z, v2 = 0.94 * x + 0.34 * z;
  const rib = 1.5 * Math.exp(-(((u1 - 2.4 - 0.5 * Math.sin(v1 * 0.5)) / 1.0) ** 2)) * (0.65 + 0.35 * Math.sin(v1 * 0.45 + 1)) + 1.1 * Math.exp(-(((u1 + 3.6 + 0.6 * Math.sin(v1 * 0.4 + 2)) / 0.8) ** 2)) * (0.55 + 0.45 * Math.sin(v1 * 0.6))
    + 0.9 * Math.exp(-(((u2 - 1.2 - 0.4 * Math.sin(v2 * 0.7)) / 0.7) ** 2)) * sst(0.5, 3.5, v2);
  return deep + (FLOOR_Y + 0.25 * rib + 0.08 * mud + 0.1 * Math.sin(x * 1.3 + 2) * Math.sin(z * 1.1) - 0.9 * (1 - sst(0, 9, r)) - deep) * core;     /* no lump standing up in the middle: the ribs a quarter of their height, the banks a third, the middle a hollow 0.9 m deeper */     // the floor's own level is FLOOR_Y
}

// ---- the sun's bake for a gridded surface: one march toward the sun per vertex through the solid's own law, then softened
// over the neighbouring vertices (about two metres). inside(x, y, z) is in the geometry's own frame. Yields every o.every
// vertices (150 where none is given).
// the grid's normals, as three's own computeVertexNormals (each face's cross product summed at its corners), asking the engine every 3,072 faces
export async function stepNormals(ctx, g) { const p = g.attributes.position.array, ix = g.index.array, n = new Float32Array(p.length);
  for (let k = 0; k < ix.length; k += 3) { const w = tick(ctx, 0.03); if (w) await w; const a = ix[k] * 3, b = ix[k + 1] * 3, c = ix[k + 2] * 3;
    const ux = p[c] - p[b], uy = p[c + 1] - p[b + 1], uz = p[c + 2] - p[b + 2], vx = p[a] - p[b], vy = p[a + 1] - p[b + 1], vz = p[a + 2] - p[b + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz; }
  await tick(ctx, 170);
  for (let k = 0; k < n.length; k += 3) { const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1; n[k] /= l; n[k + 1] /= l; n[k + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); }
// HOW FAR TOWARD THE SUN A MARCH FROM A PLACE CAN STILL MEET STONE: beyond the last body's own round on the way (its plan's reach about its foot centre, its lean taken in) and
// over its top there is none, so the march ends there: the same answer by fewer steps (every body's own law says no outside that round and over that top). Nothing of the lens or the line is read.
export function sunEndOf(bodies) { const B = bodies.map((t) => { const Rb = t.R + Math.hypot(t.lean[0], t.lean[1]) * Math.max(t.top, 10) + 0.5; return [t.c[0], t.c[1], Rb * Rb, t.top]; }), sx = SUN[0], sy = SUN[1], sz = SUN[2], hh = sx * sx + sz * sz;
  return (x, y, z) => { let e = 0; for (let i = 0; i < B.length; i++) { const b = B[i]; if (y >= b[3]) continue; const dx = b[0] - x, dz = b[1] - z, t0 = (dx * sx + dz * sz) / hh, d2 = dx * dx + dz * dz - t0 * t0 * hh; if (d2 > b[2]) continue;
    let te = t0 + Math.sqrt((b[2] - d2) / hh); if (te <= 0) continue; const tt = (b[3] - y) / sy; if (tt < te) te = tt; if (te > e) e = te; } return e; }; }
export async function bakeGrid(ctx, g, nc, nr, wrap, inside, extra, o = {}) {
  await tick(ctx, 20);
  await stepNormals(ctx, g);
  await tick(ctx, 53);
  const pos = g.attributes.position.array, nor = g.attributes.normal.array, n = pos.length / 3, vis = new Float32Array(n), bake = new Float32Array(n * 3);
  const S = SUN, reach = o.reach ?? 200, step0 = o.step ?? 1.2, every = o.every ?? 150;
  const cost = o.cost ?? 0.4, yTop = o.yTop ?? 1e9, eyes = BAKE_CUT_BY_LINE ? (o.eyes || null) : null, past = o.past || null, end = o.end || null, aim = o.aim || null;
  for (let v = 0; v < n; v++) {
    const k = v * 3, nx = nor[k], ny = nor[k + 1], nz = nor[k + 2];
    if (nx * S[0] + ny * S[1] + nz * S[2] <= 0.02 || pos[k + 1] > yTop) { vis[v] = 0; continue; }     // turned from the sun; or above the height where the stone keeps no sun (o.yTop)
    // NO MARCH FROM A PLACE NO EYE ON THE LINE CAN SEE: o.eyes are places along the whole line (given by the world, in this geometry's frame); a place whose face is turned from every one of
    // them (by 9 degrees and more) keeps the plain sun (a top over the eye's height, a far side), and its march is not made
    if (eyes) { let seen = false; for (let e = 0; e < eyes.length; e += 3) { const ex = eyes[e] - pos[k], ey = eyes[e + 1] - pos[k + 1], ez = eyes[e + 2] - pos[k + 2]; if (nx * ex + ny * ey + nz * ez > -0.15 * Math.sqrt(ex * ex + ey * ey + ez * ez)) { seen = true; break; } } if (!seen) { METER += 0.15; vis[v] = 1; continue; } }
    let x = pos[k] + nx * 0.5, y = pos[k + 1] + ny * 0.5, z = pos[k + 2] + nz * 0.5, lit = 1, q = 0;
    const lim = end ? Math.min(reach, end(x, y, z)) : reach;     // o.end: how far toward the sun stone can still lie (see sunEndOf)
    if (aim) aim(x, y, z, lim);     // o.aim: the march's line, told once before its steps (the caller's inside law then asks only the bodies that line can meet: see marchMeets)
    for (let t = step0, st = step0; t < lim; st *= 1.1, t += st) { q++; const px = x + S[0] * t, py = y + S[1] * t, pz = z + S[2] * t; if (inside(px, py, pz)) { lit = 0; break; } if (past && past(px, py, pz)) break; }     // o.past: a place from which the march can meet no more stone ends it (the same answer, fewer steps)
    vis[v] = lit;
    const w = tock(ctx, 0.2 + cost * q); if (w) await w;     // it asks by counted work: what a step of the march costs (o.cost) times the steps marched
  }
  await tick(ctx, 20);
  const sm = new Float32Array(n), at = (i, j) => vis[j * nc + (wrap ? (i + nc) % nc : Math.min(nc - 1, Math.max(0, i)))];
  for (let j = 0, v = 0; j <= nr; j++) for (let i = 0; i < nc; i++, v++) {
    { const w = tick(ctx, 0.3); if (w) await w; }
    const ja = Math.max(0, j - 1), jb = Math.min(nr, j + 1);
    sm[v] = (4 * at(i, j) + 2 * (at(i - 1, j) + at(i + 1, j) + at(i, ja) + at(i, jb)) + at(i - 1, ja) + at(i + 1, ja) + at(i - 1, jb) + at(i + 1, jb)) / 16;
  }
  for (let v = 0; v < n; v++) { const w = tick(ctx, o.extraCost ?? 0.7); if (w) await w; const e = extra(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], v); bake[v * 3] = sm[v] * (e[2] ?? 1); bake[v * 3 + 1] = e[0]; bake[v * 3 + 2] = e[1]; }
  g.setAttribute('aBake', new THREE.BufferAttribute(bake, 3));
  await tick(ctx, 720);
  return g;
}

// ---- THE FIG : ONE GREAT FIG IN FULL LEAF BY THE PART'S OWN MAKER, in pieces with an ask between (no single call of the kit's
// makes it): a short thick bole, five smooth grey limbs that go out wide and low (the longest toward the water) and fork twice, and broad dark leaves in
// masses, each a dark heart under shingles of leaves: A DOMED CROWN (a ring of masses over the limbs, a head over the bole), not a flat slab. It carries the measures the kit's wind material reads (position, normal,
// colour, wind = sway, flutter, leaf, glow; uv into the kit's leaf atlas), so the same wind moves it. In its own metres about 12 m high and 16 m across,
// before the hero leans it and sizes it to its reach.
async function figGeometry(ctx, rng, o = {}) {
  const P = [], N = [], C = [], W = [], T = [], I = []; let nv = 0;
  const put = (x, y, z, nx, ny, nz, c, k, sway, fl, leaf, tu, tv) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0] * k, c[1] * k, c[2] * k); W.push(sway, fl, leaf, 0); T.push(tu, tv); return nv++; };
  const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; }, mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const bark = lin(o.bark || '#7f7b74'), leafLo = lin('#1a3413'), leafMid = lin('#35592a'), leafHi = lin('#6b8c4a'), cell = flora.LEAF_CELLS.cluster, DH = o.dh ?? 0, H = 8 + DH;     // DH: how much taller its bole stands under the crown
  const swayAt = (y) => 0.028 * H * Math.pow(Math.min(1, Math.max(0, y / H)), 2);
  // a smooth limb: a tube of seven sides through its points, a side vector carried along it
  const tube = (pts, rad, still = false) => { const S = 7, n = pts.length, base = nv; let ux = 1, uy = 0, uz = 0;
    for (let i = 0; i < n; i++) { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz; let ul = Math.hypot(ux, uy, uz); if (ul < 1e-3) { ux = ty; uy = -tx; uz = 0; ul = Math.hypot(ux, uy, uz) || 1; } ux /= ul; uy /= ul; uz /= ul;
      const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux, sw = still ? 0 : swayAt(pts[i][1]);
      for (let s = 0; s < S; s++) { const an = TAU * s / S, ca = Math.cos(an), sa = Math.sin(an), nx = ux * ca + vx * sa, ny = uy * ca + vy * sa, nz = uz * ca + vz * sa;
        put(pts[i][0] + nx * rad[i], pts[i][1] + ny * rad[i], pts[i][2] + nz * rad[i], nx, ny, nz, bark, 0.8 + 0.2 * ny + 0.08 * hsh(i * 7 + s, 501 + base), sw, 0, 0, 0.875, 0.75); } }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < S; s++) { const a = base + i * S + s, b = base + i * S + (s + 1) % S, c = a + S, e = b + S; I.push(a, b, c, b, e, c); } };
  // a mass of leaves: a lumped dark heart (three's own twenty-sided solid, once divided) under shingles of broad leaves that hang a little
  const ico = new THREE.IcosahedronGeometry(1, 1).attributes.position.array, CY = 3.4 + DH;
  const mass = (cx, cy, cz, r, ry, nl) => { const base = nv, ph = rng() * TAU, sw = swayAt(cy) + 0.03 * r, w1 = rng.range(1.5, 3), w2 = rng.range(1.5, 3);
    for (let q = 0; q < ico.length; q += 3) { const dx = ico[q], dy = ico[q + 1], dz = ico[q + 2], l = 0.7 * (1 + 0.22 * Math.sin(dx * w1 + dy * w2 + ph) + 0.12 * Math.sin(dz * 4.1 - dx * 2.3 + 2 * ph));
      put(cx + dx * r * l, cy + dy * ry * l * (dy < 0 ? 0.8 : 1), cz + dz * r * l, dx, dy, dz, mixc(leafLo, leafMid, 0.7 * (dy * 0.5 + 0.5)), 0.85, sw, 1, 1, 0.875, 0.75); }
    for (let q = 0; q < ico.length / 3; q += 3) I.push(base + q, base + q + 1, base + q + 2);
    const off = rng() * TAU;
    for (let k = 0; k < nl; k++) { const yy = 1 - (k + 0.5) / nl * 1.75, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = off + k * 2.39996 + rng.range(-0.3, 0.3);
      let dx = Math.cos(th) * rr + rng.range(-0.15, 0.15), dy = yy + rng.range(-0.15, 0.15), dz = Math.sin(th) * rr + rng.range(-0.15, 0.15); const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const sz = 0.6 * Math.min(r, ry) * rng.range(0.85, 1.3), rs = 0.86 + rng.range(-0.1, 0.1), px = cx + dx * r * rs, py = cy + dy * ry * rs, pz = cz + dz * r * rs;
      const jx = rng() - 0.5, jy = rng() - 0.5, jz = rng() - 0.5; let tx = dy * jz - dz * jy, ty = dz * jx - dx * jz, tz = dx * jy - dy * jx; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let ax = dx * 0.6 + tx * 0.7, ay = dy * 0.6 + ty * 0.7 - 0.35, az = dz * 0.6 + tz * 0.7; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
      let sx = ay * dz - az * dy, sy = az * dx - ax * dz, s2 = ax * dy - ay * dx; const sl = Math.hypot(sx, sy, s2) || 1; sx /= sl; sy /= sl; s2 /= sl;
      const qy = py - CY, ql = Math.hypot(px, qy, pz) || 1; let nx = 0.5 * dx + 0.5 * px / ql + rng.range(-0.25, 0.25), ny = 0.5 * dy + 0.5 * qy / ql + rng.range(-0.1, 0.3), nz = 0.5 * dz + 0.5 * pz / ql + rng.range(-0.25, 0.25); const nn = Math.hypot(nx, ny, nz) || 1; nx /= nn; ny /= nn; nz /= nn;
      const sh = 0.55 * (dy * 0.5 + 0.5) + 0.45 * Math.min(1, Math.max(0, 0.5 + 0.1 * qy)), col = sh < 0.55 ? mixc(leafLo, leafMid, sst(0, 0.55, sh)) : mixc(leafMid, leafHi, sst(0.55, 1, sh)), kk = rng.range(0.85, 1.15);
      const fx = rng() < 0.5, ua = fx ? cell[2] : cell[0], ub = fx ? cell[0] : cell[2], Ux = ax * sz, Uy = ay * sz, Uz = az * sz, Vx = sx * sz, Vy = sy * sz, Vz = s2 * sz;
      const i0 = put(px - Ux - Vx, py - Uy - Vy, pz - Uz - Vz, nx, ny, nz, col, 0.85 * kk, sw, 0.6, 1, ua, cell[3]), i1 = put(px - Ux + Vx, py - Uy + Vy, pz - Uz + Vz, nx, ny, nz, col, 0.85 * kk, sw, 0.6, 1, ub, cell[3]);
      const i2 = put(px + Ux + Vx, py + Uy + Vy, pz + Uz + Vz, nx, ny, nz, col, 1.08 * kk, sw, 1.5, 1, ub, cell[1]), i3 = put(px + Ux - Vx, py + Uy - Vy, pz + Uz - Vz, nx, ny, nz, col, 1.08 * kk, sw, 1.5, 1, ua, cell[1]);
      I.push(i0, i1, i2, i0, i2, i3); } };
  // the bole: short and thick, flaring at its foot
  tube([[0, -1.4, 0], [0.04, 0, 0], [0.1, 0.9, 0.04], [0.15, 1.7 + 0.4 * DH, 0.07], [0.2, 2.4 + 0.75 * DH, 0.09], [0.22, 2.4 + DH, 0.1]], [1.45, 1.12, 0.94, 0.86, 0.84, 0.86]);     // a thick bole, seen from the way
  await tick(ctx, 120);
  const ends = [];
  for (let i = 0; i < 5; i++) { const az = TAU * (i + rng.range(-0.2, 0.2)) / 5, ca = Math.cos(az), sa = Math.sin(az), L = rng.range(3.9, 5.1) * (1 - 0.25 * ca), rise = rng.range(3.0, 4.8), n = 9, pts = [], rad = [];     /* the crown is no wider than the bluff it stands on: no flat pad over it */
    for (let j = 0; j <= n; j++) { const t = j / n, out = L * (t + 0.07 * Math.sin(t * 5 + i)), y = 2.2 + DH + rise * (1 - (1 - t) * (1 - t)) - 0.9 * t * t * t + 0.25 * Math.sin(t * 7 + 2 * i), sd = 0.5 * Math.sin(t * 3.1 + i * 1.7);     // it goes out wide, rises and levels: a low spreading limb with a slow bend of its own
      pts.push([0.2 + ca * out - sa * sd, y, 0.1 + sa * out + ca * sd]); rad.push(0.62 * (1 - 0.74 * t) + 0.03); }     // thick boughs
    tube(pts, rad);
    for (let q = 0; q < 2; q++) { const b = pts[q ? 6 : 4], az2 = az + (q ? -1 : 1) * rng.range(0.5, 0.9), c2 = Math.cos(az2), s2 = Math.sin(az2), L2 = rng.range(2.4, 3.4), p2 = [], r2 = [];     // it forks to either hand
      for (let j = 0; j <= 5; j++) { const t = j / 5; p2.push([b[0] + c2 * L2 * t, b[1] + 1.1 * t - 0.5 * t * t, b[2] + s2 * L2 * t]); r2.push(0.24 * (1 - 0.7 * t) + 0.03); }
      tube(p2, r2); ends.push([p2[5], 1]); }
    ends.push([pts[n], 1.15]); ends.push([pts[6], 0.9]);     // A CROWN WITH DEPTH AND GAPS: a mass of leaves at each bough's end, at each fork's end and one along it (no closed pad); the sky and the boughs show between them
    await tick(ctx, 370); }
  // THE CROWN IS A DOME (no flat slab, no black bar from far off): a ring of masses over the limbs and a head over the bole
  for (let i = 0; i < 5; i++) { const a = TAU * (i + rng()) / 5, rr = rng.range(2.2, 3.4); ends.push([[rr * Math.cos(a) - 0.6, DH + rng.range(6.6, 7.9), rr * Math.sin(a)], 1.1]); }
  for (let i = 0; i < 3; i++) { const a = TAU * (i + rng()) / 3; ends.push([[1.3 * Math.cos(a) - 0.4, DH + rng.range(8.6, 9.6), 1.3 * Math.sin(a)], 1.2]); }
  let m = 0; for (const [p, k] of ends) { const r = k * rng.range(1.6, 2.2); mass(p[0] + rng.range(-0.4, 0.4), p[1] + 0.2 * r, p[2] + rng.range(-0.4, 0.4), r, 0.8 * r, 30); if (++m % 4 === 0) await tick(ctx, 1300); }
  await tick(ctx, 1000);
  if (o.roots) { o.roots(P, (pts, rad) => tube(pts, rad, true)); await tick(ctx, 570); }     // the hero reads the tree's reach here (its size is solved from it); its roots are the hero's own, laid on the built rock
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  await tick(ctx, 3800);
  g.setAttribute('wind', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2)); g.setIndex(I); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}
// ---- the hero: the pool's surface out to 75 m, the sand shelf, the low rock ------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  await prepareBodies(ctx);
  const core = ctx.core, seed = ctx.seed;
  const U = opts.shared || makeShared(ctx.vary?.mood ?? 0.5);
  const phase = opts.phase ?? core.makeRng(core.hashSeed('strait-round:' + seed)).range(0, ROUND);
  const noise = core.makeNoise(core.hashSeed('strait-lowrock:' + seed));
  const object = new THREE.Group(); object.position.set(PC[0], 0, PC[1]);
  // a stream of its own for each thing the seed deals, made from the seed and a name
  const fk = (n) => core.makeRng(core.hashSeed('strait-' + n + ':' + seed));

  // the pool's surface: 96 rings to 75 m, the same shader and the same 192 spokes as the open sea the world lays round it
  const radii = []; for (let i = 0; i <= 96; i++) radii.push(75 * i / 96);
  const seaMat = opts.seaMaterial || makeSeaMaterial(U);
  await tick(ctx, 6300);
  const pool = new THREE.Mesh(seaGeometry(radii), seaMat); pool.frustumCulled = false; pool.name = 'pool'; pool.renderOrder = 1; object.add(pool);   // the sea is drawn after the ship's depth lid (0.5)
  await tick(ctx, 910);

  // the sand shelf and the deep under the pool
  const floorGeo = await gridGeometry(ctx, 96, 46, (i, j, p) => { const r = j * 49 / 46, a = TAU * i / 96; p[0] = r * Math.cos(a); p[2] = -r * Math.sin(a); p[1] = floorY(p[0], p[2]); }, true, false, 1.4);     // closed at its middle: the bared floor is whole
  await stepNormals(ctx, floorGeo);
  await tick(ctx, 130);
  const floorMat = new THREE.ShaderMaterial({ uniforms: { ...U, uSand: { value: new THREE.Color('#0a0b0e') } },
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_SEA + GLSL_SKY + GLSL_FOG + GLSL_SHADOW + GLSL_NOISE + /* glsl */`
      uniform vec3 uSand, uSunCol, uHemiSky, uFoamSun; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 N = normalize(vN); vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
        vec2 d = vW.xz - PC; float r = length(d);
        // ripple ridges 0.6 m apart lying round the pool, rills running down to the throat
        float rid = sin(r * 3.6 + 2.5 * vn(vW.xz * .25)) * (1. - smoothstep(60., 140., dist));     // a filter by the eye's distance alone (whole to 60 m, gone by 140 m; no footprint term): the sand's ripples go to their mean (nought)
        N = normalize(N + .16 * rid * vec3(d.x, 0., d.y) / max(r, 1.));
        float rill = smoothstep(.62, .7, vn(vec2(atan(d.y, d.x) * 14., r * .08)));
        vec3 R = reflect(-V, N); R.y = abs(R.y) + .02;
        float F = .04 + .96 * pow(clamp(1. - dot(N, V), 0., 1.), 5.);
        vec3 col = vec3(.0065, .036, .054) + uSand * .2 * uHemiSky;     // under the water the shelf is the dark of deep water (its sand's own light is left out)
        // the bared floor at the funnel's foot: dark wet sand and mud, the ribs a greyer rock, lit by the sky alone (no sun comes down there), a dull sheen where it lies flat
        float core = 1. - smoothstep(9., 16., r), rockK = smoothstep(${(FLOOR_Y + 0.55).toFixed(2)}, ${(FLOOR_Y + 1.2).toFixed(2)}, vW.y);
        // THE FLOOR IS DARK, WET AND DEEP: near-black sand and mud (no tan, no grain, no rills), its ribs a darker rock,
        // wet glints of the sky on it, and thin threads of foam drawn across it (bent by a noise of the place: no ring, no ruled line)
        vec3 gmud = vec3(.021, .020, .022) * (.7 + .6 * fb(vW.xz * .9 + 3.)), grock = vec3(.011, .012, .015) * (.7 + .6 * vn(vW.xz * 1.7 + 5.));
        float glint = smoothstep(.7, .8, vn(vW.xz * 2.9 + 7.)) * (1. - rockK);     // the ground is lighter than the water's walls and has a grain of its own: wet sand and mud, the ribs grey rock
        vec3 ground = mix(gmud, grock, rockK) * (.5 + .65 * max(N.y, 0.)) + (F * .3 + .03 + .012 * glint) * skyPlain(normalize(R)) * (.35 - .2 * rockK);
        col = mix(col, ground, core);     // down the throat one sees dark blue-green water and nothing else: no sand's colour, no thread of foam, nothing green-yellow
        gl_FragColor = vec4(fogged(col, dist), 1.);
      }` });
  const floor = new THREE.Mesh(floorGeo, floorMat); floor.name = 'sand-shelf'; object.add(floor);
  await tick(ctx, 800);

  // the low rock
  const LR = makeLowRock(noise, core.makeRng(core.hashSeed('strait-caves:' + seed))), NCOL = 240, NROW = 72, tmp = [0, 0, 0];
  await tick(ctx, 7000);     // the low rock's laws run cold over the first places of its skin: counted before them
  const lowGeo = await gridGeometry(ctx, NCOL, NROW, (i, j, p) => { LR.surf(LR.F0 + (LR.F1 - LR.F0) * i / NCOL, j / NROW, tmp); p[0] = tmp[0]; p[1] = tmp[1]; p[2] = tmp[2]; }, false, true, 2.3);
  await tick(ctx, 20);
  // the horn's bluff (see HORN): one stone with the low rock (the same law answers the shade, the counts and the fig's place)
  const lowIn = (x, y, z) => LR.inside(x, y, z) || LR.horn.inside(x, y, z), lowInSkin = (x, y, z) => LR.inside(x, y, z) || LR.horn.insideSkin(x, y, z);
  await tick(ctx, 9000);     // the march's first steps run cold: counted before them
  await bakeGrid(ctx, lowGeo, NCOL + 1, NROW, false, lowIn, (x, y, z) => {
    const f = Math.atan2(z, x) * 180 / Math.PI, r = Math.hypot(x, z), cm = r < LR.rcS(f, y) + 12 ? LR.caveM(f, y) : 0, tf = LR.terr(y) % 1;
    return [(0.5 + 0.5 * sst(-12, 5, y)) * (1 - 0.5 * cm) * (0.8 + 0.2 * sst(0.1, 0.5, Math.abs(tf - 0.5) * 2)), 0.12 + 0.85 * (1 - sst(1.5, 8, y)), 1 - 0.4 * cm];
  }, { reach: 150, cost: 0.06, extraCost: 0.2, past: (x, y) => y > 37.4, eyes: opts.eyes ? opts.eyes.map((v, i) => i % 3 === 0 ? v - PC[0] : i % 3 === 2 ? v - PC[1] : v) : null });     // the line's places, in the pool's frame
  const lowMat = makeStoneMaterial(U, { stone: '#84726a', rough: 1, column: 1, barn: 0.3, caveA: [LR.caves[0].f, LR.caves[1].f, 999], caveW: [LR.caves[0].hw, LR.caves[1].hw, 1] });
  const low = new THREE.Mesh(lowGeo, lowMat); low.name = 'low-rock'; object.add(low);
  await tick(ctx, 180);
  { const NCH = 132, NRH = 100, g = await gridGeometry(ctx, NCH, NRH, (i, j, p) => { LR.horn.surf(i / NCH, j / NRH, tmp); p[0] = tmp[0]; p[1] = tmp[1]; p[2] = tmp[2]; }, true, true, 2.9);     // the horn's end: the low rock's own stone, its own skin
    await bakeGrid(ctx, g, NCH, NRH, true, lowInSkin, (x, y, z) => { const tf = LR.terr(y) % 1; return [(0.5 + 0.5 * sst(-12, 5, y)) * (0.8 + 0.2 * sst(0.1, 0.5, Math.abs(tf - 0.5) * 2)), 0.12 + 0.85 * (1 - sst(1.5, 8, y)), 1]; }, { reach: 150, cost: 0.22, extraCost: 0.6, past: (x, y) => y > 37.4 });
    const m = new THREE.Mesh(g, makeStoneMaterial(U, { stone: '#84726a', rough: 1, column: 1, barn: 0.3, flat: 0.15, beds: 0.6, bedT: 0.85, dip: [1, 0, 0.04] })); m.name = 'horn'; object.add(m); }
  await tick(ctx, 3400);

  // six to ten rounded boulders on the far shelf (they stand in the same weed-black stone; the sea covers them when the pool is shut)
  const rb = fk('boulders'), nb = rb.int(6, 10), bPos = [], bIdx = [];
  for (let i = 0; i < nb; i++) {
    const f = rb.range(-95, 40), r = rb.range(20, 35), a = f * Math.PI / 180, x = r * Math.cos(a), z = r * Math.sin(a), R = rb.range(0.6, 1.3), g = new THREE.IcosahedronGeometry(R, 1), pp = g.attributes.position.array, base = bPos.length / 3, sq = rb.range(0.55, 0.8);
    for (let k = 0; k < pp.length; k += 3) bPos.push(x + pp[k] * (1 + 0.25 * Math.sin(pp[k + 2] * 3)), floorY(x, z) + R * sq * 0.6 + pp[k + 1] * sq, z + pp[k + 2]);
    for (let k = 0; k < pp.length / 3; k++) bIdx.push(base + k);
    if (i % 3 === 2) await tick(ctx, 1100);
  }
  await tick(ctx, 2600);
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPos, 3)); bGeo.setIndex(bIdx); bGeo.computeVertexNormals();
  await tick(ctx, 260);
  bGeo.setAttribute('aBake', new THREE.Float32BufferAttribute(new Float32Array(bPos.length).map((v, i) => (i % 3 === 2 ? 1 : i % 3 === 1 ? 0.8 : 1)), 3));
  const boulders = new THREE.Mesh(bGeo, lowMat); boulders.name = 'boulders'; object.add(boulders);
  // THE TAIL (the gate): thirteen standing slabs of the low rock's own stone beyond its tree end and beyond the way out (the part's TAIL and mkSlab); the surf at their feet is the sea's own (tailD), their wet band the stone's
  const SLAB_US = [9700, 6600, 4200, 3800, 4500, 3600, 4000, 2700, 2600, 6700, 3300, 4000, 3500, 2900];     // what each slab's making costs (measured in node, a cold build)
  const tail = []; for (let i = 0; i < TAIL.length; i++) { await tick(ctx, SLAB_US[i] ?? 3800); const [x, z, R, H, fang, az, lnx, lnz] = TAIL[i]; const n = 4 + (i % 3), a0 = 47 * i + 13, f = [];
    if (az === undefined) for (let j = 0; j < n; j++) f.push([a0 + (j + 0.6 * hsh(i * 3 + j, 71)) * 360 / n, R * (0.7 + 0.45 * hsh(i * 5 + j, 73))]);
    // (the faces dealt here are read only by the eighth row's law, which is built and left out of the world: STONE_TAIL7_OUT)
    else f.push([az, R * (0.48 + 0.08 * hsh(i * 5, 73)), 0.05 + 0.03 * hsh(i, 171)], [az + 80 + 12 * hsh(i, 172), R * (1.15 + 0.1 * hsh(i, 176)), 0.1], [az + 128 + 16 * hsh(i, 174), R * 0.98, 0.09],
      [az + 180 + 10 * (hsh(i, 173) - 0.5), R * (0.48 + 0.08 * hsh(i * 5 + 2, 73)), 0.05 + 0.03 * hsh(i, 177)], [az + 262 + 12 * hsh(i, 175), R * (1.15 + 0.1 * hsh(i, 178)), 0.1]);
    const t = az !== undefined ? mkSlab(200 + i, { name: 'skerry' + i, c: [x, z], top: H, L: 1.2 * R, S: (0.56 + 0.1 * hsh(i * 5, 73)) * R, az: az + 90, dipAz: 160, dip: 0.3, th: [1.0, 3.0], lean: [lnx, lnz], ledge: 1.35, ...(TAIL_FAR(i) ? { col: 0.7, row: 0.8 } : {}) }) : mkTower(200 + i, { name: 'skerry' + i, c: [x, z], top: H, low: true, plain: true, tall: H > 6,     /* every ledge of the tail is a slanting bedded ledge: none keeps blunt lumps */ lean: az === undefined ? [0.1 * (hsh(i, 75) - 0.5), 0.1 * (hsh(i, 77) - 0.5)] : [lnx, lnz], sl: 0.3, ap: 0.8, sd: 0.5,     /* NO CONE AND NO POINT ON ANY SKERRY: each is a low slanting ledge of the bedded stone's own law (its top a bed going down into the sea at one end; two of them with blunt lumps), 1.4 to 3.6 m high */ g0: fang ? 1.4 : 1.8, g1: fang ? 1.2 : 2.4, f });     /* no pointed islet: the two that lean are low leaning blocks (3.4 and 3.6 m), their faces closing at 21 to 36 degrees */
    tail.push((STONE_TAIL6_OUT && i === 6) || (STONE_TAIL7_OUT && i === 7) ? { ...t, x, z, r: R, h: H, fang, out: true, inside: () => false } : { ...t, x, z, r: R, h: H, fang }); }     // one body a step (the ask stands before each)
  await tick(ctx, 800);
  const tailInside = (x, y, z) => { for (const t of tail) if (t.inside(x, y, z)) return true; return false; };
  const tailInSkin = (x, y, z) => { for (const t of tail) if ((t.insideSkin || t.inside)(x, y, z)) return true; return false; };
  // the same law for one march at a time: tailAim keeps the slabs the march's line can meet (in the world's frame; see marchMeets), tailInSkinAimed asks those
  const TAIL_C = new Int32Array(tail.length); let TAIL_N = 0;
  const tailAim = (x, y, z, lim) => { TAIL_N = 0; for (let i = 0; i < tail.length; i++) { const t = tail[i]; if (!t.out && (!t.bound || marchMeets(t.bound, x + PC[0], y, z + PC[1], lim))) TAIL_C[TAIL_N++] = i; } };
  const tailInSkinAimed = (x, y, z) => { for (let q = 0; q < TAIL_N; q++) { const t = tail[TAIL_C[q]]; if ((t.insideSkin || t.inside)(x, y, z)) return true; } return false; };
  { const tailMat = makeStoneMaterial(U, { stone: '#84726a', rough: 1, barn: 0, flat: 0.6, beds: 0.7, weedTop: 0.1, gate: 1 });     /* a ledge's skin takes its smooth slope: no folded card */     /* no pale line over the weed on a ledge; its skin's facets softened */     /* the weed stands 0.7 m up a ledge's foot (higher, a ledge 2 to 3 m high is a black lump) */     // dark jagged stone, flat-faced; NO white sheets over it (the surf at its foot is the sea's own)
    const TG = [];     // the slabs' skins, joined below in typed arrays (no pushing number by number: that is 700,000 pushes)
    // A LEDGE'S SKIN FOLLOWS ITS OWN LAW TO ITS TOP: level rows to where its head begins, then rows up its wall to the wall's own top at each bearing, then the
    // head's rings from the wall to the axis (as every other ledge's). Level rows to the plan top leave a thin spike on the axis above the bed (a pole on a tall ledge) and skin a slanting bed as a tent
    for (const t of tail) { if (t.out) continue;
      if (t.flags) { const nth = TG.length, gc = nth === 0 ? 1.8 : nth === 1 ? 1.0 : 0.6, mc = nth === 0 ? 0.86 : nth === 1 ? 0.43 : 0.235;     /* the first slabs' laws run cold: a place of the first skin and a step of its march cost three times a later one's, the second's twice (by the measure) */ const g = await flagsGeometry(ctx, t, PC[0], PC[1], gc); await bakeGrid(ctx, g, t.skin.nc, t.skin.nr, true, (x, y, z) => tailInSkinAimed(x + PC[0], y, z + PC[1]) || lowIn(x, y, z), (x, y, z) => [0.55 + 0.45 * sst(-1, 3, y), 1 - sst(0.8, 2.6, y), 1], { reach: 60, cost: mc, extraCost: nth < 2 ? 0.3 : 0.03, aim: tailAim });
        TG.push(g); continue; }
      const NCt = t.h > 6 ? 44 : 28, yl = t.head.yl, rows = [-5, -2, -0.6, 0.3, 0.9, 1.6, 2.4, 3.3, 4.3, 5.4, 6.5, 7.6, 8.7, 9.8, 10.9, 12, 13.1].filter((v) => v < yl - 0.25); rows.push(yl); const nb = rows.length - 1, NW = t.h > 12 ? 14 : t.h > 6 ? 10 : 4 /* a tall ledge's wall has ten rows to its top (with fewer, the baked shade under a proud bed is a row of dark points at its foot): its beds stand in its skin as slanting ledges, their shade follows them */, hs = [1, 0.86, 0.72, 0.58, 0.44, 0.3, 0.16, 0.002]     /* the innermost ring closes the head at its axis (at 0.03 of the rim a hole a hand across is left open there and the sea shows through it: a single dark dot on a rounded top) */, NRt = nb + NW + hs.length;     /* a finer skin: 28 columns round a low ledge, 44 round a tall one */
      const hq = new Float64Array(NCt * 3), hf = new Uint8Array(NCt), hx0 = t.c[0] + t.lean[0] * t.head.yc, hz0 = t.c[1] + t.lean[1] * t.head.yc;
      const g = await gridGeometry(ctx, NCt, NRt, (i, j, p) => { const b = TAU * i / NCt;
        if (j > nb && !hf[i]) { t.head.vertex(b, 1, p); hf[i] = 1; hq[i * 3] = p[0] - hx0; hq[i * 3 + 1] = p[1]; hq[i * 3 + 2] = p[2] - hz0; }     // the wall's top at this bearing, asked once
        if (j > nb + NW) { const sr = hs[j - nb - NW - 1], qx = hq[i * 3] * sr, qz = hq[i * 3 + 2] * sr; p[0] = hx0 + qx - PC[0]; p[1] = Math.min(t.top, sr === 1 ? hq[i * 3 + 1] : t.head.top(qx, qz)); p[2] = hz0 + qz - PC[1]; return; }     // no higher than its own law stands (the counts' and the bake's body)
        let y = rows[Math.min(j, nb)]; if (j > nb) y = yl + (Math.max(hq[i * 3 + 1], yl) - yl) * (j - nb) / (NW + 1);
        const r = Math.max(t.radius(b, y), 0.05); p[0] = t.x + t.lean[0] * y - PC[0] + r * Math.sin(b); p[1] = y; p[2] = t.z + t.lean[1] * y - PC[1] + r * Math.cos(b); }, true, true, 2);
      await bakeGrid(ctx, g, NCt, NRt, true, (x, y, z) => tailInside(x + PC[0], y, z + PC[1]) || LR.inside(x, y, z), (x, y, z) => [0.55 + 0.45 * sst(-1, 3, y), 1 - sst(0.8, 2.6, y), 1], { reach: 60 });
      TG.push(g); }
    let nv = 0, ni = 0; for (const g of TG) { nv += g.attributes.position.count; ni += g.index.count; }
    const P = new Float32Array(nv * 3), NN = new Float32Array(nv * 3), B = new Float32Array(nv * 3), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    { let v0 = 0, i0 = 0; for (const g of TG) { { const w = tick(ctx, 150); if (w) await w; } P.set(g.attributes.position.array, v0 * 3); NN.set(g.attributes.normal.array, v0 * 3); B.set(g.attributes.aBake.array, v0 * 3); const gi = g.index.array; for (let q = 0; q < gi.length; q++) I[i0 + q] = gi[q] + v0; v0 += g.attributes.position.count; i0 += gi.length; g.dispose(); } }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(P, 3)); tg.setAttribute('normal', new THREE.BufferAttribute(NN, 3)); tg.setAttribute('aBake', new THREE.BufferAttribute(B, 3)); tg.setIndex(new THREE.BufferAttribute(I, 1));
    const m = new THREE.Mesh(tg, tailMat); m.name = 'tail-skerry'; object.add(m); }
  await tick(ctx, 540);
  // ---- the fig: one great old tree ON THE BLUFF'S SHELF (the horn's end, HORN and makeLowRock), on its brink toward the line and the pool, its trunk leaning out from the brink toward the line and its
  // crown reaching FIG_REACH metres out over the water; its wind is the pool's. Its place is FOUND ON THE BUILT ROCK, not typed: of the bluff's northern half, the place whose brink at 7 m stands
  // nearest the line and whose own upper face, FIG_IN in from that brink, lies 7 to 12.5 m over the sea (the shelf: 11.2 m as built). The tree's size is SOLVED so that its furthest leaf at rest stands
  // FIG_REACH beyond the brink, whatever the dealt tree is. ITS TRUNK IS SEEN (its bole stands 1.8 of its own metres taller under the crown) AND ITS ROOTS GRIP THE ROCK (see THE FIG'S ROOTS below).
  const FIG_REACH = 8.5, FIG_IN = 3.5, FIG_LEAN = 0.42, FIG_FLAT = 0.92, FIG_Y0 = 7, FIG_Y1 = 12.5;
  const lowTop = (lx, lz) => { let y = LR.horn.topY(lx, lz); if (y < 30) for (let q = 37; q > y && q > -6; q -= 0.25) if (LR.inside(lx, q, lz)) { y = q; break; } return y; };     // the rock's upper face at a place (the pool's frame)
  let hornX = 1e9, hornZ = HORN.c[1] - PC[1], figY = FIG_Y0;
  for (let lz = HORN.c[1] - PC[1] + 0.1 * HORN.L, nz = 0; lz <= HORN.c[1] - PC[1] + 0.75 * HORN.L; lz += 0.5) { if (++nz % 3 === 0) await tick(ctx, 400); for (let lx = HORN.c[0] - PC[0] - HORN.S - 3; lx <= HORN.c[0] - PC[0]; lx += 0.25) if (lowIn(lx, FIG_Y0, lz)) { const h = lowTop(lx + FIG_IN, lz); if (lx < hornX && h >= FIG_Y0 && h <= FIG_Y1) { hornX = lx; hornZ = lz; figY = h; } break; } }
  if (hornX > 1e8) { hornX = HORN.c[0] - PC[0] - 0.6 * HORN.S; figY = Math.min(FIG_Y1, Math.max(FIG_Y0, lowTop(hornX + FIG_IN, hornZ))); }     // (no ledge of that height on the northern half: the bluff's own flank there)
  const figAt = [hornX + FIG_IN, figY, hornZ];
  const fr = Math.hypot(figAt[0], figAt[2]), inx = -figAt[0] / fr, inz = -figAt[2] / fr;     // toward the pool: the wind's bearing
  await tick(ctx, 9000);     // the leaf texture's first slice is the dear one (the canvas's making and its first read-back): counted before it
  await flora.prepareLeafTexture({}, () => tock(ctx, 4400), 3);
  const wind = flora.makeWind({ direction: [-figAt[0], -figAt[2]], strength: 1, gustiness: 0.5 });
  const figMat = flora.windMaterial({ wind, backlight: 0.9, ambient: 1.2, leafAmbient: 3.0, detail: 0.1, color: new THREE.Color(2.4, 2.4, 2.2) });     /* THE FIG IS LIT AS THE STONE IS: its leaves take the sky's light in their shade (as the shaded stone beside them does) and the low sun comes THROUGH them where the look goes toward the sun (the kit's own light through the leaf, strengthened three times); its bole and boughs, under the crown, take little of the sky (no paler than the lit rock) */     // the leaves take the light: the tree is not black against the lit rock     // smooth grey limbs (the bark's furrows nearly out); broad dark leaves
  await tick(ctx, 1900);
  await tick(ctx, 20);
  await tick(ctx, 960);
  let figS = 1;
  const figGeo = await figGeometry(ctx, fk('fig'), { dh: 3.2, bark: '#a59b8c', roots: (pa, tube) => {     // the part's own maker, in pieces: no step is a call of the kit's for a tree
    let figOut = 1e-3; const cl = Math.cos(FIG_LEAN), sl = Math.sin(FIG_LEAN); for (let i = 0; i < pa.length; i += 3) figOut = Math.max(figOut, -(pa[i] * cl - FIG_FLAT * pa[i + 1] * sl));
    figS = (FIG_REACH + FIG_IN) / figOut;     // its size: its furthest leaf at rest stands FIG_REACH beyond the brink
  } });
  await tick(ctx, 610);
  const fig = new THREE.Mesh(figGeo, figMat); fig.name = 'fig';
  // THE FIG'S ROOTS: seven great roots (as thick as the boughs, 0.6 to 0.9 m in radius at the bole; and a fork of some of them) go out from the
  // bole's foot over the shelf to its brink (to the nearest brink and to 9 m along it to either hand), bend over it and go DOWN THE BLUFF'S FACE, lying on its skin (the skin's own law at every
  // place: into its flutes, out over its ledges), winding a little, thinning to a third of their thickness, ending unequally 1.5 to 7.5 m over the sea. Pale smooth bark, lit and
  // shaded as the stone is (the stone's own material and its baked sun). Places in the world by the body's own numbers (no draw of the seed, nothing of the lens).
  { const HN = LR.horn, bB = Math.atan2(figAt[0] - FIG_IN - HN.c[0], figAt[2] - HN.c[1]), rB = Math.max(3, HN.face(bB, HN.T(bB))), NRT = 7, RP = [], RN = [], RB = [], RI = []; let v0 = 0;
    const lay = async (pts, rad) => { const n = pts.length; if (n < 3) return; const fr = []; let ux = 0, uy = 1, uz = 0;
      for (let i = 0; i < n; i++) { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz; let ul = Math.hypot(ux, uy, uz); if (ul < 1e-3) { ux = tz; uy = 0; uz = -tx; ul = Math.hypot(ux, uy, uz) || 1; } ux /= ul; uy /= ul; uz /= ul;
        fr.push([ux, uy, uz, ty * uz - tz * uy, tz * ux - tx * uz, tx * uy - ty * ux]); }
      const g = await gridGeometry(ctx, 7, n - 1, (i, j, p) => { const f = fr[j], an = TAU * i / 7, ca = Math.cos(an), sa = Math.sin(an), r = rad[j]; p[0] = pts[j][0] + r * (f[0] * ca + f[3] * sa); p[1] = pts[j][1] + r * (f[1] * ca + f[4] * sa); p[2] = pts[j][2] + r * (f[2] * ca + f[5] * sa); }, true, false, 0.5);
      await bakeGrid(ctx, g, 7, n - 1, true, lowInSkin, () => [0.92, 0, 1], { reach: 40, cost: 0.29, extraCost: 0.15 });
      const gp = g.attributes.position.array, gn = g.attributes.normal.array, gb = g.attributes.aBake.array, gi = g.index.array; for (let q = 0; q < gp.length; q++) { RP.push(gp[q]); RN.push(gn[q]); RB.push(gb[q]); } for (let q = 0; q < gi.length; q++) RI.push(gi[q] + v0); v0 += gp.length / 3; g.dispose(); };
    // down the face from a place on the brink: its bearing about the bluff's middle, the height it starts from and the height it ends at, its thickness, how it drifts aside, and (pre) the way to there
    const down = async (b0, y0, y1, r0, r1, drift, ph0, s0, pre, preR) => { const pts = pre.slice(), rad = preR.slice(), Ld = Math.max(y0 - y1, 1), rf = [], bb = [], yy = [];
      for (let d = 0.3; d <= Ld; d += 0.35) { const side = s0 + drift * d + 0.55 * Math.sin(d * 0.55 + ph0) + 0.2 * Math.sin(d * 1.7 + 2 * ph0) - 0.55 * Math.sin(ph0) - 0.2 * Math.sin(2 * ph0), b = b0 + side / rB, y = y0 - d; bb.push(b); yy.push(y); rf.push(HN.face(b, y)); }
      for (let i = 0; i < rf.length; i++) { const m = (rf[Math.max(i - 1, 0)] + rf[i] + rf[Math.min(i + 1, rf.length - 1)]) / 3, rr = r0 + (r1 - r0) * (i + 1) / rf.length, r = Math.max(rf[i], m) + 0.45 * rr; pts.push([HN.c[0] + r * Math.sin(bb[i]), yy[i], HN.c[1] + r * Math.cos(bb[i])]); rad.push(rr); }
      await lay(pts, rad); return { bb, yy, rad: rad.slice(pre.length), s: (i) => (bb[i] - b0) * rB }; };
    for (let r = 0; r < NRT; r++) { const off = -9 + 18 * (r + 0.7 * hsh(r, 811)) / NRT, b0 = bB + off / rB, T0 = HN.T(b0), rT = HN.face(b0, T0), r0 = 0.6 + 0.3 * hsh(r, 815), yEnd = 1.5 + 6 * hsh(r, 813) * hsh(r, 813), pre = [], preR = [];     /* seven roots as thick as the boughs (no thin pale lines on the face) */
      const ex = HN.c[0] + (rT - 0.3) * Math.sin(b0), ez = HN.c[1] + (rT - 0.3) * Math.cos(b0), dxs = ex - figAt[0], dzs = ez - figAt[2], dl = Math.hypot(dxs, dzs) || 1, bow = 0.2 * dl * (hsh(r, 817) - 0.5);
      for (let j = 0; j <= 7; j++) { const t = j / 7, tt = 0.1 + 0.9 * t, sb = bow * Math.sin(Math.PI * t), x = figAt[0] + dxs * tt - dzs / dl * sb, z = figAt[2] + dzs * tt + dxs / dl * sb, rr = r0 * (1.55 - 0.55 * sst(0, 0.6, t)); let y = HN.topSkin(x, z); if (y < -1e8) y = T0;
        pre.push([x, y + 0.35 * rr + 1.2 * (1 - sst(0, 0.5, t)), z]); preR.push(rr); }
      pre.push([HN.c[0] + (rT + 0.25 * r0) * Math.sin(b0), T0 + 0.05, HN.c[1] + (rT + 0.25 * r0) * Math.cos(b0)]); preR.push(r0);     // over the brink
      const drift = 0.5 * (hsh(r, 821) - 0.5), ph0 = TAU * hsh(r, 819), m = await down(b0, T0, yEnd, r0, 0.3 * r0 + 0.06, drift, ph0, 0, pre, preR);
      if (hsh(r, 823) > 0.42 && m.bb.length > 10) { const i0 = Math.floor(m.bb.length * (0.25 + 0.3 * hsh(r, 825))), rr = 0.66 * m.rad[i0], yF = m.yy[i0], p0 = [HN.c[0] + (HN.face(m.bb[i0], yF) + 0.45 * m.rad[i0]) * Math.sin(m.bb[i0]), yF, HN.c[1] + (HN.face(m.bb[i0], yF) + 0.45 * m.rad[i0]) * Math.cos(m.bb[i0])];     // it forks: the lesser arm goes off to the other hand
        await down(b0, yF, Math.min(yF - 2, yEnd + 0.8 + 2.5 * hsh(r, 827)), rr, 0.3 * rr + 0.03, (drift > 0 ? -1 : 1) * (0.35 + 0.3 * hsh(r, 829)), TAU * hsh(r, 831), m.s(i0), [p0], [rr]); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(RN, 3)); rg.setAttribute('aBake', new THREE.Float32BufferAttribute(RB, 3)); rg.setIndex(RI);
    const rm = new THREE.Mesh(rg, makeStoneMaterial(U, { stone: '#857a6b', rough: 0.3, barn: 0, weedTop: -9, gate: 1, band: 0.01 })); rm.name = 'fig-roots';     /* in the shade they take the gate's own dusk mauve (by the mountain's blue they are blue cracks) */ object.add(rm); await tick(ctx, 250); }
  fig.position.set(figAt[0], figAt[1] - 1.5, figAt[2]); fig.scale.set(figS, FIG_FLAT * figS, figS);     // a broad crown on a short leaning bole
  fig.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), FIG_LEAN);       // leaning out over the water toward the line
  object.add(fig);
  await tick(ctx, 60);
  return {
    object, radius: 110, height: 70, center: new THREE.Vector3(0, 8, 0), fig: { at: figAt, scale: figS, reach: FIG_REACH, brinkX: PC[0] + hornX },
    anchors: { centre: new THREE.Vector3(PC[0], 0, PC[1]), rim: new THREE.Vector3(PC[0] - 35, 0, PC[1]), figTree: new THREE.Vector3(PC[0] + figAt[0], figAt[1], PC[1] + figAt[2]), eastHorn: new THREE.Vector3(PC[0] - 13, 0, -317) },
    shared: U, phase, seaMaterial: seaMat, lowRock: { ...LR, inside: lowIn }, tail, tailInside,
    phaseAt: (time) => ((time + phase) % ROUND + ROUND) % ROUND,
    surfaceHeight: (x, z, time) => seaHeight(x, z, time, ((time + phase) % ROUND + ROUND) % ROUND),
    update(dt, time) {
      const R = setClock(U, time, phase);
      // the fig moves with the round: drawn in while the sea sinks, flung at the burst, shivering under the fall
      const flung = sst(0, 0.8, R.age) * (1 - sst(1.5, 5, R.age)), shiver = sst(2, 4, R.age) * (1 - sst(7, 11, R.age));
      wind.set({ strength: 0.55 + 0.9 * R.open + 2.6 * flung + 0.9 * shiver, speed: 0.8 + 1.4 * flung + 1.6 * shiver, direction: [inx * (1 - 2 * flung), inz * (1 - 2 * flung) + 1e-3] });
      wind.update(time);
    },
    dispose() {}, ground: false,
  };
}
