// Flora kit: trees, alien plants, forests, grass, ground cover and underwater plants.
// Pure factories. Geometry generators return THREE.BufferGeometry with attributes
//   position, normal, color (linear RGB), uv (leaf atlas cell) and wind (vec4: sway metres, flutter 0..1, leaf mask 0..1 [2 = petal that takes the
//   per-instance `petal` colour], glow [negative = shaded as a glowing volume]).
// Draw them with windMaterial() (or any vertex-colour material if no motion is wanted).
// See docs/kit/flora.md for the API reference.
import * as THREE from 'three';
import { makeRng } from './core.js';

// ---------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sat = (x) => clamp(x, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// colour: anything THREE.Color accepts -> linear [r,g,b]
function C(c) { if (Array.isArray(c)) return c; const k = c && c.isColor ? c : new THREE.Color(c); return [k.r, k.g, k.b]; }
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
// shift a linear colour in HSL space (dh in turns), used for per-plant variety
function shift(c, dh, ds, dl) {
  const k = new THREE.Color(c[0], c[1], c[2]); const h = {}; k.getHSL(h, THREE.LinearSRGBColorSpace);
  k.setHSL((h.h + dh + 1) % 1, sat(h.s * (1 + ds)), sat(h.l * (1 + dl)), THREE.LinearSRGBColorSpace);
  return [k.r, k.g, k.b];
}
const pal = (opts, defaults) => { const o = {}; for (const k in defaults) o[k] = C(opts[k] ?? defaults[k]); return o; };
const needRng = (o, who) => { if (!o || typeof o.rng !== 'function') throw new Error('flora.' + who + ': options.rng is required'); return o.rng; };

// vector helpers on plain arrays (fast, no allocation churn from Vector3)
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vscale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vmad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
const vnorm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function perp(t) { const a = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; return vnorm(vcross(a, t)); }
// rotate v around unit axis k by angle a
function vrot(v, k, a) {
  const c = Math.cos(a), s = Math.sin(a), d = vdot(k, v) * (1 - c), x = vcross(k, v);
  return [v[0] * c + x[0] * s + k[0] * d, v[1] * c + x[1] * s + k[1] * d, v[2] * c + x[2] * s + k[2] * d];
}
// random unit vector in a cone of half-angle `spread` around dir
function coneDir(rng, dir, spread) {
  const p = perp(dir); const v = vrot(dir, p, spread * Math.sqrt(rng()));
  return vnorm(vrot(v, dir, rng() * TAU));
}

// unit icospheres, detail 0..3 (12 / 42 / 162 / 642 vertices, 20 / 80 / 320 / 1280 triangles). Immutable tables.
function icosphere(detail) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(vnorm);
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let d = 0; d < detail; d++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => { const k = a < b ? a * 4096 + b : b * 4096 + a; let i = cache.get(k); if (i === undefined) { i = v.length; v.push(vnorm(vlerp(v[a], v[b], 0.5))); cache.set(k, i); } return i; };
    for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  return { v, f };
}
const ICO = [icosphere(0), icosphere(1), icosphere(2), icosphere(3)];

// leaf atlas cells [u0, v0, u1, v1] (v0 = tip side). Solid geometry uses the centre of the opaque cell (0.875, 0.75).
const cellUV = (cx, cy) => [cx * 0.25 + 0.003, cy * 0.5 + 0.006, cx * 0.25 + 0.247, cy * 0.5 + 0.494];
const CELL = { cluster: cellUV(0, 0), needle: cellUV(1, 0), frond: cellUV(2, 0), grass: cellUV(3, 0), flower: cellUV(0, 1), willow: cellUV(1, 1), fan: cellUV(2, 1) }, SOLID_U = 0.875, SOLID_V = 0.75;
export const LEAF_CELLS = CELL;

// ---------------------------------------------------------------------------------------------
// geometry accumulator
// ---------------------------------------------------------------------------------------------
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.w = []; this.t = []; this.i = []; this.count = 0; }
  // position, normal, colour [r,g,b], sway (m), flutter, leaf mask, glow, atlas u, v (defaults to the solid cell)
  v(p, n, c, sway = 0, flutter = 0, leaf = 0, glow = 0, tu = SOLID_U, tv = SOLID_V) {
    this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.w.push(sway, flutter, leaf, glow); this.t.push(tu, tv);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  get triangles() { return this.i.length / 3; }
  build(userData = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('wind', new THREE.Float32BufferAttribute(this.w, 4));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const bb = g.boundingBox;
    // mean colour of the glowing parts (max channel 1), or null: lets makeGroundGlow tint the light pool under the plant
    let gs = 0, gr = 0, gg = 0, gb = 0; for (let i = 0; i < this.count; i++) { const w = Math.abs(this.w[i * 4 + 3]); gs += w; gr += this.c[i * 3] * w; gg += this.c[i * 3 + 1] * w; gb += this.c[i * 3 + 2] * w; }
    const gm = Math.max(gr, gg, gb), glowColor = gs / (this.count || 1) > 0.03 && gm > 0 ? [gr / gm, gg / gm, gb / gm] : null;
    g.userData = { triangles: this.i.length / 3, height: bb.max.y, radius: Math.max(bb.max.x, -bb.min.x, bb.max.z, -bb.min.z), glowColor, ...userData };
    return g;
  }
}

// Generalised cylinder through pts (array of [x,y,z]) with radius per point.
// o: { sides, c0, c1 (colour at start/end) | col(t, k, sides) -> [r,g,b], sway: number|number[], flutter, leaf, glow: number|number[],
//      cap: bool (close the tip), flute: (angle, t) -> radius multiplier, mottle: 0..1, rng, flat: bool (faceted normals) }
function tube(G, pts, rad, o = {}) {
  const sides = o.sides || 6, n = pts.length, rng = o.rng, mottle = o.mottle ?? 0;
  const c0 = o.c0 || [0.3, 0.2, 0.1], c1 = o.c1 || c0;
  let nrm = null; const base = G.count; const rings = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const tan = vnorm(vsub(b, a));
    nrm = nrm ? vnorm(vsub(nrm, vscale(tan, vdot(nrm, tan)))) : perp(tan);
    const bin = vcross(tan, nrm), t = n > 1 ? i / (n - 1) : 0, r = rad[i];
    const sway = Array.isArray(o.sway) ? o.sway[i] : (o.sway || 0), glow = Array.isArray(o.glow) ? o.glow[i] : (o.glow || 0);
    const ring = [];
    for (let k = 0; k < sides; k++) {
      const ang = (k / sides) * TAU + (o.twist || 0) * t, ca = Math.cos(ang), sa = Math.sin(ang);
      const d = [nrm[0] * ca + bin[0] * sa, nrm[1] * ca + bin[1] * sa, nrm[2] * ca + bin[2] * sa];
      const rr = r * (o.flute ? o.flute(ang, t) : 1);
      let col = o.col ? o.col(t, k, sides) : mix3(c0, c1, t);
      if (mottle && rng) col = mul3(col, 1 + (rng() - 0.5) * 2 * mottle);
      ring.push(G.v(vmad(pts[i], d, rr), d, col, sway, o.flutter || 0, o.leaf || 0, glow));
    }
    rings.push(ring);
    if (i > 0) { const p = rings[i - 1]; for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; G.quad(p[k], p[k1], ring[k1], ring[k]); } }
  }
  if (o.cap !== false && n > 1) {
    const tan = vnorm(vsub(pts[n - 1], pts[n - 2])), last = rings[n - 1];
    const sway = Array.isArray(o.sway) ? o.sway[n - 1] : (o.sway || 0), glow = Array.isArray(o.glow) ? o.glow[n - 1] : (o.glow || 0);
    const tip = G.v(vmad(pts[n - 1], tan, rad[n - 1] * (o.capLen ?? 0.6)), tan, o.col ? o.col(1, 0, sides) : c1, sway, o.flutter || 0, o.leaf || 0, glow);
    for (let k = 0; k < sides; k++) G.tri(last[k], last[(k + 1) % sides], tip);
  }
  return base;
}

// Lumpy foliage mass. centre c, radii r [rx,ry,rz] or number.
// o: { detail 0..2, lump, lo, mid, hi (colours bottom->top), crown: [x,y,z] (centre of the whole crown, bends normals and
//      darkens the inside), crownR, sway (m at this height), flutter, glow, leaf (mask, default 1),
//      leaves: n leaf sprays over the surface, leafSize (x radius), leafDroop, leafOut, coreScale }
function blob(G, rng, c, r, o = {}) {
  const ico = ICO[clamp(o.detail ?? 1, 0, 2)], rx = r[0] ?? r, ry = r[1] ?? r, rz = r[2] ?? r;
  const lump = o.lump ?? 0.28, lo = o.lo, mid = o.mid, hi = o.hi, crown = o.crown, crownR = o.crownR || 1;
  // three random plane waves make cheap coherent lumps
  const w = []; for (let k = 0; k < 3; k++) w.push([rng.range(-1, 1) * 3.2, rng.range(-1, 1) * 3.2, rng.range(-1, 1) * 3.2, rng() * TAU]);
  const base = G.count, sway = o.sway || 0, fl = o.flutter ?? 1, leaf = o.leaf ?? 1, glow = o.glow || 0;
  const tintJ = 1 + (rng() - 0.5) * (o.vary ?? 0.25), cs = o.coreScale ?? 1, cd = o.coreDark ?? 1;
  const shade = (d, p) => {
    let s = d[1] * 0.5 + 0.5;                                   // bottom..top of this clump
    let ao = 1;
    if (crown) { const q = vsub(p, crown); ao = sat(0.35 + 0.75 * (vlen(q) / crownR)); s = lerp(s, sat(0.5 + 0.6 * q[1] / crownR), 0.45); }
    let col = s < 0.55 ? mix3(lo, mid, sstep(0.0, 0.55, s)) : mix3(mid, hi, sstep(0.55, 1.0, s));
    return mul3(col, ao * tintJ);
  };
  const coreShade = (d, p) => {
    const s = d[1] * 0.5 + 0.5; return mul3(mix3(lo, mid, s * 0.7), cd * tintJ);
  };
  if (o.core !== false) for (const d of ico.v) {
    let l = 0; for (const q of w) l += Math.sin(d[0] * q[0] + d[1] * q[1] + d[2] * q[2] + q[3]);
    const s0 = 1 + lump * (l / 3) + lump * 0.35 * (rng() - 0.5);
    const s = s0 * cs;
    const p = [c[0] + d[0] * rx * s, c[1] + d[1] * ry * s * (d[1] < 0 ? (o.flatBottom ?? 0.8) : 1), c[2] + d[2] * rz * s];
    let nrm = vnorm([d[0] * (0.5 + 0.5 * ry / rx), d[1] * (0.5 + 0.5 * rx / ry), d[2] * (0.5 + 0.5 * ry / rz)]);   // soft ellipsoid normal
    if (crown) nrm = vnorm(vadd(vscale(nrm, 0.6), vscale(vnorm(vsub(p, crown)), 0.4)));
    G.v(p, nrm, cd === 1 ? shade(d, p) : coreShade(d, p), sway, fl, leaf, glow);
  }
  if (o.core !== false) for (const f of ico.f) G.tri(base + f[0], base + f[1], base + f[2]);
  // leaf shell: alpha-cut leaf-cluster cards lying over the surface like shingles; they carry the light and make the silhouette
  const nl = o.leaves ?? 0, rmin = Math.min(rx, ry, rz), ls = (o.leafSize ?? 1.0) * rmin, droop = o.leafDroop ?? -0.2, off = rng() * TAU, cell = o.cell || CELL.cluster;
  for (let k = 0; k < nl; k++) {
    const yy = 1 - (k + 0.5) / nl * (o.leafCover ?? 1.8), rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = off + k * 2.39996 + rng.range(-0.3, 0.3);
    const d = vnorm([Math.cos(th) * rr + rng.range(-0.15, 0.15), yy + rng.range(-0.15, 0.15), Math.sin(th) * rr + rng.range(-0.15, 0.15)]);
    const sz = ls * rng.range(0.8, 1.3) * 0.5, rs = (o.leafOut ?? 0.86) + rng.range(-0.1, 0.1);
    const p = [c[0] + d[0] * rx * rs, c[1] + d[1] * ry * rs, c[2] + d[2] * rz * rs];
    const tng = vnorm(vcross(d, [rng() - 0.5, rng() - 0.5, rng() - 0.5]));
    const ax = vnorm([d[0] * 0.6 + tng[0] * 0.7, d[1] * 0.6 + tng[1] * 0.7 + droop, d[2] * 0.6 + tng[2] * 0.7]);   // card "up" axis
    const sd = vnorm(vcross(ax, d)), U = vscale(ax, sz), V = vscale(sd, sz);
    let nr = crown ? vnorm(vadd(vscale(d, 0.5), vscale(vnorm(vsub(p, crown)), 0.5))) : d;
    nr = vnorm([nr[0] + rng.range(-0.25, 0.25), nr[1] + rng.range(-0.1, 0.3), nr[2] + rng.range(-0.25, 0.25)]);
    const col = mul3(shade(d, p), rng.range(0.85, 1.15)), tipc = mix3(col, hi, 0.3), basec = mul3(col, 0.85);
    const fx = rng() < 0.5, ua = fx ? cell[2] : cell[0], ub = fx ? cell[0] : cell[2];
    const i0 = G.v([p[0] - U[0] - V[0], p[1] - U[1] - V[1], p[2] - U[2] - V[2]], nr, basec, sway, fl * 0.6, leaf, glow, ua, cell[3]);
    const i1 = G.v([p[0] - U[0] + V[0], p[1] - U[1] + V[1], p[2] - U[2] + V[2]], nr, basec, sway, fl * 0.6, leaf, glow, ub, cell[3]);
    const i2 = G.v([p[0] + U[0] + V[0], p[1] + U[1] + V[1], p[2] + U[2] + V[2]], nr, tipc, sway, fl * 1.5, leaf, glow, ub, cell[1]);
    const i3 = G.v([p[0] + U[0] - V[0], p[1] + U[1] - V[1], p[2] + U[2] - V[2]], nr, tipc, sway, fl * 1.5, leaf, glow, ua, cell[1]);
    G.quad(i0, i1, i2, i3);
  }
  return base;
}

// A flat tapered leaf / blade / petal strip along a curve. pts: centre line, widths per point, `up` = facing normal hint.
// o: { c0, c1 | col(t), sway: number|number[], flutter, leaf, glow, fold: V-fold depth (0 flat), nrm: fixed shading normal,
//      uv: atlas cell [u0,v0,u1,v1] (base of the strip at v1) }
function strip(G, pts, widths, up, o = {}) {
  const n = pts.length, c0 = o.c0, c1 = o.c1 || c0; let prev = null;
  for (let i = 0; i < n; i++) {
    const tan = vnorm(vsub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
    let side = vcross(tan, up); if (vlen(side) < 1e-4) side = perp(tan); side = vnorm(side);
    if (o.twist) side = vrot(side, tan, o.twist * i / (n - 1));
    let nr = o.nrm || vnorm(vcross(side, tan)); if (o.upBias) nr = vnorm([nr[0], nr[1] + o.upBias, nr[2]]);
    const t = i / (n - 1), w = widths[i] * 0.5;
    const col = o.col ? o.col(t) : mix3(c0, c1, t);
    const sway = Array.isArray(o.sway) ? o.sway[i] : (o.sway || 0) , fl = (o.flutter ?? 1) * (o.flutterTip ? t : 1), glow = Array.isArray(o.glow) ? o.glow[i] : (o.glow || 0);
    const fold = (o.fold || 0) * w, uv = o.uv, tv = uv ? lerp(uv[3], uv[1], t) : SOLID_V, u0 = uv ? uv[0] : SOLID_U, u1 = uv ? uv[2] : SOLID_U;
    const a = G.v(vadd(vmad(pts[i], side, -w), vscale(nr, fold)), vnorm(vmad(nr, side, -(o.curl ?? 0.35))), col, sway, fl, o.leaf ?? 1, glow, u0, tv);
    const b = G.v(vadd(vmad(pts[i], side, w), vscale(nr, fold)), vnorm(vmad(nr, side, (o.curl ?? 0.35))), col, sway, fl, o.leaf ?? 1, glow, u1, tv);
    let m = -1;
    if (o.fold) m = G.v(pts[i], nr, mul3(col, o.midrib ?? 0.8), sway, fl, o.leaf ?? 1, glow, (u0 + u1) * 0.5, tv);
    if (prev) {
      if (o.fold) { G.quad(prev[0], prev[2], m, a); G.quad(prev[2], prev[1], b, m); }
      else G.quad(prev[0], prev[1], b, a);
    }
    prev = [a, b, m];
  }
}

// curve helper: n+1 points from p0 heading dir, bending toward `pull` (e.g. gravity [0,-1,0]) by `bend` per unit t
function arc(p0, dir, len, n, pull, bend, rng, wobble = 0) {
  const pts = [p0]; let d = vnorm(dir), p = p0;
  for (let i = 1; i <= n; i++) {
    d = vnorm(vadd(d, vscale(pull, bend / n)));
    if (wobble && rng) d = vnorm(vadd(d, [(rng() - 0.5) * wobble, (rng() - 0.5) * wobble, (rng() - 0.5) * wobble]));
    p = vmad(p, d, len / n); pts.push(p);
  }
  return pts;
}

// ---------------------------------------------------------------------------------------------
// leaf atlas texture (procedural, drawn once per material on an offscreen canvas)
// ---------------------------------------------------------------------------------------------
// makeLeafTexture({ size: 1024, seed, anisotropy: 1 }) -> THREE.DataTexture (size x size/2). RGB = grey leaf shading (multiplies vertex colour), A = cut-out.
// 4 x 2 cells: leaf cluster, conifer bough, pinnate frond, grass tuft / flower tuft, willow strand, sea-fan lattice, solid white.
// Mip levels are built by hand (alpha-weighted colour, cut-out coverage preserved per cell), so distant cards neither fill in nor vanish.  Cost ~20-40 ms.
// The drawing depends only on size, seed and alphaTest, so its pixels are kept for the session: the first world that
// asks pays for the drawing, every later one gets its own texture over the same pixels at no cost.
// prepareLeafTexture(options, ctx.yield) pays for that drawing ahead of time, in short steps that hand the page back in between, and keeps
// the pixels, so the makeLeafTexture / windMaterial call that follows does no pixel work:
//   `await flora.prepareLeafTexture(matOptions, ctx.yield); const mat = flora.windMaterial(matOptions);`
// options: the object you are about to give makeLeafTexture (size, seed, alphaTest are read) or windMaterial (alphaTest is read; with a
// `map` it will draw no atlas, so nothing is prepared); `{}` for the defaults. Resolves true once the pixels are kept (at once if they
// already are), false if there is nothing to prepare (a `map` was given, or the seed is not a string or number).
const leafCache = new Map();
const leafKey = (o) => { const seed = o.seed ?? 'flora-leaf'; return (typeof seed === 'string' || typeof seed === 'number') ? `${o.size || 1024}|${typeof seed}${seed}|${o.alphaTest ?? 0.4}` : null; };
// (the default atlas, which most worlds ask for, is never dropped: the engine draws it once, in steps, before a build, so
// that a world asking windMaterial for it in one piece finds it kept and does no pixel work)
const LEAF_DEFAULT = '1024|stringflora-leaf|0.4';
const leafKeep = (key, c) => { if (key) { if (leafCache.size >= 4) { for (const k of leafCache.keys()) if (k !== LEAF_DEFAULT) { leafCache.delete(k); break; } } leafCache.set(key, c); } return c; };
export function makeLeafTexture(o = {}) {
  const key = leafKey(o), c = (key && leafCache.get(key)) || leafKeep(key, leafPixels(o));
  const tex = new THREE.DataTexture(c.px, c.w, c.h, THREE.RGBAFormat);
  tex.mipmaps = c.mips; tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = o.anisotropy ?? 1; tex.needsUpdate = true;
  return tex;
}
export async function prepareLeafTexture(o = {}, yieldFn, slice = 8) {
  if (!o || o.map !== undefined) return false;
  const key = leafKey(o); if (!key) return false;
  if (leafCache.has(key)) return true;
  const it = leafPixelSteps(o, true); let r, t = nowMs();
  while (!(r = it.next()).done) {
    if (yieldFn && nowMs() - t > slice) { await yieldFn(); if (leafCache.has(key)) return true; t = nowMs(); }   // someone else drew it meanwhile
  }
  leafKeep(key, r.value); return true;
}
function leafPixels(o = {}) { const it = leafPixelSteps(o, false); let r; while (!(r = it.next()).done); return r.value; }
// The drawing as a generator: a yield after every few leaves / every row of a cell / every block of pixel rows, so no stretch between
// two yields is more than a few ms. `stepped` (prepareLeafTexture) also reads one pixel back at each drawing yield: browsers only record
// canvas calls and paint them all at the next read-back, so without it the whole painting would land in the one final getImageData.
// A read-back never changes what is drawn, so both ways give the same pixels; the one-piece path keeps its single read-back.
function* leafPixelSteps(o = {}, stepped = false) {
  const S = o.size || 1024, h = S / 4, k = h / 256, rng = makeRng(o.seed ?? 'flora-leaf');
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(S, h * 2) : Object.assign(document.createElement('canvas'), { width: S, height: h * 2 });
  const g = cv.getContext('2d', { willReadFrequently: true });
  const paint = stepped ? () => { g.getImageData(0, 0, 1, 1); } : () => {};
  const grey = (v) => { v = Math.round(clamp(v, 0, 255)); return `rgb(${v},${v},${v})`; };
  const leaf = (x, y, a, len, wid, v0, v1, rib = true) => {
    const dx = Math.cos(a), dy = Math.sin(a), tx = x + dx * len, ty = y + dy * len, mx = x + dx * len * 0.45, my = y + dy * len * 0.45, px = -dy * wid, py = dx * wid;
    const gr = g.createLinearGradient(x, y, tx, ty); gr.addColorStop(0, grey(v0)); gr.addColorStop(1, grey(v1));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx + px, my + py, tx, ty); g.quadraticCurveTo(mx - px, my - py, x, y); g.fill();
    if (!rib) return;
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.3 * k; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * len * 0.85, y + dy * len * 0.85); g.stroke();
  };
  // curved tapering blade from (x, y0) up to height hh, leaning by lean
  const blade = (x, y0, hh, w, lean, v0, v1) => {
    const tx = x + lean, ty = y0 - hh, cx = x + lean * 0.15, cy = y0 - hh * 0.6;
    const gr = g.createLinearGradient(0, y0, 0, ty); gr.addColorStop(0, grey(v0)); gr.addColorStop(1, grey(v1));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - w, y0); g.quadraticCurveTo(cx - w * 0.7, cy, tx, ty); g.quadraticCurveTo(cx + w * 0.7, cy, x + w, y0); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.2 * k; g.stroke();
  };
  const cellClip = (cx, cy) => { g.save(); g.beginPath(); g.rect(cx * h + 3 * k, cy * h + 3 * k, h - 6 * k, h - 6 * k); g.clip(); g.translate(cx * h, cy * h); };
  yield;   // the canvas exists
  // cluster of broad leaves, darker in the middle, bright at the rim
  cellClip(0, 0);
  for (let i = 0; i < 46; i++) {
    const u = i / 46, a = rng() * TAU, r = h * 0.31 * Math.sqrt(0.08 + 0.92 * u), x = h / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r;
    const dir = a + rng.range(-1.0, 1.0), len = h * rng.range(0.17, 0.25), sh = 0.82 + 0.18 * u;
    leaf(x - Math.cos(dir) * len * 0.35, y - Math.sin(dir) * len * 0.35, dir, len, len * rng.range(0.36, 0.5), rng.range(165, 200) * sh, rng.range(232, 255) * sh);
    if (i % 8 === 7) { paint(); yield; }
  }
  g.restore(); paint(); yield;
  // conifer bough: stem, side twigs, dense needles
  cellClip(1, 0);
  {
    const bx = h * 0.5, y0 = h - 6 * k, y1 = 8 * k;
    const twig = (x, y, a, L, v) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      leaf(x, y, a, L, L * 0.2 + 3 * k, v * 0.62, v * 0.9, false);
      g.lineWidth = 2.1 * k;
      for (let d = 2 * k; d < L; d += 2.7 * k) {
        const t = d / L, nl = h * 0.06 * (1 - 0.55 * t) * rng.range(0.75, 1.2), px = x + dx * d, py = y + dy * d; g.strokeStyle = grey(lerp(v * 0.66, v, t) * rng.range(0.85, 1.05));
        for (const sgn of [-1, 1]) { const na = a + sgn * 0.8; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(na) * nl, py + Math.sin(na) * nl); g.stroke(); }
      }
    };
    for (let t = 0.03; t < 0.9; t += 0.075) {
      const L = h * 0.5 * Math.pow(1 - t, 0.8) * Math.min(1, 0.45 + t * 4), y = lerp(y0, y1, t);
      for (const sgn of [-1, 1]) twig(bx, y + rng.range(-2, 2) * k, -Math.PI / 2 + sgn * rng.range(0.78, 0.98), L * rng.range(0.85, 1.08), 255);
      paint(); yield;
    }
    twig(bx, lerp(y0, y1, 0.72), -Math.PI / 2, (y0 - y1) * 0.27, 255);
    g.strokeStyle = grey(120); g.lineWidth = 3.4 * k; g.beginPath(); g.moveTo(bx, y0 + 6 * k); g.lineTo(bx, lerp(y0, y1, 0.8)); g.stroke();
  }
  g.restore(); paint(); yield;
  // pinnate frond: rachis with paired pointed leaflets
  cellClip(2, 0);
  {
    const bx = h * 0.5, y0 = h - 4 * k, y1 = 6 * k;
    for (let t = 0.04, row = 0; t < 0.97; t += 0.036, row++) {
      const L = h * 0.5 * Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * t)), 0.55), y = lerp(y0, y1, t), fw = lerp(1.25, 0.5, t);
      for (const sgn of [-1, 1]) leaf(bx, y, -Math.PI / 2 + sgn * (fw + rng.range(-0.06, 0.06)), L * rng.range(0.9, 1.05), L * 0.075 + 2.4 * k, 150, rng.range(225, 255));
      if (row % 4 === 3) { paint(); yield; }
    }
    leaf(bx, lerp(y0, y1, 0.9), -Math.PI / 2, (y0 - y1) * 0.1, 4 * k, 170, 255);
    g.strokeStyle = grey(135); g.lineWidth = 3.2 * k; g.beginPath(); g.moveTo(bx, y0 + 4 * k); g.lineTo(bx, lerp(y0, y1, 0.93)); g.stroke();
  }
  g.restore(); paint(); yield;
  // grass tuft: a bell-shaped spray (tall in the middle, short and splayed at the edges) so a minified tuft collapses to a mound
  // tuft(n blades, height factor, grey range): blades fan outward from a narrow base
  const tuft = (n, hk, v0, v1) => {
    for (let i = 0; i < n; i++) {
      const j = (i * 7) % n, xn = (j + 0.5) / n + rng.range(-0.02, 0.02), bell = Math.pow(Math.sin(Math.PI * sat(xn)), 1.6);
      const hh = h * hk * (0.24 + 0.72 * bell) * rng.range(0.78, 1.0), x = h * lerp(0.24, 0.76, xn), sh = rng.range(0.9, 1.0);
      const lean = clamp(x + h * ((xn - 0.5) * 0.42 * rng.range(0.5, 1.3) + rng.range(-0.04, 0.04)), h * 0.06, h * 0.94) - x;
      blade(x, h - 2 * k, hh, h * rng.range(0.026, 0.04), lean, v0 * sh, v1 * sh);
    }
  };
  const softRoot = () => { const gr = g.createLinearGradient(0, h, 0, h * 0.9); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(0, h * 0.9, h, h * 0.1); g.globalCompositeOperation = 'source-over'; };
  cellClip(3, 0);
  tuft(17, 1.0, 236, 255);
  softRoot();   // blades dissolve into the ground instead of ending on a hard line
  g.restore(); paint(); yield;
  // flower tuft: a low spray of leaves, flower heads on stems in the top 45 % (tinted per instance through the petal mask)
  cellClip(0, 1);
  tuft(9, 0.56, 228, 250);
  paint(); yield;
  for (let i = 0; i < 5; i++) {
    const xn = (i + 0.5) / 5, x0 = h * lerp(0.38, 0.62, xn), x1 = h * lerp(0.17, 0.83, xn + rng.range(-0.06, 0.06)), y1 = h * (0.34 - 0.2 * Math.sin(Math.PI * xn) + rng.range(-0.03, 0.05)), r = h * rng.range(0.085, 0.115);
    g.strokeStyle = grey(175); g.lineWidth = 3 * k; g.beginPath(); g.moveTo(x0, h * 0.94); g.quadraticCurveTo(x0, h * 0.6, x1, y1 + r * 0.4); g.stroke();
    const np = rng.int(5, 7), a0 = rng() * TAU;
    for (let j = 0; j < np; j++) { const a = a0 + (j / np) * TAU; leaf(x1 + Math.cos(a) * r * 0.12, y1 + Math.sin(a) * r * 0.12, a, r, r * 0.62, 215, 255, false); }
    g.fillStyle = grey(105); g.beginPath(); g.arc(x1, y1, r * 0.26, 0, TAU); g.fill();
  }
  softRoot();
  g.restore(); paint(); yield;
  // willow strand: a thin stem with small alternate lanceolate leaves, drawn 6:1 so one strip segment of 6 widths maps the cell once
  cellClip(1, 1);
  {
    const sy = 1 / 6, L = h * 6, n = 14;
    g.save(); g.scale(1, sy);
    g.strokeStyle = grey(165); g.lineWidth = 15 * k; g.beginPath(); g.moveTo(h * 0.5, L + 30 * k);
    for (let i = 1; i <= 12; i++) g.lineTo(h * (0.5 + 0.018 * Math.sin(i * 1.047)), L - (L / 12) * i);
    g.lineTo(h * 0.5, -30 * k); g.stroke();
    for (let i = 0; i < n; i++) {
      const y = L * (0.97 - 0.92 * (i + rng.range(0.2, 0.8)) / n), sg = i % 2 ? 1 : -1, a = -Math.PI / 2 + sg * rng.range(0.3, 0.52), len = h * rng.range(0.78, 0.98), sh = rng.range(0.8, 1.0);
      leaf(h * 0.5, y, a, len, len * rng.range(0.27, 0.35), 190 * sh, 255 * sh, false);
    }
    g.restore();
  }
  g.restore(); paint(); yield;
  // sea-fan lattice: branching veins inside a half-ellipse with a ragged rim, tied together by fine cross-links
  cellClip(2, 1);
  {
    const bx = h * 0.5, by = h - 5 * k, ex = h * 0.455, ey = h * 0.93, lobes = [rng() * TAU, rng() * TAU];
    const inside = (x, y) => { const dx = (x - bx) / ex, dy = (by - y) / ey, a = Math.atan2(dx, dy); return dx * dx + dy * dy < Math.pow(0.84 + 0.1 * Math.sin(a * 7 + lobes[0]) + 0.07 * Math.sin(a * 13 + lobes[1]), 2) && dy > 0.01; };
    g.lineCap = 'round';
    for (let f = 0.2; f < 0.86; f += 0.062) {   // cross-links first, veins over them
      g.strokeStyle = grey(175 + 60 * f); g.lineWidth = 1.7 * k; g.beginPath();
      for (let i = 0; i <= 40; i++) { const a = lerp(-1.42, 1.42, i / 40), rr = f * (1 + 0.035 * Math.sin(a * 9 + f * 30)), x = bx + Math.sin(a) * ex * rr, y = by - Math.cos(a) * ey * rr; if (i === 0 || !inside(x, y)) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    paint(); yield;
    const vein = (x, y, a, len, w, depth) => {
      const x1 = x + Math.sin(a) * len, y1 = y - Math.cos(a) * len;
      if (!inside(x1, y1)) { if (depth > 3 && len > 6 * k) vein(x, y, a, len * 0.5, w, depth); return; }
      g.strokeStyle = grey(lerp(165, 255, sat(depth / 6))); g.lineWidth = Math.max(1.9 * k, w); g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke();
      if (depth >= 7) return;
      const sp = rng.range(0.15, 0.3), na = clamp(a, -1.25, 1.25);
      if (depth < 2 || rng() < 0.6) {
        vein(x1, y1, na - sp * rng.range(0.6, 1.2), len * rng.range(0.74, 0.92), w * 0.8, depth + 1);
        vein(x1, y1, na + sp * rng.range(0.6, 1.2), len * rng.range(0.74, 0.92), w * 0.8, depth + 1);
      } else vein(x1, y1, na + rng.range(-0.14, 0.14), len * rng.range(0.8, 0.95), w * 0.88, depth + 1);
    };
    g.strokeStyle = grey(150); g.lineWidth = 9 * k; g.beginPath(); g.moveTo(bx, h); g.lineTo(bx, by - h * 0.1); g.stroke();
    for (const a of [-0.95, -0.48, 0, 0.48, 0.95]) { vein(bx, by - h * 0.07, a + rng.range(-0.08, 0.08), h * rng.range(0.17, 0.2), 6.5 * k, 0); paint(); yield; }
    g.lineCap = 'butt';
  }
  g.restore();
  g.fillStyle = '#fff'; g.fillRect(h * 3, h, h, h);
  paint(); yield;
  const img = g.getImageData(0, 0, S, h * 2);
  yield;
  const px = new Uint8Array(img.data.buffer.slice(0));
  yield;
  return { px, w: S, h: h * 2, mips: yield* leafMipSteps(px, S, h * 2, o.alphaTest ?? 0.4) };
}

// Mip chain for the atlas (4 x 2 cells). Colour is alpha-weighted so cut-out edges do not fringe, and the alpha of every level is
// rescaled per cell so the fraction of texels passing the alpha test stays what it is at full size: distant cards neither thin out
// nor fill in to solid rectangles. Stops where a cell is two texels wide (cells never bleed into each other).
// A generator (see leafPixelSteps): the loops are plain functions over a block of rows (about 8000 texels), with a yield after each block,
// so a step stays short even on the first call of a visit, before the browser has compiled these loops.
function* leafMipSteps(px, W, H, ref) {
  const cw = W / 4, ch = H / 2, thr = Math.max(1, Math.round(ref * 255)), cov = new Float32Array(8), levels = [{ data: px, width: W, height: H }];
  const rowsPer = (texels, wide) => Math.max(1, Math.floor(texels / wide));
  for (let c = 0, rb = rowsPer(8192, cw); c < 8; c++) {
    const x0 = (c % 4) * cw, y0 = (c >> 2) * ch, sum = [0, 0, 0];
    for (let y = 0; y < ch; y += rb) { leafCoverRows(px, W, x0, y0, cw, y, Math.min(ch, y + rb), thr, sum); yield; }
    cov[c] = sum[0] / (cw * ch); const avg = sum[2] > 0 ? Math.round(sum[1] / sum[2]) : 160;
    for (let y = 0; y < ch; y += rb) { leafFillRows(px, W, x0, y0, cw, y, Math.min(ch, y + rb), avg); yield; }   // no dark halo under magnification
  }
  let src = px, w = W, hgt = H;
  while (w > 8) {
    const nw = w >> 1, nh = hgt >> 1, dst = new Uint8Array(nw * nh * 4), rb = rowsPer(4096, nw);
    for (let y = 0; y < nh; y += rb) { leafMipRows(src, w, dst, nw, y, Math.min(nh, y + rb)); yield; }
    levels.push({ data: dst, width: nw, height: nh }); src = dst; w = nw; hgt = nh;
  }
  const hist = new Uint32Array(256);
  for (let l = 1; l < levels.length; l++) {
    const { data, width } = levels[l], lw = cw >> l, lh = ch >> l, rb = rowsPer(8192, lw);
    for (let c = 0; c < 8; c++) {
      if (cov[c] <= 0.002 || cov[c] >= 0.998) continue;
      const x0 = (c % 4) * lw, y0 = (c >> 2) * lh; hist.fill(0);
      for (let y = 0; y < lh; y += rb) { leafHistRows(data, width, x0, y0, lw, y, Math.min(lh, y + rb), hist); yield; }
      let need = cov[c] * lw * lh, q = 255, acc = 0; for (; q > 0; q--) { acc += hist[q]; if (acc >= need) break; }   // the alpha value that the top `cov` fraction exceeds
      const s = clamp((thr + 1) / Math.max(1, q), 0.5, 6);
      for (let y = 0; y < lh; y += rb) { leafScaleRows(data, width, x0, y0, lw, y, Math.min(lh, y + rb), s); yield; }
    }
  }
  return levels;
}
// rows ya..yb of one full-size cell: adds to sum = [texels passing the alpha test, alpha-weighted grey, alpha]
function leafCoverRows(px, W, x0, y0, cw, ya, yb, thr, sum) {
  let n = sum[0], r = sum[1], m = sum[2];
  for (let y = ya; y < yb; y++) { let i = ((y0 + y) * W + x0) * 4; for (let x = 0; x < cw; x++, i += 4) { const a = px[i + 3]; if (a >= thr) n++; if (a > 0) { r += px[i] * a; m += a; } } }
  sum[0] = n; sum[1] = r; sum[2] = m;
}
// rows ya..yb of one full-size cell: empty texels take the cell's mean grey
function leafFillRows(px, W, x0, y0, cw, ya, yb, avg) {
  for (let y = ya; y < yb; y++) { let i = ((y0 + y) * W + x0) * 4; for (let x = 0; x < cw; x++, i += 4) if (px[i + 3] === 0) px[i] = px[i + 1] = px[i + 2] = avg; }
}
// rows ya..yb of the next level down (dst, nw wide) from src (w wide)
function leafMipRows(src, w, dst, nw, ya, yb) {
  for (let y = ya; y < yb; y++) for (let x = 0; x < nw; x++) {
    const i0 = (y * 2 * w + x * 2) * 4, i1 = i0 + 4, i2 = i0 + w * 4, i3 = i2 + 4, q = (y * nw + x) * 4;
    const a0 = src[i0 + 3], a1 = src[i1 + 3], a2 = src[i2 + 3], a3 = src[i3 + 3], as = a0 + a1 + a2 + a3;
    const v = as > 0 ? (src[i0] * a0 + src[i1] * a1 + src[i2] * a2 + src[i3] * a3) / as : src[i0];   // the atlas is grey: one channel is enough
    dst[q] = dst[q + 1] = dst[q + 2] = v; dst[q + 3] = as >> 2;
  }
}
// rows ya..yb of one cell of one mip level: count its alpha values / rescale them
function leafHistRows(data, width, x0, y0, lw, ya, yb, hist) {
  for (let y = ya; y < yb; y++) { let i = ((y0 + y) * width + x0) * 4 + 3; for (let x = 0; x < lw; x++, i += 4) hist[data[i]]++; }
}
function leafScaleRows(data, width, x0, y0, lw, ya, yb, s) {
  for (let y = ya; y < yb; y++) { let i = ((y0 + y) * width + x0) * 4 + 3; for (let x = 0; x < lw; x++, i += 4) data[i] = Math.min(255, data[i] * s); }
}

// ---------------------------------------------------------------------------------------------
// wind
// ---------------------------------------------------------------------------------------------
// makeWind({ direction: [x,z] | radians, strength: 1, speed: 1, gustScale: 0.045, gustiness: 0.55 })
// One wind object can be shared by every flora material in a world: { uniforms, update(time), set(opts) }.
export function makeWind(o = {}) {
  const uniforms = {
    uFloraTime: { value: 0 },
    uFloraWind: { value: new THREE.Vector4(0.8, 0.6, 1, 1) },   // dir.x, dir.z, strength, speed
    uFloraGust: { value: new THREE.Vector2(0.045, 0.55) },      // spatial frequency of gust fronts, gust amount
  };
  const wind = {
    uniforms,
    set(p = {}) {
      const w = uniforms.uFloraWind.value, g = uniforms.uFloraGust.value;
      if (p.direction !== undefined) {
        const d = typeof p.direction === 'number' ? [Math.cos(p.direction), Math.sin(p.direction)] : p.direction;
        const l = Math.hypot(d[0], d[1]) || 1; w.x = d[0] / l; w.y = d[1] / l;
      }
      if (p.strength !== undefined) w.z = p.strength;
      if (p.speed !== undefined) w.w = p.speed;
      if (p.gustScale !== undefined) g.x = p.gustScale;
      if (p.gustiness !== undefined) g.y = p.gustiness;
      return wind;
    },
    update(time) { uniforms.uFloraTime.value = time; },
  };
  return wind.set(o);
}

// updateWind(target, time): target is a wind object, a flora material, anything returned by a make*() factory, or an array of those.
export function updateWind(target, time) {
  if (!target) return;
  if (Array.isArray(target)) { for (const t of target) updateWind(t, time); return; }
  const w = target.uniforms?.uFloraTime ? target : (target.wind || target.userData?.wind);
  if (w && w.uniforms?.uFloraTime) w.uniforms.uFloraTime.value = time;
}

const WIND_GLSL = /* glsl */`
uniform float uFloraTime; uniform vec4 uFloraWind; uniform vec2 uFloraGust;
// slow travelling gust fronts, ~0..1.2
float floraGust(vec2 xz) {
  float t = uFloraTime * uFloraWind.w;
  float ph = dot(xz, uFloraWind.xy) * uFloraGust.x - t * 1.15;
  float cr = dot(xz, vec2(-uFloraWind.y, uFloraWind.x)) * uFloraGust.x;
  float g = sin(ph + sin(cr * 0.7 + t * 0.31) * 1.3) * 0.5 + sin(ph * 2.7 + cr * 1.9 + 1.3) * 0.28 + sin(ph * 0.37 - t * 0.2) * 0.22;
  return 0.55 + g * uFloraGust.y;
}
// world-space displacement for a vertex. w = wind attribute (sway m, flutter, leaf, glow), sc = plant scale, g = floraGust at the plant
vec3 floraSway(vec3 wp, vec3 origin, vec4 w, float sc, float g) {
  float t = uFloraTime * uFloraWind.w, st = uFloraWind.z;
  float ph = origin.x * 0.37 + origin.z * 0.53 + wp.y * 0.12;
  vec2 bend = uFloraWind.xy * g + vec2(sin(t * 1.3 + ph), cos(t * 1.1 + ph * 1.3)) * 0.24;
  float a = w.x * sc * st;
  vec3 d = vec3(bend.x * a, -dot(bend, bend) * a * 0.12, bend.y * a);
  float f1 = sin(t * 5.3 + wp.x * 2.1 + wp.y * 1.3 + wp.z * 1.7), f2 = cos(t * 4.1 + wp.z * 2.3 + wp.x * 1.1 - wp.y * 0.7);
  d += vec3(f1, f2 * 0.7, f1 * f2) * (w.y * 0.045 * st * (0.4 + g) * min(sc, 2.5));
  return d;
}`;

const NOISE_GLSL = /* glsl */`
float floraHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float floraNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(floraHash(i), floraHash(i + vec3(1,0,0)), f.x), mix(floraHash(i + vec3(0,1,0)), floraHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(floraHash(i + vec3(0,0,1)), floraHash(i + vec3(1,0,1)), f.x), mix(floraHash(i + vec3(0,1,1)), floraHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

// FLORA_CAUSTIC_GLSL: `float floraCaustic(vec2 xz, float time)` -> ~0..1.5, a drifting web of light. windMaterial({ caustics }) uses it;
// paste it into your own sea-bed shader so the floor and the plants share the same light: the material evaluates
// floraCaustic(world.xz * causticScale + world.y * 0.05, time * 0.55) * 2.2 - 0.5 and scales the direct light by 1 + caustics * that.
export const FLORA_CAUSTIC_GLSL = /* glsl */`
float floraCaustic(vec2 p, float t) {
  p = mod(p, 6.2831853) - 250.0; vec2 i = p; float c = 1.0;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) * 200.0), p.y / (cos(i.y + tt) * 200.0)));
  }
  c = 1.17 - pow(c / 3.0, 1.4);
  return pow(abs(c), 8.0);
}`;

// vertex stage shared by the lit material and its depth twin
const floraVertex = (src, lit) => src
  .replace('#include <common>', '#include <common>\nattribute vec4 wind;\n' + (lit ? 'attribute vec3 petal;\nvarying vec4 vFlora;\nvarying vec3 vFloraPos;\nvarying vec3 vFloraWorld;\nuniform vec3 uFloraFade;\n' : '') + WIND_GLSL)
  .replace('#include <color_vertex>', /* glsl */`#include <color_vertex>
        #if defined( USE_COLOR ) && defined( USE_INSTANCING )
          { float fPetal = clamp(wind.z - 1.0, 0.0, 1.0); vColor.rgb = mix(vColor.rgb, color.rgb * petal, fPetal); }   // petals take their own per-instance colour
        #endif`)
  .replace('#include <project_vertex>', /* glsl */`
        vec4 fWorld = vec4(transformed, 1.0); vec3 fOrigin = vec3(0.0); float fScale = 1.0;
        #ifdef USE_INSTANCING
          fWorld = instanceMatrix * fWorld; fOrigin = instanceMatrix[3].xyz; fScale = length(instanceMatrix[1].xyz);
        #endif
        fWorld = modelMatrix * fWorld; fOrigin = (modelMatrix * vec4(fOrigin, 1.0)).xyz; fScale *= length(modelMatrix[1].xyz);
        float fGust = floraGust(fOrigin.xz + fWorld.xz * 0.2);
        fWorld.xyz += floraSway(fWorld.xyz, fOrigin, wind, fScale, fGust);
        ${lit ? `vFloraPos = transformed * fScale + fOrigin * 0.613;
        if (uFloraFade.y > 0.0) fWorld.xyz = mix(fWorld.xyz, vec3(fWorld.x, fOrigin.y - 0.2, fWorld.z), smoothstep(uFloraFade.x, uFloraFade.y, distance(cameraPosition, fOrigin)));
        vFlora = vec4(min(wind.z, 1.0), wind.w, fGust * min(wind.y, 1.5), min(wind.y, 1.0)); vFloraWorld = fWorld.xyz;` : ''}
        vec4 mvPosition = viewMatrix * fWorld;
        gl_Position = projectionMatrix * mvPosition;`);

// windMaterial(options): lit vertex-colour material that sways by the `wind` attribute.
//   wind: makeWind() object to share (one is created if omitted)      standard: false (Lambert) | true (MeshStandardMaterial)
//   map: leaf atlas (default makeLeafTexture(); pass a shared one, or null for no cut-outs), alphaTest: 0.4, alphaToCoverage: true
//   backlight: 0.9 translucent glow of leaves seen against the sun      backlightTint: '#d8ff7a'
//   wrap: 0.8 soft terminator on leaves, ambient: 2.1 / leafAmbient: 1.8 multipliers on hemisphere + ambient light (wood / leaves)
//   glow: 1 multiplier for the per-vertex glow (emissive = vertex colour * |glow attr| * this; negative glow attr = shaded as a glowing volume)
//   detail: 0.35 strength of the procedural bark (plates, furrows, grain)   detailScale: 1   barkBump: 0.6 relief of that bark in the lighting
//   sheen: 0.35 brightness ripple carried by gusts                   fade: [start, end] metres from the camera over which plants sink away (grass)
//   caustics: 0 strength of underwater light ripples on sunlit surfaces, causticScale: 0.5 (1/m; the web of light repeats every 2 pi / scale metres)
//   side, color, roughness, metalness, flatShading, transparent, opacity, emissive, emissiveIntensity, fog: passed to the base material
//   hold: false | true | [colour, glow, lit]: hold the vertex colour, the glow weight and the lit colour to the largest values the plants
//     carry. Without it a multisample that falls outside a facet thinner than a pixel (a far crystal, a gill wedge) runs the
//     interpolated colour and glow past their ends, their product comes out hundreds of times too bright, and bloom spreads that one
//     sample into a glowing square (seen only with antialiasing). true: no limit until holdGlow(material, geometries) reads the
//     limits from the geometries drawn with it; a list gives them directly. Nothing inside the range changes.
// Returns the material; material.userData = { wind, uniforms, depthMaterial (see windDepthMaterial) }.
export function windMaterial(o = {}) {
  const wind = o.wind || makeWind();
  const params = { vertexColors: true, side: o.side ?? THREE.DoubleSide, color: o.color ?? 0xffffff, flatShading: !!o.flatShading, fog: o.fog ?? true };
  const map = o.map === undefined ? makeLeafTexture({ alphaTest: o.alphaTest }) : o.map;
  if (map) { params.map = map; params.alphaTest = o.alphaTest ?? 0.4; params.alphaToCoverage = o.alphaToCoverage ?? true; }
  if (o.transparent) { params.transparent = true; params.opacity = o.opacity ?? 1; params.depthWrite = o.depthWrite ?? false; }
  if (o.emissive !== undefined) { params.emissive = o.emissive; params.emissiveIntensity = o.emissiveIntensity ?? 1; }
  let mat;
  if (o.standard) mat = new THREE.MeshStandardMaterial({ ...params, roughness: o.roughness ?? 0.82, metalness: o.metalness ?? 0 });
  else mat = new THREE.MeshLambertMaterial(params);
  const caustics = (o.caustics ?? 0) > 0;
  const U = {
    ...wind.uniforms,
    uFloraBack: { value: o.backlight ?? 0.9 },
    uFloraBackTint: { value: new THREE.Color(o.backlightTint ?? '#d8ff7a') },
    uFloraGlow: { value: o.glow ?? 1 },
    uFloraLight: { value: new THREE.Vector3(o.wrap ?? 0.8, o.ambient ?? 2.1, o.leafAmbient ?? 1.8) },
    uFloraDetail: { value: new THREE.Vector3(o.detail ?? 0.35, o.detailScale ?? 1, o.barkBump ?? 0.6) },
    uFloraFade: { value: new THREE.Vector3(o.fade ? o.fade[0] : 0, o.fade ? o.fade[1] : 0, o.sheen ?? 0.35) },
    uFloraCaustic: { value: new THREE.Vector2(o.caustics ?? 0, o.causticScale ?? 0.5) },
  };
  const hold = !!o.hold;
  if (hold) U.uFloraHold = { value: Array.isArray(o.hold) ? new THREE.Vector3(o.hold[0], o.hold[1], o.hold[2] ?? o.hold[0] * 1.4) : new THREE.Vector3(1e3, 1e3, 1e3) };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = floraVertex(shader.vertexShader, true);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vFlora;\nvarying vec3 vFloraPos;\nvarying vec3 vFloraWorld;\nuniform float uFloraBack, uFloraGlow, uFloraTime; uniform vec3 uFloraBackTint, uFloraLight, uFloraFade, uFloraDetail; uniform vec2 uFloraCaustic;\n' + NOISE_GLSL + (caustics ? FLORA_CAUSTIC_GLSL : ''))
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float fLeaf = vFlora.x, fBarkH = 1.0, fBarkK = 0.0;
        vec3 fq = vFloraPos * uFloraDetail.y;
        float fpx = length(fwidth(fq)) * 6.0;                                     // bark cycles per pixel: fade the detail out before it aliases
        if (uFloraDetail.x > 0.0 && fLeaf < 0.5) {   // bark and stems: plates split by dark furrows, plus fine grain (leaves get their detail from the atlas)
          fBarkK = saturate(1.7 - fpx * 2.4) * (1.0 - fLeaf * 2.0);
          float fn = floraNoise(fq * vec3(6.0, 0.85, 6.0)), fm = floraNoise(fq * vec3(19.0, 3.0, 19.0));
          float fn2 = floraNoise(fq * vec3(13.0, 1.7, 13.0) + 7.3);
          fBarkH = smoothstep(0.0, 0.42, abs(fn * 2.0 - 1.0)) * (0.62 + 0.2 * smoothstep(0.0, 0.5, abs(fn2 * 2.0 - 1.0))) + fm * 0.18;
          diffuseColor.rgb *= mix(1.0, (0.2 + 1.0 * fBarkH) * (0.84 + 0.32 * floraNoise(fq * vec3(1.7, 0.4, 1.7))), min(1.0, uFloraDetail.x * 2.4) * fBarkK);
        }
        diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.0)) * (1.0 + uFloraFade.z * (clamp(vFlora.z, -2.2, 3.9) - 0.3) * clamp(fLeaf, 0.0, 1.0));   // gust sheen: wind fronts ripple across foliage and grass. Colour, gust and leaf weight are held to the ranges they have inside a blade: a multisample outside a thin far blade runs them on past their ends and the product glows as a square`)
      .replace('#include <normal_fragment_begin>', /* glsl */`#include <normal_fragment_begin>
        #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
          if (fLeaf > 0.5) normal *= faceDirection;   // leaves keep their authored (volume) normal on both faces
        #endif
        {   // bark relief from the same height field (screen-space derivatives)
          float fBh = fBarkH * fBarkK * uFloraDetail.z * 0.05 / uFloraDetail.y;
          vec3 fSx = dFdx(-vViewPosition), fSy = dFdy(-vViewPosition);
          vec3 fR1 = cross(fSy, normal), fR2 = cross(normal, fSx);
          float fDet = dot(fSx, fR1) * faceDirection;
          vec3 fGr = sign(fDet) * (dFdx(fBh) * fR1 + dFdy(fBh) * fR2);
          if (fBarkK > 0.0) normal = normalize(abs(fDet) * normal - fGr);
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          vec3 fE = vColor.rgb * (abs(vFlora.y) * uFloraGlow);
          if (vFlora.y < 0.0) {   // glowing volume: hot pale core facing the eye, saturated rim that falls off, so the form survives the bloom
            float fV = saturate(dot(normal, normalize(vViewPosition))); fV *= fV;
            fE *= 0.2 + 1.5 * fV; fE = mix(fE, vec3(dot(fE, vec3(0.3, 0.6, 0.1))) * 1.1, fV * fV * 0.6);
          }
          totalEmissiveRadiance += fE;
        }`)
      .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
        #if NUM_DIR_LIGHTS > 0
        if (fLeaf > 0.01) {
          vec3 fL = directionalLights[0].direction;
          float fNL = dot(normal, fL);
          float fWrap = saturate((fNL + 0.6) / 1.6) - saturate(fNL);                 // soft terminator: light scattered inside the crown
          float fVL = saturate(dot(geometryViewDir, -fL));
          float fThru = saturate(0.25 - fNL * 0.75) * (0.35 + 0.65 * fVL * fVL)      // light through the leaf, strongest looking toward the sun
            + 0.3 * fVL * fVL * vFlora.w;                                            // thin fluttering tips (grass, leaf edges) glow against the sun whatever their normal
          reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb
            * (RECIPROCAL_PI * fLeaf) * (fWrap * uFloraLight.x + uFloraBackTint * (fThru * uFloraBack));
        }
        #endif
        ${caustics ? 'reflectedLight.directDiffuse *= 1.0 + uFloraCaustic.x * (floraCaustic(vFloraWorld.xz * uFloraCaustic.y + vFloraWorld.y * 0.05, uFloraTime * 0.55) * 2.2 - 0.5);' : ''}
        reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);`);
    if (hold) {   // the same shader with colour, glow and lit colour held to the ranges the plants carry (see holdGlow)
      const a = 'vec3 fE = vColor.rgb * (abs(vFlora.y) * uFloraGlow);', b = 'diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.0)) * (1.0 + uFloraFade.z';
      if (shader.fragmentShader.includes(a) && shader.fragmentShader.includes(b)) shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uFloraHold;')
        .replace(a, 'vec3 fE = clamp(vColor.rgb, 0.0, uFloraHold.x) * (min(abs(vFlora.y), uFloraHold.y) * uFloraGlow);')
        .replace(b, 'diffuseColor.rgb = clamp(diffuseColor.rgb, 0.0, uFloraHold.z) * (1.0 + uFloraFade.z');
    }
  };
  mat.customProgramCacheKey = () => 'flora-wind-2' + (o.standard ? 's' : 'l') + (caustics ? 'c' : '') + (hold ? 'h' : '');
  mat.userData.wind = wind; mat.userData.uniforms = U;
  mat.userData.depthMaterial = windDepthMaterial(mat);
  mat.addEventListener('dispose', () => mat.userData.depthMaterial.dispose());
  return mat;
}

// holdGlow(material, geometries, k = 1): for a windMaterial made with { hold: true }: reads the largest vertex colour component and the
// largest glow weight the given flora geometries carry and holds the shader's values to them (see windMaterial, hold). Call it once,
// with every geometry drawn with that material, after they exist. k: the largest factor the colours are multiplied by outside the
// geometry (instance colours, material.color); the lit colour is held at colour x 1.4, the most the bark detail makes of it.
// Returns [colour, glow] as held, or null when the material was not made with hold.
export function holdGlow(material, geometries, k = 1) {
  const u = material.userData.uniforms && material.userData.uniforms.uFloraHold; if (!u) return null;
  let c = 0, g = 0;
  for (const geo of [].concat(geometries || [])) {
    const ca = geo && geo.getAttribute && geo.getAttribute('color'), wa = geo && geo.getAttribute && geo.getAttribute('wind');
    if (ca) { const a = ca.array; for (let i = 0; i < a.length; i++) if (a[i] > c) c = a[i]; }
    if (wa && wa.itemSize === 4) { const a = wa.array; for (let i = 3; i < a.length; i += 4) { const v = Math.abs(a[i]); if (v > g) g = v; } }
  }
  if (!(c > 0)) return null;
  u.value.set(c * k, g, c * k * 1.4);
  return [c * k, g];
}

// windDepthMaterial(material): the shadow-pass twin of a windMaterial (same atlas cut-outs, same wind), so flora casts leaf-shaped,
// swaying shadows. Every windMaterial already carries one in material.userData.depthMaterial and the make*() factories assign it when
// `castShadow: true`; for your own meshes: mesh.castShadow = true; mesh.customDepthMaterial = mesh.material.userData.depthMaterial;
export function windDepthMaterial(mat) {
  const wind = mat.userData.wind;
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map || null, alphaTest: mat.map ? mat.alphaTest : 0, side: mat.side });
  dm.onBeforeCompile = (shader) => { Object.assign(shader.uniforms, wind.uniforms); shader.vertexShader = floraVertex(shader.vertexShader, false); };
  dm.customProgramCacheKey = () => 'flora-depth-2';
  dm.userData.wind = wind;
  return dm;
}
// shadow flags for a mesh drawn with a windMaterial
function setShadows(mesh, o) {
  if (o.castShadow) { mesh.castShadow = true; const dm = mesh.material.userData?.depthMaterial; if (dm) mesh.customDepthMaterial = dm; }
  if (o.receiveShadow) mesh.receiveShadow = true;
}

// ---------------------------------------------------------------------------------------------
// branching skeleton shared by the broadleaf trees
// ---------------------------------------------------------------------------------------------
// S: { height (nominal, for sway), trunkLen, trunkR, flex, flare, flute, barkCol(t,k,sides,depth), mottle, lean,
//      levels: [{ segs, sides, wander, up, taper, taperPow, children:[a,b], childAt:[t0,t1], angle:[a,b], lenK:[a,b], radK, sway, tipLeaf }] }
// Emits the wood into G and returns the branch tips: [{ p, dir, depth, sway, r, pts, sw }]
function skeleton(G, rng, S) {
  const tips = [], H = S.height;
  const swayAt = (y) => (S.flex ?? 1) * 0.028 * H * Math.pow(sat(y / H), 2);
  const grow = (p0, dir, len, r0, depth, extra0) => {
    const L = S.levels[depth], n = L.segs, pts = [p0], rad = [], sw = [];
    let d = dir, p = p0;
    for (let i = 1; i <= n; i++) {
      const wn = L.wander || 0;
      d = vnorm([d[0] + (rng() - 0.5) * wn, d[1] + (L.up || 0) / n + (rng() - 0.5) * wn * 0.6, d[2] + (rng() - 0.5) * wn]);
      p = vmad(p, d, len / n); pts.push(p);
    }
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      rad.push(r0 * lerp(1, L.taper ?? 0.5, Math.pow(t, L.taperPow ?? 1)) * (depth === 0 ? 1 + (S.flare ?? 0.6) * Math.exp(-t * (S.flareFall ?? 9)) : 1));
      sw.push(swayAt(pts[i][1]) + extra0 + (L.sway || 0) * t * len * (S.flex ?? 1));
    }
    tube(G, pts, rad, { sides: L.sides, col: (t, k, s) => S.barkCol(t, k, s, depth), rng, mottle: S.mottle ?? 0.14, sway: sw, flute: depth === 0 ? S.flute : null, capLen: L.capLen });
    const last = depth >= S.levels.length - 1;
    const info = { p: pts[n], dir: vnorm(vsub(pts[n], pts[n - 1])), depth, sway: sw[n], r: rad[n], pts, sw, len };
    if (last || L.tipLeaf) tips.push(info);
    if (last) return;
    const nc = rng.int(L.children[0], L.children[1]); let az = rng() * TAU;
    for (let c = 0; c < nc; c++) {
      const t = lerp(L.childAt[0], L.childAt[1], nc > 1 ? (c + rng() * 0.7) / (nc - 0.3) : rng());
      const f = Math.min(n - 0.001, t * n), i0 = Math.floor(f), q = vlerp(pts[i0], pts[i0 + 1], f - i0);
      const tan = vnorm(vsub(pts[i0 + 1], pts[i0]));
      az += 2.4 + rng.range(-0.5, 0.5);
      const cd = vnorm(vrot(vrot(tan, perp(tan), rng.range(L.angle[0], L.angle[1])), tan, az));
      const rr = lerp(rad[i0], rad[i0 + 1], f - i0);
      grow(q, cd, len * rng.range(L.lenK[0], L.lenK[1]), Math.min(rr * 0.85, r0 * (L.radK ?? 0.55)), depth + 1, lerp(sw[i0], sw[i0 + 1], f - i0) - swayAt(q[1]));
    }
  };
  grow([0, 0, 0], vnorm(S.lean || [0, 1, 0]), S.trunkLen, S.trunkR, 0, 0);
  return tips;
}

// bark colour function: darker furrows on alternate sides, lighter toward the twigs
// (the shader adds the furrows; the dark colour is lifted toward the bark colour so shaded trunks keep their form)
const barkFn = (bark, dark0, light) => { const dark = mix3(dark0, bark, 0.4); return (t, k, sides, depth) => {
  const c = (k % 2 ? dark : bark);
  return depth > 0 ? mix3(c, light || bark, 0.25 + 0.2 * depth) : mix3(dark, c, sstep(0, 0.12, t) * 0.8 + 0.2);
}; };

// Emits foliage clumps on the tips. o: { r, squash, detail (of the core), leaves, leafSize, lo, mid, hi, hueJitter, palettes: [[lo,mid,hi],...], extra, droop, lump, flex }
function crownFoliage(G, rng, tips, o) {
  if (!tips.length) return;
  let c = [0, 0, 0]; for (const t of tips) c = vadd(c, t.p); c = vscale(c, 1 / tips.length);
  let cr = 0; for (const t of tips) cr = Math.max(cr, vlen(vsub(t.p, c))); cr += o.r;
  c[1] -= cr * 0.25;
  const one = (p, r, sway) => {
    let P = o.palettes ? rng.pick(o.palettes) : [o.lo, o.mid, o.hi];
    if (o.hueJitter) { const dh = (rng() - 0.5) * o.hueJitter, dl = (rng() - 0.5) * 0.25; P = P.map((k) => shift(k, dh, 0, dl)); }
    blob(G, rng, p, [r, r * (o.squash ?? 0.8), r], {
      detail: o.detail, lump: o.lump ?? 0.3, lo: P[0], mid: P[1], hi: P[2], crown: c, crownR: cr, sway: sway + r * 0.03 * (o.flex ?? 1),
      flutter: 1, leaves: o.leaves, leafSize: o.leafSize, leafDroop: o.droop, coreScale: o.coreScale ?? 0.68, coreDark: 0.6, vary: o.vary, core: o.core,
    });
  };
  for (const t of tips) {
    const r = o.r * rng.range(0.75, 1.25) * (t.depth === 0 ? 1.15 : 1);
    one(vadd(vmad(t.p, t.dir, r * 0.25), [0, r * 0.15, 0]), r, t.sway);
    // a second, smaller clump back along the branch fills the crown
    if (o.extra && rng.chance(o.extra) && t.pts.length > 2) {
      const i = Math.max(1, t.pts.length - 2 - rng.int(0, 1)), q = t.pts[i];
      one([q[0] + rng.range(-0.4, 0.4) * r, q[1] + rng.range(0.1, 0.5) * r, q[2] + rng.range(-0.4, 0.4) * r], r * rng.range(0.6, 0.85), t.sw[i]);
    }
  }
}

function fitHeight(G, h) {
  let top = 0; for (let i = 1; i < G.p.length; i += 3) if (G.p[i] > top) top = G.p[i];
  const s = h / (top || 1); for (let i = 0; i < G.p.length; i++) G.p[i] *= s; for (let i = 0; i < G.w.length; i += 4) G.w[i] *= s;
  return s;
}

const SIDES = (detail, a, b, c) => (detail <= 0 ? a : detail === 1 ? b : c);

// shared implementation of oak / maple / cherry / birch style trees
function broadleaf(o, D, kind) {
  const rng = needRng(o, kind + 'Geometry'), detail = o.detail ?? 1, H = o.height ?? rng.range(D.height[0], D.height[1]);
  const P = pal(o, D.colors), G = new Geo();
  const S = D.shape(rng, H, detail, P);
  S.height = H; S.flex = o.flex ?? D.flex ?? 1;
  S.barkCol = S.barkCol || barkFn(P.bark, P.barkDark, P.barkLight);
  if (detail <= 0 && S.levels.length > 2) S.levels.length = 2;
  if (detail === 1 && o.foliage !== false && S.levels.length > 2) { S.levels[1].children = S.levels[1].children.map((x) => Math.max(1, x - 1)); S.levels[2].segs = 2; }
  const tips = skeleton(G, rng, S);
  const F = D.foliage(rng, H, detail, P);
  if (o.foliage !== false) crownFoliage(G, rng, tips, { detail: 0, leaves: detail <= 0 ? 8 : detail === 1 ? 14 : 28, leafSize: detail <= 0 ? 1.5 : 1.15, lo: P.leafDark, mid: P.leaf, hi: P.leafLight, flex: S.flex, ...F, r: F.r * (detail <= 0 ? 1.4 : 1) * (o.fullness ?? 1) });
  fitHeight(G, H);
  return G.build({ kind });
}

// oakGeometry({ rng, height: 10-15, detail: 0|1|2, fullness: 1, flex: 1, leaf, leafLight, leafDark, bark, barkDark })
// Broad spreading broadleaf. ~440 / 1150 / 2850 triangles for detail 0 / 1 / 2 (maple, cherry and birch are similar: 440-460 / 1000-1300 / 2200-3850).
export function oakGeometry(o = {}) {
  return broadleaf(o, {
    height: [10, 15], colors: { leaf: '#41742e', leafLight: '#93b24c', leafDark: '#234d28', bark: '#7a6450', barkDark: '#43352b', barkLight: '#96806a' },
    shape: (rng, H, d) => ({
      trunkLen: H * 0.42, trunkR: H * 0.05, flare: 0.8, lean: [rng.range(-0.08, 0.08), 1, rng.range(-0.08, 0.08)],
      levels: [
        { segs: 5, sides: SIDES(d, 5, 8, 10), wander: 0.22, up: 0.3, taper: 0.62, children: [4, 5], childAt: [0.5, 0.97], angle: [0.6, 1.15], lenK: [0.7, 1.0], radK: 0.6, tipLeaf: true },
        { segs: 4, sides: SIDES(d, 3, 5, 6), wander: 0.34, up: 0.55, taper: 0.4, children: [2, 3], childAt: [0.4, 0.95], angle: [0.5, 1.0], lenK: [0.5, 0.75], radK: 0.6, sway: 0.02, tipLeaf: true },
        { segs: 3, sides: SIDES(d, 3, 3, 4), wander: 0.34, up: 0.45, taper: 0.25, sway: 0.04 },
      ],
    }),
    foliage: (rng, H, d) => ({ r: H * 0.175, squash: 0.74, extra: d >= 2 ? 0.8 : 0.3, lump: 0.32 }),
  }, 'oak');
}

// mapleGeometry: autumn maple, rounder and more upright, foliage mixed red / orange / gold.
// extra colours: leaf '#c8421a', leafLight '#ffb23a', leafDark '#4a1208', gold '#e8a11c', crimson '#9c1c12'
export function mapleGeometry(o = {}) {
  const gold = C(o.gold ?? '#e8a11c'), crim = C(o.crimson ?? '#9c1c12');
  return broadleaf(o, {
    height: [9, 13], colors: { leaf: '#c8421a', leafLight: '#ffb23a', leafDark: '#4a1208', bark: '#4f4038', barkDark: '#241b18', barkLight: '#6b5a50' },
    shape: (rng, H, d) => ({
      trunkLen: H * 0.48, trunkR: H * 0.042, flare: 0.6,
      levels: [
        { segs: 5, sides: SIDES(d, 5, 7, 9), wander: 0.14, up: 0.3, taper: 0.6, children: SIDES(d, [4, 6], [4, 5], [4, 6]), childAt: [0.42, 0.97], angle: [0.5, 0.95], lenK: [0.6, 0.85], radK: 0.55, tipLeaf: true },
        { segs: 4, sides: SIDES(d, 3, 5, 6), wander: 0.28, up: 0.7, taper: 0.4, children: [2, 3], childAt: [0.4, 0.95], angle: [0.45, 0.9], lenK: [0.5, 0.7], radK: 0.6, sway: 0.02, tipLeaf: true },
        { segs: 3, sides: SIDES(d, 3, 3, 4), wander: 0.3, up: 0.5, taper: 0.25, sway: 0.04 },
      ],
    }),
    foliage: (rng, H, d, P) => ({
      r: H * 0.16, squash: 0.85, extra: d >= 2 ? 0.8 : 0.3, hueJitter: 0.035,
      palettes: [[P.leafDark, P.leaf, P.leafLight], [P.leafDark, P.leaf, P.leafLight], [mul3(crim, 0.4), crim, P.leaf], [mul3(gold, 0.4), gold, mix3(gold, [1, 0.9, 0.5], 0.5)]],
    }),
  }, 'maple');
}

// cherryGeometry: cherry blossom, dark sinuous limbs spreading wide under clouds of pale pink.
export function cherryGeometry(o = {}) {
  return broadleaf(o, {
    height: [7, 10], colors: { leaf: '#f4b6cc', leafLight: '#ffe8f0', leafDark: '#b87690', bark: '#3a2a2a', barkDark: '#1c1416', barkLight: '#5a4444' },
    shape: (rng, H, d) => ({
      trunkLen: H * 0.36, trunkR: H * 0.05, flare: 0.7, lean: [rng.range(-0.25, 0.25), 1, rng.range(-0.25, 0.25)],
      levels: [
        { segs: 5, sides: SIDES(d, 5, 7, 9), wander: 0.3, up: 0.25, taper: 0.65, children: [4, 5], childAt: [0.45, 0.97], angle: [0.8, 1.3], lenK: [0.9, 1.3], radK: 0.6, tipLeaf: true },
        { segs: SIDES(d, 5, 4, 5), sides: SIDES(d, 3, 4, 6), wander: 0.42, up: 0.35, taper: 0.4, children: SIDES(d, [3, 4], [3, 3], [3, 4]), childAt: [0.3, 0.95], angle: [0.5, 1.1], lenK: [0.4, 0.65], radK: 0.55, sway: 0.02, tipLeaf: true },
        { segs: 3, sides: SIDES(d, 3, 3, 4), wander: 0.4, up: 0.2, taper: 0.25, sway: 0.04 },
      ],
    }),
    foliage: (rng, H, d) => ({ r: H * 0.15, squash: 0.62, extra: d >= 2 ? 0.9 : 0.3, lump: 0.36, hueJitter: 0.02, vary: 0.12, droop: -0.5, coreScale: 0.52 }),
  }, 'cherry');
}

// birchGeometry: slender white trunk with dark marks, airy drooping foliage. autumn: true turns it gold.
export function birchGeometry(o = {}) {
  const autumn = !!o.autumn;
  return broadleaf(o, {
    height: [11, 16], flex: 1.5,
    colors: autumn ? { leaf: '#e0a81e', leafLight: '#ffe070', leafDark: '#7a4a0c', bark: '#d8d4c8', barkDark: '#2a2622', barkLight: '#8a7a68' }
      : { leaf: '#6fa832', leafLight: '#c8e060', leafDark: '#2a5220', bark: '#d8d4c8', barkDark: '#2a2622', barkLight: '#8a7a68' },
    shape: (rng, H, d, P) => ({
      trunkLen: H * 0.86, trunkR: H * 0.02, flare: 0.5, lean: [rng.range(-0.1, 0.1), 1, rng.range(-0.1, 0.1)], mottle: 0.06,
      barkCol: (t, k, s, depth) => (depth > 0 ? mix3(P.barkLight, P.barkDark, 0.4) : (rng() < 0.2 + 0.5 * sstep(0.12, 0, t) ? P.barkDark : P.bark)),
      levels: [
        { segs: SIDES(d, 6, 10, 12), sides: SIDES(d, 5, 6, 8), wander: 0.07, up: 0.2, taper: 0.3, children: SIDES(d, [5, 6], [8, 10], [11, 13]), childAt: [0.38, 0.97], angle: [0.55, 1.0], lenK: [0.2, 0.34], radK: 0.42, tipLeaf: true },
        { segs: 4, sides: 3, wander: 0.2, up: 0.1, taper: 0.25, sway: 0.05 },
      ],
    }),
    foliage: (rng, H, d) => ({ r: H * 0.085, squash: 1.25, extra: d >= 2 ? 0.7 : d === 1 ? 0.35 : 0, lump: 0.34, hueJitter: 0.03, droop: -0.7, leafSize: 1.25 }),
  }, 'birch');
}

// deadTreeGeometry({ rng, height: 8-13, detail, bark: '#8a8378', barkDark: '#3a352f' }): bare, gnarled, broken. ~190 / 850 / 950 triangles.
export function deadTreeGeometry(o = {}) {
  return broadleaf({ ...o, foliage: false }, {
    height: [8, 13], flex: 0.4, colors: { leaf: '#000000', leafLight: '#000000', leafDark: '#000000', bark: '#8a8378', barkDark: '#3a352f', barkLight: '#b0a898' },
    shape: (rng, H, d) => ({
      trunkLen: H * 0.55, trunkR: H * 0.045, flare: 0.9, lean: [rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3)], mottle: 0.2,
      levels: [
        { segs: 6, sides: SIDES(d, 5, 7, 8), wander: 0.34, up: 0.3, taper: 0.5, children: [3, 5], childAt: [0.35, 0.95], angle: [0.6, 1.2], lenK: [0.5, 0.8], radK: 0.55, capLen: 2.5 },
        { segs: 5, sides: SIDES(d, 3, 4, 5), wander: 0.5, up: 0.5, taper: 0.35, children: [2, 3], childAt: [0.3, 0.9], angle: [0.5, 1.2], lenK: [0.4, 0.7], radK: 0.55, capLen: 3 },
        { segs: 4, sides: 3, wander: 0.55, up: 0.4, taper: 0.3, children: [1, 2], childAt: [0.3, 0.8], angle: [0.5, 1.1], lenK: [0.4, 0.7], radK: 0.6, capLen: 4 },
        { segs: 3, sides: 3, wander: 0.5, up: 0.3, taper: 0.15, capLen: 5 },
      ],
    }),
    foliage: () => ({ r: 1 }),
  }, 'dead');
}

// baobabGeometry({ rng, height: 14-20, detail, leaf.., bark: '#8c6f5a' }): bottle trunk, stubby crown. ~630 / 1300 / 3200 triangles.
export function baobabGeometry(o = {}) {
  return broadleaf(o, {
    height: [14, 20], flex: 0.35, colors: { leaf: '#5d8a2e', leafLight: '#b4cc58', leafDark: '#22401c', bark: '#8c6f5a', barkDark: '#4a372c', barkLight: '#a88c74' },
    shape: (rng, H, d) => {
      const ph = rng() * TAU, lobes = rng.int(4, 6);
      return {
        trunkLen: H * 0.62, trunkR: H * 0.115, flare: 0.35, flareFall: 6, mottle: 0.1,
        flute: (a, t) => (1 + 0.09 * Math.sin(a * lobes + ph) * (1 - t)) * (0.86 + 0.24 * Math.sin(Math.PI * Math.min(1, t * 1.1))),
        levels: [
          { segs: 8, sides: SIDES(d, 7, 10, 16), wander: 0.05, up: 0.2, taper: 0.4, taperPow: 5, children: SIDES(d, [5, 7], [5, 6], [5, 7]), childAt: [0.86, 0.99], angle: [0.7, 1.35], lenK: [0.3, 0.45], radK: 0.3, tipLeaf: true },
          { segs: 4, sides: SIDES(d, 4, 5, 6), wander: 0.4, up: 0.5, taper: 0.4, children: [2, 3], childAt: [0.4, 0.95], angle: [0.5, 1.0], lenK: [0.45, 0.7], radK: 0.55, sway: 0.01, tipLeaf: true },
          { segs: 3, sides: 3, wander: 0.4, up: 0.4, taper: 0.25, sway: 0.02 },
        ],
      };
    },
    foliage: (rng, H) => ({ r: H * 0.075, squash: 0.55, extra: 0.2, lump: 0.3 }),
  }, 'baobab');
}

// pineGeometry({ rng, height: 14-22, detail, leaf.., bark: '#8a5236' }): tall bare trunk, flat windswept pads of needles. ~460 / 1250 / 2800 triangles.
export function pineGeometry(o = {}) {
  return broadleaf(o, {
    height: [14, 22], flex: 0.8, colors: { leaf: '#2f6338', leafLight: '#7aa24a', leafDark: '#0f2a1e', bark: '#8a5236', barkDark: '#3c241a', barkLight: '#a8704a' },
    shape: (rng, H, d) => ({
      trunkLen: H * 0.84, trunkR: H * 0.026, flare: 0.5, lean: [rng.range(-0.12, 0.12), 1, rng.range(-0.12, 0.12)],
      levels: [
        { segs: 7, sides: SIDES(d, 5, 7, 8), wander: 0.12, up: 0.25, taper: 0.4, children: SIDES(d, [4, 5], [5, 7], [8, 10]), childAt: [0.55, 0.98], angle: [1.0, 1.45], lenK: [0.22, 0.4], radK: 0.4, tipLeaf: true },
        { segs: 4, sides: SIDES(d, 3, 4, 5), wander: 0.3, up: 0.35, taper: 0.4, children: [1, 2], childAt: [0.5, 0.9], angle: [0.5, 0.9], lenK: [0.4, 0.6], radK: 0.6, sway: 0.02, tipLeaf: true },
        { segs: 2, sides: 3, wander: 0.3, up: 0.3, taper: 0.3, sway: 0.03 },
      ],
    }),
    foliage: (rng, H) => ({ r: H * 0.1, squash: 0.48, extra: 0.25, lump: 0.3, droop: 0.4 }),
  }, 'pine');
}

// hanging ribbon: every segment maps the whole atlas cell once, so a leaf pattern repeats down its length.
// us: parameter 0..1 of each point, o: { uv, col(u), sway[], nrm, flutter }
function ribbon(G, pts, widths, us, side, o) {
  const cell = o.uv;
  for (let i = 0; i < pts.length - 1; i++) {
    const id = [];
    for (let e = 0; e < 2; e++) {
      const j = i + e, w = widths[j] * 0.5, col = o.col(us[j]), fl = (o.flutter ?? 1) * us[j], tv = e ? cell[1] : cell[3];
      id.push(G.v(vmad(pts[j], side, -w), o.nrm, col, o.sway[j], fl, 1, 0, cell[0], tv), G.v(vmad(pts[j], side, w), o.nrm, col, o.sway[j], fl, 1, 0, cell[2], tv));
    }
    G.quad(id[0], id[1], id[3], id[2]);
  }
}

// willowGeometry({ rng, height: 9-13, detail, strands: per branch tip (3 / 9 / 13), leaf: '#7fa53a', leafLight: '#d2e070', leafDark: '#2f4f22', bark })
// Weeping willow: curtains of thin leafy strands that swing in the wind. ~290 / 1300 / 5600 triangles.
export function willowGeometry(o = {}) {
  const rng = needRng(o, 'willowGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(9, 13), G = new Geo();
  const P = pal(o, { leaf: '#7fa53a', leafLight: '#d2e070', leafDark: '#2f4f22', bark: '#6e5a44', barkDark: '#3a2e24', barkLight: '#8a745a' });
  const S = {
    height: H, flex: o.flex ?? 1, trunkLen: H * 0.42, trunkR: H * 0.05, flare: 0.9, lean: [rng.range(-0.15, 0.15), 1, rng.range(-0.15, 0.15)], barkCol: barkFn(P.bark, P.barkDark, P.barkLight),
    levels: [
      { segs: 5, sides: SIDES(d, 5, 7, 9), wander: 0.25, up: 0.2, taper: 0.6, children: [5, 6], childAt: [0.5, 0.98], angle: [0.5, 1.0], lenK: [0.75, 1.05], radK: 0.55, tipLeaf: true },
      { segs: SIDES(d, 4, 4, 5), sides: SIDES(d, 3, 4, 6), wander: 0.25, up: 0.5, taper: 0.35, children: SIDES(d, [1, 2], [2, 2], [3, 4]), childAt: [0.35, 0.9], angle: [0.5, 1.0], lenK: [0.5, 0.75], radK: 0.5, sway: 0.02, tipLeaf: true },
      { segs: SIDES(d, 2, 2, 3), sides: 3, wander: 0.3, up: -0.2, taper: 0.3, sway: 0.03 },
    ],
  };
  if (d <= 0) S.levels.length = 2;
  const tips = skeleton(G, rng, S);
  let c = [0, 0, 0]; for (const t of tips) c = vadd(c, t.p); c = vscale(c, 1 / tips.length); c[1] *= 0.8;
  const per = o.strands ?? SIDES(d, 3, 9, 13), us = d <= 0 ? [0, 1] : d === 1 ? [0, 0.16, 1] : [0, 0.07, 0.3, 0.62, 1], wK = d <= 0 ? 2.2 : 1;
  for (const t of tips) {
    for (let k = 0; k < per; k++) {
      const i = rng.int(Math.max(1, t.pts.length - 2), t.pts.length - 1), f = rng(), q = vlerp(t.pts[i - 1], t.pts[i], f), s0 = lerp(t.sw[i - 1], t.sw[i], f);
      const out = vnorm([q[0] - c[0] + rng.range(-1, 1), 0, q[2] - c[2] + rng.range(-1, 1)]);
      const len = Math.max(1.2, q[1] * rng.range(0.4, 1.0)), reach = len * rng.range(0.08, 0.2), lift = len * rng.range(0.0, 0.03), wob = [rng.range(-0.04, 0.04) * len, rng.range(-0.04, 0.04) * len];
      const pts = [], widths = [], sw = [], w0 = H * rng.range(0.022, 0.032) * wK;
      for (const u of us) {
        const e = 1 - (1 - u) * (1 - u), arch = Math.sin(Math.PI * Math.min(1, u / 0.3)) * lift;
        pts.push([q[0] + out[0] * reach * e + wob[0] * u * u, q[1] + arch - len * Math.pow(u, 1.15), q[2] + out[2] * reach * e + wob[1] * u * u]);
        widths.push(w0 * (u < 0.55 ? 1 : 1 - 0.92 * (u - 0.55) / 0.45)); sw.push(s0 + Math.pow(u, 1.5) * len * 0.085 * S.flex);
      }
      const dh = (rng() - 0.5) * 0.045, a = shift(P.leaf, dh, 0, rng.range(-0.18, 0.15)), b = shift(P.leafLight, dh, 0, rng.range(-0.1, 0.05)), dk = mix3(P.leafDark, a, 0.35);
      const col = (u) => (u < 0.3 ? mix3(dk, a, u / 0.3) : mix3(a, b, (u - 0.3) / 0.7)), nrm = vnorm([out[0], 0.5, out[2]]);
      const ang = rng() * Math.PI, side = [Math.cos(ang), 0, Math.sin(ang)];
      ribbon(G, pts, widths, us, side, { uv: CELL.willow, col, sway: sw, nrm, flutter: 1.2 });
      if (d >= 2 && k % 3 === 0) ribbon(G, pts, widths, us, [-side[2], 0, side[0]], { uv: CELL.willow, col, sway: sw, nrm, flutter: 1.2 });   // crossed pair: never edge-on
    }
  }
  // a soft cap of leaves over the crown hides the branch ends
  crownFoliage(G, rng, tips, { r: H * 0.13, squash: 0.55, detail: 0, core: d >= 2, coreScale: 0.25, leaves: d <= 0 ? 4 : d === 1 ? 6 : 12, lo: P.leafDark, mid: P.leaf, hi: P.leafLight, droop: -0.9, leafSize: 1.25, flex: S.flex });
  fitHeight(G, H);
  return G.build({ kind: 'willow' });
}

// ---------------------------------------------------------------------------------------------
// conifers
// ---------------------------------------------------------------------------------------------
// Whorls of drooping needle boughs (alpha-cut cards from the atlas) hung like shingles around the axis, over a dark inner cone.
// o: { y0, y1, r0, r1, tiers, boughs, segs, P, H, flex, droop, snow, snowCol, profile, gap, fold }
function coniferBoughs(G, rng, o) {
  const { y0, y1, r0, r1, tiers, P, H, flex } = o, sp = (y1 - y0) / tiers;
  // inner mass so the crown is never see-through
  const cn = 5, cp = [], cr = [], cs = [];
  for (let i = 0; i <= cn; i++) { const t = i / cn, y = lerp(y0 - sp * 0.3, y1, t); cp.push([0, y, 0]); cr.push(lerp(r0 * 0.26, r1 * 0.3, Math.pow(t, 0.8)) * (i === 0 ? 0.5 : 1)); cs.push(flex * 0.028 * H * Math.pow(sat(y / H), 2)); }
  tube(G, cp, cr, { sides: o.coreSides || 6, c0: mul3(P.leafDark, 0.9), c1: mix3(P.leafDark, P.leaf, 0.4), sway: cs, leaf: 1, flutter: 0.2, cap: false });
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1 || 1), y = lerp(y0, y1, Math.pow(t, 0.92)) + sp * 0.9;
    const R = lerp(r0, r1, Math.pow(t, o.profile ?? 0.85)), nb = Math.max(4, Math.round(lerp(o.boughs ?? 7, (o.boughs ?? 7) * 0.75, t)));
    let a = rng() * TAU;
    // one bough; `inner` boughs are shorter, steeper and darker and fill the whorl seen from below
    const bough = (inner) => {
      const el = -(o.droop ?? 0.85) * rng.range(0.82, 1.15) * (1 - 0.3 * t) * (inner ? 1.35 : 1), len = (R / Math.cos(el)) * rng.range(0.85, 1.15) * (inner ? 0.58 : 1);
      const dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
      const dh = (rng() - 0.5) * 0.03, dl = rng.range(-0.2, 0.15) - (inner ? 0.25 : 0), sn = o.snow || 0;
      let c0 = mul3(shift(P.leafDark, dh, 0, dl), 0.9), c1 = shift(P.leaf, dh, 0, dl), c2 = shift(P.leafLight, dh, 0, dl);
      if (sn > 0) { c0 = mix3(c0, o.snowCol, sn * 0.45); c1 = mix3(c1, o.snowCol, sn * 0.9); c2 = mix3(c2, o.snowCol, sn * 0.75); }
      const yy = y + rng.range(-0.25, 0.25) * sp - (inner ? sp * 0.35 : 0), p0 = [dir[0] * R * 0.03, yy, dir[2] * R * 0.03], sway = flex * 0.028 * H * Math.pow(sat(yy / H), 2);
      const n = inner ? 1 : (o.segs || 2), pts = [p0], widths = [], sw = [];
      for (let j = 1; j <= n; j++) { const dj = vnorm([dir[0], dir[1] + 0.6 * (j - 0.5) / n, dir[2]]); pts.push(vmad(pts[j - 1], dj, len / n)); }   // tips curve back up
      for (let j = 0; j <= n; j++) { widths.push(len * (o.width ?? 0.95)); sw.push(sway + Math.pow(j / n, 1.5) * len * 0.04 * flex); }
      strip(G, pts, widths, [0, 1, 0], { col: (u) => (u < 0.5 ? mix3(c0, c1, u / 0.5) : mix3(c1, c2, (u - 0.5) / 0.5)), sway: sw, flutter: 0.8, flutterTip: true, fold: inner ? 0 : (o.fold || 0), midrib: 0.9, curl: 0.5, uv: CELL.needle });
    };
    for (let k = 0; k < nb; k++) {
      a += TAU / nb + rng.range(-0.22, 0.22);
      if (o.gap && rng.chance(o.gap)) continue;
      bough(false);
    }
    if (o.inner) for (let k = 0, m = Math.max(3, Math.round(nb * o.inner)); k < m; k++) { a += TAU / m + rng.range(-0.3, 0.3); bough(true); }
  }
}

// coniferGeometry({ rng, height: 14-22, detail, slim: 1, droop: 0.85, snow: 0..1, snowColor, leaf: '#2f6640', leafLight: '#86ab60', leafDark: '#143424', bark, barkDark })
// Spruce / fir: whorls of drooping needle boughs over a dark core. ~170 / 460 / 1850 triangles.
export function coniferGeometry(o = {}) {
  const rng = needRng(o, 'coniferGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(14, 22), G = new Geo(), flex = o.flex ?? 1;
  const P = pal(o, { leaf: '#2f6640', leafLight: '#86ab60', leafDark: '#143424', bark: '#6a5240', barkDark: '#3a2a20', snowColor: '#dfe8f2' });
  const lean = [rng.range(-0.03, 0.03), rng.range(-0.03, 0.03)], n = 5, pts = [], rad = [], sw = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lean[0] * H * t * t, H * t, lean[1] * H * t * t]); rad.push(H * 0.02 * (1 - t * 0.93) * (1 + 0.7 * Math.exp(-t * 12))); sw.push(flex * 0.028 * H * t * t); }
  tube(G, pts, rad, { sides: SIDES(d, 4, 6, 7), col: (t, k) => (k % 2 ? P.barkDark : P.bark), rng, mottle: 0.15, sway: sw });
  const base = H * rng.range(0.08, 0.18), slim = o.slim ?? 1, r0 = H * rng.range(0.15, 0.19) / slim;
  coniferBoughs(G, rng, { y0: base, y1: H * 0.93, r0, r1: H * 0.045, tiers: SIDES(d, 8, 12, 16), boughs: SIDES(d, 6, 8, 10), segs: SIDES(d, 1, 2, 3), fold: d >= 2 ? -0.25 : 0, coreSides: SIDES(d, 4, 6, 7), width: d <= 0 ? 1.5 : 0.95,
    P, H, flex, droop: o.droop ?? 0.85, snow: o.snow || 0, snowCol: P.snowColor });
  return G.build({ kind: 'conifer' });
}

// redwoodGeometry({ rng, height: 60-85, detail, crown: true, girth: 0.04, leaf.., bark: '#7a4a38', barkDark: '#2e1a14', barkLight: '#a2705a' })
// Giant fluted trunk (radius ~4% of height) with a high crown of folded boughs. ~200 / 900 / 2000 triangles.
export function redwoodGeometry(o = {}) {
  const rng = needRng(o, 'redwoodGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(60, 85), G = new Geo(), flex = o.flex ?? 0.5;
  const P = pal(o, { leaf: '#2c5e3c', leafLight: '#78a258', leafDark: '#0c2218', bark: '#7a4a38', barkDark: '#2e1a14', barkLight: '#a2705a' });
  const sides = SIDES(d, 9, 16, 22), ridges = Math.round(sides / 2), ph = rng() * TAU, n = SIDES(d, 6, 9, 12), pts = [], rad = [], sw = [];
  const lean = [rng.range(-0.02, 0.02), rng.range(-0.02, 0.02)], R = H * (o.girth ?? 0.04);
  for (let i = 0; i <= n; i++) {
    const t = Math.pow(i / n, 1.6);
    pts.push([lean[0] * H * t, H * t, lean[1] * H * t]); rad.push(R * (1 - 0.9 * Math.pow(t, 0.8)) * (1 + 0.75 * Math.exp(-t * 26))); sw.push(flex * 0.02 * H * t * t);
  }
  tube(G, pts, rad, {
    sides, rng, mottle: 0.12, sway: sw,
    flute: (a, t) => 1 + (0.07 + 0.12 * Math.exp(-t * 20)) * Math.sin(a * ridges + ph + t * 3),
    col: (t, k) => { const ridge = Math.sin((k / sides) * TAU * ridges + ph + t * 3); return mix3(mix3(P.barkDark, P.bark, sat(ridge * 0.9 + 0.55)), P.barkLight, sat(ridge - 0.55) * 0.8); },
  });
  if (o.crown !== false) {
    coniferBoughs(G, rng, { y0: H * rng.range(0.4, 0.5), y1: H * 0.95, r0: H * 0.13, r1: H * 0.025, tiers: SIDES(d, 5, 9, 13), boughs: SIDES(d, 5, 7, 9), segs: SIDES(d, 1, 2, 3),
      coreSides: SIDES(d, 4, 6, 7), P, H, flex, droop: 0.7, gap: 0.12, profile: 0.7, fold: d >= 1 ? -0.25 : 0, inner: d >= 1 ? 0.6 : 0 });
    // a few broken stubs below the crown
    for (let k = 0, m = SIDES(d, 0, 4, 7); k < m; k++) {
      const t = rng.range(0.25, 0.45), a = rng() * TAU, i = Math.min(n - 1, Math.floor(Math.sqrt(Math.sqrt(t)) * n)), rr = rad[i] * 0.8;
      const p0 = [pts[i][0] + Math.cos(a) * rr, H * t, pts[i][2] + Math.sin(a) * rr];
      tube(G, arc(p0, [Math.cos(a), 0.15, Math.sin(a)], H * rng.range(0.03, 0.06), 2, [0, -1, 0], 0.4), [R * 0.09, R * 0.06, R * 0.02], { sides: 4, c0: P.barkDark, c1: P.bark, capLen: 3 });
    }
  }
  return G.build({ kind: 'redwood' });
}

// cypressGeometry({ rng, height: 10-16, detail, leaf: '#2c5a34', leafLight: '#6c9a4a', leafDark: '#0d2318', bark })
// Tall narrow flame of dense foliage. ~220 / 1000 / 1750 triangles.
export function cypressGeometry(o = {}) {
  const rng = needRng(o, 'cypressGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(10, 16), G = new Geo(), flex = o.flex ?? 0.9;
  const P = pal(o, { leaf: '#2c5a34', leafLight: '#6c9a4a', leafDark: '#0d2318', bark: '#5a4636', barkDark: '#2a2019' });
  tube(G, [[0, 0, 0], [0, H * 0.12, 0], [0, H * 0.3, 0]], [H * 0.022, H * 0.016, H * 0.01], { sides: 5, c0: P.barkDark, c1: P.bark, rng, mottle: 0.15 });
  const count = SIDES(d, 6, 9, 14), R = H * (o.girth ?? 0.085), y0 = H * 0.07;
  let az = rng() * TAU;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1), w = t < 0.22 ? lerp(0.72, 1, t / 0.22) : lerp(1, 0.16, Math.pow((t - 0.22) / 0.78, 1.5));
    const y = lerp(y0 + H * 0.1, H * 0.9, t), off = R * 0.3 * w * (t > 0.92 ? 0 : 1); az += 2.4;
    const ry = (H - y0) / count * 1.45, c = [Math.cos(az) * off, y, Math.sin(az) * off], sway = flex * 0.03 * H * Math.pow(y / H, 2);
    blob(G, rng, c, [R * w, ry, R * w], { detail: d <= 0 ? 0 : 1, lump: 0.2, lo: P.leafDark, mid: P.leaf, hi: P.leafLight, sway, flutter: 0.7, leaves: d <= 0 ? 6 : d === 1 ? 14 : 22, leafDroop: 1.2, leafSize: 1.1, coreScale: 0.82, coreDark: 0.7, flatBottom: 1, vary: 0.2 });
  }
  return G.build({ kind: 'cypress' });
}

// ---------------------------------------------------------------------------------------------
// palm, bamboo
// ---------------------------------------------------------------------------------------------
// one arching pinnate frond as a V-folded, saw-edged strip
function frond(G, rng, p0, dir, len, width, o) {
  const n = o.segs || 10, pts = arc(p0, dir, len, n, [0, -1, 0], o.droop ?? 1.5, rng, 0.03), widths = [], sw = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, prof = Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.94)), 0.55);
    widths.push(width); sw.push((o.sway0 || 0) + Math.pow(t, 1.6) * len * (o.flex ?? 0.07));
  }
  const side = vnorm(vcross(dir, [0, 1, 0])), up = vnorm(vcross(side, dir));
  strip(G, pts, widths, up, { col: (t) => mix3(mix3(o.c0, o.c1, sstep(0, 0.5, t)), o.c2, sstep(0.5, 1, t)), sway: sw, flutter: 1, flutterTip: true, fold: o.fold ?? -0.35, midrib: 0.9, curl: 0.6, glow: o.glow, uv: o.uv === undefined ? CELL.frond : o.uv });
  return pts;
}

// palmGeometry({ rng, height: 9-15, detail, fronds, curve: 0..1, coconuts: true, leaf: '#4f8a2c', leafLight: '#b9d45a', leafDark: '#1c3d1e', bark: '#8a7458', barkDark: '#4a3c2c' })
// Curved ringed trunk with a crown of arching fronds. ~200 / 570 / 900 triangles.
export function palmGeometry(o = {}) {
  const rng = needRng(o, 'palmGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(9, 15), G = new Geo(), flex = o.flex ?? 1;
  const P = pal(o, { leaf: '#4f8a2c', leafLight: '#b9d45a', leafDark: '#1c3d1e', bark: '#8a7458', barkDark: '#4a3c2c', dry: '#a08a3a', coconut: '#3a2a1a' });
  const n = SIDES(d, 6, 12, 16), az = rng() * TAU, bend = (o.curve ?? rng.range(0.15, 0.6)) * H * 0.35, pts = [], rad = [], sw = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, off = bend * (Math.pow(t, 1.4) * 1.0 - 0.25 * Math.sin(t * Math.PI));
    pts.push([Math.cos(az) * off, H * 0.8 * t, Math.sin(az) * off]);
    rad.push(H * 0.019 * (1 + 0.9 * Math.exp(-t * 9)) * (1 - 0.3 * t) * (i % 2 ? 1.07 : 0.95)); sw.push(flex * 0.045 * H * t * t);
  }
  tube(G, pts, rad, { sides: SIDES(d, 5, 7, 8), rng, mottle: 0.12, sway: sw, col: (t) => (Math.round(t * n) % 2 ? P.bark : mix3(P.barkDark, P.bark, 0.35)) });
  const top = pts[n], sTop = sw[n], nf = o.fronds ?? SIDES(d, 7, 12, 16), L = H * rng.range(0.34, 0.42);
  let a = rng() * TAU;
  for (let k = 0; k < nf; k++) {
    const t = k / (nf - 1), el = lerp(1.25, -0.25, Math.pow(t, 0.8)) + rng.range(-0.12, 0.12); a += 2.4 + rng.range(-0.3, 0.3);
    const dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], old = sstep(0.75, 1, t);
    frond(G, rng, vmad(top, dir, H * 0.01), dir, L * rng.range(0.85, 1.1) * (1 - 0.15 * old), H * 0.2, {
      segs: SIDES(d, 4, 6, 8), droop: lerp(0.9, 2.0, t), sway0: sTop, flex: 0.07 * flex,
      c0: mix3(P.leafDark, P.dry, old * 0.5), c1: mix3(P.leaf, P.dry, old * 0.8), c2: mix3(P.leafLight, P.dry, old),
    });
  }
  blob(G, rng, vadd(top, [0, -H * 0.005, 0]), H * 0.03, { detail: 0, lump: 0.1, lo: P.barkDark, mid: P.bark, hi: P.leafDark, leaf: 0, flutter: 0, sway: sTop });
  if (o.coconuts !== false && d > 0) for (let k = 0, m = rng.int(3, 5); k < m; k++) {
    const b = rng() * TAU; blob(G, rng, vadd(top, [Math.cos(b) * H * 0.028, -H * 0.03, Math.sin(b) * H * 0.028]), H * 0.016, { detail: 0, lump: 0.05, lo: mul3(P.coconut, 0.6), mid: P.coconut, hi: mul3(P.coconut, 1.6), leaf: 0, flutter: 0, sway: sTop });
  }
  return G.build({ kind: 'palm' });
}

// bambooGeometry({ rng, height: 9-14, detail, stalks, spread: 1, leaf: '#6f9a34', leafLight: '#c4dc68', stalk: '#7f9a3c', stalkDark: '#3f5a22', node: '#c8c48a' })
// A clump of jointed culms with leaf sprays at the upper nodes. ~290 / 1200 / 3100 triangles.
export function bambooGeometry(o = {}) {
  const rng = needRng(o, 'bambooGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(9, 14), G = new Geo(), flex = o.flex ?? 1.3;
  const P = pal(o, { leaf: '#6f9a34', leafLight: '#c4dc68', leafDark: '#2f5220', stalk: '#7f9a3c', stalkDark: '#3f5a22', node: '#c8c48a' });
  const count = o.stalks ?? SIDES(d, 4, 7, 12), spread = (o.spread ?? 1) * H * 0.07;
  for (let s = 0; s < count; s++) {
    const a = rng() * TAU, r0 = Math.sqrt(rng()) * spread, h = H * (s === 0 ? 1 : rng.range(0.6, 1)), nodes = SIDES(d, 5, 8, 10), rr = H * rng.range(0.007, 0.011);
    const lean = [Math.cos(a) * rng.range(0.02, 0.2), Math.sin(a) * rng.range(0.02, 0.2)], pts = [], rad = [], sw = [], cols = [];
    const tint = rng.range(0.8, 1.15);
    for (let i = 0; i <= nodes; i++) {
      const t = i / nodes, y = h * t, off = h * t * t;
      const p = [Math.cos(a) * r0 + lean[0] * off, y - 0.25 * (lean[0] * lean[0] + lean[1] * lean[1]) * off, Math.sin(a) * r0 + lean[1] * off], s0 = flex * 0.05 * h * Math.pow(t, 2.2), r = rr * (1 - 0.6 * t);
      if (i > 0) { pts.push(p); rad.push(r * 1.25); sw.push(s0); cols.push(P.node); }
      if (i < nodes) { pts.push([p[0], p[1] + h * 0.012, p[2]]); rad.push(r); sw.push(s0); cols.push(mul3(mix3(P.stalkDark, P.stalk, 0.3 + 0.7 * t), tint)); }
      // leaf sprays on the upper half
      if (t > 0.4 && i < nodes && d >= 0) {
        const m = d <= 0 ? 2 : rng.int(2, 4);
        for (let k = 0; k < m; k++) {
          const dir = coneDir(rng, [0, 0.35, 0], Math.PI * 0.5), len = H * rng.range(0.1, 0.16), c = shift(P.leaf, (rng() - 0.5) * 0.04, 0, rng.range(-0.2, 0.15));
          frond(G, rng, p, dir, len, len * 0.8, { segs: 2, droop: 1.2, sway0: s0, flex: 0.1 * flex, c0: P.leafDark, c1: c, c2: P.leafLight, fold: 0 });
        }
      }
    }
    tube(G, pts, rad, { sides: SIDES(d, 3, 4, 5), sway: sw, col: (t) => cols[Math.min(cols.length - 1, Math.round(t * (pts.length - 1)))], capLen: 6 });
  }
  return G.build({ kind: 'bamboo' });
}

// ---------------------------------------------------------------------------------------------
// scattering and instancing
// ---------------------------------------------------------------------------------------------
// hides instanced chunks farther than `dist` from the camera (called from update when a camera is passed).
// Chunk centres are resolved to world space once, on the first call, so the group may be moved, rotated, scaled or nested.
function cullChunks(meshes, camera, dist) {
  if (!camera || !(dist < Infinity)) return;
  const c = camera.position;
  for (const m of meshes) {
    const b = m.boundingSphere; if (!b) continue;
    let w = m.userData.floraCentre;
    if (!w) { m.updateWorldMatrix(true, false); w = m.userData.floraCentre = b.center.clone().applyMatrix4(m.matrixWorld); m.userData.floraRadius = b.radius * m.matrixWorld.getMaxScaleOnAxis(); }
    m.visible = Math.hypot(w.x - c.x, w.y - c.y, w.z - c.z) - m.userData.floraRadius < dist;
  }
}

// path sampled as [x, z, normalX, normalZ] * (N + 1) for placing things at (u, lateral offset)
function pathTable(path, N) {
  const tab = new Float32Array((N + 1) * 4), p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { path.pointAt(i / N, p); path.tangentAt(i / N, t); const l = Math.hypot(t.x, t.z) || 1; tab[i * 4] = p.x; tab[i * 4 + 1] = p.z; tab[i * 4 + 2] = -t.z / l; tab[i * 4 + 3] = t.x / l; }
  return tab;
}

// scatterPoints({ rng, count, path, radius, corridor, uRange: [u0,u1], bounds, heightAt, density(x,z,dist,u), yRange, spacing, falloff, clear, scale:[a,b] })
// -> [{ x, y, z, s, rot, d (distance to path), u }]   Placement only; used by every make*() factory below.
// With a path (and no bounds) candidates are drawn in path space (u, lateral offset), so nothing is wasted outside the corridor band.
export function scatterPoints(o = {}) {
  const rng = needRng(o, 'scatterPoints'), path = o.path, count = o.count ?? 300, radius = o.radius ?? 160, corridor = o.corridor ?? 9;
  const heightAt = o.heightAt || (() => 0), density = o.density, sc = o.scale || [0.8, 1.25], spacing = o.spacing ?? 0, clear = o.clear ?? 0, falloff = o.falloff ?? 0.5;
  const out = [], grid = spacing > 0 ? new Map() : null, tries = o.attempts ?? count * 14, cs = spacing * 1.01;
  const free = (x, z, s) => {
    const cx = Math.floor(x / cs), cz = Math.floor(z / cs);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = grid.get((cx + i) * 73856093 ^ (cz + j) * 19349663); if (l) for (const q of l) { const dx = q.x - x, dz = q.z - z, m = spacing * 0.5 * (q.s + s); if (dx * dx + dz * dz < m * m) return false; } }
    return true;
  };
  const take = (x, z, s) => { const key = Math.floor(x / cs) * 73856093 ^ Math.floor(z / cs) * 19349663; let l = grid.get(key); if (!l) grid.set(key, l = []); l.push({ x, z, s }); };
  if (path && !o.bounds) {
    const ur = o.uRange || [0, 1], N = 240, tab = pathTable(path, N);
    for (let k = 0; k < tries && out.length < count; k++) {
      const u = lerp(ur[0], ur[1], rng()), lat = (rng() * 2 - 1) * radius, d0 = Math.abs(lat), s = lerp(sc[0], sc[1], rng());
      if (d0 < corridor + clear * s) continue;
      if (falloff > 0 && rng() < sstep(radius * (1 - falloff), radius, d0)) continue;
      const f = u * N, i = Math.min(N - 1, Math.floor(f)), g = f - i, j = i * 4;
      const x = lerp(tab[j], tab[j + 4], g) + lerp(tab[j + 2], tab[j + 6], g) * lat, z = lerp(tab[j + 1], tab[j + 5], g) + lerp(tab[j + 3], tab[j + 7], g) * lat;
      if (density) { const p = density(x, z, d0, u); if (!(p > 0) || rng() > p) continue; }
      const y = heightAt(x, z);
      if (o.yRange && (y < o.yRange[0] || y > o.yRange[1])) continue;
      if (grid && !free(x, z, s)) continue;
      const nn = path.nearestXZ(x, z);                 // on bends the true distance can be shorter than the lateral offset
      if (nn.dist < corridor + clear * s) continue;
      if (grid) take(x, z, s);
      out.push({ x, y, z, s, rot: rng() * TAU, d: nn.dist, u });
    }
    return out;
  }
  const b = o.bounds || [-radius, -radius, radius, radius];
  for (let k = 0; k < tries && out.length < count; k++) {
    const x = lerp(b[0], b[2], rng()), z = lerp(b[1], b[3], rng());
    let d = Infinity, u = 0;
    if (path) {
      const n = path.nearestXZ(x, z); d = n.dist; u = n.u;
      if (d > radius || (o.uRange && (u < o.uRange[0] || u > o.uRange[1]))) continue;
      if (falloff > 0 && rng() < sstep(radius * (1 - falloff), radius, d)) continue;
    } else if (o.round !== false && !o.bounds && x * x + z * z > radius * radius) continue;
    const s = lerp(sc[0], sc[1], rng());
    if (d < corridor + clear * s) continue;
    if (density) { const p = density(x, z, d, u); if (!(p > 0) || rng() > p) continue; }
    const y = heightAt(x, z);
    if (o.yRange && (y < o.yRange[0] || y > o.yRange[1])) continue;
    if (grid) { if (!free(x, z, s)) continue; take(x, z, s); }
    out.push({ x, y, z, s, rot: rng() * TAU, d, u });
  }
  return out;
}

// ---- soft ground discs: contact shadows (multiply) and light pools (additive) -------------------------------------------------
const DISC_VS = /* glsl */`
attribute vec3 color; attribute float amount; uniform float uBias; varying vec2 vUv; varying vec3 vCol; varying float vAmt;
#include <fog_pars_vertex>
void main() { vUv = uv; vCol = color; vAmt = amount; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  mvPosition.xyz *= 1.0 - uBias;      // pulled toward the eye along the view ray: same place on screen, but in front of small terrain mismatches
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DISC_FS = /* glsl */`
uniform float uAmount; varying vec2 vUv; varying vec3 vCol; varying float vAmt;
#include <fog_pars_fragment>
void main() {
  float a = max(0.0, 1.0 - dot(vUv, vUv)), fogK = 0.0; a = a * a * (GLOW ? a : 1.0) * uAmount * vAmt;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogK = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogK = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  a *= 1.0 - fogK;
  gl_FragColor = GLOW ? vec4(vCol * a, 1.0) : vec4(mix(vec3(1.0), vCol, min(a, 1.0)), 1.0);
}`;
// discs: [{ x, z, rx (semi-axis across), rz (semi-axis along dir), dx, dz (unit direction of rz), color [r,g,b] }]
// Each disc is a small grid draped over heightAt (cells of about `cell` metres), so it follows the terrain instead of cutting through it.
function groundDiscs(discs, o, glow) {
  const heightAt = o.heightAt || (() => 0), lift = o.lift ?? 0.12, cell = o.cell ?? 4, ns = discs.map((d) => clamp(Math.ceil(2 * Math.max(d.rx, d.rz) / cell), 2, 6));
  let vn = 0; for (const n of ns) vn += (n + 1) * (n + 1);
  const pos = new Float32Array(vn * 3), uv = new Float32Array(vn * 2), col = new Float32Array(vn * 3), amt = new Float32Array(vn).fill(1), idx = [], hs = new Float32Array(49);
  // a shadow only takes away direct light: ground that faces away from the sun (sun = unit vector toward it) has none to lose
  const sun = o.sun || null, lit = (gx, gz) => sstep(0, Math.max(0.05, 0.6 * sun[1]), (sun[1] - gx * sun[0] - gz * sun[2]) / Math.hypot(gx, 1, gz));
  let v = 0;
  discs.forEach((d, di) => {
    const b = v, n = ns[di], m = n + 1;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const a = (i / n) * 2 - 1, c = (j / n) * 2 - 1, k = (b + i * m + j) * 3;
      pos[k] = d.x + d.dz * a * d.rx + d.dx * c * d.rz; pos[k + 2] = d.z - d.dx * a * d.rx + d.dz * c * d.rz; pos[k + 1] = heightAt(pos[k], pos[k + 2]);
    }
    // where the ground bulges between grid vertices the coarse grid would cut through it: measure that sag at the middle of every
    // edge and diagonal, and raise the vertices at both ends by it (so the sheet stays as close to the ground as it can)
    hs.fill(0);
    const sagAt = (p0, p1) => {
      const k0 = (b + p0) * 3, k1 = (b + p1) * 3, sg = heightAt((pos[k0] + pos[k1]) * 0.5, (pos[k0 + 2] + pos[k1 + 2]) * 0.5) - (pos[k0 + 1] + pos[k1 + 1]) * 0.5;
      if (sg > hs[p0]) hs[p0] = sg; if (sg > hs[p1]) hs[p1] = sg;
    };
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { const q = i * m + j; if (i < n) sagAt(q, q + m); if (j < n) sagAt(q, q + 1); if (i < n && j < n) sagAt(q, q + m + 1); }
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++, v++) {
      const a = (i / n) * 2 - 1, c = (j / n) * 2 - 1;
      if (sun) {   // ground slope from the grid itself
        const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(n, j + 1);
        const gi = (pos[(b + i1 * m + j) * 3 + 1] - pos[(b + i0 * m + j) * 3 + 1]) / ((i1 - i0) * 2 * d.rx / n), gj = (pos[(b + i * m + j1) * 3 + 1] - pos[(b + i * m + j0) * 3 + 1]) / ((j1 - j0) * 2 * d.rz / n);
        amt[v] = lit(gi * d.dz + gj * d.dx, -gi * d.dx + gj * d.dz);
      }
      hs[v - b] = lift + 1.3 * hs[v - b]; uv[v * 2] = a; uv[v * 2 + 1] = c; col[v * 3] = d.color[0]; col[v * 3 + 1] = d.color[1]; col[v * 3 + 2] = d.color[2];
    }
    for (let k = 0; k < m * m; k++) pos[(b + k) * 3 + 1] += hs[k];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const p = b + i * (n + 1) + j; idx.push(p, p + 1, p + n + 2, p, p + n + 2, p + n + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('amount', new THREE.BufferAttribute(amt, 1));
  g.setIndex(v > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uAmount: { value: glow ? (o.intensity ?? 0.2) : (o.strength ?? 0.5) }, uBias: { value: o.bias ?? 0.004 } }]);
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: DISC_VS, fragmentShader: DISC_FS, defines: { GLOW: glow ? 'true' : 'false' }, fog: true, transparent: glow, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: glow ? THREE.OneFactor : THREE.ZeroFactor, blendDst: glow ? THREE.OneFactor : THREE.SrcColorFactor,
  });
  // Shadows are drawn in the opaque pass, after everything at the default renderOrder 0 (the terrain, trees) and before ground cover
  // that was given `shade` (renderOrder 1): that cover is darkened per instance instead, never a second time by the sheet.
  const object = new THREE.Mesh(g, material); object.renderOrder = glow ? 2 : 0.5;
  // the same blobs evaluated on the CPU, so ground cover can darken its instances to match (see the `shade` option of makeGrass / makeScatter)
  const CS = 16, key = (i, j) => i * 73856093 ^ j * 19349663; let grid = null;
  const shadeAt = (x, z, out = [1, 1, 1]) => {
    if (glow) return out;
    if (!grid) {
      grid = new Map();
      for (const d of discs) { const r = Math.max(d.rx, d.rz); for (let i = Math.floor((d.x - r) / CS); i <= Math.floor((d.x + r) / CS); i++) for (let j = Math.floor((d.z - r) / CS); j <= Math.floor((d.z + r) / CS); j++) { const k = key(i, j); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(d); } }
    }
    const l = grid.get(key(Math.floor(x / CS), Math.floor(z / CS))), am = uniforms.uAmount.value; let sl = -1;
    if (l) for (const d of l) {
      const px = x - d.x, pz = z - d.z, a = (px * d.dz - pz * d.dx) / d.rx, c = (px * d.dx + pz * d.dz) / d.rz, k = 1 - a * a - c * c;
      if (k > 0) {
        if (sl < 0) sl = sun ? lit((heightAt(x + 1, z) - heightAt(x - 1, z)) * 0.5, (heightAt(x, z + 1) - heightAt(x, z - 1)) * 0.5) : 1;
        const w = Math.min(1, k * k * am) * sl; out[0] *= 1 + (d.color[0] - 1) * w; out[1] *= 1 + (d.color[1] - 1) * w; out[2] *= 1 + (d.color[2] - 1) * w; }
    }
    return out;
  };
  return { object, material, uniforms, count: discs.length, triangles: idx.length / 3, shadeAt, update() {} };
}
// `shade` option of the scatter factories -> (x, z) => [r, g, b] multiplier (a reused array), or null
function shadeFn(sh) {
  if (!sh) return null;
  const out = [1, 1, 1];
  if (typeof sh === 'function') return (x, z) => { const v = sh(x, z); if (typeof v !== 'number') return v; out[0] = out[1] = out[2] = v; return out; };
  const list = (Array.isArray(sh) ? sh : [sh]).filter((q) => q && q.shadeAt);
  return (x, z) => { out[0] = out[1] = out[2] = 1; for (const q of list) q.shadeAt(x, z, out); return out; };
}
// casters: array of { x, z, r, color? } or of Object3D carrying flora geometry (position, scale and geometry.userData.radius / glowColor are read)
const casterList = (list) => list.map((c) => (c.isObject3D ? { x: c.position.x, z: c.position.z, r: (c.geometry?.userData?.radius || 1) * c.scale.x, color: c.geometry?.userData?.glowColor } : c));

// makeGroundShadows({ points | objects, heightAt, sunDir: [x,y,z] | Vector3 (toward the sun), strength: 0.5, color: '#1c2540', size: 1.1 (x plant radius),
//   stretch: 1 (how far a low sun drags the shadow), lift: 0.12 (metres above heightAt), bias: 0.004 (fraction of the view distance the blobs are pulled toward the eye), cell: 4 (grid cell, metres; at most 6 x 6 cells per blob) })
// One draw call of soft multiply-blended blobs under plants: grounds trees without a shadow map. 8-72 triangles per caster (by size).
// Shadows fade out on ground that faces away from the sun (it has no direct light to lose).
// The blobs are draped over heightAt (about 4 samples per grid cell; raised only where the ground bulges between vertices), which should describe the surface that is actually drawn;
// raise lift (or bias, which grows with distance) if your terrain mesh is much coarser than heightAt.
// -> { object: Mesh, material, uniforms: { uAmount, uBias }, count, triangles, shadeAt(x, z, out = [1,1,1]) }
// shadeAt multiplies `out` by the shadow colour at a point: pass the result (or several) as `shade` to makeGrass / makeFlowers / ... and their instances darken to match.
// Draw order: the sheet has renderOrder 0.5 in the opaque pass, so the ground it darkens must keep a renderOrder of 0 or less (the default).
export function makeGroundShadows(o = {}) {
  const sd = o.sunDir ? (o.sunDir.isVector3 ? [o.sunDir.x, o.sunDir.y, o.sunDir.z] : o.sunDir) : [0.4, 0.8, 0.3], sl = Math.hypot(sd[0], sd[1], sd[2]) || 1, hl = Math.hypot(sd[0], sd[2]);
  const dx = hl > 1e-4 ? -sd[0] / hl : 0, dz = hl > 1e-4 ? -sd[2] / hl : 1, cot = Math.min(2.2, hl / Math.max(0.05, sd[1])) * (o.stretch ?? 1), color = C(o.color ?? '#1c2540'), size = o.size ?? 1.1;
  const discs = casterList(o.objects || o.points || []).map((c) => { const rx = c.r * size, rz = rx * (1 + 0.55 * cot), off = (rz - rx) * 0.8; return { x: c.x + dx * off, z: c.z + dz * off, rx, rz, dx, dz, color }; });
  return groundDiscs(discs, { ...o, sun: [sd[0] / sl, sd[1] / sl, sd[2] / sl] }, false);
}
// makeGroundGlow({ points | objects, heightAt, color (default: each plant's own glow colour), radius: 2 (x plant radius), intensity: 0.2, lift: 0.12, bias: 0.004, cell: 4 })
// One draw call of additive light pools under glowing plants, so they appear to light the ground. -> same shape as makeGroundShadows.
export function makeGroundGlow(o = {}) {
  const fixed = o.color !== undefined ? C(o.color) : null, k = o.radius ?? 2;
  const discs = casterList(o.objects || o.points || []).filter((c) => fixed || c.color).map((c) => ({ x: c.x, z: c.z, rx: c.r * k, rz: c.r * k, dx: 0, dz: 1, color: fixed || c.color }));
  return groundDiscs(discs, o, true);
}

// shares all vertex data of `geo` and adds one per-instance attribute (used for petal colours)
function withInstanced(geo, name, array, itemSize) {
  const g = new THREE.BufferGeometry(); g.index = geo.index;
  for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  g.setAttribute(name, new THREE.InstancedBufferAttribute(array, itemSize));
  g.boundingSphere = geo.boundingSphere; g.boundingBox = geo.boundingBox; g.userData = geo.userData;
  return g;
}

// makeScatter(options): instanced plants. Generic engine behind makeForest / makeBushes / makeFlowers / ...
//   rng (required)        variants: [BufferGeometry, ...]                 points: precomputed scatterPoints() result (optional; a point's `v` picks its variant)
//   + every scatterPoints option (count, path, radius, corridor, heightAt, density, bounds, yRange, spacing, falloff, scale)
//   farVariants: [geometry] low-detail versions used beyond farDistance (metres from the path)
//   tint: 0.18 brightness variation, hue: 0.06 warm/cool variation, colors: ['#..', ...] optional per-instance colour multipliers
//   groundColor(x, z, y) -> colour multiplied into each instance (for variants authored white), petalColors: ['#..'] per-instance colour of petal-masked vertices
//   sink: 0.03 (fraction of plant height pushed into the ground), tilt: 0.05 rad
//   chunks: 1 (split along the path), cullDistance: Infinity (update(dt, time, camera) hides chunks farther than this from the camera)
//   shade: fn(x, z) -> number | [r,g,b], or [things with shadeAt] (makeGroundShadows / makeScatter results): darkens the instances standing in those shadows
//   groundShadow: { sunDir, strength, color, size, lift, ... } adds makeGroundShadows under every instance (+1 draw call)
//   groundGlow: { color, radius, intensity, lift, ... } adds makeGroundGlow under the glowing variants (+1 draw call)
//   material | materialOptions (for windMaterial) | wind (shared makeWind()) | map (shared atlas), castShadow, receiveShadow
// -> { object: Group, meshes, material, wind, uniforms, count, triangles, points, shadow, glow, shadeAt(x, z, out), update(dt, time, camera) }
export function makeScatter(o = {}) {
  const rng = needRng(o, 'makeScatter');
  const variants = o.variants, far = o.farVariants, farD = o.farDistance ?? 120;
  if (!variants || !variants.length) throw new Error('flora.makeScatter: options.variants is required');
  let clear = o.clear; if (clear === undefined) { clear = 0; for (const g of variants) clear = Math.max(clear, (g.userData.radius || 1) * (o.clearK ?? 0.75)); }
  const pts = o.points || scatterPoints({ ...o, rng: rng.fork('pts'), clear });
  const wind = o.wind || o.material?.userData?.wind || makeWind();
  const material = o.material || windMaterial({ ...(o.map !== undefined ? { map: o.map } : {}), ...(o.materialOptions || {}), wind });
  const chunks = Math.max(1, o.chunks ?? 1), tint = o.tint ?? 0.18, hue = o.hue ?? 0.06, sink = o.sink ?? 0.03, tilt = o.tilt ?? 0.05;
  const cols = o.colors ? o.colors.map(C) : null, petals = o.petalColors ? o.petalColors.map(C) : null, gcol = o.groundColor, shade = shadeFn(o.shade);
  const buckets = new Map();
  for (const p of pts) {
    const set = far && p.d > farD ? far : variants, vi = p.v !== undefined ? p.v % set.length : Math.floor(rng() * set.length), ch = Math.min(chunks - 1, Math.floor(p.u * chunks));
    const key = (set === far ? 'f' : 'n') + vi + ':' + ch; let bk = buckets.get(key); if (!bk) buckets.set(key, bk = { g: set[vi], list: [] }); bk.list.push(p);
  }
  const object = new THREE.Group(), meshes = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color();
  const casters = [], lights = [];
  let triangles = 0;
  for (const bk of buckets.values()) {
    const n = bk.list.length, pa = petals ? new Float32Array(n * 3) : null, ud = bk.g.userData;
    const mesh = new THREE.InstancedMesh(pa ? withInstanced(bk.g, 'petal', pa, 3) : bk.g, material, n);
    bk.list.forEach((p, i) => {
      e.set((rng() - 0.5) * 2 * tilt, p.rot, (rng() - 0.5) * 2 * tilt); q.setFromEuler(e);
      const sy = p.s * (1 + (rng() - 0.5) * (o.stretch ?? 0.2));
      v.set(p.x, p.y - sink * (ud.height || 1) * sy + (o.lift ?? 0), p.z); s3.set(p.s, sy, p.s);
      mesh.setMatrixAt(i, m.compose(v, q, s3));
      const br = 1 + (rng() - 0.5) * 2 * tint, h = (rng() - 0.5) * 2 * hue;
      if (cols) { const c = cols[Math.floor(rng() * cols.length)]; col.setRGB(c[0] * br, c[1] * br, c[2] * br); } else col.setRGB(br * (1 + h), br, br * (1 - h * 1.5));
      if (gcol) { const c = C(gcol(p.x, p.z, p.y)); col.r *= c[0]; col.g *= c[1]; col.b *= c[2]; }
      const sh = shade ? shade(p.x, p.z) : null;
      if (sh) { col.r *= sh[0]; col.g *= sh[1]; col.b *= sh[2]; }
      mesh.setColorAt(i, col);
      if (pa) { const c = petals[Math.floor(rng() * petals.length)]; pa[i * 3] = c[0] * (sh ? sh[0] : 1); pa[i * 3 + 1] = c[1] * (sh ? sh[1] : 1); pa[i * 3 + 2] = c[2] * (sh ? sh[2] : 1); }
      if (o.groundShadow) casters.push({ x: p.x, z: p.z, r: (ud.radius || 1) * p.s });
      if (o.groundGlow && ud.glowColor) lights.push({ x: p.x, z: p.z, r: (ud.radius || 1) * p.s, color: [ud.glowColor[0] * col.r, ud.glowColor[1] * col.g, ud.glowColor[2] * col.b] });
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 3;
    if (shade) mesh.renderOrder = 1;      // after the shadow sheets, which would otherwise darken these instances a second time
    setShadows(mesh, o);
    triangles += ud.triangles * n; object.add(mesh); meshes.push(mesh);
  }
  const shadow = o.groundShadow ? makeGroundShadows({ heightAt: o.heightAt, ...o.groundShadow, points: casters }) : null;
  const glow = o.groundGlow ? makeGroundGlow({ heightAt: o.heightAt, ...o.groundGlow, points: lights }) : null;
  if (shadow) object.add(shadow.object); if (glow) object.add(glow.object);
  const cull = o.cullDistance ?? (material.userData.uniforms?.uFloraFade.value.y || Infinity);
  return { object, meshes, material, wind, uniforms: material.userData.uniforms || wind.uniforms, count: pts.length, triangles, points: pts, shadow, glow, shadeAt: shadow ? shadow.shadeAt : (x, z, out = [1, 1, 1]) => out, update(dt, time, camera) { wind.update(time); cullChunks(meshes, camera, cull); } };
}

// makeForest(options): instanced forest. All makeScatter options, plus:
//   variants: defaults to a mixed temperate set (2 conifers, oak, birch) built from options.rng at `detail` (1);
//             with a path, two detail-0 trees (conifer, oak) are used beyond farDistance (55 m from the path)
//   count: 300, radius: 170, corridor: 9, spacing: 3.2, scale: [0.7, 1.35]
// With defaults: 4-6 draw calls per chunk, about count * 800 triangles near / count * 300 far (use chunks + cullDistance to cut what is on screen).
export function makeForest(o = {}) {
  const rng = needRng(o, 'makeForest');
  let variants = o.variants, farVariants = o.farVariants;
  if (!variants) {
    const r = rng.fork('variants'), detail = o.detail ?? 1;
    variants = [coniferGeometry({ rng: r, detail }), coniferGeometry({ rng: r, detail, slim: 1.25 }), oakGeometry({ rng: r, detail }), birchGeometry({ rng: r, detail })];
    if (!farVariants && o.path && detail > 0) farVariants = [coniferGeometry({ rng: r, detail: 0 }), oakGeometry({ rng: r, detail: 0 })];   // cheaper stand-ins away from the camera path
  }
  return makeScatter({ count: 300, radius: 170, corridor: 9, spacing: 3.2, scale: [0.7, 1.35], sink: 0.02, tilt: 0.04, farDistance: 55, ...o, rng, variants, farVariants });
}

// ---------------------------------------------------------------------------------------------
// alien flora (glow is written to wind.w; emissive = vertex colour * glow * material glow)
// ---------------------------------------------------------------------------------------------
// faceted crystal: hexagonal prism from p0 to p1 with a pointed tip
function prism(G, p0, p1, r0, r1, sides, o) {
  const ax = vnorm(vsub(p1, p0)), nx = perp(ax), ny = vcross(ax, nx), tip = vmad(p1, ax, r1 * (o.tip ?? 2.2));
  const ring = (c, r, k) => { const a = (k / sides) * TAU; return [c[0] + (nx[0] * Math.cos(a) + ny[0] * Math.sin(a)) * r, c[1] + (nx[1] * Math.cos(a) + ny[1] * Math.sin(a)) * r, c[2] + (nx[2] * Math.cos(a) + ny[2] * Math.sin(a)) * r]; };
  for (let k = 0; k < sides; k++) {
    const a = ((k + 0.5) / sides) * TAU, fn = [nx[0] * Math.cos(a) + ny[0] * Math.sin(a), nx[1] * Math.cos(a) + ny[1] * Math.sin(a), nx[2] * Math.cos(a) + ny[2] * Math.sin(a)];
    const sh = 0.75 + 0.5 * ((k * 0.618) % 1), cA = mul3(o.c0, sh), cB = mul3(o.c1, sh), g0 = o.g0 ?? 0, g1 = o.g1 ?? 0, sw = o.sway || 0, lf = o.leaf ?? 0.5;
    const a0 = G.v(ring(p0, r0, k), fn, cA, sw, 0, lf, g0), a1 = G.v(ring(p0, r0, k + 1), fn, cA, sw, 0, lf, g0);
    const b1 = G.v(ring(p1, r1, k + 1), fn, cB, sw, 0, lf, g1), b0 = G.v(ring(p1, r1, k), fn, cB, sw, 0, lf, g1);
    G.quad(a0, a1, b1, b0);
    const tn = vnorm(vadd(fn, vscale(ax, 0.5))), c0 = G.v(ring(p1, r1, k), tn, cB, sw, 0, lf, g1), c1 = G.v(ring(p1, r1, k + 1), tn, cB, sw, 0, lf, g1);
    G.tri(c0, c1, G.v(tip, tn, mul3(o.c1, 1.3), sw, 0, lf, g1 * 1.4));
  }
}

function mushroomOne(G, rng, base, H, P, o, d) {
  const lean = [rng.range(-0.15, 0.15), rng.range(-0.15, 0.15)], n = SIDES(d, 4, 6, 8), pts = [], rad = [], sw = [], gl = [], flex = o.flex ?? 0.5, sr = H * (o.stem ?? 0.045);
  const R = H * (o.cap ?? rng.range(0.34, 0.5)), hc = R * (o.dome ?? rng.range(0.45, 0.8));
  for (let i = 0; i <= n; i++) {
    const t = i / n; pts.push([base[0] + lean[0] * H * t * t, base[1] + H * 0.9 * t + (i === n ? hc * 0.1 : 0), base[2] + lean[1] * H * t * t]);
    rad.push(sr * (1 + 1.3 * Math.exp(-t * 7) + 0.5 * Math.pow(t, 6))); sw.push(flex * 0.02 * H * t * t); gl.push((o.stemGlow ?? 0.35) * t * t);
  }
  tube(G, pts, rad, { sides: SIDES(d, 5, 8, 12), c0: P.stem, c1: mix3(P.stem, P.gill, 0.45), sway: sw, glow: gl, rng, mottle: 0.08, capLen: 0.2 });   // closed top, hidden inside the gills
  const top = [pts[n][0], pts[n][1] - hc * 0.1, pts[n][2]], sides = SIDES(d, 10, 20, 44), rings = SIDES(d, 3, 6, 10), sT = sw[n], ph = rng() * TAU;
  const wobA = (a) => 1 + 0.05 * Math.sin(a * 3 + ph) + 0.03 * Math.sin(a * 7 + ph * 2);
  // cap surface: u 0 (apex) .. 1 (rolled-under rim)
  const capAt = (u, a) => {
    const th = u * Math.PI * 0.56, st = Math.sin(Math.min(th, Math.PI / 2)), r = R * Math.pow(st, 0.8) * wobA(a) * (th > Math.PI / 2 ? 1 - (th - Math.PI / 2) * 0.5 : 1);
    return { p: [top[0] + Math.cos(a) * r, top[1] + hc * Math.cos(th) * (th > Math.PI / 2 ? 1.6 : 1), top[2] + Math.sin(a) * r], n: vnorm([Math.cos(a) * Math.sin(th), Math.cos(th) + 0.15, Math.sin(a) * Math.sin(th)]), r };
  };
  const capCol = (u) => mix3(P.cap, P.capRim, Math.pow(u, 2.2)), capGl = (u) => (o.capGlow ?? 0.5) * Math.pow(u, 3);
  const apex = G.v([top[0], top[1] + hc, top[2]], [0, 1, 0], P.cap, sT, 0, 0.4, 0); let prev = null;
  for (let i = 1; i <= rings; i++) {
    const u = i / rings, ring = [];
    for (let k = 0; k < sides; k++) { const q = capAt(u, (k / sides) * TAU); ring.push(G.v(q.p, q.n, mul3(capCol(u), 1 + 0.1 * Math.sin(k * 2.4 + i)), sT + 0.01 * R * u * flex, 0.1 * u, 0.4, capGl(u))); }
    if (prev) for (let k = 0; k < sides; k++) G.quad(prev[k], prev[(k + 1) % sides], ring[(k + 1) % sides], ring[k]); else for (let k = 0; k < sides; k++) G.tri(apex, ring[(k + 1) % sides], ring[k]);
    prev = ring;
  }
  // luminous spots: round decals that follow the cap, hot in the middle and melting into the cap colour at the edge
  const ns = Math.round((o.spots ?? 0.16) * SIDES(d, 0, 65, 115)), ss = d >= 2 ? 9 : 6, lift = R * SIDES(d, 0.03, 0.02, 0.008), sg = o.spotGlow ?? 2.2, placed = [];
  for (let s = 0, tries = 0; s < ns && tries < ns * 8; tries++) {
    const u0 = Math.sqrt(rng.range(0.02, 0.62)), a0 = rng() * TAU, rs = R * rng.range(0.04, 0.095) * (1.15 - 0.4 * u0), c = capAt(u0, a0);
    if (placed.some((q) => vlen(vsub(q.p, c.p)) < (q.rs + rs) * 1.15)) continue;
    placed.push({ p: c.p, rs }); s++;
    const arc0 = Math.max(1e-3, vlen(vsub(capAt(u0 + 0.01, a0).p, capAt(u0 - 0.01, a0).p)) / 0.02), rr = Math.max(c.r, rs * 0.6);   // metres per unit u, metres per radian
    const at = (f, k) => { const b = (k / ss) * TAU, q = capAt(clamp(u0 + Math.cos(b) * rs * f / arc0, 0.01, 0.86), a0 + Math.sin(b) * rs * f / rr); return { p: vmad(q.p, q.n, lift * (1.4 - f * 0.4)), n: q.n }; };
    const ci = G.v(vmad(c.p, c.n, lift * 1.4), c.n, P.spot, sT, 0, 0.4, sg), ring0 = [], ring1 = [];
    for (let k = 0; k < ss; k++) {
      if (d >= 2) { const q = at(0.62, k); ring0.push(G.v(q.p, q.n, P.spot, sT, 0, 0.4, sg * 0.9)); }
      const q = at(1, k); ring1.push(G.v(q.p, q.n, capCol(u0), sT, 0, 0.4, capGl(u0)));
    }
    for (let k = 0; k < ss; k++) {
      const k1 = (k + 1) % ss;
      if (d >= 2) { G.tri(ci, ring0[k1], ring0[k]); G.quad(ring0[k], ring0[k1], ring1[k1], ring1[k]); } else G.tri(ci, ring1[k1], ring1[k]);
    }
  }
  // glowing gills under the cap: twice the radial resolution of the cap, real ridges (bright, hanging) and valleys (dark)
  const gs = sides * 2, yr = hc * Math.cos(Math.PI * 0.56) * 1.6, gg = o.gillGlow ?? 2.4, g0 = [], g1 = [], g2 = [], dep = R * 0.035;
  for (let k = 0; k < gs; k++) {
    const a = (k / gs) * TAU, ca = Math.cos(a), sa = Math.sin(a), r = R * wobA(a) * (1 - (Math.PI * 0.06) * 0.5), ridge = k % 2, sh = ridge ? 1 : 0.28, tw = ridge ? 0 : 0.5;
    const nr = vnorm([ca * 0.3 - sa * tw, -0.95, sa * 0.3 + ca * tw]);
    g0.push(G.v([top[0] + ca * r, top[1] + yr - (ridge ? dep * 0.4 : 0), top[2] + sa * r], nr, mul3(P.gill, sh), sT, 0.1, 0.6, gg * sh));
    g1.push(G.v([top[0] + ca * r * 0.5, top[1] + hc * 0.24 - (ridge ? dep : 0), top[2] + sa * r * 0.5], nr, mul3(P.gill, sh * 0.85), sT, 0, 0.6, gg * 0.75 * sh));
    g2.push(G.v([top[0] + ca * sr * 0.9, top[1] + hc * 0.16 - (ridge ? dep * 0.3 : 0), top[2] + sa * sr * 0.9], nr, mul3(mix3(P.stem, P.gill, 0.6), 0.5 + 0.5 * sh), sT, 0, 0.3, gg * 0.35 * sh));
  }
  for (let k = 0; k < gs; k++) { const k1 = (k + 1) % gs; G.quad(g0[k1], g0[k], g1[k], g1[k1]); G.quad(g1[k1], g1[k], g2[k], g2[k1]); }
}

// mushroomGeometry({ rng, height: 6-12, detail, cap (radius / height), dome, stem, babies: 0-3, spots: 0.16 (density), gillGlow: 2.4, spotGlow: 2.2, capGlow: 0.5,
//   capColor: '#34206e', capRim: '#a03cff', spot: '#9ff6ff', gill: '#3fe0ff', stemColor: '#b8a8e0' })
// Giant mushroom with pleated glowing gills and round luminous spots, plus a few young ones at its foot. ~175 / 870 / 2800 triangles.
export function mushroomGeometry(o = {}) {
  const rng = needRng(o, 'mushroomGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(6, 12), G = new Geo();
  const P = { cap: C(o.capColor ?? '#34206e'), capRim: C(o.capRim ?? '#a03cff'), spot: C(o.spot ?? '#9ff6ff'), gill: C(o.gill ?? '#3fe0ff'), stem: C(o.stemColor ?? '#b8a8e0') };
  mushroomOne(G, rng, [0, 0, 0], H, P, o, d);
  for (let k = 0, m = o.babies ?? (d <= 0 ? 0 : rng.int(1, 3)); k < m; k++) { const a = rng() * TAU, r = H * rng.range(0.12, 0.3); mushroomOne(G, rng, [Math.cos(a) * r, 0, Math.sin(a) * r], H * rng.range(0.12, 0.38), P, { ...o, cap: undefined }, Math.max(0, d - 1)); }
  return G.build({ kind: 'mushroom' });
}

// bulbTreeGeometry({ rng, height: 7-12, detail, bark: '#2a2140', barkLight: '#6a4a8a', bulb: '#ff9a3c', bulbCore: '#fff2b0', bulbGlow: 1.1 })
// Dark sinuous branches, each ending in a glowing lantern bulb (shaded as a volume: pale hot core, coloured rim). ~250 / 1100 / 4150 triangles.
export function bulbTreeGeometry(o = {}) {
  const rng = needRng(o, 'bulbTreeGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(7, 12), G = new Geo();
  const P = pal(o, { bark: '#2a2140', barkDark: '#16122a', barkLight: '#6a4a8a', bulb: '#ff9a3c', bulbCore: '#fff2b0' });
  const S = {
    height: H, flex: o.flex ?? 1.2, trunkLen: H * 0.5, trunkR: H * 0.04, flare: 1.2, lean: [rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3)], barkCol: barkFn(P.bark, P.barkDark, P.barkLight), mottle: 0.1,
    levels: [
      { segs: 6, sides: SIDES(d, 5, 7, 8), wander: 0.4, up: 0.3, taper: 0.5, children: SIDES(d, [3, 4], [4, 5], [5, 7]), childAt: [0.35, 0.97], angle: [0.6, 1.2], lenK: [0.5, 0.9], radK: 0.5, tipLeaf: true },
      { segs: SIDES(d, 5, 4, 5), sides: SIDES(d, 3, 4, 5), wander: 0.5, up: 0.9, taper: 0.3, children: SIDES(d, [0, 0], [1, 1], [2, 2]), childAt: [0.3, 0.8], angle: [0.6, 1.2], lenK: [0.4, 0.7], radK: 0.6, sway: 0.03, tipLeaf: true },
      { segs: SIDES(d, 4, 3, 4), sides: 3, wander: 0.5, up: 0.8, taper: 0.3, sway: 0.05 },
    ],
  };
  const tips = skeleton(G, rng, S), glow = o.bulbGlow ?? 1.1;
  for (const t of tips) {
    const r = H * rng.range(0.035, 0.06) * (t.depth === 0 ? 1.5 : 1), c = vmad(t.p, t.dir, r * 0.9), dh = (rng() - 0.5) * 0.06, bc = shift(P.bulb, dh, 0, 0);
    blob(G, rng, c, [r, r * 1.35, r], { detail: d <= 0 ? 0 : d === 1 || t.depth > 1 ? 1 : 2, lump: 0.05, lo: mix3(bc, shift(P.bulbCore, dh, 0, 0), 0.7), mid: bc, hi: mul3(bc, 0.6), sway: t.sway + r * 0.05, flutter: 0.4, leaf: 0.3, glow: -glow * rng.range(0.7, 1.2), vary: 0, flatBottom: 1 });
  }
  fitHeight(G, H);
  return G.build({ kind: 'bulbTree' });
}

// frondSpiralGeometry({ rng, height: 5-9, detail, heads: 2-4, stalk: '#1f5a4a', stalkTip: '#7affc0', leaf: '#2a8a6a', leafTip: '#b8ffd0', glow: 1.6 })
// Giant fiddleheads: stalks that curl into spirals, fringed with luminous pinnate leaflets. ~240 / 900 / 1900 triangles.
export function frondSpiralGeometry(o = {}) {
  const rng = needRng(o, 'frondSpiralGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(5, 9), G = new Geo(), flex = o.flex ?? 1;
  const P = pal(o, { stalk: '#1f5a4a', stalkTip: '#7affc0', leaf: '#2a8a6a', leafTip: '#b8ffd0' }), glow = o.glow ?? 1.6;
  const heads = o.heads ?? (d <= 0 ? 2 : rng.int(2, 4)); let az = rng() * TAU;
  for (let hI = 0; hI < heads; hI++) {
    az += TAU / heads + rng.range(-0.5, 0.5);
    const h = H * (hI === 0 ? 1 : rng.range(0.45, 0.85)), R = h * rng.range(0.16, 0.22), ex = [Math.cos(az), 0, Math.sin(az)], turns = rng.range(1.6, 2.3);
    const n = SIDES(d, 12, 20, 30), nStem = Math.round(n * 0.35), pts = [], rad = [], sw = [], gl = [], r0 = h * 0.04;
    const cy = h - R, lean = h * rng.range(0.1, 0.3);
    for (let i = 0; i <= n; i++) {
      let p;
      if (i <= nStem) { const t = i / nStem; p = [ex[0] * (lean * t * t - lean - R), cy * t, ex[2] * (lean * t * t - lean - R)]; }
      else { const t = (i - nStem) / (n - nStem), ang = Math.PI - t * turns * TAU, rr = R * Math.pow(1 - t, 0.9) + R * 0.04; p = [ex[0] * Math.cos(ang) * rr, cy + Math.sin(-ang + Math.PI) * rr, ex[2] * Math.cos(ang) * rr]; }
      const u = i / n; pts.push(p); rad.push(r0 * (1 - 0.82 * u) * (1 + 0.8 * Math.exp(-u * 14))); sw.push(flex * 0.035 * h * Math.pow(sat(p[1] / h), 2)); gl.push(glow * (0.15 + 0.6 * u * u));
    }
    tube(G, pts, rad, { sides: SIDES(d, 4, 5, 7), c0: P.stalk, c1: P.stalkTip, sway: sw, glow: gl, capLen: 2 });
    // leaflets along the outside of the curve: little arching pinnate fronds, dark at the stalk and luminous at the tip
    const side = vcross(ex, [0, 1, 0]), step = d <= 0 ? 2 : 1, ls = d <= 0 ? 1 : 2;
    for (let i = 2; i < n - 1; i += step) {
      const u = i / n, tan = vnorm(vsub(pts[i + 1], pts[i - 1])), out = vnorm(vcross(side, tan)), len = h * 0.27 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) * (1 - 0.6 * u) + h * 0.02;
      for (const sg of [-1, 1]) {
        const dir = vnorm([out[0] * 0.5 + side[0] * sg * 0.8 + tan[0] * 0.3, out[1] * 0.5 + side[1] * sg * 0.8 + tan[1] * 0.3, out[2] * 0.5 + side[2] * sg * 0.8 + tan[2] * 0.3]);
        const lp = arc(pts[i], dir, len * rng.range(0.85, 1.1), ls, vnorm(vadd(out, [0, -0.6, 0])), 0.55), w = len * 0.3, ws = [], lsw = [], lgl = [];
        for (let j = 0; j <= ls; j++) { const t = j / ls; ws.push(w); lsw.push(sw[i] + len * 0.06 * t * t); lgl.push(gl[i] * 0.4 + glow * (0.1 + 0.75 * u) * t * t); }
        strip(G, lp, ws, vnorm(vadd(out, [0, 0.4, 0])), { c0: mix3(P.stalk, P.leaf, 0.6), c1: P.leafTip, sway: lsw, flutter: 1.1, flutterTip: true, glow: lgl, curl: 0.4, uv: CELL.frond });
      }
    }
  }
  return G.build({ kind: 'frondSpiral' });
}

// tendrilGeometry({ rng, height: 4-8, detail, count: 5-9, curl: 1, base: '#1a3a5a', mid: '#2a7a9a', tip: '#ff5ad0', glow: 2.5 })
// A knot of tapering tentacles that coil toward glowing tips and writhe in the wind. ~270 / 1050 / 2350 triangles.
export function tendrilGeometry(o = {}) {
  const rng = needRng(o, 'tendrilGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(4, 8), G = new Geo(), flex = o.flex ?? 2.2;
  const P = pal(o, { base: '#1a3a5a', mid: '#2a7a9a', tip: '#ff5ad0' }), glow = o.glow ?? 2.5, count = o.count ?? SIDES(d, 4, rng.int(5, 8), rng.int(7, 10));
  let az = rng() * TAU;
  for (let k = 0; k < count; k++) {
    az += TAU / count + rng.range(-0.4, 0.4);
    const h = H * (k === 0 ? 1 : rng.range(0.45, 0.95)), n = SIDES(d, 8, 14, 20), out = rng.range(0.1, 0.45), curl = (o.curl ?? 1) * rng.range(0.7, 1.4) * rng.sign(), pts = [], rad = [], sw = [], gl = [], cols = [];
    let p = [Math.cos(az) * H * 0.04, 0, Math.sin(az) * H * 0.04], dir = vnorm([Math.cos(az) * out, 1, Math.sin(az) * out]);
    const ax = vnorm([Math.cos(az + 1.6), rng.range(-0.3, 0.3), Math.sin(az + 1.6)]);
    for (let i = 0; i <= n; i++) {
      const u = i / n; pts.push(p); rad.push(H * 0.045 * Math.pow(1 - u, 1.1) * (1 + 0.8 * Math.exp(-u * 10)) + H * 0.004);
      sw.push(flex * 0.04 * h * u * u); gl.push(glow * (0.08 + Math.pow(u, 2.5))); cols.push(u < 0.6 ? mix3(P.base, P.mid, u / 0.6) : mix3(P.mid, P.tip, (u - 0.6) / 0.4));
      dir = vnorm(vrot(dir, ax, curl * Math.pow(u, 2.2) * 0.9 * (14 / n) * 1.0)); dir = vnorm([dir[0], dir[1] + 0.06 * (1 - u), dir[2]]);
      p = vmad(p, dir, (h * 1.25) / n);
    }
    tube(G, pts, rad, { sides: SIDES(d, 4, 6, 7), sway: sw, glow: gl, col: (t) => cols[Math.min(n, Math.round(t * n))], capLen: 3, leaf: 0.5 });
  }
  fitHeight(G, H);
  return G.build({ kind: 'tendril' });
}

// crystalTreeGeometry({ rng, height: 7-12, detail, trunk: '#3a3a5a', trunkLight: '#8a8ab8', crystal: '#6ad0ff', crystalTip: '#e8f8ff', glow: 1.4 })
// Angular trunk and limbs carrying clusters of faceted glowing crystals. Best with windMaterial({ standard: true }). ~225 / 1000 / 2600 triangles.
export function crystalTreeGeometry(o = {}) {
  const rng = needRng(o, 'crystalTreeGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(7, 12), G = new Geo();
  const P = pal(o, { trunk: '#3a3a5a', trunkDark: '#1a1a30', trunkLight: '#8a8ab8', crystal: '#6ad0ff', crystalTip: '#e8f8ff' }), glow = o.glow ?? 1.4;
  const S = {
    height: H, flex: o.flex ?? 0.15, trunkLen: H * 0.5, trunkR: H * 0.045, flare: 0.7, lean: [rng.range(-0.15, 0.15), 1, rng.range(-0.15, 0.15)], barkCol: barkFn(P.trunk, P.trunkDark, P.trunkLight), mottle: 0.1,
    levels: [
      { segs: 4, sides: 5, wander: 0.5, up: 0.4, taper: 0.55, children: SIDES(d, [3, 3], [4, 5], [5, 7]), childAt: [0.4, 0.97], angle: [0.6, 1.15], lenK: [0.5, 0.85], radK: 0.55, tipLeaf: true },
      { segs: 3, sides: 4, wander: 0.7, up: 0.5, taper: 0.4, children: SIDES(d, [0, 0], [1, 2], [2, 3]), childAt: [0.4, 0.9], angle: [0.6, 1.1], lenK: [0.5, 0.7], radK: 0.6, tipLeaf: true },
      { segs: 2, sides: 3, wander: 0.6, up: 0.4, taper: 0.4 },
    ],
  };
  const tips = skeleton(G, rng, S);
  for (const t of tips) {
    const m = SIDES(d, 2, rng.int(3, 4), rng.int(4, 6)), dh = (rng() - 0.5) * 0.08;
    for (let k = 0; k < m; k++) {
      const dir = k === 0 ? t.dir : coneDir(rng, t.dir, 1.1), len = H * rng.range(0.06, 0.14) * (k === 0 ? 1.4 : 1), r = len * rng.range(0.14, 0.22);
      prism(G, vmad(t.p, dir, -len * 0.15), vmad(t.p, dir, len), r * 0.7, r, d <= 0 ? 4 : 6, { c0: shift(P.crystal, dh, 0, -0.3), c1: shift(P.crystalTip, dh, 0, 0), g0: glow * 0.25, g1: glow * rng.range(0.6, 1.1), sway: t.sway, leaf: 0.6 });
    }
  }
  fitHeight(G, H);
  return G.build({ kind: 'crystalTree' });
}

// ---------------------------------------------------------------------------------------------
// ground cover
// ---------------------------------------------------------------------------------------------
// vertical alpha-cut card(s) crossing at the origin. rows: [[height fraction, colour, leaf mask (default 1; 2 = petal)], ...]
function crossCards(G, rng, o) {
  const cards = o.cards ?? 2, w = o.width ?? 1, h = o.height ?? 1, cell = o.cell || CELL.grass, rows = o.rows, a0 = rng() * Math.PI;
  for (let k = 0; k < cards; k++) {
    const a = a0 + (k / cards) * Math.PI + rng.range(-0.25, 0.25), dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
    const off = [rng.range(-0.12, 0.12) * w * (o.spread ?? 1), 0, rng.range(-0.12, 0.12) * w * (o.spread ?? 1)], lean = rng.range(-0.18, 0.18) * h, flip = rng() < 0.5;
    const nr = vnorm([px * 0.3 * Math.sign(lean || 1), 1, pz * 0.3 * Math.sign(lean || 1)]); let prev = null;
    for (const [r, col, lf] of rows) {
      const y = r * h, lx = px * lean * r * r, lz = pz * lean * r * r, sw = r * r * h * (o.sway ?? 0.4), tv = lerp(cell[3], cell[1], r), ww = w * 0.5 * (o.taper ? lerp(1, o.taper, r) : 1);
      const i0 = G.v([off[0] - dx * ww + lx, y, off[2] - dz * ww + lz], nr, col, sw, r * (o.flutter ?? 0.6), lf ?? 1, (o.glow || 0) * r, flip ? cell[2] : cell[0], tv);
      const i1 = G.v([off[0] + dx * ww + lx, y, off[2] + dz * ww + lz], nr, col, sw, r * (o.flutter ?? 0.6), lf ?? 1, (o.glow || 0) * r, flip ? cell[0] : cell[2], tv);
      if (prev) G.quad(prev[0], prev[1], i1, i0);
      prev = [i0, i1];
    }
  }
}

// grassTuftGeometry({ rng, cards: 2, width: 1.1, height: 0.75, root: '#35561f', tip: root x [1.7, 1.55, 1.2], flower: colour | undefined, petalMask: false, glow: 0 })
// Crossed cards from the atlas (a bell-shaped spray of about 17 blades each). 2 triangles per card (6 per card + 2 with flower heads).
// petalMask: true makes white flower heads that take a per-instance colour (the `petal` instanced attribute; see makeScatter petalColors).
export function grassTuftGeometry(o = {}) {
  const rng = needRng(o, 'grassTuftGeometry'), G = new Geo(), root = C(o.root ?? '#35561f'), tip = o.tip !== undefined ? C(o.tip) : [root[0] * 1.7, root[1] * 1.55, root[2] * 1.2];
  if (o.flower !== undefined || o.petalMask) {
    const f = o.petalMask ? [1, 1, 1] : C(o.flower), pm = o.petalMask ? 2 : 1;
    crossCards(G, rng, { cards: o.cards ?? 2, width: o.width ?? 0.9, height: o.height ?? 0.9, cell: CELL.flower, glow: o.glow, rows: [[0, root], [0.44, mix3(root, tip, 0.7)], [0.56, f, pm], [1, f, pm]] });
    // a level card of flower heads, so the clump is a scatter of blossoms (not a cross) when seen from above
    const hh = o.height ?? 0.9, hw = (o.width ?? 0.9) * 0.42, c = CELL.flower, va = lerp(c[3], c[1], 0.6), ca = rng() * TAU, cx = Math.cos(ca) * hw, cz = Math.sin(ca) * hw;
    const q = [[-cx + cz, -cz - cx, c[0], va], [cx + cz, cz - cx, c[2], va], [cx - cz, cz + cx, c[2], c[1]], [-cx - cz, -cz + cx, c[0], c[1]]].map(([x, z, u, v]) => G.v([x, hh * 0.8, z], [0, 1, 0], f, hh * 0.26, 0.5, pm, (o.glow || 0) * 0.8, u, v));
    G.quad(q[0], q[1], q[2], q[3]);
  } else crossCards(G, rng, { cards: o.cards ?? 2, width: o.width ?? 1.1, height: o.height ?? 0.75, glow: o.glow, rows: [[0, root], [1, tip]] });
  return G.build({ kind: 'grass' });
}

// makeGrass(options): a carpet of instanced grass tufts with wind waves and optional flowers. Has its own placement (not scatterPoints).
//   rng (required); path (+ uRange: [u0,u1]) with radius: 30 reach either side and bias: 2.5 (tufts crowd toward the path: lateral = radius * rnd^bias),
//                   or bounds [minX,minZ,maxX,maxZ], or radius: 55 around the origin
//   count: 24000 tufts (2 cards, ~34 blades, 4 triangles each)      width: [0.9, 1.5], height: [0.45, 0.9] metres, cards: 2
//   heightAt(x,z) (sampled on a lattice of heightStep: 2 m and interpolated), density(x, z, |lateral|, u) -> 0..1, yRange: [min,max]
//   groundColor(x, z, y) -> colour: each tuft takes the terrain colour at its foot (pass the function that colours your ground); root / tip then only set the root-to-tip ratio
//   shade: fn(x, z) | [makeGroundShadows / makeScatter results]: tufts standing in those contact shadows are darkened to match the ground
//   root: '#35561f' (with groundColor: the mean ground colour), tip: root x [1.7, 1.55, 1.2], dry: '#c8b060', dryAmount: 0.25 (0 with groundColor), tint: 0.12
//   rootGain: 1.25 (with groundColor: tuft root brightness relative to the ground, compensating for the atlas shading)
//   flowers: 0.04 fraction of tufts in bloom, flowerColors: ['#e4e4da','#f0cc48','#b88af0','#f07898'] (per instance: one draw call for all colours), glow: 0
//   chunks: 4 (along the placed range), fade: [70, 100] metres (tufts sink away), cullDistance: fade end, align: 1 (tufts take the ground normal, so they are lit like the ground)
//   wind, map (shared atlas), material | materialOptions (defaults: ambient 1, leafAmbient 1, wrap 0.3, backlight 0.5, sheen 0.4, detail 0), receiveShadow
// -> { object, meshes, material, wind, uniforms, count, triangles, update(dt, time, camera) }.  2 draw calls per chunk (1 with flowers: 0). ~15 ms per 24k tufts once warm, up to ~60 ms on a cold first call.
// makeGrassAsync(options, ctx.yield) is the same carpet built in short steps that hand the page back in between
// (same result, same random draws): `const grass = await makeGrassAsync({ ... }, ctx.yield)`.
const FLOWER_COLORS = ['#e4e4da', '#f0cc48', '#b88af0', '#f07898'];
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : 0);
export const makeGrass = (o = {}) => { const it = grassSteps(o); let r; while (!(r = it.next()).done); return r.value; };
export async function makeGrassAsync(o = {}, yieldFn, slice = 8) {
  const it = grassSteps(o); let r, t = nowMs();
  while (!(r = it.next()).done) { if (yieldFn && nowMs() - t > slice) { await yieldFn(); t = nowMs(); } }
  return r.value;
}
function* grassSteps(o = {}) {
  const rng = needRng(o, 'makeGrass'), path = o.path, count = o.count ?? 24000, radius = o.radius ?? (path ? 30 : 55), heightAt = o.heightAt || (() => 0), density = o.density, gcol = o.groundColor, shade = shadeFn(o.shade);
  const wR = o.width || [0.9, 1.5], hR = o.height || [0.45, 0.9], chunks = path ? clamp(o.chunks ?? 4, 1, 100) : 1, fl = o.flowers ?? 0.04, fcols = (o.flowerColors || FLOWER_COLORS).map(C);
  const wind = o.wind || o.material?.userData?.wind || makeWind(), align = o.heightAt ? (o.align ?? 1) : 0, fade = o.fade || [70, 100], bias = o.bias ?? 2.5;
  const material = o.material || windMaterial({ wind, ...(o.map !== undefined ? { map: o.map } : {}), fade, detail: 0, wrap: 0.3, backlight: 0.5, ambient: 1, leafAmbient: 1, sheen: 0.4, ...(o.materialOptions || {}) });
  yield;
  // placement domain: lattice coordinates (a, c) in 0..1 -> world. Heights and ground colours are sampled once on that lattice.
  const ur = o.uRange || [0, 1], bb = o.bounds || [-radius, -radius, radius, radius], N = 240, tab = path ? pathTable(path, N) : null;
  const lenA = tab ? Math.max(1, (ur[1] - ur[0]) * path.length) : bb[2] - bb[0], lenC = tab ? 2 * radius : bb[3] - bb[1];
  let step = Math.max(0.25, o.heightStep ?? 2); while ((lenA / step + 2) * (lenC / step + 2) > 60000) step *= 1.3;
  const NU = Math.max(1, Math.ceil(lenA / step)), NL = Math.max(1, Math.ceil(lenC / step)), LW = NU + 1, cellA = lenA / NU, cellC = lenC / NL, q = [0, 0, 1, 0];
  const posAt = (a, c) => {
    if (!tab) { q[0] = lerp(bb[0], bb[2], a); q[1] = lerp(bb[1], bb[3], c); return; }
    const f = clamp(lerp(ur[0], ur[1], a), 0, 1) * N, i = Math.min(N - 1, Math.floor(f)), g = f - i, j = i * 4, lat = (c * 2 - 1) * radius;
    q[2] = lerp(tab[j + 2], tab[j + 6], g); q[3] = lerp(tab[j + 3], tab[j + 7], g); q[0] = lerp(tab[j], tab[j + 4], g) + q[2] * lat; q[1] = lerp(tab[j + 1], tab[j + 5], g) + q[3] * lat;
  };
  const hgt = new Float32Array(LW * (NL + 1)), gc = gcol ? new Float32Array(LW * (NL + 1) * 3) : null, mean = [0, 0, 0];
  for (let j = 0; j <= NL; j++) { if ((j & 7) === 7) yield; for (let i = 0; i <= NU; i++) {
    posAt(i / NU, j / NL); const k = j * LW + i, y = hgt[k] = heightAt(q[0], q[1]);
    if (gc) { const c = C(gcol(q[0], q[1], y)); gc[k * 3] = c[0]; gc[k * 3 + 1] = c[1]; gc[k * 3 + 2] = c[2]; mean[0] += c[0]; mean[1] += c[1]; mean[2] += c[2]; }
  } }
  const root = o.root !== undefined ? C(o.root) : gc ? mul3(mean, 1 / (LW * (NL + 1))) : C('#35561f'), tip = o.tip !== undefined ? C(o.tip) : [root[0] * 1.7, root[1] * 1.55, root[2] * 1.2];
  // with a groundColor the tufts are authored relative to it (root = 1) and coloured per instance; otherwise they carry root / tip themselves
  let gRoot = root, gTip = tip;
  if (gcol) { const g0 = o.rootGain ?? 1.25, r = [tip[0] / Math.max(root[0], 1e-3), tip[1] / Math.max(root[1], 1e-3), tip[2] / Math.max(root[2], 1e-3)]; gRoot = [g0, g0, g0]; gTip = mul3(r, g0 * Math.min(1, 3.6 / Math.max(r[0], r[1], r[2]))); }
  const gr = rng.fork('geo'), geoT = grassTuftGeometry({ rng: gr, root: gRoot, tip: gTip, cards: o.cards, glow: o.glow });
  const geoF = fl > 0 ? grassTuftGeometry({ rng: gr, root: gRoot, tip: gTip, petalMask: true, glow: o.glow }) : null;
  yield;
  const dry = C(o.dry ?? '#c8b060'), dryK = [dry[0] / Math.max(tip[0], 1e-3), dry[1] / Math.max(tip[1], 1e-3), dry[2] / Math.max(tip[2], 1e-3)], dryAmt = o.dryAmount ?? (gcol ? 0 : 0.25), tint = o.tint ?? 0.12;
  // pass 1: place (10 floats per tuft: x y z width height nx nz r g b) and count per bucket (bloom or not, chunk)
  const data = new Float32Array(count * 10), keys = new Uint8Array(count), tally = new Uint32Array(chunks * 2);
  let placed = 0;
  for (let k = 0, tries = count * 3; k < tries && placed < count; k++) {
    if ((k & 511) === 511) yield;
    let a, c, lat = 0;
    if (tab) { a = rng(); lat = radius * Math.pow(rng(), bias) * (rng() < 0.5 ? -1 : 1); c = lat / radius * 0.5 + 0.5; }
    else if (o.bounds) { a = rng(); c = rng(); }
    else { const an = rng() * TAU, r = Math.sqrt(rng()); a = 0.5 + 0.5 * Math.cos(an) * r; c = 0.5 + 0.5 * Math.sin(an) * r; lat = r * radius; }
    const fi = a * NU, fj = c * NL, i0 = Math.min(NU - 1, Math.floor(fi)), j0 = Math.min(NL - 1, Math.floor(fj)), ti = fi - i0, tj = fj - j0, k00 = j0 * LW + i0, k10 = k00 + 1, k01 = k00 + LW, k11 = k01 + 1;
    const h00 = hgt[k00], h10 = hgt[k10], h01 = hgt[k01], h11 = hgt[k11], y = lerp(lerp(h00, h10, ti), lerp(h01, h11, ti), tj);
    if (o.yRange && (y < o.yRange[0] || y > o.yRange[1])) continue;
    posAt(a, c); const x = q[0], z = q[1];
    if (density) { const p = density(x, z, Math.abs(lat), tab ? lerp(ur[0], ur[1], a) : 0); if (!(p > 0) || rng() > p) continue; }
    const j = placed * 10, far = 1 + 0.55 * Math.abs(lat) / radius, gi = fl > 0 && rng() < fl ? 1 : 0, key = gi * chunks + Math.min(chunks - 1, Math.floor(a * chunks));
    data[j] = x; data[j + 1] = y; data[j + 2] = z; data[j + 3] = lerp(wR[0], wR[1], rng()) * far; data[j + 4] = lerp(hR[0], hR[1], rng()) * far * (gi ? 1.2 : 1);
    if (align > 0) {   // ground normal from the lattice slope, so tufts shade like the terrain under them
      const ga = (lerp(h10, h11, tj) - lerp(h00, h01, tj)) / cellA, gl = (lerp(h01, h11, ti) - lerp(h00, h10, ti)) / cellC;
      data[j + 5] = clamp(-(tab ? ga * q[3] + gl * q[2] : ga), -0.9, 0.9) * align; data[j + 6] = clamp(-(tab ? -ga * q[2] + gl * q[3] : gl), -0.9, 0.9) * align;
    }
    if (gc) {
      const w00 = (1 - ti) * (1 - tj), w10 = ti * (1 - tj), w01 = (1 - ti) * tj, w11 = ti * tj, a0 = k00 * 3, a1 = k10 * 3, a2 = k01 * 3, a3 = k11 * 3;
      data[j + 7] = gc[a0] * w00 + gc[a1] * w10 + gc[a2] * w01 + gc[a3] * w11; data[j + 8] = gc[a0 + 1] * w00 + gc[a1 + 1] * w10 + gc[a2 + 1] * w01 + gc[a3 + 1] * w11; data[j + 9] = gc[a0 + 2] * w00 + gc[a1 + 2] * w10 + gc[a2 + 2] * w01 + gc[a3 + 2] * w11;
    } else data[j + 7] = data[j + 8] = data[j + 9] = 1;
    if (shade) { const sh = shade(x, z); data[j + 7] *= sh[0]; data[j + 8] *= sh[1]; data[j + 9] *= sh[2]; }
    keys[placed++] = key; tally[key]++;
  }
  // pass 2: one InstancedMesh per bucket, matrices and colours written straight into its buffers
  const object = new THREE.Group(), meshes = [], slots = []; let triangles = 0;
  for (let key = 0; key < chunks * 2; key++) {
    const n = tally[key]; if (!n) { slots.push(null); continue; }
    const bloom = key >= chunks, base = bloom ? geoF : geoT, pa = bloom ? new Float32Array(n * 3) : null, mesh = new THREE.InstancedMesh(pa ? withInstanced(base, 'petal', pa, 3) : base, material, n);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    slots.push({ mesh, e: mesh.instanceMatrix.array, col: mesh.instanceColor.array, pa, i: 0 }); triangles += base.userData.triangles * n; object.add(mesh); meshes.push(mesh);
    if (o.receiveShadow) mesh.receiveShadow = true;
    if (shade) mesh.renderOrder = 1;      // after the shadow sheets (see makeGroundShadows)
  }
  yield;
  for (let t = 0; t < placed; t++) {
    if ((t & 1023) === 1023) yield;
    const sl = slots[keys[t]], i = sl.i++, j = t * 10, e = sl.e, m = i * 16, x = data[j], z = data[j + 2], w = data[j + 3], h = data[j + 4], a = rng() * TAU, c = Math.cos(a), s = Math.sin(a);
    const nl = 1 / Math.hypot(data[j + 5], 1, data[j + 6]), ux = data[j + 5] * nl, uy = nl, uz = data[j + 6] * nl, d = c * ux - s * uz;        // up axis = ground normal
    let ax = c - ux * d, ay = -uy * d, az = -s - uz * d; const al = 1 / Math.hypot(ax, ay, az); ax *= al; ay *= al; az *= al;
    e[m] = ax * w; e[m + 1] = ay * w; e[m + 2] = az * w; e[m + 3] = 0; e[m + 4] = ux * h; e[m + 5] = uy * h; e[m + 6] = uz * h; e[m + 7] = 0;
    e[m + 8] = (ay * uz - az * uy) * w; e[m + 9] = (az * ux - ax * uz) * w; e[m + 10] = (ax * uy - ay * ux) * w; e[m + 11] = 0; e[m + 12] = x; e[m + 13] = data[j + 1] - 0.1 * h; e[m + 14] = z; e[m + 15] = 1;
    let dk = 0;
    if (dryAmt > 0) { const pn = 0.5 + 0.5 * Math.sin(x * 0.045 + Math.sin(z * 0.06) * 1.7) * Math.sin(z * 0.038 + 1.3 + Math.sin(x * 0.021) * 2.0); dk = Math.pow(sat(pn * 1.2 - 0.1 + (rng() - 0.5) * 0.3), 2) * dryAmt; }
    const br = 1 + (rng() - 0.5) * 2 * tint, cl = sl.col, ci = i * 3;
    cl[ci] = data[j + 7] * br * lerp(1, dryK[0], dk); cl[ci + 1] = data[j + 8] * br * lerp(1, dryK[1], dk); cl[ci + 2] = data[j + 9] * br * lerp(1, dryK[2], dk);
    if (sl.pa) { const f = fcols[Math.floor(rng() * fcols.length)], sh = shade ? shade(x, z) : null, sk = sh ? (sh[0] + sh[1] + sh[2]) / 3 : 1; sl.pa[ci] = f[0] * sk; sl.pa[ci + 1] = f[1] * sk; sl.pa[ci + 2] = f[2] * sk; }
  }
  for (const mesh of meshes) { yield; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2; }
  const cull = o.cullDistance ?? (material.userData.uniforms?.uFloraFade.value.y || fade[1]);
  return { object, meshes, material, wind, uniforms: material.userData.uniforms, count: placed, triangles, update(dt, time, camera) { wind.update(time); cullChunks(meshes, camera, cull); } };
}

// flowerGeometry({ rng, color: '#ffd84a', cards: 3, width: 1, height: 1, root, tip, petalMask: false, glow: 0 }): a clump of flowers (20 triangles).
export function flowerGeometry(o = {}) {
  return grassTuftGeometry({ cards: 3, width: 1.0, height: 1.0, ...o, flower: o.petalMask ? undefined : (o.color ?? '#ffd84a') });
}

// bushGeometry({ rng, size: 1.2-2.0, detail, leaf, leafLight, leafDark, bark, flowers: 0, flowerColor: '#ffffff' }): low mounded shrub. ~150 / 320 / 640 triangles.
export function bushGeometry(o = {}) {
  const rng = needRng(o, 'bushGeometry'), d = o.detail ?? 1, R = o.size ?? rng.range(1.2, 2.0), G = new Geo();
  const P = pal(o, { leaf: '#3f7a30', leafLight: '#9ab84e', leafDark: '#20472a', bark: '#5a4636', barkDark: '#33271e' });
  const n = SIDES(d, 3, 5, 8), tips = []; let az = rng() * TAU;
  for (let k = 0; k < n; k++) {
    az += 2.4; const r = k === 0 ? 0 : R * rng.range(0.35, 0.6), y = R * (k === 0 ? 0.62 : rng.range(0.28, 0.5)), p = [Math.cos(az) * r, y, Math.sin(az) * r], sw = 0.03 * y;
    tube(G, [[p[0] * 0.15, 0, p[2] * 0.15], vlerp([0, 0, 0], p, 0.6), p], [R * 0.035, R * 0.025, R * 0.012], { sides: 3, c0: P.barkDark, c1: P.bark, sway: [0, sw * 0.4, sw], cap: false });
    tips.push({ p, dir: vnorm(p[1] ? p : [0, 1, 0]), depth: 1, sway: sw, pts: [p], sw: [sw] });
  }
  crownFoliage(G, rng, tips, { r: R * 0.42, squash: 0.8, detail: 0, coreScale: 0.5, leaves: SIDES(d, 9, 16, 24), leafSize: 1.3, lo: P.leafDark, mid: P.leaf, hi: P.leafLight, hueJitter: 0.02, flex: 1 });
  if (o.flowers) { const f = C(o.flowerColor ?? '#ffffff'); for (const t of tips) blob(G, rng, vadd(t.p, [0, R * 0.1, 0]), R * 0.4, { detail: 0, core: false, leaves: Math.round(5 * o.flowers), leafSize: 0.6, leafOut: 1.05, lo: mul3(f, 0.7), mid: f, hi: f, cell: CELL.flower, sway: t.sway, vary: 0.1 }); }
  return G.build({ kind: 'bush' });
}

// fernGeometry({ rng, size: 0.9-1.5, fronds: 7-10, detail: 1 (3 / 4 / 5 segments per frond), leaf: '#3c8a3a', leafLight: '#a8d060', leafDark: '#1c4a2a', glow: 0 })
// Rosette of arching fronds. ~48 / 64 / 87 triangles.
export function fernGeometry(o = {}) {
  const rng = needRng(o, 'fernGeometry'), R = o.size ?? rng.range(0.9, 1.5), G = new Geo(), n = o.fronds ?? rng.int(7, 10), segs = o.segs ?? SIDES(o.detail ?? 1, 3, 4, 5);
  const P = pal(o, { leaf: '#3c8a3a', leafLight: '#a8d060', leafDark: '#1c4a2a' }), gl = []; let az = rng() * TAU;
  for (let j = 0; j <= segs; j++) gl.push((o.glow || 0) * Math.pow(j / segs, 1.7));   // glow swells smoothly toward the tips
  for (let k = 0; k < n; k++) {
    az += 2.4 + rng.range(-0.3, 0.3); const el = rng.range(0.75, 1.3), dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], len = R * rng.range(0.8, 1.25), c = shift(P.leaf, (rng() - 0.5) * 0.04, 0, rng.range(-0.15, 0.15));
    frond(G, rng, [0, 0, 0], dir, len, len * 0.42, { segs, droop: rng.range(0.9, 1.5), flex: 0.12, c0: P.leafDark, c1: c, c2: P.leafLight, fold: 0, glow: o.glow ? gl : 0 });
  }
  return G.build({ kind: 'fern' });
}

// reedGeometry({ rng, height: 2.0-2.8, blades: 6-8, cattails: 2-3, leaf: '#5a8a3a', tip: '#c8c070', root: '#2a4a24', head: '#5a3a22' })
// A clump of individual tapered blades (solid geometry, no cut-out cards) with cattail heads. ~150 triangles.
export function reedGeometry(o = {}) {
  const rng = needRng(o, 'reedGeometry'), H = o.height ?? rng.range(2.0, 2.8), G = new Geo();
  const P = pal(o, { leaf: '#5a8a3a', tip: '#c8c070', root: '#2a4a24', head: '#5a3a22' });
  for (let k = 0, m = o.blades ?? rng.int(6, 8); k < m; k++) {
    const a = rng() * TAU, r0 = H * rng.range(0, 0.06), el = rng.range(1.12, 1.5), len = H * rng.range(0.55, 1.0), w = H * rng.range(0.024, 0.036);
    const pts = arc([Math.cos(a) * r0, 0, Math.sin(a) * r0], [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], len, 3, [0, -1, 0], rng.range(0.2, 0.95), rng, 0.05);
    const c = shift(P.leaf, (rng() - 0.5) * 0.04, 0, rng.range(-0.2, 0.15)), sw = [0, 1, 2, 3].map((j) => Math.pow(j / 3, 2) * len * 0.22);
    strip(G, pts, [w, w * 0.92, w * 0.62, w * 0.05], [Math.cos(a), 0.25, Math.sin(a)], { col: (t) => (t < 0.45 ? mix3(P.root, c, t / 0.45) : mix3(c, P.tip, (t - 0.45) / 0.55)), sway: sw, flutter: 0.7, flutterTip: true, curl: 0.5, upBias: 0.5 });
  }
  for (let k = 0, m = o.cattails ?? rng.int(2, 3); k < m; k++) {
    const a = rng() * TAU, r = H * rng.range(0.03, 0.16), h = H * rng.range(0.8, 1.08), lean = [rng.range(-0.12, 0.12) * h, rng.range(-0.12, 0.12) * h], b = [Math.cos(a) * r, 0, Math.sin(a) * r];
    const at = (t) => [b[0] + lean[0] * t * t, h * t, b[2] + lean[1] * t * t], sw = (t) => t * t * h * 0.22;
    tube(G, [at(0), at(0.5), at(0.8)], [0.018, 0.015, 0.012], { sides: 3, c0: P.root, c1: P.leaf, sway: [0, sw(0.5), sw(0.8)], cap: false });
    tube(G, [at(0.8), at(0.83), at(0.95), at(0.98)], [0.015, 0.05, 0.05, 0.012], { sides: 4, c0: P.head, c1: mul3(P.head, 1.4), sway: [sw(0.8), sw(0.83), sw(0.95), sw(0.98)], capLen: 6 });
  }
  return G.build({ kind: 'reed' });
}

// lilyPadGeometry({ rng, size: 0.5-0.9, flower: false, pad: '#3f7a3a', padLight: '#8ab850', rim: '#6a5a2a', petal: '#ffd0e4', petalTip: '#ff7ab0', heart: '#ffd84a', glow: 0 })
// Floating pad with a notch (42 triangles), optionally with a lotus flower (+92).
export function lilyPadGeometry(o = {}) {
  const rng = needRng(o, 'lilyPadGeometry'), R = o.size ?? rng.range(0.5, 0.9), G = new Geo(), n = 14;
  const P = pal(o, { pad: '#3f7a3a', padLight: '#8ab850', rim: '#6a5a2a', petal: '#ffd0e4', petalTip: '#ff7ab0', heart: '#ffd84a' }), up = [0, 1, 0];
  const c = G.v([0, 0.02, 0], up, P.padLight, 0.01, 0, 1), notch = rng() * TAU; let prev = null;
  for (let k = 0; k <= n; k++) {
    const a = notch + 0.22 + (k / n) * (TAU - 0.44), rr = R * (1 + 0.05 * Math.sin(k * 2.1)), ca = Math.cos(a), sa = Math.sin(a);
    const mid = G.v([ca * rr * 0.6, 0.015, sa * rr * 0.6], up, k % 2 ? P.pad : mix3(P.pad, P.padLight, 0.55), 0.01, 0, 1), rim = G.v([ca * rr, 0.045, sa * rr], vnorm([-ca * 0.5, 1, -sa * 0.5]), mix3(P.pad, P.rim, 0.6), 0.01, 0.15, 1);
    if (prev) { G.tri(c, mid, prev[0]); G.quad(prev[0], mid, rim, prev[1]); }
    prev = [mid, rim];
  }
  if (o.flower) {
    const gl = o.glow || 0, off = [rng.range(-0.2, 0.2) * R, 0.05, rng.range(-0.2, 0.2) * R], s = R * 0.55;
    for (let ring = 0; ring < 3; ring++) for (let k = 0, m = 7 - ring; k < m; k++) {
      const a = (k / m) * TAU + ring * 0.5, el = 0.35 + ring * 0.42, dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], len = s * (1 - ring * 0.18);
      const pts = arc(off, dir, len, 2, [0, 1, 0], 0.7);
      strip(G, pts, [len * 0.3, len * 0.42, len * 0.04], up, { c0: P.petal, c1: P.petalTip, sway: 0.01, flutter: 0.15, glow: [gl * 0.3, gl * 0.6, gl], curl: 0.5 });
    }
    blob(G, rng, vadd(off, [0, s * 0.15, 0]), s * 0.16, { detail: 0, lump: 0.05, lo: mul3(P.heart, 0.6), mid: P.heart, hi: P.heart, leaf: 0.3, flutter: 0, sway: 0.01, glow: gl });
  }
  return G.build({ kind: 'lilyPad' });
}

const variantsOf = (o, n, make) => { if (o.variants) return o.variants; const r = o.rng.fork('variants'), out = []; for (let i = 0; i < n; i++) out.push(make(r, i)); return out; };

// makeFlowers(options): flower patches. makeScatter options plus colors: ['#e4e4da','#f0cc48','#b88af0','#f07898'] (chosen per instance: one draw call per chunk).
// Defaults: count 1200, radius 45, corridor 0, patchy density, chunks 3, fade [90, 125]. 20 triangles per clump. groundColor(x, z, y) makes the leaves match your terrain.
export function makeFlowers(o = {}) {
  const rng = needRng(o, 'makeFlowers'), cols = o.colors || FLOWER_COLORS, rel = o.groundColor ? { root: [1.25, 1.25, 1.25], tip: [2.1, 1.95, 1.5] } : { root: o.root, tip: o.tip };
  const variants = variantsOf(o, 1, (r) => flowerGeometry({ rng: r, petalMask: true, glow: o.glow, ...rel }));
  const patch = (x, z) => sat(1.6 * Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * Math.sin(z * 0.09 + Math.sin(x * 0.05) * 2) + 0.1);
  return makeScatter({ count: 1200, radius: 45, corridor: 0, clear: 0, falloff: 0.8, scale: [0.7, 1.3], tint: 0.12, hue: 0.03, sink: 0.03, tilt: 0.08, density: patch, chunks: 3,
    materialOptions: { fade: [90, 125], detail: 0, ambient: 1.2, leafAmbient: 1.2 }, ...o, colors: undefined, petalColors: o.petalColors || cols, rng, variants });
}
// makeBushes(options): shrubs. Defaults: 3 variants, count 220, radius 80, corridor 7, spacing 1.6. ~320 triangles each.
export function makeBushes(o = {}) {
  const rng = needRng(o, 'makeBushes');
  return makeScatter({ count: 220, radius: 80, corridor: 7, spacing: 1.6, scale: [0.6, 1.4], sink: 0.06, tilt: 0.08, ...o, rng, variants: variantsOf(o, 3, (r) => bushGeometry({ rng: r, flowers: o.flowers, flowerColor: o.flowerColor })) });
}
// makeFerns(options): fern rosettes. Defaults: 2 variants (detail 1), count 600, radius 50, corridor 0, chunks 3, fade [90, 125]. ~64 triangles each.
export function makeFerns(o = {}) {
  const rng = needRng(o, 'makeFerns');
  return makeScatter({ count: 600, radius: 50, corridor: 0, clear: 0, falloff: 0.8, scale: [0.7, 1.5], sink: 0.02, tilt: 0.1, chunks: 3, materialOptions: { fade: [90, 125], detail: 0 }, ...o, rng, variants: variantsOf(o, 2, (r) => fernGeometry({ rng: r, glow: o.glow, detail: o.detail })) });
}
// makeReeds(options): reed / cattail clumps; give a density or yRange that keeps them on the shoreline. Defaults: count 400, radius 70, corridor 3. ~150 triangles each.
export function makeReeds(o = {}) {
  const rng = needRng(o, 'makeReeds');
  return makeScatter({ count: 400, radius: 70, corridor: 3, clear: 0, scale: [0.7, 1.4], sink: 0.04, tilt: 0.06, ...o, rng, variants: variantsOf(o, 3, (r) => reedGeometry({ rng: r })) });
}
// makeLilyPads(options): pads floating at waterY (default 0); every third variant carries a lotus. Give density(x,z) to keep them on water.
// Defaults: count 160, radius 40, corridor 0, flowers: true, glow: 0.
export function makeLilyPads(o = {}) {
  const rng = needRng(o, 'makeLilyPads'), y = o.waterY ?? 0;
  return makeScatter({ count: 160, radius: 40, corridor: 0, clear: 0, spacing: 1.3, scale: [0.6, 1.25], sink: 0, tilt: 0, stretch: 0, lift: 0.02, tint: 0.12, ...o, heightAt: () => y, rng,
    variants: variantsOf(o, 3, (r, i) => lilyPadGeometry({ rng: r, flower: o.flowers !== false && i === 2, glow: o.glow })) });
}

// vineGeometry({ rng, spans: [[[x,y,z],[x,y,z]], ...], sag: 0.22, thickness: 0.07, leaves: 1, hangers: 1, detail,
//   leaf: '#3f7a30', leafLight: '#a0c050', leafDark: '#1f4526', stem: '#4a3c2a', flower: colour | undefined, glow: 0 })
// Hanging lianas between anchor points (world coordinates), with leaf cards and dangling leafy strands. ~220 triangles per 10 m.
export function vineGeometry(o = {}) {
  const rng = needRng(o, 'vineGeometry'), G = new Geo(), d = o.detail ?? 1;
  const P = pal(o, { leaf: '#3f7a30', leafLight: '#a0c050', leafDark: '#1f4526', stem: '#4a3c2a' }), fl = o.flower !== undefined ? C(o.flower) : null, glow = o.glow || 0;
  const spans = o.spans || [[[-7, 8, 0], [7, 9, 1]], [[-5, 9, 2], [6, 7, -3]], [[0, 10, -4], [4, 8, 5]]];
  for (const [A, B] of spans) {
    const L = vlen(vsub(B, A)), n = Math.max(4, Math.round(L / (d <= 0 ? 3 : 1.6))), sag = L * (o.sag ?? 0.22) * rng.range(0.7, 1.3), pts = [], sw = [], rad = [];
    for (let i = 0; i <= n; i++) { const t = i / n, p = vlerp(A, B, t), k = 4 * t * (1 - t); p[1] -= sag * k; p[0] += rng.range(-0.08, 0.08) * k; p[2] += rng.range(-0.08, 0.08) * k; pts.push(p); sw.push(k * sag * 0.25); rad.push((o.thickness ?? 0.07) * rng.range(0.8, 1.2)); }
    tube(G, pts, rad, { sides: 3, c0: mul3(P.stem, 0.7), c1: P.stem, sway: sw, cap: false, rng, mottle: 0.2 });
    for (let i = 1; i < n; i++) {
      if (rng() < (o.leaves ?? 1) * 0.8) blob(G, rng, vadd(pts[i], [0, -0.25, 0]), [0.55, 0.5, 0.55], { detail: 0, core: false, leaves: d <= 0 ? 2 : 4, leafSize: 1.7, leafDroop: -0.9, lo: P.leafDark, mid: P.leaf, hi: P.leafLight, sway: sw[i] + 0.03, glow: glow * 0.3, vary: 0.3 });
      if (fl && rng() < 0.3) blob(G, rng, vadd(pts[i], [0, -0.3, 0]), 0.5, { detail: 0, core: false, leaves: 2, leafSize: 1.2, lo: mul3(fl, 0.7), mid: fl, hi: fl, cell: CELL.flower, sway: sw[i] + 0.03, glow, vary: 0.1 });
      if (rng() < (o.hangers ?? 1) * 0.55) {   // a dangling strand: thin, leafy, tapering to nothing
        const len = rng.range(1.2, 4.5), us = [0, 0.5, 1], w0 = clamp(len * 0.085, 0.16, 0.34), wob = [rng.range(-0.1, 0.1) * len, rng.range(-0.1, 0.1) * len], c = shift(P.leaf, (rng() - 0.5) * 0.04, 0, rng.range(-0.2, 0.1)), ang = rng() * Math.PI;
        const hp = us.map((u) => [pts[i][0] + wob[0] * u * u, pts[i][1] - len * u, pts[i][2] + wob[1] * u * u]);
        ribbon(G, hp, [w0, w0 * 0.85, w0 * 0.1], us, [Math.cos(ang), 0, Math.sin(ang)], { uv: CELL.willow, col: (u) => mix3(mix3(P.leafDark, c, 0.5), mix3(c, P.leafLight, 0.6), u), sway: us.map((u) => sw[i] + Math.pow(u, 1.5) * len * 0.1), nrm: vnorm([Math.sin(ang) * 0.6, 0.6, -Math.cos(ang) * 0.6]), flutter: 1 });
      }
    }
  }
  return G.build({ kind: 'vine' });
}
// makeVines(options): one merged mesh of vineGeometry(options). -> { object, geometry, material, wind, update(dt, time) }
export function makeVines(o = {}) {
  needRng(o, 'makeVines');
  const wind = o.wind || o.material?.userData?.wind || makeWind(), material = o.material || windMaterial({ ...(o.map !== undefined ? { map: o.map } : {}), ...(o.materialOptions || {}), wind }), geometry = vineGeometry(o);
  const object = new THREE.Mesh(geometry, material); setShadows(object, o);
  return { object, geometry, material, wind, uniforms: material.userData.uniforms, triangles: geometry.userData.triangles, update(dt, time) { wind.update(time); } };
}

// ---------------------------------------------------------------------------------------------
// underwater
// ---------------------------------------------------------------------------------------------
// kelpGeometry({ rng, height: 9-16, detail, stalks: 2 / 2-3 / 3-4, blades: per stalk (3 / 5 / 10), width: 0.055 (frond width / height),
//   base: '#3a3212', mid: '#8a7424', tip: '#d8b850', float: '#c0a850', glow: 0 })
// Giant kelp: each stalk is one broad, slowly twisting, folded ribbon that rises from the holdfast, with side blades streaming to one
// side on the current and float bulbs where they join. Solid geometry (no cut-outs). 64 / ~210 / ~1100 triangles (32 / ~85 / ~310 per stalk).
export function kelpGeometry(o = {}) {
  const rng = needRng(o, 'kelpGeometry'), d = o.detail ?? 1, H = o.height ?? rng.range(9, 16), G = new Geo(), stalks = o.stalks ?? (d <= 0 ? 2 : d === 1 ? rng.int(2, 3) : rng.int(3, 4));
  const P = pal(o, { base: '#3a3212', mid: '#8a7424', tip: '#d8b850', float: '#c0a850' }), glow = o.glow || 0, sg = o.segs || SIDES(d, 5, 8, 14), nb = o.blades ?? SIDES(d, 3, 5, 10), bs = d >= 1 ? 3 : 2;
  const cur = rng() * TAU;                                              // the side every blade of this plant streams toward
  for (let k = 0; k < stalks; k++) {
    const h = H * (k === 0 ? 1 : rng.range(0.5, 0.9)), a = rng() * TAU, lean = rng.range(0.03, 0.13), ph = rng() * TAU, dh = (rng() - 0.5) * 0.06, dl = rng.range(-0.25, 0.15), wob = h * rng.range(0.012, 0.03);
    const cb = shift(P.base, dh, 0, dl), cm = shift(P.mid, dh, 0, dl), ct = shift(P.tip, dh, 0, dl), col = (t) => (t < 0.5 ? mix3(cb, cm, t * 2) : mix3(cm, ct, t * 2 - 1));
    const at = (t) => [Math.cos(a) * (0.2 + lean * h * t) + Math.sin(t * 7 + ph) * wob * t, h * t, Math.sin(a) * (0.2 + lean * h * t) + Math.cos(t * 5.5 + ph) * wob * t], swAt = (t) => Math.pow(t, 1.4) * h * 0.11;
    const W = h * (o.width ?? 0.055) * rng.range(0.8, 1.2), pts = [], ws = [], sw = [], gl = [];
    for (let i = 0; i <= sg; i++) { const t = i / sg; pts.push(at(t)); ws.push(W * (0.1 + 0.9 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7))); sw.push(swAt(t)); gl.push(glow * t * 0.6); }
    strip(G, pts, ws, [Math.cos(a + 1.3), 0, Math.sin(a + 1.3)], { col: (t) => mul3(col(t), 0.86 + 0.14 * Math.sin(t * 23 + ph)), sway: sw, flutter: 0.9, flutterTip: true,
      twist: rng.range(2, 5) * (rng() < 0.5 ? -1 : 1), fold: 0.2, midrib: 0.6, curl: 0.5, glow: gl });
    for (let b = 0; b < nb; b++) {
      const t = lerp(0.12, 0.95, (b + rng() * 0.8) / nb), p = at(t), s0 = swAt(t), az = cur + rng.range(-0.9, 0.9), el = rng.range(-0.15, 0.45), dir = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      const len = h * rng.range(0.1, 0.17), w = len * rng.range(0.2, 0.28), fr = len * 0.04;
      const p0 = vmad(p, dir, fr * 2), bp = arc(p0, dir, len, bs, [0, 1, 0], rng.range(0.1, 0.5), rng, 0.2), bw = bs === 3 ? [w * 0.3, w, w * 0.75, w * 0.06] : [w * 0.35, w, w * 0.07], bsw = [], bgl = [];
      for (let j = 0; j <= bs; j++) { const u = j / bs; bsw.push(s0 + u * u * len * 0.35); bgl.push(glow * (t * 0.4 + 0.6 * u)); }
      const c0 = mul3(col(t * 0.8), 0.7), c1 = mix3(col(Math.min(1, t + 0.25)), ct, 0.4);
      strip(G, bp, bw, [-Math.sin(az), 0.2, Math.cos(az)], { col: (u) => mix3(c0, c1, Math.sqrt(u)), sway: bsw, flutter: 1.5, flutterTip: true, twist: rng.range(-1.5, 1.5), curl: 0.45, glow: bgl });
      // float bulb where the blade joins the frond
      if (d >= 2 || (d === 1 && b % 2 === 0)) tube(G, d >= 2 ? [p, vmad(p, dir, fr * 1.1), vmad(p, dir, fr * 2.2)] : [p, vmad(p, dir, fr * 2)], d >= 2 ? [fr * 0.35, fr, fr * 0.4] : [fr * 0.9, fr * 0.7], { sides: d >= 2 ? 4 : 3, c0: mul3(P.float, 0.7), c1: P.float, sway: s0, leaf: 0.5, glow: glow * 0.5, capLen: 1 });
    }
  }
  return G.build({ kind: 'kelp' });
}

// coralGeometry({ rng, kind: 'branching' | 'brain' | 'fan' | 'tube' | 'table' | 'finger' | 'mound', size: 1.2-2.2, color: '#f2a08a', tip: '#fff0d8', shade: '#7a3a4a', glow: 0.25, detail })
// Pale by default so makeCorals can tint instances. Triangles by kind at detail 0 / 1 / 2:
// branching 350/760/1010, brain 80/320/1280, fan 16/56/56 (alpha-cut lattice), tube 190/240/240, table 105/275/385, finger 100/175/175, mound 20/80/80.
export function coralGeometry(o = {}) {
  const rng = needRng(o, 'coralGeometry'), kind = o.kind || 'branching', R = o.size ?? rng.range(1.2, 2.2), G = new Geo(), d = o.detail ?? 1;
  const P = pal(o, { color: '#f2a08a', tip: '#fff0d8', shade: '#7a3a4a' }), glow = o.glow ?? 0.25;
  if (kind === 'branching') {
    const S = {
      height: R, flex: 0.05, trunkLen: R * 0.4, trunkR: R * 0.09, flare: 0.5, mottle: 0.08,
      barkCol: (t, k, s, depth) => mix3(mix3(P.shade, P.color, 0.35 + 0.3 * depth), P.tip, depth >= 2 ? t * 0.7 : 0),
      levels: [
        { segs: 2, sides: 5, wander: 0.3, up: 0.3, taper: 0.8, children: [3, 4], childAt: [0.5, 1], angle: [0.4, 0.9], lenK: [0.8, 1.1], radK: 0.7, tipLeaf: true },
        { segs: 2, sides: 4, wander: 0.5, up: 0.5, taper: 0.75, children: d <= 0 ? [1, 2] : d === 1 ? [2, 2] : [2, 3], childAt: [0.5, 1], angle: [0.4, 0.9], lenK: [0.6, 0.9], radK: 0.75, tipLeaf: true },
        { segs: 2, sides: 4, wander: 0.5, up: 0.5, taper: 0.7, children: d <= 0 ? [0, 1] : d === 1 ? [1, 1] : [1, 2], childAt: [0.5, 1], angle: [0.4, 0.8], lenK: [0.6, 0.85], radK: 0.8, tipLeaf: true },
        { segs: 1, sides: 3, wander: 0.4, up: 0.4, taper: 0.7 },
      ],
    };
    if (d <= 0) S.levels.splice(2, 1);
    for (const t of skeleton(G, rng, S)) blob(G, rng, t.p, t.r * 1.5, { detail: 0, lump: 0.1, lo: P.color, mid: P.tip, hi: P.tip, leaf: 0.3, flutter: 0, glow, vary: 0.1, flatBottom: 1 });
    fitHeight(G, R);
  } else if (kind === 'brain') {
    // meandering ridges: warped stripes displace the dome and darken its grooves
    const ico = ICO[d <= 0 ? 1 : d === 1 ? 2 : 3], kf = d <= 0 ? 4.2 : d === 1 ? 6.5 : 10.5, base = G.count, ax = coneDir(rng, [0, 1, 0], Math.PI), w = [];
    for (let k = 0; k < 3; k++) w.push([rng.range(-1, 1) * 2.6, rng.range(-1, 1) * 2.6, rng.range(-1, 1) * 2.6, rng() * TAU]);
    for (const v of ico.v) {
      let f = 0; for (const q of w) f += Math.sin(v[0] * q[0] + v[1] * q[1] + v[2] * q[2] + q[3]);
      const ridge = sstep(-0.55, 0.45, Math.sin(kf * vdot(v, ax) + f * 1.7)), s = R * 0.5 * (0.85 + 0.15 * ridge), y = Math.max(-0.25, v[1]) * 0.72;
      G.v([v[0] * s, (y + 0.25) * s, v[2] * s], vnorm([v[0], v[1] + 0.2, v[2]]), mix3(mul3(P.shade, 0.4), mix3(P.color, P.tip, ridge * 0.45), ridge), 0, 0, 0.2, glow * ridge * 0.5);
    }
    for (const f of ico.f) G.tri(base + f[0], base + f[1], base + f[2]);
  } else if (kind === 'fan') {
    // sea fan: bowed sheets carrying the alpha-cut lattice from the atlas (veins, cross-links, ragged rim)
    const a0 = rng() * TAU, cell = CELL.fan, cols = d <= 0 ? 2 : 4, rows = d <= 0 ? 2 : 3;
    tube(G, [[0, 0, 0], [0, R * 0.16, 0]], [R * 0.05, R * 0.03], { sides: 4, c0: P.shade, c1: P.color, cap: false });
    for (let s = 0, m = d <= 0 ? 1 : 2; s < m; s++) {
      const a = a0 + s * rng.range(0.5, 1.2) * rng.sign(), ex = [Math.cos(a), 0, Math.sin(a)], nr = [-ex[2], 0.15, ex[0]], sc = s ? rng.range(0.55, 0.8) : 1, W = R * 1.12 * sc, Hh = R * 1.0 * sc;
      const bowX = rng.range(0.1, 0.24) * W * rng.sign(), bowY = rng.range(-0.12, 0.14) * Hh, off = s ? rng.range(-0.12, 0.12) * R : 0, grid = [];
      for (let i = 0; i <= rows; i++) for (let k = 0; k <= cols; k++) {
        const u = k / cols, v = i / rows, cu = (u - 0.5) * 2, bow = bowX * cu * cu + bowY * v * v + off, rr = Math.hypot(cu, v);
        grid.push(G.v([ex[0] * cu * W * 0.5 + nr[0] * bow, R * 0.04 + v * Hh, ex[2] * cu * W * 0.5 + nr[2] * bow], vnorm([nr[0] - ex[0] * cu * 0.5, 0.25, nr[2] - ex[2] * cu * 0.5]),
          mix3(mix3(P.shade, P.color, sat(rr * 1.7)), P.tip, sat(rr - 0.55) * 1.3), v * v * R * 0.07, 0.6 * v, 1, glow * rr, lerp(cell[0], cell[2], u), lerp(cell[3], cell[1], v)));
      }
      for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) { const p = i * (cols + 1) + k; G.quad(grid[p], grid[p + 1], grid[p + cols + 2], grid[p + cols + 1]); }
    }
  } else if (kind === 'tube') {
    for (let k = 0, m = d <= 0 ? 4 : rng.int(5, 8); k < m; k++) {
      const a = rng() * TAU, r0 = k === 0 ? 0 : R * rng.range(0.1, 0.3), h = R * rng.range(0.5, 1.1), rr = R * rng.range(0.07, 0.12), b = [Math.cos(a) * r0, 0, Math.sin(a) * r0], lean = [Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25];
      const bend = [Math.cos(a + 1.3) * h * 0.08, 0, Math.sin(a + 1.3) * h * 0.08];
      const pts = [b, vadd(vmad(b, lean, h * 0.4), bend), vadd(vmad(b, lean, h * 0.8), bend), vmad(b, lean, h), vmad(b, lean, h * 0.78)], rad = [rr * 0.55, rr * 0.9, rr * 0.95, rr * 1.35, rr * 0.55];
      tube(G, pts, rad, { sides: 6, cap: false, col: (t, k) => (t < 0.7 ? mul3(mix3(P.shade, P.color, 0.15 + t * 1.2), k % 2 ? 0.72 : 1) : t < 0.92 ? P.tip : mul3(P.shade, 0.4)), glow: [0, 0, glow * 0.5, glow * 2, glow * 0.5], sway: [0, 0.01, 0.02, 0.03, 0.02], leaf: 0.3 });
    }
  } else if (kind === 'finger') {
    // filler: a huddle of stubby rounded fingers
    for (let k = 0, m = d <= 0 ? 5 : rng.int(7, 10); k < m; k++) {
      const a = k * 2.39996 + rng.range(-0.3, 0.3), r0 = R * 0.34 * Math.sqrt(k / m), h = R * rng.range(0.3, 0.62) * (1 - 0.35 * k / m), rr = R * rng.range(0.055, 0.085), b = [Math.cos(a) * r0, 0, Math.sin(a) * r0], dir = vnorm([Math.cos(a) * 0.35 * (k ? 1 : 0), 1, Math.sin(a) * 0.35 * (k ? 1 : 0)]);
      tube(G, [b, vmad(b, dir, h * 0.55), vmad(b, dir, h)], [rr * 1.15, rr, rr * 0.8], { sides: d <= 0 ? 4 : 5, c0: mix3(P.shade, P.color, 0.3), c1: mix3(P.color, P.tip, 0.6), glow: [0, glow * 0.2, glow], leaf: 0.3, capLen: 0.9 });
    }
  } else if (kind === 'mound') {
    // filler: a low encrusting cushion speckled with pale polyps
    const ico = ICO[d <= 0 ? 0 : 1], base = G.count, ph = [rng() * TAU, rng() * TAU, rng() * TAU];
    for (const v of ico.v) {
      const l = 1 + 0.16 * Math.sin(v[0] * 3.1 + ph[0]) * Math.sin(v[2] * 2.7 + ph[1]) + 0.08 * Math.sin(v[1] * 5 + ph[2]), sp = rng() < 0.3 ? 1 : 0;
      G.v([v[0] * R * 0.5 * l, Math.max(-0.1, v[1]) * R * 0.26 * l + R * 0.02, v[2] * R * 0.5 * l], vnorm([v[0], v[1] + 0.5, v[2]]), mix3(mix3(P.shade, P.color, sat(0.55 + 0.5 * v[1])), P.tip, sp * 0.8), 0, 0, 0.2, glow * sp * 0.8);
    }
    for (const f of ico.f) G.tri(base + f[0], base + f[1], base + f[2]);
  } else {
    // table coral: stalk carrying one or two plates with a lumpy rim, dished top and ribbed underside
    const sides = SIDES(d, 9, 14, 20), tiers = d <= 0 ? 1 : 2;
    tube(G, [[0, 0, 0], [0, R * 0.3, 0], [0, R * 0.52, 0]], [R * 0.11, R * 0.07, R * 0.12], { sides: 6, c0: P.shade, c1: mix3(P.shade, P.color, 0.5), cap: false });
    for (let k = 0; k < tiers; k++) {
      const rr = R * (0.66 - 0.22 * k), y0 = R * (0.52 + 0.26 * k), cx = rng.range(-0.14, 0.14) * R * k, cz = rng.range(-0.14, 0.14) * R * k, p1 = rng() * TAU, p2 = rng() * TAU, th = R * 0.045;
      const rim = (a) => rr * (1 + 0.11 * Math.sin(a * 3 + p1) + 0.07 * Math.sin(a * 5 + p2) + 0.035 * Math.sin(a * 11 + p1));
      const c = G.v([cx, y0 - R * 0.035, cz], [0, 1, 0], mix3(P.shade, P.color, 0.7), 0, 0, 0.2, 0), rings = [[], [], [], [], []];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a), r = rim(a), rib = s % 2, sp = rng.range(0.9, 1.1);
        rings[0].push(G.v([cx + ca * r * 0.55, y0 - R * 0.02, cz + sa * r * 0.55], vnorm([-ca * 0.15, 1, -sa * 0.15]), mul3(P.color, sp), 0, 0, 0.2, glow * 0.15));
        rings[1].push(G.v([cx + ca * r, y0 + th * 0.5, cz + sa * r], vnorm([ca * 0.5, 1, sa * 0.5]), mul3(mix3(P.color, P.tip, 0.75), sp), 0, 0, 0.3, glow * 0.6));
        rings[2].push(G.v([cx + ca * r * 0.96, y0 - th, cz + sa * r * 0.96], vnorm([ca, -0.7, sa]), mix3(P.shade, P.color, 0.45), 0, 0, 0.2, glow * 0.1));
        rings[3].push(G.v([cx + ca * r * (rib ? 0.5 : 0.44), y0 - th - R * (rib ? 0.075 : 0.045), cz + sa * r * (rib ? 0.5 : 0.44)], vnorm([ca * 0.3, -1, sa * 0.3]), mul3(P.shade, rib ? 0.95 : 0.5), 0, 0, 0.2, 0));
        rings[4].push(G.v([cx * 0.5 + ca * R * 0.1, y0 - R * 0.2, cz * 0.5 + sa * R * 0.1], vnorm([ca, -0.5, sa]), mul3(P.shade, 0.6), 0, 0, 0.2, 0));
      }
      for (let s = 0; s < sides; s++) {
        const s1 = (s + 1) % sides; G.tri(c, rings[0][s1], rings[0][s]);
        for (let q = 0; q < 4; q++) G.quad(rings[q][s], rings[q][s1], rings[q + 1][s1], rings[q + 1][s]);
      }
    }
  }
  return G.build({ kind: 'coral-' + kind });
}

// anemoneGeometry({ rng, size: 0.6-1.1, tentacles: 22, body: '#8a3a5a', tentacle: '#ff8ab0', tip: '#fff0c8', glow: 0.5 })
// Stout column crowned with waving, glow-tipped tentacles. ~390 triangles.
export function anemoneGeometry(o = {}) {
  const rng = needRng(o, 'anemoneGeometry'), R = o.size ?? rng.range(0.6, 1.1), G = new Geo(), n = o.tentacles ?? 22;
  const P = pal(o, { body: '#8a3a5a', tentacle: '#ff8ab0', tip: '#fff0c8' }), glow = o.glow ?? 0.5;
  tube(G, [[0, 0, 0], [0, R * 0.25, 0], [0, R * 0.5, 0], [0, R * 0.56, 0]], [R * 0.42, R * 0.34, R * 0.4, R * 0.2], { sides: 8, c0: mul3(P.body, 0.6), c1: P.body, capLen: 0.1 });
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n, a = k * 2.39996, rr = R * 0.38 * Math.sqrt(u), el = lerp(1.35, 0.35, u) + rng.range(-0.15, 0.15), len = R * rng.range(0.7, 1.15) * (0.7 + 0.3 * u);
    const dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], pts = arc([Math.cos(a) * rr, R * 0.52, Math.sin(a) * rr], dir, len, 2, [Math.cos(a) * 0.5, -0.6, Math.sin(a) * 0.5], 0.9, rng, 0.08);
    const c = shift(P.tentacle, (rng() - 0.5) * 0.03, 0, rng.range(-0.15, 0.1));
    tube(G, pts, [R * 0.042, R * 0.03, R * 0.024], { sides: 3, c0: c, c1: P.tip, sway: [0, len * 0.08, len * 0.24], flutter: 0.5, glow: [0, glow * 0.15, glow], leaf: 0.6, capLen: 1 });
  }
  return G.build({ kind: 'anemone' });
}

const current = (o) => o.wind || o.material?.userData?.wind || makeWind({ speed: 0.4, strength: 1.4, gustScale: 0.03, gustiness: 0.4 });
const SEA_MAT = { backlight: 0.9, backlightTint: '#fff2a0', detail: 0.15, caustics: 0.5 };
// makeKelp(options): kelp forest. makeScatter options; defaults count 180, radius 60, corridor 5, spacing 1.5, slow "current" wind, caustics.
//   surface: y of the water surface (optional): plants are scaled down so none reaches above it
// 2 variants at `detail` (1, ~210 triangles each); with a path, 2 detail-0 variants (64) are used beyond farDistance (22 m).
export function makeKelp(o = {}) {
  const rng = needRng(o, 'makeKelp'), wind = current(o), detail = o.detail ?? 1;
  const variants = variantsOf(o, 2, (r) => kelpGeometry({ rng: r, glow: o.glow, detail })), fv = o.farVariants || (!o.variants && o.path && detail > 0 ? [0, 1].map(() => kelpGeometry({ rng: rng.fork('far'), glow: o.glow, detail: 0 })) : undefined);
  const opts = { count: 180, radius: 60, corridor: 5, clear: 0, spacing: 1.5, scale: [0.6, 1.4], sink: 0, tilt: 0.05, farDistance: 22, materialOptions: SEA_MAT, ...o, wind, rng, variants, farVariants: fv };
  if (o.surface !== undefined && !o.points) {   // no frond taller than the water above its holdfast
    let top = 1; for (const g of variants.concat(fv || [])) top = Math.max(top, g.userData.height || 1);
    opts.points = scatterPoints({ ...opts, rng: rng.fork('pts') }).filter((p) => { p.s = Math.min(p.s, (o.surface - p.y) * 0.86 / top); return p.s > 0.12; });
  }
  return makeScatter(opts);
}
// makeSeagrass(options): makeGrass tuned for the sea bed (tall teal blades, slow current, no flowers, caustics).
export function makeSeagrass(o = {}) {
  needRng(o, 'makeSeagrass');
  return makeGrass({ root: '#1c5a48', tip: '#7fd89a', dry: '#b8c86a', height: [1.1, 2.2], width: [1.0, 1.7], flowers: 0, count: 7000, radius: 36, bias: 1.8, materialOptions: { caustics: 0.5 }, ...o, wind: current(o) });
}
// makeCorals(options): a reef of touching colonies. makeScatter options (count = total colonies), plus
//   kinds: ['branching','brain','fan','tube','table','finger','mound'] (one variant = one draw call each), detail: 0 (~125 triangles on average; 1: ~270,
//          and with a path the detail-0 set is used beyond farDistance: 16 m)
//   cluster: { size: [5, 12] colonies per group, radius: 2.6 m } (default on; false scatters colonies singly), colors: 6 reef tints per instance, glow
// Defaults: count 260, radius 55, corridor 4, scale [0.5, 1.6].
export function makeCorals(o = {}) {
  const rng = needRng(o, 'makeCorals'), kinds = o.kinds || ['branching', 'brain', 'fan', 'tube', 'table', 'finger', 'mound'];
  const mk = (detail) => variantsOf({ rng: o.rng }, kinds.length, (r, i) => coralGeometry({ rng: r, kind: kinds[i], detail, color: '#e8d8d0', tip: '#ffffff', shade: '#8a7a80', glow: o.glow }));
  const variants = o.variants || mk(o.detail ?? 0), farVariants = o.farVariants || (!o.variants && o.path && (o.detail ?? 0) > 0 ? mk(0) : undefined);   // same kinds, detail 0, away from the camera path
  const opts = { count: 260, radius: 55, corridor: 4, clearK: 0.5, spacing: 1.2, scale: [0.5, 1.6], sink: 0.04, tilt: 0.15, tint: 0.15, hue: 0, colors: ['#ff8a6a', '#ffc45a', '#f070c8', '#7adcc8', '#c8e870', '#b08aff'],
    materialOptions: { backlight: 0.6, glow: 1, caustics: 0.5 }, farDistance: 16, ...o, wind: current(o), rng, variants, farVariants };
  if (o.cluster !== false && !o.points) {
    const cl = { size: [5, 12], radius: 2.6, ...(typeof o.cluster === 'object' ? o.cluster : {}) }, mean = (cl.size[0] + cl.size[1]) / 2, sc = opts.scale, heightAt = opts.heightAt || (() => 0), cr = rng.fork('cluster');
    const seeds = scatterPoints({ ...opts, rng: rng.fork('seeds'), count: Math.max(1, Math.round(opts.count / mean)), spacing: cl.radius * 1.3, scale: [1, 1], clear: 0 });
    const filler = kinds.map((k, i) => (k === 'finger' || k === 'mound' ? i : -1)).filter((i) => i >= 0), big = kinds.map((k, i) => i).filter((i) => !filler.includes(i)), pts = [];
    for (const s of seeds) {
      for (let k = 0, n = cr.int(cl.size[0], cl.size[1]); k < n && pts.length < opts.count; k++) {
        // sunflower packing: a big centrepiece, then smaller colonies and fillers crowding outward until they touch
        const f = k / n, r = cl.radius * Math.sqrt(f) * cr.range(0.85, 1.15), a = s.rot + k * 2.39996 + cr.range(-0.3, 0.3), x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r, y = heightAt(x, z);
        if (opts.yRange && (y < opts.yRange[0] || y > opts.yRange[1])) continue;
        if (opts.path && opts.corridor > 0 && r > 0.5 && opts.path.nearestXZ(x, z).dist < opts.corridor) continue;
        const useBig = big.length && (k === 0 || !filler.length || cr() < 0.62 - 0.35 * f);
        pts.push({ x, y, z, s: lerp(sc[1], sc[0], Math.pow(f, 0.55)) * cr.range(0.8, 1.15) * (useBig ? 1 : 0.8), rot: cr() * TAU, d: s.d, u: s.u, v: useBig ? cr.pick(big) : cr.pick(filler) });
      }
    }
    opts.points = pts;
  }
  return makeScatter(opts);
}
// makeAnemones(options): defaults count 120, radius 40, corridor 3, colors ['#ff8ab0','#ffb070','#a0f0d0','#c8a0ff'].
export function makeAnemones(o = {}) {
  const rng = needRng(o, 'makeAnemones');
  return makeScatter({ count: 120, radius: 40, corridor: 3, clear: 0, spacing: 1.0, scale: [0.6, 1.5], sink: 0.03, tilt: 0.15, tint: 0.12, hue: 0, colors: ['#ff8ab0', '#ffb070', '#a0f0d0', '#c8a0ff'], materialOptions: { caustics: 0.5 },
    ...o, wind: current(o), rng, variants: variantsOf(o, 2, (r) => anemoneGeometry({ rng: r, tentacles: o.tentacles ?? 16, body: '#a89098', tentacle: '#f0e0e4', tip: '#ffffff', glow: o.glow })) });
}
