// railway-under-the-sea: THE MARSH ISLANDS (film worlds D; part 7d of the design). The real Halligen of the North
// Frisian tidal flats: very low salt-marsh islands whose houses stand together on round dwelling mounds.
//   THE NEAR ISLAND west of the line (HALLIG in the law file): a shore of dark fitted stone that goes down through
//   the water to the bed, a pale shell fringe along its top, a flat marsh in drifts of olive, sea-green, pale and
//   mauve, three small creeks, and its dwelling mound with five long low thatched houses round a pond, wind-leaned
//   trees and a pole fence; a second, smaller mound with three houses further west.
//   A SECOND ISLAND far west with two mounds; THREE FAR ISLANDS as low dark strips with mound and roof outlines, one
//   with a banded lighthouse between two low houses. Its lamp is STEADY: nothing here turns, blinks or moves.
//   THE WAY OVER THE MARSH (the lens crosses the near island's south-east corner and flies low over its turf below
//   the mound): a landing of stone steps with two mooring posts where it first crosses the shore, a worn footpath from
//   the landing round the head of the first creek and up the mound to a white garden gate, and a close sward of small
//   tufts with sea lavender and thrift in flower and glasswort on the creeks' mud. No boat, no figure, no animal.
// Everything is placed from the law file (beside(z, off): metres square to the line, west negative). No figure,
// nothing lettered. Placings typed for the way (true on every seed): the eastern house of the big mound turns its
// door gable to the line; the gate looks at the way; the tufts and flowers crowd along the law file's ROUTE; far
// windows are drawn as points on the walls that face the line.
// Returns { object, setNight(n), dispose() }. setNight changes two numbers only (the windows' emissive strength and
// the far points' opacity). 11 draw calls: ground, stone shore, thatch, walls, pond, trees, chimney smoke, far
// lights (points), sward, sea lavender, thrift. The part has no clock: a windless hour, so trees, tufts and the
// smoke stand still. ctx.vary.density sets how many mounds and houses the far islands carry; ctx.quality.detail
// (never above 1 here) the count of tufts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as flora from '../kit/flora.js';
import { HALLIG, ROUTE, beside, lineX, lineSlope } from './railway-under-the-sea-line.js';

const TAU = Math.PI * 2;
const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// the palette (sRGB as written, linear in the vertex colours)
const P = {
  olive: lin('#737a42'), seaGreen: lin('#5d7f60'), pale: lin('#aaa67a'), mauve: lin('#8e7590'), mud: lin('#6f6554'), mudWet: lin('#857e72'),
  shell: lin('#d8cfb6'), sand: lin('#b9ad90'), stone: lin('#686a6c'), stoneWet: lin('#3d4245'), algae: lin('#465039'), lichen: lin('#8a8468'),
  lawn: lin('#6f8a3a'), lawn2: lin('#84963f'), yard: lin('#93895c'),
  thatch: lin('#96866c'), thatchPale: lin('#b0a184'), thatchDark: lin('#6e6452'), moss: lin('#727752'), ridge: lin('#cfc4a4'),
  white: lin('#ffffff'), lime: lin('#f1ede2'), timber: lin('#d6d0c4'), tar: lin('#2a2a2c'), brick: lin('#8d5a49'),
  farRoof: lin('#4a4338'), farWall: lin('#8c8578'), farLand: lin('#3f4a34'), farStone: lin('#34373a'), farTree: lin('#2c3a2a'),
  red: lin('#a23a2c'), band: lin('#e6e1d4'), iron: lin('#2a2e33'),
  step: lin('#c9c5b8'), oak: lin('#c2b6a4'), path: lin('#b9aa8a'), glassRed: lin('#9a4f48'), glassGreen: lin('#74904c'),
};

// ---- a small geometry accumulator: positions, vertex colours, one uv set; smooth normals per marked shape
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.m = null; }
  at(yaw, x, y, z) { this.m = yaw === null ? null : { c: Math.cos(yaw), s: Math.sin(yaw), x, y, z }; return this; }
  v(x, y, z, col, u = 0, w = 0) {
    const m = this.m;
    if (m) { const X = m.c * x + m.s * z + m.x; z = -m.s * x + m.c * z + m.z; x = X; y += m.y; }
    this.p.push(x, y, z); this.n.push(0, 0, 0); this.c.push(col[0], col[1], col[2]); this.u.push(u, w);
    return this.p.length / 3 - 1;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  mark() { return [this.p.length / 3, this.i.length]; }
  shade(k) {   // normals of all that was added since mark(): face normals summed at the shared corners
    const p = this.p, n = this.n, ix = this.i;
    for (let t = k[1]; t < ix.length; t += 3) {
      const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    }
    for (let v = k[0] * 3; v < n.length; v += 3) { const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1; n[v] /= l; n[v + 1] /= l; n[v + 2] /= l; }
  }
  weld(a, b) {   // two corners at one place (a uv seam) share one normal
    const n = this.n, x = n[a * 3] + n[b * 3], y = n[a * 3 + 1] + n[b * 3 + 1], z = n[a * 3 + 2] + n[b * 3 + 2], l = Math.hypot(x, y, z) || 1;
    n[a * 3] = n[b * 3] = x / l; n[a * 3 + 1] = n[b * 3 + 1] = y / l; n[a * 3 + 2] = n[b * 3 + 2] = z / l;
  }
  poly(pts, col, uvs) {   // one flat face with its own corners (a fan); col: one colour or one per corner; uvs: one [u, v] or one per corner
    const k = this.mark(), per = Array.isArray(col[0]), many = uvs && Array.isArray(uvs[0]), ids = [];
    for (let j = 0; j < pts.length; j++) { const q = pts[j], t = many ? uvs[j] : uvs || WHITE_UV; ids.push(this.v(q[0], q[1], q[2], per ? col[j] : col, t[0], t[1])); }
    for (let j = 1; j < ids.length - 1; j++) this.tri(ids[0], ids[j], ids[j + 1]);
    this.shade(k);
  }
  box(x0, x1, y0, y1, z0, z1, col, uv, top = true) {   // four sides (uv: [u0, v0, u1, v1] on each) and a top
    const q = uv ? [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]] : null;
    this.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], col, q); this.poly([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], col, q);
    this.poly([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], col, q); this.poly([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], col, q);
    if (top) this.poly([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], col, q ? q[0] : null);
  }
  get triangles() { return this.i.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  }
}

// ---- the wall atlas (512 x 512; v from the bottom): row 0 cells [window | lit window | door | white and timber],
// row 1 red clay pantiles, row 2 dark brick, row 3 whitewash over a tarred plinth. Rows 1 to 3 repeat along u.
const WHITE_UV = [0.8125, 0.125], TIMBER_UV = [0.9, 0.03, 0.96, 0.22], CELL = 0.25, INSET = 0.006;
const winUV = (lit) => { const u0 = (lit ? 1 : 0) * CELL; return [[u0 + INSET, INSET], [u0 + CELL - INSET, INSET], [u0 + CELL - INSET, CELL - INSET], [u0 + INSET, CELL - INSET]]; };
const DOOR_UV = [[2 * CELL + INSET, INSET], [3 * CELL - INSET, INSET], [3 * CELL - INSET, CELL - INSET], [2 * CELL + INSET, CELL - INSET]];
const GLASS_LIT_UV = [0.25 + 20 / 512, 26 / 512];                  // inside one lit pane (the lighthouse lantern's glass)
const rowV = (row, t) => (row + sat(t) * 0.97 + 0.015) * 0.25;     // v of height share t inside a row

// smooth value noise on a 64 x 64 lattice of seeded values, periodic with (px, py) so that a texture tiles
function tileNoise(rng) {
  const N = 64, t = new Float32Array(N * N); for (let i = 0; i < t.length; i++) t[i] = rng();
  return (x, y, px, py) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = t[y0 * N + x0], b = t[y0 * N + x1], c = t[y1 * N + x0], d = t[y1 * N + x1];
    return a + (b - a) * sx + (c - a + (a - b - c + d) * sx) * sy;
  };
}
function dataTex(px, w, h, o = {}) {
  const t = new THREE.DataTexture(px, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; t.wrapT = o.clampT || o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = o.aniso || 1; t.needsUpdate = true;
  return t;
}
// fitted stones: a jittered cell pattern with dark joints (grey; the vertex colour tints it; it is its own bump map)
function stonePixels(rng) {
  const W = 256, C = 6, px = new Uint8Array(W * W * 4), n = tileNoise(rng), jx = [], jy = [], tone = [], warm = [];
  for (let i = 0; i < C * C; i++) { jx.push(0.5 + (rng() - 0.5) * 0.6); jy.push(0.5 + (rng() - 0.5) * 0.6); tone.push(0.6 + 0.4 * rng()); warm.push(rng()); }
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const gx = x / W * C, gy = y / W * C, cx = Math.floor(gx), cy = Math.floor(gy);
    let d1 = 9, d2 = 9, id = 0;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      const k = ((cy + b + C) % C) * C + (cx + a + C) % C, dx = cx + a + jx[k] - gx, dy = cy + b + jy[k] - gy, d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; id = k; } else if (d < d2) d2 = d;
    }
    const e = Math.sqrt(d2) - Math.sqrt(d1), g = (0.16 + 0.84 * sstep(0.015, 0.12, e)) * tone[id] * (0.84 + 0.16 * sstep(0, 0.45, e)) * (0.84 + 0.32 * n(x / 4, y / 4, 64, 64));
    const o = (y * W + x) * 4, wv = warm[id] - 0.5;
    px[o] = 255 * sat(g * (1 + 0.1 * wv)); px[o + 1] = 255 * sat(g); px[o + 2] = 255 * sat(g * (1 - 0.1 * wv)); px[o + 3] = 255;
  }
  return px;
}
// salt-marsh turf seen from above: short blades in rosettes over dark soil (grey with a little colour play). One tile
// lies over TURF_TILE metres (a texel is about 6 mm), so the sward is crisp from 5 m; far off the mip levels leave
// only its mean and the ground is calm. px.mean is that mean (linear): the material's colour makes up for it.
const TURF_TILE = 3;
// (a generator: it hands back between slices of its work so that no build step is long; the caller pauses at each)
function* marshPixels(rng) {
  const W = 512, N = W * W, f = new Float32Array(N), hue = new Float32Array(N), px = new Uint8Array(N * 4), n = tileNoise(rng);
  for (let y = 0; y < W; y++) {                                                  // soil and shade between the blades
    for (let x = 0; x < W; x++) f[y * W + x] = 0.3 + 0.2 * n(x / 8, y / 8, 64, 64) + 0.05 * rng();
    if (y % 96 === 95) yield;
  }
  for (let r = 0; r < 1500; r++) {
    if (r % 375 === 374) yield;                                               // rosettes of blades, combed a little one way
    const cx = rng() * W, cy = rng() * W, nb = 8 + Math.floor(rng() * 9), tone = 0.72 + 0.28 * rng(), hr = rng() * 2 - 1;
    for (let b = 0; b < nb; b++) {
      const a = rng() * TAU, L = 7 + rng() * 17, bend = (rng() - 0.5) * 0.5, tb = Math.min(1, tone * (0.85 + 0.3 * rng()) * (rng() < 0.07 ? 1.3 : 1)), dx = Math.cos(a), dy = Math.sin(a);
      for (let s = 0; s < L; s += 0.6) {
        const t = s / L, X = cx + dx * s - dy * bend * s * t + 0.3 * s, Y = cy + dy * s + dx * bend * s * t + 0.12 * s, v = tb * (0.5 + 0.5 * t);
        const xi = ((Math.round(X) % W) + W) % W, yi = ((Math.round(Y) % W) + W) % W, i = yi * W + xi;
        if (v > f[i]) { f[i] = v; hue[i] = hr; }
        if (t < 0.55) { const j = yi * W + (xi + 1) % W; if (v * 0.9 > f[j]) { f[j] = v * 0.9; hue[j] = hr; } }
      }
    }
  }
  yield;
  let m = 0;
  for (let i = 0; i < N; i++) { const g = sat(f[i]), o = i * 4; m += Math.pow(g, 2.2); px[o] = 255 * sat(g * (1 + 0.07 * hue[i])); px[o + 1] = 255 * g; px[o + 2] = 255 * sat(g * (1 - 0.1 * hue[i])); px[o + 3] = 255; }
  px.mean = m / N;
  return px;
}
// reed thatch: fibres running down the slope (v), laid in courses with a shadow under each butt line
function thatchPixels(rng) {
  const W = 256, px = new Uint8Array(W * W * 4), n = tileNoise(rng);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / W, fib = 0.5 * n(u * 64, v * 3, 64, 3) + 0.3 * n(u * 32, v * 6, 32, 6) + 0.2 * n(u * 16, v * 2, 16, 2);
    const t = (v * 4 + 0.35 * n(u * 16, 0.5, 16, 1)) % 1, g = sat((0.56 + 0.4 * fib + (rng() - 0.5) * 0.12) * (1 - 0.34 * sstep(0.18, 0, t))), o = (y * W + x) * 4;
    px[o] = 255 * g; px[o + 1] = 255 * g * 0.97; px[o + 2] = 255 * g * 0.9; px[o + 3] = 255;
  }
  return px;
}
// a small-paned window in a 128 px cell: 1 on the glass, 0 on the frame and the glazing bars
function paneAt(lx, ly) {
  if (lx < 10 || lx > 117 || ly < 10 || ly > 117 || (lx > 59 && lx < 68)) return 0;
  const bx = lx < 60 ? lx - 10 : lx - 68, by = (ly - 10) % 36;
  return by > 31 || Math.abs(bx - 25) < 2.5 ? 0 : 1;
}
function wallPixels(rng) {
  const W = 512, px = new Uint8Array(W * W * 4), n = tileNoise(rng), tone = new Float32Array(24 * 24);
  for (let i = 0; i < tone.length; i++) tone[i] = rng();
  const set = (o, r, g, b) => { px[o] = 255 * sat(r); px[o + 1] = 255 * sat(g); px[o + 2] = 255 * sat(b); px[o + 3] = 255; };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, row = y >> 7, t = (y & 127) / 128, u = x / W;
    if (row === 3) {            // whitewash over a tarred plinth
      const fine = n(u * 64, t * 16, 64, 16);
      if (t < 0.12) { const g = 0.12 + 0.07 * fine; set(o, g, g, g * 1.06); }
      else { const g = 0.85 + 0.1 * n(u * 16, t * 4, 16, 4) + 0.04 * fine - 0.12 * sstep(0.22, 0.12, t); set(o, g, g * 0.985, g * 0.94); }
    } else if (row === 2) {     // dark brick in courses, pale joints
      const cy = Math.floor(t * 24), bx = u * 24 + (cy & 1) * 0.5, cx = Math.floor(bx) % 24, f = 0.88 + 0.24 * n(u * 64, t * 32, 64, 32);
      if (t * 24 - cy < 0.18 || bx - Math.floor(bx) < 0.08) set(o, 0.55 * f, 0.51 * f, 0.45 * f);
      else { const k = (0.7 + 0.55 * tone[cy * 24 + cx]) * f; set(o, 0.44 * k, 0.225 * k, 0.17 * k); }
    } else if (row === 1) {     // red clay pantiles: a shadow under each lap, rolls across, weather
      const cy = t * 10, fy = cy - Math.floor(cy), k = (0.76 + 0.34 * n(u * 48, Math.floor(cy) + 0.5, 48, 10)) * (1 - 0.42 * sstep(0.72, 1, fy)) * (0.86 + 0.14 * Math.sin(u * TAU * 48));
      const li = 0.1 * n(u * 12, t * 3, 12, 3);
      set(o, 0.6 * k, 0.29 * k + li * 0.5, 0.18 * k + li * 0.3);
    } else {
      const cell = x >> 7, lx = x & 127;
      if (cell < 2) {           // the two window cells are one picture: the lit one glows by the emissive map
        if (paneAt(lx, y)) { const g = 0.05 + 0.07 * (y / 128); set(o, g, g * 1.2, g * 1.55); }
        else { const g = lx < 3 || lx > 124 || y < 3 || y > 124 ? 0.5 : 0.93; set(o, g, g * 0.99, g * 0.95); }
      } else if (cell === 2) {  // a plank door in sea-green paint under a small fanlight, white frame
        if (lx < 10 || lx > 117 || y > 118 || (y > 86 && y < 92)) set(o, 0.92, 0.91, 0.87);
        else if (y >= 92) { const g = (lx - 10) % 27 > 23 ? 0.9 : 0.07; set(o, g, g * 1.05, g * 1.2); }
        else { const k = ((lx - 10) % 18 < 2 ? 0.7 : 1) * (0.9 + 0.2 * n(lx / 2, y / 16, 64, 8)); set(o, 0.15 * k, 0.37 * k, 0.4 * k); }
      } else if (lx < 64) set(o, 1, 1, 1);                                 // plain white: faces coloured by their corners alone
      else { const k = 0.78 + 0.44 * n(lx / 1.5, y / 20, 64, 8); set(o, 0.76 * k, 0.73 * k, 0.68 * k); }   // weathered timber
    }
  }
  return px;
}
function glowPixels() {   // the emissive map of the atlas: only the glass of the lit window cell
  const W = 256, px = new Uint8Array(W * W * 4);
  for (let y = 0; y < 64; y++) for (let x = 64; x < 128; x++) {
    if (!paneAt((x - 64) * 2, y * 2)) continue;
    const o = (y * W + x) * 4, k = 0.72 + 0.28 * Math.sin((y / 64) * Math.PI);
    px[o] = 255 * k; px[o + 1] = 205 * k; px[o + 2] = 132 * k;
  }
  for (let i = 3; i < px.length; i += 4) px[i] = 255;
  return px;
}

// ---- THE NEAR ISLAND'S GROUND. It is laid out in the line's own frame (zl along the line, off metres to the side)
// so that its eastern shore runs beside the curving line at HALLIG.shoreOff all the way.
function toLine(x, z) {   // world -> [zl, off]
  let zl = z, off = 0;
  for (let i = 0; i < 7; i++) { const s = lineSlope(zl), k = 1 / Math.sqrt(1 + s * s); off = (x - lineX(zl)) / k; zl = z + off * s * k; }
  return [zl, off];
}
const WEST = -340;                                                              // the near island's western reach (off)
const SHORE = { foot: -1.8, crest: 2.55, top: 3.0, fringe: 4.3 };               // metres inside the waterline
// the stone slope: 1 in 3, straight through y = 0, from the bed (-0.6) to its crest; then the shell fringe at +0.9
const shoreY = (d) => (d < SHORE.crest ? Math.max(-0.6, d / 3) : d < SHORE.top ? 0.85 + (d - SHORE.crest) * 0.11 : 0.9);

function nearField(noise, creeks) {
  const cz = (HALLIG.z0 + HALLIG.z1) / 2, hz = Math.abs(HALLIG.z0 - HALLIG.z1) / 2, co = (HALLIG.shoreOff + WEST) / 2, ho = (HALLIG.shoreOff - WEST) / 2;
  // metres inside the waterline: a rounded rectangle in the line's frame, exact along the east shore, wandering in the west
  const inside = (zl, off, x, z) => {
    const pz = zl - cz, po = off - co, r = po > 0 ? (pz > 0 ? 40 : 30) : 70, qz = Math.abs(pz) - (hz - r), qo = Math.abs(po) - (ho - r);
    return r - Math.hypot(Math.max(qz, 0), Math.max(qo, 0)) - Math.min(Math.max(qz, qo), 0) - 13 * sstep(-70, -170, off) * noise.n2(x / 70, z / 70);
  };
  const marshY = (x, z) => 0.9 + 0.2 * noise.n2(x / 45 + 3.1, z / 45 - 1.7);
  const info = { y: 0, d: 0, mud: 0, cut: 0 };
  // the ground at a point: height, metres inside the shore, creek mud and creek cut (0 to 1)
  const at = (zl, off, x, z, dKnown) => {
    const d = dKnown !== undefined ? dKnown : inside(zl, off, x, z);
    const y = d < SHORE.fringe ? shoreY(d) : lerp(0.9, marshY(x, z), sstep(SHORE.fringe, 10, d));
    let cut = 0, mud = 0;
    for (const c of creeks) {
      const vz = zl - c.mz, vo = off - HALLIG.shoreOff, rho = vz * c.dz + vo * c.dO; if (rho < -6 || rho > c.len + 5) continue;
      const lat = Math.abs(vz * c.dO - vo * c.dz - c.amp * sstep(3, 16, rho) * Math.sin(rho / c.lam + c.ph)), w = lerp(c.w0, c.w1, sat(rho / c.len));
      cut = Math.max(cut, sstep(w + 0.95, w, lat) * (1 - sstep(c.len - 9, c.len, rho)));
      mud = Math.max(mud, sstep(w + 2.6, w + 0.5, lat) * (1 - sstep(c.len - 2, c.len + 4, rho)));
    }
    info.y = lerp(y, -0.6, cut); info.d = d; info.mud = mud; info.cut = cut;
    return info;
  };
  // the marsh's colour as meant (the detail texture's mean is made up for where it is written into corners)
  const colour = (x, z, d, mud, cut = 0) => {
    const a = noise.n2(x / 55, z / 55), b = noise.n2(x / 34 + 9.2, z / 80 + 3.3), c = noise.n2(x / 24 - 7.7, z / 58 + 11.4), f = noise.n2(x / 5.3, z / 5.3);
    let col = mix3(P.olive, P.seaGreen, sstep(-0.35, 0.45, a) * (0.55 + 0.45 * sstep(50, 95, d)));
    const kd = 0.4 + 0.6 * sstep(50, 95, d);                                      // by the east shore the drifts are flowers (real tufts), not stains
    col = mix3(col, P.pale, 0.65 * kd * sstep(0.3, 0.7, b)); col = mix3(col, P.mauve, 0.75 * kd * sstep(0.42, 0.75, c)); col = mix3(col, P.mud, 0.85 * mud);
    col = mix3(P.shell, col, sstep(SHORE.top + 0.5 + 0.5 * f, SHORE.fringe + 1.4 + 1.2 * f, d));
    // a creek's wall is wet mud that carries the sky's sheen: it faces away from the low sun and must not sink to black
    col = mix3(col, P.mudWet, 0.9 * sstep(0.02, 0.4, cut));
    return mul3(col, 1 + 0.1 * f);
  };
  return { cz, hz, co, ho, inside, at, colour };
}

const GAIN = 1.3, STONE_GAIN = 1.55;   // the detail textures' means, made up for in the corner colours
// the mesh: rays from the island's middle to its waterline, close together along the east shore and closest at the
// creek mouths; the stone slope in rings square to the shore (Gs), the marsh in rings shrinking to the middle (Gm)
function buildNearGround(Gs, Gm, F, creeks, noise) {
  const { cz, hz, co, ho } = F, T = [], zE0 = cz - (hz - 30), zE1 = cz + (hz - 40), east = co + ho;
  const stepAt = (zl) => { let m = 1e9; for (const c of creeks) m = Math.min(m, Math.abs(zl - c.mz)); return lerp(0.55, 2.75, sstep(5.5, 13, m)); };
  const seg = (z0, o0, z1, o1, step) => { const n = Math.max(1, Math.round(Math.hypot(z1 - z0, o1 - o0) / step)); for (let i = 0; i < n; i++) T.push([lerp(z0, z1, i / n), lerp(o0, o1, i / n)]); };
  const arc = (ccz, cco, r, a0, step) => { const n = Math.max(2, Math.round(Math.PI / 2 * r / step)); for (let i = 0; i < n; i++) { const a = a0 + Math.PI / 2 * i / n; T.push([ccz + r * Math.sin(a), cco + r * Math.cos(a)]); } };
  for (let zl = zE0, guard = 0; zl < zE1 - 0.3 && guard < 900; zl += stepAt(zl), guard++) T.push([zl, east]);
  arc(zE1, east - 40, 40, 0, 4); seg(cz + hz, east - 40, cz + hz, WEST + 70, 14); arc(cz + hz - 70, WEST + 70, 70, Math.PI / 2, 14);
  seg(cz + hz - 70, WEST, cz - hz + 70, WEST, 14); arc(cz - hz + 70, WEST + 70, 70, Math.PI, 14); seg(cz - hz, WEST + 70, cz - hz, east - 30, 14); arc(zE0, east - 30, 30, 1.5 * Math.PI, 4);
  const N = T.length, O = [], NR = [], f = (a, b) => { const w = beside(a, b); return F.inside(a, b, w[0], w[1]); };
  for (const t of T) {
    let dz = t[0] - cz, dO = t[1] - co, len = Math.hypot(dz, dO); dz /= len; dO /= len;
    if (t[1] < -66) { let lo = len * 0.55, hi = len + 45; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (f(cz + dz * m, co + dO * m) > 0) lo = m; else hi = m; } len = (lo + hi) / 2; }
    const oz = cz + dz * len, oo = co + dO * len, gz = f(oz + 0.6, oo) - f(oz - 0.6, oo), go = f(oz, oo + 0.6) - f(oz, oo - 0.6), gl = Math.hypot(gz, go) || 1;
    O.push([oz, oo]); NR.push([gz / gl, go / gl]);
  }
  const U = [0]; for (let i = 1; i <= N; i++) { const a = beside(O[i - 1][0], O[i - 1][1]), b = beside(O[i % N][0], O[i % N][1]); U.push(U[i - 1] + Math.hypot(a[0] - b[0], a[1] - b[1])); }
  const us = Math.round(U[N] / 3.4) / U[N], DB = [SHORE.foot, -0.45, 0.45, 1.3, SHORE.crest, SHORE.top], DM = [0, 0.6, 1.3, 2.5, 4.5, 7, 10, 14, 19, 25, 33, 43, 55, 70, 88, 110, 132];
  const stoneCol = (d, x, z, cut) => {
    const fine = 0.8 + 0.4 * noise.n2(x / 3.1 + 40, z / 3.1), lich = sstep(0.2, 0.7, noise.n2(x / 9 - 20, z / 9)) * sstep(0.8, 2.2, d);
    let col = mix3(P.stone, P.stoneWet, sstep(1.0, 0.1, d)); col = mix3(col, P.algae, 0.6 * sstep(0.9, -0.2, d)); col = mix3(col, P.lichen, 0.5 * lich);
    col = mix3(mix3(col, P.mudWet, 0.6 * cut), P.sand, sstep(0.1, -1.5, d));            // under water the stone is silted to the bed's sand
    return mul3(col, fine * STONE_GAIN);
  };
  // the stone slope
  const ks = Gs.mark(), sid = [];
  for (let i = 0; i <= N; i++) {
    const j = i % N, col = [];
    for (const d of DB) { const zl = O[j][0] + NR[j][0] * d, off = O[j][1] + NR[j][1] * d, w = beside(zl, off), g = F.at(zl, off, w[0], w[1], d); col.push(Gs.v(w[0], g.y, w[1], stoneCol(d, w[0], w[1], g.cut), U[i] * us, (d - SHORE.foot) * 1.054 / 3.4)); }
    sid.push(col);
  }
  const p = Gs.p, a0 = sid[0][0] * 3, b0 = sid[1][0] * 3, c0 = sid[1][1] * 3;   // which way round faces up?
  const flip = (p[b0 + 2] - p[a0 + 2]) * (p[c0] - p[a0]) - (p[b0] - p[a0]) * (p[c0 + 2] - p[a0 + 2]) < 0;
  const quad = (G, a, b, c, d) => (flip ? G.quad(a, d, c, b) : G.quad(a, b, c, d));
  for (let i = 0; i < N; i++) for (let k = 0; k < DB.length - 1; k++) quad(Gs, sid[i][k], sid[i + 1][k], sid[i + 1][k + 1], sid[i][k + 1]);
  Gs.shade(ks); for (let k = 0; k < DB.length; k++) Gs.weld(sid[0][k], sid[N][k]);
  // the marsh
  const km = Gm.mark(), mid = [], cw = beside(cz, co);
  for (let i = 0; i < N; i++) {
    const bz = O[i][0] + NR[i][0] * SHORE.top, bo = O[i][1] + NR[i][1] * SHORE.top, col = [];
    for (const D of DM) {
      const t = D / 155, zl = bz + (cz - bz) * t, off = bo + (co - bo) * t, w = beside(zl, off), g = F.at(zl, off, w[0], w[1], D <= 1.3 ? SHORE.top + D : undefined);
      col.push(Gm.v(w[0], g.y, w[1], mul3(F.colour(w[0], w[1], g.d, g.mud, g.cut), GAIN), w[0] / 7, w[1] / 7));
    }
    mid.push(col);
  }
  const g = F.at(cz, co, cw[0], cw[1]), mc = Gm.v(cw[0], g.y, cw[1], mul3(F.colour(cw[0], cw[1], g.d, 0), GAIN), cw[0] / 7, cw[1] / 7), L = DM.length - 1;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    for (let k = 0; k < L; k++) quad(Gm, mid[i][k], mid[j][k], mid[j][k + 1], mid[i][k + 1]);
    if (flip) Gm.tri(mid[i][L], mc, mid[j][L]); else Gm.tri(mid[i][L], mid[j][L], mc);
  }
  Gm.shade(km);
}

// ---- A DWELLING MOUND: round, flat topped, grass; M = { x, z, Rt (flat top), Rb (foot), T (top above the sea), pond }
function moundY(M, x, z, noise) {
  const dx = x - M.x, dz = z - M.z, r = Math.hypot(dx, dz); if (r > M.Rb + 9) return -9;
  const wob = 1 + 0.04 * noise.n2(M.x + 1.4 * dx / (r + 1e-6), M.z + 1.4 * dz / (r + 1e-6));
  let y = lerp(M.T, 0.42, sstep(M.Rt - 3, M.Rb + 3, r / wob)) + 0.07 * noise.n2(x / 6 + 31, z / 6) * sstep(M.Rb, M.Rt, r);
  if (M.pond) y -= sstep(7.0, 3.4, Math.hypot(dx / 1.35, dz));              // the pond's hollow: an oval, 1 m deep
  return y;
}
function moundColour(M, x, z, noise, marsh) {
  const dx = x - M.x, dz = z - M.z, r = Math.hypot(dx, dz);
  if (M.far) return mul3(P.farLand, 0.92 + 0.2 * noise.n2(x / 30, z / 30));
  let col = mix3(P.lawn, P.lawn2, sstep(-0.3, 0.4, noise.n2(x / 17 + 5, z / 17)));
  col = mix3(col, P.yard, 0.55 * sstep(M.Rt - 5, M.Rt - 14, r) * (0.45 + 0.55 * noise.n2(x / 7, z / 7 + 9)));
  if (M.pond) col = mix3(col, P.mud, 0.7 * sstep(7.6, 5.4, Math.hypot(dx / 1.35, dz)));
  if (marsh) col = mix3(col, marsh(x, z), sstep(0.7, 0.96, sstep(M.Rt - 3, M.Rb + 3, r)));
  return mul3(col, 1 + 0.1 * noise.n2(x / 4.1, z / 4.1));
}
function addMound(G, M, noise, marsh, segs) {
  const k = G.mark(), rings = [];
  const radii = M.pond ? [2, 3.4, 4.3, 5.2, 6.1, 7, 9, 12, 16, 21] : [5, 11];
  for (let i = 0, nr = M.far ? 5 : 9; i <= nr; i++) radii.push(lerp(M.Rt - 5, M.Rb + 5, i / nr));
  const put = (x, z) => G.v(x, moundY(M, x, z, noise), z, mul3(moundColour(M, x, z, noise, marsh), GAIN), x / 7, z / 7);
  const mid = put(M.x, M.z);
  for (const r of radii) { const ring = []; for (let s = 0; s < segs; s++) { const a = (s / segs) * TAU; ring.push(put(M.x + r * Math.cos(a), M.z + r * Math.sin(a))); } rings.push(ring); }
  for (let s = 0; s < segs; s++) {
    const t = (s + 1) % segs; G.tri(mid, rings[0][t], rings[0][s]);
    for (let j = 0; j < rings.length - 1; j++) G.quad(rings[j][s], rings[j][t], rings[j + 1][t], rings[j + 1][s]);
  }
  G.shade(k);
}
// a low island seen far off: a strip with sloping sides through the water; I = { x, z, ax, az, top, n, tag }
function addFarIsland(G, I, noise, colTop, colSide) {
  const k = G.mark(), n = I.n, R = [[1.02, -0.6, colSide], [0.985, I.top * 0.9, colSide], [0.95, I.top, colTop], [0.55, I.top + 0.5, colTop]], rings = [];
  for (const [s, y, col] of R) {
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, q = 1 + 0.22 * noise.n2(I.x * 0.01 + 2.3 * Math.cos(a), I.z * 0.01 + 2.3 * Math.sin(a)), c = Math.cos(a), sn = Math.sin(a);
      const e = 1 / Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(sn), 2.6), 1 / 2.6), x = I.x + I.ax * c * e * q * s, z = I.z + I.az * sn * e * q * s;
      ring.push(G.v(x, y, z, mul3(col, GAIN * (0.9 + 0.2 * noise.n2(x / 60, z / 60))), x / 7, z / 7));
    }
    rings.push(ring);
  }
  const mid = G.v(I.x, I.top + 0.6, I.z, mul3(colTop, GAIN), I.x / 7, I.z / 7);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; G.tri(mid, rings[3][j], rings[3][i]);
    for (let r = 0; r < 3; r++) G.quad(rings[r][j], rings[r][i], rings[r + 1][i], rings[r + 1][j]);
  }
  G.shade(k);
}

// ---- A THATCHED LONG HOUSE of the mounds: low walls, a big soft hipped reed roof with a paler ridge, small-paned
// windows under the eaves, a door gable. Local frame: length along x, the door side toward +z, ground at y = 0.
// the eaves' outline at one level of the roof: a rounded rectangle walked round as [x, z, nx, nz, metres along]
function roofLoop(bx, bz, rho, nL, nS, nc) {
  const out = [], r = Math.min(rho, bx, bz), ex = bx - r, ez = bz - r, Q = Math.PI / 2; let s = 0, px = null, pz = 0;
  const put = (x, z, nx, nz) => { if (px !== null) s += Math.hypot(x - px, z - pz); px = x; pz = z; out.push([x, z, nx, nz, s]); };
  for (let i = 0; i < nL; i++) put(lerp(-ex, ex, i / nL), bz, 0, 1);
  for (let i = 0; i < nc; i++) { const a = (i / nc) * Q; put(ex + r * Math.sin(a), ez + r * Math.cos(a), Math.sin(a), Math.cos(a)); }
  for (let i = 0; i < nS; i++) put(bx, lerp(ez, -ez, i / nS), 1, 0);
  for (let i = 0; i < nc; i++) { const a = (i / nc) * Q; put(ex + r * Math.cos(a), -ez - r * Math.sin(a), Math.cos(a), -Math.sin(a)); }
  for (let i = 0; i < nL; i++) put(lerp(ex, -ex, i / nL), -bz, 0, -1);
  for (let i = 0; i < nc; i++) { const a = (i / nc) * Q; put(-ex - r * Math.sin(a), -ez - r * Math.cos(a), -Math.sin(a), -Math.cos(a)); }
  for (let i = 0; i < nS; i++) put(-bx, lerp(-ez, ez, i / nS), -1, 0);
  for (let i = 0; i < nc; i++) { const a = (i / nc) * Q; put(-ex - r * Math.cos(a), ez + r * Math.sin(a), -Math.cos(a), Math.sin(a)); }
  return out;
}
// H = { x, y, z, yaw, L, W, brick, lod (0 near, 1 plain), bay (the front window place taken by the door gable, or -1), lit }
function addHouse(Gw, Gt, H, rng, noise) {
  const hw = H.W / 2, hl = H.L / 2, he = 2.75, ov = 0.5, tp = 1.19, ye = he - ov * tp, yr = he + hw * tp, bz0 = hw + ov, bx0 = hl + ov, near = !H.lod;
  const run = (yr - ye) / rng.range(1.45, 1.9), slope = Math.hypot(bz0, yr - ye), uo = rng() * 3, tone = rng.range(0.9, 1.08), moss = rng.range(0, 0.5), xr = bx0 - run + 0.2;
  const sag = (x, r) => r * r * (0.3 * (1 - (x / bx0) * (x / bx0)) + 0.06 * noise.n2(x * 0.45 + uo * 9, uo));   // an old roof's swayback
  H.tops = [];
  Gt.at(H.yaw, H.x, H.y, H.z); Gw.at(H.yaw, H.x, H.y, H.z);
  // the roof: rings from the eaves up to the ridge, rounded at the hips, a little full in the slope
  const rs = near ? [0, 0.16, 0.36, 0.58, 0.8, 1] : [0, 0.5, 1], nL = near ? 5 : 2, nS = near ? 2 : 1, nc = near ? 3 : 1, k = Gt.mark(), ids = [];
  let S = null, M = 0;
  for (const r of rs) {
    const lp = roofLoop(bx0 - run * r, bz0 * (1 - r), lerp(1.25, 0.4, r), nL, nS, nc), y = ye + (yr - ye) * r + 0.2 * Math.sin(Math.PI * r), ring = [];
    if (!S) { M = lp.length; S = lp.map((q) => q[4]); S.push(S[M - 1] + Math.hypot(lp[0][0] - lp[M - 1][0], lp[0][1] - lp[M - 1][1])); }
    for (let i = 0; i <= M; i++) {
      const q = lp[i % M], nn = noise.n2(S[i] / 2.3 + uo * 7, r * 2.2 + uo);
      let col = mix3(P.thatch, P.thatchPale, sat(r * 0.9 + 0.25 * nn)); col = mix3(col, P.moss, moss * sstep(0.5, 0, r) * sat(0.5 + nn)); col = mix3(col, P.thatchDark, 0.5 * sstep(0.25, 0.7, -nn));
      ring.push(Gt.v(q[0], y - sag(q[0], r), q[1], mul3(col, tone * 1.5), S[i] / 2.6 + uo, r * slope / 2.6));
    }
    ids.push(ring);
  }
  for (let j = 0; j < rs.length - 1; j++) for (let i = 0; i < M; i++) Gt.quad(ids[j][i], ids[j][i + 1], ids[j + 1][i + 1], ids[j + 1][i]);
  Gt.shade(k); for (const ring of ids) Gt.weld(ring[0], ring[M]);
  if (near) {
    // the thatch's thickness at the eaves and the dark soffit behind it
    const lp = roofLoop(bx0, bz0, 1.25, nL, nS, nc), ke = Gt.mark(), e0 = [], e1 = [], e2 = [];
    for (let i = 0; i <= M; i++) {
      const q = lp[i % M], u = S[i] / 2.6 + uo;
      e0.push(Gt.v(q[0], ye, q[1], mul3(P.thatchDark, tone * 1.3), u, 0)); e1.push(Gt.v(q[0] - q[2] * 0.26, ye - 0.22, q[1] - q[3] * 0.26, mul3(P.thatchDark, tone * 0.9), u, 0.08));
      e2.push(Gt.v(q[0] - q[2] * (ov + 0.05), ye + 0.07, q[1] - q[3] * (ov + 0.05), mul3(P.thatchDark, 0.45), u, 0.2));
    }
    for (let i = 0; i < M; i++) { Gt.quad(e1[i], e1[i + 1], e0[i + 1], e0[i]); Gt.quad(e2[i], e2[i + 1], e1[i + 1], e1[i]); }
    Gt.shade(ke); for (const e of [e0, e1, e2]) Gt.weld(e[0], e[M]);
    // the paler ridge: a roll of sods along the top, running down onto the hips
    const kr = Gt.mark(), sec = [[-0.8, -0.84], [-0.45, -0.3], [0, 0.17], [0.45, -0.3], [0.8, -0.84]], st = [[-xr - 0.6, 0.7, -0.7]];
    for (let i = 0; i <= 5; i++) st.push([lerp(-xr, xr, i / 5), 1, 0]);
    st.push([xr + 0.6, 0.7, -0.7]);
    const rr = st.map(([x, w, dy]) => sec.map(([z, y], b) => Gt.v(x, yr + y + dy - sag(x, 1), z * w, mul3(P.ridge, tone * 1.5 * (0.88 + 0.24 * noise.n2(x / 1.7 + uo * 5, b * 3.1))), x / 2.6 + uo, 0.3 + b * 0.08)));
    for (let a = 0; a < rr.length - 1; a++) for (let b = 0; b < 4; b++) Gt.quad(rr[a][b], rr[a][b + 1], rr[a + 1][b + 1], rr[a + 1][b]);
    Gt.shade(kr);
  }
  // chimneys on the ridge
  const nCh = near && H.L > 16.5 ? 2 : 1;
  for (let c = 0; c < nCh; c++) {
    const cx = nCh === 2 ? (c ? 1 : -1) * xr * rng.range(0.45, 0.7) : xr * rng.range(-0.5, 0.5), cz = rng.range(-0.4, 0.1), u0 = rng() * 0.8;
    Gw.box(cx - 0.34, cx + 0.34, yr - 0.9, yr + 1.05, cz - 0.34, cz + 0.34, near ? P.white : P.brick, near ? [u0, rowV(2, 0.3), u0 + 0.14, rowV(2, 0.95)] : null, false);
    Gw.box(cx - 0.42, cx + 0.42, yr + 1.05, yr + 1.18, cz - 0.42, cz + 0.42, mul3(P.lime, 0.72), null);
    H.tops.push([H.x + Math.cos(H.yaw) * cx + Math.sin(H.yaw) * cz, H.y + yr + 1.18, H.z - Math.sin(H.yaw) * cx + Math.cos(H.yaw) * cz]);
  }
  // the walls: whitewash over a tarred plinth, or dark brick
  const row = H.brick ? 2 : 3, yw = ye + 0.22, tint = H.brick ? P.white : P.lime, tv = (y) => rowV(row, y / 2.4);
  Gw.box(-hl, hl, -0.7, near ? 0 : yw, -hw, hw, near ? (H.brick ? mul3(P.brick, 0.8) : P.tar) : (H.brick ? P.brick : P.lime), null, false);
  if (!near) { Gt.at(null); Gw.at(null); return; }
  const wall = (pts, len) => { const u0 = rng() * 2; Gw.poly(pts, tint, [[u0, tv(0)], [u0 + len / 4.8, tv(0)], [u0 + len / 4.8, tv(yw)], [u0, tv(yw)]]); };
  wall([[-hl, 0, hw], [hl, 0, hw], [hl, yw, hw], [-hl, yw, hw]], H.L); wall([[hl, 0, hw], [hl, 0, -hw], [hl, yw, -hw], [hl, yw, hw]], H.W);
  wall([[hl, 0, -hw], [-hl, 0, -hw], [-hl, yw, -hw], [hl, yw, -hw]], H.L); wall([[-hl, 0, -hw], [-hl, 0, hw], [-hl, yw, hw], [-hl, yw, -hw]], H.W);
  // small-paned windows tucked under the eaves; a few of them are lit ones (the same picture, glowing by setNight)
  let lits = 0;
  const on = () => { const v = rng() < H.lit && lits < 3; if (v) lits++; return v; };
  const win = (x, y0, y1, w, z, s, lit) => { const a = x - w / 2, b = x + w / 2; Gw.poly(s > 0 ? [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]] : [[b, y0, z], [a, y0, z], [a, y1, z], [b, y1, z]], P.white, winUV(lit)); };
  const winX = (z, x, s, lit) => { const a = z - 0.46 * s, b = z + 0.46 * s; Gw.poly([[x, 0.82, b], [x, 0.82, a], [x, 1.86, a], [x, 1.86, b]], P.white, winUV(lit)); };
  const nW = Math.max(3, Math.round((H.L - 2.4) / 3.0)), slot = (i) => ((i + 0.5) / nW - 0.5) * (H.L - 1.6);
  for (let i = 0; i < nW; i++) {
    const x = slot(i) + rng.range(-0.25, 0.25), back = rng() < 0.8, xb = x + rng.range(-0.4, 0.4), l0 = on(), l1 = on();
    if (i !== H.bay) win(x, 0.82, 1.86, 0.92, hw + 0.035, 1, l0);
    if (back) win(xb, 0.82, 1.86, 0.92, -hw - 0.035, -1, l1);
  }
  for (const s of [1, -1]) { const two = H.W > 7.7, l0 = on(), l1 = on(); winX(two ? 1.5 : 0, s * (hl + 0.035), s, l0); if (two) winX(-1.5, s * (hl + 0.035), s, l1); }
  if (H.bay >= 0) {
    // the door gable: a shallow bay standing out to the eaves line, its own small thatched saddle running back into the roof
    const xb = slot(H.bay), wb = 3.1, zb = bz0 + 0.12, yl = ye + 0.3, xe = wb / 2 + 0.3, ya = yl + xe * 1.28, zf = zb + 0.3, yt = yl - 0.1, w2 = wb / 2;
    const zBack = bz0 * (1 - sat((ya - ye) / (yr - ye))) - 0.1, zEb = bz0 * (1 - sat((yl - ye) / (yr - ye))) - 0.06, u0 = rng() * 2, uv = (x, y) => [u0 + x / 4.8, tv(y)];
    const bw = (pts, uvs) => Gw.poly(pts.map((q) => [xb + q[0], q[1], q[2]]), tint, uvs);
    bw([[-w2, 0, zb], [w2, 0, zb], [w2, yt, zb], [-w2, yt, zb]], [uv(0, 0), uv(wb, 0), uv(wb, yt), uv(0, yt)]);
    bw([[-w2, yt, zb], [w2, yt, zb], [0, ya - 0.45, zb]], [uv(0, 0.5), uv(wb, 0.5), uv(w2, 0.5 + ya - 0.45 - yt)]);
    bw([[w2, 0, zb], [w2, 0, hw], [w2, yt, hw], [w2, yt, zb]], [uv(0, 0), uv(zb - hw, 0), uv(zb - hw, yt), uv(0, yt)]);
    bw([[-w2, 0, hw], [-w2, 0, zb], [-w2, yt, zb], [-w2, yt, hw]], [uv(0, 0), uv(zb - hw, 0), uv(zb - hw, yt), uv(0, yt)]);
    Gw.poly([[xb - 0.5, 0, zb + 0.035], [xb + 0.5, 0, zb + 0.035], [xb + 0.5, 2.05, zb + 0.035], [xb - 0.5, 2.05, zb + 0.035]], P.white, DOOR_UV);
    win(xb, yl + 0.25, yl + 1.0, 0.62, zb + 0.035, 1, on());
    const tc = mul3(mix3(P.thatch, P.thatchPale, 0.4), tone * 1.5), td = mul3(P.thatchDark, tone * 1.1), sl = Math.hypot(xe, ya - yl) / 2.6, dz = (zf - zBack) / 2.6;
    Gt.poly([[xb + xe, yl, zf], [xb + xe, yl, zEb], [xb, ya, zBack], [xb, ya, zf]], tc, [[uo, 0], [uo + dz, 0], [uo + dz, sl], [uo, sl]]);
    Gt.poly([[xb - xe, yl, zf], [xb, ya, zf], [xb, ya, zBack], [xb - xe, yl, zEb]], tc, [[uo, 0], [uo, sl], [uo + dz, sl], [uo + dz, 0]]);
    Gt.poly([[xb - 0.236, ya - 0.185, zf], [xb + xe - 0.236, yl - 0.185, zf], [xb + xe, yl, zf], [xb, ya, zf]], td, [uo, 0.02]);
    Gt.poly([[xb - xe + 0.236, yl - 0.185, zf], [xb + 0.236, ya - 0.185, zf], [xb, ya, zf], [xb - xe, yl, zf]], td, [uo, 0.02]);
  }
  Gt.at(null); Gw.at(null);
}
// a small outbuilding under red clay pantiles (a few houses have one); local frame as the house
function addShed(Gw, B, rng) {
  const hl = B.L / 2, hw = B.W / 2, yw = 1.95, yr = yw + hw * 0.84, ovh = 0.28, u0 = rng() * 2, row = B.brick ? 2 : 3, tint = B.brick ? P.white : P.lime, tv = (y) => rowV(row, y / 2.4);
  Gw.at(B.yaw, B.x, B.y, B.z);
  Gw.box(-hl, hl, -0.7, 0, -hw, hw, B.brick ? mul3(P.brick, 0.8) : P.tar, null, false);
  Gw.box(-hl, hl, 0, yw, -hw, hw, tint, [u0, tv(0), u0 + B.L / 4.8, tv(yw)], false);
  for (const s of [1, -1]) {
    Gw.poly(s > 0 ? [[hl, yw, hw], [hl, yw, -hw], [hl, yr, 0]] : [[-hl, yw, -hw], [-hl, yw, hw], [-hl, yr, 0]], tint, [[u0, tv(0.5)], [u0 + B.W / 4.8, tv(0.5)], [u0 + hw / 4.8, tv(0.5 + yr - yw)]]);
    const ze = s * (hw + ovh), ye = yw - ovh * 0.84, x0 = -hl - ovh, x1 = hl + ovh, ua = u0 * 3, ub = ua + (x1 - x0) / 2.6;
    Gw.poly(s > 0 ? [[x0, ye, ze], [x1, ye, ze], [x1, yr, 0], [x0, yr, 0]] : [[x1, ye, ze], [x0, ye, ze], [x0, yr, 0], [x1, yr, 0]], P.white, [[ua, rowV(1, 0)], [ub, rowV(1, 0)], [ub, rowV(1, 1)], [ua, rowV(1, 1)]]);
  }
  Gw.poly([[-0.55, 0, hw + 0.03], [0.55, 0, hw + 0.03], [0.55, 1.8, hw + 0.03], [-0.55, 1.8, hw + 0.03]], mul3(P.timber, 0.8), [[TIMBER_UV[0], TIMBER_UV[1]], [TIMBER_UV[2], TIMBER_UV[1]], [TIMBER_UV[2], TIMBER_UV[3]], [TIMBER_UV[0], TIMBER_UV[3]]]);
  Gw.at(null);
}
// a pole fence: posts at the given ground points, two rails between neighbours (pts: [x, y, z]; a null breaks the run)
function addFence(Gw, pts, rng) {
  const tq = [[TIMBER_UV[0], TIMBER_UV[1]], [TIMBER_UV[2], TIMBER_UV[1]], [TIMBER_UV[2], TIMBER_UV[3]], [TIMBER_UV[0], TIMBER_UV[3]]];
  let prev = null;
  for (const q of pts) {
    if (!q) { prev = null; continue; }
    const tone = mul3(P.timber, rng.range(0.7, 1.05)), h = (q[3] || 1.25) + rng.range(-0.06, 0.06), lean = rng.range(-0.05, 0.05);
    Gw.at(rng() * TAU, q[0], q[1], q[2]); Gw.box(-0.08 + lean, 0.08 + lean, -0.4, h, -0.08, 0.08, tone, TIMBER_UV); Gw.at(null);
    if (prev) {
      const dx = q[0] - prev[0], dz = q[2] - prev[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.045, nz = dx / l * 0.045;
      for (const ry of [0.42, 0.95]) {
        const a = [prev[0], prev[1] + ry, prev[2]], b = [q[0], q[1] + ry, q[2]], t = 0.065;
        Gw.poly([[a[0] + nx, a[1] - t, a[2] + nz], [b[0] + nx, b[1] - t, b[2] + nz], [b[0] + nx, b[1] + t, b[2] + nz], [a[0] + nx, a[1] + t, a[2] + nz]], tone, tq);
        Gw.poly([[b[0] - nx, b[1] - t, b[2] - nz], [a[0] - nx, a[1] - t, a[2] - nz], [a[0] - nx, a[1] + t, a[2] - nz], [b[0] - nx, b[1] + t, b[2] - nz]], tone, tq);
        Gw.poly([[a[0] + nx, a[1] + t, a[2] + nz], [b[0] + nx, b[1] + t, b[2] + nz], [b[0] - nx, b[1] + t, b[2] - nz], [a[0] - nx, a[1] + t, a[2] - nz]], tone, tq[0]);
      }
    }
    prev = q;
  }
}

// ---- a garden gate: a white paled leaf on its hinge post, standing a little open. (dx, dz): the way the leaf points
function addGate(Gw, x, y, z, dx, dz, L) {
  const c = mul3(P.lime, 0.96), n = Math.round((L - 0.3) / 0.24);
  Gw.at(Math.atan2(-dz, dx), x, y, z);
  Gw.box(0.02, 0.1, 0.1, 1.14, -0.035, 0.035, c); Gw.box(L - 0.1, L - 0.02, 0.1, 1.14, -0.035, 0.035, c);
  for (const ry of [0.3, 0.9]) Gw.box(0.02, L - 0.02, ry - 0.045, ry + 0.045, -0.03, 0.03, c);
  for (let i = 0; i <= n; i++) { const px = 0.15 + ((L - 0.3) * i) / n; Gw.box(px - 0.045, px + 0.045, 0.14, 1.2, 0.03, 0.055, c); }
  Gw.at(null);
}

// ---- a worn footpath: a ribbon of trodden earth laid just over the ground along a smooth line through ctrl ([x, z]);
// its edges take the ground's own colour so that it fades into the turf. Returns the line's points (the sward keeps off it).
function addPath(G, ctrl, yAt, colAt, liftAt, noise) {
  const pts = [], at = (i) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2), n = Math.max(2, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) / 0.85));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; pts.push([0, 1].map((j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3))); }
  }
  pts.push(ctrl[ctrl.length - 1]);
  const k0 = G.mark(), rows = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
    const w = 0.4 + 0.09 * noise.n2(i / 6, 3.3), row = [];
    for (const [s, up, earth] of [[-w - 0.42, 0.5, 0], [-w, 1, 1], [w, 1, 1], [w + 0.42, 0.5, 0]]) {
      const x = pts[i][0] + nx * s, z = pts[i][1] + nz * s, g = colAt(x, z), e = mul3(P.path, 0.88 + 0.2 * noise.n2(x / 1.7, z / 1.7));
      row.push(G.v(x, yAt(x, z) + up * liftAt(x, z), z, mul3(earth ? mix3(g, e, 0.85) : g, GAIN), x / 7, z / 7));
    }
    rows.push(row);
  }
  const p = G.p, A = rows[0][0] * 3, B = rows[1][0] * 3, C = rows[1][1] * 3;      // which way round faces up?
  const flip = (p[B + 2] - p[A + 2]) * (p[C] - p[A]) - (p[B] - p[A]) * (p[C + 2] - p[A + 2]) < 0;
  for (let i = 0; i + 1 < rows.length; i++) for (let j = 0; j < 3; j++) { if (flip) G.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]); else G.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); }
  G.shade(k0);
  return pts;
}

// ---- a landing on the stone shore: a short flight of pale stone steps down into the water, and two mooring posts
// standing in the shallows before it. at(d, s) -> [x, z]: d metres inside the waterline, s metres along the shore.
function addLanding(Gs, Gw, at, rng) {
  const q = (d, s, y) => { const p = at(d, s); return [p[0], y, p[1]]; }, uv = (d, s, u0) => [u0 + s / 3.4, d / 3.4], hw = 0.85;
  const tone = (y, k) => mul3(mix3(mix3(P.step, P.algae, 0.6 * sstep(0.5, 0.05, y)), P.sand, 0.6 * sstep(0, -0.4, y)), STONE_GAIN * k);
  // no tread lies within 10 cm of the still water: the flight steps over it (0.15 above, 0.12 below)
  const Y = [0.96, 0.75, 0.55, 0.35, 0.15, -0.12, -0.31], D = Y.map((y) => 3 * (y - 0.03));
  D[0] = SHORE.top + 0.3; D.push(D[D.length - 1] - 0.57);
  for (let k = 0; k < Y.length; k++) {
    const y = Y[k], d0 = D[k], d1 = D[k + 1], yb = k + 1 < Y.length ? Y[k + 1] : y - 0.25, kk = rng.range(0.9, 1.08), u0 = rng(), c = tone(y, kk), cs = tone(y - 0.1, kk * 0.78);
    Gs.poly([q(d0, -hw, y), q(d1, -hw, y), q(d1, hw, y), q(d0, hw, y)], c, [uv(d0, -hw, u0), uv(d1, -hw, u0), uv(d1, hw, u0), uv(d0, hw, u0)]);                          // the tread
    Gs.poly([q(d1, -hw, y), q(d1, -hw, yb), q(d1, hw, yb), q(d1, hw, y)], cs, [uv(d1, -hw, u0), uv(d1 - 0.2, -hw, u0), uv(d1 - 0.2, hw, u0), uv(d1, hw, u0)]);          // its riser
    Gs.poly([q(d0, hw, y), q(d1, hw, y), q(d1, hw, y - 0.5), q(d0, hw, y - 0.5)], cs, [uv(d0, 0, u0), uv(d1, 0, u0), uv(d1, 0.5, u0), uv(d0, 0.5, u0)]);                  // its two cheeks
    Gs.poly([q(d1, -hw, y), q(d0, -hw, y), q(d0, -hw, y - 0.5), q(d1, -hw, y - 0.5)], cs, [uv(d1, 0, u0), uv(d0, 0, u0), uv(d0, 0.5, u0), uv(d1, 0.5, u0)]);
  }
  for (const s of [-1.5, 1.5]) {
    const p = at(-2.5 + rng.range(-0.1, 0.1), s + rng.range(-0.12, 0.12)), top = 1.4 + rng.range(-0.06, 0.1), col = mul3(P.oak, rng.range(0.82, 1.02));
    Gw.at(rng.range(-0.4, 0.4), p[0], 0, p[1]);
    Gw.box(-0.15, 0.15, -0.62, 0.32, -0.15, 0.15, mul3(col, 0.5), TIMBER_UV, false); Gw.box(-0.15, 0.15, 0.32, top, -0.15, 0.15, col, TIMBER_UV);   // wet below, weathered above
    Gw.box(-0.175, 0.175, top - 0.34, top - 0.26, -0.175, 0.175, P.iron);                                                                         // an iron band
    Gw.at(null);
  }
}

// ---- a wisp of chimney smoke on a windless evening: two crossed soft ribbons, thin, rising, leaning a little to the lee.
// It stands still (the part has no clock); normals look up so that the sky lights it as it lights the ground.
function smokePixels(rng) {
  const W = 64, H = 128, px = new Uint8Array(W * H * 4), n = tileNoise(rng);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / (W - 1), v = y / (H - 1), e = 1 - (2 * u - 1) * (2 * u - 1), o = (y * W + x) * 4;
    const a = Math.pow(e, 1.6) * sstep(0, 0.07, v) * Math.pow(1 - v, 1.15) * (0.45 + 0.55 * n(u * 5 + 1, v * 9, 64, 64)) * (0.7 + 0.3 * n(u * 11, v * 22 + 5, 64, 64));
    px[o] = px[o + 1] = px[o + 2] = 255; px[o + 3] = 255 * sat(a * 1.5);
  }
  return px;
}
function addSmoke(G, x, y, z, rng) {
  const k = G.mark(), H = rng.range(7, 10), n = 7, ph = rng() * TAU;
  for (let pl = 0; pl < 2; pl++) {
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = 0.2 + 1.5 * Math.pow(t, 0.8), cx = x + 0.75 * t * t + 0.28 * t * Math.sin(ph + t * 5), cz = z - 1.1 * t * t + 0.28 * t * Math.cos(ph * 1.7 + t * 4), yy = y - 0.1 + H * t;
      const a = G.v(cx - (pl ? w : 0), yy, cz - (pl ? 0 : w), P.white, 0, t), b = G.v(cx + (pl ? w : 0), yy, cz + (pl ? 0 : w), P.white, 1, t);
      if (prev) G.quad(prev[0], prev[1], b, a);
      prev = [a, b];
    }
  }
  for (let v = k[0] * 3; v < G.n.length; v += 3) { G.n[v] = 0; G.n[v + 1] = 1; G.n[v + 2] = 0; }
}

// ---- things seen far off: plain forms coloured at their corners (the atlas's white texel), few triangles
function addFarHouse(G, H, rng) {
  const hl = H.L / 2, hw = H.W / 2, yw = 2.3, yr = yw + hw * 1.15, rl = Math.max(0.6, hl - hw * 0.8), o = 0.5, roof = mul3(P.farRoof, rng.range(0.85, 1.15));
  const e = [[-hl - o, yw - 0.4, hw + o], [hl + o, yw - 0.4, hw + o], [hl + o, yw - 0.4, -hw - o], [-hl - o, yw - 0.4, -hw - o]], a = [-rl, yr, 0], b = [rl, yr, 0];
  G.at(H.yaw, H.x, H.y, H.z);
  G.box(-hl, hl, -1.2, yw, -hw, hw, H.wall, null, false);
  G.poly([e[0], e[1], b, a], roof); G.poly([e[1], e[2], b], roof); G.poly([e[2], e[3], a, b], roof); G.poly([e[3], e[0], a], roof);
  G.at(null);
}
// the lighthouse of the real banded kind: a tapering round tower in red and white bands, a gallery, a glazed lantern
// (its glass is a lit pane of the atlas: it glows steadily by setNight), a dark cap
function addLighthouse(G, x, y, z) {
  const k = G.mark(), n = 14, H = 34, bands = 6, rad = (h) => lerp(3.7, 2.5, h / H);
  const ring = (h, r, col, uv = WHITE_UV) => { const ids = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ids.push(G.v(x + r * Math.cos(a), y + h, z + r * Math.sin(a), col, uv[0], uv[1])); } return ids; };
  const tube = (a, b) => { for (let i = 0; i < n; i++) { const j = (i + 1) % n; G.quad(a[j], a[i], b[i], b[j]); } };
  for (let b = 0; b < bands; b++) { const h0 = b ? (H * b) / bands : -1.5, h1 = (H * (b + 1)) / bands, col = b % 2 ? P.band : P.red; tube(ring(h0, rad(Math.max(0, h0)), col), ring(h1, rad(h1), col)); }
  tube(ring(H, 3.4, P.iron), ring(H + 0.55, 3.4, P.iron)); tube(ring(H + 0.55, 3.4, P.iron), ring(H + 0.55, 1.9, P.iron));
  tube(ring(H + 0.55, 1.95, P.white, GLASS_LIT_UV), ring(H + 3.3, 1.95, P.white, GLASS_LIT_UV));
  const cap = ring(H + 3.3, 2.3, P.iron), top = G.v(x, y + H + 5.3, z, P.iron, WHITE_UV[0], WHITE_UV[1]);
  for (let i = 0; i < n; i++) G.tri(cap[(i + 1) % n], cap[i], top);
  G.shade(k);
  return H + 1.9;                                                    // the lamp's height above the base
}
// a clump of trees on a far mound: two leaning lobes, dark (an outline against the sky, nothing more)
function addFarTrees(G, x, y, z, r, h, rng) {
  for (let lobe = 0; lobe < 2; lobe++) {
    const k = G.mark(), cx = x + (lobe ? rng.range(0.5, 0.9) * r : 0), cz = z + (lobe ? rng.range(-0.6, 0.6) * r : 0), rr = lobe ? r * 0.7 : r, hh = lobe ? h * 0.72 : h, n = 7, rings = [];
    const col = mul3(P.farTree, GAIN * rng.range(0.85, 1.1));
    for (const [t, w] of [[0, 0.8], [0.45, 1.0], [0.8, 0.66]]) { const ring = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, q = rr * w * (0.82 + 0.36 * rng()); ring.push(G.v(cx + q * Math.cos(a) + hh * t * 0.25, y + hh * t - 0.5, cz + q * Math.sin(a) - hh * t * 0.3, col, cx / 7, cz / 7)); } rings.push(ring); }
    const top = G.v(cx + hh * 0.25, y + hh, cz - hh * 0.3, col, cx / 7, cz / 7);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; for (let q = 0; q < 2; q++) G.quad(rings[q][j], rings[q][i], rings[q + 1][i], rings[q + 1][j]); G.tri(rings[2][j], rings[2][i], top); }
    G.shade(k);
  }
}
// are two houses clear of one another? (plans as rectangles { x, z, yaw, hl, hw }; separating axes, with a gap)
function plansClear(a, b, gap) {
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const h of [a, b]) for (let ax = 0; ax < 2; ax++) {
    const nx = ax ? Math.sin(h.yaw) : Math.cos(h.yaw), nz = ax ? Math.cos(h.yaw) : -Math.sin(h.yaw);
    const ext = (q) => Math.abs(nx * Math.cos(q.yaw) - nz * Math.sin(q.yaw)) * q.hl + Math.abs(nx * Math.sin(q.yaw) + nz * Math.cos(q.yaw)) * q.hw;
    if (Math.abs(dx * nx + dz * nz) > ext(a) + ext(b) + gap) return true;
  }
  return false;
}

// the second, smaller mound of the near island and the far places, as the design gives them
const MOUND_B = { z: -650, off: -235, Rt: 19, Rb: 30, T: 4.1 };
const SECOND = { z: -960, off: -620, alongZ: 520, across: 260 };
const FAR = [{ x: -700, z: -2300, ax: 430, az: 150 }, { x: 900, z: -2100, ax: 380, az: 170, lighthouse: true }, { x: 900, z: -300, ax: 170, az: 420 }];

export async function buildIslands(ctx, opts = {}) {
  const core = ctx.core, mk = (name) => core.makeRng(core.hashSeed('islands:' + name + ':' + ctx.seed));
  const noise = core.makeNoise(core.hashSeed('islands:noise:' + ctx.seed)), path = opts.path || null;
  const dens = (ctx.vary && ctx.vary.density) || 1, detail = (ctx.quality && ctx.quality.detail) || 1;
  const caps = ctx.renderer && ctx.renderer.capabilities, aniso = Math.min(8, (caps && caps.getMaxAnisotropy && caps.getMaxAnisotropy()) || 1);
  const object = new THREE.Group(); object.name = 'marsh-islands';
  const pause = () => ctx.yield();

  // ---- textures and materials (all made here; setNight only moves two numbers)
  const tStone = dataTex(stonePixels(mk('tex-stone')), 256, 256, { aniso }); await pause();
  const turfGen = marshPixels(mk('tex-marsh')); let turfStep = turfGen.next();
  while (!turfStep.done) { await pause(); turfStep = turfGen.next(); }
  const turf = turfStep.value; await pause();
  const tMarsh = dataTex(turf, 512, 512, { aniso }); tMarsh.repeat.set(7 / TURF_TILE, 7 / TURF_TILE); await pause();   // the corners carry u = x / 7
  const tThatch = dataTex(thatchPixels(mk('tex-thatch')), 256, 256, { aniso }); await pause();
  const tWall = dataTex(wallPixels(mk('tex-wall')), 512, 512, { aniso: Math.min(4, aniso), clampT: true }); await pause();
  const tGlow = dataTex(glowPixels(), 256, 256, { clampT: true });
  const mGround = new THREE.MeshStandardMaterial({ map: tMarsh, bumpMap: tMarsh, bumpScale: 1.1, vertexColors: true, roughness: 0.96, metalness: 0 });
  mGround.color.setScalar(1 / (GAIN * turf.mean));                                // the corner colours carry GAIN; the turf's own mean is made up here
  const mStone = new THREE.MeshStandardMaterial({ map: tStone, bumpMap: tStone, bumpScale: 3, vertexColors: true, roughness: 0.8, metalness: 0 });
  const mThatch = new THREE.MeshStandardMaterial({ map: tThatch, bumpMap: tThatch, bumpScale: 1.6, vertexColors: true, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const mWall = new THREE.MeshStandardMaterial({ map: tWall, emissiveMap: tGlow, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const mPond = new THREE.MeshStandardMaterial({ color: '#6d858e', roughness: 0.16, metalness: 0 });
  const tSmoke = dataTex(smokePixels(mk('tex-smoke')), 64, 128, { clamp: true });
  const mSmoke = new THREE.MeshStandardMaterial({ map: tSmoke, color: '#cfd3d8', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, roughness: 1, metalness: 0 });

  // ---- the near island: its two mounds, its creeks (each runs in from the east shore and stops short of a mound)
  const wf = HALLIG.warft, wA = beside(wf.z, wf.off), wB = beside(MOUND_B.z, MOUND_B.off);
  const MA = { x: wA[0], z: wA[1], Rt: wf.radius - 12, Rb: wf.radius, T: wf.height, pond: true };
  const MB = { x: wB[0], z: wB[1], Rt: MOUND_B.Rt, Rb: MOUND_B.Rb, T: MOUND_B.T, pond: false };
  const cz = (HALLIG.z0 + HALLIG.z1) / 2, co = (HALLIG.shoreOff + WEST) / 2, crng = mk('creeks');
  const creeks = [[HALLIG.z0 - 48, 34], [wf.z - 67, 60], [HALLIG.z1 + 44, 95]].map(([mz0, most]) => {   // the first is short: the footpath walks round its head
    const mz = mz0 + crng.range(-3, 3), l = Math.hypot(cz - mz, co - HALLIG.shoreOff), dz = (cz - mz) / l, dO = (co - HALLIG.shoreOff) / l;
    const c = { mz, dz, dO, len: most, w0: crng.range(2.3, 2.9), w1: crng.range(0.7, 1.0), amp: crng.range(1.0, 1.7), lam: crng.range(6, 9), ph: crng() * TAU };
    for (let rho = 10; rho <= most; rho += 2) { const w = beside(mz + dz * rho, HALLIG.shoreOff + dO * rho); if ([MA, MB].some((M) => Math.hypot(w[0] - M.x, w[1] - M.z) < M.Rb + 9.5)) { c.len = rho; break; } }
    return c;
  });
  const F = nearField(noise, creeks), Gs = new Geo(), Gm = new Geo(), Gw = new Geo(), Gt = new Geo();
  buildNearGround(Gs, Gm, F, creeks, noise); await pause();
  const marshAt = (x, z) => { const q = toLine(x, z), g = F.at(q[0], q[1], x, z); return F.colour(x, z, g.d, g.mud); };
  addMound(Gm, MA, noise, marshAt, 56); addMound(Gm, MB, noise, marshAt, 40); await pause();
  const groundY = (x, z) => { const q = toLine(x, z); let y = F.at(q[0], q[1], x, z).y; for (const M of [MA, MB]) y = Math.max(y, moundY(M, x, z, noise)); return y; };

  // ---- the houses of a mound: places round its middle in a frame turned to the line (angle 0 looks at the line)
  const eA = (() => { const a = beside(wf.z, wf.off), b = beside(wf.z, wf.off + 1); return [b[0] - a[0], b[1] - a[1]]; })();
  const polar = (M, deg, r) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [M.x + r * (c * eA[0] - s * eA[1]), M.z + r * (c * eA[1] + s * eA[0])]; };
  const faceYaw = (deg) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return Math.atan2(c * eA[0] - s * eA[1], c * eA[1] + s * eA[0]); };
  const settle = (M, specs, rng, lod) => {   // [place deg, radius, facing deg, length, width, brick, door place]
    const done = [];
    for (const sp of specs) {
      const deg = sp[0] + rng.range(-4, 4), r = sp[1] + rng.range(-0.6, 0.6), face = sp[2] + rng.range(-8, 8), L0 = sp[3] + rng.range(-0.8, 0.8), W = sp[4] + rng.range(-0.2, 0.3), p = polar(M, deg, r);
      const h = { x: p[0], y: M.T - 0.12, z: p[1], yaw: faceYaw(face), L: L0, W, hl: L0 / 2 + 0.7, hw: W / 2 + 1.0, brick: sp[5], bay: sp[6], lod, lit: 0.42 };
      for (let k = 0; k < 16 && done.some((o) => !plansClear(h, o, 1.2)); k++) { h.L -= 0.5; h.hl -= 0.25; }
      done.push(h);
    }
    return done;
  };
  const hrng = mk('houses'), brng = mk('build');
  const housesA = settle(MA, [[5, 20, 5, 17.5, 8.4, false, 1], [78, 20, -25, 15, 7.6, true, 2], [150, 20.5, 330, 18.5, 8.6, false, 3], [222, 20, 110, 16, 7.8, true, 1], [293, 19.5, 30, 16.5, 8.0, false, 2]], hrng, 0);
  const housesB = settle(MB, [[20, 11.5, 20, 14, 7.6, false, 1], [140, 12, 320, 13.5, 7.4, true, 2], [262, 11.5, 262, 14.5, 7.6, false, 1]], hrng, 0);
  for (const h of housesA.concat(housesB)) addHouse(Gw, Gt, h, brng, noise);
  const Gk = new Geo(), krng = mk('smoke');
  for (const h of [housesA[0], housesA[2], housesB[0]]) addSmoke(Gk, h.tops[0][0], h.tops[0][1], h.tops[0][2], krng);
  await pause();
  // a red-tiled outbuilding behind some houses: the first clear place of four tried (the dice are thrown before the tests)
  const srng = mk('sheds'), sheds = [];
  const shedFor = (M, all, h) => {
    const tries = [];
    for (let k = 0; k < 4; k++) tries.push({ lx: (k & 1 ? 1 : -1) * h.L * srng.range(0.18, 0.3), turn: srng() < 0.35, L: srng.range(4.8, 5.8), W: srng.range(3.5, 4.0) });
    for (const t of tries) {
      const lz = -(h.W / 2 + 1.5 + (t.turn ? t.L : t.W) / 2), c = Math.cos(h.yaw), s = Math.sin(h.yaw), yaw = h.yaw + (t.turn ? Math.PI / 2 : 0);
      const b = { x: h.x + c * t.lx + s * lz, y: M.T - 0.15, z: h.z - s * t.lx + c * lz, yaw, L: t.L, W: t.W, hl: t.L / 2 + 0.4, hw: t.W / 2 + 0.4, brick: h.brick };
      if (Math.hypot(b.x - M.x, b.z - M.z) + Math.hypot(b.hl, b.hw) > M.Rt - 0.5 || Math.hypot(b.x - M.x, b.z - M.z) < 11.5) continue;
      if (all.concat(sheds).some((o) => o !== h && !plansClear(b, o, 0.9))) continue;
      sheds.push(b); addShed(Gw, b, brng); return;
    }
  };
  shedFor(MA, housesA, housesA[1]); shedFor(MA, housesA, housesA[3]); shedFor(MA, housesA, housesA[4]); shedFor(MB, housesB, housesB[1]);
  // the pole fences: round each mound's top with a gate gap; from the big mound's gate a run goes down toward the shore
  const frng = mk('fence'), post = (M, deg, r, h) => { const p = polar(M, deg, r); return [p[0], groundY(p[0], p[1]), p[1], h]; };
  const ringFence = (M, gate, tail) => {
    const r = M.Rt + 0.9, n = Math.round((TAU * r) / 2.6), pts = [];
    for (let i = 0; i < n; i++) pts.push(post(M, gate + 2.6 + (i * 354.8) / (n - 1), r, i === 0 || i === n - 1 ? 1.6 : 1.25));
    addFence(Gw, pts.concat(tail), frng);
  };
  const GATE = 28, run = [];                                                      // the gate looks east-south-east, at the way over the marsh
  for (let r = MA.Rt + 3.5, k = 0; k < 24; r += 2.6, k++) {                       // the run goes down from the gate's north post
    const p = polar(MA, GATE - 2.6, r), q = toLine(p[0], p[1]), g = F.at(q[0], q[1], p[0], p[1]);
    if (g.d < 9.5 || g.cut > 0 || g.mud > 0.3) break;
    run.push([p[0], groundY(p[0], p[1]), p[1], 1.25]);
  }
  ringFence(MA, GATE, run); ringFence(MB, 200, []);
  {   // the garden gate: a white paled leaf on the north post, a hand's breadth open
    const a = polar(MA, GATE - 2.6, MA.Rt + 0.9), b = polar(MA, GATE + 2.6, MA.Rt + 0.9), c = polar(MA, GATE, MA.Rt + 0.9), l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, ox = (c[0] - MA.x) / (MA.Rt + 0.9), oz = (c[1] - MA.z) / (MA.Rt + 0.9), co = Math.cos(0.24), si = Math.sin(0.24);
    addGate(Gw, a[0] + tx * 0.15, groundY(c[0], c[1]), a[1] + tz * 0.15, tx * co + ox * si, tz * co + oz * si, l - 0.3);
    for (const q of [a, b]) { Gw.at(Math.atan2(-tz, tx), q[0], groundY(q[0], q[1]), q[1]); Gw.box(-0.11, 0.11, -0.3, 1.74, -0.11, 0.11, mul3(P.lime, 0.96)); Gw.box(-0.14, 0.14, 1.74, 1.83, -0.14, 0.14, mul3(P.lime, 0.96)); Gw.at(null); }   // its two white posts
  }
  // the landing: stone steps and two mooring posts on the south-east corner's arc, where the way first crosses the shore
  const arcC = [F.cz + F.hz - 40, F.co + F.ho - 40], sinL = Math.sin(0.5236), cosL = Math.cos(0.5236);
  const landAt = (d, s) => beside(arcC[0] + (40 - d) * sinL - s * cosL, arcC[1] + (40 - d) * cosL + s * sinL);
  addLanding(Gs, Gw, landAt, mk('landing'));
  // the worn footpath: from the landing round the head of the first creek, over the marsh and up the mound to the gate
  const c1 = creeks[0], byCreek = (rho, lat) => beside(c1.mz + c1.dz * rho - c1.dO * lat, HALLIG.shoreOff + c1.dO * rho + c1.dz * lat);
  const groundCol = (x, z) => { const q = toLine(x, z), g = F.at(q[0], q[1], x, z), y = g.y, d = g.d, mud = g.mud; return moundY(MA, x, z, noise) > y ? moundColour(MA, x, z, noise, marshAt) : F.colour(x, z, d, mud); };
  const pathLift = (x, z) => 0.05 + 0.07 * (1 - sstep(MA.Rb + 1, MA.Rb + 8, Math.hypot(x - MA.x, z - MA.z)));
  const pathPts = addPath(Gm, [landAt(3.6, 0), landAt(12, 0.5), byCreek(c1.len * 0.55, 13), byCreek(c1.len + 14, 0), polar(MA, GATE + 16, MA.Rb + 4), polar(MA, GATE, MA.Rt + 0.9), polar(MA, GATE, MA.Rt - 2)], groundY, groundCol, pathLift, noise);
  const pathNear = (x, z) => { let m = 1e9; for (const p of pathPts) { const dx = x - p[0], dz = z - p[1], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  await pause();
  // the pond of the big mound: still water in its hollow
  const Gp = new Geo(), pondPts = [];
  for (let i = 0; i < 28; i++) { const a = -(i / 28) * TAU; pondPts.push([MA.x + 7.6 * Math.cos(a), MA.T - 0.5, MA.z + 5.6 * Math.sin(a)]); }
  Gp.poly(pondPts, P.white);

  // ---- wind-leaned trees (the kit's broadleaf, sheared to the lee of the south-west wind; a windless day: they stand still)
  const wind = flora.makeWind({ strength: 0, gustiness: 0 }), leafOpts = { wind };
  await flora.prepareLeafTexture(leafOpts, ctx.yield);
  const mLeaf = flora.windMaterial({ wind, ambient: 1.25, leafAmbient: 1.05, backlight: 0.55, backlightTint: '#c4d07c' }), trng = mk('trees'), treeGeos = [], LEE = [0.55, -0.83];
  const tree = (x, y, z, h, lod) => {
    const g = flora.oakGeometry({ rng: trng, height: h, detail: lod, fullness: 0.95, leaf: '#3f5c31', leafLight: '#71894a', leafDark: '#263d27' });
    const p = g.attributes.position, nr = g.attributes.normal, lean = trng.range(0.3, 0.5) * h, yaw = trng() * TAU, c = Math.cos(yaw), s = Math.sin(yaw);
    for (let i = 0; i < p.count; i++) {   // turned, leaned to the lee, the crown drawn out downwind and cut short upwind (a flagged tree)
      const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), t = Math.pow(sat(Y / h), 1.5) * lean, nx = nr.getX(i), nz = nr.getZ(i), hx = c * X + s * Z, hz = -s * X + c * Z;
      const al = hx * LEE[0] + hz * LEE[1], k = sstep(0.25 * h, 0.6 * h, Y), add = (al > 0 ? 0.55 : -0.4) * al * k;
      p.setXYZ(i, x + hx + LEE[0] * (t + add), y + Y - 0.22 * t * sat(Y / h) - 0.16 * Math.max(0, al) * k, z + hz + LEE[1] * (t + add)); nr.setXYZ(i, c * nx + s * nz, nr.getY(i), -s * nx + c * nz);
    }
    treeGeos.push(g);
  };
  const plant = (M, all, spots, most, h0, h1) => {
    let n = 0;
    for (const sp of spots) {
      const deg = sp[0] + trng.range(-6, 6), r = sp[1] + trng.range(-1, 1), h = trng.range(h0, h1), p = polar(M, deg, r), me = { x: p[0], z: p[1], yaw: 0, hl: 1, hw: 1 };
      if (n >= most || all.concat(sheds).some((o) => !plansClear(me, o, 1.5))) continue;
      tree(p[0], groundY(p[0], p[1]) - 0.15, p[1], h, 1); n++;
    }
  };
  plant(MA, housesA, [[44, 25], [330, 25.5], [112, 25.5], [190, 26], [258, 25.5], [-14, 12]], 4, 6.5, 9.5);
  plant(MB, housesB, [[80, 16], [200, 16.5], [320, 16]], 2, 6, 8);
  await pause();

  // ---- far things. Their windows are points (pts) on the walls that face the line; lamp() adds one
  const pts = [], pcol = [], lrng = mk('far');
  const lamp = (x, y, z, k, c = [1, 0.66, 0.3]) => { pts.push(x, y, z); pcol.push(c[0] * k, c[1] * k, c[2] * k); };
  const toLineFrom = (x, z) => [lineX(z) - x, 0];                                // toward the railway line (the law's lineX), square across it
  const lampOn = (h, k) => {
    const t = toLineFrom(h.x, h.z), c = Math.cos(h.yaw), s = Math.sin(h.yaw), side = t[0] * s + t[1] * c > 0 ? 1 : -1, lx = lrng.range(-0.7, 0.7) * (h.L / 2 - 1), lz = side * (h.W / 2 + 0.4);
    lamp(h.x + c * lx + s * lz, h.y + 1.35, h.z - s * lx + c * lz, k);
  };
  // the second island, far west: two mounds with houses
  const sw = beside(SECOND.z, SECOND.off), I2 = { x: sw[0], z: sw[1], ax: SECOND.across / 2, az: SECOND.alongZ / 2, top: 0.95, n: 52 }, col2 = mix3(P.olive, P.seaGreen, 0.4);
  addFarIsland(Gm, I2, noise, col2, mul3(P.stone, 0.75));
  for (const [ox, oz, three] of [[18, -105, true], [-22, 100, dens > 0.85]]) {
    const M = { x: I2.x + ox, z: I2.z + oz, Rt: 21, Rb: 35, T: 4.9, pond: false };
    addMound(Gm, M, noise, () => col2, 28);
    const specs = [[15, 12.5, 15, 15, 7.8, false, -1], [130, 12.5, 130, 14, 7.5, true, -1]]; if (three) specs.push([250, 12.5, 250, 15.5, 7.8, false, -1]);
    for (const h of settle(M, specs, lrng, 1)) { addHouse(Gw, Gt, h, lrng, noise); const lit = lrng() < 0.7, k = lrng.range(1.0, 1.5); if (lit) lampOn(h, k); }
    const tp = polar(M, 70 + lrng.range(-10, 10), 15.5); tree(tp[0], M.T - 0.3, tp[1], lrng.range(6.5, 8.5), 0);
  }
  await pause();
  // the three far islands: low dark strips with mound and roof outlines; the second carries the lighthouse
  for (const I of FAR) {
    const long = I.ax > I.az, nM = I.lighthouse ? 3 : Math.max(2, Math.min(3, Math.round(2.4 * dens))), fr = nM === 3 ? [-0.45, 0.05, 0.5] : [-0.35, 0.4];
    addFarIsland(Gm, { x: I.x, z: I.z, ax: I.ax, az: I.az, top: 2.4, n: 26 }, noise, P.farLand, P.farStone);
    for (let m = 0; m < nM; m++) {
      const f = fr[m] + lrng.range(-0.06, 0.06), g = lrng.range(-0.2, 0.2), mx = I.x + (long ? f : g) * I.ax, mz = I.z + (long ? g : f) * I.az, t = toLineFrom(mx, mz), tl = Math.hypot(t[0], t[1]) || 1;
      const M = { x: mx, z: mz, Rt: 22, Rb: 40, T: 6.4, pond: false, far: true }, ux = t[0] / tl, uz = t[1] / tl, nH = Math.max(2, Math.min(4, Math.round(3 * dens)));
      addMound(Gm, M, noise, null, 14);
      const house = (x, z, yaw, L, W) => { const h = { x, y: M.T - 0.2, z, yaw, L, W, wall: mul3(P.farWall, lrng.range(0.8, 1.1)) }, lit = lrng() < 0.5, k = lrng.range(1.0, 1.5); addFarHouse(Gw, h, lrng); if (lit) lampOn(h, k); };
      if (I.lighthouse && m === 1) {   // the tower between two low houses, set square to the direction of the railway line
        const hh = addLighthouse(Gw, mx, M.T - 0.3, mz), yaw = Math.atan2(ux, uz);
        house(mx - uz * 17, mz + ux * 17, yaw, 17, 9); house(mx + uz * 17, mz - ux * 17, yaw, 17, 9);
        for (let q = 0; q < 2; q++) lamp(mx + ux * 2.7, M.T - 0.3 + hh, mz + uz * 2.7, 2.2, [1, 0.88, 0.62]);
      } else {
        for (let i = 0; i < nH; i++) { const a = ((i + lrng.range(0.1, 0.9)) / nH) * TAU, r = lrng.range(9.5, 12.5); house(mx + r * Math.cos(a), mz + r * Math.sin(a), a + lrng.range(-0.5, 0.5), lrng.range(19, 25), lrng.range(9, 10.5)); }
        const a = lrng() * TAU; addFarTrees(Gm, mx + 17 * Math.cos(a), M.T, mz + 17 * Math.sin(a), lrng.range(5, 7), lrng.range(7.5, 9.5), lrng);
      }
    }
  }
  await pause();
  // ---- THE SWARD: the kit's tufts, small and close-set, taking the ground's own colour. They crowd under the way of
  // the lens over the marsh (the law file's ROUTE: a place, the same on every seed) and thin out away from it.
  const lane = ROUTE.filter((p) => p[2] < -380 && p[2] > -700);
  const wayDist = (x, z) => { let m = 1e9; for (let i = 0; i + 1 < lane.length; i++) { const a = lane[i], b = lane[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], t = sat(((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz)); m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t)); } return m; };
  const wayX = (z) => { for (let i = 0; i + 1 < lane.length; i++) { const a = lane[i], b = lane[i + 1]; if (z <= a[2] && z >= b[2]) return a[0] + ((b[0] - a[0]) * (a[2] - z)) / (a[2] - b[2]); } return lane[0][0]; };
  const turfAt = (x, z) => {   // 0 where no tuft may stand (stone, creek, yard, footpath), 1 on the marsh, less on the mound's flank
    const q = toLine(x, z); if (q[1] < -104 || q[1] > -25) return 0;
    const g = F.at(q[0], q[1], x, z), rA = Math.hypot(x - MA.x, z - MA.z);
    if (g.d < SHORE.fringe + 0.5 || g.cut > 0.01 || rA < MA.Rt + 1.5 || pathNear(x, z) < 0.66) return 0;
    return rA < MA.Rb ? 0.55 : 1;
  };
  const cs = [beside(HALLIG.z0 - 4, -24), beside(HALLIG.z0 - 4, -82), beside(-702, -24), beside(-702, -82)];
  const bounds = [Math.min(...cs.map((c) => c[0])) - 1, Math.min(...cs.map((c) => c[1])) - 1, Math.max(...cs.map((c) => c[0])) + 1, Math.max(...cs.map((c) => c[1])) + 1];
  // a carpet of about `target` tufts: the kit throws three tries a tuft, so the count is set from the share of the
  // bounds that the density takes (measured here on a seeded sample)
  // the tufts take what the part's budget leaves (4 triangles a tuft, 14 in bloom): everything else is built by now
  const others = Gm.triangles + Gs.triangles + Gt.triangles + Gw.triangles + Gp.triangles + Gk.triangles + treeGeos.reduce((n, g) => n + g.index.count / 3, 0);
  const sowRng = mk('sow'), few = Math.min(1, detail), room = Math.max(8000, 65500 - others), blooms = Math.min(600, Math.floor((room * 0.26) / 14));
  const sow = async (name, target, samples, density, more) => {
    let acc = 0;
    for (let i = 0; i < samples; i++) { acc += sat(density(lerp(bounds[0], bounds[2], sowRng()), lerp(bounds[1], bounds[3], sowRng()))); if (i % 1500 === 1499) await pause(); }
    acc = Math.max(acc / samples, 0.004);
    return flora.makeGrassAsync(Object.assign({ rng: mk(name), count: Math.max(8, Math.round(acc < 1 / 3 ? target / (3 * acc) : target)), bounds, heightAt: groundY, heightStep: 1, wind, density, fade: [95, 135] }, more), ctx.yield);
  };
  const sward = await sow('grass', Math.min(6400, (room - blooms * 14) / 4) * few, 6000, (x, z) => turfAt(x, z) * lerp(1, 0.07, sstep(5, 22, wayDist(x, z))), {
    map: mLeaf.map, flowers: 0, tint: 0.14, width: [0.42, 0.8], height: [0.2, 0.42], root: '#5c6b3c', tip: '#7f9150', rootGain: 1.35, materialOptions: { backlight: 0.25, sheen: 0 },
    // at a creek's muddy edge the tufts are glasswort: fleshy, red and green
    groundColor: (x, z) => { const q = toLine(x, z), mud = F.at(q[0], q[1], x, z).mud, c = groundCol(x, z); return mud > 0.3 ? mix3(c, noise.n2(x / 2.3, z / 2.3) > 0 ? P.glassRed : P.glassGreen, 0.75) : c; },
  });
  await pause();
  // sea lavender and thrift in flower (the kit's blooming tufts), in round drifts beside the way, most of them on the mound's side
  const driftsOf = (name, n, z0, z1, r0, r1, lat0, lat1) => { const r = mk(name), out = []; for (let i = 0; i < n; i++) { const z = lerp(z0, z1, (i + r.range(0.15, 0.85)) / n), side = r() < 0.72 ? -1 : 1; out.push([wayX(z) + side * r.range(lat0, lat1), z, r.range(r0, r1)]); } return out; };
  const inDrift = (D, x, z) => { let m = 0; for (const d of D) { const k = 1 - sstep(0.3 * d[2], d[2], Math.hypot(x - d[0], (z - d[1]) * 0.7)); if (k > m) m = k; } return m * sstep(-0.4, 0.15, noise.n2(x / 2.6 + 7, z / 2.6)); };   // ragged, drawn out along the way
  const lavD = driftsOf('lavender', 9, -458, -596, 3.8, 6.8, 3, 16), thrD = driftsOf('thrift', 9, -454, -600, 2.8, 5, 2, 14);
  const bloom = (cols, w, h) => ({ material: sward.material, flowers: 1, flowerColors: cols, width: w, height: h, root: '#4f6238', tip: '#74884c', tint: 0.1, dryAmount: 0 });
  const lavender = await sow('lavender', blooms * 0.63 * few, 12000, (x, z) => turfAt(x, z) * inDrift(lavD, x, z), bloom(['#a58bd6', '#b79be0', '#9a80c8'], [0.45, 0.8], [0.3, 0.48]));
  const thrift = await sow('thrift', blooms * 0.37 * few, 12000, (x, z) => turfAt(x, z) * inDrift(thrD, x, z), bloom(['#e88fb4', '#f2a6c4', '#dd7aa3'], [0.32, 0.55], [0.17, 0.27]));
  const grasses = [sward, lavender, thrift];
  await pause();
  // ---- the meshes (one per material; everything stands above the water somewhere, so all of it is mirrored)
  const gPts = new THREE.BufferGeometry();
  gPts.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); gPts.setAttribute('color', new THREE.Float32BufferAttribute(pcol, 3)); gPts.computeBoundingSphere();
  // far windows: points of one angular size at any picture size (never under 1.6 px), dimmed by the air, never tinted by it
  const mPts = new THREE.PointsMaterial({ size: 0.0042, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  mPts.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <fog_vertex>', 'gl_PointSize = max( size * scale, 1.6 );\n#include <fog_vertex>');
    sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', '#ifdef USE_FOG\n#ifdef FOG_EXP2\nfloat airK = exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n#else\nfloat airK = 1.0 - smoothstep( fogNear, fogFar, vFogDepth );\n#endif\ngl_FragColor.rgb *= airK;\n#endif');
  };
  mPts.customProgramCacheKey = () => 'railway-islands-far-lights-1';
  const gTrees = mergeGeometries(treeGeos, false); for (const g of treeGeos) g.dispose();
  const geos = [Gm.build(), Gs.build(), Gt.build(), Gw.build(), Gp.build(), gTrees, Gk.build(), gPts], mats = [mGround, mStone, mThatch, mWall, mPond, mLeaf, mSmoke, mPts];
  const names = ['ground', 'stone-shore', 'thatch', 'walls', 'pond', 'trees', 'smoke', 'far-lights'];
  for (let i = 0; i < geos.length; i++) { const o = i === 7 ? new THREE.Points(geos[i], mats[i]) : new THREE.Mesh(geos[i], mats[i]); o.name = 'islands-' + names[i]; object.add(o); }
  ['sward', 'sea-lavender', 'thrift'].forEach((nm, i) => { grasses[i].object.name = 'islands-' + nm; object.add(grasses[i].object); });
  object.userData.triangles = Gm.triangles + Gs.triangles + Gt.triangles + Gw.triangles + Gp.triangles + gTrees.index.count / 3 + sward.triangles + lavender.triangles + thrift.triangles;

  // the night value: the lit windows' glow and the far points; two numbers, nothing else
  let night = -1;
  const setNight = (n) => { n = sat(n || 0); if (n === night) return; night = n; mWall.emissiveIntensity = 2.6 * n; mPts.opacity = n; };
  setNight(0);
  const dispose = () => {
    for (const g of geos) g.dispose();
    for (const gr of grasses) for (const m of gr.meshes) { m.geometry.dispose(); if (m.dispose) m.dispose(); }
    if (sward.material !== mLeaf) sward.material.dispose();
    if (mLeaf.map) mLeaf.map.dispose();
    for (const m of mats) m.dispose();
    for (const t of [tStone, tMarsh, tThatch, tWall, tGlow, tSmoke]) t.dispose();
  };
  return { object, setNight, dispose };
}
