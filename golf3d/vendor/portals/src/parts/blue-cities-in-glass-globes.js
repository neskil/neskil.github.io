// The Blue Cities in Glass Globes: the hero set piece and the makers the world uses.
// The hero is the museum's rotunda: four storeys of iron galleries round a well under a ribbed dome, a crystal globe
// 160 m across on its bronze stand in the middle with the grandest of the blue cities inside it (the city the flight
// goes down into), and a lesser globe in every alcove of every gallery, each holding a different small city.
// (An original place built from one city of Invisible Cities by Italo Calvino, 1923 to 1985: a building of metal with
// a glass globe in every room and in every globe a blue city. No lettering, no figure with a face, nothing of any
// picture made for the book.)
//
// What is here:
//   Geo             one merged geometry with colour, a pattern number and pattern coordinates in metres per vertex,
//                   and (for the movers' geometry) the attributes of the small things' motion laws
//   townMaterial    the lit material of everything built (iron, bronze, wood, stone, the blue cities): patterns by
//                   number in the fragment shader, the movers' laws in the vertex shader (moverAt is the same law in JS)
//   CITY_KINDS      the small blue cities, each kind a different idea of a city, built in a globe's own metres
//   grandCity       the city of the great globe, laid along an avenue to a square
//   crystalMaterial the crystal: rim light, the windows' and the roof's reflections sliding on it, the light's own
//                   mirror image as a small window-shaped glint with a soft halo
//   standGeo, railGeo, shellGeo   a globe's bronze stand, its brass rail with velvet rope, its crystal
//   buildHero       the rotunda with its great globe, for the viewer of set pieces and for the world
// WHAT MOVES BY WHAT: every mover runs on the world's clock (uTime) from a phase drawn from its own city's stream;
// nothing here reads the metres flown, the route or the eye's place, except three things that are the view's own:
// the crystal's shine (reflection and rim light depend on where a surface is seen from), the fog, and THE PATTERNS'
// FILTER: a pattern's fine lines (joints, seams, rivets, panes, tiles) are faded toward the pattern's own mean where
// they would be finer than the picture's grain (fwidth of the pattern's own coordinate), so that a far wall does
// not shimmer. It is a filter to the mean of what is there; it adds, moves and hides nothing.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// the globe's own measures, in metres of the great globe (a smaller globe is the same thing scaled by radius / 80)
export const GLOBE = { R: 80, ground: -28, disc: 75, crown: 16 };
// pattern numbers (the fragment shader's table)
export const PAT = { PLAIN: 0, WALL: 1, WATER: 2, GOLD: 3, LIGHT: 4, PAVE: 5, CLOTH: 6, JELLY: 7, IRON: 8, BRONZE: 9, WOOD: 10, FLOOR: 11, STONE: 12, SLATE: 13, VELVET: 14, PANE: 15, GREEN: 16, TILE: 17, PANEL: 18, FLAG: 19, ROOF: 20 };
// (iron, bronze, brass, wood, velvet, stone and slate are albedos: under the place's light they come out as the
// design's dark iron, bronze and grey stone; the blues are the design's own)
export const COLORS = {
  ultra: lin('#1f3fbf'), cobalt: lin('#2f7fe0'), turq: lin('#39c2d9'), ice: lin('#bfe6ff'), white: lin('#f4f8ff'), gold: lin('#ffd98a'),
  deep: lin('#122a86'), navy: lin('#0c1a52'), iron: [0.15, 0.17, 0.205], bronze: [0.27, 0.165, 0.07], brass: [0.6, 0.38, 0.09], wood: [0.2, 0.115, 0.08],
  velvet: [0.36, 0.03, 0.05], stone: [0.42, 0.44, 0.47], slate: [0.17, 0.19, 0.235], pearl: lin('#c9ced3'), crystal: lin('#eaf6ff'),
};

// ---------------------------------------------------------------- one merged geometry
// Vertices carry position, normal, colour, pattern coordinates (metres) and a pattern number. A frame (place, turn
// about y, scale) is applied to everything added while it is set. With movers: true each vertex also carries the
// attributes of its motion law (see MOVE and moverAt).
export class Geo {
  constructor(o = {}) {
    this.movers = !!o.movers; this.n = 0; this.ni = 0; this.cap = o.cap || 4096; this.capI = this.cap * 2;
    this.P = new Float32Array(this.cap * 3); this.N = new Float32Array(this.cap * 3); this.C = new Float32Array(this.cap * 3);
    this.U = new Float32Array(this.cap * 2); this.M = new Float32Array(this.cap); this.I = new Uint32Array(this.capI);
    if (this.movers) { this.V = new Float32Array(this.cap * 3); this.A = new Float32Array(this.cap * 4); this.B = new Float32Array(this.cap * 4); }
    this.c = [1, 1, 1]; this.m = 0; this.fx = 0; this.fy = 0; this.fz = 0; this.fc = 1; this.fs = 0; this.fk = 1; this.fsy = 1; this.fy0 = 0;
    this.mv = null; this.raw = false;
  }
  col(c, k = 1) { this.c = k === 1 ? c : [c[0] * k, c[1] * k, c[2] * k]; return this; }
  mat(m) { this.m = m; return this; }
  set(c, m) { this.c = c; this.m = m; return this; }
  frame(x = 0, y = 0, z = 0, yaw = 0, k = 1) { this.fx = x; this.fy = y; this.fz = z; this.fc = Math.cos(yaw); this.fs = Math.sin(yaw); this.fk = k; this.fsy = 1; this.fy0 = 0; return this; }
  // heights of the frame drawn out by sy above the level y0 (a small city made taller in its globe)
  stretch(sy = 1, y0 = 0) { this.fsy = sy; this.fy0 = y0; return this; }
  // a point of the frame in the geometry's own space
  toWorld(x, y, z) { const k = this.fk, ys = y > this.fy0 ? this.fy0 + (y - this.fy0) * this.fsy : y; return [this.fx + (x * this.fc + z * this.fs) * k, this.fy + ys * k, this.fz + (-x * this.fs + z * this.fc) * k]; }
  toDir(x, z) { return [x * this.fc + z * this.fs, -x * this.fs + z * this.fc]; }
  grow(nv, ni) {
    if (this.n + nv > this.cap) {
      while (this.n + nv > this.cap) this.cap *= 2;
      for (const [k, s] of [['P', 3], ['N', 3], ['C', 3], ['U', 2], ['M', 1], ['V', 3], ['A', 4], ['B', 4]]) { if (!this[k]) continue; const a = new Float32Array(this.cap * s); a.set(this[k].subarray(0, this.n * s)); this[k] = a; }
    }
    if (this.ni + ni > this.capI) { while (this.ni + ni > this.capI) this.capI *= 2; const a = new Uint32Array(this.capI); a.set(this.I.subarray(0, this.ni)); this.I = a; }
  }
  // one vertex; raw: the position is a mover's own body coordinate (scaled, not placed)
  v(x, y, z, nx, ny, nz, u = 0, w = 0) {
    this.grow(1, 0);
    const i = this.n++, k = this.fk, c = this.fc, s = this.fs, P = this.P, N = this.N;
    if (this.raw) { P[i * 3] = x * k; P[i * 3 + 1] = y * k; P[i * 3 + 2] = z * k; N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz; }
    else { P[i * 3] = this.fx + (x * c + z * s) * k; P[i * 3 + 1] = this.fy + (y > this.fy0 ? this.fy0 + (y - this.fy0) * this.fsy : y) * k; P[i * 3 + 2] = this.fz + (-x * s + z * c) * k; N[i * 3] = nx * c + nz * s; N[i * 3 + 1] = ny; N[i * 3 + 2] = -nx * s + nz * c; }
    this.C[i * 3] = this.c[0]; this.C[i * 3 + 1] = this.c[1]; this.C[i * 3 + 2] = this.c[2];
    this.U[i * 2] = u; this.U[i * 2 + 1] = w; this.M[i] = this.m;
    if (this.movers) { const q = this.mv; if (q) { this.V.set(q.pivot, i * 3); this.A.set(q.move, i * 4); this.B.set(q.par, i * 4); if (q.weight) this.B[i * 4 + 1] = u; } }
    return i;
  }
  tri(a, b, c) { this.grow(0, 3); const I = this.I; I[this.ni++] = a; I[this.ni++] = b; I[this.ni++] = c; }
  // a flat quad a b c d (counter-clockwise seen from outside), pattern coordinates given at a and across
  quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = d[0] - a[0], wy = d[1] - a[1], wz = d[2] - a[2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.v(a[0], a[1], a[2], nx, ny, nz, u0, v0); this.v(b[0], b[1], b[2], nx, ny, nz, u1, v0); this.v(c[0], c[1], c[2], nx, ny, nz, u1, v1); this.v(d[0], d[1], d[2], nx, ny, nz, u0, v1);
    this.tri(i, i + 1, i + 2); this.tri(i, i + 2, i + 3); return this;
  }
  get triangles() { return this.ni / 3; }
  build() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(this.U.slice(0, n * 2), 2));
    g.setAttribute('aMat', new THREE.BufferAttribute(this.M.slice(0, n), 1));
    if (this.movers) { g.setAttribute('aPivot', new THREE.BufferAttribute(this.V.slice(0, n * 3), 3)); g.setAttribute('aMove', new THREE.BufferAttribute(this.A.slice(0, n * 4), 4)); g.setAttribute('aPar', new THREE.BufferAttribute(this.B.slice(0, n * 4), 4)); }
    g.setIndex(new THREE.BufferAttribute(n > 65535 ? this.I.slice(0, this.ni) : new Uint16Array(this.I.subarray(0, this.ni)), 1));
    return g;
  }
}

// ---------------------------------------------------------------- the shapes things are made of
const GP = Geo.prototype;
// a box standing on y0: sx by sz in plan, sy tall; o.yaw turns it about its own middle, o.tx / o.tz taper its top,
// o.top / o.bot give or leave the lids. Pattern coordinates on the sides: metres along the face and metres of height.
GP.box = function (cx, y0, cz, sx, sy, sz, o = {}) {
  const hx = sx / 2, hz = sz / 2, c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0), tx = o.tx ?? 1, tz = o.tz ?? 1, y1 = y0 + sy;
  const P = (x, z, y, kx, kz) => [cx + x * kx * c + z * kz * s, y, cz - x * kx * s + z * kz * c];
  const b = [P(-hx, hz, y0, 1, 1), P(hx, hz, y0, 1, 1), P(hx, -hz, y0, 1, 1), P(-hx, -hz, y0, 1, 1)], t = [P(-hx, hz, y1, tx, tz), P(hx, hz, y1, tx, tz), P(hx, -hz, y1, tx, tz), P(-hx, -hz, y1, tx, tz)];
  const u0 = o.u0 || 0;
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, w = i % 2 ? sz : sx; if (o.skip && o.skip.includes(i)) continue; this.quad(b[i], b[j], t[j], t[i], u0, 0, u0 + w, sy); }
  if (o.top !== false) this.quad(t[0], t[1], t[2], t[3], 0, 0, sx, sz);
  if (o.bot) this.quad(b[3], b[2], b[1], b[0], 0, 0, sx, sz);
  return this;
};
// a gabled roof on a sx by sz plan, its ridge along the box's own x, h tall, with eaves that stand out by e; its two
// end walls stand on the house's own ends, in o.end's colour and pattern where given
GP.gable = function (cx, y0, cz, sx, sz, h, o = {}) {
  const e = o.eave ?? 0, hx = sx / 2 + e, hz = sz / 2 + e, c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0);
  const P = (x, z, y) => [cx + x * c + z * s, y, cz - x * s + z * c];
  const a = P(-hx, hz, y0), b = P(hx, hz, y0), cc = P(hx, -hz, y0), d = P(-hx, -hz, y0), r0 = P(-hx, 0, y0 + h), r1 = P(hx, 0, y0 + h), sl = Math.hypot(hz, h);
  // o.code (the ROOF pattern): the slope's whole length, in half metres, rides in the pattern's u as so many 64s (and 1)
  const N = o.code ? Math.max(1, Math.round(sl * 2)) : 0, uo = o.code ? 64 * N + 1 : 0, vl = o.code ? N / 2 : sl;
  this.quad(a, b, r1, r0, uo, 0, uo + sx, vl); this.quad(cc, d, r0, r1, uo, 0, uo + sx, vl);
  const keep = [this.c, this.m], ex = sx / 2; if (o.end) this.set(o.end[0], o.end[1]);
  const t1 = P(ex, 0, y0 + h), t0 = P(-ex, 0, y0 + h);
  this.quad(P(ex, hz, y0), P(ex, -hz, y0), t1, t1, 0, 0, sz, h); this.quad(P(-ex, -hz, y0), P(-ex, hz, y0), t0, t0, 0, 0, sz, h);
  this.set(keep[0], keep[1]);
  return this;
};
// a pyramid or hipped roof to one point
GP.hip = function (cx, y0, cz, sx, sz, h, o = {}) {
  const hx = sx / 2, hz = sz / 2, c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0), P = (x, z, y) => [cx + x * c + z * s, y, cz - x * s + z * c];
  const b = [P(-hx, hz, y0), P(hx, hz, y0), P(hx, -hz, y0), P(-hx, -hz, y0)], t = P(0, 0, y0 + h);
  // o.code (the ROOF pattern): one triangle a face, v up the slope's true length (carried in u as so many 64s)
  if (o.code) {
    for (let i = 0; i < 4; i++) {
      const A = b[i], B = b[(i + 1) % 4], span = i % 2 ? sz : sx, N = Math.max(1, Math.round(Math.hypot((i % 2 ? sx : sz) / 2, h) * 2)), uo = 64 * N + 1;
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], wx = t[0] - A[0], wy = t[1] - A[1], wz = t[2] - A[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = this.v(A[0], A[1], A[2], nx, ny, nz, uo, 0); this.v(B[0], B[1], B[2], nx, ny, nz, uo + span, 0); this.v(t[0], t[1], t[2], nx, ny, nz, uo + span / 2, N / 2); this.tri(i0, i0 + 1, i0 + 2);
    }
    return this;
  }
  for (let i = 0; i < 4; i++) this.quad(b[i], b[(i + 1) % 4], t, t, 0, 0, i % 2 ? sz : sx, h);
  return this;
};
// a turned shape about a vertical axis: prof is [[radius, height], ...] from the bottom up. o.smooth rounds it along
// the profile, o.arc and o.a0 make a part turn, o.sq squashes it along z, o.cap / o.capB close its ends, o.ur is the
// radius the pattern is measured at (one count of panes round a dome from foot to eye).
GP.lathe = function (cx, cy, cz, prof, n = 12, o = {}) {
  const arc = o.arc ?? TAU, a0 = o.a0 || 0, sq = o.sq ?? 1, m = prof.length, full = arc >= TAU - 1e-6;
  const nrm = (i0, i1) => { const dr = prof[i1][0] - prof[i0][0], dy = prof[i1][1] - prof[i0][1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; };
  let run = 0;
  for (let i = 0; i < m - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], len = Math.hypot(r1 - r0, y1 - y0); if (len < 1e-9) continue;
    const nA = o.smooth ? nrm(Math.max(0, i - 1), i + 1) : nrm(i, i + 1), nB = o.smooth ? nrm(i, Math.min(m - 1, i + 2)) : nA, base = this.n, rm = Math.max(r0, r1);
    for (let j = 0; j <= n; j++) {
      const a = a0 + arc * j / n, ca = Math.cos(a), sa = Math.sin(a), u = arc * (o.ur ?? rm) * j / n;
      this.v(cx + r0 * ca, cy + y0, cz + r0 * sa * sq, nA[0] * ca, nA[1], nA[0] * sa, u, run);
      this.v(cx + r1 * ca, cy + y1, cz + r1 * sa * sq, nB[0] * ca, nB[1], nB[0] * sa, u, run + len);
    }
    for (let j = 0; j < n; j++) { const q = base + j * 2; this.tri(q, q + 1, q + 3); this.tri(q, q + 3, q + 2); }
    run += len;
  }
  const lid = (r, y, up) => {
    const base = this.n; this.v(cx, cy + y, cz, 0, up, 0, 0, 0);
    for (let j = 0; j <= n; j++) { const a = a0 + arc * j / n; this.v(cx + r * Math.cos(a), cy + y, cz + r * Math.sin(a) * sq, 0, up, 0, r * Math.cos(a), r * Math.sin(a)); }
    for (let j = 0; j < n; j++) { if (up > 0) this.tri(base, base + j + 2, base + j + 1); else this.tri(base, base + j + 1, base + j + 2); }
  };
  if (o.cap !== false && prof[m - 1][0] > 1e-6 && full) lid(prof[m - 1][0], prof[m - 1][1], 1);
  if (o.capB && prof[0][0] > 1e-6 && full) lid(prof[0][0], prof[0][1], -1);
  return this;
};
GP.disc = function (cx, y, cz, r, n = 16, o = {}) {
  const base = this.n, sq = o.sq ?? 1, a0 = o.a0 || 0; this.v(cx, y, cz, 0, 1, 0, cx, cz);
  for (let j = 0; j <= n; j++) { const a = a0 + TAU * j / n, x = cx + r * Math.cos(a), z = cz + r * Math.sin(a) * sq; this.v(x, y, z, 0, 1, 0, x, z); }
  for (let j = 0; j < n; j++) this.tri(base, base + j + 2, base + j + 1);
  return this;
};
GP.cyl = function (cx, y0, cz, r0, r1, h, n = 10, o = {}) { return this.lathe(cx, y0, cz, [[r0, 0], [r1, h]], n, o); };
GP.cone = function (cx, y0, cz, r, h, n = 10, o = {}) { return this.lathe(cx, y0, cz, [[r, 0], [0, h]], n, o); };
// a dome: half an ellipsoid r wide and h tall (o.onion > 0 swells it into a bulb)
GP.dome = function (cx, y0, cz, r, h, n = 12, m = 5, o = {}) {
  const prof = []; for (let i = 0; i <= m; i++) { const t = i / m * Math.PI / 2, k = 1 + (o.onion || 0) * Math.sin(t * 2) * 1.2; prof.push([r * Math.cos(t) * k, h * Math.sin(t) * (1 + (o.onion || 0) * 0.5 * (i / m) ** 3)]); }
  return this.lathe(cx, y0, cz, prof, n, { ...o, smooth: true, cap: false });
};
// a ring: R to the tube's middle, r the tube. o.axis 'y' (lying flat, default), 'z' or 'x' (standing); o.arc, o.a0
GP.torus = function (cx, cy, cz, R, r, n = 24, m = 6, o = {}) {
  const arc = o.arc ?? TAU, a0 = o.a0 || 0, ax = o.axis || 'y', base = this.n, sy = o.sy ?? 1;
  const put = (X, Y, Z) => (ax === 'y' ? [X, Y, Z] : ax === 'z' ? [X, -Z, Y] : [Y, -X, Z]);
  for (let i = 0; i <= n; i++) {
    const a = a0 + arc * i / n, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j <= m; j++) {
      const b = TAU * j / m, cb = Math.cos(b), sb = Math.sin(b), p = put((R + r * cb) * ca, r * sb, (R + r * cb) * sa), q = put(cb * ca, sb, cb * sa);
      this.v(cx + p[0], cy + p[1] * sy, cz + p[2], q[0], q[1], q[2], arc * R * i / n, r * b);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const q = base + i * (m + 1) + j, w = q + m + 1; this.tri(q, q + 1, w + 1); this.tri(q, w + 1, w); }
  return this;
};
// a round bar along a line of points (ropes, ribs, rails); o.r1 tapers it to its end
GP.tube = function (pts, r, n = 5, o = {}) {
  const base = this.n, m = pts.length; let run = 0;
  for (let i = 0; i < m; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], p = pts[i];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1;
    let sx = ty * 0 - tz * uy, sy = tz * ux - tx * 0, sz = tx * uy - ty * ux; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const wx = sy * tz - sz * ty, wy = sz * tx - sx * tz, wz = sx * ty - sy * tx, rr = o.r1 === undefined ? r : lerp(r, o.r1, i / (m - 1));
    if (i) run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
    for (let j = 0; j <= n; j++) { const q = TAU * j / n, c = Math.cos(q), s = Math.sin(q), nx = sx * c + wx * s, ny = sy * c + wy * s, nz = sz * c + wz * s; this.v(p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr, nx, ny, nz, run, rr * q); }
  }
  for (let i = 0; i < m - 1; i++) for (let j = 0; j < n; j++) { const q = base + i * (n + 1) + j, w = q + n + 1; this.tri(q, w + 1, q + 1); this.tri(q, w, w + 1); }
  return this;
};
// a sheet of nu by nv cells: fn(u, v) gives [x, y, z]; pattern coordinate u is kept as given (cloth: 0 at the mast)
// unless o.su / o.sv scale the pattern coordinates to metres
GP.sheet = function (nu, nv, fn, o = {}) {
  const base = this.n, e = 0.01;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, w = j / nv, p = fn(u, w), a = fn(Math.min(1, u + e), w), a0 = fn(Math.max(0, u - e), w), b = fn(u, Math.min(1, w + e)), b0 = fn(u, Math.max(0, w - e));
    const ux = a[0] - a0[0], uy = a[1] - a0[1], uz = a[2] - a0[2], wx = b[0] - b0[0], wy = b[1] - b0[1], wz = b[2] - b0[2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = (Math.hypot(nx, ny, nz) || 1) * (o.flip ? -1 : 1);
    this.v(p[0], p[1], p[2], nx / l, ny / l, nz / l, u * (o.su ?? 1), w * (o.sv ?? 1));
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const q = base + i * (nv + 1) + j, w = q + nv + 1; if (o.flip) { this.tri(q, w + 1, w); this.tri(q, q + 1, w + 1); } else { this.tri(q, w, w + 1); this.tri(q, w + 1, q + 1); } }
  return this;
};
// a wall in the plane z, from x0 to x1, standing on y0, H tall and T thick, with openings:
// { c: middle, w: width, s: height of the straight part over y0, arch: 1 round head | 0 flat, rise: the head's own
//   height when it is not a half circle (an elliptical head), sill: height of the sill }
// o.back false leaves the far face out (an outside nobody sees); o.k: segments of an arch
GP.wall = function (x0, x1, y0, H, z, T, ops = [], o = {}) {
  const zf = z + T / 2, zb = z - T / 2, yT = y0 + H, K = o.k || 8, back = o.back !== false, front = o.front !== false;
  const rect = (xa, ya, xb, yb) => {
    if (xb - xa < 1e-4 || yb - ya < 1e-4) return;
    if (front) this.quad([xa, ya, zf], [xb, ya, zf], [xb, yb, zf], [xa, yb, zf], xa, ya - y0, xb, yb - y0);
    if (back) this.quad([xb, ya, zb], [xa, ya, zb], [xa, yb, zb], [xb, yb, zb], xb, ya - y0, xa, yb - y0);
  };
  let x = x0;
  for (const op of [...ops].sort((a, b) => a.c - b.c)) {
    const xa = op.c - op.w / 2, xb = op.c + op.w / 2, ys = y0 + op.s, sill = y0 + (op.sill || 0), r = op.w / 2, rh = op.rise ?? r;
    rect(x, y0, xa, yT); rect(xa, y0, xb, sill);
    // the reveals: jambs, sill, head
    this.quad([xa, sill, zf], [xa, sill, zb], [xa, ys, zb], [xa, ys, zf], 0, 0, T, ys - sill);
    this.quad([xb, sill, zb], [xb, sill, zf], [xb, ys, zf], [xb, ys, zb], 0, 0, T, ys - sill);
    if (op.sill) this.quad([xa, sill, zf], [xb, sill, zf], [xb, sill, zb], [xa, sill, zb], 0, 0, op.w, T);
    if (op.arch) {
      for (let k = 0; k < K; k++) {
        const t0 = Math.PI * (1 - k / K), t1 = Math.PI * (1 - (k + 1) / K), ax = op.c + r * Math.cos(t0), ay = Math.min(ys + rh * Math.sin(t0), yT), bx = op.c + r * Math.cos(t1), by = Math.min(ys + rh * Math.sin(t1), yT);
        if (front) { const i = this.n; this.v(ax, ay, zf, 0, 0, 1, ax, ay - y0); this.v(bx, by, zf, 0, 0, 1, bx, by - y0); this.v(bx, yT, zf, 0, 0, 1, bx, H); this.v(ax, yT, zf, 0, 0, 1, ax, H); this.tri(i, i + 1, i + 2); this.tri(i, i + 2, i + 3); }
        if (back) { const i = this.n; this.v(bx, by, zb, 0, 0, -1, bx, by - y0); this.v(ax, ay, zb, 0, 0, -1, ax, ay - y0); this.v(ax, yT, zb, 0, 0, -1, ax, H); this.v(bx, yT, zb, 0, 0, -1, bx, H); this.tri(i, i + 1, i + 2); this.tri(i, i + 2, i + 3); }
        this.quad([ax, ay, zb], [bx, by, zb], [bx, by, zf], [ax, ay, zf], 0, 0, r * Math.PI / K, T);
      }
    } else { rect(xa, ys, xb, yT); this.quad([xa, ys, zb], [xb, ys, zb], [xb, ys, zf], [xa, ys, zf], 0, 0, op.w, T); }
    x = xb;
  }
  rect(x, y0, x1, yT);
  if (o.top !== false) this.quad([x0, yT, zf], [x1, yT, zf], [x1, yT, zb], [x0, yT, zb], 0, 0, x1 - x0, T);
  return this;
};
// a frame inside the frame: everything until pop() is placed at (x, y, z) of the present frame and turned by yaw more
GP.sub = function (x, y, z, yaw = 0) { const t = this.toWorld(x, y, z); (this.stack ||= []).push([this.fx, this.fy, this.fz, this.fc, this.fs]); const a = Math.atan2(this.fs, this.fc) + yaw; this.fx = t[0]; this.fy = t[1]; this.fz = t[2]; this.fc = Math.cos(a); this.fs = Math.sin(a); return this; };
GP.pop = function () { const o = this.stack.pop(); this.fx = o[0]; this.fy = o[1]; this.fz = o[2]; this.fc = o[3]; this.fs = o[4]; return this; };
// begin and end a mover: every vertex added between carries this law (see MOVE); raw: positions are the body's own
GP.move = function (q) { this.mv = q; this.raw = !!(q && q.raw); return this; };

// ---------------------------------------------------------------- the movers' laws
// Every mover is one of five laws on the world's clock t (seconds), with a phase of its own:
//   LOOP  round an ellipse about a pivot (boats down a canal and back, elephants round their avenue, ships, walkers):
//         move = [1, phase, turns a second, 0], par = [Ax, Az, Bx, Bz] the ellipse's two half axes; position = body's own
//   ROCK  rocks about a level axis through a pivot, bobs and pulses (moored ships, jellyfish, the plinth's globe):
//         move = [2, phase, rad a second, bob in m], par = [axis x, axis z, rock in rad, pulse]
//   WAVE  cloth: each vertex moves along its normal by its weight (0 at the mast): move = [3, phase, rad a second, m], par = [ripples, weight]
//   HELIX a figure down a spiral slide round a tower, from inside the tower's head to inside its foot:
//         move = [4, phase, runs a second, height], par = [radius at the top, radius at the foot, turns, the slide's first bearing]
//   PUFF  a puff that swells from nothing, rises and thins to nothing (smoke, a fountain's drops):
//         move = [5, phase, puffs a second, rise], par = [drift x, drift z, 0, 0]
export const MOVE = { LOOP: 1, ROCK: 2, WAVE: 3, HELIX: 4, PUFF: 5 };
const GLSL_MOVE = /* glsl */`
attribute vec3 aPivot; attribute vec4 aMove; attribute vec4 aPar; uniform float uTime;
vec3 moveIt(vec3 p, inout vec3 n) {
  int ty = int(aMove.x + .5);
  float ph = aMove.y, sp = aMove.z;
  if (ty == 1) {
    float th = 6.2831853 * (uTime * sp + ph), c = cos(th), s = sin(th);
    vec2 A = aPar.xy, B = aPar.zw, tg = -s * A + c * B; tg /= max(length(tg), 1e-4);
    vec2 o = c * A + s * B;
    n = vec3(tg.x * n.x - tg.y * n.z, n.y, tg.y * n.x + tg.x * n.z);
    return aPivot + vec3(o.x + tg.x * p.x - tg.y * p.z, p.y, o.y + tg.y * p.x + tg.x * p.z);
  }
  if (ty == 2) {
    float w = uTime * sp + ph * 6.2831853, a = aPar.z * sin(w), c = cos(a), s = sin(a);
    vec3 ax = vec3(aPar.x, 0., aPar.y), d = p - aPivot;
    d.xz *= 1. + aPar.w * sin(w * 1.7);
    d = d * c + cross(ax, d) * s + ax * dot(ax, d) * (1. - c);
    n = n * c + cross(ax, n) * s + ax * dot(ax, n) * (1. - c);
    return aPivot + d + vec3(0., aMove.w * sin(w * .7 + 1.3), 0.);
  }
  if (ty == 3) return p + n * (aMove.w * aPar.y * sin(uTime * sp + ph * 6.2831853 + aPar.x * aPar.y));
  if (ty == 4) {
    float s = fract(uTime * sp + ph), a = s * aPar.z * 6.2831853 + aPar.w;
    float k = smoothstep(0., .06, s) * (1. - smoothstep(.94, 1., s)), r = mix(aPar.x, aPar.y, s) * (.25 + .75 * k);
    return aPivot + vec3(r * cos(a), aMove.w * (1. - s), r * sin(a)) + p;
  }
  if (ty == 5) {
    float s = fract(uTime * sp + ph), k = sin(3.14159265 * s);
    return aPivot + p * k * (.6 + s) + vec3(aPar.x * s, aMove.w * s, aPar.y * s);
  }
  return p;
}`;
// the same laws in JS: where the vertex p of a mover stands at clock t (for counts against the route)
export function moverAt(p, pivot, move, par, t, out = [0, 0, 0]) {
  const ty = Math.round(move[0]), ph = move[1], sp = move[2], fr = (x) => x - Math.floor(x);
  if (ty === 1) {
    const th = TAU * (t * sp + ph), c = Math.cos(th), s = Math.sin(th); let tx = -s * par[0] + c * par[2], tz = -s * par[1] + c * par[3]; const l = Math.max(Math.hypot(tx, tz), 1e-4); tx /= l; tz /= l;
    out[0] = pivot[0] + c * par[0] + s * par[2] + tx * p[0] - tz * p[2]; out[1] = pivot[1] + p[1]; out[2] = pivot[2] + c * par[1] + s * par[3] + tz * p[0] + tx * p[2];
  } else if (ty === 2) {
    const w = t * sp + ph * TAU, a = par[2] * Math.sin(w), c = Math.cos(a), s = Math.sin(a), ax = [par[0], 0, par[1]], k = 1 + par[3] * Math.sin(w * 1.7);
    const d = [(p[0] - pivot[0]) * k, p[1] - pivot[1], (p[2] - pivot[2]) * k], dot = ax[0] * d[0] + ax[2] * d[2], cr = [ax[1] * d[2] - ax[2] * d[1], ax[2] * d[0] - ax[0] * d[2], ax[0] * d[1] - ax[1] * d[0]];
    out[0] = pivot[0] + d[0] * c + cr[0] * s + ax[0] * dot * (1 - c); out[1] = pivot[1] + d[1] * c + cr[1] * s + move[3] * Math.sin(w * 0.7 + 1.3); out[2] = pivot[2] + d[2] * c + cr[2] * s + ax[2] * dot * (1 - c);
  } else if (ty === 3) { out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; }
  else if (ty === 4) {
    const s = fr(t * sp + ph), a = s * par[2] * TAU + par[3], k = smoothstep(0, 0.06, s) * (1 - smoothstep(0.94, 1, s)), r = lerp(par[0], par[1], s) * (0.25 + 0.75 * k);
    out[0] = pivot[0] + r * Math.cos(a) + p[0]; out[1] = pivot[1] + move[3] * (1 - s) + p[1]; out[2] = pivot[2] + r * Math.sin(a) + p[2];
  } else if (ty === 5) { const s = fr(t * sp + ph), k = Math.sin(Math.PI * s) * (0.6 + s); out[0] = pivot[0] + p[0] * k + par[0] * s; out[1] = pivot[1] + p[1] * k + move[3] * s; out[2] = pivot[2] + p[2] * k + par[1] * s; }
  else { out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; }
  return out;
}

// ---------------------------------------------------------------- the lit material of everything built
const GLSL_PATTERN = /* glsl */`
uniform float uTime; uniform float uGlow; uniform float uGain; uniform vec3 uFill; uniform vec3 uWinC; uniform vec3 uLit; uniform float uLitT; uniform vec3 uShutter; uniform float uLamp; uniform vec3 uPane; uniform float uWet; uniform float uSkyG; uniform vec3 uLitW;
uniform vec4 uGlobes[6]; uniform vec3 uGlobeC[6];
varying float vMat; varying vec3 vWP; varying vec2 vPU; varying vec3 vWN;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float lineA(float x, float w, float fw){ float f = abs(fract(x) - .5); return 1. - smoothstep(w, w + fw + 1e-4, f); }
void townPattern(inout vec3 col, out vec3 emi, out float rough, out float metal) {
  int pm = int(vMat + .5);
  vec3 wn = normalize(vWN) * (gl_FrontFacing ? 1. : -1.);
  col *= uGain; emi = col * (uGlow * (1. + uSkyG * (.5 + .5 * wn.y)) + uFill); rough = .8; metal = 0.;
  if (pm == 1) {
    vec2 q = vPU / vec2(3.2, 3.4), id = floor(q), f = fract(q);
    float fw = max(fwidth(q.x), fwidth(q.y)), keep = 1. - smoothstep(.3, .8, fw), aa = fw * 1.2 + .01;
    float wy = smoothstep(.26, .26 + aa, f.y) * (1. - smoothstep(.8, .8 + aa, f.y)) * step(.5, q.y);
    float wx = smoothstep(.3, .3 + aa, f.x) * (1. - smoothstep(.7, .7 + aa, f.x));
    float sx = smoothstep(.14, .14 + aa, f.x) * (1. - smoothstep(.86, .86 + aa, f.x)) - wx;
    float h = h12(id + 7.3), h2 = h12(id.yx + 91.7);
    float lit = smoothstep(0., .25, sin(uTime * (.12 + .35 * h2) + h * 43.) - uLitT);
    vec3 pane = col * .22 * uWinC;
    col = mix(col, uShutter, sx * wy * keep * .9);
    col = mix(col, pane, wx * wy * keep);
    emi += uLit * mix(vec3(1.), uLitW, step(.45, h2)) * lit * wx * wy * mix(.12, 1., keep);
    col *= 1. - .22 * (1. - smoothstep(.0, .5, q.y)) ;
    rough = .85;
  } else if (pm == 2) {
    vec2 w = vPU;
    float a = sin(w.x * .9 + uTime * .8 + sin(w.y * .55 + uTime * .45) * 1.4), b = sin(w.y * 1.25 - uTime * .6 + sin(w.x * .4 - uTime * .35) * 1.1), r = a * b;
    // the water's lights (p1m1, O1): thin long glints, the first wave's crest lines (a third of a metre broad) broken
    // into lengths of some six metres by a slow third wave, in the water's own lighter colour (never white, never an
    // oval); gone where a crest is under a pixel
    float g = smoothstep(.985, 1., a) * smoothstep(0., .6, sin(w.y * .4 - uTime * .3 + w.x * .15)) * (1. - smoothstep(.25, .9, fwidth(w.x) * .9));
    col *= .86 + .14 * r; emi += col * .3 + (col + vec3(max(col.r, max(col.g, col.b))) * .2) * g; rough = .1;
  } else if (pm == 3) { metal = .45; rough = .3; emi += col * .28; }
  else if (pm == 4) { emi = col * uLamp * (1. + .12 * sin(uTime * 7. + h12(floor(vWP.xz * .5)) * 50.)); col *= .3; }
  else if (pm == 5) { float fw = fwidth(vPU.x / 4.) + fwidth(vPU.y / 4.); float g = max(lineA(vPU.x / 4., .03, fw), lineA(vPU.y / 4., .03, fw)); col *= 1. - .16 * g * (1. - smoothstep(.2, .6, fw)); rough = mix(.7, .3, uWet); }
  else if (pm == 6) { col *= .82 + .18 * step(.5, fract(vPU.y * 2.5)); rough = .95; }
  else if (pm == 7) { emi += col * (.9 + .7 * sin(uTime * 2.1 + h12(floor(vWP.xz * 4.)) * 40.)); rough = .3; }
  else if (pm == 8) {
    vec2 q = vPU / vec2(4.2, 7.), id = floor(q), f = fract(q); float fw = max(fwidth(q.x), fwidth(q.y)), keep = 1. - smoothstep(.12, .4, fw);
    float ex = min(f.x, 1. - f.x) * 4.2, ey = min(f.y, 1. - f.y) * 7., e = min(ex, ey);
    float seam = 1. - smoothstep(.03, .09 + fw, e);
    vec2 rv = fract(vPU / .7) - .5; float riv = (1. - smoothstep(.16, .26, length(rv))) * smoothstep(.2, .3, e) * (1. - smoothstep(.5, .62, e));
    col *= (.9 + .2 * h12(id + 3.1)) * (1. - .45 * seam * keep); col += vec3(.06, .065, .075) * riv * keep; rough = .46; metal = .2;
  } else if (pm == 9) {
    vec2 q = vPU / 5.2, f = abs(fract(q) - .5); float fw = max(fwidth(q.x), fwidth(q.y));
    col *= 1. - .16 * smoothstep(.4, .43 + fw, max(f.x, f.y)) * (1. - smoothstep(.2, .6, fw)); metal = .4; rough = .32; emi += col * .05;
  }
  else if (pm == 10) { col *= .78 + .22 * sin(vPU.y * 5. + sin(vPU.x * .5) * 3.); rough = .3; }
  else if (pm == 11) {
    vec2 q = vWP.xz / 9., f = abs(fract(q) - .5); float fw = max(fwidth(q.x), fwidth(q.y)), aa = fw + .004;
    float p = max(max(1. - smoothstep(.035, .035 + aa, min(f.x, f.y)), 1. - smoothstep(.02, .02 + aa, abs(f.x + f.y - .5))), 1. - smoothstep(.02, .02 + aa, abs(length(f) - .27)));
    p *= 1. - smoothstep(.15, .5, fw);
    vec3 wood = vec3(.17, .09, .058) * (.8 + .2 * sin(vWP.x * 1.3 + sin(vWP.z * .21) * 2.));
    col = mix(wood, col * 1.25, p); rough = mix(.24, .5, p); metal = p * .2;
  } else if (pm == 12) {
    vec2 q = vPU / vec2(3., 1.5); q.x += .5 * floor(q.y); vec2 f = fract(q); float fw = max(fwidth(q.x), fwidth(q.y)), aa = fw + .01;
    float j = max(1. - smoothstep(.0, .04 + aa, min(f.x, 1. - f.x)), 1. - smoothstep(.0, .06 + aa, min(f.y, 1. - f.y))) * (1. - smoothstep(.2, .6, fw));
    col *= (.9 + .2 * h12(floor(q))) * (1. - .3 * j); rough = mix(.85, .45, uWet);
  } else if (pm == 13) {
    float fw = fwidth(vPU.y / .9); col *= 1. - .25 * lineA(vPU.y / .9, .08, fw) * (1. - smoothstep(.2, .6, fw)); col *= .85 + .3 * h12(floor(vPU / vec2(.6, .9))); rough = mix(.6, .22, uWet);
  } else if (pm == 14) { rough = 1.; emi += col * .1; }
  else if (pm == 15) {
    vec2 q = vPU / vec2(7., 7.); float fw = max(fwidth(q.x), fwidth(q.y)); float g = max(lineA(q.x, .035, fw), lineA(q.y, .035, fw));
    emi = uPane * (1. - g) * (.85 + .15 * h12(floor(q))); col = mix(vec3(.02), col, g); rough = .4;
  } else if (pm == 16) { col *= .8 + .4 * h12(floor(vPU * 1.5)); rough = .9; }
  else if (pm == 17) {
    vec2 q = vPU / vec2(1.1, 1.3); q.x += .5 * floor(q.y); float fw = max(fwidth(q.x), fwidth(q.y)), keep = 1. - smoothstep(.2, .7, fw);
    col *= mix(1., (.82 + .3 * fract(q.y)) * (.9 + .2 * h12(floor(q))), keep); rough = .55;
  } else if (pm == 18) {
    vec2 q = vPU / vec2(3.4, 6.2), f = abs(fract(q) - .5); float fw = max(fwidth(q.x), fwidth(q.y)), keep = 1. - smoothstep(.15, .5, fw);
    float fr = smoothstep(.36, .38 + fw, max(f.x, f.y * 1.02)), in2 = smoothstep(.3, .32 + fw, max(f.x, f.y * 1.02)) - fr;
    col *= (.8 + .2 * sin(vPU.y * 4. + sin(vPU.x * .7) * 3.)) * (1. + keep * (.35 * fr - .3 * in2)); rough = .28;
  }
  else if (pm == 19) {
    // flagstones of 2 m in broken courses: each its own shade, dark joints; far off, the mean
    vec2 q = vPU / 2.; float fw = max(fwidth(q.x), fwidth(q.y)), aa = fw + .008, keep = 1. - smoothstep(.2, .65, fw); q.x += .5 * floor(q.y); vec2 f = fract(q);
    float j = max(1. - smoothstep(.0, .025 + aa, min(f.x, 1. - f.x)), 1. - smoothstep(.0, .025 + aa, min(f.y, 1. - f.y)));
    col *= mix(.96, (.84 + .28 * h12(floor(q))) * (1. - .36 * j), keep); rough = mix(.7, .3, uWet);
  }
  else if (pm == 20) {
    // a slate roof. v: metres up the slope from the eave; u: metres along the eave (1 to 63) and, in 64s, the slope's
    // whole length in half metres (so the ridge is known). Slates in broken courses, each its own shade; a darker
    // eave, a pale lead ridge, weather in broad patches, soot in streaks under the ridge, a few skylights (some lit).
    // Every part goes to its mean as it grows small in the picture: the slates, the weather and the soot fade to
    // their mean tone; the eave, the ridge and the skylights are widened by the picture's grain and weakened by
    // the same measure (true breadth over widened breadth), so that each keeps its own weight however small.
    float sl = floor(vPU.x / 64.) * .5, u = vPU.x - sl * 128., v = vPU.y;
    float fu = fwidth(u), fv = fwidth(v), keep = 1. - smoothstep(.25, .7, max(fu / .6, fv / .9));
    vec2 q = vec2(u / .6, v / .9); q.x += .5 * floor(q.y);
    col *= mix(.97, (.84 + .32 * h12(floor(q))) * (1. - .3 * lineA(q.y, .07, fv / .9)), keep);
    vec2 p = vec2(u / 6.5, v / 4.5 + sl), pi = floor(p), pf = fract(p); pf = pf * pf * (3. - 2. * pf);
    float wn2 = mix(mix(h12(pi), h12(pi + vec2(1., 0.)), pf.x), mix(h12(pi + vec2(0., 1.)), h12(pi + vec2(1., 1.)), pf.x), pf.y);
    col *= mix(1., .76 + .48 * wn2, 1. - smoothstep(.15, .5, max(fu / 6.5, fv / 4.5)));
    float sk = h12(vec2(floor(u / 2.4), sl * 7.)), st = smoothstep(.55, 1., sk) * (1. - abs(fract(u / 2.4) - .5) * 2.) * smoothstep(sl * .25, sl, v);
    col *= 1. - .36 * st * (1. - smoothstep(.2, .6, fu / 2.4));
    col *= 1. - .36 * (1. - smoothstep(.5, .9 + fv, v)) * (.7 / (.7 + .5 * fv));
    col = mix(col, col * 1.5 + .012, smoothstep(sl - .75 - fv, sl - .55, v) * (.65 / (.65 + .5 * fv)));
    vec2 c = vec2(u / 5.6, v / 4.2), ci = floor(c), cf = (fract(c) - .5) * vec2(5.6, 4.2);
    float hs = h12(ci + sl * 3.7), h2 = h12(ci.yx + 91.7), vc = (ci.y + .5) * 4.2, has = step(hs, .17) * step(1.6, vc) * step(vc, sl - 1.6);
    float rim = (1. - smoothstep(.8, .8 + fu, abs(cf.x))) * (1. - smoothstep(1., 1. + fv, abs(cf.y))) * has * (1.6 / (1.6 + fu)) * (2. / (2. + fv));
    float glass = (1. - smoothstep(.6, .6 + fu, abs(cf.x))) * (1. - smoothstep(.8, .8 + fv, abs(cf.y))) * has * (1.2 / (1.2 + fu)) * (1.6 / (1.6 + fv));
    float lit = smoothstep(0., .25, sin(uTime * (.12 + .35 * h2) + hs * 270.) - uLitT);
    col = mix(col, vec3(.03, .034, .042), rim); col = mix(col, vec3(.05, .07, .1), glass);
    emi += uLit * mix(vec3(1.), uLitW, step(.45, h2)) * lit * glass * .7;
    rough = mix(.6, .22, uWet);
  }
  // the blue (or gold) light every great globe sheds on what stands about it: floor, rail, wall and vault by place
  vec3 gl = vec3(0.);
  for (int i = 0; i < 6; i++) {
    vec3 L = uGlobes[i].xyz - vWP; float d = length(L), R = uGlobes[i].w;
    float sh = .82 + .18 * sin(uTime * 1.9 + dot(vWP, vec3(.31, .23, .27)) + sin(uTime * 1.1 + vWP.x * .17 - vWP.z * .13) * 2.);
    gl += uGlobeC[i] * (max(dot(wn, L) / max(d, 1e-3), 0.) * .85 + .15) * (R * R / (d * d + .35 * R * R)) * sh;
  }
  if (pm != 4 && pm != 15) emi += (col * .8 + .045) * gl;
}`;
// o: { movers, glow, gain (albedo's strength), skyGlow (how much more the faces that look up glow), globes / globeC
// (six great globes' places with radius, and the light each sheds), fill (the lamps' standing light, a colour), winC (the
// unlit panes' tint), lit, litT, shutter, lamp, pane, wet, side, time: { value } }
export function townMaterial(o = {}) {
  const U = { uTime: o.time || { value: 0 }, uGlow: { value: o.glow ?? 0 }, uGain: { value: o.gain ?? 1 }, uFill: { value: new THREE.Color().setRGB(...(o.fill || [0, 0, 0])) }, uWinC: { value: new THREE.Color().setRGB(...(o.winC || [1, 1, 1])) }, uLit: { value: new THREE.Color().setRGB(...(o.lit || [3, 3.2, 3.6])) }, uLitT: { value: o.litT ?? 0.6 },
    uShutter: { value: new THREE.Color().setRGB(...(o.shutter || COLORS.white)) }, uLamp: { value: o.lamp ?? 3 }, uPane: { value: new THREE.Color().setRGB(...(o.pane || COLORS.pearl)) }, uWet: { value: o.wet ?? 0 }, uSkyG: { value: o.skyGlow ?? 0 }, uLitW: { value: new THREE.Color().setRGB(...(o.litWarm || [1, 1, 1])) },
    uGlobes: { value: o.globes || [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -1e4, 0, 1)) }, uGlobeC: { value: o.globeC || [0, 1, 2, 3, 4, 5].map(() => new THREE.Color(0, 0, 0)) } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: o.side ?? THREE.FrontSide });
  if (o.movers) m.defines = { MOVERS: 1 };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aMat; varying float vMat; varying vec3 vWP; varying vec2 vPU; varying vec3 vWN;\n#ifdef MOVERS\n' + GLSL_MOVE + '\n#endif')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n#ifdef MOVERS\nvec3 mvP = moveIt(position, objectNormal);\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef MOVERS\ntransformed = mvP;\n#endif\nvMat = aMat; vPU = uv; vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vWN = mat3(modelMatrix) * objectNormal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_PATTERN)
      .replace('#include <color_fragment>', '#include <color_fragment>\nvec3 tEmi; float tRough, tMetal; townPattern(diffuseColor.rgb, tEmi, tRough, tMetal);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = tRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = tMetal;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += tEmi;');
  };
  m.customProgramCacheKey = () => 'bcgg-town' + (o.movers ? '-m' : '');
  m.userData.uniforms = U;
  return m;
}

// ---------------------------------------------------------------- the crystal
// One shader, two faces. FRONT (the near wall seen from outside): the room mirrored in the glass (the glazed roof's
// pearl panes between ribs, the tall windows on the light's side, warm lamps, the floor), bright toward the rim, a hot
// glint of the light, an ice-blue edge. BACK (the far wall seen through the ball, and the whole crystal seen from
// inside it as a sky): clear in the middle, a rim of light where the glass turns away from the eye, one sharp glint
// of the light mirrored in the wall, and the crescent the light lays on the far wall. The shine depends on where the glass is seen from, as
// shine does; nothing else of the view is read.
const CRYSTAL_VERT = /* glsl */`
attribute float aTint; varying vec3 vN; varying vec3 vW; varying float vTint;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vTint = aTint; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CRYSTAL_FRAG = /* glsl */`
uniform vec3 uL; uniform vec3 uLightC; uniform vec3 uSky; uniform vec3 uLampC; uniform vec3 uFloorC; uniform vec3 uIce; uniform vec3 uGoldC; uniform vec4 uVeil; uniform float uSun; uniform float uThin; uniform float uT;
varying vec3 vN; varying vec3 vW; varying float vTint;
// the light mirrored in the glass, as a function of the mirrored ray alone: a tall window's shape (one upright bar
// and two cross bars: two panes by three) with soft edges, and a faint soft halo round it; no disc
float windowGlint(vec3 R, float gain){
  vec3 Tu = normalize(cross(vec3(0., 1., 0.), uL)), Tv = cross(uL, Tu);
  float du = dot(R, Tu), dv = dot(R, Tv), sp = max(dot(R, uL), 0.), s8 = sp * sp; s8 *= s8; s8 *= s8; float s64 = s8 * s8; s64 *= s64; s64 *= s64;
  float win = step(.5, sp) * (1. - smoothstep(.036, .045, abs(du))) * (1. - smoothstep(.064, .075, abs(dv)));
  win *= smoothstep(.003, .007, abs(du)) * smoothstep(.003, .007, abs(abs(dv) - .025));
  return (win * gain + s64 * .05) * uSun;
}
// (polish round 1) LIGHT THAT TRAVELS OVER THE GLASS, slowly, on the world's clock: soft bright bands that drift over
// the ball from the light's hand, as the evening's light moves through the panes it comes in by. A law of the
// glass's own face (its normal) and of the standing light alone: it does not read where the glass is seen from.
float travel(vec3 N){
  float tb = dot(N, uL) * 7. - uT * .22 + 1.6 * sin(dot(N, vec3(.37, .11, .92)) * 3. + uT * .09);
  return smoothstep(.88, 1., sin(tb)) * (.35 + .65 * max(dot(N, uL), 0.)) * uSun;
}
void main(){
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN); float ndv = dot(N, V);
  vec3 ice = mix(uIce, uGoldC, clamp(vTint, 0., 1.)); float trav = travel(N);
#ifdef BACK
  float e = 1. - clamp(-ndv, 0., 1.), e2 = e * e, rim = mix(e2, e2 * e2 * e2 * e, uThin);
  vec3 Rb = reflect(-V, N); float glint = windowGlint(Rb, .9);
  float cres = max(dot(N, -uL), 0.); cres = cres * cres * cres; cres *= cres;
  vec3 col = ice * (uVeil.x + uVeil.y * rim) + uLightC * (cres * uVeil.z + glint + trav * .07);
  float a = clamp(uVeil.w + .45 * rim * mix(e, 1., uThin), 0., .9);
  gl_FragColor = vec4(col, a);
#else
  float e = 1. - clamp(ndv, 0., 1.); e = mix(e, e * e, uThin); float e2 = e * e, fres = mix(.05, .025, uThin) + .95 * e2 * e2 * e;
  vec3 R = reflect(-V, N); float up = R.y, az = atan(R.z, R.x + 1e-6);
  float panes = smoothstep(.12, .45, up) * (.5 + .5 * step(.16, abs(fract(az * 2.5465) - .5))) * (.6 + .4 * step(.1, abs(fract(up * 5.) - .5)));
  vec3 env = uSky * panes;
  vec2 Rh = R.xz / max(length(R.xz), 1e-4), Lh = uL.xz / max(length(uL.xz), 1e-4);
  float side = dot(Rh, Lh), cross2 = Rh.x * Lh.y - Rh.y * Lh.x, wa = atan(cross2, side + 1e-6);
  float wins = smoothstep(-.16, -.1, up) * (1. - smoothstep(.2, .34 - .1 * abs(fract(wa * 3.2) - .5), up)) * step(.2, abs(fract(wa * 3.2) - .5)) * step(abs(wa), 1.25);
  env += uSky * 1.5 * wins;
  env += uLampC * 2.5 * smoothstep(.9, .98, cos(az * 6. + 1.)) * (1. - smoothstep(.0, .07, abs(up + .14)));
  env += uFloorC * (1. - smoothstep(-.6, -.05, up));
  float glint = windowGlint(R, mix(2.4, 1.7, uThin));
  vec3 col = env * fres * 1.25 + uLightC * (glint + trav * .16) + ice * (e2 * .34 + .012);
  float a = clamp(fres * .92 + glint + e2 * .3 + .03 + trav * .08, 0., .97);
  gl_FragColor = vec4(col, a);
#endif
}`;
// o: { back, light: Vector3 toward the light, lightColor, sky, lamp, floor, veil: [base, rim, crescent, cover], sun,
// thin: 1 for the great globe (its rim light is a thin line and its middle is clear, from outside and from inside),
// time: { value } the world's clock (the light that travels over the glass) }
export function crystalMaterial(o = {}) {
  const C = (c) => new THREE.Color().setRGB(...c);
  return new THREE.ShaderMaterial({
    defines: o.back ? { BACK: 1 } : {}, transparent: true, depthWrite: false, side: o.back ? THREE.BackSide : THREE.FrontSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uL: { value: o.light || new THREE.Vector3(0.5, 0.7, 0.5).normalize() }, uLightC: { value: C(o.lightColor || [1, 0.97, 0.9]) }, uSky: { value: C(o.sky || COLORS.pearl) }, uLampC: { value: C(o.lamp || COLORS.gold) },
      uFloorC: { value: C(o.floor || [0.02, 0.03, 0.06]) }, uIce: { value: C(o.ice || COLORS.crystal) }, uGoldC: { value: C(o.goldTint || [1, 0.85, 0.5]) }, uVeil: { value: new THREE.Vector4(...(o.veil || [0.05, 0.35, 0.35, 0.06])) }, uSun: { value: o.sun ?? 1 }, uThin: { value: o.thin ?? 0 }, uT: o.time || { value: 0 } },
    vertexShader: CRYSTAL_VERT, fragmentShader: CRYSTAL_FRAG });
}
// crystal balls gathered into one geometry: add(cx, cy, cz, r, o) with o.hole (half angle of an opening in the crown), o.tint
export class Shells {
  constructor() { this.P = []; this.N = []; this.T = []; this.I = []; }
  add(cx, cy, cz, r, o = {}) {
    const nu = o.nu || 20, nv = o.nv || 12, t0 = o.hole || 0, base = this.P.length / 3;
    for (let j = 0; j <= nv; j++) {
      const th = t0 + (Math.PI - t0) * j / nv, st = Math.sin(th), ct = Math.cos(th);
      for (let i = 0; i <= nu; i++) { const a = TAU * i / nu, x = st * Math.cos(a), z = st * Math.sin(a); this.P.push(cx + x * r, cy + ct * r, cz + z * r); this.N.push(x, ct, z); this.T.push(o.tint || 0); }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = base + j * (nu + 1) + i, w = q + nu + 1; this.I.push(q, q + 1, w + 1, q, w + 1, w); }
    return this;
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('aTint', new THREE.Float32BufferAttribute(this.T, 1));
    g.setIndex(this.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    return g;
  }
}

// ---------------------------------------------------------------- a globe's furniture
// the bronze stand: a stepped foot, a turned stem and a cup that holds the ball's lower quarter, with a brass lip.
// (cx, floor, cz): where it stands; r: the ball's radius; hs: the height of the ball's lowest point over the floor
export function standInto(g, cx, fy, cz, r, hs, o = {}) {
  const n = o.n || 16, C = COLORS, cup = [];
  for (const d of [-88, -76, -64, -54, -46]) { const a = d * Math.PI / 180; cup.push([1.025 * r * Math.cos(a) + 0.02 * r, hs + r + 1.025 * r * Math.sin(a) - 0.01 * r]); }
  g.set(C.bronze, PAT.BRONZE);
  g.lathe(cx, fy, cz, [[0.82 * r, 0], [0.82 * r, 0.05 * r], [0.7 * r, 0.05 * r], [0.7 * r, 0.11 * r], [0.52 * r, 0.11 * r], [0.5 * r, 0.16 * r]], n, { cap: false });
  const stem = [[0.5 * r, 0.16 * r], [0.24 * r, 0.3 * r], [0.17 * r, hs * 0.5], [0.2 * r, hs * 0.72], [0.3 * r, hs * 0.8], [0.22 * r, hs * 0.88]];
  g.lathe(cx, fy, cz, [...stem, ...cup], n, { smooth: true, cap: false });
  g.set(C.brass, PAT.GOLD);
  g.torus(cx, fy + cup[cup.length - 1][1], cz, cup[cup.length - 1][0], 0.035 * r, n * 2, 6);
  g.torus(cx, fy + hs * 0.8, cz, 0.3 * r, 0.03 * r, n, 5);
  return { top: fy + hs + 2 * r, reach: 0.82 * r };
}
// the crown: a bronze cap with a finial on a closed ball, or (open) the bronze ring round the opening of the great one
export function crownInto(g, cx, cy, cz, r, o = {}) {
  const C = COLORS;
  if (o.open) {
    const a = o.open, R = r * Math.sin(a), y = cy + r * Math.cos(a);
    g.set(C.bronze, PAT.BRONZE); g.torus(cx, y, cz, R + 0.02 * r, 0.028 * r, 48, 8);
    g.set(C.brass, PAT.GOLD); g.torus(cx, y + 0.03 * r, cz, R + 0.045 * r, 0.012 * r, 48, 6);
    return;
  }
  const prof = []; for (const d of [16, 11, 6, 0]) { const a = d * Math.PI / 180; prof.push([1.02 * r * Math.sin(a), 1.02 * r * Math.cos(a)]); }
  g.set(C.bronze, PAT.BRONZE); g.lathe(cx, cy, cz, prof, 12, { smooth: true, cap: false });
  g.set(C.brass, PAT.GOLD); g.lathe(cx, cy + 1.02 * r, cz, [[0.05 * r, 0], [0.07 * r, 0.05 * r], [0.03 * r, 0.09 * r], [0.06 * r, 0.14 * r], [0, 0.2 * r]], 8, { smooth: true });
}
// the brass rail with its velvet rope: posts on a circle of radius rad (or on an arc of it: o.a0, o.arc), a rope
// swagged from post to post
export function railInto(g, cx, fy, cz, rad, o = {}) {
  const C = COLORS, arc = o.arc ?? TAU, open = arc < TAU - 1e-6, n = o.posts || Math.max(open ? 4 : 8, Math.round(arc * rad / 9)), h = o.h || 4.2, pr = o.pr || 0.34, a0 = o.a0 || 0, gap = o.gap;
  for (let i = 0; i < n + (open ? 1 : 0); i++) {
    const a = a0 + arc * i / n, x = cx + rad * Math.cos(a), z = cz + rad * Math.sin(a);
    g.set(C.brass, PAT.GOLD);
    g.lathe(x, fy, z, [[pr * 2.2, 0], [pr * 2.2, 0.18], [pr, 0.5], [pr, h - 0.5], [pr * 1.6, h - 0.2], [pr * 1.9, h], [0, h + 0.5]], 8, { smooth: true });
    if ((gap !== undefined && i === gap) || i === n) continue;
    const b = a0 + arc * (i + 1) / n, pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, q = a + (b - a) * t; pts.push([cx + rad * Math.cos(q), fy + h - 0.35 - 1.5 * 4 * t * (1 - t), cz + rad * Math.sin(q)]); }
    g.set(C.velvet, PAT.VELVET); g.tube(pts, 0.22, 5);
  }
  return n;
}
// a lamp's pool on a paved face: half a round of the paving's own flags laid 3 cm over it, warmed at the lamp's foot
// and of the paving's own colour at its rim (so it has no edge); uv gives the paving's own pattern coordinates
export function poolOn(g, col, warm, x, y, z, rad, a0, uv) {
  const base = g.n, m = PAT.FLAG, n = 6, c0 = uv(x, z);
  g.set(mixc(col, warm, 0.6), m).v(x, y, z, 0, 1, 0, c0[0], c0[1]); g.set(col, m);
  for (let j = 0; j <= n; j++) { const a = a0 + Math.PI * j / n, px = x + rad * Math.cos(a), pz = z + rad * Math.sin(a), c = uv(px, pz); g.v(px, y, pz, 0, 1, 0, c[0], c[1]); }
  for (let j = 0; j < n; j++) g.tri(base, base + j + 2, base + j + 1);
  return g;
}
// a bracket lamp or a lamp standard: a bronze stem with a gold globe of light; returns the light's place
export function lampInto(g, cx, y0, cz, h, o = {}) {
  const C = COLORS, k = o.k || 1;
  g.set(C.bronze, PAT.BRONZE); g.lathe(cx, y0, cz, [[0.9 * k, 0], [0.9 * k, 0.3 * k], [0.35 * k, 0.9 * k], [0.28 * k, h - 1.2 * k], [0.7 * k, h - 0.6 * k], [0.5 * k, h]], 8, { smooth: true, cap: false });
  g.set(o.color || C.gold, PAT.LIGHT); g.lathe(cx, y0 + h, cz, [[0.5 * k, 0], [1.1 * k, 0.9 * k], [1.0 * k, 1.9 * k], [0.4 * k, 2.5 * k], [0, 2.7 * k]], 8, { smooth: true });
  return [cx, y0 + h + 1.3 * k, cz];
}
// a bracket lamp: a bronze plate on the wall at (x, y, z), an arm that stands out along (dx, dz) and curls up, a gold
// globe of light on it; returns the light's place
export function bracketInto(g, x, y, z, dx, dz, o = {}) {
  const C = COLORS, k = o.k || 1, L = (o.len || 2.6) * k, pts = [];
  g.set(C.bronze, PAT.BRONZE).box(x + dx * 0.15 * k, y - 1.1 * k, z + dz * 0.15 * k, 0.3 * k + Math.abs(dz) * 1.1 * k, 2.6 * k, 0.3 * k + Math.abs(dx) * 1.1 * k, {});
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([x + dx * L * t, y - 0.6 * k * Math.sin(Math.PI * t) + 1.5 * k * t * t, z + dz * L * t]); }
  g.tube(pts, 0.17 * k, 5);
  g.set(o.color || C.gold, PAT.LIGHT).lathe(x + dx * L, y + 1.5 * k, z + dz * L, [[0.3 * k, 0], [0.8 * k, 0.6 * k], [0.75 * k, 1.4 * k], [0.25 * k, 1.9 * k], [0, 2 * k]], 7, { smooth: true });
  return [x + dx * L, y + 2.5 * k, z + dz * L];
}

// ---------------------------------------------------------------- the small blue cities
// Every city is built in the globe's own metres (crystal radius 80, ground 28 under the middle, ground radius 72) into
// two geometries under one frame: S what stands, M what moves. q is the make: 0 a far city in an alcove (some 700
// triangles), 1 a city passed close (some thousands). Every draw comes from the city's own stream.
const GY = GLOBE.ground, DISC = 72, RIM = Math.sqrt(78 * 78 - GLOBE.ground * GLOBE.ground);
// the city's colours: blues with white and a little gold; gold: the rare city, all in gold
export function cityPalette(rng, gold = false) {
  const C = COLORS, sh = rng.range(-0.04, 0.04);
  const B = gold ? { ultra: lin('#8a5a14'), cobalt: lin('#d9a02c'), turq: lin('#f0c95a'), ice: lin('#fff0c0'), deep: lin('#5a3a0c'), navy: lin('#3a2406'), white: lin('#fff8e6'), gold: lin('#fff2b0'), water: lin('#c98a1a'), slate: lin('#a8741c') }
    : { ultra: C.ultra, cobalt: C.cobalt, turq: C.turq, ice: C.ice, deep: C.deep, navy: C.navy, white: C.white, gold: C.gold, water: lin('#1b5fd0'), slate: lin('#3d5cc9') };
  const tw = (c, k = 1) => [clamp(c[0] * k + sh, 0.005, 1), clamp(c[1] * k, 0.005, 1), clamp(c[2] * k - sh, 0.005, 1)];
  const walls = rng.shuffle([B.ultra, B.cobalt, B.turq, B.ice, B.cobalt, B.white]).slice(0, 4), roofs = rng.shuffle([B.slate, B.ultra, B.white, B.turq, B.cobalt]).slice(0, 3);
  return { ...B, gold$: gold, wall: (r) => tw(r.pick(walls), r.range(0.8, 1.12)), roof: (r) => tw(r.pick(roofs), r.range(0.85, 1.1)), ground: tw(mixc(B.deep, B.cobalt, rng.range(0.15, 0.5)), 0.9), tw };
}
// the body under the ground (deep blue to the crystal) and the ground itself; o.sea: the ground is water
export function cityBase(S, pal, o = {}) {
  const prof = [], rb = 78; for (let d = -90; d <= -21; d += 11.5) { const a = d * Math.PI / 180; prof.push([rb * Math.cos(a), rb * Math.sin(a)]); }
  prof.push([Math.sqrt(rb * rb - GY * GY), GY]);
  S.set(pal.navy, PAT.PLAIN); S.lathe(0, 0, 0, prof, o.n || 20, { smooth: true, cap: false });
  S.set(o.sea ? pal.water : pal.ground, o.sea ? PAT.WATER : PAT.PAVE); S.lathe(0, GY, 0, [[Math.sqrt(rb * rb - GY * GY), 0], [0, 0]], o.n || 20, { cap: false });
}
// a house: walls with windows and a roof (0 gable, 1 hip, 2 flat with a parapet, 3 dome)
export function house(S, r, pal, x, z, w, d, h, yaw, o = {}) {
  const y = o.y ?? GY, kind = o.roof ?? r.int(0, 2), wc = o.wall || pal.wall(r), rc = o.roofCol || pal.roof(r), e = o.fine ? 0.8 : 0.35;
  S.set(wc, PAT.WALL).box(x, y, z, w, h, d, { yaw, top: kind >= 2 && !o.fine, u0: o.u0 ?? r.range(0, 40) });
  // a fine house has a white cornice; its flat top is a deck of the roof's own tiles inside the cornice's white rim
  if (o.fine) { S.set(pal.white, PAT.PLAIN).box(x, y + h - 0.45, z, w + 0.8, 0.45, d + 0.8, { yaw, bot: true, top: kind >= 2 }); if (kind >= 2) S.set(mulc(mixc(rc, pal.ground, 0.3), 0.85), PAT.TILE).box(x, y + h, z, w - 0.5, 0.04, d - 0.5, { yaw, skip: [0, 1, 2, 3] }); }
  S.set(rc, PAT.TILE);
  if (kind === 0) S.gable(x, y + h, z, w, d, Math.min(w, d) * 0.42, { yaw, eave: e, end: [wc, PAT.PLAIN] });
  else if (kind === 1) S.hip(x, y + h, z, w + 2 * e, d + 2 * e, Math.min(w, d) * 0.4, { yaw });
  else if (kind === 3) S.set(rc, PAT.PLAIN).dome(x, y + h, z, Math.min(w, d) * 0.42, Math.min(w, d) * 0.42, 8, 3);
  return h;
}
// a tower: round or square, with a pointed, domed or flat head and a gold tip
export function tower(S, r, pal, x, z, rad, h, o = {}) {
  const y = o.y ?? GY, n = o.n || 8, round = o.round ?? r.chance(0.6), head = o.head ?? r.int(0, 2), wc = o.wall || pal.wall(r), rc = o.roofCol || pal.roof(r), tp = o.taper ?? 0.82;
  S.set(wc, PAT.WALL);
  if (round) S.cyl(x, y, z, rad, rad * tp, h, n, { cap: head === 2 }); else S.box(x, y, z, rad * 1.8, h, rad * 1.8, { tx: tp, tz: tp, yaw: o.yaw || 0, top: head === 2 });
  S.set(rc, PAT.PLAIN);
  const rt = rad * tp * (round ? 1.12 : 1.05);
  if (head === 0) S.cone(x, y + h, z, rt, rad * 2.4, round ? n : 4, { a0: round ? 0 : Math.PI / 4 - (o.yaw || 0) });
  else if (head === 1) S.dome(x, y + h, z, rt, rt * 1.1, n, 3, { onion: o.onion || 0 });
  else { S.set(wc, PAT.WALL); S.cyl(x, y + h, z, rad * tp * 0.55, rad * tp * 0.5, rad * 1.2, n, {}); }
  if (o.tip !== false) { S.set(pal.gold, PAT.GOLD); S.cone(x, y + h + (head === 0 ? rad * 2.3 : head === 1 ? rt * 1.05 : rad * 1.2), z, rad * 0.14, rad * 0.9, 4); }
  return h;
}
// a deck that arches from a to b (a bridge): a slab on a circular arc with parapets
export function bridge(S, ax, az, bx, bz, y, rise, w, o = {}) {
  const n = o.n || 6, L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(-(bz - az), bx - ax), th = o.th || 1.2;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, y0 = y + rise * 4 * t0 * (1 - t0), y1 = y + rise * 4 * t1 * (1 - t1), mx = lerp(ax, bx, (t0 + t1) / 2), mz = lerp(az, bz, (t0 + t1) / 2);
    S.box(mx, Math.min(y0, y1) - th + (y0 + y1) / 2 - Math.min(y0, y1), mz, L / n + 0.05, th, w, { yaw, bot: true });
  }
  return yaw;
}
// houses scattered where ok(x, z, reach) says there is room: every house's draws are made before it is tested
export function fillHouses(S, r, pal, n, ok, o = {}) {
  const put = o.taken ? [...o.taken] : [], n0 = put.length, yaw0 = o.yaw ?? r.range(0, Math.PI), hs = o.h || [7, 16], ws = o.w || [7, 13], R = o.R || 66;
  for (let i = 0; i < n * 5 && put.length < n + n0; i++) {
    const a = r.range(0, TAU), q = lerp(o.R0 || 0, R, Math.sqrt(r())), x = Math.cos(a) * q, z = Math.sin(a) * q, w = r.range(ws[0], ws[1]), d = r.range(ws[0], ws[1]), h = r.range(hs[0], hs[1]) * (1 + (o.mid || 0) * Math.max(0, 1 - q / R)), yaw = yaw0 + (r.chance(0.5) ? 0 : Math.PI / 2) + r.range(-0.06, 0.06), kind = r.pick(o.kinds || [0, 1, 2]), tall = r.chance(o.towers ?? 0.12), tRound = r.chance(0.6), tHead = r.int(0, 2);
    const wc = pal.wall(r), rc = pal.roof(r), u0 = r.range(0, 40), reach = Math.hypot(w, d) / 2 + (o.gap ?? 1);
    if (q + reach > R || !ok(x, z, reach)) continue;
    let hit = false; for (const p of put) if (Math.hypot(p[0] - x, p[1] - z) < p[2] + reach) { hit = true; break; }
    if (hit) continue;
    put.push([x, z, reach, h]);
    if (tall) tower(S, r, pal, x, z, Math.min(w, d) * 0.42, h * 2.1, { wall: wc, roofCol: rc, n: o.n || 8, round: tRound, head: tHead });
    else { S.set(wc, PAT.WALL).box(x, GY, z, w, h, d, { yaw, top: kind >= 2, u0 }); S.set(rc, PAT.PLAIN); if (kind === 3) S.dome(x, GY + h, z, Math.min(w, d) * 0.42, Math.min(w, d) * 0.45, 8, 3); S.set(rc, PAT.TILE); if (kind === 0) S.gable(x, GY + h, z, w, d, Math.min(w, d) * 0.42, { yaw, eave: 0.35, end: [wc, PAT.PLAIN] }); else if (kind === 1) S.hip(x, GY + h, z, w + 0.7, d + 0.7, Math.min(w, d) * 0.4, { yaw }); }
  }
  return put;
}
// the movers' laws set on M in the city's own metres (the frame turns and scales them into the geometry's space)
const loopOn = (M, c, A, B, ph, sp) => { const k = M.fk, a = M.toDir(A[0], A[1]), b = M.toDir(B[0], B[1]); return M.move({ raw: true, pivot: M.toWorld(c[0], c[1], c[2]), move: [MOVE.LOOP, ph, sp, 0], par: [a[0] * k, a[1] * k, b[0] * k, b[1] * k] }); };
const rockOn = (M, p, axis, ph, sp, rock, bob, pulse = 0) => { const a = M.toDir(axis[0], axis[1]); return M.move({ pivot: M.toWorld(p[0], p[1], p[2]), move: [MOVE.ROCK, ph, sp, bob * M.fk], par: [a[0], a[1], rock, pulse] }); };
const waveOn = (M, ph, sp, amp, rip) => M.move({ pivot: [0, 0, 0], move: [MOVE.WAVE, ph, sp, amp * M.fk], par: [rip, 0, 0, 0], weight: true });
const helixOn = (M, base, H, rT, rB, turns, ph, sp) => M.move({ raw: true, pivot: M.toWorld(base[0], base[1], base[2]), move: [MOVE.HELIX, ph, sp, H * M.fk * M.fsy], par: [rT * M.fk, rB * M.fk, turns, -Math.atan2(M.fs, M.fc)] });
const puffOn = (M, p, H, ph, sp, drift = [0, 0]) => { const d = M.toDir(drift[0], drift[1]); return M.move({ raw: true, pivot: M.toWorld(p[0], p[1], p[2]), move: [MOVE.PUFF, ph, sp, H * M.fk * M.fsy], par: [d[0] * M.fk, d[1] * M.fk, 0, 0] }); };
export const LAWS = { loopOn, rockOn, waveOn, helixOn, puffOn };
// the movers' bodies, in their own coordinates (x forward, standing on y = 0)
const boatBody = (M, pal, L, o = {}) => { M.set(o.hull || pal.white, PAT.PLAIN).box(0, 0, 0, L, L * 0.16, L * 0.3, { tx: 1.18, tz: 1.1 }); M.set(o.cabin || pal.gold, PAT.GOLD).box(-L * 0.12, L * 0.16, 0, L * 0.34, L * 0.16, L * 0.2); };
const elephantBody = (M, pal, s, low) => {
  M.set(pal.ice, PAT.PLAIN).box(0, 0.9 * s, 0, 2.6 * s, 1.5 * s, 1.3 * s, { bot: true }).box(1.6 * s, 1.25 * s, 0, 0.95 * s, 1.05 * s, 0.95 * s, { bot: true });
  if (!low) { M.box(2.15 * s, 0.25 * s, 0, 0.3 * s, 1.1 * s, 0.3 * s); for (const [x, z] of [[0.9, 0.42], [0.9, -0.42], [-0.9, 0.42], [-0.9, -0.42]]) M.box(x * s, 0, z * s, 0.45 * s, 0.95 * s, 0.45 * s, { top: false }); }
  M.set(pal.gold, PAT.GOLD).box(-0.1 * s, 2.4 * s, 0, 1.3 * s, 0.5 * s, 1.1 * s); M.set(pal.white, PAT.CLOTH).hip(-0.1 * s, 3.5 * s, 0, 1.7 * s, 1.5 * s, 0.6 * s);
  if (!low) M.set(pal.gold, PAT.GOLD).box(-0.1 * s, 2.9 * s, 0, 0.12 * s, 0.6 * s, 0.12 * s, { top: false });
};
const personBody = (M, col, h) => { M.set(col, PAT.PLAIN).box(0, 0, 0, 0.3 * h, 0.74 * h, 0.3 * h, { tx: 0.8, tz: 0.8 }).box(0, 0.76 * h, 0, 0.2 * h, 0.24 * h, 0.2 * h); };
const blobBody = (M, col, s, round = false) => { M.set(col, PAT.PLAIN).lathe(0, 0, 0, round ? [[0, -s], [s * 0.72, -s * 0.68], [s, 0], [s * 0.72, s * 0.68], [0, s]] : [[0, -s], [s, 0], [0, s]], round ? 7 : 5, { smooth: true }); };
// a moored ship that rocks: hull, mast and sails, built where it lies (heading yaw); pre: its four draws, where the
// caller made them before a test of its own
const shipAt = (M, r, pal, x, z, L, yaw, y = GY + 0.2, pre = null, hull = null) => {
  const q = pre || [r(), r.range(0.7, 1.2), r.range(0.05, 0.09), r.chance(0.5)];
  rockOn(M, [x, y, z], [Math.cos(yaw), -Math.sin(yaw)], q[0], q[1], q[2], 0.18);
  // hull: [hull's colour, deck's colour]: a dark hull, its top a deck of pale planks inside the hull's own rim
  if (hull) { M.set(hull[0], PAT.PLAIN).box(x, y, z, L, L * 0.13, L * 0.26, { yaw, tx: 1.16, tz: 1.1 }); M.set(hull[1], PAT.CLOTH).box(x, y + L * 0.13, z, L * 1.02, 0.03, L * 0.2, { yaw, skip: [0, 1, 2, 3] }); }
  else M.set(pal.white, PAT.PLAIN).box(x, y, z, L, L * 0.13, L * 0.26, { yaw, tx: 1.16, tz: 1.1 });
  M.set(pal.navy, PAT.PLAIN).box(x, y + L * 0.13, z, L * 0.03, L * 0.8, L * 0.03, { yaw });
  M.set(q[3] ? pal.ice : pal.turq, PAT.CLOTH).box(x, y + L * 0.28, z, L * 0.02, L * 0.5, L * 0.44, { yaw, tz: 0.35 });
  M.set(pal.gold, PAT.GOLD).box(x, y + L * 0.93, z, L * 0.1, L * 0.04, L * 0.02, { yaw });
  M.move(null);
};
export const BODIES = { boatBody, elephantBody, personBody, blobBody, shipAt };

// THE KINDS. c = { S, M, r, pal, q }.
// 1. the city of canals with its pond of drifting jellyfish
function cityCanal(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const yaw = r.range(0, Math.PI), nC = q ? 3 : 2, cw = 7, pond = [r.range(-9, 9), r.range(-9, 9), r.range(13, 16)], lines = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < nC; i++) {
    const yk = yaw + k * Math.PI / 2, d = [Math.cos(yk), -Math.sin(yk)], n = [Math.sin(yk), Math.cos(yk)], off = (i - (nC - 1) / 2) * (q ? 34 : 42) + r.range(-5, 5), half = Math.sqrt(Math.max(1, 69 * 69 - off * off));
    lines.push({ d, n, off, half, yk });
    S.set(pal.water, PAT.WATER).box(n[0] * off, GY + 0.05, n[1] * off, half * 2, 0.35, cw, { yaw: yk });
    if (q) for (const sg of [-1, 1]) S.set(pal.ice, PAT.PLAIN).box(n[0] * (off + sg * (cw / 2 + 0.6)), GY, n[1] * (off + sg * (cw / 2 + 0.6)), half * 2 - 4, 1, 1.2, { yaw: yk });
  }
  S.set(pal.water, PAT.WATER).lathe(pond[0], GY + 0.5, pond[1], [[pond[2], 0], [0, 0]], q ? 20 : 10, { cap: false });
  S.set(pal.white, PAT.PLAIN).torus(pond[0], GY + 0.5, pond[1], pond[2], 0.9, q ? 20 : 10, 4);
  for (let i = 0, nJ = q ? 10 : 4; i < nJ; i++) {
    const a = r.range(0, TAU), d = Math.sqrt(r()) * (pond[2] - 3.5), x = pond[0] + Math.cos(a) * d, z = pond[1] + Math.sin(a) * d, s = r.range(1.6, 2.6) * (q ? 1.5 : 1);
    rockOn(M, [x, GY + 1.6, z], [1, 0], r(), r.range(0.9, 1.5), 0.12, 0.7, 0.2);
    M.set(i % 3 ? pal.turq : pal.white, PAT.JELLY).dome(x, GY + 1.2, z, s, s * 0.9, 7, 3); M.set(pal.ice, PAT.JELLY).cyl(x, GY + 0.2, z, s * 0.35, s * 0.6, 1, 5, { cap: false }); M.move(null);
  }
  for (const [li, L] of lines.entries()) {
    const nb = q ? 2 : li % 2 ? 0 : 1;
    for (let b = 0; b < nb; b++) { loopOn(M, [L.n[0] * L.off, GY + 0.4, L.n[1] * L.off], [L.d[0] * L.half * r.range(0.55, 0.85), L.d[1] * L.half * 0.8], [L.n[0] * 1.7, L.n[1] * 1.7], r(), (r.chance(0.5) ? 1 : -1) / r.range(34, 60)); boatBody(M, pal, r.range(6, 8.5) * (q ? 1.4 : 1)); M.move(null); }
    if (q) for (let b = 0; b < 2; b++) { const t = r.range(-0.7, 0.7) * L.half, px = L.n[0] * L.off + L.d[0] * t, pz = L.n[1] * L.off + L.d[1] * t; S.set(pal.white, PAT.PLAIN); bridge(S, px - L.n[0] * 6, pz - L.n[1] * 6, px + L.n[0] * 6, pz + L.n[1] * 6, GY + 0.9, 2, 3.4, { n: 4 }); }
  }
  const ok = (x, z, rr) => { if (Math.hypot(x - pond[0], z - pond[1]) < pond[2] + 2.5 + rr) return false; for (const L of lines) if (Math.abs(x * L.n[0] + z * L.n[1] - L.off) < cw / 2 + 2 + rr) return false; return true; };
  const put = fillHouses(S, r, pal, q ? 70 : 16, ok, { yaw, h: [7, 15], w: q ? [7, 11] : [9, 13], towers: 0.1 });
  if (q) for (let i = 0; i < 5; i++) { const h = put[(i * 7) % put.length]; puffOn(M, [h[0], GY + h[3] + 4, h[1]], 12, r(), 1 / r.range(5, 8), [r.range(-3, 3), r.range(-3, 3)]); blobBody(M, pal.white, 1.5); M.move(null); }
  if (c.x) {
    const x = c.x;
    for (let i = 0; i < 4; i++) { const a = x.range(0, TAU), d = Math.sqrt(x()) * (pond[2] - 3.5), px = pond[0] + Math.cos(a) * d, pz = pond[1] + Math.sin(a) * d, s = x.range(2, 3.2); rockOn(M, [px, GY + 1.6, pz], [1, 0], x(), x.range(0.9, 1.5), 0.12, 0.7, 0.2); M.set(i % 2 ? pal.ice : pal.turq, PAT.JELLY).dome(px, GY + 1.2, pz, s, s * 0.9, 7, 3); M.move(null); }
    for (const L of lines.slice(0, 3)) { const k = x.range(0.25, 0.45); loopOn(M, [L.n[0] * L.off, GY + 0.4, L.n[1] * L.off], [L.d[0] * L.half * k, L.d[1] * L.half * k], [L.n[0] * 1.7, L.n[1] * 1.7], x(), (x.chance(0.5) ? 1 : -1) / x.range(26, 40)); boatBody(M, pal, x.range(7, 9.5)); M.move(null); }
  }
}
// 2. the city whose great avenue elephants walk down under canopied boxes
function cityAvenue(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const yaw = r.range(0, Math.PI), d = [Math.cos(yaw), -Math.sin(yaw)], n = [Math.sin(yaw), Math.cos(yaw)], aw = 19, half = 64;
  S.set(pal.ice, PAT.PAVE).box(0, GY, 0, half * 2, 0.3, aw, { yaw });
  S.set(pal.white, PAT.PLAIN).box(0, GY + 0.3, 0, half * 1.7, 0.5, 1.4, { yaw });
  for (let i = 0, nE = q ? 6 : 3; i < nE; i++) { loopOn(M, [0, GY + 0.3, 0], [d[0] * 50, d[1] * 50], [n[0] * 5, n[1] * 5], (i + r.range(0, 0.5)) / nE, 1 / r.range(80, 96)); elephantBody(M, pal, r.range(2.3, 2.9) * (q ? 1.25 : 1), !q); M.move(null); }
  // the canopied boxes: stands on tall legs along both sides of the avenue, each under a cloth
  const step = q ? 15 : 30;
  for (const sg of [-1, 1]) for (let t = -half + 14; t <= half - 14; t += step) {
    const x = d[0] * t + n[0] * sg * (aw / 2 + 3), z = d[1] * t + n[1] * sg * (aw / 2 + 3), bw = r.range(4.2, 5.4);
    S.set(pal.white, PAT.PLAIN).box(x, GY, z, bw * 0.5, 9, bw * 0.5, { yaw }); S.set(pal.ultra, PAT.WALL).box(x, GY + 9, z, bw, 3, bw, { yaw });
    S.set(r.chance(0.5) ? pal.gold : pal.white, PAT.CLOTH).hip(x, GY + 14, z, bw * 1.5, bw * 1.5, 2.6, { yaw });
    if (q) for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.set(pal.gold, PAT.GOLD).box(x + (d[0] * ax + n[0] * az) * bw * 0.45, GY + 12, z + (d[1] * ax + n[1] * az) * bw * 0.45, 0.3, 2, 0.3, { top: false });
  }
  for (const sg of [-1, 1]) for (let t = -half + 16, k = 0; t <= half - 10; k++) {
    const w = r.range(13, 20), dd = r.range(11, 15), h = r.range(13, 24), x = d[0] * (t + w / 2) + n[0] * sg * (aw / 2 + 9 + dd / 2), z = d[1] * (t + w / 2) + n[1] * sg * (aw / 2 + 9 + dd / 2);
    if (Math.hypot(x, z) + Math.hypot(w, dd) / 2 < 70 && (q || k % 2 === 0)) house(S, r, pal, x, z, w, dd, h, yaw, { roof: r.pick([1, 2, 3]) });
    t += w + r.range(2, 5);
  }
  for (const sg of [-1, 1]) S.set(pal.white, PAT.WALL).box(d[0] * (half - 4) + n[0] * sg * (aw / 2 + 1), GY, d[1] * (half - 4) + n[1] * sg * (aw / 2 + 1), 5, 22, 5, { yaw });
  S.set(pal.white, PAT.PLAIN).box(d[0] * (half - 4), GY + 22, d[1] * (half - 4), 6, 5, aw + 8, { yaw, bot: true }); S.set(pal.gold, PAT.GOLD).box(d[0] * (half - 4), GY + 27, d[1] * (half - 4), 3, 2.5, aw * 0.5, { yaw });
  fillHouses(S, r, pal, q ? 40 : 8, (x, z, rr) => Math.abs(x * n[0] + z * n[1]) > aw / 2 + 25 + rr, { yaw, h: [7, 14], towers: 0.15 });
  if (c.x) for (let i = 0; i < 2; i++) { loopOn(M, [0, GY + 0.3, 0], [d[0] * 50, d[1] * 50], [n[0] * 5, n[1] * 5], c.x(), 1 / c.x.range(80, 96)); elephantBody(M, pal, c.x.range(1.7, 2.1) * 1.25, false); M.move(null); }
}
// 3. the city with the spiral minaret that is a slide (a plain spiral tower, no sign on it)
function cityMinaret(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const H = r.range(56, 66), rB = r.range(8, 9.5), rT = 3.4, turns = r.range(3.2, 4.2), sgn = r.chance(0.5) ? 1 : -1, nu = q ? 64 : 26, wS = 3.4;
  S.set(pal.ice, PAT.PAVE).lathe(0, GY + 0.25, 0, [[24, 0], [0, 0]], q ? 24 : 12, { cap: false });
  S.set(pal.cobalt, PAT.WALL).lathe(0, GY, 0, [[rB, 0], [rT, H]], q ? 14 : 8, { cap: false });
  S.set(pal.white, PAT.PLAIN).lathe(0, GY + H, 0, [[rT * 1.5, 0], [rT * 1.5, 1.5], [rT, 1.5], [rT * 0.9, 5], [0, 12]], q ? 12 : 6, {});
  S.set(pal.gold, PAT.GOLD).cone(0, GY + H + 11.5, 0, 0.5, 4, 4);
  const rad = (u) => lerp(rT + 0.6, rB + 3.5, u), fn = (u, v) => { const a = sgn * u * turns * TAU, rr = rad(u) + v * wS; return [rr * Math.cos(a), GY + H * (1 - u) * 0.96 + 1 + v * 0.9, rr * Math.sin(a)]; };
  S.set(pal.white, PAT.PLAIN).sheet(nu, 1, fn).sheet(nu, 1, fn, { flip: true });
  for (let i = 0, nF = q ? 12 : 5; i < nF; i++) { helixOn(M, [0, GY + 2, 0], H * 0.96, rad(0) + wS * 0.5, rad(1) + wS * 0.5, sgn * turns, (i + r.range(0, 0.6)) / nF, 1 / r.range(15, 19)); personBody(M, i % 2 ? pal.gold : pal.white, q ? 5 : 4.2); M.move(null); }
  const taken = [];
  for (let i = 0, nT = q ? 4 : 2; i < nT; i++) { const a = r.range(0, TAU) + i * TAU / nT, dd = r.range(34, 48); tower(S, r, pal, Math.cos(a) * dd, Math.sin(a) * dd, r.range(2.6, 3.4), r.range(22, 34), { round: true, head: 1, onion: 0.25 }); taken.push([Math.cos(a) * dd, Math.sin(a) * dd, 4.5, 0]); }
  fillHouses(S, r, pal, q ? 60 : 14, (x, z, rr) => Math.hypot(x, z) > 25 + rr, { taken, h: [6, 12], kinds: [3, 3, 2, 1], towers: 0.04, w: q ? [7, 11] : [9, 13] });
  if (c.x) for (let i = 0; i < 6; i++) { helixOn(M, [0, GY + 2, 0], H * 0.96, rad(0) + wS * 0.5, rad(1) + wS * 0.5, sgn * turns, c.x(), 1 / c.x.range(15, 19)); personBody(M, i % 2 ? pal.ice : pal.gold, 5); M.move(null); }
}
// 4. a city of bridges: islands in blue water, every island joined to its neighbours by arched bridges
function cityBridges(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16, sea: true });
  const isles = [[0, 0, r.range(13, 17)]];
  for (let i = 0, nI = q ? 8 : 5; i < 60 && isles.length < nI; i++) { const a = r.range(0, TAU), d = r.range(30, 54), rr = r.range(9, 14), x = Math.cos(a) * d, z = Math.sin(a) * d; if (isles.every((p) => Math.hypot(p[0] - x, p[1] - z) > p[2] + rr + 8)) isles.push([x, z, rr]); }
  for (const [x, z, rr] of isles) {
    S.set(pal.ice, PAT.PAVE).lathe(x, GY, z, [[rr + 1.5, 0], [rr, 2.6], [0, 2.6]], q ? 14 : 8, { cap: false });
    const nH = q ? r.int(3, 5) : 2, a0 = r.range(0, TAU);
    for (let k = 0; k < nH; k++) { const a = a0 + k * TAU / nH, d = rr * 0.5, w = r.range(5, 7.5); if (k === 0 && r.chance(0.7)) tower(S, r, pal, x + Math.cos(a) * d, z + Math.sin(a) * d, w * 0.42, r.range(20, 40), { y: GY + 2.6 }); else house(S, r, pal, x + Math.cos(a) * d, z + Math.sin(a) * d, w, w, r.range(6, 13), -a, { y: GY + 2.6 }); }
  }
  S.set(pal.gold, PAT.GOLD).lathe(0, GY + 2.6, 0, [[2.2, 0], [1.6, 9], [2.4, 10], [0, 14]], 8, { smooth: true });
  for (let i = 1; i < isles.length; i++) {
    let best = 0, bd = 1e9; for (let j = 0; j < i; j++) { const dd = Math.hypot(isles[i][0] - isles[j][0], isles[i][1] - isles[j][1]) - isles[j][2]; if (dd < bd) { bd = dd; best = j; } }
    const A = isles[i], B = isles[best], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
    S.set(pal.white, PAT.PLAIN); bridge(S, A[0] + ux * (A[2] - 1), A[1] + uz * (A[2] - 1), B[0] - ux * (B[2] - 1), B[1] - uz * (B[2] - 1), GY + 2.6, r.range(3.5, 6), 3.6, { n: q ? 6 : 3 });
  }
  for (let i = 0, nB = q ? 5 : 2; i < nB; i++) { const R = r.range(20, 26) + i * 1.5; loopOn(M, [0, GY + 0.4, 0], [R, 0], [0, R * r.range(0.85, 1)], r(), (i % 2 ? 1 : -1) / r.range(50, 80)); boatBody(M, pal, r.range(6, 9)); M.move(null); }
  if (c.x) for (let i = 0; i < 3; i++) { const R = c.x.range(58, 66); loopOn(M, [0, GY + 0.4, 0], [R, 0], [0, R], c.x(), (i % 2 ? 1 : -1) / c.x.range(70, 100)); boatBody(M, pal, c.x.range(6, 9)); M.move(null); }
}
// 5. a city on terraces round a harbour
function cityHarbour(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const bay = r.range(0, TAU), bx = Math.cos(bay), bz = Math.sin(bay), wc = [bx * 16, bz * 16], wr = 30, arc = TAU * 0.62, a0 = bay + Math.PI - arc / 2, tiers = q ? 4 : 3;
  S.set(pal.water, PAT.WATER).lathe(wc[0], GY + 0.3, wc[1], [[wr, 0], [0, 0]], q ? 22 : 12, { cap: false }).box(bx * 50, GY + 0.05, bz * 50, 40, 0.3, 30, { yaw: -bay });
  for (let i = 0; i < tiers; i++) {
    const r0 = 36 + i * 9, r1 = i === tiers - 1 ? 70 : r0 + 9.2, h = 4 + i * 4.5;
    S.set(pal.tw(i % 2 ? pal.cobalt : pal.ultra, 0.9), PAT.WALL).lathe(0, GY, 0, [[r0, 0], [r0, h]], q ? 22 : 12, { arc, a0, cap: false });
    S.set(pal.ice, PAT.PAVE).lathe(0, GY + h, 0, [[r1, 0], [r0, 0]], q ? 22 : 12, { arc, a0, cap: false });
    const nH = Math.round((q ? 0.5 : 0.22) * arc * r0 / 9);
    for (let k = 0; k < nH; k++) { const a = a0 + arc * (k + 0.5) / nH, rr = r0 + 5, w = r.range(5.5, 7.5); house(S, r, pal, Math.cos(a) * rr, Math.sin(a) * rr, w, 5.5, r.range(5, 9) + (k % 5 === 2 ? 5 : 0), -a + Math.PI / 2, { y: GY + h, roof: r.pick([0, 1, 1]) }); }
  }
  S.set(pal.white, PAT.PLAIN).box(wc[0] + bx * 24 - bz * 16, GY, wc[1] + bz * 24 + bx * 16, 26, 2, 3, { yaw: -bay });
  tower(S, r, pal, wc[0] + bx * 36 - bz * 16, wc[1] + bz * 36 + bx * 16, 2.4, 20, { round: true, head: 2, wall: pal.white, tip: false });
  S.set(pal.gold, PAT.LIGHT).lathe(wc[0] + bx * 36 - bz * 16, GY + 23, wc[1] + bz * 36 + bx * 16, [[1.3, 0], [1.6, 1.5], [0, 3]], 6, { smooth: true });
  for (let i = 0, nS = q ? 5 : 2; i < nS; i++) { const a = r.range(0, TAU), d = r.range(6, wr - 9); shipAt(M, r, pal, wc[0] + Math.cos(a) * d, wc[1] + Math.sin(a) * d, r.range(11, 16), r.range(0, TAU)); }
  for (let i = 0, nB = q ? 2 : 1; i < nB; i++) { loopOn(M, [wc[0] + bx * 20, GY + 0.5, wc[1] + bz * 20], [bx * 30, bz * 30], [-bz * 5, bx * 5], r(), 1 / r.range(50, 70)); boatBody(M, pal, 7); M.move(null); }
  if (c.x) for (let i = 0; i < 3; i++) { loopOn(M, [wc[0] + bx * 20, GY + 0.5, wc[1] + bz * 20], [bx * 30, bz * 30], [-bz * (2 + i), bx * (2 + i)], c.x(), -1 / c.x.range(40, 60)); boatBody(M, pal, c.x.range(5, 7)); M.move(null); }
}
// 6. a city of towers joined by arches
function cityTowers(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const tw = [];
  for (let i = 0, nT = q ? 17 : 8; i < 200 && tw.length < nT; i++) { const a = r.range(0, TAU), d = Math.sqrt(r()) * 56, x = Math.cos(a) * d, z = Math.sin(a) * d, rad = r.range(3, 5.2), hMax = Math.sqrt(76 * 76 - (d + rad) * (d + rad)) - GY - 16, h = Math.min(hMax, r.range(30, 72)); if (tw.every((p) => Math.hypot(p[0] - x, p[1] - z) > 15)) tw.push([x, z, rad + 1, h, rad]); }
  for (const [x, z, , h, rad] of tw) tower(S, r, pal, x, z, rad, h, { n: q ? 10 : 6, taper: r.range(0.7, 0.9) });
  S.set(pal.white, PAT.PLAIN);
  for (let i = 1; i < tw.length; i++) {
    let best = -1, bd = 34; for (let j = 0; j < i; j++) { const dd = Math.hypot(tw[i][0] - tw[j][0], tw[i][1] - tw[j][1]); if (dd < bd) { bd = dd; best = j; } }
    if (best < 0) continue;
    const A = tw[i], B = tw[best], y = GY + Math.min(A[3], B[3]) * r.range(0.5, 0.8); bridge(S, A[0], A[1], B[0], B[1], y, r.range(2, 4), 2.6, { n: q ? 6 : 3, th: 1.6 });
  }
  // banners on the towers' heads, each flying toward the globe's axis (so none reaches the crystal)
  if (q) for (let i = 0; i < 6; i++) { const t = tw[i % tw.length], dl = Math.hypot(t[0], t[1]), dx = dl > 1 ? -t[0] / dl : 1, dz = dl > 1 ? -t[1] / dl : 0, fn = (u, v) => [t[0] + dx * (0.3 + u * 7), GY + t[3] + t[4] * 2.6 + 3 - v * 2.6 * (1 - u * 0.6), t[1] + dz * (0.3 + u * 7)]; waveOn(M, r(), r.range(2.5, 4), 0.9, 5); M.set(i % 2 ? pal.gold : pal.white, PAT.CLOTH).sheet(4, 1, fn).sheet(4, 1, fn, { flip: true }); M.move(null); S.set(pal.navy, PAT.PLAIN).box(t[0], GY + t[3] + t[4] * 2.6, t[1], 0.3, 3.4, 0.3); }
  fillHouses(S, r, pal, q ? 36 : 8, () => true, { taken: tw, h: [5, 10], w: [6, 10], towers: 0 });
}
// 7. a city as a ring round a garden
function cityRing(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const Rg = r.range(36, 42), nH = q ? 26 : 12, gates = r.int(3, 4), g0 = r.range(0, TAU), green = pal.gold$ ? pal.turq : mixc(pal.turq, lin('#58e0b0'), 0.5);
  S.set(green, PAT.GREEN).lathe(0, GY + 0.3, 0, [[Rg - 5, 0], [0, 0]], q ? 24 : 12, { cap: false });
  for (let i = 0; i < nH; i++) {
    const a = g0 + TAU * i / nH, gate = i % Math.round(nH / gates) === 0, w = TAU * Rg / nH * (gate ? 0.5 : 1.02), h = gate ? r.range(20, 26) : r.range(9, 14);
    if (gate) tower(S, r, pal, Math.cos(a) * Rg, Math.sin(a) * Rg, 3.6, h, { round: false, yaw: -a, head: 0, wall: pal.white }); else house(S, r, pal, Math.cos(a) * Rg, Math.sin(a) * Rg, w, 8, h, -a + Math.PI / 2, { roof: 1 });
  }
  for (let i = 0, nT = q ? 30 : 9; i < nT; i++) { const a = r.range(0, TAU), d = 7 + Math.sqrt(r()) * (Rg - 16), s = r.range(1.8, 3.2), x = Math.cos(a) * d, z = Math.sin(a) * d; S.set(pal.navy, PAT.PLAIN).cyl(x, GY + 0.3, z, s * 0.18, s * 0.14, s * 1.2, 4, { cap: false }); S.set(pal.tw(r.chance(0.3) ? pal.white : green, r.range(0.7, 1.1)), PAT.GREEN); if (r.chance(0.5)) S.cone(x, GY + 0.3 + s * 1.1, z, s, s * 2.6, 6); else S.lathe(x, GY + 0.3 + s * 2, z, [[0, -s], [s, 0], [0, s * 1.1]], 6, { smooth: true }); }
  S.set(pal.white, PAT.PLAIN).lathe(0, GY + 0.3, 0, [[5, 0], [5, 1.2], [4.2, 1.2], [4.2, 0.6], [1, 0.6], [0.7, 4], [1.6, 4.4], [0, 5]], q ? 12 : 6, {});
  for (let i = 0, nP = q ? 9 : 3; i < nP; i++) { const a = TAU * i / nP; puffOn(M, [0, GY + 5, 0], 5.5, r(), 1 / r.range(1.6, 2.4), [Math.cos(a) * 3.4, Math.sin(a) * 3.4]); blobBody(M, pal.white, 0.6); M.move(null); }
  // (p1m1, R11) the ring's own life, where the world hands the city a stream: six strollers go round the walk
  // between the garden's edge and the houses' doors, all one way at one pace (a sixth of the round apart, so none
  // meets another), on the world's clock from the stream's own phase
  if (c.x) { const ph = c.x(), T = c.x.range(110, 150), dir = c.x.chance(0.5) ? 1 : -1; for (let i = 0; i < 6; i++) { loopOn(M, [0, GY + 0.3, 0], [Rg - 4.9, 0], [0, Rg - 4.9], (ph + i / 6) % 1, dir / T); personBody(M, i % 2 ? pal.gold : pal.white, 2.6); M.move(null); } }
  fillHouses(S, r, pal, q ? 44 : 9, () => true, { R0: Rg + 13, R: 67, h: [6, 12], w: [6, 10], towers: 0.12 });
}
// 8. a city of stairs: terraces stepped one on another, a white flight up every side, a gold-domed house on the top
function cityStairs(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const L = q ? 7 : 5, yaw = r.range(0, Math.PI / 2), W0 = 92, dW = (W0 - 16) / L, hL = 46 / L, d = [[Math.cos(yaw), -Math.sin(yaw)], [Math.sin(yaw), Math.cos(yaw)]];
  for (let i = 0; i < L; i++) {
    const w = W0 - i * dW, y = GY + i * hL;
    S.set(pal.tw([pal.ultra, pal.cobalt, pal.turq][i % 3], 0.95), PAT.WALL).box(0, y, 0, w, hL, w, { yaw, top: false, u0: i * 7 }); S.set(pal.ice, PAT.PAVE).box(0, y + hL - 0.01, 0, w, 0.01, w, { yaw, skip: [0, 1, 2, 3] });
    for (let k = 0; k < 4; k++) { const dir = d[k % 2], sg = k < 2 ? 1 : -1, steps = q ? 3 : 1; for (let s2 = 0; s2 < steps; s2++) { const out = w / 2 + dW / 2 * (1 - (s2 + 0.5) / steps); S.set(pal.white, PAT.PLAIN).box(dir[0] * sg * out, y, dir[1] * sg * out, k % 2 ? 7 : dW / 2 / steps, hL * (s2 + 1) / steps, k % 2 ? dW / 2 / steps : 7, { yaw }); } }
    if (q && i < L - 1) for (let k = 0; k < 4; k++) for (const t of [-0.3, 0.3]) { const dir = d[k % 2], sd = d[(k + 1) % 2], sg = k < 2 ? 1 : -1, off = (w - dW * 0.5) / 2 + 0.2, hh = r.range(3, 5.5); house(S, r, pal, dir[0] * sg * off + sd[0] * t * w, dir[1] * sg * off + sd[1] * t * w, 4.6, 4.2, hh, yaw, { y: y + hL, roof: r.pick([0, 1, 3]) }); }
  }
  const yT = GY + L * hL; S.set(pal.white, PAT.WALL).box(0, yT, 0, 9, 6, 9, { yaw }); S.set(pal.gold, PAT.GOLD).dome(0, yT + 6, 0, 4.2, 4.6, 10, 4);
  for (let i = 0, nW = q ? 8 : 3; i < nW; i++) { const k = i % 4, dir = d[k % 2], sd = d[(k + 1) % 2], sg = k < 2 ? 1 : -1, lev = r.int(0, L - 2), w = W0 - lev * dW, off = (w - dW * 0.5) / 2; loopOn(M, [dir[0] * sg * off, GY + (lev + 1) * hL, dir[1] * sg * off], [sd[0] * w * 0.3, sd[1] * w * 0.3], [dir[0] * 0.8, dir[1] * 0.8], r(), 1 / r.range(40, 70)); personBody(M, i % 2 ? pal.gold : pal.white, q ? 2.6 : 3.6); M.move(null); }
  if (c.x) for (let i = 0; i < 6; i++) { const k = i % 4, dir = d[k % 2], sd = d[(k + 1) % 2], sg = k < 2 ? 1 : -1, lev = c.x.int(0, L - 2), w = W0 - lev * dW, off = (w - dW * 0.5) / 2; loopOn(M, [dir[0] * sg * off, GY + (lev + 1) * hL, dir[1] * sg * off], [sd[0] * w * 0.3, sd[1] * w * 0.3], [dir[0] * 0.8, dir[1] * 0.8], c.x(), -1 / c.x.range(40, 70)); personBody(M, i % 2 ? pal.ice : pal.gold, 2.6); M.move(null); }
}
// 9. a city under sails: tall masts with great sails spread over a low town
function citySails(c) {
  const { S, M, r, pal, q } = c; cityBase(S, pal, { n: q ? 28 : 16 });
  const masts = [], wind = r.range(0, TAU);
  for (let i = 0, nM = q ? 9 : 5; i < 100 && masts.length < nM; i++) { const a = r.range(0, TAU), d = Math.sqrt(r()) * 46, x = Math.cos(a) * d, z = Math.sin(a) * d; if (masts.every((p) => Math.hypot(p[0] - x, p[1] - z) > 22)) masts.push([x, z, 2.5, r.range(34, 52) * (1 - d / 150)]); }
  for (const [x, z, , h] of masts) {
    S.set(pal.navy, PAT.PLAIN).cyl(x, GY, z, 1.1, 0.5, h, 6, {}); S.set(pal.gold, PAT.GOLD).cone(x, GY + h, z, 0.9, 3, 5);
    const a = wind + r.range(-0.5, 0.5), ca = Math.cos(a), sa = Math.sin(a), reach = r.range(15, 21), col = r.pick([pal.white, pal.ice, pal.turq, pal.white]), ph = r(), sp = r.range(1.2, 2);
    for (const sg of [1, -1]) {
      const fn = (u, v) => { const yy = lerp(GY + h * 0.96, GY + h * 0.22, v), sp2 = reach * u * (0.35 + 0.65 * v), belly = Math.sin(Math.PI * v) * u * 3; return [x + sg * (ca * sp2 - sa * belly), yy - u * v * h * 0.12, z + sg * (sa * sp2 + ca * belly)]; };
      waveOn(M, ph, sp, 0.8, 4); M.set(col, PAT.CLOTH).sheet(q ? 5 : 3, q ? 5 : 3, fn).sheet(q ? 5 : 3, q ? 5 : 3, fn, { flip: true }); M.move(null);
    }
  }
  fillHouses(S, r, pal, q ? 60 : 14, () => true, { taken: masts, h: [5, 9], w: q ? [6, 10] : [9, 12], towers: 0.05, kinds: [0, 1, 2, 2] });
  if (q) for (let i = 0; i < 5; i++) { const m = masts[i % masts.length]; loopOn(M, [m[0], GY + 0.2, m[1]], [7, 0], [0, 7], r(), 1 / r.range(30, 50)); personBody(M, pal.white, 2.6); M.move(null); }
  if (c.x) for (let i = 0; i < 6; i++) { const m = masts[i % masts.length]; loopOn(M, [m[0], GY + 0.2, m[1]], [9.5, 0], [0, 9.5], c.x(), -1 / c.x.range(30, 50)); personBody(M, pal.gold, 2.6); M.move(null); }
}
export function tinyCity(S, r, pal) {
  const prof = []; for (const d of [-90, -55, -21]) { const a = d * Math.PI / 180; prof.push([78 * Math.cos(a), 78 * Math.sin(a)]); }
  S.set(pal.navy, PAT.PLAIN).lathe(0, 0, 0, prof, 8, { smooth: true, cap: false }); S.set(pal.ground, PAT.PLAIN).disc(0, GY, 0, 72.8, 8);
  const a0 = r.range(0, TAU), n = r.int(4, 6), tall = r.int(0, n - 1);
  for (let i = 0; i < n; i++) {
    const a = a0 + TAU * i / n + r.range(-0.3, 0.3), d = i === tall ? r.range(0, 14) : r.range(22, 46), w = r.range(13, 22), h = i === tall ? r.range(52, 78) : r.range(16, 40), x = Math.cos(a) * d, z = Math.sin(a) * d, wc = pal.wall(r), rc = pal.roof(r), kind = r.int(0, 2);
    S.set(wc, PAT.WALL).box(x, GY, z, i === tall ? w * 0.6 : w, h, i === tall ? w * 0.6 : w, { yaw: a, top: false });
    if (kind === 0 || i === tall) S.set(i === tall ? pal.gold : rc, i === tall ? PAT.GOLD : PAT.PLAIN).hip(x, GY + h, z, w * (i === tall ? 0.7 : 1.1), w * (i === tall ? 0.7 : 1.1), i === tall ? w * 1.1 : w * 0.5, { yaw: a });
    else S.set(rc, PAT.PLAIN).dome(x, GY + h, z, w * 0.5, w * 0.55, 6, 2);
  }
}
export const CITY_KINDS = ['canal', 'avenue', 'minaret', 'bridges', 'harbour', 'towers', 'ring', 'stairs', 'sails'];
const CITY_FN = { canal: cityCanal, avenue: cityAvenue, minaret: cityMinaret, bridges: cityBridges, harbour: cityHarbour, towers: cityTowers, ring: cityRing, stairs: cityStairs, sails: citySails };
// one small city of a kind into S and M under their frame; o: { q, gold, more }
// (polish round 1) more: a stream of the city's own, made by the world from its seed and a name. Where it is handed
// in, the city's life is a little stronger: more jellyfish and boats, two more elephants, more sliders, more
// walkers, each on the world's clock from a phase drawn from that stream (the city's first stream deals as before).
// every kind is drawn out upward by its own measure, so that it fills its globe (each stays inside the crystal)
const STRETCH = { canal: 1.6, avenue: 1.6, minaret: 1.18, bridges: 1.4, harbour: 1.45, towers: 1.04, ring: 1.7, stairs: 1.45, sails: 1.5 };
export function buildCity(kind, S, M, rng, o = {}) {
  const pal = cityPalette(rng, !!o.gold), st = STRETCH[kind] || 1;
  S.stretch(st, GY); M.stretch(st, GY);
  CITY_FN[kind]({ S, M, r: rng, pal, q: o.q ? 1 : 0, x: o.more || null });
  M.move(null); S.stretch(); M.stretch();
  return pal;
}

// ---------------------------------------------------------------- the city of the great globe, and the way through it
// In the globe's own frame (its middle the origin, the avenue along +x). The way in: a straight dive through the MIDDLE
// of the crown's ring (INSIDE.dive below the level, begun INSIDE.lead metres before the ring), on down among the
// towers, a pull-out on one vertical arc (radius INSIDE.pull) that ends where the turn begins, one turn of radius
// INSIDE.turn round the harbour basin (centre INSIDE.c) at one gentle slope that eases level over its last INSIDE.ease
// metres, then straight and level along the avenue from its start (the bridge over the canal, x = INSIDE.join) to the
// ring in the square's arch. The level eye is 15.2 m over the ground: the plinth's small globe lies 6 m under it.
export const INSIDE = { join: -42, turn: 24, c: [-42, -24], eye: GY + 15.2, end: 40, lane: 6, dive: 70 * Math.PI / 180, lead: 20, pull: 26, ease: 36, ringY: Math.sqrt(GLOBE.R * GLOBE.R - GLOBE.crown * GLOBE.crown) };
// The way's geometry by its plan metres p (0 on the globe's axis): the dive's straight touches the turn's circle (so
// the heading has no kink); the one unknown, the turn's slope, is found so that the heights meet.
const WAY = (() => {
  const I = INSIDE, d = Math.hypot(I.c[0], I.c[1]), t = Math.sqrt(d * d - I.turn * I.turn), ang = Math.atan2(I.c[1], I.c[0]) + Math.asin(I.turn / d);
  const T = [t * Math.cos(ang), t * Math.sin(ang)], a0 = Math.atan2(-(T[1] - I.c[1]), T[0] - I.c[0]), a1 = 1.5 * Math.PI, arc = I.turn * (a1 - a0);
  const gd = Math.tan(I.dive), sd = Math.sin(I.dive), cd = Math.cos(I.dive), need = I.ringY - I.eye;
  const drop = (th) => gd * (t - I.pull * (sd - Math.sin(th))) + I.pull * (Math.cos(th) - cd) + Math.tan(th) * (arc - I.ease / 2);
  let lo = 0, hi = I.dive; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (drop(m) < need) lo = m; else hi = m; }
  const th2 = (lo + hi) / 2, g2 = Math.tan(th2), pA = t - I.pull * (sd - Math.sin(th2)), yA = I.ringY - gd * pA, yT = yA - I.pull * (Math.cos(th2) - cd), pE = t + arc, pC = pE - I.ease;
  // the height and the slope (metres down for a metre of plan) at plan metre p
  const at = (p) => {
    if (p <= pA) return [I.ringY - gd * p, gd];
    if (p <= t) { const sn = clamp(sd - (p - pA) / I.pull, -1, 1), cs = Math.sqrt(1 - sn * sn); return [yA - I.pull * (cs - cd), sn / Math.max(cs, 1e-6)]; }
    if (p <= pC) return [yT - g2 * (p - t), g2];
    const q = clamp((p - pC) / I.ease, 0, 1); return [I.eye + g2 * I.ease * 0.5 * (1 - q) * (1 - q), g2 * (1 - q)];
  };
  const plan = (p) => { if (p <= t) return [T[0] / t * p, T[1] / t * p]; const a = a0 + (p - t) / I.turn; return [I.c[0] + I.turn * Math.cos(a), I.c[1] - I.turn * Math.sin(a)]; };
  return { e: [T[0] / t, T[1] / t], T, t, a0, a1, arc, th2, pA, pE, at, plan, p0: -I.lead * cd };
})();
// the way's first heading in plan, the dive's slope, the plan metres the dive begins before the axis, its height there,
// the plan metres from the axis to the turn's start, and the turn's own slope
export const INSIDE_E = [WAY.e[0], WAY.e[1], Math.tan(INSIDE.dive), -WAY.p0, WAY.at(WAY.p0)[0], WAY.t, Math.tan(WAY.th2)];
// the way's points about every `step` metres of its own length, from the dive's first point to the ring; each [x, y, z]
export function insideWay(step = 4) {
  const I = INSIDE, W = WAY, pts = [];
  for (let p = W.p0; p < W.pE - 1e-6;) { const [y, g] = W.at(p), q = W.plan(p); pts.push([q[0], y, q[1]]); p += step / Math.hypot(1, g); }
  for (let x = I.join; x <= I.end + 1e-6; x += step) pts.push([x, I.eye, 0]);
  if (pts[pts.length - 1][0] < I.end - 1e-3) pts.push([I.end, I.eye, 0]);
  return pts;
}
// true where a thing of this reach (plan radius) and top stands in the way's lane
function inLane(way, x, z, reach, top, lane = INSIDE.lane) { for (const p of way) { if (p[1] < top + lane && Math.hypot(p[0] - x, p[2] - z) < reach + lane) return true; } return false; }
// a tower finely made: three stages that step in, a white cornice on each, a gold band, a lit lantern, a head (spire,
// dome or bulb) and a gilded cap. Every draw is the caller's: nothing here draws.
export function fineTower(S, pal, x, z, rad, h, o = {}) {
  const y = o.y ?? GY, n = o.n || 10, round = o.round !== false, head = o.head ?? 0, wc = o.wall || pal.cobalt, rc = o.roofCol || pal.white, yaw = o.yaw || 0;
  const st = [[1, 0.56], [0.78, 0.29], [0.56, 0.15]]; let yy = y, rr = rad;
  for (let i = 0; i < 3; i++) {
    const hh = h * st[i][1]; rr = rad * st[i][0];
    S.set(i === 2 ? pal.white : wc, i === 2 ? PAT.PLAIN : PAT.WALL);
    if (round) S.cyl(x, yy, z, rr, rr * 0.94, hh, n, { cap: false }); else S.box(x, yy, z, rr * 1.8, hh, rr * 1.8, { yaw, tx: 0.94, tz: 0.94, top: false });
    if (i === 2) { S.set(pal.gold, PAT.LIGHT); if (round) S.cyl(x, yy + hh * 0.25, z, rr * 0.96, rr * 0.95, hh * 0.5, n, { cap: false }); else S.box(x, yy + hh * 0.25, z, rr * 1.76, hh * 0.5, rr * 1.76, { yaw, top: false }); }
    yy += hh;
    S.set(i === 1 ? pal.gold : pal.white, i === 1 ? PAT.GOLD : PAT.PLAIN);
    if (round) S.lathe(x, yy - 0.5, z, [[rr * 0.94, 0], [rr * 1.16, 0.5], [rr * 1.16, 1], [rr * 0.7, 1]], n, { cap: false }); else S.box(x, yy - 0.2, z, rr * 2.1, 0.9, rr * 2.1, { yaw, bot: true });
  }
  yy += 0.5; S.set(rc, PAT.TILE);
  let top = yy;
  if (head === 0) { S.cone(x, yy, z, rr * 1.12, rad * 3.1, round ? n : 4, { a0: round ? 0 : Math.PI / 4 - yaw }); top = yy + rad * 3.1; }
  else if (head === 1) { S.set(rc, PAT.PLAIN).dome(x, yy, z, rr * 1.05, rr * 1.2, n, 4, { onion: o.onion || 0 }); top = yy + rr * 1.2 * (1 + (o.onion || 0) * 0.5); }
  else { S.set(rc, PAT.PLAIN).dome(x, yy, z, rr * 1.0, rr * 0.7, n, 3); top = yy + rr * 0.7; }
  S.set(pal.gold, PAT.GOLD).lathe(x, top - 0.3, z, [[rad * 0.1, 0], [rad * 0.22, rad * 0.25], [rad * 0.06, rad * 0.5], [0, rad * 1.1]], 5, { smooth: true });
  return top + rad * 1.1;
}
// how high a fine tower stands over its foot (the same sum as fineTower's), for tests made before it is built
const fineTop = (rad, h, head, onion = 0) => h + 0.5 + (head === 0 ? rad * 3.1 : head === 1 ? rad * 0.56 * 1.2 * (1 + onion * 0.5) : rad * 0.56 * 0.7) + rad * 1.1;
export async function grandCity(S, M, rng, o = {}) {
  const r = rng, pal = cityPalette(r, false), I = INSIDE, den = o.density ?? 1, way = insideWay(2), blocks = [], C = COLORS;
  const keep = (x, z, reach, top, occ) => { if (inLane(way, x, z, reach, top)) return false; blocks.push([x, z, reach, top, occ ?? reach]); return true; };
  // the least distance from the way to an upright thing (plan reach, top)
  const gapWay = (x, z, reach, top) => { let b = 1e9; for (const p of way) { const d = Math.hypot(Math.max(0, Math.hypot(p[0] - x, p[2] - z) - reach), Math.max(0, p[1] - top)); if (d < b) b = d; } return b; };
  const base = []; for (let d = -90; d <= -21; d += 11.5) { const a = d * Math.PI / 180; base.push([78 * Math.cos(a), 78 * Math.sin(a)]); }
  S.set(pal.navy, PAT.PLAIN).lathe(0, 0, 0, base, 48, { smooth: true, cap: false });
  // the great city is paved in pale blue stone (the small cities' ground is the deep blue): its squares and quays
  // take the dome's light
  S.set(mixc(pal.ground, pal.ice, 0.55), PAT.FLAG).disc(0, GY, 0, RIM, 48);
  const bc = I.c, br = r.range(14.5, 16), W = 14, canX = I.join;
  // THE CITY'S FORM: AN AMPHITHEATRE ROUND ITS HARBOUR. The basin, its quays and the square are open ground by their
  // own outlines: no lot is dealt in them. Round the harbour the city rises as a bowl, the same on every bearing:
  // nothing built (tower, domed hall, palace, house) stands higher over the quay than its own middle stands back
  // from the quay's outer edge, metre for metre (BOWL = 1), measured in plan from the harbour light. So what stands
  // nearest the water is lowest and the tallest towers stand furthest from it; a lot where its building could not
  // keep its least body under the bowl (a tower 12 m, a palace 9 m, a house 4.5 m) is no lot. The rule reads the
  // harbour's own outline and nothing else. The light itself, in the bowl's middle, stands some 20 m.
  const BOWL = 1, quayR = br + 3.4, quayY = GY + 0.9, bowlTop = (x, z) => quayY + BOWL * Math.max(0, Math.hypot(x - bc[0], z - bc[1]) - quayR);
  const bowl = { towers: 0, lower: 0, lane: 0, noLot: 0, halls: 0, hallNoLot: 0, hallLane: 0, palaces: 0, palaceLower: 0, palaceNoLot: 0, houseLower: 0, houseNoLot: 0 };
  // WATER, all of it inside the ground's rim: the harbour basin inside the turn; a river from it along the rim's side to
  // a round pool that ends 3 m inside the rim; a canal from it under the avenue's first bridge to a pool beyond
  const rivA = r.range(-1.25, -0.85), rd = [Math.cos(rivA), Math.sin(rivA)], rp = 5;
  const bq = bc[0] * rd[0] + bc[1] * rd[1], sP = -bq + Math.sqrt(Math.max(0, bq * bq - (bc[0] * bc[0] + bc[1] * bc[1]) + (RIM - 3 - rp) ** 2)), Lw = sP - br + 1, sM = br - 1 + Lw / 2;
  S.set(pal.water, PAT.WATER).disc(bc[0], GY + 0.25, bc[1], br, 36);
  S.box(bc[0] + rd[0] * sM, GY + 0.05, bc[1] + rd[1] * sM, Lw, 0.2, 6.5, { yaw: -rivA }).disc(bc[0] + rd[0] * sP, GY + 0.25, bc[1] + rd[1] * sP, rp, 16);
  const cz0 = bc[1] + br - 1, cz1 = 15, pool = [canX, cz1 + 5, 5.5];
  S.box(canX, GY + 0.05, (cz0 + cz1) / 2, 6, 0.2, cz1 - cz0, {}).disc(pool[0], GY + 0.25, pool[1], pool[2], 16);
  // quays: a walk of pale stone round the basin and the pools, a kerb down the canal and the river, bollards, lamps
  S.set(mulc(mixc(pal.white, pal.ice, 0.5), 0.84), PAT.STONE).lathe(bc[0], GY, bc[1], [[br + 3.4, 0], [br + 3.4, 0.9], [br, 0.9], [br, 0.2]], 36, { cap: false });
  for (const q of [[bc[0] + rd[0] * sP, bc[1] + rd[1] * sP, rp], pool]) S.lathe(q[0], GY, q[1], [[q[2] + 1.6, 0], [q[2] + 1.6, 0.8], [q[2], 0.8], [q[2], 0.2]], 16, { cap: false });
  for (const sg of [-1, 1]) { S.box(canX + sg * 3.6, GY, (cz0 + cz1) / 2, 1, 0.8, cz1 - cz0, {}); S.box(bc[0] + rd[0] * sM - sg * rd[1] * 3.8, GY, bc[1] + rd[1] * sM + sg * rd[0] * 3.8, Lw, 0.8, 1, { yaw: -rivA }); }
  const lampsAt = [];
  for (let k = 0; k < 12; k++) { const a = TAU * k / 12 + 0.26, x = bc[0] + Math.cos(a) * (br + 2.4), z = bc[1] + Math.sin(a) * (br + 2.4); if (k % 2) { lampInto(S, x, GY + 0.9, z, 4.4, { k: 0.5 }); lampsAt.push([x, GY + 6.4, z]); } else S.set(pal.navy, PAT.PLAIN).cyl(x, GY + 0.9, z, 0.45, 0.35, 1, 6, {}); }
  // the light on its rock in the basin's middle: a slender white tower some 20 m high, a gold lantern
  S.set(pal.white, PAT.STONE).lathe(bc[0], GY, bc[1], [[3.2, 0], [2.6, 1.6], [0, 1.6]], 10, { cap: false });
  const lightTop = fineTower(S, pal, bc[0], bc[1], 1.7, 16, { y: GY + 1.6, head: 2, wall: pal.white, roofCol: pal.gold, n: 8 }); blocks.push([bc[0], bc[1], 3.2, lightTop]);
  // bridges over the river (the dive and the turn pass over them), each with four lamps
  for (const d of [br + 7, br + 17]) { if (d > sP - rp - 3) continue; const px = bc[0] + rd[0] * d, pz = bc[1] + rd[1] * d; S.set(pal.white, PAT.STONE); bridge(S, px + rd[1] * 6.5, pz - rd[0] * 6.5, px - rd[1] * 6.5, pz + rd[0] * 6.5, GY + 0.8, 2.4, 4, { n: 6, th: 1.2 }); S.set(pal.gold, PAT.LIGHT); for (const sg of [-1, 1]) for (const tt of [-1, 1]) S.box(px + sg * rd[1] * 6.5 + tt * rd[0] * 1.9, GY + 1, pz - sg * rd[0] * 6.5 + tt * rd[1] * 1.9, 0.5, 3, 0.5, {}); }
  if (o.yield) await o.yield();
  return grandAvenue(S, M, r, pal, { den, way, blocks, keep, gapWay, bc, br, rd, canX, W, lampsAt, sP, rp, Lw, sM, rivA, pool, cz0, cz1, lightTop, bowlTop, bowl, yld: o.yield, more: o.more });
}
async function grandAvenue(S, M, r, pal, G) {
  const { keep, gapWay, blocks, canX, W, lampsAt } = G, I = INSIDE, C = COLORS;
  // the avenue: a pale pavement with kerbs from the far end to the square, a bridge over the canal at its start (white
  // parapets), lamp standards and banners down both sides, each 6.2 m and more from the way by true distance
  const aveC = mulc(pal.ice, 0.86);
  S.set(aveC, PAT.FLAG).box(-31, GY + 0.3, 0, 62, 0.25, W, {});
  S.set(pal.white, PAT.STONE); for (const sg of [-1, 1]) { S.box(-31, GY + 0.3, sg * (W / 2 + 0.4), 62, 0.6, 0.8, {}); S.box(canX, GY + 0.55, sg * (W / 2 - 0.4), 11, 1.5, 0.7, {}); }
  for (let x = -60, k = 0; x <= 0; x += 6, k++) for (const sg of [-1, 1]) {
    const bph = r(), bsp = r.range(1.6, 2.6);
    if (Math.abs(x - canX) < 6) continue;
    if (k % 2 === 0) { if (gapWay(x, sg * 6.6, 0.7, GY + 9) < 6.2) continue; lampInto(S, x, GY + 0.5, sg * 6.6, 6.6, { k: 0.55, color: k % 4 ? C.gold : C.white }); lampsAt.push([x, GY + 8.2, sg * 6.6]); poolOn(S, aveC, mixc(pal.white, pal.gold, k % 4 ? 0.5 : 0.1), x, GY + 0.58, sg * 6.6, 4.4, sg > 0 ? Math.PI : 0, (px, pz) => [px + 62, W / 2 - pz]); blocks.push([x, sg * 6.6, 0.7, GY + 9]); }
    else {
      if (gapWay(x, sg * 7, 1.2, GY + 11) < 6.2) continue;
      S.set(pal.navy, PAT.PLAIN).box(x, GY + 0.5, sg * 7.2, 0.3, 10.5, 0.3, {}); S.set(pal.gold, PAT.GOLD).box(x, GY + 10.6, sg * 6.5, 0.2, 0.2, 1.7, {}); blocks.push([x, sg * 7, 1.2, GY + 11]);
      waveOn(M, bph, bsp, 0.35, 5); const fn = (u, v) => [x + (v - 0.5) * 0.02, GY + 10.5 - u * 4.4, sg * (6.0 + v * 1.4) - sg * 0.2];
      // the cloth: a blue head over a field of gold or white
      const hd = (u, v) => fn(u * 0.3, v), fl = (u, v) => fn(0.3 + u * 0.7, v);
      M.set(pal.ultra, PAT.CLOTH).sheet(2, 2, hd).sheet(2, 2, hd, { flip: true });
      M.set(k % 4 === 1 ? pal.gold : pal.white, PAT.CLOTH).sheet(3, 2, fl).sheet(3, 2, fl, { flip: true }); M.move(null);
    }
  }
  // palaces along the avenue: tall fronts with cornices and tiled roofs behind one arcade of round arches a side
  for (const sg of [-1, 1]) {
    for (let x = -62; x < 0;) {
      const w = r.range(9, 14), d = r.range(8.5, 11), h = r.range(12, 18), cx = x + w / 2, cz = sg * (W / 2 + 2.6 + d / 2), wc = pal.wall(r), rc = pal.roof(r), roof = r.pick([1, 2, 2, 3]), u0 = r.range(0, 40);
      x += w + r.range(0.6, 2.2);
      if (Math.abs(cx - canX) < w / 2 + 4.6 || Math.hypot(cx, cz) + Math.hypot(w, d) / 2 > 70) continue;
      // under the bowl by its roof's top (4.5 m over its walls at the most); a palace keeps 9 m of body or has no lot
      const hB = Math.min(h, G.bowlTop(cx, cz) - GY - 4.5);
      if (hB < 9) { G.bowl.palaceNoLot++; continue; }
      if (!keep(cx, cz, Math.min(w, d) / 2, GY + hB, Math.max(w, d) / 2 + 0.5)) continue;
      G.bowl.palaces++; if (hB < h) G.bowl.palaceLower++;
      house(S, r, pal, cx, cz, w, d, hB, 0, { wall: wc, roofCol: rc, roof, u0, fine: true });
      if (roof === 2) S.set(rc, PAT.TILE).hip(cx, GY + hB, cz, w * 0.42, d * 0.42, 1.5, {});
      // its share of the arcade: a wall of arches on the pavement's edge, a flat roof back to the front
      const na = Math.max(2, Math.round(w / 3.3)), ops = []; for (let k = 0; k < na; k++) ops.push({ c: cx - w / 2 + (k + 0.5) * w / na, w: w / na - 0.9, s: 2.6, arch: 1 });
      S.set(pal.white, PAT.PLAIN).wall(cx - w / 2, cx + w / 2, GY + 0.5, 5, sg * (W / 2 + 1), 0.7, ops, { k: 4 });
      S.box(cx, GY + 5.5, sg * (W / 2 + 1.9), w, 0.3, 2.4, { bot: true });
    }
  }
  if (G.yld) await G.yld();
  // the square: pale paving, the plinth for the small globe, two fountains, great halls on its sides
  S.set(mixc(pal.white, pal.ice, 0.55), PAT.FLAG).box(22, GY + 0.3, 0, 46, 0.3, 38, {});
  // its border: a band of darker stone a step proud of the paving on three sides and either side of the avenue's mouth
  S.set(pal.tw(mixc(pal.cobalt, pal.ice, 0.35), 0.8), PAT.STONE);
  for (const sg of [-1, 1]) { S.box(22, GY + 0.3, sg * 19.6, 48.4, 0.42, 1.2, {}); S.box(-1.6, GY + 0.3, sg * 13.6, 1.2, 0.42, 10.8, {}); }
  S.box(45.6, GY + 0.3, 0, 1.2, 0.42, 38, {});
  S.set(pal.ice, PAT.PLAIN).lathe(16, GY + 0.6, 0, [[3.6, 0], [3.6, 0.6], [2.6, 0.6], [2.2, 2.4], [2.7, 2.6], [2.7, 3]], 12, {});
  S.set(pal.gold, PAT.GOLD).torus(16, GY + 3.6, 0, 1.5, 0.22, 16, 5);
  for (const sg of [-1, 1]) {
    S.set(pal.white, PAT.PLAIN).lathe(16, GY + 0.6, sg * 11.5, [[4, 0], [4, 1], [3.3, 1], [3.3, 0.5], [0.8, 0.5], [0.6, 3.2], [1.5, 3.6], [0, 4.2]], 12, {});
    S.set(pal.water, PAT.WATER).lathe(16, GY + 1.45, sg * 11.5, [[3.3, 0], [0.8, 0]], 12, { cap: false });
    for (let i = 0; i < 9; i++) { const a = TAU * i / 9; puffOn(M, [16, GY + 4.6, sg * 11.5], 3.2, r(), 1 / r.range(1.3, 1.9), [Math.cos(a) * 2.2, Math.sin(a) * 2.2]); blobBody(M, pal.white, 0.4); M.move(null); }
    blocks.push([16, sg * 11.5, 4, GY + 8.5]);
    for (const hx of [10, 31]) {
      const w = r.range(15, 18), d = 12, h = r.range(16, 21), cz = sg * (19 + d / 2 + 1), u0 = r.range(0, 40);
      if (!keep(hx, cz, 9, GY + h + 9)) continue;
      house(S, r, pal, hx, cz, w, d, h, 0, { roof: 2, wall: pal.tw(pal.white, 0.95), u0, fine: true });
      S.set(pal.tw(pal.cobalt), PAT.WALL).cyl(hx, GY + h, cz, 4.6, 4.6, 2.6, 12, { cap: false });
      S.set(pal.tw(pal.cobalt), PAT.TILE).dome(hx, GY + h + 2.6, cz, 5.2, 6, 12, 4); S.set(pal.gold, PAT.GOLD).cone(hx, GY + h + 8.4, cz, 0.5, 3, 4);
      const ops = [-1, 0, 1].map((k) => ({ c: hx + k * w * 0.28, w: w * 0.2, s: 4.2, arch: 1 }));
      S.set(pal.ice, PAT.PLAIN).wall(hx - w / 2, hx + w / 2, GY + 0.6, 7.4, sg * 19.6, 0.8, ops, { k: 5 });
    }
  }
  if (G.yld) await G.yld();
  return grandArch(S, M, r, pal, G);
}
async function grandArch(S, M, r, pal, G) {
  const { den, blocks, keep, bc, br, rd, canX, W, sP, rp, pool } = G, I = INSIDE;
  // the great arch of the square (the ring stands in it: the arch's round head is drawn about the level eye) with a
  // tall tower at either hand (each under the city's bowl by its own top)
  const ax = I.end, half = 8.6, pw = 6, hS = I.eye - GY;
  for (const sg of [-1, 1]) {
    S.set(pal.white, PAT.STONE).box(ax, GY, sg * (half + pw / 2), 8, hS + half + 3, pw, {}); blocks.push([ax, sg * (half + pw / 2), 4.5, GY + 38]);
    const tz = sg * (half + pw + 6.5), th = Math.min(r.range(40, 47), G.bowlTop(ax + 1, tz) - GY - fineTop(4.4, 0, 0)), top = fineTower(S, pal, ax + 1, tz, 4.4, th, { head: 0, n: 12, wall: pal.tw(pal.cobalt, 1.05), roofCol: pal.white }); blocks.push([ax + 1, tz, 5.2, top]);
  }
  // (a wall is built along x in its own plane: turned a quarter to stand across the avenue)
  S.set(pal.white, PAT.STONE).sub(ax, 0, 0, Math.PI / 2).wall(-half - pw, half + pw, GY + hS, half + 9, 0, 8, [{ c: 0, w: half * 2, s: 0, arch: 1 }], { k: 10, top: true }).pop();
  // its dress toward the avenue: a gold archivolt round the opening, blue pilasters with gold heads, small domes above
  S.set(pal.gold, PAT.GOLD).torus(ax - 4.2, GY + hS, 0, half + 0.9, 0.7, 20, 6, { axis: 'x', arc: Math.PI, a0: Math.PI / 2 });
  for (const sg of [-1, 1]) {
    S.set(pal.tw(pal.ultra, 1.1), PAT.PLAIN).box(ax - 4.3, GY, sg * (half + 1.2), 0.9, hS, 1.8, {});
    S.set(pal.gold, PAT.GOLD).box(ax - 4.3, GY + hS, sg * (half + 1.2), 1.3, 1.1, 2.4, {});
    S.set(pal.tw(pal.cobalt, 1.05), PAT.PLAIN).box(ax - 4.3, GY, sg * (half + pw - 0.9), 0.9, hS + half + 3, 1.6, {});
    for (const dz of [3.2, 8.4]) { S.set(pal.tw(pal.turq), PAT.TILE).dome(ax, GY + hS + half + 10.4, sg * dz * 1.25, 2.3, 2.9, 10, 4); S.set(pal.gold, PAT.GOLD).cone(ax, GY + hS + half + 13.2, sg * dz * 1.25, 0.35, 2, 4); }
  }
  S.set(pal.gold, PAT.GOLD).box(ax, GY + hS + half + 9, 0, 9, 1.4, (half + pw) * 2 + 1, {});
  S.set(pal.tw(pal.ultra), PAT.PLAIN).box(ax, GY + hS + half + 10.4, 0, 6, 3, (half + pw) * 1.4, { tx: 0.7, tz: 0.9 });
  // terraces on the avenue's far hand from the harbour: four tiers stepping up toward the crystal, houses with white
  // shutters on each, white stairs from tier to tier
  const tA = 0.96, tArc = 1.83;
  for (let i = 0; i < 4; i++) {
    if (G.yld) await G.yld();
    const r0 = 54 + i * 4.6, r1 = i === 3 ? RIM - 0.4 : r0 + 4.7, h = 3.5 + i * 3.6;
    S.set(pal.tw(i % 2 ? pal.cobalt : pal.ultra, 0.85), PAT.WALL).lathe(0, GY, 0, [[r0, 0], [r0, h]], 40, { arc: tArc, a0: tA, cap: false });
    S.set(pal.ice, PAT.PAVE).lathe(0, GY + h, 0, [[r1, 0], [r0, 0]], 40, { arc: tArc, a0: tA, cap: false });
    S.set(pal.white, PAT.PLAIN).lathe(0, GY + h, 0, [[r0 + 0.5, 0], [r0 + 0.5, 0.7], [r0, 0.7]], 40, { arc: tArc, a0: tA, cap: false });
    for (const f of [0.17, 0.5, 0.83]) { const a = tA + tArc * f, ca = Math.cos(a), sa = Math.sin(a); for (let k = 0; k < 4; k++) S.box(ca * (r0 - 0.6 - k * 0.9), GY + (i ? h - 3.6 : 0), sa * (r0 - 0.6 - k * 0.9), 0.9, (i ? 3.6 : h) * (1 - k / 4), 3, { yaw: -a }); }
    for (let k = 0, nH = Math.round(tArc * r0 / 7.2); k < nH; k++) {
      const a = tA + tArc * (k + 0.5) / nH, rr = r0 + 2.7, w = r.range(5, 6.6), hh = r.range(6, 9.5) + (r.chance(0.15) ? 5 : 0), x = Math.cos(a) * rr, z = Math.sin(a) * rr, wc = pal.wall(r), rc = pal.roof(r), kind = r.pick([0, 1, 1]), u0 = r.range(0, 40);
      if (Math.hypot(x, z) + 3.6 > Math.sqrt(77 * 77 - (GY + h + hh + 3) ** 2)) continue;
      if (keep(x, z, 3.6, GY + h + hh + 3)) house(S, r, pal, x, z, w, 3.8, hh, -a + Math.PI / 2, { y: GY + h, wall: wc, roofCol: rc, roof: kind, u0, fine: true });
    }
  }
  if (G.yld) await G.yld();
  const inTier = (x, z, rr) => { const d = Math.hypot(x, z), a = (Math.atan2(z, x) - tA + TAU * 2) % TAU; return d + rr > 52 && a < tArc; };
  const wet = (x, z, rr) => {
    if (Math.hypot(x - bc[0], z - bc[1]) < br + 3.8 + rr) return true;
    const dx = x - bc[0], dz = z - bc[1], t = dx * rd[0] + dz * rd[1]; if (t > 0 && t < sP + rp + 2 + rr && Math.abs(-dx * rd[1] + dz * rd[0]) < 4.6 + rr) return true;
    if (Math.hypot(dx - rd[0] * sP, dz - rd[1] * sP) < rp + 2 + rr || Math.hypot(x - pool[0], z - pool[1]) < pool[2] + 2 + rr) return true;
    return Math.abs(x - canX) < 4.6 + rr && z > bc[1] && z < pool[1];
  };
  const town = (x, z, rr) => (Math.abs(z) < W / 2 + 2.9 + rr && x < 2 + rr) || (x > -1 - rr && x < 45 + rr && Math.abs(z) < 20.2 + rr);
  const occ = blocks.map((b) => [b[0], b[1], b[4] ?? b[2], 0]);
  return grandTown(S, M, r, pal, { ...G, inTier, wet, town, occ });
}
async function grandTown(S, M, r, pal, G) {
  const { den, keep, inTier, wet, town, occ, blocks, bc, br } = G;
  // (the city's form, the bowl round the harbour: grandCity) no tower lot is dealt in the open ground (wet, town)
  const { bowlTop, bowl } = G;
  // the great towers: tall, staged, each its own, under the crystal and under the bowl by their own top, kept out of
  // the way's lane by their own reach and height (one in the lane is left out); every draw of a tower is made before
  // it is tested
  const taken = [];
  for (let i = 0, nT = Math.round(13 * den); i < 400 && taken.length < nT; i++) {
    const a = r.range(0, TAU), d = r.range(18, 58), x = Math.cos(a) * d, z = Math.sin(a) * d, rad = r.range(2.6, 4.2), head = r.int(0, 2), round = r.chance(0.6), wc = pal.wall(r), rc = pal.roof(r), on = r.chance(0.4) ? 0.25 : 0, want = r.range(34, 74), yaw = r.range(0, 1.5);
    const cap = fineTop(rad, 0, head, on), hC = Math.min(want, Math.sqrt(77 * 77 - (d + rad * 1.2 + 1) ** 2) - GY - cap), h = Math.min(hC, bowlTop(x, z) - GY - cap), top = GY + fineTop(rad, h, head, on);
    if (hC < 24 || wet(x, z, rad + 1) || town(x, z, rad + 1) || inTier(x, z, rad + 1) || taken.some((p) => Math.hypot(p[0] - x, p[1] - z) < 15) || occ.some((p) => Math.hypot(p[0] - x, p[1] - z) < p[2] + rad + 1.5)) continue;
    if (h < 12) { bowl.noLot++; continue; }
    if (!keep(x, z, rad * 1.2 + 0.4, top)) { bowl.lane++; continue; }
    taken.push([x, z, rad + 1.5, h, top, rad * 1.2 + 0.4]); occ.push([x, z, rad + 1.5, h]); bowl.towers++; if (h < hC) bowl.lower++;
    fineTower(S, pal, x, z, rad, h, { round, head, wall: wc, roofCol: rc, n: 10, onion: on, yaw });
    if (G.yld && taken.length % 5 === 0) await G.yld();
  }
  if (G.yld) await G.yld();
  // domed halls among the houses: a drum of windows on a white step, a tiled dome, a gold lantern
  for (let i = 0, nD = 0; i < 120 && nD < Math.round(5 * den); i++) {
    const a = r.range(0, TAU), d = r.range(24, 56), x = Math.cos(a) * d, z = Math.sin(a) * d, rad = r.range(5.5, 7.5), h = r.range(9, 14), wc = pal.wall(r), rc = pal.roof(r);
    if (wet(x, z, rad + 1) || town(x, z, rad + 1) || inTier(x, z, rad + 1) || occ.some((p) => Math.hypot(p[0] - x, p[1] - z) < p[2] + rad + 1.5)) continue;
    if (GY + h + rad * 1.5 + 4 > bowlTop(x, z)) { bowl.hallNoLot++; continue; }
    if (!keep(x, z, rad + 0.5, GY + h + rad * 1.5 + 4)) { bowl.hallLane++; continue; }
    nD++; occ.push([x, z, rad + 1.5, h]); bowl.halls++;
    S.set(pal.white, PAT.STONE).cyl(x, GY, z, rad + 1.1, rad + 1.1, 0.9, 14, {});
    S.set(wc, PAT.WALL).cyl(x, GY + 0.9, z, rad, rad, h - 0.9, 14, { cap: false });
    S.set(pal.white, PAT.PLAIN).lathe(x, GY + h, z, [[rad, 0], [rad + 0.7, 0.4], [rad + 0.7, 0.9], [rad * 0.9, 0.9]], 14, { cap: false });
    S.set(rc, PAT.TILE).dome(x, GY + h + 0.8, z, rad * 0.94, rad * 1.05, 14, 5);
    S.set(pal.gold, PAT.LIGHT).cyl(x, GY + h + 0.8 + rad * 1.02, z, 0.8, 0.7, 1.6, 6, {}); S.set(pal.gold, PAT.GOLD).cone(x, GY + h + 2.4 + rad * 1.02, z, 0.95, 2.4, 6);
  }
  // the town between: houses on lots of 6 m in rows square to the avenue (lanes of half a metre and more between),
  // wherever nothing else is; every lot's draws are made before it is tested
  const hs = [], lot = 6, nL = Math.ceil(72 / lot), thin = clamp(0.22 - 0.2 * den, 0.02, 0.3), foot = mixc(pal.ground, pal.navy, 0.35), pale = mixc(pal.white, pal.ice, 0.6);
  for (let gx = -nL; gx <= nL; gx++) {
    for (let gz = -nL; gz <= nL; gz++) {
      const x = (gx + 0.5) * lot + r.range(-0.3, 0.3), z = (gz + 0.5) * lot + r.range(-0.3, 0.3), d = Math.hypot(x, z), w = r.range(4.2, 5.2), dd = r.range(4.2, 5.2), h0 = r.range(5.5, 10.5) * (1 + 0.6 * Math.max(0, 1 - d / 50)), turn = r.chance(0.5), kind = r.pick([0, 0, 1, 1, 2, 3]), wc = pal.wall(r), rc = pal.roof(r), chim = r.chance(0.3), skip = r.chance(thin), u0 = r.range(0, 40), bal = r.chance(0.65), awn = r.chance(0.45), awc = r.chance(0.5) ? pal.gold : pal.white;
      const hw = (turn ? dd : w) / 2, hd = (turn ? w : dd) / 2, rr = Math.max(hw, hd), far = Math.hypot(Math.abs(x) + hw + 0.8, Math.abs(z) + hd + 0.8);
      if (skip || far > RIM - 1 || wet(x, z, rr) || town(x, z, rr) || inTier(x, z, rr) || occ.some((p) => Math.hypot(p[0] - x, p[1] - z) < p[2] + rr + 0.4)) continue;
      // under the bowl by its roof and chimney (3.5 m over its walls); a house keeps 4.5 m of body or has no lot
      const hB = Math.min(h0, bowlTop(x, z) - GY - 3.5);
      if (hB < 4.5) { bowl.houseNoLot++; continue; }
      const h = hB; if (h < h0) bowl.houseLower++;
      if (!keep(x, z, rr, GY + h + 3.5)) continue;
      hs.push([x, z, hw, hd, h]);
      house(S, r, pal, x, z, w, dd, h, turn ? Math.PI / 2 : 0, { wall: wc, roofCol: rc, roof: kind, u0, fine: true });
      S.set(foot, PAT.STONE).box(x, GY, z, hw * 2 + 0.7, 0.6, hd * 2 + 0.7, {});
      if (chim) S.set(pal.white, PAT.PLAIN).box(x + hw * 0.4, GY + h, z, 0.9, 3.2, 0.9, {});
      // a white balcony round the upper floor, an awning of gold or white cloth over the door
      if (bal) { S.set(pale, PAT.PLAIN).box(x, GY + h * 0.56, z, hw * 2 + 1.5, 0.22, hd * 2 + 1.5, { bot: true }); S.set(pal.gold, PAT.GOLD).box(x, GY + h * 0.56 + 0.85, z, hw * 2 + 1.5, 0.1, hd * 2 + 1.5, { top: false, bot: false }); }
      if (awn) S.set(awc, PAT.CLOTH).box(x, GY + 2.6, z + (gz % 2 ? 1 : -1) * (hd + 0.8), hw * 1.5, 0.12, 1.6, { bot: true });
    }
    if (G.yld && gx % 6 === 0) await G.yld();
  }
  return grandLife(S, M, r, pal, { ...G, hs, taken, bowl });
}
function grandLife(S, M, r, pal, G) {
  const { den, way, blocks, bc, br, rd, canX, hs, lampsAt, Lw, sM, cz0, cz1 } = G;
  // ships at their moorings in the basin, boats round the basin, one on
  // the river and one on the canal, each loop inside its own water with 4 m to spare at either end
  const ships = [];
  for (let i = 0; i < 80 && ships.length < 6; i++) {
    const a = r.range(0, TAU), d = r.range(5.5, br - 5), x = bc[0] + Math.cos(a) * d, z = bc[1] + Math.sin(a) * d, L = r.range(8, 11), yaw = r.range(0, TAU), pre = [r(), r.range(0.7, 1.2), r.range(0.05, 0.09), r.chance(0.5)];
    if (!ships.every((p) => Math.hypot(p[0] - x, p[1] - z) > 9.5)) continue;
    ships.push([x, z]); shipAt(M, r, pal, x, z, L, yaw, GY + 0.3, pre, [mixc(pal.navy, pal.cobalt, 0.3), mulc(pal.ice, 0.8)]); blocks.push([x, z, L * 0.5, GY + L + 1.5]);
  }
  for (let i = 0; i < 2; i++) { loopOn(M, [bc[0], GY + 0.4, bc[1]], [br - 3.4, 0], [0, br - 3.4], r(), (i ? 1 : -1) / r.range(60, 90)); boatBody(M, pal, 5.5); M.move(null); }
  // (polish round 1) THE HARBOUR'S LIGHT TURNS: the one clear thing in the great city that moves and is lit. A lens of
  // gold light goes round the lantern of the light tower once in 11 to 14 s, and its light lies on the basin's water
  // as a broad short leaf of lit water out from the rock, going round with it (under the ships' hulls, 13 m and more
  // under the line). On the world's clock, from a phase of its own stream (G.more: made by the world from its seed
  // and a name; where none is handed in, the light stands as before).
  if (G.more) {
    const x = G.more('harbourLight'), ph = x(), T = x.range(11, 14), dir = x.chance(0.5) ? 1 : -1, yL = G.lightTop - 6.6 - (GY + 0.32);
    loopOn(M, [bc[0], GY + 0.32, bc[1]], [0.01, 0], [0, 0.01], ph, dir / T);
    // the leaf on the water (p1m1, O2): a broad, short fan of the basin's own water, lit gold along its middle and
    // fading to the water's own colour at its sides and its end (34 degrees wide, from the rock to some two thirds
    // of the way to the quay): a beam's light lying soft-edged on water
    { const r0 = 3.6, r1 = 3.6 + 0.62 * (br - 4.3), lit = mulc(mixc(pal.water, pal.gold, 0.75), 1.7), i0 = M.n;
      for (const rr of [r0, (r0 + r1) / 2, r1]) for (const k of [-1, 0, 1]) { const px = rr * Math.cos(k * 0.3), pz = rr * Math.sin(k * 0.3); M.set(k || rr === r1 ? pal.water : lit, PAT.WATER).v(px, 0, pz, 0, 1, 0, px, pz); }
      for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const a = i0 + j * 3 + k; M.tri(a + 1, a + 4, a + 3); M.tri(a + 1, a + 3, a); } }
    M.set(pal.gold, PAT.LIGHT).box(1.25, yL, 0, 0.5, 1.5, 1.3, {});
    M.move(null);
  }
  loopOn(M, [bc[0] + rd[0] * sM, GY + 0.3, bc[1] + rd[1] * sM], [rd[0] * (Lw / 2 - 4), rd[1] * (Lw / 2 - 4)], [-rd[1] * 1.5, rd[0] * 1.5], r(), 1 / r.range(50, 70)); boatBody(M, pal, 4.6); M.move(null);
  loopOn(M, [canX, GY + 0.3, (cz0 + cz1) / 2], [0, (cz1 - cz0) / 2 - 4], [1.5, 0], r(), 1 / r.range(55, 75)); boatBody(M, pal, 4.6); M.move(null);
  // the people: plain small figures on rounds of their own: on the avenue's pavement, about the square, round the quay
  const cols = [pal.white, pal.gold, pal.ice, pal.white, pal.gold];
  for (let i = 0, n = Math.round(110 * den); i < n; i++) {
    const len = r.range(5, 18), x = r.range(-58 + len, -2 - len), z = (r.chance(0.5) ? 1 : -1) * r.range(1.4, 5.2), ph = r(), sp = (r.chance(0.5) ? 1 : -1) * 0.21 / len, col = r.pick(cols), h = r.range(2.2, 2.8);
    loopOn(M, [x, GY + 0.55, z], [len, 0], [0, 0.5], ph, sp); personBody(M, col, h); M.move(null);
  }
  for (let i = 0, n = Math.round(60 * den); i < n; i++) {
    const k = r.int(0, 3), c = k === 0 ? [16, 0] : k === 1 ? [16, 11.5] : k === 2 ? [16, -11.5] : [31, r.range(-12, 12)], ra = k === 3 ? r.range(2, 6) : k === 0 ? r.range(4.6, 6.4) : r.range(5, 6.6), rb = k === 3 ? r.range(2, 5) : ra * r.range(0.85, 1), ph = r(), sp = (r.chance(0.5) ? 1 : -1) * 0.2 / ra, col = r.pick(cols), h = r.range(2.2, 2.8);
    if (k !== 3 && c[0] - ra < 1.5) continue;
    loopOn(M, [c[0], GY + 0.6, c[1]], [ra, 0], [0, rb], ph, sp); personBody(M, col, h); M.move(null);
  }
  for (let i = 0, n = Math.round(22 * den); i < n; i++) { const ra = br + r.range(1, 2.6); loopOn(M, [bc[0], GY + 0.9, bc[1]], [ra, 0], [0, ra], r(), (r.chance(0.5) ? 1 : -1) / r.range(90, 150)); personBody(M, r.pick(cols), r.range(2.2, 2.8)); M.move(null); }
  // smoke from some chimneys, only where its whole rise keeps out of the way's lane
  let puffs = 0;
  for (let i = 0; i < hs.length; i += 9) { const h = hs[i], ph = [r(), r()], sp = [r.range(5, 8), r.range(5, 8)], dr = [r.range(-2, 2), r.range(-2, 2), r.range(-2, 2), r.range(-2, 2)]; if (inLane(way, h[0], h[1], 2.5, GY + h[4] + 15)) continue; for (let k = 0; k < 2; k++) { puffOn(M, [h[0], GY + h[4] + 4, h[1]], 9, ph[k], 1 / sp[k], [dr[k * 2], dr[k * 2 + 1]]); blobBody(M, pal.white, 1.1); M.move(null); } puffs++; }
  M.move(null);
  return { pal, blocks, lampsAt, puffs, houses: hs.length, towers: G.taken.length, towersAt: G.taken, bowl: G.bowl, way, lightTop: G.lightTop };
}

// ---------------------------------------------------------------- the rotunda
// The hero's own measures (its origin: the middle of the well's floor; the door from the gallery faces +z).
export const HALL = { GH: 90, RR: 150, RW: 172, bays: 16, storey: 40, top: 168, domeH: 96, oculus: 24, rail: 137.2, door: { w: 56, s: 30, level: 120 } };
const domeAt = (s) => [HALL.RR * Math.cos(s), HALL.top + HALL.domeH * Math.sin(s)];
// materials for a hero that stands alone (the world hands its own in, so the whole place shares them)
export function heroMaterials(o = {}) {
  const time = o.time || { value: 0 }, light = o.light || new THREE.Vector3(0.45, 0.72, 0.52).normalize(), H = o.hour || {};
  const arch = townMaterial({ time, glow: 0, lamp: H.lamp ?? 3, pane: H.pane || [0.62, 0.66, 0.7], wet: 0.2 });
  const town = townMaterial({ time, glow: H.glow ?? 0.3, lit: H.lit || [2.6, 2.9, 3.4], litT: H.litT ?? 0.55, lamp: H.cityLamp ?? 3 });
  const townM = townMaterial({ time, movers: true, glow: H.glow ?? 0.3, lamp: H.cityLamp ?? 3, side: THREE.DoubleSide });
  const cr = { light, lightColor: H.lightColor || [1, 0.97, 0.9], sky: H.pane || [0.62, 0.66, 0.7], lamp: H.lampC || COLORS.gold, sun: H.sun ?? 1, time };
  return { time, light, arch, town, townM, crystalF: crystalMaterial({ ...cr }), crystalB: crystalMaterial({ ...cr, back: true, veil: [0.05, 0.3, 0.3, 0.05] }),
    greatF: crystalMaterial({ ...cr }), greatB: crystalMaterial({ ...cr, back: true, veil: [0.07, 0.32, 0.22, 0.1] }),
    proxy: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }) };
}
// a geometry's bounding ball in two plain passes over its positions: the middle of its box, then the farthest vertex
// (the same ball as the library's own, without its first call's cost)
const ballOf = (g) => {
  const P = g.attributes.position.array, n = P.length; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity, r2 = 0;
  for (let i = 0; i < n; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const cx = n ? (x0 + x1) / 2 : 0, cy = n ? (y0 + y1) / 2 : 0, cz = n ? (z0 + z1) / 2 : 0;
  for (let i = 0; i < n; i += 3) { const dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
};
const meshOf = (geo, mat, name, o = {}) => { const m = new THREE.Mesh(geo.build ? geo.build() : geo, mat); m.name = name; m.receiveShadow = o.receive !== false; m.castShadow = !!o.cast; if (o.order !== undefined) m.renderOrder = o.order; if (o.sphere) m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(...o.sphere.slice(0, 3)), o.sphere[3]); else ballOf(m.geometry); return m; };
export { meshOf };
export async function buildHero(ctx, opts = {}) {
  const H = HALL, C = COLORS, rng = opts.rng || ctx.rng.fork('hero'), den = opts.density ?? 1, mats = opts.mats || heroMaterials(opts), yaw = opts.yaw ?? 0.6;
  const R = {}; for (const k of ['bays', 'grand', 'plinth', 'kinds']) R[k] = rng.fork(k);
  const bayR = []; for (let k = 0; k < H.bays; k++) bayR.push(R.bays.fork('b' + k));
  const bayC = bayR.map((b) => [0, 1, 2, 3].map((lv) => b.fork('city' + lv)));
  const object = new THREE.Group(); object.name = 'rotunda';
  const Q = [0, 1, 2, 3].map(() => ({ A: new Geo({ cap: 1 << 15 }), S: new Geo({ cap: 1 << 15 }), M: new Geo({ movers: true, cap: 1 << 12 }), sh: new Shells() }));
  const core = new Geo({ cap: 1 << 14 }), proxy = new Geo({ cap: 1 << 11 }), alcoves = [], lamps = [], dth = TAU / H.bays, half = dth / 2;
  const kinds = []; for (let i = 0; i < 8; i++) kinds.push(...R.kinds.shuffle([...CITY_KINDS]));
  let ki = 0;
  await ctx.yield();
  for (let k = 0; k < H.bays; k++) {
    const th = Math.PI / 2 + k * dth, q = Q[Math.floor(k / 4)], A = q.A, cs = Math.cos(th), sn = Math.sin(th), br = bayR[k];
    // the alcove's back wall (the door bay is open above the entry floor: the gallery's last wall closes it), the pier, its pilaster
    A.set(C.iron, PAT.IRON).lathe(0, 0, 0, k === 0 ? [[H.RW, H.door.level], [H.RW, 0]] : [[H.RW, H.top], [H.RW, 0]], 4, { arc: dth, a0: th - half, cap: false });
    const pa = th + half, pc = Math.cos(pa), ps = Math.sin(pa);
    A.box(pc * 161.5, 0, ps * 161.5, 23, H.top, 7, { yaw: -pa, top: false });
    A.set(C.bronze, PAT.BRONZE).box(pc * 149.4, 0, ps * 149.4, 3.4, H.top, 4.6, { yaw: -pa, top: false });
    for (let lv = 0; lv < 4; lv++) {
      const y = lv * H.storey;
      if (lv) {
        A.set(C.iron, PAT.FLOOR).lathe(0, 0, 0, [[H.RW, y], [136, y], [136, y - 2.6], [H.RW, y - 2.6]], 4, { arc: dth, a0: th - half, cap: false });
        A.set(C.brass, PAT.GOLD).torus(0, y + 5, 0, H.rail, 0.5, 5, 5, { arc: dth, a0: th - half }).torus(0, y + 2.6, 0, H.rail, 0.26, 5, 4, { arc: dth, a0: th - half });
        for (let i = 0; i < 6; i++) { const a = th - half + dth * (i + 0.5) / 6; A.box(Math.cos(a) * H.rail, y, Math.sin(a) * H.rail, 0.9, 5, 0.9, { yaw: -a, top: false }); }
      }
      // the bronze fascia over each alcove (none over the door bay's top storey: the way in from the gallery is open)
      if (!(k === 0 && lv === 3)) A.set(C.bronze, PAT.BRONZE).lathe(0, 0, 0, [[150.6, y + H.storey - (lv === 3 ? -8 : 2.6)], [150.6, y + 31]], 4, { arc: dth, a0: th - half, cap: false });
      lamps.push(lampInto(A, pc * 144.5, y, ps * 144.5, 8.5, { k: 1.25 }));
      if (k === 0 && lv === 3) continue;
      // the alcove's globe on its stand, with its own small city (or, in a few alcoves, a tall lamp)
      const r = br.range(8.6, 11.4) + (lv === 0 ? 1.6 : 0), hs = 4.5, cx = cs * 160, cz = sn * 160, cy = y + hs + r, gy = br.range(0, TAU), lampOnly = br.chance(clamp(0.2 - 0.14 * den, 0.02, 0.2)), kind = kinds[ki++ % kinds.length], cr = bayC[k][lv];
      if (lampOnly) { lamps.push(lampInto(A, cx, y, cz, 14, { k: 2.6 })); continue; }
      if (!alcoves.length) await ctx.yield();
      standInto(A, cx, y, cz, r, hs, { n: 8 }); crownInto(A, cx, cy, cz, r);
      q.S.frame(cx, cy, cz, gy, r / GLOBE.R); q.M.frame(cx, cy, cz, gy, r / GLOBE.R);
      buildCity(kind, q.S, q.M, cr, { q: 0 });
      q.sh.add(cx, cy, cz, r, { nu: 18, nv: 10 });
      alcoves.push([cx, cy, cz, r, kind]);
      await ctx.yield();
    }
    await ctx.yield();
  }
  for (const q of Q) { q.S.frame(); q.M.frame(); }
  return buildHero2(ctx, { opts, object, Q, core, proxy, alcoves, lamps, mats, R, yaw, den });
}
async function buildHero2(ctx, B) {
  const { opts, object, Q, core, proxy, alcoves, lamps, mats, R, yaw, den } = B, H = HALL, C = COLORS, GH = H.GH, RG = GLOBE.R;
  // the well's floor, the great stand and its rail, the crown's ring
  core.set(C.iron, PAT.FLOOR).lathe(0, 0, 0, [[H.RR, 0], [0, 0]], 48, { cap: false });
  standInto(core, 0, 0, 0, RG, GH - RG, { n: 40 });
  railInto(core, 0, 0, 0, 106, { posts: 44, h: 5.5, pr: 0.55 });
  const hole = Math.asin(GLOBE.crown / RG);
  crownInto(core, 0, GH, 0, RG, { open: hole });
  await ctx.yield();
  // the dome: a bronze springing ring, sixteen ribs, two hoops, glazing between, an oculus
  const s1 = Math.acos(H.oculus / H.RR), dome = new Geo({ cap: 1 << 13 });
  dome.set(C.bronze, PAT.BRONZE).torus(0, H.top, 0, H.RR, 3.2, 64, 6);
  for (let k = 0; k < H.bays; k++) { const a = Math.PI / 2 + (k + 0.5) * TAU / H.bays, pts = []; for (let i = 0; i <= 10; i++) { const d = domeAt(s1 * i / 10); pts.push([Math.cos(a) * d[0], d[1], Math.sin(a) * d[0]]); } dome.set(C.iron, PAT.IRON).tube(pts, 2.2, 6, { r1: 1.5 }); }
  for (const s of [0.42, 0.86]) { const d = domeAt(s); dome.set(C.iron, PAT.IRON).torus(0, d[1], 0, d[0], 1.3, 48, 5); }
  { const prof = []; for (let i = 12; i >= 0; i--) { const d = domeAt(s1 * i / 12); prof.push([d[0] * 1.012, d[1] + 0.5]); } dome.set(C.iron, PAT.PANE).lathe(0, 0, 0, prof, 48, { smooth: true, cap: false, ur: 7 * 128 / TAU }); }
  { const d = domeAt(s1); dome.set(C.iron, PAT.PANE).lathe(0, d[1] + 0.5, 0, [[H.oculus * 1.012, 0], [0, 6]], 24, { cap: false }); dome.set(C.bronze, PAT.BRONZE).torus(0, d[1], 0, H.oculus, 1.8, 32, 6); }
  await ctx.yield();
  // the great globe's city (in the globe's own frame, turned so its way in lies under the flight's)
  const gS = new Geo({ cap: 1 << 16 }), gM = new Geo({ movers: true, cap: 1 << 14 });
  gS.frame(0, GH, 0, yaw, 1); gM.frame(0, GH, 0, yaw, 1);
  const city = await grandCity(gS, gM, R.grand, { density: den, yield: () => ctx.yield(), more: opts.more });
  const toHero = (x, y, z) => gS.toWorld(x, y, z);
  await ctx.yield();
  // what throws shade: the stand, the galleries' floors and piers, the grand city's blocks (plain boxes, a little inset)
  proxy.lathe(0, 0, 0, [[RG * 0.82, 0], [RG * 0.5, RG * 0.11], [RG * 0.3, (GH - RG) * 0.8], [RG * 0.66, GH - RG + RG * 0.25]], 12, { cap: false });
  for (let lv = 1; lv < 4; lv++) proxy.lathe(0, 0, 0, [[H.RW, lv * H.storey - 0.4], [136.5, lv * H.storey - 0.4], [136.5, lv * H.storey - 2.4]], 32, { cap: false });
  // the hall's iron wall behind the alcoves keeps the sun out: it comes in through the dome's panes alone
  proxy.lathe(0, 0, 0, [[H.RW, H.top], [H.RW, 0]], 32, { cap: false });
  for (let k = 0; k < H.bays; k++) { const pa = Math.PI / 2 + (k + 0.5) * TAU / H.bays; proxy.box(Math.cos(pa) * 161.5, 0, Math.sin(pa) * 161.5, 22, H.top, 6, { yaw: -pa }); }
  proxy.frame(0, GH, 0, yaw, 1);
  for (const b of city.blocks) { const hgt = b[3] - GY - 0.4, w = (b[4] ?? b[2]) * 1.5; if (hgt > 4 && b[2] > 1.5) proxy.box(b[0], GY, b[1], w, hgt * 0.94, w, {}); }
  proxy.frame();
  await ctx.yield();
  // the small globe on the plinth of the square: its own object, turned on the clock in update
  const pr = 2.6, pAt = toHero(16, GY + 3.6 + pr + 0.3, 0), plinth = new THREE.Group(), pS = new Geo(), pM = new Geo({ movers: true }), pSh = new Shells();
  pS.frame(0, 0, 0, 0, pr / RG); pM.frame(0, 0, 0, 0, pr / RG);
  buildCity(R.plinth.pick(['towers', 'minaret', 'ring', 'stairs']), pS, pM, R.plinth, { q: 0 });
  pSh.add(0, 0, 0, pr, { nu: 20, nv: 12 });
  plinth.position.set(pAt[0], pAt[1], pAt[2]); plinth.name = 'plinth';
  const pPhase = R.plinth.range(0, TAU), pRate = R.plinth.range(0.16, 0.24) * (R.plinth.chance(0.5) ? 1 : -1);
  await ctx.yield();
  // meshes
  const add = (m) => { object.add(m); return m; };
  for (let i = 0; i < 4; i++) {
    const q = Q[i];
    // a quarter's iron and its cities are each laid out in one step and measured in the next
    const hallG = q.A.build(); await ctx.yield();
    add(meshOf(hallG, mats.hall || mats.arch, 'hall' + i));
    await ctx.yield();
    const townG = q.S.build(); await ctx.yield();
    add(meshOf(townG, mats.town, 'alcoveCities' + i));
    await ctx.yield();
    if (q.M.ni) add(meshOf(q.M, mats.townM, 'alcoveMovers' + i, { sphere: [0, 80, 0, 200] }));
    const g = q.sh.build(); add(meshOf(g, mats.crystalB, 'alcoveGlassB' + i, { order: 3, receive: false })); add(meshOf(g, mats.crystalF, 'alcoveGlassF' + i, { order: 4, receive: false }));
    await ctx.yield();
  }
  add(meshOf(core, mats.hall || mats.arch, 'well')); add(meshOf(dome, mats.hall || mats.arch, 'dome'));
  await ctx.yield();
  add(meshOf(gS, mats.grand || mats.town, 'grandCity'));
  await ctx.yield();
  add(meshOf(gM, mats.grandM || mats.townM, 'grandMovers', { sphere: [0, GH, 0, RG] }));
  const gsh = new Shells().add(0, GH, 0, RG, { nu: 72, nv: 44, hole }).build();
  add(meshOf(gsh, mats.greatB, 'greatGlassB', { order: 5, receive: false })); add(meshOf(gsh, mats.greatF, 'greatGlassF', { order: 6, receive: false }));
  add(meshOf(proxy, mats.proxy, 'shade', { cast: true, receive: false }));
  plinth.add(meshOf(pS, mats.town, 'plinthCity')); if (pM.ni) plinth.add(meshOf(pM, mats.townM, 'plinthMovers', { sphere: [0, 0, 0, pr] }));
  const psg = pSh.build(); plinth.add(meshOf(psg, mats.crystalB, 'plinthGlassB', { order: 3, receive: false }), meshOf(psg, mats.crystalF, 'plinthGlassF', { order: 4, receive: false }));
  add(plinth);
  const way = city.way.map((p) => toHero(p[0], p[1], p[2])), cyw = Math.cos(yaw), syw = Math.sin(yaw);
  return {
    object, radius: H.RW, height: H.top + H.domeH, center: new THREE.Vector3(0, GH, 0), ground: false,
    anchors: { G: new THREE.Vector3(0, GH, 0), crown: new THREE.Vector3(0, GH + RG, 0), portal: new THREE.Vector3(...toHero(INSIDE.end, INSIDE.eye, 0)), square: new THREE.Vector3(...toHero(16, GY + 4, 0)), harbour: new THREE.Vector3(...toHero(INSIDE.c[0], GY + 2, INSIDE.c[1])), light: new THREE.Vector3(...toHero(INSIDE.c[0], city.lightTop - 6, INSIDE.c[1])),
      ring: new THREE.Vector3(0, GH + INSIDE.ringY, 0), turn: new THREE.Vector3(...toHero(INSIDE.c[0] + 0, 0, INSIDE.c[1])),
      way, yaw, alcoves, lamps, cityLamps: city.lampsAt.map((p) => toHero(p[0], p[1], p[2])),
      blocks: city.blocks.map((b) => { const p = toHero(b[0], 0, b[1]); return [p[0], p[2], b[2], b[3] + GH]; }), plinth: [pAt[0], pAt[1], pAt[2], pr], houses: city.houses, towers: city.towers, towersAt: city.towersAt.map((b) => { const p = toHero(b[0], 0, b[1]); return [p[0], p[2], b[5], b[4] + GH]; }), bowl: city.bowl, avenueDir: [cyw, -syw] },
    update(dt, time) { if (!opts.mats) mats.time.value = time; plinth.rotation.y = pPhase + time * pRate; },
    dispose() {},
  };
}
