// HOUSES ON STRINGS, part: the buildings and their timber rafts.
// ONE tradition only: the upland stone farm villages of northern England (longhouses, field barns, a row of low
// cottages, a small chapel with a bell-cote, a stone tower windmill joined to a low range, a greenhouse on a stone wall,
// an open hay barn): low and wide, coursed rubble or limewash, heavy stone slates, square chimneys at the
// gable ends, small deep windows. Each stands on a raft of squared timbers, two layers crossed, with planking, a
// strip of yard, cross-braces and canvas sandbags under it. Geometry is dealt as plain arrays (no three.js) into a
// builder; one shader draws stone, slate, timber, glass, canvas and cloth with real pattern, filtered by the
// pixel's footprint, and gives every vertex its hung thing's sway (the balloons' own function).
import * as THREE from 'three';
import { SWAY_GLSL, toWorld } from './houses-on-strings-balloons.js';

export const MAT = { STONE: 0, LIME: 1, SLATE: 2, TIMBER: 3, WINDOW: 4, GLASS: 5, CANVAS: 6, PLAIN: 7, LEAF: 8, SAIL: 9, BELL: 10, CLOTH: 11, FLAG: 12, BOARD: 13 };
const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
// the walls are a pale, cool grey gritstone and limestone (the tradition's own), so that a building stands off the warm sandstone cliff behind it
export const COL = { stone: C('#cbc8bc'), stoneB: C('#b4b2a9'), lime: C('#ebe6d8'), slate: C('#7b7166'), timber: C('#6a5138'), dark: C('#2e241b'), iron: C('#2a2f33'),
  canvas: C('#cdbf9c'), plank: C('#96815e'), leaf: C('#4f7a34'), cabbage: C('#6f9a5a'), hay: C('#c8a84e'), white: C('#e8e6e0'), straw: C('#b89a5a'), rowan: C('#c2401e') };

export const VSTRIDE = 19;
export function makeBuilder(zones) { const B = { z: [], tf: null }; for (let i = 0; i < zones; i++) B.z.push({ v: [], i: [], n: 0 }); return B; }
const W = [0, 0, 0];
// a quad a-b-c-d (local places, counter-clockwise from outside); u runs a to b, v runs a to d, in metres
export function quad(B, H, a, b, c, d, m, col, us = 1, u0, v0) {
  const t = B.tf; if (t) { a = t(a); b = t(b); c = t(c); d = t(d); }
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
  const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
  const wnx = nx * H.cs + nz * H.sn, wnz = -nx * H.sn + nz * H.cs, lu = us ? Math.hypot(e1[0], e1[1], e1[2]) * us : 1, lv = us ? Math.hypot(e2[0], e2[1], e2[2]) * us : 1;
  const U0 = u0 ?? (a[0] * 0.73 + a[2] * 0.61 + (H.x % 7)), V0 = v0 ?? a[1];
  const Z = B.z[H.zone], n = Z.n, pts = [a, b, c, d], uv = [[0, 0], [lu, 0], [lu, lv], [0, lv]];
  for (let k = 0; k < 4; k++) {
    toWorld(H, pts[k][0], pts[k][1], pts[k][2], W);
    Z.v.push(W[0], W[1], W[2], wnx, ny, wnz, col[0], col[1], col[2], U0 + uv[k][0], V0 + uv[k][1], m, H.pivot[0], H.pivot[1], H.pivot[2], H.mv[0], H.mv[1], H.mv[2], H.mv[3]);
  }
  Z.i.push(n, n + 1, n + 2, n, n + 2, n + 3); Z.n += 4;
}
export function tri(B, H, a, b, c, m, col) { quad(B, H, a, b, c, c, m, col); }
export function box(B, H, x0, y0, z0, x1, y1, z1, m, col, us = 1) {
  quad(B, H, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], m, col, us);      // +z
  quad(B, H, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], m, col, us);      // -z
  quad(B, H, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], m, col, us);      // +x
  quad(B, H, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], m, col, us);      // -x
  quad(B, H, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], m, col, us);      // top
  quad(B, H, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], m, col, us);      // bottom
}
export function cyl(B, H, cx, y0, cz, r0, r1, h, seg, m, col, cap = true) {
  for (let i = 0; i < seg; i++) {
    const a = i / seg * 6.2832, b = (i + 1) / seg * 6.2832, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    quad(B, H, [cx + cb * r0, y0, cz + sb * r0], [cx + ca * r0, y0, cz + sa * r0], [cx + ca * r1, y0 + h, cz + sa * r1], [cx + cb * r1, y0 + h, cz + sb * r1], m, col, 1, i / seg * 6.2832 * r0, y0);
    if (cap) tri(B, H, [cx, y0 + h, cz], [cx + cb * r1, y0 + h, cz + sb * r1], [cx + ca * r1, y0 + h, cz + sa * r1], m, col);
  }
}
export function blob(B, H, cx, cy, cz, rx, ry, rz, m, col, seg = 6) {
  const rings = 3;
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
    const p = (jj, ii) => { const e = -1.5708 + jj / rings * 3.1416, a = ii / seg * 6.2832; return [cx + Math.cos(e) * Math.cos(a) * rx, cy + Math.sin(e) * ry, cz + Math.cos(e) * Math.sin(a) * rz]; };
    quad(B, H, p(j, i + 1), p(j, i), p(j + 1, i), p(j + 1, i + 1), m, col);
  }
}
// a gabled stone range with its long axis on x: walls, gables, a heavy slate roof, chimneys at the gable ends
function range(B, H, rng, o) {
  const { L, D, eave } = o, hx = L / 2, hz = D / 2, rise = hz * Math.tan((o.pitch || 37) * Math.PI / 180), ry = eave + rise, wm = o.lime ? MAT.LIME : MAT.STONE, wc = o.lime ? COL.lime : (o.alt ? COL.stoneB : COL.stone);
  const x0 = (o.x0 || 0) - hx, x1 = (o.x0 || 0) + hx, y0 = o.y0 || 0;
  if (!o.open) quad(B, H, [x0, y0, hz], [x1, y0, hz], [x1, eave, hz], [x0, eave, hz], wm, wc);
  quad(B, H, [x1, y0, -hz], [x0, y0, -hz], [x0, eave, -hz], [x1, eave, -hz], wm, wc);
  for (const s of [1, -1]) {
    const x = s > 0 ? x1 : x0;
    quad(B, H, [x, y0, s * hz], [x, y0, -s * hz], [x, eave, -s * hz], [x, eave, s * hz], wm, wc);
    tri(B, H, [x, eave, s * hz], [x, eave, -s * hz], [x, ry, 0], wm, wc);
  }
  const ov = 0.35, ovx = 0.3, dy = ov * rise / hz, sl = Math.hypot(hz + ov, rise + dy);
  for (const s of [1, -1]) {                                       // two slopes, a thick verge and the eaves' underside
    quad(B, H, [s * (x0 - ovx) + (s < 0 ? x0 + x1 : 0), eave - dy, s * (hz + ov)], [s * (x1 + ovx) + (s < 0 ? x0 + x1 : 0), eave - dy, s * (hz + ov)], [s * (x1 + ovx) + (s < 0 ? x0 + x1 : 0), ry + 0.12, 0], [s * (x0 - ovx) + (s < 0 ? x0 + x1 : 0), ry + 0.12, 0], MAT.SLATE, COL.slate, 1, 0, 0);
    box(B, H, x0 - ovx, eave - dy - 0.16, s * (hz + ov) - 0.08, x1 + ovx, eave - dy, s * (hz + ov) + 0.08, MAT.SLATE, COL.slate);
  }
  box(B, H, x0 - ovx, ry, -0.16, x1 + ovx, ry + 0.2, 0.16, MAT.STONE, COL.stoneB);        // the ridge stones
  for (const cx of o.chim || []) { const x = (o.x0 || 0) + cx; box(B, H, x - 0.6, ry - 1.0, -0.5, x + 0.6, ry + 1.5, 0.5, MAT.STONE, COL.stoneB); box(B, H, x - 0.7, ry + 1.5, -0.6, x + 0.7, ry + 1.66, 0.6, MAT.STONE, COL.stone);
    cyl(B, H, x, ry + 1.66, 0, 0.2, 0.17, 0.5, 6, MAT.PLAIN, COL.straw); }   // a buff clay pot: no bright upright speck stands on a roof
  const face = (x, yb, w, h, s, m, col) => quad(B, H, [x - s * w / 2, yb, s * (hz + 0.04)], [x + s * w / 2, yb, s * (hz + 0.04)], [x + s * w / 2, yb + h, s * (hz + 0.04)], [x - s * w / 2, yb + h, s * (hz + 0.04)], m, col, m === MAT.WINDOW ? 0 : 1, 0, 0);
  for (const [x, s, w, h, yb] of o.wins || []) { const d = rng(); face((o.x0 || 0) + x, y0 + (yb ?? 1.0), w || 0.8, h || 1.0, s, MAT.WINDOW, [d, 0.5, 0.5]); }
  for (const [x, s, w, h] of o.doors || []) face((o.x0 || 0) + x, y0, w || 1.0, h || 1.95, s, MAT.TIMBER, COL.dark);
  for (const s of o.endWins || []) quad(B, H, [s * (hx + 0.04) + (o.x0 || 0), eave - 0.3, s * 0.4], [s * (hx + 0.04) + (o.x0 || 0), eave - 0.3, -s * 0.4], [s * (hx + 0.04) + (o.x0 || 0), eave + 0.7, -s * 0.4], [s * (hx + 0.04) + (o.x0 || 0), eave + 0.7, s * 0.4], MAT.WINDOW, [0.9, 0.5, 0.5], 0, 0, 0);
  return { ridgeY: ry + 0.2, eavesY: eave, hx, hz };
}

// the raft of beams under a building of L by D: returns the beam ends (local places) lines are made fast to
export function raft(B, H, rng, L, D, o = {}) {
  const out = o.out ?? 2.2, yard = o.yard ?? 1.5, front = o.front ?? 2.8, hx = L / 2 + yard, zf = D / 2 + front, zb = -D / 2 - yard * 0.8, ends = [];
  box(B, H, -hx, -0.12, zb, hx, 0, zf, MAT.TIMBER, COL.plank, 1);                                   // planking
  const bx = L / 2 + out, bzf = D / 2 + Math.max(out, front + 0.6), bzb = -D / 2 - out;
  const nc = Math.max(4, Math.round((2 * bx) / 2.3));
  for (let i = 0; i <= nc; i++) { const x = -bx + 0.4 + i * (2 * bx - 0.8) / nc; box(B, H, x - 0.25, -0.62, bzb, x + 0.25, -0.12, bzf, MAT.TIMBER, COL.timber); ends.push([x, -0.3, bzf], [x, -0.3, bzb]); }
  const nl = Math.max(3, Math.round((bzf - bzb) / 2.4));
  for (let i = 0; i <= nl; i++) { const z = bzb + 0.5 + i * (bzf - bzb - 1) / nl; box(B, H, -bx - 0.5, -1.12, z - 0.25, bx + 0.5, -0.62, z + 0.25, MAT.TIMBER, COL.timber); ends.push([bx + 0.5, -0.8, z], [-bx - 0.5, -0.8, z]); }
  const ext = o.ext ?? 4;                                                                             // the two long cradle beams: they stick out past the raft at both ends, and every line is made fast along them
  for (const z of [bzf + 0.35, bzb - 0.35]) { box(B, H, -bx - ext, -0.95, z - 0.3, bx + ext, -0.3, z + 0.3, MAT.TIMBER, COL.dark); ends.push([bx + ext, -0.3, z], [-bx - ext, -0.3, z]); }
  for (const s of [1, -1]) {                                                                          // cross-braces
    quad(B, H, [-bx * 0.9, -1.14, s * bzb * 0.9], [-bx * 0.9 + 0.35, -1.14, s * bzb * 0.9], [bx * 0.9, -1.14, -s * bzb * 0.9], [bx * 0.9 - 0.35, -1.14, -s * bzb * 0.9], MAT.TIMBER, COL.dark);
  }
  const step = o.bags || 1.5;                                                                         // canvas sandbags on short ties
  for (let x = -bx + 0.3; x < bx; x += step) for (const z of [bzb + 0.5, bzf - 0.5]) { const j = rng() * 0.25; box(B, H, x - 0.3, -1.95 + j, z - 0.22, x + 0.3, -1.4 + j, z + 0.22, MAT.CANVAS, COL.canvas); }
  for (let z = bzb + 1.6; z < bzf - 1.2; z += step) for (const x of [-bx, bx]) { const j = rng() * 0.25; box(B, H, x - 0.22, -1.95 + j, z - 0.3, x + 0.22, -1.4 + j, z + 0.3, MAT.CANVAS, COL.canvas); }
  return { ends, hx, zf, zb, bx, bzf, bzb };
}

// what stands on the planking, as room allows (front yard on +z)
function yard(B, H, rng, L, D, R, o = {}) {
  const zf = R.zf, hx = R.hx, z1 = D / 2 + 0.5;
  box(B, H, -1.2, 0, z1 - 0.4, 1.4, 0.05, zf - 0.6, MAT.FLAG, COL.stoneB);                           // flagstones at the door
  const wx = hx - 0.5; box(B, H, -wx, 0, zf - 0.55, wx * 0.45, 0.95, zf - 0.1, MAT.STONE, COL.stone); box(B, H, -wx, 0.95, zf - 0.6, wx * 0.45, 1.1, zf - 0.05, MAT.FLAG, COL.stoneB);   // drystone wall, its coping
  const bedX = -hx + 1.2;                                                                             // cabbages
  for (let i = 0; i < 5; i++) blob(B, H, bedX + i * 0.8, 0.2, z1 + 0.35, 0.3, 0.24, 0.3, MAT.LEAF, COL.cabbage, 4);
  const tx = hx - 1.3, tz = (z1 + zf) / 2 - 0.4;                                                       // a half-barrel
  cyl(B, H, tx, 0, tz, 0.55, 0.62, 0.7, 8, MAT.TIMBER, COL.timber);
  box(B, H, hx - 2.6, 0, -D / 2 - 1.05, hx - 0.3, 1.2, -D / 2 - 0.15, MAT.TIMBER, COL.straw, 3);         // stacked firewood (end grain)
  for (let i = 0; i < 3; i++) cyl(B, H, 2.4 + i * 0.5, 0, z1 + 0.3, 0.17, 0.12, 0.62, 6, MAT.PLAIN, COL.iron);   // milk churns
  cyl(B, H, -2.6, 0, z1 + 0.35, 0.42, 0.42, 1.0, 8, MAT.TIMBER, COL.timber);                          // a water butt
  box(B, H, 3.6, 0.42, z1 + 0.1, 5.2, 0.5, z1 + 0.5, MAT.TIMBER, COL.plank); box(B, H, 3.7, 0, z1 + 0.15, 3.8, 0.42, z1 + 0.45, MAT.TIMBER, COL.dark); box(B, H, 5.0, 0, z1 + 0.15, 5.1, 0.42, z1 + 0.45, MAT.TIMBER, COL.dark);   // a bench
  for (let i = 0; i < 2; i++) { const x = -hx + 0.9 + i * 0.9; box(B, H, x - 0.3, 0, zb(R) + 0.2, x + 0.3, 0.3, zb(R) + 0.8, MAT.TIMBER, COL.plank); blob(B, H, x, 0.62, zb(R) + 0.5, 0.3, 0.36, 0.3, MAT.PLAIN, COL.straw, 6); }   // straw beehives
  B.tf = (p) => [p[0], p[1], p[2] - p[1] * 0.28];                                                      // a ladder against the wall
  box(B, H, -5.3, 0, z1 + 0.9, -5.22, 3.1, z1 + 0.98, MAT.TIMBER, COL.plank); box(B, H, -4.8, 0, z1 + 0.9, -4.72, 3.1, z1 + 0.98, MAT.TIMBER, COL.plank);
  for (let k = 0; k < 6; k++) box(B, H, -5.3, 0.4 + k * 0.45, z1 + 0.92, -4.72, 0.45 + k * 0.45, z1 + 0.96, MAT.TIMBER, COL.plank);
  B.tf = null;
}
const zb = (R) => R.zb;

// one building on its raft at H. Returns what the bunches need: the beam ends, the ridge, the eaves, the top
export function addBuilding(B, H, rng, kind, o = {}) {
  if (kind === 'house') return addHouse(B, Object.assign({ sc: 1.25 }, H));   // the house is drawn a quarter larger than its measures: its ridge 14 m over its foot
  let L, D, r, R, top, extra = {};
  const win = (xs, s) => xs.map((x) => [x, s]);
  if (kind === 'longhouse') {
    const Lm = (o.L || 16 + Math.floor(rng() * 7)) - 3, x0 = 1.5; D = 6 + rng(); L = Lm + 3;                    // house and byre under one long roof, a lean-to: 16 to 22 m in all
    const e = 2.3 + rng() * 0.4, hx = Lm / 2, lime = o.lime ?? false, nb = Math.round(Lm * 0.36);                 // eaves low; limewash only where the plan says (a long farm range)
    const xs = []; for (let x = -hx + 1.5; x < hx - nb - 0.5; x += 2.4) xs.push(x);
    r = range(B, H, rng, { L: Lm, D, eave: e, lime, x0, chim: [-hx + 0.7, hx - nb - 0.3], wins: [...win(xs.filter((x, i) => i !== 1), 1), ...win(xs.filter((x, i) => i % 2 === 0), -1), [hx - nb * 0.5, 1, 0.5, 0.5, 2.0],
      ],
      doors: [[xs[1] ?? 0, 1], [hx - nb * 0.5, 1, 1.5, 1.8]], endWins: [1] });
    range(B, H, rng, { L: 3, D: D * 0.62, eave: 1.9, x0: x0 - hx - 1.5, lime, pitch: 30, doors: [[0, 1, 0.9, 1.6]] });           // the lean-to
    R = raft(B, H, rng, L, D, o); top = r.ridgeY + 2.2; extra.ridge = Lm / 2 - 1.8;
  } else if (kind === 'barn' || kind === 'haybarn') {
    L = 16; D = 7.6; const e = 3.0, f = L / 12;
    r = range(B, H, rng, { L, D, eave: e, alt: true, open: false, doors: kind === 'barn' ? [[0, 1, 2.6, 2.6], [-3.5 * f, -1, 1, 1.9]] : [], wins: [[-4.4 * f, 1, 0.18, 0.9, 1.6], [4.4 * f, 1, 0.18, 0.9, 1.6], [3.5 * f, -1, 0.18, 0.9, 1.6], [0, -1, 0.18, 0.9, 1.6]] });
    if (kind === 'haybarn') { for (const x of [-5.8 * f, -2 * f, 2 * f, 5.8 * f]) box(B, H, x - 0.15, 0, D / 2 - 0.3, x + 0.15, e, D / 2, MAT.TIMBER, COL.timber); box(B, H, -5.4 * f, 0, -3.4, 5.4 * f, 2.0, 2.6, MAT.PLAIN, COL.hay); box(B, H, -5.4 * f, 2.0, -3.4, 1.5, 2.8, 1.2, MAT.PLAIN, COL.hay); }
    R = raft(B, H, rng, L, D, o); top = r.ridgeY;
  } else if (kind === 'cottages') {
    L = 19.5; D = 5.8; const e = 2.2, ws = [], ds = [];
    for (let k = 0; k < 3; k++) { const x = -L / 2 + 3.25 + k * 6.5; ds.push([x - 1.4, 1]); ws.push([x + 0.6, 1], [x + 2.1, 1, 0.7, 0.9], [x - 1.2, -1], [x + 1.4, -1]); }
    r = range(B, H, rng, { L, D, eave: e, lime: false, chim: [-L / 2 + 0.7, -3.25, 3.25, L / 2 - 0.7], wins: ws, doors: ds });
    R = raft(B, H, rng, L, D, o); top = r.ridgeY + 1.7;
  } else if (kind === 'chapel') {
    L = 12; D = 6.4; const e = 3.6;
    r = range(B, H, rng, { L, D, eave: e, pitch: 40, wins: [...win([-3.6, -1.2, 1.2, 3.6], 1), ...win([-3.6, -1.2, 1.2, 3.6], -1)].map((w) => [w[0], w[1], 0.55, 1.5, 1.3]), doors: [[-4.8, 1, 1.1, 2.1]], endWins: [1] });
    const bx = -L / 2, by = r.ridgeY;                                                                 // the bell-cote on the west gable
    box(B, H, bx - 0.25, by - 0.4, -0.75, bx + 0.45, by + 1.5, -0.45, MAT.STONE, COL.stoneB); box(B, H, bx - 0.25, by - 0.4, 0.45, bx + 0.45, by + 1.5, 0.75, MAT.STONE, COL.stoneB);
    box(B, H, bx - 0.3, by + 1.5, -0.85, bx + 0.5, by + 1.72, 0.85, MAT.STONE, COL.stone); tri(B, H, [bx + 0.1, by + 1.72, 0.85], [bx + 0.1, by + 1.72, -0.85], [bx + 0.1, by + 2.4, 0], MAT.STONE, COL.stoneB);
    cyl(B, H, bx + 0.1, by + 0.55, 0, 0.36, 0.14, 0.62, 7, MAT.BELL, [0.45, 0.33, 0.13]); extra.bell = [bx + 0.1, by + 1.3, 0];
    R = raft(B, H, rng, L, D, o); top = by + 2.4;
  }
  if (r && !o.plain) yard(B, H, rng, L, D, R, o);
  else if (r) {
    const zf = R.zf, hx = R.hx, z1 = D / 2 + 0.5, tx = hx - 1.2, tz = z1 + 0.85;
    box(B, H, -hx + 0.5, 0, zf - 0.55, hx * 0.4, 0.95, zf - 0.1, MAT.STONE, COL.stone);
    cyl(B, H, tx, 0, tz, 0.55, 0.62, 0.7, 6, MAT.TIMBER, COL.timber);                                  // a half-barrel
    box(B, H, 1.6, 0, z1 + 0.1, 3.6, 1.0, z1 + 0.9, MAT.TIMBER, COL.straw, 3);
  }
  return r ? { kind, L, D, ends: R.ends, ridge: L / 2 - 0.5, ridgeY: r.ridgeY, eavesY: r.eavesY, eavesZ: r.hz + 0.3, top, R, ...extra } : addSpecial(B, H, rng, kind, o);
}

function addSpecial(B, H, rng, kind, o) {
  let L, D, R, top, ridgeY, eavesY, eavesZ, extra = {};
  if (kind === 'mill') {                                             // the stone tower windmill, stout (11 m high, 7 m across at the foot), four broad white sails that turn; joined to a long low stone range on one broad deck 26 m long (the tower under half the deck's length)
    L = 26; D = 8; const tx0 = -8.5;
    cyl(B, H, tx0, 0, 0, 3.5, 2.3, 11, 16, MAT.STONE, COL.stoneB, false);
    cyl(B, H, tx0, 11, 0, 2.6, 2.6, 0.35, 14, MAT.TIMBER, COL.dark); blob(B, H, tx0, 11.3, -0.3, 2.7, 1.9, 3.7, MAT.TIMBER, COL.dark, 8);   // the dark boat-shaped cap
    for (const [a, y] of [[1.5708, 0], [0.2, 3.6], [2.9, 6.6]]) { const rr = 3.5 - 1.2 * (y + 1) / 11 + 0.05, x = tx0 + Math.cos(a) * rr, z = Math.sin(a) * rr, tx = -Math.sin(a), tz = Math.cos(a), w = y ? 0.4 : 0.6, h = y ? 1.0 : 2.0;
      quad(B, H, [x - tx * w, y, z - tz * w], [x + tx * w, y, z + tz * w], [x + tx * w, y + h, z + tz * w], [x - tx * w, y + h, z - tz * w], y ? MAT.WINDOW : MAT.TIMBER, y ? [0.95, 0.5, 0.5] : COL.dark, y ? 0 : 1, 0, 0); }
    const hub = [tx0, 11.6, 3.9]; cyl(B, H, tx0, 11.35, 2.4, 0.3, 0.3, 0.5, 6, MAT.TIMBER, COL.dark);
    for (let k = 0; k < 4; k++) {                                    // each sail 9.4 m long: a stock, pale cloth 3.2 m wide on a lattice of bars
      const a = k * 1.5708 + 0.3, ca = Math.cos(a), sa = Math.sin(a);
      B.tf = (p) => [hub[0] + p[0] * ca - p[1] * sa, hub[1] + p[0] * sa + p[1] * ca, hub[2] + p[2]];
      box(B, H, -0.16, 0, -0.1, 0.16, 9.4, 0.1, MAT.SAIL, COL.timber);
      quad(B, H, [0.16, 1.4, 0.05], [3.35, 1.4, 0.05], [3.35, 9.0, 0.05], [0.16, 9.0, 0.05], MAT.SAIL, COL.white, 1, 0, 0);
      for (let j = 0; j < 6; j++) box(B, H, 0.16, 1.4 + j * 1.5, 0.06, 3.4, 1.5 + j * 1.5, 0.12, MAT.SAIL, COL.timber);
      box(B, H, 3.3, 1.4, 0.06, 3.4, 9.0, 0.12, MAT.SAIL, COL.timber);
      B.tf = null;
    }
    const st = range(B, H, rng, { L: 15, D: 4.8, eave: 2.3, x0: 3.6, pitch: 32, chim: [6.5], doors: [[0, 1, 1.0, 1.8]], wins: [[-5.4, 1], [-2.6, 1], [2.6, 1], [5.4, 1]] });   // the long low stone range on the same broad deck
    extra.sail = hub; extra.sailR = 9.4; R = raft(B, H, rng, L, D, { ...o, bags: 1.1 }); top = 21.4; ridgeY = st.ridgeY; eavesY = 2.2; eavesZ = 2.6;
    box(B, H, -R.hx + 0.4, 0, R.zf - 0.6, -R.hx * 0.45, 0.9, R.zf - 0.15, MAT.STONE, COL.stone); for (let i = 0; i < 5; i++) box(B, H, 0.3 + (i % 2) * 0.5, 0 + Math.floor(i / 2) * 0.32, -3.4 - (i % 3) * 0.1, 1.5, 0.32 + Math.floor(i / 2) * 0.32, -2.7, MAT.CANVAS, COL.canvas);   // a wall, sacks of meal
  } else if (kind === 'greenhouse') {
    L = 14; D = 6; const hx = 7, hz = 3, e = 2.3, ry = 3.9;
    box(B, H, -hx, 0, -hz, hx, 0.7, hz, MAT.STONE, COL.stone);
    for (const s of [1, -1]) { quad(B, H, [-s * hx, 0.7, s * hz], [s * hx, 0.7, s * hz], [s * hx, e, s * hz], [-s * hx, e, s * hz], MAT.GLASS, COL.white, 1, 0, 0);
      quad(B, H, [-s * hx, e, s * hz], [s * hx, e, s * hz], [s * hx, ry, 0], [-s * hx, ry, 0], MAT.GLASS, COL.white, 1, 0, 0);
      quad(B, H, [s * hx, 0.7, s * hz], [s * hx, 0.7, -s * hz], [s * hx, e, -s * hz], [s * hx, e, s * hz], MAT.GLASS, COL.white, 1, 0, 0); tri(B, H, [s * hx, e, s * hz], [s * hx, e, -s * hz], [s * hx, ry, 0], MAT.GLASS, COL.white); }
    box(B, H, -hx, ry - 0.05, -0.08, hx, ry + 0.1, 0.08, MAT.PLAIN, COL.white);
    for (let i = 0; i < 9; i++) blob(B, H, -6 + i * 1.5, 1.2 + (i % 3) * 0.25, (i % 2 ? 1 : -1) * 1.2, 0.9, 0.8, 1.0, MAT.LEAF, i % 4 === 1 ? COL.rowan : COL.leaf, 5);   // green inside
    R = raft(B, H, rng, L, D, o); top = ry + 0.1; ridgeY = ry + 0.1; eavesY = e; eavesZ = hz + 0.1;
    for (let i = 0; i < 6; i++) box(B, H, -6 + i * 1.3, 0, hz + 0.9, -5.1 + i * 1.3, 0.35, hz + 1.7, MAT.TIMBER, COL.plank), blob(B, H, -5.55 + i * 1.3, 0.5, hz + 1.3, 0.4, 0.3, 0.36, MAT.LEAF, COL.cabbage, 4);   // seed trays
  }
  return { kind, L, D, ends: R.ends, ridge: Math.min(L / 2 - 0.5, 1.2), ridgeY, eavesY, eavesZ, top, R, ...extra };
}

const B_VERT = /* glsl */`
attribute vec3 aCol, aPivot, aUM; attribute vec4 aMove;
uniform vec3 uSailC, uSailAx, uBellC, uBellAx; uniform float uSailPh, uBellPh;
varying vec3 vN, vCol, vW; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
${SWAY_GLSL}
vec3 rotAx(vec3 d, vec3 ax, float a){ float c = cos(a), s = sin(a); return d*c + cross(ax, d)*s + ax*dot(ax, d)*(1. - c); }
void main(){
  vec3 p = position, n = normal; float m = aUM.z;
  if(m > 8.5 && m < 9.5 && dot(uSailAx, uSailAx) > .5 && distance(p, uSailC) < 14.){ float a = uSailPh + uTime*.55; p = uSailC + rotAx(p - uSailC, uSailAx, a); n = rotAx(n, uSailAx, a); }
  else if(m > 9.5 && m < 10.5){ float a = .45*sin(uBellPh + uTime*2.3); p = uBellC + rotAx(p - uBellC, uBellAx, a); n = rotAx(n, uBellAx, a); }
  else if(m > 10.5 && m < 11.5){ float hang = 1. - aUM.y; p += n*hang*(.17*sin(uTime*3.1 + p.x*2.3 + p.z*1.9) + .06*sin(uTime*5.3 + p.y*4.)); }
  p = hsSway(p, aPivot, aMove);
  vec4 mvPosition = viewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  vN = n; vCol = aCol; vW = p; vUv = aUM.xy; vMat = m;
  #include <fog_vertex>
}`;
const B_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGroundCol, uGlowCol; uniform float uGlow, uLit;
varying vec3 vN, vCol, vW; varying vec2 vUv; varying float vMat;
#include <fog_pars_fragment>
float h1(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + vec2(1., 1.)), f.x), f.y); }
// coursed blocks: x = a block's own shade, y = 1 on a joint; both fade out as the pixel's footprint fw outgrows a course
vec2 courses(vec2 uv, vec2 cell, float joint, float fw){
  float row = floor(uv.y/cell.y), x = uv.x/cell.x + h1(vec2(row, 3.))*7., ix = floor(x);
  vec2 f = vec2(x - ix, uv.y/cell.y - row), d = min(f, 1. - f)*cell;
  float keep = 1. - smoothstep(cell.y*.3, cell.y*1.6, fw);
  return vec2(mix(.5, h1(vec2(ix, row)), keep), (1. - smoothstep(joint, joint + fw*1.5 + .004, min(d.x, d.y)))*keep);
}
void main(){
  vec3 n = normalize(vN)*(gl_FrontFacing ? 1. : -1.), V = normalize(cameraPosition - vW);
  float fw = max(fwidth(vUv.x), fwidth(vUv.y)), m = vMat;
  vec3 alb = vCol, glow = vec3(0.); float spec = 0.;
  if(m < .5){ vec2 c = courses(vUv, vec2(.46, .24), .014, fw); alb = mix(vCol, vCol*vec3(1.16, 1.02, .78), step(.6, c.x)*.7)*(.7 + .55*c.x)*(1. - .5*c.y)*(.88 + .24*vn(vUv*1.7)); }
  else if(m < 1.5){ vec2 c = courses(vUv, vec2(.5, .26), .012, fw); alb = vCol*(.9 + .1*vn(vUv*2.3))*(1. - .14*c.y)*(.8 + .2*smoothstep(0., 1.6, vUv.y + vn(vUv*.8))); }
  else if(m < 2.5){ vec2 c = courses(vUv, vec2(.44, .34), .012, fw); float fy = fract(vUv.y/.34), keep = 1. - smoothstep(.1, .5, fw);
    float band = h1(vec2(floor(vUv.y/1.02), 7.)), keepB = 1. - smoothstep(.5, 2.2, fw);
    alb = mix(vCol, vCol*vec3(1.1, 1.08, .8), smoothstep(.45, .75, vn(vUv*.55))*.6)*(.66 + .6*c.x)*(1. - .5*c.y)*mix(1., .74 + .3*smoothstep(0., .3, fy), keep)*mix(1., .8 + .4*band, keepB); spec = .25; }
  else if(m < 3.5){ float g = vn(vec2(vUv.x*.8, vUv.y*15.))*.5 + vn(vec2(vUv.x*15., vUv.y*.8))*.5, keep = 1. - smoothstep(.06, .3, fw);
    float seam = (1. - smoothstep(.012, .02 + fw, abs(fract(vUv.y/.24) - .5)*.24))*step(.9, abs(n.y))*keep;
    alb = vCol*mix(1., .7 + .6*g, keep)*(1. - .5*seam); }
  else if(m < 4.5){ vec2 q = abs(vUv - .5)*2.; float frame = smoothstep(.7, .78, max(q.x, q.y)), bars = 1. - smoothstep(.04, .09, min(abs(vUv.x - .5), abs(vUv.y - .5)));
    float lit = step(1. - uLit, vCol.r)*(1. - frame)*(1. - .8*bars);
    alb = mix(vec3(.05, .06, .07) + .25*uSkyCol*pow(clamp(1. - dot(n, V), 0., 1.), 3.), vec3(.1, .09, .08), max(frame, bars));
    glow = uGlowCol*uGlow*lit*(.7 + .5*vn(vUv*3. + vCol.r*40.)); }
  else if(m < 5.5){ vec2 pane = vUv/vec2(.62, .92), f = fract(pane), d = min(f, 1. - f)*vec2(.62, .92);
    float keep = 1. - smoothstep(.15, .7, fw), bar = (1. - smoothstep(.022, .03 + fw, min(d.x, d.y)))*keep, id = h1(floor(pane));
    vec3 nn = normalize(n + (vec3(id, h1(floor(pane) + 7.), id*.7) - .5)*.07*keep);
    float fr = .08 + .92*pow(clamp(1. - dot(nn, V), 0., 1.), 4.);
    vec3 inside = vec3(.06, .16, .05)*(.5 + vn(vUv*1.3))*(uSunCol*.25 + uSkyCol*.5);
    float gl = pow(max(dot(reflect(-V, nn), uSun), 1e-4), 260.);
    vec3 col = mix(inside, uSkyCol*.55, fr) + uSunCol*gl*5.;
    col = mix(col, vec3(.8)*(uSunCol*max(dot(n, uSun), 0.) + uSkyCol)*.3183, bar);
    alb = vec3(0.); glow = col; }
  else if(m < 6.5) alb = vCol*(.84 + .2*vn(vUv*11.));
  else if(m < 7.5) alb = vCol;
  else if(m < 8.5) alb = vCol*(.55 + .9*vn(vUv*5. + vW.y));
  else if(m < 9.5){ vec2 f = fract(vUv/.62); float keep = 1. - smoothstep(.1, .5, fw); alb = vCol*mix(1., .55 + .5*step(.14, min(f.x, f.y)), keep*step(.5, vCol.r)); }
  else if(m < 10.5) spec = 1.5;
  else if(m < 11.5) alb = vCol*(.85 + .15*vUv.y);
  else if(m < 12.5){ vec2 c = courses(vUv, vec2(.8, .55), .02, fw); alb = vCol*(.75 + .4*c.x)*(1. - .5*c.y); }
  else { float bd = fract(vUv.y/.17), keep = 1. - smoothstep(.05, .4, fw); alb = vCol*mix(1., .7 + .34*smoothstep(0., .2, bd), keep)*(.95 + .1*vn(vec2(vUv.x*.8, vUv.y*9.))); }   // painted clapboards: each board laps the one under it
  float ndl = max(dot(n, uSun), 0.);
  vec3 hemi = mix(uGroundCol, uSkyCol, n.y*.5 + .5);
  vec3 col = alb*(uSunCol*ndl + hemi)*.3183 + glow;
  vec3 hv = normalize(uSun + V + vec3(0., 1e-4, 0.));
  col += uSunCol*spec*.12*pow(max(dot(n, hv), 1e-4), 30.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// THE HOUSE (the film's own little house, drawn anew in our own hand; the only one of its kind): tall and narrow, two storeys of painted clapboards in
// clear colours with pale trim under a steep shingled roof, a small front gable over a bay window, a little porch on posts, a brick chimney,
// lit windows. It rides on no raft: it hangs by its chimney. Its front is on +z. Returns the chimney's top, where the strings are gathered
function addHouse(B, H) {
  const yel = C('#f0c040'), blu = C('#6eb4e2'), rose = C('#ee8aa2'), grn = C('#86c866'), trim = C('#f4efe0'), roof = C('#62564c'), brick = C('#a8523c'), door = C('#b8402c');
  const hx = 3.2, hz = 3.6, y0 = 0.5, yb = 3.6, ye = 6.6, k = 1.28, ry = ye + hz * k, ov = 0.4, PL = MAT.PLAIN, BD = MAT.BOARD;
  box(B, H, -hx - 0.12, 0, -hz - 0.12, hx + 0.12, y0, hz + 0.12, MAT.STONE, brick);                    // a low brick footing
  for (const [ya, yc, col] of [[y0, yb, yel], [yb, ye, blu]]) {                                        // the lower storey yellow, the upper blue
    quad(B, H, [-hx, ya, hz], [hx, ya, hz], [hx, yc, hz], [-hx, yc, hz], BD, col); quad(B, H, [hx, ya, -hz], [-hx, ya, -hz], [-hx, yc, -hz], [hx, yc, -hz], BD, col);
    for (const s of [1, -1]) quad(B, H, [s * hx, ya, s * hz], [s * hx, ya, -s * hz], [s * hx, yc, -s * hz], [s * hx, yc, s * hz], BD, col);
  }
  for (const s of [1, -1]) tri(B, H, [s * hx, ye, s * hz], [s * hx, ye, -s * hz], [s * hx, ry, 0], BD, rose);   // rose gables
  for (const s of [1, -1]) {                                                                           // the steep roof, its ridge on x
    const a = [-hx - ov, ye - ov * k, s * (hz + ov)], b = [hx + ov, ye - ov * k, s * (hz + ov)], c = [hx + ov, ry + 0.1, 0], d = [-hx - ov, ry + 0.1, 0];
    quad(B, H, s > 0 ? a : b, s > 0 ? b : a, s > 0 ? c : d, s > 0 ? d : c, MAT.SLATE, roof, 1, 0, 0);
  }
  box(B, H, -hx - ov, ry + 0.02, -0.1, hx + ov, ry + 0.2, 0.1, PL, trim);                              // the ridge board
  for (const sx of [1, -1]) for (const sz of [1, -1]) box(B, H, sx * hx - 0.1, y0, sz * hz - 0.1, sx * hx + 0.1, ye, sz * hz + 0.1, PL, trim);   // corner boards
  box(B, H, -hx - 0.07, yb - 0.1, -hz - 0.07, hx + 0.07, yb + 0.1, hz + 0.07, PL, trim);               // the belt between the storeys
  const winZ = (x0, x1, ya, yc, z, s) => { box(B, H, x0 - 0.12, ya - 0.12, z - 0.03, x1 + 0.12, yc + 0.12, z + 0.03, PL, trim);    // a window in its pale frame, lit
    const zz = z + s * 0.05; quad(B, H, [s > 0 ? x0 : x1, ya, zz], [s > 0 ? x1 : x0, ya, zz], [s > 0 ? x1 : x0, yc, zz], [s > 0 ? x0 : x1, yc, zz], MAT.WINDOW, [0.97, 0.5, 0.5], 0, 0, 0); };
  const winX = (z0, z1, ya, yc, x, s) => { box(B, H, x - 0.03, ya - 0.12, z0 - 0.12, x + 0.03, yc + 0.12, z1 + 0.12, PL, trim);
    const xx = x + s * 0.05; quad(B, H, [xx, ya, s > 0 ? z1 : z0], [xx, ya, s > 0 ? z0 : z1], [xx, yc, s > 0 ? z0 : z1], [xx, yc, s > 0 ? z1 : z0], MAT.WINDOW, [0.97, 0.5, 0.5], 0, 0, 0); };
  // the bay under its own small gable, on the front
  const b0 = 0.3, b1 = 2.9, bz = hz + 1.0, yq = 6.0, bm = (b0 + b1) / 2, yr = yq + (b1 - b0) / 2 * k;
  quad(B, H, [b0, y0, bz], [b1, y0, bz], [b1, yq, bz], [b0, yq, bz], BD, grn); quad(B, H, [b0, y0, hz], [b0, y0, bz], [b0, yq, bz], [b0, yq, hz], BD, grn); quad(B, H, [b1, y0, bz], [b1, y0, hz], [b1, yq, hz], [b1, yq, bz], BD, grn);
  tri(B, H, [b0, yq, bz], [b1, yq, bz], [bm, yr, bz], BD, rose);
  quad(B, H, [b0 - 0.3, yq - 0.38, bz + 0.3], [bm, yr + 0.08, bz + 0.3], [bm, yr + 0.08, hz - 1.0], [b0 - 0.3, yq - 0.38, hz - 0.2], MAT.SLATE, roof, 1, 0, 0);
  quad(B, H, [bm, yr + 0.08, bz + 0.3], [b1 + 0.3, yq - 0.38, bz + 0.3], [b1 + 0.3, yq - 0.38, hz - 0.2], [bm, yr + 0.08, hz - 1.0], MAT.SLATE, roof, 1, 0, 0);
  winZ(b0 + 0.45, b1 - 0.45, 1.3, 2.95, bz, 1); winZ(b0 + 0.55, b1 - 0.55, 4.05, 5.45, bz, 1); winZ(-2.5, -1.1, 4.05, 5.45, hz, 1);
  winZ(-2.3, -1.0, 1.4, 2.9, -hz, -1); winZ(0.9, 2.2, 1.4, 2.9, -hz, -1); winZ(-2.3, -1.0, 4.05, 5.45, -hz, -1); winZ(0.9, 2.2, 4.05, 5.45, -hz, -1);
  for (const s of [1, -1]) { winX(-2.2, -1.0, 1.4, 2.9, s * hx, s); winX(0.8, 2.0, 1.4, 2.9, s * hx, s); winX(-2.2, -1.0, 4.05, 5.45, s * hx, s); winX(0.8, 2.0, 4.05, 5.45, s * hx, s); winX(-0.5, 0.5, 7.4, 8.5, s * hx, s); }
  // the porch: a floor, a little roof on three posts, a rail, two steps, the door
  const pz = hz + 1.9;
  box(B, H, -hx, y0 - 0.15, hz, 0.2, y0, pz, PL, trim); quad(B, H, [-hx - 0.2, 2.82, pz + 0.25], [0.4, 2.82, pz + 0.25], [0.4, 3.3, hz], [-hx - 0.2, 3.3, hz], MAT.SLATE, roof, 1, 0, 0);
  box(B, H, -hx - 0.1, 2.62, pz - 0.05, 0.3, 2.82, pz + 0.07, PL, trim);
  for (const x of [-hx + 0.1, -1.5, 0.1]) box(B, H, x - 0.08, y0, pz - 0.08, x + 0.08, 2.62, pz + 0.08, PL, trim);
  box(B, H, -hx + 0.1, 1.3, pz - 0.04, -1.5, 1.38, pz + 0.04, PL, trim); box(B, H, -hx - 0.04, 1.3, hz, -hx + 0.04, 1.38, pz, PL, trim);
  box(B, H, -1.45, 0.16, pz, 0.05, 0.33, pz + 0.45, PL, trim); box(B, H, -1.45, 0, pz + 0.45, 0.05, 0.17, pz + 0.9, PL, trim);
  quad(B, H, [-1.2, y0, hz + 0.04], [-0.2, y0, hz + 0.04], [-0.2, y0 + 2.05, hz + 0.04], [-1.2, y0 + 2.05, hz + 0.04], PL, door);
  // the brick chimney, well over the ridge
  const cx0 = -1.5, cx1 = -0.6, ct = ry + 1.75;
  box(B, H, cx0, ry - 1.6, -0.45, cx1, ct, 0.45, MAT.STONE, brick); box(B, H, cx0 - 0.08, ct, -0.53, cx1 + 0.08, ct + 0.16, 0.53, PL, C('#7a3a2c'));
  const q = H.sc || 1;
  return { kind: 'house', L: 2 * hx * q, D: 2 * hz * q, ends: [], top: (ct + 0.16) * q, chim: [(cx0 + cx1) / 2 * q, (ct + 0.16) * q, 0], ridgeY: ry * q, eavesY: ye * q, eavesZ: hz * q };
}

// meshes from a builder: one draw per zone. light = { sun, sunCol, sky, ground }, opts = { glow, lit, sail, sailAx, bell, bellAx }
export async function makeBuildingMeshes(B, light, opts = {}, yieldFn = async () => {}) {   // a yield after each zone
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uSun: { value: light.sun }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky }, uGroundCol: { value: light.ground },
    uGlowCol: { value: new THREE.Color('#ffb060') }, uGlow: { value: opts.glow ?? 1 }, uLit: { value: opts.lit ?? 0.6 },
    uSailC: { value: new THREE.Vector3().fromArray(opts.sail || [0, -9999, 0]) }, uSailAx: { value: new THREE.Vector3().fromArray(opts.sailAx || [0, 0, 0]) },
    uBellC: { value: new THREE.Vector3().fromArray(opts.bell || [0, -9999, 0]) }, uBellAx: { value: new THREE.Vector3().fromArray(opts.bellAx || [1, 0, 0]) }, uSailPh: { value: opts.sailPh || 0 }, uBellPh: { value: opts.bellPh || 0 } });
  const mat = new THREE.ShaderMaterial({ name: 'hosBuildings', uniforms, vertexShader: B_VERT, fragmentShader: B_FRAG, fog: true, side: THREE.DoubleSide });
  const group = new THREE.Group(); group.name = 'buildings'; let triangles = 0;
  for (const Z of B.z) {
    if (!Z.n) continue;
    const fa = new Float32Array(Z.v); await yieldFn();
    const ib = new THREE.InterleavedBuffer(fa, VSTRIDE), g = new THREE.BufferGeometry();
    const at = (name, n, off) => g.setAttribute(name, new THREE.InterleavedBufferAttribute(ib, n, off));
    at('position', 3, 0); at('normal', 3, 3); at('aCol', 3, 6); at('aUM', 3, 9); at('aPivot', 3, 12); at('aMove', 4, 15);
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(Z.i), 1)); await yieldFn(); g.computeBoundingSphere(); g.boundingSphere.radius += 12;
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'buildings'; group.add(mesh); triangles += Z.i.length / 3; await yieldFn();
  }
  return { object: group, uniforms, triangles };
}
