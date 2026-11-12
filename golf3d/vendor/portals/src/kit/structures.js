// Structures kit: exterior architecture and the built environment.
// Buildings, cities, villages, skylines, bridges, gates, lamps, lanterns, boats, trains and street
// furniture. Everything is procedural merged geometry with linear vertex colours, drawn by a small
// family of shared materials (see makeMaterials) that carry a day look and a night look.
// API reference: docs/kit/structures.md
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from './core.js';

const TAU = Math.PI * 2;
const _col = new THREE.Color();
const _m4 = new THREE.Matrix4(), _m4b = new THREE.Matrix4(), _q = new THREE.Quaternion();
const _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vc = new THREE.Vector3(), _vd = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1), _Y = new THREE.Vector3(0, 1, 0);

// ---------- colour helpers (linear RGB triples) ----------
export function lin(c) {
  if (Array.isArray(c)) return c;
  if (c && c.isColor) return [c.r, c.g, c.b];
  _col.set(c); return [_col.r, _col.g, _col.b];
}
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function vary(c, rng, amt = 0.08, hue = 0.025) {
  const k = 1 + (rng() - 0.5) * 2 * amt, h = (rng() - 0.5) * 2 * hue;
  return [c[0] * k * (1 + h), c[1] * k, c[2] * k * (1 - h)];
}
function palette(defaults, over) {
  const out = {};
  for (const k in defaults) { const v = defaults[k]; out[k] = Array.isArray(v) && typeof v[0] !== 'number' ? v.map(lin) : lin(v); }
  if (over) for (const k in over) if (over[k] != null) out[k] = Array.isArray(over[k]) && typeof over[k][0] !== 'number' ? over[k].map(lin) : lin(over[k]);
  return out;
}
const fallbackRng = (opts, label) => opts.rng || makeRng(hashSeed(label));
const vec3 = (p) => (p && p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));

// Surface styles understood by the facade material (stored per vertex in the `win` attribute).
export const SURF = {
  PLAIN: 0, WINDOW: 1, ARCHED: 2, RIBBON: 3, CURTAIN: 4, SLIT: 5, ROUND: 6, SHOJI: 7, GLOW: 8, SHOP: 9,
  MASONRY: 10, TILES: 11, PLANKS: 12, ROAD: 13, TRACK: 14, CANVAS: 15, STRIPES: 16,
  FLUTED: 17, LACQUER: 18, STEEL: 19, RELIEF: 20,
};
// styles whose second `win` component carries the night floodlight amount instead of a window seed
const isFloodStyle = (s) => s === 0 || s === 10 || s >= 16;
const isWindowStyle = (s) => (s >= 1 && s <= 7) || s === 9;

// ---------- geometry builder ----------
// Accumulates indexed triangles with position, normal, color (linear), uv and win (style, seed, lit).
// A transform stack lets generators be placed anywhere, so whole cities merge into one buffer.
export class Builder {
  constructor(cap = 1024) {
    this.cap = cap; this.icap = cap * 3;
    this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3);
    this.U = new Float32Array(cap * 2); this.W = new Float32Array(cap * 3); this.I = new Uint32Array(this.icap);
    this.nv = 0; this.ni = 0; this.m = null; this.ns = 1; this.stack = [];
    this.c = [1, 1, 1]; this.g0 = 1; this.g1 = 1; this.style = 0; this.seed = 0; this.lit = 1; this.sd = 0; this.wn = 0;
    this.fl = 0; this.flY = 0; this.flL = 14;
  }
  get triangles() { return this.ni / 3; }
  _growV() {
    const cap = this.cap * 2, g = (a, n) => { const b = new Float32Array(cap * n); b.set(a); return b; };
    this.P = g(this.P, 3); this.N = g(this.N, 3); this.C = g(this.C, 3); this.U = g(this.U, 2); this.W = g(this.W, 3); this.cap = cap;
  }
  _growI(n) { let cap = this.icap; while (this.ni + n > cap) cap *= 2; const b = new Uint32Array(cap); b.set(this.I); this.I = b; this.icap = cap; }

  // --- state ---
  col(c, g0 = 1, g1 = 1) { this.c = c; this.g0 = g0; this.g1 = g1; return this; }
  shade(g0 = 1, g1 = 1) { this.g0 = g0; this.g1 = g1; return this; }
  // Night floodlighting of plain / masonry / striped surfaces: amount 0..1.5, strongest at local height y0, fading over `length` metres.
  flood(amount = 0, y0 = 0, length = 14) { this.fl = amount; this.flY = y0; this.flL = length; return this; }
  surf(style = 0, seedOrZ = 0, lit = 1) { this.style = style; this.seed = this.sd = seedOrZ; this.lit = lit; return this; }
  push(matrix) {
    const top = this.stack.length ? this.stack[this.stack.length - 1] : null;
    const m = top ? top.clone().multiply(matrix) : matrix.clone();
    this.stack.push(m); this.m = m.elements;
    this.ns = 1 / (Math.hypot(this.m[0], this.m[1], this.m[2]) || 1);
    return this;
  }
  tr(x = 0, y = 0, z = 0, ry = 0, s = 1) {
    _q.setFromAxisAngle(_Y, ry);
    return this.push(_m4.compose(_va.set(x, y, z), _q, _vb.set(s, s, s)));
  }
  pop() {
    this.stack.pop();
    const top = this.stack.length ? this.stack[this.stack.length - 1] : null;
    this.m = top ? top.elements : null; this.ns = top ? 1 / (Math.hypot(this.m[0], this.m[1], this.m[2]) || 1) : 1;
    return this;
  }

  // --- raw ---
  v(x, y, z, nx, ny, nz, r, g, b, u = 0, w = 0) {
    if (this.nv >= this.cap) this._growV();
    const st = this.style;
    const wy = isFloodStyle(st) ? (this.fl > 0 ? this.fl * (0.3 + 0.7 * Math.exp(-Math.max(0, y - this.flY) / this.flL)) : 0) : this.sd;
    const m = this.m;
    if (m) {
      const X = m[0] * x + m[4] * y + m[8] * z + m[12], Yy = m[1] * x + m[5] * y + m[9] * z + m[13], Z = m[2] * x + m[6] * y + m[10] * z + m[14];
      const s = this.ns, NX = (m[0] * nx + m[4] * ny + m[8] * nz) * s, NY = (m[1] * nx + m[5] * ny + m[9] * nz) * s, NZ = (m[2] * nx + m[6] * ny + m[10] * nz) * s;
      x = X; y = Yy; z = Z; nx = NX; ny = NY; nz = NZ;
    }
    const i = this.nv++, a = i * 3, b2 = i * 2;
    this.P[a] = x; this.P[a + 1] = y; this.P[a + 2] = z;
    this.N[a] = nx; this.N[a + 1] = ny; this.N[a + 2] = nz;
    this.C[a] = r; this.C[a + 1] = g; this.C[a + 2] = b;
    this.U[b2] = u; this.U[b2 + 1] = w;
    this.W[a] = st; this.W[a + 1] = Math.round(wy * 1024) / 1024; this.W[a + 2] = this.lit;
    return i;
  }
  tri3(i0, i1, i2) { if (this.ni + 3 > this.icap) this._growI(3); const I = this.I; I[this.ni++] = i0; I[this.ni++] = i1; I[this.ni++] = i2; }
  quad4(i0, i1, i2, i3) {
    if (this.ni + 6 > this.icap) this._growI(6);
    const I = this.I; I[this.ni++] = i0; I[this.ni++] = i1; I[this.ni++] = i2; I[this.ni++] = i0; I[this.ni++] = i2; I[this.ni++] = i3;
  }

  // Flat quad a,b (bottom) c,d (top), counter-clockwise seen from outside. uv = [u0,v0,u1,v1].
  quad(a, b, c, d, uv, cb, ct) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    let vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) { vx = c[0] - a[0]; vy = c[1] - a[1]; vz = c[2] - a[2]; nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx; l = Math.hypot(nx, ny, nz) || 1; }
    nx /= l; ny /= l; nz /= l;
    const k = this.c, g0 = this.g0, g1 = this.g1;
    const r0 = cb ? cb[0] : k[0] * g0, G0 = cb ? cb[1] : k[1] * g0, b0 = cb ? cb[2] : k[2] * g0;
    const r1 = ct ? ct[0] : k[0] * g1, G1 = ct ? ct[1] : k[1] * g1, b1 = ct ? ct[2] : k[2] * g1;
    const u0 = uv ? uv[0] : 0, v0 = uv ? uv[1] : 0, u1 = uv ? uv[2] : 1, v1 = uv ? uv[3] : 1;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, r0, G0, b0, u0, v0);
    const i1 = this.v(b[0], b[1], b[2], nx, ny, nz, r0, G0, b0, u1, v0);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, r1, G1, b1, u1, v1);
    const i3 = this.v(d[0], d[1], d[2], nx, ny, nz, r1, G1, b1, u0, v1);
    this.quad4(i0, i1, i2, i3);
    return this;
  }
  tri(a, b, c, ca, cb2, cc, uva, uvb, uvc) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const k = this.c; ca = ca || k; cb2 = cb2 || ca; cc = cc || ca;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, ca[0], ca[1], ca[2], uva ? uva[0] : 0, uva ? uva[1] : 0);
    const i1 = this.v(b[0], b[1], b[2], nx, ny, nz, cb2[0], cb2[1], cb2[2], uvb ? uvb[0] : 1, uvb ? uvb[1] : 0);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, cc[0], cc[1], cc[2], uvc ? uvc[0] : 0.5, uvc ? uvc[1] : 1);
    this.tri3(i0, i1, i2);
    return this;
  }

  // Vertical wall from (ax,az) to (bx,bz); outward normal is (-dz,0,dx).
  // o.cellW/cellH: window cell size in metres (uv counts cells). o.m: uv in metres * m. Otherwise 0..1.
  wall(ax, az, bx, bz, y0, y1, o) {
    const len = Math.hypot(bx - ax, bz - az), h = y1 - y0;
    let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
    if (o && o.cellW) { u1 = Math.max(1, Math.round(len / o.cellW)); v1 = Math.max(1, Math.round(h / (o.cellH || o.cellW))); if (o.cols) u1 = o.cols; if (o.rows) v1 = o.rows; }
    else if (o && o.m) { u1 = len * o.m; v0 = y0 * o.m; v1 = y1 * o.m; }
    else if (o && o.uv) { u0 = o.uv[0]; v0 = o.uv[1]; u1 = o.uv[2]; v1 = o.uv[3]; }
    const keep = this.sd;
    if (isWindowStyle(this.style)) this.sd = (this.seed + (++this.wn) * 0.61803398875) % 1;
    this.quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], [u0, v0, u1, v1]);
    this.sd = keep;
    return this;
  }
  // Axis-aligned box. o: { top, bottom, sides, cellW, cellH, m, capColor, capStyle }
  box(x0, y0, z0, x1, y1, z1, o) {
    if (!o || o.sides !== false) {
      this.wall(x0, z1, x1, z1, y0, y1, o); this.wall(x1, z1, x1, z0, y0, y1, o);
      this.wall(x1, z0, x0, z0, y0, y1, o); this.wall(x0, z0, x0, z1, y0, y1, o);
    }
    const st = this.style, sd = this.sd, c = this.c, g0 = this.g0, g1 = this.g1;
    const capStyle = o && o.capStyle != null ? o.capStyle : (isWindowStyle(st) ? 0 : st);
    this.style = capStyle; if (capStyle !== st) this.sd = 0;
    if (o && o.capColor) this.c = o.capColor;
    this.g0 = this.g1 = g1;
    const cm = (o && o.capM) || 0;
    if (!o || o.top !== false) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], cm ? [x0 * cm, z0 * cm, x1 * cm, z1 * cm] : undefined);
    this.g0 = this.g1 = g0;
    if (o && o.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    this.style = st; this.sd = sd; this.c = c; this.g0 = g0; this.g1 = g1;
    return this;
  }
  // Centred box helper: centre x,z, base y, sizes.
  cbox(cx, y0, cz, sx, sy, sz, o) { return this.box(cx - sx / 2, y0, cz - sz / 2, cx + sx / 2, y0 + sy, cz + sz / 2, o); }
  // Convex footprint prism. poly = [[x,z],...] ordered so that wall() normals point outward.
  prism(poly, y0, y1, o) {
    const n = poly.length;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; this.wall(a[0], a[1], b[0], b[1], y0, y1, o); }
    if (!o || o.top !== false) {
      const st = this.style, sd = this.sd, c = this.c, g0 = this.g0;
      this.style = (o && o.capStyle) || 0; this.sd = 0; if (o && o.capColor) this.c = o.capColor; this.g0 = this.g1;
      for (let i = 1; i < n - 1; i++) this.tri([poly[0][0], y1, poly[0][1]], [poly[i][0], y1, poly[i][1]], [poly[i + 1][0], y1, poly[i + 1][1]], mul3(this.c, this.g1));
      this.style = st; this.sd = sd; this.c = c; this.g0 = g0;
    }
    return this;
  }
  // Rectangular frustum (battered walls, pyramids, tapered piers). Sizes at y0 and y1.
  frustum(cx, cz, w0, d0, w1, d1, y0, y1, o) {
    const a = [[cx - w0 / 2, cz + d0 / 2], [cx + w0 / 2, cz + d0 / 2], [cx + w0 / 2, cz - d0 / 2], [cx - w0 / 2, cz - d0 / 2]];
    const b = [[cx - w1 / 2, cz + d1 / 2], [cx + w1 / 2, cz + d1 / 2], [cx + w1 / 2, cz - d1 / 2], [cx - w1 / 2, cz - d1 / 2]];
    const ox = (o && o.topX) || 0, oz = (o && o.topZ) || 0;
    const keep = this.sd;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, len = Math.hypot(a[j][0] - a[i][0], a[j][1] - a[i][1]), h = y1 - y0;
      let uv;
      if (o && o.cellW) uv = [0, 0, Math.max(1, Math.round(len / o.cellW)), Math.max(1, Math.round(h / (o.cellH || o.cellW)))];
      else if (o && o.m) uv = [0, y0 * o.m, len * o.m, y1 * o.m];
      if (isWindowStyle(this.style)) this.sd = (this.seed + (++this.wn) * 0.61803398875) % 1;
      if (w1 < 1e-4 && d1 < 1e-4) this.tri([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [cx + ox, y1, cz + oz], mul3(this.c, this.g0), mul3(this.c, this.g0), mul3(this.c, this.g1), uv && [uv[0], uv[1]], uv && [uv[2], uv[1]], uv && [(uv[0] + uv[2]) / 2, uv[3]]);
      else this.quad([a[i][0], y0, a[i][1]], [a[j][0], y0, a[j][1]], [b[j][0] + ox, y1, b[j][1] + oz], [b[i][0] + ox, y1, b[i][1] + oz], uv);
    }
    this.sd = keep;
    if ((!o || o.top !== false) && w1 > 1e-4 && d1 > 1e-4) {
      const st = this.style, c = this.c, g0 = this.g0; this.style = 0; if (o && o.capColor) this.c = o.capColor; this.g0 = this.g1;
      this.quad([b[0][0] + ox, y1, b[0][1] + oz], [b[1][0] + ox, y1, b[1][1] + oz], [b[2][0] + ox, y1, b[2][1] + oz], [b[3][0] + ox, y1, b[3][1] + oz]);
      this.style = st; this.c = c; this.g0 = g0;
    }
    return this;
  }
  // Surface of revolution around the y axis at (cx,cy,cz). profile = [[r,y],...] bottom to top.
  // o: { smooth (along profile), facet (flat faces around), cellW/cellH (windows), m, colors[], arc, start }
  lathe(cx, cy, cz, profile, seg = 12, o) {
    const arc = (o && o.arc) || TAU, a0 = (o && o.start) || 0, np = profile.length;
    const facet = o && o.facet, smooth = o && o.smooth, colors = o && o.colors, k = this.c;
    const keep = this.sd;
    if (isWindowStyle(this.style)) this.sd = (this.seed + (++this.wn) * 0.61803398875) % 1;
    // per profile-point normals (radial, y)
    const pn = [];
    for (let i = 0; i < np - 1; i++) { const dr = profile[i + 1][0] - profile[i][0], dy = profile[i + 1][1] - profile[i][1], l = Math.hypot(dr, dy) || 1; pn.push([dy / l, -dr / l]); }
    let vAcc = 0;
    for (let i = 0; i < np - 1; i++) {
      const p0 = profile[i], p1 = profile[i + 1];
      if (Math.abs(p0[0]) < 1e-6 && Math.abs(p1[0]) < 1e-6) continue;
      let n0 = pn[i], n1 = pn[i];
      if (smooth) {
        if (i > 0) { const q = pn[i - 1], l = Math.hypot(q[0] + n0[0], q[1] + n0[1]) || 1; n0 = [(q[0] + pn[i][0]) / l, (q[1] + pn[i][1]) / l]; }
        if (i < np - 2) { const q = pn[i + 1], l = Math.hypot(q[0] + pn[i][0], q[1] + pn[i][1]) || 1; n1 = [(q[0] + pn[i][0]) / l, (q[1] + pn[i][1]) / l]; }
      }
      const c0 = colors ? colors[i] : mul3(k, lerp(this.g0, this.g1, i / (np - 1))), c1 = colors ? colors[i + 1] : mul3(k, lerp(this.g0, this.g1, (i + 1) / (np - 1)));
      const bandH = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), rMid = (Math.abs(p0[0]) + Math.abs(p1[0])) / 2;
      let uT = 1, vA = 0, vB = 1;
      if (o && o.cellW) { uT = Math.max(1, Math.round(rMid * arc / o.cellW)); vA = 0; vB = Math.max(1, Math.round(bandH / (o.cellH || o.cellW))); }
      else if (o && o.m) { uT = Math.max(1, Math.round(rMid * arc * o.m)); vA = vAcc * o.m; vB = (vAcc + bandH) * o.m; }
      else if (o && o.uvBand) { uT = o.uvBand[0]; vA = o.uvBand[1] + (o.uvBand[2] - o.uvBand[1]) * i / (np - 1); vB = o.uvBand[1] + (o.uvBand[2] - o.uvBand[1]) * (i + 1) / (np - 1); }
      vAcc += bandH;
      if (facet) {
        for (let j = 0; j < seg; j++) {
          const aa = a0 + arc * j / seg, ab = a0 + arc * (j + 1) / seg, ca = Math.cos(aa), sa = Math.sin(aa), cb = Math.cos(ab), sb = Math.sin(ab);
          const uA = uT * j / seg, uB = uT * (j + 1) / seg;
          const A = [cx + p0[0] * cb, cy + p0[1], cz + p0[0] * sb], B = [cx + p0[0] * ca, cy + p0[1], cz + p0[0] * sa];
          const C = [cx + p1[0] * ca, cy + p1[1], cz + p1[0] * sa], D = [cx + p1[0] * cb, cy + p1[1], cz + p1[0] * sb];
          if (Math.abs(p1[0]) < 1e-6) this.tri(A, B, C, c0, c0, c1, [uB, vA], [uA, vA], [(uA + uB) / 2, vB]);
          else if (Math.abs(p0[0]) < 1e-6) this.tri(A, C, D, c0, c1, c1, [(uA + uB) / 2, vA], [uA, vB], [uB, vB]);
          else this.quad(A, B, C, D, [uB, vA, uA, vB], c0, c1);
        }
      } else {
        const base = this.nv;
        for (let j = 0; j <= seg; j++) {
          const a = a0 + arc * j / seg, ca = Math.cos(a), sa = Math.sin(a), u = uT * j / seg;
          this.v(cx + p0[0] * ca, cy + p0[1], cz + p0[0] * sa, n0[0] * ca, n0[1], n0[0] * sa, c0[0], c0[1], c0[2], u, vA);
          this.v(cx + p1[0] * ca, cy + p1[1], cz + p1[0] * sa, n1[0] * ca, n1[1], n1[0] * sa, c1[0], c1[1], c1[2], u, vB);
        }
        for (let j = 0; j < seg; j++) { const q = base + j * 2; this.quad4(q + 2, q, q + 1, q + 3); }
      }
    }
    this.sd = keep;
    return this;
  }
  cyl(cx, y0, cz, r0, r1, h, seg = 10, o) {
    const prof = [[r0, 0], [r1, h]];
    if (!o || o.cap !== false) prof.push([0, h]);
    return this.lathe(cx, y0, cz, prof, seg, o);
  }
  sphere(cx, cy, cz, r, seg = 10, rings = 6, o) {
    const prof = []; const sy = (o && o.sy) || 1;
    for (let i = 0; i <= rings; i++) { const a = -Math.PI / 2 + Math.PI * i / rings; prof.push([Math.max(0, Math.cos(a)) * r, Math.sin(a) * r * sy]); }
    prof[0][0] = 0; prof[rings][0] = 0;
    return this.lathe(cx, cy, cz, prof, seg, Object.assign({ smooth: true }, o));
  }
  // Parametric surface: fn(u,v) -> [x,y,z], u,v in 0..1. Smooth normals from finite differences.
  // o: { flip, double, uv:[u0,v0,u1,v1], colorFn(u,v) }
  grid(nu, nv, fn, o) {
    const flip = o && o.flip, uvm = (o && o.uv) || [0, 0, 1, 1], cf = o && o.colorFn, k = this.c, e = 1e-3;
    const pass = (sgn) => {
      const base = this.nv;
      for (let j = 0; j <= nv; j++) {
        for (let i = 0; i <= nu; i++) {
          const u = i / nu, w = j / nv, p = fn(u, w);
          const pu = fn(Math.min(1, u + e), w), pu0 = fn(Math.max(0, u - e), w), pv = fn(u, Math.min(1, w + e)), pv0 = fn(u, Math.max(0, w - e));
          const ax = pu[0] - pu0[0], ay = pu[1] - pu0[1], az = pu[2] - pu0[2], bx = pv[0] - pv0[0], by = pv[1] - pv0[1], bz = pv[2] - pv0[2];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, l = Math.hypot(nx, ny, nz);
          if (l < 1e-12) {                                            // collapsed row or column (a pole): take the tangent plane just inside
            const u2 = lerp(u, 0.5, 0.04), w2 = lerp(w, 0.5, 0.04), q0 = fn(u2 - e, w2), q1 = fn(u2 + e, w2), q2 = fn(u2, w2 - e), q3 = fn(u2, w2 + e);
            const cx2 = q1[0] - q0[0], cy2 = q1[1] - q0[1], cz2 = q1[2] - q0[2], dx2 = q3[0] - q2[0], dy2 = q3[1] - q2[1], dz2 = q3[2] - q2[2];
            nx = cy2 * dz2 - cz2 * dy2; ny = cz2 * dx2 - cx2 * dz2; nz = cx2 * dy2 - cy2 * dx2; l = Math.hypot(nx, ny, nz);
            if (l < 1e-12) { nx = 0; ny = 1; nz = 0; l = 1; }
          }
          nx *= sgn / l; ny *= sgn / l; nz *= sgn / l;
          const c = cf ? cf(u, w) : mul3(k, lerp(this.g0, this.g1, w));
          this.v(p[0], p[1], p[2], nx, ny, nz, c[0], c[1], c[2], lerp(uvm[0], uvm[2], u), lerp(uvm[1], uvm[3], w));
        }
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 2, d = a + nu + 1;
        if (sgn > 0) this.quad4(a, b, c, d); else this.quad4(a, d, c, b);
      }
    };
    pass(flip ? -1 : 1);
    if (o && o.double) pass(flip ? 1 : -1);
    return this;
  }
  // Tube along a polyline of [x,y,z]. r may be a number or fn(t). o: { caps, closed }
  tube(pts, r, seg = 5, o) {
    const n = pts.length; if (n < 2) return this;
    const k = this.c, rf = typeof r === 'function' ? r : () => r;
    let px = 0, py = 1, pz = 0; // previous normal for parallel transport
    const base = this.nv; let len = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (i === 0 && Math.abs(ty) > 0.9) { px = 1; py = 0; pz = 0; }
      // project previous normal onto the plane perpendicular to t
      const d = px * tx + py * ty + pz * tz; px -= d * tx; py -= d * ty; pz -= d * tz;
      const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      const bx = ty * pz - tz * py, by = tz * px - tx * pz, bz = tx * py - ty * px;
      if (i > 0) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
      const rr = rf(i / (n - 1)), g = lerp(this.g0, this.g1, i / (n - 1));
      for (let j = 0; j <= seg; j++) {
        const a2 = TAU * j / seg, c = Math.cos(a2), s = Math.sin(a2), nx = px * c + bx * s, ny = py * c + by * s, nz = pz * c + bz * s;
        this.v(pts[i][0] + nx * rr, pts[i][1] + ny * rr, pts[i][2] + nz * rr, nx, ny, nz, k[0] * g, k[1] * g, k[2] * g, j / seg, len);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
      const a = base + i * (seg + 1) + j, b = a + 1, c = a + seg + 2, d = a + seg + 1;
      this.quad4(a, b, c, d);
    }
    return this;
  }
  // Straight beam between two points with a rectangular section (posts, braces, booms).
  beam(a, b, w = 0.2, h = w) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
    let tx = dx / l, ty = dy / l, tz = dz / l;
    // side vector: horizontal, perpendicular to the beam
    let sx = -tz, sy = 0, sz = tx; let sl = Math.hypot(sx, sz);
    if (sl < 1e-4) { sx = 1; sz = 0; sl = 1; } sx /= sl; sz /= sl;
    const ux = sy * tz - sz * ty, uy = sz * tx - sx * tz, uz = sx * ty - sy * tx; // up = s x t
    const P = (p, s, u) => [p[0] + sx * s * w / 2 + ux * u * h / 2, p[1] + sy * s * w / 2 + uy * u * h / 2, p[2] + sz * s * w / 2 + uz * u * h / 2];
    const a00 = P(a, -1, -1), a10 = P(a, 1, -1), a11 = P(a, 1, 1), a01 = P(a, -1, 1), b00 = P(b, -1, -1), b10 = P(b, 1, -1), b11 = P(b, 1, 1), b01 = P(b, -1, 1);
    const uv = [0, 0, w, l];
    this.quad(a10, a00, b00, b10, uv); this.quad(a01, a11, b11, b01, uv); this.quad(a00, a01, b01, b00, uv); this.quad(a11, a10, b10, b11, uv);
    this.quad(a00, a10, a11, a01); this.quad(b10, b00, b01, b11);
    return this;
  }
  disc(cx, cy, cz, r, seg = 12, up = true) {
    const c = mul3(this.c, this.g1);
    for (let j = 0; j < seg; j++) {
      const a = TAU * j / seg, b = TAU * (j + 1) / seg;
      const A = [cx + r * Math.cos(a), cy, cz + r * Math.sin(a)], B = [cx + r * Math.cos(b), cy, cz + r * Math.sin(b)];
      if (up) this.tri([cx, cy, cz], B, A, c); else this.tri([cx, cy, cz], A, B, c);
    }
    return this;
  }
  // Pitched roof over a rectangle. ridge along x when alongX. Tiles on the slopes, wall colour on the gable ends.
  gable(x0, z0, x1, z1, y0, rise, o = {}) {
    const ov = o.overhang ?? 0.4, alongX = o.alongX ?? (x1 - x0 >= z1 - z0), wallC = o.wallColor || this.c, m = o.m ?? 1;
    const st = this.style, sd = this.sd, c = this.c, g0 = this.g0, g1 = this.g1;
    const th = o.thick ?? 0.14;
    const roofStyle = o.style ?? SURF.TILES;
    const mk = (X0, Z0, X1, Z1, sw) => { // local frame: ridge along X
      const zc = (Z0 + Z1) / 2, hw = (Z1 - Z0) / 2, sl = Math.hypot(hw + ov, rise * (hw + ov) / hw);
      const eY = y0 - rise * ov / hw, P = (x, y, z) => (sw ? [z, y, x] : [x, y, z]);
      const Q = (a, b, cc, d, uv) => (sw ? this.quad(b, a, d, cc, uv && [uv[2], uv[1], uv[0], uv[3]]) : this.quad(a, b, cc, d, uv));
      this.style = roofStyle; this.sd = 0; this.c = c; this.g0 = g0 * 0.82; this.g1 = g1;
      const L = X1 - X0 + 2 * ov;
      Q(P(X0 - ov, eY, Z1 + ov), P(X1 + ov, eY, Z1 + ov), P(X1 + ov, y0 + rise, zc), P(X0 - ov, y0 + rise, zc), [0, 0, L * m, sl * m]);
      Q(P(X1 + ov, eY, Z0 - ov), P(X0 - ov, eY, Z0 - ov), P(X0 - ov, y0 + rise, zc), P(X1 + ov, y0 + rise, zc), [0, 0, L * m, sl * m]);
      // undersides (dark) so overhangs read from below
      this.style = 0; this.c = mul3(c, 0.45); this.g0 = this.g1 = 1;
      Q(P(X1 + ov, eY - th, Z1 + ov), P(X0 - ov, eY - th, Z1 + ov), P(X0 - ov, y0 + rise - th, zc), P(X1 + ov, y0 + rise - th, zc));
      Q(P(X0 - ov, eY - th, Z0 - ov), P(X1 + ov, eY - th, Z0 - ov), P(X1 + ov, y0 + rise - th, zc), P(X0 - ov, y0 + rise - th, zc));
      // gable end walls
      this.style = o.wallStyle ?? 0; this.c = wallC; this.g0 = this.g1 = 1;
      const T = (a, b, cc) => (sw ? this.tri(b, a, cc) : this.tri(a, b, cc));
      T(P(X1, y0, Z1), P(X1, y0, Z0), P(X1, y0 + rise, zc));
      T(P(X0, y0, Z0), P(X0, y0, Z1), P(X0, y0 + rise, zc));
    };
    if (alongX) mk(x0, z0, x1, z1, false); else mk(z0, x0, z1, x1, true);
    this.style = st; this.sd = sd; this.c = c; this.g0 = g0; this.g1 = g1;
    return this;
  }
  // Hip roof (four slopes). ridge = fraction of the long side kept as a ridge (0 = pyramid).
  hip(x0, z0, x1, z1, y0, rise, o = {}) {
    const ov = o.overhang ?? 0.4, m = o.m ?? 1, ridge = o.ridge ?? 0.4;
    const st = this.style, sd = this.sd, g0 = this.g0, g1 = this.g1, c = this.c;
    this.style = o.style ?? SURF.TILES; this.sd = 0; this.g0 = g0 * 0.82;
    const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = X1 - X0, d = Z1 - Z0;
    const alongX = w >= d, rl = (alongX ? w : d) * ridge * 0.5, yt = y0 + rise;
    const rA = alongX ? [cx - rl, yt, cz] : [cx, yt, cz - rl], rB = alongX ? [cx + rl, yt, cz] : [cx, yt, cz + rl];
    const sl = Math.hypot(rise, (alongX ? d : w) / 2) * m;
    const cb = mul3(c, this.g0), ct = mul3(c, g1);
    const face = (a, b, t0, t1) => {
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]) * m;
      if (Math.hypot(t0[0] - t1[0], t0[2] - t1[2]) < 1e-4) this.tri(a, b, t0, cb, cb, ct, [0, 0], [len, 0], [len / 2, sl]);
      else this.quad(a, b, t1, t0, [0, 0, len, sl]);
    };
    if (alongX) {
      face([X0, y0, Z1], [X1, y0, Z1], rA, rB); face([X1, y0, Z0], [X0, y0, Z0], rB, rA);
      face([X1, y0, Z1], [X1, y0, Z0], rB, rB); face([X0, y0, Z0], [X0, y0, Z1], rA, rA);
    } else {
      face([X1, y0, Z1], [X1, y0, Z0], rB, rA); face([X0, y0, Z0], [X0, y0, Z1], rA, rB);
      face([X0, y0, Z1], [X1, y0, Z1], rB, rB); face([X1, y0, Z0], [X0, y0, Z0], rA, rA);
    }
    if (ov > 0.01) { this.style = 0; this.c = mul3(c, 0.4); this.g0 = this.g1 = 1; this.quad([X0, y0 - 0.02, Z0], [X1, y0 - 0.02, Z0], [X1, y0 - 0.02, Z1], [X0, y0 - 0.02, Z1]); }
    this.style = st; this.sd = sd; this.g0 = g0; this.g1 = g1; this.c = c;
    return this;
  }
  // Sweeping east-asian roof with upturned corners over a rectangle centred on (cx,cz).
  sweepRoof(cx, cz, w, d, y0, rise, o = {}) {
    const ov = o.overhang ?? 1.6, lift = o.lift ?? 0.9, top = o.top ?? 0.3, nu = o.nu ?? 6, nv = o.nv ?? 4, curve = o.curve ?? 2.1;
    const st = this.style, sd = this.sd, c = this.c, g0 = this.g0, g1 = this.g1;
    const hw = w / 2 + ov, hd = d / 2 + ov, tw = w / 2 * top, td = d / 2 * top;
    const sides = [[hw, hd, tw, td, 0], [hd, hw, td, tw, 1], [hw, hd, tw, td, 2], [hd, hw, td, tw, 3]];
    for (const [ew, ed, twx, tdz, k] of sides) {
      const rot = (p) => { // rotate the +Z face to each side
        const x = p[0], z = p[2];
        return k === 0 ? [cx + x, p[1], cz + z] : k === 1 ? [cx + z, p[1], cz - x] : k === 2 ? [cx - x, p[1], cz - z] : [cx - z, p[1], cz + x];
      };
      const fn = (u, v) => {
        const s = u * 2 - 1, t = v;                          // s along the eave, t eave -> ridge
        const half = lerp(ew, twx, t), z = lerp(ed, tdz, t);
        const y = y0 + rise * Math.pow(t, curve) + lift * Math.pow(Math.abs(s), 2.6) * (1 - t) * (1 - t);
        return rot([s * half, y, z]);
      };
      this.style = o.style ?? SURF.TILES; this.sd = 0; this.c = c;
      this.grid(nu, nv, fn, { uv: [0, 0, ew * 2 * (o.m ?? 1), Math.hypot(rise, ed - tdz) * (o.m ?? 1)], colorFn: (u, v) => mul3(c, lerp(g0 * 0.7, g1, Math.pow(v, 0.6))) });
      // eave underside
      this.style = 0;
      const uc = o.underColor || mul3(c, 0.5);
      this.grid(nu, 1, (u, v) => { const p = fn(u, v * 0.42); p[1] -= 0.16 + 0.1 * v; return p; }, { flip: true, colorFn: () => uc });
      // eave fascia edge
      this.grid(nu, 1, (u, v) => { const p = fn(u, 0); p[1] -= 0.16 * (1 - v); return p; }, { colorFn: () => (o.edgeColor || mul3(c, 1.5)) });
    }
    this.style = st; this.sd = sd; this.c = c; this.g0 = g0; this.g1 = g1;
    return this;
  }
  // Append a BufferGeometry made by this kit (or any geometry with position/normal[/color/uv/win]).
  addGeometry(geo, matrix) {
    const p = geo.attributes.position, n = geo.attributes.normal, c = geo.attributes.color, u = geo.attributes.uv, w = geo.attributes.win, idx = geo.index;
    if (matrix) this.push(matrix);
    const st = this.style, sd = this.sd, lt = this.lit, base = this.nv, k = this.c;
    for (let i = 0; i < p.count; i++) {
      if (w) { this.style = w.getX(i); this.sd = w.getY(i); this.lit = w.getZ(i); }
      const vi = this.v(p.getX(i), p.getY(i), p.getZ(i), n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0, c ? c.getX(i) : k[0], c ? c.getY(i) : k[1], c ? c.getZ(i) : k[2], u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      if (w) this.W[vi * 3 + 1] = w.getY(i);
    }
    const cnt = idx ? idx.count : p.count;
    if (this.ni + cnt > this.icap) this._growI(cnt);
    for (let i = 0; i < cnt; i++) this.I[this.ni++] = base + (idx ? idx.getX(i) : i);
    this.style = st; this.sd = sd; this.lit = lt;
    if (matrix) this.pop();
    return this;
  }
  toGeometry() {
    const g = new THREE.BufferGeometry(), nv = this.nv, N = this.N;
    for (let i = 0; i < nv * 3; i += 3) if (!(N[i] * N[i] + N[i + 1] * N[i + 1] + N[i + 2] * N[i + 2] > 1e-10)) { N[i] = 0; N[i + 1] = 1; N[i + 2] = 0; }   // a zero normal would shade as NaN
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, nv * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(this.U.slice(0, nv * 2), 2));
    g.setAttribute('win', new THREE.BufferAttribute(this.W.slice(0, nv * 3), 3));
    g.setIndex(new THREE.BufferAttribute(nv > 65535 ? this.I.slice(0, this.ni) : new Uint16Array(this.I.subarray(0, this.ni)), 1));
    if (nv) { g.computeBoundingBox(); g.computeBoundingSphere(); }
    return groupFamilies(g);
  }
}
export const makeBuilder = (cap) => new Builder(cap);

// Orders a kit geometry's triangles as window surfaces first and everything else after, and records the two runs as groups
// 0 and 1, so the material pair mats.facades can draw each family with its own, smaller program. A single material ignores them.
export function groupFamilies(g) {
  const w = g.attributes.win, idx = g.index; g.clearGroups();
  if (!w || !idx) return g;
  const I = idx.array, W = w.array, n = I.length; let nW = 0;
  for (let i = 0; i < n; i += 3) if (isWindowStyle(Math.round(W[I[i] * 3]))) nW += 3;
  if (nW > 0 && nW < n) {
    const out = new I.constructor(n); let a = 0, b = nW;
    for (let i = 0; i < n; i += 3) {
      if (isWindowStyle(Math.round(W[I[i] * 3]))) { out[a++] = I[i]; out[a++] = I[i + 1]; out[a++] = I[i + 2]; }
      else { out[b++] = I[i]; out[b++] = I[i + 1]; out[b++] = I[i + 2]; }
    }
    I.set(out); idx.needsUpdate = true;
  }
  if (nW) g.addGroup(0, nW, 0);
  if (n - nW) g.addGroup(nW, n - nW, 1);
  return g;
}

// ---------- materials ----------
const GLSL_HASH = /* glsl */`
float sH1(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 sH2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float sVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sH1(i), sH1(i + vec2(1., 0.)), f.x), mix(sH1(i + vec2(0., 1.)), sH1(i + vec2(1., 1.)), f.x), f.y); }
float sBox(vec2 f, vec2 lo, vec2 hi, vec2 aa){ vec2 a = smoothstep(lo - aa, lo + aa, f) * (1. - smoothstep(hi - aa, hi + aa, f)); return a.x * a.y; }
float sLine(float x, float c, float w, float aa){ return 1. - smoothstep(w - aa, w + aa, abs(x - c)); }
`;

const FACADE_FRAG_PARS = /* glsl */`
uniform float uNight, uTime, uLit, uGlow, uReflect, uDetail, uLampDay, uFlood, uStreetGlow, uStreetY, uStreetFall, uCityRefl, uRelief;
uniform vec3 uWarm, uCool, uGlass, uSkyTop, uSkyHorizon, uSunDir, uSunColor, uFloodColor, uFloodDir, uNightFill;
varying vec3 vWin; varying vec2 vWuv; varying vec3 vWPos;
${GLSL_HASH}
// opening in a wall cell: kind 0 rectangle, 1 arched head, 2 round
float sOpen(vec2 f, vec2 lo, vec2 hi, vec2 aa, float kind){
  if (kind > 1.5) { float r = (hi.x - lo.x) * .5; return 1. - smoothstep(r - aa.x, r + aa.x, length(f - .5)); }
  float m = sBox(f, lo, hi, aa);
  if (kind > .5) {
    float hw = (hi.x - lo.x) * .5, yc = hi.y - hw * .62;
    vec2 q = vec2((f.x - .5) / hw, max(f.y - yc, 0.) / (hw * .62)); float ae = aa.x / hw * 1.5;
    m *= 1. - smoothstep(1. - ae, 1. + ae, length(q));
  }
  return m;
}
// what glass mirrors: the sky gradient and a band of far buildings standing on the horizon
vec3 sEnv(vec3 r){
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(r.y, 0., 1.), .55));
  float az = r.x / (abs(r.x) + abs(r.z) + 1e-4) * 15. + step(r.z, 0.) * 40.;        // a cheap stand-in for the bearing
  float bh = (sH1(vec2(floor(az), 3.)) * (.14 + .12 * step(.5, fract(az * .37))) + .015) * uCityRefl;
  float nr = smoothstep(.12, .7, uNight);
  vec3 city = mix(uSkyHorizon, uSkyTop, .4) * .3 + uWarm * (step(.7, sH1(floor(vec2(az * 11., r.y * 190.)))) * .24 * nr);
  sky = mix(sky, city, 1. - smoothstep(bh - .012, bh + .012, r.y));
  return mix(uSkyHorizon * .3, sky, smoothstep(-.1, .015, r.y));
}
// one carved mark per cell (1 inside the carving); k, k2: the cell's random numbers
float sGlyph(vec2 f, float k, float k2){
  vec2 p = (f - .5) * 2.; float d;
  if (k < .28) d = max(abs(p.x) - .55, abs(p.y - (k2 - .5) * .6) - .13);
  else if (k < .52) d = abs(length(p) - .42) - .1;
  else if (k < .76) d = min(length(p - vec2(0., .38)) - .17, max(abs(p.x) - .12, abs(p.y + .22) - .38));
  else d = max(abs(abs(p.y) - .28) - .1, abs(p.x) - .3 - .25 * k2);
  return 1. - smoothstep(-.07, .07, d);
}`;

// The fragment code injected into MeshStandardMaterial, in four parts so that three programs can be built from it: the full one
// (mats.facade: any style on any geometry) and the pair kit meshes are drawn with (mats.facades: windows / other surfaces).
// A software rasteriser runs every branch for every pixel, so the split halves the cost of a kit pixel.
const FACADE_HEAD = /* glsl */`
  float sStyle = floor(vWin.x + .5);
  vec3 sBase = diffuseColor.rgb;
  vec2 sFw = fwidth(vWuv);
  float sFm = max(sFw.x, sFw.y);
  float sNightR = smoothstep(.12, .7, uNight), sDay = 1. - sNightR;
  vec3 sVd = cameraPosition - vWPos; float sCamD = length(sVd); vec3 sV = sVd / max(sCamD, 1e-4);
  float sNear = 1. - smoothstep(120., 520., sCamD);
  vec3 sNg = inverseTransformDirection(normal, viewMatrix);
  // tangent frame of the uv mapping: sT, sB are the world directions of +u and +v, sCell the metres in one uv unit
  vec3 sP1 = dFdx(vWPos), sP2 = dFdy(vWPos); vec2 sU1 = dFdx(vWuv), sU2 = dFdy(vWuv);
  float sDet = sU1.x * sU2.y - sU2.x * sU1.y, sInv = abs(sDet) > 1e-14 ? 1. / sDet : 0.;
  vec3 sT = (sP1 * sU2.y - sP2 * sU1.y) * sInv, sB = (sP2 * sU1.x - sP1 * sU2.x) * sInv;
  vec2 sCell = vec2(length(sT), length(sB));
  sT = sCell.x > 1e-6 ? sT / sCell.x : vec3(1., 0., 0.); sB = sCell.y > 1e-6 ? sB / sCell.y : vec3(0., 1., 0.);
  sCell = clamp(sCell, vec2(.02), vec2(80.));
  float sSunN = dot(uSunDir, sNg); vec2 sSunT = vec2(dot(uSunDir, sT), dot(uSunDir, sB));
  // weathering: vertical streaks and broad blotches anchored in world space
  vec2 sWq = vec2(vWPos.x + vWPos.z * .73, vWPos.y);
  float sWx = sVN(sWq * vec2(.83, .09)) * .6 + (.5 + .5 * sin(sWq.x * .23 + 1.7) * sin(sWq.y * .17 + sWq.x * .06)) * .4;
  sBase *= 1. + (sWx - .5) * .26 * uDetail * sNear;
  diffuseColor.rgb = sBase;
`;

const FACADE_WIN = /* glsl */`
    vec2 cell = floor(vWuv), f = fract(vWuv);
    vec2 lo = vec2(.24, .2), hi = vec2(.76, .8);
    // corr: floor-wide switching, mull: glazing bars and curtains, fb: mirror strength, rec: recess depth (m), roomD / roomW: room depth (m) and width (cells)
    float corr = .15, mull = 1., frameW = .05, fb = .12, rec = .24, kind = 0., sill = 1., roomD = 3.4, roomW = 1.;
    if (sStyle > 8.5) { lo = vec2(.05, .05); hi = vec2(.95, .72); mull = 0.; frameW = 0.; fb = .2; rec = .3; sill = 0.; roomD = 5.; }
    else if (sStyle > 6.5) { lo = vec2(.07, .1); hi = vec2(.93, .88); mull = 0.; frameW = .035; fb = .0; rec = .08; sill = 0.; }
    else if (sStyle > 5.5) { lo = vec2(.26); hi = vec2(.74); mull = 0.; kind = 2.; rec = .3; sill = 0.; }
    else if (sStyle > 4.5) { lo = vec2(.42, .2); hi = vec2(.58, .8); mull = 0.; frameW = 0.; rec = .45; sill = 0.; }
    else if (sStyle > 3.5) { lo = vec2(.03, .035); hi = vec2(.97, .965); corr = .5; mull = 0.; frameW = 0.; fb = .34; rec = .09; sill = 0.; roomD = 7.; roomW = 3.; }
    else if (sStyle > 2.5) { lo = vec2(-.2, .3); hi = vec2(1.2, .88); corr = .6; mull = 0.; frameW = 0.; fb = .26; rec = .2; sill = 0.; roomD = 7.; roomW = 3.; }
    else if (sStyle > 1.5) { lo = vec2(.27, .14); hi = vec2(.73, .84); kind = 1.; }
    vec2 aa = clamp(sFw * .7, vec2(.002), vec2(.5));
    float lod = smoothstep(.2, .6, sFm);
    float relief = uRelief * (1. - smoothstep(.05, .3, sFm));          // depth cues fade out before the cells alias
    float sVn = max(dot(sV, sNg), .16); vec2 sVt = vec2(dot(sV, sT), dot(sV, sB));
    // the glass sits rec metres behind the wall: seen at an angle, one reveal of the opening comes into view
    vec2 pOff = -sVt / sVn * (rec * relief) / sCell;
    if (lo.x < 0.) pOff.x = 0.;
    pOff = clamp(pOff, -(hi - lo) * .45, (hi - lo) * .45);
    vec2 fg = f + pOff;
    float mO = sOpen(f, lo, hi, aa, kind), mG = sOpen(fg, lo, hi, aa, kind);
    float area = clamp((min(hi.x, 1.) - max(lo.x, 0.)) * (hi.y - lo.y), 0., 1.) * (kind > 1.5 ? .7 : 1.);
    float m = mix(mO * mG, area, lod), mR = mO * (1. - mG) * (1. - lod);
    float fr = mix(sOpen(f, lo - frameW, hi + frameW * vec2(1., .7), aa, kind), area, lod);
    float sSeed = floor(vWin.y * 1024. + .5);
    vec2 hc = cell + vec2(sSeed * 3., sSeed * 7.);
    float r1 = sH1(hc); vec2 r2 = sH2(hc + 5.3); float r3 = sH1(hc + 11.9);
    float rf = sH1(vec2(cell.y + 3., sSeed * 5.));
    float r = mix(r1, rf, corr) + .05 * sin(uTime * .11 + r3 * 60.);
    float p = clamp(uLit * vWin.z, 0., 1.5) * sNightR;
    float on = 1. - smoothstep(p - .015, p + .015, r);
    on = mix(on, clamp(p, 0., 1.), smoothstep(.45, 1.1, sFm));
    vec3 lc = mix(uWarm * mix(vec3(1., .7, .42), vec3(1.), r2.x), uCool, step(.76, r3));
    float bri = .38 + 1.0 * r2.y * r2.y;
    float tv = step(.955, r1);
    bri *= mix(1., .9 + .5 * sin(uTime * 9. + r3 * 97.) * sin(uTime * 5.3 + r3 * 31.), tv);
    lc = mix(lc, vec3(.4, .58, 1.), tv * .8);
    vec2 wq = clamp((fg - max(lo, 0.)) / (min(hi, 1.) - max(lo, 0.)), 0., 1.);
    // the room behind the glass (interior mapping): a box one cell high, roomW cells wide, roomD metres deep
    vec3 rp = vec3(clamp((mod(cell.x, roomW) + fg.x) / roomW, .001, .999), clamp(fg.y, .001, .999), 0.);
    vec3 rd = vec3(-sVt.x / (sCell.x * roomW), -sVt.y / sCell.y, sVn / roomD);
    rd.x = abs(rd.x) < 1e-5 ? 1e-5 : rd.x; rd.y = abs(rd.y) < 1e-5 ? 1e-5 : rd.y;
    float tx = (step(0., rd.x) - rp.x) / rd.x, ty = (step(0., rd.y) - rp.y) / rd.y, tz = 1. / rd.z;
    float tm = min(tx, min(ty, tz)); vec3 rh = rp + rd * tm;
    float room;
    if (tm == tz) room = (.46 + .34 * sH1(floor(rh.xy * vec2(2. * roomW, 2.)) + hc)) * (.72 + .28 * rh.y);   // back wall: doors, shelves, pictures
    else if (tm == ty) room = rd.y > 0. ? (1.2 - .5 * rh.z) * (roomW > 1.5 ? .55 + .6 * step(.5, fract(rh.z * 2.5 + .2)) : 1.) : .34 - .14 * rh.z;   // ceiling (with strip lights in offices), floor
    else room = .68 - .3 * rh.z;                                                                              // party walls
    room = mix(.66, room, relief);
    float inter = room, interFar = .7;
    float cw = r2.x * .34 * step(.3, r3);
    float cur = clamp((1. - smoothstep(cw, cw + .04, wq.x)) + smoothstep(1. - cw - .04, 1. - cw, wq.x), 0., 1.) * step(.001, cw) * mull;   // curtains drawn at the sides
    float bl = 1. - r2.y * .55 * step(r3, .42);
    float bld = smoothstep(bl - .03, bl, wq.y) * step(bl, .995) * mull;                                       // a blind pulled part of the way down
    float fab = clamp(cur + bld, 0., 1.);
    inter = mix(inter, .5 + .12 * sin(wq.x * 60.) * cur, fab);
    float mu = (1. - smoothstep(.02, .04, abs(wq.x - .5))) + (1. - smoothstep(.014, .03, abs(wq.y - .62)));
    inter *= 1. - clamp(mu, 0., 1.) * .8 * mull;
    vec3 wall = sBase * (1. + (sH1(cell + sSeed * 11. + 2.) - .5) * .12 * uDetail * (1. - lod));
    float spand = 0.;
    if (sStyle > 6.5 && sStyle < 7.5) {            // shoji: paper screens behind a dark lattice
      vec2 g = abs(fract(wq * vec2(3., 4.)) - .5);
      float lat = smoothstep(.41, .47, max(g.x, g.y));
      inter = (.75 + .35 * r2.y) * (1. - lat * .8); bri = .9; lc = uWarm * vec3(1., .78, .5); fab = 1.;
    } else if (sStyle > 8.5) {                      // shopfront: bright, sometimes coloured, with an awning band
      vec3 tintc = .55 + .45 * cos(6.2831 * (r3 + vec3(0., .33, .67)));
      lc = mix(uWarm * vec3(1., .88, .74), tintc, step(.6, r2.x) * .5); bri = .5 + .35 * r2.y;
      float gx = wq.x * 9. + r3 * 40.;                                // display silhouettes: blocks of goods along the sill
      float goods = smoothstep(0., .03, wq.y - (.08 + .3 * sH1(vec2(floor(gx), r1 * 9.)) * step(.12, fract(gx))));
      float mq = abs(fract(wq.x * 3. + .5) - .5);
      inter = (.25 + .5 * wq.y * wq.y + .45 * room) * mix(.3, 1., goods) * (1. - .75 * (1. - smoothstep(.012, .03, mq)) * (1. - lod));
      float aw = smoothstep(.78, .8, f.y) * (1. - smoothstep(.9, .92, f.y)) * step(.35, r1);   // fascia band in a muted shop colour
      wall = mix(wall, mix(sBase, tintc * tintc, .3) * .62, aw * (1. - lod));
    } else if (sStyle > 2.5 && sStyle < 4.5) {      // office floors: slab edge, panel joints, strip lights on the ceilings
      wall *= 1. - .25 * (1. - smoothstep(.0, .05, f.y)) * (1. - lod);
      wall *= 1. - .16 * (sLine(f.x, 0., .012, aa.x) + sLine(f.x, 1., .012, aa.x)) * (1. - lod) * step(sStyle, 3.5);
      inter = room * .8 * (1. - .7 * (1. - smoothstep(.0, .03, abs(f.x - .5) - .47)) * step(sStyle, 3.5));
      interFar = .34; bri = .4 + .7 * r2.y; on *= step(r3, .7);
      lc = mix(lc, mix(uCool, vec3(1., .93, .82), r2.x), step(.38, r1));
      spand = step(3.5, sStyle) * (1. - smoothstep(.2, .2 + aa.y * 2. + .01, fg.y)) * (1. - lod);   // curtain wall: an opaque spandrel hides each floor slab
    } else if (sill > .5) {                         // masonry wall round a punched window: coursing, a sill and the shadow it throws
      vec2 bs = vec2(.92, .31), bq = vWuv * sCell / bs; float brow = floor(bq.y); bq.x += .5 * mod(brow, 2.);
      vec2 bw = sFw * sCell / bs;
      float blod = smoothstep(.25, .7, max(bw.x, bw.y));
      float mort = 1. - sBox(fract(bq), vec2(.03, .09), vec2(.97, .91), clamp(bw, vec2(.01), vec2(.5)));
      wall *= mix(1. + ((sH1(vec2(floor(bq.x), brow) + sSeed) - .5) * .17 - mort * .15) * uDetail, 1. - .03 * uDetail, blod);
      vec2 sLo = vec2(lo.x - .07, lo.y - frameW - .055), sHi = vec2(hi.x + .07, lo.y - frameW * .3);
      float mS = sBox(f, sLo, sHi, aa) * (1. - lod);
      vec2 so = clamp(sSunT / max(sSunN, .05) * .16 / sCell, vec2(-.3), vec2(.3));
      float mSh = sBox(f + so, sLo, sHi, aa + .012) * (1. - mS) * (1. - lod) * smoothstep(.02, .12, sSunN);
      wall = mix(wall * (1. - .45 * mSh * sDay), sBase * 1.3 + .02, mS);
    }
    inter = mix(inter, interFar, lod);
    wall = mix(wall, sBase * 1.32 + .015, clamp(fr - mO, 0., 1.) * step(.001, frameW));
    // lit fraction of the recessed glass: the head and the sunward jamb shade it; edges sit in a soft contact shadow
    float shG = mix(1., sBox(fg + sSunT / max(sSunN, .05) * (rec * relief) / sCell, lo, hi, aa + .03), smoothstep(.02, .12, sSunN) * relief);
    vec2 eg = min(fg - lo, hi - fg) * sCell;
    float ao = mix(1., .62 + .38 * smoothstep(0., .22, kind > 1.5 ? ((hi.x - lo.x) * .5 - length(fg - .5)) * sCell.x : min(eg.x + step(lo.x, -.01) * 9., eg.y)), relief);
    vec3 glassAlb = mix(uGlass * (.65 + .7 * r1), vec3(.5, .47, .42) * (.7 + .5 * r2.x), fab * .85 * (1. - lod)) * (.5 + .5 * shG) * ao;
    vec3 revAlb = mix(wall, sBase * 1.25 + .012, step(.001, frameW)) * .92;
    diffuseColor.rgb = mix(mix(wall, revAlb, mR), glassAlb, m);
    roughnessFactor = mix(roughnessFactor, mix(.16, .8, fab * (1. - lod)), m * step(.001, fb));
    vec3 sNp = normalize(sNg + (sT * (r1 - .5) + sB * (r2.x - .5)) * (.05 + .12 * fb) * (1. - lod));   // every pane sits a little out of true
    vec3 sR = reflect(-sV, sNp);
    float sF = fb + (1. - fb) * pow(1. - clamp(dot(sNp, sV), 0., 1.), 4.);
    vec3 refl = (sEnv(sR) * sF + uSunColor * pow(max(dot(sR, uSunDir), 0.), 160.) * 5.) * uReflect * step(.001, fb) * (1. - .7 * fab * (1. - lod));
    vec3 emit = lc * bri * inter * on * uGlow * (1. - spand) * ao;
    vec3 dayIn = uSkyHorizon * room * (.05 + .1 * shG) * sDay * (1. - spand) * (1. - lod) * ao * step(.001, fb);   // by day a hint of the room shows through
    totalEmissiveRadiance += (emit + dayIn * (1. - sF) + refl * (1. - on * .65)) * m;
    vec2 sDq = max(max(lo - f, f - hi), 0.);                          // warm spill on the wall around a lit window
    float spill = exp(-length(sDq * vec2(1., 1.6)) * 9.) * (1. - mO) * (1. - lod) * step(.001, frameW + step(8.5, sStyle));
    totalEmissiveRadiance += sBase * lc * (bri * on * (spill * .3 + mR * .5) * uGlow);
    // light the reveal as the surface it is: jambs face along the wall, the sill faces up, the head down
    vec2 dR = (clamp(fg, lo, hi) - fg) * sCell;
    if (kind > 1.5) dR = (vec2(.5) - fg) * sCell;
    else if (kind < .5) dR = abs(dR.x) * abs(pOff.y * sCell.y) >= abs(dR.y) * abs(pOff.x * sCell.x) ? vec2(sign(dR.x), 0.) : vec2(0., sign(dR.y));
    float dRl = length(dR);
    if (mR > .001 && dRl > 1e-6) { dR /= dRl; normal = normalize(mix(normal, normalize((viewMatrix * vec4(sT * dR.x + sB * dR.y, 0.)).xyz), mR)); }
`;

const FACADE_SURF = /* glsl */`
  // one shared cell pattern serves masonry, tiles, planks, sleepers, lacquer and steel: scale, stagger, joint box and grain are picked per style
  vec2 pP = vWuv, pS = vec2(1.1, 2.3) / max(vWin.z, .1), pLo = vec2(.03, .07), pHi = vec2(.97, .93), pG = vWuv * 9.; float pStag = .5, pSkew = .13;
  if (sStyle > 18.5) { pP = vWuv * sCell; pS = vec2(1. / 2.4, 1. / 3.); pLo = vec2(.012, .01); pHi = vec2(.988, .99); pSkew = 0.; pG = pP * vec2(3.1, .16); }            // steel plates, 2.4 x 3 m
  else if (sStyle > 17.5) { pP = vWuv * sCell; pS = vec2(1., 1. / 3.6); pLo = vec2(-1., .004); pHi = vec2(2., .996); pStag = 0.; pSkew = 0.; pG = pP * vec2(28., .8); }   // lacquered timber, a scarf joint every 3.6 m
  else if (sStyle > 13.5) { pS = vec2(1., 1. / .62); pLo = vec2(.13, .3); pHi = vec2(.87, .7); pStag = 0.; pSkew = 0.; pG = vWPos.xz * 7.; }                           // sleepers every 0.62 m
  else if (sStyle > 12.5) { pG = vWPos.xz * 2.3; }                                                                                                                  // road: grain only
  else if (sStyle > 11.5) { pS = vec2(4.2, .0001); pLo = vec2(.035, -1.); pHi = vec2(.965, 2.); pStag = 0.; pSkew = 0.; pG = vWuv * vec2(37.8, 1.3); }                  // planks
  else if (sStyle > 10.5) { pS = vec2(3., 2.5); pSkew = 0.; }                                                                                                       // roof tiles
  vec2 pq = pP * pS; float pRow = floor(pq.y); pq.x += pStag * mod(pRow, 2.) + pSkew * pRow;
  vec2 pf = fract(pq), pw = sFw * pS * (sStyle > 17.5 ? sCell : vec2(1.));
  float pLod = smoothstep(.2, .65, max(pw.x, pw.y));
  float pJoint = 1. - sBox(pf, pLo, pHi, clamp(pw, vec2(.004), vec2(.5)));
  float pTint = sH1(vec2(floor(pq.x), pRow) + .5), pGrain = sVN(pG);
  if (sStyle > 7.5 && sStyle < 8.5) {               // glow: lamps, beacons, lit signs
    float blink = vWin.y > .001 ? smoothstep(.45, .5, fract(uTime * .7 + vWin.y)) * (1. - smoothstep(.9, .95, fract(uTime * .7 + vWin.y))) : 1.;
    totalEmissiveRadiance += sBase * vWin.z * mix(uLampDay, 1., sNightR) * uGlow * blink;
    diffuseColor.rgb = min(sBase, vec3(1.)) * .3;
  } else if (sStyle > 9.5 && sStyle < 10.5) {       // masonry: each block's upper edge catches the light, its lower edge sits in shadow
    float bev = (smoothstep(.8, .93, pf.y) - (1. - smoothstep(.07, .2, pf.y))) * (1. - pJoint) * (1. - pLod) * .09;
    diffuseColor.rgb = sBase * mix(1. + ((pTint - .5) * .24 - pJoint * .3 + (pGrain - .5) * .1 * sNear + bev) * uDetail, 1. - .05 * uDetail, pLod);
  } else if (sStyle > 10.5 && sStyle < 11.5) {      // roof tiles
    float sh = mix(1.14, .62, smoothstep(.35, 1., pf.y)), gap = 1. - smoothstep(.0, .1, abs(pf.x - .5) * 2. - .82);
    diffuseColor.rgb = sBase * mix((sh - (1. - gap) * .22) * (.84 + .32 * pTint), .9, pLod);
  } else if (sStyle > 11.5 && sStyle < 12.5) {      // planks
    diffuseColor.rgb = sBase * mix((.8 + .34 * pTint) * (.92 + .16 * pGrain) - pJoint * .4, .93, pLod);
  } else if (sStyle > 12.5 && sStyle < 13.5) {      // road
    float x = vWuv.x, aaX = clamp(sFw.x, .0005, .2);
    float lanes = vWin.z;
    float lodR = 1. - smoothstep(.012, .05, sFw.x);
    float mark = (sLine(x, .04, .009, aaX) + sLine(x, .96, .009, aaX)) * step(.5, lanes);
    float dash = step(fract(vWuv.y / 9.), .4);
    if (lanes > 3.5) { mark += sLine(x, .492, .006, aaX) + sLine(x, .508, .006, aaX) + (sLine(x, .27, .006, aaX) + sLine(x, .73, .006, aaX)) * dash; }
    else if (lanes > 1.5) mark += sLine(x, .5, .009, aaX) * dash;
    float gr = pGrain * .5 + sWx * .5;
    vec3 asph = sBase * (.82 + .36 * gr * uDetail * sNear + .18 * (1. - sNear) * uDetail);
    diffuseColor.rgb = mix(asph, vec3(.62, .6, .5), clamp(mark, 0., 1.) * lodR * .9);
    roughnessFactor = mix(roughnessFactor, .5, .5);
  } else if (sStyle > 13.5 && sStyle < 14.5) {      // railway bed: ballast with sleepers
    vec3 ballast = sBase * mix(.78 + .44 * pGrain, 1., 1. - sNear * (1. - pLod));
    diffuseColor.rgb = mix(ballast, vec3(.07, .05, .04), mix(1. - pJoint, .4, pLod) * .92);
  } else if (sStyle > 14.5 && sStyle < 15.5) {      // canvas lit from inside
    float fl = .9 + .1 * sin(uTime * 7. + vWin.y * 40.) * sin(uTime * 3.1 + vWin.y * 13.);
    float seam = 1. - .25 * (1. - smoothstep(.0, .06, abs(fract(vWuv.x) - .5) * 2. - .9));
    diffuseColor.rgb = sBase * seam;
    totalEmissiveRadiance += sBase * vec3(1., .66, .36) * (1.25 - clamp(vWuv.y, 0., 1.)) * vWin.z * sNightR * uGlow * .5 * fl * seam;
  } else if (sStyle > 15.5 && sStyle < 16.5) {      // painted stripes
    float t = vWin.z > 1.5 ? vWuv.y : vWuv.x; float aaS = clamp((vWin.z > 1.5 ? sFw.y : sFw.x), .001, .5);
    float s = smoothstep(.5 - aaS, .5 + aaS, abs(fract(t) - .5) * 2.);
    diffuseColor.rgb = mix(sBase, vec3(.8, .78, .72) * (1. + (sWx - .5) * .2), s);
  } else if (sStyle > 16.5 && sStyle < 17.5) {      // fluted shaft: grooves run along v, one per unit of u
    float ph = fract(vWuv.x) * 6.2831853, lodF = smoothstep(.22, .6, sFw.x);
    diffuseColor.rgb = sBase * mix(.9 + .14 * cos(ph), .93, lodF);
    normal = normalize((viewMatrix * vec4(normalize(sNg + sT * (sin(ph) * .55 * (1. - lodF))), 0.)).xyz);
  } else if (sStyle > 17.5 && sStyle < 18.5) {      // lacquered timber: fine grain along v, scarf joints, a soft sheen
    float lodL = smoothstep(.02, .12, sFw.x * sCell.x);
    vec3 c = sBase * (.82 + .34 * mix(pGrain * .6 + sWx * .4, .5, lodL) * uDetail) * (1. - .4 * pJoint * (1. - lodL));
    diffuseColor.rgb = mix(vec3(dot(c, vec3(.3, .6, .1))), c, .9);
    roughnessFactor = .34;
  } else if (sStyle > 18.5 && sStyle < 19.5) {      // painted steel plate: lapped seams, rivets along them, rain streaks
    float edge = min(min(pf.x, 1. - pf.x) * 2.4, min(pf.y, 1. - pf.y) * 3.);          // metres to the nearest seam
    float riv = (1. - smoothstep(.07, .11, length(fract(pP / .3) - .5))) * step(edge, .3) * step(.03, edge) * (1. - smoothstep(.03, .12, max(sFw.x * sCell.x, sFw.y * sCell.y) / .3));
    diffuseColor.rgb = sBase * mix(1. + ((pTint - .5) * .12 - pJoint * .32 + riv * .16 - pGrain * sWx * .34) * uDetail, 1. - .1 * uDetail, smoothstep(.12, .45, max(pw.x, pw.y)));
    roughnessFactor = .46;
  } else if (sStyle > 19.5 && sStyle < 20.5) {      // carved frieze: one engraved mark per uv cell
    vec2 cell = floor(vWuv), f = fract(vWuv);
    float lodG = smoothstep(.1, .35, sFm), k = sH1(cell + 17.3), k2 = sH1(cell + 41.7), keep = step(.14, fract(k2 * 5.7));
    vec2 ld = normalize((sSunN > .02 ? sSunT : vec2(-.5, .7)) + vec2(-.04, .08)) * .045;
    float h0 = sGlyph(f, k, k2) * keep, hA = sGlyph(f + ld, k, k2) * keep;     // sunk carving: its lightward edge is in shadow, the far edge catches the light
    diffuseColor.rgb = sBase * mix(1. - (.2 * h0 + .38 * max(h0 - hA, 0.) - .3 * max(hA - h0, 0.)) * vWin.z, 1. - .1 * vWin.z, lodG);
  }
`;

const FACADE_TAIL = /* glsl */`
  vec3 sNe = inverseTransformDirection(normal, viewMatrix);
  if (sStyle < .5 || (sStyle > 9.5 && sStyle < 10.5) || sStyle > 15.5) {   // floodlit stone at night: lamps on the ground, below and to one side
    float fk = clamp(dot(sNe, uFloodDir) * .62 + .5, 0., 1.);
    totalEmissiveRadiance += diffuseColor.rgb * uFloodColor * (vWin.y * sNightR * uFlood * (.2 + 1.15 * fk * fk));
  }
  if (sStyle < 7.5 || sStyle > 8.5)                                         // night fill: cool skylight from above, warm street light washing up from the ground
    totalEmissiveRadiance += diffuseColor.rgb * (uNightFill * (.55 + .45 * sNe.y) + uWarm * (uStreetGlow * exp(-max(vWPos.y - uStreetY, 0.) / uStreetFall) * (1. - .5 * max(sNe.y, 0.)))) * sNightR;
`;
const FACADE_IS_WIN = '(sStyle > .5 && sStyle < 7.5) || (sStyle > 8.5 && sStyle < 9.5)';
const FACADE_FRAG_MAIN = {
  full: '{' + FACADE_HEAD + '  if (' + FACADE_IS_WIN + ') {' + FACADE_WIN + '  } else {' + FACADE_SURF + '  }' + FACADE_TAIL + '}',
  win: '{' + FACADE_HEAD + '  {' + FACADE_WIN + '  }' + FACADE_TAIL + '}',
  surf: '{' + FACADE_HEAD + '  {' + FACADE_SURF + '  }' + FACADE_TAIL + '}',
};

const SKY_DAY = { top: '#2f66b8', horizon: '#a9c9e6', sun: '#fff0d8' };
const SKY_NIGHT = { top: '#04060f', horizon: '#141a30', sun: '#8fa6d8' };

const FLOAT_GLSL = /* glsl */`
uniform float uTime; uniform vec4 uFloat;
attribute vec4 aAnim;
vec3 sFloat(vec4 an, out float fade){
  float span = uFloat.y;
  float h = span > 0. ? mod(an.x * span + uTime * uFloat.x * an.y, span) : 0.;
  fade = span > 0. ? smoothstep(0., span * .06, h) * (1. - smoothstep(span * .82, span, h)) : 1.;
  float t = uTime * uFloat.w * (.7 + .6 * an.w) + an.x * 43.;
  return vec3(sin(t) + .5 * sin(t * .37 + an.w * 9.), .25 * sin(t * .61 + an.w * 21.), cos(t * .83) + .5 * cos(t * .29 + an.w * 5.)) * uFloat.z * an.z + vec3(0., h, 0.);
}`;

const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float sFog = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float sFog = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= 1. - sFog * FOG_KEEP;
#endif`;

// Mirror-image geometry under a water surface at y0: stretched downward and swaying with the swell, more the deeper it reaches.
const RIPPLE_GLSL = /* glsl */`
vec3 sRipple(vec3 wp, float y0, float t){
  float d = max(y0 - wp.y, 0.), a = min(d * .05, 1.5);
  wp.x += (sin(wp.z * .33 + d * .55 + t * 1.3) + .5 * sin(wp.z * .9 - d * 1.3 + t * 2.1)) * a;
  wp.z += (cos(wp.x * .29 - d * .5 + t * 1.1) + .5 * cos(wp.x * .8 + d * 1.1 - t * 1.9)) * a * .6;
  // long level edges (decks, quays, parapets) undulate too, so nothing mirrored stays ruler-straight
  if (d > 0.) wp.y = y0 - d * 1.12 + min(d * .075, 1.9) * (.62 * sin(wp.x * .115 + t * .9) + .5 * sin(wp.z * .093 - t * .7 + wp.x * .041) + .3 * sin((wp.x - wp.z) * .21 + t * 1.6));
  return wp;
}`;

function shaderMat(shared, extra, o) {
  return new THREE.ShaderMaterial(Object.assign({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), shared, extra || {}), fog: true,
  }, o));
}

function lanternMaterial(shared, uFloat) {
  return shaderMat(shared, { uFloat: { value: uFloat || new THREE.Vector4(0, 0, 0, 0) } }, {
    vertexColors: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${FLOAT_GLSL}
      varying vec3 vCol; varying vec2 vEh; varying float vSeed; varying vec3 vN;
      void main(){
        float fade; vec3 off = sFloat(aAnim, fade);
        vec4 wp = vec4(position * fade, 1.); vec3 n = normal;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
        #endif
        wp = modelMatrix * wp; wp.xyz += off;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        vCol = color;
        #ifdef USE_INSTANCING_COLOR
          vCol *= instanceColor;
        #endif
        vEh = uv; vSeed = aAnim.w; vN = normalize(mat3(modelMatrix) * n);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uNight, uGlow, uLampDay; uniform vec3 uAmbient, uSunDir, uSunColor;
      varying vec3 vCol; varying vec2 vEh; varying float vSeed; varying vec3 vN;
      void main(){
        float nr = smoothstep(.12, .7, uNight);
        float fl = 1. + .14 * sin(uTime * 11. + vSeed * 40.) * sin(uTime * 4.3 + vSeed * 17.);
        float fq = (vEh.x - .3) * 2.4; float flame = mix(.5, 1.5, exp(-fq * fq));
        vec3 N = normalize(vN);
        vec3 day = vCol * (uAmbient * (.75 + .25 * N.y) + uSunColor * max(dot(N, uSunDir), 0.) * .6) * mix(1., .25, vEh.y * nr);
        vec3 lit = vCol * mix(uLampDay * 2., 1., nr) * uGlow * 1.25 * flame * fl * vEh.y;
        gl_FragColor = vec4(day + lit, 1.);
        #include <fog_fragment>
      }`,
  });
}

// The under-water copy of the facade material used by makeReflection: one small unlit program (flat sun + ambient shading, the same
// lit windows, glow, floodlight and night fill) that sways with the swell and dissolves into the reflected sky with depth and distance.
function mirrorMaterial(shared, uClip) {
  return shaderMat(shared, { uClipY: uClip }, {
    vertexColors: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${RIPPLE_GLSL}
      uniform float uClipY, uTime;
      attribute vec3 win;
      varying vec3 vCol, vWin, vWPos, vN; varying vec2 vWuv;
      void main(){
        vec4 wp = vec4(position, 1.); vec3 n = normal;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
        #endif
        wp = modelMatrix * wp; wp.xyz = sRipple(wp.xyz, uClipY, uTime);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        vCol = color; vWin = win; vWuv = uv; vWPos = wp.xyz; vN = mat3(modelMatrix) * n;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uClipY, uMirrorFar, uTime, uNight, uLit, uGlow, uLampDay, uFlood;
      uniform vec3 uWarm, uCool, uGlass, uSkyTop, uSkyHorizon, uSunDir, uSunColor, uAmbient, uFloodColor, uNightFill;
      varying vec3 vCol, vWin, vWPos, vN; varying vec2 vWuv;
      ${GLSL_HASH}
      void main(){
        if (vWPos.y > uClipY) discard;
        float st = floor(vWin.x + .5), nr = smoothstep(.12, .7, uNight);
        vec3 N = normalize(vN); N.y = -N.y;                                   // the normal of the real surface this is the image of
        vec3 light = uAmbient * (.72 + .28 * N.y) + uSunColor * (max(dot(N, uSunDir), 0.) * .75 * (1. - nr * .6));
        vec3 base = vCol, emit = vec3(0.);
        if ((st > .5 && st < 7.5) || (st > 8.5 && st < 9.5)) {                 // windows: the same cells are lit as on the building above
          vec2 cell = floor(vWuv), fw = fwidth(vWuv); float fm = max(fw.x, fw.y), lod = smoothstep(.2, .6, fm);
          float m = mix(sBox(fract(vWuv), vec2(.2), vec2(.8), clamp(fw * .7, vec2(.002), vec2(.5))), .4, lod);
          float sd = floor(vWin.y * 1024. + .5); vec2 hc = cell + vec2(sd * 3., sd * 7.);
          float r1 = sH1(hc), r3 = sH1(hc + 11.9);
          float r = mix(r1, sH1(vec2(cell.y + 3., sd * 5.)), st > 2.5 && st < 4.5 ? .55 : .15);
          float p = clamp(uLit * vWin.z, 0., 1.5) * nr;
          float on = mix(1. - smoothstep(p - .015, p + .015, r), clamp(p, 0., 1.), smoothstep(.45, 1.1, fm));
          vec3 lc = mix(uWarm * mix(vec3(1., .7, .42), vec3(1.), r3), uCool, step(.76, r3));
          base = mix(base, uGlass, m);
          emit = (lc * (.3 + .6 * r1) * on * uGlow + mix(uSkyHorizon, uSkyTop, .35) * .22 * (1. - on)) * m;
        } else if (st > 7.5 && st < 8.5) { emit = base * vWin.z * mix(uLampDay, 1., nr) * uGlow; base *= .3; }
        else if (st > 14.5 && st < 15.5) emit = base * vec3(1., .66, .36) * (vWin.z * nr * uGlow * .4);
        else if (st < .5 || (st > 9.5 && st < 10.5) || st > 15.5) emit = base * uFloodColor * (vWin.y * nr * uFlood * .8);
        vec3 col = base * (light + uNightFill * nr) + emit;
        float rd = max(uClipY - vWPos.y, 0.) / 1.12;                           // height of this point above the water, before mirroring
        vec3 cv = cameraPosition - vWPos; vec2 sp = vWPos.xz + cv.xz * ((uClipY - vWPos.y) / max(cv.y, .05));   // where the sight line crosses the surface
        // the swell slices the image into bands lying across the line of sight: thin near the waterline, wider and emptier with height
        vec2 vd = normalize(cv.xz + 1e-4), sq = vec2(sp.x * vd.y - sp.y * vd.x, dot(sp, vd));
        float fd = fwidth(sq.y), lodF = smoothstep(.35, 1.2, fd), lodC = smoothstep(1.4, 5., fd);        // fine bands near, broad ones further out, their mean beyond
        float rn = mix(sVN(sq * vec2(.11, .85) + uTime * vec2(.15, -.55)), sVN(sq * vec2(.035, .21) + uTime * vec2(.05, -.2)), lodF);
        float cut = mix(.24, .6, smoothstep(1., 40., rd));
        float slice = mix(smoothstep(cut - .09, cut + .09, rn), 1. - cut * .9, lodC);
        float mir = exp(-rd * .013) * mix(1., slice, smoothstep(.5, 9., rd)) * (1. - smoothstep(uMirrorFar * .7, uMirrorFar, length(cv)));
        gl_FragColor = vec4(mix(mix(uSkyHorizon, uSkyTop, .3) * .85, col, mir), 1.);
        #include <fog_fragment>
      }`,
  });
}

// uClip: when given, this is the under-water copy used by makeReflection: glows smear into long streaks hanging below the waterline.
function haloMaterial(shared, uFloat, uClip) {
  return shaderMat(shared, { uFloat: { value: uFloat || new THREE.Vector4(0, 0, 0, 0) }, uClipY: uClip || { value: 0 } }, {
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, defines: uClip ? { BELOW: 1 } : {},
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${FLOAT_GLSL}
      ${RIPPLE_GLSL}
      uniform float uClipY, uMirrorFar;
      attribute vec2 aHalo;
      varying vec3 vCol; varying vec2 vUv2; varying float vTw; varying float vMode; varying float vWy;
      void main(){
        float fade; vec3 off = sFloat(aAnim, fade);
        vec4 wp = vec4(position, 1.); float size = aHalo.x;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; size *= length(instanceMatrix[0].xyz);
        #endif
        wp = modelMatrix * wp; wp.xyz += off;
        vec4 mvPosition; vWy = -1e6;
        #ifdef BELOW
          fade *= 1. - smoothstep(uMirrorFar * .7, uMirrorFar, distance(cameraPosition, wp.xyz));
          wp.xyz = sRipple(wp.xyz, uClipY, uTime);
          vec2 st = uv * size * vec2(.7, 3.6);
          if (aHalo.y < .5) { mvPosition = viewMatrix * wp; mvPosition.xy += st; vWy = wp.y + st.y; fade *= .55; }
          else { wp.xz += uv * size; mvPosition = viewMatrix * wp; }
        #else
          if (aHalo.y < .5) { mvPosition = viewMatrix * wp; mvPosition.xy += uv * size; }
          else { wp.xz += uv * size; mvPosition = viewMatrix * wp; }
        #endif
        gl_Position = projectionMatrix * mvPosition;
        vCol = color * fade;
        #ifdef USE_INSTANCING_COLOR
          vCol *= instanceColor;
        #endif
        vUv2 = uv; vTw = aAnim.w; vMode = aHalo.y;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define FOG_KEEP .8
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uNight, uHalo, uLampDay, uClipY;
      varying vec3 vCol; varying vec2 vUv2; varying float vTw; varying float vMode; varying float vWy;
      void main(){
        float d = length(vUv2); if (d > 1.) discard;
        #ifdef BELOW
          if (vWy > uClipY) discard;
        #endif
        float nr = smoothstep(.12, .7, uNight);
        float e = clamp(1. - d, 0., 1.); float a = vMode < .5 ? pow(e, 2.6) + .5 * pow(e, 9.) : pow(e, 1.7);
        float tw = vTw > 0. ? .72 + .28 * sin(uTime * (1.5 + vTw * 4.) + vTw * 60.) : 1.;
        gl_FragColor = vec4(vCol * a * tw * uHalo * mix(uLampDay * .5, 1., nr), 1.);
        ${FOG_ADD}
      }`,
  });
}

// uClip: the under-water copy for makeReflection (swaying, dimmer, no minimum pixel width so thin cables fade out).
function wireMaterial(shared, neon, uClip) {
  const defines = {}; if (neon) defines.NEON = 1; if (uClip) defines.BELOW = 1;
  return shaderMat(shared, { uClipY: uClip || { value: 0 } }, {
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: neon ? THREE.AdditiveBlending : THREE.NormalBlending, defines,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${RIPPLE_GLSL}
      uniform float uPixel, uClipY, uTime, uMirrorFar;
      attribute vec2 aW;
      varying vec3 vCol; varying float vA; varying vec2 vSp; varying float vSoft; varying float vWy;
      void main(){
        vec4 lp = vec4(position, 1.); vec3 lt = normal;
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; lt = mat3(instanceMatrix) * lt;
        #endif
        vec4 wp4 = modelMatrix * lp; vWy = wp4.y;
        #ifdef BELOW
          wp4.xyz = sRipple(wp4.xyz, uClipY, uTime);
        #endif
        vec4 mvPosition = viewMatrix * wp4;
        vec3 t = normalize((modelViewMatrix * vec4(lt, 0.)).xyz);
        vec3 sd = cross(t, normalize(mvPosition.xyz)); float sl = length(sd); sd = sl > 1e-4 ? sd / sl : vec3(1., 0., 0.);
        #ifdef BELOW
          float w = aW.x;
        #else
          float w = max(aW.x, -mvPosition.z * uPixel);
        #endif
        vA = clamp(aW.x / w, 0., 1.);
        #ifdef BELOW
          vA *= 1. - smoothstep(uMirrorFar * .7, uMirrorFar, distance(cameraPosition, wp4.xyz));
        #endif
        mvPosition.xyz += sd * uv.x * w;
        gl_Position = projectionMatrix * mvPosition;
        vCol = color; vSp = uv; vSoft = aW.y;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define FOG_KEEP .85
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uNight, uNeon, uLampDay, uClipY; uniform vec3 uAmbient;
      varying vec3 vCol; varying float vA; varying vec2 vSp; varying float vSoft; varying float vWy;
      ${GLSL_HASH}
      void main(){
        #ifdef BELOW
          if (vWy > uClipY) discard;
        #endif
        #ifdef NEON
          float nr = smoothstep(.12, .7, uNight);
          float prof = vSoft > .5 ? (exp(-vSp.x * vSp.x * 4.) - .0183) : 1. - .35 * vSp.x * vSp.x;
          float ph = fract(vSp.y);
          float fl = ph > .001 ? mix(.25, 1., step(.16, sVN(vec2(uTime * 7. + ph * 91., ph * 13.)))) * (.92 + .08 * sin(uTime * 50. + ph * 30.)) : 1.;
          gl_FragColor = vec4(vCol * prof * fl * uNeon * mix(.3 + uLampDay, 1., nr) * vA, 1.);
          #ifdef BELOW
            gl_FragColor.rgb *= .5;
          #endif
          ${FOG_ADD}
        #else
          gl_FragColor = vec4(vCol * uAmbient, vA * (1. - .3 * vSp.x * vSp.x));
          #ifdef BELOW
            gl_FragColor.a *= .3;
          #endif
          #include <fog_fragment>
        #endif
      }`,
  });
}

function beamMaterial(shared) {
  return shaderMat(shared, {}, {
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying vec3 vT;
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz); vCol = color; vT = vec3(uv.y, uv.x, -mvPosition.z);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define FOG_KEEP .5
      #include <common>
      #include <fog_pars_fragment>
      uniform float uNight, uBeam, uTime; uniform vec3 uSkyHorizon;
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying vec3 vT;
      ${GLSL_HASH}
      void main(){
        float nr = smoothstep(.12, .7, uNight);
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.6);        // brightest through the middle of the cone, nothing at its silhouette
        float dust = .5 + 1.1 * sVN(vec2(vT.x * 13. - uTime * .22, vT.y * 5. + uTime * .08)) * sVN(vec2(vT.x * 41. + uTime * .35, vT.y * 3.));   // motes drifting along the shaft
        float a = edge * pow(clamp(1. - vT.x, 0., 1.), 1.7) * (.3 + .7 * smoothstep(0., .04, vT.x)) * dust * smoothstep(3., 40., vT.z);
        gl_FragColor = vec4(vCol * a * uBeam * mix(.03, .5, nr * nr) / (1. + 2.4 * dot(uSkyHorizon, vec3(.3, .6, .1))), 1.);   // a shaft pales against a bright sky
        ${FOG_ADD}
      }`,
  });
}

function canalMaterial(shared, colors) {
  return shaderMat(shared, { uDeep: { value: new THREE.Color().setRGB(...colors.deep) }, uShallow: { value: new THREE.Color().setRGB(...colors.shallow) } }, {
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vWp;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime, uNight; uniform vec3 uDeep, uShallow, uSkyTop, uSkyHorizon, uSunDir, uSunColor, uWarm;
      varying vec3 vWp;
      ${GLSL_HASH}
      float wv(vec2 p){ return sVN(p + uTime * vec2(.21, .13)) + .5 * sVN(p * 2.3 - uTime * vec2(.17, .29)); }
      void main(){
        vec2 p = vWp.xz * .55; float e = .12;
        float h = wv(p); vec3 N = normalize(vec3(h - wv(p + vec2(e, 0.)), .55, h - wv(p + vec2(0., e))));
        vec3 V = normalize(cameraPosition - vWp); vec3 R = reflect(-V, N);
        float F = .04 + .96 * pow(1. - clamp(dot(N, V), 0., 1.), 4.);
        vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(R.y, 0., 1.), .5));
        float nr = smoothstep(.12, .7, uNight);
        // city glow streaks: lit windows smeared down the water
        float st = sVN(vec2(vWp.x * .23 + N.x * 2.5, vWp.z * .23 + N.z * 2.5)); st = smoothstep(.55, .95, st);
        vec3 col = mix(uDeep, uShallow, .35 + .3 * h) * (.35 + .65 * (1. - nr)) * (.3 + uSkyHorizon * 1.2);
        col = mix(col, sky, F) + uSunColor * pow(max(dot(R, uSunDir), 0.), 220.) * 3.;
        col += uWarm * st * nr * (.25 + F) * .9;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

function trafficMaterial(shared) {
  return shaderMat(shared, {}, {
    vertexColors: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime;
      attribute vec3 aA; attribute vec3 aD; attribute vec2 aP; attribute vec3 aC;
      varying vec3 vCol; varying float vKind; varying vec3 vN;
      void main(){
        float s = fract(aP.x + uTime * aP.y);
        float sc = smoothstep(0., .02, s) * (1. - smoothstep(.98, 1., s));
        vec3 f = normalize(aD), r = vec3(f.z, 0., -f.x);
        vec3 wp = aA + aD * s + (r * position.x + vec3(0., position.y, 0.) + f * position.z) * sc;
        vN = r * normal.x + vec3(0., normal.y, 0.) + f * normal.z;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vCol = uv.x > .5 ? color : color * aC; vKind = uv.x;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uNight, uGlow; uniform vec3 uAmbient, uSunDir, uSunColor;
      varying vec3 vCol; varying float vKind; varying vec3 vN;
      void main(){
        float nr = smoothstep(.12, .7, uNight);
        vec3 N = normalize(vN);
        vec3 col = vCol * (uAmbient * (.7 + .3 * N.y) + uSunColor * max(dot(N, uSunDir), 0.) * .7);
        if (vKind > .5) col = mix(vCol * .35, vCol * uGlow * 2.6, nr);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// Far silhouettes "at infinity": no depth written, drawn straight after the sky. uHaze is normally the shared sky-horizon uniform,
// so setSky / setNight restyle it. o: { uHaze, uTint (vec3), uSkyMix (1 = body colour derived from the sky), uHazeY (base y, falloff height, strength) }
function skylineMaterial(shared, o) {
  return shaderMat(shared, { uHaze: o.uHaze, uTint: { value: o.tint }, uSkyMix: { value: o.skyMix }, uHazeY: { value: o.hazeY } }, {
    vertexColors: true, fog: false, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 win;
      varying vec3 vCol; varying vec2 vUv2; varying vec3 vWin; varying float vH;
      void main(){ vCol = color; vUv2 = uv; vWin = win; vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uNight, uLit, uGlow, uSkyMix; uniform vec3 uHaze, uWarm, uCool, uTint, uSkyTop, uSkyHorizon, uHazeY;
      varying vec3 vCol; varying vec2 vUv2; varying vec3 vWin; varying float vH;
      ${GLSL_HASH}
      void main(){
        float nr = smoothstep(.12, .7, uNight);
        vec2 cell = floor(vUv2), f = fract(vUv2); vec2 fw = fwidth(vUv2);
        float lod = smoothstep(.25, .9, max(fw.x, fw.y));
        float m = sBox(f, vec2(.25, .25), vec2(.75, .75), clamp(fw, vec2(.01), vec2(.5)));
        float sSeed = floor(vWin.y * 1024. + .5);
        vec2 hc = cell + sSeed * vec2(3., 7.);
        float r = mix(sH1(hc), sH1(vec2(cell.y, sSeed * 5.)), .4) + .04 * sin(uTime * .13 + sH1(hc + 3.) * 60.);
        float p = uLit * .8 * nr;
        float on = mix(1. - smoothstep(p - .02, p + .02, r), p, lod) * mix(m, .25, lod);
        vec3 lc = mix(uWarm, uCool, step(.7, sH1(hc + 9.)));
        vec3 body = vCol * mix(uTint, mix(uSkyHorizon, uSkyTop, .7) * .4, uSkyMix);
        vec3 col = body + lc * on * uGlow * .6 * step(.5, vWin.x);
        // haze: more with distance (per layer), and thick near the ground so towers rise out of the mist
        float hz = clamp(vWin.z + (1. - vWin.z) * uHazeY.z * exp(-max(vH - uHazeY.x, 0.) / uHazeY.y), 0., 1.);
        gl_FragColor = vec4(mix(col, uHaze, hz), 1.);
      }`,
  });
}

// Shared material set. Every factory accepts `mats` (reuse one set per world) or builds its own.
// night: 0 day .. 1 night. update(dt,time) advances animation; setNight / setSky restyle live.
export function makeMaterials(opts = {}) {
  const night = clamp(opts.night ?? 0, 0, 1);
  const C = (c) => new THREE.Color().setRGB(...lin(c));
  const sky = opts.sky || {};
  const dayC = { top: C(SKY_DAY.top), horizon: C(SKY_DAY.horizon), sun: C(SKY_DAY.sun) }, nightC = { top: C(SKY_NIGHT.top), horizon: C(SKY_NIGHT.horizon), sun: C(SKY_NIGHT.sun) };
  const mixSky = (k) => (sky[k] != null ? C(sky[k]) : dayC[k].clone().lerp(nightC[k], smoothstep(0.1, 0.9, night)));
  const sunDir = sky.sunDir ? vec3(sky.sunDir).clone().normalize() : new THREE.Vector3(-0.45, 0.5, 0.35).normalize();
  const amb0 = C(opts.ambient ?? '#ffffff'), ambK = (t) => lerp(0.75, 0.2, t);
  const U = {
    uTime: { value: 0 }, uNight: { value: night },
    uLit: { value: opts.lit ?? 0.58 }, uGlow: { value: opts.glow ?? 2.6 }, uReflect: { value: opts.reflect ?? 1 }, uDetail: { value: opts.detail ?? 1 },
    uRelief: { value: opts.relief ?? 1 }, uCityRefl: { value: opts.cityReflect ?? 1 }, uMirrorFar: { value: 1e6 },
    uFlood: { value: opts.flood ?? 1 }, uFloodColor: { value: C(opts.floodColor ?? '#ffb878') }, uFloodDir: { value: vec3(opts.floodDir || [0.45, -0.62, 0.64]).clone().normalize() },
    uNightFill: { value: C(opts.nightFill ?? [0.05, 0.07, 0.12]) },
    uStreetGlow: { value: opts.streetGlow ?? 0.1 }, uStreetY: { value: opts.streetY ?? 0 }, uStreetFall: { value: opts.streetFall ?? 9 },
    uLampDay: { value: opts.lampDay ?? 0.1 }, uHalo: { value: opts.halo ?? 1 }, uNeon: { value: opts.neon ?? 1 }, uBeam: { value: opts.beam ?? 1 },
    uWarm: { value: C(opts.warm ?? '#ffb866') }, uCool: { value: C(opts.cool ?? '#bfe0ff') }, uGlass: { value: C(opts.glass ?? '#16222e') },
    uSkyTop: { value: mixSky('top') }, uSkyHorizon: { value: mixSky('horizon') }, uSunDir: { value: sunDir }, uSunColor: { value: mixSky('sun') },
    uAmbient: { value: amb0.clone().multiplyScalar(ambK(smoothstep(0.1, 0.9, night))) },
    uPixel: { value: opts.pixel ?? 0.0011 },
  };
  const makeFacade = (kind) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: opts.roughness ?? 0.86, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 win;\nvarying vec3 vWin; varying vec2 vWuv; varying vec3 vWPos;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vWin = win; vWuv = uv;
          vec4 sWp = vec4(transformed, 1.);
          #ifdef USE_INSTANCING
            sWp = instanceMatrix * sWp;
          #endif
          vWPos = (modelMatrix * sWp).xyz;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + FACADE_FRAG_PARS)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + FACADE_FRAG_MAIN[kind]);
    };
    m.customProgramCacheKey = () => 'kit-structures-facade-6-' + kind;
    return m;
  };
  // facade: every style in one program, for any geometry. facades: the same look as a pair [windows, other surfaces] for geometry
  // made by the kit's Builder, whose triangles are grouped by family; this is what every kit mesh is drawn with.
  const facade = makeFacade('full'), facades = [makeFacade('win'), makeFacade('surf')];
  const lazy = {};
  const get = (k, f) => lazy[k] || (lazy[k] = f());
  const clipU = { value: 0 };                                          // waterline shared by the under-water halo and neon variants
  const set = {
    night, uniforms: U, facade, facades,
    // true for facade, facades, and a copy of the facades pair (Mesh.clone() copies material arrays)
    isFacade: (m) => m === facade || m === facades || (Array.isArray(m) && m.length === 2 && m[0] === facades[0] && m[1] === facades[1]),
    get halo() { return get('halo', () => haloMaterial(U)); },
    get wire() { return get('wire', () => wireMaterial(U, false)); },
    get neon() { return get('neon', () => wireMaterial(U, true)); },
    get beam() { return get('beam', () => beamMaterial(U)); },
    get hasBeam() { return !!lazy.beam; },
    has: (k) => !!lazy[k],
    get traffic() { return get('traffic', () => trafficMaterial(U)); },
    // the under-water halves used by makeReflection(): everything above world height y is discarded
    facadeBelow: (y = 0) => { clipU.value = y; return get('below', () => mirrorMaterial(U, clipU)); },
    haloBelow: (y = 0) => { clipU.value = y; return get('haloBelow', () => haloMaterial(U, null, clipU)); },
    wireBelow: (y = 0) => { clipU.value = y; return get('wireBelow', () => wireMaterial(U, false, clipU)); },
    neonBelow: (y = 0) => { clipU.value = y; return get('neonBelow', () => wireMaterial(U, true, clipU)); },
    lantern: (uFloat) => lanternMaterial(U, uFloat),
    haloFloat: (uFloat) => haloMaterial(U, uFloat),
    canal: (colors) => { const m = canalMaterial(U, colors); m.userData.kitWater = true; return m; },
    skyline: (o) => skylineMaterial(U, o),
    update(dt, time) { U.uTime.value = time; },
    setNight(n) {
      n = clamp(n, 0, 1); set.night = n; U.uNight.value = n;
      const t = smoothstep(0.1, 0.9, n);
      if (sky.top == null) U.uSkyTop.value.copy(dayC.top).lerp(nightC.top, t);
      if (sky.horizon == null) U.uSkyHorizon.value.copy(dayC.horizon).lerp(nightC.horizon, t);
      if (sky.sun == null) U.uSunColor.value.copy(dayC.sun).lerp(nightC.sun, t);
      if (sky.ambient == null) U.uAmbient.value.copy(amb0).multiplyScalar(ambK(t));
    },
    // Match glass reflections, the skyline and unlit shaders to the world's sky: { top, horizon, sun, sunDir, ambient }
    setSky(s) {
      if (s.top != null) { sky.top = s.top; U.uSkyTop.value.setRGB(...lin(s.top)); }
      if (s.horizon != null) { sky.horizon = s.horizon; U.uSkyHorizon.value.setRGB(...lin(s.horizon)); }
      if (s.sun != null) { sky.sun = s.sun; U.uSunColor.value.setRGB(...lin(s.sun)); }
      if (s.sunDir) U.uSunDir.value.copy(vec3(s.sunDir)).normalize();
      if (s.ambient != null) { sky.ambient = s.ambient; U.uAmbient.value.setRGB(...lin(s.ambient)); }
    },
  };
  return set;
}
const matsOf = (opts) => opts.mats || makeMaterials(opts);

// The facade material on its own: procedural lit windows from UVs and the `win` attribute.
export function windowMaterial(opts = {}) {
  const mats = matsOf(opts);
  return { material: mats.facade, materials: mats.facades, uniforms: mats.uniforms, mats, update: mats.update, setNight: mats.setNight, setSky: mats.setSky };
}

// Bakes static results / Object3Ds into one mesh per material: many small props, few draw calls.
// Instanced meshes are re-parented untouched. Do not pass anything you move or animate by transform.
export function mergeObjects(objects) {
  const groups = new Map(), root = new THREE.Group(), keep = [];
  for (const o of objects) {
    if (!o) continue; const src = o.object || o; src.updateMatrixWorld(true);
    src.traverse((m) => {
      if (!m.isMesh) return;
      if (m.isInstancedMesh || !m.geometry.index || m.geometry.isInstancedBufferGeometry) { keep.push(m); return; }
      let key = m.material;                                             // cloned meshes carry a copy of a material array: match it by content
      if (Array.isArray(key) && !groups.has(key)) for (const k of groups.keys()) if (Array.isArray(k) && k.length === key.length && k.every((x, i) => x === key[i])) { key = k; break; }
      let g = groups.get(key); if (!g) groups.set(key, g = { list: [], order: m.renderOrder, cast: m.castShadow, recv: m.receiveShadow });
      const geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); g.list.push(geo);
    });
  }
  let triangles = 0;
  for (const [mat, g] of groups) {
    const geo = g.list.length > 1 ? mergeGeometries(g.list, false) : g.list[0];
    if (g.list.length > 1) for (const x of g.list) x.dispose();
    geo.computeBoundingSphere(); geo.computeBoundingBox(); triangles += geo.index.count / 3;
    if (Array.isArray(mat)) groupFamilies(geo);
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = g.order; mesh.castShadow = g.cast; mesh.receiveShadow = g.recv; root.add(mesh);
  }
  for (const m of keep) { const w = m.matrixWorld.clone(); root.add(m); w.decompose(m.position, m.quaternion, m.scale); }
  return { object: root, triangles, update() {} };
}

// Planar mirror image of kit objects for water reflections: put a translucent water surface at waterY above it.
// objects: results or Object3Ds built with `mats`. Shares geometry; adds one draw call per mirrored mesh.
// opts: { mats, waterY, range (m: the image fades out toward this distance from the camera and whole meshes beyond it are skipped;
//   call update(dt, time, camera) every frame), wires (false: thin cables are left out), maxDistance + (path | center:[x,z]) to mirror
//   only what stands near, maxHeight, filter(mesh, worldSphere) }
// The image sways and breaks up with depth (shader), glows smear into streaks. Animated transforms (boats, trains, blades) are not followed.
export function makeReflection(objects, opts = {}) {
  const mats = opts.mats, y = opts.waterY ?? 0, root = new THREE.Group();
  root.scale.y = -1; root.position.y = 2 * y;
  const maxD = opts.maxDistance ?? Infinity, path = opts.path, cen = opts.center, bs = new THREE.Sphere(), range = opts.range ?? Infinity;
  if (mats) mats.uniforms.uMirrorFar.value = range < Infinity ? range : 1e6;
  let calls = 0, triangles = 0; const drop = [], kept = [];
  for (const o of objects) {
    if (!o) continue; const src = o.object || o, cl = src.clone(true); cl.updateMatrixWorld(true);
    cl.traverse((m) => {
      if (!m.isMesh) return;
      const mat = m.material;
      let keep = !(mats && ((mats.has('beam') && mat === mats.beam) || (mats.has('wire') && mat === mats.wire && !opts.wires))) && !(mat.userData && mat.userData.kitWater);
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      bs.copy(m.isInstancedMesh && m.boundingSphere ? m.boundingSphere : m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
      if (keep && (maxD < Infinity || opts.filter || opts.maxHeight != null)) {
        if (bs.center.y - bs.radius > y + (opts.maxHeight ?? Infinity)) keep = false;
        else if (maxD < Infinity && (path || cen)) keep = (path ? path.nearestXZ(bs.center.x, bs.center.z).dist : Math.hypot(bs.center.x - cen[0], bs.center.z - cen[1])) - bs.radius < maxD;
        if (keep && opts.filter) keep = !!opts.filter(m, bs);
      }
      if (!keep) { drop.push(m); return; }
      if (mats) {
        if (mats.isFacade(mat)) m.material = mats.facadeBelow(y);
        else if (mats.has('halo') && mat === mats.halo) m.material = mats.haloBelow(y);
        else if (mats.has('neon') && mat === mats.neon) m.material = mats.neonBelow(y);
        else if (mats.has('wire') && mat === mats.wire) m.material = mats.wireBelow(y);
      }
      m.castShadow = false; m.receiveShadow = false; calls++;
      const g = m.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3;
      triangles += n * (m.isInstancedMesh ? m.count : g.isInstancedBufferGeometry ? g.instanceCount : 1);
      kept.push({ m, x: bs.center.x, z: bs.center.z, r: bs.radius });
    });
    root.add(cl);
  }
  for (const m of drop) m.parent.remove(m);
  return {
    object: root, calls, triangles,
    update(dt, time, camera) {
      if (!(range < Infinity) || !camera) return;
      const cx = camera.position.x, cz = camera.position.z;
      for (let i = 0; i < kept.length; i++) { const k = kept[i]; k.m.visible = Math.hypot(k.x - cx, k.z - cz) - k.r < range; }
    },
  };
}

const meshOf = (geo, material, o) => {
  const m = new THREE.Mesh(geo, material);
  if (o && o.shadows) { m.castShadow = true; m.receiveShadow = true; }
  return m;
};

// ---------- small shared parts ----------
// Vertical quad centred at (x,y,z), facing yaw (0 = +Z).
function panel(b, x, y, z, w, h, yaw = 0, uv) {
  const c = Math.cos(yaw), s = Math.sin(yaw), rx = c * w / 2, rz = -s * w / 2;
  b.quad([x - rx, y - h / 2, z - rz], [x + rx, y - h / 2, z + rz], [x + rx, y + h / 2, z + rz], [x - rx, y + h / 2, z - rz], uv);
}
const DECAL_UV = { 1: [0.18, 0.15, 0.82, 0.85], 2: [0.2, 0.08, 0.8, 0.91], 4: [0, 0, 1, 1], 5: [0.36, 0.14, 0.64, 0.86], 6: [0.17, 0.17, 0.83, 0.83], 7: [0.03, 0.06, 0.97, 0.92], 9: [0, 0, 1, 0.76] };
// A single window (or door) applied to a wall as a decal. Size is the visible opening including its frame.
function winDecal(b, rng, x, y, z, w, h, yaw, style = SURF.WINDOW, lit = 1, frameCol) {
  const st = b.style, sd = b.sd, sl = b.lit, se = b.seed, c = b.c, g0 = b.g0, g1 = b.g1;
  b.surf(style, rng(), lit); if (frameCol) b.col(frameCol); b.shade(1, 1);
  const off = 0.035;
  panel(b, x + Math.sin(yaw) * off, y, z + Math.cos(yaw) * off, w, h, yaw, DECAL_UV[style]);
  b.style = st; b.sd = sd; b.lit = sl; b.seed = se; b.c = c; b.g0 = g0; b.g1 = g1;
}
// Small glowing body (lamp, beacon). blink = 0 steady, else a phase in (0,1).
function glowBox(b, x, y, z, sx, sy, sz, color, power = 1, blink = 0) {
  const st = b.style, sd = b.sd, sl = b.lit, c = b.c, g0 = b.g0, g1 = b.g1;
  b.style = SURF.GLOW; b.sd = blink; b.lit = power; b.c = color; b.g0 = b.g1 = 1;
  b.box(x - sx / 2, y - sy / 2, z - sz / 2, x + sx / 2, y + sy / 2, z + sz / 2, { bottom: true });
  b.style = st; b.sd = sd; b.lit = sl; b.c = c; b.g0 = g0; b.g1 = g1;
}
// Classical column: stepped base, fluted shaft with entasis, echinus and abacus. About seg * 14 + 12 triangles.
// o: { plain (no flutes), flutes (count, default 20) }
function column(b, x, y, z, r, H, seg = 12, o) {
  const st = b.style, capH = Math.min(H * 0.07, r * 1.3) + 0.12, by = Math.min(H * 0.045, r) + 0.1;
  b.style = SURF.PLAIN;
  b.lathe(x, y, z, [[r * 1.34, 0], [r * 1.34, by * 0.45], [r * 1.12, by * 0.6], [r * 1.02, by]], seg);
  b.style = o && o.plain ? SURF.PLAIN : SURF.FLUTED;
  b.lathe(x, y, z, [[r, by], [r * 0.985, H * 0.4], [r * 0.84, H - capH]], seg, { smooth: true, uvBand: [(o && o.flutes) || 20, 0, 1] });
  b.style = SURF.PLAIN;
  b.lathe(x, y, z, [[r * 0.84, H - capH], [r * 0.9, H - capH * 0.8], [r * 1.24, H - capH * 0.32]], seg);
  b.cbox(x, y + H - capH * 0.32, z, r * 2.7, capH * 0.32, r * 2.7, { bottom: true });
  b.style = st;
}
// Vertical fins or piers standing proud of the four faces of a box footprint, one every `every` window cells. 6 triangles each.
function finsInto(b, x0, z0, x1, z1, y0, y1, cellW, every = 3, depth = 0.4, width = 0.25) {
  const face = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / cellW)), ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz * depth, nz = ux * depth, hw = width / 2;
    for (let i = every; i < n; i += every) {
      const px = ax + (bx - ax) * i / n, pz = az + (bz - az) * i / n;
      const p0x = px - ux * hw, p0z = pz - uz * hw, p1x = px + ux * hw, p1z = pz + uz * hw;
      b.wall(p0x + nx, p0z + nz, p1x + nx, p1z + nz, y0, y1); b.wall(p0x, p0z, p0x + nx, p0z + nz, y0, y1); b.wall(p1x + nx, p1z + nz, p1x, p1z, y0, y1);
    }
  };
  face(x0, z1, x1, z1); face(x1, z1, x1, z0); face(x1, z0, x0, z0); face(x0, z0, x0, z1);
}
// Balconies on the +Z and -Z faces of a box of window cells: a slab and a solid parapet in front of one bay in `step`, on every
// floor above the first. 18 triangles each.
function balconiesInto(b, x0, z0, x1, z1, y0, y1, cellW, cellH, slabC, railC, first = 0, step = 2) {
  const cols = Math.max(1, Math.round((x1 - x0) / cellW)), rows = Math.max(1, Math.round((y1 - y0) / cellH)), cw = (x1 - x0) / cols, ch = (y1 - y0) / rows, out = 1.05;
  for (let c = first; c < cols; c += step) for (let r = 1; r < rows; r++) for (const s of [1, -1]) {
    const xa = x0 + (c + 0.08) * cw, xb = xa + cw * 0.84, y = y0 + r * ch + ch * 0.13, zw = s > 0 ? z1 : z0, zo = zw + s * out;
    b.col(slabC, 0.8, 1); b.box(xa, y - 0.14, Math.min(zw, zo), xb, y, Math.max(zw, zo), { bottom: true });
    b.col(railC, 0.85, 1);
    if (s > 0) { b.wall(xa, zo, xb, zo, y, y + 0.95); b.wall(xb, zo, xb, zw, y, y + 0.95); b.wall(xa, zw, xa, zo, y, y + 0.95); }
    else { b.wall(xb, zo, xa, zo, y, y + 0.95); b.wall(xb, zw, xb, zo, y, y + 0.95); b.wall(xa, zo, xa, zw, y, y + 0.95); }
  }
}
// A carved panel in a raised frame on a wall facing +Z (s = 1) or -Z (s = -1). 50 triangles.
function reliefPanel(b, x, y, z, w, h, s, frameC, fieldC, cols, rows) {
  const st = b.style, c = b.c, g0 = b.g0, g1 = b.g1, t = Math.min(w, h) * 0.1, zo = z + s * 0.2, za = Math.min(z, zo), zb = Math.max(z, zo);
  b.col(frameC, 1, 1); b.style = SURF.PLAIN;
  b.box(x - w / 2 - t, y + h / 2, za, x + w / 2 + t, y + h / 2 + t, zb, { bottom: true }); b.box(x - w / 2 - t, y - h / 2 - t, za, x + w / 2 + t, y - h / 2, zb, { bottom: true });
  b.box(x - w / 2 - t, y - h / 2, za, x - w / 2, y + h / 2, zb, {}); b.box(x + w / 2, y - h / 2, za, x + w / 2 + t, y + h / 2, zb, {});
  b.col(fieldC, 0.9, 1); b.style = SURF.RELIEF;
  panel(b, x, y, z + s * 0.03, w, h, s > 0 ? 0 : Math.PI, [0, 0, cols, rows]);
  b.style = st; b.c = c; b.g0 = g0; b.g1 = g1;
}
// Hanging box lantern: a tapered paper body in a dark frame under a little roof. (x, y, z) is the centre of the body. 62 triangles.
function boxLantern(b, x, y, z, s, lampC, frameC, power = 1.6) {
  const st = b.style, sd = b.sd, sl = b.lit, c = b.c, g0 = b.g0, g1 = b.g1, w0 = s * 0.6, w1 = s * 0.92, h = s * 1.45;
  b.style = SURF.GLOW; b.sd = 0; b.lit = power; b.c = lampC; b.g0 = 0.8; b.g1 = 1.1;
  b.frustum(x, z, w0, w0, w1, w1, y - h / 2, y + h / 2, { top: false });
  b.style = SURF.PLAIN; b.c = frameC; b.g0 = b.g1 = 1;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam([x + sx * w0 / 2, y - h / 2, z + sz * w0 / 2], [x + sx * w1 / 2, y + h / 2, z + sz * w1 / 2], s * 0.07, s * 0.07);
  b.cbox(x, y - h / 2 - s * 0.08, z, w0 * 1.15, s * 0.08, w0 * 1.15, { bottom: true });
  b.frustum(x, z, w1 * 1.45, w1 * 1.45, w1 * 0.25, w1 * 0.25, y + h / 2, y + h / 2 + s * 0.42, {});
  b.style = st; b.sd = sd; b.lit = sl; b.c = c; b.g0 = g0; b.g1 = g1;
}
// Thin double-sided strip from a to c lying in the plane with normal n: lattice members that are only ever seen from a distance. 4 triangles.
function flatBar(b, a, c, w, n) {
  const dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2];
  let sx = n[1] * dz - n[2] * dy, sy = n[2] * dx - n[0] * dz, sz = n[0] * dy - n[1] * dx; const k = w / 2 / (Math.hypot(sx, sy, sz) || 1); sx *= k; sy *= k; sz *= k;
  const A = [a[0] - sx, a[1] - sy, a[2] - sz], B = [a[0] + sx, a[1] + sy, a[2] + sz], C = [c[0] + sx, c[1] + sy, c[2] + sz], D = [c[0] - sx, c[1] - sy, c[2] - sz];
  b.quad(A, B, C, D); b.quad(B, A, D, C);
}
// Ring of small posts with a top rail (balcony / gallery railing).
function railRing(b, cx, y, cz, r, h, n, thick = 0.07) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = TAU * i / n; pts.push([cx + r * Math.cos(a), y + h, cz + r * Math.sin(a)]); if (i < n) b.beam([pts[i][0], y, pts[i][2]], pts[i], thick, thick); }
  for (let i = 0; i < n; i++) b.beam(pts[i], pts[i + 1], thick, thick);
}
// Straight railing between two points: posts every `step` with one or two rails.
function railing(b, a, c, h = 1, step = 1.6, thick = 0.07, rails = 2) {
  const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) { const t = i / n, p = [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)]; b.beam(p, [p[0], p[1] + h, p[2]], thick, thick); }
  for (let r = 0; r < rails; r++) { const yy = h * (1 - r * 0.45); b.beam([a[0], a[1] + yy, a[2]], [c[0], c[1] + yy, c[2]], thick, thick); }
}
// Rectangular loop of railing.
function railBox(b, x0, z0, x1, z1, y, h = 1, step = 1.6, skipFront) {
  if (!skipFront) railing(b, [x0, y, z1], [x1, y, z1], h, step);
  railing(b, [x1, y, z1], [x1, y, z0], h, step); railing(b, [x1, y, z0], [x0, y, z0], h, step); railing(b, [x0, y, z0], [x0, y, z1], h, step);
}
function finial(b, x, y, z, s, color) {
  b.col(color).surf(SURF.PLAIN);
  b.lathe(x, y, z, [[s * 0.5, 0], [s * 0.18, s * 0.5], [s * 0.42, s * 1.1], [s * 0.14, s * 1.7], [s * 0.3, s * 2.2], [s * 0.08, s * 2.7], [0, s * 4.2]], 6);
}

// ---------- building styles ----------
const BPAL = {
  modern: { wall: ['#8e99a6', '#6f7f8f', '#a7a39b', '#59636f', '#b9c0c6'], roof: '#3b3f45', accent: ['#66d9ff', '#ff5fa2', '#ffd27a', '#9d8cff'], trim: '#c9ced3' },
  deco: { wall: ['#b9a68a', '#a89a8c', '#8f7a66', '#c2b29a', '#7d8088'], roof: '#4a4038', accent: ['#ffc46b', '#ffe2a8', '#8fe3ff'], trim: '#d8c9a8', metal: '#b08d4a' },
  townhouse: { wall: ['#c9785c', '#d8b25f', '#a7b98f', '#8fa7c2', '#d9c7a3', '#b86a6a', '#e3d5b8', '#9c8f84'], roof: ['#8a3f2c', '#5a3a30', '#3f4650', '#6e3528'], trim: '#efe6d2', wood: '#4a3526', accent: '#ffc27a', awning: ['#a8382e', '#2f5a8a', '#3a7257', '#c99a3a', '#7a4a6a'], iron: '#1e2124' },
  mediterranean: { wall: ['#f1ece0', '#efe2c8', '#f4efe8', '#e9d3b0'], roof: ['#b8553a', '#a84c33', '#c26a45'], trim: ['#2f6ea8', '#3a8a8f', '#7a4a2a'], dome: '#2b62b0', accent: '#ffcf8a', wood: '#5a3d28' },
  pagoda: { wall: ['#a83224', '#8f2a20', '#e8dfcc', '#4a3023'], roof: ['#27333a', '#2b3d3a', '#3a2f2a', '#20303f'], trim: '#d8b45a', stone: '#8d8a82', accent: '#ffb35a', wood: '#3a251b' },
  adobe: { wall: ['#c08a5a', '#b9774a', '#d2a070', '#a9683f'], roof: '#a87850', trim: '#3f8f9a', wood: '#4a3020', accent: '#ffb060' },
  stilt: { wall: ['#7a5a3c', '#8a6a48', '#5f4630', '#9a7a52'], roof: ['#b89a5a', '#a08348', '#6a5a40'], trim: '#3a2a1c', wood: '#5a4230', accent: '#ffb866' },
  lighthouse: { wall: '#ece8de', roof: '#5a1f1c', accent: ['#c23a2e', '#1f3f6a', '#222428'], trim: '#2a2c30', stone: '#8a857c', lamp: '#fff0b8' },
  windmill: { wall: ['#e9e2d2', '#8a5a40', '#a89c8a', '#3f5a48'], roof: ['#3a2f2a', '#5a3a2a', '#2f3a40'], trim: '#efe8d8', wood: '#4a3526', sail: '#e8dcc0', stone: '#8a857c', accent: '#ffc27a' },
  temple: { wall: ['#e6ddc8', '#d8cdb8', '#efe8da'], roof: ['#b56a48', '#d6ccb6', '#8a4a38'], trim: '#f4eee0', accent: '#e0b040', stone: '#b8b0a0', fire: '#ff9a3a' },
  castle: { wall: ['#8f8a80', '#a39a88', '#7a7872', '#9a8a78'], roof: ['#2f4a6a', '#5a2a26', '#3a3f48', '#2f5a4a'], trim: '#b8b0a0', wood: '#3f2c1e', accent: '#ffb055', flag: ['#c22f2f', '#e0b83a', '#2f5fb8'] },
  dome: { wall: ['#e8dcc4', '#d9cbb2', '#f0ece4', '#c9a887'], dome: ['#3fa39a', '#d8a83a', '#2f6fb0', '#e9e4d8', '#7aa890'], roof: '#6a5a4a', trim: '#f4eee0', accent: '#ffd27a', gold: '#d8a83a' },
  minaret: { wall: ['#e6dcc6', '#d2c0a0', '#f0ebe0', '#c7a57a'], roof: ['#2f6a7a', '#3a7a5a', '#4a5a8a', '#b8943a'], trim: '#f4eee0', accent: '#ffd98a', gold: '#d8a83a', stone: '#b0a690' },
  mega: { wall: ['#4a5560', '#5a6470', '#3a4450', '#66707a'], roof: '#22262c', accent: ['#59e0ff', '#ff4fa0', '#ffb347', '#8f7bff', '#5fffc0'], trim: '#aab4be' },
};
function pickPal(style, rng, over) {
  const src = BPAL[style], out = {};
  for (const k in src) { const v = src[k]; out[k] = lin(Array.isArray(v) ? rng.pick(v) : v); }
  if (over) for (const k in over) if (over[k] != null) { const v = over[k]; out[k] = lin(Array.isArray(v) && typeof v[0] !== 'number' ? rng.pick(v) : v); }
  return out;
}

function bModern(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(22, 34), d = o.depth ?? rng.range(22, 34), h = o.height ?? rng.range(70, 160);
  const seed = rng();
  const style = o.windows ?? (rng.chance(0.62) ? SURF.CURTAIN : SURF.RIBBON);
  const cellW = style === SURF.CURTAIN ? rng.range(1.7, 2.6) : rng.range(2.8, 3.8), cellH = rng.range(3.5, 4.1);
  const wallC = vary(P.wall, rng, 0.14, 0.03), roofC = P.roof, lit = o.lit ?? 1;
  // relief (detail >= 0.6): fins, piers, sun-shade slabs or a corner frame, a coping on every setback, a canopy round the podium
  const rich = detail >= 0.6, trimC = mix3(wallC, P.trim, 0.55), kindR = rng(), every = rng.int(2, 3), balc = style === SURF.WINDOW || (style === SURF.RIBBON && kindR > 0.75);
  const relief = !rich ? 'none' : style === SURF.CURTAIN ? (kindR < 0.5 ? 'fins' : kindR < 0.75 ? 'slabs' : 'frame') : balc ? 'frame' : (kindR < 0.45 ? 'piers' : 'slabs');
  let y = 0, tw = w, td = d, ox = 0, oz = 0;
  if (h > 28 && detail > 0.25) {
    const ph = Math.min(h * 0.22, rng.range(5.5, 9));
    b.col(mul3(wallC, 0.85), 0.7, 1).surf(SURF.SHOP, seed, 1.7);
    b.box(-w / 2, 0, -d / 2, w / 2, ph, d / 2, { cellW: rng.range(4, 6), cellH: ph, capColor: roofC });
    if (detail >= 0.5) {
      b.col(trimC, 0.9, 1).surf(SURF.PLAIN);
      b.box(-w / 2 - 1.4, ph * 0.745, -d / 2 - 1.4, w / 2 + 1.4, ph * 0.745 + 0.26, d / 2 + 1.4, { bottom: true });
      b.box(-w / 2 - 0.2, ph - 0.1, -d / 2 - 0.2, w / 2 + 0.2, ph + 0.55, d / 2 + 0.2, { capColor: roofC });
    }
    y = ph; tw = w * rng.range(0.8, 0.94); td = d * rng.range(0.8, 0.94);
  }
  const tiers = h > 55 && detail > 0.2 ? rng.int(1, 3) : 1;
  for (let t = 0; t < tiers; t++) {
    const top = t === tiers - 1 ? h : lerp(y, h, rng.range(0.5, 0.75)), last = t === tiers - 1;
    b.col(wallC, t === 0 && y === 0 ? 0.72 : 0.9, 1).surf(style, (seed + t * 0.37) % 1, lit);
    const X0 = ox - tw / 2, X1 = ox + tw / 2, Z0 = oz - td / 2, Z1 = oz + td / 2;
    b.box(X0, y, Z0, X1, top, Z1, { cellW, cellH, capColor: roofC });
    if (rich) {
      b.surf(SURF.PLAIN);
      if (t === 0 && balc && top - y < 46) { const cols = Math.round(tw / cellW); balconiesInto(b, X0, Z0, X1, Z1, y, top, cellW, cellH, trimC, mix3(wallC, [0.02, 0.03, 0.04], 0.55), cols > 4 ? 1 : 0, Math.max(2, Math.ceil(cols / 3))); }
      if (relief === 'fins') { b.col(trimC, 0.75, 1); finsInto(b, X0, Z0, X1, Z1, y, top + 0.6, cellW, every, 0.45, 0.2); }
      else if (relief === 'piers') { b.col(mul3(wallC, 1.1), 0.75, 1); finsInto(b, X0, Z0, X1, Z1, y, top + 0.3, cellW, Math.min(3, every), 0.32, cellW * 0.26); }
      else if (relief === 'slabs') {
        const k = Math.max(2, Math.ceil((top - y) / cellH / 7)) * cellH; b.col(trimC, 0.9, 1);
        for (let yy = y + k; yy < top - cellH; yy += k) b.box(X0 - 0.5, yy - 0.13, Z0 - 0.5, X1 + 0.5, yy + 0.13, Z1 + 0.5, { bottom: true });
      }
      if (relief === 'frame' || relief === 'piers') { const pw = Math.max(0.9, tw * 0.05); b.col(mul3(wallC, 1.1), 0.75, 1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(ox + sx * (tw / 2 - pw * 0.25), y, oz + sz * (td / 2 - pw * 0.25), pw, top - y + 0.3, pw, { top: false }); }
      b.col(trimC, 0.9, 1); b.box(X0 - 0.28, top - 0.3, Z0 - 0.28, X1 + 0.28, top + (last ? 0.85 : 0.3), Z1 + 0.28, { bottom: true, capColor: roofC });
    }
    y = top;
    if (t < tiers - 1) {
      const nw = tw * rng.range(0.62, 0.88), nd = td * rng.range(0.62, 0.88);
      ox += rng.range(-1, 1) * (tw - nw) / 2; oz += rng.range(-1, 1) * (td - nd) / 2; tw = nw; td = nd;
    }
  }
  const roofY = h + (rich ? 0.85 : 0);
  b.surf(SURF.PLAIN);
  if (rich) {
    // street door under a lit canopy on both fronts
    const gh = h > 28 && detail > 0.25 ? Math.min(h * 0.22, 9) * 0.745 : Math.min(4.2, cellH), ew = Math.min(7, w * 0.26);
    for (const sz of [-1, 1]) {
      const z = sz * d / 2, zo = z + sz * 2.3;
      b.col(trimC, 0.9, 1).surf(SURF.PLAIN); b.box(-ew / 2 - 0.5, gh, Math.min(z, zo), ew / 2 + 0.5, gh + 0.32, Math.max(z, zo), { bottom: true });
      for (const sx of [-1, 1]) b.cbox(sx * (ew / 2 + 0.2), 0, zo - sz * 0.3, 0.3, gh, 0.3, { top: false });
      glowBox(b, 0, gh - 0.06, z + sz * 1.2, ew * 0.8, 0.08, 1.4, P.trim, 1.1);
      if (!(h > 28 && detail > 0.25)) winDecal(b, rng, 0, gh * 0.47, z, ew * 0.6, gh * 0.9, sz > 0 ? 0 : Math.PI, SURF.CURTAIN, 1.6 * lit, P.roof);
    }
    // roofscape: stair bulkhead, a tank on legs, a scatter of plant
    const rx = (k) => ox + rng.range(-k, k) * tw, rz = (k) => oz + rng.range(-k, k) * td;
    b.col(mul3(wallC, 0.9), 0.85, 1).surf(SURF.PLAIN); { const x = rx(0.28), z = rz(0.28); b.cbox(x, roofY - 0.85, z, 3.2, 3.5, 4.4, { capColor: roofC }); winDecal(b, rng, x, roofY + 0.35, z + 2.2, 1.1, 2.1, 0, SURF.CURTAIN, 0.4, P.roof); }
    if (h < 70 && rng.chance(0.55)) {
      const x = rx(0.3), z = rz(0.3), tr = Math.min(1.5, Math.min(tw, td) * 0.09);
      b.col(mul3(roofC, 1.3), 1, 1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam([x + sx * tr * 0.6, roofY - 0.85, z + sz * tr * 0.6], [x + sx * tr * 0.6, roofY + 1.2, z + sz * tr * 0.6], 0.12, 0.12);
      b.col([0.3, 0.2, 0.13], 0.75, 1).surf(SURF.PLANKS); b.lathe(x, roofY + 1.2, z, [[tr, 0], [tr, tr * 1.7]], 8, { m: 1 });
      b.col(mul3(roofC, 0.9), 1, 1.2).surf(SURF.PLAIN); b.lathe(x, roofY + 1.2 + tr * 1.7, z, [[tr * 1.12, 0], [0, tr * 0.7]], 8);
    }
    b.col(mul3(P.trim, 0.75), 0.8, 1).surf(SURF.PLAIN);
    for (let i = rng.int(2, 5); i > 0; i--) b.cbox(rx(0.36), roofY - 0.85, rz(0.36), rng.range(0.9, 1.8), rng.range(1.4, 2), rng.range(0.9, 1.8), {});
  }
  if (detail > 0.35 && h > 40 && rng.chance(0.6)) {                  // lit crown band
    const st = b.style; b.col(P.accent).surf(SURF.GLOW, 0, 1.1);
    b.box(ox - tw / 2 - 0.32, h - 1.5, oz - td / 2 - 0.32, ox + tw / 2 + 0.32, h - 0.7, oz + td / 2 + 0.32, { top: false });
    b.surf(st);
  }
  if (detail > 0.15) {                                                // roof plant
    b.col(mul3(roofC, 1.5), 0.8, 1);
    const n = detail > 0.5 ? rng.int(1, 3) : 1;
    for (let i = 0; i < n; i++) { const sx = tw * rng.range(0.18, 0.4), sz = td * rng.range(0.18, 0.4); b.cbox(ox + rng.range(-0.25, 0.25) * tw, roofY, oz + rng.range(-0.25, 0.25) * td, sx, rng.range(1.5, 4), sz); }
  }
  if (h > 80 && detail > 0.3 && rng.chance(0.7)) {                    // mast with a blinking beacon
    const mh = h * rng.range(0.1, 0.22), ax = ox + rng.range(-0.2, 0.2) * tw, az = oz + rng.range(-0.2, 0.2) * td;
    b.col(P.trim, 0.8, 1); b.frustum(ax, az, 0.9, 0.9, 0.2, 0.2, roofY, h + mh);
    glowBox(b, ax, h + mh + 0.3, az, 0.8, 0.8, 0.8, [1, 0.12, 0.08], 3, rng.range(0.05, 0.95));
  }
  return { w, d, h };
}

function bDeco(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(24, 36), d = o.depth ?? rng.range(24, 36), h = o.height ?? rng.range(90, 190);
  const seed = rng(), wallC = vary(P.wall, rng, 0.1, 0.02), lit = o.lit ?? 1;
  const n = h > 110 ? rng.int(4, 5) : h > 50 ? 3 : 2, hb = h * (h > 50 ? 0.8 : 0.92);
  const cellW = rng.range(1.9, 2.5), cellH = rng.range(3.5, 4), rich = detail >= 0.6;
  let y = 0, tw = w, td = d;
  const fr = [0.5, 0.72, 0.86, 0.94, 1];
  for (let t = 0; t < n; t++) {
    const top = hb * (n === 2 ? [0.7, 1][t] : n === 3 ? [0.6, 0.84, 1][t] : fr[t + (5 - n)]);
    const isTop = t === n - 1 && n > 2;
    b.col(wallC, t === 0 ? 0.7 : 0.9, 1).surf(isTop ? SURF.ARCHED : SURF.WINDOW, (seed + t * 0.29) % 1, isTop ? 2.2 * lit : lit);
    b.box(-tw / 2, y, -td / 2, tw / 2, top, td / 2, { cellW: isTop ? cellW * 1.4 : cellW, cellH: isTop ? Math.max(4, top - y) : cellH, capColor: P.roof });
    if (detail > 0.35) {                                              // corner piers rising into pinnacles
      b.col(mul3(P.trim, 0.92), 0.75, 1).surf(SURF.PLAIN);
      const pw = Math.max(1.2, tw * 0.09), ph = (top - y) + Math.min(4, (top - y) * 0.12);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * (tw / 2 - pw * 0.3), y, sz * (td / 2 - pw * 0.3), pw, ph, pw);
    }
    if (rich && !isTop) {                                             // piers between the window bays, a moulded ledge at every setback
      b.col(mix3(wallC, P.trim, 0.45), 0.72, 1).surf(SURF.PLAIN);
      finsInto(b, -tw / 2, -td / 2, tw / 2, td / 2, y, top + Math.min(2.2, (top - y) * 0.08), cellW, t === 0 ? 3 : 2, 0.38, cellW * 0.3);
      b.col(P.trim, 0.9, 1); b.box(-tw / 2 - 0.45, top - 0.5, -td / 2 - 0.45, tw / 2 + 0.45, top + 0.2, td / 2 + 0.45, { bottom: true, capColor: P.roof });
    }
    if (detail > 0.6 && t === 0 && h > 40) {                          // central bay piers on the base
      b.col(mul3(P.trim, 0.85), 0.75, 1).surf(SURF.PLAIN);
      for (const sx of [-1, 1]) { b.cbox(sx * tw * 0.17, y, td / 2 + 0.2, tw * 0.045, top - y + 2, 0.7); b.cbox(sx * tw * 0.17, y, -td / 2 - 0.2, tw * 0.045, top - y + 2, 0.7); }
    }
    if (rich && t === 0) {                                            // street level: a lit entrance portal on the two main fronts, a base course
      b.col(mul3(wallC, 0.6), 0.9, 1).surf(SURF.MASONRY, 0, 1.5); b.box(-tw / 2 - 0.3, 0, -td / 2 - 0.3, tw / 2 + 0.3, 1.1, td / 2 + 0.3, { m: 1, top: true, capStyle: SURF.MASONRY, capM: 1 });
      for (const sz of [-1, 1]) {
        const ew = Math.min(6, tw * 0.2), eh = Math.min(9, (top - y) * 0.5), z = sz * (td / 2 + 0.42);
        b.col(P.trim, 0.85, 1).surf(SURF.PLAIN); b.box(-ew / 2 - 0.9, 0, Math.min(z, sz * td / 2), ew / 2 + 0.9, eh + 1.1, Math.max(z, sz * td / 2), {});
        winDecal(b, rng, 0, eh / 2 + 0.1, z, ew, eh, sz > 0 ? 0 : Math.PI, SURF.ARCHED, 2.2 * lit, P.metal);
      }
    }
    y = top; tw *= rng.range(0.7, 0.8); td *= rng.range(0.7, 0.8);
  }
  if (n > 2) {                                                        // stepped crown and spire
    const cw = tw / 0.75, cd = td / 0.75, ch = (h - hb);
    b.col(P.metal, 0.8, 1.1).surf(SURF.PLAIN);
    b.frustum(0, 0, cw * 0.9, cd * 0.9, cw * 0.32, cd * 0.32, hb, hb + ch * 0.42);
    if (detail > 0.3) { b.col(P.accent).surf(SURF.GLOW, 0, 0.9); b.box(-cw * 0.46, hb + 0.2, -cd * 0.46, cw * 0.46, hb + 0.8, cd * 0.46, { top: false }); }
    b.col(P.metal, 1, 1.2).surf(SURF.PLAIN);
    b.frustum(0, 0, cw * 0.22, cd * 0.22, 0, 0, hb + ch * 0.42, h);
    if (detail > 0.3) glowBox(b, 0, h + 0.4, 0, 0.9, 0.9, 0.9, P.accent, 3, 0);
  }
  return { w, d, h };
}

function bTownhouse(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(6.5, 10), d = o.depth ?? rng.range(9, 13);
  const floors = o.floors ?? rng.int(2, 5), fh = rng.range(2.9, 3.4);
  const hw = o.height ? o.height * 0.74 : floors * fh, rise = o.height ? o.height * 0.26 : Math.min(w, d) * rng.range(0.34, 0.6);
  const wallC = vary(P.wall, rng, 0.08, 0.03), seed = rng(), lit = o.lit ?? 1;
  const gf = Math.min(hw * 0.4, fh * 1.08), shop = o.shop ?? rng.chance(0.45), terrace = o.terrace ?? false;
  const cellW = w / Math.max(2, Math.round(w / rng.range(2.1, 2.8)));
  // stone base course
  b.col(mul3(wallC, 0.62), 0.8, 1).surf(SURF.MASONRY, 0, 1);
  b.box(-w / 2 - 0.06, -0.01, -d / 2 - 0.06, w / 2 + 0.06, 0.7, d / 2 + 0.06, { m: 1 });
  // ground floor (front may be a shop)
  b.col(mul3(wallC, shop ? 0.8 : 1), 0.8, 0.96).surf(shop ? SURF.SHOP : SURF.WINDOW, seed, shop ? 1.8 : lit);
  b.wall(-w / 2, d / 2, w / 2, d / 2, 0, gf, { cellW: shop ? w / Math.max(1, Math.round(w / 4)) : cellW, cellH: gf });
  b.col(wallC, 0.8, 0.96).surf(SURF.WINDOW, (seed + 0.5) % 1, lit);
  b.wall(w / 2, -d / 2, -w / 2, -d / 2, 0, gf, { cellW, cellH: gf });
  b.surf(terrace ? SURF.PLAIN : SURF.WINDOW, (seed + 0.2) % 1, lit * 0.8);
  b.wall(w / 2, d / 2, w / 2, -d / 2, 0, gf, { cellW: cellW * 1.3, cellH: gf }); b.wall(-w / 2, -d / 2, -w / 2, d / 2, 0, gf, { cellW: cellW * 1.3, cellH: gf });
  // upper floors
  const uf = Math.max(1, Math.round((hw - gf) / fh));
  b.col(wallC, 0.96, 1).surf(SURF.WINDOW, (seed + 0.1) % 1, lit);
  b.wall(-w / 2, d / 2, w / 2, d / 2, gf, hw, { cellW, rows: uf }); b.wall(w / 2, -d / 2, -w / 2, -d / 2, gf, hw, { cellW, rows: uf });
  b.surf(terrace ? SURF.PLAIN : SURF.WINDOW, (seed + 0.7) % 1, lit * 0.8);
  b.wall(w / 2, d / 2, w / 2, -d / 2, gf, hw, { cellW: cellW * 1.3, rows: uf }); b.wall(-w / 2, -d / 2, -w / 2, d / 2, gf, hw, { cellW: cellW * 1.3, rows: uf });
  // string course and cornice
  b.col(P.trim, 0.85, 1).surf(SURF.PLAIN);
  if (detail > 0.3) b.box(-w / 2 - 0.1, gf - 0.12, -d / 2 - 0.1, w / 2 + 0.1, gf + 0.12, d / 2 + 0.1, { bottom: true });
  b.box(-w / 2 - 0.16, hw - 0.22, -d / 2 - 0.16, w / 2 + 0.16, hw, d / 2 + 0.16, { bottom: true });
  // door
  if (detail > 0.3 && !shop) winDecal(b, rng, rng.range(-0.25, 0.25) * w, 1.2, d / 2, 1.3, 2.4, 0, SURF.CURTAIN, 0.5, P.wood);
  // roof
  const alongX = o.gableFront != null ? !o.gableFront : rng.chance(0.6);
  b.col(vary(P.roof, rng, 0.1), 1, 1);
  b.gable(-w / 2, -d / 2, w / 2, d / 2, hw, rise, { alongX, overhang: terrace ? 0.25 : 0.4, wallColor: wallC, wallStyle: SURF.PLAIN });
  if (!alongX && detail > 0.4) winDecal(b, rng, 0, hw + rise * 0.3, d / 2, 1.1, 1.3, 0, SURF.WINDOW, lit, P.trim);
  // chimney
  if (detail > 0.2) {
    const cx = rng.range(-0.3, 0.3) * w, cz = rng.range(-0.3, 0.3) * d;
    b.col(mul3(wallC, 0.7), 0.8, 1).surf(SURF.MASONRY, 0, 0.6); b.cbox(cx, hw + rise * 0.2, cz, 0.8, rise * 0.9 + 0.6, 0.8, { m: 1 });
  }
  // dormer on the street slope
  if (alongX && detail > 0.5 && rng.chance(0.7)) {
    const dx = rng.range(-0.2, 0.2) * w, dz = d * 0.27, dy = hw + rise * 0.28;
    b.col(wallC, 1, 1).surf(SURF.PLAIN); b.box(dx - 0.8, dy, dz - 1.2, dx + 0.8, dy + 1.3, dz + 0.9, { top: false });
    b.col(vary(P.roof, rng, 0.1)); b.gable(dx - 0.8, dz - 1.2, dx + 0.8, dz + 0.9, dy + 1.3, 0.6, { alongX: false, overhang: 0.15, wallColor: wallC });
    winDecal(b, rng, dx, dy + 0.65, dz + 0.9, 1.1, 1.1, 0, SURF.WINDOW, lit, P.trim);
  }
  if (detail > 0.5) glowBox(b, w * 0.32, 2.5, d / 2 + 0.25, 0.22, 0.34, 0.22, P.accent, 1.6);
  if (detail >= 0.6) {                                                // street furniture of the facade: awning or door hood, a balcony, shutters
    const zf = d / 2, ay = gf * 0.8;
    if (shop) {                                                       // striped canvas awning over the shop front
      const out = 1.25, drop = 0.6, n = Math.max(3, Math.round(w / 0.55)), x0 = -w / 2 + 0.15, x1 = w / 2 - 0.15;
      b.col(vary(P.awning, rng, 0.08), 0.92, 1).surf(SURF.STRIPES, 0, 1);
      b.quad([x0, ay - drop, zf + out], [x1, ay - drop, zf + out], [x1, ay, zf + 0.03], [x0, ay, zf + 0.03], [0, 0, n, 1]);
      b.quad([x0, ay - drop - 0.28, zf + out], [x1, ay - drop - 0.28, zf + out], [x1, ay - drop, zf + out], [x0, ay - drop, zf + out], [0, 0, n, 1]);
      b.shade(0.5, 0.62); b.quad([x1, ay - drop - 0.02, zf + out], [x0, ay - drop - 0.02, zf + out], [x0, ay - 0.02, zf + 0.03], [x1, ay - 0.02, zf + 0.03], [0, 0, n, 1]);
      b.col(P.iron, 1, 1).surf(SURF.PLAIN); for (const x of [x0, x1]) b.beam([x, ay - drop - 0.1, zf + out - 0.02], [x, ay - drop - 0.75, zf + 0.03], 0.04, 0.04);
    }
    if (uf >= 2 && rng.chance(0.6)) {                                 // iron balcony on the first floor
      const bw = w * rng.range(0.5, 0.86), by = gf + 0.16, bo = 0.85;
      b.col(mul3(P.trim, 0.9), 0.8, 1).surf(SURF.PLAIN); b.box(-bw / 2, by - 0.14, zf, bw / 2, by, zf + bo, { bottom: true });
      for (const sx of [-1, 1]) b.beam([sx * bw * 0.4, by - 0.14, zf + bo * 0.8], [sx * bw * 0.4, by - 0.7, zf + 0.02], 0.07, 0.07);
      b.col(P.iron, 1, 1); railing(b, [-bw / 2 + 0.04, by, zf + bo - 0.05], [bw / 2 - 0.04, by, zf + bo - 0.05], 0.95, 0.42, 0.035, 2);
      for (const sx of [-1, 1]) railing(b, [sx * (bw / 2 - 0.04), by, zf + 0.05], [sx * (bw / 2 - 0.04), by, zf + bo - 0.05], 0.95, 0.42, 0.035, 2);
    } else if (uf >= 1) {                                             // or flower boxes under the first-floor windows
      const n = Math.max(1, Math.round(w / cellW));
      for (let i = 0; i < n; i++) if (rng.chance(0.7)) {
        const x = -w / 2 + (i + 0.5) * w / n, y = gf + (hw - gf) / uf * 0.13;
        b.col(P.wood, 0.9, 1).surf(SURF.PLAIN); b.box(x - cellW * 0.3, y - 0.22, zf, x + cellW * 0.3, y, zf + 0.26, { bottom: true });
        b.col(vary(rng.pick([[0.5, 0.06, 0.07], [0.62, 0.3, 0.05], [0.5, 0.12, 0.3], [0.1, 0.24, 0.07]]), rng, 0.2), 0.8, 1.15); b.box(x - cellW * 0.28, y, zf + 0.03, x + cellW * 0.28, y + 0.2, zf + 0.25, {});
      }
    }
    if (!shop) { b.col(P.trim, 0.85, 1).surf(SURF.PLAIN); b.box(-w * 0.26, 2.52, zf, w * 0.26, 2.66, zf + 0.55, { bottom: true }); }
  }
  return { w, d, h: hw + rise };
}

function bMediterranean(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(8, 13), d = o.depth ?? rng.range(7, 11);
  const floors = o.floors ?? rng.int(1, 2), fh = 3.1, hw = o.height ? o.height * 0.82 : floors * fh + 0.4;
  const cube = o.cube ?? rng.chance(0.4), wallC = vary(P.wall, rng, 0.04, 0.01), seed = rng(), lit = o.lit ?? 1;
  const roofC = vary(P.roof, rng, 0.08);
  b.col(wallC, 0.84, 1).surf(SURF.ARCHED, seed, lit);
  b.box(-w / 2, -0.01, -d / 2, w / 2, hw, d / 2, { cellW: rng.range(2.6, 3.4), cellH: fh, top: cube, capColor: mul3(wallC, 0.9) });
  let top = hw;
  if (cube) {                                                         // flat roof with a parapet, sometimes a dome
    b.surf(SURF.PLAIN).col(wallC, 0.95, 1);
    const t = 0.25, ph = 0.6;
    b.box(-w / 2, hw, d / 2 - t, w / 2, hw + ph, d / 2); b.box(-w / 2, hw, -d / 2, w / 2, hw + ph, -d / 2 + t);
    b.box(-w / 2, hw, -d / 2 + t, -w / 2 + t, hw + ph, d / 2 - t); b.box(w / 2 - t, hw, -d / 2 + t, w / 2, hw + ph, d / 2 - t);
    top = hw + ph;
    if (o.dome ?? rng.chance(0.4)) {
      const r = Math.min(w, d) * 0.3, cx = rng.range(-0.1, 0.1) * w;
      b.col(wallC, 0.9, 1); b.lathe(cx, hw, 0, [[r * 1.08, 0], [r * 1.08, 0.7], [r, 0.7]], 12);
      const prof = []; for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 * i / 6; prof.push([r * Math.cos(a), 0.7 + r * Math.sin(a)]); } prof[6][0] = 0;
      b.col(P.dome, 0.85, 1.15); b.lathe(cx, hw, 0, prof, 12, { smooth: true });
      top = hw + 0.7 + r;
    }
  } else {
    b.col(roofC, 1, 1); b.hip(-w / 2, -d / 2, w / 2, d / 2, hw, Math.min(w, d) * rng.range(0.16, 0.24), { overhang: 0.55, ridge: 0.45 });
    top = hw + Math.min(w, d) * 0.2;
  }
  // lower wing with a terrace
  if (detail > 0.3) {
    const sx = rng.sign(), ww = w * rng.range(0.45, 0.65), wd = d * rng.range(0.55, 0.8), wh = Math.min(hw - 0.6, fh + 0.2);
    const x0 = sx > 0 ? w / 2 : -w / 2 - ww, z0 = d / 2 - wd + rng.range(0, 1.2);
    b.col(wallC, 0.84, 1).surf(SURF.ARCHED, (seed + 0.4) % 1, lit);
    b.box(x0, -0.01, z0, x0 + ww, wh, z0 + wd, { cellW: 3, cellH: wh, capColor: mul3(roofC, 0.9) });
    b.surf(SURF.PLAIN);
    if (detail > 0.5) {                                               // pergola
      b.col(P.wood, 0.9, 1);
      for (const px of [x0 + 0.3, x0 + ww - 0.3]) for (const pz of [z0 + 0.3, z0 + wd - 0.3]) b.beam([px, wh, pz], [px, wh + 2.3, pz], 0.16, 0.16);
      for (let i = 0; i < 5; i++) { const px = lerp(x0 + 0.1, x0 + ww - 0.1, i / 4); b.beam([px, wh + 2.35, z0], [px, wh + 2.35, z0 + wd], 0.1, 0.14); }
    }
  }
  // door and shutters in the accent colour
  if (detail > 0.25) {
    winDecal(b, rng, rng.range(-0.2, 0.2) * w, 1.15, d / 2, 1.25, 2.3, 0, SURF.ARCHED, 0.7, P.trim);
    glowBox(b, w * 0.3, 2.5, d / 2 + 0.2, 0.2, 0.3, 0.2, P.accent, 1.5);
  }
  return { w, d, h: top };
}

function bPagoda(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(9, 13), h = o.height ?? rng.range(26, 44);
  const tiers = o.tiers ?? clamp(Math.round(h / 7.5), 2, 9), lit = o.lit ?? 1;
  const wallC = P.wall, roofC = P.roof, seed = rng();
  const baseH = Math.min(1.6, h * 0.05), spire = h * 0.14, bodyH = h - baseH - spire;
  // stone plinth with steps
  b.col(P.stone, 0.8, 1).surf(SURF.MASONRY, 0, 1.2);
  b.box(-w * 0.75, -0.01, -w * 0.75, w * 0.75, baseH, w * 0.75, { m: 1 });
  b.surf(SURF.PLAIN); b.cbox(0, 0, w * 0.75 + 0.6, w * 0.4, baseH * 0.5, 1.2);
  let y = baseH, tw = w;
  // tier heights shrink upward
  let sum = 0; const hs = []; for (let i = 0; i < tiers; i++) { const k = 1 - 0.07 * i; hs.push(k); sum += k; }
  for (let i = 0; i < tiers; i++) {
    const th = bodyH * hs[i] / sum, wallH = th * 0.56, rise = th * 0.44;
    b.col(wallC, 0.8, 1).surf(SURF.SHOJI, (seed + i * 0.23) % 1, 1.5 * lit);
    b.box(-tw / 2, y, -tw / 2, tw / 2, y + wallH, tw / 2, { cellW: tw / 3, cellH: wallH, top: false });
    b.surf(SURF.PLAIN);
    if (detail > 0.3) {                                               // corner posts and a balcony rail
      b.col(P.wood, 0.9, 1);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * tw / 2, y, sz * tw / 2, 0.32, wallH, 0.32, { top: false });
      if (i > 0 && detail > 0.55) { const r = tw / 2 + 0.55; b.col(wallC, 0.9, 1); b.box(-r, y - 0.02, -r, r, y + 0.1, r, { bottom: true }); railBox(b, -r, -r, r, r, y + 0.1, 0.7, r); }
    }
    const ov = 1.1 + tw * 0.16;
    b.col(roofC, 1, 1); b.sweepRoof(0, 0, tw, tw, y + wallH, rise, { overhang: ov, lift: 0.5 + tw * 0.07, top: i === tiers - 1 ? 0.04 : 0.62, nu: detail > 0.4 ? 6 : 4, nv: detail > 0.4 ? 4 : 3, edgeColor: P.trim, underColor: mul3(wallC, 0.55) });
    if (detail > 0.45) {                                              // lanterns hanging at the eave corners
      const e = tw / 2 + ov - 0.25, ly = y + wallH + (0.5 + tw * 0.07) * 0.8 - 0.75;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) glowBox(b, sx * e, ly, sz * e, 0.34, 0.46, 0.34, P.accent, 1.5);
    }
    y += th; tw *= o.taper ?? 0.86;
  }
  // finial: stacked rings
  const fy = y - bodyH * hs[tiers - 1] / sum * 0.06;
  b.col(P.trim, 0.9, 1.2).surf(SURF.PLAIN);
  const prof = [[0.42, 0]]; const rings = 6;
  for (let i = 0; i < rings; i++) { const t0 = (i + 0.3) / rings, t1 = (i + 0.75) / rings, r = 0.5 * (1 - i / rings * 0.6); prof.push([0.12, spire * t0 * 0.8], [r, spire * (t0 + t1) / 2 * 0.8], [0.12, spire * t1 * 0.8]); }
  prof.push([0.1, spire * 0.84], [0.22, spire * 0.9], [0, spire]);
  b.lathe(0, fy, 0, prof, 6);
  return { w: w * 1.5, d: w * 1.5, h };
}

function bAdobe(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(9, 14), d = o.depth ?? rng.range(8, 12), levels = o.levels ?? rng.int(1, 3), fh = 3, lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.06, 0.02);
  let x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, y = 0, top = 0;
  for (let lv = 0; lv < levels; lv++) {
    const cw = x1 - x0, cd = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    top = y + fh + (lv === 0 ? 0.4 : 0);
    b.col(wallC, 0.8, 1).surf(SURF.PLAIN);
    b.frustum(cx, cz, cw, cd, cw * 0.95, cd * 0.95, y - 0.01, top + 0.5, { capColor: mul3(wallC, 0.78) });
    // vigas: roof beams poking through the front and back walls
    if (detail > 0.3) {
      b.col(P.wood, 0.9, 1);
      const n = Math.max(2, Math.round(cw / 1.3));
      for (let i = 0; i < n; i++) { const x = lerp(x0 + 0.6, x1 - 0.6, n > 1 ? i / (n - 1) : 0.5); b.beam([x, top - 0.2, z1 - 0.4], [x, top - 0.2, z1 + 0.5], 0.17, 0.17); b.beam([x, top - 0.2, z0 + 0.4], [x, top - 0.2, z0 - 0.5], 0.17, 0.17); }
    }
    // small deep-set windows and a door
    const nwin = Math.max(1, Math.round(cw / 4));
    for (let i = 0; i < nwin; i++) {
      const x = lerp(x0, x1, (i + 0.5) / nwin) + (lv === 0 && nwin === 1 ? cw * 0.25 : 0);
      winDecal(b, rng, x, y + 1.75, z1 - cd * 0.012 - 0.01, 0.85, 0.95, 0, SURF.CURTAIN, lit * 1.1, P.trim);
      if (detail > 0.4) winDecal(b, rng, x1 - cw * 0.012 - 0.01, y + 1.75, lerp(z0, z1, (i + 0.5) / nwin), 0.8, 0.9, Math.PI / 2, SURF.CURTAIN, lit, P.trim);
    }
    if (lv === 0) winDecal(b, rng, x0 + cw * 0.3, 1.05, z1 - 0.01, 1.1, 2.1, 0, SURF.CURTAIN, 0.5, P.wood);
    if (lv < levels - 1) {
      // ladder up to the next terrace
      if (detail > 0.4) {
        const lx = x0 + cw * rng.range(0.6, 0.8); b.col(P.wood, 1, 1);
        for (const s of [-0.28, 0.28]) b.beam([lx + s, y, z1 + 1.1], [lx + s, top + 1.3, z1 + 0.05], 0.08, 0.08);
        for (let i = 1; i < 8; i++) { const t = i / 8; b.beam([lx - 0.28, lerp(y, top + 1.3, t), lerp(z1 + 1.1, z1 + 0.05, t)], [lx + 0.28, lerp(y, top + 1.3, t), lerp(z1 + 1.1, z1 + 0.05, t)], 0.06, 0.06); }
      }
      if (rng.chance(0.5)) x0 += cw * rng.range(0.25, 0.42); else x1 -= cw * rng.range(0.25, 0.42);
      z1 -= cd * rng.range(0.28, 0.42); y = top;
    }
  }
  if (detail > 0.5) {                                                 // beehive oven
    const hx = w / 2 + 1.6, hz = d / 2 - 1; b.col(mul3(wallC, 0.9), 0.75, 1).surf(SURF.PLAIN);
    b.lathe(hx, -0.01, hz, [[1, 0], [0.95, 0.5], [0.7, 0.95], [0.35, 1.2], [0, 1.28]], 8, { smooth: true });
    glowBox(b, hx, 0.4, hz + 0.93, 0.4, 0.4, 0.1, P.accent, 1.2);
  }
  return { w, d, h: top + 0.5 };
}

function bStilt(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(6, 9), d = o.depth ?? rng.range(5, 7), ph = o.stilts ?? rng.range(2.2, 4), hw = 2.7, deep = o.pileDepth ?? 3, lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.08, 0.02), porch = 1.8;
  const dx0 = -w / 2 - 0.5, dx1 = w / 2 + 0.5, dz0 = -d / 2 - 0.5, dz1 = d / 2 + porch;
  // piles
  b.col(P.trim, 0.55, 1).surf(SURF.PLAIN);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = lerp(dx0 + 0.3, dx1 - 0.3, i / 2), z = lerp(dz0 + 0.3, dz1 - 0.3, j / 2); b.beam([x, -deep, z], [x, ph + (j === 2 || i !== 1 ? 0 : 0), z], 0.26, 0.26); }
  if (detail > 0.3) { b.beam([dx0 + 0.3, 0.3, dz0 + 0.3], [dx1 - 0.3, ph - 0.4, dz0 + 0.3], 0.12, 0.12); b.beam([dx0 + 0.3, ph - 0.4, dz1 - 0.3], [dx1 - 0.3, 0.3, dz1 - 0.3], 0.12, 0.12); }
  // deck
  b.col(P.wood, 0.85, 1).surf(SURF.PLANKS);
  b.box(dx0, ph - 0.22, dz0, dx1, ph, dz1, { bottom: true, m: 1, capM: 1 });
  // hut
  b.col(wallC, 0.82, 1).surf(SURF.PLANKS);
  b.box(-w / 2, ph, -d / 2, w / 2, ph + hw, d / 2, { m: 1, top: false });
  winDecal(b, rng, -w * 0.05, ph + 1.05, d / 2, 1.05, 2.05, 0, SURF.CURTAIN, 1.6 * lit, P.trim);
  winDecal(b, rng, w * 0.3, ph + 1.5, d / 2, 0.9, 0.9, 0, SURF.CURTAIN, 1.3 * lit, P.trim);
  winDecal(b, rng, w / 2, ph + 1.5, 0, 1, 0.9, Math.PI / 2, SURF.CURTAIN, 1.2 * lit, P.trim);
  winDecal(b, rng, -w / 2, ph + 1.5, 0, 1, 0.9, -Math.PI / 2, SURF.CURTAIN, 1.2 * lit, P.trim);
  // thatch roof with a deep overhang
  const alongX = o.gableFront != null ? !o.gableFront : rng.chance(0.65);
  b.col(vary(P.roof, rng, 0.08), 1, 1);
  const rise = (alongX ? d : w) * rng.range(0.42, 0.58);
  b.gable(-w / 2, -d / 2, w / 2, d / 2 + (alongX ? porch * 0.7 : 0), ph + hw, rise, { alongX, overhang: 0.85, wallColor: wallC, wallStyle: SURF.PLANKS, thick: 0.28 });
  if (detail > 0.3) {
    b.col(P.trim, 1, 1).surf(SURF.PLAIN);
    railing(b, [dx0 + 0.1, ph, dz1 - 0.1], [-1.1, ph, dz1 - 0.1], 0.95, 1.2, 0.07); railing(b, [1.1, ph, dz1 - 0.1], [dx1 - 0.1, ph, dz1 - 0.1], 0.95, 1.2, 0.07);
    railing(b, [dx1 - 0.1, ph, dz1 - 0.1], [dx1 - 0.1, ph, d / 2], 0.95, 1.2, 0.07); railing(b, [dx0 + 0.1, ph, d / 2], [dx0 + 0.1, ph, dz1 - 0.1], 0.95, 1.2, 0.07);
    // steps
    b.col(P.wood, 0.9, 1);
    const run = ph * 0.9, n = Math.max(3, Math.round(ph / 0.32));
    for (const s of [-0.8, 0.8]) b.beam([s, 0, dz1 + run], [s, ph - 0.1, dz1], 0.1, 0.22);
    for (let i = 1; i <= n; i++) { const t = i / (n + 1); b.cbox(0, lerp(0, ph - 0.1, t) - 0.03, lerp(dz1 + run, dz1, t), 1.6, 0.07, 0.34, { bottom: true }); }
  }
  glowBox(b, -w * 0.05 - 0.95, ph + 2.05, d / 2 + 0.3, 0.26, 0.36, 0.26, P.accent, 1.8);
  return { w: w + 1, d: d + 1 + porch, h: ph + hw + rise };
}

function bLighthouse(b, o) {
  const { rng, P, detail } = o;
  const h = o.height ?? rng.range(28, 44), r0 = (o.width ?? rng.range(7, 9.5)) / 2, r1 = r0 * 0.56, lit = o.lit ?? 1;
  const baseH = 1.8, gy = h * 0.76, lh = h * 0.11, stripes = o.stripes ?? rng.int(2, 4);
  b.col(P.stone, 0.75, 1).surf(SURF.MASONRY, 0, 1.3);
  b.lathe(0, -0.01, 0, [[r0 * 1.38, 0], [r0 * 1.32, baseH], [r0 * 0.9, baseH]], 10, { facet: true, m: 1 });
  b.col(P.accent, 0.82, 1).surf(SURF.STRIPES, 0, 2);
  b.lathe(0, baseH, 0, [[r0, 0], [lerp(r0, r1, 0.5), (gy - baseH) * 0.5], [r1, gy - baseH]], 14, { smooth: true, uvBand: [1, 0.25, stripes + 0.25] });
  b.surf(SURF.PLAIN);
  for (let i = 0; i < 3; i++) { const t = 0.2 + i * 0.26, r = lerp(r0, r1, t); winDecal(b, rng, 0, baseH + (gy - baseH) * t, r + 0.02, 0.8, 1.3, 0, SURF.CURTAIN, 1.2 * lit, P.trim); }
  winDecal(b, rng, 0, baseH + 1.1, r0 + 0.03, 1.1, 2.1, 0, SURF.CURTAIN, 0.6, P.roof);
  // gallery
  b.col(P.trim, 0.9, 1.1);
  b.lathe(0, gy, 0, [[r1, -0.9], [r1 + 1.15, 0], [r1 + 1.15, 0.22], [r1 * 0.7, 0.22]], 12);
  if (detail > 0.3) railRing(b, 0, gy + 0.22, 0, r1 + 1.05, 1.05, 12, 0.06);
  // lantern room
  const lr = r1 * 0.76, ly = gy + 0.22;
  b.col(P.wall, 0.9, 1); b.lathe(0, ly, 0, [[lr * 1.06, 0], [lr * 1.06, 0.7], [lr, 0.7]], 10);
  b.col(P.lamp).surf(SURF.GLOW, 0, 2.4 * lit); b.lathe(0, ly, 0, [[lr, 0.7], [lr, lh]], 10);
  b.col(P.trim).surf(SURF.PLAIN);
  if (detail > 0.3) for (let i = 0; i < 8; i++) { const a = TAU * i / 8; b.beam([lr * 1.02 * Math.cos(a), ly + 0.7, lr * 1.02 * Math.sin(a)], [lr * 1.02 * Math.cos(a), ly + lh, lr * 1.02 * Math.sin(a)], 0.09, 0.09); }
  b.col(P.roof, 0.85, 1.1); b.lathe(0, ly + lh, 0, [[lr * 1.3, -0.1], [lr * 1.3, 0.1], [lr * 0.55, lh * 0.5], [0, lh * 0.8]], 10);
  b.col(P.trim); b.sphere(0, ly + lh * 1.8 + 0.3, 0, 0.32, 6, 4); b.beam([0, ly + lh * 1.8 - 0.2, 0], [0, ly + lh * 1.8 + 1.6, 0], 0.07, 0.07);
  o.extras.push({ type: 'beam', pos: [0, ly + (0.7 + lh) / 2, 0], length: o.beamLength ?? 170, radius: o.beamRadius ?? 6.5, color: P.lamp, speed: o.beamSpeed ?? 0.45, phase: rng() * TAU });
  // keeper's cottage
  if (detail > 0.5 && (o.cottage ?? true)) {
    const cw = r0 * 2.2, cd = r0 * 1.5, x0 = r0 * 0.8, ch = 3;
    b.col(P.wall, 0.82, 1).surf(SURF.WINDOW, rng(), lit); b.box(x0, -0.01, -cd / 2, x0 + cw, ch, cd / 2, { cellW: 2.4, cellH: ch, top: false });
    b.col(P.roof, 1, 1); b.gable(x0, -cd / 2, x0 + cw, cd / 2, ch, cd * 0.36, { alongX: true, overhang: 0.35, wallColor: P.wall });
  }
  return { w: r0 * 2.8, d: r0 * 2.8, h: h + 1 };
}

function bWindmill(b, o) {
  const { rng, P, detail } = o;
  const h = o.height ?? rng.range(14, 20), r0 = (o.width ?? rng.range(6.5, 8.5)) / 2, r1 = r0 * 0.6, bodyH = h * 0.8, lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.06, 0.02), st = Math.PI / 8;
  b.col(P.stone, 0.75, 1).surf(SURF.MASONRY, 0, 1.1);
  b.lathe(0, -0.01, 0, [[r0 * 1.1, 0], [lerp(r0, r1, 0.2) * 1.06, bodyH * 0.2]], 8, { facet: true, m: 1, start: st });
  b.col(wallC, 0.85, 1).surf(o.planks ? SURF.PLANKS : SURF.PLAIN);
  b.lathe(0, 0, 0, [[lerp(r0, r1, 0.2), bodyH * 0.2], [r1, bodyH]], 8, { facet: true, start: st, m: 1 });
  b.surf(SURF.PLAIN);
  const fz = (t) => lerp(r0, r1, t) * Math.cos(Math.PI / 8) + 0.02;
  winDecal(b, rng, 0, 1.15, fz(0.07) + 0.3, 1.2, 2.2, 0, SURF.ARCHED, 0.7, P.wood);
  winDecal(b, rng, 0, bodyH * 0.45, fz(0.45), 0.9, 1.2, 0, SURF.CURTAIN, 1.3 * lit, P.trim);
  winDecal(b, rng, 0, bodyH * 0.7, fz(0.7), 0.8, 1, 0, SURF.CURTAIN, 1.3 * lit, P.trim);
  if (detail > 0.4) {                                                 // stage (gallery) round the waist
    const gy = bodyH * 0.3, gr = lerp(r0, r1, 0.3) + 1.5;
    b.col(P.wood, 0.9, 1); b.lathe(0, gy, 0, [[gr - 1.7, -0.5], [gr, 0], [gr, 0.14], [gr - 1.7, 0.14]], 8, { facet: true, start: st });
    railRing(b, 0, gy + 0.14, 0, gr - 0.1, 0.95, 16, 0.06);
  }
  // cap
  b.col(P.roof, 0.85, 1.1).surf(SURF.PLAIN);
  const ch = h - bodyH;
  b.lathe(0, bodyH, 0, [[r1 * 1.18, -0.15], [r1 * 1.18, 0.12], [r1 * 1.0, ch * 0.45], [r1 * 0.55, ch * 0.85], [0, ch]], 10, { smooth: true });
  const hubY = bodyH + ch * 0.32, hubZ = r1 * 1.18 + 1.0;
  b.col(P.wood); b.beam([0, hubY, 0], [0, hubY, hubZ + 0.3], 0.42, 0.42);
  o.extras.push({ type: 'blades', pos: [0, hubY, hubZ], radius: o.bladeRadius ?? h * 0.62, speed: o.bladeSpeed ?? rng.range(0.35, 0.6), phase: rng() * TAU, wood: P.wood, sail: P.sail });
  return { w: r0 * 2.3, d: r0 * 2.3, h };
}

// Windmill sails in the XY plane, facing +Z, turning about Z. About 150 triangles.
function bladesGeometry(R, wood, sail) {
  const b = new Builder(512);
  for (let k = 0; k < 4; k++) {
    b.push(_m4.makeRotationZ(k * Math.PI / 2));
    b.col(wood, 1, 1).surf(SURF.PLAIN);
    b.beam([0, 0, 0], [R, 0, 0], 0.2, 0.2);
    const x0 = R * 0.2, x1 = R * 0.98, y1 = -R * 0.19;
    b.beam([x0, y1, 0.06], [x1, y1, 0.06], 0.07, 0.07);
    const n = 6; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); b.beam([x, 0, 0.06], [x, y1, 0.06], 0.06, 0.06); }
    b.beam([x0, y1 * 0.5, 0.06], [x1, y1 * 0.5, 0.06], 0.05, 0.05);
    b.col(sail, 0.92, 1);
    b.quad([x0 + 0.05, y1 + 0.05, 0.03], [x1 - 0.05, y1 + 0.05, 0.03], [x1 - 0.05, -0.12, 0.03], [x0 + 0.05, -0.12, 0.03]);
    b.quad([x1 - 0.05, y1 + 0.05, 0.02], [x0 + 0.05, y1 + 0.05, 0.02], [x0 + 0.05, -0.12, 0.02], [x1 - 0.05, -0.12, 0.02]);
    b.pop();
  }
  b.col(wood); b.sphere(0, 0, 0.15, 0.42, 6, 4);
  return b.toGeometry();
}

function bTemple(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(16, 22), d = o.depth ?? w * rng.range(1.6, 2.0), colH = o.height ? o.height * 0.6 : rng.range(8.5, 11), lit = o.lit ?? 1;
  const wallC = P.wall, nF = o.columns ?? (w > 19 ? 8 : 6), colR = colH * 0.056, steps = 3, sh = 0.42;
  b.col(P.stone, 0.85, 1).surf(SURF.MASONRY, 0, 1.6);
  for (let i = 0; i < steps; i++) { const e = (steps - i) * 0.6; b.box(-w / 2 - e, i * sh - (i ? 0 : 0.01), -d / 2 - e, w / 2 + e, (i + 1) * sh, d / 2 + e, { m: 1, capM: 1, capStyle: SURF.MASONRY }); }
  const y0 = steps * sh, sp = (w - colR * 3) / (nF - 1), nS = Math.max(3, Math.round((d - colR * 3) / sp) + 1), spz = (d - colR * 3) / (nS - 1);
  b.col(wallC, 0.86, 1).surf(SURF.PLAIN);
  const seg = detail > 0.5 ? 12 : 6;
  for (let i = 0; i < nF; i++) { const x = -w / 2 + colR * 1.5 + i * sp; column(b, x, y0, d / 2 - colR * 1.5, colR, colH, seg); column(b, x, y0, -d / 2 + colR * 1.5, colR, colH, seg); }
  for (let j = 1; j < nS - 1; j++) { const z = -d / 2 + colR * 1.5 + j * spz; column(b, -w / 2 + colR * 1.5, y0, z, colR, colH, seg); column(b, w / 2 - colR * 1.5, y0, z, colR, colH, seg); }
  // cella
  const cw = w - sp * 2 - colR * 2, cd = d - spz * 2.6;
  b.col(mul3(wallC, 0.86), 0.7, 1).surf(SURF.MASONRY, 0, 1.5); b.box(-cw / 2, y0, -cd / 2, cw / 2, y0 + colH, cd / 2, { m: 1, top: false });
  glowBox(b, 0, y0 + colH * 0.36, cd / 2 + 0.02, Math.min(3, cw * 0.3), colH * 0.72, 0.08, P.fire, 0.75 * lit);
  // entablature: architrave, carved frieze behind a gilded fillet, dentils and a projecting cornice
  const eh = colH * 0.2, ey = y0 + colH, fh = eh * 0.38;
  b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.box(-w / 2 + 0.1, ey, -d / 2 + 0.1, w / 2 - 0.1, ey + eh * 0.36, d / 2 - 0.1, { bottom: true });
  b.col(P.accent, 0.9, 1); b.box(-w / 2 + 0.03, ey + eh * 0.36, -d / 2 + 0.03, w / 2 - 0.03, ey + eh * 0.44, d / 2 - 0.03, { bottom: true });
  b.col(mul3(P.trim, 0.9), 0.95, 1).surf(SURF.RELIEF, 0, 1); b.box(-w / 2 + 0.16, ey + eh * 0.44, -d / 2 + 0.16, w / 2 - 0.16, ey + eh * 0.44 + fh, d / 2 - 0.16, { cellW: fh, cellH: fh, top: false });
  b.col(P.trim, 0.95, 1).surf(SURF.PLAIN);
  if (detail > 0.5) {                                                 // dentil course
    const dy = ey + eh * 0.44 + fh, ds = 0.62;
    for (let x = -w / 2 + 0.3; x < w / 2 - 0.3; x += ds) { b.box(x, dy - 0.02, d / 2 - 0.16, x + ds * 0.5, dy + eh * 0.12, d / 2 + 0.12, { top: false, bottom: true }); b.box(x, dy - 0.02, -d / 2 - 0.12, x + ds * 0.5, dy + eh * 0.12, -d / 2 + 0.16, { top: false, bottom: true }); }
  }
  b.box(-w / 2 - 0.3, ey + eh * 0.94, -d / 2 - 0.3, w / 2 + 0.3, ey + eh + 0.3, d / 2 + 0.3, { bottom: true });
  b.box(-w / 2 - 0.05, ey + eh * 0.82, -d / 2 - 0.05, w / 2 + 0.05, ey + eh * 0.94, d / 2 + 0.05, { top: false, bottom: true });
  const rise = w * 0.15;
  b.col(P.roof, 1, 1); b.gable(-w / 2 - 0.3, -d / 2 - 0.3, w / 2 + 0.3, d / 2 + 0.3, ey + eh + 0.3, rise, { alongX: false, overhang: 0.25, wallColor: P.trim, m: 0.6 });
  if (detail > 0.3) {                                                 // acroteria and braziers
    finial(b, 0, ey + eh + 0.3 + rise, d / 2 + 0.3, 0.38, P.accent); finial(b, 0, ey + eh + 0.3 + rise, -d / 2 - 0.3, 0.38, P.accent);
    for (const sx of [-1, 1]) {
      const bx = sx * (w * 0.5 + 0.2), bz = d / 2 + 2.6;
      b.col(P.stone, 0.8, 1).surf(SURF.PLAIN); b.lathe(bx, 0, bz, [[0.5, 0], [0.22, 0.3], [0.22, 1.3], [0.75, 1.75], [0.6, 1.75]], 6);
      glowBox(b, bx, 2.0, bz, 0.7, 0.5, 0.7, P.fire, 2.2 * lit);
    }
  }
  return { w: w + 3.6, d: d + 3.6, h: ey + eh + 0.3 + rise };
}

function bCastle(b, o) {
  const { rng, P, detail } = o;
  const r = (o.width ?? rng.range(9, 13)) / 2, h = o.height ?? rng.range(22, 34), square = o.square ?? rng.chance(0.3), lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.06, 0.02), R = r * 1.14, seg = detail > 0.5 ? 14 : 10;
  b.col(wallC, 0.72, 1).surf(SURF.MASONRY, 0, 1.25);
  const nm = square ? 0 : Math.max(8, Math.round(TAU * R / 2.3));
  if (square) {
    b.frustum(0, 0, r * 2.4, r * 2.4, r * 2, r * 2, -0.01, h * 0.14, { m: 1, top: false });
    b.box(-r, h * 0.14, -r, r, h * 0.82, r, { m: 1, top: false });
    b.frustum(0, 0, r * 2, r * 2, R * 2, R * 2, h * 0.82, h * 0.87, { m: 1, top: false });
    b.box(-R, h * 0.87, -R, R, h, R, { m: 1, capColor: mul3(wallC, 0.6), capStyle: SURF.PLAIN });
    const n = Math.max(3, Math.round(R * 2 / 2.4)), mw = R * 2 / (n * 2 - 1);
    for (let i = 0; i < n; i++) { const x = -R + mw * (i * 2 + 0.5); for (const s of [-1, 1]) { b.cbox(x, h, s * (R - 0.25), mw, 1.15, 0.5, { m: 1 }); b.cbox(s * (R - 0.25), h, x, 0.5, 1.15, mw, { m: 1 }); } }
  } else {
    b.lathe(0, -0.01, 0, [[r * 1.24, 0], [r * 1.02, h * 0.14], [r, h * 0.8], [R, h * 0.86], [R, h]], seg, { m: 1 });
    b.col(mul3(wallC, 0.6)).surf(SURF.PLAIN); b.disc(0, h - 0.02, 0, R, seg);
    b.col(wallC, 0.95, 1).surf(SURF.MASONRY, 0, 1.25);
    for (let i = 0; i < nm; i++) { if (i % 2) continue; const a = TAU * (i + 0.5) / nm; b.tr((R - 0.26) * Math.cos(a), h, (R - 0.26) * Math.sin(a), Math.PI / 2 - a); b.cbox(0, 0, 0, TAU * R / nm, 1.15, 0.5, { m: 1 }); b.pop(); }
  }
  b.surf(SURF.PLAIN);
  // arrow slits and a gate
  const rings = Math.max(1, Math.round(h / 9));
  for (let k = 0; k < rings; k++) {
    const y = h * (0.3 + 0.48 * (k + 0.5) / rings), n = square ? 4 : 5;
    for (let i = 0; i < n; i++) {
      const a = TAU * (i + (k % 2) * 0.5) / n + (square ? 0 : 0.4);
      if (square) winDecal(b, rng, Math.round(Math.cos(a)) * r, y, Math.round(Math.sin(a)) * r, 0.7, 2, Math.PI / 2 - a, SURF.SLIT, 1.4 * lit, mul3(wallC, 0.8));
      else winDecal(b, rng, (r * 1.01) * Math.cos(a), y, (r * 1.01) * Math.sin(a), 0.7, 2, Math.PI / 2 - a, SURF.SLIT, 1.4 * lit, mul3(wallC, 0.8));
    }
  }
  winDecal(b, rng, 0, 1.6, (square ? r * 1.17 : r * 1.2), 2.2, 3.2, 0, SURF.ARCHED, 0.9, P.wood);
  if (detail > 0.4) for (const sx of [-1, 1]) glowBox(b, sx * 1.7, 3.1, (square ? r * 1.15 : r * 1.17) + 0.25, 0.22, 0.4, 0.22, P.accent, 2);
  let top = h + 1.15;
  if (o.roof ?? rng.chance(0.65)) {                                    // conical or pyramid roof with a pennant
    const rr = (square ? R : R) * 0.86, rh = rr * rng.range(1.5, 2.1);
    b.col(vary(P.roof, rng, 0.06), 0.8, 1.1).surf(SURF.TILES);
    if (square) b.hip(-rr, -rr, rr, rr, h + 0.4, rh, { overhang: 0, ridge: 0 });
    else b.lathe(0, h + 0.4, 0, [[rr, 0], [rr * 0.5, rh * 0.52], [0, rh]], seg, { m: 1, smooth: false });
    b.col(P.trim).surf(SURF.PLAIN); b.beam([0, h + 0.4 + rh - 0.3, 0], [0, h + 0.4 + rh + 2.6, 0], 0.08, 0.08);
    const fy = h + 0.4 + rh + 2.5; b.col(P.flag);
    b.tri([0, fy, 0], [0, fy - 0.9, 0], [1.9, fy - 0.45, 0.25]); b.tri([0, fy - 0.9, 0], [0, fy, 0], [1.9, fy - 0.45, 0.25]);
    top = fy;
  }
  return { w: r * 2.5, d: r * 2.5, h: top };
}

function domeProfile(R, H, shape, n = 9) {
  const prof = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; let r;
    if (shape === 'onion') r = R * (1 + 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.9))) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.2)), 0.85) * (t > 0.72 ? lerp(1, 0.45, (t - 0.72) / 0.28) : 1);
    else if (shape === 'pointed') r = R * Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.72);
    else r = R * Math.sqrt(Math.max(0, 1 - t * t));
    prof.push([i === n ? 0 : r, H * t]);
  }
  return prof;
}

function bDome(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(22, 32), shape = o.shape ?? rng.pick(['hemisphere', 'onion', 'pointed']), lit = o.lit ?? 1;
  const h = o.height ?? w * (shape === 'hemisphere' ? 1.05 : 1.3);
  const wallC = vary(P.wall, rng, 0.05, 0.015), hb = h * 0.34, dr = w * 0.35, drumH = h * 0.15, seg = detail > 0.5 ? 16 : 12;
  b.col(P.trim, 0.8, 1).surf(SURF.MASONRY, 0, 1.5); b.box(-w / 2 - 0.9, -0.01, -w / 2 - 0.9, w / 2 + 0.9, 0.7, w / 2 + 0.9, { m: 1, capM: 1 });
  b.col(wallC, 0.8, 1).surf(SURF.ARCHED, rng(), lit);
  b.box(-w / 2, 0.7, -w / 2, w / 2, hb, w / 2, { cellW: w / Math.round(w / 3.8), cellH: hb, capColor: P.roof });
  b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.box(-w / 2 - 0.3, hb - 0.5, -w / 2 - 0.3, w / 2 + 0.3, hb, w / 2 + 0.3, { bottom: true });
  winDecal(b, rng, 0, 0.7 + hb * 0.36, w / 2 + 0.02, w * 0.16, hb * 0.72, 0, SURF.ARCHED, 1.2, P.gold);
  // octagonal shoulder, drum, dome
  b.col(mul3(wallC, 0.95), 0.85, 1); b.lathe(0, hb, 0, [[w * 0.5, 0], [dr * 1.12, drumH * 0.45], [dr * 1.12, drumH * 0.5], [dr, drumH * 0.5]], 8, { facet: true, start: Math.PI / 8 });
  b.col(wallC, 0.9, 1).surf(SURF.ARCHED, rng(), 1.7 * lit); b.lathe(0, hb + drumH * 0.5, 0, [[dr, 0], [dr, drumH]], seg, { cellW: TAU * dr / 12, cellH: drumH });
  b.col(P.trim, 0.95, 1).surf(SURF.PLAIN); b.lathe(0, hb + drumH * 1.5, 0, [[dr, -0.4], [dr * 1.07, -0.25], [dr * 1.07, 0], [dr * 0.97, 0]], seg);
  const dy = hb + drumH * 1.5, lanH = h * 0.1, domeH = h - dy - lanH;
  const prof = domeProfile(dr * 0.97, domeH, shape);
  b.col(P.dome, 0.72, 1.2); b.lathe(0, dy, 0, prof, seg, { smooth: true });
  // lantern and finial
  const lr = dr * 0.12;
  if (shape === 'hemisphere') {
    b.col(P.trim, 0.9, 1); b.lathe(0, dy + domeH - 0.3, 0, [[lr * 1.5, 0], [lr * 1.5, 0.5], [lr, 0.5]], 8);
    b.col(P.accent).surf(SURF.GLOW, 0, 1.6 * lit); b.lathe(0, dy + domeH + 0.2, 0, [[lr, 0], [lr, lanH * 0.45]], 8);
    b.col(P.dome, 0.9, 1.2).surf(SURF.PLAIN); b.lathe(0, dy + domeH + 0.2 + lanH * 0.45, 0, domeProfile(lr * 1.25, lanH * 0.3, 'hemisphere', 4), 8, { smooth: true });
    finial(b, 0, dy + domeH + 0.2 + lanH * 0.72, 0, lanH * 0.09, P.gold);
  } else finial(b, 0, dy + domeH - 0.4, 0, lanH * 0.3, P.gold);
  if (detail > 0.45) {                                                // corner cupolas
    const cr = w * 0.085, cx = w / 2 - cr * 1.5;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      b.col(wallC, 0.85, 1).surf(SURF.ARCHED, rng(), 1.5 * lit); b.lathe(sx * cx, hb, sz * cx, [[cr, 0], [cr, cr * 1.5]], 8, { cellW: TAU * cr / 4, cellH: cr * 1.5 });
      b.col(P.dome, 0.75, 1.2).surf(SURF.PLAIN); b.lathe(sx * cx, hb + cr * 1.5, sz * cx, domeProfile(cr * 1.08, cr * (shape === 'hemisphere' ? 1.05 : 1.7), shape, 6), 8, { smooth: true });
    }
  }
  return { w: w + 1.8, d: w + 1.8, h };
}

function bMinaret(b, o) {
  const { rng, P, detail } = o;
  const h = o.height ?? rng.range(38, 60), w = o.width ?? rng.range(4.4, 5.8), lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.05, 0.015), bh = h * 0.15, seg = detail > 0.5 ? 10 : 8;
  b.col(P.stone, 0.75, 1).surf(SURF.MASONRY, 0, 1.2); b.box(-w / 2, -0.01, -w / 2, w / 2, bh, w / 2, { m: 1, top: false });
  winDecal(b, rng, 0, 1.5, w / 2 + 0.01, 1.3, 2.6, 0, SURF.ARCHED, 0.8, P.gold);
  let r = w * 0.4, y = bh + 1.3;
  b.col(wallC, 0.9, 1).surf(SURF.PLAIN); b.lathe(0, bh, 0, [[w * 0.62, 0], [r, 1.3]], 8, { facet: true, start: Math.PI / 8 });
  const tops = h > 46 ? [0.5, 0.72] : [0.62];
  for (let k = 0; k <= tops.length; k++) {
    const last = k === tops.length, top = last ? h * 0.86 : h * tops[k];
    if (k > 0) { b.col(wallC, 0.95, 1).surf(SURF.ARCHED, rng(), 2 * lit); b.lathe(0, y, 0, [[r, 0], [r, 3]], seg, { cellW: TAU * r / 4, cellH: 3 }); y += 3; }
    b.col(wallC, 0.86, 1).surf(SURF.STRIPES, 0, 2);
    b.lathe(0, y, 0, [[r, 0], [r * 0.97, top - 1.5 - y]], seg, { uvBand: [1, 0, (top - 1.5 - y) / 3.2] });
    b.surf(SURF.PLAIN);
    if (!last) {
      b.col(P.trim, 0.8, 1); b.lathe(0, top, 0, [[r * 0.97, -1.5], [r * 1.8, -0.2], [r * 1.8, 0.12], [r * 0.7, 0.12]], seg);
      b.col(P.accent).surf(SURF.GLOW, 0, 1.1 * lit); b.lathe(0, top, 0, [[r * 1.83, -0.2], [r * 1.83, 0.05]], seg);
      b.col(wallC, 0.9, 1).surf(SURF.PLAIN); b.lathe(0, top, 0, [[r * 1.74, 0.12], [r * 1.74, 1.05], [r * 1.6, 1.05]], seg);
      y = top + 0.12; r *= 0.8;
    } else y = top - 1.5;
  }
  b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.lathe(0, y, 0, [[r * 0.97, 0], [r * 1.3, 0.5], [r * 1.3, 0.75], [r * 1.1, 0.75]], seg);
  const ch = h - y - 0.75 - h * 0.035;
  b.col(P.roof, 0.8, 1.15); b.lathe(0, y + 0.75, 0, [[r * 1.12, 0], [r * 0.8, ch * 0.4], [r * 0.32, ch * 0.82], [0, ch]], seg);
  finial(b, 0, y + 0.75 + ch - 0.3, 0, h * 0.01, P.gold);
  return { w, d: w, h };
}

function bMega(b, o) {
  const { rng, P, detail } = o;
  const w = o.width ?? rng.range(90, 130), h = o.height ?? rng.range(420, 720), lit = o.lit ?? 1;
  const wallC = vary(P.wall, rng, 0.08, 0.02), seed = rng(), core = w * 0.36, cellW = 5, cellH = 4.6;
  const fr = [0.3, 0.52, 0.7, 0.86, 1], hb = h * 0.8, rich = detail >= 0.5, trimC = mix3(wallC, P.trim, 0.5);
  let y = 0, s = core;
  for (let i = 0; i < 5; i++) {
    const top = hb * fr[i];
    b.col(wallC, i ? 0.92 : 0.55, 1).surf(SURF.CURTAIN, (seed + i * 0.21) % 1, lit);
    b.box(-s / 2, y, -s / 2, s / 2, top, s / 2, { cellW, cellH, capColor: P.roof });
    if (rich) {                                                       // megacolumn fins and refuge-floor bands break the curtain wall up
      b.col(trimC, 0.6, 1).surf(SURF.PLAIN); finsInto(b, -s / 2, -s / 2, s / 2, s / 2, y, top + 3, cellW, 2, 1.1, 0.9);
      const band = cellH * 12; b.col(mul3(trimC, 0.8), 1, 1);
      for (let yy = y + band; yy < top - band * 0.5; yy += band) b.box(-s / 2 - 0.5, yy - 1.1, -s / 2 - 0.5, s / 2 + 0.5, yy + 1.1, s / 2 + 0.5, { bottom: true });
    }
    b.col(P.accent).surf(SURF.GLOW, 0, 0.9); b.box(-s / 2 - 0.15, top - 3.2, -s / 2 - 0.15, s / 2 + 0.15, top - 1, s / 2 + 0.15, { top: false });
    if (i < 3 && detail > 0.3) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.surf(SURF.GLOW, 0, 0.55); b.cbox(sx * (s / 2 + 0.1), y, sz * (s / 2 + 0.1), 1.1, top - y, 1.1, { top: false }); }
    y = top; s *= 0.8;
  }
  // buttress wings stepping down from the core
  const hk = rng.shuffle([0.56, 0.47, 0.38, 0.3]), len = (w - core) / 2, ww = core * 0.56, ph = clamp(h * 0.045, 15, 24), gfh = 7;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, wh = h * hk[k], zA = core / 2, zB = core / 2 + len * 0.55, zC = core / 2 + len;
    b.tr(0, 0, 0, a);
    const wc = vary(wallC, rng, 0.06), wcw = rng.range(2.6, 3.4);
    b.col(wc, 0.55, 1).surf(SURF.CURTAIN, rng(), lit);
    b.box(-ww / 2, 0, zA, ww / 2, wh, zB, { cellW: wcw, cellH, capColor: P.roof });
    b.box(-ww * 0.4, 0, zB, ww * 0.4, wh * 0.62, zC, { cellW: wcw, cellH, capColor: P.roof });
    if (rich) {
      b.col(trimC, 0.6, 1).surf(SURF.PLAIN);
      finsInto(b, -ww / 2, zA, ww / 2, zB, ph, wh + 2.2, wcw, 3, 0.8, 0.5); finsInto(b, -ww * 0.4, zB, ww * 0.4, zC, ph, wh * 0.62 + 2.2, wcw, 3, 0.8, 0.5);
      b.col(mul3(trimC, 0.8), 1, 1);
      for (let yy = ph + cellH * 10; yy < wh - cellH * 4; yy += cellH * 10) b.box(-ww / 2 - 0.4, yy - 0.8, zA, ww / 2 + 0.4, yy + 0.8, zB + 0.4, { bottom: true });
      // podium round the foot of the wing: glazed arcade at street level, two office floors, a planted terrace
      const pw = ww * 0.5 + 9, pz = zC + 8;
      b.col(mul3(wc, 0.8), 0.6, 1).surf(SURF.SHOP, rng(), 1.9 * lit); b.box(-pw, 0, zA, pw, gfh, pz, { cellW: 7.5, cellH: gfh, top: false });
      b.col(mul3(wc, 1.05), 0.9, 1).surf(SURF.WINDOW, rng(), lit); b.box(-pw, gfh, zA, pw, ph, pz, { cellW: 3.1, cellH: (ph - gfh) / Math.max(2, Math.round((ph - gfh) / 4.2)), capColor: mul3(P.roof, 1.6) });
      b.col(trimC, 0.9, 1).surf(SURF.PLAIN);
      b.box(-pw - 3.2, gfh - 0.3, zA, pw + 3.2, gfh + 0.35, pz + 3.2, { bottom: true });                // canopy over the pavement
      b.box(-pw - 0.4, ph - 0.2, zA, pw + 0.4, ph + 1.1, pz + 0.4, { bottom: true, capColor: mul3(P.roof, 1.6) });
      finsInto(b, -pw, zA, pw, pz, gfh + 0.35, ph - 0.2, 3.1, 2, 0.5, 0.45);
      for (let x = -pw + 3.75; x < pw; x += 7.5) b.cbox(x, 0, pz + 2.4, 0.7, gfh - 0.3, 0.7, { top: false });   // canopy columns
      b.col([0.07, 0.16, 0.06], 0.8, 1.3); b.box(-pw + 2, ph + 1.1, zB + 3, pw - 2, ph + 2.3, pz - 2.5, {});     // terrace planting
      // entrance: a three-storey glazed portal between pylons under a lit lintel
      const ew = Math.min(16, pw * 0.8), ehh = ph - 2.5;
      b.col(mul3(trimC, 1.1), 0.8, 1).surf(SURF.PLAIN);
      for (const sx of [-1, 1]) b.cbox(sx * (ew / 2 + 1.1), 0, pz + 0.9, 2.2, ph + 3, 2.6, {});
      b.box(-ew / 2, ehh, pz, ew / 2, ehh + 1.4, pz + 2.6, { bottom: true });
      winDecal(b, rng, 0, ehh / 2, pz + 0.3, ew, ehh, 0, SURF.CURTAIN, 2.4 * lit, P.trim);
      glowBox(b, 0, ehh + 0.7, pz + 2.66, ew * 0.8, 0.5, 0.1, P.accent, 1.6);
    }
    b.col(P.accent).surf(SURF.GLOW, 0, 0.9);
    b.box(-ww / 2 - 0.12, wh - 2.6, zA, ww / 2 + 0.12, wh - 0.9, zB + 0.12, { top: false });
    if (detail > 0.3) glowBox(b, 0, wh + 2.2, core / 2 + len * 0.4, 1.6, 1.6, 1.6, [1, 0.12, 0.08], 3, rng.range(0.1, 0.9));
    b.surf(SURF.PLAIN).pop();
  }
  // sky rings
  if (detail > 0.2) for (const f of [0.3, 0.52]) {
    const ry = hb * f - 9, rr = core * 0.5 * Math.SQRT2 * (f < 0.4 ? 1 : 0.8) + 16;
    b.col(mul3(wallC, 0.8), 0.6, 1).surf(SURF.STEEL); b.lathe(0, ry, 0, [[rr * 0.5, -5], [rr, 0], [rr, 4], [rr * 0.5, 4]], 8, { facet: true, start: Math.PI / 8, m: 1 });
    b.col(P.accent).surf(SURF.GLOW, 0, 1.1); b.lathe(0, ry, 0, [[rr + 0.15, 1.2], [rr + 0.15, 2.6]], 8, { facet: true, start: Math.PI / 8 });
  }
  // crown and needle
  const s5 = s / 0.8;
  b.col(P.trim, 0.8, 1.1).surf(SURF.STEEL); b.frustum(0, 0, s5 * 0.9, s5 * 0.9, s5 * 0.22, s5 * 0.22, hb, hb + (h - hb) * 0.4, { m: 1 });
  b.surf(SURF.PLAIN); b.frustum(0, 0, s5 * 0.14, s5 * 0.14, 0, 0, hb + (h - hb) * 0.4, h);
  glowBox(b, 0, h + 1.5, 0, 3, 3, 3, [1, 0.12, 0.08], 4, 0.5);
  b.col(P.accent).surf(SURF.GLOW, 0, 1.3); b.box(-s5 * 0.46, hb + 0.5, -s5 * 0.46, s5 * 0.46, hb + 2.5, s5 * 0.46, { top: false });
  b.surf(SURF.PLAIN);
  return { w: w + 22, d: w + 22, h };
}

const BUILDERS = { modern: bModern, deco: bDeco, townhouse: bTownhouse, mediterranean: bMediterranean, pagoda: bPagoda, adobe: bAdobe, stilt: bStilt, lighthouse: bLighthouse, windmill: bWindmill, temple: bTemple, castle: bCastle, dome: bDome, minaret: bMinaret, mega: bMega };
export const BUILDING_STYLES = Object.keys(BUILDERS);

// Writes one building into builder b at its current transform. Returns { w, d, h, extras }.
const BUILDING_FLOOD = { temple: [0.9, 12], castle: [0.5, 16], dome: [0.6, 14], minaret: [0.7, 22], lighthouse: [0.45, 16], pagoda: [0.2, 12], windmill: [0.3, 8] };
function buildInto(b, style, opts, rng) {
  const fn = BUILDERS[style] || bModern;
  const o = Object.assign({}, opts, { rng, detail: opts.detail ?? 1, extras: [] });
  o.P = pickPal(BUILDERS[style] ? style : 'modern', rng, opts.palette);
  const FL = BUILDING_FLOOD[style];
  b.flood(opts.flood ?? (FL ? FL[0] : 0), 0, FL ? FL[1] : 14);
  const dims = fn(b, o);
  b.flood(0).surf(SURF.PLAIN).col([1, 1, 1], 1, 1);
  const top = b.stack.length ? b.stack[b.stack.length - 1].clone() : new THREE.Matrix4();
  for (const e of o.extras) e.matrix = top;
  dims.extras = o.extras; dims.style = style;
  return dims;
}

function beamGeometry(length, radius, color) {
  const seg = 14, pos = [], nor = [], col = [], uv = [], idx = [];
  for (const dir of [1, -1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= seg; j++) {
      const a = TAU * j / seg, cy = Math.cos(a), cz = Math.sin(a);
      pos.push(dir * 1.2, cy * 0.5, cz * 0.5, dir * length, cy * radius, cz * radius);
      nor.push(0, cy, cz, 0, cy, cz); col.push(...color, ...color); uv.push(j / seg, 0, j / seg, 1);
    }
    for (let j = 0; j < seg; j++) { const q = base + j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// Turns building extras (lighthouse beams, windmill sails) into animated objects under `group`.
function addExtras(extras, mats, group) {
  const anim = [];
  for (const e of extras) {
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false; holder.matrix.copy(e.matrix); group.add(holder);
    if (e.type === 'beam') {
      const m = new THREE.Mesh(beamGeometry(e.length, e.radius, e.color), mats.beam);
      m.position.set(e.pos[0], e.pos[1], e.pos[2]); m.renderOrder = 3; m.frustumCulled = false; holder.add(m);
      anim.push((time) => { m.rotation.y = e.phase + time * e.speed; });
    } else if (e.type === 'blades') {
      const m = new THREE.Mesh(bladesGeometry(e.radius, e.wood, e.sail), mats.facades);
      m.position.set(e.pos[0], e.pos[1], e.pos[2]); holder.add(m);
      anim.push((time) => { m.rotation.z = e.phase + time * e.speed; });
    }
  }
  return anim;
}

// Geometry only (position, normal, color, uv, win). userData = { w, d, h, extras, style }.
export function buildingGeometry(opts = {}) {
  const rng = fallbackRng(opts, 'building'), b = new Builder();
  const style = opts.style || rng.pick(BUILDING_STYLES);
  const info = buildInto(b, style, opts, rng);
  const g = b.toGeometry(); g.userData = info;
  return g;
}

// One building. opts: { rng, style, width, depth, height, detail, palette, lit, night, mats, shadows, ...style options }
export function makeBuilding(opts = {}) {
  const mats = matsOf(opts), geometry = buildingGeometry(opts), info = geometry.userData;
  const mesh = meshOf(geometry, mats.facades, opts);
  let object = mesh, anim = [];
  if (info.extras.length) { object = new THREE.Group(); object.add(mesh); anim = addExtras(info.extras, mats, object); }
  place(object, opts);
  return {
    object, geometry, mats, uniforms: mats.uniforms, style: info.style, size: { w: info.w, d: info.d, h: info.h }, triangles: geometry.index.count / 3,
    update(dt, time) { mats.update(dt, time); for (const f of anim) f(time); },
  };
}

// ---------- curves, halos, wires ----------
// Uniform access to a makePath() path, a THREE.Curve, or an array of points (smooth unless straight).
function sampler(src, straight, closed) {
  if (src && src.posAtDist) return { length: src.length, at: (d, out = new THREE.Vector3()) => src.posAtDist(d, out), tan: (d, out = new THREE.Vector3()) => src.tangentAtDist(d, out) };
  let curve = src;
  if (Array.isArray(src)) {
    const pts = src.map((p) => vec3(p).clone());
    if (straight || pts.length < 3) { curve = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1])); }
    else curve = new THREE.CatmullRomCurve3(pts, !!closed, 'centripetal');
  }
  if (curve.arcLengthDivisions < 200) curve.arcLengthDivisions = 400;
  const length = curve.getLength();
  return {
    length,
    at: (d, out = new THREE.Vector3()) => out.copy(curve.getPointAt(clamp(d / length, 0, 1))),
    tan: (d, out = new THREE.Vector3()) => out.copy(curve.getTangentAt(clamp(d / length, 0.0001, 0.9999))).normalize(),
    closed: !!closed && !straight && Array.isArray(src) && src.length > 2,
  };
}

// Billboard glows and ground light pools, merged into one additive mesh.
class Halos {
  constructor() { this.p = []; this.u = []; this.c = []; this.h = []; this.a = []; this.i = []; this.n = 0; this.max = 0; }
  add(x, y, z, size, col, mode = 0, twinkle = 0) {
    const b = this.n * 4;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { this.p.push(x, y, z); this.u.push(cx, cy); this.c.push(col[0], col[1], col[2]); this.h.push(size, mode); this.a.push(0, 1, 0, twinkle); }
    if (mode < 0.5) this.i.push(b, b + 1, b + 2, b, b + 2, b + 3); else this.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
    this.n++; this.max = Math.max(this.max, size);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aHalo', new THREE.Float32BufferAttribute(this.h, 2));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.a, 4)); g.setIndex(this.i);
    if (this.n) { g.computeBoundingSphere(); g.boundingSphere.radius += this.max; }
    return g;
  }
  mesh(material) { const m = new THREE.Mesh(this.geometry(), material); m.renderOrder = 2; return m; }
}

// Camera-facing ribbons with a minimum on-screen width: cables, ropes, rigging, neon.
class Wires {
  constructor() { this.p = []; this.t = []; this.u = []; this.c = []; this.w = []; this.i = []; this.n = 0; }
  line(pts, radius, col, soft = 0, phase = 0) {
    const n = pts.length; if (n < 2) return;
    const base = this.n;
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      for (const s of [-1, 1]) { this.p.push(pts[k][0], pts[k][1], pts[k][2]); this.t.push(tx, ty, tz); this.u.push(s, phase); this.c.push(col[0], col[1], col[2]); this.w.push(radius, soft); }
      if (k < n - 1) { const q = base + k * 2; this.i.push(q, q + 1, q + 3, q, q + 3, q + 2); }
    }
    this.n += n * 2;
  }
  // hanging cable between two points; sag in metres at mid-span
  catenary(a, b, sag, radius, col, seg = 10) {
    const pts = [];
    for (let k = 0; k <= seg; k++) { const t = k / seg; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]); }
    this.line(pts, radius, col); return pts;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.t, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 2)); g.setIndex(this.i);
    if (this.n) { g.computeBoundingSphere(); g.boundingSphere.radius += 2; }
    return g;
  }
  mesh(material) { const m = new THREE.Mesh(this.geometry(), material); m.renderOrder = 1; return m; }
}

const WARM = '#ffc27a';
const result = (object, mats, extra) => Object.assign({ object, mats, uniforms: mats.uniforms, update(dt, time) { mats.update(dt, time); } }, extra);

// ---------- lamps ----------
function lampGeometry(type, h, P, power) {
  const b = new Builder(256); let head = [0, h, 0];
  if (type === 'street') {
    b.col(P.metal, 0.7, 1); b.lathe(0, 0, 0, [[0.2, 0], [0.16, 0.9], [0.1, 1], [0.07, h]], 6);
    const arm = h * 0.26, pts = []; for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([0, h - 0.05 + Math.sin(t * 1.5) * 0.5, t * arm]); }
    b.tube(pts, 0.055, 5);
    const hz = arm + 0.3, hy = pts[5][1];
    b.col(P.metal); b.box(-0.2, hy - 0.02, hz - 0.5, 0.2, hy + 0.12, hz + 0.45, {});
    b.col(P.light).surf(SURF.GLOW, 0, power); b.quad([-0.16, hy - 0.04, hz - 0.4], [0.16, hy - 0.04, hz - 0.4], [0.16, hy - 0.04, hz + 0.38], [-0.16, hy - 0.04, hz + 0.38]);
    b.box(-0.17, hy - 0.1, hz - 0.4, 0.17, hy - 0.02, hz + 0.38, { top: false });
    head = [0, hy - 0.08, hz];
  } else if (type === 'post') {
    b.col(P.metal, 0.7, 1); b.lathe(0, 0, 0, [[0.16, 0], [0.12, 0.25], [0.055, 0.4], [0.05, h - 0.28], [0.11, h - 0.22]], 6);
    b.col(P.light).surf(SURF.GLOW, 0, power); b.sphere(0, h, 0, 0.26, 8, 5);
    head = [0, h, 0];
  } else if (type === 'bollard') {
    b.col(P.metal, 0.7, 1); b.lathe(0, 0, 0, [[0.14, 0], [0.14, h - 0.28]], 6); b.lathe(0, 0, 0, [[0.14, h - 0.1], [0.14, h], [0, h]], 6);
    b.col(P.light).surf(SURF.GLOW, 0, power); b.lathe(0, 0, 0, [[0.125, h - 0.28], [0.125, h - 0.1]], 6);
    head = [0, h - 0.19, 0];
  } else {                                                            // classic gas-lamp lantern
    b.col(P.metal, 0.65, 1);
    b.lathe(0, 0, 0, [[0.24, 0], [0.24, 0.12], [0.15, 0.22], [0.13, 0.75], [0.07, 0.95], [0.055, h - 0.75], [0.1, h - 0.68], [0.045, h - 0.6], [0.045, h - 0.5], [0.2, h - 0.44]], 6);
    b.col(P.light).surf(SURF.GLOW, 0, power); b.lathe(0, 0, 0, [[0.15, h - 0.44], [0.24, h - 0.02]], 4, { facet: true, start: Math.PI / 4 });
    b.col(P.metal).surf(SURF.PLAIN); b.lathe(0, 0, 0, [[0.3, h - 0.03], [0.3, h + 0.01], [0.09, h + 0.2], [0.05, h + 0.3], [0, h + 0.42]], 4, { facet: true, start: Math.PI / 4 });
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; b.beam([0.15 * Math.cos(a) * 1.41, h - 0.44, 0.15 * Math.sin(a) * 1.41], [0.24 * Math.cos(a) * 1.41, h - 0.02, 0.24 * Math.sin(a) * 1.41], 0.025, 0.025); }
    head = [0, h - 0.22, 0];
  }
  return { geometry: b.toGeometry(), head };
}

// Street lamps: instanced posts with glowing heads, soft halos and pools of light on the ground.
// opts: { rng, positions:[[x,y,z]..] | along:{ path, spacing, offset, both, from, to, heightAt }, yaws:[..], type:'classic'|'street'|'post'|'bollard',
//         height, color, power, pool, poolSize, haloSize, palette:{metal,light}, mats, night }
export function makeLamps(opts = {}) {
  const mats = matsOf(opts), type = opts.type || 'classic';
  const h = opts.height ?? { street: 8.5, classic: 4.4, post: 3.2, bollard: 1 }[type];
  const P = palette({ metal: '#1d2226', light: opts.color || WARM }, opts.palette);
  let pos = (opts.positions || []).map((p) => vec3(p).clone()), yaws = opts.yaws ? opts.yaws.slice() : null;
  if (opts.along) {
    const a = opts.along, sm = sampler(a.path || a.curve || a.points), sp = a.spacing ?? (type === 'street' ? 32 : 16), off = a.offset ?? 6;
    yaws = yaws || []; const tp = new THREE.Vector3(), tt = new THREE.Vector3();
    let k = 0;
    for (let d = a.from ?? sp / 2; d <= (a.to ?? sm.length); d += sp, k++) {
      sm.at(d, tp); sm.tan(d, tt);
      for (const s of a.both === false ? [a.side ?? 1] : (a.stagger ? [k % 2 ? 1 : -1] : [1, -1])) {
        const x = tp.x + tt.z * off * s, z = tp.z - tt.x * off * s;
        pos.push(new THREE.Vector3(x, a.heightAt ? a.heightAt(x, z) : (a.y ?? tp.y), z)); yaws.push(Math.atan2(-tt.z * s, tt.x * s));
      }
    }
  }
  const { geometry, head } = lampGeometry(type, h, P, opts.power ?? 2.2);
  const inst = new THREE.InstancedMesh(geometry, mats.facades, Math.max(1, pos.length)); inst.count = pos.length;
  const halos = new Halos(), poolSize = opts.poolSize ?? h * (type === 'street' ? 1.9 : 2.1), haloSize = opts.haloSize ?? (type === 'street' ? 2.6 : type === 'bollard' ? 0.9 : 1.7);
  const heads = [];
  pos.forEach((p, i) => {
    const yaw = yaws ? yaws[i] : 0;
    _q.setFromAxisAngle(_Y, yaw); inst.setMatrixAt(i, _m4.compose(p, _q, _one));
    const hx = p.x + Math.sin(yaw) * head[2], hz = p.z + Math.cos(yaw) * head[2], hy = p.y + head[1];
    heads.push(new THREE.Vector3(hx, hy, hz));
    halos.add(hx, hy, hz, haloSize, mul3(P.light, 1.1));
    if (opts.pool !== false) halos.add(hx, p.y + 0.06, hz, poolSize, mul3(P.light, opts.poolPower ?? 0.3), 1);
  });
  inst.instanceMatrix.needsUpdate = true; inst.computeBoundingSphere();
  const object = new THREE.Group(); object.add(inst); object.add(halos.mesh(mats.halo));
  place(object, opts);
  return result(object, mats, { count: pos.length, positions: pos, heads, triangles: geometry.index.count / 3 * pos.length + halos.n * 2 });
}

// ---------- paper lanterns ----------
function lanternGeometry(shape, P) {
  const b = new Builder(256);
  if (shape === 'round') {
    b.col(P.frame); b.lathe(0, 0, 0, [[0, 0.06], [0.2, 0.06], [0.2, 0.14]], 8); b.lathe(0, 0, 0, [[0.2, 0.86], [0.2, 0.94], [0, 0.94]], 8);
    b.col([1, 1, 1]).surf(SURF.GLOW); b.lathe(0, 0, 0, [[0.2, 0.14], [0.4, 0.3], [0.46, 0.5], [0.4, 0.7], [0.2, 0.86]], 8, { smooth: true });
    b.surf(SURF.PLAIN).col(P.frame); b.beam([0, -0.22, 0], [0, 0.06, 0], 0.035, 0.035);
  } else if (shape === 'box') {
    b.col(P.frame); b.cbox(0, 0, 0, 0.62, 0.06, 0.62, { bottom: true }); b.cbox(0, 0.94, 0, 0.7, 0.06, 0.7, { bottom: true });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam([sx * 0.28, 0.06, sz * 0.28], [sx * 0.28, 0.94, sz * 0.28], 0.05, 0.05);
    b.col([1, 1, 1]).surf(SURF.GLOW); b.box(-0.26, 0.06, -0.26, 0.26, 0.94, 0.26, { top: false });
  } else {                                                            // sky lantern: an open paper bag over a flame
    b.col([1, 1, 1]).surf(SURF.GLOW);
    b.lathe(0, 0, 0, [[0.27, 0], [0.42, 0.34], [0.48, 0.7], [0.3, 1.0], [0, 1.04]], 6, { smooth: true });
    b.col([2.2, 1.6, 0.9]); b.cbox(0, 0.02, 0, 0.12, 0.12, 0.12, { bottom: true });
  }
  const g = b.toGeometry(), uv = g.attributes.uv, pos = g.attributes.position, win = g.attributes.win;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, clamp(pos.getY(i), 0, 1), win.getX(i) > 7.5 ? 1 : 0);
  g.deleteAttribute('win');
  return g;
}

// Paper lanterns, instanced: hanging still, bobbing, or rising as a slow cloud of sky lanterns.
// opts: { rng, count, positions | area:{ center:[x,y,z], size:[sx,sy,sz] }, shape:'sky'|'round'|'box', size, colors,
//         float:true (rise), riseSpeed, span, sway, swayFreq, halo, haloSize, clear:(x,y,z)=>bool, mats, night }
export function makeLanterns(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'lanterns');
  const shape = opts.shape || (opts.float === false ? 'round' : 'sky'), floats = opts.float ?? shape === 'sky';
  const colors = (opts.colors || ['#ff8a3a', '#ffb055', '#ff6a3a', '#ffd08a']).map(lin), size = opts.size ?? 1;
  const P = palette({ frame: '#1c1210' }, opts.palette);
  const area = opts.area || { center: [0, 20, 0], size: [120, 40, 120] };
  const span = floats ? (opts.span ?? Math.max(30, area.size[1] * 2)) : 0;
  const uFloat = new THREE.Vector4(floats ? (opts.riseSpeed ?? 0.9) : 0, span, opts.sway ?? (floats ? 1.6 : 0.06), opts.swayFreq ?? (floats ? 0.25 : 1.3));
  let pos = opts.positions ? opts.positions.map((p) => vec3(p).clone()) : [];
  if (!opts.positions) {
    const n = opts.count ?? 160;
    for (let i = 0, tries = 0; i < n && tries < n * 20; tries++) {
      const x = area.center[0] + (rng() - 0.5) * area.size[0], y = area.center[1] + (rng() - 0.5) * area.size[1], z = area.center[2] + (rng() - 0.5) * area.size[2];
      if (opts.clear && !opts.clear(x, y, z)) continue;
      pos.push(new THREE.Vector3(x, y, z)); i++;
    }
  }
  const n = pos.length, geo = lanternGeometry(shape, P);
  const anim = new Float32Array(n * 4), body = new THREE.InstancedMesh(geo, mats.lantern(uFloat), Math.max(1, n)); body.count = n;
  const hq = new THREE.BufferGeometry();
  hq.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0], 3)); hq.setAttribute('uv', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  hq.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 3)); hq.setAttribute('aHalo', new THREE.Float32BufferAttribute(new Array(8).fill(0).map((_, i) => (i % 2 ? 0 : (opts.haloSize ?? 2.2))), 2)); hq.setIndex([0, 1, 2, 0, 2, 3]);
  const halo = new THREE.InstancedMesh(hq, mats.haloFloat(uFloat), Math.max(1, n)); halo.count = n; halo.renderOrder = 2;
  const c = new THREE.Color(), s3 = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const s = size * rng.range(0.75, 1.3);
    _q.setFromAxisAngle(_Y, rng() * TAU); _m4.compose(pos[i], _q, s3.set(s, s, s)); body.setMatrixAt(i, _m4); halo.setMatrixAt(i, _m4);
    const k = vary(rng.pick(colors), rng, 0.15, 0.05); c.setRGB(k[0], k[1], k[2]); body.setColorAt(i, c);
    c.setRGB(k[0] * 0.55, k[1] * 0.42, k[2] * 0.3); halo.setColorAt(i, c);
    anim[i * 4] = rng(); anim[i * 4 + 1] = rng.range(0.6, 1.4); anim[i * 4 + 2] = rng.range(0.5, 1.5); anim[i * 4 + 3] = rng();
  }
  geo.setAttribute('aAnim', new THREE.InstancedBufferAttribute(anim, 4)); hq.setAttribute('aAnim', new THREE.InstancedBufferAttribute(anim, 4));
  const bs = new THREE.Sphere(); if (n) { new THREE.Box3().setFromPoints(pos).getBoundingSphere(bs); bs.radius += span + 6 + (opts.sway ?? 2) * 3; bs.center.y += span / 2; }
  body.boundingSphere = bs; halo.boundingSphere = bs.clone();
  const object = new THREE.Group(); object.add(body); if (opts.halo !== false) object.add(halo);
  if (opts.rotationY != null) object.rotation.y = opts.rotationY;    // (position is taken by the lantern positions themselves)
  return result(object, mats, { count: n, positions: pos, uFloat, triangles: n * (geo.index.count / 3 + 2) });
}

// ---------- strings of lights ----------
// opts: { rng, spans:[[a,b],..] | points:[p0,p1,..] (chained), sag (fraction of span), spacing, colors, size, twinkle, solid, wireColor, mats, night }
export function makeStringLights(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'strings');
  const spans = opts.spans ? opts.spans.map(([a, b]) => [vec3(a), vec3(b)]) : [];
  if (opts.points) for (let i = 0; i < opts.points.length - 1; i++) spans.push([vec3(opts.points[i]), vec3(opts.points[i + 1])]);
  const colors = (opts.colors || ['#ffd9a0']).map(lin), spacing = opts.spacing ?? 1.4, size = opts.size ?? 0.4, sagF = opts.sag ?? 0.1;
  const wires = new Wires(), halos = new Halos(), b = new Builder(512), wc = lin(opts.wireColor || '#15171a'), bulbs = [];
  let ci = 0;
  for (const [a, c] of spans) {
    const len = a.distanceTo(c), n = Math.max(2, Math.round(len / spacing)), sag = len * sagF;
    wires.catenary([a.x, a.y, a.z], [c.x, c.y, c.z], sag, 0.012, wc, Math.max(6, Math.min(24, n)));
    for (let k = 1; k < n; k++) {
      const t = k / n, x = lerp(a.x, c.x, t), y = lerp(a.y, c.y, t) - sag * 4 * t * (1 - t) - 0.12, z = lerp(a.z, c.z, t);
      const col = colors[(opts.shuffle ? rng.int(0, colors.length - 1) : ci++) % colors.length];
      halos.add(x, y, z, size * rng.range(0.85, 1.15), mul3(col, 1.3), 0, opts.twinkle === 0 ? 0 : rng.range(0.05, 1) * (opts.twinkle ?? 1));
      if (opts.solid !== false) { b.col(col).surf(SURF.GLOW, 0, 1.6); b.lathe(x, y - 0.07, z, [[0, 0], [0.06, 0.07], [0, 0.16]], 4); }
      bulbs.push([x, y, z]);
    }
  }
  const object = new THREE.Group(); object.add(wires.mesh(mats.wire)); object.add(halos.mesh(mats.halo));
  if (opts.solid !== false) object.add(new THREE.Mesh(b.toGeometry(), mats.facades));
  place(object, opts);
  return result(object, mats, { bulbs, triangles: halos.n * 2 + wires.i.length / 3 + b.triangles });
}

// ---------- neon ----------
function chaikin(pts, closed, rounds = 2) {
  for (let r = 0; r < rounds; r++) {
    const out = [], n = pts.length;
    if (!closed) out.push(pts[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      out.push([lerp(a[0], b[0], 0.25), lerp(a[1], b[1], 0.25), lerp(a[2], b[2], 0.25)], [lerp(a[0], b[0], 0.75), lerp(a[1], b[1], 0.75), lerp(a[2], b[2], 0.75)]);
    }
    if (!closed) out.push(pts[n - 1]); else out.push(out[0]);
    pts = closed ? out.slice(0, -1) : out;
  }
  if (closed) pts = pts.concat([pts[0]]);
  return pts;
}
// 2D neon shapes in the XY plane, roughly within [-1,1]. Returns arrays of { pts, closed }.
function neonShape(kind, rng) {
  const P = (arr) => arr.map((p) => [p[0], p[1], 0]);
  const circle = (cx, cy, r, n = 20) => { const a = []; for (let i = 0; i < n; i++) a.push([cx + r * Math.cos(TAU * i / n), cy + r * Math.sin(TAU * i / n), 0]); return a; };
  switch (kind) {
    case 'ring': return [{ pts: circle(0, 0, 0.9), closed: true, smooth: false }];
    case 'rings': return [{ pts: circle(0, 0, 0.92), closed: true, smooth: false }, { pts: circle(0, 0, 0.52, 14), closed: true, smooth: false }];
    case 'arrow': return [{ pts: P([[-1, 0.28], [0.25, 0.28], [0.25, 0.7], [1, 0], [0.25, -0.7], [0.25, -0.28], [-1, -0.28]]), closed: true }];
    case 'zigzag': return [{ pts: P([[-1, -0.5], [-0.6, 0.5], [-0.2, -0.5], [0.2, 0.5], [0.6, -0.5], [1, 0.5]]) }];
    case 'wave': { const a = []; for (let i = 0; i <= 24; i++) a.push([-1 + i / 12, 0.45 * Math.sin(i / 24 * TAU * 2), 0]); return [{ pts: a, smooth: false }]; }
    case 'bars': return [-0.6, 0, 0.6].map((y, i) => ({ pts: P([[-1 + i * 0.25 * (rng ? rng() : 0.5), y], [1 - (2 - i) * 0.3 * (rng ? rng() : 0.5), y]]), smooth: false }));
    case 'frame': return [{ pts: P([[-1, -0.6], [1, -0.6], [1, 0.6], [-1, 0.6]]), closed: true }];
    case 'star': { const a = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.42 : 1, an = Math.PI / 2 + TAU * i / 10; a.push([r * Math.cos(an), r * Math.sin(an), 0]); } return [{ pts: a, closed: true, rounds: 1 }]; }
    case 'heart': { const a = []; for (let i = 0; i < 28; i++) { const t = TAU * i / 28; a.push([Math.pow(Math.sin(t), 3), (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16 + 0.1, 0]); } return [{ pts: a, closed: true, smooth: false }]; }
    case 'moon': { const a = []; for (let i = 0; i <= 14; i++) { const t = -2.1 + 4.2 * i / 14; a.push([0.9 * Math.cos(t) - 0.15, 0.9 * Math.sin(t), 0]); } for (let i = 14; i >= 0; i--) { const t = -1.55 + 3.1 * i / 14; a.push([0.62 * Math.cos(t) + 0.28, 0.72 * Math.sin(t), 0]); } return [{ pts: a, closed: true, smooth: false }]; }
    case 'diamond': return [{ pts: P([[0, 1], [0.7, 0], [0, -1], [-0.7, 0]]), closed: true, rounds: 1 }];
    case 'bolt': return [{ pts: P([[0.2, 1], [-0.5, 0.05], [0.05, 0.05], [-0.25, -1], [0.55, 0.2], [0, 0.2]]), closed: true, rounds: 1 }];
    default: return [{ pts: circle(0, 0, 0.9), closed: true, smooth: false }];
  }
}
export const NEON_SHAPES = ['ring', 'rings', 'arrow', 'zigzag', 'wave', 'bars', 'frame', 'star', 'heart', 'moon', 'diamond', 'bolt'];

function addNeon(wires, pts, col, radius, glow, flicker) {
  wires.line(pts, radius, mul3(col, 3.2), 0, flicker);
  if (glow > 0) wires.line(pts, radius * 9 * glow, mul3(col, 0.55), 1, flicker);
}

// Neon tubes. Either tubes:[{ points:[[x,y,z]..], color, closed, flicker }] in local space, or a preset shape
// (see NEON_SHAPES) drawn in the XY plane facing +Z and scaled by size.
// opts: { rng, shape, size, tubes, color, colors, radius, glow, flicker, mats, night }
export function makeNeon(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'neon'), wires = new Wires();
  const radius = opts.radius ?? 0.05, glow = opts.glow ?? 1, colors = (opts.colors || [opts.color || '#ff3d8b']).map(lin);
  if (opts.tubes) {
    opts.tubes.forEach((t, i) => {
      let pts = t.points.map((p) => (Array.isArray(p) ? p : [p.x, p.y, p.z]));
      if (t.smooth !== false && pts.length > 2) pts = chaikin(pts, !!t.closed, 2); else if (t.closed) pts = pts.concat([pts[0]]);
      addNeon(wires, pts, t.color ? lin(t.color) : colors[i % colors.length], t.radius ?? radius, glow, t.flicker ? rng.range(0.05, 0.95) : 0);
    });
  } else {
    const s = opts.size ?? 2, shapes = neonShape(opts.shape || 'ring', rng);
    shapes.forEach((sh, i) => {
      let pts = sh.pts.map((p) => [p[0] * s, p[1] * s, p[2] * s]);
      if (sh.smooth !== false) pts = chaikin(pts, !!sh.closed, sh.rounds ?? 2); else if (sh.closed) pts = pts.concat([pts[0]]);
      addNeon(wires, pts, colors[i % colors.length], radius, glow, opts.flicker ? rng.range(0.05, 0.95) : 0);
    });
  }
  const object = place(wires.mesh(mats.neon), opts);
  return result(object, mats, { triangles: wires.i.length / 3 });
}

// ---------- signs (no text: abstract glyphs) ----------
// Draws one abstract glyph out of glowing primitives on the plane z, centred at (x,y), inside w x h.
function glyph(b, rng, x, y, z, w, h, col, power = 1) {
  const st = b.style, sd = b.sd, sl = b.lit, c = b.c;
  b.surf(SURF.GLOW, 0, power).col(col).shade(1, 1);
  const kind = rng.int(0, 6), Q = (x0, y0, x1, y1) => b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
  const disc = (cx, cy, r, n = 10, a0 = 0, arc = TAU) => { for (let i = 0; i < n; i++) { const a = a0 + arc * i / n, a2 = a0 + arc * (i + 1) / n; b.tri([cx, cy, z], [cx + r * Math.cos(a), cy + r * Math.sin(a), z], [cx + r * Math.cos(a2), cy + r * Math.sin(a2), z]); } };
  if (kind === 0) { const n = rng.int(2, 3); for (let i = 0; i < n; i++) { const yy = y - h / 2 + h * (i + 0.5) / n, l = w * rng.range(0.45, 1); Q(x - w / 2, yy - h * 0.12, x - w / 2 + l, yy + h * 0.12); } }
  else if (kind === 1) disc(x, y, Math.min(w, h) * 0.46);
  else if (kind === 2) { const r = Math.min(w, h) * 0.46; b.tri([x - r, y - r * 0.8, z], [x + r, y - r * 0.8, z], [x, y + r, z]); }
  else if (kind === 3) { const n = 3, s = Math.min(w, h) / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (rng.chance(0.62)) Q(x + (i - n / 2) * s + s * 0.12, y + (j - n / 2) * s + s * 0.12, x + (i - n / 2 + 1) * s - s * 0.12, y + (j - n / 2 + 1) * s - s * 0.12); }
  else if (kind === 4) { const r = Math.min(w, h) * 0.46; b.quad([x - r, y, z], [x, y - r, z], [x + r, y, z], [x, y + r, z]); }
  else if (kind === 5) { const r = Math.min(w, h) * 0.46; disc(x, y, r, 8, -Math.PI / 2, Math.PI); Q(x - r, y - r, x - r * 0.25, y + r); }
  else { const r = Math.min(w, h) * 0.44; Q(x - w * 0.45, y - r * 0.28, x + w * 0.05, y + r * 0.28); b.tri([x + w * 0.05, y - r, z], [x + w * 0.48, y, z], [x + w * 0.05, y + r, z]); }
  b.style = st; b.sd = sd; b.lit = sl; b.c = c;
}

// opts: { rng, type:'billboard'|'blade'|'hanging'|'post'|'neon', width, height, colors, palette:{frame,panel}, shape (neon), mats, night }
export function makeSign(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'sign'), type = opts.type || 'billboard';
  const P = palette({ frame: '#23272c', panel: '#0f1318', post: '#3a3f45' }, opts.palette);
  const colors = (opts.colors || ['#ff4f8b', '#4fd8ff', '#ffd24f', '#7dff9a', '#ff8a3a', '#b98cff']).map(lin);
  const b = new Builder(512), object = new THREE.Group(); let neon = null, size = {};
  if (type === 'billboard') {
    const w = opts.width ?? 12, h = opts.height ?? 5, y0 = opts.clearance ?? 7;
    b.col(P.post, 0.7, 1); for (const sx of [-0.3, 0.3]) b.beam([sx * w, 0, -0.3], [sx * w, y0 + h * 0.5, -0.3], 0.35, 0.35);
    b.col(P.frame); b.box(-w / 2 - 0.2, y0 - 0.2, -0.22, w / 2 + 0.2, y0 + h + 0.2, 0, { bottom: true });
    const cols = rng.int(2, 4), bg = mul3(rng.pick(colors), 0.5);
    b.col(bg).surf(SURF.GLOW, 0, 0.5); b.quad([-w / 2, y0, 0.02], [w / 2, y0, 0.02], [w / 2, y0 + h, 0.02], [-w / 2, y0 + h, 0.02]);
    for (let i = 0; i < cols; i++) glyph(b, rng, -w / 2 + w * (i + 0.5) / cols, y0 + h / 2, 0.06, w / cols * 0.7, h * 0.66, rng.pick(colors), 1.5);
    b.surf(SURF.PLAIN).col(P.frame);
    for (let i = 0; i < 3; i++) { const x = -w / 2 + w * (i + 0.5) / 3; b.beam([x, y0 - 0.2, 0.05], [x, y0 - 0.5, 1.3], 0.06, 0.06); glowBox(b, x, y0 - 0.5, 1.35, 0.3, 0.12, 0.2, lin('#fff2d0'), 2); }
    size = { w, h: y0 + h };
  } else if (type === 'blade') {
    const w = opts.width ?? 1.6, h = opts.height ?? 9, n = Math.max(2, Math.round(h / (w * 1.15)));
    b.col(P.frame); b.box(-0.25, 0, -0.16, w + 0.25, h, 0.16, { bottom: true });
    b.beam([-0.25, h * 0.85, 0], [-1.0, h * 0.85, 0], 0.1, 0.1); b.beam([-0.25, h * 0.15, 0], [-1.0, h * 0.15, 0], 0.1, 0.1);
    const col = rng.pick(colors), col2 = rng.pick(colors);
    for (const s of [1, -1]) {
      b.push(_m4.makeRotationY(s > 0 ? 0 : Math.PI).setPosition(s > 0 ? 0 : w, 0, 0));
      b.col(P.panel); b.quad([0, 0.15, 0.17], [w, 0.15, 0.17], [w, h - 0.15, 0.17], [0, h - 0.15, 0.17]);
      for (let i = 0; i < n; i++) glyph(b, rng, w / 2, h * (i + 0.5) / n, 0.2, w * 0.72, h / n * 0.7, i % 2 ? col2 : col, 1.6);
      b.pop();
    }
    neon = makeNeon({ rng, mats, tubes: [{ points: [[-0.12, 0.05, 0.2], [w + 0.12, 0.05, 0.2], [w + 0.12, h - 0.05, 0.2], [-0.12, h - 0.05, 0.2]], closed: true, color: col2, flicker: rng.chance(0.3) }, { points: [[-0.12, 0.05, -0.2], [w + 0.12, 0.05, -0.2], [w + 0.12, h - 0.05, -0.2], [-0.12, h - 0.05, -0.2]], closed: true, color: col2 }], radius: 0.04 });
    size = { w: w + 1.25, h };
  } else if (type === 'hanging') {
    const w = opts.width ?? 1.3, h = opts.height ?? 0.9;
    b.col(P.frame); b.beam([0, 0, 0], [w + 0.6, 0, 0], 0.07, 0.07); b.beam([0, -0.5, 0], [0.5, 0, 0], 0.05, 0.05);
    b.beam([0.35, 0, 0], [0.35, -0.25, 0], 0.03, 0.03); b.beam([w + 0.25, 0, 0], [w + 0.25, -0.25, 0], 0.03, 0.03);
    b.col(lin(opts.board || '#3a2a1e')); b.box(0.3, -0.25 - h, -0.04, w + 0.3, -0.25, 0.04, { bottom: true });
    const col = rng.pick(colors);
    glyph(b, rng, w / 2 + 0.3, -0.25 - h / 2, 0.05, w * 0.7, h * 0.7, col, 1.3);
    b.push(_m4.makeRotationY(Math.PI).setPosition(w + 0.6, 0, 0)); glyph(b, rng, w / 2 + 0.3, -0.25 - h / 2, 0.05, w * 0.7, h * 0.7, col, 1.3); b.pop();
    size = { w: w + 0.6, h: h + 0.5 };
  } else if (type === 'post') {
    const h = opts.height ?? 3.2, n = rng.int(1, 3);
    b.col(P.post, 0.7, 1); b.lathe(0, 0, 0, [[0.05, 0], [0.05, h]], 5);
    for (let i = 0; i < n; i++) {
      const y = h - 0.4 - i * 0.75, col = rng.pick(colors), kind = rng.int(0, 2);
      b.col(mul3(col, 0.75)).surf(SURF.GLOW, 0, 0.35);
      for (const s of [1, -1]) {
        const z = 0.06 * s;
        const tri = (p0, p1, p2) => (s > 0 ? b.tri(p0, p1, p2) : b.tri(p0, p2, p1));
        if (kind === 0) { for (let k = 0; k < 10; k++) { const a = TAU * k / 10, a2 = TAU * (k + 1) / 10; tri([0, y, z], [0.33 * Math.cos(a), y + 0.33 * Math.sin(a), z], [0.33 * Math.cos(a2), y + 0.33 * Math.sin(a2), z]); } }
        else if (kind === 1) tri([-0.36, y - 0.3, z], [0.36, y - 0.3, z], [0, y + 0.34, z]);
        else { tri([-0.45, y - 0.16, z], [0.2, y - 0.16, z], [0.2, y + 0.16, z]); tri([-0.45, y - 0.16, z], [0.2, y + 0.16, z], [-0.45, y + 0.16, z]); tri([0.2, y - 0.28, z], [0.55, y, z], [0.2, y + 0.28, z]); }
      }
      b.surf(SURF.PLAIN);
    }
    size = { w: 0.8, h };
  } else {                                                            // neon sign on a backing panel
    const s = opts.size ?? 2.2, col = lin(opts.color || rng.pick(colors.map((c) => c)));
    b.col(P.panel); b.box(-s * 1.2, -s * 1.15, -0.12, s * 1.2, s * 1.15, -0.02, { bottom: true });
    b.col(P.frame); b.beam([0, s * 1.15, -0.07], [0, s * 1.15 + 0.8, -0.07], 0.08, 0.08);
    neon = makeNeon({ rng, mats, shape: opts.shape || rng.pick(NEON_SHAPES), size: s, color: col, flicker: opts.flicker ?? rng.chance(0.35), radius: 0.055, position: [0, 0, 0.1] });
    size = { w: s * 2.4, h: s * 2.3 };
  }
  object.add(meshOf(b.toGeometry(), mats.facades, opts)); if (neon) object.add(neon.object);
  place(object, opts);
  return result(object, mats, { size, triangles: b.triangles + (neon ? neon.triangles : 0) });
}

// ---------- placement helper ----------
// Positions `object` so its local X axis runs from `from` to `to` (bridges, piers, walls of lights).
function spanPlace(object, from, to) {
  const a = vec3(from), c = vec3(to), dx = c.x - a.x, dz = c.z - a.z;
  object.position.set((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
  object.rotation.y = Math.atan2(-dz, dx);
  return Math.hypot(dx, dz);
}
function place(object, opts) {
  if (opts.position) object.position.copy(vec3(opts.position));
  if (opts.rotationY != null) object.rotation.y = opts.rotationY;
  return object;
}

// ---------- bridges ----------
// opts: { rng, type:'arch'|'suspension'|'rope', length, width, from, to, palette, mats, night, lamps,
//   arch: spans, height (deck above ground), camber, below, segments (per arch);  suspension: towerHeight, clearance;  rope: sag }
// Local frame: runs along X, centred, deck surface at y = 0 (plus camber). Returns deckY(x) too.
export function makeBridge(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'bridge'), type = opts.type || 'arch';
  const object = new THREE.Group();
  let L = opts.length ?? { arch: 70, suspension: 340, rope: 40 }[type];
  if (opts.from && opts.to) L = spanPlace(object, opts.from, opts.to); else place(object, opts);
  const b = new Builder(2048), halos = new Halos(), wires = new Wires();
  let deckY = () => 0, W, extra = {};
  if (type === 'arch') {
    const P = palette({ stone: '#9a9284', trim: '#b9b1a0', road: '#6a665e', lamp: WARM, metal: '#1d2226' }, opts.palette);
    W = opts.width ?? 8; const H = opts.height ?? 10, n = opts.spans ?? Math.max(1, Math.round(L / 16)), camber = opts.camber ?? L * 0.02, below = opts.below ?? 3;
    const span = L / n, pier = Math.min(span * 0.22, 3.2), a = (span - pier) / 2, rise = Math.min(a, H - 1.4), ys = -1.4 - rise;
    deckY = (x) => camber * (1 - Math.pow(2 * x / L, 2));
    const under = (x) => { // underside of the structure at x
      const k = Math.floor((x + L / 2) / span), xc = -L / 2 + (clamp(k, 0, n - 1) + 0.5) * span, dx = Math.abs(x - xc);
      return dx >= a ? -H - below : ys + rise * Math.sqrt(Math.max(0, 1 - (dx / a) * (dx / a)));
    };
    const xs = [];
    const as = Math.max(4, opts.segments ?? 12);
    for (let k = 0; k < n; k++) { const x0 = -L / 2 + k * span; xs.push(x0, x0 + pier / 2); for (let i = 1; i < as; i++) xs.push(x0 + pier / 2 + (span - pier) * i / as); xs.push(x0 + span - pier / 2); }
    xs.push(L / 2);
    const hw = W / 2;
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1]; if (xb - xa < 0.01) continue;
      const ta = deckY(xa), tb = deckY(xb), ua = under(xa + 0.002), ub = under(xb - 0.002);
      b.col(P.stone, 0.72, 1).surf(SURF.MASONRY, 0, 1.2);
      for (const s of [1, -1]) {
        const z = s * hw, q = [[xa, ua, z], [xb, ub, z], [xb, tb, z], [xa, ta, z]], cb = mul3(P.stone, 0.62), ct = P.stone;
        const i0 = b.v(q[0][0], q[0][1], z, 0, 0, s, cb[0], cb[1], cb[2], xa, ua), i1 = b.v(q[1][0], q[1][1], z, 0, 0, s, cb[0], cb[1], cb[2], xb, ub);
        const i2 = b.v(q[2][0], q[2][1], z, 0, 0, s, ct[0], ct[1], ct[2], xb, tb), i3 = b.v(q[3][0], q[3][1], z, 0, 0, s, ct[0], ct[1], ct[2], xa, ta);
        if (s > 0) b.quad4(i0, i1, i2, i3); else b.quad4(i1, i0, i3, i2);
      }
      // soffit / pier faces
      b.col(mul3(P.stone, 0.6), 1, 1);
      if (Math.abs(ua - ub) < 30) b.quad([xa, ua, -hw], [xb, ub, -hw], [xb, ub, hw], [xa, ua, hw], [xa, 0, xb, W]);
      // deck
      b.col(P.road, 1, 1).surf(SURF.MASONRY, 0, 0.6); b.quad([xa, ta, hw], [xb, tb, hw], [xb, tb, -hw], [xa, ta, -hw], [xa, 0, xb, W]);
    }
    // pier end faces
    b.col(P.stone, 0.62, 0.8).surf(SURF.MASONRY, 0, 1.2);
    for (let k = 0; k <= n; k++) {
      const xc = -L / 2 + k * span;
      for (const s of [-1, 1]) { const x = xc + s * pier / 2; if (x < -L / 2 - 0.01 || x > L / 2 + 0.01) continue; const yt = ys; if (s > 0) b.quad([x, -H - below, hw], [x, -H - below, -hw], [x, yt, -hw], [x, yt, hw], [0, -H, W, yt]); else b.quad([x, -H - below, -hw], [x, -H - below, hw], [x, yt, hw], [x, yt, -hw], [0, -H, W, yt]); }
    }
    for (const s of [-1, 1]) { const x = s * L / 2; b.col(P.stone, 0.62, 1); if (s > 0) b.quad([x, -H - below, hw], [x, -H - below, -hw], [x, deckY(x), -hw], [x, deckY(x), hw], [0, -H, W, 0]); else b.quad([x, -H - below, -hw], [x, -H - below, hw], [x, deckY(x), hw], [x, deckY(x), -hw], [0, -H, W, 0]); }
    // parapets and string course
    const seg = Math.max(8, Math.round(L / 6));
    for (let i = 0; i < seg; i++) {
      const xa = -L / 2 + L * i / seg, xb = xa + L / seg;
      for (const s of [-1, 1]) {
        b.col(P.trim, 0.9, 1).surf(SURF.MASONRY, 0, 0.8); b.beam([xa, deckY(xa) + 0.5, s * (hw - 0.2)], [xb, deckY(xb) + 0.5, s * (hw - 0.2)], 0.4, 1.0);
        b.col(P.trim).surf(SURF.PLAIN); b.beam([xa, deckY(xa) - 0.2, s * (hw + 0.06)], [xb, deckY(xb) - 0.2, s * (hw + 0.06)], 0.14, 0.3);
      }
    }
    if (opts.lamps !== false) for (let k = 0; k <= n; k++) {
      const x = clamp(-L / 2 + k * span, -L / 2 + 0.5, L / 2 - 0.5), y = deckY(x) + 1;
      for (const s of [-1, 1]) {
        const z = s * (hw - 0.2);
        b.col(P.metal).surf(SURF.PLAIN); b.lathe(x, y, z, [[0.12, 0], [0.05, 0.2], [0.05, 1.7], [0.16, 1.8]], 5);
        glowBox(b, x, y + 2.02, z, 0.34, 0.44, 0.34, P.lamp, 2.2);
        halos.add(x, y + 2.02, z, 1.7, mul3(P.lamp, 1.1)); halos.add(x - 0, deckY(x) + 0.05, z - s * 1.2, 5.5, mul3(P.lamp, 0.26), 1);
      }
    }
    extra = { spans: n, height: H };
  } else if (type === 'suspension') {
    const P = palette({ tower: '#b5412a', deck: '#7a2f22', road: '#3a3c40', cable: '#a03a26', lamp: '#ffe2b0', beacon: [1, 0.1, 0.06] }, opts.palette);
    W = opts.width ?? 18; const TH = opts.towerHeight ?? L * 0.2, clr = opts.clearance ?? 24, tx = L * 0.27, hw = W / 2, cz = hw + 1.2;
    const camber = opts.camber ?? L * 0.012; deckY = (x) => camber * (1 - Math.pow(2 * x / L, 2));
    // deck: road, plate girders, and a Warren stiffening truss underneath
    const seg = Math.max(16, Math.round(L / 12)), trD = opts.truss === false ? 0 : 4.4;
    for (let i = 0; i < seg; i++) {
      const xa = -L / 2 + L * i / seg, xb = xa + L / seg, ya = deckY(xa), yb = deckY(xb);
      b.col(P.road, 1, 1).surf(SURF.ROAD, 0, 4); b.quad([xa, ya, -hw], [xa, ya, hw], [xb, yb, hw], [xb, yb, -hw], [0, xa, 1, xb]);
      b.col(P.deck, 0.7, 1).surf(SURF.STEEL).flood((opts.flood ?? 0.36) * 0.75, ya - 2.2, 6);   // the girders catch the road lamps at night
      for (const s of [-1, 1]) b.beam([xa, ya - 0.9, s * (hw + 0.3)], [xb, yb - 0.9, s * (hw + 0.3)], 0.6, 2.6);
      b.flood(0);
      b.col(mul3(P.deck, 0.5)).surf(SURF.PLAIN); b.quad([xa, ya - 2.1, -hw], [xb, yb - 2.1, -hw], [xb, yb - 2.1, hw], [xa, ya - 2.1, hw]);
      if (trD > 0) {
        b.col(mul3(P.deck, 0.8), 1, 1);
        for (const s of [-1, 1]) {
          const z = s * (hw - 0.4);
          b.beam([xa, ya - 2.2 - trD, z], [xb, yb - 2.2 - trD, z], 0.55, 0.55);
          if (i % 2) flatBar(b, [xa, ya - 2.2 - trD, z], [xb, yb - 2.2, z], 0.5, [0, 0, 1]); else flatBar(b, [xa, ya - 2.2, z], [xb, yb - 2.2 - trD, z], 0.5, [0, 0, 1]);
        }
        flatBar(b, [xa, ya - 2.2 - trD, -hw + 0.4], [xa, ya - 2.2 - trD, hw - 0.4], 0.5, [0, 1, 0]);
        if (i % 2 === 0) flatBar(b, [xa, ya - 2.2 - trD, -hw + 0.4], [xb, yb - 2.2 - trD, hw - 0.4], 0.4, [0, 1, 0]);
      }
    }
    // towers: riveted steel legs stepping in twice, tied by portal struts and X-bracing
    for (const sx of [-1, 1]) {
      const x = sx * tx, y0 = -clr - 6, yd = deckY(x);
      b.flood(opts.flood ?? 0.36, yd, TH * 0.8);
      for (const sz of [-1, 1]) {
        const z = sz * cz, st = [[y0, yd + TH * 0.34, 4.2, 5.2], [yd + TH * 0.34, yd + TH * 0.68, 3.5, 4.3], [yd + TH * 0.68, yd + TH, 2.8, 3.4]];
        for (const [ya, yb, wx, wz] of st) { b.col(P.tower, ya < yd ? 0.6 : 0.85, 1).surf(SURF.STEEL); b.frustum(x, z, wx, wz, wx * 0.94, wz * 0.94, ya, yb, { top: false }); }
        b.col(mul3(P.tower, 1.12), 1, 1).surf(SURF.PLAIN);
        for (const [ya, , wx, wz] of st.slice(1)) b.cbox(x, ya - 0.3, z, wx + 1.4, 0.6, wz + 1.6, { bottom: true });
        b.cbox(x, yd + TH - 0.1, z, 3.7, 0.8, 4.4, { bottom: true });
        glowBox(b, x, yd + TH + 1.2, z, 0.9, 0.9, 0.9, P.beacon, 3, sx > 0 ? 0.3 : 0.8); halos.add(x, yd + TH + 1.2, z, 3.2, [1.2, 0.12, 0.08]);
      }
      b.col(P.tower, 0.85, 1).surf(SURF.STEEL);
      for (const f of [0.34, 0.68, 0.96]) b.beam([x, yd + TH * f, -cz], [x, yd + TH * f, cz], 2.7 - f * 0.7, TH * 0.045 * (f > 0.9 ? 1.5 : 1));
      b.beam([x, yd - 3.5, -cz], [x, yd - 3.5, cz], 3.4, 3);
      if (opts.bracing !== false) {
        const zi = cz - 1.5, e = TH * 0.035, bw = Math.max(0.6, TH * 0.012);
        b.col(mul3(P.tower, 0.9), 1, 1);
        for (const [ya, yb] of [[y0 + clr * 0.35 + 1, yd - 5.5], [yd + 7.5, yd + TH * 0.34 - e], [yd + TH * 0.34 + e, yd + TH * 0.68 - e], [yd + TH * 0.68 + e, yd + TH * 0.96 - e * 1.4]]) {
          if (yb - ya < 5) continue;
          b.beam([x, ya, -zi], [x, yb, zi], bw, bw); b.beam([x, ya, zi], [x, yb, -zi], bw, bw);
        }
      }
      b.col(mul3(P.tower, 0.8), 0.7, 1).surf(SURF.MASONRY, 0, 2); b.cbox(x, y0 - 2, 0, 9, clr * 0.35 + 2, W + 8, { m: 0.5 });
      b.surf(SURF.PLAIN);
    }
    b.flood(0);
    // main cables, side cables, hangers, cable lights
    const sagTo = 3.5, cableY = (x) => {
      const ax = Math.abs(x);
      if (ax <= tx) { const t = ax / tx; return lerp(deckY(0) + sagTo, deckY(tx) + TH, t * t); }
      const t = (ax - tx) / (L / 2 - tx); return lerp(deckY(tx) + TH, deckY(L / 2) + 1.2, 1 - (1 - t) * (1 - t) * 0.35 - t * 0.65);
    };
    for (const sz of [-1, 1]) {
      const z = sz * cz;
      b.col(P.cable, 1, 1).surf(SURF.PLAIN);
      for (const [xa, xb, N] of [[-L / 2, -tx, 10], [-tx, tx, 36], [tx, L / 2, 10]]) { const pts = []; for (let i = 0; i <= N; i++) { const x = lerp(xa, xb, i / N); pts.push([x, cableY(x), z]); } b.tube(pts, 0.42, 5); }
      const hs = opts.hangerSpacing ?? 9;
      for (let x = -L / 2 + hs; x < L / 2 - hs / 2; x += hs) {
        if (Math.abs(Math.abs(x) - tx) < 3) continue;
        const cy = cableY(x); if (cy - deckY(x) > 1.5) wires.line([[x, cy, z], [x, deckY(x) + 0.4, z]], 0.07, mul3(P.cable, 0.9));
        if (opts.lamps !== false) halos.add(x, cy + 0.6, z, 1.5, mul3(P.lamp, 1.0), 0, 0.15);
      }
    }
    if (opts.lamps !== false) for (let x = -L / 2 + 12; x < L / 2 - 6; x += 24) for (const s of [-1, 1]) {
      const y = deckY(x), z = s * (hw - 0.4);
      b.col(P.deck).surf(SURF.PLAIN); b.beam([x, y, z], [x, y + 6.5, z], 0.18, 0.18); b.beam([x, y + 6.5, z], [x, y + 6.7, z - s * 1.8], 0.12, 0.12);
      glowBox(b, x, y + 6.6, z - s * 1.8, 0.6, 0.14, 0.3, P.lamp, 2.4); halos.add(x, y + 6.55, z - s * 1.8, 2.3, mul3(P.lamp, 1)); halos.add(x, y + 0.06, z - s * 3.2, 12, mul3(P.lamp, 0.22), 1);
    }
    for (const s of [-1, 1]) { b.col(P.deck).surf(SURF.PLAIN); for (let i = 0; i < seg; i++) { const xa = -L / 2 + L * i / seg, xb = xa + L / seg; b.beam([xa, deckY(xa) + 1.2, s * (hw + 0.3)], [xb, deckY(xb) + 1.2, s * (hw + 0.3)], 0.1, 0.1); } }
    extra = { towerX: tx, towerHeight: TH, cableY };
  } else {                                                            // rope bridge
    const P = palette({ wood: '#6a4c32', rope: '#8a6f4a', post: '#4a3524' }, opts.palette);
    W = opts.width ?? 1.6; const sag = opts.sag ?? L * 0.07, hw = W / 2;
    deckY = (x) => -sag * (1 - Math.pow(2 * x / L, 2));
    const seg = Math.max(12, Math.round(L / 1.6));
    for (let i = 0; i < seg; i++) {
      const xa = -L / 2 + L * i / seg, xb = xa + L / seg, ya = deckY(xa), yb = deckY(xb);
      b.col(P.wood, 1, 1).surf(SURF.PLANKS);
      // planks run across: uv.x along the bridge
      const q = (y0, y1, flip) => { const A = [xa, y0, hw], B = [xb, y1, hw], C = [xb, y1, -hw], D = [xa, y0, -hw]; if (flip) b.quad(D, C, B, A, [xa * 1.1, 0, xb * 1.1, W]); else b.quad(A, B, C, D, [xa * 1.1, 0, xb * 1.1, W]); };
      q(ya, yb, false); b.col(mul3(P.wood, 0.5)); q(ya - 0.07, yb - 0.07, true);
    }
    for (const s of [-1, 1]) {
      const low = [], high = [];
      for (let i = 0; i <= seg; i++) { const x = -L / 2 + L * i / seg; low.push([x, deckY(x) - 0.02, s * hw]); high.push([x, deckY(x) * 0.82 + 1.15, s * (hw + 0.12)]); }
      wires.line(low, 0.035, P.rope); wires.line(high, 0.035, P.rope);
      for (let i = 1; i < seg; i += 1) wires.line([low[i], high[i]], 0.016, P.rope);
      for (const sx of [-1, 1]) {
        const x = sx * (L / 2 + 0.3);
        b.col(P.post, 0.7, 1).surf(SURF.PLAIN); b.lathe(x, -1.5, s * (hw + 0.15), [[0.17, 0], [0.14, 3.0], [0, 3.05]], 6);
      }
    }
    for (const sx of [-1, 1]) { b.col(P.post); b.beam([sx * (L / 2 + 0.3), 1.2, -hw - 0.15], [sx * (L / 2 + 0.3), 1.2, hw + 0.15], 0.12, 0.12); }
  }
  object.add(new THREE.Mesh(b.toGeometry(), mats.facades));
  if (halos.n) object.add(halos.mesh(mats.halo));
  if (wires.n) object.add(wires.mesh(mats.wire));
  return result(object, mats, Object.assign({ length: L, width: W, deckY, triangles: b.triangles + halos.n * 2 + wires.i.length / 3 }, extra));
}

// ---------- arches and gates ----------
// Wall face with an arched opening, tessellated in slices. Face lies at z, normal sign s (+1 = +Z).
function archFace(b, z, s, wt, ht, w, h, n = 12) {
  const r = w / 2, ys = h - r;
  const Q = (x0, y0a, y0b, x1, y1a, y1b) => { // quad between x0 and x1, bottoms y0a/y1a, tops y0b/y1b
    const A = [x0, y0a, z], B = [x1, y1a, z], C = [x1, y1b, z], D = [x0, y0b, z];
    const i0 = b.v(A[0], A[1], z, 0, 0, s, ...mul3(b.c, lerp(b.g0, b.g1, A[1] / ht)), A[0], A[1]), i1 = b.v(B[0], B[1], z, 0, 0, s, ...mul3(b.c, lerp(b.g0, b.g1, B[1] / ht)), B[0], B[1]);
    const i2 = b.v(C[0], C[1], z, 0, 0, s, ...mul3(b.c, lerp(b.g0, b.g1, C[1] / ht)), C[0], C[1]), i3 = b.v(D[0], D[1], z, 0, 0, s, ...mul3(b.c, lerp(b.g0, b.g1, D[1] / ht)), D[0], D[1]);
    if (s > 0) b.quad4(i0, i1, i2, i3); else b.quad4(i1, i0, i3, i2);
  };
  Q(-wt / 2, 0, ht, -r, 0, ht); Q(r, 0, ht, wt / 2, 0, ht);
  for (let i = 0; i < n; i++) {
    const x0 = -r + w * i / n, x1 = -r + w * (i + 1) / n;
    Q(x0, ys + Math.sqrt(Math.max(0, r * r - x0 * x0)), ht, x1, ys + Math.sqrt(Math.max(0, r * r - x1 * x1)), ht);
  }
}
// Inside of an arched passage from z0 to z1.
function archSoffit(b, z0, z1, w, h, n = 12) {
  const r = w / 2, ys = h - r;
  b.quad([-r, 0, z1], [-r, 0, z0], [-r, ys, z0], [-r, ys, z1], [0, 0, z1 - z0, ys]);
  b.quad([r, 0, z0], [r, 0, z1], [r, ys, z1], [r, ys, z0], [0, 0, z1 - z0, ys]);
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - Math.PI * i / n, a1 = Math.PI - Math.PI * (i + 1) / n;
    const p0 = [r * Math.cos(a0), ys + r * Math.sin(a0)], p1 = [r * Math.cos(a1), ys + r * Math.sin(a1)];
    b.quad([p0[0], p0[1], z1], [p0[0], p0[1], z0], [p1[0], p1[1], z0], [p1[0], p1[1], z1], [0, i * r * Math.PI / n, z1 - z0, (i + 1) * r * Math.PI / n]);
  }
}

// opts: { rng, type:'torii'|'triumphal'|'ruin'|'moon', width, height (of the opening), depth, palette, mats, night, position, rotationY }
// The opening is centred on local x = 0, faces +/-Z, ground at y = 0. Returns { opening:{ width, height } }.
export function makeArch(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'arch'), type = opts.type || 'triumphal';
  const b = new Builder(1024), halos = new Halos();
  const w = opts.width ?? { torii: 9, triumphal: 9, ruin: 8, moon: 8 }[type], h = opts.height ?? { torii: 9, triumphal: 13, ruin: 11, moon: 8 }[type];
  let size = {};
  b.flood(opts.flood ?? { torii: 0.26, triumphal: 0.85, ruin: 0.5, moon: 0.5 }[type], 0, h * 0.9);
  if (type === 'torii') {
    const P = palette({ wood: '#b8321c', cap: '#1a1513', base: '#77726a', lamp: '#ffb866', gold: '#d8a83a' }, opts.palette);
    const r = w * 0.05, lean = 0.035, px = w / 2 + r, topY = h + r * 3.4, ny = h * 0.8;
    for (const s of [-1, 1]) {
      const fx = s * (px + lean * h), pts = [[fx, 0, 0], [s * px, h + r * 1.6, 0]];
      b.col(P.wood, 0.74, 1).surf(SURF.LACQUER); b.tube(pts, (t) => r * (1.08 - 0.16 * t), 12);
      b.col(P.cap, 1, 1); b.lathe(fx - s * lean * h * 0.07, 0, 0, [[r * 1.2, h * 0.035], [r * 1.17, h * 0.115], [r * 1.05, h * 0.12]], 12);          // black footing band
      b.lathe(s * px, h + r * 0.75, 0, [[r * 0.95, 0], [r * 1.5, r * 0.3], [r * 1.5, r * 0.7], [r * 0.95, r * 0.78]], 12);                           // cap ring under the lintel
      b.col(P.base, 0.75, 1).surf(SURF.MASONRY, 0, 1.3); b.lathe(fx, -0.4, 0, [[r * 2.4, 0], [r * 2.2, 0.4 + h * 0.025], [r * 1.3, 0.4 + h * 0.04]], 12, { m: 1 });   // stone plinth
      b.col(P.cap, 1, 1).surf(SURF.LACQUER);                                                                                                       // wedges locking the tie beam
      for (const k of [-1, 1]) b.cbox(s * px + k * r * 1.25, ny + r * 1.05, 0, r * 0.5, r * 0.36, r * 1.7, { bottom: true });
      if (opts.lamps !== false) {                                                                                                                  // a framed paper lantern hangs from each end of the tie beam
        const ls = clamp(r * 1.9, 0.45, 2.4), lx = s * (px + r * 2.35), ly = ny - r * 1.05 - ls * 1.75;
        b.col(P.cap).surf(SURF.PLAIN); b.beam([lx, ny - r, 0], [lx, ly + ls * 1.1, 0], ls * 0.05, ls * 0.05);
        boxLantern(b, lx, ly, 0, ls, P.lamp, P.cap, 1.7); halos.add(lx, ly, 0, ls * 3.4, mul3(P.lamp, 0.8));
      }
    }
    // nuki (tie beam) and the framed tablet between the beams
    b.col(P.wood, 0.9, 1).surf(SURF.LACQUER); b.beam([-px - r * 3.2, ny, 0], [px + r * 3.2, ny, 0], r * 1.3, r * 2.1);
    const ty0 = ny + r * 1.05, ty1 = h + r * 1.15, tw = r * 2.5;
    b.col(P.cap, 1, 1); b.box(-tw / 2, ty0, -r * 0.5, tw / 2, ty1, r * 0.5, {});
    for (const s of [-1, 1]) reliefPanel(b, 0, (ty0 + ty1) / 2, s * r * 0.5, tw * 0.62, (ty1 - ty0) * 0.66, s, P.gold, mul3(P.gold, 0.5), 1, Math.max(2, Math.round((ty1 - ty0) * 0.66 / (tw * 0.62))));
    // shimagi + kasagi: upswept top lintels
    const N = 10, half = px + r * 6.5, curve = (x) => Math.pow(Math.abs(x) / half, 2.4) * r * 3.2;
    for (let i = 0; i < N; i++) {
      const xa = -half + 2 * half * i / N, xb = xa + 2 * half / N;
      b.col(P.wood, 1, 1).surf(SURF.LACQUER); b.beam([xa * 0.96, h + r * 2.1 + curve(xa), 0], [xb * 0.96, h + r * 2.1 + curve(xb), 0], r * 2.1, r * 1.9);
      b.col(P.cap, 1, 1); b.beam([xa, topY + curve(xa) * 1.15, 0], [xb, topY + curve(xb) * 1.15, 0], r * 3.1, r * 1.1);
      b.col(mul3(P.cap, 2.2), 1, 1); b.beam([xa * 1.01, topY + r * 0.62 + curve(xa) * 1.15, 0], [xb * 1.01, topY + r * 0.62 + curve(xb) * 1.15, 0], r * 3.5, r * 0.2);   // roof board
    }
    b.surf(SURF.PLAIN);
    size = { w: half * 2, h: topY + r * 4 };
  } else if (type === 'triumphal') {
    const P = palette({ stone: '#cfc4ad', trim: '#e6dcc6', dark: '#8f8674', accent: '#d8a83a', fire: '#ff9a3a' }, opts.palette);
    const wt = opts.totalWidth ?? w * 2.25, d = opts.depth ?? w * 0.75, hm = h * 1.28, ha = h * 0.36, z1 = d / 2;
    b.col(P.stone, 0.72, 1).surf(SURF.MASONRY, 0, 1.4);
    archFace(b, z1, 1, wt, hm, w, h); archFace(b, -z1, -1, wt, hm, w, h);
    b.wall(wt / 2, z1, wt / 2, -z1, 0, hm, { m: 1 }); b.wall(-wt / 2, -z1, -wt / 2, z1, 0, hm, { m: 1 });
    b.col(mul3(P.stone, 0.7), 0.8, 1); archSoffit(b, -z1, z1, w, h);
    // cornice, attic, crown
    b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.box(-wt / 2 - 0.5, hm, -z1 - 0.5, wt / 2 + 0.5, hm + 0.55, z1 + 0.5, { bottom: true });
    b.col(P.stone, 0.9, 1).surf(SURF.MASONRY, 0, 1.4); b.box(-wt / 2 + 0.3, hm + 0.55, -z1 + 0.3, wt / 2 - 0.3, hm + 0.55 + ha, z1 - 0.3, { m: 1 });
    b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.box(-wt / 2, hm + 0.55 + ha, -z1, wt / 2, hm + 0.95 + ha, z1, { bottom: true });
    const topY = hm + 0.95 + ha;
    for (const s of [-1, 1]) {                                        // engaged columns, panels, keystone
      const z = s * z1;
      const cr = Math.max(0.42, hm * 0.028);
      for (const x of [-wt / 2 + 1.1, -w / 2 - 1.0, w / 2 + 1.0, wt / 2 - 1.1]) { b.col(P.trim, 0.8, 1).surf(SURF.PLAIN); b.cbox(x, 0, z + s * 0.55, cr * 3.4, hm * 0.14, cr * 3); column(b, x, hm * 0.14, z + s * 0.55, cr, hm * 0.86 - 0.02, 10); }
      // carved work: the attic inscription, a frieze under the cornice, a relief over each side bay; all set in raised frames
      const aw = wt * 0.46, ah = ha * 0.62, fh = Math.min(1.2, hm * 0.06), sw = (wt - w) / 2 - cr * 7, sh2 = hm * 0.2;
      reliefPanel(b, 0, hm + 0.55 + ha * 0.5, z - s * 0.3, aw, ah, s, P.trim, P.dark, Math.max(3, Math.round(aw / (ah / 2))), 2);
      b.col(mul3(P.stone, 0.92), 1, 1).surf(SURF.RELIEF, 0, 0.9); panel(b, 0, hm - fh * 0.5 - 0.12, z + s * 0.04, wt - 0.1, fh, s > 0 ? 0 : Math.PI, [0, 0, Math.round(wt / fh), 1]);
      b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.box(-wt / 2 - 0.12, hm - fh - 0.34, Math.min(z, z + s * 0.14), wt / 2 + 0.12, hm - fh - 0.12, Math.max(z, z + s * 0.14), { bottom: true });
      if (sw > 0.8) for (const sx of [-1, 1]) reliefPanel(b, sx * (w / 2 + (wt - w) / 4), hm * 0.7, z, sw, sh2, s, P.trim, mul3(P.dark, 1.15), Math.max(1, Math.round(sw / (sh2 / 2))), 2);
      b.col(P.trim, 0.9, 1).surf(SURF.PLAIN); b.cbox(0, h - 0.2, z + s * 0.2, w * 0.13, h * 0.11, 0.5, { bottom: true });
    }
    for (const sx of [-1, 1]) { finial(b, sx * (wt / 2 - 0.8), topY, 0, 0.5, P.accent); b.col(P.dark).surf(SURF.PLAIN); b.lathe(sx * wt * 0.24, topY, 0, [[0.6, 0], [0.3, 0.3], [0.3, 0.9], [0.85, 1.4], [0.7, 1.4]], 6); glowBox(b, sx * wt * 0.24, topY + 1.7, 0, 0.9, 0.6, 0.9, P.fire, 2.4); halos.add(sx * wt * 0.24, topY + 1.8, 0, 3.4, mul3(P.fire, 0.9)); }
    size = { w: wt + 1, h: topY + 1.4 };
  } else if (type === 'moon') {
    const P = palette({ wall: '#e6dfd0', roof: '#2f3a3d', trim: '#8a8478', base: '#6f6a60' }, opts.palette);
    const R = w / 2, cy = Math.max(R + 0.4, h - R), wt = opts.totalWidth ?? w * 1.9, ht = cy + R + 1.6, d = opts.depth ?? 0.9, n = 28;
    const edge = (a) => { // ray from the centre to the wall outline
      const c = Math.cos(a), s = Math.sin(a), tx = c !== 0 ? (wt / 2) / Math.abs(c) : 1e9, ty = s > 0 ? (ht - cy) / s : s < 0 ? cy / -s : 1e9, t = Math.min(tx, ty);
      return [c * t, cy + s * t, tx <= ty ? (c > 0 ? 0 : 2) : (s > 0 ? 1 : 3)];
    };
    const corner = (e0, e1) => { const m = Math.min(e0, e1), M = Math.max(e0, e1); return m === 0 && M === 1 ? [wt / 2, ht] : m === 1 && M === 2 ? [-wt / 2, ht] : m === 2 && M === 3 ? [-wt / 2, 0] : [wt / 2, 0]; };
    for (const s of [1, -1]) {
      const z = s * d / 2;
      for (let i = 0; i < n; i++) {
        const a0 = TAU * i / n - Math.PI / 4, a1 = TAU * (i + 1) / n - Math.PI / 4, i0 = [R * Math.cos(a0), cy + R * Math.sin(a0)], i1 = [R * Math.cos(a1), cy + R * Math.sin(a1)], o0 = edge(a0), o1 = edge(a1);
        const c = P.wall, vv = (p) => b.v(p[0], Math.max(0, p[1]), z, 0, 0, s, c[0] * (0.8 + 0.2 * p[1] / ht), c[1] * (0.8 + 0.2 * p[1] / ht), c[2] * (0.8 + 0.2 * p[1] / ht), p[0], p[1]);
        const A = vv(i0), B = vv(o0), C = vv(o1), D = vv(i1);
        if (s > 0) b.quad4(A, B, C, D); else b.quad4(B, A, D, C);
        if (o0[2] !== o1[2]) { const K = vv(corner(o0[2], o1[2])); if (s > 0) b.tri3(B, K, C); else b.tri3(K, B, C); }
      }
    }
    b.col(P.trim, 1, 1).surf(SURF.PLAIN);
    for (let i = 0; i < n; i++) {                                     // ring lining
      const a0 = TAU * i / n, a1 = TAU * (i + 1) / n, p0 = [R * Math.cos(a0), cy + R * Math.sin(a0)], p1 = [R * Math.cos(a1), cy + R * Math.sin(a1)];
      if (p0[1] < 0 && p1[1] < 0) continue;
      b.quad([p0[0], Math.max(0, p0[1]), d / 2 + 0.08], [p0[0], Math.max(0, p0[1]), -d / 2 - 0.08], [p1[0], Math.max(0, p1[1]), -d / 2 - 0.08], [p1[0], Math.max(0, p1[1]), d / 2 + 0.08]);
      const q0 = [p0[0] * 1.07, cy + (p0[1] - cy) * 1.07], q1 = [p1[0] * 1.07, cy + (p1[1] - cy) * 1.07];
      for (const s of [1, -1]) { const z = s * (d / 2 + 0.08); if (s > 0) b.quad([p0[0], Math.max(0, p0[1]), z], [q0[0], Math.max(0, q0[1]), z], [q1[0], Math.max(0, q1[1]), z], [p1[0], Math.max(0, p1[1]), z]); else b.quad([q0[0], Math.max(0, q0[1]), z], [p0[0], Math.max(0, p0[1]), z], [p1[0], Math.max(0, p1[1]), z], [q1[0], Math.max(0, q1[1]), z]); }
    }
    b.col(P.wall, 0.8, 1); b.wall(wt / 2, d / 2, wt / 2, -d / 2, 0, ht); b.wall(-wt / 2, -d / 2, -wt / 2, d / 2, 0, ht);
    b.col(P.roof, 1, 1); b.gable(-wt / 2 - 0.3, -d / 2 - 0.5, wt / 2 + 0.3, d / 2 + 0.5, ht, 0.9, { alongX: true, overhang: 0.3, wallColor: P.wall });
    size = { w: wt, h: ht + 0.9 };
  } else {                                                            // ruined arch
    const P = palette({ stone: '#a39a88', dark: '#7d7566' }, opts.palette);
    const r = w / 2, ys = h - r, pw = w * 0.34, d = opts.depth ?? w * 0.3, keep = opts.keep ?? rng.range(0.45, 0.8);
    b.col(P.stone, 0.7, 1).surf(SURF.MASONRY, 0, 1.5);
    const hL = ys + r * rng.range(0.9, 1.6), hR = ys * rng.range(0.55, 0.95);
    for (const [s, ph] of [[-1, hL], [1, hR]]) {
      const x0 = s < 0 ? -r - pw : r, steps = 3;
      for (let k = 0; k < steps; k++) { const xa = x0 + pw * k / steps, xb = x0 + pw * (k + 1) / steps, top = ph * (1 - rng.range(0, 0.16)) - (k === (s < 0 ? steps - 1 : 0) ? Math.max(0, ph - ys) : 0); b.box(xa, 0, -d / 2, xb, Math.max(1, top), d / 2, { m: 1, capStyle: SURF.MASONRY, capM: 1 }); }
    }
    // surviving voussoirs springing from the left pier
    const nv = 11, kept = Math.round(nv * keep), th = w * 0.13;
    for (let i = 0; i < kept; i++) {
      const a0 = Math.PI - Math.PI * i / nv, a1 = Math.PI - Math.PI * (i + 1) / nv - 0.01, ro = r + th * rng.range(0.9, 1.15);
      const A = [r * Math.cos(a0), ys + r * Math.sin(a0)], B = [r * Math.cos(a1), ys + r * Math.sin(a1)], C = [ro * Math.cos(a1), ys + ro * Math.sin(a1)], D = [ro * Math.cos(a0), ys + ro * Math.sin(a0)];
      b.col(vary(P.stone, rng, 0.1), 0.85, 1);
      const zf = d / 2 * rng.range(0.9, 1), zb = -d / 2;
      b.quad([A[0], A[1], zf], [B[0], B[1], zf], [C[0], C[1], zf], [D[0], D[1], zf], [0, 0, 1, 1]);
      b.quad([B[0], B[1], zb], [A[0], A[1], zb], [D[0], D[1], zb], [C[0], C[1], zb], [0, 0, 1, 1]);
      b.quad([A[0], A[1], zb], [B[0], B[1], zb], [B[0], B[1], zf], [A[0], A[1], zf]); b.quad([D[0], D[1], zf], [C[0], C[1], zf], [C[0], C[1], zb], [D[0], D[1], zb]);
      if (i === kept - 1) b.quad([B[0], B[1], zb], [C[0], C[1], zb], [C[0], C[1], zf], [B[0], B[1], zf]);
    }
    // fallen blocks
    for (let i = 0; i < 9; i++) { b.tr(rng.range(-0.2, 1.3) * w, 0, rng.range(-1, 1) * w * 0.6, rng() * TAU); b.col(vary(P.dark, rng, 0.12), 0.7, 1); const s = rng.range(0.5, 1.3); b.box(-s, -0.2, -s * 0.6, s, s * rng.range(0.5, 1.1), s * 0.6, { m: 1, capStyle: SURF.MASONRY, capM: 1 }); b.pop(); }
    size = { w: w + pw * 2, h: hL };
  }
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo));
  place(object, opts);
  return result(object, mats, { opening: { width: w, height: h }, size, triangles: b.triangles + halos.n * 2 });
}

// ---------- colonnades, stairs, walls, ruins ----------
const STONE = { stone: '#cdc3ae', trim: '#e2d9c4', dark: '#8f8674', accent: '#d8a83a' };

// opts: { rng, count, spacing, height, radius, rows (1|2), rowGap, entablature, arc, arcRadius, ruin (0..1),
//         along:{ path, offset, spacing, from, to, heightAt }, palette, mats, night, position, rotationY }
export function makeColonnade(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'colonnade'), P = palette(STONE, opts.palette);
  const H = opts.height ?? 9, r = opts.radius ?? H * 0.055, ruin = opts.ruin ?? 0, seg = opts.segments ?? 12;
  const b = new Builder(2048).flood(opts.flood ?? 0.8, 0, H * 0.9), rows = [];
  if (opts.along) {
    const a = opts.along, sm = sampler(a.path || a.curve || a.points), sp = a.spacing ?? opts.spacing ?? 7, off = a.offset ?? 8, tp = new THREE.Vector3(), tt = new THREE.Vector3();
    const L = [], R = [];
    for (let d = a.from ?? 0; d <= (a.to ?? sm.length) + 0.01; d += sp) {
      sm.at(d, tp); sm.tan(d, tt);
      for (const [s, arr] of [[1, L], [-1, R]]) { const x = tp.x + tt.z * off * s, z = tp.z - tt.x * off * s; arr.push([x, a.heightAt ? a.heightAt(x, z) : (a.y ?? 0), z]); }
    }
    rows.push(L, R);
  } else if (opts.arc) {
    const n = opts.count ?? 12, R = opts.arcRadius ?? 20, row = [];
    for (let i = 0; i < n; i++) { const a = Math.PI / 2 - opts.arc / 2 + opts.arc * (opts.arc >= TAU - 0.01 ? i / n : i / (n - 1)); row.push([R * Math.cos(a), 0, R * Math.sin(a)]); }
    if (opts.arc >= TAU - 0.01) row.push(row[0]);
    rows.push(row);
  } else {
    const n = opts.count ?? 8, sp = opts.spacing ?? H * 0.5, nr = opts.rows ?? 1, gap = opts.rowGap ?? 8;
    for (let k = 0; k < nr; k++) { const row = []; for (let i = 0; i < n; i++) row.push([(i - (n - 1) / 2) * sp, 0, nr > 1 ? (k - (nr - 1) / 2) * gap : 0]); rows.push(row); }
  }
  let count = 0;
  for (const row of rows) {
    const hs = row.map(() => (ruin > 0 && rng.chance(ruin) ? (rng.chance(0.3) ? 0 : rng.range(0.15, 0.8)) : 1));
    if (row.length > 1 && row[0] === row[row.length - 1]) hs[hs.length - 1] = hs[0];
    row.forEach((p, i) => {
      if (i === row.length - 1 && row[0] === p && i > 0) return;
      const f = hs[i]; if (f <= 0) return; count++;
      b.col(vary(P.stone, rng, 0.04), 0.8, 1).surf(SURF.PLAIN);
      b.cbox(p[0], p[1] - 0.6, p[2], r * 3.1, 0.6 + H * 0.04, r * 3.1);
      if (f >= 1) column(b, p[0], p[1] + H * 0.04, p[2], r, H * 0.96, seg);
      else { const hh = H * f; b.lathe(p[0], p[1] + H * 0.04, p[2], [[r * 1.32, 0], [r * 1.32, 0.12], [r * 1.02, 0.2], [r * lerp(1, 0.84, f), hh], [0, hh + r * rng.range(-0.2, 0.5)]], seg); }
    });
    if (opts.entablature !== false) for (let i = 0; i < row.length - 1; i++) {
      if (hs[i] < 1 || hs[i + 1] < 1) continue;
      const a = row[i], c = row[i + 1], y = Math.max(a[1], c[1]) + H, eh = H * 0.11;
      const dx = c[0] - a[0], dz = c[2] - a[2], l = Math.hypot(dx, dz) || 1, ex = dx / l * r * 1.4, ez = dz / l * r * 1.4;
      // architrave, a carved frieze behind a fillet, and a cornice that throws a shadow line
      const A = [a[0] - ex, a[2] - ez], C = [c[0] + ex, c[2] + ez], nx = -dz / l, nz = dx / l, e1 = eh * 0.42, fh = eh * 0.4, fo = r * 1.12;
      b.col(P.trim, 0.86, 1).surf(SURF.PLAIN); b.beam([A[0], y + e1 / 2, A[1]], [C[0], y + e1 / 2, C[1]], r * 2.5, e1);
      b.col(mul3(P.trim, 0.93), 0.95, 1).surf(SURF.RELIEF, 0, 1);
      b.wall(A[0] + nx * fo, A[1] + nz * fo, C[0] + nx * fo, C[1] + nz * fo, y + e1, y + e1 + fh, { cellW: fh, cellH: fh }); b.wall(C[0] - nx * fo, C[1] - nz * fo, A[0] - nx * fo, A[1] - nz * fo, y + e1, y + e1 + fh, { cellW: fh, cellH: fh });
      b.col(P.accent, 0.9, 1).surf(SURF.PLAIN); b.beam([A[0], y + e1 + 0.04, A[1]], [C[0], y + e1 + 0.04, C[1]], r * 2.62, 0.08);
      b.col(P.stone, 0.95, 1); b.beam([A[0], y + e1 + fh + (eh - e1 - fh) / 2 + 0.1, A[1]], [C[0], y + e1 + fh + (eh - e1 - fh) / 2 + 0.1, C[1]], r * 3.5, eh - e1 - fh + 0.2);
    }
  }
  const object = place(new THREE.Mesh(b.toGeometry(), mats.facades), opts);
  return result(object, mats, { rows, count, triangles: b.triangles });
}

// Flight of steps. Local frame: bottom edge at z = 0 facing +Z, climbing toward -Z, centred on x.
// opts: { width, height, steps, depth (total run), flare, rails:'wall'|'balustrade'|'none', landing, palette, mats, position, rotationY }
export function makeStairs(opts = {}) {
  const mats = matsOf(opts), P = palette(STONE, opts.palette), b = new Builder(1024).flood(opts.flood ?? 0.3, 0, (opts.height ?? 4) * 1.5);
  const W = opts.width ?? 9, H = opts.height ?? 4, n = opts.steps ?? Math.max(2, Math.round(H / 0.18)), run = opts.depth ?? n * 0.36, flare = opts.flare ?? 0.25;
  const rh = H / n, tr = run / n, landing = opts.landing ?? 2.5, rails = opts.rails ?? 'wall';
  for (let i = 0; i < n; i++) {
    const w = W * (1 + flare * (1 - i / Math.max(1, n - 1)) * (1 - i / Math.max(1, n - 1)));
    b.col(P.stone, 0.8 + 0.2 * i / n, 0.85 + 0.2 * i / n).surf(SURF.MASONRY, 0, 1.3);
    b.box(-w / 2, -0.3, -(i + 1) * tr - (i === n - 1 ? landing : 0), w / 2, (i + 1) * rh, -i * tr, { m: 1, capColor: P.trim, capStyle: SURF.MASONRY, capM: 0.7 });
  }
  if (rails !== 'none') for (const s of [-1, 1]) {
    const x0 = s * W * (1 + flare) / 2, x1 = s * W / 2;
    if (rails === 'wall') {
      b.col(P.trim, 0.85, 1).surf(SURF.MASONRY, 0, 1);
      const N = Math.max(3, Math.round(n / 3));
      for (let k = 0; k < N; k++) { const t0 = k / N, t1 = (k + 1) / N, f = (t) => lerp(x0, x1, 1 - (1 - t) * (1 - t)); b.beam([f(t0) + s * 0.35, H * t0 + 0.35, -run * t0], [f(t1) + s * 0.35, H * t1 + 0.35, -run * t1], 0.7, 1.3); }
      b.cbox(x0 + s * 0.35, -0.3, 0.2, 1.1, 1.7, 1.1, { m: 1 }); b.cbox(x1 + s * 0.35, H - 0.3, -run - 0.2, 1.1, 1.7, 1.1, { m: 1 });
      if (opts.lamps) { glowBox(b, x0 + s * 0.35, 1.9, 0.2, 0.5, 0.6, 0.5, lin(WARM), 2.2); }
    } else { b.col(P.dark, 1, 1).surf(SURF.PLAIN); railing(b, [x0, 0, 0], [x1, H, -run], 1.0, 1.4, 0.08); }
  }
  const object = place(new THREE.Mesh(b.toGeometry(), mats.facades), opts);
  return result(object, mats, { top: [0, H, -run], run, triangles: b.triangles });
}

function noise1(rng, n) { const v = []; for (let i = 0; i < n + 2; i++) v.push(rng()); return (x) => { const i = Math.floor(x) % n, f = x - Math.floor(x), t = f * f * (3 - 2 * f); return lerp(v[(i + n) % n], v[(i + n) % n + 1], t); }; }

// Defensive or garden wall along a polyline, optionally crenellated, towered, or crumbling.
// opts: { rng, points, height, thickness, crenellated, towers (true|false), ruin (0..1), heightAt, smooth, palette, mats, night }
export function makeWall(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'wall'), P = palette({ stone: '#9a9284', trim: '#b0a892', dark: '#6f685c', roof: '#3a4a5a', lamp: WARM }, opts.palette);
  const H = opts.height ?? 7, T = opts.thickness ?? 2, ruin = opts.ruin ?? 0, hAt = opts.heightAt || (() => 0), cren = opts.crenellated ?? true;
  const pts = (opts.points || [[-30, 0, 0], [30, 0, 0]]).map((p) => vec3(p));
  const sm = sampler(pts.map((p) => p), !opts.smooth), b = new Builder(2048), halos = new Halos();
  const ds = opts.step ?? 3, n = Math.max(1, Math.round(sm.length / ds)), nz = noise1(rng, 64), tp = new THREE.Vector3(), tt = new THREE.Vector3();
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const d = sm.length * i / n; sm.at(d, tp); sm.tan(d, tt);
    const nx = tt.z, nzz = -tt.x, base = hAt(tp.x, tp.z);
    const cur = { x: tp.x, z: tp.z, nx, nz: nzz, base };
    if (prev) {
      let hh = H;
      if (ruin > 0) { const k = nz(d * 0.045) * 1.25 + (rng() - 0.5) * 0.35; hh = H * clamp(1 - ruin * (0.2 + 1.5 * k), 0, 1); hh = Math.round(hh / 0.45) * 0.45; }
      if (hh > 0.3) {
        const A = prev, B = cur, y0 = Math.min(A.base, B.base) - 1.5, y1 = Math.max(A.base, B.base) + hh, t = T / 2;
        const aL = [A.x + A.nx * t, A.z + A.nz * t], aR = [A.x - A.nx * t, A.z - A.nz * t], bL = [B.x + B.nx * t, B.z + B.nz * t], bR = [B.x - B.nx * t, B.z - B.nz * t];
        b.col(P.stone, 0.68, 1).surf(SURF.MASONRY, 0, 1.25);
        const u0 = d - sm.length / n, u1 = d;
        b.quad([bL[0], y0, bL[1]], [aL[0], y0, aL[1]], [aL[0], y1, aL[1]], [bL[0], y1, bL[1]], [u1, y0, u0, y1]);
        b.quad([aR[0], y0, aR[1]], [bR[0], y0, bR[1]], [bR[0], y1, bR[1]], [aR[0], y1, aR[1]], [u0, y0, u1, y1]);
        b.col(mul3(P.stone, 0.8), 1, 1).quad([aL[0], y1, aL[1]], [aR[0], y1, aR[1]], [bR[0], y1, bR[1]], [bL[0], y1, bL[1]], [0, u0, T, u1]);
        // section ends (visible where the height steps)
        b.col(P.stone, 0.68, 0.9);
        b.quad([aL[0], y0, aL[1]], [aR[0], y0, aR[1]], [aR[0], y1, aR[1]], [aL[0], y1, aL[1]], [0, y0, T, y1]);
        b.quad([bR[0], y0, bR[1]], [bL[0], y0, bL[1]], [bL[0], y1, bL[1]], [bR[0], y1, bR[1]], [0, y0, T, y1]);
        if (cren && hh >= H - 0.01) {
          b.col(P.trim, 0.95, 1);
          const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, o = t - 0.3;
          b.beam([A.x + A.nx * o, y1 + 0.55, A.z + A.nz * o], [mx + A.nx * o, y1 + 0.55, mz + A.nz * o], 0.6, 1.1);
          if (opts.doubleSided) b.beam([A.x - A.nx * o, y1 + 0.55, A.z - A.nz * o], [mx - A.nx * o, y1 + 0.55, mz - A.nz * o], 0.6, 1.1);
        }
      }
    }
    prev = cur;
  }
  if (opts.towers !== false) pts.forEach((p, i) => {
    if (opts.towers === 'ends' && i > 0 && i < pts.length - 1) return;
    const base = hAt(p.x, p.z), R = T * 0.75 + 1.6, f = ruin > 0 ? clamp(1 - ruin * rng.range(0.1, 1.1), 0.25, 1) : 1, th = (H + 3.5) * f;
    b.col(P.stone, 0.66, 1).surf(SURF.MASONRY, 0, 1.25);
    b.lathe(p.x, base - 1.5, p.z, [[R * 1.12, 0], [R, 3], [R, th + 1.5 - 0.6], [R * 1.1, th + 1.5 - 0.1], [R * 1.1, th + 1.5]], 12, { m: 1 });
    b.col(mul3(P.stone, 0.7)).surf(SURF.PLAIN); b.disc(p.x, base + th - 0.02, p.z, R * 1.1, 12);
    if (f >= 1) {
      b.col(P.trim, 0.95, 1).surf(SURF.MASONRY, 0, 1.25);
      for (let k = 0; k < 10; k += 2) { const a = TAU * (k + 0.5) / 10; b.tr(p.x + (R * 1.1 - 0.28) * Math.cos(a), base + th, p.z + (R * 1.1 - 0.28) * Math.sin(a), Math.PI / 2 - a); b.cbox(0, 0, 0, TAU * R * 1.1 / 10, 1.1, 0.5, { m: 1 }); b.pop(); }
      if (opts.lamps !== false) { glowBox(b, p.x, base + th + 1.5, p.z, 0.5, 0.7, 0.5, P.lamp, 2.2); b.col(P.dark).surf(SURF.PLAIN); b.beam([p.x, base + th, p.z], [p.x, base + th + 1.2, p.z], 0.1, 0.1); halos.add(p.x, base + th + 1.5, p.z, 2.6, mul3(P.lamp, 0.9)); }
    }
  });
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo));
  place(object, opts);
  return result(object, mats, { length: sm.length, triangles: b.triangles + halos.n * 2 });
}

// Scatter of classical ruins: stumps, standing columns with lintels, fallen drums, wall fragments, slabs.
// opts: { rng, count, radius | area:[sx,sz], center, heightAt, clear:(x,z)=>bool, scale, palette, mats, night }
export function makeRuins(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'ruins'), P = palette({ stone: '#b8ae98', dark: '#8d8473', moss: '#6f7a55' }, opts.palette);
  const n = opts.count ?? 26, R = opts.radius ?? 34, c = opts.center ? vec3(opts.center) : new THREE.Vector3(), hAt = opts.heightAt || (() => c.y), S = opts.scale ?? 1;
  const b = new Builder(4096).flood(opts.flood ?? 0.45, 0, 8), items = [];
  for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
    const a = rng() * TAU, rr = Math.sqrt(rng()) * R, x = c.x + (opts.area ? (rng() - 0.5) * opts.area[0] : rr * Math.cos(a)), z = c.z + (opts.area ? (rng() - 0.5) * opts.area[1] : rr * Math.sin(a));
    if (opts.clear && !opts.clear(x, z)) continue;
    if (items.some((q) => Math.hypot(q[0] - x, q[1] - z) < 3.2 * S)) continue;
    items.push([x, z]); i++;
    const y = hAt(x, z), kind = rng();
    const col = vary(rng.chance(0.25) ? mix3(P.stone, P.moss, 0.35) : P.stone, rng, 0.1, 0.02);
    b.tr(x, y, z, rng() * TAU, S); b.col(col, 0.7, 1).surf(SURF.PLAIN);
    const r = rng.range(0.5, 0.8);
    if (kind < 0.3) {                                                 // stump
      const h = rng.range(1, 5.5);
      b.cbox(0, -0.8, 0, r * 3, 1.1, r * 3); b.lathe(0, 0.3, 0, [[r * 1.3, 0], [r * 1.3, 0.14], [r, 0.24], [r * 0.9, h], [r * 0.3, h + rng.range(0, 0.6)], [0, h]], 8);
    } else if (kind < 0.48) {                                         // two columns carrying a lintel
      const h = rng.range(6, 9), sp = rng.range(3.4, 4.6);
      for (const s of [-1, 1]) { b.cbox(s * sp / 2, -0.8, 0, r * 3, 1.1, r * 3); column(b, s * sp / 2, 0.3, 0, r, h, 8); }
      b.col(vary(P.stone, rng, 0.08), 0.85, 1).surf(SURF.MASONRY, 0, 2); b.box(-sp / 2 - r * 1.6, h + 0.3, -r * 1.3, sp / 2 + r * (rng.chance(0.5) ? 1.6 : 0.3), h + 0.3 + r * 1.5, r * 1.3, { m: 1, bottom: true, capStyle: SURF.MASONRY });
    } else if (kind < 0.68) {                                         // fallen drums
      const k = rng.int(1, 3);
      for (let j = 0; j < k; j++) { b.push(_m4.makeRotationZ(Math.PI / 2).setPosition(j * (r * 2.4 + rng.range(0.1, 0.6)) - r, r * 0.92, rng.range(-0.3, 0.3))); b.lathe(0, 0, 0, [[0, 0], [r, 0], [r, r * rng.range(1.6, 2.2)], [0, r * 2]], 8); b.pop(); }
    } else if (kind < 0.88) {                                         // wall fragment stepping down
      const len = rng.range(4, 9), h = rng.range(2.5, 6), steps = rng.int(3, 5), t = rng.range(0.7, 1.1);
      b.surf(SURF.MASONRY, 0, 1.3);
      for (let j = 0; j < steps; j++) { const x0 = -len / 2 + len * j / steps, hh = h * (1 - j / steps * rng.range(0.6, 0.95)) * rng.range(0.85, 1); b.box(x0, -1, -t / 2, x0 + len / steps, Math.max(0.5, hh), t / 2, { m: 1, capStyle: SURF.MASONRY, capM: 1 }); }
    } else {                                                          // slabs
      const k = rng.int(2, 4); b.surf(SURF.MASONRY, 0, 2);
      for (let j = 0; j < k; j++) { const sx = rng.range(1.2, 2.6), sz = rng.range(1, 2); b.cbox(rng.range(-2, 2), -0.2, rng.range(-2, 2), sx, 0.2 + rng.range(0.25, 0.6), sz, { m: 1, capStyle: SURF.MASONRY, capM: 1 }); }
    }
    b.pop();
  }
  const object = place(new THREE.Mesh(b.toGeometry(), mats.facades), opts);
  return result(object, mats, { items, triangles: b.triangles });
}

// ---------- obelisks and monoliths ----------
// opts: { rng, height, width, tip:'gold'|'glow'|'plain', inscribed, palette, mats, night, position, rotationY }
export function makeObelisk(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'obelisk'), P = palette({ stone: '#c9a98a', base: '#9d927f', tip: '#e0b040' }, opts.palette);
  const H = opts.height ?? 26, W = opts.width ?? H * 0.1, b = new Builder(512).flood(opts.flood ?? 0.85, 0, H * 0.7), halos = new Halos();
  const ph = H * 0.07, sh = H * 0.84, tip = opts.tip ?? 'gold';
  b.col(P.base, 0.75, 1).surf(SURF.MASONRY, 0, 1.6);
  b.box(-W * 1.5, -0.5, -W * 1.5, W * 1.5, ph * 0.45, W * 1.5, { m: 1, capStyle: SURF.MASONRY, capM: 1 }); b.box(-W * 1.05, ph * 0.45, -W * 1.05, W * 1.05, ph, W * 1.05, { m: 1, capStyle: SURF.MASONRY, capM: 1 });
  // shaft: two columns of carved marks down each face (drawn by the RELIEF surface, with an engraved shadow)
  b.col(P.stone, 0.72, 1.05).surf(SURF.RELIEF, 0, opts.inscribed === false ? 0 : 1); b.frustum(0, 0, W, W, W * 0.66, W * 0.66, ph, ph + sh, { top: false, cellW: W * 0.5, cellH: W * 0.42 });
  b.col(mul3(P.stone, 0.9), 1, 1).surf(SURF.PLAIN); b.cbox(0, ph, 0, W * 1.08, sh * 0.02, W * 1.08, { top: false });
  if (tip === 'glow') { b.col(P.tip).surf(SURF.GLOW, 0, 1.6); } else b.col(tip === 'gold' ? P.tip : P.stone, 0.9, 1.3);
  b.frustum(0, 0, W * 0.66, W * 0.66, 0, 0, ph + sh, H);
  if (tip === 'glow') halos.add(0, ph + sh + (H - ph - sh) * 0.5, 0, W * 3.5, mul3(P.tip, 0.8));
  b.surf(SURF.PLAIN);
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo));
  place(object, opts);
  return result(object, mats, { height: H, triangles: b.triangles });
}

// Statues as abstract monoliths.
// opts: { rng, type:'slab'|'figure'|'ring'|'head'|'shards'|'sentinel', height, glow (colour or false), palette, mats, night, position, rotationY }
export function makeMonolith(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'monolith'), type = opts.type || 'figure';
  const P = palette({ stone: '#6f7278', dark: '#2a2c31', base: '#8a857c', glow: opts.glow && opts.glow !== true ? opts.glow : '#7fe0ff' }, opts.palette);
  const H = opts.height ?? { slab: 14, figure: 16, ring: 16, head: 9, shards: 12, sentinel: 18 }[type], glow = opts.glow !== false;
  const b = new Builder(1024).flood(opts.flood ?? 0.5, 0, H * 0.8), halos = new Halos(); let size = {};
  const G = (fn, power = 1.4) => { if (!glow) return; const c = b.c; b.col(P.glow).surf(SURF.GLOW, 0, power); fn(); b.surf(SURF.PLAIN).col(c); };
  if (type === 'slab') {
    const w = H * 4 / 9, d = H / 9;
    b.col(P.dark, 0.8, 1.1); b.box(-w / 2, -1, -d / 2, w / 2, H, d / 2);
    G(() => { b.box(-0.07, H * 0.12, -d / 2 - 0.02, 0.07, H * 0.9, d / 2 + 0.02, { top: false }); });
    if (glow) halos.add(0, H * 0.5, d / 2 + 0.3, H * 0.28, mul3(P.glow, 0.35));
    size = { w, h: H };
  } else if (type === 'figure') {
    const s = H / 16, lean = rng.range(-0.25, 0.25) * s;
    b.col(P.base, 0.75, 1).surf(SURF.MASONRY, 0, 1.5); b.box(-3.2 * s, -1, -2.4 * s, 3.2 * s, 1.2 * s, 2.4 * s, { m: 1, capStyle: SURF.MASONRY, capM: 1 });
    b.col(P.stone, 0.7, 1).surf(SURF.PLAIN);
    for (const sx of [-1, 1]) b.frustum(sx * 0.95 * s, 0, 1.5 * s, 1.7 * s, 1.25 * s, 1.5 * s, 1.2 * s, 6.6 * s, { topX: -sx * 0.1 * s });
    b.col(P.stone, 0.85, 1.05); b.frustum(0, 0, 3.3 * s, 1.9 * s, 4.3 * s, 2.2 * s, 6.6 * s, 11.6 * s, { topX: lean });
    b.frustum(lean, 0, 4.3 * s, 2.2 * s, 2.0 * s, 1.5 * s, 11.6 * s, 12.6 * s);
    b.col(P.stone, 0.95, 1.1); b.frustum(lean, 0.1 * s, 1.5 * s, 1.6 * s, 1.9 * s, 1.9 * s, 12.6 * s, 15.2 * s);
    b.frustum(lean, 0.1 * s, 1.9 * s, 1.9 * s, 1.1 * s, 1.2 * s, 15.2 * s, 16 * s);
    for (const sx of [-1, 1]) { b.col(P.stone, 0.75, 1); b.frustum(lean + sx * 2.55 * s, 0, 0.8 * s, 1.2 * s, 1.05 * s, 1.5 * s, 6.9 * s, 11.5 * s, { topX: -sx * 0.25 * s }); }
    G(() => { b.box(lean - 0.62 * s, 14.1 * s, 0.1 * s + 0.86 * s, lean + 0.62 * s, 14.32 * s, 0.1 * s + 0.99 * s, {}); });
    if (glow) halos.add(lean, 14.2 * s, 1.3 * s, 2.2 * s, mul3(P.glow, 0.5));
    size = { w: 6.4 * s, h: H };
  } else if (type === 'ring') {
    const Rr = H * 0.42, tr = H * 0.075, cy = Rr + tr + H * 0.04, N = 28;
    b.col(P.base, 0.75, 1).surf(SURF.MASONRY, 0, 1.5); b.box(-Rr * 0.75, -1, -tr * 2.2, Rr * 0.75, H * 0.05, tr * 2.2, { m: 1, capStyle: SURF.MASONRY, capM: 1 });
    const pts = []; for (let i = 0; i <= N; i++) { const a = TAU * i / N - Math.PI / 2; pts.push([Rr * Math.cos(a), cy + Rr * Math.sin(a), 0]); }
    b.col(P.stone, 1, 1).surf(SURF.PLAIN); b.tube(pts, tr, 6);
    if (glow) { const g2 = []; for (let i = 0; i <= N; i++) { const a = TAU * i / N - Math.PI / 2; g2.push([(Rr - tr * 0.93) * Math.cos(a), cy + (Rr - tr * 0.93) * Math.sin(a), 0]); } G(() => b.tube(g2, tr * 0.16, 4), 1.6); }
    size = { w: (Rr + tr) * 2, h: cy + Rr + tr, opening: (Rr - tr) * 2 };
  } else if (type === 'head') {
    const s = H / 9;
    b.col(P.stone, 0.68, 1); b.frustum(0, 0, 4.2 * s, 3.4 * s, 3.2 * s, 2.8 * s, -1, 3 * s);
    b.frustum(0, 0.2 * s, 3.0 * s, 3.0 * s, 3.3 * s, 3.4 * s, 3 * s, 6.8 * s);
    b.col(P.stone, 0.95, 1.08); b.frustum(0, 0.2 * s, 3.5 * s, 3.8 * s, 3.0 * s, 3.0 * s, 6.8 * s, 9 * s);
    b.col(P.stone, 0.8, 1); b.cbox(0, 6.5 * s, 1.95 * s, 3.4 * s, 0.5 * s, 0.6 * s, { bottom: true });       // brow
    b.frustum(0, 2.0 * s, 0.9 * s, 0.9 * s, 0.55 * s, 0.3 * s, 4.3 * s, 6.5 * s, { topZ: -0.2 * s });          // nose
    b.cbox(0, 3.4 * s, 1.8 * s, 1.7 * s, 0.35 * s, 0.4 * s, { bottom: true });                                  // mouth ridge
    for (const sx of [-1, 1]) b.cbox(sx * 1.85 * s, 4.0 * s, 0.2 * s, 0.4 * s, 2.4 * s, 0.9 * s, { bottom: true });   // ears
    G(() => { for (const sx of [-1, 1]) b.cbox(sx * 0.95 * s, 5.95 * s, 1.74 * s, 0.75 * s, 0.22 * s, 0.1 * s, {}); }, 1.2);
    size = { w: 4.2 * s, h: H };
  } else if (type === 'shards') {
    const n = opts.count ?? rng.int(4, 7);
    for (let i = 0; i < n; i++) {
      const a = TAU * i / n + rng.range(-0.3, 0.3), rr = i === 0 ? 0 : H * rng.range(0.12, 0.3), h = H * (i === 0 ? 1 : rng.range(0.35, 0.8)), w = h * rng.range(0.12, 0.2);
      b.tr(rr * Math.cos(a), 0, rr * Math.sin(a), rng() * TAU);
      b.col(vary(P.dark, rng, 0.2), 0.7, 1.25); b.frustum(0, 0, w, w * 0.8, w * 0.12, w * 0.1, -1, h, { topX: h * rng.range(-0.14, 0.14), topZ: h * rng.range(-0.14, 0.14) });
      b.pop();
    }
    G(() => { b.lathe(0, 0.05, 0, [[H * 0.36, 0], [H * 0.34, 0.0]], 16); b.disc(0, 0.06, 0, H * 0.05, 8); }, 0.8);
    if (glow) halos.add(0, 0.3, 0, H * 0.5, mul3(P.glow, 0.25), 1);
    size = { w: H * 0.7, h: H };
  } else {                                                            // sentinel: a tapering pillar with one eye
    const w = H * 0.16;
    b.col(P.stone, 0.66, 1.05); b.frustum(0, 0, w, w * 0.8, w * 0.62, w * 0.5, -1, H * 0.8);
    b.frustum(0, 0, w * 0.62, w * 0.5, w * 0.9, w * 0.72, H * 0.8, H * 0.86); b.frustum(0, 0, w * 0.9, w * 0.72, w * 0.5, w * 0.4, H * 0.86, H);
    G(() => { b.sphere(0, H * 0.92, w * 0.3, w * 0.16, 8, 5); }, 2);
    if (glow) halos.add(0, H * 0.92, w * 0.5, w * 1.2, mul3(P.glow, 0.7));
    size = { w, h: H };
  }
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo));
  place(object, opts);
  return result(object, mats, { size, triangles: b.triangles + halos.n * 2 });
}

// ---------- boats ----------
const BOAT_PAL = {
  rowboat: { hull: ['#7a5234', '#2f5a6a', '#b8473a', '#e6dcc4', '#3f6a4a'], trim: '#e8dcc0', inner: '#a8845a', wood: '#6a4a30', lamp: WARM },
  gondola: { hull: '#101114', trim: '#c9a23a', inner: '#2a1a16', wood: '#3a2a1e', seat: '#8f1f24', lamp: WARM },
  sailboat: { hull: ['#f0ece2', '#1f3350', '#8f2a2a', '#e8e0cc'], trim: '#c23a2e', inner: '#c9a878', wood: '#8a6a44', sail: ['#f2ecdc', '#e8dfc8', '#d94f3a'], lamp: WARM, cabin: '#f0ece2' },
  junk: { hull: ['#4a2f20', '#5a3524', '#3a2a22'], trim: '#b8892f', inner: '#7a5a3a', wood: '#3a251a', sail: ['#a8322a', '#c2703a', '#b8452f', '#d9b07a'], lamp: '#ffb055', cabin: '#6a3a26' },
};
export const BOAT_TYPES = Object.keys(BOAT_PAL);

function hullInto(b, o, col, inner) {
  const L = o.L, nu = o.nu ?? 10, nv = o.nv ?? 8;
  const gun = (u) => o.D + (u > 0.5 ? o.bowRise * Math.pow((u - 0.5) * 2, o.riseP ?? 2.4) : o.sternRise * Math.pow((0.5 - u) * 2, o.riseP ?? 2.4));
  const half = (u) => { const t = Math.abs(u - 0.5) * 2, p = u < 0.5 ? (o.sternP ?? 2.6) : (o.bowP ?? 1.8), w = Math.pow(Math.max(0, 1 - Math.pow(t, p)), 0.72); return o.B / 2 * (u < 0.5 ? Math.max(w, o.transom ?? 0) : w); };
  const keel = (u) => -o.draft * (1 - Math.pow(Math.abs(u - 0.5) * 2, 3) * (o.rocker ?? 0.85));
  const pt = (u, v, ins) => {
    const w = Math.max(0, half(u) - ins), g = gun(u), k = Math.min(g - 0.02, keel(u) + ins * 1.4), ph = Math.PI * v, c = Math.cos(ph), s = Math.sin(ph);
    return [(u - 0.5) * L, lerp(g, k, Math.pow(s, o.vee ?? 1.15)), -w * Math.sign(c) * Math.pow(Math.abs(c), o.flare ?? 0.75)];
  };
  const dark = mul3(col, 0.45), stripe = o.stripe;
  b.surf(SURF.PLAIN);
  b.grid(nu, nv, (u, v) => pt(u, v, 0), { colorFn: (u, v) => { const e = Math.abs(v - 0.5) * 2; return stripe && e > 0.86 ? stripe : mix3(dark, col, smoothstep(0.1, 0.6, e)); } });
  b.grid(nu, nv, (u, v) => pt(u, v, o.wall ?? 0.07), { flip: true, colorFn: (u, v) => mul3(inner, 0.5 + 0.5 * Math.abs(v - 0.5) * 2) });
  if (o.transom) {
    const c0 = pt(0, 0.5, 0), cm = [c0[0], (gun(0) + keel(0)) / 2, 0];
    for (let j = 0; j < nv; j++) b.tri(cm, pt(0, (j + 1) / nv, 0), pt(0, j / nv, 0), mul3(col, 0.8));
  }
  for (const v of [0, 1]) { const pts = []; for (let i = 0; i <= nu; i++) pts.push(pt(i / nu, v, 0.02)); b.col(o.rail || mul3(col, 1.3)); b.tube(pts, o.railR ?? o.B * 0.028, 4); }
  if (o.deckY != null) { b.col(inner, 1, 1); b.surf(SURF.PLANKS); b.grid(nu, 1, (u, v) => [(u - 0.5) * L * 0.985, Math.min(o.deckY, gun(u) - 0.05) + (o.deckFollow ? (gun(u) - o.D) * o.deckFollow : 0), lerp(-1, 1, v) * Math.max(0, half(u) - (o.wall ?? 0.07) * 0.6) * (o.deckW ?? 0.86)], { flip: true, uv: [0, 0, L, o.B] }); b.surf(SURF.PLAIN); }
  return { gun, half, keel };
}

// Writes a boat into builder b (bow toward +X, waterline y = 0) and rigging into wires.
function boatInto(b, wires, type, rng, over, lit = 1) {
  const src = BOAT_PAL[type] || BOAT_PAL.rowboat, P = {};
  for (const k in src) P[k] = lin(Array.isArray(src[k]) ? rng.pick(src[k]) : src[k]);
  if (over) for (const k in over) P[k] = lin(Array.isArray(over[k]) && typeof over[k][0] !== 'number' ? rng.pick(over[k]) : over[k]);
  const rope = [0.12, 0.1, 0.08];
  let L, B;
  if (type === 'gondola') {
    L = 11; B = 1.45;
    const h = hullInto(b, { L, B, D: 0.42, draft: 0.22, bowRise: 1.5, sternRise: 1.15, bowP: 1.5, sternP: 1.7, riseP: 3.2, rail: P.trim, railR: 0.03, deckY: 0.05, nu: 14 }, P.hull, P.inner);
    b.col(P.trim, 1, 1.2); b.box(L / 2 - 0.12, h.gun(1) - 0.1, -0.03, L / 2 + 0.22, h.gun(1) + 0.75, 0.03, { bottom: true });       // ferro
    for (let i = 0; i < 5; i++) b.box(L / 2 + 0.22, h.gun(1) + 0.02 + i * 0.13, -0.03, L / 2 + 0.42, h.gun(1) + 0.09 + i * 0.13, 0.03, { bottom: true });
    b.col(P.seat, 0.8, 1); b.cbox(-0.6, 0.05, 0, 1.1, 0.4, 0.95); b.cbox(-1.25, 0.05, 0, 0.2, 0.85, 0.95);
    b.col(P.wood); b.beam([-3.6, 0.5, 0.55], [-3.6, 1.15, 0.6], 0.07, 0.07); b.beam([-5.6, -0.3, 1.6], [-2.4, 1.7, 0.2], 0.05, 0.05);       // forcola and oar
    b.beam([3.9, 0.7, 0], [3.9, 1.75, 0], 0.035, 0.035); glowBox(b, 3.9, 1.9, 0, 0.2, 0.28, 0.2, P.lamp, 2 * lit);
  } else if (type === 'sailboat') {
    L = 9.5; B = 2.9;
    hullInto(b, { L, B, D: 0.8, draft: 0.75, bowRise: 0.5, sternRise: 0.15, bowP: 1.5, sternP: 3.5, transom: 0.55, stripe: P.trim, deckY: 0.72, deckFollow: 0.9, deckW: 0.95, nu: 12 }, P.hull, P.inner);
    b.col(P.cabin, 0.85, 1); b.frustum(-0.3, 0, 3.4, 1.9, 3.0, 1.5, 0.72, 1.4, {});
    for (const s of [-1, 1]) for (const x of [-1.1, 0.4]) winDecal(b, rng, x - 0.3, 1.08, s * 0.86, 0.9, 0.36, s > 0 ? 0 : Math.PI, SURF.CURTAIN, 1.6 * lit, P.wood);
    const mx = 0.9, mh = 11.5, sail = P.sail;
    b.col(P.wood, 0.9, 1); b.lathe(mx, 0.7, 0, [[0.085, 0], [0.05, mh]], 5); b.beam([mx, 2.0, 0], [mx - 4.3, 2.15, 0.25], 0.09, 0.09);
    const belly = 0.42;
    b.col(sail, 0.86, 1.05); b.grid(4, 6, (u, v) => { const w = (1 - v) * 4.1; return [mx - 0.08 - u * w, 2.25 + v * (mh - 1.9), 0.03 + 0.06 * u * 4 + belly * Math.sin(Math.PI * u) * (1 - v) * Math.sin(Math.PI * Math.min(1, v + 0.25))]; }, { double: true });
    b.col(mul3(sail, 0.96), 0.86, 1.05); b.grid(3, 5, (u, v) => { const tx = L / 2 - 0.3, w = (1 - v) * (tx - mx - 0.25); return [mx + 0.2 + (1 - v) * 0.05 + u * w, 1.25 + v * (mh - 2.6) + (1 - u) * 0 + u * (1 - v) * -0.35, 0.3 * Math.sin(Math.PI * u) * (1 - v)]; }, { double: true });
    wires.line([[mx, 0.7 + mh, 0], [L / 2 - 0.1, 0.95, 0]], 0.012, rope); wires.line([[mx, 0.7 + mh, 0], [-L / 2 + 0.2, 0.95, 0]], 0.012, rope);
    for (const s of [-1, 1]) wires.line([[mx, 0.7 + mh * 0.72, 0], [mx - 0.2, 0.85, s * B * 0.46]], 0.012, rope);
    glowBox(b, mx, 0.7 + mh + 0.15, 0, 0.14, 0.2, 0.14, P.lamp, 2.5 * lit);
  } else if (type === 'junk') {
    L = 19; B = 5.2;
    const h = hullInto(b, { L, B, D: 1.5, draft: 1.1, bowRise: 1.6, sternRise: 2.6, bowP: 1.9, sternP: 3.2, transom: 0.62, flare: 0.6, stripe: P.trim, deckY: 1.25, deckFollow: 0.55, deckW: 0.93, nu: 14, wall: 0.16 }, P.hull, P.inner);
    // stern castle
    const sx0 = -L / 2 + 0.5, sy = 1.25 + 2.6 * 0.5;
    b.col(P.cabin, 0.8, 1).surf(SURF.SHOJI, rng(), 1.7 * lit); b.box(sx0, sy, -B * 0.33, sx0 + 4.2, sy + 2.3, B * 0.33, { cellW: 1.4, cellH: 2.3, top: false });
    b.col(P.wood, 1, 1).surf(SURF.PLAIN); b.sweepRoof(sx0 + 2.1, 0, 4.2, B * 0.66, sy + 2.3, 0.9, { overhang: 0.6, lift: 0.35, top: 0.5, nu: 4, nv: 2, edgeColor: P.trim });
    for (const s of [-1, 1]) glowBox(b, sx0 - 0.15, sy + 1.5, s * B * 0.2, 0.34, 0.46, 0.34, P.lamp, 2 * lit);
    b.col(P.wood, 0.8, 1); b.box(-L / 2 - 0.9, -1.4, -0.09, -L / 2 + 0.3, 1.2, 0.09, { bottom: true });                                      // rudder
    // battened lug sails
    const masts = [[-L * 0.12, 13.5, 6.4], [L * 0.24, 10.5, 4.8], [-L * 0.36, 7.5, 3.2]];
    for (const [mx, mh, sw] of masts) {
      b.col(P.wood, 0.85, 1); b.lathe(mx, 1.2, 0, [[0.2, 0], [0.11, mh]], 6);
      const y0 = 1.2 + mh * 0.2, y1 = 1.2 + mh * 0.97, nb = 6, yaw = 0.32, c = Math.cos(yaw), s = Math.sin(yaw);
      const P3 = (u, v) => { const half = sw * (0.62 + 0.38 * Math.sin(Math.PI * (0.15 + 0.7 * v))), lx = -half * 0.36 + u * half * 1.36 - (1 - v) * 0, bel = 0.5 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(Math.PI * v * nb) ** 2); const xx = -lx, zz = 0.25 + bel; return [mx + xx * c - zz * s * 0 + (v - 0.5) * 0.5, lerp(y0, y1, v) + u * v * 1.1, xx * s + zz]; };
      b.col(P.sail, 0.8, 1.08); b.grid(5, nb, P3, { double: true });
      b.col(P.wood, 1, 1); for (let k = 0; k <= nb; k++) { const a = P3(0, k / nb), e = P3(1, k / nb); a[2] += 0.04; e[2] += 0.04; b.beam(a, e, 0.07, 0.07); }
      wires.line([[mx, 1.2 + mh, 0], P3(1, 1)], 0.014, rope); wires.line([P3(1, 0), [mx - sw * 0.9, h.gun(0.3) , 0]], 0.014, rope);
      glowBox(b, mx, 1.2 + mh + 0.2, 0, 0.18, 0.26, 0.18, P.lamp, 2.2 * lit);
    }
  } else {
    L = 4.6; B = 1.55;
    hullInto(b, { L, B, D: 0.42, draft: 0.2, bowRise: 0.28, sternRise: 0.08, bowP: 1.6, sternP: 4, transom: 0.72, stripe: P.trim, deckY: -0.02, nu: 9, wall: 0.045 }, P.hull, P.inner);
    b.col(P.inner, 0.9, 1).surf(SURF.PLANKS); for (const x of [-1.1, 0.3]) b.box(x - 0.14, 0.2, -B * 0.42, x + 0.14, 0.26, B * 0.42, { bottom: true, capStyle: SURF.PLANKS });
    b.surf(SURF.PLAIN).col(P.wood);
    for (const s of [-1, 1]) { b.beam([0.2, 0.45, s * B * 0.48], [-1.5, 0.12, s * (B * 0.5 + 1.5)], 0.045, 0.045); b.beam([-1.5, 0.12, s * (B * 0.5 + 1.5)], [-2.0, 0.02, s * (B * 0.5 + 1.95)], 0.16, 0.03); }
    if (lit > 0) { b.beam([L / 2 - 0.45, 0.3, 0], [L / 2 - 0.45, 1.2, 0], 0.03, 0.03); glowBox(b, L / 2 - 0.45, 1.3, 0, 0.16, 0.22, 0.16, P.lamp, 2 * lit); }
  }
  b.surf(SURF.PLAIN).col([1, 1, 1], 1, 1);
  return { L, B };
}

const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
// Matrix of a boat riding heightAt(x,z,time) at (x,z) with heading h (0 = +X).
function boatMatrix(out, x, z, h, L, B, heightAt, time, baseY, calm = 0.75) {
  const c = Math.cos(h), s = Math.sin(h), hl = L * 0.4, hb = B * 0.45;
  let hBow = baseY, hSt = baseY, hP = baseY, hS = baseY;
  if (heightAt) { hBow = heightAt(x + c * hl, z + s * hl, time); hSt = heightAt(x - c * hl, z - s * hl, time); hP = heightAt(x - s * hb, z + c * hb, time); hS = heightAt(x + s * hb, z - c * hb, time); }
  _bx.set(c * 2 * hl, (hBow - hSt) * calm, s * 2 * hl).normalize();
  _bz.set(-s * 2 * hb, (hP - hS) * calm, c * 2 * hb).normalize();
  _by.crossVectors(_bz, _bx).normalize(); _bz.crossVectors(_bx, _by);
  return out.makeBasis(_bx, _by, _bz).setPosition(x, (hBow + hSt + hP + hS) / 4, z);
}

// One boat. opts: { rng, type:'rowboat'|'sailboat'|'junk'|'gondola', palette, lit, heightAt(x,z,time), position, heading, y, mats, night }
export function makeBoat(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'boat'), type = opts.type || rng.pick(BOAT_TYPES);
  const b = new Builder(1024), wires = new Wires(), dims = boatInto(b, wires, type, rng, opts.palette, opts.lit ?? 1);
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (wires.n) object.add(wires.mesh(mats.wire));
  const p = opts.position ? vec3(opts.position) : new THREE.Vector3(), heading = opts.heading ?? 0;
  object.matrixAutoUpdate = false; boatMatrix(object.matrix, p.x, p.z, heading, dims.L, dims.B, opts.heightAt, 0, opts.y ?? p.y);
  return result(object, mats, {
    type, length: dims.L, beam: dims.B, triangles: b.triangles + wires.i.length / 3,
    update(dt, time) { mats.update(dt, time); if (opts.heightAt) boatMatrix(object.matrix, p.x, p.z, heading, dims.L, dims.B, opts.heightAt, time, 0); },
  });
}

// A fleet: instanced per boat variant, bobbing on heightAt and optionally sailing slow circles.
// opts: { rng, count, types, variants, positions | area:{ center:[x,z], size:[sx,sz] }, clear:(x,z)=>bool, heightAt, y, speed (m/s), lit, palette, mats, night }
export function makeBoats(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'boats'), types = opts.types || BOAT_TYPES, nVar = opts.variants ?? 2;
  const area = opts.area || { center: [0, 0], size: [200, 200] }, n = opts.positions ? opts.positions.length : (opts.count ?? 14);
  const object = new THREE.Group(), fleets = [], boats = [];
  for (const type of types) for (let k = 0; k < nVar; k++) {
    const b = new Builder(1024), wires = new Wires(), dims = boatInto(b, wires, type, rng.fork(type + k), opts.palette, opts.lit ?? 1);
    fleets.push({ type, dims, geo: b.toGeometry(), rig: wires.n ? wires.geometry() : null, list: [] });
  }
  for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
    let x, z;
    if (opts.positions) { const p = vec3(opts.positions[i]); x = p.x; z = p.z; }
    else { x = area.center[0] + (rng() - 0.5) * area.size[0]; z = area.center[1] + (rng() - 0.5) * area.size[1]; if (opts.clear && !opts.clear(x, z)) continue; if (boats.some((q) => Math.hypot(q.x - x, q.z - z) < 14)) continue; }
    const f = fleets[Math.floor(rng() * fleets.length)], big = f.type === 'junk' || f.type === 'sailboat';
    const speed = (opts.speed ?? 1.2) * (opts.moving === false ? 0 : (big ? rng.range(0.6, 1.4) : rng.chance(0.5) ? rng.range(0.3, 0.8) : 0));
    const boat = { x, z, h: opts.headings ? opts.headings[i] : rng() * TAU, R: rng.range(40, 110) * (rng.chance(0.5) ? 1 : -1), speed, fleet: f, idx: f.list.length, ph: rng() * TAU };
    if (boat.speed > 0 && opts.clear) {                               // keep the whole sailing circle clear
      const ok = (R) => { const cx = x - Math.sin(boat.h) * R, cz = z + Math.cos(boat.h) * R; for (let k = 1; k < 12; k++) { const an = boat.h + k / 12 * TAU; if (!opts.clear(cx + Math.sin(an) * R, cz - Math.cos(an) * R)) return false; } return true; };
      const R0 = boat.R, pick = [R0, -R0, R0 * 0.55, -R0 * 0.55, R0 * 0.3, -R0 * 0.3].find(ok);
      if (pick == null) boat.speed = 0; else boat.R = pick;
    }
    f.list.push(boat); boats.push(boat); i++;
  }
  let tris = 0;
  for (const f of fleets) {
    if (!f.list.length) continue;
    f.mesh = new THREE.InstancedMesh(f.geo, mats.facades, f.list.length); f.mesh.frustumCulled = false; object.add(f.mesh);
    if (f.rig) { f.rigMesh = new THREE.InstancedMesh(f.rig, mats.wire, f.list.length); f.rigMesh.frustumCulled = false; f.rigMesh.renderOrder = 1; object.add(f.rigMesh); }
    tris += f.list.length * (f.geo.index.count + (f.rig ? f.rig.index.count : 0)) / 3;
  }
  const anyMoving = boats.some((q) => q.speed > 0), live = fleets.filter((f) => f.mesh);
  const place2 = (time) => {
    for (let i = 0; i < boats.length; i++) {
      const bt = boats[i];
      let x = bt.x, z = bt.z, h = bt.h;
      if (bt.speed > 0) { const a = bt.speed * time / bt.R, cx = bt.x - Math.sin(bt.h) * bt.R, cz = bt.z + Math.cos(bt.h) * bt.R; x = cx + Math.sin(bt.h + a) * bt.R; z = cz - Math.cos(bt.h + a) * bt.R; h = bt.h + a; }
      boatMatrix(_m4, x, z, h, bt.fleet.dims.L, bt.fleet.dims.B, opts.heightAt, time, opts.y ?? 0);
      bt.fleet.mesh.setMatrixAt(bt.idx, _m4); if (bt.fleet.rigMesh) bt.fleet.rigMesh.setMatrixAt(bt.idx, _m4);
      bt.cx = x; bt.cz = z;
    }
    for (let i = 0; i < live.length; i++) { live[i].mesh.instanceMatrix.needsUpdate = true; if (live[i].rigMesh) live[i].rigMesh.instanceMatrix.needsUpdate = true; }
  };
  place2(0);
  return result(object, mats, { boats, count: boats.length, triangles: tris, update(dt, time) { mats.update(dt, time); if (opts.heightAt || anyMoving) place2(time); } });
}

// ---------- piers ----------
// opts: { rng, length, width, height (deck above y=0), from, to, pileDepth, lamps, railing, head (T-shaped end), palette, mats, night, position, rotationY }
// Local frame: runs along X from -L/2 (shore) to +L/2 (sea), deck top at y = height.
export function makePier(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'pier'), P = palette({ wood: '#7a5c3e', pile: '#3f3024', rail: '#5a4430', lamp: WARM, metal: '#1d2226' }, opts.palette);
  const object = new THREE.Group(); let L = opts.length ?? 46;
  if (opts.from && opts.to) L = spanPlace(object, opts.from, opts.to); else place(object, opts);
  const W = opts.width ?? 4, H = opts.height ?? 1.8, deep = opts.pileDepth ?? 4, hw = W / 2, b = new Builder(2048), halos = new Halos();
  const head = opts.head ?? true, hl = head ? Math.min(10, L * 0.25) : 0, hwid = W * 2.2;
  // deck boards run across the pier: uv.x follows X
  const board = (x0, x1, z0, z1) => {
    b.col(P.wood, 1, 1).surf(SURF.PLANKS);
    const i0 = b.v(x0, H, z1, 0, 1, 0, ...P.wood, x0 * 1.1, z1), i1 = b.v(x1, H, z1, 0, 1, 0, ...P.wood, x1 * 1.1, z1), i2 = b.v(x1, H, z0, 0, 1, 0, ...P.wood, x1 * 1.1, z0), i3 = b.v(x0, H, z0, 0, 1, 0, ...P.wood, x0 * 1.1, z0);
    b.quad4(i0, i1, i2, i3);
    b.col(mul3(P.wood, 0.45)).surf(SURF.PLAIN); b.quad([x0, H - 0.2, z0], [x1, H - 0.2, z0], [x1, H - 0.2, z1], [x0, H - 0.2, z1]);
    b.col(mul3(P.wood, 0.7), 0.8, 1); b.wall(x0, z1, x1, z1, H - 0.28, H + 0.02); b.wall(x1, z0, x0, z0, H - 0.28, H + 0.02); b.wall(x1, z1, x1, z0, H - 0.28, H + 0.02); b.wall(x0, z0, x0, z1, H - 0.28, H + 0.02);
  };
  board(-L / 2, L / 2 - hl, -hw, hw); if (head) board(L / 2 - hl, L / 2, -hwid / 2, hwid / 2);
  const pile = (x, z, tall) => { b.col(P.pile, 0.5, 1).surf(SURF.PLAIN); b.lathe(x, -deep, z, [[0.19, 0], [0.16, deep + H + (tall ? 0.9 : -0.1)], [0, deep + H + (tall ? 0.95 : -0.1)]], 6); };
  const step = 4.2, np = Math.max(2, Math.round((L - hl) / step));
  for (let i = 0; i <= np; i++) {
    const x = -L / 2 + (L - hl) * i / np; if (head && i === np) continue;
    pile(x, -hw + 0.15, i % 3 === 1); pile(x, hw - 0.15, i % 3 === 2);
    b.col(P.pile, 0.8, 1); b.beam([x, H - 0.38, -hw], [x, H - 0.38, hw], 0.16, 0.2);
    if (i % 2 === 0 && H > 1.2) b.beam([x, 0.15, -hw + 0.15], [x, H - 0.45, hw - 0.15], 0.08, 0.12);
  }
  if (head) for (const sx of [0, 1]) for (let j = 0; j < 4; j++) pile(L / 2 - hl + 0.3 + sx * (hl - 0.6), lerp(-hwid / 2 + 0.2, hwid / 2 - 0.2, j / 3), (j + sx) % 2 === 0);
  if (opts.railing ?? true) { b.col(P.rail, 1, 1).surf(SURF.PLAIN); railing(b, [-L / 2, H, -hw + 0.08], [L / 2 - hl, H, -hw + 0.08], 1.0, 2.1, 0.07); }
  const lampPos = [];
  if (opts.lamps !== false) for (let x = -L / 2 + 5; x < L / 2 - 1; x += opts.lampSpacing ?? 11) {
    const z = x > L / 2 - hl ? -hwid / 2 + 0.3 : -hw + 0.1, y = H;
    b.col(P.metal, 0.8, 1).surf(SURF.PLAIN); b.lathe(x, y, z, [[0.07, 0], [0.05, 2.9], [0.14, 3.0]], 5);
    glowBox(b, x, y + 3.2, z, 0.3, 0.4, 0.3, P.lamp, 2.2); halos.add(x, y + 3.2, z, 1.8, mul3(P.lamp, 1.1)); halos.add(x, y + 0.05, z + 1.2, 6, mul3(P.lamp, 0.26), 1);
    lampPos.push([x, y + 3.2, z]);
  }
  if (opts.ladder ?? true) { const x = L / 2 + 0.06; b.col(P.metal).surf(SURF.PLAIN); for (const s of [-0.25, 0.25]) b.beam([x, -1.2, s], [x, H + 0.9, s], 0.05, 0.05); for (let y = -1; y < H; y += 0.35) b.beam([x, y, -0.25], [x, y, 0.25], 0.035, 0.035); }
  for (let i = 0; i < 3 && head; i++) { b.col(vary(P.wood, rng, 0.15), 0.8, 1).surf(SURF.PLANKS); const s = rng.range(0.6, 0.95); b.tr(L / 2 - hl + rng.range(1, hl - 1), H, rng.range(0.25, 0.45) * hwid, rng() * TAU); b.cbox(0, 0, 0, s, s * 0.8, s, { m: 2 }); b.pop(); }
  object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo));
  return result(object, mats, { length: L, width: W, deckHeight: H, lamps: lampPos, end: [L / 2, H, 0], triangles: b.triangles + halos.n * 2 });
}

// World-space position of a local point under the builder's current transform.
Builder.prototype.wp = function (x, y, z) {
  const m = this.m; if (!m) return [x, y, z];
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
};
// Flat quad emitted on both faces.
Builder.prototype.quad2 = function (a, b, c, d, uv) { this.quad(a, b, c, d, uv); this.quad(b, a, d, c, uv && [uv[2], uv[1], uv[0], uv[3]]); return this; };

// Collect positions (+ yaw facing the path) from positions/yaws, an `along` spec, or a line.
function layout(opts, defSpacing, defOffset) {
  const out = [];
  if (opts.positions) opts.positions.forEach((p, i) => { const v = vec3(p); out.push({ x: v.x, y: v.y, z: v.z, yaw: opts.yaws ? opts.yaws[i] : 0 }); });
  if (opts.along) {
    const a = opts.along, sm = sampler(a.path || a.curve || a.points), sp = a.spacing ?? defSpacing, off = a.offset ?? defOffset, tp = new THREE.Vector3(), tt = new THREE.Vector3();
    let k = 0;
    for (let d = a.from ?? sp / 2; d <= (a.to ?? sm.length); d += sp, k++) {
      sm.at(d, tp); sm.tan(d, tt);
      for (const s of a.both === false ? [a.side ?? 1] : (a.stagger ? [k % 2 ? 1 : -1] : [1, -1])) {
        const x = tp.x + tt.z * off * s, z = tp.z - tt.x * off * s;
        out.push({ x, y: a.heightAt ? a.heightAt(x, z) : (a.y ?? tp.y), z, yaw: Math.atan2(-tt.z * s, tt.x * s) });
      }
    }
  }
  return out;
}

// ---------- market stalls ----------
const STALL_PAL = { wood: '#6a4a30', canopy: ['#c23a2e', '#2f6ea8', '#d9a23a', '#3a8a5a', '#8a3f8f', '#e07a3a', '#e6dcc4'], goods: ['#e0452f', '#f0a030', '#e8d040', '#6ab04a', '#8a4a9a', '#f2efe6', '#c97a40'], lamp: WARM };
function stallInto(b, halos, rng, P, o = {}) {
  const w = o.width ?? rng.range(2.6, 3.6), d = 2.1, hF = 2.15, hB = 2.8, canopy = rng.pick(P.canopy), wood = vary(P.wood, rng, 0.12);
  b.col(wood, 0.75, 1).surf(SURF.PLAIN);
  for (const sx of [-1, 1]) { b.beam([sx * w / 2, 0, d / 2], [sx * w / 2, hF, d / 2], 0.09, 0.09); b.beam([sx * w / 2, 0, -d / 2], [sx * w / 2, hB, -d / 2], 0.09, 0.09); b.beam([sx * w / 2, hF, d / 2], [sx * w / 2, hB, -d / 2], 0.07, 0.07); }
  const n = Math.max(3, Math.round(w / 0.42));
  b.col(canopy, 0.9, 1).surf(SURF.STRIPES, 0, 1);
  b.quad2([-w / 2 - 0.25, hF - 0.12, d / 2 + 0.55], [w / 2 + 0.25, hF - 0.12, d / 2 + 0.55], [w / 2 + 0.25, hB + 0.06, -d / 2 - 0.12], [-w / 2 - 0.25, hB + 0.06, -d / 2 - 0.12], [0, 0, n, 1]);
  b.quad2([-w / 2 - 0.25, hF - 0.42, d / 2 + 0.55], [w / 2 + 0.25, hF - 0.42, d / 2 + 0.55], [w / 2 + 0.25, hF - 0.12, d / 2 + 0.55], [-w / 2 - 0.25, hF - 0.12, d / 2 + 0.55], [0, 0, n, 1]);
  b.col(wood, 0.8, 1).surf(SURF.PLANKS); b.box(-w / 2 + 0.08, 0, d / 2 - 0.85, w / 2 - 0.08, 0.92, d / 2 - 0.05, { m: 1, capStyle: SURF.PLANKS, capM: 1 });
  const ng = Math.max(3, Math.round(w / 0.5));
  for (let i = 0; i < ng; i++) {
    const x = -w / 2 + 0.35 + (w - 0.7) * i / (ng - 1), g = vary(rng.pick(P.goods), rng, 0.12, 0.04), hh = rng.range(0.16, 0.3);
    b.col(mul3(wood, 1.25), 0.85, 1).surf(SURF.PLAIN); b.box(x - 0.2, 0.92, d / 2 - 0.72, x + 0.2, 0.92 + hh, d / 2 - 0.16, { capColor: g });
    if (rng.chance(0.5)) { b.col(g, 0.8, 1.1); b.sphere(x + rng.range(-0.05, 0.05), 0.92 + hh + 0.09, d / 2 - 0.44 + rng.range(-0.1, 0.1), 0.13, 6, 4); }
  }
  for (let i = 0; i < 2; i++) { b.col(vary(P.wood, rng, 0.25), 0.7, 1).surf(SURF.PLANKS); const s = rng.range(0.5, 0.8); b.cbox(rng.range(-0.35, 0.35) * w, 0, -d / 2 + 0.5, s, s * rng.range(0.7, 1.2), s, { m: 2 }); }
  b.surf(SURF.PLAIN);
  const lx = rng.range(-0.25, 0.25) * w, ly = hF - 0.55, lz = d / 2 + 0.15;
  b.col(wood); b.beam([lx, ly + 0.2, lz], [lx, hF + 0.05, lz], 0.02, 0.02);
  glowBox(b, lx, ly, lz, 0.24, 0.32, 0.24, P.lamp, 2.2);
  const wpp = b.wp(lx, ly, lz); halos.add(wpp[0], wpp[1], wpp[2], 1.5, mul3(P.lamp, 0.95));
  const gp = b.wp(0, 0.06, d / 2 + 0.9); halos.add(gp[0], gp[1], gp[2], 3.6, mul3(P.lamp, 0.24), 1);
  return { w, d };
}

// One stall, or a whole market merged into a single mesh.
// opts: { rng, count, positions, yaws, along:{ path, offset, spacing, both, stagger, heightAt }, palette:{ wood, canopy[], goods[], lamp }, mats, night, position, rotationY }
// makeMarketAsync(opts, ctx.yield, every = 10) is the same market laid in steps that hand the page back in between (same result, same
// random draws): after every `every` stalls, and once more just before the geometry is made, which is one step (when the last stall
// completes a group the two hand-backs are one: 67 stalls hand back 7 times). The first stalls of a session run slowest, so pass a
// smaller `every` for shorter steps.   `const market = await S.makeMarketAsync({ ... }, ctx.yield);`
export function makeMarket(opts = {}) { const it = marketSteps(opts, 0); let r; while (!(r = it.next()).done); return r.value; }
export async function makeMarketAsync(opts = {}, yieldFn, every = 10) {
  const it = marketSteps(opts, every); let r;
  while (!(r = it.next()).done) if (yieldFn) await yieldFn();
  return r.value;
}
// The work as a generator, written once for both: a yield after every `every` stalls (none unless every is 1 or more) and one before
// the geometry is made. makeMarket runs it to the end in one piece; makeMarketAsync hands the page back at each yield.
function* marketSteps(opts, every) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'market'), P = palette(STALL_PAL, opts.palette), b = new Builder(4096), halos = new Halos();
  let spots = layout(opts, 5, 7);
  if (!spots.length) { const n = opts.count ?? 1; for (let i = 0; i < n; i++) spots.push({ x: (i - (n - 1) / 2) * 4.4, y: 0, z: 0, yaw: 0 }); }
  let k = 0;
  for (const s of spots) { b.tr(s.x, s.y, s.z, s.yaw); stallInto(b, halos, rng, P, opts); b.pop(); if (every >= 1 && ++k % every === 0 && k < spots.length) yield; }
  yield;
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); object.add(halos.mesh(mats.halo)); place(object, opts);
  return result(object, mats, { stalls: spots, count: spots.length, triangles: b.triangles + halos.n * 2 });
}
export const makeStall = (opts = {}) => makeMarket(Object.assign({ count: 1 }, opts));

// ---------- tents ----------
const TENT_PAL = { canvas: ['#e6dcc0', '#d9c9a0', '#c9b890', '#e8e0d0', '#b8a888'], accent: ['#b8322a', '#2f5f9a', '#d9a23a', '#3a7a5a'], pole: '#4a3526', dark: '#1a1512', lamp: WARM };
export const TENT_TYPES = ['ridge', 'bell', 'yurt', 'tipi', 'bigtop'];
function tentInto(b, halos, rng, type, P, o = {}) {
  const lit = o.lit ?? (rng.chance(0.75) ? rng.range(0.7, 1.2) : 0), s = o.size ?? 1, canvas = vary(rng.pick(P.canvas), rng, 0.06), accent = rng.pick(P.accent), seed = rng();
  const C = (c, g0 = 0.8, g1 = 1) => b.col(c, g0, g1).surf(SURF.CANVAS, seed, lit);
  if (type === 'ridge') {
    const w = 3.2 * s, l = 4.4 * s, h = 2.2 * s;
    C(canvas); b.quad([-w / 2, 0, l / 2], [-w / 2, 0, -l / 2], [0, h, -l / 2], [0, h, l / 2], [0, 0, 3, 1]); b.quad([w / 2, 0, -l / 2], [w / 2, 0, l / 2], [0, h, l / 2], [0, h, -l / 2], [0, 0, 3, 1]);
    b.tri([w / 2, 0, -l / 2], [-w / 2, 0, -l / 2], [0, h, -l / 2], mul3(canvas, 0.8), mul3(canvas, 0.8), canvas, [0.5, 0], [1.5, 0], [1, 1]);
    b.tri([-w / 2, 0, l / 2], [w / 2, 0, l / 2], [0, h, l / 2], mul3(canvas, 0.8), mul3(canvas, 0.8), canvas, [0.5, 0], [1.5, 0], [1, 1]);
    b.col(P.dark).surf(SURF.GLOW, 0, lit * 0.5); b.tri([-w * 0.16, 0, l / 2 + 0.02], [w * 0.16, 0, l / 2 + 0.02], [0, h * 0.72, l / 2 + 0.02], mul3(lin(WARM), 0.5));
    b.surf(SURF.PLAIN).col(P.pole); b.beam([0, 0, l / 2 + 0.03], [0, h + 0.15, l / 2 + 0.03], 0.05, 0.05); b.beam([0, 0, -l / 2 - 0.03], [0, h + 0.15, -l / 2 - 0.03], 0.05, 0.05);
    return { r: l * 0.6, h };
  }
  if (type === 'tipi') {
    const r = 2.5 * s, h = 5.4 * s;
    C(accent, 0.75, 0.95); b.lathe(0, 0, 0, [[r, 0], [r * 0.86, h * 0.14]], 10, { uvBand: [10, 0, 1] });
    C(canvas, 0.86, 1.05); b.lathe(0, 0, 0, [[r * 0.86, h * 0.14], [0.2 * s, h * 0.93]], 10, { uvBand: [10, 0.15, 1] });
    b.surf(SURF.PLAIN).col(P.pole);
    for (let i = 0; i < 6; i++) { const a = TAU * i / 6 + 0.3; b.beam([0.5 * s * Math.cos(a), h * 0.8, 0.5 * s * Math.sin(a)], [-0.55 * s * Math.cos(a), h * 1.16, -0.55 * s * Math.sin(a)], 0.05, 0.05); }
    b.col(P.dark).surf(SURF.GLOW, 0, lit * 0.6); b.tri([-0.5 * s, 0, r * 0.97], [0.5 * s, 0, r * 0.97], [0, 1.9 * s, r * 0.69], mul3(lin(WARM), 0.5));
    b.surf(SURF.PLAIN);
    return { r, h };
  }
  if (type === 'yurt') {
    const r = 3.7 * s, wh = 1.9 * s, h = 3.2 * s;
    C(canvas, 0.82, 1); b.lathe(0, 0, 0, [[r, 0], [r, wh]], 14, { uvBand: [14, 0, 0.5] });
    C(mul3(canvas, 1.04), 0.9, 1.05); b.lathe(0, 0, 0, [[r * 1.04, wh], [0.6 * s, h]], 14, { uvBand: [14, 0.45, 1] });
    b.surf(SURF.PLAIN).col(accent, 1, 1); b.lathe(0, 0, 0, [[r * 1.012, wh * 0.55], [r * 1.012, wh * 0.63]], 14); b.lathe(0, 0, 0, [[r * 1.05, wh - 0.08], [r * 1.05, wh + 0.06]], 14);
    b.col(P.pole); b.lathe(0, 0, 0, [[0.62 * s, h - 0.02], [0.62 * s, h + 0.12], [0.45 * s, h + 0.12]], 8);
    b.col(lin(WARM)).surf(SURF.GLOW, 0, lit * 1.2); b.disc(0, h + 0.1, 0, 0.45 * s, 8);
    b.surf(SURF.PLAIN); winDecal(b, rng, 0, 0.95 * s, r + 0.02, 1.1 * s, 1.75 * s, 0, SURF.CURTAIN, lit > 0 ? 0.4 : 0, accent);
    return { r, h };
  }
  if (type === 'bigtop') {
    const r = 13 * s, wh = 4.5 * s, h = 14 * s, n = 16, c2 = mix3(accent, canvas, 0.08);
    for (let j = 0; j < n; j++) {
      const a0 = TAU * j / n, a1 = TAU * (j + 1) / n, col = j % 2 ? canvas : c2;
      const p = (rr, y, a) => [rr * Math.cos(a), y, rr * Math.sin(a)];
      C(col, 0.72, 0.95); b.quad(p(r, 0, a1), p(r, 0, a0), p(r, wh, a0), p(r, wh, a1), [j, 0, j + 1, 0.3]);
      C(col, 0.95, 1.1); b.quad(p(r * 1.03, wh, a1), p(r * 1.03, wh, a0), p(1.0 * s, h, a0), p(1.0 * s, h, a1), [j, 0.3, j + 1, 1]);
      b.surf(SURF.PLAIN).col(j % 2 ? c2 : canvas, 1, 1); b.quad(p(r * 1.03, wh - 0.5 * s, a1), p(r * 1.03, wh - 0.5 * s, a0), p(r * 1.03, wh + 0.02, a0), p(r * 1.03, wh + 0.02, a1));
    }
    b.surf(SURF.PLAIN).col(P.pole); b.beam([0, h - 1, 0], [0, h + 3.5 * s, 0], 0.18, 0.18);
    b.col(accent); b.tri([0, h + 3.4 * s, 0], [0, h + 2.4 * s, 0], [2.6 * s, h + 2.9 * s, 0.3]); b.tri([0, h + 2.4 * s, 0], [0, h + 3.4 * s, 0], [2.6 * s, h + 2.9 * s, 0.3]);
    // entrance facing +Z
    const ew = 3.4 * s, eh = 3.6 * s;
    b.col(mul3(lin(WARM), 0.9)).surf(SURF.GLOW, 0, Math.max(0.25, lit)); panel(b, 0, eh / 2, r * Math.cos(Math.PI / n) + 0.05, ew, eh, 0);
    b.surf(SURF.PLAIN).col(accent, 0.9, 1); b.gable(-ew / 2 - 0.4, r * 0.96, ew / 2 + 0.4, r + 2.2 * s, eh, 1.1 * s, { alongX: false, overhang: 0.2, style: SURF.PLAIN, wallColor: accent });
    b.col(P.pole); for (const sx of [-1, 1]) b.beam([sx * (ew / 2 + 0.3), 0, r + 2.1 * s], [sx * (ew / 2 + 0.3), eh, r + 2.1 * s], 0.12, 0.12);
    if (halos) { const g = b.wp(0, 0.08, r + 3 * s); halos.add(g[0], g[1], g[2], 9 * s, mul3(lin(WARM), 0.3 * Math.max(0.25, lit)), 1); }
    const ring = []; for (let j = 0; j < n; j++) ring.push(b.wp(r * 1.03 * Math.cos(TAU * j / n), wh, r * 1.03 * Math.sin(TAU * j / n)));
    return { r, h: h + 3.5 * s, ring, peak: b.wp(0, h + 0.3, 0) };
  }
  // bell tent
  const r = 2.7 * s, wh = 0.75 * s, h = 3.3 * s;
  C(canvas, 0.8, 0.95); b.lathe(0, 0, 0, [[r, 0], [r, wh]], 12, { uvBand: [12, 0, 0.2] });
  C(canvas, 0.92, 1.05); b.lathe(0, 0, 0, [[r * 1.03, wh], [0.08, h]], 12, { uvBand: [12, 0.2, 1] });
  b.surf(SURF.PLAIN).col(P.pole); b.beam([0, h - 0.2, 0], [0, h + 0.35, 0], 0.05, 0.05);
  b.col(P.dark).surf(SURF.GLOW, 0, lit * 0.6); b.tri([-0.55 * s, 0, r * 1.0], [0.55 * s, 0, r * 1.0], [0, 1.85 * s, r * 0.62], mul3(lin(WARM), 0.5));
  b.surf(SURF.PLAIN);
  return { r, h };
}

// Tents glowing from inside at night. One tent (type) or a camp (count / positions / area).
// opts: { rng, type | types, count, positions, yaws, area:{ center:[x,z], size:[sx,sz] }, heightAt, clear, size, lit, palette, mats, night, position, rotationY }
export function makeTent(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'tent'), P = palette(TENT_PAL, opts.palette), b = new Builder(2048), halos = new Halos();
  const types = opts.types || (opts.type ? [opts.type] : ['ridge', 'bell', 'yurt', 'tipi']);
  let spots = layout(opts, 9, 10);
  if (!spots.length) {
    const n = opts.count ?? 1, a = opts.area;
    for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
      const x = a ? a.center[0] + (rng() - 0.5) * a.size[0] : (i - (n - 1) / 2) * 9, z = a ? a.center[1] + (rng() - 0.5) * a.size[1] : 0;
      if (a && opts.clear && !opts.clear(x, z)) continue;
      if (a && spots.some((q) => Math.hypot(q.x - x, q.z - z) < 8 * (opts.size ?? 1))) continue;
      spots.push({ x, y: opts.heightAt ? opts.heightAt(x, z) : 0, z, yaw: a ? rng() * TAU : 0 }); i++;
    }
  }
  const tents = [];
  for (const s of spots) { b.tr(s.x, s.y - 0.05, s.z, s.yaw); const info = tentInto(b, halos, rng, rng.pick(types), P, opts); b.pop(); tents.push(Object.assign({}, s, info)); }
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (halos.n) object.add(halos.mesh(mats.halo)); place(object, opts);
  return result(object, mats, { tents, count: tents.length, triangles: b.triangles + halos.n * 2 });
}

// ---------- ribbons: roads and railways ----------
// Samples a curve into frames { d, p, t, s } (s = side vector), draped on heightAt when given.
function frames(src, step, hAt, lift = 0, halfW = 0, straight, closed) {
  const sm = sampler(src, straight, closed), n = Math.max(2, Math.round(sm.length / step)), out = [], tp = new THREE.Vector3(), tt = new THREE.Vector3();
  closed = !!sm.closed;
  for (let i = 0; i <= n; i++) {
    const d = sm.length * i / n; sm.at(d, tp); sm.tan(d, tt);
    const l = Math.hypot(tt.x, tt.z) || 1, sx = tt.z / l, sz = -tt.x / l;
    let y = tp.y;
    if (hAt) y = Math.max(hAt(tp.x, tp.z), halfW ? hAt(tp.x + sx * halfW, tp.z + sz * halfW) : -1e9, halfW ? hAt(tp.x - sx * halfW, tp.z - sz * halfW) : -1e9);
    out.push({ d, p: new THREE.Vector3(tp.x, y + lift, tp.z), t: new THREE.Vector3(), s: new THREE.Vector3(sx, 0, sz) });
  }
  if (hAt) for (let k = 0; k < 2; k++) for (let i = 1; i < n; i++) out[i].p.y = (out[i - 1].p.y + out[i].p.y * 2 + out[i + 1].p.y) / 4;   // soften kinks
  if (closed) { out[0].p.y = out[n].p.y = (out[0].p.y + out[n].p.y) / 2; out[n].p.copy(out[0].p); out[n].s.copy(out[0].s); }
  for (let i = 0; i <= n; i++) out[i].t.subVectors(out[closed ? (i + 1) % n : Math.min(n, i + 1)].p, out[closed ? (i + n - 1) % n : Math.max(0, i - 1)].p).normalize();
  const length = sm.length;
  const at = (d, outP = new THREE.Vector3(), outT) => {
    if (closed) d = ((d % length) + length) % length;
    const f = clamp(d / length, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
    outP.lerpVectors(out[i].p, out[i + 1].p, k); if (outT) outT.lerpVectors(out[i].t, out[i + 1].t, k).normalize();
    if (d < 0) outP.addScaledVector(out[0].t, d); else if (d > length) outP.addScaledVector(out[n].t, d - length);
    return outP;
  };
  return { list: out, length, at, closed };
}
// Flat strip across frames between lateral offsets a..b, with uv u0..u1 across and metres along.
function strip(b, fr, a, c, dyA = 0, dyC = 0, u0 = 0, u1 = 1, colA, colC) {
  const base = b.nv, k = b.c; colA = colA || k; colC = colC || colA;
  for (const f of fr.list) {
    const ax = f.p.x + f.s.x * a, az = f.p.z + f.s.z * a, cx = f.p.x + f.s.x * c, cz = f.p.z + f.s.z * c;
    // normal: perpendicular to the strip's cross slope and the tangent
    let nx = -(dyC - dyA) * f.s.x * Math.sign(c - a), ny = Math.abs(c - a), nz = -(dyC - dyA) * f.s.z * Math.sign(c - a); const l = Math.hypot(nx, ny, nz) || 1;
    b.v(ax, f.p.y + dyA, az, nx / l, ny / l, nz / l, colA[0], colA[1], colA[2], u0, f.d);
    b.v(cx, f.p.y + dyC, cz, nx / l, ny / l, nz / l, colC[0], colC[1], colC[2], u1, f.d);
  }
  for (let i = 0; i < fr.list.length - 1; i++) { const q = base + i * 2; if (c > a) b.quad4(q + 1, q, q + 2, q + 3); else b.quad4(q, q + 1, q + 3, q + 2); }
}

// Road ribbon with lane markings. opts: { points | path | curve, closed, width, lanes (1|2|4), heightAt, lift, step, shoulder, straight, palette:{ asphalt, verge }, mats, night }
// Roads, tracks, fences and power lines are laid out in the space of their points; they take no position / rotationY.
export function makeRoad(opts = {}) {
  const mats = matsOf(opts), P = palette({ asphalt: '#33363b', verge: '#5a5548' }, opts.palette), W = opts.width ?? 8, b = new Builder(2048);
  const fr = frames(opts.points || opts.path || opts.curve, opts.step ?? 5, opts.heightAt, opts.lift ?? 0.12, W / 2, opts.straight, opts.closed);
  b.col(P.asphalt).surf(SURF.ROAD, 0, opts.lanes ?? 2); strip(b, fr, W / 2, -W / 2, 0, 0, 0, 1);
  const sh = opts.shoulder ?? 2.2;
  if (sh > 0) { b.surf(SURF.PLAIN); strip(b, fr, W / 2 + sh, W / 2, -sh * 0.6, 0, 0, 1, P.verge, mul3(P.verge, 0.85)); strip(b, fr, -W / 2, -W / 2 - sh, 0, -sh * 0.6, 0, 1, mul3(P.verge, 0.85), P.verge); }
  return result(meshOf(b.toGeometry(), mats.facades, opts), mats, { length: fr.length, width: W, at: fr.at, frames: fr.list, closed: fr.closed, triangles: b.triangles });
}

// Railway: ballast bed with sleepers drawn in the shader, and two steel rails.
// opts: { points | path | curve, closed (join an array of points into a loop), gauge, heightAt, lift, step, straight, palette:{ ballast, rail }, mats, night }
// Returns at(d, outPos, outTan) on the rail top for trains, and closed.
export function makeTracks(opts = {}) {
  const mats = matsOf(opts), P = palette({ ballast: '#6b665e', rail: '#8a8f96', side: '#4f4a43' }, opts.palette), G = opts.gauge ?? 1.5, b = new Builder(2048);
  const bw = G + 1.7, lift = opts.lift ?? 0.35;
  const fr = frames(opts.points || opts.path || opts.curve, opts.step ?? 4, opts.heightAt, lift, bw / 2, opts.straight, opts.closed);
  b.col(P.ballast).surf(SURF.TRACK); strip(b, fr, bw / 2, -bw / 2, 0, 0, 0, 1);
  b.surf(SURF.PLAIN); strip(b, fr, bw / 2 + 0.9, bw / 2, -lift - 0.5, 0, 0, 1, P.side, P.ballast); strip(b, fr, -bw / 2, -bw / 2 - 0.9, 0, -lift - 0.5, 0, 1, P.ballast, P.side);
  const rh = 0.16, rw = 0.075;
  for (const s of [-1, 1]) {
    const o = s * G / 2;
    b.col(mul3(P.rail, 1.5)); strip(b, fr, o + rw / 2, o - rw / 2, rh, rh);
    b.col(mul3(P.rail, 0.5)); strip(b, fr, o + rw / 2 + 0.001, o + rw / 2, 0, rh); strip(b, fr, o - rw / 2, o - rw / 2 - 0.001, rh, 0);
  }
  const at = (d, outP, outT) => { const p = fr.at(d, outP, outT); p.y += rh; return p; };
  return result(meshOf(b.toGeometry(), mats.facades, opts), mats, { length: fr.length, gauge: G, at, frames: fr.list, closed: fr.closed, railHeight: rh, triangles: b.triangles });
}

// ---------- trains ----------
const TRAIN_PAL = {
  steam: { body: ['#1c1e22', '#20302a', '#3a1c1c'], coach: ['#5a2a22', '#23402f', '#2a3550', '#6a4a2a'], roof: '#2a2c30', trim: '#c9a23a', metal: '#3a3d42', lamp: '#fff0c0', under: '#17181a' },
  bullet: { body: ['#eef0f2', '#e6eaee'], coach: ['#eef0f2'], roof: '#c9ced3', trim: ['#2f6fd0', '#d0402f', '#20a080'], metal: '#5a5f66', lamp: '#f4faff', under: '#22252a' },
  tram: { body: ['#c9402f', '#e0b030', '#2f8f6a', '#3a6fc0'], coach: ['#c9402f'], roof: '#d8d4c8', trim: '#f0ead8', metal: '#3a3d42', lamp: '#fff0c0', under: '#1c1d20' },
  freight: { body: ['#c2551f', '#2f5f8f', '#b8a02a'], coach: ['#8f2f2a', '#2f6a8f', '#3a7a4a', '#b8862a', '#6a6f76', '#7a3f8a'], roof: '#3a3d42', trim: '#e0d040', metal: '#3a3d42', lamp: '#fff0c0', under: '#17181a' },
};
function wheelSet(b, x, r, gauge, col) {
  b.col(col, 0.8, 1).surf(SURF.PLAIN);
  for (const s of [-1, 1]) { b.push(_m4.makeRotationX(s * Math.PI / 2).setPosition(x, r, s * (gauge / 2 - 0.02))); b.lathe(0, 0, 0, [[0, 0], [r, 0], [r, 0.12], [0, 0.12]], 10); b.pop(); }
}
function coachInto(b, rng, P, type, L, col, lit) {
  const W = type === 'tram' ? 2.5 : 2.9, y0 = type === 'bullet' || type === 'tram' ? 0.45 : 0.95, hh = type === 'bullet' ? 2.9 : type === 'tram' ? 2.7 : 2.5, G = 1.5;
  b.col(P.under, 1, 1).surf(SURF.PLAIN); b.box(-L / 2 + 0.6, 0.3, -W / 2 + 0.35, L / 2 - 0.6, y0, W / 2 - 0.35, { bottom: true });
  for (const x of [-L / 2 + 2.2, L / 2 - 2.2]) { wheelSet(b, x - 0.75, 0.46, G, P.metal); wheelSet(b, x + 0.75, 0.46, G, P.metal); }
  if (type === 'freight' || type === 'tender') {
    const ch = type === 'tender' ? 1.9 : 2.6;
    b.col(col, 0.75, 1).surf(type === 'tender' ? SURF.PLAIN : SURF.PLANKS);
    b.box(-L / 2 + 0.3, y0, -W / 2, L / 2 - 0.3, y0 + ch, W / 2, { m: 1.4, capColor: type === 'tender' ? [0.012, 0.012, 0.014] : mul3(col, 0.8), capStyle: SURF.PLAIN });
    if (type === 'tender') { b.col([0.014, 0.014, 0.016], 1, 1).surf(SURF.PLAIN); b.frustum(0, 0, L - 1.4, W - 0.5, L * 0.5, W * 0.4, y0 + ch, y0 + ch + 0.45); }
    b.surf(SURF.PLAIN);
    return;
  }
  b.col(col, 0.8, 1).surf(SURF.RIBBON, rng(), 2.2 * lit);
  const cw = type === 'bullet' ? 1.1 : 1.5;
  b.wall(-L / 2 + 0.25, W / 2, L / 2 - 0.25, W / 2, y0, y0 + hh, { cellW: cw, rows: 1 }); b.wall(L / 2 - 0.25, -W / 2, -L / 2 + 0.25, -W / 2, y0, y0 + hh, { cellW: cw, rows: 1 });
  b.surf(SURF.PLAIN); b.wall(L / 2 - 0.25, W / 2, L / 2 - 0.25, -W / 2, y0, y0 + hh); b.wall(-L / 2 + 0.25, -W / 2, -L / 2 + 0.25, W / 2, y0, y0 + hh);
  if (P.trimLine !== false) { b.col(P.trim); for (const s of [-1, 1]) b.beam([-L / 2 + 0.25, y0 + hh * 0.2, s * (W / 2 + 0.01)], [L / 2 - 0.25, y0 + hh * 0.2, s * (W / 2 + 0.01)], 0.03, 0.16); }
  // arched roof
  b.col(P.roof, 0.9, 1); const yt = y0 + hh, rr = 0.45;
  b.quad([-L / 2 + 0.25, yt, W / 2], [L / 2 - 0.25, yt, W / 2], [L / 2 - 0.25, yt + rr, W * 0.28], [-L / 2 + 0.25, yt + rr, W * 0.28]);
  b.quad([L / 2 - 0.25, yt, -W / 2], [-L / 2 + 0.25, yt, -W / 2], [-L / 2 + 0.25, yt + rr, -W * 0.28], [L / 2 - 0.25, yt + rr, -W * 0.28]);
  b.quad([-L / 2 + 0.25, yt + rr, W * 0.28], [L / 2 - 0.25, yt + rr, W * 0.28], [L / 2 - 0.25, yt + rr, -W * 0.28], [-L / 2 + 0.25, yt + rr, -W * 0.28]);
  for (const s of [-1, 1]) { const x = s * (L / 2 - 0.25); const A = [x, yt, W / 2], B = [x, yt, -W / 2], C = [x, yt + rr, -W * 0.28], D = [x, yt + rr, W * 0.28]; if (s > 0) b.quad(A, B, C, D); else b.quad(B, A, D, C); }
}
function locoInto(b, rng, P, type, L, lit) {
  const G = 1.5, col = P.body;
  if (type === 'steam') {
    b.col(P.under).surf(SURF.PLAIN); b.box(-L / 2 + 0.3, 0.55, -1.0, L / 2 - 0.6, 1.15, 1.0, { bottom: true });
    for (const x of [-1.9, -0.2, 1.5]) wheelSet(b, x, 0.82, G, P.metal); wheelSet(b, 3.5, 0.45, G, P.metal); wheelSet(b, 4.4, 0.45, G, P.metal);
    b.col(P.metal); for (const s of [-1, 1]) b.beam([-1.9, 0.55, s * (G / 2 + 0.16)], [1.5, 0.55, s * (G / 2 + 0.16)], 0.08, 0.12);
    b.col(col, 0.8, 1.1); b.push(_m4.makeRotationZ(-Math.PI / 2).setPosition(-1.6, 2.15, 0)); b.lathe(0, 0, 0, [[0, 0], [1.02, 0], [1.02, 6.3], [1.1, 6.3], [1.1, 6.6], [0.7, 6.75], [0, 6.75]], 12); b.pop();
    b.col(P.trim); for (const x of [0.2, 2.2, 4.2]) { b.push(_m4.makeRotationZ(-Math.PI / 2).setPosition(x, 2.15, 0)); b.lathe(0, 0, 0, [[1.035, 0], [1.035, 0.1]], 12); b.pop(); }
    b.col(col, 0.85, 1.1); b.lathe(3.9, 3.05, 0, [[0.32, 0], [0.26, 0.9], [0.42, 1.25], [0.42, 1.35], [0.3, 1.35]], 8);                    // chimney
    b.col(P.trim, 0.9, 1.2); b.lathe(1.9, 3.05, 0, [[0.4, 0], [0.4, 0.3], [0.25, 0.55], [0, 0.6]], 8, { smooth: true });
    b.col(col, 0.9, 1.1); b.lathe(0.4, 3.05, 0, [[0.34, 0], [0.34, 0.25], [0.2, 0.42], [0, 0.45]], 8, { smooth: true });
    b.col(col, 0.8, 1).surf(SURF.PLAIN); b.box(-L / 2 + 0.3, 1.15, -1.3, -1.5, 3.6, 1.3, { capColor: P.roof });                              // cab
    b.col(P.roof); b.box(-L / 2 + 0.1, 3.6, -1.45, -1.3, 3.72, 1.45, { bottom: true });
    for (const s of [-1, 1]) winDecal(b, rng, -2.6, 2.75, s * 1.3, 1.1, 0.8, s > 0 ? 0 : Math.PI, SURF.CURTAIN, 2.5 * lit, P.trim);
    glowBox(b, -1.48, 1.9, 0, 0.06, 0.5, 0.7, [1, 0.42, 0.12], 1.6 * lit);                                                                   // firebox glow
    b.col(P.under); b.frustum(L / 2 - 0.25, 0, 0.7, 2.6, 0.1, 1.2, 0.15, 1.05, { topX: 0.5 });                                              // cowcatcher
    glowBox(b, 5.0, 3.35, 0, 0.3, 0.42, 0.42, P.lamp, 3.2);
    return { head: [5.2, 3.35, 0] };
  }
  if (type === 'bullet') {
    const W = 2.9, y0 = 0.45, hh = 2.9;
    b.col(P.under).surf(SURF.PLAIN); b.box(-L / 2 + 0.6, 0.3, -W / 2 + 0.35, L / 2 - 3, y0, W / 2 - 0.35, { bottom: true });
    for (const x of [-L / 2 + 2.2, L / 2 - 5]) { wheelSet(b, x - 0.75, 0.46, G, P.metal); wheelSet(b, x + 0.75, 0.46, G, P.metal); }
    const xn = L / 2 - 7.5;                                           // nose starts here
    b.col(col, 0.8, 1).surf(SURF.RIBBON, rng(), 2.2 * lit);
    b.wall(-L / 2 + 0.25, W / 2, xn, W / 2, y0, y0 + hh, { cellW: 1.1, rows: 1 }); b.wall(xn, -W / 2, -L / 2 + 0.25, -W / 2, y0, y0 + hh, { cellW: 1.1, rows: 1 });
    b.surf(SURF.PLAIN); b.wall(-L / 2 + 0.25, -W / 2, -L / 2 + 0.25, W / 2, y0, y0 + hh);
    b.col(P.roof, 0.9, 1); b.quad([-L / 2 + 0.25, y0 + hh, W / 2], [xn, y0 + hh, W / 2], [xn, y0 + hh + 0.4, W * 0.28], [-L / 2 + 0.25, y0 + hh + 0.4, W * 0.28]);
    b.quad([xn, y0 + hh, -W / 2], [-L / 2 + 0.25, y0 + hh, -W / 2], [-L / 2 + 0.25, y0 + hh + 0.4, -W * 0.28], [xn, y0 + hh + 0.4, -W * 0.28]);
    b.quad([-L / 2 + 0.25, y0 + hh + 0.4, W * 0.28], [xn, y0 + hh + 0.4, W * 0.28], [xn, y0 + hh + 0.4, -W * 0.28], [-L / 2 + 0.25, y0 + hh + 0.4, -W * 0.28]);
    // nose: a lofted shell tapering to the tip
    const NL = 7.6;
    b.col(col, 1, 1); b.grid(8, 8, (u, v) => {
      const k = Math.pow(1 - u, 0.6), hw = (W / 2) * (0.12 + 0.88 * k), top = y0 + 0.35 + (hh + 0.05) * Math.pow(1 - u, 0.85);
      const ph = Math.PI * v, c = Math.cos(ph), sn = Math.sin(ph), sq = 0.6;
      return [xn + NL * u, lerp(y0, top, Math.pow(sn, sq)), -hw * Math.sign(c) * Math.pow(Math.abs(c), sq)];
    }, { flip: true, colorFn: (u, v) => { const e = Math.abs(v - 0.5) * 2; return e > 0.55 && e < 0.78 ? P.trim : (u > 0.16 && u < 0.5 && e < 0.42 ? [0.02, 0.03, 0.04] : col); } });
    b.col(P.under); b.box(xn + NL - 0.3, y0 - 0.1, -W * 0.08, xn + NL + 0.02, y0 + 0.36, W * 0.08, { bottom: true });
    b.col(P.trim); for (const s of [-1, 1]) b.beam([-L / 2 + 0.25, y0 + hh * 0.3, s * (W / 2 + 0.012)], [xn, y0 + hh * 0.3, s * (W / 2 + 0.012)], 0.03, 0.3);
    for (const s of [-1, 1]) glowBox(b, L / 2 - 0.9, 1.05, s * 0.55, 0.3, 0.14, 0.3, P.lamp, 3);
    return { head: [L / 2 - 0.4, 1.1, 0] };
  }
  // tram / diesel: a coach with a cab face
  coachInto(b, rng, Object.assign({}, P), type === 'freight' ? 'tram' : type, L, col, lit);
  const W = 2.5, yl = type === 'tram' ? 1.0 : 1.4;
  for (const s of [-1, 1]) glowBox(b, L / 2 - 0.22, yl, s * 0.75, 0.1, 0.22, 0.3, P.lamp, 3);
  winDecal(b, rng, L / 2 - 0.24, 2.25, 0, W * 0.8, 1.2, Math.PI / 2, SURF.CURTAIN, 1.5 * lit, P.under);
  if (type === 'tram') { b.col(P.metal).surf(SURF.PLAIN); b.beam([-0.8, 3.6, 0], [0.3, 4.6, 0], 0.06, 0.06); b.beam([0.3, 4.6, 0], [-0.6, 5.3, 0], 0.06, 0.06); b.beam([-0.6, 5.3, -0.7], [-0.6, 5.3, 0.7], 0.06, 0.06); }
  return { head: [L / 2 + 0.1, yl, 0] };
}

// A train running along tracks. opts: { rng, track (makeTracks result) | points | path | curve, closed, type:'steam'|'bullet'|'tram'|'freight',
//   cars, speed (m/s), start, loop:true|'pingpong'|false, fade (m), lit, beam, palette, mats, night }
// On a closed track the train circulates for ever. On an open one each vehicle shrinks to nothing over the last `fade` metres
// (default 10) beyond either end, so the train emerges from the start and is swallowed at the end like at a tunnel mouth:
// hide the two ends (tunnel, station, building, far haze). loop:'pingpong' keeps the whole train on the track and reverses instead.
export function makeTrain(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'train'), type = opts.type || 'steam';
  const src = TRAIN_PAL[type] || TRAIN_PAL.steam, P = {};
  for (const k in src) P[k] = lin(Array.isArray(src[k]) ? rng.pick(src[k]) : src[k]);
  if (opts.palette) for (const k in opts.palette) P[k] = lin(opts.palette[k]);
  const track = opts.track || (() => { const fr = frames(opts.points || opts.path || opts.curve, 4, null, 0, 0, opts.straight, opts.closed); return { length: fr.length, at: fr.at, closed: fr.closed }; })();
  const closed = opts.closed ?? track.closed ?? false, fade = Math.max(0.01, opts.fade ?? 10), TL = track.length;
  const lit = opts.lit ?? 1, nCars = opts.cars ?? { steam: 5, bullet: 7, tram: 1, freight: 9 }[type];
  const locoL = { steam: 11, bullet: 24, tram: 13, freight: 16 }[type], carL = { steam: 15, bullet: 24, tram: 12, freight: 13 }[type], gap = 0.7;
  const object = new THREE.Group();
  const lb = new Builder(2048), lh = locoInto(lb, rng, P, type, locoL, lit);
  const loco = new THREE.Mesh(lb.toGeometry(), mats.facades); loco.matrixAutoUpdate = false; loco.frustumCulled = false; object.add(loco);
  const halos = new Halos(); halos.add(lh.head[0], lh.head[1], lh.head[2], 2.6, mul3(P.lamp, 1.3));
  const hm = halos.mesh(mats.halo); hm.frustumCulled = false; loco.add(hm);
  if (opts.beam !== false) { const bg = beamGeometry(55, 7, mul3(P.lamp, 0.5)); const bm = new THREE.Mesh(bg, mats.beam); bm.geometry.setDrawRange(0, bg.index.count / 2); bm.position.set(lh.head[0], lh.head[1], lh.head[2]); bm.rotation.z = -0.07; bm.frustumCulled = false; bm.renderOrder = 3; loco.add(bm); }
  // coaches: one geometry per colour variant, instanced
  const variants = type === 'freight' ? 4 : type === 'steam' ? 2 : 1, cars = [], fleets = [];
  for (let k = 0; k < variants; k++) { const cb = new Builder(1024); let col = lin(rng.pick(src.coach)); if (type === 'bullet' || type === 'tram') col = P.body; if (type === 'steam' && k === 0 && nCars > 0) { coachInto(cb, rng, P, 'tender', carL * 0.55, P.body, lit); fleets.push({ geo: cb.toGeometry(), list: [], L: carL * 0.55 }); continue; } coachInto(cb, rng, P, type, carL, col, lit); fleets.push({ geo: cb.toGeometry(), list: [], L: carL }); }
  let off = locoL / 2 + gap;
  for (let i = 0; i < nCars; i++) { const f = type === 'steam' ? (i === 0 ? fleets[0] : fleets[1]) : fleets[i % fleets.length]; off += f.L / 2; cars.push({ f, off, idx: f.list.length }); f.list.push(i); off += f.L / 2 + gap; }
  const trainLen = off + locoL / 2; let tris = lb.triangles + 2;
  for (const f of fleets) if (f.list.length) { f.mesh = new THREE.InstancedMesh(f.geo, mats.facades, f.list.length); f.mesh.frustumCulled = false; object.add(f.mesh); tris += f.geo.index.count / 3 * f.list.length; }
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), head = new THREE.Vector3(), X = new THREE.Vector3(), Yv = new THREE.Vector3(), Z = new THREE.Vector3();
  const wrap = (d) => (closed ? ((d % TL) + TL) % TL : d);
  const setM = (m, d, len, dir) => {
    track.at(wrap(d + len * 0.32), pa); track.at(wrap(d - len * 0.32), pb);
    X.subVectors(pa, pb).normalize().multiplyScalar(dir); Z.set(-X.z, 0, X.x).normalize(); Yv.crossVectors(Z, X).normalize();
    m.makeBasis(X, Yv, Z).setPosition((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
    if (!closed) {                                                    // off the end of an open track: shrink away instead of running on over open ground
      const over = Math.max(-d, d - TL), k = over <= 0 ? 1 : 1 - smoothstep(0, fade, over);
      if (k < 1) m.scale(Yv.set(k, k, k));
    }
  };
  const speed = opts.speed ?? { steam: 16, bullet: 60, tram: 9, freight: 14 }[type], loop = opts.loop ?? true, start = opts.start ?? 0;
  const run = (time) => {
    let d = start + speed * time; const dir = 1;
    if (loop === 'pingpong' && !closed) { const span = Math.max(1, TL - trainLen), k = ((d % (2 * span)) + 2 * span) % (2 * span); d = trainLen + (k < span ? k : 2 * span - k); }
    else if (closed) d = wrap(d);
    else if (loop) { const span = TL + trainLen + fade * 2; d = ((d % span) + span) % span - fade; }
    setM(loco.matrix, d, locoL, dir); loco.matrixWorldNeedsUpdate = true; head.setFromMatrixPosition(loco.matrix);
    for (let i = 0; i < cars.length; i++) { const c = cars[i]; setM(_m4, d - c.off * dir, c.f.L, dir); c.f.mesh.setMatrixAt(c.idx, _m4); }
    for (let i = 0; i < fleets.length; i++) if (fleets[i].mesh) fleets[i].mesh.instanceMatrix.needsUpdate = true;
  };
  run(0);
  return result(object, mats, { head, length: trainLen, closed, triangles: tris, update(dt, time) { mats.update(dt, time); run(time); } });
}

// ---------- power lines ----------
// opts: { rng, points | path | curve (supports placed every `spacing`), positions, type:'pole'|'pylon', height, spacing, offset, heightAt, sag, lamps (0..1), palette, mats, night }
export function makePowerLines(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'power'), type = opts.type || 'pole';
  const P = palette({ wood: '#4a3a2c', metal: '#7d848c', wire: '#101214', glass: '#9fd0c8', lamp: WARM }, opts.palette);
  const H = opts.height ?? (type === 'pylon' ? 38 : 10.5), hAt = opts.heightAt, b = new Builder(2048), wires = new Wires(), halos = new Halos();
  let sup = [];
  if (opts.positions) sup = opts.positions.map((p) => vec3(p).clone());
  else {
    const sm = sampler(opts.points || opts.path || opts.curve, opts.straight), sp = opts.spacing ?? (type === 'pylon' ? 140 : 42), n = Math.max(1, Math.round(sm.length / sp)), tp = new THREE.Vector3(), tt = new THREE.Vector3(), off = opts.offset ?? 0;
    for (let i = 0; i <= n; i++) { const d = sm.length * i / n; sm.at(d, tp); sm.tan(d, tt); const x = tp.x + tt.z * off, z = tp.z - tt.x * off; sup.push(new THREE.Vector3(x, hAt ? hAt(x, z) : tp.y, z)); }
  }
  const attach = [];
  sup.forEach((p, i) => {
    const a = sup[Math.max(0, i - 1)], c = sup[Math.min(sup.length - 1, i + 1)], yaw = Math.atan2(-(c.z - a.z), c.x - a.x) + Math.PI / 2;
    b.tr(p.x, p.y, p.z, yaw); const pts = [];
    if (type === 'pylon') {
      const bw = H * 0.09, ww = H * 0.022, wy = H * 0.62;
      b.col(P.metal, 0.75, 1).surf(SURF.PLAIN);
      const leg = (sx, sz, y) => { const t = y < wy ? y / wy : 1, hw = lerp(bw, ww, t) * (y > wy ? lerp(1, 0.45, (y - wy) / (H - wy)) : 1); return [sx * hw, y, sz * hw]; };
      const levels = [-1.5, wy * 0.3, wy * 0.6, wy, lerp(wy, H, 0.5), H];
      for (let k = 0; k < levels.length - 1; k++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.beam(leg(sx, sz, levels[k]), leg(sx, sz, levels[k + 1]), 0.2, 0.2);
        b.beam(leg(sx, sz, levels[k]), leg(-sx, sz, levels[k + 1]), 0.1, 0.1); b.beam(leg(sx, sz, levels[k]), leg(sx, -sz, levels[k + 1]), 0.1, 0.1);
      }
      const arms = [[wy, H * 0.19], [lerp(wy, H, 0.5), H * 0.15], [H * 0.97, H * 0.11]];
      for (const [ay, al] of arms) for (const s of [-1, 1]) {
        b.beam([0, ay, 0], [s * al, ay, 0], 0.16, 0.16); b.beam([0, ay + H * 0.05, 0], [s * al, ay, 0], 0.1, 0.1);
        b.col(P.glass); b.beam([s * al, ay, 0], [s * al, ay - 1.6, 0], 0.14, 0.14); b.col(P.metal, 0.75, 1);
        pts.push(b.wp(s * al, ay - 1.6, 0));
      }
      glowBox(b, 0, H + 0.5, 0, 0.5, 0.5, 0.5, [1, 0.1, 0.06], 3, rng.range(0.1, 0.9));
    } else {
      const lean = rng.range(-0.012, 0.012);
      b.col(P.wood, 0.7, 1).surf(SURF.PLAIN); b.tube([[0, -1.5, 0], [lean * H, H, 0]], (t) => 0.17 - 0.05 * t, 6);
      b.beam([-1.3, H - 0.7, 0], [1.3, H - 0.7, 0], 0.11, 0.13); b.beam([-0.65, H - 0.7, 0.01], [0, H - 1.5, 0.01], 0.05, 0.07); b.beam([0.65, H - 0.7, 0.01], [0, H - 1.5, 0.01], 0.05, 0.07);
      for (const x of [-1.15, 0, 1.15]) { b.col(P.glass); b.cbox(x, H - 0.63 + (x === 0 ? 0.7 : 0), 0, 0.09, 0.2, 0.09); pts.push(b.wp(x, H - 0.42 + (x === 0 ? 0.7 : 0), 0)); b.col(P.wood, 0.7, 1); }
      if (rng.chance(0.3)) { b.col(P.metal, 0.7, 1); b.lathe(0.34, H - 2.6, 0, [[0, 0], [0.26, 0], [0.26, 0.85], [0, 0.85]], 7); }
      if (rng.chance(opts.lamps ?? 0.35)) {
        b.col(P.metal); b.beam([0, H - 2.9, 0], [0, H - 2.6, 1.7], 0.05, 0.05); glowBox(b, 0, H - 2.66, 1.75, 0.22, 0.1, 0.5, P.lamp, 2.4);
        const hp = b.wp(0, H - 2.7, 1.75), gp = b.wp(0, 0.06, 1.75); halos.add(hp[0], hp[1], hp[2], 2.1, mul3(P.lamp, 1.05)); halos.add(gp[0], gp[1], gp[2], H * 1.4, mul3(P.lamp, 0.24), 1);
      }
    }
    b.pop(); attach.push(pts);
  });
  for (let i = 0; i < sup.length - 1; i++) {
    const A = attach[i], B = attach[i + 1], span = sup[i].distanceTo(sup[i + 1]), sag = span * (opts.sag ?? (type === 'pylon' ? 0.035 : 0.025));
    for (let k = 0; k < Math.min(A.length, B.length); k++) wires.catenary(A[k], B[k], sag * rng.range(0.92, 1.08), type === 'pylon' ? 0.05 : 0.022, P.wire, 12);
  }
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); object.add(wires.mesh(mats.wire)); if (halos.n) object.add(halos.mesh(mats.halo));
  return result(object, mats, { supports: sup, triangles: b.triangles + wires.i.length / 3 + halos.n * 2 });
}

// ---------- fences ----------
// opts: { rng, points | path | curve, type:'rail'|'picket'|'iron'|'stone', height, heightAt, straight, palette, mats, night }
export function makeFence(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'fence'), type = opts.type || 'rail';
  const P = palette({ wood: type === 'picket' ? '#e8e2d2' : '#6a5038', iron: '#141618', stone: '#8f897c' }, opts.palette);
  const H = opts.height ?? { rail: 1.2, picket: 1.05, iron: 1.9, stone: 1.1 }[type], hAt = opts.heightAt || null;
  const step = { rail: 2.6, picket: 2.4, iron: 2.8, stone: 1.6 }[type];
  const fr = frames(opts.points || opts.path || opts.curve || [[-10, 0, 0], [10, 0, 0]], step, hAt, 0, 0, opts.straight ?? true), L = fr.list;
  const b = new Builder(2048), wires = new Wires();
  for (let i = 0; i < L.length; i++) {
    const p = L[i].p, q = i < L.length - 1 ? L[i + 1].p : null;
    if (type === 'stone') {
      if (!q) continue;
      const t = 0.5, hh = H * rng.range(0.85, 1.1), s = L[i].s, s2 = L[i + 1].s;
      b.col(vary(P.stone, rng, 0.08), 0.7, 1).surf(SURF.MASONRY, 0, 0.7);
      const aL = [p.x + s.x * t / 2, p.z + s.z * t / 2], aR = [p.x - s.x * t / 2, p.z - s.z * t / 2], bL = [q.x + s2.x * t / 2, q.z + s2.z * t / 2], bR = [q.x - s2.x * t / 2, q.z - s2.z * t / 2];
      const y0 = Math.min(p.y, q.y) - 0.5, ya = p.y + hh, yb = q.y + hh, d0 = L[i].d, d1 = L[i + 1].d;
      b.quad([bL[0], y0, bL[1]], [aL[0], y0, aL[1]], [aL[0], ya, aL[1]], [bL[0], yb, bL[1]], [d1, y0, d0, ya]); b.quad([aR[0], y0, aR[1]], [bR[0], y0, bR[1]], [bR[0], yb, bR[1]], [aR[0], ya, aR[1]], [d0, y0, d1, ya]);
      b.quad([aL[0], ya, aL[1]], [aR[0], ya, aR[1]], [bR[0], yb, bR[1]], [bL[0], yb, bL[1]], [0, d0, t, d1]);
      if (i === 0) b.quad([aL[0], y0, aL[1]], [aR[0], y0, aR[1]], [aR[0], ya, aR[1]], [aL[0], ya, aL[1]]);
      if (i === L.length - 2) b.quad([bR[0], y0, bR[1]], [bL[0], y0, bL[1]], [bL[0], yb, bL[1]], [bR[0], yb, bR[1]]);
      continue;
    }
    const pc = type === 'iron' ? P.iron : P.wood;
    b.col(vary(pc, rng, 0.06), 0.75, 1).surf(SURF.PLAIN);
    const ph = H + (type === 'iron' ? 0.25 : 0.12), pw = type === 'iron' ? 0.09 : 0.13;
    b.beam([p.x, p.y - 0.4, p.z], [p.x, p.y + ph, p.z], pw, pw);
    if (type === 'iron') b.frustum(p.x, p.z, 0.16, 0.16, 0, 0, p.y + ph, p.y + ph + 0.22);
    if (!q) continue;
    if (type === 'rail') { for (const f of [0.92, 0.55, 0.2].slice(0, opts.rails ?? 3)) b.beam([p.x, p.y + H * f, p.z], [q.x, q.y + H * f, q.z], 0.05, 0.12); }
    else if (type === 'picket') {
      for (const f of [0.75, 0.25]) b.beam([p.x, p.y + H * f, p.z], [q.x, q.y + H * f, q.z], 0.04, 0.08);
      const len = p.distanceTo(q), n = Math.max(2, Math.round(len / 0.17)), s = L[i].s;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = lerp(p.x, q.x, t) + s.x * 0.04, y = lerp(p.y, q.y, t), z = lerp(p.z, q.z, t) + s.z * 0.04, dx = (q.x - p.x) / len * 0.05, dz = (q.z - p.z) / len * 0.05, hh = H * (0.94 + 0.06 * Math.sin(k * 1.7));
        b.quad2([x - dx, y + 0.06, z - dz], [x + dx, y + 0.06, z + dz], [x + dx, y + hh - 0.07, z + dz], [x - dx, y + hh - 0.07, z - dz]);
        b.tri([x - dx, y + hh - 0.07, z - dz], [x + dx, y + hh - 0.07, z + dz], [x, y + hh, z]); b.tri([x + dx, y + hh - 0.07, z + dz], [x - dx, y + hh - 0.07, z - dz], [x, y + hh, z]);
      }
    } else {
      for (const f of [0.92, 0.12]) b.beam([p.x, p.y + H * f, p.z], [q.x, q.y + H * f, q.z], 0.035, 0.05);
      const len = p.distanceTo(q), n = Math.max(2, Math.round(len / 0.16));
      for (let k = 1; k < n; k++) { const t = k / n, x = lerp(p.x, q.x, t), y = lerp(p.y, q.y, t), z = lerp(p.z, q.z, t); wires.line([[x, y + 0.05, z], [x, y + H * 1.06, z]], 0.011, P.iron); }
    }
  }
  const object = new THREE.Group(); object.add(new THREE.Mesh(b.toGeometry(), mats.facades)); if (wires.n) object.add(wires.mesh(mats.wire));
  return result(object, mats, { length: fr.length, triangles: b.triangles + wires.i.length / 3 });
}

// ---------- city ----------
function carGeometry() {
  const b = new Builder(128);
  b.col([1, 1, 1], 0.7, 1); b.box(-0.9, 0.28, -2.1, 0.9, 0.86, 2.1, {});
  b.col([0.5, 0.52, 0.56], 0.55, 0.8); b.frustum(0, -0.2, 1.7, 2.4, 1.45, 1.7, 0.86, 1.38, {});
  const g = b.toGeometry(), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0, 0);
  const b2 = new Builder(64);
  b2.col([1, 0.93, 0.78]); b2.quad([-0.9, 0.5, 2.12], [0.9, 0.5, 2.12], [0.9, 0.8, 2.12], [-0.9, 0.8, 2.12]); b2.quad([-0.9, 0.87, 2.1], [0.9, 0.87, 2.1], [0.9, 0.87, 1.75], [-0.9, 0.87, 1.75]);
  b2.col([1, 0.07, 0.04]); b2.quad([0.9, 0.5, -2.12], [-0.9, 0.5, -2.12], [-0.9, 0.8, -2.12], [0.9, 0.8, -2.12]); b2.quad([-0.9, 0.87, -1.8], [0.9, 0.87, -1.8], [0.9, 0.87, -2.1], [-0.9, 0.87, -2.1]);
  const g2 = b2.toGeometry(), uv2 = g2.attributes.uv; for (let i = 0; i < uv2.count; i++) uv2.setXY(i, 1, 0);
  const all = new Builder(256); all.addGeometry(g).addGeometry(g2);
  const out = all.toGeometry(); out.deleteAttribute('win'); g.dispose(); g2.dispose();
  return out;
}
const CAR_COLORS = ['#e8e8e6', '#1a1c20', '#8a8f96', '#b02a24', '#24508a', '#d9b020', '#3a3f45', '#c9c2b0'];

// Reorders a builder's index buffer so the runs (start, end, distance from the camera path) nearest the path are drawn first:
// the street fronts then hide the buildings behind them from the fragment shader (merged meshes are not depth-sorted otherwise).
function sortRuns(b) {
  const r = b.runs; if (!r || r.length < 6) return;
  const segs = []; let at = 0;
  for (let k = 0; k < r.length; k += 3) { if (r[k] > at) segs.push([at, r[k], Infinity]); segs.push([r[k], r[k + 1], r[k + 2]]); at = r[k + 1]; }
  if (at < b.ni) segs.push([at, b.ni, Infinity]);
  segs.sort((p, q) => (p[2] - q[2]) || (p[0] - q[0]));
  const out = new Uint32Array(b.ni); let o = 0;
  for (const sg of segs) { out.set(b.I.subarray(sg[0], sg[1]), o); o += sg[1] - sg[0]; }
  b.I.set(out);
}

// A city grid laid out around (and clear of) the camera path.
// opts: { rng, path, center:[x,z], origin:[x,z] (a street crossing), radius, block:[bx,bz], street, angle, groundY,
//   maxHeight, minHeight, core, midEdge (0..1 radii of the tower / mid-rise districts), corridor, clearY, detail,
//   canals (0..1), canalLines:{x:[i..],z:[j..]}, water (false = bring your own water at waterY), boats,
//   lamps, lampSpacing, traffic (cars per km of street, 0 = none), landmark (true|false), landmarkHeight, chunk, nearDistance,
//   styles:{ core:[..], mid:[..] }, palette:{ sidewalk, asphalt, water, waterShallow }, building:{ palette overrides by style }, mats, night }
export function makeCity(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'city'), path = opts.path || null;
  const P = palette({ sidewalk: '#6f7073', asphalt: '#34363b', water: '#0c2a36', waterShallow: '#1f5560', deck: '#4a4b4e' }, opts.palette);
  const mid = path ? path.pointAt(0.5) : new THREE.Vector3();
  const center = opts.center || [mid.x, mid.z], origin = opts.origin || center;
  const R = opts.radius ?? 420, bx = opts.block ? opts.block[0] : 64, bz = opts.block ? opts.block[1] : 52, sw = opts.street ?? 18, ang = opts.angle ?? 0;
  const px = bx + sw, pz = bz + sw, y0 = opts.groundY ?? 0, maxH = opts.maxHeight ?? 170, minH = opts.minHeight ?? 9, coreR = opts.core ?? 0.34;
  const corridor = opts.corridor ?? 16, clearY = opts.clearY ?? 10, baseDetail = opts.detail ?? 0.4, chunk = opts.chunk ?? 210;
  const midE = Math.max(coreR, opts.midEdge ?? 0.7);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const toW = (lx, lz) => [origin[0] + lx * ca + lz * sa, origin[1] - lx * sa + lz * ca];
  const toL = (wx, wz) => { const dx = wx - origin[0], dz = wz - origin[1]; return [dx * ca - dz * sa, dx * sa + dz * ca]; };
  const cityM = new THREE.Matrix4().makeRotationY(ang).setPosition(origin[0], y0, origin[1]);
  const cl = toL(center[0], center[1]);
  const i0 = Math.floor((cl[0] - R) / px), i1 = Math.ceil((cl[0] + R) / px), j0 = Math.floor((cl[1] - R) / pz), j1 = Math.ceil((cl[1] + R) / pz);
  const canalX = new Set(), canalZ = new Set(), cf = opts.canals ?? 0;
  if (cf > 0) { for (let i = i0; i <= i1; i++) if (rng.chance(cf) && !canalX.has(i - 1)) canalX.add(i); for (let j = j0; j <= j1; j++) if (rng.chance(cf) && !canalZ.has(j - 1)) canalZ.add(j); }
  if (opts.canalLines) { for (const i of opts.canalLines.x || []) canalX.add(i); for (const j of opts.canalLines.z || []) canalZ.add(j); }
  // which blocks exist
  const blocks = new Map(), key = (i, j) => i + ',' + j;
  for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
    const lx = (i + 0.5) * px, lz = (j + 0.5) * pz, t = Math.hypot(lx - cl[0], lz - cl[1]) / R + (rng() - 0.5) * 0.14;
    if (t < 1) blocks.set(key(i, j), { i, j, t: Math.max(0, t), x0: i * px + sw / 2, x1: (i + 1) * px - sw / 2, z0: j * pz + sw / 2, z1: (j + 1) * pz - sw / 2 });
  }
  const has = (i, j) => blocks.has(key(i, j));
  // path proximity for a footprint given in local coordinates
  const probe = (x0, z0, x1, z1) => {
    if (!path) return { dist: 1e9, y: 1e9 };
    let dist = 1e9, y = 1e9;
    for (let a = 0; a <= 2; a++) for (let c = 0; c <= 2; c++) { const w = toW(lerp(x0, x1, a / 2), lerp(z0, z1, c / 2)), n = path.nearestXZ(w[0], w[1]); if (n.dist < dist) dist = n.dist; if (n.dist < corridor + 30) y = Math.min(y, n.y); }
    return { dist, y };
  };
  // ---- ground: sidewalks, streets, crossings ----
  const g = new Builder(4096); g.push(cityM);
  const lanes = sw >= 24 ? 4 : 2;
  for (const bl of blocks.values()) {
    g.col(P.sidewalk, 0.7, 1).surf(SURF.MASONRY, 0, 1.4);
    g.box(bl.x0, -2.8, bl.z0, bl.x1, 0.2, bl.z1, { m: 0.5, capStyle: SURF.MASONRY, capM: 0.45 });
  }
  const roadZ = (i, j) => { g.col(P.asphalt).surf(SURF.ROAD, 0, lanes); const xa = i * px - sw / 2, xb = i * px + sw / 2, za = j * pz + sw / 2, zb = (j + 1) * pz - sw / 2; g.quad([xb, 0, za], [xa, 0, za], [xa, 0, zb], [xb, 0, zb], [0, za, 1, zb]); };
  const roadX = (i, j, full) => { g.col(P.asphalt).surf(SURF.ROAD, 0, lanes); const za = j * pz - sw / 2, zb = j * pz + sw / 2, xa = i * px + (full ? -sw / 2 : sw / 2), xb = (i + 1) * px - sw / 2 - (full ? px - sw : 0); g.quad([xa, 0, za], [xa, 0, zb], [xb, 0, zb], [xb, 0, za], [0, xa, 1, xb]); };
  const water = [];
  const fascia = (xa, xb, za, zb, alongZ) => {                 // a street crossing a canal reads as a shallow stone arch, not a slab
    g.col(P.sidewalk, 0.5, 0.85).surf(SURF.MASONRY, 0, 1);
    const n = 8, lo = (t) => -1.78 + 1.18 * Math.sin(Math.PI * t);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, l0 = lo(t0), l1 = lo(t1);
      if (!alongZ) {
        const x0 = lerp(xa, xb, t0), x1 = lerp(xa, xb, t1);
        g.quad([x0, l0, zb], [x1, l1, zb], [x1, 0, zb], [x0, 0, zb], [x0, -1.8, x1, 0]); g.quad([x1, l1, za], [x0, l0, za], [x0, 0, za], [x1, 0, za], [x1, -1.8, x0, 0]);
      } else {
        const z0 = lerp(za, zb, t0), z1 = lerp(za, zb, t1);
        g.quad([xb, l1, z1], [xb, l0, z0], [xb, 0, z0], [xb, 0, z1], [z1, -1.8, z0, 0]); g.quad([xa, l0, z0], [xa, l1, z1], [xa, 0, z1], [xa, 0, z0], [z0, -1.8, z1, 0]);
      }
    }
  };
  for (let i = i0; i <= i1; i++) for (let j = j0; j < j1; j++) if ((has(i - 1, j) || has(i, j)) && !canalX.has(i)) roadZ(i, j);
  for (let j = j0; j <= j1; j++) for (let i = i0; i < i1; i++) if ((has(i, j - 1) || has(i, j)) && !canalZ.has(j)) roadX(i, j, false);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    if (!(has(i - 1, j - 1) || has(i, j - 1) || has(i - 1, j) || has(i, j))) continue;
    const cx = canalX.has(i), cz = canalZ.has(j), xa = i * px - sw / 2, xb = i * px + sw / 2, za = j * pz - sw / 2, zb = j * pz + sw / 2;
    if (cx && cz) continue;
    if (cx) { fascia(xa, xb, za, zb, false); roadX(i, j, true); g.col(P.sidewalk, 0.8, 1).surf(SURF.MASONRY, 0, 1); for (const z of [za + 0.3, zb - 0.3]) g.beam([xa, 0.5, z], [xb, 0.5, z], 0.5, 1.0); g.col(P.deck).surf(SURF.PLAIN); g.quad([xa, -0.6, za], [xb, -0.6, za], [xb, -0.6, zb], [xa, -0.6, zb]); continue; }
    if (cz) { fascia(xa, xb, za, zb, true); g.col(P.asphalt).surf(SURF.ROAD, 0, lanes); g.quad([xb, 0, za], [xa, 0, za], [xa, 0, zb], [xb, 0, zb], [0, za, 1, zb]); g.col(P.sidewalk, 0.8, 1).surf(SURF.MASONRY, 0, 1); for (const x of [xa + 0.3, xb - 0.3]) g.beam([x, 0.5, za], [x, 0.5, zb], 0.5, 1.0); g.col(P.deck).surf(SURF.PLAIN); g.quad([xa, -0.6, za], [xb, -0.6, za], [xb, -0.6, zb], [xa, -0.6, zb]); continue; }
    g.col(P.asphalt).surf(SURF.ROAD, 0, 0); g.quad([xb, 0, za], [xa, 0, za], [xa, 0, zb], [xb, 0, zb], [0, za, 1, zb]);
  }
  const wy = -1.7, ext = R * 1.05;
  for (const i of canalX) { const xa = i * px - sw / 2, xb = i * px + sw / 2, h = Math.sqrt(Math.max(0, ext * ext - Math.pow(i * px - cl[0], 2))); if (h > 10) water.push([xa, cl[1] - h, xb, cl[1] + h]); }
  for (const j of canalZ) { const za = j * pz - sw / 2, zb = j * pz + sw / 2, h = Math.sqrt(Math.max(0, ext * ext - Math.pow(j * pz - cl[1], 2))); if (h > 10) water.push([cl[0] - h, za, cl[0] + h, zb]); }
  // ---- buildings ----
  const chunks = new Map(), buildings = [], extras = [];
  const chunkOf = (lx, lz) => { const k = Math.floor(lx / chunk) + ',' + Math.floor(lz / chunk); let b = chunks.get(k); if (!b) { b = new Builder(8192); b.push(cityM); chunks.set(k, b); } return b; };
  const sCore = (opts.styles && opts.styles.core) || ['modern', 'modern', 'deco'], sMid = (opts.styles && opts.styles.mid) || ['modern', 'deco', 'block'], sOuter = (opts.styles && opts.styles.outer) || ['townhouse'];
  const put = (style, x0, z0, x1, z1, face, h, extra) => {     // footprint in local coords; face 0:+z 1:+x 2:-z 3:-x
    const pr = probe(x0, z0, x1, z1);
    if (pr.dist < corridor) { const allowed = pr.y - clearY - y0; if (allowed < Math.max(7, minH * 0.8)) return null; h = Math.min(h, allowed); if (style === 'townhouse' && allowed < 13) return null; }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sx = x1 - x0, sz = z1 - z0, turned = face % 2 === 1;
    const b = chunkOf(cx, cz), w = toW(cx, cz);
    const near = path ? pr.dist : 1e9, detail = extra && extra.detail != null ? extra.detail : clamp(baseDetail + (near < 90 ? 0.4 : near < 200 ? 0.15 : 0), 0, 1);
    const i0 = b.ni; b.tr(cx, 0.2, cz, face * Math.PI / 2);
    const o = Object.assign({ width: turned ? sz : sx, depth: turned ? sx : sz, height: h, detail, palette: opts.building && opts.building[style === 'block' ? 'modern' : style] }, extra);
    const info = buildInto(b, style === 'block' ? 'modern' : style, o, rng);
    b.pop(); for (const e of info.extras) extras.push(e);
    (b.runs || (b.runs = [])).push(i0, b.ni, near);
    const rec = { x: w[0], z: w[1], y: y0 + 0.2, w: sx, d: sz, h: info.h, style, yaw: ang + face * Math.PI / 2 };
    buildings.push(rec); return rec;
  };
  // landmark block: nearest to the centre that is clear of the path
  let landmark = null, lmKey = null;
  if (opts.landmark !== false) {
    let best = 1e9;
    for (const bl of blocks.values()) { const pr = probe(bl.x0, bl.z0, bl.x1, bl.z1); if (pr.dist < 55) continue; const d = bl.t + (path ? Math.min(0.25, 30 / pr.dist) : 0); if (d < best) { best = d; lmKey = key(bl.i, bl.j); } }
  }
  for (const bl of blocks.values()) {
    const m = 2.2, x0 = bl.x0 + m, x1 = bl.x1 - m, z0 = bl.z0 + m, z1 = bl.z1 - m, lenX = x1 - x0, lenZ = z1 - z0, t = bl.t;
    if (key(bl.i, bl.j) === lmKey) { const s = Math.min(lenX, lenZ); landmark = put(opts.landmarkStyle || 'mega', (x0 + x1) / 2 - s / 2, (z0 + z1) / 2 - s / 2, (x0 + x1) / 2 + s / 2, (z0 + z1) / 2 + s / 2, 0, opts.landmarkHeight ?? maxH * 2.3, { detail: 1 }); continue; }
    if (t < coreR) {                                                  // towers
      const k = 1 - t / coreR, n = rng.chance(0.45) ? 1 : 2, alongX = lenX >= lenZ;
      for (let q = 0; q < n; q++) {
        const a0 = q / n, a1 = (q + 1) / n, gap = n > 1 ? 2.5 : 0;
        const fx0 = alongX ? lerp(x0, x1, a0) + (q ? gap : 0) : x0, fx1 = alongX ? lerp(x0, x1, a1) - (q < n - 1 ? gap : 0) : x1, fz0 = alongX ? z0 : lerp(z0, z1, a0) + (q ? gap : 0), fz1 = alongX ? z1 : lerp(z0, z1, a1) - (q < n - 1 ? gap : 0);
        const h = lerp(maxH * 0.3, maxH, Math.pow(rng(), 1.6)) * (0.55 + 0.45 * k), ins = rng.range(0, 3);
        put(rng.pick(sCore), fx0 + ins, fz0 + ins, fx1 - ins, fz1 - ins, rng.int(0, 3), h);
      }
    } else if (t < midE) {                                            // mid-rise
      const nx = lenX > 50 ? rng.int(2, 3) : 2, nz = lenZ > 44 ? rng.int(1, 2) : 1, k = clamp(1 - (t - coreR) / Math.max(0.01, midE - coreR), 0, 1);
      for (let a = 0; a < nx; a++) for (let c = 0; c < nz; c++) {
        const fx0 = lerp(x0, x1, a / nx) + (a ? 1.2 : 0), fx1 = lerp(x0, x1, (a + 1) / nx) - (a < nx - 1 ? 1.2 : 0), fz0 = lerp(z0, z1, c / nz) + (c ? 1.2 : 0), fz1 = lerp(z0, z1, (c + 1) / nz) - (c < nz - 1 ? 1.2 : 0);
        const face = nz === 1 ? (rng.chance(0.5) ? 0 : 2) : (c === 0 ? 2 : 0), style = rng.pick(sMid);
        const h = Math.max(minH + 6, rng.range(20, 46) * (0.6 + 0.8 * k) * (rng.chance(0.12) ? 1.7 : 1));
        put(style, fx0, fz0, fx1, fz1, face, h, style === 'block' ? { windows: SURF.WINDOW } : undefined);
      }
    } else {                                                          // terraces of townhouses round the block
      const hd = Math.min(11, lenZ * 0.4), hw = rng.range(7, 9), n = Math.max(1, Math.floor(lenX / hw)), w = lenX / n;
      for (let a = 0; a < n; a++) for (const side of [0, 2]) {
        if (rng.chance(0.06)) continue;
        const fx0 = x0 + a * w, fz0 = side === 0 ? z1 - hd : z0;
        put(rng.pick(sOuter), fx0 + 0.02, fz0, fx0 + w - 0.02, fz0 + hd, side, 0, { height: undefined, floors: rng.int(2, 4), terrace: true, gableFront: rng.chance(0.3) });
      }
      const rem = lenZ - hd * 2 - 3;
      if (rem > 14) { const n2 = Math.max(1, Math.floor(rem / hw)), w2 = rem / n2; for (let a = 0; a < n2; a++) for (const side of [1, 3]) { if (rng.chance(0.3)) continue; const fz0 = z0 + hd + 1.5 + a * w2, fx0 = side === 1 ? x1 - hd : x0; put(rng.pick(sOuter), fx0, fz0 + 0.02, fx0 + hd, fz0 + w2 - 0.02, side, 0, { height: undefined, floors: rng.int(2, 3), terrace: true }); } }
    }
  }
  const object = new THREE.Group(); let tris = g.triangles;
  const gm = meshOf(g.toGeometry(), mats.facades, opts); object.add(gm);
  const chunkList = [];
  // chunks along the camera path fill the screen: they get the two small programs (2 calls); the rest get the all-in-one material (1 call)
  const nearD = opts.nearDistance ?? chunk;
  for (const b of chunks.values()) {
    if (path) sortRuns(b);
    const geo = b.toGeometry(), bs = geo.boundingSphere, near = !path || !bs || path.nearestXZ(bs.center.x, bs.center.z).dist < nearD;
    const m = meshOf(geo, near ? mats.facades : mats.facade, opts); tris += b.triangles; object.add(m);
    if (bs) chunkList.push({ object: m, x: bs.center.x, z: bs.center.z, radius: bs.radius, triangles: b.triangles, near });
  }
  const anim = addExtras(extras, mats, object);
  if (water.length && opts.water !== false) {
    const wb = new Builder(64); wb.push(cityM);
    for (const [xa, za, xb, zb] of water) wb.quad([xa, wy, zb], [xb, wy, zb], [xb, wy, za], [xa, wy, za]);
    object.add(new THREE.Mesh(wb.toGeometry(), mats.canal({ deep: P.water, shallow: P.waterShallow }))); tris += wb.triangles;
  }
  // ---- street lamps on the kerbs ----
  let lamps = null;
  if (opts.lamps !== false) {
    const sp = opts.lampSpacing ?? 58, pos = [], yaws = [], lr = (opts.lampRadius ?? 0.8), e = 1.1;
    for (const bl of blocks.values()) {
      if (bl.t > lr) continue;
      const add = (lx, lz, yaw) => { const w = toW(lx, lz); pos.push([w[0], y0 + 0.2, w[1]]); yaws.push(yaw + ang); };
      const nxl = Math.max(1, Math.round((bl.x1 - bl.x0) / sp)), nzl = Math.max(1, Math.round((bl.z1 - bl.z0) / sp));
      for (let a = 0; a < nxl; a++) { const x = lerp(bl.x0, bl.x1, (a + 0.3) / nxl); if (!canalZ.has(bl.j + 1)) add(x, bl.z1 - e, 0); const x2 = lerp(bl.x0, bl.x1, (a + 0.8) / nxl); if (!canalZ.has(bl.j)) add(x2, bl.z0 + e, Math.PI); }
      for (let a = 0; a < nzl; a++) { const z = lerp(bl.z0, bl.z1, (a + 0.3) / nzl); if (!canalX.has(bl.i + 1)) add(bl.x1 - e, z, Math.PI / 2); const z2 = lerp(bl.z0, bl.z1, (a + 0.8) / nzl); if (!canalX.has(bl.i)) add(bl.x0 + e, z2, -Math.PI / 2); }
    }
    if (pos.length) { lamps = makeLamps({ mats, type: opts.lampType || 'street', positions: pos, yaws, color: opts.lampColor, poolPower: 0.34 }); object.add(lamps.object); tris += lamps.triangles; }
  }
  // ---- traffic ----
  let cars = 0;
  const density = opts.traffic ?? 9;
  if (density > 0) {
    const A = [], D = [], Pp = [], Cc = [], colors = CAR_COLORS.map(lin);
    const addLine = (ax, az, bxx, bzz) => {
      const len = Math.hypot(bxx - ax, bzz - az), n = Math.round(len / 1000 * density * rng.range(0.5, 1.5)), ux = (bxx - ax) / len, uz = (bzz - az) / len;
      for (let k = 0; k < n; k++) {
        const s = rng.sign(), off = sw * (lanes === 4 ? rng.pick([0.13, 0.35]) : 0.22) * s, sxp = -uz * off, szp = ux * off;
        const p0 = s > 0 ? toW(ax + sxp, az + szp) : toW(bxx + sxp, bzz + szp), p1 = s > 0 ? toW(bxx + sxp, bzz + szp) : toW(ax + sxp, az + szp), c = rng.pick(colors), sp = rng.range(7, 15);
        A.push(p0[0], y0 + 0.02, p0[1]); D.push(p1[0] - p0[0], 0, p1[1] - p0[1]); Pp.push(rng(), sp / len); Cc.push(c[0], c[1], c[2]); cars++;
      }
    };
    for (let i = i0; i <= i1; i++) { if (canalX.has(i)) continue; const h = Math.sqrt(Math.max(0, R * R * 0.9 - Math.pow(i * px - cl[0], 2))); if (h > 60) addLine(i * px, cl[1] - h, i * px, cl[1] + h); }
    for (let j = j0; j <= j1; j++) { if (canalZ.has(j)) continue; const h = Math.sqrt(Math.max(0, R * R * 0.9 - Math.pow(j * pz - cl[1], 2))); if (h > 60) addLine(cl[0] - h, j * pz, cl[0] + h, j * pz); }
    if (cars) {
      const cg = carGeometry(), ig = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'normal', 'color', 'uv']) ig.setAttribute(k, cg.attributes[k]); ig.setIndex(cg.index);
      ig.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3)); ig.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(D), 3));
      ig.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(Pp), 2)); ig.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(Cc), 3));
      ig.instanceCount = cars; ig.boundingSphere = new THREE.Sphere(new THREE.Vector3(center[0], y0, center[1]), R * 1.2);
      const cm = new THREE.Mesh(ig, mats.traffic); object.add(cm); tris += cars * cg.index.count / 3;
    }
  }
  // gondolas on the canals
  let boats = null;
  if (water.length && (opts.boats ?? 8) > 0) {
    const pos = [], heads = [], nb = opts.boats ?? 8;
    for (let k = 0; k < nb; k++) { const wq = rng.pick(water), alongZ = wq[3] - wq[1] > wq[2] - wq[0], f = rng.range(0.3, 0.7), s = rng.range(0.25, 0.75); const lx = alongZ ? lerp(wq[0], wq[2], s) : lerp(wq[0], wq[2], f), lz = alongZ ? lerp(wq[1], wq[3], f) : lerp(wq[1], wq[3], s), w = toW(lx, lz); pos.push([w[0], 0, w[1]]); heads.push((alongZ ? Math.PI / 2 : 0) - ang + (rng.chance(0.5) ? Math.PI : 0)); }
    boats = makeBoats({ rng, mats, types: opts.boatTypes || ['gondola', 'rowboat'], variants: 1, positions: pos, headings: heads, moving: false, y: y0 + wy }); object.add(boats.object); tris += boats.triangles;
  }
  const lines = { x: [], z: [] }; for (let i = i0; i <= i1; i++) lines.x.push(i); for (let j = j0; j <= j1; j++) lines.z.push(j);
  return result(object, mats, {
    buildings, landmark, blocks: [...blocks.values()], ground: gm, chunks: chunkList, triangles: tris, cars, lamps, boats, lines, canals: { x: [...canalX], z: [...canalZ] }, pitch: [px, pz], street: sw, waterY: y0 + wy, groundY: y0,
    toWorld: (lx, lz) => toW(lx, lz), toLocal: (wx, wz) => toL(wx, wz),
    // world position of the crossing of street lines i (x) and j (z)
    crossing: (i, j, y = y0) => { const w = toW(i * px, j * pz); return new THREE.Vector3(w[0], y, w[1]); },
    update(dt, time) { mats.update(dt, time); for (const f of anim) f(time); },
  });
}

// ---------- village ----------
const VILLAGE_LANDMARK = { townhouse: ['windmill', 'castle'], mediterranean: ['dome', 'lighthouse', 'windmill'], pagoda: ['pagoda'], adobe: ['minaret', 'dome'], stilt: ['pagoda', 'lighthouse'] };
// Houses scattered on terrain around a centre, each on its own plinth, facing the middle, clear of the path.
// opts: { rng, center:[x,z], radius, count, heightAt(x,z), path, corridor, styles:[..] | style, landmark (style|false), landmarkAt:[x,z],
//   maxSlope, waterLevel, detail, lamps, building:{ per-style palette }, lit, mats, night }
export function makeVillage(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'village'), path = opts.path || null, hAt = opts.heightAt || (() => 0);
  const c = opts.center || [0, 0], R = opts.radius ?? 90, n = opts.count ?? 26, styles = opts.styles || [opts.style || 'townhouse'];
  const corridor = opts.corridor ?? 14, maxSlope = opts.maxSlope ?? 0.42, water = opts.waterLevel ?? -1e9, detail = opts.detail ?? 0.8;
  const b = new Builder(16384), houses = [], extras = [], halos = new Halos(), P = palette({ plinth: '#8a8478', lamp: WARM }, opts.palette);
  const slope = (x, z, r) => { const h0 = hAt(x - r, z), h1 = hAt(x + r, z), h2 = hAt(x, z - r), h3 = hAt(x, z + r); return { s: Math.max(Math.abs(h1 - h0), Math.abs(h3 - h2)) / (2 * r), lo: Math.min(h0, h1, h2, h3), hi: Math.max(h0, h1, h2, h3) }; };
  const place1 = (style, x, z, yaw, o) => {
    const stilt = style === 'stilt', sl = slope(x, z, 5), y = stilt ? Math.max(sl.hi, water + 0.2) : hAt(x, z);
    b.tr(x, stilt ? Math.max(hAt(x, z), water) : y + (sl.hi - y) * 0.5, z, yaw);
    const info = buildInto(b, style, Object.assign({ detail, lit: opts.lit, palette: opts.building && opts.building[style], pileDepth: stilt ? Math.max(3, Math.max(hAt(x, z), water) - sl.lo + 2) : undefined }, o), rng);
    if (!stilt) { b.col(P.plinth, 0.6, 0.95).surf(SURF.MASONRY, 0, 1.2); b.box(-info.w / 2 - 0.25, -(sl.hi - sl.lo) - 2.5, -info.d / 2 - 0.25, info.w / 2 + 0.25, 0.02, info.d / 2 + 0.25, { m: 1, top: false }); b.surf(SURF.PLAIN); }
    b.pop(); for (const e of info.extras) extras.push(e);
    const rec = { x, y, z, yaw, style, w: info.w, d: info.d, h: info.h, r: Math.hypot(info.w, info.d) / 2 }; houses.push(rec); return rec;
  };
  // landmark first, on the highest clear spot near the middle
  let landmark = null;
  const lmStyle = opts.landmark === false ? null : (opts.landmark && opts.landmark !== true ? opts.landmark : rng.pick(VILLAGE_LANDMARK[styles[0]] || ['windmill']));
  if (lmStyle) {
    let best = null, by = -1e9;
    if (opts.landmarkAt) best = opts.landmarkAt;
    else for (let k = 0; k < 40; k++) { const a = rng() * TAU, rr = rng() * R * 0.45, x = c[0] + rr * Math.cos(a), z = c[1] + rr * Math.sin(a), y = hAt(x, z); if (y < water + 0.5 || (path && path.nearestXZ(x, z).dist < corridor + 14)) continue; if (slope(x, z, 6).s > maxSlope) continue; if (y > by) { by = y; best = [x, z]; } }
    if (best) landmark = place1(lmStyle, best[0], best[1], Math.atan2(c[0] - best[0], c[1] - best[1]) + (opts.landmarkAt ? 0 : rng.range(-0.5, 0.5)), { detail: 1 });
  }
  for (let i = 0, tries = 0; i < n && tries < n * 40; tries++) {
    const a = rng() * TAU, rr = R * Math.pow(rng(), 0.7), x = c[0] + rr * Math.cos(a), z = c[1] + rr * Math.sin(a), style = rng.pick(styles), y = hAt(x, z);
    const rad = style === 'stilt' ? 6 : 8;
    if (style !== 'stilt' && y < water + 0.6) continue;
    if (style === 'stilt' && opts.stiltsOnWater && y > water + 1.5) continue;
    if (path && path.nearestXZ(x, z).dist < corridor + rad) continue;
    if (style !== 'stilt' && slope(x, z, 5).s > maxSlope) continue;
    if (houses.some((q) => Math.hypot(q.x - x, q.z - z) < q.r + rad + (opts.gap ?? 2.5))) continue;
    if (opts.clear && !opts.clear(x, z)) continue;
    // face the village centre, snapped loosely so neighbours line up
    const yaw = Math.atan2(c[0] - x, c[1] - z) + rng.range(-0.35, 0.35);
    const h = place1(style, x, z, yaw, {}); i++;
    if (opts.lamps !== false && rng.chance(opts.lampChance ?? 0.55)) {
      const fx = x + Math.sin(yaw) * (h.d / 2 + 2.2) + Math.cos(yaw) * rng.range(-3, 3), fz = z + Math.cos(yaw) * (h.d / 2 + 2.2) - Math.sin(yaw) * rng.range(-3, 3);
      h.lamp = [fx, hAt(fx, fz), fz];
    }
  }
  const object = new THREE.Group(); object.add(meshOf(b.toGeometry(), mats.facades, opts));
  const anim = addExtras(extras, mats, object);
  let lamps = null; const lp = houses.filter((h) => h.lamp && h.lamp[1] > water).map((h) => h.lamp);
  if (lp.length) { lamps = makeLamps({ mats, type: opts.lampType || 'classic', positions: lp, color: opts.lampColor }); object.add(lamps.object); }
  return result(object, mats, { houses, landmark, lamps, count: houses.length, triangles: b.triangles + (lamps ? lamps.triangles : 0), update(dt, time) { mats.update(dt, time); for (const f of anim) f(time); } });
}

// ---------- skyline ----------
// Far silhouettes in layered haze with pin-prick windows at night: scenery at infinity. It follows the camera in XZ, writes no
// depth and draws straight after the sky, so everything else in the scene appears in front of it. Keep radius below camera.far.
// opts: { rng, radius, count, layers, arc:[a0,a1] (radians, default full circle), center:[x,z], baseY, maxHeight, clusters,
//   color (default: derived from the sky colours), haze (default: the sky horizon, follows setSky / setNight), hazeAmount:[near,far],
//   groundHaze (0..1 extra haze at the base), hazeHeight, spires, follow, position, mats, night }
export function makeSkyline(opts = {}) {
  const mats = matsOf(opts), rng = fallbackRng(opts, 'skyline');
  const R = opts.radius ?? 1800, layers = opts.layers ?? 3, n = opts.count ?? 150, arc = opts.arc || [0, TAU], maxH = opts.maxHeight ?? 300, baseY = opts.baseY ?? -30;
  const col = opts.color ? lin(opts.color) : [1, 1, 1];
  const hz = opts.hazeAmount || [0.45, 0.86], nc = opts.clusters ?? 3, cl = [];
  for (let k = 0; k < nc; k++) cl.push({ a: lerp(arc[0], arc[1], rng()), w: rng.range(0.12, 0.3), h: rng.range(0.6, 1) });
  const b = new Builder(4096);
  const box = (a, rr, w, d, h, y0, haze, seed) => {
    const ca = Math.cos(a), sa = Math.sin(a), tx = -sa, tz = ca;        // radial and tangent directions
    const P4 = (u, v, y) => [(rr + v * d) * ca + u * w * tx, y, (rr + v * d) * sa + u * w * tz];
    const cw = Math.max(1, Math.round(w * 2 / 9)), chh = Math.max(1, Math.round(h / 8));
    // drawn without depth, so back to front: top, the two sides, then the face toward the viewer
    b.style = 0; b.sd = seed; b.lit = haze;
    b.quad(P4(-1, -1, y0 + h), P4(1, -1, y0 + h), P4(1, 1, y0 + h), P4(-1, 1, y0 + h), undefined, mul3(col, 1.4), mul3(col, 1.4));
    b.style = 1;
    b.quad(P4(-1, 1, y0), P4(-1, -1, y0), P4(-1, -1, y0 + h), P4(-1, 1, y0 + h), [0, 0, Math.max(1, Math.round(d * 2 / 9)), chh], mul3(col, 0.8), mul3(col, 0.8));
    b.quad(P4(1, -1, y0), P4(1, 1, y0), P4(1, 1, y0 + h), P4(1, -1, y0 + h), [0, 0, Math.max(1, Math.round(d * 2 / 9)), chh], mul3(col, 1.25), mul3(col, 1.25));
    b.lit = Math.min(1, haze + 0.1);
    b.quad(P4(-1, -1, y0), P4(1, -1, y0), P4(1, -1, y0 + h), P4(-1, -1, y0 + h), [0, 0, cw, chh], col, col);
  };
  for (let L = layers - 1; L >= 0; L--) {                              // farthest layer first
    const f = layers > 1 ? L / (layers - 1) : 0, rr = R * (1 - 0.22 * (1 - f)), haze = lerp(hz[0], hz[1], f), cnt = Math.round(n / layers);
    for (let i = 0; i < cnt; i++) {
      const a = lerp(arc[0], arc[1], (i + rng()) / cnt);
      let k = 0.12 + 0.2 * rng(); for (const c of cl) { let da = Math.abs(((a - c.a + Math.PI) % TAU + TAU) % TAU - Math.PI); k += c.h * Math.exp(-(da * da) / (c.w * c.w)) * (0.35 + 0.65 * rng()); }
      const h = maxH * Math.min(1.25, k) * (0.75 + 0.5 * f), w = rng.range(16, 42) * (R / 1800), d = rng.range(16, 40) * (R / 1800), seed = rng();
      box(a, rr, w, d, h, baseY, haze, seed);
      if (h > maxH * 0.5 && rng.chance(0.55)) { box(a, rr + d * 0.2, w * 0.6, d * 0.6, h * rng.range(0.12, 0.3), baseY + h, haze, seed); if ((opts.spires ?? true) && rng.chance(0.5)) box(a, rr + d * 0.3, w * 0.06, d * 0.06, h * rng.range(0.1, 0.25), baseY + h * 1.12, haze, 0); }
    }
  }
  const material = mats.skyline({
    uHaze: opts.haze ? { value: new THREE.Color().setRGB(...lin(opts.haze)) } : mats.uniforms.uSkyHorizon,
    tint: new THREE.Vector3(1, 1, 1), skyMix: opts.color ? 0 : 1,
    hazeY: new THREE.Vector3(baseY, opts.hazeHeight ?? maxH * 0.3, opts.groundHaze ?? 0.75),
  });
  const mesh = new THREE.Mesh(b.toGeometry(), material); mesh.frustumCulled = false; mesh.renderOrder = -0.5;
  const c0 = opts.center || [0, 0]; mesh.position.set(c0[0], 0, c0[1]); place(mesh, opts);
  const follow = opts.follow ?? true;
  return result(mesh, mats, { triangles: b.triangles, update(dt, time, camera) { mats.update(dt, time); if (follow && camera) { mesh.position.x = camera.position.x; mesh.position.z = camera.position.z; } } });
}
