// The Galleon Among the Flowers: the hero set piece. A tall-sterned Spanish galleon standing whole in a forest
// clearing: hull lofted from section curves with real gunports, wales, castles, three masts with tops and yards,
// standing rigging as four-sided tubes, rags of sail, orchids and hanging air plants, a crust of barnacles,
// and a hold that is one nave of ribs filled with flowers, lit by bars of sun through hatches, gratings and ports.
//
// The world is built four times life size (the camera flies inside her): the hull is 166 m from stem to taffrail.
// Local frame: keel on y = 0, bow toward +Z, port side +X, starboard -X. Everything here is ship-local; the world
// leans and seats the whole object.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- the ship's lines (metres, ship-local)
export const SHIP = {
  BMAX: 20, YW: 17, YTOP: 57,
  D_WAIST: 30, D_FC: 38, D_QD: 38, D_POOP: 46,           // deck heights
  Z_FC: 34.8, Z_QD: -29.2, Z_POOP: -62.8,                 // where the castles begin (on hull stations)
  MAST: { fore: 50, main: 8, mizzen: -50 },
  HATCH: { z0: -24.4, z1: -0.4, hw: 7.5 },                // the main hatch: the way in
  GRATE_F: { z0: 20.4, z1: 28.4, hw: 4.5 }, GRATE_Q: { z0: -46.8, z1: -38.8, hw: 4 }, GRATE_P: { z0: -83.6, z1: -74, hw: 3.5 },
  PORT: { z0: -66, step: 9.6, n: 12, hw: 1.6, y0: 21.2, y1: 24.4 },
  WIN: { y: 23, w: 11, h: 14, z: -96.2 },                 // the middle stern window: the portal's seat
  BAY: { r: 6.6, sill: 14.6, spring: 25 },                // the bay the portal stands in: an arch of radius r sprung at this height over a sill
  GROUND: 4.5,                                            // how deep she sits in her bed of stones
};
const { BMAX, YW, D_WAIST, D_FC, D_QD, D_POOP, Z_FC, Z_QD, Z_POOP } = SHIP;
export const zStern = (y) => -90 - 10 * clamp(y / 57, 0, 1);
export const zStem = (y) => 44 + 22 * Math.pow(clamp(y / 40, 0, 1), 0.55) + Math.max(0, y - 40) * 0.1;
export const zAt = (t, y) => lerp(zStern(y), zStem(y), t);
export const tAt = (z, y) => clamp((z - zStern(y)) / (zStem(y) - zStern(y)), 0, 1);
const pSec = (t) => 1.45 + 1.5 * Math.min(smoothstep(0, 0.3, t), 1 - smoothstep(0.62, 1, t));
// half breadth of the outer hull at station t (0 stern .. 1 stem) and height y
export function halfB(t, y) {
  let f = 1;
  if (t > 0.6) { const e = (t - 0.6) / 0.4, k = lerp(1.5, 2.7, clamp(y / 30, 0, 1)); f = Math.pow(Math.max(0, 1 - Math.pow(e, k)), 0.62); }
  if (t < 0.34) { const e = 1 - t / 0.34, sw = 0.04 + 0.56 * smoothstep(5, 22, y); f *= 1 - e * e * (1 - sw); }
  let s;
  if (y < YW) { const p = pSec(t); s = Math.pow(1 - Math.pow(1 - clamp(y / YW, 0, 1), p), 1 / p); }
  else s = 1 - 0.2 * Math.pow((y - YW) / 40, 1.3);
  return BMAX * f * s;
}
export const deckY = (z) => (z > Z_FC ? D_FC : z > Z_QD ? D_WAIST : z > Z_POOP ? D_QD : D_POOP);
// top of the side (the rail) at deck-level position z: steps up at the castles through short scrolls
export function railY(z) {
  let y = 34.5;
  y = lerp(y, 42, smoothstep(32.4, 37.2, z) * (1 - smoothstep(60.5, 64.5, z) * 0.75));
  y = lerp(y, 42.5, smoothstep(-26.8, -31.6, z));
  y = lerp(y, 50.5, smoothstep(-60.4, -65.2, z));
  y = lerp(y, 57, smoothstep(-90, -98, z));
  return y;
}
const sheer = (t) => (t > 0.45 ? 2.5 * Math.pow((t - 0.45) / 0.55, 2) : 2.2 * Math.pow((0.45 - t) / 0.45, 2));
const WALL = 1.1;                                           // thickness of her side
// inner hull: the same lines one plank-and-frame thickness in
export const halfBin = (t, y) => Math.max(halfB(t, Math.max(y, 0.01)) - WALL, 0.25);
// height of the inner bottom at (x, z): where the flowers stand
export function floorY(x, z) {
  const t = tAt(z, 10), ax = Math.abs(x);
  let lo = 1.2, hi = YW;
  if (halfBin(t, hi) <= ax) return hi;
  for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (halfBin(t, m) > ax) hi = m; else lo = m; }
  return hi;
}

// ---------------------------------------------------------------- colour helpers (linear)
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mad = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// material kinds carried per vertex (aM.x): what the shader paints on the surface
export const K = { HULL: 0, DECK: 1, INNER: 2, SPAR: 3, IRON: 4, CARVE: 5, STONE: 6, GLASS: 7 };

// ---------------------------------------------------------------- mesh builder: position, normal, colour, uv (metres), aM (kind, ao, inside, extra)
class MB {
  // the vertex data goes straight into typed arrays (no growing lists of numbers for the collector to chew on)
  constructor(cap = 180000) { this.cap = cap; this.p = new Float32Array(cap * 3); this.n = new Float32Array(cap * 3); this.c = new Float32Array(cap * 3); this.u = new Float32Array(cap * 2); this.m = new Float32Array(cap * 4); this.i = []; this.count = 0; this.col = [0.8, 0.78, 0.7]; this.kind = 0; this.ao = 1; this.inside = 0; this.extra = 0; }
  grow() { const cap = this.cap * 2; for (const [k, n] of [['p', 3], ['n', 3], ['c', 3], ['u', 2], ['m', 4]]) { const a = new Float32Array(cap * n); a.set(this[k]); this[k] = a; } this.cap = cap; }
  set(kind, inside = 0, extra = 0) { this.kind = kind; this.inside = inside; this.extra = extra; return this; }
  color(c, k = 1) { this.col = k === 1 ? c : mul(c, k); return this; }
  v(p, n, uv, ao = 1, col = this.col) {
    if (this.count >= this.cap) this.grow();
    const k = this.count, a = k * 3, b = k * 2, d = k * 4, P = this.p, N = this.n, Cl = this.c, U = this.u, M = this.m;
    P[a] = p[0]; P[a + 1] = p[1]; P[a + 2] = p[2]; N[a] = n[0]; N[a + 1] = n[1]; N[a + 2] = n[2]; Cl[a] = col[0]; Cl[a + 1] = col[1]; Cl[a + 2] = col[2];
    U[b] = uv[0]; U[b + 1] = uv[1]; M[d] = this.kind; M[d + 1] = ao * this.ao; M[d + 2] = this.inside; M[d + 3] = this.extra;
    return this.count++;
  }
  // flat quad a-b-c-d (counter-clockwise seen from the front); uv from the dominant plane unless given
  // four corners given whole: [p, n, uv, ao] each (smooth sheets built cell by cell)
  q4(A, B, Cc, D) { const i0 = this.v(A[0], A[1], A[2], A[3] ?? 1), i1 = this.v(B[0], B[1], B[2], B[3] ?? 1), i2 = this.v(Cc[0], Cc[1], Cc[2], Cc[3] ?? 1), i3 = this.v(D[0], D[1], D[2], D[3] ?? 1); this.i.push(i0, i1, i2, i0, i2, i3); return this; }
  quad(a, b, c, d, o = {}) {
    let n = norm(cross(sub(b, a), sub(d, a))); if (!(len(n) > 0.5)) n = norm(cross(sub(c, b), sub(d, b)));
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    const uvOf = o.uv ? null : (q) => (ay >= ax && ay >= az ? [q[2], q[0]] : ax >= az ? [q[2], q[1]] : [q[0], q[1]]);
    const ao = o.ao || [1, 1, 1, 1], P = [a, b, c, d], I = [];
    for (let k = 0; k < 4; k++) I.push(this.v(P[k], n, o.uv ? o.uv[k] : uvOf(P[k]), ao[k], o.cols ? o.cols[k] : this.col));
    this.i.push(I[0], I[1], I[2], I[0], I[2], I[3]);
    return this;
  }
  tri(a, b, c) {
    const n = norm(cross(sub(b, a), sub(c, a))), ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    const uvOf = (q) => (ay >= ax && ay >= az ? [q[2], q[0]] : ax >= az ? [q[2], q[1]] : [q[0], q[1]]);
    const i0 = this.v(a, n, uvOf(a)), i1 = this.v(b, n, uvOf(b)), i2 = this.v(c, n, uvOf(c)); this.i.push(i0, i1, i2); return this;
  }
  // axis-aligned box; skip: string of faces to leave out among 'x X y Y z Z' (lower case = the low side)
  box(x0, y0, z0, x1, y1, z1, skip = '') {
    const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y1, z0], D = [x0, y1, z0], E = [x0, y0, z1], F = [x1, y0, z1], G = [x1, y1, z1], H = [x0, y1, z1];
    if (!skip.includes('z')) this.quad(B, A, D, C); if (!skip.includes('Z')) this.quad(E, F, G, H);
    if (!skip.includes('x')) this.quad(A, E, H, D); if (!skip.includes('X')) this.quad(F, B, C, G);
    if (!skip.includes('y')) this.quad(A, B, F, E); if (!skip.includes('Y')) this.quad(D, H, G, C);
    return this;
  }
  // a squared timber from a to b, w across and h deep (h along `up`)
  beam(a, b, w, h, up = [0, 1, 0], caps = true) {
    const t = norm(sub(b, a)); let s = cross(t, up); if (len(s) < 1e-3) s = cross(t, [1, 0, 0]); s = norm(s); const u = norm(cross(s, t));
    const c = (p, i, j) => [p[0] + s[0] * i * w / 2 + u[0] * j * h / 2, p[1] + s[1] * i * w / 2 + u[1] * j * h / 2, p[2] + s[2] * i * w / 2 + u[2] * j * h / 2];
    const L = len(sub(b, a)), sides = [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]];
    for (const [i0, j0, i1, j1] of sides) this.quad(c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0), { uv: [[0, 0], [0, i0 === i1 ? w : h], [L, i0 === i1 ? w : h], [L, 0]] });
    if (caps) { this.quad(c(a, -1, -1), c(a, -1, 1), c(a, 1, 1), c(a, 1, -1)); this.quad(c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)); }
    return this;
  }
  // round spar / rope / rib through pts with a radius per point; smooth normals, uv = (length, girth)
  tube(pts, rad, sides = 8, o = {}) {
    const n = pts.length, rings = []; let nrm = null, L = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tan = norm(sub(b, a));
      if (!nrm) { nrm = cross(tan, Math.abs(tan[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); } else nrm = sub(nrm, mul(tan, dot(nrm, tan)));
      nrm = norm(nrm); const bin = cross(tan, nrm), r = typeof rad === 'number' ? rad : rad[i];
      if (i > 0) L += len(sub(pts[i], pts[i - 1]));
      const ring = [];
      for (let k = 0; k <= sides; k++) {
        const ang = (k / sides) * TAU, ca = Math.cos(ang), sa = Math.sin(ang), d = [nrm[0] * ca + bin[0] * sa, nrm[1] * ca + bin[1] * sa, nrm[2] * ca + bin[2] * sa];
        ring.push(this.v(mad(pts[i], d, r), d, [L, (k / sides) * TAU * r], o.ao ? o.ao(i, d) : 1));
      }
      rings.push(ring);
      if (i > 0) { const p = rings[i - 1]; for (let k = 0; k < sides; k++) this.i.push(p[k], ring[k], ring[k + 1], p[k], ring[k + 1], p[k + 1]); }
    }
    if (o.cap !== false) for (const e of [0, n - 1]) {
      const tan = norm(sub(pts[e === 0 ? 0 : n - 1], pts[e === 0 ? 1 : n - 2])), c = this.v(pts[e], tan, [0, 0]), ring = rings[e];
      for (let k = 0; k < sides; k++) { if (e === 0) this.i.push(c, ring[k], ring[k + 1]); else this.i.push(c, ring[k + 1], ring[k]); }
    }
    return this;
  }
  // surface of revolution about the vertical through (cx, cz): prof = [[radius, y], ...] bottom to top
  lathe(prof, cx, cz, sides = 12, o = {}) {
    const rings = [];
    for (let i = 0; i < prof.length; i++) {
      const a = prof[Math.max(0, i - 1)], b = prof[Math.min(prof.length - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1, ring = [];
      for (let k = 0; k <= sides; k++) {
        const ang = (k / sides) * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
        ring.push(this.v([cx + ca * prof[i][0], prof[i][1], cz + sa * prof[i][0]], [ca * dy / l, -dr / l, sa * dy / l], [prof[i][1], ang * Math.max(prof[i][0], 0.3)], o.ao ? o.ao(i) : 1));
      }
      rings.push(ring);
      if (i > 0) { const p = rings[i - 1]; for (let k = 0; k < sides; k++) this.i.push(p[k], ring[k + 1], ring[k], p[k], p[k + 1], ring[k + 1]); }
    }
    return this;
  }
  // parametric sheet: fn(i, j) -> { p, n, uv, ao?, col? } for i 0..nu, j 0..nv; skip(i, j) leaves a cell out
  grid(nu, nv, fn, o = {}) {
    const base = this.count;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = fn(i, j); this.v(q.p, q.n, q.uv, q.ao ?? 1, q.col || this.col); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      if (o.skip && o.skip(i, j)) continue;
      const a = base + j * (nu + 1) + i, b = a + 1, c = b + nu + 1, d = a + nu + 1;
      if (o.flip) this.i.push(a, c, b, a, d, c); else this.i.push(a, b, c, a, c, d);
    }
    return this;
  }
  get triangles() { return this.i.length / 3; }
  // one array at a time with the page handed back in between
  async geometryStepped(pause) {
    const g = new THREE.BufferGeometry();
    const fill = async (out, arr) => { for (let o = 0; o < arr.length; o += 60000) { const e = Math.min(arr.length, o + 60000); for (let k = o; k < e; k++) out[k] = arr[k]; await pause(); } return out; };
    for (const [name, arr, n] of [['position', this.p, 3], ['normal', this.n, 3], ['color', this.c, 3], ['uv', this.u, 2], ['aM', this.m, 4]]) { g.setAttribute(name, new THREE.BufferAttribute(arr.slice(0, this.count * n), n)); await pause(); }
    g.setIndex(new THREE.BufferAttribute(await fill(this.count > 65535 ? new Uint32Array(this.i.length) : new Uint16Array(this.i.length), this.i), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, -10), 150); g.boundingBox = new THREE.Box3(new THREE.Vector3(-70, -5, -115), new THREE.Vector3(70, 180, 110));
    return g;
  }
}

// palette of the ship (linear)
const C = {
  chalk: lin('#e9e6da'), chalkWarm: lin('#e4dcc6'), silver: lin('#b9bbb2'), wale: lin('#a39f93'), deck: lin('#cfc9b6'), inner: lin('#b8b09a'),
  spar: lin('#d9d4c4'), iron: lin('#6f7672'), gilt: lin('#d8c58a'), rope: lin('#c9c2ac'), cloth: lin('#d6d0bd'), dark: lin('#3b3a34'),
};

// ---------------------------------------------------------------- the hull: outer and inner shells from the same lines
const ROWS = [0, 0.7, 2.2, 4.6, 7.8, 11, 14.2, 17, 18.4, 21.2, 24.4, 25.6, 26.8, 30, 32.2, 34.5, 38, 40.2, 42.5, 46, 48.2, 50.5, 54, 57];
const ZS = (() => { const z = [-94]; for (let k = 16; k >= 1; k--) z.push(-67.6 - 1.6 * k); for (let i = 0; i <= 79; i++) z.push(-67.6 + 1.6 * i); z.push(59.5, 59.95, 60.15); return z; })();
const ZREF0 = -94, ZREF1 = 60.15, I0 = 17;                 // station I0 stands at z -67.6, where the regular stations start
const stationT = (i) => (ZS[i] - ZREF0) / (ZREF1 - ZREF0);
const isPortCell = (i) => { const k = i - I0; return k >= 0 && k < 72 && (k % 6 === 0 || k % 6 === 1); };
const rowYOf = (j, t, top) => Math.min(ROWS[j] + (j >= 7 && j <= 12 ? sheer(t) : 0), top);
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 31.7) * 43758.5453; return s - Math.floor(s); };

async function hullTables(pause) {
  const NS = ZS.length, NR = ROWS.length, T = [];
  for (let i = 0; i < NS; i++) {
    const t = stationT(i), top = railY(zAt(t, 34)), col = [];
    let girth = 0, prev = null;
    for (let j = 0; j < NR; j++) {
      const y = rowYOf(j, t, top), b = halfB(t, Math.max(y, 0.001)), z = zAt(t, y);
      const proud = j === 7 || j === 8 || j === 11 || j === 12 ? 0.34 : 0;
      // normal of the port side by differences along the station and up the section
      const e = 0.004, y0 = Math.max(y - 0.15, 0.001), y1 = y + 0.15, ta = Math.max(t - e, 0), tb = Math.min(t + e, 1);
      const dT = [halfB(tb, Math.max(y, 0.001)) - halfB(ta, Math.max(y, 0.001)), 0, zAt(tb, y) - zAt(ta, y)], dY = [halfB(t, y1) - halfB(t, y0), y1 - y0, zAt(t, y1) - zAt(t, y0)];
      let n = norm(cross(dY, dT)); if (!(n[0] > -2)) n = [1, 0, 0];
      if (y < 0.4) n = norm([n[0] * 0.5, -1, n[2] * 0.5]);
      const p = [b + proud, y, z];
      if (prev) girth += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
      col.push({ p, n, y, b, z, girth, pin: [Math.max(b - WALL, 0.25), y, z] });
    }
    T.push({ t, top, col, zDeck: zAt(t, 34) });
    if (i % 12 === 11) await pause();
  }
  return T;
}

async function buildHull(mb, T, rng, pause) {
  const NS = T.length, NR = ROWS.length, ports = [];
  const strake = []; for (let j = 0; j < NR; j++) strake.push(0.9 + 0.12 * hash1(j * 3.1));
  for (const sg of [1, -1]) {
    const X = (p) => [p[0] * sg, p[1], p[2]], NX = (n) => [n[0] * sg, n[1], n[2]];
    for (let i = 0; i < NS - 1; i++) {
      if (i % 4 === 3) await pause();
      const a = T[i], b = T[i + 1], zmid = (a.zDeck + b.zDeck) / 2, dk = deckY(zmid);
      for (let j = 0; j < NR - 1; j++) {
        const A = a.col[j], B = b.col[j], Cc = b.col[j + 1], D = a.col[j + 1];
        if (D.y - A.y < 0.01 && Cc.y - B.y < 0.01) continue;
        const port = j === 9 && isPortCell(i);
        const wale = j === 7 || j === 11, ymid = (A.y + D.y) / 2;
        const ao = (q) => clamp(0.55 + q.y * 0.09, 0.55, 1) * (j === 6 || j === 8 || j === 10 || j === 12 ? 0.93 : 1);
        const uvo = (q) => [q.z, q.girth];
        if (!port) {
          // outer planking: chalk white, each strake a little different; the wales a greyer, thicker timber
          mb.set(K.HULL, 0, wale ? 1 : 0).color(wale ? C.wale : mix3(C.chalk, C.silver, 0.25 * hash1(j * 7.3 + Math.floor(i / 5) * 1.7)), strake[j]);
          mb.q4([X(A.p), NX(A.n), uvo(A), ao(A)], [X(D.p), NX(D.n), uvo(D), ao(D)], [X(Cc.p), NX(Cc.n), uvo(Cc), ao(Cc)], [X(B.p), NX(B.n), uvo(B), ao(B)]);
        }
        // inner face: the hold's wall below the deck (lit only by what comes in), the bulwark's inboard face above it
        if (A.y < 1) continue;
        const inside = ymid < dk ? 1 : 0, ni = (q) => NX([-q.n[0], -q.n[1] * 0.6, -q.n[2]]), uvi = (q) => [q.z, q.girth + 3.3];
        if (!port) {
          mb.set(inside ? K.INNER : K.HULL, inside, 0).color(inside ? C.inner : C.chalkWarm, inside ? 0.92 + 0.1 * hash1(j * 1.9 + i * 0.37) : strake[j] * 0.95);
          const aoi = (q) => (inside ? clamp(0.5 + (q.y - 2) * 0.03, 0.5, 1) : 1);
          mb.q4([X(A.pin), ni(A), uvi(A), aoi(A)], [X(B.pin), ni(B), uvi(B), aoi(B)], [X(Cc.pin), ni(Cc), uvi(Cc), aoi(Cc)], [X(D.pin), ni(D), uvi(D), aoi(D)]);
        } else {
          // a gunport: a real opening through her side; four reveals
          mb.set(K.INNER, 0, 0).color(C.inner, 0.8);
          const first = (i - I0) % 6 === 0;
          mb.quad(X(A.p), X(B.p), X(B.pin), X(A.pin)); mb.quad(X(D.p), X(D.pin), X(Cc.pin), X(Cc.p));
          if (first) mb.quad(X(A.p), X(A.pin), X(D.pin), X(D.p)); else mb.quad(X(B.p), X(Cc.p), X(Cc.pin), X(B.pin));
          if (first) ports.push({ sg, z: B.z, y: (B.y + Cc.y) / 2, x: sg * B.p[0], xin: sg * B.pin[0], y0: B.y, y1: Cc.y, n: NX(B.n), k: (i - I0) / 6 });
        }
      }
      // the rail: a broad capping timber along the top of the side
      const ja = NR - 1, At = a.col[ja], Bt = b.col[ja];
      mb.set(K.HULL, 0, 1).color(C.wale, 1.05);
      const o1 = (q, dx, dy) => X([q.p[0] + dx, q.p[1] + dy, q.p[2]]), i1 = (q, dx, dy) => X([q.pin[0] + dx, q.pin[1] + dy, q.pin[2]]);
      mb.quad(o1(At, 0.3, -0.25), o1(At, 0.3, 0.35), o1(Bt, 0.3, 0.35), o1(Bt, 0.3, -0.25));
      mb.quad(o1(At, 0.3, 0.35), i1(At, -0.3, 0.35), i1(Bt, -0.3, 0.35), o1(Bt, 0.3, 0.35));
      mb.quad(i1(At, -0.3, 0.35), i1(At, -0.3, -0.25), i1(Bt, -0.3, -0.25), i1(Bt, -0.3, 0.35));
    }
  }
  // stem post, keel and sternpost: squared timbers standing proud of the planking
  mb.set(K.HULL, 0, 1).color(C.wale, 0.95);
  for (let y = 0; y < 42; y += 3.5) { const y1 = Math.min(y + 3.5, 42); mb.beam([0, y, zStem(y) + 0.35], [0, y1, zStem(y1) + 0.35], 1.5, 1.6, [0, 0, 1], false); }
  mb.beam([0, -0.5, zStern(0) - 0.6], [0, -0.5, zStem(0) + 0.6], 1.5, 1.4);
  for (let y = 0; y < 14; y += 3.5) mb.beam([0, y, zStern(y) - 0.5], [0, y + 3.5, zStern(y + 3.5) - 0.5], 1.3, 1.5, [0, 0, 1], false);
  // the rudder, hung on the sternpost
  mb.color(C.chalk, 0.85);
  mb.quad([0.45, 0.5, zStern(0.5) - 1.2], [0.45, 0.5, zStern(0.5) - 6], [0.45, 13.5, zStern(13.5) - 4.2], [0.45, 13.5, zStern(13.5) - 1.2]);
  mb.quad([-0.45, 0.5, zStern(0.5) - 6], [-0.45, 0.5, zStern(0.5) - 1.2], [-0.45, 13.5, zStern(13.5) - 1.2], [-0.45, 13.5, zStern(13.5) - 4.2]);
  mb.quad([0.45, 0.5, zStern(0.5) - 6], [-0.45, 0.5, zStern(0.5) - 6], [-0.45, 13.5, zStern(13.5) - 4.2], [0.45, 13.5, zStern(13.5) - 4.2]);
  return ports;
}

// ---------------------------------------------------------------- a wall with openings: front face, back face, reveals, arch heads and mouldings
// o.at(u, v) -> point on the front face; o.n front normal; o.thick; holes [{ u0, u1, v0, v1, arch, frame }]; front/back: [kind, inside, colour]
function wall(mb, o) {
  const { at, n, thick, holes = [], u0, u1, v0, v1 } = o, back = (p) => mad(p, n, -thick);
  const us = new Set([u0, u1]), vs = new Set([v0, v1]);
  for (const h of holes) { us.add(h.u0); us.add(h.u1); vs.add(h.v0); vs.add(h.v1); if (h.arch) vs.add(h.v1 - (h.u1 - h.u0) / 2); }
  const fill = (set, a, b, step) => { for (let x = a + step; x < b - step * 0.3; x += step) { let near = false; for (const q of set) if (Math.abs(q - x) < step * 0.35) near = true; if (!near) set.add(x); } };
  fill(us, u0, u1, o.cell || 4); fill(vs, v0, v1, o.cell || 4);
  const U = [...us].filter((x) => x >= u0 - 1e-6 && x <= u1 + 1e-6).sort((a, b) => a - b), V = [...vs].filter((x) => x >= v0 - 1e-6 && x <= v1 + 1e-6).sort((a, b) => a - b);
  const inHole = (u, v) => { for (const h of holes) if (u > h.u0 && u < h.u1 && v > h.v0 && v < h.v1) return h; return null; };
  const face = (pa, pb, pc, pd, f, flip) => { mb.set(f[0], f[1], f[3] || 0).color(f[2]); if (flip) mb.quad(pd, pc, pb, pa); else mb.quad(pa, pb, pc, pd); };
  for (let a = 0; a < U.length - 1; a++) for (let b = 0; b < V.length - 1; b++) {
    const ua = U[a], ub = U[a + 1], va = V[b], vb = V[b + 1];
    if (inHole((ua + ub) / 2, (va + vb) / 2)) continue;
    const A = at(ua, va), B = at(ub, va), Cc = at(ub, vb), D = at(ua, vb);
    if (len(sub(B, A)) < 0.02 && len(sub(Cc, D)) < 0.02) continue;
    face(A, B, Cc, D, o.front, false);
    if (o.back) face(back(A), back(B), back(Cc), back(D), o.back, true);
  }
  for (const h of holes) {
    const w = h.u1 - h.u0, r = w / 2, vs0 = h.arch ? h.v1 - r : h.v1, cu = (h.u0 + h.u1) / 2, rev = o.reveal || o.back || o.front;
    const arc = []; if (h.arch) for (let k = 0; k <= 10; k++) { const a = Math.PI * (1 - k / 10); arc.push([cu + Math.cos(a) * r, vs0 + Math.sin(a) * r]); }
    if (h.arch) for (const [corner, k0, k1] of [[[h.u0, h.v1], 0, 5], [[h.u1, h.v1], 5, 10]]) for (let k = k0; k < k1; k++) {
      // spandrels: the corners between the arch and its square
      const P0 = at(corner[0], corner[1]), P1 = at(arc[k][0], arc[k][1]), P2 = at(arc[k + 1][0], arc[k + 1][1]);
      mb.set(o.front[0], o.front[1], o.front[3] || 0).color(o.front[2]); mb.tri(P0, P2, P1);
      if (o.back) { mb.set(o.back[0], o.back[1], o.back[3] || 0).color(o.back[2]); mb.tri(back(P0), back(P1), back(P2)); }
    }
    // reveals: jambs, sill, and the soffit of the head
    mb.set(rev[0], h.revealInside ?? rev[1], 0).color(rev[2], 0.8);
    const J = (ua, va, ub, vb) => { const A = at(ua, va), B = at(ub, vb); mb.quad(A, B, back(B), back(A)); };
    J(h.u0, vs0, h.u0, h.v0); J(h.u1, h.v0, h.u1, vs0); if (h.sill !== false) J(h.u0, h.v0, h.u1, h.v0);
    if (h.arch) for (let k = 0; k < 10; k++) J(arc[k + 1][0], arc[k + 1][1], arc[k][0], arc[k][1]); else J(h.u1, h.v1, h.u0, h.v1);
    if (h.frame) {
      // a carved moulding round the opening, on the front (and the back when asked)
      for (const side of h.frame === 2 ? [0, 1] : [0]) {
        const off = side ? -thick - 0.12 : 0.12, line = [[h.u0, h.v0], [h.u0, vs0]];
        if (h.arch) for (const q of arc) line.push(q); else line.push([h.u0, h.v1], [h.u1, h.v1]);
        line.push([h.u1, vs0], [h.u1, h.v0]);
        mb.set(K.CARVE, side ? (o.back ? o.back[1] : 0) : o.front[1], 0).color(C.gilt, 0.9);
        mb.tube(line.map((q) => mad(at(q[0], q[1]), n, off)), h.frameR || 0.32, 5, { cap: false });
      }
    }
  }
}

// ---------------------------------------------------------------- decks, hatches, gratings, beams and the ribs of the nave
const DECKS = [
  { D: D_FC, za: Z_FC, zb: 63.2, holes: [] }, { D: D_WAIST, za: Z_QD, zb: Z_FC, holes: [SHIP.HATCH, SHIP.GRATE_F] },
  { D: D_QD, za: Z_POOP, zb: Z_QD, holes: [SHIP.GRATE_Q] }, { D: D_POOP, za: -97.2, zb: Z_POOP, holes: [SHIP.GRATE_P] },
];
const binAt = (z, y) => halfBin(tAt(z, y), y);

function buildDecks(mb, T) {
  for (const dk of DECKS) {
    const { D, za, zb, holes } = dk, zs = new Set([za, zb]);
    for (const s of T) { const z = zAt(s.t, D); if (z > za + 0.3 && z < zb - 0.3) zs.add(z); }
    for (const h of holes) { zs.add(h.z0); zs.add(h.z1); }
    const Z = [...zs].sort((a, b) => a - b), under = D - 0.7;
    for (let i = 0; i < Z.length - 1; i++) {
      const z0 = Z[i], z1 = Z[i + 1]; if (z1 - z0 < 0.05) continue;
      const zm = (z0 + z1) / 2, b0 = binAt(z0, D), b1 = binAt(z1, D), hole = holes.find((h) => zm > h.z0 && zm < h.z1);
      const spans = hole ? [[-1, -hole.hw / b0, -hole.hw / b1], [hole.hw / b0, 1, hole.hw / b1]] : [[-1, 0], [0, 1]];
      for (const sp of spans) {
        const xa0 = sp[0] * b0, xb0 = (hole ? (sp[0] < 0 ? sp[1] : 1) : sp[1]) * b0, xa1 = (hole ? (sp[0] < 0 ? -1 : sp[2]) : sp[0]) * b1, xb1 = (hole ? (sp[0] < 0 ? sp[2] : 1) : sp[1]) * b1;
        mb.set(K.DECK, 0, 0).color(C.deck, 0.92 + 0.1 * hash1(i * 2.3 + D));
        mb.quad([xa0, D, z0], [xa1, D, z1], [xb1, D, z1], [xb0, D, z0]);
        mb.set(K.INNER, 1, 0).color(C.inner, 0.8);
        mb.quad([xa0, under, z0], [xb0, under, z0], [xb1, under, z1], [xa1, under, z1]);
      }
    }
    for (const h of holes) {
      // coaming: a raised rim round the opening, its inner faces running down through the deck
      mb.set(K.HULL, 0, 1).color(C.wale, 1.0);
      const w = 0.7, y0 = D - 0.7, y1 = D + 1.05;
      mb.box(-h.hw - w, y0, h.z1, h.hw + w, y1, h.z1 + w, 'y'); mb.box(-h.hw - w, y0, h.z0 - w, h.hw + w, y1, h.z0, 'y');
      mb.box(h.hw, y0, h.z0, h.hw + w, y1, h.z1, 'yzZ'); mb.box(-h.hw - w, y0, h.z0, -h.hw, y1, h.z1, 'yzZ');
      if (h !== SHIP.HATCH) {
        // a grating: a lattice of battens that lets the garden and the light through
        mb.color(C.wale, 0.9);
        for (let x = -h.hw + 0.65; x < h.hw - 0.3; x += 1.3) mb.beam([x, y1 - 0.25, h.z0], [x, y1 - 0.25, h.z1], 0.38, 0.4, [0, 1, 0], false);
        for (let z = h.z0 + 0.65; z < h.z1 - 0.3; z += 1.3) mb.beam([-h.hw, y1 - 0.3, z], [h.hw, y1 - 0.3, z], 0.38, 0.36, [0, 1, 0], false);
      }
    }
  }
}

async function buildFrames(mb, T, rng, pause) {
  const NS = T.length;
  // ribs: every second station a frame rises from the keelson to the deck beam, standing proud of the ceiling like the piers of a nave
  for (let i = 1; i < NS - 4; i++) {
    if ((i - I0) % 2 !== 0) continue;
    if (i % 8 < 2) await pause();
    const s = T[i], dk = deckY(s.zDeck), jTop = ROWS.indexOf(dk);
    for (const sg of [1, -1]) {
      const base = [], tip = [];
      for (let j = 1; j <= jTop; j++) {
        const q = s.col[j], n = [q.n[0] * sg, q.n[1], q.n[2]], d = 1.45 - 0.5 * (j / jTop);
        base.push([q.pin[0] * sg, q.pin[1], q.pin[2]]); tip.push([q.pin[0] * sg - n[0] * d, Math.min(q.pin[1] - n[1] * d * 0.5, dk - 0.75), q.pin[2] - n[2] * d * 0.3]);
      }
      const hw = 0.55, pale = 1.0 + 0.08 * hash1(i * 1.3);
      for (let j = 0; j < base.length - 1; j++) {
        const zf = [0, 0, hw], zb = [0, 0, -hw], a0 = clamp(0.55 + j * 0.06, 0.55, 1);
        mb.set(K.INNER, 1, 2).color(C.spar, 0.86 * pale);
        mb.quad(add(tip[j], zb), add(tip[j], zf), add(tip[j + 1], zf), add(tip[j + 1], zb), { ao: [a0, a0, a0, a0] });
        mb.color(C.spar, 0.7 * pale);
        mb.quad(add(base[j], zf), add(base[j + 1], zf), add(tip[j + 1], zf), add(tip[j], zf), { ao: [0.6, 0.6, a0, a0] });
        mb.quad(add(base[j + 1], zb), add(base[j], zb), add(tip[j], zb), add(tip[j + 1], zb), { ao: [0.6, 0.6, a0, a0] });
      }
    }
    // the deck beam across the top of each frame, with hanging knees; cut away where a hatch stands open above
    const z = zAt(s.t, dk - 1), b = binAt(z, dk - 1.2), holes = dk === D_WAIST ? [SHIP.HATCH, SHIP.GRATE_F] : dk === D_POOP ? [SHIP.GRATE_P] : s.zDeck < Z_QD ? [SHIP.GRATE_Q] : [];
    const hole = holes.find((h) => z > h.z0 - 0.3 && z < h.z1 + 0.3), y1 = dk - 0.7, y0 = y1 - 1.5;
    mb.set(K.INNER, 1, 2).color(C.spar, 0.78);
    if (hole) { mb.box(-b, y0, z - 0.55, -hole.hw - 0.7, y1, z + 0.55, 'Yx'); mb.box(hole.hw + 0.7, y0, z - 0.55, b, y1, z + 0.55, 'YX'); }
    else mb.box(-b, y0, z - 0.55, b, y1, z + 0.55, 'YxX');
    for (const sg of [1, -1]) {
      const bx = sg * (b - 0.2), kx = sg * (b - 4.2), ky = y0 - 4.4;
      mb.tri([bx, y0, z + 0.45], [kx, y0, z + 0.45], [bx, ky, z + 0.45]); mb.tri([bx, y0, z - 0.45], [bx, ky, z - 0.45], [kx, y0, z - 0.45]);
      mb.quad([kx, y0, z - 0.45], [bx, ky, z - 0.45], [bx, ky, z + 0.45], [kx, y0, z + 0.45]);
    }
  }
  await pause();
  // a shelf below the gunports along each side: the line of a deck that is no longer there
  for (const sg of [1, -1]) for (let i = 2; i < NS - 6; i++) {
    const a = T[i].col[9], b = T[i + 1].col[9], X = (q, dx, dy) => [(q.pin[0] - dx) * sg, q.pin[1] + dy, q.pin[2]];
    mb.set(K.INNER, 1, 2).color(C.spar, 0.8);
    mb.quad(X(a, 1.5, -0.2), X(b, 1.5, -0.2), X(b, 0, -0.2), X(a, 0, -0.2));
    mb.color(C.spar, 0.66); mb.quad(X(a, 1.5, -1.3), X(b, 1.5, -1.3), X(b, 1.5, -0.2), X(a, 1.5, -0.2));
    mb.color(C.spar, 0.5); mb.quad(X(a, 0.2, -2.1), X(b, 0.2, -2.1), X(b, 1.5, -1.3), X(a, 1.5, -1.3));
  }
  // keelson: the spine along the bottom
  mb.set(K.INNER, 1, 2).color(C.spar, 0.6); mb.beam([0, 1.9, -84], [0, 1.9, 52], 2.2, 1.6);
}

// the bulkheads where the castles step up, the partition between hold and great cabin, the cabin sole
function buildBulkheads(mb) {
  const side = (z, y) => binAt(z, y);
  const flat = (z) => (u, v) => [clamp(u, -side(z, v), side(z, v)), v, z];
  // forecastle bulkhead, facing aft over the waist: two doors
  wall(mb, { at: flat(Z_FC), n: [0, 0, -1], thick: 0.8, u0: -19, u1: 19, v0: D_WAIST, v1: D_FC, cell: 5,
    holes: [{ u0: -8, u1: -4.6, v0: D_WAIST, v1: 36.2, arch: true, frame: 1, frameR: 0.22, sill: false }, { u0: 4.6, u1: 8, v0: D_WAIST, v1: 36.2, arch: true, frame: 1, frameR: 0.22, sill: false }],
    front: [K.HULL, 0, C.chalkWarm], back: [K.INNER, 1, C.inner] });
  // half-deck bulkhead, facing forward: two doors and a row of small lights
  wall(mb, { at: flat(Z_QD), n: [0, 0, 1], thick: 0.8, u0: -19.5, u1: 19.5, v0: D_WAIST, v1: D_QD, cell: 5,
    holes: [{ u0: -9.5, u1: -6, v0: D_WAIST, v1: 36.2, arch: true, frame: 1, frameR: 0.22, sill: false }, { u0: 6, u1: 9.5, v0: D_WAIST, v1: 36.2, arch: true, frame: 1, frameR: 0.22, sill: false },
      { u0: -1.4, u1: 1.4, v0: 32.5, v1: 36.4, arch: true, frame: 1, frameR: 0.2 }],
    front: [K.HULL, 0, C.chalkWarm], back: [K.INNER, 1, C.inner] });
  // poop bulkhead: the great cabin's front above the quarterdeck
  wall(mb, { at: flat(Z_POOP), n: [0, 0, 1], thick: 0.8, u0: -19, u1: 19, v0: D_QD, v1: D_POOP, cell: 5,
    holes: [{ u0: -2, u1: 2, v0: D_QD, v1: 44.6, arch: true, frame: 1, frameR: 0.24, sill: false }, { u0: -9, u1: -6, v0: 40.5, v1: 44.5, arch: true, frame: 1, frameR: 0.2 }, { u0: 6, u1: 9, v0: 40.5, v1: 44.5, arch: true, frame: 1, frameR: 0.2 }],
    front: [K.HULL, 0, C.chalkWarm], back: [K.INNER, 1, C.inner] });
  // the partition between the hold and the great cabin: one broad carved arch and two side lights
  wall(mb, { at: flat(Z_POOP + 0.1), n: [0, 0, 1], thick: 1.0, u0: -19.5, u1: 19.5, v0: 3, v1: D_QD - 0.7, cell: 5,
    holes: [{ u0: -9, u1: 9, v0: 14.5, v1: 34.5, arch: true, frame: 2, frameR: 0.42, sill: false }, { u0: -15.6, u1: -11.8, v0: 18.5, v1: 28.5, arch: true, frame: 2, frameR: 0.26 }, { u0: 11.8, u1: 15.6, v0: 18.5, v1: 28.5, arch: true, frame: 2, frameR: 0.26 }],
    front: [K.INNER, 1, C.spar, 2], back: [K.INNER, 1, C.spar, 2] });
  // cabin sole: the floor the yellow flowers have carpeted
  mb.set(K.DECK, 1, 0).color(C.deck, 0.85);
  for (let z = Z_POOP; z > -93.5; z -= 3.1) {
    const z1 = Math.max(z - 3.1, -93.6), b0 = side(z, 14.5), b1 = side(z1, 14.5);
    mb.quad([-b0, 14.5, z], [b0, 14.5, z], [b1, 14.5, z1], [-b1, 14.5, z1]);
  }
  // balustrades along the breaks of the castle decks
  mb.set(K.HULL, 0, 1).color(C.wale, 1.05);
  for (const [z, y, dir] of [[Z_FC - 0.2, D_FC, -1], [Z_QD + 0.2, D_QD, 1], [Z_POOP + 0.2, D_POOP, 1]]) {
    const b = side(z, y + 2) - 0.4;
    mb.beam([-b, y + 3.6, z], [b, y + 3.6, z], 0.6, 0.5); mb.beam([-b, y + 1.9, z], [b, y + 1.9, z], 0.3, 0.3, [0, 1, 0], false);
    for (let x = -b; x <= b + 0.01; x += (2 * b) / Math.round((2 * b) / 2.2)) mb.beam([x, y, z], [x, y + 3.4, z], 0.42, 0.42, [0, 0, dir], false);
  }
}

// ---------------------------------------------------------------- the stern: a raked transom of carved windows, the portal's window bay, gallery, lanterns
const halfT = (v) => Math.min(halfB(0, v), v > 50 ? 11 * Math.sqrt(Math.max(0, 1 - ((v - 50) / 8.8) ** 2)) : 99);
function buildStern(mb) {
  const tn = norm([0, -0.175, -1]), W = SHIP.WIN, zB = W.z - 0.4;
  const at = (u, v) => { const h = halfT(v); return [clamp(u, -h, h), v, zStern(v)]; };
  const holes = [{ u0: -6.6, u1: 6.6, v0: 14.6, v1: 31.6, arch: true, frame: 2, frameR: 0.5, sill: false }];
  for (const sx of [-1, 1]) holes.push({ u0: sx > 0 ? 7.7 : -10.3, u1: sx > 0 ? 10.3 : -7.7, v0: 20.5, v1: 28.5, arch: true, frame: 2, frameR: 0.26 });
  for (let k = -2; k <= 2; k++) holes.push({ u0: k * 4 - 1.3, u1: k * 4 + 1.3, v0: 35.2, v1: 42.6, arch: true, frame: 2, frameR: 0.24 });
  wall(mb, { at, n: tn, thick: 0.9, u0: -13, u1: 13, v0: 0.5, v1: 58.8, cell: 4, holes, front: [K.CARVE, 0, C.chalk, 1], back: [K.INNER, 1, C.spar, 2] });
  // the middle window's bay: deep carved reveals running aft from the raked transom to an upright arch (the portal stands in it)
  const r = SHIP.BAY.r, vs0 = SHIP.BAY.spring, ro = 7.5, arc = []; for (let k = 0; k <= 12; k++) { const a = Math.PI * (1 - k / 12); arc.push([Math.cos(a), Math.sin(a)]); }
  const line = [[-1, 14.6 - vs0, 0]]; for (const q of arc) line.push([q[0], q[1], 1]); line.push([1, 14.6 - vs0, 0]);
  for (let k = 0; k < line.length - 1; k++) {
    const a = line[k], b = line[k + 1], P = (q, rad, z) => [q[0] * rad, q[2] ? vs0 + q[1] * rad : vs0 + q[1], z], zs = (q, rad) => zStern(q[2] ? vs0 + q[1] * rad : vs0 + q[1]) + 0.1;
    mb.set(K.CARVE, 1, 1).color(C.chalk, 0.92);                                  // inside of the bay: seen from the cabin
    mb.quad(P(a, r, zs(a, r)), P(b, r, zs(b, r)), P(b, r, zB), P(a, r, zB));
    mb.set(K.CARVE, 0, 1).color(C.chalk, 0.95);                                  // its outside and its upright face
    mb.quad(P(b, ro, zs(b, ro)), P(a, ro, zs(a, ro)), P(a, ro, zB), P(b, ro, zB));
    mb.quad(P(a, r, zB), P(b, r, zB), P(b, ro, zB), P(a, ro, zB));
  }
  mb.set(K.DECK, 1, 0).color(C.deck, 0.9); mb.quad([-r, 14.6, zStern(14.6)], [r, 14.6, zStern(14.6)], [r, 14.6, zB], [-r, 14.6, zB]);
  mb.set(K.CARVE, 0, 1).color(C.chalk, 0.9); mb.quad([-ro, 13.8, zStern(13.8)], [-ro, 13.8, zB], [ro, 13.8, zB], [ro, 13.8, zStern(13.8)]);
  for (const zz of [zB + 0.05, zB - 0.25]) {
    mb.set(K.CARVE, zz > zB ? 1 : 0, 0).color(C.gilt, 0.95);
    mb.tube(line.map((q) => [q[0] * (r + 0.1), q[2] ? vs0 + q[1] * (r + 0.1) : vs0 + q[1], zz]), 0.5, 6, { cap: false });
  }
  // the stern gallery: a balcony over the lower windows, with its balustrade
  const gy = 32.3, gz = zStern(gy);
  mb.set(K.HULL, 0, 1).color(C.wale, 1.0); mb.box(-12.4, gy - 0.6, gz - 3.4, 12.4, gy, gz + 0.3);
  mb.beam([-12.4, gy + 3.3, gz - 3.2], [12.4, gy + 3.3, gz - 3.2], 0.6, 0.5);
  for (let x = -12.2; x <= 12.21; x += 1.74) mb.beam([x, gy, gz - 3.2], [x, gy + 3.1, gz - 3.2], 0.36, 0.36, [0, 0, 1], false);
  // carved bands and the taffrail's crown
  mb.set(K.CARVE, 0, 0).color(C.gilt, 0.9);
  for (const v of [33.6, 44.2, 49.6]) { const h = halfT(v) - 0.2; mb.beam(mad([-h, v, zStern(v)], tn, 0.2), mad([h, v, zStern(v)], tn, 0.2), 0.7, 0.7, tn, false); }
  { const pts = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * (k / 16), v = 50 + Math.sin(a) * 8.6; pts.push([Math.cos(a) * 11 * 0.985, v, zStern(v) - 0.25]); } mb.tube(pts, 0.55, 6); }
  // three great lanterns on the taffrail
  for (const [x, y, z, s] of [[0, 58.9, -101.4, 1.25], [-7.4, 55.6, -101.2, 1], [7.4, 55.6, -101.2, 1]]) {
    mb.set(K.IRON, 0, 0).color(C.gilt, 0.8);
    mb.beam([x, y - 2.2 * s, z + 1.6], [x, y, z], 0.4 * s, 0.4 * s, [0, 0, 1], false);
    mb.lathe([[0.2 * s, y], [0.55 * s, y + 0.4 * s], [1.3 * s, y + 1.1 * s]], x, z, 6);
    mb.lathe([[1.3 * s, y + 3.6 * s], [1.0 * s, y + 4.1 * s], [0.35 * s, y + 4.9 * s], [0.5 * s, y + 5.3 * s], [0.01, y + 6 * s]], x, z, 6);
    mb.set(K.GLASS, 0, 1).color(lin('#d9c98a'), 0.8); mb.lathe([[1.3 * s, y + 1.1 * s], [1.3 * s, y + 3.6 * s]], x, z, 6);
  }
  // quarter galleries: glazed bays bulging from each quarter
  for (const sg of [1, -1]) {
    const prof = [[30.2, 0.05], [32, 0.8], [34.4, 1], [41.2, 1], [43, 0.82], [46, 0.04]], nz = 8;
    const P = (i, j) => { const z = -93.2 + (i / nz) * 15, y = prof[j][0], out = 3.1 * Math.pow(Math.sin(Math.PI * (i / nz)), 0.55) * prof[j][1]; return [sg * (halfB(tAt(z, y), y) - 0.25 + out), y, z]; };
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < nz; i++) {
      const glass = j === 2 && i > 0 && i < nz - 1 && i % 2 === 1;
      mb.set(glass ? K.GLASS : K.CARVE, 0, glass ? 0 : 1).color(glass ? lin('#2c3a3a') : j === 2 ? C.chalkWarm : C.chalk, j >= 4 ? 0.75 : 0.95);
      if (sg > 0) mb.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j)); else mb.quad(P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), P(i, j));
    }
  }
}

// ---------------------------------------------------------------- beakhead, catheads, anchors, channels and port lids
function buildFittings(mb, ports, rng, R) {
  // the beak: a long low platform thrust forward from the stem, railed
  const beak = (z) => { const k = clamp((z - 58) / 33, 0, 1); return { hw: lerp(7.2, 0.9, Math.pow(k, 0.8)), y: lerp(35.2, 40.4, k * k) }; };
  for (let z = 58; z < 91; z += 5.5) {
    const a = beak(z), b = beak(Math.min(z + 5.5, 91)), z1 = Math.min(z + 5.5, 91);
    mb.set(K.DECK, 0, 0).color(C.deck, 0.9); mb.quad([-a.hw, a.y, z], [-b.hw, b.y, z1], [b.hw, b.y, z1], [a.hw, a.y, z]);
    mb.set(K.HULL, 0, 0).color(C.chalk, 0.85);
    for (const sg of [1, -1]) {
      const A = [sg * a.hw, a.y, z], B = [sg * b.hw, b.y, z1], A2 = [sg * a.hw * 0.25, a.y - 3.2 * (1 - (z - 58) / 40), z], B2 = [sg * b.hw * 0.25, b.y - 3.2 * (1 - (z1 - 58) / 40), z1];
      if (sg > 0) mb.quad(A, B, B2, A2); else mb.quad(B, A, A2, B2);
    }
  }
  mb.set(K.HULL, 0, 1).color(C.wale, 1.0);
  for (const sg of [1, -1]) {
    const up = [[sg * 11.2, 40.2, 56], [sg * 8.6, 39.2, 64], [sg * 5.4, 39.4, 74], [sg * 2.6, 41, 84], [sg * 0.9, 43.2, 92]], lo = up.map((q, i) => [q[0] * 0.92, q[1] - 3.4 + i * 0.45, q[2]]);
    mb.tube(up, 0.42, 6); mb.tube(lo, 0.36, 6);
    for (let i = 1; i < up.length; i++) mb.beam(lo[i], up[i], 0.4, 0.4, [0, 0, 1], false);
  }
  mb.set(K.CARVE, 0, 0).color(C.gilt, 0.9);
  { const pts = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * TAU * 1.35, rr = 2.3 * (1 - k / 19); pts.push([0, 44.1 + Math.sin(a) * rr - 0.6, 92.6 + 1.2 - Math.cos(a) * rr]); } mb.tube(pts, pts.map((q, i) => 0.62 - i * 0.03), 6); }
  // catheads and the anchors hanging from them, flukes at the waterline
  for (const sg of [1, -1]) {
    const cx = sg * 15.4, cz = 54.2;
    mb.set(K.HULL, 0, 1).color(C.wale, 1.0); mb.beam([sg * 8.6, 42.6, cz - 1], [cx + sg * 0.6, 43.2, cz], 1.25, 1.25);
    const top = 34 - (sg < 0 ? 3 : 0), bot = top - 13.5, ax = cx + sg * 0.15;
    R.rope([cx, 42.7, cz], [ax, top + 1.2, cz], 0, 1, 0.3, 0);
    mb.set(K.IRON, 0, 0).color(C.iron, 1.0);
    mb.tube([[ax, top, cz], [ax, bot, cz]], [0.5, 0.62], 7);
    { const ring = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU; ring.push([ax, top + 1.15 + Math.cos(a) * 1.1, cz + Math.sin(a) * 1.1]); } mb.tube(ring, 0.2, 5, { cap: false }); }
    const arm = []; for (let k = 0; k <= 12; k++) { const a = -1.05 + 2.1 * (k / 12); arm.push([ax, bot + 5.4 * (1 - Math.cos(a)), cz + 5.4 * Math.sin(a)]); }
    mb.tube(arm, arm.map((q, i) => 0.6 - 0.25 * Math.abs(i - 6) / 6), 6);
    for (const e of [0, 12]) { const q = arm[e], dz = e ? 1 : -1; mb.quad([ax - 0.2, q[1] + 1.6, q[2] + dz * 0.6], [ax - 1.8, q[1] - 1.0, q[2] - dz * 0.6], [ax, q[1] - 2.6, q[2] - dz * 1.6], [ax + 1.8, q[1] - 1.0, q[2] - dz * 0.6]); }
    mb.set(K.SPAR, 0, 0).color(C.spar, 0.8); mb.beam([ax - 5.2, top - 0.9, cz], [ax + 5.2, top - 0.9, cz], 1.0, 1.1);
    R.anchors.push({ p: [ax, (top + bot) / 2, cz], top, bot, sg });
  }
  // channels: shelves outside the hull that spread the shrouds, with their deadeyes
  const feet = {};
  for (const [name, zm, y] of [['fore', SHIP.MAST.fore, 37.2], ['main', SHIP.MAST.main, 30.8], ['mizzen', SHIP.MAST.mizzen, 39.4]]) {
    feet[name] = { 1: [], '-1': [] };
    for (const sg of [1, -1]) {
      const n = name === 'mizzen' ? 4 : 6, za = zm + 1.2, zb = zm - 1.8 - 2.4 * (n - 1) - 1.2, xo = (z) => halfB(tAt(z, y), y) + 0.3;
      mb.set(K.HULL, 0, 1).color(C.wale, 0.95);
      for (let k = 0; k < 4; k++) {
        const z0 = lerp(za, zb, k / 4), z1 = lerp(za, zb, (k + 1) / 4), a = xo(z0), b = xo(z1), w = 1.9;
        mb.quad([sg * a, y, z0], [sg * (a + w), y, z0], [sg * (b + w), y, z1], [sg * b, y, z1]); mb.quad([sg * a, y - 0.5, z0], [sg * b, y - 0.5, z1], [sg * (b + w), y - 0.5, z1], [sg * (a + w), y - 0.5, z0]);
        mb.quad([sg * (a + w), y - 0.5, z0], [sg * (b + w), y - 0.5, z1], [sg * (b + w), y, z1], [sg * (a + w), y, z0]);
      }
      for (let k = 0; k < n; k++) {
        const z = zm - 1.8 - 2.4 * k, x = sg * (xo(z) + 1.55);
        mb.set(K.IRON, 0, 0).color(C.iron, 0.9); mb.tube([[x, y + 0.2, z], [x, y + 1.3, z]], 0.5, 5); mb.tube([[x, y + 2.3, z], [x, y + 3.4, z]], 0.5, 5);
        R.rope([x, y + 1.3, z], [x, y + 2.3, z], 0, 1, 0.3, 0); R.rope([x, y, z], [sg * (halfB(tAt(z, y - 4.5), y - 4.5) + 0.4), y - 4.5, z + 0.3], 0, 1, 0.26, 0);
        feet[name][sg].push([x, y + 3.4, z]);
      }
    }
  }
  // port lids: most stand open on their hinges, a few hang, a few are gone
  for (const pt of ports) {
    const r = rng(); if (r < 0.18) continue;
    const ang = r < 0.34 ? -1.0 - rng() * 0.3 : 0.15 + rng() * 0.35, L = 3.3, hw = 1.65;
    const H = [pt.x + pt.sg * 0.15, pt.y1 + 0.05, pt.z], d = [pt.sg * Math.cos(ang), Math.sin(ang), 0], up = [-pt.sg * Math.sin(ang), Math.cos(ang), 0], tip = mad(H, d, L);
    mb.set(K.HULL, 0, 0).color(C.chalk, 0.9);
    const A = [H[0], H[1], H[2] - hw], B = [tip[0], tip[1], tip[2] - hw], Cc = [tip[0], tip[1], tip[2] + hw], D = [H[0], H[1], H[2] + hw], t = 0.28;
    if (pt.sg > 0) { mb.quad(A, D, Cc, B); mb.color(C.inner, 0.75); mb.quad(mad(A, up, -t), mad(B, up, -t), mad(Cc, up, -t), mad(D, up, -t)); }
    else { mb.quad(A, B, Cc, D); mb.color(C.inner, 0.75); mb.quad(mad(A, up, -t), mad(D, up, -t), mad(Cc, up, -t), mad(B, up, -t)); }
    mb.color(C.wale, 0.9); mb.quad(B, Cc, mad(Cc, up, -t), mad(B, up, -t));
    if (ang > 0) for (const s of [-1, 1]) R.rope([tip[0], tip[1], tip[2] + s * hw * 0.8], [pt.x + pt.sg * 0.2, pt.y1 + 3.4, pt.z + s * hw * 0.7], 0.1, 3, 0.16, 0.3);
    pt.lid = ang;
  }
  return feet;
}

// ---------------------------------------------------------------- rigging: every rope a tube of four sides; far off it is never drawn under one pixel wide and pays for the borrowed width in strength
class Rig {
  constructor(lane = null) { this.p = []; this.d = []; this.s = []; this.c = []; this.i = []; this.count = 0; this.lines = []; this.anchors = []; this.lane = lane; }
  // rope from a to b hanging `sag` metres at mid-span; sway 0..1 lets the wind move it; o: { col, rat (a ratline: fades with distance), keep: false (nothing grows on it), kind }
  rope(a, b, sag = 0, segs = 1, w = 0.3, sway = 0, o = {}) {
    const pts = [];
    for (let k = 0; k <= segs; k++) { const t = k / segs; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]); }
    this.poly(pts, w, sway, o);
    return pts;
  }
  poly(pts, w, sway = 0, o = {}) {
    const col = o.col || C.rope, n = pts.length - 1;
    // a rope that would hang within three and a half metres of the lane (tested every two metres of rope) is left out
    if (this.lane) for (let k = 0; k < n; k++) { const a = pts[k], d = sub(pts[k + 1], a), m = Math.max(1, Math.ceil(len(d) / 2)); for (let j = 0; j <= m; j++) if (this.lane.dist(mad(a, d, j / m)) < 3.5 + sway * 2) return; }
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[k + 1], d = norm(sub(b, a));
      const sa = sway * (o.free ? k / n : Math.sin(Math.PI * k / n)), sb = sway * (o.free ? (k + 1) / n : Math.sin(Math.PI * (k + 1) / n));
      const base = this.count, n1 = norm(cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), n2 = cross(d, n1);
      for (const [q, sw] of [[a, sa], [b, sb]]) for (let j = 0; j < 4; j++) {
        const an = (j + 0.5) * Math.PI / 2, ca = Math.cos(an), sn = Math.sin(an);
        this.p.push(q[0], q[1], q[2]); this.d.push(n1[0] * ca + n2[0] * sn, n1[1] * ca + n2[1] * sn, n1[2] * ca + n2[2] * sn); this.s.push(0, w, sw, o.rat ? 1 : 0); this.c.push(col[0], col[1], col[2]); this.count++;
      }
      for (let j = 0; j < 4; j++) { const j2 = (j + 1) % 4; this.i.push(base + j, base + 4 + j, base + 4 + j2, base + j, base + 4 + j2, base + j2); }
    }
    if (o.keep !== false) this.lines.push({ pts, w, kind: o.kind || 'rope', sway, free: !!o.free });
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(this.d, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(this.s, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- masts, tops, yards, bowsprit and all the standing rigging
async function buildMasts(mb, R, rng, feet, pause) {
  const yards = [], masts = {};
  const yard = (name, c, half, r, yaw, tilt, mastName) => {
    const d = [Math.cos(yaw) * Math.cos(tilt), Math.sin(tilt), -Math.sin(yaw) * Math.cos(tilt)], pts = [], rad = [];
    for (let k = -4; k <= 4; k++) { pts.push(mad(c, d, half * k / 4)); rad.push(r * (1 - 0.58 * Math.pow(Math.abs(k) / 4, 1.5))); }
    mb.set(K.SPAR, 0, 0).color(C.spar, 0.97); mb.tube(pts, rad, 7);
    const y = { name, c, d, half, r, a: pts[0], b: pts[8], mast: mastName }; yards.push(y); return y;
  };
  const DEF = [
    ['fore', SHIP.MAST.fore, D_FC, 12, 94, 102, 1.75, 138, 152, 0.012, 5.0],
    ['main', SHIP.MAST.main, D_WAIST, 2.6, 104, 113, 2.0, 152, 170, -0.016, 5.6],
    ['mizzen', SHIP.MAST.mizzen, D_QD, D_QD - 1, 92, 99, 1.35, 120, 129, -0.03, 3.9],
  ];
  for (const [name, zm, yDeck, yFoot, yTop, yHead, r0, yTM, yPole, rake, rT] of DEF) {
    const zc = (y) => zm + rake * (y - yDeck), P = (y, dx = 0, dz = 0) => [dx, y, zc(y) + dz];
    mb.set(K.SPAR, 0, 0).color(C.spar, 1.0);
    const ys = [yFoot, yDeck, lerp(yDeck, yHead, 0.33), lerp(yDeck, yHead, 0.66), yTop, yHead];
    mb.tube(ys.map((y) => P(y)), [1.06, 1, 0.92, 0.82, 0.74, 0.7].map((k) => k * r0), 10, { ao: (i) => (i === 0 ? 0.6 : 1) });
    mb.color(C.rope, 0.85);
    for (let y = yDeck + 7; y < yTop - 6; y += 8.5) { const rr = r0 * lerp(1, 0.76, (y - yDeck) / (yTop - yDeck)) + 0.1; mb.tube([P(y), P(y + 0.9)], rr, 10, { cap: false }); }
    // the top: a round railed platform at the head of the lower mast
    mb.color(C.spar, 0.93);
    mb.lathe([[r0 * 0.8, yTop - 1.8], [rT * 0.93, yTop], [rT, yTop], [rT * 1.05, yTop + 2.6], [rT * 0.98, yTop + 2.6], [rT * 0.93, yTop + 0.55], [r0 * 0.7, yTop + 0.55]], 0, zc(yTop), 14, { ao: (i) => (i < 2 ? 0.7 : 1) });
    for (const sx of [-1, 1]) mb.beam(P(yTop - 0.9, sx * 1.2, -rT * 0.85), P(yTop - 0.9, sx * 1.2, rT * 0.85), 0.5, 0.8);
    mb.box(-1.6, yHead - 0.5, zc(yHead) - 1.4, 1.6, yHead + 0.5, zc(yHead) + 3.2);
    // topmast and pole
    const zt = (y) => zc(y) + 1.8, PT = (y, dx = 0, dz = 0) => [dx, y, zt(y) + dz];
    mb.color(C.spar, 1.0);
    mb.tube([PT(yTop - 1.5), PT(lerp(yTop, yTM, 0.5)), PT(yTM)], [r0 * 0.52, r0 * 0.44, r0 * 0.34], 8);
    mb.tube([PT(yTM - 1), PT(yPole)], [r0 * 0.24, r0 * 0.12], 6);
    mb.lathe([[0.01, yPole - 0.2], [0.55, yPole + 0.3], [0.01, yPole + 0.9]], 0, zt(yPole), 6);
    for (const dz of [-0.7, 0.7]) mb.beam(PT(yTM, -2.6, dz), PT(yTM, 2.6, dz), 0.4, 0.45);
    masts[name] = { zm, yDeck, yTop, yHead, yTM, yPole, r0, rT, zc, zt, P, PT };
    // yards, a little askew as the last wind left them
    const yaw = rng.range(-1, 1) * (name === 'main' ? 0.13 : 0.2), tilt = rng.range(-0.05, 0.05);
    if (name !== 'mizzen') {
      const yl = yDeck + (yTop - yDeck) * 0.76;
      yard(name, P(yl, 0, r0 + 1.0), name === 'main' ? 37 : 30, name === 'main' ? 0.98 : 0.84, yaw, tilt, name);
      yard(name + 'Top', PT(lerp(yTop, yTM, 0.76), 0, r0 * 0.5 + 0.5), name === 'main' ? 21 : 17, name === 'main' ? 0.62 : 0.52, yaw * 0.6 + rng.range(-0.08, 0.08), -tilt, name);
    } else {
      // the mizzen's long lateen yard, peak aft and high
      const a = [-2.2, 57, zm + 22], b = [-2.2, 120, zm - 23], pts = [], rad = [];
      for (let k = 0; k <= 8; k++) { pts.push([a[0], lerp(a[1], b[1], k / 8), lerp(a[2], b[2], k / 8)]); rad.push(0.36 + 0.5 * Math.sin(Math.PI * k / 8)); }
      mb.set(K.SPAR, 0, 0).color(C.spar, 0.97); mb.tube(pts, rad, 7);
      yards.push({ name: 'lateen', c: mad(a, sub(b, a), 0.5), d: norm(sub(b, a)), half: len(sub(b, a)) / 2, r: 0.8, a, b, mast: name, lateen: true });
      yard('mizzenTop', PT(lerp(yTop, yTM, 0.72), 0, 1.2), 10, 0.4, yaw, tilt, name);
    }
    await pause();
  }
  // bowsprit and its spritsail yard
  const bs0 = [0, 39.5, 55], bs1 = [0, 79, 117], bsAt = (k) => [0, lerp(bs0[1], bs1[1], k), lerp(bs0[2], bs1[2], k)];
  mb.set(K.SPAR, 0, 0).color(C.spar, 1.0); mb.tube([bs0, bsAt(0.5), bs1], [1.55, 1.25, 0.8], 9);
  yard('sprit', add(bsAt(0.6), [0, -1.9, 0.6]), 15, 0.5, rng.range(-0.1, 0.1), rng.range(-0.08, 0.08), 'bowsprit');
  masts.bowsprit = { bs0, bs1, bsAt };

  // ---- standing rigging
  const { fore: F, main: Mn, mizzen: Z } = masts;
  for (const [name, m] of [['fore', F], ['main', Mn], ['mizzen', Z]]) {
    for (const sg of [1, -1]) {
      const ft = feet[name][sg], n = ft.length, heads = ft.map((q, k) => m.P(m.yTop - 0.4, sg * 0.9, -0.4 - 0.15 * k));
      for (let k = 0; k < n; k++) R.rope(ft[k], heads[k], 0, 6, 0.3, 0, { kind: 'shroud' });
      // ratlines: the ladder across the shrouds
      const y0 = ft[0][1], y1 = m.yTop - 0.4;
      for (let y = y0 + 2.6; y < y1 - 2; y += 2.1) {
        const k = (y - y0) / (y1 - y0), A = [lerp(ft[0][0], heads[0][0], k), y, lerp(ft[0][2], heads[0][2], k)], B = [lerp(ft[n - 1][0], heads[n - 1][0], k), y, lerp(ft[n - 1][2], heads[n - 1][2], k)];
        R.rope(A, B, 0.12, 1, 0.14, 0, { rat: true, keep: false });
      }
      // futtock shrouds under the top, topmast shrouds above it
      for (let k = 0; k < 3; k++) R.rope(m.P(m.yTop - 0.2, sg * m.rT * 0.98, (k - 1) * 1.6), m.P(m.yTop - 9, sg * 0.9, (k - 1) * 0.4), 0, 1, 0.24, 0, { keep: false });
      const nt = name === 'mizzen' ? 3 : 4;
      for (let k = 0; k < nt; k++) R.rope(m.P(m.yTop + 2.7, sg * m.rT * 1.0, 1.2 - k * 1.3), m.PT(m.yTM - 0.3, sg * 0.5, -0.2), 0, 4, 0.22, 0, { kind: 'shroud' });
      for (let y = m.yTop + 5; y < m.yTM - 3; y += 2.6) {
        const k = (y - m.yTop - 2.7) / (m.yTM - 0.3 - m.yTop - 2.7), xa = sg * lerp(m.rT, 0.5, k);
        R.rope([xa, y, lerp(m.zc(m.yTop) + 1.2, m.zt(m.yTM) - 0.2, k)], [xa, y, lerp(m.zc(m.yTop) + 1.2 - (nt - 1) * 1.3, m.zt(m.yTM) - 0.2, k)], 0.06, 1, 0.12, 0, { rat: true, keep: false });
      }
      // backstays from the topmast head to the after end of the channel
      const last = ft[n - 1];
      R.rope([last[0] + sg * 0.1, last[1] - 3.2, last[2] - 2.2], m.PT(m.yTM - 0.5, sg * 0.4, -0.3), 0, 8, 0.26, 0.15, { kind: 'stay' });
      await pause();
    }
  }
  const bsp = masts.bowsprit;
  const stay = (a, b, w, sag = 0) => R.rope(a, b, sag, 10, w, 0.12, { kind: 'stay' });
  stay(F.P(F.yTop + 0.5, 0, 1.2), add(bsp.bsAt(0.52), [0, 1.3, 0]), 0.42);
  stay(F.PT(F.yTM - 0.5, 0, 0.5), add(bsp.bsAt(0.97), [0, 0.9, 0]), 0.3);
  stay(Mn.P(Mn.yTop + 0.5, 1.7, 1.6), [2.9, 43.5, 57.5], 0.5, 1.5);
  stay(Mn.PT(Mn.yTM - 0.5, 0, 0.5), F.P(F.yTop + 2.4, 0, -F.rT), 0.3, 1);
  stay(Z.P(Z.yTop + 0.5, 0, 1), Mn.P(D_WAIST + 16, 0, -2.1), 0.36, 1);
  stay(Z.PT(Z.yTM - 0.4, 0, 0.4), Mn.P(Mn.yTop + 2.5, 0, -Mn.rT), 0.24, 1);
  R.rope(add(bsp.bsAt(0.55), [0, -1.3, 0]), [0, 30.5, zStem(30.5) + 1.2], 0, 1, 0.4, 0, { keep: false });
  for (const sg of [1, -1]) R.rope(add(bsp.bsAt(0.72), [sg * 0.8, -0.6, 0]), [sg * 8.2, 37.5, 62.5], 0.4, 6, 0.28, 0.1, { kind: 'stay' });
  // lifts from every yardarm to its masthead; braces and loose lines hanging where they were left
  for (const y of yards) {
    if (y.lateen) {
      R.rope(y.b, Z.PT(Z.yTM - 0.6, 0, -0.3), 1.2, 8, 0.22, 0.3, { kind: 'stay' }); R.rope(mad(y.c, y.d, y.half * 0.45), Z.P(Z.yHead, 0, -0.5), 0.5, 5, 0.22, 0.2, { kind: 'stay' });
      R.rope(y.b, [-3, 57.5, -99.5], 4.5, 12, 0.24, 0.5, { kind: 'loose' }); R.rope(y.a, [-6, D_QD + 4.4, Z_QD - 0.4], 0.8, 5, 0.26, 0.2, { kind: 'stay' });
      continue;
    }
    const m = masts[y.mast], top = y.mast === 'bowsprit' ? add(bsp.bsAt(0.97), [0, 0.6, 0]) : y.name.endsWith('Top') ? m.PT(m.yTM - 0.4, 0, 0.3) : m.P(m.yHead - 0.5, 0, 0.6);
    for (const e of [y.a, y.b]) R.rope(e, top, 0.4, 6, 0.2, 0.15, { kind: 'stay' });
    if (y.mast === 'bowsprit') continue;
    // braces run aft and down to the rail, slack now
    const aft = y.mast === 'main' ? -44 : -92;
    for (const e of [y.a, y.b]) {
      const sg = Math.sign(e[0]) || 1, ry = railY(aft) + 0.6, rx = sg * (halfB(tAt(aft, ry), ry) - 0.4);
      if (y.name.endsWith('Top')) continue;
      if (y.mast === 'fore') R.rope(e, Mn.P(Mn.yTop - 4, sg * 1.2, 0.5), 5 + rng() * 3, 12, 0.2, 0.4, { kind: 'stay' });
      else R.rope(e, [rx, ry, aft], 7 + rng() * 5, 14, 0.2, 0.6, { kind: 'loose' });
    }
    // clewlines and sheets that have let go: they hang straight down and stir
    const nl = y.name.endsWith('Top') ? 2 : 4;
    for (let k = 0; k < nl; k++) {
      const s = rng.range(-0.95, 0.95), a = mad(y.c, y.d, s * y.half), L = rng.range(8, y.name.endsWith('Top') ? 20 : 30);
      R.rope(add(a, [0, -y.r, 0]), add(a, [rng.range(-1.5, 1.5), -L, rng.range(-1.5, 1.5)]), 0, 8, 0.18, 1, { kind: 'loose', free: true });
    }
  }
  return { yards, masts };
}

// ---------------------------------------------------------------- shading shared by everything that belongs to the ship
// Light arrives as uniforms (ship-local sun direction, sun and sky colours), so the nave can be lit by what truly comes in:
// holdSun() follows the ray from a point inside her toward the sun and asks whether it leaves by a hatch, a grating or a gunport.
const G_COMMON = /* glsl */`
uniform vec3 uSunL, uSunCol, uSkyCol, uGndCol, uHoldAmb, uPortalCol, uYellow;
uniform float uTime, uDrift, uLantern, uNight;
float h13(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x), mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x), mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x), f.y), f.z); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
float fbm3(vec3 p){ return .5*n3(p)+.3*n3(p*2.03+7.1)+.2*n3(p*4.1+3.3); }
float gOpen(vec2 q, vec2 c, vec2 h, float bars){
  vec2 d=abs(q-c)-h; float e=1.-smoothstep(-.35,.35,max(d.x,d.y));
  vec2 f=abs(fract(q/1.3)-.5); float b=smoothstep(.1,.2,f.x)*smoothstep(.1,.2,f.y);
  return e*mix(1.,b,bars); }
float hullW(float z, float y){
  float t=clamp((z+94.)/154.15,0.,1.), f=1.;
  if(t>.6){ float e=(t-.6)/.4; f=pow(max(1.-pow(e,2.4),0.),.62); }
  if(t<.34){ float e=1.-t/.34; f*=1.-e*e*.4; }
  return 19.7*f-1.1; }
float sheerY(float z){ float t=clamp((z+94.)/154.15,0.,1.), a=max(t-.45,0.)/.55, b=max(.45-t,0.)/.45; return 2.5*a*a+2.2*b*b; }
// sunlight reaching a point inside the hull (ship-local): 0 dark .. 1 in a bar of sun
float holdSun(vec3 p){
  vec3 L=uSunL; float ly=max(L.y,.1), s=0.;
  vec2 h30=p.xz+L.xz*((30.-p.y)/ly), h38=p.xz+L.xz*((38.-p.y)/ly), h46=p.xz+L.xz*((46.-p.y)/ly);
  if(p.y<30. && h30.y>${Z_QD.toFixed(1)}){ if(h30.y<${Z_FC.toFixed(1)}) s=gOpen(h30,vec2(0.,${((SHIP.HATCH.z0 + SHIP.HATCH.z1) / 2).toFixed(2)}),vec2(${SHIP.HATCH.hw.toFixed(1)},${((SHIP.HATCH.z1 - SHIP.HATCH.z0) / 2).toFixed(2)}),0.)
      +gOpen(h30,vec2(0.,${((SHIP.GRATE_F.z0 + SHIP.GRATE_F.z1) / 2).toFixed(2)}),vec2(${SHIP.GRATE_F.hw.toFixed(1)},${((SHIP.GRATE_F.z1 - SHIP.GRATE_F.z0) / 2).toFixed(2)}),1.); }
  else if(p.y<38. && h38.y>${Z_POOP.toFixed(1)}){ if(h38.y<${Z_QD.toFixed(1)}) s=gOpen(h38,vec2(0.,${((SHIP.GRATE_Q.z0 + SHIP.GRATE_Q.z1) / 2).toFixed(2)}),vec2(${SHIP.GRATE_Q.hw.toFixed(1)},${((SHIP.GRATE_Q.z1 - SHIP.GRATE_Q.z0) / 2).toFixed(2)}),1.); }
  else if(h46.y<${Z_POOP.toFixed(1)}) s=gOpen(h46,vec2(0.,${((SHIP.GRATE_P.z0 + SHIP.GRATE_P.z1) / 2).toFixed(2)}),vec2(${SHIP.GRATE_P.hw.toFixed(1)},${((SHIP.GRATE_P.z1 - SHIP.GRATE_P.z0) / 2).toFixed(2)}),1.);
  // through the gunports of the sunward side
  float sx=L.x<0.?-1.:1., lx=max(abs(L.x),.06), w=18.5, tt=max((w-sx*p.x)/lx,0.); vec3 hp=p+L*tt;
  w=hullW(hp.z,hp.y); tt=max((w-sx*p.x)/lx,0.); hp=p+L*tt;
  float py=hp.y-(21.2+sheerY(hp.z)), pz=mod(hp.z+70.8,9.6)-4.8;
  float port=step(-67.7,hp.z)*step(hp.z,41.3)*smoothstep(-.25,.25,py)*(1.-smoothstep(2.95,3.45,py))*(1.-smoothstep(1.35,1.85,abs(pz)));
  return clamp(max(s,port),0.,1.); }
// the soft light that fills the nave: brightest under the open hatch and by the stern windows
vec3 holdAmbient(vec3 p, vec3 n){
  float dh=length(vec2(p.x*.6,p.z-(${((SHIP.HATCH.z0 + SHIP.HATCH.z1) / 2).toFixed(2)})))/22.;
  float q1=(p.z+42.8)/14., q2=(p.z+79.)/12., open=exp(-dh*dh)+.5*exp(-q1*q1)+.5*exp(-q2*q2);
  float up=.55+.45*n.y;
  float q3=max(p.z+96.,0.)/20., win=exp(-q3*q3)*(.45+.55*clamp(-n.z,0.,1.));
  return uHoldAmb*(.5+1.3*open*up)+uPortalCol*win; }
// fallen flowers scattered on a surface: round, two sizes, never a grid (dens 0..1)
float fallen(vec2 q, float dens){
  float a=0.;
  for(int k=0;k<2;k++){ vec2 g=k==0?q*2.1:mat2(.8,-.6,.6,.8)*q*3.4+17.; vec2 c=floor(g), f=fract(g)-.5; float fk=float(k)*31.;
    vec2 o=(vec2(h12(c+3.+fk),h12(c+5.+fk))-.5)*.5; float r=.13+.11*h12(c+9.+fk);
    a=max(a,smoothstep(r,r*.55,length(f-o))*step(1.-dens,h12(c+fk))); }
  return a; }
// broad slow pools of sun and shade that the canopy and the mist lay over her
float dapple(vec3 p){
  vec2 q=p.xz-uSunL.xz*(p.y/max(uSunL.y,.15));
  float a=n2(q*.021+vec2(uTime*.012,0.)), b=n2(q*.055+vec2(3.1,uTime*.02));
  return .5+.5*smoothstep(.28,.62,a*.65+b*.35); }
`;
const SHIP_VERT = /* glsl */`
attribute vec4 aM;
varying vec3 vP, vN, vC; varying vec2 vUv; varying vec4 vM;
#include <fog_pars_vertex>
void main(){
  vP=position; vN=normal; vC=color; vUv=uv; vM=aM;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHIP_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vUv; varying vec4 vM;
#include <fog_pars_fragment>
${G_COMMON}
void main(){
  vec3 N=normalize(vN), p=vP; float kind=floor(vM.x+.5), inside=vM.z, ex=vM.w;
  vec3 alb=vC; float h=0.;
  float px=length(fwidth(vUv))+1e-4, pv=fwidth(vUv.y)+1e-4, fine=clamp(1.2-px*3.,0.,1.), mid=clamp(1.3-px*.9,0.,1.), midS=clamp(1.5-pv*1.3,0.,1.);
  float grain=n2(vUv*vec2(.35,5.))*.4+n2(vUv*vec2(1.3,17.))*.35+n2(vUv*vec2(4.,61.))*.25*clamp(1.2-pv*14.,0.,1.);
  float powder=fbm3(p*.11);
  if(kind<2.5){
    // planking: strakes along the run of the timber, butts staggered from strake to strake
    float wdt=kind<.5?1.05:kind<1.5?1.2:1.4;
    float sv=vUv.y/wdt, id=floor(sv), fv=fract(sv);
    float seam=smoothstep(.0,.07,fv)*smoothstep(1.,.93,fv);
    float bu=vUv.x/9.+h12(vec2(id,3.7))*7., fb=fract(bu), butt=smoothstep(.0,.012,fb)*smoothstep(1.,.988,fb);
    float plank=h12(vec2(id,floor(bu)));
    float timber=step(.5,ex);
    seam=mix(1.,mix(seam*mix(1.,butt,mid),1.,timber),midS);
    alb*=mix(1.,.9+.2*plank,mid*(1.-timber))*(.9+.2*grain*fine);
    alb*=mix(.6,1.,seam); h+=seam*.6+grain*.15*fine;
  } else if(kind<3.5){
    alb*=.88+.24*grain*fine; h+=grain*.3*fine;
  } else if(kind<4.5){
    float r=n3(p*1.7); alb*=.7+.5*r; alb=mix(alb,vec3(.42,.47,.36),smoothstep(.45,.7,n3(p*.6+9.))*.7); h+=r*.6;
  } else if(kind<5.5){
    // carving: scrolls and rosettes cut into the pale wood, a ghost of gilt left in the hollows
    vec2 q=vUv*1.15; float sc=sin(q.x*2.+sin(q.y*2.)*1.4)*sin(q.y*2.+cos(q.x*2.)*1.4);
    float ro=length(fract(q*.5)-.5); float cv=mix(.5,smoothstep(-.2,.5,sc)*.7+smoothstep(.34,.2,ro)*.5,step(.5,ex))*mid;
    alb*=.8+.3*cv; alb=mix(alb,alb*vec3(1.05,.93,.62),(1.-cv)*.35*step(.5,ex)); h+=cv*1.3+grain*.1;
  } else if(kind<6.5){
    float r=fbm3(p*.9); alb*=.75+.5*r; h+=r;
  }
  if(kind<6.5){
    // a dry bloom of chalk over everything; below the old waterline an armour of dead barnacles; moss where damp lingers
    alb=mix(alb,vec3(.86,.85,.8),.22*smoothstep(.35,.75,powder)*(1.-inside));
    if(inside<.5 && kind<.5){
      float line=17.5+3.*(n2(p.zy*.09)-.5)+sheerY(p.z);
      float crust=smoothstep(line+1.2,line-2.5,p.y);
      float c1=n3(p*1.9), c2=n3(p*4.3+11.);
      float cells=1.-abs(c1*2.-1.); cells=clamp(cells,0.,1.); cells=mix(.55,cells*cells*.7+.3*(1.-abs(c2*2.-1.)),mid);
      vec3 bar=mix(vec3(.56,.6,.57),vec3(.84,.85,.8),cells)*(.86+.24*n3(p*.35));
      alb=mix(alb,bar,crust*.92); h=mix(h,cells*.75,crust);
      float damp=fbm3(p*vec3(.16,.34,.16)+4.);
      float moss=smoothstep(.5,.68,damp+.16*N.y)*smoothstep(line-4.,line+3.,p.y)*smoothstep(46.,24.,p.y)*.8;
      moss=max(moss,smoothstep(.52,.7,damp)*crust*.45);
      alb=mix(alb,vec3(.26,.36,.17)*(.7+.6*c2),moss); h+=moss*c2*1.2;
    } else if(inside<.5 && N.y>.2){
      float moss=smoothstep(.56,.72,fbm3(p*.21+2.))*smoothstep(.2,.7,N.y)*.5;
      alb=mix(alb,vec3(.28,.38,.18),moss);
    }
    if(inside>.5){ alb*=mix(vec3(.74,.82,.66),vec3(1.),smoothstep(4.,20.,p.y)); }
  }
  // the yellow flowers lie in drifts wherever a surface looks up
  float upFace=smoothstep(.55,.9,N.y);
  if(upFace>0. && kind<6.5){
    float base=kind>.5&&kind<1.5?(inside>.5?.95:.62):kind>1.5&&kind<2.5?.7:kind>2.5&&kind<3.5?.3:.18;
    float cover=clamp(base+uDrift*.5,0.,1.);
    float pch=n2(p.xz*.16)*.6+n2(p.xz*.55+5.)*.4;
    float m=smoothstep(1.-cover,1.-cover+.3,pch+.12);
    float tone=.82+.36*n2(p.xz*1.9+3.);
    float carpet=smoothstep(.5,.95,m)*(.55+.45*smoothstep(.25,.7,n2(p.xz*2.7)));
    float fl=upFace*mix(m*.8,max(fallen(p.xz,m*.9),carpet),fine);
    alb=mix(alb,uYellow*tone*(.85+.25*n2(p.xz*5.3)),fl); h+=fl*.8;
  }
  // relief from the painted height
  { vec3 dpx=dFdx(p), dpy=dFdy(p); float dhx=dFdx(h), dhy=dFdy(h);
    vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
    vec3 g=sign(det)*(dhx*r1+dhy*r2); N=normalize(abs(det)*N-.09*mid*g+1e-6*N); }
  float ndl=dot(N,uSunL), ao=vM.y;
  vec3 col;
  if(inside>.5){
    float sun=holdSun(p);
    col=alb*(uSunCol*sun*(.35+.65*max(ndl,0.))+holdAmbient(p,N)*ao);
  } else {
    float sh=dapple(p);
    if(kind>.5&&kind<1.5){ // the deck lies in the shadow of the sunward bulwark
      float sx=uSunL.x<0.?-1.:1., lx=max(abs(uSunL.x),.05); float w=hullW(p.z,p.y+4.)+.4, tt=max((w-sx*p.x)/lx,0.);
      sh*=smoothstep(-.4,.6,p.y+uSunL.y*tt-(p.y+4.6)); }
    vec3 amb=(mix(uGndCol,uSkyCol,N.y*.5+.5)+uSunCol*vec3(.85,1.,.7)*.09*(1.-.5*N.y))*ao;
    col=alb*(uSunCol*max(ndl,0.)*sh*mix(.75,1.,ao)+amb+uSunCol*.07*max(-ndl,0.)*vec3(.7,.9,.6));
  }
  if(kind>6.5){ float f=(1.-abs(N.y))*(1.-abs(N.y)); col=vC*(uSkyCol*(.6+f)+uSunCol*.15)+vec3(1.,.78,.42)*ex*uLantern*(1.6+.5*sin(uTime*2.3+p.x)); }
  col+=alb*uNight*vec3(.05,.07,.09);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

const ROPE_VERT = /* glsl */`
attribute vec3 aDir; attribute vec4 aS;
uniform float uTime, uResY;
varying vec3 vC, vP, vN; varying float vCov;
#include <fog_pars_vertex>
void main(){
  vec3 p=position; float ph=p.x*.21+p.z*.17;
  p.xz+=aS.z*vec2(sin(uTime*.7+ph)+.4*sin(uTime*1.9+ph*2.), cos(uTime*.53+ph*1.3))*.8;
  vP=p; vC=color; vN=normalize(aDir);
  // a rope is a tube of four sides; aDir is the way out from its axis. Far off it is never drawn under one pixel wide (so that it does not
  // flicker), and the width it borrows for that it gives back in strength: vCov is its true width over its drawn width. A ratline thins out of
  // sight between 110 and 240 m in the same way, by strength.
  vec4 wp=modelMatrix*vec4(p,1.); vec3 wr=normalize(mat3(modelMatrix)*aDir);
  float d=distance(cameraPosition,wp.xyz);
  float pxl=2./(projectionMatrix[1][1]*max(uResY,1.));
  float w=max(aS.y,d*pxl);
  vCov=aS.y/w*(1.-aS.w*smoothstep(110.,240.,d));
  wp.xyz+=wr*(w*.58);
  vec4 mvPosition=viewMatrix*wp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ROPE_FRAG = /* glsl */`
varying vec3 vC, vP, vN; varying float vCov;
#include <fog_pars_fragment>
${G_COMMON}
void main(){
  vec3 n=normalize(vN); float lit=.5+.5*dot(n,uSunL);
  vec3 col=vC*(uSkyCol*(.62+.3*(n.y*.5+.5))+uGndCol*.25+uSunCol*.62*dapple(vP)*(.45+.55*lit));
  col+=vC*uNight*vec3(.05,.07,.09);
  float a=clamp(vCov,0.,1.); if(a<.02) discard;
  gl_FragColor=vec4(col,a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the rags of her sails: cloth that hangs from the yards and stirs, eaten away from the bottom up
function buildRags(yards, rng, keep, lane) {
  const pos = [], uvs = [], ar = [], nr = [], idx = []; let count = 0;
  const piece = (a, along, w, drop, bow, seed) => {
    const nx = Math.max(2, Math.round(w / 3)), ny = Math.max(4, Math.round(drop / 3.2)), base = count, fwd = norm(cross(along, [0, 1, 0]));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const u = i / nx, v = j / ny, sagX = Math.sin(Math.PI * u), bl = bow * Math.sin(Math.PI * Math.min(v * 1.2, 1)) * (0.4 + 0.6 * sagX);
      const p = [a[0] + along[0] * u * w + fwd[0] * bl, a[1] + along[1] * u * w - drop * v * (0.92 + 0.08 * sagX), a[2] + along[2] * u * w + fwd[2] * bl];
      pos.push(p[0], p[1], p[2]); uvs.push(u, v); ar.push(v, seed, drop, w); nr.push(fwd[0], 0.15, fwd[2]); count++;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = base + j * (nx + 1) + i; idx.push(q, q + 1, q + nx + 2, q, q + nx + 2, q + nx + 1); }
  };
  // a rag hangs no nearer the lane than five and a half metres: it is shortened until it clears, or left out
  const clearOf = (a, along, w, drop) => { for (let j = 1; j <= 6; j++) for (let i = 0; i <= 4; i++) { const u = i / 4, v = j / 6; if (lane.dist([a[0] + along[0] * u * w, a[1] + along[1] * u * w - drop * v, a[2] + along[2] * u * w]) < 5.5) return false; } return true; };
  const hang = (a, along, w, drop, bow, seed) => { let d = drop; for (let k = 0; k < 9 && !clearOf(a, along, w, d); k++) d *= 0.8; if (clearOf(a, along, w, d)) piece(a, along, w, d, bow, seed); };
  for (const y of yards) {
    const k = keep(y), L = y.half * 2, top = y.name.endsWith('Top') || y.name === 'sprit';
    const maxDrop = y.lateen ? 40 : y.name === 'sprit' ? 14 : top ? 26 : 44;
    if (y.lateen) {
      // the lateen's cloth hangs in strips under the slanting yard
      for (let s = 0.08; s < 0.9; s += rng.range(0.09, 0.2)) {
        if (rng() > k + 0.25) continue;
        const w = rng.range(3.5, 8), a = mad(y.a, y.d, s * L), room = a[1] - (s < 0.5 ? 46 : 54);
        hang(add(a, [0, -0.7, 0]), [0, 0, -1], w, clamp(rng.range(0.3, 1) * maxDrop * (0.4 + k), 5, Math.max(room, 6)), rng.range(-1, 1.5), rng() * 40);
      }
      continue;
    }
    let s = 0.03;
    while (s < 0.97) {
      const big = rng() < k, w = Math.min(big ? rng.range(9, 17) : rng.range(2.2, 6), (0.98 - s) * L), gap = rng() < k ? rng.range(0, 0.02) : rng.range(0.03, 0.16);
      if (rng() < 0.45 + k * 0.55) {
        const drop = (big ? rng.range(0.55, 1) : rng.range(0.15, 0.7)) * maxDrop * (0.45 + 0.55 * k);
        hang(add(mad(y.a, y.d, s * L), [0, -y.r * 0.8, 0]), y.d, w, Math.max(drop, 4), rng.range(0.5, 2.5) * (big ? 1.6 : 0.7), rng() * 40);
      }
      s += w / L + gap;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(ar, 4)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
  g.setIndex(count > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere();
  return g;
}
const RAG_VERT = /* glsl */`
attribute vec4 aR;
uniform float uTime;
varying vec3 vP, vN; varying vec2 vUv; varying vec4 vR;
#include <fog_pars_vertex>
void main(){
  vec3 p=position; float pin=aR.x, ph=aR.y;
  float sw=sin(uTime*.9+ph+pin*2.6+p.x*.08)+.45*sin(uTime*2.1+ph*1.7+pin*6.);
  float amp=pin*pin*(1.2+.045*aR.z);
  p+=normal*(sw*amp)+vec3(.3,0.,0.)*sin(uTime*.6+ph)*amp;
  vP=p; vN=normal; vUv=uv; vR=aR;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RAG_FRAG = /* glsl */`
varying vec3 vP, vN; varying vec2 vUv; varying vec4 vR;
#include <fog_pars_fragment>
${G_COMMON}
void main(){
  vec2 q=vec2(vUv.x*vR.w, vUv.y*vR.z);
  // tatters: whole at the yard, gnawed to ribbons toward the foot; a few holes worn through
  float fr=n2(vec2(q.x*.55+vR.y,q.y*.12))*.65+n2(vec2(q.x*1.9+vR.y*3.,q.y*.5))*.35;
  float edge=min(vUv.x,1.-vUv.x)*vR.w;
  float lim=1.08-vUv.y*(.75+.35*n2(vec2(vR.y,q.x*.2)))-.35*(1.-smoothstep(0.,.9,edge))*vUv.y;
  if(fr>lim) discard;
  if(n2(q*.42+vR.y*5.)>.8 && vUv.y>.12) discard;
  vec3 cloth=vec3(.69,.66,.56)*(.72+.28*n2(q*vec2(.9,.25)+vR.y))*(.86+.14*n2(q*vec2(7.,7.)));
  cloth=mix(cloth,vec3(.36,.42,.26),smoothstep(.45,.9,vUv.y*n2(q*.3+2.))*.5);
  cloth*=.8+.2*smoothstep(.0,.06,fract(q.x/2.4));
  vec3 N=normalize(vN); float ndl=dot(N,uSunL);
  float lit=.42*abs(ndl)+.34+.3*max(-ndl,0.);
  vec3 col=cloth*(uSunCol*lit*dapple(vP)+mix(uGndCol,uSkyCol,.65));
  col+=cloth*uNight*vec3(.06,.08,.1);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- what grows on her: orchids, strap-leaved air plants, hanging moss, ferns in the gunports
// one mesh of cards; the fragment shader cuts each card to its shape (aQ: u, v, kind, sway)
class Cards {
  constructor() { this.p = []; this.q = []; this.c = []; this.i = []; this.count = 0; }
  // a card from `base`, `len` along `dir`, `wid` across `side`; kind 0 strap leaf, 1 orchid bloom, 2 hanging moss, 3 fern frond, 4 lily pad of barnacles (unused)
  card(base, dir, side, len, wid, kind, col, sway0, sway1, bend = 0, down = [0, -1, 0]) {
    const n = kind === 2 || kind === 3 || kind === 0 ? 3 : 1, b0 = this.count;
    for (let k = 0; k <= n; k++) {
      const t = k / n, c = [base[0] + dir[0] * len * t + down[0] * bend * t * t, base[1] + dir[1] * len * t + down[1] * bend * t * t, base[2] + dir[2] * len * t + down[2] * bend * t * t], sw = lerp(sway0, sway1, t);
      for (const s of [-1, 1]) { this.p.push(c[0] + side[0] * wid * 0.5 * s, c[1] + side[1] * wid * 0.5 * s, c[2] + side[2] * wid * 0.5 * s); this.q.push(s * 0.5 + 0.5, t, kind, sw); this.c.push(col[0], col[1], col[2]); this.count++; }
      if (k > 0) { const a = b0 + (k - 1) * 2; this.i.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  async geometry(pause) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await pause();
    g.setAttribute('aQ', new THREE.Float32BufferAttribute(this.q, 4)); await pause();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await pause();
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1)); await pause();
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, -10), 150);
    return g;
  }
}
const CARD_VERT = /* glsl */`
attribute vec4 aQ;
uniform float uTime;
varying vec3 vP, vC; varying vec4 vQ;
#include <fog_pars_vertex>
void main(){
  vec3 p=position; float ph=p.x*.21+p.z*.17;
  p.xz+=aQ.w*vec2(sin(uTime*.7+ph)+.4*sin(uTime*1.9+ph*2.), cos(uTime*.53+ph*1.3))*.8;
  p.y+=aQ.w*.2*sin(uTime*1.7+ph+p.y*.4);
  vP=p; vC=color; vQ=aQ;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CARD_FRAG = /* glsl */`
varying vec3 vP, vC; varying vec4 vQ;
#include <fog_pars_fragment>
${G_COMMON}
void main(){
  float kind=floor(vQ.z+.5); vec2 q=vec2(vQ.x*2.-1., vQ.y); vec3 col=vC; float a=1., glow=0.;
  if(kind<.5){            // strap leaf: a blade that tapers to a point, pale midrib
    float w=(.25+.75*smoothstep(0.,.25,q.y))*(1.-q.y*q.y); a=step(abs(q.x),w); col*=.75+.25*smoothstep(.0,.18,abs(q.x))+.2*q.y;
  } else if(kind<1.5){    // orchid: three broad sepals, two petals, a darker lip with a yellow throat
    vec2 c=vec2(q.x, q.y*2.-1.); float r=length(c), th=atan(c.y,c.x+1e-5);
    float lobes=.5+.42*cos(th*5.+1.5708); a=step(r,lobes);
    float lip=smoothstep(.36,.1,length(c-vec2(0.,-.3)));
    col=mix(col,col*vec3(.55,.3,.5)+vec3(.25,.02,.1),lip*.8); col=mix(col,vec3(1.,.8,.15),smoothstep(.16,.05,r));
    col*=.8+.3*smoothstep(0.,.6,r); glow=.25;
  } else if(kind<2.5){    // hanging moss: grey-green threads, thinning toward their ends
    float s1=sin(q.x*9.+sin(q.y*7.+vP.x)*1.3), s2=sin(q.x*17.+cos(q.y*11.)*1.7+2.);
    float th=mix(.35,.9,q.y)*(1.+.3*abs(q.x)); a=step(th,max(abs(s1),abs(s2)*.9))*step(abs(q.x),1.-q.y*.35)*step(q.y,.98);
    col*=.85+.3*abs(s2);
  } else {                // fern frond: a midrib with pinnae either side
    float w=(1.-q.y)*(.25+.75*smoothstep(0.,.12,q.y)); float pin=step(fract(q.y*13.),.62);
    a=max(step(abs(q.x),.05), step(abs(q.x),w)*pin); col*=.7+.4*abs(q.x)+.25*q.y;
  }
  if(a<.5) discard;
  float sh=dapple(vP);
  vec3 lit=uSunCol*sh*.62+mix(uGndCol,uSkyCol,.7)*1.05;
  vec3 c=col*lit*(1.+glow);
  c+=col*uNight*vec3(.07,.09,.1);
  gl_FragColor=vec4(c,1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the forest of flowers: four plants built of real petals, instanced by the thousand
class FB {
  constructor() { this.p = []; this.n = []; this.c = []; this.f = []; this.uv = []; this.i = []; this.count = 0; }
  v(p, n, c, y, mask, u = 9, w = 0) { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.f.push(Math.min(0.9, 0.05 * Math.pow(Math.max(y, 0), 1.4)), mask); this.uv.push(u, w); return this.count++; }
  // a petal or a leaf: a strip from base to tip that the fragment shader cuts to its outline (u across -1..1, v along 0..1);
  // `soft` leans the normals toward one direction so that a whole flower takes the light as one thing and not as facets
  blade(base, tip, side, c0, c1, mask, arch = 0, soft = null, segs = 1) {
    const d = sub(tip, base), L = len(d); let n = norm(cross(d, side)); if (n[1] < 0) n = mul(n, -1);
    const ns = soft ? norm(mad(mul(soft, 0.75), n, 0.45)) : n, sl = len(side) || 1, nl = norm(mad(ns, side, 0.3 / sl)), nr = norm(mad(ns, side, -0.3 / sl));
    let pa = -1, pb = -1;
    for (let k = 0; k <= segs; k++) {
      const t = k / segs, q = mad(mad(base, d, t), n, arch * L * 4 * t * (1 - t)), c = mix3(c0, c1, t);
      const a = this.v(add(q, side), nl, c, q[1], mask, 1, t), b = this.v(sub(q, side), nr, c, q[1], mask, -1, t);
      if (k > 0) this.i.push(pa, pb, b, pa, b, a);
      pa = a; pb = b;
    }
  }
  bloom(c, axis, n, r, cup, twist = 0) {
    const ax = norm(axis); let u = cross(ax, Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = norm(u); const w = cross(ax, u);
    for (let k = 0; k < n; k++) {
      const a = twist + (k / n) * TAU, rad = [u[0] * Math.cos(a) + w[0] * Math.sin(a), u[1] * Math.cos(a) + w[1] * Math.sin(a), u[2] * Math.cos(a) + w[2] * Math.sin(a)];
      const dir = norm(mad(mul(rad, Math.cos(cup)), ax, Math.sin(cup))), side = mul(cross(ax, rad), r * (n > 5 ? 0.36 : n > 4 ? 0.44 : 0.5));
      this.blade(c, mad(c, dir, r), side, PET0, PET1, 1, 0, ax, 1);
    }
    // the eye of the flower
    const e = mad(c, ax, r * 0.1), s = r * 0.17, y = [1.0, 0.8, 0.14];
    const i0 = this.v(mad(e, u, s), ax, y, e[1], 0), i1 = this.v(mad(e, w, s), ax, y, e[1], 0), i2 = this.v(mad(e, u, -s), ax, y, e[1], 0), i3 = this.v(mad(e, w, -s), ax, y, e[1], 0);
    this.i.push(i0, i1, i2, i0, i2, i3);
  }
  stem(a, b, w, c, both = true) {
    for (const s of both ? [[w, 0, 0], [0, 0, w]] : [[w * 0.8, 0, w * 0.6]]) {
      const n = norm(cross(sub(b, a), s)), i0 = this.v(sub(a, s), n, mul(c, 0.6), a[1], 0), i1 = this.v(add(a, s), n, mul(c, 0.6), a[1], 0), i2 = this.v(mad(b, s, 0.6), n, c, b[1], 0), i3 = this.v(mad(b, s, -0.6), n, c, b[1], 0);
      this.i.push(i0, i1, i2, i0, i2, i3);
    }
  }
  leaves(n, y0, y1, L, wid, a0, up, rng) {
    for (let k = 0; k < n; k++) { const a = a0 + k * 2.2 + rng.range(-0.3, 0.3), y = lerp(y0, y1, n > 1 ? k / (n - 1) : 0), d = norm([Math.cos(a), up + rng.range(-0.15, 0.15), Math.sin(a)]), l = L * rng.range(0.75, 1.2); this.blade([0, y, 0], mad([0, y, 0], d, l), mul(norm(cross(d, [0, 1, 0])), wid * l), LEAF0, LEAF1, 0, 0.09, null, 2); }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(this.f, 2)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  }
}
const LEAF0 = [0.05, 0.17, 0.05], LEAF1 = [0.2, 0.45, 0.12], PET0 = [0.8, 0.78, 0.76], PET1 = [1.06, 1.06, 1.06];
// six plants, in metres (she is four times life size, and so are they): tall spire, spire, great lily, lily, mound, leafy clump
function flowerGeometries(rng) {
  const out = [];
  const spire = (H, n, r0, r1, nl) => {
    const g = new FB(), bx = rng.range(-0.05, 0.05) * H, bz = rng.range(-0.05, 0.05) * H, at = (t) => [bx * t * t, H * t, bz * t * t];
    g.stem(at(0), at(0.5), 0.16, LEAF1); g.stem(at(0.5), at(1), 0.11, LEAF1);
    for (let k = 0; k < n; k++) { const t = 0.36 + 0.63 * (k / (n - 1)), a = k * 2.4 + rng.range(-0.3, 0.3), rad = [Math.cos(a), 0, Math.sin(a)], r = lerp(r0, r1, k / (n - 1)); g.bloom(mad(at(t), rad, 0.22 + r * 0.25), [rad[0], rng.range(0.15, 0.6), rad[2]], 4, r, 0.45, a); }
    g.leaves(nl, 0.4, H * 0.28, H * 0.2 + 1.2, 0.2, rng() * TAU, 0.6, rng);
    return { g: g.geometry(), h: H };
  };
  const lily = (H, n, r, nl) => {
    const g = new FB(), a0 = rng() * TAU, top = [Math.cos(a0) * H * 0.08, H * 0.94, Math.sin(a0) * H * 0.08], mid = [top[0] * 0.4, H * 0.58, top[2] * 0.4];
    g.stem([0, 0, 0], mid, 0.15, LEAF1); g.stem(mid, top, 0.1, LEAF1);
    g.bloom(top, [Math.cos(a0) * 0.4, 1, Math.sin(a0) * 0.4], 6, r, 0.6, 0.3);
    for (let k = 1; k < n; k++) { const a = a0 + k * 2.3, t = 0.52 + 0.14 * k, from = [mid[0] * t, H * 0.56 * t + H * 0.06, mid[2] * t], c = [from[0] + Math.cos(a) * r * 1.2, H * (0.62 + 0.1 * k), from[2] + Math.sin(a) * r * 1.2]; g.stem(from, c, 0.08, LEAF1, false); g.bloom(c, [Math.cos(a) * 0.8, 0.75, Math.sin(a) * 0.8], 6, r * 0.82, 0.66, a); }
    g.leaves(nl, 0.3, H * 0.3, H * 0.34 + 0.8, 0.14, rng() * TAU, 0.85, rng);
    return { g: g.geometry(), h: H };
  };
  out.push(spire(18, 11, 1.0, 0.45, 5), spire(10.5, 8, 0.82, 0.4, 4), lily(9, 3, 1.3, 5), lily(5.6, 2, 1.05, 4));
  { // a mound of small open flowers
    const g = new FB();
    for (let k = 0; k < 8; k++) {
      const a = k * 2.399 + 0.5, rr = k === 0 ? 0 : 1.0 + 1.1 * ((k * 7) % 3) / 2, top = [Math.cos(a) * rr, 2.7 - rr * rr * 0.22 + 0.3 * (k % 2), Math.sin(a) * rr];
      g.stem([top[0] * 0.3, 0, top[2] * 0.3], top, 0.07, LEAF1, false); g.bloom(top, [top[0] * 0.35, 1, top[2] * 0.35], 5, 0.62, 0.25, a);
    }
    g.leaves(6, 0.1, 0.4, 2.3, 0.2, 0.2, 0.5, rng);
    out.push({ g: g.geometry(), h: 3 });
  }
  { // broad arching leaves with three flowers among them
    const g = new FB();
    g.leaves(8, 0, 0.3, 3.6, 0.2, 0.4, 0.95, rng);
    for (const [x, y, z, r] of [[0.3, 4.4, 0.2, 0.72], [-0.9, 3.3, -0.6, 0.6], [0.8, 2.7, -0.9, 0.52]]) { g.stem([0, 0, 0], [x, y, z], 0.07, LEAF1, false); g.bloom([x, y, z], [x * 0.5, 1, z * 0.5], 5, r, 0.4, x); }
    out.push({ g: g.geometry(), h: 4.6 });
  }
  return out;
}
const FLOWER_VERT = /* glsl */`
attribute vec2 aF, aUv; attribute vec3 aCol;
uniform float uTime;
varying vec3 vP, vN, vC; varying vec2 vUv; varying float vMask;
#include <fog_pars_vertex>
void main(){
  vec4 lp=instanceMatrix*vec4(position,1.);
  vec3 o=instanceMatrix[3].xyz; float sc=length(instanceMatrix[1].xyz), ph=o.x*.7+o.z*.9;
  float w=aF.x*sc;
  lp.xz+=w*vec2(sin(uTime*1.1+ph)+.4*sin(uTime*2.7+ph*2.1), cos(uTime*.9+ph*1.3));
  vP=lp.xyz; vN=mat3(instanceMatrix)*normal; vC=mix(color,color*aCol,aF.y); vUv=aUv; vMask=aF.y;
  vec4 mvPosition=modelViewMatrix*lp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FLOWER_FRAG = /* glsl */`
uniform float uOutside;
varying vec3 vP, vN, vC; varying vec2 vUv; varying float vMask;
#include <fog_pars_fragment>
${G_COMMON}
void main(){
  vec3 N=normalize(vN), base=vC;
  if(vUv.x<5.){
    // cut the strip to a petal or a leaf, and paint it: throat, veins, midrib
    float v=clamp(vUv.y,0.,1.), u=vUv.x;
    if(vMask>.5){
      float w=pow(max(sin(3.1416*pow(v,.7)),0.),.5)*.97;
      if(abs(u)>w) discard;
      float un=clamp(u/max(w,1e-3),-1.,1.);
      base*=mix(.5,1.,smoothstep(0.,.5,v))*(1.-.13*smoothstep(.5,.95,abs(sin(un*6.5)))*smoothstep(.08,.45,v)*(1.-smoothstep(.7,1.,v)));
      base=mix(base,vec3(1.,.88,.4),(1.-smoothstep(.02,.24,v))*.55);
      base*=1.+.1*smoothstep(.7,1.,v)-.12*smoothstep(.75,1.,abs(un));
    } else {
      float w=pow(max(sin(3.1416*pow(v,.58)),0.),1.1);
      if(abs(u)>w+.05) discard;
      float un=clamp(u/max(w,1e-3),-1.,1.);
      base*=mix(1.2,.78,smoothstep(0.,.9,abs(un)))*(1.-.16*smoothstep(.55,.95,abs(sin(un*4.+v*11.))));
      base=mix(base,base*1.5+vec3(.02,.05,0.),1.-smoothstep(.04,.13,abs(u)));
    }
  }
  float deck=vP.z>${Z_FC.toFixed(1)}?38.:vP.z>${Z_QD.toFixed(1)}?30.:vP.z>${Z_POOP.toFixed(1)}?38.:46.;
  float above=max(smoothstep(deck-.8,deck+.5,vP.y),uOutside);
  float sun=mix(above<.99?holdSun(vP):0., dapple(vP), above);
  vec3 amb=mix(holdAmbient(vP,vec3(0.,1.,0.)), mix(uGndCol,uSkyCol,.75), above);
  float ndl=dot(N,uSunL), lit=.5+.28*abs(ndl)+.22*max(ndl,0.);
  vec3 col=base*(uSunCol*sun*lit*1.1+amb*1.15);
  col+=base*uNight*vec3(.06,.08,.1);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- yellow butterflies: they rise from the flowers as the eye comes down the hold and go before it out of the stern window
const FLY_VERT = /* glsl */`
attribute vec3 aHome; attribute vec4 aRnd; attribute float aWing, aAbeam;
uniform float uFlown, uFly;
varying vec3 vC; varying float vLit;
#include <fog_pars_vertex>
${G_COMMON}
void main(){
  float perched=step(1.5,aRnd.w), lead=10.+26.*aRnd.x;
  float gap=aAbeam-uFlown;                                   // metres of route still to fly until we are abreast of this one's flower
  float up=smoothstep(lead+16.,lead,gap)*uFly*(1.-perched);  // 0 at rest on its flower, 1 on the wing
  float rate=1.+.4*fract(aRnd.z*7.31);                       // its own pace down the nave: metres aft for each metre flown
  float t=uTime*(.6+.5*aRnd.y)+aRnd.z*40.;
  vec3 c=aHome;
  c.z=aHome.z-rate*max(lead-gap,0.)*up;
  float conv=smoothstep(-66.,-97.,c.z);
  vec3 air=vec3(aHome.x*.8+3.2*sin(t*.7+aRnd.z*9.), aHome.y+4.+7.*aRnd.y+2.2*sin(t*.9+aRnd.x*7.), c.z+2.5*sin(t*.5+aRnd.y*5.));
  air.x=mix(air.x, air.x*.3, conv); air.y=mix(air.y, 23.+ (aRnd.y-.5)*8., conv);
  c=mix(c, air, up);
  float flap=mix(.25+.2*sin(uTime*1.3+aRnd.z*30.), sin(t*17.+aRnd.z*20.)*1.15, max(up,.0));
  // body frame: heading aft when flying, any way when at rest
  float yaw=mix(aRnd.z*6.283, 3.1416+.7*sin(t*.8+aRnd.x*4.), up);
  vec3 fw=vec3(sin(yaw),0.,cos(yaw)), rt=vec3(fw.z,0.,-fw.x), upv=vec3(0.,1.,0.);
  float side=aWing, ca=cos(flap), sa=sin(flap);
  vec3 q=fw*position.z + (rt*ca*side+upv*sa)*abs(position.x);
  float sz=(.6+.45*aRnd.x)*mix(1.,1.2,up);
  vec3 lp=c+q*sz;
  vLit=mix(holdSun(c), 1., step(30.,c.y)); vC=color;
  vec4 mvPosition=modelViewMatrix*vec4(lp,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FLY_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uHoldAmb;
varying vec3 vC; varying float vLit;
#include <fog_pars_fragment>
void main(){
  vec3 col=vC*(uSunCol*(.25+.95*vLit)+uSkyCol*.7+uHoldAmb*1.2);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
function butterflyGeometry() {
  // two wings, each a fore and a hind lobe; x is the span (folded about z by the shader), z the body
  const g = new THREE.BufferGeometry(), y1 = [0.96, 0.82, 0.12], y0 = [0.85, 0.55, 0.05], dk = [0.25, 0.14, 0.02];
  const P = [], Cc = [], W = [], I = [];
  for (const s of [-1, 1]) {
    const b = P.length / 3;
    const pts = [[0, 0, 0.05], [0.5 * s, 0, 0.42], [0.62 * s, 0, 0.12], [0.42 * s, 0, -0.32], [0, 0, -0.1]], cols = [y0, y1, dk, y1, y0];
    for (let k = 0; k < 5; k++) { P.push(pts[k][0], 0, pts[k][2]); Cc.push(...cols[k]); W.push(s); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3, b, b + 3, b + 4);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- bars of sun in the air of the hold: one soft ribbon from every opening on the sunward side
const BEAM_VERT = /* glsl */`
attribute vec3 aDir, aSide, aB;
varying vec3 vB, vP; varying float vNear;
void main(){
  // a bar is three sheets through its axis, sixty degrees apart; aSide is the way across this sheet
  vec4 wp=modelMatrix*vec4(position,1.); vec3 wd=normalize(mat3(modelMatrix)*aDir);
  vNear=smoothstep(1.5,6.,length(cross(wd,cameraPosition-wp.xyz)));   // the eye inside a bar sees no bar
  wp.xyz+=normalize(mat3(modelMatrix)*aSide)*(aB.x*aB.y);
  vB=aB; vP=position;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uSunCol; uniform float uTime, uBeam;
varying vec3 vB, vP; varying float vNear;
float bh(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float bn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(bh(i),bh(i+vec2(1,0)),f.x), mix(bh(i+vec2(0,1)),bh(i+vec2(1,1)),f.x), f.y); }
void main(){
  float x=clamp(vB.x,-1.,1.), e=1.-x*x; e*=e;
  float t=clamp(vB.z,0.,1.), along=smoothstep(0.,.05,t)*(1.-.8*t);
  float dust=.62+.38*bn(vec2(vP.x*.7+vP.z*.5+uTime*.06, vP.y*.7-uTime*.09));
  gl_FragColor=vec4(uSunCol*vec3(1.,.96,.78)*(e*along*dust*uBeam*vNear*.55),1.);
}`;
function buildBeams(L, ports) {
  const P = [], D = [], Sd = [], B = [], I = [], dir = [-L[0], -L[1], -L[2]];
  const n1 = norm(cross(dir, Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), n2 = cross(dir, n1);
  const beam = (p0, hw) => {
    let t = 0; for (; t < 70; t += 1) { const q = mad(p0, dir, t); if (q[1] < 5.5 || Math.abs(q[0]) > binAt(q[2], Math.max(q[1], 6)) - 0.6 || q[2] < -95 || q[2] > 58) break; }
    if (t < 4) return;
    const n = 4;
    for (let sh = 0; sh < 3; sh++) {
      const an = sh * Math.PI / 3, sv = [n1[0] * Math.cos(an) + n2[0] * Math.sin(an), n1[1] * Math.cos(an) + n2[1] * Math.sin(an), n1[2] * Math.cos(an) + n2[2] * Math.sin(an)], o = P.length / 3;
      for (let k = 0; k <= n; k++) { const f = k / n, q = mad(p0, dir, t * f); for (const sd of [-1, 1]) { P.push(q[0], q[1], q[2]); D.push(dir[0], dir[1], dir[2]); Sd.push(sv[0], sv[1], sv[2]); B.push(sd, hw, f); } }
      for (let k = 0; k < n; k++) { const a = o + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  const sg = L[0] < 0 ? -1 : 1;
  for (const pt of ports) if (pt.sg === sg) beam([sg * (pt.xin - 0.2), (pt.y0 + pt.y1) / 2, pt.z + 1.6], 1.5);
  const H = SHIP.HATCH; for (const x of [-3.8, 3.8]) for (let k = 0; k < 4; k++) beam([x, D_WAIST - 0.5, lerp(H.z0 + 3, H.z1 - 3, k / 3)], 3.4);
  for (const [G, y] of [[SHIP.GRATE_F, D_WAIST], [SHIP.GRATE_Q, D_QD], [SHIP.GRATE_P, D_POOP]]) for (const f of [0.25, 0.75]) beam([0, y - 0.6, lerp(G.z0, G.z1, f)], 1.9);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(D, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3)); g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- the way through her (ship-local): along the port bow, up past the fore shrouds, over the rail,
// between the mainmast and its shrouds, down the main hatch, along the nave and out by the middle stern window
export const FLIGHT = [
  [36, 12, 116], [28, 12.5, 88], [26, 14.5, 64], [28.5, 20.5, 46], [27, 31, 34], [21.5, 40.5, 24], [14.5, 42, 16],
  [9.5, 41, 8], [3.5, 35.5, -2.5], [0.5, 28, -11.5], [0, 23.3, -21.5], [0, 23, -36], [0, 23, -56], [0, 23, -76], [0, SHIP.WIN.y, SHIP.WIN.z],
];
// The lane that must stay clear is the route as it is flown on this visit: the world hands it in as a point every two metres
// (ship-local). Alone in the viewer it is the corner points above joined straight. Everything that is placed by a draw is
// tested against it: flowers, growth, hanging moss, rags, ropes, stones.
function makeLane(pts) {
  const P = pts.map((q) => [q[0], q[1], q[2]]).filter((q) => Math.abs(q[0]) < 90 && q[2] > -120 && q[2] < 150), n = P.length;
  const dist = (p) => {
    let best = 1e18;
    for (let i = 0; i < n - 1; i++) {
      const a = P[i], b = P[i + 1], ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
      const t = clamp((px * ax + py * ay + pz * az) / Math.max(ax * ax + ay * ay + az * az, 1e-9), 0, 1), dx = px - ax * t, dy = py - ay * t, dz = pz - az * t, d = dx * dx + dy * dy + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  // where the route runs abreast of a given z once it is over her decks or inside her (from just forward of the mainmast aft)
  // metres flown when the route is abreast of a given z of hers (the lane's points lie two metres of route apart, from the start)
  const station = (z) => {
    for (let i = pts.length - 2; i >= 0; i--) { const a = pts[i][2], b = pts[i + 1][2]; if (a !== b && (a - z) * (b - z) <= 0) return (i + (a - z) / (a - b)) * 2; }
    return pts[pts.length - 1][2] > z ? (pts.length - 1) * 2 : 0;
  };
  const inboard = P.filter((q) => q[2] < SHIP.MAST.main + 4);
  const at = (z) => { let best = 1e9, q = inboard[inboard.length - 1] || P[n - 1]; for (const c of inboard) { const d = Math.abs(c[2] - z); if (d < best) { best = d; q = c; } } return q; };
  return { dist, at, station };
}
function straightLane() {
  const out = [];
  for (let i = 0; i < FLIGHT.length - 1; i++) { const a = FLIGHT[i], b = FLIGHT[i + 1], d = sub(b, a), n = Math.max(1, Math.round(len(d) / 2)); for (let k = 0; k < n; k++) out.push(mad(a, d, k / n)); }
  out.push(FLIGHT[FLIGHT.length - 1]);
  return out;
}

async function buildEpiphytes(cards, rng, R, yards, masts, ports, orchidCols, density, pause, lane) {
  const rdir = () => norm([rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)]);
  const perpTo = (d) => norm(cross(d, Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const green = () => mix3([0.1, 0.26, 0.07], [0.24, 0.46, 0.14], rng()), silver = () => mix3([0.3, 0.42, 0.3], [0.5, 0.58, 0.46], rng());
  const moss = (p, n, L, sw0) => { for (let k = 0; k < n; k++) { const a = rng() * TAU; cards.card(add(p, [rng.range(-0.3, 0.3), 0, rng.range(-0.3, 0.3)]), norm([rng.range(-0.08, 0.08), -1, rng.range(-0.08, 0.08)]), [Math.cos(a), 0, Math.sin(a)], L * rng.range(0.6, 1), rng.range(0.9, 1.7), 2, mul([0.4, 0.5, 0.36], rng.range(0.8, 1.2)), sw0, sw0 + rng.range(0.45, 0.85)); } };
  const rosette = (p, out, sw, s = 1) => {
    const n = rng.int(5, 8), c = rng() < 0.5 ? green : silver;
    for (let k = 0; k < n; k++) { const d = norm(add(mul(out, 0.9), mul(rdir(), 0.9))); cards.card(p, d, perpTo(d), rng.range(1.3, 2.6) * s, rng.range(0.4, 0.62) * s, 0, c(), sw, sw + 0.12, rng.range(0.3, 1.2) * s); }
  };
  const orchid = (p, out, sw, s = 1) => {
    const col = rng.pick(orchidCols), nl = rng.int(2, 4);
    for (let k = 0; k < nl; k++) { const d = norm(add(mul(out, 0.7), mul(rdir(), 0.8))); cards.card(p, d, perpTo(d), rng.range(1.4, 2.6) * s, rng.range(0.42, 0.6) * s, 0, green(), sw, sw + 0.1, rng.range(0.6, 1.5) * s); }
    const sd = norm(add(add(mul(out, 0.8), [0, -0.55, 0]), mul(rdir(), 0.45))), nf = rng.int(3, 7), sz = rng.range(0.85, 1.35) * s;
    for (let k = 0; k < nf; k++) {
      const c = mad(p, sd, 0.6 + k * sz * 0.6), nrm = norm(add(out, mul(rdir(), 0.7))), side = perpTo(nrm), up = norm(cross(side, nrm));
      cards.card(mad(c, up, -sz * 0.5), up, side, sz, sz, 1, mul(col, rng.range(0.85, 1.1)), sw + 0.05, sw + 0.16);
    }
  };
  // a strand that hangs L metres from p must not hang into the lane
  const hangsClear = (p, L) => lane.dist([p[0], p[1] - L * 0.5, p[2]]) > 5 && lane.dist([p[0], p[1] - L, p[2]]) > 5;
  const site = (p, out, sw, kinds) => {
    if (lane.dist(p) < 7.5) return;
    const r = rng();
    if (r < kinds[0]) orchid(p, out, sw); else if (r < kinds[0] + kinds[1]) rosette(p, out, sw); else { const nm = rng.int(2, 4), L = rng.range(3, 9); if (hangsClear(p, L)) moss(p, nm, L, sw); }
  };
  // along the rigging
  let li = 0;
  for (const ln of R.lines) {
    if (++li % 6 === 0) await pause();
    const pts = ln.pts, n = pts.length - 1; let L = 0; for (let i = 0; i < n; i++) L += len(sub(pts[i + 1], pts[i]));
    const step = (ln.kind === 'shroud' ? 7 : ln.kind === 'stay' ? 10 : 6) / density; let d = rng.range(2, step);
    while (d < L - 1.5) {
      const t = d / L, f = t * n, i = Math.min(Math.floor(f), n - 1), p = [lerp(pts[i][0], pts[i + 1][0], f - i), lerp(pts[i][1], pts[i + 1][1], f - i), lerp(pts[i][2], pts[i + 1][2], f - i)];
      const sw = ln.sway * (ln.free ? t : Math.sin(Math.PI * t)), out = norm([rng.range(-1, 1), rng.range(-0.6, 0.2), rng.range(-1, 1)]);
      site(p, out, sw, ln.kind === 'shroud' ? [0.62, 0.22] : ln.kind === 'stay' ? [0.35, 0.15] : [0.3, 0.1]);
      d += rng.range(0.5, 1.5) * step;
    }
    if (ln.free) orchid(pts[n], [0, -1, 0], ln.sway, 1.2);
  }
  // along the yards: orchids and air plants above, moss hanging beneath
  await pause();
  for (const y of yards) for (let s = -0.95; s < 0.95; s += rng.range(0.07, 0.2) / density) {
    const p = mad(y.c, y.d, s * y.half);
    if (rng() < 0.55) site(add(p, [0, y.r * 0.8, 0]), [0, 1, 0], 0.03, [0.6, 0.4]); else { const nm = rng.int(2, 4), L = rng.range(3, 8); if (lane.dist(p) > 7.5 && hangsClear(p, L)) moss(add(p, [0, -y.r * 0.7, 0]), nm, L, 0.02); }
  }
  // round the tops, on the bowsprit and the beak
  for (const m of [masts.fore, masts.main, masts.mizzen]) for (let k = 0; k < 9; k++) { const a = rng() * TAU, o = [Math.cos(a), 0, Math.sin(a)]; site(mad(m.P(m.yTop + (rng() < 0.5 ? 2.6 : 0)), o, m.rT), o, 0.03, [0.55, 0.3]); }
  for (let k = 0.15; k < 1; k += rng.range(0.05, 0.12)) site(add(masts.bowsprit.bsAt(k), [0, rng() < 0.5 ? 1.2 : -1.2, 0]), [rng.range(-1, 1), rng() < 0.5 ? 1 : -1, 0], 0.03, [0.4, 0.2]);
  // along the rails, spilling outboard
  for (const sg of [1, -1]) for (let z = -92; z < 62; z += rng.range(4, 10) / density) {
    const y = railY(z) + 0.4, x = sg * (halfB(tAt(z, y), y) + 0.2);
    site([x, y, z], norm([sg, 0.3, 0]), 0.03, [0.45, 0.25]);
  }
  // the anchors, grown over
  for (const a of R.anchors) for (let k = 0; k < 7; k++) {
    const p = [a.p[0] + rng.range(-0.6, 0.6), lerp(a.bot, a.top, rng()), a.p[2] + rng.range(-4, 4) * (k < 3 ? 1 : 0.2)];
    if (lane.dist(p) < 6) continue;
    if (k < 3) moss(p, 2, rng.range(2.5, 5), 0.02); else if (k < 5) rosette(p, [a.sg, 0.4, 0], 0.03, 0.9); else orchid(p, [a.sg, 0.2, 0], 0.03, 0.9);
  }
  // ferns in the gunports
  for (const pt of ports) {
    if (!(pt.sg > 0 && pt.k >= 7) && rng() > 0.4) continue;
    const nf = rng.int(4, 7);
    for (let k = 0; k < nf; k++) {
      const d = norm([pt.sg * rng.range(0.6, 1), rng.range(0.1, 0.7), rng.range(-0.8, 0.8)]), base = [pt.x - pt.sg * 0.4, pt.y0 + 0.25, pt.z + rng.range(-1.1, 1.1)];
      cards.card(base, d, perpTo(d), rng.range(3, 5.6), rng.range(1.3, 2), 3, mix3([0.07, 0.25, 0.06], [0.16, 0.42, 0.1], rng()), 0, 0.22, rng.range(1.2, 2.8));
    }
  }
  // orchids round the portal's window and along the cabin's arch
  const W = SHIP.WIN;
  for (let k = 0; k <= 16; k++) {
    const a = Math.PI * (k / 16), r = 6.5, p = [Math.cos(a) * r, 25 + Math.sin(a) * r, W.z + rng.range(0.6, 2.4)], out = norm([-Math.cos(a), -Math.sin(a) * 0.6, 0.5]);
    if (rng() < 0.7) orchid(p, out, 0.03, 0.8); else rosette(p, out, 0.03, 0.8);
  }
  for (const sx of [-1, 1]) for (let y = 15.5; y < 25; y += rng.range(1.6, 3.2)) orchid([sx * 6.5, y, W.z + rng.range(0.6, 3)], [-sx, 0, 0.5], 0.03, 0.8);
  for (let k = 1; k < 12; k++) { const a = Math.PI * (k / 12), p = [Math.cos(a) * 9.4, 25.5 + Math.sin(a) * 9.4, Z_POOP + 0.6]; if (rng() < 0.6) orchid(p, [0, 0, 1], 0.03, 0.9); else moss(p, 2, rng.range(1.5, 3), 0.02); }
}

// barnacle armour standing proud of the planking, and the bed of stones she is fastened into
async function buildCrust(mb, rng, density, pause, lane) {
  const cone = (base, n, r, h) => {
    let u = cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = norm(u); const w = cross(n, u), ring0 = [], ring1 = [], S = 5;
    for (let k = 0; k <= S; k++) {
      const a = (k / S) * TAU, d = [u[0] * Math.cos(a) + w[0] * Math.sin(a), u[1] * Math.cos(a) + w[1] * Math.sin(a), u[2] * Math.cos(a) + w[2] * Math.sin(a)], nn = norm(mad(mul(d, 0.8), n, 0.6));
      ring0.push(mb.v(mad(base, d, r), nn, [k, 0], 0.7)); ring1.push(mb.v(mad(mad(base, n, h), d, r * 0.5), nn, [k, 1], 1.0));
    }
    for (let k = 0; k < S; k++) mb.i.push(ring0[k], ring0[k + 1], ring1[k + 1], ring0[k], ring1[k + 1], ring1[k]);
  };
  const nCl = Math.round(230 * density);
  for (let c = 0; c < nCl; c++) {
    const sg = rng() < 0.72 ? 1 : -1, t0 = sg > 0 ? rng.range(0.3, 0.985) : rng.range(0.05, 0.98), y0 = rng.range(SHIP.GROUND + 1, 17.5), n = rng.int(3, 7);
    for (let k = 0; k < n; k++) {
      const t = clamp(t0 + rng.range(-0.012, 0.012), 0.01, 0.99), y = y0 + rng.range(-1.6, 1.6), b = halfB(t, y), e = 0.004;
      const dT = [halfB(t + e, y) - halfB(t - e, y), 0, zAt(t + e, y) - zAt(t - e, y)], dY = [halfB(t, y + 0.2) - halfB(t, y - 0.2), 0.4, zAt(t, y + 0.2) - zAt(t, y - 0.2)];
      const nn = norm(cross(dY, dT)), r = rng.range(0.28, 0.85), tone = rng(), tall = rng.range(0.6, 1.3), at = [sg * (b - 0.05), y, zAt(t, y)];
      if (lane.dist(at) < r * 2 + 3) continue;
      mb.set(K.STONE, 0, 0).color(mix3([0.5, 0.54, 0.5], [0.78, 0.8, 0.76], tone));
      cone(at, [sg * nn[0], nn[1], nn[2]], r, r * tall);
    }
    if (c % 8 === 7) await pause();
  }
}
async function buildStones(mb, rng, noise, density, pause, lane) {
  const ico1 = new THREE.IcosahedronGeometry(1, 1), ico0 = new THREE.IcosahedronGeometry(1, 0);
  const nSt = Math.round(300 * density);
  for (let s = 0; s < nSt; s++) {
    const t = rng.range(0.0, 1.0), sg = rng() < 0.5 ? 1 : -1, big = rng() < 0.2, r = big ? rng.range(2.6, 5) : rng.range(0.9, 2.4);
    const off = rng.range(-1.5, 6) + (big ? 2 : 0), yb = SHIP.GROUND + 1.5, x = sg * (halfB(t, yb) + off), z = zAt(t, yb) + (t > 0.97 ? rng.range(0, 6) : t < 0.02 ? -rng.range(0, 8) : 0);
    const cy = SHIP.GROUND + rng.range(-0.4, 0.5) * r + Math.max(0, 1.6 - off * 0.35), seed = rng() * 50, sq = rng.range(0.5, 0.8);
    const col = mix3([0.4, 0.41, 0.4], [0.66, 0.66, 0.62], rng()), base = mb.count, pa = (big ? ico1 : ico0).getAttribute('position'), nv = pa.count;
    if (s % 4 === 3) await pause();
    // a stone keeps three metres off the lane (it swells to 1.45 of its radius where the noise pushes it out)
    if (lane.dist([x, cy, z]) < r * 1.45 + 3) continue;
    mb.set(K.STONE, 0, 0).color(col);
    for (let i = 0; i < nv; i++) {
      const d = norm([pa.getX(i), pa.getY(i), pa.getZ(i)]), k = 1 + 0.42 * noise.n3(d[0] * 1.4 + seed, d[1] * 1.4, d[2] * 1.4);
      mb.v([x + d[0] * r * k, cy + d[1] * r * k * sq, z + d[2] * r * k], norm([d[0], d[1] / sq, d[2]]), [d[0] * r, d[2] * r], clamp(0.6 + 0.4 * d[1] + 0.3, 0.5, 1));
    }
    for (let i = 0; i < nv; i += 3) mb.i.push(base + i, base + i + 1, base + i + 2);
  }
  ico1.dispose(); ico0.dispose();
}

// ---------------------------------------------------------------- assembly
export async function buildHero(ctx, opts = {}) {
  // every drawn part of her has a stream of its own, made from the world's seed and the part's name; all are made here, once
  const S = {}, noise = ctx.noise;
  for (const name of ['hull', 'frames', 'fittings', 'masts', 'crust', 'stones', 'sails', 'orchids', 'flowers', 'butterflies']) S[name] = ctx.core.makeRng(ctx.core.hashSeed('galleon-' + name + ':' + ctx.seed));
  const detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.6, 1), density = clamp(opts.density ?? 1, 0.6, 1.4) * detail, rare = !!opts.rare;
  const object = new THREE.Group(); object.name = 'galleon';
  const lane = makeLane(opts.lane && opts.lane.length > 1 ? opts.lane : straightLane());
  // light, shared by every material of the ship (set by the world through setLight, or read from the scene's own lights)
  const LU = {
    uSunL: { value: new THREE.Vector3(0.45, 0.82, -0.3).normalize() }, uSunCol: { value: new THREE.Color(0.95, 0.9, 0.78) },
    uSkyCol: { value: new THREE.Color(0.3, 0.34, 0.3) }, uGndCol: { value: new THREE.Color(0.12, 0.11, 0.15) },
    uHoldAmb: { value: new THREE.Color(0.1, 0.13, 0.07) }, uPortalCol: { value: new THREE.Color(0.5, 0.42, 0.25) },
    uYellow: { value: new THREE.Color('#f4d21f') }, uTime: { value: 0 }, uDrift: { value: 0.3 }, uLantern: { value: 0 }, uNight: { value: 0 },
  };
  const material = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...LU, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, vertexColors: true, side: THREE.DoubleSide, ...o });

  // ---- timber
  const pause = () => ctx.yield();
  await ctx.yield();
  const T = await hullTables(pause); await ctx.yield();
  const mb = new MB(), R = new Rig(lane);
  const ports = await buildHull(mb, T, S.hull, pause); await ctx.yield();
  buildDecks(mb, T); await ctx.yield();
  await buildFrames(mb, T, S.frames, pause); await ctx.yield();
  buildBulkheads(mb); await ctx.yield(); buildStern(mb); await ctx.yield();
  const feet = buildFittings(mb, ports, S.fittings, R); await ctx.yield();
  const { yards, masts } = await buildMasts(mb, R, S.masts, feet, pause); await ctx.yield();
  await buildCrust(mb, S.crust, density, pause, lane); await ctx.yield();
  await buildStones(mb, S.stones, noise, density, pause, lane); await ctx.yield();
  const shipMat = material(SHIP_VERT, SHIP_FRAG);
  const ship = new THREE.Mesh(await mb.geometryStepped(pause), shipMat); ship.name = 'galleon-timber'; object.add(ship);
  await ctx.yield();

  // ---- rigging and rags
  const sails = S.sails, keepOf = {};
  for (const y of yards) keepOf[y.name] = opts.sails ?? sails.pick([0.12, 0.3, 0.3, 0.55, 0.55, 0.85]);
  const rags = new THREE.Mesh(buildRags(yards, sails, (y) => keepOf[y.name], lane), material(RAG_VERT, RAG_FRAG, {}, { vertexColors: false })); rags.name = 'galleon-rags'; object.add(rags);
  await ctx.yield();

  // ---- everything that grows on her
  const er = S.orchids;
  const OC = [[lin('#f4f1e6'), 1.2], [lin('#d95fb2'), 1.4], [lin('#f4d21f'), 0.8], [lin('#f2a8cf'), 0.6], [lin('#a23fa8'), 0.5]];
  const orchidCols = []; for (const [c, w] of OC) { const n = Math.max(0, Math.round(w * er.range(0.2, 2.2) * 3)); for (let k = 0; k < n; k++) orchidCols.push(c); }
  if (!orchidCols.length) orchidCols.push(OC[1][0]);
  const cards = new Cards();
  await buildEpiphytes(cards, er, R, yards, masts, ports, orchidCols, density, pause, lane); await ctx.yield();
  const growth = new THREE.Mesh(await cards.geometry(pause), material(CARD_VERT, CARD_FRAG)); growth.name = 'galleon-orchids'; object.add(growth);
  await ctx.yield();
  // the ropes blend by their strength: only the outward faces of each tube are drawn (its triangles are wound inward), so a rope covers its
  // own width once, and they are drawn before the other things that blend
  const ropeMat = material(ROPE_VERT, ROPE_FRAG, { uResY: { value: 450 } }, { transparent: true, side: THREE.BackSide });
  const ropes = new THREE.Mesh(R.geometry(), ropeMat); ropes.name = 'galleon-rigging'; ropes.renderOrder = -1; object.add(ropes);
  ropes.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); ropeMat.uniforms.uResY.value = rt ? rt.height : renderer.domElement.height; };
  await ctx.yield();

  // ---- the forest of flowers in her hold, brimming at the hatches, spilling over the decks
  const fr = S.flowers, FG = flowerGeometries(fr), inst = FG.map(() => ({ m: [], c: [] })), tops = [];
  const PAL = [['#f4d21f', 3], ['#fff6e0', 1.5], ['#d95fb2', 2], ['#b3122a', 1.6], ['#f08a1c', 1.4], ['#7a4fd0', 1.2], ['#f2a0c0', 1.2], ['#3f7fe0', 0.6], ['#ffe9a0', 1]];
  const pal = []; for (const [hex, w] of PAL) { const n = Math.round(w * fr.range(0.35, 1.7) * 4); for (let k = 0; k < n; k++) pal.push(lin(hex)); }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  const put = (type, x, y, z, s, col) => {
    E.set(fr.range(-0.1, 0.1), fr() * TAU, fr.range(-0.1, 0.1)); Q.setFromEuler(E); const k = fr.range(0.88, 1.14);
    const sx = (0.45 + 0.55 * s) * k; M4.compose(V.set(x, y - 0.1, z), Q, Sc.set(sx, s, sx));
    for (let i = 0; i < 16; i++) inst[type].m.push(M4.elements[i]);
    const c = col || fr.pick(pal), g = fr.range(0.82, 1.08); inst[type].c.push(c[0] * g, c[1] * g, c[2] * g);
    return y + s * FG[type].h;
  };
  const plant = (x, y0, z, H, tallBias) => {
    // which plant fits the room there is
    const r = fr(); let type;
    if (H >= 13) type = r < 0.5 + tallBias ? 0 : r < 0.72 ? 1 : r < 0.88 ? 2 : 3;
    else if (H >= 7.6) type = r < 0.42 + tallBias ? 1 : r < 0.72 ? 2 : r < 0.88 ? 3 : 5;
    else if (H >= 4.1) type = r < 0.45 ? 3 : r < 0.75 ? 5 : 4;
    else type = r < 0.6 ? 4 : 5;
    return put(type, x, y0, z, clamp(H / FG[type].h, 0.5, 1.5) * fr.range(0.78, 1));
  };
  const inRect = (x, z, h, m = 0) => Math.abs(x) < h.hw + m && z > h.z0 - m && z < h.z1 + m;
  const stepA = 2.1 / Math.pow(density, 0.25);
  let row = 0;
  for (let z = -93; z < -0.5; z += stepA) {
    for (let x = -17.5; x <= 17.5; x += stepA) {
      if (fr() < 0.08) continue;
      const px = x + fr.range(-0.9, 0.9), pz = z + fr.range(-0.9, 0.9), ax = Math.abs(px);
      let y0;
      if (pz < Z_POOP) { if (ax > binAt(pz, 15) - 0.9 || (pz < -87 && ax < 7.6)) continue; y0 = 14.5; } else { y0 = floorY(px, pz); if (y0 > 16.4) continue; }
      const open = inRect(px, pz, SHIP.HATCH, -0.3), ceil = open ? 99 : inRect(px, pz, SHIP.GRATE_Q, -0.4) ? D_QD + 2.5 : deckY(pz) - 2.6;
      const way = lane.at(pz), H = Math.min(ceil, way[1] - 6.4 + Math.max(0, Math.abs(px - way[0]) - 3) * 2.2) - y0;
      if (H < 1.6) continue;
      const top = plant(px, y0, pz, H, ax > 9 ? 0.15 : 0);
      if (pz > -92) tops.push([px, top, pz]);
    }
    if (++row % 8 === 0) await ctx.yield();
  }
  // the forward hold: seen through the gunports and the fore grating, where the garden climbs out into the sun
  for (let z = 1; z < 56; z += 3) for (let x = -16; x <= 16; x += 3) {
    const px = x + fr.range(-1.2, 1.2), pz = z + fr.range(-1.2, 1.2), ax = Math.abs(px), grate = inRect(px, pz, SHIP.GRATE_F, -0.4);
    if (ax < 6 && !grate) continue;
    const y0 = floorY(px, pz); if (y0 > 16.4) continue;
    const H = (grate ? 34.5 : 27) - y0; if (H > 5 && lane.dist([px, y0 + H, pz]) > 6.5) plant(px, y0, pz, H, 0.2);
  }
  await ctx.yield();
  // on the decks, mostly along the bulwarks and round the coamings
  for (const [D, za, zb, n] of [[D_WAIST, Z_QD + 1.2, Z_FC - 1.2, 170], [D_FC, Z_FC + 1.5, 60, 60], [D_QD, Z_POOP + 1.5, Z_QD - 1.5, 70], [D_POOP, -95, Z_POOP - 1.5, 50]]) {
    for (let k = 0; k < Math.round(n * density); k++) {
      const z = fr.range(za, zb), b = binAt(z, D + 1) - 1.1, sgn = fr() < 0.5 ? -1 : 1, x = sgn * (b - Math.pow(fr(), 2.2) * (b - 1.5));
      if (inRect(x, z, SHIP.HATCH, 1) || inRect(x, z, SHIP.GRATE_F, 1) || inRect(x, z, SHIP.GRATE_Q, 1) || inRect(x, z, SHIP.GRATE_P, 1)) continue;
      if (Math.hypot(x, z - SHIP.MAST.main) < 3.5 || Math.hypot(x, z - SHIP.MAST.fore) < 3.2 || Math.hypot(x, z - SHIP.MAST.mizzen) < 3) continue;
      const s = fr.range(0.55, 1.0), type = fr() < 0.5 ? 4 : fr() < 0.6 ? 5 : 3;
      if (lane.dist([x, D + s * FG[type].h, z]) < 6.5) continue;
      put(type, x, D, z, s);
    }
  }
  // garlands on the ribs of the nave
  for (let i = 3; i < T.length - 30; i += 2) {
    if ((i - I0) % 2 !== 0) continue;
    const s = T[i], dk = deckY(s.zDeck);
    for (const sg of [1, -1]) for (let k = 0; k < 2; k++) {
      const y = fr.range(15, dk - 4), b = halfBin(s.t, y) - 1.7, p = [sg * b, y, zAt(s.t, y)];
      if (fr() < 0.35 || lane.dist(p) < 7.5) continue;
      put(4, p[0], p[1], p[2], fr.range(0.45, 0.75));
    }
  }
  const flowerMat = material(FLOWER_VERT, FLOWER_FRAG, { uOutside: { value: 0 } });
  const flowerMeshes = (lists, mat) => {
    const g = new THREE.Group();
    lists.forEach((l, t) => {
      const n = l.m.length / 16; if (!n) return;
      const geo = FG[t].g.clone(), im = new THREE.InstancedMesh(geo, mat, n);
      im.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(l.m), 16);
      geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(l.c), 3));
      im.computeBoundingSphere(); g.add(im);
    });
    return g;
  };
  const garden = flowerMeshes(inst, flowerMat); garden.name = 'galleon-garden'; object.add(garden);
  await ctx.yield();

  // ---- butterflies: the cloud in the hold, and on a rare day a whole foliage of them on the masts
  // Each one rests on its flower until the route comes near (so many metres short of being abreast of it), then
  // flies aft down the nave at a pace of its own for every metre we fly: its whole course follows metres flown,
  // never the eye; only its wingbeat and its wandering run on the clock.
  const br = S.butterflies, home = [], rnd = [], abeam = [];
  const nFly = tops.length ? Math.round(460 * density) : 0;
  for (let k = 0; k < nFly; k++) { const q = tops[br.int(0, tops.length - 1)]; home.push(q[0] + br.range(-0.8, 0.8), q[1] + br.range(-0.3, 0.6), q[2] + br.range(-0.8, 0.8)); rnd.push(br(), br(), br(), 0); abeam.push(lane.station(home[home.length - 1])); }
  if (rare) for (let k = 0; k < Math.round(2600 * detail); k++) {
    const ln = br.pick(R.lines), i = br.int(0, ln.pts.length - 2), f = br(), a = ln.pts[i], b = ln.pts[i + 1], r = br();
    if (r < 0.5) home.push(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f));
    else if (r < 0.8) { const y = br.pick(yards); const p = mad(y.c, y.d, br.range(-1, 1) * y.half); home.push(p[0], p[1] + y.r, p[2]); }
    else { const m = br.pick([masts.fore, masts.main, masts.mizzen]), yy = br.range(m.yDeck + 5, m.yTM), an = br() * TAU, rr = yy < m.yTop ? m.r0 * 0.9 : m.r0 * 0.45; const c = yy < m.yTop ? m.P(yy) : m.PT(yy); home.push(c[0] + Math.cos(an) * rr, yy, c[2] + Math.sin(an) * rr); }
    rnd.push(br(), br(), br(), 2); abeam.push(0);
  }
  const flyMat = material(FLY_VERT, FLY_FRAG, { uFlown: { value: -1e4 }, uFly: { value: 1 } });
  let flies = null;
  if (home.length) {
    const g = butterflyGeometry();
    g.setAttribute('aHome', new THREE.InstancedBufferAttribute(new Float32Array(home), 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(new Float32Array(rnd), 4));
    g.setAttribute('aAbeam', new THREE.InstancedBufferAttribute(new Float32Array(abeam), 1));
    flies = new THREE.InstancedMesh(g, flyMat, home.length / 3); flies.frustumCulled = false; flies.name = 'galleon-butterflies'; object.add(flies);
  }

  // ---- bars of sun through her openings (the sun stands where the world says it will; the viewer's default otherwise)
  const sunL = opts.sunLocal ? [opts.sunLocal.x, opts.sunLocal.y, opts.sunLocal.z] : [0.47, 0.8, 0.2];
  const beamMat = new THREE.ShaderMaterial({ uniforms: { uSunCol: LU.uSunCol, uTime: LU.uTime, uBeam: { value: opts.beam ?? 0.16 } }, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beams = new THREE.Mesh(buildBeams(norm(sunL), ports), beamMat); beams.frustumCulled = false; beams.renderOrder = 6; beams.name = 'galleon-sunbars'; object.add(beams);

  // ---- light
  const sunW = new THREE.Vector3(0.45, 0.82, -0.3).normalize(), q = new THREE.Quaternion();
  let lit = false;
  const setLight = (o = {}) => {
    lit = true;
    if (o.sunDir) sunW.copy(o.sunDir).normalize();
    for (const [k, u] of [['sun', 'uSunCol'], ['sky', 'uSkyCol'], ['ground', 'uGndCol'], ['hold', 'uHoldAmb'], ['portal', 'uPortalCol'], ['yellow', 'uYellow']]) if (o[k]) LU[u].value.copy(o[k]);
    if (o.night !== undefined) LU.uNight.value = o.night;
    if (o.lantern !== undefined) LU.uLantern.value = o.lantern;
  };
  const fromScene = () => {
    let root = object; while (root.parent) root = root.parent;
    root.traverse((n) => {
      if (n.isDirectionalLight) { sunW.copy(n.position).normalize(); LU.uSunCol.value.copy(n.color).multiplyScalar(n.intensity / Math.PI); }
      if (n.isHemisphereLight) { LU.uSkyCol.value.copy(n.color).multiplyScalar(n.intensity / Math.PI); LU.uGndCol.value.copy(n.groundColor).multiplyScalar(n.intensity / Math.PI); LU.uHoldAmb.value.copy(n.color).multiplyScalar(0.35 * n.intensity / Math.PI); }
    });
    lit = true;
  };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  return {
    object, radius: 100, height: 172, center: new THREE.Vector3(0, 64, -6), ground: true, groundY: SHIP.GROUND,
    anchors: {
      flight: FLIGHT.map(V3), portalSeat: new THREE.Vector3(0, SHIP.WIN.y, SHIP.WIN.z), portalSize: { width: SHIP.WIN.w, height: SHIP.WIN.h },
      anchor: V3(R.anchors[0].p), sprit: V3(masts.bowsprit.bs1), bow: new THREE.Vector3(0, 40, 66), hull: new THREE.Vector3(8, 46, 10), mainTop: new THREE.Vector3(0, 104, 8), hatch: new THREE.Vector3(0, 28, -12),
    },
    uniforms: LU, setLight,
    setDrift(k) { LU.uDrift.value = k; },
    // metres flown along the route (the lane this ship was built round): the butterflies in her hold rise by it
    setFlown(m) { flyMat.uniforms.uFlown.value = m; },
    kit: {
      // more of the same flowers for the world to stand outside her: points [{ x, y, z, s, type, color }]
      flowers(points) {
        const lists = FG.map(() => ({ m: [], c: [] }));
        for (const p of points) {
          E.set(0, (p.x * 12.9898 + p.z * 78.233) % TAU, 0); Q.setFromEuler(E); M4.compose(V.set(p.x, p.y, p.z), Q, Sc.set(p.s, p.s, p.s));
          const l = lists[p.type ?? 3]; for (let i = 0; i < 16; i++) l.m.push(M4.elements[i]); const c = p.color || pal[0]; l.c.push(c[0], c[1], c[2]);
        }
        return flowerMeshes(lists, material(FLOWER_VERT, FLOWER_FRAG, { uOutside: { value: 1 } }));
      },
      palette: pal, lin,
    },
    // is a ship-local point inside the opening of the stern bay, with `pad` metres to spare (the world fits the portal's ring with it)
    inBay(x, y, pad = 0) { const B = SHIP.BAY, r = B.r - pad; return y > B.sill + pad && (y <= B.spring ? Math.abs(x) < r : Math.hypot(x, y - B.spring) < r); },
    // is a ship-local point within her sides (between stem and transom)
    inHull(x, z) { return z > SHIP.WIN.z - 1 && z < 58 && Math.abs(x) < halfB(tAt(z, 24), 24); },
    update(dt, time, camera) {
      if (!lit) fromScene();
      LU.uTime.value = time;
      object.getWorldQuaternion(q).invert(); LU.uSunL.value.copy(sunW).applyQuaternion(q).normalize();
    },
    dispose() {},
  };
}
